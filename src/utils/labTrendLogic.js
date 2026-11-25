import moment from "moment";

/**
 * Lab Reports and Trends - the logic that has no React and no network in it.
 *
 * Two halves:
 *  1. Reading what a report says: a printed value or reference range becomes numbers, a reading
 *     becomes Low / High / Normal, and the AI's answer is tidied into rows the doctor can check.
 *     parseValue / parseRange / flagFor are the SAME rules the API applies when it saves
 *     (Services/LabParamLogic.cs), so the flag the doctor sees while editing is the flag that is
 *     stored.
 *  2. Looking at the readings over time: how a parameter has moved, whether it is going back
 *     toward its range, and the points a chart is drawn from.
 */

const MAX_ROWS = 400;

/* ------------------------------------------------------------------ reading a report */

/** "13.2" -> 13.2; "<0.5" -> 0.5 with "<"; "1,200" -> 1200; "12.5 H" -> 12.5; "Positive" -> null (kept as text). */
export const parseValue = (text) => {
  let s = String(text ?? "").trim();
  if (!s) return { value: null, comparator: null };
  let comparator = null;
  const lead = s.match(/^(<=|>=|≤|≥|<|>)\s*/);
  if (lead) {
    comparator = lead[1] === "≤" ? "<=" : lead[1] === "≥" ? ">=" : lead[1];
    s = s.slice(lead[0].length);
  }
  s = s.replace(/(\d),(?=\d{3}(\D|$))/g, "$1");
  const m = s.match(/-?\d+(?:\.\d+)?/);
  // A number has to open the text: "Grade 2" is words with a digit in them.
  if (!m || m.index !== 0) return { value: null, comparator: null };
  const v = Number(m[0]);
  return Number.isFinite(v) ? { value: v, comparator } : { value: null, comparator: null };
};

/** "13.0 - 17.0" / "13 to 17" -> { low: 13, high: 17 }; "< 200" / "up to 5" -> high only; "> 40" -> low only. */
export const parseRange = (text) => {
  const s = String(text ?? "").trim().toLowerCase();
  if (!s) return { low: null, high: null };
  const both = s.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/);
  if (both) {
    const lo = Number(both[1]);
    const hi = Number(both[2]);
    if (Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi) return { low: lo, high: hi };
  }
  const n = s.match(/-?\d+(?:\.\d+)?/);
  if (!n) return { low: null, high: null };
  const one = Number(n[0]);
  if (/^(<|≤|up\s*to|upto|below|less\s+than|max|not\s+more\s+than)/.test(s)) return { low: null, high: one };
  if (/^(>|≥|above|more\s+than|min|greater\s+than|not\s+less\s+than)/.test(s)) return { low: one, high: null };
  return { low: null, high: null };
};

/** "L" | "H" | "N" | null. A number is judged against its range when there is one; else the laboratory's own flag is kept. */
export const flagFor = (value, low, high, labFlag) => {
  if (value != null && (low != null || high != null)) {
    if (low != null && value < low) return "L";
    if (high != null && value > high) return "H";
    return "N";
  }
  const f = String(labFlag ?? "").trim().toUpperCase();
  if (f.startsWith("L")) return "L";
  if (f.startsWith("H")) return "H";
  if (f.startsWith("N")) return "N";
  return null;
};

/** The flag of an editable row ({ value, refRange, ... }) as the API will compute it on save. */
export const rowFlag = (row) => {
  const { value } = parseValue(row?.value);
  const range = row?.refLow != null || row?.refHigh != null
    ? { low: row.refLow ?? null, high: row.refHigh ?? null }
    : parseRange(row?.refRange);
  return flagFor(value, range.low, range.high, row?.labFlag);
};

const text = (v, limit = 200) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > limit ? s.slice(0, limit) : s;
};

/** The date on a report as YYYY-MM-DD, or "" when it cannot be read. */
export const normalizeDate = (raw) => {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const m = moment(s, ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "D MMM YYYY", "DD-MMM-YYYY", "D-MMM-YY", "DD/MM/YY"], true);
  return m.isValid() ? m.format("YYYY-MM-DD") : "";
};

let rowSeq = 0;
/** A blank parameter row; _id is only a stable React key. */
export const blankRow = () => ({
  _id: `row-${++rowSeq}`,
  section: "",
  name: "",
  standardName: "",
  value: "",
  unit: "",
  refRange: "",
  fromAI: false,
});

/**
 * The AI's answer, made safe and shaped for editing: every field a string, no empty or duplicate
 * rows, at most 400 rows, the range written out when the AI only gave numbers. Nothing here is
 * trusted as final - the doctor checks every row before it is saved.
 */
export const normalizeExtraction = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  const seen = new Set();
  const rows = [];
  (Array.isArray(r.parameters) ? r.parameters : []).forEach((p) => {
    const name = text(p?.name, 200);
    let value = text(p?.value, 120);
    if (!value && p?.valueNumber != null && Number.isFinite(Number(p.valueNumber))) {
      value = `${p?.comparator && ["<", ">", "<=", ">="].includes(p.comparator) ? p.comparator : ""}${p.valueNumber}`;
    }
    if (!name || !value) return;
    let refRange = text(p?.refRange, 120);
    if (!refRange && p?.refLow != null && p?.refHigh != null) refRange = `${p.refLow} - ${p.refHigh}`;
    else if (!refRange && p?.refHigh != null) refRange = `< ${p.refHigh}`;
    else if (!refRange && p?.refLow != null) refRange = `> ${p.refLow}`;
    const unit = text(p?.unit, 40);
    const dedupe = `${name.toLowerCase()}|${value.toLowerCase()}|${unit.toLowerCase()}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    rows.push({
      ...blankRow(),
      section: text(p?.section, 120),
      name,
      standardName: text(p?.canonicalName ?? p?.standardName, 120),
      value,
      unit,
      refRange,
      labFlag: text(p?.flag, 8),
      fromAI: true,
    });
  });
  return {
    reportDate: normalizeDate(r.reportDate),
    labName: text(r.labName, 200),
    reportTitle: text(r.reportTitle, 200),
    rows: rows.slice(0, MAX_ROWS),
  };
};

/* ------------------------------------------------------------------ readings over time */

/** Points that are numbers (a chart can only draw those). */
export const numericPoints = (points) => (points || []).filter((p) => p?.num != null);

/**
 * How a parameter has moved between its last two numeric readings.
 *   direction: "up" | "down" | "flat" | "none" (fewer than two numbers)
 *   pct: percentage change against the earlier reading (null when that was zero)
 *   movement: "back_in_range" | "toward_range" | "away_from_range" | null - only said when the
 *             latest reading is outside its range or the earlier one was, and the reading is a number.
 */
export const trendOf = (param) => {
  const pts = numericPoints(param?.points);
  const latest = pts[pts.length - 1] || null;
  const previous = pts.length > 1 ? pts[pts.length - 2] : null;
  if (!latest || !previous) return { latest, previous: null, direction: "none", delta: null, pct: null, movement: null };

  const delta = latest.num - previous.num;
  const pct = previous.num !== 0 ? (delta / Math.abs(previous.num)) * 100 : null;
  const size = pct != null ? Math.abs(pct) : Math.abs(delta);
  const direction = size < 2 ? "flat" : delta > 0 ? "up" : "down";

  let movement = null;
  const was = previous.flag;
  const now = latest.flag;
  if ((was === "L" || was === "H") && now === "N") movement = "back_in_range";
  else if (now === "H" && delta !== 0) movement = delta < 0 ? "toward_range" : "away_from_range";
  else if (now === "L" && delta !== 0) movement = delta > 0 ? "toward_range" : "away_from_range";
  return { latest, previous, direction, delta, pct, movement };
};

/** Readings no older than `months` back from `today` (null = all of them). Dates are YYYY-MM-DD. */
export const withinMonths = (points, months, today = new Date()) => {
  if (!months) return points || [];
  const cutoff = moment(today).subtract(months, "months").format("YYYY-MM-DD");
  return (points || []).filter((p) => p.date >= cutoff);
};

/** What the chart draws: numeric readings with a time value, oldest first. */
export const chartPoints = (points) =>
  numericPoints(points)
    .map((p) => ({ ...p, t: moment(p.date, "YYYY-MM-DD").valueOf() }))
    .sort((a, b) => a.t - b.t);

/** The reference band to shade: the latest numeric reading's own range, or null when it has none. */
export const referenceBand = (points) => {
  const pts = numericPoints(points);
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const { refLow, refHigh } = pts[i];
    if (refLow != null || refHigh != null) return { low: refLow ?? null, high: refHigh ?? null };
  }
  return null;
};

/** Parameters worth a line: two or more numeric readings. */
export const hasTrend = (param) => (param?.numericCount ?? numericPoints(param?.points).length) >= 2;

/** The parameters whose latest reading is out of range. */
export const outOfRangeNow = (params) =>
  (params || []).filter((p) => {
    const last = p?.points?.[p.points.length - 1];
    return last?.flag === "L" || last?.flag === "H";
  });

/** "22 Oct 2026" */
export const showDate = (iso) => (iso ? moment(iso, "YYYY-MM-DD").format("DD MMM YYYY") : "");
