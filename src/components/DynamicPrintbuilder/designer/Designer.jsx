/**
 * The print template designer — /print-builder/:code
 *
 *   ┌ top bar: back · name/status · page setup · undo/redo · zoom · data/bindings · preview · save · publish · versions
 *   ├ left: Insert | Data | Outline
 *   ├ centre: the page (Canvas)
 *   ├ right: properties of the selection / band / template
 *   └ status: hint · problems (live validation) · engine sync
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  pbAssets,
  pbDatasources,
  pbEngineInfo,
  pbFetchSample,
  pbFileUrl,
  pbLockTemplate,
  pbPreviewExport,
  pbPreviewPdf,
  pbSaveDatasource,
  pbUnlockTemplate,
  pbPublishTemplate,
  pbRestoreVersion,
  pbActivateVersion,
  pbAssetPath,
  pbSaveTemplate,
  pbTemplate,
  pbUploadAsset,
  pbValidateTemplate,
  pbVersion,
  pbVersions,
} from "../../../networkServices/printBuilderApi";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { applyCalculated, masterPage, validateTemplate } from "../engine/printEngine";
import { blockElements, fitWidth } from "../model/blocks";
import { findBlock } from "./BlocksPanel";
import { AccessDialog, VariantsDialog, WhereUsedDialog } from "./GovernanceDialogs";
import { BatchDialog, LegacyCompareDialog, OverlayDialog } from "./OutputDialogs";
import Tour, { tourSeen } from "./Tour";
import { panelTourSteps } from "./panelGuide";
import BuildGuide, { GuideChip, guideItems, guideWasOpen, rememberGuide } from "./BuildGuide";
import VersionDiffDialog from "./VersionDiff";
import { engineHash, installDesignStyles } from "../engine/runtime";
import { initialParams, normalizeTemplate, roundMm } from "../model/defaults";
import { DesignerProvider, findEl, useDesigner } from "../model/useDesigner";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import TipLayer from "../ui/TipLayer";
import { useAppFontZoom } from "../ui/zoom";
import { Select } from "../ui/fields";
import { pbConfirm } from "../ui/confirm";
import Splitter, { PanelRail, panelWidthStyle, saveCollapsed, savedCollapsed } from "../ui/Splitter";
import ApiDialog from "./ApiDialog";
import Canvas from "./Canvas";
import DatasourceDialog from "./DatasourceDialog";
import { PageSetupDialog, PreviewDialog, PublishDialog, ShortcutsDialog, VersionsDialog } from "./Dialogs";
import { copyStyleOf, pasteStyleTo } from "./PropertyPanel";
import LeftPanel, { LEFT_TABS } from "./LeftPanel";
import PropertyPanel from "./PropertyPanel";
import PaperPreview, { VIEW_OPTIONS } from "./PaperPreview";
import { CoverageChip, useLanguageData, usePrintLanguage, withLanguage } from "./PrintLanguage";
import "../styles/printBuilder.css";

const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2];
// template / datasource codes are stored upper-case; a template's datasourceCode may have been saved as typed
const sameCode = (a, b) => String(a ?? "").toUpperCase() === String(b ?? "").toUpperCase();
const isTyping = (e) => {
  const t = e.target;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
};

export default function Designer({ code }) {
  useAppFontZoom();
  return (
    <DesignerProvider>
      <DesignerInner code={code} />
      <TipLayer />
    </DesignerProvider>
  );
}

function DesignerInner({ code }) {
  const d = useDesigner();
  const navigate = useNavigate();
  const { tpl, meta, sel, dirty, past, future } = d.state;
  const masterPg = masterPage(tpl?.page || {}); // tpl is null until the template has loaded
  const masterLabel = `${masterPg.size || "A4"}${masterPg.orientation === "landscape" ? " landscape" : ""}`;
  const masterView = `${masterPg.size || "A4"}${masterPg.orientation === "landscape" ? "|landscape" : ""}`;
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showData, setShowData] = useState(true);
  const [datasources, setDatasources] = useState([]);
  const [assets, setAssets] = useState([]);
  const [sample, setSample] = useState(null);
  const [schema, setSchema] = useState(null);
  const [sampleParams, setSampleParams] = useState({});
  const [duplicate, setDuplicate] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [sampleInfo, setSampleInfo] = useState(null);
  const [dialog, setDialog] = useState(null);
  // "" = the master (edited on the canvas); any other paper = the automatic layout, previewed
  const [viewPaper, setViewPaper] = useState("");
  const [status, setStatus] = useState("");
  const [engineDrift, setEngineDrift] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lock, setLock] = useState(null); // { mine, lockedByName, since } — another editor on the same template
  const [autoSavedAt, setAutoSavedAt] = useState(null);
  // tour: false | { start: stepId } — first visit opens it at the welcome step
  const [tour, setTour] = useState(() => (tourSeen() ? false : { start: "welcome" }));
  const [guideOpen, setGuideOpen] = useState(() => guideWasOpen() ?? false);
  const [previewed, setPreviewed] = useState(false);
  useEffect(() => {
    if (dialog?.kind === "preview" && !dialog.template) setPreviewed(true);
  }, [dialog]);
  // previews print in the app language (or the one picked in the preview); the canvas keeps the designed text
  const [previewLang, setPreviewLang, languages] = usePrintLanguage();
  const [language, loadLanguage, setLanguage] = useLanguageData(previewLang);
  const tplRef = useRef(tpl);
  tplRef.current = tpl;
  const hasTpl = !!tpl;
  useEffect(() => {
    if (hasTpl) loadLanguage(tplRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLang, hasTpl]);
  useEffect(() => {
    // the labels may have changed since: check them again for what is about to be previewed
    if (dialog?.kind === "preview") loadLanguage(dialog.template || tplRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);
  const previewSample = useMemo(() => withLanguage(sample, language), [sample, language]);
  const statusTimer = useRef(null);
  const scrollRef = useRef(null);
  const bodyRef = useRef(null);
  const [bodyStyle] = useState(panelWidthStyle);
  const [collapsed, setCollapsed] = useState(savedCollapsed);
  const [leftTab, setLeftTab] = useState("insert");
  // section panel → "save as block": show the Blocks tab, then let it open its save form
  useEffect(() => {
    const open = () => {
      setLeftTab("blocks");
      setCollapsed((c) => {
        if (!c.left) return c;
        const next = { ...c, left: false };
        saveCollapsed(next);
        return next;
      });
      setTimeout(() => window.dispatchEvent(new Event("pbx:save-block")), 60);
    };
    window.addEventListener("pbx:open-blocks", open);
    return () => window.removeEventListener("pbx:open-blocks", open);
  }, []);
  const setPanel = useCallback((side, value) => {
    setCollapsed((c) => {
      const next = { ...c, [side]: value };
      saveCollapsed(next);
      return next;
    });
    // the canvas re-measures its scroll box once the column has changed
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }, []);

  const flash = useCallback((msg) => {
    setStatus(msg);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(""), 4000);
  }, []);

  useEffect(() => installDesignStyles(), []);

  /* --------------------------------------------------------------- load */
  const loadDatasources = useCallback(async () => {
    const r = await pbDatasources();
    if (r?.success) setDatasources(r.data || []);
    return r?.data || [];
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      const [t, dsList, a] = await Promise.all([pbTemplate(code), loadDatasources(), pbAssets("")]);
      if (!live) return;
      if (!t?.success) {
        setError(t?.message || "Could not load the template.");
        return;
      }
      if (a?.success) setAssets(a.data || []);
      let parsed;
      try {
        parsed = normalizeTemplate(JSON.parse(t.data.template || "{}"));
      } catch {
        setError("The saved template is not valid JSON.");
        return;
      }
      const m = { ...t.data };
      delete m.template;
      d.load(parsed, m);
      const ds = dsList.find((x) => sameCode(x.dsCode, m.datasourceCode));
      if (ds) {
        try {
          if (ds.fieldSchemaJson) setSchema(withCalculated(normalizeSchema(JSON.parse(ds.fieldSchemaJson)), JSON.parse(ds.definitionJson || "{}").calculated));
        } catch {
          /* no schema yet */
        }
        const sp = initialParams(ds);
        setSampleParams(sp);
        if (Object.values(sp).some((v) => v !== "" && v != null)) fetchSample(ds.dsCode, sp, parsed, false);
      }
      const [mine, server] = await Promise.all([engineHash(), pbEngineInfo()]);
      if (live && server?.success && mine && server.data?.hash && server.data.hash !== mine) setEngineDrift(true);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const datasource = useMemo(() => datasources.find((x) => sameCode(x.dsCode, meta?.datasourceCode)) || null, [datasources, meta?.datasourceCode]);
  const dsDef = useMemo(() => {
    try {
      return JSON.parse(datasource?.definitionJson || "{}");
    } catch {
      return {};
    }
  }, [datasource]);
  // result set → the procedure that returns it (canvas hover: where a field comes from)
  const sources = useMemo(() => {
    const m = {};
    for (const q of dsDef.queries || []) (q.resultSets || []).forEach((s) => s && (m[s] = q.proc));
    for (const r of dsDef.api?.resultSets || []) if (r.name) m[r.name] = `API ${dsDef.api.route}`;
    return m;
  }, [dsDef]);

  /* ------------------------------------------- edit lock (heartbeat each minute) */
  useEffect(() => {
    if (!code) return undefined;
    let live = true;
    const beat = (force = false) =>
      pbLockTemplate(code, force).then((r) => {
        if (live && r?.success) setLock(r.data || { mine: true });
      });
    beat();
    const t = setInterval(() => beat(), 60_000);
    const release = () => pbUnlockTemplate(code);
    window.addEventListener("pagehide", release);
    return () => {
      live = false;
      clearInterval(t);
      window.removeEventListener("pagehide", release);
      release();
    };
  }, [code]);
  const takeOver = async () => {
    const r = await pbLockTemplate(code, true);
    if (r?.success) setLock(r.data || { mine: true });
  };

  const fetchSample = async (dsCode = datasource?.dsCode, params = sampleParams, template = tpl, quiet = false) => {
    if (!dsCode) return;
    setFetching(true);
    setSampleInfo(null);
    const r = await pbFetchSample({
      datasourceCode: dsCode,
      params,
      receiptHeaderType: template?.header?.receiptHeaderType,
      template: JSON.stringify(template || {}),
      duplicate,
      saveSchema: true,
      lang: previewLang,
    });
    setFetching(false);
    if (!r?.success) {
      setSampleInfo({ error: true, text: r?.message || "The datasource failed." });
      if (!quiet) toast.error(r?.message || "The datasource failed.");
      return;
    }
    // calculated fields (datasource "calculated") are worked out here too, so the canvas shows them
    const data = applyCalculated(JSON.parse(r.data.dataJson));
    setSample(data);
    setSchema(withCalculated(normalizeSchema(r.data.schema), data.__calc));
    const sets = Object.keys(r.data.schema.sets || r.data.schema.Sets || {});
    setSampleInfo({ text: `${sets.map((s) => `${s} ${Array.isArray(data[s]) ? data[s].length : 0}`).join(" · ")} rows · ${r.data.ms} ms` });
    loadDatasources();
  };

  /* --------------------------------------------------------------- save */
  const save = useCallback(async ({ quiet = false } = {}) => {
    if (!tpl || !meta) return false;
    setSaving(true);
    const r = await pbSaveTemplate({
      code: meta.code,
      name: meta.name,
      category: meta.category,
      description: meta.description,
      datasourceCode: meta.datasourceCode,
      template: JSON.stringify(tpl),
      draftRev: meta.draftRev,
    });
    setSaving(false);
    if (!r?.success) {
      toast.error(r?.message || "Save failed");
      return false;
    }
    d.saved({ draftRev: r.data.draftRev, status: meta.publishedVersionNo ? "modified" : "draft" });
    flash(quiet ? "Draft saved automatically" : "Draft saved");
    return true;
  }, [tpl, meta, d, flash]);

  /* ----------------------------------------------------------- problems */
  const problems = useMemo(() => (tpl ? validateTemplate(tpl, schema ? { sets: schema.sets, params: schema.params, rootFields: schema.rootFields } : null) : { errors: [], warnings: [] }), [tpl, schema]);

  /* ------------------------------------------------ autosave every 30 s */
  const saveRef = useRef(null);
  saveRef.current = save;
  useEffect(() => {
    if (!dirty || saving || (lock && lock.mine === false)) return undefined;
    const t = setTimeout(async () => {
      if (await saveRef.current({ quiet: true })) setAutoSavedAt(new Date());
    }, 30_000);
    return () => clearTimeout(t);
  }, [dirty, tpl, saving, lock]);

  /* ------------------------------------------------------------- align */
  const align = useCallback(
    (kind) => {
      const items = sel.map((id) => findEl(tpl, id)).filter(Boolean).map((f) => f.el);
      if (items.length < 2) return;
      const minX = Math.min(...items.map((e) => e.x));
      const maxR = Math.max(...items.map((e) => e.x + e.w));
      const minY = Math.min(...items.map((e) => e.y));
      const maxB = Math.max(...items.map((e) => e.y + e.h));
      const first = items[0];
      const sortedX = [...items].sort((a, b) => a.x - b.x);
      const sortedY = [...items].sort((a, b) => a.y - b.y);
      const gapX = (maxR - minX - items.reduce((a, e) => a + e.w, 0)) / (items.length - 1);
      const gapY = (maxB - minY - items.reduce((a, e) => a + e.h, 0)) / (items.length - 1);
      const posX = {};
      const posY = {};
      let cx = minX;
      for (const e of sortedX) {
        posX[e.id] = cx;
        cx += e.w + gapX;
      }
      let cy = minY;
      for (const e of sortedY) {
        posY[e.id] = cy;
        cy += e.h + gapY;
      }
      d.updateEls(sel, (e) => {
        if (e.locked) return;
        if (kind === "left") e.x = minX;
        if (kind === "right") e.x = roundMm(maxR - e.w);
        if (kind === "center") e.x = roundMm((minX + maxR) / 2 - e.w / 2);
        if (kind === "top") e.y = minY;
        if (kind === "bottom") e.y = roundMm(maxB - e.h);
        if (kind === "middle") e.y = roundMm((minY + maxB) / 2 - e.h / 2);
        if (kind === "distH") e.x = roundMm(posX[e.id]);
        if (kind === "distV") e.y = roundMm(posY[e.id]);
        if (kind === "sameW") e.w = first.w;
        if (kind === "sameH") e.h = first.h;
      });
    },
    [sel, tpl, d],
  );

  /* ---------------------------------------------------------- keyboard */
  // Capture phase, and propagation stopped for the keys the designer handles:
  // the app header binds Ctrl+D (role change) on window, which would otherwise
  // fire on top of "duplicate".
  useEffect(() => {
    const onKey = (e) => {
      if (dialog || document.querySelector(".pbxc-back") || document.querySelector(".pbx-tour")) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const stop = () => {
        e.preventDefault();
        e.stopPropagation();
      };
      if (mod && k === "s") {
        stop();
        save();
        return;
      }
      if (isTyping(e)) return;
      if (mod && e.altKey && k === "c" && sel.length === 1) {
        stop();
        const f = findEl(tpl, sel[0]);
        if (f) {
          copyStyleOf(f.el);
          flash("Style copied — Ctrl+Alt+V pastes it");
        }
        return;
      }
      if (mod && e.altKey && k === "v" && sel.length) {
        stop();
        if (pasteStyleTo(d, sel)) flash(`Style pasted on ${sel.length} element${sel.length === 1 ? "" : "s"}`);
        else flash("Copy a style first (Ctrl+Alt+C)");
        return;
      }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        stop();
        setDialog({ kind: "shortcuts" });
        return;
      }
      if (mod && k === "z") {
        stop();
        if (e.shiftKey) d.redo();
        else d.undo();
      } else if (mod && k === "y") {
        stop();
        d.redo();
      } else if (mod && k === "c" && sel.length) {
        stop();
        if (d.copy(sel)) flash(`${sel.length} copied`);
      } else if (mod && k === "x" && sel.length) {
        stop();
        if (d.copy(sel)) d.deleteEls(sel);
      } else if (mod && k === "v" && d.state.clipboard) {
        stop();
        d.paste(d.state.band);
      } else if (mod && k === "d" && sel.length) {
        stop();
        d.duplicate(sel);
      } else if (mod && k === "a") {
        stop();
        const b = tpl.bands.find((x) => x.id === d.state.band) || tpl.bands.find((x) => sel.length && x.elements.some((el) => el.id === sel[0]));
        if (b) d.select(b.elements.map((el) => el.id), b.id);
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel.length) {
        stop();
        d.deleteEls(sel);
      } else if (e.key === "Escape" && (sel.length || d.state.band)) {
        stop();
        d.select([], null);
      } else if (e.key.startsWith("Arrow") && sel.length) {
        stop();
        const step = e.shiftKey ? 5 : e.altKey ? 0.1 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        d.nudge(sel, dx, dy);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [d, sel, tpl, dialog, save, flash]);

  useEffect(() => {
    const before = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);

  /* ----------------------------------------------------------- actions */
  const uploadAsset = async (file, tag = "image") => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Images are limited to 2 MB");
      return null;
    }
    const dataUrl = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const r = await pbUploadAsset({ name: file.name, dataUrl, tag });
    if (!r?.success) {
      toast.error(r?.message || "Upload failed");
      return null;
    }
    const a = await pbAssets("");
    if (a?.success) setAssets(a.data || []);
    // make the new image visible in the canvas before the next sample fetch
    setSample((s) => ({ ...(s || {}), assets: { ...((s && s.assets) || {}), [r.data.assetKey]: dataUrl } }));
    return r.data.assetKey;
  };

  const serverPdf = async (template = tpl) => {
    const r = await pbPreviewPdf({ template: JSON.stringify(template), datasourceCode: meta?.datasourceCode, params: sampleParams, duplicate, lang: previewLang });
    if (!r?.success) {
      toast.error(r?.message || "The server could not render the PDF");
      return;
    }
    if (r.data?.format === "html") toast.warn(r.message);
    if (r.data?.translation) setLanguage((l) => (l ? { ...l, coverage: r.data.translation } : l));
    RedirectURL(r.data.pdfUrl);
  };

  /** The draft exported by the server (Word / Excel / image), opened as a download. */
  const serverExport = async (format, template = tpl) => {
    const r = await pbPreviewExport({ template: JSON.stringify(template), datasourceCode: meta?.datasourceCode, params: sampleParams, format, lang: previewLang });
    if (!r?.success) {
      toast.error(r?.message || "Export failed");
      return;
    }
    window.open(pbFileUrl(r.data.fileUrl), "_blank");
  };

  /** A one-click fix from the publish dialog: a template edit (undoable) or a parameter added to the datasource. */
  const applyFix = async (fix) => {
    if (fix.apply) {
      d.update((t) => {
        fix.apply(t);
      }, null);
      flash(`Fixed: ${fix.label}`);
      return;
    }
    if (fix.addParam && datasource) {
      const def = { ...dsDef, params: [...(dsDef.params || []), { name: fix.addParam, label: fix.addParam, type: "string", required: false }] };
      const r = await pbSaveDatasource({ code: datasource.dsCode, name: datasource.name, kind: datasource.kind, definition: JSON.stringify(def) });
      if (r?.success) {
        await loadDatasources();
        flash(`Parameter ${fix.addParam} added to ${datasource.dsCode}`);
      } else toast.error(r?.message || "Could not update the datasource");
    }
  };

  /** A linked block section gets the block's current contents. */
  const refreshBlock = async (el) => {
    const blk = await findBlock(el.blockCode);
    if (!blk) {
      toast.error(`Block ${el.blockCode} no longer exists`);
      return;
    }
    const kids = blockElements(blk, 0, 0, el.w);
    d.updateEls([el.id], (x) => {
      x.children = kids;
      x.w = fitWidth(blk, el.w) || Math.max(x.w, Number(blk.width) || x.w);
      x.h = Math.max(x.h, Number(blk.height) || x.h);
    });
    flash(`${blk.name} updated from the library`);
  };

  const compareVersions = async (a, b) => {
    const [ra, rb] = await Promise.all([pbVersion(meta.code, a), b ? pbVersion(meta.code, b) : Promise.resolve(null)]);
    if (!ra?.success || (b && !rb?.success)) {
      toast.error(ra?.message || rb?.message || "Could not load the versions");
      return;
    }
    setDialog({
      kind: "diff",
      left: { title: `v${a}`, template: normalizeTemplate(JSON.parse(ra.data.template)) },
      right: b ? { title: `v${b}`, template: normalizeTemplate(JSON.parse(rb.data.template)) } : { title: "draft", template: tpl },
    });
  };

  const overlayUrl = tpl?.designOverlay?.assetKey
    ? sample?.assets?.[tpl.designOverlay.assetKey] || pbFileUrl(pbAssetPath(tpl.designOverlay.assetKey))
    : null;

  const publish = async (note) => {
    if (dirty && !(await save())) return;
    const r = await pbPublishTemplate(meta.code, note);
    if (!r?.success) {
      toast.error(r?.message || "Publish failed");
      return;
    }
    d.saved({ publishedVersionNo: r.data.versionNo, status: "published" });
    toast.success(`Published version ${r.data.versionNo} — it prints from now on`);
    setDialog(null);
  };

  const reload = async () => {
    const t = await pbTemplate(code);
    if (t?.success) {
      const m = { ...t.data };
      delete m.template;
      d.load(normalizeTemplate(JSON.parse(t.data.template)), m);
    }
  };

  const openLeft = (tab) => {
    setLeftTab(tab);
    if (collapsed.left) setPanel("left", false);
  };
  const toggleGuide = (v) => {
    setGuideOpen(v);
    rememberGuide(v);
  };
  /** A build-guide "Do it" button. */
  const guideAction = (action) => {
    if (action === "data") openLeft("data");
    else if (action === "createDs") setDialog({ kind: "datasource", code: meta?.datasourceCode || null });
    else if (action === "preview") setDialog({ kind: "preview" });
    else if (action === "publish") setDialog({ kind: "publish" });
    else if (action === "problems") {
      const p = problems.errors[0] || problems.warnings[0];
      if (p?.where?.element) d.select([p.where.element], p.where.band);
      else if (p?.where?.band) d.select([], p.where.band);
      if (p) flash(p.message);
    } else if (action.startsWith("band:")) {
      const type = action.slice(5);
      const b = tpl.bands.find((x) => x.type === type);
      openLeft(type === "reportHeader" || type === "pageHeader" ? "blocks" : type === "pageFooter" ? "insert" : "data");
      if (b) {
        d.select([], b.id);
        document.querySelector(`[data-band-id="${b.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        flash("Section selected — drag fields, tiles or blocks into it");
      } else flash("This template has no such section yet — add it from Properties → Sections");
    }
  };

  if (error)
    return (
      <div className="pbx pbx-error-page">
        <Icon name="alert" size={28} />
        <p>{error}</p>
        <Tap tone="primary" onClick={() => navigate("/print-builder")}>
          Back to templates
        </Tap>
      </div>
    );
  if (!tpl) return <div className="pbx pbx-loading">Loading template…</div>;

  const guideList = guideItems({ tpl, meta, sample, problems, previewed: previewed || meta.status === "published" });
  const statusChip = meta.status === "published" ? `Published v${meta.publishedVersionNo}` : meta.status === "modified" ? `v${meta.publishedVersionNo} live · draft changed` : "Draft";

  return (
    <div className="pbx pbx-designer">
      <header className="pbx-top">
        <div className="pbx-tb-id">
          <Tap className="is-icon pbx-tb-back" tone="list" onClick={async () => {
            if (dirty && !(await pbConfirm({ title: "Leave without saving?", message: "Your changes since the last save will be lost.", confirmLabel: "Leave", cancelLabel: "Stay", tone: "warn", icon: "leave" }))) return;
            navigate("/print-builder");
          }} title="Back to templates">
            <Icon name="back" size={16} />
          </Tap>
          <div className="pbx-top-title" title={`${meta.name} (${meta.code})`}>
            <b>{meta.name}</b>
            <span className="pbx-tb-meta">
              <span className={`pbx-status is-${meta.status}`}>{statusChip}</span>
              {dirty && <span className="pbx-dirty" title="Unsaved changes">● unsaved</span>}
            </span>
          </div>
        </div>

        <div className="pbx-tb-group" aria-label="Paper">
          <Tap tone="list" onClick={() => setDialog({ kind: "page" })} title="Master paper, default output paper, margins">
            <Icon name="page" size={14} /> {masterLabel}
            {(tpl.page.size !== masterPage(tpl.page).size || (tpl.page.orientation || "portrait") !== (masterPage(tpl.page).orientation || "portrait")) && (
              <small title="Default output paper"> → {tpl.page.size}{tpl.page.orientation === "landscape" ? " ⟲" : ""}</small>
            )}
          </Tap>
          <Select
            className="pbx-viewsel"
            value={viewPaper}
            onChange={setViewPaper}
            title="See the automatic layout on another paper (edit only on the master)"
            options={[{ value: "", label: `${masterLabel} master (edit)` }, ...VIEW_OPTIONS.filter((o) => o.value !== masterView).map((o) => ({ value: o.value, label: `View on ${o.label}` }))]}
          />
        </div>

        <div className="pbx-tb-group" aria-label="History">
          <Tap className="is-icon" tone="list" onClick={d.undo} disabled={!past.length} title="Undo (Ctrl+Z)">
            <Icon name="undo" size={15} />
          </Tap>
          <Tap className="is-icon" tone="list" onClick={d.redo} disabled={!future.length} title="Redo (Ctrl+Y)">
            <Icon name="redo" size={15} />
          </Tap>
        </div>

        <div className="pbx-tb-group pbx-zoom" aria-label="Zoom">
          <Tap className="is-icon" tone="list" onClick={() => setZoom(ZOOMS[Math.max(0, ZOOMS.indexOf(zoom) - 1)] || 0.5)} title="Zoom out">
            <Icon name="minus" size={13} />
          </Tap>
          <Tap className="pbx-zoom-val" onClick={() => setZoom(1)} title="Reset to 100%">
            {Math.round(zoom * 100)}%
          </Tap>
          <Tap className="is-icon" tone="list" onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + 1)] || 1)} title="Zoom in">
            <Icon name="plus" size={13} />
          </Tap>
        </div>

        <div className="pbx-tb-group pbx-tb-seg" role="tablist" aria-label="Canvas shows">
          <Tap className="pbx-seg-item" active={showData} onClick={() => setShowData(true)} title="Show sample values">
            Data
          </Tap>
          <Tap className="pbx-seg-item" active={!showData} onClick={() => setShowData(false)} title="Show the bindings">
            {"{ }"}<span className="pbx-tb-label"> Bindings</span>
          </Tap>
        </div>

        <span className="pbx-top-fill" />

        <div className="pbx-tb-group" aria-label="Tools">
          <Tap className={`is-icon${tpl.designOverlay?.assetKey ? " is-active" : ""}`} tone="list" onClick={() => setDialog({ kind: "overlay" })} title="Overlay the old print under the page">
            <Icon name="overlay" size={15} />
          </Tap>
          <Tap className="pbx-tb-guide" tone="list" onClick={() => setTour({ start: "welcome" })} title="Guided tour: how to build a print">
            <Icon name="sparkle" size={14} /><span className="pbx-tb-label"> How to build</span>
          </Tap>
          <Tap className="is-icon" tone="list" onClick={() => setDialog({ kind: "shortcuts" })} title="Keyboard shortcuts (?)">
            <Icon name="keyboard" size={15} />
          </Tap>
          <Tap className="is-icon" tone="list" onClick={() => setDialog({ kind: "api" })} title="API and payload that print this template">
            <Icon name="code" size={15} />
          </Tap>
          <Tap className="is-icon" tone="list" onClick={() => setDialog({ kind: "versions" })} title="Versions and rollback">
            <Icon name="history" size={15} />
          </Tap>
        </div>

        <span className="pbx-top-sep" />

        <div className="pbx-tb-actions">
          <Tap tone="peek" data-tour="preview" onClick={() => setDialog({ kind: "preview" })} title="Paginated preview — the same engine the server prints with">
            <Icon name="eye" size={14} /><span className="pbx-tb-label"> Preview</span>
          </Tap>
          <Tap tone="add" onClick={save} disabled={saving} title="Save draft (Ctrl+S)">
            <Icon name="save" size={14} /><span className="pbx-tb-label"> {saving ? "Saving…" : "Save draft"}</span>
          </Tap>
          <Tap tone="primary" data-tour="publish" onClick={() => setDialog({ kind: "publish" })} title="Validate and publish a new version">
            <Icon name="rocket" size={14} /> Publish
          </Tap>
        </div>
      </header>

      {lock && lock.mine === false && (
        <div className="pbx-lockbar">
          <Icon name="lock" size={14} />
          <span>
            <b>{lock.lockedByName || lock.lockedBy}</b> is editing this template{lock.since ? ` since ${String(lock.since).replace("T", " ").slice(11, 16)}` : ""}. Your changes are not saved automatically; saving may conflict with theirs.
          </span>
          <Tap tone="mode" className="is-small" onClick={takeOver} title="Take the lock (they will be told when they save)">
            Take over
          </Tap>
        </div>
      )}
      <div
        className={`pbx-body${collapsed.left ? " is-left-collapsed" : ""}${collapsed.right ? " is-right-collapsed" : ""}`}
        ref={bodyRef}
        style={bodyStyle}
      >
        <LeftPanel
          tab={leftTab}
          onTab={setLeftTab}
          datasource={datasource}
          sampleParams={sampleParams}
          setSampleParams={setSampleParams}
          duplicate={duplicate}
          setDuplicate={setDuplicate}
          onFetch={() => fetchSample()}
          onFetchWith={(p) => fetchSample(datasource?.dsCode, p)}
          fetching={fetching}
          sample={sample}
          schema={schema}
          sampleInfo={sampleInfo}
          onEditDatasource={(dsCode) => setDialog({ kind: "datasource", code: dsCode })}
          onStatus={flash}
        />
        <main className="pbx-canvas" ref={scrollRef} onPointerDown={(e) => e.target === e.currentTarget && d.select([], null)}>
          {viewPaper ? (
            <PaperPreview template={tpl} sample={previewSample} duplicate={duplicate} view={viewPaper} masterLabel={masterLabel} onBack={() => setViewPaper("")} />
          ) : (
            <Canvas zoom={zoom} showData={showData} sample={sample} onStatus={flash} sources={sources} overlay={tpl.designOverlay} overlayUrl={overlayUrl} />
          )}
        </main>
        <aside className="pbx-right">
          <div className="pbx-right-guide">
            <span>Properties</span>
            <Tap tone="list" className="is-small pbx-right-guide-btn" onClick={() => setTour({ start: "panel", steps: panelTourSteps(), remember: false, finishLabel: "Got it", label: "Panel guide" })} title="Step-by-step: what each part of this panel does">
              <Icon name="sparkle" size={12} /> Explain this panel
            </Tap>
          </div>
          <PropertyPanel
            schema={schema}
            datasources={datasources}
            assets={assets}
            onUploadAsset={uploadAsset}
            onEditDatasource={(dsCode) => setDialog({ kind: "datasource", code: dsCode })}
            onPageSetup={() => setDialog({ kind: "page" })}
            align={align}
            sample={sample}
            onManage={(k) => setDialog({ kind: k })}
            onRefreshBlock={refreshBlock}
          />
        </aside>
        {collapsed.left ? (
          <PanelRail
            side="left"
            label="Insert · Data · Blocks"
            items={LEFT_TABS}
            onExpand={(id) => {
              if (id) setLeftTab(id);
              setPanel("left", false);
            }}
          />
        ) : (
          <Splitter side="left" containerRef={bodyRef} onCollapse={() => setPanel("left", true)} />
        )}
        {collapsed.right ? (
          <PanelRail side="right" label="Properties" items={[{ id: "props", label: "Properties", icon: "brush", tone: "violet" }]} onExpand={() => setPanel("right", false)} />
        ) : (
          <Splitter side="right" containerRef={bodyRef} onCollapse={() => setPanel("right", true)} />
        )}
      </div>

      <footer className="pbx-statusbar">
        <GuideChip items={guideList} open={guideOpen} onToggle={() => toggleGuide(!guideOpen)} />
        <span className="pbx-status-msg">{status || (sel.length ? `${sel.length} selected · arrows nudge (Shift ×5, Alt fine) · Ctrl+D duplicate` : "Drag from Insert or Data onto a band · click a band label for its settings")}</span>
        <span className="pbx-top-fill" />
        {lock?.mine && <span className="pbx-chip kind-row" title="Nobody else can take this template while you edit it">editing · locked to you</span>}
        {autoSavedAt && !dirty && <span className="pbx-chip kind-param" title="Drafts save themselves every 30 seconds">auto-saved {autoSavedAt.toTimeString().slice(0, 5)}</span>}
        {engineDrift && (
          <span className="pbx-chip kind-fn" title="The API's PrintBuilder/Engine/printEngine.js differs from this build's engine. Run engine/sync-to-api.mjs.">
            engine out of sync with API
          </span>
        )}
        <CoverageChip coverage={language?.coverage} onRefresh={() => loadLanguage(tpl)} />
        <Tap
          className={`pbx-problems${problems.errors.length ? " has-errors" : problems.warnings.length ? " has-warnings" : ""}`}
          onClick={() => {
            const p = problems.errors[0] || problems.warnings[0];
            if (p?.where?.element) d.select([p.where.element], p.where.band);
            else if (p?.where?.band) d.select([], p.where.band);
            if (p) flash(p.message);
          }}
          title={[...problems.errors, ...problems.warnings].map((p) => p.message).join("\n") || "No problems"}
        >
          <Icon name={problems.errors.length ? "alert" : "check"} size={13} />
          {problems.errors.length} errors · {problems.warnings.length} warnings
        </Tap>
      </footer>

      {dialog?.kind === "page" && <PageSetupDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "shortcuts" && <ShortcutsDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "api" && (
        <ApiDialog
          meta={meta}
          datasource={datasource}
          sampleParams={sampleParams}
          duplicate={duplicate}
          template={tpl}
          sample={sample}
          onDatasourceSaved={async (samples) => {
            await loadDatasources();
            setSampleParams(samples);
            fetchSample(datasource?.dsCode, samples, tpl, true);
          }}
          onPublish={() => setDialog({ kind: "publish" })}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "preview" && (
        <PreviewDialog
          template={dialog.template || tpl}
          title={dialog.title || meta.name}
          sample={sample}
          duplicate={duplicate}
          lang={previewLang}
          languages={languages}
          onLang={setPreviewLang}
          language={language}
          onRefreshLanguage={() => loadLanguage(dialog.template || tpl)}
          onServerPdf={() => serverPdf(dialog.template || tpl)}
          onServerExport={(f) => serverExport(f, dialog.template || tpl)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "publish" && (
        <PublishDialog
          template={tpl}
          schema={schema}
          onValidateServer={async () => {
            const r = await pbValidateTemplate(JSON.stringify(tpl), meta.datasourceCode);
            return r?.success ? r.data : { errors: [{ message: r?.message || "Server validation failed" }] };
          }}
          onPublish={publish}
          onFix={applyFix}
          onPick={(el, band) => {
            setDialog(null);
            if (el) d.select([el], band);
            else if (band) d.select([], band);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "versions" && (
        <VersionsDialog
          code={meta.code}
          load={async () => {
            const r = await pbVersions(meta.code);
            return r?.success ? r.data || [] : [];
          }}
          onActivate={async (no) => {
            const r = await pbActivateVersion(meta.code, no);
            if (r?.success) {
              toast.success(r.message);
              d.setMeta({ publishedVersionNo: no }, true);
            } else toast.error(r?.message);
          }}
          onRestore={async (no) => {
            if (dirty && !(await pbConfirm({ title: `Restore version ${no}?`, message: "It replaces your unsaved draft. The draft cannot be brought back.", confirmLabel: "Restore", tone: "warn", icon: "replace" }))) return;
            const r = await pbRestoreVersion(meta.code, no);
            if (r?.success) {
              await reload();
              toast.success(r.message);
              setDialog(null);
            } else toast.error(r?.message);
          }}
          onPreview={async (no) => {
            const r = await pbVersion(meta.code, no);
            if (r?.success) setDialog({ kind: "preview", template: normalizeTemplate(JSON.parse(r.data.template)), title: `Version ${no}` });
          }}
          onCompare={compareVersions}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "diff" && <VersionDiffDialog left={dialog.left} right={dialog.right} sample={sample} onClose={() => setDialog({ kind: "versions" })} />}
      {dialog?.kind === "access" && <AccessDialog code={meta.code} onClose={() => setDialog(null)} />}
      {dialog?.kind === "variants" && <VariantsDialog code={meta.code} params={schema?.params || (dsDef.params || []).map((p) => p.name)} onClose={() => setDialog(null)} />}
      {dialog?.kind === "whereUsed" && <WhereUsedDialog code={meta.code} onClose={() => setDialog(null)} />}
      {dialog?.kind === "compare" && <LegacyCompareDialog template={tpl} datasourceCode={meta.datasourceCode} sampleParams={sampleParams} def={dsDef} onClose={() => setDialog(null)} />}
      {dialog?.kind === "batch" && <BatchDialog code={meta.code} def={dsDef} sampleParams={sampleParams} onClose={() => setDialog(null)} />}
      {dialog?.kind === "overlay" && (
        <OverlayDialog
          overlay={tpl.designOverlay}
          sampleParams={sampleParams}
          onUpload={uploadAsset}
          onChange={(ov) =>
            d.update((t) => {
              if (ov) t.designOverlay = ov;
              else delete t.designOverlay;
            }, "overlay")
          }
          onClose={() => setDialog(null)}
        />
      )}
      {guideOpen && !tour && (
        <BuildGuide
          items={guideList}
          onAction={guideAction}
          onShowMe={(start) => setTour({ start })}
          onTour={() => setTour({ start: "welcome" })}
          onClose={() => toggleGuide(false)}
        />
      )}
      {tour && (
        <Tour
          key={tour.steps ? "panel" : "build"}
          start={tour.start}
          steps={tour.steps}
          remember={tour.remember !== false}
          finishLabel={tour.finishLabel}
          label={tour.label}
          onTab={openLeft}
          onClose={(finished) => {
            setTour(false);
            if (finished && !tour.steps) toggleGuide(true); // end of the build tour → the checklist takes over
          }}
        />
      )}
      {dialog?.kind === "datasource" && (
        <DatasourceDialog
          datasource={datasources.find((x) => sameCode(x.dsCode, dialog.code)) || null}
          onSaved={async (ds) => {
            await loadDatasources();
            if (!meta.datasourceCode || meta.datasourceCode !== ds.dsCode) {
              d.setMeta({ datasourceCode: ds.dsCode });
              d.update((t) => {
                t.datasource = ds.dsCode;
              });
            }
            const sp = initialParams(ds);
            setSampleParams(sp);
            setDialog(null);
            fetchSample(ds.dsCode, sp);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

/** Field schema from either casing (stored JSON or the MVC response). */
function normalizeSchema(s) {
  if (!s) return null;
  return { sets: s.sets || s.Sets || {}, params: s.params || s.Params || [], rootFields: s.rootFields || s.RootFields || [] };
}

/** Calculated fields join their row set's field list (or the root fields). */
function withCalculated(schema, calc) {
  if (!schema || !Array.isArray(calc) || !calc.length) return schema;
  const sets = { ...schema.sets };
  const rootFields = [...(schema.rootFields || [])];
  for (const c of calc) {
    if (!c?.name) continue;
    if (c.set) sets[c.set] = [...new Set([...(sets[c.set] || []), c.name])];
    else if (!rootFields.includes(c.name)) rootFields.push(c.name);
  }
  return { ...schema, sets, rootFields };
}
