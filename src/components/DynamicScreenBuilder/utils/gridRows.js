/**
 * Rows a grid holds that were changed on the screen, not by an endpoint.
 *
 * "Add Panel" appends a row built from a dropdown's choice; the trash icon on
 * that row takes it out again; neither goes near the server until Save sends
 * {{grid.<table>.rows}}. The runtime writes such a change where the table
 * already reads its rows from, so nothing downstream needs to know:
 *
 *   - a table that owns its rows (its own endpoint, or "filled by a button")
 *     reads `data["node:<id>"]` — the change is written there, and the next
 *     real load replaces it, which is what a reload means;
 *   - a table over a shared data source, or over static rows, keeps the change
 *     beside them under `local:<id>`, stamped with the list it was made
 *     against (`base`). When that list is replaced — a search, a refresh — the
 *     stamp no longer matches and the edit is dropped with the rows it was
 *     about, instead of being laid over somebody else's.
 */
import { isApiConfigReady, nodeSourceId } from "./apiConfig";
import { getPath } from "./expressions";

export const LOCAL_PREFIX = "local:";
export const localRowsId = (nodeId) => `${LOCAL_PREFIX}${nodeId}`;

/** Where a table's live rows come from — the same rule resolveRows uses. */
export function tableSourceId(node, props = node?.props || {}) {
  // A variable is not a data source: nothing is fetched under any id.
  if (props.dataMode === "vars") return "";
  const filledByAction = props.dataMode === "action";
  const own = isApiConfigReady(props.apiConfig) || filledByAction ? nodeSourceId(node?.id) : "";
  return own || node?.binding?.sourceId || props.dataSourceId || "";
}

/** One empty list, shared — a fresh [] per read would be a render loop. */
const NO_ROWS = [];

/**
 * "estimates", "vars.estimates", "{{vars.estimates.data}}" — all the same
 * place. Whatever braces or prefix were typed, the path under vars is kept.
 */
export function rowsVarPath(name) {
  return String(name || "")
    .trim()
    .replace(/^\{\{\s*/, "")
    .replace(/\s*\}\}$/, "")
    .replace(/^vars\./, "");
}

/**
 * The rows a "screen variable" table shows: the list a Call API (Store the
 * response in) or a Set variable put under {{vars.<name>}}. A whole response
 * stored as is still works — its usual envelope (data, Table, rows…) is read.
 * Anything that is not a list is no rows, never a crash.
 */
export function varRows(node, vars, props = node?.props || {}) {
  const path = rowsVarPath(props.rowsVar);
  if (!path) return NO_ROWS;
  const v = getPath(vars || {}, path);
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    for (const k of ["data", "Data", "Table", "rows", "items", "result"]) if (Array.isArray(v[k])) return v[k];
  }
  return NO_ROWS;
}

/**
 * The variables this screen fills, for the "Variable" picker: a Call API's
 * "Save response in variable" and a Set variable's name. Read off the whole
 * flattened tree, so an onChange anywhere on the screen counts.
 */
export function screenVarOptions(nodes = [], current = "") {
  const out = new Map();
  const add = (name, what) => {
    const n = typeof name === "string" ? name.trim() : "";
    if (n && !out.has(n)) out.set(n, what);
  };
  (nodes || []).forEach((n) => {
    Object.entries(n?.events || {}).forEach(([ev, list]) => {
      const at = `${n.name || n.type} · ${ev}`;
      const walk = (a) => {
        if (Array.isArray(a)) return a.forEach(walk);
        if (!a || typeof a !== "object") return;
        if (a.type === "callApi" && a.responseVar) add(a.responseVar, `API response — ${at}`);
        if (a.type === "setVar" && a.field) add(a.field, `Set variable — ${at}`);
        Object.values(a).forEach((v) => v && typeof v === "object" && walk(v));
      };
      walk(list);
    });
  });
  const opts = [...out].map(([value, what]) => ({ value, label: `${value}  ·  ${what}` }));
  const cur = String(current || "").trim();
  if (cur && !out.has(cur)) opts.unshift({ value: cur, label: cur });
  return opts;
}

/** "static" | "api" | "action" | "vars" — as the table decides it. */
export function tableMode(node, props = node?.props || {}) {
  const sourceId = tableSourceId(node, props);
  return props.dataMode || (sourceId ? "api" : "static");
}

/**
 * What the change is laid over: the static rows as saved on the node, or the
 * shared source's current list. Compared by identity, so it has to be the
 * object the table itself reads — the raw node prop, not an interpolated copy.
 */
export function localBase(node, data, vars) {
  const props = node?.props || {};
  if (tableMode(node, props) === "static") return Array.isArray(props.staticRows) ? props.staticRows : null;
  // A new list stored in the variable drops the on-screen edit, as a reload does.
  if (props.dataMode === "vars") return varRows(node, vars, props);
  const ds = data?.[tableSourceId(node, props)];
  return Array.isArray(ds?.rows) ? ds.rows : null;
}

/**
 * The on-screen edit of a table's rows, if one is still current.
 *
 * `null` when the table owns its rows (the edit then IS its data entry) or
 * when the list underneath has been replaced since.
 */
export function localRowsOf(node, data, vars) {
  if (!node?.id) return null;
  const entry = data?.[localRowsId(node.id)];
  if (!entry || !Array.isArray(entry.rows)) return null;
  return entry.base === localBase(node, data, vars) ? entry : null;
}

/**
 * Is this the record that was clicked?
 *
 * The chain gets the row the table drew, which is usually the very object in
 * the list. It may also be a copy — a merged edit, a row stored in a variable
 * and read back — so the row key field and then the whole record are tried.
 */
export function sameRecord(a, b, keyField) {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (keyField) {
    const ka = a[keyField];
    const kb = b[keyField];
    if (ka !== undefined && ka !== null && ka !== "" && ka === kb) return true;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (e) {
    return false;
  }
}
