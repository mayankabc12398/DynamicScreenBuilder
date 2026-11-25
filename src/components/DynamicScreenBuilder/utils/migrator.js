/**
 * Client for the local migration service (tools/screen-migrator).
 *
 * The service is what reads src/pages, parses the old hand-written screens and
 * hands back a screen document. It only ever runs on a developer's machine —
 * it is not part of the deployed app, so every call here is written to fail
 * softly: if nothing is listening, the console says how to start it instead of
 * breaking the builder.
 *
 * Start it with:
 *   node tools/screen-migrator/src/server.js
 */

const KEY = "dsb.migrator.url";
const DEFAULT_URL = "http://127.0.0.1:5178";

export const getBaseUrl = () => {
  try {
    return window.localStorage.getItem(KEY) || DEFAULT_URL;
  } catch (e) {
    return DEFAULT_URL;
  }
};

export const setBaseUrl = (url) => {
  try {
    window.localStorage.setItem(KEY, String(url || "").replace(/\/+$/, "") || DEFAULT_URL);
  } catch (e) {
    /* a browser with storage disabled still works, just not across reloads */
  }
};

export const START_COMMAND = "node tools/screen-migrator/src/server.js";

/**
 * One request.
 *
 * A failed fetch to a port with nothing on it throws a TypeError with a
 * browser-specific message ("Failed to fetch", "NetworkError…"), which tells a
 * developer nothing useful — so it is replaced with the one instruction that
 * fixes it.
 */
async function call(path, { method = "GET", body, signal } = {}) {
  const url = `${getBaseUrl()}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    const err = new Error(`The migration service is not running. Start it with:  ${START_COMMAND}`);
    err.offline = true;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}

export const health = (signal) => call("/api/health", { signal });

export const listPages = ({ q = "", module = "", routing = "", refresh = false, limit = 400 } = {}, signal) => {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (module) p.set("module", module);
  if (routing) p.set("routing", routing);
  if (refresh) p.set("refresh", "1");
  p.set("limit", String(limit));
  return call(`/api/pages?${p.toString()}`, { signal });
};

export const getPage = (file, signal) => call(`/api/page?file=${encodeURIComponent(file)}`, { signal });

export const convertPage = (file, signal) => call("/api/convert", { method: "POST", body: { file }, signal });

export const convertBatch = (files, signal) => call("/api/convert/batch", { method: "POST", body: { files }, signal });
