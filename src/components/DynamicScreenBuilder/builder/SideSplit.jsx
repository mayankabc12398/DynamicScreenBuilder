import React, { useCallback, useRef, useState } from "react";

/**
 * The left column's two sections — the palette above, the layers tree below —
 * with a bar between them that slides up and down.
 *
 * A screen with forty controls wants most of the column for its layers; a new
 * screen wants most of it for the palette. The split used to be fixed at
 * 55/45. Now the bar is dragged (or nudged with the arrow keys), a
 * double-click puts it back, and where it was left is remembered per browser.
 *
 * The share is the palette's part of the column, 0–1. When either section is
 * folded the bar hides (CSS, via :has) and the open section takes the column.
 */
const KEY = "dsb.split.left";
const DEFAULT = 0.55;
const MIN = 0.12;
const MAX = 0.88;
const clamp = (n) => Math.min(MAX, Math.max(MIN, n));

const readShare = () => {
  try {
    const n = parseFloat(window.localStorage.getItem(KEY));
    return Number.isFinite(n) ? clamp(n) : DEFAULT;
  } catch {
    return DEFAULT;
  }
};
const saveShare = (n) => {
  try {
    window.localStorage.setItem(KEY, String(n));
  } catch {
    /* not remembered — the bar still moves for this session */
  }
};

export default function SideSplit({ top, bottom }) {
  const boxRef = useRef(null);
  const [share, setShare] = useState(readShare);
  const [dragging, setDragging] = useState(false);

  const place = useCallback((n) => {
    const next = clamp(n);
    setShare(next);
    saveShare(next);
  }, []);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    const box = boxRef.current?.getBoundingClientRect();
    if (!box || !box.height) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    const move = (ev) => place((ev.clientY - box.top) / box.height);
    const end = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <div
      ref={boxRef}
      className={`dsb-side-left ${dragging ? "is-splitting" : ""}`}
      style={{ "--dsb-pal-share": share }}
    >
      {top}
      <div
        className={`dsb-side-grip ${dragging ? "is-on" : ""}`}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize the components and layers sections"
        aria-valuenow={Math.round(share * 100)}
        aria-valuemin={Math.round(MIN * 100)}
        aria-valuemax={Math.round(MAX * 100)}
        tabIndex={0}
        title="Drag up or down to resize — double-click to reset"
        onPointerDown={startDrag}
        onDoubleClick={() => place(DEFAULT)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") place(share - 0.05);
          else if (e.key === "ArrowDown") place(share + 0.05);
          else return;
          e.preventDefault();
        }}
      >
        <span />
      </div>
      {bottom}
    </div>
  );
}
