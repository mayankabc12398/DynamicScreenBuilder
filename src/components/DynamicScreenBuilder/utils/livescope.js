/**
 * What the screen holds right now, reachable from the builder's panels.
 *
 * The Inspector is a SIBLING of the canvas, not a child of it, so it cannot
 * read the runtime through context — and it needs to. "What does
 * `{{item.code}}` actually hold?" cannot be answered from the JSON alone: the
 * answer is in the values the screen is carrying, and without it a payload key
 * is written blind and debugged in the network tab.
 *
 * So a provider publishes its `buildScope` here and the panels read it back.
 * Nothing is copied: the function is the live one, so every peek is answered
 * against the screen as it stands at that moment.
 *
 * A stack rather than one slot — a screen opened in a modal mounts a second
 * provider, and the innermost one is the screen being looked at.
 */
import { getPath, interpolate, isJsValue, jsCodeOf, runJsValue } from "./expressions";
import { isHiddenLocalKey, localEntries } from "./localStore";

const providers = [];

/** Called by RuntimeProvider. Returns the undo, for the effect's cleanup. */
export function publishScope(fn) {
  if (typeof fn !== "function") return () => {};
  providers.push(fn);
  return () => {
    const i = providers.lastIndexOf(fn);
    if (i >= 0) providers.splice(i, 1);
  };
}

/**
 * A stand-in for {{row}} while the builder edits a component's events.
 *
 * An event's record (the option an Auto Complete picked, the row an icon sat
 * on) exists only while its chain runs, so in the inspector {{row}} held
 * nothing and none of its fields could be picked. The Inspector sets the
 * selected component's first sample record here — the last Sync, or its typed
 * rows / options — and the scope answers {{row.*}} from it until a real row is
 * in scope. Cleared when nothing with records is selected.
 */
let eventSample = null;
export function setEventSample(rec) {
  eventSample = rec && typeof rec === "object" && !Array.isArray(rec) ? rec : null;
}

/**
 * The last record a control's event really handed over, by node id.
 *
 * An Auto Complete over a search endpoint often has no Sync behind it — the
 * endpoint returns nothing until something is typed — so its sample fell back
 * to the placeholder options and {{row}} offered only value and label. One
 * pick in Preview parks the whole record here, and the Inspector's {{row}}
 * then lists every key it has.
 */
const pickedRecords = new Map();
const pickedListeners = new Set();
export function rememberEventRecord(nodeId, rec) {
  if (!nodeId || !rec || typeof rec !== "object" || Array.isArray(rec)) return;
  pickedRecords.set(nodeId, rec);
  pickedListeners.forEach((fn) => fn(nodeId));
}
export function eventRecordOf(nodeId) {
  return (nodeId && pickedRecords.get(nodeId)) || null;
}
export function onEventRecord(fn) {
  pickedListeners.add(fn);
  return () => pickedListeners.delete(fn);
}

/** The live scope, or null when no screen is mounted. */
export function liveScope(extra) {
  const fn = providers[providers.length - 1];
  if (!fn) return null;
  try {
    const scope = fn(extra || {});
    if (scope && eventSample && (scope.row === undefined || scope.row === null)) return { ...scope, row: eventSample };
    return scope;
  } catch {
    return null;
  }
}

export function hasLiveScope() {
  return providers.length > 0;
}

/** A browser File / Blob — what a File Upload set to "The files themselves" holds. */
export const isRawFile = (v) =>
  (typeof File !== "undefined" && v instanceof File) || (typeof Blob !== "undefined" && v instanceof Blob);

const sizeText = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * What a File is, in words. Its fields are not enumerable, so JSON prints a
 * picked file as `{}` — which reads as "nothing was picked" when it was.
 */
const fileSummary = (f) => ({ file: f.name || "(blob)", size: sizeText(f.size || 0), type: f.type || "unknown" });

/**
 * JSON for reading, not for sending: a File says what it is, and a base64
 * body — megabytes of one line — is cut down to its start and its length.
 */
function readable(key, value) {
  if (isRawFile(value)) return fileSummary(value);
  if (key === "base64" && typeof value === "string" && value.length > 80) {
    return `${value.slice(0, 48)}… (${value.length.toLocaleString()} characters)`;
  }
  return value;
}

/**
 * How a value reads in the peek box: a short type, and the text to show.
 *
 * Lists and records go in as JSON so what is shown is what will be posted —
 * `[object Object]` would hide exactly the mistake this exists to catch.
 */
export function describeValue(v) {
  if (v === undefined) return { type: "nothing", text: "nothing — this key is left out of the request" };
  if (v === null) return { type: "null", text: "null" };
  if (isRawFile(v)) return { type: "file", text: JSON.stringify(fileSummary(v), null, 2) };
  if (Array.isArray(v)) return { type: `array · ${v.length} item${v.length === 1 ? "" : "s"}`, text: JSON.stringify(v, readable, 2) };
  if (typeof v === "object") return { type: "object", text: JSON.stringify(v, readable, 2) };
  if (typeof v === "string") return v === "" ? { type: "text · empty", text: "" } : { type: "text", text: v };
  return { type: typeof v, text: String(v) };
}

/** A one-line preview: the value, short enough to sit in a list. */
function shortText(v) {
  const { type, text } = describeValue(v);
  const flat = String(text).replace(/\s+/g, " ").trim();
  return { type, short: flat.length > 90 ? `${flat.slice(0, 90)}…` : flat };
}

/**
 * Everything the mounted screen is holding, as tokens with what is in them.
 *
 * A payload key is filled by naming a token, and the names are invented by the
 * screen: `paymentDetail`, `DoctorID`, `n_grid`. Map… lists the ones the JSON
 * can work out, which is not the same set — a field written by an action, a
 * grid's ticked rows, a variable set on load are all there at runtime and in
 * no list. This walks what is actually in scope, so "what can I send?" is
 * read rather than remembered.
 *
 * `nameOf(kind, id)` puts a readable name beside an id the screen invented:
 * `ds_v8m91757p` and `node:n_gy16fa4o` say nothing about which list they hold,
 * and a token nobody can identify is a token nobody will use. The builder
 * knows those names, the runtime does not, so it is passed in.
 *
 * Returns [] when no screen is mounted.
 */
export function scopeEntries(scope, nameOf) {
  const named = typeof nameOf === "function" ? nameOf : () => "";
  if (!scope) return [];
  const out = [];
  const add = (expr, group, value, note) => {
    const { type, short } = shortText(value);
    out.push({ expr, group, type, value, short, note });
  };
  const keysOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v) : []);
  const columnsOfRec = (rec) => {
    const first = Array.isArray(rec) ? rec[0] : rec;
    return first && typeof first === "object" ? Object.keys(first).filter((k) => !String(k).startsWith("__")) : [];
  };

  // What an event hands its actions. These exist only while a chain runs, so
  // the screen never holds them and they were in no list — {{row}} had to be
  // known to be typed. Offered here so an onSelect or a row icon can pick them.
  const EVENT = "In this event";
  const WHEN_RUN = "(filled when the action runs)";
  const rowNow = scope.row && typeof scope.row === "object" ? scope.row : null;
  add("{{row}}", EVENT, rowNow || WHEN_RUN, rowNow
    ? "the picked option / clicked row — shown here with the first sample record"
    : "the picked option (Auto Complete / dropdown onSelect) or the clicked row, whole");
  columnsOfRec(rowNow).forEach((k) => add(`{{row.${k}}}`, EVENT, rowNow[k], `${k} of the picked option / clicked row`));
  add("{{value}}", EVENT, WHEN_RUN, "the picked value");
  add("{{label}}", EVENT, WHEN_RUN, "the picked option's text");
  add("{{response}}", EVENT, WHEN_RUN, "what an earlier Call API in this chain returned");
  add("{{addedRow}}", EVENT, WHEN_RUN, "the row an earlier Add row in this chain added");

  Object.keys(scope.values || {}).forEach((k) => add(`{{values.${k}}}`, "Form fields", scope.values[k]));
  Object.keys(scope.labels || {}).forEach((k) => add(`{{labels.${k}}}`, "Dropdown text", scope.labels[k]));

  Object.keys(scope.selected || {}).forEach((k) => {
    const rec = scope.selected[k];
    const many = Array.isArray(rec);
    add(`{{selected.${k}}}`, "Picked rows", rec, many ? "every chosen row, whole" : "the picked row, whole");
    columnsOfRec(rec).forEach((col) => {
      const expr = many ? `{{selected.${k}.*.${col}}}` : `{{selected.${k}.${col}}}`;
      add(expr, "Picked rows", getPath(scope, expr.slice(2, -2)));
    });
  });

  Object.keys(scope.vars || {}).forEach((k) => add(`{{vars.${k}}}`, "Screen variables", scope.vars[k]));

  Object.keys(scope.grid || {}).forEach((id) => {
    const g = scope.grid[id] || {};
    const group = `Grid — ${named("node", id) || id}`;
    const WHAT = {
      rows: "every row, as edited",
      checked: "the ticked rows",
      selected: "the rows selected in the strip",
      edited: "only the rows that changed",
      pageRows: "the page on screen",
    };
    ["rows", "checked", "selected", "edited", "pageRows"].forEach((k) => {
      if (g[k] !== undefined) add(`{{grid.${id}.${k}}}`, group, g[k], WHAT[k]);
    });
    keysOf(g.checkedBy).forEach((col) => add(`{{grid.${id}.checkedBy.${col}}}`, group, g.checkedBy[col], `ticked in ${col}`));
  });

  Object.keys(scope.rows || {}).forEach((id) => {
    const node = String(id).startsWith("node:") ? String(id).slice(5) : "";
    const name = named(node ? "node" : "source", node || id);
    add(`{{rows.${id}}}`, "Data sources", scope.rows[id], name ? (node ? `${name} — its own endpoint` : name) : undefined);
  });

  keysOf(scope.user).forEach((k) => add(`{{user.${k}}}`, "Signed-in user", scope.user[k]));

  // Saved on this device. Listed from localStorage rather than from the scope
  // object, because the scope's keys are getters and reading every one of them
  // to build a list nobody opened is work for nothing.
  if (scope.local) {
    localEntries().forEach((e) => add(`{{${e.path}}}`, "Saved on this device", e.value));
  }
  keysOf(scope.globals)
    .slice(0, 40)
    .forEach((k) => add(`{{globals.${k}}}`, "Site settings", scope.globals[k]));

  // today / now / thisMonthStart …: the date tokens the runtime puts in scope.
  Object.keys(scope)
    .filter((k) => typeof scope[k] === "string" || typeof scope[k] === "number")
    .forEach((k) => add(`{{${k}}}`, "Dates", scope[k]));

  return out;
}

/**
 * Resolve one expression against the live screen.
 *
 * @param expr      what is typed in a value box — `{{item.code}}`, `{{values.x}}`,
 *                  or anything with templates in it.
 * @param mapScope  optional: given the live scope, return the scope to answer
 *                  against. A repeated payload key uses it to answer inside
 *                  ONE item, which is the only place `{{item}}` exists.
 *
 * `json: true` matches how a list or record parameter is built, so a value
 * assembled out of several tokens previews as the JSON it will send.
 */
const LONE_TOKEN = /^\{\{\s*([^}]+?)\s*\}\}$/;

const columnsOf = (rec) => {
  const rows = Array.isArray(rec) ? rec.slice(0, 3) : rec ? [rec] : [];
  const keys = new Set();
  rows.forEach((r) => {
    if (r && typeof r === "object") Object.keys(r).forEach((k) => !String(k).startsWith("__") && keys.add(k));
  });
  return [...keys];
};

/**
 * Where the rest of the answer is.
 *
 * A dropdown stores an id — one, or a list of them for a multi select — and
 * that is all `{{values.DoctorID}}` will ever show. The record the endpoint
 * sent is kept beside it under `selected`, and nothing in the box says so: a
 * designer looking at `[6, 18]` and wanting `{ DoctorID, DoctorName }` has no
 * reason to guess that a different token holds it.
 *
 * So the peek box says it, for exactly the two cases where the answer on
 * screen is ids and something richer exists.
 */
function hintsFor(expr, scope, value) {
  const lone = LONE_TOKEN.exec(String(expr).trim());
  const path = lone ? lone[1].trim() : "";
  const selected = scope?.selected || {};
  const richer = (field) => {
    const cols = columnsOf(selected[field]);
    if (cols.length < 2) return null;
    const many = Array.isArray(selected[field]);
    return {
      expr: `{{selected.${field}}}`,
      label: `${field} — ${many ? "every chosen row" : "the picked row"}, all keys: ${cols.slice(0, 5).join(", ")}${cols.length > 5 ? "…" : ""}`,
    };
  };

  // {{values.DoctorID}} -> the rows behind those ids.
  const field = /^values\.([A-Za-z0-9_$]+)$/.exec(path)?.[1];
  if (field) return [richer(field)].filter(Boolean);

  // {{values}} -> every dropdown on the screen that has rows behind it.
  if (path === "values" || path === "") {
    return Object.keys(selected).map(richer).filter(Boolean).slice(0, 4);
  }

  // Inside one item: {{item}} is the id, {{row}} is the record behind it.
  if ((path === "item" || path === "label") && scope?.row && typeof scope.row === "object") {
    const cols = columnsOf(scope.row);
    if (cols.length >= 2) {
      return [{ expr: "{{row}}", label: `this item's row, all keys: ${cols.slice(0, 5).join(", ")}${cols.length > 5 ? "…" : ""}` }];
    }
  }

  // A list of bare ids that is not a field of its own — nothing to point at.
  return value === undefined ? [] : [];
}

export function peekValue(expr, mapScope) {
  if (typeof expr !== "string" || !expr.trim()) return { state: "blank" };
  const base = liveScope();
  if (!base) return { state: "noscreen" };
  let scope = base;
  if (typeof mapScope === "function") {
    let mapped;
    try {
      mapped = mapScope(base);
    } catch (e) {
      return { state: "error", message: e?.message || String(e) };
    }
    // The mapper answered "there is nothing to stand in", e.g. the list a
    // repeated key walks is empty, so there is no item to read.
    if (!mapped) return { state: "noitem" };
    scope = mapped;
  }
  // A JS value is run so that its mistake is shown here, not swallowed into
  // an empty result the way a running screen swallows it.
  if (isJsValue(expr)) {
    try {
      const value = runJsValue(jsCodeOf(expr), scope, { throws: true });
      return { state: "ok", value, ...describeValue(value), hints: [] };
    } catch (e) {
      return { state: "error", message: `JS error: ${e?.message || String(e)}` };
    }
  }
  try {
    const value = interpolate(expr, scope, { json: true });
    // A lone token that resolves to nothing comes back as empty text — that is
    // what the request would carry, and it is also what a misspelt path looks
    // like. "empty" alone would send someone looking at the data; saying the
    // path is not there at all sends them to the expression, which is where
    // `{{item.code}}` on a list of ids goes wrong.
    const lone = LONE_TOKEN.exec(expr.trim());
    // `{{= …}}` is an expression, not a path: splitting it on "|" to look one
    // up says "there is no = row.Nickname here" about a line that is working
    // perfectly well.
    if (lone && !lone[1].trim().startsWith("=") && (value === "" || value === undefined)) {
      const path = lone[1].split("|")[0].trim();
      if (getPath(scope, path) === undefined) {
        return {
          state: "ok",
          value: undefined,
          type: "nothing",
          text: `There is no ${path} here, so this key goes out as empty text.`,
          hints: hintsFor(expr, scope, undefined),
        };
      }
    }
    return { state: "ok", value, ...describeValue(value), hints: hintsFor(expr, scope, value) };
  } catch (e) {
    return { state: "error", message: e?.message || String(e) };
  }
}

/* ------------------------------------------------------ typing a token ---- */

/**
 * Which group a bare path belongs to, for the list's headings.
 *
 * The same words the browser uses, so "Form fields" means one thing whether it
 * is read off the rail or off the box being typed in.
 */
const ROOT_GROUP = {
  values: "Form fields",
  labels: "Dropdown text",
  selected: "Picked rows",
  vars: "Screen variables",
  grid: "Grids",
  rows: "Data sources",
  user: "Signed-in user",
  globals: "Site settings",
  item: "This item",
  row: "This row",
  local: "Saved on this device",
  index: "This item",
};

/** The path fragment being typed, at the end of an expression. */
const PATH_TAIL = /[A-Za-z0-9_$.*]*$/;

const suggestKeysOf = (v) => {
  const first = Array.isArray(v) ? v[0] : v;
  if (!first || typeof first !== "object") return [];
  return Object.keys(first).filter((k) => !String(k).startsWith("__"));
};

/**
 * What could come next, for a token half typed.
 *
 * `{{values.}}` is the moment the question is asked — the designer knows the
 * shape but not the name the screen invented, and the rail is a panel away
 * (and, in the narrow strip, shut). So the names come to the caret instead.
 *
 * Two sources, and both are needed. {@link scopeEntries} describes what it
 * lists ("the ticked rows", "IPDCaseTypeID — 4") but only enumerates the paths
 * worth a heading; walking the scope itself covers everything else — a column
 * of a column, `{{item.…}}` inside a repeated key, an endpoint's row shape
 * nobody wrote down. Described first, so the good names keep their words.
 *
 * @param head    what sits between `{{` and the caret: "values.pan", "",
 *                "= values.a + row.". An expression suggests against its
 *                trailing path only.
 * @param scope   the scope the box is answered against — already mapped to one
 *                item where the box lives inside a repeat.
 * @returns rows of `{path, expr, group, type, short, note, replace}`, where
 *          `replace` is how many characters before the caret the path stands
 *          in for.
 */
export function suggestTokens(head, scope, nameOf, limit = 40) {
  if (!scope) return [];
  const raw = String(head ?? "");
  const isExpr = raw.trimStart().startsWith("=");
  // `{{values.x | date:...}}` — past the pipe it is a filter being typed, and
  // a list of value names there would be wrong rather than merely unhelpful.
  if (!isExpr && raw.includes("|")) return [];
  const typed = isExpr ? (PATH_TAIL.exec(raw) || [""])[0] : raw.trim();
  const dot = typed.lastIndexOf(".");
  const base = dot >= 0 ? typed.slice(0, dot) : "";
  const frag = (dot >= 0 ? typed.slice(dot + 1) : typed).toLowerCase();
  const full = typed.toLowerCase();

  const seen = new Set();
  const out = [];
  const push = (path, group, value, note) => {
    if (!path || seen.has(path)) return;
    // A saved credential still RESOLVES when it is typed on purpose; it is not
    // offered in a list, where it would end up in a payload by accident. The
    // builder's own saved screens are left out for a duller reason: thirty
    // rows of them buried the handful of keys anyone came for.
    if (String(path).startsWith("local.") && isHiddenLocalKey(String(path).slice(6))) return;
    seen.add(path);
    const { type, short } = shortText(value);
    out.push({ path, expr: `{{${path}}}`, group, type, short, note, replace: typed.length });
  };

  // 1. the described paths, as the rail lists them
  scopeEntries(scope, nameOf).forEach((e) => {
    const path = e.expr.slice(2, -2).trim();
    push(path, e.group, e.value, e.note);
  });

  // 2. whatever the scope actually holds under what has been typed so far —
  //    `{{item.`, a column of a picked row, a key three levels down.
  const groupFor = (path) => ROOT_GROUP[String(path).split(".")[0]] || "In scope";
  if (base) {
    const held = getPath(scope, base);
    const list = Array.isArray(held);
    suggestKeysOf(held).forEach((k) => {
      const first = list ? held[0] : held;
      if (list) push(`${base}.*.${k}`, groupFor(base), getPath(scope, `${base}.*.${k}`), `${k} of every row`);
      push(`${base}.${k}`, groupFor(base), first?.[k]);
    });
  } else {
    Object.keys(scope).forEach((k) => {
      if (String(k).startsWith("__")) return;
      const v = scope[k];
      if (v && typeof v === "object" && !Array.isArray(v) && ROOT_GROUP[k]) {
        // A container — its own name is not a value, its keys are.
        suggestKeysOf(v).forEach((c) => push(`${k}.${c}`, ROOT_GROUP[k], v[c]));
        return;
      }
      push(k, ROOT_GROUP[k] || "In scope", v);
    });
  }

  // 3. rank.
  //
  //    What is typed is matched ANYWHERE in the name, not only at its start.
  //    Nobody types a key from its first letter: `IsCash`, `PanelGroup` and
  //    `NetAmount` are found by "cash", "group" and "amount", which is the
  //    half of the name a person actually remembers. Prefixes still win, so
  //    typing the start of a name still puts it first — the loose matches
  //    just stop being thrown away.
  //
  //    Under a base (`selected.panelID.`) the search stays inside that object,
  //    or half a screen of unrelated keys would arrive with it.
  //
  //    What each name HOLDS is searched too: finding the field by "3263" or by
  //    "Pradhan Mantri" is the same question asked from the other end, and it
  //    is often the only end a designer has.
  const scored = [];
  const hitIn = (hay, needle, where) => {
    const at = needle ? hay.indexOf(needle) : -1;
    return at < 0 ? null : { in: where, at, len: needle.length };
  };
  out.forEach((row) => {
    const path = row.path.toLowerCase();
    const cut = path.lastIndexOf(".") + 1;
    const tail = path.slice(cut);
    const val = String(row.short || "").toLowerCase();
    const inBase = !base || path.startsWith(`${base.toLowerCase()}.`);
    let score = -1;
    let hit = null;
    if (!typed) score = 0;
    else if (path.startsWith(full)) {
      score = 0;
      hit = { in: "path", at: 0, len: full.length };
    } else if (!inBase) score = -1;
    else if (!frag) score = 1;
    else if (tail.startsWith(frag)) {
      score = 1;
      hit = { in: "path", at: cut, len: frag.length };
    } else if (tail.includes(frag)) {
      score = 2;
      hit = { in: "path", at: cut + tail.indexOf(frag), len: frag.length };
    } else if (path.includes(frag)) {
      score = 3;
      hit = hitIn(path, frag, "path");
    } else if (val.includes(frag)) {
      score = 4;
      hit = hitIn(val, frag, "value");
    }
    if (score < 0) return;
    scored.push({ row: hit ? { ...row, hit } : row, score });
  });
  scored.sort((a, b) => a.score - b.score || a.row.path.length - b.row.path.length || a.row.path.localeCompare(b.row.path));
  return scored.slice(0, limit).map((s) => s.row);
}
