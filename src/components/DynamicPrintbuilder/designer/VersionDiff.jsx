/**
 * Compare two versions of a template (or a version with the draft):
 *   - what changed, element by element (added, removed, moved, edited), in colour;
 *   - the two prints side by side, or overlaid with a "difference" blend so
 *     anything that moved or changed lights up.
 */
import React, { useMemo, useState } from "react";
import { previewHtml } from "../engine/runtime";
import { toolMeta } from "../model/defaults";
import { Segmented } from "../ui/fields";
import Icon from "../ui/Icon";
import { Modal } from "./Dialogs";

const POS = new Set(["x", "y", "w", "h"]);
const flat = (tpl) => {
  const out = new Map();
  for (const b of tpl?.bands || []) {
    const walk = (el, parent) => {
      out.set(el.id, { el, band: b, parent });
      (el.children || []).forEach((k) => walk(k, el));
    };
    (b.elements || []).forEach((e) => walk(e, null));
  }
  return out;
};
const short = (v) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s == null ? "—" : s.length > 60 ? `${s.slice(0, 58)}…` : s;
};
const label = (el) => `${toolMeta(el.type)?.label || el.type} ${el.text ? `“${String(el.text).slice(0, 30)}”` : el.expr ? `= ${String(el.expr).slice(0, 30)}` : el.dataset ? `of ${el.dataset}` : ""}`;

/** Structural differences between two templates: [{ kind: added|removed|moved|edited|band|page, text, detail }]. */
export function diffTemplates(a, b) {
  const out = [];
  const A = flat(a);
  const B = flat(b);
  for (const [id, x] of B) if (!A.has(id)) out.push({ kind: "added", text: `${label(x.el)} added`, detail: `in ${x.band.type}` });
  for (const [id, x] of A) if (!B.has(id)) out.push({ kind: "removed", text: `${label(x.el)} removed`, detail: `from ${x.band.type}` });
  for (const [id, x] of B) {
    const y = A.get(id);
    if (!y) continue;
    const keys = new Set([...Object.keys(x.el), ...Object.keys(y.el)]);
    const moved = [...POS].some((k) => Number(x.el[k]) !== Number(y.el[k]));
    if (moved || x.band.id !== y.band.id)
      out.push({ kind: "moved", text: `${label(x.el)} moved / resized`, detail: `${["x", "y", "w", "h"].map((k) => `${k} ${y.el[k]}→${x.el[k]}`).filter((s) => !/ (\S+)→\1$/.test(s)).join(" · ")}${x.band.id !== y.band.id ? ` · ${y.band.type} → ${x.band.type}` : ""}` });
    const changed = [...keys].filter((k) => !POS.has(k) && k !== "id" && k !== "children" && JSON.stringify(x.el[k]) !== JSON.stringify(y.el[k]));
    if (changed.length) out.push({ kind: "edited", text: `${label(x.el)} edited`, detail: changed.map((k) => `${k}: ${short(y.el[k])} → ${short(x.el[k])}`).join("\n") });
  }
  const bandsA = new Map((a?.bands || []).map((x) => [x.id, x]));
  for (const bb of b?.bands || []) {
    const ba = bandsA.get(bb.id);
    if (!ba) out.push({ kind: "band", text: `${bb.type} band added`, detail: `${bb.height} mm` });
    else {
      const ch = ["height", "printOn", "dataset", "groupBy", "visibleIf", "pageBreakBefore", "pageBreakAfter", "keepTogether", "keepWithNext", "background"].filter((k) => JSON.stringify(ba[k]) !== JSON.stringify(bb[k]));
      if (ch.length) out.push({ kind: "band", text: `${bb.type} band changed`, detail: ch.map((k) => `${k}: ${short(ba[k])} → ${short(bb[k])}`).join("\n") });
    }
  }
  for (const ba of a?.bands || []) if (!(b?.bands || []).some((x) => x.id === ba.id)) out.push({ kind: "band", text: `${ba.type} band removed`, detail: "" });
  for (const k of ["page", "theme", "copies", "labels", "security", "reprint"]) {
    if (JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k])) out.push({ kind: "page", text: `${k} settings changed`, detail: `${short(a?.[k])}\n→ ${short(b?.[k])}` });
  }
  return out;
}

const KIND = { added: ["plus", "Added"], removed: ["trash", "Removed"], moved: ["distH", "Moved"], edited: ["brush", "Edited"], band: ["layers", "Band"], page: ["page", "Settings"] };

export default function VersionDiffDialog({ left, right, sample, onClose }) {
  const [mode, setMode] = useState("side");
  const changes = useMemo(() => diffTemplates(left.template, right.template), [left, right]);
  const data = useMemo(() => sample || {}, [sample]);
  const htmlA = useMemo(() => previewHtml(left.template, data), [left, data]);
  const htmlB = useMemo(() => previewHtml(right.template, data), [right, data]);
  const counts = changes.reduce((m, c) => ({ ...m, [c.kind]: (m[c.kind] || 0) + 1 }), {});
  return (
    <Modal title={`Compare ${left.title} → ${right.title}`} icon="compare" full onClose={onClose}>
      <div className="pbx-diff">
        <aside className="pbx-diff-list">
          <div className="pbx-diff-sum">
            {Object.entries(KIND).map(([k, [, t]]) =>
              counts[k] ? (
                <span key={k} className={`pbx-diffchip is-${k}`}>
                  {counts[k]} {t.toLowerCase()}
                </span>
              ) : null,
            )}
            {!changes.length && <span className="pbx-diffchip is-same">No differences</span>}
          </div>
          <ul>
            {changes.map((c, i) => (
              <li key={i} className={`pbx-diffrow is-${c.kind}`} title={c.detail}>
                <Icon name={KIND[c.kind][0]} size={13} />
                <span>
                  <b>{c.text}</b>
                  {c.detail && <small>{c.detail}</small>}
                </span>
              </li>
            ))}
          </ul>
        </aside>
        <section className="pbx-diff-view">
          <div className="pbx-diff-bar">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "side", label: "Side by side" },
                { value: "overlay", label: "Overlay (differences light up)" },
              ]}
            />
            <span className="pbx-muted">{sample ? "Both printed with the current sample data" : "No sample data: fields print empty"}</span>
          </div>
          {mode === "side" ? (
            <div className="pbx-diff-side">
              <figure>
                <figcaption className="is-old">{left.title}</figcaption>
                <iframe title="old" srcDoc={htmlA} sandbox="allow-scripts allow-same-origin" />
              </figure>
              <figure>
                <figcaption className="is-new">{right.title}</figcaption>
                <iframe title="new" srcDoc={htmlB} sandbox="allow-scripts allow-same-origin" />
              </figure>
            </div>
          ) : (
            <div className="pbx-diff-overlay">
              <iframe title="old" srcDoc={htmlA} sandbox="allow-scripts allow-same-origin" />
              <iframe title="new" className="is-top" srcDoc={htmlB} sandbox="allow-scripts allow-same-origin" />
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
