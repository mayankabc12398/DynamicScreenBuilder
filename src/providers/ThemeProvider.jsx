import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { lightTheme, darkTheme, applyThemeCSSVars } from "@app/design-system/themes";
import { applyRootThemeClass } from "@app/utils/helpers";

const STORAGE_KEY = "themeMode";
export const THEMES = { LIGHT: "light", DARK: "dark" };

function applyNamedTheme() {
  // delegate to the single source of truth (parses storage, respects design mode)
  applyRootThemeClass();
}

export const ThemeContext = createContext({
  theme: lightTheme,
  mode: THEMES.LIGHT,
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

function readInitial() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === THEMES.LIGHT || v === THEMES.DARK) return v;
  } catch (_) {}
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return THEMES.DARK;
  }
  return THEMES.LIGHT;
}

export function ThemeProvider({ children, defaultMode }) {
  const [mode, setModeState] = useState(() => defaultMode || readInitial());

  const theme = mode === THEMES.DARK ? darkTheme : lightTheme;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
    applyThemeCSSVars(theme);
  }, [mode, theme]);

  useEffect(() => {
    applyNamedTheme();
  }, []);

  const setMode = useCallback((next) => {
    if (next !== THEMES.LIGHT && next !== THEMES.DARK) return;
    setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((m) => (m === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK));
  }, []);

  const value = useMemo(
    () => ({ theme, mode, isDark: mode === THEMES.DARK, setMode, toggle }),
    [theme, mode, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
