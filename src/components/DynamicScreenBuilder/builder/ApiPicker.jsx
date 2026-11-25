/**
 * Pick a real endpoint instead of typing a URL.
 *
 * Controller -> endpoint -> method -> parameters, all read from the server's own
 * route table (HospediaAPI/ScreenBuilder, via networkServices/screenBuilderApi).
 * Every parameter arrives with a sample value the server suggested, so **Sync**
 * can run the call immediately: it reports how many rows came back, where they
 * were in the response, and fills the grid's columns from them.
 *
 * Sync is the only thing here that touches a live endpoint, and only when the
 * designer presses it — the canvas itself never calls anything.
 */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import makeApiRequest from "@app/networkServices/axiosInstance";
import { getApiControllers, getApiEndpoints } from "@app/networkServices/screenBuilderApi";
import Icon from "../registry/icons";
import Tap from "./Tap";
import { filterOptionRows, resolveOptionFields } from "../registry/shared";
import {
  buildApiRequest,
  configFromEndpoint,
  deriveColumns,
  findRowsPath,
  isApiConfigReady,
  isAutoParam,
  itemScopes,
  itemValueRow,
  knownField,
  mergeColumns,
  sampleToValue,
  SEND_AS_OF_TYPE,
  normalizeApiConfig,
  pluckRows,
  PREVIEW_ROW_LIMIT,
  shouldAutoBindColumns,
} from "../utils/apiConfig";
import { OPERATORS } from "../schema/schema";
import { fillFromModal } from "../utils/componentProps";
import {
  Combo,
  DebouncedInput,
  DialogFieldsContext,
  JsAwareInput,
  Row,
  ScopeBrowser,
  ScopeRailContext,
  SelectBox,
  Toggle,
  useOptionColumns,
  ValueMap,
  WhenRows,
} from "./editors";
import { liveScope } from "../utils/livescope";
import { dateTokens, interpolate } from "../utils/expressions";

const METHODS = ["GET", "POST", "PUT", "DELETE"].map((m) => ({ value: m, label: m }));

/** Where a hand-added payload key is sent. */
const KEY_TARGETS = [
  { value: "Body", label: "in the body" },
  { value: "Query", label: "in the query" },
  { value: "Header", label: "as a header" },
];

/**
 * A top-level key's catalog type — the tokens ApiCatalogService.TypeNameOf
 * emits, which `coerceParam` (utils/apiConfig) converts the value to.
 */
const PARAM_TYPES = [
  { value: "string", label: "text" },
  { value: "int", label: "number (whole)" },
  { value: "decimal", label: "number (decimal)" },
  { value: "bool", label: "true / false" },
  { value: "date", label: "date" },
  { value: "array", label: "list" },
  { value: "object", label: "record" },
];

/** A key's wire type, applied last when the request is built — see castAs in utils/apiConfig. */
const SEND_AS = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "boolean", label: "boolean" },
];

/**
 * Unset follows the DTO (`dtoType`, the catalog's type for this key), so a
 * backend change reaches the screen without re-picking; choosing the DTO's
 * own type stores nothing for the same reason. "as is" sends the value
 * untouched.
 */
function SendAsPick({ value, dtoType, onChange }) {
  const dto = SEND_AS_OF_TYPE[dtoType] || "";
  const options = [
    ...SEND_AS.map((o) => (o.value === dto ? { ...o, label: `${o.label} · DTO` } : o)),
    { value: "raw", label: "as is" },
  ];
  return (
    <SelectBox
      className="dsbi-sendas"
      value={value || dto || "raw"}
      onChange={(v) => onChange(v === (dto || "raw") ? undefined : v)}
      options={options}
      allowEmpty={false}
    />
  );
}

const ZERO_HINT = { string: '""', number: "0", boolean: "false" };

/**
 * "If empty" box + send-as, between a key's value and its eye. The box's
 * placeholder is what goes out when both the value and the box are empty —
 * the send-as type's zero value (see fillBlank in utils/apiConfig).
 */
function PayloadExtras({ fallback, onFallback, sendAs, dtoType, onSendAs, zeroDefault = true }) {
  const as = sendAs || SEND_AS_OF_TYPE[dtoType] || "raw";
  const hint = zeroDefault ? ZERO_HINT[as] : undefined;
  return (
    <>
      <span
        className="dsbi-fallback"
        title={`Sent when the value is empty (null, undefined, blank)${hint ? ` — left blank, ${hint}` : ""}. Can hold {{…}}.`}
      >
        <DebouncedInput value={fallback || ""} onChange={(v) => onFallback(v || undefined)} placeholder={hint ?? "if empty"} />
      </span>
      <SendAsPick value={sendAs} dtoType={dtoType} onChange={onSendAs} />
    </>
  );
}

/** The envelope every controller here returns: { success, message, data }. */
const unwrap = (res) => (Array.isArray(res) ? res : res?.data ?? []);

/**
 * `mode` decides what a Sync binds:
 *   "rows"    a grid — columns and preview rows (the default)
 *   "options" a select — the label/value mapping and preview options
 *   "source"  a screen-level data source — keeps the response path and the
 *             page-load switch (a source needs both) but binds no columns; the
 *             fields it fills live on the source, not on a node.
 *   "measure" a KPI card — keeps the rows as its canvas preview, so the card
 *             shows the real number and its field lists fill, but has no
 *             columns to bind.
 *   "cards"   a card list — the same as "measure": preview rows only, so the
 *             canvas draws real cards and every {{row.…}} picker fills.
 *   "call"    an action — binds nothing. The button becomes "Test call", so a
 *             designer can prove a save works before wiring the screen up, and
 *             the row/page-load settings a one-shot call has no use for are
 *             hidden.
 */
/**
 * Declared here, at module scope, and not inside ApiPicker.
 *
 * A component declared inside another is a NEW component type on every
 * render of the outer one, so React cannot match it against what it drew
 * last time: it unmounts the whole subtree and mounts a fresh one. For a
 * panel of text boxes that means the box being typed into is thrown away
 * and replaced — the caret lands on <body> and the next character goes
 * nowhere. It showed up here as "type a word and the payload key loses
 * focus", once per keystroke that got past the debounce.
 */
/**
 * What one payload key sends: a single value, or one picked per record.
 *
 * The second mode is what lets a screen say "type is IPD, or Patient-Advance
 * when there is no transaction, or otherwise OPD" — three values for one key,
 * decided per row. A key whose rules all miss is left out of the request,
 * which is how a field that exists only for some records is written.
 */
/** The field a repeated key walks, read out of `{{values.X}}`. */
const ITEM_LIST_FIELD = /^\{\{\s*values\.([A-Za-z0-9_$]+)\s*\}\}$/;

/** What a repeated key's own boxes can read, beside the screen's fields. */
const ITEM_SOURCES = [
  { value: "{{item}}", label: "item — the value itself", group: "Each item" },
  { value: "{{label}}", label: "label — the text it showed", group: "Each item" },
  { value: "{{index}}", label: "index — its place, from 0", group: "Each item" },
  { value: "{{number}}", label: "number — its place, from 1", group: "Each item" },
];

/**
 * The keys of a record already typed out as JSON, so switching to the row
 * editor keeps the work. `{"a": "{{values.x}}"}` is valid JSON — the templates
 * sit inside the quotes — so the common case parses. A nested value comes back
 * as its JSON text, which is what the row editor sends it as.
 */
/**
 * The catalog's description of a record, as editor rows.
 *
 * A field that holds a model becomes a nested record (`{ }`), one that holds a
 * list of them a nested repeat (`[ ]`) — so a model of models arrives as the
 * form it is, rather than as a row per name with the insides left to guess.
 */
function rowsFromFields(fields) {
  return (fields || [])
    .filter((f) => f?.name)
    .map((f) => {
      const inner = f.fields?.length ? rowsFromFields(f.fields) : null;
      if (inner) {
        return f.type === "array" || f.isCollection
          ? { key: f.name, items: { list: "", fields: inner } }
          : { key: f.name, record: inner };
      }
      return { key: f.name, value: "" };
    });
}

/**
 * The rows a record editor opens with.
 *
 * Two sources, and both matter. Whatever JSON is already typed is parsed —
 * `{"a": "{{values.x}}"}` is valid JSON, the templates sit inside the quotes —
 * so switching modes keeps the work. Then the keys the CATALOG described are
 * added underneath: a nested model arrives with its field names known, and
 * leaving them out meant retyping them from memory. Miss one and the record
 * posts half empty, which the server answers as a complaint about a field
 * nobody left out on purpose.
 */
function fieldsFromJson(text, known) {
  const rows = [];
  const seen = new Set();
  const push = (row) => {
    const k = String(row?.key || "");
    if (!k || seen.has(k.toLowerCase())) return;
    seen.add(k.toLowerCase());
    rows.push(row);
  };

  if (typeof text === "string" && text.trim()) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.keys(parsed).forEach((k) =>
          push({
            key: k,
            value: parsed[k] === null || typeof parsed[k] === "object" ? JSON.stringify(parsed[k]) : String(parsed[k]),
          }),
        );
      }
    } catch (e) {
      /* not JSON — the catalog's keys are still worth offering */
    }
  }

  rowsFromFields(known).forEach(push);

  return rows.length ? rows : [{ key: "", value: "" }];
}

/** The columns of one item of a list, read off the mounted screen. */
function columnsFromLive(tpl, scopeOf) {
  const base = liveScope();
  if (!base) return [];
  let at = base;
  if (typeof scopeOf === "function") {
    at = scopeOf(base);
    if (!at) return [];
  }
  const first = itemScopes(tpl, at)[0];
  return first?.row && typeof first.row === "object"
    ? Object.keys(first.row).filter((k) => k && !String(k).startsWith("__"))
    : [];
}

/**
 * "Only items where" — the item's own names as condition fields: `row.IsTicked`,
 * `item`, `index`. A condition reads a path, not a template, so the braces go.
 */
function whenFieldsOf(sources) {
  return (sources || [])
    .map((s) => {
      const m = /^\{\{\s*([^}]+?)\s*\}\}$/.exec(String(s?.value || ""));
      return m ? { value: m[1], label: s.label || m[1] } : null;
    })
    .filter(Boolean);
}

/* ------------------------------------------------------------ date calc */

const DATE_OPS = [
  { value: "add", label: "plus" },
  { value: "sub", label: "minus" },
  { value: "diff", label: "difference from" },
  { value: "startOfMonth", label: "first day of its month" },
  { value: "endOfMonth", label: "last day of its month" },
];
const DATE_UNITS = [
  { value: "Days", label: "days" },
  { value: "Months", label: "months" },
  { value: "Years", label: "years" },
];
const DATE_FORMATS_OUT = [
  { value: "", label: "2026-09-28 (as the API takes it)" },
  { value: "DD-MMM-YYYY", label: "28-Sep-2026" },
  { value: "DD/MM/YYYY", label: "28/09/2026" },
];

/** The dates a calculation can start from: today, the form's fields, the row's. */
function dateBases(formFields = [], rowFields = [], sources = []) {
  return [
    { value: "today", label: "Today" },
    ...(formFields || []).map((f) => ({ value: `values.${f}`, label: `${f} — form field` })),
    ...(rowFields || []).map((f) => ({ value: `row.${f}`, label: `${f} — the row` })),
    ...whenFieldsOf(sources).filter((s) => s.value.startsWith("row.")),
  ].filter((o, i, all) => all.findIndex((x) => x.value === o.value) === i);
}

/**
 * Builds a date formula instead of making anyone remember filter names:
 * "StartDate plus 90 days" becomes {{values.StartDate | addDays:90}}, "ToDate
 * difference from FromDate in days" {{values.ToDate | diffDays:values.FromDate}}.
 * The preview runs the real engine, against the screen as it stands.
 */
function DateCalc({ bases, onApply, onClose }) {
  const [base, setBase] = useState("today");
  const [op, setOp] = useState("add");
  const [n, setN] = useState("90");
  const [unit, setUnit] = useState("Days");
  const [other, setOther] = useState("today");
  const [fmt, setFmt] = useState("");
  const b = String(base || "today").trim();
  const withFmt = fmt ? ` | date:${fmt}` : "";
  // A number, or a field holding one (selected.validityDays.value).
  const amount = String(n ?? "").trim() || "0";
  const tpl =
    op === "diff"
      ? `{{${b} | diff${unit}:${String(other || "today").trim()}}}`
      : op === "add" || op === "sub"
        ? `{{${b} | ${op}${unit}:${amount}${withFmt}}}`
        : `{{${b} | ${op}${withFmt}}}`;
  let preview = "";
  try {
    const scope = { ...(liveScope() || {}), ...dateTokens() };
    const v = interpolate(tpl, scope);
    preview = v === "" || v === undefined ? "— (the date is empty right now)" : String(v);
  } catch (e) {
    preview = "—";
  }
  return (
    <div className="dsbi-datecalc">
      <div className="dsbi-datecalc-row">
        <Combo value={base} onChange={setBase} options={bases} placeholder="Today" searchPlaceholder="Search fields…" allowCustom customLabel={(v) => `Use "${v}"`} />
        <SelectBox value={op} onChange={setOp} options={DATE_OPS} allowEmpty={false} />
      </div>
      {op === "add" || op === "sub" ? (
        <div className="dsbi-datecalc-row">
          <Combo
            value={n}
            onChange={setN}
            options={bases.filter((o) => o.value !== "today")}
            placeholder="90 — or a field"
            searchPlaceholder="Type a number, or search fields…"
            allowCustom
            customLabel={(v) => `Use ${v}`}
          />
          <SelectBox value={unit} onChange={setUnit} options={DATE_UNITS} allowEmpty={false} />
        </div>
      ) : null}
      {op === "diff" ? (
        <div className="dsbi-datecalc-row">
          <Combo value={other} onChange={setOther} options={bases} placeholder="Today" searchPlaceholder="Search fields…" allowCustom customLabel={(v) => `Use "${v}"`} />
          <SelectBox value={unit} onChange={setUnit} options={DATE_UNITS} allowEmpty={false} />
        </div>
      ) : (
        <SelectBox value={fmt} onChange={setFmt} options={DATE_FORMATS_OUT} allowEmpty={false} />
      )}
      <div className="dsbi-datecalc-out">
        <code>{tpl}</code>
        <span>
          now gives <b>{preview}</b>
        </span>
      </div>
      <div className="dsbi-paramrules-foot">
        <Tap className="tone-primary dsbi-mini is-primary" onClick={() => onApply(tpl)}>
          <Icon name="Check" size={11} /> Use this
        </Tap>
        <Tap className="tone-mode dsbi-mini" onClick={onClose}>
          Cancel
        </Tap>
      </div>
      <p className="dsbi-rules-note">
        A difference is this date minus the other, in whole units — negative when it is earlier. In a condition, a
        date field compares as a date: <i>ExpiryDate</i> <i>less than</i> <code>today</code>.
      </p>
    </div>
  );
}

function ItemWhere({ tpl, onChange, sources }) {
  return (
    <div className="dsbi-itemwhere">
      <span className="dsbi-itemfor-lbl">only where</span>
      <WhenRows value={tpl.when} onChange={(v) => onChange({ ...tpl, when: v })} fieldOptions={whenFieldsOf(sources)} />
    </div>
  );
}

/** `{{item}}`, `{{label}}`, ... plus a `{{row.Column}}` for each column there is. */
function itemSourcesOf(columns) {
  return [
    ...ITEM_SOURCES,
    ...[...new Set(columns || [])].map((k) => ({
      value: `{{row.${k}}}`,
      label: `row.${k} — that column of this item`,
      search: `row ${k}`,
      group: "Each item",
    })),
  ];
}

/**
 * The keys of a record — and, where a key holds a list, the keys of ITS
 * records, and so on down.
 *
 * `[ ]` beside a key turns it into a list: the key gains a **for each** of its
 * own and rows built per item of that list. `{ }` turns it into a record: the
 * same rows, no repeat, read in the same scope as the key beside them. An
 * endpoint asking for `doctors: [{ doctorID, address: { city }, visits: [{
 * date }] }]` is then configured rather than typed, which is the only way the
 * inner shapes were reachable before — as JSON, by hand, with every template
 * quoted right.
 *
 * Recursive, and module scope rather than nested inside ParamValue: a
 * component declared during a render is a new type on every keystroke, and
 * every box below it would lose focus.
 */
function KeyRows({ fields, onFields, formFields, rowFields, rowSource, scopeOf, sources, placeholder, known }) {
  const rows = Array.isArray(fields) ? fields : [];
  const patch = (i, next) => onFields(rows.map((f, j) => (j === i ? { ...f, ...next } : f)));
  // Which row's Date calc is open — one at a time.
  const [calcAt, setCalcAt] = useState(-1);

  return (
    <>
      {rows.map((f, i) => {
        const nested = f.items && typeof f.items === "object" ? f.items : null;
        const record = !nested && Array.isArray(f.record) ? f.record : null;
        const kf = knownField(known, f.key);
        // The scope one level in: this key's list, item by item. `{{item}}`
        // inside `visits` is one visit, not the doctor it hangs off.
        const innerScope = nested
          ? (live) => {
              const base = typeof scopeOf === "function" ? scopeOf(live) : live;
              return base ? itemScopes(nested, base)[0] || null : null;
            }
          : undefined;

        return (
          <div className="dsbi-keyrow" key={i}>
            <div className="dsbi-itemfield">
              <DebouncedInput value={f.key || ""} onChange={(v) => patch(i, { key: v })} placeholder="key" />
              <Tap
                className={`tone-list dsbi-mini is-icon dsbi-arrbtn ${nested ? "is-on" : ""}`}
                title={nested ? "Back to one value for this key" : "This key holds a list — fill it per item"}
                aria-pressed={!!nested}
                onClick={() =>
                  patch(i, {
                    record: undefined,
                    items: nested ? undefined : { list: "", fields: [{ key: "", value: "{{item}}" }] },
                  })
                }
              >
                <Icon name="Rows3" size={11} />
              </Tap>
              <Tap
                className={`tone-record dsbi-mini is-icon dsbi-arrbtn ${record ? "is-on" : ""}`}
                title={record ? "Back to one value for this key" : "This key holds a record — fill it key by key"}
                aria-pressed={!!record}
                onClick={() =>
                  patch(i, {
                    items: undefined,
                    record: record ? undefined : [{ key: "", value: "" }],
                  })
                }
              >
                <Icon name="Box" size={11} />
              </Tap>
              {nested || record ? (
                <span className="dsbi-keyrow-tag">{nested ? "a list" : "a record"}</span>
              ) : (
                <ValueMap
                  value={f.value || ""}
                  onChange={(v) => patch(i, { value: v })}
                  formFields={formFields}
                  rowFields={rowFields}
                  rowSource={rowSource}
                  placeholder={placeholder}
                  extraSources={sources}
                  peekScope={scopeOf}
                  beforePeek={
                    <PayloadExtras
                      fallback={f.fallback}
                      onFallback={(v) => patch(i, { fallback: v })}
                      sendAs={f.sendAs}
                      dtoType={kf?.type}
                      onSendAs={(v) => patch(i, { sendAs: v })}
                    />
                  }
                />
              )}
              {nested || record || kf?.type !== "date" ? null : (
                <Tap
                  className={`tone-mode dsbi-mini is-icon ${calcAt === i ? "is-on" : ""}`}
                  title="Date calc — a date plus or minus days, months or years, or the difference between two dates"
                  aria-pressed={calcAt === i}
                  onClick={() => setCalcAt((x) => (x === i ? -1 : i))}
                >
                  <Icon name="CalendarClock" size={11} />
                </Tap>
              )}
              <Tap
                className="tone-danger dsbi-mini is-icon is-danger"
                title="Remove this key"
                onClick={() => onFields(rows.filter((_, j) => j !== i))}
              >
                <Icon name="Trash2" size={11} />
              </Tap>
            </div>

            {calcAt === i && !nested && !record ? (
              <DateCalc
                bases={dateBases(formFields, rowFields, sources)}
                onApply={(tpl) => {
                  patch(i, { value: tpl });
                  setCalcAt(-1);
                }}
                onClose={() => setCalcAt(-1)}
              />
            ) : null}

            {record ? (
              <div className="dsbi-keynest">
                <KeyRows
                  fields={record}
                  known={kf?.fields}
                  onFields={(next) => patch(i, { record: next })}
                  formFields={formFields}
                  rowFields={rowFields}
                  rowSource={rowSource}
                  scopeOf={scopeOf}
                  sources={sources}
                  placeholder={placeholder}
                />
                <div className="dsbi-paramrules-foot">
                  <Tap
                    className="tone-add dsbi-mini"
                    onClick={() => patch(i, { record: [...record, { key: "", value: "" }] })}
                  >
                    <Icon name="Plus" size={11} /> Add a key
                  </Tap>
                </div>
              </div>
            ) : null}

            {nested ? (
              <div className="dsbi-keynest">
                <div className="dsbi-itemfor">
                  <span className="dsbi-itemfor-lbl">for each</span>
                  <ValueMap
                    value={nested.list || ""}
                    onChange={(v) => patch(i, { items: { ...nested, list: v } })}
                    formFields={formFields}
                    rowFields={rowFields}
                    rowSource={rowSource}
                    placeholder="{{item.Visits}}"
                    extraSources={sources}
                    peekScope={scopeOf}
                  />
                </div>
                <ItemWhere
                  tpl={nested}
                  onChange={(next) => patch(i, { items: next })}
                  sources={itemSourcesOf(columnsFromLive(nested, scopeOf))}
                />
                <KeyRows
                  fields={nested.fields}
                  known={kf?.fields}
                  onFields={(next) => patch(i, { items: { ...nested, fields: next } })}
                  formFields={formFields}
                  rowFields={rowFields}
                  rowSource={rowSource}
                  scopeOf={innerScope}
                  sources={itemSourcesOf(columnsFromLive(nested, scopeOf))}
                  placeholder="{{item}}"
                />
                <div className="dsbi-paramrules-foot">
                  <Tap
                    className="tone-add dsbi-mini"
                    onClick={() =>
                      patch(i, {
                        items: { ...nested, fields: [...(nested.fields || []), { key: "", value: "{{item}}" }] },
                      })
                    }
                  >
                    <Icon name="Plus" size={11} /> Add a key
                  </Tap>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

/**
 * In the builder nobody has clicked a row, so {{row}} (and {{parentRow}}
 * inside a repeat) would preview as {}. For the peek only, stand in the first
 * row of the grid on the screen whose rows carry the fields this action's row
 * has — the table the button sits in. At runtime the clicked row is used.
 */
function withSampleRow(scope, rowFields = []) {
  if (!scope || (scope.row && typeof scope.row === "object" && Object.keys(scope.row).length)) return scope;
  const want = (rowFields || []).filter(Boolean);
  let best = null;
  let bestHits = 0;
  // Grids first (what the table shows), then the screen's loaded rows.
  const lists = [
    ...Object.values(scope.grid || {}).map((g) => g?.rows || g?.pageRows || []),
    ...Object.values(scope.rows || {}),
  ];
  lists.forEach((list) => {
    const first = Array.isArray(list) ? list[0] : null;
    if (!first || typeof first !== "object") return;
    const hits = want.length ? want.filter((k) => k in first).length : 1;
    if (hits > bestHits) {
      best = first;
      bestHits = hits;
    }
  });
  return best ? { ...scope, row: best } : scope;
}

function ParamValue({ param, onValue, onRules, onItems, onObject, onSendAs, onFallback, formFields, rowFields, rowSource }) {
  const rules = Array.isArray(param.valueRules) ? param.valueRules : [];
  const byCondition = rules.length > 0;
  const items = param.itemTemplate && typeof param.itemTemplate === "object" ? param.itemTemplate : null;
  const itemFields = Array.isArray(items?.fields) ? items.fields : [];
  // buildApiRequest sends `itemTemplate` ahead of `objectFields`, so when a key
  // carries both the per-item editor is the one shown — the rows you edit are
  // the rows that go out.
  const objFields =
    !items && Array.isArray(param.objectFields) && param.objectFields.length ? param.objectFields : null;
  /**
   * Inside a repeated key, `{{item}}` exists only per item — the live scope
   * knows nothing about it. So the peek box is handed the first item's scope,
   * which is what makes "is `{{item}}` an id or a record?" answerable in the
   * Inspector instead of in the network tab.
   */
  const itemPeek = useMemo(
    () => (items ? (scope) => itemScopes(items, withSampleRow(scope, rowFields))[0] || null : undefined),
    [items, rowFields],
  );
  const [calc, setCalc] = useState(false);

  /**
   * The columns of ONE item, offered by name.
   *
   * `{{item}}` and `{{label}}` are the id and the text — the two things a
   * select displays. Everything else the endpoint sent about that choice is in
   * the row behind it, and a designer cannot be expected to know its spelling.
   * So the mounted screen is asked what the chosen rows actually hold, with
   * the Synced columns of the list's own control behind it for when nothing is
   * picked yet.
   */
  const listField = items ? (ITEM_LIST_FIELD.exec(String(items.list || "").trim()) || [])[1] || "" : "";
  const { columns: listColumns } = useOptionColumns(listField);
  const itemSources = useMemo(() => {
    if (!items) return ITEM_SOURCES;
    const scope = liveScope();
    const first = scope ? itemScopes(items, scope)[0] : null;
    const fromLive = first?.row && typeof first.row === "object" ? Object.keys(first.row) : [];
    const cols = [...new Set([...fromLive, ...listColumns])].filter((k) => k && !String(k).startsWith("__"));
    return [
      ...ITEM_SOURCES,
      ...cols.map((k) => ({
        value: `{{row.${k}}}`,
        label: `row.${k} — that column of this item`,
        search: `row ${k}`,
        group: "Each item",
      })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, listColumns]);
  const fieldOptions = [...(rowFields || []), ...(formFields || [])];
  /**
   * A list or record parameter takes two kinds of answer and the box has to
   * admit both: a field that already holds one — Map… lists them — or JSON
   * typed out. Written as one line it read as "array" and looked like a type
   * label rather than something to fill in, so both are spelled out and the
   * box is tall enough to read what is in it.
   */
  const isJson = param.type === "array" || param.type === "object";
  const placeholder = isJson
    ? `{{values.…}} — a field that holds ${param.type === "array" ? "a list" : "a record"}, or ${param.type === "array" ? "[…]" : "{…}"} typed out`
    : param.type === "date"
      ? "YYYY-MM-DD"
      : param.type;

  const patch = (i, next) => onRules(rules.map((r, j) => (j === i ? { ...r, ...next } : r)));

  /**
   * A record, key by key.
   *
   * An `object` parameter used to be one box of JSON text, so every brace and
   * quote was the designer's to get right and Map… could only paste a token
   * into the middle of it. A missed comma sent `{}` — a request that looks
   * perfectly valid on the wire and is missing everything.
   *
   * Rows instead, each value a template box with the picker and the eye beside
   * it. **type it out** goes back to the JSON box, which stays the answer for
   * a shape these rows cannot express.
   */
  if (objFields) {
    return (
      <div className="dsbi-paramitems">
        <KeyRows
          fields={objFields}
          known={param.fields}
          onFields={onObject}
          formFields={formFields}
          rowFields={rowFields}
          rowSource={rowSource}
          placeholder="{{values.…}}"
        />
        <div className="dsbi-paramrules-foot">
          <Tap className="tone-add dsbi-mini" onClick={() => onObject([...objFields, { key: "", value: "" }])}>
            <Icon name="Plus" size={11} /> Add a key
          </Tap>
          <Tap
            className="tone-mode dsbi-mini"
            title="Back to the record as JSON text"
            onClick={() => onObject(undefined)}
          >
            type it out
          </Tap>
        </div>
        <p className="dsbi-rules-note">
          Sent as a record. Beside a key, <code>[ ]</code> makes it a list filled per item of whatever it repeats
          over, and <code>{"{ }"}</code> makes it a record of its own keys. A value that starts with{" "}
          <code>{"{"}</code> or <code>[</code> is read as JSON, so a shape the rows cannot express can still be
          written by hand. <code>{"{{= …}}"}</code> is an expression:{" "}
          <code>{"{{= values.gross - values.discount }}"}</code>.
        </p>
      </div>
    );
  }

  /**
   * One object per item of a list.
   *
   * A multi select holds ids; the endpoint wants a record per choice under its
   * own key names. That is a repeat, not a substitution, so it is configured
   * here rather than typed into the value box — which can only ever put the
   * whole list where one value goes.
   */
  if (items) {
    return (
      <div className="dsbi-paramitems">
        <div className="dsbi-itemfor">
          <span className="dsbi-itemfor-lbl">for each</span>
          <ValueMap
            value={items.list || ""}
            onChange={(v) => onItems({ ...items, list: v })}
            formFields={formFields}
            rowFields={rowFields}
            rowSource={rowSource}
            placeholder="{{values.DoctorID}}"
          />
        </div>
        <ItemWhere tpl={items} onChange={onItems} sources={itemSources} />
        <p className="dsbi-note">
          One object per item of that list. Inside it, <code>{"{{item}}"}</code> is the value,{" "}
          <code>{"{{label}}"}</code> the text the control showed for it,{" "}
          <code>{"{{row.Column}}"}</code> any column of the record behind it, and{" "}
          <code>{"{{index}}"}</code> its place. The row the button was clicked on stays{" "}
          <code>{"{{parentRow.Column}}"}</code> (and <code>{"{{row.Column}}"}</code> too when the list is plain values
          like <code>[1]</code>). <b>Only where</b> keeps just the items that pass — the ticked rows
          of a grid: <code>row.IsSelected</code> <i>equals</i> <code>true</code>. Leave the <b>key</b> empty to
          send just the values — <code>{"{{row.ID}}"}</code> with no key goes out as <code>["278", "33"]</code>.
        </p>
        {itemValueRow(items) ? (
          <p className="dsbi-note">
            <b>Sending a list of values</b> — no key is set, so each item sends only what its row reads
            {itemFields.find((f) => f && !f.key)?.sendAs === "string" ? ", as text" : ""}.
          </p>
        ) : null}
        <KeyRows
          fields={itemFields}
          known={param.fields}
          onFields={(next) => onItems({ ...items, fields: next })}
          formFields={formFields}
          rowFields={rowFields}
          rowSource={rowSource}
          scopeOf={itemPeek}
          sources={itemSources}
          placeholder="{{item}}"
        />
        <div className="dsbi-paramrules-foot">
          <Tap
            className="tone-add dsbi-mini"
            onClick={() => onItems({ ...items, fields: [...itemFields, { key: "", value: "{{item}}" }] })}
          >
            <Icon name="Plus" size={11} /> Add a key
          </Tap>
          <Tap
            className="tone-mode dsbi-mini"
            title="Back to one value for the whole key"
            onClick={() => onItems(undefined)}
          >
            one value
          </Tap>
        </div>
      </div>
    );
  }

  if (!byCondition) {
    return (
      <div className="dsbi-paramval">
        <ValueMap
          value={param.value}
          onChange={onValue}
          formFields={formFields}
          rowFields={rowFields}
          rowSource={rowSource}
          placeholder={placeholder}
          multiline={isJson}
          beforePeek={
            isJson ? null : (
              <PayloadExtras
                fallback={param.fallback}
                onFallback={onFallback}
                sendAs={param.sendAs}
                dtoType={param.type}
                onSendAs={onSendAs}
                zeroDefault={param.source === "Body" || param.source === "Form"}
              />
            )
          }
        />
        <Tap
          className="tone-mode dsbi-mini"
          title="Send a different value depending on the record"
          onClick={() => onRules([{ when: { field: "", op: "eq", value: "" }, value: param.value || "" }, { value: "" }])}
        >
          <Icon name="GitBranch" size={11} /> by condition
        </Tap>
        {param.type === "array" ? (
          <Tap
            className="tone-list dsbi-mini"
            title={
              param.fields?.length
                ? `Send one object per item of a list — the catalog describes ${param.fields.length} key${param.fields.length === 1 ? "" : "s"} of that object`
                : "Send one object per item of a list — a multi select's choices, a grid's ticked rows"
            }
            onClick={() =>
              onItems({
                list: "",
                // A list of models arrives with its keys known; opening on a
                // blank row threw them away and asked for them again.
                fields: param.fields?.length ? rowsFromFields(param.fields) : [{ key: "", value: "{{item}}" }],
              })
            }
          >
            <Icon name="Rows3" size={11} /> per item
            {param.fields?.length ? <b className="dsbi-mini-n">{param.fields.length}</b> : null}
          </Tap>
        ) : null}
        {param.type === "object" ? (
          <Tap
            className="tone-record dsbi-mini"
            title={
              param.fields?.length
                ? `Fill this record key by key — the catalog describes ${param.fields.length} of them`
                : "Fill this record key by key, each value from the picker"
            }
            onClick={() => onObject(fieldsFromJson(param.value, param.fields))}
          >
            <Icon name="ListChecks" size={11} /> by key
            {param.fields?.length ? <b className="dsbi-mini-n">{param.fields.length}</b> : null}
          </Tap>
        ) : null}
        {param.type !== "date" ? null : (
          <Tap
            className={`tone-mode dsbi-mini ${calc ? "is-on" : ""}`}
            title="Date calc — a date plus or minus days, months or years, or the difference between two dates"
            aria-pressed={calc}
            onClick={() => setCalc((x) => !x)}
          >
            <Icon name="CalendarClock" size={11} /> date calc
          </Tap>
        )}
        {calc ? (
          <DateCalc
            bases={dateBases(formFields, rowFields)}
            onApply={(tpl) => {
              onValue(tpl);
              setCalc(false);
            }}
            onClose={() => setCalc(false)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="dsbi-paramrules">
      {rules.map((r, i) => {
        const last = i === rules.length - 1;
        const fallback = !r.when || !r.when.op;
        return (
          <div className="dsbi-paramrule" key={i}>
            {fallback ? (
              <span className="dsbi-paramrule-tag">otherwise</span>
            ) : (
              <div className="dsbi-grid3">
                <Combo
                  value={r.when?.field}
                  onChange={(v) => patch(i, { when: { ...r.when, field: v } })}
                  options={fieldOptions}
                  placeholder="Pick a field…"
                  searchPlaceholder="Search fields…"
                  allowCustom
                  customLabel={(v) => `Use "${v}"`}
                />
                <SelectBox
                  value={r.when?.op}
                  onChange={(v) => patch(i, { when: { ...r.when, op: v } })}
                  options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))}
                  placeholder="op"
                />
                <DebouncedInput
                  value={r.when?.value}
                  onChange={(v) => patch(i, { when: { ...r.when, value: v } })}
                  placeholder="Value"
                />
              </div>
            )}
            <div className="dsbi-when-val">
              <JsAwareInput
                value={r.value}
                onChange={(v) => patch(i, { value: v })}
                placeholder={fallback ? `${placeholder} — when nothing above matched` : "…then send"}
              />
              <Tap
                className="tone-danger dsbi-mini is-icon is-danger"
                title={last && fallback ? "Remove the fallback — the key is then left out when nothing matches" : "Remove"}
                onClick={() => onRules(rules.filter((x, j) => j !== i))}
              >
                <Icon name="Trash2" size={11} />
              </Tap>
            </div>
          </div>
        );
      })}
      <div className="dsbi-paramrules-foot">
        <Tap
          className="tone-add dsbi-mini"
          onClick={() => onRules([...rules.slice(0, -1), { when: { field: "", op: "eq", value: "" }, value: "" }, ...rules.slice(-1)])}
        >
          <Icon name="Plus" size={11} /> Add a case
        </Tap>
        <Tap className="tone-mode dsbi-mini" title="Back to one value for every record" onClick={() => onRules([])}>
          one value
        </Tap>
      </div>
      <p className="dsbi-rules-note">
        First match wins. With no <b>otherwise</b>, a record matching none of these leaves the key out of the
        request altogether.
      </p>
    </div>
  );
}

export default function ApiPicker({
  value,
  onChange,
  onPatchProps,
  columns = [],
  mode = "rows",
  fields = {},
  formFields = [],
  // The record the node this config belongs to stands on, so a payload key can
  // be filled from the clicked row rather than typed as {{row.Whatever}}.
  rowFields = [],
  rowSource = "",
  wantsRows = false,
  onSample,
}) {
  const inRail = useContext(ScopeRailContext);
  const cfg = useMemo(() => normalizeApiConfig(value), [value]);

  const [controllers, setControllers] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [sync, setSync] = useState(null); // { ok, message, rows, columns }
  const [syncing, setSyncing] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const alive = useRef(true);
  const isCall = mode === "call";
  // Only a component can have columns or a canvas preview bound to it.
  const binds = mode === "rows" || mode === "options" || mode === "measure" || mode === "cards";

  useEffect(() => () => { alive.current = false; }, []);

  const set = useCallback((patch) => onChange({ ...cfg, ...patch }), [cfg, onChange]);

  /* ------------------------------------------------------------ catalog */

  useEffect(() => {
    let on = true;
    setLoading("controllers");
    getApiControllers()
      .then((res) => {
        if (!on) return;
        setControllers(unwrap(res));
        setCatalogError("");
      })
      .catch((e) => on && setCatalogError(e?.message || "Could not load the API list"))
      .finally(() => on && setLoading(""));
    return () => { on = false; };
  }, []);

  // Endpoints follow the chosen controller. Re-fetched rather than cached across
  // controllers: one controller's list is small, the whole catalog is not.
  useEffect(() => {
    if (!cfg.controller) {
      setEndpoints([]);
      return undefined;
    }
    let on = true;
    setLoading("endpoints");
    getApiEndpoints(cfg.controller)
      .then((res) => on && setEndpoints(unwrap(res)))
      .catch(() => on && setEndpoints([]))
      .finally(() => on && setLoading(""));
    return () => { on = false; };
  }, [cfg.controller]);

  const controllerOptions = useMemo(
    () => (controllers || []).map((c) => ({ value: c.controller, label: `${c.controller} (${c.endpointCount})` })),
    [controllers],
  );

  const endpointOptions = useMemo(
    () =>
      (endpoints || []).map((e) => ({
        value: e.id,
        label: `${e.method}  ${e.action}${e.parameters?.length ? ` · ${e.parameters.length}p` : ""}`,
      })),
    [endpoints],
  );

  const selectedEndpoint = useMemo(
    () => (endpoints || []).find((e) => e.relativePath === cfg.endpoint && e.method === cfg.method) || null,
    [endpoints, cfg.endpoint, cfg.method],
  );

  /**
   * Keep each key's DTO description (`fields`) in step with the live catalog.
   * It is what the send-as defaults and the runtime casts read, and it is a
   * snapshot taken when the endpoint was picked — so a model changed on the
   * server, or a screen saved before `fields` was kept, is refreshed here.
   * A key expanded out of a model is found among that model's fields.
   */
  useEffect(() => {
    if (!selectedEndpoint) return;
    const live = new Map();
    (selectedEndpoint.parameters || []).forEach((lp) => {
      (lp.fields || []).forEach((f) => f?.name && !live.has(f.name) && live.set(f.name, f));
    });
    (selectedEndpoint.parameters || []).forEach((lp) => lp?.name && live.set(lp.name, lp));
    let changed = false;
    const params = (cfg.params || []).map((p) => {
      const lp = live.get(p.name);
      if (!lp) return p;
      const next = lp.fields?.length ? lp.fields : undefined;
      if (JSON.stringify(next) === JSON.stringify(p.fields)) return p;
      changed = true;
      return { ...p, fields: next };
    });
    if (changed) set({ params });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEndpoint]);

  // Inside a dialog's Save chain: what the dialog reports (see editors.jsx).
  const dialog = useContext(DialogFieldsContext);
  const [filledNote, setFilledNote] = useState("");

  const pickEndpoint = (id) => {
    const ep = (endpoints || []).find((e) => e.id === id);
    if (!ep) return;
    const next = configFromEndpoint(ep, cfg);
    // Each key the dialog has a field for starts out pointing at it — the
    // mapping the hand-coded page wrote as `title: modalData?.title?.value`.
    if (dialog?.fields?.length) {
      const { params: filled, filled: n } = fillFromModal(next.params, dialog.fields);
      next.params = filled;
      setFilledNote(n ? `${n} of ${filled.length} keys filled from ${dialog.label}` : "");
    }
    onChange(next);
    setSync(null);
  };

  /** Point the keys still without a template at the dialog's fields. */
  const fillFromDialog = () => {
    const { params: filled, filled: n } = fillFromModal(cfg.params, dialog?.fields);
    setFilledNote(
      n
        ? `${n} key${n === 1 ? "" : "s"} filled from ${dialog.label}`
        : `No key left to fill matches a field of ${dialog.label} — pick them under Map…`,
    );
    if (n) set({ params: filled });
  };

  /**
   * The test payload, parsed. Invalid JSON is reported rather than silently
   * ignored: a test that quietly used the real (empty) payload would look like
   * an endpoint problem.
   */
  const testPayload = useMemo(() => {
    const text = (cfg.testBodyJson || "").trim();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return { __error: e.message };
    }
  }, [cfg.testBodyJson]);

  const testError = testPayload?.__error || "";

  /* --------------------------------------------------------------- sync */

  /**
   * Run the call the way the rendered screen will run it, then bind what comes
   * back.
   *
   * The rows are put on the component as a design-time preview, so the canvas
   * immediately shows the real data instead of placeholder names. The columns
   * are matched to the response by key: on a table that has never been wired up
   * they are written straight away, and on one whose columns already match the
   * data they are left alone and offered on a button, so nobody loses headers
   * and colour rules they set up by pressing Sync twice.
   */
  const runSync = async () => {
    if (!isApiConfigReady(cfg)) return;
    if (testError) {
      setSync({ ok: false, message: `The test payload is not valid JSON: ${testError}` });
      return;
    }
    setSyncing(true);
    setSync(null);
    try {
      const { url, config } = buildApiRequest(cfg, {}, testPayload ? { testPayload } : {});
      const raw = await makeApiRequest(url, { ...config, meta: { silent: true } });

      if (!binds) {
        // Nothing to bind: the point is only that the endpoint accepted it.
        if (!alive.current) return;
        const rejected = raw && raw.success === false;
        if (isCall && !wantsRows) {
          setSync({
            ok: !rejected,
            message: raw?.message || (rejected ? "The server rejected the call" : "Call succeeded"),
            rows: [raw],
            auto: true,
          });
          return;
        }

        if (isCall) {
          // The call feeds a component. Testing it is the only moment the
          // designer's browser ever sees this data, so it is handed over: the
          // target gets the same preview rows and columns a Sync would have
          // given it, and its key dropdowns stop being empty.
          const at = cfg.responsePath || findRowsPath(raw);
          const found = pluckRows(raw, at);
          if (at !== cfg.responsePath) set({ responsePath: at });
          if (found.length) onSample?.(found.slice(0, PREVIEW_ROW_LIMIT), deriveColumns(found));
          setSync({
            ok: !rejected && found.length > 0,
            message: rejected
              ? raw?.message || "The server rejected the call"
              : found.length
                ? `${found.length} row${found.length === 1 ? "" : "s"} at "${at || "(root)"}" — sent to the target`
                : raw?.message || "The call succeeded but no rows came back",
            rows: found.slice(0, 2),
            auto: true,
          });
          return;
        }
        // A source: report where the rows were and remember the path, so the
        // components binding to it do not have to be told again.
        const at = cfg.responsePath || findRowsPath(raw);
        const found = pluckRows(raw, at);
        if (at !== cfg.responsePath) set({ responsePath: at });
        setSync({
          ok: !rejected && found.length > 0,
          message: rejected
            ? raw?.message || "The server rejected the call"
            : found.length
              ? `${found.length} row${found.length === 1 ? "" : "s"} at "${at || "(root)"}"`
              : raw?.message || "The call succeeded but no rows came back",
          rows: found.slice(0, 2),
          auto: true,
        });
        return;
      }

      const path = cfg.responsePath || findRowsPath(raw);
      const rows = pluckRows(raw, path);
      const found = deriveColumns(rows);

      if (!alive.current) return;
      if (!rows.length) {
        setSync({
          ok: false,
          message: raw?.message || "The call succeeded but no rows came back. Check the parameters or the response path.",
        });
        return;
      }

      const preview = rows.slice(0, PREVIEW_ROW_LIMIT);
      const at = `${rows.length} row${rows.length === 1 ? "" : "s"} at "${path || "(root)"}"`;

      if (path !== cfg.responsePath) set({ responsePath: path });

      if (mode === "options") {
        // A select needs two fields, not a column list. Whatever the designer
        // already typed wins; the rest is guessed from the response so a fresh
        // endpoint shows real labels straight away.
        const map = resolveOptionFields(rows, fields.optionLabelField, fields.optionValueField);

        // The preview is capped at 25 rows, so a filtered select has to keep the
        // rows it will actually offer — the first 25 of a whole lookup table are
        // very often none of them. A filter reading {{values.x}} matches nothing
        // while the form is empty, so an empty result falls back to the raw rows
        // rather than leaving the canvas blank.
        const filters = (fields.optionFilters || []).filter((f) => f && f.field && f.op);
        const kept = filters.length ? filterOptionRows(rows, filters, {}) : rows;
        const optPreview = (kept.length ? kept : rows).slice(0, PREVIEW_ROW_LIMIT);

        onPatchProps?.({
          previewOptions: optPreview,
          optionLabelField: fields.optionLabelField || map.label,
          optionValueField: fields.optionValueField || map.value,
        });
        setSync({
          ok: true,
          message:
            `${at} · label "${map.label}", value "${map.value}"` +
            (filters.length
              ? kept.length
                ? ` · ${kept.length} kept by the filter`
                : " · the filter kept none of them — showing all rows (a filter reading a form value matches nothing until the user picks one)"
              : ""),
          rows: optPreview,
          columns: found,
          path,
          auto: true,
        });
        return;
      }

      if (mode === "measure" || mode === "cards") {
        onPatchProps?.({ previewRows: preview });
        setSync({
          ok: true,
          message:
            mode === "cards"
              ? `${at} · ${found.length} fields — put them on the card with the field picker beside Title, Status…`
              : `${at} · ${found.length} fields — pick what to measure below`,
          rows: preview,
          columns: found,
          path,
          auto: true,
        });
        return;
      }

      const auto = shouldAutoBindColumns(columns, found);
      const patch = { previewRows: preview };
      if (auto) patch.columns = mergeColumns(columns, found);
      onPatchProps?.(patch);

      setSync({
        ok: true,
        message:
          `${at} · ` +
          (auto
            ? `${found.length} columns bound`
            : `${found.length} columns found — your column setup was kept`),
        rows: preview,
        columns: found,
        path,
        auto,
      });
    } catch (e) {
      if (alive.current) setSync({ ok: false, message: e?.message || "Request failed" });
    } finally {
      if (alive.current) setSyncing(false);
    }
  };

  /**
   * Force the response's columns onto the component, keeping whatever was
   * configured for a key that is still there.
   */
  const applyColumns = () => {
    if (!sync?.columns?.length) return;
    onPatchProps?.({ columns: mergeColumns(columns, sync.columns) });
    setSync((x) => (x ? { ...x, auto: true, message: `${x.columns.length} columns bound` } : x));
  };

  /** Drop the preview so the canvas goes back to its placeholder content. */
  const clearPreview = () => {
    onPatchProps?.(mode === "options" ? { previewOptions: [] } : { previewRows: [] });
    setSync(null);
  };

  /* ------------------------------------------------------------ payload */

  const [newKey, setNewKey] = useState("");
  const [newKeyIn, setNewKeyIn] = useState("Body");
  const [showPayload, setShowPayload] = useState(false);

  const setParam = useCallback(
    (name, v) => set({ params: (cfg.params || []).map((x) => (x.name === name ? { ...x, value: v } : x)) }),
    [cfg.params, set],
  );

  /**
   * A key's own type, overriding what the catalog guessed — the same field
   * `coerceParam` (utils/apiConfig) already reads to convert the value on the
   * way out, so picking "number" here is what makes `"0"` go out as `0`.
   */
  const setParamType = useCallback(
    (name, t) => set({ params: (cfg.params || []).map((x) => (x.name === name ? { ...x, type: t } : x)) }),
    [cfg.params, set],
  );

  /**
   * The rule list a parameter picks its value from — see `valueRules` in
   * utils/apiConfig. Held in its own key rather than in `value`, because a
   * parameter whose value genuinely IS an array is a real thing.
   */
  const setParamRules = useCallback(
    (name, rules) =>
      set({
        params: (cfg.params || []).map((x) =>
          x.name === name ? { ...x, valueRules: rules && rules.length ? rules : undefined } : x,
        ),
      }),
    [cfg.params, set],
  );

  /**
   * The repeat a parameter is built by — see `itemTemplate` in
   * utils/apiConfig. Its own key, like `valueRules`, so turning it off leaves
   * whatever single value was there before it.
   */
  const setParamItems = useCallback(
    (name, tpl) =>
      set({ params: (cfg.params || []).map((x) => (x.name === name ? { ...x, itemTemplate: tpl || undefined } : x)) }),
    [cfg.params, set],
  );

  /**
   * A record's keys, like `valueRules` and `itemTemplate`: its own key, so
   * turning it off leaves whatever JSON was typed before it untouched.
   */
  const setParamObject = useCallback(
    (name, fields) =>
      set({
        params: (cfg.params || []).map((x) =>
          x.name === name ? { ...x, objectFields: fields && fields.length ? fields : undefined } : x,
        ),
      }),
    [cfg.params, set],
  );

  const removeParam = useCallback(
    (name) => set({ params: (cfg.params || []).filter((x) => x.name !== name) }),
    [cfg.params, set],
  );

  /**
   * Add a key the catalog never described.
   *
   * The API Explorer sees a DTO one level deep, so an endpoint taking a model
   * often arrives with nothing usable in its body. Rather than making that a
   * raw-JSON-only case, any key can be added here and mapped like the rest.
   */
  const addParam = useCallback(() => {
    const name = newKey.trim();
    if (!name) return;
    if ((cfg.params || []).some((x) => x.name.toLowerCase() === name.toLowerCase())) return;
    set({ params: [...(cfg.params || []), { name, source: newKeyIn, type: "string", value: "", custom: true }] });
    setNewKey("");
  }, [newKey, newKeyIn, cfg.params, set]);

  /**
   * Trade a described object for one mappable row per field it holds.
   *
   * A field that is ITSELF a model keeps its own `fields`. Without them the
   * row was a dead end — no "N fields" button, nothing to fill it by key with
   * — so a nested model (SaveIPDAdmission's PIP, PMH, doctors) had to be typed
   * out as JSON from memory, and a key remembered wrong is a key the server
   * never sees. The sample comes along for the same reason it does at the top
   * level: it shows the shape expected.
   */
  const expand = useCallback(
    (parent) => {
      const taken = new Set((cfg.params || []).map((x) => String(x.name).toLowerCase()));
      // What the record rows already bind rides along — expanding is a change
      // of layout, not a reason to map every key a second time.
      const bound = new Map(
        (Array.isArray(parent.objectFields) ? parent.objectFields : [])
          .filter((r) => r?.key)
          .map((r) => [String(r.key).toLowerCase(), r]),
      );
      const added = (parent.fields || [])
        .filter((f) => f?.name && !taken.has(String(f.name).toLowerCase()))
        .map((f) => {
          const row = bound.get(String(f.name).toLowerCase());
          const recordRows = Array.isArray(row?.record) && row.record.length ? row.record : undefined;
          const itemTpl = row?.items && typeof row.items === "object" ? row.items : undefined;
          return {
            name: f.name,
            source: parent.source === "Query" ? "Query" : "Body",
            type: f.type || "string",
            required: !!f.required,
            value: row && typeof row.value === "string" && row.value !== "" ? row.value : sampleToValue(f.sample),
            fallback: row?.fallback,
            sendAs: row?.sendAs,
            objectFields: itemTpl ? undefined : recordRows,
            itemTemplate: itemTpl,
            fields: f.fields?.length ? f.fields : undefined,
            custom: true,
          };
        });
      if (!added.length) return;
      // The object itself goes: its fields ARE the payload now.
      set({ params: [...(cfg.params || []).filter((x) => x.name !== parent.name), ...added] });
    },
    [cfg.params, set],
  );

  /**
   * The request this mapping produces, built by the same function that will
   * build it at runtime — so the preview cannot drift from what is sent.
   * Each mapped control stands in for itself, which is what makes it readable:
   * you see WHICH field lands on which key, not a row of blanks.
   */
  const payload = useMemo(() => {
    if (!isApiConfigReady(cfg)) return null;
    const values = {};
    (formFields || []).forEach((f) => {
      values[f] = `<${f}>`;
    });
    // The dialog's fields stand in for themselves too: `<title.value>`.
    const modal = {};
    (dialog?.fields || []).forEach((f) => {
      const parts = f.path.split(".");
      let at = modal;
      parts.slice(0, -1).forEach((p) => {
        at[p] = at[p] && typeof at[p] === "object" ? at[p] : {};
        at = at[p];
      });
      at[parts[parts.length - 1]] = `<${f.path}>`;
    });
    try {
      const { url, config } = buildApiRequest(cfg, {
        values,
        modal,
        user: { centreId: "<centreId>", id: "<employeeId>" },
        row: { Id: "<row.Id>" },
      });
      const body = config.data && Object.keys(config.data).length ? config.data : null;
      const qs = url.includes("?") ? url.split("?")[1].split("&").length : 0;
      const text = `${(cfg.method || "GET").toUpperCase()} ${url}` + (body ? `\n\n${JSON.stringify(body, null, 1)}` : "");
      return { text, count: (body ? Object.keys(body).length : 0) + qs };
    } catch (e) {
      return null;
    }
  }, [cfg, formFields, dialog]);

  /* -------------------------------------------------------------- render */

  // UserValidateID and friends are appended by makeApiRequest from the signed-in
  // user's localStorage record. Filtered again here so a screen saved before
  // that rule existed does not show a stale token in the inspector.
  const params = (cfg.params || []).filter((p) => !isAutoParam(p.name));
  const bodyParams = params.filter((p) => p.source === "Body" || p.source === "Form");
  const wantsBody = cfg.method !== "GET" && cfg.method !== "DELETE";

  return (
    <div className="dsb-apipick">
      {catalogError ? (
        <div className="dsbi-jsonerr">
          {catalogError}. The endpoint can still be typed in by hand below.
        </div>
      ) : null}

      <Row label="Controller">
        <Combo
          value={cfg.controller}
          onChange={(v) => onChange({ ...cfg, controller: v, endpoint: "", params: [] })}
          options={controllerOptions}
          placeholder={loading === "controllers" ? "Loading…" : "Select a controller"}
          searchPlaceholder="Search controllers…"
          emptyText="No controller matches"
        />
      </Row>

      <Row label="Endpoint">
        <Combo
          value={selectedEndpoint?.id || ""}
          onChange={pickEndpoint}
          options={endpointOptions}
          disabled={!cfg.controller}
          placeholder={loading === "endpoints" ? "Loading…" : cfg.controller ? "Select an endpoint" : "Pick a controller first"}
          searchPlaceholder="Search endpoints…"
          emptyText="No endpoint matches"
        />
      </Row>

      <Row label="Method">
        <SelectBox value={cfg.method} onChange={(v) => set({ method: v })} options={METHODS} />
      </Row>

      {isCall && !wantsRows ? null : (
        <Row label="Rows at" hint="Where the rows sit in the response">
          <DebouncedInput value={cfg.responsePath} onChange={(v) => set({ responsePath: v })} placeholder="data" />
        </Row>
      )}

      <Row label="Route" hint="Relative to the app's API base URL">
        <DebouncedInput value={cfg.endpoint} onChange={(v) => set({ endpoint: v })} placeholder="Controller/Action" />
      </Row>

      {isCall ? null : (
        <Row label="Call on page load">
          <Toggle value={cfg.autoLoad !== false} onChange={(v) => set({ autoLoad: v })} />
        </Row>
      )}

      {isApiConfigReady(cfg) ? (
        <div className="dsbi-sub">
          <div className="dsbi-sub-title">
            Payload
            <span className="dsbi-badge">{params.length}</span>
          </div>
          <p className="dsbi-note">
            Pre-filled with the server's sample values. Use <code>{"{{values.field}}"}</code> to read
            {isCall ? " what the user typed into a control on the screen" : " a filter on the screen"}.
            <br />
            <b>UserValidateID</b> is added automatically for the signed-in user — it is not listed here.
          </p>
          {/* The names belong to the screen, so they are read off it rather
              than remembered — see ScopeBrowser. In the full-screen panel the
              side rail is already showing them, and twice is once too many. */}
          {inRail ? null : <ScopeBrowser />}
          {dialog?.fields?.length ? (
            <div className="dsbi-dialogfill">
              <p className="dsbi-note">
                <code>{"{{modal.field}}"}</code> is what <b>{dialog.label}</b> reported — under <b>Map…</b> as{" "}
                <i>field — {dialog.label}</i>.
              </p>
              <Tap
                className="tone-primary dsbi-mini is-primary"
                title="Point every key that has no {{…}} yet at the dialog field with the same meaning"
                onClick={fillFromDialog}
              >
                <Icon name="Wand2" size={11} /> Fill from {dialog.label}
              </Tap>
              {filledNote ? <div className="dsbi-hint">{filledNote}</div> : null}
            </div>
          ) : null}
          {params.map((prm) => (
            <div key={prm.name} className="dsbi-param">
              <span className="dsbi-param-h">
                <b className={prm.unwrap ? "dsbi-param-unwrapped" : undefined}>{prm.name}</b>
                <em>{prm.source}</em>
                <SelectBox
                  className="dsbi-paramtype"
                  value={prm.type || "string"}
                  onChange={(v) => setParamType(prm.name, v)}
                  options={PARAM_TYPES}
                  allowEmpty={false}
                />
                {prm.required ? <em className="is-req">required</em> : null}
                {/* The server's binder may name the DTO (`obj`) while the
                    endpoint wants the record itself as the body. */}
                {wantsBody && (prm.source === "Body" || prm.source === "Form") ? (
                  <Tap
                    className={`dsbi-param-x dsbi-unwrap ${prm.unwrap ? "is-on" : ""}`}
                    aria-pressed={!!prm.unwrap}
                    title={
                      prm.unwrap
                        ? `Sent without the "${prm.name}" key — its contents are the body. Click to wrap it again.`
                        : `Send without the "${prm.name}" key: { ${prm.name}: {…} } goes out as {…}`
                    }
                    onClick={() =>
                      set({
                        params: (cfg.params || []).map((x) =>
                          x.name === prm.name ? { ...x, unwrap: x.unwrap ? undefined : true } : x,
                        ),
                      })
                    }
                  >
                    <Icon name={prm.unwrap ? "PackageCheck" : "Package"} size={10} />
                    {prm.unwrap ? "No wrapper" : `Remove "${prm.name}" key`}
                  </Tap>
                ) : null}
                {prm.fields?.length ? (
                  <Tap className="tone-record dsbi-param-x" title="Map this object's own fields instead" onClick={() => expand(prm)}>
                    <Icon name="Plus" size={10} /> {prm.fields.length} fields
                  </Tap>
                ) : null}
                {prm.custom ? (
                  <Tap className="tone-danger dsbi-param-x is-danger" title="Remove this key" onClick={() => removeParam(prm.name)}>
                    <Icon name="Trash2" size={10} />
                  </Tap>
                ) : null}
              </span>
              <ParamValue
                param={prm}
                onValue={(v) => setParam(prm.name, v)}
                onRules={(r) => setParamRules(prm.name, r)}
                onItems={(t) => setParamItems(prm.name, t)}
                onObject={(f) => setParamObject(prm.name, f)}
                onSendAs={(v) =>
                  set({ params: (cfg.params || []).map((x) => (x.name === prm.name ? { ...x, sendAs: v } : x)) })
                }
                onFallback={(v) =>
                  set({ params: (cfg.params || []).map((x) => (x.name === prm.name ? { ...x, fallback: v } : x)) })
                }
                formFields={formFields}
                rowFields={rowFields}
                rowSource={rowSource}
              />
            </div>
          ))}

          <div className="dsbi-param-add">
            <DebouncedInput value={newKey} onChange={setNewKey} placeholder="Another payload key" />
            <SelectBox value={newKeyIn} onChange={setNewKeyIn} options={KEY_TARGETS} />
            <Tap className="tone-add dsbi-mini" disabled={!newKey.trim()} onClick={addParam}>
              <Icon name="Plus" size={11} /> Add
            </Tap>
          </div>
        </div>
      ) : null}

      {payload ? (
        <div className="dsbi-sub">
          <Tap className="dsbi-sub-title is-btn" onClick={() => setShowPayload((x) => !x)}>
            <Icon name={showPayload ? "ChevronDown" : "ChevronRight"} size={12} />
            <span>What gets sent</span>
            <span className="dsbi-badge">{payload.count}</span>
          </Tap>
          {showPayload ? (
            <>
              <p className="dsbi-note">
                The request as it will go out, with each control standing in for what the user will
                have typed into it.
              </p>
              {wantsBody && cfg.bodyJson && cfg.bodyJson.trim() ? (
                <div className="dsbi-jsonerr">
                  <b>Raw JSON body</b> is filled in, so it is sent instead of the payload keys above — their
                  mappings and data types are ignored. Clear it to send the keys as configured.
                </div>
              ) : null}
              <pre className="dsbi-preview">{payload.text}</pre>
            </>
          ) : null}
        </div>
      ) : null}

      {wantsBody ? (
        <div className="dsbi-sub">
          <Tap className="dsbi-sub-title is-btn" onClick={() => setShowBody((x) => !x)}>
            <Icon name={showBody ? "ChevronDown" : "ChevronRight"} size={12} />
            <span>Raw JSON body</span>
            {cfg.bodyJson ? <span className="dsbi-badge">set</span> : null}
          </Tap>
          {showBody ? (
            <>
              <DebouncedInput
                multiline
                rows={6}
                value={cfg.bodyJson || ""}
                spellCheck={false}
                placeholder={'{ "PatientID": "{{values.uhid}}" }'}
                onChange={(v) => set({ bodyJson: v })}
              />
              <p className="dsbi-note">
                {bodyParams.length
                  ? "Overrides the body parameters above when it is filled in."
                  : "Sent as the request body. Templates are resolved before the call."}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="dsbi-sub">
        <Tap className="dsbi-sub-title is-btn" onClick={() => setShowTest((x) => !x)}>
          <Icon name={showTest ? "ChevronDown" : "ChevronRight"} size={12} />
          <span>Test payload</span>
          {cfg.testBodyJson ? <span className="dsbi-badge">set</span> : null}
        </Tap>
        {showTest ? (
          <>
            <DebouncedInput
              multiline
              rows={6}
              value={cfg.testBodyJson || ""}
              spellCheck={false}
              placeholder={'{ "CentreID": 1, "FromDate": "2026-09-01", "IsComplementary": 0 }'}
              onChange={(v) => set({ testBodyJson: v })}
            />
            <p className="dsbi-note">
              Used by <b>Test call</b> only, never by the rendered screen. The real payload above is
              full of <code>{"{{values.x}}"}</code> templates that resolve to nothing while the form is
              empty, so a test would come back with no records. Put real ids here to get rows back
              {testError ? "" : " and bind the columns to them"}.
            </p>
            {testError ? <div className="dsbi-jsonerr">{testError}</div> : null}
          </>
        ) : null}
      </div>

      <div className="dsbi-syncbar">
        <Tap
          className="tone-primary dsbi-mini is-primary"
          disabled={!isApiConfigReady(cfg) || syncing}
          onClick={runSync}
          title={isCall ? "Run this call now, exactly as the button will" : "Call the endpoint now and read its columns"}
        >
          <Icon name={syncing ? "Loader" : "RefreshCw"} size={12} />
          {syncing ? "Calling…" : isCall ? "Test call" : "Sync"}
        </Tap>
        {sync?.ok && !sync.auto && binds ? (
          <Tap
            className="tone-info dsbi-mini"
            onClick={applyColumns}
            title="Replace the grid's columns with the response's, keeping what you configured for keys it still returns"
          >
            Use {sync.columns.length} columns
          </Tap>
        ) : null}
        {sync?.ok && binds ? (
          <Tap className="tone-mode dsbi-mini" onClick={clearPreview} title="Stop showing this data on the canvas">
            Clear preview
          </Tap>
        ) : null}
      </div>

      {sync ? (
        <div className={sync.ok ? "dsbi-syncok" : "dsbi-jsonerr"}>{sync.message}</div>
      ) : null}

      {sync?.ok ? (
        <>
          <p className="dsbi-note">
            {!binds
              ? isCall
                ? "What the server sent back. Nothing on the canvas changed — this call only runs when the action fires."
                : "The first rows this source returns. Components bound to it read the same data."
              : mode === "options"
                ? "Showing this data on the canvas. The rendered screen calls the endpoint for itself, and again whenever the field it depends on changes."
                : "Showing this data on the canvas. The rendered screen calls the endpoint for itself."}
          </p>
          <pre className="dsbi-preview">{JSON.stringify(sync.rows.slice(0, 2), null, 1)}</pre>
        </>
      ) : null}
    </div>
  );
}
