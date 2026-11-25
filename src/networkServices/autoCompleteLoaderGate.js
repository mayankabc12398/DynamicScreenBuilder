/**
 * AutoComplete loader gate.
 *
 * PrimeReact AutoComplete renders a `.p-autocomplete-loader` spinner INSIDE the
 * field while its async completeMethod runs. That inline spinner is the right
 * feedback for a typeahead — the full-screen ECG/heartbeat overlay is not.
 *
 * App.jsx watches the DOM for that spinner and flips this gate; Loading.jsx
 * reads the gate and skips the full-screen overlay while ANY autocomplete is
 * searching. One switch covers every AutoComplete in the app — no per-call or
 * per-page changes.
 *
 * External-store shape (subscribe / getSnapshot) so only Loading.jsx re-renders.
 */
let suppressed = false;
let releaseT;
let watchdogT;
const subs = new Set();
const emit = () => subs.forEach((fn) => fn());

const RELEASE_DELAY = 700; // linger past the redux 500ms pool tail — no flash
const WATCHDOG_MS = 8000; // failsafe: never suppress the overlay indefinitely

export function setAutoCompleteSearching(isSearching) {
  if (isSearching) {
    clearTimeout(releaseT);
    clearTimeout(watchdogT);
    watchdogT = setTimeout(() => {
      if (suppressed) {
        suppressed = false;
        emit();
      }
    }, WATCHDOG_MS);
    if (!suppressed) {
      suppressed = true;
      emit();
    }
  } else {
    clearTimeout(releaseT);
    releaseT = setTimeout(() => {
      clearTimeout(watchdogT);
      if (suppressed) {
        suppressed = false;
        emit();
      }
    }, RELEASE_DELAY);
  }
}


export const subscribeAutoCompleteLoader = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

export const getAutoCompleteLoaderSnapshot = () => suppressed;
