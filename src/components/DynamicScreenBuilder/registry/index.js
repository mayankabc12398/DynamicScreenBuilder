/**
 * COMPONENT REGISTRY — the contract shared by the builder and the renderer.
 *
 * Adding a component to the whole product means adding ONE entry to one of the
 * category files below. The palette, the inspector, the layers tree, the
 * renderer and the code exporter all read from here; none of them needs to
 * know the component exists beforehand.
 *
 *   {
 *     type:            "DataTable",      // unique key, stored as node.type
 *     label:           "Table / Cards",  // palette label
 *     icon:            "Table2",         // name from registry/icons.jsx
 *     category:        "Data",           // palette group (colour coded)
 *     isContainer:     true,             // may hold children
 *     dropHint:        "Drop here",      // empty-container hint text
 *     hiddenInPalette: false,            // e.g. TabPane is dropped inside Tabs
 *     parentOnly:      "Tabs",           // restrict where it may be dropped
 *     bindable:        true,             // show the data-binding inspector tab
 *     publishes:       (node) => [...],  // extra form fields it writes, if any
 *     defaultProps:    {...},
 *     defaultStyle:    {...},
 *     propSchema:      [ {key,label,type,group,options,when}, ... ],
 *     events:          ["onClick", ...],
 *     createChildren:  () => [ node, ... ],   // optional pre-built subtree
 *     render:          ({node, props, style, rt, design, scope, children, required}) => JSX
 *   }
 */
import formControls from "./formControls";
import dataDisplay from "./dataDisplay";
import cardList from "./cardList";
import layout from "./layout";
import charts from "./charts";
// Standalone builder: the hospital payment panel (registry/payment.jsx) is not included.
import calendarTable from "./calendarTable";
import nestedRowTable from "./nestedRowTable";

/** Palette categories, in display order, each with its own accent colour. */
export const CATEGORIES = [
  { key: "Layout", label: "Layout", color: "#0ea5e9", icon: "LayoutDashboard" },
  { key: "Form", label: "Form Controls", color: "#2563eb", icon: "TextCursorInput" },
  { key: "Data", label: "Data Display", color: "#7c3aed", icon: "Table" },
  { key: "Overlay", label: "Overlays", color: "#f59e0b", icon: "AppWindow" },
];

/** The palette's clinical presets (registry/presets) — first after Common. */
export const HEALTHCARE_CATEGORY = { key: "Healthcare", label: "Healthcare", color: "#0d9488", icon: "Stethoscope" };

/**
 * The palette's fifth section. It holds no registry entries — its items are the
 * common components people save out of their own screens (utils/commonComponents,
 * ComponentRepo) — but it is declared here so its colour and label live beside
 * the built-in categories rather than being spelled out in the palette.
 */
export const COMMON_CATEGORY = { key: "Common", label: "Common Components", color: "#16a34a", icon: "SquareStack" };

export const categoryColor = (key) =>
  key === COMMON_CATEGORY.key ? COMMON_CATEGORY.color : (CATEGORIES.find((c) => c.key === key) || {}).color || "#64748b";

const ALL = [...layout, ...formControls, ...dataDisplay, ...calendarTable, ...nestedRowTable, ...cardList, ...charts];

/** type -> definition */
export const REGISTRY = ALL.reduce((acc, def) => {
  acc[def.type] = def;
  return acc;
}, {});

export const getDef = (type) => REGISTRY[type] || null;

/**
 * Every form field a node writes — what the builder's value pickers offer.
 *
 * Almost every control answers with one value, under `props.field`, and that is
 * the whole list. A few write more: the payment panel publishes the tenders,
 * the totals it worked out and the API-ready payload under three separate
 * names, and a screen's save needs the payload far more often than it needs the
 * tenders. Read off `props.field` alone, the other two were real keys that the
 * pickers never offered and nobody could find — a value that worked only if you
 * already knew to type it.
 *
 * A definition says so with `publishes(node)`, returning the extra names.
 */
export function fieldsOf(node) {
  const own = typeof node?.props?.field === "string" && node.props.field ? [node.props.field] : [];
  const def = getDef(node?.type);
  const extra = typeof def?.publishes === "function" ? def.publishes(node) : [];
  return [...new Set([...own, ...(Array.isArray(extra) ? extra : [])])].filter((f) => typeof f === "string" && f);
}

export const listByCategory = () =>
  CATEGORIES.map((cat) => ({
    ...cat,
    items: ALL.filter((d) => d.category === cat.key && !d.hiddenInPalette),
  })).filter((c) => c.items.length);

/** Can `childType` be dropped into `parentType`? */
export function canDrop(parentType, childType) {
  const parent = getDef(parentType);
  const child = getDef(childType);
  if (!parent || !child) return false;
  if (!parent.isContainer) return false;
  if (child.parentOnly && child.parentOnly !== parentType) return false;
  // Tabs only ever hold panes — anything else belongs inside a pane.
  if (parentType === "Tabs" && childType !== "TabPane") return false;
  return true;
}

export default REGISTRY;
