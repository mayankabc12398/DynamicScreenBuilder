/**
 * Shared building blocks used by registry components: the field shell (label +
 * control + validation message), the value hook, and small prop-schema helpers
 * so every definition stays short and consistent.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AURORA_HEADING_COLORS } from "@app/components/UI/AuroraHeading";
import { buildApiRequest, isApiConfigReady, nodeSourceId } from "../utils/apiConfig";
import { evalCondition, interpolate } from "../utils/expressions";
import { fieldCaption } from "../utils/fieldCaption";
import Icon from "./icons";

export const GROUPS = {
  CONTENT: "Content",
  DATA: "Data",
  APPEARANCE: "Appearance",
  BEHAVIOUR: "Behaviour",
  LAYOUT: "Layout",
};

/* ---------------------------------------------------------------- prop defs */
export const p = {
  text: (key, label, group = GROUPS.CONTENT, extra = {}) => ({ key, label, type: "text", group, ...extra }),
  textarea: (key, label, group = GROUPS.CONTENT, extra = {}) => ({ key, label, type: "textarea", group, ...extra }),
  number: (key, label, group = GROUPS.APPEARANCE, extra = {}) => ({ key, label, type: "number", group, ...extra }),
  bool: (key, label, group = GROUPS.BEHAVIOUR, extra = {}) => ({ key, label, type: "boolean", group, ...extra }),
  select: (key, label, options, group = GROUPS.APPEARANCE, extra = {}) => ({
    key,
    label,
    type: "select",
    options,
    group,
    ...extra,
  }),
  color: (key, label, group = GROUPS.APPEARANCE, extra = {}) => ({ key, label, type: "color", group, ...extra }),
  icon: (key, label, group = GROUPS.APPEARANCE, extra = {}) => ({ key, label, type: "icon", group, ...extra }),
  options: (key, label, group = GROUPS.CONTENT, extra = {}) => ({ key, label, type: "options", group, ...extra }),
  columns: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "columns", group, ...extra }),
  actions: (key, label, group = GROUPS.CONTENT, extra = {}) => ({ key, label, type: "actions", group, ...extra }),
  fields: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "fields", group, ...extra }),
  code: (key, label, group = GROUPS.BEHAVIOUR, extra = {}) => ({ key, label, type: "code", group, ...extra }),
  /**
   * Text that may read the record the component stands on — a field picker
   * next to the box writes `{{row.Field}}` so nobody has to know the column's
   * exact spelling. Otherwise identical to `text`.
   */
  template: (key, label, group = GROUPS.CONTENT, extra = {}) => ({ key, label, type: "template", group, ...extra }),
  /** Label/value pairs mapped out of that record. */
  recordFields: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "recordFields", group, ...extra }),
  /** A key of the component's own data — offered as a list once it has some. */
  dataKey: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "dataKey", group, ...extra }),
  /** Several keys of the component's own data, as a list: ["BedNo", "RoomName"]. */
  dataKeys: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "dataKeys", group, ...extra }),
  /** The field name of another control on the screen. */
  formField: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "formField", group, ...extra }),
  /** Row filters narrowing an option list to part of what an endpoint returns. */
  optionFilters: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "optionFilters", group, ...extra }),
  /**
   * Wording shown in place of a stored value: [{ value: "IN", label: "Patient
   * admitted" }]. Only the text changes — see `labelForValue`.
   */
  valueLabels: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "valueLabels", group, ...extra }),
  /**
   * Tests that decide whether a record is worth shouting about:
   * [{ field: "BP", op: "outside", from: "90/60", to: "140/90" }].
   */
  alertRules: (key, label, group = GROUPS.DATA, extra = {}) => ({ key, label, type: "alertRules", group, ...extra }),
  /** Conditional colours, without the target picker a component-wide rule needs. */
  colorRules: (key, label, group = GROUPS.APPEARANCE, extra = {}) => ({ key, label, type: "colorRules", group, ...extra }),
  /**
   * A colour that may come out of the record the component stands on: the box
   * takes a swatch, a theme token, or `{{row.Field}}`, and a second swatch
   * holds the colour to use when that field is empty or is not a colour.
   * The fallback lives in its own prop, `<key>Default` unless `fallbackKey`
   * says otherwise.
   */
  dynamicColor: (key, label, group = GROUPS.APPEARANCE, extra = {}) => ({
    key,
    label,
    type: "dynamicColor",
    group,
    fallbackKey: `${key}Default`,
    ...extra,
  }),
  slider: (key, label, min, max, step, group = GROUPS.APPEARANCE) => ({
    key,
    label,
    type: "slider",
    min,
    max,
    step,
    group,
  }),
};

/**
 * Pick the colour a `p.dynamicColor` pair resolves to.
 *
 * `dynamic` arrives already interpolated, so a `{{row.Status}}` that the record
 * does not answer comes back empty — and a field that answers with something
 * that is not a colour ("Urgent") must not be handed to CSS as one. Either way
 * the fallback swatch takes over; `undefined` means "leave it to the stylesheet".
 */
export function resolveDynamicColor(dynamic, fallback) {
  const pick = (v) => {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s || s.includes("{{")) return "";
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function") return CSS.supports("color", s) ? s : "";
    return /^(#|rgb|hsl|var\(|color-mix\()/i.test(s) ? s : "";
  };
  return pick(dynamic) || pick(fallback) || undefined;
}

/**
 * What a value SHOWS when the value itself is not what a reader wants.
 *
 * Status fields carry "IN", "RFI", "STI" — codes the endpoint stores, the
 * colour rules key off and the filters compare against, but not words anyone
 * says out loud. A mapping changes the text and nothing else: the record keeps
 * its own value, so everything downstream still sees "IN".
 *
 * Case and surrounding space are ignored, because the same code arrives as
 * " in " from one endpoint and "IN" from another.
 */
export function labelForValue(list, raw) {
  const map = Array.isArray(list) ? list : [];
  if (!map.length || raw === null || raw === undefined) return raw;
  const key = String(raw).trim().toLowerCase();
  const hit = map.find((m) => m && `${m.value ?? ""}`.trim().toLowerCase() === key);
  return hit && `${hit.label ?? ""}` !== "" ? hit.label : raw;
}


/* ------------------------------------------------------- reading tests --
 *
 * A clinical reading is not a tidy number and the tests over it are not tidy
 * comparisons, so both live here rather than inside one component: the Vitals
 * Card tests one reading, the Critical Alert tests a whole list of records
 * against several readings at once, and they must agree about what "out of
 * range" means down to the separator.
 */

export const VITAL_OPS = [
  { value: "outside", label: "is outside the range" },
  { value: "between", label: "is inside the range" },
  { value: "gt", label: "is greater than" },
  { value: "gte", label: "is greater or equal" },
  { value: "lt", label: "is less than" },
  { value: "lte", label: "is less or equal" },
  { value: "eq", label: "equals" },
  { value: "ne", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "empty", label: "is empty" },
  { value: "notEmpty", label: "is not empty" },
];

/** The two tests that take a band rather than a single threshold. */
export const VITAL_RANGE_OPS = new Set(["between", "outside"]);

/**
 * Every number in a reading, however it was written.
 *
 * A vital does not arrive as a tidy number. Blood pressure comes back as
 * "155/80", "155-80", "155 to 80" or "155 / 80 mmHg" depending on which
 * endpoint and which data-entry screen produced it, and a range that only
 * understood one of those would quietly never fire on the others. Digits are
 * pulled out and the separators — whatever they were — are thrown away.
 *
 * Unsigned on purpose: in "155-80" the dash is a separator, not a minus, and no
 * vital this is used for is negative.
 */
export function vitalNumbers(value) {
  if (value === "" || value === null || value === undefined) return [];
  if (typeof value === "number") return Number.isFinite(value) ? [value] : [];
  return (String(value).match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(Number.isFinite);
}

/**
 * Is a reading inside a low–high band?
 *
 * Returns `null` when the question cannot be answered — no reading, or a range
 * that is still half typed — so a half-configured alert stays quiet instead of
 * deciding that a patient is critical.
 *
 * Two shapes of band, because blood pressure needs both:
 *
 *   - PAIRED — "90/60" to "140/90" against "155/80" is two questions, not one:
 *     systolic against 90–140, diastolic against 60–90. Used whenever the two
 *     bounds and the reading all carry the same number of parts, which is the
 *     only time pairing them up means anything.
 *   - FLAT — one band every part of the reading has to sit inside. "155/80"
 *     against 70–120 is out because the systolic is, and a diastolic sitting
 *     comfortably inside must not hide that.
 *
 * The bounds may be written the same way as the reading, so "70-120" typed into
 * the first box alone is a complete range; two boxes work as well.
 */
export function vitalInRange(value, from, to) {
  const parts = vitalNumbers(value);
  if (!parts.length) return null;
  const lo = vitalNumbers(from);
  const hi = vitalNumbers(to);
  if (lo.length > 1 && lo.length === hi.length && parts.length === lo.length) {
    return parts.every((n, i) => n >= Math.min(lo[i], hi[i]) && n <= Math.max(lo[i], hi[i]));
  }
  const bounds = [...lo, ...hi];
  if (bounds.length < 2) return null;
  const low = Math.min(bounds[0], bounds[1]);
  const high = Math.max(bounds[0], bounds[1]);
  return parts.every((n) => n >= low && n <= high);
}

/**
 * Does a reading trip a test?
 *
 * `test` is `{ op, at, to }` — the operator, the threshold or low end, and the
 * high end when the operator takes a band.
 *
 * Silence is the default everywhere it is not certain: "is empty" is the one
 * test that is ABOUT a missing value, so it is the one test that runs without
 * one. Every other test needs both sides and stays quiet until it has them — a
 * half-typed threshold must never paint a card red or call a patient critical.
 */
export function readingTrips(test, value) {
  const op = test?.op || "gt";
  if (VITAL_RANGE_OPS.has(op)) {
    const inside = vitalInRange(value, test?.at, test?.to);
    return inside === null ? false : op === "between" ? inside : !inside;
  }
  const aboutEmpty = op === "empty" || op === "notEmpty";
  if (!aboutEmpty && (`${test?.at ?? ""}` === "" || `${value ?? ""}` === "")) return false;
  return evalCondition({ field: "v", op, value: test?.at }, { v: value });
}

/* ------------------------------------------------------------ truncation */

/** What "Truncate value" offers: off, or a number of lines to keep. */
export const CLAMP_OPTIONS = [
  { value: "", label: "Off (show everything)" },
  { value: "1", label: "1 line" },
  { value: "2", label: "2 lines" },
  { value: "3", label: "3 lines" },
  { value: "4", label: "4 lines" },
];

/** The three props a truncatable value needs, ready to spread into a schema. */
export const clampProps = (prefix = "value", label = "value") => [
  p.select(`${prefix}Clamp`, "Truncate", CLAMP_OPTIONS, GROUPS.APPEARANCE, {
    hint: `A long ${label} is cut with an ellipsis instead of stretching the layout.`,
  }),
  p.number(`${prefix}MaxChars`, "Max characters", GROUPS.APPEARANCE, {
    hint: "Optional hard limit — 0 or empty leaves it to the line count.",
  }),
  p.bool(`${prefix}Tip`, "Full text on hover", GROUPS.APPEARANCE, {
    hint: "Shows the whole thing in a tooltip, but only when it is actually cut short.",
  }),
];

/**
 * A tooltip bubble positioned against the VIEWPORT and portalled to the body.
 *
 * Anything else is clipped: the cells and panels these bubbles rise out of
 * scroll, and half of them sit near an edge. Returns the handlers the anchor
 * binds and the bubble to render — the caller decides what the anchor is.
 */
export function useFloatTip() {
  const ref = useRef(null);
  const [box, setBox] = useState(null);

  const show = useCallback(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    // Above by default, below when there is no room — a tooltip that opens off
    // the top of the viewport is not a tooltip.
    const below = r.top < 64;
    setBox({
      x: Math.min(Math.max(r.left + r.width / 2, 80), window.innerWidth - 80),
      y: below ? r.bottom + 8 : r.top - 8,
      below,
    });
  }, []);

  const hide = useCallback(() => setBox(null), []);

  useEffect(() => {
    if (!box) return undefined;
    // Scrolling moves the anchor out from under its own bubble.
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [box, hide]);

  return { ref, box, show, hide };
}

/**
 * Text that is allowed to run out of room.
 *
 * `lines` clamps it to that many lines with an ellipsis; `maxChars` cuts the
 * string itself first, for the cases where the limit is the content's rather
 * than the box's. The tooltip is offered ONLY when something was actually cut —
 * a bubble repeating a value already fully on screen is noise, and whether a
 * clamp bit can only be answered by measuring the element, so it is measured on
 * hover rather than guessed at render.
 */
export function TruncatedText({ text, lines = 0, maxChars = 0, tip = true, className = "", style, title }) {
  const full = text == null ? "" : String(text);
  const limit = Number(maxChars) || 0;
  const cut = limit > 0 && full.length > limit;
  const shown = cut ? `${full.slice(0, limit).trimEnd()}…` : full;
  const n = Number(lines) || 0;

  const { ref, box, show, hide } = useFloatTip();
  const [clipped, setClipped] = useState(false);

  // 1px of slack: sub-pixel line heights report a scrollHeight a hair over the
  // client height on text that fits perfectly well.
  const measure = useCallback(() => {
    const el = ref.current;
    return !!el && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
  }, [ref]);

  // Measured once the text is on screen, so a value that fits is not made a tab
  // stop for a tooltip it will never show. Re-measured on hover anyway: the box
  // may have been hidden (a closed drawer) or resized since.
  useEffect(() => {
    if (!n) return undefined;
    setClipped(measure());
    return undefined;
  }, [n, shown, measure]);

  const onEnter = useCallback(() => {
    const over = measure();
    setClipped(over);
    if (over || cut) show();
  }, [measure, cut, show]);

  // Focus opens the bubble for someone tabbing through the screen, but NOT for
  // focus a script moved (an overlay handing the keyboard to its contents) —
  // that is how a tooltip ended up hanging open the moment a drawer appeared.
  const onFocus = useCallback(() => {
    const el = ref.current;
    try {
      if (!el?.matches(":focus-visible")) return;
    } catch {
      return;
    }
    onEnter();
  }, [ref, onEnter]);

  if (!tip) {
    return (
      <span ref={ref} className={`${n ? "dsb-clamp" : ""} ${className}`.trim()} style={n ? { ...style, "--dsb-clamp": n } : style} title={title}>
        {shown}
      </span>
    );
  }

  return (
    <>
      <span
        ref={ref}
        className={`${n ? "dsb-clamp" : ""} ${className}`.trim()}
        style={n ? { ...style, "--dsb-clamp": n } : style}
        tabIndex={clipped || cut ? 0 : -1}
        onMouseEnter={onEnter}
        onFocus={onFocus}
        onMouseLeave={hide}
        onBlur={hide}
      >
        {shown}
      </span>
      {box && (clipped || cut) && full
        ? createPortal(
            <span className={`dsb-floattip is-text ${box.below ? "is-below" : ""}`.trim()} style={{ left: box.x, top: box.y }} role="tooltip">
              {full}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

export const SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

/**
 * Press one icon out of an `actions` list (a panel's header icons, an action
 * grid's tiles) — what the inspector's ActionsEditor said it would open.
 *
 * Each icon carries its OWN chain, app modal or route. Handing every icon to
 * the component's shared event instead ran the component's chain, which is
 * usually empty, so a header icon given "Reset form" did nothing at all. The
 * shared event is still the fallback for an icon with nothing of its own.
 *
 * Everything goes through `runActions`, so the canvas stays inert and the
 * record the component stands on reaches the chain as {{row.*}}.
 */
export function runIconAction(a, { rt, node, fallbackEvent = "onClick" }) {
  if (!a) return;
  const ctx = { action: a, node };
  if (a.kind === "appModal") {
    if (!a.appModal) return;
    rt?.runActions?.([{ type: "openAppModal", appModal: a.appModal, title: a.title, size: a.size }], ctx);
    return;
  }
  if (a.kind === "navigate") {
    if (a.route) rt?.runActions?.([{ type: "navigate", route: a.route }], ctx);
    return;
  }
  if (Array.isArray(a.onClick) && a.onClick.length) {
    rt?.runActions?.(a.onClick, ctx);
    return;
  }
  rt?.runEvent?.(node, a.event || fallbackEvent, { action: a });
}

/** The icons of an `actions` list whose show-when test passes (no operator = always). */
export const visibleIconActions = (items, scope) =>
  (Array.isArray(items) ? items : []).filter((a) => a && (!a.when || !a.when.op || evalCondition(a.when, { ...(scope || {}), ...(scope?.row || {}) })));

/* ------------------------------------------------------------------ overlays */

// One counter for every overlay on the page: two drawers closing one after the
// other must not hand the page back its scrollbar while the second is still up.
let scrollLocks = 0;
let scrollPrev = "";

/** Freeze the page behind an overlay while `active`, and thaw it exactly once. */
export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return undefined;
    if (scrollLocks === 0) {
      scrollPrev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    scrollLocks += 1;
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = scrollPrev;
    };
  }, [active]);
}

// Per class, for the same reason the scroll lock counts: the last overlay to
// close is the one that gets to take the flag off the page.
const bodyFlags = new Map();

/**
 * Mark the page while an overlay is up, so a stylesheet can answer it.
 *
 * Used for stacking: the app's dialogs get their z-index from PrimeReact, which
 * knows nothing about an overlay the builder drew, so a modal opened from
 * inside a drawer would otherwise be rendered UNDER it. A class on <body> lets
 * one CSS rule lift the dialog layer for exactly as long as a drawer is open.
 */
export function useBodyFlag(active, className) {
  useEffect(() => {
    if (!active || !className || typeof document === "undefined") return undefined;
    const n = (bodyFlags.get(className) || 0) + 1;
    bodyFlags.set(className, n);
    document.body.classList.add(className);
    return () => {
      const left = (bodyFlags.get(className) || 1) - 1;
      bodyFlags.set(className, left);
      if (left <= 0) document.body.classList.remove(className);
    };
  }, [active, className]);
}

/** Close on Escape while `active` — the key every overlay is expected to answer. */
export function useEscapeKey(active, onEscape) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onEscape?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}

/* ------------------------------------------------------------- value plumbing */

/**
 * Bind a control to runtime state. `props.field` is the key the value is stored
 * under (falls back to the node id so an unnamed control still works).
 */
/**
 * Register a button as the one Enter runs, for as long as it is rendered.
 *
 * The node id is handed to the runtime; the renderer's root listens for Enter
 * and fires that button's chain. Cleared on unmount, so a button inside a
 * closed modal does not stay the screen's default.
 */
export function useDefaultSubmit(node, props, rt) {
  const on = !!props.submitOnEnter && !props.disabled;
  const setDefaultSubmit = rt?.setDefaultSubmit;
  useEffect(() => {
    if (!on || !setDefaultSubmit || rt?.design) return undefined;
    setDefaultSubmit(node.id);
    return () => setDefaultSubmit(null, node.id);
  }, [on, setDefaultSubmit, node.id, rt?.design]);
}

export function useFieldValue(node, props, rt) {
  const field = props.field || node.id;
  const raw = rt?.values?.[field];
  const value = raw === undefined ? (props.defaultValue ?? "") : raw;
  const error = rt?.errors?.[field] || "";

  const onChange = useCallback(
    (next) => {
      if (!rt || rt.design) return;
      rt.setValue(field, next);
      rt.runEvent(node, "onChange", { value: next, field });
    },
    [rt, field, node],
  );

  const onBlur = useCallback(() => {
    if (!rt || rt.design) return;
    rt.runEvent(node, "onBlur", { field, value });
  }, [rt, field, node, value]);

  // Entering a field is a trigger like leaving one: "load this patient's last
  // reading when the box is focused" needs somewhere to hang.
  const onFocus = useCallback(() => {
    if (!rt || rt.design) return;
    rt.runEvent(node, "onFocus", { field, value });
  }, [rt, field, node, value]);

  return { field, value, error, onChange, onBlur, onFocus };
}

/**
 * Put a starting value into the form the first time a field is rendered.
 *
 * A default has to live in `rt.values`, not just on screen: a save reads the
 * form's values, so a date the user never touched would otherwise be posted
 * empty. Seeded once and only over a genuinely empty field — clearing the
 * control at runtime sticks, and a value restored from a data binding or a
 * previous answer is never overwritten.
 *
 * Does nothing on the canvas; the design surface never writes form state.
 */
export function useSeedValue(node, props, rt, value) {
  const field = props.field || node.id;
  const done = useRef(false);
  useEffect(() => {
    if (!rt || rt.design || done.current || value === "" || value === undefined || value === null) return;
    const current = rt.values?.[field];
    // Already answered (or bound): leave it, but stop looking.
    if (current !== undefined && current !== "" && current !== null) {
      done.current = true;
      return;
    }
    done.current = true;
    rt.setValue(field, value);
  }, [rt, field, value]);
}

/* ------------------------------------------------- a select's own default */

/** Nothing chosen: "" for a single select, an empty list for a multi. */
export const isEmptySelection = (v) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

/**
 * A typed default -> the shape the control stores.
 *
 * A multi select stores an array, so a comma list is what a designer types and
 * an array is what comes out. A single select stores one value. Both go
 * through `interpolate` first, which is what makes {{user.centreId}} a usable
 * default for a centre dropdown.
 */
export function toSelection(raw, isMulti, scope = {}) {
  const text = typeof raw === "string" ? interpolate(raw, scope) : raw;
  if (!isMulti) {
    if (Array.isArray(text)) return text.length ? String(text[0]) : "";
    return text === undefined || text === null ? "" : String(text);
  }
  const list = Array.isArray(text) ? text : String(text ?? "").split(",");
  return list.map((x) => String(x).trim()).filter((x) => x !== "");
}

/**
 * Put a select's default into the form.
 *
 * Two behaviours, because they are genuinely different things:
 *
 *   "value"  a value the designer set. Seeded once, over an empty field — the
 *            same contract every other default follows.
 *   "first"  whatever the list happens to start with. Re-seeded whenever the
 *            list changes, because a dependent select is emptied when its
 *            parent changes and the first option of the NEW list is the one
 *            that was asked for.
 *
 * Returns the value to PREVIEW on the canvas, where no form state is written.
 */
export function useSelectDefault(node, props, rt, options = []) {
  const field = props.field || node.id;
  const isMulti = !!props.isMulti;
  const mode = props.defaultMode || "";
  const raw = props.defaultValue;
  const seeded = useRef(false);

  useEffect(() => {
    if (!rt || rt.design || mode !== "value" || seeded.current) return;
    if (!isEmptySelection(rt.values?.[field])) {
      seeded.current = true; // already answered, or restored: leave it alone
      return;
    }
    const next = toSelection(raw, isMulti, rt.buildScope ? rt.buildScope() : {});
    // An unresolved template ({{user.centreId}} before the user is known) is
    // not a default; try again on the next render rather than writing "".
    if (isEmptySelection(next)) return;
    seeded.current = true;
    rt.setValue(field, next);
  }, [rt, field, mode, raw, isMulti]);

  useEffect(() => {
    if (!rt || rt.design || mode !== "first" || !options.length) return;
    if (!isEmptySelection(rt.values?.[field])) return;
    const first = options[0]?.value;
    if (first === undefined) return;
    rt.setValue(field, isMulti ? [first] : first);
  }, [rt, field, mode, isMulti, options]);

  return useMemo(() => {
    if (mode === "value") return toSelection(raw, isMulti, {});
    if (mode === "first" && options.length) {
      const first = options[0]?.value;
      return isMulti ? (first === undefined ? [] : [first]) : first ?? "";
    }
    return isMulti ? [] : "";
  }, [mode, raw, isMulti, options]);
}

/* -------------------------------------------------------------- field shell */

export function FieldShell({ node, props, error, required, children, className = "" }) {
  const floating = !!props.floatingLabel;
  const hasLabel = props.label !== undefined && props.label !== "";
  return (
    <div
      className={`dsb-field ${floating ? "is-float" : ""} ${error ? "is-error" : ""} ${className}`}
      data-field={props.field || node.id}
    >
      {hasLabel && (
        <label className="dsb-label" htmlFor={`${node.id}-ctl`}>
          {props.label}
          {required ? <span className="dsb-req">*</span> : null}
          {props.tooltip ? (
            <span className="dsb-tip" data-tip={props.tooltip}>
              <Icon name="Info" size={12} />
            </span>
          ) : null}
        </label>
      )}
      <div className="dsb-control">{children}</div>
      {props.help && !error ? <div className="dsb-help">{props.help}</div> : null}
      {error ? <div className="dsb-err">{error}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

/**
 * The scope a row filter is judged against: whatever the runtime knows, so a
 * filter can read what the user has typed ({{values.centre}}). At design time
 * there is no runtime state, only the values the canvas holds.
 */
export function optionScope(rt) {
  if (rt?.buildScope) return rt.buildScope();
  return { values: rt?.values || {}, user: {}, vars: {}, rows: {}, data: {} };
}

/**
 * Keep only the rows an option list should offer.
 *
 * One endpoint often answers for several dropdowns: a lookup table returns every
 * type at once, and the Triage Code select wants the rows whose TypeName is
 * "Triage Code". Rather than needing another endpoint per dropdown, the rows are
 * narrowed here. A filter's field is read from the row itself, and its value may
 * be a template, so it can also follow another control — keeping the wards of
 * the chosen centre, say, without a second call.
 *
 * Every filter has to match; an empty list keeps everything.
 */
export function filterOptionRows(rows, filters, scope) {
  const list = (filters || []).filter((f) => f && f.field && f.op);
  if (!list.length) return rows || [];
  // A filter may itself be conditional: "drop the OPD Card choice, but only
  // for a row that does not allow one". Without this every rule applies to
  // every row, and a rule that should have been about one record has to be
  // rewritten as an operator on the whole list.
  const live = list.filter((f) => !f.when || !f.when.op || evalCondition(f.when, scope));
  if (!live.length) return rows || [];
  return (rows || []).filter((r) => {
    if (!r || typeof r !== "object") return false;
    // The row's own fields win over the scope's: `TypeName` in a filter means
    // the row's TypeName, while {{values.x}} in its value still resolves.
    const s = { ...scope, ...r, row: r };
    return live.every((f) => evalCondition(f, s));
  });
}

/** Normalise the `options` prop (accepts a list, or a comma string). */
export function useOptions(props, rt) {
  return useMemo(() => {
    if (props.optionsSource === "api" && props.optionsSourceId) {
      const all = rt?.data?.[props.optionsSourceId]?.rows || [];
      const rows = filterOptionRows(all, props.optionFilters, optionScope(rt));
      // The row travels with the option so a rule — or a colour column — can
      // read the fields the label and value left behind.
      return rows.map((r) => ({
        value: r[props.optionValueField || "value"],
        label: r[props.optionLabelField || "label"],
        row: r,
      }));
    }
    const raw = props.options;
    if (Array.isArray(raw)) {
      return raw.map((o) => (typeof o === "object" ? o : { value: o, label: String(o) }));
    }
    if (typeof raw === "string" && raw.trim()) {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ value: s, label: s }));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.options,
    props.optionsSource,
    props.optionsSourceId,
    props.optionLabelField,
    props.optionValueField,
    props.optionFilters,
    rt?.data,
    rt?.values,
  ]);
}

/**
 * The text a selection reads as — the option's label, or a list of them when
 * several may be picked. A value no option carries (the list has not loaded
 * yet, or was filtered) reads as nothing rather than as the id.
 */
export function labelOfSelection(value, options, isMulti = false) {
  const labelOf = (v) => {
    const hit = (options || []).find((o) => o && String(o.value) === String(v));
    return hit ? String(hit.label ?? "") : "";
  };
  if (isMulti || Array.isArray(value)) {
    return (Array.isArray(value) ? value : []).map(labelOf).filter((l) => l !== "");
  }
  return isEmptySelection(value) ? "" : labelOf(value);
}

/**
 * The record behind a selection: the API row the chosen option was built from,
 * or `{ value, label }` for an option that has no row (a typed list, an "All"
 * put in front). A list of them when several may be picked; null when nothing
 * is chosen or the choice is not among the options.
 */
export function recordOfSelection(value, options, isMulti = false) {
  const recordOf = (v) => {
    const hit = (options || []).find((o) => o && String(o.value) === String(v));
    if (!hit) return null;
    return hit.row && typeof hit.row === "object" ? hit.row : { value: hit.value, label: hit.label };
  };
  if (isMulti || Array.isArray(value)) {
    return (Array.isArray(value) ? value : []).map(recordOf).filter(Boolean);
  }
  return isEmptySelection(value) ? null : recordOf(value);
}

const recordKey = (record) => {
  try {
    return JSON.stringify(record);
  } catch (e) {
    return String(Date.now());
  }
};

/**
 * Keep {{labels.<field>}} and {{selected.<field>.<Column>}} in step with what
 * an option control shows.
 *
 * Two paths, because either alone is wrong. The effect covers every way a
 * value arrives without a click — a default, a Set value action, a dependent
 * reset, options that load after the value. The returned change handler
 * covers the click itself: it writes the label BEFORE the value, so an
 * onChange chain posting {{labels.X}} in the same tick sends the new text,
 * not the one before it.
 *
 * @returns the function to call instead of `f.onChange`
 */
export function useOptionLabel(f, props, rt, options) {
  const isMulti = !!props.isMulti;
  const design = !!rt?.design;
  const setLabel = rt?.setLabel;
  const setSelected = rt?.setSelected;
  const label = labelOfSelection(f.value, options, isMulti);
  const key = Array.isArray(label) ? label.join("|") : String(label);
  const record = recordOfSelection(f.value, options, isMulti);
  // By content: a reload hands back equal rows as new objects.
  const recKey = recordKey(record);
  useEffect(() => {
    if (design || !setLabel) return;
    setLabel(f.field, label);
    // `label` is a fresh array for a multi select; `key` is its content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, f.field, design, setLabel]);
  useEffect(() => {
    if (design || !setSelected) return;
    setSelected(f.field, record);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recKey, f.field, design, setSelected]);
  return useCallback(
    (next) => {
      if (!design) {
        setLabel?.(f.field, labelOfSelection(next, options, isMulti));
        setSelected?.(f.field, recordOfSelection(next, options, isMulti));
      }
      f.onChange(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design, setLabel, setSelected, f.field, f.onChange, options, isMulti],
  );
}

/**
 * Fixed choices put in FRONT of a bound list — "All" / "0" ahead of whatever
 * the endpoint returns, which is what the hand-coded pages do with
 * `[{ label: "All", value: "0" }, ...res.data]`.
 *
 * They come first, in the order the designer listed them, so the first one is
 * index 0 — and "Default selection: the first option" picks it. The value is
 * kept exactly as typed ("0", "", "All"): those pages send a string, and
 * turning it into a number would change what goes on the wire. A bound row
 * with the same value is dropped rather than listed twice, since two options
 * with one value cannot both be the selected one. A row left completely blank
 * in the inspector is ignored.
 *
 * @param label  turns a stored label into what is shown (the i18n lookup)
 */
export function prependExtraOptions(options, extras, label = (s) => s) {
  const list = (Array.isArray(extras) ? extras : [])
    .filter((e) => e && typeof e === "object")
    .filter((e) => String(e.label ?? "").trim() !== "" || String(e.value ?? "") !== "")
    .map((e) => {
      const value = e.value === undefined || e.value === null ? "" : e.value;
      const text = String(e.label ?? "").trim() !== "" ? String(e.label) : String(value);
      return { value, label: label(text), extra: true };
    });
  if (!list.length) return options || [];
  const taken = new Set(list.map((e) => String(e.value)));
  return [...list, ...(options || []).filter((o) => !taken.has(String(o?.value)))];
}

/* ------------------------------------------------------------ API options */

/** Keys an API commonly uses for the two halves of an option. */
const LABEL_GUESSES = ["label", "text", "name", "Name", "title", "description", "displayName"];
const VALUE_GUESSES = ["value", "id", "Id", "ID", "key", "code"];

/**
 * Which two fields of a row are the label and the value.
 *
 * Explicit mapping wins — that is the point of the two boxes in the inspector.
 * When they are blank the usual names are tried, and failing that the first two
 * fields are used, so a freshly picked endpoint shows something rather than a
 * list of "undefined".
 */
export function resolveOptionFields(rows, labelField, valueField) {
  const sample = (rows || []).find((r) => r && typeof r === "object") || {};
  const keys = Object.keys(sample).filter((k) => !k.startsWith("__"));
  const pick = (explicit, guesses, fallbackIndex) => {
    if (explicit) return explicit;
    const hit = guesses.find((g) => keys.includes(g));
    return hit || keys[fallbackIndex] || "";
  };
  return {
    label: pick(labelField, LABEL_GUESSES, 1),
    value: pick(valueField, VALUE_GUESSES, 0),
  };
}

/** Rows -> {value, label}, keeping the row itself for rules that read it. */
export function rowsToOptions(rows, labelField, valueField) {
  const f = resolveOptionFields(rows, labelField, valueField);
  return (rows || [])
    .filter((r) => r && typeof r === "object")
    .map((r) => ({ value: r[f.value], label: String(r[f.label] ?? r[f.value] ?? ""), row: r }));
}

/**
 * Options fetched from an endpoint the designer picked, including the
 * dependent case: a Sub-category list whose request carries
 * `{{values.category}}` reloads whenever Category changes, because the request
 * it would send is what this hook watches — not a hand-declared dependency.
 *
 * `dependsOn` names the control that has to be answered first. Until it is,
 * nothing is fetched and `waiting` is true, so the field can say "Select
 * Category first" instead of showing an empty list that looks broken.
 *
 * The canvas never calls: at design time the options come from whatever the
 * picker's Sync last returned.
 */
export function useApiOptions(node, props, rt) {
  const cfg = props.optionsApi;
  const design = !!rt?.design;
  const live = props.optionsSource === "endpoint" && isApiConfigReady(cfg);

  const parent = props.dependsOn || "";
  const parentValue = parent ? rt?.values?.[parent] : undefined;
  const waiting = !!parent && (parentValue === undefined || parentValue === null || parentValue === "");
  // Said to the user as "Select Refer Doctor first", so it is the parent
  // control's caption, not its key.
  const root = rt?.screen?.root;
  const parentLabel = useMemo(() => fieldCaption(root, parent), [root, parent]);

  /**
   * The request that would go on the wire, as a string. Using it as the effect
   * key means any change that alters the call — a parent value, a variable, a
   * parameter edit — refetches, and anything else does not.
   */
  const requestKey = useMemo(() => {
    if (!live || design || waiting) return "";
    try {
      const { url, config } = buildApiRequest(cfg, rt?.buildScope ? rt.buildScope() : {});
      return JSON.stringify([url, config.data || null]);
    } catch (e) {
      return "";
    }
  }, [live, design, waiting, cfg, rt]);

  const refreshNode = rt?.refreshNode;
  useEffect(() => {
    if (!requestKey || !refreshNode) return;
    refreshNode(node.id, cfg);
    // `cfg` is intentionally not a dependency: requestKey already covers every
    // part of it that changes the call, and the object identity changes on
    // every inspector keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, refreshNode, node.id]);

  const ds = rt?.data?.[nodeSourceId(node.id)];
  const rows = design ? props.previewOptions || [] : ds?.rows || [];

  // Filtered before the mapping, not after: a filter reads the row's own fields
  // (TypeName, IsActive), which the {value,label} pair no longer carries.
  const options = useMemo(
    () =>
      rowsToOptions(
        filterOptionRows(rows, props.optionFilters, optionScope(rt)),
        props.optionLabelField,
        props.optionValueField,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, props.optionFilters, props.optionLabelField, props.optionValueField, rt?.values],
  );

  return {
    options,
    loading: !design && !!ds?.loading,
    error: ds?.error || null,
    waiting,
    parent,
    parentLabel,
    // Rows came back but the filter kept none of them — a state worth saying out
    // loud, otherwise an over-tight filter reads as a broken endpoint.
    filteredOut: rows.length > 0 && options.length === 0,
  };
}

/**
 * Clear this field when the control it depends on changes.
 *
 * A Sub-category left holding a value from the previous Category is worse than
 * an empty one — it submits silently. The first run is skipped so opening a
 * saved record does not wipe the value it was loaded with.
 */
export function useDependentReset(props, rt, onClear) {
  const parent = props.dependsOn || "";
  const parentValue = parent ? rt?.values?.[parent] : undefined;
  const seen = useRef(parentValue);
  const fillSeq = rt?.fillSeq || 0;
  const seenFill = useRef(fillSeq);
  useEffect(() => {
    const filled = seenFill.current !== fillSeq;
    seenFill.current = fillSeq;
    if (!parent || rt?.design) return;
    if (seen.current === parentValue) return;
    seen.current = parentValue;
    // A "Fill form from row" set parent and child together: keep the child.
    if (filled) return;
    onClear();
    // `onClear` is a fresh closure each render; the parent value is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent, parentValue, fillSeq, rt?.design]);
}

/** Small inline empty state used across data components. */
/**
 * Nothing to show — said with a large clinical glyph, a line of text and, when
 * there is something useful to do about it, one button that does it.
 */
export function EmptyState({ icon = "ClipboardPlus", title = "No data", hint = "", action = null, tone = "" }) {
  return (
    <div className={`dsb-empty${tone ? ` is-${tone}` : ""}`} role="status">
      <div className="dsb-empty-ic">
        <Icon name={icon} size={30} />
      </div>
      <div className="dsb-empty-t">{title}</div>
      {hint ? <div className="dsb-empty-h">{hint}</div> : null}
      {action && typeof action.onClick === "function" ? (
        <button type="button" className="dsb-empty-cta" onClick={action.onClick}>
          {action.icon ? <Icon name={action.icon} size={14} /> : null}
          <span>{action.label}</span>
        </button>
      ) : null}
    </div>
  );
}

/** Shimmer rows shown while a data source is loading (no layout jump). */
export function Skeleton({ rows = 5, height = 34 }) {
  return (
    <div className="dsb-skel-wrap">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="dsb-skel" style={{ height }} />
      ))}
    </div>
  );
}

/* --------------------------------------------------- heading colour coding */

/**
 * The app colour-codes every page header by module family (see the COLOR CODING
 * block in UI/AuroraHeading.jsx): green = clinical, teal = wellness,
 * blue = diagnostics, purple = pharmacy, amber = billing, red = emergency.
 * Builder components that sit at the top of a screen read their colours from
 * that same table, so a screen built here is coded like the rest of the app
 * instead of carrying its own hard-coded blue.
 *
 * "theme" is the extra family the builder adds: it follows whichever app skin
 * is active (default / orange / peach / red …) by reading the computed colour
 * of `.text-theme-colornew` — the probe `utils/ustil2.js#getThemeClassColor`
 * uses. It is reimplemented here in six lines rather than imported, because
 * ustil2.js reads localStorage and pulls network services at module scope.
 */
export const HEADING_FAMILY_OPTIONS = [
  { value: "theme", label: "App theme (follows the skin)" },
  { value: "green", label: "Green — clinical" },
  { value: "teal", label: "Teal — wellness" },
  { value: "blue", label: "Blue — diagnostics" },
  { value: "purple", label: "Purple — pharmacy" },
  { value: "amber", label: "Amber — billing" },
  { value: "red", label: "Red — emergency" },
  { value: "custom", label: "Custom colours" },
];

const FALLBACK_ACCENT = "#1d6fd8";

function readThemeAccent() {
  if (typeof document === "undefined") return FALLBACK_ACCENT;
  try {
    const root = document.getElementById("root") || document.body;
    if (!root) return FALLBACK_ACCENT;
    const probe = document.createElement("span");
    probe.className = "text-theme-colornew";
    probe.style.display = "none";
    root.appendChild(probe);
    const c = window.getComputedStyle(probe).color;
    probe.remove();
    return c && c !== "rgba(0, 0, 0, 0)" ? c : FALLBACK_ACCENT;
  } catch (e) {
    return FALLBACK_ACCENT;
  }
}

/** "#rgb" | "#rrggbb" | "rgb()/rgba()" -> [r, g, b]; null when unparseable. */
export function toRgb(c) {
  if (!c || typeof c !== "string") return null;
  const v = c.trim();
  if (v[0] === "#") {
    const h = v.slice(1);
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    if (full.length < 6) return null;
    const n = parseInt(full.slice(0, 6), 16);
    return Number.isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = v.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Same colour at a different opacity — used for the soft fill and the hairline. */
export function withAlpha(c, a) {
  const rgb = toRgb(c);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})` : c;
}

/**
 * Resolve a family key to the four tokens a heading-styled surface needs:
 * `accent` (left edge / icon), `soft` (fill), `line` (hairline), `ink` (text).
 * `custom` derives the set from whatever colour the user picked; anything
 * unknown falls back to the app's own default family.
 */
export function headingPalette(family, customAccent) {
  if (family === "custom") {
    const accent = customAccent || FALLBACK_ACCENT;
    return { accent, soft: withAlpha(accent, 0.13), line: withAlpha(accent, 0.3), ink: accent };
  }
  if (family === "theme" || !family) {
    const accent = readThemeAccent();
    return { accent, soft: withAlpha(accent, 0.13), line: withAlpha(accent, 0.3), ink: accent };
  }
  return AURORA_HEADING_COLORS[family] || AURORA_HEADING_COLORS.green;
}

/* ------------------------------------------------------- app button classes */

/**
 * The project's button convention is a Bootstrap-style triple:
 *
 *     btn  btn-<size>  btn-<variant>   e.g. "btn btn-sm btn-success px-3"
 *
 * Every button the builder emits composes its class through `btnClass`, so a
 * screen built here is markup-identical to a hand-coded page (same skin, same
 * hover states, same dark-mode overrides) and follows the app's stylesheet
 * whenever that changes.
 */
export const BTN_SIZE_OPTIONS = [
  { value: "xxs", label: "XXS" },
  { value: "xs", label: "XS" },
  { value: "sm", label: "Small (app default)" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "", label: "None" },
];

export const BTN_VARIANT_OPTIONS = [
  { value: "success", label: "Success (green)" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "info", label: "Info" },
  { value: "danger", label: "Danger" },
  { value: "warning", label: "Warning" },
  { value: "light", label: "Light" },
  { value: "ghost", label: "Ghost" },
  { value: "soft", label: "Soft" },
  { value: "success-soft", label: "Success soft" },
  { value: "danger-soft", label: "Danger soft" },
  { value: "outline", label: "Outline" },
  { value: "outline-primary", label: "Outline primary" },
  { value: "outline-secondary", label: "Outline secondary" },
  { value: "outline-danger", label: "Outline danger" },
];

/** What a freshly dropped button looks like — the app's most common combo. */
export const APP_BTN = { variant: "success", size: "sm", extraClass: "px-3" };
/** The app's standard "secondary / cancel" button. */
export const APP_BTN_CANCEL = { variant: "outline-secondary", size: "sm", extraClass: "px-3" };

/**
 * Compose an app button class. `override` wins outright when set, which is the
 * escape hatch for one-off classes the variant list doesn't cover.
 */
export function btnClass({ variant, size, extraClass = "", block = false, override = "" } = {}) {
  if (override && override.trim()) return override.trim();
  return ["btn", size ? `btn-${size}` : "", variant ? `btn-${variant}` : "", block ? "btn-block" : "", extraClass]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * A button in the app's own markup. Icons are Font Awesome class strings
 * (`fa fa-search`), matching how the rest of the codebase writes them; a lucide
 * name is accepted too for icons FA doesn't have.
 */
export function AppButton({
  text = "",
  faIcon = "",
  lucideIcon = "",
  iconPosition = "left",
  className = "",
  style,
  disabled = false,
  title,
  onClick,
  children,
}) {
  const gap = text ? (iconPosition === "right" ? "ml-1" : "mr-1") : "";
  const ic = faIcon ? (
    <i className={`${faIcon} ${gap}`.trim()} aria-hidden="true" />
  ) : lucideIcon ? (
    <Icon name={lucideIcon} size={14} />
  ) : null;
  return (
    <button type="button" className={className} style={style} disabled={disabled} title={title} onClick={onClick}>
      {iconPosition === "right" ? null : ic}
      {children ?? (text || null)}
      {iconPosition === "right" ? ic : null}
    </button>
  );
}

export { Icon };
