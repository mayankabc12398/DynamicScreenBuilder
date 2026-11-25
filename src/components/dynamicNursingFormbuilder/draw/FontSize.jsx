/**
 * A font-size box like a word processor's: − / + step through the usual
 * sizes, the number can be typed (6-96 pt, applied as it is typed; below 6 on Enter or leaving the box applies
 * it), and the chevron opens the list of sizes. `list={false}` leaves the
 * chevron out (inside another floating menu, whose outside-click would close it).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PT_MAX, PT_MIN, PT_PRESETS, clampPt } from "./useDrawTool";
import Tap from "../ui/Tap";

export default function FontSize({ value, onChange, list = true, title = "Font size", className = "" }) {
  const [text, setText] = useState(String(value));
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const box = useRef(null);
  const menu = useRef(null);
  // what this box last sent: the value coming back from it must not overwrite what is being
  // typed ("1" on the way to "14"), but a new value from elsewhere (another text picked) does
  const sent = useRef(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current || value !== sent.current) setText(String(value));
    sent.current = value;
  }, [value]);
  const send = (n) => {
    sent.current = n;
    onChange(n);
  };
  // live: every keystroke that makes a usable size applies it at once (below 6 waits for Enter / leaving)
  const typed = (raw) => {
    const t = raw.replace(/[^\d.]/g, "").slice(0, 4);
    setText(t);
    const n = Math.round(Number(t) * 2) / 2;
    if (t && Number.isFinite(n) && n >= PT_MIN && n <= PT_MAX && n !== value) send(n);
  };

  // − / + / the list leave the focus where it is: a text being typed stays open and is resized live
  const keepFocus = (e) => e.preventDefault();
  const apply = (v) => {
    const n = clampPt(v, value);
    setText(String(n));
    if (n !== value) send(n);
  };
  const stepBy = (dir) => {
    const next = dir > 0 ? PT_PRESETS.find((p) => p > value) : [...PT_PRESETS].reverse().find((p) => p < value);
    apply(next ?? value + dir);
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const h = Math.min(260, window.innerHeight - 16);
      const below = r.bottom + 4 + h <= window.innerHeight - 8;
      setPos({ left: r.left, width: r.width, top: below ? r.bottom + 4 : Math.max(8, r.top - h - 4), maxHeight: h });
    };
    place();
    const outside = (e) => !box.current?.contains(e.target) && !menu.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", outside, true);
    window.addEventListener("keydown", esc);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("keydown", esc);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  // the current size in view when the list opens
  useEffect(() => {
    if (open && pos) menu.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }, [open, pos]);

  return (
    <div className={`nfb-fontsize ${className}`} title={title}>
      <Tap className="nfb-fs-step" title="Smaller" onPointerDown={keepFocus} onClick={() => stepBy(-1)}>
        −
      </Tap>
      <div className="nfb-fs-box" ref={box}>
        <input
          className="nfb-fs-input"
          inputMode="decimal"
          value={text}
          aria-label={title}
          onChange={(e) => typed(e.target.value)}
          onFocus={(e) => {
            focused.current = true;
            e.target.select();
          }}
          onBlur={() => {
            focused.current = false;
            apply(text);
          }}
          onKeyDown={(e) => {
            e.stopPropagation(); // tool letters and menu keys stay out of the box
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur(); // blur applies it
            else if (e.key === "ArrowUp") (e.preventDefault(), stepBy(1));
            else if (e.key === "ArrowDown") (e.preventDefault(), stepBy(-1));
          }}
        />
        <span className="nfb-fs-unit">pt</span>
        {list && <Tap className="nfb-fs-chev" icon="chevD" iconSize={12} title="Sizes" active={open} onPointerDown={keepFocus} onClick={() => setOpen((o) => !o)} />}
      </div>
      <Tap className="nfb-fs-step" title="Bigger" onPointerDown={keepFocus} onClick={() => stepBy(1)}>
        +
      </Tap>
      {open &&
        pos &&
        createPortal(
          <div className="nfb nfb-floating">
            <div ref={menu} className="nfb-fs-list" style={{ left: pos.left, top: pos.top, minWidth: Math.max(96, pos.width), maxHeight: pos.maxHeight }}>
              {PT_PRESETS.map((p) => (
                <Tap
                  key={p}
                  className={`nfb-fs-opt${p === value ? " is-active" : ""}`}
                  onPointerDown={keepFocus}
                  onClick={() => {
                    apply(p);
                    setOpen(false);
                  }}
                >
                  {p}
                </Tap>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
