import makeApiRequest from "../networkServices/axiosInstance";
import { apiUrls } from "../networkServices/apiEndpoints";
import { notify } from "./utils";

/**
 * DPDP Act runtime hooks (4 Nov 2026). Installed once from index.jsx; every hook fails open.
 *
 *  1. AI calls - every browser AI call (central proxy AI/Generate, or generativelanguage.googleapis.com) has the patient's name (when labelled),
 *     UHID / IP number (when labelled), mobile, e-mail, Aadhaar and ABHA replaced with [[Xn]] tokens; the tokens are
 *     put back into the answer, so the screens see the same result as before. One disclosure row per call is logged.
 *  2. Access log - API calls that carry a PatientID / UHID / MRNo are batched as "user opened UHID x on screen y"
 *     (DPDP Rule 6(1)(c)); opening a restricted record shows a warning once (never blocks).
 *  3. Exports - dpdpLogExport() is called by the Excel export helpers.
 *
 * Nothing happens until the DPDP tables are installed and the module is switched on (Dpdp/Config).
 */

let config = null;
let configPromise = null;
let configCheckedAt = 0;

const loggedIn = () => {
  try {
    return !!localStorage.getItem("token");
  } catch {
    return false;
  }
};

const dpdpConfig = async (force = false) => {
  if (!loggedIn()) return null;
  if (!force && config && Date.now() - configCheckedAt < 30 * 60 * 1000) return config;
  if (configPromise) return configPromise;
  configPromise = makeApiRequest(apiUrls.DpdpConfig, { method: "get" })
    .then((r) => {
      config = r?.success ? r.data : { installed: false };
      configCheckedAt = Date.now();
      return config;
    })
    .catch(() => {
      config = { installed: false };
      configCheckedAt = Date.now();
      return config;
    })
    .finally(() => {
      configPromise = null;
    });
  return configPromise;
};

const active = (c) => !!(c && c.installed && c.enabled);








const seen = new Map(); // key -> time
const warned = new Set();
let pending = [];
let accessTimer = null;
let accessOff = false;

const looksLikeUhid = (v) => typeof v === "string" ? /^[A-Za-z0-9/\-]{3,30}$/.test(v.trim()) && /\d/.test(v) : typeof v === "number" && v > 0;


const queueAccess = (uhid, action = "VIEW", detail) => {
  const screen = window.location.pathname;
  const key = `${uhid}|${screen}|${action}`;
  const last = seen.get(key);
  if (last && Date.now() - last < 10 * 60 * 1000) return;
  seen.set(key, Date.now());
  pending.push({ UHID: uhid, Screen: screen, Action: action, Detail: detail });
  if (!accessTimer) accessTimer = setTimeout(flushAccess, 8000);
};

const flushAccess = async () => {
  accessTimer = null;
  if (!pending.length) return;
  const items = pending.splice(0, 200);
  try {
    const c = await dpdpConfig();
    if (!active(c) || !c.accessLog) {
      accessOff = true;
      return;
    }
    const r = await makeApiRequest(apiUrls.DpdpAccessBatch, { method: "post", data: { Items: items } });
    if (r?.success && r.data?.enabled === false) accessOff = true;
    (r?.data?.restricted || []).forEach((u) => {
      if (warned.has(u)) return;
      warned.add(u);
      notify(`Restricted record (${u}): open it only if you are treating this patient. Your access is logged.`, "warn");
    });
  } catch {
    /* ignore */
  }
  if (pending.length) accessTimer = setTimeout(flushAccess, 8000);
};


/* ------------------------------------------------------------------ 3. exports */

/** Called by the Excel export helpers: one EXPORT row per patient in the file (first 500). */
export const dpdpLogExport = (rows, name) => {
  try {
    if (accessOff || !Array.isArray(rows) || !rows.length) return;
    const ids = new Set();
    rows.slice(0, 5000).forEach((r) => {
      if (ids.size >= 500 || !r || typeof r !== "object") return;
      for (const [k, v] of Object.entries(r)) if (/^(patientid|uhid|mrno|uhid no|uhid no\.|mr no\.?)$/i.test(k.trim()) && looksLikeUhid(v)) ids.add(String(v).trim());
    });
    ids.forEach((u) => queueAccess(u, "EXPORT", `Excel: ${String(name || "").slice(0, 150)}`));
  } catch {
    /* ignore */
  }
};


