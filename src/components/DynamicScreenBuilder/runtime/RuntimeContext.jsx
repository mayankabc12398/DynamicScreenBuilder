/**
 * Runtime context — the live state behind a rendered screen.
 *
 * Holds form values, screen variables, data-source results and transient UI
 * state (open modals / panels / active tabs), and executes the no-code action
 * lists attached to node events. The builder canvas mounts the very same
 * provider in "design" mode, where API calls are skipped and mock data is used,
 * so the canvas and the real page share one implementation.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import makeApiRequest from "@app/networkServices/axiosInstance";
import UserPasswordVerificationModal from "@app/components/modalComponent/Utils/patientBillingModal/UserPasswordVerificationModal";
import { conditionsHold, dateTokens, evalCondition, getPath, hasTemplate, interpolate, interpolateDeep, whenPasses } from "../utils/expressions";
import { localBase, localRowsId, localRowsOf, sameRecord, tableSourceId, varRows } from "../utils/gridRows";
import { isRawFile, publishScope } from "../utils/livescope";
import { localValues, writeLocal, removeLocal } from "../utils/localStore";
import { tr } from "../utils/i18n";
import { fillFromRow, validateAll } from "../utils/validation";
import { flatten } from "../utils/tree";
import { OVERLAY_TARGETS, exportFormat, exportVia } from "../schema/schema";
import { sampleRowsByOverlay } from "../utils/rowContext";
import { downloadText } from "../utils/storage";
import {
  appendQuery,
  buildApiRequest,
  findRowsPath,
  flagsToBits,
  isApiConfigReady,
  nodeIdFromSource,
  nodeSourceId,
  pluckRows,
  sendsForm,
  toFormData,
} from "../utils/apiConfig";

/**
 * The rows a "Keep rows when" rule lets through.
 *
 * What a role may see is decided after the answer arrives on a good few
 * screens — the settlement list shows PHY bills to one role, OPD bills to
 * another and everything to a third — and the endpoints take no such
 * parameter. Each row is tested with the screen's own scope around it, so a
 * rule can compare the row against {{user.…}}, a variable or a form value.
 */
const keptRows = (rows, when, scope) => {
  const tests = (Array.isArray(when) ? when : when ? [when] : []).filter((c) => c && c.op);
  if (!tests.length || !Array.isArray(rows)) return rows;
  return rows.filter((row) => whenPasses(tests, { ...scope, row, ...(row || {}) }));
};

/**
 * Where in a request body a browser File sits, or "".
 *
 * A File Upload set to "The files themselves" holds File objects, and JSON
 * writes a File as `{}` — the request goes out looking fine and the server
 * gets an empty object where the sheet should be. Found here so the designer
 * is told, instead of finding out from the server's answer.
 */
const rawFileIn = (v, path = "body", depth = 0) => {
  if (isRawFile(v)) return path;
  if (!v || typeof v !== "object" || depth > 6) return "";
  if (typeof FormData !== "undefined" && v instanceof FormData) return "";
  for (const [k, x] of Object.entries(v)) {
    const hit = rawFileIn(x, Array.isArray(v) ? `${path}[${k}]` : `${path}.${k}`, depth + 1);
    if (hit) return hit;
  }
  return "";
};

/**
 * The records an export writes, out of an answer or a list.
 *
 * Stricter than `pluckRows` on purpose: with no path given and no list
 * anywhere in it, an envelope like `{ success, message, data: null }` has no
 * rows — it must not become a one-line spreadsheet of the envelope itself.
 */
const exportRows = (raw, path) => {
  const at = path || findRowsPath(raw);
  if (at) return pluckRows(raw, at);
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw?.data) ? raw.data : [];
};

/**
 * A blank tab to point at a URL later, or null when pop-ups are blocked.
 *
 * Not `window.open("", "_blank", "noopener")`: with `noopener` the browser
 * opens the tab but hands back null, so the chain never got the tab it had
 * just opened — openUrl then opened a second one for the file, and the first
 * stayed blank with nothing able to close it. The opener link is cut by hand
 * instead, which is what `noopener` was there for.
 */
function openBlankTab() {
  try {
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    return tab || null;
  } catch (e) {
    return null;
  }
}

const RuntimeCtx = createContext(null);
export const useRuntime = () => useContext(RuntimeCtx);

const initialState = (screen) => ({
  values: {},
  // What a dropdown SHOWS for its value — "Cardiology" beside DepartmentID 12 —
  // keyed by the same field name. A payload can send either: {{values.X}} is
  // the id, {{labels.X}} the text. Kept apart from `values` so nothing that
  // walks the form's answers meets a second copy of each one.
  labels: {},
  // The whole record behind a dropdown's choice — the API row it was built
  // from — so {{selected.IPDCaseTypeID.RoomTypeID}} reads a column of the
  // picked case type that is neither its value nor its text.
  selected: {},
  vars: { ...(screen?.variables || {}) },
  data: {}, // sourceId -> { loading, error, rows, raw }
  // `checks` holds a checkbox column's ticks and `cells` an editable
  // column's typed values, both "<nodeId>:<columnKey>" -> { [rowKey]: value }.
  // `grids` is what each table published back: the rows AS EDITED, so a save
  // action can send them without knowing how the grid stores an edit.
  // `context` is the record an overlay was opened WITH: a row action that opens
  // a modal parks its row here under the modal's id, and everything inside that
  // modal then reads {{row.Field}} exactly as a cell in the table does.
  ui: { modals: {}, panels: {}, tabs: {}, selection: {}, alerts: {}, checks: {}, cells: {}, grids: {}, context: {}, frameMenu: {}, appModal: {}, modalRefresh: {} },
  errors: {},
});

function reducer(state, action) {
  switch (action.type) {
    case "SET_VALUE":
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case "SET_VALUES":
      // `filled` marks a whole-record fill, which a dependent select must not
      // read as the user changing its parent (and clear the child just filled).
      return { ...state, values: { ...state.values, ...action.values }, fillSeq: action.filled ? (state.fillSeq || 0) + 1 : state.fillSeq };
    case "SET_LABEL":
      return { ...state, labels: { ...state.labels, [action.field]: action.label } };
    case "SET_SELECTED":
      return { ...state, selected: { ...state.selected, [action.field]: action.record } };
    case "RESET_VALUES":
      return { ...state, values: {}, labels: {}, selected: {}, errors: {} };
    case "SET_VAR":
      return { ...state, vars: { ...state.vars, [action.field]: action.value } };
    case "SET_ERRORS":
      return { ...state, errors: action.errors || {} };
    case "DATA_START":
      return {
        ...state,
        data: { ...state.data, [action.id]: { ...(state.data[action.id] || {}), loading: true, error: null } },
      };
    case "DATA_OK":
      return {
        ...state,
        data: { ...state.data, [action.id]: { loading: false, error: null, rows: action.rows, raw: action.raw } },
      };
    case "DATA_ERR":
      return {
        ...state,
        data: { ...state.data, [action.id]: { loading: false, error: action.error, rows: [], raw: null } },
      };
    case "DATA_SET":
      // A whole entry written as-is: rows changed on the screen by Add row /
      // Remove row / Update row (utils/gridRows), flags and all.
      return { ...state, data: { ...state.data, [action.id]: action.entry } };
    case "UI":
      return { ...state, ui: { ...state.ui, [action.slice]: { ...state.ui[action.slice], [action.key]: action.value } } };
    default:
      return state;
  }
}

/** Pull the array (or object) a data source points at, out of a raw response. */
/**
 * An action's request body. Written as JSON text in the inspector, so the
 * templates are resolved on the text first and the result parsed — that way
 * `{ "id": {{values.id}} }` works as well as `{ "id": "{{values.id}}" }`.
 * Older screens stored an object; those are interpolated in place.
 */
function actionBody(act, scope) {
  const raw = act.body;
  if (!raw) return {};
  if (typeof raw !== "string") return interpolateDeep(raw, scope);
  // Resolved AS JSON: a token standing where a value goes may be a record list
  // — the tenders a payment panel published, the rows a grid ticked — and those
  // have to arrive as JSON rather than as their toString.
  const text = interpolate(raw, scope, { json: true }).trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("[ScreenBuilder] the action's body is not valid JSON", text, e);
    return {};
  }
}

/**
 * A confirmation the running screen is waiting on.
 *
 * The action chain is awaited step by step, so a destructive action can stop it
 * by asking first: `confirm` parks a promise here, the dialog resolves it, and
 * a "no" returns false — which runEvent already treats as "stop the chain",
 * the same contract a failed validate uses.
 *
 * Deliberately not window.confirm: that blocks the whole tab, cannot be styled,
 * and reads as a browser warning rather than part of the screen.
 */
function ConfirmDialog({ ask, onAnswer }) {
  if (!ask) return null;
  // Portalled for the same reason the drawer is: a `position: fixed` overlay
  // rendered inside the canvas's transformed zoom wrapper is positioned against
  // THAT, so it would open beside a scrolled screen instead of over it.
  return createPortal(
    <div className="dsb-overlay dsb-confirm-host" role="dialog" aria-modal="true">
      <div className="dsb-confirm">
        <div className="dsb-confirm-body">
          <span className={`dsb-confirm-icon is-${ask.variant || "warning"}`}>!</span>
          <div>
            <h4>{ask.title || "Please confirm"}</h4>
            <p>{ask.message || "Are you sure?"}</p>
          </div>
        </div>
        <div className="dsb-confirm-foot">
          <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => onAnswer(false)}>
            {ask.cancelText || "Cancel"}
          </button>
          <button
            type="button"
            className={`btn btn-sm px-3 ${ask.variant === "danger" || ask.variant === "error" ? "btn-danger" : "btn-success"}`}
            onClick={() => onAnswer(true)}
            autoFocus
          >
            {ask.okText || "Yes, continue"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function RuntimeProvider({
  screen,
  design = false,
  mode = "runtime",
  breakpoint: bp = "desktop",
  role = "",
  user = null,
  apiClient,
  params = {},
  /**
   * The site's own switches, already flattened to { Name: Value }.
   *
   * Passed in rather than read from the store here: this provider has no redux
   * dependency, and the builder's canvas mounts the same renderer. Whoever
   * hosts a screen knows where the resources live; the runtime only needs the
   * answers. See ScreenRoute.
   */
  globals = null,
  onNavigate,
  children,
}) {
  const [state, dispatch] = useReducer(reducer, screen, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const client = apiClient || makeApiRequest;

  // `refresh` and `refreshNode` call each other: refresh forwards a "node:" id on,
  // and a node's own load goes through refresh. Refs break the cycle without
  // making either one depend on the other's identity.
  // { message, title, okText, cancelText, variant, resolve }
  const [confirmAsk, setConfirmAsk] = useState(null);
  const confirmRef = useRef(null);

  /** Show the dialog and resolve with what the user pressed. */
  const askConfirm = useCallback((ask) => {
    if (design) return Promise.resolve(true); // the canvas never asks
    return new Promise((resolve) => {
      confirmRef.current = resolve;
      setConfirmAsk(ask);
    });
  }, [design]);

  const answerConfirm = useCallback((yes) => {
    const resolve = confirmRef.current;
    confirmRef.current = null;
    setConfirmAsk(null);
    if (resolve) resolve(!!yes);
  }, []);

  /**
   * "Type your password before this is saved."
   *
   * The billing pages gate a settlement behind the signed-in user proving who
   * they are (the validateUserForBill switch), and the app already has the
   * dialog that does it. A chain could ask a question (Confirm) but could not
   * ask for a password, so a built screen had no way to reach a write that is
   * guarded this way. Answering wrongly — or closing it — stops the chain, so
   * the step goes ABOVE the save, exactly like Confirm.
   */
  // { userId, title, resolve }
  const [verifyAsk, setVerifyAsk] = useState(null);
  const verifyRef = useRef(null);

  const askVerify = useCallback((ask) => {
    if (design) return Promise.resolve(true); // the canvas never asks
    return new Promise((resolve) => {
      verifyRef.current = resolve;
      setVerifyAsk(ask);
    });
  }, [design]);

  const answerVerify = useCallback((ok) => {
    const resolve = verifyRef.current;
    verifyRef.current = null;
    setVerifyAsk(null);
    if (resolve) resolve(!!ok);
  }, []);

  /**
   * The chain runner, reachable from inside one action.
   *
   * "Repeat for every ticked row" is an action that runs a chain, and the
   * chain runner is defined below it. A ref rather than a reorder: the two
   * genuinely need each other, and this keeps the dependency one-way.
   */
  const runActionsRef = useRef(async () => true);

  const refreshNodeRef = useRef(() => []);
  const findNodeConfigRef = useRef(() => null);

  /** Everything a `{{template}}` can reach. */
  const buildScope = useCallback(
    (extra = {}) => ({
      values: stateRef.current.values,
      // {{labels.DepartmentID}} — the text of a dropdown's choice, not its id.
      labels: stateRef.current.labels || {},
      // {{selected.DepartmentID.DeptCode}} — any column of the chosen row.
      selected: stateRef.current.selected || {},
      // Today, as the endpoints take it, and the same instant as a timestamp.
      // A range that is always "the last year" is then {{today | addYears:-1}}
      // to {{today}} — a binding, where before it took a Run custom JS step.
      ...dateTokens(),
      vars: stateRef.current.vars,
      data: Object.keys(stateRef.current.data).reduce((acc, k) => {
        acc[k] = stateRef.current.data[k]?.raw ?? stateRef.current.data[k]?.rows;
        return acc;
      }, {}),
      rows: Object.keys(stateRef.current.data).reduce((acc, k) => {
        acc[k] = stateRef.current.data[k]?.rows || [];
        return acc;
      }, {}),
      user: user || {},
      // What this browser has saved: {{local.ip}}, {{local.EmployeeID}},
      // {{local.userData.centreId}}. The app puts things there that a screen
      // otherwise has no way to reach, and hard-coding them per centre is the
      // same as not working. Lazily read — see utils/localStore.
      local: localValues(),
      // What the grids on this screen currently hold. A lone {{grid.x.checked}}
      // resolves to the array itself, so it can be a payload parameter.
      grid: stateRef.current.ui?.grids || {},
      // Per-site configuration, keyed by name: {{globals.IsOPDLogo}}. This is
      // how the product varies by customer, and a screen that cannot read it
      // cannot be configured the way a hand-coded page can.
      globals: globals || {},
      params,
      ...extra,
    }),
    [user, params, globals],
  );

  // The builder's "what does this hold?" box sits outside this provider and
  // still has to answer against the live screen. See utils/livescope.
  useEffect(() => publishScope(buildScope), [buildScope]);

  /** Fetch (or resolve static data for) one screen data source. */
  const refresh = useCallback(
    async (sourceId, overrides = {}) => {
      // "node:<id>" targets a component's own endpoint. Routing it through the
      // same entry point means the refresh/export/callApi actions need no idea
      // that node-level endpoints exist.
      const nodeId = nodeIdFromSource(sourceId);
      if (nodeId) return refreshNodeRef.current(nodeId, findNodeConfigRef.current(nodeId), overrides);

      const src = screenRef.current?.dataSources?.[sourceId];
      if (!src) return [];
      const scope = buildScope();

      if (src.mode === "static" || (design && !overrides.force)) {
        const rows = Array.isArray(src.staticData) ? src.staticData : [];
        dispatch({ type: "DATA_OK", id: sourceId, rows: keptRows(rows, src.keepWhen, scope), raw: src.staticRaw || rows });
        return rows;
      }
      if (!src.url) {
        dispatch({ type: "DATA_OK", id: sourceId, rows: [], raw: null });
        return [];
      }

      dispatch({ type: "DATA_START", id: sourceId });
      try {
        const url = interpolate(src.url, scope);
        const method = (src.method || "GET").toLowerCase();
        const config = { method };
        // Flags go out as 1/0, the way every hand-coded page sends them — a
        // data source has no parameter types, so there is nothing to exempt.
        const qs = flagsToBits(interpolateDeep({ ...(src.params || {}), ...(overrides.params || {}) }, scope));
        const body = flagsToBits(interpolateDeep({ ...(src.body || {}), ...(overrides.body || {}) }, scope));
        if (Object.keys(src.headers || {}).length) config.headers = interpolateDeep(src.headers, scope);
        // The app's makeApiRequest composes its own URL and never forwards an
        // axios `params` object, so the query string goes on the URL itself.
        if (method !== "get" && method !== "delete") config.data = { ...qs, ...body };

        const raw = await client(appendQuery(url, qs), config);
        const rows = pluckRows(raw, src.responsePath);
        dispatch({ type: "DATA_OK", id: sourceId, rows, raw });
        return rows;
      } catch (err) {
        dispatch({ type: "DATA_ERR", id: sourceId, error: err?.message || "Request failed" });
        return [];
      }
    },
    [buildScope, client, design],
  );

  /**
   * A component that owns its endpoint (props.apiConfig, picked from the server's
   * catalog) rather than sharing a screen-level data source.
   *
   * The rows land in the same `data` map under a synthetic id, so a table, a
   * refresh action and an export all treat the two kinds of source identically —
   * only this function knows the difference.
   */
  // Requests on the wire, by what they send. Four KPI cards over one endpoint
  // open together and ask the same thing; they share one call rather than
  // making four. Only while it is in flight — a later refresh calls again.
  const inFlightRef = useRef(new Map());

  const refreshNode = useCallback(
    async (nodeId, cfg, overrides = {}) => {
      const id = nodeSourceId(nodeId);
      if (!isApiConfigReady(cfg)) {
        dispatch({ type: "DATA_OK", id, rows: [], raw: null });
        return [];
      }
      dispatch({ type: "DATA_START", id });
      try {
        const { url, config } = buildApiRequest(cfg, buildScope(), overrides);
        const key = JSON.stringify([url, config]);
        const inFlight = inFlightRef.current;
        let call = inFlight.get(key);
        if (!call) {
          call = Promise.resolve(client(url, config));
          inFlight.set(key, call);
          const done = () => inFlight.delete(key);
          call.then(done, done);
        }
        const raw = await call;
        const rows = pluckRows(raw, cfg.responsePath);
        dispatch({ type: "DATA_OK", id, rows, raw });
        return rows;
      } catch (err) {
        dispatch({ type: "DATA_ERR", id, error: err?.message || "Request failed" });
        return [];
      }
    },
    [buildScope, client],
  );

  /** The apiConfig of one node, wherever it sits in the tree. */
  const findNodeConfig = useCallback((nodeId) => {
    const root = screenRef.current?.root;
    if (!root) return null;
    const hit = flatten(root).find((n) => n.id === nodeId);
    if (hit?.props?.apiConfig) return hit.props.apiConfig;
    // A select keeps its endpoint under `optionsApi`. Without this, refreshing
    // "node:<select>" found no config and answered with an EMPTY list — the
    // dropdown lost every option instead of reloading them, which is exactly
    // what a Select + Add has to do after its dialog saves.
    if (hit?.props?.optionsSource === "endpoint") return hit.props.optionsApi || null;
    return null;
  }, []);

  refreshNodeRef.current = refreshNode;
  findNodeConfigRef.current = findNodeConfig;

  // Auto-load sources on mount / whenever the source map identity changes.
  const sourceKey = useMemo(() => Object.keys(screen?.dataSources || {}).join("|"), [screen]);
  useEffect(() => {
    Object.values(screen?.dataSources || {}).forEach((s) => {
      if (s.autoLoad !== false) refresh(s.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  /**
   * A field's value, seen by the very next action.
   *
   * The ref is patched as well as dispatched because a control runs its
   * onChange actions in the same tick as the change — React has not re-rendered
   * and `stateRef.current` still holds the old values. A dropdown that searches
   * when it changes would otherwise send the PREVIOUS selection every time. The
   * next render overwrites the patch with the reducer's own state, which stays
   * the source of truth.
   */
  const setValue = useCallback((field, value) => {
    if (!field) return;
    stateRef.current = { ...stateRef.current, values: { ...stateRef.current.values, [field]: value } };
    dispatch({ type: "SET_VALUE", field, value });
  }, []);
  /**
   * The text a dropdown shows for its current value.
   *
   * Patched into the ref like a value is, so an onChange chain that posts
   * {{labels.X}} in the same tick sends the choice just made. An unchanged
   * label is not dispatched: the select reports it every time its options
   * reload, and a write that changes nothing is a re-render for nothing.
   */
  const setLabel = useCallback((field, label) => {
    if (!field) return;
    const cur = stateRef.current.labels || {};
    const same = Array.isArray(label) && Array.isArray(cur[field]) ? label.join("|") === cur[field].join("|") : cur[field] === label;
    if (same && Object.prototype.hasOwnProperty.call(cur, field)) return;
    stateRef.current = { ...stateRef.current, labels: { ...cur, [field]: label } };
    dispatch({ type: "SET_LABEL", field, label });
  }, []);
  /**
   * The record behind a dropdown's choice (a list of them for a multi select),
   * or null. Same bargain as `setLabel`: into the ref at once, and only
   * dispatched when the record actually differs.
   */
  const setSelected = useCallback((field, record) => {
    if (!field) return;
    const cur = stateRef.current.selected || {};
    if (Object.prototype.hasOwnProperty.call(cur, field)) {
      let same = cur[field] === record;
      if (!same) {
        try {
          same = JSON.stringify(cur[field]) === JSON.stringify(record);
        } catch (e) {
          same = false;
        }
      }
      if (same) return;
    }
    stateRef.current = { ...stateRef.current, selected: { ...cur, [field]: record } };
    dispatch({ type: "SET_SELECTED", field, record });
  }, []);
  // Variables a "Fill form from row" has used to mark edit mode. Reset form
  // clears them, so Cancel / a finished Update brings Save back.
  const editVarsRef = useRef(new Set());
  const setVar = useCallback((field, value) => {
    stateRef.current = { ...stateRef.current, vars: { ...stateRef.current.vars, [field]: value } };
    dispatch({ type: "SET_VAR", field, value });
  }, []);
  const setUi = useCallback((slice, key, value) => dispatch({ type: "UI", slice, key, value }), []);

  /**
   * Open an overlay, optionally ON a record.
   *
   * A modal or drawer opened from a row action is almost always about that
   * row, and its contents are designed against it — a title that names the
   * patient, inputs seeded from the record, a table of that patient's orders.
   * The record is parked under the overlay's id so the renderer can hand it to
   * everything inside; opening WITHOUT one clears it, so a modal opened from a
   * toolbar button never shows whatever row was last clicked.
   */
  const openWith = useCallback(
    (slice, id, record, varName) => {
      if (!id) return;
      // Only ModalDialog reads ui.modals, only DrawerPanel/SplitView read
      // ui.panels. A target that is neither is the one failure with nothing to
      // see: the button fires, the flag flips, and the screen does not move.
      // Say so — in preview to the designer who can fix it, in the console
      // everywhere else.
      const kind = slice === "modals" ? "modal" : "panel";
      const spec = OVERLAY_TARGETS[kind];
      const target = flatten(screenRef.current?.root).find((n) => n.id === id);
      if (target && spec && !spec.types.includes(target.type)) {
        const msg = `"${target.name || target.id}" is a ${target.type}, which cannot open as a ${kind}. Put its contents inside an Overlays → ${spec.label} and point the action at that.`;
        // eslint-disable-next-line no-console
        console.warn(`[screen-builder] ${msg}`);
        if (mode === "preview") toast.warn(msg);
        return;
      }
      setUi("context", id, record ?? null);
      // The same record, under a name the designer chose. Parking it is enough
      // for everything INSIDE the overlay ({{row.Field}}), but a screen often
      // needs the clicked row somewhere else too — a title above the drawer, a
      // payload on a Save that sits outside it, a rule on another panel — and
      // only a variable reaches those: {{vars.<name>.Field}}.
      if (varName) setVar(varName, record ?? null);
      setUi(slice, id, true);
    },
    [setUi, setVar, mode],
  );

  const openPanel = useCallback((id, record, varName) => openWith("panels", id, record, varName), [openWith]);
  const closePanel = useCallback((id) => setUi("panels", id, false), [setUi]);
  /**
   * The ticks of one checkbox column.
   *
   * Kept out of the row data on purpose: rows are whatever the endpoint
   * returned and are replaced wholesale on the next search, while a tick is
   * the user's own answer about a row. A map rather than a list of keys, so a
   * row can be explicitly UNticked over a value its data says is true.
   */
  const setChecks = useCallback((id, map) => setUi("checks", id, map), [setUi]);

  /** The typed values of one editable column. Same shape, same reasoning. */
  const setCells = useCallback((id, map) => setUi("cells", id, map), [setUi]);

  /**
   * A table publishing what it currently holds.
   *
   * Editing a grid is pointless if nothing can read the result back, and the
   * runtime cannot merge edits into rows itself — row identity is the
   * table's own (`id`/`Id`/`ID`, else position). So the table publishes, and
   * `{{grid.<nodeId>.checked}}` / `.edited` / `.rows` reach any payload.
   */
  const setGrid = useCallback((nodeId, value) => setUi("grids", nodeId, value), [setUi]);

  /**
   * The cell checks of each table on screen, keyed by node id.
   *
   * Only the table knows its row identity, which cells a rule has locked or
   * hidden, and which page a row is on — so it checks itself and the Validate
   * action only asks. A ref, not state: registering must not re-render the
   * screen, and a table that unmounts takes its check with it.
   */
  const gridValidatorsRef = useRef({});
  const registerGridValidator = useCallback((nodeId, fn) => {
    if (!nodeId || typeof fn !== "function") return () => {};
    gridValidatorsRef.current = { ...gridValidatorsRef.current, [nodeId]: fn };
    return () => {
      if (gridValidatorsRef.current[nodeId] !== fn) return;
      const next = { ...gridValidatorsRef.current };
      delete next[nodeId];
      gridValidatorsRef.current = next;
    };
  }, []);

  /**
   * Refuse a write that would send rows a table's own rules reject.
   *
   * An action whose settings read {{grid.<table id>…}} is sending that grid's
   * rows, so the grid is checked first — without the designer having to put a
   * Validate step in front of it. A table without cell rules answers 0, so
   * every chain saved before rules existed runs exactly as it did.
   *
   * @returns true when the action may go ahead
   */
  const gridsAllow = useCallback((act) => {
    const checks = gridValidatorsRef.current;
    const ids = Object.keys(checks);
    if (!ids.length) return true;
    let text = "";
    try {
      text = JSON.stringify(act) || "";
    } catch (e) {
      return true;
    }
    if (!text.includes("grid.")) return true;
    let count = 0;
    ids.forEach((id) => {
      const safe = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`grid\\.${safe}(?![\\w-])`).test(text)) return;
      try {
        count += Number(checks[id]({ reveal: count === 0 })?.count) || 0;
      } catch (e) {
        /* a broken table check must not take the save chain down with it */
      }
    });
    if (count) toast.error("Please fix the highlighted cells");
    return count === 0;
  }, []);

  /**
   * The frame menu, raised by an action instead of by a trigger.
   *
   * It is one at a time and it belongs to the screen, not to a node — the
   * chain that opens it may be on a row button, a toolbar button or a dialog's
   * Save. `key` changes on every raise so the host resets: the screen someone
   * opened for the last patient must not still be showing over this one.
   */
  const openFrameMenu = useCallback(
    (frameName, record, opts = {}) =>
      setUi("frameMenu", "current", {
        frameName,
        row: record ?? null,
        showPatientHeader: opts.showPatientHeader !== false,
        key: `${frameName}:${Date.now()}`,
      }),
    [setUi],
  );
  const closeFrameMenu = useCallback(() => setUi("frameMenu", "current", null), [setUi]);

  /**
   * One of the app's own row modals (utils/appModals) — Labs, Meds,
   * FlowSheets, Remarks, Waiting type — opened on a record.
   *
   * Same shape as the frame menu, and for the same reason: one at a time, it
   * belongs to the screen rather than to the node that raised it, and `key`
   * changes on every raise so the host remounts instead of showing the last
   * patient's dialog over this one. `sourceId` is remembered so a modal that
   * writes can refresh the grid it was opened from.
   */
  const openAppModal = useCallback(
    (modalKey, record, opts = {}) =>
      setUi("appModal", "current", {
        modal: modalKey,
        row: record ?? null,
        title: opts.title || "",
        size: opts.size || "",
        sourceId: opts.sourceId || "",
        // Props the opening action names for the component, already resolved
        // against the chain's scope. Null means "use the entry's own".
        props: opts.props || null,
        /**
         * Where it opens: "" is the app's centred dialog, and "bottom" /
         * "top" / "left" / "right" is the app's OverLay sliding in from that
         * edge — the full-width sheet the hand-coded single-window pages use
         * for every action.
         */
        position: opts.position || "",
        /**
         * What the embedded page hands BACK. Each entry names one of the
         * page's callback props and the chain to run when it fires, so "the
         * registration page saved a patient" can reload this screen. Without
         * this the page's callbacks were stand-in no-ops and a screen could
         * never hear the end of the job it started.
         */
        callbacks: Array.isArray(opts.callbacks) && opts.callbacks.length ? opts.callbacks : null,
        // A Save button for a component that has none of its own (the app's
        // setModalData dialogs): the chain it runs, and what the button says.
        saveActions: Array.isArray(opts.saveActions) && opts.saveActions.length ? opts.saveActions : null,
        saveText: opts.saveText || "",
        key: `${modalKey}:${Date.now()}`,
      }),
    [setUi],
  );
  const closeAppModal = useCallback(() => setUi("appModal", "current", null), [setUi]);

  const openModal = useCallback((id, record, varName) => openWith("modals", id, record, varName), [openWith]);
  const closeModal = useCallback((id) => setUi("modals", id, false), [setUi]);

  /**
   * What a canvas dialog reloads when its Save succeeds.
   *
   * Set by the Open modal action that raised it ("Refresh after it saves") —
   * a Select + Add's + button names the select's own options here, so the
   * record just added is in the list when the dialog closes. Per open, not per
   * dialog: the same dialog opened from somewhere else refreshes that instead.
   */
  const setModalRefresh = useCallback((id, sourceId) => setUi("modalRefresh", id, sourceId || ""), [setUi]);
  const modalSaved = useCallback(
    (id) => {
      const sourceId = stateRef.current.ui?.modalRefresh?.[id];
      if (sourceId) refresh(sourceId, { force: true });
    },
    [refresh],
  );
  const setTab = useCallback((nodeId, value) => setUi("tabs", nodeId, value), [setUi]);
  const setSelection = useCallback((nodeId, row) => setUi("selection", nodeId, row), [setUi]);

  /**
   * The grid a row action works on, and the rows it holds right now.
   *
   * "Right now" is what the table last published — the rows WITH what the user
   * typed into them — as long as it was published over the list that is live
   * now. A table that is not mounted (its card hidden by a rule) may have
   * published long ago, and then the live list is the answer.
   */
  const gridOf = useCallback((act, ctx) => {
    const id = act.gridTarget || ctx?.node?.id || "";
    const node = id ? flatten(screenRef.current?.root).find((n) => n.id === id) : null;
    if (!node || !Array.isArray(node.props?.columns)) return null;
    const st = stateRef.current;
    const local = localRowsOf(node, st.data, st.vars);
    const src = tableSourceId(node);
    const live = local
      ? local.rows
      : node.props?.dataMode === "vars"
        ? varRows(node, st.vars)
        : src && Array.isArray(st.data?.[src]?.rows)
          ? st.data[src].rows
          : null;
    const published = st.ui?.grids?.[node.id];
    let rows;
    if (published && Array.isArray(published.rows) && (live === null || published.__base === live)) rows = published.rows;
    else rows = live || (Array.isArray(node.props?.staticRows) ? node.props.staticRows : []);
    return { node, rows };
  }, []);

  const localSeqRef = useRef(0);

  /** Put a grid's changed rows where that grid reads them from. */
  const writeGridRows = useCallback((node, rows, focus = null) => {
    const st = stateRef.current;
    const src = tableSourceId(node);
    localSeqRef.current += 1;
    const seq = localSeqRef.current;
    let id;
    let entry;
    if (src && src === nodeSourceId(node.id)) {
      // The table owns this entry: the change becomes its data, and its next
      // real load replaces it.
      id = src;
      entry = { loading: false, error: null, rows, raw: st.data?.[src]?.raw ?? null, local: true, seq, focus };
    } else {
      id = localRowsId(node.id);
      entry = { rows, base: localBase(node, st.data, st.vars), seq, focus };
    }
    stateRef.current = { ...stateRef.current, data: { ...stateRef.current.data, [id]: entry } };
    dispatch({ type: "DATA_SET", id, entry });
  }, []);

  /** The same write, from a table itself — a row dragged to a new place. */
  const setGridRows = useCallback(
    (nodeId, rows) => {
      const node = nodeId ? flatten(screenRef.current?.root).find((n) => n.id === nodeId) : null;
      if (node && Array.isArray(rows)) writeGridRows(node, rows);
    },
    [writeGridRows],
  );

  /**
   * One row's values from the action's list of keys.
   *
   * Each value is a template read against the chain's scope, with the row
   * being built or changed in it as {{row}}. A lone token keeps its type — a
   * number stays a number — and the literal words true / false / null are the
   * values themselves, so `isRemove = true` is a flag a rule can test.
   */
  const rowValuesOf = useCallback((list, scope) => {
    const out = {};
    (Array.isArray(list) ? list : []).forEach((kv) => {
      const key = String(kv?.key || "").trim();
      if (!key) return;
      const raw = kv.value;
      let v = raw;
      if (typeof raw === "string") {
        if (hasTemplate(raw)) v = interpolate(raw, scope);
        else if (raw.trim() === "true") v = true;
        else if (raw.trim() === "false") v = false;
        else if (raw.trim() === "null") v = null;
      }
      out[key] = v === undefined ? "" : v;
    });
    return out;
  }, []);

  /** Say so when a request is about to carry a File as `{}` — see rawFileIn. */
  const warnRawFile = useCallback(
    (config) => {
      const at = rawFileIn(config?.data);
      if (!at) return;
      const msg = `${at} is a file object, which JSON sends as {}. Set the File Upload's Store to "File contents (base64)" and send {{values.<field>.base64}} with {{values.<field>.name}}.`;
      // eslint-disable-next-line no-console
      console.warn(`[screen-builder] ${msg}`);
      if (mode === "preview") toast.warn(msg);
    },
    [mode],
  );

  /** Execute one configured action. */
  const runAction = useCallback(
    async (act, ctx) => {
      if (!act || !act.type) return;
      const scope = buildScope(ctx);
      /**
       * An action may carry a condition of its own. Failing it skips this
       * action and carries on — one button reaching a different endpoint per
       * row is a branch, not a failure. Absent `when` means always run, so
       * nothing saved before this behaves differently.
       *
       * A list means every one must hold. One condition was not enough for the
       * first real screen: its reprint asks "print type 2 AND not an IPD
       * receipt", and splitting that across two actions cannot express it
       * because both would fire.
       */
      // Conditions joined by "or" split it into alternatives — see whenPasses.
      if (!whenPasses(act.when, scope)) return;
      const val = (v) => (typeof v === "string" ? interpolate(v, scope) : v);
      switch (act.type) {
        case "callApi": {
          if (!gridsAllow(act)) return false;
          // Three ways to say what to call, in the order the inspector offers
          // them. `via` is what the designer picked; without it the shape of
          // the action decides, so screens saved before this still run.
          const via =
            act.via || (isApiConfigReady(act.api) ? "endpoint" : act.sourceId ? "source" : "url");

          if (via === "source" && act.sourceId) {
            // No `ctx.response` on this path: the rows land in the source
            // itself, so the rest of the chain reads {{data.<sourceId>}} for
            // the raw payload and {{rows.<sourceId>}} for the records.
            await refresh(act.sourceId, { force: true, body: actionBody(act, scope) });
            break;
          }

          // A call can also FILL something: the rows it returns are pushed into
          // the component named here, which is how a Search button feeds a grid
          // that has no endpoint of its own.
          const target = act.targetId ? nodeSourceId(act.targetId) : "";
          if (target) dispatch({ type: "DATA_START", id: target });

          try {
            let url;
            let config;
            if (via === "endpoint") {
              if (!isApiConfigReady(act.api)) {
                // Half-configured: no endpoint was picked. Say so on the thing
                // that was waiting for it rather than leaving it spinning.
                if (target) dispatch({ type: "DATA_ERR", id: target, error: "This action has no endpoint picked" });
                break;
              }
              // A picked endpoint carries its own verb, parameters and body,
              // and every template in them resolves against the live scope —
              // which is how {{values.patientName}} reaches a POST.
              ({ url, config } = buildApiRequest(act.api, scope));
            } else {
              if (!act.url) {
                if (target) dispatch({ type: "DATA_ERR", id: target, error: "This action has no URL" });
                break;
              }
              url = val(act.url);
              config = { method: (act.method || "GET").toLowerCase(), data: flagsToBits(actionBody(act, scope)) };
            }
            // A body carrying a file goes out as multipart form data — JSON
            // cannot carry one (see apiConfig.sendsForm). Everything else is
            // the JSON it always was.
            const asForm = config.data !== undefined && sendsForm(act.bodyAs, via === "endpoint" ? act.api : null, config.data);
            if (asForm) config = { ...config, data: toFormData(config.data) };
            else warnRawFile(config);
            const res = await client(url, { ...config, meta: { silent: true } }, asForm ? "multipart/form-data" : undefined);
            // The app answers 200 with success:false on a rejected write, so
            // the envelope is read rather than trusted — otherwise a "Saved"
            // toast and a closing modal would follow a failed insert.
            if (res && res.success === false) throw new Error(res.message || "The server rejected the request");

            // What came back, for the rest of THIS chain: {{response.data.pdfUrl}},
            // {{response.message}}, {{response.data.id}}. Without it a call that
            // returns something — a rendered PDF, the id of what was just saved —
            // has nowhere to put it, and the screen needs a hand-written script.
            // Chain-scoped: the next click starts a fresh context.
            if (ctx) ctx.response = res;
            // Unlike ctx.response this outlives the chain: {{vars.<name>}} is
            // readable anywhere on the screen until the next call replaces it.
            if (act.responseVar) {
              setVar(act.responseVar, act.responsePick ? getPath(res, act.responsePick) ?? null : res);
            }

            if (target) {
              // Where the rows sit is the endpoint's own setting when one was
              // picked; otherwise the response is searched for the first array
              // of objects, the same rule Sync uses.
              const at = act.api?.responsePath || findRowsPath(res);
              // "Keep rows when" runs here rather than in the table, so every
              // count, total and export downstream sees the same list the user
              // is looking at.
              dispatch({ type: "DATA_OK", id: target, rows: keptRows(pluckRows(res, at), act.keepWhen, scope), raw: res });
            }
          } catch (e) {
            toast.error(e?.message || "Request failed");
            // The component asked to show these rows must not keep showing the
            // previous ones as if they were the answer.
            if (target) dispatch({ type: "DATA_ERR", id: target, error: e?.message || "Request failed" });
            return false; // stops the rest of the chain, same as a failed validate
          }
          break;
        }
        case "confirm": {
          // Answering "no" stops everything after this action, which is the
          // whole point: put it above the delete, not below it.
          const yes = await askConfirm({
            message: val(act.message) || "Are you sure?",
            title: val(act.title) || "",
            okText: val(act.okText) || "",
            cancelText: val(act.cancelText) || "",
            variant: act.variant || "warning",
          });
          return yes;
        }
        case "verifyUser": {
          // The same gate the hand-coded billing pages put in front of a
          // settlement. A wrong password, or a closed dialog, stops the chain
          // here — so this step goes above the save, never below it.
          const proved = await askVerify({
            userId: val(act.userId) || user?.id || "",
            title: val(act.title) || "",
          });
          return proved;
        }
        case "forEach": {
          if (!gridsAllow(act)) return false;
          /**
           * Run a chain once per record — "print every ticked bill".
           *
           * The list is usually what a grid published ({{grid.x.checked}}),
           * and each pass sees that record as {{row}} (also {{item}}), its
           * place as {{index}} / {{number}}, and how many there are as
           * {{count}}. Without it a chain could call an endpoint once, and
           * "do it for each of these" was out of reach for a built screen.
           */
          const inner = Array.isArray(act.actions) ? act.actions.filter((a) => a && a.type) : [];
          if (!inner.length) break;
          const raw = typeof act.list === "string" ? interpolate(act.list, scope) : act.list;
          const list = Array.isArray(raw) ? raw : raw === undefined || raw === null || raw === "" ? [] : [raw];
          if (!list.length) {
            if (act.emptyMessage) toast.warn(val(act.emptyMessage));
            break;
          }

          /**
           * One tab per pass, opened NOW.
           *
           * A browser grants a pop-up while the click is still the task being
           * run. A loop that prints six receipts asks for six tabs, and the
           * ones asked for after the first await are refused — so they are all
           * opened here, before anything is awaited, and each pass is handed
           * its own. An unused one is closed by the chain that owns it.
           */
          const wantsTabs = inner.some((a) => a.type === "openUrl" && a.target !== "same");
          const tabs = [];
          if (wantsTabs) {
            for (let i = 0; i < list.length; i += 1) tabs.push(openBlankTab());
          }

          // The endpoints behind these loops are report renderers, and firing
          // six at once is how a print run comes back with half its files
          // missing. The pause is the same one the hand-coded pages use.
          const gap = Number(act.gapMs);
          for (let i = 0; i < list.length; i += 1) {
            const item = list[i];
            // eslint-disable-next-line no-await-in-loop
            const done = await runActionsRef.current(inner, {
              ...ctx,
              row: item,
              item,
              index: i,
              number: i + 1,
              count: list.length,
              tab: tabs[i] || null,
            });
            // One failure stops the run by default — a print of six that
            // silently drops the third is worse than one that stops and says
            // so. "Carry on regardless" is a setting for the cases where it is
            // not.
            if (done === false && act.stopOnFail !== false) return false;
            if (gap > 0 && i < list.length - 1) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise((wake) => setTimeout(wake, gap));
            }
          }
          break;
        }
        case "navigate":
          if (onNavigate) onNavigate(val(act.route));
          break;
        case "openUrl": {
          const href = val(act.url);
          if (!href) {
            toast.warn("Nothing to open — the URL came back empty");
            break;
          }
          if (act.target === "same") {
            window.location.assign(String(href));
            break;
          }
          // Resolved here, against this page — not left for another window to
          // resolve a relative "/api/…" against its own blank address.
          let abs;
          try {
            abs = new URL(String(href), window.location.href).href;
          } catch (e) {
            abs = String(href);
          }
          // Inside a loop: the tab forEach opened for this pass.
          if (ctx && ctx.tab && !ctx.tab.closed) {
            try {
              ctx.tab.location.href = abs;
              ctx.tabUsed = true;
              break;
            } catch (e) {
              /* the tab will not take it — open a fresh one below */
            }
          }
          // One tab, opened now that there is something to put in it. Not
          // `noopener` in the features: that makes window.open return null
          // even on success, so a blocked pop-up could not be told apart.
          const opened = window.open(abs, "_blank");
          if (opened) {
            try {
              opened.opener = null;
            } catch (e) {
              /* cross-origin already — nothing to cut */
            }
          } else {
            // Refused: the report took longer than the click's ~5s allowance.
            // A link is a fresh click, so it always opens.
            toast.info(
              <span>
                The file is ready.{" "}
                <a href={abs} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, textDecoration: "underline" }}>
                  Open report
                </a>
              </span>,
              { autoClose: false, closeOnClick: true },
            );
          }
          break;
        }
        case "openModal":
          // Pointed at a component of the app rather than a dialog on the
          // canvas: the app-modal host mounts it, handed the same row.
          if (act.appModal) {
            if (act.rowVar) setVar(act.rowVar, ctx?.row ?? null);
            const passed = Object.entries(act.props || {}).filter(([k]) => k && k.trim());
            openAppModal(act.appModal, ctx?.row, {
              title: val(act.title),
              size: act.size,
              position: act.position,
              sourceId: act.sourceId,
              props: passed.length ? interpolateDeep(Object.fromEntries(passed), scope) : null,
              callbacks: act.callbacks,
              saveActions: act.saveActions,
              saveText: val(act.saveText),
            });
            break;
          }
          // `ctx.row` is set by a row click or a row action button, so the
          // modal opens on the row that asked for it. `rowVar` additionally
          // parks that row under a name, for everything outside the dialog.
          if (act.target) setModalRefresh(act.target, act.sourceId);
          openModal(act.target, ctx?.row, act.rowVar);
          break;
        case "closeModal":
          // One component is open as a modal at a time, so closing "it" needs
          // no id.
          if (act.appModal) {
            closeAppModal();
            break;
          }
          closeModal(act.target);
          break;
        case "openFrameMenu":
          // Same record every other action sees, so the screens open on the row
          // whose button was pressed.
          openFrameMenu(val(act.frameName), ctx?.row, { showPatientHeader: act.showPatientHeader !== false });
          break;
        case "closeFrameMenu":
          closeFrameMenu();
          break;
        case "openAppModal":
          // Same record every other action sees, so the modal opens on the row
          // whose icon was pressed.
          openAppModal(act.appModal, ctx?.row, {
            title: val(act.title),
            size: act.size,
            position: act.position,
            sourceId: act.sourceId,
            callbacks: act.callbacks,
          });
          break;
        case "closeAppModal":
          closeAppModal();
          break;
        case "openPanel":
          openPanel(act.target, ctx?.row, act.rowVar);
          break;
        case "closePanel":
          closePanel(act.target);
          break;
        case "setValue":
          setValue(act.field, val(act.value));
          break;
        case "setVar":
          setVar(act.field, val(act.value));
          break;
        case "setStorage": {
          // The key may itself be a template ({{vars.prefix}}_filters).
          const key = String(val(act.storageKey) ?? "").trim();
          if (!key) {
            toast.warn("Save to local storage: no key set");
            return false;
          }
          const ok = act.storageOp === "remove" ? removeLocal(key) : writeLocal(key, val(act.value));
          // A refused write (private mode, quota) is said out loud rather than
          // letting a later {{local.<key>}} read come back empty unexplained.
          if (!ok) toast.warn("The browser did not allow saving to local storage");
          break;
        }
        case "storeRow":
          // The whole record, not one field of it: a chain that stores the row
          // can then read {{vars.<name>.AnyField}} without a setValue per
          // column. Storing null on a chain with no row is deliberate — it
          // clears the last one rather than leaving it to look current.
          setVar(act.rowVar || act.field || "selectedRow", ctx?.row ?? null);
          break;
        case "fillForm": {
          // The Edit icon of a grid: every control on the form (or inside
          // `within`) takes its value from the clicked record in one step,
          // instead of a setValue per column. The record is also stored as
          // `editVar`, which is what flips Save to Update — Save shows while
          // {{vars.editRow}} is empty, Update while it is not — and what the
          // Update call reads its key from ({{vars.editRow.ID}}).
          const row = ctx?.row;
          if (!row || typeof row !== "object") {
            toast.info("No record to edit");
            return false;
          }
          const all = flatten(screenRef.current?.root);
          const inside = act.within ? all.find((n) => n.id === act.within) : null;
          const nodes = inside ? flatten(inside) : all;
          const editVar = act.editVar || "editRow";
          // A binding that reads {{vars.editRow.X}} means the row being edited
          // NOW — the variable is only stored below, so without this it read
          // the previous Edit's row (or nothing, on the first one).
          const fillScope = { ...scope, vars: { ...(scope.vars || {}), [editVar]: row } };
          const next = fillFromRow(nodes, row, act.map, fillScope, { skip: act.skip, onlyMapped: !!act.onlyMapped });
          stateRef.current = { ...stateRef.current, values: { ...stateRef.current.values, ...next } };
          dispatch({ type: "SET_VALUES", values: next, filled: true });
          dispatch({ type: "SET_ERRORS", errors: {} });
          editVarsRef.current.add(editVar);
          setVar(editVar, row);
          break;
        }
        case "refresh":
          await refresh(act.sourceId, { force: true });
          break;
        case "addRow": {
          const grid = gridOf(act, ctx);
          if (!grid) {
            toast.warn("Add row: pick the table it adds to");
            return false;
          }
          const fromRaw = act.from ? interpolate(act.from, scope) : null;
          const base = fromRaw && typeof fromRaw === "object" && !Array.isArray(fromRaw) ? { ...fromRaw } : {};
          // {{row}} in the new row's values is the copied record when there is
          // one; without one it stays what the event handed over — the option
          // an Auto Complete / dropdown just picked, the row an icon sat on.
          // Read as `base` alone, it was {} and every {{row.X}} came out empty.
          const rowScope = act.from ? { ...scope, row: base } : scope;
          const row = { ...base, ...rowValuesOf(act.rowValues, rowScope) };
          const unique = String(act.uniqueBy || "").trim();
          if (unique) {
            const want = row[unique];
            const clash =
              want !== undefined && want !== null && want !== "" && grid.rows.some((r) => r && String(r[unique]) === String(want));
            if (clash) {
              toast.warn(val(act.duplicateMessage) || "That is already in the list");
              return false;
            }
          }
          const atStart = act.position === "start";
          writeGridRows(grid.node, atStart ? [row, ...grid.rows] : [...grid.rows, row], atStart ? "start" : "end");
          // What was added, for the rest of this chain: {{addedRow.Field}}.
          if (ctx) ctx.addedRow = row;
          break;
        }
        case "removeRow":
        case "updateRow": {
          const grid = gridOf(act, ctx);
          if (!grid) {
            toast.warn(`${act.type === "removeRow" ? "Remove" : "Update"} row: pick the table`);
            return false;
          }
          const which = act.which || "clicked";
          const keyField = grid.node.props?.rowKeyField;
          let hit;
          if (which === "all") hit = () => true;
          else if (which === "matching") hit = (r) => conditionsHold(act.match, { ...scope, row: r, ...(r || {}) });
          else {
            const clicked = ctx?.row;
            if (!clicked) {
              toast.warn("No row was clicked");
              return false;
            }
            // Only the first match: two identical rows are still two rows.
            let done = false;
            hit = (r) => {
              if (done || !sameRecord(r, clicked, keyField)) return false;
              done = true;
              return true;
            };
          }
          if (act.type === "removeRow") {
            const kept = grid.rows.filter((r) => !hit(r));
            if (kept.length !== grid.rows.length) writeGridRows(grid.node, kept);
            break;
          }
          let changed = false;
          const next = grid.rows.map((r) => {
            if (!hit(r)) return r;
            changed = true;
            return { ...r, ...rowValuesOf(act.rowValues, { ...scope, row: r }) };
          });
          if (changed) writeGridRows(grid.node, next);
          break;
        }
        case "runEvent": {
          const target = act.eventTarget ? flatten(screenRef.current?.root).find((n) => n.id === act.eventTarget) : null;
          const list = target?.events?.[act.eventName || "onClick"];
          if (!target || !Array.isArray(list) || !list.length) break;
          // A chain that ends up running itself would never stop.
          const depth = (ctx?.runDepth || 0) + 1;
          if (depth > 5) {
            console.warn("[ScreenBuilder] Run another component's action nested too deep — stopped", act);
            return false;
          }
          const done = await runActionsRef.current(list, { node: target, runDepth: depth });
          if (done === false) return false;
          break;
        }
        case "resetForm":
          dispatch({ type: "RESET_VALUES" });
          // Leaving edit mode is part of clearing the form: a Cancel or a
          // successful Update that resets must also bring Save back.
          editVarsRef.current.forEach((name) => setVar(name, null));
          break;
        case "toast":
          toast[act.variant && toast[act.variant] ? act.variant : "info"](val(act.message) || "Done");
          break;
        case "export": {
          /**
           * The rows to write, from one of three places (schema.exportVia):
           * what a source already holds, an endpoint called right now — the
           * "Download … Excel Sheet" button of the hand-coded pages, which asks
           * the server with the form's values and saves the answer — or a list
           * the chain can name, such as {{response.data}} left by a Call API.
           */
          const via = exportVia(act);
          let rows = [];
          if (via === "endpoint") {
            if (!isApiConfigReady(act.api)) {
              toast.error("This export has no endpoint picked");
              return false;
            }
            try {
              const { url, config } = buildApiRequest(act.api, scope);
              warnRawFile(config);
              const res = await client(url, { ...config, meta: { silent: true } });
              if (res && res.success === false) throw new Error(res.message || "The server rejected the request");
              // Readable by the rest of the chain, as after a Call API.
              if (ctx) ctx.response = res;
              rows = exportRows(res, act.api.responsePath);
            } catch (e) {
              toast.error(e?.message || "Request failed");
              return false;
            }
          } else if (via === "list") {
            // A lone template resolves to the value itself, so a list stays a list.
            rows = exportRows(typeof act.list === "string" ? interpolate(act.list, scope) : act.list, "");
          } else {
            rows = stateRef.current.data?.[act.sourceId]?.rows || [];
          }
          rows = (Array.isArray(rows) ? rows : []).filter((r) => r && typeof r === "object" && !Array.isArray(r));
          if (!rows.length) {
            toast.info(val(act.emptyMessage) || "Nothing to export");
            break;
          }
          /**
           * The columns to write, first answer wins:
           *
           * 1. the action's own list — picked, renamed and ordered in the
           *    inspector, the way an upload sheet's headings have to be;
           * 2. the columns of the component a source export points at. A grid
           *    showing ten columns should not export thirty, and least of all
           *    under the endpoint's own field names. Action and frame-menu
           *    strips are furniture and have nothing to write;
           * 3. every field the rows carry, so an export authored before either
           *    of these keeps working.
           */
          const ownerId = via === "source" ? nodeIdFromSource(act.sourceId) : "";
          const owner = ownerId ? flatten(screenRef.current?.root).find((n) => n.id === ownerId) : null;
          const own = (Array.isArray(act.columns) ? act.columns : [])
            .filter((c) => c && c.key)
            .map((c) => ({ key: c.key, header: tr(val(c.header) || c.key) }));
          const picked = (owner?.props?.columns || [])
            .filter(
              (c) =>
                c &&
                c.key &&
                c.type !== "actions" &&
                c.type !== "frameMenu" &&
                c.visible !== false &&
                // A tick box that selects rows, or a dropdown the user prints
                // with, is on screen to be used rather than to be read. It has
                // nothing to say in a spreadsheet, and a column of "true" next
                // to the money is worse than no column.
                c.exportable !== false,
            )
            .map((c) => ({ key: c.key, header: tr(c.header || c.key) }));
          // Every key across the rows, in the order first met — an endpoint
          // that leaves a field out of the first record still gets its column.
          const allKeys = () => {
            const seen = new Set();
            rows.forEach((r) => Object.keys(r).forEach((k) => !k.startsWith("__") && seen.add(k)));
            return [...seen].map((k) => ({ key: k, header: k }));
          };
          const cols = own.length ? own : picked.length ? picked : allKeys();
          // A nested payload has no cell rendering and no spreadsheet one
          // either — blank beats "[object Object]" in a column of figures.
          const flat = (v) => (v === null || v === undefined || typeof v === "object" ? "" : v);
          const table = rows.map((r) =>
            cols.reduce((o, c) => {
              o[c.header] = flat(getPath(r, c.key));
              return o;
            }, {}),
          );

          // A template, so a download can carry the centre or the date; and
          // cleaned, since a "/" from {{today}}-style text is a folder to the
          // browser's save.
          const name = String(val(act.fileName) || "export").replace(/[\\/:*?"<>|]+/g, "-").trim() || "export";
          if (exportFormat({ ...act, fileName: name }) === "xlsx") {
            // The app's own writer, imported only when somebody exports —
            // ExcelJS is far too big to carry on every screen that does not.
            const { exportToExcel } = await import("@app/utils/exportLibrary");
            // The writer appends the extension itself, so it is handed the bare
            // name — passing "Receipt Reprint.xlsx" saved "…xlsx.xlsx".
            const bare = name.replace(/\.xlsx$/i, "");
            // The heading rows above the grid. On by default and titled with
            // the file name, which is what every export wrote before these
            // were settings — and what the hand-coded pages write.
            const titled = act.titleRow !== false;
            const title = titled ? val(act.sheetTitle) || bare : "";
            const subtitle = titled ? val(act.sheetSubtitle) || "" : "";
            await exportToExcel(table, title, subtitle, false, bare);
            break;
          }
          const csv = [
            cols.map((c) => c.header).join(","),
            ...table.map((r) => cols.map((c) => `"${String(r[c.header] ?? "").replace(/"/g, '""')}"`).join(",")),
          ].join("\n");
          downloadText(/\.csv$/i.test(name) ? name : `${name}.csv`, csv, "text/csv");
          break;
        }
        case "print":
          window.print();
          break;
        case "validate": {
          const all = flatten(screenRef.current?.root);
          // Narrowed to one container when the action says so: a dialog's
          // Save checks the dialog, and the empty required fields of the form
          // behind it do not block it.
          const inside = act.within ? all.find((n) => n.id === act.within) : null;
          const nodes = inside ? flatten(inside) : all;
          // The rules decide as much as the toggles do: a field a rule has
          // hidden or disabled is not part of the answer, and one a rule has
          // made required is, so both are handed the same scope every template
          // on the screen resolves against.
          const res = validateAll(nodes, stateRef.current.values, scope, role);
          dispatch({ type: "SET_ERRORS", errors: res.errors });
          // The editable cells of the tables in the same part of the screen.
          // A table registers a check only when it is mounted, so one a rule
          // has hidden is not asked; one with no cell rules answers 0.
          let gridErrors = 0;
          const checks = gridValidatorsRef.current;
          nodes.forEach((n) => {
            const check = checks[n.id];
            if (!check) return;
            try {
              gridErrors += Number(check({ reveal: gridErrors === 0 && res.valid })?.count) || 0;
            } catch (e) {
              /* a broken table check must not take the save chain down with it */
            }
          });
          const valid = res.valid && gridErrors === 0;
          if (!valid) toast.error("Please fix the highlighted fields");
          return valid;
        }
        case "script": {
          try {
            /**
             * Opt-in escape hatch, authored by the screen designer only.
             *
             * Built as an async function so `await` works in the body: a
             * script that could not await was a script that had to fake one,
             * and the faking is where the mistakes were.
             *
             * It is deliberately NOT handed an HTTP client. A screen document
             * is stored server-side and shared, so a client here would make
             * every saved screen a place to author arbitrary authenticated
             * requests. Anything a script needed a client for — calling an
             * endpoint, opening what it returned, reshaping a payload — is now
             * a Call API / Open URL / filter and belongs in the chain where it
             * can be read, reviewed and reused.
             */
            // eslint-disable-next-line no-new-func
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
            const fn = new AsyncFunction("ctx", "api", act.code || "");
            const out = await fn(scope, {
              setValue,
              setVar,
              refresh,
              openPanel,
              closePanel,
              openModal,
              closeModal,
              toast,
            });
            // Returning false stops the chain, the same as a failed validate.
            // Anything else — including returning nothing — carries on, so no
            // script written before this changes behaviour.
            if (out === false) return false;
          } catch (e) {
            console.warn("[ScreenBuilder] custom script failed", e);
            toast.error("Script error: " + (e?.message || ""));
          }
          break;
        }
        default:
          break;
      }
      return true;
    },
    [buildScope, refresh, client, onNavigate, openModal, closeModal, openPanel, closePanel, openFrameMenu, closeFrameMenu, openAppModal, closeAppModal, setModalRefresh, setValue, setVar, askConfirm, askVerify, user, role, gridOf, writeGridRows, rowValuesOf, warnRawFile],
  );

  /** Run every action attached to `eventName` on a node, in order. */
  /**
   * Run a list of actions.
   *
   * Split out of `runEvent` because actions are no longer only attached to a
   * component's events: a table column carries its own list, so the row that
   * was clicked decides what runs, rather than one table-wide handler having
   * to work out which of six icons the click came from.
   */
  /**
   * Run a chain, and say whether it finished.
   *
   * The answer matters to whatever fired it: a modal's Save must not close the
   * dialog over a rejected insert or a failed validate, and the only thing that
   * knows is the step that broke. `true` for a chain that ran to the end (an
   * empty one included), `false` for one that stopped early.
   */
  const runActions = useCallback(
    async (list, ctx = {}) => {
      if (!Array.isArray(list) || !list.length) return true;
      if (design) return true; // design canvas never fires side effects
      // One context for the whole chain, so an action can leave something
      // behind for the ones after it — `callApi` leaves {{response}}. Copied
      // rather than used in place, so the caller's object is never written to
      // and a second click starts clean.
      const chain = { ...ctx };

      /*
       * No blank tab is opened up front for a single chain any more: it sat
       * blank beside the file, and stayed when no file came. A click keeps
       * the right to open a pop-up for about five seconds (transient user
       * activation), which a report call is well inside — so openUrl opens the
       * tab when the URL is actually known. Only a loop still pre-opens (see
       * forEach): the first pop-up spends the click, so tab two onwards must
       * exist before any await.
       */

      /** A loop's tab whose URL never came must not be left sitting there. */
      const dropTab = () => {
        if (chain.tab && !chain.tab.closed && !chain.tabUsed) {
          try {
            chain.tab.close();
          } catch (e) {
            /* already gone */
          }
        }
      };

      // `finally`, so a step that throws closes the tab too — not only one that
      // returns false.
      try {
        for (let i = 0; i < list.length; i += 1) {
          // Sequential on purpose: later actions can depend on earlier ones.
          // eslint-disable-next-line no-await-in-loop
          const ok = await runAction(list[i], chain);
          if (ok === false) return false; // a failed `validate` or write stops the chain
        }
        return true;
      } finally {
        dropTab();
      }
    },
    [runAction, design],
  );

  // Kept in step so an action can run a chain of its own — see forEach.
  runActionsRef.current = runActions;

  /**
   * The button Enter runs, if a screen named one (ButtonControl.submitOnEnter).
   *
   * A ref rather than state: nothing renders differently because of it, and
   * a re-render per registration would be a re-render of the whole screen for
   * no visible reason.
   */
  const defaultSubmitRef = useRef(null);
  const setDefaultSubmit = useCallback((nodeId, clearing) => {
    // On unmount a button clears only its own claim — otherwise a modal
    // closing would take the screen's search button with it.
    if (nodeId === null) {
      if (!clearing || defaultSubmitRef.current === clearing) defaultSubmitRef.current = null;
      return;
    }
    defaultSubmitRef.current = nodeId;
  }, []);

  const runEvent = useCallback(
    async (node, eventName, payload = {}) => runActions(node?.events?.[eventName], { ...payload, node }),
    [runActions],
  );

  /** Run whatever Enter is bound to. Silent when a screen named nothing. */
  const submitDefault = useCallback(() => {
    const id = defaultSubmitRef.current;
    if (!id) return false;
    const node = flatten(screenRef.current?.root).find((n) => n.id === id);
    if (!node) return false;
    runEvent(node, "onClick", {});
    return true;
  }, [runEvent]);

  /**
   * What each row-opened overlay previews with on the canvas.
   *
   * The builder never clicks a row, so nothing ever parks a record and a
   * drawer designed against {{row.PatientName}} would sit there blank — the
   * one place the canvas would stop being WYSIWYG. The document already says
   * which chain opens which overlay, so the opener's own sample row stands in.
   * Design mode only: at runtime the real click parks the real record.
   */
  const designRows = useMemo(() => (design ? sampleRowsByOverlay(screen?.root) : {}), [design, screen]);

  const value = useMemo(
    () => ({
      design,
      mode,
      breakpoint: bp,
      screen,
      role,
      user,
      params,
      // The app's request function, so a component that has to read something
      // of its own (the frame menu's role-filtered list) goes through the same
      // pipe as every action — one place that knows about auth and base URLs.
      client,
      values: state.values,
      labels: state.labels,
      selected: state.selected,
      vars: state.vars,
      data: state.data,
      ui: state.ui,
      errors: state.errors,
      fillSeq: state.fillSeq || 0,
      designRows,
      setValue,
      setLabel,
      setSelected,
      setVar,
      setErrors: (errors) => dispatch({ type: "SET_ERRORS", errors }),
      setUi,
      openPanel,
      closePanel,
      openModal,
      closeModal,
      modalSaved,
      openFrameMenu,
      closeFrameMenu,
      openAppModal,
      closeAppModal,
      setTab,
      setSelection,
      setChecks,
      setCells,
      setDefaultSubmit,
      submitDefault,
      setGrid,
      setGridRows,
      registerGridValidator,
      refresh,
      refreshNode,
      findNodeConfig,
      runEvent,
      runActions,
      runAction,
      buildScope,
    }),
    [
      design,
      mode,
      bp,
      screen,
      role,
      user,
      params,
      client,
      state,
      designRows,
      setValue,
      setLabel,
      setSelected,
      setVar,
      setUi,
      openPanel,
      closePanel,
      openModal,
      closeModal,
      modalSaved,
      openFrameMenu,
      closeFrameMenu,
      openAppModal,
      closeAppModal,
      setTab,
      setSelection,
      setChecks,
      setCells,
      setDefaultSubmit,
      submitDefault,
      setGrid,
      setGridRows,
      registerGridValidator,
      refresh,
      refreshNode,
      findNodeConfig,
      runEvent,
      runActions,
      runAction,
      buildScope,
    ],
  );

  return (
    <RuntimeCtx.Provider value={value}>
      {children}
      <ConfirmDialog ask={confirmAsk} onAnswer={answerConfirm} />
      {verifyAsk ? (
        // The app's own dialog, so the rule about what counts as proof lives
        // in one place: it calls the validate endpoint itself and reports back.
        <UserPasswordVerificationModal
          visible
          setVisible={(open) => {
            if (!open && verifyRef.current) answerVerify(false);
          }}
          userId={verifyAsk.userId}
          onSuccess={() => answerVerify(true)}
          onCancel={() => answerVerify(false)}
        />
      ) : null}
    </RuntimeCtx.Provider>
  );
}

export default RuntimeProvider;
