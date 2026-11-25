/**
 * Paint-style ribbon: Select · Tools · Brushes · Shapes (+ outline / fill) ·
 * Size · Colours (colour 1 / 2, palette, custom colours) · Undo / Redo / Clear.
 * Left-click a swatch sets the active colour slot, right-click sets colour 2.
 * `side` lays the same groups out as a slim vertical panel (right of the page):
 * brushes and sizes become one-click rows instead of drop-downs.
 * `onImage(file)` adds an Image button (PNG / JPEG / WebP); `imageBusy` while it uploads.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SHAPES, shapeIconD } from "./shapes";
import { BRUSHES, PALETTE, SIZES, fingerScrolls, isTouchDevice, sizeOf } from "./useDrawTool";
import FontSize from "./FontSize";
import Tap from "../ui/Tap";
import Icon from "../ui/Icon";
import { IMAGE_ACCEPT } from "./image";
import { INPUT_MODES } from "../lib/useInputMode";

const TOOLS = [
  { id: "brush", icon: "edit", label: "Pencil / brush (B)" },
  { id: "fill", icon: "bucket", label: "Fill with colour (F)" },
  { id: "text", icon: "text", label: "Text (T)" },
  { id: "eraser", icon: "eraser", label: "Eraser (E)" },
  { id: "picker", icon: "pipette", label: "Colour picker (I)" },
  { id: "zoom", icon: "zoomIn", label: "Magnifier — click in, right-click out" },
];
const BRUSH_ICON = { pencil: "edit", brush: "brush", marker: "marker", highlighter: "highlighter" };
const KEYS = { v: "select", h: "hand", b: "brush", f: "fill", t: "text", e: "eraser", i: "picker", s: "shape" };
const HAND_TITLE = "Hand — drag to scroll the pages (H). Two fingers always scroll and pinch-zoom.";
const SIDE_FOLD_KEY = "nfb-draw-side-folded";

export default function DrawToolbar({ ts, setTs, onUndo, onRedo, canUndo, canRedo, onClear, onDone, count, side = false, onImage, imageBusy = false, foldSignal = 0, fullMode = false, inputMode, onInputMode, fontPt, fontFor = "", onFont, colourOf = "", onColour }) {
  const pickTool = (tool) => setTs((s) => ({ tool, prevTool: tool === "picker" ? s.tool : s.prevTool }));
  // side panel can fold to a slim rail; remembered per browser. Each new foldSignal (> 0) folds
  // it — a form just picked in the workspace gets the width — without changing what is remembered.
  const [folded, setFolded] = useState(() => {
    if (foldSignal > 0) return true;
    try {
      return localStorage.getItem(SIDE_FOLD_KEY) === "1";
    } catch (_) {
      return false;
    }
  });
  const fold = (v) => {
    setFolded(v);
    try {
      localStorage.setItem(SIDE_FOLD_KEY, v ? "1" : "0");
    } catch (_) {}
  };
  useEffect(() => {
    if (foldSignal > 0) setFolded(true);
  }, [foldSignal]);
  // full screen opens with the panel folded; leaving it brings back the remembered state
  const wasFull = useRef(false);
  useEffect(() => {
    if (fullMode) setFolded(true);
    else if (wasFull.current) {
      try {
        setFolded(localStorage.getItem(SIDE_FOLD_KEY) === "1");
      } catch (_) {
        setFolded(false);
      }
    }
    wasFull.current = fullMode;
  }, [fullMode]);

  // single-letter tool keys, like Paint
  useEffect(() => {
    const k = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
      const t = KEYS[e.key.toLowerCase()];
      if (t) pickTool(t);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const sizeTool = ts.tool === "brush" ? ts.brush : ["eraser", "text"].includes(ts.tool) ? ts.tool : "shape";
  const sizeBar = (i) => Math.max(1, Math.min(14, sizeTool === "text" ? i * 2 + 2 : SIZES[sizeTool][i] * (sizeTool === "highlighter" ? 1.4 : 3)));
  const unit = sizeTool === "text" ? " pt" : " mm";
  // one Font size for typed text and the ✔ / ✘ marks: the host points it at the text being typed
  // or selected (fontPt / onFont); with nothing selected it is the size new ones get
  const fontLabel = fontFor === "mark" ? "Font size · selected ✔ / ✘" : fontFor ? "Font size · selected text" : "Font size · new text & ✔ ✘";
  const textSizeBox = (
    <FontSize
      className={fontFor ? "is-target" : ""}
      value={fontPt ?? sizeOf(ts, "text")}
      title={fontFor ? "Size of the selected text" : "Size of new text and ✔ / ✘"}
      onChange={(v) => (onFont ? onFont(v) : setTs({ textPt: v }))}
    />
  );

  const toolButtons = TOOLS.map((t) => <Tap key={t.id} className="nfb-rbtn" icon={t.icon} iconSize={17} active={ts.tool === t.id} title={t.label} onClick={() => pickTool(t.id)} />);
  const handButton = (size = 17) => <Tap className="nfb-rbtn" icon="hand" iconSize={size} active={ts.tool === "hand"} title={HAND_TITLE} onClick={() => pickTool("hand")} />;
  // touch screens: what one finger does on the page (a stylus always draws)
  const touch = isTouchDevice();
  const scrolls = fingerScrolls(ts);
  const fingerSwitch = touch && (
    <div className="nfb-finger" role="group" aria-label="One finger">
      <Tap className={`nfb-finger-btn${!scrolls ? " is-active" : ""}`} icon="edit" iconSize={14} title="One finger draws (two fingers scroll)" onClick={() => setTs({ finger: "draw" })}>
        Draws
      </Tap>
      <Tap className={`nfb-finger-btn${scrolls ? " is-active" : ""}`} icon="hand" iconSize={14} title="One finger scrolls — draw with a stylus" onClick={() => setTs({ finger: "scroll" })}>
        Scrolls
      </Tap>
    </div>
  );
  // the logged-in user's default: forms open with the pencil (Scratch) or ready to type (Type)
  const modeSwitch = onInputMode && (
    <div className="nfb-finger" role="group" aria-label="My default when a form opens">
      {INPUT_MODES.map((m) => (
        <Tap key={m.id} className={`nfb-finger-btn${inputMode === m.id ? " is-active" : ""}`} icon={m.icon} iconSize={14} title={`${m.title} (saved for your login)`} onClick={() => onInputMode(m.id)}>
          {m.label}
        </Tap>
      ))}
    </div>
  );
  const shapeGrid = (
    <div className="nfb-shapegrid">
      {SHAPES.map((s) => (
        <Tap key={s.id} className="nfb-shapebtn" active={ts.tool === "shape" && ts.shape === s.id} title={s.label} onClick={() => setTs({ tool: "shape", shape: s.id })}>
          <svg viewBox="0 0 24 24" width="17" height="17">
            <path d={shapeIconD(s.id)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </Tap>
      ))}
    </div>
  );
  const shapeOpts = (
    <div className="nfb-shapeopts">
      <Drop small face={<Icon name="outline" size={15} />} title="Shape outline">
        {(close) =>
          [
            ["none", "No outline"],
            ["solid", "Solid"],
            ["dash", "Dashed"],
            ["dot", "Dotted"],
          ].map(([v, l]) => (
            <Tap key={v} className={`nfb-menu-item${ts.outline === v ? " is-active" : ""}`} onClick={() => (setTs({ outline: v }), close())}>
              <svg className="nfb-brushprev" viewBox="0 0 60 12">
                {v !== "none" && <path d="M4 6H56" stroke="currentColor" strokeWidth="2" strokeDasharray={v === "dash" ? "6 4" : v === "dot" ? "0.1 5" : undefined} strokeLinecap="round" />}
              </svg>
              {l}
            </Tap>
          ))
        }
      </Drop>
      <Drop small face={<Icon name="fillbox" size={15} />} title="Shape fill (colour 2)">
        {(close) =>
          [
            ["none", "No fill"],
            ["solid", "Solid fill"],
            ["half", "50% fill"],
          ].map(([v, l]) => (
            <Tap key={v} className={`nfb-menu-item${ts.fill === v ? " is-active" : ""}`} onClick={() => (setTs({ fill: v }), close())}>
              <span className="nfb-fillprev" style={{ background: v === "none" ? "transparent" : ts.c2, opacity: v === "half" ? 0.5 : 1 }} />
              {l}
            </Tap>
          ))
        }
      </Drop>
    </div>
  );
  const colours = (
    <div className="nfb-colors">
      <div className="nfb-slots">
        {[1, 2].map((n) => (
          <Tap key={n} className={`nfb-slot${ts.slot === n ? " is-active" : ""}`} title={n === 1 ? "Colour 1 — left button, outline" : "Colour 2 — right button, fill"} onClick={() => setTs({ slot: n })}>
            <span style={{ background: n === 1 ? ts.c1 : ts.c2 }} />
          </Tap>
        ))}
        {side && <CustomColour ts={ts} setTs={setTs} colourOf={colourOf} onColour={onColour} />}
      </div>
      {colourOf && <span className="nfb-colour-target">Recolours the selected one</span>}
      <div className="nfb-palette-grid">
        {[...PALETTE, [...ts.custom, ...Array(10).fill(null)].slice(0, 10)].map((row, ri) =>
          row.map((c, ci) => (
            <span
              key={`${ri}-${ci}`}
              className={`nfb-swatch${c ? "" : " is-empty"}${c && (colourOf ? c.toLowerCase() === colourOf.toLowerCase() : c === ts.c1 || c === ts.c2) ? " is-on" : ""}`}
              style={c ? { background: c } : undefined}
              title={c || "Custom colour slot"}
              // keeps the caret in a text being typed, so the colour goes onto it
              onPointerDown={(e) => e.preventDefault()}
              // a selected ✔ / ✘, text or mark takes the colour; otherwise it is the pen's
              onClick={() => c && (onColour?.(c, ts.slot === 2) || setTs(ts.slot === 2 ? { c2: c } : { c1: c }))}
              onContextMenu={(e) => {
                e.preventDefault();
                if (c) onColour?.(c, true) || setTs({ c2: c });
              }}
            />
          )),
        )}
      </div>
      {!side && <CustomColour ts={ts} setTs={setTs} colourOf={colourOf} onColour={onColour} />}
    </div>
  );
  const history = (
    <>
      <Tap className="nfb-rbtn" icon="undo" iconSize={16} title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} />
      <Tap className="nfb-rbtn" icon="redo" iconSize={16} title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo} />
      <Tap className="nfb-rbtn tone-rose" icon="trash" iconSize={16} title="Clear all drawings" disabled={!count} onClick={onClear} />
      {onDone && <Tap className="nfb-rbtn" icon="check" iconSize={16} title="Done drawing" onClick={onDone} />}
    </>
  );

  if (side && folded) {
    // slim rail: expand + the everyday tools, so drawing still works folded
    return (
      <div className="nfb-ribbon is-side is-folded" onPointerDown={(e) => e.stopPropagation()}>
        <Tap className="nfb-rbtn nfb-side-fold" icon="chevL" iconSize={16} title="Show draw tools" onClick={() => fold(false)} />
        <span className="nfb-side-rail-ico" title={`${count} mark${count === 1 ? "" : "s"}`}>
          <Icon name="paint" size={15} />
          {count > 0 && <em>{count}</em>}
        </span>
        <Tap className="nfb-rbtn" icon="cursor" iconSize={16} active={ts.tool === "select"} title="Select, move, resize (V)" onClick={() => pickTool("select")} />
        {handButton(16)}
        <Tap className="nfb-rbtn" icon="edit" iconSize={16} active={ts.tool === "brush"} title="Pencil / brush (B)" onClick={() => pickTool("brush")} />
        <Tap className="nfb-rbtn" icon="eraser" iconSize={16} active={ts.tool === "eraser"} title="Eraser (E)" onClick={() => pickTool("eraser")} />
        {touch && (
          <Tap
            className={`nfb-rbtn${scrolls ? " is-active" : ""}`}
            icon={scrolls ? "hand" : "edit"}
            iconSize={16}
            title={scrolls ? "One finger scrolls — tap so it draws" : "One finger draws — tap so it scrolls"}
            onClick={() => setTs({ finger: scrolls ? "draw" : "scroll" })}
          />
        )}
        {onInputMode && (
          <Tap
            className="nfb-rbtn"
            icon={inputMode === "type" ? "text" : "edit"}
            iconSize={16}
            title={`My default: ${inputMode === "type" ? "Type (double-tap to type)" : "Scratch (pencil)"} — tap to switch to ${inputMode === "type" ? "Scratch" : "Type"}`}
            onClick={() => onInputMode(inputMode === "type" ? "draw" : "type")}
          />
        )}
        <span className="nfb-side-rail-sep" />
        <Tap className="nfb-rbtn" icon="undo" iconSize={16} title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} />
        <Tap className="nfb-rbtn" icon="redo" iconSize={16} title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo} />
      </div>
    );
  }

  if (side) {
    return (
      <div className="nfb-ribbon is-side" onPointerDown={(e) => e.stopPropagation()}>
        <div className="nfb-side-head">
          <span className="nfb-side-title">
            <Icon name="paint" size={14} />
            Draw
          </span>
          <span className="nfb-rlabel">
            {count} mark{count === 1 ? "" : "s"}
          </span>
          <Tap className="nfb-side-fold" variant="ghost" icon="chevR" iconSize={15} title="Hide draw tools" onClick={() => fold(true)} />
        </div>
        <div className="nfb-side-history">{history}</div>
        {modeSwitch && <SideGroup label="My default on open">{modeSwitch}</SideGroup>}
        {fingerSwitch && <SideGroup label="One finger">{fingerSwitch}</SideGroup>}
        <SideGroup label={fontLabel}>
          {textSizeBox}
          <span className="nfb-glyphhint">
            {fontFor ? "Changes the selected one. Click empty space to set the size for new ones." : "Select a text or ✔ / ✘ (or type one) to resize it. Right-click the form to insert ✔ / ✘."}
          </span>
        </SideGroup>
        <SideGroup label="Tools">
          <div className="nfb-rgrid c4">
            <Tap className="nfb-rbtn" icon="cursor" iconSize={17} active={ts.tool === "select"} title="Select, move, resize (V)" onClick={() => pickTool("select")} />
            {handButton()}
            {toolButtons}
          </div>
        </SideGroup>
        {onImage && (
          <SideGroup label="Insert">
            <ImagePick onImage={onImage} busy={imageBusy} className="nfb-side-image">
              <Icon name={imageBusy ? "upload" : "image"} size={16} className={imageBusy ? "nfb-pulse" : ""} />
              {imageBusy ? "Uploading…" : "Image"}
              <em>PNG · JPG · WebP</em>
            </ImagePick>
          </SideGroup>
        )}
        <SideGroup label="Brushes">
          <div className="nfb-rgrid c4">
            {BRUSHES.map((b) => (
              <Tap key={b.id} className="nfb-rbtn" icon={BRUSH_ICON[b.id]} iconSize={17} active={ts.tool === "brush" && ts.brush === b.id} title={b.label} onClick={() => setTs({ brush: b.id, tool: "brush" })} />
            ))}
          </div>
        </SideGroup>
        {sizeTool !== "text" && (
          <SideGroup label={`Size · ${sizeOf(ts)}${unit}`}>
            <div className="nfb-sizes">
              {SIZES[sizeTool].map((v, i) => (
                <Tap key={i} className={`nfb-sizebtn${ts.size === i ? " is-active" : ""}`} title={`${v}${unit}`} onClick={() => setTs({ size: i })}>
                  <span style={{ width: sizeBar(i) + 3, height: sizeBar(i) + 3 }} />
                </Tap>
              ))}
            </div>
          </SideGroup>
        )}
        <SideGroup label="Shapes" end={shapeOpts}>
          {shapeGrid}
        </SideGroup>
        <SideGroup label="Colours">{colours}</SideGroup>
      </div>
    );
  }

  return (
    <div className="nfb-ribbon" onPointerDown={(e) => e.stopPropagation()}>
      <Group label="Select">
        <Big icon="cursor" active={ts.tool === "select"} title="Select, move, resize (V)" onClick={() => pickTool("select")} />
        <Big icon="hand" active={ts.tool === "hand"} title={HAND_TITLE} onClick={() => pickTool("hand")} />
      </Group>

      {modeSwitch && <Group label="My default">{modeSwitch}</Group>}

      {fingerSwitch && <Group label="One finger">{fingerSwitch}</Group>}

      <Group label="Tools">
        <div className="nfb-rgrid c3">{toolButtons}</div>
      </Group>

      {onImage && (
        <Group label="Image">
          <ImagePick onImage={onImage} busy={imageBusy} className="nfb-rbig">
            <Icon name={imageBusy ? "upload" : "image"} size={22} className={imageBusy ? "nfb-pulse" : ""} />
          </ImagePick>
        </Group>
      )}

      <Group label="Brushes">
        <Drop active={ts.tool === "brush"} face={<Icon name={BRUSH_ICON[ts.brush]} size={20} />} title={BRUSHES.find((b) => b.id === ts.brush)?.label} onFace={() => pickTool("brush")}>
          {(close) =>
            BRUSHES.map((b) => (
              <Tap
                key={b.id}
                className={`nfb-menu-item${ts.brush === b.id ? " is-active" : ""}`}
                icon={BRUSH_ICON[b.id]}
                onClick={() => {
                  setTs({ brush: b.id, tool: "brush" });
                  close();
                }}
              >
                {b.label}
                <svg className="nfb-brushprev" viewBox="0 0 60 12">
                  <path
                    d="M3 8C15 2 25 11 35 6S52 3 57 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={b.id === "pencil" ? 1.2 : b.id === "brush" ? 2.6 : b.id === "marker" ? 4 : 7}
                    strokeLinecap={b.id === "marker" ? "square" : "round"}
                    opacity={b.id === "highlighter" ? 0.35 : 1}
                  />
                </svg>
              </Tap>
            ))
          }
        </Drop>
      </Group>

      <Group label="Shapes" grow>
        <div className="nfb-shapes">
          {shapeGrid}
          {shapeOpts}
        </div>
      </Group>

      <Group label="Size">
        {sizeTool === "text" ? (
          textSizeBox
        ) : (
        <Drop face={<Icon name="lineW" size={20} />} title={`Size: ${sizeOf(ts)}${sizeTool === "text" ? " pt" : " mm"}`}>
          {(close) =>
            SIZES[sizeTool].map((v, i) => (
              <Tap key={i} className={`nfb-menu-item${ts.size === i ? " is-active" : ""}`} onClick={() => (setTs({ size: i }), close())}>
                <span className="nfb-sizeprev">
                  <span style={{ height: sizeBar(i) }} />
                </span>
                {v}
                {unit}
              </Tap>
            ))
          }
        </Drop>
        )}
      </Group>

      <Group label="Colours">{colours}</Group>

      <span className="nfb-grow" />
      <div className="nfb-ribbon-end">
        <div className="nfb-rgrid c2">{history}</div>
        <span className="nfb-rlabel">
          {count} mark{count === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function Group({ label, children, grow }) {
  return (
    <div className={`nfb-rgroup${grow ? " is-grow" : ""}`}>
      <div className="nfb-rgroup-body">{children}</div>
      <span className="nfb-rlabel">{label}</span>
    </div>
  );
}

function SideGroup({ label, end, children }) {
  return (
    <div className="nfb-sgroup">
      <div className="nfb-sgroup-head">
        <span className="nfb-rlabel">{label}</span>
        {end}
      </div>
      {children}
    </div>
  );
}

/** A file button for pictures: label + hidden input, so no bare <button>. */
function ImagePick({ onImage, busy, className, children }) {
  return (
    <label className={`nfb-tap ${className}`} aria-disabled={busy || undefined} title="Insert an image (or paste one with Ctrl+V)">
      {children}
      <input
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onImage(f);
        }}
      />
    </label>
  );
}

function CustomColour({ ts, setTs, colourOf = "", onColour }) {
  return (
    <label className="nfb-custom" title={colourOf ? "Any colour for the selected one" : "Edit colours"}>
      <Icon name="paint" size={22} />
      <input
        type="color"
        value={colourOf || (ts.slot === 2 ? ts.c2 : ts.c1)}
        onChange={(e) => {
          const c = e.target.value;
          const custom = (s) => [c, ...s.custom.filter((x) => x !== c)].slice(0, 10);
          if (onColour?.(c, ts.slot === 2)) setTs((s) => ({ custom: custom(s) }));
          else setTs((s) => ({ ...(s.slot === 2 ? { c2: c } : { c1: c }), custom: custom(s) }));
        }}
      />
    </label>
  );
}

function Big({ icon, active, title, onClick }) {
  return <Tap className="nfb-rbig" icon={icon} iconSize={22} active={active} title={title} onClick={onClick} />;
}

/**
 * A face button with a chevron opening a small menu (children = close => items).
 * The menu is portalled to <body> at a fixed position: the ribbon scrolls
 * sideways (overflow-x), which would otherwise clip it.
 */
function Drop({ face, title, active, onFace, small, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const box = useRef(null);
  const menu = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const m = menu.current?.getBoundingClientRect() || { width: 190, height: 200 };
      let left = r.left;
      let top = r.bottom + 4;
      if (left + m.width > window.innerWidth - 8) left = Math.max(8, r.right - m.width);
      if (top + m.height > window.innerHeight - 8) top = Math.max(8, r.top - m.height - 4);
      setPos({ left, top });
    };
    place();
    const raf = requestAnimationFrame(place); // again once the menu has its size
    const close = (e) => !box.current?.contains(e.target) && !menu.current?.contains(e.target) && setOpen(false);
    const dismiss = () => setOpen(false);
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <span className={`nfb-drop2${small ? " is-small" : ""}${active ? " is-active" : ""}`} ref={box}>
      <Tap className="nfb-drop2-face" title={title} onClick={() => (onFace ? onFace() : setOpen((o) => !o))}>
        {face}
      </Tap>
      <Tap className="nfb-drop2-chev" icon="chevD" iconSize={12} title={title} active={open} onClick={() => setOpen((o) => !o)} />
      {open &&
        createPortal(
          <div className="nfb nfb-floating">
            <div ref={menu} className="nfb-menu nfb-drop2-menu" style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}>
              {children(() => setOpen(false))}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
