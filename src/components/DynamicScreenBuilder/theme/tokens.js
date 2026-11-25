/**
 * Theme tokens — the single set of CSS variables every registry component
 * reads. A screen stores only the tokens it overrides; the renderer merges
 * them over the base at mount and writes them onto its own wrapper element,
 * so themes are swappable at runtime without a reload.
 */

export const TOKEN_GROUPS = [
  {
    label: "Brand",
    tokens: [
      { key: "primary", label: "Primary", type: "color" },
      { key: "primaryDark", label: "Primary dark", type: "color" },
      { key: "primarySoft", label: "Primary soft", type: "color" },
      { key: "secondary", label: "Secondary", type: "color" },
      { key: "accent", label: "Accent", type: "color" },
    ],
  },
  {
    label: "Status",
    tokens: [
      { key: "success", label: "Success", type: "color" },
      { key: "warning", label: "Warning", type: "color" },
      { key: "danger", label: "Danger", type: "color" },
      { key: "info", label: "Info", type: "color" },
    ],
  },
  {
    label: "Surface",
    tokens: [
      { key: "canvas", label: "Canvas", type: "color" },
      { key: "surface", label: "Surface", type: "color" },
      { key: "surfaceAlt", label: "Surface alt", type: "color" },
      { key: "border", label: "Border", type: "color" },
      { key: "borderStrong", label: "Border strong", type: "color" },
    ],
  },
  {
    label: "Text",
    tokens: [
      { key: "textPrimary", label: "Text primary", type: "color" },
      { key: "textMuted", label: "Text muted", type: "color" },
      { key: "textInverse", label: "Text inverse", type: "color" },
    ],
  },
  {
    label: "Shape",
    tokens: [
      { key: "radius", label: "Radius", type: "size" },
      { key: "radiusSm", label: "Radius small", type: "size" },
      { key: "radiusLg", label: "Radius large", type: "size" },
      { key: "space", label: "Base spacing", type: "size" },
      { key: "shadow", label: "Shadow", type: "text" },
      { key: "shadowLg", label: "Shadow large", type: "text" },
      { key: "fontFamily", label: "Font family", type: "text" },
      { key: "fontSize", label: "Base font size", type: "size" },
      { key: "controlHeight", label: "Control height", type: "size" },
    ],
  },
];

export const LIGHT_TOKENS = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primarySoft: "#eff6ff",
  secondary: "#7c3aed",
  accent: "#0ea5e9",

  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#0891b2",

  canvas: "#f4f6fb",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  border: "#e5e9f0",
  borderStrong: "#cbd5e1",

  textPrimary: "#0f172a",
  textMuted: "#64748b",
  textInverse: "#ffffff",

  radius: "10px",
  radiusSm: "6px",
  radiusLg: "16px",
  space: "8px",
  shadow: "0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.08)",
  shadowLg: "0 10px 30px rgba(15,23,42,.10)",
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontSize: "13px",
  // The app's own field height (2.0833rem against the 12px root, and it tracks
  // the user's font-size setting the way every other field does). Every control
  // on a screen follows it — the project components through --dsb-native-h as
  // well as the builder-skin ones — so a filter row lines up whatever mix of
  // input, select and calendar it holds.
  controlHeight: "2.0833rem",
};

export const DARK_TOKENS = {
  ...LIGHT_TOKENS,
  primary: "#60a5fa",
  primaryDark: "#3b82f6",
  primarySoft: "#1e293b",
  secondary: "#a78bfa",
  accent: "#38bdf8",

  canvas: "#0b1220",
  surface: "#111c30",
  surfaceAlt: "#16233b",
  border: "#243350",
  borderStrong: "#33456b",

  textPrimary: "#e6edf7",
  textMuted: "#93a4bd",
  textInverse: "#0b1220",

  shadow: "0 1px 2px rgba(0,0,0,.4)",
  shadowLg: "0 10px 30px rgba(0,0,0,.45)",
};

/** Reusable status swatches — the default colour library shown in the builder. */
export const DEFAULT_SWATCHES = [
  { name: "Urgent", bg: "#FDE047", fg: "#713F12" },
  { name: "Critical", bg: "#FEE2E2", fg: "#B91C1C" },
  { name: "Currently Admitted", bg: "#EDE9FE", fg: "#7C3AED" },
  { name: "Released", bg: "#DCFCE7", fg: "#15803D" },
  { name: "Shifted", bg: "#DBEAFE", fg: "#1D4ED8" },
  { name: "Waiting", bg: "#FFEDD5", fg: "#C2410C" },
  { name: "Neutral", bg: "#F1F5F9", fg: "#475569" },
  { name: "Info", bg: "#CFFAFE", fg: "#0E7490" },
];

const camelToKebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Merge a screen's token overrides over the base palette for its mode. */
export function resolveTokens(theme) {
  const base = theme?.mode === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
  return { ...base, ...(theme?.tokens || {}) };
}

/** Turn resolved tokens into an inline style object of `--dsb-*` variables. */
export function tokensToCssVars(tokens) {
  const vars = {};
  Object.entries(tokens || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    vars[`--dsb-${camelToKebab(k)}`] = v;
  });
  return vars;
}

/** `var(--dsb-primary)` helper for component code. */
export const token = (key, fallback) =>
  `var(--dsb-${camelToKebab(key)}${fallback ? `, ${fallback}` : ""})`;
