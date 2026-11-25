import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { LabObservationSearch } from "../../../../networkServices/resultEntry";
import { BindInvestigationViewList } from "../../../../networkServices/Emergency";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// Modern "blink" for out-of-range table cells — a soft pulsing tint (inset glow)
// rather than a harsh on/off, so it draws the eye without being jarring.
if (typeof document !== "undefined" && !document.getElementById("lab-results-blink-style")) {
  const s = document.createElement("style");
  s.id = "lab-results-blink-style";
  s.textContent =
    "@keyframes labBlinkCrit{0%,100%{box-shadow:inset 0 0 0 9999px rgba(220,38,38,0)}50%{box-shadow:inset 0 0 0 9999px rgba(220,38,38,.32)}}" +
    "@keyframes labBlinkAbn{0%,100%{box-shadow:inset 0 0 0 9999px rgba(245,158,11,0)}50%{box-shadow:inset 0 0 0 9999px rgba(245,158,11,.24)}}";
  document.head.appendChild(s);
}

// ── Flag / colour logic — ported verbatim from Result Entry's calculateFlagAndColor
//   (src/pages/ResultEntry/ResultEntry.jsx) so Emergency classifies values with
//   the SAME rules the lab technician sees. ──────────────────────────────────
export const calculateLabFlag = (value, minVal, maxVal, minCrit, maxCrit, defaultFlag) => {
  const numValue = Number(value);
  const minC = Number(minCrit), maxC = Number(maxCrit), minV = Number(minVal), maxV = Number(maxVal);
  const hasMinMax = minV !== 0 || maxV !== 0;
  const hasMinMaxCritical = maxC !== 0 || minC !== 0;
  if (isNaN(numValue) || value === "" || value === null) return { flag: "", colorcode: "" };
  if (hasMinMax) {
    if (hasMinMaxCritical && !isNaN(minC) && numValue <= minC) return { flag: "MINC", colorcode: "orange" };
    if (hasMinMaxCritical && !isNaN(maxC) && numValue >= maxC) return { flag: "MAXC", colorcode: "red" };
    if (!isNaN(minV) && numValue < minV) return { flag: "Low", colorcode: "#FFFF00" };
    if (!isNaN(maxV) && numValue > maxV) return { flag: "High", colorcode: "#FFC0CB" };
    return { flag: "Normal", colorcode: "" };
  }
  if (defaultFlag === "High") return { flag: "High", colorcode: "#FFC0CB" };
  if (defaultFlag === "Low") return { flag: "Low", colorcode: "#FFFF00" };
  if (defaultFlag === "MINC") return { flag: "MINC", colorcode: "orange" };
  if (defaultFlag === "MAXC") return { flag: "MAXC", colorcode: "red" };
  return { flag: "Normal", colorcode: "" };
};

const isAbnormalFlag = (f) => f === "Low" || f === "High" || f === "MINC" || f === "MAXC";
const isCriticalFlag = (f) => f === "MINC" || f === "MAXC";
const toNum = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? n : null; };
const firstDefined = (arr) => arr.find((v) => v !== null && v !== undefined && v !== "");
// Read a field that may arrive under different casings from the API.
const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};
// Radiology / template observations come through as HTML in the value — they are
// not numeric lab parameters, so they're excluded from the trend/table view.
const looksHtml = (v) => /<\/?[a-z][\s\S]*>/i.test(String(v ?? ""));

const parseLabDate = (s) => {
  if (!s) return null;
  const m = moment(s, ["DD-MMM-YY hh:mmA", "DD-MMM-YYYY hh:mmA", "DD-MMM-YY", "DD-MMM-YYYY", "YYYY-MM-DD", moment.ISO_8601], true);
  return m.isValid() ? m : null;
};
const deriveGender = (p) => {
  if (p?.Gender) return p.Gender;
  const s = String(p?.AgeSex || p?.Age_Gender || "");
  if (/female|\/\s*F/i.test(s)) return "Female";
  if (/male|\/\s*M/i.test(s)) return "Male";
  return "";
};
const deriveAgeInDays = (p) => {
  const d = parseLabDate(p?.DOB ?? p?.dob ?? p?.DateOfBirth);
  if (d && d.isValid()) return Math.max(0, moment().diff(d, "days"));
  // Fallback: parse "8 YRS/M" or "8 Y, 1 M 8 D/Male".
  const s = String(p?.AgeSex ?? p?.Age_Gender ?? "");
  const y = Number((s.match(/(\d+)\s*Y/i) || [])[1] || 0);
  const mo = Number((s.match(/(\d+)\s*M(?!ale)/i) || [])[1] || 0);
  const dd = Number((s.match(/(\d+)\s*D/i) || [])[1] || 0);
  return y * 365 + mo * 30 + dd;
};

// Default lab window: last 30 days, but extended back to the admission date so a
// currently-admitted patient's whole episode (incl. older saved/not-approved
// reports) is covered. getLabToPrintNew filters on the booking date (plo.Date),
// so a 30-day window alone would miss reports booked earlier in the admission.
export const defaultLabRange = (patient) => {
  const to = moment();
  let from = moment().subtract(30, "days");
  const admit =
    parseLabDate(patient?.InDateTime) ||
    parseLabDate(patient?.AppointmentDate) ||
    parseLabDate(patient?.admitDate);
  if (admit && admit.isValid() && admit.isBefore(from)) from = admit.clone();
  return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
};

// ── Core data builder ───────────────────────────────────────────────────────
// Mirrors the Result Entry page exactly (it is the proven, working flow):
//   1) PatientSearchMachineResult by UHID → the patient's lab records (each row
//      carries BarcodeNo, Test_ID, Gender, AGE_in_Days, BillDate, Test, Status).
//   2) LabObservationSearch per record using that row's OWN gender/age and
//      macId:"1" (an empty macId returns blank values — that was the bug).
// Observations are grouped into per-parameter time series.
export const buildLabData = async (patient, fromDate, toDate) => {
  const uhid = patient?.PatientID ?? patient?.patientID;
  if (!uhid) return { parameters: [], dates: [], abnormalCount: 0, criticalCount: 0 };

  // Enumerate the patient's lab records with getLabToPrintNew — the SAME
  // patient-scoped source the working Investigation View uses (filters only by
  // PatientID + date). Result Entry's PatientSearchMachineResult is center/role-
  // scoped and returns 0 rows in the Emergency context, which is why it was blank.
  let rows = [];
  try {
    const resp = await BindInvestigationViewList({
      pid: String(uhid),
      status: "",
      fromDate: moment(fromDate).format("YYYY-MM-DD"),
      toDate: moment(toDate).format("YYYY-MM-DD"),
      labDepartmentType: "ALL",
    });
    rows = resp?.success && Array.isArray(resp.data) ? resp.data : [];
  } catch (_) { rows = []; }

  const perTest = await Promise.all(
    rows.map(async (row) => {
      const testIDRaw = pick(row, ["Test_ID", "TestID", "testID", "test_ID"]);
      const obsPayload = {
        barcodeNo: pick(row, ["BarcodeNo", "barcodeNo", "Barcode_No"]) || "",
        testID:
          testIDRaw == null ? "" : Number.isNaN(Number(testIDRaw)) ? testIDRaw : Number(testIDRaw),
        ageInDays: pick(row, ["AGE_in_Days", "AgeInDays", "ageInDays", "Age_in_Days"]) ?? deriveAgeInDays(patient),
        rangeType: "Normal",
        gender: pick(row, ["Gender", "gender"]) || deriveGender(patient),
        machineID: "",
        macId: "1", // proven value from the working Result Entry LabObservationSearch call
      };

      let obs = [];
      try {
        const r = await LabObservationSearch(obsPayload);
        obs = r?.success && Array.isArray(r.data) ? r.data : [];
      } catch (_) { obs = []; }

      const dateRaw = pick(row, ["BillDate", "Bill_Date", "DATE", "BookingDate"]) || "";
      const dateObj = parseLabDate(dateRaw);
      return obs
        .filter((o) => {
          const rt = pick(o, ["reportType", "ReportType"]);
          return rt !== 3 && rt !== 5 && rt !== "3" && rt !== "5";
        })
        .map((o) => {
          const value = pick(o, ["value", "Value"]) ?? "";
          const minValue = pick(o, ["minValue", "MinValue"]);
          const maxValue = pick(o, ["maxValue", "MaxValue"]);
          const minCritical = pick(o, ["minCritical", "MinCritical"]);
          const maxCritical = pick(o, ["maxCritical", "MaxCritical"]);
          const { flag, colorcode } = calculateLabFlag(value, minValue, maxValue, minCritical, maxCritical, pick(o, ["flag", "Flag"]));
          return {
            name: pick(o, ["labObservationName", "LabObservationName"]) || "-",
            value,
            numValue: toNum(value),
            unit: pick(o, ["readingFormat", "ReadingFormat"]) || "",
            minValue, maxValue,
            range: pick(o, ["displayReading", "DisplayReading"]) || (minValue != null && maxValue != null ? `${minValue}-${maxValue}` : ""),
            flag, colorcode,
            isAbnormal: isAbnormalFlag(flag), isCritical: isCriticalFlag(flag),
            testName: pick(row, ["Test", "TestName", "Name"]) || "",
            dateRaw,
            dateObj,
            dateLabel: dateObj ? dateObj.format("DD-MMM") : dateRaw,
          };
        })
        .filter((o) => o.value !== "" && o.value !== null && !looksHtml(o.value) && !looksHtml(o.name));
    })
  );

  const flat = perTest.flat();

  // group → per parameter series (oldest → newest)
  const map = new Map();
  flat.forEach((o) => { if (!map.has(o.name)) map.set(o.name, []); map.get(o.name).push(o); });
  const parameters = Array.from(map.entries()).map(([name, points]) => {
    points.sort((a, b) => (a.dateObj?.valueOf() || 0) - (b.dateObj?.valueOf() || 0));
    const latest = points[points.length - 1];
    return {
      name, points,
      unit: latest?.unit || "",
      range: latest?.range || "",
      minValue: toNum(firstDefined(points.map((p) => p.minValue))),
      maxValue: toNum(firstDefined(points.map((p) => p.maxValue))),
      latest,
      anyAbnormal: points.some((p) => p.isAbnormal),
      anyCritical: points.some((p) => p.isCritical),
    };
  });
  parameters.sort((a, b) => (b.anyCritical - a.anyCritical) || (b.anyAbnormal - a.anyAbnormal) || a.name.localeCompare(b.name));

  // unique test dates, newest first (matrix columns)
  const dmap = new Map();
  flat.forEach((o) => { if (!dmap.has(o.dateRaw)) dmap.set(o.dateRaw, { key: o.dateRaw, obj: o.dateObj, label: o.dateObj ? o.dateObj.format("DD-MMM-YY") : o.dateRaw }); });
  const dates = Array.from(dmap.values()).sort((a, b) => (b.obj?.valueOf() || 0) - (a.obj?.valueOf() || 0));

  return {
    parameters, dates,
    abnormalCount: flat.filter((o) => o.isAbnormal).length,
    criticalCount: flat.filter((o) => o.isCritical).length,
    recordCount: rows.length,   // patient lab records found (step 1)
    valueCount: flat.length,    // observation values found (step 2)
  };
};

// Banner helper — only the counts are needed by the panel. Uses the same
// admission-aware default window as the popup so the banner and popup agree.
export const fetchPatientLabResults = async (patient) => {
  const { from, to } = defaultLabRange(patient);
  const res = await buildLabData(patient, from, to);
  return { abnormalCount: res.abnormalCount, criticalCount: res.criticalCount, tests: res.parameters };
};

// ── Chart helpers ───────────────────────────────────────────────────────────
const pointColorFor = (flag) =>
  flag === "MAXC" ? "red" : flag === "MINC" ? "orange" : flag === "High" ? "#ec4899" : flag === "Low" ? "#eab308" : "#16a34a";

// Shades the normal band (min–max) behind the trend line + dashed thresholds.
const normalBandPlugin = {
  id: "normalBand",
  beforeDatasetsDraw(chart, _args, opts) {
    if (opts?.min == null || opts?.max == null) return;
    const { ctx, chartArea, scales: { y } } = chart;
    if (!y) return;
    const yTop = y.getPixelForValue(opts.max);
    const yBot = y.getPixelForValue(opts.min);
    ctx.save();
    ctx.fillStyle = "rgba(34,197,94,0.10)";
    ctx.fillRect(chartArea.left, Math.min(yTop, yBot), chartArea.right - chartArea.left, Math.abs(yBot - yTop));
    ctx.strokeStyle = "rgba(22,163,74,0.45)";
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    [yTop, yBot].forEach((yy) => { ctx.beginPath(); ctx.moveTo(chartArea.left, yy); ctx.lineTo(chartArea.right, yy); ctx.stroke(); });
    ctx.restore();
  },
};

const ParamChart = ({ param, height = 220 }) => {
  const pts = param.points.filter((p) => p.numValue != null);
  const data = {
    labels: pts.map((p) => p.dateLabel),
    datasets: [{
      label: param.name,
      data: pts.map((p) => p.numValue),
      borderColor: "#6366f1",
      backgroundColor: "rgba(99,102,241,0.12)",
      tension: 0.35, borderWidth: 2, spanGaps: true, fill: false,
      pointRadius: pts.map((p) => (p.isAbnormal ? 6 : 4)),
      pointHoverRadius: 7,
      pointBackgroundColor: pts.map((p) => pointColorFor(p.flag)),
      pointBorderColor: pts.map((p) => pointColorFor(p.flag)),
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      normalBand: { min: param.minValue, max: param.maxValue },
      tooltip: {
        callbacks: {
          title: (items) => pts[items[0].dataIndex]?.dateRaw || "",
          label: (c) => { const p = pts[c.dataIndex]; return `${c.formattedValue} ${param.unit || ""}${p?.flag && p.flag !== "Normal" ? `  (${p.flag})` : ""}`; },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true } },
      y: { grid: { color: "rgba(148,163,184,.15)" }, ticks: { font: { size: 9 } } },
    },
  };
  return <div style={{ height }}><Line data={data} options={options} plugins={[normalBandPlugin]} /></div>;
};

const FLAG_LABEL = { Low: "LOW", High: "HIGH", MINC: "CRIT ↓", MAXC: "CRIT ↑" };
// Colour scheme for the High/Low alert badge in the table.
const FLAG_STYLE = {
  High: { bg: "#FFC0CB", color: "#9d174d", icon: "fa-arrow-up" },
  Low: { bg: "#FEF08A", color: "#854d0e", icon: "fa-arrow-down" },
  MAXC: { bg: "red", color: "#fff", icon: "fa-arrow-up" },
  MINC: { bg: "orange", color: "#fff", icon: "fa-arrow-down" },
};
const FlagBadge = ({ flag }) => {
  const [t] = useTranslation();
  if (!flag || flag === "Normal")
    return <span style={{ color: "#16a34a", fontSize: "10px", fontWeight: 700 }}>{t("NORMAL")}</span>;
  const s = FLAG_STYLE[flag] || { bg: "#e2e8f0", color: "#475569", icon: "" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: "5px", padding: "2px 8px", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap" }}>
      {s.icon && <i className={`fas ${s.icon}`} style={{ marginRight: "4px", fontSize: "8px" }} />}
      {FLAG_LABEL[flag] || flag}
    </span>
  );
};
const textOn = (c) => (c === "red" || c === "orange" ? "#fff" : "#1f2a37");
const chip = (bg, color) => ({ fontSize: "11px", fontWeight: 800, color, background: bg, borderRadius: "999px", padding: "2px 10px", whiteSpace: "nowrap" });
const segBtn = (active) => ({
  border: "1px solid " + (active ? "#6d28d9" : "#e2e8f0"), background: active ? "#6d28d9" : "#fff",
  color: active ? "#fff" : "#475569", fontSize: "12px", fontWeight: 600, padding: "5px 12px", cursor: "pointer",
});

// ── Main: parameter-wise lab trends (table + graph) ─────────────────────────
export default function EmergencyLabResults({ data }) {
  const [t] = useTranslation();
  const uhid = data?.PatientID ?? data?.patientID;

  const [range, setRange] = useState(() => defaultLabRange(data));
  const [applied, setApplied] = useState(range); // committed range that drives the fetch
  const [state, setState] = useState({ loading: true, parameters: [], dates: [], abnormalCount: 0, criticalCount: 0, recordCount: 0, valueCount: 0 });
  const [view, setView] = useState("graph"); // graph | table
  const [param, setParam] = useState("ALL");
  const [abnormalOnly, setAbnormalOnly] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setState((s) => ({ ...s, loading: true }));
      const res = await buildLabData(data, applied.from, applied.to);
      if (alive) setState({ loading: false, ...res });
    })();
    return () => { alive = false; };
  }, [uhid, applied]);

  const filtered = useMemo(() => {
    let list = state.parameters;
    if (param !== "ALL") list = list.filter((p) => p.name === param);
    if (abnormalOnly) list = list.filter((p) => p.anyAbnormal);
    return list;
  }, [state.parameters, param, abnormalOnly]);

  const select = (
    <select value={param} onChange={(e) => setParam(e.target.value)}
      style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "5px 8px", fontSize: "12px", maxWidth: "240px" }}>
      <option value="ALL">{t("All Parameters")} ({state.parameters.length})</option>
      {state.parameters.map((p) => (
        <option key={p.name} value={p.name}>{p.anyCritical ? "⚠ " : p.anyAbnormal ? "• " : ""}{p.name}</option>
      ))}
    </select>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", padding: "2px 4px" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1f2a37" }}>
          <i className="fas fa-vials" style={{ color: "#0284c7", marginRight: "6px" }} aria-hidden="true" />
          {t("Lab Results")}
        </span>
        {state.criticalCount > 0 && <span style={chip("red", "#fff")}><i className="fas fa-triangle-exclamation" style={{ marginRight: "5px" }} />{state.criticalCount} {t("Critical")}</span>}
        {state.abnormalCount > 0 && <span style={chip("#fef3c7", "#b45309")}>{state.abnormalCount} {t("Abnormal")}</span>}

        <div style={{ flex: 1 }} />

        {/* Parameter filter (individual vs full investigation) */}
        {select}

        {/* View toggle */}
        <div style={{ display: "inline-flex", borderRadius: "8px", overflow: "hidden" }}>
          <button type="button" style={{ ...segBtn(view === "graph"), borderRadius: "8px 0 0 8px" }} onClick={() => setView("graph")}>
            <i className="fas fa-chart-line" style={{ marginRight: "5px" }} />{t("Graph")}
          </button>
          <button type="button" style={{ ...segBtn(view === "table"), borderLeft: "none", borderRadius: "0 8px 8px 0" }} onClick={() => setView("table")}>
            <i className="fas fa-table" style={{ marginRight: "5px" }} />{t("Table")}
          </button>
        </div>
      </div>

      {/* Date range + abnormal filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{t("FromDate")}</span>
        <input type="date" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "4px 8px", fontSize: "12px" }} />
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{t("ToDate")}</span>
        <input type="date" value={range.to} min={range.from} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "4px 8px", fontSize: "12px" }} />
        <button type="button" className="btn btn-sm btn-success px-3" onClick={() => setApplied(range)}>
          <i className="fas fa-search mr-1" />{t("Apply")}
        </button>
        <label style={{ fontSize: "11.5px", color: "#475569", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0 }}>
          <input type="checkbox" checked={abnormalOnly} onChange={(e) => setAbnormalOnly(e.target.checked)} />
          {t("Abnormal only")}
        </label>
      </div>

      {state.loading ? (
        <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />{t("Loading")}…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
          <i className="fas fa-flask" style={{ fontSize: "26px", opacity: 0.4, display: "block", marginBottom: "8px" }} />
          <span style={{ fontSize: "13px" }}>{t("No lab results found")}</span>
          <div style={{ fontSize: "10.5px", color: "#cbd5e1", marginTop: "8px" }}>
            {t("Records found")}: {state.recordCount} · {t("Values found")}: {state.valueCount} {t("· UHID:")} {uhid || "-"}
          </div>
        </div>
      ) : view === "graph" ? (
        // ── GRAPH (parameter-wise) ──────────────────────────────────────────
        <div style={{ maxHeight: "66vh", overflowY: "auto" }}>
          {param !== "ALL" ? (
            <div style={{ border: "1px solid #eef0f3", borderRadius: "12px", padding: "12px" }}>
              <ParamHeader p={filtered[0]} t={t} />
              <ParamChart param={filtered[0]} height={320} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {filtered.map((p) => (
                <div key={p.name} style={{ border: `1px solid ${p.anyCritical ? "#fecaca" : p.anyAbnormal ? "#fde68a" : "#eef0f3"}`, borderRadius: "12px", padding: "10px" }}>
                  <ParamHeader p={p} t={t} compact />
                  <ParamChart param={p} height={170} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ── TABLE — parameter rows × Report-Date columns (cumulative report) ──
        <div style={{ overflow: "auto", maxHeight: "66vh", border: "1px solid #eef0f3", borderRadius: "10px" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: "12px", width: "100%" }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <th style={{ position: "sticky", left: 0, zIndex: 3, background: "#eef2ff", padding: "9px 12px", textAlign: "left", color: "#3730a3", minWidth: "170px", borderBottom: "1px solid #e2e8f0" }}>{t("Parameter")}</th>
                {state.dates.map((d) => (
                  <th key={d.key} style={{ background: "#f8fafc", padding: "9px 12px", textAlign: "center", color: "#475569", whiteSpace: "nowrap", borderBottom: "1px solid #e2e8f0", borderLeft: "1px solid #f1f5f9" }}>
                    <i className="far fa-calendar" style={{ marginRight: "5px", color: "#cbd5e1" }} />{d.label}
                  </th>
                ))}
                <th style={{ background: "#f8fafc", padding: "9px 12px", textAlign: "left", color: "#94a3b8", width: "160px", minWidth: "120px", maxWidth: "180px", borderBottom: "1px solid #e2e8f0", borderLeft: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{t("Display Reading")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.name}>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, background: "#fff", padding: "7px 12px", fontWeight: 700, color: "#1f2a37", borderBottom: "1px solid #f1f5f9", borderLeft: `3px solid ${p.anyCritical ? "red" : p.anyAbnormal ? "#f59e0b" : "transparent"}` }}>
                    {p.anyCritical && <i className="fas fa-triangle-exclamation" style={{ color: "red", marginRight: "5px", fontSize: "10px" }} />}
                    {p.name} {p.unit ? <span style={{ fontWeight: 400, color: "#94a3b8" }}>({p.unit})</span> : null}
                  </td>
                  {state.dates.map((d) => {
                    const pt = [...p.points].reverse().find((x) => x.dateRaw === d.key);
                    const blink = pt?.isCritical
                      ? "labBlinkCrit 1.1s ease-in-out infinite"
                      : pt?.isAbnormal
                        ? "labBlinkAbn 1.25s ease-in-out infinite"
                        : "none";
                    return (
                      <td key={d.key} style={{
                        padding: "7px 12px", textAlign: "center", whiteSpace: "nowrap",
                        background: pt?.colorcode || "transparent", color: pt ? textOn(pt.colorcode) : "#cbd5e1",
                        fontWeight: pt?.isAbnormal ? 800 : 600, borderBottom: "1px solid #f1f5f9", borderLeft: "1px solid #f1f5f9",
                        animation: blink,
                      }}>
                        {pt ? (
                          <span style={{ position: "relative" }}>
                            {pt.value}
                            {pt.flag && pt.flag !== "Normal" && (
                              <span style={{ fontSize: "8.5px", marginLeft: "5px", fontWeight: 800 }}>
                                {pt.flag === "High" || pt.flag === "MAXC" ? "▲" : "▼"}{FLAG_LABEL[pt.flag] || pt.flag}
                              </span>
                            )}
                          </span>
                        ) : "·"}
                      </td>
                    );
                  })}
                  {/* Display Reading — right side, fixed responsive width; long text wraps */}
                  <td style={{ padding: "7px 12px", borderBottom: "1px solid #f1f5f9", borderLeft: "1px solid #f1f5f9", verticalAlign: "top" }}>
                    <div style={{ width: "160px", maxWidth: "160px", whiteSpace: "normal", wordBreak: "break-word", color: "#64748b", fontSize: "11px", lineHeight: 1.3 }}>
                      {p.range || "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Small per-parameter header (latest value + flag + normal range).
const ParamHeader = ({ p, t, compact }) => {
  const lf = p.latest?.flag;
  const color = pointColorFor(lf);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: compact ? "4px" : "8px" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: compact ? "12px" : "13px", fontWeight: 700, color: "#1f2a37", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
        <div style={{ fontSize: "10px", color: "#94a3b8" }}>{t("Normal")}: {p.range || "-"}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: compact ? "14px" : "16px", fontWeight: 800, color }}>{p.latest?.value}{p.unit ? <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}> {p.unit}</span> : null}</div>
        {lf && lf !== "Normal" && <div style={{ fontSize: "9px", fontWeight: 800, color: "#fff", background: color, borderRadius: "5px", padding: "1px 6px", display: "inline-block" }}>{FLAG_LABEL[lf] || lf}</div>}
      </div>
    </div>
  );
};
