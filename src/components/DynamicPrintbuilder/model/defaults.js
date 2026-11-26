/**
 * Template building blocks: band types, the toolbox, element factories and the
 * normaliser every loaded template goes through. Shapes are documented in
 * ../DESIGN.md §4 (template JSON schema v1).
 */
import { PAGE_SIZES, resolvePage } from "../engine/printEngine";

let seq = 0;
export const uid = (prefix = "e") =>
  `${prefix}${Date.now().toString(36).slice(-4)}${(++seq).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const ACCENT = "#0f766e";

/** Flow order of band types — the order bands print in. */
/**
 * `label` is what the designer shows (plain words for where the section prints);
 * `tech` is the report-writer name (Crystal / FastReport) kept for tooltips and
 * search; `use` gives typical content.
 */
/**
 * Band types. `label` is the name shown everywhere (Page / Report / Group header, Content rows,
 * … footer); `zone` groups them into Header, Content and Footer; `tech` says it in plain words.
 */
export const BAND_TYPES = [
  { type: "pageHeader", label: "Page Header", zone: "Header", tech: "Top of each page", icon: "up", hint: "Repeats at the top of every page", use: "Logo, hospital name and address", tone: "sky" },
  { type: "reportHeader", label: "Report Header", zone: "Header", tech: "Document start", icon: "flag", hint: "Prints once, on the first page, below the page header", use: "Title, patient / bill details", tone: "mint" },
  { type: "groupHeader", label: "Group Header", zone: "Content", tech: "Group start", icon: "folder", hint: "Prints each time the group value changes (e.g. a new department)", use: "Group name, column headings", tone: "lavender" },
  { type: "detail", label: "Content Rows", zone: "Content", tech: "Repeating rows", icon: "list", hint: "Repeats once for every row of the data", use: "One line per item / test / medicine", tone: "peach" },
  { type: "groupFooter", label: "Group Footer", zone: "Content", tech: "Group end", icon: "sigma", hint: "Prints after the last row of each group", use: "Group subtotal", tone: "lavender" },
  { type: "reportFooter", label: "Report Footer", zone: "Footer", tech: "Document end", icon: "check", hint: "Prints once, after all rows, on the last page", use: "Totals, amount in words, signatures", tone: "mint" },
  { type: "pageFooter", label: "Page Footer", zone: "Footer", tech: "Bottom of each page", icon: "down", hint: "Repeats at the bottom of every page", use: "Page X of Y, printed by / on", tone: "sky" },
];
export const bandMeta = (type) => BAND_TYPES.find((b) => b.type === type) || BAND_TYPES[1];

const plain = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\{\{\s*([^}]*?)\s*\}\}/g, (_, f) => f.split(".").pop())
    .replace(/\s+/g, " ")
    .trim();

/** Static words only: tags and {{expressions}} dropped. */
const staticText = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\{\{[\s\S]*?\}\}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[\s:|-]+$/g, "")
    .trim();

const flatEls = (band) =>
  [...(band.elements || [])]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .flatMap((e) => (e.type === "section" ? [e, ...(e.children || [])] : [e]));

/** A few words saying what a band holds: its first heading / text, else its table or image. */
export function bandSummary(band) {
  const flat = flatEls(band);
  const text = flat.find((e) => (e.type === "heading" || e.type === "label") && plain(e.text).length > 2);
  if (text) {
    const t = plain(text.text);
    return t.length > 26 ? `${t.slice(0, 25)}…` : t;
  }
  const table = flat.find((e) => e.type === "table" || e.type === "crosstab");
  if (table) return `Table${table.dataset ? ` · ${String(table.dataset).split(".").pop()}` : ""}`;
  if (flat.some((e) => e.type === "image")) return "Logo / image";
  if (flat.some((e) => e.type === "signature")) return "Signatures";
  if (flat.some((e) => e.type === "pageNumber")) return "Page number";
  return flat.length ? `${flat.length} item${flat.length > 1 ? "s" : ""}` : "Empty";
}

/** "OPD BILL" → "OPD Bill", "patient details" → "Patient Details"; short all-caps words stay acronyms. */
const titleCase = (s) =>
  s
    .split(" ")
    .map((w) => (/^[A-Z0-9.&/]{2,3}$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");

const TABLE_NAMES = [
  [/pay|receipt|settle|collection/, "Payment Details"],
  [/test|lab|investigation|result/, "Test Results"],
  [/medicine|drug|rx|pharma|prescri/, "Medicines"],
  [/item|service|bill|charge|detail|package/, "Bill Items"],
];
const hits = (blob, words) => words.filter((w) => blob.includes(w)).length;

/**
 * A heading for a band read from what it holds: its title text, else a role guessed from its
 * fields (letterhead, a table, sign-off, bill summary, patient details, notes, page number).
 * Null when nothing tells.
 */
export function bandHeading(band) {
  const flat = flatEls(band);
  if (!flat.length) return null;
  const title = flat.find((e) => {
    if (e.type !== "heading" && e.type !== "label") return false;
    const big = e.type === "heading" || Number(e.style?.fontSize) >= 11;
    return big && staticText(e.text).length >= 3;
  });
  if (title) {
    const t = titleCase(staticText(title.text));
    return t.length > 24 ? `${t.slice(0, 23)}…` : t;
  }
  const blob = flat
    .map((e) => [e.text, e.expr, e.html, e.dataset, e.source, ...(Array.isArray(e.columns) ? e.columns.map((c) => `${c.header || ""} ${c.expr || ""}`) : [])].join(" "))
    .join(" ")
    .toLowerCase();
  const bigExpr = flat.some((e) => e.type === "label" && Number(e.style?.fontSize) >= 13 && /\{\{/.test(e.text || ""));
  if (flat.some((e) => e.type === "image" && (band.type === "pageHeader" || /letterhead|logo/.test(String(e.source || "")))) || (band.type === "pageHeader" && blob.includes("centre.")) || (bigExpr && /tel|phone|address|ltd|nagar|road/.test(blob)))
    return "Letterhead";
  const table = flat.find((e) => e.type === "table" || e.type === "crosstab");
  if (table) {
    const ds = String(table.dataset || "").toLowerCase();
    const hit = TABLE_NAMES.find(([re]) => re.test(ds));
    if (hit) return hit[1];
    const name = ds.split(".").pop().replace(/[_-]+/g, " ");
    return ds ? `${/^(grn|gst|vat|ipd|opd|uhid|po)$/.test(name) ? name.toUpperCase() : titleCase(name)} Table` : "Table";
  }
  if (flat.some((e) => e.type === "signature") || /signature|generated by|approved by|authori[sz]ed|prepared by|checked by/.test(blob))
    return /remark|note|reason/.test(blob) ? "Signatures & Remarks" : "Signatures";
  if (hits(blob, ["gross", "net", "discount", "total", "balance", "paid", "tax", "payable", "amount"]) >= 3) return "Bill Summary";
  if (hits(blob, ["uhid", "patient", "age", "gender", "name", "address", "mobile", "contact", "ipd", "mrno", "doctor"]) >= 3) return "Patient Details";
  if (/inrwords|words\(|in words/.test(blob)) return "Amount Summary";
  if (/remark|reason|comment/.test(blob)) return "Remarks";
  if (/terms|condition|note|disclaimer/.test(blob)) return "Terms & Notes";
  if (flat.some((e) => e.type === "pageNumber")) return /printed|print date|user/.test(blob) ? "Page No. & Print Info" : "Page Number";
  // caption pairs sharing a first word ("Indent Date:", "Indent No:") → "Indent Details"
  const firsts = {};
  for (const e of flat) {
    const w = e.type === "label" ? staticText(e.text).split(/[\s:]/)[0] : "";
    if (w && w.length >= 3) firsts[w.toLowerCase()] = (firsts[w.toLowerCase()] || 0) + 1;
  }
  const common = Object.entries(firsts).sort((x, y) => y[1] - x[1])[0];
  if (common && common[1] >= 2) return `${titleCase(common[0])} Details`;
  return null;
}

/**
 * Display name of a band: the name the user gave it, else a heading read from its content,
 * else its type label; numbered when two bands would read the same.
 * Returns { title, sub, n, of, zone, auto, summary }: `sub` is the type label when the title
 * is a name or heading, else a summary of the content.
 */
export function bandName(band, bands = []) {
  const meta = bandMeta(band.type);
  const base = (b) => b.name?.trim() || bandHeading(b) || bandMeta(b.type).label;
  const mine = base(band);
  const same = (bands.length ? bands : [band]).filter((b) => base(b) === mine);
  const n = Math.max(1, same.findIndex((b) => b.id === band.id) + 1);
  const of = same.length;
  const auto = mine !== meta.label;
  const summary = bandSummary(band);
  return { title: of > 1 ? `${mine} ${n}` : mine, sub: auto ? meta.label : summary, n, of, zone: meta.zone, auto, summary };
}
const ORDER = Object.fromEntries(BAND_TYPES.map((b, i) => [b.type, i]));

/** Keeps bands in flow order; bands of one type keep their relative order. */
export const sortBands = (bands) =>
  bands
    .map((b, i) => ({ b, i }))
    .sort((x, y) => (ORDER[x.b.type] ?? 9) - (ORDER[y.b.type] ?? 9) || x.i - y.i)
    .map((x) => x.b);

export const PAGE_SIZE_OPTIONS = Object.entries(PAGE_SIZES).map(([value, v]) => ({ value, label: v.label }));
export const FONT_OPTIONS = ["Inter", "Noto Sans", "Tinos", "Mono"];
export const FORMAT_TYPES = [
  { value: "none", label: "As is" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percent", label: "Percent" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date + time" },
  { value: "time", label: "Time" },
  { value: "words", label: "Amount in words" },
  { value: "upper", label: "UPPER CASE" },
  { value: "lower", label: "lower case" },
];

/** Toolbox: what can be dropped on a band. */
export const TOOLBOX = [
  {
    group: "Text",
    tone: "sky",
    items: [
      { type: "label", label: "Label", icon: "text", hint: "Static text, may hold {{fields}}" },
      { type: "heading", label: "Heading", icon: "heading", hint: "Large title" },
      { type: "field", label: "Data field", icon: "field", hint: "One bound value with a format" },
      { type: "richtext", label: "Rich text", icon: "rich", hint: "Formatted HTML / letterhead" },
    ],
  },
  {
    group: "Data",
    tone: "mint",
    items: [
      { type: "table", label: "Table", icon: "table", hint: "Rows of a result set, totals, page breaks" },
      { type: "amountWords", label: "Amount in words", icon: "words", hint: "Rupees … Only" },
      { type: "section", label: "Conditional section", icon: "section", hint: "A block shown only when a rule holds" },
    ],
  },
  {
    group: "Analysis",
    tone: "violet",
    items: [
      { type: "chart", label: "Chart", icon: "chart", hint: "Bar, line, area, pie or donut from a result set" },
      { type: "crosstab", label: "Crosstab", icon: "pivot", hint: "Pivot: rows × columns with totals (census by ward, revenue by month)" },
      { type: "subreport", label: "Sub-report", icon: "subreport", hint: "Another published template printed inside this one" },
      { type: "pageTotal", label: "Page total", icon: "sigma", hint: "Carried / brought forward and page sub-totals for long bills" },
    ],
  },
  {
    group: "Graphics",
    tone: "amber",
    items: [
      { type: "image", label: "Image / logo", icon: "image", hint: "Centre logo or an uploaded image" },
      { type: "line", label: "Line", icon: "line", hint: "Horizontal or vertical rule" },
      { type: "box", label: "Box", icon: "box", hint: "Border / background panel" },
      { type: "barcode", label: "Barcode", icon: "barcode", hint: "Code 128, Code 39, EAN, UPC, ITF, Data Matrix" },
      { type: "qr", label: "QR code", icon: "qr", hint: "Any text or link" },
    ],
  },
  {
    group: "Page",
    tone: "teal",
    items: [
      { type: "pageNumber", label: "Page X of Y", icon: "pages", hint: "Page numbering" },
      { type: "printDate", label: "Print date", icon: "clock", hint: "When it was printed" },
      { type: "signature", label: "Signature", icon: "sign", hint: "Signature line + label" },
    ],
  },
];
export const toolMeta = (type) => TOOLBOX.flatMap((g) => g.items).find((t) => t.type === type);

const INK = "#111827";

/** A new element of a type, at x/y (mm). */
export function makeElement(type, x = 0, y = 0, extra = {}) {
  const base = { id: uid(type.slice(0, 2)), type, x: round(x), y: round(y) };
  switch (type) {
    case "label":
      return { ...base, w: 50, h: 5, text: "Label", style: {}, ...extra };
    case "heading":
      return { ...base, w: 90, h: 8, text: "Heading", level: 1, style: { fontSize: 13, fontWeight: 700, color: INK }, ...extra };
    case "field":
      return { ...base, w: 50, h: 5, expr: "", style: { fontWeight: 600 }, nullText: "—", ...extra };
    case "richtext":
      return { ...base, w: 100, h: 14, html: "<b>Rich</b> text with {{fields}}", canGrow: true, style: {}, ...extra };
    case "table":
      return {
        ...base, w: 186, h: 24, dataset: "", showHeader: true, showFooter: true, repeatHeader: true, zebra: true, grid: "lines",
        emptyText: "No rows", columns: [], style: {}, ...extra,
      };
    case "amountWords":
      return { ...base, w: 110, h: 5, expr: "", currencyName: "Rupees", subunitName: "Paise", suffix: "Only", style: { fontWeight: 600 }, ...extra };
    case "section":
      return { ...base, w: 90, h: 20, visibleIf: "", collapse: true, children: [], style: { border: { width: 0.25, color: "#d1d5db", style: "dashed", sides: "tblr" } }, ...extra };
    case "image":
      return { ...base, w: 40, h: 16, source: "centreLogo", fit: "contain", style: {}, ...extra };
    case "line":
      return { ...base, w: 80, h: 2, orientation: "h", thickness: 0.3, color: "#9ca3af", ...extra };
    case "box":
      return { ...base, w: 60, h: 20, style: { border: { width: 0.3, color: "#d1d5db", style: "solid", sides: "tblr" }, radius: 1.5 }, ...extra };
    case "barcode":
      return { ...base, w: 50, h: 12, expr: "", showText: true, ...extra };
    case "qr":
      return { ...base, w: 20, h: 20, expr: "", ecc: "M", ...extra };
    case "pageNumber":
      return { ...base, w: 40, h: 4.5, text: "Page {page} of {pages}", style: { fontSize: 7, color: "#6b7280", align: "right" }, ...extra };
    case "printDate":
      return { ...base, w: 60, h: 4.5, prefix: "Printed on ", pattern: "DD-MMM-YYYY hh:mm A", style: { fontSize: 7, color: "#6b7280" }, ...extra };
    case "signature":
      return { ...base, w: 60, h: 18, label: "Authorised Signatory", nameExpr: "", style: { fontSize: 8, align: "right" }, ...extra };
    case "chart":
      return { ...base, w: 90, h: 50, chartType: "bar", dataset: "", labelExpr: "", valueExpr: "", agg: "sum", showValues: true, showLegend: true, style: {}, ...extra };
    case "crosstab":
      return { ...base, w: 186, h: 20, dataset: "", rowExpr: "", colExpr: "", valueExpr: "", agg: "sum", rowHeader: "", rowTotals: true, colTotals: true, grid: "grid", zebra: true, style: {}, ...extra };
    case "subreport":
      return { ...base, w: 186, h: 16, templateCode: "", params: {}, useParentData: false, ...extra };
    case "pageTotal":
      // a ready label: the running total carried to the next page (pageSum / broughtForward also available)
      return { ...base, type: "label", w: 80, h: 5, text: "Carried forward: {{format(carriedForward(Amount), 'number:2')}}", style: { fontWeight: 600, align: "right" }, ...extra };
    default:
      return { ...base, w: 40, h: 5, ...extra };
  }
}

/** Where page headers / footers print (band.printOn). */
export const PRINT_ON = [
  { value: "all", label: "Every page" },
  { value: "first", label: "First page only" },
  { value: "notFirst", label: "All but the first (brought forward)" },
  { value: "last", label: "Last page only" },
  { value: "notLast", label: "All but the last (carried forward)" },
  { value: "odd", label: "Odd pages (1, 3, 5…)" },
  { value: "even", label: "Even pages (2, 4, 6…)" },
];

export function makeBand(type, extra = {}) {
  const h = { pageHeader: 25, pageFooter: 10, reportHeader: 30, reportFooter: 25, detail: 6, groupHeader: 8, groupFooter: 8 }[type] || 20;
  return {
    id: uid("b"),
    type,
    height: h,
    ...(type === "pageHeader" || type === "pageFooter" ? { printOn: "all" } : {}),
    ...(type === "detail" ? { dataset: "" } : {}),
    ...(type === "groupHeader" || type === "groupFooter" ? { groupBy: "" } : {}),
    elements: [],
    ...extra,
  };
}

export function blankTemplate(datasource = "") {
  return normalizeTemplate({
    schemaVersion: 1,
    page: { size: "A4", orientation: "portrait", master: { size: "A4", orientation: "portrait" }, margins: { top: 10, right: 12, bottom: 10, left: 12 } },
    theme: { fontFamily: "Inter", fontSize: 9, color: "#1f2937", accent: ACCENT, lineHeight: 1.35, currency: "", locale: "en-IN", nullText: "" },
    header: { receiptHeaderType: "OPD" },
    datasource,
    bands: [makeBand("pageHeader"), makeBand("reportHeader"), makeBand("pageFooter")],
  });
}

/** A datasource's saved sample params, each declared param's own sample filling the gaps. */
export function initialParams(ds) {
  let sp = {};
  try {
    sp = JSON.parse(ds?.sampleParamsJson || "{}") || {};
  } catch {
    sp = {};
  }
  try {
    const def = JSON.parse(ds?.definitionJson || "{}");
    for (const p of def.params || []) if (sp[p.name] == null) sp[p.name] = p.sample ?? "";
  } catch {
    /* ignore */
  }
  return sp;
}

const round = (v, step = 0.1) => Math.round(Number(v || 0) / step) * step;
export const roundMm = (v) => Math.round(Number(v || 0) * 10) / 10;

/** Fills defaults, ids and order. Never throws on odd input. */
export function normalizeTemplate(t) {
  const tpl = t && typeof t === "object" ? JSON.parse(JSON.stringify(t)) : {};
  tpl.schemaVersion = 1;
  tpl.page = { size: "A4", orientation: "portrait", ...(tpl.page || {}) };
  tpl.page.margins = { top: 10, right: 12, bottom: 10, left: 12, ...(tpl.page.margins || {}) };
  tpl.theme = { fontFamily: "Inter", fontSize: 9, color: "#1f2937", accent: ACCENT, lineHeight: 1.35, currency: "", locale: "en-IN", nullText: "", ...(tpl.theme || {}) };
  tpl.header = { receiptHeaderType: "OPD", ...(tpl.header || {}) };
  const seen = new Set();
  const fix = (el) => {
    if (!el.id || seen.has(el.id)) el.id = uid(String(el.type || "e").slice(0, 2));
    seen.add(el.id);
    ["x", "y", "w", "h"].forEach((k) => {
      el[k] = Number.isFinite(Number(el[k])) ? Number(el[k]) : 0;
    });
    if (el.type === "table") el.columns = (el.columns || []).map((c) => ({ id: c.id || uid("c"), width: 20, ...c }));
    if (el.type === "section") el.children = (el.children || []).map(fix);
    return el;
  };
  tpl.bands = sortBands(
    (tpl.bands || []).map((b) => ({ ...b, id: b.id || uid("b"), height: Number(b.height) || 10, elements: (b.elements || []).map(fix) })),
  );
  return tpl;
}

/** Page geometry for the canvas. */
export const pageGeometry = (tpl) => resolvePage(tpl?.page);

/** Clipboard / duplicate: a deep copy with fresh ids. */
export function cloneElement(el, dx = 0, dy = 0) {
  const c = JSON.parse(JSON.stringify(el));
  const re = (e) => {
    e.id = uid(String(e.type || "e").slice(0, 2));
    if (e.columns) e.columns = e.columns.map((col) => ({ ...col, id: uid("c") }));
    if (e.children) e.children.forEach(re);
  };
  re(c);
  c.x = roundMm(c.x + dx);
  c.y = roundMm(c.y + dy);
  return c;
}
