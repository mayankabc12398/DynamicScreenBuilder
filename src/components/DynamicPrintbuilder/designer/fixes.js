/**
 * One-click fixes for publish problems. Validation already says which band,
 * element and property is wrong; this works out a repair:
 *   unknown / mistyped field  → rebind to the closest field name
 *   letter-case warning       → the field's exact spelling
 *   unknown function          → the closest function
 *   table without columns     → columns from its row set
 *   detail band without rows  → the first result set
 *   element past its band     → grow the band
 *   duplicate element id      → a new id
 *   undeclared parameter      → add it to the datasource (handled by the designer)
 * suggestFix(issue, tpl, schema) → { label, apply(tpl) } | { label, addParam } | null
 */
import { uid } from "../model/defaults";
import { findEl } from "../model/useDesigner";

const FUNCTIONS = ["sum", "count", "avg", "min", "max", "first", "last", "distinct", "if", "coalesce", "concat", "upper", "lower", "trim", "len", "left", "right", "substr", "replace", "contains", "startswith", "endswith", "round", "abs", "ceil", "floor", "num", "text", "isempty", "isnull", "words", "format", "date", "now", "today", "proper", "fixed", "inrwords", "intlwords", "striptags", "htmlblocks", "oneof", "between", "pad", "pageSum", "carriedForward", "broughtForward"];

function distance(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}

/** The closest name in a list (null when nothing is reasonably close). */
export function closest(name, list) {
  let best = null;
  let bd = Infinity;
  for (const c of list || []) {
    // "PatientName" vs "Patient_Name" / "PName": compare without separators too
    const d = Math.min(distance(name, c), distance(name.replace(/[_\s]/g, ""), c.replace(/[_\s]/g, "")) + 0.5);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best && bd <= Math.max(2, Math.ceil(name.length * 0.4)) ? best : null;
}

/** Reads / writes the property an issue points at (element prop, column prop, band prop). */
function target(t, where) {
  if (!where) return null;
  if (where.element) {
    const f = findEl(t, where.element);
    if (!f) return null;
    const prop = String(where.prop || "");
    if (where.column) {
      const col = (f.el.columns || []).find((c) => c.id === where.column);
      return col ? { obj: col, key: prop } : null;
    }
    const m = prop.match(/^(\w+)\[(\d+)\]\.(\w+)$/); // styleRules[0].when, series[1].expr
    if (m) {
      const arr = f.el[m[1]];
      return arr && arr[+m[2]] ? { obj: arr[+m[2]], key: m[3] } : null;
    }
    return { obj: f.el, key: prop };
  }
  if (where.band) {
    const b = t.bands.find((x) => x.id === where.band);
    return b ? { obj: b, key: where.prop } : null;
  }
  return null;
}

const swapWord = (text, from, to) => String(text).replace(new RegExp(`(?<![\\w$.])${from.replace(/[$]/g, "\\$")}(?![\\w$])`, "g"), to);
const swapField = (text, from, to) => String(text).replace(new RegExp(`(?<![\\w$])${from.replace(/[$]/g, "\\$")}(?![\\w$])`, "g"), to);

export function suggestFix(issue, tpl, schema) {
  const msg = issue.message || "";
  const where = issue.where || { band: issue.band, element: issue.element, prop: issue.prop };
  const sets = schema?.sets || {};
  const allFields = [...new Set(Object.values(sets).flat())];
  let m;

  if ((m = msg.match(/^Field "([^"]+)" is not in (?:result|row) set "([^"]+)"/))) {
    const better = closest(m[1], sets[m[2]]);
    if (!better) return null;
    return { label: `Use ${better}`, apply: (t) => rebind(t, where, m[1], better) };
  }
  if ((m = msg.match(/^Unknown field "([^"]+)"(?: \(not in row set "([^"]+)")?/))) {
    const pool = m[2] ? [...(sets[m[2]] || []), ...allFields] : allFields;
    const better = closest(m[1], pool);
    if (better) return { label: `Use ${better}`, apply: (t) => rebind(t, where, m[1], better) };
    if (!m[2]) {
      // a bare field at the report level: the set it lives in
      const set = Object.keys(sets).find((s) => (sets[s] || []).some((f) => f.toLowerCase() === m[1].toLowerCase()));
      if (set) return { label: `Use ${set}.${m[1]}`, apply: (t) => rebind(t, where, m[1], `${set}.${m[1]}`) };
    }
    return null;
  }
  if ((m = msg.match(/^"([^"]+)" differs in letter case from the field in "([^"]+)"/))) {
    const exact = (sets[m[2]] || []).find((f) => f.toLowerCase() === m[1].toLowerCase());
    return exact ? { label: `Use ${exact}`, apply: (t) => rebind(t, where, m[1], exact) } : null;
  }
  if ((m = msg.match(/^Unknown function (\w+)\(\)/))) {
    const better = closest(m[1], FUNCTIONS);
    return better ? { label: `Use ${better}()`, apply: (t) => rebind(t, where, m[1], better, true) } : null;
  }
  if ((m = msg.match(/^Parameter "([^"]+)" is not declared/))) return { label: `Add parameter ${m[1]}`, addParam: m[1] };
  if (msg.startsWith("Table has no columns")) {
    const f = findEl(tpl, where.element);
    const set = f?.el?.dataset;
    if (!set || !sets[set]) return null;
    return {
      label: "Add columns",
      apply: (t) => {
        const g = findEl(t, where.element);
        if (g) g.el.columns = sets[set].slice(0, 6).map((n) => ({ id: uid("c"), header: n.replace(/([a-z])([A-Z])/g, "$1 $2"), expr: n, width: 20 }));
      },
    };
  }
  if (msg.startsWith("Detail band has no row set") || msg.startsWith("Table has no row set")) {
    const first = Object.keys(sets)[0];
    if (!first) return null;
    return {
      label: `Use ${first}`,
      apply: (t) => {
        const x = target(t, { ...where, prop: "dataset" });
        if (x) x.obj.dataset = first;
      },
    };
  }
  if (msg.includes("runs past the bottom of its band"))
    return {
      label: "Grow band",
      apply: (t) => {
        const f = findEl(t, where.element);
        if (f) f.band.height = Math.round((f.el.y + f.el.h + 0.5) * 10) / 10;
      },
    };
  if (msg.startsWith("Duplicate element id"))
    return {
      label: "New id",
      apply: (t) => {
        const hits = [];
        t.bands.forEach((b) => b.elements.forEach((e) => e.id === where.element && hits.push(e)));
        if (hits.length > 1) hits[hits.length - 1].id = uid(String(hits[hits.length - 1].type).slice(0, 2));
      },
    };
  return null;
}

function rebind(t, where, from, to, fn = false) {
  const x = target(t, where);
  if (!x || typeof x.obj[x.key] !== "string") {
    // the issue had no exact property: rewrite every expression of the element
    const f = where.element && findEl(t, where.element);
    if (!f) return;
    const walk = (o) => {
      for (const k of Object.keys(o)) {
        if (typeof o[k] === "string") o[k] = fn ? swapWord(o[k], from, to) : swapField(o[k], from, to);
        else if (o[k] && typeof o[k] === "object" && k !== "style") walk(o[k]);
      }
    };
    walk(f.el);
    return;
  }
  x.obj[x.key] = fn ? swapWord(x.obj[x.key], from, to) : swapField(x.obj[x.key], from, to);
}
