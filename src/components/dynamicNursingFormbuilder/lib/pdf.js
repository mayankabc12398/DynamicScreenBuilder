/**
 * PDF and image helpers (pdf.js loads on first use, like the print builder's
 * pdfTools.js — forked so the two builders never depend on each other):
 *
 *   loadPdf(src)            a pdf.js document for a URL or bytes (cached per URL)
 *   pageSizesMm(doc)        [{ w, h }] in mm, one per page
 *   renderPage(...)         draw one page into a canvas at a pixel scale
 *   pageImage(...)          one page as a PNG data URL (for printing)
 *   textLines(doc, page)    the page's words grouped into lines, in mm — for auto-place
 *   imageSizeMm(url)        an uploaded image as a page: A4 width (landscape when wider than tall)
 */
/*
 * The LEGACY build of pdf.js: the modern one (v6) needs a very recent browser, and
 * on a tablet with an older Chrome / WebView its worker failed to start and never
 * answered — the form opened with a blank page and no error. The legacy build is
 * the same library compiled for older browsers; desktop draws exactly the same.
 */
let lib = null;
async function pdfjs() {
  if (lib) return lib;
  const m = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const W = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker")).default;
  m.GlobalWorkerOptions.workerPort = new W();
  lib = m;
  return m;
}

/** Starts loading pdf.js (library + worker) ahead of the first page — a screen calls it on mount. */
export const warmPdf = () => {
  pdfjs().catch(() => {});
};

/** A PDF step that never answers (worker not starting, stalled download) fails with a message instead of hanging. */
const LOAD_TIMEOUT_MS = 30000;
const timed = (p, what) =>
  Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error(`${what} took too long — check the connection and reopen the form.`)), LOAD_TIMEOUT_MS))]);

const PT_TO_MM = 25.4 / 72;
const docs = new Map();

export async function loadPdf(src) {
  const key = typeof src === "string" ? src : null;
  if (key && docs.has(key)) return docs.get(key);
  const p = (async () => {
    const m = await timed(pdfjs(), "Loading the PDF viewer");
    let data = src;
    if (typeof src === "string") {
      const res = await timed(fetch(src), "Downloading the form");
      if (!res.ok) throw new Error(`The file could not be downloaded (${res.status}).`);
      data = new Uint8Array(await res.arrayBuffer());
    }
    return timed(m.getDocument({ data }).promise, "Opening the PDF");
  })();
  if (key) {
    docs.set(key, p);
    p.catch(() => docs.delete(key));
  }
  return p;
}

export async function pageSizesMm(doc) {
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    out.push({ w: round(vp.width * PT_TO_MM), h: round(vp.height * PT_TO_MM) });
  }
  return out;
}

/**
 * Draws page `pageNo` into `canvas` with `pxPerMm` backing pixels per mm. The
 * canvas is sized by CSS (100% of its page box), so a page drawn at
 * zoom × devicePixelRatio stays sharp inside a CSS-scaled page.
 * Returns the pdf.js render task (call .cancel() when the canvas goes away).
 */
export async function renderPage(doc, pageNo, canvas, pxPerMm, maxPixels = Infinity) {
  const page = await doc.getPage(pageNo);
  const base = page.getViewport({ scale: 1 });
  // a canvas past maxPixels costs memory and time without looking sharper on screen
  const scale = Math.min((pxPerMm * 72) / 25.4, Math.sqrt(maxPixels / Math.max(1, base.width * base.height)));
  const vp = page.getViewport({ scale });
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  return page.render({ canvasContext: canvas.getContext("2d"), viewport: vp, canvas });
}

export async function pageImage(doc, pageNo, pxPerMm = 8) {
  const canvas = document.createElement("canvas");
  const page = await doc.getPage(pageNo);
  const vp = page.getViewport({ scale: (pxPerMm * 72) / 25.4 });
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp, canvas }).promise;
  return canvas.toDataURL("image/png");
}

/** Words on a page joined into lines: [{ text, x, y, w, h, items: [{ str, x, y, w, h }] }] in mm. */
export async function textLines(doc, pageNo) {
  const m = await pdfjs();
  const page = await doc.getPage(pageNo);
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const items = [];
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const t = m.Util.transform(vp.transform, it.transform);
    const h = Math.hypot(t[2], t[3]) || 8;
    items.push({ str: it.str, x: t[4] * PT_TO_MM, y: (t[5] - h) * PT_TO_MM, w: (it.width || 0) * PT_TO_MM, h: h * PT_TO_MM });
  }
  items.sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const it of items) {
    const line = lines.find((l) => Math.abs(l.y - it.y) < Math.max(1, it.h * 0.45));
    if (line) line.items.push(it);
    else lines.push({ y: it.y, items: [it] });
  }
  return lines.map((l) => {
    l.items.sort((a, b) => a.x - b.x);
    const x = l.items[0].x;
    const right = Math.max(...l.items.map((i) => i.x + i.w));
    return { text: l.items.map((i) => i.str).join(" "), x, y: l.y, w: right - x, h: Math.max(...l.items.map((i) => i.h)), items: l.items };
  });
}

export function imageSizeMm(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const W = w > h ? 297 : 210;
      resolve({ w: W, h: round((W * h) / Math.max(1, w)) });
    };
    img.onerror = () => reject(new Error("The image could not be loaded."));
    img.src = url;
  });
}

export const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const round = (n) => Math.round(n * 10) / 10;
