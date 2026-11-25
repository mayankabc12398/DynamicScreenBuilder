/**
 * Binding expressions, path lookup and condition evaluation.
 * Deliberately tiny — no eval on user data except the explicit "Run custom JS"
 * action, which is opt-in from the event editor. moment is the one dependency,
 * and only the `date` filter uses it.
 */
import moment from "moment";
import { OPERATORS } from "../schema/schema";

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * `getPath({a:{b:[{c:1}]}}, "a.b.0.c")` -> 1
 *
 * `*` walks a list instead of indexing it: `selected.DoctorID.*.DoctorName` is
 * that column of EVERY chosen row, as a list. A multi select's picked rows are
 * an array, so without it the only reachable row is `.0` — and a payload that
 * names one of several choices is a payload that is wrong for the rest.
 */
export function getPath(obj, path) {
  if (!path) return obj;
  if (obj === null || obj === undefined) return undefined;
  const parts = String(path)
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length; i += 1) {
    if (cur === null || cur === undefined) return undefined;
    // The prototype chain is not data. Without this, `{{constructor}}` reads
    // back a function and `__proto__` reaches the shared prototype of every
    // object on the screen — neither is anything a screen document should be
    // able to name, and a screen document travels between browsers.
    if (UNSAFE_KEYS.has(parts[i])) return undefined;
    if (parts[i] === "*") {
      if (!Array.isArray(cur)) return undefined;
      const rest = parts.slice(i + 1).join(".");
      return rest ? cur.map((entry) => getPath(entry, rest)) : cur;
    }
    cur = cur[parts[i]];
  }
  return cur;
}

export function setPath(obj, path, value) {
  const parts = String(path).split(".").filter(Boolean);
  const next = { ...(obj || {}) };
  let cur = next;
  for (let i = 0; i < parts.length - 1; i += 1) {
    cur[parts[i]] = typeof cur[parts[i]] === "object" && cur[parts[i]] !== null ? { ...cur[parts[i]] } : {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

const TEMPLATE = /\{\{\s*([^}]+?)\s*\}\}/g;

/** True when a string contains at least one `{{ }}` template. */
export function hasTemplate(str) {
  return typeof str === "string" && /\{\{[^}]+\}\}/.test(str);
}

/* ------------------------------------------------------------ JS values ---
   A value box switched to JS (the JS icon beside it) stores its code behind
   this marker: "{{js}} row.Ids.split(',')". It is a template, so every place
   that resolves a value — a payload key, a record or per-item key, an "if
   empty", Set value, Set variable, Add / Update row — runs it through
   `interpolate` with nothing else to change. No saved screen holds the marker
   (it used to resolve to an empty `js` path), so nothing that ran before
   behaves differently.

   The code is written by the screen designer and stored with the screen — the
   same trust as the Run custom JS action. It is never built from data: values
   a template reads (a typed field, a response) are substituted, not
   re-interpolated, so a user cannot type code into it. */

export const JS_PREFIX = "{{js}}";

/** Is this value a JS one? */
export const isJsValue = (v) => typeof v === "string" && v.startsWith(JS_PREFIX);

/** The code of a JS value, without its marker. */
export const jsCodeOf = (v) => (isJsValue(v) ? v.slice(JS_PREFIX.length).replace(/^ /, "") : "");

/** Code -> the stored value. */
export const toJsValue = (code) => `${JS_PREFIX} ${code ?? ""}`;

/**
 * Names the code can always use, even when this scope has no such key — so
 * `row.X` without a clicked row says "row is undefined" rather than "row is
 * not defined", and the same code compiles once whatever the scope holds.
 */
const JS_NAMES = ["row", "item", "label", "index", "number", "parentRow", "values", "labels", "selected", "vars", "data", "rows", "grid", "user", "local", "globals", "params", "response", "today"];
const JS_RESERVED = new Set(
  "break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await arguments eval undefined NaN Infinity scope".split(
    " ",
  ),
);
const jsCompiled = new Map();
const jsWarned = new Set();

function compileJs(src, names) {
  const key = `${names.join(",")}\u0000${src}`;
  let fn = jsCompiled.get(key);
  if (fn) return fn;
  // An expression first — `row.A.split(",")`, with or without a closing `;`.
  // Not one (several lines, an `if`), then a function body, which says what
  // it returns with `return`.
  try {
    // eslint-disable-next-line no-new-func
    fn = new Function("scope", ...names, `return (${src.replace(/[\s;]+$/, "")}\n);`);
  } catch (e) {
    // eslint-disable-next-line no-new-func
    fn = new Function("scope", ...names, src);
  }
  if (jsCompiled.size > 500) jsCompiled.clear();
  jsCompiled.set(key, fn);
  return fn;
}

/**
 * Run a JS value's code against a scope. Every key of the scope is a name in
 * the code (`values`, `vars`, `row`, `item`, `response`…), and `scope` is the
 * whole of it.
 *
 * A mistake is reported in the console and resolves to "" — the same as a
 * template that reads nothing — unless `throws`, which the builder's run
 * button uses to show the error itself.
 */
export function runJsValue(code, scope = {}, { throws = false } = {}) {
  const src = String(code ?? "").trim();
  if (!src) return "";
  const s = scope && typeof scope === "object" ? scope : {};
  const names = [
    ...new Set([...JS_NAMES, ...Object.keys(s).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k))]),
  ].filter((k) => !JS_RESERVED.has(k));
  try {
    const fn = compileJs(src, names);
    return fn(s, ...names.map((k) => s[k]));
  } catch (e) {
    if (throws) throw e;
    // A component's own props are resolved on every render, so a broken value
    // there would repeat its warning forever. Once per code and message.
    const said = `${src}\u0000${e?.message}`;
    if (!jsWarned.has(said)) {
      if (jsWarned.size > 200) jsWarned.clear();
      jsWarned.add(said);
      console.warn("[ScreenBuilder] JS value failed —", src, e);
    }
    return "";
  }
}

/**
 * `{{today}}` and `{{now}}` for the scope a screen resolves against.
 *
 * Read when the scope is built, so a screen left open overnight still says
 * today. Kept here because this is the file that owns moment.
 */
export function dateTokens() {
  const m = moment();
  return { today: m.format("YYYY-MM-DD"), now: m.format("YYYY-MM-DD HH:mm:ss") };
}

/** A fallback that names a field rather than spelling out a value. */
const PATH_LIKE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/;

/** The parse a date filter accepts — the same list `date` has always taken. */
const DATE_FORMATS = [moment.ISO_8601, "YYYY-MM-DD", "DD-MMM-YYYY", "DD/MM/YYYY"];

/**
 * A date shifted by `n` units. Anything that is not a date is handed back
 * untouched: a filter is no place to turn a patient name into 1970-01-01.
 */
function shiftDate(v, n, unit) {
  if (v === "" || v === null || v === undefined) return "";
  const m = asMoment(v);
  const by = Number(n);
  if (!m || !Number.isFinite(by)) return v;
  return m.clone().add(by, unit).format("YYYY-MM-DD");
}

/**
 * A value as a date, or null. Strict about what counts: "2026", "12" and a
 * patient name are not dates — without this a condition read "2026-09-28" as
 * the number 2026 and every date in one year compared equal.
 */
const DATE_LIKE = /^\s*(\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?|\d{1,2}-[A-Za-z]{3}-\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/;
export function asMoment(v) {
  if (v === "today") return moment().startOf("day");
  if (v instanceof Date) return moment(v);
  if (moment.isMoment(v)) return v;
  if (typeof v !== "string" || !DATE_LIKE.test(v)) return null;
  const m = moment(v, DATE_FORMATS, false);
  return m.isValid() ? m : null;
}

/** How far `a` is after `b`, in whole units — negative when it is before. */
function dateDiff(a, b, unit) {
  const ma = asMoment(a);
  const mb = asMoment(b === undefined || b === "" ? "today" : b);
  if (!ma || !mb) return "";
  return ma.clone().startOf("day").diff(mb.clone().startOf("day"), unit);
}

/** A filter's "other date": `today`, a field of the scope, or a date typed in. */
function otherDate(arg, scope) {
  if (arg === undefined || arg === "" || arg === "today") return "today";
  const quoted = /^(['"])(.*)\1$/.exec(arg);
  if (quoted) return quoted[2];
  if (PATH_LIKE.test(arg)) {
    const hit = getPath(scope, arg);
    if (hit !== undefined && hit !== null && hit !== "") return hit;
  }
  return arg;
}

/**
 * A date filter's amount: a number, or a field that holds one. Without this
 * `addDays:selected.validityDays.value` was Number("selected…") — NaN — and
 * the date came back unmoved.
 */
function amountArg(n, scope) {
  const t = typeof n === "string" ? n.trim() : n;
  if (typeof t === "string" && t !== "" && !Number.isFinite(Number(t)) && PATH_LIKE.test(t)) {
    const hit = getPath(scope, t);
    if (hit !== undefined && hit !== null && hit !== "") return hit;
  }
  return t;
}

const edgeOf = (v, edge, unit) => {
  const m = asMoment(v);
  return m ? m.clone()[edge](unit).format("YYYY-MM-DD") : v === null || v === undefined ? "" : v;
};

/**
 * Filters a template may pipe a value through: `{{values.fromDate | date:DD-MMM-YYYY}}`.
 *
 * These exist because the controls and the endpoints disagree about shape. A
 * date control stores ISO, and half the app's endpoints want "DD-MMM-YYYY"; a
 * checkbox stores true/false where the payload carries 1/0. Without a filter
 * the only fix is a hand-written action, which is exactly what a screen built
 * in the builder is meant to avoid.
 */
const FILTERS = {
  date: (v, fmt) => {
    if (v === "" || v === null || v === undefined) return "";
    const m = moment(v instanceof Date ? v : String(v), [moment.ISO_8601, "YYYY-MM-DD", "DD-MMM-YYYY", "DD/MM/YYYY"], false);
    return m.isValid() ? m.format(fmt || "DD-MMM-YYYY") : "";
  },
  /**
   * A date moved by a whole number of days / months / years, for the "from"
   * of a range that is always a year back: {{today | addYears:-1}}. It keeps
   * a real date, so `| date:YYYY-MM-DD` after it formats the result; on its
   * own it reads as YYYY-MM-DD, which is what the endpoints take.
   */
  // The amount may be a field: {{today | addDays:selected.validityDays.value}}.
  addDays: (v, n, scope) => shiftDate(v, amountArg(n, scope), "days"),
  addMonths: (v, n, scope) => shiftDate(v, amountArg(n, scope), "months"),
  addYears: (v, n, scope) => shiftDate(v, amountArg(n, scope), "years"),
  // The same, the other way — {{today | subDays:30}} reads as what it means.
  subDays: (v, n, scope) => shiftDate(v, -Number(amountArg(n, scope)), "days"),
  subMonths: (v, n, scope) => shiftDate(v, -Number(amountArg(n, scope)), "months"),
  subYears: (v, n, scope) => shiftDate(v, -Number(amountArg(n, scope)), "years"),
  /**
   * Whole days / months / years from the other date to this one:
   * {{values.ToDate | diffDays:values.FromDate}}. The other date is a field,
   * `today` (also what an empty one means), or a date typed in quotes.
   */
  diffDays: (v, other, scope) => dateDiff(v, otherDate(other, scope), "days"),
  diffMonths: (v, other, scope) => dateDiff(v, otherDate(other, scope), "months"),
  diffYears: (v, other, scope) => dateDiff(v, otherDate(other, scope), "years"),
  startOfMonth: (v) => edgeOf(v, "startOf", "month"),
  endOfMonth: (v) => edgeOf(v, "endOf", "month"),
  startOfYear: (v) => edgeOf(v, "startOf", "year"),
  endOfYear: (v) => edgeOf(v, "endOf", "year"),
  /**
   * Empty means "not filled in", so the endpoint gets the page's own default.
   *
   * The fallback is normally a literal ("0", "ALL"), but a record's OTHER
   * field is just as common — "the visit date, or the registration date when
   * there has never been a visit" — so a fallback that reads as a path and
   * finds something in the same scope is that value. `'ALL'` in quotes is
   * always the literal, for the field name that would otherwise be shadowed.
   */
  default: (v, alt, scope) => {
    if (!(v === "" || v === null || v === undefined || v === false)) return v;
    if (typeof alt !== "string") return alt;
    const quoted = /^(['"])(.*)\1$/.exec(alt);
    if (quoted) return quoted[2];
    if (!PATH_LIKE.test(alt)) return alt;
    const hit = getPath(scope, alt);
    return hit === undefined || hit === null || hit === "" ? alt : hit;
  },
  number: (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  },
  /** true/false -> 1/0, which is what the HIS endpoints take for a flag. */
  bit: (v) => (v === true || v === 1 || v === "1" || v === "true" ? 1 : 0),
  upper: (v) => String(v ?? "").toUpperCase(),
  lower: (v) => String(v ?? "").toLowerCase(),
  trim: (v) => String(v ?? "").trim(),
  /**
   * A list of records -> a list of one field out of each.
   *
   *   {{grid.n_x.checkedBy.Selected | pluck:TransactionID}}
   *
   * The endpoints that take "the ids of what the user ticked" are common
   * enough that without this every one of them needs a hand-written script.
   */
  pluck: (v, field) =>
    Array.isArray(v) ? v.map((r) => getPath(r, field)).filter((x) => x !== undefined && x !== null) : v,
  /**
   * A list of records -> records of another shape.
   *
   *   {{grid.n_x.checkedBy.Selected | mapTo:tid=TransactionID,isBillClose='1'}}
   *
   * A right-hand side in quotes is a literal; anything else names a field of
   * the record. Quoting is required rather than inferred, because "this row
   * happens to have no such field, so it must be a constant" is a rule that
   * works until the day a payload arrives with that field in it.
   */
  mapTo: (v, spec) => {
    if (!Array.isArray(v) || !spec) return v;
    const pairs = String(spec)
      .split(",")
      .map((s) => {
        const at = s.indexOf("=");
        return at === -1 ? null : [s.slice(0, at).trim(), s.slice(at + 1).trim()];
      })
      .filter(Boolean);
    const literal = (s) => /^(['"]).*\1$/.test(s);
    return v.map((r) => {
      const out = {};
      pairs.forEach(([key, from]) => {
        out[key] = literal(from) ? from.slice(1, -1) : getPath(r, from);
      });
      return out;
    });
  },
  /**
   * A list as one piece of text: {{values.DoctorIDs | join}} is "1,3", and
   * {{values.DoctorIDs | join:#}} is "1#3" for an endpoint that splits on
   * something else. Anything that is not a list is left alone.
   */
  join: (v, sep) => (Array.isArray(v) ? v.join(sep === undefined || sep === "" ? "," : sep) : v),
  /** Every entry as a string — several receipt endpoints reject numeric ids. */
  strings: (v) => (Array.isArray(v) ? v.map((x) => String(x ?? "")) : String(v ?? "")),
  /**
   * How many.
   *
   * A heading that counts what the user can see — "(Total Bill : 20)" — needs
   * the length of a list, and every list a grid publishes (`rows`, `pageRows`,
   * `checked`, `checkedBy.<col>`) is reachable but was only usable whole. With
   * this, the count of the page on screen and the count of the whole result are
   * both one binding.
   */
  count: (v) => (Array.isArray(v) ? v.length : v === null || v === undefined || v === "" ? 0 : 1),
  /** `{{row.A / row.B * 100 | round:1}}` — a number to that many places. */
  round: (v, places) => {
    const n = Number(v);
    if (v === "" || v === null || v === undefined || Number.isNaN(n)) return v;
    const f = 10 ** (Number(places) || 0);
    return Math.round(n * f) / f;
  },
  /** `| fixed:2` — always that many places, as text: 36.50. */
  fixed: (v, places) => {
    const n = Number(v);
    if (v === "" || v === null || v === undefined || Number.isNaN(n)) return v;
    return n.toFixed(places === undefined ? 2 : Number(places) || 0);
  },
  /**
   * A list of records -> one number.
   *
   *   {{grid.n_bills.rows | sum:NetAmount}}
   *   {{grid.n_bills.rows | where:SettlementType=Refund | sum:PaidAmount}}
   *
   * Every billing screen carries a strip of totals — bill, paid, pending, and
   * the same three again for refunds. A list could be counted but not added
   * up, so each tile took a Run custom JS step that read the response and
   * wrote a variable. With this the tile is a binding, and it follows the
   * rows: filter the table and the total filters with it.
   *
   * With no field named, the entries themselves are added — which is what a
   * list that has been through `pluck` holds.
   */
  sum: (v, field) => numbersOf(v, field).reduce((a, b) => a + b, 0),
  /** The mean of the same list; an empty list averages to 0, not NaN. */
  avg: (v, field) => {
    const nums = numbersOf(v, field);
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  },
  /** The smallest / largest. Empty comes back as "" so a tile reads blank. */
  min: (v, field) => {
    const nums = numbersOf(v, field);
    return nums.length ? Math.min(...nums) : "";
  },
  max: (v, field) => {
    const nums = numbersOf(v, field);
    return nums.length ? Math.max(...nums) : "";
  },
  /**
   * Part of a list: `| where:PatientType=OPD`, `| where:IsEmergency` for the
   * ones that have it set, and `>`/`<`/`>=`/`<=`/`!=` for the rest.
   *
   * The value is a literal, unless it names something in scope —
   * `where:PatientID=selected.n_pat.PatientID` keeps the bills of the patient
   * on screen. Quote it (`where:Panel='CASH'`) to force the literal.
   *
   * It filters what a binding shows, so it also answers "hide the rows this
   * role may not settle" without a script.
   */
  where: (v, spec, scope) => whereRows(v, spec, scope, true),
  /** The rest of the same list. */
  whereNot: (v, spec, scope) => whereRows(v, spec, scope, false),
};

/* ----------------------------------------------------------- aggregates */

/**
 * The numbers in a list: one field out of each record, or the entries
 * themselves when no field is named (a list that has already been plucked).
 *
 * Amounts arrive from the endpoints as text as often as not, and "12,450.00"
 * is a number everywhere except to Number(), so the separators go first.
 */
function numbersOf(list, field) {
  const arr = Array.isArray(list) ? list : list === undefined || list === null || list === "" ? [] : [list];
  return arr
    .map((r) => (field ? getPath(r, field) : r))
    .map((x) => numberish(x))
    .filter((n) => Number.isFinite(n));
}

/** "12,450.00" is a number to everyone but Number(); "" and null are not. */
function numberish(v) {
  if (v === "" || v === null || v === undefined) return NaN;
  return typeof v === "string" ? Number(v.replace(/,/g, "").trim()) : Number(v);
}

/** Longest first, so ">=" is never read as ">" followed by rubbish. */
const WHERE_OPS = [">=", "<=", "!=", "="];

/** Empty, zero and "false" are all "not set" — what a flag column holds. */
const truthyValue = (v) =>
  !(v === undefined || v === null || v === "" || v === 0 || v === "0" || v === false || v === "false");

/**
 * The right-hand side of a `where:`.
 *
 * Quoted is always the literal; anything else is tried as a path first, so a
 * filter can compare a row against what the screen holds —
 * `where:PatientID={{...}}` is not needed, `where:PatientID=values.PatientID`
 * says it. A path that resolves to nothing is the literal text, which is what
 * `where:PatientType=PHY` relies on.
 */
function whereArg(raw, scope) {
  const text = String(raw ?? "").trim();
  const quote = text.slice(0, 1);
  if (text.length > 1 && (quote === "'" || quote === '"') && text.slice(-1) === quote) return text.slice(1, -1);
  const found = getPath(scope, text);
  return found === undefined ? text : found;
}

/** A number against a number, otherwise text against text, ignoring case. */
function whereCompare(a, op, b) {
  const na = numberish(a);
  const nb = numberish(b);
  const numeric = Number.isFinite(na) && Number.isFinite(nb);
  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  switch (op) {
    case "!=":
      return numeric ? na !== nb : sa !== sb;
    case ">":
      return numeric ? na > nb : sa > sb;
    case "<":
      return numeric ? na < nb : sa < sb;
    case ">=":
      return numeric ? na >= nb : sa >= sb;
    case "<=":
      return numeric ? na <= nb : sa <= sb;
    default:
      return numeric ? na === nb : sa === sb;
  }
}

/**
 * The records of a list that match one test — `Field=Value`, or a bare
 * `Field` for "whatever has it set".
 */
function whereRows(list, spec, scope, keep) {
  if (!Array.isArray(list) || !spec) return list;
  const text = String(spec);
  let at = -1;
  let op = "";
  for (let i = 0; i < text.length && at === -1; i += 1) {
    const two = text.slice(i, i + 2);
    if (WHERE_OPS.includes(two)) {
      at = i;
      op = two;
    } else if (text[i] === "=" || text[i] === ">" || text[i] === "<") {
      at = i;
      op = text[i];
    }
  }
  const field = (at === -1 ? text : text.slice(0, at)).trim();
  const want = at === -1 ? null : whereArg(text.slice(at + op.length), scope);
  return list.filter((r) => {
    const cell = getPath(r, field);
    const hit = at === -1 ? truthyValue(cell) : whereCompare(cell, op, want);
    return keep ? hit : !hit;
  });
}

/* ------------------------------------------------------------ arithmetic */

/*
 * Maths inside the braces: `{{row.TotalCapacity - row.Occupied}}`,
 * `{{round(row.Occupied / row.TotalCapacity * 100, 1)}}`.
 *
 * A KPI's "available" is total minus occupied, its trend a percentage of two
 * fields — without this each one needs its own endpoint column. It is a
 * parser, not eval: numbers, paths, + - * / % and brackets, and a handful of
 * functions. Anything else is not maths, and the token resolves as it always
 * did.
 */
const MATH_FNS = {
  round: (x, places = 0) => {
    const f = 10 ** (Number(places) || 0);
    return Math.round(x * f) / f;
  },
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
};

/** What marks a token as a sum rather than a path. */
const MATH_HINT = /[-+*/%()]/;

function mathTokens(src) {
  const out = [];
  const re = /\s*(?:(\d+(?:\.\d+)?|\.\d+)|([A-Za-z_$@][\w$@]*(?:\.[\w$@]+|\[\d+\])*)|([-+*/%(),]))/y;
  let i = 0;
  while (i < src.length) {
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) return /^\s*$/.test(src.slice(i)) ? out : null;
    if (m[1] !== undefined) out.push({ t: "num", v: Number(m[1]) });
    else if (m[2] !== undefined) out.push({ t: "id", v: m[2] });
    else out.push({ t: "op", v: m[3] });
    i = re.lastIndex;
  }
  return out;
}

/**
 * The value of an arithmetic token, or undefined when it is not one.
 *
 * A field that is empty or null counts as 0; a field that does not exist yet
 * (the data has not arrived) makes the whole answer "" rather than a number
 * that looks real. So does dividing by zero.
 */
export function evalMath(src, scope) {
  const toks = mathTokens(String(src || ""));
  if (!toks || !toks.length) return undefined;
  let p = 0;
  let missing = false;
  const take = (v) => {
    const tk = toks[p];
    if (tk && tk.t === "op" && tk.v === v) {
      p += 1;
      return true;
    }
    return false;
  };
  const num = (v) => {
    if (v === undefined) {
      missing = true;
      return 0;
    }
    if (v === null || v === "") return 0;
    if (typeof v === "boolean") return v ? 1 : 0;
    return Number(typeof v === "string" ? v.replace(/,/g, "").trim() : v);
  };
  const fail = () => {
    throw new Error("not maths");
  };
  let expr;
  const primary = () => {
    const tk = toks[p];
    if (!tk) fail();
    if (tk.t === "num") {
      p += 1;
      return tk.v;
    }
    if (tk.t === "op" && tk.v === "(") {
      p += 1;
      const v = expr();
      if (!take(")")) fail();
      return v;
    }
    if (tk.t === "id") {
      p += 1;
      if (take("(")) {
        const fn = MATH_FNS[tk.v];
        if (!fn) fail();
        const args = [];
        if (!take(")")) {
          do {
            args.push(expr());
          } while (take(","));
          if (!take(")")) fail();
        }
        return fn(...args);
      }
      return num(getPath(scope, tk.v));
    }
    return fail();
  };
  const unary = () => {
    if (take("-")) return -unary();
    if (take("+")) return unary();
    return primary();
  };
  const term = () => {
    let v = unary();
    for (;;) {
      if (take("*")) v *= unary();
      else if (take("/")) v /= unary();
      else if (take("%")) v %= unary();
      else return v;
    }
  };
  expr = () => {
    let v = term();
    for (;;) {
      if (take("+")) v += term();
      else if (take("-")) v -= term();
      else return v;
    }
  };
  try {
    const v = expr();
    if (p !== toks.length) return undefined;
    if (missing || !Number.isFinite(v)) return "";
    // 0.1 + 0.2 is 0.30000000000000004; nobody wants to see that on a card.
    return Math.round(v * 1e10) / 1e10;
  } catch (e) {
    return undefined;
  }
}

/**
 * Do the conditions hold? One condition or a list of them, all of which must
 * pass; nothing at all passes. The same shape the actions' "Run only when"
 * stores, so a column's "Disabled when" is written and read the same way.
 */
export function conditionsHold(when, scope) {
  const tests = Array.isArray(when) ? when : when ? [when] : [];
  const live = tests.filter((c) => c && c.op);
  if (!live.length) return false;
  return whenPasses(live, scope);
}

/**
 * A list of conditions, each joined to the one before it by `join` — "and"
 * (the default, so every list saved before OR existed reads the same) or
 * "or". AND binds tighter than OR, as in SQL: `a AND b OR c` is `(a AND b)
 * OR c`. So the list splits at each "or" into groups, and it holds when any
 * group holds in full. An empty list holds — "no condition" means always.
 */
export function whenPasses(when, scope) {
  const tests = (Array.isArray(when) ? when : when ? [when] : []).filter((c) => c && c.op);
  if (!tests.length) return true;
  const groups = [[]];
  tests.forEach((c, i) => {
    if (i > 0 && c.join === "or") groups.push([]);
    groups[groups.length - 1].push(c);
  });
  return groups.some((g) => g.every((c) => evalCondition(c, scope)));
}

/**
 * The records a typed search keeps.
 *
 * `keys` names the fields to look in; empty looks in every field the record
 * holds. Each word is matched on its own, so "gw 12" finds the record whose
 * room is GW1 AND whose bed is 12 — a phrase no single field contains.
 * Records (a nested object) are skipped: they read as "[object Object]" and
 * match everything.
 */
export function searchRows(rows, query, keys = []) {
  const terms = String(query ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) return rows || [];
  const fields = (keys || []).filter((k) => typeof k === "string" && k.trim());
  return (rows || []).filter((r) => {
    const hay = (fields.length ? fields.map((k) => getPath(r, k)) : Object.values(r || {}))
      .filter((v) => v !== null && v !== undefined && typeof v !== "object")
      .map((v) => String(v).toLowerCase());
    return terms.every((t) => hay.some((v) => v.includes(t)));
  });
}

/* ------------------------------------------------------------- expressions */
/**
 * `{{= …}}` — one expression, evaluated against the scope.
 *
 * A payload key is often not a field but a small decision about fields: the
 * amount minus the discount, a name or "Not given", 1 when a box is ticked.
 * Written as templates that was three actions and a variable, or it was not
 * written at all — so the box takes an expression, and the language is the one
 * everybody already knows.
 *
 *   {{= values.gross - values.discount }}
 *   {{= values.name || "Not given" }}
 *   {{= values.isEmergency ? 1 : 0 }}
 *   {{= round(values.amount * 0.18, 2) }}
 *
 * Parsed and walked here, never `eval`: a screen document is data that travels
 * from a designer's browser to everybody else's, and data that can execute is
 * a way in. Only what the grammar below allows runs — paths, literals,
 * operators, and the named functions.
 *
 * Arithmetic reads the hospital's text numbers as numbers ("2,000.50" is a
 * number, "UH-1" is not), so `+` adds where both sides are numeric and joins
 * text otherwise, which is what JavaScript does and what the box looks like it
 * should do.
 */
const EXPR_FNS = {
  ...MATH_FNS,
  len: (v) => (v === null || v === undefined ? 0 : Array.isArray(v) || typeof v === "string" ? v.length : Object.keys(v).length),
  num: (v) => exprNumber(v) ?? 0,
  str: (v) => (v === null || v === undefined ? "" : String(v)),
  int: (v) => Math.trunc(exprNumber(v) ?? 0),
  lower: (v) => String(v ?? "").toLowerCase(),
  upper: (v) => String(v ?? "").toUpperCase(),
  trim: (v) => String(v ?? "").trim(),
  join: (list, sep = ",") => (Array.isArray(list) ? list.join(sep) : list === undefined || list === null ? "" : String(list)),
  coalesce: (...args) => args.find((v) => v !== undefined && v !== null && v !== "") ?? "",
  contains: (hay, needle) =>
    Array.isArray(hay) ? hay.some((v) => String(v) === String(needle)) : String(hay ?? "").includes(String(needle ?? "")),
  // Dates. `today()` is today; any date argument may also be the word "today".
  today: () => moment().format("YYYY-MM-DD"),
  addDays: (d, n) => shiftDate(d, n, "days"),
  addMonths: (d, n) => shiftDate(d, n, "months"),
  addYears: (d, n) => shiftDate(d, n, "years"),
  subDays: (d, n) => shiftDate(d, -Number(n), "days"),
  subMonths: (d, n) => shiftDate(d, -Number(n), "months"),
  subYears: (d, n) => shiftDate(d, -Number(n), "years"),
  diffDays: (a, b) => dateDiff(a, b, "days"),
  diffMonths: (a, b) => dateDiff(a, b, "months"),
  diffYears: (a, b) => dateDiff(a, b, "years"),
  before: (a, b) => {
    const ma = asMoment(a);
    const mb = asMoment(b === undefined ? "today" : b);
    return !!(ma && mb && ma.isBefore(mb, "day"));
  },
  after: (a, b) => {
    const ma = asMoment(a);
    const mb = asMoment(b === undefined ? "today" : b);
    return !!(ma && mb && ma.isAfter(mb, "day"));
  },
  sameDate: (a, b) => {
    const ma = asMoment(a);
    const mb = asMoment(b === undefined ? "today" : b);
    return !!(ma && mb && ma.isSame(mb, "day"));
  },
  formatDate: (d, fmt = "DD-MMM-YYYY") => {
    const m = asMoment(d);
    return m ? m.format(fmt) : "";
  },
  startOfMonth: (d) => edgeOf(d, "startOf", "month"),
  endOfMonth: (d) => edgeOf(d, "endOf", "month"),
};

/** A value as a number, or undefined when it is not one. "1,200.50" counts. */
function exprNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v !== "string") return undefined;
  const t = v.replace(/,/g, "").trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** One word, no dots or brackets — what `bareText` may read as text. */
const BARE_WORD = /^[A-Za-z_$@][\w$@]*$/;

/**
 * What marks a token without the `=` as a comparison or a choice rather than a
 * path: `{{selected.x.PolicyNo == ABC ? 1 : 0}}`. Sums keep to `evalMath`.
 */
const EXPR_HINT = /\?|[=!]=|&&|\|\||[<>]/;

const EXPR_PUNCT = ["===", "!==", "==", "!=", "<=", ">=", "&&", "||", "?", ":", "<", ">", "+", "-", "*", "/", "%", "!", "(", ")", ","];

function exprTokens(src) {
  const out = [];
  let i = 0;
  const isIdStart = (c) => /[A-Za-z_$@]/.test(c);
  const isIdPart = (c) => /[\w$@.[\]]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i += 1;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      let text = "";
      while (j < src.length && src[j] !== c) {
        // A backslash escapes the next character, so a quote can be written.
        text += src[j] === "\\" && j + 1 < src.length ? src[(j += 1)] : src[j];
        j += 1;
      }
      out.push({ t: "str", v: text });
      i = j + 1;
    } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1;
      out.push({ t: "num", v: Number(src.slice(i, j)) });
      i = j;
    } else if (isIdStart(c)) {
      let j = i;
      while (j < src.length && isIdPart(src[j])) j += 1;
      out.push({ t: "id", v: src.slice(i, j) });
      i = j;
    } else {
      const hit = EXPR_PUNCT.find((op) => src.startsWith(op, i));
      if (!hit) return null;
      out.push({ t: "op", v: hit });
      i += hit.length;
    }
  }
  return out;
}

/**
 * @param opts.bareText  a single word that names nothing in the scope is that
 *                       word as text — `PolicyNo == ABC` compares against
 *                       "ABC", the way `where:PatientType=PHY` does. A dotted
 *                       path that resolves to nothing stays nothing.
 */
export function evalExpression(src, scope, opts) {
  const bareText = !!opts?.bareText;
  const toks = exprTokens(String(src || ""));
  if (!toks || !toks.length) return undefined;
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v) => toks[p] && toks[p].t === "op" && toks[p].v === v;
  const take = (v) => {
    if (!isOp(v)) return false;
    p += 1;
    return true;
  };
  const fail = () => {
    throw new Error("not an expression");
  };

  // Both sides as numbers when both ARE numbers: "2" + "3" is 5 here, because
  // the boxes hold text and the endpoint wants the sum.
  const pair = (a, b) => {
    const x = exprNumber(a);
    const y = exprNumber(b);
    return x === undefined || y === undefined ? null : [x, y];
  };

  let ternary;

  const primary = () => {
    const tk = peek();
    if (!tk) fail();
    if (tk.t === "num" || tk.t === "str") {
      p += 1;
      return tk.v;
    }
    if (take("(")) {
      const v = ternary();
      if (!take(")")) fail();
      return v;
    }
    if (tk.t === "id") {
      p += 1;
      if (tk.v === "true") return true;
      if (tk.v === "false") return false;
      if (tk.v === "null") return null;
      if (isOp("(")) {
        p += 1;
        const fn = EXPR_FNS[tk.v];
        const args = [];
        if (!take(")")) {
          do {
            args.push(ternary());
          } while (take(","));
          if (!take(")")) fail();
        }
        if (!fn) fail();
        return fn(...args);
      }
      const found = getPath(scope, tk.v);
      if (found === undefined && bareText && BARE_WORD.test(tk.v)) return tk.v;
      return found;
    }
    return fail();
  };

  const unary = () => {
    if (take("!")) return !unary();
    if (take("-")) return -(exprNumber(unary()) ?? 0);
    if (take("+")) return exprNumber(unary()) ?? 0;
    return primary();
  };

  const mul = () => {
    let v = unary();
    for (;;) {
      if (take("*")) v = (exprNumber(v) ?? 0) * (exprNumber(unary()) ?? 0);
      else if (take("/")) v = (exprNumber(v) ?? 0) / (exprNumber(unary()) ?? 0);
      else if (take("%")) v = (exprNumber(v) ?? 0) % (exprNumber(unary()) ?? 0);
      else return v;
    }
  };

  const add = () => {
    let v = mul();
    for (;;) {
      if (take("+")) {
        const r = mul();
        const both = pair(v, r);
        // Numbers add, anything else joins — and an absent field joins as
        // nothing rather than as "undefined".
        v = both ? both[0] + both[1] : `${v ?? ""}${r ?? ""}`;
      } else if (take("-")) {
        v = (exprNumber(v) ?? 0) - (exprNumber(mul()) ?? 0);
      } else {
        return v;
      }
    }
  };

  const compare = () => {
    let v = add();
    for (;;) {
      const op = isOp("<") ? "<" : isOp("<=") ? "<=" : isOp(">") ? ">" : isOp(">=") ? ">=" : "";
      if (!op) return v;
      p += 1;
      const r = add();
      const both = pair(v, r);
      const [a, b] = both || [String(v ?? ""), String(r ?? "")];
      v = op === "<" ? a < b : op === "<=" ? a <= b : op === ">" ? a > b : a >= b;
    }
  };

  const equality = () => {
    let v = compare();
    for (;;) {
      const op = isOp("===") ? "===" : isOp("!==") ? "!==" : isOp("==") ? "==" : isOp("!=") ? "!=" : "";
      if (!op) return v;
      p += 1;
      const r = compare();
      // `===` is exact; `==` is the forgiving one an id sent as text needs
      // ("12" == 12), which is the comparison a screen nearly always means.
      const strict = op === "===" || op === "!==";
      const both = strict ? null : pair(v, r);
      const same = strict ? v === r : both ? both[0] === both[1] : String(v ?? "") === String(r ?? "");
      v = op === "===" || op === "==" ? same : !same;
    }
  };

  const and = () => {
    let v = equality();
    while (take("&&")) {
      const r = equality();
      v = v ? r : v;
    }
    return v;
  };

  const or = () => {
    let v = and();
    while (take("||")) {
      const r = and();
      // Empty text counts as nothing here: `{{= values.name || "Not given" }}`
      // is written for a box the user left alone, and "" is what that box
      // holds.
      v = v === undefined || v === null || v === "" || v === false ? r : v;
    }
    return v;
  };

  ternary = () => {
    const cond = or();
    if (!take("?")) return cond;
    const yes = ternary();
    if (!take(":")) fail();
    const no = ternary();
    return cond === undefined || cond === null || cond === "" || cond === false || cond === 0 ? no : yes;
  };

  try {
    const v = ternary();
    if (p !== toks.length) return undefined;
    return typeof v === "number" && Number.isFinite(v) ? Math.round(v * 1e10) / 1e10 : v;
  } catch (e) {
    return undefined;
  }
}

/**
 * Split a token into its head and its filters on `|`, leaving `||` alone.
 *
 * `{{= a || b | fixed:2}}` has one filter and one or-operator, and telling
 * them apart is the whole job: a plain split on "|" turned the expression into
 * three filters named "", "b " and "fixed".
 */
function splitToken(token) {
  const src = String(token);
  const out = [];
  let buf = "";
  let quote = "";
  let depth = 0;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quote) {
      buf += c;
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
    } else if (c === "(" || c === "[") {
      depth += 1;
      buf += c;
    } else if (c === ")" || c === "]") {
      depth -= 1;
      buf += c;
    } else if (c === "|" && src[i + 1] === "|") {
      buf += "||";
      i += 1;
    } else if (c === "|" && depth === 0) {
      out.push(buf);
      buf = "";
    } else {
      buf += c;
    }
  }
  out.push(buf);
  return out;
}

/** `values.fromDate | date:DD-MMM-YYYY` -> the formatted value. */
function resolveToken(token, scope) {
  const parts = splitToken(token);
  const head = parts[0].trim();
  // `{{= …}}`: the head is an expression, not a path.
  let value = head.startsWith("=") ? evalExpression(head.slice(1), scope) : getPath(scope, head);
  // Not a field — maybe a sum. A real field whose name has a dash in it is
  // found above first, so nothing that resolved before resolves differently.
  if (value === undefined && !head.startsWith("=") && MATH_HINT.test(head)) {
    const sum = evalMath(head, scope);
    if (sum !== undefined) value = sum;
  }
  // Not a path or a sum — maybe a comparison or a choice written without the
  // `=`. Same rule: a real field is found first, so nothing changes for it.
  if (value === undefined && !head.startsWith("=") && EXPR_HINT.test(head)) {
    const res = evalExpression(head, scope, { bareText: true });
    if (res !== undefined) value = res;
  }
  for (let i = 1; i < parts.length; i += 1) {
    const spec = parts[i].trim();
    const at = spec.indexOf(":");
    const name = (at === -1 ? spec : spec.slice(0, at)).trim();
    const arg = at === -1 ? undefined : spec.slice(at + 1).trim();
    const fn = FILTERS[name];
    // The scope goes with it: `default:` resolves a fallback that names
    // another field of the same record.
    if (fn) value = fn(value, arg, scope);
  }
  return value;
}

// A number an endpoint sent as text ("86.7934"). Not "00123": leading zeros
// mean an id, and an id is not rounded.
const NUMERIC_TEXT = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

/**
 * Resolve `{{path}}` inside a string against a scope.
 * A string that is exactly one template returns the raw value (keeps numbers,
 * arrays and objects intact instead of stringifying them).
 *
 * @param opts.formatNumber  applied to every template result that is a number
 *                           (or numeric text) — a KPI's "Trend decimal places".
 *                           The text around the templates is never touched.
 */
export function interpolate(str, scope, opts) {
  if (typeof str !== "string" || !hasTemplate(str)) return str;
  // A JS value answers with whatever its code returns — a list stays a list.
  if (isJsValue(str)) {
    const v = runJsValue(jsCodeOf(str), scope || {});
    return v === undefined || v === null ? "" : v;
  }
  const fmtNum = opts?.formatNumber;
  // A token piped through a filter (`| fixed:2`) is already shaped the way it
  // was asked for; the formatter would undo it.
  const fmt = (v, token) => {
    if (!fmtNum || token.includes("|")) return v;
    if (typeof v === "number" && Number.isFinite(v)) return fmtNum(v);
    if (typeof v === "string" && NUMERIC_TEXT.test(v.trim())) return fmtNum(Number(v));
    return v;
  };
  const only = str.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
  if (only) {
    const v = fmt(resolveToken(only[1], scope), only[1]);
    return v === undefined ? "" : v;
  }
  return str.replace(TEMPLATE, (_, path) => {
    const v = fmt(resolveToken(path.trim(), scope), path);
    if (v === undefined || v === null) return "";
    // `opts.json`: the text being built is JSON, so a list or a record has to
    // go in as JSON. `String(v)` on an array of records is
    // "[object Object],[object Object]" — which is not a value, it is a parse
    // error, and the action that was going to post it sends {} instead. Only
    // non-primitives change: everything else still substitutes as its own text,
    // so a quoted "{{values.name}}" is untouched.
    if (opts?.json && typeof v === "object") return JSON.stringify(v);
    return String(v);
  });
}

/**
 * Prop keys whose contents are an action chain, not display data.
 *
 * A chain is resolved when it RUNS, against a scope that has the clicked row
 * and the previous step's response in it. Interpolating it at render time —
 * when neither exists — does not defer the templates, it destroys them:
 * `{{row.TransactionID}}` becomes "" and the action posts an empty id. That is
 * exactly what a row action on a grid did, silently, on every screen.
 *
 * Only the chain subtree is skipped. A column's header, a tile's title and
 * every other string beside it still interpolate as before, so nothing that
 * was resolving stops resolving.
 */
// `addAction` is a Select + Add's Open modal action: its save chain posts
// {{modal.name}}, which only exists once somebody has typed into the dialog.
//
// `valueTemplate`, `disabledWhen`, `insteadRules` and `tickWhen` are a
// column's, and all four are about the ROW: resolved here they would be
// answered against a screen that has no row, so "the visit date, or the
// registration date" would come out as the words "row.RegistrationDate" in
// every cell, and "the same patient as the first ticked one" would compare
// every row against nothing. They are resolved per row instead.
const DEFERRED_KEYS = new Set([
  "actions",
  "onClick",
  "addAction",
  "valueTemplate",
  "disabledWhen",
  "insteadRules",
  "tickWhen",
]);

/**
 * Deeply interpolate every string inside an object/array.
 *
 * Returns the ORIGINAL reference when nothing contained a template. Props are
 * interpolated on every render, so preserving identity is what keeps big
 * values (table column configs, action lists) from invalidating the memos
 * inside the components that receive them.
 */
export function interpolateDeep(value, scope, skip = null) {
  if (typeof value === "string") return interpolate(value, scope);
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((v) => {
      const next = interpolateDeep(v, scope, skip);
      if (next !== v) changed = true;
      return next;
    });
    return changed ? out : value;
  }
  if (value && typeof value === "object") {
    let changed = false;
    const out = {};
    Object.keys(value).forEach((k) => {
      if (skip && skip.has(k)) {
        out[k] = value[k];
        return;
      }
      const next = interpolateDeep(value[k], scope, skip);
      if (next !== value[k]) changed = true;
      out[k] = next;
    });
    return changed ? out : value;
  }
  return value;
}

/** What a component's props must NOT have interpolated out of them. */
export const DEFERRED_PROP_KEYS = DEFERRED_KEYS;

const norm = (v) => (v === null || v === undefined ? "" : v);
const asNum = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

/** Evaluate a single `{ field, op, value }` condition against a scope. */
export function evalCondition(cond, scope) {
  if (!cond || !cond.op) return true;
  const left = cond.field ? getPath(scope, cond.field) : undefined;
  const right = typeof cond.value === "string" ? interpolate(cond.value, scope) : cond.value;
  const ls = String(norm(left)).toLowerCase();
  const rs = String(norm(right)).toLowerCase();
  // Two dates compare as dates, by day, whatever format each arrived in —
  // parseFloat read "2026-09-28" as 2026. The value may be the word `today`.
  if (["eq", "ne", "gt", "gte", "lt", "lte"].includes(cond.op)) {
    const lm = asMoment(left);
    const rm = asMoment(right);
    if (lm && rm) {
      const d = lm.clone().startOf("day").diff(rm.clone().startOf("day"), "days");
      return { eq: d === 0, ne: d !== 0, gt: d > 0, gte: d >= 0, lt: d < 0, lte: d <= 0 }[cond.op];
    }
  }
  switch (cond.op) {
    case "eq":
      return ls === rs;
    case "ne":
      return ls !== rs;
    case "gt":
      return (asNum(left) ?? -Infinity) > (asNum(right) ?? Infinity);
    case "gte":
      return (asNum(left) ?? -Infinity) >= (asNum(right) ?? Infinity);
    case "lt":
      return (asNum(left) ?? Infinity) < (asNum(right) ?? -Infinity);
    case "lte":
      return (asNum(left) ?? Infinity) <= (asNum(right) ?? -Infinity);
    case "contains":
      return ls.includes(rs);
    case "notContains":
      return !ls.includes(rs);
    case "startsWith":
      return ls.startsWith(rs);
    case "in":
      return String(rs)
        .split(",")
        .map((s) => s.trim())
        .includes(ls);
    case "notIn":
      return !String(rs)
        .split(",")
        .map((s) => s.trim())
        .includes(ls);
    case "empty":
      return norm(left) === "" || (Array.isArray(left) && left.length === 0);
    case "notEmpty":
      return !(norm(left) === "" || (Array.isArray(left) && left.length === 0));
    default:
      return true;
  }
}

/**
 * Apply a node's visibility rules. Returns the resolved UI state for the node.
 * Rules are evaluated in order; the last matching rule of each kind wins.
 */
export function evalVisibility(rules, scope) {
  const state = { visible: true, enabled: true, required: false };
  (rules || []).forEach((rule) => {
    if (!rule || !rule.when) return;
    const hit = evalCondition(rule.when, scope);
    if (!hit) return;
    switch (rule.effect) {
      case "hide":
        state.visible = false;
        break;
      case "show":
        state.visible = true;
        break;
      case "disable":
        state.enabled = false;
        break;
      case "enable":
        state.enabled = true;
        break;
      case "require":
        state.required = true;
        break;
      default:
        break;
    }
  });
  return state;
}

export const operatorLabel = (op) => (OPERATORS.find((o) => o.op === op) || {}).label || op;

/**
 * How a date and a money value are written in this product.
 *
 * Read defensively: this module is imported by tooling that runs in Node,
 * where `import.meta.env` does not exist, and a formatter that throws on
 * import would take the whole builder down with it.
 */
const env = (key, fallback) => {
  try {
    return import.meta.env?.[key] || fallback;
  } catch (e) {
    return fallback;
  }
};
const APP_DATE_FORMAT = env("VITE_DATE_FORMAT", "DD-MMM-YYYY");
const CURRENCY_SYMBOL = env("VITE_CURRENCY_SYMBOL", "₹");

/** What a date arriving from an endpoint might look like. */
const DATE_IN = [moment.ISO_8601, "YYYY-MM-DD", "DD-MMM-YYYY", "DD/MM/YYYY", "MM/DD/YYYY"];

/** Formatting helpers shared by the table / card / text components. */
export function formatValue(value, type, options = {}) {
  if (value === null || value === undefined || value === "") return options.placeholder ?? "";
  switch (type) {
    case "number": {
      const n = asNum(value);
      return n === null ? String(value) : n.toLocaleString(undefined, { maximumFractionDigits: options.decimals ?? 2 });
    }
    case "currency": {
      const n = asNum(value);
      if (n === null) return String(value);
      return `${options.symbol ?? CURRENCY_SYMBOL} ${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    case "date": {
      // The app's own format, not the browser's locale. A grid that shows
      // 5/20/2026 where every hand-coded page shows 20-May-2026 reads as a
      // different product, and the value is unusable next to the date pickers
      // that produced it. `options.format` lets one column disagree.
      const m = moment(String(value), DATE_IN, false);
      if (!m.isValid()) return String(value);
      return m.format(options.format || APP_DATE_FORMAT);
    }
    case "datetime": {
      const m = moment(String(value), DATE_IN, false);
      if (!m.isValid()) return String(value);
      return m.format(options.format || `${APP_DATE_FORMAT} hh:mm A`);
    }
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}
