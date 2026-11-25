import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { SearchVitalSignChart } from "../../../../networkServices/nursingWardAPI";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Safe numeric parse (strips commas / units).
const toNumber = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(String(val).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

// ── Critical (normal) ranges in the units the Vital Sign capture stores.
//    Temp is Celsius here (the capture form labels it °C). A reading outside
//    [min,max] is flagged "critical" on the graph. ─────────────────────────
const RANGES = {
  systolic: { min: 90, max: 140 },
  diastolic: { min: 60, max: 90 },
  pulse: { min: 60, max: 100 },
  resp: { min: 12, max: 20 },
  temp: { min: 36.0, max: 37.5 },
  spo2: { min: 95, max: 100 },
};
const isOut = (key, v) => {
  const r = RANGES[key];
  if (!r || v === null || v === undefined) return false;
  return v < r.min || v > r.max;
};
// Direction of the breach → drives the HIGH/LOW tag in-chart.
const outDir = (key, v) => {
  const r = RANGES[key];
  if (!r || v === null || v === undefined) return null;
  if (v > r.max) return "high";
  if (v < r.min) return "low";
  return null;
};

const CRITICAL = "#ef4444";

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// ── In-chart critical layer ─────────────────────────────────────────────────
// Highlights every time-point that holds an out-of-range reading (red band +
// dashed guide) and tags each abnormal point with a ▲HIGH / ▼LOW badge so the
// nurse sees exactly WHERE and HOW the trend goes critical — no legend hunting.
const criticalZonesPlugin = {
  id: "criticalZones",
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    if (!xScale || !chartArea) return;
    const datasets = chart.data.datasets || [];

    // Half the gap between two x-ticks → band width.
    let half =
      (xScale.getPixelForValue(1) - xScale.getPixelForValue(0)) / 2;
    if (!Number.isFinite(half) || half <= 0) half = 18;

    // 1) Which time-points are critical (only from visible datasets).
    const critIdx = new Set();
    datasets.forEach((ds, di) => {
      if (!chart.isDatasetVisible(di)) return;
      (ds._outFlags || []).forEach((o, i) => {
        if (o) critIdx.add(i);
      });
    });

    ctx.save();
    // 2) Red bands + dashed guide lines behind the data.
    critIdx.forEach((i) => {
      const cx = xScale.getPixelForValue(i);
      ctx.fillStyle = "rgba(239,68,68,0.08)";
      ctx.fillRect(cx - half, chartArea.top, half * 2, chartArea.bottom - chartArea.top);
      ctx.strokeStyle = "rgba(239,68,68,0.40)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, chartArea.top);
      ctx.lineTo(cx, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3) HIGH / LOW tag on each abnormal point.
    datasets.forEach((ds, di) => {
      if (!chart.isDatasetVisible(di)) return;
      const meta = chart.getDatasetMeta(di);
      (ds._dir || []).forEach((dir, i) => {
        if (!dir) return;
        const pt = meta?.data?.[i];
        if (!pt) return;
        const label = dir === "high" ? "▲ HIGH" : "▼ LOW";
        ctx.font = "700 9px 'DM Sans', system-ui, sans-serif";
        const padX = 4;
        const h = 14;
        const w = ctx.measureText(label).width + padX * 2;
        let bx = pt.x - w / 2;
        let by = dir === "high" ? pt.y - h - 9 : pt.y + 9;
        bx = Math.max(chartArea.left + 2, Math.min(chartArea.right - w - 2, bx));
        by = Math.max(chartArea.top + 2, Math.min(chartArea.bottom - h - 2, by));
        ctx.fillStyle = CRITICAL;
        roundRect(ctx, bx, by, w, h, 3);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx + padX, by + h / 2 + 0.5);
      });
    });
    ctx.restore();
  },
};

// One plotted vital line. `series` carries {label,color,key}.
const SERIES = [
  { key: "systolic", label: "Systolic BP", color: "#f59e0b" },
  { key: "diastolic", label: "Diastolic BP", color: "#7c3aed" },
  { key: "pulse", label: "Pulse", color: "#16a34a" },
  { key: "resp", label: "Respiration", color: "#2563eb" },
  { key: "temp", label: "Temp (°C)", color: "#dc2626" },
  { key: "spo2", label: "SpO2", color: "#0891b2" },
];

export default function EmergencyVitalGraphModal({ data }) {
  const [t] = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const tid = data?.TID ?? data?.transactionID;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await SearchVitalSignChart(tid);
        if (!alive) return;
        setRows(resp?.success && Array.isArray(resp?.data) ? resp.data : []);
      } catch (e) {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tid]);

  // Normalize API rows (oldest → newest) into plottable points.
  const points = useMemo(() => {
    const mapped = rows.map((it) => {
      let systolic = null;
      let diastolic = null;
      if (String(it?.BP || "").includes("/")) {
        const [s, d] = String(it.BP).split("/").map(toNumber);
        systolic = s;
        diastolic = d;
      } else {
        systolic = toNumber(it?.BP);
      }
      return {
        label: `${it?.DATE ?? ""} ${it?.Time ?? ""}`.trim(),
        systolic,
        diastolic,
        pulse: toNumber(it?.pulse ?? it?.Pulse),
        resp: toNumber(it?.resp ?? it?.Resp),
        temp: toNumber(it?.Temp),
        spo2: toNumber(it?.SPO2 ?? it?.Oxygen),
      };
    });
    return mapped;
  }, [rows]);

  const labels = points.map((p) => p.label);

  // Total count of out-of-range readings across all vitals (for the header chip).
  const criticalCount = useMemo(
    () =>
      points.reduce((acc, p) => {
        SERIES.forEach((s) => {
          if (isOut(s.key, p[s.key])) acc += 1;
        });
        return acc;
      }, 0),
    [points]
  );

  const chartData = {
    labels,
    datasets: SERIES.map((s) => {
      const values = points.map((p) => p[s.key]);
      const outFlags = values.map((v) => isOut(s.key, v));
      const dirs = values.map((v) => outDir(s.key, v));
      return {
        label: s.label,
        data: values,
        borderColor: s.color,
        backgroundColor: `${s.color}22`,
        tension: 0.35,
        spanGaps: true,
        borderWidth: 2,
        // Critical readings pop as larger red dots.
        pointRadius: outFlags.map((o) => (o ? 6 : 3)),
        pointHoverRadius: outFlags.map((o) => (o ? 8 : 5)),
        pointBackgroundColor: outFlags.map((o) => (o ? CRITICAL : s.color)),
        pointBorderColor: outFlags.map((o) => (o ? CRITICAL : s.color)),
        // Colour the connecting line RED whenever it touches a critical reading.
        segment: {
          borderColor: (ctx) =>
            outFlags[ctx.p0DataIndex] || outFlags[ctx.p1DataIndex]
              ? CRITICAL
              : s.color,
        },
        _outFlags: outFlags,
        _dir: dirs,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", axis: "x", intersect: false },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 11 },
          // Force the legend swatch to the LINE colour (the per-point red dots
          // for critical readings would otherwise mislead the legend colours).
          generateLabels: (chart) =>
            chart.data.datasets.map((ds, i) => ({
              text: ds.label,
              fillStyle: ds.borderColor,
              strokeStyle: ds.borderColor,
              lineWidth: 2,
              pointStyle: "circle",
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
            })),
        },
      },
      tooltip: {
        callbacks: {
          // Flag the critical readings inside the tooltip too.
          label: (ctx) => {
            const ds = ctx.dataset;
            const out = ds?._outFlags?.[ctx.dataIndex];
            const base = `${ctx.dataset.label}: ${ctx.formattedValue}`;
            return out ? `⚠ ${base}  (out of range)` : base;
          },
        },
      },
      title: { display: false },
    },
    scales: {
      x: { ticks: { maxRotation: 0, autoSkip: true, font: { size: 10 } }, grid: { display: false } },
      y: {
        title: { display: true, text: t("Value") },
        grid: { color: "rgba(148,163,184,.15)" },
        ticks: { font: { size: 10 } },
      },
    },
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", padding: "4px 6px" }}>
      {/* Compact critical summary — the popup is otherwise graph-only. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1f2a37" }}>
            <i className="fas fa-chart-line" style={{ color: "#6d28d9", marginRight: "6px" }} aria-hidden="true" />
            {t("Vital Sign Trend")}
          </span>
          {criticalCount > 0 && (
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", background: CRITICAL, borderRadius: "999px", padding: "2px 10px" }}>
              <i className="fas fa-triangle-exclamation" style={{ marginRight: "5px" }} aria-hidden="true" />
              {criticalCount} {t("Critical Reading(s)")}
            </span>
          )}
        </div>
        <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", background: "rgba(239,68,68,0.18)", border: "1px dashed #ef4444", verticalAlign: "middle", marginRight: "5px" }} />
          {t("Red zones flag critical time-points")} · <b style={{ color: CRITICAL }}>{t("▲HIGH")}</b> / <b style={{ color: CRITICAL }}>{t("▼LOW")}</b> {t("tags mark abnormal values")}
        </span>
      </div>

      <div style={{ height: "60vh", width: "100%", background: "#fff", border: "1px solid #eef0f3", borderRadius: "12px", padding: "10px" }}>
        {loading ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "13px" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} aria-hidden="true" />
            {t("Loading")}…
          </div>
        ) : points.length === 0 ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: "6px" }}>
            <i className="fas fa-chart-line" style={{ fontSize: "26px", opacity: 0.4 }} aria-hidden="true" />
            <span style={{ fontSize: "13px" }}>{t("No vital records found")}</span>
          </div>
        ) : (
          <Line data={chartData} options={options} plugins={[criticalZonesPlugin]} />
        )}
      </div>
    </div>
  );
}
