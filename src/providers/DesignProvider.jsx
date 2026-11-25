import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { applyRootThemeClass } from "@app/utils/helpers";

const STORAGE_KEY = "designMode";
export const DESIGN_MODES = { LEGACY: "legacy", MODERN: "modern" };

export const DesignContext = createContext({
  mode: DESIGN_MODES.LEGACY,
  isModern: false,
  isLegacy: true,
  setMode: () => {},
  toggle: () => {},
});

function readInitial() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === DESIGN_MODES.MODERN || v === DESIGN_MODES.LEGACY) return v;
  } catch (_) {}
  return DESIGN_MODES.LEGACY;
}

export function DesignProvider({ children, defaultMode }) {
  const [mode, setModeState] = useState(() => defaultMode || readInitial());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
    document.documentElement.dataset.design = mode;
    // modern → lock #root to sky_blue_theme + strip others; legacy → stored theme
    applyRootThemeClass();
  }, [mode]);

  const setMode = useCallback((next) => {
    if (next !== DESIGN_MODES.LEGACY && next !== DESIGN_MODES.MODERN) return;
    setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((m) => (m === DESIGN_MODES.MODERN ? DESIGN_MODES.LEGACY : DESIGN_MODES.MODERN));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isModern: mode === DESIGN_MODES.MODERN,
      isLegacy: mode === DESIGN_MODES.LEGACY,
      setMode,
      toggle,
    }),
    [mode, setMode, toggle]
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export default DesignProvider;
