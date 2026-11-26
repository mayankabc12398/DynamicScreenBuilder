/**
 * Expression and template-text inputs with field autocomplete.
 *
 * ExprInput   — a bare expression (`bill.NetAmount`, `Qty * Rate`), checked
 *               with the engine's own parser as you type.
 * TokenText   — text that may hold {{expr}} tokens (labels, headers); "＋ Field"
 *               inserts a token at the caret.
 *
 * Suggestions come from the field list (`useFieldList`): row fields of the
 * scope's result set first, then result sets, then params/user/centre/header/sys.
 */
import React, { useMemo, useRef, useState } from "react";
import { parseExpr, ROOT_KEYS } from "../engine/printEngine";
import Tap from "../ui/Tap";
import ExprBuilder from "./ExprBuilder";

const FUNCS = ["pageSum(", "carriedForward(", "broughtForward(", "between(", "pad(", "oneof(", "sum(", "count()", "avg(", "min(", "max(", "first(", "last(", "distinct(", "if(", "coalesce(", "concat(", "upper(", "lower(", "trim(", "round(", "format(", "date(", "words(", "inrwords(", "intlwords(", "lakhwords(", "millionwords(","proper(", "fixed(", "striptags(", "htmlblocks(", "len(", "num(", "text(", "contains(", "replace(", "left(", "right(", "substr(", "now()", "today()", "isEmpty("];

/** Every path a template can bind to, for a given row scope. */
export function fieldList(schema, scopeSet, params = []) {
  const out = [];
  const sets = schema?.sets || {};
  if (scopeSet && sets[scopeSet]) for (const f of sets[scopeSet]) out.push({ path: f, kind: "row", hint: `row of ${scopeSet}` });
  for (const [set, fields] of Object.entries(sets)) {
    out.push({ path: set, kind: "set", hint: "result set" });
    for (const f of fields) out.push({ path: `${set}.${f}`, kind: "field", hint: set });
  }
  for (const p of params) out.push({ path: `params.${p}`, kind: "param", hint: "request parameter" });
  for (const [root, keys] of Object.entries(ROOT_KEYS)) for (const k of keys) out.push({ path: `${root}.${k}`, kind: "root", hint: root });
  for (const v of ["page", "pages", "rowNumber", "group", "groupCount", "parent", "pageRows", "carriedRows", "broughtRows"]) out.push({ path: v, kind: "var", hint: "variable" });
  for (const f of schema?.rootFields || []) out.push({ path: f, kind: "field", hint: "calculated" });
  return out;
}

const wordBefore = (text, caret) => {
  const m = text.slice(0, caret).match(/[A-Za-z_$][\w$.]*$/);
  return m ? m[0] : "";
};

function useSuggest(fields, value, caret, active) {
  return useMemo(() => {
    if (!active) return [];
    const w = wordBefore(value || "", caret).toLowerCase();
    if (!w) return [];
    const pool = [...fields.map((f) => ({ ...f, insert: f.path })), ...FUNCS.map((fn) => ({ path: fn, insert: fn, kind: "fn", hint: "function" }))];
    const starts = pool.filter((f) => f.path.toLowerCase().startsWith(w));
    const has = pool.filter((f) => !f.path.toLowerCase().startsWith(w) && f.path.toLowerCase().includes(w));
    return [...starts, ...has].slice(0, 12);
  }, [fields, value, caret, active]);
}

function SuggestList({ items, onPick, index }) {
  if (!items.length) return null;
  return (
    <ul className="pbx-suggest" role="listbox">
      {items.map((s, i) => (
        <li
          key={`${s.kind}:${s.path}`}
          role="option"
          aria-selected={i === index}
          className={i === index ? "is-active" : ""}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(s);
          }}
        >
          <span className={`pbx-chip kind-${s.kind}`}>{s.kind}</span>
          <span className="pbx-suggest-path">{s.path}</span>
          <span className="pbx-suggest-hint">{s.hint}</span>
        </li>
      ))}
    </ul>
  );
}

export function ExprInput({ value, onChange, fields = [], placeholder = "e.g. bill.NetAmount", allowEmpty = true }) {
  const ref = useRef(null);
  const [caret, setCaret] = useState(0);
  const [focus, setFocus] = useState(false);
  const [idx, setIdx] = useState(0);
  const [build, setBuild] = useState(false);
  const items = useSuggest(fields, value, caret, focus);
  let error = null;
  if (value && String(value).trim()) {
    try {
      parseExpr(value);
    } catch (e) {
      error = e.message;
    }
  } else if (!allowEmpty) error = "Required";

  const pick = (s) => {
    const v = value || "";
    const w = wordBefore(v, caret);
    const next = v.slice(0, caret - w.length) + s.insert + v.slice(caret);
    onChange(next);
    const pos = caret - w.length + s.insert.length - (s.insert.endsWith("()") ? 1 : 0);
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(pos, pos);
        setCaret(pos);
      }
    });
  };

  return (
    <span className={`pbx-expr${error ? " has-error" : ""}`}>
      <Tap className="pbx-expr-fx" onClick={() => setBuild((b) => !b)} title="Build it by clicking: field → total / format → condition">
        ƒ
      </Tap>
      {build && (
        <ExprBuilder
          fields={fields}
          onClose={() => setBuild(false)}
          onUse={(v) => {
            onChange(v);
            setBuild(false);
          }}
        />
      )}
      <input
        ref={ref}
        className="pbx-input is-mono"
        value={value ?? ""}
        placeholder={placeholder}
        spellCheck={false}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 120)}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart || 0);
          setIdx(0);
        }}
        onKeyUp={(e) => setCaret(e.currentTarget.selectionStart || 0)}
        onClick={(e) => setCaret(e.currentTarget.selectionStart || 0)}
        onKeyDown={(e) => {
          if (!items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIdx((i) => Math.min(items.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIdx((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            pick(items[Math.min(idx, items.length - 1)]);
          } else if (e.key === "Escape") setFocus(false);
        }}
      />
      {focus && <SuggestList items={items} index={idx} onPick={pick} />}
      {error && <span className="pbx-expr-error">{error}</span>}
    </span>
  );
}

/** A searchable list of fields; picking one calls onPick(path). */
export function FieldPicker({ fields, onPick, onClose }) {
  const [q, setQ] = useState("");
  const list = fields.filter((f) => f.kind !== "set" && (!q || f.path.toLowerCase().includes(q.toLowerCase()))).slice(0, 60);
  return (
    <div className="pbx-picker" onMouseLeave={onClose}>
      <input autoFocus className="pbx-input" placeholder="Search fields…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onClose()} />
      <ul>
        {list.map((f) => (
          <li key={`${f.kind}:${f.path}`} onMouseDown={(e) => { e.preventDefault(); onPick(f.path); }}>
            <span className={`pbx-chip kind-${f.kind}`}>{f.kind}</span>
            <span className="pbx-suggest-path">{f.path}</span>
          </li>
        ))}
        {!list.length && <li className="is-empty">No fields — fetch sample data first.</li>}
      </ul>
    </div>
  );
}

const TOKEN_RE = /\{\{([\s\S]+?)\}\}/g;

export function TokenText({ value, onChange, fields = [], rows = 2, placeholder }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const errors = [];
  for (const m of String(value || "").matchAll(TOKEN_RE)) {
    try {
      parseExpr(m[1].trim());
    } catch (e) {
      errors.push(`{{${m[1].trim()}}}: ${e.message}`);
    }
  }
  const insert = (path) => {
    const el = ref.current;
    const v = value || "";
    const a = el ? el.selectionStart : v.length;
    const b = el ? el.selectionEnd : v.length;
    const tok = `{{${path}}}`;
    onChange(v.slice(0, a) + tok + v.slice(b));
    setOpen(false);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(a + tok.length, a + tok.length);
      }
    });
  };
  return (
    <span className={`pbx-tokentext${errors.length ? " has-error" : ""}`}>
      <textarea ref={ref} className="pbx-input pbx-textarea" rows={rows} value={value ?? ""} placeholder={placeholder} spellCheck={false} onChange={(e) => onChange(e.target.value)} />
      <span className="pbx-tokentext-bar">
        <Tap tone="add" className="is-small" onClick={() => setOpen((o) => !o)}>
          ＋ Field
        </Tap>
        {errors.length > 0 && <span className="pbx-expr-error">{errors[0]}</span>}
      </span>
      {open && <FieldPicker fields={fields} onPick={insert} onClose={() => setOpen(false)} />}
    </span>
  );
}
