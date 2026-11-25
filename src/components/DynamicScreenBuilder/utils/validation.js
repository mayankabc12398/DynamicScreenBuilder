/** Field validation driven purely by node.validation from the inspector. */
import { evalVisibility, getPath, interpolate } from "./expressions";

export function validateValue(value, rules) {
  if (!rules) return null;
  const v = value;
  const isEmpty = v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length);

  if (rules.required && isEmpty) return rules.message || "This field is required";
  if (isEmpty) return null; // nothing else applies to an empty optional field

  const str = typeof v === "object" ? JSON.stringify(v) : String(v);
  const num = parseFloat(v);

  if (rules.minLength != null && str.length < Number(rules.minLength))
    return rules.message || `Minimum ${rules.minLength} characters`;
  if (rules.maxLength != null && str.length > Number(rules.maxLength))
    return rules.message || `Maximum ${rules.maxLength} characters`;
  if (rules.min != null && !Number.isNaN(num) && num < Number(rules.min))
    return rules.message || `Minimum value is ${rules.min}`;
  if (rules.max != null && !Number.isNaN(num) && num > Number(rules.max))
    return rules.message || `Maximum value is ${rules.max}`;
  if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))
    return rules.message || "Enter a valid email address";
  if (rules.regex) {
    try {
      if (!new RegExp(rules.regex).test(str)) return rules.message || "Invalid format";
    } catch (e) {
      /* an invalid pattern typed in the inspector must not break the screen */
    }
  }
  return null;
}

/**
 * Which node types hold a value, for the ones that do not say so with a
 * `field` prop. A range writes two fields and names neither of them `field`.
 */
const RANGE_FIELDS = { DateRangePicker: ["fieldFrom", "fieldTo"] };

/**
 * The keys one control's value is stored under.
 *
 * The same rule `useFieldValue` follows: the field name if it was given one,
 * otherwise the node's own id. Reading only `props.field` was how a control
 * nobody had named passed every validation rule it was given — the value was
 * under the node id, and nothing looked there.
 *
 * An empty list means "not a control": a Card with a stray Required toggle must
 * not block a form it holds no answer for.
 */
export function valueKeysOf(node) {
  const range = RANGE_FIELDS[node?.type];
  if (range) return range.map((k) => node?.props?.[k]).filter(Boolean);
  if (node?.props?.field !== undefined || node?.props?.name !== undefined) {
    return [node.props.field || node.props.name || node.id];
  }
  return [];
}

/**
 * Screen level "validate all" used by submit actions.
 *
 * A field the screen is not showing is not part of the answer: one hidden by a
 * visibility rule, or disabled by one, is skipped — otherwise a rule-driven
 * form fails on an error nobody can see, with nothing on screen to fix. Rules
 * work the other way too: `require` makes a field mandatory for as long as its
 * condition holds, exactly as the inspector's Required toggle does.
 *
 * @param nodes  flattened node list
 * @param values current form values keyed by field name
 * @param scope  what the rules are judged against (RuntimeContext.buildScope)
 * @param role   the signed-in role, for a node restricted to other roles
 * @returns { valid:boolean, errors:{ [field]:string } }
 */
export function validateAll(nodes, values, scope = {}, role = "") {
  const errors = {};
  nodes.forEach((n) => {
    const keys = valueKeysOf(n);
    if (!keys.length || n.hidden) return;
    const visibleTo = n.roles?.visibleTo || [];
    if (visibleTo.length && role && !visibleTo.includes(role)) return;
    const state = evalVisibility(n.rules?.visibility, scope);
    if (!state.visible || !state.enabled) return;
    const rules = state.required ? { ...(n.validation || {}), required: true } : n.validation;
    keys.forEach((field) => {
      if (errors[field]) return;
      const err = validateValue(values?.[field], rules);
      if (err) errors[field] = err;
    });
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * A filled value in the shape a multi select stores: a list of option values.
 *
 * The box only ticks what is in a list, and what a row carries rarely is one —
 * "2,5" from a CSV column, "[2,5]" from a JSON one, a lone 2, or the records
 * themselves ([{ StoreTypeID: 2, … }]). Each becomes ["2", "5"]; nothing
 * becomes []. Values are text, as the box compares them as text.
 */
function toMultiValue(v, valueField) {
  if (v === undefined || v === null || v === "") return [];
  let list = v;
  if (typeof v === "string") {
    const t = v.trim();
    list = null;
    if (t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        // Not JSON after all — "[2, 5" — read as a plain list below.
      }
      if (!list) list = t.replace(/^\[|\]$/g, "").split(",");
    } else {
      list = t.split(",");
    }
  } else if (!Array.isArray(v)) {
    list = [v];
  }
  return list
    .map((x) => {
      if (x && typeof x === "object") {
        const own = valueField ? getPath(x, valueField) : undefined;
        return own ?? x.value ?? x.id ?? x.Id ?? x.ID;
      }
      return x;
    })
    .filter((x) => x !== undefined && x !== null)
    .map((x) => String(x).trim().replace(/^["']|["']$/g, ""))
    .filter((x) => x !== "");
}

/**
 * A binding written as plain JavaScript, for what the template filters cannot
 * say: `row.StoreTypeIDs.split(",")`, `row.Items.filter(x => x.Active).map(x => x.ID)`,
 * `row.FirstName + " " + row.LastName`.
 *
 * An expression is returned as is; a body with its own `return` runs as
 * written, so several lines work too. It reads `row` (the clicked record),
 * `values`, `vars`, `user`, `params`, `globals` and the whole `scope`.
 *
 * Opt-in per binding (the JS tag), designer-authored and stored with the
 * screen — the same trust as the Run custom JS action. A mistake in it is
 * reported in the console and fills the field with nothing; it never stops
 * the rest of the form from filling.
 */
function jsValue(code, scope, field, onError) {
  const src = String(code || "").trim();
  if (!src) return "";
  try {
    const body = /(^|[\s;{}])return\b/.test(src) ? src : `return (${src});`;
    // eslint-disable-next-line no-new-func
    const fn = new Function("row", "values", "vars", "user", "params", "globals", "scope", body);
    return fn(
      scope.row || {},
      scope.values || {},
      scope.vars || {},
      scope.user || {},
      scope.params || {},
      scope.globals || {},
      scope,
    );
  } catch (e) {
    if (onError) onError(e);
    else console.warn(`[ScreenBuilder] Fill form: the JS for "${field}" failed —`, src, e);
    return "";
  }
}

/**
 * One binding of a Fill form, worked out against a sample row — the builder's
 * "test" button. Runs the very path a click on Edit runs (fillFromRow), so what
 * it shows is what the field would get, multi-select list and all.
 *
 * @param node  the form control the binding fills, when known — it decides
 *              whether the value becomes a list (multi select) or a date.
 * @returns { value, error }  error is the JS error's message, or "".
 */
export function testBinding(binding, row, scope = {}, node = null) {
  const field = String(binding?.field || "").trim() || "__test";
  const target = node && valueKeysOf(node).includes(field) ? node : { id: field, type: "TextInput", props: { field } };
  let error = "";
  const out = fillFromRow([target], row || {}, [{ ...binding, field }], scope, {
    onlyMapped: true,
    onJsError: (e) => {
      error = e?.message || String(e);
    },
  });
  return { value: out[field], error };
}

/** "Is_Active", "is active", "IsActive" -> "isactive": how a column and a field are matched. */
const looseKey = (k) => String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The values a "Fill form from row" writes: one per control, read off the record.
 *
 * `map` pairs a field with the record key (or `{{row.…}}` template) it takes;
 * any field it does not name finds its column by name — exactly first, then
 * ignoring case, spaces and underscores, so `ComponentName` fills from
 * `componentName` or `Component_Name`. A field the record has nothing for is
 * cleared rather than left holding the last record's answer.
 *
 * A date control stores `YYYY-MM-DD`, so a server datetime is cut to its date.
 * A multi select stores a list, so whatever the row has is made one (toMultiValue).
 *
 * `opts` narrows what is written; a field left out keeps whatever it holds:
 *   skip        fields never filled from the row — set by a later action, or
 *               typed by the user;
 *   onlyMapped  only the fields `map` names are filled, none by name.
 * Neither given, every control is filled exactly as before.
 */
export function fillFromRow(nodes, row, map, scope = {}, opts = {}) {
  const exact = row || {};
  const loose = {};
  Object.keys(exact).forEach((k) => {
    const lk = looseKey(k);
    if (!(lk in loose)) loose[lk] = exact[k];
  });
  // `fixed`: the binding's text is the value itself, not a column to read —
  // set by the builder when what was typed names no column of the row.
  // `js`: the binding's text is a JavaScript expression (see jsValue).
  const pairs = {};
  const fixed = {};
  const js = {};
  (Array.isArray(map) ? map : []).forEach((m) => {
    if (m && m.field && m.from) {
      pairs[m.field] = m.from;
      if (m.js) js[m.field] = true;
      else if (m.fixed) fixed[m.field] = true;
    }
  });
  const skip = new Set((Array.isArray(opts.skip) ? opts.skip : []).map((f) => String(f || "").trim()).filter(Boolean));
  const onlyMapped = !!opts.onlyMapped;
  const rowScope = { ...scope, row: exact };
  const out = {};
  (nodes || []).forEach((n) => {
    const isDate = /Date/.test(n?.type || "");
    const isMulti = !!n?.props?.isMulti;
    valueKeysOf(n).forEach((field) => {
      if (skip.has(field)) return;
      let v;
      const from = pairs[field];
      if (!from && onlyMapped) return;
      // A list typed in braces, {{[2, 5]}}, is the list itself — there is no
      // path called "[2, 5]" to look up.
      const listLiteral = isMulti && from && !js[field] ? String(from).match(/^\s*\{\{\s*(\[[^}]*\])\s*\}\}\s*$/) : null;
      if (from && js[field]) v = jsValue(from, rowScope, field, opts.onJsError);
      else if (listLiteral) v = listLiteral[1];
      else if (from) {
        if (String(from).includes("{{")) v = interpolate(from, rowScope);
        else if (fixed[field]) v = from;
        // A column picked as "name" for a row that sends "Name" is still it.
        else v = getPath(exact, from) ?? loose[looseKey(from)];
      }
      else if (Object.prototype.hasOwnProperty.call(exact, field)) v = exact[field];
      else v = loose[looseKey(field)];
      if (v === undefined || v === null) v = "";
      if (isDate && typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) v = v.slice(0, 10);
      // Multi select: a list, or the box ticks nothing.
      if (isMulti) v = toMultiValue(v, n.props.optionValueField);
      out[field] = v;
    });
  });
  return out;
}
