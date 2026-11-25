/**
 * Pointer-based drag & drop engine for the canvas.
 *
 * Why not HTML5 drag events: they give a poor drag image, no control over the
 * drop indicator, and fire far too rarely for smooth guides. This manager uses
 * pointer events, updates the ghost by writing `transform` directly to the DOM
 * (never through React state, so no re-render per mousemove), and only pushes
 * state when the resolved drop target actually changes.
 *
 * DOM contract, set by the canvas node wrapper:
 *   data-dsb-node="<id>"        every rendered node wrapper
 *   data-dsb-type="<type>"      its registry type
 *   data-dsb-container="1"      when the registry says it can hold children
 *   data-dsb-parent="<id>"      the wrapper's parent node id
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { canDrop, getDef } from "../registry";
import Icon from "../registry/icons";

const DndCtx = createContext(null);
export const useDnd = () => useContext(DndCtx);

const EDGE = 0.5; // fraction of a child's size that flips "before" to "after"

/** Is `el` inside the subtree currently being dragged? */
function insideSubtree(el, nodeId) {
  if (!nodeId) return false;
  let cur = el;
  while (cur) {
    if (cur.dataset && cur.dataset.dsbNode === nodeId) return true;
    cur = cur.parentElement;
  }
  return false;
}

function childWrappers(parentId) {
  return Array.from(document.querySelectorAll(`[data-dsb-parent="${parentId}"]`));
}

/**
 * Where does a pointer at (x, y) fall among a set of sibling rectangles?
 *
 * Pure geometry, kept out of resolveDrop so it can be reasoned about (and
 * checked) without a document. `rects` must exclude the node being dragged, so
 * the index it returns is already in post-detach terms — what moveNode wants.
 *
 * @returns {{index:number, anchor:DOMRect, after:boolean, horizontal:boolean}}
 */
export function slotFromRects(rects, x, y) {
  const horizontal =
    rects.length > 1 && Math.abs(rects[1].top - rects[0].top) < Math.max(8, rects[0].height * 0.5);

  let index = rects.length;
  let anchor = rects[rects.length - 1];
  let after = true;

  if (!horizontal) {
    for (let i = 0; i < rects.length; i += 1) {
      const r = rects[i];
      if (y < r.top + r.height * EDGE) {
        index = i;
        anchor = r;
        after = false;
        break;
      }
    }
    return { index, anchor, after, horizontal };
  }

  // A row wraps, so x alone cannot place the pointer: with six cards on two
  // visual lines, an x over the second card of the bottom line is equally an x
  // over the second card of the top one — and the top one always won, because
  // the scan ran in child order and stopped at the first match. So group the
  // children into the lines they actually occupy, choose the line by y, and
  // only then compare x within it.
  const lines = [];
  rects.forEach((r, i) => {
    const line = lines[lines.length - 1];
    const overlap = line ? Math.min(r.bottom, line.bottom) - Math.max(r.top, line.top) : 0;
    if (line && overlap > Math.min(r.height, line.bottom - line.top) * 0.5) {
      line.items.push(i);
      line.top = Math.min(line.top, r.top);
      line.bottom = Math.max(line.bottom, r.bottom);
    } else {
      lines.push({ top: r.top, bottom: r.bottom, items: [i] });
    }
  });

  // Above every line -> the first, below every line -> the last. Both are
  // clamps, so the container's own padding still resolves to a real slot.
  const line = lines.find((l) => y < l.bottom) || lines[lines.length - 1];
  const lastInLine = line.items[line.items.length - 1];
  index = lastInLine + 1;
  anchor = rects[lastInLine];
  for (let i = 0; i < line.items.length; i += 1) {
    const at = line.items[i];
    const r = rects[at];
    if (x < r.left + r.width * EDGE) {
      index = at;
      anchor = r;
      after = false;
      break;
    }
  }
  return { index, anchor, after, horizontal };
}

/** Work out which container the pointer is over, and where inside it. */
function resolveDrop(x, y, dragType, movingId) {
  const stack = document.elementsFromPoint(x, y);
  let container = null;

  for (let i = 0; i < stack.length; i += 1) {
    const el = stack[i];
    if (!el.closest) continue;
    let cand = el.closest('[data-dsb-container="1"]');
    // Never drop into the node being dragged (or its own descendants).
    while (cand && (insideSubtree(cand, movingId) || !canDrop(cand.dataset.dsbType, dragType))) {
      cand = cand.parentElement ? cand.parentElement.closest('[data-dsb-container="1"]') : null;
    }
    if (cand) {
      container = cand;
      break;
    }
  }
  if (!container) return null;

  const parentId = container.dataset.dsbNode;
  const kids = childWrappers(parentId).filter((k) => !insideSubtree(k, movingId));
  const box = container.getBoundingClientRect();

  if (!kids.length) {
    return {
      parentId,
      index: 0,
      hint: { left: box.left + 4, top: box.top + 4, width: box.width - 8, height: box.height - 8, kind: "box" },
    };
  }

  const { index, anchor, after, horizontal } = slotFromRects(
    kids.map((k) => k.getBoundingClientRect()),
    x,
    y,
  );

  const hint = horizontal
    ? {
        left: (after ? anchor.right : anchor.left) - 1,
        top: anchor.top,
        width: 2,
        height: anchor.height,
        kind: "line",
      }
    : {
        left: anchor.left,
        top: (after ? anchor.bottom : anchor.top) - 1,
        width: anchor.width,
        height: 2,
        kind: "line",
      };

  return { parentId, index, hint };
}

export function DndProvider({ onDrop, children }) {
  const [dragging, setDragging] = useState(null); // {kind, type, label, icon, nodeId}
  const [target, setTarget] = useState(null);
  const ghostRef = useRef(null);
  const rafRef = useRef(0);
  const pointRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const targetRef = useRef(null);
  const movedRef = useRef(false);

  const tick = useCallback(() => {
    rafRef.current = 0;
    const { x, y } = pointRef.current;
    if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${x + 14}px, ${y + 14}px, 0)`;
    const d = dragRef.current;
    if (!d) return;
    const next = resolveDrop(x, y, d.type, d.kind === "move" ? d.nodeId : null);
    const prev = targetRef.current;
    // Re-render only when the slot OR the indicator geometry actually moved.
    const same =
      (!next && !prev) ||
      (next &&
        prev &&
        next.parentId === prev.parentId &&
        next.index === prev.index &&
        Math.abs(next.hint.left - prev.hint.left) < 0.5 &&
        Math.abs(next.hint.top - prev.hint.top) < 0.5 &&
        Math.abs(next.hint.width - prev.hint.width) < 0.5 &&
        Math.abs(next.hint.height - prev.hint.height) < 0.5);
    targetRef.current = next;
    if (!same) setTarget(next);
  }, []);

  const onMove = useCallback(
    (e) => {
      pointRef.current = { x: e.clientX, y: e.clientY };
      movedRef.current = true;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  // Handlers are kept in a ref so add/removeEventListener always see the same
  // function reference (an inline arrow would leak a listener per drag).
  const handlersRef = useRef({});

  const finish = useCallback(
    (commit) => {
      const h = handlersRef.current;
      window.removeEventListener("pointermove", h.move);
      window.removeEventListener("pointerup", h.up);
      window.removeEventListener("pointercancel", h.cancel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      const d = dragRef.current;
      const t = targetRef.current;
      dragRef.current = null;
      targetRef.current = null;
      setDragging(null);
      setTarget(null);
      document.body.classList.remove("dsb-dragging");
      if (commit && d && t && onDrop) onDrop({ ...d, parentId: t.parentId, index: t.index });
    },
    [onDrop],
  );

  /**
   * Begin a drag.
   * @param payload {kind:"create"|"move", type, label, icon, nodeId}
   */
  const startDrag = useCallback(
    (payload, e) => {
      if (e && e.button !== undefined && e.button !== 0) return;
      dragRef.current = payload;
      movedRef.current = false;
      pointRef.current = { x: e?.clientX ?? 0, y: e?.clientY ?? 0 };
      setDragging(payload);
      document.body.classList.add("dsb-dragging");
      handlersRef.current = {
        move: onMove,
        up: () => finish(true),
        cancel: () => finish(false),
      };
      window.addEventListener("pointermove", handlersRef.current.move);
      window.addEventListener("pointerup", handlersRef.current.up);
      window.addEventListener("pointercancel", handlersRef.current.cancel);
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    },
    [onMove, tick, finish],
  );

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.body.classList.remove("dsb-dragging");
    },
    [],
  );

  const value = useMemo(() => ({ dragging, target, startDrag }), [dragging, target, startDrag]);

  const def = dragging ? getDef(dragging.type) : null;

  return (
    <DndCtx.Provider value={value}>
      {children}
      {/* The ghost and the drop indicator are positioned in viewport
          coordinates, so they are portalled to <body> — a transformed
          ancestor (page-fade animations, the canvas zoom wrapper) would
          otherwise become their containing block and offset them. */}
      {dragging
        ? createPortal(
            <>
              <div className="dsb-ghost" ref={ghostRef}>
                <Icon name={dragging.icon || def?.icon || "Sparkles"} size={14} />
                <span>{dragging.label || def?.label || dragging.type}</span>
              </div>
              {target ? (
                <div
                  className={`dsb-dropind ${target.hint.kind === "box" ? "is-box" : "is-line"}`}
                  style={{
                    left: target.hint.left,
                    top: target.hint.top,
                    width: target.hint.width,
                    height: target.hint.height,
                  }}
                />
              ) : null}
            </>,
            document.body,
          )
        : null}
    </DndCtx.Provider>
  );
}

export default DndProvider;
