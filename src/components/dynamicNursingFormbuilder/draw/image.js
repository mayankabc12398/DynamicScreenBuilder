/**
 * Image marks — a picture placed on a page like a shape:
 *
 *   { id, page, kind: "image", x, y, w, h, src }      (box in mm)
 *
 * The picture is shrunk in the browser (longest side 1600 px) and kept in the
 * mark itself as a data URL (no upload, no nf_file row): it travels with the
 * layout / the patient entry and prints without a fetch. Marks made before
 * carry a fileKey instead and still load through File?key= (DrawLayer).
 * It drops in the middle of the page part on screen, fitted inside 80 × 80 mm,
 * and is then moved / resized / deleted with the select tool.
 */
import { readAsDataUrl } from "../lib/pdf";
import { drawId } from "./shapes";

const MAX_PX = 1600;
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";
export const isImageFile = (f) => /^image\/(png|jpe?g|webp)$/i.test(f?.type || "");

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("The image could not be read."));
    im.src = src;
  });

/** The file as a data URL no larger than MAX_PX on its longest side. PNG stays PNG (transparency). */
async function shrink(file) {
  const src = await readAsDataUrl(file);
  const im = await loadImage(src);
  const k = Math.min(1, MAX_PX / Math.max(im.naturalWidth, im.naturalHeight));
  if (k === 1 && file.size < 1.5 * 1024 * 1024) return { dataUrl: src, w: im.naturalWidth, h: im.naturalHeight };
  const c = document.createElement("canvas");
  c.width = Math.round(im.naturalWidth * k);
  c.height = Math.round(im.naturalHeight * k);
  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
  const png = /png/i.test(file.type);
  return { dataUrl: c.toDataURL(png ? "image/png" : "image/jpeg", 0.88), w: c.width, h: c.height };
}

/** The mark for `file` on `page`, centred on `center` (mm) of a page `size`. */
export async function imageMark(file, { page, center, size }) {
  if (!isImageFile(file)) throw new Error("Pick a PNG, JPEG or WebP image.");
  const img = await shrink(file);
  const k = Math.min(Math.min(80, size.w * 0.6) / img.w, Math.min(80, size.h * 0.4) / img.h);
  const w = r2(img.w * k);
  const h = r2(img.h * k);
  const x = r2(Math.max(0, Math.min(size.w - w, center[0] - w / 2)));
  const y = r2(Math.max(0, Math.min(size.h - h, center[1] - h / 2)));
  return { id: drawId(), page, kind: "image", x, y, w, h, src: img.dataUrl };
}

/** The page most in view inside a scroll box of `.nfb-pageslot`s, and the mm point at the view's centre. */
export function pageInView(scrollEl, pages) {
  const slots = [...(scrollEl?.querySelectorAll(".nfb-pageslot") || [])];
  if (!slots.length) return { page: 1, center: [pages[0].w / 2, pages[0].h / 3] };
  const v = scrollEl.getBoundingClientRect();
  let best = 0;
  let bestArea = -1;
  slots.forEach((s, i) => {
    const r = s.getBoundingClientRect();
    const area = Math.max(0, Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top)) * Math.max(0, Math.min(r.right, v.right) - Math.max(r.left, v.left));
    if (area > bestArea) [best, bestArea] = [i, area];
  });
  const r = slots[best].getBoundingClientRect();
  const p = pages[best] || pages[0];
  const cx = (Math.max(r.left, v.left) + Math.min(r.right, v.right)) / 2;
  const cy = (Math.max(r.top, v.top) + Math.min(r.bottom, v.bottom)) / 2;
  return { page: best + 1, center: [((cx - r.left) / r.width) * p.w, ((cy - r.top) / r.height) * p.h] };
}

const r2 = (n) => Math.round(n * 100) / 100;
