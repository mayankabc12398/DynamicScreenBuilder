/**
 * Global in-flight request loader store.
 *
 * Counter-based (NOT boolean) so N concurrent requests show ONE loader and it
 * hides only when ALL finish. Lives outside Redux + uses useSyncExternalStore
 * so only the loader component re-renders — no app-wide re-render storm.
 *
 * Anti-flicker timing:
 *  - SHOW_DELAY     : don't show until a request has been pending this long
 *  - MIN_VISIBLE    : once shown, stay visible at least this long
 *  - HIDE_DEBOUNCE  : idle grace before hiding. Sized to bridge the gap between
 *                     a page's SEQUENTIAL awaited calls (loop of getDashboard,
 *                     then cardData, then newsData, ...) so the whole burst is
 *                     ONE loader — matching the old single redux overlay —
 *                     instead of hide+reshow (bar "loads 4 times") per request.
 * Failsafe:
 *  - WATCHDOG_MS    : if visible longer than this, force reset() (hung request)
 */
let count = 0;
let visible = false;
let shownAt = 0;
let showT;
let hideT;
let watchdogT;

const subs = new Set();

const SHOW_DELAY = 200;
const MIN_VISIBLE = 400;
const HIDE_DEBOUNCE = 500;
const WATCHDOG_MS = 30000;

const emit = () => subs.forEach((fn) => fn());

function setVisible(v) {
  if (v === visible) return;
  visible = v;
  if (v) {
    shownAt = Date.now();
    clearTimeout(watchdogT);
    watchdogT = setTimeout(() => {
      console.warn("[loaderStore] watchdog: loader visible > 30s — forcing reset (hung/never-resolving request?)");
      reset();
    }, WATCHDOG_MS);
  } else {
    clearTimeout(watchdogT);
  }
  emit();
}

export function start() {
  count++;
  clearTimeout(hideT);
  if (count === 1 && !visible) {
    clearTimeout(showT);
    showT = setTimeout(() => {
      if (count > 0) setVisible(true);
    }, SHOW_DELAY);
  }
}

export function done() {
  count = Math.max(0, count - 1);
  if (count === 0) {
    clearTimeout(showT);
    const wait = Math.max(
      HIDE_DEBOUNCE,
      visible ? MIN_VISIBLE - (Date.now() - shownAt) : 0
    );
    clearTimeout(hideT);
    hideT = setTimeout(() => {
      if (count === 0) setVisible(false);
    }, wait);
  }
}

/** Failsafe — clears everything and hides. Called by the watchdog. */
export function reset() {
  count = 0;
  clearTimeout(showT);
  clearTimeout(hideT);
  setVisible(false);
}

export const subscribe = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

export const getSnapshot = () => visible;
