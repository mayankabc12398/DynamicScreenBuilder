/**
 * Draw a signature with mouse, pen or finger. Saves a trimmed PNG plus,
 * optionally, the signer's name and the time, which print under it.
 * `initial` (the field's saved signature) is loaded back into the box, so
 * reopening a signed field shows the signature to keep, add to or clear.
 * Saved: { image, name, at, showName, showTime } - name / at are "" when off.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { Dialog, Switch, TextInput } from "../ui/kit";
import Tap from "../ui/Tap";

export default function SignaturePad({ open, label, defaultName, initial, onClose, onSave }) {
  const canvas = useRef(null);
  // The Dialog mounts its body a render after `open` turns on, so the canvas
  // can arrive after the effect below first runs: track it as state and run
  // the paint / resize watch once it is really there.
  const [canvasEl, setCanvasEl] = useState(null);
  const canvasRef = useCallback((node) => {
    canvas.current = node;
    setCanvasEl(node);
  }, []);
  const last = useRef(null);
  const base = useRef(null); // the saved signature, redrawn whenever the bitmap is repainted
  const inked = useRef(false); // drawn on since the last paint
  const [name, setName] = useState(defaultName || "");
  const [showName, setShowName] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [now, setNow] = useState(() => moment().format("DD-MMM-YYYY hh:mm A"));

  // The bitmap follows the canvas's layout size (clientWidth/Height), not its
  // on-screen rect: the dialog opens with a scale animation, and a rect taken
  // then is smaller than the box, which stretched the ink off to the right.
  // paint() sizes the bitmap, wipes it (identity transform, so nothing is left
  // over from an earlier open or size) and puts the saved signature back once.
  const paint = () => {
    const c = canvas.current;
    if (!c || !c.clientWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(c.clientWidth * dpr);
    const h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const g = c.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = "#1e3a8a";
    g.lineWidth = 2.2;
    inked.current = false;
    setDirty(drawBase(g, c, dpr));
  };
  // A resize clears the bitmap: repaint (strokes since the last paint are lost, as before).
  const fit = () => {
    const c = canvas.current;
    if (!c || !c.clientWidth) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(c.clientWidth * dpr) || c.height !== Math.round(c.clientHeight * dpr)) paint();
  };

  // The saved (trimmed) signature at its own size - 1 image px per device px,
  // so it stays sharp - near the left like where it was signed, centred
  // vertically; scaled down only if it is bigger than the box.
  const drawBase = (g, c, dpr) => {
    const img = base.current;
    if (!img || !img.complete || !img.naturalWidth) return false;
    const pad = 12;
    const k = Math.min(1, (c.clientWidth - pad * 2) / (img.naturalWidth / dpr), (c.clientHeight - pad * 2) / (img.naturalHeight / dpr));
    const w = (img.naturalWidth / dpr) * k;
    const h = (img.naturalHeight / dpr) * k;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, pad, (c.clientHeight - h) / 2, w, h);
    return true;
  };

  useEffect(() => {
    if (!open) return undefined;
    setName(initial?.name || defaultName || "");
    setShowName(initial?.showName ?? true);
    setShowTime(initial?.showTime ?? true);
    setNow(moment().format("DD-MMM-YYYY hh:mm A"));
    setDirty(false);
    base.current = null;
    if (initial?.image) {
      const img = new Image();
      // loaded after the first paint: paint again, unless they've started signing
      img.onload = () => {
        if (base.current === img && !inked.current) paint();
      };
      img.src = initial.image;
      base.current = img;
    }
    const raf = requestAnimationFrame(paint);
    const ro = new ResizeObserver(() => fit());
    if (canvasEl) ro.observe(canvasEl);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [open, defaultName, initial, canvasEl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pointer → canvas px: undo any CSS scale on the way, then step inside the border.
  const pt = (e) => {
    const c = canvas.current;
    const r = c.getBoundingClientRect();
    const k = r.width ? c.offsetWidth / r.width : 1;
    return { x: (e.clientX - r.left) * k - c.clientLeft, y: (e.clientY - r.top) * k - c.clientTop };
  };
  const down = (e) => {
    fit();
    inked.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = { ...pt(e), mid: pt(e) };
  };
  const move = (e) => {
    if (!last.current) return;
    const g = canvas.current.getContext("2d");
    const p = pt(e);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    g.beginPath();
    g.moveTo(last.current.mid.x, last.current.mid.y);
    g.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    g.stroke();
    last.current = { ...p, mid };
    if (!dirty) setDirty(true);
  };
  // The smoothed curve trails half a segment behind the pen; finish it at the pen.
  const up = () => {
    const l = last.current;
    last.current = null;
    if (!l || (l.x === l.mid.x && l.y === l.mid.y)) return;
    const g = canvas.current.getContext("2d");
    g.beginPath();
    g.moveTo(l.mid.x, l.mid.y);
    g.lineTo(l.x, l.y);
    g.stroke();
  };
  const clear = () => {
    base.current = null; // a cleared box stays clear on resize
    paint();
  };
  const save = () =>
    onSave({
      image: trimmed(canvas.current),
      name: showName ? name.trim() : "",
      at: showTime ? moment().format("DD-MMM-YYYY hh:mm A") : "",
      showName,
      showTime,
    });

  return (
    <Dialog
      open={open}
      title={label || "Signature"}
      subtitle="Sign inside the box — your name and the time can be stamped under it"
      icon="sign"
      tone="rose"
      width={540}
      onClose={onClose}
      footer={
        <>
          <Tap variant="ghost" icon="eraser" onClick={clear}>
            Clear
          </Tap>
          <span className="nfb-grow" />
          <Tap variant="soft" onClick={onClose}>
            Cancel
          </Tap>
          <Tap variant="solid" tone="indigo" icon="check" disabled={!dirty} onClick={save}>
            Use signature
          </Tap>
        </>
      }
    >
      <canvas ref={canvasRef} className="nfb-sigpad" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <div className="nfb-sig-opts">
        <div className="nfb-sig-opt">
          <Switch checked={showName} onChange={setShowName} label="Show name" />
          <TextInput value={name} onChange={setName} placeholder="Signed by (optional)" disabled={!showName} />
        </div>
        <div className="nfb-sig-opt">
          <Switch checked={showTime} onChange={setShowTime} label="Show date & time" />
          <span className={`nfb-sig-time${showTime ? "" : " is-off"}`}>{now}</span>
        </div>
        {(showName && name.trim()) || showTime ? (
          <div className="nfb-sig-preview">
            Stamp: <b>{[showName && name.trim(), showTime && now].filter(Boolean).join(" · ")}</b>
          </div>
        ) : (
          <div className="nfb-sig-preview">No stamp: only the signature prints.</div>
        )}
      </div>
    </Dialog>
  );
}

/** The canvas cropped to the ink, as a PNG data URL. */
function trimmed(c) {
  const g = c.getContext("2d");
  const { width: w, height: h } = c;
  const px = g.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 <= x0 || y1 <= y0) return c.toDataURL("image/png");
  const pad = 6;
  const out = document.createElement("canvas");
  out.width = x1 - x0 + pad * 2;
  out.height = y1 - y0 + pad * 2;
  out.getContext("2d").drawImage(c, x0 - pad, y0 - pad, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}
