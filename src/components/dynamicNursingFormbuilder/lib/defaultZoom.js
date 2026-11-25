/**
 * Opening zoom for the viewer + patient fill screen: tablets open at 60% so the
 * whole page width fits; desktop opens at 100%. Read once when a form opens —
 * later manual zoom is untouched.
 *
 * Tablet = touch screen up to 1366px wide (iPad Pro landscape), or any
 * viewport up to 1024px.
 */
export const TABLET_ZOOM = 0.6;

export function isTabletView() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia("(pointer: coarse) and (max-width: 1366px)").matches ||
    window.matchMedia("(max-width: 1024px)").matches
  );
}

export function defaultZoom() {
  return isTabletView() ? TABLET_ZOOM : 1;
}
