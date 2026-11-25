/**
 * The layer that takes the pointer while Draw is on — Paint behaviour on one page:
 *
 *   select     click a mark, drag to move, handles to resize, Del to delete
 *   brush      pencil / brush / marker / highlighter, freehand and smoothed
 *   shapes     drag a box (Shift = square); line (Shift = 45°); curve = drag the
 *              line, then drag again to bend it; polygon = click points, double-click
 *   eraser     drag over marks to remove them
 *   fill       click a shape to fill it (outline colour for lines)
 *   picker     takes a colour from a mark, or from the form underneath
 *   text       click to type; click a text again to edit it
 *   zoom       click = in, right-click = out
 *   dbl-click  anywhere (any tool but text / polygon): a text box right there
 *   drag text  with the brush, shape or text tool, press on a text and drag it;
 *              a plain click with the text tool edits it
 *   images     inserted from the toolbar (or pasted) land selected, ready to move / resize
 *   hand       drag pans the pages (no marks)
 *   touch      two fingers pan / pinch-zoom in any tool; one finger pans too when
 *              "Finger: scroll" is on (stylus draws) — see touchPan.js
 *
 * Left button draws in colour 1. Right-click (a long-press on touch) opens a small
 * menu to put a ✔ / ✘ mark or a text right there; the picker, fill and magnifier
 * keep the right button for colour 2 / zoom out.
 * Marks go through apply/live/checkpoint so each one is a single undo step.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DrawItem } from "./DrawLayer";
import { bbox, drawId, hitTest, isClosed, moveBy, refit, topHit } from "./shapes";
import { MARKS, fingerScrolls, sizeOf } from "./useDrawTool";
import Tap from "../ui/Tap";
import Icon from "../ui/Icon";
import FontSize from "./FontSize";
import { endPan, movePan, palmJustNow, registerSurface, startPan, touchDown, touchMove, touchUp } from "./touchPan";

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export default function DrawSurface({ page, size, items, ts, setTs, apply, live, checkpoint, sel, setSel, onZoom, onEditing }) {
  const ref = useRef(null);
  const op = useRef(null);
  const [draft, setDraft] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [poly, setPoly] = useState(null); // polygon or curve waiting for the next click
  const [overText, setOverText] = useState(false);
  const [panning, setPanning] = useState(false);
  const [menu, setMenu] = useState(null); // right-click menu: { x, y } on screen, p in mm
  // A mark being moved / resized is drawn here, on this page only, while the original is hidden;
  // the form's marks change once, on release. (Changing them on every pointer move re-rendered
  // the whole form — every page and field — for each mouse step, so dragging stuttered.)
  const [preview, setPreview] = useState(null);
  const show = (o, it) => {
    o.last = it;
    setPreview(it);
  };
  // the host's Font size box follows the text being typed
  useEffect(() => {
    onEditing?.(editing);
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps
  const dots = useRef([]); // single-click dots wait a moment: a double-click types text instead
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const tool = ts.tool;
  const mine = items.filter((it) => it.page === page);
  const selected = mine.find((it) => it.id === sel);

  const toMm = (e) => {
    const r = ref.current.getBoundingClientRect();
    return [r2(((e.clientX - r.left) / r.width) * size.w), r2(((e.clientY - r.top) / r.height) * size.h)];
  };
  const pxPerMm = () => (ref.current ? ref.current.getBoundingClientRect().width / size.w : 4);
  const tol = () => Math.max(0.6, 4 / pxPerMm());
  // Tools that pick up a text under the pointer instead of drawing over it.
  const dragsText = (tool === "brush" || tool === "shape" || tool === "text") && !poly;
  const textAt = (p) => {
    const hit = topHit(itemsRef.current, page, p, tol());
    return hit?.kind === "text" ? hit : null;
  };
  const colors = (e) => (e.button === 2 ? [ts.c2, ts.c1] : [ts.c1, ts.c2]);
  const style = (e) => {
    const [a, b] = colors(e);
    return {
      stroke: ts.outline === "none" ? "none" : a,
      fill: ts.fill === "none" ? "" : b,
      fillOpacity: ts.fill === "half" ? 0.5 : 1,
      dash: ts.outline === "dash" ? "dash" : ts.outline === "dot" ? "dot" : "solid",
      width: sizeOf(ts, "shape"),
    };
  };
  const add = (it) => apply((list) => [...list, it]);
  const erase = (p) => {
    const t = sizeOf(ts, "eraser") / 2;
    const hit = itemsRef.current.filter((it) => it.page === page && hitTest(it, p, t)).map((it) => it.id);
    if (hit.length) live((list) => list.filter((it) => !hit.includes(it.id)));
  };

  // A second finger anywhere turns the touch into a pan, and a finger that turns out to be a
  // palm is dropped: either way this page lets go of what it had started. (Erase / move /
  // resize changes already made stay; one Undo takes them back.) `busy` tells touchPan a
  // stroke is under way, so a hand coming down meanwhile is a palm, not a second finger.
  useEffect(
    () =>
      registerSurface(
        () => {
          op.current = null;
          setDraft(null);
          setPreview(null);
          setPanning(false);
          dots.current.forEach(clearTimeout);
          dots.current = [];
        },
        () => !!op.current && op.current.kind !== "pan",
      ),
    [],
  );

  // Polygon / curve in progress end when the tool changes.
  useEffect(() => {
    setPoly(null);
    setDraft(null);
  }, [tool, ts.shape]);

  // Del removes the selected mark; Esc lets go.
  useEffect(() => {
    const k = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        e.preventDefault();
        apply((list) => list.filter((it) => it.id !== selected.id));
        setSel(null);
      } else if (e.key === "Escape") {
        setSel(null);
        setPoly(null);
        setDraft(null);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [selected, apply, setSel]);

  const down = (e) => {
    if (touchDown(e, ref.current, onZoom)) {
      e.preventDefault();
      ref.current.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0 && e.button !== 2) return;
    // preventDefault below also stops the focus change: a size still in the Font size box is
    // applied (to what it was sizing) before this press changes the selection...
    if (document.activeElement?.closest?.(".nfb-fontsize")) document.activeElement.blur();
    // ...and an open text box is committed here
    if (editing) return document.activeElement?.blur();
    // the right button opens the ✔ / ✘ menu (contextmenu below) — except where it means colour 2 / zoom out
    if (e.button === 2 && !RIGHT_BUTTON_TOOLS.includes(tool)) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const p = toMm(e);
    ref.current.setPointerCapture(e.pointerId);

    if (tool === "hand" || (e.pointerType === "touch" && fingerScrolls(ts))) {
      op.current = startPan(e, ref.current);
      setPanning(true);
      return;
    }

    if (tool === "zoom") return onZoom?.(e.button === 2 ? -1 : 1);

    // a new mark lets go of the selected one (it is no longer what Font size / Del act on)
    if (tool !== "select") setSel(null);

    if (dragsText && e.button === 0) {
      const hit = textAt(p);
      if (hit) {
        setSel(hit.id);
        op.current = { kind: "drag", base: hit, start: p, moved: false };
        return;
      }
    }

    if (tool === "picker") {
      const hit = topHit(itemsRef.current, page, p, tol());
      let c = hit ? (hit.fill && isClosed(hit) && hitTest({ ...hit, stroke: "none", width: 0 }, p, 0) ? hit.fill : hit.stroke) : sampleForm(ref.current, p, size);
      if (!c || c === "none") c = "#ffffff";
      setTs(e.button === 2 ? { c2: c } : { c1: c });
      return setTs((s) => ({ tool: s.prevTool || "brush" }));
    }

    if (tool === "fill") {
      const hit = topHit(itemsRef.current, page, p, tol());
      if (!hit || hit.kind === "image") return;
      const [a] = colors(e);
      apply((list) => list.map((it) => (it.id !== hit.id ? it : isClosed(it) ? { ...it, fill: a, fillOpacity: ts.fill === "half" ? 0.5 : 1 } : { ...it, stroke: a })));
      return;
    }

    if (tool === "eraser") {
      checkpoint();
      op.current = { kind: "erase" };
      erase(p);
      return;
    }

    if (tool === "text") {
      const hit = topHit(itemsRef.current, page, p, tol());
      if (hit?.kind === "text") {
        setSel(hit.id);
        return setEditing(hit.id);
      }
      const [a] = colors(e);
      const fs = sizeOf(ts, "text");
      const it = { id: drawId(), page, kind: "text", ...textAtPoint(p, fs), w: 3, text: "", stroke: a, fill: "", fontSize: fs };
      add(it);
      setSel(it.id);
      return setEditing(it.id);
    }

    if (tool === "select") {
      const h = e.target.dataset?.handle;
      if (h && selected) {
        checkpoint();
        op.current = { kind: "resize", h, from: bbox(selected, false), base: selected, start: p };
        return;
      }
      const hit = topHit(itemsRef.current, page, p, tol());
      setSel(hit?.id || null);
      if (hit) {
        checkpoint();
        op.current = { kind: "move", base: hit, start: p };
      }
      return;
    }

    if (tool === "brush") {
      const [a] = colors(e);
      op.current = { kind: "draw" };
      return setDraft({ id: drawId(), page, kind: "stroke", brush: ts.brush, pts: [p], stroke: a, width: sizeOf(ts) });
    }

    if (tool === "shape") {
      const s = ts.shape;
      if (s === "polygon") {
        if (poly) {
          const first = poly.pts[0];
          if (poly.pts.length > 2 && Math.hypot(p[0] - first[0], p[1] - first[1]) < tol() * 2) return finishPoly();
          return setPoly((q) => ({ ...q, pts: [...q.pts.slice(0, -1), p, p] }));
        }
        return setPoly({ id: drawId(), page, kind: "polygon", closed: false, pts: [p, p], ...style(e) });
      }
      if (s === "curve" && poly) {
        op.current = { kind: "bend" };
        return setPoly((q) => ({ ...q, pts: [q.pts[0], q.pts[1], p] }));
      }
      op.current = { kind: "shape", start: p, style: style(e) };
      if (s === "line" || s === "curve") return setDraft({ id: drawId(), page, kind: s, pts: [p, p], ...style(e), fill: "" });
      return setDraft({ id: drawId(), page, kind: s, x: p[0], y: p[1], w: 0, h: 0, ...style(e) });
    }
  };

  const move = (e) => {
    if (touchMove(e)) return;
    if (op.current?.kind === "pan") return movePan(op.current, e);
    const p = toMm(e);
    if (tool === "eraser") setCursor(p);
    if (dragsText && !op.current) setOverText(!!textAt(p));
    if (poly && ts.shape === "polygon" && !op.current) setPoly((q) => (q ? { ...q, pts: [...q.pts.slice(0, -1), p] } : q));
    const o = op.current;
    if (!o) return;
    if (o.kind === "erase") return erase(p);
    if (o.kind === "draw") {
      return setDraft((d) => {
        const last = d.pts[d.pts.length - 1];
        return Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.25 ? d : { ...d, pts: [...d.pts, p] };
      });
    }
    if (o.kind === "bend") return setPoly((q) => ({ ...q, pts: [q.pts[0], q.pts[1], p] }));
    if (o.kind === "shape") {
      return setDraft((d) => {
        if (d.kind === "line" || d.kind === "curve") return { ...d, pts: [o.start, e.shiftKey ? snap45(o.start, p) : p] };
        let w = p[0] - o.start[0];
        let h = p[1] - o.start[1];
        if (e.shiftKey) {
          const m = Math.max(Math.abs(w), Math.abs(h));
          w = Math.sign(w || 1) * m;
          h = Math.sign(h || 1) * m;
        }
        return { ...d, w: r2(w), h: r2(h) };
      });
    }
    if (o.kind === "drag") {
      const dx = p[0] - o.start[0];
      const dy = p[1] - o.start[1];
      if (!o.moved) {
        if (Math.hypot(dx, dy) < tol() / 2) return;
        checkpoint(); // one undo step, only once it really moves
        o.moved = true;
      }
      return show(o, moveBy(o.base, dx, dy));
    }
    if (o.kind === "move") {
      const dx = p[0] - o.start[0];
      const dy = p[1] - o.start[1];
      return show(o, moveBy(o.base, dx, dy));
    }
    if (o.kind === "resize") {
      const b = o.from;
      let { x, y, w, h } = b;
      if (o.h.includes("e")) w = Math.max(1, p[0] - b.x);
      if (o.h.includes("s")) h = Math.max(1, p[1] - b.y);
      if (o.h.includes("w")) {
        const nx = Math.min(p[0], b.x + b.w - 1);
        w = b.x + b.w - nx;
        x = nx;
      }
      if (o.h.includes("n")) {
        const ny = Math.min(p[1], b.y + b.h - 1);
        h = b.y + b.h - ny;
        y = ny;
      }
      return show(o, refit(o.base, b, { x, y, w, h }));
    }
  };

  const up = (e) => {
    if (touchUp(e)) return; // a palm, or the rest of a two-finger gesture
    const o = op.current;
    op.current = null;
    if (!o) return;
    if (o.kind === "pan") {
      setPanning(false);
      return endPan(o);
    }
    // a move / resize lands in the form's marks once (its undo step was taken when it started)
    if (o.last && (o.kind === "drag" || o.kind === "move" || o.kind === "resize")) {
      const done = o.last;
      live((list) => list.map((it) => (it.id === done.id ? done : it)));
      setPreview(null);
      return;
    }
    if (o.kind === "drag") {
      if (!o.moved && tool === "text") setEditing(o.base.id);
      return;
    }
    if (o.kind === "draw" && draft) {
      if (draft.pts.length === 1) {
        const dot = draft;
        dots.current.push(setTimeout(() => add(dot), 260));
      } else add(draft);
      setDraft(null);
    } else if (o.kind === "shape" && draft) {
      const tiny = draft.kind === "line" || draft.kind === "curve" ? Math.hypot(draft.pts[1][0] - draft.pts[0][0], draft.pts[1][1] - draft.pts[0][1]) < 1 : Math.abs(draft.w) < 1 || Math.abs(draft.h) < 1;
      if (draft.kind === "curve" && !tiny)
        setPoly(draft); // second drag bends it
      else if (!tiny) {
        const it = draft.kind === "line" ? draft : normBox(draft);
        add(it);
        setSel(it.id);
      }
      setDraft(null);
    } else if (o.kind === "bend" && poly) {
      add(poly);
      setSel(poly.id);
      setPoly(null);
    }
  };

  // the browser took the touch (e.g. the OS) — forget it, keep nothing half-drawn
  const cancel = (e) => {
    touchUp(e);
    op.current = null;
    setDraft(null);
    setPreview(null);
    setPanning(false);
  };

  const dblClick = (e) => {
    if (palmJustNow()) return; // a resting hand tapping twice is not "type here"
    if (tool === "shape" && ts.shape === "polygon") return finishPoly();
    if (tool === "text" || tool === "zoom" || tool === "hand") return;
    dots.current.forEach(clearTimeout);
    dots.current = [];
    typeAt(toMm(e));
  };

  /** A caret at p (mm) — or the text already there, to edit it. */
  const typeAt = (p) => {
    const hit = topHit(itemsRef.current, page, p, tol());
    // just a caret where it was double-clicked: not selected, so the select tool (a user whose
    // default is Type) shows no resize box around the text being typed
    if (hit?.kind === "text") {
      setSel(null);
      return setEditing(hit.id);
    }
    const fs = sizeOf(ts, "text");
    const it = { id: drawId(), page, kind: "text", ...textAtPoint(p, fs), w: 3, text: "", stroke: ts.c1, fill: "", fontSize: fs };
    add(it);
    setSel(null);
    setEditing(it.id);
  };

  /** A ✔ / ✘ mark centred on p (mm): a text mark, so it moves, erases, undoes and prints like text. */
  const putMark = (m, p) => {
    const fs = sizeOf(ts, "mark");
    const w = r2(textWidthMm(m.glyph, fs) + 2.4);
    const h = r2(fs * 0.3528 * 1.2 + 0.8);
    const x = r2(Math.max(0, Math.min(size.w - w, p[0] - w / 2)));
    const y = r2(Math.max(0, Math.min(size.h - h, p[1] - h / 2)));
    add({ id: drawId(), page, kind: "text", x, y, w, h, text: m.glyph, stroke: m.color, fill: "", fontSize: fs, mark: m.id });
  };

  const openMenu = (e) => {
    e.preventDefault();
    if (RIGHT_BUTTON_TOOLS.includes(tool) || poly || editing) return;
    const o = op.current;
    if (o) {
      // a long-press: only when the finger has not drawn / moved anything yet
      if (o.kind === "draw" && (draft?.pts.length || 0) <= 1) setDraft(null);
      else if (o.kind === "pan") setPanning(false);
      else return;
      op.current = null;
    }
    setMenu({ id: Date.now() + Math.random(), x: e.clientX, y: e.clientY, p: toMm(e) });
  };

  const finishPoly = () => {
    if (!poly) return;
    const pts = poly.pts.slice(0, -1);
    if (pts.length >= 2) {
      const it = { ...poly, pts, closed: pts.length > 2 };
      add(it);
      setSel(it.id);
    }
    setPoly(null);
  };

  const pending = draft || poly;
  const shown = preview && selected && preview.id === selected.id ? preview : selected;
  const box = shown && tool === "select" && shown.id !== editing ? bbox(shown, false) : null;
  const hs = 2.4 / Math.max(0.6, pxPerMm() / 3.78);

  return (
    <div
      ref={ref}
      className={`nfb-drawsurface tool-${tool}${tool === "brush" ? ` brush-${ts.brush}` : ""}${dragsText && overText ? " is-overtext" : ""}${panning ? " is-panning" : ""}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onPointerLeave={() => {
        setCursor(null);
        setOverText(false);
      }}
      onDoubleClick={dblClick}
      onContextMenu={openMenu}
    >
      {preview && <style>{`.nfb .nfb-draw [data-mark="${preview.id}"]{visibility:hidden}`}</style>}
      <svg viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" className="nfb-drawsurface-svg">
        {pending && <DrawItem it={pending.kind === "polygon" ? { ...pending, closed: false } : pending} />}
        {preview && <DrawItem it={preview} />}
        {box && (
          <g className="nfb-drawsel">
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" />
            {HANDLES.map((h) => {
              const cx = box.x + (h.includes("e") ? box.w : h.includes("w") ? 0 : box.w / 2);
              const cy = box.y + (h.includes("s") ? box.h : h.includes("n") ? 0 : box.h / 2);
              return <rect key={h} data-handle={h} className={`h-${h}`} x={cx - hs / 2} y={cy - hs / 2} width={hs} height={hs} />;
            })}
          </g>
        )}
        {cursor && tool === "eraser" && <circle className="nfb-erasercursor" cx={cursor[0]} cy={cursor[1]} r={sizeOf(ts, "eraser") / 2} />}
      </svg>
      {editing && (() => {
        const item = items.find((it) => it.id === editing);
        return item ? (
          <TextEditor
            key={item.id}
            item={item}
            maxW={Math.max(10, size.w - item.x - 2)}
            apply={apply}
            onDone={(kept) => {
              setEditing(null);
              if (kept) setSel(item.id); // went to the Font size box: it now sizes this text
            }}
          />
        ) : null;
      })()}
      {menu && <MarkMenu key={menu.id} at={menu} pt={sizeOf(ts, "mark")} onPt={(v) => setTs({ textPt: v })} onMark={(m) => putMark(m, menu.p)} onType={() => typeAt(menu.p)} onClose={() => setMenu((m) => (m?.id === menu.id ? null : m))} />}
    </div>
  );
}

/**
 * Typing straight onto the form: no box, no placeholder — a caret where the
 * page was clicked, and the letters look exactly as the mark will (same font,
 * padding and line height as DrawLayer). The editor grows with the text up to
 * the page's right edge, then wraps. Clicking anywhere else, Esc or Ctrl+Enter
 * keeps it; an empty text is dropped. The mark itself is hidden while it is
 * edited so the old text doesn't show through. Moved afterwards by dragging it.
 */
function TextEditor({ item, maxW, apply, onDone }) {
  const [text, setText] = useState(item?.text || "");
  const area = useRef(null);
  const fs = item?.fontSize || 12;
  // hug the text (plus room for the caret), so the empty part never catches drags meant for drawing
  const w = r2(Math.max(3, Math.min(maxW, textWidthMm(text || " ", fs) + 2.4)));

  useEffect(() => {
    setTimeout(() => {
      const a = area.current;
      if (!a) return;
      a.focus();
      a.setSelectionRange(a.value.length, a.value.length);
    }, 0);
  }, []);
  // height follows the lines (typed or wrapped)
  useLayoutEffect(() => {
    const a = area.current;
    if (!a) return;
    a.style.height = "0";
    a.style.height = `${a.scrollHeight}px`;
  }, [text, w]);

  if (!item) return null;
  // focusTo: where the focus went — the Font size box keeps this text selected to size it
  const commit = (focusTo) => {
    const t = text.replace(/\s+$/, "");
    const a = area.current;
    const h = r2(Math.max(fs * 0.3528 * 1.2 + 0.8, a ? a.scrollHeight / PX_PER_MM : item.h));
    const width = r2(Math.max(3, Math.min(maxW, textWidthMm(t || " ", fs) + 2.4)));
    apply((list) => (t ? list.map((it) => (it.id === item.id ? { ...it, text: t, h, w: width } : it)) : list.filter((it) => it.id !== item.id)));
    // the Font size box or the colour picker took the focus: keep this text selected for them
    onDone(!!t && !!focusTo?.closest?.(".nfb-fontsize, .nfb-custom"));
  };
  return (
    <>
      <style>{`.nfb [data-mark="${item.id}"]{visibility:hidden}`}</style>
      <textarea
        ref={area}
        className="nfb-drawtext"
        value={text}
        rows={1}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.relatedTarget)}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) e.currentTarget.blur();
        }}
        style={{ left: `${item.x}mm`, top: `${item.y}mm`, width: `${w}mm`, fontSize: `${fs}pt`, color: item.stroke || "#111827", caretColor: item.stroke || "#111827" }}
      />
    </>
  );
}

/** Tools whose right button already means something (colour 2, zoom out): no ✔ / ✘ menu there. */
const RIGHT_BUTTON_TOOLS = ["picker", "fill", "zoom"];

/** Crisp coloured icons for the menu (the marks themselves are text, so they print as text). */
const MARK_ICON = {
  tick: "M5 12.5l4.5 4.5L19 7.5",
  cross: "M6.5 6.5l11 11M17.5 6.5l-11 11",
};

/**
 * The right-click menu, a dropdown list: Tick ✔, Cross ✘, Type text here, and
 * the ✔ / ✘ size. Each pick lands exactly where the form was right-clicked.
 * Opens from the pointer (rows sliding in one after another), keeps inside the
 * window, closes on a pick, a click elsewhere, Esc, scroll or resize; keys
 * 1 / 2 / T pick too.
 */
function MarkMenu({ at, pt, onPt, onMark, onType, onClose }) {
  const stop = (e) => e.stopPropagation();
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: at.x, top: at.y, ox: "0%", oy: "0%" });
  const [closing, setClosing] = useState(false);
  const done = useRef(false);
  const close = (action) => {
    if (done.current) return;
    done.current = true;
    action?.();
    setClosing(true);
    setTimeout(onClose, 120);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useLayoutEffect(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const flipX = at.x + r.width > window.innerWidth - 8;
    const flipY = at.y + r.height > window.innerHeight - 8;
    setPos({
      left: flipX ? Math.max(8, at.x - r.width) : at.x,
      top: flipY ? Math.max(8, at.y - r.height) : at.y,
      ox: flipX ? "100%" : "0%",
      oy: flipY ? "100%" : "0%",
    });
  }, [at]);

  useEffect(() => {
    // a click elsewhere only closes the menu — it does not also draw there
    const outside = (e) => {
      if (ref.current?.contains(e.target)) return;
      e.stopPropagation();
      e.preventDefault();
      closeRef.current();
    };
    const key = (e) => {
      const k = e.key.toLowerCase();
      if (k === "escape") return closeRef.current();
      if (e.target?.tagName === "INPUT") return; // typing a size
      if (k === "arrowdown" || k === "arrowup" || k === "arrowright" || k === "arrowleft") {
        e.preventDefault();
        const rows = [...(ref.current?.querySelectorAll(".nfb-mm-opt") || [])];
        const at = rows.indexOf(document.activeElement);
        rows[(at + (k === "arrowdown" || k === "arrowright" ? 1 : rows.length - 1) + rows.length) % rows.length]?.focus({ preventScroll: true });
        return;
      }
      if (k === "1" || k === "2") {
        e.preventDefault();
        closeRef.current(() => onMark(MARKS[Number(k) - 1]));
      } else if (k === "t") {
        e.preventDefault();
        closeRef.current(onType);
      }
    };
    const dismiss = () => closeRef.current();
    const scrolled = (e) => !ref.current?.contains(e.target) && closeRef.current();
    // first row ready for the keyboard: ↑ / ↓ move, Enter picks
    requestAnimationFrame(() => ref.current?.querySelector(".nfb-mm-opt")?.focus({ preventScroll: true }));
    window.addEventListener("pointerdown", outside, true);
    window.addEventListener("keydown", key, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("blur", dismiss);
    return () => {
      window.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("blur", dismiss);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div className="nfb nfb-floating">
      <div
        ref={ref}
        className={`nfb-markmenu${closing ? " is-closing" : ""}`}
        style={{ left: pos.left, top: pos.top, transformOrigin: `${pos.ox} ${pos.oy}` }}
        // portalled to <body>, but React still bubbles its events to the DrawSurface: stop them
        // here, or the surface takes the press (pointer capture eats the click, a pen draws a dot)
        onPointerDown={stop}
        onPointerMove={stop}
        onPointerUp={stop}
        onPointerCancel={stop}
        onClick={stop}
        onDoubleClick={stop}
        onKeyDown={stop}
        onContextMenu={(e) => (e.preventDefault(), e.stopPropagation())}
        role="menu"
      >
        <div className="nfb-mm-icons" role="group" aria-label="Insert">
          {MARKS.map((m, i) => (
            <Tap key={m.id} className={`nfb-mm-opt is-${m.id}`} style={{ "--i": i }} role="menuitem" title={`Insert ${m.label.toLowerCase()} (${i + 1})`} aria-label={`Insert ${m.label.toLowerCase()}`} onClick={() => close(() => onMark(m))}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d={MARK_ICON[m.id]} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Tap>
          ))}
          <Tap className="nfb-mm-opt is-text" style={{ "--i": MARKS.length }} role="menuitem" title="Type text here (T)" aria-label="Type text here" onClick={() => close(onType)}>
            <Icon name="text" size={19} />
          </Tap>
        </div>
        <div className="nfb-mm-sep" />
        <div className="nfb-mm-size" style={{ "--i": MARKS.length + 1 }}>
          <span>Size</span>
          <FontSize value={pt} onChange={onPt} list={false} title="Font size of text and ✔ / ✘" />
        </div>
      </div>
    </div>,
    document.body,
  );
}

const PX_PER_MM = 96 / 25.4;
/** Where a text mark goes so the caret sits on the clicked point (the mark's padding is 0.8 × 0.4 mm). */
const textAtPoint = (p, fs) => ({ x: r2(Math.max(0, p[0] - 0.8)), y: r2(Math.max(0, p[1] - (fs * 0.3528 * 1.2) / 2 - 0.4)), h: r2(fs * 0.3528 * 1.2 + 0.8) });

let measureCtx = null;
/** Width in mm of the longest line of `text` at `pt` points, in the font DrawLayer uses. */
function textWidthMm(text, pt) {
  measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
  measureCtx.font = `${pt}pt Inter, 'Segoe UI', Arial, sans-serif`;
  const px = Math.max(...text.split("\n").map((l) => measureCtx.measureText(l).width));
  return px / (96 / 25.4);
}

/** Colour of the form under p — the PDF canvas pixel (images may not allow reading). */
function sampleForm(surface, p, size) {
  try {
    const canvas = surface.parentElement?.querySelector(".nfb-pagebg canvas");
    if (!canvas) return "#ffffff";
    const x = Math.floor((p[0] / size.w) * canvas.width);
    const y = Math.floor((p[1] / size.h) * canvas.height);
    const [r, g, b, a] = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
    if (!a) return "#ffffff";
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return "#ffffff";
  }
}

const normBox = (it) => ({ ...it, x: Math.min(it.x, it.x + it.w), y: Math.min(it.y, it.y + it.h), w: Math.abs(it.w), h: Math.abs(it.h) });
const snap45 = (a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  const len = Math.hypot(dx, dy);
  return [r2(a[0] + len * Math.cos(ang)), r2(a[1] + len * Math.sin(ang))];
};
const r2 = (n) => Math.round(n * 100) / 100;
