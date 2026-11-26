/**
 * Reusable blocks: ready groups of elements dropped onto a band in one go.
 * Built-in blocks live here (clinical, tax, letterhead…); a team's own blocks
 * are saved in pb_block (PrintBuilder/Blocks). Coordinates are relative to the
 * block's top-left corner, in mm. A block can be inserted "linked" — as a
 * section that remembers its blockCode and can be updated later.
 */
import { uid } from "./defaults";

const L = (x, y, w, h, text, style = {}) => ({ type: "label", x, y, w, h, text, style: { color: "#6b7280", fontSize: 8, ...style } });
const F = (x, y, w, h, expr, style = {}, extra = {}) => ({ type: "field", x, y, w, h, expr, nullText: "—", style: { fontWeight: 600, ...style }, ...extra });
const money = { type: "number", decimals: 2 };

export const BUILTIN_BLOCKS = [
  {
    code: "builtin:letterhead",
    name: "Letterhead",
    category: "Header",
    icon: "image",
    tone: "sky",
    description: "Centre logo, name, address and contact, with a rule under it",
    width: 186,
    height: 24,
    elements: [
      { type: "image", x: 0, y: 0, w: 38, h: 20, source: "centreLogo", fit: "contain", style: {} },
      { type: "heading", x: 42, y: 1, w: 144, h: 8, text: "{{centre.CentreName}}", style: { fontSize: 14, fontWeight: 700, color: "#111827", align: "right" } },
      L(42, 9.5, 144, 4.5, "{{centre.Address}}{{centre.City ? ', ' + centre.City : ''}}", { align: "right" }),
      L(42, 14, 144, 4.5, "Ph: {{centre.MobileNo}}  ·  {{centre.EmailID}}  ·  {{centre.Website}}", { align: "right" }),
      { type: "line", x: 0, y: 22, w: 186, h: 2, orientation: "h", thickness: 0.4, color: "#0f766e" },
    ],
  },
  {
    code: "builtin:patient-header",
    name: "Patient header",
    category: "Header",
    icon: "users",
    tone: "sky",
    description: "UHID, name, age / sex, doctor, bill no and date in a bordered panel",
    width: 186,
    height: 17,
    elements: [
      { type: "box", x: 0, y: 0, w: 186, h: 17, style: { border: { width: 0.3, color: "#cbd5e1", style: "solid", sides: "tblr" }, radius: 1.5, background: "#f8fafc" } },
      L(3, 2, 22, 4.5, "Patient"), F(25, 2, 70, 4.5, "bill.PatientName"),
      L(100, 2, 20, 4.5, "UHID"), F(120, 2, 63, 4.5, "bill.PatientID"),
      L(3, 6.5, 22, 4.5, "Age / Sex"), F(25, 6.5, 70, 4.5, "concat(bill.AgeCombined, ' / ', bill.Gender)"),
      L(100, 6.5, 20, 4.5, "Bill no"), F(120, 6.5, 63, 4.5, "bill.BillNo"),
      L(3, 11, 22, 4.5, "Doctor"), F(25, 11, 70, 4.5, "bill.DoctorName"),
      L(100, 11, 20, 4.5, "Date"), F(120, 11, 63, 4.5, "bill.BillDate", {}, { format: { type: "datetime" } }),
    ],
  },
  {
    code: "builtin:vitals",
    name: "Vitals grid",
    category: "Clinical",
    icon: "pulse",
    tone: "rose",
    description: "BP, pulse, temperature, SpO₂, respiration, weight — six tiles",
    width: 186,
    height: 14,
    elements: [
      ...[["BP", "vitals.BP", ""], ["Pulse", "vitals.Pulse", "/min"], ["Temp", "vitals.Temp", "°F"], ["SpO₂", "vitals.SpO2", "%"], ["Resp.", "vitals.Resp", "/min"], ["Weight", "vitals.Weight", "kg"]].flatMap(([lbl, ex, unit], i) => [
        { type: "box", x: i * 31, y: 0, w: 29.5, h: 13, style: { border: { width: 0.3, color: "#fecdd3", style: "solid", sides: "tblr" }, radius: 1.5, background: "#fff1f2" } },
        L(i * 31 + 2, 1, 26, 4, lbl.toUpperCase(), { fontSize: 6.5, color: "#9f1239", letterSpacing: 0.3 }),
        F(i * 31 + 2, 5.5, 26, 6, ex, { fontSize: 11, fontWeight: 700, color: "#111827" }, { format: unit ? { type: "none", suffix: ` ${unit}` } : undefined }),
      ]),
    ],
  },
  {
    code: "builtin:rx",
    name: "Rx — medicines",
    category: "Clinical",
    icon: "list",
    tone: "rose",
    description: "℞ table: medicine, dose, frequency, duration, instructions",
    width: 186,
    height: 22,
    elements: [
      { type: "heading", x: 0, y: 0, w: 30, h: 8, text: "℞", style: { fontSize: 18, fontWeight: 700, color: "#0f766e" } },
      {
        type: "table", x: 0, y: 9, w: 186, h: 12, dataset: "medicines", showHeader: true, showFooter: false, repeatHeader: true, zebra: true, grid: "lines", emptyText: "No medicines", style: {},
        columns: [
          { header: "#", expr: "rowNumber", width: 6 },
          { header: "Medicine", expr: "MedicineName", width: 48, bold: true },
          { header: "Dose", expr: "Dose", width: 18 },
          { header: "Frequency", expr: "Frequency", width: 22 },
          { header: "Duration", expr: "Duration", width: 18 },
          { header: "Instructions", expr: "Remarks", width: 40 },
        ],
      },
    ],
  },
  {
    code: "builtin:lab-result",
    name: "Lab results with flags",
    category: "Clinical",
    icon: "pulse",
    tone: "rose",
    description: "Test, result, unit, reference range; out-of-range results print red and bold",
    width: 186,
    height: 14,
    elements: [
      {
        type: "table", x: 0, y: 0, w: 186, h: 14, dataset: "results", showHeader: true, showFooter: false, repeatHeader: true, zebra: false, grid: "lines", emptyText: "No results", groupBy: "Department", style: {},
        columns: [
          { header: "Test", expr: "TestName", width: 50 },
          { header: "Result", expr: "Value", width: 20, bold: true, styleRules: [{ when: "!between(value, MinValue, MaxValue)", color: "#b91c1c", bold: true }] },
          { header: "Flag", expr: "if(num(Value) > num(MaxValue) and MaxValue != '', 'H', if(num(Value) < num(MinValue) and MinValue != '', 'L', ''))", width: 8, styleRules: [{ when: "value != ''", color: "#b91c1c", bold: true }] },
          { header: "Unit", expr: "Unit", width: 16 },
          { header: "Reference range", expr: "concat(MinValue, ' – ', MaxValue)", width: 30 },
        ],
      },
    ],
  },
  {
    code: "builtin:gst-summary",
    name: "GST / VAT summary",
    category: "Billing",
    icon: "sigma",
    tone: "amber",
    description: "Taxable value and tax lines; prints CGST + SGST when GST applies (sys.gst), else VAT",
    width: 80,
    height: 22,
    elements: [
      { type: "box", x: 0, y: 0, w: 80, h: 22, style: { border: { width: 0.3, color: "#fde68a", style: "solid", sides: "tblr" }, radius: 1.5, background: "#fffbeb" } },
      L(3, 1.5, 44, 4.5, "Taxable value"), F(47, 1.5, 30, 4.5, "sum(TaxableAmount)", { align: "right" }, { format: money }),
      L(3, 6, 44, 4.5, "{{sys.gst ? 'CGST' : 'VAT'}}"), F(47, 6, 30, 4.5, "sys.gst ? sum(CGSTAmount) : sum(VATAmount)", { align: "right" }, { format: money }),
      { ...L(3, 10.5, 44, 4.5, "SGST"), visibleIf: "sys.gst", collapse: true }, { ...F(47, 10.5, 30, 4.5, "sum(SGSTAmount)", { align: "right" }, { format: money }), visibleIf: "sys.gst", collapse: true },
      L(3, 15.5, 44, 5, "Total tax", { color: "#111827", fontWeight: 700 }), F(47, 15.5, 30, 5, "sys.gst ? sum(CGSTAmount) + sum(SGSTAmount) : sum(VATAmount)", { align: "right", fontWeight: 700 }, { format: money }),
    ],
  },
  {
    code: "builtin:amount-summary",
    name: "Amount summary",
    category: "Billing",
    icon: "sigma",
    tone: "amber",
    description: "Gross, discount, net, paid and balance, with the amount in words",
    width: 186,
    height: 26,
    elements: [
      L(110, 0, 40, 4.5, "Gross amount"), F(150, 0, 36, 4.5, "bill.GrossAmount", { align: "right" }, { format: money }),
      L(110, 4.5, 40, 4.5, "Discount"), F(150, 4.5, 36, 4.5, "bill.DiscountOnTotal", { align: "right" }, { format: money }),
      L(110, 9.5, 40, 5, "Net amount", { color: "#111827", fontWeight: 700 }), F(150, 9.5, 36, 5, "bill.NetAmount", { align: "right", fontWeight: 700, border: { width: 0.3, style: "solid", color: "#374151", sides: "t" } }, { format: money }),
      L(110, 14.5, 40, 4.5, "Paid"), F(150, 14.5, 36, 4.5, "bill.AmountPaid", { align: "right" }, { format: money }),
      L(110, 19, 40, 4.5, "Balance"), F(150, 19, 36, 4.5, "bill.BalanceAmt", { align: "right" }, { format: money, styleRules: [{ when: "value > 0", color: "#b91c1c", bold: true }] }),
      { type: "amountWords", x: 0, y: 0, w: 105, h: 10, expr: "bill.NetAmount", currencyName: "Rupees", subunitName: "Paise", suffix: "Only", prefix: "Amount in words: ", canGrow: true, style: { fontWeight: 600, fontSize: 8 } },
    ],
  },
  {
    code: "builtin:payments",
    name: "Payment details",
    category: "Billing",
    icon: "table",
    tone: "amber",
    description: "Receipt no, mode, date and amount of each payment, with the total",
    width: 120,
    height: 14,
    elements: [
      {
        type: "table", x: 0, y: 0, w: 120, h: 14, dataset: "payments", showHeader: true, showFooter: true, repeatHeader: true, zebra: true, grid: "lines", emptyText: "No payments", style: { fontSize: 8 },
        columns: [
          { header: "Receipt", expr: "ReceiptNo", width: 28 },
          { header: "Mode", expr: "PaymentMode", width: 22, footerText: "Total" },
          { header: "Date", expr: "ReceiptDate", width: 26, format: { type: "date" } },
          { header: "Amount", expr: "Amount", width: 22, format: money, footerExpr: "sum(Amount)" },
        ],
      },
    ],
  },
  {
    code: "builtin:signatures",
    name: "Signature strip",
    category: "Footer",
    icon: "sign",
    tone: "mint",
    description: "Patient and authorised signatory side by side",
    width: 186,
    height: 18,
    elements: [
      { type: "signature", x: 0, y: 0, w: 60, h: 18, label: "Patient / Attendant", nameExpr: "", style: { fontSize: 8, align: "left" } },
      { type: "signature", x: 126, y: 0, w: 60, h: 18, label: "Authorised Signatory", nameExpr: "sys.printedBy", style: { fontSize: 8, align: "right" } },
    ],
  },
  {
    code: "builtin:modern-footer",
    name: "Modern page footer",
    category: "Footer",
    icon: "pages",
    tone: "violet",
    description: "Clean footer: a soft gradient rule, printed by · printed on, and a 'Page X of Y' pill. Drop it in 'Bottom of each page'.",
    width: 186,
    height: 8,
    elements: [
      { type: "box", x: 0, y: 0.6, w: 186, h: 0.35, style: { background: "linear-gradient(90deg,rgba(99,102,241,0),#6366f1 20%,#a855f7 80%,rgba(168,85,247,0))", radius: 0.2 } },
      L(0, 2.6, 14, 4, "Printed by", { fontSize: 7.4, color: "#94a3b8" }),
      L(13.2, 2.6, 60, 4, "{{coalesce(user.EmployeeName, sys.printedBy)}}", { fontSize: 7.4, color: "#1e293b", fontWeight: 600 }),
      L(56, 2.6, 74, 4, "{{date(sys.now, 'DD-MMM-YYYY · hh:mm A')}}", { fontSize: 7.4, color: "#64748b", align: "center" }),
      { type: "box", x: 162, y: 2.1, w: 24, h: 4.6, style: { background: "#eef2ff", radius: 2.3 } },
      { type: "pageNumber", x: 162, y: 2.6, w: 24, h: 3.8, text: "Page {page} / {pages}", style: { fontSize: 7, color: "#4338ca", fontWeight: 700, align: "center" } },
    ],
  },
  {
    code: "builtin:carried-forward",
    name: "Carried / brought forward",
    category: "Footer",
    icon: "sigma",
    tone: "mint",
    description: "Page sub-total and running total for long bills (put it in a page footer set to 'All but the last')",
    width: 186,
    height: 6,
    elements: [
      L(0, 0.5, 90, 5, "Page total: {{format(pageSum(Amount), 'number:2')}}", { color: "#374151" }),
      L(96, 0.5, 90, 5, "Carried forward: {{format(carriedForward(Amount), 'number:2')}}", { color: "#111827", fontWeight: 700, align: "right" }),
    ],
  },
];

/** A block's elements with fresh ids, shifted by (dx, dy). */
/**
 * Re-anchors a block's elements from the width it was saved at (`from`) to the
 * width it is dropped into (`to`), keeping every size and gap: elements that
 * span the block stretch; the right-hand group (anything touching the right
 * edge or starting in the right half — e.g. "Email :" captions with their
 * values) moves with the right edge, so it stays together; centred items move
 * half as far; the left-hand group (the logo) stays put. Sections pass the
 * change on to their own children.
 */
function reanchor(els, from, to) {
  const d = to - from;
  if (!(from > 1) || Math.abs(d) < 0.5) return els;
  const edge = Math.max(1.5, from * 0.015);
  return els.map((el) => {
    const x = Number(el.x) || 0;
    const w = Number(el.w) || 0;
    const c = { ...el };
    if (x <= edge && x + w >= from - edge) {
      c.w = Math.round((w + d) * 10) / 10;
      if (Array.isArray(c.children)) c.children = reanchor(c.children, w, c.w);
    } else if (Math.abs(x + w / 2 - from / 2) <= from * 0.04 && x + w < from - edge) c.x = Math.round((x + d / 2) * 10) / 10;
    else if (x + w >= from - edge || x >= from * 0.45 || x + w / 2 >= from * 0.6) c.x = Math.round((x + d) * 10) / 10;
    return c;
  });
}

/**
 * Width a block should take in a template of design width `toWidth`: a
 * page-wide block (a header, a footer, any section saved whole — 120 mm or
 * more) follows the page; a small group keeps its own size. 0 = no change.
 */
export const fitWidth = (block, toWidth) => (toWidth > 0 && Number(block.width) >= 120 ? toWidth : 0);

/**
 * A block's elements with fresh ids, shifted by (dx, dy). With `toWidth`
 * (the template's design width) a page-wide block saved on a wider or
 * narrower page is re-anchored to it first.
 */
export function blockElements(block, dx = 0, dy = 0, toWidth = 0) {
  const fresh = (el) => {
    const c = JSON.parse(JSON.stringify(el));
    c.id = uid(String(c.type || "e").slice(0, 2));
    if (c.columns) c.columns = c.columns.map((col) => ({ ...col, id: uid("c") }));
    if (c.children) c.children = c.children.map(fresh);
    return c;
  };
  const to = fitWidth(block, toWidth - dx);
  const els = to ? reanchor(block.elements || [], Number(block.width) || 0, to) : block.elements || [];
  return els.map((el) => {
    const c = fresh(el);
    c.x = Math.round((Number(c.x || 0) + dx) * 10) / 10;
    c.y = Math.round((Number(c.y || 0) + dy) * 10) / 10;
    return c;
  });
}

/** The block as one linked section (it remembers blockCode and can be updated). */
export function blockSection(block, x = 0, y = 0, toWidth = 0) {
  const to = fitWidth(block, toWidth - x);
  return {
    id: uid("se"),
    type: "section",
    x,
    y,
    w: to || Number(block.width) || 186,
    h: Number(block.height) || 20,
    blockCode: block.code,
    collapse: true,
    children: blockElements(block, 0, 0, to),
    style: {},
  };
}

/* element types whose text takes the template's font, size and colour unless they set their own */
const TEXT_TYPES = new Set(["label", "heading", "field", "richtext", "amountWords", "pageNumber", "printDate", "signature", "table", "pageTotal"]);

/**
 * Elements → a block definition. A whole section (`band`) keeps its own
 * origin, its height and the full design width (`opts.width`), so it drops
 * back in exactly as laid out; a selection is trimmed to its bounding box.
 * `opts.theme` (the source template's) is written into each text element that
 * relied on it, so the block looks the same in a template with another font
 * or base size.
 */
export function blockFromElements(els, band = null, opts = {}) {
  const minX = band ? 0 : Math.min(...els.map((e) => Number(e.x) || 0));
  const minY = band ? 0 : Math.min(...els.map((e) => Number(e.y) || 0));
  const maxR = Math.max(...els.map((e) => (Number(e.x) || 0) + (Number(e.w) || 0)), band && opts.width ? Number(opts.width) : 0);
  const maxB = Math.max(...els.map((e) => (Number(e.y) || 0) + (Number(e.h) || 0)), band ? Number(band.height) || 0 : 0);
  const th = opts.theme || {};
  const bake = (c) => {
    if (TEXT_TYPES.has(c.type)) {
      c.style = { ...(c.style || {}) };
      if (c.style.fontSize == null && th.fontSize) c.style.fontSize = th.fontSize;
      if (!c.style.fontFamily && th.fontFamily) c.style.fontFamily = th.fontFamily;
      if (!c.style.color && th.color) c.style.color = th.color;
      if (c.style.lineHeight == null && th.lineHeight) c.style.lineHeight = th.lineHeight;
    }
    if (Array.isArray(c.children)) c.children.forEach(bake);
    return c;
  };
  return {
    width: Math.round((maxR - minX) * 10) / 10,
    height: Math.round((maxB - minY) * 10) / 10,
    elements: els.map((e) => {
      const c = bake(JSON.parse(JSON.stringify(e)));
      delete c.id;
      c.x = Math.round(((Number(c.x) || 0) - minX) * 10) / 10;
      c.y = Math.round(((Number(c.y) || 0) - minY) * 10) / 10;
      return c;
    }),
  };
}

/** Saved blocks from the API, parsed into the built-in shape. */
export function parseSavedBlocks(rows) {
  return (rows || []).map((r) => {
    let elements = [];
    try {
      elements = JSON.parse(r.elements || r.elementsJson || "[]");
    } catch {
      elements = [];
    }
    return { code: r.code, name: r.name, category: r.category || "Saved", description: r.description, width: r.width, height: r.height, elements, icon: "puzzle", tone: "violet", saved: true, updatedBy: r.updatedBy };
  });
}
