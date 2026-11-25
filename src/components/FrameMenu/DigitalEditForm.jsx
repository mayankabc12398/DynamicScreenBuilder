import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import { UploadDigitalForm, EDPGetFormData } from "../../networkServices/EDP/edpApi";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
import { getSharedFile, setSharedTransactionId, resolveTransactionId } from "./DigitalFileStore";
import ReactSelect from '../../components/formComponent/ReactSelect';
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { aiFetch, AI_GENERATE_URL } from "../../utils/aiClient";
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.5-flash-lite";
const INPUT_FONT_CSS = 16;

/* Text size range in the panel, in screen pixels. */
const TEXT_SIZE_MIN = 8;
const TEXT_SIZE_MAX = 72;
const TEXT_SIZE_STEP = 2;

/* Rasterisation quality. pdf.js renders at 72 DPI by default, which looked soft
   on screen and lost detail again on export; pages are rendered at ~200 DPI. */
const PDF_TARGET_PAGE_WIDTH = 1654;   // A4 width at ~200 DPI
const PDF_MIN_SCALE = 1.2;
const PDF_MAX_SCALE = 3;
const PAGE_GAP_CSS = 10;

/* Every page is stacked into one canvas, so a long document is limited by
   total area rather than by page count. No fixed per-side cap: engines differ
   too much (Firefox 32767, Safari less, Chrome far more) and guessing the
   tightest one crushed the render scale of anything past a few pages. The
   browser is asked directly instead - see fitCanvasToBrowser. */
const MAX_CANVAS_PIXELS = 32000000;
const MIN_RENDER_SCALE = 0.3;

/* The document always fills the viewer column, but never blow a small upload
   up by more than this - past it the page is just soft pixels. */
const MAX_DISPLAY_UPSCALE = 2;

/* Export caps apply per page, so page count no longer costs resolution. */
const EXPORT_JPEG_QUALITY = 0.88;
const MAX_EXPORT_WIDTH = 2000;
const MAX_EXPORT_PIXELS = 6000000;
const PX_PER_PT = 96 / 72;            // canvas px -> PDF points

/* An uploaded image carries no page size, so its page is fitted to A4. */
const A4_SHORT_PT = 595.28;
const A4_LONG_PT = 841.89;

/* How many undo/redo steps are kept - each one holds a full-page bitmap, so a
   large document is bounded by bytes as well as by step count. */
const HISTORY_LIMIT = 40;
const HISTORY_BYTE_BUDGET = 256 * 1024 * 1024;

/* ---------- side panel look ---------- */
const ACCENT = "#2563eb";

const TOOLS = [
  { id: "pen", label: "Pen", Icon: PenLine },
  { id: "text", label: "Text", Icon: Type },
  { id: "eraser", label: "Eraser", Icon: Eraser },
];

/* The panel is styled from a scoped sheet rather than inline styles: the
   app's global button rules otherwise repaint the borders, and inline styles
   cannot do hover or disabled states. Each action has its own pastel colour
   so it reads at a glance. */
const PANEL_CSS = `
.def-panel {
  flex: 0 0 20%; min-width: 240px; min-height: 0;
  display: flex; flex-direction: column;
  background: #fbfcfe; border-left: 1px solid #e5e9f2;
}
.def-panel .def-top { padding: 8px 10px; border-bottom: 1px solid #e5e9f2; }
.def-panel .def-body {
  flex: 1 1 auto; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px; padding: 10px;
}
.def-panel .def-foot {
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px 10px; border-top: 1px solid #e5e9f2; background: #f5f7fb;
}
.def-panel .def-card {
  background: #fff; border: 1px solid #edf0f6; border-radius: 10px; padding: 8px;
}
.def-panel .def-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
  color: #94a3b8; margin-bottom: 6px;
}
.def-panel .def-row { display: flex; align-items: center; gap: 6px; }
.def-panel .def-row + .def-row { margin-top: 6px; }
.def-panel .def-btn {
  flex: 1 1 0; min-width: 0;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  height: 30px; padding: 0 8px; font-size: 12.5px; font-weight: 600; line-height: 1;
  white-space: nowrap; cursor: pointer;
  border: 1px solid #e2e8f0 !important; border-radius: 8px !important;
  background: #fff !important; color: #475569 !important; box-shadow: none !important;
  transition: background .15s, border-color .15s, color .15s;
}
.def-panel .def-btn:hover:not(:disabled) { background: #f1f5f9 !important; }
.def-panel .def-btn:disabled { opacity: .5; cursor: not-allowed; }
.def-panel .def-btn.is-active {
  background: #dbeafe !important; border-color: #93c5fd !important; color: #1d4ed8 !important;
}
.def-panel .def-btn--violet { background: #f1ecff !important; border-color: #ddd0fe !important; color: #6d28d9 !important; }
.def-panel .def-btn--violet:hover:not(:disabled) { background: #e6dcff !important; }
.def-panel .def-btn--rose { background: #fff1f2 !important; border-color: #fecdd3 !important; color: #be123c !important; }
.def-panel .def-btn--rose:hover:not(:disabled) { background: #ffe4e6 !important; }
.def-panel .def-btn--mint { background: #ecfdf5 !important; border-color: #a7f3d0 !important; color: #047857 !important; }
.def-panel .def-btn--mint:hover:not(:disabled) { background: #d1fae5 !important; }
.def-panel .def-btn--sky { background: #e0f2fe !important; border-color: #7dd3fc !important; color: #0369a1 !important; height: 32px; }
.def-panel .def-btn--sky:hover:not(:disabled) { background: #cdeafd !important; }
.def-panel .def-btn--icon { flex: 0 0 30px; padding: 0; }
.def-panel .def-color {
  flex: 0 0 30px; width: 30px; height: 30px; padding: 2px; cursor: pointer;
  border: 1px solid #e2e8f0; border-radius: 8px; background: #fff;
}
.def-panel .def-value { font-size: 12px; color: #64748b; min-width: 34px; text-align: center; }
.def-panel .def-hint { font-size: 11px; line-height: 1.4; color: #64748b; margin-top: 6px; }
.def-panel .def-note { font-size: 11px; color: #64748b; text-align: center; }
`;

/* Browsers silently hand back a blank canvas when they cannot back the memory,
   and the ceiling differs per engine, so probe for a size that actually works
   instead of hardcoding the most pessimistic limit. */
function canAllocateCanvas(width, height) {
  let probe = null;
  try {
    probe = document.createElement("canvas");
    probe.width = width;
    probe.height = height;
    const ctx = probe.getContext("2d");
    if (!ctx) return false;
    // A refused allocation reads back as transparent black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(width - 1, height - 1, 1, 1);
    return ctx.getImageData(width - 1, height - 1, 1, 1).data[3] === 255;
  } catch {
    return false;
  } finally {
    // Release the probe before the real canvas is allocated.
    if (probe) { probe.width = 1; probe.height = 1; }
  }
}

async function geminiTranscribeInk(base64Png) {
  const prompt = `This image shows ONLY handwriting (dark ink strokes) on a plain white background.
Transcribe each separate handwritten word or line as clean digital text, and give its bounding box.
Return ONLY a JSON array: [{"text":"<handwritten text>","box_2d":[ymin,xmin,ymax,xmax]}]
where each coordinate is an integer 0-1000 normalized to the image size. No markdown, no extra keys.`;
  const res = await aiFetch(AI_GENERATE_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType: "image/png", data: base64Png } }, { text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    }
  );
  return out;
}

/* A page with no annotation must not get an image stamped onto it - that would
   replace crisp original vectors with a needless bitmap layer. */
function isFullyTransparent(canvas) {
  const { width, height } = canvas;
  if (!width || !height) return true;
  const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return false;
  return true;
}

/* PDF page content is authored unrotated; /Rotate is applied by the viewer.
   The overlay was drawn in the rotated (on-screen) orientation, so undo it. */
function rotateCanvas(canvas, angle) {
  const a = ((angle % 360) + 360) % 360;
  if (!a) return canvas;
  const swap = a === 90 || a === 270;
  const out = document.createElement("canvas");
  out.width = swap ? canvas.height : canvas.width;
  out.height = swap ? canvas.width : canvas.height;
  const ctx = out.getContext("2d");
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((a * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return out;
}

function canvasToPngBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error("Could not encode the annotation layer.")); return; }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });
}

function bytesToBase64(bytes) {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function savePdfBytes(bytes, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Scales an image's pixel size into an A4-shaped page, keeping its aspect
   ratio, so a scan does not become a 30-inch-wide page. */
function fitImagePageSize(pxWidth, pxHeight) {
  const portrait = pxHeight >= pxWidth;
  const maxW = portrait ? A4_SHORT_PT : A4_LONG_PT;
  const maxH = portrait ? A4_LONG_PT : A4_SHORT_PT;
  const k = Math.min(maxW / pxWidth, maxH / pxHeight);
  return { width: pxWidth * k, height: pxHeight * k };
}

/* Stamps the annotation overlay onto the ORIGINAL file so the exported PDF
   keeps the uploaded document's own text and vectors untouched. Only the
   annotations are raster; nothing that was already there is re-encoded. */
async function stampOverlayOnSource(source, overlay, pages) {
  if (!source?.bytes && !source?.canvas) throw new Error("Original file bytes are unavailable.");
  const { PDFDocument } = await import("pdf-lib");

  if (source?.kind === "pdf") {
    const doc = await PDFDocument.load(source.bytes, { ignoreEncryption: true });
    const docPages = doc.getPages();
    const regions = pages?.length ? pages : [];

    for (let i = 0; i < docPages.length && i < regions.length; i++) {
      const crop = cropRegion(overlay, regions[i]);
      if (isFullyTransparent(crop)) continue;

      const page = docPages[i];
      const oriented = rotateCanvas(crop, -page.getRotation().angle);
      const png = await doc.embedPng(await canvasToPngBytes(oriented));
      // The viewport pdf.js gave us follows the crop box, so align to it.
      const box = page.getCropBox();
      page.drawImage(png, { x: box.x, y: box.y, width: box.width, height: box.height });
    }
    return doc.save();
  }

  // Image source: embed the original bytes as-is, annotations on top.
  const doc = await PDFDocument.create();
  const mime = String(source?.mime || "").toLowerCase();
  let image = null;
  try {
    // pdf-lib embeds only JPEG and PNG, and rejects exotic variants of both.
    if (mime === "image/jpeg" || mime === "image/jpg") image = await doc.embedJpg(source.bytes);
    else if (mime === "image/png") image = await doc.embedPng(source.bytes);
  } catch (err) {
    console.warn("Could not embed the original image, re-encoding losslessly:", err);
  }

  if (!image) {
    // Lossless PNG of the rendered original - still no JPEG recompression.
    image = await doc.embedPng(await canvasToPngBytes(source.canvas));
  }

  const { width, height } = fitImagePageSize(image.width, image.height);
  const page = doc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });

  const crop = cropRegion(overlay, pages?.[0] || { x: 0, y: 0, w: overlay.width, h: overlay.height });
  if (!isFullyTransparent(crop)) {
    const png = await doc.embedPng(await canvasToPngBytes(crop));
    page.drawImage(png, { x: 0, y: 0, width, height });
  }
  return doc.save();
}

function prepareRegionForUpload(sourceCanvas, region) {
  const srcX = region?.x || 0;
  const srcY = region?.y || 0;
  const srcW = region?.w || sourceCanvas.width;
  const srcH = region?.h || sourceCanvas.height;

  let targetWidth = srcW;
  let targetHeight = srcH;

  if (targetWidth > MAX_EXPORT_WIDTH) {
    const ratio = MAX_EXPORT_WIDTH / targetWidth;
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const totalPixels = targetWidth * targetHeight;
  if (totalPixels > MAX_EXPORT_PIXELS) {
    const ratio = Math.sqrt(MAX_EXPORT_PIXELS / totalPixels);
    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
  }

  const prepared = document.createElement("canvas");
  prepared.width = targetWidth;
  prepared.height = targetHeight;

  const ctx = prepared.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

  return prepared;
}

/* Fallback only: rebuilds the document by rasterising it. Used when the
   original bytes cannot be parsed (damaged or hard-encrypted PDFs), because
   that path loses the original vectors. */
function buildPdfFromCanvas(canvas, pages) {
  const regions = pages?.length
    ? pages
    : [{ x: 0, y: 0, w: canvas.width, h: canvas.height }];
  let pdf;

  regions.forEach((region, i) => {
    const exportCanvas = prepareRegionForUpload(canvas, region);
    // The page keeps the document's real size; only the image on it is high
    // resolution, so it stays sharp on screen and when printed.
    const w = region.ptW || region.w / PX_PER_PT;
    const h = region.ptH || region.h / PX_PER_PT;
    const orientation = w >= h ? "landscape" : "portrait";
    const imageData = exportCanvas.toDataURL("image/jpeg", EXPORT_JPEG_QUALITY);

    if (i === 0) {
      pdf = new jsPDF({ orientation, unit: "pt", format: [w, h], compress: true });
    } else {
      pdf.addPage([w, h], orientation);
    }

    pdf.addImage(imageData, "JPEG", 0, 0, w, h, undefined, "NONE");
  });

  return pdf;
}

/* ---------- component ---------- */
const DigitalEditForm = ({ data } = {}) => {
  const [t] = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // The IPD and Emergency menus pass the patient as `data`, the OPD menu as `patientDetail`.
  const routeData = location.state?.data || location.state || {};
  const frameData = data && Object.keys(data).length > 0 ? data : patientDetail;
  const patientData = frameData && Object.keys(frameData).length > 0 ? frameData : routeData;
  const file = getSharedFile();
  const [currentFormId, setCurrentFormId] = useState("");

  const baseRef = useRef(null);
  const drawRef = useRef(null);
  const wrapRef = useRef(null);
  const rootRef = useRef(null);
  const pagesRef = useRef([]);   // page regions of the base canvas, used on export
  const sourceRef = useRef(null); // original uploaded bytes, stamped on export

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1f2d3d");
  const [size, setSize] = useState(3);
  const [hasFile, setHasFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [pdfBase64, setPdfBase64] = useState("");

  // saved-forms dropdown
  const [savedForms, setSavedForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState("");

  const [texts, setTexts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  // Style for the next text placed; the panel also applies it to the selected text.
  const [textColor, setTextColor] = useState("#1f2d3d");
  const [textSizeCss, setTextSizeCss] = useState(INPUT_FONT_CSS);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const textColorSnapped = useRef(false);
  const [dispScale, setDispScale] = useState(1);
  // Intrinsic width of the rendered document, in canvas pixels.
  const [baseWidth, setBaseWidth] = useState(0);
  const [rootHeight, setRootHeight] = useState("100vh");
  const cancelNext = useRef(false);
  const idRef = useRef(0);

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const drawing = useRef(false);
  const dragSnapped = useRef(false);

  // Route state, the query string and the shared store are all checked - the
  // editor is reached from the upload page, from a frame menu, and by reload.
  const txnId = useMemo(
    () => resolveTransactionId({ ...(location.state || {}), ...patientData }, location.search),
    [patientData, location.state, location.search]
  );

  useEffect(() => {
    if (txnId) setSharedTransactionId(txnId);
  }, [txnId]);

  useEffect(() => {
    const update = () => {
      const top = rootRef.current?.getBoundingClientRect().top || 0;
      setRootHeight(`calc(100vh - ${Math.max(0, Math.round(top))}px)`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ---------- canvas sizing ---------- */
  const sizeCanvases = (w, h) => {
    if (!baseRef.current || !drawRef.current) return false;
    [baseRef.current, drawRef.current].forEach((c) => { c.width = w; c.height = h; });
    setBaseWidth(w);
    return true;
  };

  const loadImageToBase = (url) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        sizeCanvases(w, h);
        baseRef.current.getContext("2d").drawImage(img, 0, 0);
        pagesRef.current = [{ x: 0, y: 0, w, h, ptW: w / PX_PER_PT, ptH: h / PX_PER_PT }];
        URL.revokeObjectURL(url);
        res();
      };
      img.onerror = () => rej(new Error("Image failed to load"));
      img.src = url;
    });

  const loadPdf = async (data) => {
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    // Natural page sizes (1 unit = 1 PDF point) drive the render scale.
    const raw = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      raw.push({ page, vp1: page.getViewport({ scale: 1 }) });
    }

    const maxPtWidth = raw.reduce((m, r) => Math.max(m, r.vp1.width), 1);
    let scale = Math.min(
      PDF_MAX_SCALE,
      Math.max(PDF_MIN_SCALE, PDF_TARGET_PAGE_WIDTH / maxPtWidth)
    );

    // Back the scale off if the stacked canvas would exceed browser limits.
    const measure = (sc) => {
      const w = Math.ceil(maxPtWidth * sc);
      const h = Math.ceil(
        raw.reduce((sum, r) => sum + r.vp1.height * sc, 0) +
        PAGE_GAP_CSS * sc * Math.max(0, raw.length - 1)
      );
      return { w, h };
    };
    const box = measure(scale);
    if (box.w * box.h > MAX_CANVAS_PIXELS) {
      scale *= Math.sqrt(MAX_CANVAS_PIXELS / (box.w * box.h));
    }
    // Only now ask the browser whether it can hold that; a hardcoded per-side
    // limit was rejecting sizes Chrome handles fine and blurring the preview.
    scale = fitCanvasToBrowser(scale, measure);

    const gap = Math.round(PAGE_GAP_CSS * scale);
    const viewports = raw.map((r) => r.page.getViewport({ scale }));
    const width = Math.ceil(viewports.reduce((m, vp) => Math.max(m, vp.width), 1));
    const height =
      viewports.reduce((sum, vp) => sum + Math.ceil(vp.height), 0) +
      gap * Math.max(0, viewports.length - 1);

    sizeCanvases(width, height);
    const ctx = baseRef.current.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    const pages = [];
    let y = 0;
    for (let i = 0; i < raw.length; i++) {
      const vp = viewports[i];
      const tmp = document.createElement("canvas");
      tmp.width = Math.ceil(vp.width);
      tmp.height = Math.ceil(vp.height);
      await raw[i].page.render({ canvasContext: tmp.getContext("2d"), viewport: vp }).promise;
      ctx.drawImage(tmp, 0, y);
      pages.push({
        x: 0, y,
        w: tmp.width, h: tmp.height,
        ptW: raw[i].vp1.width, ptH: raw[i].vp1.height,
      });
      y += tmp.height + gap;
    }
    pagesRef.current = pages;
  };

  const loadFile = async (f) => {
    if (!f) return;
    setLoading(true);
    try {
      resetHistory();
      setTexts([]);
      setEditing(null);
      setDraft("");
      setPdfBase64("");
      pagesRef.current = [];
      sourceRef.current = null;
      // pdf.js may transfer the buffer it is handed, so keep our own copy.
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (f.type.startsWith("image/")) {
        sourceRef.current = { kind: "image", bytes, mime: f.type, canvas: null };
        await loadImageToBase(URL.createObjectURL(f));
        sourceRef.current.canvas = baseRef.current;
      } else {
        sourceRef.current = { kind: "pdf", bytes };
        await loadPdf(bytes.slice());
      }
      drawRef.current.getContext("2d").clearRect(0, 0, drawRef.current.width, drawRef.current.height);
      setHasFile(true);
    } catch (err) {
      console.error(err);
      alert("Could not load file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // base64 -> ArrayBuffer (handles raw base64 or data-uri)
  const base64ToArrayBuffer = (b64) => {
    const clean = b64.includes(",") ? b64.split(",")[1] : b64;
    const bin = atob(clean.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  };

  const loadBase64Pdf = async (b64, name = "form.pdf", formId = "") => {
    setLoading(true);
    try {
      resetHistory();
      setTexts([]);
      setEditing(null);
      setDraft("");
      setPdfBase64("");
      pagesRef.current = [];
      const bytes = new Uint8Array(base64ToArrayBuffer(b64));
      sourceRef.current = { kind: "pdf", bytes };
      setCurrentFormId(String(formId || ""));
      await loadPdf(bytes.slice());
      drawRef.current.getContext("2d").clearRect(0, 0, drawRef.current.width, drawRef.current.height);
      setHasFile(true);
      setFileName(name.replace(/\.pdf$/i, ""));
    } catch (err) {
      console.error(err);
      alert("Could not load file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSelectForm = (_name, opt) => {
    setSelectedForm(opt?.value || "");
    if (!opt) return;
    const form = savedForms.find((f) => String(f.formId) === String(opt.value));
    const b64 = form?.fileBase64 || form?.FileBase64;
    if (!b64) {
      alert(t("This form has no embedded file data from the server. The list response returned an empty fileBase64 for it."));
      return;
    }
    loadBase64Pdf(b64, opt.label || "form.pdf", form?.formId || form?.FormId);
  };

  // initial shared file
  useEffect(() => {
    if (!file) return;
    let raf;
    const tryLoad = () => {
      if (baseRef.current && drawRef.current) loadFile(file);
      else raf = requestAnimationFrame(tryLoad);
    };
    tryLoad();
    return () => raf && cancelAnimationFrame(raf);
  }, [file]);

  // fetch saved forms list
  useEffect(() => {
    if (!txnId) return;
    EDPGetFormData(txnId)
      .then((res) => setSavedForms(Array.isArray(res) ? res : res?.data || []))
      .catch(() => setSavedForms([]));
  }, [txnId]);

  // displayed scale
  useEffect(() => {
    const cv = baseRef.current;
    if (!cv) return;
    const update = () => {
      const rect = cv.getBoundingClientRect();
      if (cv.width) setDispScale(rect.width / cv.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(cv);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
    // baseWidth: the viewer now fills the column, so loading a document of a
    // different intrinsic width can leave the rendered size unchanged and the
    // observer silent - recompute whenever the canvas is re-sized.
  }, [hasFile, baseWidth]);

  /* ---------- drawing ---------- */
  const pos = (e) => {
    const r = drawRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return {
      x: (p.clientX - r.left) * (drawRef.current.width / r.width),
      y: (p.clientY - r.top) * (drawRef.current.height / r.height),
    };
  };

  /* ---------- history (undo / redo) ---------- */
  // A history entry keeps both layers of the page: the ink bitmap and the
  // placed text boxes, so undo/redo restores whichever the user changed last.
  const syncHistory = () => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  };

  const resetHistory = () => {
    undoStack.current = [];
    redoStack.current = [];
    syncHistory();
  };

  const captureState = () => {
    const cv = drawRef.current;
    return {
      image: cv.getContext("2d").getImageData(0, 0, cv.width, cv.height),
      texts,
    };
  };

  const applyState = (snap) => {
    const cv = drawRef.current;
    const ctx = cv.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (snap.image) ctx.putImageData(snap.image, 0, 0);
    setTexts(snap.texts || []);
  };

  /* A step on a long document can be tens of megabytes, so a fixed step count
     is not a memory bound - drop the oldest steps until the stack fits. */
  const trimHistory = (stack) => {
    while (stack.length > HISTORY_LIMIT) stack.shift();
    let bytes = stack.reduce((sum, snap) => sum + (snap.image?.data?.length || 0), 0);
    while (stack.length > 1 && bytes > HISTORY_BYTE_BUDGET) {
      bytes -= stack.shift().image?.data?.length || 0;
    }
  };

  const snapshot = () => {
    if (!drawRef.current) return;
    undoStack.current.push(captureState());
    trimHistory(undoStack.current);
    redoStack.current = [];   // a fresh edit invalidates the redo trail
    syncHistory();
  };

  const start = (e) => {
    if (!hasFile) return;
    if (tool === "text") {
      e.preventDefault();
      const cv = drawRef.current;
      const rect = cv.getBoundingClientRect();
      const scale = cv.width / rect.width;
      const p = e.touches ? e.touches[0] : e;
      const cssLeft = p.clientX - rect.left;
      const cssTop = p.clientY - rect.top;
      setSelectedTextId(null);
      setEditing({
        cssLeft, cssTop,
        x: cssLeft * scale, y: cssTop * scale,
        size: textSizeCss * scale, color: textColor,
      });
      setDraft("");
      return;
    }
    e.preventDefault();
    snapshot();
    drawing.current = true;
    const ctx = drawRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const cv = drawRef.current;
    const ctx = cv.getContext("2d");
    const { x, y } = pos(e);
    // Stroke width is chosen in screen pixels, so convert to canvas pixels -
    // the canvas is now rendered well above its displayed size.
    const rect = cv.getBoundingClientRect();
    const pxScale = rect.width ? cv.width / rect.width : 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = size * 6 * pxScale;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = size * pxScale;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (drawing.current) setPdfBase64("");
    drawing.current = false;
  };

  const undo = () => {
    if (!hasFile || !undoStack.current.length) return;
    const prev = undoStack.current.pop();
    redoStack.current.push(captureState());
    trimHistory(redoStack.current);
    setPdfBase64("");
    setEditing(null);
    setDraft("");
    applyState(prev);
    syncHistory();
  };

  const redo = () => {
    if (!hasFile || !redoStack.current.length) return;
    const next = redoStack.current.pop();
    undoStack.current.push(captureState());
    trimHistory(undoStack.current);
    setPdfBase64("");
    setEditing(null);
    setDraft("");
    applyState(next);
    syncHistory();
  };

  const clearPage = () => {
    if (!hasFile) return;
    snapshot();
    setTexts([]);
    setEditing(null);
    setDraft("");
    setPdfBase64("");
    drawRef.current.getContext("2d").clearRect(0, 0, drawRef.current.width, drawRef.current.height);
  };

  /* ---------- text ---------- */
  const commitText = () => {
    if (!editing) return;
    if (cancelNext.current) {
      cancelNext.current = false;
      setEditing(null);
      setDraft("");
      return;
    }
    const text = draft.trim();
    if (text) {
      snapshot();
      setPdfBase64("");
      const id = ++idRef.current;
      setTexts((prev) => [
        ...prev,
        { id, x: editing.x, y: editing.y, text, color: editing.color, size: editing.size },
      ]);
      // The new text stays selected so its size and colour can be adjusted right away.
      setSelectedTextId(id);
    }
    setEditing(null);
    setDraft("");
  };

  const onTextKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      cancelNext.current = true;
      e.currentTarget.blur();
    }
  };

  const startDragPlaced = (e, id) => {
    if (tool !== "text") return;
    e.preventDefault();
    e.stopPropagation();
    const t = texts.find((x) => x.id === id);
    if (!t) return;
    setSelectedTextId(id);
    const startX = e.clientX, startY = e.clientY;
    const origX = t.x, origY = t.y;
    dragSnapped.current = false;
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / dispScale;
      const dy = (ev.clientY - startY) / dispScale;
      if (!dragSnapped.current) {
        dragSnapped.current = true;
        snapshot();
        setPdfBase64("");
      }
      setTexts((prev) => prev.map((it) => (it.id === id ? { ...it, x: origX + dx, y: origY + dy } : it)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const editPlaced = (id) => {
    const t = texts.find((x) => x.id === id);
    if (!t) return;
    snapshot();
    setTexts((prev) => prev.filter((x) => x.id !== id));
    setEditing({
      cssLeft: t.x * dispScale,
      cssTop: t.y * dispScale,
      x: t.x, y: t.y,
      size: t.size, color: t.color,
    });
    setDraft(t.text);
    setTool("text");
  };

  /* The panel shows the selected text's style, or the style for the next text. */
  const selectedText = tool === "text" ? texts.find((t) => t.id === selectedTextId) : null;
  const shownTextSize = selectedText ? Math.round(selectedText.size * dispScale) : textSizeCss;
  const shownTextColor = selectedText ? selectedText.color : textColor;

  const updateSelectedText = (changes) => {
    setPdfBase64("");
    setTexts((prev) => prev.map((it) => (it.id === selectedText.id ? { ...it, ...changes } : it)));
  };

  const changeTextSize = (delta) => {
    const next = Math.min(TEXT_SIZE_MAX, Math.max(TEXT_SIZE_MIN, shownTextSize + delta));
    setTextSizeCss(next);
    if (!selectedText || !dispScale || next === shownTextSize) return;
    snapshot();
    // Text sizes are stored in canvas pixels, the panel works in screen pixels.
    updateSelectedText({ size: next / dispScale });
  };

  /* The colour picker fires on every move, so only the first change of each
     pick is recorded as an undo step. */
  const changeTextColor = (value) => {
    setTextColor(value);
    if (!selectedText) return;
    if (!textColorSnapped.current) {
      textColorSnapped.current = true;
      snapshot();
    }
    updateSelectedText({ color: value });
  };

  /* ---------- compose / export ---------- */
  const drawTexts = (ctx) => {
    ctx.textBaseline = "top";
    texts.forEach((t) => {
      if (!t.text) return;
      ctx.fillStyle = t.color;
      ctx.font = `${t.size}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(t.text, t.x, t.y);
    });
  };

  /* A transparent canvas the size of the whole document, carrying only what
     the user added. It is stamped onto the original file on export. */
  const makeOverlay = (paint) => {
    const cv = document.createElement("canvas");
    cv.width = baseRef.current.width;
    cv.height = baseRef.current.height;
    paint(cv.getContext("2d"), cv);
    return cv;
  };

  const inkOverlay = () =>
    makeOverlay((ctx) => {
      ctx.drawImage(drawRef.current, 0, 0);
      drawTexts(ctx);
    });

  /* Flattened bitmap of everything - only the raster fallback needs this. */
  const merged = () => {
    const c = document.createElement("canvas");
    c.width = baseRef.current.width;
    c.height = baseRef.current.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(baseRef.current, 0, 0);
    ctx.drawImage(drawRef.current, 0, 0);
    drawTexts(ctx);
    return c;
  };

  const handleSave = async () => {
    if (!hasFile) return;
    if (!pdfBase64) { alert(t("Download or Convert first, then Save.")); return; }
    const name = fileName.trim();
    if (!name) { alert(t("Please enter a file name.")); return; }
    if (!txnId) { alert(t("Transaction ID not found.")); return; }

    const isUpdate = currentFormId ? 1 : 0;
    setSaving(true);
    try {
      const payload = {
        formId: currentFormId || "",
        fileName: /\.pdf$/i.test(name) ? name : `${name}.pdf`,
        fileUrl: pdfBase64,
        transactionId: String(txnId),
        isUpdate,
      };
      await UploadDigitalForm(payload);
      EDPGetFormData(txnId)
        .then((r) => setSavedForms(Array.isArray(r) ? r : r?.data || []))
        .catch(() => { });
    } catch (err) {
      alert(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  /* Exports by stamping `overlay` onto the uploaded file, so the original
     pages come out exactly as they went in. `flatten` supplies the rasterised
     fallback for a source pdf-lib cannot parse. */
  const exportPdf = async (overlay, flatten, name) => {
    let bytes;
    try {
      bytes = await stampOverlayOnSource(sourceRef.current, overlay, pagesRef.current);
    } catch (err) {
      console.warn("Falling back to a rasterised export:", err);
      const pdf = buildPdfFromCanvas(flatten(), pagesRef.current);
      bytes = new Uint8Array(pdf.output("arraybuffer"));
    }
    savePdfBytes(bytes, name);
    setPdfBase64(bytesToBase64(bytes));
  };

  const download = async () => {
    if (!hasFile) return;
    setLoading(true);
    try {
      await exportPdf(inkOverlay(), merged, "handwritten-form.pdf");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Download failed.");
    } finally {
      setLoading(false);
    }
  };

  /* Ctrl/Cmd+Z undo, Ctrl+Y or Ctrl/Cmd+Shift+Z redo */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const el = e.target;
      const tag = el?.tagName;
      // let the browser handle undo inside the file-name / text inputs
      if (el?.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const key = String(e.key).toLowerCase();
      if (key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (key === "y" || (key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  /* touch listeners */
  useEffect(() => {
    const c = drawRef.current;
    if (!c) return;
    c.addEventListener("touchstart", start, { passive: false });
    c.addEventListener("touchmove", move, { passive: false });
    c.addEventListener("touchend", end);
    return () => {
      c.removeEventListener("touchstart", start);
      c.removeEventListener("touchmove", move);
      c.removeEventListener("touchend", end);
    };
  });

  const formOptions = savedForms.map((f) => ({
    value: String(f.formId),
    label: f.fileName || f.FileName,
  }));

  /* ---------- ui ---------- */
  return (
    <div ref={rootRef} className="d-flex flex-column" style={{ height: rootHeight, overflow: "hidden", background: "#fff" }}>
      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
        <span className="fw-semibold">{t("Edit Digital PDF")}</span>
      </div>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-2 border-bottom">
        <div className="d-flex gap-4 align-items-center">
          <button
            className="btn btn-sm btn-success mx-1 p-2 border-0"
            style={{ background: "#0d6efd", marginRight: "8px" }}
            onClick={() => navigate("/edp-upload-page", { state: { data: patientData } })}
          >
            {t("← Back")}
          </button>

          <div className="d-flex align-items-center">
            <span className="small text-muted">{t("Pen")}</span>
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setTool("pen"); }}
              style={{ width: 40, height: 30, padding: 2 }} className="form-control form-control-sm mx-1" />
            <input type="range" min="1" max="20" value={size}
              onChange={(e) => setSize(Number(e.target.value))} style={{ width: 120 }} className="form-range" />
          </div>

          <div>
            <button className="btn btn-sm btn-success mx-1 p-2"
              onClick={() => setTool(tool === "text" ? "pen" : "text")}>{t("Text")}</button>
            <button className="btn btn-sm btn-success mx-1 p-2"
              onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}>{t("Eraser")}</button>
            <button className="btn btn-sm btn-success mx-1 p-2" onClick={undo}>{t("Undo")}</button>
            <button className="btn btn-sm btn-success mx-1 p-2" onClick={clearPage}>{t("Clear Page")}</button>
          </div>
        </div>

        <div className="ms-auto d-flex gap-2 align-items-center">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder={t("Enter file name")}
            className="form-control form-control-sm"
            style={{ width: 160 }}
          />
          <button className="btn btn-sm btn-success mx-1 p-2 border-0" onClick={handleSave}
            disabled={!hasFile || !pdfBase64 || saving || loading}>
            {saving ? t("Saving…") : currentFormId ? t("Update") : t("Save")}
          </button>
          <button className="btn btn-sm btn-success mx-1 p-2 border-0" onClick={download} disabled={!hasFile || loading}>
            {t("Download (keep handwriting)")}
          </button>
          <button className="btn btn-sm btn-success mx-1 p-2 border-0" onClick={convert} disabled={!hasFile || loading}>
            {loading ? t("Converting…") : t("Convert to Digital PDF (AI)")}
          </button>
        </div>

        {/* saved forms dropdown */}
        <div style={{ width: 220 }}>
          <ReactSelect
            id="savedForms"
            name="savedForms"
            placeholderName="Saved Forms"
            searchable={true}
            respclass=""
            requiredClassName=""
            value={selectedForm}
            handleChange={onSelectForm}
            dynamicOptions={formOptions}
          />
        </div>
      </div>

      {tool === "text" && hasFile && (
        <div className="text-muted px-3 py-1 border-bottom" style={{ fontSize: 13 }}>
          {t("Text tool: click to add text & press")} <b>{t("Enter")}</b>. <b>{t("Drag")}</b> {t("any text to move it.")}
          <b> {t("Double-click")}</b> {t("a text to edit it (clear it + Enter to delete).")}
        </div>
      )}

      <div className="flex-grow-1 overflow-auto p-3" style={{ background: "#f1f5f9", position: "relative" }}>
        {loading && (
          <div className="position-absolute top-50 start-50 translate-middle text-muted">{t("Loading…")}</div>
        )}

        {!file && !hasFile && (
          <div className="text-center text-muted py-5">
            {t("No file found. Please upload from the Digital Form Master page, or pick a saved form above.")}
          </div>
        )}

        <div ref={wrapRef} style={{ position: "relative", display: "inline-block", margin: "0 auto", maxWidth: "100%" }}>
          <canvas ref={baseRef} style={{ display: "block", maxWidth: "100%", height: "auto" }} />
          <canvas ref={drawRef}
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              cursor: tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair", touchAction: "none",
            }} />

          {hasFile && texts.map((t) => (
            <div
              key={t.id}
              onPointerDown={(e) => startDragPlaced(e, t.id)}
              onDoubleClick={() => editPlaced(t.id)}
              title={i18next.t("Drag to move • double-click to edit")}
              style={{
                position: "absolute",
                left: t.x * dispScale,
                top: t.y * dispScale,
                font: `${t.size * dispScale}px 'Segoe UI', Arial, sans-serif`,
                color: t.color,
                lineHeight: 1,
                whiteSpace: "nowrap",
                userSelect: "none",
                cursor: tool === "text" ? "move" : "default",
                pointerEvents: tool === "text" ? "auto" : "none",
              }}
            >
              {t.text}
            </div>
          ))}

          {editing && (
            <input
              autoFocus
              value={draft}
              size={Math.max(draft.length, 6)}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onTextKeyDown}
              onBlur={commitText}
              style={{
                position: "absolute",
                left: editing.cssLeft,
                top: editing.cssTop,
                font: `${editing.size * dispScale}px 'Segoe UI', Arial, sans-serif`,
                color: editing.color,
                border: "1px dashed #888",
                background: "rgba(255,255,255,0.95)",
                padding: "0 2px",
                lineHeight: 1,
                zIndex: 10,
              }}
            />
          )}

          {!file && !hasFile && (
            <div className="text-center text-muted py-5">
              No file found. Please upload from the Digital Form Master page, or pick a saved form on the right.
            </div>
          )}

          {/* `margin: 0 auto` only centres a block, and the document has to be
              told to fill the column - a canvas otherwise sits at its intrinsic
              pixel width, which is narrow for a long, scaled-down document. */}
          <div
            ref={wrapRef}
            style={{
              position: "relative",
              display: "block",
              width: "100%",
              maxWidth: baseWidth ? baseWidth * MAX_DISPLAY_UPSCALE : "100%",
              margin: "0 auto",
            }}
          >
            <canvas ref={baseRef} style={{ display: "block", width: "100%", height: "auto" }} />
            <canvas ref={drawRef}
              onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
              style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                cursor: tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair", touchAction: "none",
              }} />

            {hasFile && texts.map((t) => (
              <div
                key={t.id}
                onPointerDown={(e) => startDragPlaced(e, t.id)}
                onDoubleClick={() => editPlaced(t.id)}
                title="Drag to move • double-click to edit"
                style={{
                  position: "absolute",
                  left: t.x * dispScale,
                  top: t.y * dispScale,
                  font: `${t.size * dispScale}px 'Segoe UI', Arial, sans-serif`,
                  color: t.color,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  cursor: tool === "text" ? "move" : "default",
                  pointerEvents: tool === "text" ? "auto" : "none",
                  outline: selectedText?.id === t.id ? `1px dashed ${ACCENT}` : "none",
                  outlineOffset: 2,
                }}
              >
                {t.text}
              </div>
            ))}

            {editing && (
              <input
                autoFocus
                value={draft}
                size={Math.max(draft.length, 6)}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onTextKeyDown}
                onBlur={commitText}
                style={{
                  position: "absolute",
                  left: editing.cssLeft,
                  top: editing.cssTop,
                  font: `${editing.size * dispScale}px 'Segoe UI', Arial, sans-serif`,
                  color: editing.color,
                  border: "1px dashed #888",
                  background: "rgba(255,255,255,0.95)",
                  padding: "0 2px",
                  lineHeight: 1,
                  zIndex: 10,
                }}
              />
            )}
          </div>
        </div>

        <style>{PANEL_CSS}</style>
        {/* Header and footer stay put; only the middle scrolls, so the save
            actions can never be pushed out of view. */}
        <aside className="def-panel">
          <div className="def-top def-row">
            <button type="button" className="def-btn"
              onClick={() =>
                navigate(
                  txnId ? `/edp-upload-page?transactionId=${encodeURIComponent(txnId)}` : "/edp-upload-page",
                  { state: { data: patientData, transactionID: txnId } }
                )
              }
            >
              <ArrowLeft size={14} strokeWidth={2.2} /> Back
            </button>
          </div>

          <div className="def-body">
            <section className="def-card">
              <div className="def-label">Tools</div>
              <div className="def-row">
                {TOOLS.map((t) => (
                  <button key={t.id} type="button" disabled={!hasFile} title={t.label}
                    onClick={() => setTool(t.id)}
                    className={`def-btn${tool === t.id ? " is-active" : ""}`}>
                    <t.Icon size={14} strokeWidth={2} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="def-row">
                <button type="button" onClick={undo} disabled={!hasFile || !canUndo}
                  className="def-btn def-btn--violet" title="Undo (Ctrl+Z)" aria-label="Undo">
                  <Undo2 size={14} strokeWidth={2} /> Undo
                </button>
                <button type="button" onClick={redo} disabled={!hasFile || !canRedo}
                  className="def-btn def-btn--violet" title="Redo (Ctrl+Y)" aria-label="Redo">
                  <Redo2 size={14} strokeWidth={2} /> Redo
                </button>
              </div>
            </section>

            <section className="def-card">
              <div className="def-label">Pen</div>
              <div className="def-row">
                <input type="color" value={color} title="Ink colour" className="def-color"
                  onChange={(e) => { setColor(e.target.value); setTool("pen"); }} />
                <input type="range" min="1" max="20" value={size} className="form-range flex-grow-1"
                  onChange={(e) => setSize(Number(e.target.value))} title="Stroke width" />
                <span className="def-value">{size}px</span>
              </div>
            </section>

            {tool === "text" && hasFile && (
              <section className="def-card">
                <div className="def-label">{selectedText ? "Selected text" : "Text"}</div>
                <div className="def-row">
                  <input type="color" value={shownTextColor} title="Text colour" className="def-color"
                    onClick={() => { textColorSnapped.current = false; }}
                    onChange={(e) => changeTextColor(e.target.value)} />
                  <button type="button" onClick={() => changeTextSize(-TEXT_SIZE_STEP)}
                    disabled={shownTextSize <= TEXT_SIZE_MIN} className="def-btn"
                    title="Decrease font size" aria-label="Decrease font size">
                    <Minus size={14} strokeWidth={2} />
                  </button>
                  <span className="def-value">{shownTextSize}px</span>
                  <button type="button" onClick={() => changeTextSize(TEXT_SIZE_STEP)}
                    disabled={shownTextSize >= TEXT_SIZE_MAX} className="def-btn"
                    title="Increase font size" aria-label="Increase font size">
                    <Plus size={14} strokeWidth={2} />
                  </button>
                </div>
                <div className="def-hint">
                  Click the page to add text, <b>Enter</b> to place it. Click a text to restyle it,
                  drag to move, double-click to edit.
                </div>
              </section>
            )}

            <section className="def-card">
              <div className="def-label">Form</div>
              <ReactSelect
                id="savedForms"
                name="savedForms"
                placeholderName="Saved Forms"
                searchable={true}
                respclass=""
                requiredClassName=""
                value={selectedForm}
                handleChange={onSelectForm}
                dynamicOptions={formOptions}
              />
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="File name"
                className="form-control form-control-sm"
                style={{ marginTop: 6 }}
              />
            </section>
          </div>

          <div className="def-foot">
            <div className="def-row">
              <button type="button" onClick={clearPage} disabled={!hasFile}
                className="def-btn def-btn--rose" title="Remove everything added to the page">
                <Trash2 size={14} strokeWidth={2} /> Clear
              </button>
              <button type="button" onClick={download} disabled={!hasFile || loading}
                className="def-btn def-btn--mint" title="Download PDF (keeps the handwriting as drawn)">
                <Download size={14} strokeWidth={2} /> Download
              </button>
            </div>
            <div className="def-row">
              <button type="button" onClick={handleSave} disabled={!hasFile || !pdfBase64 || !txnId || saving || loading}
                className="def-btn def-btn--sky">
                <Save size={14} strokeWidth={2} /> {saving ? "Saving…" : currentFormId ? "Update form" : "Save form"}
              </button>
            </div>
            {!txnId ? (
              <div className="def-note" style={{ color: "#be123c" }}>
                No patient linked. Open this form from a patient's menu to save it.
              </div>
            ) : hasFile && !pdfBase64 && (
              <div className="def-note">Download first, then Save.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DigitalEditForm;