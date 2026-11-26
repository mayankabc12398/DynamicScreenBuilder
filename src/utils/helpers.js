import { TABLE_COLUMNS_PREFIX } from "./hooks/useColumnVisibility";

export const sleep = (time) => new Promise((res) => setTimeout(res, time));

/**
 * Logout clear that PRESERVES per-table column-visibility prefs.
 * Snapshots every `table-columns:*` entry, clears localStorage, then restores
 * them — so a user's hidden columns survive logout/auth-reset.
 */
export const clearStoragePreservingTablePrefs = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const keep = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(TABLE_COLUMNS_PREFIX)) {
        keep.push([k, localStorage.getItem(k)]);
      }
    }
    localStorage.clear();
    keep.forEach(([k, v]) => {
      if (v != null) localStorage.setItem(k, v);
    });
  } catch {
    // fall back to a full wipe if anything goes wrong
    try {
      localStorage.clear();
    } catch {}
  }
};

export const calculateWindowSize = (windowWidth) => {
  if (windowWidth >= 1200) {
    return "lg";
  }
  if (windowWidth >= 992) {
    return "md";
  }
  if (windowWidth >= 768) {
    return "sm";
  }
  return "xs";
};

const themeColors = {
  default_theme: "#13c494",
  orange_theme: "#f4730d",
  peach_theme: "#bc8f3c",
  pale_pink_theme: "#bc3c8b",
  red_theme: "#8b2424",
  sky_blue_theme: "#03a0e7",
  light_blue_theme: "#7EA0EA",
  pink_theme: "#d56e8e",
  purple_theme: "#B48AF6",
  gray_theme: "#666866",
  pastel_pink_theme: "#d18181",
  light_peach_theme: "#d6864a",
  pale_peach_theme: "#d09a4b",
  pale_yellow_theme: "#b5a52e",
  pale_green_theme: "#82b03a",
  light_celadon_theme: "#6db343",
  pale_mint_theme: "#4ec48a",
  pale_aqua_theme: "#34b8b0",
  pale_lavender_blue_theme: "#6e7ce0",
  pale_gray_theme: "#7a7a96",
  pale_mauve_theme: "#b66adc",
  lavender_blush_theme: "#c277c5",
  pale_rose_theme: "#db6cb5",
  lite_pale_theme: "#d96f9b",
  blush_pink_theme: "#d96d83",
  light_pink_theme: "#d77878",
  dark_green_theme: "#15803d",
  forest_green_theme: "#1b571b",
  deep_teal_theme: "#1c5254"
};

const updateBodyThemeVars = (classList) => {
  const body = document && document.body;
  if (!body) return;

  let foundTheme = null;
  for (const themeName of Object.keys(themeColors)) {
    if (classList.contains ? classList.contains(themeName) : String(classList).includes(themeName)) {
      foundTheme = themeName;
      break;
    }
  }

  if (foundTheme) {
    const color = themeColors[foundTheme];
    const image = foundTheme === "default_theme" ? "linear-gradient(#13c494, #05ce9a)" : "none";
    body.style.setProperty("--background-theme-color", color);
    body.style.setProperty("--background-theme-image", image);
  } else {
    body.style.removeProperty("--background-theme-color");
    body.style.removeProperty("--background-theme-image");
  }
};

export const setWindowClass = (classList) => {
  const window = document && document.getElementById("root");
  if (window) {
    // @ts-ignore
    window.classList = classList;
    updateBodyThemeVars(window.classList);
  }
};
export const addWindowClass = (classList) => {
  const window = document && document?.getElementById("root");
  if (window) {
    // @ts-ignore
    window?.classList?.add(classList);
    updateBodyThemeVars(window?.classList);
  }
};

export const removeWindowClass = (classList) => {
  const window = document && document.getElementById("root");
  if (window) {
    // @ts-ignore
    window.classList.remove(classList);
    updateBodyThemeVars(window.classList);
  }
};

/**
 * Single source of truth for the named `*_theme` class on #root.
 * Modern design view is LOCKED to `sky_blue_theme`; legacy uses the
 * stored theme (current behavior). Strips every other theme token —
 * including legacy quoted garbage like `"sky_blue_theme"` produced by
 * adding the raw (un-parsed) localStorage value.
 */
const THEME_TOKEN_RE = /_theme$/;
export const applyRootThemeClass = () => {
  const root = document && document.getElementById("root");
  if (!root) return;

  const isModern = (document.documentElement.dataset.design || "") === "modern";

  let stored = null;
  try {
    const raw = localStorage.getItem("theme");
    if (raw) stored = JSON.parse(raw);
  } catch (_) {}
  if (typeof stored !== "string" || !stored) stored = null;

  // modern locks to sky_blue; legacy uses the stored theme, or NOTHING when
  // logged out (storage cleared) — so no *_theme lingers on the login screen.
  const target = isModern ? "sky_blue_theme" : stored;

  Array.from(root.classList).forEach((cn) => {
    const clean = cn.replace(/["']/g, "");
    if (cn !== target && THEME_TOKEN_RE.test(clean)) root.classList.remove(cn);
  });
  if (target) root.classList.add(target);
};





