/**
 * Template library — /print-builder
 *
 * Search, create (blank or from a starter), open, preview with sample data,
 * download a sample PDF, duplicate, delete (soft), export to / import from
 * JSON. Templates are grouped by category, each with its own colour. The
 * status pill says what prints: a draft prints nothing until it is published.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  pbCreateTemplate,
  pbDatasources,
  pbDeleteTemplate,
  pbDuplicateTemplate,
  pbExportTemplate,
  pbFetchSample,
  pbFileUrl,
  pbImportTemplate,
  pbPreviewPdf,
  pbSetTemplateCategory,
  pbStarters,
  pbStatus,
  pbTemplate,
  pbTemplates,
} from "../../../networkServices/printBuilderApi";
import { applyCalculated } from "../engine/printEngine";
import { previewHtml } from "../engine/runtime";
import { initialParams, normalizeTemplate } from "../model/defaults";
import { pbConfirm } from "../ui/confirm";
import { AskDialog, Modal } from "../designer/Dialogs";
import { CoverageChip, LanguageSelect, fetchLanguage, usePrintLanguage, withLanguage } from "../designer/PrintLanguage";
import { Row, Select, TextArea, TextInput } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import "../styles/printBuilder.css";

const downloadJson = (obj, name) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
};

/* ------------------------------------------------------- category colours */
const CAT_PALETTE = {
  sky: ["#0369a1", "#f0f9ff", "#bae6fd"],
  violet: ["#6d28d9", "#f5f3ff", "#ddd6fe"],
  teal: ["#0f766e", "#f0fdfa", "#99f6e4"],
  pink: ["#be185d", "#fdf2f8", "#fbcfe8"],
  green: ["#15803d", "#f0fdf4", "#bbf7d0"],
  amber: ["#b45309", "#fffbeb", "#fde68a"],
  orange: ["#c2410c", "#fff7ed", "#fed7aa"],
  indigo: ["#4338ca", "#eef2ff", "#c7d2fe"],
  cyan: ["#0e7490", "#ecfeff", "#a5f3fc"],
  slate: ["#475569", "#f8fafc", "#e2e8f0"],
};
const KNOWN_CATS = {
  opd: ["sky", "users"],
  ipd: ["violet", "stack"],
  emr: ["teal", "rich"],
  laboratory: ["pink", "pulse"],
  lab: ["pink", "pulse"],
  pharmacy: ["green", "plus"],
  inventory: ["amber", "layers"],
  store: ["amber", "layers"],
  purchase: ["orange", "pages"],
  billing: ["indigo", "sigma"],
  finance: ["indigo", "sigma"],
  radiology: ["cyan", "photo"],
};
const FALLBACK_TONES = ["indigo", "cyan", "teal", "orange", "violet", "pink"];

/** Colour and icon of a category: fixed for the usual ones, a stable pick for the rest. */
function catLook(category) {
  const key = String(category || "").trim().toLowerCase();
  if (!key) return { tone: "slate", icon: "folder", colors: CAT_PALETTE.slate };
  const [tone, icon] = KNOWN_CATS[key] || [FALLBACK_TONES[[...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % FALLBACK_TONES.length], "page"];
  return { tone, icon, colors: CAT_PALETTE[tone] };
}
const catVars = (look) => ({ "--c": look.colors[0], "--cb": look.colors[1], "--cl": look.colors[2] });

/** A template's categories: Category holds them comma-separated ("IPD, Billing"), the first one leads. */
function splitCats(value) {
  const seen = new Set();
  const out = [];
  for (const part of String(value || "").split(",")) {
    const c = part.trim().replace(/\s+/g, " ");
    if (c && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      out.push(c);
    }
  }
  return out;
}

const STATUS_FILTERS = [
  ["", "All", "page"],
  ["published", "Live", "check"],
  ["modified", "Edited", "brush"],
  ["draft", "Draft", "pages"],
];
const statusLabel = (t) => (t.status === "draft" ? "Draft" : t.status === "published" ? `v${t.publishedVersionNo} live` : `v${t.publishedVersionNo} live · edited`);

/* ------------------------------------------------ sample data and sample PDF */
let DS_LIST = null;
const datasourceOf = async (code) => {
  if (!code) return null;
  if (!DS_LIST) DS_LIST = pbDatasources().then((r) => (r?.success ? r.data || [] : []));
  const list = await DS_LIST;
  return list.find((x) => String(x.dsCode || "").toUpperCase() === String(code).toUpperCase()) || null;
};

/** The saved draft and its datasource's sample params — what the designer opens with. */
async function previewInputs(code) {
  const r = await pbTemplate(code);
  if (!r?.success) throw new Error(r?.message || "Could not load the template.");
  const tpl = normalizeTemplate(JSON.parse(r.data.template || "{}"));
  const dsCode = r.data.datasourceCode || "";
  const params = initialParams(await datasourceOf(dsCode));
  const hasParams = Object.values(params).some((v) => v !== "" && v != null);
  return { tpl, dsCode, params, hasParams };
}

/** The draft rendered by the server with sample params, saved as <CODE>-sample.pdf; `lang` default: the app language. */
async function downloadSamplePdf(code, lang) {
  const { tpl, dsCode, params } = await previewInputs(code);
  const r = await pbPreviewPdf({ template: JSON.stringify(tpl), datasourceCode: dsCode || null, params, duplicate: false, lang });
  if (!r?.success || !r.data?.pdfUrl) throw new Error(r?.message || "The server could not render the PDF.");
  const url = pbFileUrl(r.data.pdfUrl);
  if (r.data.format === "html") {
    toast.warn(r.message || "Opened as HTML: the PDF renderer is not available.");
    window.open(url, "_blank");
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${code}-sample.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  } catch {
    window.open(url, "_blank");
  }
}

const PB_TABLES = ["pb_template", "pb_template_version", "pb_datasource", "pb_asset"];

/**
 * Why the builder cannot run on the connected database, and what fixes it.
 * The API never creates, renames or drops tables outside the databases listed
 * in PrintBuilder:AutoCreateSchemaDatabases, so the fix is a DBA's.
 */
function SetupNotice({ status }) {
  const sqlRef = useRef(null);
  if (status.error) {
    return (
      <div className="pbx-setup">
        <Icon name="database" size={30} />
        <h2>Print builder is not available</h2>
        <p>{status.error}</p>
      </div>
    );
  }
  const db = status.database || "this database";
  const autoCreate = (
    <p className="pbx-muted">
      Development databases listed in <code>PrintBuilder:AutoCreateSchemaDatabases</code> set themselves up.
    </p>
  );
  if (!status.legacyTables) {
    const missing = status.missingTables || [];
    return (
      <div className="pbx-setup">
        <Icon name="database" size={30} />
        <h2>Print builder is not set up on this database</h2>
        <p>
          <b>{db}</b> {missing.length && missing.length < PB_TABLES.length ? `is missing ${missing.join(", ")}.` : "has no print builder tables yet."}
        </p>
        <p className="pbx-muted">
          A DBA runs <code>HospediaAPI/PrintBuilder/Sql/pb_schema.sql</code> on it.
        </p>
        {autoCreate}
      </div>
    );
  }
  // Renaming rather than dropping: the old rows stay readable, and the rename can be undone.
  const old = status.presentTables?.length ? status.presentTables : PB_TABLES;
  const sql = [
    "-- 1. Move the old tables aside (their rows are kept)",
    `RENAME TABLE ${old.map((t) => `${t} TO pb_old_${t.slice(3)}`).join(",\n             ")};`,
    "",
    "-- 2. Create the print builder tables",
    "--    run HospediaAPI/PrintBuilder/Sql/pb_schema.sql",
  ].join("\n");
  const copy = () => {
    const select = () => {
      const range = document.createRange();
      range.selectNodeContents(sqlRef.current);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(sql).then(() => toast.success("SQL copied"), select);
    else select();
  };
  return (
    <div className="pbx-setup">
      <Icon name="database" size={30} />
      <h2>Print builder is not set up on this database</h2>
      <p>
        <b>{db}</b> still has <code>pb_*</code> tables from the earlier, reverted print builder. Their shape is different, so the builder neither uses nor
        changes them.
      </p>
      <p className="pbx-muted">To set it up, a DBA runs this on {db}:</p>
      <pre ref={sqlRef} className="pbx-setup-sql">
        {sql}
      </pre>
      <Tap tone="list" onClick={copy}>
        <Icon name="copy" size={14} /> Copy SQL
      </Tap>
      {autoCreate}
    </div>
  );
}

export default function TemplateList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialog, setDialog] = useState(null);
  const [pdfBusy, setPdfBusy] = useState("");

  // category and status filter here, so every chip keeps its count
  const load = useCallback(async () => {
    const r = await pbTemplates(search, "");
    if (r?.success) setRows(r.data || []);
    else {
      setRows([]);
      if (r?.message) toast.error(r.message);
    }
  }, [search]);

  useEffect(() => {
    pbStatus().then((r) => setStatus(r?.success ? r.data : { error: r?.message || "The print builder API is not reachable." }));
  }, []);
  // Templates only load once the tables are known to be usable; otherwise the
  // setup notice below says why, and a second error toast would only repeat it.
  const ready = !!status?.installed;
  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(load, 220);
    return () => clearTimeout(t);
  }, [load, ready]);

  // every category once (matched without case; the first spelling seen names it) and how many prints are in it
  const catCounts = useMemo(() => {
    const m = new Map();
    for (const r of rows || [])
      for (const c of splitCats(r.category)) {
        const k = c.toLowerCase();
        const cur = m.get(k);
        m.set(k, { name: cur?.name || c, n: (cur?.n || 0) + 1 });
      }
    return m;
  }, [rows]);
  const categories = useMemo(() => [...catCounts.values()].map((v) => v.name).sort((a, b) => a.localeCompare(b)), [catCounts]);
  const nameOf = useCallback((c) => catCounts.get(c.toLowerCase())?.name || c, [catCounts]);
  const statusCounts = useMemo(() => {
    const m = { "": rows?.length || 0, published: 0, modified: 0, draft: 0 };
    for (const r of rows || []) if (r.status in m) m[r.status] += 1;
    return m;
  }, [rows]);
  // the shown templates in chip order: category A→Z (uncategorised last), then name
  const shown = useMemo(
    () =>
      (rows || [])
        .filter((r) => (!category || splitCats(r.category).some((c) => c.toLowerCase() === category.toLowerCase())) && (!statusFilter || r.status === statusFilter))
        .sort((x, y) => {
          const a = (splitCats(x.category)[0] || "").toLowerCase();
          const b = (splitCats(y.category)[0] || "").toLowerCase();
          if (a !== b) return !a ? 1 : !b ? -1 : a.localeCompare(b);
          return (x.name || x.code).localeCompare(y.name || y.code);
        }),
    [rows, category, statusFilter],
  );
  const shownCount = shown.length;

  const samplePdf = async (code, lang) => {
    if (pdfBusy) return;
    setPdfBusy(code);
    try {
      await downloadSamplePdf(code, lang);
    } catch (e) {
      toast.error(e.message || "The sample PDF could not be made.");
    } finally {
      setPdfBusy("");
    }
  };

  const removeOne = async (t) => {
    if (!(await pbConfirm({ title: "Delete this template?", message: 'Screens that print with it will get "does not exist" until it is restored.', detail: `${t.code}${t.name ? ` · ${t.name}` : ""}`, confirmLabel: "Delete template" }))) return;
    const r = await pbDeleteTemplate(t.code);
    if (r?.success) {
      toast.success("Deleted");
      load();
    } else toast.error(r?.message);
  };

  const exportOne = async (code) => {
    const r = await pbExportTemplate(code);
    if (!r?.success) {
      toast.error(r?.message || "Export failed");
      return;
    }
    downloadJson(r.data, `${code}.print-template.json`);
  };

  const importFile = async (file) => {
    const text = await file.text();
    let code = "";
    try {
      code = JSON.parse(text)?.template?.code || "";
    } catch {
      toast.error("That file is not JSON");
      return;
    }
    setDialog({ kind: "import", text, code });
  };

  if (status && (status.error || !status.installed)) {
    return (
      <div className="pbx pbx-list">
        <SetupNotice status={status} />
      </div>
    );
  }

  return (
    <div className="pbx pbx-list">
      <header className="pbx-list-hero">
        <span className="pbx-list-hero-ico">
          <Icon name="printer" size={22} />
        </span>
        <div className="pbx-list-hero-text">
          <h1>Print templates</h1>
          <p>Design receipts, bills and reports visually.</p>
        </div>
        <div className="pbx-list-toolbar">
          <span className="pbx-searchbox">
            <Icon name="search" size={14} />
            <TextInput value={search} onChange={setSearch} placeholder="Search code, name or category…" />
          </span>
          <span className="pbx-seg" aria-label="Status">
            {STATUS_FILTERS.map(([k, label, icon]) => (
              <Tap key={k || "all"} aria-pressed={statusFilter === k} className={`pbx-seg-btn is-${k || "all"}${statusFilter === k ? " is-active" : ""}`} onClick={() => setStatusFilter(k)}>
                <Icon name={icon} size={12} /> {label}
                <span className="pbx-seg-n">{statusCounts[k] ?? 0}</span>
              </Tap>
            ))}
          </span>
        </div>
        <label className="pbx-upload">
          <input type="file" accept="application/json,.json" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importFile(f); }} />
          <span className="pbx-tap tone-list">
            <Icon name="upload" size={14} /> Import
          </span>
        </label>
        <Tap tone="primary" onClick={() => setDialog({ kind: "new" })}>
          <Icon name="plus" size={14} /> New template
        </Tap>
      </header>

      {categories.length > 0 && (
        <nav className="pbx-catbar" aria-label="Categories">
          <Tap className={`pbx-cat${!category ? " is-active" : ""}`} style={catVars({ colors: ["#111827", "#f3f4f6", "#d1d5db"] })} onClick={() => setCategory("")}>
            <Icon name="grid" size={13} /> All
            <span className="pbx-cat-n">{rows?.length || 0}</span>
          </Tap>
          {categories.map((c) => {
            const look = catLook(c);
            return (
              <Tap key={c} className={`pbx-cat${category === c ? " is-active" : ""}`} style={catVars(look)} onClick={() => setCategory(category === c ? "" : c)}>
                <Icon name={look.icon} size={13} /> {c}
                <span className="pbx-cat-n">{catCounts.get(c.toLowerCase())?.n}</span>
              </Tap>
            );
          })}
        </nav>
      )}

      {/* header and category bar stay put; only this part scrolls */}
      <div className="pbx-list-scroll">
      {!rows && <div className="pbx-loading">Loading…</div>}
      {rows && !rows.length && (
        <div className="pbx-emptylist">
          <Icon name="sparkle" size={26} />
          <p>{search ? `Nothing matches “${search}”.` : "No templates yet. Start from a polished starter — a receipt, an itemised bill or a grouped report."}</p>
          <Tap tone="primary" onClick={() => setDialog({ kind: "new" })}>
            <Icon name="plus" size={14} /> New template
          </Tap>
        </div>
      )}
      {rows && rows.length > 0 && !shownCount && (
        <div className="pbx-emptylist is-slim">
          <Icon name="search" size={22} />
          <p>No template matches these filters.</p>
          <Tap tone="list" onClick={() => { setCategory(""); setStatusFilter(""); }}>
            Clear filters
          </Tap>
        </div>
      )}
      {shownCount > 0 && (
        <div className="pbx-tcards">
          {shown.map((t, i) => {
            const cats = splitCats(t.category).map(nameOf);
            const look = catLook(cats[0]);
            const editable = t.canEdit !== false;
            const badges = (
              <>
                {cats.length === 0 && (
                  <span className="pbx-tcard-cat" style={catVars(catLook(""))}>
                    <Icon name="folder" size={12} /> Uncategorised
                  </span>
                )}
                {cats.slice(0, 2).map((c) => {
                  const l = catLook(c);
                  return (
                    <span key={c} className="pbx-tcard-cat" style={catVars(l)}>
                      <Icon name={l.icon} size={12} /> {c}
                    </span>
                  );
                })}
                {cats.length > 2 && <span className="pbx-tcard-more">+{cats.length - 2}</span>}
              </>
            );
            return (
              <article key={t.code} className={`pbx-tcard is-${t.status}`} style={{ ...catVars(look), "--i": Math.min(i, 24) }} onDoubleClick={() => navigate(`/print-builder/${t.code}`)}>
                <div className="pbx-tcard-band">
                  {editable ? (
                    <Tap className="pbx-tcard-cats is-editable" onClick={() => setDialog({ kind: "category", t })} title={`${cats.join(", ") || "No category"} — change categories`}>
                      {badges}
                      <span className="pbx-tcard-catedit">
                        <Icon name="brush" size={11} />
                      </span>
                    </Tap>
                  ) : (
                    <span className="pbx-tcard-cats" title={cats.join(", ") || "No category"}>
                      {badges}
                    </span>
                  )}
                  <span className={`pbx-status is-${t.status}`}>
                    <i className="pbx-status-dot" />
                    {statusLabel(t)}
                  </span>
                </div>
                <div className="pbx-tcard-body">
                  <h3 title={t.name}>{t.name || t.code}</h3>
                  <code>{t.code}</code>
                  {t.description && (
                    <p className="pbx-tcard-desc" title={t.description}>
                      {t.description}
                    </p>
                  )}
                </div>
                <div className="pbx-tcard-tags">
                  <span className="pbx-tag is-paper" title="Paper">
                    <Icon name="page" size={11} /> {t.paperSize || "A4"}
                    {t.orientation === "landscape" ? " ⟲" : ""}
                  </span>
                  <span className="pbx-tag" title={`${t.versionCount} version${t.versionCount === 1 ? "" : "s"}`}>
                    <Icon name="history" size={11} /> v{t.versionCount}
                  </span>
                  {t.canEdit === false && (
                    <span className="pbx-tag is-locked" title="You can open it but only its editors can change it">
                      <Icon name="lock" size={11} />
                    </span>
                  )}
                  <span className={`pbx-tag is-ds${t.datasourceCode ? "" : " is-missing"}`} title={t.datasourceCode ? `Datasource ${t.datasourceCode}` : "No datasource"}>
                    <Icon name="database" size={11} /> <span>{t.datasourceCode || "no datasource"}</span>
                  </span>
                </div>
                <div className="pbx-tcard-foot">
                  <Tap tone="primary" className="is-small" onClick={() => navigate(`/print-builder/${t.code}`)}>
                    Open
                  </Tap>
                  <Tap tone="list" className="is-small pbx-tcard-act is-eye" onClick={() => setDialog({ kind: "preview", t })} title="Preview with sample data">
                    <Icon name="eye" size={13} />
                  </Tap>
                  <Tap tone="list" className={`is-small pbx-tcard-act is-pdf${pdfBusy === t.code ? " is-busy" : ""}`} onClick={() => samplePdf(t.code)} title="Download a sample PDF">
                    <Icon name={pdfBusy === t.code ? "refresh" : "pdf"} size={13} />
                  </Tap>
                  <span className="pbx-top-fill" />
                  <Tap tone="list" className="is-small pbx-tcard-act" onClick={() => setDialog({ kind: "dup", code: t.code, name: t.name })} title="Duplicate">
                    <Icon name="copy" size={12} />
                  </Tap>
                  <Tap tone="list" className="is-small pbx-tcard-act" onClick={() => exportOne(t.code)} title="Export JSON">
                    <Icon name="download" size={12} />
                  </Tap>
                  <Tap tone="list" className="is-small pbx-tcard-act is-del" onClick={() => removeOne(t)} title="Delete">
                    <Icon name="trash" size={12} />
                  </Tap>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>

      {dialog?.kind === "category" && (
        <CategoryDialog
          t={dialog.t}
          all={categories}
          nameOf={nameOf}
          onClose={() => setDialog(null)}
          onSaved={(code, value) => {
            setRows((rs) => (rs || []).map((r) => (r.code === code ? { ...r, category: value } : r)));
            setDialog(null);
          }}
        />
      )}
      {dialog?.kind === "preview" && (
        <PreviewModal
          t={dialog.t}
          look={catLook(dialog.t.category)}
          pdfBusy={pdfBusy === dialog.t.code}
          onPdf={(lang) => samplePdf(dialog.t.code, lang)}
          onOpen={() => navigate(`/print-builder/${dialog.t.code}`)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "new" && <NewTemplateDialog onClose={() => setDialog(null)} onCreated={(code) => navigate(`/print-builder/${code}`)} />}
      {dialog?.kind === "dup" && (
        <AskDialog
          title={`Duplicate ${dialog.code}`}
          submitLabel="Duplicate"
          fields={[
            { name: "code", label: "New code", value: `${dialog.code}_COPY`, upper: true },
            { name: "name", label: "New name", value: `${dialog.name} (copy)` },
          ]}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => {
            const r = await pbDuplicateTemplate(dialog.code, v.code, v.name);
            if (r?.success) {
              setDialog(null);
              toast.success("Duplicated");
              load();
            } else toast.error(r?.message);
          }}
        />
      )}
      {dialog?.kind === "import" && (
        <AskDialog
          title="Import template"
          submitLabel="Import"
          fields={[{ name: "code", label: "Code", value: dialog.code, upper: true, placeholder: "Keeps the exported code when blank" }]}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => {
            let r = await pbImportTemplate(dialog.text, v.code, false);
            if (!r?.success && /already exists/i.test(r?.message || "") && (await pbConfirm({ title: "Template already exists", message: `${r.message}\n\nOverwrite its draft with the imported one? Published versions stay as they are.`, confirmLabel: "Overwrite draft", tone: "warn", icon: "replace" }))) r = await pbImportTemplate(dialog.text, v.code, true);
            if (r?.success) {
              setDialog(null);
              toast.success(`Imported ${r.data.code}`);
              load();
            } else if (r?.message) toast.error(r.message);
          }}
        />
      )}
    </div>
  );
}

const SAMPLE_PREVIEW = {
  bill: [
    { PatientName: "Ms. Asha Verma", PatientID: "UHID-24-0001", AgeCombined: "34 Y", Gender: "Female", BillNo: "OPD/24/1021", PanelName: "Cash", DoctorName: "Dr. R. Mehta", Department: "Cardiology", Mobile: "98xxxxxx10", ItemName: "Consultation", CategoryName: "CONSULTATION", SubCategoryName: "First visit", Quantity: 1, Rate: 800, DiscAmt: 0, Amount: 800, GrossAmount: 2150, DiscountOnTotal: 50, NetAmount: 2100, AmountPaid: 2100, BalanceAmt: 0 },
    { ItemName: "ECG", CategoryName: "INVESTIGATION", SubCategoryName: "Cardiology", Quantity: 1, Rate: 350, DiscAmt: 50, Amount: 300 },
    { ItemName: "Lipid profile", CategoryName: "INVESTIGATION", SubCategoryName: "Biochemistry", Quantity: 1, Rate: 1000, DiscAmt: 0, Amount: 1000 },
  ],
  payments: [{ PaymentMode: "UPI", ReceiptNo: "R/24/883", ReceiptDate: "2026-10-12T10:20:00", Amount: 2100 }],
  centre: { CentreName: "Central Hospital", Address: "Sector 1", City: "Delhi", MobileNo: "011-4000000", Website: "www.example.org" },
  params: { transactionId: 1 },
  sys: { now: "2026-10-12T10:24:00", printedBy: "Front office" },
};

function NewTemplateDialog({ onClose, onCreated }) {
  const [starters, setStarters] = useState([]);
  const [datasources, setDatasources] = useState([]);
  const [pick, setPick] = useState("bill");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [ds, setDs] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pbStarters().then((r) => r?.success && setStarters(r.data || []));
    pbDatasources().then((r) => r?.success && setDatasources(r.data || []));
  }, []);
  const starter = starters.find((s) => s.id === pick);
  useEffect(() => {
    if (starter) {
      setCategory((c) => c || starter.category || "");
      setDs((x) => x || starter.datasourceCode || "");
    }
  }, [starter]);

  const create = async () => {
    if (!code || !name) {
      toast.error("Code and name are required");
      return;
    }
    setBusy(true);
    const r = await pbCreateTemplate({ code, name, category, description, starter: pick || null, datasourceCode: ds || null });
    setBusy(false);
    if (!r?.success) {
      toast.error(r?.message || "Could not create the template");
      return;
    }
    onCreated(r.data.code);
  };

  return (
    <Modal
      title="New print template"
      icon="plus"
      wide
      onClose={onClose}
      footer={
        <Tap tone="primary" onClick={create} disabled={busy}>
          <Icon name="check" size={13} /> Create and open
        </Tap>
      }
    >
      <div className="pbx-starters">
        <Tap className={`pbx-starter${!pick ? " is-active" : ""}`} onClick={() => setPick("")}>
          <div className="pbx-starter-thumb is-blank">
            <Icon name="plus" size={26} />
          </div>
          <b>Blank page</b>
          <small>A4 with a page header and footer</small>
        </Tap>
        {starters.map((s) => (
          <Tap key={s.id} className={`pbx-starter${pick === s.id ? " is-active" : ""}`} onClick={() => setPick(s.id)}>
            <StarterThumb template={s.template} />
            <b>{s.name}</b>
            <small>{s.description}</small>
          </Tap>
        ))}
      </div>
      <div className="pbx-grid2">
        <Row label="Code" hint="What screens print by — letters, digits, _">
          <TextInput mono value={code} onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9_-]/g, "_"))} placeholder="OPD_BILL" />
        </Row>
        <Row label="Name">
          <TextInput value={name} onChange={setName} placeholder="OPD bill" />
        </Row>
        <Row label="Category" hint="Several? Separate them with commas">
          <TextInput value={category} onChange={setCategory} placeholder="IPD, Billing" />
        </Row>
        <Row label="Datasource">
          <Select value={ds} onChange={setDs} options={datasources.map((x) => ({ value: x.dsCode, label: `${x.name} (${x.dsCode})` }))} placeholder="Choose later" />
        </Row>
      </div>
      <Row label="Notes" wide>
        <TextArea value={description} onChange={setDescription} rows={2} />
      </Row>
    </Modal>
  );
}

/**
 * The category picker: a template may sit in any number of categories. Toggle the
 * existing ones or type a new one; the first picked leads (the card's colour and
 * its place in the list). Saves only the category — the draft is not touched.
 */
function CategoryDialog({ t, all, nameOf, onClose, onSaved }) {
  const [picked, setPicked] = useState(() => splitCats(t.category).map(nameOf));
  const [extra, setExtra] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const has = (c) => picked.some((p) => p.toLowerCase() === c.toLowerCase());
  const options = useMemo(() => {
    const seen = new Set();
    return [...all, ...extra, ...picked].filter((c) => !seen.has(c.toLowerCase()) && seen.add(c.toLowerCase()));
  }, [all, extra, picked]);
  const toggle = (c) => setPicked((p) => (p.some((x) => x.toLowerCase() === c.toLowerCase()) ? p.filter((x) => x.toLowerCase() !== c.toLowerCase()) : [...p, c]));
  const addNew = () => {
    const c = draft.replace(/,/g, " ").trim().replace(/\s+/g, " ");
    if (!c) return;
    const known = options.find((o) => o.toLowerCase() === c.toLowerCase());
    if (!known) setExtra((e) => [...e, c]);
    if (!has(c)) setPicked((p) => [...p, known || c]);
    setDraft("");
  };
  const joined = picked.join(", ");
  const tooLong = joined.length > 80;
  const save = async () => {
    setBusy(true);
    const r = await pbSetTemplateCategory(t.code, picked);
    setBusy(false);
    if (!r?.success) {
      toast.error(r?.message || "The category could not be saved.");
      return;
    }
    toast.success(picked.length ? `${t.code} → ${joined}` : `${t.code} has no category now`);
    onSaved(t.code, r.data?.category ?? joined);
  };

  return (
    <Modal
      title={`Categories — ${t.name || t.code}`}
      icon="folder"
      onClose={onClose}
      footer={
        <>
          <span className={`pbx-catdlg-sum${tooLong ? " is-bad" : ""}`}>
            {tooLong ? `Too long: ${joined.length} / 80 characters` : picked.length ? `${picked.length} selected · the first one leads` : "No category"}
          </span>
          <span className="pbx-top-fill" />
          <Tap tone="list" onClick={onClose}>
            Cancel
          </Tap>
          <Tap tone="primary" onClick={save} disabled={busy || tooLong}>
            <Icon name={busy ? "refresh" : "check"} size={13} /> {busy ? "Saving…" : "Save"}
          </Tap>
        </>
      }
    >
      <div className="pbx-catdlg">
        <p className="pbx-muted">Pick every category this print belongs to — it shows under each of them in the list.</p>
        <div className="pbx-catdlg-label">Selected</div>
        <div className="pbx-catdlg-picked">
          {picked.length === 0 && <span className="pbx-muted">None — the print shows as Uncategorised.</span>}
          {picked.map((c, i) => {
            const l = catLook(c);
            return (
              <span key={c} className="pbx-catdlg-pick" style={catVars(l)}>
                {i === 0 && <b className="pbx-catdlg-lead">Lead</b>}
                <Icon name={l.icon} size={12} /> {c}
                {i > 0 && (
                  <Tap className="pbx-catdlg-mini" title="Make it the lead category" onClick={() => setPicked((p) => [c, ...p.filter((x) => x !== c)])}>
                    <Icon name="up" size={10} />
                  </Tap>
                )}
                <Tap className="pbx-catdlg-mini" title="Remove" onClick={() => toggle(c)}>
                  <Icon name="close" size={10} />
                </Tap>
              </span>
            );
          })}
        </div>
        <div className="pbx-catdlg-label">All categories</div>
        <div className="pbx-catdlg-opts">
          {options.length === 0 && <span className="pbx-muted">None yet — create the first one below.</span>}
          {options.map((c) => {
            const l = catLook(c);
            const on = has(c);
            return (
              <Tap key={c} className={`pbx-catdlg-opt${on ? " is-on" : ""}`} style={catVars(l)} aria-pressed={on} onClick={() => toggle(c)}>
                <Icon name={on ? "check" : l.icon} size={12} /> {c}
              </Tap>
            );
          })}
        </div>
        <div className="pbx-catdlg-label">New category</div>
        <div className="pbx-catdlg-new" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNew())}>
          <TextInput value={draft} onChange={setDraft} placeholder="e.g. Billing, Radiology…" />
          <Tap tone="add" onClick={addNew} disabled={!draft.trim()}>
            <Icon name="plus" size={13} /> Add
          </Tap>
        </div>
      </div>
    </Modal>
  );
}

/**
 * The eye button: the saved draft rendered with its datasource's sample params,
 * exactly as the designer's preview shows it, in the app language (the Language
 * select shows another; switching the app language re-renders it). A datasource
 * without sample params (or one that fails) still shows the layout, with empty
 * fields and translated labels.
 */
function PreviewModal({ t, look, pdfBusy, onPdf, onOpen, onClose }) {
  const [state, setState] = useState({ loading: true });
  const [lang, setLang, languages] = usePrintLanguage();
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { tpl, dsCode, params, hasParams } = await previewInputs(t.code);
        // layout only: no datasource run, but the labels still print in the language
        const layoutOnly = async (note) => {
          const language = await fetchLanguage(tpl, lang);
          if (live) setState({ tpl, data: withLanguage({ sys: { now: new Date().toISOString() } }, language), coverage: language?.coverage, note, warn: true });
        };
        if (!dsCode || !hasParams) {
          await layoutOnly(dsCode ? "No sample params saved — layout only" : "No datasource — layout only");
          return;
        }
        const r = await pbFetchSample({ datasourceCode: dsCode, params, receiptHeaderType: tpl?.header?.receiptHeaderType, template: JSON.stringify(tpl), duplicate: false, saveSchema: false, lang });
        if (!live) return;
        if (!r?.success) {
          await layoutOnly(r?.message || "The datasource failed — layout only");
          return;
        }
        const shown = Object.entries(params)
          .filter(([, v]) => v !== "" && v != null)
          .map(([k, v]) => `${k} ${v}`)
          .join(" · ");
        setState({ tpl, data: applyCalculated(JSON.parse(r.data.dataJson)), coverage: r.data.translation, note: `Sample data · ${shown}${r.data.ms != null ? ` · ${r.data.ms} ms` : ""}` });
      } catch (e) {
        if (live) setState({ error: e.message || "The preview could not be built." });
      }
    })();
    return () => {
      live = false;
    };
  }, [t.code, lang]);
  const html = useMemo(() => (state.tpl ? previewHtml(state.tpl, state.data) : ""), [state.tpl, state.data]);

  return (
    <Modal
      title={`${t.name || t.code} — preview`}
      icon="eye"
      full
      onClose={onClose}
      footer={
        <>
          <span className={`pbx-pv-note${state.warn ? " is-warn" : ""}`} style={catVars(look)}>
            <Icon name={state.warn ? "alert" : "database"} size={12} /> {state.loading ? "Loading sample data…" : state.error || state.note}
          </span>
          <span className="pbx-top-fill" />
          <LanguageSelect value={lang} onChange={setLang} languages={languages} />
          <CoverageChip coverage={state.coverage} />
          <Tap tone="list" onClick={onOpen}>
            <Icon name="brush" size={13} /> Open in designer
          </Tap>
          <Tap tone="primary" onClick={() => onPdf(lang)} disabled={pdfBusy}>
            <Icon name={pdfBusy ? "refresh" : "pdf"} size={13} /> {pdfBusy ? "Making PDF…" : "Download sample PDF"}
          </Tap>
        </>
      }
    >
      <div className="pbx-pv">
        {state.loading && !state.tpl && <div className="pbx-loading">Loading preview…</div>}
        {state.error && <div className="pbx-note is-warn">{state.error}</div>}
        {html && <iframe title={`${t.code} preview`} srcDoc={html} sandbox="allow-scripts allow-same-origin" className="pbx-pv-frame" />}
      </div>
    </Modal>
  );
}

/** A live, scaled-down render of a starter with illustrative data. */
function StarterThumb({ template }) {
  const html = useMemo(() => previewHtml(template, SAMPLE_PREVIEW, { screen: false }), [template]);
  const portrait = template?.page?.orientation !== "landscape";
  return (
    <div className="pbx-starter-thumb">
      <iframe title="starter" srcDoc={html} tabIndex={-1} sandbox="allow-scripts allow-same-origin" className={portrait ? "is-portrait" : ""} />
    </div>
  );
}
