/**
 * Nursing form model — the JSON saved as nf_form.DraftJson and frozen in each
 * published version.
 *
 *   {
 *     schemaVersion: 1,
 *     pages:  [{ w, h }],                 page size in mm, one per PDF page / the image
 *     fields: [Field],
 *     drawings: [Mark],                   Paint-style marks printed on every copy (draw/shapes.js)
 *     labels: { [key]: "Friendly name" }, palette display names (binding keeps the real key)
 *     calibration: { dx, dy },            printer drift correction in mm
 *     printMode: "full" | "data",         background + data, or data only (pre-printed stationery)
 *   }
 *
 * Field: { id, type, page, repeat, x, y, w, h, locked, style, format, ...type props }
 *   data       key                        a PatientSearch row value
 *   combo      pattern  "{Age} / {Gender}"
 *   text       text                       static label
 *   system     sys   date|time|datetime|user|centre|page|pages
 *   tick       tick { key, op, value }     prints ✓ when the condition holds
 *   qr         source { key | pattern }
 *   barcode    source { key | pattern }   Code 128
 *   input      input { kind, label, options, required }   filled by the nurse on the patient page
 *   signature  signature { label }        drawn on the patient page, name + time stamped
 *
 * Positions are mm from the page's top-left, so a print lands where the field was placed.
 */
import moment from "moment";

export const SCHEMA_VERSION = 1;
export const PX_PER_MM = 96 / 25.4;
export const A4 = { w: 210, h: 297 };

export const emptyLayout = () => ({
  schemaVersion: SCHEMA_VERSION,
  pages: [],
  fields: [],
  drawings: [],
  labels: {},
  calibration: { dx: 0, dy: 0 },
  printMode: "full",
});

/** DraftJson / snapshot string → layout with every property present. */
export function parseLayout(json) {
  let o = {};
  try {
    o = typeof json === "string" ? JSON.parse(json || "{}") : json || {};
  } catch {
    o = {};
  }
  const base = emptyLayout();
  return {
    ...base,
    ...o,
    pages: Array.isArray(o.pages) ? o.pages : [],
    fields: Array.isArray(o.fields) ? o.fields : [],
    drawings: Array.isArray(o.drawings) ? o.drawings : [],
    labels: o.labels && typeof o.labels === "object" ? o.labels : {},
    calibration: { ...base.calibration, ...(o.calibration || {}) },
  };
}

export const CATEGORIES = [
  { value: "Assessment", tone: "sky" },
  { value: "Vitals / Charting", tone: "mint" },
  { value: "Care Plan", tone: "violet" },
  { value: "Consent", tone: "amber" },
  { value: "Medication / MAR", tone: "rose" },
  { value: "Intake-Output", tone: "teal" },
  { value: "Discharge", tone: "indigo" },
  { value: "Other", tone: "slate" },
];
const TONES = ["sky", "mint", "violet", "amber", "rose", "teal", "indigo"];
/** Built-in categories keep their colour; a user-added one gets a stable colour from its name. */
export const categoryTone = (c) => {
  const known = CATEGORIES.find((x) => x.value === c)?.tone;
  if (known || !c) return known || "slate";
  let h = 0;
  for (const ch of String(c)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
};

/**
 * Categories to offer: the built-in ones, those forms already use (so a category
 * added by anyone shows up once a form is saved with it), and ones added in this
 * browser that no form uses yet. "Other" stays last.
 */
const CAT_KEY = "nfb-categories";
export const readAddedCategories = () => {
  try {
    const v = JSON.parse(localStorage.getItem(CAT_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
export const rememberCategory = (c) => {
  try {
    localStorage.setItem(CAT_KEY, JSON.stringify([...new Set([...readAddedCategories(), c])]));
  } catch {
    /* private window */
  }
};
export function allCategories(forms = []) {
  const builtIn = CATEGORIES.map((c) => c.value).filter((c) => c !== "Other");
  const extra = [...forms.map((f) => f.category), ...readAddedCategories()]
    .map((c) => String(c || "").trim())
    .filter((c) => c && c !== "Other" && !builtIn.some((b) => b.toLowerCase() === c.toLowerCase()));
  const uniq = [...new Map(extra.map((c) => [c.toLowerCase(), c])).values()].sort((a, b) => a.localeCompare(b));
  return [...builtIn, ...uniq, "Other"];
}

export const WARDS = ["ICU", "NICU", "PICU", "General Ward", "Private Ward", "Semi Private", "Emergency", "OT", "Labour Room", "Dialysis", "Day Care"];

/* ---------------------------------------------------------- key groups */
/**
 * Colour family of a PatientSearch key, from its name. Order matters: "AdmitDate"
 * is a date before it is admission, "BedNo" is location before identity.
 */
const GROUPS = [
  // login user / printing centre keys ("user.X", "centre.X" — model/context.js) come first
  { id: "centre", label: "Centre / hospital", tone: "rose", re: /^centre\./ },
  { id: "user", label: "Logged-in user", tone: "indigo", re: /^user\./ },
  { id: "date", label: "Dates & time", tone: "mint", re: /(date|time|dob|^dt|dt$|_on$|On$)/i },
  { id: "location", label: "Ward / Room / Bed", tone: "teal", re: /(ward|room|bed|floor|building|wing|block)/i },
  { id: "identity", label: "Patient", tone: "violet", re: /(name|uhid|mrno|patientid|pid$|^pid|age|gender|sex|title|mobile|phone|contact|address|city|state|relation|guardian|kin|email|blood|religion|marital|aadhar|nationality)/i },
  { id: "admission", label: "Admission", tone: "sky", re: /(ipd|transaction|admi|doctor|consult|dept|department|speciality|specialty|diagnos|case|visit|referr|discharge|status)/i },
  { id: "billing", label: "Billing / Panel", tone: "amber", re: /(panel|company|insur|bill|amount|tpa|payer|corporate|policy|card|scheme|balance|deposit|advance|rate|price|category)/i },
];
export const OTHER_GROUP = { id: "other", label: "Other", tone: "slate" };
export const keyGroup = (key) => GROUPS.find((g) => g.re.test(key)) || OTHER_GROUP;
export const KEY_GROUPS = [...GROUPS.map(({ re, ...g }) => g), OTHER_GROUP];

/** "PatientName" / "patient_name" → "Patient Name". */
export function humanize(key) {
  return String(key || "")
    .replace(/^(user|centre)\./, "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export const fieldTone = (f) => {
  switch (f.type) {
    case "data":
    case "tick":
      return keyGroup(f.key || f.tick?.key || "").tone;
    case "combo":
      return "indigo";
    case "qr":
    case "barcode":
      return "slate";
    case "system":
      return "mint";
    case "input":
      return "sky";
    case "signature":
      return "rose";
    default:
      return "plain";
  }
};

/* -------------------------------------------------------- field types */
export const FIELD_TYPES = {
  data: { label: "Patient data", icon: "data", w: 50, h: 6 },
  combo: { label: "Combined", icon: "combo", w: 50, h: 6 },
  text: { label: "Static text", icon: "text", w: 40, h: 6 },
  system: { label: "System", icon: "clock", w: 36, h: 6 },
  tick: { label: "Tick mark", icon: "tick", w: 6, h: 6 },
  qr: { label: "QR code", icon: "qr", w: 18, h: 18 },
  barcode: { label: "Barcode", icon: "barcode", w: 45, h: 12 },
  input: { label: "Fill-in field", icon: "input", w: 50, h: 7 },
  signature: { label: "Signature", icon: "sign", w: 50, h: 16 },
};

export const SYSTEM_FIELDS = [
  { sys: "date", label: "Current date" },
  { sys: "time", label: "Current time" },
  { sys: "datetime", label: "Date & time" },
  { sys: "user", label: "Logged-in nurse" },
  { sys: "centre", label: "Centre / hospital" },
  { sys: "page", label: "Page number" },
  { sys: "pages", label: "Page n of N" },
];

export const INPUT_KINDS = [
  { kind: "text", label: "Text" },
  { kind: "textarea", label: "Multi-line text" },
  { kind: "number", label: "Number" },
  { kind: "checkbox", label: "Checkbox" },
  { kind: "radio", label: "Choice (radio)" },
  { kind: "date", label: "Date" },
  { kind: "time", label: "Time" },
];

export const DEFAULT_STYLE = {
  fontSize: 10,
  bold: false,
  italic: false,
  underline: false,
  align: "left",
  valign: "middle",
  color: "#111827",
  bg: "",
  border: false,
  fontFamily: "Inter",
};
export const FONT_FAMILIES = ["Inter", "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];

let seq = 0;
export const newId = () => `f${Date.now().toString(36)}${(seq++).toString(36)}`;

/** A new field of `type` at (x, y) mm, with the type's default size and props. */
export function makeField(type, props = {}, at = {}) {
  const t = FIELD_TYPES[type] || FIELD_TYPES.text;
  const base = {
    id: newId(),
    type,
    page: 1,
    repeat: false,
    x: 10,
    y: 10,
    w: t.w,
    h: t.h,
    locked: false,
    style: { ...DEFAULT_STYLE, ...(type === "tick" ? { align: "center", fontSize: 12, bold: true } : {}) },
    format: { date: "", case: "", prefix: "", suffix: "", empty: "" },
  };
  const extra = {
    data: { key: "" },
    combo: { pattern: "" },
    text: { text: "Label" },
    system: { sys: "date" },
    tick: { tick: { key: "", op: "notEmpty", value: "" } },
    qr: { source: { key: "", pattern: "" } },
    barcode: { source: { key: "", pattern: "" } },
    input: { input: { kind: "text", label: "", options: [], required: false } },
    signature: { signature: { label: "Signature" } },
  }[type];
  return { ...base, ...extra, ...props, ...at, style: { ...base.style, ...(props.style || {}) } };
}

/* ---------------------------------------------------------- formatting */
export const DATE_FORMATS = ["", "DD-MMM-YYYY", "DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "DD MMM YYYY", "DD-MMM-YYYY hh:mm A", "hh:mm A", "HH:mm"];
const PARSE_FORMATS = [moment.ISO_8601, "DD-MMM-YYYY", "DD-MMM-YYYY hh:mm A", "DD-MMM-YYYY HH:mm", "DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "DD MMM YYYY", "DD/MM/YYYY hh:mm A", "MM/DD/YYYY hh:mm:ss A"];

export function formatValue(raw, format = {}) {
  let v = raw === null || raw === undefined ? "" : String(raw);
  if (v && format.date) {
    const m = moment(v, PARSE_FORMATS, true);
    const m2 = m.isValid() ? m : moment(v);
    if (m2.isValid()) v = m2.format(format.date);
  }
  if (format.case === "upper") v = v.toUpperCase();
  else if (format.case === "lower") v = v.toLowerCase();
  else if (format.case === "title") v = v.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  if (!v) return format.empty || "";
  return `${format.prefix || ""}${v}${format.suffix || ""}`;
}

/** "{Age} / {Gender}" with the row's values; unknown keys → "". */
export const fillPattern = (pattern, data) =>
  String(pattern || "").replace(/\{([^{}]+)\}/g, (_, k) => {
    const v = data?.[k.trim()];
    return v === null || v === undefined ? "" : String(v);
  });
export const patternKeys = (pattern) => [...String(pattern || "").matchAll(/\{([^{}]+)\}/g)].map((m) => m[1].trim());

export const TICK_OPS = [
  { op: "notEmpty", label: "has a value" },
  { op: "empty", label: "is empty" },
  { op: "eq", label: "equals" },
  { op: "neq", label: "not equal to" },
  { op: "contains", label: "contains" },
];
export function tickHolds(tick, data) {
  const v = String(data?.[tick?.key] ?? "").trim();
  const want = String(tick?.value ?? "").trim().toLowerCase();
  switch (tick?.op) {
    case "empty":
      return !v;
    case "eq":
      return v.toLowerCase() === want;
    case "neq":
      return v.toLowerCase() !== want;
    case "contains":
      return !!want && v.toLowerCase().includes(want);
    default:
      return !!v;
  }
}

/**
 * The text a field shows for one patient. `ctx`: { user, centre, page, pages, now }.
 * Inputs and signatures are drawn by the renderer from the entry, not from here.
 */
export function resolveField(f, data, ctx = {}) {
  const now = ctx.now || new Date();
  switch (f.type) {
    case "data":
      return formatValue(data?.[f.key], f.format);
    case "combo":
      return formatValue(fillPattern(f.pattern, data).trim(), f.format);
    case "text":
      return f.text || "";
    case "system": {
      const s = {
        date: moment(now).format(f.format?.date || "DD-MMM-YYYY"),
        time: moment(now).format("hh:mm A"),
        datetime: moment(now).format(f.format?.date || "DD-MMM-YYYY hh:mm A"),
        user: ctx.user || "",
        centre: ctx.centre || "",
        page: String(ctx.page || 1),
        pages: `Page ${ctx.page || 1} of ${ctx.pages || 1}`,
      }[f.sys];
      return f.sys === "date" || f.sys === "datetime" ? s : formatValue(s, { ...f.format, date: "" });
    }
    case "tick":
      return tickHolds(f.tick, data) ? "✓" : "";
    case "qr":
    case "barcode":
      return f.source?.pattern ? fillPattern(f.source.pattern, data).trim() : String(data?.[f.source?.key] ?? "");
    default:
      return "";
  }
}

/** Keys a field reads from the patient row (for "used" marks and missing-data checks). */
export function fieldKeys(f) {
  switch (f.type) {
    case "data":
      return f.key ? [f.key] : [];
    case "combo":
      return patternKeys(f.pattern);
    case "tick":
      return f.tick?.key ? [f.tick.key] : [];
    case "qr":
    case "barcode":
      return f.source?.pattern ? patternKeys(f.source.pattern) : f.source?.key ? [f.source.key] : [];
    default:
      return [];
  }
}

/** Short design-time caption: what the field is bound to. */
export function fieldCaption(f, labels = {}) {
  const lab = (k) => labels[k] || humanize(k);
  switch (f.type) {
    case "data":
      return f.key ? `{${lab(f.key)}}` : "{choose a key}";
    case "combo":
      return f.pattern || "{A} / {B}";
    case "text":
      return f.text || "Text";
    case "system":
      return `[${SYSTEM_FIELDS.find((s) => s.sys === f.sys)?.label || "System"}]`;
    case "tick":
      return "✓";
    case "qr":
      return "QR";
    case "barcode":
      return "Barcode";
    case "input":
      return f.input?.label || INPUT_KINDS.find((k) => k.kind === f.input?.kind)?.label || "Input";
    case "signature":
      return f.signature?.label || "Signature";
    default:
      return "";
  }
}

/** Fields drawn on a page (its own, plus "repeat on every page" fields). */
export const fieldsOnPage = (fields, page) => fields.filter((f) => f.page === page || f.repeat);

/**
 * Bound fields that come out empty for this patient — the "missing data" banner.
 * Ticks are skipped (empty is a valid answer for them).
 */
export function missingFields(layout, data) {
  const out = [];
  for (const f of layout.fields) {
    if (!["data", "combo", "qr", "barcode"].includes(f.type)) continue;
    const keys = fieldKeys(f);
    const empty = keys.filter((k) => data?.[k] === null || data?.[k] === undefined || String(data[k]).trim() === "");
    if (keys.length && empty.length) out.push({ field: f, keys: empty });
  }
  return out;
}
