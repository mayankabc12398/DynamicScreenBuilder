import { useCallback, useEffect, useMemo, useState } from "react";

/* ============================================================================
   Reusable column show/hide system for data tables.

   - useColumnVisibility(tableId, columns[, thead]) — per-table visibility state
     persisted to localStorage, namespaced by a stable key so multiple tables
     never collide.
   - getTableKey(thead) — derive that key from a table's `thead` prop when no
     explicit tableId is given.

   Storage shape (one key per table):
     "table-columns:<id>"  ->  { [columnKey]: boolean }
   ========================================================================== */

// Constant prefix so every table's key is easy to find / clear in devtools:
//   Object.keys(localStorage).filter(k => k.startsWith(TABLE_COLUMNS_PREFIX))
export const TABLE_COLUMNS_PREFIX = "table-columns:";

const storageKey = (tableId) => `${TABLE_COLUMNS_PREFIX}${tableId}`;

// localStorage can be absent (SSR) or throw on access (Safari private mode,
// disabled cookies). Probe once per call and degrade to in-memory defaults.
const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

/**
 * Normalize a header label into a slug-safe token:
 * lowercased, spaces -> dashes, every non [a-z0-9-] char stripped.
 *   "S.no"        -> "sno"
 *   "Patient Name"-> "patient-name"
 */
const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Derive a stable localStorage namespace from a table's `thead`.
 *
 * Accepts BOTH shapes the tables use, detected per item:
 *   1) array of strings:  ["S.no", "UHID", "Patient Name"]
 *   2) array of objects:  [{ name: "S.no", width: "" }, { name: "UHID" }]
 *
 * Extracts each header name, slug-normalizes it, and joins into one string.
 * Returns "default-table" when thead is empty / invalid.
 *
 * TRADEOFFS — why an explicit tableId is preferred over this derived key:
 *   - Renaming a column changes the derived key, so that table's saved
 *     visibility RESETS (the user's prefs appear to vanish).
 *   - Two tables with identical headers derive the SAME key and therefore
 *     SHARE one stored state.
 * Always pass an explicit tableId when you can; the hook prefers it.
 */
function getTableKey(thead) {
  if (!Array.isArray(thead) || thead.length === 0) return "default-table";

  const names = thead
    .map((item) => {
      if (typeof item === "string") return item; // shape 1
      if (item && typeof item === "object") return item.name ?? ""; // shape 2
      return "";
    })
    .map(slug)
    .filter(Boolean);

  if (names.length === 0) return "default-table";
  return names.join("_");
}

/** Build the default visibility map from column defs (defaultVisible ?? true). */
const buildDefaults = (columns) => {
  const map = {};
  (columns || []).forEach((col) => {
    if (!col || col.key == null) return;
    // default true unless explicitly defaultVisible:false
    map[col.key] = col.defaultVisible !== false;
  });
  return map;
};

/**
 * Read stored visibility for a table and MERGE it onto the current column defs
 * so the result always matches today's schema:
 *   - corrupt / missing JSON        -> defaults (try/catch)
 *   - column added since last save  -> keeps its default (not hidden silently)
 *   - column removed from defs       -> stale stored key is ignored
 */
const readVisibility = (tableId, columns) => {
  const defaults = buildDefaults(columns);
  if (!canUseStorage()) return defaults;

  let stored = null;
  try {
    const raw = window.localStorage.getItem(storageKey(tableId));
    stored = raw ? JSON.parse(raw) : null;
  } catch {
    stored = null; // corrupt JSON -> fall back to defaults
  }
  if (!stored || typeof stored !== "object") return defaults;

  // Start from defaults (this is what enforces schema drift: only keys that
  // exist in the current columns survive; new keys keep their default), then
  // overlay any boolean the user previously saved.
  const merged = { ...defaults };
  Object.keys(merged).forEach((key) => {
    if (typeof stored[key] === "boolean") merged[key] = stored[key];
  });
  return merged;
};

/**
 * Per-table column visibility, persisted to localStorage.
 *
 * @param {string}  tableId  Explicit, unique namespace (e.g. "patients-table").
 *                           Falsy -> auto-derived from `thead` via getTableKey.
 * @param {Array}   columns  [{ key, label, defaultVisible? }, ...]
 * @param {Array}   [thead]  Optional; only used to derive the key when tableId
 *                           is not provided. Explicit tableId always wins.
 *
 * @returns {{
 *   visibility: Record<string, boolean>,
 *   isVisible: (key: string) => boolean,
 *   toggleColumn: (key: string) => void,
 *   showAll: () => void,
 *   hideAll: () => void,
 *   resetToDefaults: () => void
 * }}
 */
function useColumnVisibility(tableId, columns, thead) {
  // Explicit id wins; otherwise derive from thead. See getTableKey tradeoffs.
  const resolvedId = useMemo(
    () => (tableId ? String(tableId) : getTableKey(thead)),
    [tableId, thead]
  );

  // Stable signature of the column set so re-init fires only when columns
  // actually change identity — not on every render (parents often pass a fresh
  // array literal each time).
  const colSig = useMemo(
    () =>
      (columns || [])
        .map((c) => `${c?.key}:${c?.defaultVisible !== false ? 1 : 0}`)
        .join("|"),
    [columns]
  );

  // Lazy init: read straight from storage on first mount.
  const [visibility, setVisibility] = useState(() =>
    readVisibility(resolvedId, columns)
  );

  // Re-sync when the table identity OR its column set changes (schema drift,
  // or this hook instance being pointed at a different table).
  useEffect(() => {
    setVisibility(readVisibility(resolvedId, columns));
    // columns intentionally excluded — colSig captures the meaningful change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedId, colSig]);

  // Persist on every change (guarded: ignore quota / private-mode failures).
  useEffect(() => {
    if (!canUseStorage()) return;
    try {
      window.localStorage.setItem(
        storageKey(resolvedId),
        JSON.stringify(visibility)
      );
    } catch {
      /* quota exceeded / storage disabled — keep working in-memory */
    }
  }, [resolvedId, visibility]);

  // Unknown keys read as visible — matches "default new columns to visible".
  const isVisible = useCallback((key) => visibility[key] !== false, [visibility]);

  const toggleColumn = useCallback((key) => {
    setVisibility((prev) => ({ ...prev, [key]: prev[key] === false }));
  }, []);

  const showAll = useCallback(() => {
    setVisibility((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => (next[k] = true));
      return next;
    });
  }, []);

  const hideAll = useCallback(() => {
    setVisibility((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => (next[k] = false));
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    // Clear persisted state for THIS table, then fall back to column defaults.
    if (canUseStorage()) {
      try {
        window.localStorage.removeItem(storageKey(resolvedId));
      } catch {
        /* ignore */
      }
    }
    setVisibility(buildDefaults(columns));
  }, [resolvedId, columns]);

  return {
    visibility,
    isVisible,
    toggleColumn,
    showAll,
    hideAll,
    resetToDefaults,
  };
}

export default useColumnVisibility;
