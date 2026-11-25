/**
 * Where a `{{row}}` comes from — worked out from the screen document alone.
 *
 * At runtime a row-opened overlay already knows its record: the action parks it
 * under the overlay's id and the renderer hands it down (RuntimeContext.openWith).
 * The builder has no such click to learn from, so it reads the same answer out
 * of the JSON instead: which chain opens this drawer, which component that
 * chain hangs off, and therefore what a row inside it actually contains.
 *
 * Two things need that answer:
 *   - the inspector, so a value inside a drawer offers the table's field names
 *     instead of an empty dropdown and a comment saying "type {{row.X}}";
 *   - the canvas, so the drawer previews with a real record rather than blanks.
 */
import { findPath, flatten } from "./tree";
import { nodeIdFromSource } from "./apiConfig";
import { OVERLAY_TARGETS } from "../schema/schema";

/** ModalDialog / DrawerPanel / SplitView — anything openable ON a record. */
export const OVERLAY_TYPES = [...new Set(Object.values(OVERLAY_TARGETS).flatMap((s) => s.types))];

export const isOverlayType = (type) => OVERLAY_TYPES.includes(type);

/**
 * Components that draw their children once per record (runtime/repeatScope).
 * Everything inside one stands on that record, and so do its own per-card
 * props. A list rather than a registry flag: the registry imports this file.
 */
export const REPEATER_TYPES = ["CardList"];

export const isRepeaterType = (type) => REPEATER_TYPES.includes(type);

/**
 * The `{{row.X}}` fields a set of props already names.
 *
 * A card list with nothing typed in and no endpoint yet has no rows to learn
 * its shape from — but its template does say what it expects ("{{row.BedName}}"),
 * which is enough to offer those names back and to draw placeholder cards.
 */
export function templateFields(props, keys) {
  const out = new Set();
  const re = /\{\{\s*row\.([A-Za-z_$][\w$]*)/g;
  (keys || Object.keys(props || {})).forEach((k) => {
    const v = props?.[k];
    if (typeof v !== "string") return;
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(v))) out.add(m[1]);
  });
  return [...out];
}

/** What a repeater's records hold: its data first, then whatever its template names. */
function repeaterFields(node) {
  return [...new Set([...recordFieldsOf(node?.props), ...templateFields(node?.props)])];
}

/**
 * Every action list one node carries.
 *
 * Not just `events`: a table column has its own on-click chain, and an action
 * strip gives every icon in the column one of its own. A drawer opened from a
 * row icon is the common case, so missing those would leave exactly the screens
 * this exists for without a row.
 */
export function actionListsOf(node) {
  const out = [];
  Object.values(node?.events || {}).forEach((list) => {
    if (Array.isArray(list)) out.push(list);
  });
  // A Nested Row Table's sub-row columns carry click chains of their own.
  const columns = [
    ...(Array.isArray(node?.props?.columns) ? node.props.columns : []),
    ...(Array.isArray(node?.props?.subColumns) ? node.props.subColumns : []),
  ];
  columns.forEach((c) => {
    if (Array.isArray(c?.onClick)) out.push(c.onClick);
    (Array.isArray(c?.actions) ? c.actions : []).forEach((a) => {
      if (Array.isArray(a?.onClick)) out.push(a.onClick);
    });
  });
  (Array.isArray(node?.props?.actions) ? node.props.actions : []).forEach((a) => {
    if (Array.isArray(a?.onClick)) out.push(a.onClick);
  });
  return out;
}

/** The union of keys across the sample rows a component has to hand. */
export function rowFieldsOf(props) {
  const rows = [
    ...(Array.isArray(props?.previewRows) ? props.previewRows : []),
    ...(Array.isArray(props?.previewOptions) ? props.previewOptions : []),
    ...(Array.isArray(props?.staticRows) ? props.staticRows : []),
  ].slice(0, 5);
  const keys = new Set();
  rows.forEach((r) => {
    if (r && typeof r === "object") {
      Object.keys(r).forEach((k) => {
        if (!k.startsWith("__")) keys.add(k);
      });
    }
  });
  // Nothing fetched or typed yet — offer whatever the columns already name, so
  // the dropdown is never empty on a screen that was configured by hand.
  // `columns` is a column list on data components but a plain count on layout
  // ones (Grid), so only walk it when it really is a list.
  (Array.isArray(props?.columns) ? props.columns : []).forEach((c) => c?.key && keys.add(c.key));
  return [...keys];
}

/**
 * The columns of the row behind a dropdown's choice — what
 * {{selected.<field>.<Column>}} can read at runtime (see recordOfSelection).
 *
 * Only a bound list has them: a typed list's options are value and text and
 * nothing else, which {{values.x}} and {{labels.x}} already cover. The shape
 * comes from what the picker's Sync kept (an endpoint) or the rows a shared
 * source was typed with; with neither, the two mapped fields are still known.
 */
export function optionColumnsOf(props, dataSources = {}) {
  const from = props?.optionsSource || "static";
  if (from === "static") return [];
  const src = from === "api" ? dataSources?.[props.optionsSourceId] : null;
  const rows = from === "endpoint" ? props.previewOptions : src?.staticData || src?.previewRows;
  const keys = new Set();
  (Array.isArray(rows) ? rows : []).slice(0, 5).forEach((r) => {
    if (r && typeof r === "object") Object.keys(r).forEach((k) => !k.startsWith("__") && keys.add(k));
  });
  [props.optionValueField, props.optionLabelField].forEach((k) => k && keys.add(k));
  return [...keys];
}

/**
 * Column types that are furniture rather than data: a button strip, a frame
 * menu, a row number. Their `key` names a place in the table, not a field of
 * the record, so a picker of "what this row holds" must not offer them.
 */
const NON_DATA_COLUMNS = ["actions", "frameMenu", "serial"];

/** Field names of the record itself — `rowFieldsOf` without the furniture. */
export function recordFieldsOf(props) {
  const skip = new Set(
    (Array.isArray(props?.columns) ? props.columns : [])
      .filter((c) => c?.key && NON_DATA_COLUMNS.includes(c.type))
      .map((c) => c.key),
  );
  // A Nested Row Table: a row icon in the sub-table hands over a sub-row, so
  // a drawer it opens is offered those fields as well.
  const sub = Array.isArray(props?.subColumns) ? props.subColumns : [];
  sub.forEach((c) => c?.key && NON_DATA_COLUMNS.includes(c.type) && skip.add(c.key));
  const subKeys = [
    ...sub.map((c) => c?.key),
    ...(Array.isArray(props?.subPreviewRows) ? props.subPreviewRows.slice(0, 5) : []).flatMap((r) => (r && typeof r === "object" ? Object.keys(r) : [])),
  ].filter((k) => k && !k.startsWith("__"));
  return [...new Set([...rowFieldsOf(props), ...subKeys])].filter((k) => !skip.has(k));
}

/** Turn "PatientRegistrationNo" / "patient_name" into "Patient Registration No". */
export function humanizeKey(key) {
  return String(key || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

/** One row of a component's sample data, for previewing an overlay on canvas. */
export function sampleRowOf(props) {
  const rows = Array.isArray(props?.previewRows) && props.previewRows.length
    ? props.previewRows
    : Array.isArray(props?.staticRows)
      ? props.staticRows
      : [];
  const first = rows.find((r) => r && typeof r === "object");
  return first || null;
}

/**
 * overlayId -> the node whose chain opens it.
 *
 * A component that knows what a row looks like wins over one that does not: a
 * drawer is usually opened both from a table's onRowClick AND from a Close/Back
 * button elsewhere, and only the first of those can say what the record holds.
 */
export function rowOpeners(root) {
  const out = {};
  flatten(root).forEach((n) => {
    const knowsRows = rowFieldsOf(n.props).length > 0;
    actionListsOf(n).forEach((list) =>
      list.forEach((a) => {
        if (a?.type !== "openPanel" && a?.type !== "openModal") return;
        if (!a.target) return;
        const held = out[a.target];
        if (held && (!knowsRows || rowFieldsOf(held.props).length > 0)) return;
        out[a.target] = n;
      }),
    );
  });
  return out;
}

/** The record each row-opened overlay previews with on the canvas. */
export function sampleRowsByOverlay(root) {
  const out = {};
  Object.entries(rowOpeners(root)).forEach(([id, opener]) => {
    let sample = sampleRowOf(opener?.props);
    // A button inside a card opens the drawer with that card's record, so the
    // drawer previews with the card list's first record.
    if (!sample && opener?.id) {
      const path = findPath(root, opener.id) || [];
      const list = [...path].reverse().find((n) => isRepeaterType(n.type));
      if (list) sample = sampleRowOf(list.props);
    }
    if (sample) out[id] = sample;
  });
  return out;
}

/**
 * The component whose rows another one WATCHES.
 *
 * A KPI card counts a table it does not own; a Critical Alert tests one. Both
 * name it in `listSourceId`, and both therefore stand on that table's records
 * even though they carry no columns of their own — so a row title written on
 * the alert has to be offered the table's field names, and a drawer the alert
 * opens has to know what the record it is handed contains.
 */
function watchedList(root, node) {
  const id = nodeIdFromSource(node?.props?.listSourceId);
  if (!id) return null;
  return flatten(root).find((n) => n.id === id) || null;
}

/**
 * What `{{row.…}}` can reach at one position in the tree.
 *
 * `fields` are the key names; `sourceName` is the component they came from, so
 * the inspector can say WHERE the list is from rather than presenting field
 * names out of nowhere.
 */
export function rowContextAt(root, nodeId, seen = new Set()) {
  const none = { fields: [], sourceName: "", overlayId: "" };
  if (!root || !nodeId || seen.has(nodeId)) return none;
  seen.add(nodeId);
  const path = findPath(root, nodeId);
  if (!path) return none;
  // A KPI card fetching its own endpoint stands on that endpoint's first row
  // (StatCard's ownRow), so its label and trend are offered those fields.
  const self = path[path.length - 1];
  if (self?.type === "StatCard" && self.props?.valueMode === "api") {
    const own = recordFieldsOf(self.props);
    if (own.length) return { fields: own, sourceName: `${self.name || self.type} (its API)`, overlayId: "" };
  }
  // A watched list answers first: what the component itself is bound to beats
  // whatever overlay it happens to sit in.
  const watched = watchedList(root, self);
  if (watched) {
    const own = recordFieldsOf(watched.props);
    if (own.length) return { fields: own, sourceName: watched.name || watched.type, overlayId: "" };
  }
  const openers = rowOpeners(root);
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const anc = path[i];
    // A card list — the node itself or the one this sits in — stands every
    // card on one of its records; the nearest such answer is the right one.
    if (isRepeaterType(anc.type)) {
      const fields = repeaterFields(anc);
      if (fields.length) return { fields, sourceName: anc.name || anc.type, overlayId: "" };
      continue;
    }
    if (!isOverlayType(anc.type)) continue;
    const opener = openers[anc.id];
    if (!opener) continue;
    const fields = recordFieldsOf(opener.props);
    if (fields.length) {
      return { fields, sourceName: opener.name || opener.type, overlayId: anc.id };
    }
    /**
     * The opener knows no rows of its own — it is a tile, a button, an icon.
     * But it STANDS on a record: an Action Tile that opens a modal is itself
     * inside the drawer a table row opened, and the row reaches the modal
     * through it at runtime. So the question is asked again of the opener, and
     * the answer travels the whole chain rather than stopping at the first
     * link that happens not to be a table.
     *
     * `seen` is what keeps that terminating: two overlays that open each other
     * are a cycle, and a screen is allowed to contain one.
     */
    const inherited = rowContextAt(root, opener.id, seen);
    if (inherited.fields.length) return { ...inherited, overlayId: anc.id };
  }
  return none;
}
