/**
 * Drag handle that resizes a side panel of the designer.
 *
 * The width lives in a CSS variable on the grid container (`--pbx-lw` /
 * `--pbx-rw`). While dragging, the variable is written straight to the DOM
 * once per animation frame, so React does not re-render the canvas on every
 * pointer move; the final width is saved to localStorage on release.
 * Double-click resets the default; arrow keys move it 16px (Shift: 64px).
 * The small button on the handle collapses the panel to a rail (PanelRail);
 * dragging the edge well past the minimum collapses it too.
 */
import React, { useEffect, useRef } from "react";
import Icon from "./Icon";
import Tap from "./Tap";
import { zoomOf } from "./zoom";

export const PANEL_SIZES = {
  left: { cssVar: "--pbx-lw", key: "pbx.leftWidth", def: 268, min: 210, max: 560 },
  right: { cssVar: "--pbx-rw", key: "pbx.rightWidth", def: 318, min: 260, max: 640 },
};

const clamp = (v, s) => Math.round(Math.min(s.max, Math.max(s.min, v)));
const COLLAPSE_KEY = "pbx.collapsed";

/** { left: bool, right: bool } as last left by this user. */
export function savedCollapsed() {
  try {
    const v = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "{}");
    return { left: !!v.left, right: !!v.right };
  } catch {
    return { left: false, right: false };
  }
}

export function saveCollapsed(v) {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(v));
  } catch {
    /* storage blocked: state still applies for this session */
  }
}

export function savedPanelWidth(side) {
  const s = PANEL_SIZES[side];
  try {
    const v = Number(localStorage.getItem(s.key));
    return v ? clamp(v, s) : s.def;
  } catch {
    return s.def;
  }
}

/** Inline style for the grid container with the saved widths. */
export function panelWidthStyle() {
  return {
    [PANEL_SIZES.left.cssVar]: `${savedPanelWidth("left")}px`,
    [PANEL_SIZES.right.cssVar]: `${savedPanelWidth("right")}px`,
  };
}

export default function Splitter({ side, containerRef, onCollapse }) {
  const s = PANEL_SIZES[side];
  const ref = useRef(null);
  const width = useRef(savedPanelWidth(side));

  const apply = (w, save) => {
    width.current = clamp(w, s);
    containerRef.current?.style.setProperty(s.cssVar, `${width.current}px`);
    ref.current?.setAttribute("aria-valuenow", String(width.current));
    if (save) {
      try {
        localStorage.setItem(s.key, String(width.current));
      } catch {
        /* storage blocked: width still applies for this session */
      }
      // let the canvas and anything measuring its box catch up once
      window.dispatchEvent(new Event("resize"));
    }
  };

  useEffect(() => {
    apply(width.current, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest(".pbx-split-btn")) return;
    e.preventDefault();
    const el = ref.current;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startW = width.current;
    const z = zoomOf(el); // panel widths are CSS pixels inside the zoomed builder
    let frame = 0;
    let next = startW;
    document.body.classList.add("pbx-resizing");
    el.classList.add("is-dragging");
    const move = (ev) => {
      const dx = (ev.clientX - startX) / z;
      next = side === "left" ? startW + dx : startW - dx;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          apply(next, false);
        });
    };
    const up = () => {
      cancelAnimationFrame(frame);
      if (onCollapse && next < s.min - 80) {
        apply(startW, false);
        onCollapse();
      } else apply(next, true);
      document.body.classList.remove("pbx-resizing");
      el.classList.remove("is-dragging");
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 64 : 16;
    const grow = side === "left" ? "ArrowRight" : "ArrowLeft";
    const shrink = side === "left" ? "ArrowLeft" : "ArrowRight";
    if (e.key === grow) apply(width.current + step, true);
    else if (e.key === shrink) apply(width.current - step, true);
    else if (e.key === "Home") apply(s.min, true);
    else if (e.key === "End") apply(s.max, true);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={ref}
      className={`pbx-splitter is-${side}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={side === "left" ? "Resize the left panel" : "Resize the properties panel"}
      aria-valuemin={s.min}
      aria-valuemax={s.max}
      aria-valuenow={width.current}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={onPointerDown}
      onDoubleClick={() => apply(s.def, true)}
      onKeyDown={onKeyDown}
    >
      <i />
      {onCollapse && (
        <Tap
          className="pbx-split-btn"
          title={side === "left" ? "Hide the left panel" : "Hide the properties panel"}
          onClick={onCollapse}
        >
          <Icon name="back" size={12} style={side === "right" ? { transform: "scaleX(-1)" } : undefined} />
        </Tap>
      )}
    </div>
  );
}

/** Slim strip shown in place of a collapsed panel; click anywhere on it to bring the panel back. */
export function PanelRail({ side, label, items = [], onExpand }) {
  return (
    <div className={`pbx-rail is-${side}`}>
      <Tap className="pbx-rail-open" title={`Show ${label.toLowerCase()}`} onClick={() => onExpand()}>
        <Icon name={side === "left" ? "panelL" : "panelR"} size={16} style={{ transform: "scaleX(-1)" }} />
      </Tap>
      {items.map((it) => (
        <Tap key={it.id} className={`pbx-rail-item tone-${it.tone}`} title={it.label} onClick={() => onExpand(it.id)}>
          <Icon name={it.icon} size={15} />
        </Tap>
      ))}
      <span className="pbx-rail-label" onClick={() => onExpand()}>
        {label}
      </span>
    </div>
  );
}
