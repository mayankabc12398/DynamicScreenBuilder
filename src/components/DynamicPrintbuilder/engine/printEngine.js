/**
 * Dynamic Print Builder — the template engine.
 *
 * ONE file turns a template (JSON) plus data (JSON) into printed pages. The
 * builder's preview runs it in an iframe; the API runs a byte-identical copy
 * (HospediaAPI/PrintBuilder/Engine/printEngine.js, written by sync-to-api.mjs)
 * inside headless Chrome and prints that page to PDF. Same code, same fonts,
 * same browser engine measuring the text — so the preview is the PDF.
 *
 * Rules for this file:
 *   - no imports, no globals except `window.PrintEngine`, `window.__PB_*` and
 *     the vendored `qrcode` (engine/vendor/qrcode.js, loaded beside it);
 *   - nothing here may throw out of a render: a bad expression prints #ERR and
 *     is reported in the result;
 *   - every coordinate in a template is millimetres, every font size points.
 *
 * Sections: utilities · expressions · formatting · barcode/QR · element HTML ·
 * band layout · pagination · document render · shell/boot · validation.
 */

export const ENGINE_VERSION = "1.3.0";

const PX_PER_MM = 96 / 25.4;
const EPS = 0.05;

/* ========================================================================== */
/*  utilities                                                                 */
/* ========================================================================== */

export const escapeHtml = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isNum = (v) => typeof v === "number" && isFinite(v);
const NUMERIC_RE = /^\s*[-+]?(\d{1,3}(,\d{2,3})+|\d+)?(\.\d+)?\s*$/;
const isNumericLike = (v) =>
  isNum(v) || (typeof v === "string" && v.trim() !== "" && NUMERIC_RE.test(v) && /\d/.test(v));

export function toNumber(v) {
  if (isNum(v)) return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const s = v.replace(/,/g, "").trim();
    if (s === "") return NaN;
    return Number(s);
  }
  return NaN;
}

const num = (v, d = 0) => {
  const n = toNumber(v);
  return isNaN(n) ? d : n;
};

export function truthy(v) {
  if (v == null) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return !(s === "" || s === "0" || s === "false" || s === "no" || s === "n");
  }
  if (Array.isArray(v)) return v.length > 0;
  return !!v;
}

const hexToRgb = (hex) => {
  const m = String(hex || "").trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const softColor = (hex, alpha) => {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})` : `rgba(15,118,110,${alpha})`;
};

const mm = (v) => `${Math.round(num(v) * 1000) / 1000}mm`;
const pxToMm = (px) => px / PX_PER_MM;

/* ========================================================================== */
/*  expressions                                                               */
/* ========================================================================== */
/*
 * A small, safe expression language — no eval, no property access outside the
 * data object, no prototype walking.
 *   literals   12  1.5  'text'  "text"  true  false  null
 *   paths      bill.PatientName   items[0].Rate   centre['CentreName']
 *   operators  + - * / %   == != < <= > >=   && || !  (and or not)   ?:   ??
 *   calls      sum(Amount)  if(c, a, b)  format(x, 'currency') …
 * Reading a key on a row ARRAY reads its first row, so a result set whose
 * header fields repeat on every item row reads naturally as `bill.PatientName`.
 */

const TOKEN_RE =
  /\s*(?:(\d+(?:\.\d+)?)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|([A-Za-z_$À-￿][\w$À-￿]*)|(\?\?|===|!==|==|!=|<=|>=|&&|\|\||[-+*/%<>!?:.,()[\]]))/y;

function tokenize(src) {
  const out = [];
  TOKEN_RE.lastIndex = 0;
  let pos = 0;
  const s = String(src);
  while (pos < s.length) {
    if (/^\s*$/.test(s.slice(pos))) break;
    TOKEN_RE.lastIndex = pos;
    const m = TOKEN_RE.exec(s);
    if (!m || m.index !== pos) throw new Error(`Unexpected character at ${pos + 1}: "${s.slice(pos).trim().slice(0, 12)}"`);
    pos = TOKEN_RE.lastIndex;
    if (m[1] !== undefined) out.push({ k: "num", v: Number(m[1]) });
    else if (m[2] !== undefined) {
      const body = m[2].slice(1, -1).replace(/\\(.)/g, (_, c) => (c === "n" ? "\n" : c === "t" ? "\t" : c));
      out.push({ k: "str", v: body });
    } else if (m[3] !== undefined) out.push({ k: "id", v: m[3] });
    else out.push({ k: "op", v: m[4] });
  }
  return out;
}

function parseTokens(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const isOp = (v) => tokens[i] && tokens[i].k === "op" && tokens[i].v === v;
  const isWord = (v) => tokens[i] && tokens[i].k === "id" && tokens[i].v.toLowerCase() === v;
  const expect = (v) => {
    if (!isOp(v)) throw new Error(`Expected "${v}"${tokens[i] ? ` but found "${tokens[i].v}"` : " at end"}`);
    i++;
  };

  const expr = () => ternary();
  const ternary = () => {
    const c = nullish();
    if (isOp("?")) {
      i++;
      const a = expr();
      expect(":");
      const b = expr();
      return { t: "cond", c, a, b };
    }
    return c;
  };
  const nullish = () => {
    let a = or();
    while (isOp("??")) {
      i++;
      a = { t: "bin", op: "??", a, b: or() };
    }
    return a;
  };
  const or = () => {
    let a = and();
    while (isOp("||") || isWord("or")) {
      i++;
      a = { t: "bin", op: "||", a, b: and() };
    }
    return a;
  };
  const and = () => {
    let a = equality();
    while (isOp("&&") || isWord("and")) {
      i++;
      a = { t: "bin", op: "&&", a, b: equality() };
    }
    return a;
  };
  const equality = () => {
    let a = comparison();
    while (isOp("==") || isOp("!=") || isOp("===") || isOp("!==")) {
      const op = tokens[i++].v.slice(0, 2);
      a = { t: "bin", op, a, b: comparison() };
    }
    return a;
  };
  const comparison = () => {
    let a = additive();
    while (isOp("<") || isOp("<=") || isOp(">") || isOp(">=")) {
      const op = tokens[i++].v;
      a = { t: "bin", op, a, b: additive() };
    }
    return a;
  };
  const additive = () => {
    let a = mult();
    while (isOp("+") || isOp("-")) {
      const op = tokens[i++].v;
      a = { t: "bin", op, a, b: mult() };
    }
    return a;
  };
  const mult = () => {
    let a = unary();
    while (isOp("*") || isOp("/") || isOp("%")) {
      const op = tokens[i++].v;
      a = { t: "bin", op, a, b: unary() };
    }
    return a;
  };
  const unary = () => {
    if (isOp("!") || isWord("not")) {
      i++;
      return { t: "un", op: "!", a: unary() };
    }
    if (isOp("-") || isOp("+")) {
      const op = tokens[i++].v;
      return { t: "un", op, a: unary() };
    }
    return postfix();
  };
  const postfix = () => {
    let node = primary();
    for (;;) {
      if (isOp(".")) {
        i++;
        const t = peek();
        if (!t || t.k !== "id") throw new Error('Expected a field name after "."');
        i++;
        node = { t: "mem", o: node, k: t.v };
      } else if (isOp("[")) {
        i++;
        const k = expr();
        expect("]");
        node = { t: "idx", o: node, k };
      } else if (isOp("(")) {
        if (node.t !== "id") throw new Error("Only named functions can be called");
        i++;
        const args = [];
        if (!isOp(")")) {
          args.push(expr());
          while (isOp(",")) {
            i++;
            args.push(expr());
          }
        }
        expect(")");
        node = { t: "call", n: node.n, args };
      } else break;
    }
    return node;
  };
  const primary = () => {
    const t = peek();
    if (!t) throw new Error("Unexpected end of expression");
    i++;
    if (t.k === "num") return { t: "lit", v: t.v };
    if (t.k === "str") return { t: "lit", v: t.v };
    if (t.k === "id") {
      const lw = t.v.toLowerCase();
      if (lw === "true") return { t: "lit", v: true };
      if (lw === "false") return { t: "lit", v: false };
      if (lw === "null") return { t: "lit", v: null };
      return { t: "id", n: t.v };
    }
    if (t.v === "(") {
      const e = expr();
      expect(")");
      return e;
    }
    throw new Error(`Unexpected "${t.v}"`);
  };

  const ast = expr();
  if (i < tokens.length) throw new Error(`Unexpected "${tokens[i].v}"`);
  return ast;
}

const AST_CACHE = new Map();
/** Parses an expression; throws with a readable message on a syntax error. Cached. */
export function parseExpr(src) {
  const key = String(src ?? "");
  if (AST_CACHE.has(key)) {
    const hit = AST_CACHE.get(key);
    if (hit instanceof Error) throw hit;
    return hit;
  }
  let res;
  try {
    if (!key.trim()) throw new Error("Empty expression");
    res = parseTokens(tokenize(key));
  } catch (e) {
    res = e instanceof Error ? e : new Error(String(e));
  }
  if (AST_CACHE.size > 5000) AST_CACHE.clear();
  AST_CACHE.set(key, res);
  if (res instanceof Error) throw res;
  return res;
}

/** Context vars that are not data paths. */
const VAR_NAMES = ["page", "pages", "rowNumber", "rowIndex", "subNumber", "groupRowNumber", "groupCount", "group", "rows", "row", "value", "labelNumber", "parent", "pageRows", "broughtRows", "carriedRows"];
/** Root objects every datasource gets from the API, beside its result sets. */
export const ROOT_NAMES = ["params", "user", "centre", "header", "sys", "assets"];
export const ROOT_KEYS = {
  user: [
    "EmployeeID", "EmployeeName", "UserName", "Email", "CentreID", "CentreName", "BookingCentreID", "RoleID", "RoleName",
    "DepartmentID", "DepartmentName", "OrganizationID", "OrganizationName", "OrganizationCurrency", "CentreCurrency",
    "Hospital_ID", "Ownership", "IsStore", "EmpLanguage", "EmpLanguageCode", "GlobalId",
  ],
  centre: ["CentreID", "CentreCode", "CentreName", "Address", "MobileNo", "LandlineNo", "EmailID", "Website", "City", "State", "Country", "District", "OrganizationName", "LogoUrl", "HeaderImageUrl", "LetterheadUrl", "FooterLogoUrl"],
  header: ["HeaderText", "FooterText", "HeaderType"],
  sys: [
    "now", "duplicate", "templateCode", "version", "printedBy", "profile", "paper", "orientation", "paperWidth", "contentWidth", "thermal", "roll", "copy", "copyIndex", "copies",
    "printCount", "reprintCount", "reprintReason", "variant", "gst", "batchIndex", "batchCount",
  ],
};

/** Page-total functions: their argument is summed over the detail rows of this page / before it / up to its end. */
const PAGE_AGGREGATES = { pagesum: "pageRows", broughtforward: "broughtRows", carriedforward: "carriedRows" };

const OWN = Object.prototype.hasOwnProperty;
function getProp(obj, key) {
  if (obj == null) return undefined;
  if (Array.isArray(obj)) {
    if (typeof key === "number" || /^\d+$/.test(String(key))) return obj[Number(key)];
    if (key === "length") return obj.length;
    return getProp(obj[0], key);
  }
  if (typeof obj !== "object") return undefined;
  const k = String(key);
  if (OWN.call(obj, k)) return obj[k];
  // Field names from SQL are easy to mistype in case; fall back to a
  // case-insensitive match (validation warns about it).
  const lk = k.toLowerCase();
  for (const kk of Object.keys(obj)) if (kk.toLowerCase() === lk) return obj[kk];
  return undefined;
}

function resolveId(name, ctx) {
  const vars = ctx.vars || {};
  if (name === "row") return ctx.row;
  if (name === "rows") return ctx.rows || [];
  if (OWN.call(vars, name)) return vars[name];
  if (ctx.row && typeof ctx.row === "object" && !Array.isArray(ctx.row)) {
    if (OWN.call(ctx.row, name)) return ctx.row[name];
  }
  const data = ctx.data || {};
  if (OWN.call(data, name)) return data[name];
  if (ctx.row && typeof ctx.row === "object") {
    const v = getProp(ctx.row, name);
    if (v !== undefined) return v;
  }
  return getProp(data, name);
}

const AGGREGATES = new Set(["sum", "count", "avg", "min", "max", "first", "last", "distinct", "distinctcount", "distinctlist"]);

function aggregateRows(node, ctx) {
  const args = node.args;
  let rows;
  let valueAst = args[0];
  if (args.length >= 2) {
    const set = evalNode(args[1], ctx);
    rows = Array.isArray(set) ? set : set == null ? [] : [set];
  } else if (args.length === 1 && args[0].t === "mem") {
    // sum(items.Amount): the object of the path is a row set → sum its field.
    const base = evalNode(args[0].o, ctx);
    if (Array.isArray(base) && base !== ctx.row) {
      rows = base;
      valueAst = { t: "id", n: args[0].k };
    }
  }
  if (!rows) rows = ctx.rows || [];
  const values = [];
  for (let i = 0; i < rows.length; i++) {
    if (!valueAst) {
      values.push(rows[i]);
      continue;
    }
    const sub = { ...ctx, row: rows[i], rows, vars: { ...(ctx.vars || {}), rowIndex: i, rowNumber: i + 1 } };
    values.push(evalNode(valueAst, sub));
  }
  return values;
}

function runAggregate(name, node, ctx) {
  const values = aggregateRows(node, ctx);
  const nums = () => values.map(toNumber).filter((n) => !isNaN(n));
  switch (name) {
    case "sum":
      return nums().reduce((a, b) => a + b, 0);
    case "count":
      return node.args.length === 0 ? values.length : values.filter((v) => v != null && v !== "").length;
    case "avg": {
      const n = nums();
      return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
    }
    case "min": {
      const n = nums();
      return n.length ? Math.min(...n) : null;
    }
    case "max": {
      const n = nums();
      return n.length ? Math.max(...n) : null;
    }
    case "first":
      return values.length ? values[0] : null;
    case "last":
      return values.length ? values[values.length - 1] : null;
    case "distinct":
    case "distinctcount":
      return new Set(values.filter((v) => v != null && v !== "").map(String)).size;
    // the different non-empty values, in first-seen order (join(distinctlist(SurgeryName), ', '))
    case "distinctlist":
      return [...new Set(values.filter((v) => v != null && String(v).trim() !== "").map(String))];
    default:
      return null;
  }
}

const FUNCTIONS = {
  if: (c, a, b) => (truthy(c) ? a : b),
  iif: (c, a, b) => (truthy(c) ? a : b),
  coalesce: (...a) => {
    for (const v of a) if (v != null && v !== "") return v;
    return null;
  },
  concat: (...a) => a.map((v) => (v == null ? "" : String(v))).join(""),
  upper: (s) => (s == null ? s : String(s).toUpperCase()),
  lower: (s) => (s == null ? s : String(s).toLowerCase()),
  trim: (s) => (s == null ? s : String(s).trim()),
  len: (s) => (s == null ? 0 : Array.isArray(s) ? s.length : String(s).length),
  left: (s, n) => (s == null ? s : String(s).slice(0, num(n))),
  right: (s, n) => (s == null ? s : num(n) <= 0 ? "" : String(s).slice(-num(n))),
  substr: (s, a, n) => (s == null ? s : n == null ? String(s).substr(num(a)) : String(s).substr(num(a), num(n))),
  replace: (s, a, b) => (s == null ? s : String(s).split(String(a ?? "")).join(String(b ?? ""))),
  contains: (s, x) => s != null && String(s).toLowerCase().includes(String(x ?? "").toLowerCase()),
  startswith: (s, x) => s != null && String(s).toLowerCase().startsWith(String(x ?? "").toLowerCase()),
  endswith: (s, x) => s != null && String(s).toLowerCase().endsWith(String(x ?? "").toLowerCase()),
  round: (x, d) => {
    const n = toNumber(x);
    if (isNaN(n)) return null;
    const f = Math.pow(10, num(d));
    return Math.round((n + Number.EPSILON) * f) / f;
  },
  abs: (x) => (isNaN(toNumber(x)) ? null : Math.abs(toNumber(x))),
  ceil: (x) => (isNaN(toNumber(x)) ? null : Math.ceil(toNumber(x))),
  floor: (x) => (isNaN(toNumber(x)) ? null : Math.floor(toNumber(x))),
  num: (x) => {
    const n = toNumber(x);
    return isNaN(n) ? 0 : n;
  },
  text: (x) => (x == null ? "" : String(x)),
  isempty: (x) => x == null || x === "" || (Array.isArray(x) && x.length === 0),
  isnull: (x) => x == null,
  words: (x) => amountInWords(x),
  // Title Case as .NET's TextInfo.ToTitleCase(s.ToLower()) gives it (Util.ToTitleCase).
  proper: (s) => (s == null ? s : properCase(String(s))),
  // Fixed decimals without thousands grouping: 1 → "1.00" (how a raw SQL DECIMAL prints).
  fixed: (x, d) => {
    const n = toNumber(x);
    if (isNaN(n)) return x == null || x === "" ? null : String(x);
    return n.toFixed(Math.max(0, Math.min(10, d == null ? 2 : num(d))));
  },
  // Whole-rupee words exactly as the HIS receipts print them (StockReport.ChangeNumericToWords).
  inrwords: (x) => inrWords(x),
  // Whole-unit international words as the Razor store prints write them (…Twenty-Three Thousand…, millions).
  intlwords: (x) => intlWords(x),
  // Indian words as the IPD bill views write them (NumberToWords): floored, Crore/Lakh, "and", hyphens.
  lakhwords: (x) => lakhWords(x),
  // International words as the Razor purchase prints write them (NumberToWords): rounded half-to-even, Million, "and", hyphens.
  millionwords: (x) => millionWords(x),
  // join(list, ', '): the non-empty values of a list (e.g. distinct(SurgeryName)) as one text
  join: (list, sep) => (Array.isArray(list) ? list : list == null ? [] : [list]).filter((v) => v != null && String(v).trim() !== "").map(String).join(sep == null ? ", " : String(sep)),
  // HTML from SQL (" <br /> ", "<b>…</b>") as plain text; <br> becomes a line break.
  striptags: (s) => (s == null ? s : stripTags(String(s))),
  // htmlblocks(Value, 1): long HTML as rows { Html, Index } for a detail band, so it runs over pages block by block
  htmlblocks: (s, preLine) => htmlBlocks(s, preLine),
  // oneof(sys.profile, 'THERMAL80', 'THERMAL58'): x equals one of the values (text compare, case-insensitive)
  oneof: (x, ...a) => a.some((v) => String(v ?? "").toLowerCase() === String(x ?? "").toLowerCase()),
  // between(x, lo, hi): lo ≤ x ≤ hi (numbers); a lab value inside its reference range
  between: (x, lo, hi) => {
    const n = toNumber(x);
    return !isNaN(n) && (lo == null || lo === "" || n >= toNumber(lo)) && (hi == null || hi === "" || n <= toNumber(hi));
  },
  // pad(x, 6, '0') → "000042"
  pad: (x, w, c) => String(x ?? "").padStart(num(w), c == null || c === "" ? " " : String(c)),
};

function evalNode(node, ctx) {
  switch (node.t) {
    case "lit":
      return node.v;
    case "id":
      return resolveId(node.n, ctx);
    case "mem":
      return getProp(evalNode(node.o, ctx), node.k);
    case "idx": {
      const o = evalNode(node.o, ctx);
      const k = evalNode(node.k, ctx);
      return getProp(o, k);
    }
    case "un": {
      const a = evalNode(node.a, ctx);
      if (node.op === "!") return !truthy(a);
      const n = toNumber(a);
      if (isNaN(n)) return null;
      return node.op === "-" ? -n : n;
    }
    case "cond":
      return truthy(evalNode(node.c, ctx)) ? evalNode(node.a, ctx) : evalNode(node.b, ctx);
    case "bin": {
      const op = node.op;
      if (op === "&&") {
        const a = evalNode(node.a, ctx);
        return truthy(a) ? evalNode(node.b, ctx) : a;
      }
      if (op === "||") {
        const a = evalNode(node.a, ctx);
        return truthy(a) ? a : evalNode(node.b, ctx);
      }
      if (op === "??") {
        const a = evalNode(node.a, ctx);
        return a == null || a === "" ? evalNode(node.b, ctx) : a;
      }
      const a = evalNode(node.a, ctx);
      const b = evalNode(node.b, ctx);
      switch (op) {
        case "+":
          if ((isNumericLike(a) || a == null) && (isNumericLike(b) || b == null) && (a != null || b != null))
            return num(a) + num(b);
          return (a == null ? "" : String(a)) + (b == null ? "" : String(b));
        case "-":
        case "*":
        case "/":
        case "%": {
          const x = toNumber(a ?? 0);
          const y = toNumber(b ?? 0);
          if (isNaN(x) || isNaN(y)) return null;
          if (op === "-") return x - y;
          if (op === "*") return x * y;
          if (y === 0) return null;
          return op === "/" ? x / y : x % y;
        }
        case "==":
        case "!=": {
          let eq;
          if (a == null || b == null) eq = (a == null || a === "") && (b == null || b === "");
          else if (isNumericLike(a) && isNumericLike(b)) eq = toNumber(a) === toNumber(b);
          else if (typeof a === "boolean" || typeof b === "boolean") eq = truthy(a) === truthy(b);
          else eq = String(a) === String(b);
          return op === "==" ? eq : !eq;
        }
        default: {
          let x = a;
          let y = b;
          if (isNumericLike(a) && isNumericLike(b)) {
            x = toNumber(a);
            y = toNumber(b);
          } else {
            x = String(a ?? "");
            y = String(b ?? "");
          }
          if (op === "<") return x < y;
          if (op === "<=") return x <= y;
          if (op === ">") return x > y;
          return x >= y;
        }
      }
    }
    case "call": {
      const name = node.n.toLowerCase();
      if (AGGREGATES.has(name)) return runAggregate(name, node, ctx);
      // pageSum(Amount) / broughtForward(Amount) / carriedForward(Amount): page and running totals
      if (OWN.call(PAGE_AGGREGATES, name)) {
        const set = (ctx.vars && ctx.vars[PAGE_AGGREGATES[name]]) || [];
        return runAggregate("sum", { args: node.args.length ? [node.args[0], { t: "lit", v: set }] : [{ t: "lit", v: null }, { t: "lit", v: set }] }, ctx);
      }
      if (name === "format") {
        const v = node.args[0] ? evalNode(node.args[0], ctx) : null;
        const spec = node.args[1] ? evalNode(node.args[1], ctx) : "";
        return formatValue(v, parseFormatSpec(spec), ctx.theme);
      }
      if (name === "date") {
        const v = node.args[0] ? evalNode(node.args[0], ctx) : null;
        const p = node.args[1] ? evalNode(node.args[1], ctx) : "DD-MMM-YYYY";
        return formatDate(toDate(v), p);
      }
      if (name === "now") return ctx.data?.sys?.now ?? null;
      if (name === "today") return formatDate(toDate(ctx.data?.sys?.now), "YYYY-MM-DD");
      const fn = FUNCTIONS[name];
      if (!fn) throw new Error(`Unknown function ${node.n}()`);
      return fn(...node.args.map((a) => evalNode(a, ctx)));
    }
    default:
      throw new Error("Bad expression");
  }
}

export const ERR = Object.freeze({ __pbErr: true });
export const isErr = (v) => v === ERR;

/** Evaluates; never throws. A failure returns ERR and is logged on ctx.errors. */
export function evaluate(src, ctx) {
  try {
    return evalNode(parseExpr(src), ctx);
  } catch (e) {
    if (ctx && ctx.errors) ctx.errors.add(`${String(src).slice(0, 60)}: ${e.message}`);
    return ERR;
  }
}

const TOKEN_TPL = /\{\{([\s\S]+?)\}\}/g;
/** Replaces {{expr}} tokens with their formatted values. `escape` for HTML contexts. */
export function interpolate(text, ctx, { escape = false, format, nullText } = {}) {
  if (text == null) return "";
  return String(text).replace(TOKEN_TPL, (_, src) => {
    const v = evaluate(src.trim(), ctx);
    let out;
    if (isErr(v)) out = "#ERR";
    else if (v == null || v === "") out = nullText ?? ctx?.theme?.nullText ?? "";
    else out = formatValue(v, format, ctx?.theme);
    return escape ? escapeHtml(out) : out;
  });
}

/* ========================================================================== */
/*  formatting                                                                */
/* ========================================================================== */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Dates are parsed from their parts and never through a time zone, so the
 * browser preview and the server's Chrome print the same wall-clock time.
 * Year < 1900 (MySQL zero dates, .NET DateTime.MinValue "01-Jan-0001") is null.
 */
export function toDate(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (isNum(v)) return new Date(v);
  const s = String(v).trim();
  const mk = (y, mo, d, h = 0, mi = 0, se = 0, ap) => {
    if (!y || y < 1900 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    let hh = h;
    if (ap) {
      const pm = /p/i.test(ap);
      if (pm && hh < 12) hh += 12;
      if (!pm && hh === 12) hh = 0;
    }
    return new Date(y, mo - 1, d, hh, mi, se);
  };
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return mk(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/);
  if (m) return mk(+m[3], +m[2], +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0), m[7]);
  // DD-MMM-YYYY, and DD-MMM-YY (MySQL '%d-%b-%y'): a 2-digit year is 20yy up to 49, else 19yy (as .NET parses it)
  m = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ,]+(\d{4}|\d{2}(?!\d))(?:\s+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/i);
  if (m) {
    const mo = MONTHS.findIndex((x) => x.slice(0, 3).toLowerCase() === m[2].slice(0, 3).toLowerCase()) + 1;
    const y = m[3].length === 2 ? (+m[3] <= 49 ? 2000 : 1900) + +m[3] : +m[3];
    return mk(y, mo, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0), m[7]);
  }
  return null;
}

const pad = (n, w = 2) => String(n).padStart(w, "0");
export function formatDate(d, pattern = "DD-MMM-YYYY") {
  if (!d) return "";
  const H = d.getHours();
  const h12 = H % 12 === 0 ? 12 : H % 12;
  return String(pattern || "DD-MMM-YYYY").replace(
    /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|ss|A|a/g,
    (t, lit) => {
      if (lit !== undefined) return lit;
      switch (t) {
        case "YYYY": return String(d.getFullYear());
        case "YY": return String(d.getFullYear()).slice(-2);
        case "MMMM": return MONTHS[d.getMonth()];
        case "MMM": return MONTHS[d.getMonth()].slice(0, 3);
        case "MM": return pad(d.getMonth() + 1);
        case "M": return String(d.getMonth() + 1);
        case "DD": return pad(d.getDate());
        case "D": return String(d.getDate());
        case "dddd": return DAYS[d.getDay()];
        case "ddd": return DAYS[d.getDay()].slice(0, 3);
        case "HH": return pad(H);
        case "H": return String(H);
        case "hh": return pad(h12);
        case "h": return String(h12);
        case "mm": return pad(d.getMinutes());
        case "ss": return pad(d.getSeconds());
        case "A": return H < 12 ? "AM" : "PM";
        case "a": return H < 12 ? "am" : "pm";
        default: return t;
      }
    },
  );
}

const NF_CACHE = new Map();
export function formatNumber(v, decimals = 2, locale = "en-IN") {
  let n = toNumber(v);
  if (isNaN(n)) return v == null ? "" : String(v);
  if (Math.abs(n) < 0.5 * Math.pow(10, -decimals)) n = 0; // no "-0.00" (.NET prints 0.00)
  const key = `${locale}|${decimals}`;
  let nf = NF_CACHE.get(key);
  if (!nf) {
    try {
      nf = new Intl.NumberFormat(locale || "en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    } catch {
      nf = new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    NF_CACHE.set(key, nf);
  }
  return nf.format(n);
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const twoWords = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
const threeWords = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? twoWords(r) : ""].filter(Boolean).join(" ");
};
/** Indian numbering: crore, lakh, thousand. */
export function numberInWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${numberInWords(crore)} Crore`);
  if (lakh) parts.push(`${twoWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoWords(thousand)} Thousand`);
  if (rest) parts.push(threeWords(rest));
  return parts.join(" ");
}

export function amountInWords(v, { currencyName = "Rupees", subunitName = "Paise", suffix = "Only" } = {}) {
  const n = toNumber(v);
  if (isNaN(n)) return "";
  const neg = n < 0;
  const abs = Math.round(Math.abs(n) * 100);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  let s = [currencyName, numberInWords(whole)].filter(Boolean).join(" ");
  if (frac) s += ` and ${twoWords(frac)} ${subunitName}`.replace(/\s+$/, "");
  if (suffix) s += ` ${suffix}`;
  return (neg ? "Minus " : "") + s.trim();
}

/** Math.Round(x) of .NET: halves go to the even neighbour (90.5 → 90, 91.5 → 92). */
function roundHalfEven(n) {
  const f = Math.floor(n);
  if (Math.abs(n - f - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(n);
}

const IW_UNITS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const IW_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function intlGroupWords(n) {
  if (n < 20) return IW_UNITS[n];
  if (n < 100) return IW_TENS[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + IW_UNITS[n % 10] : "");
  if (n < 1000) return IW_UNITS[Math.floor(n / 100)] + " Hundred" + (n % 100 > 0 ? " " + intlGroupWords(n % 100) : "");
  if (n < 1000000) return intlGroupWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 > 0 ? " " + intlGroupWords(n % 1000) : "");
  return intlGroupWords(Math.floor(n / 1000000)) + " Million" + (n % 1000000 > 0 ? " " + intlGroupWords(n % 1000000) : "");
}
/**
 * International words for the whole part of an amount, word for word what the
 * Razor store prints write (DirectGRNReport.cshtml ToWords): the fraction is cut
 * off, not rounded; tens are hyphenated; no "and"; above a million it keeps
 * counting in millions. 1023045.9 → "One Million Twenty-Three Thousand Forty-Five".
 * The view throws on a negative amount; here it reads "Minus …".
 */
export function intlWords(v) {
  const x = toNumber(v);
  if (isNaN(x)) return "";
  const whole = Math.trunc(x);
  if (whole < 0) return "Minus " + intlGroupWords(-whole);
  return intlGroupWords(whole);
}

function lakhGroupWords(n) {
  if (n === 0) return "Zero";
  let w = "";
  if (Math.floor(n / 10000000) > 0) {
    w += lakhGroupWords(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    w += lakhGroupWords(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    w += lakhGroupWords(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (Math.floor(n / 100) > 0) {
    w += lakhGroupWords(Math.floor(n / 100)) + " Hundred ";
    n %= 100;
  }
  if (n > 0) {
    if (w !== "") w += "and ";
    w += n < 20 ? IW_UNITS[n] : IW_TENS[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + IW_UNITS[n % 10] : "");
  }
  return w.trim();
}
/**
 * Indian-system words for the whole part (floored) of an amount, word for word what the
 * IPD bill views print (IPDBillPrint.cshtml NumberToWords): Crore / Lakh / Thousand /
 * Hundred, "and" before the last part, hyphenated tens. 46174 → "Forty-Six Thousand One
 * Hundred and Seventy-Four"; 0 → "Zero"; negative → "Minus …".
 */
export function lakhWords(v) {
  const x = toNumber(v);
  if (isNaN(x)) return "";
  const whole = Math.floor(x);
  if (whole < 0) return "Minus " + lakhGroupWords(-whole);
  return lakhGroupWords(whole);
}

function millionGroupWords(n) {
  if (n === 0) return "Zero";
  let w = "";
  if (Math.floor(n / 1000000) > 0) {
    w += millionGroupWords(Math.floor(n / 1000000)) + " Million ";
    n %= 1000000;
  }
  if (Math.floor(n / 1000) > 0) {
    w += millionGroupWords(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (Math.floor(n / 100) > 0) {
    w += millionGroupWords(Math.floor(n / 100)) + " Hundred ";
    n %= 100;
  }
  if (n > 0) {
    if (w !== "") w += "and ";
    w += n < 20 ? IW_UNITS[n] : IW_TENS[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + IW_UNITS[n % 10] : "");
  }
  return w.trim();
}
/**
 * International words for an amount rounded to a whole number half-to-even (.NET Convert.ToInt32), word for
 * word what the Razor purchase prints write (POReport.cshtml NumberToWords): Million / Thousand / Hundred,
 * "and" before the last part, hyphenated tens. 1101250.5 → "One Million One Hundred and One Thousand Two
 * Hundred and Fifty"; 0 → "Zero"; negative → "Minus …".
 */
export function millionWords(v) {
  const x = toNumber(v);
  if (isNaN(x)) return "";
  const whole = roundHalfEven(x);
  if (whole < 0) return "Minus " + millionGroupWords(-whole);
  return millionGroupWords(whole);
}

const W_ONES = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine "];
const W_TEENS = ["Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
const W_TENS = ["Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];
const W_GROUPS = ["Thousand ", "Lakh ", "Crore "];
/**
 * Indian-system words for a whole amount, word for word what the HIS receipts
 * print (StockReport.ChangeNumericToWords): rounded to whole rupees half-to-even,
 * "and" before the tens of the last group and after any "Hundred", none below 100.
 * 1250 → "One Thousand Two Hundred and Fifty"; 90 → "Ninety".
 */
export function inrWords(v) {
  const x = toNumber(v);
  if (isNaN(x)) return "";
  let n = roundHalfEven(x);
  if (n === 0) return "Zero";
  let out = "";
  if (n < 0) {
    out += "Minus ";
    n = -n;
  }
  const g = [n % 1000, Math.floor(n / 1000), Math.floor(n / 100000), Math.floor(n / 10000000)];
  g[1] -= 100 * g[2];
  g[2] -= 100 * g[3];
  let first = 0;
  for (let i = 3; i > 0; i--) {
    if (g[i] !== 0) {
      first = i;
      break;
    }
  }
  for (let i = first; i >= 0; i--) {
    if (g[i] === 0) continue;
    const u = g[i] % 10;
    const h = Math.floor(g[i] / 100);
    const t = Math.floor(g[i] / 10) - 10 * h;
    if (h > 0) out += (W_ONES[h] || "") + "Hundred ";
    if (u > 0 || t > 0) {
      if (h > 0 || i === 0) out += "and ";
      out += t === 0 ? W_ONES[u] : t === 1 ? W_TEENS[u] : W_TENS[t - 2] + W_ONES[u];
    }
    if (i !== 0) out += W_GROUPS[i - 1];
  }
  if (String(n).length < 3) out = out.split("and").join("");
  return out.replace(/\s+/g, " ").trim();
}

const LETTER = /\p{L}/u;
const WORD_BREAK = /[\s\p{P}\p{S}\p{Z}\p{C}]/u;
/** .NET TextInfo.ToTitleCase(s.ToLower()): a letter after a word break starts a word; ' stays inside one. */
function properCase(s) {
  const str = s.toLowerCase();
  let out = "";
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    i++;
    if (!LETTER.test(ch)) {
      out += ch;
      continue;
    }
    out += ch.toUpperCase();
    while (i < str.length && (str[i] === "'" || LETTER.test(str[i]) || !WORD_BREAK.test(str[i]))) out += str[i++];
  }
  return out;
}

function stripTags(s) {
  return s
    .replace(/\s*<br\s*\/?>\s*/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, "&");
}

const HTML_BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "TABLE", "BLOCKQUOTE", "PRE", "SECTION", "ARTICLE", "HR", "CENTER", "DL"]);
const HTML_WRAPPER_TAGS = new Set(["DIV", "P", "SECTION", "ARTICLE", "CENTER", "BLOCKQUOTE"]);

/**
 * htmlblocks(html, preLine): long HTML from the database (a radiology finding, a consent text) as rows of
 * blocks — one per paragraph, list item or <br> line — for a detail band / table, so pages can break between
 * blocks (the paginator never splits inside one element). The look of a wrapper (style, class, align) is put back
 * around every piece; a <p> wrapper becomes a <div> (its margins would otherwise come back around every line).
 * preLine: plain newlines are line breaks too (text the old print showed with white-space:pre-line).
 * Rows: { Html, Index }. The API's HtmlBlocks.Split rules (plus tight split lists). Without a DOM the whole text is one row.
 */
function htmlBlocks(html, preLine) {
  if (html == null || isErr(html)) return [];
  let s = String(html);
  if (!s.trim()) return [];
  if (truthy(preLine)) s = s.replace(/<br\s*\/?>[ \t]*\r?\n/gi, "<br/>").replace(/\r?\n/g, "<br/>");
  if (typeof DOMParser === "undefined") return [{ Html: s, Index: 1 }];
  const doc = new DOMParser().parseFromString(`<div id="pbroot">${s}</div>`, "text/html");
  const attr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const attrs = (n, skip) => Array.from(n.attributes).filter((a) => a.name !== skip).map((a) => ` ${a.name}="${attr(a.value)}"`).join("");
  const out = [];
  const walk = (parent, open, close) => {
    let inline = "";
    const add = (b) => out.push(open + b + close);
    const flush = () => {
      if (inline.trim()) add(`<div>${inline}</div>`);
      inline = "";
    };
    for (const n of Array.from(parent.childNodes)) {
      if (n.nodeType === 8) continue;
      if (n.nodeType === 1 && HTML_BLOCK_TAGS.has(n.tagName)) {
        flush();
        const name = n.tagName.toLowerCase();
        const items = Array.from(n.children).filter((c) => c.tagName === "LI");
        if ((name === "ul" || name === "ol") && items.length > 1) {
          // each item on its own, inside a copy of its list (an ol keeps counting); only the first copy keeps the
          // list's top margin and only the last its bottom one, so the items stay as close as in one list
          const start = name === "ol" ? parseInt(n.getAttribute("start") || "1", 10) || 1 : 1;
          const own = n.getAttribute("style") || "";
          items.forEach((li, k) => {
            const gap = (k > 0 ? "margin-top:0;" : "") + (k < items.length - 1 ? "margin-bottom:0;" : "");
            const style = gap ? ` style="${attr(own ? `${own.replace(/;?\s*$/, ";")}${gap}` : gap)}"` : own ? ` style="${attr(own)}"` : "";
            const rest = Array.from(n.attributes).filter((a) => a.name !== "start" && a.name !== "style").map((a) => ` ${a.name}="${attr(a.value)}"`).join("");
            add(`<${name}${rest}${style}${name === "ol" ? ` start="${start + k}"` : ""}>${li.outerHTML}</${name}>`);
          });
        } else if (HTML_WRAPPER_TAGS.has(n.tagName) && Array.from(n.children).some((c) => HTML_BLOCK_TAGS.has(c.tagName) || c.tagName === "BR")) {
          const tag = name === "p" ? "div" : name;
          walk(n, `${open}<${tag}${attrs(n)}>`, `</${tag}>${close}`);
        } else add(n.outerHTML);
      } else if (n.nodeType === 1 && n.tagName === "BR") {
        // a line ends here; an empty line (two <br> in a row) is kept as a blank line
        if (inline.trim()) flush();
        else if (out.length) {
          inline = "";
          add("<div><br/></div>");
        }
      } else inline += n.nodeType === 3 ? escapeHtml(n.textContent) : n.nodeType === 1 ? n.outerHTML : "";
    }
    flush();
  };
  walk(doc.getElementById("pbroot"), "", "");
  const probe = doc.createElement("div");
  const blank = (h, withBr) => {
    probe.innerHTML = h;
    return !probe.textContent.replace(/ /g, " ").trim() && !probe.querySelector(withBr ? "img,hr,table,br" : "img,hr,table");
  };
  const blocks = out.filter((b) => !blank(b, true));
  // a blank line at the start or the end prints nothing but can still push a page of its own
  while (blocks.length && blank(blocks[0], false)) blocks.shift();
  while (blocks.length && blank(blocks[blocks.length - 1], false)) blocks.pop();
  return blocks.map((Html, i) => ({ Html, Index: i + 1 }));
}

/** "currency" | "number:0" | "date:DD-MM-YYYY" | "words" → format object. */
export function parseFormatSpec(spec) {
  if (spec && typeof spec === "object") return spec;
  const s = String(spec || "");
  const i = s.indexOf(":");
  const type = (i < 0 ? s : s.slice(0, i)).trim().toLowerCase();
  const arg = i < 0 ? "" : s.slice(i + 1);
  if (type === "number" || type === "currency" || type === "percent") return { type, decimals: arg === "" ? undefined : num(arg, 2) };
  if (type === "date" || type === "datetime" || type === "time") return { type, pattern: arg || undefined };
  return { type };
}

const DEFAULT_PATTERNS = { date: "DD-MMM-YYYY", datetime: "DD-MMM-YYYY hh:mm A", time: "hh:mm A" };

/** Formats a value per an element's `format`. Null stays null (caller applies nullText). */
export function formatValue(v, format, theme = {}) {
  if (v == null || isErr(v)) return v;
  const f = format || {};
  const type = f.type || "none";
  let out;
  switch (type) {
    case "number": {
      const d = f.decimals ?? 2;
      out = isNumericLike(v) ? formatNumber(v, d, theme.locale) : String(v);
      break;
    }
    case "currency": {
      const d = f.decimals ?? 2;
      const sym = f.currency ?? theme.currency ?? "";
      out = isNumericLike(v) ? `${sym}${formatNumber(v, d, theme.locale)}` : String(v);
      break;
    }
    case "percent": {
      const d = f.decimals ?? 0;
      out = isNumericLike(v) ? `${formatNumber(v, d, theme.locale)}%` : String(v);
      break;
    }
    case "date":
    case "datetime":
    case "time": {
      const d = toDate(v);
      out = d ? formatDate(d, f.pattern || DEFAULT_PATTERNS[type]) : String(v).startsWith("01-Jan-0001") || String(v).startsWith("0001") ? "" : String(v);
      break;
    }
    case "words":
      out = amountInWords(v, f);
      break;
    case "upper":
      out = String(v).toUpperCase();
      break;
    case "lower":
      out = String(v).toLowerCase();
      break;
    default:
      if (typeof v === "boolean") out = v ? "Yes" : "No";
      else if (Array.isArray(v)) out = `${v.length} rows`;
      else if (typeof v === "object") out = "";
      else out = String(v);
  }
  if (out === "" || out == null) return out;
  return `${f.prefix ?? ""}${out}${f.suffix ?? ""}`;
}

/* ========================================================================== */
/*  barcode (Code 128) and QR                                                 */
/* ========================================================================== */

const C128 = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

/** Code 128 symbol values for text: code set C for all-digit even runs, else B. */
export function code128Values(text) {
  const s = String(text ?? "");
  const vals = [];
  if (/^\d+$/.test(s) && s.length % 2 === 0 && s.length >= 4) {
    vals.push(105);
    for (let i = 0; i < s.length; i += 2) vals.push(Number(s.slice(i, i + 2)));
  } else {
    vals.push(104);
    for (const ch of s) {
      const c = ch.charCodeAt(0);
      vals.push(c >= 32 && c <= 127 ? c - 32 : 31 /* "?" */);
    }
  }
  let sum = vals[0];
  for (let i = 1; i < vals.length; i++) sum += vals[i] * i;
  vals.push(sum % 103);
  vals.push(106);
  return vals;
}

/** Bars from alternating bar/space module widths (first one a bar), with a 10-module quiet zone. */
function barsSvg(widths) {
  const rects = [];
  let x = 10;
  widths.forEach((w, i) => {
    if (i % 2 === 0 && w > 0) rects.push(`<rect x="${x}" y="0" width="${w}" height="1"/>`);
    x += w;
  });
  return `<svg class="pb-barsvg" viewBox="0 0 ${x + 10} 1" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><g fill="#000">${rects.join("")}</g></svg>`;
}

function code128Widths(text) {
  const out = [];
  for (const v of code128Values(text)) for (const ch of C128[v]) out.push(Number(ch));
  return out;
}

// Code 39: 9 elements per character (bar space … bar), w = wide (3 modules), n = narrow
const C39 = {
  0: "nnnwwnwnn", 1: "wnnwnnnnw", 2: "nnwwnnnnw", 3: "wnwwnnnnn", 4: "nnnwwnnnw", 5: "wnnwwnnnn", 6: "nnwwwnnnn", 7: "nnnwnnwnw", 8: "wnnwnnwnn", 9: "nnwwnnwnn",
  A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
  U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn",
  $: "nwnwnwnnn", "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn",
};
function code39Widths(text) {
  const s = `*${String(text).toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, "-")}*`;
  const out = [];
  [...s].forEach((ch, i) => {
    for (const e of C39[ch]) out.push(e === "w" ? 3 : 1);
    if (i < s.length - 1) out.push(1); // narrow gap between characters
  });
  return out;
}

// EAN / UPC: 7-module patterns, L / G for the left half, R (L inverted) for the right
const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const EAN_G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const EAN_R = EAN_L.map((p) => [...p].map((b) => (b === "1" ? "0" : "1")).join(""));
const EAN_PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
/** The check digit for the digits before it (weights 3,1 from the right). */
function eanCheck(digits) {
  let sum = 0;
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += Number(digits[i]) * w;
  return String((10 - (sum % 10)) % 10);
}
/** "1010…" module bits → alternating bar/space widths. */
const bitsToWidths = (bits) => {
  const out = [];
  let cur = "1";
  let run = 0;
  for (const b of bits) {
    if (b === cur) run++;
    else {
      out.push(run);
      cur = b;
      run = 1;
    }
  }
  out.push(run);
  return out;
};
/** EAN-13 (12 or 13 digits), EAN-8 (7 or 8), UPC-A (11 or 12) → { widths, text } or null. */
function eanWidths(text, kind) {
  let d = String(text).replace(/\D/g, "");
  const len = kind === "ean8" ? 8 : kind === "upca" ? 12 : 13;
  if (d.length === len - 1) d += eanCheck(d);
  if (d.length !== len) return null;
  if (kind === "upca") d = `0${d}`;
  let bits = "101";
  if (kind === "ean8") {
    for (let i = 0; i < 4; i++) bits += EAN_L[d[i]];
    bits += "01010";
    for (let i = 4; i < 8; i++) bits += EAN_R[d[i]];
  } else {
    const par = EAN_PARITY[d[0]];
    for (let i = 1; i < 7; i++) bits += (par[i - 1] === "L" ? EAN_L : EAN_G)[d[i]];
    bits += "01010";
    for (let i = 7; i < 13; i++) bits += EAN_R[d[i]];
  }
  bits += "101";
  return { widths: bitsToWidths(bits), text: kind === "upca" ? d.slice(1) : d };
}

// Interleaved 2 of 5: pairs of digits, the first in the bars, the second in the spaces
const ITF = ["nnwwn", "wnnnw", "nwnnw", "wwnnn", "nnwnw", "wnwnn", "nwwnn", "nnnww", "wnnwn", "nwnwn"];
function itfWidths(text) {
  let d = String(text).replace(/\D/g, "");
  if (!d) return null;
  if (d.length % 2) d = `0${d}`;
  const out = [1, 1, 1, 1];
  for (let i = 0; i < d.length; i += 2) {
    const a = ITF[d[i]];
    const b = ITF[d[i + 1]];
    for (let k = 0; k < 5; k++) out.push(a[k] === "w" ? 3 : 1, b[k] === "w" ? 3 : 1);
  }
  out.push(3, 1, 1);
  return { widths: out, text: d };
}

/* ---- Data Matrix ECC 200, square single-region symbols 10×10 … 26×26 ---- */
const DM_SIZES = [
  [10, 3, 5], [12, 5, 7], [14, 8, 10], [16, 12, 12], [18, 18, 14], [20, 22, 18], [22, 30, 20], [24, 36, 24], [26, 44, 28],
]; // [symbol size, data codewords, error codewords]
const GF_EXP = new Array(512);
const GF_LOG = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x12d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
const gfMul = (a, b) => (a && b ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0);
function dmEcc(data, n) {
  let g = [1];
  for (let i = 1; i <= n; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = ng;
  }
  const rem = new Array(n).fill(0);
  for (const d of data) {
    const f = d ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let k = 0; k < n; k++) rem[k] ^= gfMul(g[k + 1], f);
  }
  return rem;
}
/** ASCII encodation: digit pairs packed, bytes above 127 behind an upper shift. */
function dmEncode(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text)));
  const out = [];
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    const n = bytes[i + 1];
    if (c >= 48 && c <= 57 && n >= 48 && n <= 57) {
      out.push(130 + (c - 48) * 10 + (n - 48));
      i++;
    } else if (c > 127) out.push(235, c - 127);
    else out.push(c + 1);
  }
  return out;
}
function dmPlacement(nrow, ncol, cw) {
  const a = new Array(nrow * ncol).fill(-1);
  const mod = (row, col, chr, bit) => {
    if (row < 0) {
      row += nrow;
      col += 4 - ((nrow + 4) % 8);
    }
    if (col < 0) {
      col += ncol;
      row += 4 - ((ncol + 4) % 8);
    }
    a[row * ncol + col] = (cw[chr - 1] >> (8 - bit)) & 1;
  };
  const utah = (r, c, ch) => {
    mod(r - 2, c - 2, ch, 1); mod(r - 2, c - 1, ch, 2); mod(r - 1, c - 2, ch, 3); mod(r - 1, c - 1, ch, 4);
    mod(r - 1, c, ch, 5); mod(r, c - 2, ch, 6); mod(r, c - 1, ch, 7); mod(r, c, ch, 8);
  };
  const corner1 = (ch) => {
    mod(nrow - 1, 0, ch, 1); mod(nrow - 1, 1, ch, 2); mod(nrow - 1, 2, ch, 3); mod(0, ncol - 2, ch, 4);
    mod(0, ncol - 1, ch, 5); mod(1, ncol - 1, ch, 6); mod(2, ncol - 1, ch, 7); mod(3, ncol - 1, ch, 8);
  };
  const corner2 = (ch) => {
    mod(nrow - 3, 0, ch, 1); mod(nrow - 2, 0, ch, 2); mod(nrow - 1, 0, ch, 3); mod(0, ncol - 4, ch, 4);
    mod(0, ncol - 3, ch, 5); mod(0, ncol - 2, ch, 6); mod(0, ncol - 1, ch, 7); mod(1, ncol - 1, ch, 8);
  };
  const corner3 = (ch) => {
    mod(nrow - 3, 0, ch, 1); mod(nrow - 2, 0, ch, 2); mod(nrow - 1, 0, ch, 3); mod(0, ncol - 2, ch, 4);
    mod(0, ncol - 1, ch, 5); mod(1, ncol - 1, ch, 6); mod(2, ncol - 1, ch, 7); mod(3, ncol - 1, ch, 8);
  };
  const corner4 = (ch) => {
    mod(nrow - 1, 0, ch, 1); mod(nrow - 1, ncol - 1, ch, 2); mod(0, ncol - 3, ch, 3); mod(0, ncol - 2, ch, 4);
    mod(0, ncol - 1, ch, 5); mod(1, ncol - 3, ch, 6); mod(1, ncol - 2, ch, 7); mod(1, ncol - 1, ch, 8);
  };
  let chr = 1;
  let row = 4;
  let col = 0;
  do {
    if (row === nrow && col === 0) corner1(chr++);
    if (row === nrow - 2 && col === 0 && ncol % 4) corner2(chr++);
    if (row === nrow - 2 && col === 0 && ncol % 8 === 4) corner3(chr++);
    if (row === nrow + 4 && col === 2 && !(ncol % 8)) corner4(chr++);
    do {
      if (row < nrow && col >= 0 && a[row * ncol + col] === -1) utah(row, col, chr++);
      row -= 2;
      col += 2;
    } while (row >= 0 && col < ncol);
    row += 1;
    col += 3;
    do {
      if (row >= 0 && col < ncol && a[row * ncol + col] === -1) utah(row, col, chr++);
      row += 2;
      col -= 2;
    } while (row < nrow && col >= 0);
    row += 3;
    col += 1;
  } while (row < nrow || col < ncol);
  if (a[nrow * ncol - 1] === -1) {
    a[nrow * ncol - 1] = 1;
    a[nrow * ncol - ncol - 2] = 1;
  }
  return a;
}
/** Data Matrix modules (true = dark) or null when the text does not fit 26×26. */
export function dataMatrix(text) {
  const data = dmEncode(text);
  const spec = DM_SIZES.find(([, dc]) => dc >= data.length);
  if (!spec) return null;
  const [size, dc, ec] = spec;
  // first pad 129, then pseudo-random pads from the 253-state algorithm (position is 1-based)
  if (data.length < dc) data.push(129);
  while (data.length < dc) {
    let v = 129 + ((149 * (data.length + 1)) % 253) + 1;
    if (v > 254) v -= 254;
    data.push(v);
  }
  const cw = [...data.slice(0, dc), ...dmEcc(data.slice(0, dc), ec)];
  const n = size - 2;
  const bits = dmPlacement(n, n, cw);
  const m = [];
  for (let y = 0; y < size; y++) {
    const line = [];
    for (let x = 0; x < size; x++) {
      let dark;
      if (x === 0 || y === size - 1) dark = true; // solid L finder
      else if (y === 0) dark = x % 2 === 0; // clock track, top
      else if (x === size - 1) dark = y % 2 === 1; // clock track, right
      else dark = bits[(y - 1) * n + (x - 1)] === 1;
      line.push(dark);
    }
    m.push(line);
  }
  return m;
}
function dataMatrixSvg(text) {
  const m = dataMatrix(text);
  if (!m) return `<div class="pb-missing">Data Matrix: too long (44 characters max)</div>`;
  const n = m.length;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) d += `M${c + 1} ${r + 1}h1v1h-1z`;
  return `<svg class="pb-qrsvg" viewBox="0 0 ${n + 2} ${n + 2}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><path d="${d}" fill="#000"/></svg>`;
}

export const SYMBOLOGIES = [
  { value: "code128", label: "Code 128 (any text)" },
  { value: "code39", label: "Code 39 (A–Z, 0–9)" },
  { value: "ean13", label: "EAN-13" },
  { value: "ean8", label: "EAN-8" },
  { value: "upca", label: "UPC-A" },
  { value: "itf", label: "Interleaved 2 of 5" },
  { value: "datamatrix", label: "Data Matrix (2D)" },
];

/** { svg, text } for a value in a symbology; text = what prints under the bars. */
function barcodeOf(text, symbology = "code128") {
  const s = String(text);
  switch (symbology) {
    case "code39":
      return { svg: barsSvg(code39Widths(s)), text: s.toUpperCase() };
    case "ean13":
    case "ean8":
    case "upca": {
      const r = eanWidths(s, symbology);
      return r ? { svg: barsSvg(r.widths), text: r.text } : { svg: `<div class="pb-missing">${symbology.toUpperCase()}: needs ${symbology === "ean8" ? "7–8" : symbology === "upca" ? "11–12" : "12–13"} digits</div>`, text: "" };
    }
    case "itf": {
      const r = itfWidths(s);
      return r ? { svg: barsSvg(r.widths), text: r.text } : { svg: `<div class="pb-missing">ITF: digits only</div>`, text: "" };
    }
    case "datamatrix":
      return { svg: dataMatrixSvg(s), text: s, square: true };
    default:
      return { svg: barsSvg(code128Widths(s)), text: s };
  }
}

function qrSvg(text, ecc = "M") {
  const lib = typeof globalThis !== "undefined" ? globalThis.qrcode : undefined;
  if (!lib) return `<div class="pb-missing">QR</div>`;
  try {
    if (lib.stringToBytesFuncs && lib.stringToBytesFuncs["UTF-8"]) lib.stringToBytes = lib.stringToBytesFuncs["UTF-8"];
    const q = lib(0, ["L", "M", "Q", "H"].includes(ecc) ? ecc : "M");
    q.addData(String(text ?? ""), "Byte");
    q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
    return `<svg class="pb-qrsvg" viewBox="0 0 ${n + 4} ${n + 4}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><path d="${d}" fill="#000"/></svg>`;
  } catch (e) {
    return `<div class="pb-missing">QR: ${escapeHtml(e.message)}</div>`;
  }
}

/* ========================================================================== */
/*  rich text sanitising                                                      */
/* ========================================================================== */

const RICH_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "S", "BR", "P", "DIV", "SPAN", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "SMALL", "SUB", "SUP", "HR", "IMG", "FONT", "CENTER", "COLGROUP", "COL"]);
const RICH_ATTRS = new Set(["style", "align", "colspan", "rowspan", "valign", "src", "alt", "color", "size", "face"]);

export function sanitizeHtml(html) {
  if (typeof DOMParser === "undefined") return escapeHtml(html);
  const doc = new DOMParser().parseFromString(`<div id="pbroot">${html ?? ""}</div>`, "text/html");
  const root = doc.getElementById("pbroot");
  const walk = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 8) {
        child.remove();
        continue;
      }
      if (child.nodeType !== 1) continue;
      if (!RICH_TAGS.has(child.tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META"].includes(child.tagName)) child.remove();
        else {
          walk(child);
          child.replaceWith(...Array.from(child.childNodes));
        }
        continue;
      }
      for (const a of Array.from(child.attributes)) {
        const name = a.name.toLowerCase();
        if (!RICH_ATTRS.has(name)) child.removeAttribute(a.name);
        else if (name === "src" && !/^data:image\//i.test(a.value)) child.removeAttribute(a.name);
        else if (name === "style") {
          let st = a.value.replace(/expression\s*\(|url\s*\(|javascript:/gi, "");
          // Legacy letterheads hard-code pixel widths (850px) wider than the page.
          if (/^(TABLE|TD|TH|DIV|IMG)$/.test(child.tagName)) st = st.replace(/(^|;)\s*(min-)?width\s*:[^;]*/gi, "$1");
          child.setAttribute("style", st);
        }
      }
      walk(child);
    }
  };
  walk(root);
  return root.innerHTML;
}

/* ========================================================================== */
/*  element HTML                                                              */
/* ========================================================================== */

export const DEFAULT_THEME = {
  fontFamily: "Inter",
  fontSize: 9,
  color: "#1f2937",
  accent: "#0f766e",
  lineHeight: 1.35,
  currency: "",
  locale: "en-IN",
  nullText: "",
};

/** The embedded faces of the non-Latin scripts the app languages use (FONT_FILES), after every family. */
const SCRIPT_FONTS = "'Noto Sans Devanagari', 'Noto Sans Gurmukhi', 'Noto Sans Arabic', 'Noto Sans Khmer', 'Noto Sans Lao'";
export const FONT_STACKS = {
  Inter: `'Inter', ${SCRIPT_FONTS}, 'Noto Sans', Arial, sans-serif`,
  "Noto Sans": `'Noto Sans', ${SCRIPT_FONTS}, Arial, sans-serif`,
  Tinos: `'Tinos', 'Times New Roman', ${SCRIPT_FONTS}, serif`,
  Mono: "'Roboto Mono', 'Courier New', monospace",
};
export const fontStack = (f) => FONT_STACKS[f] || FONT_STACKS.Inter;

const GROW_DEFAULT = { table: true, richtext: true, crosstab: true, subreport: true };
export const canGrow = (el) => (el.canGrow ?? GROW_DEFAULT[el.type] ?? false) && el.type !== "section";
/** Elements whose box is a plain block (no flex column for vertical alignment). */
const BLOCK_TYPES = new Set(["table", "richtext", "section", "image", "crosstab", "subreport", "chart"]);
/** Elements laid out as rows the paginator may cut between (a table, a crosstab, a sub-report's bands). */
const SPLIT_TYPES = new Set(["table", "crosstab", "subreport"]);

/** The CSS of an element's box (position excluded). */
export function elementCss(el, theme = DEFAULT_THEME) {
  const s = el.style || {};
  const css = [];
  if (s.fontFamily) css.push(`font-family:${fontStack(s.fontFamily)}`);
  if (s.fontSize) css.push(`font-size:${num(s.fontSize)}pt`);
  if (s.fontWeight) css.push(`font-weight:${s.fontWeight}`);
  if (s.italic) css.push("font-style:italic");
  if (s.underline) css.push("text-decoration:underline");
  if (s.color) css.push(`color:${s.color}`);
  if (s.background) css.push(`background:${s.background}`);
  if (s.lineHeight) css.push(`line-height:${num(s.lineHeight)}`);
  if (s.letterSpacing) css.push(`letter-spacing:${num(s.letterSpacing)}pt`);
  if (s.transform && s.transform !== "none") css.push(`text-transform:${s.transform}`);
  if (s.align) css.push(`text-align:${s.align}`);
  const p = s.padding;
  if (p != null && p !== "") css.push(`padding:${mm(p)}`);
  const b = s.border;
  if (b && num(b.width) > 0) {
    const decl = `${num(b.width)}mm ${b.style || "solid"} ${b.color || "#9ca3af"}`;
    const sides = b.sides || "tblr";
    if (sides === "tblr") css.push(`border:${decl}`);
    else {
      if (sides.includes("t")) css.push(`border-top:${decl}`);
      if (sides.includes("b")) css.push(`border-bottom:${decl}`);
      if (sides.includes("l")) css.push(`border-left:${decl}`);
      if (sides.includes("r")) css.push(`border-right:${decl}`);
    }
  }
  if (s.radius) css.push(`border-radius:${mm(s.radius)}`);
  if (!BLOCK_TYPES.has(el.type)) {
    css.push("display:flex", "flex-direction:column");
    const v = s.vAlign || "top";
    css.push(`justify-content:${v === "middle" ? "center" : v === "bottom" ? "flex-end" : "flex-start"}`);
  }
  return css.join(";");
}

/** A value safe inside one CSS declaration. */
const cssVal = (v) => String(v ?? "").replace(/[;{}<>"\\]/g, "");

/**
 * Colour rules: [{ when, color, background, bold, italic, underline, strike, stop }].
 * Every rule whose `when` is true adds its style, in order (a later rule wins a
 * property); `stop` ends the list at the first match. "" when none apply.
 */
export function ruleCss(rules, ctx) {
  if (!Array.isArray(rules) || !rules.length) return "";
  const out = [];
  for (const r of rules) {
    if (!r || !r.when) continue;
    const v = evaluate(r.when, ctx);
    if (isErr(v) || !truthy(v)) continue;
    if (r.color) out.push(`color:${cssVal(r.color)}`);
    if (r.background) out.push(`background:${cssVal(r.background)}`);
    if (r.bold) out.push("font-weight:700");
    if (r.italic) out.push("font-style:italic");
    const deco = [r.underline && "underline", r.strike && "line-through"].filter(Boolean).join(" ");
    if (deco) out.push(`text-decoration:${deco}`);
    if (r.stop) break;
  }
  return out.length ? `${out.join(";")};` : "";
}

/*
 * Label translation, as the old receipts do it (LanguageMasterRepo.TranslatorAsync):
 * the API sends data.i18n = { "Bill Date & Time": "बिल दिनांक", … } from
 * Country_langauge_master for the print's language (none for English); static
 * template text is rewritten phrase by phrase (whole words, any case). On for every
 * template unless theme.translate is false. Field values are never touched.
 */
const I18N_CACHE = new WeakMap();
function i18nMatcher(map) {
  let m = I18N_CACHE.get(map);
  if (m) return m;
  const keys = Object.keys(map).filter((k) => k && map[k] != null && String(map[k]) !== k).sort((a, b) => b.length - a.length);
  const lower = {};
  for (const k of keys) lower[k.toLowerCase()] = String(map[k]);
  const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  m = keys.length ? { re: new RegExp(`(?<![A-Za-z0-9])(?:${keys.map(esc).join("|")})(?![A-Za-z0-9])`, "gi"), lower } : null;
  I18N_CACHE.set(map, m);
  return m;
}
export function translateText(text, ctx) {
  const map = ctx?.data?.i18n;
  if (!text || !map || typeof map !== "object" || ctx.theme?.translate === false) return text;
  const m = i18nMatcher(map);
  if (!m) return text;
  // {{tokens}} are bindings, not words: leave them alone
  return String(text)
    .split(/(\{\{[\s\S]*?\}\})/)
    .map((part) => (part.startsWith("{{") ? part : part.replace(m.re, (w) => m.lower[w.toLowerCase()] ?? w)))
    .join("");
}

/** An element's colour rules; `value` is its own value (field, amount in words, barcode). */
export function elementRuleCss(el, ctx) {
  if (!Array.isArray(el.styleRules) || !el.styleRules.length) return "";
  const value = el.expr ? evaluate(el.expr, ctx) : undefined;
  return ruleCss(el.styleRules, { ...ctx, vars: { ...(ctx.vars || {}), value: isErr(value) ? undefined : value } });
}

const textBlock = (txt, el) => {
  const wrap = el.style?.wrap !== false;
  return `<div class="pb-text${wrap ? "" : " pb-nowrap"}">${escapeHtml(txt)}</div>`;
};

const valueText = (el, v, ctx) => {
  if (isErr(v)) return "#ERR";
  const f = formatValue(v, el.format, ctx.theme);
  if (f == null || f === "") return el.nullText ?? ctx.theme?.nullText ?? "";
  return f;
};

function assetSrc(k, data, opts) {
  if (!k) return "";
  if (data.assets && data.assets[k]) return data.assets[k];
  return opts?.assetUrl ? opts.assetUrl(k) : "";
}

/** The image an element shows. A centre logo or data image that comes out empty falls back to fallbackAssetKey. */
function imageSrc(el, ctx, opts) {
  const data = ctx.data || {};
  if (el.source === "asset") return assetSrc(el.assetKey, data, opts);
  let src = "";
  if (el.source === "expr") {
    const v = evaluate(el.expr || "", ctx);
    src = isErr(v) || v == null ? "" : String(v);
  } else if (el.source === "letterhead") {
    src = data.centre?.LetterheadUrl || "";
  } else {
    src = data.centre?.LogoUrl || "";
  }
  return src || assetSrc(el.fallbackAssetKey, data, opts);
}

const tableColumns = (el) => (Array.isArray(el.columns) ? el.columns : []);

function columnAlign(col, sample) {
  if (col.align && col.align !== "auto") return col.align;
  const t = col.format?.type;
  if (t === "number" || t === "currency" || t === "percent") return "right";
  if (isNum(sample) || (typeof sample === "string" && NUMERIC_RE.test(sample) && /\.\d{1,4}$/.test(sample.trim())))
    return "right";
  return "left";
}

/** The rows a table/detail binds to: dataset expression, filtered and sorted. */
export function datasetRows(src, ctx, { filter, sortBy, sortDesc } = {}) {
  if (!src) return [];
  const v = evaluate(src, ctx);
  let rows = isErr(v) || v == null ? [] : Array.isArray(v) ? v : [v];
  if (filter) {
    rows = rows.filter((r, i) => truthy(evaluate(filter, { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: i, rowNumber: i + 1 } })));
  }
  if (sortBy) {
    const keyed = rows.map((r, i) => ({ r, k: evaluate(sortBy, { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: i } }) }));
    keyed.sort((a, b) => {
      const x = a.k;
      const y = b.k;
      let c;
      if (isNumericLike(x) && isNumericLike(y)) c = toNumber(x) - toNumber(y);
      else c = String(x ?? "").localeCompare(String(y ?? ""));
      return sortDesc ? -c : c;
    });
    rows = keyed.map((k) => k.r);
  }
  return rows;
}

/**
 * A table's `groupBy` groups over its printed rows: the key of each row, the rows of the
 * group a row belongs to (consecutive rows with the same key), and whether a row ends its group.
 */
function tableGroups(el, shown, ctx, rows) {
  if (!el.groupBy) return null;
  const keys = shown.map((r, i) => {
    const g = evaluate(el.groupBy, { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: i } });
    return { g, key: isErr(g) ? "#ERR" : g == null ? "" : String(g) };
  });
  const span = (i) => {
    let a = i;
    let b = i;
    while (a > 0 && keys[a - 1].key === keys[i].key) a--;
    while (b < keys.length - 1 && keys[b + 1].key === keys[i].key) b++;
    return [a, b];
  };
  return {
    keys,
    rowsAt: (i) => {
      const [a, b] = span(i);
      return shown.slice(a, b + 1);
    },
    isLast: (i) => i === keys.length - 1 || keys[i + 1].key !== keys[i].key,
  };
}

/**
 * The rows a table adds around each group (groupBy): the heading (groupText, else the key),
 * an optional note under it (groupNoteText — printed only when not empty), and an optional
 * total after the group's last row (groupFooterText + groupFooterExpr / groupFooterFormat:
 * the text over the columns before the last, the value right-aligned in the last). All three
 * see the group's rows as `rows` and the key as {{group}}. `n` = the table's column count.
 */
function groupRowsHtml(el, gctx, n, theme, { cellPad, vPad, groupCss, subCss }) {
  const label = el.groupText ? interpolate(el.groupText, gctx) : String(gctx.vars.group ?? "");
  const head = `<tr class="pb-grouprow"><td colspan="${n}" style="${cellPad}${vPad(0.8)}${groupCss}">${escapeHtml(label)}</td></tr>`;
  const noteTxt = el.groupNoteText ? interpolate(el.groupNoteText, gctx).trim() : "";
  const note = noteTxt ? `<tr class="pb-subrow pb-groupnote"><td colspan="${n}" style="${cellPad}${vPad(0.5)}${subCss}">${escapeHtml(noteTxt)}</td></tr>` : "";
  let foot = "";
  if (el.groupFooterText || el.groupFooterExpr) {
    const text = el.groupFooterText ? interpolate(el.groupFooterText, gctx) : "";
    let val = "";
    if (el.groupFooterExpr) {
      const v = evaluate(el.groupFooterExpr, gctx);
      val = isErr(v) ? "#ERR" : formatValue(v, el.groupFooterFormat, theme) ?? "";
    }
    const css = `${cellPad}${vPad(0.8)}font-weight:700;border-top:0.25mm dotted #6b7280;`;
    foot =
      n > 1
        ? `<tr class="pb-groupfoot"><td colspan="${n - 1}" style="text-align:right;${css}">${escapeHtml(text)}</td><td style="text-align:right;${css}">${escapeHtml(val)}</td></tr>`
        : `<tr class="pb-groupfoot"><td style="text-align:right;${css}">${escapeHtml([text, val].filter(Boolean).join(" "))}</td></tr>`;
  }
  return { head, note, foot };
}

/**
 * A table as separate pieces so the paginator can cut it between rows:
 * { open, head, rows[], foot, close, count }.
 */
export function tableParts(el, ctx, { maxRows } = {}) {
  const theme = ctx.theme || DEFAULT_THEME;
  const cols = tableColumns(el);
  // nested detail: a table inside a detail band sees that band's row as `parent`
  // (filter: ParentID == parent.ID)
  if (ctx.row && typeof ctx.row === "object" && !Array.isArray(ctx.row)) ctx = { ...ctx, vars: { ...(ctx.vars || {}), parent: ctx.row } };
  const rows = el._rows || datasetRows(el.dataset, ctx, el);
  const shown = maxRows != null ? rows.slice(0, maxRows) : rows;
  const totalW = cols.reduce((a, c) => a + Math.max(1, num(c.width, 20)), 0) || 1;
  const sample = (c) => {
    for (const r of rows.slice(0, 5)) {
      const v = evaluate(c.expr || "", { ...ctx, row: r, rows });
      if (v != null && v !== "" && !isErr(v)) return v;
    }
    return null;
  };
  const rtl = theme.direction === "rtl";
  const aligns = cols.map((c) => {
    const a = columnAlign(c, sample(c));
    return rtl ? (a === "left" ? "right" : a === "right" ? "left" : a) : a;
  });
  const grid = el.grid || "lines";
  const hs = el.headerStyle || {};
  const fs = el.footerStyle || {};
  const bodyFont = el.style?.fontSize ? `font-size:${num(el.style.fontSize)}pt;` : "";
  const cls = `pb-table pb-grid-${grid}${el.zebra !== false ? " pb-zebra" : ""}`;
  const rowMin = num(el.rowMinHeight) > 0 ? `height:${mm(el.rowMinHeight)};` : "";
  const cellPad =
    (el.cellPadding != null && el.cellPadding !== "" ? `padding:${mm(el.cellPadding)} ${mm(num(el.cellPadding) * 1.4)};` : "") +
    (el.valign === "middle" || el.valign === "bottom" ? `vertical-align:${el.valign};` : "");
  const open =
    `<table class="${cls}" style="${bodyFont}">` +
    `<colgroup>${cols.map((c) => `<col style="width:${((Math.max(1, num(c.width, 20)) / totalW) * 100).toFixed(3)}%">`).join("")}</colgroup>`;
  const headCss = [
    hs.background ? `background:${hs.background}` : "",
    hs.color ? `color:${hs.color}` : "",
    hs.fontSize ? `font-size:${num(hs.fontSize)}pt` : "",
    hs.fontWeight ? `font-weight:${hs.fontWeight}` : "",
  ].filter(Boolean).join(";");
  const head =
    el.showHeader === false
      ? ""
      : `<thead><tr>${cols
          // a header breaks between words only, whatever the column's fit: a header word wider than its column
          // (a narrower paper's "S.No." or "Amount") shrinks instead of splitting into "S.N / o."
          .map((c, i) => `<th class="pb-fitw" style="text-align:${c.headerAlign || aligns[i]};${cellPad}${headCss}">${escapeHtml(interpolate(translateText(c.header ?? "", ctx), ctx))}</th>`)
          .join("")}</tr></thead>`;
  // Group heading rows (a full-width row whenever `groupBy` changes between
  // consecutive main rows) and sub-lines (rows matching `subRowIf`, printed as
  // one text cell under the columns after the first, e.g. a package's contents).
  // rowNumber counts main rows only; subNumber counts sub-lines.
  const gs = el.groupStyle || {};
  const groupCss = [gs.background ? `background:${gs.background}` : "", gs.color ? `color:${gs.color}` : "", gs.fontSize ? `font-size:${num(gs.fontSize)}pt` : ""].filter(Boolean).join(";");
  const ss = el.subRowStyle || {};
  // inline, after the cell padding (a stylesheet rule would lose to it)
  const subCss = [`padding-left:${mm(ss.indent ?? 4)}`, ss.color ? `color:${ss.color}` : "", ss.fontSize ? `font-size:${num(ss.fontSize)}pt` : "", ss.italic ? "font-style:italic" : ""].filter(Boolean).join(";");
  // lighter rows than items: half the vertical padding for sub-lines, 0.8 for headings
  const vPad = (f) => (cellPad ? `padding-top:${mm(num(el.cellPadding) * f)};padding-bottom:${mm(num(el.cellPadding) * f)};` : "");
  if (el._stack) return stackedTableParts(el, ctx, { cols, rows, shown, aligns, cellPad, headCss, groupCss, subCss, vPad, bodyFont, cls, fs });
  const colN = cols.length || 1;
  const rowHtml = [];
  const keep = [];
  const data = []; // the data row each printed row shows (null: group heading, sub-line) — page totals read it
  let mainNo = 0;
  let prevMain = false; // the last printed row is a main row (its first sub-line keeps with it)
  let subNo = 0;
  let groupNo = 0; // main rows counted within the current group ({{groupRowNumber}})
  let lastGroup = null;
  const G = tableGroups(el, shown, ctx, rows);
  const gctxAt = (base, idx) => {
    const gr = G.rowsAt(idx);
    return { ...base, rows: gr, vars: { ...base.vars, group: G.keys[idx].g, groupCount: gr.length } };
  };
  const groupTail = (base, idx) => {
    if (!G || !G.isLast(idx)) return;
    const { foot } = groupRowsHtml(el, gctxAt(base, idx), colN, theme, { cellPad, vPad, groupCss, subCss });
    if (!foot) return;
    if (keep.length) keep[keep.length - 1] = true; // the total travels with the group's last row
    rowHtml.push(foot);
    keep.push(false);
    data.push(null);
  };
  shown.forEach((r, idx) => {
    const base = { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: idx, rowNumber: mainNo, subNumber: subNo, groupRowNumber: groupNo } };
    if (el.subRowIf && truthy(evaluate(el.subRowIf, base))) {
      subNo++;
      // a sub-line never starts a page without its main row: the first one after a main row keeps that row with it
      if (prevMain && keep.length) keep[keep.length - 1] = true;
      prevMain = false;
      const sctx = { ...base, vars: { ...base.vars, subNumber: subNo } };
      const lead = colN > 1 ? `<td style="${cellPad}"></td>` : "";
      rowHtml.push(`<tr class="pb-subrow">${lead}<td colspan="${Math.max(1, colN - 1)}" style="${cellPad}${vPad(0.5)}${subCss}">${escapeHtml(interpolate(el.subRowText ?? "", sctx))}</td></tr>`);
      keep.push(false);
      data.push(null);
      groupTail(base, idx);
      return;
    }
    if (G && G.keys[idx].key !== lastGroup) {
      lastGroup = G.keys[idx].key;
      groupNo = 0;
      const { head, note } = groupRowsHtml(el, gctxAt(base, idx), colN, theme, { cellPad, vPad, groupCss, subCss });
      rowHtml.push(head);
      keep.push(true);
      data.push(null);
      if (note) {
        rowHtml.push(note);
        keep.push(true);
        data.push(null);
      }
    }
    mainNo++;
    groupNo++;
    const rctx = { ...base, vars: { ...base.vars, rowNumber: mainNo, groupRowNumber: groupNo } };
    // row rules colour every cell of the row; a column's own rules come after (and win)
    const rowRule = ruleCss(el.rowRules, rctx);
    rowHtml.push(
      `<tr class="${(mainNo - 1) % 2 ? "pb-odd" : "pb-even"}" style="${rowMin}">${cols
        .map((c, i) => {
          const v = c.expr ? evaluate(c.expr, rctx) : null;
          const txt = isErr(v) ? "#ERR" : (() => {
            const f = formatValue(v, c.format, theme);
            return f == null || f === "" ? c.nullText ?? "" : f;
          })();
          const bold = (c.bold ? "font-weight:600;" : "") + rowRule + ruleCss(c.styleRules, { ...rctx, vars: { ...rctx.vars, value: v } });
          // fit "shrink": one line, font made smaller (in measureTable) until the value fits; never cut off
          if (c.fit === "shrink")
            return `<td class="pb-fit" style="text-align:${aligns[i]};${cellPad}white-space:nowrap;${bold}"><span class="pb-fitv">${escapeHtml(txt)}</span></td>`;
          const wrap = c.wrap === false ? "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" : "";
          // fit "words": wraps at spaces; a single word wider than the cell gets a smaller font (in measureTable)
          if (c.fit === "words") return `<td class="pb-fitw" style="text-align:${aligns[i]};${cellPad}${bold}">${escapeHtml(txt)}</td>`;
          return `<td style="text-align:${aligns[i]};${cellPad}${wrap}${bold}">${escapeHtml(txt)}</td>`;
        })
        .join("")}</tr>`,
    );
    keep.push(false);
    data.push(r);
    prevMain = true;
    groupTail(base, idx);
  });
  if (!rowHtml.length && el.emptyText) {
    rowHtml.push(`<tr class="pb-empty"><td colspan="${cols.length || 1}" style="${cellPad}">${escapeHtml(interpolate(el.emptyText, ctx))}</td></tr>`);
  }
  const hasFooter = el.showFooter && cols.some((c) => c.footerText || c.footerExpr);
  const footCss = [fs.background ? `background:${fs.background}` : "", fs.color ? `color:${fs.color}` : "", fs.fontSize ? `font-size:${num(fs.fontSize)}pt` : ""].filter(Boolean).join(";");
  const fctx = { ...ctx, rows };
  const foot = hasFooter
    ? `<tfoot><tr>${cols
        .map((c, i) => {
          let txt = "";
          if (c.footerExpr) {
            const v = evaluate(c.footerExpr, fctx);
            txt = isErr(v) ? "#ERR" : formatValue(v, c.footerFormat || c.format, theme) ?? "";
          } else if (c.footerText) txt = interpolate(c.footerText, fctx);
          if (c.fit === "shrink")
            return `<td class="pb-fit" style="text-align:${c.footerAlign || aligns[i]};${cellPad}white-space:nowrap;${footCss}"><span class="pb-fitv">${escapeHtml(txt)}</span></td>`;
          return `<td style="text-align:${c.footerAlign || aligns[i]};${cellPad}${footCss}">${escapeHtml(txt)}</td>`;
        })
        .join("")}</tr></tfoot>`
    : "";
  return { open, head, rows: rowHtml, keep, data, foot, close: "</table>", count: rowHtml.length, dataCount: rows.length };
}

/**
 * A table printed as stacked rows on a narrow paper (table `stackOn` holds the
 * profile). Same pieces as tableParts, so it paginates the same way; every
 * printed line is its own <tr>, the lines of one record are kept together.
 *  - "twoLine": line 1 = the columns marked `line: 1` (else the widest one),
 *    full width; line 2 = the other columns side by side (e.g. qty · rate · amount).
 *  - "keyValue": one "header … value" line per column, a rule between records.
 */
function stackedTableParts(el, ctx, p) {
  const theme = ctx.theme || DEFAULT_THEME;
  const { cols, rows, shown, aligns, cellPad, headCss, groupCss, subCss, vPad, bodyFont, cls, fs } = p;
  const kv = el._stack === "keyValue";
  let first = cols.map((c, i) => (c.line === 1 || c.line === "1" ? i : -1)).filter((i) => i >= 0);
  if (!kv && !first.length && cols.length) {
    let w = -1;
    cols.forEach((c, i) => {
      if (num(c.width, 20) > w) {
        w = num(c.width, 20);
        first = [i];
      }
    });
  }
  const second = kv ? [] : cols.map((_, i) => i).filter((i) => !first.includes(i));
  // automatic stacking (column roles known): line 2 = the other text columns on the left,
  // "qty × rate = amount" on the right. A ledger (several amount columns, no qty / rate: Debit / Credit)
  // puts them all right, each under its own header ("Credit 5,250.00"), so no figure prints without its name.
  const fig = !kv && el._figures && second.length ? (() => {
    const role = (i) => cols[i]._role;
    const qty = second.find((i) => role(i) === "qty");
    const rate = second.find((i) => role(i) === "rate");
    const all = second.filter((i) => role(i) === "amount");
    const ledger = all.length > 1 && qty == null && rate == null;
    const amount = ledger ? null : [...all].reverse()[0];
    const amounts = ledger ? all : [];
    const right = [qty, rate, ...(ledger ? amounts : [amount])].filter((i) => i != null);
    return { qty, rate, amount, amounts, right, left: second.filter((i) => !right.includes(i)) };
  })() : null;
  // head: the header row ("Debit / Credit"); else a record ("Debit 70,000.00", empty amounts left out)
  const labelled = (get, head) =>
    fig.amounts
      .map((i) => {
        const t = get(i);
        return t === "" || t == null ? "" : head ? t : `${interpolate(cols[i].header ?? "", ctx)} ${t}`;
      })
      .filter((x) => x !== "")
      .join(head ? " / " : " · ");
  const figText = (get, head = false) => {
    const a = fig.amounts.length ? labelled(get, head) : fig.amount != null ? get(fig.amount) : "";
    const qr = [fig.qty, fig.rate].filter((i) => i != null).map(get).filter((x) => x !== "").join(" × ");
    return qr && a ? `${qr} = ${a}` : qr || a;
  };
  const n = kv ? 2 : fig ? (fig.left.length && fig.right.length ? 2 : 1) : Math.max(1, second.length);
  const w2 = second.reduce((a, i) => a + Math.max(1, num(cols[i].width, 20)), 0) || 1;
  const colgroup = kv
    ? `<col style="width:42%"><col style="width:58%">`
    : fig
      ? n === 2 ? `<col style="width:48%"><col style="width:52%">` : `<col style="width:100%">`
      : second.length
      ? second.map((i) => `<col style="width:${((Math.max(1, num(cols[i].width, 20)) / w2) * 100).toFixed(3)}%">`).join("")
      : `<col style="width:100%">`;
  const open = `<table class="${cls} pb-stacked pb-stack-${kv ? "kv" : "two"}" style="${bodyFont}"><colgroup>${colgroup}</colgroup>`;
  const hdr = (c) => escapeHtml(interpolate(translateText(c.header ?? "", ctx), ctx));
  let head = "";
  if (!kv && el.showHeader !== false) {
    const l1 = first.map((i) => hdr(cols[i])).filter(Boolean).join(" · ");
    head =
      `<thead>${l1 ? `<tr><th colspan="${n}" style="text-align:left;${cellPad}${headCss}">${l1}</th></tr>` : ""}` +
      (fig
        ? `<tr>${fig.left.length ? `<th style="text-align:left;${cellPad}${headCss}">${fig.left.map((i) => hdr(cols[i])).join(" · ")}</th>` : ""}${fig.right.length ? `<th style="text-align:right;${cellPad}${headCss}">${escapeHtml(figText((i) => interpolate(translateText(cols[i].header ?? "", ctx), ctx), true))}</th>` : ""}</tr>`
        : second.length ? `<tr>${second.map((i) => `<th style="text-align:${cols[i].headerAlign || aligns[i]};${cellPad}${headCss}">${hdr(cols[i])}</th>`).join("")}</tr>` : "") +
      `</thead>`;
  }
  const cellText = (c, rctx) => {
    const v = c.expr ? evaluate(c.expr, rctx) : null;
    if (isErr(v)) return "#ERR";
    const f = formatValue(v, c.format, theme);
    return f == null || f === "" ? c.nullText ?? "" : f;
  };
  const rowHtml = [];
  const keep = [];
  const data = [];
  let mainNo = 0;
  let prevMain = false; // the last printed row is a main row (its first sub-line keeps with it)
  let subNo = 0;
  let groupNo = 0;
  let lastGroup = null;
  const G = tableGroups(el, shown, ctx, rows);
  const gctxAt = (base, idx) => {
    const gr = G.rowsAt(idx);
    return { ...base, rows: gr, vars: { ...base.vars, group: G.keys[idx].g, groupCount: gr.length } };
  };
  // a group's total on a stacked table: label … value over the full width
  const groupTail = (base, idx) => {
    if (!G || !G.isLast(idx)) return;
    const { foot } = groupRowsHtml(el, gctxAt(base, idx), n, theme, { cellPad, vPad, groupCss, subCss }); // n = 1: text and value in one right-aligned cell
    if (!foot) return;
    if (keep.length) keep[keep.length - 1] = true;
    rowHtml.push(foot);
    keep.push(false);
    data.push(null);
  };
  shown.forEach((r, idx) => {
    const base = { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: idx, rowNumber: mainNo, subNumber: subNo, groupRowNumber: groupNo } };
    if (el.subRowIf && truthy(evaluate(el.subRowIf, base))) {
      subNo++;
      // a sub-line never starts a page without its main row: the first one after a main row keeps that row with it
      if (prevMain && keep.length) keep[keep.length - 1] = true;
      prevMain = false;
      const sctx = { ...base, vars: { ...base.vars, subNumber: subNo } };
      rowHtml.push(`<tr class="pb-subrow"><td colspan="${n}" style="${cellPad}${vPad(0.5)}${subCss}">${escapeHtml(interpolate(el.subRowText ?? "", sctx))}</td></tr>`);
      keep.push(false);
      data.push(null);
      groupTail(base, idx);
      return;
    }
    if (G && G.keys[idx].key !== lastGroup) {
      lastGroup = G.keys[idx].key;
      groupNo = 0;
      const { head, note } = groupRowsHtml(el, gctxAt(base, idx), n, theme, { cellPad, vPad, groupCss, subCss });
      rowHtml.push(head);
      keep.push(true);
      data.push(null);
      if (note) {
        rowHtml.push(note);
        keep.push(true);
        data.push(null);
      }
    }
    mainNo++;
    groupNo++;
    const rctx = { ...base, vars: { ...base.vars, rowNumber: mainNo, groupRowNumber: groupNo } };
    const zebra = (mainNo - 1) % 2 ? "pb-odd" : "pb-even";
    const rowRule = ruleCss(el.rowRules, rctx);
    const colRule = (c) => (Array.isArray(c.styleRules) && c.styleRules.length ? ruleCss(c.styleRules, { ...rctx, vars: { ...rctx.vars, value: c.expr ? evaluate(c.expr, rctx) : null } }) : "");
    if (kv) {
      cols.forEach((c, i) => {
        const sep = i === 0 && mainNo > 1 ? "border-top:0.3mm solid #9ca3af;" : "";
        rowHtml.push(
          `<tr class="${zebra} pb-kv"><td style="${cellPad}${vPad(0.4)}${sep}color:#4b5563">${hdr(c)}</td>` +
            `<td${c.fit === "words" || c.fit === "shrink" ? ` class="pb-fitw"` : ""} style="text-align:right;${cellPad}${vPad(0.4)}${sep}${c.bold ? "font-weight:600;" : ""}${rowRule}${colRule(c)}">${escapeHtml(cellText(c, rctx))}</td></tr>`,
        );
        keep.push(i < cols.length - 1);
        data.push(i === 0 ? r : null);
      });
      prevMain = true;
      groupTail(base, idx);
      return;
    }
    const l1 = first.map((i) => cellText(cols[i], rctx)).filter((x) => x !== "").join(" ");
    const bold1 = first.some((i) => cols[i].bold) ? "font-weight:600;" : "";
    if (first.length) {
      rowHtml.push(`<tr class="${zebra} pb-stack1"><td colspan="${n}" style="${cellPad}${vPad(0.6)}${bold1}${rowRule}${first.map((i) => colRule(cols[i])).join("")}">${escapeHtml(l1)}</td></tr>`);
      keep.push(second.length > 0);
      data.push(r);
    }
    if (fig) {
      const leftTxt = fig.left
        .map((i) => {
          const t = cellText(cols[i], rctx);
          return t === "" ? "" : cols[i]._role === "amount" || cols[i]._role === "qty" || cols[i]._role === "rate" ? `${interpolate(cols[i].header ?? "", ctx)} ${t}` : t;
        })
        .filter((x) => x !== "")
        .join(" · ");
      const rightTxt = figText((i) => cellText(cols[i], rctx));
      rowHtml.push(
        `<tr class="${zebra} pb-stack2">` +
          (fig.left.length ? `<td class="pb-fitw" style="text-align:left;${cellPad}${vPad(0.6)}${rowRule}">${escapeHtml(leftTxt)}</td>` : "") +
          (fig.right.length ? `<td class="pb-fitw" style="text-align:right;${cellPad}${vPad(0.6)}font-weight:600;${rowRule}">${escapeHtml(rightTxt)}</td>` : "") +
          `</tr>`,
      );
      keep.push(false);
      data.push(first.length ? null : r);
    } else if (second.length) {
      rowHtml.push(
        `<tr class="${zebra} pb-stack2">${second
          .map((i) => {
            const c = cols[i];
            const txt = cellText(c, rctx);
            const bold = (c.bold ? "font-weight:600;" : "") + rowRule + colRule(c);
            if (c.fit === "shrink") return `<td class="pb-fit" style="text-align:${aligns[i]};${cellPad}${vPad(0.6)}white-space:nowrap;${bold}"><span class="pb-fitv">${escapeHtml(txt)}</span></td>`;
            return `<td${c.fit === "words" ? ` class="pb-fitw"` : ""} style="text-align:${aligns[i]};${cellPad}${vPad(0.6)}${bold}">${escapeHtml(txt)}</td>`;
          })
          .join("")}</tr>`,
      );
      keep.push(false);
      data.push(first.length ? null : r);
    }
    prevMain = true;
    groupTail(base, idx);
  });
  if (!rowHtml.length && el.emptyText) {
    rowHtml.push(`<tr class="pb-empty"><td colspan="${n}" style="${cellPad}">${escapeHtml(interpolate(el.emptyText, ctx))}</td></tr>`);
    keep.push(false);
    data.push(null);
  }
  const footCss = [fs.background ? `background:${fs.background}` : "", fs.color ? `color:${fs.color}` : "", fs.fontSize ? `font-size:${num(fs.fontSize)}pt` : ""].filter(Boolean).join(";");
  const fctx = { ...ctx, rows };
  const footOf = (c) => {
    if (c.footerExpr) {
      const v = evaluate(c.footerExpr, fctx);
      return isErr(v) ? "#ERR" : formatValue(v, c.footerFormat || c.format, theme) ?? "";
    }
    return c.footerText ? interpolate(c.footerText, fctx) : "";
  };
  let foot = "";
  if (el.showFooter && cols.some((c) => c.footerText || c.footerExpr)) {
    if (kv) {
      foot = `<tfoot>${cols
        .filter((c) => c.footerText || c.footerExpr)
        .map((c) => `<tr><td style="${cellPad}${footCss}">${hdr(c)}</td><td style="text-align:right;${cellPad}${footCss}">${escapeHtml(footOf(c))}</td></tr>`)
        .join("")}</tfoot>`;
    } else {
      const f1 = first.map((i) => footOf(cols[i])).filter(Boolean).join(" ");
      foot =
        `<tfoot>${f1 ? `<tr><td colspan="${n}" style="${cellPad}${footCss}">${escapeHtml(f1)}</td></tr>` : ""}` +
        (fig
          ? `<tr>${fig.left.length ? `<td style="text-align:left;${cellPad}${footCss}">${escapeHtml(fig.left.map((i) => footOf(cols[i])).filter(Boolean).join(" · "))}</td>` : ""}${fig.right.length ? `<td style="text-align:right;${cellPad}${footCss}">${escapeHtml(fig.amounts.length ? labelled((i) => footOf(cols[i]), false) : fig.amount != null ? footOf(cols[fig.amount]) : "")}</td>` : ""}</tr>`
          : second.length ? `<tr>${second.map((i) => `<td style="text-align:${cols[i].footerAlign || aligns[i]};${cellPad}${footCss}">${escapeHtml(footOf(cols[i]))}</td>`).join("")}</tr>` : "") +
        `</tfoot>`;
    }
  }
  return { open, head, rows: rowHtml, keep, data, foot, close: "</table>", count: rowHtml.length, dataCount: rows.length };
}

/* ---------------------------------------------------------------- crosstab */

const XT_AGG = {
  sum: (v) => v.reduce((a, b) => a + b, 0),
  count: (v) => v.length,
  avg: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null),
  min: (v) => (v.length ? Math.min(...v) : null),
  max: (v) => (v.length ? Math.max(...v) : null),
};

/**
 * A pivot of a row set: one row per `rowExpr` value, one column per `colExpr`
 * value, cells = `agg` (sum|count|avg|min|max) of `valueExpr`. Totals per row
 * (`rowTotals`) and per column (`colTotals`). Pure: { rowKeys, colKeys, cell(r,c), rowTotal(r), colTotal(c), total }.
 */
export function pivot(el, ctx) {
  const rows = datasetRows(el.dataset, ctx, el);
  const agg = XT_AGG[el.agg] || XT_AGG.sum;
  const key = (src, r, i) => {
    if (!src) return "";
    const v = evaluate(src, { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: i, rowNumber: i + 1 } });
    return isErr(v) ? "#ERR" : v == null ? "" : String(v);
  };
  const rowKeys = [];
  const colKeys = [];
  const seenR = new Set();
  const seenC = new Set();
  const cells = new Map(); // "r\u0001c" → numbers
  const byRow = new Map();
  const byCol = new Map();
  const all = [];
  rows.forEach((r, i) => {
    const rk = key(el.rowExpr, r, i);
    const ck = key(el.colExpr, r, i);
    if (!seenR.has(rk)) (seenR.add(rk), rowKeys.push(rk));
    if (!seenC.has(ck)) (seenC.add(ck), colKeys.push(ck));
    let n;
    if (el.agg === "count") n = 1;
    else {
      const v = el.valueExpr ? evaluate(el.valueExpr, { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: i } }) : 1;
      n = toNumber(v);
      if (isNaN(n)) return;
    }
    const k = `${rk}\u0001${ck}`;
    (cells.get(k) || cells.set(k, []).get(k)).push(n);
    (byRow.get(rk) || byRow.set(rk, []).get(rk)).push(n);
    (byCol.get(ck) || byCol.set(ck, []).get(ck)).push(n);
    all.push(n);
  });
  const cmp = (a, b) => (isNumericLike(a) && isNumericLike(b) ? toNumber(a) - toNumber(b) : String(a).localeCompare(String(b)));
  if (el.colSort !== "none") colKeys.sort(cmp);
  if (el.rowSort === "label") rowKeys.sort(cmp);
  const out = (list) => (list && list.length ? agg(list) : null);
  const max = Math.max(1, num(el.maxCols, 24));
  return {
    rowKeys,
    colKeys: colKeys.slice(0, max),
    cut: Math.max(0, colKeys.length - max),
    cell: (r, c) => out(cells.get(`${r}\u0001${c}`)),
    rowTotal: (r) => out(byRow.get(r)),
    colTotal: (c) => out(byCol.get(c)),
    total: out(all),
  };
}

/** A crosstab as table pieces: a table element built from the pivot, so it paginates like one. */
function crosstabParts(el, ctx, opts) {
  const p = pivot(el, ctx);
  const lit = (v) => (v == null ? "null" : isNum(v) ? String(v) : `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
  const fmt = el.format || { type: "number", decimals: el.agg === "count" ? 0 : 2 };
  // widths are shares: the label column keeps its millimetres, the rest split what is left
  const firstW = Math.max(10, num(el.firstColWidth, 28));
  const nVal = p.colKeys.length + (el.rowTotals !== false ? 1 : 0);
  const valW = Math.max(8, (Math.max(num(el.w, 120), firstW + 10) - firstW) / Math.max(1, nVal));
  const noBraces = (s) => String(s).replace(/\{\{/g, "{ {");
  const cols = [
    { id: "__r", header: el.rowHeader ?? "", expr: "__r", width: firstW, align: "left", bold: true, footerText: el.colTotals !== false ? el.totalLabel ?? "Total" : "" },
    ...p.colKeys.map((ck, i) => ({ id: `__c${i}`, header: noBraces(ck === "" ? el.blankLabel ?? "—" : ck), expr: `__c${i}`, width: valW, align: "right", format: fmt, nullText: el.emptyCell ?? "", footerExpr: el.colTotals !== false ? lit(p.colTotal(ck)) : "", footerFormat: fmt })),
  ];
  if (el.rowTotals !== false) cols.push({ id: "__t", header: el.totalLabel ?? "Total", expr: "__t", width: valW, align: "right", bold: true, format: fmt, footerExpr: el.colTotals !== false ? lit(p.total) : "", footerFormat: fmt });
  const rows = p.rowKeys.map((rk) => {
    const r = { __r: rk === "" ? el.blankLabel ?? "—" : rk, __t: p.rowTotal(rk) };
    p.colKeys.forEach((ck, i) => {
      r[`__c${i}`] = p.cell(rk, ck);
    });
    return r;
  });
  const t = { ...el, type: "table", dataset: "", filter: "", sortBy: "", groupBy: "", subRowIf: "", columns: cols, _rows: rows, showFooter: el.colTotals !== false, repeatHeader: el.repeatHeader !== false };
  return tableParts(t, ctx, opts);
}

/* ------------------------------------------------------------------- chart */

const CHART_COLORS = ["#2563eb", "#f59e0b", "#db2777", "#16a34a", "#7c3aed", "#0891b2", "#dc2626", "#65a30d", "#ea580c", "#475569"];

/** Category labels and series values of a chart: rows grouped by labelExpr, each series aggregated. */
export function chartData(el, ctx) {
  const rows = datasetRows(el.dataset, ctx, el);
  const series = (Array.isArray(el.series) && el.series.length ? el.series : [{ label: el.valueLabel || "", expr: el.valueExpr || "" }]).filter((s) => s && (s.expr || el.agg === "count"));
  const agg = XT_AGG[el.agg] || XT_AGG.sum;
  const labels = [];
  const groups = new Map();
  rows.forEach((r, i) => {
    const c = { ...ctx, row: r, rows, vars: { ...(ctx.vars || {}), rowIndex: i, rowNumber: i + 1 } };
    const lv = el.labelExpr ? evaluate(el.labelExpr, c) : i + 1;
    const label = isErr(lv) ? "#ERR" : lv == null ? "" : String(formatValue(lv, el.labelFormat, ctx.theme));
    if (!groups.has(label)) {
      groups.set(label, series.map(() => []));
      labels.push(label);
    }
    const g = groups.get(label);
    series.forEach((s, k) => {
      if (el.agg === "count") return g[k].push(1);
      const n = toNumber(evaluate(s.expr, c));
      if (!isNaN(n)) g[k].push(n);
    });
  });
  let points = labels.map((label) => ({ label, values: groups.get(label).map((v) => (v.length ? agg(v) : 0)) }));
  if (el.sortBy === "value") points.sort((a, b) => (el.sortDesc === false ? a.values[0] - b.values[0] : b.values[0] - a.values[0]));
  else if (el.sortBy === "label") points.sort((a, b) => (isNumericLike(a.label) && isNumericLike(b.label) ? toNumber(a.label) - toNumber(b.label) : a.label.localeCompare(b.label)));
  if (num(el.limit) > 0 && points.length > num(el.limit)) {
    const keep = points.slice(0, num(el.limit) - (el.othersLabel ? 1 : 0));
    if (el.othersLabel) {
      const rest = points.slice(keep.length);
      keep.push({ label: el.othersLabel, values: series.map((_, k) => rest.reduce((a, p) => a + p.values[k], 0)) });
    }
    points = keep;
  }
  return { series: series.map((s, k) => ({ label: s.label || "", color: s.color || (Array.isArray(el.colors) && el.colors[k]) || (k === 0 && (el.color || ctx.theme?.accent)) || CHART_COLORS[k % CHART_COLORS.length] })), points };
}

/** A "nice" axis step for a maximum: 1, 2, 2.5 or 5 × 10^n. */
function niceStep(max, ticks = 4) {
  if (!(max > 0)) return 1;
  const raw = max / ticks;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

/**
 * A chart as SVG, drawn in the element's own millimetres (viewBox = w × h, so
 * text keeps its size): bar · hbar · line · area · pie · donut. Values are
 * labelled with `valueFormat`; slices and bars keep series colours.
 */
export function chartSvg(el, ctx) {
  const W = Math.max(10, num(el.w, 80));
  const H = Math.max(10, num(el.h, 50));
  const theme = ctx.theme || DEFAULT_THEME;
  const { series, points } = chartData(el, ctx);
  const fs = (num(el.style?.fontSize) || Math.max(5.5, num(theme.fontSize, 9) - 2)) * 0.3528; // pt → mm
  const vfmt = el.valueFormat || { type: "number", decimals: 0 };
  const fv = (v) => escapeHtml(String(formatValue(v, vfmt, theme) ?? ""));
  const ink = el.style?.color || "#374151";
  const svg = (body) =>
    `<svg class="pb-chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="inherit" font-size="${fs.toFixed(2)}" fill="${ink}">${body}</svg>`;
  if (!points.length) return svg(`<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#9ca3af">${escapeHtml(el.emptyText ?? "No data")}</text>`);
  const kind = el.chartType || "bar";
  const title = el.title ? `<text x="${W / 2}" y="${fs * 1.1}" text-anchor="middle" font-weight="700">${escapeHtml(interpolate(el.title, ctx))}</text>` : "";
  let top = el.title ? fs * 1.9 : fs * 0.6;
  const legendItems = kind === "pie" || kind === "donut" ? points.map((p, i) => ({ label: p.label, color: (Array.isArray(el.colors) && el.colors[i]) || CHART_COLORS[i % CHART_COLORS.length] })) : series.length > 1 || (el.showLegend && series[0]?.label) ? series : [];
  const showLegend = el.showLegend !== false && legendItems.length > 0;

  if (kind === "pie" || kind === "donut") {
    const vals = points.map((p) => Math.max(0, p.values[0] || 0));
    const sum = vals.reduce((a, b) => a + b, 0) || 1;
    const legendW = showLegend ? Math.min(W * 0.45, Math.max(...points.map((p) => p.label.length)) * fs * 0.55 + fs * 2.4 + (el.showValues !== false ? fs * 3.5 : 0)) : 0;
    const R = Math.max(2, Math.min((W - legendW) / 2, (H - top) / 2) - fs * 0.4);
    const cx = (W - legendW) / 2;
    const cy = top + (H - top) / 2;
    const inner = kind === "donut" ? R * (num(el.hole, 55) / 100) : 0;
    let a0 = -Math.PI / 2;
    const parts = [];
    vals.forEach((v, i) => {
      const frac = v / sum;
      if (frac <= 0) return;
      const a1 = a0 + frac * Math.PI * 2;
      const color = legendItems[i].color;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(3)} ${(cy + r * Math.sin(a)).toFixed(3)}`;
      if (frac >= 0.9999) parts.push(inner ? `<circle cx="${cx}" cy="${cy}" r="${(R + inner) / 2}" fill="none" stroke="${color}" stroke-width="${R - inner}"/>` : `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${color}"/>`);
      else parts.push(`<path d="M${p(R, a0)} A${R} ${R} 0 ${large} 1 ${p(R, a1)} ${inner ? `L${p(inner, a1)} A${inner} ${inner} 0 ${large} 0 ${p(inner, a0)}` : `L${cx} ${cy}`}Z" fill="${color}" stroke="#fff" stroke-width="${Math.min(0.4, R / 40)}"/>`);
      if (el.showValues !== false && !showLegend && frac > 0.06) {
        const am = (a0 + a1) / 2;
        const rr = inner ? (R + inner) / 2 : R * 0.62;
        parts.push(`<text x="${(cx + rr * Math.cos(am)).toFixed(2)}" y="${(cy + rr * Math.sin(am) + fs * 0.35).toFixed(2)}" text-anchor="middle" fill="#fff" font-weight="600">${Math.round(frac * 100)}%</text>`);
      }
      a0 = a1;
    });
    if (inner && el.centerText !== "") parts.push(`<text x="${cx}" y="${cy + fs * 0.35}" text-anchor="middle" font-weight="700">${escapeHtml(el.centerText != null ? interpolate(el.centerText, ctx) : String(formatValue(sum, vfmt, theme)))}</text>`);
    if (showLegend) {
      const lx = W - legendW + fs * 0.4;
      const lh = Math.min(fs * 1.5, (H - top) / Math.max(1, points.length));
      let ly = cy - (lh * points.length) / 2 + lh / 2;
      points.forEach((p, i) => {
        parts.push(`<rect x="${lx}" y="${(ly - fs * 0.4).toFixed(2)}" width="${fs * 0.8}" height="${fs * 0.8}" rx="${fs * 0.15}" fill="${legendItems[i].color}"/>`);
        parts.push(`<text x="${(lx + fs * 1.2).toFixed(2)}" y="${(ly + fs * 0.33).toFixed(2)}">${escapeHtml(p.label)}${el.showValues !== false ? ` <tspan fill="#6b7280">${Math.round((vals[i] / sum) * 100)}%</tspan>` : ""}</text>`);
        ly += lh;
      });
    }
    return svg(title + parts.join(""));
  }

  // axes charts
  const stacked = !!el.stacked && kind === "bar";
  const allVals = points.flatMap((p) => (stacked ? [p.values.reduce((a, b) => a + Math.max(0, b), 0)] : p.values));
  const vmax = Math.max(0, ...allVals);
  const vmin = Math.min(0, ...allVals);
  const step = niceStep(vmax - vmin);
  const hi = Math.ceil(vmax / step) * step || step;
  const lo = Math.floor(vmin / step) * step;
  const legendH = showLegend ? fs * 1.6 : 0;
  const bottomLabels = fs * 1.5;
  const tickLabels = [];
  for (let v = lo; v <= hi + step / 2; v += step) tickLabels.push(v);
  const axisW = kind === "hbar" ? Math.min(W * 0.4, Math.max(...points.map((p) => p.label.length)) * fs * 0.52 + fs) : Math.max(...tickLabels.map((v) => String(formatValue(v, vfmt, theme)).length)) * fs * 0.55 + fs * 0.6;
  const x0 = axisW;
  const x1 = W - fs * 0.6;
  const y0 = top + legendH;
  const y1 = H - (kind === "hbar" ? bottomLabels : bottomLabels);
  const parts = [];
  if (showLegend) {
    let lx = x0;
    legendItems.forEach((s) => {
      parts.push(`<rect x="${lx.toFixed(2)}" y="${(top + fs * 0.1).toFixed(2)}" width="${fs * 0.8}" height="${fs * 0.8}" rx="${fs * 0.15}" fill="${s.color}"/>`);
      parts.push(`<text x="${(lx + fs * 1.1).toFixed(2)}" y="${(top + fs * 0.8).toFixed(2)}">${escapeHtml(s.label)}</text>`);
      lx += fs * 2 + s.label.length * fs * 0.55;
    });
  }
  const gridColor = "#e5e7eb";
  if (kind === "hbar") {
    const sx = (v) => x0 + ((v - lo) / (hi - lo || 1)) * (x1 - x0);
    tickLabels.forEach((v) => {
      parts.push(`<line x1="${sx(v).toFixed(2)}" y1="${y0}" x2="${sx(v).toFixed(2)}" y2="${y1}" stroke="${v === 0 ? "#9ca3af" : gridColor}" stroke-width="0.15"/>`);
      parts.push(`<text x="${sx(v).toFixed(2)}" y="${(y1 + fs * 1.1).toFixed(2)}" text-anchor="middle" fill="#6b7280">${fv(v)}</text>`);
    });
    const band = (y1 - y0) / points.length;
    const bh = (band * 0.72) / series.length;
    points.forEach((p, i) => {
      const by = y0 + band * i + band * 0.14;
      parts.push(`<text x="${(x0 - fs * 0.4).toFixed(2)}" y="${(by + (bh * series.length) / 2 + fs * 0.35).toFixed(2)}" text-anchor="end">${escapeHtml(p.label)}</text>`);
      p.values.forEach((v, k) => {
        const a = sx(Math.min(0, v));
        const b = sx(Math.max(0, v));
        parts.push(`<rect x="${a.toFixed(2)}" y="${(by + bh * k).toFixed(2)}" width="${Math.max(0.1, b - a).toFixed(2)}" height="${(bh * 0.92).toFixed(2)}" rx="${Math.min(0.6, bh / 4).toFixed(2)}" fill="${series[k].color}"/>`);
        if (el.showValues !== false) parts.push(`<text x="${(b + fs * 0.3).toFixed(2)}" y="${(by + bh * k + bh * 0.46 + fs * 0.33).toFixed(2)}" fill="#374151">${fv(v)}</text>`);
      });
    });
    return svg(title + parts.join(""));
  }
  const sy = (v) => y1 - ((v - lo) / (hi - lo || 1)) * (y1 - y0);
  tickLabels.forEach((v) => {
    if (el.showGrid !== false || v === 0) parts.push(`<line x1="${x0}" y1="${sy(v).toFixed(2)}" x2="${x1}" y2="${sy(v).toFixed(2)}" stroke="${v === 0 ? "#9ca3af" : gridColor}" stroke-width="0.15"/>`);
    parts.push(`<text x="${(x0 - fs * 0.4).toFixed(2)}" y="${(sy(v) + fs * 0.33).toFixed(2)}" text-anchor="end" fill="#6b7280">${fv(v)}</text>`);
  });
  const band = (x1 - x0) / points.length;
  const maxChars = Math.max(2, Math.floor(band / (fs * 0.55)));
  const short = (s) => (s.length > maxChars ? `${s.slice(0, Math.max(1, maxChars - 1))}…` : s);
  points.forEach((p, i) => parts.push(`<text x="${(x0 + band * (i + 0.5)).toFixed(2)}" y="${(y1 + fs * 1.15).toFixed(2)}" text-anchor="middle" fill="#4b5563">${escapeHtml(short(p.label))}</text>`));
  if (kind === "line" || kind === "area") {
    series.forEach((s, k) => {
      const pts = points.map((p, i) => [x0 + band * (i + 0.5), sy(p.values[k])]);
      const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
      if (kind === "area") parts.push(`<path d="${d} L${pts[pts.length - 1][0].toFixed(2)} ${sy(Math.max(lo, 0)).toFixed(2)} L${pts[0][0].toFixed(2)} ${sy(Math.max(lo, 0)).toFixed(2)}Z" fill="${s.color}" fill-opacity="0.18"/>`);
      parts.push(`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${Math.max(0.35, fs * 0.12).toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"/>`);
      pts.forEach(([x, y], i) => {
        parts.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(fs * 0.22).toFixed(2)}" fill="#fff" stroke="${s.color}" stroke-width="${(fs * 0.1).toFixed(2)}"/>`);
        if (el.showValues !== false && points.length <= 16) parts.push(`<text x="${x.toFixed(2)}" y="${(y - fs * 0.55).toFixed(2)}" text-anchor="middle" fill="#374151">${fv(points[i].values[k])}</text>`);
      });
    });
    return svg(title + parts.join(""));
  }
  const groupW = band * 0.72;
  const bw = stacked ? groupW : groupW / series.length;
  points.forEach((p, i) => {
    const gx = x0 + band * i + (band - groupW) / 2;
    let acc = 0;
    p.values.forEach((v, k) => {
      const color = series.length === 1 && Array.isArray(el.colors) && el.colors.length > 1 ? el.colors[i % el.colors.length] : series[k].color;
      let ya;
      let yb;
      let x;
      if (stacked) {
        ya = sy(acc + Math.max(0, v));
        yb = sy(acc);
        acc += Math.max(0, v);
        x = gx;
      } else {
        ya = sy(Math.max(0, v));
        yb = sy(Math.min(0, v));
        x = gx + bw * k;
      }
      parts.push(`<rect x="${x.toFixed(2)}" y="${ya.toFixed(2)}" width="${(bw * 0.92).toFixed(2)}" height="${Math.max(0.1, yb - ya).toFixed(2)}" rx="${Math.min(0.6, bw / 6).toFixed(2)}" fill="${color}"/>`);
      if (el.showValues !== false && !stacked && bw > fs * 1.2) parts.push(`<text x="${(x + bw * 0.46).toFixed(2)}" y="${(ya - fs * 0.3).toFixed(2)}" text-anchor="middle" fill="#374151">${fv(v)}</text>`);
    });
    if (stacked && el.showValues !== false) parts.push(`<text x="${(gx + groupW / 2).toFixed(2)}" y="${(sy(acc) - fs * 0.3).toFixed(2)}" text-anchor="middle" fill="#374151">${fv(acc)}</text>`);
  });
  return svg(title + parts.join(""));
}

/* -------------------------------------------------------------- sub-report */

/**
 * A sub-report: another published template's report header, groups, detail
 * and report footer printed inside this element's box, reflowed to its width.
 * The API sends the sub template and its own data as data.__sub[templateCode]
 * ({ template, data }; data omitted = the parent's data). Each sub band is one
 * "row" the paginator may cut between, so a long sub-report runs over pages.
 * The sub template sees the parent band's row as `parent`.
 */
function subreportParts(el, ctx, env) {
  const sub = ctx.data && ctx.data.__sub && ctx.data.__sub[el.templateCode];
  const one = (html, h) => ({ open: `<div class="pb-subrep">`, head: "", rows: [html], keep: [false], data: [], foot: "", close: "</div>", count: 1, dataCount: 0, body: (r) => r.join(""), m: { headH: 0, rowH: [h], footH: 0, boxExtra: 0, totalH: h } });
  if (!sub || !sub.template || (env.depth || 0) > 3) {
    const msg = !el.templateCode ? "Sub-report: choose a template" : `Sub-report ${el.templateCode}: not published or not loaded`;
    return one(`<div class="pb-missing">${escapeHtml(msg)}</div>`, Math.min(num(el.h, 10), 6));
  }
  const subTpl = withLanguageDirection(sub.template, ctx.data);
  const own = resolveLayout(subTpl);
  const lay = { ...own, roll: false, contentWidth: num(el.w), k: num(el.w) / (own.designWidth || own.contentWidth || num(el.w)), fontScale: 1, profile: own.designProfile };
  const t2 = adaptTemplate({ ...subTpl, bands: (subTpl.bands || []).filter((b) => !["pageHeader", "pageFooter"].includes(b.type)) }, lay);
  const theme = { ...DEFAULT_THEME, ...(t2.theme || {}), ...(el.inheritTheme !== false ? { fontFamily: ctx.theme?.fontFamily ?? DEFAULT_THEME.fontFamily } : {}) };
  const subData = applyCalculated(sub.data && !el.useParentData ? { ...sub.data, sys: { ...(sub.data.sys || {}), ...(ctx.data.sys || {}) } } : ctx.data);
  const subCtx = { data: subData, row: null, rows: [], vars: { parent: ctx.row && !Array.isArray(ctx.row) ? ctx.row : ctx.vars?.parent }, theme, errors: ctx.errors };
  const detail = bandsOf(t2, "detail")[0];
  if (detail) subCtx.rows = datasetRows(detail.dataset, subCtx, detail);
  const host = env.measureHost.ownerDocument.createElement("div");
  const font = `font-family:${fontStack(theme.fontFamily)};font-size:${theme.fontSize}pt;line-height:${theme.lineHeight};color:${theme.color}`;
  host.style.cssText = `position:relative;width:${mm(el.w)};${font}`;
  env.measureHost.appendChild(host);
  const env2 = { ...env, theme, measureHost: host, depth: (env.depth || 0) + 1 };
  let flow;
  try {
    flow = buildFlow(t2, subCtx, env2);
  } finally {
    host.remove();
  }
  const rows = flow.map((l) => {
    const { html, bg } = bandHtml(l, env2, l.ctx?.vars || {});
    return `<div class="pb-subband" style="position:relative;height:${mm(l.height)};${bg}">${html}</div>`;
  });
  if (!rows.length) return one(el.emptyText ? `<div class="pb-text">${escapeHtml(interpolate(el.emptyText, ctx))}</div>` : "", 0);
  const rowH = flow.map((l) => l.height);
  const totalH = rowH.reduce((a, b) => a + b, 0);
  return { open: `<div class="pb-subrep" style="${font}">`, head: "", rows, keep: flow.map((l, i) => !!l.keepWithNext && i < flow.length - 1), data: [], foot: "", close: "</div>", count: rows.length, dataCount: rows.length, body: (r) => r.join(""), m: { headH: 0, rowH, footH: 0, boxExtra: 0, totalH } };
}

/** Table-like pieces of any splittable element. */
function gridParts(el, ctx, env, opts) {
  if (el.type === "crosstab") return crosstabParts(el, ctx, opts);
  if (el.type === "subreport") return subreportParts(el, ctx, env);
  return tableParts(el, ctx, opts);
}

/**
 * Calculated fields (datasource `calculated`, sent as data.__calc): [{ set, name, expr }]
 * — each row of `set` gets `name` = expr evaluated on it; set "" adds a root value.
 * Applied in order, so a later field may use an earlier one. Pure: returns a copy.
 */
export function applyCalculated(data) {
  const calc = data && Array.isArray(data.__calc) ? data.__calc : [];
  if (!calc.length || data.__calcDone) return data;
  const out = { ...data, __calcDone: true };
  const copied = new Set();
  const errors = new Set();
  for (const c of calc) {
    if (!c || !c.name || !c.expr) continue;
    const set = String(c.set || "").trim();
    if (set) {
      if (!Array.isArray(out[set])) continue;
      if (!copied.has(set)) {
        out[set] = out[set].map((r) => (r && typeof r === "object" ? { ...r } : r));
        copied.add(set);
      }
      const rows = out[set];
      rows.forEach((r, i) => {
        if (!r || typeof r !== "object") return;
        const v = evaluate(c.expr, { data: out, row: r, rows, vars: { rowIndex: i, rowNumber: i + 1 }, theme: DEFAULT_THEME, errors });
        r[c.name] = isErr(v) ? null : v;
      });
    } else {
      const v = evaluate(c.expr, { data: out, row: null, rows: [], vars: {}, theme: DEFAULT_THEME, errors });
      out[c.name] = isErr(v) ? null : v;
    }
  }
  return out;
}

/**
 * The inner HTML of one element (its box is drawn by the caller). Used by the
 * paginator and, at design time, by the builder canvas — so the canvas shows
 * what will print.
 */
export function renderElementHtml(el, ctx, opts = {}) {
  const theme = ctx.theme || DEFAULT_THEME;
  try {
    switch (el.type) {
      case "label":
      case "heading":
        return textBlock(interpolate(el.translate === false ? el.text ?? "" : translateText(el.text ?? "", ctx), ctx, { nullText: el.nullText }), el);
      case "field": {
        const v = el.expr ? evaluate(el.expr, ctx) : null;
        return textBlock(valueText(el, v, ctx), el);
      }
      case "amountWords": {
        const v = el.expr ? evaluate(el.expr, ctx) : null;
        if (isErr(v)) return textBlock("#ERR", el);
        const words = v == null || v === "" ? el.nullText ?? "" : amountInWords(v, { currencyName: el.currencyName ?? "Rupees", subunitName: el.subunitName ?? "Paise", suffix: el.suffix ?? "Only" });
        return textBlock(`${el.prefix ?? ""}${words}`, el);
      }
      case "pageNumber": {
        const vars = ctx.vars || {};
        const t = String(el.text || "Page {page} of {pages}")
          .replace(/\{page\}/g, vars.page ?? 1)
          .replace(/\{pages\}/g, vars.pages ?? 1);
        return textBlock(t, el);
      }
      case "printDate": {
        const d = toDate(ctx.data?.sys?.now) || new Date();
        return textBlock(`${el.prefix ?? ""}${formatDate(d, el.pattern || "DD-MMM-YYYY hh:mm A")}`, el);
      }
      case "image": {
        const src = imageSrc(el, ctx, opts);
        if (!src) return opts.design ? `<div class="pb-img-empty">Image</div>` : "";
        return `<img class="pb-img" src="${escapeHtml(src)}" alt="" style="object-fit:${el.fit || "contain"};object-position:${el.style?.align === "right" ? "right" : el.style?.align === "center" ? "center" : "left"} center">`;
      }
      case "line": {
        const t = num(el.thickness, 0.3);
        const st = el.dash ? "dashed" : "solid";
        const c = el.color || "#9ca3af";
        return el.orientation === "v"
          ? `<div class="pb-vline" style="border-left:${t}mm ${st} ${c}"></div>`
          : `<div class="pb-hline" style="border-top:${t}mm ${st} ${c}"></div>`;
      }
      case "box":
        return "";
      case "barcode": {
        const v = el.expr ? evaluate(el.expr, ctx) : null;
        const txt = isErr(v) || v == null ? "" : String(v);
        if (!txt) return opts.design ? `<div class="pb-img-empty">Barcode</div>` : "";
        const bc = barcodeOf(txt, el.symbology);
        if (bc.square) return `<div class="pb-qr">${bc.svg}</div>`;
        return `<div class="pb-barcode">${bc.svg}${el.showText !== false && bc.text ? `<div class="pb-bartext">${escapeHtml(bc.text)}</div>` : ""}</div>`;
      }
      case "qr": {
        const v = el.expr ? evaluate(el.expr, ctx) : null;
        const txt = isErr(v) || v == null ? "" : String(v);
        if (!txt) return opts.design ? `<div class="pb-img-empty">QR</div>` : "";
        return `<div class="pb-qr">${qrSvg(txt, el.ecc)}</div>`;
      }
      case "signature": {
        const name = el.nameExpr ? evaluate(el.nameExpr, ctx) : null;
        const nm = isErr(name) || name == null ? "" : String(name);
        const al = el.style?.align || "right";
        return `<div class="pb-sign pb-sign-${al}"><div class="pb-sign-space"></div><div class="pb-sign-line"></div><div class="pb-sign-label">${escapeHtml(interpolate(translateText(el.label ?? "Authorised Signatory", ctx), ctx))}</div>${nm ? `<div class="pb-sign-name">${escapeHtml(nm)}</div>` : ""}</div>`;
      }
      case "richtext": {
        let html;
        if (el.htmlExpr) {
          const v = evaluate(el.htmlExpr, ctx);
          html = isErr(v) || v == null ? "" : String(v);
        } else html = interpolate(el.html ?? "", ctx, { escape: true });
        return `<div class="pb-rich">${sanitizeHtml(html)}</div>`;
      }
      case "table":
      case "crosstab": {
        const p = el.type === "crosstab" ? crosstabParts(el, ctx, { maxRows: opts.maxRows }) : tableParts(el, ctx, { maxRows: opts.maxRows });
        return p.open + p.head + `<tbody>${p.rows.join("")}</tbody>` + p.foot + p.close;
      }
      case "chart":
        return chartSvg(el, ctx);
      case "subreport": {
        // laid out by the paginator (subreportParts); at design time a labelled placeholder
        const sub = ctx.data?.__sub?.[el.templateCode];
        const bands = sub?.template?.bands?.filter((b) => !["pageHeader", "pageFooter"].includes(b.type)).length || 0;
        return `<div class="pb-subrep-ph"><b>Sub-report</b> ${escapeHtml(el.templateCode || "— choose a template")}${sub ? ` · ${bands} band${bands === 1 ? "" : "s"}${sub.data ? "" : " · parent data"}` : el.templateCode ? " · not loaded (publish it, then fetch sample)" : ""}</div>`;
      }
      case "section": {
        const kids = Array.isArray(el.children) ? el.children : [];
        return kids
          .filter((k) => opts.design || (!k._off && (!k.visibleIf || truthy(evaluate(k.visibleIf, ctx)))))
          .map((k) => `<div class="pb-el pb-el-${k.type}" style="left:${mm(k.x)};top:${mm(k.y)};width:${mm(k.w)};height:${mm(k.h)};${elementCss(k, theme)};${elementRuleCss(k, ctx)}">${renderElementHtml(k, ctx, opts)}</div>`)
          .join("");
      }
      default:
        return opts.design ? `<div class="pb-img-empty">${escapeHtml(el.type)}</div>` : "";
    }
  } catch (e) {
    if (ctx.errors) ctx.errors.add(`${el.type} ${el.id}: ${e.message}`);
    return `<div class="pb-text">#ERR</div>`;
  }
}

/* ========================================================================== */
/*  page geometry                                                             */
/* ========================================================================== */

export const PAGE_SIZES = {
  A4: { w: 210, h: 297, label: "A4 (210 × 297)" },
  A5: { w: 148, h: 210, label: "A5 (148 × 210)" },
  Letter: { w: 215.9, h: 279.4, label: "Letter (8.5 × 11 in)" },
  Legal: { w: 215.9, h: 355.6, label: "Legal (8.5 × 14 in)" },
  Thermal80: { w: 80, h: 0, roll: true, label: "Thermal 80 mm roll" },
  Thermal58: { w: 58, h: 0, roll: true, label: "Thermal 58 mm roll" },
  Custom: { w: 210, h: 297, label: "Custom" },
};

export function resolvePage(page = {}) {
  const base = PAGE_SIZES[page.size] || PAGE_SIZES.A4;
  let w = page.size === "Custom" ? num(page.width, 210) : base.w;
  let h = page.size === "Custom" ? num(page.height, 297) : base.h;
  const roll = !!base.roll;
  if (!roll && page.orientation === "landscape") [w, h] = [h, w];
  const m = page.margins || {};
  const d = roll ? 3 : 10;
  const margins = { top: num(m.top, d), right: num(m.right, d), bottom: num(m.bottom, d), left: num(m.left, d) };
  return {
    width: w,
    height: h,
    roll,
    margins,
    contentWidth: Math.max(10, w - margins.left - margins.right),
    contentHeight: roll ? Infinity : Math.max(10, h - margins.top - margins.bottom),
  };
}

/* ========================================================================== */
/*  single master + automatic layout for every paper                          */
/* ========================================================================== */

/**
 * A template is designed ONCE, on its master paper (`page.master`, A4 portrait for
 * new templates; a template without one is its own master). `page.size` /
 * `orientation` are only the paper it prints on by default. Every other paper is
 * derived from the master by adaptTemplate — nothing is stored per paper.
 *
 * Layout profiles, picked by PRINTABLE width (paper − side margins), so any
 * paper, orientation or custom size lands in one. `font` is the body size and
 * `margin` the side margins a profile prints with when it is not the master's
 * profile; `perLine` the label/value units a reflowed row keeps side by side.
 */
export const PROFILES = [
  { id: "WIDE", min: 170, font: 9.5, margin: 10, perLine: Infinity },
  { id: "COMPACT", min: 110, font: 8.5, margin: 8, perLine: 2 },
  { id: "THERMAL80", min: 65, font: 8, margin: 3, perLine: 1 },
  { id: "THERMAL58", min: 0, font: 7, margin: 2, perLine: 1 },
];
export const PROFILE_IDS = PROFILES.map((p) => p.id);
const MIN_FONT_PT = 7;
const profileById = (id) => PROFILES.find((p) => p.id === id) || PROFILES[0];
export const profileOfWidth = (w) => (PROFILES.find((p) => num(w) >= p.min - EPS) || PROFILES[PROFILES.length - 1]).id;
const isThermalProfile = (p) => p === "THERMAL80" || p === "THERMAL58";

/** The paper the template is designed on: page.master (size / orientation / width / height) with the template's margins. */
export function masterPage(page = {}) {
  const m = page && page.master;
  return m && m.size ? { ...page, size: m.size, orientation: m.orientation || "portrait", width: m.width, height: m.height } : page || {};
}

/**
 * The geometry a template prints with on a paper (`paper` = { size, width, height,
 * orientation } overrides the template's default output paper). k = printable width /
 * master printable width. On a paper of another profile than the master the margins
 * and the body size follow that profile (`page.responsive: false` keeps them).
 */
export function resolveLayout(tpl, paper) {
  const page = (tpl && tpl.page) || {};
  const master = resolvePage(masterPage(page));
  const designWidth = num(page.designWidth) > 0 ? num(page.designWidth) : master.contentWidth;
  const designProfile = profileOfWidth(designWidth);
  const out = paper && paper.size ? { ...page, size: paper.size, width: paper.width ?? page.width, height: paper.height ?? page.height, orientation: paper.orientation || page.orientation } : page;
  const responsive = page.responsive !== false;
  // With the master's margins the paper stays in the master's profile (A4 ↔ Letter …):
  // only positions change. Otherwise the margins of the profile it falls in.
  let geo = resolvePage(out);
  let profile = profileOfWidth(geo.contentWidth);
  if (responsive && profile !== designProfile) {
    for (const p of PROFILES) {
      let margins = page.margins;
      if (p.id !== designProfile) {
        // page.profileMargins: read for templates saved before the single-master model
        const pm = page.profileMargins && page.profileMargins[p.id];
        margins = pm && typeof pm === "object" ? { top: p.margin, right: p.margin, bottom: p.margin, left: p.margin, ...pm } : pm != null ? { top: num(pm), right: num(pm), bottom: num(pm), left: num(pm) } : { top: p.margin, right: p.margin, bottom: p.margin, left: p.margin };
      }
      const g = resolvePage({ ...out, margins });
      if (g.contentWidth >= p.min - EPS || p === PROFILES[PROFILES.length - 1]) {
        geo = g;
        profile = p.id;
        break;
      }
    }
  }
  // body text lands on the profile's size; every other size keeps its ratio to the body
  const bodyPt = num(tpl && tpl.theme && tpl.theme.fontSize, DEFAULT_THEME.fontSize) || DEFAULT_THEME.fontSize;
  const fontScale = responsive && profile !== designProfile ? profileById(profile).font / bodyPt : 1;
  return { ...geo, size: out.size || "A4", orientation: geo.roll ? "portrait" : out.orientation || "portrait", profile, designProfile, designWidth, k: geo.contentWidth / designWidth, fontScale, responsive };
}

/** Legacy per-paper flag (`showOn`, templates saved before the single-master model): still honoured when reading. */
export const shownOn = (x, profile) => !Array.isArray(x?.showOn) || !x.showOn.length || x.showOn.includes(profile);

const TEXT_TYPES = new Set(["label", "heading", "field", "amountWords", "printDate"]);
const DECOR_TYPES = new Set(["box", "line"]);
const MM_PER_PT = 25.4 / 72;
const PUNCT_RE = /^[\s:：.\-–—|]*$/;

/** caption (static label) · punct (":" …) · value (anything bound or drawn) · decor (box / line) */
function unitKind(el) {
  if (DECOR_TYPES.has(el.type)) return "decor";
  if (el.type === "label" || el.type === "heading") {
    const t = String(el.text ?? "");
    if (PUNCT_RE.test(t)) return "punct";
    return /\{\{/.test(t) ? "value" : "caption";
  }
  return "value";
}

/** The narrowest an element can print and stay readable (mm), at a font size; `minWidth` on the element overrides. */
function minReadableWidth(el, fontPt) {
  if (num(el.minWidth) > 0) return num(el.minWidth);
  const cw = 0.55 * fontPt * MM_PER_PT; // average character width
  const w = num(el.w);
  switch (el.type) {
    case "label":
    case "heading": {
      const raw = String(el.text ?? "");
      if (PUNCT_RE.test(raw)) return Math.min(w, cw * 1.5);
      // a caption may wrap onto two lines; a line with bound values should fit on one
      const bound = /\{\{/.test(raw);
      const t = raw.replace(/\{\{[\s\S]*?\}\}/g, "XXXXXXXXXXXX").trim();
      const longest = t.split(/\s+/).reduce((m, s) => Math.max(m, s.length), 0);
      const chars = bound ? t.length : Math.max(longest, Math.ceil(t.length / 2));
      return Math.min(w, Math.max(chars, Math.min(t.length, 6)) * cw + 1.2);
    }
    case "field":
    case "amountWords":
    case "printDate":
      return Math.min(w, 10 * cw + 1.2);
    case "pageNumber":
      return Math.min(w, 12 * cw);
    case "signature":
      return Math.min(w, 28);
    default:
      return 0; // images, codes, tables, rich text, sections scale
  }
}

/** One element's identity for duplicate detection: what it prints, not where. */
export function contentKey(el) {
  if (!el || DECOR_TYPES.has(el.type)) return null;
  const cols = Array.isArray(el.columns) ? el.columns.map((c) => `${c.header ?? ""}=${c.expr ?? ""}`).join(";") : "";
  const parts = [el.expr, el.text, el.html, el.htmlExpr, el.label, el.nameExpr, el.dataset, cols, el.type === "image" ? `${el.source ?? ""}:${el.assetKey ?? ""}` : ""]
    .map((v) => (v == null ? "" : String(v).trim()));
  const body = parts.join("|");
  if (!body.replace(/\|/g, "")) return null;
  // static text shorter than 3 characters (":" "-" "/") is layout punctuation, never a duplicate
  if ((el.type === "label" || el.type === "heading") && !el.expr && String(el.text ?? "").replace(/[\s:：.\-–|/]/g, "").length < 3) return null;
  return `${el.type}#${body}`;
}

/** Per-paper flags (the per-profile model this replaces): [{ where, flag }]. */
export function perPaperFlags(tpl) {
  const out = [];
  const pg = (tpl && tpl.page) || {};
  if (pg.profileMargins) out.push({ where: "page", flag: "profileMargins" });
  const walk = (els, band) =>
    (els || []).forEach((el) => {
      if (Array.isArray(el.showOn)) out.push({ where: `${band.type} › ${el.type} ${el.id}`, flag: "showOn", el, band });
      if (Array.isArray(el.stackOn)) out.push({ where: `${band.type} › ${el.type} ${el.id}`, flag: "stackOn", el, band });
      (el.columns || []).forEach((c) => {
        if (Array.isArray(c.showOn)) out.push({ where: `${band.type} › ${el.type} ${el.id} › column ${c.header || c.id}`, flag: "showOn", el, band });
      });
      if (el.type === "section") walk(el.children, band);
    });
  (tpl?.bands || []).forEach((b) => {
    if (Array.isArray(b.showOn)) out.push({ where: b.type, flag: "showOn", band: b });
    walk(b.elements, b);
  });
  return out;
}

/**
 * Controls printed twice in one band (or section): same type and same content, in
 * different rows — the shape of a per-paper copy (a wide and a narrow version stacked).
 * The same value repeated side by side in ONE row (a name under two signatures) is design.
 */
export function findDuplicates(tpl) {
  const out = [];
  const sameRow = (a, b) => num(a.y) < num(b.y) + num(b.h) - EPS && num(b.y) < num(a.y) + num(a.h) - EPS;
  const scan = (els, band, path) => {
    const seen = new Map();
    (els || []).forEach((el) => {
      const key = contentKey(el);
      if (key) {
        const prev = seen.get(key) || [];
        const twin = prev.find((o) => !sameRow(o, el));
        if (twin) out.push({ band, where: path, el, of: twin });
        seen.set(key, [...prev, el]);
      }
      if (el.type === "section") scan(el.children, band, `${path} › section ${el.id}`);
    });
  };
  (tpl?.bands || []).forEach((b) => scan(b.elements, b, b.type));
  return out;
}

/**
 * Converts a template built with per-paper copies (showOn / stackOn) to ONE master:
 * in each band the copy the master paper prints is kept and its flag dropped; copies
 * printed only on other papers are deleted (they are what the adapter now derives).
 * Columns and bands lose their flags; `line: 1` becomes the column role it meant.
 * Returns { template, removed: [{ band, type, id, what, keptId }], flagsDropped }.
 */
export function toSingleMaster(tpl) {
  const t = JSON.parse(JSON.stringify(tpl || {}));
  const lay = resolveLayout(t);
  const master = lay.designProfile;
  const removed = [];
  let flagsDropped = 0;
  const describe = (el) => String(el.text ?? el.expr ?? el.label ?? el.dataset ?? el.source ?? "").slice(0, 60);
  const fixTable = (el) => {
    if (el.stackOn || el.stackStyle) flagsDropped++;
    delete el.stackOn;
    delete el.stackStyle;
    el.columns = (el.columns || []).filter((c) => {
      const keep = shownOn(c, master);
      if (Array.isArray(c.showOn)) flagsDropped++;
      delete c.showOn;
      if (!keep) removed.push({ band: "", type: "column", id: c.id, what: c.header || c.expr || "", keptId: null });
      if (c.line === 1 || c.line === "1") {
        if (!c.role) c.role = /rowNumber/.test(String(c.expr ?? "")) ? "serial" : "name";
        delete c.line;
      }
      return keep;
    });
  };
  /**
   * Height only the removed copies used (no kept element shares it) is closed up: the
   * kept master moves up, boxes around it shrink, the container gets shorter.
   */
  const closeGaps = (kept, gone) => {
    const merge = (iv) => {
      const out = [];
      for (const [a, b] of [...iv].sort((p, q) => p[0] - q[0])) {
        const last = out[out.length - 1];
        if (last && a <= last[1] + EPS) last[1] = Math.max(last[1], b);
        else out.push([a, b]);
      }
      return out;
    };
    const used = merge(kept.filter((el) => !el.stretch && unitKind(el) !== "decor").map((el) => [num(el.y), num(el.y) + num(el.h)]));
    const gaps = [];
    for (const [a, b] of merge(gone.map((el) => [num(el.y), num(el.y) + num(el.h)]))) {
      let segs = [[a, b]];
      for (const [u0, u1] of used)
        segs = segs.flatMap(([s0, s1]) => (u1 <= s0 || u0 >= s1 ? [[s0, s1]] : [[s0, Math.max(s0, u0)], [Math.min(s1, u1), s1]]).filter(([x0, x1]) => x1 - x0 > EPS));
      gaps.push(...segs);
    }
    return (y) => {
      let cut = 0;
      for (const [g0, g1] of gaps) cut += Math.max(0, Math.min(y, g1) - g0);
      return Math.max(0, y - cut);
    };
  };
  const fixList = (els, bandType) => {
    const list = els || [];
    const kept = list.filter((el) => shownOn(el, master));
    const keys = new Map(kept.map((el) => [contentKey(el), el]));
    const out = [];
    const gone = [];
    for (const el of list) {
      const onMaster = shownOn(el, master);
      if (Array.isArray(el.showOn)) flagsDropped++;
      if (!onMaster) {
        const twin = keys.get(contentKey(el));
        removed.push({ band: bandType, type: el.type, id: el.id, what: describe(el), keptId: twin ? twin.id : null });
        gone.push(el);
        continue;
      }
      delete el.showOn;
      if (el.type === "table") fixTable(el);
      if (el.type === "section") {
        const r = fixList(el.children, bandType);
        el.children = r.out;
        el.h = Math.max(0.5, r.mapY(num(el.h)));
      }
      out.push(el);
    }
    const mapY = gone.length ? closeGaps(out, gone) : (y) => y;
    if (gone.length)
      for (const el of out) {
        const y0 = mapY(num(el.y));
        el.h = Math.max(0.3, mapY(num(el.y) + num(el.h)) - y0);
        el.y = y0;
      }
    return { out, mapY };
  };
  t.bands = (t.bands || []).map((b) => {
    if (Array.isArray(b.showOn)) flagsDropped++;
    const r = fixList(b.elements, b.type);
    const nb = { ...b, elements: r.out, height: Math.max(1, r.mapY(num(b.height))) };
    delete nb.showOn;
    return nb;
  });
  if (t.page && t.page.profileMargins) {
    delete t.page.profileMargins;
    flagsDropped++;
  }
  return { template: t, removed, flagsDropped };
}

/** A table column's role: serial · name · qty · rate · amount · text (role hint, else inferred from binding and data). */
export function columnRole(col, cols) {
  if (col.role && col.role !== "auto") return col.role;
  const expr = String(col.expr ?? "");
  const head = String(col.header ?? "").toLowerCase();
  if (/rowNumber/.test(expr) || /^(s\.?\s*no\.?|sr\.?\s*no\.?|#)$/.test(head.trim())) return "serial";
  // numeric by format or binding — right alignment alone says nothing (a "Panel :" caption column is right-aligned)
  const numeric = ["number", "currency", "percent"].includes(col.format?.type) || /format\(\s*num\(|fixed\(|num\(/.test(expr);
  if (/\b(qty|quantity|units?)\b/.test(head)) return "qty";
  if (/\b(rate|mrp|price)\b/.test(head)) return "rate";
  if (numeric || /\b(amount|amt|total|net)\b/.test(head)) return "amount";
  const total = (cols || []).reduce((a, c) => a + Math.max(1, num(c.width, 20)), 0) || 1;
  const widest = (cols || []).filter((c) => !/rowNumber/.test(String(c.expr ?? ""))).reduce((m, c) => (num(c.width, 20) > num(m?.width, 20) ? c : m), null);
  if (widest === col && num(col.width, 20) / total >= 0.3) return "name";
  return "text";
}

/** True when `geo` is the paper the template was designed on (same size and printable box). */
export function isMasterPaper(tpl, geo) {
  const m = resolvePage(masterPage((tpl && tpl.page) || {}));
  return !geo.roll && !m.roll && Math.abs(m.width - geo.width) < 0.05 && Math.abs(m.height - geo.height) < 0.05 && Math.abs(m.contentWidth - geo.contentWidth) < 0.05;
}

/**
 * Label grid on a paper other than the master: a label keeps its size and the paper
 * decides how many fit across (and down). When one more column fits with labels shrunk
 * to no less than 85 % they shrink to take it; a label wider than the paper shrinks to
 * its width. Returns { cols, s, width, height, gapX, gapY } (s = label scale).
 */
export function labelPlan(tpl, lay) {
  const L = (tpl && tpl.labels) || {};
  const lw = Math.max(1, num(L.width, 50));
  const lh = Math.max(1, num(L.height, 25));
  const gx = Math.max(0, num(L.gapX));
  const W = num(lay.contentWidth);
  let cols = Math.floor((W + gx + EPS) / (lw + gx));
  let s = 1;
  if (cols < 1) {
    cols = 1;
    s = W / lw;
  } else {
    const s2 = (W - cols * gx) / ((cols + 1) * lw);
    if (s2 >= 0.85 - EPS) {
      cols += 1;
      s = Math.min(1, s2);
    }
  }
  return { cols, s, width: lw * s, height: lh * s, gapX: gx, gapY: Math.max(0, num(L.gapY)) };
}

/**
 * Label sheet on another paper: the grid comes from labelPlan; a shrunk label's controls
 * go through the same adapter as any band, at the label's width (fonts scale with the
 * label, never under 7 pt; rows reflow per the paper's profile). renderLabels grows the
 * label to its content and prints a roll as one continuous page.
 */
function adaptLabels(t, lay, ctx) {
  const plan = labelPlan(t, lay);
  lay.drops = [];
  const band = bandsOf(t, "detail")[0] || bandsOf(t, "reportHeader")[0];
  if (band && plan.s < 1 - 1e-3) {
    const inner = { ...lay, _label: true, k: plan.s, fontScale: plan.s, contentWidth: plan.width, designWidth: Math.max(1, num(t.labels.width, 50)) };
    const one = adaptTemplate({ ...t, bands: [band] }, inner, ctx);
    t.bands = t.bands.map((b) => (b === band ? one.bands[0] : b));
    if (one.theme) t.theme = one.theme;
    lay.drops = inner.drops || [];
    lay.drops.push({ band: band.type, what: `label ${num(t.labels.width, 50)} × ${num(t.labels.height, 25)} mm shrunk to ${Math.round(plan.s * 100)} %` });
  }
  t.labels = { ...t.labels, _plan: plan };
  return t;
}

/**
 * The template as it prints on a paper (layout = resolveLayout): derived from the ONE
 * master, nothing stored per paper. Pure: returns a copy, the master is untouched.
 *  - Geometry: x / width as shares of the master's printable width.
 *  - Rows: elements whose heights overlap form a row; a row whose controls would get
 *    narrower than readable reflows — label + ":" + value stay one unit, units go
 *    `perLine` per line (COMPACT 2, THERMAL 1), left to right. Everything under a row
 *    moves by what it gained; boxes around reflowed controls wrap them again.
 *  - Fonts follow the profile (never under 7 pt); text wraps and grows, never "…".
 *  - Images keep their aspect. THERMAL: an OPTIONAL image (wide letterhead by default)
 *    is dropped — the centre's name and address print in its place; page numbers go.
 *  - Tables: OPTIONAL columns dropped off WIDE; THERMAL rows stack (name on line 1,
 *    the rest under it), a table without a name column prints label … value lines.
 *  - Legacy per-paper flags (showOn / stackOn) are still read.
 * `lay.drops` lists what was dropped or merged, for reports.
 */
export function adaptTemplate(tpl, lay, ctx) {
  const t = JSON.parse(JSON.stringify(tpl || {}));
  // a label sheet's detail band is one label, drawn in the label's own mm: the paper sets the grid
  if (t.labels?.enabled && !lay._label) return isMasterPaper(t, lay) ? t : adaptLabels(t, lay, ctx);
  const k = lay.k;
  const f = lay.fontScale;
  const narrower = k < 1 - 1e-3;
  const thermal = isThermalProfile(lay.profile);
  const prof = profileById(lay.profile);
  const W = lay.contentWidth;
  const drops = [];
  lay.drops = drops;
  const themePt = num(t.theme?.fontSize, DEFAULT_THEME.fontSize) || DEFAULT_THEME.fontSize;
  const font = (v) => (v == null || v === "" ? v : f === 1 ? v : Math.max(Math.min(num(v), MIN_FONT_PT), Math.round(num(v) * f * 10) / 10));
  const fontOf = (s) => {
    if (s && s.fontSize) s.fontSize = font(s.fontSize);
  };
  const ptOf = (el) => num(el.style?.fontSize, 0) || font(themePt);
  if (t.theme && f !== 1) t.theme.fontSize = font(themePt);

  // per element, independent of rows: fonts, text growth, tables, images
  // with the record's data: a report-band control its visibleIf hides takes no slot in a reflowed row
  const rowScoped = (band) => ["detail", "groupHeader", "groupFooter"].includes(band.type);
  const hiddenByData = (el, band) => {
    if (!ctx || !el.visibleIf || rowScoped(band)) return false;
    if ((band.type === "pageHeader" || band.type === "pageFooter") && /\bpages?\b/.test(el.visibleIf)) return false;
    try {
      return !truthy(evaluate(el.visibleIf, ctx));
    } catch {
      return false;
    }
  };
  const prep = (el, band) => {
    fontOf(el.style);
    if (hiddenByData(el, band)) el._hidden = true;
    if (!shownOn(el, lay.profile) || (lay.roll && el.type === "pageNumber")) el._drop = true;
    if ((TEXT_TYPES.has(el.type) || el.type === "pageNumber") && (narrower || f !== 1) && el.canGrow == null) el.canGrow = true;
    // a roll is too narrow for justified text: the few words per line spread into wide gaps
    if (thermal && el.style?.align === "justify") el.style = { ...el.style, align: "left" };
    // narrower paper: one-line text wraps and grows instead of being cut with "…"
    if (TEXT_TYPES.has(el.type) && narrower && el.style && el.style.wrap === false) {
      el.style.wrap = true;
      el.canGrow = true;
    }
    if (el.type === "image") {
      // a wide image (letterhead) is OPTIONAL unless marked otherwise; on thermal only a logo of ≤ 40 % stays
      const share = num(el.w) / (lay.designWidth || 1);
      const optional = el.priority === "optional" || (el.priority !== "must" && share >= 0.6);
      if (thermal && (optional || share > 0.4) && el.priority !== "must") {
        el._drop = true;
        el._letterhead = band.type === "pageHeader" || band.type === "reportHeader";
        drops.push({ band: band.type, what: `image ${el.id} (${optional ? "optional" : "wider than 40 %"})` });
      }
    }
    if (el.type === "table") {
      ["headerStyle", "footerStyle", "groupStyle", "subRowStyle"].forEach((s) => fontOf(el[s]));
      const before = el.columns || [];
      el.columns = before.filter((c) => shownOn(c, lay.profile) && !(lay.profile !== "WIDE" && c.priority === "optional"));
      before.filter((c) => !el.columns.includes(c) && c.priority === "optional").forEach((c) => {
        // column hint mergeInto: an optional column that would be dropped joins a kept column's cell instead ("Batch / Expiry")
        const into = c.mergeInto && el.columns.find((t) => t.id === c.mergeInto);
        if (into && c.expr && into.expr) {
          const i = el.columns.indexOf(into);
          el.columns[i] = {
            ...into,
            header: `${into.header || ""} / ${c.header || ""}`,
            expr: `concat(text(${into.expr}), if(isEmpty(text(${c.expr})), '', concat(if(isEmpty(text(${into.expr})), '', ' / '), text(${c.expr}))))`,
            width: num(into.width ?? 20) + num(c.width ?? 20),
          };
          drops.push({ band: band.type, what: `column "${c.header || c.expr}" of table ${el.id} merged into "${into.header || into.expr}" (optional)` });
        } else drops.push({ band: band.type, what: `column "${c.header || c.expr}" of table ${el.id} (optional)` });
      });
      if (narrower)
        el.columns.forEach((c) => {
          if (c.wrap === false && c.fit !== "shrink") c.fit = "shrink";
        });
      if (Array.isArray(el.stackOn)) {
        if (el.stackOn.includes(lay.profile)) el._stack = el.stackStyle === "keyValue" ? "keyValue" : "twoLine";
      } else if (thermal && el.columns.length > 1) {
        const roles = el.columns.map((c) => columnRole(c, el.columns));
        const hasName = roles.includes("name");
        el._stack = hasName ? "twoLine" : "keyValue";
        el.columns.forEach((c, i) => {
          c._role = roles[i];
          if (hasName && (roles[i] === "serial" || roles[i] === "name")) c.line = 1;
          else delete c.line;
        });
        // "qty × rate = amount" needs money or a single quantity; a quantities-only table (Qty / Issued /
        // Rejected …) keeps its line-2 columns under their own headers instead
        const qtys = roles.filter((r) => r === "qty").length;
        if (hasName && (roles.includes("rate") || roles.includes("amount") || qtys <= 1)) el._figures = true;
        drops.push({ band: band.type, what: `table ${el.id} → ${hasName ? "two-line rows (name / figures)" : "label … value lines"}` });
      }
      if (el._stack) el.subRowStyle = { ...(el.subRowStyle || {}), indent: num(el.subRowStyle?.indent ?? 4) / 2 };
    }
    if (el.type === "section") (el.children || []).forEach((c) => prep(c, band));
  };

  /**
   * Lays out one list of elements (a band, or a section's children) for a target width:
   * rows, units, reflow, vertical moves, decorations. `masterW` is the width the list was
   * drawn at, `W` the width it prints at. Returns (master y) → (printed y).
   */
  const flowEls = (els, W, masterW, bandType, boxed = false) => {
    const kx = W / (masterW || 1);
    const header = bandType === "pageHeader";
    els.forEach((el) => {
      el._mx = num(el.x) + num(el.w) / 2;
      el._my = num(el.y) + num(el.h) / 2;
      el._ox = num(el.x);
      el._oy1 = num(el.y) + num(el.h);
    });
    // centre's name and address in place of a dropped letterhead (thermal)
    const lh = els.find((el) => el._drop && el._letterhead);
    const hasText = els.some((el) => !el._drop && (TEXT_TYPES.has(el.type) || el.type === "section"));
    if (lh && !hasText) {
      lh._drop = false;
      lh._replaced = true;
      Object.assign(lh, {
        type: "richtext",
        html: `<div style="text-align:center"><b style="font-size:1.25em">{{centre.CentreName}}</b><br>{{centre.Address}}</div>`,
        // keeps the image's height while rows form, then gets 9 mm: the rows under it move up by the rest
        _textH: 9,
        canGrow: true,
        style: { fontSize: font(themePt) },
      });
      delete lh.source;
      delete lh.expr;
      drops.push({ band: bandType, what: "letterhead image → centre name + address as centred text" });
    }
    if (thermal && header)
      els.forEach((el) => {
        if (TEXT_TYPES.has(el.type)) el.style = { ...(el.style || {}), align: "center" };
      });

    // rows of the master: content elements whose heights overlap
    const content = els.filter((el) => unitKind(el) !== "decor" && !el.stretch);
    const sorted = [...content].sort((a, b) => num(a.y) - num(b.y));
    const rows = [];
    for (const el of sorted) {
      const y0 = num(el.y);
      const y1 = y0 + num(el.h);
      const cur = rows[rows.length - 1];
      if (cur && y0 < cur.y1 - EPS) {
        cur.els.push(el);
        cur.y1 = Math.max(cur.y1, y1);
      } else rows.push({ y0, y1, els: [el] });
    }
    const geo = new Map(); // el → { x, y (relative to its row top), w, h }
    const reflowed = new Set();
    const imgH = (el, w) => num(el.h) * (el.keepAspect === false ? 1 : Math.min(1, w / Math.max(1e-6, num(el.w))));
    // units: a caption with its ":" and its value; keepWithNext glues an element to the next
    const unitsOf = (all) => {
      // within a row, a caption pairs only with values on its own line: split the row into lines
      // (overlapping heights; a control over twice the usual height stands alone), pair each line
      // left to right, then order the units column by column, top to bottom
      const hs = all.map((e) => num(e.h)).sort((a, b) => a - b);
      const usual = hs.length ? hs[Math.floor(hs.length / 2)] : 0;
      const tall = (e) => num(e.h) > usual * 2 + EPS;
      const lines = [];
      for (const e of [...all].sort((a, b) => num(a.y) - num(b.y))) {
        const ln = !tall(e) && lines.find((l) => !l.tall && num(e.y) < l.y1 - EPS && num(e.y) + num(e.h) > l.y0 + EPS);
        if (ln) {
          ln.els.push(e);
          ln.y1 = Math.max(ln.y1, num(e.y) + num(e.h));
        } else lines.push({ y0: num(e.y), y1: num(e.y) + num(e.h), els: [e], tall: tall(e) });
      }
      const units = [];
      for (const ln of lines) units.push(...pairLine(ln.els.sort((a, b) => num(a.x) - num(b.x))));
      if (lines.length > 1) units.sort((a, b) => Math.round(a.x0 / 4) - Math.round(b.x0 / 4) || a.top - b.top);
      return units;
    };
    const pairLine = (live) => {
      const units = [];
      let cur = null;
      let glue = false;
      for (const el of live) {
        const kind = unitKind(el);
        // a caption takes the text value after it; a signature, image, table … always stands alone
        const block = kind === "value" && !TEXT_TYPES.has(el.type) && el.type !== "label" && el.type !== "richtext";
        const startNew = !cur || (!glue && (kind === "caption" ? cur.els.length > 0 : kind === "value" && (cur.hasValue || block)));
        if (startNew) {
          cur = { els: [], hasValue: false };
          units.push(cur);
        }
        cur.els.push(el);
        if (kind === "value") cur.hasValue = true;
        glue = !!el.keepWithNext;
      }
      for (const u of units) {
        u.x0 = Math.min(...u.els.map((e) => num(e.x)));
        u.x1 = Math.max(...u.els.map((e) => num(e.x) + num(e.w)));
        u.top = Math.min(...u.els.map((e) => num(e.y)));
        u.h = Math.max(...u.els.map((e) => num(e.y) + num(e.h))) - u.top;
      }
      return units;
    };
    rows.forEach((row) => (row.units = unitsOf(row.els.filter((el) => !el._drop && !el._hidden).sort((a, b) => num(a.x) - num(b.x)))));
    // the usual width of a "caption : value" unit in this list: reflowed units of that width or wider
    // share one scale, so their captions and colons line up (an address spanning the page included)
    const spans = rows.flatMap((r) => r.units.filter((u) => u.els.length > 1).map((u) => u.x1 - u.x0)).sort((a, b) => a - b);
    const refSpan = spans.length ? spans[Math.floor(spans.length / 2)] : 0;
    for (const row of rows) {
      const live = row.els.filter((el) => !el._drop && !el._hidden).sort((a, b) => num(a.x) - num(b.x));
      const units = row.units;
      const tooNarrow = (el, w) => w < minReadableWidth(el, ptOf(el)) - EPS;
      // on a roll a table / rich text / chart gets the whole width
      const wantsFull = (el, w) => thermal && ["table", "crosstab", "richtext", "subreport", "chart"].includes(el.type) && w < W - 0.5;
      // controls drawn overlapping (a centred title with a right-aligned note) collide once text wraps
      const overlap = narrower && units.some((u, i) => units.some((v, j) => j > i && u.x0 < v.x1 - EPS && v.x0 < u.x1 - EPS));
      // a thermal page header stacks (logo, then the text lines, centred); elsewhere a row
      // reflows only when one of its controls would get narrower than readable
      const need = !!prof.perLine && prof.perLine !== Infinity && units.length > 0 &&
        ((thermal && header && units.length > 1) || overlap || live.some((el) => tooNarrow(el, num(el.w) * kx) || wantsFull(el, num(el.w) * kx)));
      if (!need) {
        for (const el of row.els) geo.set(el, { x: num(el.x) * kx, y: num(el.y) - row.y0, w: num(el.w) * kx, h: el.type === "image" && kx < 1 ? imgH(el, num(el.w) * kx) : num(el.h) });
      } else {
        // reflow: as many units per line as stay readable (at most the profile's perLine).
        // The lines keep the row's own left / right inset (a row drawn inside a padded box
        // stays inside it), scaled like the rows that do not reflow.
        const inL = units.length ? Math.max(0, Math.min(...units.map((u) => u.x0))) * kx : 0;
        const inR = units.length ? Math.max(0, (masterW || W) - Math.max(...units.map((u) => u.x1))) * kx : 0;
        // a short row in a bordered section (Currency alone under No. | Date) has a wide right gap that is
        // not an inset: it keeps its small left inset on both sides, so it does not touch the border
        const room = inL + inR < W * 0.25 ? W - inL - inR : boxed && inL > 0 && inL < W * 0.1 ? W - 2 * inL : W;
        const x0 = room === W ? 0 : inL;
        const fits = (per) =>
          units.every((u) => {
            const scale = room / per / Math.max(1e-6, u.x1 - u.x0);
            return u.els.every((el) => !tooNarrow(el, Math.min(num(el.w) * scale, room / per)));
          });
        let per = Math.max(1, Math.min(units.length, prof.perLine));
        if ((thermal && header) || overlap) per = 1;
        while (per > 1 && !fits(per)) per--;
        const slot = room / per;
        let top = 0;
        for (let i = 0; i < units.length; i += per) {
          const line = units.slice(i, i + per);
          let lineH = 0;
          line.forEach((u, j) => {
            const span = Math.max(1e-6, u.x1 - u.x0);
            const single = u.els.length === 1;
            // shared only when the unit's controls before its value still fit the slot at that scale
            const fitsShared = u.els.slice(0, -1).every((el) => (num(el.x) - u.x0 + num(el.w)) * (slot / Math.max(refSpan, 1e-6)) <= slot + EPS);
            // (a short unit — UHID beside IPD No. — shares it too once it has a whole line, so its colon lines up)
            const shared = !single && refSpan > 0 && (span >= refSpan * 0.8 || (per === 1 && u.els.length > 2)) && fitsShared;
            const scale = shared ? slot / Math.max(refSpan, 1e-6) : slot / span;
            const lastEl = u.els[u.els.length - 1];
            const s0 = x0 + j * slot;
            let uh = 0;
            let shift = 0;
            for (const el of u.els) {
              let x = single ? s0 : s0 + (num(el.x) - u.x0) * scale + shift;
              let w = single ? slot : num(el.w) * scale;
              // a caption scaled below readable keeps its readable width (≤ 40 % of the slot);
              // the controls after it move right and the value gives up the room
              if (!single && el !== lastEl && unitKind(el) === "caption") {
                const need = Math.min(minReadableWidth(el, ptOf(el)), slot * 0.4);
                if (w < need - EPS) { shift += need - w; w = need; }
              }
              // the value of a shared-scale unit (or of one whose caption grew) runs to the end of its slot
              if ((shared || shift > 0) && el === lastEl) w = Math.max(1, s0 + slot - x);
              if (shared && el !== lastEl && x + w > s0 + slot) w = Math.max(1, s0 + slot - x);
              let h = num(el.h);
              if (el.type === "image") {
                // an image keeps its size where it can, never wider than its slot (thermal: ≤ 40 %), centred
                w = Math.min(w, num(el.w) * Math.max(kx, 0.5), thermal ? 0.4 * W : w);
                if (single) x = s0 + (slot - w) / 2;
                h = imgH(el, w);
              }
              geo.set(el, { x, y: num(el.y) - u.top, w, h });
              // a caption with its value on a full line of a roll reads "label … value"
              if (thermal && per === 1 && !header && u.hasValue && unitKind(el) === "caption" && el.style?.align === "right") el.style = { ...el.style, align: "left" };
              uh = Math.max(uh, num(el.y) - u.top + h);
              reflowed.add(el);
            }
            lineH = Math.max(lineH, uh);
          });
          for (const u of line) for (const el of u.els) geo.get(el).y += top;
          top += lineH;
        }
        for (const el of row.els) if (!geo.has(el)) geo.set(el, { x: 0, y: 0, w: 0, h: 0 });
      }
      // a section lays its own children out in the width it got; its height follows. Its children sit
      // inside its left / right border (the CSS padding box), so they lay out in that inner width: scaled
      // against the outer width, a rule inset less than the border runs through it on a narrow paper
      for (const el of live) {
        if (el.type !== "section") continue;
        const g = geo.get(el);
        const sb = el.style?.border;
        const sides = (sb && num(sb.width) > 0 && (sb.sides || "tblr")) || "";
        const bw = sides ? num(sb.width) * ((sides.includes("l") ? 1 : 0) + (sides.includes("r") ? 1 : 0)) : 0;
        const map = flowEls(el.children || [], Math.max(1, g.w - bw), Math.max(1, num(el.w) - bw), bandType, !!sides);
        el.children = (el.children || []).filter((c) => !c._drop);
        g.h = Math.max(0.5, map(num(el.h)));
      }
    }
    // the centre text that replaced a letterhead is shorter than the image was: its row (and band) shrinks
    if (lh?._replaced && geo.has(lh)) geo.get(lh).h = Math.min(geo.get(lh).h, lh._textH);
    // what each row gains (or loses) — everything under it moves by that much
    const shifts = rows.map((row) => {
      const live = row.els.filter((el) => !el._drop);
      const newH = live.length ? Math.max(...live.map((el) => geo.get(el).y + geo.get(el).h)) : 0;
      return { y0: row.y0, y1: row.y1, extra: newH - (row.y1 - row.y0) };
    });
    const mapY = (y) => {
      let out = y;
      for (const s of shifts) {
        if (s.y1 <= y + EPS) out += s.extra;
        else if (s.y0 < y - EPS) out += (s.extra * (y - s.y0)) / Math.max(1e-6, s.y1 - s.y0);
      }
      return Math.max(0, out);
    };
    for (const row of rows) {
      const top = mapY(row.y0);
      for (const el of row.els) {
        const g = geo.get(el);
        el.x = g.x;
        el.w = g.w;
        el.y = top + g.y;
        el.h = g.h;
      }
    }
    // decorations: boxes around reflowed controls wrap them again; the rest scale and move
    const wrapped = [];
    for (const el of els) {
      if (unitKind(el) !== "decor" && !el.stretch) continue;
      const x0 = num(el.x);
      const y0 = num(el.y);
      const x1 = x0 + num(el.w);
      const y1 = y0 + num(el.h);
      const within = (c) => !c._drop && c._mx >= x0 - EPS && c._mx <= x1 + EPS && c._my >= y0 - EPS && c._my <= y1 + EPS;
      const all = content.filter(within);
      if (el.type === "box" && all.some((c) => reflowed.has(c))) {
        const pad = Math.min(2, Math.max(0.4, Math.min(...all.map((c) => c._ox - x0))));
        let bx0 = Math.min(...all.map((c) => num(c.x)));
        let bx1 = Math.max(...all.map((c) => num(c.x) + num(c.w)));
        // reflowed to the full width (a totals box on a roll): the controls step in by the padding, so
        // the border does not run through their text. Captions keep their width; what reaches the right
        // edge (the values) gives up the room.
        if ((bx0 < pad - EPS || bx1 > W - pad + EPS) && !all.some((c) => c.type === "section")) {
          const d = Math.max(0, pad - bx0);
          for (const c of all) {
            const x = num(c.x) + d;
            c.w = Math.max(1, Math.min(x + num(c.w), W - pad) - x);
            c.x = x;
          }
          bx0 = Math.min(...all.map((c) => num(c.x)));
          bx1 = Math.max(...all.map((c) => num(c.x) + num(c.w)));
        }
        el.x = Math.max(0, bx0 - pad);
        el.w = Math.min(W, bx1 + pad) - el.x;
        const ny0 = mapY(y0);
        el.h = Math.max(...all.map((c) => num(c.y) + num(c.h))) + Math.min(pad, Math.max(0, y1 - Math.max(...all.map((c) => c._oy1)))) - ny0;
        el.y = ny0;
        wrapped.push({ x0, y0, x1, y1, box: el, pad });
      } else {
        el.x = x0 * kx;
        el.w = num(el.w) * kx;
        el.y = mapY(y0);
        if (!(el.type === "line" && el.orientation !== "v")) el.h = Math.max(0.3, mapY(y1) - el.y);
      }
    }
    // a rule drawn across the inside of a box that wrapped its reflowed controls spans the box again
    // (scaled alone it would sit off to one side of the re-wrapped box)
    for (const el of els) {
      if (el.type !== "line" || el.orientation === "v") continue;
      const wr = wrapped.find((b) => el !== b.box && el._mx >= b.x0 - EPS && el._mx <= b.x1 + EPS && el._my >= b.y0 - EPS && el._my <= b.y1 + EPS);
      if (!wr) continue;
      el.x = wr.box.x + wr.pad;
      el.w = Math.max(0.5, wr.box.w - 2 * wr.pad);
    }
    return mapY;
  };

  const flowBand = (band) => {
    const els = band.elements || [];
    els.forEach((el) => prep(el, band));
    const mapY = flowEls(els, W, lay.designWidth, band.type);
    band.height = mapY(num(band.height));
    band.elements = els.filter((el) => !el._drop);
    const dropped = [];
    const collect = (list) =>
      list.forEach((el) => {
        if (el._drop && !el._replaced && el.type !== "image") dropped.push(el);
        if (el.children) collect(el.children);
      });
    collect(els);
    dropped.forEach((el) =>
      drops.push({ band: band.type, what: el.type === "pageNumber" && lay.roll ? "page number (a roll is one page)" : `${el.type} ${el.id} (legacy per-paper flag)` }),
    );
  };

  t.bands = (t.bands || []).map((b) => {
    const nb = { ...b, _off: !shownOn(b, lay.profile) };
    flowBand(nb);
    return nb;
  });
  // Right-to-left (theme.direction "rtl"): the layout is mirrored — what was drawn on the left
  // prints on the right, left/right alignment swaps, tables read right to left (CSS direction)
  if (t.theme && t.theme.direction === "rtl") {
    const swap = (s) => {
      if (s && (s.align === "left" || s.align === "right")) s.align = s.align === "left" ? "right" : "left";
    };
    const flip = (els, width) =>
      (els || []).forEach((el) => {
        el.x = Math.max(0, width - num(el.x) - num(el.w));
        swap(el.style);
        if (el.type === "section") flip(el.children, num(el.w));
      });
    t.bands.forEach((b) => flip(b.elements, lay.contentWidth));
  }
  const wm = t.page && t.page.watermark;
  if (wm && wm.text && k < 1) wm.size = Math.max(14, num(wm.size, 72) * k);
  return t;
}

/* ========================================================================== */
/*  band layout                                                               */
/* ========================================================================== */

function measureHeight(env, el, html, widthMm) {
  const host = env.measureHost;
  const div = host.ownerDocument.createElement("div");
  div.className = `pb-el pb-el-${el.type} pb-measure`;
  div.style.cssText = `position:relative;left:0;top:0;width:${mm(widthMm)};height:auto;${elementCss(el, env.theme)}`;
  div.innerHTML = html;
  host.appendChild(div);
  const h = pxToMm(div.getBoundingClientRect().height);
  host.removeChild(div);
  return h;
}

/**
 * Columns with fit "shrink": a value wider than its cell gets a smaller font (down to 4pt) so it
 * prints whole on one line. Done in the measuring table, then written back into parts.rows, so
 * the rows measured are the rows printed.
 */
function shrinkToFit(div, bodyRows, parts) {
  const cells = div.querySelectorAll("td.pb-fit");
  const wordCells = div.querySelectorAll("td.pb-fitw, th.pb-fitw");
  if (!cells.length && !wordCells.length) return;
  const changed = new Set();
  const win = div.ownerDocument.defaultView;
  // fit "words": the longest word of the cell, measured in the cell's font; wider than the column →
  // the cell's font shrinks (down to 4pt) until it fits, so lines break between words only
  if (wordCells.length) {
    // inside the cell, so it inherits every font setting (tabular digits, weight, size)
    const probe = div.ownerDocument.createElement("span");
    probe.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap";
    for (const td of wordCells) {
      const cs = win.getComputedStyle(td);
      const avail = td.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const words = (td.textContent || "").split(/\s+/); // read before the probe goes in
      probe.textContent = "";
      td.appendChild(probe);
      let need = 0;
      for (const w of words) {
        if (!w) continue;
        probe.textContent = w;
        need = Math.max(need, probe.getBoundingClientRect().width);
      }
      probe.remove();
      if (need > avail + 0.25 && avail > 0) {
        const pt = (parseFloat(cs.fontSize) * 0.75 * avail) / need;
        td.style.fontSize = `${Math.max(4, Math.floor(pt * 0.97 * 100) / 100)}pt`;
        changed.add(td.parentElement);
      }
    }
  }
  for (const td of cells) {
    const span = td.firstElementChild;
    if (!span) continue;
    const cs = win.getComputedStyle(td);
    const avail = td.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const need = span.getBoundingClientRect().width;
    if (need <= avail + 0.25 || avail <= 0) continue;
    const pt = (parseFloat(cs.fontSize) * 0.75 * avail) / need;
    td.style.fontSize = `${Math.max(4, Math.floor(pt * 0.97 * 100) / 100)}pt`;
    changed.add(td.parentElement);
  }
  bodyRows.forEach((r, i) => {
    if (changed.has(r) && i < parts.rows.length) parts.rows[i] = r.outerHTML;
  });
  const tfoot = div.querySelector("tfoot");
  if (tfoot && Array.from(tfoot.rows).some((r) => changed.has(r))) parts.foot = tfoot.outerHTML;
  const thead = div.querySelector("thead");
  if (thead && Array.from(thead.rows).some((r) => changed.has(r))) parts.head = thead.outerHTML;
}

/** Measures a table's pieces: header, every row, footer (mm). */
function measureTable(env, el, parts, widthMm) {
  const host = env.measureHost;
  const div = host.ownerDocument.createElement("div");
  div.className = "pb-el pb-el-table pb-measure";
  div.style.cssText = `position:relative;left:0;top:0;width:${mm(widthMm)};height:auto;${elementCss(el, env.theme)}`;
  div.innerHTML = parts.open + parts.head + `<tbody>${parts.rows.join("")}</tbody>` + parts.foot + parts.close;
  host.appendChild(div);
  const table = div.querySelector("table");
  const bodyRows = table.tBodies[0] ? Array.from(table.tBodies[0].rows) : [];
  shrinkToFit(div, bodyRows, parts);
  const tb = table.getBoundingClientRect();
  const thead = table.tHead;
  const tfoot = table.tFoot;
  const tops = bodyRows.map((r) => r.getBoundingClientRect().top);
  const bodyTop = bodyRows.length ? tops[0] : thead ? thead.getBoundingClientRect().bottom : tb.top;
  const bodyBottom = tfoot ? tfoot.getBoundingClientRect().top : tb.bottom;
  const headH = pxToMm(bodyTop - tb.top);
  const rowH = bodyRows.map((r, i) => pxToMm((i + 1 < tops.length ? tops[i + 1] : bodyBottom) - tops[i]));
  const footH = pxToMm(tb.bottom - bodyBottom);
  const boxExtra = pxToMm(div.getBoundingClientRect().height - tb.height);
  host.removeChild(div);
  return { headH, rowH, footH, boxExtra, totalH: headH + rowH.reduce((a, b) => a + b, 0) + footH + boxExtra };
}

/**
 * Lays one band out for one scope: visibility, measured growth, push-down.
 * Returns { height, items:[{el, x, y, h, ctx}], split } where `split` describes
 * the table this band can be cut at.
 */
function layoutBand(band, ctx, env) {
  const items = [];
  for (const el of band.elements || []) {
    const visible = !el._off && (!el.visibleIf || truthy(evaluate(el.visibleIf, ctx)));
    items.push({ el, visible, delta: 0, shift: 0 });
  }
  for (const it of items) {
    const el = it.el;
    if (!it.visible) {
      // off on this paper profile: always gives its space back
      it.delta = el.collapse || el._off ? -num(el.h) : 0;
      continue;
    }
    if (el._dh) it.delta = el._dh; // an image narrowed with the paper keeps its aspect
    if (SPLIT_TYPES.has(el.type)) {
      const parts = gridParts(el, ctx, env);
      const m = parts.m || measureTable(env, el, parts, num(el.w));
      it.table = { parts, m };
      // a sub-report / crosstab set not to grow keeps its box (content is cut, as for any element)
      it.delta = el.type === "table" || canGrow(el) ? m.totalH - num(el.h) : 0;
    } else if (el.type === "section") {
      // a section is a small band of its own: its children grow and push each other down, and it follows them
      const sub = layoutBand({ height: num(el.h), elements: el.children || [] }, ctx, env);
      it.el = { ...el, children: sub.items.map((o) => ({ ...o.el, y: o.y, h: o.h })) };
      it.delta = sub.height - num(el.h);
    } else if (canGrow(el)) {
      const h = measureHeight(env, el, renderElementHtml(el, ctx, env.opts), num(el.w));
      if (h > num(el.h) + EPS) it.delta = h - num(el.h);
    }
  }
  // A collapsed element frees its space only if nothing visible shares its rows
  // (a stretching box around it does not count: it follows the content).
  for (const it of items) {
    if (it.visible || it.delta >= 0) continue;
    const y0 = num(it.el.y);
    const y1 = y0 + num(it.el.h);
    if (items.some((o) => o.visible && !o.el.stretch && num(o.el.y) < y1 - EPS && num(o.el.y) + num(o.el.h) > y0 + EPS)) it.delta = 0;
  }
  const sorted = [...items].sort((a, b) => num(a.el.y) - num(b.el.y) || num(a.el.h) - num(b.el.h));
  // Space that collapsed elements free, and how much of it lies between two depths
  // (overlapping elements of one row count once).
  const freed = items.filter((it) => !it.visible && it.delta < 0).map((it) => [num(it.el.y), num(it.el.y) + num(it.el.h)]);
  const freedBetween = (top, bottom) => {
    if (!freed.length) return 0;
    const segs = freed.filter(([a, b]) => a >= top - EPS && b <= bottom + EPS).sort((p, q) => p[0] - q[0]);
    let len = 0;
    let cur = null;
    for (const [a, b] of segs) {
      if (cur && a <= cur[1] + EPS) cur[1] = Math.max(cur[1], b);
      else {
        if (cur) len += cur[1] - cur[0];
        cur = [a, b];
      }
    }
    return cur ? len + cur[1] - cur[0] : len;
  };
  // An element moves by the largest move of anything above it that moved, less
  // the space collapsed elements free in between ("decreasing size"): a hidden
  // row lets the rows under it come up even when a table above them grew.
  const shiftAt = (y, self) => {
    let best = null;
    for (const a of sorted) {
      if (a === self || a.el.stretch) continue; // a stretching box follows the band; it never pushes
      const aBottom = num(a.el.y) + num(a.el.h);
      if (aBottom <= y + EPS) {
        const moved = a.shift + a.delta;
        if (Math.abs(moved) > EPS) {
          const v = moved - freedBetween(aBottom, y);
          best = best == null ? v : Math.max(best, v);
        }
      }
    }
    return best ?? 0;
  };
  for (const it of sorted) it.shift = shiftAt(num(it.el.y), it);
  const bandShift = shiftAt(num(band.height), null);
  const out = [];
  let bottom = 0;
  for (const it of sorted) {
    if (!it.visible) continue;
    const y = num(it.el.y) + it.shift;
    const h = Math.max(0, num(it.el.h) + it.delta);
    if (!it.el.stretch) bottom = Math.max(bottom, y + h);
    out.push({ el: it.el, x: num(it.el.x), y, h, table: it.table, ctx });
  }
  const height = Math.max(0, num(band.height) + bandShift, bottom);
  // "Stretch to band bottom" (boxes, lines): keep the design gap to the band's
  // bottom edge, so a panel's border grows or shrinks with the fields inside it.
  for (const o of out) {
    if (!o.el.stretch || o.table) continue;
    const gap = Math.max(0, num(band.height) - (num(o.el.y) + num(o.el.h)));
    o.h = Math.max(0.3, height - gap - o.y);
  }
  const tableItem = out.find((o) => o.table && o.table.parts.count > 0 && (o.el.type === "table" || canGrow(o.el)));
  return { band, ctx, height, items: out, split: tableItem || null };
}

/* ========================================================================== */
/*  pagination                                                                */
/* ========================================================================== */

const bandsOf = (tpl, type) => (tpl.bands || []).filter((b) => b.type === type);
const bandVisible = (band, ctx) => !band._off && (!band.visibleIf || truthy(evaluate(band.visibleIf, ctx)));
const printOnPage = (band, i, total) => {
  const p = band.printOn || "all";
  if (p === "first") return i === 0;
  if (p === "notFirst") return i > 0;
  if (p === "last") return total == null ? true : i === total - 1;
  // not on the last page — "Carried forward" footers; reserved on every page while the count is unknown
  if (p === "notLast") return total == null ? true : i < total - 1;
  if (p === "odd") return i % 2 === 0; // pages 1, 3, 5 …
  if (p === "even") return i % 2 === 1;
  return true;
};

/** A laid-out band carries its page-break settings into the flow. */
const withBreaks = (lay, band, skipBefore = false) => {
  if (band.pageBreakBefore && !skipBefore) lay.breakBefore = true;
  if (band.pageBreakAfter) lay.breakAfter = true;
  // "keep with next": the band never ends a page alone — it moves with the band after it (chains follow)
  if (band.keepWithNext && band.type !== "detail") lay.keepWithNext = true;
  return lay;
};

/** Builds the flow: report header, groups + detail rows, report footer. */
function buildFlow(tpl, rootCtx, env) {
  const flow = [];
  const rawPush = flow.push.bind(flow);
  // every band that enters the flow brings its "new page before / after" with it
  flow.push = (lay) => rawPush(lay && lay.band ? withBreaks({ ...lay }, lay.band, lay.band.type === "groupHeader" && lay.ctx?.vars?.rowIndex === 0) : lay);
  const detail = bandsOf(tpl, "detail")[0];
  const rows = detail ? datasetRows(detail.dataset, rootCtx, detail) : [];
  const allCtx = { ...rootCtx, rows };
  env.detailRows = rows;

  for (const b of bandsOf(tpl, "reportHeader")) if (bandVisible(b, allCtx)) flow.push(layoutBand(b, allCtx, env));

  if (detail) {
    const gh = bandsOf(tpl, "groupHeader");
    const gf = bandsOf(tpl, "groupFooter");
    const levels = gh.map((h) => ({ by: h.groupBy || "", header: h, footer: gf.find((f) => (f.groupBy || "") === (h.groupBy || "")) }));
    for (const f of gf) if (!levels.some((l) => l.footer === f)) levels.push({ by: f.groupBy || "", header: null, footer: f });
    const keyOf = (lvl, r, i) => {
      const v = evaluate(lvl.by, { ...rootCtx, row: r, rows, vars: { rowIndex: i, rowNumber: i + 1 } });
      return isErr(v) ? "#ERR" : String(v ?? "");
    };
    const keys = rows.map((r, i) => levels.map((l) => keyOf(l, r, i)));
    const groupRows = (lvl, start) => {
      const out = [];
      for (let j = start; j < rows.length; j++) {
        let same = true;
        for (let k = 0; k <= lvl; k++) if (keys[j][k] !== keys[start][k]) same = false;
        if (!same) break;
        out.push(rows[j]);
      }
      return out;
    };
    const groupStart = levels.map(() => 0);
    const detailStatic = !(detail.elements || []).some((e) => e.visibleIf || canGrow(e) || SPLIT_TYPES.has(e.type));
    let staticLayout = null;
    for (let i = 0; i < rows.length; i++) {
      // headers for every level whose key changed (outer first)
      let changedFrom = levels.length;
      if (i === 0) changedFrom = 0;
      else for (let k = 0; k < levels.length; k++) if (keys[i][k] !== keys[i - 1][k]) { changedFrom = k; break; }
      for (let k = changedFrom; k < levels.length; k++) {
        groupStart[k] = i;
        const lvl = levels[k];
        if (lvl.header) {
          const g = groupRows(k, i);
          const gctx = { ...rootCtx, row: rows[i], rows: g, vars: { group: keys[i][k], rowIndex: i, rowNumber: i + 1, groupCount: g.length } };
          if (bandVisible(lvl.header, gctx)) flow.push({ ...layoutBand(lvl.header, gctx, env), keepWithNext: true });
        }
      }
      const rctx = { ...rootCtx, row: rows[i], rows, vars: { rowIndex: i, rowNumber: i + 1 } };
      if (bandVisible(detail, rctx)) {
        if (detailStatic) {
          if (!staticLayout) staticLayout = layoutBand(detail, rctx, env);
          flow.push({ ...staticLayout, ctx: rctx, items: staticLayout.items.map((it) => ({ ...it, ctx: rctx })) });
        } else flow.push(layoutBand(detail, rctx, env));
      }
      // footers for every level that ends here (inner first)
      const next = i + 1 < rows.length ? keys[i + 1] : null;
      let endsFrom = levels.length;
      if (!next) endsFrom = 0;
      else for (let k = 0; k < levels.length; k++) if (keys[i][k] !== next[k]) { endsFrom = k; break; }
      for (let k = levels.length - 1; k >= endsFrom; k--) {
        const lvl = levels[k];
        if (!lvl.footer) continue;
        const g = rows.slice(groupStart[k], i + 1);
        const gctx = { ...rootCtx, row: g[0], rows: g, vars: { group: keys[i][k], groupCount: g.length } };
        if (bandVisible(lvl.footer, gctx)) flow.push(layoutBand(lvl.footer, gctx, env));
      }
    }
  }

  for (const b of bandsOf(tpl, "reportFooter")) if (bandVisible(b, allCtx)) flow.push({ ...layoutBand(b, allCtx, env), anchorBottom: !!b.anchorBottom });
  return flow;
}

/**
 * Cuts the flow into pages. Plain bands move whole to the next page; a band
 * holding a table is cut between rows — header repeated on every piece, no row
 * split, and the footer/total always with at least one data row.
 */
function paginate(flow, env) {
  const pages = [];
  const capFor = (i) => env.capacity(i);
  let page = null;
  const newPage = () => {
    page = { index: pages.length, y: 0, frags: [] };
    pages.push(page);
  };
  newPage();
  const SAFETY = env.roll ? 0 : 0.6;

  const placeWhole = (lay, y) => {
    page.frags.push({ kind: "band", lay, y, h: lay.height });
    page.y = y + lay.height;
  };

  let breakPending = false;
  for (let fi = 0; fi < flow.length; fi++) {
    const lay = flow[fi];
    const cap = () => capFor(page.index) - SAFETY;
    // "new page before" this band, or "new page after" the one before it (never on a roll, never twice)
    if (!env.roll && (lay.breakBefore || breakPending) && page.y > EPS) newPage();
    breakPending = !!lay.breakAfter;
    if (lay.anchorBottom && !env.roll) {
      if (page.y + lay.height > cap() + EPS && page.y > 0) newPage();
      placeWhole(lay, Math.max(page.y, cap() - lay.height));
      continue;
    }
    // keep a group header with the first row after it; a "keep with next" band with the bands it is chained to
    // (a chain taller than a page is not kept: it breaks where it must)
    let need = lay.height;
    for (let k = fi; flow[k].keepWithNext && flow[k + 1] && !flow[k + 1].split; k++) need += flow[k + 1].height;
    if (need > cap() + EPS) need = lay.keepWithNext && flow[fi + 1] && !flow[fi + 1].split ? lay.height + flow[fi + 1].height : lay.height;
    if (!lay.split || page.y + lay.height <= cap() + EPS) {
      if (page.y + need > cap() + EPS && page.y > 0) newPage();
      placeWhole(lay, page.y);
      continue;
    }
    // splittable: band with a table
    const t = lay.split;
    const m = t.table.m;
    const rowH = m.rowH;
    const total = rowH.length;
    const preTop = t.y; // table top within the band
    const tableBottomDesign = t.y + t.h;
    const postH = Math.max(0, lay.height - tableBottomDesign);
    const repeatHead = t.el.repeatHeader !== false;
    let start = 0;
    let first = true;
    for (let guard = 0; guard < 10000; guard++) {
      const pageEmpty = page.y <= EPS;
      const avail = cap() - page.y;
      const top = first ? preTop : 0;
      const head = first || repeatHead ? m.headH : 0;
      const room = avail - top - head - m.boxExtra;
      let n = 0;
      let used = 0;
      while (start + n < total && used + rowH[start + n] <= room + EPS) {
        used += rowH[start + n];
        n++;
      }
      const remaining = total - start;
      const tail = m.footH + postH;
      if (n === remaining && used + tail <= room + EPS) {
        page.frags.push({ kind: "table", lay, y: page.y, start, end: total, first, last: true, h: top + head + used + tail + m.boxExtra, head: head > 0, top });
        page.y += top + head + used + tail + m.boxExtra;
        break;
      }
      if (n === remaining) n = Math.max(0, remaining - 1); // no orphan total: last row goes with it
      // a group heading row never ends a page: it moves on with the row it heads
      const keep = t.table.parts.keep || [];
      while (n > 0 && start + n < total && keep[start + n - 1]) n--;
      const minRows = Math.min(2, remaining);
      if (n < minRows && !pageEmpty) {
        newPage();
        continue;
      }
      if (n <= 0) n = Math.min(1, remaining); // empty page: always progress
      if (n === remaining) {
        // even on an empty page the tail does not fit after the last row: print it anyway
        let usedAll = 0;
        for (let k = start; k < total; k++) usedAll += rowH[k];
        page.frags.push({ kind: "table", lay, y: page.y, start, end: total, first, last: true, h: top + head + usedAll + tail + m.boxExtra, head: head > 0, top });
        page.y += top + head + usedAll + tail + m.boxExtra;
        break;
      }
      let usedN = 0;
      for (let k = start; k < start + n; k++) usedN += rowH[k];
      page.frags.push({ kind: "table", lay, y: page.y, start, end: start + n, first, last: false, h: top + head + usedN + m.boxExtra, head: head > 0, top });
      start += n;
      first = false;
      newPage();
    }
  }
  return pages;
}

/* ========================================================================== */
/*  document render                                                           */
/* ========================================================================== */

export const ENGINE_CSS = `
.pb-doc{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal;text-rendering:geometricPrecision}
.pb-page{position:relative;overflow:hidden;background:#fff;break-after:page;page-break-after:always;box-sizing:border-box}
.pb-page:last-child{break-after:auto;page-break-after:auto}
.pb-credit{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;font-family:'Inter','Noto Sans',Arial,sans-serif;line-height:1;white-space:nowrap;direction:ltr;pointer-events:none}
.pb-credit.is-edge{right:auto;bottom:auto;justify-content:center}
.pb-credit-pill{display:inline-flex;align-items:center;gap:1.3mm}
.pb-credit-pill svg{width:auto;height:3.4mm;flex:none}
.pb-credit-by{font-size:6.2pt;color:#94a3b8}
.pb-credit-org{font-size:6.6pt;color:#475569;font-weight:500}
.pb-credit-org b{font-weight:800;letter-spacing:.03em;color:#4f46e5}
.pb-credit.is-pill .pb-credit-pill{padding:.6mm 2.4mm .6mm .7mm;border-radius:10mm;border:.22mm solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#0ea5e9,#6366f1 55%,#a855f7) border-box;box-shadow:0 .3mm 1.1mm rgba(79,70,229,.16)}
.pb-credit.is-soft .pb-credit-pill{padding:.7mm 2.6mm .7mm .8mm;border-radius:10mm;background:linear-gradient(90deg,#eff6ff,#eef2ff 50%,#f5f3ff)}
.pb-credit.is-soft .pb-credit-by{color:#818cf8}
.pb-credit.is-dark .pb-credit-pill{padding:.7mm 2.6mm .7mm .8mm;border-radius:10mm;background:linear-gradient(90deg,#0f172a,#1e1b4b);box-shadow:0 .3mm 1.2mm rgba(15,23,42,.25)}
.pb-credit.is-dark .pb-credit-by{color:#a5b4fc}
.pb-credit.is-dark .pb-credit-org{color:#e2e8f0}
.pb-credit.is-dark .pb-credit-org b{color:#c4b5fd}
.pb-credit.is-small .pb-credit-pill{gap:.9mm}
.pb-credit.is-small .pb-credit-pill svg{width:auto;height:2.6mm}
.pb-credit.is-small .pb-credit-by{font-size:5pt}
.pb-credit.is-small .pb-credit-org{font-size:5.4pt}
.pb-content{position:absolute}
.pb-region{position:absolute;left:0}
.pb-el{position:absolute;box-sizing:border-box;overflow:hidden}
.pb-el.pb-measure{position:relative;overflow:visible}
.pb-text{white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;min-width:0}
.pb-nowrap{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pb-el-heading .pb-text{font-weight:inherit}
.pb-img{display:block;width:100%;height:100%}
.pb-img-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 4px,#e5e7eb 4px,#e5e7eb 8px);color:#6b7280;font-size:7pt}
.pb-hline{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}
.pb-vline{position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%)}
.pb-el-line{display:block!important}
.pb-barcode{display:flex;flex-direction:column;width:100%;height:100%}
.pb-barsvg{flex:1;width:100%;min-height:0}
.pb-bartext{text-align:center;font-size:7pt;letter-spacing:.08em;font-family:'Roboto Mono','Courier New',monospace;line-height:1.2}
.pb-qr{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.pb-qrsvg{height:100%;max-width:100%}
.pb-sign{display:flex;flex-direction:column;height:100%;width:100%}
.pb-sign-space{flex:1}
.pb-sign-line{border-top:0.3mm solid currentColor;opacity:.7;width:70%}
.pb-sign-right .pb-sign-line{margin-left:auto}.pb-sign-center .pb-sign-line{margin:0 auto}
.pb-sign-label{font-weight:600;margin-top:1mm}
.pb-sign-name{opacity:.75;font-size:.92em}
.pb-sign-right{text-align:right}.pb-sign-center{text-align:center}
.pb-rich{overflow-wrap:anywhere;display:flow-root}
.pb-rich table{border-collapse:collapse;max-width:100%}
.pb-rich p{margin:0 0 1mm}
.pb-rich img{max-width:100%}
.pb-table{width:100%;border-collapse:collapse;table-layout:fixed;font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.pb-table th,.pb-table td{padding:1.4mm 1.8mm;vertical-align:top;overflow-wrap:anywhere;line-height:1.3}
.pb-table thead th{background:var(--pb-accent-soft);color:#111827;font-weight:600;border-bottom:0.35mm solid var(--pb-accent);text-align:left;font-size:.92em;letter-spacing:.01em}
.pb-table tr{break-inside:avoid;page-break-inside:avoid}
.pb-grid-lines tbody td{border-bottom:0.2mm solid #e5e7eb}
.pb-grid-grid th,.pb-grid-grid td{border:0.2mm solid #d1d5db}
.pb-grid-grid thead th{border-bottom:0.35mm solid var(--pb-accent)}
.pb-zebra tbody tr.pb-odd td{background:#f7f8fa}
.pb-table tfoot td{font-weight:700;border-top:0.35mm solid #374151;background:#f3f4f6}
.pb-table tr.pb-empty td{text-align:center;color:#6b7280;font-style:italic}
.pb-table tbody td{white-space:pre-line}
.pb-table tr.pb-grouprow td{font-weight:700;font-size:.9em;letter-spacing:.04em;color:var(--pb-accent);background:var(--pb-accent-soft);padding-top:1mm;padding-bottom:1mm}
.pb-stacked tr.pb-stack1 td{border-bottom:0!important}
.pb-stacked tr.pb-stack2 td{padding-top:0!important;border-top:0!important}
.pb-table tr.pb-subrow td{color:#6b7280;font-size:.9em;padding-top:.5mm;padding-bottom:.5mm}
.pb-watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-weight:800;white-space:nowrap;z-index:5;letter-spacing:.06em}
.pb-missing{color:#b91c1c;font-size:7pt}
.pb-chart{display:block;width:100%;height:100%;overflow:visible}
.pb-subrep{position:relative;width:100%}
.pb-subband{overflow:hidden}
.pb-subrep-ph{width:100%;height:100%;box-sizing:border-box;border:0.3mm dashed #a78bfa;background:repeating-linear-gradient(135deg,#faf5ff,#faf5ff 6px,#f3e8ff 6px,#f3e8ff 12px);color:#6d28d9;font-size:7.5pt;padding:1.5mm 2mm}
.pb-rtl{direction:rtl}
.pb-fatal{color:#b91c1c;font:12px monospace;white-space:pre-wrap;padding:12px}
@media screen{
  body.pb-screen{background:#e7e9ee;padding:20px 0}
  body.pb-screen .pb-page{margin:0 auto 20px;box-shadow:0 1px 3px rgba(15,23,42,.12),0 8px 24px rgba(15,23,42,.08)}
}
@media print{ body.pb-screen{background:#fff;padding:0} .pb-page{margin:0;box-shadow:none} }
`;

function bandHtml(lay, env, vars, opts2 = {}) {
  const parts = [];
  for (const it of lay.items) {
    const ctx = { ...it.ctx, vars: { ...(it.ctx.vars || {}), ...vars } };
    const el = it.el;
    if (opts2.skip && opts2.skip(it)) continue;
    const dy = opts2.dy ? opts2.dy(it) : 0;
    let inner;
    let h = it.h;
    const body = (p, rows) => (p.body ? p.body(rows) : `<tbody>${rows.join("")}</tbody>`);
    if (it.table && opts2.table && opts2.table.item === it) {
      const p = it.table.parts;
      const tf = opts2.table;
      inner = p.open + (tf.head ? p.head : "") + body(p, p.rows.slice(tf.start, tf.end)) + (tf.last ? p.foot : "") + p.close;
      h = tf.h;
    } else if (it.table) {
      const p = it.table.parts;
      inner = p.open + p.head + body(p, p.rows) + p.foot + p.close;
    } else inner = renderElementHtml(el, ctx, env.opts);
    parts.push(
      `<div class="pb-el pb-el-${el.type}" data-el="${escapeHtml(el.id || "")}" style="left:${mm(it.x)};top:${mm(it.y + dy)};width:${mm(el.w)};height:${mm(h)};${elementCss(el, env.theme)};${elementRuleCss(el, ctx)}">${inner}</div>`,
    );
  }
  const bg = lay.band.background ? `background:${lay.band.background};` : "";
  return { html: parts.join(""), bg };
}

function fragHtml(frag, env, vars) {
  const lay = frag.lay;
  if (frag.kind === "band") {
    const { html, bg } = bandHtml(lay, env, vars);
    return `<div class="pb-region" data-band="${escapeHtml(lay.band.id || "")}" style="top:${mm(frag.y)};width:100%;height:${mm(frag.h)};${bg}">${html}</div>`;
  }
  // a piece of a band cut at its table
  const t = lay.split;
  const m = t.table.m;
  let rowsH = 0;
  for (let k = frag.start; k < frag.end; k++) rowsH += m.rowH[k];
  const tableH = (frag.head ? m.headH : 0) + rowsH + (frag.last ? m.footH : 0) + m.boxExtra;
  const tableBottomDesign = t.y + t.h;
  const tableTop = frag.first ? t.y : 0;
  // Items below the table travel with its last piece; everything else (above
  // it or beside it) prints once, with the first piece.
  const { html, bg } = bandHtml(lay, env, vars, {
    skip: (it) => {
      if (it === t) return false;
      if (it.y >= tableBottomDesign - EPS) return !frag.last;
      return !frag.first;
    },
    dy: (it) => {
      if (it === t) return tableTop - t.y;
      if (it.y >= tableBottomDesign - EPS) return tableTop + tableH - tableBottomDesign;
      return 0;
    },
    table: { item: t, start: frag.start, end: frag.end, head: frag.head, last: frag.last, h: tableH },
  });
  return `<div class="pb-region" data-band="${escapeHtml(lay.band.id || "")}" style="top:${mm(frag.y)};width:100%;height:${mm(frag.h)};${bg}">${html}</div>`;
}

/**
 * What the printed pages cut off: an element past the printable area, content
 * wider or taller than its box, one-line text cut with "…". [] when clean.
 */
function overflowCheck(holder) {
  const out = [];
  const tol = 1.5; // px: sub-pixel rounding of mm boxes
  holder.querySelectorAll(".pb-content").forEach((c, pi) => {
    const cr = c.getBoundingClientRect();
    // a label clips its content (overflow:hidden): content taller than the label is cut
    c.querySelectorAll(".pb-label").forEach((lb, li) => {
      if (lb.scrollHeight > lb.clientHeight + tol) out.push(`p${pi + 1} label ${li + 1}: label content cut at the bottom`);
    });
    c.querySelectorAll(".pb-el").forEach((e) => {
      const id = `p${pi + 1} ${(e.className.match(/pb-el-(\w+)/) || [])[1] || "element"} ${e.getAttribute("data-el") || ""}`.trim();
      const r = e.getBoundingClientRect();
      if (r.right > cr.right + tol || r.left < cr.left - tol || r.bottom > cr.bottom + tol) out.push(`${id}: outside the printable area`);
      else if (e.scrollWidth > e.clientWidth + tol) out.push(`${id}: content wider than its box`);
      else if (!e.classList.contains("pb-el-image") && !e.classList.contains("pb-el-section") && e.scrollHeight > e.clientHeight + tol) out.push(`${id}: content cut at the bottom`);
      e.querySelectorAll(".pb-nowrap").forEach((n) => {
        if (n.scrollWidth > n.clientWidth + tol) out.push(`${id}: one-line text cut ("…")`);
      });
    });
  });
  return out;
}

/**
 * The template as it lays out for its data: a template that sets theme.direction ("ltr" or
 * "rtl") keeps it; one that does not follows the print language — the API sends
 * data.sys.lang = { column, code, dir } — so an Arabic print mirrors itself.
 */
export function withLanguageDirection(template, data) {
  if (!template || template.theme?.direction || data?.sys?.lang?.dir !== "rtl") return template;
  return { ...template, theme: { ...(template.theme || {}), direction: "rtl" } };
}

/**
 * Renders a whole document into `root` (a <body> or a container).
 * Resolves to { ok, pages, widthMm, heightMm, errors[] }.
 *
 * data.__batch (batch print): one document per record, each with its own page
 * numbering, one after another in the same PDF; the keys beside __batch (user,
 * centre, header, assets, i18n, sys) are shared by every record.
 */
export async function renderDocument(root, template, data, options = {}) {
  const doc = root.ownerDocument || document;
  template = withLanguageDirection(template, data);
  // The paper it prints on (options.paper overrides the template's own) picks the
  // profile; the template is reflowed to it (resolveLayout / adaptTemplate).
  const geo = resolveLayout(template || {}, options.paper);
  geo.mirror = !!template?.page?.mirrorMargins && !geo.roll;
  const tpl = adaptTemplate(template || {}, geo);
  const theme = { ...DEFAULT_THEME, ...(tpl.theme || {}) };
  const errors = new Set();
  const records = batchRecords(data || {});

  // Load every embedded face BEFORE measuring. fonts.ready alone resolves at
  // once when nothing has asked for a face yet, so text would be measured in
  // the fallback font and drawn in Inter — rows then overflow their pages.
  if (doc.fonts) {
    try {
      const loads = [];
      doc.fonts.forEach((f) => loads.push(f.load().catch(() => null)));
      await Promise.all(loads);
      await doc.fonts.ready;
    } catch {
      /* a missing font only changes metrics, never correctness */
    }
  }

  root.style.setProperty("--pb-accent", theme.accent);
  root.style.setProperty("--pb-accent-soft", softColor(theme.accent, 0.1));

  const measureHost = doc.createElement("div");
  measureHost.className = `pb-measure-host${theme.direction === "rtl" ? " pb-rtl" : ""}`;
  measureHost.style.cssText = `position:absolute;left:-20000px;top:0;visibility:hidden;width:${mm(geo.contentWidth)};font-family:${fontStack(theme.fontFamily)};font-size:${theme.fontSize}pt;line-height:${theme.lineHeight};color:${theme.color};--pb-accent:${theme.accent};--pb-accent-soft:${softColor(theme.accent, 0.1)}`;
  root.appendChild(measureHost);

  const env = { theme, measureHost, opts: { assetUrl: options.assetUrl }, roll: geo.roll };

  try {
    const html = [];
    let pageH = 0;
    let copyCount = 0;
    let security = null;
    for (const rec of records) {
      const d0 = applyCalculated(rec);
      const sys = { ...(d0.sys || {}), profile: geo.profile, paper: geo.size, orientation: geo.orientation, paperWidth: geo.width, contentWidth: Math.round(geo.contentWidth * 10) / 10, thermal: geo.profile === "THERMAL80" || geo.profile === "THERMAL58", roll: geo.roll };
      const rootCtx = { data: { ...d0, sys }, row: null, rows: [], vars: {}, theme, errors };
      // Page and report bands aggregate over the detail rows (sum(Amount) in a
      // page footer = the grand total), so they see them as `rows`.
      const detailBand = bandsOf(tpl, "detail")[0];
      if (detailBand) rootCtx.rows = datasetRows(detailBand.dataset, rootCtx, detailBand);
      // laid out again with this record's data on a reflowed paper: controls its data hides leave their rows
      // (a label sheet on any paper but its master: the paper sets the label grid)
      const reflow = geo.k < 1 - 1e-3 || geo.profile !== geo.designProfile || (tpl.labels?.enabled && !isMasterPaper(tpl, geo));
      const recTpl = reflow ? adaptTemplate(template || {}, { ...geo }, rootCtx) : tpl;
      if (!security) security = securityOf(tpl, rootCtx);

      // Copies (Patient / Office …): the whole document once per copy, each with
      // sys.copy = its label and its own page numbering, in one PDF.
      const copies = copyList(tpl, rootCtx);
      copyCount += copies.filter(Boolean).length || 1;
      for (const cp of copies) {
        const cctx = cp
          ? { ...rootCtx, data: { ...rootCtx.data, sys: { ...rootCtx.data.sys, copy: cp.label, copyIndex: cp.index, copies: copies.length } } }
          : rootCtx;
        const r = recTpl.labels?.enabled ? renderLabels(recTpl, cctx, env, geo) : renderPages(recTpl, cctx, env, geo);
        html.push(...r.html);
        pageH = Math.max(pageH, r.pageH);
      }
    }
    const total = html.length;

    measureHost.remove();
    const holder = doc.createElement("div");
    holder.className = "pb-pages";
    holder.innerHTML = html.join("");
    root.appendChild(holder);

    // @page size so the browser (or Chrome's PDF) prints exactly one sheet per .pb-page
    const st = doc.createElement("style");
    st.textContent = `@page{size:${mm(geo.width)} ${mm(pageH)};margin:0}`;
    doc.head.appendChild(st);

    const imgs = Array.from(holder.querySelectorAll("img"));
    await Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())));

    const res = { ok: true, pages: total, copies: copyCount, records: records.length, widthMm: geo.width, heightMm: pageH, profile: geo.profile, paper: geo.size, overflow: overflowCheck(holder), errors: Array.from(errors), engine: ENGINE_VERSION };
    if (security) res.security = security;
    return res;
  } catch (e) {
    measureHost.remove();
    return { ok: false, pages: 0, widthMm: geo.width, heightMm: geo.height, errors: [...errors, String(e && e.message ? e.message : e)], engine: ENGINE_VERSION };
  }
}

/** The records a data object prints: data.__batch entries over the shared keys, or the data itself. */
function batchRecords(d) {
  if (!Array.isArray(d.__batch) || !d.__batch.length) return [d];
  const shared = { ...d };
  delete shared.__batch;
  const n = d.__batch.length;
  return d.__batch.map((r, i) => ({
    ...shared,
    ...(r || {}),
    assets: { ...(shared.assets || {}), ...((r && r.assets) || {}) },
    sys: { ...(shared.sys || {}), ...((r && r.sys) || {}), batchIndex: i + 1, batchCount: n },
  }));
}

/**
 * PDF protection the server applies after printing (template `security`): the
 * open password evaluated here (passwordExpr, e.g. the patient's mobile number),
 * the permissions and signing flags as set. null when the template has none.
 */
function securityOf(tpl, ctx) {
  const s = tpl.security;
  if (!s || typeof s !== "object") return null;
  const out = { allowPrint: s.allowPrint !== false, allowCopy: s.allowCopy !== false, allowModify: !!s.allowModify, sign: !!s.sign, pdfa: !!s.pdfa };
  if (s.passwordExpr) {
    const v = evaluate(s.passwordExpr, ctx);
    const pw = isErr(v) || v == null ? "" : String(v).trim();
    if (pw) out.userPassword = pw.slice(0, 64);
  }
  return out;
}

/** The copies to print: template `copies` [{ label, when }] whose `when` holds; [null] = one plain copy. */
function copyList(tpl, ctx) {
  const list = (Array.isArray(tpl.copies) ? tpl.copies : []).filter((c) => c && (c.label || c.when));
  const on = list.filter((c) => !c.when || truthy(evaluate(c.when, ctx)));
  return on.length ? on.map((c, i) => ({ label: interpolate(c.label ?? "", ctx), index: i + 1 })) : [null];
}

/**
 * The `<section class="pb-page">` of one sheet. Mirrored margins (page.mirrorMargins,
 * bound books): even pages swap the left and right margins.
 */
function pageSection(geo, theme, pageNo, pageH, inner, wmHtml = "", credit = "") {
  const contentH = pageH - geo.margins.top - geo.margins.bottom;
  const left = geo.mirror && pageNo % 2 === 0 ? geo.margins.right : geo.margins.left;
  const rtl = theme.direction === "rtl" ? ";direction:rtl" : "";
  return (
    `<section class="pb-page" data-page="${pageNo}" style="width:${mm(geo.width)};height:${mm(pageH)};font-family:${fontStack(theme.fontFamily)};font-size:${theme.fontSize}pt;line-height:${theme.lineHeight};color:${theme.color}${rtl}">` +
    `<div class="pb-content" style="left:${mm(left)};top:${mm(geo.margins.top)};width:${mm(geo.contentWidth)};height:${mm(contentH)}">${inner}</div>${wmHtml}${credit}</section>`
  );
}

/*
 * Product credit printed in the bottom margin of every page: "Powered by
 * ITDOSE InfoSystems Pvt. Ltd." Outside the content box, so it never moves a
 * band or changes pagination. Off with page.poweredBy = false; never on label
 * sheets. A roll (thermal) receipt grows by CREDIT_MM so it has room. Both
 * words can be changed: poweredBy.mark (the badge, "ITD"; "" hides it),
 * poweredBy.label ("Powered by", "" hides it) and poweredBy.text (the name;
 * its first word prints bold).
 */
export const POWERED_BY = "ITDOSE InfoSystems Pvt. Ltd.";
export const POWERED_BY_LABEL = "Powered by";
export const POWERED_BY_MARK = "ITD";
const CREDIT_MM = 5;
/** The gradient badge; it widens with its text (46 units = 3 letters; CSS sets the height, width follows). */
function creditMark(text) {
  const w = Math.max(46, Math.round(text.length * 10.5 + 14));
  return (
    `<svg viewBox="0 0 ${w} 24" aria-hidden="true"><defs><linearGradient id="pbCreditGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0ea5e9"/><stop offset=".55" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>` +
    `<rect x=".5" y=".5" width="${w - 1}" height="23" rx="7" fill="url(#pbCreditGrad)"/><rect x="1" y="1" width="${w - 2}" height="10.5" rx="6.5" fill="#fff" opacity=".16"/>` +
    `<text x="${w / 2}" y="16.6" text-anchor="middle" font-family="Inter, 'Noto Sans', Arial, sans-serif" font-size="14" font-weight="800" letter-spacing="1" fill="#fff">${escapeHtml(text)}</text></svg>`
  );
}
const creditOn = (tpl) => tpl.page?.poweredBy !== false && !tpl.labels?.enabled;
/** page.poweredBy: false (off) or { position, style, dx, dy, mark, label, text } — see CREDIT_POSITIONS / CREDIT_STYLES. */
export const CREDIT_POSITIONS = ["bottom-center", "bottom-left", "bottom-right", "left-edge", "right-edge"];
export const CREDIT_STYLES = ["minimal", "pill", "soft", "dark"];
function creditOptions(tpl, geo) {
  const o = tpl.page?.poweredBy && typeof tpl.page.poweredBy === "object" ? tpl.page.poweredBy : {};
  let position = CREDIT_POSITIONS.includes(o.position) ? o.position : "bottom-center";
  if (geo.roll && position.endsWith("edge")) position = "bottom-center"; // a roll has no side margin to speak of
  return {
    position,
    style: CREDIT_STYLES.includes(o.style) ? o.style : "minimal",
    dx: num(o.dx, 0),
    dy: num(o.dy, 0),
    mark: typeof o.mark === "string" ? o.mark.trim().slice(0, 8) : POWERED_BY_MARK,
    label: typeof o.label === "string" ? o.label.trim() : POWERED_BY_LABEL,
    text: typeof o.text === "string" && o.text.trim() ? o.text.trim() : POWERED_BY,
  };
}
function creditHtml(geo, pageH, pageNo, opts) {
  const m = geo.margins;
  const mirrored = geo.mirror && pageNo % 2 === 0;
  const ml = mirrored ? m.right : m.left;
  const mr = mirrored ? m.left : m.right;
  const [brand, ...rest] = opts.text.split(/\s+/);
  const inner =
    `<span class="pb-credit-pill">${opts.mark ? creditMark(opts.mark) : ""}${opts.label ? `<span class="pb-credit-by">${escapeHtml(opts.label)}</span>` : ""}` +
    `<span class="pb-credit-org"><b>${escapeHtml(brand)}</b>${rest.length ? ` ${escapeHtml(rest.join(" "))}` : ""}</span></span>`;
  const { position, style, dx, dy } = opts;
  if (position.endsWith("edge")) {
    // a horizontal strip as long as the page, turned on its side and centred in the side margin
    const side = position === "left-edge" ? ml : mr;
    const h = Math.min(CREDIT_MM, Math.max(4, side));
    const small = side < 4.5;
    const cls = `pb-credit is-edge is-${style}${small ? " is-small" : ""}`;
    const box = `width:${mm(pageH)};height:${mm(h)}`;
    if (position === "left-edge") {
      const left = Math.max(0, (side - h) / 2) + dx;
      // laid out at top:0 and moved down by the transform: a box laid out below the sheet makes Chrome print an extra blank page
      return `<div class="${cls}" style="${box};left:${mm(left)};top:0;transform-origin:0 0;transform:translateY(${mm(pageH - dy)}) rotate(-90deg)">${inner}</div>`;
    }
    const left = geo.width - Math.max(0, (side - h) / 2) + dx;
    return `<div class="${cls}" style="${box};left:${mm(left)};top:${mm(-dy)};transform-origin:0 0;transform:rotate(90deg)">${inner}</div>`;
  }
  const h = Math.min(CREDIT_MM, Math.max(4, m.bottom));
  const small = geo.width < 90 || (!geo.roll && m.bottom < 4.5);
  const justify = position === "bottom-left" ? "flex-start" : position === "bottom-right" ? "flex-end" : "center";
  const pad = position === "bottom-center" ? "" : `;padding:0 ${mm(mr)} 0 ${mm(ml)}`;
  return `<div class="pb-credit is-${style}${small ? " is-small" : ""}" style="height:${mm(h)};justify-content:${justify}${pad};transform:translate(${mm(dx)},${mm(-dy)})">${inner}</div>`;
}

function watermarkHtml(tpl, rootCtx) {
  const wm = tpl.page?.watermark;
  if (!wm || !wm.text || (wm.when && !truthy(evaluate(wm.when, rootCtx)))) return "";
  return `<div class="pb-watermark" style="color:${cssVal(wm.color || "#000")};opacity:${num(wm.opacity, 0.08)};font-size:${num(wm.size, 72)}pt;transform:rotate(${num(wm.angle, -30)}deg)">${escapeHtml(interpolate(wm.text, rootCtx))}</div>`;
}

/**
 * Label sheets (template `labels`): the detail band is one label, printed once
 * per detail row (times `countExpr`, e.g. row.Qty) across `columns` and down the
 * sheet, `skip` positions left blank at the start of a part-used sheet. Page
 * header/footer and report bands do not print in this mode.
 */
export const LABEL_STOCKS = [
  { id: "a4-3x8", label: "A4 · 3 × 8 (70 × 37 mm)", page: "A4", columns: 3, rows: 8, width: 70, height: 37.1, gapX: 0, gapY: 0, margins: 0 },
  { id: "a4-2x7", label: "A4 · 2 × 7 (99 × 38 mm)", page: "A4", columns: 2, rows: 7, width: 99.1, height: 38.1, gapX: 2.5, gapY: 0, margins: 15 },
  { id: "a4-4x10", label: "A4 · 4 × 10 (48.5 × 25.4 mm)", page: "A4", columns: 4, rows: 10, width: 48.5, height: 25.4, gapX: 0, gapY: 0, margins: 21.5 },
  { id: "a4-5x13", label: "A4 · 5 × 13 (38.1 × 21.2 mm)", page: "A4", columns: 5, rows: 13, width: 38.1, height: 21.2, gapX: 2.5, gapY: 0, margins: 10.7 },
  { id: "roll-50x25", label: "Roll · 50 × 25 mm (lab sample)", page: "Custom", pageW: 50, pageH: 25, columns: 1, rows: 1, width: 50, height: 25, gapX: 0, gapY: 0, margins: 0 },
  { id: "roll-38x25", label: "Roll · 38 × 25 mm (pharmacy)", page: "Custom", pageW: 38, pageH: 25, columns: 1, rows: 1, width: 38, height: 25, gapX: 0, gapY: 0, margins: 0 },
  { id: "roll-100x50", label: "Roll · 100 × 50 mm (shipping)", page: "Custom", pageW: 100, pageH: 50, columns: 1, rows: 1, width: 100, height: 50, gapX: 0, gapY: 0, margins: 0 },
  { id: "band-250x25", label: "Wristband · 250 × 25 mm", page: "Custom", pageW: 250, pageH: 25, columns: 1, rows: 1, width: 250, height: 25, gapX: 0, gapY: 0, margins: 0 },
];

function renderLabels(tpl, rootCtx, env, geo) {
  const L = tpl.labels || {};
  const P = L._plan; // set by adaptLabels on a paper other than the master
  const theme = env.theme;
  const band = bandsOf(tpl, "detail")[0] || bandsOf(tpl, "reportHeader")[0];
  const lw = P ? P.width : Math.max(1, num(L.width, 50));
  const gx = Math.max(0, num(L.gapX));
  const gy = Math.max(0, num(L.gapY));
  const cols = P ? P.cols : Math.max(1, Math.floor(num(L.columns)) || Math.floor((geo.contentWidth + gx + EPS) / (lw + gx)) || 1);

  // one entry per label to print
  const items = [];
  if (band) {
    const rows = band.type === "detail" ? datasetRows(band.dataset, rootCtx, band) : [null];
    rows.forEach((r, i) => {
      const rctx = { ...rootCtx, row: r, rows, vars: { rowIndex: i, rowNumber: i + 1 } };
      let n = 1;
      if (L.countExpr) {
        const v = evaluate(L.countExpr, rctx);
        n = isErr(v) ? 1 : Math.max(0, Math.floor(toNumber(v) || 0));
      }
      for (let k = 0; k < n && items.length < 5000; k++) items.push(rctx);
    });
  }
  // laid out once each; on a derived paper (or with labels.grow, for plain sheets cut by hand)
  // a label grows to its content, so text is never cut; die-cut stock keeps its size on the master
  const lays = items.map((rctx, k) => layoutBand(band, { ...rctx, vars: { ...rctx.vars, labelNumber: k + 1 } }, env));
  const grow = !!(P || L.grow);
  const baseH = P ? P.height : Math.max(1, num(L.height, 25));
  const lh = grow ? Math.max(baseH, ...lays.map((l) => num(l.height))) : baseH;
  // a derived roll is one continuous page: every label, one row after another
  const rollAll = P && geo.roll;
  const rowsPer = rollAll
    ? Math.max(1, Math.ceil((Math.max(0, Math.floor(num(L.skip))) + items.length) / cols))
    : geo.roll ? 1 : Math.max(1, Math.min((!P && Math.floor(num(L.rows))) || Infinity, Math.floor((geo.contentHeight + gy + EPS) / (lh + gy))) || 1);
  const perPage = cols * rowsPer;
  const skip = Math.max(0, Math.min(perPage - 1, Math.floor(num(L.skip))));
  const pageH = geo.roll ? geo.margins.top + rowsPer * (lh + gy) - gy + geo.margins.bottom : geo.height;
  const pages = Math.max(1, Math.ceil((skip + items.length) / perPage));
  const out = Array.from({ length: pages }, () => []);
  items.forEach((rctx, k) => {
    const pos = skip + k;
    const p = Math.floor(pos / perPage);
    const slot = pos % perPage;
    const x = (slot % cols) * (lw + gx);
    const y = Math.floor(slot / cols) * (lh + gy);
    const vars = { ...rctx.vars, page: p + 1, pages, labelNumber: k + 1 };
    const lay = lays[k];
    const { html: h, bg } = bandHtml(lay, env, vars);
    const outline = L.outline ? "outline:0.2mm dashed #cbd5e1;outline-offset:-0.1mm;" : "";
    out[p].push(`<div class="pb-label" style="position:absolute;left:${mm(x)};top:${mm(y)};width:${mm(lw)};height:${mm(lh)};overflow:hidden;${bg}${outline}">${h}</div>`);
  });
  const wm = watermarkHtml(tpl, rootCtx);
  return { html: out.map((labels, i) => pageSection(geo, theme, i + 1, pageH, labels.join(""), wm)), pageH };
}

/**
 * The data rows a page prints, for page and running totals: the detail band's
 * rows when the template has one, else the rows of the tables on the page
 * (a table cut over pages counts each row on the page it prints on).
 */
function pageDataRows(page, hasDetail) {
  const out = [];
  for (const f of page.frags) {
    const lay = f.lay;
    if (hasDetail) {
      if (lay.band.type === "detail" && (f.kind === "band" || f.first) && lay.ctx.row) out.push(lay.ctx.row);
      continue;
    }
    if (f.kind === "table") {
      const d = lay.split.table.parts.data || [];
      for (let k = f.start; k < f.end; k++) if (d[k]) out.push(d[k]);
    } else {
      for (const it of lay.items) if (it.table && it.el.type === "table") for (const r of it.table.parts.data || []) if (r) out.push(r);
    }
  }
  return out;
}

/** The normal document: page header/footer on every sheet, the flow cut into pages. */
function renderPages(tpl, rootCtx, env, geo) {
  const theme = env.theme;
  // page header / footer heights (measured once, page 1 scope)
  const ph = bandsOf(tpl, "pageHeader");
  const pf = bandsOf(tpl, "pageFooter");
  const phCtx = { ...rootCtx, vars: { page: 1, pages: 1, pageRows: [], broughtRows: [], carriedRows: [] } };
  const phLays = ph.filter((b) => bandVisible(b, phCtx)).map((b) => layoutBand(b, phCtx, env));
  const pfLays = pf.filter((b) => bandVisible(b, phCtx)).map((b) => layoutBand(b, phCtx, env));
  const sumFor = (lays, i, total) => lays.filter((l) => printOnPage(l.band, i, total)).reduce((a, l) => a + l.height, 0);
  // footers marked "last" / "not last" are reserved on every page: the last page is not known until the end
  env.capacity = (i) => (geo.roll ? Infinity : geo.contentHeight - sumFor(phLays, i, null) - sumFor(pfLays, i, null));

  const flow = buildFlow(tpl, rootCtx, env);
  const pages = paginate(flow, env);
  const total = pages.length;

  // the rows of each page, for pageSum / broughtForward / carriedForward
  const hasDetail = bandsOf(tpl, "detail").length > 0;
  const perPage = pages.map((p) => pageDataRows(p, hasDetail));
  const before = [];

  let pageH = geo.height;
  if (geo.roll) {
    const body = pages[0].y;
    pageH = geo.margins.top + sumFor(phLays, 0, 1) + body + sumFor(pfLays, 0, 1) + geo.margins.bottom;
    pageH = Math.max(pageH, 30);
    if (creditOn(tpl) && geo.margins.bottom < CREDIT_MM) pageH += CREDIT_MM - geo.margins.bottom;
  }
  const contentH = pageH - geo.margins.top - geo.margins.bottom;
  const wmHtml = watermarkHtml(tpl, rootCtx);

  const html = [];
  for (let i = 0; i < total; i++) {
    const vars = { page: i + 1, pages: total, pageRows: perPage[i], broughtRows: before.slice(), carriedRows: before.concat(perPage[i]) };
    const p = pages[i];
    const regions = [];
    let top = 0;
    for (const lay of phLays) {
      if (!printOnPage(lay.band, i, total)) continue;
      const relaid = layoutBand(lay.band, { ...rootCtx, vars }, env);
      const { html: h, bg } = bandHtml(relaid, env, vars);
      regions.push(`<div class="pb-region pb-page-header" style="top:${mm(top)};width:100%;height:${mm(lay.height)};${bg}">${h}</div>`);
      top += lay.height;
    }
    const bodyTop = top;
    const bodyHtml = p.frags.map((f) => fragHtml(f, env, vars)).join("");
    regions.push(`<div class="pb-region pb-body" style="top:${mm(bodyTop)};width:100%;height:${mm(Math.max(0, contentH - bodyTop))}">${bodyHtml}</div>`);
    let fTotal = 0;
    for (const lay of pfLays) if (printOnPage(lay.band, i, total)) fTotal += lay.height;
    let fy = contentH - fTotal;
    for (const lay of pfLays) {
      if (!printOnPage(lay.band, i, total)) continue;
      const relaid = layoutBand(lay.band, { ...rootCtx, vars }, env);
      const { html: h, bg } = bandHtml(relaid, env, vars);
      regions.push(`<div class="pb-region pb-page-footer" style="top:${mm(fy)};width:100%;height:${mm(lay.height)};${bg}">${h}</div>`);
      fy += lay.height;
    }
    html.push(pageSection(geo, theme, i + 1, pageH, regions.join(""), wmHtml, creditOn(tpl) ? creditHtml(geo, pageH, i + 1, creditOptions(tpl, geo)) : ""));
    for (const r of perPage[i]) before.push(r);
  }
  return { html, pageH };
}

/* ========================================================================== */
/*  export (Excel)                                                            */
/* ========================================================================== */

const flatEls = (els) => (els || []).flatMap((e) => (e.type === "section" ? flatEls((e.children || []).map((k) => ({ ...k, x: num(e.x) + num(k.x), y: num(e.y) + num(k.y) }))) : [e]));
const isValueEl = (e) => e.type === "field" || e.type === "amountWords" || ((e.type === "label" || e.type === "heading") && /\{\{/.test(e.text || ""));
const plainLabel = (e) => (e.type === "label" || e.type === "heading") && e.text && !/\{\{/.test(e.text);
const labelText = (t) => String(t || "").replace(/\s*[:：]\s*$/, "").trim();

/**
 * The print as spreadsheet sheets: "Summary" (each header/footer value with the
 * label printed left of it), "Detail" (one row per detail row; column titles from
 * the labels above the fields) and one sheet per table / crosstab. Numbers stay
 * numbers. Batch records add their rows to the same sheets.
 * → { sheets: [{ name, columns: [..], rows: [[..]] }] }
 */
export function exportData(template, data, options = {}) {
  const geo = resolveLayout(template || {}, options.paper);
  const tpl = adaptTemplate(template || {}, geo);
  const theme = { ...DEFAULT_THEME, ...(tpl.theme || {}) };
  const errors = new Set();
  const sheets = new Map();
  const sheet = (id, name, columns) => {
    if (!sheets.has(id)) {
      const taken = new Set([...sheets.values()].map((s) => s.name.toLowerCase()));
      const base = String(name || "Sheet").replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 28) || "Sheet";
      let nm = base;
      for (let k = 2; taken.has(nm.toLowerCase()); k++) nm = `${base} ${k}`;
      sheets.set(id, { name: nm, columns, rows: [] });
    }
    return sheets.get(id);
  };
  const cell = (v, fmt) => {
    if (v == null || isErr(v)) return "";
    const t = fmt && fmt.type;
    if ((t === "number" || t === "currency" || t === "percent") && isNumericLike(v)) return toNumber(v);
    if ((!t || t === "none") && isNum(v)) return v;
    const f = formatValue(v, fmt, theme);
    return f == null ? "" : String(f);
  };
  const valueOf = (el, ctx) => {
    if (el.type === "label" || el.type === "heading") return interpolate(el.text, ctx);
    const v = el.expr ? evaluate(el.expr, ctx) : null;
    if (el.type === "amountWords") return isErr(v) || v == null ? "" : amountInWords(v, { currencyName: el.currencyName ?? "Rupees", subunitName: el.subunitName ?? "Paise", suffix: el.suffix ?? "Only" });
    return cell(v, el.format);
  };
  const labelLeftOf = (el, els) => {
    let best = null;
    for (const o of els) {
      if (!plainLabel(o) || Math.abs(num(o.y) - num(el.y)) > 2 || num(o.x) + num(o.w) > num(el.x) + 1) continue;
      if (!best || num(o.x) > num(best.x)) best = o;
    }
    return best ? labelText(best.text) : "";
  };
  const visible = (el, ctx) => !el._off && (!el.visibleIf || truthy(evaluate(el.visibleIf, ctx)));

  for (const rec of batchRecords(data || {})) {
    const d0 = applyCalculated(rec);
    const rootCtx = { data: d0, row: null, rows: [], vars: { page: 1, pages: 1 }, theme, errors };
    const detail = bandsOf(tpl, "detail")[0];
    if (detail) rootCtx.rows = datasetRows(detail.dataset, rootCtx, detail);

    // Summary: header / footer values with their labels
    const info = [];
    for (const b of tpl.bands || []) {
      if (b._off || !["pageHeader", "reportHeader", "reportFooter", "pageFooter"].includes(b.type) || !bandVisible(b, rootCtx)) continue;
      const els = flatEls(b.elements);
      for (const el of els) {
        if (!isValueEl(el) || !visible(el, rootCtx)) continue;
        // page numbers and page totals mean nothing in a spreadsheet
        if (/\b(page|pages|pageSum|broughtForward|carriedForward|copy)\b/i.test(`${el.expr || ""} ${el.text || ""}`)) continue;
        const v = valueOf(el, rootCtx);
        if (v === "" || v == null) continue;
        info.push([labelLeftOf(el, els) || el.exportLabel || el.expr || el.id, v]);
      }
    }
    if (info.length) sheet("summary", "Summary", ["Field", "Value"]).rows.push(...info);

    // Detail: one row per detail row
    if (detail && !detail._off) {
      const els = flatEls(detail.elements).filter(isValueEl).sort((a, b) => num(a.y) - num(b.y) || num(a.x) - num(b.x));
      if (els.length) {
        const above = ["groupHeader", "pageHeader", "reportHeader"].map((t) => flatEls(bandsOf(tpl, t).flatMap((b) => b.elements || [])).filter(plainLabel));
        const titleOf = (el) => {
          for (const labels of above) {
            const hits = labels.filter((o) => Math.min(num(o.x) + num(o.w), num(el.x) + num(el.w)) - Math.max(num(o.x), num(el.x)) > Math.min(num(el.w), num(o.w)) * 0.5);
            if (hits.length) return labelText(hits.sort((a, b) => num(b.y) - num(a.y))[0].text);
          }
          return el.exportLabel || el.expr || el.id;
        };
        const s = sheet("detail", "Detail", els.map(titleOf));
        rootCtx.rows.forEach((r, i) => {
          const c = { ...rootCtx, row: r, vars: { rowIndex: i, rowNumber: i + 1 } };
          s.rows.push(els.map((el) => (visible(el, c) ? valueOf(el, c) : "")));
        });
      }
    }

    // every table and crosstab outside the detail band
    let n = 0;
    for (const b of tpl.bands || []) {
      if (b._off || b.type === "detail" || b.type === "groupHeader" || b.type === "groupFooter") continue;
      for (const el of flatEls(b.elements)) {
        if (el.type !== "table" && el.type !== "crosstab") continue;
        n++;
        if (!visible(el, rootCtx)) continue;
        if (el.type === "crosstab") {
          const p = pivot(el, rootCtx);
          const cols = [el.rowHeader || "", ...p.colKeys, ...(el.rowTotals !== false ? [el.totalLabel ?? "Total"] : [])];
          const s = sheet(`x${n}`, el.exportName || el.rowHeader || `Crosstab ${n}`, cols);
          const fmt = el.format || { type: "number", decimals: el.agg === "count" ? 0 : 2 };
          for (const rk of p.rowKeys) s.rows.push([rk, ...p.colKeys.map((ck) => cell(p.cell(rk, ck), fmt)), ...(el.rowTotals !== false ? [cell(p.rowTotal(rk), fmt)] : [])]);
          if (el.colTotals !== false) s.rows.push([el.totalLabel ?? "Total", ...p.colKeys.map((ck) => cell(p.colTotal(ck), fmt)), ...(el.rowTotals !== false ? [cell(p.total, fmt)] : [])]);
          continue;
        }
        const cols = tableColumns(el);
        const tctx = rootCtx;
        const s = sheet(`t${n}`, el.exportName || cols[0]?.header || `Table ${n}`, cols.map((c) => interpolate(c.header ?? "", tctx)));
        const rows = datasetRows(el.dataset, tctx, el);
        let mainNo = 0;
        let lastGroup = null;
        rows.forEach((r, i) => {
          const base = { ...tctx, row: r, rows, vars: { rowIndex: i, rowNumber: mainNo + 1 } };
          if (el.subRowIf && truthy(evaluate(el.subRowIf, base))) {
            s.rows.push(["", interpolate(el.subRowText ?? "", base)]);
            return;
          }
          if (el.groupBy) {
            const g = evaluate(el.groupBy, base);
            const key = isErr(g) ? "#ERR" : String(g ?? "");
            if (key !== lastGroup) {
              lastGroup = key;
              s.rows.push([el.groupText ? interpolate(el.groupText, { ...base, vars: { ...base.vars, group: g } }) : key]);
            }
          }
          mainNo++;
          const rc = { ...base, vars: { ...base.vars, rowNumber: mainNo } };
          s.rows.push(cols.map((c) => (c.expr ? cell(evaluate(c.expr, rc), c.format) : "")));
        });
        if (el.showFooter && cols.some((c) => c.footerText || c.footerExpr)) {
          const fc = { ...tctx, rows };
          s.rows.push(cols.map((c) => (c.footerExpr ? cell(evaluate(c.footerExpr, fc), c.footerFormat || c.format) : c.footerText ? interpolate(c.footerText, fc) : "")));
        }
      }
    }
  }
  return { sheets: [...sheets.values()], errors: [...errors] };
}

/* ========================================================================== */
/*  shell + boot                                                              */
/* ========================================================================== */

const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const BS = String.fromCharCode(92); // a backslash, spelled out so no tool rewrites the escape
const jsonForScript = (v) =>
  JSON.stringify(v ?? null).replace(/</g, BS + "u003c").split(LS).join(BS + "u2028").split(PS).join(BS + "u2029");

/**
 * Script text made safe to inline: a literal "</script" inside it (this file
 * has some, here in buildShell) would end the <script> element early. With a
 * backslash before the slash it means the same inside a JS string, regex or
 * comment. Mirrored in C# (PrintRenderer.InlineScript).
 */
const inlineScript = (src) => String(src).replace(/<\/(script)/gi, (_, w) => "<" + BS + "/" + w);

/**
 * The complete HTML document that prints a template. The API builds exactly
 * this (C# mirror in PrintRenderer.BuildShell — keep the two byte-for-byte
 * alike); the builder preview puts it in an iframe. `engineSource` and
 * `vendorSource` are this file's text and engine/vendor/qrcode.js; `fontCss`
 * the @font-face rules (fontFaceCss). The engine's own CSS is injected by
 * boot(), so the shell carries nothing that could drift between the two.
 */
export function buildShell({ engineSource, vendorSource, fontCss, template, data, options = {}, title = "Print" }) {
  const payload = { template, data, options };
  return (
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
    `<style>${fontCss || ""}</style></head>` +
    `<body class="pb-doc${options.screen ? " pb-screen" : ""}">` +
    `<script type="application/json" id="pb-payload">${jsonForScript(payload)}</script>` +
    `<script>${inlineScript(vendorSource || "")}</script>` +
    `<script type="module">${inlineScript(engineSource)}\n;boot();</script>` +
    `</body></html>`
  );
}

/** Adds ENGINE_CSS to a document once (the shell, or the builder's own page). */
export function injectEngineCss(doc) {
  if (!doc || doc.getElementById("pb-engine-css")) return;
  const st = doc.createElement("style");
  st.id = "pb-engine-css";
  st.textContent = ENGINE_CSS;
  (doc.head || doc.documentElement).appendChild(st);
}

/**
 * Embedded fonts (OFL), named Family-Weight[-italic].woff2. The API builds the
 * same @font-face rules from the same files (as data URIs).
 */
export const FONT_FILES = [
  "Inter-400.woff2", "Inter-400-italic.woff2", "Inter-600.woff2", "Inter-700.woff2",
  "NotoSansDevanagari-400.woff2", "NotoSansDevanagari-700.woff2",
  "NotoSansGurmukhi-400.woff2", "NotoSansGurmukhi-700.woff2",
  "NotoSansArabic-400.woff2", "NotoSansArabic-700.woff2",
  "NotoSansKhmer-400.woff2", "NotoSansKhmer-700.woff2",
  "NotoSansLao-400.woff2", "NotoSansLao-700.woff2",
  "Tinos-400.woff2", "Tinos-700.woff2", "RobotoMono-400.woff2",
];

/** "NotoSansDevanagari-700.woff2" → { family:"Noto Sans Devanagari", weight:700, style:"normal" } */
export function fontFaceOf(file) {
  const m = String(file).match(/^([A-Za-z]+)-(\d{3})(-italic)?\.woff2$/);
  if (!m) return null;
  return { family: m[1].replace(/([a-z])([A-Z])/g, "$1 $2"), weight: Number(m[2]), style: m[3] ? "italic" : "normal" };
}

/** @font-face rules; `urlFor(file)` gives each file's URL (asset URL or data URI). */
export function fontFaceCss(urlFor) {
  return FONT_FILES.map((f) => {
    const face = fontFaceOf(f);
    const url = urlFor(f);
    if (!face || !url) return "";
    return `@font-face{font-family:'${face.family}';font-style:${face.style};font-weight:${face.weight};font-display:block;src:url(${url}) format('woff2')}`;
  }).join("");
}

/** Entry point inside a shell: render the embedded payload, publish the result. */
export async function boot() {
  const w = typeof window !== "undefined" ? window : globalThis;
  let result;
  try {
    injectEngineCss(document);
    const el = document.getElementById("pb-payload");
    const payload = JSON.parse(el ? el.textContent : "{}");
    const opts = payload.options || {};
    if (opts.screen) document.body.classList.add("pb-screen");
    // Excel export (PrintRenderer): the sheets only — nothing to lay out
    if (opts.export) w.__PB_EXPORT = exportData(payload.template, payload.data, opts);
    result = opts.export ? { ok: true, pages: 0, export: true, errors: w.__PB_EXPORT.errors || [], engine: ENGINE_VERSION } : await renderDocument(document.body, payload.template, payload.data, opts);
    if (opts.autoPrint && result.ok) setTimeout(() => w.print(), 350);
  } catch (e) {
    result = { ok: false, pages: 0, errors: [String(e && e.stack ? e.stack : e)] };
  }
  if (!result.ok) {
    const pre = document.createElement("pre");
    pre.className = "pb-fatal";
    pre.textContent = `Print failed:\n${(result.errors || []).join("\n")}`;
    document.body.appendChild(pre);
  }
  w.__PB_RESULT = result;
  w.__PB_DONE = true;
  try {
    if (w.parent && w.parent !== w) w.parent.postMessage({ type: "pb-rendered", result }, "*");
  } catch {
    /* cross-origin parent */
  }
  return result;
}

/* ========================================================================== */
/*  validation                                                                */
/* ========================================================================== */

/** Every expression a template holds: [{ src, kind:'expr'|'text', where, scope }]. */
export function templateExpressions(tpl) {
  const out = [];
  const detail = bandsOf(tpl, "detail")[0];
  const detailSet = detail ? setNameOf(detail.dataset) : null;
  const add = (src, kind, where, scope) => {
    if (src == null || String(src).trim() === "") return;
    if (kind === "text") {
      const re = new RegExp(TOKEN_TPL.source, "g");
      let m;
      while ((m = re.exec(String(src)))) out.push({ src: m[1].trim(), kind: "expr", where, scope });
    } else out.push({ src: String(src), kind, where, scope });
  };
  const walkEl = (el, band, bandScope, path) => {
    const where = { band: band.id, bandType: band.type, element: el.id, elementType: el.type, path };
    add(el.visibleIf, "expr", { ...where, prop: "visibleIf" }, bandScope);
    (el.styleRules || []).forEach((r, i) => add(r?.when, "expr", { ...where, prop: `styleRules[${i}].when` }, bandScope));
    switch (el.type) {
      case "label":
      case "heading":
        add(el.text, "text", { ...where, prop: "text" }, bandScope);
        break;
      case "field":
      case "amountWords":
      case "barcode":
      case "qr":
        add(el.expr, "expr", { ...where, prop: "expr" }, bandScope);
        break;
      case "signature":
        add(el.label, "text", { ...where, prop: "label" }, bandScope);
        add(el.nameExpr, "expr", { ...where, prop: "nameExpr" }, bandScope);
        break;
      case "richtext":
        if (el.htmlExpr) add(el.htmlExpr, "expr", { ...where, prop: "htmlExpr" }, bandScope);
        else add(el.html, "text", { ...where, prop: "html" }, bandScope);
        break;
      case "image":
        if (el.source === "expr") add(el.expr, "expr", { ...where, prop: "expr" }, bandScope);
        break;
      case "table": {
        add(el.dataset, "expr", { ...where, prop: "dataset" }, bandScope);
        const set = setNameOf(el.dataset);
        add(el.filter, "expr", { ...where, prop: "filter" }, set);
        add(el.sortBy, "expr", { ...where, prop: "sortBy" }, set);
        add(el.groupBy, "expr", { ...where, prop: "groupBy" }, set);
        add(el.groupText, "text", { ...where, prop: "groupText" }, set);
        add(el.groupNoteText, "text", { ...where, prop: "groupNoteText" }, set);
        add(el.groupFooterText, "text", { ...where, prop: "groupFooterText" }, set);
        add(el.groupFooterExpr, "expr", { ...where, prop: "groupFooterExpr" }, set);
        add(el.subRowIf, "expr", { ...where, prop: "subRowIf" }, set);
        add(el.subRowText, "text", { ...where, prop: "subRowText" }, set);
        add(el.emptyText, "text", { ...where, prop: "emptyText" }, bandScope);
        (el.rowRules || []).forEach((r, i) => add(r?.when, "expr", { ...where, prop: `rowRules[${i}].when` }, set));
        for (const c of tableColumns(el)) {
          const w2 = { ...where, column: c.id, columnHeader: c.header };
          add(c.header, "text", { ...w2, prop: "header" }, bandScope);
          add(c.expr, "expr", { ...w2, prop: "expr" }, set);
          (c.styleRules || []).forEach((r, i) => add(r?.when, "expr", { ...w2, prop: `styleRules[${i}].when` }, set));
          add(c.footerExpr, "expr", { ...w2, prop: "footerExpr", aggregateScope: set }, set);
          add(c.footerText, "text", { ...w2, prop: "footerText", aggregateScope: set }, set);
        }
        break;
      }
      case "crosstab": {
        add(el.dataset, "expr", { ...where, prop: "dataset" }, bandScope);
        const set = setNameOf(el.dataset);
        add(el.filter, "expr", { ...where, prop: "filter" }, set);
        add(el.rowExpr, "expr", { ...where, prop: "rowExpr" }, set);
        add(el.colExpr, "expr", { ...where, prop: "colExpr" }, set);
        if (el.agg !== "count") add(el.valueExpr, "expr", { ...where, prop: "valueExpr" }, set);
        break;
      }
      case "chart": {
        add(el.dataset, "expr", { ...where, prop: "dataset" }, bandScope);
        const set = setNameOf(el.dataset);
        add(el.filter, "expr", { ...where, prop: "filter" }, set);
        add(el.labelExpr, "expr", { ...where, prop: "labelExpr" }, set);
        add(el.title, "text", { ...where, prop: "title" }, bandScope);
        if (el.agg !== "count") {
          if (Array.isArray(el.series) && el.series.length) el.series.forEach((s, i) => add(s?.expr, "expr", { ...where, prop: `series[${i}].expr` }, set));
          else add(el.valueExpr, "expr", { ...where, prop: "valueExpr" }, set);
        }
        break;
      }
      case "section":
        for (const k of el.children || []) walkEl(k, band, bandScope, [...(path || []), el.id]);
        break;
      default:
        break;
    }
  };
  for (const band of tpl.bands || []) {
    const rowScoped = ["detail", "groupHeader", "groupFooter"].includes(band.type);
    const bandScope = rowScoped ? detailSet : null;
    const where = { band: band.id, bandType: band.type };
    if (band.type === "detail") add(band.dataset, "expr", { ...where, prop: "dataset" }, null);
    if (band.type === "detail") {
      add(band.sortBy, "expr", { ...where, prop: "sortBy" }, detailSet);
      add(band.filter, "expr", { ...where, prop: "filter" }, detailSet);
    }
    if (band.groupBy) add(band.groupBy, "expr", { ...where, prop: "groupBy" }, detailSet);
    add(band.visibleIf, "expr", { ...where, prop: "visibleIf" }, bandScope);
    for (const el of band.elements || []) walkEl(el, band, bandScope, []);
  }
  const wm = tpl.page?.watermark;
  if (wm) {
    add(wm.when, "expr", { band: null, prop: "watermark.when" }, null);
    add(wm.text, "text", { band: null, prop: "watermark.text" }, null);
  }
  (tpl.copies || []).forEach((c, i) => {
    add(c?.when, "expr", { band: null, prop: `copies[${i}].when` }, null);
    add(c?.label, "text", { band: null, prop: `copies[${i}].label` }, null);
  });
  if (tpl.labels?.enabled) add(tpl.labels.countExpr, "expr", { band: null, prop: "labels.countExpr" }, detailSet);
  if (tpl.security) add(tpl.security.passwordExpr, "expr", { band: null, prop: "security.passwordExpr" }, null);
  return out;
}

/** "items" | "bill.items"? → the result set name a dataset expression names. */
export function setNameOf(src) {
  if (!src) return null;
  const s = String(src).trim();
  return /^[A-Za-z_][\w]*$/.test(s) ? s : null;
}

/** Identifier paths an expression reads, with the row scope they read in. */
export function collectRefs(ast, rowScope = undefined, out = []) {
  const chain = (n) => {
    const parts = [];
    let cur = n;
    while (cur && (cur.t === "mem" || cur.t === "idx")) {
      if (cur.t === "mem") parts.unshift(cur.k);
      else if (cur.k.t !== "lit") collectRefs(cur.k, rowScope, out);
      else if (typeof cur.k.v === "string") parts.unshift(cur.k.v);
      cur = cur.o;
    }
    if (cur && cur.t === "id") {
      parts.unshift(cur.n);
      return parts;
    }
    if (cur) collectRefs(cur, rowScope, out);
    return null;
  };
  switch (ast.t) {
    case "id":
      out.push({ path: [ast.n], rowScope });
      break;
    case "mem":
    case "idx": {
      const p = chain(ast);
      if (p) out.push({ path: p, rowScope });
      break;
    }
    case "un":
      collectRefs(ast.a, rowScope, out);
      break;
    case "bin":
      collectRefs(ast.a, rowScope, out);
      collectRefs(ast.b, rowScope, out);
      break;
    case "cond":
      collectRefs(ast.c, rowScope, out);
      collectRefs(ast.a, rowScope, out);
      collectRefs(ast.b, rowScope, out);
      break;
    case "call": {
      const name = ast.n.toLowerCase();
      if (AGGREGATES.has(name)) {
        if (ast.args.length >= 2) {
          const set = ast.args[1].t === "id" ? ast.args[1].n : null;
          collectRefs(ast.args[1], rowScope, out);
          if (ast.args[0]) collectRefs(ast.args[0], set ? { set } : rowScope, out);
        } else if (ast.args.length === 1 && ast.args[0].t === "mem" && ast.args[0].o.t === "id" && ast.args[0].o.n !== "row") {
          // sum(items.Amount)
          out.push({ path: [ast.args[0].o.n], rowScope });
          out.push({ path: [ast.args[0].k], rowScope: { set: ast.args[0].o.n } });
        } else if (ast.args[0]) collectRefs(ast.args[0], { aggregate: true, inner: rowScope }, out);
      } else if (OWN.call(PAGE_AGGREGATES, name)) {
        if (ast.args[0]) collectRefs(ast.args[0], { aggregate: true, page: true, inner: rowScope }, out);
      } else {
        out.push({ fn: ast.n });
        for (const a of ast.args) collectRefs(a, rowScope, out);
      }
      break;
    }
    default:
      break;
  }
  return out;
}

const KNOWN_FUNCTIONS = new Set([...Object.keys(FUNCTIONS), ...AGGREGATES, ...Object.keys(PAGE_AGGREGATES), "format", "date", "now", "today"]);

/**
 * Checks a template against the datasource's field list.
 * schema = { sets: { items: ["ItemName", …], … }, params: ["transactionId", …] }
 * Returns { errors:[{message, where}], warnings:[…] }.
 */
export function validateTemplate(tpl, schema) {
  const errors = [];
  const warnings = [];
  const sets = schema && schema.sets ? schema.sets : null;
  const setNames = sets ? Object.keys(sets) : [];
  const fieldsOf = (s) => (sets && sets[s]) || null;
  const hasCI = (list, name) => list.some((f) => f.toLowerCase() === String(name).toLowerCase());
  const hasExact = (list, name) => list.includes(name);

  // structure
  const bands = tpl.bands || [];
  const ids = new Set();
  const detailBands = bands.filter((b) => b.type === "detail");
  if (detailBands.length > 1) errors.push({ message: "Only one Detail band is supported — use a Table element for other row sets.", where: { band: detailBands[1].id } });
  for (const b of detailBands) if (!b.dataset) errors.push({ message: "Detail band has no row set (dataset).", where: { band: b.id, prop: "dataset" } });
  for (const b of bands) {
    if ((b.type === "groupHeader" || b.type === "groupFooter") && !b.groupBy) errors.push({ message: "Group band needs a 'group by' expression.", where: { band: b.id, prop: "groupBy" } });
    if ((b.type === "groupHeader" || b.type === "groupFooter") && !detailBands.length) errors.push({ message: "Group bands need a Detail band.", where: { band: b.id } });
    for (const el of b.elements || []) {
      if (el.id) {
        if (ids.has(el.id)) errors.push({ message: `Duplicate element id ${el.id}.`, where: { band: b.id, element: el.id } });
        ids.add(el.id);
      }
      if (el.type === "table") {
        if (!el.dataset) errors.push({ message: "Table has no row set.", where: { band: b.id, element: el.id, prop: "dataset" } });
        if (!tableColumns(el).length) errors.push({ message: "Table has no columns.", where: { band: b.id, element: el.id } });
      }
      if ((el.type === "chart" || el.type === "crosstab") && !el.dataset) errors.push({ message: `${el.type === "chart" ? "Chart" : "Crosstab"} has no row set.`, where: { band: b.id, element: el.id, prop: "dataset" } });
      if (el.type === "crosstab" && (!el.rowExpr || !el.colExpr)) errors.push({ message: "Crosstab needs a row field and a column field.", where: { band: b.id, element: el.id, prop: el.rowExpr ? "colExpr" : "rowExpr" } });
      if (el.type === "subreport" && !el.templateCode) errors.push({ message: "Sub-report has no template.", where: { band: b.id, element: el.id, prop: "templateCode" } });
      if (el.type === "subreport" && el.templateCode && tpl._code && String(el.templateCode).toUpperCase() === String(tpl._code).toUpperCase()) errors.push({ message: "A template cannot contain itself as a sub-report.", where: { band: b.id, element: el.id, prop: "templateCode" } });
      if (num(el.y) + num(el.h) > num(b.height) + 0.5 && !canGrow(el)) warnings.push({ message: `${el.type} runs past the bottom of its band.`, where: { band: b.id, element: el.id } });
    }
  }

  // single master: one control per thing printed, nothing switched per paper (the adapter derives every paper)
  for (const fl of perPaperFlags(tpl))
    errors.push({ message: `Per-paper flag "${fl.flag}" on ${fl.where} — design once on the master; other papers are laid out automatically. Use "Convert to single master".`, where: { band: fl.band?.id, element: fl.el?.id } });
  for (const dup of findDuplicates(tpl))
    errors.push({ message: `Duplicate control: ${dup.el.type} ${dup.el.id} prints the same as ${dup.of.id} in ${dup.where}. Keep one control; other papers are laid out from it.`, where: { band: dup.band.id, element: dup.el.id } });

  if (!sets) warnings.push({ message: "No field list yet — fetch sample data to check bindings.", where: {} });

  for (const x of templateExpressions(tpl)) {
    let ast;
    try {
      ast = parseExpr(x.src);
    } catch (e) {
      errors.push({ message: `Syntax error in "${x.src}": ${e.message}`, where: x.where });
      continue;
    }
    const refs = collectRefs(ast);
    for (const r of refs) {
      if (r.fn) {
        if (!KNOWN_FUNCTIONS.has(r.fn.toLowerCase())) errors.push({ message: `Unknown function ${r.fn}() in "${x.src}".`, where: x.where });
        continue;
      }
      if (!sets) continue;
      const path = r.path;
      const root = path[0];
      // the row set this reference reads rows of
      let scope = x.scope;
      if (r.rowScope && r.rowScope.set) scope = r.rowScope.set;
      else if (r.rowScope && r.rowScope.page) scope = detailSetOf(tpl) || firstTableSetOf(tpl);
      else if (r.rowScope && r.rowScope.aggregate) scope = x.where.aggregateScope || x.scope || (["reportHeader", "reportFooter", "pageHeader", "pageFooter", "groupHeader", "groupFooter"].includes(x.where.bandType) ? detailSetOf(tpl) : x.scope);
      const scopeFields = scope ? fieldsOf(scope) : null;
      if (root === "row" && path.length > 1) {
        if (scopeFields && !hasCI(scopeFields, path[1])) errors.push({ message: `Field "${path[1]}" is not in row set "${scope}".`, where: x.where });
        continue;
      }
      if (VAR_NAMES.includes(root) || root === "groupCount") continue;
      if (schema.rootFields && hasCI(schema.rootFields, root)) continue; // calculated fields on the data root
      if (scopeFields && hasExact(scopeFields, root)) continue;
      if (scopeFields && hasCI(scopeFields, root)) {
        warnings.push({ message: `"${root}" differs in letter case from the field in "${scope}".`, where: x.where });
        continue;
      }
      if (ROOT_NAMES.includes(root)) {
        if (root === "params") {
          if (path[1] && schema.params && !hasCI(schema.params, path[1])) errors.push({ message: `Parameter "${path[1]}" is not declared on the datasource.`, where: x.where });
        } else if (root !== "assets" && path[1] && ROOT_KEYS[root] && !hasCI(ROOT_KEYS[root], path[1]) && !(schema.extraRootKeys?.[root] || []).includes(path[1])) {
          warnings.push({ message: `"${root}.${path[1]}" is not a known ${root} field.`, where: x.where });
        }
        continue;
      }
      if (setNames.includes(root)) {
        if (path[1] && !/^\d+$/.test(path[1]) && path[1] !== "length") {
          const f = fieldsOf(root);
          if (!hasCI(f, path[1])) errors.push({ message: `Field "${path[1]}" is not in result set "${root}".`, where: x.where });
        }
        continue;
      }
      errors.push({
        message: scope ? `Unknown field "${root}" (not in row set "${scope}" or the data root).` : `Unknown field "${root}" — bind to a result set (e.g. ${setNames[0] || "items"}.${root}) or params/user/centre/header/sys.`,
        where: x.where,
      });
    }
  }
  return { errors, warnings };
}
const detailSetOf = (tpl) => {
  const d = bandsOf(tpl, "detail")[0];
  return d ? setNameOf(d.dataset) : null;
};
/** The row set of the first table outside the page bands (what page totals add up without a detail band). */
const firstTableSetOf = (tpl) => {
  for (const b of tpl.bands || []) {
    if (b.type === "pageHeader" || b.type === "pageFooter") continue;
    const t = flatEls(b.elements).find((e) => e.type === "table" && e.dataset);
    if (t) return setNameOf(t.dataset);
  }
  return null;
};

/* ========================================================================== */

const api = {
  ENGINE_VERSION, PAGE_SIZES, DEFAULT_THEME, FONT_STACKS, ENGINE_CSS,
  parseExpr, evaluate, interpolate, formatValue, formatDate, toDate, amountInWords, numberInWords,
  renderElementHtml, elementCss, tableParts, resolvePage, renderDocument, buildShell, boot,
  validateTemplate, templateExpressions, collectRefs, sanitizeHtml, resolveLayout, adaptTemplate, toSingleMaster, perPaperFlags, findDuplicates, masterPage, code128Values, dataMatrix, ruleCss, translateText, withLanguageDirection,
  injectEngineCss, fontFaceCss, FONT_FILES, applyCalculated, exportData, pivot, chartData, chartSvg,
};
if (typeof window !== "undefined") window.PrintEngine = api;
export default api;
