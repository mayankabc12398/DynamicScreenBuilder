/**
 * Right-panel initial-load gate.
 *
 * When a form opens from the modern right rail it auto-fires its initial data
 * load. That first burst should NOT flash the full-screen ECG overlay — the
 * slide panel shows its own in-panel spinner. But loads the user triggers
 * afterwards (search, save, etc.) SHOULD show the overlay as usual.
 *
 * Distinguisher: the initial load happens before any user interaction; search /
 * save happen after the user touches the panel. So we arm suppression when the
 * panel opens and disarm on the first pointer/key interaction (or a watchdog).
 * Only Loading.jsx (modern) reads this — nothing else changes.
 */
let suppressed = false;
let armed = false; // listeners currently attached
let watchdog;

const onInteract = () => disarmPanelLoaderSuppress();


function disarmPanelLoaderSuppress() {
  suppressed = false;
  clearTimeout(watchdog);
  if (armed && typeof document !== "undefined") {
    document.removeEventListener("pointerdown", onInteract, true);
    document.removeEventListener("keydown", onInteract, true);
  }
  armed = false;
}

export const isPanelLoaderSuppressed = () => suppressed;
