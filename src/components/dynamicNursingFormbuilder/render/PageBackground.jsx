/**
 * The uploaded file as a page background: one PDF page drawn into a canvas
 * (re-drawn when `density` changes, so zoomed pages stay sharp) or the image.
 * Shows a shimmer until the page is painted, then fades it in.
 *
 * Speed: a page is drawn only once it comes near the visible part of its scroll
 * area (and redrawn for a new zoom only then), at most MAX_PIXELS, and only after
 * the zoom has settled — big zooms in full screen stay smooth.
 */
import React, { memo, useEffect, useRef, useState } from "react";

const MAX_PIXELS = 5_000_000; // ~ A4 at 9.5 px / mm: sharp at full screen, a fraction of the memory
const SCROLLERS = ".nfb-render-scroll, .nfb-canvas, .nfb-viewer-scroll, .nfb-thumbs, .nfb-dialog-body";
import { loadPdf, renderPage } from "../lib/pdf";

function PageBackground({ fileUrl, fileType, page = 1, density = 4, rotate = 0 }) {
  const canvas = useRef(null);
  const box = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [near, setNear] = useState(typeof IntersectionObserver === "undefined");
  const drawn = useRef(false); // the first draw goes at once; redraws for a new zoom wait for it to settle

  // near = within a screen of the visible part of the scroll area
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { root: el.closest(SCROLLERS), rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (fileType !== "pdf" || !fileUrl || !near) return undefined;
    let task = null;
    let dead = false;
    setError("");
    const t = setTimeout(async () => {
      try {
        const doc = await loadPdf(fileUrl);
        if (dead || !canvas.current) return;
        // drawn off screen, then swapped in at once: a zoom never flashes a blank page
        const off = document.createElement("canvas");
        task = await renderPage(doc, page, off, Math.min(density, 16), MAX_PIXELS);
        await task.promise;
        if (dead || !canvas.current) return;
        const c = canvas.current;
        c.width = off.width;
        c.height = off.height;
        c.getContext("2d").drawImage(off, 0, 0);
        drawn.current = true;
        setReady(true);
      } catch (e) {
        if (!dead && e?.name !== "RenderingCancelledException") setError(e?.message || "Could not draw the page.");
      }
    }, drawn.current ? 140 : 0); // a redraw lets the zoom (and its 0.28 s ease) settle first
    return () => {
      dead = true;
      clearTimeout(t);
      task?.cancel?.();
    };
  }, [fileUrl, fileType, page, density, near]);

  useEffect(() => {
    setReady(false);
    drawn.current = false;
  }, [fileUrl, page]);

  const st = rotate ? { transform: `rotate(${rotate}deg)` } : undefined;
  return (
    <div ref={box} className={`nfb-pagebg${ready ? " is-ready" : ""}`}>
      {!ready && !error && <span className="nfb-pagebg-shimmer" />}
      {error && <span className="nfb-pagebg-error">{error}</span>}
      {fileType === "pdf" ? (
        <canvas ref={canvas} style={st} />
      ) : fileUrl ? (
        <img src={fileUrl} alt="" draggable={false} style={st} onLoad={() => setReady(true)} onError={() => setError("The image could not be loaded.")} />
      ) : null}
    </div>
  );
}

export default memo(PageBackground);
