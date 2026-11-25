import { useCallback, useState } from "react";

/**
 * useViewMode — "classic" | "modern" view preference for a screen, remembered
 * in the browser's localStorage so the user gets the same view next time.
 *
 *   const [viewMode, setViewMode] = useViewMode("doctor.viewConsultation", "classic");
 *
 * @param screenKey  unique key of the screen (namespaced under "hx.viewMode.")
 * @param fallback   view when nothing is stored yet
 */
export const VIEW_MODES = ["classic", "modern"];

const storageKey = (screenKey) => `hx.viewMode.${screenKey}`;

export const readViewMode = (screenKey, fallback = "classic") => {
  try {
    const stored = window.localStorage.getItem(storageKey(screenKey));
    return VIEW_MODES.includes(stored) ? stored : fallback;
  } catch (error) {
    return fallback;
  }
};

export const writeViewMode = (screenKey, mode) => {
  try {
    window.localStorage.setItem(storageKey(screenKey), mode);
  } catch (error) {
    /* storage blocked (private window etc.) - the choice still applies for this visit */
  }
};

export default function useViewMode(screenKey, fallback = "classic") {
  const [mode, setMode] = useState(() => readViewMode(screenKey, fallback));
  const update = useCallback(
    (next) => {
      const value = VIEW_MODES.includes(next) ? next : fallback;
      setMode(value);
      writeViewMode(screenKey, value);
    },
    [screenKey, fallback],
  );
  return [mode, update];
}
