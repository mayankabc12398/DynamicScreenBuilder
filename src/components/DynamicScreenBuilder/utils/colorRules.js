/**
 * Rule-based conditional colouring — a first class feature of the builder.
 *
 * A rule looks like:
 *   { id, field:"Status", op:"eq", value:"Urgent",
 *     target:"chip"|"row"|"text"|"icon"|"card"|"border"|"accent",
 *     bg:"#FDE047", fg:"#713F12", border:"#EAB308", swatch:"Urgent" }
 *
 * Rules are evaluated in order against a record (a grid row, a card, or the
 * screen scope for non-repeating components). The FIRST match for a target
 * wins, which makes "most specific first" the authoring convention.
 *
 * A colour does not have to be a literal. Any of bg/fg/border may be a binding
 * — `{{row.ColorCode}}` — because the HIS endpoints ship their own palette:
 * the triage list returns CodeType together with the ColorCode it is drawn in,
 * and a screen that hardcodes the colours goes stale the moment someone adds a
 * triage level. Bindings are resolved per record, so every row can differ.
 */
import { evalCondition, getPath, hasTemplate, interpolate } from "./expressions";

export const COLOR_TARGETS = [
  { key: "row", label: "Table row background" },
  { key: "card", label: "Card background" },
  { key: "chip", label: "Chip / badge" },
  { key: "text", label: "Text colour" },
  { key: "icon", label: "Icon colour" },
  { key: "border", label: "Border colour" },
  { key: "accent", label: "Accent bar" },
];

/**
 * @param {Array}  rules   node.rules.color
 * @param {Object} record  the row/record being coloured
 * @param {string} target  which visual target we are resolving
 * @param {Object} scope   full runtime scope, so rules can reference {{values.x}}
 * @returns {{bg?:string, fg?:string, border?:string}|null}
 */
export function resolveColor(rules, record, target, scope = {}) {
  if (!Array.isArray(rules) || !rules.length) return null;
  const evalScope = { ...scope, row: record, ...(record || {}) };
  for (let i = 0; i < rules.length; i += 1) {
    const r = rules[i];
    if (!r || (r.target || "chip") !== target) continue;
    const ok = evalCondition({ field: r.field, op: r.op, value: r.value }, evalScope);
    if (ok) {
      return {
        bg: bound(r.bg, evalScope),
        fg: bound(r.fg, evalScope),
        border: bound(r.border, evalScope),
      };
    }
  }
  return null;
}

/**
 * A colour a rule wrote: a literal, or a binding read off the record.
 *
 * A binding that resolves to nothing comes back empty rather than as the
 * string "undefined", so the caller's own fallback takes over — which is what
 * makes "colour from the data, default when the data has none" work.
 */
function bound(value, evalScope) {
  if (typeof value !== "string" || !value) return "";
  if (!hasTemplate(value)) return value;
  const out = interpolate(value, evalScope);
  return out === null || out === undefined ? "" : String(out).trim();
}

/** Convenience: turn a resolved colour into a style object. */
export function colorStyle(resolved, extra = {}) {
  if (!resolved) return extra;
  const style = { ...extra };
  if (resolved.bg) style.backgroundColor = resolved.bg;
  if (resolved.fg) style.color = resolved.fg;
  if (resolved.border) style.borderColor = resolved.border;
  return style;
}

/** What a chip falls back to when neither a rule, the data nor a default says. */
export const CHIP_FALLBACK = { bg: "var(--dsb-surface-alt)", fg: "var(--dsb-text-muted)" };

/** A column field naming a colour, read off the record. Blank when it has none. */
function fieldColor(record, name) {
  if (!name) return "";
  const v = getPath(record, name);
  return v === null || v === undefined || v === "" ? "" : String(v).trim();
}

/**
 * Column-level chip rules reuse the same evaluator with an implicit field, and
 * add the two things a rule list cannot express on its own.
 *
 * `colorField` / `textColorField` name a column of the RESULT that carries the
 * colour — the triage endpoint's ColorCode, a status palette, anything the
 * server already decides. `defaultBg` / `defaultFg` are what a row gets when
 * it does not carry one, which is the case the hand-coded pages write as
 * `ColorCode || "#94a3b8"`.
 *
 * Background and text resolve independently, so the common shape — colour from
 * the data, white text always — needs no rule at all. Order per part:
 * a matching rule, then the data, then the default, then the muted fallback.
 */
export function resolveChipColor(column, value, record, scope = {}) {
  const row = { ...(record || {}), [column.key]: value };
  const rules = (column?.chipRules || []).map((r) => ({ ...r, target: "chip", field: r.field || column.key }));
  const hit = resolveColor(rules, row, "chip", scope) || {};
  return {
    bg: hit.bg || fieldColor(row, column?.colorField) || column?.defaultBg || CHIP_FALLBACK.bg,
    fg: hit.fg || fieldColor(row, column?.textColorField) || column?.defaultFg || CHIP_FALLBACK.fg,
    border: hit.border || column?.defaultBorder || "",
  };
}

/* --------------------------------------------------------------- options */

/** The ways a select can wear its option colours. */
export const OPTION_PAINT_MODES = [
  { value: "", label: "Not coloured" },
  { value: "fill", label: "Fill the whole row" },
  { value: "chip", label: "Chip behind the label" },
  { value: "dot", label: "Dot before the label" },
];

/**
 * The colour one dropdown option is drawn in.
 *
 * Same three sources a chip column has, in the same order — a matching rule,
 * then a field of the option's own row, then the default. The row is what
 * makes an endpoint-backed list work without listing every value by hand: the
 * triage endpoint returns CodeType together with the ColorCode it is drawn in,
 * so `colourField: "ColorCode"` colours levels nobody has added yet.
 *
 * Rules read the option's `value` unless they name a field, so a static list
 * — which has no row to read — is still coverable one value at a time.
 */
export function resolveOptionColor(cfg, option, scope = {}) {
  // The option first, then the row it came from: a static list carries its
  // extra fields on the option itself, an endpoint-backed one on the row.
  const record = { ...(option || {}), ...(option?.row || {}), value: option?.value, label: option?.label };
  const rules = (cfg?.optionColorRules || []).map((r) => ({ ...r, target: "chip", field: r.field || "value" }));
  const hit = resolveColor(rules, record, "chip", scope) || {};
  const bg = hit.bg || fieldColor(record, cfg?.optionColorField) || cfg?.optionDefaultBg || "";
  const fg = hit.fg || fieldColor(record, cfg?.optionTextColorField) || cfg?.optionDefaultFg || "";
  const border = hit.border || cfg?.optionDefaultBorder || "";
  return bg || fg || border ? { bg, fg, border } : null;
}

/**
 * The option list with its colours attached, ready for the shared selects.
 *
 * Options nothing colours come back untouched rather than carrying empty
 * colours, so a select that resolves no colour at all renders exactly as it
 * did before the feature existed.
 */
export function paintOptions(options, cfg, scope = {}) {
  const mode = cfg?.optionColorMode || "";
  if (!mode || !Array.isArray(options) || !options.length) return options || [];
  return options.map((o) => {
    const c = resolveOptionColor(cfg, o, scope);
    return c ? { ...o, bg: c.bg, fg: c.fg, border: c.border, paint: mode } : o;
  });
}
