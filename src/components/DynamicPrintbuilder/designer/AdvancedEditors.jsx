/**
 * Property editors for the engine 1.3 features, kept out of PropertyPanel so
 * that file stays readable:
 *   elements  chart · crosstab · sub-report
 *   template  layout (right-to-left, mirrored margins) · PDF protection ·
 *             reprint rules · governance shortcuts (access, variants, log…)
 */
import React, { useEffect, useMemo, useState } from "react";
import { POWERED_BY, POWERED_BY_LABEL, POWERED_BY_MARK, setNameOf } from "../engine/printEngine";
import { pbTemplates } from "../../../networkServices/printBuilderApi";
import { ColorInput, NumberInput, Row, Section, Segmented, Select, TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { ExprInput, TokenText } from "./ExprInput";

const AGGS = [
  { value: "sum", label: "Sum" },
  { value: "count", label: "Count rows" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
];

/** Colour sets a chart can take in one click. */
export const PALETTES = {
  Ocean: ["#2563eb", "#0891b2", "#0d9488", "#7c3aed", "#4f46e5", "#0284c7"],
  Clinical: ["#0f766e", "#14b8a6", "#f59e0b", "#ef4444", "#6366f1", "#84cc16"],
  Sunset: ["#f97316", "#ef4444", "#db2777", "#a855f7", "#f59e0b", "#eab308"],
  Calm: ["#64748b", "#94a3b8", "#0ea5e9", "#22c55e", "#a3a3a3", "#f472b6"],
  Mono: ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"],
};

function DatasetPicker({ el, set, sets, fields }) {
  return (
    <>
      <Row label="Rows from" wide hint="A result set of the datasource">
        <Select value={sets.includes(el.dataset) ? el.dataset : ""} onChange={(v) => set({ dataset: v })} options={sets} placeholder={sets.length ? "Choose a result set" : "Fetch sample first"} />
      </Row>
      <Row label="Filter" hint="Keep rows where this is true">
        <ExprInput value={el.filter} onChange={(v) => set({ filter: v || undefined })} fields={fields} placeholder="(all rows)" />
      </Row>
    </>
  );
}

/* ================================================================ chart */

const CHART_TYPES = [
  { value: "bar", label: "Bars" },
  { value: "hbar", label: "H-bars" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "donut", label: "Donut" },
];

export function ChartContent({ el, set, schema, rootFields }) {
  const sets = Object.keys(schema?.sets || {});
  const rowSet = setNameOf(el.dataset);
  const fields = rowSet ? (schema?.sets?.[rowSet] || []).map((f) => ({ path: f, kind: "row", hint: rowSet })) : rootFields;
  const series = Array.isArray(el.series) ? el.series : [];
  const pie = el.chartType === "pie" || el.chartType === "donut";
  const putSeries = (next) => set({ series: next.length ? next : undefined });
  const vf = el.valueFormat || {};
  return (
    <>
      <div className="pbx-charttypes">
        {CHART_TYPES.map((t) => (
          <Tap key={t.value} className={`pbx-charttype${(el.chartType || "bar") === t.value ? " is-active" : ""}`} onClick={() => set({ chartType: t.value })} title={t.label}>
            <ChartGlyph kind={t.value} />
            <span>{t.label}</span>
          </Tap>
        ))}
      </div>
      <DatasetPicker el={el} set={set} sets={sets} fields={fields} />
      <Row label={pie ? "Slice by" : "Category"} wide hint="Rows with the same value form one bar / slice / point">
        <ExprInput value={el.labelExpr} onChange={(v) => set({ labelExpr: v })} fields={fields} placeholder="CategoryName" />
      </Row>
      <Row label="Add up">
        <Select value={el.agg || "sum"} onChange={(v) => set({ agg: v })} options={AGGS} />
      </Row>
      {el.agg !== "count" && !series.length && (
        <Row label="Value" wide>
          <ExprInput value={el.valueExpr} onChange={(v) => set({ valueExpr: v })} fields={fields} placeholder="Amount" />
        </Row>
      )}
      {el.agg !== "count" && !pie && (
        <div className="pbx-series">
          {series.map((s, i) => (
            <div key={i} className="pbx-series-row">
              <span className="pbx-series-dot" style={{ background: s.color || PALETTES.Ocean[i % 6] }} />
              <TextInput value={s.label} onChange={(v) => putSeries(series.map((x, k) => (k === i ? { ...x, label: v } : x)))} placeholder={`Series ${i + 1}`} />
              <ExprInput value={s.expr} onChange={(v) => putSeries(series.map((x, k) => (k === i ? { ...x, expr: v } : x)))} fields={fields} placeholder="Amount" />
              <ColorInput value={s.color} onChange={(v) => putSeries(series.map((x, k) => (k === i ? { ...x, color: v || undefined } : x)))} />
              <Tap className="is-icon" tone="danger" onClick={() => putSeries(series.filter((_, k) => k !== i))} title="Remove series">
                <Icon name="trash" size={12} />
              </Tap>
            </div>
          ))}
          <Tap
            tone="add"
            className="is-small"
            onClick={() => putSeries(series.length ? [...series, { label: "", expr: "" }] : [{ label: "Value", expr: el.valueExpr || "" }, { label: "", expr: "" }])}
            title="Compare several values per category (grouped or stacked bars, several lines)"
          >
            ＋ Series
          </Tap>
        </div>
      )}
      <Section title="Chart look" defaultOpen={false}>
        <Row label="Title" wide>
          <TokenText value={el.title} onChange={(v) => set({ title: v || undefined })} fields={fields} rows={1} />
        </Row>
        <Row label="Colours" wide>
          <span className="pbx-palettes">
            {Object.entries(PALETTES).map(([n, cols]) => (
              <Tap key={n} className={`pbx-palette${JSON.stringify(el.colors) === JSON.stringify(cols) ? " is-active" : ""}`} onClick={() => set({ colors: cols })} title={n}>
                {cols.slice(0, 5).map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </Tap>
            ))}
            <Tap className="pbx-palette" onClick={() => set({ colors: undefined })} title="Theme accent">
              Auto
            </Tap>
          </span>
        </Row>
        <Row label="Order">
          <Select
            value={el.sortBy || ""}
            onChange={(v) => set({ sortBy: v || undefined })}
            options={[
              { value: "", label: "As the rows come" },
              { value: "value", label: "Largest first" },
              { value: "label", label: "By label" },
            ]}
          />
        </Row>
        <Row label="Show at most" hint="The rest is cut, or added into one 'Others' item">
          <span className="pbx-inline">
            <NumberInput value={el.limit} placeholder="all" onChange={(v) => set({ limit: v || undefined })} step={1} min={1} />
            <TextInput value={el.othersLabel} onChange={(v) => set({ othersLabel: v || undefined })} placeholder="Others" />
          </span>
        </Row>
        <Row label="Values">
          <Toggle value={el.showValues !== false} onChange={(v) => set({ showValues: v })} label="Print the numbers" />
        </Row>
        <Row label="Legend">
          <Toggle value={el.showLegend !== false} onChange={(v) => set({ showLegend: v })} />
        </Row>
        {!pie && (
          <>
            <Row label="Grid lines">
              <Toggle value={el.showGrid !== false} onChange={(v) => set({ showGrid: v })} />
            </Row>
            {series.length > 1 && el.chartType !== "line" && el.chartType !== "area" && (
              <Row label="Stacked">
                <Toggle value={!!el.stacked} onChange={(v) => set({ stacked: v || undefined })} />
              </Row>
            )}
          </>
        )}
        {el.chartType === "donut" && (
          <>
            <Row label="Hole">
              <NumberInput value={el.hole ?? 55} onChange={(v) => set({ hole: v })} step={5} min={20} max={85} suffix="%" />
            </Row>
            <Row label="Centre text" hint="Blank = the total">
              <TokenText value={el.centerText} onChange={(v) => set({ centerText: v })} fields={fields} rows={1} />
            </Row>
          </>
        )}
        <Row label="Decimals">
          <NumberInput value={vf.decimals ?? 0} onChange={(v) => set({ valueFormat: { ...vf, type: vf.type || "number", decimals: v ?? 0 } })} step={1} min={0} max={4} />
        </Row>
        <Row label="Prefix">
          <TextInput value={vf.prefix} onChange={(v) => set({ valueFormat: { ...vf, type: vf.type || "number", prefix: v || undefined } })} placeholder="₹" />
        </Row>
        <Row label="Font size">
          <NumberInput value={el.style?.fontSize} placeholder="auto" onChange={(v) => set({ style: { ...(el.style || {}), fontSize: v } })} step={0.5} suffix="pt" />
        </Row>
        <Row label="When empty">
          <TextInput value={el.emptyText} onChange={(v) => set({ emptyText: v || undefined })} placeholder="No data" />
        </Row>
      </Section>
    </>
  );
}

/** A tiny icon of a chart type for the type picker. */
function ChartGlyph({ kind }) {
  const c = "currentColor";
  const body = {
    bar: <><rect x="3" y="12" width="4" height="9" rx="1" fill={c} /><rect x="10" y="6" width="4" height="15" rx="1" fill={c} opacity=".75" /><rect x="17" y="9" width="4" height="12" rx="1" fill={c} opacity=".55" /></>,
    hbar: <><rect x="3" y="3" width="12" height="4" rx="1" fill={c} /><rect x="3" y="10" width="18" height="4" rx="1" fill={c} opacity=".75" /><rect x="3" y="17" width="9" height="4" rx="1" fill={c} opacity=".55" /></>,
    line: <polyline points="3,18 9,11 14,14 21,5" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />,
    area: <><path d="M3 18 L9 11 L14 14 L21 5 L21 21 L3 21Z" fill={c} opacity=".25" /><polyline points="3,18 9,11 14,14 21,5" fill="none" stroke={c} strokeWidth="2" /></>,
    pie: <><path d="M12 3a9 9 0 1 0 9 9h-9z" fill={c} opacity=".75" /><path d="M14 2.5V10h7.5A9 9 0 0 0 14 2.5z" fill={c} /></>,
    donut: <><circle cx="12" cy="12" r="7" fill="none" stroke={c} strokeWidth="4" opacity=".5" /><path d="M12 5a7 7 0 0 1 7 7" fill="none" stroke={c} strokeWidth="4" /></>,
  }[kind];
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {body}
    </svg>
  );
}

/* ============================================================= crosstab */

export function CrosstabContent({ el, set, schema, rootFields }) {
  const sets = Object.keys(schema?.sets || {});
  const rowSet = setNameOf(el.dataset);
  const fields = rowSet ? (schema?.sets?.[rowSet] || []).map((f) => ({ path: f, kind: "row", hint: rowSet })) : rootFields;
  const f = el.format || {};
  return (
    <>
      <DatasetPicker el={el} set={set} sets={sets} fields={fields} />
      <div className="pbx-xt-axes">
        <div className="pbx-xt-axis is-rows">
          <small>↓ Rows</small>
          <ExprInput value={el.rowExpr} onChange={(v) => set({ rowExpr: v })} fields={fields} placeholder="WardName" />
        </div>
        <div className="pbx-xt-axis is-cols">
          <small>→ Columns</small>
          <ExprInput value={el.colExpr} onChange={(v) => set({ colExpr: v })} fields={fields} placeholder="date(AdmitDate, 'MMM')" />
        </div>
        <div className="pbx-xt-axis is-vals">
          <small>Σ Cells</small>
          <span className="pbx-inline">
            <Select value={el.agg || "sum"} onChange={(v) => set({ agg: v })} options={AGGS} />
            {el.agg !== "count" && <ExprInput value={el.valueExpr} onChange={(v) => set({ valueExpr: v })} fields={fields} placeholder="Amount" />}
          </span>
        </div>
      </div>
      <Row label="Row title">
        <TextInput value={el.rowHeader} onChange={(v) => set({ rowHeader: v })} placeholder="Ward" />
      </Row>
      <Row label="Totals">
        <span className="pbx-inline">
          <Toggle value={el.rowTotals !== false} onChange={(v) => set({ rowTotals: v })} label="Row" />
          <Toggle value={el.colTotals !== false} onChange={(v) => set({ colTotals: v })} label="Column" />
        </span>
      </Row>
      <Section title="Crosstab look" defaultOpen={false}>
        <Row label="Total label">
          <TextInput value={el.totalLabel} onChange={(v) => set({ totalLabel: v || undefined })} placeholder="Total" />
        </Row>
        <Row label="Column order">
          <Select
            value={el.colSort || "label"}
            onChange={(v) => set({ colSort: v === "label" ? undefined : v })}
            options={[
              { value: "label", label: "Sorted (A→Z, 1→9)" },
              { value: "none", label: "As the rows come (months in order)" },
            ]}
          />
        </Row>
        <Row label="Row order">
          <Select
            value={el.rowSort || "none"}
            onChange={(v) => set({ rowSort: v === "none" ? undefined : v })}
            options={[
              { value: "none", label: "As the rows come" },
              { value: "label", label: "Sorted" },
            ]}
          />
        </Row>
        <Row label="Max columns" hint="More distinct column values than this are left out">
          <NumberInput value={el.maxCols ?? 24} onChange={(v) => set({ maxCols: v })} step={1} min={1} max={60} />
        </Row>
        <Row label="First column">
          <NumberInput value={el.firstColWidth ?? 28} onChange={(v) => set({ firstColWidth: v })} step={1} min={10} suffix="mm" />
        </Row>
        <Row label="Decimals">
          <NumberInput value={f.decimals ?? (el.agg === "count" ? 0 : 2)} onChange={(v) => set({ format: { ...f, type: f.type || "number", decimals: v ?? 0 } })} step={1} min={0} max={4} />
        </Row>
        <Row label="Empty cell">
          <TextInput value={el.emptyCell} onChange={(v) => set({ emptyCell: v || undefined })} placeholder="(blank)" />
        </Row>
        <Row label="Lines">
          <Select
            value={el.grid || "grid"}
            onChange={(v) => set({ grid: v })}
            options={[
              { value: "grid", label: "Full grid" },
              { value: "lines", label: "Row lines" },
              { value: "none", label: "None" },
            ]}
          />
        </Row>
        <Row label="Zebra rows">
          <Toggle value={el.zebra !== false} onChange={(v) => set({ zebra: v })} />
        </Row>
        <Row label="Header fill">
          <ColorInput value={el.headerStyle?.background} onChange={(v) => set({ headerStyle: { ...(el.headerStyle || {}), background: v || undefined } })} />
        </Row>
        <Row label="Font size">
          <NumberInput value={el.style?.fontSize} placeholder="auto" onChange={(v) => set({ style: { ...(el.style || {}), fontSize: v } })} step={0.5} suffix="pt" />
        </Row>
      </Section>
    </>
  );
}

/* ============================================================ sub-report */

let TEMPLATE_LIST = null;
export function useTemplateList() {
  const [list, setList] = useState(TEMPLATE_LIST || []);
  useEffect(() => {
    if (TEMPLATE_LIST) return;
    pbTemplates().then((r) => {
      if (r?.success) {
        TEMPLATE_LIST = r.data || [];
        setList(TEMPLATE_LIST);
      }
    });
  }, []);
  return list;
}

export function SubreportContent({ el, set, rootFields, sample, selfCode }) {
  const list = useTemplateList();
  const options = useMemo(
    () => list.filter((t) => t.code !== selfCode).map((t) => ({ value: t.code, label: `${t.name} (${t.code})${t.publishedVersionNo ? "" : " — not published"}` })),
    [list, selfCode],
  );
  const params = el.params && typeof el.params === "object" ? el.params : {};
  const entries = Object.entries(params);
  const put = (next) => set({ params: Object.fromEntries(next.filter(([k]) => k !== "")) });
  const loaded = sample?.__sub?.[el.templateCode];
  const picked = list.find((t) => t.code === el.templateCode);
  return (
    <>
      <Row label="Template" wide hint="Its report header, groups, detail and report footer print inside this box, reflowed to its width">
        <Select value={el.templateCode || ""} onChange={(v) => set({ templateCode: v })} options={options} placeholder="Choose a template…" />
      </Row>
      {el.templateCode && (
        <div className={`pbx-subinfo${loaded ? " is-ok" : ""}`}>
          <Icon name={loaded ? "check" : "alert"} size={13} />
          {loaded
            ? `Loaded with the sample · ${(loaded.template?.bands || []).length} bands${loaded.data ? "" : " · uses this template's data"}`
            : picked && !picked.publishedVersionNo
              ? "Publish that template first: sub-reports print its published version."
              : "Fetch sample again to load it into the canvas and preview."}
          {picked && (
            <a className="pbx-sublink" href={`#/print-builder/${picked.code}`} onClick={(e) => { e.preventDefault(); window.open(`${window.location.pathname.replace(/\/print-builder.*$/, "")}/print-builder/${picked.code}`, "_blank"); }}>
              Open ↗
            </a>
          )}
        </div>
      )}
      <Row label="Use this data" hint="On: the sub-report reads this template's data (a shared layout block). Off: it runs its own datasource with the parameters below.">
        <Toggle value={!!el.useParentData} onChange={(v) => set({ useParentData: v || undefined })} />
      </Row>
      {!el.useParentData && (
        <div className="pbx-submap">
          <div className="pbx-col-sub">Parameters passed down</div>
          {entries.map(([k, v], i) => (
            <div key={i} className="pbx-submap-row">
              <TextInput value={k} onChange={(nk) => put(entries.map((e, j) => (j === i ? [nk, e[1]] : e)))} placeholder="transactionId" />
              <span className="pbx-muted">←</span>
              <Select
                value={v}
                onChange={(nv) => put(entries.map((e, j) => (j === i ? [e[0], nv] : e)))}
                options={[...new Set([v, ...rootFields.filter((f) => f.kind === "param" || f.path.startsWith("user.") || f.path.startsWith("centre.")).map((f) => f.path)])].filter(Boolean)}
                placeholder="params.…"
              />
              <Tap className="is-icon" tone="danger" onClick={() => put(entries.filter((_, j) => j !== i))} title="Remove">
                <Icon name="trash" size={12} />
              </Tap>
            </div>
          ))}
          <Tap tone="add" className="is-small" onClick={() => set({ params: { ...params, [`param${entries.length + 1}`]: "" } })}>
            ＋ Parameter
          </Tap>
          <p className="pbx-hint">Values: params.x, user.x, centre.x (this print's values) or a fixed text. The sub-report sees this band's row as {"{{parent.Field}}"}.</p>
        </div>
      )}
      <Row label="Own font" hint="Off: the sub-report prints in this template's font">
        <Toggle value={el.inheritTheme === false} onChange={(v) => set({ inheritTheme: v ? false : undefined })} />
      </Row>
      <Row label="When empty">
        <TextInput value={el.emptyText} onChange={(v) => set({ emptyText: v || undefined })} placeholder="(nothing)" />
      </Row>
    </>
  );
}

/* ============================================================== template */

export function LayoutSection({ tpl, setTheme, setPage }) {
  const theme = tpl.theme || {};
  return (
    <Section title="Layout direction & binding" defaultOpen={theme.direction === "rtl" || !!tpl.page?.mirrorMargins}>
      <Row label="Direction" hint="Right to left mirrors the layout (what is drawn on the left prints on the right), swaps left/right alignment and reads tables from the right. Auto: right to left when the print's language is (Arabic, Urdu…), else left to right">
        <Segmented
          value={theme.direction === "rtl" || theme.direction === "ltr" ? theme.direction : "auto"}
          onChange={(v) => setTheme({ direction: v === "auto" ? undefined : v })}
          options={[
            { value: "auto", label: "Auto" },
            { value: "ltr", label: "Left → right" },
            { value: "rtl", label: "Right → left" },
          ]}
        />
      </Row>
      <Row label="Mirror margins" hint="For bound / two-sided prints: even pages swap the left and right margins">
        <Toggle value={!!tpl.page?.mirrorMargins} onChange={(v) => setPage({ mirrorMargins: v || undefined })} />
      </Row>
    </Section>
  );
}

/* "Powered by ITDOSE InfoSystems Pvt. Ltd." on every printed page: where and how it looks. */
const CREDIT_SPOTS = [
  { value: "left-edge", label: "Left edge", hint: "Runs up the left margin" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom centre" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "right-edge", label: "Right edge", hint: "Runs down the right margin" },
];
const CREDIT_LOOKS = [
  { value: "minimal", label: "Minimal" },
  { value: "pill", label: "Outline" },
  { value: "soft", label: "Soft" },
  { value: "dark", label: "Dark" },
];

function CreditSample({ look, mark = POWERED_BY_MARK, label = POWERED_BY_LABEL, text = POWERED_BY }) {
  return (
    <span className={`pbx-credit-sample is-${look}`}>
      {mark && <i>{mark}</i>}
      {label && <em>{label}</em>}
      <b>{text.split(/\s+/)[0]}</b>
    </span>
  );
}

export function PoweredBySection({ tpl, setPage }) {
  const raw = tpl.page?.poweredBy;
  const on = raw !== false;
  const o = raw && typeof raw === "object" ? raw : {};
  const position = o.position || "bottom-center";
  const look = o.style || "minimal";
  const mark = typeof o.mark === "string" ? o.mark : POWERED_BY_MARK;
  const label = typeof o.label === "string" ? o.label : POWERED_BY_LABEL;
  const text = typeof o.text === "string" && o.text.trim() ? o.text : POWERED_BY;
  const set = (patch) => {
    const next = { ...o, ...patch };
    Object.keys(next).forEach((k) => (next[k] === undefined || next[k] === "" || next[k] === 0) && delete next[k]);
    if (next.position === "bottom-center") delete next.position;
    if (next.style === "minimal") delete next.style;
    // the wording is kept only when it differs from the default; an emptied label stays "" (hidden)
    if ("label" in patch) patch.label === POWERED_BY_LABEL ? delete next.label : (next.label = patch.label);
    if ("mark" in patch) patch.mark === POWERED_BY_MARK ? delete next.mark : (next.mark = patch.mark);
    if (next.text === POWERED_BY) delete next.text;
    setPage({ poweredBy: Object.keys(next).length ? next : undefined });
  };
  return (
    <Section title="Powered by" defaultOpen={false}>
      <Row label="Show" hint="“Powered by ITDOSE InfoSystems Pvt. Ltd.” on every printed page (not on label sheets). It sits in the margin, outside the layout, so it never moves anything.">
        <Toggle value={on} onChange={(v) => setPage({ poweredBy: v ? undefined : false })} />
      </Row>
      {on && (
        <>
          <Row label="Where" wide>
            <div className="pbx-credit-spots" role="radiogroup" aria-label="Position">
              <span className="pbx-credit-sheet" aria-hidden="true" />
              {CREDIT_SPOTS.map((sp) => (
                <Tap
                  key={sp.value}
                  role="radio"
                  aria-checked={position === sp.value}
                  className={`pbx-credit-spot is-${sp.value}${position === sp.value ? " is-on" : ""}`}
                  title={sp.hint || sp.label}
                  onClick={() => set({ position: sp.value })}
                >
                  <span />
                </Tap>
              ))}
              <span className="pbx-credit-spotname">{CREDIT_SPOTS.find((s) => s.value === position)?.label}</span>
            </div>
          </Row>
          <Row label="Look" wide>
            <div className="pbx-credit-looks" role="radiogroup" aria-label="Look">
              {CREDIT_LOOKS.map((l) => (
                <Tap key={l.value} role="radio" aria-checked={look === l.value} className={`pbx-credit-look${look === l.value ? " is-on" : ""}`} onClick={() => set({ style: l.value })} title={l.label}>
                  <CreditSample look={l.value} mark={mark.trim()} label={label.trim()} text={text.trim() || POWERED_BY} />
                  <small>{l.label}</small>
                </Tap>
              ))}
            </div>
          </Row>
          <Row label="Nudge" hint="Fine-tune in millimetres: right / up are positive">
            <span className="pbx-inline">
              <NumberInput value={o.dx || 0} step={0.5} suffix="↔ mm" onChange={(v) => set({ dx: v || undefined })} />
              <NumberInput value={o.dy || 0} step={0.5} suffix="↕ mm" onChange={(v) => set({ dy: v || undefined })} />
            </span>
          </Row>
          <Row label="Badge" hint={`The short text in the coloured badge (up to 8 letters). Default “${POWERED_BY_MARK}”; clear it to drop the badge.`}>
            <TextInput value={mark} onChange={(v) => set({ mark: v.slice(0, 8) })} placeholder="(none)" />
          </Row>
          <Row label="Label" hint={`Words before the name. Default “${POWERED_BY_LABEL}”; clear it to print the name alone.`}>
            <TextInput value={label} onChange={(v) => set({ label: v })} placeholder="(none)" />
          </Row>
          <Row label="Name" hint={`Printed after the label; its first word is bold. Default “${POWERED_BY}”.`}>
            <TextInput value={text} onChange={(v) => set({ text: v })} placeholder={POWERED_BY} />
          </Row>
          {(o.mark !== undefined || o.label !== undefined || o.text !== undefined) && (
            <Row label="">
              <Tap tone="list" className="is-small" onClick={() => set({ mark: POWERED_BY_MARK, label: POWERED_BY_LABEL, text: undefined })} title="Back to the default wording">
                <Icon name="refresh" size={12} /> Default text
              </Tap>
            </Row>
          )}
        </>
      )}
    </Section>
  );
}

export function SecuritySection({ tpl, fields, update }) {
  const s = tpl.security || {};
  const set = (patch) =>
    update((t) => {
      const next = { ...(t.security || {}), ...patch };
      Object.keys(next).forEach((k) => (next[k] === undefined || next[k] === "") && delete next[k]);
      if (Object.keys(next).length) t.security = next;
      else delete t.security;
    }, `security:${Object.keys(patch).join(",")}`);
  const on = Object.keys(s).length > 0;
  return (
    <Section title="PDF protection" defaultOpen={on}>
      <p className="pbx-hint">Applied by the server to the PDF. Leave everything off for normal prints.</p>
      <Row label="Open password" wide hint="An expression giving the password, e.g. the patient's mobile number or date of birth. Blank = no password.">
        <ExprInput value={s.passwordExpr} onChange={(v) => set({ passwordExpr: v || undefined })} fields={fields} placeholder="right(bill.Mobile, 4)" />
      </Row>
      <Row label="Allow">
        <span className="pbx-inline is-wrap">
          <Toggle value={s.allowPrint !== false} onChange={(v) => set({ allowPrint: v ? undefined : false })} label="Print" />
          <Toggle value={s.allowCopy !== false} onChange={(v) => set({ allowCopy: v ? undefined : false })} label="Copy text" />
          <Toggle value={!!s.allowModify} onChange={(v) => set({ allowModify: v || undefined })} label="Edit" />
        </span>
      </Row>
      <Row label="Digital signature" hint="Signs the PDF with the server's certificate (PrintBuilder:Signing in appsettings). Without one configured the print is not signed and the message says so.">
        <Toggle value={!!s.sign} onChange={(v) => set({ sign: v || undefined })} />
      </Row>
      <Row label="PDF/A (archive)" hint="Long-term archive format, when the server supports it">
        <Toggle value={!!s.pdfa} onChange={(v) => set({ pdfa: v || undefined })} />
      </Row>
    </Section>
  );
}

export function ReprintSection({ tpl, params, update }) {
  const r = tpl.reprint || {};
  const set = (patch) =>
    update((t) => {
      const next = { ...(t.reprint || {}), ...patch };
      Object.keys(next).forEach((k) => (next[k] === undefined || next[k] === "" || next[k] === false) && delete next[k]);
      if (Object.keys(next).length) t.reprint = next;
      else delete t.reprint;
    }, `reprint:${Object.keys(patch).join(",")}`);
  const stamp = () =>
    update((t) => {
      t.page = { ...t.page, watermark: { opacity: 0.08, size: 64, angle: -30, color: "#b91c1c", ...(t.page.watermark || {}), text: "DUPLICATE · {{sys.reprintCount}}", when: "sys.duplicate" } };
    }, "wm:stamp");
  return (
    <Section title="Reprints & audit" defaultOpen={!!Object.keys(r).length}>
      <p className="pbx-hint">Every print is logged (who, when, which record, duplicate or not). Here you decide what a duplicate needs.</p>
      <Row label="Ask a reason" hint="A duplicate print is refused unless the screen sends a reason (printTemplate asks for it)">
        <Toggle value={!!r.requireReason} onChange={(v) => set({ requireReason: v || undefined })} />
      </Row>
      <Row label="Record key" hint="The parameter that identifies the record, for counting reprints (blank = all parameters together)">
        <Select value={r.keyParam || ""} onChange={(v) => set({ keyParam: v || undefined })} options={params} placeholder="(all parameters)" />
      </Row>
      <Row label="Max duplicates" hint="Refuse more duplicates than this for one record. Blank = no limit.">
        <NumberInput value={r.maxReprints} placeholder="no limit" onChange={(v) => set({ maxReprints: v || undefined })} step={1} min={1} />
      </Row>
      <Tap tone="mode" className="is-small" onClick={stamp} title="Watermark DUPLICATE with the reprint count on duplicate prints">
        <Icon name="stack" size={12} /> Stamp "DUPLICATE · n"
      </Tap>
      <p className="pbx-hint">Print values: {"{{sys.reprintCount}}"}, {"{{sys.printCount}}"}, {"{{sys.reprintReason}}"}.</p>
    </Section>
  );
}

/** Quick doors to the dialogs that manage a template beyond its layout. */
export function GovernanceSection({ onOpen }) {
  const items = [
    ["access", "users", "Who may edit / print", "tone-violet"],
    ["variants", "pin", "Centre & panel variants", "tone-teal"],
    ["whereUsed", "link", "Where used", "tone-amber"],
    ["compare", "compare", "Compare with old print", "tone-rose"],
    ["batch", "stack", "Batch print", "tone-mint"],
  ];
  return (
    <Section title="Manage">
      <div className="pbx-govgrid">
        {items.map(([k, icon, label, tone]) => (
          <Tap key={k} className={`pbx-govbtn ${tone}`} onClick={() => onOpen(k)}>
            <Icon name={icon} size={16} />
            <span>{label}</span>
          </Tap>
        ))}
      </div>
    </Section>
  );
}
