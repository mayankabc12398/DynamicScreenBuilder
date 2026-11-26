/**
 * Builder dialogs: page setup, preview, publish (with validation), versions.
 *
 * Preview renders the print document — engine shell, embedded fonts, the
 * template and the sample data — in an iframe. The API prints that same
 * document with the same engine, so this is the PDF, page for page.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { PAGE_SIZES, exportData, findDuplicates, masterPage, perPaperFlags, resolveLayout, toSingleMaster, validateTemplate } from "../engine/printEngine";
import { previewHtml } from "../engine/runtime";
import { PAGE_SIZE_OPTIONS } from "../model/defaults";
import { useDesigner } from "../model/useDesigner";
import { NumberInput, Row, Segmented, Select, TextArea, TextInput } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { suggestFix } from "./fixes";
import { CoverageChip, LanguageSelect, withLanguage } from "./PrintLanguage";
import { pbConfirm } from "../ui/confirm";

export function Modal({ title, icon, onClose, children, footer, wide = false, full = false }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="pbx-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`pbx-modal${wide ? " is-wide" : ""}${full ? " is-full" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="pbx-modal-head">
          {icon && <Icon name={icon} size={17} />}
          <b>{title}</b>
          <Tap className="is-icon pbx-modal-x" tone="list" onClick={onClose} title="Close (Esc)">
            <Icon name="close" size={14} />
          </Tap>
        </header>
        <div className="pbx-modal-body">{children}</div>
        {footer && <footer className="pbx-modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

/* ========================================================== page setup */

export function PageSetupDialog({ onClose }) {
  const d = useDesigner();
  const tpl = d.state.tpl;
  const page = tpl.page || {};
  const m = page.margins || {};
  const master = masterPage(page);
  const hasMaster = !!(page.master && page.master.size);
  const masterRoll = master.size === "Thermal80" || master.size === "Thermal58";
  const outRoll = page.size === "Thermal80" || page.size === "Thermal58";
  // The template is designed once, on its master paper; "Default output paper" is only what the
  // API prints on when nobody asks for another. Changing it on a template without a master pins
  // the paper it was drawn on as its master first, so nothing it already has moves.
  const setOutput = (patch) =>
    d.update((t) => {
      const pg = t.page || {};
      const pin = pg.master && pg.master.size ? {} : { master: { size: pg.size || "A4", orientation: pg.orientation || "portrait", ...(pg.size === "Custom" ? { width: pg.width, height: pg.height } : {}) } };
      t.page = { ...pg, ...pin, ...patch };
    }, `page:${Object.keys(patch).join(",")}`);
  const setM = (k, v) => d.update((t) => {
    t.page = { ...t.page, margins: { ...(t.page.margins || {}), [k]: v ?? 0 } };
  }, `page:margins`);
  const preset = (v) => d.update((t) => {
    t.page = { ...t.page, margins: { top: v, right: v, bottom: v, left: v } };
  }, "page:margins");
  const out = resolveLayout(tpl);
  const flags = perPaperFlags(tpl);
  const dups = findDuplicates(tpl);
  const convert = async () => {
    const { template, removed, flagsDropped } = toSingleMaster(tpl);
    if (!(await pbConfirm({
      title: "Convert to single master?",
      message: `${removed.length} per-paper cop${removed.length === 1 ? "y" : "ies"} will be deleted (the master keeps its own) and ${flagsDropped} per-paper flag(s) dropped. Every other paper is then laid out from the master automatically.`,
      confirmLabel: "Convert",
      cancelLabel: "Cancel",
      icon: "page",
    }))) return;
    d.update((t) => {
      t.bands = template.bands;
      t.page = { ...template.page, master: template.page.master || { size: template.page.size || "A4", orientation: template.page.orientation || "portrait" } };
    }, "single-master");
    toast.success(`Single master: ${removed.length} cop${removed.length === 1 ? "y" : "ies"} removed — ${removed.map((r) => `${r.type} ${r.id}`).slice(0, 6).join(", ")}${removed.length > 6 ? "…" : ""}`);
  };
  const size = PAGE_SIZES[master.size] || PAGE_SIZES.A4;
  let w = master.size === "Custom" ? master.width || 210 : size.w;
  let h = master.size === "Custom" ? master.height || 297 : size.h;
  if (!masterRoll && master.orientation === "landscape") [w, h] = [h, w];
  const k = 120 / Math.max(w, h || w * 2);
  return (
    <Modal title="Page setup" icon="page" onClose={onClose} footer={<Tap tone="primary" onClick={onClose}>Done</Tap>}>
      <div className="pbx-pagesetup">
        <div className="pbx-pagesetup-form">
          <div className="pbx-col-sub">Design master</div>
          <p className="pbx-note">
            <b>
              {master.size || "A4"} {masterRoll ? "" : master.orientation || "portrait"}
            </b>{" "}
            — the only paper the template is edited on. Every other paper (A5, Letter, Legal, thermal rolls, custom, landscape) is laid out from it
            automatically: use <i>View on …</i> in the toolbar to see one.
            {!hasMaster && " (This template is its own master; changing the output paper below pins it.)"}
          </p>
          <div className="pbx-col-sub">Margins of the master (mm)</div>
          <div className="pbx-grid4">
            {["top", "right", "bottom", "left"].map((key) => (
              <label key={key} className="pbx-mini">
                <span>{key}</span>
                <NumberInput value={m[key] ?? 10} onChange={(v) => setM(key, v)} step={1} min={0} />
              </label>
            ))}
          </div>
          <div className="pbx-inline">
            <Tap tone="list" className="is-small" onClick={() => preset(masterRoll ? 2 : 6)}>
              Narrow
            </Tap>
            <Tap tone="list" className="is-small" onClick={() => preset(masterRoll ? 3 : 10)}>
              Normal
            </Tap>
            <Tap tone="list" className="is-small" onClick={() => preset(masterRoll ? 5 : 20)}>
              Wide
            </Tap>
          </div>
          <div className="pbx-col-sub">Default output paper</div>
          <Row label="Paper">
            <Select value={page.size || "A4"} onChange={(v) => setOutput({ size: v })} options={PAGE_SIZE_OPTIONS} />
          </Row>
          {page.size === "Custom" && (
            <>
              <Row label="Width">
                <NumberInput value={page.width ?? 210} onChange={(v) => setOutput({ width: v })} step={1} suffix="mm" />
              </Row>
              <Row label="Height">
                <NumberInput value={page.height ?? 297} onChange={(v) => setOutput({ height: v })} step={1} suffix="mm" />
              </Row>
            </>
          )}
          {!outRoll && (
            <Row label="Orientation">
              <Segmented
                value={page.orientation || "portrait"}
                onChange={(v) => setOutput({ orientation: v })}
                options={[
                  { value: "portrait", label: "Portrait" },
                  { value: "landscape", label: "Landscape" },
                ]}
              />
            </Row>
          )}
          <p className="pbx-note">
            Prints as <b>{out.profile}</b> · printable width {Math.round(out.contentWidth * 10) / 10} mm
            {out.profile !== out.designProfile ? ` — laid out automatically from the master (margins ${out.margins.left}/${out.margins.right} mm, text ×${out.fontScale.toFixed(2)})` : ""}.
            {outRoll ? " Thermal rolls print as one continuous page as long as the content." : ""}
          </p>
          {(flags.length > 0 || dups.length > 0) && (
            <div className="pbx-note is-warn">
              This template still has {flags.length} per-paper flag(s){dups.length ? ` and ${dups.length} duplicate control(s)` : ""} from the old per-paper model; it cannot be
              published until it is a single master.{" "}
              <Tap tone="primary" className="is-small" onClick={convert}>
                Convert to single master
              </Tap>
            </div>
          )}
        </div>
        <div className="pbx-pagesetup-thumb">
          <div className="pbx-thumb" style={{ width: w * k, height: (masterRoll ? w * 1.6 : h) * k }}>
            <div
              className="pbx-thumb-m"
              style={{ left: (m.left ?? 10) * k, top: (m.top ?? 10) * k, right: (m.right ?? 10) * k, bottom: (m.bottom ?? 10) * k }}
            />
          </div>
          <small>
            master {Math.round(w * 10) / 10} × {masterRoll ? "auto" : Math.round(h * 10) / 10} mm
          </small>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================ preview */

/** Saves a Blob as a file (a temporary link). */
export function saveBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 800);
}
const fileStem = (t) => String(t || "print").replace(/[^\w-]+/g, "_").slice(0, 40);

/** The print's tables and fields as .xlsx, in the browser (engine exportData → SheetJS). */
export async function exportExcel(template, data, title) {
  const XLSX = await import("xlsx");
  const { sheets } = exportData(template, data);
  if (!sheets.length) {
    toast.info("Nothing to export: add a table, a detail band or fields.");
    return;
  }
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([s.columns, ...s.rows]);
    ws["!cols"] = s.columns.map((c, i) => ({ wch: Math.min(60, Math.max(8, String(c).length + 2, ...s.rows.slice(0, 200).map((r) => String(r[i] ?? "").length + 1))) }));
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileStem(title)}.xlsx`);
}

/** Every page of the preview as a PNG (html2canvas on the iframe's pages). */
export async function exportImages(frame, title) {
  const doc = frame?.contentDocument;
  const pages = doc ? Array.from(doc.querySelectorAll(".pb-page")).slice(0, 20) : [];
  if (!pages.length) return;
  const html2canvas = (await import("html2canvas")).default;
  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", logging: false });
    await new Promise((res) => canvas.toBlob((b) => (b && saveBlob(b, `${fileStem(title)}-p${i + 1}.png`), res()), "image/png"));
  }
}

/**
 * lang / languages / onLang: the Language select (designer/PrintLanguage.jsx); `language` is that
 * language's { i18n, lang, coverage } (fetchLanguage), printed in place of the sample's own.
 */
export function PreviewDialog({ template, sample, duplicate, onServerPdf, onServerExport, onClose, title = "Preview", lang, languages, onLang, language, onRefreshLanguage }) {
  const frame = useRef(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const data = useMemo(() => {
    const base = withLanguage(sample ? JSON.parse(JSON.stringify(sample)) : {}, language);
    base.sys = { ...(base.sys || {}), duplicate };
    return base;
  }, [sample, duplicate, language]);
  // "Template paper" or any other: the engine reflows the same template, as ?paper= does on the API
  const [paper, setPaper] = useState("");
  const [custom, setCustom] = useState({ w: 100, h: 150 });
  const [land, setLand] = useState(false);
  const paperOpt = useMemo(
    () => (paper ? { size: paper, orientation: land ? "landscape" : "portrait", ...(paper === "Custom" ? { width: custom.w, height: custom.h } : {}) } : undefined),
    [paper, land, custom],
  );
  const html = useMemo(() => previewHtml(template, data, paperOpt ? { paper: paperOpt } : {}), [template, data, paperOpt]);
  useEffect(() => {
    const on = (e) => {
      if (e.data && e.data.type === "pb-rendered" && frame.current && e.source === frame.current.contentWindow) setResult(e.data.result);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);
  return (
    <Modal
      title={title}
      icon="eye"
      full
      onClose={onClose}
      footer={
        <>
          <span className="pbx-preview-paper">
            <Select value={paper} onChange={(v) => setPaper(v)} options={[{ value: "", label: `Template paper (${template?.page?.size || "A4"})` }, ...PAGE_SIZE_OPTIONS]} />
            {paper === "Custom" && (
              <>
                <NumberInput value={custom.w} onChange={(v) => setCustom((c) => ({ ...c, w: v || 100 }))} step={1} suffix="mm" />
                <NumberInput value={custom.h} onChange={(v) => setCustom((c) => ({ ...c, h: v || 150 }))} step={1} suffix="mm" />
              </>
            )}
            {paper && !paper.startsWith("Thermal") && (
              <Tap tone="list" className="is-small" onClick={() => setLand((x) => !x)} title="Orientation">
                {land ? "Landscape" : "Portrait"}
              </Tap>
            )}
          </span>
          <span className="pbx-preview-stat">
            {result ? (
              result.ok ? (
                <>
                  <Icon name="check" size={14} /> {result.profile ? `${result.profile} · ` : ""}{result.pages} page{result.pages === 1 ? "" : "s"} · {Math.round(result.widthMm)} × {Math.round(result.heightMm)} mm
                  {result.overflow?.length ? <em className="is-warn"> · cut off: {result.overflow[0]}{result.overflow.length > 1 ? ` (+${result.overflow.length - 1})` : ""}</em> : null}
                  {result.errors?.length ? <em className="is-warn"> · {result.errors.length} expression problem(s): {result.errors[0]}</em> : null}
                </>
              ) : (
                <em className="is-error">{(result.errors || []).join(" · ")}</em>
              )
            ) : (
              "Laying out pages…"
            )}
            {!sample && <em className="is-warn"> · no sample data — fields print empty</em>}
          </span>
          {onLang && (
            <>
              <LanguageSelect value={lang} onChange={onLang} languages={languages} />
              <CoverageChip coverage={language?.coverage} onRefresh={onRefreshLanguage} />
            </>
          )}
          <span className="pbx-exportbar">
            <Tap className="tone-excel is-small" onClick={() => exportExcel(template, data, title)} title="The tables and fields as an Excel workbook">
              <Icon name="excel" size={13} /> Excel
            </Tap>
            <Tap className="tone-photo is-small" onClick={() => exportImages(frame.current, title)} title="Each page as a PNG image">
              <Icon name="photo" size={13} /> Image
            </Tap>
            {onServerExport && (
              <Tap className="tone-word is-small" onClick={() => onServerExport("docx")} title="A Word document, page for page (made by the server)">
                <Icon name="word" size={13} /> Word
              </Tap>
            )}
          </span>
          <Tap tone="list" onClick={() => frame.current?.contentWindow?.print()} title="Print from the browser (direct to a printer)">
            <Icon name="printer" size={13} /> Print
          </Tap>
          {onServerPdf && (
            <Tap
              tone="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onServerPdf();
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Icon name="pdf" size={13} /> {busy ? "Rendering…" : "Server PDF"}
            </Tap>
          )}
        </>
      }
    >
      <iframe ref={frame} className="pbx-preview-frame" title="Print preview" srcDoc={html} sandbox="allow-scripts allow-modals allow-same-origin" />
    </Modal>
  );
}

/* ============================================================ publish */

export function PublishDialog({ template, schema, onValidateServer, onPublish, onPick, onClose, onFix }) {
  const [note, setNote] = useState("");
  const [server, setServer] = useState(null);
  const [busy, setBusy] = useState(false);
  const local = useMemo(() => validateTemplate(template, schema ? { sets: schema.sets, params: schema.params } : null), [template, schema]);
  useEffect(() => {
    let live = true;
    onValidateServer().then((r) => live && setServer(r));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const errors = [...local.errors, ...((server?.errors || []).filter((e) => !local.errors.some((l) => l.message === e.message)))];
  const warnings = local.warnings;
  const blocked = errors.length > 0 || !server;
  const fixes = useMemo(() => [...errors, ...warnings].map((x) => ({ x, fix: onFix ? suggestFix(x, template, schema) : null })).filter((f) => f.fix), [errors, warnings, template, schema, onFix]);
  const item = (x, i, kind) => {
    const fix = fixes.find((f) => f.x === x)?.fix;
    return (
    <li key={`${kind}${i}`} className={`pbx-issue is-${kind}`}>
      <Icon name={kind === "error" ? "alert" : "dots"} size={13} />
      <span>{x.message}</span>
      {fix && (
        <Tap tone="add" className="is-small" onClick={() => onFix(fix)} title="Repair it for me">
          <Icon name="wand" size={11} /> {fix.label}
        </Tap>
      )}
      {(x.where?.element || x.element) && (
        <Tap tone="list" className="is-small" onClick={() => onPick(x.where?.element || x.element, x.where?.band || x.band)}>
          Show
        </Tap>
      )}
    </li>
    );
  };
  const autoFixes = fixes.filter((f) => f.fix.apply);
  return (
    <Modal
      title="Publish"
      icon="rocket"
      onClose={onClose}
      footer={
        <>
          <span className="pbx-preview-stat">{!server ? "Checking with the server…" : errors.length ? <em className="is-error">Fix the problems to publish</em> : "Ready — published versions are immutable"}</span>
          <Tap
            tone="primary"
            disabled={blocked || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onPublish(note);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Icon name="rocket" size={13} /> {busy ? "Publishing…" : "Publish new version"}
          </Tap>
        </>
      }
    >
      <p className="pbx-note">
        Publishing saves the draft, checks every binding against the datasource's fields and freezes this layout <b>and the datasource definition</b> as a new version. Only the
        published version prints; you can roll back to any earlier one.
      </p>
      {autoFixes.length > 1 && (
        <Tap tone="add" onClick={() => onFix({ label: "all", apply: (t) => autoFixes.forEach((f) => f.fix.apply(t)) })} title="Apply every suggested repair (undo with Ctrl+Z)">
          <Icon name="wand" size={13} /> Fix {autoFixes.length} automatically
        </Tap>
      )}
      {errors.length > 0 && (
        <>
          <h4 className="pbx-issues-title is-error">{errors.length} problem(s) block publishing</h4>
          <ul className="pbx-issues">{errors.map((e, i) => item(e, i, "error"))}</ul>
        </>
      )}
      {warnings.length > 0 && (
        <>
          <h4 className="pbx-issues-title">{warnings.length} warning(s)</h4>
          <ul className="pbx-issues">{warnings.map((e, i) => item(e, i, "warn"))}</ul>
        </>
      )}
      {!errors.length && server && (
        <div className="pbx-allgood">
          <Icon name="check" size={16} /> All bindings resolve against the datasource.
        </div>
      )}
      <Row label="Change note" wide>
        <TextArea value={note} onChange={setNote} rows={2} placeholder="What changed in this version?" />
      </Row>
    </Modal>
  );
}

/* ============================================================ versions */

export function VersionsDialog({ code, load, onActivate, onRestore, onPreview, onCompare, onClose }) {
  const [rows, setRows] = useState(null);
  const [pick, setPick] = useState([]);
  const refresh = () => load().then(setRows);
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggle = (no) => setPick((p) => (p.includes(no) ? p.filter((x) => x !== no) : [...p, no].slice(-2)));
  return (
    <Modal
      title={`Versions · ${code}`}
      icon="history"
      wide
      onClose={onClose}
      footer={
        onCompare && rows?.length ? (
          <>
            <span className="pbx-preview-stat">Tick two versions to compare them, or one to compare with the draft.</span>
            <Tap tone="map" disabled={pick.length !== 1} onClick={() => onCompare(pick[0], null)}>
              <Icon name="compare" size={13} /> v{pick[0] ?? "?"} → draft
            </Tap>
            <Tap tone="primary" disabled={pick.length !== 2} onClick={() => onCompare(Math.min(...pick), Math.max(...pick))}>
              <Icon name="compare" size={13} /> Compare {pick.length === 2 ? `v${Math.min(...pick)} → v${Math.max(...pick)}` : ""}
            </Tap>
          </>
        ) : null
      }
    >
      {!rows && <p className="pbx-note">Loading…</p>}
      {rows && !rows.length && <p className="pbx-note">Nothing published yet. Publish to create version 1.</p>}
      {rows && rows.length > 0 && (
        <table className="pbx-vtable">
          <thead>
            <tr>
              <th>Version</th>
              <th>Published</th>
              <th>By</th>
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.versionNo} className={v.isActive ? "is-active" : ""}>
                <td>
                  {onCompare && <input type="checkbox" className="pbx-vpick" checked={pick.includes(v.versionNo)} onChange={() => toggle(v.versionNo)} title="Pick to compare" />}
                  <b>v{v.versionNo}</b> {v.isActive && <span className="pbx-chip kind-row">prints</span>}
                </td>
                <td>{String(v.publishedOn || "").replace("T", " ").slice(0, 16)}</td>
                <td>{v.publishedBy}</td>
                <td className="pbx-vnote">{v.note}</td>
                <td className="pbx-vact">
                  <Tap tone="peek" className="is-small" onClick={() => onPreview(v.versionNo)}>
                    Preview
                  </Tap>
                  {!v.isActive && (
                    <Tap tone="mode" className="is-small" onClick={async () => { await onActivate(v.versionNo); refresh(); }} title="Roll back: this version prints from now on">
                      Make live
                    </Tap>
                  )}
                  <Tap tone="list" className="is-small" onClick={() => onRestore(v.versionNo)} title="Copy into the draft to edit">
                    Edit copy
                  </Tap>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

/* ========================================================== shortcuts */

/** [group, icon, tone, rows]; a row is [alternatives, what], each alternative a "+"-joined combo. */
const SHORTCUTS = [
  ["Editing", "brush", "sky", [
    [["Ctrl+S"], "Save draft"],
    [["Ctrl+Z"], "Undo"],
    [["Ctrl+Y", "Ctrl+Shift+Z"], "Redo"],
    [["Ctrl+C", "Ctrl+X", "Ctrl+V"], "Copy, cut, paste elements"],
    [["Ctrl+D"], "Duplicate"],
    [["Delete"], "Delete the selection"],
  ]],
  ["Selecting & moving", "magnet", "violet", [
    [["Click", "Shift+Click"], "Select · add to the selection"],
    [["Ctrl+A"], "Select everything in the band"],
    [["Arrows"], "Nudge 1 mm"],
    [["Shift+Arrows"], "Nudge 5 mm"],
    [["Alt+Arrows"], "Nudge 0.1 mm"],
    [["Esc"], "Clear the selection"],
  ]],
  ["Style", "paint", "amber", [
    [["Ctrl+Alt+C"], "Copy the selected element's style"],
    [["Ctrl+Alt+V"], "Paste that style on the selection"],
  ]],
  ["Data", "database", "teal", [
    [["Double-click a field"], "Bind it to the selected element"],
    [["Drag a result set"], "Make a table of its rows"],
  ]],
  ["Help", "keyboard", "mint", [[["?"], "Open this list"]]],
];

const MODIFIERS = new Set(["Ctrl", "Shift", "Alt"]);
const MOUSE = /^(Click|Double-click|Drag)/;

function Combo({ combo }) {
  const keys = combo.split("+");
  return (
    <span className="pbx-combo">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="pbx-plus">+</span>}
          <kbd className={MODIFIERS.has(k) ? "is-mod" : MOUSE.test(k) ? "is-mouse" : "is-key"}>{k}</kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

export function ShortcutsDialog({ onClose }) {
  return (
    <Modal title="Keyboard shortcuts" icon="keyboard" wide onClose={onClose}>
      <div className="pbx-keys">
        {SHORTCUTS.map(([group, icon, tone, rows]) => (
          <section key={group} className={`pbx-keycard tone-${tone}`}>
            <h4>
              <span className="pbx-keycard-ic">
                <Icon name={icon} size={13} />
              </span>
              {group}
              <span className="pbx-keycard-n">{rows.length}</span>
            </h4>
            <ul>
              {rows.map(([alts, what]) => (
                <li key={what}>
                  <span className="pbx-keywhat">{what}</span>
                  <span className="pbx-keyalts">
                    {alts.map((c, i) => (
                      <React.Fragment key={c}>
                        {i > 0 && <span className="pbx-or">or</span>}
                        <Combo combo={c} />
                      </React.Fragment>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="pbx-keys-legend">
        <kbd className="is-mod">Ctrl</kbd> modifier <kbd className="is-key">S</kbd> key <kbd className="is-mouse">Click</kbd> mouse · press <kbd className="is-key">?</kbd> anywhere in the designer to open this list
      </p>
    </Modal>
  );
}

/* ============================================================ save-as */

export function AskDialog({ title, fields, onSubmit, onClose, submitLabel = "OK" }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.value || ""])));
  return (
    <Modal
      title={title}
      icon="plus"
      onClose={onClose}
      footer={
        <Tap tone="primary" onClick={() => onSubmit(vals)}>
          {submitLabel}
        </Tap>
      }
    >
      {fields.map((f) => (
        <Row key={f.name} label={f.label} wide>
          <TextInput value={vals[f.name]} onChange={(v) => setVals({ ...vals, [f.name]: f.upper ? v.toUpperCase().replace(/\s/g, "_") : v })} placeholder={f.placeholder} />
        </Row>
      ))}
    </Modal>
  );
}
