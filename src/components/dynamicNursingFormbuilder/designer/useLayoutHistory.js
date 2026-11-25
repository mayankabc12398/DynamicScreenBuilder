/**
 * The layout being designed, with undo/redo.
 *
 *   apply(fn)       one undoable change (snapshot, then fn(layout) → layout)
 *   checkpoint()    snapshot now — a drag calls it once on pointer-down, then
 *   live(fn)        changes the layout without a snapshot on every pointer move
 *
 * so a whole drag is one undo step. One state object, so the updaters stay
 * pure (StrictMode runs them twice).
 */
import { useCallback, useRef, useState } from "react";

const LIMIT = 80;

export default function useLayoutHistory(initial) {
  const [h, setH] = useState({ layout: initial, past: [], future: [], dirty: false });
  const cur = useRef(h.layout);
  cur.current = h.layout;

  const checkpoint = useCallback(() => setH((s) => ({ ...s, past: [...s.past.slice(-LIMIT + 1), s.layout], future: [] })), []);
  const live = useCallback((fn) => setH((s) => ({ ...s, layout: fn(s.layout), dirty: true })), []);
  const apply = useCallback(
    (fn) => setH((s) => ({ layout: fn(s.layout), past: [...s.past.slice(-LIMIT + 1), s.layout], future: [], dirty: true })),
    [],
  );
  const undo = useCallback(
    () =>
      setH((s) =>
        s.past.length ? { layout: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.layout, ...s.future], dirty: true } : s,
      ),
    [],
  );
  const redo = useCallback(
    () => setH((s) => (s.future.length ? { layout: s.future[0], past: [...s.past, s.layout], future: s.future.slice(1), dirty: true } : s)),
    [],
  );
  const reset = useCallback((l) => setH({ layout: l, past: [], future: [], dirty: false }), []);
  const setDirty = useCallback((d) => setH((s) => ({ ...s, dirty: d })), []);

  return { layout: h.layout, apply, live, checkpoint, undo, redo, reset, canUndo: h.past.length > 0, canRedo: h.future.length > 0, dirty: h.dirty, setDirty, current: cur };
}

/** Layout helpers for field edits. */
export const updateFields = (ids, patch) => (l) => ({
  ...l,
  fields: l.fields.map((f) => (ids.includes(f.id) ? (typeof patch === "function" ? patch(f) : deepMerge(f, patch)) : f)),
});
export const deepMerge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" ? { ...a[k], ...v } : v;
  return out;
};
