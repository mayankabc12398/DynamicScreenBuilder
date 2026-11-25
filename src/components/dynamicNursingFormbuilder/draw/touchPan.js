/**
 * Scrolling over the draw layer on tablets. The draw surface takes every
 * pointer (touch-action: none) so a stroke never scrolls the page; this gives
 * scrolling back without losing that:
 *
 *   two fingers   always pan the pages, and pinch zooms; whatever the first
 *                 finger had started (a stroke, an eraser drag) is dropped
 *   one finger    pans with the Hand tool, or when "Finger: scroll" is on
 *                 (a stylus draws, a finger scrolls — useDrawTool fingerScrolls)
 *   mouse         drags pan with the Hand tool
 *
 * Palm rejection — the hand resting on the screen while writing does nothing:
 *   - a touch with a palm-sized contact (PALM_PX) is ignored until it lifts, and
 *     a finger touch that spreads to palm size mid-stroke drops that stroke
 *   - while a stylus is down (and a moment after) every touch is ignored
 *   - a touch landing while a finger has already been drawing for a moment is a
 *     palm, not the second finger of a scroll (those land together): ignored,
 *     the stroke goes on
 *
 * Panning is done here with scrollBy (plus a short glide after a flick) and is
 * shared by every page's surface, because two fingers can land on two pages.
 */
const PALM_PX = 38; // contact width / height in CSS px: a fingertip is ~8–25, a palm 40+
const SECOND_FINGER_MS = 180; // a second finger later than this, while the first draws, is a palm
const PEN_GRACE_MS = 600; // touches right after the stylus lifts are still the writing hand

const touches = new Map(); // pointerId -> { x, y, t0 } of every live (not ignored) touch
const held = new Set(); // touches that belong to a two-finger gesture, ignored until lifted
const ignored = new Set(); // palm touches, ignored until lifted
const surfaces = new Set(); // { cancel, busy } of each page's surface
let pinch = null; // { scroller, x, y, d, onZoom }
let first = null; // { el, onZoom } of the surface the first finger is on
let glide = 0;
let watching = false;
let penDown = false;
let penUntil = 0;
let lastIgnoredAt = 0;

const now = () => performance.now();
const palmSized = (e) => Math.max(e.width || 0, e.height || 0) > PALM_PX;
const penBusy = () => penDown || now() < penUntil;
const ignore = (e) => {
  ignored.add(e.pointerId);
  lastIgnoredAt = now();
  return true;
};

/** A surface (or the window) calls it for every stylus down / up, so the resting hand is ignored meanwhile. */
export function notePen(e) {
  if (e.pointerType !== "pen") return;
  if (e.type === "pointerdown") penDown = true;
  else {
    penDown = false;
    penUntil = now() + PEN_GRACE_MS;
  }
}

/** True right after a palm touch: its tap must not become a double-click text box. */
export const palmJustNow = () => now() - lastIgnoredAt < 500;

/**
 * The second finger may land off the page (the grey margin, a field): the window
 * sees it in the capture phase and still turns the touch into a pan. Moves and
 * lifts of gesture fingers are followed here too; a surface seeing the same event
 * again is harmless (no movement the second time, the finger already released).
 */
function watchWindow() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  window.addEventListener(
    "pointerdown",
    (e) => {
      notePen(e);
      if (e.pointerType !== "touch" || !touches.size || touches.has(e.pointerId) || e.target?.closest?.(".nfb-drawsurface")) return;
      touchDown(e, first?.el, first?.onZoom);
    },
    true,
  );
  window.addEventListener("pointermove", (e) => held.has(e.pointerId) && touchMove(e), true);
  const lift = (e) => {
    notePen(e);
    if ((touches.has(e.pointerId) || ignored.has(e.pointerId)) && !e.target?.closest?.(".nfb-drawsurface")) touchUp(e);
  };
  window.addEventListener("pointerup", lift, true);
  window.addEventListener("pointercancel", lift, true);
}

const stopGlide = () => cancelAnimationFrame(glide);

/** The element that scrolls the pages: the patient form or the designer canvas. */
export const scrollerOf = (el) => el?.closest(".nfb-render-scroll, .nfb-canvas") || null;

/**
 * A surface registers how to abandon its current operation and whether it is in
 * the middle of one (drawing, erasing, moving); returns the unregister.
 */
export function registerSurface(cancel, busy = () => false) {
  const s = { cancel, busy };
  surfaces.add(s);
  return () => surfaces.delete(s);
}
const anyBusy = () => [...surfaces].some((s) => s.busy());

function spread() {
  const [a, b] = [...touches.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
}

/**
 * A pointer went down. True when the surface must leave it alone: a palm (ignored
 * until it lifts) or the second finger of a pan / pinch (handled here).
 */
export function touchDown(e, el, onZoom) {
  watchWindow();
  notePen(e);
  if (e.pointerType !== "touch") return false;
  if (palmSized(e) || penBusy()) return ignore(e);
  stopGlide();
  if (touches.size >= 1) {
    // a finger that has been drawing a while: this new contact is the hand, not a second finger
    const oldest = Math.min(...[...touches.values()].map((t) => t.t0));
    if (anyBusy() && now() - oldest > SECOND_FINGER_MS) return ignore(e);
  }
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY, t0: now() });
  if (touches.size < 2) {
    first = { el, onZoom };
    return false;
  }
  surfaces.forEach((s) => s.cancel());
  touches.forEach((_, id) => held.add(id));
  const m = spread();
  pinch = { scroller: scrollerOf(el || first?.el), x: m.x, y: m.y, d: m.d, onZoom: onZoom || first?.onZoom };
  return true;
}

/** True when the surface must ignore the move: a palm, or part of a two-finger gesture (handled here). */
export function touchMove(e) {
  if (ignored.has(e.pointerId)) return true;
  if (!touches.has(e.pointerId)) return false;
  if (palmSized(e)) {
    // the contact spread out: a palm that came down small — drop what it was drawing
    touches.delete(e.pointerId);
    held.delete(e.pointerId);
    if (touches.size < 2) pinch = null;
    surfaces.forEach((s) => s.cancel());
    return ignore(e);
  }
  const t = touches.get(e.pointerId);
  touches.set(e.pointerId, { ...t, x: e.clientX, y: e.clientY });
  if (!held.has(e.pointerId)) return false;
  if (pinch && touches.size >= 2) {
    const m = spread();
    pinch.scroller?.scrollBy(pinch.x - m.x, pinch.y - m.y);
    pinch.x = m.x;
    pinch.y = m.y;
    const r = m.d / Math.max(1, pinch.d);
    if (r > 1.25 || r < 0.8) {
      pinch.onZoom?.(r > 1 ? 1 : -1);
      pinch.d = m.d;
    }
  }
  return true;
}

/** A pointer lifted / was cancelled: true when the surface must ignore it (a palm, or part of a gesture). */
export function touchUp(e) {
  notePen(e);
  if (ignored.delete(e.pointerId)) return true;
  touches.delete(e.pointerId);
  const was = held.delete(e.pointerId);
  if (touches.size < 2) pinch = null;
  if (!touches.size) first = null;
  return was;
}

/** One-finger (or mouse) pan: start, move, end — the end glides on after a flick. */
export function startPan(e, el) {
  stopGlide();
  return { kind: "pan", scroller: scrollerOf(el), x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
}

export function movePan(o, e) {
  const dx = e.clientX - o.x;
  const dy = e.clientY - o.y;
  o.scroller?.scrollBy(-dx, -dy);
  const now = performance.now();
  const dt = Math.max(1, now - o.t);
  o.vx = 0.8 * (dx / dt) + 0.2 * o.vx; // px per ms, smoothed
  o.vy = 0.8 * (dy / dt) + 0.2 * o.vy;
  o.x = e.clientX;
  o.y = e.clientY;
  o.t = now;
}

export function endPan(o) {
  if (!o.scroller || performance.now() - o.t > 80) return; // finger rested before lifting: no glide
  let { vx, vy } = o;
  let last = performance.now();
  const step = (now) => {
    const dt = Math.min(32, now - last);
    last = now;
    o.scroller.scrollBy(-vx * dt, -vy * dt);
    const k = Math.pow(0.94, dt / 16);
    vx *= k;
    vy *= k;
    if (Math.hypot(vx, vy) > 0.03) glide = requestAnimationFrame(step);
  };
  glide = requestAnimationFrame(step);
}
