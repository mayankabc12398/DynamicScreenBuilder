/**
 * A component's own API call, picked from the server's endpoint catalog.
 *
 * A screen can feed a grid two ways. The screen-level **data source** (Data tab)
 * is the older one and still the right choice when several components share one
 * response. This is the other: the endpoint is chosen on the component itself,
 * from real controller/action dropdowns, so a table is wired up without anyone
 * typing a URL or knowing a source id exists.
 *
 * Both end up in the same place at runtime — rows in `rt.data[<id>]` — which is
 * why nothing downstream (columns, sorting, colour rules, card view) has to
 * know which one a table used.
 *
 * The catalog that fills the dropdowns is HospediaAPI/ScreenBuilder, read
 * through networkServices/screenBuilderApi.js.
 */
import { evalCondition, getPath, interpolate, interpolateDeep, isJsValue, whenPasses } from "./expressions";

/** Where a parameter is sent. Mirrors the server's ApiParameterInfo.Source. */
export const PARAM_SOURCES = ["Query", "Path", "Body", "Header", "Form"];

/**
 * Parameters the app fills in for itself.
 *
 * Nearly every controller takes `UserValidateID`, and networkServices/
 * axiosInstance.js already appends it to every URL from the signed-in user's
 * localStorage record. Showing it in the picker would invite someone to paste
 * one user's token into a screen everybody opens, and sending it from here
 * would put the value on the query string twice. So it is dropped when an
 * endpoint is picked and skipped again when the request is built, in case an
 * older screen still has one stored.
 */
const AUTO_PARAMS = new Set(["uservalidateid"]);

/** True when the app supplies this parameter itself. */
export const isAutoParam = (name) => AUTO_PARAMS.has(String(name || "").toLowerCase());

/** A blank config — what a component starts with before an endpoint is picked. */
export function createApiConfig() {
  return {
    controller: "",
    endpoint: "", // route relative to the axios baseURL, e.g. "DoctorShift/GetShifts"
    method: "GET",
    /** [{ name, source, type, required, value }] — `value` is what gets sent. */
    params: [],
    /** Raw JSON body, used when the endpoint takes a DTO rather than named fields. */
    bodyJson: "",
    /**
     * A payload used ONLY by Test call, never by the rendered screen.
     *
     * At design time the form is empty, so every {{values.x}} in the real
     * payload resolves to "" and the endpoint answers "No records found" —
     * which is no help at all when the whole point of testing is to see the
     * shape of the data and bind the columns to it. Filling this in with real
     * ids gets rows back without touching what the button will actually send.
     */
    testBodyJson: "",
    /** Where the rows sit inside the response, e.g. "data" or "data.items". */
    responsePath: "data",
    /** Call it as soon as the rendered screen loads. */
    autoLoad: true,
  };
}

/** Tolerates a half-written config from an older screen without throwing. */
export function normalizeApiConfig(cfg) {
  const base = createApiConfig();
  if (!cfg || typeof cfg !== "object") return base;
  return {
    ...base,
    ...cfg,
    method: String(cfg.method || "GET").toUpperCase(),
    params: Array.isArray(cfg.params) ? cfg.params : [],
  };
}

/** True once there is enough here to make a request. */
export function isApiConfigReady(cfg) {
  return !!(cfg && cfg.endpoint);
}

/**
 * Turn one catalog endpoint into a config, seeding every parameter with the
 * sample value the server suggested. That is what makes "pick an endpoint,
 * press Sync" return real rows instead of a validation error.
 */
export function configFromEndpoint(endpoint, previous) {
  const prev = normalizeApiConfig(previous);
  const byName = new Map(prev.params.map((p) => [p.name, p]));

  return {
    ...prev,
    controller: endpoint.controller || prev.controller,
    endpoint: endpoint.relativePath || endpoint.path || "",
    method: String(endpoint.method || "GET").toUpperCase(),
    params: (endpoint.parameters || [])
      .filter((p) => !isAutoParam(p.name))
      .map((p) => ({
        name: p.name,
        source: p.source || "Query",
        type: p.type || "string",
        required: !!p.required,
        // Keep whatever was already typed for a parameter of the same name —
        // the usual reason to re-pick an endpoint is a typo in the action, not
        // in the values.
        value: byName.has(p.name) ? byName.get(p.name).value : sampleToValue(p.sample),
        fields: p.fields || undefined,
        // "Send without the key" belongs to the mapping, not the endpoint.
        unwrap: byName.get(p.name)?.unwrap || undefined,
      })),
  };
}

/** The server sends real JSON types; the editors are text boxes. */
export function sampleToValue(sample) {
  if (sample === null || sample === undefined) return "";
  if (typeof sample === "object") return JSON.stringify(sample);
  return String(sample);
}

/** A list of plain values — what a multi select holds — rather than of records. */
const isValueList = (v) => Array.isArray(v) && v.every((x) => x === null || x === undefined || typeof x !== "object");

/**
 * A list for a parameter of one type.
 *
 * A multi select hands over ["1", "3"]. Taken as one value it went wrong for
 * every type but an untyped one: a text parameter sent the array, a number
 * kept the first id and dropped the rest, and a list parameter was dropped
 * outright (JSON.parse of an array throws). The hospital endpoints take
 * several ids the way their own pages send them — "1,3" — so text gets the
 * list joined; a number converts every entry; a list is already a list.
 */
function coerceList(list, type) {
  if (type === "array" || type === "object") return list;
  if (type === "string") return list.map((x) => (x === null || x === undefined ? "" : String(x))).join(",");
  if (type === "int" || type === "decimal") {
    const nums = list.map((x) => coerceParam(x, type)).filter((n) => n !== undefined);
    if (!nums.length) return undefined;
    return nums.length === 1 ? nums[0] : nums;
  }
  return list;
}

/**
 * The send-as a key gets from its DTO when the designer picked none — the
 * catalog's type tokens (ApiCatalogService.TypeNameOf). `date` is left out:
 * a date picker's value is already the text the API wants.
 */
export const SEND_AS_OF_TYPE = { string: "string", int: "number", decimal: "number", bool: "boolean" };

/** Nothing to send: no value, blank text, NaN or an empty list. 0 and false are values. */
const isBlank = (v) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "") ||
  (typeof v === "number" && Number.isNaN(v)) ||
  (Array.isArray(v) && v.length === 0);

const TYPE_DEFAULT = { string: "", number: 0, boolean: false };

/**
 * A payload key's "if empty" — what goes out when its value resolves to
 * nothing. The designer's own fallback wins (it may hold a template);
 * otherwise, when `typed`, the send-as type's zero value: "", 0 or false.
 */
export function fillBlank(value, fallback, as, scope, typed = true) {
  if (!isBlank(value)) return value;
  if (typeof fallback === "string" && fallback !== "") return interpolate(fallback, scope);
  return typed && as in TYPE_DEFAULT ? TYPE_DEFAULT[as] : value;
}

/* ------------------------------------------------------------- file bodies */

/** A browser File or Blob — what a File Upload hands over to be uploaded. */
export const isFileLike = (v) =>
  (typeof File !== "undefined" && v instanceof File) || (typeof Blob !== "undefined" && v instanceof Blob);

/** A File Upload's "Everything" record: { name, base64, rows, file }. */
const isUploadRecord = (v) => !!v && typeof v === "object" && !Array.isArray(v) && isFileLike(v.file);

/** Does a payload carry a file anywhere in it? */
export function hasFile(v, depth = 0) {
  if (isFileLike(v)) return true;
  if (!v || typeof v !== "object" || depth > 6) return false;
  if (typeof FormData !== "undefined" && v instanceof FormData) return true;
  return Object.values(v).some((x) => hasFile(x, depth + 1));
}

/**
 * A JSON-shaped body as multipart form data — how a file reaches an endpoint
 * that takes an IFormFile, the way the app's own photo and document uploads
 * send one (makeApiRequest with "multipart/form-data").
 *
 * Per key: a file goes in as the file; a File Upload's "Everything" record
 * sends the file it holds, so `Excel = {{values.Excel}}` uploads the sheet; a
 * list of files repeats the key once per file; any other list or record goes
 * in as JSON text; text and numbers as they are; empty values are left out.
 * A body that is not a record (a bare list) has no keys to send and is
 * returned unchanged.
 */
export function toFormData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  if (typeof FormData !== "undefined" && data instanceof FormData) return data;
  const fd = new FormData();
  const put = (key, v) => {
    if (v === undefined || v === null) return;
    if (isFileLike(v)) {
      fd.append(key, v, v.name || key);
      return;
    }
    if (isUploadRecord(v)) {
      fd.append(key, v.file, v.file.name || v.name || key);
      return;
    }
    if (Array.isArray(v) && v.length && v.every((x) => isFileLike(x) || isUploadRecord(x))) {
      v.forEach((x) => put(key, x));
      return;
    }
    if (v instanceof Boolean) fd.append(key, String(v.valueOf()));
    else if (v instanceof Date) fd.append(key, v.toISOString());
    else if (typeof v === "object") fd.append(key, JSON.stringify(v));
    else fd.append(key, String(v));
  };
  Object.entries(data).forEach(([k, v]) => put(k, v));
  return fd;
}

/**
 * Does this call go out as form data? "form" and "json" are the designer's
 * word; "auto" (and unset) is form data exactly when the body carries a file
 * or the catalog marked a parameter as a form field — JSON cannot carry
 * either, so nothing that worked as JSON before changes.
 */
export function sendsForm(bodyAs, cfg, data) {
  if (bodyAs === "form") return true;
  if (bodyAs === "json") return false;
  if ((cfg?.params || []).some((p) => p?.source === "Form")) return true;
  return hasFile(data);
}

/** The catalog field a payload key stands for, matched by name. */
export const knownField = (known, key) =>
  Array.isArray(known) && key
    ? known.find((k) => k?.name && String(k.name).toLowerCase() === String(key).toLowerCase())
    : undefined;

/**
 * A payload key's "send as" — applied after every other conversion.
 * "" / "raw" leave the value alone.
 *
 * Only a value that really converts is changed: an empty box, or text that is
 * no number, goes out as it was rather than vanishing — the same request the
 * key sent before it had a type, now that a DTO's type applies by default.
 *
 * A boolean goes out boxed: flagsToBits turns every primitive true/false in
 * the finished payload into 1/0, and passes a Boolean object through;
 * JSON.stringify writes it as a plain true/false.
 */
export function castAs(value, as) {
  if (!as || as === "raw" || value === undefined || value === null) return value;
  if (isFileLike(value)) return value;
  if (Array.isArray(value)) return value.map((v) => castAs(v, as));
  const v = value instanceof Boolean ? value.valueOf() : value;
  if (as === "string") {
    if (v instanceof Date) return v.toISOString();
    return typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  if (as === "number") {
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v !== "string" || v.trim() === "") return value;
    const n = Number(v);
    return Number.isNaN(n) ? value : n;
  }
  if (as === "boolean") {
    const t = String(v).trim().toLowerCase();
    // eslint-disable-next-line no-new-wrappers
    if (v === true || t === "true" || t === "1") return new Boolean(true);
    // eslint-disable-next-line no-new-wrappers
    if (v === false || t === "false" || t === "0") return new Boolean(false);
    return value;
  }
  return value;
}

/** "" stays "", "12" becomes 12, "true" becomes true — so the API gets its own types back. */
export function coerceParam(value, type) {
  if (value === "" || value === null || value === undefined) return type === "string" ? "" : undefined;
  // Whatever the catalog calls an IFormFile, a file is not text to coerce.
  if (isFileLike(value)) return value;
  // Records (a grid's ticked rows) are left as they are: joining them would
  // send "[object Object]", and every screen posting them already works.
  if (isValueList(value)) return coerceList(value, type);
  if (type === "int") {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  if (type === "decimal") {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  if (type === "bool") return value === true || value === "true" || value === "1";
  // Picking "text" is meant to force a string back out even when the value
  // resolved to something else — {{item.DoctorID}} off a numeric list column
  // is the common case: 16, not "16", until this runs.
  if (type === "string") return typeof value === "object" ? JSON.stringify(value) : String(value);
  if (type === "array" || type === "object") {
    /**
     * Already the shape the endpoint asked for.
     *
     * `JSON.parse` takes TEXT. Handed a list of records — the tenders a payment
     * panel published, the rows a grid ticked, a record stored in a variable —
     * it stringifies them first, reads "[object Object]" and throws, and the
     * parameter is then left out of the request altogether. A payload that
     * quietly loses its PaymentDetail is worse than one that fails.
     *
     * Only text is parsed, which is what a hand-typed `[{ "id": 1 }]` is.
     */
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return undefined;
    }
  }
  return value;
}

/**
 * A checkbox is `true` in the form and `1` on the wire.
 *
 * Every flag in this API is a SQL `bit`, and every hand-coded page already
 * converts: `setFieldValue("IsAdvance", checked ? 1 : 0)`, `IsAdvance:
 * values?.IsAdvance || 0`. A screen that posts `true` is asking a different
 * question than the page it replaces, and the endpoints answer it differently.
 *
 * So the conversion happens once, here, on the way out — the form keeps real
 * booleans, so visibility rules and the controls themselves stay simple.
 *
 * The exception is a parameter the catalog explicitly typed `bool`: ASP.NET's
 * own binder wants `true`/`false` there and rejects `1`, so those are left
 * alone. Everything untyped, string or numeric — which is what a bit column
 * comes back as — becomes 1/0.
 */
export function flagsToBits(value) {
  if (typeof value === "boolean") return value ? 1 : 0;
  // A picked file is sent as itself. Rebuilt key by key like a record, a File
  // has no own keys and came out as {} — the upload went up without the file.
  if (isFileLike(value)) return value;
  // A key the designer set to "send as boolean" (see castAs) — kept as true/false.
  if (value instanceof Boolean) return value;
  if (Array.isArray(value)) return value.map(flagsToBits);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = flagsToBits(v);
    return out;
  }
  return value;
}

/**
 * Append a query string to a route, keeping whatever is already on it.
 *
 * The app's shared `makeApiRequest` builds its own URL and passes only method,
 * data, meta and headers to axios — an axios `params` object never reaches the
 * wire. So the query string has to be part of the URL, not a config field.
 */
export function appendQuery(url, params) {
  const pairs = Object.entries(params || []).filter(([, v]) => v !== undefined && v !== null);
  if (!pairs.length) return url;
  // Several ids on a query string are "1,3", as the app's own pages send them;
  // a JSON array there is a string no endpoint parses.
  const text = (v) => (isValueList(v) ? v.join(",") : typeof v === "object" ? JSON.stringify(v) : v);
  const qs = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(text(v))}`).join("&");
  return `${url}${url.includes("?") ? "&" : "?"}${qs}`;
}

/**
 * Compose the axios call.
 *
 * Path parameters are substituted into the route, query parameters go on the
 * query string, and body/form parameters are merged into the payload. Every
 * value passes through the same `{{template}}` interpolation the rest of the
 * screen uses, so a parameter can read a filter field: `{{values.uhid}}`.
 *
 * `UserValidateID` is never sent from here — see AUTO_PARAMS.
 */
/**
 * What one parameter sends, which may depend on the record.
 *
 * `valueRules` is a list of `{ when, value }`; the first whose condition holds
 * wins, and an entry with no condition is the fallback. `undefined` means the
 * parameter is dropped from the request rather than sent empty.
 *
 * This is a key of its own rather than an array in `value` on purpose: a
 * parameter whose value IS an array is a real thing (a list of ids in a body),
 * and overloading the one field would have turned those into rule lists that
 * match nothing the first time a saved screen ran.
 */
function pickParamValue(p, scope) {
  const rules = p.valueRules;
  if (!Array.isArray(rules) || !rules.length) return p.value;
  const hit = rules.find((r) => r && (!r.when || !r.when.op || evalCondition(r.when, scope)));
  return hit ? hit.value : undefined;
}

/**
 * One object per item of a list — a parameter's `itemTemplate`.
 *
 * A multi select answers with a list of ids, and an endpoint almost never wants
 * that list: it wants a record per choice, under ITS OWN key names —
 * `[{ "doctorID": 16, "doctorName": "DR. ABHISHEK" }]`. Written by hand as
 * `[{"doctorID": {{values.DoctorID}}}]` that comes out as one object holding
 * the whole list, `[{ "doctorID": [16, 5] }]`, which is not the same shape and
 * never was going to be — a template substitutes, it does not repeat.
 *
 * So the repetition is configured rather than typed: a list, and the object to
 * build from each of its items. Inside one item the scope carries
 *
 *   {{item}}        the entry itself — the id, for a list of ids
 *   {{label}}       the text the control showed for it (`labels.<field>`)
 *   {{row.Column}}  any column of the record behind it (`selected.<field>`)
 *   {{index}}       its place, from 0, and {{number}} from 1
 *
 * `label` and `row` are found by reading the field name out of the list
 * expression, so they are there when the list is a control's own answer
 * (`{{values.DoctorID}}`) — which is the case this exists for. A list of
 * records (a grid's ticked rows) carries its own columns, so each entry IS the
 * record and `{{row.Column}}` reads it directly.
 *
 * Returns `undefined` when nothing is configured, so the caller falls back to
 * the parameter's single value.
 *
 * `itemScopes` is the first half on its own — the scope each item is answered
 * in. The Inspector's peek box uses it to show what `{{item}}` holds without
 * building the objects.
 */
const LIST_FIELD = /^\{\{\s*values\.([A-Za-z0-9_$]+)\s*\}\}$/;

export function itemScopes(tpl, scope = {}) {
  let resolved = typeof tpl?.list === "string" ? interpolate(tpl.list, scope) : tpl?.list;
  // A list typed out — `[1]`, `["CR","DR"]` — is a list, not one string.
  if (typeof resolved === "string" && /^\s*\[/.test(resolved)) {
    try {
      const parsed = JSON.parse(resolved);
      if (Array.isArray(parsed)) resolved = parsed;
    } catch (e) {
      /* not JSON after all: one entry, as before */
    }
  }
  // One answer is a list of one: a single select pointed at the same key sends
  // `[{…}]` rather than nothing, which is what the endpoint asked for.
  const list = Array.isArray(resolved)
    ? resolved
    : resolved === undefined || resolved === null || resolved === ""
      ? []
      : [resolved];
  if (!list.length) return [];

  const hit = LIST_FIELD.exec(String(tpl?.list || "").trim());
  const field = hit ? hit[1] : "";
  const labels = field ? scope?.labels?.[field] : undefined;
  const picked = field ? scope?.selected?.[field] : undefined;
  const at = (v, i) => (Array.isArray(v) ? v[i] : i === 0 ? v : undefined);

  return list.map((entry, index) => {
    const isRecord = !!entry && typeof entry === "object" && !Array.isArray(entry);
    const row = isRecord ? entry : at(picked, index);
    return {
      ...scope,
      item: entry,
      index,
      number: index + 1,
      count: list.length,
      // A plain list with no labels beside it still reads sensibly: the entry
      // is the only text there is.
      label: at(labels, index) ?? (isRecord ? undefined : entry),
      // A plain list (`[1]`, a list of ids with no record behind it) has no
      // row of its own, so {{row.X}} keeps meaning what it meant outside the
      // repeat — the clicked row. Replacing it with {} emptied every key a
      // payload read off the row the button was pressed on.
      row: row || (isRecord ? entry : scope?.row && typeof scope.row === "object" ? scope.row : {}),
      // The row outside the repeat, always: inside a list of records, where
      // {{row}} is each record, the clicked row is still {{parentRow.X}}.
      parentRow: scope?.row && typeof scope.row === "object" ? scope.row : {},
    };
  });
}

/**
 * One key's answer, inside whatever scope it is being built in.
 *
 * A key can hold four things: a template, a literal, a LIST of its own —
 * `visits: [{ date, note }]` inside each doctor — or a RECORD of its own,
 * `address: { line1, city }`. A list is the key's `items` and repeats, so a
 * key inside it reads the scope of ITS item: `{{item}}` inside `visits` is one
 * visit, not one doctor. A record is the key's `record` and does not repeat,
 * so its keys read exactly what the key beside them reads. Between them they
 * make the shape an endpoint actually asked for reachable without typing JSON.
 *
 * A value whose text begins with `{` or `[` is parsed after it resolves, so a
 * record or list can still be written by hand in one key. Decided by what was
 * authored, not by what came back: a field whose answer happens to look like
 * JSON is still that text.
 */
/**
 * `known` is the catalog's description of the record these keys belong to
 * (a parameter's `fields`, and each field's own `fields` one level down). A
 * key the designer left without a send-as goes out as its DTO declares.
 */
function fieldValue(f, scope, known) {
  const kf = knownField(known, f?.key);
  if (f?.items && typeof f.items === "object") return buildItemObjects(f.items, scope, kf?.fields);
  // A record of its own: the same rows, one level down, read in the SAME
  // scope — a record does not repeat, so nothing changes about what {{item}}
  // or {{row}} mean inside it.
  if (Array.isArray(f?.record)) return buildFields(f.record, scope, kf?.fields) || {};
  const as = f?.sendAs || SEND_AS_OF_TYPE[kf?.type] || "";
  const text = typeof f?.value === "string" ? f.value : undefined;
  const v = text === undefined ? f?.value : interpolate(text, scope, { json: true });
  let out = v;
  if (typeof text === "string" && typeof v === "string") {
    // `{{…}}` also starts with `{`, so a template answering "16" was parsed
    // into the number 16. Once a type applies, only a real JSON literal
    // (`[…]`, `{"…`) is parsed; a key with none keeps the old rule.
    const pinned = f?.type || as;
    // A JS value already returned the type it meant: "12" stays text.
    const looksJson = isJsValue(text) ? false : pinned ? /^\s*(\[|\{(?!\{))/.test(text) : /^\s*[[{]/.test(text);
    if (looksJson) {
      try {
        out = JSON.parse(v);
      } catch (e) {
        /* not valid JSON after all — send it as the text it is */
      }
    }
  }
  if (f?.type) out = coerceParam(out, f.type);
  out = fillBlank(out, f?.fallback, as, scope);
  return castAs(out, as);
}

/** The record a list of `{key, value}` rows describes, in one scope. */
export function buildFields(fields, scope = {}, known) {
  const rows = (fields || []).filter((f) => f && f.key);
  if (!rows.length) return undefined;
  const out = {};
  rows.forEach((f) => {
    const v = fieldValue(f, scope, known);
    if (v !== undefined) out[f.key] = v;
  });
  return out;
}

/**
 * `tpl.when` — "only items where": each condition is tested in the item's own
 * scope, so `row.IsTicked eq 1` or `item ne 0` keeps some items and drops the
 * rest. A grid's whole list goes in and only the rows that qualify come out.
 */
/**
 * A row with no key and a value makes the list a list of VALUES rather than
 * of records: `{{row.ID}}` with the key left empty sends `["278", "33"]`, not
 * `[{ "ID": "278" }, …]` — what an endpoint taking `id: string[]` wants. Only
 * when no row has a key; with keys, a keyless row is ignored as before.
 */
export function itemValueRow(tpl) {
  const rows = (tpl?.fields || []).filter(Boolean);
  if (rows.some((f) => f.key)) return null;
  return (
    rows.find(
      (f) => !f.key && ((typeof f.value === "string" && f.value.trim() !== "") || (f.value !== undefined && f.value !== null && typeof f.value !== "string") || f.items || Array.isArray(f.record)),
    ) || null
  );
}

export function buildItemObjects(tpl, scope = {}, known) {
  const fields = (tpl?.fields || []).filter((f) => f && f.key);
  const valueRow = fields.length ? null : itemValueRow(tpl);
  if (!fields.length && !valueRow) return undefined;
  const kept = itemScopes(tpl, scope).filter((each) => whenPasses(tpl?.when, each));
  if (valueRow) return kept.map((each) => fieldValue(valueRow, each)).filter((v) => v !== undefined);
  return kept.map((each) => buildFields(fields, each, known) || {});
}

/**
 * A record built key by key — a parameter's `objectFields`.
 *
 * The alternative is what it replaces: a record typed out as JSON text,
 * `{"roomID":"{{vars.bed.RoomID}}", …}`, where every brace and quote is the
 * designer's to get right and Map… can only paste a token into the middle of
 * it. One bad comma and the whole parameter goes out as {} — which is a
 * silent, valid-looking request.
 *
 * Keyed rows instead, each value a template box with the picker beside it. A
 * value whose text begins with `{` or `[` is parsed after resolution, so a
 * nested record or list can still be written by hand inside one key; anything
 * else stays the value it resolved to, text included.
 */
export function buildObjectFields(fields, scope = {}, known) {
  return buildFields(fields, scope, known);
}

export function buildApiRequest(cfg, scope = {}, overrides = {}) {
  const c = normalizeApiConfig(cfg);
  const method = (c.method || "GET").toLowerCase();

  let url = interpolate(c.endpoint || "", scope);
  const query = {};
  const body = {};
  const headers = {};
  // A body key sent without its name whose value is not a record (a list, a
  // plain value) IS the body — there is nothing to merge it into.
  let bodyRoot;

  // Parameters the catalog declared as real booleans — the only ones that keep
  // true/false (see flagsToBits).
  const boolParams = new Set((c.params || []).filter((p) => p?.type === "bool").map((p) => p.name));

  (c.params || []).forEach((p) => {
    if (!p || !p.name) return;
    if (isAutoParam(p.name)) return;
    // "One object per item" answers for the whole parameter when it is set —
    // there is no single value behind it to fall back to.
    let raw = p.itemTemplate ? buildItemObjects(p.itemTemplate, scope, p.fields) : undefined;
    // A record built key by key answers for the whole parameter the same way.
    if (raw === undefined && Array.isArray(p.objectFields) && p.objectFields.length) {
      raw = buildObjectFields(p.objectFields, scope, p.fields);
    }
    if (raw === undefined) {
      const source = pickParamValue(p, scope);
      // Nothing matched and there was no fallback: the parameter is left out of
      // the request entirely, which is how a key that exists only for some rows
      // is written (an OPD receipt sends transactionID, an IPD one must not).
      if (source === undefined) return;
      // A list or record parameter resolves as JSON, so a value assembled out of
      // several tokens (`[{{values.a}}, {{values.b}}]`) is still JSON when it
      // lands. A lone token is untouched either way: it comes back as the value
      // itself, not as text.
      const asJson = p.type === "array" || p.type === "object";
      raw = typeof source === "string" ? interpolate(source, scope, asJson ? { json: true } : undefined) : source;
    }
    // Unset, the key's own DTO type (p.type) decides; "raw" sends it untouched.
    const raw0 = p.sendAs === "raw";
    const coerced = raw0 ? raw : coerceParam(raw, p.type);
    // The zero-value default is for body keys only: an empty query or path
    // key is left out on purpose ("no filter"), and 0 would filter by 0.
    const inBody = p.source === "Body" || p.source === "Form";
    const filled = fillBlank(coerced, p.fallback, p.sendAs || SEND_AS_OF_TYPE[p.type] || "", scope, inBody);
    const bits = p.type === "bool" || raw0 ? filled : flagsToBits(filled);
    const val = castAs(bits, p.sendAs);
    if (val === undefined) return;

    switch (p.source) {
      case "Path":
        url = url.replace(new RegExp(`\\{${p.name}\\??\\}`, "g"), encodeURIComponent(val));
        break;
      case "Header":
        headers[p.name] = String(val);
        break;
      case "Body":
      case "Form":
        // "Send without the key": { obj: {a, b} } goes out as { a, b }.
        if (p.unwrap) {
          if (val && typeof val === "object" && !Array.isArray(val)) Object.assign(body, val);
          else bodyRoot = val;
        } else body[p.name] = val;
        break;
      default:
        query[p.name] = val;
    }
  });

  // A raw JSON body wins over named body fields — it is what you paste when the
  // endpoint takes a DTO the catalog could only describe one level deep.
  let payload = bodyRoot !== undefined ? bodyRoot : body;
  if (c.bodyJson && c.bodyJson.trim()) {
    try {
      payload = interpolateDeep(JSON.parse(c.bodyJson), scope);
    } catch (e) {
      payload = body;
    }
  }

  Object.assign(query, overrides.params || {});
  if (overrides.body) payload = { ...payload, ...overrides.body };

  // A test payload replaces what would have been sent rather than merging with
  // it: half a real payload and half a test one is a request nobody meant to
  // make. Where it lands follows the verb — a GET has no body to replace.
  if (overrides.testPayload && typeof overrides.testPayload === "object") {
    if (method === "get" || method === "delete") Object.assign(query, overrides.testPayload);
    else payload = overrides.testPayload;
  }

  // A raw JSON body, a test payload and an override all bypass the loop above,
  // so the flags are converted once more over the finished request. Anything
  // the catalog typed `bool` is put back, since that binder wants true/false.
  const keepBools = (obj) => {
    const out = flagsToBits(obj);
    if (out && typeof out === "object" && !Array.isArray(out)) {
      for (const name of boolParams) if (name in out && typeof obj[name] === "boolean") out[name] = obj[name];
    }
    return out;
  };

  const config = { method };
  if (Object.keys(headers).length) config.headers = headers;
  if (method !== "get" && method !== "delete") config.data = keepBools(payload);
  return { url: appendQuery(url, keepBools(query)), config };
}

/** Rows out of a response, allowing for the usual HIS envelopes. */
export function pluckRows(raw, responsePath) {
  const picked = responsePath ? getPath(raw, responsePath) : raw;
  if (Array.isArray(picked)) return picked;
  if (picked && typeof picked === "object") {
    const guess = picked.data || picked.result || picked.items || picked.Table || picked.rows;
    if (Array.isArray(guess)) return guess;
    return [picked];
  }
  return [];
}

/**
 * Where the rows actually were, so the picker can say "found 24 rows at
 * data.items" rather than making the designer guess a path.
 */
export function findRowsPath(raw) {
  if (Array.isArray(raw)) return "";
  if (!raw || typeof raw !== "object") return "";

  const seen = new Set();
  const queue = [{ node: raw, path: "" }];
  while (queue.length) {
    const { node, path } = queue.shift();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    for (const key of Object.keys(node)) {
      const next = node[key];
      const nextPath = path ? `${path}.${key}` : key;
      if (Array.isArray(next) && next.length && typeof next[0] === "object") return nextPath;
      if (next && typeof next === "object") queue.push({ node: next, path: nextPath });
    }
  }
  return "";
}

const CHIP_HINTS = /(status|state|priority|triage|type|category)$/i;
const DATE_HINTS = /(date|dob|on)$/i;

/** "PatientName" -> "Patient Name", "UHID" -> "UHID". */
export function humanizeKey(key) {
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Column definitions inferred from the rows that came back, so Sync can fill
 * the grid instead of leaving someone to type twenty column keys. The type is
 * guessed from the value first and the name second; anything unrecognised is
 * plain text, which is always safe to render. Every key is bound by default:
 * a column too many is one click to hide, a missing one has to be typed in.
 */
export function deriveColumns(rows, { max = Infinity } = {}) {
  const sample = (rows || []).find((r) => r && typeof r === "object");
  if (!sample) return [];

  return Object.keys(sample)
    .filter((k) => !k.startsWith("__"))
    .slice(0, max)
    .map((key) => {
      const v = sample[key];
      let type = "text";
      if (typeof v === "number") type = "number";
      else if (typeof v === "boolean") type = "text";
      else if (v && typeof v === "object") type = "text";
      else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}([T ]|$)/.test(v)) type = "date";
      else if (CHIP_HINTS.test(key)) type = "chip";
      else if (DATE_HINTS.test(key) && typeof v === "string") type = "date";

      return {
        key,
        header: humanizeKey(key),
        type,
        width: type === "number" ? 110 : 150,
        align: type === "number" ? "right" : "left",
        sortable: true,
        visible: true,
        chipRules: [],
      };
    });
}

/**
 * How many synced rows are kept on the component as a design-time preview.
 *
 * They live in the saved screen JSON so the canvas shows real data after a
 * reload without calling anything. A cap keeps a 5000-row response from being
 * written into the document.
 */
export const PREVIEW_ROW_LIMIT = 25;

/**
 * Reconcile the columns a component already has with the ones the response
 * actually returned — matched by key, which is the only thing that carries
 * meaning across a re-sync.
 *
 * Existing columns win: a header someone rewrote, a width they dragged, the
 * chip colour rules they set up all survive. Keys the response no longer
 * returns are dropped, because they would render as empty cells, and keys it
 * gained are appended in the order the API sent them.
 */
export function mergeColumns(existing, derived) {
  const had = new Map((existing || []).filter((c) => c && c.key).map((c) => [c.key, c]));
  return (derived || []).map((d) => {
    const prev = had.get(d.key);
    return prev ? { ...d, ...prev } : d;
  });
}

/**
 * Whether a re-sync should overwrite the column list on its own.
 *
 * Nothing configured yet, or a column set that has no key in common with the
 * response (the default PatientName/UHID/Status a new table starts with), means
 * there is no work to lose — bind it. Once the columns and the data agree, a
 * later sync leaves them alone and offers the button instead.
 */
export function shouldAutoBindColumns(existing, derived) {
  const cols = (existing || []).filter((c) => c && c.key);
  if (!cols.length) return true;
  const keys = new Set((derived || []).map((d) => d.key));
  return !cols.some((c) => keys.has(c.key));
}

/** Synthetic data-source id for a component that owns its endpoint. */
export const nodeSourceId = (nodeId) => `node:${nodeId}`;

/** The node id back out of one, or "" when the id is a real data source. */
export const nodeIdFromSource = (sourceId) =>
  typeof sourceId === "string" && sourceId.startsWith("node:") ? sourceId.slice(5) : "";
