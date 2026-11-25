/**
 * Speech to text for the patient form (NursingFormRender): with the mic on, whatever text box
 * gets the caret inside `rootRef` — the double-click caret on the page (DrawSurface TextEditor)
 * or a fill-in field — is written into as the nurse speaks. Words already settled go in at the
 * caret (as if typed: React's onChange fires, Ctrl+Z undoes); the words still being heard show
 * in a small bubble under the box. Leaving the box stops listening; the next box starts again.
 *
 * Uses the browser's own speech recognition (Chrome / Edge / Android Chrome / Safari 14.5+),
 * which needs https (or localhost) and the microphone permission.
 * Spoken punctuation: "full stop", "comma", "question mark", "colon", "new line", "next line".
 */
import { useCallback, useEffect, useRef, useState } from "react";

// Brave ships the API but not the speech service behind it: every attempt fails with "network"
const isBrave = typeof navigator !== "undefined" && !!navigator.brave;
const SR = typeof window !== "undefined" && !isBrave ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const dictationSupported = !!SR;
const UNSUPPORTED = isBrave
  ? "Speech to text does not work in Brave (it has no speech service). Open this page in Google Chrome or Microsoft Edge."
  : "Speech to text is not available in this browser. Use Google Chrome or Microsoft Edge.";

const LANG_KEY = "nfb-dictate-lang";
export const DICTATE_LANGS = [
  { code: "en-IN", short: "EN", label: "English (India)" },
  { code: "hi-IN", short: "हि", label: "Hindi" },
];
const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

const SPOKEN = [
  [/\s*\b(full stop|period)\b/gi, "."],
  [/\s*\bcomma\b/gi, ","],
  [/\s*\bquestion mark\b/gi, "?"],
  [/\s*\bcolon\b/gi, ":"],
  [/\s*\b(new line|next line)\b\s*/gi, "\n"],
];

/** Spoken punctuation → marks; sentence-case after a full stop / at the start of the box. */
function shape(text, before) {
  let t = text;
  for (const [re, to] of SPOKEN) t = t.replace(re, to);
  // trim spaces only: a spoken "new line" at either end must stay
  t = t.replace(/[ \t]+/g, " ").replace(/ ([.,?:])/g, "$1").replace(/ ?\n ?/g, "\n").replace(/^[ \t]+|[ \t]+$/g, "");
  if (!t) return "";
  const prev = before.replace(/[ \t]+$/, "");
  const startOfSentence = !prev || /[.?!\n]$/.test(prev);
  if (startOfSentence) t = t[0].toUpperCase() + t.slice(1);
  t = t.replace(/([.?!]\s+|\n)([a-z])/g, (_, a, b) => a + b.toUpperCase());
  // a space between the words already there and the new ones (not before punctuation)
  const needSpace = before && !/\s$/.test(before) && !/^[.,?:\n]/.test(t);
  return (needSpace ? " " : "") + t;
}

const isTextBox = (el) =>
  !!el && !el.readOnly && !el.disabled && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search|)$/i.test(el.type || "")));

/** Types `text` at the caret of `el` the way a keyboard would (React sees an input event). */
function typeInto(el, text) {
  el.focus();
  // execCommand keeps the browser's undo stack and fires a real input event
  if (document.execCommand && document.execCommand("insertText", false, text)) return;
  const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  const s = el.selectionStart ?? el.value.length;
  const e = el.selectionEnd ?? el.value.length;
  setter.call(el, el.value.slice(0, s) + text + el.value.slice(e));
  el.setSelectionRange(s + text.length, s + text.length);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export default function useDictation(rootRef, notify) {
  const [on, setOn] = useState(false);
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || "en-IN";
    } catch {
      return "en-IN";
    }
  });
  const [heard, setHeard] = useState(null); // { text, box } — words still being heard, under the box
  const [listening, setListening] = useState(false);
  const rec = useRef(null);
  const target = useRef(null);
  const onRef = useRef(on);
  onRef.current = on;

  const stop = useCallback(() => {
    const r = rec.current;
    rec.current = null;
    target.current = null;
    setHeard(null);
    setListening(false);
    if (r) {
      r.onend = r.onresult = r.onerror = null;
      try {
        r.abort();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const fails = useRef(0);
  const heardAny = useRef(false); // the speech service has answered at least once on this page
  const startRef = useRef(null);
  const start = useCallback(
    (el, again = false) => {
      if (!SR) return;
      if (!again && rec.current && target.current === el) return;
      stop();
      target.current = el;
      if (!again) fails.current = 0;
      let pending = ""; // words heard but not yet settled when the session ends — typed, not lost
      const r = new SR();
      r.lang = lang;
      r.interimResults = true;
      r.maxAlternatives = 1;
      // Android Chrome repeats earlier words in continuous mode: listen phrase by phrase there
      r.continuous = !isAndroid;
      r.onstart = () => setListening(true);
      r.onresult = (ev) => {
        const el2 = target.current;
        if (!el2) return;
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          const said = res[0]?.transcript || "";
          if (res.isFinal) {
            heardAny.current = true;
            fails.current = 0;
            const before = el2.value.slice(0, el2.selectionStart ?? el2.value.length);
            const text = shape(said, before);
            if (text) typeInto(el2, text);
          } else interim += said;
        }
        pending = interim;
        const b = el2.getBoundingClientRect();
        setHeard(interim.trim() ? { text: interim.trim(), x: b.left, y: b.bottom } : null);
      };
      r.onerror = (ev) => {
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
          notify?.(
            window.isSecureContext ? "Microphone is blocked for this site. Allow it in the browser's site settings." : "Speech to text needs the site on https (or localhost).",
            "warn",
          );
          setOn(false);
          stop();
        } else if (ev.error === "audio-capture") {
          notify?.("No microphone found.", "warn");
          setOn(false);
          stop();
        } else if (ev.error === "network") {
          // a blip during a long dictation: onend starts a fresh session (a few tries)
          if (heardAny.current && ++fails.current <= 5) return;
          // never worked here: no speech service behind this browser (Brave and the like)
          notify?.(
            navigator.onLine === false
              ? "Speech to text needs an internet connection."
              : "This browser's speech service is not available. Use Google Chrome or Microsoft Edge for speech to text.",
            "warn",
          );
          setOn(false);
          stop();
        } else if (ev.error !== "no-speech" && ev.error !== "aborted") {
          notify?.(`Speech to text stopped (${ev.error}).`, "warn");
          setOn(false);
          stop();
        }
        // "no-speech" / "aborted": onend restarts while the box still has the caret
      };
      r.onend = () => {
        setHeard(null);
        if (rec.current !== r) return;
        // the session was cut mid-phrase: keep those words
        if (pending.trim() && el.isConnected) {
          const before = el.value.slice(0, el.selectionStart ?? el.value.length);
          const text = shape(pending, before);
          if (text) typeInto(el, text);
        }
        pending = "";
        // the browser ends a session after a pause, ~60 s, or a network blip; keep listening
        // with a fresh session while the caret is still in the box (or the window just lost focus)
        const keep = onRef.current && el.isConnected && (document.activeElement === el || !document.hasFocus());
        if (keep) {
          setTimeout(() => {
            if (rec.current === r && onRef.current) startRef.current(el, true);
          }, 150);
          return;
        }
        rec.current = null;
        setListening(false);
      };
      rec.current = r;
      try {
        r.start();
      } catch {
        rec.current = null;
      }
    },
    [lang, stop, notify],
  );
  startRef.current = start;

  // listen while a text box inside the form has the caret
  useEffect(() => {
    if (!on) {
      stop();
      return undefined;
    }
    const root = rootRef.current;
    const inside = (el) => root && root.contains(el) && isTextBox(el);
    const focusIn = (e) => inside(e.target) && start(e.target);
    const focusOut = (e) => {
      if (e.target !== target.current) return;
      // the caret moving to another box restarts there (focusin); otherwise stop
      setTimeout(() => {
        if (target.current === e.target && document.activeElement !== e.target) stop();
      }, 0);
    };
    document.addEventListener("focusin", focusIn, true);
    document.addEventListener("focusout", focusOut, true);
    if (inside(document.activeElement)) start(document.activeElement);
    return () => {
      document.removeEventListener("focusin", focusIn, true);
      document.removeEventListener("focusout", focusOut, true);
      stop();
    };
  }, [on, rootRef, start, stop]);

  useEffect(() => stop, [stop]);

  const toggle = useCallback(() => {
    if (!SR) {
      notify?.(UNSUPPORTED, "warn");
      return;
    }
    setOn((v) => !v);
  }, [notify]);

  const cycleLang = useCallback(() => {
    setLangState((cur) => {
      const i = DICTATE_LANGS.findIndex((l) => l.code === cur);
      const next = DICTATE_LANGS[(i + 1) % DICTATE_LANGS.length].code;
      try {
        localStorage.setItem(LANG_KEY, next);
      } catch {
        /* private window */
      }
      return next;
    });
  }, []);

  return { supported: !!SR, why: SR ? "" : UNSUPPORTED, on, toggle, lang, cycleLang, listening, heard };
}
