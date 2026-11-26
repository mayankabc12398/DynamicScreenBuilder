/**
 * The engine as the builder uses it: the module for the canvas, plus its own
 * source text for the preview iframe — the same text the API prints with
 * (sync-to-api.mjs copies it), so the preview is the PDF.
 */
import qrcode from "qrcode-generator";
import engineSource from "./printEngine.js?raw";
import vendorSource from "./vendor/qrcode.js?raw";
import { ENGINE_CSS, buildShell, fontFaceCss } from "./printEngine.js";

// The canvas draws QR codes with the same library the shell vendors.
if (typeof globalThis !== "undefined" && !globalThis.qrcode) globalThis.qrcode = qrcode;

const fontUrls = import.meta.glob("./fonts/*.woff2", { eager: true, query: "?url", import: "default" });
const absolute = (u) => (u && typeof window !== "undefined" ? new URL(u, window.location.href).href : u);

/** @font-face rules pointing at the bundled font files. */
export const fontCss = fontFaceCss((f) => absolute(fontUrls[`./fonts/${f}`]));

/** Engine CSS + fonts in the builder's own page, for the canvas. Idempotent. */
export function installDesignStyles(doc = document) {
  if (!doc.getElementById("pb-engine-css")) {
    const st = doc.createElement("style");
    st.id = "pb-engine-css";
    st.textContent = ENGINE_CSS;
    doc.head.appendChild(st);
  }
  if (!doc.getElementById("pb-font-css")) {
    const st = doc.createElement("style");
    st.id = "pb-font-css";
    st.textContent = fontCss;
    doc.head.appendChild(st);
  }
}

/** The full print document (what the server prints), for an iframe srcdoc. */
export function previewHtml(template, data, options = {}) {
  return buildShell({
    engineSource,
    vendorSource,
    fontCss,
    template,
    data,
    options: { screen: true, ...options },
    title: "Preview",
  });
}

let sheet = null;
/**
 * ENGINE_CSS as one constructable stylesheet, adopted by every canvas element's
 * shadow root: the app's global CSS (table, td, p…) cannot reach inside, so the
 * canvas draws exactly what the print document draws.
 */
export function engineSheet() {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(ENGINE_CSS);
  }
  return sheet;
}

let hashPromise = null;
/** SHA-256 of the engine text, line endings normalised — compared with PrintBuilder/EngineInfo. */
export function engineHash() {
  if (!hashPromise) {
    hashPromise = (async () => {
      try {
        const bytes = new TextEncoder().encode(engineSource.replace(/\r\n/g, "\n"));
        const buf = await crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } catch {
        return null;
      }
    })();
  }
  return hashPromise;
}
