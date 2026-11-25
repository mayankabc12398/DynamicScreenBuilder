/**
 * Prints a form for one patient through a hidden iframe: each page at its own
 * mm size (@page), the uploaded file as background (unless "data only" for
 * pre-printed stationery), fields with the same markup as on screen, shifted
 * by the form's print calibration. The form's template drawings print with the
 * background (not in "data only"); the patient's own marks always print.
 * formPdf renders the same pages to a PDF data URL instead of printing.
 *
 * printForms / formsPdf do the same for several filled copies at once (the
 * "Completed forms" list: Print all / PDF all) — one print job / one PDF, copy
 * after copy. Each copy may carry a `stamp` — { no, name, lines: [...] } (or a
 * plain string) — printed as a bar along the foot of each of its pages: the
 * copy's number, "Form k of n", who / when, and "Page p / P", the bar's colour
 * alternating copy to copy so the change of form is plain while scrolling.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FieldView from "./FieldView";
import { FIELD_CSS } from "./fieldCss";
import { fieldsOnPage, resolveField } from "../model/form";
import { loadPdf, pageImage } from "../lib/pdf";
import DrawLayer from "../draw/DrawLayer";

export const printForm = (opts) => printForms([opts], opts.title);
export const formPdf = (opts) => formsPdf([opts]);

/** Several copies in one print job. */
export async function printForms(list, title) {
  const { doc } = await formDocument(list, 8, title);
  const w = await loadFrame(doc, "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden");
  await new Promise((resolve) => {
    setTimeout(() => {
      w.focus();
      w.print();
      setTimeout(() => {
        w.frameElement.remove();
        resolve();
      }, 800);
    }, 120);
  });
}

/**
 * The same pages as printForms, as a PDF data URL (each page an image at its
 * own mm size) — the copy kept in the patient's document folder on save, or
 * every completed copy in one file.
 */
export async function formsPdf(list) {
  const { doc, pages } = await formDocument(
    list.map((o) => ({ ...o, mode: "full" })),
    5,
  );
  const widest = Math.max(...pages.map((p) => p.w));
  // laid out at full size off screen: html2canvas needs a rendered box
  const w = await loadFrame(doc, `position:fixed;left:-100000px;top:0;width:${widest}mm;height:${pages[0].h}mm;border:0`);
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const sections = [...w.document.querySelectorAll(".pg")];
    let pdf = null;
    for (let i = 0; i < sections.length; i++) {
      const p = pages[i] || pages[0];
      const orientation = p.w > p.h ? "landscape" : "portrait";
      const canvas = await html2canvas(sections[i], { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true });
      if (!pdf) pdf = new jsPDF({ unit: "mm", format: [p.w, p.h], orientation, compress: true });
      else pdf.addPage([p.w, p.h], orientation);
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, p.w, p.h);
    }
    return pdf.output("datauristring");
  } finally {
    w.frameElement.remove();
  }
}

/** A hidden iframe holding `doc`, resolved once its images have loaded. */
function loadFrame(doc, css) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = css;
  document.body.appendChild(frame);
  const w = frame.contentWindow;
  w.document.open();
  w.document.write(doc);
  w.document.close();
  const imgs = [...w.document.images];
  return Promise.all(imgs.map((im) => (im.complete ? 1 : new Promise((r) => (im.onload = im.onerror = r))))).then(() => w);
}

/** The page backgrounds of one file (PDF pages as images, or the image), drawn once per print. */
async function backgroundsOf(fileUrl, fileType, count, bgPxPerMm) {
  if (!fileUrl) return [];
  if (fileType !== "pdf") return [fileUrl];
  const doc = await loadPdf(fileUrl);
  const out = [];
  for (let i = 1; i <= count; i++) out.push(await pageImage(doc, i, bgPxPerMm));
  return out;
}

/** The <section class="pg"> pages of one filled copy. */
/** The foot bar of one page of one copy (each part its own box: html2canvas drops spaces between runs). */
function stampBar(stamp, { copy, copies, page, pages }) {
  const s = typeof stamp === "string" ? { lines: [stamp] } : stamp || {};
  const tone = copy % 2 ? "b" : "a";
  const lines = (s.lines || []).filter(Boolean).map((t) => `<span class="st-txt">${esc(t)}</span>`).join("");
  // the copy's number on a slanted ribbon across the top-left corner
  const ribbon = s.no
    ? `<div class="ribbon st-${tone}"><span><b>#${esc(s.no)}</b>${copies > 1 ? `<i>Form ${copy + 1} of ${copies}</i>` : ""}</span></div>`
    : "";
  return `${ribbon}<div class="stamp st-${tone}">
    <span class="st-body">${s.name ? `<b class="st-name">${esc(s.name)}</b>` : ""}${lines}</span>
    <span class="st-pg">Page ${page} / ${pages}</span>
  </div>`;
}

function copyPages({ layout, data, values = {}, signatures = {}, marks = [], ctx = {}, stamp = "" }, printMode, backgrounds, at = { copy: 0, copies: 1 }) {
  const pages = layout.pages.length ? layout.pages : [{ w: 210, h: 297 }];
  const { dx = 0, dy = 0 } = layout.calibration || {};
  const html = pages
    .map((p, i) => {
      const n = i + 1;
      const fields = fieldsOnPage(layout.fields, n);
      const markup = renderToStaticMarkup(
        <>
          {printMode === "full" && <DrawLayer items={layout.drawings} page={n} size={p} />}
          {fields.map((f) => (
            <FieldView
              key={f.id}
              f={f}
              mode="print"
              dx={Number(dx) || 0}
              dy={Number(dy) || 0}
              text={resolveField(f, data, { ...ctx, page: n, pages: pages.length })}
              entry={values[f.id]}
              sig={signatures[f.id]}
            />
          ))}
          <DrawLayer items={marks} page={n} size={p} />
        </>,
      );
      const bg = backgrounds[i] ? `<img class="bg" src="${backgrounds[i]}" alt="">` : "";
      const st = stamp ? stampBar(stamp, { ...at, page: n, pages: pages.length }) : "";
      return `<section class="pg" style="width:${p.w}mm;height:${p.h}mm">${bg}${markup}${st}</section>`;
    })
    .join("");
  return { html, pages };
}

/**
 * The print document for one copy or several: one <section class="pg"> per page, copy after
 * copy. bgPxPerMm = PDF background resolution; copies of the same file share its backgrounds.
 */
async function formDocument(input, bgPxPerMm, title) {
  const list = Array.isArray(input) ? input : [input];
  const cache = new Map();
  let html = "";
  const all = [];
  for (const [k, o] of list.entries()) {
    const printMode = o.mode || o.layout.printMode || "full";
    const pages = o.layout.pages.length ? o.layout.pages : [{ w: 210, h: 297 }];
    let backgrounds = [];
    if (printMode === "full" && o.fileUrl) {
      const key = `${o.fileUrl}|${o.fileType}|${pages.length}`;
      if (!cache.has(key)) cache.set(key, backgroundsOf(o.fileUrl, o.fileType, pages.length, bgPxPerMm));
      backgrounds = await cache.get(key);
    }
    const part = copyPages(o, printMode, backgrounds, { copy: k, copies: list.length });
    html += part.html;
    all.push(...part.pages);
  }

  const first = all[0] || { w: 210, h: 297 };
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || list[0]?.title || "Nursing form")}</title><style>
@page{size:${first.w}mm ${first.h}mm;margin:0}
html,body{margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{position:relative;overflow:hidden;page-break-after:always;break-after:page}
.pg:last-child{page-break-after:auto;break-after:auto}
.pg .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
.pg .stamp{position:absolute;left:5mm;right:5mm;bottom:1.5mm;z-index:20;display:flex;align-items:center;gap:2mm;padding:0.9mm 1.2mm;border-radius:1mm;font:8pt/1.2 Arial,Helvetica,sans-serif;color:#1e293b;background:#fff;border:0.3mm solid var(--st);border-left-width:1.6mm;white-space:nowrap}
.pg .st-a{--st:#4f46e5;--st2:#7c3aed;--st-soft:#eef2ff}
.pg .st-b{--st:#0f766e;--st2:#0d9488;--st-soft:#ecfdf5}
.pg .ribbon{position:absolute;top:0;left:0;width:23mm;height:23mm;overflow:hidden;z-index:21;pointer-events:none}
.pg .ribbon span{position:absolute;top:3mm;left:-10mm;width:38mm;padding:1.1mm 0 1.2mm;transform:rotate(-45deg);display:flex;flex-direction:column;align-items:center;gap:0.3mm;background:linear-gradient(90deg,var(--st),var(--st2));color:#fff;font-family:Arial,Helvetica,sans-serif;text-align:center;box-shadow:0 0.6mm 1.6mm rgba(15,23,42,.35);border-top:0.3mm solid rgba(255,255,255,.55);border-bottom:0.3mm solid rgba(255,255,255,.55)}
.pg .ribbon b{display:block;font-size:11pt;line-height:1;font-weight:800;letter-spacing:0.3mm}
.pg .ribbon i{display:block;font-style:normal;font-size:6.5pt;line-height:1;font-weight:700;text-transform:uppercase;letter-spacing:0.2mm;opacity:.92}
.pg .stamp span,.pg .stamp b{display:inline-block}
.pg .stamp .st-body{flex:1;min-width:0;display:flex;gap:2.2mm;overflow:hidden}
.pg .st-name{flex:none;font-weight:700}
.pg .st-txt{flex:none;color:#475569}
.pg .st-pg{flex:none;padding:0.4mm 1.6mm;border-radius:0.8mm;background:var(--st-soft);color:var(--st);font-weight:700;font-size:8.5pt}
${FIELD_CSS}
</style></head><body>${html}</body></html>`;
  return { doc, pages: all };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
