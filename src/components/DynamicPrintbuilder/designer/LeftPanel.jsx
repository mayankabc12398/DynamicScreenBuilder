/**
 * Left panel: Insert (the toolbox), Data (datasource, sample parameters, the
 * field tree to drag from) and Outline (bands and their elements).
 */
import React, { useEffect, useMemo, useState } from "react";
import { BAND_TYPES, TOOLBOX, bandMeta, bandName, makeElement, roundMm, toolMeta } from "../model/defaults";
import { findEl, useDesigner } from "../model/useDesigner";
import { ROOT_KEYS } from "../engine/printEngine";
import * as pbApi from "../../../networkServices/printBuilderApi";
import { pbSampleLookup } from "../../../networkServices/printBuilderApi";
import { Select, TextInput, Toggle } from "../ui/fields";
import BlocksPanel from "./BlocksPanel";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";

export const LEFT_TABS = [
  { id: "insert", label: "Insert", icon: "plus", tone: "sky" },
  { id: "data", label: "Data", icon: "database", tone: "mint" },
  { id: "blocks", label: "Blocks", icon: "puzzle", tone: "violet" },
  { id: "outline", label: "Outline", icon: "layers", tone: "amber" },
];
const TABS = LEFT_TABS;

/** `tab` / `onTab` let the designer open a tab from the collapsed rail; without them the panel keeps its own. */
export default function LeftPanel(props) {
  const [ownTab, setOwnTab] = useState("insert");
  const tab = props.tab ?? ownTab;
  const setTab = props.onTab ?? setOwnTab;
  return (
    <aside className="pbx-left">
      <nav className="pbx-tabs" role="tablist">
        {TABS.map((t) => (
          <Tap key={t.id} role="tab" aria-selected={tab === t.id} className={`pbx-tab${tab === t.id ? " is-active" : ""}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={14} /> {t.label}
          </Tap>
        ))}
      </nav>
      <div className="pbx-left-body">
        {tab === "insert" && <Toolbox onStatus={props.onStatus} />}
        {tab === "data" && <DataPanel {...props} />}
        {tab === "blocks" && <BlocksPanel onStatus={props.onStatus} />}
        {tab === "outline" && <Outline />}
      </div>
    </aside>
  );
}

/* ============================================================ toolbox */

function Toolbox({ onStatus }) {
  const d = useDesigner();
  const { tpl, band } = d.state;
  const addTo = (type) => {
    const b = tpl.bands.find((x) => x.id === band) || tpl.bands.find((x) => x.type === "reportHeader") || tpl.bands[0];
    if (!b) return;
    const bottom = Math.max(0, ...b.elements.map((e) => e.y + e.h));
    const el = makeElement(type, 0, roundMm(b.elements.length ? bottom + 1 : 1));
    d.addElement(b.id, el);
    onStatus?.(`${toolMeta(type)?.label} added to ${bandMeta(b.type).label}`);
  };
  return (
    <div className="pbx-toolbox">
      <p className="pbx-hint">Drag onto a band, or click to add to the selected band.</p>
      {TOOLBOX.map((g) => (
        <div key={g.group} className={`pbx-toolgroup tone-${g.tone || "sky"}`}>
          <h4>
            <i className="pbx-toolgroup-dot" />
            {g.group}
            <span className="pbx-toolgroup-n">{g.items.length}</span>
          </h4>
          <div className="pbx-toolgrid">
            {g.items.map((t) => (
              <Tap
                key={t.type}
                className="pbx-tool"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-pb-tool", t.type);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => addTo(t.type)}
                title={t.hint}
              >
                <span className="pbx-tool-ic">
                  <Icon name={t.icon} size={14} />
                </span>
                <span className="pbx-tool-label">{t.label}</span>
              </Tap>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =============================================================== data */

const preview = (v) => {
  if (v == null) return "null";
  if (typeof v === "object") return Array.isArray(v) ? `[${v.length}]` : "{…}";
  const s = String(v);
  return s.length > 28 ? `${s.slice(0, 26)}…` : s;
};

/* ---- sample records: recent ones (this browser) and "Find a record" ---- */

const recentKey = (code) => `pbx.recentSamples.${code}`;
function recentSamples(code) {
  try {
    return JSON.parse(localStorage.getItem(recentKey(code)) || "[]");
  } catch {
    return [];
  }
}
function rememberSample(code, params) {
  if (!code || !params || !Object.values(params).some((v) => v !== "" && v != null)) return;
  try {
    const sig = JSON.stringify(params);
    const list = [params, ...recentSamples(code).filter((p) => JSON.stringify(p) !== sig)].slice(0, 8);
    localStorage.setItem(recentKey(code), JSON.stringify(list));
  } catch {
    /* storage blocked: no recent list */
  }
}
const sampleLabel = (p) =>
  Object.values(p || {})
    .filter((v) => v !== "" && v != null)
    .join(" · ")
    .slice(0, 40) || "(empty)";

/** Pick real sample data: search the datasource's record lookup, or reuse a recent set of ids. */
function SamplePicker({ datasource, def, sampleParams, onPick }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [recent, setRecent] = useState(() => recentSamples(datasource.dsCode));
  const names = (def.params || []).map((p) => p.name);
  const hasLookup = !!def.sampleLookup?.proc;
  const pick = (params) => {
    rememberSample(datasource.dsCode, params);
    setRecent(recentSamples(datasource.dsCode));
    setRes(null);
    onPick(params);
  };
  const fromRow = (row) => {
    const next = { ...sampleParams };
    for (const n of names) {
      const k = Object.keys(row).find((c) => c.toLowerCase() === n.toLowerCase());
      if (k) next[n] = row[k] == null ? "" : String(row[k]);
    }
    pick(next);
  };
  const search = async () => {
    setBusy(true);
    const r = await pbSampleLookup({ datasourceCode: datasource.dsCode, search: q });
    setBusy(false);
    setRes(r?.success ? r.data : { error: r?.message || "Search failed" });
  };
  const shown = res?.columns ? res.columns.slice(0, 4) : [];
  return (
    <div className="pbx-picker">
      {hasLookup && (
        <div className="pbx-picker-search">
          <TextInput value={q} onChange={setQ} placeholder="Find a record: bill no, UHID, name…" onKeyDown={(e) => e.key === "Enter" && search()} />
          <Tap tone="map" className="is-small" onClick={search} disabled={busy} title="Search real records">
            <Icon name="search" size={12} /> {busy ? "…" : "Find"}
          </Tap>
        </div>
      )}
      {res?.error && <div className="pbx-ds-info is-error">{res.error}</div>}
      {res?.rows && (
        <ul className="pbx-picker-list">
          {!res.rows.length && <li className="pbx-muted">No records match.</li>}
          {res.rows.map((row, i) => (
            <li key={i}>
              <Tap className="pbx-picker-row" onClick={() => fromRow(row)} title="Use this record as sample data">
                {shown.map((c) => (
                  <span key={c}>
                    <small>{c}</small>
                    {String(row[c] ?? "")}
                  </span>
                ))}
              </Tap>
            </li>
          ))}
        </ul>
      )}
      {recent.length > 0 && (
        <div className="pbx-picker-recent">
          <small>Recent</small>
          {recent.map((p, i) => (
            <Tap key={i} tone="list" className="is-small" onClick={() => pick(p)} title={JSON.stringify(p)}>
              {sampleLabel(p)}
            </Tap>
          ))}
        </div>
      )}
      {!hasLookup && !recent.length && <p className="pbx-hint">Tip: set up "Find a record" in the datasource to search real bills here.</p>}
    </div>
  );
}

/** A sample parameter: free text, or a dropdown when the datasource gives options (static or from a procedure). */
function ParamInput({ datasource, p, value, onChange }) {
  const [opts, setOpts] = useState(Array.isArray(p.options) && p.options.length ? p.options : null);
  useEffect(() => {
    if (opts || !p.optionsProc || !pbApi.pbParamOptions || !datasource) return undefined;
    let live = true;
    pbApi.pbParamOptions(datasource.dsCode, p.name).then((r) => live && r?.success && setOpts(r.data || []));
    return () => {
      live = false;
    };
  }, [datasource, p.name, p.optionsProc, opts]);
  if (opts && opts.length)
    return <Select value={value} onChange={onChange} options={opts.map((o) => ({ value: String(o.value ?? o.Value ?? ""), label: String(o.label ?? o.Label ?? o.value ?? "") }))} placeholder={`(${p.type || "choose"})`} />;
  return <TextInput value={value} onChange={onChange} placeholder={p.type} />;
}

function DataPanel({ datasource, sampleParams, setSampleParams, duplicate, setDuplicate, onFetch, onFetchWith, fetching, sample, schema, sampleInfo, onEditDatasource, onStatus }) {
  const d = useDesigner();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState({});
  const def = useMemo(() => {
    try {
      return JSON.parse(datasource?.definitionJson || "{}");
    } catch {
      return {};
    }
  }, [datasource]);
  const sets = schema?.sets || {};
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  // friendly names (datasource "aliases": { "set.Field" or "Field": "Supplier name" }) and calculated fields
  const aliases = def.aliases || {};
  const aliasOf = (set, f) => aliases[`${set}.${f}`] || aliases[f] || "";
  const calcNames = new Set((def.calculated || []).map((c) => `${c.set || ""}.${c.name}`));
  const match = (s, alias = "") => !q || s.toLowerCase().includes(q.toLowerCase()) || alias.toLowerCase().includes(q.toLowerCase());

  const bindSelected = (path, set, field) => {
    const id = d.state.sel[0];
    const f = id && findEl(d.state.tpl, id);
    if (!f) {
      onStatus?.("Drag the field onto the page, or select an element first");
      return;
    }
    const scoped = ["detail", "groupHeader", "groupFooter"].includes(f.band.type);
    const ex = scoped && field ? field : path;
    d.updateEls([id], (x) => {
      if (["field", "amountWords", "barcode", "qr"].includes(x.type)) x.expr = ex;
      else if (x.type === "label" || x.type === "heading") x.text = `${x.text && x.text !== "Label" ? `${x.text} ` : ""}{{${ex}}}`;
      else if (x.type === "signature") x.nameExpr = ex;
      else if (x.type === "table" && field) x.columns = [...(x.columns || []), { id: `c${Date.now().toString(36)}`, header: field, expr: field, width: 20 }];
    });
    onStatus?.(`Bound to ${ex}`);
  };

  const fieldRow = (path, label, value, extra, alias = "", calc = false) => (
    <li
      key={path}
      className="pbx-field"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-pb-field", JSON.stringify({ path, kind: "field", ...extra }));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onDoubleClick={() => bindSelected(path, extra?.set, extra?.field)}
      title={`${alias ? `${alias}\n` : ""}${path}${calc ? "\nCalculated field (datasource)" : ""}\nDrag onto the page · double-click binds the selected element`}
    >
      <span className="pbx-field-name">
        {alias ? (
          <>
            {alias}
            <small className="pbx-field-raw">{label}</small>
          </>
        ) : (
          label
        )}
        {calc && <span className="pbx-chip kind-calc">ƒx</span>}
      </span>
      <span className="pbx-field-val">{value}</span>
    </li>
  );

  return (
    <div className="pbx-data">
      <div className="pbx-ds-card" data-tour="ds-card">
        <div className="pbx-ds-head">
          <Icon name="database" size={15} />
          <b>{datasource ? datasource.name : "No datasource"}</b>
          <Tap tone="map" className="is-small" onClick={() => onEditDatasource(datasource?.dsCode || null)}>
            {datasource ? "Edit" : "Create"}
          </Tap>
        </div>
        {datasource && <code className="pbx-ds-code">{datasource.dsCode}</code>}
        {(def.params || []).length > 0 && (
          <div className="pbx-params">
            {(def.params || []).map((p) => (
              <label key={p.name} className="pbx-param">
                <span>
                  {p.label || p.name}
                  {p.required && <i className="pbx-req">*</i>}
                </span>
                <ParamInput datasource={datasource} p={p} value={sampleParams[p.name] ?? ""} onChange={(v) => setSampleParams({ ...sampleParams, [p.name]: v })} />
              </label>
            ))}
          </div>
        )}
        {datasource && (
          <SamplePicker
            datasource={datasource}
            def={def}
            sampleParams={sampleParams}
            onPick={(p) => {
              setSampleParams(p);
              onFetchWith(p);
            }}
          />
        )}
        <div className="pbx-ds-actions" data-tour="ds-sample">
          <Toggle value={duplicate} onChange={setDuplicate} label="Duplicate copy" />
          <Tap
            tone="refresh"
            onClick={() => {
              rememberSample(datasource?.dsCode, sampleParams);
              onFetch();
            }}
            disabled={!datasource || fetching}
          >
            <Icon name="refresh" size={13} className={fetching ? "pbx-spin" : ""} /> {fetching ? "Running…" : "Fetch sample"}
          </Tap>
        </div>
        {sampleInfo && <div className={`pbx-ds-info${sampleInfo.error ? " is-error" : ""}`}>{sampleInfo.text}</div>}
      </div>

      <TextInput value={q} onChange={setQ} placeholder="Search fields…" className="pbx-search" />

      <ul className="pbx-tree" data-tour="ds-tree">
        {Object.entries(sets).map(([set, fields]) => {
          const rows = Array.isArray(sample?.[set]) ? sample[set] : [];
          const first = rows[0] || {};
          const list = fields.filter((f) => match(f, aliasOf(set, f)));
          if (q && !list.length && !match(set)) return null;
          const isOpen = open[set] ?? true;
          return (
            <li key={set} className="pbx-set">
              <div
                className="pbx-set-head"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-pb-field", JSON.stringify({ path: set, kind: "set", fields }));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                title="Drag onto a band to make a table of these rows"
              >
                <Tap className="pbx-set-toggle" onClick={() => toggle(set)}>
                  <span className="pbx-caret">{isOpen ? "▾" : "▸"}</span>
                  <Icon name="table" size={13} /> <b>{set}</b>
                </Tap>
                <span className="pbx-count">{rows.length} rows</span>
              </div>
              {isOpen && <ul>{list.map((f) => fieldRow(`${set}.${f}`, f, preview(first[f]), { set, field: f }, aliasOf(set, f), calcNames.has(`${set}.${f}`)))}</ul>}
            </li>
          );
        })}
        {[
          ["params", (schema?.params || []).length ? schema.params : Object.keys(sample?.params || {})],
          ...Object.entries(ROOT_KEYS),
        ].map(([root, keys]) => {
          const list = keys.filter((k) => match(`${root}.${k}`));
          if (!list.length) return null;
          const isOpen = open[root] ?? false;
          return (
            <li key={root} className="pbx-set is-root">
              <div className="pbx-set-head">
                <Tap className="pbx-set-toggle" onClick={() => toggle(root)}>
                  <span className="pbx-caret">{isOpen ? "▾" : "▸"}</span>
                  <Icon name={root === "params" ? "bolt" : "folder"} size={13} /> <b>{root}</b>
                </Tap>
              </div>
              {isOpen && <ul>{list.map((k) => fieldRow(`${root}.${k}`, k, preview(sample?.[root]?.[k]), {}))}</ul>}
            </li>
          );
        })}
        {!Object.keys(sets).length && (
          <li className="pbx-empty">
            <Icon name="sparkle" size={18} />
            <span>Fetch sample data to list the fields of every result set. Drag a field onto the page to place it, or onto an element to bind it.</span>
          </li>
        )}
      </ul>
    </div>
  );
}

/* ============================================================ outline */

const describe = (el) => {
  switch (el.type) {
    case "label":
    case "heading":
      return el.text;
    case "field":
    case "amountWords":
    case "barcode":
    case "qr":
      return el.expr ? `= ${el.expr}` : "(unbound)";
    case "table":
      return `${el.dataset || "?"} · ${(el.columns || []).length} cols`;
    case "image":
      return el.source;
    case "section":
      return `if ${el.visibleIf || "?"}`;
    default:
      return "";
  }
};

function Outline() {
  const d = useDesigner();
  const { tpl, sel, band } = d.state;
  const move = (b, dir) =>
    d.update((t) => {
      const same = t.bands.filter((x) => x.type === b.type);
      const i = same.findIndex((x) => x.id === b.id);
      const j = i + dir;
      if (j < 0 || j >= same.length) return false;
      const ai = t.bands.findIndex((x) => x.id === same[i].id);
      const aj = t.bands.findIndex((x) => x.id === same[j].id);
      [t.bands[ai], t.bands[aj]] = [t.bands[aj], t.bands[ai]];
      return true;
    });
  return (
    <ul className="pbx-outline">
      {tpl.bands.map((b) => {
        const meta = bandMeta(b.type);
        const siblings = tpl.bands.filter((x) => x.type === b.type).length;
        return (
          <li key={b.id}>
            <div className={`pbx-outline-band tone-${meta.tone}${band === b.id && !sel.length ? " is-active" : ""}`}>
              <Tap className="pbx-outline-name" onClick={() => d.select([], b.id)} title={`${meta.hint} (${meta.tech})`}>
                <Icon name={meta.icon} size={12} />
                <span className="pbx-outline-bandtxt">
                  {bandName(b, tpl.bands).title}
                  <em>{bandName(b, tpl.bands).sub}</em>
                </span>
                <small>{b.height} mm</small>
              </Tap>
              {siblings > 1 && (
                <>
                  <Tap className="is-icon" tone="list" onClick={() => move(b, -1)} title="Earlier">
                    <Icon name="up" size={12} />
                  </Tap>
                  <Tap className="is-icon" tone="list" onClick={() => move(b, 1)} title="Later">
                    <Icon name="down" size={12} />
                  </Tap>
                </>
              )}
            </div>
            <ul>
              {b.elements.map((el) => (
                <li key={el.id}>
                  <Tap className={`pbx-outline-el${sel.includes(el.id) ? " is-active" : ""}`} onClick={(e) => d.select(e.shiftKey ? [...sel, el.id] : [el.id], b.id)}>
                    <Icon name={toolMeta(el.type)?.icon || "dots"} size={12} />
                    <span className="pbx-outline-type">{toolMeta(el.type)?.label || el.type}</span>
                    <span className="pbx-outline-desc">{describe(el)}</span>
                    {el.visibleIf && <span className="pbx-chip kind-fn">if</span>}
                  </Tap>
                </li>
              ))}
              {!b.elements.length && <li className="pbx-outline-none">empty</li>}
            </ul>
          </li>
        );
      })}
      <li className="pbx-outline-legend">
        {BAND_TYPES.map((bt) => (
          <span key={bt.type} className={`tone-${bt.tone}`} title={`${bt.hint} (${bt.tech})`}>
            {bt.label}
          </span>
        ))}
      </li>
    </ul>
  );
}
