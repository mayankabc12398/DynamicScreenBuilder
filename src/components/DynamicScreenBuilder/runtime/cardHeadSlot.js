/**
 * Room in a card's heading for the toolbar of the table inside it.
 *
 * A grid in a card used to draw its count, search, view toggle and refresh on
 * a row of their own, under the card's heading and above the columns — a
 * second header, and the space it took was the table's. The card now keeps an
 * empty spot on the right of its heading, and names the ONE table allowed to
 * use it (`tableId`, the first grid in the card that shows a toolbar), so two
 * grids in one card cannot both land there.
 *
 * `el` is the DOM node to portal into; null until the heading has mounted.
 */
import { createContext } from "react";

export const CardHeadSlot = createContext(null);

/** Containers that open elsewhere or head themselves — not searched into. */
const OWN_HEAD = new Set(["CardPanel", "ModalDialog", "DrawerPanel", "SplitView", "Tabs"]);

/**
 * The table whose toolbar goes into this card's heading, or "".
 *
 * Only a grid that sits in the card itself — not inside a dialog opened from
 * it, a nested card or a tab — and that shows a toolbar at all.
 */
export function headTableOf(card) {
  const walk = (list) => {
    for (const n of list || []) {
      if (!n) continue;
      if (n.type === "DataTable") {
        if (n.props?.showHeader !== false && !n.hidden) return n.id;
        continue;
      }
      if (OWN_HEAD.has(n.type)) continue;
      const hit = walk(n.children);
      if (hit) return hit;
    }
    return "";
  };
  return walk(card?.children);
}
