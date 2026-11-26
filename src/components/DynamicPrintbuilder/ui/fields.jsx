/**
 * Compact property-panel inputs. Native inputs on purpose: the panel is dense
 * (two or three controls per row) and every edit is live, which the app's
 * labelled form components are not built for. Text inputs commit on every
 * keystroke through the designer's coalesced history.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Tap from "./Tap";
import { uiZoom } from "./zoom";

export function Row({ label, children, hint, wide = false }) {
  return (
    <label className={`pbx-row${wide ? " is-wide" : ""}`} title={hint}>
      {label != null && <span className="pbx-row-label">{label}</span>}
      <span className="pbx-row-ctl">{children}</span>
    </label>
  );
}

export function Section({ title, children, right, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`pbx-sec${open ? " is-open" : ""}`} data-sec={typeof title === "string" ? title : undefined}>
      <header className="pbx-sec-head">
        <Tap className="pbx-sec-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="pbx-caret">{open ? "▾" : "▸"}</span>
          {title}
        </Tap>
        {right}
      </header>
      {open && <div className="pbx-sec-body">{children}</div>}
    </section>
  );
}

export function TextInput({ value, onChange, placeholder, mono = false, className = "", ...rest }) {
  return (
    <input
      type="text"
      className={`pbx-input${mono ? " is-mono" : ""} ${className}`}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      {...rest}
    />
  );
}

export function TextArea({ value, onChange, rows = 3, mono = false, placeholder }) {
  return (
    <textarea
      className={`pbx-input pbx-textarea${mono ? " is-mono" : ""}`}
      rows={rows}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
}

/** Number input that lets the user type "1." or "" without fighting them. */
export function NumberInput({ value, onChange, step = 0.5, min, max, suffix, placeholder }) {
  const [text, setText] = useState(value == null || value === "" ? "" : String(value));
  useEffect(() => {
    const n = Number(text);
    if (value == null || value === "") {
      if (text !== "") setText("");
    } else if (!(text !== "" && Number.isFinite(n) && Math.abs(n - Number(value)) < 1e-9)) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span className="pbx-num">
      <input
        type="number"
        className="pbx-input"
        value={text}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value === "") onChange(undefined);
          else {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }
        }}
      />
      {suffix && <span className="pbx-suffix">{suffix}</span>}
    </span>
  );
}

/**
 * Dropdown with a styled list (a native <select> popup cannot be styled). The list is
 * portalled to <body> inside its own .pbx layer so modals and scrolling panels never
 * clip it. Focus always sits in a real <input> (the trigger, then the list's search
 * box) so the designer's window hotkeys (arrows nudge, Delete removes) skip it.
 */
const SEARCH_FROM = 8;
export function Select({ value, onChange, options, placeholder, className = "", title, disabled = false }) {
  const items = useMemo(() => {
    const list = (options || []).map((o) => (typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? String(o.value) }));
    return placeholder != null ? [{ value: "", label: placeholder, isPlaceholder: true }, ...list] : list;
  }, [options, placeholder]);
  const cur = String(value ?? "");
  const picked = items.find((o) => String(o.value) === cur);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const trigRef = useRef(null);
  const popRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const searchable = items.length > SEARCH_FROM;
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((o) => !o.isPlaceholder && String(o.label).toLowerCase().includes(s)) : items;
  }, [items, q]);

  const place = () => {
    const r = trigRef.current?.getBoundingClientRect();
    if (!r) return;
    const want = Math.min(320, (searchable ? 44 : 8) + items.length * 30);
    const below = window.innerHeight - r.bottom - 8;
    const up = below < Math.min(want, 200) && r.top > below;
    const width = Math.max(r.width, 190);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    // measured in screen pixels; the list layer has the builder's zoom, so its CSS pixels are bigger
    const z = uiZoom();
    const px = (v) => (v == null ? undefined : v / z);
    setPos({ left: px(left), width: px(width), up, top: px(up ? undefined : r.bottom + 4), bottom: px(up ? window.innerHeight - r.top + 4 : undefined), maxH: px(Math.max(140, (up ? r.top : below) - 12)) });
  };
  const openList = () => {
    if (disabled) return;
    place();
    setQ("");
    setActive(Math.max(0, items.findIndex((o) => String(o.value) === cur)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigRef.current?.focus();
  };
  const pick = (o) => {
    close();
    if (o && String(o.value) !== cur) onChange(String(o.value));
  };

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const out = (e) => {
      if (trigRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      close(false);
    };
    const reflow = (e) => {
      if (popRef.current?.contains(e.target)) return;
      place();
    };
    document.addEventListener("mousedown", out, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", reflow, true);
    return () => {
      document.removeEventListener("mousedown", out, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", reflow, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onListKey = (e) => {
    const last = shown.length - 1;
    const go = (i) => {
      e.preventDefault();
      setActive(Math.max(0, Math.min(last, i)));
    };
    if (e.key === "ArrowDown") go(active + 1);
    else if (e.key === "ArrowUp") go(active - 1);
    else if (e.key === "Home" && !q) go(0);
    else if (e.key === "End" && !q) go(last);
    else if (e.key === "PageDown") go(active + 8);
    else if (e.key === "PageUp") go(active - 8);
    else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) pick(shown[active]);
    } else if (e.key === "Escape") {
      // keep the surrounding modal open: only the list closes
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close(false);
    e.stopPropagation();
  };
  const onTrigKey = (e) => {
    if (["ArrowDown", "ArrowUp", "Enter", " ", "F4"].includes(e.key) || (e.altKey && e.key === "ArrowDown")) {
      e.preventDefault();
      e.stopPropagation();
      openList();
    }
  };

  return (
    <span className={`pbx-dd${open ? " is-open" : ""}${disabled ? " is-disabled" : ""} ${className}`.trim()} title={title}>
      <input
        ref={trigRef}
        readOnly
        disabled={disabled}
        className={`pbx-input pbx-dd-trigger${picked && !picked.isPlaceholder ? "" : " is-empty"}`}
        value={picked ? picked.label : placeholder ?? cur}
        title={title || (picked ? picked.label : undefined)}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onMouseDown={(e) => {
          e.preventDefault();
          if (open) close();
          else {
            trigRef.current?.focus();
            openList();
          }
        }}
        onKeyDown={onTrigKey}
      />
      <svg className="pbx-dd-chev" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {open &&
        pos &&
        createPortal(
          <div className="pbx pbx-dd-layer">
            <div
              ref={popRef}
              className={`pbx-dd-pop${pos.up ? " is-up" : ""}`}
              style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: Math.min(340, pos.maxH) }}
              onMouseDown={(e) => e.target.tagName !== "INPUT" && e.preventDefault()}
            >
              <div className={`pbx-dd-search${searchable ? "" : " is-ghost"}`}>
                {searchable && (
                  <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                    <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                <input
                  ref={searchRef}
                  value={q}
                  placeholder="Search…"
                  aria-label="Search options"
                  onChange={(e) => {
                    setQ(searchable ? e.target.value : "");
                    setActive(0);
                  }}
                  onKeyDown={onListKey}
                />
              </div>
              <div ref={listRef} className="pbx-dd-list" role="listbox">
                {shown.map((o, i) => {
                  const sel = String(o.value) === cur && !(o.isPlaceholder && !picked);
                  return (
                    <div
                      key={`${o.value}:${i}`}
                      role="option"
                      aria-selected={sel}
                      title={String(o.label)}
                      className={`pbx-dd-opt${i === active ? " is-active" : ""}${sel ? " is-sel" : ""}${o.isPlaceholder ? " is-ph" : ""}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(o)}
                    >
                      <span className="pbx-dd-label">{o.label}</span>
                      {sel && (
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  );
                })}
                {!shown.length && <div className="pbx-dd-none">No matches for “{q}”</div>}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}

export function Toggle({ value, onChange, label }) {
  return (
    <Tap className={`pbx-toggle${value ? " is-on" : ""}`} onClick={() => onChange(!value)} aria-pressed={!!value}>
      <span className="pbx-toggle-track">
        <span className="pbx-toggle-dot" />
      </span>
      {label && <span className="pbx-toggle-label">{label}</span>}
    </Tap>
  );
}

const SWATCHES = ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#ffffff", "#0f766e", "#1d4ed8", "#7c3aed", "#b91c1c", "#b45309", "#15803d"];

export function ColorInput({ value, onChange, allowEmpty = true }) {
  const [open, setOpen] = useState(false);
  const valid = /^#[0-9a-f]{6}$/i.test(value || "");
  const hex = valid ? value : "#ffffff";
  return (
    <span className="pbx-color">
      <input type="color" className={`pbx-color-well${value ? "" : " is-empty"}`} value={hex} onChange={(e) => onChange(e.target.value)} title="Pick a colour" />
      <input type="text" className="pbx-input is-mono" value={value ?? ""} placeholder="none" onChange={(e) => onChange(e.target.value)} />
      <Tap className="is-icon" tone="list" onClick={() => setOpen((o) => !o)} title="Swatches">
        ◐
      </Tap>
      {open && (
        <span className="pbx-swatches" onMouseLeave={() => setOpen(false)}>
          {allowEmpty && (
            <Tap className="pbx-swatch is-empty" onClick={() => { onChange(""); setOpen(false); }} title="None">
              ∅
            </Tap>
          )}
          {SWATCHES.map((c) => (
            <Tap key={c} className="pbx-swatch" style={{ background: c }} title={c} onClick={() => { onChange(c); setOpen(false); }} />
          ))}
        </span>
      )}
    </span>
  );
}

/** Segmented buttons for a few exclusive choices. */
export function Segmented({ value, onChange, options }) {
  return (
    <span className="pbx-seg">
      {options.map((o) => (
        <Tap key={o.value} className="pbx-seg-item" active={value === o.value} onClick={() => onChange(o.value)} title={o.title || o.label}>
          {o.icon || o.label}
        </Tap>
      ))}
    </span>
  );
}
