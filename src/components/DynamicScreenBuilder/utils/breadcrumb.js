/**
 * The breadcrumb a screen shows, taken from the app's own menu — the same
 * source every hand-coded page uses through <Heading isBreadcrumb />.
 *
 * A page never spells its own trail out. The sidebar navigates with
 * `state.actualUrl` and `state.data`, and the menu the API returned
 * (CommonSlice.GetMenuList) carries a `breadcrumb` per child. So the trail for
 * the page currently open is a lookup, which is exactly why a generated screen
 * can have one without anybody typing it in: the screen is a menu entry like
 * any other.
 *
 * Resolution order, first hit wins:
 *   1. the Master Configuration screen's own store value (/edp-configuration)
 *   2. the menu child whose actualUrl matches the one navigation carried
 *   3. the breadcrumb the menu itself passed in navigation state
 *   4. the fallback the caller gives (a screen's name), so a screen opened by
 *      typing its URL still reads as something rather than an empty bar
 */
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const norm = (v) => String(v ?? "").trim().toLowerCase();

/**
 * The menu entry for a route.
 *
 * Wider than the two lookups in the app: <Breadcrumb/> matches `actualUrl` and
 * <Heading/> matches `url`, both only one level deep and both only against what
 * navigation carried in `state`. A screen built here is reached in more ways
 * than a hand-coded page — from the menu, from a bookmark, after a refresh (no
 * state at all) — so every key it could be known by is tried, against both
 * fields, at any depth. Only entries that actually carry a breadcrumb count, so
 * a parent row cannot swallow the match.
 */
export function findMenuChild(menu, keys = []) {
  const wanted = (Array.isArray(keys) ? keys : [keys]).map(norm).filter(Boolean);
  if (!wanted.length || !Array.isArray(menu)) return null;
  let hit = null;
  const walk = (list) => {
    (list || []).forEach((item) => {
      if (hit || !item || typeof item !== "object") return;
      if (item.breadcrumb) {
        const own = [norm(item.actualUrl), norm(item.url), norm(item.Url)].filter(Boolean);
        if (own.some((u) => wanted.includes(u))) {
          hit = item;
          return;
        }
      }
      walk(item.children);
    });
  };
  walk(menu);
  return hit;
}

/** "Emergency › Patient Search" -> ["Emergency", "Patient Search"]. */
export function crumbParts(text) {
  return String(text || "")
    .split(/[>›»|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Does a screen already carry a header of its own?
 *
 * What the automatic header checks before drawing itself: a screen that was
 * built with a Breadcrumb bar or a Page Heading in the tree keeps the one it
 * has, so nothing ends up with two headers.
 */
export function screenHasHeaderNode(node) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "Breadcrumb" || node.type === "PageHeading") return !node.hidden;
  return (node.children || []).some(screenHasHeaderNode);
}

/**
 * @param opts.screenId  the screen being drawn. Inside the builder (canvas or
 *                       Preview) the address bar is the BUILDER's, so the
 *                       menu answered "Form › Screen Builder › Screen Builder
 *                       New" for every screen; there the trail is looked up
 *                       by the screen's own route, /screen/<id>, instead.
 * @param opts.inBuilder true on the canvas and in Preview.
 * @param opts.custom    a trail typed on the component ("OPD › Panel
 *                       Allocation"); wins over everything, for a screen the
 *                       menu does not list yet.
 */
export function useMenuBreadcrumb(fallback = "", opts = {}) {
  const { screenId = "", inBuilder = false, custom = "" } = opts || {};
  const location = useLocation();
  const menu = useSelector((s) => s?.CommonSlice?.GetMenuList);
  const configCrumb = useSelector((s) => s?.Breadcrumb?.value);
  const actualUrl = location?.state?.actualUrl || "";
  const passed = location?.state?.data;
  const pathname = location?.pathname;

  return useMemo(() => {
    if (String(custom || "").trim()) return String(custom).trim();
    if (inBuilder) {
      const own = screenId ? findMenuChild(menu, [`/screen/${screenId}`, `screen/${screenId}`]) : null;
      return own?.breadcrumb ? String(own.breadcrumb) : fallback || "";
    }
    if (pathname === "/edp-configuration" && configCrumb) return String(configCrumb);
    // The route itself is tried alongside the url navigation carried, so a
    // refreshed or bookmarked screen resolves the same as a clicked one.
    const hit = findMenuChild(menu, [actualUrl, pathname]);
    if (hit?.breadcrumb) return String(hit.breadcrumb);
    if (typeof passed === "string" && passed.trim()) return passed.trim();
    return fallback || "";
  }, [pathname, configCrumb, menu, actualUrl, passed, fallback, custom, inBuilder, screenId]);
}
