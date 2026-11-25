/**
 * One placed field, drawn the same way in the designer, on a patient page and
 * in print (renderToStaticMarkup). Units are real mm / pt — the page box is
 * CSS-scaled for zoom, so what prints is what was placed.
 *
 * mode: "design"  caption of the binding ({Patient Name}), or the sample value when `value` is given
 *       "fill"    inputs and the signature button are live
 *       "print"   static: entered values and signature images
 */
import React from "react";
import { qrPath, code128Path } from "../lib/codes";
import { isImageValue } from "../model/context";

export function fieldBoxStyle(f, dx = 0, dy = 0) {
  const s = f.style || {};
  return {
    left: `${f.x + dx}mm`,
    top: `${f.y + dy}mm`,
    width: `${f.w}mm`,
    height: `${f.h}mm`,
    fontFamily: fontStack(s.fontFamily),
    fontSize: `${s.fontSize || 10}pt`,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? "italic" : "normal",
    textDecoration: s.underline ? "underline" : "none",
    color: s.color || "#111827",
    background: s.bg || "transparent",
    border: s.border ? "0.25mm solid currentColor" : undefined,
    justifyContent: s.align === "center" ? "center" : s.align === "right" ? "flex-end" : "flex-start",
    textAlign: s.align || "left",
    alignItems: s.valign === "top" ? "flex-start" : s.valign === "bottom" ? "flex-end" : "center",
  };
}

const fontStack = (f) =>
  ({
    Inter: "Inter, 'Segoe UI', Arial, sans-serif",
    Arial: "Arial, Helvetica, sans-serif",
    "Times New Roman": "'Times New Roman', Times, serif",
    "Courier New": "'Courier New', monospace",
    Georgia: "Georgia, serif",
    Verdana: "Verdana, sans-serif",
  })[f] || "Inter, 'Segoe UI', Arial, sans-serif";

export function QrSvg({ text, placeholder }) {
  const q = qrPath(text || placeholder || "QR");
  if (!q) return null;
  return (
    <svg className="nfb-fv-code" viewBox={`-1 -1 ${q.n + 2} ${q.n + 2}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" style={{ opacity: text ? 1 : 0.35 }}>
      <path d={q.d} fill="currentColor" />
    </svg>
  );
}

export function BarcodeSvg({ text, placeholder }) {
  const t = text || placeholder || "0000000000";
  const b = code128Path(t);
  if (!b) return null;
  return (
    <span className="nfb-fv-bar" style={{ opacity: text ? 1 : 0.35 }}>
      <svg viewBox={`0 0 ${b.n} 1`} preserveAspectRatio="none" shapeRendering="crispEdges">
        <path d={b.d} fill="currentColor" />
      </svg>
      <span className="nfb-fv-bar-text">{t}</span>
    </span>
  );
}

function InputView({ f, mode, value, onChange }) {
  const kind = f.input?.kind || "text";
  const live = mode === "fill";
  const opts = (f.input?.options || []).filter(Boolean);
  if (kind === "checkbox") {
    const on = value === true || value === "true";
    return (
      <span className={`nfb-fv-check${on ? " is-on" : ""}${live ? " is-live" : ""}`} onClick={live ? () => onChange(!on) : undefined} role={live ? "checkbox" : undefined} aria-checked={live ? on : undefined}>
        <span className="nfb-fv-box">{on ? "✓" : ""}</span>
        {f.input?.label && <span>{f.input.label}</span>}
      </span>
    );
  }
  if (kind === "radio") {
    const list = opts.length ? opts : ["Yes", "No"];
    return (
      <span className="nfb-fv-radio">
        {list.map((o) => (
          <span key={o} className={`nfb-fv-opt${value === o ? " is-on" : ""}${live ? " is-live" : ""}`} onClick={live ? () => onChange(value === o ? "" : o) : undefined}>
            <span className="nfb-fv-dot" />
            {o}
          </span>
        ))}
      </span>
    );
  }
  if (!live) {
    if (mode === "print" || value) return <span className="nfb-fv-text">{String(value ?? "")}</span>;
    return <span className="nfb-fv-placeholder">{f.input?.label || kind}</span>;
  }
  const common = {
    className: "nfb-fv-input",
    value: value ?? "",
    placeholder: f.input?.label || "",
    onChange: (e) => onChange(e.target.value),
    onPointerDown: (e) => e.stopPropagation(),
  };
  if (kind === "textarea") return <textarea {...common} />;
  return <input {...common} type={kind === "number" ? "number" : kind === "date" ? "date" : kind === "time" ? "time" : "text"} />;
}

function SignatureView({ f, mode, sig, onSign }) {
  if (sig?.image) {
    return (
      <span className="nfb-fv-sig" onClick={mode === "fill" ? onSign : undefined}>
        <img src={sig.image} alt="" />
        {/* name / time are optional (SignaturePad): stamp only what was kept */}
        {(sig.name || sig.at) && <span className="nfb-fv-sig-stamp">{[sig.name, sig.at].filter(Boolean).join(" · ")}</span>}
      </span>
    );
  }
  if (mode === "fill")
    return (
      <span className="nfb-fv-sign-cta" onClick={onSign} onPointerDown={(e) => e.stopPropagation()}>
        ✍ Tap to sign
      </span>
    );
  if (mode === "print") return null;
  return <span className="nfb-fv-placeholder">✍ {f.signature?.label || "Signature"}</span>;
}

/**
 * `text`  resolved value (or design caption) for data-like fields
 * `entry` the entered value for an input; `sig` { image, name, at } for a signature
 */
export default function FieldView({ f, mode = "design", text, entry, sig, onEntry, onSign, dx = 0, dy = 0, className = "", children, ...rest }) {
  let body;
  if (f.type === "qr") body = <QrSvg text={mode === "design" && !text ? "" : text} placeholder="UHID" />;
  else if (f.type === "barcode") body = <BarcodeSvg text={mode === "design" && !text ? "" : text} placeholder="UHID0001" />;
  else if (f.type === "input") body = <InputView f={f} mode={mode} value={entry} onChange={onEntry} />;
  else if (f.type === "signature") body = <SignatureView f={f} mode={mode} sig={sig} onSign={onSign} />;
  else if (isImageValue(text)) body = <img className="nfb-fv-img" src={text} alt="" />;
  else body = <span className="nfb-fv-text">{text}</span>;
  return (
    <div className={`nfb-fv type-${f.type} ${className}`} style={fieldBoxStyle(f, dx, dy)} {...rest}>
      {body}
      {children}
    </div>
  );
}
