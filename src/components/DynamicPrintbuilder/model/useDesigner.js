/**
 * Designer state: the template being edited, its list-level metadata, the
 * selection, and undo/redo history.
 *
 * Every edit goes through `update(fn, key)`: the reducer copies the CURRENT
 * template, `fn` mutates the copy, and the previous version is pushed on the
 * undo stack. Running `fn` inside the reducer (not on the state a component
 * last rendered with) is what keeps fast streams of edits — a drag fires one
 * per mouse move — from overwriting each other. Edits sharing a `key` within a
 * second (a drag, typing in one box) collapse into one undo step.
 *
 * `fn` must be deterministic: anything random (new ids) is created before the
 * call, because React may run a reducer twice in development.
 */
import { createContext, createElement, useContext, useMemo, useReducer } from "react";
import { cloneElement, roundMm, sortBands } from "./defaults";

const clone = (v) => JSON.parse(JSON.stringify(v));
const HISTORY = 120;

const initial = { tpl: null, meta: null, sel: [], band: null, past: [], future: [], dirty: false, lastKey: null, lastAt: 0, clipboard: null };

/** { band, el, list, parent } for an element id (top level or inside a section). */
export function findEl(tpl, id) {
  if (!tpl || !id) return null;
  for (const band of tpl.bands || []) {
    for (const el of band.elements || []) {
      if (el.id === id) return { band, el, list: band.elements, parent: null };
      if (el.type === "section") {
        const k = (el.children || []).find((c) => c.id === id);
        if (k) return { band, el: k, list: el.children, parent: el };
      }
    }
  }
  return null;
}

function reducer(s, a) {
  switch (a.type) {
    case "LOAD":
      return { ...initial, clipboard: s.clipboard, tpl: a.tpl, meta: a.meta };
    case "APPLY": {
      if (!s.tpl) return s;
      const draft = clone(s.tpl);
      if (a.fn(draft) === false) return s;
      draft.bands = sortBands(draft.bands);
      const now = Date.now();
      const merge = a.key && a.key === s.lastKey && now - s.lastAt < 1000;
      const sel = a.sel ?? s.sel.filter((id) => findEl(draft, id));
      return {
        ...s,
        tpl: draft,
        past: merge ? s.past : [...s.past, s.tpl].slice(-HISTORY),
        future: [],
        dirty: true,
        lastKey: a.key || null,
        lastAt: now,
        sel,
        band: a.band !== undefined ? a.band : s.band,
      };
    }
    case "META":
      return { ...s, meta: { ...s.meta, ...a.patch }, dirty: a.silent ? s.dirty : true };
    case "SELECT":
      return { ...s, sel: a.ids, band: a.band !== undefined ? a.band : s.band, lastKey: null };
    case "UNDO": {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return { ...s, tpl: prev, past: s.past.slice(0, -1), future: [s.tpl, ...s.future], dirty: true, lastKey: null, sel: s.sel.filter((id) => findEl(prev, id)) };
    }
    case "REDO": {
      if (!s.future.length) return s;
      const next = s.future[0];
      return { ...s, tpl: next, past: [...s.past, s.tpl], future: s.future.slice(1), dirty: true, lastKey: null, sel: s.sel.filter((id) => findEl(next, id)) };
    }
    case "SAVED":
      return { ...s, dirty: false, meta: { ...s.meta, ...a.patch } };
    case "CLIPBOARD":
      return { ...s, clipboard: a.items };
    default:
      return s;
  }
}

const Ctx = createContext(null);

export function DesignerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return createElement(Ctx.Provider, { value }, children);
}

export function useDesigner() {
  const { state, dispatch } = useContext(Ctx);

  return useMemo(() => {
    const update = (fn, key, opts = {}) => dispatch({ type: "APPLY", fn, key, sel: opts.sel, band: opts.band });
    const select = (ids, band) => dispatch({ type: "SELECT", ids: Array.isArray(ids) ? ids : ids ? [ids] : [], band });
    const updateEls = (ids, fn, key) =>
      update((t) => {
        for (const id of ids) {
          const f = findEl(t, id);
          if (f) fn(f.el, f, t);
        }
      }, key);
    const deleteEls = (ids) =>
      update((t) => {
        for (const id of ids) {
          const f = findEl(t, id);
          if (f && !f.el.locked) f.list.splice(f.list.indexOf(f.el), 1);
        }
      }, null, { sel: [] });
    const addElement = (bandId, el) =>
      update((t) => {
        const b = t.bands.find((x) => x.id === bandId);
        if (!b) return false;
        b.elements.push(el);
        if (el.y + el.h > b.height) b.height = roundMm(el.y + el.h + 1);
        return true;
      }, null, { sel: [el.id], band: bandId });
    const copy = (ids) => {
      const items = ids.map((id) => findEl(state.tpl, id)).filter(Boolean).map((f) => ({ bandId: f.band.id, el: clone(f.el) }));
      if (items.length) dispatch({ type: "CLIPBOARD", items });
      return items.length;
    };
    const paste = (targetBandId) => {
      const items = state.clipboard;
      if (!items || !items.length) return;
      const prepared = items.map((it) => ({ bandId: targetBandId || it.bandId, fallback: it.bandId, el: cloneElement(it.el, 3, 3) }));
      update((t) => {
        for (const p of prepared) {
          const b = t.bands.find((x) => x.id === p.bandId) || t.bands.find((x) => x.id === p.fallback) || t.bands[0];
          if (b) b.elements.push(clone(p.el));
        }
      }, null, { sel: prepared.map((p) => p.el.id) });
    };
    const duplicate = (ids) => {
      const prepared = ids.map((id) => findEl(state.tpl, id)).filter(Boolean).map((f) => ({ src: f.el.id, el: cloneElement(f.el, 3, 3) }));
      update((t) => {
        for (const p of prepared) {
          const f = findEl(t, p.src);
          if (f) f.list.push(clone(p.el));
        }
      }, null, { sel: prepared.map((p) => p.el.id) });
    };
    const nudge = (ids, dx, dy) =>
      updateEls(ids, (el) => {
        if (el.locked) return;
        el.x = Math.max(0, roundMm(el.x + dx));
        el.y = Math.max(0, roundMm(el.y + dy));
      }, `nudge:${ids.join(",")}`);
    const updateBand = (bandId, fn, key) =>
      update((t) => {
        const b = t.bands.find((x) => x.id === bandId);
        if (!b) return false;
        fn(b, t);
        return true;
      }, key);
    return {
      state,
      dispatch,
      update,
      select,
      updateEls,
      deleteEls,
      addElement,
      copy,
      paste,
      duplicate,
      nudge,
      updateBand,
      setMeta: (patch, silent) => dispatch({ type: "META", patch, silent }),
      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
      load: (tpl, meta) => dispatch({ type: "LOAD", tpl, meta }),
      saved: (patch) => dispatch({ type: "SAVED", patch }),
    };
  }, [state, dispatch]);
}
