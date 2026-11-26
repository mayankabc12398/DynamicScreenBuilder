import { useEffect } from "react";

/**
 * The builder UI is drawn with CSS `zoom` (--pbx-ui-zoom), sized so its text matches the
 * header text set by the app's font-size picker (header › Select font size). Pointer and
 * getBoundingClientRect() values are on-screen pixels, CSS lengths inside a zoomed box are not: divide screen distances by this before using them
 * as CSS pixels there. Portalled layers (dropdown list, tooltips) carry the same zoom.
 */
export function uiZoom() {
  const root = typeof document !== "undefined" && document.querySelector(".pbx.pbx-designer, .pbx.pbx-list");
  if (!root) return 1;
  const z = parseFloat(getComputedStyle(root).zoom);
  return z > 0 ? z : 1;
}

/**
 * The app's font size (9–17 px) → builder zoom. The header prints its text at exactly that
 * size and the builder's base text is 12.5 px (.pbx in printBuilder.css), so this zoom makes
 * the two the same on screen: 12 px → 0.96.
 */
const BUILDER_BASE_PX = 12.5;
const zoomForFont = (px) => Math.round((Math.min(20, Math.max(8, px)) / BUILDER_BASE_PX) * 1000) / 1000;

/**
 * Keeps --pbx-ui-zoom on <html> in step with --app-font-size, which the header's font-size
 * picker sets on <html> (HandleFontSize.jsx). Re-applied whenever <html>'s style changes,
 * so picking a size resizes the open builder at once.
 */
export function useAppFontZoom() {
  useEffect(() => {
    const html = document.documentElement;
    const apply = () => {
      const px = parseFloat(getComputedStyle(html).getPropertyValue("--app-font-size")) || 12;
      const z = String(zoomForFont(px));
      if (html.style.getPropertyValue("--pbx-ui-zoom") !== z) html.style.setProperty("--pbx-ui-zoom", z);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(html, { attributes: true, attributeFilter: ["style"] });
    return () => mo.disconnect();
  }, []);
}

/** Zoom of the box an element is drawn in: on-screen width ÷ layout width. */
export function zoomOf(el) {
  if (!el || !el.offsetWidth) return 1;
  const z = el.getBoundingClientRect().width / el.offsetWidth;
  return z > 0 ? z : 1;
}
