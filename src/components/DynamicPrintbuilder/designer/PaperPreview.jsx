/**
 * The template on another paper than its master: the print document the engine
 * makes for that paper (adaptTemplate on the master — the same shell and engine
 * the API prints with), read-only. Edits are made on the master; they show here
 * at once because this re-renders from the same template.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { previewHtml } from "../engine/runtime";
import { NumberInput } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";

/** "A4" · "A4|landscape" · "Thermal80" · "Custom" → the engine's paper object. */
export function paperOf(view, custom) {
  if (!view) return null;
  const [size, orientation] = view.split("|");
  return { size, orientation: orientation || "portrait", ...(size === "Custom" ? { width: custom.w, height: custom.h } : {}) };
}

export const VIEW_OPTIONS = [
  { value: "A4", label: "A4 portrait" },
  { value: "A4|landscape", label: "A4 landscape" },
  { value: "A5", label: "A5" },
  { value: "A5|landscape", label: "A5 landscape" },
  { value: "Letter", label: "Letter" },
  { value: "Legal", label: "Legal" },
  { value: "Thermal80", label: "Thermal 80 mm" },
  { value: "Thermal58", label: "Thermal 58 mm" },
  { value: "Custom", label: "Custom size" },
];

export default function PaperPreview({ template, sample, duplicate, view, masterLabel, onBack }) {
  const frame = useRef(null);
  const [result, setResult] = useState(null);
  const [custom, setCustom] = useState({ w: 100, h: 150 });
  const paper = useMemo(() => paperOf(view, custom), [view, custom]);
  const data = useMemo(() => {
    const base = sample ? JSON.parse(JSON.stringify(sample)) : {};
    base.sys = { ...(base.sys || {}), duplicate };
    return base;
  }, [sample, duplicate]);
  // re-render a moment after the last edit, not on every keystroke
  const [tpl, setTpl] = useState(template);
  useEffect(() => {
    const t = setTimeout(() => setTpl(template), 250);
    return () => clearTimeout(t);
  }, [template]);
  const html = useMemo(() => previewHtml(tpl, data, { paper }), [tpl, data, paper]);
  useEffect(() => {
    setResult(null);
    const on = (e) => {
      if (e.data && e.data.type === "pb-rendered" && frame.current && e.source === frame.current.contentWindow) setResult(e.data.result);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [html]);
  return (
    <div className="pbx-paperpreview">
      <div className="pbx-paperpreview-bar" role="status">
        <Icon name="eye" size={14} />
        <b>Auto layout from {masterLabel} master</b>
        <span>— edit in {masterLabel}.</span>
        {view === "Custom" && (
          <span className="pbx-paperpreview-custom">
            <NumberInput value={custom.w} onChange={(v) => setCustom((c) => ({ ...c, w: v || 100 }))} step={1} suffix="mm" />
            ×
            <NumberInput value={custom.h} onChange={(v) => setCustom((c) => ({ ...c, h: v || 150 }))} step={1} suffix="mm" />
          </span>
        )}
        <span className="pbx-paperpreview-stat">
          {result
            ? result.ok
              ? `${result.profile} · ${result.pages} page${result.pages === 1 ? "" : "s"} · ${Math.round(result.widthMm)} × ${Math.round(result.heightMm)} mm${result.overflow?.length ? ` · cut off: ${result.overflow[0]}` : ""}`
              : (result.errors || []).join(" · ")
            : "Laying out…"}
          {!sample && " · no sample data"}
        </span>
        <Tap tone="list" className="is-small" onClick={onBack} title="Back to the master to edit">
          <Icon name="back" size={12} /> Edit in {masterLabel}
        </Tap>
      </div>
      <iframe ref={frame} className="pbx-paperpreview-frame" title="Auto layout preview" srcDoc={html} sandbox="allow-scripts allow-same-origin" />
    </div>
  );
}
