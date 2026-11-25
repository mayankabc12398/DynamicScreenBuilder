/**
 * Form control registry entries — these render the PROJECT'S OWN components
 * (src/components/formComponent/*), not builder-specific copies.
 *
 * Why it matters: a screen built here looks and behaves exactly like a
 * hand-coded page. It picks up the legacy/modern skin from DesignContext, the
 * app theme, i18n, the floating-label markup, PrimeReact calendars — all of it,
 * for free, and it keeps doing so when those components change.
 *
 * Adapter rules:
 *   1. Every control is wrapped in <NativeShell>, which carries the `style`
 *      object from the inspector's Style tab. That is what keeps width, margin,
 *      background and the rest editable without touching the shared component.
 *   2. The registry stores plain values (string / array / ISO date string);
 *      each adapter converts to and from whatever the project component wants
 *      (a Date, an option object, an array of option objects).
 *   3. `respclass` is passed straight through, so the app's own grid classes
 *      ("col-md-3" …) work here too.
 *
 * Registry contract (identical for every component in the project):
 *   type          unique string, stored in the JSON as node.type
 *   label         palette label
 *   icon          lucide icon name (see registry/icons.jsx)
 *   category      palette grouping + colour coding
 *   defaultProps  props a freshly dropped node starts with
 *   defaultStyle  CSS object a freshly dropped node starts with
 *   propSchema    drives the inspector automatically — no bespoke UI per prop
 *   events        events surfaced in the event editor
 *   render        ({ node, props, style, rt, design, scope, children }) => JSX
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import moment from "moment";

// ---- the project's own controls -------------------------------------------
import Input from "@app/components/formComponent/Input";
import TextAreaInput from "@app/components/formComponent/TextAreaInput";
import ReactSelect from "@app/components/formComponent/ReactSelect";
import MultiSelectComp from "@app/components/formComponent/MultiSelectComp";
import { OptionItem, selectedFillStyle } from "@app/components/formComponent/optionColor";
import ProjectDatePicker from "@app/components/formComponent/DatePicker";
import ProjectTimePicker from "@app/components/formComponent/TimePicker";
import ProjectCheckbox from "@app/components/formComponent/Checkbox";
import LabeledInput from "@app/components/formComponent/LabeledInput";
import CustomDateRangePicker from "@app/components/commonComponents/DateRangePicker";
import DsbRichTextEditor from "./richTextEditor";

import SearchItemEassyUI from "@app/components/commonComponents/SearchItemEassyUI";
import { AutoComplete } from "primereact/autocomplete";
import { buildApiRequest, createApiConfig, isApiConfigReady, nodeSourceId, pluckRows } from "../utils/apiConfig";
import { getPath } from "../utils/expressions";
import { rememberEventRecord } from "../utils/livescope";
import { typographyClass } from "../utils/typography";
import { tr } from "../utils/i18n";
import { OPTION_PAINT_MODES, paintOptions } from "../utils/colorRules";
import { ICONS } from "./icons";
import {
  APP_BTN,
  AppButton,
  BTN_SIZE_OPTIONS,
  BTN_VARIANT_OPTIONS,
  btnClass,
  FieldShell,
  GROUPS,
  Icon,
  p,
  prependExtraOptions,
  useApiOptions,
  useDefaultSubmit,
  useDependentReset,
  isEmptySelection,
  useFieldValue,
  useOptionLabel,
  useOptions,
  useSeedValue,
  useSelectDefault,
} from "./shared";

/* -------------------------------------------------------------------------- */
/*  shared adapter helpers                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A leading icon inside the project's own control.
 *
 * The control is the app's component, not ours, so the icon cannot be a child
 * of it in JSX. It is portalled into the box the control draws — `.form-group`
 * in the classic skin, FieldShell's `.mi-field-shell` in the modern one — and
 * the stylesheet (runtime.css, "leading icons") moves the text and the resting
 * label over to make room. A control that already draws the icon itself (the
 * modern text input takes `icon`) passes `native` and gets nothing here.
 */
function LeadIcon({ shellRef, name, native }) {
  const [host, setHost] = useState(null);
  // No deps on purpose: the control may swap its markup (skin switch, a
  // select loading its options), and the host has to follow it.
  useLayoutEffect(() => {
    const el = shellRef.current;
    const next = !name || !el ? null : el.querySelector(".form-group") || (native ? null : el.querySelector(".mi-field-shell"));
    setHost((h) => (h === next ? h : next));
  });
  if (!host || !ICONS[name]) return null;
  return createPortal(
    <span className="dsb-lead-ic" aria-hidden="true">
      <Icon name={name} size={14} />
    </span>,
    host,
  );
}

/** The `icon` prop a text-like control or a select draws inside its box. */
const leadIconProp = () =>
  p.icon("icon", "Leading icon", GROUPS.CONTENT, {
    hint: "Drawn inside the box, before what is typed. The suggestion comes from the label.",
  });

/** Carries the inspector's Style tab output around a project component. */
/**
 * @param onBlur / onFocus  wired on the wrapper, not on the control.
 *
 * The app's <ReactSelect> and PrimeReact's calendar take no blur handler of
 * their own, and a select that cannot say when it was left cannot run the
 * "reload the wards when the centre is chosen" chain the inspector offers it.
 * Focus events bubble, so the wrapper hears them — as long as focus moving
 * BETWEEN the widget's own parts (input to menu to clear button) is not
 * reported as leaving it.
 */
function NativeShell({ style, className = "", error, help, onBlur, onFocus, onClick, leadIcon = "", leadNative = false, children }) {
  const shellRef = useRef(null);
  const leave = (e) => {
    if (!onBlur) return;
    if (e.currentTarget.contains(e.relatedTarget)) return;
    onBlur();
  };
  const enter = (e) => {
    if (!onFocus) return;
    if (e.currentTarget.contains(e.relatedTarget)) return;
    onFocus();
  };
  return (
    <div
      ref={shellRef}
      className={`dsb-native ${typographyClass(style)} ${leadIcon ? "has-lead-ic" : ""} ${className}`.replace(/\s+/g, " ").trim()}
      style={style}
      onBlur={onBlur ? leave : undefined}
      onFocus={onFocus ? enter : undefined}
      onClick={onClick}
    >
      {children}
      {leadIcon ? <LeadIcon shellRef={shellRef} name={leadIcon} native={leadNative} /> : null}
      {/* The inspector has offered "Helper text" on every control since the
          start; only the builder-drawn ones (FieldShell) ever showed it. */}
      {help && !error ? <div className="dsb-help">{help}</div> : null}
      {error ? <div className="dsb-err">{error}</div> : null}
    </div>
  );
}

/** DOM ids must be valid CSS selectors — PrimeReact Tooltip targets `#id`. */
const domId = (node) => `dsb_${String(node.id).replace(/[^A-Za-z0-9_-]/g, "")}`;

/** Class the project components use to flag a required field. */
const reqClass = (required, extra = "") => `${extra} ${required ? "required-fields" : ""}`.trim();

const ISO = "YYYY-MM-DD";
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const m = moment(v, [ISO, moment.ISO_8601, "DD/MM/YYYY", "DD-MMM-YYYY"], false);
  return m.isValid() ? m.toDate() : null;
};
/**
 * Whatever a date control hands back — the ISO string it is stored as.
 *
 * A Date is what both pickers send today, but the app's DatePicker also emits
 * the typed text on manual entry, and PrimeReact sends the display string in
 * some paths. Parsing those instead of returning "" is the difference between
 * a pick that lands and a pick that vanishes with no error anywhere.
 */
const toIso = (d) => {
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? "" : moment(d).format(ISO);
  if (typeof d === "string" && d.trim()) {
    const m = moment(d, [ISO, moment.ISO_8601, "DD/MM/YYYY", "D/M/YYYY", "DD-MMM-YYYY", "DD/M/YY", "D/M/YY"], false);
    return m.isValid() ? m.format(ISO) : "";
  }
  return "";
};

/**
 * The relative defaults a date field can start on.
 *
 * Stored as the name of the rule, not the date it resolves to — a screen saved
 * in March that said "today" still means today when it is opened in June.
 */
const DEFAULT_DATE_OPTIONS = [
  { value: "", label: "None" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "startOfMonth", label: "First of this month" },
  { value: "endOfMonth", label: "Last of this month" },
  { value: "today-7d", label: "A week ago" },
  { value: "today-1m", label: "A month ago" },
  { value: "today-1y", label: "A year ago" },
];

/** `today`, `today-1y`, `today+30d` — a day counted from the day it is read. */
const RELATIVE_DATE = /^\s*today\s*([+-])\s*(\d+)\s*([dwmy])\s*$/i;
const RELATIVE_UNITS = { d: "days", w: "weeks", m: "months", y: "years" };

export function resolveDateDefault(kind) {
  if (!kind) return "";
  switch (kind) {
    case "today":
      return moment().format(ISO);
    case "yesterday":
      return moment().subtract(1, "day").format(ISO);
    case "tomorrow":
      return moment().add(1, "day").format(ISO);
    case "startOfMonth":
      return moment().startOf("month").format(ISO);
    case "endOfMonth":
      return moment().endOf("month").format(ISO);
    default: {
      const rel = RELATIVE_DATE.exec(String(kind));
      if (rel) {
        const n = Number(rel[2]) * (rel[1] === "-" ? -1 : 1);
        return moment().add(n, RELATIVE_UNITS[rel[3].toLowerCase()]).format(ISO);
      }
      // A screen may also store a literal date; pass it through if it parses.
      return moment(kind, [ISO, moment.ISO_8601], true).isValid() ? moment(kind).format(ISO) : "";
    }
  }
}

const commonFieldProps = (extra = []) => [
  p.text("label", "Label"),
  p.text("field", "Field name (data key)", GROUPS.DATA),
  p.text("placeholder", "Placeholder"),
  p.text("help", "Helper text"),
  p.text("respclass", "Grid class (col-md-3 …)", GROUPS.LAYOUT),
  p.bool("disabled", "Disabled"),
  p.bool("readOnly", "Read only"),
  ...extra,
];

/* -------------------------------------------------------------------------- */
/*  text inputs — project <Input />                                            */
/* -------------------------------------------------------------------------- */

function TextLike({ node, props, style, rt, required, type }) {
  const f = useFieldValue(node, props, rt);
  // A default has to be IN the form, not only in the box: a save posts
  // rt.values, so a starting value nobody typed over would be sent empty.
  // Interpolated first, so {{row.PatientName}} seeds a dialog opened on a row.
  useSeedValue(node, props, rt, props.defaultValue);
  return (
    <NativeShell style={style} error={f.error} help={props.help} leadIcon={props.icon} leadNative>
      <Input
        type={type}
        icon={props.icon ? ICONS[props.icon] : undefined}
        id={domId(node)}
        name={f.field}
        lable={tr(props.label)}
        placeholder={tr(props.placeholder)}
        value={f.value ?? ""}
        onChange={(e) => f.onChange(e.target.value)}
        onBlur={f.onBlur}
        onFocus={f.onFocus}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={required}
        maxLength={props.maxLength || undefined}
        min={props.min ?? undefined}
        max={props.max ?? undefined}
        isUpperCase={props.uppercase}
        display={props.align}
        respclass={props.respclass || ""}
        className={reqClass(required, props.inputClass || "form-control")}
        removeFormGroupClass={props.removeFormGroup}
      />
    </NativeShell>
  );
}

const TextInputDef = {
  type: "TextInput",
  label: "Text Input",
  icon: "Type",
  category: "Form",
  defaultProps: {
    label: "Label",
    field: "",
    placeholder: "",
    defaultValue: "",
    respclass: "",
    inputClass: "form-control",
    uppercase: false,
    maxLength: null,
    align: "left",
  },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: commonFieldProps([
    leadIconProp(),
    // A control inside a row-opened dialog is usually pre-filled FROM that row,
    // so the field picker belongs here as much as on a read-only value.
    p.template("defaultValue", "Default value", GROUPS.CONTENT, { placeholder: "{{row.PatientName}}" }),
    p.number("maxLength", "Max length"),
    p.bool("uppercase", "Force upper case"),
    p.select("align", "Text align", [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ]),
    p.text("inputClass", "Input CSS class", GROUPS.APPEARANCE),
  ]),
  render: (a) => <TextLike {...a} type="text" />,
};

const NumberInputDef = {
  type: "NumberInput",
  label: "Number Input",
  icon: "Hash",
  category: "Form",
  defaultProps: { label: "Number", field: "", placeholder: "", defaultValue: "", min: null, max: null, respclass: "", align: "right" },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: commonFieldProps([
    leadIconProp(),
    p.template("defaultValue", "Default value", GROUPS.CONTENT, { placeholder: "0" }),
    p.number("min", "Min"),
    p.number("max", "Max"),
    p.select("align", "Text align", [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ]),
  ]),
  render: (a) => <TextLike {...a} type="number" />,
};

const PasswordDef = {
  type: "PasswordInput",
  label: "Password",
  icon: "KeyRound",
  category: "Form",
  defaultProps: { label: "Password", field: "", placeholder: "", maxLength: null, respclass: "" },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: commonFieldProps([leadIconProp(), p.number("maxLength", "Max length")]),
  render: (a) => <TextLike {...a} type="password" />,
};

/* -------------------------------------------------------------------------- */
/*  textarea — project <TextAreaInput />                                       */
/* -------------------------------------------------------------------------- */

const TextareaDef = {
  type: "Textarea",
  label: "Textarea",
  icon: "AlignLeft",
  category: "Form",
  defaultProps: { label: "Notes", field: "", placeholder: "", defaultValue: "", rows: 3, maxLength: null, respclass: "" },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: commonFieldProps([
    p.template("defaultValue", "Default value", GROUPS.CONTENT, { placeholder: "{{row.Remarks}}" }),
    p.number("rows", "Rows"),
    p.number("maxLength", "Max length"),
    p.color("labelColor", "Label colour", GROUPS.APPEARANCE),
  ]),
  render: ({ node, props, style, rt, required }) => {
    const f = useFieldValue(node, props, rt);
    useSeedValue(node, props, rt, props.defaultValue);
    return (
      <NativeShell style={style} error={f.error} help={props.help}>
        <TextAreaInput
          id={domId(node)}
          name={f.field}
          lable={tr(props.label)}
          placeholder={tr(props.placeholder)}
          value={f.value ?? ""}
          rows={props.rows || 3}
          maxLength={props.maxLength || undefined}
          onChange={(e) => f.onChange(e.target.value)}
          onBlur={f.onBlur}
          onFocus={f.onFocus}
          disabled={props.disabled}
          readOnly={props.readOnly}
          respclass={props.respclass || ""}
          className={reqClass(required, "form-control")}
          labelColor={props.labelColor || undefined}
        />
      </NativeShell>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  rich text — the builder's own CKEditor (./richTextEditor)                  */
/* -------------------------------------------------------------------------- */

/**
 * What the canvas draws for a rich text field.
 *
 * Not the editor itself: CKEditor lives in an iframe, which swallows the
 * clicks the canvas needs to select, drag and resize the node, and booting
 * one per edit of the inspector is slow. The same footprint — dictation bar,
 * toolbar, body at the set height — so the layout can be judged as it is.
 */
function RichTextPreview({ height, mic, text }) {
  const glyph = (t, extra) => (
    <span className="dsb-rte-glyph" style={extra}>
      {t}
    </span>
  );
  return (
    <div className="dsb-rte-preview" aria-hidden="true">
      {mic ? (
        <div className="dsb-rte-mic">
          <span className="dsb-rte-lang">English (India)</span>
          <span className="dsb-rte-micbtn">
            <i className="fas fa-microphone" /> Mic
          </span>
        </div>
      ) : null}
      <div className="dsb-rte-tools">
        <Icon name="Undo2" size={13} />
        <Icon name="Redo2" size={13} />
        <i className="dsb-rte-sep" />
        {glyph("B", { fontWeight: 800 })}
        {glyph("I", { fontStyle: "italic", fontFamily: "Georgia, serif" })}
        {glyph("U", { textDecoration: "underline" })}
        <Icon name="Palette" size={13} />
        <i className="dsb-rte-sep" />
        <Icon name="ListOrdered" size={13} />
        <Icon name="AlignLeft" size={13} />
        <Icon name="Link" size={13} />
        <Icon name="Image" size={13} />
        <Icon name="Table" size={13} />
        <span className="dsb-rte-combo">Times New Roman</span>
        <span className="dsb-rte-combo">18px</span>
      </div>
      <div className="dsb-rte-body" style={{ height: Math.min(Math.max(height, 80), 480) }}>
        {text ? <span>{text}</span> : <span className="dsb-rte-ph">Rich text — formatted notes, tables, images…</span>}
      </div>
    </div>
  );
}

function RichTextControl({ node, props, style, rt, required }) {
  const f = useFieldValue(node, props, rt);
  useSeedValue(node, props, rt, props.defaultValue);
  const label = tr(props.label);
  const height = Number(props.height) > 0 ? Number(props.height) : 250;
  // The editor keeps the handlers it was born with; these never change and
  // always reach the field as it is now.
  const fRef = useRef(f);
  fRef.current = f;
  const setValue = useCallback((html) => fRef.current.onChange(html), []);
  const onBlur = useCallback(() => fRef.current.onBlur(), []);
  const onFocus = useCallback(() => fRef.current.onFocus(), []);
  const html = f.value === undefined || f.value === null ? "" : String(f.value);
  const locked = !!(props.readOnly || props.disabled);

  return (
    <NativeShell style={style} error={f.error} help={props.help} className={`dsb-rte ${props.respclass || ""}`}>
      {label ? (
        <label className={`dsb-rte-label${required ? " is-req" : ""}`} htmlFor={domId(node)}>
          {label}
        </label>
      ) : null}
      {rt?.design ? (
        <RichTextPreview
          height={height}
          mic={!!props.mic}
          text={html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()}
        />
      ) : (
        <div id={domId(node)} className={`dsb-rte-box${f.error ? " is-invalid" : ""}${props.disabled ? " is-disabled" : ""}`}>
          <DsbRichTextEditor
            value={html}
            setValue={setValue}
            height={height}
            isMic={!!props.mic && !locked}
            readOnly={locked}
            shortKeys={props.shortKeys !== false}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        </div>
      )}
    </NativeShell>
  );
}

const RichTextDef = {
  type: "RichTextEditor",
  label: "Rich Text (CKEditor)",
  icon: "FileText",
  category: "Form",
  defaultProps: {
    label: "Notes",
    field: "",
    defaultValue: "",
    height: 250,
    mic: false,
    shortKeys: true,
    respclass: "",
  },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: [
    p.text("label", "Label"),
    p.text("field", "Field name (data key)", GROUPS.DATA),
    p.text("help", "Helper text"),
    p.text("respclass", "Grid class (col-md-12 …)", GROUPS.LAYOUT),
    p.bool("disabled", "Disabled"),
    p.bool("readOnly", "Read only"),
    p.template("defaultValue", "Default value (HTML)", GROUPS.CONTENT, {
      placeholder: "{{row.Notes}}",
      hint: "What the editor opens with — HTML or plain text. Edit row / Fill form fills it like any other field.",
    }),
    p.number("height", "Editor height (px)", GROUPS.LAYOUT, { placeholder: "250" }),
    p.bool("mic", "Voice dictation (mic)", GROUPS.BEHAVIOUR, {
      hint: "A bar over the editor with a language pick and a Mic button — speech is typed in at the caret. Chrome / Edge.",
    }),
    p.bool("shortKeys", "@ short keys", GROUPS.BEHAVIOUR, {
      hint: "Typing @ and a few letters lists the hospital's saved short keys; Enter / Tab or a click puts in its text. ↑ ↓ move, Esc closes.",
    }),
  ],
  render: (a) => <RichTextControl {...a} />,
};

/* -------------------------------------------------------------------------- */
/*  select — project <ReactSelect /> and <MultiSelectComp />                    */
/* -------------------------------------------------------------------------- */

/**
 * Past this many options the project's <ReactSelect> swaps itself for a
 * PrimeReact AutoComplete (formComponent/AutoCompleteReactSelect) — and that
 * swap does not fit the builder: it hands every keystroke to handleChange as a
 * bare string, which has no `.value`, so the form was cleared on each letter
 * and nothing could be typed; its label also sat inside the box over the text.
 * A long list is drawn here instead, by the builder's own type-ahead.
 */
const BIG_LIST = 500;
/** Suggestions drawn at once — the box narrows the rest as you type. */
const BIG_LIST_SHOWN = 100;

/**
 * A Select over a long list: type, pick from what matches.
 *
 * The form holds the picked option's value, as a Select does; the box holds
 * the typed text until a pick. Text left unpicked goes back to the selection
 * on blur, and emptying the box clears it.
 */
function BigListSelect({ inputId, options, value, onPick, label, placeholder, disabled, required, respclass }) {
  const selected = useMemo(
    () =>
      value === undefined || value === null || value === ""
        ? null
        : options.find((o) => String(o?.value) === String(typeof value === "object" ? value?.value : value)) || null,
    [options, value],
  );
  const [box, setBox] = useState(selected || "");
  const [suggestions, setSuggestions] = useState([]);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // A value set from elsewhere (Reset, Set field value, the default) shows as
  // its option's label. Keyed by content, not by the option object: the list
  // is rebuilt on unrelated renders, and a new object for the same pick reset
  // the box to it in the middle of typing.
  const selKey = selected ? `${selected.value}\u0000${selected.label}` : "";
  useEffect(() => {
    setBox(selectedRef.current || "");
  }, [selKey]);

  const complete = (e) => {
    const q = String(e?.query ?? "").trim().toLowerCase();
    const hit = q ? options.filter((o) => String(o?.label ?? "").toLowerCase().includes(q)) : options;
    setSuggestions(hit.slice(0, BIG_LIST_SHOWN));
  };

  const onChange = (e) => {
    const next = e.value;
    setBox(next);
    if (next === "" && selected) onPick("");
  };

  const onSelect = (e) => {
    const opt = e?.value;
    if (!opt || typeof opt !== "object") return;
    setBox(opt);
    onPick(opt.value);
  };

  // Text left unpicked goes back to the selection. Later, not at once: a click
  // on a suggestion blurs the input before it selects, and reverting first
  // dropped the click.
  const onBlur = () => {
    setTimeout(() => setBox((cur) => (typeof cur === "string" ? selectedRef.current || "" : cur)), 200);
  };

  return (
    <div className={respclass}>
      <div className={disabled ? "form-group select-disable" : "form-group"}>
        <div className={`dsb-ac-wrap ${box ? "is-filled" : ""} ${required ? "is-required" : ""}`.trim()}>
          <AutoComplete
            inputId={inputId}
            value={box}
            suggestions={suggestions}
            completeMethod={complete}
            onChange={onChange}
            onSelect={onSelect}
            onBlur={onBlur}
            field="label"
            dropdown
            minLength={1}
            delay={150}
            autoHighlight
            disabled={!!disabled}
            placeholder={placeholder}
            emptyMessage={tr("No results found")}
            showEmptyMessage
            className={`w-100 ${required ? "required-fields" : ""}`.trim()}
            inputClassName="form-control"
            panelClassName="dsb-ac-panel"
            appendTo={typeof document !== "undefined" ? document.body : undefined}
          />
          {label ? (
            <label htmlFor={inputId} className="lable searchtest dsb-ac-label">
              {label}
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const SelectDef = {
  type: "SelectInput",
  label: "Select",
  icon: "SquareChevronDown",
  category: "Form",
  defaultProps: {
    label: "Select",
    field: "",
    placeholder: "",
    isMulti: false,
    isClearable: true,
    isSearchable: true,
    respclass: "",
    optionsSource: "static",
    options: [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
    ],
    optionsSourceId: "",
    optionsApi: createApiConfig(),
    /** Written by the picker's Sync; design-time only, never fetched. */
    previewOptions: [],
    optionLabelField: "",
    optionValueField: "",
    optionFilters: [],
    /** Fixed choices ahead of a bound list — [{ label: "All", value: "0" }]. */
    extraOptions: [],
    dependsOn: "",
    defaultMode: "",
    defaultValue: "",
    /** Off by default: an ordinary dropdown keeps the platform's own look. */
    optionColorMode: "",
    optionColorField: "",
    optionTextColorField: "",
    optionDefaultBg: "",
    optionDefaultFg: "",
    optionColorRules: [],
    colorControl: true,
  },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: [
    p.text("label", "Label"),
    p.text("field", "Field name (data key)", GROUPS.DATA),
    p.text("placeholder", "Placeholder", GROUPS.CONTENT, { hint: "Falls back to the label" }),
    leadIconProp(),
    p.text("help", "Helper text"),
    p.text("respclass", "Grid class (col-md-3 …)", GROUPS.LAYOUT),
    p.bool("isMulti", "Multi select"),
    p.bool("isClearable", "Clearable"),
    p.bool("isSearchable", "Searchable"),
    p.bool("disabled", "Disabled"),
    p.select(
      "optionsSource",
      "Options from",
      [
        { value: "static", label: "Static list" },
        { value: "endpoint", label: "API endpoint" },
        { value: "api", label: "Shared data source" },
      ],
      GROUPS.DATA,
    ),
    p.options("options", "Options", GROUPS.DATA, { when: (pr) => (pr.optionsSource || "static") === "static" }),
    {
      key: "optionsApi",
      label: "Options endpoint",
      type: "apiEndpoint",
      group: GROUPS.DATA,
      mode: "options",
      when: (pr) => pr.optionsSource === "endpoint",
    },
    p.text("optionsSourceId", "Data source id", GROUPS.DATA, { when: (pr) => pr.optionsSource === "api" }),
    p.dataKey("optionLabelField", "Label field", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "api" || pr.optionsSource === "endpoint",
      placeholder: "label / name / text",
    }),
    p.dataKey("optionValueField", "Value field", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "api" || pr.optionsSource === "endpoint",
      placeholder: "value / id",
    }),
    p.optionFilters("optionFilters", "Filter options", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "api" || pr.optionsSource === "endpoint",
    }),
    p.options("extraOptions", "Extra options — shown first", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "api" || pr.optionsSource === "endpoint",
      blank: () => ({ label: "All", value: "0" }),
      addLabel: "Add extra option",
      hint: "Put in front of the list the API returns, in this order — the first one here is index 0. The value is sent exactly as typed. An API row with the same value is shown once, here.",
    }),
    p.formField("dependsOn", "Depends on field", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "endpoint",
      placeholder: "another control's field",
    }),
    p.select(
      "defaultMode",
      "Default selection",
      [
        { value: "", label: "Nothing selected" },
        { value: "value", label: "A value I choose" },
        { value: "first", label: "The first option" },
      ],
      GROUPS.DATA,
      { hint: "Chosen when the screen opens, and posted with the form even if nobody touches it" },
    ),
    {
      key: "defaultValue",
      label: "Default value",
      type: "optionValue",
      group: GROUPS.DATA,
      when: (pr) => pr.defaultMode === "value",
      placeholder: "A value, or {{user.centreId}}",
    },
    p.select("optionColorMode", "Colour the options", OPTION_PAINT_MODES, GROUPS.APPEARANCE, {
      hint: "Draw each choice in its own colour — a triage list reads far faster than plain text",
    }),
    p.dataKey("optionColorField", "Background from field", GROUPS.APPEARANCE, {
      when: (pr) => !!pr.optionColorMode,
      placeholder: "ColorCode",
    }),
    p.dataKey("optionTextColorField", "Text colour from field", GROUPS.APPEARANCE, {
      when: (pr) => !!pr.optionColorMode,
      placeholder: "TextColor",
    }),
    p.color("optionDefaultBg", "Default background", GROUPS.APPEARANCE, {
      when: (pr) => !!pr.optionColorMode,
    }),
    p.color("optionDefaultFg", "Default text colour", GROUPS.APPEARANCE, {
      when: (pr) => !!pr.optionColorMode,
    }),
    p.colorRules("optionColorRules", "Colour rules", GROUPS.APPEARANCE, {
      when: (pr) => !!pr.optionColorMode,
      fieldDefault: "value",
      hint: "Leave the field blank to test the option's own value; name a field to test the row behind it",
    }),
    p.bool("colorControl", "Colour the closed box too", GROUPS.APPEARANCE, {
      when: (pr) => pr.optionColorMode === "fill",
    }),
  ],
  render: ({ node, props, style, rt, scope, required, withAdd = false }) => {
    const f = useFieldValue(node, props, rt);
    const staticOptions = useOptions(props, rt);
    const api = useApiOptions(node, props, rt);

    // Losing the child's value when the parent changes is the point: a
    // Sub-category still holding the previous Category's answer submits wrong
    // data silently.
    useDependentReset(props, rt, () => f.onChange(props.isMulti ? [] : ""));

    const fromApi = props.optionsSource === "endpoint";
    const bound = fromApi || props.optionsSource === "api";
    const boundOptions = fromApi ? api.options : staticOptions;
    // "All" / "0" and friends go in front of a bound list; a static list is
    // typed in full already, so it has nothing to add in front of.
    const rawOptions = useMemo(
      () => (bound ? prependExtraOptions(boundOptions, props.extraOptions, tr) : boundOptions),
      [bound, boundOptions, props.extraOptions],
    );
    // The colours ride on the options themselves, so the default is decided
    // from the same list the dropdown shows and every select — plain, modern
    // or multi — paints from one resolution rather than three.
    const options = useMemo(
      () => paintOptions(rawOptions, props, scope || {}),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        rawOptions,
        props.optionColorMode,
        props.optionColorField,
        props.optionTextColorField,
        props.optionDefaultBg,
        props.optionDefaultFg,
        props.optionColorRules,
        scope,
      ],
    );
    // {{labels.<field>}}: the text of the choice, beside {{values.<field>}}.
    const pick = useOptionLabel(f, props, rt, options);

    /**
     * Select + Add (SelectAddDef) renders through here with `withAdd`: the same
     * dropdown, a + beside it, and — once the dialog the + opened has saved and
     * the options have been fetched again — the entry just added picked.
     *
     * "Just added" is whatever the reloaded list has that the list at the
     * moment of the click did not. Exactly one new option is picked; none (the
     * dialog was cancelled, or the list has not come back yet) waits; several
     * (the list changed for some other reason) picks nothing. Every hook runs
     * for a plain Select too, where `withAdd` is false and they do nothing.
     */
    const addPending = useRef(null);
    useEffect(() => {
      const pending = addPending.current;
      if (!withAdd || !pending) return;
      // A dialog left open over lunch is not "just added" any more.
      if (Date.now() - pending.at > 30 * 60 * 1000) {
        addPending.current = null;
        return;
      }
      const fresh = options.filter((o) => !pending.before.has(String(o.value)));
      if (!fresh.length) return;
      addPending.current = null;
      if (fresh.length !== 1 || props.selectNew === false) return;
      const v = fresh[0].value;
      f.onChange(props.isMulti ? [...(Array.isArray(f.value) ? f.value : []), v] : v);
      // Only a new list is a reason to look again.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options]);

    const onAdd = () => {
      if (rt?.design) return; // on the canvas a click selects the control
      const a = props.addAction || {};
      if (!a.target && !a.appModal) {
        toast.warn(`The + beside "${tr(props.label) || "this select"}" does not open anything yet — pick what it opens in its properties.`);
        return;
      }
      addPending.current = { before: new Set(options.map((o) => String(o.value))), at: Date.now() };
      // What reloads when the dialog saves: this select's own options, unless
      // the designer chose something else.
      const own =
        props.optionsSource === "endpoint"
          ? nodeSourceId(node.id)
          : props.optionsSource === "api"
            ? props.optionsSourceId || ""
            : "";
      rt?.runActions?.([{ ...a, type: "openModal", sourceId: a.sourceId || own }], { row: scope?.row ?? null });
    };

    const addLabel = tr(props.addTooltip) || "Add new";
    // The hand-coded pages' own button (IDPDetailCard's Refer Doctor / PRO):
    // same classes, same icon, so it looks like theirs in both skins.
    const withPlus = (control) =>
      withAdd ? (
        <div className="dsb-selectadd">
          <div className="dsb-selectadd-ctl">{control}</div>
          <button
            type="button"
            className="btn btn-sm btn-primary dsb-selectadd-btn"
            title={addLabel}
            aria-label={addLabel}
            disabled={props.disabled}
            onClick={onAdd}
          >
            <i className="fa fa-plus-circle fa-sm new_record_pluse" aria-hidden="true" />
          </button>
        </div>
      ) : (
        control
      );

    // The default is put into the form, not just shown in the box: a save
    // reads the form's values, so a selection nobody touched has to be there.
    const preview = useSelectDefault(node, props, rt, options);
    // On the canvas nothing is written, so the default is displayed directly
    // — that way the designer sees the choice the rule makes. At runtime only
    // the real value shows, so clearing the select sticks.
    const shown = rt?.design && isEmptySelection(f.value) ? preview : f.value;

    // Every memo runs unconditionally: `isMulti` is editable in the inspector,
    // and a hook behind an `if` would change the hook order when it flips.
    const msOptions = useMemo(() => options.map((o) => ({ ...o, name: o.label })), [options]);
    // PrimeReact reads an option that carries `value` as that value: the box
    // takes and hands back the values themselves, not the option objects.
    // Handing it objects matched nothing — the box printed "null" and every
    // pick came back as `undefined`. The option's own value is passed, not the
    // stored one, so "5" stored against a numeric 5 still matches.
    const selected = useMemo(() => {
      const arr = Array.isArray(shown) ? shown.map(String) : [];
      return msOptions.filter((o) => arr.includes(String(o.value))).map((o) => o.value);
    }, [shown, msOptions]);

    // What the box says while it has nothing to offer, so an empty list reads as
    // a state rather than a fault.
    const hint = fromApi
      ? api.waiting
        ? `Select ${tr(api.parentLabel) || api.parent} first`
        : api.loading
          ? "Loading…"
          : api.error || (api.filteredOut ? "No option matches the filter" : "")
      : "";
    const placeholder = hint || tr(props.placeholder) || tr(props.label);

    if (props.isMulti) {
      return (
        <NativeShell style={style} error={f.error || api.error} help={props.help} onBlur={f.onBlur} onFocus={f.onFocus}>
          {withPlus(
            <MultiSelectComp
              name={f.field}
              placeholderName={placeholder}
              dynamicOptions={msOptions}
              value={selected}
              handleChange={(_n, sel) => pick((sel || []).map((o) => (o && typeof o === "object" ? o.value : o)))}
              itemTemplate={props.optionColorMode ? (o) => <OptionItem option={o} /> : undefined}
              disabled={props.disabled}
              respclass={props.respclass || ""}
              requiredClassName={required ? "required-fields" : ""}
            />,
          )}
        </NativeShell>
      );
    }

    // A long list is not handed to <ReactSelect>: see BIG_LIST.
    if (options.length > BIG_LIST) {
      const label = tr(props.label);
      return (
        <NativeShell
          style={style}
          error={f.error || api.error}
          help={props.help}
          onBlur={f.onBlur}
          onFocus={f.onFocus}
          leadIcon={props.icon}
        >
          {withPlus(
            <BigListSelect
              inputId={domId(node)}
              options={options}
              value={shown}
              onPick={(v) => pick(v)}
              label={label}
              placeholder={hint || tr(props.placeholder) || (label ? "" : tr("Type to search..."))}
              disabled={props.disabled || api.waiting}
              required={required}
              respclass={props.respclass || ""}
            />,
          )}
        </NativeShell>
      );
    }

    // A closed box in the colour of what it holds is the point of `fill`: the
    // screen reads at a glance without opening anything.
    const selectedOption = options.find((o) => String(o?.value) === String(shown));
    const boxFill = props.colorControl === false ? null : selectedFillStyle(selectedOption);

    return (
      <NativeShell
        style={style}
        error={f.error || api.error}
        help={props.help}
        onBlur={f.onBlur}
        onFocus={f.onFocus}
        leadIcon={props.icon}
      >
        {withPlus(
          <ReactSelect
            backgroundColor={boxFill?.backgroundColor || ""}
            id={domId(node)}
            inputId={domId(node)}
            name={f.field}
            placeholderName={placeholder}
            dynamicOptions={options}
            value={shown ?? ""}
            handleChange={(_n, opt) => pick(opt ? opt.value : "")}
            searchable={props.isSearchable !== false}
            removeIsClearable={props.isClearable === false}
            isDisabled={props.disabled || api.waiting}
            respclass={props.respclass || ""}
            requiredClassName={required ? "required-fields" : ""}
          />,
        )}
      </NativeShell>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  select + add — a dropdown with a + that adds to its own list               */
/* -------------------------------------------------------------------------- */

/**
 * The Refer Doctor / PRO control of the hand-coded admission pages: a select,
 * and beside it a + that opens a dialog to add a record the list is missing.
 *
 * Everything a Select does, it does — same props, same options endpoint, same
 * events — plus the + and what it opens. The dialog is either designed on this
 * canvas (a Modal / Dialog with its own Save chain) or any component of the
 * app picked from the list; either way, when it saves, this select's options
 * are fetched again and the new entry is picked. That reload is the whole
 * reason this is one control rather than a Select and a Button: the button
 * knows which list to refresh without anybody wiring it.
 */
const SelectAddDef = {
  ...SelectDef,
  type: "SelectAddInput",
  label: "Select + Add",
  icon: "BadgePlus",
  defaultProps: {
    ...SelectDef.defaultProps,
    addTooltip: "Add new",
    // An Open modal action with nothing picked yet; the inspector fills it.
    addAction: { type: "openModal" },
    selectNew: true,
  },
  propSchema: [
    ...SelectDef.propSchema,
    { key: "addAction", label: "The + button opens", type: "addTarget", group: GROUPS.BEHAVIOUR },
    p.text("addTooltip", "+ button tooltip", GROUPS.BEHAVIOUR, { placeholder: "Add new" }),
    p.bool("selectNew", "Pick the new entry after saving", GROUPS.BEHAVIOUR, {
      hint: "Once the dialog saves and the list reloads, the one option that was not there before is selected",
    }),
  ],
  render: (args) => SelectDef.render({ ...args, withAdd: true }),
};

/* -------------------------------------------------------------------------- */
/*  dates — project <DatePicker />, <DateRangePicker />, <TimePicker />         */
/* -------------------------------------------------------------------------- */

const DatePickerDef = {
  type: "DatePicker",
  label: "Date Picker",
  icon: "Calendar",
  category: "Form",
  defaultProps: {
    label: "Date",
    field: "",
    placeholder: "DD/MM/YYYY",
    showIcon: true,
    respclass: "",
    viewDate: "date",
    defaultDate: "",
    // The app's own calendar skin. A prop rather than a hardcoded string, so a
    // screen that needs a different look can say so without a code change --
    // and blank means "no class", which is the only way to opt out.
    calendarClass: "custom-calendar",
  },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: commonFieldProps([
    p.select("defaultDate", "Starts on", DEFAULT_DATE_OPTIONS, GROUPS.DATA, {
      hint: "Filled in when the screen opens, and posted with the form even if nobody touches it",
    }),
    p.bool("showIcon", "Show calendar button"),
    p.select("viewDate", "Picker view", [
      { value: "date", label: "Date" },
      { value: "month", label: "Month" },
      { value: "year", label: "Year" },
    ]),
    p.text("calendarClass", "Calendar class", GROUPS.LAYOUT, {
      hint: "Applied to the picker itself. Defaults to custom-calendar.",
    }),
    p.text("minDate", "Min date", GROUPS.BEHAVIOUR, {
      placeholder: "today-1y, 2026-01-01 or {{values.fromDate}}",
      hint: "A date (YYYY-MM-DD), a day counted from today — today, yesterday, today-1y, today+30d — or a binding to another field. Read when the screen opens.",
    }),
    p.text("maxDate", "Max date", GROUPS.BEHAVIOUR, {
      placeholder: "today",
      hint: "Same as Min date: today stops a date in the future, {{values.toDate}} keeps a From date on or before the To date.",
    }),
  ]),
  render: ({ node, props, style, rt, required }) => {
    const f = useFieldValue(node, props, rt);
    const seed = useMemo(() => resolveDateDefault(props.defaultDate), [props.defaultDate]);
    useSeedValue(node, props, rt, seed);
    // On the canvas nothing is written to the form, so the seed is shown
    // directly — that way the designer sees the date the rule produces. At
    // runtime only the real value is shown, so clearing the field sticks.
    const shown = rt?.design ? f.value || seed : f.value;

    /**
     * The same Date object for as long as the value is the same date.
     *
     * `toDate` builds a new Date on every call, and the picker below is
     * controlled: a fresh object each render reads to it as a value that keeps
     * changing, so it re-syncs and re-renders its open panel. A day cell
     * replaced between mousedown and mouseup never completes a click — the
     * calendar opens, and nothing can be selected. The TimePicker already
     * memoised for this reason; this one did not.
     */
    const asDate = useMemo(() => toDate(shown), [shown]);
    // `today`, `today-1y`… as well as a fixed date or a bound value.
    const minDate = useMemo(() => toDate(resolveDateDefault(props.minDate) || props.minDate) || undefined, [props.minDate]);
    const maxDate = useMemo(() => toDate(resolveDateDefault(props.maxDate) || props.maxDate) || undefined, [props.maxDate]);

    return (
      <NativeShell style={style} error={f.error} help={props.help} onBlur={f.onBlur} onFocus={f.onFocus}>
        <ProjectDatePicker
          id={domId(node)}
          name={f.field}
          lable={tr(props.label)}
          placeholder={tr(props.placeholder)}
          value={asDate}
          handleChange={(e) => f.onChange(toIso(e?.target?.value ?? e?.value))}
          disable={props.disabled}
          showIcon={props.showIcon !== false}
          viewDate={props.viewDate || "date"}
          minDate={minDate}
          maxDate={maxDate}
          respclass={props.respclass || ""}
          // `??` not `||`: a screen saved before this prop existed has no value
          // and gets the default, while a deliberately blank one stays blank.
          className={reqClass(required, props.calendarClass ?? "custom-calendar")}
          inputClassName={reqClass(required, "form-control")}
        />
      </NativeShell>
    );
  },
};

const DateRangeDef = {
  type: "DateRangePicker",
  label: "Date Range",
  icon: "CalendarRange",
  category: "Form",
  defaultProps: {
    label: "Date Range",
    fieldFrom: "fromDate",
    fieldTo: "toDate",
    defaultFrom: "",
    defaultTo: "",
    months: 2,
    dateFormat: "dd/MMM/yyyy",
    allowSingleDate: true,
    respclass: "",
  },
  defaultStyle: {},
  events: ["onChange"],
  propSchema: [
    p.text("label", "Label"),
    p.text("fieldFrom", "From field", GROUPS.DATA),
    p.text("fieldTo", "To field", GROUPS.DATA),
    p.text("respclass", "Grid class (col-md-3 …)", GROUPS.LAYOUT),
    p.number("months", "Months shown"),
    p.text("dateFormat", "Display format"),
    p.select("defaultFrom", "From starts on", DEFAULT_DATE_OPTIONS, GROUPS.DATA, {
      hint: "Filled in when the screen opens, and posted with the form",
    }),
    p.select("defaultTo", "To starts on", DEFAULT_DATE_OPTIONS, GROUPS.DATA),
    p.text("help", "Helper text"),
    p.bool("allowSingleDate", "Allow a single date"),
    p.bool("disabled", "Disabled"),
  ],
  render: ({ node, props, style, rt, required }) => {
    const from = props.fieldFrom || "fromDate";
    const to = props.fieldTo || "toDate";
    // A range answers with two fields, so it can fail on either: whichever the
    // validate action complained about is the message shown, rather than the
    // range being the one control on the screen that fails silently.
    const error = rt?.errors?.[from] || rt?.errors?.[to] || "";
    // A range writes two fields, so it seeds two — "First of this month" to
    // "Today" is a month-to-date report with nothing else configured.
    const seedFrom = useMemo(() => resolveDateDefault(props.defaultFrom), [props.defaultFrom]);
    const seedTo = useMemo(() => resolveDateDefault(props.defaultTo), [props.defaultTo]);
    useSeedValue(node, { field: from }, rt, seedFrom);
    useSeedValue(node, { field: to }, rt, seedTo);
    const onRange = (e) => {
      if (!rt || rt.design) return;
      const v = e?.target?.value || {};
      rt.setValue(from, toIso(v.startDate));
      rt.setValue(to, toIso(v.endDate));
      rt.runEvent(node, "onChange", { value: v, field: from });
    };
    // One Date per value here too: the range picker is controlled the same way.
    const shownFrom = rt?.design ? rt?.values?.[from] || seedFrom : rt?.values?.[from];
    const shownTo = rt?.design ? rt?.values?.[to] || seedTo : rt?.values?.[to];
    const startDate = useMemo(() => toDate(shownFrom), [shownFrom]);
    const endDate = useMemo(() => toDate(shownTo), [shownTo]);

    return (
      <NativeShell style={style} error={error} help={props.help}>
        <CustomDateRangePicker
          id={domId(node)}
          name={props.fieldFrom || node.id}
          label={tr(props.label)}
          startDate={startDate}
          endDate={endDate}
          onChange={onRange}
          months={Number(props.months) || 2}
          dateFormat={props.dateFormat || "dd/MMM/yyyy"}
          allowSingleDate={props.allowSingleDate !== false}
          disableField={props.disabled}
          respClass={props.respclass || ""}
          // The picker otherwise cuts at 20 chars and always appends "..." —
          // even to a single date. The box's own CSS ellipsis handles overflow.
          isShowFullDate
          requiredClassName={required ? "required-fields" : ""}
        />
      </NativeShell>
    );
  },
};

const TimePickerDef = {
  type: "TimePicker",
  label: "Time Picker",
  icon: "Clock",
  category: "Form",
  defaultProps: { label: "Time", field: "", respclass: "", defaultTime: "", showNow: true },
  defaultStyle: {},
  events: ["onChange", "onBlur", "onFocus"],
  propSchema: commonFieldProps([
    p.select(
      "defaultTime",
      "Starts on",
      [
        { value: "", label: "Empty" },
        { value: "now", label: "Current time" },
      ],
      GROUPS.DATA,
      { hint: "Current time is filled in when the screen opens, and posted with the form even if nobody touches it" },
    ),
    p.bool("showNow", "Show “Now” button", GROUPS.BEHAVIOUR, {
      hint: "A button in the picker that fills in the current time",
    }),
  ]),
  render: ({ node, props, style, rt, required }) => {
    const f = useFieldValue(node, props, rt);
    // "Current time" is read once, when the control mounts — the time the
    // screen was opened, not a clock that keeps moving under the user.
    const seed = useMemo(() => (props.defaultTime === "now" ? moment().format("HH:mm") : ""), [props.defaultTime]);
    useSeedValue(node, props, rt, seed);
    // As the DatePicker: the canvas shows the seed, runtime only the real value.
    const shown = rt?.design ? f.value || seed : f.value;
    const asDate = useMemo(() => {
      if (!shown) return null;
      const m = moment(shown, ["HH:mm", "hh:mm A", moment.ISO_8601], false);
      return m.isValid() ? m.toDate() : null;
    }, [shown]);
    return (
      <NativeShell style={style} error={f.error} help={props.help} onBlur={f.onBlur} onFocus={f.onFocus}>
        <ProjectTimePicker
          id={domId(node)}
          name={f.field}
          lable={tr(props.label)}
          placeholderName={tr(props.label || props.placeholder)}
          value={asDate}
          handleChange={(e) => {
            const d = e?.value ?? e?.target?.value;
            f.onChange(d instanceof Date && !Number.isNaN(d.getTime()) ? moment(d).format("HH:mm") : "");
          }}
          disable={props.disabled}
          respclass={props.respclass || ""}
          className={reqClass(required)}
          // On unless switched off: screens saved before the prop existed get it too.
          showNow={props.showNow !== false}
        />
      </NativeShell>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  checkbox — project <Checkbox />                                            */
/* -------------------------------------------------------------------------- */

const CheckboxDef = {
  type: "CheckboxInput",
  label: "Checkbox",
  icon: "SquareCheck",
  category: "Form",
  defaultProps: { label: "", field: "", text: "I agree", defaultValue: false, help: "", respclass: "" },
  defaultStyle: {},
  events: ["onChange"],
  propSchema: [
    p.text("text", "Checkbox text"),
    p.text("field", "Field name", GROUPS.DATA),
    p.bool("defaultValue", "Ticked to start with", GROUPS.DATA, {
      hint: "Posted with the form even if nobody touches it",
    }),
    p.text("help", "Helper text"),
    p.text("respclass", "Grid class", GROUPS.LAYOUT),
    p.bool("disabled", "Disabled"),
    p.bool("readOnly", "Read only"),
  ],
  render: ({ node, props, style, rt }) => {
    const f = useFieldValue(node, props, rt);
    // A tick is a value like any other, so it is seeded into the form rather
    // than only drawn ticked — a checkbox nobody touched still posts true.
    useSeedValue(node, props, rt, props.defaultValue || undefined);
    return (
      <NativeShell style={style} error={f.error} help={props.help}>
        <ProjectCheckbox
          id={domId(node)}
          name={f.field}
          label={tr(props.text)}
          checked={!!f.value}
          onChange={(_n, checked) => {
            if (props.readOnly) return;
            f.onChange(checked);
          }}
          disabled={props.disabled}
          respClass={props.respclass || ""}
        />
      </NativeShell>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  controls with no project equivalent — kept builder-native                   */
/* -------------------------------------------------------------------------- */

const RadioGroupDef = {
  type: "RadioGroup",
  label: "Radio Group",
  icon: "CircleDot",
  category: "Form",
  defaultProps: {
    label: "Choose",
    field: "",
    inline: true,
    help: "",
    optionsSource: "static",
    options: [
      { value: "m", label: "Male" },
      { value: "f", label: "Female" },
    ],
    optionsApi: createApiConfig(),
    previewOptions: [],
    optionLabelField: "",
    optionValueField: "",
    optionFilters: [],
    dependsOn: "",
  },
  defaultStyle: {},
  events: ["onChange"],
  propSchema: [
    p.text("label", "Label"),
    p.text("field", "Field name", GROUPS.DATA),
    p.text("help", "Helper text"),
    p.bool("inline", "Inline layout", GROUPS.APPEARANCE),
    // Same three sources a Select offers: a list of two genders is typed in,
    // a list of wards is not.
    p.select(
      "optionsSource",
      "Options from",
      [
        { value: "static", label: "Static list" },
        { value: "endpoint", label: "API endpoint" },
        { value: "api", label: "Shared data source" },
      ],
      GROUPS.DATA,
    ),
    p.options("options", "Options", GROUPS.DATA, { when: (pr) => (pr.optionsSource || "static") === "static" }),
    {
      key: "optionsApi",
      label: "Options endpoint",
      type: "apiEndpoint",
      group: GROUPS.DATA,
      mode: "options",
      when: (pr) => pr.optionsSource === "endpoint",
    },
    p.text("optionsSourceId", "Data source id", GROUPS.DATA, { when: (pr) => pr.optionsSource === "api" }),
    p.dataKey("optionLabelField", "Label field", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "api" || pr.optionsSource === "endpoint",
    }),
    p.dataKey("optionValueField", "Value field", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "api" || pr.optionsSource === "endpoint",
    }),
    p.optionFilters("optionFilters", "Filter options", GROUPS.DATA, {
      when: (pr) => pr.optionsSource === "api" || pr.optionsSource === "endpoint",
    }),
    p.bool("disabled", "Disabled"),
    p.bool("readOnly", "Read only"),
  ],
  render: ({ node, props, style, rt, required }) => {
    const f = useFieldValue(node, props, rt);
    const staticOptions = useOptions(props, rt);
    const api = useApiOptions(node, props, rt);
    const options = props.optionsSource === "endpoint" ? api.options : staticOptions;
    const pick = useOptionLabel(f, props, rt, options);
    return (
      <FieldShell node={node} props={props} error={f.error} required={required}>
        <div className={`dsb-radios ${props.inline ? "is-inline" : ""}`} style={style}>
          {options.map((o) => (
            <label key={o.value} className="dsb-radio">
              <input
                type="radio"
                name={f.field}
                checked={String(f.value) === String(o.value)}
                disabled={props.disabled || props.readOnly}
                onChange={() => pick(o.value)}
              />
              <span className="dsb-radio-dot" />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </FieldShell>
    );
  },
};

const SwitchDef = {
  type: "SwitchInput",
  label: "Switch",
  icon: "ToggleRight",
  category: "Form",
  defaultProps: { label: "Active", field: "", defaultValue: false, onText: "", offText: "", help: "" },
  defaultStyle: {},
  events: ["onChange"],
  propSchema: [
    p.text("label", "Label"),
    p.text("field", "Field name", GROUPS.DATA),
    p.bool("defaultValue", "On to start with", GROUPS.DATA, {
      hint: "Posted with the form even if nobody touches it",
    }),
    p.text("onText", "On text"),
    p.text("offText", "Off text"),
    p.text("help", "Helper text"),
    p.bool("disabled", "Disabled"),
    p.bool("readOnly", "Read only"),
  ],
  render: ({ node, props, style, rt, required }) => {
    const f = useFieldValue(node, props, rt);
    useSeedValue(node, props, rt, props.defaultValue || undefined);
    return (
      <FieldShell node={node} props={props} error={f.error} required={required}>
        <label className="dsb-switch" style={style}>
          <input
            type="checkbox"
            checked={!!f.value}
            disabled={props.disabled}
            onChange={(e) => {
              if (props.readOnly) return;
              f.onChange(e.target.checked);
            }}
          />
          <span className="dsb-switch-track">
            <span className="dsb-switch-thumb" />
          </span>
          {props.onText || props.offText ? (
            <span className="dsb-switch-text">{f.value ? props.onText : props.offText}</span>
          ) : null}
        </label>
      </FieldShell>
    );
  },
};

/**
 * File upload.
 *
 * What the field STORES is a choice, because the two callers want different
 * things: a screen that only records what was attached wants the names (and is
 * what every screen saved so far already reads), while a screen that actually
 * posts the file needs the File objects to put in a FormData. Names stay the
 * default, so nothing saved before this changes shape.
 */
const FILE_VALUE_MODES = [
  { value: "all", label: "Everything — file, base64 and sheet rows" },
  { value: "names", label: "The file names" },
  { value: "rows", label: "Excel rows (read the sheet)" },
];

/**
 * The Store mode a File Upload really runs in. "files" and "base64" were two
 * halves of what "all" now holds at once — the File, and its base64 — so a
 * control saved with either is read as "all" (schema.normalizeNode also
 * rewrites the prop on load, so the inspector shows it). Unset is the old
 * default, the names.
 */
export const fileStoreMode = (m) => (m === "files" || m === "base64" ? "all" : m || "names");

/** A file whose rows can be read: Excel or CSV. */
const isSheetFile = (file) => /\.(xlsx|xlsm|xls|csv)$/i.test(String(file?.name || ""));

/**
 * One picked file as "Everything" stores it — every form an endpoint might
 * want it in, so the screen never has to decide up front:
 *
 *   { name, size, type, base64, rows, file }
 *
 * `base64` for a JSON upload (fileBytes), `rows` the sheet's records for a
 * spreadsheet ([] for anything else), `file` the File itself for a form-data
 * upload. A sheet that cannot be read still keeps the file; only its rows are
 * left empty, with a warning.
 */
async function readFileAll(file, opts) {
  const record = { ...(await readFileBase64(file)), rows: [], file };
  if (isSheetFile(file)) {
    try {
      record.rows = await readSheetRows(file, opts);
    } catch (e) {
      toast.warn(e?.message || `The rows of ${file.name} could not be read`);
    }
  }
  return record;
}

/**
 * Which row of a sheet holds its column names (0-based, as SheetJS counts).
 *
 * Not always the first: a sheet the app exported carries a merged title row —
 * "Physical Verification Data" — and a subtitle above its headings, and read
 * from row 1 that title became the one column name and every heading a value
 * under it. So the first ten rows are looked at, and the headings are the
 * first row that is filled almost as wide as the data and holds only text; a
 * merged title fills one cell and is passed over. A sheet with nothing above
 * its headings answers row 1, as before.
 */
function headingRowOf(XLSX, ws) {
  if (!ws?.["!ref"]) return 0;
  const start = XLSX.utils.decode_range(ws["!ref"]).s.r;
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true, blankrows: true });
  const filled = (row) => (Array.isArray(row) ? row : []).filter((c) => c !== "" && c !== null && c !== undefined);
  const widest = grid.slice(0, 60).reduce((m, r) => Math.max(m, filled(r).length), 0);
  let firstFilled = -1;
  for (let i = 0; i < Math.min(10, grid.length); i += 1) {
    const cells = filled(grid[i]);
    if (!cells.length) continue;
    if (firstFilled < 0) firstFilled = i;
    // One column of data: its first filled row is the heading.
    if (widest <= 1) return start + i;
    if (cells.length >= 2 && cells.length >= Math.ceil(widest * 0.6) && cells.every((c) => typeof c === "string")) {
      return start + i;
    }
  }
  return start + Math.max(0, firstFilled);
}

/**
 * The records of one sheet of a spreadsheet, read in the browser.
 *
 * What "Excel rows" stores: `[{ ItemName, Qty, … }]`, keyed by the sheet's
 * heading row, so a Table can show the sheet before it is sent and a payload
 * can post the rows themselves. `headerRow` is 1-based; empty or 1 finds it
 * (see headingRowOf), 2 or more forces that row. `sheet` is a name or a
 * 1-based number; empty is the first sheet. Blank lines are dropped, dates
 * come back as YYYY-MM-DD, text is trimmed.
 */
async function readSheetRows(file, { headerRow = "", sheet = "" } = {}) {
  const mod = await import("xlsx");
  const XLSX = mod.default ?? mod;
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const want = String(sheet ?? "").trim();
  const name = !want
    ? wb.SheetNames[0]
    : wb.SheetNames.includes(want)
      ? want
      : /^\d+$/.test(want)
        ? wb.SheetNames[Number(want) - 1]
        : null;
  if (!name || !wb.Sheets[name]) throw new Error(`${file.name} has no sheet "${want}"`);
  const ws = wb.Sheets[name];
  const forced = Number(headerRow) >= 2 ? Math.floor(Number(headerRow)) - 1 : null;
  const rows = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: true,
    range: forced !== null ? forced : headingRowOf(XLSX, ws),
  });
  return rows
    .map((r) => {
      const out = {};
      Object.keys(r).forEach((k) => {
        const key = String(k).trim();
        // A column with no heading has nothing to be called by.
        if (!key || key.startsWith("__EMPTY")) return;
        const v = r[k];
        out[key] = v instanceof Date ? moment(v).format(ISO) : typeof v === "string" ? v.trim() : v;
      });
      return out;
    })
    .filter((o) => Object.values(o).some((v) => v !== "" && v !== null && v !== undefined));
}

/**
 * Does a picked file match the control's "Accepted types"?
 *
 * The browser's own `accept` only filters the dialog — "All files" is one
 * click away, and a drop ignores it entirely — so a sheet upload that must be
 * .xlsx is checked again here, the way the hand-coded upload pages do.
 * Entries are extensions (".xlsx"), exact types ("application/pdf") or a
 * family ("image/*").
 */
function fileAccepted(file, accept) {
  const rules = String(accept || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return rules.some((r) =>
    r.startsWith(".") ? name.endsWith(r) : r.endsWith("/*") ? type.startsWith(r.slice(0, -1)) : type === r,
  );
}

/**
 * A file as a JSON payload carries it: `{ name, size, type, base64 }`, the
 * base64 WITHOUT its "data:…;base64," prefix — what the upload endpoints take
 * as `fileBytes` beside `fileName`.
 */
function readFileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const at = text.indexOf(",");
      resolve({ name: file.name, size: file.size, type: file.type, base64: at >= 0 ? text.slice(at + 1) : text });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * How a File Upload is drawn. "field" is one line, the height of the inputs
 * and selects beside it: a dashed box reading "Choose File", with the label
 * floating on its border the way the app's inputs carry theirs. It is also
 * what a control saved before this setting existed gets.
 */
const FILE_LOOKS = [
  { value: "field", label: "Field (one line, dashed)" },
  { value: "button", label: "Button (Choose File)" },
  { value: "dropzone", label: "Drop zone (large box)" },
];

const FileUploadDef = {
  type: "FileUpload",
  label: "File Upload",
  icon: "Upload",
  category: "Form",
  defaultProps: {
    label: "Attachment",
    field: "",
    look: "field",
    placeholder: "Choose File",
    buttonText: "Choose File",
    buttonClass: "btn btn-sm btn-primary",
    accept: "",
    multiple: false,
    valueMode: "all",
    headerRow: "",
    sheet: "",
    maxSizeMB: "",
    help: "",
    hint: "Drop a file or click to browse",
  },
  defaultStyle: {},
  events: ["onChange"],
  propSchema: [
    p.text("label", "Label"),
    p.select("look", "Look", FILE_LOOKS, GROUPS.APPEARANCE, {
      hint: "Field matches the inputs and selects beside it; Button is the hand-coded pages' Choose File; Drop zone is the large box.",
    }),
    p.text("placeholder", "Placeholder", GROUPS.CONTENT, { when: (pr) => (pr.look || "field") === "field" }),
    p.text("buttonText", "Button text", GROUPS.CONTENT, { when: (pr) => pr.look === "button" }),
    p.text("buttonClass", "Button class", GROUPS.APPEARANCE, {
      placeholder: "btn btn-sm btn-primary",
      when: (pr) => pr.look === "button",
    }),
    p.text("field", "Field name", GROUPS.DATA),
    p.select("valueMode", "Store", FILE_VALUE_MODES, GROUPS.DATA, {
      hint: "“Everything” keeps { name, size, type, base64, rows, file } (a list of those when several are allowed): {{values.<field>.base64}} and {{values.<field>.name}} for a JSON upload, {{values.<field>.rows}} for the sheet's records, {{values.<field>}} on a Call API body key to send the file itself as form data. “Excel rows” keeps only the sheet's records, with the file's name in {{labels.<field>}}. The names are what a record of the attachment needs.",
    }),
    p.number("headerRow", "Heading row", GROUPS.DATA, {
      placeholder: "Find it",
      hint: "The sheet's row that holds the column names. Empty or 1 finds it — title rows above the headings, as an Export writes, are skipped. 2 or more forces that row.",
      when: (pr) => fileStoreMode(pr.valueMode) !== "names",
    }),
    p.text("sheet", "Sheet", GROUPS.DATA, {
      placeholder: "The first sheet",
      hint: "A sheet's name, or its number from 1.",
      when: (pr) => fileStoreMode(pr.valueMode) !== "names",
    }),
    p.text("accept", "Accepted types", GROUPS.BEHAVIOUR, {
      placeholder: ".pdf,.jpg,image/*",
      hint: "Checked when a file is picked as well — a file of another type is refused with a message.",
    }),
    p.number("maxSizeMB", "Max size (MB)", GROUPS.BEHAVIOUR, { hint: "Empty for no limit. A bigger file is refused with a message." }),
    p.bool("multiple", "Allow multiple"),
    p.text("hint", "Hint text", GROUPS.CONTENT, { when: (pr) => pr.look === "dropzone" }),
    p.text("help", "Helper text"),
    p.bool("disabled", "Disabled"),
    p.bool("readOnly", "Read only"),
  ],
  render: ({ node, props, style, rt, design, required }) => {
    const f = useFieldValue(node, props, rt);
    const inputRef = useRef(null);
    // A file being dragged over the Field look, so the box can say it will take it.
    const [over, setOver] = useState(false);
    const look = props.look || "field";
    // A single base64 file is stored as the record itself, not a list of one,
    // so a payload reads {{values.x.base64}} rather than {{values.x.0.base64}}.
    const picked = Array.isArray(f.value) ? f.value : f.value && typeof f.value === "object" ? [f.value] : [];
    // Every shape reads back the same way, so the chips below do not care
    // which mode the field is in.
    const store = fileStoreMode(props.valueMode);
    const sheetRows = store === "rows";
    // "Excel rows" holds the sheet's records, not the file; what was picked is
    // kept as the field's label — {{labels.<field>}} — and shown from there.
    const names = sheetRows
      ? [rt?.labels?.[f.field]].filter((x) => typeof x === "string" && x)
      : picked.map((x) => (typeof x === "string" ? x : x?.name)).filter(Boolean);
    const locked = !!props.disabled || !!props.readOnly;
    const take = async (all) => {
      const maxMB = Number(props.maxSizeMB) || 0;
      const list = all.filter((file) => {
        if (!fileAccepted(file, props.accept)) {
          toast.warn(`${file.name}: only ${props.accept} files are allowed`);
          return false;
        }
        if (maxMB > 0 && file.size > maxMB * 1024 * 1024) {
          toast.warn(`${file.name} is larger than ${maxMB} MB`);
          return false;
        }
        return true;
      });
      // Every file refused: the previous choice stands rather than being
      // emptied by a pick that did not take.
      if (all.length && !list.length) return;
      if (store === "all") {
        try {
          const read = await Promise.all(list.map((file) => readFileAll(file, props)));
          f.onChange(props.multiple ? read : read[0] || null);
        } catch (e) {
          toast.error("The file could not be read");
        }
        return;
      }
      if (sheetRows) {
        try {
          const read = await Promise.all(list.map((file) => readSheetRows(file, props)));
          const rows = read.flat();
          if (!rows.length) toast.warn(`No rows under ${Number(props.headerRow) >= 2 ? `heading row ${props.headerRow}` : "the headings"} in ${list.map((x) => x.name).join(", ")}`);
          // The label first, so an onChange chain that reads it gets this file.
          rt?.setLabel?.(f.field, list.map((x) => x.name).join(", "));
          f.onChange(rows);
        } catch (e) {
          toast.error(e?.message || "The sheet could not be read");
        }
        return;
      }
      f.onChange(list.map((x) => x.name));
    };
    // On the canvas a click selects the component; a file dialog there would
    // be in the way of designing.
    const open = () => {
      if (locked || design) return;
      inputRef.current?.click();
    };
    const clear = () => {
      if (sheetRows) rt?.setLabel?.(f.field, "");
      f.onChange([]);
    };
    // The sheet's size beside its name: the first thing anyone checks is that
    // every line made it.
    const rowCount = sheetRows
      ? Array.isArray(f.value) ? f.value.length : 0
      : store === "all" && picked.some((x) => Array.isArray(x?.rows) && x.rows.length)
        ? picked.reduce((n, x) => n + (Array.isArray(x?.rows) ? x.rows.length : 0), 0)
        : null;
    const shown = names.length && rowCount !== null
      ? `${names.join(", ")} · ${rowCount} row${rowCount === 1 ? "" : "s"}`
      : names.join(", ");

    // One hidden picker, whichever look opens it.
    const picker = (
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={props.accept || undefined}
        multiple={!!props.multiple}
        disabled={locked}
        onChange={(e) => {
          take(Array.from(e.target.files || []));
          // Cleared so picking the same file again — after a Reset form,
          // or a refused upload — still raises a change.
          e.target.value = "";
        }}
      />
    );

    if (look === "button") {
      return (
        <NativeShell style={style} className="dsb-upload-btn" error={f.error} help={props.help}>
          {picker}
          <div className="dsb-upload-btn-row">
            <button type="button" className={props.buttonClass || "btn btn-sm btn-primary"} disabled={locked} onClick={open}>
              <Icon name="Upload" size={13} /> {tr(props.buttonText || "Choose File")}
              {required ? <span className="dsb-req">*</span> : null}
            </button>
            {shown ? (
              <span className="dsb-upload-name" title={shown}>
                {shown}
              </span>
            ) : null}
            {shown && !locked ? (
              <button type="button" className="dsb-upload-x is-inline" title="Remove the file" aria-label="Remove the file" onClick={clear}>
                <Icon name="X" size={12} />
              </button>
            ) : null}
          </div>
        </NativeShell>
      );
    }

    if (look === "dropzone") {
      return (
        <FieldShell node={node} props={props} error={f.error} required={required}>
          {picker}
          <div
            role="button"
            tabIndex={locked ? -1 : 0}
            className={`dsb-upload ${locked ? "is-disabled" : ""}`}
            style={style}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }}
          >
            <Icon name="Upload" size={18} />
            <span>{shown || props.hint}</span>
          </div>
          {shown && !locked ? (
            <button type="button" className="dsb-upload-clear" onClick={clear}>
              <Icon name="X" size={11} /> Clear
            </button>
          ) : null}
        </FieldShell>
      );
    }

    // Field: one line, the height every control on the screen shares, the
    // label floating on its border. A file can be dropped on it as well.
    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const dropProps =
      locked || design
        ? {}
        : {
            onDragOver: (e) => {
              if (!hasFiles(e)) return;
              e.preventDefault();
              if (!over) setOver(true);
            },
            onDragLeave: (e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
            },
            onDrop: (e) => {
              if (!hasFiles(e)) return;
              e.preventDefault();
              setOver(false);
              const files = Array.from(e.dataTransfer.files || []);
              take(props.multiple ? files : files.slice(0, 1));
            },
          };
    const label = tr(props.label);
    return (
      <NativeShell style={style} className="dsb-upload-field" error={f.error} help={props.help}>
        {picker}
        <div
          role="button"
          tabIndex={locked ? -1 : 0}
          aria-disabled={locked || undefined}
          className={`dsb-upfield ${label ? "has-label" : ""} ${shown ? "has-file" : ""} ${over ? "is-over" : ""} ${locked ? "is-disabled" : ""} ${f.error ? "is-error" : ""}`
            .replace(/\s+/g, " ")
            .trim()}
          title={shown || undefined}
          onClick={open}
          onKeyDown={(e) => {
            // Only the box's own keys: Enter on the ✕ inside is the ✕'s.
            if (e.target !== e.currentTarget) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open();
            }
          }}
          {...dropProps}
        >
          {label ? (
            <span className="dsb-upfield-label">
              {label}
              {required ? <span className="dsb-req">*</span> : null}
            </span>
          ) : null}
          <Icon name="Upload" size={16} />
          <span className="dsb-upfield-text">{shown || tr(props.placeholder || "Choose File")}</span>
          {shown && !locked ? (
            <button
              type="button"
              className="dsb-upload-x is-inline"
              title="Remove the file"
              aria-label="Remove the file"
              onClick={(e) => {
                // The box itself opens the picker; this must not.
                e.stopPropagation();
                clear();
              }}
            >
              <Icon name="X" size={12} />
            </button>
          ) : null}
        </div>
      </NativeShell>
    );
  },
};

/**
 * Button — emits the app's own markup by default.
 *
 * The project writes buttons as `btn btn-<size> btn-<variant>` with a Font
 * Awesome glyph inside (see EmergencyPatientSearch.jsx), so that is what a
 * dropped button produces: "btn btn-sm btn-success px-3". Variant/size/extra
 * are inspector fields, "CSS class override" wins when you need something the
 * list doesn't cover, and "Builder skin" switches back to the builder's own
 * self-contained button for screens rendered outside the app shell.
 */
const ButtonDef = {
  type: "ButtonControl",
  label: "Button",
  icon: "RectangleHorizontal",
  category: "Form",
  defaultProps: {
    text: "Search",
    faIcon: "fa fa-search",
    iconPosition: "left",
    variant: APP_BTN.variant,
    size: APP_BTN.size,
    extraClass: APP_BTN.extraClass,
    classOverride: "",
    fullWidth: false,
    builderSkin: false,
    icon: "Search",
    respclass: "",
    /**
     * Pressing Enter in a filter runs this button.
     *
     * Every hand-coded list screen puts its filters in a <form>, so Enter
     * searches. A rendered screen is divs, so Enter did nothing at all — which
     * reads as the screen being broken to anyone who has used the page it
     * replaced.
     */
    submitOnEnter: false,
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.text("text", "Text"),
    // Drawn by both skins (AppButton takes it as lucideIcon); a Font Awesome
    // class below wins when both are set.
    p.icon("icon", "Icon", GROUPS.CONTENT, { hint: "Suggested from the button text: Save, Print, Search…" }),
    p.text("faIcon", "Icon class (Font Awesome)", GROUPS.CONTENT, { placeholder: "fa fa-search" }),
    p.select("iconPosition", "Icon position", [
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
    ]),
    p.select("variant", "Variant", BTN_VARIANT_OPTIONS),
    p.select("size", "Size", BTN_SIZE_OPTIONS),
    p.text("extraClass", "Extra classes", GROUPS.APPEARANCE, { placeholder: "px-3" }),
    p.text("classOverride", "CSS class override", GROUPS.APPEARANCE, { placeholder: "btn btn-sm btn-success px-3" }),
    p.bool("fullWidth", "Full width", GROUPS.LAYOUT),
    p.text("respclass", "Grid class", GROUPS.LAYOUT, { placeholder: "col-md-2" }),
    p.bool("builderSkin", "Use builder skin instead of app classes", GROUPS.APPEARANCE),
    p.bool("disabled", "Disabled"),
    p.bool("submitOnEnter", "Enter in a field runs this", GROUPS.BEHAVIOUR, {
      hint: "One per screen. Pressing Enter in any text box on the screen fires this button, the way Enter searches on a hand-coded page.",
    }),
  ],
  render: ({ node, props, style, rt }) => {
    const fire = () => rt?.runEvent(node, "onClick", {});
    // Announce this button as the screen's default while it is on screen. The
    // renderer listens once at the root rather than every input listening for
    // itself — a key handler per control is a lot of handlers to keep in step.
    useDefaultSubmit(node, props, rt);
    if (props.builderSkin) {
      return (
        <button
          type="button"
          className={`dsb-btn v-${props.variant || "primary"} s-${props.size || "md"} ${props.fullWidth ? "is-full" : ""}`}
          style={style}
          disabled={props.disabled}
          onClick={fire}
        >
          {props.icon && props.iconPosition !== "right" ? <Icon name={props.icon} size={14} /> : null}
          {props.text ? <span>{tr(props.text)}</span> : null}
          {props.icon && props.iconPosition === "right" ? <Icon name={props.icon} size={14} /> : null}
        </button>
      );
    }
    // App markup. `appClass` is only read so buttons saved before this change
    // keep whatever one-off class they were given.
    const cls = btnClass({
      variant: props.variant,
      size: props.size,
      extraClass: props.extraClass,
      block: props.fullWidth,
      override: props.classOverride || props.appClass,
    });
    return (
      <div className={`dsb-native dsb-native-btn ${typographyClass(style)} ${props.respclass || ""}`.replace(/\s+/g, " ").trim()} style={style}>
        <AppButton
          text={tr(props.text)}
          faIcon={props.faIcon}
          lucideIcon={props.faIcon ? "" : props.icon}
          iconPosition={props.iconPosition}
          className={cls}
          disabled={props.disabled}
          onClick={fire}
        />
      </div>
    );
  },
};

/* -------------------------------------------------------- search & pick */

/**
 * Type three letters, get a grid, pick a record.
 *
 * This renders the app's own <SearchItemEassyUI> — the same control every
 * patient screen searches from (pharmacy/PatientIssue is the reference usage).
 * The debounce, the arrow keys, Enter-to-pick, the auto-pick on a single match
 * and the drop-down grid are therefore the ones the app already maintains, not
 * a reimplementation that drifts from them.
 *
 * What the builder adds is the two things the page hardcodes:
 *
 *   BindListAPI  the page passes a function (`getPatientDetail`); here the
 *                endpoint is picked from the catalog, and the typed text is
 *                sent as the parameter named in "Search parameter" — or as
 *                {{search}}, which any parameter may read.
 *   Head         the page passes a constant (BIND_TABLE_OLDPATIENTSEARCH_…);
 *                here the columns are the builder's own, so Sync fills them
 *                from a real response and the headers stay editable.
 *
 * The picked record reaches the event chain as `{{row.Field}}` — so a screen
 * fills its form, opens a panel or loads a second endpoint from the choice
 * without any code, which is what `onClick={handleCloseSearchPatient}` does on
 * the reference page.
 */
function SearchLookup({ node, props, style, rt, required }) {
  const f = useFieldValue(node, props, rt);
  const design = !!rt?.design;
  const cfg = props.apiConfig;
  const ready = isApiConfigReady(cfg);

  // The builder's columns in the shape EasyUI takes. Same grid, same headers,
  // and `visible: false` hides one without deleting what Sync found.
  const head = useMemo(
    () =>
      (props.columns || [])
        .filter((c) => c && c.key && c.visible !== false)
        // The width the column designer set travels too: the grid no longer
        // gets a fixed 1000px to spread across, so a column with no width of
        // its own is whatever is left over.
        .map((c) => ({ field: c.key, title: tr(c.header) || c.key, width: c.width || undefined })),
    [props.columns],
  );

  // What this box last wrote itself — typed text or a picked row's display.
  // Any other value arrived from outside (a Set field value action), and with
  // "Search when set from elsewhere" that runs the search as if typed, so the
  // single-match auto-pick fires too. Its own writes must not: a pick writes
  // the display name back, which would search again and pick again.
  const ownValue = useRef(f.value ?? "");
  const fromOutside = !design && !!props.searchOnSet && String(f.value ?? "") !== String(ownValue.current ?? "");

  const bindDetails = useMemo(
    () => ({
      label: tr(props.label) || "Search",
      id: domId(node),
      value: f.value ?? "",
      className: required ? "required-fields" : "",
      isCallhandleChange: fromOutside,
    }),
    [props.label, node, f.value, required, fromOutside],
  );

  /**
   * What the control calls on every (debounced) keystroke.
   *
   * `meta: { silent: true }` for the reason the hand-written services pass it
   * on these endpoints: a type-ahead fires while somebody is still typing, and
   * the full-screen loader flashing over the page on every third character is
   * not a loading state, it is a fault.
   */
  const bindListApi = useCallback(
    async (text) => {
      // The canvas never calls. Whatever Sync last returned stands in, so the
      // columns can be judged against real records.
      if (design) return { data: (props.previewRows || []).slice(0, 8) };
      // The typing itself is an event. It runs off the same debounce as the
      // search, so a chain hung on onChange — call a second endpoint, fill a
      // grid, set a field — fires once the typing settles and reads the text
      // as {{search}}. It runs whether or not this control has its own
      // endpoint, so a screen can drive the whole lookup from the chain.
      rt?.runEvent(node, "onChange", { search: text });
      if (!ready || !rt?.client) return { data: [] };
      const scope = rt.buildScope ? rt.buildScope({ search: text }) : { search: text };
      // The endpoint as configured: `props.apiConfig` is resolved against the
      // previous render's values, a keystroke behind anything it reads from
      // the form. Resolved here it reads the form as it is now.
      const rawCfg = isApiConfigReady(node?.props?.apiConfig) ? node.props.apiConfig : cfg;
      // A parameter named here is filled with the typed text, so the common
      // case needs no template at all. Where it goes follows the verb, the
      // same rule buildApiRequest uses for everything else.
      const key = props.searchParam;
      const method = String(rawCfg.method || "GET").toUpperCase();
      const overrides = !key
        ? {}
        : method === "GET" || method === "DELETE"
          ? { params: { [key]: text } }
          : { body: { [key]: text } };
      try {
        const { url, config } = buildApiRequest(rawCfg, scope, overrides);
        const raw = await rt.client(url, { ...config, meta: { silent: true } });
        return { data: pluckRows(raw, cfg.responsePath) };
      } catch (e) {
        // The control shows "no matches" rather than throwing under the cursor.
        return { data: [] };
      }
    },
    [design, ready, rt, node, cfg, props.searchParam, props.previewRows],
  );

  // Every keystroke lands in the form under this control's field, so
  // {{values.<field>}} is the typed text even before a row is picked — that is
  // what another control's endpoint parameter reads when the search drives it.
  const onText = useCallback(
    (text) => {
      if (design) return;
      ownValue.current = text;
      f.onChange(text);
    },
    [design, f],
  );

  /**
   * A record was chosen.
   *
   * The box keeps something readable (the field named in "Display field", else
   * the first column), the form keeps it under this control's own field name,
   * and the whole record goes to the chain — where `{{row.PatientID}}` and the
   * rest of it are reachable.
   */
  const onPick = (row) => {
    if (!row || design) return;
    const display = props.displayField ? getPath(row, props.displayField) : row[head[0]?.field];
    const shown = display === undefined || display === null ? "" : String(display);
    ownValue.current = shown;
    f.onChange(shown);
    rt?.runEvent(node, "onSelect", { row });
  };

  return (
    <NativeShell style={style} className={props.respclass || ""} error={f.error} help={props.help}>
      <SearchItemEassyUI
        onClick={onPick}
        BindListAPI={bindListApi}
        BindDetails={bindDetails}
        Head={head}
        isSelectFirst={props.isSelectFirst !== false}
        isDisabled={!!props.disabled}
        onTextChange={onText}
        minChars={Number(props.minChars) > 0 ? Number(props.minChars) : 3}
        /* The result grid leaves the layout and floats against the field.
           Inside the builder it has to: the canvas frame clips
           (overflow:hidden), so does a Card/Panel, and the control is usually
           in one — the grid was simply not visible. It is also wider than any
           form cell, which the floating version handles and the in-flow one
           cannot. */
        floating
      />
      {design && !ready ? (
        <p className="dsbi-note">Pick the search endpoint in Props, then press Sync to fill the columns.</p>
      ) : null}
    </NativeShell>
  );
}

const SearchLookupDef = {
  type: "SearchLookup",
  label: "Search & Pick",
  icon: "SearchCheck",
  category: "Form",
  bindable: true,
  defaultProps: {
    label: "UHID / Patient Name / Mobile No",
    field: "",
    help: "",
    respclass: "",
    apiConfig: createApiConfig(),
    searchParam: "",
    displayField: "",
    columns: [],
    previewRows: [],
    isSelectFirst: true,
    searchOnSet: false,
    minChars: 3,
    disabled: false,
  },
  defaultStyle: {},
  events: ["onSelect", "onChange"],
  propSchema: [
    p.text("label", "Label"),
    p.text("field", "Field name (data key)", GROUPS.DATA),
    p.text("help", "Helper text"),
    p.text("respclass", "Grid class (col-md-4 …)", GROUPS.LAYOUT),
    {
      key: "apiConfig",
      label: "Search endpoint",
      type: "apiEndpoint",
      group: GROUPS.DATA,
      mode: "rows",
    },
    p.text("searchParam", "Search parameter", GROUPS.DATA, {
      placeholder: "name / SearchText — the typed text goes here",
    }),
    p.columns("columns", "Result columns", GROUPS.DATA),
    p.dataKey("displayField", "Show in the box after picking", GROUPS.DATA, {
      placeholder: "PatientName — defaults to the first column",
    }),
    p.bool("isSelectFirst", "Pick automatically on a single match"),
    p.bool("searchOnSet", "Search when set from elsewhere", GROUPS.BEHAVIOUR, {
      hint: "A Set field value action (a grid's Select, say) searches as if it were typed — with the option above, a single match is picked and onSelect runs.",
    }),
    p.number("minChars", "Search after this many characters", GROUPS.BEHAVIOUR, { min: 1 }),
    p.bool("disabled", "Disabled"),
  ],
  render: ({ node, props, style, rt, required }) => (
    <SearchLookup node={node} props={props} style={style} rt={rt} required={required} />
  ),
};

/* -------------------------------------------------------- auto complete */

/**
 * Type, get a list of suggestions, pick one.
 *
 * PrimeReact's <AutoComplete> — the control the hand-coded pages search tests,
 * items and medicines with (frontOffice/OPD/LabPackageInclude is the reference
 * usage). Lighter than Search & Pick: a one-line list under the box rather
 * than a grid, which is what "Type to search…" over an item master wants.
 *
 * Where the page hardcodes them, the builder sets:
 *
 *   completeMethod  the page calls its own service with `prefix: query`; here
 *                   the endpoint is picked from the catalog and the typed text
 *                   goes into the parameter named in "Search parameter" — or
 *                   anywhere as {{search}}. A fixed list (Options) is filtered
 *                   in the browser instead, with no call at all.
 *   field="label"   "Label field" — autoCompleteItemName on that page.
 *   onSelect        the control's onSelect event, with the whole record as
 *                   {{row.Field}}, so "add the picked test to the grid" is an
 *                   Add row action, not code.
 *   setValue("")    "Clear the box after picking", for a box that adds things.
 *
 * The form keeps the picked record's value field (or its label) under the
 * control's field name; with "Pick more than one" it keeps a list of them and
 * the box shows the picks as chips.
 */
function AutoCompleteControl({ node, props, style, rt, required }) {
  const f = useFieldValue(node, props, rt);
  const design = !!rt?.design;
  const multiple = !!props.multiple;
  const fromList = props.source === "list";
  const cfg = props.apiConfig;
  const ready = !fromList && isApiConfigReady(cfg);
  // A fixed list is { value, label } whatever the endpoint fields say.
  const labelKey = fromList ? "label" : props.optionLabelField || "label";
  const valueKey = fromList ? "value" : props.optionValueField || "";
  const subKey = fromList ? "" : props.subLabelField || "";
  const staticOptions = useOptions({ ...props, optionsSource: "static" }, rt);

  // What the box holds: the typed text, or the picked record(s). It is local —
  // the form holds the value, which for a record is not what the box shows.
  const [box, setBox] = useState(() => (multiple ? [] : f.value === undefined || f.value === null ? "" : String(f.value)));
  const [suggestions, setSuggestions] = useState([]);
  const seq = useRef(0);

  // The form cleared by something else (Reset, a Set value action) empties
  // the box too; a value written from outside shows as text.
  const formValue = f.value;
  useEffect(() => {
    if (multiple) {
      if (!Array.isArray(formValue) || !formValue.length) setBox([]);
      return;
    }
    setBox((cur) => {
      if (formValue === undefined || formValue === null || formValue === "") return "";
      if (cur && typeof cur === "object" && pickValue(cur) === formValue) return cur;
      if (typeof cur === "string" && cur === String(formValue)) return cur;
      return String(formValue);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValue, multiple]);

  const labelOf = (rec) => {
    if (rec === null || rec === undefined) return "";
    if (typeof rec !== "object") return String(rec);
    const v = getPath(rec, labelKey);
    return v === undefined || v === null ? "" : String(v);
  };
  function pickValue(rec) {
    if (!rec || typeof rec !== "object") return rec ?? "";
    if (valueKey) return getPath(rec, valueKey) ?? "";
    // An endpoint row with no value field keeps what it shows.
    return labelOf(rec);
  }

  /** Every settled keystroke: the endpoint, or the list filtered here. */
  const complete = async (e) => {
    const text = String(e?.query ?? "");
    const mine = ++seq.current;
    if (design) {
      const rows = fromList ? staticOptions : props.previewOptions || [];
      setSuggestions(rows.filter((r) => labelOf(r).toLowerCase().includes(text.trim().toLowerCase())).slice(0, 10));
      return;
    }
    // The typing is an event, as on Search & Pick: a chain on onChange fires
    // once the typing settles and reads the text as {{search}}.
    rt?.runEvent(node, "onChange", { search: text, value: text, field: f.field });
    if (fromList) {
      const q = text.trim().toLowerCase();
      const hit = staticOptions.filter((o) => labelOf(o).toLowerCase().includes(q));
      setSuggestions(limitTo(hit));
      return;
    }
    if (!ready || !rt?.client) {
      setSuggestions([]);
      return;
    }
    const base = rt.buildScope ? rt.buildScope({ search: text.trim() }) : { search: text.trim() };
    // The box's own field reads as what was just typed. The form value is
    // written on change and lands a render later — read from there, a
    // parameter bound to {{values.<this field>}} sent "de" for "dev".
    const scope = f.field ? { ...base, values: { ...(base.values || {}), [f.field]: text } } : base;
    // The endpoint as configured, not as rendered: `props.apiConfig` arrives
    // already resolved against the PREVIOUS render's values, one keystroke
    // behind. Resolved here, against the scope above, it is this keystroke's.
    const rawCfg = isApiConfigReady(node?.props?.apiConfig) ? node.props.apiConfig : cfg;
    const key = props.searchParam;
    const method = String(rawCfg.method || "GET").toUpperCase();
    const overrides = !key ? {} : method === "GET" || method === "DELETE" ? { params: { [key]: text.trim() } } : { body: { [key]: text.trim() } };
    try {
      const { url, config } = buildApiRequest(rawCfg, scope, overrides);
      // Silent, as the hand-written type-aheads are: the box has its own
      // spinner, and a full-screen loader on every letter is a fault.
      const raw = await rt.client(url, { ...config, meta: { silent: true } });
      if (mine !== seq.current) return;
      setSuggestions(limitTo(pluckRows(raw, cfg.responsePath)));
    } catch (err) {
      if (mine === seq.current) setSuggestions([]);
    }
  };
  const limitTo = (rows) => {
    const n = Number(props.maxResults);
    const list = Array.isArray(rows) ? rows : [];
    return n > 0 ? list.slice(0, n) : list;
  };

  const onPick = (e) => {
    const rec = e?.value;
    if (design || rec === undefined) return;
    // The builder's {{row}} keys come from here once Preview has picked one.
    rememberEventRecord(node?.id, rec);
    const value = pickValue(rec);
    if (multiple) {
      const next = [...(Array.isArray(box) ? box : []), rec];
      const values = next.map(pickValue);
      rt?.setValue(f.field, values);
      rt?.runEvent(node, "onSelect", { row: rec, value, label: labelOf(rec), values, field: f.field });
      if (props.clearOnSelect) {
        setBox([]);
        rt?.setValue(f.field, []);
      }
      return;
    }
    rt?.setValue(f.field, props.clearOnSelect ? "" : value);
    rt?.runEvent(node, "onSelect", { row: rec, value, label: labelOf(rec), field: f.field });
    setBox(props.clearOnSelect ? "" : rec);
  };

  const onChange = (e) => {
    if (design) return;
    const next = e.value;
    setBox(next);
    if (multiple) {
      // A chip removed.
      const list = Array.isArray(next) ? next : [];
      rt?.setValue(f.field, list.map(pickValue));
      if (!list.length) rt?.runEvent(node, "onClear", { field: f.field });
      return;
    }
    // Typing: the form holds the text until a record is picked, unless a pick
    // is required — then a half-typed word is not a value.
    if (typeof next === "string") {
      rt?.setValue(f.field, props.forceSelection ? "" : next);
      if (next === "" && formValue !== "" && formValue !== undefined) rt?.runEvent(node, "onClear", { field: f.field });
    }
  };

  const itemTemplate = (rec) => {
    const sub = subKey && rec && typeof rec === "object" ? getPath(rec, subKey) : "";
    return (
      <div className="dsb-ac-item">
        <span className="dsb-ac-item-lbl">{labelOf(rec)}</span>
        {sub !== "" && sub !== undefined && sub !== null ? <span className="dsb-ac-item-sub">{String(sub)}</span> : null}
      </div>
    );
  };

  const label = tr(props.label);
  const filled = multiple ? Array.isArray(box) && box.length > 0 : box !== "" && box !== null && box !== undefined;
  return (
    <NativeShell
      style={style}
      className={`dsb-ac ${props.respclass || ""}`}
      error={f.error}
      help={props.help}
      onBlur={f.onBlur}
      onFocus={f.onFocus}
    >
      <div className={`dsb-ac-wrap ${filled ? "is-filled" : ""} ${required ? "is-required" : ""}`.trim()}>
        <AutoComplete
          inputId={domId(node)}
          value={box}
          suggestions={suggestions}
          completeMethod={complete}
          onChange={onChange}
          onSelect={onPick}
          onUnselect={() => {}}
          field={labelKey}
          itemTemplate={subKey ? itemTemplate : undefined}
          multiple={multiple}
          dropdown={!!props.dropdown}
          forceSelection={!!props.forceSelection}
          minLength={Number(props.minChars) > 0 ? Number(props.minChars) : 1}
          delay={Number(props.delay) >= 0 && props.delay !== "" ? Number(props.delay) : 300}
          autoHighlight={props.autoHighlight !== false}
          disabled={!!props.disabled}
          placeholder={tr(props.placeholder) || (label ? "" : tr("Type to search..."))}
          emptyMessage={tr(props.emptyMessage || "No results found")}
          showEmptyMessage
          className={`w-100 ${required ? "required-fields" : ""}`.trim()}
          inputClassName="form-control"
          panelClassName="dsb-ac-panel"
          appendTo={typeof document !== "undefined" ? document.body : undefined}
        />
        {label ? (
          <label htmlFor={domId(node)} className="lable searchtest dsb-ac-label">
            {label}
          </label>
        ) : null}
      </div>
      {design && !fromList && !ready ? (
        <p className="dsbi-note">Pick the search endpoint in Props, set the Search parameter, then press Sync.</p>
      ) : null}
    </NativeShell>
  );
}

const AutoCompleteDef = {
  type: "AutoCompleteInput",
  label: "Auto Complete",
  icon: "Search",
  category: "Form",
  bindable: true,
  defaultProps: {
    label: "Search Test",
    field: "",
    placeholder: "Type to search...",
    help: "",
    respclass: "",
    source: "endpoint",
    apiConfig: createApiConfig(),
    searchParam: "",
    optionLabelField: "",
    optionValueField: "",
    subLabelField: "",
    previewOptions: [],
    options: [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
    ],
    minChars: 1,
    delay: 300,
    maxResults: "",
    multiple: false,
    dropdown: false,
    forceSelection: false,
    clearOnSelect: false,
    autoHighlight: true,
    emptyMessage: "No results found",
    disabled: false,
  },
  defaultStyle: {},
  events: ["onSelect", "onChange", "onClear", "onBlur", "onFocus"],
  propSchema: [
    p.text("label", "Label"),
    p.text("field", "Field name (data key)", GROUPS.DATA),
    p.text("placeholder", "Placeholder", GROUPS.CONTENT),
    p.text("help", "Helper text"),
    p.text("respclass", "Grid class (col-md-4 …)", GROUPS.LAYOUT),
    p.select(
      "source",
      "Suggestions from",
      [
        { value: "endpoint", label: "An endpoint — searched as you type" },
        { value: "list", label: "A fixed list — filtered here" },
      ],
      GROUPS.DATA,
      { allowEmpty: false },
    ),
    {
      key: "apiConfig",
      label: "Search endpoint",
      type: "apiEndpoint",
      group: GROUPS.DATA,
      mode: "options",
      when: (pr) => pr.source !== "list",
    },
    p.text("searchParam", "Search parameter", GROUPS.DATA, {
      when: (pr) => pr.source !== "list",
      placeholder: "prefix / SearchText — the typed text goes here",
      hint: "Or put {{search}} in any parameter of the endpoint.",
    }),
    p.options("options", "Options", GROUPS.DATA, { when: (pr) => pr.source === "list" }),
    p.dataKey("optionLabelField", "Label field", GROUPS.DATA, {
      when: (pr) => pr.source !== "list",
      placeholder: "autoCompleteItemName",
      hint: "What each suggestion reads, and what the box shows once picked.",
    }),
    p.dataKey("optionValueField", "Value field", GROUPS.DATA, {
      when: (pr) => pr.source !== "list",
      placeholder: "item_ID — empty keeps the label",
      hint: "What the form stores under the field name. The whole record still reaches onSelect as {{row.Field}}.",
    }),
    p.dataKey("subLabelField", "Second line", GROUPS.DATA, {
      when: (pr) => pr.source !== "list",
      placeholder: "Rate / Category",
      hint: "A smaller line under each suggestion.",
    }),
    p.number("minChars", "Search after this many characters", GROUPS.BEHAVIOUR, { min: 0 }),
    p.number("delay", "Wait after typing (ms)", GROUPS.BEHAVIOUR, { min: 0 }),
    p.number("maxResults", "Most suggestions shown", GROUPS.BEHAVIOUR, { min: 0, placeholder: "All" }),
    p.bool("multiple", "Pick more than one (chips)"),
    p.bool("dropdown", "Dropdown button"),
    p.bool("forceSelection", "Only a picked value counts", GROUPS.BEHAVIOUR, {
      hint: "Typed text that was not picked from the list is cleared.",
    }),
    p.bool("clearOnSelect", "Clear the box after picking", GROUPS.BEHAVIOUR, {
      hint: "For a box that adds things — pick a test, it goes to the grid (onSelect), the box is ready for the next.",
    }),
    p.bool("autoHighlight", "Highlight the first suggestion"),
    p.text("emptyMessage", "No-results text", GROUPS.CONTENT),
    p.bool("disabled", "Disabled"),
  ],
  render: ({ node, props, style, rt, required }) => (
    <AutoCompleteControl node={node} props={props} style={style} rt={rt} required={required} />
  ),
};

/* -------------------------------------------------------------------------- */
/*  formula — a box the screen works out for itself                            */
/* -------------------------------------------------------------------------- */

/**
 * A read-only box whose value is worked out from the other fields.
 *
 * A payment panel is mostly arithmetic: net is gross less discount, payable is
 * net less what the scheme covers, change is tendered less payable, and every
 * one of them has to move the moment an amount or a discount does. None of
 * that could be said in the builder — a Label + Value could SHOW a sum, but it
 * is not part of the form, so a payload could not send it and a rule could not
 * read it. This is that sum, stored under a field name like any other control.
 *
 * The expression arrives already worked out: every string prop is resolved
 * against the live scope before a component renders, so what lands here is the
 * number — and it is recomputed by the same render that changed its inputs.
 */
function FormulaValue({ node, props, style, rt }) {
  const field = props.field || node.id;
  const raw = props.expression;
  const num = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/,/g, "").trim());
  const places = props.decimals === "" || props.decimals === null || props.decimals === undefined ? null : Number(props.decimals);
  const ok = Number.isFinite(num) && String(raw ?? "").trim() !== "";

  // What is stored is the number, rounded the way it is shown — a payload that
  // sends 36.5 while the screen says 36.50 is the sort of difference that only
  // turns up in a reconciliation.
  const value = ok ? (places === null ? num : Number(num.toFixed(places))) : "";
  const shown = ok ? (places === null ? String(num) : num.toFixed(places)) : "";
  const text = shown === "" ? tr(props.emptyText || "") : `${props.prefix || ""}${shown}${props.suffix || ""}`;

  const store = props.store !== false;
  useEffect(() => {
    if (!rt || rt.design || !store) return;
    // Guarded rather than written every render: setValue re-renders the
    // screen, and a write that never settles is a loop.
    if (rt.values?.[field] === value) return;
    rt.setValue(field, value);
  }, [rt, field, value, store]);

  return (
    <NativeShell style={style} help={props.help}>
      <Input
        type="text"
        id={domId(node)}
        name={field}
        lable={tr(props.label)}
        value={text}
        readOnly
        disabled={props.disabled}
        display={props.align || "right"}
        respclass={props.respclass || ""}
        className="form-control dsb-formula"
        onChange={() => {}}
      />
    </NativeShell>
  );
}

const FormulaDef = {
  type: "FormulaField",
  label: "Formula / Computed",
  icon: "Calculator",
  category: "Form",
  defaultProps: {
    label: "Net amount",
    field: "",
    expression: "",
    decimals: 2,
    prefix: "",
    suffix: "",
    emptyText: "",
    align: "right",
    respclass: "",
    help: "",
    store: true,
    disabled: false,
  },
  defaultStyle: {},
  events: [],
  propSchema: [
    p.text("label", "Label"),
    p.text("field", "Field name (data key)", GROUPS.DATA, {
      hint: "What it is stored as, so a payload can send it and another formula can read it as {{values.<name>}}.",
    }),
    p.template("expression", "Formula", GROUPS.DATA, {
      multiline: true,
      placeholder: "{{values.gross - values.discount}}",
      hint: "Arithmetic over anything on the screen: + - * / %, brackets, round(), min(), max(). A total over a grid is {{grid.n_bills.checked | sum:PendingAmount}}.",
    }),
    p.number("decimals", "Decimal places", GROUPS.APPEARANCE, {
      hint: "Empty leaves the number as it comes out. What is stored is rounded to match what is shown.",
    }),
    p.text("prefix", "Prefix", GROUPS.APPEARANCE),
    p.text("suffix", "Suffix", GROUPS.APPEARANCE),
    p.text("emptyText", "When it works out to nothing", GROUPS.APPEARANCE, { placeholder: "—" }),
    p.select("align", "Text align", [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ]),
    p.text("respclass", "Grid class (col-md-3 …)", GROUPS.LAYOUT),
    p.text("help", "Helper text"),
    p.bool("store", "Keep it in the form", GROUPS.BEHAVIOUR, {
      hint: "On (the default) stores it under the field name above. Off makes it a read-out and nothing more.",
    }),
  ],
  render: ({ node, props, style, rt }) => <FormulaValue node={node} props={props} style={style} rt={rt} />,
};

/* -------------------------------------------------------------------------- */
/*  read-only labelled value — project <LabeledInput />                        */
/* -------------------------------------------------------------------------- */

/**
 * The app's own read-out field: a small caption over a value, cut short past
 * `substringEnd` with the whole of it on a PrimeReact tooltip, red when it is a
 * note, masked when the patient is a VIP. The component reads DesignContext
 * itself, so the classic markup and the modern aurora-frozen-field both come
 * for free and keep following whatever that component does next.
 *
 * It shows a value rather than collecting one, so a field name is not required
 * — but a screen usually still has to SEND what it is showing, and the way to
 * do that so far was a hidden input parked next to it. A `field` here stores
 * the text under that name, exactly as the formula field stores its result.
 */
function LabeledValue({ node, props, style, rt }) {
  const raw = props.value;
  const text = raw === 0 ? "0" : raw === null || raw === undefined ? "" : String(raw);
  const field = props.field || "";

  useEffect(() => {
    if (!rt || rt.design || !field) return;
    // Guarded rather than written every render: setValue re-renders the screen,
    // and a write that never settles is a loop.
    if (rt.values?.[field] === text) return;
    rt.setValue(field, text);
  }, [rt, field, text]);

  /**
   * The component's own `style` prop dresses the VALUE (the text in the classic
   * skin, the block in the modern one) — that is what the pages passing
   * `{ textAlign: "right", color: "red" }` are after. The inspector's Style tab
   * stays on the wrapper, the way it does for every other control here, so the
   * two never fight over width and margin.
   */
  const valueStyle = {};
  if (props.align) valueStyle.textAlign = props.align;
  if (props.valueColor) valueStyle.color = props.valueColor;

  const clickable = !!props.isClickable;
  return (
    <NativeShell
      style={style}
      className="dsb-labeled"
      help={props.help}
      onClick={clickable && !rt?.design ? () => rt?.runEvent(node, "onClick", { value: text }) : undefined}
    >
      <LabeledInput
        // The app's component memoises its markup on the VALUE alone, so a
        // label (or note / VIP / length) changed while the value stays put was
        // never redrawn — on the canvas, where every value is empty, each one
        // kept whatever label it was first given. Keyed on the rest, it is.
        key={`${props.label || ""}|${props.isNote ? 1 : 0}|${props.isClickable ? 1 : 0}|${props.patientType || ""}|${props.substringEnd || ""}|${props.align || ""}|${props.valueColor || ""}`}
        label={tr(props.label || "")}
        value={text}
        className={props.respclass || ""}
        style={valueStyle}
        isClickable={clickable}
        isNote={!!props.isNote}
        substringEnd={Number(props.substringEnd) > 0 ? Number(props.substringEnd) : 27}
        PatientType={props.patientType || ""}
      />
    </NativeShell>
  );
}

const LabeledValueDef = {
  type: "LabeledInput",
  label: "Labeled Value (read-only)",
  icon: "LetterText",
  category: "Form",
  defaultProps: {
    label: "Label",
    value: "",
    field: "",
    substringEnd: 27,
    isClickable: false,
    isNote: false,
    patientType: "",
    align: "",
    valueColor: "",
    respclass: "",
    help: "",
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.text("label", "Label"),
    p.template("value", "Value", GROUPS.DATA, {
      placeholder: "{{row.PatientName}}",
      hint: "Anything on the screen: {{row.Field}} from the record it stands on, {{values.<field>}} from another control.",
    }),
    p.text("field", "Field name (data key)", GROUPS.DATA, {
      hint: "Optional. Fill it in and what is shown is also stored under that name, so a payload can send it without a hidden input.",
    }),
    p.number("substringEnd", "Shorten after (characters)", GROUPS.APPEARANCE, {
      hint: "Longer text is cut with an ellipsis and the whole of it shows on hover. 27 by default.",
    }),
    p.select(
      "align",
      "Text align",
      [
        { value: "", label: "Default" },
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ],
      GROUPS.APPEARANCE,
    ),
    p.color("valueColor", "Value colour", GROUPS.APPEARANCE),
    p.bool("isNote", "Show it as a note", GROUPS.APPEARANCE, { hint: "Red, the way a remark is shown elsewhere in the app." }),
    p.template("patientType", "Patient type", GROUPS.DATA, {
      placeholder: "{{row.PatientType}}",
      hint: 'Masked when this reads "VIP", the same as everywhere else in the app.',
    }),
    p.bool("isClickable", "Clickable", GROUPS.BEHAVIOUR, {
      hint: "Draws it as a link and lets the On click chain run.",
    }),
    p.text("respclass", "Grid class (col-md-3 …)", GROUPS.LAYOUT),
    p.text("help", "Helper text"),
  ],
  render: ({ node, props, style, rt }) => <LabeledValue node={node} props={props} style={style} rt={rt} />,
};

export default [
  TextInputDef,
  NumberInputDef,
  FormulaDef,
  LabeledValueDef,
  TextareaDef,
  RichTextDef,
  PasswordDef,
  SelectDef,
  SelectAddDef,
  DatePickerDef,
  DateRangeDef,
  TimePickerDef,
  CheckboxDef,
  RadioGroupDef,
  SwitchDef,
  FileUploadDef,
  SearchLookupDef,
  AutoCompleteDef,
  ButtonDef,
];
