/**
 * Click-to-build expressions: pick a field, then what to do with it (as is,
 * a total, a format), then an optional condition — the expression text is
 * written for you and checked with the engine's own parser.
 */
import React, { useMemo, useState } from "react";
import { parseExpr } from "../engine/printEngine";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { Select } from "../ui/fields";

const WRAPS = [
  { value: "", label: "As it is", make: (f) => f },
  { value: "sum", label: "Total of", make: (f) => `sum(${f})` },
  { value: "count", label: "Count of rows", make: () => "count()" },
  { value: "avg", label: "Average of", make: (f) => `avg(${f})` },
  { value: "max", label: "Largest", make: (f) => `max(${f})` },
  { value: "min", label: "Smallest", make: (f) => `min(${f})` },
  { value: "pageSum", label: "Page total of", make: (f) => `pageSum(${f})` },
  { value: "carried", label: "Carried forward", make: (f) => `carriedForward(${f})` },
];
const FORMATS = [
  { value: "", label: "No format", make: (e) => e },
  { value: "money", label: "Money 1,234.50", make: (e) => `format(${e}, 'number:2')` },
  { value: "cur", label: "Currency ₹1,234.50", make: (e) => `format(${e}, 'currency')` },
  { value: "int", label: "Whole number", make: (e) => `format(${e}, 'number:0')` },
  { value: "date", label: "Date 14-Oct-2026", make: (e) => `date(${e}, 'DD-MMM-YYYY')` },
  { value: "dt", label: "Date + time", make: (e) => `date(${e}, 'DD-MMM-YYYY hh:mm A')` },
  { value: "upper", label: "UPPER CASE", make: (e) => `upper(${e})` },
  { value: "proper", label: "Title Case", make: (e) => `proper(${e})` },
  { value: "words", label: "Amount in words", make: (e) => `words(${e})` },
];
const OPS = ["==", "!=", ">", ">=", "<", "<=", "contains"];
const lit = (v) => (v !== "" && !isNaN(Number(v)) ? String(Number(v)) : `'${String(v).replace(/'/g, "\\'")}'`);

export default function ExprBuilder({ fields, onUse, onClose }) {
  const choices = useMemo(() => fields.filter((f) => f.kind !== "set" && f.kind !== "fn"), [fields]);
  const [field, setField] = useState(choices[0]?.path || "");
  const [wrap, setWrap] = useState("");
  const [fmt, setFmt] = useState("");
  const [cf, setCf] = useState("");
  const [op, setOp] = useState("==");
  const [cv, setCv] = useState("");
  const [els, setEls] = useState("");
  let expr = (WRAPS.find((w) => w.value === wrap) || WRAPS[0]).make(field || "x");
  expr = (FORMATS.find((f) => f.value === fmt) || FORMATS[0]).make(expr);
  if (cf) {
    const cond = op === "contains" ? `contains(${cf}, ${lit(cv)})` : `${cf} ${op} ${lit(cv)}`;
    expr = `if(${cond}, ${expr}, ${els === "" ? "''" : lit(els)})`;
  }
  let error = null;
  try {
    parseExpr(expr);
  } catch (e) {
    error = e.message;
  }
  const sel = (value, onChange, opts) => <Select value={value} onChange={onChange} options={opts} />;
  const fieldOpts = choices.map((f) => ({ value: f.path, label: f.path }));
  return (
    <div className="pbx-xb" onMouseDown={(e) => e.stopPropagation()}>
      <div className="pbx-xb-head">
        <Icon name="fx" size={14} /> <b>Build an expression</b>
        <Tap className="is-icon" tone="list" onClick={onClose} title="Close">
          <Icon name="close" size={12} />
        </Tap>
      </div>
      <div className="pbx-xb-step">
        <span className="pbx-xb-no">1</span>
        <label>Field</label>
        {sel(field, setField, fieldOpts.length ? fieldOpts : [{ value: "", label: "Fetch sample first" }])}
      </div>
      <div className="pbx-xb-step">
        <span className="pbx-xb-no">2</span>
        <label>Show</label>
        {sel(wrap, setWrap, WRAPS)}
        {sel(fmt, setFmt, FORMATS)}
      </div>
      <div className="pbx-xb-step">
        <span className="pbx-xb-no">3</span>
        <label>Only if</label>
        {sel(cf, setCf, [{ value: "", label: "(always)" }, ...fieldOpts])}
        {cf && (
          <>
            {sel(op, setOp, OPS.map((o) => ({ value: o, label: o })))}
            <input className="pbx-input" value={cv} onChange={(e) => setCv(e.target.value)} placeholder="value" />
            <input className="pbx-input" value={els} onChange={(e) => setEls(e.target.value)} placeholder="else (blank)" />
          </>
        )}
      </div>
      <code className={`pbx-xb-out${error ? " has-error" : ""}`}>{expr}</code>
      {error && <span className="pbx-expr-error">{error}</span>}
      <div className="pbx-xb-foot">
        <Tap tone="primary" className="is-small" disabled={!!error || !field} onClick={() => onUse(expr)}>
          <Icon name="check" size={12} /> Use it
        </Tap>
      </div>
    </div>
  );
}
