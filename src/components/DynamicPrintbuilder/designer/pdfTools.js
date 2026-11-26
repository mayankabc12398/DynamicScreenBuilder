/**
 * PDF helpers for the builder (pdf.js, loaded on first use):
 *   pdfText    every word a PDF prints, page by page — for comparing with the old print
 *   pdfImage   one page as a PNG data URL — for the "overlay the old print" guide
 *   fetchPdf   the bytes behind a pdfUrl the API returned (RenderPdf is anonymous)
 *   wordDiff   which words one text has that the other has not (in order)
 */
import { APIBaseURL } from "../../../networkServices/axiosInstance";

let lib = null;
async function pdfjs() {
  if (lib) return lib;
  const m = await import("pdfjs-dist");
  const W = (await import("pdfjs-dist/build/pdf.worker.min.mjs?worker")).default;
  m.GlobalWorkerOptions.workerPort = new W();
  lib = m;
  return m;
}

export const absoluteUrl = (url) => (/^https?:/i.test(url || "") ? url : `${APIBaseURL}/${String(url || "").replace(/^\//, "")}`);

export async function fetchPdf(url) {
  const res = await fetch(absoluteUrl(url));
  if (!res.ok) throw new Error(`PDF download failed (${res.status})`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (String.fromCharCode(...buf.slice(0, 4)) !== "%PDF") throw new Error("The answer is not a PDF (the server returned an error page)");
  return buf;
}

export async function pdfText(bytes) {
  const m = await pdfjs();
  const doc = await m.getDocument({ data: bytes.slice() }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    pages.push(tc.items.map((it) => it.str).join(" "));
  }
  return pages;
}

export async function pdfImage(bytes, pageNo = 1, scale = 2) {
  const m = await pdfjs();
  const doc = await m.getDocument({ data: bytes.slice() }).promise;
  const page = await doc.getPage(Math.min(Math.max(1, pageNo), doc.numPages));
  const vp = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
  return { dataUrl: canvas.toDataURL("image/png"), pages: doc.numPages, widthMm: (vp.width / scale / 72) * 25.4 };
}

/** Words normalised for comparing prints: case, punctuation-only tokens and number grouping ignored. */
export const words = (text) =>
  String(text || "")
    .replace(/ /g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w₹$]+|[^\w%]+$/g, "").toLowerCase())
    .filter(Boolean)
    .map((w) => (/^[\d,]+(\.\d+)?$/.test(w) ? w.replace(/,/g, "") : w));

/**
 * Differences between two word lists (LCS on up to 2500 words each):
 * { same, missing: words only in a (old print), extra: words only in b (new) }.
 */
export function wordDiff(a, b) {
  const A = a.slice(0, 2500);
  const B = b.slice(0, 2500);
  const n = A.length;
  const m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const missing = [];
  const extra = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) missing.push(A[i++]);
    else extra.push(B[j++]);
  }
  while (i < n) missing.push(A[i++]);
  while (j < m) extra.push(B[j++]);
  return { same: !missing.length && !extra.length, missing, extra, common: dp[0][0] };
}
