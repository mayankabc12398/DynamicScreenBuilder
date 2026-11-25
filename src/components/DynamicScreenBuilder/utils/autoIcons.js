/**
 * "Auto icons" — give every component that can carry an icon the one its label
 * asks for, in a single undoable step.
 *
 * Only EMPTY icons are filled. An icon someone picked — or cleared on purpose
 * and then re-picked — is never replaced, so running this twice, or after
 * hand-tuning half the screen, only fills what is still missing. Nothing is
 * switched on that was not already there to switch: a component shows an icon
 * only through the `icon` prop it already had.
 *
 * Beyond each node's own `icon`, the lists that carry icons per item get the
 * same treatment: a table's column headers, a table's row-action strip, and a
 * panel's header actions.
 */
import { getDef } from "../registry";
import { iconContext, suggestIcon } from "./iconSuggest";

const empty = (v) => v === undefined || v === null || v === "";

const SELF_ICONED = new Set(["Chip", "ToastBanner", "DataTable", "NestedRowTable"]);

/** The prop a component's own icon lives in, if its inspector offers one. */
function ownIconKey(def, props) {
  const sch = (def?.propSchema || []).find((s) => s.type === "icon" && s.key === "icon");
  if (!sch) return null;
  if (sch.when && !sch.when(props || {})) return null;
  return "icon";
}

function fillItems(list, textOf) {
  let n = 0;
  const next = list.map((it) => {
    if (!it || typeof it !== "object" || !empty(it.icon) || it.kind === "frameMenu") return it;
    const ic = suggestIcon(textOf(it));
    if (!ic) return it;
    n += 1;
    return { ...it, icon: ic };
  });
  return { list: n ? next : list, n };
}

/**
 * @returns {{ root, count, touched }} a new tree (the old one untouched) and
 *          how many icons were added on how many components.
 */
export function applyAutoIcons(root) {
  let count = 0;
  let touched = 0;

  const walk = (node) => {
    if (!node) return node;
    const def = getDef(node.type);
    let props = node.props || {};
    let changed = false;

    const key = ownIconKey(def, props);
    // These pick their own icon when theirs is empty — a chip from its
    // status, a toast from its variant — so filling it would only override
    // the better answer. A table's title icon has no label of its own.
    if (key && empty(props[key]) && !SELF_ICONED.has(node.type)) {
      const ic = suggestIcon(iconContext(props, node.name));
      if (ic) {
        props = { ...props, [key]: ic };
        count += 1;
        changed = true;
      }
    }

    if (Array.isArray(props.columns) && props.columns.length) {
      let colCount = 0;
      const columns = props.columns.map((c) => {
        if (!c || typeof c !== "object") return c;
        let col = c;
        // `headerIcon`, not `icon`: a column's `icon` is what its CELLS draw
        // (an icon column, a button, an edit pencil).
        if (empty(col.headerIcon) && col.type !== "serial") {
          const ic = suggestIcon(col.header || col.title || col.key);
          if (ic) {
            col = { ...col, headerIcon: ic };
            colCount += 1;
          }
        }
        if (Array.isArray(col.actions) && col.actions.length) {
          const r = fillItems(col.actions, (a) => a.tooltip || a.label);
          if (r.n) {
            col = { ...col, actions: r.list };
            colCount += r.n;
          }
        }
        return col;
      });
      if (colCount) {
        props = { ...props, columns };
        count += colCount;
        changed = true;
      }
    }

    if (Array.isArray(props.actions) && props.actions.length && node.type === "CardPanel") {
      const r = fillItems(props.actions, (a) => a.tooltip || a.label);
      if (r.n) {
        props = { ...props, actions: r.list };
        count += r.n;
        changed = true;
      }
    }

    const kids = Array.isArray(node.children) ? node.children.map(walk) : node.children;
    const kidsChanged = Array.isArray(node.children) && kids.some((k, i) => k !== node.children[i]);
    if (changed) touched += 1;
    if (!changed && !kidsChanged) return node;
    return { ...node, props, ...(Array.isArray(kids) ? { children: kids } : null) };
  };

  const next = walk(root);
  return { root: next, count, touched };
}
