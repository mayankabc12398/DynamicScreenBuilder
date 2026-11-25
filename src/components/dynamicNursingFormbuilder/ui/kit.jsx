/**
 * Small building blocks shared by every screen of the builder: dialog,
 * labelled field, inputs, segmented control, switch, confirm, skeleton.
 * All drawn inside `.nfb` so the app theme never restyles them.
 */
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Tap from "./Tap";
import Icon from "./Icon";

export function Dialog({ open, title, subtitle, icon, tone = "indigo", width = 520, onClose, footer, children, className = "" }) {
  const [shown, setShown] = useState(open);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (open) {
      setShown(true);
      setLeaving(false);
    } else if (shown) {
      setLeaving(true);
      const t = setTimeout(() => setShown(false), 160);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!shown) return null;
  return createPortal(
    <div className={`nfb nfb-modal${leaving ? " is-leaving" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`nfb-dialog ${className}`} style={{ width: `min(${width}px, calc(100vw - 32px))` }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="nfb-dialog-head">
          {icon && (
            <span className={`nfb-dialog-ico tone-${tone}`}>
              <Icon name={icon} size={16} />
            </span>
          )}
          <div className="nfb-dialog-titles">
            <div className="nfb-dialog-title">{title}</div>
            {subtitle && <div className="nfb-dialog-sub">{subtitle}</div>}
          </div>
          <Tap icon="x" variant="ghost" title="Close (Esc)" onClick={onClose} />
        </div>
        <div className="nfb-dialog-body">{children}</div>
        {footer && <div className="nfb-dialog-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, hint, required, children, span = 1, className = "" }) {
  return (
    <label className={`nfb-field span-${span} ${className}`}>
      {label && (
        <span className="nfb-field-label">
          {label}
          {required && <em>*</em>}
        </span>
      )}
      {children}
      {hint && <span className="nfb-field-hint">{hint}</span>}
    </label>
  );
}

export const TextInput = React.forwardRef(function TextInput({ value, onChange, className = "", ...rest }, ref) {
  return <input ref={ref} className={`nfb-input ${className}`} value={value ?? ""} onChange={(e) => onChange?.(e.target.value, e)} {...rest} />;
});

export function NumInput({ value, onChange, step = 0.5, min, max, suffix, className = "", ...rest }) {
  const [txt, setTxt] = useState(fmtNum(value));
  useEffect(() => setTxt(fmtNum(value)), [value]);
  const commit = (s) => {
    const n = parseFloat(s);
    if (Number.isFinite(n)) onChange?.(clamp(n, min, max));
    else setTxt(fmtNum(value));
  };
  return (
    <span className={`nfb-num ${className}`}>
      <input
        className="nfb-input"
        value={txt}
        inputMode="decimal"
        onChange={(e) => setTxt(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const n = (parseFloat(txt) || 0) + (e.key === "ArrowUp" ? step : -step) * (e.shiftKey ? 10 : 1);
            onChange?.(clamp(Math.round(n * 100) / 100, min, max));
          }
        }}
        {...rest}
      />
      {suffix && <span className="nfb-num-suffix">{suffix}</span>}
    </span>
  );
}
const fmtNum = (v) => (v === null || v === undefined || v === "" ? "" : String(Math.round(Number(v) * 100) / 100));
const clamp = (n, min, max) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

export function Select({ value, onChange, options, placeholder, className = "", ...rest }) {
  return (
    <span className={`nfb-select ${className}`}>
      <select value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === "object" ? o.value : o;
          const l = typeof o === "object" ? o.label ?? o.value : o;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <Icon name="chevD" size={13} />
    </span>
  );
}

export function TextArea({ value, onChange, rows = 3, className = "", ...rest }) {
  return <textarea className={`nfb-input nfb-textarea ${className}`} rows={rows} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} {...rest} />;
}

export function Segmented({ value, onChange, options, className = "" }) {
  return (
    <span className={`nfb-seg ${className}`} role="radiogroup">
      {options.map((o) => (
        <Tap key={o.value} className="nfb-seg-item" active={value === o.value} title={o.title || o.label} icon={o.icon} onClick={() => onChange(o.value)} role="radio" aria-checked={value === o.value}>
          {o.label && !o.iconOnly ? o.label : null}
        </Tap>
      ))}
    </span>
  );
}

export function Switch({ checked, onChange, label, title }) {
  return (
    <Tap className={`nfb-switch${checked ? " is-on" : ""}`} title={title || label} onClick={() => onChange(!checked)} role="switch" aria-checked={!!checked}>
      <span className="nfb-switch-track">
        <span className="nfb-switch-dot" />
      </span>
      {label && <span className="nfb-switch-label">{label}</span>}
    </Tap>
  );
}

export function Chip({ tone = "slate", children, className = "", title }) {
  return (
    <span className={`nfb-chip tone-${tone} ${className}`} title={title}>
      {children}
    </span>
  );
}

export function Skeleton({ w = "100%", h = 12, r = 6, className = "" }) {
  return <span className={`nfb-skel ${className}`} style={{ width: w, height: h, borderRadius: r }} />;
}

export function Empty({ icon = "file", title, text, action }) {
  return (
    <div className="nfb-empty">
      <span className="nfb-empty-ico">
        <Icon name={icon} size={22} />
      </span>
      <div className="nfb-empty-title">{title}</div>
      {text && <div className="nfb-empty-text">{text}</div>}
      {action}
    </div>
  );
}

/** A promise-based confirm drawn as a builder dialog: `if (await ask({ title, text })) …`. */
export function useConfirm() {
  const [state, setState] = useState(null);
  const resolver = useRef(null);
  const ask = (opts) =>
    new Promise((resolve) => {
      resolver.current = resolve;
      setState(opts);
    });
  const done = (v) => {
    resolver.current?.(v);
    setState(null);
  };
  const node = (
    <Dialog
      open={!!state}
      title={state?.title}
      icon={state?.icon || "alert"}
      tone={state?.tone || "amber"}
      width={420}
      onClose={() => done(false)}
      footer={
        <>
          <Tap variant="soft" onClick={() => done(false)}>
            Cancel
          </Tap>
          <Tap variant="solid" tone={state?.danger ? "rose" : "indigo"} onClick={() => done(true)}>
            {state?.ok || "OK"}
          </Tap>
        </>
      }
    >
      <div className="nfb-confirm-text">{state?.text}</div>
    </Dialog>
  );
  return [ask, node];
}
