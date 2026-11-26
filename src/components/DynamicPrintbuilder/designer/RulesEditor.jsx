/**
 * Colour rules: "when this is true, print it like this". Used for an element,
 * a table column (per cell) and a table's rows. Rules apply in order, a later
 * one wins a property; "Stop" ends the list at the first rule that matches.
 * `value` is the element's / cell's own value, so `value < 0` needs no field name.
 */
import React from "react";
import { ColorInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { ExprInput } from "./ExprInput";

const EXAMPLES = [
  { when: "value < 0", color: "#b91c1c", label: "Negative in red" },
  { when: "value > 0", color: "#b91c1c", bold: true, label: "Due amount bold red" },
  { when: "Status == 'Cancelled'", color: "#9ca3af", strike: true, label: "Cancelled struck out" },
];

export default function RulesEditor({ rules, onChange, fields, hint = "value = this one's own value", examples = true }) {
  const list = Array.isArray(rules) ? rules : [];
  const put = (next) => onChange(next.length ? next : undefined);
  const set = (i, patch) =>
    put(
      list.map((r, k) => {
        if (k !== i) return r;
        const n = { ...r, ...patch };
        Object.keys(n).forEach((key) => (n[key] === undefined || n[key] === false || n[key] === "") && delete n[key]);
        return n;
      }),
    );
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    put(n);
  };
  return (
    <div className="pbx-rules">
      {list.map((r, i) => (
        <div key={i} className="pbx-rule">
          <div className="pbx-rule-head">
            <span className="pbx-rule-no">{i + 1}</span>
            <span className="pbx-rule-when">When</span>
            <Tap className="is-icon" tone="list" onClick={() => move(i, -1)} disabled={i === 0} title="Earlier">
              <Icon name="up" size={12} />
            </Tap>
            <Tap className="is-icon" tone="danger" onClick={() => put(list.filter((_, k) => k !== i))} title="Remove rule">
              <Icon name="trash" size={12} />
            </Tap>
          </div>
          <ExprInput value={r.when} onChange={(v) => set(i, { when: v })} fields={fields} placeholder="value < 0" />
          <div className="pbx-rule-look">
            <label className="pbx-mini">
              <span>Text</span>
              <ColorInput value={r.color} onChange={(v) => set(i, { color: v || undefined })} />
            </label>
            <label className="pbx-mini">
              <span>Fill</span>
              <ColorInput value={r.background} onChange={(v) => set(i, { background: v || undefined })} />
            </label>
            <span className="pbx-inline">
              <Tap tone="list" active={!!r.bold} onClick={() => set(i, { bold: !r.bold })} title="Bold">
                <b>B</b>
              </Tap>
              <Tap tone="list" active={!!r.italic} onClick={() => set(i, { italic: !r.italic })} title="Italic">
                <i>I</i>
              </Tap>
              <Tap tone="list" active={!!r.underline} onClick={() => set(i, { underline: !r.underline })} title="Underline">
                <u>U</u>
              </Tap>
              <Tap tone="list" active={!!r.strike} onClick={() => set(i, { strike: !r.strike })} title="Strike through">
                <s>S</s>
              </Tap>
            </span>
          </div>
          <Toggle value={!!r.stop} onChange={(v) => set(i, { stop: v })} label="Stop here when it matches" />
        </div>
      ))}
      <div className="pbx-inline">
        <Tap tone="add" className="is-small" onClick={() => put([...list, { when: "", color: "#b91c1c" }])}>
          ＋ Rule
        </Tap>
        {examples && !list.length &&
          EXAMPLES.map(({ label, ...ex }) => (
            <Tap key={label} tone="list" className="is-small" onClick={() => put([ex])} title={ex.when}>
              {label}
            </Tap>
          ))}
      </div>
      {hint && <p className="pbx-hint">{hint}</p>}
    </div>
  );
}
