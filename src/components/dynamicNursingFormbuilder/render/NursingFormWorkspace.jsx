/**
 * NursingFormWorkspace — the nursing forms for one admitted patient, ready to
 * fill. Drop it into any IPD frame-menu screen:
 *
 *   <NursingFormWorkspace data={patientRow} prefer="Vital Sign Chart" />
 *
 *   left     every form created in the Nursing Form Builder, grouped by
 *            category like the library; a tick marks forms already finalised
 *            for this admission, a pencil the ones in progress
 *   right    the form with this patient's data bound, the draw ribbon always
 *            open, double-click anywhere to type, fill-in fields and signatures;
 *            saved per admission with Save / Ctrl+S (nf_patient_entry,
 *            TransactionID); Ctrl+Z / Ctrl+Y undo and redo the drawings.
 *            Leaving a form with unsaved changes asks first.
 *
 * A published form opens on the version this patient's entry was filled on,
 * else the latest published one; a form never published opens its draft.
 * A new patient gets the form clean, as laid out in the builder.
 * `prefer` picks the first form: the one whose name matches it, else the last
 * one opened here.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nfDocUrl, nfEntries, nfForm, nfForms, nfPatientDetails, nfVersion } from "../../../networkServices/nursingFormBuilderApi";
import { loadPdf, warmPdf } from "../lib/pdf";
import NursingFormRender, { patientIds } from "./NursingFormRender";
import FormList from "../library/FormList";
import useFullScreen from "../lib/useFullScreen";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { Empty, Skeleton, useConfirm } from "../ui/kit";
import "../styles/nfb.css";

const LAST_KEY = "nfb-ws-last";
const RAIL_KEY = "nfb-ws-rail";
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
const store = (k, v) => {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch {
    /* private window */
  }
  return null;
};

/** The nearest scrolling ancestor (null = the window). */
const scrollParentOf = (el) => {
  for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === "auto" || oy === "scroll" || oy === "overlay") return p;
  }
  return null;
};

/**
 * Sizes the workspace to the space actually left under whatever sits above it (patient strip
 * open or folded, notices, any screen height), so its bottom — the form's scroll end and the
 * Completed forms bar — is always on screen. Re-measured when the window or the page above changes.
 */
function useFitHeight(ref, on) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!on) {
      el.style.height = "";
      return undefined;
    }
    const sc = scrollParentOf(el);
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        // the workspace's top inside its scroller's content, and the scroller's visible height
        const top = sc ? r.top - sc.getBoundingClientRect().top + sc.scrollTop : r.top + window.scrollY;
        const view = sc ? sc.clientHeight : window.innerHeight;
        const h = Math.max(420, Math.floor(view - top - 8));
        if (el.style.height !== `${h}px`) el.style.height = `${h}px`;
      });
    };
    fit();
    window.addEventListener("resize", fit);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (ro) {
      // what sits above changes size → the page content does; the scroller itself on resize
      ro.observe(document.body);
      if (sc) ro.observe(sc);
      if (sc?.firstElementChild) ro.observe(sc.firstElementChild);
      if (el.parentElement) ro.observe(el.parentElement);
    }
    document.addEventListener("transitionend", fit, true); // a header folding open / shut
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      document.removeEventListener("transitionend", fit, true);
      ro?.disconnect();
    };
  }, [ref, on]);
}

export default function NursingFormWorkspace({ data: frameRow, prefer = "", ward = "" }) {
  const ids = useMemo(() => patientIds(frameRow), [frameRow]);
  // The bound row: sp_ipd_GetIPDPatientDetailsNursingForm (NursingFormBuilder/PatientDetails) by
  // IPD No — the keys the builder shows — over the frame's own row, so older keys still bind.
  // undefined = still loading; a failed call keeps the frame row.
  const [detail, setDetail] = useState(undefined);
  const lookupId = ids.ipdNo || ids.patientId;
  useEffect(() => {
    if (!lookupId) return setDetail(null);
    let live = true;
    setDetail(undefined);
    nfPatientDetails(lookupId)
      .then((r) => live && setDetail(r?.success && r.data ? r.data : null))
      .catch(() => live && setDetail(null));
    return () => {
      live = false;
    };
  }, [lookupId]);
  const data = useMemo(() => {
    if (!detail) return frameRow;
    // entries are saved per the frame's TransactionID: the procedure's spelling must not replace it
    const keep = Object.fromEntries(Object.entries(frameRow || {}).filter(([k]) => /^(transaction_?id|tid)$/i.test(k)));
    return { ...(frameRow || {}), ...detail, ...keep };
  }, [frameRow, detail]);
  const [forms, setForms] = useState(null);
  const [loadError, setLoadError] = useState(""); // the API's reason when the list could not be read
  const [reload, setReload] = useState(0);
  const [entries, setEntries] = useState({}); // formId -> { status, versionNo }
  const [activeId, setActiveId] = useState(0);
  const [form, setForm] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [rail, setRail] = useState(() => store(RAIL_KEY) === "1");
  const [foldTools, setFoldTools] = useState(0); // bumped when a form is picked: the draw panel folds
  const [ask, confirmNode] = useConfirm();
  // full screen takes the whole workspace, so the form list stays beside the form
  const wsRef = useRef(null);
  const fullScreen = useFullScreen(wsRef);
  useFitHeight(wsRef, !fullScreen.full);
  const dirty = useRef(false);
  const onDirty = useCallback((d) => (dirty.current = d), []);
  // published versions never change: a form opened once reopens without a request
  const versions = useRef(new Map());

  // the PDF engine loads while the form list does
  useEffect(() => {
    warmPdf();
  }, []);

  // Full screen starts with both panels folded (the form gets the whole screen);
  // leaving it puts the list back as it was (the draw panel restores itself).
  const railBeforeFull = useRef(null);
  useEffect(() => {
    if (fullScreen.full) {
      railBeforeFull.current = rail;
      setRail(true);
    } else if (railBeforeFull.current !== null) {
      setRail(railBeforeFull.current);
      railBeforeFull.current = null;
    }
  }, [fullScreen.full]); // eslint-disable-line react-hooks/exhaustive-deps

  // A form picked from the list gets the whole width: the list folds to its rail and the
  // draw panel to its icon strip (both open again with their own toggles; not remembered).
  const focusForm = () => {
    setRail(true);
    setFoldTools((n) => n + 1);
  };

  // Unsaved drawings would be lost on reload / close.
  useEffect(() => {
    const warn = (e) => {
      if (!dirty.current) return undefined;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const openForm = async (id) => {
    if (id === activeId) return focusForm();
    if (dirty.current && !(await ask({ title: "Leave without saving?", text: "This form has changes for this patient that are not saved yet. They will be lost.", ok: "Leave", danger: true }))) return;
    dirty.current = false;
    setActiveId(id);
    focusForm();
  };

  // Every form in the builder and what this admission already has.
  useEffect(() => {
    let dead = false;
    setForms(null);
    setLoadError("");
    Promise.all([nfForms({ ward }), ids.transactionId ? nfEntries(ids.transactionId) : Promise.resolve(null)]).then(([f, e]) => {
      if (dead) return;
      // a failed call is not "no forms": say why (e.g. a database upgrade the API is waiting for)
      if (!f?.success) setLoadError(f?.message || f?.data?.message || "The nursing form API did not answer.");
      const list = f?.success ? (f.data || []).filter((x) => !x.isDeleted) : [];
      const map = {};
      // several copies per form (newest first per form): the badge shows the newest one
      (e?.success ? e.data || [] : []).forEach((x) => {
        if (!map[x.formId]) map[x.formId] = { status: x.status, versionNo: x.versionNo, hasPdf: !!x.pdfPath, copies: 0 };
        map[x.formId].copies += 1;
      });
      setForms(list);
      setEntries(map);
      const last = Number(store(LAST_KEY)) || 0;
      const p = norm(prefer);
      const pick = (p && (list.find((x) => norm(x.name) === p) || list.find((x) => norm(x.name).includes(p) || p.includes(norm(x.name))))) || list.find((x) => x.id === last) || list[0];
      setActiveId(pick?.id || 0);
    });
    return () => {
      dead = true;
    };
  }, [ids.transactionId, ward, prefer, reload]);

  // Published: the version this patient's entry was filled on, else the latest. Never published: the draft.
  useEffect(() => {
    const meta = (forms || []).find((x) => x.id === activeId);
    if (!meta) return setForm(null);
    let dead = false;
    store(LAST_KEY, String(activeId));
    const published = meta.publishedVersion > 0;
    const key = `${activeId}:${entries[activeId]?.versionNo || meta.publishedVersion}`;
    const show = (f) => {
      // the file starts downloading (and the PDF opening) while the page mounts
      if (f?.filePath)
        nfDocUrl(f.filePath)
          .then((u) => f.fileType === "pdf" && loadPdf(u))
          .catch(() => {});
      setForm(f);
    };
    if (published && versions.current.has(key)) {
      setLoadingForm(false);
      show(versions.current.get(key));
      return undefined;
    }
    setLoadingForm(true);
    const req = published ? nfVersion(activeId, entries[activeId]?.versionNo || 0) : nfForm(activeId);
    req.then((r) => {
      if (dead) return;
      setLoadingForm(false);
      if (!r?.success || !r.data) return setForm(null);
      const f = r.data.snapshot ? { ...r.data.snapshot, versionNo: r.data.versionNo } : { ...r.data, versionNo: 0, publishedVersion: 0 };
      if (published) versions.current.set(key, f);
      show(f);
    });
    return () => {
      dead = true;
    };
  }, [activeId, forms]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSaved = useCallback(
    ({ formId, versionNo, status, hasPdf }) => setEntries((m) => ({ ...m, [formId]: { ...m[formId], status, versionNo, ...(hasPdf ? { hasPdf } : {}) } })),
    [],
  );
  const toggleRail = () =>
    setRail((r) => {
      store(RAIL_KEY, r ? "0" : "1");
      return !r;
    });
  const badge = (f) => {
    const e = entries[f.id];
    if (!e) return null;
    const done = e.status === "final";
    return (
      <>
        {e.hasPdf && (
          <span className="nfb-ws-state is-pdf" title="PDF saved for this patient">
            <Icon name="pdf" size={11} />
          </span>
        )}
        <span className={`nfb-ws-state${done ? " is-final" : ""}`} title={done ? "Finalised for this patient" : "In progress for this patient"}>
          <Icon name={done ? "check" : "edit"} size={11} />
        </span>
      </>
    );
  };

  return (
    <div ref={wsRef} className={`nfb nfb-ws${fullScreen.full ? " is-full" : ""}`}>
      <FormList forms={forms || []} loading={!forms} selectedId={activeId} onSelect={openForm} collapsed={rail} onToggle={toggleRail} badge={badge} />

      <div className="nfb-ws-body">
        {forms && loadError ? (
          <Empty
            icon="alert"
            title="Nursing forms could not be loaded"
            text={loadError}
            action={
              <Tap variant="soft" tone="indigo" icon="restore" onClick={() => setReload((n) => n + 1)}>
                Try again
              </Tap>
            }
          />
        ) : forms && !forms.length ? (
          <Empty icon="file" title="No nursing forms yet" text="Create a form in the Nursing Form Builder — it shows up here for every admitted patient." />
        ) : !ids.transactionId && forms ? (
          <Empty icon="alert" title="No admission selected" text="This screen needs the patient's TransactionID to save the form." />
        ) : loadingForm || !form || detail === undefined ? (
          <div className="nfb-ws-skel">
            <Skeleton w="min(760px, 90%)" h="88%" r={4} />
          </div>
        ) : (
          <NursingFormRender key={`${form.id}-${form.versionNo}-${ids.transactionId}`} form={form} data={data} drawOnly ribbon="right" onSaved={onSaved} onDirty={onDirty} foldTools={foldTools} fullScreen={fullScreen} />
        )}
      </div>
      {confirmNode}
    </div>
  );
}
