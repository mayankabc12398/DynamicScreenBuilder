/**
 * NursingFormRender — a published nursing form for one patient.
 *
 *   import NursingFormRender from "@app/components/dynamicNursingFormbuilder/render/NursingFormRender";
 *   const v = await nfVersion(formId);                  // latest published
 *   <NursingFormRender form={v.data.snapshot} data={patientRow} />
 *
 * `form`  { id, name, filePath | fileKey, fileType, draftJson, versionNo | publishedVersion } — a version
 *         snapshot or a builder draft (preview)
 * `data`  one IPDDetail/PatientSearch row; fields bind by its keys
 * `mode`  "fill" (inputs + signatures live, entry saved per admission) | "view"
 * `persist` false keeps entries in memory only (the builder's preview)
 *
 * The admission is found in the row by key name (TransactionID, IPDNo, PatientID…),
 * whatever casing the API answers with.
 *
 * Draw (fill mode): the nurse marks this patient's copy — a wound on a body
 * diagram, a circled finding. The marks are saved with the entry under the
 * reserved valuesJson key "$drawings" and print above the fields; the form's own
 * template drawings print underneath.
 *
 * `drawOnly` keeps the draw ribbon open (the nurse fills the form by drawing and
 * double-click text); fill-in fields and signatures stay clickable above it.
 * `autoSave` saves the entry a moment after each change. `onDirty(bool)` reports
 * unsaved changes, so a host can ask before leaving the form.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { createPortal } from "react-dom";
import { PX_PER_MM, fieldsOnPage, missingFields, parseLayout, resolveField, humanize } from "../model/form";
import { nfDocUrl, nfEntry, nfForgetDoc, nfFormEntries, nfLogPrint, nfSaveEntry, nfSaveEntryPdf } from "../../../networkServices/nursingFormBuilderApi";
import { useNfFileUrl } from "../lib/fileUrl";
import { defaultZoom } from "../lib/defaultZoom";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { notify } from "../../../utils/utils";
import { useDispatch } from "react-redux";
import { setLoading } from "../../../store/reducers/loadingSlice/loadingSlice";
import FieldView from "./FieldView";

/**
 * Fields on the patient page, memoised: typing in one fill-in field or drawing a
 * stroke no longer re-renders every field of every page. The handlers are left out
 * of the comparison — here they only call stable setters with the field's own id.
 */
const LiveField = React.memo(FieldView, (a, b) => {
  for (const k of Object.keys({ ...a, ...b })) if (typeof a[k] !== "function" && a[k] !== b[k]) return false;
  return true;
});
import PageBackground from "./PageBackground";
import SignaturePad from "./SignaturePad";
import { formPdf, formsPdf, printForm } from "./printForm";
import { useFieldCss } from "./fieldCss";
import DrawLayer from "../draw/DrawLayer";
import DrawSurface from "../draw/DrawSurface";
import DrawToolbar from "../draw/DrawToolbar";
import { imageMark, isImageFile, pageInView } from "../draw/image";
import useDrawTool, { DRAW_DEFAULTS } from "../draw/useDrawTool";
import { toolForMode, useUserPrefs } from "../lib/useInputMode";
import useFullScreen from "../lib/useFullScreen";
import useDictation, { DICTATE_LANGS } from "../lib/useDictation";
import useLayoutHistory from "../designer/useLayoutHistory";
import Tap from "../ui/Tap";
import Icon from "../ui/Icon";
import { Chip } from "../ui/kit";
import "../styles/nfb.css";
import { isContextKey, useNfContext, withContext } from "../model/context";

const findKey = (row, re) => Object.keys(row || {}).find((k) => re.test(k));
export const patientIds = (row) => {
  const v = (re) => {
    const k = findKey(row, re);
    return k ? String(row[k] ?? "") : "";
  };
  return {
    transactionId: v(/^(transaction_?id|tid)$/i),
    ipdNo: v(/^ipd_?no$/i),
    patientId: v(/^(patient_?id|uhid|mr_?no)$/i),
    patientName: v(/^(p_?name|patient_?name)$/i),
  };
};

export function useSessionCtx() {
  const u = useLocalStorage("userData", "get") || {};
  const c = useNfContext();
  return {
    user: c["user.EmployeeName"] || u.empName || u.employeeName || u.userName || "",
    centre: c["centre.CentreName"] || u.centreName || u.organizationName || "",
  };
}

export default function NursingFormRender({ form, data: row, mode = "fill", persist = true, labels: labelsProp, onClose, compact = false, drawOnly = false, autoSave = false, onSaved, onDirty, ribbon = "top", foldTools = 0, fullScreen = null }) {
  useFieldCss();
  const layout = useMemo(() => parseLayout(form?.draftJson ?? form?.layout), [form]);
  const { url: fileUrl } = useNfFileUrl(form);
  const versionNo = form?.versionNo || form?.publishedVersion || 0;
  // patient row + login user / centre keys (user.X, centre.X)
  const nfCtx = useNfContext();
  const data = useMemo(() => withContext(row, nfCtx), [row, nfCtx]);
  const ids = useMemo(() => patientIds(data), [data]);
  const ctx = useSessionCtx();
  const pages = layout.pages.length ? layout.pages : [{ w: 210, h: 297 }];
  const labels = labelsProp || layout.labels || {};

  const [zoom, setZoom] = useState(defaultZoom);
  // Fit width (default): the page follows the space it has — panels folding, full screen,
  // window size. A manual zoom (buttons, magnifier, pinch) leaves fit; the fit button returns.
  const [fit, setFit] = useState(true);
  const manualZoom = useCallback((z) => {
    setFit(false);
    setZoom(z);
  }, []);
  const [values, setValues] = useState({});
  const [sigs, setSigs] = useState({});
  const [entry, setEntry] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [signing, setSigning] = useState(null);
  // { url } when the PDF is ready but the browser blocked the late tab
  const [pdfWait, setPdfWait] = useState(null);
  const pdfBusyRef = useRef(false);
  const dispatch = useDispatch();
  /**
   * Makes the PDF under the app's full-screen loader (redux setLoading), then opens it in a new tab — no blank tab
   * while it is made. A tab opened that late may be blocked: then an Open button (a fresh click).
   */
  const openPdf = async (_text, make) => {
    if (pdfBusyRef.current) return;
    pdfBusyRef.current = true;
    dispatch(setLoading(true));
    let url = "";
    try {
      // let the loader paint before the PDF work takes the main thread
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
      url = await make();
    } catch (ex) {
      notify(ex?.message || "The PDF could not be opened.", "warn");
    } finally {
      dispatch(setLoading(false));
      pdfBusyRef.current = false;
    }
    if (url && !window.open(url, "_blank")) setPdfWait({ url });
  };
  const openSaved = (path) =>
    openPdf("Opening PDF…", () => {
      nfForgetDoc(path);
      return nfDocUrl(path);
    });
  // print mode comes from the form design (Full / Data only set in the builder)
  const printMode = layout.printMode || "full";
  const [showMissing, setShowMissing] = useState(true);
  const marks = useLayoutHistory([]);
  const [drawOn, setDrawOn] = useState(false);
  const [drawSel, setDrawSel] = useState(null);
  const [drawEditing, setDrawEditing] = useState(null); // the text being typed (DrawSurface)
  const [ts, setTs] = useDrawTool();
  // every form opens with the everyday pen: pencil, 0.4 mm, black (the finger / stylus choice stays) —
  // or, for a user whose default is Type, with the select tool: double-tap types, nothing scratches.
  // The user's saved default may arrive from the server just after opening: it applies then too.
  const [prefs, setPrefs] = useUserPrefs();
  const inputMode = prefs.inputMode;
  useEffect(() => {
    setTs({ ...DRAW_DEFAULTS, ...toolForMode(inputMode) });
  }, [inputMode]); // eslint-disable-line react-hooks/exhaustive-deps
  // the user's text and ✔ / ✘ font sizes come in from their saved defaults...
  useEffect(() => {
    setTs({ textPt: prefs.textPt, markPt: prefs.markPt });
  }, [prefs.textPt, prefs.markPt]); // eslint-disable-line react-hooks/exhaustive-deps
  // ...and a size the user sets (panel size boxes, right-click menu) is saved back for them
  const prefsRef = useRef(setPrefs);
  prefsRef.current = setPrefs;
  const setTsSaving = useCallback(
    (patch) => {
      setTs(patch);
      if (!patch || typeof patch !== "object") return;
      const sizes = {};
      if ("textPt" in patch) sizes.textPt = patch.textPt;
      if ("markPt" in patch) sizes.markPt = patch.markPt;
      if (Object.keys(sizes).length) prefsRef.current(sizes);
    },
    [setTs],
  );
  // full screen: the host's (the workspace takes its form list along) or this panel's own
  const rootRef = useRef(null);
  // speech to text into the box that has the caret (double-click caret or a fill-in field)
  const dictate = useDictation(rootRef, notify);
  const ownFull = useFullScreen(rootRef);
  const { full, toggle: toggleFull } = fullScreen || ownFull;
  const selfFull = !fullScreen && ownFull.full;
  const [savedAt, setSavedAt] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;


  // Every copy of this form for this admission (newest first). The latest is the one on top —
  // edited while a draft, shown read-only once finalised until the nurse starts a New form;
  // the finalised ones are listed below the form (CompletedEntries).
  const [history, setHistory] = useState([]);
  const loadCopy = useCallback(
    (e) => {
      setEntry(e);
      const { $drawings, $editors, ...vals } = safeJson(e?.valuesJson); // eslint-disable-line no-unused-vars
      setValues(e ? vals : {});
      marks.reset(Array.isArray($drawings) ? $drawings : []);
      setSigs(e ? safeJson(e.signaturesJson) : {});
      setDirty(false);
      setSavedAt("");
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => {
    loadCopy(null);
    setHistory([]);
    setDrawOn(false);
    if (!persist || mode !== "fill" || !form?.id || !ids.transactionId) return;
    let dead = false;
    nfFormEntries(form.id, ids.transactionId)
      .then(async (res) => {
        if (res?.success && Array.isArray(res.data)) return res.data;
        // an API without FormEntries (older build): its single entry, as before
        const one = await nfEntry(form.id, ids.transactionId);
        if (!one?.success) {
          if (one?.message || res?.message) notify(one?.message || res?.message, "warn");
          return [];
        }
        return one.data ? [one.data] : [];
      })
      .then((list) => {
        if (dead) return;
        setHistory(list);
        if (list[0]) loadCopy(list[0]);
      });
    return () => {
      dead = true;
    };
  }, [form?.id, ids.transactionId, persist, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Every finalised copy, newest first — the one on top too, so Print all takes them all. */
  const completed = useMemo(() => history.filter((h) => h.status === "final"), [history]);
  const putHistory = (row) => setHistory((h) => [row, ...h.filter((x) => x.id !== row.id)].sort((a, b) => (b.entryNo || 0) - (a.entryNo || 0)));

  /** After a Finalise: a fresh, blank copy of the form on top; the finalised one moves down to Completed. */
  const startNew = () => {
    loadCopy(null);
    setDrawSel(null);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // the banner is about the patient: blanks in the user / centre keys are not listed
  const missing = useMemo(() => missingFields(layout, data).filter((m) => !m.keys.every(isContextKey)), [layout, data]);
  const hasInputs = true; // every form can carry the nurse's drawings
  const live = mode === "fill" && entry?.status !== "final";
  const unsaved = dirty || marks.dirty;
  const drawing = (drawOn || drawOnly) && live;

  const setValue = useCallback((id, v) => {
    setValues((s) => ({ ...s, [id]: v }));
    setDirty(true);
  }, []);

  const save = async (status, quiet = false) => {
    if (status === "final") {
      const need = layout.fields.filter((f) => f.type === "input" && f.input?.required && !String(values[f.id] ?? "").trim());
      if (need.length) {
        notify(`Fill the required fields first: ${need.map((f) => f.input?.label || "field").join(", ")}`, "warn");
        return;
      }
    }
    if (!persist) {
      setDirty(false);
      marks.setDirty(false);
      notify(status === "final" ? "Preview: entry finalised (not saved)" : "Preview: entry kept (not saved)", "success");
      return;
    }
    if (!ids.transactionId) {
      notify("This patient row has no TransactionID — the entry cannot be saved.", "warn");
      return;
    }
    setBusy(status);
    const valuesJson = JSON.stringify(marks.layout.length ? { ...values, $drawings: marks.layout } : values);
    const signaturesJson = JSON.stringify(sigs);
    const res = await nfSaveEntry({
      formId: form.id,
      versionNo,
      transactionId: ids.transactionId,
      patientId: ids.patientId,
      ipdNo: ids.ipdNo,
      valuesJson,
      signaturesJson,
      status,
      entryRev: entry?.entryRev || 0,
      // the copy on top; none = start the next copy (the first one when there is none yet)
      entryId: entry?.id || 0,
      newEntry: !entry?.id,
    });
    setBusy("");
    if (res?.success) {
      const row = {
        ...(entry || {}),
        id: res.data?.id,
        entryRev: res.data?.entryRev,
        entryNo: res.data?.entryNo || entry?.entryNo || 1,
        formId: form.id,
        versionNo,
        status,
        valuesJson,
        signaturesJson,
        editors: Array.isArray(res.data?.editors) ? res.data.editors : editorsOf(entry),
        createdOn: entry?.createdOn || new Date().toISOString(),
        createdBy: entry?.createdBy || ctx.user,
        modifiedOn: new Date().toISOString(),
        modifiedBy: ctx.user,
      };
      setEntry(row);
      putHistory(row);
      setDirty(false);
      marks.setDirty(false);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      onSaved?.({ formId: form.id, versionNo, status });
      if (!quiet) {
        notify(status === "final" ? `Form finalised${row.entryNo > 1 ? ` (#${row.entryNo})` : ""} — start a New form for the next one` : "Saved", "success");
        // auto-saves skip it: one PDF per Save / Finalise the nurse asked for
        savePdf(status, { values, signatures: sigs, marks: marks.layout }, row.id);
      }
    } else notify(res?.message || res?.data?.message || "Could not save the entry.", "warn");
  };

  /** The filled form as PDF in the patient's folder (D/HISDocument/nursingform/<IPD no>/<form>.pdf, replaced each save) on the API. */
  // The entry row (nf_patient_entry.PdfPath, PdfSavedOn/By) records it; the API answers the path.
  const savePdf = async (status, filled, entryId) => {
    setPdfBusy(true);
    try {
      const dataUrl = await formPdf({ layout, fileUrl, fileType: form?.fileType, data, ...filled, ctx, title: form?.name });
      const res = await nfSaveEntryPdf({ formId: form.id, transactionId: ids.transactionId, ipdNo: ids.ipdNo, dataUrl, entryId });
      if (!res?.success) throw new Error(res?.message || res?.data?.message);
      const pdf = { pdfPath: res.data?.path, pdfSavedOn: new Date().toISOString(), pdfSavedBy: ctx.user };
      setEntry((e) => (e && e.id === entryId ? { ...e, ...pdf } : e));
      setHistory((h) => h.map((x) => (x.id === entryId ? { ...x, ...pdf } : x)));
      onSaved?.({ formId: form.id, versionNo, status, hasPdf: true });
    } catch (e) {
      notify(`Saved, but the PDF copy could not be stored${e?.message ? `: ${e.message}` : "."}`, "warn");
    }
    setPdfBusy(false);
  };
  // the same path is overwritten on every save: always fetch it again
  const viewPdf = () => openSaved(entry.pdfPath);
  const pdfTitle = entry?.pdfPath
    ? `Saved PDF: ${entry.pdfPath || ""}${entry.pdfSavedOn ? ` · ${moment(entry.pdfSavedOn).format("DD-MMM-YYYY HH:mm")}` : ""}${entry.pdfSavedBy ? ` · ${entry.pdfSavedBy}` : ""}`
    : "No PDF yet — Save or Finalise writes one";

  // Auto-save: a quiet draft save 1.5 s after the last change.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (!autoSave || !persist || !live || !unsaved || busy || !ids.transactionId) return undefined;
    const t = setTimeout(() => saveRef.current("draft", true), 1500);
    return () => clearTimeout(t);
  }, [autoSave, persist, live, unsaved, busy, values, sigs, marks.layout, ids.transactionId]);

  useEffect(() => {
    onDirty?.(unsaved);
  }, [unsaved]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl+S saves; Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z) undo / redo the drawings.
  // Inside a text box or fill-in field the browser's own text undo wins.
  const marksRef = useRef(marks);
  marksRef.current = marks;

  // Image: uploaded, dropped in the middle of the page in view, selected for moving / resizing.
  const scrollRef = useRef(null);
  const doneRef = useRef(null); // the completed-forms list under the pages (DoneBar jumps to it)
  const widest = Math.max(...pages.map((p) => p.w));
  // the page opens at its fitted size straight away (no 100% → fit animation); zoom
  // easing is switched on only once it has been painted that way
  const [settled, setSettled] = useState(false);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && fit) setZoom(Math.round(Math.min(3, Math.max(0.3, (el.clientWidth - 56) / (widest * PX_PER_MM))) * 100) / 100);
    const a = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => cancelAnimationFrame(a);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = scrollRef.current;
    if (!fit || !el) return undefined;
    let raf = 0;
    const measure = () => {
      raf = 0;
      // the scroll area's side padding (24 px each side) and a little air
      const z = Math.round(Math.min(3, Math.max(0.3, (el.clientWidth - 56) / (widest * PX_PER_MM))) * 100) / 100;
      setZoom((old) => (Math.abs(old - z) < 0.01 ? old : z));
    };
    // follow the panels while they slide (once per frame): the page grows with them, its short
    // ease smoothing the steps; the PDF itself is redrawn only once the size settles (PageBackground)
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(measure);
    });
    ro.observe(el);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [fit, widest]);
  // One Font size box for text and ✔ / ✘: it sizes the text being typed or the selected one,
  // otherwise sets the size new text and marks get (saved for the user).
  const fontTarget = marks.layout.find((it) => it.kind === "text" && (it.id === drawEditing || (!drawEditing && it.id === drawSel))) || null;
  const setFont = (pt) => {
    if (!fontTarget) return setTsSaving({ textPt: pt });
    const k = pt / (fontTarget.fontSize || 10);
    marks.apply((list) =>
      list.map((it) => (it.id === fontTarget.id ? { ...it, fontSize: pt, w: Math.round(it.w * k * 100) / 100, h: Math.round(it.h * k * 100) / 100 } : it)),
    );
  };
  // The colour palette likewise recolours the text being typed or the selected mark (✔ / ✘, a
  // stroke, a shape — colour 2 fills a shape); with nothing selected it sets the pen colours.
  const colourTarget = marks.layout.find((it) => it.kind !== "image" && (it.id === drawEditing || (!drawEditing && it.id === drawSel))) || null;
  const setColour = (c, second = false) => {
    if (!colourTarget) return false;
    const fills = second && !["text", "stroke", "line", "curve"].includes(colourTarget.kind);
    marks.apply((list) => list.map((it) => (it.id !== colourTarget.id ? it : fills ? { ...it, fill: c } : { ...it, stroke: c })));
    return true;
  };
  const [imageBusy, setImageBusy] = useState(false);
  const insertImage = async (file) => {
    if (imageBusy) return;
    setImageBusy(true);
    try {
      const at = pageInView(scrollRef.current, pages);
      const it = await imageMark(file, { ...at, size: pages[at.page - 1] || pages[0] });
      marksRef.current.apply((list) => [...list, it]);
      setTs({ tool: "select" });
      setDrawSel(it.id);
    } catch (e) {
      notify(e?.message || "The image could not be added.", "warn");
    }
    setImageBusy(false);
  };
  const insertRef = useRef(insertImage);
  insertRef.current = insertImage;
  useEffect(() => {
    if (!drawing) return undefined;
    const paste = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
      const f = [...(e.clipboardData?.files || [])].find(isImageFile);
      if (!f) return;
      e.preventDefault();
      insertRef.current(f);
    };
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  }, [drawing]);
  useEffect(() => {
    if (mode !== "fill" || !live) return undefined;
    const k = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        if (!persist) return;
        e.preventDefault();
        saveRef.current("draft");
        return;
      }
      if (!drawing || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
      const m = marksRef.current;
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (m.canUndo) m.undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        if (m.canRedo) m.redo();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [mode, live, persist, drawing]);

  const print = async () => {
    setBusy("print");
    try {
      await printForm({ layout: { ...layout, printMode }, fileUrl, fileType: form?.fileType, data, values, signatures: sigs, marks: marks.layout, ctx, title: form?.name });
      if (persist && form?.id) nfLogPrint({ formId: form.id, versionNo, transactionId: ids.transactionId, patientId: ids.patientId, ipdNo: ids.ipdNo, patientName: ids.patientName, printMode, copies: 1 });
    } catch (e) {
      notify(e?.message || "Print failed.", "warn");
    }
    setBusy("");
  };

  /** Prints a finalised copy from the list below, as it was filled. */
  /** Print options for one finalised copy; `stamp` adds "#n · Finalised … by … · started …" on each page. */
  const copyOpts = (e, stamp) => {
    const { $drawings, $editors, ...vals } = safeJson(e.valuesJson); // eslint-disable-line no-unused-vars
    return {
      layout: { ...layout, printMode },
      fileUrl,
      fileType: form?.fileType,
      data,
      values: vals,
      signatures: safeJson(e.signaturesJson),
      marks: Array.isArray($drawings) ? $drawings : [],
      ctx,
      title: `${form?.name || "Nursing form"} #${e.entryNo || 1}`,
      stamp: stamp ? { no: e.entryNo || 1, name: form?.name || "Nursing form", lines: bylineParts(e) } : "",
    };
  };
  const logPrints = (list, how) =>
    list.forEach((e) => nfLogPrint({ formId: form.id, versionNo: e.versionNo || versionNo, transactionId: ids.transactionId, patientId: ids.patientId, ipdNo: ids.ipdNo, patientName: ids.patientName, printMode: how, copies: 1 }));

  /** One PDF of the ticked finalised copies, opened in a new tab (to view, download or print). */
  const pdfCopies = async (list, stamp) => {
    if (!list.length) return notify("Tick at least one completed form.", "warn");
    await openPdf(list.length > 1 ? `Preparing PDF of ${list.length} forms…` : "Preparing PDF…", async () => {
      const uri = await formsPdf(list.map((e) => copyOpts(e, stamp)));
      const bin = atob(uri.slice(uri.indexOf(",") + 1));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      setTimeout(() => URL.revokeObjectURL(url), 10 * 60000);
      logPrints(list, "pdf");
      return url;
    });
  };

  const toolbar = (
    <DrawToolbar
      side={ribbon === "right"}
      ts={ts}
      setTs={setTsSaving}
      onUndo={marks.undo}
      onRedo={marks.redo}
      canUndo={marks.canUndo}
      canRedo={marks.canRedo}
      count={marks.layout.length}
      onClear={() => marks.apply(() => [])}
      onDone={drawOnly ? undefined : () => setDrawOn(false)}
      onImage={insertImage}
      imageBusy={imageBusy}
      foldSignal={foldTools}
      fullMode={full}
      inputMode={inputMode}
      onInputMode={(m) => setPrefs({ inputMode: m })}
      fontPt={fontTarget ? fontTarget.fontSize || 10 : undefined}
      fontFor={fontTarget ? (fontTarget.mark ? "mark" : "text") : ""}
      onFont={setFont}
      colourOf={colourTarget ? colourTarget.stroke || "#000000" : ""}
      onColour={setColour}
    />
  );

  return (
    <div ref={rootRef} className={`nfb nfb-render${compact ? " is-compact" : ""}${selfFull ? " is-full" : ""}${settled ? " is-settled" : ""}`}>
      <div className="nfb-render-bar">
        <div className="nfb-render-title">
          <span className="nfb-render-name" title={form?.name}>
            {form?.name || "Nursing form"}
          </span>
          {!versionNo && <Chip tone="amber">Draft preview</Chip>}
          {persist && mode === "fill" && history.length > 0 && <Chip tone="indigo">{entry ? `#${entry.entryNo || 1}` : `New #${(history[0]?.entryNo || 0) + 1}`}</Chip>}
          {entry?.status === "final" && <Chip tone="mint">Finalised</Chip>}
          {persist && mode === "fill" && editorsOf(entry).length > 0 && <EditorsChip editors={editorsOf(entry)} />}
          {persist && mode === "fill" ? (
            <span className={`nfb-savestate${unsaved || busy === "draft" ? " is-dirty" : !savedAt && !entry ? " is-idle" : ""}`}>{busy === "draft" ? "Saving…" : unsaved ? "Unsaved" : savedAt ? `Saved ${savedAt}` : entry ? "Saved" : "Not started"}</span>
          ) : (
            unsaved && <Chip tone="amber">Unsaved</Chip>
          )}
        </div>
        {ids.patientName && (
          <span className="nfb-render-patient">
            <Icon name="user" size={13} />
            {ids.patientName}
            {ids.ipdNo && <em>IPD {ids.ipdNo}</em>}
          </span>
        )}
        <span className="nfb-grow" />
        {mode === "fill" && live && (
          <span className={`nfb-mic${dictate.on ? " is-on" : ""}${dictate.listening ? " is-listening" : ""}`}>
            <Tap
              variant={dictate.on ? "soft" : "ghost"}
              tone={dictate.on ? "rose" : ""}
              icon="mic"
              active={dictate.on}
              // still clickable when unsupported: the click says why (and which browser to use)
              className={dictate.supported ? "" : "is-unsupported"}
              title={
                !dictate.supported
                  ? dictate.why
                  : dictate.on
                    ? "Speech to text is on: double-click the form (or click a field) and speak. Click to turn off."
                    : "Speech to text: turn on, then double-click the form (or click a field) and speak"
              }
              // keep the caret where it is: pressing the mic must not take the focus
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={dictate.toggle}
            />
            {dictate.on && (
              <Tap
                className="nfb-mic-lang"
                title={`Language: ${DICTATE_LANGS.find((l) => l.code === dictate.lang)?.label || dictate.lang} (click to change)`}
                onPointerDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                onClick={dictate.cycleLang}
              >
                {DICTATE_LANGS.find((l) => l.code === dictate.lang)?.short || "EN"}
              </Tap>
            )}
          </span>
        )}
        <Tap variant="ghost" icon={full ? "fullExit" : "full"} active={full} title={full ? "Exit full screen (Esc)" : "Full screen"} onClick={toggleFull} />
        <ZoomControl zoom={zoom} setZoom={manualZoom} onFit={() => setFit(true)} fit={fit} />
        <span className="nfb-sep" />
        {mode === "fill" && live && !drawOnly && (
          <Tap
            variant={drawOn ? "solid" : "soft"}
            tone={drawOn ? "indigo" : "rose"}
            icon="paint"
            title="Draw on this patient's copy"
            onClick={() => {
              setDrawOn((d) => !d);
              setDrawSel(null);
            }}
          >
            {drawOn ? "Drawing" : "Draw"}
          </Tap>
        )}
        {mode === "fill" && hasInputs && (
          <>
            <Tap variant="soft" icon="save" disabled={!live || !!busy || !unsaved} title="Save (Ctrl+S)" onClick={() => save("draft")}>
              {busy === "draft" ? "Saving…" : "Save"}
            </Tap>
            {persist && entry?.status === "final" ? (
              <Tap variant="soft" tone="mint" icon="plus" disabled={!!busy} title="Start a new, blank copy of this form for this patient — the finalised one stays below" onClick={startNew}>
                New form
              </Tap>
            ) : (
              <Tap variant="soft" tone="mint" icon="check" disabled={!live || !!busy} onClick={() => save("final")}>
                Finalise
              </Tap>
            )}
          </>
        )}
        {mode === "fill" && persist && (
          <Tap variant="soft" icon="pdf" disabled={pdfBusy || !entry?.pdfPath} title={pdfTitle} onClick={viewPdf}>
            {pdfBusy ? "PDF…" : "View PDF"}
          </Tap>
        )}
        {!persist && (
          <Tap variant="solid" tone="indigo" icon="print" disabled={!!busy} onClick={print}>
            {busy === "print" ? "Preparing…" : "Print"}
          </Tap>
        )}
        {onClose && <Tap variant="ghost" icon="x" title="Close" onClick={onClose} />}
      </div>

      {drawing && ribbon !== "right" && toolbar}

      {missing.length > 0 && showMissing && (
        <div className="nfb-banner tone-amber">
          <Icon name="alert" size={14} />
          <span>
            <b>
              {missing.length} field{missing.length > 1 ? "s" : ""} empty for this patient:
            </b>{" "}
            {[...new Set(missing.flatMap((m) => m.keys))].map((k) => labels[k] || humanize(k)).join(", ")}
          </span>
          <span className="nfb-grow" />
          <Tap variant="ghost" icon="x" title="Hide" onClick={() => setShowMissing(false)} />
        </div>
      )}

      <div className="nfb-render-main">
        <div className="nfb-render-col">
        <div className="nfb-render-scroll" ref={scrollRef}>
          {pages.map((p, i) => {
            const n = i + 1;
            return (
              <div key={n} className="nfb-pageslot" style={{ width: p.w * PX_PER_MM * zoom, height: p.h * PX_PER_MM * zoom }}>
                <div className="nfb-page" style={{ width: `${p.w}mm`, height: `${p.h}mm`, transform: `scale(${zoom})` }}>
                  <PageBackground fileUrl={fileUrl} fileType={form?.fileType} page={n} density={PX_PER_MM * zoom * dpr} />
                  <DrawLayer items={layout.drawings} page={n} size={p} />
                  {fieldsOnPage(layout.fields, n).map((f) => (
                    <LiveField
                      key={f.id}
                      f={f}
                      mode={live ? "fill" : "print"}
                      className={live && (f.type === "input" || f.type === "signature") ? `is-fillable${drawing ? " is-above" : ""}` : ""}
                      text={resolveField(f, data, { ...ctx, page: n, pages: pages.length })}
                      entry={values[f.id]}
                      sig={sigs[f.id]}
                      onEntry={(v) => setValue(f.id, v)}
                      onSign={() => setSigning(f)}
                    />
                  ))}
                  <DrawLayer items={marks.layout} page={n} size={p} style={{ zIndex: 3 }} />
                  {drawing && (
                    <DrawSurface
                      page={n}
                      size={p}
                      items={marks.layout}
                      ts={ts}
                      setTs={setTsSaving}
                      apply={marks.apply}
                      live={marks.live}
                      checkpoint={marks.checkpoint}
                      sel={drawSel}
                      setSel={setDrawSel}
                      onEditing={setDrawEditing}
                      onZoom={(dir) => manualZoom((z) => Math.min(3, Math.max(0.3, Math.round((z + dir * 0.25) * 100) / 100)))}
                    />
                  )}
                </div>
                {pages.length > 1 && <span className="nfb-pageno">{n}</span>}
              </div>
            );
          })}
          {persist && mode === "fill" && completed.length > 0 && (
            <CompletedEntries
              entries={completed}
              topId={entry?.status === "final" ? entry.id : 0}
              layout={layout}
              pages={pages}
              zoom={zoom}
              dpr={dpr}
              fileUrl={fileUrl}
              fileType={form?.fileType}
              data={data}
              ctx={ctx}
              anchorRef={doneRef}
              onPdf={pdfCopies}
              onOpenSaved={openSaved}
            />
          )}
        </div>
        {persist && mode === "fill" && completed.length > 0 && <DoneBar entries={completed} scrollRef={scrollRef} anchorRef={doneRef} />}
        </div>
        {drawing && ribbon === "right" && toolbar}
      </div>

      {dictate.heard &&
        createPortal(
          // on <body>: position:fixed must not follow a transformed ancestor
          <div className="nfb-heard" style={{ left: dictate.heard.x, top: dictate.heard.y + 6 }}>
            <span className="nfb-heard-dot" />
            {dictate.heard.text}
          </div>,
          document.body,
        )}

      <SignaturePad
        open={!!signing}
        label={signing?.signature?.label}
        defaultName={ctx.user}
        initial={signing ? sigs[signing.id] : null}
        onClose={() => setSigning(null)}
        onSave={(sig) => {
          setSigs((s) => ({ ...s, [signing.id]: sig }));
          setDirty(true);
          setSigning(null);
        }}
      />
      {pdfWait &&
        createPortal(
          <div className="nfb nfb-pdfwait" role="status" aria-live="polite">
            <div className="nfb-pdfwait-card">
              {pdfWait.url && (
                <>
                  <Icon name="check" size={26} className="nfb-pdfwait-ok" />
                  <b>PDF ready</b>
                  <span>Your browser held back the new tab — open it here.</span>
                  <div className="nfb-pdfwait-acts">
                    <Tap variant="ghost" onClick={() => setPdfWait(null)}>
                      Close
                    </Tap>
                    <Tap
                      variant="solid"
                      tone="indigo"
                      icon="print"
                      onClick={() => {
                        window.open(pdfWait.url, "_blank");
                        setPdfWait(null);
                      }}
                    >
                      Open PDF
                    </Tap>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/**
 * The finalised copies of this form for this admission, under the form being filled,
 * newest first (DoneBar, fixed under the form area, jumps here); each copy is a collapsible
 * card (No., finalised on / by, View PDF), open by default so scrolling down
 * previews each one; a collapsed card draws nothing, an open one draws its PDF pages
 * only as they scroll into view (PageBackground).
 */
function CompletedEntries({ entries, layout, pages, zoom, dpr, fileUrl, fileType, data, ctx, anchorRef, onPdf, onOpenSaved, topId = 0 }) {
  // collapsed by the nurse; the rest show their preview (the copy already open on top starts folded)
  const [closed, setClosed] = useState(() => new Set(topId ? [topId] : []));
  // every copy is ticked for PDF all until the nurse unticks it (a new copy comes ticked)
  const [unticked, setUnticked] = useState(() => new Set());
  // "Name, date & time" on every printed page (on by default)
  const [stamp, setStamp] = useState(true);
  const [busy, setBusy] = useState("");
  const ticked = entries.filter((e) => !unticked.has(e.id));
  const allTicked = ticked.length === entries.length;
  const tick = (id) =>
    setUnticked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const tickAll = () => setUnticked(allTicked ? new Set(entries.map((e) => e.id)) : new Set());
  const run = async (what, fn) => {
    setBusy(what);
    try {
      await fn();
    } finally {
      setBusy("");
    }
  };
  const width = Math.max(...pages.map((p) => p.w)) * PX_PER_MM * zoom;
  const toggle = (id) =>
    setClosed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const when = (d) => (d ? moment(d).format("DD-MMM-YYYY hh:mm A") : "");
  return (
    <>
      <div ref={anchorRef} className="nfb-done-title" style={{ width }}>
        <label className="nfb-done-check" title={allTicked ? "Untick all" : "Tick all"}>
          <input type="checkbox" checked={allTicked} ref={(el) => el && (el.indeterminate = !allTicked && ticked.length > 0)} onChange={tickAll} />
        </label>
        <span className="nfb-done-ico">
          <Icon name="check" size={13} />
        </span>
        <b>Completed forms</b>
        <span className="nfb-done-count">{entries.length}</span>
        <span className="nfb-done-hint">newest first</span>
        <span className="nfb-grow" />
        <label className="nfb-done-stamp" title="Print each form's number, who finalised / started it and when, along the foot of every page">
          <input type="checkbox" checked={stamp} onChange={(ev) => setStamp(ev.target.checked)} />
          Name, date &amp; time
        </label>
        <Tap variant="soft" icon="print" disabled={!!busy || !ticked.length} title="One PDF of the ticked forms, to print (opens in a new tab)" onClick={() => run("pdf", () => onPdf(ticked, stamp))}>
          {busy === "pdf" ? "Preparing…" : `Print ${allTicked ? "all" : `(${ticked.length})`}`}
        </Tap>
      </div>
      <div className="nfb-done-list" style={{ width }}>
        {entries.map((e) => {
          const isOpen = !closed.has(e.id);
          return (
            <div key={e.id} data-copy={e.id} className={`nfb-done-card${isOpen ? " is-open" : ""}${unticked.has(e.id) ? " is-unticked" : ""}`}>
              <div className="nfb-done-card-head" role="button" tabIndex={0} onClick={() => toggle(e.id)}>
                <label className="nfb-done-check" title="Include in Print all" onClick={(ev) => ev.stopPropagation()}>
                  <input type="checkbox" checked={!unticked.has(e.id)} onChange={() => tick(e.id)} />
                </label>
                <Icon name={isOpen ? "chevD" : "chevR"} size={14} />
                <span className="nfb-done-no">#{e.entryNo || 1}</span>
                <CopyByline e={e} when={when} />
                <span className="nfb-grow" />
                <span className="nfb-done-actions" onClick={(ev) => ev.stopPropagation()}>
                  {e.pdfPath && (
                    <Tap variant="ghost" icon="print" title={`Print (saved PDF: ${e.pdfPath})`} onClick={() => onOpenSaved(e.pdfPath)}>
                      Print
                    </Tap>
                  )}
                </span>
              </div>
              {isOpen && <CopyPages entry={e} layout={layout} pages={pages} zoom={zoom} dpr={dpr} fileUrl={fileUrl} fileType={fileType} data={data} ctx={ctx} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * Fixed at the bottom of the form area whenever the admission has finalised copies:
 * "Completed forms (n)", a chip per copy (#3 #2 #1) that jumps straight to it, and
 * View ↓ / Back to form ↑ — which one depends on whether the list is on screen.
 */
function DoneBar({ entries, scrollRef, anchorRef }) {
  const [atList, setAtList] = useState(false);
  useEffect(() => {
    const sc = scrollRef.current;
    const a = anchorRef.current;
    if (!sc || !a || typeof IntersectionObserver === "undefined") return undefined;
    // "at the list" once its title has reached the top half of the form area
    const io = new IntersectionObserver(([e]) => setAtList(e.isIntersecting || e.boundingClientRect.top < e.rootBounds?.top), { root: sc, rootMargin: "0px 0px -50% 0px" });
    io.observe(a);
    return () => io.disconnect();
  }, [scrollRef, anchorRef, entries.length]);
  const scrollTo = (el) => {
    const sc = scrollRef.current;
    if (!sc || !el) return;
    sc.scrollTo({ top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 10, behavior: "smooth" });
  };
  const toList = () => scrollTo(anchorRef.current);
  const toCopy = (id) => scrollTo(scrollRef.current?.querySelector(`[data-copy="${id}"]`));
  const toTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  return (
    <div className="nfb-donebar">
      <span className="nfb-done-ico">
        <Icon name="check" size={13} />
      </span>
      <b>Completed forms</b>
      <span className="nfb-done-count">{entries.length}</span>
      <span className="nfb-donebar-chips">
        {entries.map((e) => (
          <Tap key={e.id} className="nfb-donebar-chip" title={`Go to copy #${e.entryNo || 1}`} onClick={() => toCopy(e.id)}>
            #{e.entryNo || 1}
          </Tap>
        ))}
      </span>
      <span className="nfb-grow" />
      {atList ? (
        <Tap variant="soft" tone="indigo" icon="chevU" onClick={toTop}>
          Back to form
        </Tap>
      ) : (
        <Tap variant="soft" tone="mint" icon="chevD" onClick={toList}>
          View
        </Tap>
      )}
    </div>
  );
}

/** One finalised copy, read-only: the form, its values, signatures and the nurse's drawings. */
function CopyPages({ entry, layout, pages, zoom, dpr, fileUrl, fileType, data, ctx }) {
  const { values, sigs, marks } = useMemo(() => {
    const { $drawings, $editors, ...vals } = safeJson(entry.valuesJson); // eslint-disable-line no-unused-vars
    return { values: vals, sigs: safeJson(entry.signaturesJson), marks: Array.isArray($drawings) ? $drawings : [] };
  }, [entry.valuesJson, entry.signaturesJson]);
  return (
    <div className="nfb-done-pages">
      {pages.map((p, i) => {
        const n = i + 1;
        return (
          <div key={n} className="nfb-pageslot" style={{ width: p.w * PX_PER_MM * zoom, height: p.h * PX_PER_MM * zoom }}>
            <div className="nfb-page" style={{ width: `${p.w}mm`, height: `${p.h}mm`, transform: `scale(${zoom})` }}>
              <PageBackground fileUrl={fileUrl} fileType={fileType} page={n} density={PX_PER_MM * zoom * dpr} />
              <DrawLayer items={layout.drawings} page={n} size={p} />
              {fieldsOnPage(layout.fields, n).map((f) => (
                <LiveField key={f.id} f={f} mode="print" text={resolveField(f, data, { ...ctx, page: n, pages: pages.length })} entry={values[f.id]} sig={sigs[f.id]} />
              ))}
              <DrawLayer items={marks} page={n} size={p} style={{ zIndex: 3 }} />
            </div>
            {pages.length > 1 && <span className="nfb-pageno">{n}</span>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Everyone who saved a copy, in the order they first did (kept by the API in the values
 * under "$editors": { id, name, first, last, saves, finalised }). A copy saved before the
 * list existed falls back to its creator and last saver.
 */
function editorsOf(e) {
  if (!e) return [];
  const list = Array.isArray(e.editors) ? e.editors : safeJson(e.valuesJson).$editors;
  if (Array.isArray(list) && list.length) return list.filter((x) => x && (x.name || x.id));
  const out = [];
  if (e.createdBy) out.push({ id: e.createdBy, name: e.createdBy, first: e.createdOn });
  if (e.modifiedBy && e.modifiedBy !== e.createdBy) out.push({ id: e.modifiedBy, name: e.modifiedBy, last: e.modifiedOn, finalised: e.status === "final" });
  return out;
}
const fmtWhen = (d) => (d ? moment(d).format("DD-MMM-YYYY hh:mm A") : "");
const editorsTitle = (list) =>
  list
    .map((x) => `${x.name || x.id}${x.finalised ? " — finalised" : ""}${x.first ? ` · first ${fmtWhen(x.first)}` : ""}${x.last && x.last !== x.first ? ` · last ${fmtWhen(x.last)}` : ""}${x.saves > 1 ? ` · ${x.saves} saves` : ""}`)
    .join("\n");

/** "by A, B" beside the copy on top (everyone who has saved it), full detail on hover. */
function EditorsChip({ editors }) {
  return (
    <span className="nfb-editors" title={editorsTitle(editors)}>
      <Icon name="user" size={12} />
      {editors.map((x) => x.name || x.id).join(", ")}
    </span>
  );
}

/**
 * A finalised copy's heading: finalised when / by whom, started when / by whom, and
 * anyone else who filled part of it in between ("also C, D").
 */
/** The byline as one line of text — what "Name, date & time" prints on every page of a copy. */
function bylineParts(e) {
  const list = editorsOf(e);
  const starter = list[0];
  const finaliser = [...list].reverse().find((x) => x.finalised) || list[list.length - 1];
  const others = list.filter((x) => x !== starter && x !== finaliser);
  const nm = (x) => x?.name || x?.id || "";
  return [
    `Finalised ${fmtWhen(e.modifiedOn || e.createdOn)}${finaliser ? ` by ${nm(finaliser)}` : ""}`,
    e.createdOn ? `Started ${fmtWhen(e.createdOn)}${starter && starter !== finaliser ? ` by ${nm(starter)}` : ""}` : "",
    others.length ? `Also ${others.map(nm).join(", ")}` : "",
  ].filter(Boolean);
}

function CopyByline({ e, when }) {
  const list = editorsOf(e);
  const starter = list[0];
  const finaliser = [...list].reverse().find((x) => x.finalised) || list[list.length - 1];
  const others = list.filter((x) => x !== starter && x !== finaliser);
  return (
    <span className="nfb-done-meta" title={editorsTitle(list)}>
      <b>Finalised {when(e.modifiedOn || e.createdOn)}</b>
      {finaliser && <em>by {finaliser.name || finaliser.id}</em>}
      {e.createdOn && (
        <em>
          · started {when(e.createdOn)}
          {starter && starter !== finaliser ? ` by ${starter.name || starter.id}` : ""}
        </em>
      )}
      {others.length > 0 && <em>· also {others.map((x) => x.name || x.id).join(", ")}</em>}
    </span>
  );
}

export function ZoomControl({ zoom, setZoom, onFit, fit = false }) {
  const step = (d) => setZoom((z) => Math.min(3, Math.max(0.3, Math.round((z + d) * 10) / 10)));
  return (
    <span className="nfb-zoom">
      <Tap variant="ghost" icon="zoomOut" title="Zoom out" onClick={() => step(-0.1)} />
      <Tap variant="ghost" className="nfb-zoom-val" title="Reset to 100%" onClick={() => setZoom(1)}>
        {Math.round(zoom * 100)}%
      </Tap>
      <Tap variant="ghost" icon="zoomIn" title="Zoom in" onClick={() => step(0.1)} />
      {onFit && <Tap variant="ghost" icon="fitW" active={fit} title={fit ? "Fitting the width — follows the panels and full screen" : "Fit width"} onClick={onFit} />}
    </span>
  );
}

const safeJson = (s) => {
  try {
    const o = JSON.parse(s || "{}");
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
};
