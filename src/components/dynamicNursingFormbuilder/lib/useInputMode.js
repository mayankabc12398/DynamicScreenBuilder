/**
 * The logged-in user's nursing form defaults — set per user:
 *
 *   inputMode  "draw"  scratch: the pencil is on, a touch / drag draws (double-tap still types)
 *              "type"  type: the select tool is on, so nothing is scratched by accident;
 *                      double-tap anywhere on the page to type characters there
 *   textPt     6-96    font size of typed text, pt
 *   markPt     6-96    font size of ✔ / ✘ marks, pt
 *
 * Saved on the API (NursingFormBuilder/UserPrefs, table nf_user_pref) so they
 * follow the user to any computer, and cached in this browser per employee so
 * the form opens right away. Without nf_user_pref on the server they are kept
 * in the browser only.
 */
import { useEffect, useState } from "react";
import { nfSaveUserPrefs, nfUserPrefs } from "../../../networkServices/nursingFormBuilderApi";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { notify } from "../../../utils/utils";

export const INPUT_MODES = [
  { id: "draw", icon: "edit", label: "Scratch", title: "Forms open with the pencil — touch / drag draws" },
  { id: "type", icon: "text", label: "Type", title: "Forms open ready to type — double-tap the page to type, nothing is scratched by accident" },
];

/** The draw-tool patch a form opens with for this mode. */
export const toolForMode = (mode) => ({ tool: mode === "type" ? "select" : "brush" });

const DEFAULTS = { inputMode: "draw", textPt: 10, markPt: 18 };
const pt = (v) => (typeof v === "number" && v >= 6 && v <= 96 ? v : undefined);
/** Only the keys this page knows, each valid — anything else in the stored JSON is ignored. */
const clean = (o) => {
  const out = {};
  if (o?.inputMode === "draw" || o?.inputMode === "type") out.inputMode = o.inputMode;
  if (pt(o?.textPt) !== undefined) out.textPt = o.textPt;
  if (pt(o?.markPt) !== undefined) out.markPt = o.markPt;
  return out;
};

const userId = () => {
  try {
    return String(useLocalStorage("userData", "get")?.employeeID || "");
  } catch {
    return "";
  }
};
const key = () => `nfb-user-prefs:${userId() || "anon"}`;

let current = null; // this user's prefs, once read
let currentFor = "";
let fetched = ""; // the user whose server value has been asked for this page load
const subs = new Set();
const publish = (next) => {
  current = next;
  subs.forEach((f) => f(next));
};

function read() {
  const id = userId();
  if (current && currentFor === id) return current;
  currentFor = id;
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(key()) || "{}");
    // the first release kept only the mode, under its own key
    const old = localStorage.getItem(`nfb-input-mode:${id || "anon"}`);
    if (old && !stored.inputMode) stored.inputMode = old;
  } catch {
    /* private window */
  }
  current = { ...DEFAULTS, ...clean(stored) };
  return current;
}

function remember(p) {
  try {
    localStorage.setItem(key(), JSON.stringify(p));
  } catch {
    /* private window */
  }
}

let sizeTimer = 0;
let sizePatch = {};

/** All of the user's defaults: [prefs, change(patch)]. Mode changes are confirmed; size changes save quietly. */
export function useUserPrefs() {
  const [prefs, setPrefs] = useState(read);

  useEffect(() => {
    subs.add(setPrefs);
    const id = userId();
    if (fetched !== id) {
      fetched = id;
      nfUserPrefs()
        .then((res) => {
          if (!res?.success) return;
          const next = { ...read(), ...clean(res.data) };
          if (JSON.stringify(next) !== JSON.stringify(read())) {
            remember(next);
            publish(next);
          }
        })
        .catch(() => {
          fetched = ""; // ask again next time
        });
    }
    return () => subs.delete(setPrefs);
  }, []);

  const change = (patch) => {
    const p = clean(patch);
    const cur = read();
    if (!Object.keys(p).some((k) => p[k] !== cur[k])) return;
    const next = { ...cur, ...p };
    remember(next);
    publish(next);
    if (p.inputMode && p.inputMode !== cur.inputMode) {
      nfSaveUserPrefs({ inputMode: p.inputMode })
        .then((res) => {
          if (res?.success) notify(`Forms now open in ${p.inputMode === "type" ? "Type" : "Scratch"} mode for you`, "success");
          else notify(res?.message || "Saved in this browser only.", "warn");
        })
        .catch(() => notify("Saved in this browser only — the server could not be reached.", "warn"));
    }
    // sizes: one quiet save once the clicking stops
    const sizes = { ...(p.textPt !== undefined && { textPt: p.textPt }), ...(p.markPt !== undefined && { markPt: p.markPt }) };
    if (Object.keys(sizes).length) {
      sizePatch = { ...sizePatch, ...sizes };
      clearTimeout(sizeTimer);
      sizeTimer = setTimeout(() => {
        const body = sizePatch;
        sizePatch = {};
        nfSaveUserPrefs(body).catch(() => {});
      }, 700);
    }
  };

  return [prefs, change];
}

/** Just the open mode: [mode, setMode]. */
export default function useInputMode() {
  const [prefs, change] = useUserPrefs();
  return [prefs.inputMode, (m) => change({ inputMode: m })];
}
