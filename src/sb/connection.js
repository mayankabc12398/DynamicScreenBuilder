/**
 * Standalone Dynamic Screen Builder — which backend and which database.
 *
 *   apiBaseUrl  the hospediav12-api to talk to, e.g. http://host:7000/api/v1
 *               (read by index.html into window.__SB_API_BASE__ before the app loads,
 *               and by vite.config.js's runtimeApiBase rewrite of the copied app code)
 *   profileId   a database profile on THAT backend (ScreenDbProfile API). Sent as header
 *               X-Db-Profile on every ScreenBuilder/* call, so screens are saved into and
 *               loaded from that database. Empty = the backend's own database.
 *
 * Only ids and names live here — the DB password stays on the server.
 */
import { axiosInstance } from "@app/networkServices/axiosInstance";

export const CONNECTION_KEY = "sb.connection";
export const PROFILE_HEADER = "X-Db-Profile";

/** Calls that read or write screen-builder data and therefore follow the chosen database. */
const FOLLOWS_PROFILE = /(^|\/)ScreenBuilder\//i;

export const envApiBase = () => import.meta.env.VITE_APP_REACT_APP_BASE_URL || "";

export function getConnection() {
  try {
    return JSON.parse(window.localStorage.getItem(CONNECTION_KEY) || "null") || {};
  } catch {
    return {};
  }
}

export function setConnection(patch) {
  const next = { ...getConnection(), ...patch };
  window.localStorage.setItem(CONNECTION_KEY, JSON.stringify(next));
  return next;
}

/** The backend in use right now: the chosen one, else the build's .env. */
export const activeApiBase = () => getConnection().apiBaseUrl || envApiBase();

/** "http://host:7000/api/v1/" → "http://host:7000/api/v1". Adds /api/v1 when only an origin is given. */
export function normaliseApiBase(raw) {
  let v = String(raw || "").trim().replace(/\/+$/, "");
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `http://${v}`;
  if (!/\/api\/v\d+$/i.test(v)) v = `${v}/api/v1`;
  return v;
}

/* ---------------------------------------------------------------- install */

let installed = false;

export function installConnection() {
  if (installed) return;
  installed = true;

  // Logout wipes localStorage (utils/helpers.js clearStoragePreservingTablePrefs and
  // logoutSlice). The chosen backend must survive that, or every logout would point the
  // app back at the .env backend. Keep the copied files untouched: wrap clear() instead.
  try {
    const proto = Object.getPrototypeOf(window.localStorage);
    const original = proto.clear;
    proto.clear = function clearKeepingConnection() {
      const keep = this === window.localStorage ? this.getItem(CONNECTION_KEY) : null;
      original.call(this);
      if (keep != null) this.setItem(CONNECTION_KEY, keep);
    };
  } catch {
    /* storage unavailable: nothing to keep */
  }

  // Screen-builder calls carry the chosen database profile.
  axiosInstance.interceptors.request.use((config) => {
    const { profileId } = getConnection();
    if (profileId && FOLLOWS_PROFILE.test(String(config.url || ""))) {
      config.headers = config.headers || {};
      config.headers[PROFILE_HEADER] = profileId;
    }
    return config;
  });
}
