/**
 * Columns of a Table element: header, value expression (row scope), width,
 * alignment, format, and the footer (static text and/or an aggregate such as
 * sum(Amount)). Reorder, add one, or add every field of the row set at once.
 */
import React, { useState } from "react";
import { FORMAT_TYPES, uid } from "../model/defaults";
import { NumberInput, Row, Segmented, Select, TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { ExprInput, TokenText } from "./ExprInput";
import RulesEditor from "./RulesEditor";

const pretty = (f) => String(f).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

export default function TableEditor({ el, setFields, onChange, fields }) {
  const [open, setOpen] = useState(null);
  const cols = el.columns || [];
  const total = cols.reduce((a, c) => a + (Number(c.width) || 20), 0) || 1;
  const set = (i, patch) => onChange((x) => {
    x.columns[i] = { ...x.columns[i], ...patch };
  }, `col:${el.id}:${i}`);
  const move = (i, d) => onChange((x) => {
    const j = i + d;
    if (j < 0 || j >= x.columns.length) return;
    [x.columns[i], x.columns[j]] = [x.columns[j], x.columns[i]];
  });
  const remove = (i) => onChange((x) => {
    x.columns.splice(i, 1);
  });
  const add = (field) => {
    const c = { id: uid("c"), header: field ? pretty(field) : "Column", expr: field || "", width: 20 };
    onChange((x) => {
      x.columns = [...(x.columns || []), c];
    });
    setOpen(c.id);
  };
  const addAll = () => {
    const have = new Set(cols.map((c) => c.expr));
    const next = (setFields || []).filter((f) => !have.has(f)).slice(0, 12).map((f) => ({ id: uid("c"), header: pretty(f), expr: f, width: 20 }));
    onChange((x) => {
      x.columns = [...(x.columns || []), ...next];
    });
  };

  return (
    <div className="pbx-cols">
      <div className="pbx-cols-bar" aria-hidden="true">
        {cols.map((c) => (
          <span key={c.id} style={{ flexGrow: Number(c.width) || 20 }} title={`${c.header} · ${(((Number(c.width) || 20) / total) * 100).toFixed(0)}%`}>
            {c.header || "·"}
          </span>
        ))}
      </div>
      {cols.map((c, i) => (
        <div key={c.id} className={`pbx-col${open === c.id ? " is-open" : ""}`}>
          <div className="pbx-col-head">
            <Tap className="pbx-col-name" onClick={() => setOpen(open === c.id ? null : c.id)}>
              <span className="pbx-caret">{open === c.id ? "▾" : "▸"}</span>
              <b>{c.header || "(no header)"}</b>
              <code>{c.expr || "—"}</code>
            </Tap>
            <Tap className="is-icon" tone="list" onClick={() => move(i, -1)} title="Move left" disabled={i === 0}>
              <Icon name="up" size={13} />
            </Tap>
            <Tap className="is-icon" tone="list" onClick={() => move(i, 1)} title="Move right" disabled={i === cols.length - 1}>
              <Icon name="down" size={13} />
            </Tap>
            <Tap className="is-icon" tone="danger" onClick={() => remove(i)} title="Remove column">
              <Icon name="trash" size={13} />
            </Tap>
          </div>
          {open === c.id && (
            <div className="pbx-col-body">
              <Row label="Header">
                <TextInput value={c.header} onChange={(v) => set(i, { header: v })} />
              </Row>
              <Row label="Value" hint="Row fields by name (Qty * Rate), rowNumber for #">
                <ExprInput value={c.expr} onChange={(v) => set(i, { expr: v })} fields={fields} placeholder="ItemName" />
              </Row>
              <Row label="Width" hint="Relative to the other columns">
                <NumberInput value={c.width} onChange={(v) => set(i, { width: v })} step={1} min={1} />
              </Row>
              <Row label="Align">
                <Segmented
                  value={c.align || "auto"}
                  onChange={(v) => set(i, { align: v })}
                  options={[
                    { value: "auto", label: "Auto" },
                    { value: "left", icon: <Icon name="alignL" size={13} />, title: "Left" },
                    { value: "center", icon: <Icon name="alignC" size={13} />, title: "Centre" },
                    { value: "right", icon: <Icon name="alignR" size={13} />, title: "Right" },
                  ]}
                />
              </Row>
              <Row label="Format">
                <Select value={c.format?.type || "none"} onChange={(v) => set(i, { format: v === "none" ? undefined : { ...(c.format || {}), type: v } })} options={FORMAT_TYPES} />
              </Row>
              {["number", "currency", "percent"].includes(c.format?.type) && (
                <Row label="Decimals">
                  <NumberInput value={c.format?.decimals ?? 2} onChange={(v) => set(i, { format: { ...c.format, decimals: v } })} step={1} min={0} max={6} />
                </Row>
              )}
              {["date", "datetime", "time"].includes(c.format?.type) && (
                <Row label="Pattern">
                  <TextInput mono value={c.format?.pattern} placeholder="DD-MMM-YYYY" onChange={(v) => set(i, { format: { ...c.format, pattern: v } })} />
                </Row>
              )}
              <Row label="Bold">
                <Toggle value={!!c.bold} onChange={(v) => set(i, { bold: v })} />
              </Row>
              <Row label="Too long" hint="What a value wider than the column does. Shrink keeps it on one line with a smaller font, never cut off.">
                <Select
                  value={c.fit === "shrink" ? "shrink" : c.fit === "words" ? "words" : c.wrap === false ? "cut" : "wrap"}
                  onChange={(v) => set(i, v === "shrink" || v === "words" ? { fit: v, wrap: undefined } : { fit: undefined, wrap: v === "wrap" ? undefined : false })}
                  options={[
                    { value: "wrap", label: "Wrap lines" },
                    { value: "words", label: "Wrap lines, shrink long words" },
                    { value: "cut", label: "One line, cut off …" },
                    { value: "shrink", label: "One line, shrink to fit" },
                  ]}
                />
              </Row>
              <Row label="If empty">
                <TextInput value={c.nullText} placeholder="(blank)" onChange={(v) => set(i, { nullText: v })} />
              </Row>
              <div className="pbx-col-sub">Colour rules</div>
              <RulesEditor rules={c.styleRules} onChange={(r) => set(i, { styleRules: r })} fields={fields} hint="Per cell: value = this cell's value, other row fields by name" />

              <Row label="Role" hint="What the column holds, for narrow papers: on thermal rolls the S.No. and the item name print on line 1, the rest under them. Auto works it out from the binding.">
                <Select
                  value={c.role || ""}
                  onChange={(v) => set(i, { role: v || undefined })}
                  options={[
                    { value: "", label: "Auto" },
                    { value: "serial", label: "S.No." },
                    { value: "name", label: "Item name" },
                    { value: "qty", label: "Quantity" },
                    { value: "rate", label: "Rate" },
                    { value: "amount", label: "Amount" },
                    { value: "text", label: "Other text" },
                  ]}
                />
              </Row>
              <Row label="Optional" hint="Dropped on A5 and thermal papers (e.g. batch, HSN); kept on A4 / Letter / Legal">
                <Toggle value={c.priority === "optional"} onChange={(v) => set(i, { priority: v ? "optional" : undefined, mergeInto: v ? c.mergeInto : undefined })} />
              </Row>
              {c.priority === "optional" && (
                <Row label="Merge into" hint="On narrow papers, print this column inside another column's cell (e.g. Expiry under Batch → “Batch / Expiry”) instead of dropping it">
                  <Select
                    value={c.mergeInto || ""}
                    onChange={(v) => set(i, { mergeInto: v || undefined })}
                    options={[
                      { value: "", label: "— drop it" },
                      ...cols.filter((o, j) => j !== i && o.id && o.priority !== "optional").map((o) => ({ value: o.id, label: o.header || o.expr || o.id })),
                    ]}
                  />
                </Row>
              )}
              <div className="pbx-col-sub">Footer row</div>
              <Row label="Total" hint="Aggregate over the table's rows, e.g. sum(Amount), count()">
                <ExprInput value={c.footerExpr} onChange={(v) => set(i, { footerExpr: v })} fields={fields} placeholder="sum(Amount)" />
              </Row>
              <Row label="Text" hint="Static text, may hold {{count()}}">
                <TokenText value={c.footerText} onChange={(v) => set(i, { footerText: v })} fields={fields} rows={1} />
              </Row>
            </div>
          )}
        </div>
      ))}
      <div className="pbx-cols-actions">
        <Tap tone="add" onClick={() => add("")}>
          ＋ Column
        </Tap>
        <Tap tone="list" onClick={addAll} disabled={!setFields?.length} title={setFields?.length ? "Add every field of the row set" : "Fetch sample data to list the fields"}>
          ＋ All fields
        </Tap>
      </div>
    </div>
  );
}
