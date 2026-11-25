import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Resolves which menu item is active (as its lower-cased actualUrl) for both
// the Old View header menu (DesktopMenuItem) and the Modern sidebar.
//
// location.state.actualUrl wins — it is unique per item. That state is lost on
// Ctrl+click / open-in-new-tab, typed URLs, hard reloads via window.location
// (cross-tab role sync) and navigate() calls that skip state. Then fall back to
// the pathname; many items share the same `url`, so the fallback only lights
// an item when exactly one matches, or when it is the last item this tab
// opened. Otherwise nothing is lit rather than several at once.
const LAST_ACTIVE_KEY = "menuLastActualUrl";
const stripQuery = (u) => String(u || "").split(/[?#]/)[0].toLowerCase();

export const resolveActiveMenuUrl = (location, groups) => {
  const stateUrl = location?.state?.actualUrl;
  if (stateUrl) return String(stateUrl).toLowerCase();

  const path = stripQuery(location?.pathname);
  if (!path) return null;
  const candidates = [
    ...new Set(
      (groups || [])
        .flatMap((group) => group?.children || [])
        .filter((c) => stripQuery(c?.url) === path || stripQuery(c?.actualUrl) === path)
        .map((c) => c?.actualUrl?.toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (candidates.length === 1) return candidates[0];

  let last = null;
  try {
    last = window.sessionStorage.getItem(LAST_ACTIVE_KEY);
  } catch (e) {
    // storage blocked — no remembered item
  }
  return candidates.includes(last) ? last : null;
};

// `groups` = the full (unfiltered) menu: [{ children: [{ url, actualUrl }] }]
export const useActiveMenuUrl = (groups) => {
  const location = useLocation();
  const activeUrl = resolveActiveMenuUrl(location, groups);

  useEffect(() => {
    if (!activeUrl) return;
    try {
      window.sessionStorage.setItem(LAST_ACTIVE_KEY, activeUrl);
    } catch (e) {
      // storage blocked — fallback just won't remember
    }
  }, [activeUrl]);

  return activeUrl;
};
