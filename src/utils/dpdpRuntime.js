import makeApiRequest, { axiosInstance } from "../networkServices/axiosInstance";
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

export const dpdpConfig = async (force = false) => {
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

/* ------------------------------------------------------------------ 1. AI pseudonymisation */

const PATTERNS = [
  ["EMAIL", /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ["ABHA", /(?<!\d)\d{2}-\d{4}-\d{4}-\d{4}(?!\d)/g],
  ["AADHAAR", /(?<!\d)[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g],
  ["PHONE", /(?<![\d.])(?:\+?91[\s-]?)?[6-9]\d{9}(?![\d.])/g],
];
const NAME_LABEL =
  /\b(Patient(?:'s)?\s*Name|Name\s+of\s+(?:the\s+)?Patient|Pt\.?\s*Name|Patient)\s*[:\-=]\s*((?:(?:Mr|Mrs|Ms|Miss|Master|Baby|B\/O|Dr|Smt|Shri)\.?\s+)?[A-Za-z][A-Za-z.' ]{1,58}?)(?=\s*(?:[\n\r,;|(]|\bAge\b|\bSex\b|\bGender\b|\bUHID\b|\bMRN\b|"|$))/gi;
const NAME_SPOKEN = /\b(?:my name is|patient name is|name is|mera naam)\s+([A-Za-z][A-Za-z.' ]{1,40}?)(?=\s+(?:and|mobile|phone|age|aged|from|hai|is)\b|\s*[,.;\n"]|\s*\d|$)/gi;
const TITLE = /^(?:(?:Mr|Mrs|Ms|Miss|Master|Baby|B\/O|Dr|Smt|Shri)\.?\s+)+/i;
const ID_LABEL = /\b(UHID|MRN|MR\s*No\.?|Patient\s*ID|IPD\s*No\.?|IP\s*No\.?|Reg(?:istration)?\s*No\.?)\s*[:#\-=]?\s*([A-Z0-9][A-Z0-9/\-]{3,29})/gi;

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const pseudonymise = (text, map) => {
  if (typeof text !== "string" || !text) return text;
  const token = (tag, value) => {
    for (const [k, v] of map) if (v === value) return k;
    const t = `[[${tag}${map.size + 1}]]`;
    map.set(t, value);
    return t;
  };
  // labelled names and IDs first, then every other occurrence of the same value
  const found = [];
  text.replace(NAME_LABEL, (m, _l, name) => {
    const n = name.trim();
    if (n.length >= 3 && !/^(male|female|other|na|n\/a|unknown)$/i.test(n)) {
      found.push(["NAME", n]);
      const bare = n.replace(TITLE, "").trim(); // "Mr. Rakesh Sharma" also hides a later "Rakesh Sharma"
      if (bare !== n && bare.length >= 3) found.push(["NAME", bare]);
    }
    return m;
  });
  text.replace(NAME_SPOKEN, (m, name) => {
    const n = name.trim();
    if (n.length >= 3) found.push(["NAME", n]);
    return m;
  });
  text.replace(ID_LABEL, (m, _l, id) => {
    if (/\d/.test(id)) found.push(["ID", id.trim()]);
    return m;
  });
  found
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([tag, v]) => {
      text = text.replace(new RegExp(`(?<![A-Za-z0-9])${escapeRx(v)}(?![A-Za-z0-9])`, "gi"), (m) => token(tag, m));
    });
  for (const [tag, rx] of PATTERNS) text = text.replace(rx, (m) => token(tag, m));
  return text;
};

export const restore = (text, map) => {
  if (typeof text !== "string" || !map.size) return text;
  for (const [k, v] of map) {
    const inner = escapeRx(k.slice(2, -2));
    text = text.replace(new RegExp(`\\[\\[\\s*${inner}\\s*\\]\\]`, "g"), () => v);
  }
  return text;
};

const walkParts = (body, fn) => {
  let media = false;
  const doParts = (parts) =>
    Array.isArray(parts) &&
    parts.forEach((p) => {
      if (p && typeof p.text === "string") p.text = fn(p.text);
      if (p && (p.inlineData || p.inline_data || p.fileData || p.file_data)) media = true;
    });
  (body?.contents || []).forEach((c) => doParts(c?.parts));
  doParts(body?.systemInstruction?.parts || body?.system_instruction?.parts);
  return media;
};

let aiQueue = { calls: 0, tokens: 0, media: false, screen: "" };
let aiTimer = null;
const flushAi = () => {
  aiTimer = null;
  const q = aiQueue;
  aiQueue = { calls: 0, tokens: 0, media: false, screen: "" };
  if (!q.calls) return;
  makeApiRequest(apiUrls.DpdpAiLog, { method: "post", data: { Screen: q.screen, Tokens: q.tokens, HasMedia: q.media, Calls: q.calls } }).catch(() => {});
};

const installFetchGuard = () => {
  if (typeof window === "undefined" || window.__dpdpFetch) return;
  const original = window.fetch.bind(window);
  window.__dpdpFetch = original;
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    // central AI proxy (utils/aiClient.js) or a direct Gemini call
    const isAi = url.includes("generativelanguage.googleapis.com") || /\/AI\/Generate(\?|$)/.test(url);
    if (!isAi || !init || typeof init.body !== "string") return original(input, init);
    let map;
    let sendInit = init;
    try {
      const c = await dpdpConfig();
      if (!active(c) || !c.aiPseudonymise) return original(input, init);
      const body = JSON.parse(init.body);
      map = new Map();
      const media = walkParts(body, (t) => pseudonymise(t, map));
      sendInit = { ...init, body: JSON.stringify(body) };
      aiQueue.calls += 1;
      aiQueue.tokens += map.size;
      aiQueue.media = aiQueue.media || media;
      aiQueue.screen = window.location.pathname;
      if (!aiTimer) aiTimer = setTimeout(flushAi, 5000);
    } catch {
      return original(input, init);
    }
    const resp = await original(input, sendInit);
    if (!map || !map.size || url.includes("stream")) return resp;
    try {
      const data = await resp.clone().json();
      (data?.candidates || []).forEach((cand) => (cand?.content?.parts || []).forEach((p) => p && typeof p.text === "string" && (p.text = restore(p.text, map))));
      return new Response(JSON.stringify(data), { status: resp.status, statusText: resp.statusText, headers: resp.headers });
    } catch {
      return resp;
    }
  };
};

/* ------------------------------------------------------------------ 2. access log */

const KEYS = /^(patientid|patient_id|uhid|mrno|mr_no|patientuhid|pid)$/i;
const seen = new Map(); // key -> time
const warned = new Set();
let pending = [];
let accessTimer = null;
let accessOff = false;

const looksLikeUhid = (v) => typeof v === "string" ? /^[A-Za-z0-9/\-]{3,30}$/.test(v.trim()) && /\d/.test(v) : typeof v === "number" && v > 0;

const collect = (obj, out, depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 2) return;
  for (const [k, v] of Object.entries(obj)) {
    if (KEYS.test(k) && looksLikeUhid(v)) out.add(String(v).trim());
    else if (v && typeof v === "object" && !Array.isArray(v)) collect(v, out, depth + 1);
  }
};

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

const watchRequest = (cfg) => {
  try {
    if (accessOff || !loggedIn()) return cfg;
    const url = cfg?.url || "";
    if (/^\/?Dpdp/i.test(url) || /\/Dpdp(Public)?\//i.test(url)) return cfg;
    const ids = new Set();
    const q = url.split("?")[1];
    if (q) new URLSearchParams(q).forEach((v, k) => KEYS.test(k) && looksLikeUhid(v) && ids.add(v.trim()));
    collect(cfg?.params, ids);
    let data = cfg?.data;
    if (typeof data === "string" && data.length < 200000 && data.trim().startsWith("{")) {
      try {
        data = JSON.parse(data);
      } catch {
        data = null;
      }
    }
    if (data && typeof data === "object" && !(data instanceof FormData)) collect(data, ids);
    const action = /print|pdf|report/i.test(url) ? "PRINT" : "VIEW";
    ids.forEach((u) => queueAccess(u, action, url.split("?")[0].slice(0, 200)));
  } catch {
    /* never block a request */
  }
  return cfg;
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

/** For screens that know they show a patient (e.g. registration panel). */
export const dpdpLogView = (uhid, detail) => {
  if (!accessOff && looksLikeUhid(uhid)) queueAccess(String(uhid).trim(), "VIEW", detail);
};

export const installDpdpRuntime = () => {
  try {
    installFetchGuard();
    axiosInstance.interceptors.request.use(watchRequest);
    window.addEventListener("beforeunload", () => {
      if (pending.length) flushAccess();
    });
  } catch {
    /* the app must start even if this fails */
  }
};
