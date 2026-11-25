/**
 * Inspector field editors.
 *
 * `PropField` maps a registry propSchema entry to the right editor, so adding a
 * new prop to a component needs no inspector code at all. Text-ish editors keep
 * a local value and push to the store on a short debounce, which is what keeps
 * typing from stuttering the canvas.
 */
import React, { Fragment, createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon, { ICON_CATEGORIES, ICON_KEYWORDS, ICON_NAMES, searchIcons } from "../registry/icons";
import Tap from "./Tap";
import { iconContext, suggestIcons } from "../utils/iconSuggest";
import {
  BTN_SIZE_OPTIONS,
  BTN_VARIANT_OPTIONS,
  filterOptionRows,
  resolveOptionFields,
  rowsToOptions,
  VITAL_OPS,
  VITAL_RANGE_OPS,
} from "../registry/shared";
import { fieldsOf, getDef } from "../registry";
import { mergeColumns, shouldAutoBindColumns } from "../utils/apiConfig";
import { DEFAULT_SWATCHES } from "../theme/tokens";
import { COLOR_TARGETS } from "../utils/colorRules";
import { ACTION_TYPES, createNode, exportFormat, exportVia, OPERATORS, OVERLAY_TARGETS, overlayKind } from "../schema/schema";
import {
  APP_MODAL_OPTIONS,
  APP_MODALS,
  appModal as appModalSpec,
  COMPONENT_PATHS,
  CUSTOM_MODAL_PREFIX,
  customModalOptions,
  FILE_MODAL_OPTIONS,
  FRAME_MODAL_PREFIX,
  resolveComponentPath,
} from "../utils/appModals";
import { nodeSourceId } from "../utils/apiConfig";
import { humanizeKey, optionColumnsOf, rowFieldsOf, sampleRowOf } from "../utils/rowContext";
import { testBinding } from "../utils/validation";
import { hasTemplate, isJsValue, jsCodeOf, toJsValue } from "../utils/expressions";
import { liveScope, peekValue, scopeEntries, suggestTokens } from "../utils/livescope";
import { localEntries } from "../utils/localStore";
import copyText from "@app/components/apibuilder/common/clipboard";
import { modalFieldsOf, propNamesOf, standInProps } from "../utils/componentProps";
import { CARD_TONES, makeSampleRows, STAT_VALUE_FIELD, TREND_DIRS } from "../registry/dataDisplay";
// Cyclic on purpose: ApiPicker reuses Row/SelectBox/Toggle/DebouncedInput from
// here. Every one of those is a hoisted function declaration, so the binding is
// initialised before either module runs a component.
import ApiPicker from "./ApiPicker";
import { useBuilder } from "../store/builderStore";
import { flatten } from "../utils/tree";
import { controlCaption, fieldCaptions } from "../utils/fieldCaption";

/* ------------------------------------------------------------ primitives */

export function Row({ label, hint, children, stack }) {
  return (
    <div className={`dsbi-row ${stack ? "is-stack" : ""}`}>
      {label ? <label className="dsbi-label">{label}</label> : null}
      <div className="dsbi-ctl">{children}</div>
      {hint ? <div className="dsbi-hint">{hint}</div> : null}
    </div>
  );
}

/**
 * A collapsible group of the inspector.
 *
 * Opens and closes by sliding (a grid row going 0fr <-> 1fr), not by popping.
 * The body mounts the first time the section is opened and then stays, so the
 * slide has something to measure — a section that starts closed still costs
 * nothing until somebody looks inside it.
 */
export function Section({ title, icon = "", right, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const [seen, setSeen] = useState(defaultOpen);
  // Clipped only while it moves: open and at rest, a picker inside may need
  // to reach past the body's edge.
  const [moving, setMoving] = useState(false);
  const toggle = () => {
    setSeen(true);
    setMoving(true);
    setOpen((o) => !o);
  };
  return (
    <div className={`dsbi-sec ${open ? "is-open" : ""} ${moving ? "is-moving" : ""}`.trim()}>
      <Tap className="dsbi-sec-head" onClick={toggle} aria-expanded={open}>
        <span className="dsbi-sec-chev">
          <Icon name="ChevronDown" size={13} />
        </span>
        {icon ? <Icon name={icon} size={13} className="dsbi-sec-ic" /> : null}
        <span>{title}</span>
        {right ? <span className="dsbi-sec-right">{right}</span> : null}
      </Tap>
      <div
        className="dsbi-sec-wrap"
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget) setMoving(false);
        }}
      >
        <div className="dsbi-sec-clip" inert={open ? undefined : "true"}>
          {seen ? <div className="dsbi-sec-body">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Text input that commits on a debounce so the canvas stays smooth. */
/**
 * @param multiline  a textarea rather than an input — for the values that are
 *                   JSON rather than a word (a list or record parameter).
 */
/**
 * What a row of the scope browser puts on the drag.
 *
 * `text/plain` as well, so the same drag works into anything that takes text —
 * the JSON box, a note, another window.
 */
export const TOKEN_DRAG = "application/x-dsb-token";

const tokenFrom = (e) => {
  const dt = e.dataTransfer;
  if (!dt) return "";
  return dt.getData(TOKEN_DRAG) || dt.getData("text/plain") || "";
};

/**
 * Given the live scope, the scope a box is answered against.
 *
 * A box inside a repeated payload key is filled once PER ITEM, so `{{item}}`
 * exists there and nowhere else; the suggestions have to be read in that same
 * scope or they would offer the screen's names and miss the item's. The
 * repeat editor knows the mapping, the box does not, so it is passed down.
 */
export const TokenScopeContext = createContext(null);

/**
 * `ds_v8m91757p` and `node:n_gy16fa4o` are ids the screen invented. Nothing in
 * them says which list they hold, so they are looked up in the screen JSON and
 * shown by name. The builder has those names; the runtime does not.
 */
function useScopeNames() {
  const screen = useBuilder()?.state?.screen;
  return useMemo(() => {
    const nodes = new Map(
      flatten(screen?.root).map((n) => [
        n.id,
        controlCaption(n) || n.name || n.props?.field || getDef(n.type)?.label || n.type,
      ]),
    );
    const sources = screen?.dataSources || {};
    return (kind, id) => (kind === "node" ? nodes.get(id) || "" : sources[id]?.name || "");
  }, [screen]);
}

/**
 * The matched part of a name, shown as matched.
 *
 * With the search matching anywhere in the name, "cash" landing on `IsCash`
 * looks arbitrary until the `Cash` in it is picked out — so the hit is marked
 * rather than left for the reader to find.
 */
function mark(text, hit) {
  const str = String(text ?? "");
  if (!hit || hit.at < 0 || hit.at + hit.len > str.length) return str;
  return (
    <>
      {str.slice(0, hit.at)}
      <mark>{str.slice(hit.at, hit.at + hit.len)}</mark>
      {str.slice(hit.at + hit.len)}
    </>
  );
}

/** The `{{` the caret is inside, if it is inside one. */
function openToken(text, caret) {
  const before = String(text ?? "").slice(0, caret);
  const start = before.lastIndexOf("{{");
  if (start < 0) return null;
  // A `}}` between the brace and the caret means that token is closed and the
  // caret is past it, typing ordinary text.
  if (before.indexOf("}}", start) >= 0) return null;
  return { start, head: before.slice(start + 2) };
}

/**
 * The names, at the caret.
 *
 * Typing `{{values.` is the exact moment the question "what is this field
 * called?" gets asked, and until now the answer was a panel away — open the
 * rail, read, remember, come back. So the list comes to the box: the same
 * entries the rail lists, ranked against what has been typed, with what each
 * one currently holds beside it. Arrow keys move, Enter or Tab takes it, Esc
 * leaves it alone; typing on just re-ranks.
 */
function TokenSuggest({ anchorRef, head, onPick, onClose }) {
  const nameOf = useScopeNames();
  const mapScope = useContext(TokenScopeContext);
  const [at, setAt] = useState(0);

  const rows = useMemo(() => {
    const live = liveScope();
    if (!live) return [];
    let scope = live;
    if (typeof mapScope === "function") {
      try {
        scope = mapScope(live) || live;
      } catch (e) {
        scope = live;
      }
    }
    return suggestTokens(head, scope, nameOf);
  }, [head, mapScope, nameOf]);

  // A keystroke that changes the ranking must not leave the highlight on row
  // nine of a list that is now three long.
  useEffect(() => setAt(0), [head]);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return undefined;
    const onKey = (e) => {
      if (!rows.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setAt((i) => (i + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onPick(rows[Math.min(at, rows.length - 1)]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [anchorRef, rows, at, onPick, onClose]);

  if (!rows.length) return null;
  return (
    <Popover anchorRef={anchorRef} open onClose={onClose} width={340} align="left">
      <div className="dsbi-sug">
        <div className="dsbi-sug-note">
          <Icon name="CornerDownLeft" size={10} /> Enter to take it · ↑↓ to move · Esc to type it yourself
        </div>
        <div className="dsbi-sug-list" role="listbox">
          {rows.map((r, i) => (
            /* Same reason as the names list: not a <button>, so the host
               app's button rules cannot reach it. The keyboard is already
               handled on the box this list hangs off. */
            <div
              key={r.path}
              role="option"
              aria-selected={i === at}
              className={`dsbi-sug-row ${i === at ? "is-at" : ""}`}
              data-kind={kindOf(`{{${r.path}}}`)}
              // A click inside the popover would blur the box first and shut
              // the list before the click landed.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setAt(i)}
              onClick={() => onPick(r)}
            >
              {r.group !== rows[i - 1]?.group ? (
                <span className="dsbi-sug-group" data-kind={kindOf(`{{${r.path}}}`)}>
                  {r.group}
                </span>
              ) : null}
              <span className="dsbi-sug-line">
                <code>{mark(r.path, r.hit?.in === "path" ? r.hit : null)}</code>
                <em>{r.type}</em>
              </span>
              <span className="dsbi-sug-val">
                {r.note ? `${r.note} — ` : ""}
                {mark(r.short, r.hit?.in === "value" ? r.hit : null)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Popover>
  );
}

export function DebouncedInput({ value, onChange, delay = 140, type = "text", multiline = false, ...rest }) {
  const [local, setLocal] = useState(value ?? "");
  const timer = useRef(null);
  const dirty = useRef(false);
  const el = useRef(null);
  const [dropping, setDropping] = useState(false);
  // null when the caret is not inside a `{{`; otherwise what has been typed
  // in it so far, which is what the list ranks against.
  const [token, setToken] = useState(null);
  // Esc means "leave me alone in THIS token". Held as what was in the token
  // when it was dismissed, not just where it started: a box cleared and
  // retyped opens a `{{` at the same offset, and keying on the offset alone
  // left the list silent for a token nobody had dismissed.
  const muted = useRef(null);

  useEffect(() => {
    if (!dirty.current) setLocal(value ?? "");
  }, [value]);

  const latest = useRef({ onChange, local });
  latest.current = { onChange, local };

  const push = useCallback(
    (v) => {
      dirty.current = true;
      setLocal(v);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        dirty.current = false;
        // The handler as of NOW, not as of the keystroke: see `latest`.
        (latest.current?.onChange || onChange)(v);
      }, delay);
    },
    [onChange, delay],
  );

  /**
   * What is typed is kept even when the box goes away before it is sent.
   *
   * Selecting another component, switching inspector tab or a drag on the
   * canvas unmounts the box without a blur — the canvas swallows the mousedown
   * that would have moved focus. Clearing the timer then threw the last
   * keystrokes away, and the property "reverted" unless it had been left with
   * Tab. The latest onChange is used, since the one captured with the timer
   * may patch a list as it was before an earlier edit landed.
   */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current) {
        dirty.current = false;
        latest.current.onChange(latest.current.local);
      }
    },
    [],
  );

  const commit = () => {
    if (timer.current) clearTimeout(timer.current);
    // Nothing typed since the last send: re-sending the same text through a
    // handler that patches a whole list can only put back something older.
    if (!dirty.current) return;
    dirty.current = false;
    onChange(local);
  };

  /**
   * Re-read where the caret is and whether it is inside a token.
   *
   * Read from the ELEMENT rather than from state: after a keystroke the caret
   * has already moved, and a token is only open relative to where it is now.
   */
  const syncToken = useCallback(
    (text) => {
      const node = el.current;
      if (type === "number" || !node || node.selectionStart == null) return;
      const open = openToken(text ?? node.value, node.selectionStart);
      if (!open) {
        muted.current = null;
        setToken(null);
        return;
      }
      // Still typing on inside the dismissed token — stay quiet. Anything
      // else is a different token, so the list comes back.
      const m = muted.current;
      if (m && m.start === open.start && open.head.startsWith(m.head)) return;
      muted.current = null;
      setToken(open);
    },
    [type],
  );

  /**
   * Put the chosen name in, in place of what was typed towards it.
   *
   * `{{values.pan` + PanelID has to become `{{values.panelID}}` and not
   * `{{values.panvalues.panelID` — so the typed fragment is what the name
   * replaces. The closing braces are added only when they are missing, since
   * a box being edited in the middle of a sentence already has them.
   */
  const take = useCallback(
    (row) => {
      const node = el.current;
      const text = String(node?.value ?? local ?? "");
      const caret = node?.selectionStart ?? text.length;
      const cut = caret - (row.replace || 0);
      const rest = text.slice(caret);
      const closed = /^\s*\}\}/.test(rest);
      const next = `${text.slice(0, cut)}${row.path}${closed ? "" : "}}"}${rest}`;
      const after = cut + row.path.length + (closed ? rest.indexOf("}}") + 2 : 2);
      if (timer.current) clearTimeout(timer.current);
      dirty.current = false;
      setLocal(next);
      onChange(next);
      setToken(null);
      muted.current = null;
      window.requestAnimationFrame(() => {
        if (!node) return;
        node.focus();
        try {
          node.setSelectionRange(after, after);
        } catch (err) {
          /* nothing to select in a number box */
        }
      });
    },
    [local, onChange],
  );

  /** Everything the box needs to offer names while it is typed in. */
  const sug = {
    onKeyUp: (e) => {
      // The list's own keys are handled where it listens; re-reading the
      // caret on them would fight it.
      if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) return;
      syncToken();
    },
    onKeyDown: (e) => {
      if (e.key !== "Escape" || !token) return;
      muted.current = token;
      setToken(null);
    },
    onClick: () => syncToken(),
    onFocus: () => syncToken(),
    onBlur: () => {
      setToken(null);
      commit();
    },
  };

  /**
   * A token dropped from the browser lands WHERE IT IS DROPPED — at the caret
   * if the box already holds something, because a value is often a token in
   * the middle of a sentence ("Bill for {{labels.PanelID}}"), and replacing
   * the lot would throw the sentence away.
   */
  const onDrop = (e) => {
    const token = tokenFrom(e);
    setDropping(false);
    if (!token) return;
    e.preventDefault();
    const node = el.current;
    const text = String(local ?? "");
    const start = node && node.selectionStart != null ? node.selectionStart : text.length;
    const end = node && node.selectionEnd != null ? node.selectionEnd : start;
    const next = text.slice(0, start) + token + text.slice(end);
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    setLocal(next);
    onChange(next);
    // Back where the token ends, so a second drop reads as typing on.
    window.requestAnimationFrame(() => {
      if (!node) return;
      node.focus();
      const at = start + token.length;
      try {
        node.setSelectionRange(at, at);
      } catch (err) {
        /* a number input has no selection to set */
      }
    });
  };

  const dnd = {
    ref: el,
    onDragOver: (e) => {
      if (!e.dataTransfer || ![...e.dataTransfer.types].some((t) => t === TOKEN_DRAG || t === "text/plain")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (!dropping) setDropping(true);
    },
    onDragLeave: () => setDropping(false),
    onDrop,
  };

  const list = token ? (
    <TokenSuggest
      anchorRef={el}
      head={token.head}
      onPick={take}
      onClose={() => {
        muted.current = token;
        setToken(null);
      }}
    />
  ) : null;

  if (multiline) {
    return (
      <>
        <textarea
          className={`dsbi-input dsbi-input-json ${dropping ? "is-drop" : ""}`}
          rows={rest.rows || 3}
          value={local ?? ""}
          onChange={(e) => {
            push(e.target.value);
            syncToken(e.target.value);
          }}
          {...dnd}
          {...sug}
          {...rest}
        />
        {list}
      </>
    );
  }

  return (
    <>
      <input
        className={`dsbi-input ${dropping ? "is-drop" : ""}`}
        type={type}
        value={local ?? ""}
        onChange={(e) => {
          push(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value);
          syncToken(e.target.value);
        }}
        {...dnd}
        {...sug}
        {...rest}
      />
      {list}
    </>
  );
}

export function Toggle({ value, onChange, label }) {
  return (
    // A Tap, not a <button>: the host theme paints every bare button solid.
    <Tap className={`dsbi-toggle ${value ? "is-on" : ""}`} aria-pressed={!!value} onClick={() => onChange(!value)}>
      <span className="dsbi-toggle-dot" />
      {label ? <span>{label}</span> : null}
    </Tap>
  );
}

/** Past this many matches the list stops being a list — keep typing instead. */
const COMBO_MAX = 200;

/**
 * A select you can type into.
 *
 * The native <select> is fine for six options and useless for three hundred,
 * which is what the API catalog hands the endpoint picker. Same value contract
 * as {@link SelectBox} so the two are interchangeable: `options` of
 * `{value, label}` (or bare strings), `onChange(value)`.
 *
 * The list is portalled through {@link Popover}, so it escapes the inspector's
 * scroll box the same way the colour picker does.
 */
export function Combo({
  value,
  onChange,
  options = [],
  placeholder = "—",
  searchPlaceholder = "Type to search…",
  emptyText = "No matches",
  disabled = false,
  allowClear = true,
  // A key that is not in the list yet is still a legitimate key: a column can
  // be typed into (Remarks, Description), or filled by a later API whose
  // fields nobody has synced yet. Off by default — a picker of controller
  // names has no business inventing one.
  allowCustom = false,
  customLabel = (v) => `Use "${v}"`,
  // Extra classes on the trigger. It is always a Tap (not a <button>), so the
  // host theme's blanket `button` colour cannot reach it.
  tapClass,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const anchorRef = useRef(null);
  const listRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
  }, []);

  const norm = useMemo(
    () => (options || []).map((o) => (o && typeof o === "object" ? o : { value: o, label: String(o) })),
    [options],
  );
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return norm;
    // Also matched: whatever aliases the option carries — a component's file
    // name, the name a page gives the same action — so a list can be searched
    // with the words its user actually has in front of them.
    return norm.filter((o) => `${o.label} ${o.value} ${o.search || ""}`.toLowerCase().includes(needle));
  }, [norm, q]);
  const shown = useMemo(() => filtered.slice(0, COMBO_MAX), [filtered]);

  /** The typed text, when it is a value the list does not already offer. */
  const custom = useMemo(() => {
    const typed = q.trim();
    if (!allowCustom || !typed) return null;
    if (norm.some((o) => String(o.value).toLowerCase() === typed.toLowerCase())) return null;
    return { value: typed, label: customLabel(typed), isNew: true };
  }, [allowCustom, q, norm, customLabel]);

  // First row, so typing a name and pressing Enter is the whole interaction.
  const rows = useMemo(() => (custom ? [custom, ...shown] : shown), [custom, shown]);

  const selected = useMemo(() => {
    const hit = norm.find((o) => String(o.value) === String(value ?? ""));
    if (hit) return hit;
    // A custom value is not in the list, and showing the placeholder over it
    // would read as "nothing picked" when something very much is.
    return allowCustom && value ? { value, label: String(value) } : null;
  }, [norm, value, allowCustom]);

  useEffect(() => setActive(0), [q, open]);

  // Keep the highlighted row visible while arrowing through a long list. Found
  // by data-i rather than child index — the "clear" row is a child too, and
  // counting it would highlight one row and scroll to another.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${active}"]`);
    if (el?.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (o) => {
    onChange(o ? o.value : "");
    close();
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[active]) pick(rows[active]);
    }
  };

  return (
    <div className="dsbi-combo" ref={anchorRef}>
      <Tap
        className={`dsbi-input dsbi-combo-btn ${tapClass || ""} ${selected ? "" : "is-empty"}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title={selected?.label || placeholder}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <Icon name="ChevronDown" size={13} />
      </Tap>
      <Popover
        anchorRef={anchorRef}
        open={open}
        onClose={close}
        // Never narrower than the trigger, never so narrow that every option
        // ellipsises — controller names run long.
        width={Math.max(anchorRef.current?.offsetWidth || 0, 260)}
      >
        <input
          className="dsbi-input dsbi-popsearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder={searchPlaceholder}
          autoFocus
          spellCheck={false}
        />
        <div className="dsbi-combo-list" ref={listRef}>
          {allowClear && !q ? (
            <button type="button" className="dsbi-combo-opt is-clear" onClick={() => pick(null)}>
              {placeholder}
            </button>
          ) : null}
          {rows.map((o, i) => (
            <React.Fragment key={String(o.value)}>
              {/* An option may name the group it belongs to; a heading goes
                  above the first of each run. Filtering keeps the order, so a
                  group's matches stay together under their heading. */}
              {o.group && o.group !== rows[i - 1]?.group ? <div className="dsbi-combo-group">{o.group}</div> : null}
              <button
                type="button"
                data-i={i}
                className={`dsbi-combo-opt ${i === active ? "is-active" : ""} ${o.isNew ? "is-new" : ""} ${
                  String(o.value) === String(value ?? "") ? "is-on" : ""
                }`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
                title={o.label}
              >
                {o.isNew ? <Icon name="Plus" size={12} /> : null}
                {o.label}
              </button>
            </React.Fragment>
          ))}
          {!rows.length ? <div className="dsbi-combo-empty">{emptyText}</div> : null}
        </div>
        {filtered.length > shown.length ? (
          <div className="dsbi-combo-more">{filtered.length - shown.length} more — keep typing to narrow it down</div>
        ) : null}
      </Popover>
    </div>
  );
}

/**
 * `allowEmpty` decides whether "nothing picked" is one of the choices.
 *
 * It is not, for a list that already carries its own neutral option: the
 * placeholder row and the list's own entry then sit one above the other,
 * reading as two identical choices with different meanings.
 */
export function SelectBox({ value, onChange, options = [], placeholder = "—", allowEmpty = true, className = "" }) {
  return (
    <select className={`dsbi-input ${className}`} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

/* ----------------------------------------------------------------- popover */

/**
 * A dropdown that is never clipped.
 *
 * The inspector body scrolls, so an absolutely positioned panel inside it gets
 * cut off at the panel edge — which is what broke the colour picker. This
 * renders into <body> instead, measures the trigger, and places itself in
 * viewport coordinates: it flips above the trigger when there is more room
 * there, clamps to the viewport horizontally, and caps its own height so long
 * content scrolls inside it.
 */
/**
 * @param align  which edge of the anchor the panel lines up with. A picker
 *               hangs off the right of its button; a suggestion list belongs
 *               under the START of the box, where the words are.
 */
function Popover({ anchorRef, open, onClose, width = 218, align = "right", maxH = 320, className = "", children }) {
  const popRef = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const w = Math.min(width, window.innerWidth - 16);
      const gap = 6;
      const below = window.innerHeight - r.bottom - gap - 8;
      const above = r.top - gap - 8;
      const flip = below < 200 && above > below;
      const maxHeight = Math.max(140, Math.min(maxH, flip ? above : below));
      setPos({
        left: Math.min(Math.max(8, align === "left" ? r.left : r.right - w), window.innerWidth - w - 8),
        top: flip ? Math.max(8, r.top - gap - maxHeight) : r.bottom + gap,
        width: w,
        maxHeight,
      });
    };
    place();
    // Capture phase, so scrolling the inspector body repositions it too.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, width, align, anchorRef, maxH]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !pos) return null;
  return createPortal(
    <div className="dsb-portal">
      <div className={`dsbi-pop ${className}`.trim()} ref={popRef} style={pos}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------- action type picker */

/**
 * What a chain step DOES, grouped and colour-coded.
 *
 * Thirty-odd actions in one native <select> read as a wall of text, and the
 * OS draws it, so it could not be searched, grouped or styled. Here each
 * family has its own pastel colour and icon (talking to the server, table
 * rows, form state, asking the user, overlays, moving around, feedback), the
 * trigger carries the same chip, and typing narrows the list.
 */
const ACTION_GROUPS = [
  { key: "data", label: "Data & API", tone: "sky" },
  { key: "rows", label: "Table rows", tone: "teal" },
  { key: "state", label: "Values & form", tone: "mint" },
  { key: "ask", label: "Ask & check", tone: "butter" },
  { key: "overlay", label: "Modals & panels", tone: "rose" },
  { key: "go", label: "Navigate & print", tone: "lavender" },
  { key: "misc", label: "Feedback & advanced", tone: "peach" },
];
const ACTION_META = {
  callApi: { g: "data", icon: "Globe", hint: "Call an endpoint, store or show what comes back" },
  refresh: { g: "data", icon: "RefreshCw", hint: "Load a table, list or dropdown again" },
  export: { g: "data", icon: "Download", hint: "Download an endpoint's answer or a table as Excel / CSV" },
  forEach: { g: "data", icon: "Rows3", hint: "Run steps once for every row of a list" },
  addRow: { g: "rows", icon: "Plus", hint: "Append a row to a table on the screen" },
  removeRow: { g: "rows", icon: "Trash2", hint: "Delete the clicked or matching rows" },
  updateRow: { g: "rows", icon: "SquarePen", hint: "Change fields of the clicked or matching rows" },
  setValue: { g: "state", icon: "PenLine", hint: "Put a value into a form field" },
  setVar: { g: "state", icon: "Hash", hint: "Keep a value in a screen variable" },
  setStorage: { g: "state", icon: "Database", hint: "Save or remove a value in the browser's local storage" },
  storeRow: { g: "state", icon: "Save", hint: "Keep the clicked row as a variable" },
  fillForm: { g: "state", icon: "FilePen", hint: "Fill the form from the clicked row to edit it" },
  resetForm: { g: "state", icon: "RotateCcw", hint: "Clear the form and filters" },
  confirm: { g: "ask", icon: "ShieldCheck", hint: "Yes / No, and No stops the chain" },
  verifyUser: { g: "ask", icon: "KeyRound", hint: "Ask for the signed-in user's password" },
  validate: { g: "ask", icon: "ListChecks", hint: "Check required fields, stop if any fail" },
  openModal: { g: "overlay", icon: "AppWindow", hint: "Open a dialog of this screen" },
  closeModal: { g: "overlay", icon: "X", hint: "Close a dialog" },
  openAppModal: { g: "overlay", icon: "LayoutPanelTop", hint: "Labs, Meds, FlowSheets, Remarks…" },
  closeAppModal: { g: "overlay", icon: "CircleX", hint: "Close the app modal" },
  openPanel: { g: "overlay", icon: "PanelRight", hint: "Slide a side panel in" },
  closePanel: { g: "overlay", icon: "X", hint: "Close a side panel" },
  openFrameMenu: { g: "overlay", icon: "Menu", hint: "The frame menu of patient screens" },
  closeFrameMenu: { g: "overlay", icon: "CircleX", hint: "Close the frame menu" },
  navigate: { g: "go", icon: "Navigation", hint: "Go to another page of the app" },
  openUrl: { g: "go", icon: "ExternalLink", hint: "Open a link or a file in a tab" },
  print: { g: "go", icon: "Printer", hint: "Print the screen" },
  toast: { g: "misc", icon: "Bell", hint: "A short message in the corner" },
  runEvent: { g: "misc", icon: "Play", hint: "Run what another button or table does" },
  script: { g: "misc", icon: "Code2", hint: "A few lines of JavaScript" },
};
const actionMeta = (type) => ACTION_META[type] || { g: "misc", icon: "Zap", hint: "" };
const groupOf = (key) => ACTION_GROUPS.find((x) => x.key === key) || ACTION_GROUPS[ACTION_GROUPS.length - 1];

export function ActionTypePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const anchorRef = useRef(null);
  const listRef = useRef(null);
  const close = useCallback(() => {
    setOpen(false);
    setQ("");
  }, []);

  // In group order, then in the order the schema lists them.
  const all = useMemo(() => {
    const order = ACTION_GROUPS.map((g) => g.key);
    return ACTION_TYPES.map((t, i) => ({ ...t, ...actionMeta(t.type), i })).sort(
      (a, b) => order.indexOf(a.g) - order.indexOf(b.g) || a.i - b.i,
    );
  }, []);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return all;
    return all.filter((t) => `${t.label} ${t.type} ${t.hint} ${groupOf(t.g).label}`.toLowerCase().includes(n));
  }, [all, q]);
  useEffect(() => {
    setActive(Math.max(0, rows.findIndex((r) => r.type === value)));
  }, [rows, value, open]);
  // A frame late: the popover places itself before it draws the list, so on
  // opening there is nothing to scroll yet. Opening shows the current action
  // in the middle; arrowing keeps the highlighted one in view.
  const opened = useRef(false);
  useEffect(() => {
    if (!open) {
      opened.current = false;
      return undefined;
    }
    const id = requestAnimationFrame(() => {
      const el = listRef.current?.querySelector(`[data-i="${active}"]`);
      if (el?.scrollIntoView) el.scrollIntoView({ block: opened.current ? "nearest" : "center" });
      if (el) opened.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [active, open]);

  const pick = (t) => {
    if (t) onChange(t.type);
    close();
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(rows[active]);
    }
  };

  const cur = ACTION_TYPES.find((t) => t.type === value);
  const curMeta = actionMeta(value);
  const curTone = groupOf(curMeta.g).tone;
  return (
    <div className="dsbi-act" ref={anchorRef}>
      <Tap
        className={`dsbi-act-btn is-${curTone} ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        title={cur?.label || "Pick an action"}
      >
        <span className="dsbi-act-ic">
          <Icon name={curMeta.icon} size={13} />
        </span>
        <span className="dsbi-act-name">{cur ? cur.label : "Pick an action"}</span>
        <span className="dsbi-act-chev">
          <Icon name="ChevronDown" size={14} />
        </span>
      </Tap>
      <Popover
        anchorRef={anchorRef}
        open={open}
        onClose={close}
        align="left"
        maxH={440}
        className="dsbi-act-pop"
        width={Math.max(anchorRef.current?.offsetWidth || 0, 300)}
      >
        <input
          className="dsbi-input dsbi-popsearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search actions: toast, row, api…"
          autoFocus
          spellCheck={false}
        />
        <div className="dsbi-act-list" ref={listRef}>
          {rows.map((t, i) => {
            const g = groupOf(t.g);
            return (
              <React.Fragment key={t.type}>
                {t.g !== rows[i - 1]?.g ? <div className={`dsbi-act-group is-${g.tone}`}>{g.label}</div> : null}
                <Tap
                  data-i={i}
                  className={`dsbi-act-opt is-${g.tone} ${i === active ? "is-active" : ""} ${t.type === value ? "is-on" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(t)}
                >
                  <span className="dsbi-act-ic">
                    <Icon name={t.icon} size={14} />
                  </span>
                  <span className="dsbi-act-txt">
                    <b>{t.label}</b>
                    {t.hint ? <small>{t.hint}</small> : null}
                  </span>
                  {t.type === value ? (
                    <span className="dsbi-act-tick">
                      <Icon name="Check" size={14} />
                    </span>
                  ) : null}
                </Tap>
              </React.Fragment>
            );
          })}
          {!rows.length ? <div className="dsbi-combo-empty">No action matches</div> : null}
        </div>
      </Popover>
    </div>
  );
}


/* ------------------------------------------------------------- colour field */

export function ColorField({ value, onChange, palette = [] }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  const swatches = useMemo(() => [...(palette || []), ...DEFAULT_SWATCHES], [palette]);
  return (
    <div className="dsbi-color" ref={anchorRef}>
      <button type="button" className="dsbi-color-chip" style={{ background: value || "transparent" }} onClick={() => setOpen((o) => !o)}>
        {!value ? <Icon name="Ban" size={12} /> : null}
      </button>
      <DebouncedInput value={value || ""} onChange={onChange} placeholder="#000000 / token" />
      <input type="color" className="dsbi-color-native" value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#2563eb"} onChange={(e) => onChange(e.target.value)} />
      <Popover anchorRef={anchorRef} open={open} onClose={close}>
        <div className="dsbi-pop-title">Palette</div>
        <div className="dsbi-swatches">
          {swatches.map((sw, i) => (
            <button
              key={i}
              type="button"
              className="dsbi-swatch"
              title={`${sw.name} — ${sw.bg}`}
              style={{ background: sw.bg, color: sw.fg }}
              onClick={() => {
                onChange(sw.bg);
                close();
              }}
            >
              A
            </button>
          ))}
        </div>
        <div className="dsbi-pop-title">Theme tokens</div>
        <div className="dsbi-tokens">
          {["primary", "secondary", "success", "warning", "danger", "info", "surface", "border", "textPrimary", "textMuted"].map((t) => (
            <button
              key={t}
              type="button"
              className="dsbi-token"
              onClick={() => {
                onChange(`var(--dsb-${t.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)})`);
                close();
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="dsbi-mini dsbi-popclear"
          onClick={() => {
            onChange("");
            close();
          }}
        >
          Clear
        </button>
      </Popover>
    </div>
  );
}

/**
 * The palette as one-click pairs.
 *
 * A status colour is a background AND the text that stays readable on it, so
 * the favourites are picked as a pair — which is the whole reason this row sits
 * beside the three colour boxes instead of leaving someone to match a readable
 * foreground by eye. The screen's own palette comes first, then the shipped
 * swatches.
 */
export function SwatchRow({ palette = [], onPick, limit = 10 }) {
  const swatches = [...(palette || []), ...DEFAULT_SWATCHES].slice(0, limit);
  return (
    <div className="dsbi-swatchrow">
      {swatches.map((s, i) => (
        <button
          key={i}
          type="button"
          className="dsbi-swatch"
          title={`${s.name} — ${s.bg} on ${s.fg}`}
          style={{ background: s.bg, color: s.fg }}
          onClick={() => onPick(s)}
        >
          {s.name.slice(0, 1)}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- icon field */

/**
 * Icon picker.
 *
 * Searches by meaning as well as by name ("gender", "blood group", "marital"),
 * groups the set the way a clinical screen is built (patient, vitals, lab,
 * pharmacy…), and — given the label the icon sits beside — offers the likely
 * ones first, so a field called "Marital Status" is one click from its glyph.
 */
export function IconField({ value, onChange, rowFields = [], sourceName = "", suggestFrom = "" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const anchorRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  const list = useMemo(() => {
    const pool = cat === "all" ? ICON_NAMES : ICON_CATEGORIES.find((c) => c.key === cat)?.names || ICON_NAMES;
    return searchIcons(q, pool);
  }, [q, cat]);
  const suggested = useMemo(() => (suggestFrom && !q ? suggestIcons(suggestFrom, 7) : []), [suggestFrom, q]);
  const pick = (n) => {
    onChange(n);
    close();
  };
  // An icon can also be DATA: a row that carries "BedDouble" in a column, or a
  // variable a chain sets. The picker cannot express that, so the binding is
  // typed (or picked from the record) below the grid, and the trigger says so
  // rather than showing an empty square for a name it cannot resolve yet.
  const bound = hasTemplate(value);
  return (
    <div className="dsbi-iconfield" ref={anchorRef}>
      <button
        type="button"
        className="dsbi-iconbtn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Icon: ${value || "none"}`}
      >
        {bound ? <Icon name="Zap" size={15} /> : value ? <Icon name={value} size={15} /> : <Icon name="Sparkles" size={15} />}
        <span className={bound ? "is-bound" : ""}>{value || "None"}</span>
        <Icon name="ChevronDown" size={12} />
      </button>
      {/* One-click suggestion beside the trigger: the icon the label asks for,
          without opening the grid at all. */}
      {!value && suggested[0] ? (
        <button
          type="button"
          className="dsbi-iconsugg-quick"
          title={`Use ${suggested[0]} — suggested for “${suggestFrom}”`}
          aria-label={`Use suggested icon ${suggested[0]}`}
          onClick={() => onChange(suggested[0])}
        >
          <Icon name={suggested[0]} size={13} />
          <Icon name="Plus" size={10} />
        </button>
      ) : null}
      <Popover anchorRef={anchorRef} open={open} onClose={close} width={312}>
        <div className="dsbi-iconsearch">
          <Icon name="Search" size={13} />
          <input
            className="dsbi-input dsbi-popsearch"
            placeholder="Search: gender, blood group, bed, bill…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search icons by name or meaning"
            autoFocus
          />
        </div>
        {suggested.length ? (
          <div className="dsbi-iconsugg">
            <span className="dsbi-iconsugg-t">
              <Icon name="Sparkles" size={11} /> Suggested for “{suggestFrom}”
            </span>
            <div className="dsbi-iconsugg-row">
              {suggested.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`dsbi-icontile is-sugg ${value === n ? "is-on" : ""}`}
                  title={n}
                  aria-label={n}
                  onClick={() => pick(n)}
                >
                  <Icon name={n} size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="dsbi-iconcats" role="tablist" aria-label="Icon categories">
          {[{ key: "all", label: "All", icon: "LayoutGrid" }, ...ICON_CATEGORIES].map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={cat === c.key}
              className={cat === c.key ? "is-on" : ""}
              title={c.label}
              onClick={() => setCat(c.key)}
            >
              <Icon name={c.icon} size={12} />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <div className="dsbi-icongrid">
          <button type="button" className="dsbi-icontile" title="None" aria-label="No icon" onClick={() => pick("")}>
            <Icon name="Ban" size={15} />
          </button>
          {list.map((n) => (
            <button
              key={n}
              type="button"
              className={`dsbi-icontile ${value === n ? "is-on" : ""}`}
              title={ICON_KEYWORDS[n] ? `${n} — ${ICON_KEYWORDS[n]}` : n}
              aria-label={n}
              onClick={() => pick(n)}
            >
              <Icon name={n} size={15} />
            </button>
          ))}
          {!list.length ? <p className="dsbi-note dsbi-iconnone">No icon matches “{q}”.</p> : null}
        </div>
        <div className="dsbi-iconbind">
          <label className="dsbi-label">Or take the name from the data</label>
          <TemplateField
            value={bound ? value : ""}
            onChange={(v) => onChange(v)}
            rowFields={rowFields}
            sourceName={sourceName}
            placeholder="{{row.StatusIcon}}"
          />
          <p className="dsbi-note">
            The value has to resolve to an icon name from the list above (<code>BedDouble</code>, <code>HeartPulse</code>).
            A name that is not one of them draws nothing.
          </p>
        </div>
      </Popover>
    </div>
  );
}

/* ------------------------------------------------------------- list editors */

function ListShell({ items, onChange, render, blank, addLabel = "Add" }) {
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };
  return (
    <div className="dsbi-list">
      {(items || []).map((it, i) => (
        <div key={i} className="dsbi-list-item">
          <div className="dsbi-list-head">
            <span className="dsbi-list-n">{i + 1}</span>
            <div className="dsbi-list-tools">
              <button type="button" onClick={() => move(i, i - 1)} title="Move up">
                <Icon name="ArrowUp" size={12} />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} title="Move down">
                <Icon name="ArrowDown" size={12} />
              </button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove">
                <Icon name="Trash2" size={12} />
              </button>
            </div>
          </div>
          {render(it, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
        </div>
      ))}
      <button type="button" className="dsbi-add" onClick={() => onChange([...(items || []), typeof blank === "function" ? blank() : { ...blank }])}>
        <Icon name="Plus" size={12} /> {addLabel}
      </button>
    </div>
  );
}

/** Column names compared as fillFromRow does: case, spaces and _ ignored. */
// Typed text that reads as code rather than a column or a word: a path into
// the row/screen, an arrow function, or a string / array method call.
const LOOKS_JS =
  /\b(row|values|vars|user|params|globals)\s*[.[]|=>|\.(split|map|filter|join|trim|slice|replace|replaceAll|toUpperCase|toLowerCase|includes|find|some|every|concat|substring|reduce|toString|toFixed|padStart)\s*\(/;
const looseName = (k) => String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * "Form field ← value" bindings of an Edit fill, one compact line each.
 *
 * The value side is a plain box: a row column's name (suggested from the
 * row's fields as it is typed) or anything with `{{ }}` — {{row.Code}}-{{row.Name}},
 * {{values.X}}, {{vars.X}} — which the box completes the way every other
 * template box in the inspector does.
 *
 * Plain text that names no column of the row is fixed text — "mayank" fills
 * the field with "mayank" — marked `fixed` on the binding. The tag beside the
 * box says which it is and flips it, for a row whose columns are not known
 * here (nothing synced) or a value that happens to match a column's name.
 */
/**
 * The record a binding's test runs against: the first row the selected table
 * already has (its last Sync, or its static rows), else a made-up one built
 * from its columns — and the screen's nodes, so a test knows which control a
 * field belongs to.
 */
function useFillSample() {
  const st = useBuilder()?.state;
  const screen = st?.screen;
  const selId = st?.selectedIds?.[0];
  return useMemo(() => {
    const nodes = flatten(screen?.root);
    const sel = nodes.find((n) => n.id === selId);
    const grid = sel && Array.isArray(sel.props?.columns) ? sel : null;
    const real = grid ? sampleRowOf(grid.props) : null;
    const row = real || (grid ? makeSampleRows(grid.props.columns, 1)[0] : null) || {};
    return { row, real: !!real, name: grid?.name || "", nodes };
  }, [screen, selId]);
}

/** A tested value as the user would read it — quotes on text so "" shows. */
function showTested(v) {
  if (v === undefined) return "undefined";
  try {
    const out = JSON.stringify(v);
    return out.length > 160 ? `${out.slice(0, 157)}…` : out;
  } catch (e) {
    return String(v);
  }
}

function FillBindList({ value, onChange, formFields = [], rowFields = [], editVar = "editRow" }) {
  const items = Array.isArray(value) ? value : [];
  const sample = useFillSample();
  // index -> the last test, kept with what was tested so an edit hides it.
  const [tests, setTests] = useState({});
  const runTest = (i, m) => {
    const node = sample.nodes.find((n) => n.props?.field === m.field || n.props?.name === m.field) || null;
    // The same live data the `{{` suggestions read — {{rows.…}}, {{vars.…}},
    // {{values.…}} — with the sample record as `row`.
    // As on the click, {{vars.editRow}} is the row being edited, not whatever
    // the last Preview left there — or a test could pass while Edit fails.
    const live = liveScope() || {};
    const res = testBinding(m, sample.row, { ...live, vars: { ...(live.vars || {}), [editVar]: sample.row } }, node);
    setTests((t) => ({ ...t, [i]: { ...res, from: m.from, js: !!m.js, fixed: !!m.fixed, field: m.field } }));
  };
  const testOf = (i, m) => {
    const t = tests[i];
    return t && t.from === m.from && t.js === !!m.js && t.fixed === !!m.fixed && t.field === m.field ? t : null;
  };
  const listId = `dsbi-bind-${useId().replace(/:/g, "")}`;
  const columns = [...new Set((rowFields || []).map((f) => (f && typeof f === "object" ? f.value : f)).filter(Boolean))];
  const known = new Set(columns.map(looseName));
  const write = (next) => onChange(next.length ? next : undefined);
  const patchAt = (i, p) => write(items.map((m, j) => (j === i ? { ...m, ...p } : m)));
  const kindOf = (m) => {
    if (m.js) return "js";
    if (String(m.from || "").includes("{{")) return "tmpl";
    return m.fixed ? "text" : "col";
  };
  const setFrom = (i, v) => {
    // Once a binding is JS it stays JS while it is typed in — a half-written
    // expression must not flip to Text under the user's fingers.
    // A value that opens with `{{` is a template — never valid JS — so it
    // leaves JS mode instead of failing with "Unexpected token '{'".
    if (items[i]?.js) {
      patchAt(i, String(v ?? "").trimStart().startsWith("{{") ? { from: v, js: undefined } : { from: v });
      return;
    }
    const t = String(v ?? "");
    const looksJs = !t.includes("{{") && LOOKS_JS.test(t);
    const looksFixed = !looksJs && !!t.trim() && !t.includes("{{") && columns.length > 0 && !known.has(looseName(t));
    patchAt(i, { from: v, fixed: looksFixed || undefined, js: looksJs || undefined });
  };
  // What a click on the tag turns the binding into: Column -> Text -> JS -> Column.
  const NEXT = {
    col: { fixed: true, js: undefined },
    text: { fixed: undefined, js: true },
    js: { fixed: undefined, js: undefined },
    tmpl: { fixed: undefined, js: true },
  };
  const TAGS = {
    col: { text: "Column", tip: "Read from this column of the row. Click: fixed text." },
    text: { text: "Text", tip: "Filled with exactly this text. Click: JavaScript." },
    js: { text: "JS", tip: "A JavaScript expression — row, values, vars, user, params, globals. Click: column." },
    tmpl: { text: "{{ }}", tip: "A template, worked out when Edit is clicked. Click: JavaScript." },
  };
  return (
    <div className="dsbi-bind">
      {items.length ? (
        <div className="dsbi-bind-head">
          <span>Form field</span>
          <span />
          <span>Value</span>
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {items.map((m, i) => (
        <Fragment key={i}>
        <div className="dsbi-bind-row">
          <FormFieldCombo
            value={m.field || ""}
            onChange={(v) => patchAt(i, { field: v || "" })}
            keys={formFields}
            placeholder="Pick a field"
            searchPlaceholder="Search controls…"
          />
          <Icon name="ArrowLeft" size={13} className="dsbi-bind-arrow" />
          <DebouncedInput
            value={m.from || ""}
            onChange={(v) => setFrom(i, v)}
            placeholder={m.js ? 'row.Ids.split(",")' : "Column, text or {{ }}"}
            list={columns.length && !m.js ? listId : undefined}
            spellCheck={false}
          />
          {(() => {
            const kind = kindOf(m);
            const tag = TAGS[kind];
            return (
              <button
                type="button"
                className={`dsbi-bind-kind is-${kind}`}
                title={tag.tip}
                onClick={() => patchAt(i, NEXT[kind])}
              >
                {tag.text}
              </button>
            );
          })()}
          <button
            type="button"
            className="dsbi-bind-test-btn"
            title={
              sample.real
                ? `Test on the first row of ${sample.name}:\n${showTested(sample.row)}`
                : "Test on a made-up sample row (Sync the table's API for real data)"
            }
            aria-label="Test this binding"
            disabled={!String(m.from || "").trim()}
            onClick={() => runTest(i, m)}
          >
            <Icon name="Play" size={11} />
          </button>
          <button
            type="button"
            className="dsbi-x"
            title="Remove"
            aria-label="Remove"
            onClick={() => {
              setTests({});
              write(items.filter((_, j) => j !== i));
            }}
          >
            <Icon name="X" size={12} />
          </button>
        </div>
        {(() => {
          const t = testOf(i, m);
          if (!t) return null;
          const empty = !t.error && (t.value === "" || (Array.isArray(t.value) && !t.value.length));
          return (
            <div className={`dsbi-bind-test ${t.error ? "is-err" : empty ? "is-warn" : "is-ok"}`}>
              <Icon name={t.error ? "CircleX" : empty ? "AlertTriangle" : "CheckCircle2"} size={12} />
              <span className="dsbi-bind-test-val">
                {t.error ? t.error : empty ? `${showTested(t.value)} — nothing to fill` : showTested(t.value)}
              </span>
              <span className="dsbi-bind-test-src">{sample.real ? `row 1 of ${sample.name}` : "sample row"}</span>
            </div>
          );
        })()}
        </Fragment>
      ))}
      {columns.length ? (
        <datalist id={listId}>
          {columns.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
      ) : null}
      <button type="button" className="dsbi-add" onClick={() => onChange([...items, { field: "", from: "" }])}>
        <Icon name="Plus" size={12} /> Bind a field
      </button>
    </div>
  );
}

/**
 * Everything an Edit fill can be told, in the order someone needs it: what
 * happens on its own, the few fields that need binding, the ones to leave
 * alone — and, folded away, where it fills and the edit-mode variable.
 *
 * `value` carries the action's own keys (within, editVar, onlyMapped, map,
 * skip); the Edit button control maps its column keys onto them.
 */
function FillFormSettings({ value = {}, onChange, formFields = [], rowFields = [], containerOptions = [] }) {
  const editVar = value.editVar || "editRow";
  return (
    <div className="dsbi-fill">
      <p className="dsbi-note">
        Each form field is filled from the row column with the <b>same name</b>. Bind only the fields whose name is
        different, or that need a <code>{"{{value}}"}</code>.
      </p>

      <div className="dsbi-sub-title">Bind fields</div>
      <FillBindList
        value={value.map}
        onChange={(v) => onChange({ map: v })}
        formFields={formFields}
        rowFields={rowFields}
        editVar={editVar}
      />
      <p className="dsbi-note">
        Value: a column (<code>StoreTypeID</code>), fixed text (<code>Mayank</code>), a template (
        <code>{"{{row.Code}} - {{row.Name}}"}</code>) or plain <b>JS</b> (<code>{'row.StoreTypeIDs.split(",")'}</code>,{" "}
        <code>{'row.FirstName + " " + row.LastName'}</code>). JS reads <code>row</code>, <code>values</code>,{" "}
        <code>vars</code>, <code>user</code>. The tag beside it shows which — click it to switch Column → Text → JS.
      </p>

      <Row label="Fill only bound fields">
        <Toggle value={!!value.onlyMapped} onChange={(v) => onChange({ onlyMapped: v || undefined })} />
      </Row>

      <div className="dsbi-sub-title">Don't fill</div>
      <DataKeysEditor
        value={value.skip}
        onChange={(v) => onChange({ skip: v.length ? v : undefined })}
        keys={formFields}
        placeholder="Keep a field as it is…"
      />

      <Section title="More options" defaultOpen={!!(value.within || value.editVar)}>
        <Row label="Fill inside">
          <SelectBox
            value={value.within || ""}
            onChange={(v) => onChange({ within: v || undefined })}
            options={containerOptions}
            placeholder="The whole screen"
          />
        </Row>
        <Row label="Edit variable">
          <DebouncedInput value={value.editVar || ""} onChange={(v) => onChange({ editVar: v || undefined })} placeholder="editRow" />
        </Row>
        <p className="dsbi-note">
          The clicked row is kept in <code>{`{{vars.${editVar}}}`}</code>: show Update while it is set and send{" "}
          <code>{`{{vars.${editVar}.ID}}`}</code> from it. Reset form clears it.
        </p>
      </Section>
    </div>
  );
}

/**
 * The scan behind `parseLooseJson`: a JavaScript literal, rewritten as JSON.
 *
 * Done character by character rather than with regexes over the whole text, so
 * a brace, a comma or a colon INSIDE a value is never touched — `{ label: "a,
 * b}" }` survives, which a regex pass would not.
 */
const CONTROL_ESCAPES = { "\n": "\\n", "\r": "\\r", "\t": "\\t", "\f": "\\f", "\b": "\\b" };

function looseToJson(input) {
  // `const OPTIONS = [ … ];` — what a copy out of a .jsx file brings with it.
  let src = String(input ?? "")
    .trim()
    .replace(/^\s*export\s+default\s+/, "")
    .replace(/^\s*(?:export\s+)?(?:const|let|var)\s+[\w$]+\s*=\s*/, "")
    .replace(/;\s*$/, "");
  let out = "";
  let i = 0;
  const identStart = /[A-Za-z_$]/;
  const identRest = /[\w$]/;

  while (i < src.length) {
    const c = src[i];

    if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }

    // A string is copied with its escapes intact — re-escaping the text would
    // turn a pasted \n into a literal backslash-n. Single quotes only change
    // their wrapper: \' becomes ', and a bare " has to be escaped instead.
    if (c === '"' || c === "'") {
      const quote = c;
      let raw = "";
      i += 1;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\") {
          raw += src[i] + (src[i + 1] ?? "");
          i += 2;
          continue;
        }
        // A raw newline or tab is legal in the middle of a pasted template
        // literal and illegal inside a JSON string, so it is escaped rather
        // than left to fail the parse.
        raw += CONTROL_ESCAPES[src[i]] ?? src[i];
        i += 1;
      }
      i += 1;
      out +=
        quote === '"'
          ? `"${raw}"`
          : `"${raw.replace(/\\(.)|(")/g, (m, esc) => (esc === undefined ? '\\"' : esc === "'" ? "'" : "\\" + esc))}"`;
      continue;
    }

    // A bare word is a key if a colon follows it, and a JS value otherwise.
    if (identStart.test(c)) {
      let word = "";
      while (i < src.length && identRest.test(src[i])) {
        word += src[i];
        i += 1;
      }
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j += 1;
      if (src[j] === ":") out += `"${word}"`;
      else if (word === "undefined" || word === "NaN" || word === "Infinity") out += "null";
      else out += word;
      continue;
    }

    // Trailing comma: legal JS, and the single most common reason a correct
    // paste is rejected.
    if (c === "}" || c === "]") {
      out = out.replace(/,(\s*)$/, "$1");
      out += c;
      i += 1;
      continue;
    }

    out += c;
    i += 1;
  }
  return out;
}

/**
 * JSON.parse, but for what people actually paste.
 *
 * The list being replaced lives in a .jsx file, so it arrives as a JavaScript
 * literal — unquoted keys, single quotes, a trailing comma, sometimes still
 * carrying its `const OPTIONS =` and its semicolon. Every one of those is valid
 * source and none of them is valid JSON, and "Expected property name or '}'" is
 * a poor answer to a paste that was perfectly correct.
 */
export function parseLooseJson(text) {
  const src = String(text ?? "").trim();
  if (!src) return [];
  try {
    return JSON.parse(src);
  } catch (strict) {
    try {
      return JSON.parse(looseToJson(src));
    } catch (loose) {
      // The strict message points at the real text, which is the one the
      // person is looking at; the rewritten copy's positions would not line up.
      throw strict;
    }
  }
}

/**
 * Whatever was pasted, as {label, value} pairs.
 *
 * A static list arrives in three shapes and all three are worth taking: bare
 * strings, the pairs this editor writes, and a slice of an API response whose
 * keys are the endpoint's own (Company_Name / PanelID). The last case reuses
 * the guesser the fetched-options path already uses, so a pasted response
 * behaves the same as a synced one.
 */
function optionsFromJson(parsed) {
  const rows = parsed.filter((r) => r && typeof r === "object" && !Array.isArray(r));
  if (!rows.length) {
    // Bare values: "Lab" is its own label and its own value.
    return parsed.map((v) => ({ label: String(v ?? ""), value: v ?? "" }));
  }
  const explicit = rows.every((r) => "label" in r && "value" in r);
  if (explicit) return rows.map((r) => ({ label: String(r.label ?? ""), value: r.value }));
  return rowsToOptions(rows).map((o) => ({ label: o.label, value: o.value }));
}

export function OptionsEditor({ value, onChange, blank = null, addLabel = "" }) {
  const items = Array.isArray(value) ? value : [];
  const [json, setJson] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const openJson = useCallback(() => {
    setText(JSON.stringify(items, null, 2));
    setErr("");
    setJson(true);
  }, [items]);

  const applyJson = useCallback(() => {
    try {
      const parsed = parseLooseJson(text);
      if (!Array.isArray(parsed)) throw new Error('Expected an array, e.g. [ { "label": "Radiology", "value": "Rad" } ]');
      onChange(optionsFromJson(parsed));
      setErr("");
      setJson(false);
    } catch (e) {
      setErr(e.message);
    }
  }, [text, onChange]);

  if (json) {
    return (
      <div className="dsbi-rows">
        <div className="dsbi-rowsbar">
          <span className="dsbi-badge">JSON</span>
          <div className="dsbi-rowsbar-r">
            <button type="button" className="dsbi-mini" onClick={() => setJson(false)}>
              Cancel
            </button>
            <button type="button" className="dsbi-mini is-primary" onClick={applyJson}>
              Apply
            </button>
          </div>
        </div>
        <textarea
          className="dsbi-input dsbi-code"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={'[ { "label": "Labortory", "value": "Lab" }, { "label": "Radiology", "value": "Rad" } ]'}
        />
        {err ? <div className="dsbi-jsonerr">{err}</div> : null}
        <p className="dsbi-note">
          Paste the array straight out of the page you are replacing — unquoted keys, single quotes, a trailing comma
          and a leading <code>const OPTIONS =</code> are all fine. Bare strings (<code>["Lab", "Rad"]</code>) become
          their own labels and values, and a slice of an API response keeps its own keys — the label and value are
          guessed the same way a synced endpoint's are.
        </p>
      </div>
    );
  }

  return (
    <div className="dsbi-rows">
      <div className="dsbi-rowsbar">
        <span className="dsbi-badge">{items.length} options</span>
        <div className="dsbi-rowsbar-r">
          <button type="button" className="dsbi-mini" onClick={openJson} title="Edit or paste raw JSON">
            JSON
          </button>
          <button type="button" className="dsbi-mini" onClick={() => onChange([])} title="Remove every option">
            Clear
          </button>
        </div>
      </div>
      <ListShell
        items={items}
        onChange={onChange}
        blank={blank || { label: "New", value: "" }}
        addLabel={addLabel || "Add option"}
        render={(it, patch) => (
          <div className="dsbi-grid2">
            <DebouncedInput value={it.label} onChange={(v) => patch({ label: v })} placeholder="Label" />
            <DebouncedInput value={it.value} onChange={(v) => patch({ value: v })} placeholder="Value" />
          </div>
        )}
      />
    </div>
  );
}

/**
 * The icons in one row's action strip.
 *
 * A list, not a column each: that is how the hand-coded pages lay the cluster
 * out, and a list can be reordered, spaced and conditioned as a group. Each
 * icon picks what it opens — an action chain, one of the app's real modals, a
 * route, or the module's patient screens — and carries its own tooltip and its
 * own show-when condition.
 *
 * `as="buttons"` edits the page header's buttons with the same fields, plus
 * what a button shows (icon, text or both) and its app button style. A header
 * has no row, so the frame menu — a per-row list — is not offered there.
 */
const BUTTON_DISPLAY = [
  { value: "both", label: "Icon and text" },
  { value: "icon", label: "Icon only" },
  { value: "text", label: "Text only" },
];

export function ActionsEditor({ value, onChange, nodes = [], dataSources = {}, patchNode, as = "icons", rowFields = [], rowSource = "" }) {
  const items = Array.isArray(value) ? value : [];
  const buttons = as === "buttons";
  return (
    <>
      <ListShell
        items={items}
        onChange={onChange}
        blank={
          buttons
            ? { label: "Button", icon: "", display: "both", variant: "success", size: "sm", kind: "actions" }
            : { label: "Action", icon: "Sparkles", color: "", kind: "actions" }
        }
        addLabel={buttons ? "Add button" : "Add icon"}
        render={(it, patch) => {
          // The frame menu is its own kind of icon: it brings its trigger, its
          // list and the screens it opens, so none of the button settings below
          // apply to it.
          const kind = it.kind || "actions";
          const isFrame = kind === "frameMenu";
          const spec = kind === "appModal" ? APP_MODALS[it.appModal] : null;
          return (
            <>
              <Row label="Opens">
                <SelectBox
                  value={kind}
                  onChange={(v) => patch({ kind: v })}
                  options={[
                    { value: "actions", label: "An action chain" },
                    { value: "appModal", label: "An app modal (Labs, Meds, FlowSheets, Remarks...)" },
                    { value: "navigate", label: "Another screen (route)" },
                    ...(buttons ? [] : [{ value: "frameMenu", label: "The module's patient screens (frame menu)" }]),
                  ]}
                />
              </Row>
              {isFrame ? (
                <>
                  <Row label="Module (frameName)">
                    <DebouncedInput
                      value={it.frameName || ""}
                      onChange={(v) => patch({ frameName: v })}
                      placeholder="Emergency"
                    />
                  </Row>
                  <Row label="Patient header">
                    <Toggle value={it.showPatientHeader !== false} onChange={(v) => patch({ showPatientHeader: v })} />
                  </Row>
                  <p className="dsbi-note">
                    Reads <b>BindFrameMenuByRoleID</b> for this module, filtered by the signed-in role, and opens the
                    chosen screen on this row — the same icon and the same screens a hand-coded page shows. One request
                    serves every row.
                  </p>
                </>
              ) : (
                <>
                  <DebouncedInput
                    value={it.label}
                    onChange={(v) => patch({ label: v })}
                    placeholder={buttons ? "Button text" : "Label"}
                  />
                  {buttons ? (
                    <>
                      <Row label="Shows">
                        <SelectBox
                          allowEmpty={false}
                          value={it.display || "both"}
                          onChange={(v) => patch({ display: v })}
                          options={BUTTON_DISPLAY}
                        />
                      </Row>
                      <div className="dsbi-grid2">
                        <Field label="Style">
                          <SelectBox
                            allowEmpty={false}
                            value={it.variant || "success"}
                            onChange={(v) => patch({ variant: v })}
                            options={BTN_VARIANT_OPTIONS}
                          />
                        </Field>
                        <Field label="Size">
                          <SelectBox
                            allowEmpty={false}
                            value={it.size ?? "sm"}
                            onChange={(v) => patch({ size: v })}
                            options={BTN_SIZE_OPTIONS}
                          />
                        </Field>
                      </div>
                    </>
                  ) : null}
                  <Row label="Icon">
                    <IconField value={it.icon} onChange={(v) => patch({ icon: v })} suggestFrom={it.tooltip || it.label} />
                  </Row>
                  <Row label={buttons ? "Text colour" : "Colour"}>
                    <ColorField value={it.color} onChange={(v) => patch({ color: v })} />
                  </Row>
                  <Row
                    label="Background"
                    hint={buttons ? "Overrides the style's fill. Leave empty for the style's own." : "Fills the icon's button. Leave empty for the default."}
                  >
                    <ColorField value={it.bgColor} onChange={(v) => patch({ bgColor: v })} />
                  </Row>
                  <Row
                    label="Tooltip"
                    hint="Shown in a floating bubble on hover. The label is used when this is empty."
                  >
                    <DebouncedInput value={it.tooltip || ""} onChange={(v) => patch({ tooltip: v })} placeholder="Labs" />
                  </Row>

                  {kind === "appModal" ? (
                    <>
                      <Row label="Modal">
                        <SelectBox
                          value={it.appModal || ""}
                          onChange={(v) => patch({ appModal: v })}
                          options={APP_MODAL_OPTIONS}
                        />
                      </Row>
                      <div className="dsbi-grid2">
                        <Field label="Title">
                          <DebouncedInput
                            value={it.title || ""}
                            onChange={(v) => patch({ title: v })}
                            placeholder={spec?.title || "Modal title"}
                          />
                        </Field>
                        <Field label="Width">
                          <DebouncedInput
                            value={it.size || ""}
                            onChange={(v) => patch({ size: v })}
                            placeholder={spec?.size || "60vw"}
                          />
                        </Field>
                      </div>
                      <p className="dsbi-note">
                        Opens the app's real component on this row — the same modal a hand-coded page opens, not a
                        rebuilt copy. A modal that saves (waiting type) closes and refreshes this grid on success.
                      </p>
                    </>
                  ) : null}

                  {kind === "navigate" ? (
                    <Row label="Route">
                      <DebouncedInput
                        value={it.route || ""}
                        onChange={(v) => patch({ route: v })}
                        placeholder="/pharmacy-issue"
                      />
                    </Row>
                  ) : null}

                  {kind === "actions" ? (
                    <Section title="On click" defaultOpen={!!(it.onClick || []).length}>
                      <ActionListEditor
                        value={it.onClick || []}
                        onChange={(v) => patch({ onClick: v })}
                        nodes={nodes}
                        dataSources={dataSources}
                        patchNode={patchNode}
                        rowFields={rowFields}
                        rowSource={rowSource}
                      />
                      <p className="dsbi-note">
                        {buttons ? "Runs when the button is clicked." : "Empty falls back to the table's onRowAction event."}
                      </p>
                    </Section>
                  ) : null}
                </>
              )}

              <Section title={buttons ? "Show this button when" : "Show this icon when"} defaultOpen={!!it.when?.op}>
                <div className="dsbi-grid3">
                  <DebouncedInput
                    value={it.when?.field || ""}
                    onChange={(v) => patch({ when: { ...it.when, field: v } })}
                    placeholder="Status"
                  />
                  <SelectBox
                    value={it.when?.op || ""}
                    onChange={(v) => patch({ when: { ...it.when, op: v } })}
                    options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))}
                    placeholder="op"
                  />
                  <DebouncedInput
                    value={it.when?.value ?? ""}
                    onChange={(v) => patch({ when: { ...it.when, value: v } })}
                    placeholder="RFI"
                  />
                </div>
                {buttons ? (
                  <p className="dsbi-note">
                    A value on this screen — a field such as <code>Status</code>, or <code>vars.mode</code> — with no
                    operator meaning always shown. The canvas shows every button either way.
                  </p>
                ) : (
                  <p className="dsbi-note">
                    A field of the row — <code>Status</code>, <code>DischargeStatus</code> — with no operator meaning
                    always shown. This is how "no release icon once the patient is released" is expressed.
                  </p>
                )}
              </Section>
            </>
          );
        }}
      />
    </>
  );
}

export function FieldsEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="dsbi-chips">
      {items.map((f, i) => (
        <span key={i} className="dsbi-chipedit">
          {f}
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Icon name="X" size={10} />
          </button>
        </span>
      ))}
      <input
        className="dsbi-input is-inline"
        placeholder="add field…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget.value.trim()) {
            onChange([...items, e.currentTarget.value.trim()]);
            e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}

/**
 * Several keys of the component's data, picked rather than typed: the chosen
 * ones as chips, and a list of the rest to add from. A key the data does not
 * show yet (nothing synced) can still be typed in.
 */
export function DataKeysEditor({ value, onChange, keys = [], placeholder = "Add a field…", emptyNote = "" }) {
  const items = Array.isArray(value) ? value.filter(Boolean) : [];
  const rest = (keys || []).filter((k) => !items.includes(k));
  return (
    <div className="dsbi-keys">
      {items.length ? (
        <div className="dsbi-chips">
          {items.map((f) => (
            <span key={f} className="dsbi-chipedit">
              {f}
              <button type="button" title={`Remove ${f}`} aria-label={`Remove ${f}`} onClick={() => onChange(items.filter((x) => x !== f))}>
                <Icon name="X" size={10} />
              </button>
            </span>
          ))}
        </div>
      ) : emptyNote ? (
        <p className="dsbi-note">{emptyNote}</p>
      ) : null}
      <Combo
        // Always empty: each pick adds a chip, so the box goes back to asking.
        value=""
        onChange={(k) => k && !items.includes(k) && onChange([...items, k])}
        options={rest.map((k) => ({ value: k, label: k }))}
        placeholder={placeholder}
        searchPlaceholder="Search fields, or type one…"
        allowClear={false}
        allowCustom
        customLabel={(v) => `Add "${v}"`}
      />
    </div>
  );
}

const COLUMN_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & time" },
  { value: "boolean", label: "Boolean" },
  { value: "chip", label: "Chip / status" },
  { value: "icon", label: "Icon" },
  { value: "link", label: "Link" },
  { value: "actions", label: "Action buttons" },
  { value: "frameMenu", label: "Frame menu (patient screens)" },
  { value: "serial", label: "Sr No. (row number)" },
];

/* -------------------------------------------------------------- rows editor */

/** Columns whose values are numbers, so typed text is stored as a number. */
const NUMERIC_COL_TYPES = ["number", "currency"];

/** An empty row shaped by the current column config. */
function blankRow(cols) {
  const r = {};
  cols.forEach((c) => {
    r[c.key] = NUMERIC_COL_TYPES.includes(c.type) ? 0 : "";
  });
  return r;
}

/**
 * Hard-coded table rows, edited in the inspector.
 *
 * This is the "front-end data" mode: rows live in the screen JSON, so a screen
 * is complete and demo-able before any endpoint exists. The JSON view takes a
 * pasted API response as-is, which is usually how a static screen becomes a
 * live one — paste the real payload, check the columns line up, then switch
 * "Rows come from" to Dynamic API.
 */
export function RowsEditor({ value, onChange, columns = [] }) {
  const rows = Array.isArray(value) ? value : [];
  // A component without a column list (a card list) still has rows with
  // fields — edit those, rather than offering only the JSON box.
  const cols = useMemo(() => {
    const set = (columns || []).filter((c) => c && c.key);
    if (set.length) return set;
    const keys = new Set();
    rows.slice(0, 20).forEach((r) => {
      if (r && typeof r === "object") Object.keys(r).forEach((k) => !k.startsWith("__") && keys.add(k));
    });
    return [...keys].map((k) => ({
      key: k,
      header: k,
      type: rows.some((r) => typeof r?.[k] === "number") ? "number" : "text",
    }));
  }, [columns, rows]);
  const [json, setJson] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const openJson = useCallback(() => {
    setText(JSON.stringify(rows, null, 2));
    setErr("");
    setJson(true);
  }, [rows]);

  const applyJson = useCallback(() => {
    try {
      const parsed = parseLooseJson(text);
      if (!Array.isArray(parsed)) throw new Error("Expected an array of rows, e.g. [ { … }, { … } ]");
      onChange(parsed);
      setErr("");
      setJson(false);
    } catch (e) {
      setErr(e.message);
    }
  }, [text, onChange]);

  /** Numeric columns keep real numbers in the JSON, so sorting stays correct. */
  const cellValue = (raw, type) =>
    NUMERIC_COL_TYPES.includes(type) && raw !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : raw;

  if (json) {
    return (
      <div className="dsbi-rows">
        <div className="dsbi-rowsbar">
          <span className="dsbi-badge">JSON</span>
          <div className="dsbi-rowsbar-r">
            <button type="button" className="dsbi-mini" onClick={() => setJson(false)}>
              Cancel
            </button>
            <button type="button" className="dsbi-mini is-primary" onClick={applyJson}>
              Apply
            </button>
          </div>
        </div>
        <textarea
          className="dsbi-input dsbi-code"
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder='[ { "PatientName": "Ramesh Kumar", "UHID": "UH-100234" } ]'
        />
        {err ? <div className="dsbi-jsonerr">{err}</div> : null}
        <p className="dsbi-note">
          Paste a real API response here to check the columns line up before switching to Dynamic API. A JavaScript
          array copied out of a page works too — unquoted keys, single quotes and a trailing comma are all accepted.
        </p>
      </div>
    );
  }

  return (
    <div className="dsbi-rows">
      <div className="dsbi-rowsbar">
        <span className="dsbi-badge">{rows.length} rows</span>
        <div className="dsbi-rowsbar-r">
          <button type="button" className="dsbi-mini" onClick={openJson} title="Edit or paste raw JSON">
            JSON
          </button>
          <button
            type="button"
            className="dsbi-mini"
            onClick={() => onChange(makeSampleRows(cols))}
            title="Replace with demo values that match the column names"
          >
            Sample
          </button>
          <button type="button" className="dsbi-mini" onClick={() => onChange([])} title="Remove every row">
            Clear
          </button>
        </div>
      </div>
      {cols.length === 0 ? (
        <p className="dsbi-note">Add a column first, or paste rows with JSON — rows are edited field by field.</p>
      ) : (
        <ListShell
          items={rows}
          onChange={onChange}
          addLabel="Add row"
          blank={() => blankRow(cols)}
          render={(row, patch) => (
            <div className="dsbi-rowgrid">
              {cols.map((c) => (
                <label key={c.key} className="dsbi-rowcell">
                  <span>{c.header || c.key}</span>
                  <DebouncedInput
                    value={row?.[c.key] ?? ""}
                    onChange={(v) => patch({ [c.key]: cellValue(v, c.type) })}
                    placeholder={c.key}
                  />
                </label>
              ))}
            </div>
          )}
        />
      )}
    </div>
  );
}

const ALIGN_OPTS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

/** How many lines of a long cell to keep before it is cut with an ellipsis. */
const CLAMP_OPTS = [
  { value: "", label: "Off (wrap)" },
  { value: "1", label: "1 line" },
  { value: "2", label: "2 lines" },
  { value: "3", label: "3 lines" },
];

/** Cell interaction, kept apart from `type` (which is only formatting). */
const CONTROL_TYPES = [
  { value: "none", label: "No control" },
  { value: "link", label: "Link (row click)" },
  { value: "button", label: "Button (row action)" },
  { value: "checkbox", label: "Checkbox" },
  { value: "icon", label: "Icon button (row action)" },
  { value: "editRow", label: "Edit button (fill form from row)" },
  { value: "iconOnly", label: "Icon / icon strip (no button, tooltip)" },
  { value: "text", label: "Textbox (editable)" },
  { value: "number", label: "Number box (editable)" },
  { value: "date", label: "Date box (editable)" },
  { value: "select", label: "Dropdown (editable)" },
  { value: "autocomplete", label: "Autocomplete (editable)" },
  { value: "textarea", label: "Text area (editable)" },
];

/** The controls that hold a value, so the form can offer value settings. */
const EDITABLE_CONTROLS = ["text", "number", "date", "select", "autocomplete", "textarea"];

/** Where an autocomplete cell's suggestions come from. */
const AC_SOURCES = [
  { value: "list", label: "A fixed list / data source — filtered here" },
  { value: "endpoint", label: "An endpoint — searched as you type" },
];

/** Which rows a Validate action checks for one editable column. */
const VALIDATE_ROWS = [
  { value: "all", label: "Every row" },
  { value: "edited", label: "Only rows edited by hand" },
  { value: "checked", label: "Only ticked rows" },
];

/**
 * The validation rules of an editable cell column, kept under `column.validation`.
 *
 * Nothing here is set until the designer turns a rule on, and an emptied
 * section removes the key — so a column that never used it is saved exactly
 * as before and is never checked.
 */
function CellValidationEditor({ draft, set, whenFields = [] }) {
  const v = draft.validation && typeof draft.validation === "object" ? draft.validation : {};
  const setRule = (patch) => {
    const next = { ...v, ...patch };
    Object.keys(next).forEach((k) => {
      const x = next[k];
      if (x === undefined || x === null || x === "" || x === false || (Array.isArray(x) && !x.length)) delete next[k];
    });
    // `rows`, `message` and `when` only shape a rule: kept only beside one.
    const ruleKeys = Object.keys(next).filter((k) => k !== "rows" && k !== "message" && k !== "when");
    set({ validation: ruleKeys.length ? next : undefined });
  };
  const textual = draft.control === "text" || draft.control === "textarea" || draft.control === "autocomplete";
  const typed = draft.control === "text" || draft.control === "textarea";
  const isNumber = draft.control === "number";
  const active = !!(v.required || v.minLength || v.regex || v.range);

  return (
    <div className="dsbi-sub">
      <div className="dsbi-sub-title">Validation</div>
      <div className="dsbi-cols-flags">
        <Toggle value={!!v.required} onChange={(on) => setRule({ required: on })} label="Required" />
        {isNumber ? (
          <Toggle value={!!v.range} onChange={(on) => setRule({ range: on })} label="Block values outside Min / Max" />
        ) : null}
      </div>
      {isNumber ? (
        <div className="dsbi-cols-flags">
          <Toggle value={!!v.hardLimit} onChange={(on) => setRule({ hardLimit: on })} label="Stop typing outside Min / Max" />
          <Toggle value={!!v.integer} onChange={(on) => setRule({ integer: on })} label="Whole numbers only" />
        </div>
      ) : null}
      {typed ? (
        <Field label="Allowed characters">
          <DebouncedInput
            value={v.allowChars || ""}
            onChange={(x) => setRule({ allowChars: x })}
            placeholder="e.g. 0-9   or   A-Za-z   (anything else cannot be typed)"
          />
        </Field>
      ) : null}
      {textual ? (
        <div className="dsbi-grid2">
          <Field label="Min length">
            <DebouncedInput value={v.minLength ?? ""} onChange={(x) => setRule({ minLength: x })} placeholder="None" />
          </Field>
          <Field label="Pattern (regex)">
            <DebouncedInput value={v.regex || ""} onChange={(x) => setRule({ regex: x })} placeholder="e.g. ^[0-9]{10}$" />
          </Field>
        </div>
      ) : null}
      {active ? (
        <div className="dsbi-grid2">
          <Field label="Check rows" hint="Which rows a Validate action looks at.">
            <SelectBox
              allowEmpty={false}
              value={v.rows || "all"}
              onChange={(x) => setRule({ rows: x === "all" ? undefined : x })}
              options={VALIDATE_ROWS}
            />
          </Field>
          <Field label="Error message" hint="Blank uses the built-in message.">
            <DebouncedInput value={v.message || ""} onChange={(x) => setRule({ message: x })} placeholder="This field is required" />
          </Field>
        </div>
      ) : null}
      {active ? (
        <>
          <div className="dsbi-sub-title">Validate only when</div>
          <WhenRows value={v.when} onChange={(x) => setRule({ when: x })} fieldOptions={whenFields} />
        </>
      ) : null}
      <p className="dsbi-note">
        A failing cell turns red, with the message as its tooltip, once it has been left. A <b>Validate</b> action,
        or any <b>Call API</b> / <b>For each</b> whose settings read <code>{"{{grid.<table id>…}}"}</code>, checks
        every cell first and stops the chain if one fails. Locked or hidden cells are skipped. With conditions under{" "}
        <b>Validate only when</b>, the rules apply only on rows where every line holds — e.g. <i>Required</i> only when{" "}
        <code>PrintType</code> equals 2.
        {isNumber && !v.range && !v.hardLimit ? " Min / Max above only limit the spinner until a toggle here is on." : ""}
      </p>
    </div>
  );
}

/**
 * The control type picker: the same grouped, colour-coded list the action
 * picker uses, so twelve controls read as four families rather than a wall of
 * text in an OS-drawn <select>.
 */
const CONTROL_GROUPS = [
  { key: "show", label: "Show only", tone: "lavender" },
  { key: "act", label: "Row actions", tone: "sky" },
  { key: "tick", label: "Select rows", tone: "butter" },
  { key: "edit", label: "Editable cells", tone: "mint" },
];
const CONTROL_META = {
  none: { g: "show", icon: "Minus", hint: "Plain value, nothing to click" },
  link: { g: "show", icon: "Link", hint: "Value as a link that runs the row click" },
  iconOnly: { g: "show", icon: "Info", hint: "Bare icon with a tooltip — a flag or status" },
  button: { g: "act", icon: "MousePointerClick", hint: "A button that runs actions for the row" },
  icon: { g: "act", icon: "RectangleHorizontal", hint: "An icon button that runs actions for the row" },
  editRow: { g: "act", icon: "Pencil", hint: "Fills the form from the row to edit it" },
  checkbox: { g: "tick", icon: "SquareCheck", hint: "Tick rows for a save or bulk action" },
  text: { g: "edit", icon: "TextCursorInput", hint: "Type a value in the cell" },
  number: { g: "edit", icon: "Hash", hint: "Numbers only, with min / max / step" },
  date: { g: "edit", icon: "CalendarDays", hint: "Pick a date in the cell" },
  select: { g: "edit", icon: "SquareChevronDown", hint: "Pick one of a list" },
  autocomplete: { g: "edit", icon: "Search", hint: "Type to search a list or an endpoint, pick one" },
  textarea: { g: "edit", icon: "AlignLeft", hint: "Several lines of text" },
};
const controlMeta = (v) => CONTROL_META[v] || CONTROL_META.none;
const controlGroup = (key) => CONTROL_GROUPS.find((x) => x.key === key) || CONTROL_GROUPS[0];

function ControlTypePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const anchorRef = useRef(null);
  const listRef = useRef(null);
  const cur = value || "none";
  const close = useCallback(() => {
    setOpen(false);
    setQ("");
  }, []);

  const all = useMemo(() => {
    const order = CONTROL_GROUPS.map((g) => g.key);
    return CONTROL_TYPES.map((t, i) => ({ ...t, ...controlMeta(t.value), i })).sort(
      (a, b) => order.indexOf(a.g) - order.indexOf(b.g) || a.i - b.i,
    );
  }, []);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return all;
    return all.filter((t) => `${t.label} ${t.value} ${t.hint} ${controlGroup(t.g).label}`.toLowerCase().includes(n));
  }, [all, q]);
  useEffect(() => {
    setActive(Math.max(0, rows.findIndex((r) => r.value === cur)));
  }, [rows, cur, open]);
  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => {
      const el = listRef.current?.querySelector(`[data-i="${active}"]`);
      if (el?.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [active, open]);

  const pick = (t) => {
    if (t && t.value !== cur) onChange(t.value);
    close();
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(rows[active]);
    }
  };

  const curType = CONTROL_TYPES.find((t) => t.value === cur) || CONTROL_TYPES[0];
  const curMeta = controlMeta(cur);
  return (
    <div className="dsbi-act" ref={anchorRef}>
      <Tap
        className={`dsbi-act-btn is-${controlGroup(curMeta.g).tone} ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        title={curType.label}
      >
        <span className="dsbi-act-ic">
          <Icon name={curMeta.icon} size={13} />
        </span>
        <span className="dsbi-act-name">{curType.label}</span>
        <span className="dsbi-act-chev">
          <Icon name="ChevronDown" size={14} />
        </span>
      </Tap>
      <Popover
        anchorRef={anchorRef}
        open={open}
        onClose={close}
        align="left"
        maxH={440}
        className="dsbi-act-pop"
        width={Math.max(anchorRef.current?.offsetWidth || 0, 300)}
      >
        <input
          className="dsbi-input dsbi-popsearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search controls: button, dropdown, date…"
          autoFocus
          spellCheck={false}
        />
        <div className="dsbi-act-list" ref={listRef}>
          {rows.map((t, i) => {
            const g = controlGroup(t.g);
            return (
              <React.Fragment key={t.value}>
                {t.g !== rows[i - 1]?.g ? <div className={`dsbi-act-group is-${g.tone}`}>{g.label}</div> : null}
                <Tap
                  data-i={i}
                  className={`dsbi-act-opt is-${g.tone} ${i === active ? "is-active" : ""} ${t.value === cur ? "is-on" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(t)}
                >
                  <span className="dsbi-act-ic">
                    <Icon name={t.icon} size={14} />
                  </span>
                  <span className="dsbi-act-txt">
                    <b>{t.label}</b>
                    {t.hint ? <small>{t.hint}</small> : null}
                  </span>
                  {t.value === cur ? (
                    <span className="dsbi-act-tick">
                      <Icon name="Check" size={14} />
                    </span>
                  ) : null}
                </Tap>
              </React.Fragment>
            );
          })}
          {!rows.length ? <div className="dsbi-combo-empty">No control matches</div> : null}
        </div>
      </Popover>
    </div>
  );
}

/** Common widths, but the box takes anything — "120", "120px" or "10%". */
const WIDTH_PRESETS = ["5%", "10%", "15%", "20%", "25%", "30%", "40%", "50%", "80", "100", "120", "150", "180", "220", "260"];

/**
 * A row-number column, ready to add.
 *
 * It describes itself completely — no field, no sort, narrow and centred —
 * so it is offered as one button rather than as five settings someone has to
 * find and fill in. The Field type list still carries it, for a column that is
 * being changed into one.
 */
const serialColumn = () => ({
  key: "SrNo",
  header: "Sr No.",
  type: "serial",
  control: "none",
  width: 70,
  align: "center",
  sortable: false,
  visible: true,
  bold: false,
  isTotal: false,
  chipRules: [],
});

const blankColumn = () => ({
  key: "",
  header: "",
  type: "text",
  control: "none",
  width: 150,
  align: "left",
  sortable: true,
  visible: true,
  bold: false,
  isTotal: false,
  // Long values wrap, as they always have — a clamp is opt-in per column, and
  // brings the whole value back on hover.
  clamp: "",
  maxChars: "",
  // Wording shown in place of a stored code: [{ value: "IN", label: "Patient admitted" }]
  valueLabels: [],
  chipRules: [],
  // Chip colours that need no rule: a field of the row that carries the colour,
  // and what a row gets when it does not carry one. See resolveChipColor.
  colorField: "",
  textColorField: "",
  defaultBg: "",
  defaultFg: "",
});

/**
 * The conditions an action runs under — `act.when`.
 *
 * Stored as a single condition when there is one and a list when there are
 * more, because that is what the runtime accepts and because a screen saved
 * before this has the single form. Every condition must hold, which is what
 * lets "print type 2 AND not an IPD receipt" be said at all — the case that
 * made one condition insufficient the first time this was needed.
 */
export function WhenRows({ value, onChange, fieldOptions }) {
  const list = Array.isArray(value) ? value : value && value.op ? [value] : [];
  const write = (next) => {
    const live = next.filter((c) => c && (c.field || c.op));
    onChange(live.length === 0 ? undefined : live.length === 1 ? live[0] : live);
  };
  const setJoin = (i, join) => write(list.map((x, j) => (j === i ? { ...x, join: join === "or" ? "or" : undefined } : x)));
  const add = (join) => write([...list, { field: "", op: "eq", value: "", ...(join === "or" && list.length ? { join: "or" } : {}) }]);
  return (
    <div className="dsbi-when">
      {list.map((c, i) => (
        <Fragment key={i}>
        {i === 0 ? null : (
          <div className="dsbi-when-join" role="radiogroup" aria-label="Join with the condition above">
            {["and", "or"].map((j) => (
              <Tap
                key={j}
                role="radio"
                aria-checked={(c.join === "or" ? "or" : "and") === j}
                className={`dsbi-when-joinbtn${(c.join === "or" ? "or" : "and") === j ? " is-on" : ""}`}
                title={j === "or" ? "Either side may hold" : "Both sides must hold"}
                onClick={() => setJoin(i, j)}
              >
                {j.toUpperCase()}
              </Tap>
            ))}
          </div>
        )}
        <div className="dsbi-grid3">
          <Combo
            value={c.field}
            onChange={(v) => write(list.map((x, j) => (j === i ? { ...x, field: v } : x)))}
            options={fieldOptions}
            placeholder="Pick a field…"
            searchPlaceholder="Search fields…"
            allowCustom
            customLabel={(v) => `Use "${v}"`}
          />
          <SelectBox
            value={c.op}
            onChange={(v) => write(list.map((x, j) => (j === i ? { ...x, op: v } : x)))}
            options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))}
            placeholder="op"
          />
          <div className="dsbi-when-val">
            <DebouncedInput
              value={c.value}
              onChange={(v) => write(list.map((x, j) => (j === i ? { ...x, value: v } : x)))}
              placeholder="Value"
            />
            <Tap className="tone-danger dsbi-mini is-icon is-danger" title="Remove" onClick={() => write(list.filter((x, j) => j !== i))}>
              <Icon name="Trash2" size={11} />
            </Tap>
          </div>
        </div>
        </Fragment>
      ))}
      {list.length ? (
        <div className="dsbi-when-add">
          <Tap className="tone-add dsbi-mini" onClick={() => add("and")}>
            <Icon name="Plus" size={11} /> and also
          </Tap>
          <Tap className="tone-info dsbi-mini" onClick={() => add("or")}>
            <Icon name="Plus" size={11} /> or else
          </Tap>
        </div>
      ) : (
        <Tap className="tone-add dsbi-mini" onClick={() => add("and")}>
          <Icon name="Plus" size={11} /> Add a condition
        </Tap>
      )}
      {list.some((c, i) => i > 0 && c.join === "or") && list.some((c, i) => i > 0 && c.join !== "or") ? (
        <p className="dsbi-rules-note">AND binds first: A AND B OR C runs when (A and B) hold, or C holds.</p>
      ) : null}
    </div>
  );
}

/**
 * Column designer: a form above, the current columns as a table below.
 *
 * The table is the point — a column list is read far more often than it is
 * edited, and a stack of expanded forms (what this used to be) makes twelve
 * columns unreadable. So editing happens in one form at the top, and the table
 * shows every column's shape at a glance with edit, delete and drag-to-reorder
 * on each row.
 *
 * `fieldKeys` are the keys the component's data actually has — from a Sync, or
 * from the static rows — so the key is picked from a list instead of retyped
 * and misspelt.
 */
/** How a column action's {{row.…}} fields are labelled under Map…. */
const ROW_SOURCE = "the clicked row";

export function ColumnsEditor({ value, onChange, palette, fieldKeys = [], formFields = [], nodes = [], dataSources = {}, patchNode }) {
  const items = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [editing, setEditing] = useState(-1); // -1 = the "add" form
  const [draft, setDraft] = useState(blankColumn);
  const [dragFrom, setDragFrom] = useState(-1);
  const [dragOver, setDragOver] = useState(-1);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // The fields a column rule may test: the row's own, by bare name, and the
  // screen's form fields — which live under `values.` at run time, so they are
  // offered by that path (a bare form-field name reads nothing off the row).
  const whenFields = useMemo(
    () => [
      ...(fieldKeys || []),
      ...(formFields || []).map((k) => ({ value: `values.${k}`, label: `Field · ${k}`, search: `values ${k}` })),
    ],
    [fieldKeys, formFields],
  );

  const keyOptions = useMemo(() => {
    const used = new Set(items.map((c) => c.key));
    return (fieldKeys || []).map((k) => ({
      value: k,
      // Marked rather than removed: re-picking a used key is how you correct a
      // column that was pointed at the wrong field.
      label: used.has(k) && k !== draft.key ? `${k} — in use` : k,
    }));
  }, [fieldKeys, items, draft.key]);

  const chipCols = useMemo(
    () => items.map((col, index) => ({ col, index })).filter(({ col }) => col.type === "chip"),
    [items],
  );
  // What an Edit button's fill can be narrowed to — the same list the Fill
  // form action offers.
  const containerOptions = useMemo(
    () =>
      (nodes || [])
        .filter((n) => getDef(n.type)?.isContainer && !String(n.id).startsWith("root"))
        .map((n) => ({ value: n.id, label: `${n.name} (${n.type})` })),
    [nodes],
  );
  // The response's own field names, offered to the colour-source inputs below.
  const listSeed = useId();
  const fieldListId = `dsbi-fk-${listSeed}`;
  const patchCol = (index, patch) => onChange(items.map((c, j) => (j === index ? { ...c, ...patch } : c)));

  const startEdit = (i) => {
    setEditing(i);
    setDraft({ ...blankColumn(), ...items[i] });
  };
  const cancel = () => {
    setEditing(-1);
    setDraft(blankColumn());
  };

  const commit = () => {
    if (!draft.key) return;
    const clean = { ...draft, header: draft.header || humanize(draft.key) };
    onChange(editing >= 0 ? items.map((c, i) => (i === editing ? clean : c)) : [...items, clean]);
    cancel();
  };

  const remove = (i) => {
    onChange(items.filter((_, j) => j !== i));
    if (editing === i) cancel();
    else if (editing > i) setEditing(editing - 1);
  };

  /* --------------------------------------------------------- drag to sort */

  const drop = (to) => {
    if (dragFrom < 0 || dragFrom === to) return;
    const next = [...items];
    const [moved] = next.splice(dragFrom, 1);
    next.splice(to, 0, moved);
    onChange(next);
    // The row being edited travels with it, so Update still hits the same column.
    if (editing === dragFrom) setEditing(to);
    else if (editing > dragFrom && editing <= to) setEditing(editing - 1);
    else if (editing < dragFrom && editing >= to) setEditing(editing + 1);
    setDragFrom(-1);
    setDragOver(-1);
  };

  return (
    <div className="dsbi-cols">
      <div className="dsbi-cols-form">
        <div className="dsbi-cols-formhead">
          <span>{editing >= 0 ? `Edit column ${editing + 1}` : "Add a column"}</span>
          {editing < 0 && !items.some((c) => c.type === "serial") ? (
            <button
              type="button"
              className="dsbi-mini"
              // Straight to the front: a row number that is not the first column
              // is not a row number, it is a puzzle.
              title="Add a Sr No. column at the front of the table"
              onClick={() => onChange([serialColumn(), ...items])}
            >
              <Icon name="Plus" size={12} /> Sr No.
            </button>
          ) : null}
        </div>

        <div className="dsbi-grid2">
          <Field label="Table key list">
            {keyOptions.length ? (
              <Combo
                value={draft.key}
                onChange={(v) => set({ key: v, header: draft.header || humanize(v) })}
                options={keyOptions}
                placeholder="Select a field"
                searchPlaceholder="Search or type a new field…"
                emptyText="No matching field — type a name to add one"
                allowCustom
                customLabel={(v) => `Add new field "${v}"`}
              />
            ) : (
              <DebouncedInput value={draft.key} onChange={(v) => set({ key: v })} placeholder="Field key" />
            )}
          </Field>
          <Field label="Table column name">
            <DebouncedInput value={draft.header} onChange={(v) => set({ header: v })} placeholder="Header" />
          </Field>
        </div>
        <Field label="Header icon">
          <IconField
            value={draft.headerIcon || ""}
            onChange={(v) => set({ headerIcon: v })}
            suggestFrom={draft.header || draft.key}
          />
        </Field>

        {/* A column the endpoint never sent as such: one field falling back to
            another, or two of them put together. */}
        {!["actions", "frameMenu", "serial"].includes(draft.type) ? (
          <Field label="Value template">
            <TemplateField
              value={draft.valueTemplate || ""}
              onChange={(v) => set({ valueTemplate: v })}
              rowFields={fieldKeys}
              placeholder="{{row.ActualStartDate | default:row.RegistrationDate}}"
            />
          </Field>
        ) : null}

        {draft.key && draft.type !== "serial" && fieldKeys.length > 0 && !fieldKeys.includes(draft.key) ? (
          <p className="dsbi-note">
            <b>{draft.key}</b> is not in the data the grid has. That is fine for a column people fill in —
            give it an editable Control type — and for a field a later response will carry. As a plain
            column it shows blank cells.
          </p>
        ) : null}

        <div className="dsbi-grid2">
          <Field label="Column width">
            <DebouncedInput value={draft.width ?? ""} onChange={(v) => set({ width: v })} placeholder="150 or 10%" list="dsbi-widths" />
          </Field>
          <Field label="Column alignment">
            <SelectBox value={draft.align} onChange={(v) => set({ align: v })} options={ALIGN_OPTS} placeholder="Left" />
          </Field>
        </div>

        <div className="dsbi-grid2">
          <Field label="Truncate cell">
            <SelectBox
              value={draft.clamp ?? ""}
              onChange={(v) => set({ clamp: v })}
              options={CLAMP_OPTS}
              placeholder="Off (wrap)"
            />
          </Field>
          <Field label="Max characters">
            <DebouncedInput
              type="number"
              value={draft.maxChars ?? ""}
              onChange={(v) => set({ maxChars: v })}
              placeholder="25"
              disabled={draft.shortenText === false}
            />
          </Field>
        </div>
        <Row
          label="Shorten long text"
          hint="On (the default): text longer than Max characters (25 when empty) is cut with … and the whole value shows in a tooltip on hover. Off: the full value is shown, wrapping or running on."
        >
          <Toggle value={draft.shortenText !== false} onChange={(v) => set({ shortenText: v ? undefined : false })} />
        </Row>

        <div className="dsbi-grid2">
          <Field label="Field type">
            <SelectBox
              allowEmpty={false}
              value={draft.type}
              // A row number is the one column that describes itself: it needs
              // no field in the data, sorts by nothing, and is always narrow.
              // Filling those in beats making someone guess what to type.
              onChange={(v) =>
                set(
                  v === "serial"
                    ? {
                        type: v,
                        key: draft.key || "SrNo",
                        header: draft.header || "Sr No.",
                        sortable: false,
                        align: "center",
                        width: draft.width && draft.width !== 150 ? draft.width : 70,
                      }
                    : { type: v },
                )
              }
              options={COLUMN_TYPES}
              placeholder="Text"
            />
          </Field>
          <Field label="Control type">
            <ControlTypePicker
              value={draft.control}
              onChange={(v) => {
                // Icon button <-> icon (no button) is a change of look only.
                // The icon, tooltip, strip and On click are shared keys and
                // carry over untouched; an icon button with no On click of
                // its own runs the table's onRowAction, so the icon it turns
                // into keeps doing that too.
                const wasClickable = draft.control === "icon" || draft.control === "button";
                if (v === "iconOnly" && wasClickable && !(draft.onClick || []).length) set({ control: v, rowAction: true });
                // An Edit button arrives looking like one.
                else if (v === "editRow") set({ control: v, icon: draft.icon || "Pencil", title: draft.title || "Edit" });
                else set({ control: v });
              }}
            />
          </Field>
        </div>

        <div className="dsbi-cols-flags">
          <Toggle value={!!draft.isTotal} onChange={(v) => set({ isTotal: v })} label="Is total column" />
          <Toggle value={!!draft.bold} onChange={(v) => set({ bold: v })} label="Is bold" />
          <Toggle value={draft.visible !== false} onChange={(v) => set({ visible: v })} label="Visible" />
          <Toggle value={draft.sortable !== false} onChange={(v) => set({ sortable: v })} label="Sortable" />
          <Toggle value={!!draft.wrap} onChange={(v) => set({ wrap: v })} label="Wrap long text" />
          <Toggle
            value={draft.exportable !== false}
            onChange={(v) => set({ exportable: v })}
            label="Include in export"
          />
        </div>

        {/* A date the browser's locale would otherwise decide, and a currency
            that would otherwise be rupees. Blank means the app's own setting. */}
        {draft.type === "date" || draft.type === "datetime" ? (
          <Field label="Date format" hint="Blank uses the app's format (VITE_DATE_FORMAT).">
            <DebouncedInput
              value={draft.format || ""}
              onChange={(v) => set({ format: v })}
              placeholder="DD-MMM-YYYY"
            />
          </Field>
        ) : null}
        {draft.type === "currency" ? (
          <Field label="Currency symbol" hint="Blank uses the centre's own.">
            <DebouncedInput
              value={draft.currencySymbol || ""}
              onChange={(v) => set({ currencySymbol: v })}
              placeholder="₹"
            />
          </Field>
        ) : null}

        {draft.control === "checkbox" ? (
          <div className="dsbi-cols-flags">
            <Toggle
              value={draft.headerCheckbox !== false}
              onChange={(v) => set({ headerCheckbox: v })}
              label="Select all in header"
            />
            <Toggle
              value={draft.defaultValue === true}
              onChange={(v) => set({ defaultValue: v ? true : undefined })}
              label="Ticked by default"
            />
          </div>
        ) : null}

        {/* What the cell starts as when the endpoint does not send the field.
            A binding is allowed, which is how a cell is seeded from the search
            that found the row. */}
        {EDITABLE_CONTROLS.includes(draft.control) && draft.control !== "checkbox" ? (
          <Field label="Default when empty" hint="Used only when the row has no value for this field.">
            <DebouncedInput
              value={draft.defaultValue ?? ""}
              onChange={(v) => set({ defaultValue: v === "" ? undefined : v })}
              placeholder="{{values.PrintType}}"
            />
          </Field>
        ) : null}

        {EDITABLE_CONTROLS.includes(draft.control) ? (
          <>
            <p className="dsbi-note">
              Typed values are kept per row and reach a save action as{" "}
              <code>{"{{grid." + "<table id>" + ".edited}}"}</code> (only the rows changed),{" "}
              <code>{"{{grid.<table id>.rows}}"}</code> (all of them) or{" "}
              <code>{"{{grid.<table id>.checked}}"}</code> (only the ticked ones). Each edit also fires
              the table's <b>onCellChange</b> event.
            </p>

            <div className="dsbi-grid2">
              <Field label="Placeholder">
                <DebouncedInput
                  value={draft.placeholder || ""}
                  onChange={(v) => set({ placeholder: v })}
                  placeholder="Shown while empty"
                />
              </Field>
              {draft.control === "textarea" ? (
                <Field label="Rows">
                  <DebouncedInput value={draft.rows ?? ""} onChange={(v) => set({ rows: v })} placeholder="2" />
                </Field>
              ) : draft.control === "text" ? (
                <Field label="Max length">
                  <DebouncedInput value={draft.maxLength ?? ""} onChange={(v) => set({ maxLength: v })} placeholder="No limit" />
                </Field>
              ) : null}
            </div>

            {draft.control === "number" ? (
              <div className="dsbi-grid3">
                <Field label="Min">
                  <DebouncedInput value={draft.min ?? ""} onChange={(v) => set({ min: v })} placeholder="None" />
                </Field>
                <Field label="Max">
                  <DebouncedInput value={draft.max ?? ""} onChange={(v) => set({ max: v })} placeholder="None" />
                </Field>
                <Field label="Step">
                  <DebouncedInput value={draft.step ?? ""} onChange={(v) => set({ step: v })} placeholder="1" />
                </Field>
              </div>
            ) : null}

            {draft.control === "select" ? (
              <div className="dsbi-sub">
                <div className="dsbi-sub-title">Dropdown options</div>
                <OptionsEditor value={draft.options || []} onChange={(v) => set({ options: v })} />
                <p className="dsbi-note">
                  Or fill them from a screen data source — leave the list empty and name the source below.
                </p>
                <div className="dsbi-grid3">
                  <Field label="Data source id">
                    <DebouncedInput
                      value={draft.optionsSourceId || ""}
                      onChange={(v) => set({ optionsSourceId: v })}
                      placeholder="e.g. doctors"
                    />
                  </Field>
                  <Field label="Label field">
                    <DebouncedInput
                      value={draft.optionLabelField || ""}
                      onChange={(v) => set({ optionLabelField: v })}
                      placeholder="label"
                    />
                  </Field>
                  <Field label="Value field">
                    <DebouncedInput
                      value={draft.optionValueField || ""}
                      onChange={(v) => set({ optionValueField: v })}
                      placeholder="value"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {draft.control === "autocomplete" ? (
              <div className="dsbi-sub">
                <div className="dsbi-sub-title">Autocomplete suggestions</div>
                <Field label="Suggestions from">
                  <SelectBox
                    allowEmpty={false}
                    value={draft.acSource || "list"}
                    onChange={(v) => set({ acSource: v === "list" ? undefined : v })}
                    options={AC_SOURCES}
                  />
                </Field>
                {draft.acSource === "endpoint" ? (
                  <>
                    <ApiPicker value={draft.searchApi} onChange={(v) => set({ searchApi: v })} mode="call" />
                    <div className="dsbi-grid2">
                      <Field label="Search parameter" hint="The typed text goes here — or put {{search}} in any parameter.">
                        <DebouncedInput
                          value={draft.searchParam || ""}
                          onChange={(v) => set({ searchParam: v })}
                          placeholder="prefix / SearchText"
                        />
                      </Field>
                      <Field label="Second line" hint="A smaller line under each suggestion.">
                        <DebouncedInput
                          value={draft.subLabelField || ""}
                          onChange={(v) => set({ subLabelField: v })}
                          placeholder="Rate / Category"
                        />
                      </Field>
                    </div>
                    <div className="dsbi-grid2">
                      <Field label="Label field" hint="What each suggestion reads.">
                        <DebouncedInput
                          value={draft.optionLabelField || ""}
                          onChange={(v) => set({ optionLabelField: v })}
                          placeholder="label"
                        />
                      </Field>
                      <Field label="Value field" hint="What the cell keeps. Empty keeps the label.">
                        <DebouncedInput
                          value={draft.optionValueField || ""}
                          onChange={(v) => set({ optionValueField: v })}
                          placeholder="value"
                        />
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <OptionsEditor value={draft.options || []} onChange={(v) => set({ options: v })} />
                    <p className="dsbi-note">
                      Or fill them from a screen data source — leave the list empty and name the source below.
                    </p>
                    <div className="dsbi-grid3">
                      <Field label="Data source id">
                        <DebouncedInput
                          value={draft.optionsSourceId || ""}
                          onChange={(v) => set({ optionsSourceId: v })}
                          placeholder="e.g. doctors"
                        />
                      </Field>
                      <Field label="Label field">
                        <DebouncedInput
                          value={draft.optionLabelField || ""}
                          onChange={(v) => set({ optionLabelField: v })}
                          placeholder="label"
                        />
                      </Field>
                      <Field label="Value field">
                        <DebouncedInput
                          value={draft.optionValueField || ""}
                          onChange={(v) => set({ optionValueField: v })}
                          placeholder="value"
                        />
                      </Field>
                    </div>
                  </>
                )}
                <div className="dsbi-grid3">
                  <Field label="Search after (chars)">
                    <DebouncedInput value={draft.minChars ?? ""} onChange={(v) => set({ minChars: v })} placeholder="1" />
                  </Field>
                  <Field label="Most suggestions">
                    <DebouncedInput value={draft.maxResults ?? ""} onChange={(v) => set({ maxResults: v })} placeholder="All" />
                  </Field>
                  <Field label="No-results text">
                    <DebouncedInput
                      value={draft.emptyMessage || ""}
                      onChange={(v) => set({ emptyMessage: v })}
                      placeholder="No results found"
                    />
                  </Field>
                </div>
                <div className="dsbi-cols-flags">
                  <Toggle
                    value={draft.acDropdown !== false}
                    onChange={(v) => set({ acDropdown: v ? undefined : false })}
                    label="Show dropdown button"
                  />
                  <Toggle
                    value={!!draft.forceSelection}
                    onChange={(v) => set({ forceSelection: v || undefined })}
                    label="Only a picked value counts"
                  />
                </div>
                <p className="dsbi-note">
                  The cell keeps the picked value. <b>onCellChange</b> also gets the whole picked record as{" "}
                  <code>{"{{record.Field}}"}</code> and its text as <code>{"{{label}}"}</code>.
                </p>
              </div>
            ) : null}

            <CellValidationEditor draft={draft} set={set} whenFields={whenFields} />
          </>
        ) : null}

        {draft.control === "iconOnly" ? (
          <>
            <p className="dsbi-note">
              A bare icon with a floating tooltip — no button chrome. Leave <b>On click</b> empty and it stays a flag;
              add actions and it becomes clickable.
            </p>

            <div className="dsbi-sub">
              <div className="dsbi-sub-title">Icons in this cell</div>
              <ActionsEditor
                value={draft.icons || []}
                onChange={(v) => set({ icons: v })}
                nodes={nodes}
                dataSources={dataSources}
                patchNode={patchNode}
                rowFields={fieldKeys}
                rowSource={ROW_SOURCE}
              />
              <p className="dsbi-note">
                Add two or more and the cell becomes a strip — each icon with its own click, tooltip and show-when
                condition. Leave the list empty to keep the single icon configured below.
              </p>
            </div>

            <div className="dsbi-grid2">
              {(draft.icons || []).length ? null : (
                <Field label="Icon">
                  <IconField value={draft.icon} onChange={(v) => set({ icon: v })} suggestFrom={draft.header || draft.label || draft.key} />
                </Field>
              )}
              <Field label={(draft.icons || []).length ? "Default icon colour" : "Icon colour"}>
                <ColorField value={draft.iconColor} onChange={(v) => set({ iconColor: v })} palette={palette} />
              </Field>
            </div>

            <div className="dsbi-grid2">
              <Field label={(draft.icons || []).length ? "Default icon size" : "Icon size"}>
                <DebouncedInput value={draft.iconSize ?? ""} onChange={(v) => set({ iconSize: v })} placeholder="16" />
              </Field>
              {(draft.icons || []).length ? (
                <Field label="Gap (px)">
                  <DebouncedInput value={draft.gap ?? ""} onChange={(v) => set({ gap: v })} placeholder="6" />
                </Field>
              ) : (
                <Field label="Icon from field">
                  <SelectBox
                    value={draft.iconField || ""}
                    onChange={(v) => set({ iconField: v })}
                    options={[{ value: "", label: "Fixed icon above" }, ...keyOptions]}
                  />
                </Field>
              )}
            </div>

            {(draft.icons || []).length ? null : (
              <>
                <div className="dsbi-grid2">
                  <Field label="Tooltip text">
                    <DebouncedInput
                      value={draft.title || ""}
                      onChange={(v) => set({ title: v })}
                      placeholder="Column name"
                    />
                  </Field>
                  <Field label="Tooltip from field">
                    <SelectBox
                      value={draft.tipField || ""}
                      onChange={(v) => set({ tipField: v })}
                      options={[{ value: "", label: "Tooltip text above" }, ...keyOptions]}
                    />
                  </Field>
                </div>
                <p className="dsbi-note">
                  A row whose tooltip field is empty falls back to the tooltip text, then to the column header.
                </p>

                <div className="dsbi-sub">
                  <div className="dsbi-sub-title">On click (optional)</div>
                  <ActionListEditor
                    value={draft.onClick || []}
                    onChange={(v) => set({ onClick: v })}
                    nodes={nodes}
                    dataSources={dataSources}
                    patchNode={patchNode}
                    rowFields={fieldKeys}
                    rowSource={ROW_SOURCE}
                  />
                  {(draft.onClick || []).length ? null : (
                    <Toggle
                      value={!!draft.rowAction}
                      onChange={(v) => set({ rowAction: v || undefined })}
                      label="With On click empty, run the table's onRowAction (like an icon button)"
                    />
                  )}
                </div>
              </>
            )}
          </>
        ) : null}

        {draft.control === "button" || draft.control === "icon" ? (
          <>
            <p className="dsbi-note">
              Clicking it fires the table's <b>onRowAction</b> event with that row — wire it under Events.
            </p>

            <div className="dsbi-grid2">
              <Field label="Icon">
                <IconField value={draft.icon} onChange={(v) => set({ icon: v })} suggestFrom={draft.header || draft.label || draft.key} />
              </Field>
              <Field label="Icon colour">
                <ColorField value={draft.iconColor} onChange={(v) => set({ iconColor: v })} palette={palette} />
              </Field>
            </div>

            {draft.control === "icon" ? (
              <div className="dsbi-grid2">
                <Field label="Tooltip">
                  <DebouncedInput
                    value={draft.title || ""}
                    onChange={(v) => set({ title: v })}
                    placeholder="Column name"
                  />
                </Field>
                <Field label="Icon size">
                  <DebouncedInput value={draft.iconSize ?? ""} onChange={(v) => set({ iconSize: v })} placeholder="15" />
                </Field>
                <Field label="Icon from field">
                  <SelectBox
                    value={draft.iconField || ""}
                    onChange={(v) => set({ iconField: v })}
                    options={[{ value: "", label: "Fixed icon above" }, ...keyOptions]}
                  />
                </Field>
                <Field label="Tooltip from field">
                  <SelectBox
                    value={draft.tipField || ""}
                    onChange={(v) => set({ tipField: v })}
                    options={[{ value: "", label: "Tooltip text" }, ...keyOptions]}
                  />
                </Field>
              </div>
            ) : (
              <div className="dsbi-grid2">
                <Field label="Button text">
                  <DebouncedInput
                    value={draft.buttonText || ""}
                    onChange={(v) => set({ buttonText: v })}
                    placeholder="Cell value"
                  />
                </Field>
                <Field label="Button class">
                  <DebouncedInput
                    value={draft.buttonClass || ""}
                    onChange={(v) => set({ buttonClass: v })}
                    placeholder="btn btn-sm btn-success px-3"
                  />
                </Field>
              </div>
            )}

            {draft.control === "icon" && (draft.icons || []).length ? (
              <div className="dsbi-sub">
                <div className="dsbi-sub-title">Icons in this cell</div>
                <ActionsEditor
                  value={draft.icons || []}
                  onChange={(v) => set({ icons: v })}
                  nodes={nodes}
                  dataSources={dataSources}
                  patchNode={patchNode}
                  rowFields={fieldKeys}
                  rowSource={ROW_SOURCE}
                />
                <p className="dsbi-note">
                  Kept from the icon look: the cell draws this strip, each icon with its own click. Empty the list to go
                  back to the single icon above.
                </p>
              </div>
            ) : draft.control === "icon" ? (
              <p className="dsbi-note">
                Several icons in one cell? Set <b>Field type</b> to <b>Action buttons</b> instead — that one takes a
                list.
              </p>
            ) : null}

            <div className="dsbi-sub">
              <div className="dsbi-sub-title">On click</div>
              <ActionListEditor
                value={draft.onClick || []}
                onChange={(v) => set({ onClick: v })}
                nodes={nodes}
                dataSources={dataSources}
                patchNode={patchNode}
                rowFields={fieldKeys}
                rowSource={ROW_SOURCE}
              />
              <p className="dsbi-note">
                These run for THIS column only, with <code>{"{{row.Field}}"}</code> available. Leave the list empty and
                the click falls back to the table's <b>onRowAction</b> event.
              </p>
            </div>
          </>
        ) : null}

        {draft.control === "editRow" ? (
          <>
            <div className="dsbi-grid2">
              <Field label="Icon">
                <IconField value={draft.icon} onChange={(v) => set({ icon: v })} suggestFrom="Edit" />
              </Field>
              <Field label="Icon colour">
                <ColorField value={draft.iconColor} onChange={(v) => set({ iconColor: v })} palette={palette} />
              </Field>
              <Field label="Tooltip">
                <DebouncedInput value={draft.title || ""} onChange={(v) => set({ title: v })} placeholder="Edit" />
              </Field>
              <Field label="Icon size">
                <DebouncedInput value={draft.iconSize ?? ""} onChange={(v) => set({ iconSize: v })} placeholder="15" />
              </Field>
            </div>

            <div className="dsbi-sub">
              <div className="dsbi-sub-title">Fill the form</div>
              <FillFormSettings
                value={{
                  within: draft.fillWithin,
                  editVar: draft.editVar,
                  onlyMapped: draft.fillOnlyMapped,
                  map: draft.fillMap,
                  skip: draft.fillSkip,
                }}
                onChange={(p) => {
                  const keys = { within: "fillWithin", editVar: "editVar", onlyMapped: "fillOnlyMapped", map: "fillMap", skip: "fillSkip" };
                  set(Object.fromEntries(Object.entries(p).map(([k, v]) => [keys[k] || k, v])));
                }}
                formFields={formFields}
                rowFields={fieldKeys}
                containerOptions={containerOptions}
              />
            </div>

            <div className="dsbi-sub">
              <div className="dsbi-sub-title">Then run (optional)</div>
              <ActionListEditor
                value={draft.onClick || []}
                onChange={(v) => set({ onClick: v })}
                nodes={nodes}
                dataSources={dataSources}
                patchNode={patchNode}
                rowFields={fieldKeys}
                rowSource={ROW_SOURCE}
              />
              <p className="dsbi-note">
                Runs after the form is filled, with <code>{"{{row.Field}}"}</code> available — a Set value for a field
                that needs working out, a Call API to load the full record, a scroll or a toast.
              </p>
            </div>
          </>
        ) : null}

        {draft.type === "chip" ? (
          <p className="dsbi-note">
            Chip colours are set below, under <b>Chip colour rules</b> — a field of the row to read the colour from, a
            default for the rows that carry none, and rules for the cases that need naming.
          </p>
        ) : null}

        {/* A control the row cannot be acted on with — CHANGE PAY on a bill
            with no receipt number — is greyed out where it stands, which is
            what every hand-coded list does. Without it the only way to say so
            was to let the click through and answer it with a toast. */}
        {draft.control && draft.control !== "none" ? (
          <div className="dsbi-sub">
            <div className="dsbi-sub-title">Disabled when</div>
            <WhenRows
              value={draft.disabledWhen}
              onChange={(v) => set({ disabledWhen: v })}
              fieldOptions={whenFields}
            />
            <p className="dsbi-note">
              Every line must hold for the control to be greyed out. The row's own fields are offered, and{" "}
              <code>{"{{values.…}}"}</code> or <code>{"{{globals.…}}"}</code> can be typed into the value box for a rule
              that is about the screen rather than the record.
            </p>
          </div>
        ) : null}

        {draft.control && draft.control !== "none" ? (
          <div className="dsbi-sub">
            <div className="dsbi-sub-title">Hidden when</div>
            <WhenRows
              value={draft.hiddenWhen}
              onChange={(v) => set({ hiddenWhen: v })}
              fieldOptions={whenFields}
            />
            <p className="dsbi-note">
              The control is left out of that row entirely — the cell is empty. A remove icon only on the rows added on
              this screen is <code>isRemove</code> <b>is empty</b> here, with the Add row action setting{" "}
              <code>isRemove</code> to <code>true</code>.
            </p>
          </div>
        ) : null}

        {draft.control && draft.control !== "none" ? (
          <Section
            title="Show words instead of the control"
            defaultOpen={!!(draft.insteadRules || []).length}
            right={<span className="dsbi-badge">{(draft.insteadRules || []).length}</span>}
          >
            <ListShell
              items={draft.insteadRules || []}
              onChange={(v) => set({ insteadRules: v })}
              addLabel="Add a case"
              blank={() => ({ when: [], text: "" })}
              render={(r, patch) => (
                <>
                  <Field label="When">
                    <WhenRows
                      value={r.when}
                      onChange={(v) => patch({ when: v })}
                      fieldOptions={whenFields}
                    />
                  </Field>
                  <Field label="Show">
                    <TemplateField
                      value={r.text || ""}
                      onChange={(v) => patch({ text: v })}
                      rowFields={fieldKeys}
                      placeholder="Visit Closed"
                    />
                  </Field>
                </>
              )}
            />
            <p className="dsbi-note">
              The rows this does not apply to at all — an action column that reads <b>Close Visit</b> while a visit
              is open, <b>Visit Closed</b> once it has been, and a dash on the rest. First case that holds wins, so put
              the most specific first. Leave the text empty for a dash.
            </p>
          </Section>
        ) : null}

        {draft.control === "checkbox" ? (
          <Section title="Allow a tick when" defaultOpen={!!(draft.tickWhen || []).length}>
            <WhenRows
              value={draft.tickWhen}
              onChange={(v) => set({ tickWhen: v })}
              fieldOptions={whenFields}
            />
            <Field label="Say this when it is refused">
              <DebouncedInput
                value={draft.tickMessage || ""}
                onChange={(v) => set({ tickMessage: v })}
                placeholder="Please select the same patient's bills only"
              />
            </Field>
            <p className="dsbi-note">
              Checked as the box is ticked, not later on the button that acts on the selection. The rule is about the
              row being ticked; the selection so far is <code>{"{{ticked}}"}</code> and its first record{" "}
              <code>{"{{first}}"}</code> — so &ldquo;the same patient as the rest&rdquo; is{" "}
              <b>PatientID</b> equals <code>{"{{first.PatientID}}"}</code>. With nothing ticked yet <code>first</code>{" "}
              is the row itself, so the first tick always goes through.
            </p>
          </Section>
        ) : null}

        <Section title="Show text instead of the value" defaultOpen={!!(draft.valueLabels || []).length}>
          <ListShell
            items={draft.valueLabels || []}
            onChange={(v) => set({ valueLabels: v })}
            addLabel="Add a wording"
            blank={() => ({ value: "", label: "" })}
            render={(m, patch) => (
              <div className="dsbi-grid2">
                <Field label="When the value is">
                  <DebouncedInput value={m.value} onChange={(v) => patch({ value: v })} placeholder="IN" />
                </Field>
                <Field label="Show">
                  <DebouncedInput value={m.label} onChange={(v) => patch({ label: v })} placeholder="Patient admitted" />
                </Field>
              </div>
            )}
          />
          <p className="dsbi-note">
            Only the text on screen changes — the row keeps its own value, so filters, sorting and the chip colour rules
            go on working against <code>IN</code> rather than against the wording. Case and spacing are ignored when
            matching; anything not listed is shown as it comes.
          </p>
        </Section>

        {draft.type === "frameMenu" ? (
          <>
            <div className="dsbi-grid2">
              <Field label="Module (frameName)">
                <DebouncedInput
                  value={draft.frameName || ""}
                  onChange={(v) => set({ frameName: v })}
                  placeholder="Emergency"
                />
              </Field>
              <Field label="Patient header">
                <Toggle value={draft.showPatientHeader !== false} onChange={(v) => set({ showPatientHeader: v })} />
              </Field>
            </div>
            <p className="dsbi-note">
              One icon per row that opens the screens this module allows — the same list a hand-coded page reads from{" "}
              <b>BindFrameMenuByRoleID</b>, filtered by the signed-in role, and the same screens. The column needs no
              field of its own; each screen is handed the whole row. The menu is read once and shared by every row.
            </p>
          </>
        ) : null}

        {draft.type === "icon" ? (
          <div className="dsbi-grid2">
            <Field label="Icon">
              <IconField value={draft.icon} onChange={(v) => set({ icon: v })} suggestFrom={draft.header || draft.label || draft.key} />
            </Field>
            <Field label="Colour">
              <ColorField value={draft.iconColor} onChange={(v) => set({ iconColor: v })} palette={palette} />
            </Field>
          </div>
        ) : null}

        {draft.type === "actions" ? (
          <div className="dsbi-sub">
            <div className="dsbi-sub-title">Row action strip</div>
            <div className="dsbi-grid2">
              <Field label="Icon size">
                <DebouncedInput value={draft.iconSize ?? ""} onChange={(v) => set({ iconSize: v })} placeholder="15" />
              </Field>
              <Field label="Gap (px)">
                <DebouncedInput value={draft.gap ?? ""} onChange={(v) => set({ gap: v })} placeholder="6" />
              </Field>
            </div>
            <Field label="Default icon colour">
              <ColorField value={draft.iconColor} onChange={(v) => set({ iconColor: v })} palette={palette} />
            </Field>
            <p className="dsbi-note">
              The cluster a list screen ends its row with. Add as many icons as the row needs — each one opens its own
              thing, shows its own tooltip, and can be hidden by a condition on the row.
            </p>
            <ActionsEditor
              value={draft.actions || []}
              onChange={(v) => set({ actions: v })}
              nodes={nodes}
              dataSources={dataSources}
              patchNode={patchNode}
              rowFields={fieldKeys}
              rowSource={ROW_SOURCE}
            />
          </div>
        ) : null}

        <div className="dsbi-cols-actions">
          <button type="button" className="dsbi-mini is-primary" disabled={!draft.key} onClick={commit}>
            {editing >= 0 ? "Update" : "Add column"}
          </button>
          {editing >= 0 ? (
            <button type="button" className="dsbi-mini" onClick={cancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      <datalist id="dsbi-widths">
        {WIDTH_PRESETS.map((w) => (
          <option key={w} value={w} />
        ))}
      </datalist>

      {items.length ? (
        <div className="dsbi-cols-tablewrap">
          <table className="dsbi-cols-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Key</th>
                <th>Name</th>
                <th>Width</th>
                <th>Type</th>
                <th>Alignment</th>
                <th>Is total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, i) => (
                <tr
                  key={`${c.key}-${i}`}
                  draggable
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(i);
                  }}
                  onDrop={() => drop(i)}
                  onDragEnd={() => {
                    setDragFrom(-1);
                    setDragOver(-1);
                  }}
                  className={`${editing === i ? "is-editing" : ""} ${dragOver === i && dragFrom !== i ? "is-drop" : ""} ${
                    c.visible === false ? "is-hidden" : ""
                  }`}
                  title="Drag to reorder"
                >
                  <td className="dsbi-cols-n">
                    <Icon name="Move" size={11} />
                    {i + 1}
                  </td>
                  <td className="dsbi-cols-act">
                    <button type="button" title="Delete" onClick={() => remove(i)}>
                      <Icon name="Trash2" size={12} />
                    </button>
                    <button type="button" title="Edit" onClick={() => startEdit(i)}>
                      <Icon name="Pencil" size={12} />
                    </button>
                  </td>
                  <td>{c.key}</td>
                  <td>{c.header || humanize(c.key)}</td>
                  <td>{formatWidth(c.width)}</td>
                  <td>{c.type || "text"}</td>
                  <td>{c.align || "left"}</td>
                  <td>{c.isTotal ? "true" : "false"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="dsbi-note">No columns yet. Add one above, or press Sync on the API endpoint to read them from the response.</p>
      )}

      {chipCols.length ? (
        <div className="dsbi-sub">
          <div className="dsbi-sub-title">
            Chip colour rules
            <span className="dsbi-badge">{chipCols.length}</span>
          </div>
          <datalist id={fieldListId}>
            {(fieldKeys || []).map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
          {chipCols.map(({ col, index }) => (
            <div key={`${col.key}-${index}`} className="dsbi-chipcol">
              <div className="dsbi-chipcol-h">
                <b>{col.header || col.key}</b>
                <span className="dsbi-badge">{(col.chipRules || []).length}</span>
              </div>

              {/* Colour straight from the result. The triage endpoint returns
                  CodeType with the ColorCode it is drawn in, so the palette
                  belongs to the data, not to a rule list that goes stale the
                  next time someone adds a triage level. */}
              <div className="dsbi-grid2">
                <Field label="Background from field">
                  <DebouncedInput
                    value={col.colorField || ""}
                    onChange={(v) => patchCol(index, { colorField: v })}
                    placeholder="ColorCode"
                    list={fieldListId}
                  />
                </Field>
                <Field label="Text colour from field">
                  <DebouncedInput
                    value={col.textColorField || ""}
                    onChange={(v) => patchCol(index, { textColorField: v })}
                    placeholder="TextColorCode"
                    list={fieldListId}
                  />
                </Field>
              </div>
              <div className="dsbi-grid2">
                <Field label="Default background">
                  <ColorField value={col.defaultBg} onChange={(v) => patchCol(index, { defaultBg: v })} palette={palette} />
                </Field>
                <Field label="Default text">
                  <ColorField value={col.defaultFg} onChange={(v) => patchCol(index, { defaultFg: v })} palette={palette} />
                </Field>
              </div>
              <SwatchRow palette={palette} onPick={(s) => patchCol(index, { defaultBg: s.bg, defaultFg: s.fg })} />
              <p className="dsbi-note">
                Background and text are decided separately, each one by the first of: a rule below, the field named
                above, the default. So "colour from the data, white text always" is two boxes and no rules.
              </p>

              <ColorRulesEditor
                value={col.chipRules || []}
                onChange={(v) => patchCol(index, { chipRules: v })}
                palette={palette}
                fieldDefault={col.key}
                hideTarget
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A stacked label + control, so the form reads as a form rather than a list. */
function Field({ label, children }) {
  return (
    <label className="dsbi-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

/** "PatientName" -> "Patient Name", so a picked key arrives with a readable header. */
function humanize(key) {
  return String(key || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** A bare number is pixels; anything else is already a CSS length. */
const formatWidth = (w) => (w === "" || w === null || w === undefined ? "auto" : /^\d+$/.test(String(w)) ? `${w}px` : String(w));

export function CardConfigEditor({ value, onChange, columns = [] }) {
  const cfg = value || {};
  const set = (patch) => onChange({ ...cfg, ...patch });
  const colOpts = columns.map((c) => ({ value: c.key, label: c.header || c.key }));
  return (
    <div className="dsbi-stackgap">
      <Row label="Title field">
        <SelectBox value={cfg.titleField} onChange={(v) => set({ titleField: v })} options={colOpts} />
      </Row>
      <Row label="Subtitle field">
        <SelectBox value={cfg.subtitleField} onChange={(v) => set({ subtitleField: v })} options={colOpts} />
      </Row>
      <Row label="Status field">
        <SelectBox value={cfg.statusField} onChange={(v) => set({ statusField: v })} options={colOpts} />
      </Row>
      <Row label="Card icon" hint="Empty shows the title's initials in the avatar.">
        <IconField value={cfg.icon} onChange={(v) => set({ icon: v })} />
      </Row>
      <Row
        label="Colour coding"
        hint="Soft pastel colours per card. By a field: every card with the same value shares a colour (all OPD one colour, all EMG another)."
      >
        <SelectBox
          value={cfg.colorBy || ""}
          onChange={(v) => set({ colorBy: v || undefined })}
          options={[
            { value: "", label: "By the title field" },
            ...colOpts.map((o) => ({ value: o.value, label: `By ${o.label}` })),
            { value: "row", label: "A different colour per card" },
            { value: "none", label: "Off — theme colour only" },
          ]}
        />
      </Row>
      <Row
        label="Colour rules"
        hint="Colour a card by a condition — Status is Released For IPD → Mint, Triaging Code is Urgent → Red. The first rule that holds wins; a card no rule matches keeps the colour coding above."
      >
        <CardColorRulesEditor value={cfg.colorRules || []} onChange={(v) => set({ colorRules: v })} colOpts={colOpts} />
      </Row>
      <Row label="Fields shown" hint="How many fields a card lists when Body fields is left empty. Empty lists every column the table shows.">
        <DebouncedInput type="number" value={cfg.maxFields ?? ""} onChange={(v) => set({ maxFields: v })} placeholder="All" />
      </Row>
      <Row label="Body fields" hint="Action and frame-menu columns are never listed here — they are drawn along the foot of the card.">
        <FieldsEditor value={cfg.bodyFields || []} onChange={(v) => set({ bodyFields: v })} />
      </Row>
      <Row label="Row icons" hint="The same action strip the table shows, along the bottom of each card.">
        <Toggle value={cfg.showActions !== false} onChange={(v) => set({ showActions: v })} label="Show the action icons" />
      </Row>
      <Row label="Columns">
        <DebouncedInput type="number" value={cfg.columns ?? 3} onChange={(v) => set({ columns: v })} />
      </Row>
    </div>
  );
}

/** The card families a colour rule can pick, by name. */
const CARD_TONE_OPTIONS = Object.keys(CARD_TONES).map((k) => ({ value: k, label: humanize(k) }));

function CardColorRulesEditor({ value, onChange, colOpts = [] }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <ListShell
      items={items}
      onChange={onChange}
      addLabel="Add colour rule"
      blank={() => ({ field: colOpts[0]?.value || "", op: "eq", value: "", tone: "mint", color: "" })}
      render={(r, patch) => {
        const tone = CARD_TONES[r.tone];
        return (
          <>
            <div className="dsbi-grid3">
              <SelectBox value={r.field} onChange={(v) => patch({ field: v })} options={colOpts} placeholder="Field" />
              <SelectBox value={r.op} onChange={(v) => patch({ op: v })} options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))} placeholder="op" />
              <DebouncedInput value={r.value} onChange={(v) => patch({ value: v })} placeholder="Value" />
            </div>
            <Row label="Card colour">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  aria-hidden="true"
                  style={{
                    flex: "none",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: r.color && !hasTemplate(r.color) ? r.color : tone ? `linear-gradient(135deg, ${tone.band}, ${tone.accent})` : "transparent",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <SelectBox value={r.tone} onChange={(v) => patch({ tone: v })} options={CARD_TONE_OPTIONS} placeholder="—" />
              </div>
            </Row>
            <Row label="Or own colour" hint="A colour of your own, or one the row carries — {{row.ColorCode}}. Wins over the family above.">
              <ColorField value={r.color} onChange={(v) => patch({ color: v })} />
            </Row>
          </>
        );
      }}
    />
  );
}

export function KeyValueEditor({ value, onChange, keyPlaceholder = "key", valPlaceholder = "value" }) {
  const entries = Object.entries(value || {});
  const setEntry = (i, k, v) => {
    const next = {};
    entries.forEach(([ek, ev], j) => {
      if (j === i) next[k] = v;
      else next[ek] = ev;
    });
    onChange(next);
  };
  return (
    <div className="dsbi-list">
      {entries.map(([k, v], i) => (
        <div key={i} className="dsbi-grid2 dsbi-kv">
          <DebouncedInput value={k} onChange={(nk) => setEntry(i, nk, v)} placeholder={keyPlaceholder} />
          <DebouncedInput value={v} onChange={(nv) => setEntry(i, k, nv)} placeholder={valPlaceholder} />
          <button
            type="button"
            className="dsbi-x"
            onClick={() => {
              const next = { ...(value || {}) };
              delete next[k];
              onChange(next);
            }}
          >
            <Icon name="X" size={11} />
          </button>
        </div>
      ))}
      <button type="button" className="dsbi-add" onClick={() => onChange({ ...(value || {}), "": "" })}>
        <Icon name="Plus" size={12} /> Add entry
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- rules UI */

export function ColorRulesEditor({ value, onChange, palette = [], fieldDefault = "", hideTarget = false }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <ListShell
      items={items}
      onChange={onChange}
      addLabel="Add colour rule"
      blank={() => ({ field: fieldDefault, op: "eq", value: "", target: hideTarget ? "chip" : "row", bg: "#FDE047", fg: "#713F12", border: "" })}
      render={(r, patch) => (
        <>
          <div className="dsbi-grid3">
            <DebouncedInput value={r.field} onChange={(v) => patch({ field: v })} placeholder="Field" />
            <SelectBox value={r.op} onChange={(v) => patch({ op: v })} options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))} placeholder="op" />
            <DebouncedInput value={r.value} onChange={(v) => patch({ value: v })} placeholder="Value" />
          </div>
          {!hideTarget ? (
            <Row label="Applies to">
              <SelectBox value={r.target} onChange={(v) => patch({ target: v })} options={COLOR_TARGETS.map((t) => ({ value: t.key, label: t.label }))} />
            </Row>
          ) : null}
          <Row label="Background">
            <ColorField value={r.bg} onChange={(v) => patch({ bg: v })} palette={palette} />
          </Row>
          <Row label="Text">
            <ColorField value={r.fg} onChange={(v) => patch({ fg: v })} palette={palette} />
          </Row>
          <Row label="Border">
            <ColorField value={r.border} onChange={(v) => patch({ border: v })} palette={palette} />
          </Row>
          <SwatchRow palette={palette} onPick={(s) => patch({ bg: s.bg, fg: s.fg })} />
          <p className="dsbi-note">
            Any of the three takes a binding as well as a colour: <code>{"{{row.ColorCode}}"}</code> paints each record
            in the colour its own row carries.
          </p>
        </>
      )}
    />
  );
}

export function VisibilityRulesEditor({ value, onChange, rowFields = [], rowSource = "", formFields = [] }) {
  const items = Array.isArray(value) ? value : [];

  /**
   * What a rule can be written against, offered rather than typed.
   *
   * A rule on a tile inside a drawer is almost always about the RECORD the
   * drawer was opened on — "hide Release for IPD when the status is already
   * RFI" — and `row.Status` is only guessable if you know the endpoint's exact
   * spelling. The record's own keys come first for that reason, then the
   * screen's other controls, then the user. Typing still works: a field the
   * list has not seen (a variable, a nested path) is accepted as it stands.
   */
  const fieldOptions = useMemo(() => {
    const rec = (rowFields || []).map((k) => ({
      value: `row.${k}`,
      label: `${rowSource ? `${rowSource} · ` : "Record · "}${k}`,
      search: `row ${k} record`,
    }));
    const form = (formFields || []).map((k) => ({ value: `values.${k}`, label: `Field · ${k}`, search: `values ${k}` }));
    return [...rec, ...form, { value: "user.role", label: "User · role", search: "user role" }];
  }, [rowFields, rowSource, formFields]);

  return (
    <ListShell
      items={items}
      onChange={onChange}
      addLabel="Add rule"
      blank={() => ({ when: { field: "", op: "eq", value: "" }, effect: "hide" })}
      render={(r, patch) => (
        <>
          <div className="dsbi-grid3">
            <Combo
              value={r.when?.field}
              onChange={(v) => patch({ when: { ...r.when, field: v } })}
              options={fieldOptions}
              placeholder="Pick a field…"
              searchPlaceholder="Search fields…"
              allowCustom
              customLabel={(v) => `Use "${v}"`}
            />
            <SelectBox value={r.when?.op} onChange={(v) => patch({ when: { ...r.when, op: v } })} options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))} placeholder="op" />
            <DebouncedInput value={r.when?.value} onChange={(v) => patch({ when: { ...r.when, value: v } })} placeholder="Value" />
          </div>
          <Row label="Then">
            <SelectBox
              value={r.effect}
              onChange={(v) => patch({ effect: v })}
              options={[
                { value: "show", label: "Show" },
                { value: "hide", label: "Hide" },
                { value: "enable", label: "Enable" },
                { value: "disable", label: "Disable" },
                { value: "require", label: "Make required" },
              ]}
            />
          </Row>
        </>
      )}
    />
  );
}

/**
 * The values a select can actually be defaulted to.
 *
 * A static list already knows them. An endpoint-backed one knows them only
 * after a Sync, from the rows it brought back and the label/value mapping the
 * designer chose — the same pair the rendered control will use, so what is
 * offered here is what the user will see in the dropdown.
 */
export function optionChoices(props = {}) {
  const source = props.optionsSource || "static";
  if (source === "static") {
    return (props.options || [])
      .filter((o) => o && o.value !== undefined && o.value !== "")
      .map((o) => ({ value: String(o.value), label: `${o.label ?? o.value}` }));
  }
  const all = Array.isArray(props.previewOptions) ? props.previewOptions : [];
  // The filter is part of what the dropdown offers, so a default has to be
  // picked from what survives it — not from every row the endpoint returned.
  const rows = filterOptionRows(all, props.optionFilters, {});
  if (!rows.length) return [];
  const map = resolveOptionFields(rows, props.optionLabelField, props.optionValueField);
  return rowsToOptions(rows, map.label, map.value)
    .filter((o) => o.value !== undefined && o.value !== "")
    .map((o) => ({ value: String(o.value), label: `${o.label}` }));
}

/**
 * Pick a value from the select's own options, or type one.
 *
 * A multi select stores a list, so choosing appends to a comma list rather than
 * replacing it; a single select replaces. The box stays editable either way,
 * because a template ({{user.centreId}}) and an id the endpoint has not been
 * synced for are both legitimate answers.
 */
function OptionValueField({ value, onChange, props: nodeProps, placeholder }) {
  const choices = optionChoices(nodeProps);
  const multi = !!nodeProps?.isMulti;
  const pick = (v) => {
    if (!v) return;
    if (!multi) return onChange(v);
    const current = String(value || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (current.includes(v)) return;
    onChange([...current, v].join(","));
  };
  return (
    <div className="dsbi-vmap">
      <DebouncedInput value={value ?? ""} onChange={onChange} placeholder={placeholder} />
      <SelectBox
        value=""
        onChange={pick}
        options={choices}
        placeholder={choices.length ? (multi ? "Add…" : "Pick…") : "Sync first"}
      />
    </div>
  );
}

/**
 * Narrow an option list to part of what the endpoint returned.
 *
 * The case this exists for: one lookup endpoint answers for several dropdowns
 * — every row of a types table in a single response — and this select wants
 * the rows whose TypeName is "Triage Code". Each filter names a field of the
 * row, an operator, and a value, and a row has to match all of them.
 *
 * The value box is the same one payload keys use, so a filter can follow
 * another control ({{values.centre}}) rather than only a fixed value.
 */
export function OptionFiltersEditor({ value, onChange, fieldKeys = [], formFields = [], note = "" }) {
  const items = Array.isArray(value) ? value : [];
  const needsValue = (op) => op !== "empty" && op !== "notEmpty";
  return (
    <>
      <ListShell
        items={items}
        onChange={onChange}
        addLabel="Add filter"
        blank={() => ({ field: "", op: "eq", value: "" })}
        render={(f, patch) => (
          <>
            <div className="dsbi-grid2">
              <KeyCombo
                value={f.field}
                onChange={(v) => patch({ field: v })}
                keys={fieldKeys}
                placeholder="Row field"
                searchPlaceholder="Search fields…"
              />
              <SelectBox
                allowEmpty={false}
                value={f.op || "eq"}
                onChange={(v) => patch({ op: v })}
                options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))}
              />
            </div>
            {needsValue(f.op || "eq") ? (
              <ValueMap
                value={f.value}
                onChange={(v) => patch({ value: v })}
                formFields={formFields}
                placeholder="Value, or {{values.field}}"
              />
            ) : null}
          </>
        )}
      />
      <p className="dsbi-note">
        {note || (
          <>
            Rows are kept only when they match <b>every</b> filter, so one endpoint can feed several
            dropdowns. Filtering happens after the call — the endpoint still returns everything.
          </>
        )}
        {fieldKeys.length ? "" : " Press Sync above first and the field list fills itself."}
      </p>
    </>
  );
}

/* --------------------------------------------------------- trend rules */

/**
 * Which way a KPI's trend arrow points, case by case: "OccupencyPer greater
 * than 80 → Up". A case tests a field of the record the card stands on, or the
 * card's own number; the first that holds wins, and "Otherwise" (its own prop)
 * answers when none does.
 */
export function TrendRulesEditor({ value, onChange, fieldKeys = [], formFields = [], palette = [] }) {
  const items = Array.isArray(value) ? value : [];
  const needsValue = (op) => op !== "empty" && op !== "notEmpty";
  const fields = [
    { value: STAT_VALUE_FIELD, label: "This card's value" },
    ...(fieldKeys || []).filter((k) => k && k !== STAT_VALUE_FIELD).map((k) => ({ value: k, label: k })),
  ];
  const dirs = TREND_DIRS.map((d) => ({ value: d.value, label: `→ ${d.label}` }));
  return (
    <>
      <ListShell
        items={items}
        onChange={onChange}
        addLabel="Add a case"
        blank={() => ({ field: STAT_VALUE_FIELD, op: "gt", value: "", dir: "up" })}
        render={(r, patch) => (
          <>
            <div className="dsbi-grid2">
              <Combo
                value={r.field || ""}
                onChange={(v) => patch({ field: v })}
                options={fields}
                placeholder="Field"
                searchPlaceholder="Search fields…"
                allowCustom
                customLabel={(v) => `Use "${v}"`}
              />
              <SelectBox
                allowEmpty={false}
                value={r.op || "gt"}
                onChange={(v) => patch({ op: v })}
                options={OPERATORS.map((o) => ({ value: o.op, label: o.label }))}
              />
            </div>
            <div className="dsbi-trendcase-then">
              {needsValue(r.op || "gt") ? (
                <ValueMap
                  value={r.value}
                  onChange={(v) => patch({ value: v })}
                  formFields={formFields}
                  placeholder="80, or {{row.Target}}"
                />
              ) : (
                <span />
              )}
              <SelectBox allowEmpty={false} value={r.dir || "up"} onChange={(v) => patch({ dir: v })} options={dirs} />
            </div>
            {/* Empty falls back to the card's Trend colour / background. */}
            <div className="dsbi-trendcase-colors">
              <span>Colour</span>
              <ColorField value={r.color || ""} onChange={(v) => patch({ color: v })} palette={palette} />
            </div>
            <div className="dsbi-trendcase-colors">
              <span>Background</span>
              <ColorField value={r.bg || ""} onChange={(v) => patch({ bg: v })} palette={palette} />
            </div>
          </>
        )}
      />
      <p className="dsbi-note">
        First case that holds wins; its colours win over the card&rsquo;s Trend colour and background below. <b>This card&rsquo;s value</b> is the number it shows; any other field is read off
        the record it stands on — the row of its API, or of the list it counts.
        {fieldKeys.length ? "" : " Press Sync on its endpoint and the field list fills itself."}
      </p>
    </>
  );
}

/* --------------------------------------------------------- alert rules */

/**
 * The tests that decide a record is critical.
 *
 * Close cousin of the option filters above, and deliberately not the same
 * editor: these compare READINGS, so they need the two tests a filter has no
 * operator for — inside a band and outside one — and they need both ends of
 * that band written the way the department writes them (90/60 to 140/90).
 * A filter narrows a list; these raise an alarm.
 */
/**
 * A calendar's statuses (registry/calendarView): each a name, its colours and
 * Font Awesome icon, where its chip sits in a day tile, and the test that
 * gives a record that status. Tested top to bottom; one without a test is the
 * "otherwise". Starts as the OPD Confirmation page's six plus Pending.
 */
export function CalStatusesEditor({ value, onChange, fieldKeys = [], palette = [] }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <>
      <ListShell
        items={items}
        onChange={onChange}
        addLabel="Add a status"
        blank={() => ({ label: "", order: "", color: "#1e6cb5", tint: "#eaf2fb", bar: "#3b8fd9", icon: "fas fa-circle", when: [] })}
        render={(s, patch) => (
          <>
            <div className="dsbi-grid2">
              <Field label="Name">
                <DebouncedInput value={s.label ?? ""} onChange={(v) => patch({ label: v })} placeholder="Confirmed" />
              </Field>
              <Field label="Chip order">
                <DebouncedInput value={s.order ?? ""} onChange={(v) => patch({ order: v })} placeholder="1" />
              </Field>
            </div>
            <div className="dsbi-grid2">
              <Field label="Text colour">
                <ColorField value={s.color} onChange={(v) => patch({ color: v })} palette={palette} />
              </Field>
              <Field label="Chip background">
                <ColorField value={s.tint} onChange={(v) => patch({ tint: v })} palette={palette} />
              </Field>
            </div>
            <div className="dsbi-grid2">
              <Field label="Side bar colour">
                <ColorField value={s.bar} onChange={(v) => patch({ bar: v })} palette={palette} />
              </Field>
              <Field label="Icon (Font Awesome)">
                <DebouncedInput value={s.icon ?? ""} onChange={(v) => patch({ icon: v })} placeholder="fas fa-check-circle" />
              </Field>
            </div>
            <div className="dsbi-sub">
              <div className="dsbi-sub-title">A record is in this status when</div>
              <WhenRows value={s.when} onChange={(v) => patch({ when: v || [] })} fieldOptions={fieldKeys} />
            </div>
          </>
        )}
      />
      <p className="dsbi-note">
        The first status whose test holds names the record; a status with no test is what everything else is
        (Pending). Tests read the record's own fields — <code>IsConform</code> = <code>1</code>,{" "}
        <code>PatientID</code> is empty. Chip order is left to right inside a day tile.
      </p>
    </>
  );
}

export function AlertRulesEditor({ value, onChange, fieldKeys = [] }) {
  const items = Array.isArray(value) ? value : [];
  const isRange = (op) => VITAL_RANGE_OPS.has(op || "outside");
  const needsValue = (op) => op !== "empty" && op !== "notEmpty";
  return (
    <>
      <ListShell
        items={items}
        onChange={onChange}
        addLabel="Add a test"
        blank={() => ({ field: "", op: "outside", value: "", to: "" })}
        render={(r, patch) => (
          <>
            <div className="dsbi-grid2">
              <KeyCombo
                value={r.field}
                onChange={(v) => patch({ field: v })}
                keys={fieldKeys}
                placeholder="Reading, e.g. BP"
                searchPlaceholder="Search fields…"
              />
              <SelectBox
                allowEmpty={false}
                value={r.op || "outside"}
                onChange={(v) => patch({ op: v })}
                options={VITAL_OPS}
              />
            </div>
            {isRange(r.op) ? (
              <div className="dsbi-grid2">
                <Field label="Normal from">
                  <DebouncedInput value={r.value ?? ""} onChange={(v) => patch({ value: v })} placeholder="90/60" />
                </Field>
                <Field label="Normal to">
                  <DebouncedInput value={r.to ?? ""} onChange={(v) => patch({ to: v })} placeholder="140/90" />
                </Field>
              </div>
            ) : needsValue(r.op) ? (
              <DebouncedInput
                value={r.value ?? ""}
                onChange={(v) => patch({ value: v })}
                placeholder="Value, or {{values.field}}"
              />
            ) : null}
          </>
        )}
      />
      <p className="dsbi-note">
        Separators do not matter: <code>155/80</code>, <code>155-80</code> and <code>155 to 80</code> read alike. Write
        both ends the same shape as the reading — <code>90/60</code> to <code>140/90</code> tests systolic against
        90–140 and diastolic against 60–90 — or give one plain band and every part of the reading has to sit inside it.
        A half-typed test stays quiet rather than calling everyone critical.
        {fieldKeys.length ? "" : " Pick the list to watch above and the field list fills itself."}
      </p>
    </>
  );
}

/* ------------------------------------------------------- payload mapping */

/**
 * What the component a Save chain belongs to reports through setModalData —
 * `{ label, fields: [{ path, select }] }`, or null outside such a chain. Every
 * payload picker inside the chain offers these as `{{modal.<path>}}`, and a
 * freshly picked endpoint's keys are pointed at the ones they name.
 */
export const DialogFieldsContext = createContext(null);

/**
 * Controls whose answer is one of a list: the value is an id, and what the user
 * saw is a separate text ({{labels.<field>}} at runtime — see useOptionLabel).
 */
const OPTION_CONTROLS = ["SelectInput", "SelectAddInput", "RadioGroup"];

/**
 * The columns a selection is actually carrying — the keys of the API row
 * behind it, which is the whole record the endpoint sent, not the
 * `{value, label}` pair the control displays.
 *
 * A multi select holds a LIST of those rows, so the columns are the union of
 * the first few: one endpoint answering with uneven rows should not hide a key
 * because the first record happened to lack it.
 */
function columnsOfSelection(picked) {
  const rows = Array.isArray(picked) ? picked.slice(0, 5) : picked ? [picked] : [];
  const keys = new Set();
  rows.forEach((r) => {
    if (r && typeof r === "object") Object.keys(r).forEach((k) => !String(k).startsWith("__") && keys.add(k));
  });
  return [...keys];
}

/**
 * The option controls on the screen being edited, by field name: what each is
 * called on screen, whether it takes several answers, and the columns of the
 * row behind its choice.
 *
 * Two sources for those columns, and both are needed. The screen JSON knows
 * them only for a list the designer Synced. The MOUNTED screen knows them for
 * certain — it is holding the rows the endpoint sent — so whatever has been
 * picked on the canvas is read as well (utils/livescope). That is what makes
 * every key of a live dropdown offerable without a Sync first.
 */
function useOptionControls() {
  const screen = useBuilder()?.state?.screen;
  const root = screen?.root;
  const dataSources = screen?.dataSources;
  const live = liveScope()?.selected || null;
  // Content, not identity: the live scope is rebuilt on every call, so the
  // memo has to key on what is IN it or it would recompute forever.
  const liveSig = live
    ? Object.keys(live)
        .map((k) => `${k}:${columnsOfSelection(live[k]).join(",")}`)
        .join("|")
    : "";
  return useMemo(() => {
    const out = new Map();
    flatten(root).forEach((n) => {
      const f = n.props?.field;
      if (!f || !OPTION_CONTROLS.includes(n.type) || out.has(f)) return;
      const columns = [
        ...new Set([...optionColumnsOf(n.props, dataSources), ...columnsOfSelection(live?.[f])]),
      ];
      out.set(f, { caption: controlCaption(n), columns, isMulti: !!n.props?.isMulti });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, dataSources, liveSig]);
}

/**
 * One control's columns, for a picker that is about a single field — the
 * per-item keys of a repeated payload parameter.
 */
export function useOptionColumns(field) {
  const controls = useOptionControls();
  return controls.get(field) || { caption: "", columns: [], isMulti: false };
}

/**
 * Everything a template box can read on this screen, as picker entries.
 *
 * Grouped by where the data lives, so a long list reads as a few short ones.
 * A dropdown answers three ways and gets a group of its own: the id it stores,
 * the text it showed, and every column of the row that was picked — a Room
 * Type is often a column of the chosen Case Type, not something typed in.
 * Every field on the screen is offered, the edited control's own included: its
 * onChange is exactly where "copy a column of what was just picked" is set up.
 */
/**
 * Variables actions anywhere on the screen fill: a Call API's saved response,
 * and the row a "Store clicked row" (or an overlay opened on a row) keeps.
 * Returned as { name, what } so Map… can say which is which.
 */
export function actionVarsOf(root) {
  const out = new Map();
  const add = (name, what) => typeof name === "string" && name && !out.has(name) && out.set(name, what);
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    if (v.type === "callApi") add(v.responseVar, "saved API response");
    if (v.type === "setVar") add(v.field, "set variable");
    if (v.type === "storeRow") add(v.rowVar || v.field || "selectedRow", "stored clicked row");
    if ((v.type === "openModal" || v.type === "openPanel") && v.rowVar) add(v.rowVar, "stored clicked row");
    // A table's own "Remember clicked row as".
    if (v.props && typeof v.props.rowVar === "string" && v.props.rowVar.trim()) {
      add(v.props.rowVar.trim(), `clicked row of ${v.name || v.type}`);
    }
    Object.values(v).forEach(walk);
  };
  walk(root);
  return [...out].map(([name, what]) => ({ name, what }));
}

function useValueSources({ formFields = [], rowFields = [], rowSource = "" }) {
  const dialog = useContext(DialogFieldsContext);
  const controls = useOptionControls();
  const screen = useBuilder()?.state?.screen;
  const root = screen?.root;
  const variables = screen?.variables;
  const params = screen?.params;
  return useMemo(() => {
    const fields = [
      ...new Set([...(formFields || []), ...flatten(root).flatMap(fieldsOf)]),
    ];
    const plain = fields.filter((f) => !controls.has(f));
    const picked = fields.filter((f) => controls.has(f));
    const recordName = rowSource || "the record";
    return [
      // Inside a dialog's Save chain, what the dialog reported comes first —
      // that is what the save is for.
      ...(dialog?.fields || []).map((f) => ({
        value: `{{modal.${f.path}}}`,
        label: `${f.path} — ${dialog.label}${f.select ? (f.path.endsWith(".label") ? " (text)" : " (value)") : ""}`,
        group: dialog.label,
      })),
      // Then the record when there is one: a payload assembled inside a drawer
      // is almost always about the row the drawer was opened on, and
      // `{{row.TID}}` is only guessable if you know the endpoint's spelling.
      ...(rowFields || []).map((k) => ({ value: `{{row.${k}}}`, label: `${k} — ${recordName}`, group: `Record — ${recordName}` })),
      ...plain.map((f) => ({ value: `{{values.${f}}}`, label: `${f} — form field`, group: "Form fields" })),
      ...picked.flatMap((f) => {
        const { caption, columns, isMulti } = controls.get(f);
        const group = `${caption ? `${caption} · ` : ""}${f} — dropdown`;
        // Several answers: everything here is a LIST. `selected.<f>` is the
        // rows themselves — every key the endpoint sent, which is what an
        // endpoint wanting records rather than ids asks for — and `.*.` walks
        // that list for one column of each. `.0.` would name the first choice
        // and be wrong for every other.
        if (isMulti) {
          return [
            { value: `{{values.${f}}}`, label: `${f} — the chosen ids (a list)`, group },
            { value: `{{labels.${f}}}`, label: `${f} — the texts shown (a list)`, group },
            {
              value: `{{selected.${f}}}`,
              label: `${f} › every chosen row, all its keys (a list)`,
              search: `selected rows records all keys ${f}`,
              group,
            },
            ...columns.map((k) => ({
              value: `{{selected.${f}.*.${k}}}`,
              label: `${f} › ${k} of every chosen row (a list)`,
              search: `selected ${k}`,
              group,
            })),
          ];
        }
        return [
          { value: `{{values.${f}}}`, label: `${f} — form field (value)`, group },
          { value: `{{labels.${f}}}`, label: `${f} — form field (text shown)`, group },
          {
            value: `{{selected.${f}}}`,
            label: `${f} › the picked row, all its keys`,
            search: `selected row record all keys ${f}`,
            group,
          },
          ...columns.map((k) => ({
            value: `{{selected.${f}.${k}}}`,
            label: `${f} › ${k} (picked row)`,
            search: `selected ${k}`,
            group,
          })),
        ];
      }),
      ...Object.keys(variables || {}).map((k) => ({ value: `{{vars.${k}}}`, label: `${k} — screen variable`, group: "Screen variables" })),
      // What the screen was opened with (Data → Screen parameters).
      ...Object.keys(params || {}).map((k) => ({ value: `{{params.${k}}}`, label: `${k} — screen parameter`, group: "Screen parameters" })),
      ...actionVarsOf(root)
        .filter((v) => !(variables && v.name in variables))
        .map((v) => ({ value: `{{vars.${v.name}}}`, label: `${v.name} — ${v.what}`, group: "Screen variables" })),
      // Not a field but a small decision about fields — the amount minus the
      // discount, a name or "Not given", 1 when a box is ticked. Offered here
      // because a box nobody knows accepts an expression is a box nobody uses.
      {
        value: "{{= }}",
        label: "an expression — + - * / %, || && !, ? :",
        search: "expression maths operator ternary calculate sum condition",
        group: "Expression",
      },
      // What the browser saved: the centre, the workstation's IP, the employee
      // id. Read off localStorage as it stands, so the list is what is
      // actually there rather than what was there when this was written.
      ...localEntries().map((e) => ({
        value: `{{${e.path}}}`,
        label: `${e.path.replace(/^local\./, "")} — saved on this device`,
        search: `local storage saved device ${e.path}`,
        group: "Saved on this device",
      })),
      { value: "{{user.centreId}}", label: "centreId — signed-in user", group: "Signed-in user" },
      { value: "{{user.id}}", label: "employeeId — signed-in user", group: "Signed-in user" },
      // Only when the record is unknown: a guess at `row.Id` is better than an
      // empty list, and noise once the real columns are there.
      ...((rowFields || []).length ? [] : [{ value: "{{row.Id}}", label: "Id — the clicked row", group: "Record" }]),
    ];
  }, [dialog, controls, root, variables, params, formFields, rowFields, rowSource]);
}

/**
 * What one payload key is filled with.
 *
 * The box has always accepted a template; what it lacked was a way to find out
 * what to type. The picker beside it lists the screen's own controls by field
 * name and writes the template for you, so mapping a payload is choosing from
 * a list rather than remembering — and a typo in {{values.pateintName}} no
 * longer silently posts an empty string.
 *
 * The text box stays: a literal, a {{user.centreId}}, or a hand-written
 * expression are all still legitimate answers.
 */
/**
 * "What does this actually hold?"
 *
 * A value box takes a template and the template is written blind: nothing on
 * the screen says whether `{{values.DoctorID}}` is a string, a list of ids or
 * a list of records, and `{{item.code}}` is a guess about a shape nobody can
 * see. Guessed wrong, the key goes out empty and the mistake surfaces in the
 * network tab of whoever runs the screen next.
 *
 * So this reads it out of the live screen instead — the canvas IS a mounted
 * screen, so its values, labels, picked rows and loaded data are all there to
 * be asked (utils/livescope). The box is a scratchpad: typing in it changes
 * nothing until **use** is pressed, so an expression can be tried before it is
 * committed to the payload.
 *
 * Module scope, not nested in ValueMap: a component declared during a render
 * is a new type every render, so React would throw this subtree away on each
 * keystroke and the input would lose focus — the same defect that was fixed in
 * ApiPicker's ParamValue.
 */
function PeekBox({ value, onUse, peekScope, onClose }) {
  const [expr, setExpr] = useState(value ?? "");
  // Values move under the panel (a choice made on the canvas, an endpoint that
  // answered). Nothing re-renders the Inspector when they do, so re-reading is
  // a button.
  const [tick, setTick] = useState(0);
  const result = useMemo(() => peekValue(expr, peekScope), [expr, tick, peekScope]);

  return (
    <div className="dsbi-peek">
      <div className="dsbi-peek-row">
        <input
          className="dsbi-input dsbi-peek-in"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="{{item.code}}"
          spellCheck={false}
          autoFocus
        />
        <Tap className="tone-refresh dsbi-mini is-icon" title="Read it again" onClick={() => setTick((t) => t + 1)}>
          <Icon name="RefreshCw" size={11} />
        </Tap>
        {onUse ? (
          <Tap
            className="tone-add dsbi-mini is-primary"
            title="Put this in the box above"
            onClick={() => {
              onUse(expr);
              onClose();
            }}
          >
            use
          </Tap>
        ) : null}
        <Tap className="tone-danger dsbi-mini is-icon" title="Close" onClick={onClose}>
          <Icon name="X" size={11} />
        </Tap>
      </div>

      {result.state === "blank" ? (
        <p className="dsbi-note">Write a template here and it is answered against the screen as it stands.</p>
      ) : null}
      {result.state === "noscreen" ? <p className="dsbi-note">No screen is mounted to read.</p> : null}
      {result.state === "noitem" ? (
        <p className="dsbi-note">
          That list is empty right now, so there is no item to read. Choose something on the canvas — or run
          <b> Preview</b>, fill the screen, come back — then read it again.
        </p>
      ) : null}
      {result.state === "error" ? <p className="dsbi-peek-err">{result.message}</p> : null}
      {result.state === "ok" ? (
        <div className="dsbi-peek-out">
          <span className="dsbi-peek-type">{result.type}</span>
          <pre className="dsbi-peek-val">{result.text}</pre>
        </div>
      ) : null}
      {/* Ids on screen, records one token away. Clicking reads it here, so
          "where are the other keys?" is answered by pressing the answer. */}
      {(result.hints || []).map((h) => (
        <Tap key={h.expr} className="dsbi-peek-hint" onClick={() => setExpr(h.expr)}>
          <Icon name="ArrowRight" size={11} />
          <code>{h.expr}</code>
          <span>{h.label}</span>
        </Tap>
      ))}
    </div>
  );
}

/**
 * Everything the screen is holding, by name, with what is in it.
 *
 * Filling a payload means naming a token, and the names belong to the screen,
 * not to the endpoint: `paymentDetail`, `DoctorID`, `n_grid`. Map… can only
 * offer the ones the JSON knows about — a field written by an action, a grid's
 * ticked rows, a variable set on load exist at runtime and appear in no list.
 * So this lists what is ACTUALLY in scope, each with its current value, and a
 * click copies the token.
 *
 * Shut by default: it answers "what can I send?", which is a question asked
 * once per payload, not while typing in it.
 */
/**
 * True while a docked rail is showing the browser, so the copy inside the
 * payload section stands down rather than listing everything twice.
 */
export const ScopeRailContext = createContext(false);

/**
 * What KIND of thing a token names, for the colour it is drawn in.
 *
 * Sixty rows in one colour is sixty rows to read one at a time. A form field,
 * a grid's rows and something the browser saved are different kinds of thing,
 * and giving each its own quiet tint means the eye finds the right part of
 * the list before it reads a single name.
 */
const TOKEN_KIND = {
  values: "form",
  labels: "text",
  selected: "picked",
  vars: "vars",
  grid: "grid",
  rows: "source",
  data: "source",
  user: "user",
  globals: "site",
  local: "local",
  modal: "modal",
  item: "record",
  row: "record",
};

/** This browser's memory of the "Local storage" tick in the scope browser. */
const SHOW_LOCAL_KEY = "dsb.scope.showLocal";

const pathOf = (expr) => String(expr).replace(/^\{\{/, "").replace(/\}\}$/, "").trim();

const kindOf = (expr) => TOKEN_KIND[pathOf(expr).split(".")[0]] || "date";

/** The namespaces that are a prefix rather than a key anyone named. */
const NAMESPACES = new Set(Object.keys(TOKEN_KIND));

/**
 * The key a token hangs off, for the "by key" half of the filter.
 *
 * A payload is written a section at a time — the `pmh` keys, then the `pip`
 * ones — and a flat list of sixty names makes that hunting. So the names are
 * offered by the key that owns them: `pmh`, `pip`, `prh`, `doctors`. What
 * hangs off nothing is `mainobject`, because it is the object itself.
 *
 * `*` is skipped: `selected.DoctorID.*.DeptCode` belongs to DoctorID like
 * every other column of it.
 */
/** Roots whose NEXT segment is an id, not a key anybody named. */
const ID_ROOTS = new Set(["rows", "data", "grid", "modal"]);

function parentKeyOf(expr) {
  const parts = pathOf(expr)
    .split(".")
    .filter((x) => x && x !== "*");
  let rest = NAMESPACES.has(parts[0]) ? parts.slice(1) : parts;
  // `rows.ds_v8m91757p.pmh.patientID` hangs off `pmh`, not off the id of the
  // source it came out of — which is the whole group anyway.
  if (ID_ROOTS.has(parts[0])) rest = rest.slice(1);
  return rest.length >= 2 ? rest[0] : "mainobject";
}

/**
 * The filter, as a menu of its own.
 *
 * A native <select> with <optgroup>s draws the operating system's list: full
 * window width, its own type size, headings in whatever the platform feels
 * like — a panel-sized control opening something the size of the screen. It
 * also cannot be told apart by eye from the rest of the page.
 *
 * So the menu is drawn here: the width of the control, headings in the colour
 * of the kind of name they hold, counts to the right, the current choice
 * marked, and the keyboard doing what it does in any menu.
 */
function ScopeFilter({ value, onChange, menu, total }) {
  const btn = useRef(null);
  const listEl = useRef(null);
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);

  /** Headings and choices in one list, which is what arrow keys walk. */
  const rows = useMemo(() => {
    const out = [{ value: "", label: `Everything (${total})`, kind: "date" }];
    menu.forEach((g) => {
      if (!g.children.length) {
        out.push({ value: g.all.value, label: `${g.name} (${g.total})`, kind: g.kind });
        return;
      }
      out.push({ head: true, label: g.name, kind: g.kind });
      out.push({ value: g.all.value, label: `All of it (${g.total})`, kind: g.kind, indent: true });
      g.children.forEach((c) => out.push({ value: c.value, label: c.label, kind: g.kind, indent: true }));
    });
    return out;
  }, [menu, total]);

  const pickable = rows.filter((r) => !r.head);
  const current = pickable.find((r) => r.value === value) || pickable[0];

  // Open ON the current choice, not at the top: with a dozen groups the one
  // in force is the one worth seeing first.
  useEffect(() => {
    if (!open) return;
    setAt(Math.max(0, rows.findIndex((r) => !r.head && r.value === value)));
  }, [open, rows, value]);

  useEffect(() => {
    if (!open) return;
    const el = listEl.current?.querySelector(".dsbi-filter-row.is-at");
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [open, at]);

  /**
   * The menu takes the keys the moment it opens, so a choice is one press
   * away rather than a press and a reach for the mouse.
   *
   * Focused as the node ARRIVES, not in an effect on `open`: the menu lives in
   * a portal that measures the anchor before it renders anything, so on the
   * tick `open` turns true there is nothing to focus yet.
   */
  const holdList = (node) => {
    listEl.current = node;
    if (node) node.focus();
  };

  const move = (step) => {
    setAt((i) => {
      let n = i;
      for (let guard = 0; guard < rows.length; guard += 1) {
        n = (n + step + rows.length) % rows.length;
        if (!rows[n].head) return n;
      }
      return i;
    });
  };

  const take = (row) => {
    onChange(row.value);
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <>
      <Tap
        ref={btn}
        className={`tone-filter dsbi-input dsbi-scope-filter ${open ? "is-open" : ""}`}
        title="Show only the names that come from one place, or hang off one key"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span data-kind={current?.kind}>{current?.label ?? `Everything (${total})`}</span>
        <Icon name="ChevronDown" size={12} />
      </Tap>
      <Popover anchorRef={btn} open={open} onClose={() => setOpen(false)} width={252} align="left">
        <div
          className="dsbi-filter-menu"
          role="listbox"
          ref={holdList}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              move(e.key === "ArrowDown" ? 1 : -1);
              return;
            }
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!rows[at]?.head) take(rows[at]);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              btn.current?.focus();
            }
          }}
        >
          {rows.map((r, i) =>
            r.head ? (
              <div className="dsbi-filter-head" data-kind={r.kind} key={`h${r.label}`}>
                {r.label}
              </div>
            ) : (
              <div
                key={r.value || "all"}
                role="option"
                aria-selected={r.value === value}
                data-kind={r.kind}
                className={`dsbi-filter-row ${i === at ? "is-at" : ""} ${r.value === value ? "is-on" : ""} ${
                  r.indent ? "is-in" : ""
                }`}
                onMouseEnter={() => setAt(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => take(r)}
              >
                <span>{r.label}</span>
                {r.value === value ? <Icon name="Check" size={12} /> : null}
              </div>
            ),
          )}
        </div>
      </Popover>
    </>
  );
}

/**
 * @param docked  in the full-screen panel's side rail: always open, filling
 *                the height, with its own header rather than a disclosure.
 */
export function ScopeBrowser({ docked = false }) {
  const [open, setOpen] = useState(docked);
  const [q, setQ] = useState("");
  // Which kind of name to show. Searching and filtering answer different
  // questions — "where is the one called panel?" and "what has this grid got?"
  // — and a list of thirty is read by narrowing, not by scrolling.
  const [group, setGroup] = useState("");
  // Values move while the panel is open (a choice on the canvas, an endpoint
  // that answered); nothing re-renders the Inspector when they do.
  const [tick, setTick] = useState(0);
  // "" | {expr, ok}: ok false means the clipboard refused and the token was
  // selected instead, so the keyboard can still take it.
  const [copied, setCopied] = useState(null);

  // Ids the screen invented, by the names it knows them as — see useScopeNames.
  const nameOf = useScopeNames();

  // What this browser has saved ({{local.*}}) is dozens of app keys nobody
  // binds most of the time, and they bury the screen's own names. Off until
  // asked for; the choice is remembered, like any other panel preference.
  const [showLocal, setShowLocal] = useState(() => {
    try {
      return window.localStorage.getItem(SHOW_LOCAL_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggleLocal = (on) => {
    setShowLocal(on);
    try {
      window.localStorage.setItem(SHOW_LOCAL_KEY, on ? "1" : "0");
    } catch {
      /* private window / blocked storage: the choice just is not remembered */
    }
  };

  const allEntries = useMemo(() => (open ? scopeEntries(liveScope(), nameOf) : []), [open, tick, nameOf]);
  const localCount = useMemo(() => allEntries.filter((e) => pathOf(e.expr).split(".")[0] === "local").length, [allEntries]);
  const entries = useMemo(
    () => (showLocal ? allEntries : allEntries.filter((e) => pathOf(e.expr).split(".")[0] !== "local")),
    [allEntries, showLocal],
  );

  /**
   * The groups, in the order the enumerator put them, each with its size.
   *
   * Named as they are shown — "Grid — Bed Summary", not `n_gy16fa4o` — because
   * the point of the filter is to pick a thing by what it IS.
   */
  /**
   * The filter's own menu: where a name comes from, and under which key.
   *
   * Two levels, because a group of fifty-eight is no more readable than a list
   * of sixty. The source is the heading, the keys under it are the choices —
   * and both are named the way they are shown, never by an id the screen
   * invented.
   */
  const menu = useMemo(() => {
    const out = [];
    const byGroup = new Map();
    entries.forEach((e) => {
      if (!byGroup.has(e.group)) byGroup.set(e.group, new Map());
      const keys = byGroup.get(e.group);
      const key = parentKeyOf(e.expr);
      keys.set(key, (keys.get(key) || 0) + 1);
    });
    byGroup.forEach((keys, name) => {
      const total = [...keys.values()].reduce((a, b) => a + b, 0);
      const children = [...keys]
        // `mainobject` last: it is the leftovers, not a section.
        .sort((a, b) => (a[0] === "mainobject") - (b[0] === "mainobject") || b[1] - a[1])
        .map(([key, n]) => ({ value: `k:${name}\u0000${key}`, label: `${nameOf("node", key) || nameOf("source", key) || key} (${n})` }));
      out.push({
        name,
        total,
        // The colour the group is drawn in, taken from what is in it.
        kind: kindOf(entries.find((e) => e.group === name)?.expr || ""),
        all: { value: `g:${name}`, label: `All of ${name} (${total})` },
        // One key under a heading is the heading again: not worth a line.
        children: children.length > 1 ? children : [],
      });
    });
    return out;
  }, [entries, nameOf]);

  // The screen changes under it: a grid that has gone takes its group with it,
  // and a filter pinned to nothing would show an empty list and no reason why.
  const valid = new Set(menu.flatMap((g) => [g.all.value, ...g.children.map((c) => c.value)]));
  const picked = valid.has(group) ? group : "";
  const pickedGroup = picked.startsWith("g:") ? picked.slice(2) : picked.slice(2).split("\u0000")[0];
  const pickedKey = picked.startsWith("k:") ? picked.slice(2).split("\u0000")[1] : "";

  const needle = q.trim().toLowerCase();
  const shown = entries.filter(
    (e) =>
      (!picked || (e.group === pickedGroup && (!pickedKey || parentKeyOf(e.expr) === pickedKey))) &&
      (!needle || `${e.expr} ${e.group} ${e.note || ""} ${e.short}`.toLowerCase().includes(needle)),
  );

  /**
   * A click takes the token.
   *
   * `navigator.clipboard` exists only in a secure context and this builder is
   * opened over plain http on a server, so it is often not there at all;
   * copyText falls back to an off-screen textarea, which is not. If even that
   * is refused the row says so and points at the drag, which needs no
   * clipboard and always works.
   *
   * What it does NOT do any more is select the token in place. That put a
   * selection inside a list whose rows are drag handles, and one stray sweep
   * painted the whole panel in the selection colour.
   */
  const copy = async (expr) => {
    setCopied({ expr, ok: await copyText(expr) });
  };

  return (
    <div className={`dsbi-scope ${docked ? "is-docked" : ""}`}>
      {docked ? (
        <div className="dsbi-scope-title">
          <b>What this screen holds</b>
          <span>{`${shown.length} of ${entries.length}`}</span>
        </div>
      ) : (
        <Tap className="dsbi-scope-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Icon name={open ? "ChevronUp" : "ChevronRight"} size={12} />
          <b>What this screen holds</b>
          <span>{open ? `${shown.length} of ${entries.length}` : "every value you can send, by name"}</span>
        </Tap>
      )}

      {open ? (
        <>
          <div className="dsbi-scope-tools">
            <input
              className="dsbi-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a name or a value…"
              spellCheck={false}
            />
            <ScopeFilter value={picked} onChange={setGroup} menu={menu} total={entries.length} />
            <Tap className="tone-refresh dsbi-mini is-icon" title="Read the screen again" onClick={() => setTick((t) => t + 1)}>
              <Icon name="RefreshCw" size={11} />
            </Tap>
            <label className="dsbi-scope-local" title="List what this browser has saved, as {{local.key}}">
              <input type="checkbox" checked={showLocal} onChange={(e) => toggleLocal(e.target.checked)} />
              <span>{`Local storage${localCount ? ` (${localCount})` : ""}`}</span>
            </label>
          </div>
          {entries.length === 0 ? (
            <p className="dsbi-note">
              Nothing is held yet. Run <b>Preview</b>, fill the screen in, come back — the values stay.
            </p>
          ) : (
            <p className="dsbi-scope-hint">Drag a name into a box, or click it to copy.</p>
          )}
          <div className="dsbi-scope-list">
            {shown.map((e, i) => (
              /* A div, not a <button>.
                 The app this builder lives in styles bare buttons globally —
                 a radius with !important on it, and whatever else a page
                 brings — and those rules land on a list of sixty rows that
                 are not buttons in any sense a designer means: they are names
                 to drag. So the row carries the ROLE without the tag, and the
                 keyboard gets Enter and Space back by hand. */
              <div
                role="button"
                tabIndex={0}
                className={`dsbi-scope-row ${copied?.expr === e.expr ? "is-copied" : ""}`}
                key={e.expr}
                data-kind={kindOf(e.expr)}
                title={`${e.expr} — drag into a box, or click to copy`}
                draggable
                onDragStart={(ev) => {
                  ev.dataTransfer.setData(TOKEN_DRAG, e.expr);
                  ev.dataTransfer.setData("text/plain", e.expr);
                  ev.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => copy(e.expr)}
                onKeyDown={(ev) => {
                  if (ev.key !== "Enter" && ev.key !== " ") return;
                  ev.preventDefault();
                  copy(e.expr);
                }}
              >
                {e.group !== shown[i - 1]?.group ? (
                  <span className="dsbi-scope-group" data-kind={kindOf(e.expr)}>
                    {e.group}
                  </span>
                ) : null}
                <span className="dsbi-scope-line">
                  <Icon name="GripVertical" size={11} className="dsbi-scope-grip" />
                  <code>{e.expr}</code>
                  {e.note ? <b className="dsbi-scope-name">{e.note}</b> : null}
                  <em>{e.type}</em>
                  <span className="dsbi-scope-val">{e.short}</span>
                  <i>{copied?.expr === e.expr ? (copied.ok ? "copied" : "could not copy — drag it") : "drag or copy"}</i>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- JS values ---
   Any value box can be switched to JavaScript with the small JS icon. The box
   then holds code ("values.Name.trim()"), stored as `{{js}} <code>` — see
   JS_PREFIX in utils/expressions — and run when the screen resolves the value.
   The eye becomes ▶, which runs it against the screen as it stands. */

const JS_IDENT = /^[A-Za-z_$][\w$]*$/;

/** `rows.node:n_x.0` -> `rows["node:n_x"][0]`, or null when it is no plain path. */
function pathToJs(path) {
  const parts = String(path || "").trim().split(".");
  if (!parts.length || !JS_IDENT.test(parts[0])) return null;
  return (
    parts[0] +
    parts
      .slice(1)
      .map((p) => (JS_IDENT.test(p) ? `.${p}` : /^\d+$/.test(p) ? `[${p}]` : `[${JSON.stringify(p)}]`))
      .join("")
  );
}

/**
 * What a box already held, as code — so switching to JS keeps the work:
 * `{{values.Name}}` -> `values.Name`, `Dr. {{row.Name}}` -> `` `Dr. ${row.Name}` ``,
 * plain text -> a string. A token with a filter has no exact JS twin; then the
 * code starts empty rather than wrong.
 */
function templateToJsCode(value) {
  const t = String(value ?? "");
  if (!t.trim()) return "";
  if (!t.includes("{{")) return JSON.stringify(t);
  const lone = /^\{\{\s*([^}]+?)\s*\}\}$/.exec(t.trim());
  if (lone) return /[|=]/.test(lone[1]) ? "" : pathToJs(lone[1]) ?? "";
  let ok = true;
  const body = t.replace(/`/g, "\\`").replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => {
    const js = /[|=]/.test(p) ? null : pathToJs(p);
    if (!js) ok = false;
    return `\${${js || ""}}`;
  });
  return ok ? `\`${body}\`` : "";
}

/** Code back to a plain value, when it is a plain path or a literal; else null. */
function jsCodeToTemplate(code) {
  const c = String(code ?? "").trim();
  if (!c) return "";
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\]|\["[^"]+"\])*$/.test(c)) {
    return `{{${c.replace(/\[(\d+)\]/g, ".$1").replace(/\["([^"]+)"\]/g, ".$1")}}}`;
  }
  try {
    const lit = JSON.parse(c);
    if (typeof lit === "string" || typeof lit === "number" || typeof lit === "boolean") return String(lit);
  } catch (e) {
    /* not a literal */
  }
  return null;
}

/** Switch a value into or out of JS, keeping what can be kept. */
function toggleJsValue(value, onChange) {
  if (isJsValue(value)) {
    const back = jsCodeToTemplate(jsCodeOf(value));
    // eslint-disable-next-line no-alert
    if (back === null && !window.confirm("Turn JS off? The code in this box will be removed.")) return;
    onChange(back ?? "");
  } else {
    onChange(toJsValue(templateToJsCode(value)));
  }
}

/** A field picked from Map… while the box holds code: its path, added to the code. */
function addPickToJs(value, pick) {
  const lone = /^\{\{\s*([^}]+?)\s*\}\}$/.exec(String(pick || "").trim());
  const js = lone ? pathToJs(lone[1]) : null;
  if (!js) return value;
  const code = jsCodeOf(value).trim();
  return toJsValue(code ? `${code} ${js}` : js);
}

/** The JS icon — beside a value box, before its delete. */
function JsToggle({ on, onClick }) {
  return (
    <Tap
      className={`dsbi-mini is-icon dsbi-js-btn ${on ? "is-on" : ""}`}
      title={on ? "JavaScript — click to go back to a normal value" : "Write this value as JavaScript"}
      aria-label={on ? "Turn JavaScript off" : "Write this value as JavaScript"}
      aria-pressed={on}
      onClick={onClick}
    >
      JS
    </Tap>
  );
}

/** ▶ — runs a JS value against the screen now (the eye, for code). */
function JsRunButton({ on, onClick }) {
  return (
    <Tap
      className={`tone-peek dsbi-mini is-icon dsbi-peek-btn dsbi-js-run ${on ? "is-on" : ""}`}
      title="Run this JS against the screen now and show what it returns"
      aria-label="Run this JS"
      aria-pressed={on}
      onClick={onClick}
    >
      <Icon name="Play" size={11} />
    </Tap>
  );
}

/**
 * A plain value box with the JS icon and ▶ — for the places that are a bare
 * input rather than a ValueMap (a payload key's per-condition values).
 */
export function JsAwareInput({ value, onChange, placeholder = "", peekScope }) {
  const js = isJsValue(value);
  const [running, setRunning] = useState(false);
  return (
    <div className={`dsbi-jsin${js ? " is-js" : ""}`}>
      <DebouncedInput
        key={js ? "js" : "value"}
        value={js ? jsCodeOf(value) : value ?? ""}
        onChange={(v) => onChange(js ? toJsValue(v) : v)}
        placeholder={js ? 'JS — values.Name.trim(), row.Ids.split(",")' : placeholder}
        spellCheck={js ? false : undefined}
      />
      {js ? <JsRunButton on={running} onClick={() => setRunning((v) => !v)} /> : null}
      <JsToggle
        on={js}
        onClick={() => {
          setRunning(false);
          toggleJsValue(value, onChange);
        }}
      />
      {js && running ? (
        <PeekBox value={value ?? ""} onUse={onChange} peekScope={peekScope} onClose={() => setRunning(false)} />
      ) : null}
    </div>
  );
}

export function ValueMap({
  value,
  onChange,
  formFields = [],
  rowFields = [],
  rowSource = "",
  placeholder = "",
  multiline = false,
  // Keys that only exist where this box is being used — the per-item tokens of
  // a repeated payload key. Offered first, because inside one item they are
  // what the box is nearly always filled with.
  extraSources = [],
  // Given the live scope, the scope this box is answered against. A repeated
  // payload key maps it to ONE item, which is where {{item}} exists at all.
  peekScope,
  // Drawn between the box and the eye — a payload key's "send as" picker.
  beforePeek = null,
}) {
  const screenSources = useValueSources({ formFields, rowFields, rowSource });
  const sources = extraSources.length ? [...extraSources, ...screenSources] : screenSources;
  // A record with forty columns is scrolled, not read. Same rule the prop
  // pickers use: past a dozen entries the list gains a search box.
  const searchable = sources.length > 12;
  const label = sources.length > 2 ? "Map…" : "No fields yet";
  const [peeking, setPeeking] = useState(false);
  const js = isJsValue(value);
  // In JS mode a pick from Map… adds that field's path to the code.
  const pick = (v) => v && onChange(js ? addPickToJs(value, v) : v);
  return (
    <div className={`dsbi-vmap${beforePeek ? " has-before" : ""}${js ? " is-js" : ""}`}>
      {/* Inside a repeat this box is answered per item, so the names offered
          at the caret must be read in that scope too — the same mapping the
          peek uses. */}
      <TokenScopeContext.Provider value={peekScope || null}>
        {js ? (
          <DebouncedInput
            key="js"
            value={jsCodeOf(value)}
            onChange={(v) => onChange(toJsValue(v))}
            placeholder={'JS — values.Name.trim(), row.Ids.split(",")'}
            multiline={multiline}
            spellCheck={false}
          />
        ) : (
          <DebouncedInput key="value" value={value ?? ""} onChange={onChange} placeholder={placeholder} multiline={multiline} />
        )}
      </TokenScopeContext.Provider>
      {beforePeek}
      {js ? (
        <JsRunButton on={peeking} onClick={() => setPeeking((v) => !v)} />
      ) : (
        <Tap
          className={`tone-peek dsbi-mini is-icon dsbi-peek-btn ${peeking ? "is-on" : ""}`}
          title="Show what this holds right now"
          aria-label="Show what this holds right now"
          aria-pressed={peeking}
          onClick={() => setPeeking((v) => !v)}
        >
          <Icon name="Eye" size={11} />
        </Tap>
      )}
      {searchable ? (
        <Combo
          // Always empty: this picker inserts a template into the box beside
          // it, it does not hold a value of its own, so the button keeps
          // reading "Map…" rather than the last thing chosen.
          value=""
          onChange={pick}
          options={sources}
          placeholder={label}
          searchPlaceholder="Search fields…"
          allowClear={false}
          tapClass="tone-map"
        />
      ) : (
        <SelectBox value="" onChange={pick} options={sources} placeholder={label} className="tone-map" />
      )}
      <JsToggle
        on={js}
        onClick={() => {
          setPeeking(false);
          toggleJsValue(value, onChange);
        }}
      />
      {peeking ? (
        <PeekBox key={js ? "js" : "value"} value={value ?? ""} onUse={onChange} peekScope={peekScope} onClose={() => setPeeking(false)} />
      ) : null}
    </div>
  );
}

/**
 * A value chosen from what the screen holds — the Value of "Set field value"
 * and "Set variable".
 *
 * A dropdown first, because the answer is nearly always one of the screen's
 * own keys, and each is listed with where it comes from ("IPDCaseTypeID ›
 * RoomTypeID (picked row)"). Anything else — a literal, two
 * templates joined — is typed into the search and kept as typed, or written
 * in the plain box the pencil switches to.
 */
function ValuePick({ value, onChange, formFields = [], rowFields = [], rowSource = "", placeholder = "" }) {
  const sources = useValueSources({ formFields, rowFields, rowSource });
  const [typing, setTyping] = useState(false);
  const [running, setRunning] = useState(false);
  const text = value == null ? "" : String(value);
  const known = sources.some((o) => o.value === text);
  const js = isJsValue(text);
  const jsToggle = (
    <JsToggle
      on={js}
      onClick={() => {
        setRunning(false);
        toggleJsValue(text, onChange);
      }}
    />
  );
  // Code is typed, not picked: a box, ▶ to run it, and the JS icon to leave.
  if (js) {
    return (
      <div className="dsbi-vpick is-js">
        <div className="dsbi-vpick-row has-js">
          <DebouncedInput
            key="js"
            value={jsCodeOf(text)}
            onChange={(v) => onChange(toJsValue(v))}
            placeholder={'JS — values.Name.trim(), row.Ids.split(",")'}
            spellCheck={false}
          />
          <JsRunButton on={running} onClick={() => setRunning((v) => !v)} />
          {jsToggle}
        </div>
        {running ? <PeekBox value={text} onUse={onChange} onClose={() => setRunning(false)} /> : null}
      </div>
    );
  }
  return (
    <div className="dsbi-vpick">
      <div className="dsbi-vpick-row has-js">
        {typing ? (
          <DebouncedInput value={text} onChange={onChange} placeholder={placeholder} />
        ) : (
          <Combo
            value={text}
            onChange={onChange}
            options={sources}
            placeholder="Pick a key…"
            searchPlaceholder="Search keys, or type a value…"
            allowCustom
            customLabel={(v) => `Use "${v}" as typed`}
          />
        )}
        <button
          type="button"
          className="dsbi-mini"
          title={typing ? "Pick from the list" : "Type the value instead"}
          aria-label={typing ? "Pick from the list" : "Type the value instead"}
          onClick={() => setTyping((t) => !t)}
        >
          <Icon name={typing ? "ListChecks" : "Pencil"} size={11} />
        </button>
        {jsToggle}
      </div>
      {/* The list shows what a key IS; this shows what will be written, so a
          picked entry is never a mystery when the chain is read back. */}
      {known ? (
        <p className="dsbi-note">
          Sends <code>{text}</code>
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- call API */

/**
 * Where an app page opens. "" keeps the centred dialog every screen has used
 * so far; the rest are the app's own OverLay sliding in from that edge — what
 * the hand-coded single-window pages do, at the full width of the screen.
 */
const APP_MODAL_POSITIONS = [
  { value: "", label: "Centred dialog" },
  { value: "bottom", label: "Sheet — slides up from the bottom" },
  { value: "top", label: "Sheet — drops from the top" },
  { value: "right", label: "Sheet — from the right" },
  { value: "left", label: "Sheet — from the left" },
];

const CALL_METHODS = ["GET", "POST", "PUT", "DELETE"].map((m) => ({ value: m, label: m }));

const BODY_AS = [
  { value: "auto", label: "Automatic — form data when it carries a file" },
  { value: "json", label: "JSON" },
  { value: "form", label: "Form data (multipart)" },
];

const CALL_VIA = [
  { value: "endpoint", label: "Pick an endpoint" },
  { value: "source", label: "Re-run something on this screen" },
  { value: "url", label: "Type a URL by hand" },
];

/** What an action calls, inferred for screens saved before `via` existed. */
export const callVia = (a) => a?.via || (a?.api?.endpoint ? "endpoint" : a?.sourceId ? "source" : a?.url ? "url" : "endpoint");

/**
 * The "Call API" action's own fields.
 *
 * Picking an endpoint is the default because it is the only route that can
 * send a POST with the screen's values in it: the endpoint config carries the
 * verb, the parameters and the body, and each parameter is a template box, so
 * a save is `{{values.patientName}}` typed next to the parameter it fills.
 */
function CallApiFields({ action, patch, sourceOptions, formFields = [], rowFields = [], rowSource = "", rowTargets = [], targetNode, patchNode }) {
  const via = callVia(action);

  /**
   * What a Test call hands to the component it feeds.
   *
   * Exactly what Sync does for a component's own endpoint: preview rows so the
   * canvas shows real data, and columns when there are none to lose. A grid
   * filled by a button has no endpoint of its own, so this is the only way its
   * key dropdowns and columns ever learn the shape of the data.
   */
  const onSample = (rows, columns) => {
    if (!action.targetId || !patchNode) return;
    const existing = Array.isArray(targetNode?.props?.columns) ? targetNode.props.columns : [];
    const next = { previewRows: rows };
    if (shouldAutoBindColumns(existing, columns)) next.columns = mergeColumns(existing, columns);
    patchNode(action.targetId, next);
  };
  return (
    <>
      <Row label="Call">
        <SelectBox value={via} onChange={(v) => patch({ via: v })} options={CALL_VIA} />
      </Row>

      {via === "endpoint" ? (
        <>
          <ApiPicker
            value={action.api}
            onChange={(v) => patch({ api: v })}
            mode="call"
            formFields={formFields}
            rowFields={rowFields}
            rowSource={rowSource}
            wantsRows={!!action.targetId}
            onSample={onSample}
          />
          <Row
            label="Send body as"
            hint="A file travels only as form data: put the File Upload's value on a body key — {{values.Excel}} sends the file, {{values.Excel.name}} its name. Automatic does that by itself; everything else stays JSON."
          >
            <SelectBox value={action.bodyAs || "auto"} onChange={(v) => patch({ bodyAs: v === "auto" ? undefined : v })} options={BODY_AS} allowEmpty={false} />
          </Row>
        </>
      ) : null}

      {via === "source" ? (
        <Row label="Data source" hint="Re-runs a table's or a shared source's own call">
          <SelectBox value={action.sourceId} onChange={(v) => patch({ sourceId: v })} options={sourceOptions} />
        </Row>
      ) : null}

      {via === "url" ? (
        <>
          <Row label="URL">
            <DebouncedInput value={action.url} onChange={(v) => patch({ url: v })} placeholder="Patient/SavePatient" />
          </Row>
          <Row label="Method">
            <SelectBox value={action.method || "GET"} onChange={(v) => patch({ method: v })} options={CALL_METHODS} />
          </Row>
          <Row label="Body (JSON)" stack>
            <DebouncedInput
              multiline
              rows={5}
              value={typeof action.body === "string" ? action.body : action.body ? JSON.stringify(action.body, null, 1) : ""}
              spellCheck={false}
              placeholder={'{ "PatientName": "{{values.patientName}}" }'}
              onChange={(v) => patch({ body: v })}
            />
          </Row>
          <p className="dsbi-note">
            Templates are resolved before the JSON is parsed, so <code>{"{{values.id}}"}</code> works quoted or bare.
          </p>
        </>
      ) : null}

      {/* Without this a call is fire-and-forget: the request goes out and the
          rows it returns are dropped. Naming a component here is what makes a
          Search button fill a grid that has no endpoint of its own. */}
      {via !== "source" ? (
        <>
          <Row label="Put the rows into" hint="Leave empty if the call only writes">
            <SelectBox
              value={action.targetId}
              onChange={(v) => patch({ targetId: v })}
              options={rowTargets}
              placeholder="Nothing — just send it"
            />
          </Row>
          {action.targetId ? (
            <Row
              label="Keep rows when"
              hint="Empty keeps every row. Tested per row, so the field box names a field of the ANSWER — and the value box can read {{user.role}}, a variable or a form value."
            >
              <WhenRows
                value={action.keepWhen}
                onChange={(v) => patch({ keepWhen: v })}
                fieldOptions={rowFieldsOf(targetNode?.props)}
              />
            </Row>
          ) : null}
          <Row
            label="Save response in variable"
            hint="Read it anywhere on the screen as {{vars.<name>}}, or {{vars.<name>.Field}} for one field — it is under Map… too. Kept until the next call replaces it."
          >
            <DebouncedInput
              value={action.responseVar}
              onChange={(v) => patch({ responseVar: String(v || "").replace(/[^A-Za-z0-9_$]/g, "") || undefined })}
              placeholder="e.g. saveResult"
            />
          </Row>
          {action.responseVar ? (
            <Row
              label="Value at"
              hint="Where in the response. Empty keeps the whole answer ({ success, message, data }); data keeps just its data; data.0 the first record; data.pdfUrl one field."
            >
              <DebouncedInput
                value={action.responsePick}
                onChange={(v) => patch({ responsePick: String(v || "").trim() || undefined })}
                placeholder="the whole response"
              />
            </Row>
          ) : null}
        </>
      ) : null}
    </>
  );
}

const EXPORT_VIA = [
  { value: "endpoint", label: "Call an endpoint now" },
  { value: "source", label: "What a table / data source already holds" },
  { value: "list", label: "A list on the screen ({{response.data}}, a grid's rows…)" },
];

const EXPORT_FORMATS = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV (.csv)" },
];

/**
 * The columns an export writes: which field, under which heading, in which
 * order. An upload sheet is read back by its headings, so they are named here
 * rather than left to whatever the endpoint calls its fields.
 */
function ExportColumnsEditor({ value, onChange, keys = [] }) {
  const items = Array.isArray(value) ? value : [];
  const set = (i, patch) => onChange(items.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };
  const missing = keys.filter((k) => !items.some((c) => c.key === k));
  return (
    <div className="dsbi-list">
      {items.map((c, i) => (
        <div key={i} className="dsbi-expcol">
          <KeyCombo
            value={c.key}
            onChange={(v) => set(i, { key: v, header: c.header || humanizeKey(v) })}
            keys={keys}
            placeholder="Field"
            searchPlaceholder="Search fields…"
            allowCustom
          />
          <DebouncedInput value={c.header} onChange={(v) => set(i, { header: v })} placeholder={c.key || "Heading"} />
          <button type="button" className="dsbi-x is-plain" title="Move up" onClick={() => move(i, i - 1)}>
            <Icon name="ArrowUp" size={11} />
          </button>
          <button type="button" className="dsbi-x is-plain" title="Move down" onClick={() => move(i, i + 1)}>
            <Icon name="ArrowDown" size={11} />
          </button>
          <button type="button" className="dsbi-x" title="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Icon name="X" size={11} />
          </button>
        </div>
      ))}
      <div className="dsbi-inline dsbi-expcol-foot">
        <button type="button" className="dsbi-add" onClick={() => onChange([...items, { key: "", header: "" }])}>
          <Icon name="Plus" size={12} /> Add column
        </button>
        {missing.length ? (
          <button
            type="button"
            className="dsbi-mini"
            title={missing.join(", ")}
            onClick={() => onChange([...items, ...missing.map((k) => ({ key: k, header: humanizeKey(k) }))])}
          >
            <Icon name="ListChecks" size={12} /> Add {items.length ? "the rest" : "every field"} ({missing.length})
          </button>
        ) : null}
        {items.length ? (
          <button type="button" className="dsbi-mini is-danger" onClick={() => onChange([])}>
            <Icon name="Trash2" size={12} /> Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The "Export data" action's own fields.
 *
 * "Call an endpoint now" is the hand-coded pages' "Download … Excel Sheet"
 * button in one step: the endpoint is asked with the form's values and its
 * answer is saved as a sheet. A Test call there is also how the column list
 * learns the fields the endpoint sends.
 */
function ExportFields({ action: a, patch, sourceOptions, nodes = [], formFields = [], rowFields = [], rowSource = "" }) {
  const via = exportVia(a);
  const format = exportFormat(a);
  // The fields a column can be picked from: the last Test call's, and for a
  // source export the columns and sample rows of the component behind it.
  const keys = useMemo(() => {
    const out = [...(Array.isArray(a.sampleKeys) ? a.sampleKeys : [])];
    if (via === "source") {
      const ownerId = String(a.sourceId || "").startsWith("node:") ? String(a.sourceId).slice(5) : "";
      const owner = ownerId ? (nodes || []).find((n) => n.id === ownerId) : null;
      (owner?.props?.columns || []).forEach((c) => c?.key && c.type !== "actions" && c.type !== "frameMenu" && out.push(c.key));
      rowFieldsOf(owner?.props).forEach((k) => out.push(k));
    }
    return [...new Set(out.filter((k) => typeof k === "string" && k && !k.startsWith("__")))];
  }, [a.sampleKeys, a.sourceId, via, nodes]);

  return (
    <>
      <Row label="Rows come from">
        <SelectBox value={via} onChange={(v) => patch({ via: v })} options={EXPORT_VIA} allowEmpty={false} />
      </Row>

      {via === "endpoint" ? (
        <>
          <ApiPicker
            value={a.api}
            onChange={(v) => patch({ api: v })}
            mode="call"
            formFields={formFields}
            rowFields={rowFields}
            rowSource={rowSource}
            wantsRows
            onSample={(rows, columns) => patch({ sampleKeys: (columns || []).map((c) => c.key).filter(Boolean) })}
          />
          <p className="dsbi-note">
            Fill the parameters from the form — <code>{"{{values.CentreID}}"}</code> — and press <b>Test</b> once: the
            fields it answers with become the choices under <b>Columns</b>. A failed call stops the chain with its
            message, and the answer is <code>{"{{response}}"}</code> for the steps after this one.
          </p>
        </>
      ) : null}

      {via === "source" ? (
        <Row label="Data source">
          <SelectBox value={a.sourceId} onChange={(v) => patch({ sourceId: v })} options={sourceOptions} />
        </Row>
      ) : null}

      {via === "list" ? (
        <Row
          label="List"
          hint="A template naming a list of records: {{response.data}} after a Call API above, {{grid.<table>.checked}} for the ticked rows, {{vars.<name>}}."
        >
          <ValuePick
            value={a.list}
            onChange={(v) => patch({ list: v })}
            formFields={formFields}
            rowFields={rowFields}
            rowSource={rowSource}
            placeholder="{{response.data}}"
          />
        </Row>
      ) : null}

      <Row label="File type">
        <SelectBox value={format} onChange={(v) => patch({ format: v })} options={EXPORT_FORMATS} allowEmpty={false} />
      </Row>
      <Row label="File name" hint="Templates work: Stock {{labels.CentreID}} {{today}}. The extension is added for you.">
        <TemplateField value={a.fileName} onChange={(v) => patch({ fileName: v })} placeholder="export" />
      </Row>

      {format === "xlsx" ? (
        <>
          <Row label="Title rows above the headings">
            <Toggle value={a.titleRow !== false} onChange={(v) => patch({ titleRow: v })} />
          </Row>
          {a.titleRow !== false ? (
            <div className="dsbi-grid2">
              <Row label="Title">
                <TemplateField value={a.sheetTitle} onChange={(v) => patch({ sheetTitle: v })} placeholder="The file name" />
              </Row>
              <Row label="Subtitle">
                <TemplateField value={a.sheetSubtitle} onChange={(v) => patch({ sheetSubtitle: v })} placeholder="None" />
              </Row>
            </div>
          ) : (
            <p className="dsbi-note">
              The headings are the sheet's first row — what a sheet that is filled in and uploaded back usually needs.
            </p>
          )}
        </>
      ) : null}

      <div className="dsbi-sub">
        <div className="dsbi-sub-title">Columns</div>
        <ExportColumnsEditor value={a.columns} onChange={(v) => patch({ columns: v })} keys={keys} />
        <p className="dsbi-note">
          {Array.isArray(a.columns) && a.columns.some((c) => c?.key)
            ? "Only these fields are written, under these headings, in this order."
            : via === "source"
              ? "Empty writes the columns the table shows, or every field when it has none."
              : "Empty writes every field the rows carry, under their own names."}
        </p>
      </div>

      <Row label="When there is nothing to export">
        <DebouncedInput value={a.emptyMessage} onChange={(v) => patch({ emptyMessage: v })} placeholder="Nothing to export" />
      </Row>
    </>
  );
}

/**
 * The chain a save almost always is: check the form, send it, say so, close
 * the dialog, reload what is behind it. Seeded with the pieces in place and the
 * endpoint left blank — the one decision that cannot be guessed.
 */
function saveChain(node) {
  const dismiss =
    node.type === "ModalDialog"
      ? [{ type: "closeModal", target: node.id }]
      : node.type === "DrawerPanel"
        ? [{ type: "closePanel", target: node.id }]
        : [];
  return [
    { type: "validate" },
    { type: "callApi", via: "endpoint", api: { method: "POST", controller: "", endpoint: "", params: [] } },
    { type: "toast", message: "Saved", variant: "success" },
    ...dismiss,
    { type: "refresh", sourceId: "" },
  ];
}

/**
 * One editable list of actions.
 *
 * Lifted out of EventsEditor so a table column can carry its own chain: the
 * editor is the same either way, and a second copy of thirty action fields
 * would go stale the day a new action type is added.
 */
/**
 * What open/close can actually point at — see OVERLAY_TARGETS.
 *
 * There is deliberately no "…and everything else" fallback. Offering the whole
 * tree when the screen has no modal on it yet is how a button ends up pointed
 * at a Card / Panel: the action fires, the panel cannot answer, and nothing
 * happens with nothing to show for it. An empty list plus the note below says
 * what to add instead. Anything already targeted stays listed, so an older
 * screen never silently loses its selection.
 */
function overlayTargets(nodes, actionType, current) {
  const kind = overlayKind(actionType);
  const wanted = OVERLAY_TARGETS[kind]?.types;
  return (nodes || [])
    .filter((n) => !wanted || wanted.includes(n.type) || n.id === current)
    .map((n) => ({ value: n.id, label: `${n.name} (${n.type})` }));
}

/**
 * The target picker, and the two things it has to say out loud.
 *
 * A target that cannot answer is the failure with nothing to see — the button
 * fires, the screen does not move — so a wrong pick is called out here rather
 * than left for someone to find by clicking. A screen with no overlay on it
 * yet gets the same treatment: what to add, and why the panel already on the
 * page is not it.
 */
/**
 * Everything in the app a modal action can open besides the dialogs on the
 * canvas: the curated app modals, the module's patient screens, and every
 * component file under src/pages and src/components. Built once — the file
 * list is the bundle's own and cannot change while the builder is open.
 */
const MODAL_COMPONENT_OPTIONS = [
  ...APP_MODAL_OPTIONS.map((o) => ({
    ...o,
    group: String(o.value).startsWith(FRAME_MODAL_PREFIX) ? "Patient screens" : "App modals",
  })),
  ...FILE_MODAL_OPTIONS,
];

/**
 * Everything an action can reload: the screen's shared data sources, every
 * component that owns its endpoint, and every select's own options endpoint —
 * the list a Select + Add refreshes after its dialog saves.
 */
function refreshTargets(nodes, dataSources) {
  return [
    ...Object.values(dataSources || {}).map((d) => ({ value: d.id, label: d.name || d.id })),
    ...(nodes || [])
      .filter((n) => n.props?.apiConfig?.endpoint)
      .map((n) => ({ value: nodeSourceId(n.id), label: `${n.name} — ${n.props.apiConfig.endpoint}` })),
    ...(nodes || [])
      .filter((n) => n.props?.optionsSource === "endpoint" && n.props?.optionsApi?.endpoint)
      .map((n) => ({ value: nodeSourceId(n.id), label: `${n.name} — options (${n.props.optionsApi.endpoint})` })),
  ];
}

/** What each picked component was read as, by key — a module is read once per session. */
const COMPONENT_INFO = new Map();
const NO_INFO = { props: [], fields: [] };

/**
 * A picked component, read (utils/componentProps) the first time it is picked:
 * `{ props, fields }` — the props it reads and what it reports through
 * setModalData. `null` while loading or when nothing is picked.
 */
function useComponentInfo(key) {
  const [info, setInfo] = useState(() => (key && COMPONENT_INFO.get(key)) || null);
  useEffect(() => {
    if (!key) {
      setInfo(null);
      return undefined;
    }
    if (COMPONENT_INFO.has(key)) {
      setInfo(COMPONENT_INFO.get(key));
      return undefined;
    }
    const spec = appModalSpec(key);
    if (!spec?.load) return undefined;
    let alive = true;
    spec
      .load()
      .then((m) => {
        const read = { props: propNamesOf(m?.default), fields: modalFieldsOf(m?.default) };
        COMPONENT_INFO.set(key, read);
        if (alive) setInfo(read);
      })
      .catch(() => {
        if (alive) setInfo(NO_INFO);
      });
    return () => {
      alive = false;
    };
  }, [key]);
  return info;
}

// What the dialog host hands every component whatever the action says.
const HOST_PROPS = new Set([
  "data",
  "onSave",
  "onClose",
  "setVisible",
  "setModalData",
  "modalData",
  "setShowFlowSheet",
  "setShowMedicationCalendar",
  "setShowNotesModal",
]);

/**
 * The picked component's own props, split into what is handled — the host's
 * props and every callback, which gets a stand-in — and what it may need
 * passed. A click on one of the latter adds it to "Pass to the component".
 */
function ComponentPropsHint({ names, given = {}, onAdd }) {
  if (!names || !names.length) return null;
  const standIns = standInProps(names, {}, { close: () => {}, collect: () => {} });
  const handled = names.filter((n) => HOST_PROPS.has(n) || typeof standIns[n] === "function");
  const open = names.filter((n) => !handled.includes(n));
  return (
    <div className="dsbi-propnames">
      {open.length ? (
        <div className="dsbi-propnames-row">
          <span className="dsbi-hint">It reads:</span>
          {open.map((n) => {
            const has = Object.prototype.hasOwnProperty.call(given || {}, n);
            return (
              <button
                key={n}
                type="button"
                className={`dsbi-mini${has ? " is-on" : ""}`}
                disabled={has}
                title={has ? "Already passed" : `Pass ${n} to the component`}
                onClick={() => onAdd(n)}
              >
                {has ? <Icon name="Check" size={11} /> : <Icon name="Plus" size={11} />} {n}
              </button>
            );
          })}
        </div>
      ) : null}
      {handled.length ? (
        <div className="dsbi-hint">
          Handled for you: {handled.join(", ")}. A list it is not passed starts as [], a record as {"{}"}.
        </div>
      ) : null}
    </div>
  );
}

/** What a new "Save button" chain starts as: send it, say so. */
const defaultSaveActions = () => [
  { type: "callApi", via: "endpoint", api: { method: "POST", controller: "", endpoint: "", params: [] } },
  { type: "toast", message: "Saved", variant: "success" },
];

/**
 * @param forAdd  rendered for a Select + Add's + button: what reloads after a
 *                save is the select itself, so that choice is not offered.
 */
function OverlayTarget({
  action,
  patch,
  nodes,
  sourceOptions = [],
  dataSources = {},
  patchNode,
  label = "Target component",
  forAdd = false,
}) {
  const kind = overlayKind(action.type);
  const spec = OVERLAY_TARGETS[kind];
  const canvas = overlayTargets(nodes, action.type, action.target).map((o) => ({ ...o, group: "On this screen" }));
  // A modal can be any component of the app, opened on the row; a panel is
  // still one of the drawers on the canvas.
  const isModal = kind === "modal";
  const options = isModal ? [...canvas, ...MODAL_COMPONENT_OPTIONS] : canvas;
  const component = isModal && action.appModal ? appModalSpec(action.appModal) : null;
  const info = useComponentInfo(component ? action.appModal : "");
  const propNames = info?.props || null;
  const reported = info?.fields || [];
  const dialogFields = useMemo(
    () => (component && reported.length ? { label: component.label, fields: reported } : null),
    [component, reported],
  );
  const picked = (nodes || []).find((n) => n.id === action.target);
  const wrongPick = !!(picked && spec && !spec.types.includes(picked.type));
  const nothingToPick = !canvas.length || (canvas.length === 1 && wrongPick);

  // One picker, two kinds of answer: a node on the canvas goes in `target`, a
  // component of the app in `appModal`. Only one is ever set, so the runtime
  // never has to choose between them.
  const pick = (v) => {
    if (!v) patch({ target: undefined, appModal: undefined });
    else if (canvas.some((o) => o.value === v)) patch({ target: v, appModal: undefined });
    else patch({ appModal: v, target: undefined });
  };

  return (
    <>
      <Row
        label={label}
        hint={
          forAdd
            ? undefined
            : isModal && action.appModal
            ? action.type === "openModal"
              ? "Opened from a row, the component is handed that row as data."
              : undefined
            : !wrongPick && canvas.length
              ? "Opened from a row, its contents read that row as {{row.Field}}."
              : undefined
        }
      >
        <Combo
          value={(isModal && action.appModal) || action.target || ""}
          onChange={pick}
          options={options}
          placeholder="—"
          searchPlaceholder={isModal ? "Search dialogs, pages and components…" : "Search…"}
        />
      </Row>
      {wrongPick && spec ? (
        <p className="dsbi-note is-warn">
          <b>{picked.name || picked.type}</b> is a {picked.type} — it is already on the page, so there is nothing to
          open. Only a <b>{spec.label}</b> answers this action.
        </p>
      ) : null}
      {isModal && action.appModal && !component ? (
        <p className="dsbi-note is-warn">
          <b>{action.appModal}</b> is not in the app any more — it was moved, renamed or deleted. Pick it again from
          the list.
        </p>
      ) : null}
      {nothingToPick && spec && !(isModal && action.appModal) ? (
        isModal ? (
          <p className="dsbi-note">
            Pick any page or component above to open it in a dialog, or add <b>Overlays → {spec.label}</b> from the
            palette and design the dialog's contents yourself — a Card / Panel, a form, a table — then point this
            action at it.
          </p>
        ) : (
          <p className="dsbi-note">
            Add <b>Overlays → {spec.label}</b> from the palette and design the dialog's contents inside it — a Card /
            Panel, a form, a table, whatever it needs — then point this action at it.
          </p>
        )
      ) : null}
      {component && action.type === "openModal" ? (
        <>
          <div className="dsbi-grid2">
            <Field label="Dialog title">
              <DebouncedInput value={action.title || ""} onChange={(v) => patch({ title: v })} placeholder={component.title} />
            </Field>
            <Field label="Width">
              <DebouncedInput
                value={action.size || ""}
                onChange={(v) => patch({ size: v })}
                placeholder={action.position ? "100vw" : component.size || "75vw"}
              />
            </Field>
          </div>
          <Row
            label="Opens as"
            hint="A sheet is the app's own OverLay — the full-width slide-in the single-window pages use for every action. The same page either way; only the entrance differs."
          >
            <SelectBox value={action.position || ""} onChange={(v) => patch({ position: v })} options={APP_MODAL_POSITIONS} />
          </Row>
          <Row
            label="Pass to the component"
            stack
            hint="Its own prop names. Values are templates: {{row}} for the whole record, {{row.TID}}, {{values.x}}, {{vars.x}}. It always gets the row as data, plus onClose, setVisible and onSave."
          >
            <KeyValueEditor
              value={action.props}
              onChange={(v) => patch({ props: v })}
              keyPlaceholder="patientData"
              valPlaceholder="{{row}}"
            />
          </Row>
          {/* The other direction: what the page hands BACK when it is done. */}
          <div className="dsbi-sub">
            <div className="dsbi-sub-title">When it calls back</div>
            <ListShell
              items={action.callbacks || []}
              onChange={(v) => patch({ callbacks: v })}
              addLabel="Add a callback"
              blank={() => ({ name: "", actions: [] })}
              render={(cb, patchCb) => (
                <>
                  <Row label="Its prop">
                    <DebouncedInput value={cb.name || ""} onChange={(v) => patchCb({ name: v })} placeholder="bindDetailAPI" />
                  </Row>
                  <ActionListEditor
                    value={cb.actions || []}
                    onChange={(v) => patchCb({ actions: v })}
                    nodes={nodes}
                    dataSources={dataSources}
                    patchNode={patchNode}
                  />
                </>
              )}
            />
            <p className="dsbi-note">
              The page reports back by calling one of its own props — the registration page calls <code>bindDetailAPI</code>{" "}
              once it has saved, the search dialogs call <code>handleSearch</code>. Name it here and this chain runs when it
              fires, with what the page passed available as <code>{"{{args.0}}"}</code> (a record also reads as{" "}
              <code>{"{{modal.Field}}"}</code>). This is how a screen reloads itself after the page it opened has finished.
            </p>
          </div>
          <ComponentPropsHint
            names={propNames}
            given={action.props}
            onAdd={(name) => patch({ props: { ...(action.props || {}), [name]: "" } })}
          />
          {propNames?.includes("setModalData") && !action.saveActions && action.type === "openModal" ? (
            <p className="dsbi-note is-warn">
              <b>{component.label}</b> reports its fields through <code>setModalData</code> and has no Save of its
              own — turn on <b>Save button</b> below and pick the save endpoint, or what is typed goes nowhere.
            </p>
          ) : null}
          {forAdd ? null : (
            <Row label="Refresh after it saves" hint="When the component saves, the dialog closes and this reloads.">
              <SelectBox value={action.sourceId} onChange={(v) => patch({ sourceId: v })} options={sourceOptions} />
            </Row>
          )}
          {/* The app's small add dialogs (ReferDoctorModal and ~200 like it)
              draw only fields and report them through setModalData; the page
              that opens them owns Save and the API call. This is that page. */}
          <Row
            label="Save button"
            hint="For a component that only draws fields and reports them through setModalData. The dialog gets Save / Cancel, and Save runs the actions below with what it reported as {{modal.<field>}}."
          >
            <Toggle
              value={!!action.saveActions}
              onChange={(on) => patch({ saveActions: on ? defaultSaveActions() : undefined })}
            />
          </Row>
          {action.saveActions ? (
            <div className="dsbi-subchain">
              <Field label="Button text">
                <DebouncedInput value={action.saveText || ""} onChange={(v) => patch({ saveText: v })} placeholder="Save" />
              </Field>
              {reported.length ? (
                <div className="dsbi-propnames">
                  <div className="dsbi-propnames-row">
                    <span className="dsbi-hint">It reports:</span>
                    {[...new Set(reported.map((f) => (f.select ? f.path.replace(/\.(?:value|label)$/, "") : f.path)))].map(
                      (p) => (
                        <code key={p} className="dsbi-fieldchip" title={`{{modal.${p}}}`}>
                          {p}
                        </code>
                      ),
                    )}
                  </div>
                  <div className="dsbi-hint">
                    Pick these under <b>Map…</b> beside each payload key. When you pick the endpoint, keys with the same
                    meaning (Title → title, ProID → proName, Mobile → contactNo) are filled in for you.
                  </div>
                </div>
              ) : null}
              <DialogFieldsContext.Provider value={dialogFields}>
                <ActionListEditor
                  value={action.saveActions}
                  onChange={(v) => patch({ saveActions: v })}
                  nodes={nodes}
                  dataSources={dataSources}
                  patchNode={patchNode}
                />
              </DialogFieldsContext.Provider>
              <p className="dsbi-note">
                In the payload, <code>{"{{modal.name}}"}</code> is a field the component reported and{" "}
                <code>{"{{modal.title.value}}"}</code> the value of a select in it. A call the server rejects keeps the
                dialog open with its message; a save that goes through closes it
                {forAdd ? ", reloads this select and picks the new entry" : ""}.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
      {/* A dialog designed on the canvas brings its own Save and its own chain;
          what it can still be told is what to reload once that chain succeeds. */}
      {isModal && action.type === "openModal" && action.target && !wrongPick && !forAdd ? (
        <Row label="Refresh after it saves" hint="When the dialog's Save succeeds, this reloads.">
          <SelectBox value={action.sourceId} onChange={(v) => patch({ sourceId: v })} options={sourceOptions} />
        </Row>
      ) : null}
      {forAdd && ((action.target && !wrongPick) || component) ? (
        <p className="dsbi-note is-ok">
          When it saves, this select&rsquo;s options are fetched again and the new entry is picked.
          {action.target ? " The dialog's own Save chain (its onSave event) does the saving." : ""}
        </p>
      ) : null}
      {component && action.type === "closeModal" ? (
        <p className="dsbi-note">Closes the component an Open modal action opened. One is open at a time.</p>
      ) : null}
    </>
  );
}

/**
 * What a Select + Add's + opens — an Open modal action kept on the control
 * itself, edited with the same picker the action editor uses.
 *
 * A screen with no dialog yet gets one button that designs it: a Modal /
 * Dialog named after the select, with a required Name field and a Save chain
 * that checks just that dialog, sends it and says so — only the endpoint is
 * left to pick. The + is pointed at it in the same step.
 */
function AddTargetField({ value, onChange, ctx }) {
  const action = { ...(value || {}), type: "openModal" };
  const patch = (next) => onChange({ ...action, ...next, type: "openModal" });
  const self = (ctx.nodes || []).find((n) => n.id === ctx.nodeId);
  const nothing = !action.target && !action.appModal;

  const createDialog = () => {
    const dlgDef = getDef("ModalDialog");
    const inputDef = getDef("TextInput");
    if (!dlgDef || !inputDef || !ctx.addSubtree) return;
    const what = String(self?.props?.label || "entry").replace(/\*\s*$/, "").trim() || "entry";
    const title = `Add ${what}`;
    const words = what.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
    const field = `new${words.map((w) => w[0].toUpperCase() + w.slice(1)).join("")}Name`;
    const dlg = createNode(dlgDef, { name: title, props: { title } });
    const input = createNode(inputDef, { name: "Name", props: { label: "Name", field } });
    input.validation = { ...input.validation, required: true };
    dlg.children = [input];
    dlg.events = {
      onSave: [
        // Just this dialog: the form behind it must not block adding a doctor.
        { type: "validate", within: dlg.id },
        { type: "callApi", via: "endpoint", api: { method: "POST", controller: "", endpoint: "", params: [] } },
        { type: "toast", message: "Saved", variant: "success" },
      ],
    };
    patch({ target: dlg.id, appModal: undefined });
    ctx.addSubtree(dlg);
  };

  return (
    <div className="dsbi-addtarget">
      <OverlayTarget
        action={action}
        patch={patch}
        nodes={ctx.nodes}
        sourceOptions={refreshTargets(ctx.nodes, ctx.dataSources)}
        dataSources={ctx.dataSources}
        patchNode={ctx.patchNode}
        label="The + button opens"
        forAdd
      />
      {nothing && ctx.addSubtree ? (
        <button type="button" className="dsbi-add" onClick={createDialog}>
          <Icon name="Wand2" size={12} /> Design the add dialog on this screen
        </button>
      ) : null}
    </div>
  );
}

/**
 * Add row / Remove row / Update row — a grid's rows changed on the screen.
 *
 * The keys offered are the target table's own columns, so "Add Panel" is
 * written against PanelID and Amount rather than guessed at; any other key
 * can be typed and goes into the row (and into the payload) all the same.
 */
function GridRowFields({ action: a, patch, spec, nodes, gridTargets, formFields, rowFields, rowSource }) {
  const table = (nodes || []).find((n) => n.id === a.gridTarget);
  const cols = [
    ...new Set(
      (table?.props?.columns || [])
        .filter((c) => c?.key && !["actions", "frameMenu", "serial"].includes(c.type))
        .map((c) => c.key),
    ),
  ];
  const which = a.which || "clicked";
  return (
    <>
      <Row label="Table" hint="Empty is the table whose row or icon was clicked — the usual answer for a trash icon.">
        <SelectBox
          value={a.gridTarget || ""}
          onChange={(v) => patch({ gridTarget: v || undefined })}
          options={gridTargets}
          placeholder="The table that was clicked"
        />
      </Row>
      {spec.fields.includes("which") ? (
        <Row label="Which rows">
          <SelectBox
            value={which}
            onChange={(v) => patch({ which: v === "clicked" ? undefined : v })}
            options={[
              { value: "clicked", label: "The row that was clicked" },
              { value: "matching", label: "Every row that matches…" },
              { value: "all", label: "Every row" },
            ]}
          />
        </Row>
      ) : null}
      {spec.fields.includes("match") && which === "matching" ? (
        <Row label="Rows where">
          <WhenRows value={a.match} onChange={(v) => patch({ match: v })} fieldOptions={[...cols, ...(formFields || [])]} />
        </Row>
      ) : null}
      {spec.fields.includes("from") ? (
        <Row
          label="Start from a record"
          hint="Optional. A whole record copied in first — {{selected.Panel}} is every column of the dropdown's chosen option. The keys below then add to it or override it."
        >
          <ValuePick
            value={a.from}
            onChange={(v) => patch({ from: v || undefined })}
            formFields={formFields}
            rowFields={rowFields}
            rowSource={rowSource}
            placeholder="{{selected.PanelID}}"
          />
        </Row>
      ) : null}
      {spec.fields.includes("rowValues") ? (
        <Row
          label={a.type === "addRow" ? "The new row" : "Set on those rows"}
          hint="Each value is a template. {{labels.Panel}} is a dropdown's text, {{values.Panel}} its value; true / false are flags. Inside it {{row.Field}} is the row being written."
          stack
        >
          <ListShell
            items={Array.isArray(a.rowValues) ? a.rowValues : []}
            onChange={(v) => patch({ rowValues: v })}
            addLabel="Add a column"
            blank={() => ({ key: "", value: "" })}
            render={(kv, patchKv) => {
              // A key the table has no column for is still on the row: it is
              // not drawn, but {{grid.<table>.rows}} carries it into a payload
              // — panelID, isRemove, a DispatchType nobody needs to see.
              const hidden = kv.payloadOnly || (!!kv.key && cols.length > 0 && !cols.includes(kv.key));
              return (
              <>
                {kv.payloadOnly ? (
                  <DebouncedInput value={kv.key || ""} onChange={(v) => patchKv({ key: v })} placeholder="Key sent in the payload — panelID" />
                ) : (
                  <KeyCombo
                    value={kv.key}
                    onChange={(v) => patchKv({ key: v })}
                    keys={cols}
                    placeholder="Column"
                    searchPlaceholder="Search columns, or type a key…"
                    allowCustom
                  />
                )}
                {hidden ? (
                  <span className="dsbi-hidden-key" title="Kept on the row and sent with {{grid.<table>.rows}}, but the table has no column for it, so it is not shown.">
                    <Icon name="EyeOff" size={11} /> Hidden — payload only
                  </span>
                ) : null}
                <ValuePick
                  value={kv.value}
                  onChange={(v) => patchKv({ value: v })}
                  formFields={formFields}
                  rowFields={rowFields}
                  rowSource={rowSource}
                  placeholder="{{labels.PanelID}}"
                />
              </>
              );
            }}
          />
          {spec.fields.includes("rowValues") ? (
            <Tap
              className="tone-mode dsbi-mini dsbi-hidden-add"
              onClick={() => patch({ rowValues: [...(a.rowValues || []), { key: "", value: "", payloadOnly: true }] })}
              title="A key kept on the row for the payload, never shown in the table"
            >
              <Icon name="EyeOff" size={12} /> Add a hidden key (payload only)
            </Tap>
          ) : null}
          {a.type === "addRow" && cols.length ? (
            <button
              type="button"
              className="dsbi-add"
              onClick={() => {
                const have = new Set((a.rowValues || []).map((kv) => kv.key));
                patch({ rowValues: [...(a.rowValues || []), ...cols.filter((k) => !have.has(k)).map((k) => ({ key: k, value: "" }))] });
              }}
            >
              <Icon name="Columns3" size={12} /> One line per column of the table
            </button>
          ) : null}
        </Row>
      ) : null}
      {spec.fields.includes("position") ? (
        <Row label="Where">
          <SelectBox
            value={a.position || "end"}
            onChange={(v) => patch({ position: v === "end" ? undefined : v })}
            options={[
              { value: "end", label: "At the end" },
              { value: "start", label: "At the top" },
            ]}
          />
        </Row>
      ) : null}
      {spec.fields.includes("uniqueBy") ? (
        <Row
          label="Refuse a duplicate of"
          hint="Optional. A row already holding the same value in this column is not added twice — the chain stops with the message below."
        >
          <KeyCombo
            value={a.uniqueBy || ""}
            onChange={(v) => patch({ uniqueBy: v || undefined })}
            keys={[...new Set([...cols, ...(a.rowValues || []).map((kv) => kv.key).filter(Boolean)])]}
            placeholder="Allow duplicates"
            allowCustom
          />
        </Row>
      ) : null}
      {spec.fields.includes("duplicateMessage") && a.uniqueBy ? (
        <Row label="Duplicate message">
          <DebouncedInput
            value={a.duplicateMessage || ""}
            onChange={(v) => patch({ duplicateMessage: v })}
            placeholder="That panel is already in the list"
          />
        </Row>
      ) : null}
      <p className="dsbi-note">
        Nothing is sent to the server: the table changes on screen, keeping what was typed into its other rows. Save then
        sends <code>{`{{grid.${a.gridTarget || "<table>"}.rows}}`}</code>. Reloading the table (a new search) replaces
        the rows, changes included.
      </p>
    </>
  );
}

export function ActionListEditor({ value, onChange, nodes = [], dataSources = {}, patchNode, rowFields = [], rowSource = "" }) {
  // Anything a "refresh" can point at: the screen's shared data sources, plus
  // every component that owns its endpoint. Picking one of the latter is what
  // makes a button re-run that table's own API.
  // Every control on the screen that stores a value. This is what a payload
  // key can be mapped to, so the picker lists these rather than nothing.
  const formFields = [...new Set((nodes || []).flatMap(fieldsOf))];

  // Anything that draws rows. A component declares that by having a
  // "rows come from" setting at all, so this list needs no maintaining as
  // more of them arrive.
  const rowTargets = (nodes || [])
    .filter((n) => getDef(n.type)?.defaultProps?.dataMode !== undefined)
    .map((n) => ({ value: n.id, label: `${n.name} (${n.type})` }));

  const sourceOptions = refreshTargets(nodes, dataSources);

  // A grid whose rows an Add / Remove / Update row action can change: anything
  // with columns. Empty is "the table the click came from".
  const gridTargets = (nodes || [])
    .filter((n) => Array.isArray(n.props?.columns))
    .map((n) => ({ value: n.id, label: `${n.name} (${n.type})` }));
  // Anything with a chain of its own that another chain could run.
  const eventTargets = (nodes || [])
    .filter((n) => Object.values(n.events || {}).some((list) => Array.isArray(list) && list.length))
    .map((n) => ({ value: n.id, label: `${n.name} (${n.type})` }));

  // What a "Validate all fields" can be narrowed to: anything that holds
  // controls — a dialog above all, whose Save must not trip on the form behind.
  const containerOptions = (nodes || [])
    // The screen's own root is "the whole screen", which is the empty choice.
    .filter((n) => getDef(n.type)?.isContainer && !String(n.id).startsWith("root"))
    .map((n) => ({ value: n.id, label: `${n.name} (${n.type})` }));


  return (
          <ListShell
            items={Array.isArray(value) ? value : []}
            onChange={onChange}
            addLabel="Add action"
            blank={() => ({ type: "toast", message: "Done", variant: "success" })}
            render={(a, patch) => {
              const spec = ACTION_TYPES.find((t) => t.type === a.type) || { fields: [] };
              return (
                <>
                  <ActionTypePicker
                    value={a.type}
                    // A new export starts as the common case: an endpoint called
                    // now, saved as Excel. One saved before keeps what it had.
                    onChange={(v) =>
                      patch(
                        v === "export" && a.type !== "export"
                          ? { type: v, via: a.sourceId && !a.api?.endpoint ? "source" : "endpoint", format: a.format || "xlsx" }
                          : { type: v },
                      )
                    }
                  />
                  <Row
                    label="Run only when"
                    hint="Leave empty and it always runs. Join rows with AND (all must hold) or OR (either may hold). Failing the test skips this action and the chain carries on — which is how one button reaches a different endpoint per row."
                  >
                    <WhenRows
                      value={a.when}
                      onChange={(v) => patch({ when: v })}
                      fieldOptions={[...(rowFields || []), ...(formFields || [])]}
                    />
                  </Row>
                  {a.type === "callApi" ? (
                    <CallApiFields
                      action={a}
                      patch={patch}
                      sourceOptions={sourceOptions}
                      formFields={formFields}
                      rowFields={rowFields}
                      rowSource={rowSource}
                      rowTargets={rowTargets}
                      targetNode={(nodes || []).find((n) => n.id === a.targetId)}
                      patchNode={patchNode}
                    />
                  ) : null}
                  {a.type === "export" ? (
                    <ExportFields
                      action={a}
                      patch={patch}
                      sourceOptions={sourceOptions}
                      nodes={nodes}
                      formFields={formFields}
                      rowFields={rowFields}
                      rowSource={rowSource}
                    />
                  ) : null}
                  {spec.fields.includes("sourceId") && a.type !== "callApi" && a.type !== "export" ? (
                    <Row label="Data source">
                      <SelectBox
                        value={a.sourceId}
                        onChange={(v) => patch({ sourceId: v })}
                        options={sourceOptions}
                      />
                    </Row>
                  ) : null}
                  {spec.fields.includes("target") ? (
                    <OverlayTarget
                      action={a}
                      patch={patch}
                      nodes={nodes}
                      sourceOptions={sourceOptions}
                      dataSources={dataSources}
                      patchNode={patchNode}
                    />
                  ) : null}
                  {spec.fields.includes("rowVar") ? (
                    <Row
                      label={a.type === "storeRow" ? "Variable name" : "Also store the row as"}
                      hint="Read it anywhere on the screen as {{vars.<name>.Field}}. Leave blank inside the overlay — its contents already get the row."
                    >
                      <DebouncedInput
                        value={a.rowVar}
                        onChange={(v) => patch({ rowVar: v })}
                        placeholder="selectedRow"
                      />
                    </Row>
                  ) : null}
                  {spec.fields.includes("frameName") ? (
                    <>
                      <Row
                        label="Module (frameName)"
                        hint="Emergency, Billing, Counselling — the list is filtered by the signed-in role."
                      >
                        <DebouncedInput
                          value={a.frameName}
                          onChange={(v) => patch({ frameName: v })}
                          placeholder="Emergency"
                        />
                      </Row>
                      <Row label="Patient header">
                        <Toggle
                          value={a.showPatientHeader !== false}
                          onChange={(v) => patch({ showPatientHeader: v })}
                        />
                      </Row>
                      <p className="dsbi-note">
                        Opens on the record the chain is running for — the clicked row in a column's on-click, the row
                        a dialog was opened on. Put it on a column's <b>On click</b> to get the icon a hand-coded page
                        puts in the action strip.
                      </p>
                    </>
                  ) : null}
                  {spec.fields.includes("appModal") ? (
                    <>
                      <Row label="Modal" hint="The app's own component, opened on the record this chain is running for.">
                        <SelectBox
                          value={a.appModal || ""}
                          onChange={(v) => patch({ appModal: v })}
                          options={APP_MODAL_OPTIONS}
                        />
                      </Row>
                      <Row label="Opens as" hint="A sheet is the app's own OverLay — the full-width slide-in the single-window pages use for every action.">
                        <SelectBox
                          value={a.position || ""}
                          onChange={(v) => patch({ position: v })}
                          options={APP_MODAL_POSITIONS}
                        />
                      </Row>
                      <Row label="Width">
                        <DebouncedInput
                          value={a.size || ""}
                          onChange={(v) => patch({ size: v })}
                          placeholder={a.position ? "100vw" : APP_MODALS[a.appModal]?.size || "60vw"}
                        />
                      </Row>
                      <div className="dsbi-sub">
                        <div className="dsbi-sub-title">When it calls back</div>
                        <ListShell
                          items={a.callbacks || []}
                          onChange={(v) => patch({ callbacks: v })}
                          addLabel="Add a callback"
                          blank={() => ({ name: "", actions: [] })}
                          render={(cb, patchCb) => (
                            <>
                              <Row label="Its prop">
                                <DebouncedInput
                                  value={cb.name || ""}
                                  onChange={(v) => patchCb({ name: v })}
                                  placeholder="bindDetailAPI"
                                />
                              </Row>
                              <ActionListEditor
                                value={cb.actions || []}
                                onChange={(v) => patchCb({ actions: v })}
                                nodes={nodes}
                                dataSources={dataSources}
                                patchNode={patchNode}
                              />
                            </>
                          )}
                        />
                        <p className="dsbi-note">
                          The page reports back by calling one of its own props — the registration page calls{" "}
                          <code>bindDetailAPI</code> once it has saved, the search dialogs call <code>handleSearch</code>.
                          Name it here and this chain runs when it fires, with what the page passed available as{" "}
                          <code>{"{{args.0}}"}</code> (a record also reads as <code>{"{{modal.Field}}"}</code>). This is
                          how a screen reloads itself after the page it opened has finished.
                        </p>
                      </div>
                      <p className="dsbi-note">
                        Mounts the real modal — the same one a hand-coded page opens — not a rebuilt copy of it. Pick a
                        data source above and a modal that writes refreshes it after a successful save.
                      </p>
                    </>
                  ) : null}
                  {spec.fields.includes("list") && a.type !== "export" ? (
                    <>
                      <Row
                        label="For every row in"
                        hint="Usually what a grid published: {{grid.<table>.checked}} for the ticked rows, {{grid.<table>.rows}} for all of them."
                      >
                        <ValuePick
                          value={a.list}
                          onChange={(v) => patch({ list: v })}
                          formFields={formFields}
                          rowFields={rowFields}
                          rowSource={rowSource}
                          placeholder="{{grid.n_bills.checked}}"
                        />
                      </Row>
                      <div className="dsbi-sub">
                        <div className="dsbi-sub-title">Do this, once per row</div>
                        <ActionListEditor
                          value={a.actions || []}
                          onChange={(v) => patch({ actions: v })}
                          nodes={nodes}
                          dataSources={dataSources}
                          patchNode={patchNode}
                          rowFields={rowFields}
                          rowSource={rowSource}
                        />
                        <p className="dsbi-note">
                          Each pass reads its record as <code>{"{{row.Field}}"}</code>, its place as{" "}
                          <code>{"{{number}}"}</code> of <code>{"{{count}}"}</code>. A pass that opens a file gets its
                          own tab, so a print of six bills really does open six.
                        </p>
                      </div>
                      <Row
                        label="Pause between (ms)"
                        hint="The report endpoints are slower than the loop. 100 is what the hand-coded pages use."
                      >
                        <DebouncedInput value={a.gapMs} onChange={(v) => patch({ gapMs: v })} placeholder="100" />
                      </Row>
                      <Row label="When the list is empty">
                        <DebouncedInput
                          value={a.emptyMessage}
                          onChange={(v) => patch({ emptyMessage: v })}
                          placeholder="Tick at least one bill"
                        />
                      </Row>
                      <Row
                        label="Carry on after a failure"
                        hint="Off (the default) stops the run and says so, rather than silently skipping one of six."
                      >
                        <Toggle value={a.stopOnFail === false} onChange={(v) => patch({ stopOnFail: v ? false : undefined })} />
                      </Row>
                    </>
                  ) : null}
                  {spec.fields.includes("gridTarget") ? (
                    <GridRowFields
                      action={a}
                      patch={patch}
                      spec={spec}
                      nodes={nodes}
                      gridTargets={gridTargets}
                      formFields={formFields}
                      rowFields={rowFields}
                      rowSource={rowSource}
                    />
                  ) : null}
                  {spec.fields.includes("eventTarget") ? (
                    <>
                      <Row label="Component" hint="Its chain runs as if it had been pressed — the same calls, the same targets.">
                        <SelectBox
                          value={a.eventTarget || ""}
                          onChange={(v) => {
                            const t = (nodes || []).find((n) => n.id === v);
                            const evs = Object.keys(t?.events || {}).filter((k) => (t.events[k] || []).length);
                            patch({ eventTarget: v, eventName: evs.includes(a.eventName) ? a.eventName : evs[0] || "onClick" });
                          }}
                          options={eventTargets}
                          placeholder="Pick a button, table…"
                        />
                      </Row>
                      {a.eventTarget ? (
                        <Row label="Event">
                          <SelectBox
                            value={a.eventName || "onClick"}
                            onChange={(v) => patch({ eventName: v })}
                            options={Object.keys((nodes || []).find((n) => n.id === a.eventTarget)?.events || {}).filter(
                              (k) => ((nodes || []).find((n) => n.id === a.eventTarget)?.events?.[k] || []).length,
                            )}
                          />
                        </Row>
                      ) : null}
                      <p className="dsbi-note">
                        Save re-running the Search button keeps one copy of the search — the grid refreshes with the same
                        filters, and changing the search later changes both. A failure in that chain stops this one.
                      </p>
                    </>
                  ) : null}
                  {spec.fields.includes("userId") ? (
                    <>
                      <Row
                        label="Whose password"
                        hint="Empty asks the signed-in user, which is what the billing pages do."
                      >
                        <DebouncedInput value={a.userId} onChange={(v) => patch({ userId: v })} placeholder="{{user.id}}" />
                      </Row>
                      <p className="dsbi-note">
                        Put it ABOVE the save. The app's own dialog asks, checks the password against the server, and a
                        wrong answer — or a closed dialog — stops the chain there.
                      </p>
                    </>
                  ) : null}
                  {spec.fields.includes("route") ? (
                    <Row label="Route">
                      <DebouncedInput value={a.route} onChange={(v) => patch({ route: v })} placeholder="/patient-search" />
                    </Row>
                  ) : null}
                  {spec.fields.includes("field") ? (
                    <Row label="Field">
                      {/* A form field is one of the screen's controls; a
                          variable is a name of the chain's own choosing. */}
                      {a.type === "setValue" ? (
                        <FormFieldCombo
                          value={a.field}
                          onChange={(v) => patch({ field: v })}
                          keys={formFields}
                          placeholder="Pick a field…"
                          searchPlaceholder="Search fields, or type a new one…"
                          allowCustom
                        />
                      ) : (
                        <DebouncedInput value={a.field} onChange={(v) => patch({ field: v })} placeholder="selectedId" />
                      )}
                    </Row>
                  ) : null}
                  {spec.fields.includes("storageOp") ? (
                    <Row label="Do">
                      <SelectBox
                        value={a.storageOp || "set"}
                        onChange={(v) => patch({ storageOp: v })}
                        options={[
                          { value: "set", label: "Save a value" },
                          { value: "remove", label: "Remove the key" },
                        ]}
                        allowEmpty={false}
                      />
                    </Row>
                  ) : null}
                  {spec.fields.includes("storageKey") ? (
                    <>
                      <Row label="Key">
                        <DebouncedInput
                          value={a.storageKey}
                          onChange={(v) => patch({ storageKey: v })}
                          placeholder="selectedPatient"
                        />
                      </Row>
                      <div className="dsbi-hint">
                        Read it back anywhere as{" "}
                        <code>{`{{local.${a.storageKey || "key"}}}`}</code>. A row or object is saved as JSON, so{" "}
                        <code>{`{{local.${a.storageKey || "key"}.Field}}`}</code> reads inside it. An empty value removes
                        the key.
                      </div>
                    </>
                  ) : null}
                  {spec.fields.includes("value") && !(a.type === "setStorage" && a.storageOp === "remove") ? (
                    <Row label="Value">
                      <ValuePick
                        value={a.value}
                        onChange={(v) => patch({ value: v })}
                        formFields={formFields}
                        rowFields={rowFields}
                        rowSource={rowSource}
                        placeholder="{{row.PatientId}}"
                      />
                    </Row>
                  ) : null}
                  {spec.fields.includes("message") ? (
                    <Row label="Message">
                      <DebouncedInput value={a.message} onChange={(v) => patch({ message: v })} />
                    </Row>
                  ) : null}
                  {spec.fields.includes("title") ? (
                    <Row label="Title">
                      <DebouncedInput value={a.title} onChange={(v) => patch({ title: v })} placeholder="Delete this record?" />
                    </Row>
                  ) : null}
                  {spec.fields.includes("okText") ? (
                    <Row label="Confirm button">
                      <DebouncedInput value={a.okText} onChange={(v) => patch({ okText: v })} placeholder="Yes, delete" />
                    </Row>
                  ) : null}
                  {spec.fields.includes("cancelText") ? (
                    <Row label="Cancel button">
                      <DebouncedInput value={a.cancelText} onChange={(v) => patch({ cancelText: v })} placeholder="Keep it" />
                    </Row>
                  ) : null}
                  {spec.fields.includes("variant") ? (
                    <Row label="Variant">
                      <SelectBox
                        value={a.variant}
                        onChange={(v) => patch({ variant: v })}
                        options={[
                          { value: "success", label: "Success" },
                          { value: "info", label: "Info" },
                          { value: "warning", label: "Warning" },
                          { value: "error", label: "Error" },
                        ]}
                      />
                    </Row>
                  ) : null}
                  {spec.fields.includes("url") && a.type !== "callApi" ? (
                    <Row label="URL">
                      <DebouncedInput value={a.url} onChange={(v) => patch({ url: v })} />
                    </Row>
                  ) : null}
                  {/* The Edit fill has a panel of its own; every other action that
                      narrows to a container keeps the plain picker. */}
                  {a.type === "fillForm" ? (
                    <FillFormSettings
                      value={a}
                      onChange={patch}
                      formFields={formFields}
                      rowFields={rowFields}
                      containerOptions={containerOptions}
                    />
                  ) : spec.fields.includes("within") ? (
                    <Row
                      label="Only the fields inside"
                      hint="Empty checks every field on the screen. From a dialog's Save, pick the dialog — otherwise an empty required field on the form behind it blocks the save."
                    >
                      <SelectBox
                        value={a.within || ""}
                        onChange={(v) => patch({ within: v || undefined })}
                        options={containerOptions}
                        placeholder="The whole screen"
                      />
                    </Row>
                  ) : null}
                  {spec.fields.includes("fileName") && a.type !== "export" ? (
                    <Row label="File name">
                      <DebouncedInput value={a.fileName} onChange={(v) => patch({ fileName: v })} placeholder="export.csv" />
                    </Row>
                  ) : null}
                  {spec.fields.includes("code") ? (
                    <Row label="JS" stack>
                      <DebouncedInput
                        multiline
                        rows={5}
                        spellCheck={false}
                        value={a.code || ""}
                        onChange={(v) => patch({ code: v })}
                        placeholder="api.setValue('x', ctx.row.Id)"
                      />
                    </Row>
                  ) : null}
                </>
              );
            }}
          />
  );
}

export function EventsEditor({ node, events = [], onChange, nodes = [], dataSources = {}, patchNode, rowFields = [], rowSource = "" }) {
  const map = node.events || {};
  /**
   * What this component can actually raise.
   *
   * A def that declares nothing used to fall back to the whole EVENT_TYPES
   * list, so a Divider offered nine events and fired none of them — a chain
   * attached to one of those was authored, saved, and never ran. The list a def
   * declares is the honest answer.
   *
   * Anything the node already carries a chain for is kept in the list even when
   * the def no longer declares it, so an older screen's handler stays visible
   * and removable rather than becoming invisible data.
   */
  const authored = Object.keys(map).filter((ev) => (map[ev] || []).length);
  const available = [...new Set([...(events || []), ...authored])];
  const setList = (ev, list) => onChange({ ...map, [ev]: list });

  if (!available.length) {
    return (
      <p className="dsbi-note">
        This component raises no events of its own. Put the chain on what the user actually touches — a Button, a table
        row or column, a tab — or on the container's <b>onLoad</b>.
      </p>
    );
  }

  return (
    <div className="dsbi-stackgap">
      {available.map((ev) => (
        <Section key={ev} title={ev} defaultOpen={!!(map[ev] || []).length} right={<span className="dsbi-badge">{(map[ev] || []).length}</span>}>
          <ActionListEditor
            value={map[ev] || []}
            onChange={(list) => setList(ev, list)}
            nodes={nodes}
            dataSources={dataSources}
            patchNode={patchNode}
            rowFields={rowFields}
            rowSource={rowSource}
          />
          {ev === "onClick" && !(map[ev] || []).length ? (
            <button type="button" className="dsbi-add" onClick={() => setList(ev, saveChain(node))}>
              <Icon name="Wand2" size={12} /> Add save chain
            </button>
          ) : null}
        </Section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------- schema-driven prop */

/**
 * Pick a key from what the data actually has, rather than retyping it.
 *
 * Falls back to a plain text box when there is nothing to offer yet — a screen
 * configured before its endpoint was synced still has to be editable — and an
 * unrecognised value already stored is added to the list so it is not silently
 * replaced by the first option.
 */
function KeyCombo({ value, onChange, keys = [], captions = null, placeholder, searchPlaceholder, allowCustom = false }) {
  const options = useMemo(() => {
    const all = [...new Set([...(keys || []), ...(value ? [value] : [])])];
    // A caption leads when there is one — "Refer Doctor" is what the designer
    // sees on the canvas — with the key after it, since that is what is stored.
    return all.filter(Boolean).map((k) => ({ value: k, label: captions?.[k] ? `${captions[k]} · ${k}` : k }));
  }, [keys, value, captions]);

  if (!options.length) {
    return <DebouncedInput value={value ?? ""} onChange={onChange} placeholder={placeholder} />;
  }
  return (
    <Combo
      value={value ?? ""}
      onChange={onChange}
      options={options}
      placeholder={placeholder || "Select"}
      searchPlaceholder={searchPlaceholder || "Search…"}
      allowCustom={allowCustom}
    />
  );
}

/** Another control of this screen, listed by its caption as well as its field key. */
function FormFieldCombo(props) {
  const root = useBuilder()?.state?.screen?.root;
  const captions = useMemo(() => fieldCaptions(root), [root]);
  return <KeyCombo {...props} captions={captions} />;
}

/* ------------------------------------------------- record-aware text props */

/**
 * A text prop that can read the record its component stands on.
 *
 * Everything inside a row-opened modal or drawer binds to `{{row.Field}}`, and
 * before this the only way to write one was to know the field's exact name and
 * type the braces by hand — on a screen whose columns are called
 * `PatientRegistrationNo`, that is where the feature quietly stopped being
 * usable. The list comes from whatever opens the overlay (utils/rowContext),
 * so it names the same fields the table shows.
 */
/**
 * A colour that can be read off the record: the same swatch/token box as
 * `ColorField`, a picker that writes `{{row.Field}}` into it, and a second
 * swatch for the colour to fall back to when the field is empty or holds
 * something that is not a colour.
 */
export function DynamicColorField({
  value,
  onChange,
  fallback,
  onFallbackChange,
  palette = [],
  rowFields = [],
  sourceName = "",
}) {
  return (
    <div className="dsbi-dyncolor">
      <ColorField value={value} onChange={onChange} palette={palette} />
      {rowFields.length ? (
        <SelectBox
          value=""
          onChange={(k) => k && onChange(`{{row.${k}}}`)}
          options={rowFields.map((k) => ({ value: k, label: k }))}
          placeholder={sourceName ? `Colour from a field of ${sourceName}…` : "Colour from a row field…"}
        />
      ) : null}
      <div className="dsbi-dyncolor-def">
        <span>Default</span>
        <ColorField value={fallback} onChange={onFallbackChange} palette={palette} />
      </div>
    </div>
  );
}

export function TemplateField({ value, onChange, rowFields = [], sourceName = "", multiline = false, placeholder }) {
  const text = value == null ? "" : String(value);
  // Typing is local until it settles, the same bargain DebouncedInput strikes:
  // a keystroke per undo step would make Ctrl+Z useless on a screen document.
  // The picker has to write through the same state, or an insert would be
  // overwritten by whatever the box was showing.
  const [local, setLocal] = useState(text);
  const typing = useRef(false);
  useEffect(() => {
    if (!typing.current) setLocal(text);
  }, [text]);

  const commit = (v) => {
    typing.current = false;
    setLocal(v);
    onChange(v);
  };

  const insert = (key) => {
    if (!key) return;
    const token = `{{row.${key}}}`;
    // A default nobody edited ("—", "Value") is a placeholder, not content, so
    // the first pick replaces it instead of landing next to it.
    const cur = typing.current ? local : text;
    const keep = cur.trim() && cur.trim() !== "—" && cur.trim() !== "Value";
    commit(keep ? `${cur} ${token}` : token);
  };

  return (
    <div className="dsbi-tmpl">
      {multiline ? (
        <DebouncedInput multiline rows={2} value={local} onChange={commit} placeholder={placeholder} />
      ) : (
        <DebouncedInput value={local} onChange={commit} placeholder={placeholder} />
      )}
      {rowFields.length ? (
        <div className="dsbi-tmpl-pick">
          <SelectBox
            value=""
            onChange={insert}
            options={rowFields.map((k) => ({ value: k, label: k }))}
            placeholder={sourceName ? `Insert a field of ${sourceName}…` : "Insert a row field…"}
          />
        </div>
      ) : null}
    </div>
  );
}

const RECORD_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & time" },
  { value: "boolean", label: "Yes / No" },
];

/**
 * The label/value pairs a Record Details component shows.
 *
 * Picking a field fills the label from its name, because that is the label in
 * every case but the few where it is not — and a list of rows all captioned
 * "Label" is the thing that makes a details panel look unfinished.
 */
export function RecordFieldsEditor({ value, onChange, rowFields = [], sourceName = "" }) {
  const items = Array.isArray(value) ? value : [];
  const used = items.map((i) => i.key);
  const unused = rowFields.filter((k) => !used.includes(k));
  return (
    <div className="dsbi-stackgap">
      <ListShell
        items={items}
        onChange={onChange}
        addLabel="Add row"
        blank={() => ({ key: "", label: "", type: "text" })}
        render={(it, patch) => (
          <>
            <Row label="Field">
              <KeyCombo
                value={it.key}
                onChange={(v) => patch({ key: v, label: it.label || humanizeKey(v) })}
                keys={rowFields}
                placeholder="PatientName"
                searchPlaceholder="Search fields…"
              />
            </Row>
            <Row label="Label">
              <DebouncedInput value={it.label} onChange={(v) => patch({ label: v })} placeholder={humanizeKey(it.key)} />
            </Row>
            <Row label="Format">
              <SelectBox value={it.type || "text"} onChange={(v) => patch({ type: v })} options={RECORD_FIELD_TYPES} allowEmpty={false} />
            </Row>
          </>
        )}
      />
      {unused.length ? (
        <button
          type="button"
          className="dsbi-add"
          onClick={() => onChange([...items, ...unused.map((k) => ({ key: k, label: humanizeKey(k), type: "text" }))])}
        >
          <Icon name="Plus" size={12} /> Add all {unused.length} remaining field{unused.length === 1 ? "" : "s"}
          {sourceName ? ` of ${sourceName}` : ""}
        </button>
      ) : null}
      {!rowFields.length ? (
        <p className="dsbi-note">
          No record reaches this component yet. Put it inside a modal or drawer that a row action opens — the fields of
          the table that opens it then fill this list.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Register a component as a modal this screen can open, without editing
 * `utils/appModals`.
 *
 * The curated list covers what the reference pages open; a modal written this
 * week is not in it, and waiting for an entry to be added and deployed is the
 * difference between finishing a screen today and filing a ticket. So the
 * builder registers one itself: pick the file, name it, size it. The entry is
 * saved with the SCREEN, and the runtime resolves it from there.
 *
 * Only the component file is required — everything else has a sensible default
 * and can be left alone.
 */
/**
 * The picker plus a `+` that registers a new one.
 *
 * The button sits beside the list rather than inside it: "add" is not an option
 * anybody is choosing between, and a row in a searchable list is exactly where
 * it would get lost. Adding one also selects it — nobody adds a modal in order
 * to then not use it.
 */
function AddModalControl({ value, onChange, onAdd, children }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  return (
    <div className="dsbi-addmodal-wrap" ref={anchorRef}>
      {children}
      <button
        type="button"
        className="dsbi-mini dsbi-addmodal-btn"
        onClick={() => setOpen((o) => !o)}
        title="Register another component as a modal this screen can open"
      >
        <Icon name="Plus" size={13} />
      </button>
      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} width={360}>
        <AddAppModalForm
          onAdd={(entry) => {
            onAdd(entry);
            onChange(entry.key);
          }}
          onClose={() => setOpen(false)}
        />
      </Popover>
    </div>
  );
}

export function AddAppModalForm({ onAdd, onClose }) {
  const [draft, setDraft] = useState({
    label: "",
    path: "",
    title: "",
    size: "75vw",
    icon: "FileText",
    shapePatient: false,
    reopens: false,
  });
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const pathOptions = useMemo(() => COMPONENT_PATHS.map((v) => ({ value: v, label: v, search: v })), []);
  const name = draft.path ? draft.path.split("/").pop() : "";
  const canAdd = !!draft.path;

  // The pasted path, kept separate from the resolved one: what somebody typed
  // stays on screen while they are still typing it, and only a path that
  // actually resolves to a file is allowed to become the entry's.
  const [pasted, setPasted] = useState("");
  const pastedPath = useMemo(() => resolveComponentPath(pasted), [pasted]);
  const usePasted = () => {
    if (!pastedPath) return;
    setDraft((d) => ({ ...d, path: pastedPath, label: d.label || pastedPath.split("/").pop() }));
    setPasted("");
  };

  const add = () => {
    if (!canAdd) return;
    onAdd({
      key: `${CUSTOM_MODAL_PREFIX}${draft.path}`,
      path: draft.path,
      label: draft.label.trim() || name,
      title: draft.title.trim() || draft.label.trim() || name,
      size: draft.size.trim() || "75vw",
      icon: draft.icon || "FileText",
      shapePatient: !!draft.shapePatient,
      reopens: !!draft.reopens,
    });
    onClose?.();
  };

  return (
    <div className="dsbi-addmodal">
      <div className="dsbi-pop-title">Add a modal to this screen</div>
      <Field label="Component file">
        <Combo
          value={draft.path}
          onChange={(v) => set({ path: v, label: draft.label || (v ? v.split("/").pop() : "") })}
          options={pathOptions}
          placeholder="Pick a component…"
          searchPlaceholder="Search components…"
        />
      </Field>
      <Field label="…or paste its path">
        <div className="dsbi-pastepath">
          <DebouncedInput
            value={pasted}
            onChange={setPasted}
            placeholder="@app/components/modalComponent/Utils/LabsModel"
          />
          <button type="button" className="dsbi-mini" onClick={usePasted} disabled={!pastedPath} title="Use this path">
            Use
          </button>
        </div>
      </Field>
      {pasted.trim() ? (
        <p className={`dsbi-note ${pastedPath ? "is-ok" : "is-bad"}`}>
          {pastedPath ? `Resolves to ${pastedPath}` : "No component at that path — check the spelling, or pick it from the list above."}
        </p>
      ) : null}
      <div className="dsbi-grid2">
        <Field label="Name in the list">
          <DebouncedInput value={draft.label} onChange={(v) => set({ label: v })} placeholder={name || "Lab Results"} />
        </Field>
        <Field label="Dialog title">
          <DebouncedInput value={draft.title} onChange={(v) => set({ title: v })} placeholder={draft.label || name} />
        </Field>
      </div>
      <div className="dsbi-grid2">
        <Field label="Dialog width">
          <DebouncedInput value={draft.size} onChange={(v) => set({ size: v })} placeholder="75vw" />
        </Field>
        <Field label="Icon">
          <IconField value={draft.icon} onChange={(v) => set({ icon: v })} suggestFrom={draft.header || draft.label || draft.key} />
        </Field>
      </div>
      <div className="dsbi-cols-flags">
        <Toggle
          value={draft.shapePatient}
          onChange={(v) => set({ shapePatient: v })}
          label="Reads transactionID / patientID"
        />
        <Toggle value={draft.reopens} onChange={(v) => set({ reopens: v })} label="Refreshes the list after saving" />
      </div>
      <p className="dsbi-note">
        The component is handed the row as <code>data</code>, plus <code>onSave</code>, <code>onClose</code> and{" "}
        <code>setVisible</code>, and is imported only when a tile opens it. Turn the first switch on if it reads the
        patient off <code>transactionID</code>/<code>patientID</code> instead of the row&rsquo;s own columns.
      </p>
      <div className="dsbi-addmodal-foot">
        <button type="button" className="dsbi-mini" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="dsbi-mini is-primary" onClick={add} disabled={!canAdd}>
          Add to screen
        </button>
      </div>
    </div>
  );
}

export function PropField({ schema, value, onChange, ctx = {} }) {
  const { palette = [], columns = [], fieldKeys = [], formFields = [], rowFields = [], rowSource = "" } = ctx;
  switch (schema.type) {
    case "textarea":
      return (
        <Row label={schema.label} stack>
          {/* Commits as it is typed, like every other box — a blur-only
              textarea lost its text when the canvas took the click. */}
          <DebouncedInput multiline rows={3} value={value ?? ""} onChange={onChange} />
        </Row>
      );
    case "number":
      return (
        <Row label={schema.label} hint={schema.hint}>
          <DebouncedInput type="number" value={value ?? ""} onChange={onChange} />
        </Row>
      );
    case "boolean":
      return (
        <Row label={schema.label} hint={schema.hint}>
          <Toggle value={!!value} onChange={onChange} />
        </Row>
      );
    case "select": {
      // A long list is scrolled, not read: past a dozen entries the picker
      // gains a search box. A schema can ask for one either way; the count is
      // only the default, so a list that grows into one gets it for free.
      // Options may be a function of the screen: a list that the builder can
      // add to (the modals a screen registers) cannot be a constant.
      const opts = (typeof schema.options === "function" ? schema.options(ctx) : schema.options) || [];
      // `allowCustom`: the list is what the screen knows of so far, and a
      // name typed in is as good (a variable whose action is not built yet).
      const searchable = schema.searchable ?? (schema.allowCustom || opts.length > 12);
      const picker = searchable ? (
        <Combo
          value={value}
          onChange={onChange}
          options={opts}
          placeholder={schema.placeholder || "—"}
          searchPlaceholder={schema.searchPlaceholder || "Type to search…"}
          allowCustom={!!schema.allowCustom}
          emptyText={schema.emptyText || "No matches"}
        />
      ) : (
        // `allowEmpty: false` for a select whose empty value already means its
        // first option (a card's "Header look" reads empty as the app
        // heading), so an older screen shows that instead of "—".
        <SelectBox value={value} onChange={onChange} options={opts} allowEmpty={schema.allowEmpty !== false} />
      );
      return (
        <Row label={schema.label} hint={schema.hint}>
          {schema.addModal && ctx.addAppModal ? (
            <AddModalControl value={value} onChange={onChange} onAdd={ctx.addAppModal}>
              {picker}
            </AddModalControl>
          ) : (
            picker
          )}
        </Row>
      );
    }
    case "color":
      return (
        <Row label={schema.label} hint={schema.hint}>
          <ColorField value={value} onChange={onChange} palette={palette} />
        </Row>
      );
    case "dynamicColor": {
      const fbKey = schema.fallbackKey || `${schema.key}Default`;
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <DynamicColorField
            value={value}
            onChange={onChange}
            fallback={ctx.props?.[fbKey] ?? ""}
            onFallbackChange={(v) => ctx.onPatchProps?.({ [fbKey]: v })}
            palette={palette}
            rowFields={rowFields}
            sourceName={rowSource}
          />
        </Row>
      );
    }
    case "icon":
      return (
        <Row label={schema.label} hint={schema.hint}>
          <IconField
            value={value}
            onChange={onChange}
            rowFields={rowFields}
            sourceName={rowSource}
            suggestFrom={iconContext(ctx.props)}
          />
        </Row>
      );
    case "slider":
      return (
        <Row label={schema.label}>
          <div className="dsbi-slider">
            <input
              type="range"
              min={schema.min ?? 0}
              max={schema.max ?? 100}
              step={schema.step ?? 1}
              value={Number(value) || 0}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            <span>{value}</span>
          </div>
        </Row>
      );
    case "options":
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <OptionsEditor value={value} onChange={onChange} blank={schema.blank} addLabel={schema.addLabel} />
        </Row>
      );
    case "addTarget":
      return <AddTargetField value={value} onChange={onChange} ctx={ctx} />;
    case "appComponent":
      return (
        <Row label={schema.label} hint={schema.hint}>
          <Combo
            value={value || ""}
            onChange={onChange}
            options={FILE_MODAL_OPTIONS}
            placeholder="Pick a component…"
            searchPlaceholder="Search pages and components…"
          />
        </Row>
      );
    case "propsMap":
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <ListShell
            items={Array.isArray(value) ? value : []}
            onChange={onChange}
            addLabel="Add a prop"
            blank={() => ({ name: "", value: "" })}
            render={(row, patch) => (
              <>
                <Field label="Prop name">
                  <DebouncedInput
                    value={row.name || ""}
                    onChange={(v) => patch({ name: v })}
                    placeholder="patientDetail"
                  />
                </Field>
                <Field label="Value">
                  <TemplateField
                    value={row.value || ""}
                    onChange={(v) => patch({ value: v })}
                    rowFields={ctx.rowFields || []}
                    placeholder="{{values.PaidAmount}}"
                  />
                </Field>
              </>
            )}
          />
          <p className="dsbi-note">
            The names are the component's own props — read them off the page that uses it today. A value is a
            template, so it follows the form rather than being frozen when the screen was designed.
          </p>
        </Row>
      );
    case "appCallbacks":
      return (
        <Row label={schema.label} stack>
          <ListShell
            items={Array.isArray(value) ? value : []}
            onChange={onChange}
            addLabel="Add a callback"
            blank={() => ({ name: "", actions: [] })}
            render={(cb, patch) => (
              <>
                <Field label="Its prop">
                  <DebouncedInput value={cb.name || ""} onChange={(v) => patch({ name: v })} placeholder="setPaymentMethod" />
                </Field>
                <ActionListEditor
                  value={cb.actions || []}
                  onChange={(v) => patch({ actions: v })}
                  nodes={ctx.nodes || []}
                  dataSources={ctx.dataSources || {}}
                  patchNode={ctx.patchNode}
                  rowFields={ctx.rowFields || []}
                  rowSource={ctx.rowSource || ""}
                />
              </>
            )}
          />
          <p className="dsbi-note">
            The component reports through a prop it calls — a payment panel calls <code>setPaymentMethod</code>{" "}
            with the rows the user entered. What it passed is <code>{"{{args.0}}"}</code> (a record also reads as{" "}
            <code>{"{{modal.Field}}"}</code>), so a single <b>Set variable</b> step is usually the whole chain and the
            save payload then reads <code>{"{{vars.<name>}}"}</code>.
          </p>
        </Row>
      );
    case "actions":
      return (
        <Row label={schema.label} stack>
          <ActionsEditor value={value} onChange={onChange} />
        </Row>
      );
    case "fields":
      return (
        <Row label={schema.label} stack>
          <FieldsEditor value={value} onChange={onChange} />
        </Row>
      );
    case "columns":
      return (
        <Row label={schema.label} stack>
          <ColumnsEditor
            value={value}
            onChange={onChange}
            palette={palette}
            // A second column list (a Nested Row Table's sub-rows) names its own data.
            fieldKeys={schema.fieldKeysOf ? schema.fieldKeysOf(ctx.props || {}) : fieldKeys}
            // A column's own click chain reaches the same pickers the Events
            // tab offers, so it needs the same three pieces of context.
            formFields={formFields}
            nodes={ctx.nodes || []}
            dataSources={ctx.dataSources || {}}
            patchNode={ctx.patchNode}
          />
        </Row>
      );
    case "template":
      return (
        <Row label={schema.label} hint={schema.hint} stack={!!schema.multiline}>
          <TemplateField
            value={value}
            onChange={onChange}
            rowFields={rowFields}
            sourceName={rowSource}
            multiline={!!schema.multiline}
            placeholder={schema.placeholder}
          />
        </Row>
      );
    case "recordFields":
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <RecordFieldsEditor value={value} onChange={onChange} rowFields={rowFields} sourceName={rowSource} />
        </Row>
      );
    case "note":
      // The text may be a function of the screen, so a note can report what is
      // actually wired up rather than only describing what should be.
      return (
        <Row label={schema.label} stack>
          <p className="dsbi-note">{typeof schema.text === "function" ? schema.text(ctx) : schema.text}</p>
        </Row>
      );
    case "optionValue":
      return (
        <Row label={schema.label} hint={schema.hint}>
          <OptionValueField value={value} onChange={onChange} props={ctx.props || {}} placeholder={schema.placeholder} />
        </Row>
      );
    case "valueLabels":
      // Same two boxes the column editor uses, for the components that show a
      // single value rather than a grid of them.
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <ListShell
            items={Array.isArray(value) ? value : []}
            onChange={onChange}
            addLabel="Add a wording"
            blank={() => ({ value: "", label: "" })}
            render={(m, patch) => (
              <div className="dsbi-grid2">
                <Field label="When the value is">
                  <DebouncedInput value={m.value} onChange={(v) => patch({ value: v })} placeholder="IN" />
                </Field>
                <Field label="Show">
                  <DebouncedInput value={m.label} onChange={(v) => patch({ label: v })} placeholder="Patient admitted" />
                </Field>
              </div>
            )}
          />
          <p className="dsbi-note">
            Only the text changes. The record keeps its own value, so rules, filters and colours go on working against{" "}
            <code>IN</code>. Case and spacing are ignored; anything not listed is shown as it comes.
          </p>
        </Row>
      );
    case "calStatuses":
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <CalStatusesEditor value={value} onChange={onChange} fieldKeys={fieldKeys} palette={palette} />
        </Row>
      );
    case "alertRules":
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <AlertRulesEditor
            value={value}
            onChange={onChange}
            fieldKeys={typeof schema.fieldKeys === "function" ? schema.fieldKeys(ctx) : fieldKeys}
          />
        </Row>
      );
    case "trendRules":
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <TrendRulesEditor
            value={value}
            onChange={onChange}
            fieldKeys={typeof schema.fieldKeys === "function" ? schema.fieldKeys(ctx) : fieldKeys}
            formFields={formFields}
            palette={palette}
          />
        </Row>
      );
    case "optionFilters":
      return (
        <Row label={schema.label} stack>
          <OptionFiltersEditor
            value={value}
            onChange={onChange}
            // A schema may know better where the fields come from: a KPI card
            // filters the list it is MEASURING, whose columns are not its own.
            fieldKeys={typeof schema.fieldKeys === "function" ? schema.fieldKeys(ctx) : fieldKeys}
            formFields={formFields}
            note={schema.note}
          />
        </Row>
      );
    case "colorRules":
      // No target picker: the component that asks for these already knows what
      // the colour lands on — a dropdown option, not a row or a card.
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <ColorRulesEditor
            value={value}
            onChange={onChange}
            palette={palette}
            fieldDefault={schema.fieldDefault || ""}
            hideTarget
          />
        </Row>
      );
    case "dataKey":
      return (
        <Row label={schema.label}>
          <KeyCombo
            value={value}
            onChange={onChange}
            keys={fieldKeys}
            placeholder={schema.placeholder}
            searchPlaceholder="Search fields…"
          />
        </Row>
      );
    case "dataKeys":
      return (
        <Row label={schema.label} hint={schema.hint} stack>
          <DataKeysEditor value={value} onChange={onChange} keys={fieldKeys} placeholder={schema.placeholder} emptyNote={schema.emptyNote} />
        </Row>
      );
    case "formField":
      return (
        <Row label={schema.label}>
          <FormFieldCombo
            value={value}
            onChange={onChange}
            keys={formFields}
            placeholder={schema.placeholder}
            searchPlaceholder="Search controls…"
          />
        </Row>
      );
    case "rows":
      return (
        <Row label={schema.label} stack>
          <RowsEditor value={value} onChange={onChange} columns={schema.columnsOf ? schema.columnsOf(ctx.props || {}) : columns} />
        </Row>
      );
    case "apiEndpoint":
      return (
        <Row label={schema.label} stack>
          <ApiPicker
            value={value}
            onChange={onChange}
            // A second endpoint on one node (a Nested Row Table's sub-rows) keeps what
            // its Sync finds under its own keys, and reads the row it is opened on.
            onPatchProps={
              schema.patchAs
                ? (patch) =>
                    ctx.onPatchProps?.(Object.fromEntries(Object.entries(patch || {}).map(([k, v]) => [schema.patchAs[k] || k, v])))
                : ctx.onPatchProps
            }
            columns={schema.patchAs ? ctx.props?.[schema.patchAs.columns] || [] : columns}
            mode={schema.mode}
            fields={ctx.props || {}}
            formFields={ctx.formFields || []}
            rowFields={schema.patchAs ? fieldKeys : rowFields}
            rowSource={schema.patchAs ? "the row being opened" : rowSource}
          />
        </Row>
      );
    case "cardConfig":
      return (
        <Row label={schema.label} stack>
          <CardConfigEditor value={value} onChange={onChange} columns={columns} />
        </Row>
      );
    case "code":
      return (
        <Row label={schema.label} stack>
          <DebouncedInput multiline rows={4} spellCheck={false} value={value ?? ""} onChange={onChange} />
        </Row>
      );
    default:
      return (
        <Row label={schema.label}>
          <DebouncedInput value={value ?? ""} onChange={onChange} placeholder={schema.placeholder} />
        </Row>
      );
  }
}

export { ListShell };
