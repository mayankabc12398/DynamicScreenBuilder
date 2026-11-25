/**
 * What props a component reads — and safe stand-ins for the ones nobody passes.
 *
 * "Open modal" can mount any component of the app: a dialog written for
 * ProjectModal (ReferDoctorModal: `{ isProName, setModalData, DropDownState }`)
 * or a whole page (IDPDetailCard: `{ singlePatientData, SearchPatient, ... }`).
 * Each was written for the one parent that renders it, and calls what that
 * parent hands it. Mounted anywhere else, the first `setModalData(values)` is
 * "setModalData is not a function" and the dialog is gone.
 *
 * The component's own source says what it expects: the keys it destructures
 * from its props (`({ a, b: c, d = 1 })`, `const { a } = props`) and the
 * members it reads (`props.a`, `this.props.a`). Keys survive minification —
 * they are property names, not locals — so this reads the same in a production
 * bundle as in dev. Anything it expects and is not given gets a stand-in chosen
 * by its name: a callback that does nothing, a close that closes, an empty list,
 * an empty record. What it IS given always wins.
 */

const IDENT_RE = /^[A-Za-z_$][\w$]*$/;

/** memo / forwardRef / plain function, down to the function that renders. */
function renderFunction(comp, depth = 0) {
  if (!comp || depth > 4) return null;
  if (typeof comp === "function") return comp;
  if (typeof comp === "object") return renderFunction(comp.type || comp.render, depth + 1);
  return null;
}

/** Index of the quote that closes the string opening at `i`. */
function skipString(src, i) {
  const q = src[i];
  for (let j = i + 1; j < src.length; j += 1) {
    if (src[j] === "\\") {
      j += 1;
    } else if (src[j] === q) {
      return j;
    }
  }
  return src.length;
}

/** The text inside the bracket at `open` and its partner; null if unbalanced. */
function inside(src, open) {
  const close = { "{": "}", "(": ")", "[": "]" };
  const stack = [];
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(src, i);
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) return null;
      i = end + 1;
    } else if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      if (end < 0) return null;
      i = end;
    } else if (close[c]) {
      stack.push(close[c]);
    } else if (c === "}" || c === ")" || c === "]") {
      if (stack.pop() !== c) return null;
      if (!stack.length) return src.slice(open + 1, i);
    }
  }
  return null;
}

/** Split on the commas that are not inside a bracket or a string. */
function splitTop(s) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(s, i);
    else if (c === "{" || c === "(" || c === "[") depth += 1;
    else if (c === "}" || c === ")" || c === "]") depth -= 1;
    else if (c === "," && depth === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

/** Keys of a destructuring pattern's body: `a, b: c, d = 1, "e": f, ...rest`. */
function patternKeys(body) {
  return splitTop(body)
    .map((part) => {
      const t = part.trim();
      if (!t || t.startsWith("...")) return null;
      const m = t.match(/^(["']?)([A-Za-z_$][\w$]*)\1\s*(?:[:=]|$)/);
      return m ? m[2] : null;
    })
    .filter(Boolean);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Names read off an object called `who` in `src`: `who.a`, `const { a } = who`. */
function readsOf(src, who, into) {
  const member = new RegExp(`(?:^|[^\\w$.])${escapeRe(who)}\\??\\.([A-Za-z_$][\\w$]*)`, "g");
  let m = member.exec(src);
  while (m) {
    into.add(m[1]);
    m = member.exec(src);
  }
  const destructure = new RegExp(`\\{([^{}]*)\\}\\s*=\\s*${escapeRe(who)}(?![\\w$.])`, "g");
  m = destructure.exec(src);
  while (m) {
    patternKeys(m[1]).forEach((k) => into.add(k));
    m = destructure.exec(src);
  }
}

const cache = new WeakMap();

/**
 * The prop names a component reads, best effort. An empty list means "could
 * not tell", never "reads nothing" — callers treat it as nothing to fill in.
 */
export function propNamesOf(comp) {
  const fn = renderFunction(comp);
  if (!fn) return [];
  if (cache.has(fn)) return cache.get(fn);
  const names = new Set();
  try {
    const src = Function.prototype.toString.call(fn);
    if (/^class\b/.test(src)) {
      readsOf(src, "this.props", names);
    } else {
      // An arrow with one bare parameter: `props => …`.
      const bare = src.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*=>/);
      const open = bare ? -1 : src.indexOf("(");
      const params = open >= 0 ? inside(src, open) : null;
      const first = bare ? bare[1] : params != null ? splitTop(params)[0].trim() : "";
      if (first.startsWith("{")) {
        const body = inside(first, 0);
        if (body != null) patternKeys(body).forEach((k) => names.add(k));
      } else {
        // `(props)` or `(props = {})`: whatever it reads off that name.
        const name = first.split("=")[0].trim();
        if (IDENT_RE.test(name)) readsOf(src, name, names);
      }
    }
  } catch (e) {
    /* a component we cannot read is simply not helped */
  }
  const list = [...names].filter((n) => n !== "children" && n !== "key" && n !== "ref");
  cache.set(fn, list);
  return list;
}

/* -------------------------------------------------------- dialog fields -- */

/*
 * What a dialog reports through setModalData — the keys its Save payload maps.
 *
 * ReferDoctorModal keeps `values = useState({ title: {label, value}, name,
 * contactNo, proName: {label, value}, address })` and calls
 * `setModalData(values)`; others call `setModalData(prev => ({ ...prev,
 * [name]: value }))` from their inputs, or nest it under a key. The call's
 * argument is followed back to what it is built from: an object literal, a
 * state's initial value, a local object, an updater's return value. A computed
 * key (`[name]`) stands for the `name` of every input the component draws.
 * Like the prop names, object keys and `name: "x"` survive minification.
 */

// Keys a parent's own modal state carries that are not the dialog's data.
const NOT_DATA = new Set(["visible", "isVisible", "show", "size", "width", "setVisible", "header", "Header", "footer"]);
const SELECT = () => new Map([["value", null], ["label", null]]);

/** Drop the parentheses an object body is wrapped in: `({ a })` → `{ a }`. */
function unwrapParens(e) {
  let s = e.trim();
  while (s.startsWith("(") && inside(s, 0) != null && inside(s, 0).length === s.length - 2) s = s.slice(1, -1).trim();
  return s;
}

function mergeShape(into, from) {
  from.forEach((sub, key) => {
    const had = into.get(key);
    if (had instanceof Map && sub instanceof Map) mergeShape(had, sub);
    else if (!(had instanceof Map)) into.set(key, sub instanceof Map ? new Map(sub) : sub);
  });
  return into;
}

/** The index of the `{` whose object holds position `at`; -1 if none. */
function enclosingBrace(src, at) {
  let depth = 0;
  for (let i = at - 1; i >= 0; i -= 1) {
    const c = src[i];
    if (c === "}") depth += 1;
    else if (c === "{") {
      if (!depth) return i;
      depth -= 1;
    }
  }
  return -1;
}

/** Top-level key names of an object literal's body. */
const objectKeys = (body) =>
  splitTop(body)
    .map((p) => p.trim().match(/^(["']?)([A-Za-z_$][\w$]*)\1\s*[:,]?/))
    .filter(Boolean)
    .map((m) => m[2]);

/**
 * Every `name: "x"` the component hands a control, as a shape. A control that
 * is one of the app's selects (dynamicOptions / placeholderName) reports the
 * option it holds, `{ label, value }`.
 */
function drawnFields(src) {
  const out = new Map();
  const re = /(^|[{,\s])name\s*:\s*(["'`])([A-Za-z_$][\w$.-]*)\2/g;
  let m = re.exec(src);
  while (m) {
    const open = enclosingBrace(src, m.index + m[1].length);
    const keys = open >= 0 ? objectKeys(inside(src, open) || "") : [];
    const select = keys.includes("dynamicOptions") || keys.includes("placeholderName");
    if (!out.has(m[3]) || select) out.set(m[3], select ? SELECT() : null);
    m = re.exec(src);
  }
  return out;
}

function shapeCtx(src) {
  let drawn = null;
  return {
    src,
    prev: null,
    seen: new Set(),
    drawn: () => {
      if (!drawn) drawn = drawnFields(src);
      return drawn;
    },
  };
}

/** The expression a block body returns — its last `return`, up to where it ends. */
function returned(block) {
  const re = /(^|[^\w$])return\b/g;
  let at = -1;
  let m = re.exec(block);
  while (m) {
    at = m.index + m[0].length;
    m = re.exec(block);
  }
  if (at < 0) return "";
  const rest = block.slice(at);
  let depth = 0;
  for (let i = 0; i < rest.length; i += 1) {
    const c = rest[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(rest, i);
    else if (c === "{" || c === "(" || c === "[") depth += 1;
    else if (c === "}" || c === ")" || c === "]") {
      if (!depth) return rest.slice(0, i);
      depth -= 1;
    } else if ((c === ";" || c === ",") && !depth) return rest.slice(0, i);
  }
  return rest;
}

/** What a value expression holds: a Map of key → shape, or null for a leaf / unknown. */
function shapeOf(expr, ctx, depth = 0) {
  const e = unwrapParens(String(expr || ""));
  if (!e || depth > 24) return null;
  // An updater, `prev => ({ ...prev, x })`: what it returns, with `prev` marked
  // as the old value (spreading it adds nothing we can read).
  const arrow = e.match(/^(?:async\s*)?(?:\(\s*([A-Za-z_$][\w$]*)?\s*(?:,[^)]*)?\)|([A-Za-z_$][\w$]*))\s*=>\s*/);
  if (arrow) {
    const inner = { ...ctx, prev: arrow[1] || arrow[2] || null };
    const body = e.slice(arrow[0].length).trim();
    // `=> {` is always a block; an object comes back as `=> ({ … })`.
    if (body.startsWith("{")) {
      const block = inside(body, 0);
      return block == null ? null : shapeOf(returned(block), inner, depth + 1);
    }
    return shapeOf(body, inner, depth + 1);
  }
  const fn = e.match(/^function\s*[\w$]*\s*\(\s*([A-Za-z_$][\w$]*)?[^)]*\)\s*/);
  if (fn) {
    const block = inside(e, fn[0].length);
    return block == null ? null : shapeOf(returned(block), { ...ctx, prev: fn[1] || null }, depth + 1);
  }
  if (e.startsWith("{")) {
    const body = inside(e, 0);
    return body == null ? null : objectShape(body, ctx, depth + 1);
  }
  if (IDENT_RE.test(e)) return identShape(e, ctx, depth + 1);
  return null;
}

function objectShape(body, ctx, depth) {
  const out = new Map();
  // `{}` is how the app starts a select that has nothing picked yet.
  if (!body.trim()) return SELECT();
  splitTop(body).forEach((part) => {
    const t = part.trim();
    if (!t) return;
    if (t.startsWith("...")) {
      const what = t.slice(3).trim();
      const head = (what.match(/^[A-Za-z_$][\w$]*/) || [])[0];
      if (head && head === ctx.prev) return;
      const s = shapeOf(what, ctx, depth + 1);
      if (s instanceof Map) mergeShape(out, s);
      return;
    }
    if (t.startsWith("[")) {
      mergeShape(out, ctx.drawn());
      return;
    }
    const m = t.match(/^(["'`]?)([A-Za-z_$][\w$]*)\1\s*(:)?/);
    if (!m) return;
    const rest = t.slice(m[0].length).trim();
    if (m[3]) out.set(m[2], shapeOf(rest, ctx, depth + 1));
    else if (!rest.startsWith("(")) out.set(m[2], m[2] === ctx.prev ? null : identShape(m[2], ctx, depth + 1));
  });
  return out;
}

/** What a local name holds: a state's initial value, or an object it was set to. */
function identShape(name, ctx, depth) {
  if (!name || name === ctx.prev || ctx.seen.has(name) || depth > 24) return null;
  const seen = new Set(ctx.seen).add(name);
  const inner = { ...ctx, seen, prev: null };
  const src = ctx.src;
  const n = escapeRe(name);
  // `const [values, setValues] = useState({...})` — also `(0, r.useState)(…)`.
  const state = new RegExp(`\\[\\s*${n}\\s*,\\s*[A-Za-z_$][\\w$]*\\s*\\]\\s*=\\s*[^;]{0,40}?useState\\s*\\)?\\s*\\(`, "g");
  let m = state.exec(src);
  while (m) {
    const args = inside(src, m.index + m[0].length - 1);
    const s = args != null ? shapeOf(splitTop(args)[0], inner, depth + 1) : null;
    if (s instanceof Map) return s;
    m = state.exec(src);
  }
  // `const payload = { ... }`
  const local = new RegExp(`(?:^|[^\\w$.])${n}\\s*=\\s*(?=[{(])`, "g");
  m = local.exec(src);
  while (m) {
    const at = m.index + m[0].length;
    if (src[at - 1] !== ">" && src[at] === "{") {
      const body = inside(src, at);
      const s = body != null ? objectShape(body, inner, depth + 1) : null;
      if (s instanceof Map && s.size) return s;
    }
    m = local.exec(src);
  }
  return null;
}

/** `a.b` for every leaf, a select's value before its label. */
function flatten(shape, prefix, out, depth) {
  shape.forEach((sub, key) => {
    if (!prefix && NOT_DATA.has(key)) return;
    const path = prefix ? `${prefix}.${key}` : key;
    if (sub instanceof Map && sub.size && depth < 3) {
      const isSelect = sub.has("value") && sub.has("label");
      const keys = [...sub.keys()].sort((a, b) => (b === "value") - (a === "value"));
      keys.forEach((k) => {
        const s = sub.get(k);
        if (s instanceof Map && s.size) flatten(new Map([[k, s]]), path, out, depth + 1);
        else out.push({ path: `${path}.${k}`, root: prefix ? prefix.split(".")[0] : key, select: isSelect });
      });
    } else {
      out.push({ path, root: prefix ? prefix.split(".")[0] : key, select: false });
    }
  });
  return out;
}

const fieldCache = new WeakMap();

/**
 * The fields a component reports through setModalData, as template paths:
 * `[{ path: "title.value", root: "title", select: true }, { path: "name", … }]`.
 * An empty list means it does not call setModalData, or it could not be read.
 */
export function modalFieldsOf(comp) {
  const fn = renderFunction(comp);
  if (!fn) return [];
  if (fieldCache.has(fn)) return fieldCache.get(fn);
  let list = [];
  try {
    const src = Function.prototype.toString.call(fn);
    // What setModalData is called inside: itself, a renamed destructure
    // (`setModalData: t` once minified), or a member of props.
    const names = new Set(["setModalData"]);
    const alias = /setModalData\s*:\s*([A-Za-z_$][\w$]*)/g;
    let a = alias.exec(src);
    while (a) {
      names.add(a[1]);
      a = alias.exec(src);
    }
    const call = new RegExp(
      `(^|[^\\w$])(?:(?:${[...names].map(escapeRe).join("|")})|[\\w$]+\\??\\.setModalData)\\s*(?:\\?\\.)?\\s*\\(`,
      "g",
    );
    const shape = new Map();
    let calls = 0;
    const ctx = shapeCtx(src);
    let m = call.exec(src);
    while (m) {
      const open = m.index + m[0].length - 1;
      // A bare name that is really `.setModalData(` of something else, or the
      // parameter list of a function called setModalData, is not a report.
      const before = src.slice(Math.max(0, m.index - 12), m.index + m[1].length);
      if (!/function\s*$/.test(before)) {
        const args = inside(src, open);
        if (args != null && args.trim()) {
          calls += 1;
          const s = shapeOf(splitTop(args)[0], ctx);
          if (s instanceof Map) mergeShape(shape, s);
        }
      }
      m = call.exec(src);
    }
    // It reports something we could not follow (`setModalData(data)` of a
    // prop): the inputs it draws are the best guess at what.
    if (calls && !shape.size) mergeShape(shape, ctx.drawn());
    list = flatten(shape, "", [], 0);
  } catch (e) {
    list = [];
  }
  fieldCache.set(fn, list);
  return list;
}

/* ------------------------------------------------------- payload matching -- */

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const stripTail = (s) => s.replace(/(?:name|id|no|code|value|text)$/, "") || s;
// Different words for one thing, as payloads and forms spell it.
const SYNONYMS = [
  ["mobile", "mobileno", "mobilenumber", "phone", "phoneno", "phonenumber", "contact", "contactno", "contactnumber", "cell", "cellno"],
  ["address", "addr", "address1", "fulladdress"],
  ["email", "emailid", "emailaddress", "mail"],
  ["remark", "remarks", "comment", "comments", "note", "notes", "narration"],
  ["dob", "dateofbirth", "birthdate"],
  ["gender", "sex"],
];
const sameWord = (a, b) => SYNONYMS.some((g) => g.includes(a) && g.includes(b));

/**
 * The dialog field a payload key most likely means — `title` for Title,
 * `proName.value` for ProID, `contactNo` for Mobile, `name` for DoctorName —
 * or "" when nothing is close. A select gives its value unless the key asks
 * for the text (`TitleName` against a `title` select).
 */
export function matchModalField(param, fields) {
  const p = norm(param);
  if (!p || !fields?.length) return "";
  // One entry per thing the dialog holds: a select's value and label are one.
  const things = [];
  fields.forEach((f) => {
    const base = f.select ? f.path.replace(/\.(?:value|label)$/, "") : f.path;
    if (!things.some((t) => t.base === base)) things.push({ base, select: f.select, name: norm(base.split(".").pop()) });
  });
  let best = null;
  things.forEach((t) => {
    const k = t.name;
    let score = 0;
    let part = "value";
    if (p === k) score = 100;
    else if (t.select && (p === `${k}name` || p === `${k}text` || p === `${k}label`)) {
      score = 95;
      part = "label";
    } else if (p.endsWith("id") && stripTail(p.slice(0, -2)) === stripTail(k)) score = 90;
    else if (sameWord(p, k) || sameWord(stripTail(p), stripTail(k))) score = 85;
    else if ((k.length >= 4 && p.endsWith(k)) || (p.length >= 4 && k.endsWith(p))) score = 70;
    if (score && (!best || score > best.score)) best = { score, t, part };
  });
  if (!best) return "";
  return best.t.select ? `${best.t.base}.${best.part}` : best.t.base;
}

/**
 * Point every payload key the dialog has a field for at that field, as
 * `{{modal.<path>}}`. A key already reading a template is the designer's
 * decision and is left alone. Returns the new params and how many changed.
 */
export function fillFromModal(params, fields) {
  let filled = 0;
  const next = (params || []).map((p) => {
    if (!p || String(p.value ?? "").includes("{{") || (p.valueRules && p.valueRules.length)) return p;
    const path = matchModalField(p.name, fields);
    if (!path) return p;
    filled += 1;
    return { ...p, value: `{{modal.${path}}}` };
  });
  return { params: next, filled };
}

/* ------------------------------------------------------------ stand-ins -- */

// Anything that shows or hides the dialog it is in. `setModalData` is data,
// not visibility, and is ruled out before this is asked.
const CLOSES = /^(?:setVisible|setIsVisible|setIsOpen|setOpen|setShow|setShowModal|setModalOpen|setIsModalOpen|setOpenModal|onClose|onHide|onCancel|handleClose|handleCancel|handleCloseModal|closeModal|onCloseModal|toggle|toggleModal|setClose)$|^set(?:Show|Is|Open)?[A-Za-z]*(?:Modal|Popup|Dialog|Visible|Visibility)$/;
// Callbacks the component will CALL. Those that fetch or save are async in the
// app, and callers chain `.then` on them — so their stand-in is a promise.
const ASYNC_CALLBACK = /^(?:fetch|get|refresh|reload|load|bind|call|save|submit|update|search)[A-Z_$]/;
const CALLBACK = /^(?:set|on|handle|toggle|close|open|reset|clear|cancel|hide|show|select|change|send|add|remove|delete|edit)[A-Z_$]/;
// Booleans read as flags must stay undefined (falsy), whatever they end with.
const FLAG = /^(?:is|has|show|can|should|disable|enable|hide|allow)[A-Z_$]/;
const LIST = /(?:List|Options|Items|Rows|Array|Arr)$/;
const RECORD = /(?:Data|Detail|Details|State|Obj|Object|Info|Record|Values|Payload)$/;

const noop = () => undefined;
const asyncNoop = () => Promise.resolve(undefined);

/**
 * Stand-ins for the props `names` lists that `given` does not supply.
 *
 * @param handlers  { close, collect } — what a close-type callback and a
 *                  `setModalData` should really do in this host.
 */
export function standInProps(names, given = {}, handlers = {}) {
  const out = {};
  (names || []).forEach((name) => {
    if (given[name] !== undefined) return;
    if (name === "setModalData" && handlers.collect) out[name] = handlers.collect;
    else if (CLOSES.test(name) && handlers.close) out[name] = handlers.close;
    else if (ASYNC_CALLBACK.test(name)) out[name] = asyncNoop;
    else if (CALLBACK.test(name)) out[name] = noop;
    else if (FLAG.test(name)) return;
    else if (LIST.test(name)) out[name] = [];
    else if (RECORD.test(name)) out[name] = {};
  });
  return out;
}
