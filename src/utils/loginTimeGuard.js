import { CommonAPIGetDateTimeNow } from "../networkServices/finance";

// Maximum allowed drift between the server clock and the local system clock
// at login time. Login is blocked when the two differ by more than this in
// either direction (± 30 minutes).
export const ALLOWED_TIME_DRIFT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Returns the true local system time in epoch milliseconds.
 *
 * NOTE: `DateOverRide.js` replaces the global `window.Date` so that `new Date()`
 * / `Date.now()` return SERVER-adjusted time (local + server offset). Using them
 * here would compare the server clock against itself and always report ~0 drift.
 * `performance.timeOrigin` is captured from the real system clock at page load
 * and is NOT affected by that override, so it gives us the genuine local clock.
 */
const getTrueLocalEpochMs = () => {
  if (typeof performance !== "undefined" && performance.timeOrigin) {
    return performance.timeOrigin + performance.now();
  }
  // Fallback (very old browsers) — may be server-adjusted, but better than nothing.
  return Date.now();
};

/**
 * Compares the server clock against the local system clock.
 *
 * @returns {Promise<{ok: boolean, diffMs: number, diffMinutes: number, serverTime: string|null}>}
 *   `ok` is false only when the clocks differ by more than ALLOWED_TIME_DRIFT_MS.
 *   On any fetch/parse failure it fails OPEN (ok: true) so a transient API issue
 *   never locks users out of the application.
 */
export const validateLoginTimeSync = async () => {
  const failOpen = { ok: true, diffMs: 0, diffMinutes: 0, serverTime: null };
  try {
    const res = await CommonAPIGetDateTimeNow();
    const serverNow = res?.data ?? res?.Data;
    // `new Date(str)` uses the native Date (the override only fakes the zero-arg
    // form), so this parses the server timestamp correctly.
    const serverEpoch = new Date(serverNow).getTime();
    if (!serverNow || Number.isNaN(serverEpoch)) {
      return failOpen;
    }
    const localEpoch = getTrueLocalEpochMs();
    const diffMs = serverEpoch - localEpoch;
    return {
      ok: Math.abs(diffMs) <= ALLOWED_TIME_DRIFT_MS,
      diffMs,
      diffMinutes: Math.round(diffMs / 60000),
      serverTime: serverNow,
    };
  } catch (err) {
    console.error("Login time-sync check failed", err);
    return failOpen;
  }
};
