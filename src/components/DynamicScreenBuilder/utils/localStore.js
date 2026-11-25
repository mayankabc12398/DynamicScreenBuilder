/**
 * What the browser has saved on this device, as scope.
 *
 * A screen often needs something the page itself never asked for: the centre a
 * user is signed in to, the workstation's IP, an employee id — all of which
 * this app has already put in `localStorage` (`userData`, `ip`, `EmployeeID`),
 * and none of which a built screen could reach. Without it those payload keys
 * had to be hard-coded per centre, which is the same as not working.
 *
 * So `{{local.<key>}}` reads a saved value, and `{{local.userData.centreId}}`
 * reads into one that was saved as JSON.
 */

/** Saved as JSON, or saved as text? Only a real object or list is parsed. */
function parseSaved(raw) {
  if (typeof raw !== "string") return raw;
  const t = raw.trim();
  // This app saves through JSON.stringify, so a saved STRING is on disk with
  // its quotes — `ip` is `"10.0.2.113"`, five characters longer than the
  // address. Handing that to a payload sends the quotes with it.
  //
  // Not `JSON.parse` on everything, though: a bare `0948673452` is a policy
  // number saved as text, and parsing it would send 948673452 — a different
  // number, leading zero gone, nobody told.
  if (!t.startsWith("{") && !t.startsWith("[") && !t.startsWith('"')) return raw;
  try {
    return JSON.parse(t);
  } catch (e) {
    return raw;
  }
}

/** Read one saved value, parsed if it was saved as JSON. */
export function readLocal(key) {
  try {
    return parseSaved(window.localStorage.getItem(key));
  } catch (e) {
    // Private mode, blocked site data, an iframe with no access: a screen
    // whose scope throws is a screen that will not render at all.
    return undefined;
  }
}

/**
 * Save one value — the write side of `{{local.<key>}}`, used by the
 * "Save to local storage" action.
 *
 * Saved the way `readLocal` reads it back: an object or list as JSON, so
 * `{{local.key.field}}` reaches inside it; anything else as plain text, so a
 * `0948…` policy number keeps its leading zero and an id is not wrapped in
 * quotes. Empty / null / undefined removes the key rather than saving
 * the word "undefined". Returns false when the browser refused the write
 * (private mode, quota, blocked site data).
 */
export function writeLocal(key, value) {
  const k = String(key || "").trim();
  if (!k) return false;
  try {
    if (value === undefined || value === null || value === "") {
      window.localStorage.removeItem(k);
    } else if (typeof value === "object") {
      window.localStorage.setItem(k, JSON.stringify(value));
    } else {
      window.localStorage.setItem(k, String(value));
    }
    return true;
  } catch (e) {
    return false;
  }
}

/** Remove one saved key. False when the browser refused. */
export function removeLocal(key) {
  const k = String(key || "").trim();
  if (!k) return false;
  try {
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Keys that exist to prove who you are.
 *
 * They still RESOLVE — `{{local.token}}` typed on purpose is somebody's
 * decision — but they are left out of the pickers, because a credential
 * offered in a list beside `centreId` is a credential that ends up in a
 * payload by accident.
 */
const SECRET = /^(token|refresh|auth|password|secret|jwt|bearer)/i;

export const isSecretLocalKey = (key) => SECRET.test(String(key || ""));

/**
 * The builder's own drawer — `dsb.screens.v1`, `dsb.components.v1`,
 * `dsb.settings.v1`.
 *
 * Every saved screen lives in there, so listing it put thirty rows of
 * `local.dsb.screens.v1.scr_0qyzmfge` above the handful of keys anyone came
 * for. None of them is a value a payload wants; it is the tool's filing
 * cabinet, and it was burying the room.
 */
const OWN = /^dsb\./;

/**
 * Keys no picker should ever offer: a credential, or the builder's own
 * drawer. Typed on purpose they still resolve — this only decides what gets
 * PUT IN FRONT of someone.
 */
export const isHiddenLocalKey = (key) => isSecretLocalKey(key) || OWN.test(String(key || ""));

/**
 * The saved keys, as an object to resolve tokens against.
 *
 * Getters rather than a snapshot: this is rebuilt on every scope, and reading
 * and JSON-parsing every saved value each time — some of them lists of rows —
 * would be paid on every interpolation, for keys no screen mentions.
 */
export function localValues() {
  const out = {};
  let keys = [];
  try {
    keys = Object.keys(window.localStorage);
  } catch (e) {
    return out;
  }
  keys.forEach((key) => {
    Object.defineProperty(out, key, {
      enumerable: true,
      configurable: true,
      get: () => readLocal(key),
    });
  });
  return out;
}

/**
 * The saved keys worth offering, one level into the ones saved as JSON.
 *
 * `userData` is the one that matters and it is an object; listing it alone
 * would mean opening devtools to find out that `centreId` is inside it.
 */
export function localEntries(limit = 60) {
  const out = [];
  let keys = [];
  try {
    keys = Object.keys(window.localStorage);
  } catch (e) {
    return out;
  }
  keys
    .filter((k) => !isHiddenLocalKey(k))
    .sort()
    .forEach((key) => {
      const value = readLocal(key);
      out.push({ path: `local.${key}`, value });
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.keys(value)
          .slice(0, limit)
          .forEach((k) => out.push({ path: `local.${key}.${k}`, value: value[k] }));
      }
    });
  return out;
}
