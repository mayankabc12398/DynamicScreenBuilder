/**
 * Data-display registry entries — table/card grid, KPI cards, tabs, chips,
 * tiles, vitals, modal, drawer, tooltip and toast.
 *
 * The DataTable is the centrepiece: one column configuration, two renderings
 * (Table View and Card View), switchable by prop AND by a runtime toggle.
 */
import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProjectHeading from "@app/components/UI/Heading";
import ProjectModal from "@app/components/modalComponent/Modal";
import ProjectOverLay from "@app/components/modalComponent/OverLay";
import SaveButton from "@app/components/UI/SaveButton";
import CancelButton from "@app/components/UI/CancelButton";
import {
  ALIGN_OPTIONS,
  APP_BTN,
  APP_BTN_CANCEL,
  btnClass,
  clampProps,
  EmptyState,
  filterOptionRows,
  GROUPS,
  labelForValue,
  Icon,
  readingTrips,
  resolveDynamicColor,
  Skeleton,
  TruncatedText,
  useBodyFlag,
  useBodyScrollLock,
  useEscapeKey,
  VITAL_OPS,
  VITAL_RANGE_OPS,
  p,
} from "./shared";
import moment from "moment";
import { AutoComplete } from "primereact/autocomplete";
import { conditionsHold, evalCondition, formatValue, getPath, hasTemplate, interpolate, interpolateDeep, searchRows, whenPasses } from "../utils/expressions";
import { statusIcon, suggestIcon, TONE_COLORS } from "../utils/iconSuggest";
import { humanizeKey, recordFieldsOf } from "../utils/rowContext";
import { typographyClass } from "../utils/typography";
import { colorStyle, resolveChipColor, resolveColor } from "../utils/colorRules";
import {
  createApiConfig,
  deriveColumns,
  buildApiRequest,
  isApiConfigReady,
  nodeIdFromSource,
  nodeSourceId,
  normalizeApiConfig,
  pluckRows,
} from "../utils/apiConfig";
import { localRowsOf, rowsVarPath, screenVarOptions, varRows } from "../utils/gridRows";
import { CardHeadSlot } from "../runtime/cardHeadSlot";
import AppHeading from "./appHeading";
import { useMenuBreadcrumb } from "../utils/breadcrumb";
import { resolveTokens, tokensToCssVars } from "../theme/tokens";
import { formGridVars } from "./layout";
import { flatten } from "../utils/tree";
import { validateValue } from "../utils/validation";
// Standalone builder: hospital frame menu replaced by stubs (src/sb/stubs).
import EmergencySeeMoreList from "@app/sb/stubs/EmergencySeeMoreList";
import SlideScreen from "@app/components/front-office/SlideScreen";
import NO_IMAGE from "@app/assets/image/avatar.gif";
import SeeMoreSlideScreen from "@app/components/UI/SeeMoreSlideScreen";
import { frameMenuRecord, groupFrameMenu, useFrameMenu } from "../utils/frameMenu";
import { tr, useScreenDir } from "../utils/i18n";
import { appModal, APP_MODAL_OPTIONS, customModalOptions } from "../utils/appModals";
import { propNamesOf, standInProps } from "../utils/componentProps";
import { toast } from "react-toastify";
import { useRuntime } from "../runtime/RuntimeContext";
import { EMERGENCY_FRAME_COMPONENTS } from "@app/sb/stubs/EmergencySeeMoreList";
import EMGPersonalDetailsOfPatient from "@app/sb/stubs/EMGPersonalDetailsOfPatient";

/* ------------------------------------------------------------ sample data */

const SAMPLE_BY_TYPE = {
  text: ["Ramesh Kumar", "Sita Devi", "Arjun Mehta", "Fatima Noor", "John Peter", "Anita Rao"],
  number: [12, 48, 7, 130, 22, 5],
  currency: [1200, 4800, 700, 13000, 2200, 500],
  date: ["2026-08-31", "2026-08-30", "2026-08-29", "2026-08-28", "2026-08-27", "2026-08-26"],
  datetime: ["2026-08-31T09:15", "2026-08-31T11:40", "2026-08-30T18:05", "2026-08-30T07:20", "2026-08-29T16:00", "2026-08-29T08:45"],
  chip: ["Urgent", "Normal", "Currently Admitted", "Released Patient", "Urgent", "Shifted To Ipd"],
};

/**
 * Placeholder values picked from the column NAME, not just its type.
 *
 * Without this every text column repeats the same pool, so a UHID column shows
 * patient names and the canvas stops looking like the real screen. Order
 * matters — the first pattern that matches a key wins.
 */
const SAMPLE_BY_KEY = [
  [/(uhid|mrn|mrno|regno|registrationno)/, ["UH-100234", "UH-100235", "UH-100241", "UH-100258", "UH-100262", "UH-100279"]],
  [/(mobile|phone|contact|whatsapp)/, ["98765 43210", "99801 22114", "97110 55893", "90045 71230", "88267 44019", "70123 90887"]],
  [/(email|mail)/, ["ramesh@mail.com", "sita@mail.com", "arjun@mail.com", "fatima@mail.com", "john@mail.com", "anita@mail.com"]],
  [/(doctor|consultant|physician|refby|referredby)/, ["Dr. A. Sharma", "Dr. M. Iyer", "Dr. K. Bose", "Dr. R. Nair", "Dr. S. Gupta", "Dr. P. Rao"]],
  [/(dept|department|speciality|specialty|unit)/, ["Emergency", "Cardiology", "Orthopaedics", "Neurology", "Emergency", "General Medicine"]],
  [/(ward|bed|room|cabin)/, ["ICU-04", "GW-112", "ICU-01", "PW-207", "CCU-02", "GW-118"]],
  [/(gender|sex)/, ["Male", "Female", "Male", "Female", "Male", "Female"]],
  [/(age)/, [34, 58, 27, 41, 66, 19]],
  [/(bloodgroup|blood)/, ["O+", "B+", "A+", "AB-", "O-", "B-"]],
  [/(amount|charge|bill|fee|payable|paid|balance|total)/, SAMPLE_BY_TYPE.currency],
  [/(visit|admission|discharge|reg).*(date|on)|(date|dob)/, SAMPLE_BY_TYPE.date],
  [/(status|state|priority|triage)/, SAMPLE_BY_TYPE.chip],
  [/(count|qty|quantity|no|number|days)$/, SAMPLE_BY_TYPE.number],
];

/** Which pool a column draws from: an explicit type first, then its name. */
function samplePool(column) {
  const type = column?.type || "text";
  if (type !== "text" && SAMPLE_BY_TYPE[type]) return SAMPLE_BY_TYPE[type];
  const key = String(column?.key || "").toLowerCase();
  const hit = SAMPLE_BY_KEY.find(([re]) => re.test(key));
  return hit ? hit[1] : SAMPLE_BY_TYPE.text;
}

/**
 * Design-time placeholder rows so a grid never looks empty on the canvas.
 * Each column is offset by its position so rows don't read as copies.
 */
export function makeSampleRows(columns, count = 6) {
  // Placeholder rows exist to show what the columns will look like. With no
  // columns there is nothing to show, and the `id` every row carries would
  // otherwise be rendered as a column of its own.
  if (!(columns || []).some((c) => c && c.key)) return [];
  return Array.from({ length: count }).map((_, i) => {
    const row = { id: i + 1 };
    (columns || []).forEach((c, ci) => {
      if (!c || !c.key) return;
      const pool = samplePool(c);
      row[c.key] = pool[(i + ci) % pool.length];
    });
    return row;
  });
}

/** Same rows, flagged so the canvas can tell "nothing configured yet" apart. */
function makePlaceholderRows(columns) {
  return makeSampleRows(columns).map((r) => ({ ...r, __sample: true }));
}

/* ------------------------------------------------------------- DataTable */

/**
 * A new grid starts with no columns and no rows.
 *
 * It used to arrive carrying three patient columns and six invented patients.
 * That is somebody else's screen: every grid then had to be emptied before it
 * could be filled, and a grid nobody had got to yet looked finished. Blank is
 * honest, and the two ways to fill it — Sync an endpoint, or add columns by
 * hand — both work from here.
 */
const DEFAULT_COLUMNS = [];

/**
 * Where a grid's rows come from.
 *
 *   dataMode "static"  rows live in the screen JSON (props.staticRows) and are
 *                      edited in the inspector. Nothing is fetched. This is the
 *                      default, so a new table is usable immediately and the
 *                      screen can ship before any endpoint exists.
 *   dataMode "api"     rows come from the screen's data source (Data tab). The
 *                      static rows stay in the JSON and are shown on the canvas
 *                      as the design-time preview, so switching back and forth
 *                      loses nothing.
 *
 * Either way the rest of the table — columns, sorting, colour rules, card view
 * — is identical, so moving from hard-coded to live data is a one-field change.
 */
/**
 * One empty list, shared.
 *
 * A fresh `[]` per call looks harmless and is not: `rows` feeds a useMemo that
 * feeds an effect that writes runtime state, so a new array on every render is
 * a render loop. An empty grid is the common case (nothing searched yet), which
 * is exactly when it bites.
 */
const NO_ROWS = [];

/** "Rows come from" — a screen variable: the option, and its settings. */
export const VARS_MODE_OPTION = { value: "vars", label: "Screen variable (vars)" };
export function rowsVarProps(group) {
  return [
    {
      key: "rowsVar",
      label: "Variable",
      type: "select",
      group,
      allowCustom: true,
      searchable: true,
      placeholder: "Pick or type a variable",
      emptyText: "No variable is set on this screen yet — type its name",
      when: (pr) => pr.dataMode === "vars",
      options: (ctx) => screenVarOptions(ctx?.nodes, ctx?.props?.rowsVar),
      hint: "A list kept in {{vars.<name>}}. A path reaches inside it — estimates.data. A whole response works too: its data / Table list is read.",
    },
    {
      key: "varsNote",
      label: "How this is filled",
      type: "note",
      group,
      when: (pr) => pr.dataMode === "vars",
      text: (ctx) => {
        const name = rowsVarPath(ctx?.props?.rowsVar);
        const head = name.split(".")[0];
        if (!name) {
          return "Pick the variable above. To fill one: select a control (a dropdown, a button), open Events → onChange / onClick, add Call API and set \u201cSave response in variable\u201d.";
        }
        const known = screenVarOptions(ctx?.nodes).find((o) => o.value === head);
        return known
          ? `Shows {{vars.${name}}} — ${known.label.split("·").slice(1).join("·").trim()}. Each time it is set again the rows are redrawn.`
          : `Nothing on this screen sets {{vars.${head}}} yet. Add a Call API with \u201cSave response in variable\u201d = ${head}, or a Set variable action.`;
      },
    },
  ];
}

/** Same rows, in the same order — reference equality, no deep walk. */
function sameRows(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

export function resolveRows(node, props, rt) {
  // Two ways to be dynamic: the component's own endpoint (picked from the
  // server's catalog, the usual case) or a screen-level data source shared by
  // several components. Both leave rows in rt.data — only the id differs.
  //
  // A third way arrived with the "put the rows into" action: a button pushes
  // rows under this node's own id. That only counts in "action" mode — asked
  // for explicitly — so an incidental leftover under this id can never
  // out-rank a shared source the designer actually configured.
  const filledByAction = props.dataMode === "action";
  const ownApi = isApiConfigReady(props.apiConfig) || filledByAction ? nodeSourceId(node?.id) : "";
  const sourceId = ownApi || node?.binding?.sourceId || props.dataSourceId || "";
  const ds = rt?.data?.[sourceId];
  const live = Array.isArray(ds?.rows) ? ds.rows : NO_ROWS;
  const design = !!rt?.design;
  const cols = props.columns || [];
  const stat = Array.isArray(props.staticRows) ? props.staticRows : [];
  // "action" is live data like "api" is; it just arrives from a button
  // rather than from this component's own call.
  const mode = props.dataMode || (sourceId ? "api" : "static");

  // A row added or removed on the screen (Add row / Remove row actions) over
  // static rows or a shared source. Dropped by itself once the list under it
  // is replaced — see utils/gridRows.
  const local = design ? null : localRowsOf(node, rt?.data, rt?.vars);
  if (local) return { rows: local.rows, loading: false, error: null, sourceId, local: local.seq || 1, focus: local.focus };
  if (!design && ds?.local) {
    return { rows: live, loading: !!ds.loading, error: ds.error || null, sourceId, local: ds.seq || 1, focus: ds.focus };
  }

  // Rows a Call API or Set variable left in {{vars.<name>}} — read, never
  // fetched. On the canvas the last Sync sample stands in, as for "api".
  if (mode === "vars") {
    if (!design) return { rows: varRows(node, rt?.vars, props), loading: false, error: null, sourceId: "" };
    const preview = Array.isArray(props.previewRows) ? props.previewRows : [];
    if (preview.length) return { rows: preview, loading: false, error: null, sourceId: "" };
    return { rows: stat.length ? stat : makePlaceholderRows(cols), loading: false, error: null, sourceId: "" };
  }

  if (mode === "static") {
    if (stat.length) return { rows: stat, loading: false, error: null, sourceId: "" };
    // Nothing typed in yet — keep the canvas readable, but render empty live.
    return { rows: design ? makePlaceholderRows(cols) : NO_ROWS, loading: false, error: null, sourceId: "" };
  }
  if (design) {
    // On the canvas, show what Sync last returned. That is real data from the
    // real endpoint, so the columns, colour rules and card layout can be judged
    // against it — without the canvas ever calling anything itself.
    const preview = Array.isArray(props.previewRows) ? props.previewRows : [];
    if (preview.length) return { rows: preview, loading: false, error: null, sourceId };
    return { rows: stat.length ? stat : makePlaceholderRows(cols), loading: false, error: null, sourceId };
  }
  return { rows: live, loading: !!ds?.loading, error: ds?.error || null, sourceId };
}

/**
 * The interactive shell around a cell.
 *
 * `type` says how a value is *formatted* (text, currency, date, chip…);
 * `control` says whether it is also something you can *use*. Keeping them
 * separate is what lets a currency column be a link, or a date column a button,
 * without inventing a type for every combination.
 */
/**
 * Is this row ticked in this checkbox column?
 *
 * The column's own data is the starting point — an endpoint that returns
 * IsAllowed: true should arrive ticked. Once anything has been clicked, the
 * runtime's map governs, so a row can be untied over a truthy value.
 */
/**
 * What is wrong with how this table tells its rows apart, read off the sample
 * rows a Sync or Test call left — or "" when nothing is. Only asked when it
 * matters: a tick, an edit or a selection is remembered against the key.
 */
function rowKeyProblem(pr) {
  const rows = [...(pr?.previewRows || []), ...(pr?.staticRows || [])].filter((r) => r && typeof r === "object");
  const cols = Array.isArray(pr?.columns) ? pr.columns : [];
  const keyed = pr?.selectable || cols.some((c) => c?.control === "checkbox" || EDIT_CONTROLS.includes(c?.control));
  if (!keyed || rows.length < 2) return "";
  const field = pr?.rowKeyField;
  const blank = (k) => k === undefined || k === null || k === "";
  const keys = rows.map((r) => (field ? getPath(r, field) : r.id ?? r.Id ?? r.ID));
  if (!field && keys.every(blank)) {
    return "No Row key field, and the rows carry no id — a tick is remembered by position, so a sort or a search can move it to another patient. Pick the field that identifies one row (UHID, a receipt or transaction number).";
  }
  const vals = keys.filter((k) => !blank(k)).map(String);
  const repeats = vals.length - new Set(vals).size;
  if (repeats > 0) {
    return `${field ? `"${field}"` : "The rows' id"} repeats in the sample rows (${repeats} repeat${repeats === 1 ? "" : "s"}), so it does not name one row. Repeats are now told apart by position, but a sort can still swap a tick between them — pick a field that is unique per row.`;
  }
  return "";
}

export function isChecked(ticks, rowId, row, column) {
  if (ticks && Object.prototype.hasOwnProperty.call(ticks, rowId)) return !!ticks[rowId];
  const col = typeof column === "string" ? { key: column } : column || {};
  const v = row?.[col.key];
  // The endpoint did not send this field at all. A column default is how a
  // screen says what it should start as — a logo box that begins ticked,
  // because the page it replaces begins ticked and prints a logo.
  if (v === undefined && col.defaultValue !== undefined) {
    return col.defaultValue === true || col.defaultValue === 1 || col.defaultValue === "1" || col.defaultValue === "true";
  }
  return v === true || v === 1 || v === "1" || v === "true" || v === "True";
}

/**
 * What a click on a cell control runs.
 *
 * A column's own `onClick` list wins. Without one it falls back to the table's
 * onRowAction event, so every screen built before columns had their own
 * actions behaves exactly as it did — and a table with six icon columns no
 * longer needs one handler that branches on which column fired.
 */
/**
 * The table's "Remember clicked row as" — any click on a row (the row, a link,
 * an icon) keeps that record as {{vars.<name>}} for the whole screen. Stored
 * before the click's own actions run, so they can read it too.
 */
function rememberRow(rt, node, row) {
  const name = String(node?.props?.rowVar || "").trim();
  if (!name || rt?.design) return;
  rt?.setVar?.(name, row ?? null);
}

/**
 * True while the browser window is phone-width — under the Tablet breakpoint's
 * 640px. The live route renders every screen at "desktop", so a real phone is
 * only known by the window, not by rt.breakpoint.
 */
const PHONE_QUERY = "(max-width: 639.98px)";
function usePhoneViewport() {
  const mql = typeof window !== "undefined" && window.matchMedia ? window.matchMedia(PHONE_QUERY) : null;
  const [narrow, setNarrow] = useState(() => !!mql?.matches);
  useEffect(() => {
    if (!mql) return undefined;
    const on = () => setNarrow(mql.matches);
    on();
    mql.addEventListener?.("change", on);
    return () => mql.removeEventListener?.("change", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return narrow;
}

function cellClick(rt, node, column, row, extra = {}) {
  rememberRow(rt, node, row);
  const own = column?.onClick;
  if (Array.isArray(own) && own.length) {
    rt?.runActions?.(own, { row, column: column.key, node, ...extra });
    return;
  }
  rt?.runEvent(node, "onRowAction", { row, column: column.key, ...extra });
}

/**
 * The "Edit button" control: the Fill form action, configured on the column
 * itself, then the column's own On click (if any) as the rest of the chain.
 *
 * It is the same `fillForm` the Events tab offers — one implementation — so a
 * screen wired the old way (an icon plus onRowAction) and one using this
 * control fill the form identically.
 */
function editRowClick(rt, node, column, row) {
  rememberRow(rt, node, row);
  const fill = {
    type: "fillForm",
    within: column.fillWithin || undefined,
    editVar: column.editVar || undefined,
    map: column.fillMap,
    skip: column.fillSkip,
    onlyMapped: !!column.fillOnlyMapped,
  };
  const after = Array.isArray(column.onClick) ? column.onClick : [];
  rt?.runActions?.([fill, ...after], { row, column: column.key, node });
}

/** Cell controls that hold a value of their own. */
export const EDIT_CONTROLS = ["text", "number", "date", "select", "textarea", "autocomplete"];

/** A rule value typed in the inspector, or undefined when the box was left blank. */
const ruleNum = (v) => (v === undefined || v === null || String(v).trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v));

/**
 * The validation rules of one editable column, in the shape validateValue reads.
 *
 * Opt-in: a column with no `validation` (every column saved before this
 * existed) gets null and is never checked, so the browser-only Min / Max /
 * Max length it already had keep meaning exactly what they meant. A number
 * column's Min / Max become rules only when "Block values outside Min / Max"
 * is switched on.
 */
export function cellRulesOf(column, bounds = null) {
  const v = column?.validation;
  if (!v || typeof v !== "object" || !EDIT_CONTROLS.includes(column.control)) return null;
  const rules = {};
  if (v.required) rules.required = true;
  const textual = column.control === "text" || column.control === "textarea" || column.control === "autocomplete";
  if (textual) {
    const minLength = ruleNum(v.minLength);
    if (minLength !== undefined && minLength > 0) rules.minLength = minLength;
    if (typeof v.regex === "string" && v.regex.trim()) rules.regex = v.regex.trim();
  }
  if (column.control === "number" && v.range) {
    const min = bounds ? bounds.min : ruleNum(column.min);
    const max = bounds ? bounds.max : ruleNum(column.max);
    if (min !== undefined) rules.min = min;
    if (max !== undefined) rules.max = max;
  }
  if (!Object.keys(rules).length) return null;
  if (typeof v.message === "string" && v.message.trim()) rules.message = v.message.trim();
  return rules;
}

/** The scope a column's row rules are read against — the same one CellControl builds. */
function cellRuleScope(row, scope) {
  const values = scope?.values && typeof scope.values === "object" ? scope.values : {};
  return { ...values, ...(scope || {}), row, ...(row || {}) };
}

/**
 * A number column's Min / Max for one row.
 *
 * Props are interpolated against the screen before any row exists, so a Max
 * of {{row.AvlQty}} arrives here already blank. The saved column still holds
 * the template, so it is read from there and filled in with this row — the
 * same way an autocomplete cell reads its endpoint. A plain number, or a
 * screen binding ({{values.x}}), comes out exactly as it did.
 */
/** The column as saved, templates intact — what the table was configured with. */
function rawColumnOf(node, column) {
  return (Array.isArray(node?.props?.columns) ? node.props.columns : []).find((c) => c && c.key === column?.key) || null;
}

/**
 * The error message for one row: the saved text filled in with that row, so
 * "Only {{row.AvlQty}} in stock" names this row's stock. Rules unchanged.
 */
export function cellRulesForRow(rules, column, node, row, scope) {
  if (!rules || !rules.message) return rules;
  const t = rawColumnOf(node, column)?.validation?.message;
  if (typeof t !== "string" || !hasTemplate(t)) return rules;
  const msg = String(interpolate(t, cellRuleScope(row, scope)) ?? "").trim();
  return { ...rules, message: msg || undefined };
}

export function cellBoundsOf(column, node, row, scope) {
  const raw = rawColumnOf(node, column);
  const sc = cellRuleScope(row, scope);
  const one = (k) => {
    const t = raw ? raw[k] : undefined;
    if (typeof t === "string" && hasTemplate(t)) return ruleNum(interpolate(t, sc));
    return ruleNum(column?.[k]);
  };
  return { min: one("min"), max: one("max") };
}

/**
 * Whether a column's rules hold for this row at all ("Validate only when").
 * No condition means always, so a column without one is checked on every row.
 */
export function cellRulesApply(column, row, scope, node = null) {
  // From the saved column when there is one: a condition value of {{row.…}}
  // was blanked with the rest of the props before any row existed.
  const raw = node ? rawColumnOf(node, column) : null;
  const when = (raw && raw.validation ? raw.validation.when : undefined) ?? column?.validation?.when;
  const live = (Array.isArray(when) ? when : when ? [when] : []).filter((c) => c && c.op);
  if (!live.length) return true;
  return conditionsHold(live, cellRuleScope(row, scope));
}

/**
 * What a cell refuses to have typed into it at all, or null.
 *
 * Separate from the rules above: a rule lets the value in and marks it red, a
 * limit never lets it in. Number: no keystroke past Max, nothing under Min
 * once the cell is left, and — when asked — no decimals. Text: only the
 * characters listed in "Allowed characters".
 */
export function cellInputLimitsOf(column, bounds = null) {
  const v = column?.validation;
  if (!v || typeof v !== "object") return null;
  if (column.control === "number" && (v.hardLimit || v.integer)) {
    return {
      min: v.hardLimit ? (bounds ? bounds.min : ruleNum(column.min)) : undefined,
      max: v.hardLimit ? (bounds ? bounds.max : ruleNum(column.max)) : undefined,
      integer: !!v.integer,
    };
  }
  if ((column.control === "text" || column.control === "textarea") && typeof v.allowChars === "string" && v.allowChars.trim()) {
    try {
      // The box holds the inside of a character class: 0-9, A-Za-z, 0-9.- …
      const body = v.allowChars.trim().replace(/^\[|\]$/g, "").replace(/\\?\]/g, "\\]");
      return { allow: new RegExp(`^[${body}]*$`) };
    } catch (e) {
      return null; // a half-typed class in the inspector must not break the screen
    }
  }
  return null;
}

/** A typed number box value, or null when the limits refuse it. */
function limitNumberDraft(raw, lim) {
  if (raw === "" || raw === "-") return lim.min !== undefined && lim.min >= 0 && raw === "-" ? null : raw;
  if (lim.integer && !/^-?\d*$/.test(raw)) return null;
  if (lim.min !== undefined && lim.min >= 0 && raw.startsWith("-")) return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  if (lim.max !== undefined && n > lim.max) return null;
  return raw;
}

/**
 * Whether a row's cell takes input at all — the same three tests CellControl
 * draws it by. A locked cell, one replaced by an "instead" text, or one hidden
 * on this row holds nothing the user can fix, so it is never failed.
 */
function cellTakesInput(column, row, scope) {
  const rowScope = cellRuleScope(row, scope);
  if (conditionsHold(column.disabledWhen, rowScope)) return false;
  if ((Array.isArray(column.insteadRules) ? column.insteadRules : []).some((r) => conditionsHold(r?.when, rowScope))) return false;
  if (conditionsHold(column.hiddenWhen, rowScope)) return false;
  return true;
}

/** What a date arriving from an endpoint might look like, for sorting. */
const SORT_DATE_IN = ["YYYY-MM-DD", "DD-MMM-YYYY", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DDTHH:mm:ss"];

/**
 * A date column's value as a number, or null when it is not a date.
 *
 * `Date.parse` alone is not enough: it reads "20-May-2026" in some engines and
 * not others, and a sort that depends on the browser is a sort that is wrong
 * somewhere. The format list is the app's own.
 */
function sortableDate(v) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  const m = moment(String(v), SORT_DATE_IN, false);
  if (m.isValid()) return m.valueOf();
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? null : t;
}

/**
 * What an editable cell currently shows.
 *
 * Same precedence as a tick: the row's own data is the starting point, and
 * once the cell has been typed in the runtime's map governs — which is what
 * lets a value be cleared over a value the API sent.
 */
export function cellValue(cells, rowId, row, column, scope) {
  if (cells && Object.prototype.hasOwnProperty.call(cells, rowId)) return cells[rowId];
  const col = typeof column === "string" ? { key: column } : column || {};
  const v = getPath(row, col.key);
  // A field the endpoint does not send but the screen needs — a print type
  // seeded from the search that found the row. Interpolated, so the default
  // can be a binding rather than only a constant.
  if (v === undefined && col.defaultValue !== undefined) {
    return typeof col.defaultValue === "string" ? interpolate(col.defaultValue, scope || {}) : col.defaultValue;
  }
  return v;
}

/**
 * A dropdown column's options: a list typed here, or a screen data source.
 *
 * The same two ways the Select control offers, minus the hook — columns are
 * resolved in a loop, so this has to be an ordinary function.
 */
export function columnOptions(column, rt, row, scope) {
  let base;
  if (column.optionsSourceId) {
    const rows = rt?.data?.[column.optionsSourceId]?.rows || [];
    base = rows.map((r) => ({
      value: r[column.optionValueField || "value"],
      label: String(r[column.optionLabelField || "label"] ?? ""),
      __row: r,
    }));
  } else {
    const raw = column.options;
    if (Array.isArray(raw)) base = raw.map((o) => (typeof o === "object" ? o : { value: o, label: String(o) }));
    else if (typeof raw === "string" && raw.trim()) {
      base = raw.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ({ value: s, label: s }));
    } else base = [];
  }
  // Which of those this row is entitled to. The page this replaces picks the
  // list per row — a bill offers sticker types a receipt does not, and a row
  // flagged as not allowing an OPD card must not be offered one. Same filter
  // shape the Select control already has, evaluated against the record.
  if (!Array.isArray(column.optionFilters) || !column.optionFilters.length) return base;
  return filterOptionRows(base, column.optionFilters, { ...(scope || {}), row, ...(row || {}) });
}

/**
 * An autocomplete cell: type, pick a suggestion, the cell keeps its value.
 *
 * Suggestions come from the column's own list / data source (filtered here, as
 * the dropdown cell does) or from an endpoint searched as you type, with the
 * typed text in "Search parameter" or anywhere as {{search}} and the row as
 * {{row.Field}}. The cell stores the picked record's value field (or its
 * label); the whole record reaches onCellChange as `record`.
 */
function AutoCompleteCell({ column, row, node, rt, scope, stored, commit, disabled, onLeave, error = null }) {
  const fromApi = column.acSource === "endpoint";
  // The endpoint as configured: columns are interpolated at render, which
  // would have turned {{search}} into "" before anything was typed.
  const rawCol = (Array.isArray(node?.props?.columns) ? node.props.columns : []).find((c) => c && c.key === column.key);
  const cfg = rawCol?.searchApi || column.searchApi;
  const ready = fromApi && isApiConfigReady(cfg);
  const labelKey = fromApi ? column.optionLabelField || "label" : "label";
  const valueKey = fromApi ? column.optionValueField || "" : "value";
  const subKey = fromApi ? column.subLabelField || "" : "";
  const list = fromApi ? [] : columnOptions(column, rt, row, scope);

  const labelOf = (rec) => {
    if (rec === null || rec === undefined) return "";
    if (typeof rec !== "object") return String(rec);
    const v = getPath(rec, labelKey);
    return v === undefined || v === null ? "" : String(v);
  };
  const valueOf = (rec) => {
    if (!rec || typeof rec !== "object") return rec ?? "";
    if (valueKey) return getPath(rec, valueKey) ?? "";
    return labelOf(rec);
  };

  // What the box reads for the stored value: a list option's label, the label
  // of the record just picked, or else the value itself.
  const lastPick = useRef(null);
  const blank = stored === undefined || stored === null || stored === "";
  let shownLabel = "";
  if (!blank) {
    const hit = list.find((o) => String(o.value) === String(stored));
    if (hit) shownLabel = hit.label;
    else if (lastPick.current && String(valueOf(lastPick.current)) === String(stored)) shownLabel = labelOf(lastPick.current);
    else shownLabel = String(stored);
  }

  const [box, setBox] = useState(shownLabel);
  const [suggestions, setSuggestions] = useState([]);
  const boxRef = useRef(box);
  boxRef.current = box;
  const seq = useRef(0);
  const picked = useRef(false);

  useEffect(() => {
    setBox(shownLabel);
  }, [shownLabel]);

  const limitTo = (rows) => {
    const n = Number(column.maxResults);
    const all = Array.isArray(rows) ? rows : [];
    return n > 0 ? all.slice(0, n) : all;
  };

  const complete = async (e) => {
    const text = String(e?.query ?? "").trim();
    const mine = ++seq.current;
    if (!fromApi) {
      const q = text.toLowerCase();
      setSuggestions(limitTo(list.filter((o) => labelOf(o).toLowerCase().includes(q))));
      return;
    }
    if (!ready || !rt?.client) {
      setSuggestions([]);
      return;
    }
    const base = rt.buildScope ? rt.buildScope({ search: text }) : { search: text };
    const sc = { ...base, row, search: text };
    const key = column.searchParam;
    const method = String(cfg.method || "GET").toUpperCase();
    const overrides = !key ? {} : method === "GET" || method === "DELETE" ? { params: { [key]: text } } : { body: { [key]: text } };
    try {
      const { url, config } = buildApiRequest(cfg, sc, overrides);
      // Silent, as the form's Auto Complete is: no full-screen loader per letter.
      const raw = await rt.client(url, { ...config, meta: { silent: true } });
      if (mine !== seq.current) return;
      setSuggestions(limitTo(pluckRows(raw, normalizeApiConfig(cfg).responsePath)));
    } catch (err) {
      if (mine === seq.current) setSuggestions([]);
    }
  };

  const onPick = (e) => {
    const rec = e?.value;
    if (rec === undefined || disabled) return;
    picked.current = true;
    lastPick.current = rec;
    const label = labelOf(rec);
    setBox(label);
    const record = rec && typeof rec === "object" ? rec.__row || rec : undefined;
    commit(valueOf(rec), { record, label });
  };

  // Typed text that was not picked: matched to a list option by its label,
  // kept as the value, or — with "Only a picked value counts" — undone.
  // Deferred, since a click on a suggestion blurs the box before it selects.
  const settle = () => {
    setTimeout(() => {
      onLeave?.();
      if (picked.current) {
        picked.current = false;
        return;
      }
      const text = typeof boxRef.current === "string" ? boxRef.current : labelOf(boxRef.current);
      if (text === shownLabel) return;
      if (text.trim() === "") {
        commit("", { label: "" });
        return;
      }
      const hit = list.find((o) => labelOf(o).toLowerCase() === text.trim().toLowerCase());
      if (hit) {
        setBox(hit.label);
        commit(hit.value, { record: hit.__row, label: hit.label });
      } else if (column.forceSelection) setBox(shownLabel);
      else commit(text, { label: text });
    }, 180);
  };

  const itemTemplate = (rec) => {
    const sub = subKey && rec && typeof rec === "object" ? getPath(rec, subKey) : "";
    return (
      <div className="dsb-ac-item">
        <span className="dsb-ac-item-lbl">{labelOf(rec)}</span>
        {sub !== "" && sub !== undefined && sub !== null ? <span className="dsb-ac-item-sub">{String(sub)}</span> : null}
      </div>
    );
  };

  return (
    <div
      className={`dsb-cell-ac${error ? " is-invalid" : ""}`}
      data-dsb-interactive
      onClick={(e) => e.stopPropagation()}
      title={error ? tr(error) : undefined}
    >
      <AutoComplete
        value={box}
        suggestions={suggestions}
        completeMethod={complete}
        onChange={(e) => setBox(typeof e.value === "string" ? e.value : labelOf(e.value))}
        onSelect={onPick}
        onBlur={settle}
        field={labelKey}
        itemTemplate={subKey ? itemTemplate : undefined}
        dropdown={column.acDropdown !== false}
        minLength={Number(column.minChars) > 0 ? Number(column.minChars) : 1}
        delay={fromApi ? 300 : 0}
        autoHighlight
        disabled={disabled}
        placeholder={column.placeholder || "Type to search..."}
        emptyMessage={column.emptyMessage || "No results found"}
        showEmptyMessage
        className="dsb-cell-ac-root"
        inputClassName="dsb-cell-input"
        panelClassName="dsb-ac-panel"
        appendTo={typeof document !== "undefined" ? document.body : undefined}
      />
    </div>
  );
}

/**
 * An editable cell: textbox, number, date, dropdown or text area.
 *
 * Typing is kept in local state and committed on blur (or Enter), not on every
 * keystroke: a keystroke that reaches the runtime re-renders every row of the
 * grid, which is unusable at a few hundred rows. Pickers commit immediately,
 * since there is nothing to type.
 */
function EditableCell({ column, row, rowId, cells, node, rt, scope, onCell, disabled = false, flagged = false }) {
  const stored = cellValue(cells, rowId, row, column, scope);
  const [draft, setDraft] = useState(stored);
  const seen = useRef(stored);
  // Left once (blurred / picked): from then on the cell reports its own rules
  // as it changes, rather than only when a Save asks.
  const [touched, setTouched] = useState(false);

  // A new search, or a value written from elsewhere, wins over an idle draft.
  useEffect(() => {
    if (stored !== seen.current) {
      seen.current = stored;
      setDraft(stored);
    }
  }, [stored]);

  /**
   * What is wrong with the cell, if anything.
   *
   * Only for a column that has rules (null otherwise, so every existing
   * column draws exactly as before), and only once the user has left the cell
   * or a Validate has failed it. Read off the draft, so the red goes away as
   * the value is corrected rather than on the next blur.
   */
  // This row's Min / Max — a {{row.…}} bound differs row by row. Only worked
  // out for a column with rules or limits; every other column is untouched.
  const hasRules = !!(column.validation && typeof column.validation === "object");
  const bounds = hasRules && column.control === "number" ? cellBoundsOf(column, node, row, scope) : null;
  const rules = cellRulesOf(column, bounds);
  const error =
    rules && !disabled && (touched || flagged) && cellRulesApply(column, row, scope, node)
      ? validateValue(draft, cellRulesForRow(rules, column, node, row, scope))
      : null;
  // What the box will not take at all (null for every column without limits).
  const limits = cellInputLimitsOf(column, bounds);
  const takeTyped = (raw) => {
    if (!limits) return raw;
    if (limits.allow) return limits.allow.test(raw) ? raw : null;
    return limitNumberDraft(raw, limits);
  };
  const errProps = error ? { "aria-invalid": true, title: tr(error) } : {};
  const errCls = error ? " is-invalid" : "";

  const commit = (v, extra) => {
    if (disabled) return;
    if (rules) setTouched(true);
    if (v === seen.current) return;
    seen.current = v;
    onCell?.(rowId, v);
    rt?.runEvent(node, "onCellChange", { row, column: column.key, value: v, ...(extra || {}) });
  };

  const stop = (e) => e.stopPropagation();
  const shown = draft === null || draft === undefined ? "" : draft;

  if (column.control === "autocomplete") {
    return (
      <AutoCompleteCell
        column={column}
        row={row}
        node={node}
        rt={rt}
        scope={scope}
        stored={stored}
        commit={(v, extra) => {
          setDraft(v);
          commit(v, extra);
        }}
        onLeave={rules ? () => setTouched(true) : undefined}
        error={error}
        disabled={disabled}
      />
    );
  }

  if (column.control === "select") {
    const opts = columnOptions(column, rt, row, scope);
    return (
      <select
        className={`dsb-cell-input${errCls}`}
        data-dsb-interactive
        disabled={disabled}
        value={shown}
        onClick={stop}
        onBlur={rules ? () => setTouched(true) : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        {...errProps}
      >
        <option value="">{column.placeholder || "Select"}</option>
        {opts.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (column.control === "textarea") {
    return (
      <textarea
        className={`dsb-cell-input dsb-cell-area${errCls}`}
        data-dsb-interactive
        disabled={disabled}
        rows={Number(column.rows) || 2}
        value={shown}
        placeholder={column.placeholder || ""}
        onClick={stop}
        onChange={(e) => {
          const next = takeTyped(e.target.value);
          if (next !== null) setDraft(next);
        }}
        onBlur={(e) => {
          if (rules) setTouched(true);
          commit(e.target.value);
        }}
        {...errProps}
      />
    );
  }

  const type = column.control === "number" ? "number" : column.control === "date" ? "date" : "text";
  return (
    <input
      className={`dsb-cell-input${errCls}`}
      type={type}
      data-dsb-interactive
      disabled={disabled}
      value={shown}
      placeholder={column.placeholder || ""}
      min={bounds && bounds.min !== undefined ? bounds.min : column.min ?? undefined}
      max={bounds && bounds.max !== undefined ? bounds.max : column.max ?? undefined}
      step={column.step ?? undefined}
      maxLength={column.maxLength || undefined}
      onClick={stop}
      onChange={(e) => {
        const next = type === "date" ? e.target.value : takeTyped(e.target.value);
        if (next !== null) setDraft(next);
      }}
      // A number column stores a number, so what a save sends is a number and
      // not the string the input handed over. Blank stays blank, not 0.
      onBlur={(e) => {
        let v = e.target.value;
        // Under Min cannot be refused key by key (typing 15 passes through 1),
        // so a limited box is lifted to Min when it is left.
        if (type === "number" && limits && limits.min !== undefined && v !== "" && Number(v) < limits.min) {
          v = String(limits.min);
          setDraft(v);
        }
        if (rules) setTouched(true);
        commit(type === "number" ? (v === "" ? "" : Number(v)) : v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        // Keys a limited number box never takes: exponent and plus always,
        // minus when Min is not negative, the decimal point for whole numbers.
        if (type === "number" && limits && !limits.allow) {
          const k = e.key;
          if (k === "e" || k === "E" || k === "+") e.preventDefault();
          else if (k === "-" && limits.min !== undefined && limits.min >= 0) e.preventDefault();
          else if ((k === "." || k === ",") && limits.integer) e.preventDefault();
        }
      }}
      {...errProps}
    />
  );
}

/**
 * A bare icon with a floating tooltip — the status/flag column, not an action
 * button. Clickable only when the column carries click actions.
 *
 * The bubble is portalled to the body and positioned fixed on hover: a table
 * body scrolls, so a bubble absolutely positioned inside the cell is clipped
 * the moment the row sits near an edge, which is most of them.
 */
function IconTip({ icon = "Info", size = 16, color, bg, tip, onClick, disabled = false, className = "" }) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);

  const place = useCallback(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    // Above by default, below when there is no room — a tooltip that opens
    // off the top of the viewport is not a tooltip.
    const below = r.top < 52;
    setBox({
      x: Math.min(Math.max(r.left + r.width / 2, 60), window.innerWidth - 60),
      y: below ? r.bottom + 8 : r.top - 8,
      below,
    });
  }, []);

  const hide = useCallback(() => setBox(null), []);

  useEffect(() => {
    if (!box) return undefined;
    // Scrolling the grid moves the icon out from under its own bubble.
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [box, hide]);

  const interactive = typeof onClick === "function";

  return (
    <>
      <span
        ref={ref}
        className={`dsb-iconcell ${interactive && !disabled ? "is-clickable" : ""} ${disabled ? "is-disabled" : ""} ${bg ? "has-bg" : ""} ${className}`.replace(/\s+/g, " ").trim()}
        style={bg ? { background: bg } : undefined}
        tabIndex={tip || interactive ? 0 : -1}
        role={interactive ? "button" : undefined}
        aria-label={tip || undefined}
        data-dsb-interactive
        onMouseEnter={place}
        onFocus={place}
        onMouseLeave={hide}
        onBlur={hide}
        onClick={(e) => {
          if (!interactive || disabled) return;
          e.stopPropagation();
          onClick(e);
        }}
      >
        <Icon name={icon} size={Number(size) || 16} color={color || undefined} />
      </span>
      {box && tip
        ? createPortal(
            <span
              className={`dsb-floattip ${box.below ? "is-below" : ""}`.trim()}
              style={{ left: box.x, top: box.y }}
              role="tooltip"
            >
              {tip}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function CellControl({ column, row, node, rt, scope, children, rowId, ticks, cells, onTick, onCell, flagged = false }) {
  const control = column.control || "none";
  // The +/- of a Nested Row Table (registry/nestedRowTable): a column that table
  // adds for itself, never saved, and drawn on the canvas too.
  if (control === "nestToggle") return column.renderCell?.(row, rowId) ?? null;
  /**
   * A cell somebody may look at but not change.
   *
   * The page this replaces disables its logo box when the site's own
   * IsOPDLogo resource is on — a decision that belongs to the deployment, not
   * to the row. Reads the record and the screen scope alike, so
   * {{globals.IsOPDLogo}} and a row field are both available.
   */
  // The screen's form values sit underneath, so a rule saved with a bare
  // form-field name (CostEstimateType, not values.CostEstimateType) still
  // reads it; the row's own fields and the scope's names win over them.
  const values = scope?.values && typeof scope.values === "object" ? scope.values : {};
  const rowScope = { ...values, ...(scope || {}), row, ...(row || {}) };
  const locked = conditionsHold(column.disabledWhen, rowScope);

  /**
   * A row the control does not belong on at all.
   *
   * The settlement list carries "Close Visit" while a visit is open, the words
   * "Visit Closed" once it has been closed, and a dash on the rows the action
   * never applies to. A column could draw one control for every row, so that
   * was three columns or none — and "greyed out" is not the same answer as
   * "this row was already dealt with".
   *
   * First match wins, so the most specific rule goes first; the text is a
   * template, which is how it reads a field of the row.
   */
  const instead = rt?.design
    ? null
    : (Array.isArray(column.insteadRules) ? column.insteadRules : []).find((r) => conditionsHold(r?.when, rowScope));
  if (instead) {
    const words = interpolate(String(instead.text ?? ""), rowScope);
    return <span className="dsb-cell-instead">{words === "" || words === undefined ? "—" : words}</span>;
  }

  /**
   * Not on this row at all, not even a dash: the remove icon that only a row
   * added on this screen carries ({{row.isRemove}}), while the rows the server
   * sent show an empty cell. The canvas still draws it, so it can be styled.
   */
  if (!rt?.design && conditionsHold(column.hiddenWhen, rowScope)) return null;

  /*
   * "Icon button" and "Icon (no button)" are one control in two looks, so
   * switching between them changes how the cell is drawn and nothing else:
   * the same icon (fixed or from a field), the same tooltip (fixed or from a
   * field), the same strip of icons, the same On click — and, with On click
   * empty, the same fallback to the table's onRowAction.
   */
  const iconOf = () => (column.iconField ? getPath(row, column.iconField) : null) || column.icon || "";
  const tipOf = () => {
    const raw = column.tipField ? getPath(row, column.tipField) : null;
    return raw !== null && raw !== undefined && raw !== "" && typeof raw !== "object"
      ? String(raw)
      : tr(column.title || column.header || column.key || "");
  };
  const iconStrip =
    (control === "iconOnly" || control === "icon") && Array.isArray(column.icons) && column.icons.length ? (
      <ActionStrip
        disabled={locked}
        column={{
          key: column.key,
          actions: column.icons,
          iconSize: column.iconSize,
          iconColor: column.iconColor,
          gap: column.gap,
          frameName: column.frameName,
        }}
        row={row}
        node={node}
        rt={rt}
        scope={scope}
      />
    ) : null;

  if (control === "iconOnly") {
    // Several icons in the one cell, each with its own click: the same strip
    // the "Action buttons" field type draws, reached from the control list
    // because that is where someone who has just placed one icon looks for the
    // second. One list, one renderer — not a second implementation of it.
    if (iconStrip) return iconStrip;

    // A flag, not a button: the icon and its tooltip can both come from the
    // row, and it is drawn on the canvas too — an empty cell where a designer
    // put an icon reads as broken.
    const iconName = iconOf() || "Info";
    const tip = tipOf();
    // Clickable with an On click of its own, or — like the icon button — when
    // it hands the click to the table's onRowAction (`rowAction`, set when a
    // column is switched over from an icon button).
    const hasClick = (Array.isArray(column.onClick) && column.onClick.length > 0) || !!column.rowAction;
    return (
      <IconTip
        icon={String(iconName)}
        size={column.iconSize}
        color={column.iconColor}
        tip={tip}
        onClick={hasClick && !rt?.design && !locked ? () => cellClick(rt, node, column, row) : undefined}
        disabled={locked}
      />
    );
  }

  if (control === "none" || rt?.design) return children;

  if (control === "link") {
    return (
      <button
        type="button"
        className="dsb-link"
        data-dsb-interactive
        disabled={locked}
        onClick={(e) => {
          e.stopPropagation();
          if (locked) return;
          rememberRow(rt, node, row);
          rt?.runEvent(node, "onRowClick", { row, column: column.key });
        }}
      >
        {children}
      </button>
    );
  }
  if (control === "button") {
    return (
      <button
        type="button"
        className={column.buttonClass || "btn btn-sm btn-success px-3"}
        title={column.title || undefined}
        data-dsb-interactive
        disabled={locked}
        onClick={(e) => {
          e.stopPropagation();
          if (locked) return;
          cellClick(rt, node, column, row);
        }}
      >
        {column.icon ? <Icon name={column.icon} size={13} color={column.iconColor || undefined} /> : null}
        {column.buttonText || children}
      </button>
    );
  }
  if (control === "icon") {
    // An icon on its own: the edit/print/delete column every list screen has.
    // Same event as a button — what the cell looks like is not what it does.
    if (iconStrip) return iconStrip;
    const tip = tipOf();
    return (
      <button
        type="button"
        className={column.buttonClass || "dsb-cell-iconbtn"}
        title={tip}
        aria-label={tip}
        data-dsb-interactive
        disabled={locked}
        onClick={(e) => {
          e.stopPropagation();
          if (locked) return;
          cellClick(rt, node, column, row);
        }}
      >
        <Icon
          name={String(iconOf() || "Pencil")}
          size={Number(column.iconSize) || 15}
          color={column.iconColor || "var(--dsb-primary)"}
        />
      </button>
    );
  }
  if (control === "editRow") {
    const tip = tr(column.title || "Edit");
    return (
      <button
        type="button"
        className={column.buttonClass || "dsb-cell-iconbtn"}
        title={tip}
        aria-label={tip}
        data-dsb-interactive
        disabled={locked}
        onClick={(e) => {
          e.stopPropagation();
          if (locked) return;
          editRowClick(rt, node, column, row);
        }}
      >
        <Icon
          name={String(iconOf() || "Pencil")}
          size={Number(column.iconSize) || 15}
          color={column.iconColor || "var(--dsb-primary)"}
        />
      </button>
    );
  }
  if (control === "checkbox") {
    const on = isChecked(ticks, rowId, row, column);
    return (
      <input
        type="checkbox"
        checked={on}
        disabled={locked}
        data-dsb-interactive
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (locked) return;
          onTick?.(rowId, e.target.checked);
          rt?.runEvent(node, "onRowAction", { row, column: column.key, checked: e.target.checked });
        }}
      />
    );
  }
  if (EDIT_CONTROLS.includes(control)) {
    return (
      <EditableCell
        column={column}
        row={row}
        rowId={rowId}
        cells={cells}
        node={node}
        rt={rt}
        scope={scope}
        onCell={onCell}
        disabled={locked}
        flagged={flagged}
      />
    );
  }
  return children;
}

/**
 * The frame menu for one record: the app's own "more patient screens" control.
 *
 * This is the trigger the hand-coded pages put in a row's action strip and in
 * the patient panel — the same <EmergencySeeMoreList>, so the list of screens,
 * the lazy imports and everything each screen is handed stay the app's, not a
 * copy that drifts. What is rebuilt here is only the hosting the page used to
 * do inline: the slide screen the picked screen opens in, and the header menu
 * that switches between them without closing it.
 *
 * The menu itself is fetched once per module and shared (see useFrameMenu), so
 * a column of these on a 50-row grid is still one request.
 */
function FrameMenuControl({ rt, row, frameName, showPatientHeader = true, label = "", refresh }) {
  const { items, loading, error } = useFrameMenu(rt, frameName);
  const [seeMore, setSeeMore] = useState([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState({ name: "", component: null });
  // The slide screen is mounted from the first time this row opens one and
  // stays mounted after that, exactly as EmergencyPatientTable keeps its single
  // one: it is the mounted-then-toggled `visible` that runs the slide-up, and a
  // portal created already-open just appears. Rows nobody has touched still
  // mount nothing.
  const [mounted, setMounted] = useState(false);

  const show = useCallback((name, component) => {
    setPicked({ name, component });
    setMounted(true);
    setOpen(true);
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
    setPicked({ name: "", component: null });
  }, []);

  if (rt?.design) {
    // The list is role-filtered, so the designer's own menu is not the one the
    // screen's users get. Naming the module is the honest preview.
    return (
      <span className="dsb-framemenu-tile" title={`Frame menu — ${frameName || "no module set"}`}>
        <Icon name="ClipboardList" size={15} />
        {label ? <span>{label}</span> : null}
        <span className="dsb-framemenu-flag">{frameName || "set a module"}</span>
      </span>
    );
  }

  if (loading) return <span className="dsb-muted">…</span>;
  if (error) {
    return (
      <span className="dsb-muted" title={error}>
        <Icon name="AlertTriangle" size={14} />
      </span>
    );
  }
  if (!items.length) return <span className="dsb-muted">—</span>;

  return (
    // The row's own click opens whatever the table's onRowClick opens, and the
    // menu icon sits inside that row — without this, picking a screen also
    // selects the row behind it. The action buttons beside it stop the same
    // way; this control brings its own trigger, so the wrapper does it.
    <span className="dsb-framemenu" data-dsb-interactive onClick={(e) => e.stopPropagation()}>
      <EmergencySeeMoreList
        ModalComponent={show}
        setSeeMore={setSeeMore}
        data={row || {}}
        isShowPatient={!!showPatientHeader}
        handleBindFrameMenu={items}
        setVisible={() => {
          // What a screen calls when it has finished with the patient — close,
          // then re-read the rows so the one behind it is current.
          hide();
          refresh && refresh();
        }}
        refreshAndReopen={refresh}
      />
      {label ? <span className="dsb-framemenu-label">{label}</span> : null}
      {mounted ? (
        <SlideScreen
          visible={open}
          setVisible={hide}
          Header={
            <SeeMoreSlideScreen
              name={picked?.name}
              seeMore={seeMore}
              handleChangeComponent={(item) => show(item?.label || item?.name, item?.component)}
            />
          }
        >
          {picked?.component}
        </SlideScreen>
      ) : null}
    </span>
  );
}

/**
 * The frame menu raised by an action rather than by a trigger.
 *
 * `openFrameMenu` can be put on any chain — a row action button, a Save that
 * confirms first, a toolbar button — and a chain has nothing on screen to drop
 * a menu out of. So the whole thing opens as the slide screen the app uses:
 * the picker in its header (same control, so switching screens works the same),
 * and, until something is picked, the list itself as the body.
 *
 * One host per screen, mounted by the renderer, driven by `ui.frameMenu`.
 */
export function FrameMenuHost() {
  const rt = useRuntime();
  const current = rt?.ui?.frameMenu?.current;
  const frameName = current?.frameName || "";
  const { items, loading, error } = useFrameMenu(rt, frameName);
  const [picked, setPicked] = useState(null);
  const [search, setSearch] = useState("");
  // Mounted from the first raise and kept, so the slide-up runs on `visible`
  // flipping rather than on a portal appearing already open — the same reason
  // EmergencyPatientTable keeps its one slide screen mounted.
  const [mounted, setMounted] = useState(false);

  /**
   * Where the menu drops from.
   *
   * A trigger drops its list from itself; an action has no trigger, and a list
   * that takes the whole screen hides the very row it is about. So the last
   * place the pointer went down is remembered and the card opens there — the
   * table stays visible behind it, which is what the icon in a row implies.
   */
  const anchor = useRef({ x: 24, y: 120 });
  useEffect(() => {
    const mark = (e) => {
      anchor.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener("pointerdown", mark, true);
    return () => document.removeEventListener("pointerdown", mark, true);
  }, []);

  // A fresh raise is a fresh menu: the screen picked last time must not be
  // sitting there over a different patient.
  const key = current?.key;
  useEffect(() => {
    setPicked(null);
    setSearch("");
    if (key) setMounted(true);
  }, [key]);

  // Anywhere outside the card closes it, as a drop-down should.
  useEffect(() => {
    if (!current || picked) return undefined;
    const away = (e) => {
      if (!e.target.closest?.(".dsb-framecard")) rt?.closeFrameMenu?.();
    };
    // Deferred: the very click that opened this must not also close it.
    const id = setTimeout(() => document.addEventListener("mousedown", away), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", away);
    };
  }, [current, picked, rt]);

  const record = useMemo(() => frameMenuRecord(current?.row), [current?.row]);
  const groups = useMemo(() => groupFrameMenu(items, search), [items, search]);

  const open = useCallback(
    (item) => {
      const loader = EMERGENCY_FRAME_COMPONENTS[item?.URL];
      const Screen = React.lazy(() =>
        loader
          ? loader()
              .then((m) => ({ default: m.default }))
              .catch(() => ({ default: () => <div className="dsb-muted">Could not load {item?.URL}</div> }))
          : Promise.resolve({ default: () => <div className="dsb-muted">No screen named {item?.URL}</div> }),
      );
      setPicked({
        name: item?.safeLabel,
        component: (
          <React.Suspense fallback={<div className="dsb-muted">Loading…</div>}>
            {current?.showPatientHeader !== false ? <EMGPersonalDetailsOfPatient data={current?.row || {}} /> : null}
            <Screen
              data={record}
              setActionType={() => {}}
              menuItemData={{ id: "1" }}
              toggleAction={() => {}}
              setVisible={() => rt?.closeFrameMenu?.()}
              handleBindFrameMenu={items}
            />
          </React.Suspense>
        ),
      });
    },
    [current, items, record, rt],
  );

  if (!mounted || rt?.design) return null;

  // The drop-down, over the page. Portalled to <body> because the screen it
  // belongs to may be inside anything, and positioned like the app's own menu:
  // at the pointer, flipped up when there is no room below, clamped to the
  // viewport on both axes.
  const card =
    current && !picked
      ? createPortal(
          <ScreenScope rt={rt} className="dsb-framecard" style={cardPosition(anchor.current)}>
            <div className="dsb-framecard-search">
              <input
                className="dsb-input"
                placeholder="Search forms…"
                value={search}
                autoFocus
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="dsb-framecard-list">
              {loading ? <div className="dsb-framecard-note">Loading…</div> : null}
              {error ? <div className="dsb-framecard-note is-err">{error}</div> : null}
              {!loading && !error && !groups.length ? (
                <div className="dsb-framecard-note">No forms for this module.</div>
              ) : null}
              {groups.map(([header, group]) => (
                <div key={header} className="dsb-framecard-group">
                  <div className="dsb-framecard-head">{header}</div>
                  {group.map((item, i) => (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      className="dsb-framecard-item"
                      onClick={() => open(item)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open(item)}
                    >
                      <Icon name="FileText" size={14} />
                      <span>{item.safeLabel}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScreenScope>,
          document.body,
        )
      : null;

  return (
    <>
      {card}
      <SlideScreen
        visible={!!current && !!picked}
        setVisible={() => rt?.closeFrameMenu?.()}
        Header={
          <SeeMoreSlideScreen
            name={picked?.name}
            seeMore={items.map((it) => ({ ...it, name: it.FileName }))}
            handleChangeComponent={(item) => open({ ...item, safeLabel: item?.name || item?.FileName })}
          />
        }
      >
        {picked?.component}
      </SlideScreen>
    </>
  );
}

/**
 * The app's own row modal, raised by an icon in the action strip or by an
 * `openAppModal` action anywhere on the screen.
 *
 * It mounts the REAL component from utils/appModals — the same LabsModel a
 * hand-coded page opens — inside the app's dialog, handed the row as `data`.
 * The frame-menu host next door does the same job for whole screens; this one
 * is for the modals the reference pages open directly.
 *
 * Saving is the entry's business (only Waiting type writes today): on success
 * the dialog closes and the grid the icon was pressed in refreshes, which is
 * exactly what the reference page does after SaveWaitingTypeApi.
 *
 * One host per screen, mounted by the renderer, driven by `ui.appModal`.
 */
export function AppModalHost() {
  const rt = useRuntime();
  const current = rt?.ui?.appModal?.current;
  // The screen's own registered modals are part of the lookup: a key saved on
  // this screen has to resolve here, and nowhere else.
  const spec = appModal(current?.modal, rt?.screen?.appModals);
  const raise = current?.key;

  // Lazily imported per raise: the modals are heavy (grids, charts, their own
  // API calls) and a screen that never opens one must not pay for them.
  const Screen = useMemo(() => {
    if (!spec) return null;
    return React.lazy(() =>
      spec
        .load()
        .then((m) => ({ default: withStandIns(m.default) }))
        .catch(() => ({ default: () => <div className="dsb-muted">Could not load {spec.label}</div> })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec?.key, raise]);

  // The optional details strip above the dialog's own content, lazy like it.
  const Header = useMemo(() => {
    if (!spec?.headerLoad) return null;
    return React.lazy(() =>
      spec
        .headerLoad()
        .then((m) => ({ default: withStandIns(m.default) }))
        .catch(() => ({ default: () => null })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec?.key, raise]);

  const close = useCallback(() => rt?.closeAppModal?.(), [rt]);

  const onSave = useCallback(
    async (payload) => {
      if (!spec?.save) {
        // The component did its own saving and is reporting that it is done.
        // The list it was opened from is showing what it changed, so bring
        // that up to date the same way a modal with a `save` of its own does.
        close();
        if (current?.sourceId) rt?.refresh?.(current.sourceId, { force: true });
        return;
      }
      try {
        const res = await spec.save(payload, current?.row);
        if (res?.ok) {
          if (res.message) toast.success(res.message);
          close();
          if (current?.sourceId) rt?.refresh?.(current.sourceId, { force: true });
        } else {
          toast.error(res?.message || "Could not save");
        }
      } catch (e) {
        toast.error(e?.message || "Could not save");
      }
    },
    [spec, current?.row, current?.sourceId, close, rt],
  );

  /**
   * A Save button for a component that has none of its own.
   *
   * Most of the app's small "add" dialogs (ReferDoctorModal and ~200 like it)
   * draw only the fields and report them through `setModalData`; the page that
   * opens them owns the Save button and the API call. When the opening action
   * brings a save chain, this host plays that page: it keeps what the
   * component reports — {{modal.<field>}} in the chain — shows the dialog's
   * Save / Cancel bar, runs the chain on Save, and on success closes and
   * reloads what the opener asked for (a Select + Add's options).
   */
  /**
   * The page's own callbacks, wired to action chains.
   *
   * An embedded page reports back by calling a prop — the registration page
   * calls `bindDetailAPI` once it has saved, the search dialogs call
   * `handleSearch`. Those props used to be stand-in no-ops, so the screen that
   * opened the page never heard the answer and could not reload. Each entry
   * here turns one of them into "run this chain", with what the page passed
   * reachable as {{args.0}} (and {{args}} for the lot).
   */
  const callbackProps = useMemo(() => {
    const list = Array.isArray(current?.callbacks) ? current.callbacks : [];
    const out = {};
    list.forEach((cb) => {
      const name = String(cb?.name || "").trim();
      if (!name || !Array.isArray(cb.actions) || !cb.actions.length) return;
      out[name] = (...args) =>
        rt?.runActions?.(cb.actions, {
          row: current?.row ?? null,
          args,
          arg: args[0],
          // A page that reports one record hands it over as the first
          // argument; reading it as {{modal.Field}} keeps the dialog chains
          // and the callback chains speaking one language.
          modal: args[0] && typeof args[0] === "object" && !Array.isArray(args[0]) ? args[0] : {},
        });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key, current?.callbacks, rt]);

  const saveChain = current?.saveActions || null;
  const [modalData, setModalData] = useState(null);
  const [saving, setSaving] = useState(false);
  // Every raise starts empty: the previous entry must never be saved twice.
  useEffect(() => {
    setModalData(null);
    setSaving(false);
  }, [raise]);
  const runSave = useCallback(async () => {
    if (!saveChain || saving) return;
    setSaving(true);
    try {
      const ok = await rt?.runActions?.(saveChain, { row: current?.row ?? null, modal: modalData || {} });
      if (ok !== false) {
        close();
        if (current?.sourceId) rt?.refresh?.(current.sourceId, { force: true });
      }
    } finally {
      setSaving(false);
    }
  }, [saveChain, saving, rt, current?.row, current?.sourceId, modalData, close]);

  if (!current || !spec || !Screen) return null;

  const body = (
    <ModalBoundary key={raise} label={spec.label}>
      <React.Suspense fallback={<Skeleton rows={4} />}>
        {/* Some of these dialogs open with the patient's details strip above
            them — the reference page composes the two inline. The entry names
            the header it wants and it is loaded the same lazy way. */}
        {Header ? <Header data={current.row} /> : null}
        <Screen
          // A frame screen reads the patient off the record the frame menu
          // shapes (transactionID / patientID); some Utils modals want the same
          // shape under their own names, and say so with `shape`; the rest read
          // the row exactly as it came from the endpoint.
          data={spec.shape ? spec.shape(current.row) : spec.frame ? frameMenuRecord(current.row) : current.row}
          // A screen-registered modal may name the props it wants instead.
          // Spread after `data` so a map can override it, and before the close
          // handlers so a map cannot take `onClose` away and strand the dialog
          // open on a screen nobody can shut.
          // An "Open modal" action names them itself, resolved when it ran.
          {...(current.props
            ? current.props
            : spec.propsMap
              ? interpolateDeep(spec.propsMap, { row: current.row, ...(current.row || {}) })
              : null)}
          // After the named props, so a callback the screen wired up wins
          // over a value that happens to share its name, and before the
          // close handlers, which a chain must never be able to take away.
          {...callbackProps}
          // How a fields-only dialog reports what was typed (see runSave).
          // Always handed over, Save button or not: a ProjectModal-style
          // component calls it from its first effect, and without it the
          // dialog dies with "setModalData is not a function".
          setModalData={setModalData}
          modalData={modalData || {}}
          onSave={onSave}
          onClose={close}
          setVisible={close}
          setShowFlowSheet={close}
          setShowMedicationCalendar={close}
          setShowNotesModal={close}
          {...(spec.frame
            ? { setActionType: () => {}, menuItemData: { id: "1" }, toggleAction: () => {}, handleBindFrameMenu: [] }
            : null)}
          {...(spec.reopens
            ? {
                // Screens that edit the record behind them (BillingDetails) ask
                // their host to close and bring the list back up to date. Here
                // that is the grid this row came from.
                refreshAndReopen: () => {
                  if (current?.sourceId) rt?.refresh?.(current.sourceId, { force: true });
                },
                handleBindFrameMenu: [],
                handleComponentRender: () => {},
              }
            : null)}
        />
      </React.Suspense>
    </ModalBoundary>
  );

  /**
   * Where it opens. "" is the app's centred dialog, as before; a position is
   * the app's own OverLay, which is what the hand-coded single-window pages
   * use — a sheet the full width of the screen sliding up from the bottom.
   * The real component either way, so only the entrance differs.
   */
  const position = current.position || "";
  if (position && position !== "center") {
    return (
      <ProjectOverLay
        visible
        position={position}
        setVisible={close}
        modalWidth={current.size || spec.size || "100vw"}
        Header={current.title || spec.title || spec.label}
      >
        {body}
      </ProjectOverLay>
    );
  }

  return (
    <ProjectModal
      visible
      setVisible={close}
      Header={current.title || spec.title || spec.label}
      modalWidth={current.size || spec.size || "60vw"}
      // These modals carry their own buttons, so the dialog's Save/Cancel bar
      // is suppressed — the same `footer={<></>}` the reference page passes —
      // unless the opening action brought a save chain for it to run.
      footer={saveChain ? undefined : <></>}
      handleAPI={saveChain ? runSave : undefined}
      modalData={modalData}
      buttonName={current.saveText || undefined}
      buttonDisabled={saving}
    >
      {body}
    </ProjectModal>
  );
}

/**
 * A component opened in a dialog, handed stand-ins for the props it expects and
 * nobody passes (utils/componentProps): a `setModalData` that collects, a
 * `setVisible` / `onClose` that closes, other callbacks that do nothing, `[]`
 * for a list and `{}` for a record. What the host or the action passes wins.
 *
 * Made once per mount, so a stand-in `[]` keeps its identity: a new one every
 * render would re-run any effect that depends on it, forever. The handlers go
 * through a ref for the same reason — the host's close is re-created as the
 * runtime changes, and the stand-in must call the current one.
 */
function withStandIns(Comp) {
  if (!Comp) return Comp;
  const names = propNamesOf(Comp);
  if (!names.length) return Comp;
  function WithStandIns(props) {
    const handlers = useRef(null);
    handlers.current = props;
    const extra = useMemo(
      () =>
        standInProps(names, props, {
          close: (...a) => handlers.current?.onClose?.(...a),
          collect: (...a) => handlers.current?.setModalData?.(...a),
        }),
      // Once per mount, on purpose — see above.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );
    return <Comp {...extra} {...props} />;
  }
  WithStandIns.displayName = `WithStandIns(${Comp.displayName || Comp.name || "Component"})`;
  return WithStandIns;
}

/**
 * Any component of the app can be opened as a modal now, and a page written to
 * be routed to may throw when it is mounted inside a dialog without the props
 * it expects. That must cost the dialog, not the screen: without a boundary
 * here the error climbs to the app's own and the whole page is replaced.
 * Keyed per raise by the host, so the next open starts clean.
 */
class ModalBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    // Marked as dealt with. A development build of React re-throws every error
    // a boundary catches through a global `error` event, and the app's own
    // ErrorBoundary listens for those — without the mark it would replace the
    // whole page for an error this dialog has already contained.
    if (error && typeof error === "object") {
      try {
        error.__handledByBoundary = true;
      } catch (e) {
        /* a frozen error just is not marked */
      }
    }
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.warn(`[screen-builder] ${this.props.label} failed inside a modal`, error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="dsb-muted" role="alert">
        {this.props.label} could not open here: {String(this.state.error?.message || this.state.error)}. It may need
        props this action does not pass — add them under &ldquo;Pass to the component&rdquo;.
      </div>
    );
  }
}

/** Keep the drop-down on screen: flip it above the pointer when it would not fit. */
function cardPosition({ x, y }) {
  const W = 320;
  const H = 420;
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const below = vh - y - 12;
  const flip = below < H && y > below;
  return {
    position: "fixed",
    zIndex: 10000,
    width: W,
    left: Math.max(8, Math.min(x, vw - W - 8)),
    top: flip ? "auto" : Math.min(y + 6, Math.max(8, vh - 120)),
    bottom: flip ? Math.max(8, vh - y + 6) : "auto",
    maxHeight: Math.max(180, flip ? y - 16 : below),
  };
}

/**
 * The row action strip — the icon cluster every hand-coded list screen ends
 * its row with (Labs, Meds, FlowSheets, Remarks, waiting type, release, the
 * module's patient screens), made configurable.
 *
 * One column holds a LIST of icons rather than a column per icon, because that
 * is how the reference pages are laid out and because eight one-icon columns
 * cannot be reordered, spaced or hidden as a group. Each icon carries its own
 * kind — an action chain, one of the app's real modals, a route, or the frame
 * menu — its own tooltip, and its own condition, so "no release icon once the
 * patient is released" is a rule on the icon instead of a branch in code.
 */
function ActionStrip({ column, row, node, rt, scope, disabled = false }) {
  const items = Array.isArray(column.actions) ? column.actions : [];
  const size = Number(column.iconSize) || 15;
  const sourceId = node?.props?.dataSourceId || nodeSourceId(node?.id);
  const evalScope = { ...(scope || {}), row, ...(row || {}) };

  const shown = items.filter((a) => {
    if (!a) return false;
    // A condition with no operator is an unfinished rule, not a hidden icon.
    if (!a.when || !a.when.op) return true;
    return evalCondition(a.when, evalScope);
  });

  if (!shown.length) return <span className="dsb-muted">—</span>;

  return (
    <div className="dsb-row-actions" style={column.gap ? { gap: Number(column.gap) || undefined } : undefined} data-dsb-interactive>
      {shown.map((a, i) => {
        // The frame menu belongs in the action strip beside the other row
        // icons, not in a column of its own — that is where every hand-coded
        // page puts it. It brings its own trigger, so it is not a button with
        // a chain; it opens the module's screens for this row.
        if (a.kind === "frameMenu") {
          return (
            <FrameMenuControl
              key={i}
              rt={rt}
              row={row}
              frameName={a.frameName || column.frameName || ""}
              showPatientHeader={a.showPatientHeader !== false}
              refresh={() => rt?.refresh?.(sourceId, { force: true })}
            />
          );
        }

        const spec = a.kind === "appModal" ? appModal(a.appModal) : null;
        const icon = a.icon || spec?.icon || (a.kind === "navigate" ? "ExternalLink" : "MoreHorizontal");
        // The chain this icon carries is no longer interpolated at render
        // time — it has to keep its {{row.*}} until it runs. Its LABEL still
        // wants resolving, and here there is a row to resolve it against,
        // which is better than what the render-time pass could do.
        const tip = interpolate(a.tooltip || a.label || spec?.label || "", { ...(scope || {}), row, ...(row || {}) });

        const fire = () => {
          rememberRow(rt, node, row);
          if (a.kind === "appModal") {
            if (!spec) {
              toast.warn("This icon has no app modal picked");
              return;
            }
            rt?.openAppModal?.(spec.key, row, { title: a.title || spec.title, size: a.size || spec.size, sourceId });
            return;
          }
          if (a.kind === "navigate") {
            rt?.runActions?.([{ type: "navigate", route: a.route }], { row, column: column.key, action: a, node });
            return;
          }
          if (Array.isArray(a.onClick) && a.onClick.length) {
            rt?.runActions?.(a.onClick, { row, column: column.key, action: a, node });
            return;
          }
          rt?.runEvent(node, a.event || "onRowAction", { row, action: a });
        };

        return (
          <IconTip
            key={i}
            icon={icon}
            size={a.iconSize || size}
            color={a.color || column.iconColor}
            bg={a.bgColor}
            tip={tip}
            // The canvas draws the strip so it can be laid out and judged, but
            // pressing an icon there must not open a patient's lab results.
            onClick={rt?.design ? undefined : fire}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}

/**
 * What a cell SHOWS when the value itself is not what a reader wants.
 *
 * A status column carries "IN", "RFI", "STI" — codes the endpoint stores and
 * the colour rules key off, but not words anyone says out loud. A column can
 * map them: IN is shown as "Patient admitted" while the row's value stays
 * "IN", so filters, sorting, colour rules and anything the row is handed
 * afterwards are untouched. Only the text on screen changes.
 *
 * Matching ignores case and surrounding space, because a code that arrives as
 * " in " from one endpoint and "IN" from another is the same code.
 */
const displayValue = (column, raw) => labelForValue(column?.valueLabels, raw);

/**
 * A column the user acts on rather than reads: an icon strip, a button, a
 * tick box, a typed-in cell. Trailing ones are what "Freeze columns at the
 * end: auto" keeps in view.
 */
function isControlColumn(c) {
  if (!c) return false;
  if (["actions", "frameMenu", "icon"].includes(c.type)) return true;
  const ctl = c.control || "none";
  return ctl !== "none" && ctl !== "link";
}

/**
 * How many columns stay put at each edge while the rest scroll sideways.
 *
 * `freezeStart` is a count from the left (0 / empty = none). `freezeEnd` is a
 * count from the right, or empty / "auto" for every trailing control column —
 * the Edit / Print / Remove icons a wide grid otherwise scrolls out of reach.
 * At least one column is always left to scroll; asked for more, nothing is
 * frozen rather than a grid that cannot move.
 */
export function freezeCounts(columns, props) {
  const n = columns.length;
  const start = Math.max(0, parseInt(props.freezeStart, 10) || 0);
  const raw = String(props.freezeEnd ?? "").trim().toLowerCase();
  let end;
  if (raw === "" || raw === "auto") {
    end = 0;
    for (let i = n - 1; i >= 0 && isControlColumn(columns[i]); i -= 1) end += 1;
  } else {
    end = Math.max(0, parseInt(raw, 10) || 0);
  }
  if (start + end >= n) return { start: 0, end: 0 };
  return { start, end };
}

/**
 * Soft pastel families for card view: a tinted header band, a deeper accent
 * for the avatar and top edge, and an ink that reads on both.
 */
const CARD_PALETTES = [
  { accent: "#8b5cf6", soft: "#f5f3ff", band: "#ede9fe", ink: "#5b21b6" }, // lavender
  { accent: "#ec4899", soft: "#fdf2f8", band: "#fce7f3", ink: "#9d174d" }, // rose
  { accent: "#10b981", soft: "#ecfdf5", band: "#d1fae5", ink: "#065f46" }, // mint
  { accent: "#0ea5e9", soft: "#f0f9ff", band: "#e0f2fe", ink: "#075985" }, // sky
  { accent: "#f59e0b", soft: "#fffbeb", band: "#fef3c7", ink: "#92400e" }, // butter
  { accent: "#14b8a6", soft: "#f0fdfa", band: "#ccfbf1", ink: "#115e59" }, // teal
  { accent: "#f97316", soft: "#fff7ed", band: "#ffedd5", ink: "#9a3412" }, // peach
  { accent: "#6366f1", soft: "#eef2ff", band: "#e0e7ff", ink: "#3730a3" }, // periwinkle
];

/**
 * The same families by name, for a colour rule to pick ("Status is Released
 * For IPD → mint"), plus two the hashing never hands out: red for what is
 * urgent and slate for what is closed.
 */
export const CARD_TONES = {
  lavender: CARD_PALETTES[0],
  rose: CARD_PALETTES[1],
  mint: CARD_PALETTES[2],
  sky: CARD_PALETTES[3],
  butter: CARD_PALETTES[4],
  teal: CARD_PALETTES[5],
  peach: CARD_PALETTES[6],
  periwinkle: CARD_PALETTES[7],
  red: { accent: "#ef4444", soft: "#fef2f2", band: "#fee2e2", ink: "#991b1b" },
  slate: { accent: "#64748b", soft: "#f8fafc", band: "#e2e8f0", ink: "#334155" },
};

/** A family made from one colour — a picked hex, or one the row carries. */
function paletteOfColor(color) {
  return {
    accent: color,
    soft: `color-mix(in srgb, ${color} 7%, #fff)`,
    band: `color-mix(in srgb, ${color} 18%, #fff)`,
    ink: `color-mix(in srgb, ${color} 70%, #000)`,
  };
}

/**
 * The family the card's colour rules give this row, or null when none holds.
 * Rules run in order and the first that holds wins, like every other colour
 * rule. A rule names a family (`tone`) or a colour of its own (`color`, which
 * may be a binding — `{{row.ColorCode}}`); the colour wins when both are set.
 */
function cardRulePalette(rules, row, scope) {
  if (!Array.isArray(rules) || !rules.length) return null;
  const evalScope = { ...(scope || {}), row, ...(row || {}) };
  for (const r of rules) {
    if (!r || !r.op) continue;
    if (!evalCondition({ field: r.field, op: r.op, value: r.value }, evalScope)) continue;
    const color = typeof r.color === "string" && r.color.trim() ? String(hasTemplate(r.color) ? interpolate(r.color, evalScope) ?? "" : r.color).trim() : "";
    if (color) return paletteOfColor(color);
    if (r.tone && CARD_TONES[r.tone]) return CARD_TONES[r.tone];
  }
  return null;
}

/**
 * The colour family of one card. Keyed on a value of the row (the title by
 * default), so every "OPD" card is the same colour and every "EMG" another —
 * the colour carries meaning instead of decorating at random. `index` colours
 * by position instead.
 */
function cardPalette(value, index = null) {
  if (index !== null && index !== undefined) return CARD_PALETTES[index % CARD_PALETTES.length];
  if (value === null || value === undefined || value === "" || typeof value === "object") return CARD_PALETTES[0];
  const text = String(value).trim().toUpperCase();
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return CARD_PALETTES[h % CARD_PALETTES.length];
}

/** Up to two letters for a card's avatar: "Ajay Devgan" → "AD", "OPD" → "OP". */
function initialsOf(text) {
  const words = String(text || "")
    .replace(/^(mr|mrs|ms|dr|miss|master|baby)\.?\s+/i, "")
    .split(/[\s/_-]+/)
    .filter(Boolean);
  if (!words.length) return "#";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** A column that belongs along a card's foot (or corner) rather than in its fields. */
function isCardFootColumn(c) {
  if (!c) return false;
  if (["actions", "frameMenu", "icon"].includes(c.type)) return true;
  return ["button", "icon", "editRow", "iconOnly", "checkbox"].includes(c.control);
}

/** Where a table cell's text is cut, unless its column says otherwise. */
export const DEFAULT_CELL_CHARS = 25;

export function CellValue({ column, row, node, rt, scope, index = 0 }) {
  // A column with no key reads NOTHING. `getPath(row, "")` returns the row
  // itself, which every renderer downstream turns into "[object Object]" —
  // a whole grid of them, once a column list arrives with a blank key.
  /**
   * What the cell reads.
   *
   * Normally the column's own field. A "Value template" writes it instead —
   * `{{row.ActualStartDate | default:row.RegistrationDate}}` for the last
   * visit that falls back to the registration date, or
   * `{{row.Rate * row.Qty | fixed:2}}` for a column the endpoint never sent.
   * Sorting and filtering still work off the stored field, so a template is
   * for what is SHOWN.
   */
  const templated =
    typeof column.valueTemplate === "string" && column.valueTemplate.trim()
      ? interpolate(column.valueTemplate, { ...(scope || {}), row, ...(row || {}) })
      : undefined;
  const stored = templated !== undefined ? templated : column.key ? getPath(row, column.key) : undefined;
  const raw = displayValue(column, stored);
  const type = column.type || "text";

  // Objects and arrays have no sensible cell rendering. A nested payload
  // (`{ id, name }`) is shown as a dash rather than "[object Object]", which
  // says nothing and looks like data.
  if (raw !== null && typeof raw === "object" && type !== "actions" && type !== "frameMenu") {
    return <span className="dsb-muted" title="This field is an object, not a value">—</span>;
  }

  // A serial column numbers the rows instead of reading a field, so it needs no
  // key in the data. The number is the row's place in the whole result, not on
  // the page — page 2 of a 10-row page starts at 11, and a sort renumbers
  // from the top rather than carrying the old numbers around with the rows.
  if (type === "serial") return <span>{index + 1}</span>;

  if (type === "chip") {
    // The colour is resolved from the STORED value: a rule written against
    // "IN" must keep working after "IN" is shown as "Patient admitted".
    const c = resolveChipColor(column, stored, row, scope);
    if (raw === null || raw === undefined || raw === "") return <span className="dsb-muted">—</span>;
    // Admitted / Discharged / Critical… carry their icon, read off the stored
    // code first ("IN", "RFI") and then off the words shown for it.
    const st = column.statusIcon === false ? null : statusIcon(stored) || statusIcon(raw);
    return (
      <span className="dsb-chip" style={{ background: c.bg, color: c.fg, borderColor: c.border || "transparent" }}>
        {st ? <Icon name={st.icon} size={11} /> : null}
        {String(raw)}
      </span>
    );
  }
  if (type === "icon") {
    return <Icon name={column.icon || "Info"} size={15} color={column.iconColor || "var(--dsb-primary)"} />;
  }
  if (type === "link") {
    return (
      <button
        type="button"
        className="dsb-link"
        data-dsb-interactive
        onClick={(e) => {
          e.stopPropagation();
          rememberRow(rt, node, row);
          rt?.runEvent(node, "onRowClick", { row });
        }}
      >
        {formatValue(raw, "text")}
      </button>
    );
  }
  if (type === "frameMenu") {
    return (
      <FrameMenuControl
        rt={rt}
        row={row}
        frameName={column.frameName || ""}
        showPatientHeader={column.showPatientHeader !== false}
        // Closing a screen that changed something (a discharge, a release)
        // has to leave the row it was opened from up to date.
        refresh={() => rt?.refresh?.(node?.props?.dataSourceId || nodeSourceId(node?.id), { force: true })}
      />
    );
  }
  if (type === "actions") {
    return <ActionStrip column={column} row={row} node={node} rt={rt} scope={scope} />;
  }
  const text = formatValue(raw, type, { placeholder: "—", format: column.format, symbol: column.currencySymbol });
  if (!text) return <span className="dsb-muted">—</span>;
  // A column that has been told to keep to N lines cuts the value and offers
  // the whole of it in a bubble; one that has not is left exactly as it was,
  // native title and all.
  // Clamp wins over wrap when both are set: it is the more specific
  // instruction, and a value cannot both stop at two lines and run on.
  /**
   * Long values are cut at 25 characters by default, with the whole value in a
   * hover bubble — a remark or an address no longer stretches the row or
   * pushes the next columns off screen. A column can ask for its own length
   * (Max characters) or opt out altogether (Shorten long text: off), and then
   * wraps or runs on as it did before.
   */
  const limit = column?.shortenText === false ? 0 : Number(column?.maxChars) > 0 ? Number(column.maxChars) : DEFAULT_CELL_CHARS;
  if (column?.clamp || limit > 0) {
    return <TruncatedText text={text} lines={column.clamp} maxChars={limit} />;
  }
  if (column?.wrap) {
    return <span className="dsb-cell-wrap">{text}</span>;
  }
  return <span title={typeof text === "string" ? text : undefined}>{text}</span>;
}

/**
 * Plain text for a card's title / subtitle / status chip. A misconfigured card
 * field can hand back an object or an array; React throws on those, so they
 * collapse to the placeholder instead of taking the screen down.
 */
function cardText(raw, placeholder = "—") {
  if (raw === null || raw === undefined || raw === "") return placeholder;
  if (typeof raw === "object") return placeholder;
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  return String(raw);
}

export const DataTableDef = {
  type: "DataTable",
  label: "Table / Cards",
  icon: "Table",
  category: "Data",
  defaultProps: {
    title: "",
    dataMode: "static",
    staticRows: [],
    apiConfig: createApiConfig(),
    /** Written by the picker's Sync button; design-time only, never fetched. */
    previewRows: [],
    dataSourceId: "",
    columns: DEFAULT_COLUMNS,
    /** Which field identifies a row — see `rowKeyOf` in the render. */
    rowKeyField: "",
    viewMode: "table",
    rowVar: "",
    /** The app's own section heading strip ("details") across the top. */
    sectionHeading: false,
    sectionTitle: "details",
    sectionSecondTitle: "",
    sectionIcon: "",
    sectionColor: "",
    sectionCount: false,
    sectionSearch: false,
    sectionActionLabel: "",
    sectionActionIcon: "",
    showHeader: true,
    showViewToggle: true,
    // Read as `!== false`: screens saved before it existed get the switch.
    headViewToggle: true,
    pageSize: 10,
    /** "10, 25, 50, 100" — a list the user may choose from beside the pager. */
    pageSizeOptions: "",
    paginate: true,
    /** A box over the grid that narrows the rows already loaded. */
    searchable: false,
    /** Which fields it looks in; empty looks in every field of the record. */
    searchFields: [],
    searchPlaceholder: "",
    sortable: true,
    selectable: true,
    multiSelect: false,
    /** Rows the user can drag into a new order (table view, live screen). */
    rowDraggable: false,
    rowDragBy: "handle",
    rowOrderField: "",
    stickyHeader: true,
    resizable: true,
    dense: false,
    headerColor: "",
    zebra: false,
    /**
     * "app" is the grid every hand-coded page in this HIS draws — compact rows,
     * ruled cells, striping, and a header that takes its colour from whichever
     * app theme is switched on. "plain" is the roomier builder grid.
     *
     * Read as `props.skin || "app"`, so a table saved before this existed gets
     * the app look without anybody opening its inspector.
     */
    skin: "app",
    fontSize: "",
    headerBg: "",
    stripeColor: "",
    gridLines: "",
    headerCase: "",
    maxHeight: 420,
    rowHeight: "",
    virtualize: true,
    emptyText: "No records found",
    cardConfig: {
      titleField: "",
      subtitleField: "",
      statusField: "",
      iconField: "",
      icon: "User",
      bodyFields: [],
      columns: 3,
    },
  },
  defaultStyle: {},
  // onRowAction is what a column's icon falls back to when it carries no chain
  // of its own (see `cellClick`) — declared here so the Events tab can author
  // the one handler a table of six icon columns used to need.
  events: ["onRowClick", "onRowSelect", "onRowAction", "onCellChange", "onRowReorder", "onLoad", "onHeadingAction"],
  bindable: true,
  propSchema: [
    p.bool("sectionHeading", "Section heading", GROUPS.CONTENT, {
      hint: "The app's own heading strip across the top — the same bar every hand-coded screen puts over a table (“details”). Same settings as a Page Heading.",
    }),
    p.template("sectionTitle", "Heading text", GROUPS.CONTENT, {
      when: (pr) => !!pr.sectionHeading,
      placeholder: "details",
      hint: "Takes a binding: Bills of {{vars.selectedPatient.PatientName}}",
    }),
    p.text("sectionSecondTitle", "Heading right side text", GROUPS.CONTENT, { when: (pr) => !!pr.sectionHeading }),
    p.text("sectionIcon", "Heading icon key (app icon set)", GROUPS.CONTENT, { when: (pr) => !!pr.sectionHeading }),
    p.color("sectionColor", "Heading accent colour", GROUPS.CONTENT, { when: (pr) => !!pr.sectionHeading }),
    p.bool("sectionCount", "Row count in the heading", GROUPS.CONTENT, { when: (pr) => !!pr.sectionHeading }),
    p.bool("sectionSearch", "Search box in the heading", GROUPS.CONTENT, {
      when: (pr) => !!pr.sectionHeading,
      hint: "Narrows the rows already loaded — the same search as the grid's own box.",
    }),
    p.text("sectionActionLabel", "Heading button label", GROUPS.CONTENT, {
      when: (pr) => !!pr.sectionHeading,
      hint: "Its click runs the table's onHeadingAction event (Events tab).",
    }),
    p.text("sectionActionIcon", "Heading button icon", GROUPS.CONTENT, {
      when: (pr) => !!pr.sectionHeading && !!pr.sectionActionLabel,
    }),
    p.bool("showHeader", "Show heading bar", GROUPS.CONTENT, {
      hint: "The strip over the grid: title, row count, search box, view toggle and refresh. Off, the grid starts at its column headers.",
    }),
    p.text("title", "Title", undefined, { when: (pr) => pr.showHeader !== false }),
    p.text("countLabel", "Count label", undefined, {
      when: (pr) => pr.showHeader !== false,
      placeholder: "Total Records :",
      hint: "The words before the row count on the right of the heading — \u201cTotal Bills/Receipts :\u201d. Empty says \u201cTotal Records :\u201d; inside a card's heading, empty shows the count alone.",
    }),
    p.select(
      "barStyle",
      "Heading bar look",
      [
        { value: "app", label: "App heading (same as the pages and cards)" },
        { value: "builder", label: "Builder strip (old)" },
      ],
      GROUPS.APPEARANCE,
      {
        when: (pr) => pr.showHeader !== false,
        hint: "The app heading is the <Heading /> every page uses — title and row count on the left, search, view switch and refresh on the right.",
      },
    ),
    p.select(
      "dataMode",
      "Rows come from",
      [
        { value: "static", label: "Static rows (edited here)" },
        { value: "api", label: "Dynamic API (data source)" },
        { value: "action", label: "Filled by a button / action" },
        VARS_MODE_OPTION,
      ],
      GROUPS.DATA,
    ),
    ...rowsVarProps(GROUPS.DATA),
    { key: "staticRows", label: "Rows", type: "rows", group: GROUPS.DATA, when: (pr) => (pr.dataMode || "static") === "static" },
    { key: "apiConfig", label: "API endpoint", type: "apiEndpoint", group: GROUPS.DATA, when: (pr) => pr.dataMode === "api" },
    {
      key: "actionNote",
      label: "How this is filled",
      type: "note",
      group: GROUPS.DATA,
      when: (pr) => pr.dataMode === "action",
      // Answers the question this mode actually raises — "why is nothing
      // showing?" — by naming the buttons pointed at this component, or
      // saying plainly that none are.
      text: (ctx) => {
        const feeders = (ctx?.nodes || []).filter((n) =>
          Object.values(n.events || {}).some((list) =>
            (list || []).some((a) => a?.type === "callApi" && a.targetId === ctx.nodeId),
          ),
        );
        if (feeders.length) {
          return `Filled by ${feeders.map((n) => n.name).join(", ")}. Press it in Preview to see real rows; the columns below decide what is shown.`;
        }
        return "Nothing fills this yet. Select a button, open its Events tab, add a Call API action, pick the endpoint, then set \u201cPut the rows into\u201d to this component.";
      },
    },
    p.text("dataSourceId", "Shared data source id", GROUPS.DATA, {
      when: (pr) => pr.dataMode === "api" && !isApiConfigReady(pr.apiConfig),
    }),
    p.columns("columns", "Columns", GROUPS.DATA),
    p.text("rowVar", "Remember clicked row as", GROUPS.DATA, {
      placeholder: "e.g. selectedPatient",
      hint: "Give it a name and every click on a row — the row, a link or an icon — keeps that whole record for the rest of the screen. Empty remembers nothing.",
    }),
    {
      key: "__rowVarUse",
      label: "Use it anywhere",
      type: "note",
      group: GROUPS.DATA,
      when: (pr) => !!String(pr.rowVar || "").trim(),
      text: (ctx) => {
        const name = String(ctx?.props?.rowVar || "").trim();
        const cols = (ctx?.props?.columns || [])
          .filter((c) => c?.key && !["actions", "frameMenu", "checkbox", "serial"].includes(c.type))
          .slice(0, 3);
        return (
          <>
            After a click, <code>{`{{vars.${name}}}`}</code> is that row.
            {cols.length ? (
              <>
                {" "}One field of it:{" "}
                {cols.map((c, i) => (
                  <React.Fragment key={c.key}>
                    {i ? ", " : ""}
                    <code>{`{{vars.${name}.${c.key}}}`}</code>
                  </React.Fragment>
                ))}
                .
              </>
            ) : null}{" "}
            Pick it from <b>Map…</b> in any box — a label, a title, a payload, a “Run only when”. It holds the last
            row clicked until another row is clicked.
          </>
        );
      },
    },
    {
      key: "__rowKeyCheck",
      label: "Row key",
      type: "note",
      group: GROUPS.DATA,
      // Only says something when there is something wrong to say.
      when: (pr) => !!rowKeyProblem(pr),
      text: (ctx) => rowKeyProblem(ctx?.props),
    },
    p.dataKey("rowKeyField", "Row key field", GROUPS.DATA, {
      hint: "The field that identifies a row — a receipt or transaction number. Ticks, edits and selections are remembered against it, so they survive sorting and paging. Without one the grid falls back to position, which is only safe on a list nobody sorts.",
    }),
    p.select("viewMode", "View mode", [
      { value: "table", label: "Table view" },
      { value: "card", label: "Card view" },
    ]),
    p.bool("showViewToggle", "Show view toggle"),
    p.bool("headViewToggle", "Table / card switch in the card heading", GROUPS.BEHAVIOUR, {
      hint: "When this table sits in a Card / Panel, its toolbar moves into the card's heading. There the table / card view switch shows unless this is turned off — whatever Show view toggle says.",
    }),
    p.bool("paginate", "Paginate"),
    p.number("pageSize", "Page size"),
    p.text("pageSizeOptions", "Page size options", GROUPS.BEHAVIOUR, {
      when: (pr) => pr.paginate !== false,
      placeholder: "10, 25, 50, 100",
      hint: "Shown as a dropdown beside the pager, so the user picks how many rows a page holds. Empty keeps the page size above and draws no dropdown.",
    }),
    p.bool("searchable", "Search box", GROUPS.BEHAVIOUR, {
      hint: "A box over the grid that narrows the rows ALREADY loaded — no call goes out as the user types.",
    }),
    p.dataKeys("searchFields", "Search in", GROUPS.BEHAVIOUR, {
      when: (pr) => !!pr.searchable,
      placeholder: "Add a field to search…",
      emptyNote: "Every field of the record. Add fields to search only those — Bill No and Doctor, not the amount.",
      hint: "Several words must each be found in one of these fields: “sharma 500” is the doctor AND the amount.",
    }),
    p.text("searchPlaceholder", "Search placeholder", GROUPS.BEHAVIOUR, {
      when: (pr) => !!pr.searchable,
      placeholder: "Empty names the fields — “Search Bill No, Doctor…”",
    }),
    p.bool("sortable", "Sortable columns"),
    p.bool("selectable", "Row selection"),
    p.bool("multiSelect", "Multi row select"),
    p.bool("rowDraggable", "Drag rows to reorder", GROUPS.BEHAVIOUR, {
      hint: "The user drags a row up or down to change the order — a priority list, a sequence of tests. The new order is what {{grid.<table>.rows}} sends on Save, and the table's onRowReorder event runs with {{row}} (the moved one), {{from}} and {{to}} (positions from 0) and {{rows}} (the new order). Table view only; off while a column is sorted.",
    }),
    p.select(
      "rowDragBy",
      "Drag by",
      [
        { value: "handle", label: "Grip at the start of the row" },
        { value: "row", label: "Anywhere on the row" },
      ],
      GROUPS.BEHAVIOUR,
      { when: (pr) => !!pr.rowDraggable },
    ),
    p.text("rowOrderField", "Write the position into", GROUPS.BEHAVIOUR, {
      when: (pr) => !!pr.rowDraggable,
      placeholder: "e.g. SortOrder",
      hint: "After a drop every row gets its new position (1, 2, 3…) in this field, so the saved payload carries the order. Empty only moves the rows.",
    }),
    p.bool("stickyHeader", "Sticky header"),
    p.number("freezeStart", "Freeze columns at the start", GROUPS.LAYOUT, {
      placeholder: "0",
      hint: "How many columns from the left stay in place while the rest of the grid scrolls sideways — the patient id and name, say. 0 or empty freezes none.",
    }),
    p.text("freezeEnd", "Freeze columns at the end", GROUPS.LAYOUT, {
      placeholder: "auto",
      hint: "How many columns from the right stay in place. Empty or auto: every trailing column holding a button, icon or control (Edit, Print, Remove…). 0 freezes none.",
    }),
    p.color("freezeBg", "Frozen column colour", GROUPS.APPEARANCE, {
      hint: "The background of the columns that stay in place, so they read as apart from the ones that scroll. Empty uses a soft tint of the theme.",
    }),
    p.bool("resizable", "Resizable columns"),
    p.select(
      "skin",
      "Look",
      [
        { value: "app", label: "App table — compact, follows the theme" },
        { value: "plain", label: "Builder — roomy" },
      ],
      GROUPS.APPEARANCE,
      {
        hint: "The app look matches the tables on the hand-coded pages: 13px, tight rows, ruled cells, striping, and the header colour of whichever theme is on. Everything below still overrides it.",
      },
    ),
    p.number("fontSize", "Font size (px)", GROUPS.APPEARANCE, {
      hint: "Empty follows the look — 13px for the app table.",
    }),
    p.select(
      "headerCase",
      "Header text",
      [
        { value: "", label: "Follow the look" },
        { value: "normal", label: "As typed" },
        { value: "upper", label: "UPPERCASE" },
      ],
      GROUPS.APPEARANCE,
    ),
    p.select(
      "gridLines",
      "Grid lines",
      [
        { value: "", label: "Follow the look" },
        { value: "all", label: "Rows and columns" },
        { value: "rows", label: "Rows only" },
        { value: "none", label: "None" },
      ],
      GROUPS.APPEARANCE,
    ),
    p.bool("dense", "Dense rows"),
    p.bool("zebra", "Zebra striping"),
    p.color("headerBg", "Header background", GROUPS.APPEARANCE, {
      hint: "Empty takes the colour the app theme gives every other table on the screen.",
    }),
    p.color("stripeColor", "Stripe colour", GROUPS.APPEARANCE),
    p.color("headerColor", "Header label colour"),
    p.text("maxHeight", "Max body height", GROUPS.LAYOUT, { placeholder: "420, 420px or 60vh" }),
    p.number("rowHeight", "Row height (px)", GROUPS.LAYOUT, {
      hint: "Empty follows the look — 30px for the app table, 38 for the builder one.",
    }),
    p.bool("virtualize", "Virtualise long lists", GROUPS.BEHAVIOUR),
    p.text("emptyText", "Empty text"),
    { key: "cardConfig", label: "Card layout", type: "cardConfig", group: GROUPS.APPEARANCE },
  ],
  render: ({ node, props, style, rt, scope }) => {
    const { rows: apiRows, loading, error, sourceId, local: localSeq, focus: localFocus } = resolveRows(node, props, rt);
    // Sitting in a card whose heading has kept a spot for this table's toolbar
    // (runtime/cardHeadSlot): the toolbar goes up there, not on a row of its own.
    const headSlot = useContext(CardHeadSlot);
    const inCardHead = !!headSlot && headSlot.tableId === node.id;
    // Rows changed on the screen (Add row / Remove row) are the same list with
    // one more or one fewer — not a new result, so the page stays where it is.
    const localRef = useRef(localSeq);
    localRef.current = localSeq;

    // A component with its own endpoint loads itself when the rendered screen
    // opens — that is the "call the same API when the page loads" half. The
    // canvas never fires it: a designer typing in the inspector should not be
    // hitting a live endpoint on every keystroke.
    const api = props.apiConfig;
    const apiKey = useMemo(() => (isApiConfigReady(api) ? JSON.stringify(normalizeApiConfig(api)) : ""), [api]);
    const refreshNode = rt?.refreshNode;
    const design = !!rt?.design;
    useEffect(() => {
      if (!apiKey || design || !refreshNode) return;
      const cfg = JSON.parse(apiKey);
      if (cfg.autoLoad === false) return;
      refreshNode(node.id, cfg);
    }, [apiKey, design, refreshNode, node.id]);
    /**
     * Configured columns, or the data's own if none are.
     *
     * A grid filled by a button never met the endpoint picker, so nobody
     * pressed Sync and nothing wrote its columns. Falling back to the keys the
     * rows actually have means the data shows up straight away; opening the
     * column designer then adds real headers, widths and colour rules on top.
     * An empty column list is never a deliberate "show nothing".
     */
    const columns = useMemo(() => {
      const set = (props.columns || []).filter((c) => c && c.visible !== false);
      if (set.length) return set;
      return apiRows.length ? deriveColumns(apiRows, { max: 12 }) : [];
    }, [props.columns, apiRows]);

    /**
     * What identifies a row, for a tick, an edit and a selection alike.
     *
     * This used to fall back to the row's position, with the page number mixed
     * in — and three callers disagreed about what the position meant. The
     * header box wrote keys against the whole result while the rendered rows
     * read keys against the page, so select-all showed twenty ticked and
     * handed 545 rows to the payload. A key that changes when somebody pages
     * is not an identity.
     *
     * `rowKeyField` is the fix; the id guesses stay for grids that never
     * needed one, and the positional fallback stays for grids whose rows
     * genuinely have nothing unique. It no longer carries the page.
     */
    const rowKeyOf = useCallback(
      (row, i) => {
        const named = props.rowKeyField ? getPath(row, props.rowKeyField) : undefined;
        if (named !== undefined && named !== null && named !== "") return String(named);
        const guessed = row?.id ?? row?.Id ?? row?.ID;
        if (guessed !== undefined && guessed !== null && guessed !== "") return String(guessed);
        return `i_${i}`;
      },
      [props.rowKeyField],
    );

    /**
     * Every row's key, in order.
     *
     * A key must name ONE row. An endpoint that sends `ID: 0` on every record,
     * or a Row key field that repeats (the same UHID on two visits), made
     * every such row the same row — tick one and all of them ticked. A repeat
     * takes a numbered suffix; the first keeps the plain key, so a screen
     * whose keys were already unique sees no change.
     */
    const rowIds = useCallback(
      (list) => {
        const seen = new Map();
        return list.map((row, i) => {
          const base = rowKeyOf(row, i);
          const n = seen.get(base) || 0;
          seen.set(base, n + 1);
          return n ? `${base}#${n}` : base;
        });
      },
      [rowKeyOf],
    );

    /**
     * The endpoint's rows with the user's edits and ticks laid over them.
     *
     * Everything below reads this — cells, row actions, colour rules,
     * conditions, totals — so the grid cannot show one value and send another.
     * Before this, a row action read the row the endpoint sent: pick "OPD
     * Card", untick the logo, press reprint, and the payload still carried
     * what had arrived from the server.
     *
     * The merge is keyed by `rowKeyOf` against the UNSORTED rows, which is the
     * same basis the ticks were recorded on, so sorting cannot move a tick.
     * The canvas is left alone: nothing is edited there.
     */
    /**
     * The resolved column defaults, as a plain string.
     *
     * The merge below needs the scope to interpolate a default like
     * "{{values.PrintType}}", but `scope` is a fresh object on every render and
     * depending on it would rebuild every row of a 545-row grid each time. This
     * is the part of the scope the merge can actually see, so it is what the
     * memo keys on; the scope itself is read through a ref.
     */
    const scopeRef = useRef(scope);
    scopeRef.current = scope;
    const defaultsKey = useMemo(
      () =>
        columns
          .filter((c) => c && c.defaultValue !== undefined)
          .map((c) => `${c.key}=${typeof c.defaultValue === "string" ? interpolate(c.defaultValue, scope || {}) : c.defaultValue}`)
          .join("|"),
      [columns, scope],
    );

    const { rows, keyFor } = useMemo(() => {
      const map = new Map();
      const editCols = columns.filter((c) => EDIT_CONTROLS.includes(c.control));
      const checkCols = columns.filter((c) => c.control === "checkbox");
      const merging = !rt?.design && (editCols.length > 0 || checkCols.length > 0);

      const ids = rowIds(apiRows);
      const out = apiRows.map((row, i) => {
        const id = ids[i];
        if (!merging) {
          map.set(row, id);
          return row;
        }
        let next = row;
        editCols.forEach((c) => {
          const cells = rt?.ui?.cells?.[`${node.id}:${c.key}`];
          // cellValue, not the raw map: it is what the cell DISPLAYS, and a
          // column default is part of that. Without it the grid showed "Receipt"
          // in a print-type column the endpoint never sent, while {{row.PrintType}}
          // read undefined and the row action branched as though it were blank.
          const v = cellValue(cells, id, row, c, scopeRef.current);
          if (v === undefined || v === row?.[c.key]) return;
          if (next === row) next = { ...row };
          next[c.key] = v;
        });
        checkCols.forEach((c) => {
          const on = isChecked(rt?.ui?.checks?.[`${node.id}:${c.key}`], id, row, c);
          if (next === row) next = { ...row };
          next[c.key] = on;
        });
        // Both objects answer to the same key: the merged one is what the rest
        // of the component sees, the original is what `edited` compares against.
        map.set(next, id);
        if (next !== row) map.set(row, id);
        return next;
      });
      return { rows: out, keyFor: map };
    }, [apiRows, columns, rt?.ui?.cells, rt?.ui?.checks, rt?.design, rowIds, node.id, defaultsKey]);

    /**
     * Forget the ticks and edits when the rows are replaced.
     *
     * A tick recorded against the previous search points at a row that is no
     * longer on screen — and with a positional key it points at whichever row
     * has taken that place, which is somebody else's bill. Clearing on reload
     * is the other half of giving rows an identity.
     */
    const setChecks = rt?.setChecks;
    const setCells = rt?.setCells;
    const seenRowsRef = useRef(apiRows);
    // The list a drag just wrote: the same rows in another order, whose ticks
    // and edits were carried over by `moveRow` — not a new result to forget.
    const reorderedRef = useRef(null);
    useEffect(() => {
      if (rt?.design) return;
      if (seenRowsRef.current === apiRows) return;
      seenRowsRef.current = apiRows;
      if (reorderedRef.current === apiRows) {
        reorderedRef.current = null;
        return;
      }
      columns.forEach((c) => {
        if (c.control === "checkbox") setChecks?.(`${node.id}:${c.key}`, {});
        else if (EDIT_CONTROLS.includes(c.control)) setCells?.(`${node.id}:${c.key}`, {});
      });
      setSelected([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiRows]);
    const [pickedView, setView] = useState(props.viewMode || "table");
    useEffect(() => setView(props.viewMode || "table"), [props.viewMode]);
    // On a phone — the builder's Mobile canvas or a real narrow window — the
    // grid is cards only: no table, and no switch back to one.
    const phoneViewport = usePhoneViewport();
    // A Nested Row Table draws its sub-rows between table rows, so it stays a table.
    const forceCards = !props.__nest && ((rt?.breakpoint || "desktop") === "mobile" || phoneViewport);
    const view = forceCards ? "card" : pickedView;

    /**
     * Column totals, summed over every row in the result rather than the page
     * on screen — a total that changed when you paged would be worse than none.
     * null when no column asks for one, so the footer is not rendered at all.
     */
    const totalCols = useMemo(() => columns.filter((c) => c.isTotal), [columns]);

    const [sort, setSort] = useState({ key: "", dir: "asc" });
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState([]);
    const [widths, setWidths] = useState({});
    const [scrollTop, setScrollTop] = useState(0);
    const bodyRef = useRef(null);

    /**
     * The rows the search box keeps.
     *
     * It filters what is already loaded rather than calling again, which is
     * what the hand-coded pages do with their own "search in the list" box.
     * Ticks and edits are merged in `rows` before this, so hiding a row and
     * showing it again does not lose what was typed into it.
     */
    const [query, setQuery] = useState("");
    const searchKeys = useMemo(
      () => (Array.isArray(props.searchFields) ? props.searchFields.filter((k) => typeof k === "string" && k.trim()) : []),
      [props.searchFields],
    );
    const shown = useMemo(() => searchRows(rows, query, searchKeys), [rows, query, searchKeys]);

    // Back to the first page when the ROWS are replaced, not when their count
    // changes: searching for one patient from page 3 and happening to get the
    // same number of rows used to leave the grid showing 41-60 of a list that
    // no longer existed. `apiRows` and not `rows` on purpose — `rows` gets a
    // new identity every time somebody ticks a box, and paging back to the top
    // mid-edit is its own bug.
    useEffect(() => {
      if (!localRef.current) setPage(0);
    }, [apiRows]);
    useEffect(() => setPage(0), [sort.key, sort.dir, query]);

    const totals = useMemo(() => {
      if (!totalCols.length) return null;
      const acc = {};
      totalCols.forEach((c) => {
        acc[c.key] = shown.reduce((sum, r) => {
          const n = Number(getPath(r, c.key));
          return Number.isNaN(n) ? sum : sum + n;
        }, 0);
      });
      return acc;
    }, [totalCols, shown]);

    const sorted = useMemo(() => {
      if (!sort.key) return shown;
      // A date column must sort as a date. `parseFloat("20-May-2026")` is 20,
      // so every date column in the product used to sort by day of month —
      // ascending gave 9/1, 8/1, 8/1 and nobody could see why.
      //
      // Only date and datetime change. Everything else keeps the old
      // number-then-text path deliberately: a `text` column holding numeric
      // ids sorts numerically today, and screens already rely on that.
      const col = columns.find((c) => c.key === sort.key);
      const asDate = col && (col.type === "date" || col.type === "datetime");
      const copy = [...shown];
      copy.sort((a, b) => {
        const av = getPath(a, sort.key);
        const bv = getPath(b, sort.key);
        let r;
        if (asDate) {
          const am = sortableDate(av);
          const bm = sortableDate(bv);
          // Unparseable values sink, in both directions, rather than shuffling.
          if (am === null && bm === null) r = 0;
          else if (am === null) r = 1;
          else if (bm === null) r = -1;
          else r = am - bm;
        } else {
          const an = parseFloat(av);
          const bn = parseFloat(bv);
          if (!Number.isNaN(an) && !Number.isNaN(bn)) r = an - bn;
          else r = String(av ?? "").localeCompare(String(bv ?? ""));
        }
        return sort.dir === "asc" ? r : -r;
      });
      return copy;
    }, [shown, sort, columns]);

    /**
     * How many rows a page holds: the number set in the inspector, unless the
     * designer offered a list and the user picked from it.
     */
    const sizeOptions = useMemo(() => {
      const list = String(props.pageSizeOptions || "")
        .split(/[\s,;]+/)
        .map((n) => parseInt(n, 10))
        .filter((n) => Number.isFinite(n) && n > 0);
      return [...new Set(list)].sort((a, b) => a - b);
    }, [props.pageSizeOptions]);
    const [pickedSize, setPickedSize] = useState(0);
    // Page 7 of 2-row pages is not page 7 of 50-row pages: a size change starts
    // again at the top rather than landing past the end of the list.
    useEffect(() => setPage(0), [pickedSize]);
    const basePageSize = Math.max(1, Number(props.pageSize) || 10);
    const pageSize = props.paginate
      ? pickedSize && sizeOptions.includes(pickedSize)
        ? pickedSize
        : basePageSize
      : sorted.length || 1;
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    // A removed row can leave the page past the end; an added one is shown
    // where it went, so the user sees the row their button made.
    useEffect(() => {
      if (page > pageCount - 1) setPage(pageCount - 1);
    }, [page, pageCount]);
    useEffect(() => {
      if (!localSeq || !props.paginate) return;
      if (localFocus === "end") setPage(pageCount - 1);
      else if (localFocus === "start") setPage(0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localSeq]);
    const pageRows = useMemo(
      () => (props.paginate ? sorted.slice(page * pageSize, page * pageSize + pageSize) : sorted),
      [sorted, page, pageSize, props.paginate],
    );

    // Empty follows the look: the written pages fit a row in 30px, the roomier
    // builder grid in 38. A number typed in the inspector beats both.
    const rowH = Number(props.rowHeight) || ((props.skin || "app") === "app" ? 30 : 38);
    // A stored screen holds a number and keeps working; `60vh` is now sayable
    // too. The virtualiser still needs a number, so it falls back to the
    // default when the height is not in pixels.
    const maxHRaw = props.maxHeight === 0 || props.maxHeight ? props.maxHeight : 420;
    const maxH = typeof maxHRaw === "number" ? maxHRaw : Number(String(maxHRaw).replace(/px$/i, "")) || 420;
    const maxHCss = typeof maxHRaw === "number" ? `${maxHRaw}px` : String(maxHRaw);
    const virtual = props.virtualize !== false && pageRows.length > 60;
    const first = virtual ? Math.max(0, Math.floor(scrollTop / rowH) - 6) : 0;
    const last = virtual ? Math.min(pageRows.length, Math.ceil((scrollTop + maxH) / rowH) + 6) : pageRows.length;
    const windowRows = virtual ? pageRows.slice(first, last) : pageRows;

    const rowKey = (row, i) => keyFor.get(row) ?? rowKeyOf(row, i);

    /* ------------------------------------------------- checkbox columns */

    const tickId = (c) => `${node.id}:${c.key}`;

    /** The records ticked in one column right now. */
    const tickedRows = (c) => {
      const map = rt?.ui?.checks?.[tickId(c)] || {};
      return rows.filter((row, i) => isChecked(map, rowKey(row, i), row, c));
    };

    /**
     * One row: written into the map so it can override the data's own value.
     *
     * A tick can be refused. "Same patient only" and "settlement and refund
     * cannot go together" are decided as each box is ticked on the hand-coded
     * pages, and a built screen could only check them later — on the button
     * that acts on the selection, by which point the user has ticked six
     * things and is told that one of them was wrong.
     *
     * The rule is written against the row being ticked, with the selection so
     * far in scope as {{ticked}} and its first record as {{first}}. With
     * nothing ticked yet `first` IS this row, so a rule that says "the same
     * patient as the first one" lets the first tick through instead of
     * blocking every one of them.
     */
    const tickOne = (c, rowId, on, row) => {
      const tests = Array.isArray(c?.tickWhen) ? c.tickWhen.filter((t) => t && t.op) : [];
      if (on && tests.length) {
        const ticked = tickedRows(c);
        const gateScope = {
          ...(scope || {}),
          row,
          ...(row || {}),
          ticked,
          tickedCount: ticked.length,
          first: ticked[0] || row || {},
        };
        if (!whenPasses(tests, gateScope)) {
          toast.warn(tr(c.tickMessage || "That row cannot be selected with the others"));
          return;
        }
      }
      const cur = rt?.ui?.checks?.[tickId(c)] || {};
      rt?.setChecks?.(tickId(c), { ...cur, [rowId]: on });
    };

    /**
     * The header box.
     *
     * Every row in the RESULT, not just the page on screen DASH a "select all"
     * that quietly meant "this page" is how the wrong records get processed.
     */
    const tickAll = (c, on) => {
      const map = {};
      rows.forEach((row, i) => {
        map[rowKey(row, i)] = on;
      });
      rt?.setChecks?.(tickId(c), map);
    };

    /* ------------------------------------------------ editable columns */

    /** One cell: written into the map so it can override the row's own value. */
    const setCell = (c, rowId, value) => {
      const cur = rt?.ui?.cells?.[tickId(c)] || {};
      rt?.setCells?.(tickId(c), { ...cur, [rowId]: value });
    };

    /**
     * Publish what the grid holds, so an action can save it.
     *
     * Row identity belongs to the table (`id`/`Id`/`ID`, else position), so the
     * runtime cannot merge edits into rows on its own — the table hands over
     * the merged result instead, reachable as {{grid.<nodeId>.rows}}, `.edited`
     * (only the rows touched by hand) and `.checked` (only the ticked ones).
     */
    const cellMaps = rt?.ui?.cells;
    const tickMaps = rt?.ui?.checks;
    const publish = rt?.setGrid;
    // What was last published, so an unchanged grid is never written again.
    const publishedRef = useRef(null);

    useEffect(() => {
      if (rt?.design || !publish) return;
      const editCols = columns.filter((c) => EDIT_CONTROLS.includes(c.control));
      const checkCols = columns.filter((c) => c.control === "checkbox");
      // `rows` is already merged — this reports what is on screen rather than
      // working it out a second time against a different index basis, which is
      // how the two used to disagree.
      const out = rows;
      const edited = rows.filter((r, i) => r !== apiRows[i]);
      const ticked = (c) =>
        rows.filter((r, i) => isChecked(tickMaps?.[`${node.id}:${c.key}`], rowKey(r, i), apiRows[i], c));

      // Kept as it is: the union of every tick column. Stored screens read
      // {{grid.x.checked}} and redefining it would change what they send,
      // silently, at runtime.
      const checked = rows.filter((r) => checkCols.some((c) => r[c.key]));
      // Per column, because a grid with three tick columns cannot say which
      // one it means with a single list — and this one has three, of which two
      // are data the user edits rather than a selection.
      const checkedBy = checkCols.reduce((acc, c) => {
        acc[c.key] = ticked(c);
        return acc;
      }, {});
      // The built-in selection strip, which had no way into a payload at all.
      const selectedRows = props.selectable ? rows.filter((r, i) => selected.includes(rowKey(r, i))) : [];
      // The slice on screen. Every other list here spans the whole result, so
      // a heading that wants to count what the user can actually see — which
      // is what the hand-coded pages do — had nothing to read.
      const shown = pageRows;

      // Publishing writes runtime state, which re-renders this component. If
      // the result is the same as last time, writing it again is a loop with
      // extra steps.
      const prev = publishedRef.current;
      const same =
        prev &&
        sameRows(prev.rows, out) &&
        sameRows(prev.edited, edited) &&
        sameRows(prev.checked, checked) &&
        sameRows(prev.selected, selectedRows) &&
        sameRows(prev.pageRows, shown) &&
        checkCols.every((c) => sameRows(prev.checkedBy?.[c.key], checkedBy[c.key]));
      if (same) return;

      publishedRef.current = { rows: out, edited, checked, checkedBy, selected: selectedRows, pageRows: shown };
      const grid = { rows: out, edited, checked, checkedBy, selected: selectedRows, pageRows: shown };
      // Which list these rows were drawn from, so Add row / Remove row can
      // tell a current publish from one left by a table no longer on screen.
      // Not enumerable: {{grid.x}} in a payload stays what it always was.
      Object.defineProperty(grid, "__base", { value: apiRows, enumerable: false });
      publish(node.id, grid);
    }, [rows, apiRows, pageRows, columns, cellMaps, tickMaps, publish, node.id, rt?.design, rowKeyOf, selected, props.selectable]);

    /* ---------------------------------------------- cell validation */

    /**
     * The cells the last Validate failed: { [columnKey]: { [rowId]: true } }.
     *
     * A flag, not the message — the cell works its message out from its own
     * value, so correcting it clears the red straight away. Forgotten with the
     * rows, like every edit and tick.
     */
    const [cellFlags, setCellFlags] = useState({});
    const [reveal, setReveal] = useState(null);
    const gridRootRef = useRef(null);
    useEffect(() => {
      setCellFlags((prev) => (Object.keys(prev).length ? {} : prev));
      setReveal(null);
    }, [apiRows]);

    /**
     * Check every editable cell of the grid against its column's rules.
     *
     * Which rows count is the column's own choice ("Check rows"): all of them,
     * only the ones edited by hand ({{grid.x.edited}}) or only the ticked ones
     * ({{grid.x.checked}}) — the same lists a save sends, so a row that is not
     * being sent is not what blocks it. A cell that is locked, hidden or
     * replaced on its row takes no input and is never failed.
     */
    const validateCellsRef = useRef(null);
    validateCellsRef.current = ({ reveal: jump = true } = {}) => {
      // Columns that carry rules at all; the rules themselves are worked out
      // per row below, since a {{row.…}} Min / Max differs row by row.
      const ruled = columns.filter((c) => EDIT_CONTROLS.includes(c.control) && c.validation && typeof c.validation === "object");
      if (!ruled.length) return { count: 0 };
      const checkCols = columns.filter((c) => c.control === "checkbox");
      const sc = scopeRef.current;
      const flags = {};
      let count = 0;
      let firstId = null;
      rows.forEach((row, i) => {
        const id = rowKey(row, i);
        const edited = row !== apiRows[i];
        const ticked = checkCols.some((cc) => row?.[cc.key]);
        ruled.forEach((c) => {
          const which = c.validation?.rows || "all";
          if (which === "edited" && !edited) return;
          if (which === "checked" && !ticked) return;
          const rules = cellRulesOf(c, c.control === "number" ? cellBoundsOf(c, node, row, sc) : null);
          if (!rules) return;
          if (!cellTakesInput(c, row, sc)) return;
          if (!cellRulesApply(c, row, sc, node)) return;
          const value = cellValue(rt?.ui?.cells?.[tickId(c)], id, apiRows[i], c, sc);
          if (!validateValue(value, cellRulesForRow(rules, c, node, row, sc))) return;
          (flags[c.key] = flags[c.key] || {})[id] = true;
          count += 1;
          if (firstId === null) firstId = id;
        });
      });
      setCellFlags(flags);
      if (count && jump && firstId !== null) setReveal({ id: firstId, at: Date.now() });
      return { count };
    };

    useEffect(() => {
      if (rt?.design || !rt?.registerGridValidator) return undefined;
      return rt.registerGridValidator(node.id, (opts) => validateCellsRef.current?.(opts) || { count: 0 });
    }, [rt?.design, rt?.registerGridValidator, node.id]);

    /**
     * Bring the first failed cell into view: out of a quick search that hides
     * it, onto its page, into the scrolled window, then focus it.
     */
    useEffect(() => {
      if (!reveal) return undefined;
      const idx = sorted.findIndex((r, i) => rowKey(r, i) === reveal.id);
      if (idx < 0) {
        if (query) setQuery("");
        else setReveal(null);
        return undefined;
      }
      if (props.paginate) {
        const want = Math.floor(idx / pageSize);
        if (want !== page) {
          setPage(want);
          return undefined;
        }
      }
      const inPage = props.paginate ? idx - page * pageSize : idx;
      if (virtual && bodyRef.current) {
        const top = Math.max(0, (inPage - 2) * rowH);
        bodyRef.current.scrollTop = top;
        setScrollTop(top);
      }
      setReveal(null);
      // Not cleared on re-run: clearing `reveal` above re-runs this effect, and
      // a cleanup would cancel the focus before the cell had rendered red.
      setTimeout(() => {
        const box = gridRootRef.current?.querySelector(".dsb-cell-input.is-invalid, .dsb-cell-ac.is-invalid input");
        if (!box) return;
        box.scrollIntoView?.({ block: "nearest", inline: "nearest" });
        box.focus?.({ preventScroll: true });
      }, 80);
      return undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reveal, sorted, page, pageSize, query]);

    /** Whether the header box reads as on, off, or part-way. */
    const checkState = (c) => {
      const ticks = rt?.ui?.checks?.[tickId(c)];
      let on = 0;
      rows.forEach((row, i) => {
        if (isChecked(ticks, rowKey(row, i), apiRows[i], c)) on += 1;
      });
      return { all: rows.length > 0 && on === rows.length, some: on > 0, count: on };
    };

    const onRowClick = useCallback(
      (row, key) => {
        if (props.selectable) {
          setSelected((prev) => {
            if (props.multiSelect) return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
            return prev[0] === key ? [] : [key];
          });
          rt?.setSelection?.(node.id, row);
        }
        rememberRow(rt, node, row);
        rt?.runEvent(node, "onRowClick", { row });
        rt?.runEvent(node, "onRowSelect", { row });
      },
      [props.selectable, props.multiSelect, rt, node],
    );

    const startResize = (e, key) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = widths[key] || 140;
      // Right to left the handle is on the column's left edge, so the column
      // grows as the pointer moves left.
      const sign = getComputedStyle(e.currentTarget).direction === "rtl" ? -1 : 1;
      const move = (ev) => setWidths((w) => ({ ...w, [key]: Math.max(60, startW + sign * (ev.clientX - startX)) }));
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    const toggleSort = (col) => {
      // Sorting BY the row number is meaningless: it is the position, and the
      // position is what sorting decides.
      if (!props.sortable || col.sortable === false || col.type === "serial") return;
      setSort((s) => {
        if (s.key !== col.key) return { key: col.key, dir: "asc" };
        if (s.dir === "asc") return { key: col.key, dir: "desc" };
        // A sorted grid cannot be dragged, so a third click has to give the
        // user's own order back — otherwise one sort locks the rows for good.
        return props.rowDraggable ? { key: "", dir: "asc" } : { key: col.key, dir: "asc" };
      });
    };

    /* --------------------------------------------------- draggable rows */

    // The grip shows on the canvas too, so the designer sees the column it
    // takes; only a live screen moves anything.
    const dragBy = props.rowDraggable ? props.rowDragBy || "handle" : "";
    const gripCol = dragBy === "handle";
    const canDrag = !!dragBy && !rt?.design && !sort.key && !!rt?.setGridRows;
    const [dragKey, setDragKey] = useState("");
    const [dropAt, setDropAt] = useState(null);
    const endDrag = () => {
      setDragKey("");
      setDropAt(null);
    };

    /**
     * Move one row before or after another, in the list the table reads.
     *
     * The move is made on the raw rows, not the merged ones, so the edits and
     * ticks stay in the runtime's maps and {{grid.x.edited}} still knows which
     * rows were touched. A key that was only a position moves with its row.
     */
    const moveRow = (fromKey, toKey, after) => {
      if (!fromKey || fromKey === toKey) return;
      const from = apiRows.findIndex((r) => keyFor.get(r) === fromKey);
      const target = apiRows.findIndex((r) => keyFor.get(r) === toKey);
      if (from < 0 || target < 0) return;
      const list = [...apiRows];
      const [moved] = list.splice(from, 1);
      const to = list.indexOf(apiRows[target]) + (after ? 1 : 0);
      list.splice(to, 0, moved);
      if (list.every((r, i) => r === apiRows[i])) return;

      const field = String(props.rowOrderField || "").trim();
      const next = field ? list.map((r, i) => (r && r[field] === i + 1 ? r : { ...r, [field]: i + 1 })) : list;

      const newIds = rowIds(next);
      const remap = {};
      list.forEach((r, i) => {
        const old = keyFor.get(r);
        if (old !== undefined && old !== newIds[i]) remap[old] = newIds[i];
      });
      if (Object.keys(remap).length) {
        const rekey = (m) =>
          Object.keys(m).reduce((acc, k) => {
            acc[remap[k] ?? k] = m[k];
            return acc;
          }, {});
        (props.columns || []).forEach((c) => {
          if (!c?.key) return;
          const id = tickId(c);
          if (c.control === "checkbox" && rt?.ui?.checks?.[id]) rt.setChecks?.(id, rekey(rt.ui.checks[id]));
          else if (EDIT_CONTROLS.includes(c.control) && rt?.ui?.cells?.[id]) rt.setCells?.(id, rekey(rt.ui.cells[id]));
        });
        setSelected((prev) => prev.map((k) => remap[k] ?? k));
      }

      reorderedRef.current = next;
      rt.setGridRows(node.id, next);
      rt?.runEvent(node, "onRowReorder", { row: next[to], from, to, rows: next });
    };

    /**
     * What starts a drag: the grip, or the whole row.
     *
     * Only the grip is `draggable` in handle mode, so text in a row can still
     * be selected and its inputs typed into; the row is still what the user
     * sees following the pointer.
     */
    const dragStartProps = (key) => ({
      draggable: true,
      onDragStart: (e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("text/plain", key);
          const tr = e.currentTarget.closest("tr");
          if (tr && tr !== e.currentTarget) e.dataTransfer.setDragImage(tr, e.nativeEvent.offsetX || 12, (tr.offsetHeight || 30) / 2);
        } catch (err) {
          // Some browsers refuse custom data; the key is in state anyway.
        }
        setDragKey(key);
      },
    });

    /** The drag wiring of one table row. */
    const dragProps = (key) => {
      if (!canDrag) return {};
      return {
        ...(dragBy === "row" ? dragStartProps(key) : {}),
        onDragOver: dragKey
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const box = e.currentTarget.getBoundingClientRect();
              const after = e.clientY > box.top + box.height / 2;
              if (dropAt?.key !== key || dropAt?.after !== after) setDropAt({ key, after });
            }
          : undefined,
        onDrop: dragKey
          ? (e) => {
              e.preventDefault();
              moveRow(dragKey, key, dropAt?.key === key ? dropAt.after : false);
              endDrag();
            }
          : undefined,
        onDragEnd: endDrag,
      };
    };

    const dragRowCls = (key) => {
      if (!dragBy) return "";
      let cls = canDrag && dragBy === "row" ? " is-grab" : "";
      if (dragKey === key) cls += " is-dragging";
      else if (dragKey && dropAt?.key === key) cls += dropAt.after ? " is-drop-after" : " is-drop-before";
      return cls;
    };

    const cc = props.cardConfig || {};

    // Card layout falls back to real columns when it was never configured:
    // getPath(row, "") returns the row itself, and React cannot render an
    // object — switching to card view on a fresh grid used to crash.
    // Not a button, icon or tick box either: a card titled by its Consent
    // button's (empty) field reads "—".
    const cardTitleable = (c) => c && !["serial", "action", "actions", "frameMenu"].includes(c.type) && !isCardFootColumn(c) && c.key;
    // A name reads as a card's title ("Mr. AJEET YADAV"); the first column
    // often does not — a triage code, blank for most rows, titled them "—".
    const cardFallback =
      columns.find((c) => cardTitleable(c) && /name/i.test(`${c.key} ${c.header || ""}`)) || columns.find(cardTitleable);
    const cardTitleField = cc.titleField || cardFallback?.key || "";
    // An action strip and a frame menu are not fields of the record — they are
    // the row's controls. In the table they have a column of their own; in a
    // card they belong along its foot, not as a key/value pair reading
    // "ACTION: —". Card view used to drop them altogether, so a grid whose
    // rows could be worked on became a grid that could only be looked at.
    const cardActionCols = columns.filter((c) => c.type === "actions" || c.type === "frameMenu");
    const cardActions = cc.showActions !== false && cardActionCols.length > 0;
    const cardSubField = cc.subtitleField || "";
    const cardStatusField = cc.statusField || "";

    /*
     * Where the toolbar (count, search, view switch) goes:
     *   - up into the heading of the Card it sits in (runtime/cardHeadSlot);
     *   - else into the table's own section heading, when it has one;
     *   - else into an app heading of its own, titled with the table's Title —
     *     the same <Heading /> every page and card uses ("App heading", the
     *     default look of the bar);
     *   - else, with "Heading bar look: builder", the old strip.
     */
    const showBar = props.showHeader !== false;
    const appBar = (props.barStyle || "app") === "app";
    const toolsInHeading = inCardHead || (showBar && appBar);
    const countText = shown.length !== rows.length ? `${shown.length} / ${rows.length}` : rows.length;
    // The words before the count on the right of the heading. In a card's
    // heading only when set here, since the card's own subtitle usually says
    // it already ("Total Bills/Receipts :").
    const countLabel = props.countLabel === undefined || props.countLabel === null ? "" : String(props.countLabel);
    const countWords = countLabel.trim() ? tr(countLabel) : tr("Total Records :");

    const toolsEl = (
      <div className="dsb-grid-tools" data-dsb-interactive>
        {props.searchable ? (
          <label className="dsb-grid-search">
            <Icon name="Search" size={13} />
            <input
              type="search"
              value={query}
              aria-label="Search"
              placeholder={
                props.searchPlaceholder
                  ? props.searchPlaceholder
                  : searchKeys.length
                    ? `Search ${searchKeys.map((k) => humanizeKey(k)).join(", ")}…`
                    : "Search…"
              }
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        ) : null}
        {/* In a heading the switch has its own setting, on unless turned off:
            a grid given the app's look (migrated screens set showViewToggle
            off) still gets its card view one click away. */}
        {!forceCards && (toolsInHeading ? props.headViewToggle !== false : props.showViewToggle) ? (
          <div className="dsb-seg">
            <button type="button" className={view === "table" ? "is-on" : ""} onClick={() => setView("table")} title="Table view">
              <Icon name="Table2" size={14} />
            </button>
            <button type="button" className={view === "card" ? "is-on" : ""} onClick={() => setView("card")} title="Card view">
              <Icon name="LayoutGrid" size={14} />
            </button>
          </div>
        ) : null}
      </div>
    );


    // The app's own Heading.jsx, not a lookalike: the classic card header
    // ("details") or the modern Aurora bar, whichever design is switched on.
    const sectionHead = props.sectionHeading ? (
      <div className="dsb-table-heading">
        <ProjectHeading
          title={props.sectionTitle}
          secondTitle={
            props.sectionSecondTitle || (showBar && appBar && !inCardHead) ? (
              <span className="dsb-apphead-right" data-dsb-interactive>
                {props.sectionSecondTitle || null}
                {showBar && appBar && !inCardHead ? toolsEl : null}
              </span>
            ) : undefined
          }
          icon={props.sectionIcon || undefined}
          color={props.sectionColor || undefined}
          count={props.sectionCount ? rows.length : undefined}
          showSearch={!!props.sectionSearch}
          searchValue={query}
          searchPlaceholder="Search…"
          onSearch={(e) => setQuery(e?.target?.value !== undefined ? e.target.value : e ?? "")}
          actionLabel={props.sectionActionLabel || undefined}
          actionIcon={props.sectionActionIcon || undefined}
          onAction={() => !rt?.design && rt?.runEvent(node, "onHeadingAction", {})}
        />
      </div>
    ) : null;

    const barInner = props.showHeader === false ? null : (
      <>
        <div className="dsb-grid-title">
          {props.title ? <span>{props.title}</span> : null}
          {inCardHead && (countLabel.trim() || !headSlot?.labelled) ? <span className="dsb-apphead-sub">{countWords}</span> : null}
          {rows.length || inCardHead ? (
            <span className="dsb-count-pill" title={shown.length !== rows.length ? `${shown.length} of ${rows.length}` : undefined}>
              {countText}
            </span>
          ) : null}
        </div>
        {toolsEl}
      </>
    );
    // Up in the card's heading when there is a spot for it — portalled, so it
    // stays this component's own markup, state and handlers. Until the heading
    // has mounted (first render) nothing is drawn rather than a row that jumps.
    const bar = !barInner
      ? null
      : inCardHead
        ? headSlot.el
          ? createPortal(barInner, headSlot.el)
          : null
        : appBar
          ? sectionHead
            ? null // its tools are already on the section heading's right
            : <AppHeading title={props.title || ""} count={countText} countLabel={countWords} right={toolsEl} className="is-grid-head" />
          : <div className="dsb-grid-bar">{barInner}</div>;
    const inCardCls = inCardHead ? " is-in-card" : "";

    const header =
      sectionHead || bar ? (
        <>
          {sectionHead}
          {bar}
        </>
      ) : null;

    /*
     * Frozen columns: each one is `position: sticky`, and needs the width of
     * the frozen columns between it and its edge as its offset. Widths are the
     * browser's to decide (content, resizing, a % width), so they are measured
     * off the header row after layout rather than guessed from settings.
     */
    const freeze = freezeCounts(columns, props);
    const freezeKey = `${freeze.start}|${freeze.end}`;
    const [fzOff, setFzOff] = useState({ left: [], right: [] });
    useLayoutEffect(() => {
      if (view !== "table" || (!freeze.start && !freeze.end)) {
        if (fzOff.left.length || fzOff.right.length) setFzOff({ left: [], right: [] });
        return undefined;
      }
      const table = bodyRef.current?.querySelector("table");
      const measure = () => {
        const all = table ? [...table.querySelectorAll("thead > tr > th")] : [];
        // The drag grip is not a column of the data, but it sits in front of
        // the frozen ones and stays put with them.
        const grip = all.find((th) => th.classList.contains("dsb-drag-th"));
        const ths = all.filter((th) => th !== grip);
        if (!ths.length) return;
        const w = ths.map((th) => th.getBoundingClientRect().width);
        const left = [];
        let acc = grip ? grip.getBoundingClientRect().width : 0;
        for (let i = 0; i < freeze.start; i += 1) {
          left.push(acc);
          acc += w[i] || 0;
        }
        const right = [];
        acc = 0;
        for (let i = 0; i < freeze.end; i += 1) {
          right.push(acc);
          acc += w[w.length - 1 - i] || 0;
        }
        setFzOff((prev) =>
          JSON.stringify(prev) === JSON.stringify({ left, right }) ? prev : { left, right },
        );
      };
      measure();
      // A column resized by hand, a font that loaded late, the window.
      const ro = typeof ResizeObserver !== "undefined" && table ? new ResizeObserver(measure) : null;
      if (ro) ro.observe(table);
      return () => ro && ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, freezeKey, columns, widths, pageRows.length, gripCol]);

    // With columns frozen at the start the grip is frozen too, at the very edge.
    const gripFz = gripCol && freeze.start > 0;
    const gripCell = (Tag, extra = {}) => (
      <Tag
        {...extra}
        className={`${Tag === "th" ? "dsb-drag-th" : "dsb-drag-cell"}${gripFz ? " dsb-fz dsb-fz-l" : ""}${extra.className ? ` ${extra.className}` : ""}`}
        style={gripFz ? { insetInlineStart: 0 } : undefined}
      />
    );

    /** The sticky class and offset of column `i`, for its th and every td. */
    const fz = (i) => {
      const n = columns.length;
      if (i < freeze.start) {
        return {
          cls: `dsb-fz dsb-fz-l${i === freeze.start - 1 ? " is-edge" : ""}`,
          style: { insetInlineStart: fzOff.left[i] ?? 0 },
        };
      }
      const fromEnd = n - 1 - i;
      if (fromEnd < freeze.end) {
        return {
          cls: `dsb-fz dsb-fz-r${fromEnd === freeze.end - 1 ? " is-edge" : ""}`,
          style: { insetInlineEnd: fzOff.right[fromEnd] ?? 0 },
        };
      }
      return null;
    };

    if (loading) {
      return (
        <div className={`dsb-grid${inCardCls}`} style={style}>
          {header}
          <Skeleton rows={6} height={rowH} />
        </div>
      );
    }

    if (error) {
      return (
        <div className={`dsb-grid${inCardCls}`} style={style}>
          {header}
          <EmptyState
            icon="AlertCircle"
            tone="danger"
            title="Could not load data"
            hint={String(error)}
            action={rt?.design ? null : { label: "Try again", icon: "RefreshCw", onClick: () => rt?.refresh(sourceId, { force: true }) }}
          />
        </div>
      );
    }

    if (!rows.length) {
      return (
        <div className={`dsb-grid${inCardCls}`} style={style}>
          {header}
          <EmptyState
            icon="FileSearch"
            title={props.emptyText || "No records found"}
            hint="Adjust the filters and search again."
            action={
              rt?.design || !sourceId ? null : { label: "Refresh", icon: "RefreshCw", onClick: () => rt?.refresh(sourceId, { force: true }) }
            }
          />
        </div>
      );
    }

    // The look decides the defaults; every one of them is still a prop that
    // wins when it is set, so a screen can take the app grid and change its
    // mind about one thing without giving up the rest.
    const onPhone = (rt?.breakpoint || "desktop") === "mobile";
    const skin = props.skin || "app";
    const gridLines = props.gridLines || (skin === "app" ? "all" : "rows");
    const headerCase = props.headerCase || (skin === "app" ? "normal" : "upper");
    const gridVars = {};
    if (props.freezeBg) gridVars["--dsb-freeze-bg"] = props.freezeBg;
    if (Number(props.fontSize) > 0) gridVars["--dsb-grid-fs"] = `${Number(props.fontSize)}px`;
    if (props.headerBg) gridVars["--dsb-grid-head-bg"] = props.headerBg;
    if (props.stripeColor) gridVars["--dsb-grid-stripe"] = props.stripeColor;

    return (
      <div
        ref={gridRootRef}
        className={`dsb-grid s-${skin} gl-${gridLines} hc-${headerCase} ${props.dense ? "is-dense" : ""}${inCardCls}`.trim()}
        style={{ ...style, ...gridVars }}
      >
        {header}

        {view === "table" ? (
          <div
            className="dsb-grid-scroll"
            ref={bodyRef}
            style={{ maxHeight: maxHCss }}
            onScroll={(e) => virtual && setScrollTop(e.currentTarget.scrollTop)}
          >
            <table className={`dsb-table ${props.stickyHeader ? "is-sticky" : ""} ${props.zebra ? "is-zebra" : ""}`}>
              <thead>
                <tr>
                  {gripCol ? gripCell("th", { "aria-label": "Reorder" }) : null}
                  {columns.map((c, ci) => (
                    <th
                      key={c.key}
                      style={{
                        width: widths[c.key] || c.width || undefined,
                        textAlign: c.align || "left",
                        color: c.headerColor || props.headerColor || undefined,
                        ...(fz(ci)?.style || {}),
                      }}
                      onClick={() => toggleSort(c)}
                      className={`${props.sortable && c.sortable !== false && c.type !== "serial" ? "is-sortable" : ""} ${fz(ci)?.cls || ""}`.trim()}
                    >
                      <span className="dsb-th">
                        {/* A phone has no room for "All" and a tick box side by
                            side; the page it replaces swaps in a short word.
                            Falls back to the real header, so a column that says
                            nothing about mobile is unchanged. */}
                        {c.control === "checkbox" && c.headerCheckbox !== false ? (
                          <input
                            type="checkbox"
                            className="dsb-th-check"
                            data-dsb-interactive
                            checked={checkState(c).all}
                            ref={(el) => {
                              // Some ticked, not all: only settable from script.
                              if (el) el.indeterminate = checkState(c).some && !checkState(c).all;
                            }}
                            title={checkState(c).all ? "Clear all" : "Select all"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => tickAll(c, e.target.checked)}
                          />
                        ) : null}
                        {c.headerIcon ? <Icon name={c.headerIcon} size={13} className="dsb-th-ic" /> : null}
                        {tr(onPhone && c.mobileHeader ? c.mobileHeader : c.header || c.key)}
                        {sort.key === c.key ? (
                          <Icon name={sort.dir === "asc" ? "ArrowUp" : "ArrowDown"} size={12} />
                        ) : null}
                      </span>
                      {props.resizable ? (
                        <span className="dsb-col-resize" onPointerDown={(e) => startResize(e, c.key)} data-dsb-interactive />
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {virtual && first > 0 ? <tr style={{ height: first * rowH }} /> : null}
                {windowRows.map((row, i) => {
                  const key = rowKey(row, first + i);
                  const isSel = selected.includes(key);
                  const rowColor = resolveColor(node.rules?.color, row, "row", scope);
                  // Only a Nested Row Table passes `__nest`; every other table
                  // draws exactly the <tr> it always has.
                  const nest = props.__nest;
                  const rowEl = (
                    <tr
                      key={key}
                      className={`${isSel ? "is-selected" : ""}${dragRowCls(key)}${nest?.rowClass?.(key) || ""}`.trim()}
                      style={colorStyle(rowColor, { height: rowH })}
                      onClick={() => {
                        onRowClick(row, key);
                        nest?.onRow?.(row, key);
                      }}
                      {...dragProps(key)}
                    >
                      {gripCol
                        ? gripCell("td", {
                            "data-dsb-interactive": true,
                            className: canDrag ? "" : "is-off",
                            title: canDrag ? "Drag to reorder" : sort.key ? "Clear the column sort to reorder" : undefined,
                            ...(canDrag ? dragStartProps(key) : {}),
                            onClick: (e) => e.stopPropagation(),
                            children: <Icon name="GripVertical" size={14} />,
                          })
                        : null}
                      {columns.map((c, ci) => (
                        <td
                          key={c.key}
                          className={fz(ci)?.cls}
                          style={{ textAlign: c.align || "left", fontWeight: c.bold ? 700 : undefined, ...(fz(ci)?.style || {}) }}
                        >
                          <CellControl
                            column={c}
                            row={row}
                            node={node}
                            rt={rt}
                            scope={scope}
                            rowId={key}
                            ticks={rt?.ui?.checks?.[`${node.id}:${c.key}`]}
                            cells={rt?.ui?.cells?.[`${node.id}:${c.key}`]}
                            onTick={(rowId, on) => tickOne(c, rowId, on, row)}
                            onCell={(rowId, v) => setCell(c, rowId, v)}
                            flagged={!!cellFlags[c.key]?.[key]}
                          >
                            <CellValue
                              column={c}
                              row={row}
                              node={node}
                              rt={rt}
                              scope={scope}
                              index={page * pageSize + first + i}
                            />
                          </CellControl>
                        </td>
                      ))}
                    </tr>
                  );
                  return nest ? (
                    <React.Fragment key={key}>
                      {rowEl}
                      {nest.after?.(row, key, columns.length + (gripCol ? 1 : 0))}
                    </React.Fragment>
                  ) : (
                    rowEl
                  );
                })}
                {virtual && last < pageRows.length ? <tr style={{ height: (pageRows.length - last) * rowH }} /> : null}
              </tbody>
              {totals ? (
                <tfoot>
                  <tr className="dsb-totals">
                    {gripCol ? gripCell("td") : null}
                    {columns.map((c, i) => (
                      <td key={c.key} className={fz(i)?.cls} style={{ textAlign: c.align || "left", ...(fz(i)?.style || {}) }}>
                        {c.isTotal
                          ? formatValue(totals[c.key], c.type === "currency" ? "currency" : "number")
                          : i === 0
                            ? "Total"
                            : ""}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        ) : (
          <div className="dsb-cards" style={{ "--dsb-card-cols": cc.columns || 3, maxHeight: maxHCss }}>
            {pageRows.map((row, i) => {
              const key = rowKey(row, i);
              const isSel = selected.includes(key);
              const cardColor = resolveColor(node.rules?.color, row, "card", scope);
              const statusVal = cardStatusField ? getPath(row, cardStatusField) : null;
              // The whole column, not just its rules: the chip's colour can also
              // come from a field of the row or from the column's own default,
              // and a card has to draw the same chip the table does.
              const statusCol = cardStatusField
                ? resolveChipColor(
                    { ...(columns.find((c) => c.key === cardStatusField) || {}), key: cardStatusField },
                    statusVal,
                    row,
                    scope,
                  )
                : null;
              const statusText = cardText(statusVal, "");
              const title = cardText(getPath(row, cardTitleField));
              const sub = cardSubField ? cardText(getPath(row, cardSubField), "") : "";
              const serialCol = columns.find((c) => c.type === "serial");
              const body = (cc.bodyFields && cc.bodyFields.length
                ? cc.bodyFields
                : columns
                    .filter(
                      (c) =>
                        c.key &&
                        c.key !== cardTitleField &&
                        c.key !== cardSubField &&
                        c.key !== cardStatusField &&
                        !isCardFootColumn(c) &&
                        c.type !== "serial",
                    )
                    // Every column the table shows, unless "Fields shown" caps it.
                    .slice(0, Number(cc.maxFields) > 0 ? Number(cc.maxFields) : undefined)
                    .map((c) => c.key)
              )
                .map((k) => columns.find((c) => c.key === k) || { key: k, header: k, type: "text" })
                .filter((c) => c.type !== "actions" && c.type !== "frameMenu");
              // Tick boxes go in the corner, where they are a selection; other
              // controls (buttons, icons, inputs) and the action strip along the
              // foot, where they are things to do.
              const tickCols = columns.filter((c) => c.control === "checkbox");
              const footCols = columns.filter((c) => isCardFootColumn(c) && c.control !== "checkbox");
              const showFoot = footCols.length > 0 && (cc.showActions !== false || footCols.some((c) => c.type !== "actions" && c.type !== "frameMenu"));
              const pal =
                cardRulePalette(cc.colorRules, row, scope) ||
                (cc.colorBy === "none"
                  ? null
                  : cc.colorBy === "row"
                    ? cardPalette(null, i)
                    : cardPalette(getPath(row, cc.colorBy || cardTitleField)));
              const cellArgs = (c) => ({
                column: c,
                row,
                node,
                rt,
                scope,
                rowId: key,
                ticks: rt?.ui?.checks?.[`${node.id}:${c.key}`],
                cells: rt?.ui?.cells?.[`${node.id}:${c.key}`],
                onTick: (rowId, on) => tickOne(c, rowId, on, row),
                onCell: (rowId, v) => setCell(c, rowId, v),
                flagged: !!cellFlags[c.key]?.[key],
              });

              return (
                <div
                  key={key}
                  className={`dsb-card-row ${isSel ? "is-selected" : ""} ${pal ? "is-tinted" : ""}`.trim()}
                  style={colorStyle(cardColor, pal ? { "--dsb-cc": pal.accent, "--dsb-cc-soft": pal.soft, "--dsb-cc-band": pal.band, "--dsb-cc-ink": pal.ink } : undefined)}
                  onClick={() => onRowClick(row, key)}
                >
                  <div className="dsb-card-head">
                    <div className="dsb-card-id">
                      <span className="dsb-card-avatar" aria-hidden="true">
                        {cc.icon ? <Icon name={cc.icon} size={18} /> : <span className="dsb-card-initials">{initialsOf(title)}</span>}
                      </span>
                      <div className="dsb-card-names">
                        <div className="dsb-card-title" title={title}>
                          {title}
                        </div>
                        {sub ? (
                          <div className="dsb-card-sub" title={sub}>
                            {sub}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="dsb-card-badges" data-dsb-interactive onClick={(e) => e.stopPropagation()}>
                      {statusText ? (
                        <span className="dsb-chip" style={{ background: statusCol.bg, color: statusCol.fg }}>
                          {statusText}
                        </span>
                      ) : null}
                      {serialCol ? <span className="dsb-card-num">#{page * pageSize + i + 1}</span> : null}
                      {tickCols.map((c) => (
                        <label key={c.key} className="dsb-card-tick" title={tr(c.header || c.key)}>
                          <CellControl {...cellArgs(c)}>
                            <span />
                          </CellControl>
                          <span className="dsb-card-tick-lbl">{tr(c.mobileHeader || c.header || c.key)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {body.length ? (
                    <div className="dsb-card-body">
                      {body.map((c) => (
                        <div key={c.key} className="dsb-card-kv">
                          <span>
                            {c.headerIcon ? <Icon name={c.headerIcon} size={11} /> : <i className="dsb-card-dot" />}
                            {tr(c.header || c.key)}
                          </span>
                          <strong>
                            <CellControl {...cellArgs(c)}>
                              <CellValue column={c} row={row} node={node} rt={rt} scope={scope} index={page * pageSize + i} />
                            </CellControl>
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {showFoot ? (
                    <div className="dsb-card-actions" data-dsb-interactive onClick={(e) => e.stopPropagation()}>
                      {footCols
                        .filter((c) => cc.showActions !== false || (c.type !== "actions" && c.type !== "frameMenu"))
                        .map((c) => (
                          <span key={c.key} className="dsb-card-act" title={tr(c.header || c.key)}>
                            <CellControl {...cellArgs(c)}>
                              <CellValue column={c} row={row} node={node} rt={rt} scope={scope} index={page * pageSize + i} />
                            </CellControl>
                          </span>
                        ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {props.paginate && (pageCount > 1 || sizeOptions.length > 1) ? (
          <div className="dsb-pager" data-dsb-interactive>
            <span>
              {page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} of {sorted.length}
            </span>
            {sizeOptions.length > 1 ? (
              <label className="dsb-pager-size">
                <span>Rows</span>
                <select
                  value={String(pageSize)}
                  aria-label="Rows per page"
                  onChange={(e) => setPickedSize(Number(e.target.value) || 0)}
                >
                  {(sizeOptions.includes(basePageSize) ? sizeOptions : [...sizeOptions, basePageSize].sort((a, b) => a - b)).map(
                    (n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : null}
            <div className="dsb-pager-btns">
              <button type="button" disabled={page === 0} onClick={() => setPage(0)}>
                <Icon name="ChevronLeft" size={13} />
                <Icon name="ChevronLeft" size={13} style={{ marginInlineStart: -9 }} />
              </button>
              <button type="button" disabled={page === 0} onClick={() => setPage((x) => x - 1)}>
                <Icon name="ChevronLeft" size={13} />
              </button>
              <span className="dsb-pager-num">
                {page + 1} / {pageCount}
              </span>
              <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((x) => x + 1)}>
                <Icon name="ChevronRight" size={13} />
              </button>
              <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage(pageCount - 1)}>
                <Icon name="ChevronRight" size={13} />
                <Icon name="ChevronRight" size={13} style={{ marginInlineStart: -9 }} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
};

/* --------------------------------------------------------------- StatCard */

/* ----------------------------------------------------------- KPI from rows */

const STAT_AGGS = [
  { value: "count", label: "Count of rows" },
  { value: "sum", label: "Sum of a field" },
  { value: "avg", label: "Average of a field" },
  { value: "min", label: "Smallest value" },
  { value: "max", label: "Largest value" },
  { value: "distinct", label: "How many different values" },
  // A summary endpoint answers { TotalBeds: 40, Occupied: 12 } — one row, the
  // number already worked out. The card only has to read it.
  { value: "first", label: "A field's value (first row)" },
  // Available = total − occupied: a sum over the first row's fields.
  { value: "calc", label: "Worked out from fields" },
];

const MATH_HINT_TEXT = "Maths works inside the braces: {{row.A - row.B}}, {{round(row.A / row.B * 100, 1)}}.";

/** A KPI card that calls its own endpoint — the rows other cards can count too. */
const isFetchingStat = (n) => n?.type === "StatCard" && n.props?.valueMode === "api" && isApiConfigReady(n.props?.apiConfig);

/** Measured from a list, or from its own endpoint — either way it has rows. */
const statMeasures = (props) => props.valueMode === "list" || props.valueMode === "api";

/** Every list on the screen a KPI can be measured against. */
const statSourceOptions = (ctx) => {
  const ds = Object.values(ctx?.dataSources || {}).map((d) => ({ value: d.id, label: d.name || d.id }));
  // A component that draws rows carries `dataMode` in its props — the same
  // marker the refresh action's picker uses, so this list needs no maintaining
  // as more row components arrive. A card that fetches is a list as well: four
  // cards over one bed list make one call, not four.
  const comps = (ctx?.nodes || [])
    .filter((n) => (n.props?.dataMode !== undefined || isFetchingStat(n)) && n.id !== ctx?.nodeId)
    .map((n) => ({
      value: nodeSourceId(n.id),
      label: n.type === "StatCard" ? `${n.name} — its API (${n.props.apiConfig.endpoint})` : `${n.name} (${n.type})`,
    }));
  return [{ value: "", label: "Pick a list…" }, ...comps, ...ds];
};

/** The fields of whichever list a KPI is counting — what its filters offer. */
const statSourceFields = (ctx) => {
  // Its own endpoint: whatever the last Test call / Sync brought back.
  if (ctx?.props?.valueMode === "api") return recordFieldsOf(ctx.props);
  const sid = ctx?.props?.listSourceId || "";
  if (!sid) return [];
  const nodeId = nodeIdFromSource(sid);
  const owner = (ctx?.nodes || []).find((n) => n.id === nodeId);
  return owner ? recordFieldsOf(owner.props) : [];
};

/**
 * The rows a KPI counts.
 *
 * Live they come from `rt.data` under the source's id, exactly as the table
 * that owns them reads them. On the canvas there is no call, so the owner's
 * last Sync — the preview rows the table itself draws with — stands in, and a
 * card being designed shows a real number instead of a zero.
 */
function statRows(props, rt) {
  const sid = props.listSourceId || "";
  if (!sid) return NO_ROWS;
  const live = rt?.data?.[sid]?.rows;
  if (Array.isArray(live) && live.length) return live;
  if (!rt?.design) return Array.isArray(live) ? live : NO_ROWS;
  const nodeId = nodeIdFromSource(sid);
  const owner = nodeId ? flatten(rt?.screen?.root).find((n) => n.id === nodeId) : null;
  const preview = owner?.props?.previewRows;
  if (Array.isArray(preview) && preview.length) return preview;
  const stat = owner?.props?.staticRows;
  return Array.isArray(stat) ? stat : NO_ROWS;
}

/** The rows a KPI with its own endpoint measures — live, or its last Sync on the canvas. */
function statOwnRows(node, props, rt) {
  if (rt?.design) return Array.isArray(props.previewRows) ? props.previewRows : NO_ROWS;
  const ds = rt?.data?.[nodeSourceId(node.id)];
  return Array.isArray(ds?.rows) ? ds.rows : NO_ROWS;
}

/**
 * The record a measured KPI card stands on: the first row it counts, after its
 * filters. A summary endpoint answers one row ({ OccupencyPer: 36.5, … }), so
 * `{{row.OccupencyPer}}` in the trend text is that endpoint's field — the
 * inspector offers the list's fields for exactly this. A card that is typed in
 * has none, and a filter that kept nothing leaves `row` empty rather than
 * borrowing an unrelated record.
 */
function statOwnRow(node, rt) {
  const props = node?.props || {};
  if (!statMeasures(props)) return undefined;
  const source = props.valueMode === "api" ? statOwnRows(node, props, rt) : statRows(props, rt);
  if (!source.length) return undefined;
  const scope = rt?.buildScope ? rt.buildScope() : {};
  const filters = interpolateDeep(props.listFilters || [], scope);
  const rows = filterOptionRows(source, filters, { ...scope, values: rt?.values || {} });
  return rows.find((r) => r && typeof r === "object");
}

export const TREND_DIRS = [
  { value: "up", label: "Up" },
  { value: "down", label: "Down" },
  { value: "flat", label: "Flat" },
  { value: "none", label: "No icon" },
];

/** The field a trend case reads to test the card's own number. */
export const STAT_VALUE_FIELD = "@value";

/**
 * How a trend looks: which way it points, and its colours. Fixed, or taken
 * from the first case that holds — a case reads a field of the record the card
 * stands on (`OccupencyPer`), or the card's own number (`@value`), and compares
 * it the way every other rule here does. A case's own colours win; the card's
 * Trend colour / background fill in what it leaves empty; with neither, the
 * direction colours it (green up, red down).
 */
function trendLook(props, row, n) {
  const base = { color: props.trendColor || "", bg: props.trendBg || "" };
  if (props.trendDir !== "rules") return { dir: props.trendDir || "up", ...base };
  const s = { ...(row && typeof row === "object" ? row : {}), row, [STAT_VALUE_FIELD]: n };
  const hit = (Array.isArray(props.trendRules) ? props.trendRules : []).find(
    (r) => r && r.field && r.op && evalCondition(r, s),
  );
  if (!hit) return { dir: props.trendElse || "flat", ...base };
  return { dir: hit.dir || "up", color: hit.color || base.color, bg: hit.bg || base.bg };
}

/** One number out of a list of rows. */
function aggregate(rows, agg, field) {
  const list = Array.isArray(rows) ? rows : [];
  if (agg === "count" || !agg) return list.length;
  if (!field) return 0;
  if (agg === "first") {
    const v = list.find((r) => r && typeof r === "object")?.[field];
    return v === null || v === undefined ? "" : v;
  }
  if (agg === "distinct") {
    return new Set(list.map((r) => r?.[field]).filter((v) => v !== null && v !== undefined && v !== "")).size;
  }
  // Blank is not zero: a row with no reading must not drag an average down, and
  // must not count as the smallest value there is.
  const nums = list
    .map((r) => (r?.[field] === "" || r?.[field] === null || r?.[field] === undefined ? NaN : Number(r[field])))
    .filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  if (agg === "sum") return nums.reduce((a, b) => a + b, 0);
  if (agg === "avg") return nums.reduce((a, b) => a + b, 0) / nums.length;
  if (agg === "min") return Math.min(...nums);
  if (agg === "max") return Math.max(...nums);
  return 0;
}

const StatCardDef = {
  type: "StatCard",
  label: "Stat / KPI Card",
  icon: "Gauge",
  category: "Data",
  bindable: true,
  defaultProps: {
    label: "Total Patients",
    value: "0",
    icon: "Users",
    accent: "#2563eb",
    iconBg: "",
    trend: "",
    trendDir: "up",
    trendRules: [],
    trendElse: "flat",
    trendColor: "",
    trendBg: "",
    trendDecimals: "",
    trendPos: "below",
    trendAlign: "left",
    trendSize: "",
    iconSide: "right",
    iconShape: "rounded",
    iconSize: "",
    labelSize: "",
    valueSize: "",
    size: "md",
    align: "left",
    valueMode: "text",
    listSourceId: "",
    apiConfig: createApiConfig(),
    agg: "count",
    aggField: "",
    aggExpr: "",
    listFilters: [],
    decimals: 0,
    prefix: "",
    suffix: "",
  },
  defaultStyle: {},
  events: ["onClick"],
  ownRow: statOwnRow,
  propSchema: [
    p.template("label", "Label", GROUPS.CONTENT, { placeholder: "Total Patients" }),
    p.select(
      "valueMode",
      "Value is",
      [
        { value: "text", label: "Typed in, or a binding" },
        { value: "api", label: "Fetched from an API" },
        { value: "list", label: "Measured from a list on this screen" },
      ],
      GROUPS.DATA,
    ),
    p.template("value", "Value", GROUPS.DATA, {
      placeholder: "{{row.Bed}}",
      when: (props) => !statMeasures(props),
      hint: MATH_HINT_TEXT,
    }),
    // Its own endpoint, exactly as a table has one: called when the screen
    // opens, again whenever a {{values.x}} in its payload changes, and by a
    // Refresh action pointed at it. Test call / Sync fills the field lists.
    {
      key: "apiConfig",
      label: "API endpoint",
      type: "apiEndpoint",
      mode: "measure",
      group: GROUPS.DATA,
      when: (props) => props.valueMode === "api",
    },
    p.select("listSourceId", "Count from", statSourceOptions, GROUPS.DATA, {
      when: (props) => props.valueMode === "list",
      hint: "The table, card list, data source — or another KPI card's API — whose rows this card measures.",
    }),
    p.select("agg", "Measure", STAT_AGGS, GROUPS.DATA, { when: statMeasures }),
    p.select("aggField", "Of field", statSourceFields, GROUPS.DATA, {
      when: (props) => statMeasures(props) && props.agg && props.agg !== "count" && props.agg !== "calc",
      hint: "Empty until the endpoint has been called once — press Sync above.",
    }),
    p.template("aggExpr", "Calculation", GROUPS.DATA, {
      when: (props) => statMeasures(props) && props.agg === "calc",
      placeholder: "{{row.TotalCapacity - row.Occupied}}",
      hint: `Reads the first row (after the filters below). ${MATH_HINT_TEXT}`,
    }),
    p.optionFilters("listFilters", "Count only rows where", GROUPS.DATA, {
      when: statMeasures,
      fieldKeys: statSourceFields,
      hint: "Every filter has to match. Leave empty to count the whole list. A value can read the screen: {{values.ward}}.",
    }),
    p.number("decimals", "Decimal places", GROUPS.DATA, {
      when: (props) => statMeasures(props) && ["avg", "sum", "first", "calc"].includes(props.agg),
    }),
    p.text("prefix", "Prefix", GROUPS.DATA, { when: statMeasures, placeholder: "₹" }),
    p.text("suffix", "Suffix", GROUPS.DATA, { when: statMeasures, placeholder: "%" }),
    p.icon("icon", "Icon"),
    p.dynamicColor("accent", "Accent colour"),
    p.color("iconBg", "Icon background"),
    p.template("trend", "Trend text", GROUPS.CONTENT, { placeholder: "+12% this week", hint: MATH_HINT_TEXT }),
    p.number("trendDecimals", "Trend decimal places", GROUPS.CONTENT, {
      when: (props) => !!props.trend,
      hint: "Rounds every number the trend's {{ }} work out to at most this many places — 36.4705 shows as 36.47 with 2, 40 stays 40. The text around them is left alone. Empty shows them as they come; for always two places use {{… | fixed:2}}.",
    }),
    p.select("trendDir", "Trend direction", [
      ...TREND_DIRS,
      { value: "rules", label: "By condition…" },
    ]),
    // "Up when occupancy is over 80, down under 50, flat otherwise": each case
    // tests the record the card stands on, or the card's own number.
    {
      key: "trendRules",
      label: "Trend is",
      type: "trendRules",
      group: GROUPS.APPEARANCE,
      when: (props) => props.trendDir === "rules",
      fieldKeys: (ctx) => [...new Set([...statSourceFields(ctx), ...(ctx?.rowFields || [])])],
    },
    p.select("trendElse", "Otherwise", TREND_DIRS, GROUPS.APPEARANCE, {
      when: (props) => props.trendDir === "rules",
      hint: "When no case above matches.",
    }),
    p.color("trendColor", "Trend colour", GROUPS.APPEARANCE, {
      hint: "Empty follows the arrow — green up, red down. A case with its own colour wins.",
    }),
    p.color("trendBg", "Trend background", GROUPS.APPEARANCE, {
      hint: "Set one and the trend becomes a pill.",
    }),
    p.select("trendPos", "Trend position", [
      { value: "below", label: "Below the value" },
      { value: "beside", label: "Beside the value" },
      { value: "above", label: "Above the label" },
    ]),
    p.select(
      "trendAlign",
      "Trend alignment",
      [
        { value: "left", label: "Left" },
        { value: "center", label: "Centre" },
        { value: "right", label: "Right" },
      ],
      GROUPS.APPEARANCE,
      { when: (props) => (props.trendPos || "below") !== "beside" },
    ),
    p.number("trendSize", "Trend font size (px)", GROUPS.APPEARANCE, {
      hint: "Empty keeps the default, 11px.",
    }),
    p.select("iconSide", "Icon side", [
      { value: "right", label: "Right" },
      { value: "left", label: "Left" },
    ]),
    p.select("iconShape", "Icon shape", [
      { value: "rounded", label: "Rounded square" },
      { value: "circle", label: "Circle" },
    ]),
    p.number("iconSize", "Icon size (px)", GROUPS.APPEARANCE, {
      hint: "Empty keeps 18. The tile around it grows with it.",
    }),
    p.number("labelSize", "Label font size (px)", GROUPS.APPEARANCE, {
      hint: "Empty keeps 11.",
    }),
    p.number("valueSize", "Value font size (px)", GROUPS.APPEARANCE, {
      hint: "Empty follows Size — 19 small, 24 medium, 30 large.",
    }),
    p.select("size", "Size", [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
    ]),
  ],
  render: ({ node, props, style, rt, scope }) => {
    // A KPI is nearly always "how many of these", and until now that meant
    // computing the number somewhere else and binding it in. Measured mode
    // reads the list itself: the same rows the table below is drawing, put
    // through the same filters the option lists use, reduced to one number.
    // "Fetched from an API" loads itself the way a table with its own endpoint
    // does. The key is the config as rendered — its {{values.x}} already
    // resolved — so a changed filter on the screen is a new call.
    const own = props.valueMode === "api" && isApiConfigReady(props.apiConfig);
    const apiKey = useMemo(() => (own ? JSON.stringify(normalizeApiConfig(props.apiConfig)) : ""), [own, props.apiConfig]);
    const refreshNode = rt?.refreshNode;
    const design = !!rt?.design;
    useEffect(() => {
      if (!apiKey || design || !refreshNode) return;
      const cfg = JSON.parse(apiKey);
      if (cfg.autoLoad === false) return;
      refreshNode(node.id, cfg);
    }, [apiKey, design, refreshNode, node.id]);
    const ownState = own && !design ? rt?.data?.[nodeSourceId(node.id)] : null;

    let shown = props.value === "" || props.value === null ? "0" : props.value;
    let title;
    // The card's own number, for a trend case that tests it (`@value`).
    let n = Number(shown);
    if (statMeasures(props)) {
      const source = props.valueMode === "api" ? statOwnRows(node, props, rt) : statRows(props, rt);
      const rows = filterOptionRows(source, props.listFilters, { ...scope, values: rt?.values || {} });
      // A calculation was already worked out when the props were resolved,
      // against the first row this card stands on (its ownRow).
      const raw =
        props.agg === "calc"
          ? props.aggExpr === null || props.aggExpr === undefined
            ? ""
            : props.aggExpr
          : aggregate(rows, props.agg, props.aggField);
      // A field read straight off the response may be text ("12 / 40"); only
      // a number is formatted.
      n = typeof raw === "number" ? raw : raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : NaN;
      const exact = props.agg === "first" || props.agg === "calc";
      const dp = props.agg === "avg" || props.agg === "sum" || exact ? Number(props.decimals) || 0 : 0;
      const body = Number.isFinite(n)
        ? n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp })
        : exact && raw !== ""
          ? String(raw)
          : "0";
      shown = `${props.prefix || ""}${body}${props.suffix || ""}`;
      if (ownState?.loading && !ownState.rows?.length) shown = "…";
      if (ownState?.error) {
        shown = "—";
        title = ownState.error;
      }
    }
    const look = trendLook(props, scope?.row, Number.isFinite(n) ? n : undefined);
    const dir = look.dir;
    const TREND_ICON = { up: "TrendingUp", down: "TrendingDown", flat: "MoveRight" };
    // A size typed in the inspector arrives as text; anything not a positive
    // number means "the default" (11px, or the node's own typography).
    const trendPx = Number(props.trendSize) > 0 ? Number(props.trendSize) : 0;
    const trendStyle = {
      color: look.color || undefined,
      background: look.bg || undefined,
      fontSize: trendPx ? `${trendPx}px` : undefined,
    };
    const trendPos = props.trendPos || "below";
    // Decimal places need the numbers before they became text, so the trend
    // is worked out again from what was typed, against the same scope (the
    // record the card stands on) — only when places are set.
    const places = props.trendDecimals === "" || props.trendDecimals === null || props.trendDecimals === undefined
      ? NaN
      : Math.min(10, Math.max(0, Math.floor(Number(props.trendDecimals))));
    const rawTrend = node?.props?.trend;
    const trendText =
      Number.isFinite(places) && typeof rawTrend === "string" && hasTemplate(rawTrend)
        ? interpolate(rawTrend, scope, {
            // At most that many places: 36.4705 → 36.47, but 40 stays 40 and
            // a year stays 2026 — no padding, no thousands separators.
            formatNumber: (x) => String(Math.round(x * 10 ** places) / 10 ** places),
          })
        : props.trend;
    const trendEl = trendText !== "" && trendText !== null && trendText !== undefined ? (
      // "none" must not become `d-none` — that is Bootstrap's display:none,
      // and would hide the trend text along with the icon.
      <div
        className={`dsb-stat-trend${TREND_ICON[dir] ? ` d-${dir}` : " is-plain"}${look.bg ? " has-bg" : ""}`}
        style={look.color || look.bg || trendPx ? trendStyle : undefined}
      >
        {TREND_ICON[dir] ? <Icon name={TREND_ICON[dir]} size={trendPx ? Math.round(trendPx * 1.1) : 12} /> : null}
        <span>{trendText}</span>
      </div>
    ) : null;
    // Above or below, the trend has a line of its own to sit left, centre or
    // right on; beside the value it follows the number, like "36  68%".
    const trendLine = trendEl ? (
      <div className={`dsb-stat-trendrow a-${props.trendAlign || "left"}`}>{trendEl}</div>
    ) : null;
    // Sizes typed in the inspector arrive as text; anything not a positive
    // number keeps the default.
    const px = (v) => (Number(v) > 0 ? Number(v) : 0);
    const iconPx = px(props.iconSize);
    const labelPx = px(props.labelSize);
    const valuePx = px(props.valueSize);
    const iconEl = props.icon ? (
      <span
        className={`dsb-stat-ic${props.iconShape === "circle" ? " is-circle" : ""}`}
        style={{
          background: props.iconBg || undefined,
          // The tile keeps the 18-in-36 proportion it has by default.
          ...(iconPx ? { width: iconPx * 2, height: iconPx * 2 } : null),
        }}
      >
        <Icon name={props.icon} size={iconPx || 18} />
      </span>
    ) : null;
    const labelEl = (
      <div className="dsb-stat-label" style={labelPx ? { fontSize: labelPx } : undefined}>
        {props.label}
      </div>
    );
    const valueEl = (
      <div className="dsb-stat-value" title={title} style={valuePx ? { fontSize: valuePx } : undefined}>
        {shown}
      </div>
    );
    const iconLeft = props.iconSide === "left";
    return (
    <div
      className={`dsb-stat s-${props.size || "md"}${iconLeft ? " ic-left" : ""}`}
      style={{ ...style, "--dsb-stat-accent": resolveDynamicColor(props.accent, props.accentDefault) || "var(--dsb-primary)" }}
      onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
    >
      <span className="dsb-stat-bar" />
      {iconLeft ? iconEl : null}
      <div className="dsb-stat-main">
        {trendPos === "above" ? trendLine : null}
        {labelEl}
        {trendPos === "beside" && trendEl ? (
          <div className="dsb-stat-valrow">
            {valueEl}
            {trendEl}
          </div>
        ) : (
          valueEl
        )}
        {trendPos === "below" ? trendLine : null}
      </div>
      {iconLeft ? null : iconEl}
    </div>
    );
  },
};

/* ------------------------------------------------------------------- Tabs */

const TabsDef = {
  type: "Tabs",
  label: "Tabs",
  icon: "PanelsTopLeft",
  category: "Data",
  isContainer: true,
  dropHint: "Drop a Tab Pane here",
  defaultProps: { variant: "underline", align: "left", stretch: false },
  defaultStyle: {},
  events: ["onTabChange"],
  propSchema: [
    p.select("variant", "Variant", [
      { value: "underline", label: "Underline" },
      { value: "pill", label: "Pill" },
      { value: "boxed", label: "Boxed" },
    ]),
    p.select("align", "Alignment", [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ]),
    p.bool("stretch", "Stretch tabs"),
  ],
  createChildren: () => [],
  render: ({ node, props, style, rt, children }) => {
    const panes = node.children || [];
    const ctxTab = rt?.ui?.tabs?.[node.id];
    const [local, setLocal] = useState(null);
    const activeVal = ctxTab ?? local ?? panes[0]?.props?.value ?? panes[0]?.id;
    const activeIdx = Math.max(
      0,
      panes.findIndex((c) => (c.props?.value ?? c.id) === activeVal),
    );

    const pick = (pane) => {
      if (props.disabled) return;
      const val = pane.props?.value ?? pane.id;
      setLocal(val);
      rt?.setTab?.(node.id, val);
      rt?.runEvent(node, "onTabChange", { value: val, tab: pane.props?.label });
    };

    return (
      <div className={`dsb-tabs v-${props.variant || "underline"}`} style={style}>
        <div className={`dsb-tabbar a-${props.align || "left"} ${props.stretch ? "is-stretch" : ""}`} data-dsb-interactive>
          {panes.map((pane, i) => {
            const on = i === activeIdx;
            return (
              <button key={pane.id} type="button" className={`dsb-tab ${on ? "is-on" : ""}`} onClick={() => pick(pane)}>
                {pane.props?.icon ? <Icon name={pane.props.icon} size={13} /> : null}
                <span>{pane.props?.label || `Tab ${i + 1}`}</span>
                {pane.props?.count !== undefined && pane.props?.count !== "" ? (
                  <span className="dsb-tab-count">{pane.props.count}</span>
                ) : null}
              </button>
            );
          })}
          {!panes.length ? <span className="dsb-tab-empty">Drop “Tab Pane” components here</span> : null}
        </div>
        <div className="dsb-tabbody">{children ? children[activeIdx] : null}</div>
      </div>
    );
  },
};

const TabPaneDef = {
  type: "TabPane",
  label: "Tab Pane",
  icon: "PanelTop",
  category: "Data",
  isContainer: true,
  hiddenInPalette: false,
  parentOnly: "Tabs",
  defaultProps: { label: "Tab", value: "", count: "", icon: "" },
  defaultStyle: { padding: "12px 0" },
  events: [],
  propSchema: [
    p.template("label", "Tab label", GROUPS.CONTENT),
    p.text("value", "Tab value", GROUPS.DATA),
    p.template("count", "Count badge", GROUPS.DATA, { placeholder: "{{rows.ds_patients.length}}" }),
    p.icon("icon", "Icon"),
  ],
  render: ({ style, children }) => (
    <div className="dsb-pane" style={style}>
      {children}
    </div>
  ),
};

/* ------------------------------------------------------ chips / avatar etc */

const ChipDef = {
  type: "Chip",
  label: "Chip / Status Pill",
  icon: "BadgeCheck",
  category: "Data",
  bindable: true,
  defaultProps: {
    text: "Admitted",
    bg: "",
    bgDefault: "",
    fg: "",
    fgDefault: "",
    icon: "",
    statusIcon: true,
    statusTone: true,
    variant: "soft",
    size: "md",
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("text", "Text", GROUPS.CONTENT, { placeholder: "{{row.Status}}" }),
    // A status chip is the one component whose colour most often IS data: a
    // triage list carries its own ColorCode per row.
    p.dynamicColor("bg", "Background"),
    p.dynamicColor("fg", "Text colour"),
    p.icon("icon", "Icon"),
    p.bool("statusIcon", "Status icon", GROUPS.APPEARANCE, {
      hint: "With no icon picked, a known status draws its own: Admitted, Discharged, Critical, Stable, Pending, In Surgery, Under Observation…",
    }),
    p.bool("statusTone", "Colour by status", GROUPS.APPEARANCE, {
      hint: "Green for stable/paid, amber for pending, red for critical, blue for admitted — used when no colour is set.",
    }),
    p.select("variant", "Variant", [
      { value: "solid", label: "Solid" },
      { value: "soft", label: "Soft" },
      { value: "outline", label: "Outline" },
    ]),
    p.select("size", "Size", [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
    ]),
  ],
  render: ({ node, props, style, rt, scope }) => {
    // A colour rule targeting "chip" overrides the static colours.
    const ruled = resolveColor(node.rules?.color, scope?.row || scope, "chip", scope);
    // What the words say about themselves: "Critical" is red and carries a
    // warning sign without anyone configuring either. A saved chip with its
    // own colours keeps them; statusIcon is on unless switched off.
    const status = statusIcon(props.text);
    const tone = props.statusTone && status ? TONE_COLORS[status.tone] : null;
    const bg = ruled?.bg || resolveDynamicColor(props.bg, props.bgDefault) || tone?.bg;
    const fg = ruled?.fg || resolveDynamicColor(props.fg, props.fgDefault) || tone?.fg;
    const icon = props.icon || (props.statusIcon !== false && status ? status.icon : "");
    return (
      <span
        className={`dsb-chip v-${props.variant || "solid"} s-${props.size || "md"}`}
        style={{
          ...style,
          background: props.variant === "outline" ? "transparent" : bg,
          color: fg,
          borderColor: tone && !ruled?.bg && !props.bg ? tone.border : bg,
        }}
        onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
      >
        {icon ? <Icon name={icon} size={12} /> : null}
        {props.text}
      </span>
    );
  },
};

const AvatarDef = {
  type: "Avatar",
  label: "Avatar",
  icon: "CircleUser",
  category: "Data",
  defaultProps: { name: "Ramesh Kumar", src: "", size: 40, shape: "circle", color: "#2563eb", colorDefault: "" },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("name", "Name", GROUPS.CONTENT, { placeholder: "{{row.PatientName}}" }),
    p.template("src", "Image URL", GROUPS.DATA, { placeholder: "{{row.PhotoUrl}}" }),
    p.number("size", "Size (px)"),
    p.select("shape", "Shape", [
      { value: "circle", label: "Circle" },
      { value: "rounded", label: "Rounded" },
    ]),
    p.dynamicColor("color", "Fallback colour"),
  ],
  render: ({ node, props, style, rt }) => {
    const initials = String(props.name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase();
    const size = Number(props.size) || 40;
    return (
      <span
        className="dsb-avatar"
        style={{
          ...style,
          width: size,
          height: size,
          borderRadius: props.shape === "rounded" ? "var(--dsb-radius)" : "50%",
          background: props.src ? undefined : resolveDynamicColor(props.color, props.colorDefault),
          fontSize: Math.round(size / 2.6),
        }}
        onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
      >
        {props.src ? <img src={props.src} alt={props.name} /> : initials || "?"}
      </span>
    );
  },
};

const IconDef = {
  type: "IconControl",
  label: "Icon",
  icon: "Sparkles",
  category: "Data",
  defaultProps: { icon: "Activity", size: 20, color: "", colorDefault: "", bg: "", bgDefault: "", pad: 0 },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.icon("icon", "Icon"),
    p.number("size", "Size"),
    p.dynamicColor("color", "Colour"),
    p.dynamicColor("bg", "Background"),
    p.number("pad", "Padding"),
  ],
  render: ({ node, props, style, rt }) => (
    <span
      className="dsb-iconbox"
      style={{
        ...style,
        background: resolveDynamicColor(props.bg, props.bgDefault),
        padding: props.pad || 0,
        color: resolveDynamicColor(props.color, props.colorDefault),
      }}
      onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
    >
      <Icon name={props.icon} size={Number(props.size) || 20} />
    </span>
  ),
};

const InfoTileDef = {
  type: "InfoTile",
  label: "Info Tile",
  icon: "Info",
  category: "Data",
  bindable: true,
  defaultProps: {
    label: "Bed",
    value: "—",
    icon: "BedDouble",
    accent: "#2563eb",
    accentDefault: "",
    valueColor: "",
    valueColorDefault: "",
    valueClamp: "",
    valueMaxChars: "",
    valueTip: true,
    valueLabels: [],
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("label", "Label", GROUPS.CONTENT, { placeholder: "Bed" }),
    p.template("value", "Value", GROUPS.DATA, { placeholder: "{{row.Bed}}" }),
    p.valueLabels("valueLabels", "Show text instead of the value", GROUPS.DATA),
    p.icon("icon", "Icon"),
    p.dynamicColor("accent", "Icon accent"),
    p.dynamicColor("valueColor", "Value colour"),
    ...clampProps("value", "value"),
  ],
  render: ({ node, props, style, rt, scope }) => {
    const ruled = resolveColor(node.rules?.color, scope?.row || scope, "text", scope);
    const accent = resolveDynamicColor(props.accent, props.accentDefault) || "#2563eb";
    return (
      <div className="dsb-tile" style={style} onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}>
        <span className="dsb-tile-ic" style={{ color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}>
          <Icon name={props.icon} size={15} />
        </span>
        <div className="dsb-tile-main">
          <div className="dsb-tile-label">{props.label}</div>
          <div
            className="dsb-tile-value"
            style={{ color: ruled?.fg || resolveDynamicColor(props.valueColor, props.valueColorDefault) }}
          >
            <TruncatedText
              text={labelForValue(props.valueLabels, props.value) || "—"}
              lines={props.valueClamp}
              maxChars={props.valueMaxChars}
              tip={props.valueTip !== false}
            />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * VITALS CARD — one reading, its unit, and what normal looks like.
 *
 * A vital is never just a number: 148/95 says nothing on a screen until it is
 * red. So the card carries its own alert — a value to watch, a comparison, and
 * what to do when it trips — rather than every screen wiring a colour rule and
 * a class name by hand. The watched value is a binding like any other prop, so
 * it arrives already resolved against the record and the test is a plain
 * comparison.
 */
const VITAL_ANIMS = [
  { value: "", label: "None (colour only)" },
  { value: "pulse", label: "Pulse" },
  { value: "glow", label: "Glow" },
  { value: "beat", label: "Heartbeat" },
  { value: "blink", label: "Blink" },
  { value: "shake", label: "Shake" },
];

const VitalCardDef = {
  type: "VitalCard",
  label: "Vitals Card",
  icon: "HeartPulse",
  category: "Data",
  bindable: true,
  defaultProps: {
    label: "BP",
    value: "120/80",
    unit: "mmHg",
    range: "90/60 – 120/80",
    icon: "HeartPulse",
    accent: "#e11d48",
    accentDefault: "",
    valueColor: "",
    valueColorDefault: "",
    bgColor: "",
    bgColorDefault: "",
    emptyText: "—",
    alertOn: "",
    alertOp: "gt",
    alertAt: "",
    alertTo: "",
    alertAnim: "pulse",
    alertColor: "",
    alertColorDefault: "#dc2626",
    valueLabels: [],
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("label", "Label", GROUPS.CONTENT, { placeholder: "BP" }),
    p.template("value", "Value", GROUPS.DATA, { placeholder: "{{row.BP}}" }),
    p.template("unit", "Unit", GROUPS.CONTENT, { placeholder: "mmHg" }),
    p.template("range", "Normal range hint", GROUPS.CONTENT),
    p.text("emptyText", "Shown when the value is empty", GROUPS.CONTENT, { placeholder: "—" }),
    p.valueLabels("valueLabels", "Show text instead of the value", GROUPS.DATA, {
      hint: "The alert still tests the reading itself, not the wording.",
    }),
    p.icon("icon", "Icon"),
    p.dynamicColor("accent", "Accent", GROUPS.APPEARANCE, {
      hint: "A swatch, a theme token, or a colour the record carries — {{row.ColorCode}}.",
    }),
    p.dynamicColor("valueColor", "Value colour"),
    p.dynamicColor("bgColor", "Background"),
    {
      key: "__alert",
      label: "Alert",
      type: "note",
      group: GROUPS.BEHAVIOUR,
      text: "When the watched value trips the test below, the card takes the alert colour and, if you pick one, an animation. Leave the value empty and nothing changes.",
    },
    p.template("alertOn", "Watch this value", GROUPS.BEHAVIOUR, {
      placeholder: "{{row.BPSystolic}}",
      hint: "Usually a field of the record. Defaults to the value shown when left empty.",
    }),
    p.select("alertOp", "Test", VITAL_OPS, GROUPS.BEHAVIOUR),
    p.template("alertAt", "Compared with", GROUPS.BEHAVIOUR, {
      placeholder: "140",
      when: (props) => !VITAL_RANGE_OPS.has(props.alertOp),
    }),
    // A band asks for its ends under their own names — "Compared with" plus a
    // second box called "and" is a puzzle.
    p.template("alertAt", "Range from", GROUPS.BEHAVIOUR, {
      placeholder: "70",
      when: (props) => VITAL_RANGE_OPS.has(props.alertOp),
      hint: "A whole range typed in here — 70-120, 70 to 120, 70/120 — works too.",
    }),
    p.template("alertTo", "Range to", GROUPS.BEHAVIOUR, {
      placeholder: "120",
      when: (props) => VITAL_RANGE_OPS.has(props.alertOp),
      hint: "Both ends count as inside. A reading with two parts (155/80) is inside only if both are.",
    }),
    p.select("alertAnim", "Alert animation", VITAL_ANIMS, GROUPS.BEHAVIOUR),
    p.dynamicColor("alertColor", "Alert colour", GROUPS.BEHAVIOUR),
  ],
  render: ({ node, props, style, rt, scope }) => {
    // The same rules a table row or a chip answers to, so a vital can be
    // coloured by the screen's own rule set as well as by its props.
    const ruled = resolveColor(node.rules?.color, scope?.row || scope, "text", scope);
    const ruledCard = resolveColor(node.rules?.color, scope?.row || scope, "card", scope);

    const empty = props.emptyText ?? "—";
    // The wording is for the reader; the alert below still measures the value
    // the record actually carries.
    const worded = labelForValue(props.valueLabels, props.value);
    const shown = worded === "" || worded === null || worded === undefined ? empty : worded;

    // The watched value arrives interpolated like every other prop, so the test
    // is a plain comparison — no second scope, no expression language.
    const watched = props.alertOn === "" || props.alertOn === undefined ? props.value : props.alertOn;
    const op = props.alertOp || "gt";
    // Half-configured tests stay quiet — see readingTrips.
    const alert = readingTrips({ op, at: props.alertAt, to: props.alertTo }, watched);

    const alertColor = resolveDynamicColor(props.alertColor, props.alertColorDefault) || "#dc2626";
    const accent = alert ? alertColor : resolveDynamicColor(props.accent, props.accentDefault) || "var(--dsb-primary)";
    // The canvas animates exactly as the live screen does — picking "Shake" and
    // seeing nothing move is not a preview of anything.
    const anim = alert && props.alertAnim ? `a-${props.alertAnim}` : "";

    return (
      <div
        className={`dsb-vital ${alert ? "is-alert" : ""} ${anim}`.replace(/\s+/g, " ").trim()}
        style={{
          ...style,
          "--dsb-vital-accent": accent,
          "--dsb-vital-alert": alertColor,
          background: ruledCard?.bg || resolveDynamicColor(props.bgColor, props.bgColorDefault) || style?.background,
        }}
        onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
      >
        <div className="dsb-vital-top">
          <span className="dsb-vital-label">{props.label}</span>
          <Icon name={props.icon} size={14} />
        </div>
        <div
          className="dsb-vital-value"
          style={{ color: alert ? alertColor : ruled?.fg || resolveDynamicColor(props.valueColor, props.valueColorDefault) }}
        >
          {shown}
          {props.unit ? <small>{props.unit}</small> : null}
        </div>
        {props.range ? <div className="dsb-vital-range">{props.range}</div> : null}
      </div>
    );
  },
};

const TEXTBLOCK_ALIGN = [...ALIGN_OPTIONS, { value: "between", label: "Space between" }];

/** Which part the icon rides on, and which side of it: "<part>-<side>". */
const TEXTBLOCK_ICON_POS = [
  { value: "label-start", label: "Before the label" },
  { value: "label-end", label: "After the label" },
  { value: "value-start", label: "Before the value" },
  { value: "value-end", label: "After the value" },
];

const TextBlockDef = {
  type: "TextBlock",
  label: "Label + Value",
  icon: "LetterText",
  category: "Data",
  bindable: true,
  defaultProps: {
    label: "Complaint",
    value: "—",
    layout: "stacked",
    align: "left",
    icon: "",
    iconPosition: "label-start",
    iconSize: 14,
    iconColor: "",
    iconColorDefault: "",
    labelColor: "",
    labelColorDefault: "",
    valueColor: "",
    valueColorDefault: "",
    bgColor: "",
    bgColorDefault: "",
    valueClamp: "",
    valueMaxChars: "",
    valueTip: true,
    valueLabels: [],
    preformatted: false,
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.text("label", "Label"),
    p.template("value", "Value", GROUPS.DATA, {
      multiline: true,
      placeholder: "{{row.Complaint}}",
      hint: "Inside a modal or drawer opened from a row, pick the field below and it fills itself.",
    }),
    p.select("layout", "Layout", [
      { value: "stacked", label: "Stacked" },
      { value: "inline", label: "Inline" },
    ]),
    p.select("align", "Align", TEXTBLOCK_ALIGN, GROUPS.APPEARANCE, {
      hint: "Space between keeps the label at the start and pushes the value to the far end.",
    }),
    p.bool("preformatted", "Preformatted (monospace)", GROUPS.APPEARANCE, {
      hint: "Keeps line breaks and spacing and draws it in a fixed-width font — for a payload, a response or anything else read a character at a time.",
    }),
    p.icon("icon", "Icon", GROUPS.CONTENT, { hint: "Optional. Pick one, or bind it to the data." }),
    p.select("iconPosition", "Icon position", TEXTBLOCK_ICON_POS, GROUPS.CONTENT, { when: (pr) => !!pr.icon }),
    p.number("iconSize", "Icon size", GROUPS.APPEARANCE, { when: (pr) => !!pr.icon }),
    p.dynamicColor("iconColor", "Icon colour", GROUPS.APPEARANCE, {
      when: (pr) => !!pr.icon,
      hint: "Left empty, the icon takes the colour of the text beside it.",
    }),
    p.dynamicColor("labelColor", "Label colour", GROUPS.APPEARANCE, {
      hint: "A swatch, a theme token, or a field of the row — the default is used when the field is empty.",
    }),
    p.dynamicColor("valueColor", "Value colour"),
    p.dynamicColor("bgColor", "Background"),
    p.valueLabels("valueLabels", "Show text instead of the value", GROUPS.DATA, {
      hint: 'A status that arrives as "IN" can read "Patient admitted".',
    }),
    ...clampProps("value", "value"),
  ],
  render: ({ node, props, style, rt }) => {
    const bg = resolveDynamicColor(props.bgColor, props.bgColorDefault);
    const pos = props.icon ? props.iconPosition || "label-start" : "";
    const [iconPart, iconSide] = pos.split("-");
    const icon = pos ? (
      <Icon
        name={props.icon}
        size={Number(props.iconSize) || 14}
        color={resolveDynamicColor(props.iconColor, props.iconColorDefault) || undefined}
        className="dsb-tb-icon"
      />
    ) : null;
    // The icon sits inside the part it belongs to, so it takes that part's
    // colour and moves with it when the layout or alignment changes.
    const withIcon = (part, content) =>
      iconPart === part ? (
        <>
          {iconSide === "start" ? icon : null}
          {content}
          {iconSide === "end" ? icon : null}
        </>
      ) : (
        content
      );
    return (
      <div
        className={`dsb-textblock l-${props.layout || "stacked"} a-${props.align || "left"}${bg ? " has-bg" : ""}${
          pos ? " has-icon" : ""
        }`}
        style={bg ? { ...style, background: bg } : style}
        onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
      >
        <div
          className={`dsb-tb-label${iconPart === "label" ? " has-icon" : ""}`}
          style={{ color: resolveDynamicColor(props.labelColor, props.labelColorDefault) }}
        >
          {withIcon("label", iconPart === "label" ? <span>{props.label}</span> : props.label)}
        </div>
        <div
          className={`dsb-tb-value${iconPart === "value" ? " has-icon" : ""}`}
          style={{ color: resolveDynamicColor(props.valueColor, props.valueColorDefault) }}
        >
          {props.preformatted ? (
            // Spacing and line breaks are the content here, so neither the
            // clamp nor the tooltip applies — it is read, not glanced at.
            <pre className="dsb-tb-pre">{String(labelForValue(props.valueLabels, props.value) ?? "")}</pre>
          ) : (
            withIcon(
              "value",
              <TruncatedText
                text={labelForValue(props.valueLabels, props.value)}
                lines={props.valueClamp}
                maxChars={props.valueMaxChars}
                tip={props.valueTip !== false}
              />
            )
          )}
        </div>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  embed — one of the app's own components, inside the screen                  */
/* -------------------------------------------------------------------------- */

/**
 * An app component mounted IN the screen rather than over it.
 *
 * Some parts of a page are not a form and not a grid: the payment panel is a
 * currency, a conversion, a row per payment mode and about fifteen amounts
 * that recompute each other, and every billing screen in the product uses the
 * same PaymentControl for it. Rebuilding that in the builder means rebuilding
 * its arithmetic, and the copy is wrong the day the original changes.
 *
 * So the real component goes in, where it stands in the layout. What the
 * screen knows goes in through "Pass to the component" (templates, so they
 * follow the form), and what the component works out comes back through its
 * own callbacks — the same wiring the app-modal host uses, which is what makes
 * {{vars.paymentDetail}} available to the save chain.
 */
function AppComponentNode({ node, props, style, rt, scope }) {
  const spec = appModal(props.component, rt?.screen?.appModals);

  // Lazily, per component: these are heavy (their own API calls, their own
  // grids) and a screen that does not use one must not pay for it.
  const Comp = useMemo(() => {
    if (!spec) return null;
    return React.lazy(() =>
      spec
        .load()
        .then((m) => ({ default: withStandIns(m.default) }))
        .catch(() => ({ default: () => <div className="dsb-muted">Could not load {spec.label}</div> })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec?.key]);

  /** What the screen hands it: each row is a prop, each value a template. */
  const passed = useMemo(() => {
    const out = {};
    (Array.isArray(props.propsMap) ? props.propsMap : []).forEach((row) => {
      const name = String(row?.name || "").trim();
      if (name) out[name] = row.value;
    });
    return out;
  }, [props.propsMap]);

  /**
   * What it hands back.
   *
   * A component reports through a prop it calls — PaymentControl calls
   * `setPaymentMethod` with the rows the user entered. Name it, give it a
   * chain, and what it passed is {{args.0}} (a record also reads as
   * {{modal.Field}}); a "Set variable" step is usually the whole chain, and
   * the payload then reads {{vars.<name>}}.
   */
  const callbackProps = useMemo(() => {
    const out = {};
    (Array.isArray(props.callbacks) ? props.callbacks : []).forEach((cb) => {
      const name = String(cb?.name || "").trim();
      if (!name || !Array.isArray(cb.actions) || !cb.actions.length) return;
      out[name] = (...args) =>
        rt?.runActions?.(cb.actions, {
          row: scope?.row ?? null,
          args,
          arg: args[0],
          modal: args[0] && typeof args[0] === "object" && !Array.isArray(args[0]) ? args[0] : {},
        });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.callbacks, rt, scope?.row]);

  const box = {
    ...style,
    minHeight: props.minHeight ? cssSize(props.minHeight, undefined) : undefined,
  };

  if (!spec) {
    return (
      <div className="dsb-embed is-empty" style={box}>
        <Icon name="AppWindow" size={16} />
        <span>Pick the app component this should mount.</span>
      </div>
    );
  }

  /**
   * The canvas shows what it is, not the thing itself.
   *
   * These components call endpoints the moment they mount and write to the
   * app's store; a designer dragging a layout around should not be firing a
   * payment panel's currency lookups, and a canvas that did would be unusable.
   */
  if (rt?.design) {
    return (
      <div className="dsb-embed is-design" style={box}>
        <Icon name="AppWindow" size={16} />
        <div>
          <b>{spec.label}</b>
          <div className="dsb-muted">{String(props.component || "").replace(/^file:/, "")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dsb-embed${props.framed === false ? " is-plain" : ""}`} style={box}>
      {props.title ? <AppHeading title={tr(props.title)} className="is-embed-head" /> : null}
      <ModalBoundary label={spec.label}>
        <React.Suspense fallback={<Skeleton rows={3} />}>
          <Comp
            data={scope?.row ?? null}
            {...passed}
            // After the passed props, so a callback the screen wired up wins
            // over a value that happens to share its name.
            {...callbackProps}
          />
        </React.Suspense>
      </ModalBoundary>
    </div>
  );
}

const AppComponentDef = {
  type: "AppComponent",
  label: "App component (embed)",
  icon: "AppWindow",
  category: "Data",
  defaultProps: {
    component: "",
    title: "",
    propsMap: [],
    callbacks: [],
    minHeight: "",
    framed: true,
  },
  defaultStyle: {},
  events: [],
  // The chains a callback runs must not be resolved when the node renders:
  // they run later, against the arguments the component passed.
  deferProps: new Set(["callbacks"]),
  propSchema: [
    {
      key: "component",
      label: "Component",
      type: "appComponent",
      group: GROUPS.DATA,
      hint: "Any file under src/pages or src/components. The real one is mounted — not a rebuilt copy of it.",
    },
    p.text("title", "Title above it", GROUPS.CONTENT),
    {
      key: "propsMap",
      label: "Pass to the component",
      type: "propsMap",
      group: GROUPS.DATA,
      hint: "One row per prop. The value is a template, so it follows the form: {{values.PaidAmount}}, {{vars.selectedBill.PanelID}}.",
    },
    {
      key: "callbacks",
      label: "When it calls back",
      type: "appCallbacks",
      group: GROUPS.BEHAVIOUR,
    },
    p.text("minHeight", "Minimum height", GROUPS.LAYOUT, { placeholder: "240px / 40vh" }),
    p.bool("framed", "Draw a card around it", GROUPS.APPEARANCE),
  ],
  render: ({ node, props, style, rt, scope }) => (
    <AppComponentNode node={node} props={props} style={style} rt={rt} scope={scope} />
  ),
};

const HeadingDef = {
  type: "Heading",
  label: "Heading / Text",
  icon: "Heading",
  category: "Data",
  defaultProps: { text: "Section title", level: "h3", weight: 600, color: "", colorDefault: "", align: "left", size: 15 },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("text", "Text", GROUPS.CONTENT, { placeholder: "{{row.PatientName}}" }),
    p.select("level", "Element", [
      { value: "h1", label: "H1" },
      { value: "h2", label: "H2" },
      { value: "h3", label: "H3" },
      { value: "h4", label: "H4" },
      { value: "p", label: "Paragraph" },
    ]),
    p.number("size", "Font size"),
    p.number("weight", "Font weight"),
    p.dynamicColor("color", "Colour"),
    p.select("align", "Align", ALIGN_OPTIONS),
  ],
  render: ({ node, props, style, rt }) => {
    const Tag = props.level || "h3";
    return (
      <Tag
        className="dsb-heading"
        style={{
          ...style,
          fontSize: props.size ? `${props.size}px` : undefined,
          fontWeight: props.weight,
          color: resolveDynamicColor(props.color, props.colorDefault),
          textAlign: props.align,
        }}
        onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
      >
        {props.text}
      </Tag>
    );
  },
};

/* ------------------------------------------------- overlays & notifications */

/**
 * The screen's own skin, re-established around content that left the screen.
 *
 * PrimeReact's Dialog renders through a portal onto <body>, so a modal's
 * contents sit OUTSIDE the .dsb-screen element that carries the theme's --dsb-*
 * variables and that every runtime rule is scoped to. Nothing applies out
 * there: not the grid that puts six controls in a row, not the height and
 * baseline normalisation that keeps an input, a select and a calendar on one
 * line — which is exactly what a modal full of overlapping half-width controls
 * looks like. Re-declaring the class and the variables inside the dialog costs
 * one div and makes the modal's body obey the same stylesheet as the page.
 */
function ScreenScope({ rt, className = "", style, children }) {
  const theme = rt?.screen?.theme;
  const vars = useMemo(() => tokensToCssVars(resolveTokens(theme)), [theme]);
  // Portalled out of the screen root, so its `dir` has to be restated here.
  const dir = useScreenDir(theme);
  return (
    <div
      className={`dsb-screen dsb-bp-${rt?.breakpoint || "desktop"} ${theme?.mode === "dark" ? "is-dark" : ""} ${className}`.trim()}
      style={{ ...vars, ...style }}
      dir={dir}
    >
      {children}
    </div>
  );
}

/**
 * A width the project's <Modal> understands.
 *
 * The inspector's field is a number of pixels, because that is what people mean
 * by "how wide"; a designer who wants the dialog to track the viewport can type
 * "60vw" instead and it is passed through untouched.
 */
/**
 * What an overlay hands the keyboard once it has finished opening.
 *
 * Real controls only. A blanket `[tabindex]` also matches things that are
 * focusable so a keyboard can REACH them — a truncated value that carries its
 * full text in a tooltip — and landing on one of those on open pops a bubble
 * nobody asked for.
 */
const FOCUSABLE =
  "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href]";

/** A size the inspector's plain box understands: 120 -> "120px", 100% as typed. */
const cssSize = (v, fallback) => {
  const raw = v === "" || v === null || v === undefined ? fallback : v;
  if (raw === "auto" || raw === undefined) return undefined;
  return /^\d+(\.\d+)?$/.test(String(raw)) ? `${raw}px` : String(raw);
};

/** Same rule as `modalWidth`, with the drawer's own default. */
const drawerWidth = (w, fallback = "420px") => {
  if (w === "" || w === null || w === undefined) return fallback;
  return /^\d+(\.\d+)?$/.test(String(w)) ? `${w}px` : String(w);
};

const modalWidth = (w) => {
  if (w === "" || w === null || w === undefined) return "520px";
  return /^\d+(\.\d+)?$/.test(String(w)) ? `${w}px` : String(w);
};

/**
 * An overlay's style minus how it sits in its parent.
 *
 * Dropped into a row, a modal is seeded `flex: 1 1 200px`; Size → Fill writes
 * `width: 100%`. Neither means anything for a dialog — and spread onto the
 * PrimeReact Dialog, whose mask is a flex box, `flex-grow` stretched it across
 * the screen whatever its Width said. Colours and type still apply.
 */
const IN_PARENT_KEYS = [
  "flex", "flexGrow", "flexShrink", "flexBasis", "width", "minWidth", "maxWidth",
  "alignSelf", "justifySelf", "order", "gridColumn", "gridRow", "gridArea",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
];
const overlayStyle = (style) => {
  if (!style) return style;
  const out = { ...style };
  IN_PARENT_KEYS.forEach((k) => delete out[k]);
  return out;
};

/**
 * The app's own <Modal> (PrimeReact Dialog + SaveButton/CancelButton), not a
 * builder copy — so a dialog raised from a built screen is the same dialog
 * every hand-coded page raises: same header rule, same divider, same theme
 * class, same footer buttons in the same order.
 *
 * The footer is composed here rather than left to Modal's own. Modal renders
 * Save AND Cancel or nothing at all (its `footer` prop replaces the lot), and
 * "confirm only", "close only" and "no footer" are all normal dialogs — so the
 * component is handed a finished footer built from the three switches below.
 *
 * Save runs the node's `onSave` chain, which is the ordinary event editor: an
 * endpoint, a confirm above it, a toast and a refresh after it. The dialog
 * closes only if that chain ran to the end, so a rejected insert leaves the
 * form open with what was typed still in it.
 */
/**
 * RECORD DETAILS — the record an overlay stands on, as label/value pairs.
 *
 * The piece that was missing between "a row was clicked" and "the drawer shows
 * that patient". The row already reaches every component inside a row-opened
 * modal or drawer as `{{row.Field}}`, but spelling that out one Label + Value
 * at a time is a dozen components and a dozen exact field names for what is
 * really one instruction: show these fields of this record.
 *
 * With nothing configured it shows the whole record, so dropping it into a
 * drawer is enough to see what the click actually carried — then fields are
 * picked, renamed and formatted from the inspector.
 */
const RecordDetailsDef = {
  type: "RecordDetails",
  label: "Record Details",
  icon: "ClipboardList",
  category: "Data",
  bindable: true,
  defaultProps: {
    title: "",
    fields: [],
    perRow: 2,
    layout: "stacked",
    emptyText: "—",
    hideEmpty: false,
    valueClamp: "",
    valueMaxChars: "",
    valueTip: true,
    valueLabels: [],
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("title", "Title", GROUPS.CONTENT, { placeholder: "{{row.PatientName}}" }),
    p.recordFields("fields", "Fields", GROUPS.DATA, {
      hint: "Leave empty to show every field the record carries.",
    }),
    p.number("perRow", "Fields per row", GROUPS.LAYOUT),
    p.select("layout", "Label position", [
      { value: "stacked", label: "Above the value" },
      { value: "inline", label: "Beside the value" },
    ]),
    p.text("emptyText", "Shown when a field is empty", GROUPS.APPEARANCE, { placeholder: "—" }),
    p.bool("hideEmpty", "Hide empty fields"),
    p.bool("fieldIcons", "Icon beside each label", GROUPS.APPEARANCE, {
      hint: "Read off the label: Gender, Marital Status, Address, Blood Group… each gets its own. On unless switched off.",
    }),
    p.valueLabels("valueLabels", "Show text instead of a value", GROUPS.DATA, {
      hint: "Applies to every field listed here — a code like IN reads the same wherever it appears.",
    }),
    ...clampProps("value", "field value"),
  ],
  render: ({ node, props, style, rt, scope, design }) => {
    const row = scope?.row;
    const picked = (Array.isArray(props.fields) ? props.fields : []).filter((f) => f && f.key);
    // Nothing picked: show what the record has. Objects and arrays are skipped —
    // a nested payload is not a value anyone reads off a details panel.
    const items = picked.length
      ? picked
      : Object.keys(row || {})
          .filter((k) => !k.startsWith("__") && (row[k] === null || typeof row[k] !== "object"))
          .map((k) => ({ key: k, label: humanizeKey(k), type: "text" }));

    if (!items.length) {
      return design ? (
        <div className="dsb-record is-empty" style={style}>
          <EmptyState
            icon="ClipboardList"
            title="No record yet"
            hint="Put this inside a modal or drawer that a row action opens — it then shows that row."
          />
        </div>
      ) : null;
    }

    const empty = props.emptyText ?? "—";
    const cells = items
      .map((f) => {
        const raw = labelForValue(props.valueLabels, getPath(row || {}, f.key));
        const text = formatValue(raw, f.type || "text", { placeholder: empty });
        return { ...f, text: text === "" ? empty : text, blank: raw === null || raw === undefined || raw === "" };
      })
      .filter((c) => !(props.hideEmpty && c.blank));

    return (
      <div
        className={`dsb-record l-${props.layout || "stacked"}`}
        style={style}
        onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
      >
        {props.title ? <AppHeading title={props.title} className="is-record-head" /> : null}
        <div
          className="dsb-record-grid"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, Number(props.perRow) || 1))}, minmax(0, 1fr))` }}
        >
          {cells.map((c, i) => {
            const label = c.label || humanizeKey(c.key);
            const ic = props.fieldIcons === false ? "" : c.icon || suggestIcon(label);
            return (
            <div className="dsb-record-item" key={`${c.key}:${i}`}>
              <div className="dsb-record-label">
                {ic ? <Icon name={ic} size={12} className="dsb-record-ic" /> : null}
                {label}
              </div>
              <div className="dsb-record-value">
                <TruncatedText
                  text={c.text}
                  lines={props.valueClamp}
                  maxChars={props.valueMaxChars}
                  tip={props.valueTip !== false}
                />
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  },
};

/* -------------------------------------------------------------- FieldCard */

/**
 * FIELD CARD — one labelled fact, with an icon: [bed] BED / G-WARD/G01/1.
 *
 * The unit a patient header is actually built out of, and the thing every
 * screen was rebuilding out of a Row, an Icon and two Label + Values. Info Tile
 * is the same three pieces arranged the other way (icon in a chip beside the
 * text); this one stacks, which is what fits in a strip across the top of a
 * record.
 *
 * Every part of it is bindable, the icon included — `{{row.StatusIcon}}` in the
 * icon prop resolves to a name like any other template, so a row can carry its
 * own icon rather than every card on the screen showing the same one.
 */
const FieldCardDef = {
  type: "FieldCard",
  label: "Field Card",
  icon: "IdCard",
  category: "Data",
  bindable: true,
  defaultProps: {
    icon: "BedDouble",
    label: "Bed",
    value: "—",
    accent: "",
    accentDefault: "",
    layout: "stacked",
    align: "left",
    plain: false,
    emptyText: "—",
    valueClamp: "",
    valueMaxChars: "",
    valueTip: true,
    valueLabels: [],
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.icon("icon", "Icon", GROUPS.CONTENT, { hint: "Pick one, or bind it to the data from the same panel." }),
    p.template("label", "Label", GROUPS.CONTENT, { placeholder: "Bed" }),
    p.template("value", "Value", GROUPS.DATA, { placeholder: "{{row.Bed}}" }),
    p.dynamicColor("accent", "Icon colour"),
    p.select("layout", "Layout", [
      { value: "stacked", label: "Value under the label" },
      { value: "inline", label: "Value beside the label" },
    ]),
    p.select("align", "Align", ALIGN_OPTIONS),
    p.bool("plain", "No card border", GROUPS.APPEARANCE),
    p.text("emptyText", "Shown when the value is empty", GROUPS.APPEARANCE, { placeholder: "—" }),
    p.valueLabels("valueLabels", "Show text instead of the value", GROUPS.DATA, {
      hint: 'A status that arrives as "IN" can read "Patient admitted".',
    }),
    ...clampProps("value", "value"),
  ],
  render: ({ node, props, style, rt, scope }) => {
    // Same colour rules a table row or a chip answers to, so a card can go red
    // on the record it is showing rather than only on a fixed colour.
    const ruled = resolveColor(node.rules?.color, scope?.row || scope, "text", scope);
    const empty = props.emptyText ?? "—";
    const shown = labelForValue(props.valueLabels, props.value);
    const value = shown === "" || shown === null || shown === undefined ? empty : shown;
    return (
      <div
        className={`dsb-fieldcard l-${props.layout || "stacked"} a-${props.align || "left"} ${props.plain ? "is-plain" : ""}`}
        style={{
          ...style,
          "--dsb-fc-accent": resolveDynamicColor(props.accent, props.accentDefault),
          background: ruled?.bg || style?.background,
        }}
        onClick={() => !props.disabled && rt?.runEvent(node, "onClick", {})}
      >
        <div className="dsb-fieldcard-top">
          {props.icon ? <Icon name={props.icon} size={13} /> : null}
          <span className="dsb-fieldcard-label">{props.label}</span>
        </div>
        <div className="dsb-fieldcard-value" style={{ color: ruled?.fg || undefined }}>
          <TruncatedText text={value} lines={props.valueClamp} maxChars={props.valueMaxChars} tip={props.valueTip !== false} />
        </div>
      </div>
    );
  },
};

const ModalDef = {
  type: "ModalDialog",
  label: "Modal / Dialog",
  icon: "AppWindow",
  category: "Overlay",
  isContainer: true,
  dropHint: "Modal body",
  defaultProps: {
    title: "Dialog",
    width: 520,
    openByDefault: false,
    showFooter: true,
    showSave: true,
    showCancel: true,
    okText: "Save",
    cancelText: "Cancel",
    saveDisabled: false,
    closeOnSave: true,
    // Blank means the body stacks, which is what a dialog did before it could
    // do anything else — an existing modal is not rearranged by this arriving.
    perRow: "",
    colsLg: "",
    colsMd: "",
    colsSm: "",
    gap: 12,
  },
  defaultStyle: {},
  events: ["onOpen", "onClose", "onSave", "onCancel"],
  propSchema: [
    {
      key: "__record",
      label: "Record",
      type: "note",
      group: GROUPS.DATA,
      // Reads the screen rather than describing it: the same lookup the field
      // pickers use, so this says what THIS overlay will actually be handed.
      text: (ctx) =>
        ctx?.rowSource
          ? `Opened from ${ctx.rowSource}. Everything inside reads the clicked row as {{row.Field}} — a Label + Value, a title, an input's default. Drop in a Record Details to list its fields at once.`
          : "Nothing opens this on a record yet. Point a table's onRowClick (or a row icon) at it with Open side panel / Open modal, and the clicked row reaches everything inside as {{row.Field}}.",
    },
    p.template("title", "Title", GROUPS.DATA, { hint: "Takes a binding: Patient — {{row.PatientName}}" }),
    p.text("width", "Width", GROUPS.LAYOUT, { placeholder: "520  ·  or 60vw" }),
    p.bool("openByDefault", "Open by default"),
    p.bool("showFooter", "Show footer", GROUPS.LAYOUT),
    p.bool("showSave", "Show save button", GROUPS.LAYOUT, { when: (pr) => (pr.showFooter ?? pr.footer ?? true) !== false }),
    p.bool("showCancel", "Show cancel button", GROUPS.LAYOUT, { when: (pr) => (pr.showFooter ?? pr.footer ?? true) !== false }),
    p.text("okText", "Save button text", GROUPS.APPEARANCE, { when: (pr) => (pr.showFooter ?? pr.footer ?? true) !== false && pr.showSave !== false }),
    p.text("cancelText", "Cancel button text", GROUPS.APPEARANCE, { when: (pr) => (pr.showFooter ?? pr.footer ?? true) !== false && pr.showCancel !== false }),
    p.bool("saveDisabled", "Save disabled", GROUPS.LAYOUT, { when: (pr) => (pr.showFooter ?? pr.footer ?? true) !== false && pr.showSave !== false }),
    p.number("perRow", "Controls per row", GROUPS.LAYOUT, {
      hint: "Blank stacks them. Counted against the DIALOG's width, not the browser's — a 520px dialog is not a desktop.",
    }),
    p.number("colsLg", "…in a dialog under 680px", GROUPS.LAYOUT, { when: (pr) => Number(pr.perRow) > 0 }),
    p.number("colsMd", "…under 520px", GROUPS.LAYOUT, { when: (pr) => Number(pr.perRow) > 0 }),
    p.number("colsSm", "…under 400px", GROUPS.LAYOUT, { when: (pr) => Number(pr.perRow) > 0 }),
    p.number("gap", "Gap (px)", GROUPS.LAYOUT, { when: (pr) => Number(pr.perRow) > 0 }),
    p.bool("closeOnSave", "Close after a successful save", GROUPS.LAYOUT, {
      when: (pr) => (pr.showFooter ?? pr.footer ?? true) !== false && pr.showSave !== false,
      hint: "A save that fails leaves the dialog open, whatever this says.",
    }),
    {
      key: "saveNote",
      label: "Saving",
      type: "note",
      group: GROUPS.DATA,
      text: "The API call goes on the onSave event — Call API, the same endpoint picker a table uses. In its payload, {{row.Field}} is the row the dialog was opened on and {{values.field}} is what the dialog's own controls hold.",
    },
  ],
  render: ({ node, props, style, rt, children }) => {
    const open = !!(rt?.ui?.modals?.[node.id] ?? props.openByDefault);
    // Opening is where a dialog loads what it is about — the row's full record,
    // the lookup lists its selects need. Fired on the transition only, and
    // never on the canvas, which draws every dialog open.
    const wasOpen = useRef(false);
    useEffect(() => {
      if (rt?.design || open === wasOpen.current) return;
      wasOpen.current = open;
      rt?.runEvent(node, open ? "onOpen" : "onClose", {});
    }, [open, rt, node]);
    // `footer` is what this switch was called before Save and Cancel could be
    // hidden one at a time, so a screen that turned the footer off then stays
    // off now.
    const hasFooter = (props.showFooter ?? props.footer ?? true) !== false;

    const save = async () => {
      // `onClick` is what this event was called before Save and Cancel were
      // separate, so a screen saved then still runs its chain.
      const ev = node?.events?.onSave ? "onSave" : "onClick";
      const ok = await rt?.runEvent(node, ev, {});
      if (ok !== false && props.closeOnSave !== false) rt?.closeModal(node.id);
      // Whatever opened this dialog asked for something to reload once it
      // saves — a Select + Add's own options, so the new entry is there.
      if (ok !== false) rt?.modalSaved?.(node.id);
    };
    const cancel = () => {
      rt?.runEvent(node, "onCancel", {});
      rt?.closeModal(node.id);
    };

    // The body as a row of controls when a count is set, and the plain stack it
    // has always been when it is not. Same element in both places, so what the
    // canvas shows is what the dialog opens with.
    const across = Number(props.perRow) > 0;
    const body = across ? (
      <div
        className="dsb-modal-grid dsb-formgrid"
        style={{
          ...formGridVars({ columns: props.perRow, colsLg: props.colsLg, colsMd: props.colsMd, colsSm: props.colsSm }),
          gap: `${props.gap ?? 12}px`,
        }}
      >
        {children}
      </div>
    ) : (
      children
    );

    const footer =
      !hasFooter ? (
        // Modal draws its own Save/Cancel unless it is given a footer, so "no
        // footer" is a marker element the stylesheet removes the bar around.
        <span className="dsb-modal-nofoot" />
      ) : (
        <div className="ftr_btn">
          {props.showSave === false ? null : (
            <SaveButton btnName={props.okText || "Save"} onClick={save} disabled={!!props.saveDisabled} />
          )}
          {props.showCancel === false ? null : (
            <CancelButton cancleBtnName={props.cancelText || "Cancel"} onClick={cancel} />
          )}
        </div>
      );

    if (rt?.design) {
      // On the canvas a modal renders inline so its contents stay editable, and
      // shows the footer it will actually have — the switches above are worth
      // nothing if their result is only visible at runtime.
      return (
        // Capped at the width it will actually open at, so the canvas answers
        // "do four fit across?" the same way the dialog will.
        <div
          className="dsb-modal-inline"
          style={{ ...overlayStyle(style), width: modalWidth(props.width), maxWidth: "100%", flex: "0 0 auto" }}
        >
          <div className="dsb-modal-head">
            <span>{props.title}</span>
            <span className="dsb-modal-flag">modal</span>
          </div>
          <div className="dsb-modal-body">{body}</div>
          {hasFooter ? <div className="dsb-modal-foot">{footer}</div> : null}
        </div>
      );
    }
    if (!open) return null;
    return (
      <ProjectModal
        visible
        setVisible={() => rt?.closeModal(node.id)}
        Header={props.title}
        modalWidth={modalWidth(props.width)}
        style={overlayStyle(style)}
        footer={footer}
      >
        <ScreenScope rt={rt} className="dsb-modal-scope">
          {body}
        </ScreenScope>
      </ProjectModal>
    );
  },
};

const DrawerDef = {
  type: "DrawerPanel",
  label: "Drawer / Side Panel",
  icon: "PanelRightOpen",
  category: "Overlay",
  isContainer: true,
  dropHint: "Drawer body",
  defaultProps: { title: "Details", width: 420, height: "", side: "right", closable: true, openByDefault: false, overlay: true },
  defaultStyle: {},
  // A drawer that cannot say when it opened is a drawer whose contents have to
  // be loaded by whoever opened it.
  events: ["onOpen", "onClose"],
  propSchema: [
    {
      key: "__record",
      label: "Record",
      type: "note",
      group: GROUPS.DATA,
      // Reads the screen rather than describing it: the same lookup the field
      // pickers use, so this says what THIS overlay will actually be handed.
      text: (ctx) =>
        ctx?.rowSource
          ? `Opened from ${ctx.rowSource}. Everything inside reads the clicked row as {{row.Field}} — a Label + Value, a title, an input's default. Drop in a Record Details to list its fields at once.`
          : "Nothing opens this on a record yet. Point a table's onRowClick (or a row icon) at it with Open side panel / Open modal, and the clicked row reaches everything inside as {{row.Field}}.",
    },
    p.template("title", "Title", GROUPS.CONTENT, { hint: "Takes a binding: Patient — {{row.PatientName}}" }),
    p.select("side", "Opens from", [
      { value: "right", label: "The right" },
      { value: "left", label: "The left" },
      { value: "bottom", label: "The bottom — a full-width sheet" },
      { value: "top", label: "The top — a full-width sheet" },
    ]),
    p.text("width", "Width", GROUPS.LAYOUT, {
      placeholder: "420 · 90vw · 100%",
      hint: "A plain number is px. A sheet from the bottom or the top is the full width unless one is given here.",
    }),
    p.text("height", "Height", GROUPS.LAYOUT, {
      when: (pr) => pr.side === "bottom" || pr.side === "top",
      placeholder: "92vh · 600",
      hint: "How tall the sheet opens. Empty is 92vh, which leaves the page showing behind it.",
    }),
    p.bool("closable", "Closable"),
    p.bool("overlay", "Dim background"),
    p.bool("openByDefault", "Open by default"),
  ],
  render: ({ node, props, style, rt, children }) => {
    const open = !!(rt?.ui?.panels?.[node.id] ?? props.openByDefault);
    const design = !!rt?.design;
    const close = useCallback(() => rt?.closePanel(node.id), [rt, node.id]);
    // On the transition, not on every render the panel stands open: opening is
    // where a detail panel loads what it is about, closing is where the list
    // behind it is refreshed. The canvas draws the panel inline and fires
    // neither.
    const wasOpen = useRef(false);
    useEffect(() => {
      if (design || open === wasOpen.current) return;
      wasOpen.current = open;
      rt?.runEvent(node, open ? "onOpen" : "onClose", {});
    }, [open, design, rt, node]);
    useBodyScrollLock(open && !design);
    useEscapeKey(open && !design && props.closable !== false, close);
    // Marks the page so a dialog raised from inside the drawer is stacked over
    // it rather than under it — see `.dsb-drawer-open` in runtime.css.
    useBodyFlag(open && !design, "dsb-drawer-open");

    // Opening has to read as one movement, which is as much about what the
    // panel does NOT do: it never opens half-scrolled from the last time, and
    // the keyboard follows it in and comes back out to whatever raised it.
    const bodyRef = useRef(null);
    const openerRef = useRef(null);
    useEffect(() => {
      if (design) return undefined;
      if (!open) {
        const opener = openerRef.current;
        openerRef.current = null;
        opener?.focus?.();
        return undefined;
      }
      openerRef.current = document.activeElement;
      const el = bodyRef.current;
      if (el) el.scrollTop = 0;
      // After the slide, not during it: focusing something inside a panel that
      // is still travelling makes the browser scroll to it and fight the
      // animation.
      const t = window.setTimeout(() => {
        el?.querySelector(FOCUSABLE)?.focus?.({ preventScroll: true });
      }, 280);
      return () => window.clearTimeout(t);
    }, [open, design]);

    if (design) {
      return (
        <div className="dsb-modal-inline" style={overlayStyle(style)}>
          <div className="dsb-modal-head">
            <span>{props.title}</span>
            <span className="dsb-modal-flag">drawer</span>
          </div>
          <div className="dsb-modal-body">{children}</div>
        </div>
      );
    }

    const side = props.side || "right";
    // A panel hanging off the edge of the VIEWPORT has to be positioned against
    // the viewport — and `position: fixed` quietly stops meaning that inside any
    // transformed ancestor, which the canvas's zoom wrapper is at every zoom
    // including 1. That is why a drawer opened over a scrolled table landed
    // beside it instead of over it. Portalling to <body> puts the panel outside
    // every wrapper, so it lands in the same place whatever the page is doing.
    return createPortal(
      <ScreenScope
        rt={rt}
        className={`dsb-drawer-root s-${side} ${open ? "is-open" : ""} ${props.overlay ? "has-dim" : ""}`}
        style={{
          // A sheet spans the screen unless a width is typed; a side panel
          // keeps its own default.
          "--dsb-drawer-w": drawerWidth(props.width, side === "bottom" || side === "top" ? "100vw" : "420px"),
          ...(props.height ? { "--dsb-drawer-h": cssSize(props.height) } : null),
        }}
      >
        {props.overlay ? <div className="dsb-drawer-dim" onClick={close} /> : null}
        <aside
          className={`dsb-drawer s-${side}`}
          style={overlayStyle(style)}
          role="dialog"
          aria-modal="true"
          aria-label={typeof props.title === "string" ? props.title : "Panel"}
          aria-hidden={open ? undefined : "true"}
        >
          <div className="dsb-drawer-head">
            <span className="dsb-drawer-title">{props.title}</span>
            {props.closable ? (
              <button type="button" className="dsb-drawer-x" onClick={close} title="Close" aria-label="Close">
                <Icon name="X" size={16} />
              </button>
            ) : null}
          </div>
          <div className="dsb-drawer-body" ref={bodyRef}>
            <div className="dsb-drawer-scope">{children}</div>
          </div>
        </aside>
      </ScreenScope>,
      document.body,
    );
  },
};

const TooltipDef = {
  type: "TooltipText",
  label: "Tooltip",
  icon: "MessageCircleQuestion",
  category: "Overlay",
  defaultProps: { text: "Waiting Type", tip: "Time the patient has been waiting", icon: "Info", placement: "top" },
  defaultStyle: {},
  events: [],
  propSchema: [
    p.template("text", "Text", GROUPS.CONTENT, { placeholder: "{{row.WaitingType}}" }),
    p.template("tip", "Tooltip content", GROUPS.CONTENT),
    p.icon("icon", "Icon"),
    p.select("placement", "Placement", [
      { value: "top", label: "Top" },
      { value: "bottom", label: "Bottom" },
    ]),
  ],
  render: ({ props, style }) => (
    <span className={`dsb-tooltip p-${props.placement || "top"}`} data-tip={props.tip} style={style}>
      {props.text}
      {props.icon ? <Icon name={props.icon} size={12} /> : null}
    </span>
  ),
};

/** The glyph each toast variant carries when none is picked. */
const TOAST_ICONS = { success: "CheckCircle2", info: "Info", warning: "AlertTriangle", danger: "CircleX" };

const ToastDef = {
  type: "ToastBanner",
  label: "Toast / Alert",
  icon: "BellRing",
  category: "Overlay",
  defaultProps: { message: "Saved successfully", variant: "success", icon: "", closable: true, duration: 0 },
  defaultStyle: {},
  events: ["onClose"],
  propSchema: [
    p.template("message", "Message", GROUPS.CONTENT, { placeholder: "{{row.Message}}" }),
    p.select("variant", "Variant", [
      { value: "success", label: "Success" },
      { value: "info", label: "Info" },
      { value: "warning", label: "Warning" },
      { value: "danger", label: "Danger" },
    ]),
    p.icon("icon", "Icon", GROUPS.APPEARANCE, { hint: "Empty uses the variant's own: tick, info, warning or cross." }),
    p.bool("closable", "Closable"),
    p.number("duration", "Dismiss after (ms)", GROUPS.BEHAVIOUR, { hint: "0 keeps it on screen until it is closed" }),
  ],
  render: ({ node, props, style, rt }) => {
    const [gone, setGone] = useState(false);
    const design = !!rt?.design;
    const close = useCallback(() => {
      setGone(true);
      if (!design) rt?.runEvent(node, "onClose", {});
    }, [design, rt, node]);

    // A banner that says "saved" belongs on screen for a moment, not for the
    // rest of the session. Nothing ticks on the canvas, where the component has
    // to stay visible to be edited.
    const ms = Number(props.duration) || 0;
    useEffect(() => {
      if (design || gone || ms <= 0) return undefined;
      const t = setTimeout(close, ms);
      return () => clearTimeout(t);
    }, [design, gone, ms, close]);

    if (gone) return null;
    return (
      <div
        className={`dsb-toast v-${props.variant || "info"}`}
        style={style}
        role={props.variant === "danger" || props.variant === "warning" ? "alert" : "status"}
      >
        <Icon name={props.icon || TOAST_ICONS[props.variant] || "Info"} size={16} />
        <span>{props.message}</span>
        {props.closable ? (
          <button type="button" className="dsb-icon-btn" data-dsb-interactive onClick={close} title="Dismiss" aria-label="Dismiss">
            <Icon name="X" size={13} />
          </button>
        ) : null}
      </div>
    );
  },
};

/**
 * The project's own page heading (src/components/UI/Heading.jsx) — the same
 * card/Aurora header every hand-coded screen uses, including its breadcrumb,
 * search box and action button.
 */
const PageHeadingDef = {
  type: "PageHeading",
  label: "Page Heading",
  icon: "Heading1",
  category: "Data",
  defaultProps: {
    title: "Screen title",
    secondTitle: "",
    icon: "",
    count: "",
    color: "",
    isBreadcrumb: false,
    showSearch: false,
    searchField: "headingSearch",
    searchPlaceholder: "Search…",
    showFilter: false,
    actionLabel: "",
    actionIcon: "",
  },
  defaultStyle: {},
  events: ["onClick", "onSearch"],
  propSchema: [
    p.text("title", "Title"),
    p.text("secondTitle", "Right side text"),
    p.text("icon", "Icon key (app icon set)"),
    p.text("count", "Count badge", GROUPS.DATA),
    p.color("color", "Accent colour"),
    p.bool("isBreadcrumb", "Show breadcrumb instead of the title", GROUPS.BEHAVIOUR, {
      hint: "Read from the app menu entry for this screen's route (/screen/<id>) — in the builder and Preview too, so it shows the trail the published screen will have, not the builder's.",
    }),
    p.text("breadcrumbText", "Breadcrumb text (optional)", GROUPS.CONTENT, {
      when: (pr) => !!pr.isBreadcrumb,
      placeholder: "OPD > Panel Allocation",
      hint: "Typed trail, used instead of the menu's — for a screen not in the menu yet. Separate parts with >.",
    }),
    p.bool("showSearch", "Show search box"),
    p.text("searchField", "Search field name", GROUPS.DATA, { when: (pr) => !!pr.showSearch }),
    p.text("searchPlaceholder", "Search placeholder", GROUPS.CONTENT, { when: (pr) => !!pr.showSearch }),
    p.bool("showFilter", "Show filter button"),
    p.text("actionLabel", "Action button label"),
    p.text("actionIcon", "Action button icon"),
  ],
  render: ({ node, props, style, rt }) => {
    const field = props.searchField || "headingSearch";
    // The trail the app's menu holds for this screen, with the typed title (or
    // the screen's name) standing in wherever the menu cannot answer — on the
    // canvas, and on a screen opened straight from its URL.
    const crumb = useMenuBreadcrumb(props.title || rt?.screen?.name || "", {
      screenId: rt?.screen?.id,
      inBuilder: !!rt && rt.mode !== "runtime",
      custom: props.breadcrumbText,
    });
    const asCrumb = !!props.isBreadcrumb;
    return (
      <div className={`dsb-native ${typographyClass(style)}`.trim()} style={style}>
        <ProjectHeading
          title={asCrumb ? crumb : props.title}
          isSlideScreen={asCrumb}
          secondTitle={props.secondTitle || undefined}
          icon={props.icon || undefined}
          count={props.count === "" ? undefined : props.count}
          color={props.color || undefined}
          isBreadcrumb={!!props.isBreadcrumb}
          showSearch={!!props.showSearch}
          searchPlaceholder={props.searchPlaceholder}
          searchValue={rt?.values?.[field] ?? ""}
          onSearch={(e) => {
            if (!rt || rt.design) return;
            const v = e?.target?.value !== undefined ? e.target.value : e;
            rt.setValue(field, v);
            rt.runEvent(node, "onSearch", { value: v, field });
          }}
          showFilter={!!props.showFilter}
          onFilter={() => rt?.runEvent(node, "onClick", { action: "filter" })}
          actionLabel={props.actionLabel || undefined}
          actionIcon={props.actionIcon || undefined}
          onAction={() => rt?.runEvent(node, "onClick", { action: "primary" })}
        />
      </div>
    );
  },
};

/**
 * The frame menu as a component, for the places that are not a table row: a
 * patient card, a dialog, the panel beside a grid. Same control, same list —
 * it just gets its record from wherever it is standing rather than from a row.
 */
const FrameMenuDef = {
  type: "FrameMenu",
  label: "Frame Menu (patient screens)",
  icon: "Menu",
  category: "Overlay",
  defaultProps: { frameName: "Emergency", label: "More", showPatientHeader: true },
  defaultStyle: {},
  events: [],
  propSchema: [
    p.text("frameName", "Module", GROUPS.DATA, {
      placeholder: "Emergency",
      hint: "The frameName the module is registered under — Emergency, Billing, Counselling. The list itself is filtered by the signed-in role.",
    }),
    p.text("label", "Label beside the icon"),
    p.bool("showPatientHeader", "Show the patient header inside each screen"),
    {
      key: "frameNote",
      label: "Where the record comes from",
      type: "note",
      group: GROUPS.DATA,
      text: "Each screen is handed the record this component is standing on — the table row in a row action, the row a dialog was opened on, otherwise nothing. Put it inside something that has a row.",
    },
  ],
  render: ({ node, props, style, rt, scope }) => (
    <span className={`dsb-native ${typographyClass(style)}`.trim()} style={style}>
      <FrameMenuControl
        rt={rt}
        row={scope?.row}
        frameName={props.frameName}
        showPatientHeader={props.showPatientHeader !== false}
        label={props.label}
      />
    </span>
  ),
};

/* ------------------------------------------------------------------ Image */

/**
 * IMAGE — a picture the record carries: a patient photo, a scan thumbnail, a
 * signature, a logo.
 *
 * Three things a screen always ends up needing and always ends up hand-rolling:
 * a size it is pinned to (so a 4MP upload does not blow the layout apart), a
 * fallback for the rows that have no picture, and a click that opens the full
 * thing. All three are props here.
 *
 * The fallback is the app's own "Image Not Available" avatar, so a built screen
 * shows exactly what a hand-coded one shows for a patient with no photo.
 */
const ImageDef = {
  type: "ImageView",
  label: "Image / Preview",
  icon: "Image",
  category: "Data",
  bindable: true,
  defaultProps: {
    src: "",
    alt: "",
    width: 120,
    height: 120,
    fit: "cover",
    shape: "rounded",
    bordered: true,
    preview: true,
    caption: "",
    fallback: "",
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("src", "Image URL", GROUPS.DATA, {
      placeholder: "{{row.PatientPhoto}}",
      hint: "A URL, a data: URI, or a field of the record. Empty rows fall back to the placeholder below.",
    }),
    p.text("alt", "Alt text", GROUPS.CONTENT, { placeholder: "Patient photo" }),
    p.template("caption", "Caption", GROUPS.CONTENT, { placeholder: "Optional line under the image" }),
    p.text("width", "Width", GROUPS.APPEARANCE, { placeholder: "120, 100% or auto" }),
    p.text("height", "Height", GROUPS.APPEARANCE, { placeholder: "120, 100% or auto" }),
    p.select("fit", "Fit", [
      { value: "cover", label: "Cover (fill the box, crop)" },
      { value: "contain", label: "Contain (whole image, letterboxed)" },
      { value: "fill", label: "Stretch to the box" },
      { value: "none", label: "Original size" },
    ]),
    p.select("shape", "Shape", [
      { value: "rounded", label: "Rounded" },
      { value: "square", label: "Square" },
      { value: "circle", label: "Circle" },
    ]),
    p.bool("bordered", "Border", GROUPS.APPEARANCE),
    p.bool("preview", "Open full size on click", GROUPS.BEHAVIOUR, {
      hint: "Click opens the picture over the screen, at whatever size it really is.",
    }),
    p.text("fallback", "Placeholder image", GROUPS.APPEARANCE, {
      hint: "Shown when the row has no picture, or the URL will not load. Empty uses the app's own.",
    }),
  ],
  render: ({ node, props, style, rt }) => {
    const fallback = props.fallback || NO_IMAGE;
    const wanted = props.src || fallback;
    // A URL that 404s has to end at the placeholder rather than at a broken-image
    // glyph — and the swap is kept in state per URL, so a row changing its photo
    // is tried afresh instead of being written off because the last one failed.
    const [failed, setFailed] = useState("");
    const src = failed && failed === wanted ? fallback : wanted;
    const isFallback = src === fallback;

    const [open, setOpen] = useState(false);
    const canPreview = props.preview !== false && !isFallback;
    const close = useCallback(() => setOpen(false), []);
    useBodyScrollLock(open);
    useEscapeKey(open, close);

    const img = (
      <img
        className="dsb-img-el"
        src={src}
        alt={props.alt || props.caption || ""}
        style={{ objectFit: props.fit || "cover" }}
        onError={() => setFailed(wanted)}
        draggable={false}
      />
    );

    return (
      <figure
        className={`dsb-img s-${props.shape || "rounded"} ${props.bordered ? "is-bordered" : ""} ${
          canPreview ? "is-zoomable" : ""
        }`}
        style={{ ...style, width: cssSize(props.width, 120), height: props.caption ? undefined : cssSize(props.height, 120) }}
      >
        <div
          className="dsb-img-box"
          style={{ height: cssSize(props.height, 120) }}
          onClick={() => {
            rt?.runEvent(node, "onClick", { src });
            if (canPreview && !rt?.design) setOpen(true);
          }}
          role={canPreview ? "button" : undefined}
          tabIndex={canPreview ? 0 : undefined}
          onKeyDown={(e) => {
            if (canPreview && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {img}
          {canPreview ? (
            <span className="dsb-img-zoom">
              <Icon name="ZoomIn" size={15} />
            </span>
          ) : null}
        </div>
        {props.caption ? <figcaption className="dsb-img-cap">{props.caption}</figcaption> : null}
        {open
          ? createPortal(
              <div className="dsb-img-lightbox" onClick={close} role="dialog" aria-modal="true" aria-label={props.alt || "Image"}>
                <button type="button" className="dsb-img-close" onClick={close} aria-label="Close">
                  <Icon name="X" size={18} />
                </button>
                <img src={src} alt={props.alt || ""} onClick={(e) => e.stopPropagation()} />
                {props.caption ? <span className="dsb-img-lightcap">{props.caption}</span> : null}
              </div>,
              document.body,
            )
          : null}
      </figure>
    );
  },
};

/* ------------------------------------------------------------- ActionTile */

/**
 * ACTION TILE — one icon, one name, one thing it opens.
 *
 * The tile the hand-coded patient panel is built out of ("VITAL GRAPH",
 * "CAPTURE VITAL", "LAB RESULTS" …): a labelled icon that opens a real screen
 * on the record underneath it. Everything about it is configured — the name,
 * the icon, its colour, and what the press does.
 *
 * What it opens is a KEY, not a component: `utils/appModals` holds the lazy
 * import, the dialog title and the width for every modal and frame screen the
 * app has, and `AppModalHost` mounts whichever one was named. So a built screen
 * opens the same Lab Results the hand-coded page opens, code-split the same
 * way, and adding a new one is an entry in that file rather than a new control
 * here. Anything the list does not cover — an API call, a drawer on this
 * screen, a confirm-then-save chain — is the Events tab, and both run: the
 * modal opens and the chain follows.
 */
const ActionTileDef = {
  type: "ActionTile",
  label: "Action Tile",
  icon: "MousePointerClick",
  category: "Form",
  bindable: true,
  defaultProps: {
    label: "Vital Graph",
    icon: "LineChart",
    color: "#6d28d9",
    colorDefault: "",
    appModal: "",
    modalTitle: "",
    modalSize: "",
    compact: false,
    disabled: false,
    width: "",
    height: "",
    iconSize: "",
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.template("label", "Label", GROUPS.CONTENT, { placeholder: "Vital Graph" }),
    p.icon("icon", "Icon", GROUPS.CONTENT),
    p.dynamicColor("color", "Icon colour"),
    p.text("width", "Width", GROUPS.APPEARANCE, {
      placeholder: "auto, 120 or 100%",
      hint: "Blank fills the cell it is in, which is what a grid of tiles wants.",
    }),
    p.text("height", "Height", GROUPS.APPEARANCE, { placeholder: "auto or 96" }),
    p.number("iconSize", "Icon size", GROUPS.APPEARANCE, { hint: "Blank follows the tile: 17px, or 14px when compact." }),
    p.bool("compact", "Compact", GROUPS.APPEARANCE),
    {
      key: "__opens",
      label: "Opens",
      type: "note",
      group: GROUPS.BEHAVIOUR,
      text: "Pick one of the app's own screens and it opens on the record this tile sits on — the same component the hand-coded pages open, imported only when it is pressed. For anything else, leave it empty and build the click in the Events tab.",
    },
    // A function, not a list: the screen's own registered modals are part of
    // the choice, and they can be added while this very panel is open.
    p.select("appModal", "Opens", (ctx) => [
      { value: "", label: "Nothing — use the Events tab" },
      ...customModalOptions(ctx?.appModals),
      ...APP_MODAL_OPTIONS,
    ], GROUPS.BEHAVIOUR, { addModal: true, searchable: true }),
    p.template("modalTitle", "Title override", GROUPS.BEHAVIOUR, {
      placeholder: "Vital Sign Chart/Graph",
      when: (props) => !!props.appModal,
      hint: "Blank uses the title that screen is opened with everywhere else.",
    }),
    p.text("modalSize", "Dialog width", GROUPS.BEHAVIOUR, {
      placeholder: "75vw",
      when: (props) => !!props.appModal,
    }),
    p.bool("disabled", "Disabled", GROUPS.BEHAVIOUR),
  ],
  render: ({ node, props, style, rt, scope, design }) => {
    const color = resolveDynamicColor(props.color, props.colorDefault) || "var(--dsb-primary)";
    const row = scope?.row;

    const press = () => {
      if (props.disabled) return;
      // The canvas draws the tile but never opens anything: a click there is
      // someone selecting the node to edit it.
      if (!design && props.appModal) {
        rt?.openAppModal(props.appModal, row, {
          title: props.modalTitle || "",
          size: props.modalSize || "",
          // So a modal that writes can refresh the grid this record came from.
          sourceId: node.props?.dataSourceId || "",
        });
      }
      rt?.runEvent(node, "onClick", { row });
    };

    return (
      <button
        type="button"
        className={`dsb-acttile ${props.compact ? "is-compact" : ""} ${props.disabled ? "is-disabled" : ""}`.replace(/\s+/g, " ").trim()}
        // Blank means "fill the cell", which is what a grid of tiles wants; a
        // number or any CSS length pins it. The Style tab still wins, so a tile
        // sized there is not overruled from here.
        style={{
          width: cssSize(props.width, undefined) ?? undefined,
          height: cssSize(props.height, undefined) ?? undefined,
          ...style,
          "--dsb-tile-color": color,
        }}
        onClick={press}
        disabled={!!props.disabled}
        title={props.label || ""}
      >
        <span className="dsb-acttile-ic">
          <Icon name={props.icon || "Circle"} size={Number(props.iconSize) || (props.compact ? 14 : 17)} />
        </span>
        <span className="dsb-acttile-label">{props.label}</span>
      </button>
    );
  },
};

/* ------------------------------------------------- critical alert panel -- */

const ALERT_MATCH = [
  { value: "any", label: "Any test trips" },
  { value: "all", label: "Every test trips" },
];

const ALERT_CORNERS = [
  { value: "tr", label: "Top right" },
  { value: "tl", label: "Top left" },
  { value: "br", label: "Bottom right" },
  { value: "bl", label: "Bottom left" },
];

/** How the card arrives. */
const ALERT_ENTRIES = [
  { value: "slide", label: "Slide in" },
  { value: "fade", label: "Fade in" },
  { value: "zoom", label: "Zoom in" },
  { value: "pop", label: "Pop in" },
  { value: "none", label: "None" },
];

/** What it does once it is there, until somebody deals with it. */
const ALERT_ATTENTION = [
  { value: "pulse", label: "Pulse ring" },
  { value: "glow", label: "Glow" },
  { value: "shake", label: "Shake" },
  { value: "beat", label: "Heartbeat" },
  { value: "none", label: "Still" },
];

/** One test, against one record. */
const ruleTrips = (rule, row) =>
  !!rule?.field && !!rule?.op && readingTrips({ op: rule.op, at: rule.value, to: rule.to }, row?.[rule.field]);

/**
 * The records worth shouting about.
 *
 * Nothing is flagged until at least one test is configured: a panel that
 * announced every row the moment it was dropped on the canvas would be noise,
 * and worse, noise a nurse learns to dismiss without reading.
 */
function flaggedRows(props, rt) {
  const rules = (Array.isArray(props.rules) ? props.rules : []).filter((r) => r && r.field && r.op);
  if (!rules.length) return NO_ROWS;
  const rows = statRows(props, rt);
  const all = props.matchMode === "all";
  const hit = rows.filter(
    (r) => r && typeof r === "object" && (all ? rules.every((x) => ruleTrips(x, r)) : rules.some((x) => ruleTrips(x, r))),
  );
  return hit.length ? hit : NO_ROWS;
}

/** Buzz the device once, where it has a motor and the browser exposes it. */
function buzz() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate([200, 100, 200]);
  } catch {
    /* a browser that refuses is not a failure worth surfacing */
  }
}

const ALERT_POS_KEY = (id) => `dsb.alert.pos.${id}`;

/** Where the card parks, as CSS, when nobody has dragged it. */
function cornerStyle(corner, ox, oy) {
  switch (corner || "tr") {
    case "tl":
      return { left: `${ox}px`, top: `${oy}px` };
    case "br":
      return { right: `${ox}px`, bottom: `${oy}px` };
    case "bl":
      return { left: `${ox}px`, bottom: `${oy}px` };
    default:
      return { right: `${ox}px`, top: `${oy}px` };
  }
}

/**
 * The viewport a fixed element is actually placed against.
 *
 * Not `innerWidth`: that counts the scrollbar, the containing block of a fixed
 * element does not, and the difference is the few pixels a card would jump by
 * when it stopped being held at a left/top coordinate and went back to being
 * held against `right`.
 */
function viewportBox() {
  const el = typeof document === "undefined" ? null : document.documentElement;
  return {
    w: el?.clientWidth || (typeof window === "undefined" ? 1280 : window.innerWidth),
    h: el?.clientHeight || (typeof window === "undefined" ? 800 : window.innerHeight),
  };
}

/** The same corner as real coordinates, which is what an animated move needs. */
function cornerPoint(corner, ox, oy, w, h) {
  const { w: vw, h: vh } = viewportBox();
  const right = (corner || "tr").includes("r");
  const bottom = (corner || "tr").startsWith("b");
  return {
    x: right ? Math.max(6, vw - w - ox) : ox,
    y: bottom ? Math.max(6, vh - h - oy) : oy,
  };
}

/** The corner a dropped card is closest to, by where its middle landed. */
function nearestCorner(rect) {
  const { w: vw, h: vh } = viewportBox();
  const right = rect.left + rect.width / 2 > vw / 2;
  const bottom = rect.top + rect.height / 2 > vh / 2;
  return `${bottom ? "b" : "t"}${right ? "r" : "l"}`;
}

/**
 * Pick the card up, put it down somewhere useful.
 *
 * Where it is dropped is where it stays. The card starts parked in the corner
 * the screen names, and from the first drag it is held at real viewport
 * coordinates — anywhere on the page, beside the row being read, off the search
 * bar, over the empty half of the table. Nothing pulls it back to an edge.
 *
 * `snapCorner` is the opt-in for the tidier behaviour: the card then travels to
 * whichever corner it was let go nearest and stays in that corner on a resize,
 * for a screen where it must never sit over the data.
 *
 * Where it was left is remembered per component, so the nurse who moved it away
 * from the search bar does not move it again after every reload.
 *
 * Coordinates are viewport ones and clamped to the viewport, because a panel
 * dropped half off the screen cannot be dragged back.
 */
function useDragCard({ enabled, snapCorner, remember, corner, offsetX, offsetY, storeKey }) {
  const ref = useRef(null);
  const grab = useRef({ x: 0, y: 0 });
  const settle = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  // `null` means "wherever the corner props say", which is what keeps the
  // parking spot working after a resize on a card nobody has touched.
  const [pos, setPos] = useState(null);
  const [landed, setLanded] = useState(null);

  // What the last visit left behind. Read once, and defensively: a browser in
  // private mode throws on the first touch of localStorage, and an alert that
  // cannot be shown because it could not remember where it was is absurd.
  useEffect(() => {
    if (!remember || !storeKey) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storeKey) || "null");
      if (saved && saved.corner) setLanded(saved.corner);
      else if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        // The window it was dropped on may have been bigger than this one.
        const { w: vw, h: vh } = viewportBox();
        setPos({ x: Math.max(6, Math.min(vw - 80, saved.x)), y: Math.max(6, Math.min(vh - 60, saved.y)) });
      }
    } catch {
      /* nothing remembered is a perfectly good state */
    }
  }, [remember, storeKey]);

  const keep = useCallback(
    (value) => {
      if (!remember || !storeKey) return;
      try {
        window.localStorage.setItem(storeKey, JSON.stringify(value));
      } catch {
        /* storage full or blocked — the card still works, it just forgets */
      }
    },
    [remember, storeKey],
  );

  const startDrag = useCallback(
    (e) => {
      if (!enabled) return;
      const node = ref.current;
      if (!node) return;
      const point = e.touches ? e.touches[0] : e;
      const rect = node.getBoundingClientRect();
      grab.current = { x: point.clientX - rect.left, y: point.clientY - rect.top };
      window.clearTimeout(settle.current);
      setSettling(false);
      // Hand over from "parked in a corner" to real coordinates at the moment
      // the drag starts, so the card does not jump under the cursor.
      setPos({ x: rect.left, y: rect.top });
      setDragging(true);
      e.preventDefault();
    },
    [enabled],
  );

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      const node = ref.current;
      const w = node ? node.offsetWidth : 300;
      const h = node ? node.offsetHeight : 140;
      const { w: vw, h: vh } = viewportBox();
      setPos({
        x: Math.max(6, Math.min(vw - w - 6, point.clientX - grab.current.x)),
        y: Math.max(6, Math.min(vh - h - 6, point.clientY - grab.current.y)),
      });
    };
    const stop = () => {
      setDragging(false);
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (!snapCorner) {
        setLanded(null);
        keep({ x: rect.left, y: rect.top });
        return;
      }
      const next = nearestCorner(rect);
      setLanded(next);
      keep({ corner: next });
      // Travel to the corner instead of appearing in it, then hand the position
      // back to the corner styles so a later resize keeps it there.
      setSettling(true);
      setPos(cornerPoint(next, offsetX, offsetY, rect.width, rect.height));
      settle.current = window.setTimeout(() => {
        setSettling(false);
        setPos(null);
      }, 320);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging, snapCorner, keep, offsetX, offsetY]);

  // A card dropped in the middle of a wide window would otherwise be left
  // outside a narrow one, where it cannot be reached to be dragged back.
  useEffect(() => {
    const onResize = () => {
      setPos((prev) => {
        if (!prev) return prev;
        const el = ref.current;
        const w = el ? el.offsetWidth : 300;
        const h = el ? el.offsetHeight : 140;
        const { w: vw, h: vh } = viewportBox();
        const next = {
          x: Math.max(6, Math.min(vw - w - 6, prev.x)),
          y: Math.max(6, Math.min(vh - h - 6, prev.y)),
        };
        return next.x === prev.x && next.y === prev.y ? prev : next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  const parked = cornerStyle(landed || corner, offsetX, offsetY);
  const placement = pos ? { left: `${pos.x}px`, top: `${pos.y}px`, right: "auto", bottom: "auto" } : parked;
  return { ref, placement, dragging, settling, startDrag };
}

/**
 * CRITICAL ALERT — the records in a list that need somebody NOW.
 *
 * A table can colour a bad reading red, but only for the row somebody happens
 * to be looking at. This watches the whole result set: the moment a search
 * comes back it tests every record against the ranges configured here and, if
 * any fail, raises a floating card naming those patients and nothing else.
 * Clicking one runs the panel's onSelect — normally Open side panel, so the
 * nurse lands on the same overview a row click opens, where the offending
 * vital is already highlighted by the Vitals Card's own alert.
 *
 * It deliberately does NOT show the failing value. Which reading is wrong is a
 * clinical judgement made on the record, not on a toast.
 *
 * Floating, draggable and portalled to <body> for the same reason the drawer
 * is: the canvas zoom wrapper is a transformed ancestor, and `position: fixed`
 * inside one of those means the wrapper rather than the viewport.
 */
const AlertPanelDef = {
  type: "AlertPanel",
  label: "Critical Alert",
  icon: "Siren",
  category: "Overlay",
  defaultProps: {
    title: "Critical Vitals Alert",
    icon: "Bell",
    listSourceId: "",
    matchMode: "any",
    rules: [],
    maxItems: 0,
    message: "{{count}} patients have vital signs out of range. Select to view details.",
    messageOne: "1 patient has a vital sign out of range. Select to view details.",
    itemTitle: "{{row.PatientName}}",
    itemSubtitle: "{{row.EmergencyNo}}",
    itemTag: "CRITICAL",
    accent: "#ef4444",
    accentDefault: "",
    width: 300,
    listHeight: 190,
    position: "tr",
    offsetX: 18,
    offsetY: 86,
    entryAnim: "slide",
    attention: "pulse",
    ringBell: true,
    showBadge: true,
    draggable: true,
    snapCorner: false,
    remember: true,
    closable: true,
    vibrate: true,
  },
  defaultStyle: {},
  events: ["onSelect", "onShow", "onDismiss"],
  propSchema: [
    {
      key: "__how",
      label: "How this works",
      type: "note",
      group: GROUPS.DATA,
      text: "Watches a list already on this screen. Every time that list loads, each record is tested — the ones that fail are named on a floating card. Clicking a name fires onSelect with that record, so Open side panel lands on the right patient.",
    },
    p.select("listSourceId", "Watch this list", statSourceOptions, GROUPS.DATA, {
      hint: "The table, card list or data source whose records are tested.",
    }),
    p.alertRules("rules", "Flag a record when", GROUPS.DATA, {
      fieldKeys: statSourceFields,
      hint: "A range test reads 155/80, 155-80 and 155 to 80 alike, and a two-part reading is inside the range only if both parts are.",
    }),
    p.select("matchMode", "Flag it when", ALERT_MATCH, GROUPS.DATA),
    p.number("maxItems", "Most to list", GROUPS.DATA, {
      hint: "The card lists this many and says how many more there are. 0 lists them all.",
    }),
    p.template("title", "Title", GROUPS.CONTENT),
    p.icon("icon", "Title icon", GROUPS.CONTENT),
    p.text("message", "Message", GROUPS.CONTENT, { hint: "{{count}} is how many were flagged." }),
    p.text("messageOne", "Message for one", GROUPS.CONTENT, {
      hint: "Used when exactly one record is flagged. Empty means always use the message above.",
    }),
    p.template("itemTitle", "Row title", GROUPS.CONTENT, { placeholder: "{{row.PatientName}}" }),
    p.template("itemSubtitle", "Row subtitle", GROUPS.CONTENT, { placeholder: "{{row.EmergencyNo}}" }),
    p.template("itemTag", "Row tag", GROUPS.CONTENT, { placeholder: "CRITICAL", hint: "Leave empty for no tag." }),
    p.dynamicColor("accent", "Accent", GROUPS.APPEARANCE, {
      hint: "A swatch, a theme token, or a colour the screen carries.",
    }),
    p.number("width", "Width (px)"),
    p.number("listHeight", "List height (px)", GROUPS.APPEARANCE, {
      hint: "How tall the names grow before they scroll.",
    }),
    p.select("position", "Parks at", ALERT_CORNERS),
    p.number("offsetX", "Distance from the side (px)"),
    p.number("offsetY", "Distance from top/bottom (px)"),
    p.select("entryAnim", "Arrives with", ALERT_ENTRIES, GROUPS.APPEARANCE, {
      hint: "Also staggers the names in, so the card reads as one movement.",
    }),
    p.select("attention", "Keeps asking with", ALERT_ATTENTION, GROUPS.APPEARANCE, {
      hint: "Runs until the card is dismissed or the list reloads.",
    }),
    p.bool("showBadge", "Show the count", GROUPS.APPEARANCE),
    p.bool("ringBell", "Ring the icon", GROUPS.APPEARANCE),
    p.bool("draggable", "Draggable"),
    p.bool("snapCorner", "Settle into the nearest corner", GROUPS.BEHAVIOUR, {
      when: (props) => props.draggable !== false,
      hint: "Off by default: the card stays exactly where it was dropped, anywhere on the page. On, it slides to whichever corner it was let go nearest — tidier on a screen where it must never cover the table.",
    }),
    p.bool("remember", "Remember where it was dragged", GROUPS.BEHAVIOUR, {
      when: (props) => props.draggable !== false,
      hint: "Per browser, per component — it comes back where the last shift left it.",
    }),
    p.bool("closable", "Dismissable"),
    p.bool("vibrate", "Buzz the device", GROUPS.BEHAVIOUR, {
      hint: "Once per new result set, on phones and tablets that support it.",
    }),
  ],
  render: ({ node, props, style, rt, scope }) => {
    const design = !!rt?.design;
    // The rows themselves, held by reference: `rt.data[source].rows` is the
    // same array until the list is fetched again, which is exactly the moment
    // this panel is supposed to wake up. Testing them produces a new array on
    // every render, so the tested result is memoised against the rows and the
    // configuration rather than used as a dependency itself — without that, a
    // re-arm effect keyed on it would re-arm, and buzz, on every render.
    const rows = statRows(props, rt);
    const config = useMemo(() => JSON.stringify(props.rules || []), [props.rules]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const flagged = useMemo(() => flaggedRows(props, rt), [rows, config, props.matchMode]);
    const count = flagged.length;
    const cap = Number(props.maxItems) || 0;
    const listed = cap > 0 ? flagged.slice(0, cap) : flagged;

    // Dismissing is per RESULT SET, not for good: the nurse who waved this away
    // after the last search must still be told about the next one — so the next
    // load of those rows re-arms the card, and buzzes once if anyone is on it.
    const [dismissed, setDismissed] = useState(false);
    const [closing, setClosing] = useState(false);
    const countRef = useRef(0);
    countRef.current = count;
    useEffect(() => {
      setDismissed(false);
      setClosing(false);
      if (!design && countRef.current && props.vibrate !== false) buzz();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, design]);

    const visible = count > 0 && !dismissed;
    // onShow is where a screen logs the alert or calls an escalation endpoint,
    // so it fires on the way into view rather than while the card stands open.
    const wasVisible = useRef(false);
    useEffect(() => {
      if (design || visible === wasVisible.current) return;
      wasVisible.current = visible;
      if (visible) rt?.runEvent(node, "onShow", { count });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, design]);

    // Leaving is animated too. A card that vanishes on the click leaves the eye
    // checking whether it was really dismissed or had never been there; it
    // unmounts once it has actually gone.
    const closeTimer = useRef(0);
    useEffect(() => () => window.clearTimeout(closeTimer.current), []);
    const dismiss = useCallback(() => {
      if (design) return;
      setClosing(true);
      window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(() => {
        setClosing(false);
        setDismissed(true);
        rt?.runEvent(node, "onDismiss", { count });
      }, 190);
    }, [design, rt, node, count]);

    const ox = Number.isFinite(Number(props.offsetX)) ? Number(props.offsetX) : 18;
    const oy = Number.isFinite(Number(props.offsetY)) ? Number(props.offsetY) : 86;
    const { ref, placement, dragging, settling, startDrag } = useDragCard({
      enabled: props.draggable !== false && !design,
      snapCorner: props.snapCorner === true,
      remember: props.remember !== false,
      corner: props.position || "tr",
      offsetX: ox,
      offsetY: oy,
      storeKey: ALERT_POS_KEY(node?.id || "alert"),
    });

    // Row text is written per record, so it comes from the RAW props: the
    // renderer already interpolated `props` once against the screen, where
    // there is no row, and {{row.PatientName}} would have come back empty.
    const raw = node?.props || {};
    const text = (tpl, row) => {
      if (typeof tpl !== "string" || tpl === "") return "";
      const out = interpolate(tpl, { ...scope, row, count });
      return out === null || out === undefined ? "" : String(out);
    };

    const accent = resolveDynamicColor(props.accent, props.accentDefault) || "#ef4444";
    const one = count === 1 && `${raw.messageOne ?? ""}` !== "";
    const message = text(one ? raw.messageOne : raw.message, listed[0]);
    const entry = props.entryAnim || "slide";
    // `pulse` was the switch before there was a choice of animations. A screen
    // saved with it off must stay still.
    const attention = props.attention || (props.pulse === false ? "none" : "pulse");

    const head = (
      <>
        <span className={`dsb-alertp-ic ${props.ringBell !== false ? "is-ringing" : ""}`.trim()}>
          <Icon name={props.icon || "Bell"} size={15} />
        </span>
        <span className="dsb-alertp-title">{props.title}</span>
        {props.showBadge !== false ? <span className="dsb-alertp-badge">{count}</span> : null}
        {props.draggable !== false && !design ? (
          <span className="dsb-alertp-grip" title="Drag to move">
            <Icon name="GripVertical" size={13} />
          </span>
        ) : null}
        {props.closable !== false ? (
          <button
            type="button"
            className="dsb-alertp-x"
            onClick={dismiss}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            title="Dismiss"
            aria-label="Dismiss"
          >
            <Icon name="X" size={14} />
          </button>
        ) : null}
      </>
    );

    const body = (
      <div className="dsb-alertp-body">
        {message ? (
          <div className="dsb-alertp-msg">
            <Icon name="AlertTriangle" size={12} />
            <span>{message}</span>
          </div>
        ) : null}
        <div className="dsb-alertp-list" style={{ maxHeight: cssSize(props.listHeight, "190px") }}>
          {listed.map((row, i) => (
            <button
              key={i}
              type="button"
              className="dsb-alertp-item"
              onClick={() => !design && !props.disabled && rt?.runEvent(node, "onSelect", { row })}
            >
              <span className="dsb-alertp-dot" />
              <span className="dsb-alertp-item-main">
                <span className="dsb-alertp-item-title">{text(raw.itemTitle, row) || "—"}</span>
                {text(raw.itemSubtitle, row) ? (
                  <span className="dsb-alertp-item-sub">{text(raw.itemSubtitle, row)}</span>
                ) : null}
              </span>
              {text(raw.itemTag, row) ? <span className="dsb-alertp-tag">{text(raw.itemTag, row)}</span> : null}
            </button>
          ))}
        </div>
        {cap > 0 && count > cap ? <div className="dsb-alertp-more">+{count - cap} more</div> : null}
      </div>
    );

    // The canvas draws the card in place, always — an alert that existed only
    // while a record happened to be failing could not be selected, styled or
    // configured on a screen whose sample rows are all healthy. Animations run
    // here too: picking one and seeing nothing move is not a preview.
    if (design) {
      return (
        <div
          className={`dsb-alertp is-inline e-${entry} a-${attention}`}
          style={{ ...style, width: cssSize(props.width, "300px"), "--dsb-alertp-accent": accent }}
        >
          <div className="dsb-alertp-head">{head}</div>
          {count ? (
            body
          ) : (
            <div className="dsb-alertp-body">
              <div className="dsb-alertp-msg">
                <Icon name="AlertTriangle" size={12} />
                <span>
                  {props.listSourceId
                    ? "No sample record trips these tests — on the live screen the card stays hidden until one does."
                    : "Pick the list to watch, then add a test."}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (!visible) return null;

    return createPortal(
      <ScreenScope rt={rt} className="dsb-alertp-root">
        <div
          ref={ref}
          role="alert"
          aria-live="assertive"
          className={`dsb-alertp e-${entry} a-${attention} ${dragging ? "is-dragging" : ""} ${
            settling ? "is-settling" : ""
          } ${closing ? "is-closing" : ""}`
            .replace(/\s+/g, " ")
            .trim()}
          style={{
            ...style,
            ...placement,
            width: cssSize(props.width, "300px"),
            "--dsb-alertp-accent": accent,
          }}
        >
          <div
            className={`dsb-alertp-head ${props.draggable !== false ? "is-grab" : ""}`.trim()}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            {head}
          </div>
          {body}
        </div>
      </ScreenScope>,
      document.body,
    );
  },
};

export default [
  DataTableDef,
  AppComponentDef,
  ActionTileDef,
  AlertPanelDef,
  ImageDef,
  PageHeadingDef,
  StatCardDef,
  TabsDef,
  TabPaneDef,
  ChipDef,
  AvatarDef,
  IconDef,
  InfoTileDef,
  VitalCardDef,
  TextBlockDef,
  HeadingDef,
  FieldCardDef,
  RecordDetailsDef,
  ModalDef,
  DrawerDef,
  FrameMenuDef,
  TooltipDef,
  ToastDef,
];
