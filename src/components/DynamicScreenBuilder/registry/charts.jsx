/**
 * CHARTS — the one thing a dashboard screen could not do.
 *
 * Drawn as plain SVG on purpose. The app already ships several heavy bundles
 * (exceljs, html2pdf, pdf.js); adding a charting library for four chart shapes
 * would cost more than it is worth, and a library's own runtime fetches and
 * canvas rendering would not survive the print / export paths this app uses.
 * SVG scales, prints, themes from CSS variables and needs nothing installed.
 *
 * Data comes through the same seam as every other data component
 * (`resolveRows`), so a chart binds to its own picked endpoint, to a shared
 * screen data source, or to rows typed into the inspector — and on the canvas
 * it shows whatever Sync last returned.
 */
import React, { useEffect, useMemo } from "react";
import { EmptyState, GROUPS, Icon, Skeleton, p } from "./shared";
import AppHeading from "./appHeading";
import { resolveRows, rowsVarProps, VARS_MODE_OPTION } from "./dataDisplay";
import { isApiConfigReady, createApiConfig, normalizeApiConfig } from "../utils/apiConfig";
import { formatValue } from "../utils/expressions";

/* -------------------------------------------------------------------------- */
/*  palette                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Series colours. Named sets rather than a colour picker per series: a chart
 * with eight bars needs eight colours that work together, which is a decision
 * better made once than eight times.
 */
const SCHEMES = {
  clinical: ["#4f46e5", "#0ea5e9", "#14b8a6", "#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"],
  cool: ["#0ea5e9", "#2563eb", "#4f46e5", "#7c3aed", "#0d9488", "#0891b2", "#3b82f6", "#6366f1"],
  warm: ["#f97316", "#ef4444", "#e11d48", "#d97706", "#eab308", "#f59e0b", "#dc2626", "#c2410c"],
  status: ["#16a34a", "#eab308", "#f97316", "#dc2626", "#64748b", "#0ea5e9", "#7c3aed", "#14b8a6"],
  mono: ["#334155", "#475569", "#64748b", "#94a3b8", "#1e293b", "#0f172a", "#cbd5e1", "#e2e8f0"],
};

const SCHEME_OPTIONS = [
  { value: "clinical", label: "Clinical (mixed)" },
  { value: "cool", label: "Cool blues" },
  { value: "warm", label: "Warm" },
  { value: "status", label: "Status (green → red)" },
  { value: "mono", label: "Monochrome" },
];

const colorAt = (scheme, i) => {
  const list = SCHEMES[scheme] || SCHEMES.clinical;
  return list[i % list.length];
};

/* -------------------------------------------------------------------------- */
/*  shaping                                                                    */
/* -------------------------------------------------------------------------- */

const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** First key that looks like a label, then a value — same idea as a select's. */
function guessFields(rows) {
  const row = rows.find((r) => r && typeof r === "object") || {};
  const keys = Object.keys(row);
  const label = keys.find((k) => typeof row[k] === "string") || keys[0] || "";
  const value = keys.find((k) => k !== label && num(row[k]) !== 0) || keys.find((k) => k !== label) || "";
  return { label, value };
}

/**
 * Rows -> plottable points.
 *
 * `groupBy` is what makes a chart useful over a raw list: a table of 400
 * admissions becomes six bars by ward without anybody writing a query. Without
 * it each row is its own point, which is what a pre-aggregated endpoint wants.
 */
function toPoints(rows, { labelField, valueField, groupBy, aggregate, maxItems, sort }) {
  const list = Array.isArray(rows) ? rows.filter((r) => r && typeof r === "object") : [];
  if (!list.length) return [];

  const guess = labelField && valueField ? null : guessFields(list);
  const lf = labelField || guess?.label || "";
  const vf = valueField || guess?.value || "";

  let points;
  if (groupBy) {
    const buckets = new Map();
    list.forEach((row) => {
      const key = String(row[groupBy] ?? "—");
      const cur = buckets.get(key) || { label: key, value: 0, count: 0 };
      cur.value += aggregate === "count" ? 1 : num(row[vf]);
      cur.count += 1;
      buckets.set(key, cur);
    });
    points = Array.from(buckets.values()).map((b) =>
      aggregate === "avg" ? { ...b, value: b.count ? b.value / b.count : 0 } : b,
    );
  } else {
    points = list.map((row) => ({
      label: String(row[lf] ?? ""),
      value: aggregate === "count" ? 1 : num(row[vf]),
      count: 1,
      row,
    }));
  }

  if (sort === "desc") points.sort((a, b) => b.value - a.value);
  else if (sort === "asc") points.sort((a, b) => a.value - b.value);
  else if (sort === "label") points.sort((a, b) => String(a.label).localeCompare(String(b.label)));

  const cap = Math.max(1, Number(maxItems) || 12);
  if (points.length <= cap) return points;
  // Everything past the cap is rolled into one slice rather than dropped, so
  // the total a pie shows still matches the total the table shows.
  const head = points.slice(0, cap - 1);
  const tail = points.slice(cap - 1);
  return [...head, { label: `Other (${tail.length})`, value: tail.reduce((s, x) => s + x.value, 0), count: tail.length }];
}

/** Rounded "nice" axis top, so the gridlines land on readable numbers. */
function niceMax(max) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

const shortNum = (v) => {
  const n = Math.abs(v);
  if (n >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(Math.round(v * 100) / 100);
};

/** Cut a long category label rather than let it collide with its neighbour. */
const clip = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

/* -------------------------------------------------------------------------- */
/*  the shapes                                                                 */
/* -------------------------------------------------------------------------- */

const PAD = { top: 14, right: 12, bottom: 26, left: 40 };

/**
 * @param onPoint  fired with the point that was clicked, when the chart's node
 *                 carries an onClick chain. A chart nobody can click through is
 *                 a picture; "show me this ward's patients" is why it is on the
 *                 screen at all.
 */
function CartesianChart({ points, kind, scheme, height, showGrid, showValues, horizontal, onPoint }) {
  const hit = (pt, i) => (onPoint ? { onClick: () => onPoint(pt, i), className: "dsb-chart-hit" } : null);
  const W = 640; // viewBox width; the SVG scales to its box
  const H = Math.max(140, Number(height) || 240);
  const max = niceMax(Math.max(...points.map((p2) => p2.value), 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f * 100) / 100);

  if (horizontal) {
    const rowH = Math.max(16, (H - PAD.top - 8) / points.length);
    const left = 96;
    return (
      <svg className="dsb-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
        {showGrid
          ? ticks.map((t, i) => {
              const x = left + ((W - left - PAD.right) * i) / (ticks.length - 1);
              return (
                <g key={t + "-" + i}>
                  <line x1={x} y1={PAD.top - 6} x2={x} y2={H - 6} className="dsb-chart-grid" />
                  <text x={x} y={H - 1} className="dsb-chart-tick" textAnchor="middle">{shortNum(t)}</text>
                </g>
              );
            })
          : null}
        {points.map((pt, i) => {
          const y = PAD.top + i * rowH;
          const w = max ? ((W - left - PAD.right) * pt.value) / max : 0;
          return (
            <g key={pt.label + i}>
              <text x={left - 8} y={y + rowH / 2 + 3} className="dsb-chart-cat" textAnchor="end">{clip(pt.label, 16)}</text>
              <rect
                x={left}
                y={y + 2}
                width={Math.max(w, pt.value > 0 ? 2 : 0)}
                height={Math.max(6, rowH - 6)}
                rx="3"
                fill={colorAt(scheme, i)}
                {...hit(pt, i)}
              />
              {showValues ? (
                <text x={left + w + 5} y={y + rowH / 2 + 3} className="dsb-chart-val">{shortNum(pt.value)}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
    );
  }

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const step = plotW / points.length;
  const yOf = (v) => PAD.top + plotH - (max ? (plotH * v) / max : 0);
  const xMid = (i) => PAD.left + step * i + step / 2;
  const line = points.map((pt, i) => `${i ? "L" : "M"}${xMid(i)},${yOf(pt.value)}`).join(" ");

  return (
    <svg className="dsb-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
      {showGrid
        ? ticks.map((t, i) => {
            const y = PAD.top + plotH - (plotH * i) / (ticks.length - 1);
            return (
              <g key={t + "-" + i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} className="dsb-chart-grid" />
                <text x={PAD.left - 6} y={y + 3} className="dsb-chart-tick" textAnchor="end">{shortNum(t)}</text>
              </g>
            );
          })
        : null}

      {kind === "area" ? (
        <path d={`${line} L${xMid(points.length - 1)},${PAD.top + plotH} L${xMid(0)},${PAD.top + plotH} Z`} fill={colorAt(scheme, 0)} opacity="0.16" />
      ) : null}

      {kind === "line" || kind === "area" ? (
        <>
          <path d={line} fill="none" stroke={colorAt(scheme, 0)} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((pt, i) => (
            <circle
              key={pt.label + i}
              cx={xMid(i)}
              cy={yOf(pt.value)}
              r="3.5"
              fill="#fff"
              stroke={colorAt(scheme, 0)}
              strokeWidth="2"
              {...hit(pt, i)}
            />
          ))}
        </>
      ) : (
        points.map((pt, i) => {
          const bw = Math.max(4, Math.min(38, step * 0.62));
          const y = yOf(pt.value);
          return (
            <rect
              key={pt.label + i}
              x={xMid(i) - bw / 2}
              y={y}
              width={bw}
              height={Math.max(PAD.top + plotH - y, pt.value > 0 ? 2 : 0)}
              rx="3"
              fill={colorAt(scheme, i)}
              {...hit(pt, i)}
            />
          );
        })
      )}

      {showValues
        ? points.map((pt, i) => (
            <text key={"v" + pt.label + i} x={xMid(i)} y={yOf(pt.value) - 6} className="dsb-chart-val" textAnchor="middle">
              {shortNum(pt.value)}
            </text>
          ))
        : null}

      {points.map((pt, i) => (
        <text key={"c" + pt.label + i} x={xMid(i)} y={H - 8} className="dsb-chart-cat" textAnchor="middle">
          {clip(pt.label, Math.max(4, Math.floor(step / 6)))}
        </text>
      ))}
    </svg>
  );
}

function PieChart({ points, scheme, height, donut, showValues, onPoint }) {
  const H = Math.max(140, Number(height) || 240);
  const total = points.reduce((s, x) => s + x.value, 0);
  const R = Math.min(H, 240) / 2 - 6;
  const cx = R + 8;
  const cy = H / 2;
  const inner = donut ? R * 0.58 : 0;

  if (total <= 0) return <svg className="dsb-chart-svg" viewBox={`0 0 ${R * 2 + 16} ${H}`} />;

  let acc = -Math.PI / 2;
  const arcs = points.map((pt, i) => {
    const frac = pt.value / total;
    const a0 = acc;
    const a1 = acc + frac * Math.PI * 2;
    acc = a1;
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const pOn = (r, a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    // A single slice covering the whole circle cannot be drawn as one arc.
    const d =
      frac >= 0.9999
        ? `M${cx - R},${cy} A${R},${R} 0 1 1 ${cx + R},${cy} A${R},${R} 0 1 1 ${cx - R},${cy}Z`
        : inner
          ? `M${pOn(R, a0)} A${R},${R} 0 ${big} 1 ${pOn(R, a1)} L${pOn(inner, a1)} A${inner},${inner} 0 ${big} 0 ${pOn(inner, a0)} Z`
          : `M${cx},${cy} L${pOn(R, a0)} A${R},${R} 0 ${big} 1 ${pOn(R, a1)} Z`;
    const mid = (a0 + a1) / 2;
    return { d, fill: colorAt(scheme, i), pct: Math.round(frac * 1000) / 10, mid, frac, pt };
  });

  return (
    <svg className="dsb-chart-svg" viewBox={`0 0 ${R * 2 + 16} ${H}`} role="img">
      {arcs.map((a, i) => (
        <path
          key={i}
          d={a.d}
          fill={a.fill}
          className={onPoint ? "dsb-chart-hit" : undefined}
          onClick={onPoint ? () => onPoint(a.pt, i) : undefined}
        />
      ))}
      {donut ? (
        <>
          <text x={cx} y={cy - 2} className="dsb-chart-hole-v" textAnchor="middle">{shortNum(total)}</text>
          <text x={cx} y={cy + 12} className="dsb-chart-hole-l" textAnchor="middle">Total</text>
        </>
      ) : null}
      {showValues
        ? arcs
            // A label on a sliver collides with its neighbours and reads as noise.
            .filter((a) => a.frac > 0.06)
            .map((a, i) => (
              <text
                key={"p" + i}
                x={cx + (inner ? (R + inner) / 2 : R * 0.62) * Math.cos(a.mid)}
                y={cy + (inner ? (R + inner) / 2 : R * 0.62) * Math.sin(a.mid) + 3}
                className="dsb-chart-slice"
                textAnchor="middle"
              >
                {a.pct}%
              </text>
            ))
        : null}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  the component                                                              */
/* -------------------------------------------------------------------------- */

const CHART_TYPES = [
  { value: "bar", label: "Bar (vertical)" },
  { value: "hbar", label: "Bar (horizontal)" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "donut", label: "Donut" },
];

const ChartDef = {
  type: "ChartBlock",
  label: "Chart",
  icon: "ChartLine",
  category: "Data",
  defaultProps: {
    title: "Admissions by ward",
    subtitle: "",
    chartType: "bar",
    dataMode: "static",
    staticRows: [
      { label: "ICU", value: 24 },
      { label: "Casualty", value: 38 },
      { label: "Ward A", value: 17 },
      { label: "Ward B", value: 11 },
      { label: "Day Care", value: 6 },
    ],
    previewRows: [],
    apiConfig: createApiConfig(),
    dataSourceId: "",
    labelField: "",
    valueField: "",
    groupBy: "",
    aggregate: "sum",
    sort: "none",
    maxItems: 12,
    scheme: "clinical",
    height: 240,
    showGrid: true,
    showValues: true,
    showLegend: true,
    valueFormat: "",
  },
  defaultStyle: {},
  // onClick carries the point that was clicked, so "drill into this ward" is a
  // chain rather than a rebuild.
  events: ["onLoad", "onClick"],
  bindable: true,
  propSchema: [
    p.text("title", "Title"),
    p.text("subtitle", "Subtitle"),
    p.select("chartType", "Chart type", CHART_TYPES),

    p.select(
      "dataMode",
      "Rows come from",
      [
        { value: "static", label: "Front-end rows (edited here)" },
        { value: "api", label: "Dynamic API (endpoint)" },
        { value: "action", label: "Filled by a button / action" },
        VARS_MODE_OPTION,
      ],
      GROUPS.DATA,
    ),
    ...rowsVarProps(GROUPS.DATA),
    { key: "staticRows", label: "Rows", type: "rows", group: GROUPS.DATA, when: (pr) => (pr.dataMode || "static") === "static" },
    { key: "apiConfig", label: "API endpoint", type: "apiEndpoint", group: GROUPS.DATA, when: (pr) => pr.dataMode === "api" },
    p.text("dataSourceId", "Shared data source id", GROUPS.DATA, {
      when: (pr) => pr.dataMode === "api" && !isApiConfigReady(pr.apiConfig),
    }),

    p.dataKey("labelField", "Label field", GROUPS.DATA, { placeholder: "Guessed from the data" }),
    p.dataKey("valueField", "Value field", GROUPS.DATA, {
      placeholder: "Guessed from the data",
      when: (pr) => pr.aggregate !== "count",
    }),
    p.dataKey("groupBy", "Group rows by", GROUPS.DATA, {
      placeholder: "One point per row",
      hint: "Turns a list of records into one point per distinct value",
    }),
    p.select(
      "aggregate",
      "Combine with",
      [
        { value: "sum", label: "Sum of the value field" },
        { value: "count", label: "Count of rows" },
        { value: "avg", label: "Average of the value field" },
      ],
      GROUPS.DATA,
    ),
    p.select(
      "sort",
      "Order",
      [
        { value: "none", label: "As the data comes" },
        { value: "desc", label: "Largest first" },
        { value: "asc", label: "Smallest first" },
        { value: "label", label: "By label (A→Z)" },
      ],
      GROUPS.DATA,
    ),
    p.number("maxItems", "Max points", GROUPS.DATA, { hint: "The rest are rolled into one “Other” point" }),

    p.select("scheme", "Colours", SCHEME_OPTIONS),
    p.number("height", "Height (px)"),
    p.bool("showGrid", "Gridlines", GROUPS.APPEARANCE),
    p.bool("showValues", "Value labels", GROUPS.APPEARANCE),
    p.bool("showLegend", "Legend", GROUPS.APPEARANCE),
    p.text("valueFormat", "Value format", GROUPS.APPEARANCE, { placeholder: "number | currency | percent" }),
  ],
  render: ({ node, props, style, rt }) => {
    // Same auto-load contract as the table: the rendered screen calls its own
    // endpoint, the canvas never does.
    const api = props.apiConfig;
    const apiKey = useMemo(() => (isApiConfigReady(api) ? JSON.stringify(normalizeApiConfig(api)) : ""), [api]);
    const refreshNode = rt?.refreshNode;
    const design = !!rt?.design;
    useEffect(() => {
      if (!apiKey || design || !refreshNode) return;
      const cfg = JSON.parse(apiKey);
      if (cfg.autoLoad === false) return;
      refreshNode(node.id, cfg);
    }, [apiKey, design, refreshNode, node.id]);

    const { rows, loading, error } = resolveRows(node, props, rt);
    const points = useMemo(
      () =>
        toPoints(rows, {
          labelField: props.labelField,
          valueField: props.valueField,
          groupBy: props.groupBy,
          aggregate: props.aggregate || "sum",
          maxItems: props.maxItems,
          sort: props.sort,
        }),
      [rows, props.labelField, props.valueField, props.groupBy, props.aggregate, props.maxItems, props.sort],
    );

    const kind = props.chartType || "bar";
    // Only wired when there is a chain to run: an unclickable chart must not
    // grow a pointer cursor for nothing.
    const clickable = !design && !props.disabled && !!node?.events?.onClick?.length;
    const onPoint = clickable
      ? (pt, i) => rt?.runEvent(node, "onClick", { value: pt.value, label: pt.label, index: i, row: pt.row || null, point: pt })
      : undefined;
    const total = points.reduce((s, x) => s + x.value, 0);
    const fmt = (v) => (props.valueFormat ? formatValue(v, props.valueFormat) : shortNum(v));

    return (
      <div className="dsb-chart" style={style}>
        {/* The app's heading, as on every page and card: title left, the
            subtitle and the total on the right. */}
        {props.title || props.subtitle ? (
          <AppHeading
            title={props.title || ""}
            className="is-chart-head"
            right={
              props.subtitle || points.length ? (
                <>
                  {props.subtitle ? <span className="dsb-apphead-sub">{props.subtitle}</span> : null}
                  {points.length ? <span className="dsb-chart-total">{fmt(total)}</span> : null}
                </>
              ) : null
            }
          />
        ) : null}

        {loading && !points.length ? (
          <Skeleton rows={4} height={Math.max(18, ((Number(props.height) || 240) - 18) / 4)} />
        ) : error ? (
          <EmptyState icon="AlertCircle" title="Could not load the chart" hint={String(error)} />
        ) : !points.length ? (
          <EmptyState icon="LineChart" title="No data to plot" hint="Pick a label and a value field, or check the endpoint." />
        ) : (
          <div className="dsb-chart-body" style={{ height: Math.max(140, Number(props.height) || 240) }}>
            {kind === "pie" || kind === "donut" ? (
              <PieChart
                points={points}
                scheme={props.scheme}
                height={props.height}
                donut={kind === "donut"}
                showValues={props.showValues !== false}
                onPoint={onPoint}
              />
            ) : (
              <CartesianChart
                points={points}
                kind={kind === "hbar" ? "bar" : kind}
                horizontal={kind === "hbar"}
                scheme={props.scheme}
                height={props.height}
                showGrid={props.showGrid !== false}
                showValues={props.showValues !== false}
                onPoint={onPoint}
              />
            )}
          </div>
        )}

        {props.showLegend !== false && points.length ? (
          <div className="dsb-chart-legend">
            {points.map((pt, i) => (
              <span key={pt.label + i}>
                <i style={{ background: colorAt(props.scheme, kind === "line" || kind === "area" ? 0 : i) }} />
                {pt.label}
                <b>{fmt(pt.value)}</b>
              </span>
            ))}
          </div>
        ) : null}

        {design && !points.length ? (
          <div className="dsb-chart-hint">
            <Icon name="Info" size={12} /> Sync the endpoint, or type rows in the inspector.
          </div>
        ) : null}
      </div>
    );
  },
};

export { toPoints, niceMax, colorAt, SCHEMES, shortNum };

export default [ChartDef];
