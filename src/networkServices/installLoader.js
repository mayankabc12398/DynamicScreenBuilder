import { start, done } from "./loaderStore";

/**
 * Attach request/response interceptors to an existing axios instance so EVERY
 * call through it drives the global loader counter automatically — no call-site
 * changes. Decrements on success, error AND cancel (axios rejects on abort).
 *
 * Opt-out per request: pass `{ meta: { silent: true } }` on the request config
 * (e.g. polling, autosave, typeahead, token refresh). Existing calls have no
 * `meta`, so they are counted by default and remain unchanged.
 *
 * Idempotent — guarded against double-install (HMR / multiple imports).
 */
export function installLoader(api) {
  if (!api || api.__loaderInstalled) return api;
  api.__loaderInstalled = true;

  api.interceptors.request.use(
    (cfg) => {
      if (!cfg?.meta?.silent) {
        cfg.__counted = true;
        start();
      }
      return cfg;
    },
    (err) => Promise.reject(err)
  );

  const end = (resOrErr) => {
    const cfg = resOrErr?.config || resOrErr?.response?.config;
    if (cfg?.__counted) done();
  };

  api.interceptors.response.use(
    (res) => {
      end(res);
      return res;
    },
    (err) => {
      end(err); // MUST decrement on error/cancel too, then re-reject
      return Promise.reject(err);
    }
  );

  return api;
}

export default installLoader;
