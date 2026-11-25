/**
 * SCREEN RENDERER — walks a screen's JSON tree and renders real components.
 *
 * The builder canvas and the live page both mount this. The only difference is
 * `mode` and the optional `wrapNode` decorator the canvas passes in to add
 * selection outlines and drop zones. Everything else — data, events, rules,
 * colours, responsive overrides, roles — behaves identically, which is what
 * makes the canvas WYSIWYG.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { getDef } from "../registry";
import { RuntimeProvider, useRuntime } from "../runtime/RuntimeContext";
import { RepeatContext } from "../runtime/repeatScope";
import { AppModalHost, FrameMenuHost } from "../registry/dataDisplay";
import ScreenHeader from "./ScreenHeader";
import { resolveTokens, tokensToCssVars } from "../theme/tokens";
import { DEFERRED_PROP_KEYS, evalVisibility, getPath, interpolateDeep } from "../utils/expressions";
import { useBodyDirMarker, useScreenDir, useScreenLanguage } from "../utils/i18n";
import { withTypographyVars } from "../utils/typography";
import "../styles/runtime.css";

/* ---------------------------------------------------------- restricted boxes */

/**
 * Which "Restrict access" boxes this viewer may see: { enforce, all, ids }.
 * Enforced on the live page only — the canvas and Preview show every box, with
 * the builder's marker on the restricted ones. Live, a restricted box shows to
 * the users granted it (sb_screen_access) and admin roles; until the
 * grants arrive, or if they cannot be fetched, it stays hidden.
 */
const AccessContext = createContext({ enforce: false, all: true, ids: new Set() });

/* ---------------------------------------------------------------- one node */

/**
 * A node's style is user data on a saved document, and React throws
 * "The `style` prop expects a mapping from style properties to values, not a
 * string" for anything else — which the app-wide error boundary turns into a
 * white page. One malformed screen should not do that, so anything that is not
 * a plain object is dropped.
 */
function styleObject(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v;
}

/**
 * @param slot  children supplied by the caller instead of by `node.children`.
 *              Only the JSX export passes it: there the tree is real JSX, so a
 *              container's contents are React children rather than JSON.
 */
const NodeRenderer = React.memo(function NodeRenderer({ node, breakpoint, wrapNode: wrapIn, row: rowIn, parentId = "", slot }) {
  const rt = useRuntime();
  const def = getDef(node?.type);
  const firedLoad = useRef(false);
  // Directly under a repeater (runtime/repeatScope): the copy's record wins
  // over whatever the parent handed down, and a canvas look-alike copy draws
  // no selection chrome — for itself or anything below it.
  const repeat = useContext(RepeatContext);
  const access = useContext(AccessContext);
  const row = repeat ? repeat.row : rowIn;
  const wrapNode = repeat?.preview ? undefined : wrapIn;

  // onLoad fires once per mounted node.
  useEffect(() => {
    if (firedLoad.current || !rt || rt.design) return;
    firedLoad.current = true;
    if (node?.events?.onLoad) rt.runEvent(node, "onLoad", {});
  }, [rt, node]);

  /**
   * The record this node stands on.
   *
   * Normally the row handed down by a repeating parent. An overlay is the
   * exception: a modal or drawer opened from a row action parked that row under
   * its own id (RuntimeContext.openWith), so from here down the subtree binds to
   * {{row.Field}} exactly as a table cell does — no "put the row in a variable
   * first" step, and the modal's inputs, tables and title all read the record
   * that opened them. An overlay opened without a row parks null, which reads as
   * "no record" rather than falling back to whatever the parent held.
   */
  const parked = rt?.ui?.context;
  const hasParked = !!parked && !!node?.id && Object.prototype.hasOwnProperty.call(parked, node.id);
  // On the canvas nothing ever clicks a row, so an overlay stands on the sample
  // record of whatever opens it (RuntimeContext.designRows) — otherwise a
  // drawer bound to {{row.Field}} is designed against blanks.
  const designRow = rt?.design && node?.id ? rt?.designRows?.[node.id] : undefined;
  const inherited = hasParked ? parked[node.id] || undefined : designRow !== undefined ? designRow : row;
  // Standing on no record, a component that fetches its own may offer one: a
  // KPI card over a summary endpoint is about that endpoint's row, and the
  // inspector offers its fields as {{row.Field}} for the label and trend.
  // Only for this node — its children still get what was handed down.
  const ownRow = inherited === undefined && def?.ownRow && node ? def.ownRow(node, rt) : undefined;
  const rowHere = ownRow !== undefined ? ownRow : inherited;

  const scope = useMemo(() => (rt ? rt.buildScope({ row: rowHere, node: { id: node?.id } }) : { row: rowHere }), [rt, rowHere, node?.id]);

  /**
   * The runtime as this node sees it: its events fire WITH its record.
   *
   * A component only ever calls `rt.runEvent(node, "onClick", {})`, so without
   * this a Save button sitting inside a row-opened modal — or inside a card in
   * a repeater — could not put {{row.Id}} in its payload. Defaulted rather than
   * forced: a table cell that passes its own row still wins.
   */
  const rtNode = useMemo(() => {
    if (!rt || rowHere === undefined) return rt;
    return {
      ...rt,
      runEvent: (n, ev, payload = {}) => rt.runEvent(n, ev, { row: rowHere, ...payload }),
      runActions: (list, ctx = {}) => rt.runActions(list, { row: rowHere, ...ctx }),
    };
  }, [rt, rowHere]);

  if (!node) return null;
  if (!def) {
    return rt?.design ? <div className="dsb-unknown">Unknown component: {node.type}</div> : null;
  }

  /* --- breakpoint overrides (merged over the base definition) ------------ */
  const ov = breakpoint && breakpoint !== "desktop" ? node.responsive?.[breakpoint] || {} : {};
  const hidden = ov.hidden !== undefined ? ov.hidden : node.hidden;

  /* --- roles ------------------------------------------------------------ */
  const role = rt?.role;
  const visibleTo = node.roles?.visibleTo || [];
  const editableBy = node.roles?.editableBy || [];
  const roleHidden = visibleTo.length > 0 && role && !visibleTo.includes(role);
  const roleReadOnly = editableBy.length > 0 && role && !editableBy.includes(role);

  if ((hidden || roleHidden) && !rt?.design) return null;

  /* --- restricted box: only the users granted it ------------------------- */
  if (node.access?.restricted && access.enforce && !access.all && !access.ids.has(node.id)) return null;

  /* --- props: base -> breakpoint -> binding -> interpolation ------------- */
  let props = { ...(node.props || {}), ...(ov.props || {}) };

  const bind = node.binding || {};
  if (bind.sourceId || Object.keys(bind.fieldMap || {}).length) {
    const ds = rt?.data?.[bind.sourceId];
    const base = { ...scope, source: ds?.raw ?? ds?.rows, rowsOf: ds?.rows || [] };
    Object.entries(bind.fieldMap || {}).forEach(([propKey, path]) => {
      if (!path) return;
      const v = getPath(base, path);
      if (v !== undefined) props[propKey] = v;
    });
    if (bind.sourceId && props.dataSourceId === "") props.dataSourceId = bind.sourceId;
  }
  // Action chains inside props (a grid column's icons, a panel's header
  // buttons) are left alone: they run later, against a scope that has the
  // clicked row and the last response in it. Resolving them here would
  // blank every {{row.*}} they carry before the row exists.
  // A repeater's per-item props are the same story: its {{row.*}} is each
  // card's record, which only the component itself has (`def.deferProps`).
  props = interpolateDeep(props, scope, def.deferProps || DEFERRED_PROP_KEYS);

  /* --- visibility / enable / require rules ------------------------------ */
  const vis = evalVisibility(node.rules?.visibility, scope);
  if (!vis.visible && !rt?.design) return null;
  if (!vis.enabled || roleReadOnly) props.disabled = true;
  const required = !!node.validation?.required || vis.required;

  // Typography travels as custom properties as well as plain CSS, so a
  // component's own insides follow it instead of overriding it — and resets on
  // every node, so it does not leak into the components nested below.
  const style = withTypographyVars({ ...styleObject(node.style), ...styleObject(ov.style) });

  /* --- children --------------------------------------------------------- */
  const children =
    slot !== undefined
      ? React.Children.toArray(slot)
      : (node.children || []).map((child) => (
          <NodeRenderer key={child.id} node={child} breakpoint={breakpoint} wrapNode={wrapNode} row={inherited} parentId={node.id} />
        ));

  // `def.render` is used as a real component so each node owns its hook scope.
  const Cmp = def.render;
  const element = (
    <Cmp
      node={node}
      props={props}
      style={style}
      rt={rtNode}
      design={!!rt?.design}
      scope={scope}
      required={required}
      children={children.length ? children : null}
    />
  );

  const out = wrapNode
    ? wrapNode({ node, def, element, style, hidden: !!hidden, breakpoint, parentId, childCount: (node.children || []).length })
    : element;
  // The repeater's row was for this node only; below it the normal `row` prop
  // carries it on, and a modal or nested list keeps what it was handed.
  return repeat ? <RepeatContext.Provider value={null}>{out}</RepeatContext.Provider> : out;
});

/* --------------------------------------------------------------- the tree */

function Tree({ screen, breakpoint, wrapNode }) {
  if (!screen?.root) return null;
  return <NodeRenderer node={screen.root} breakpoint={breakpoint} wrapNode={wrapNode} />;
}

/* ------------------------------------------------------------ the renderer */

/**
 * @param screen      the JSON document
 * @param mode        "runtime" | "preview" | "design"
 * @param breakpoint  "desktop" | "tablet" | "mobile"
 * @param wrapNode    optional decorator used by the builder canvas
 * @param access      live page only: { all, nodeIds } from GetMyScreenAccess, or
 *                    null while it loads. Restricted boxes hide unless granted.
 * @param onSelectHeader  builder canvas only: makes the page header clickable
 * @param headerSelected  builder canvas only: the page header is selected
 */
export default function ScreenRenderer({
  screen,
  mode = "runtime",
  breakpoint = "desktop",
  role = "",
  user = null,
  params = {},
  apiClient,
  // The site's own switches, handed down from whoever hosts the screen.
  globals = null,
  access = null,
  onNavigate,
  wrapNode,
  onSelectHeader,
  headerSelected = false,
  className = "",
  style,
}) {
  const design = mode === "design";
  // Labels and headers on a screen are i18n keys (utils/i18n). One subscription
  // here re-renders the tree when the language changes; the nodes themselves
  // translate with the plain `tr` helper and stay hook-free.
  useScreenLanguage();
  // Right to left when the screen pins it or the app's language is written
  // that way. `dir` on the root mirrors everything inside it; the body marker
  // reaches the app's popups that portal out. Not on the canvas: there <body>
  // also holds the builder's own panels, which stay left to right.
  const dir = useScreenDir(screen?.theme);
  useBodyDirMarker(dir, !design);
  const tokens = useMemo(() => resolveTokens(screen?.theme), [screen?.theme]);
  const cssVars = useMemo(() => tokensToCssVars(tokens), [tokens]);
  const accessValue = useMemo(
    () => ({
      enforce: mode === "runtime",
      all: !!access?.all,
      ids: new Set((access?.nodeIds || []).map(String)),
    }),
    [mode, access],
  );

  if (!screen) return null;

  return (
    <RuntimeProvider
      screen={screen}
      design={design}
      mode={mode}
      breakpoint={breakpoint}
      role={role}
      user={user}
      params={params}
      apiClient={apiClient}
      globals={globals}
      onNavigate={onNavigate}
    >
      <AccessContext.Provider value={accessValue}>
      <div
        className={`dsb-screen dsb-bp-${breakpoint} ${screen.theme?.mode === "dark" ? "is-dark" : ""} ${className}`}
        style={{ ...cssVars, ...style }}
        dir={dir}
        data-screen-id={screen.id}
      >
        {/* Page chrome, not a node: it is the app's own header and never lands
            in the tree. The canvas can still select it, which opens the screen's
            header settings in the inspector. */}
        <ScreenHeader screen={screen} design={design} onSelect={onSelectHeader} selected={headerSelected} />
        <Tree screen={screen} breakpoint={breakpoint} wrapNode={wrapNode} />
        {/* Raised by the openFrameMenu action, which can sit on any chain and so
            has nothing on the page to hang a menu off. One per screen, and it
            renders nothing until an action opens it. */}
        <FrameMenuHost />
        {/* The app's own row modals (Labs, Meds, FlowSheets, Remarks, waiting
            type), raised by an action-strip icon or an openAppModal action.
            Also one per screen, also nothing until something opens it. */}
        <AppModalHost />
        {/* Enter in a filter runs the button a screen nominated. Nothing is
            rendered; it exists because the root element above is outside the
            provider and cannot read the runtime itself. */}
        {design ? null : <EnterRunsDefault screenId={screen.id} />}
      </div>
      </AccessContext.Provider>
    </RuntimeProvider>
  );
}

/**
 * Enter, in a text box, runs the screen's default button.
 *
 * Listened for once at the document rather than on every control: a key
 * handler per input is a lot of handlers to keep in step, and a control added
 * later would quietly not have one.
 *
 * Deliberately narrow — a textarea keeps Enter for newlines, a button keeps it
 * for itself, and a key pressed outside this screen is somebody else's.
 */
function EnterRunsDefault({ screenId }) {
  const rt = useRuntime();
  const submitDefault = rt?.submitDefault;
  useEffect(() => {
    if (!submitDefault) return undefined;
    const onKey = (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target;
      if (!el || !el.closest) return;
      if (!el.closest(`[data-screen-id="${screenId}"]`)) return;
      const tag = (el.tagName || "").toLowerCase();
      if (tag !== "input") return;
      const type = (el.getAttribute("type") || "text").toLowerCase();
      if (["checkbox", "radio", "button", "submit", "file"].includes(type)) return;
      if (submitDefault()) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [submitDefault, screenId]);
  return null;
}

export { NodeRenderer };
