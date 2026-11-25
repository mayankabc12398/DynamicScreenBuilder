/**
 * The draw toolbar's state — tool, brush, shape, size, the two colours and the
 * custom colours — remembered per browser so the nurse's last setup comes back.
 */
import { useEffect, useState } from "react";

export const BRUSHES = [
  { id: "pencil", label: "Pencil" },
  { id: "brush", label: "Brush" },
  { id: "marker", label: "Marker" },
  { id: "highlighter", label: "Highlighter" },
];

/** Five sizes per tool, in mm (text in pt). */
export const SIZES = {
  pencil: [0.25, 0.4, 0.6, 0.9, 1.3],
  brush: [0.6, 1, 1.6, 2.4, 3.4],
  marker: [1, 1.6, 2.4, 3.2, 4.5],
  highlighter: [2.5, 3.5, 5, 7, 9],
  shape: [0.25, 0.45, 0.7, 1.1, 1.6],
  eraser: [1.5, 3, 5, 8, 12],
  text: [8, 10, 12, 16, 22],
};

/** Font sizes offered by the size boxes (Text and ✔ / ✘), in pt — any value 6-96 can be typed. */
export const PT_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
export const PT_MIN = 6;
export const PT_MAX = 96;
export const clampPt = (v, fallback) => {
  const n = Math.round(Number(v) * 2) / 2;
  return Number.isFinite(n) && n > 0 ? Math.max(PT_MIN, Math.min(PT_MAX, n)) : fallback;
};

/** The ✔ / ✘ marks the right-click menu puts on the form (text marks, so they move, erase and print like text). */
export const MARKS = [
  { id: "tick", glyph: "✔︎", label: "Tick", color: "#16a34a" },
  { id: "cross", glyph: "✘︎", label: "Cross", color: "#dc2626" },
];

/** Paint's palette: two rows, then a row of custom colours. */
export const PALETTE = [
  ["#000000", "#7f7f7f", "#880015", "#ed1c24", "#ff7f27", "#fff200", "#22b14c", "#00a2e8", "#3f48cc", "#a349a4"],
  ["#ffffff", "#c3c3c3", "#b97a57", "#ffaec9", "#ffc90e", "#efe4b0", "#b5e61d", "#99d9ea", "#7092be", "#c8bfe7"],
];

const KEY = "nfb-draw-tool";
/** What a form opens with: pencil, 0.4 mm, black, colour slot 1; one finger draws, two fingers scroll. */
export const DRAW_DEFAULTS = { tool: "brush", brush: "pencil", size: 1, c1: "#000000", slot: 1, finger: "draw" };
const DEFAULT = { ...DRAW_DEFAULTS, textPt: 10, markPt: 18, shape: "rect", c2: "#ffffff", outline: "solid", fill: "none", custom: [] };

export default function useDrawTool() {
  const [ts, setTs] = useState(() => {
    try {
      return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return DEFAULT;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ts));
    } catch {
      /* private window */
    }
  }, [ts]);
  const set = (patch) => setTs((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  return [ts, set];
}

/**
 * Whether one finger scrolls the pages instead of drawing (draw/touchPan.js).
 * ts.finger "draw" (default: one finger draws, two fingers scroll) | "scroll"
 * (one finger scrolls, draw with a stylus) — the nurse's switch in the draw panel.
 */
export const fingerScrolls = (ts) => ts.finger === "scroll";

/** Touch screens get the Finger draw / scroll switch. */
export const isTouchDevice = () => typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

/**
 * The size the current tool draws with: mm for pens, shapes and the eraser (five
 * steps, ts.size); pt for typed text and the ✔ / ✘ marks, which share one free
 * value (ts.textPt — the Font size box, saved per user).
 */
export function sizeOf(ts, tool = ts.tool) {
  if (tool === "text" || tool === "mark") return clampPt(ts.textPt, 10);
  const scale = tool === "brush" ? SIZES[ts.brush] : SIZES[tool] || SIZES.shape;
  return scale[Math.max(0, Math.min(4, ts.size))];
}
