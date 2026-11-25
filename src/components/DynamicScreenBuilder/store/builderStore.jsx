/**
 * Builder store — Context + useReducer with an undo/redo friendly shape.
 *
 * The whole screen document lives in `state.screen`. Every mutation that
 * changes the document goes through `commit()`, which pushes the previous
 * document onto `history.past`. Selection, hover, zoom and panel state are
 * deliberately OUTSIDE history so undo never "undoes" a click.
 *
 * Rapid property edits (typing in the inspector, dragging a slider) pass a
 * `coalesceKey`; consecutive commits with the same key inside COALESCE_MS
 * replace the previous history entry instead of adding a new one.
 */
import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from "react";
import { createNode, createScreen, normalizeScreen, uid } from "../schema/schema";
import { getDef } from "../registry";
import {
  cloneNode,
  findNode,
  findParent,
  flatten,
  indexOfNode,
  insertNode,
  moveNode,
  removeNode,
  updateNode,
} from "../utils/tree";

const COALESCE_MS = 700;
const HISTORY_LIMIT = 80;

const BuilderCtx = createContext(null);
export const useBuilder = () => useContext(BuilderCtx);

export const initialState = (screen) => ({
  screen: screen || createScreen(),
  selectedIds: [],
  // The page header is page chrome, not a node, so it cannot sit in
  // selectedIds; this says the inspector is showing its settings instead.
  headerSelected: false,
  hoverId: null,
  clipboard: null,
  breakpoint: "desktop",
  zoom: 1,
  mode: "design", // design | preview
  showGrid: true,
  snap: true,
  panels: { palette: true, inspector: true, layers: true },
  inspectorTab: "props",
  history: { past: [], future: [] },
  coalesce: { key: null, at: 0 },
  dirty: false,
});

/** Push the current document into history and swap in the next one. */
function commit(state, nextScreen, coalesceKey) {
  const now = Date.now();
  const canCoalesce =
    coalesceKey && state.coalesce.key === coalesceKey && now - state.coalesce.at < COALESCE_MS && state.history.past.length;

  const past = canCoalesce ? state.history.past : [...state.history.past, state.screen].slice(-HISTORY_LIMIT);

  return {
    ...state,
    screen: { ...nextScreen, updatedAt: new Date().toISOString() },
    history: { past, future: [] },
    coalesce: { key: coalesceKey || null, at: now },
    dirty: true,
  };
}

/**
 * The page header is selected only while no node is: anything that selects a
 * node — a click, a paste, a drop — hands the inspector back to that node.
 */
function reducer(state, action) {
  const next = documentReducer(state, action);
  return next.headerSelected && next.selectedIds.length ? { ...next, headerSelected: false } : next;
}

function documentReducer(state, action) {
  switch (action.type) {
    /* ------------------------------------------------------------ document */
    case "SET_SCREEN": {
      const screen = normalizeScreen(action.screen);
      return { ...initialState(screen), panels: state.panels, breakpoint: state.breakpoint, zoom: state.zoom };
    }
    case "SET_META":
      return commit(state, { ...state.screen, ...action.meta }, "meta");
    case "SET_THEME":
      return commit(state, { ...state.screen, theme: { ...state.screen.theme, ...action.theme } }, "theme");
    case "SET_TOKEN":
      return commit(
        state,
        { ...state.screen, theme: { ...state.screen.theme, tokens: { ...state.screen.theme.tokens, [action.key]: action.value } } },
        `token:${action.key}`,
      );
    case "SET_PALETTE":
      return commit(state, { ...state.screen, palette: action.palette }, "palette");
    case "SET_DATASOURCES":
      return commit(state, { ...state.screen, dataSources: action.dataSources }, "ds");
    case "SET_VARIABLES":
      return commit(state, { ...state.screen, variables: action.variables }, "vars");
    case "MARK_SAVED":
      return { ...state, dirty: false, screen: action.screen ? normalizeScreen(action.screen) : state.screen };
    /*
     * An old version onto the canvas — as an edit, not a fresh open: it is
     * undoable (Ctrl+Z puts back what was there) and leaves the screen unsaved,
     * so it only becomes the latest version when somebody presses Save.
     */
    case "LOAD_VERSION":
      return { ...commit(state, normalizeScreen(action.screen)), selectedIds: [], headerSelected: false };

    /* ---------------------------------------------------------------- tree */
    case "ADD_NODE": {
      const root = insertNode(state.screen.root, action.parentId, action.node, action.index ?? -1);
      return { ...commit(state, { ...state.screen, root }), selectedIds: [action.node.id] };
    }
    case "ADD_SUBTREE": {
      // Paste / template group insert — ids are already fresh.
      const root = insertNode(state.screen.root, action.parentId, action.node, action.index ?? -1);
      return { ...commit(state, { ...state.screen, root }), selectedIds: [action.node.id] };
    }
    case "INSERT_COMPONENT": {
      // A common component (utils/commonComponents) arrives with the screen
      // level things it needs — data sources, variables, app modals — and all
      // of it lands in ONE commit: undo has to take the wiring back out with
      // the node, not leave a source behind pointing at nothing.
      const root = insertNode(state.screen.root, action.parentId, action.node, action.index ?? -1);
      const screen = {
        ...state.screen,
        root,
        dataSources: action.dataSources || state.screen.dataSources,
        variables: action.variables || state.screen.variables,
        appModals: action.appModals || state.screen.appModals,
      };
      return { ...commit(state, screen), selectedIds: [action.node.id] };
    }
    case "MOVE_NODE": {
      const root = moveNode(state.screen.root, action.nodeId, action.parentId, action.index);
      if (root === state.screen.root) return state;
      return commit(state, { ...state.screen, root });
    }
    case "REMOVE_NODES": {
      let root = state.screen.root;
      action.ids.forEach((id) => {
        if (id !== state.screen.root.id) root = removeNode(root, id);
      });
      return { ...commit(state, { ...state.screen, root }), selectedIds: [] };
    }
    case "SET_ROOT": {
      // A whole-tree rewrite (Auto icons) as ONE history step, so a single
      // undo takes all of it back.
      if (action.root === state.screen.root) return state;
      return commit(state, { ...state.screen, root: action.root });
    }
    case "UPDATE_NODE": {
      const root = updateNode(state.screen.root, action.id, (n) => ({ ...n, ...action.patch }));
      return commit(state, { ...state.screen, root }, action.coalesceKey);
    }
    case "UPDATE_PROPS": {
      const root = updateNode(state.screen.root, action.id, (n) => ({ ...n, props: { ...n.props, ...action.props } }));
      return commit(state, { ...state.screen, root }, action.coalesceKey);
    }
    case "UPDATE_STYLE": {
      const root = updateNode(state.screen.root, action.id, (n) => ({ ...n, style: { ...n.style, ...action.style } }));
      return commit(state, { ...state.screen, root }, action.coalesceKey);
    }
    case "UPDATE_RESPONSIVE": {
      const bp = action.breakpoint;
      const root = updateNode(state.screen.root, action.id, (n) => ({
        ...n,
        responsive: {
          ...n.responsive,
          [bp]: {
            ...(n.responsive?.[bp] || {}),
            ...action.patch,
            props: { ...(n.responsive?.[bp]?.props || {}), ...(action.patch.props || {}) },
            style: { ...(n.responsive?.[bp]?.style || {}), ...(action.patch.style || {}) },
          },
        },
      }));
      return commit(state, { ...state.screen, root }, action.coalesceKey);
    }
    case "SET_NODE_FIELD": {
      // Generic setter for binding / events / rules / validation / roles.
      const root = updateNode(state.screen.root, action.id, (n) => ({ ...n, [action.field]: action.value }));
      return commit(state, { ...state.screen, root }, action.coalesceKey);
    }
    case "DUPLICATE": {
      const node = findNode(state.screen.root, action.id);
      const parent = findParent(state.screen.root, action.id);
      if (!node || !parent) return state;
      const copy = cloneNode(node, " copy");
      const at = indexOfNode(state.screen.root, action.id) + 1;
      const root = insertNode(state.screen.root, parent.id, copy, at);
      return { ...commit(state, { ...state.screen, root }), selectedIds: [copy.id] };
    }
    case "GROUP": {
      // Wraps the selection in a container. `containerType` decides which one,
      // so the same action gives "wrap in a Row", "wrap in a Grid" or a plain
      // stack. `clearChildSizing` drops the per-child width/flex that would
      // otherwise fight the new layout.
      const ids = action.ids || [];
      if (!ids.length) return state;
      const parent = findParent(state.screen.root, ids[0]);
      if (!parent) return state;
      const siblings = (parent.children || []).filter((c) => ids.includes(c.id));
      if (siblings.length !== ids.length) return state; // only same-parent grouping
      const groupDef = getDef(action.containerType || "Container");
      if (!groupDef) return state;
      const group = createNode(groupDef, { name: action.name || groupDef.label, props: action.props || {} });
      group.children = siblings.map((sib) => {
        const copy = JSON.parse(JSON.stringify(sib));
        if (action.clearChildSizing) {
          const st = { ...(copy.style || {}) };
          delete st.width;
          delete st.minWidth;
          delete st.maxWidth;
          delete st.flex;
          delete st.flexBasis;
          delete st.flexGrow;
          delete st.alignSelf;
          copy.style = st;
        }
        return copy;
      });
      const at = (parent.children || []).findIndex((c) => c.id === siblings[0].id);
      let root = state.screen.root;
      ids.forEach((id) => {
        root = removeNode(root, id);
      });
      root = insertNode(root, parent.id, group, at);
      return { ...commit(state, { ...state.screen, root }), selectedIds: [group.id] };
    }
    case "UNGROUP": {
      const node = findNode(state.screen.root, action.id);
      const parent = findParent(state.screen.root, action.id);
      if (!node || !parent || !node.children?.length) return state;
      const at = indexOfNode(state.screen.root, action.id);
      let root = removeNode(state.screen.root, action.id);
      node.children.forEach((child, i) => {
        root = insertNode(root, parent.id, child, at + i);
      });
      return { ...commit(state, { ...state.screen, root }), selectedIds: node.children.map((c) => c.id) };
    }
    case "REORDER": {
      const root = moveNode(state.screen.root, action.nodeId, action.parentId, action.index);
      return commit(state, { ...state.screen, root });
    }

    /* ----------------------------------------------------------- clipboard */
    case "COPY": {
      const node = findNode(state.screen.root, action.id);
      return node ? { ...state, clipboard: JSON.parse(JSON.stringify(node)) } : state;
    }
    case "PASTE": {
      if (!state.clipboard) return state;
      const copy = cloneNode(state.clipboard);
      const targetId = action.parentId || state.selectedIds[0] || state.screen.root.id;
      const target = findNode(state.screen.root, targetId);
      const def = target ? getDef(target.type) : null;
      const parentId = def?.isContainer ? target.id : findParent(state.screen.root, targetId)?.id || state.screen.root.id;
      const root = insertNode(state.screen.root, parentId, copy, -1);
      return { ...commit(state, { ...state.screen, root }), selectedIds: [copy.id] };
    }

    /* --------------------------------------------------------- ui / canvas */
    case "SELECT":
      return { ...state, selectedIds: action.ids, headerSelected: false };
    case "SELECT_HEADER":
      return { ...state, selectedIds: [], headerSelected: true };
    case "SELECT_TOGGLE": {
      const has = state.selectedIds.includes(action.id);
      return { ...state, selectedIds: has ? state.selectedIds.filter((i) => i !== action.id) : [...state.selectedIds, action.id] };
    }
    case "HOVER":
      return state.hoverId === action.id ? state : { ...state, hoverId: action.id };
    case "SET_BREAKPOINT":
      return { ...state, breakpoint: action.breakpoint };
    case "SET_ZOOM":
      return { ...state, zoom: Math.min(2, Math.max(0.25, action.zoom)) };
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        selectedIds: action.mode === "preview" ? [] : state.selectedIds,
        headerSelected: action.mode === "preview" ? false : state.headerSelected,
      };
    case "TOGGLE_PANEL":
      return { ...state, panels: { ...state.panels, [action.panel]: !state.panels[action.panel] } };
    case "SET_INSPECTOR_TAB":
      return { ...state, inspectorTab: action.tab };
    case "TOGGLE_GRID":
      return { ...state, showGrid: !state.showGrid };
    case "TOGGLE_SNAP":
      return { ...state, snap: !state.snap };

    /* ------------------------------------------------------------ history */
    case "UNDO": {
      const past = state.history.past;
      if (!past.length) return state;
      const prev = past[past.length - 1];
      return {
        ...state,
        screen: prev,
        history: { past: past.slice(0, -1), future: [state.screen, ...state.history.future].slice(0, HISTORY_LIMIT) },
        coalesce: { key: null, at: 0 },
        dirty: true,
      };
    }
    case "REDO": {
      const future = state.history.future;
      if (!future.length) return state;
      return {
        ...state,
        screen: future[0],
        history: { past: [...state.history.past, state.screen].slice(-HISTORY_LIMIT), future: future.slice(1) },
        coalesce: { key: null, at: 0 },
        dirty: true,
      };
    }
    default:
      return state;
  }
}

export function BuilderProvider({ initialScreen, children }) {
  const [state, dispatch] = useReducer(reducer, initialScreen, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  /* Thin, stable action creators so panels never re-render on identity churn. */
  const api = useMemo(
    () => ({
      dispatch,
      getState: () => stateRef.current,

      setScreen: (screen) => dispatch({ type: "SET_SCREEN", screen }),
      setMeta: (meta) => dispatch({ type: "SET_META", meta }),
      setTheme: (theme) => dispatch({ type: "SET_THEME", theme }),
      setToken: (key, value) => dispatch({ type: "SET_TOKEN", key, value }),
      setPalette: (palette) => dispatch({ type: "SET_PALETTE", palette }),
      setDataSources: (dataSources) => dispatch({ type: "SET_DATASOURCES", dataSources }),
      setVariables: (variables) => dispatch({ type: "SET_VARIABLES", variables }),
      markSaved: (screen) => dispatch({ type: "MARK_SAVED", screen }),
      loadVersion: (screen) => dispatch({ type: "LOAD_VERSION", screen }),

      /**
       * @param overrides optional node fields for the new component; `style` is
       *        merged over the registry default rather than replacing it, which
       *        is how a drop into a row seeds the auto-fit sizing.
       */
      addComponent: (type, parentId, index, overrides = {}) => {
        const def = getDef(type);
        if (!def) return null;
        const node = createNode(def, {
          ...overrides,
          style: { ...(def.defaultStyle || {}), ...(overrides.style || {}) },
        });
        dispatch({ type: "ADD_NODE", node, parentId, index });
        return node;
      },
      addNode: (node, parentId, index) => dispatch({ type: "ADD_NODE", node, parentId, index }),
      addSubtree: (node, parentId, index) => dispatch({ type: "ADD_SUBTREE", node, parentId, index }),
      /** @param payload {node, parentId, index, dataSources, variables, appModals} */
      insertComponent: (payload) => dispatch({ type: "INSERT_COMPONENT", ...payload }),
      moveNode: (nodeId, parentId, index) => dispatch({ type: "MOVE_NODE", nodeId, parentId, index }),
      removeNodes: (ids) => dispatch({ type: "REMOVE_NODES", ids }),
      replaceRoot: (root) => dispatch({ type: "SET_ROOT", root }),
      updateNode: (id, patch, coalesceKey) => dispatch({ type: "UPDATE_NODE", id, patch, coalesceKey }),
      updateProps: (id, props, coalesceKey) => dispatch({ type: "UPDATE_PROPS", id, props, coalesceKey }),
      updateStyle: (id, style, coalesceKey) => dispatch({ type: "UPDATE_STYLE", id, style, coalesceKey }),
      updateResponsive: (id, breakpoint, patch, coalesceKey) =>
        dispatch({ type: "UPDATE_RESPONSIVE", id, breakpoint, patch, coalesceKey }),
      setNodeField: (id, field, value, coalesceKey) => dispatch({ type: "SET_NODE_FIELD", id, field, value, coalesceKey }),
      duplicate: (id) => dispatch({ type: "DUPLICATE", id }),
      /** @param opts {containerType, props, name, clearChildSizing} */
      group: (ids, opts = {}) => dispatch({ type: "GROUP", ids, ...opts }),
      /** Wrap the selection in a responsive Row: equal widths that wrap when narrow. */
      wrapInRow: (ids) =>
        dispatch({
          type: "GROUP",
          ids,
          containerType: "Row",
          name: "Row",
          props: { direction: "row", autoFit: true, wrap: true, gap: 12, minChildWidth: 200, align: "stretch" },
          clearChildSizing: true,
        }),
      /** Wrap the selection in a Grid — columns auto-fit, so it reflows on its own. */
      wrapInGrid: (ids) =>
        dispatch({
          type: "GROUP",
          ids,
          containerType: "GridLayout",
          name: "Grid",
          props: { autoFit: true, minColWidth: 200, gap: 12 },
          clearChildSizing: true,
        }),
      ungroup: (id) => dispatch({ type: "UNGROUP", id }),
      copy: (id) => dispatch({ type: "COPY", id }),
      paste: (parentId) => dispatch({ type: "PASTE", parentId }),

      select: (ids) => dispatch({ type: "SELECT", ids: Array.isArray(ids) ? ids : [ids].filter(Boolean) }),
      selectHeader: () => dispatch({ type: "SELECT_HEADER" }),
      toggleSelect: (id) => dispatch({ type: "SELECT_TOGGLE", id }),
      hover: (id) => dispatch({ type: "HOVER", id }),
      setBreakpoint: (breakpoint) => dispatch({ type: "SET_BREAKPOINT", breakpoint }),
      setZoom: (zoom) => dispatch({ type: "SET_ZOOM", zoom }),
      setMode: (mode) => dispatch({ type: "SET_MODE", mode }),
      togglePanel: (panel) => dispatch({ type: "TOGGLE_PANEL", panel }),
      setInspectorTab: (tab) => dispatch({ type: "SET_INSPECTOR_TAB", tab }),
      toggleGrid: () => dispatch({ type: "TOGGLE_GRID" }),
      toggleSnap: () => dispatch({ type: "TOGGLE_SNAP" }),
      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, ...api }), [state, api]);
  return <BuilderCtx.Provider value={value}>{children}</BuilderCtx.Provider>;
}

/* --------------------------------------------------------------- selectors */

export const selectedNode = (state) =>
  state.selectedIds.length === 1 ? findNode(state.screen.root, state.selectedIds[0]) : null;

export const allNodes = (state) => flatten(state.screen.root);

export const nodeById = (state, id) => findNode(state.screen.root, id);

// Exported for unit-testing the history/tree transitions without React.
export { reducer, uid };
