/**
 * Helpers shared by the two views of the Screen Box Permission page
 * (/screen-box-permission): "By role" (RoleAccessView) and "By box"
 * (ScreenBoxPermission's BoxView).
 *
 * Kept free of the builder's registry and storage on purpose: importing them
 * for a label and a JSON.parse pulled in every builder component (~1 MB of
 * source), which made the page slow to open.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Check, ChevronDown, Layers, Loader2, Search, ShieldCheck, User, UserCog, X } from "lucide-react";
import { getLiveScreen, getScreen } from "@app/networkServices/screenBuilderApi";

/**
 * The text a component shows, as set in the screen builder: its label, else
 * title / text / heading, else placeholder. Empty when none is set or it is an
 * expression ({{...}}), and the caller falls back to the component's name.
 */
const LABEL_KEYS = ["label", "title", "text", "heading", "placeholder"];
export function labelOf(node) {
  for (const key of LABEL_KEYS) {
    const v = node?.props?.[key];
    if (typeof v === "string" && v.trim() && !v.includes("{{")) return v.trim();
  }
  return "";
}

/** Every restricted box under `node`, with the names of the boxes around it. */
export function restrictedBoxes(node, path = [], out = []) {
  if (!node) return out;
  if (node.access?.restricted) {
    const name = node.name || node.type;
    out.push({ id: node.id, name, label: labelOf(node) || name, type: node.type, path: path.slice(1) });
  }
  (node.children || []).forEach((child) => restrictedBoxes(child, [...path, node.name || node.type], out));
  return out;
}

/** A stored screen record's document, or null. Only its tree is read here. */
export const docOf = (record) => {
  if (!record?.definition) return null;
  try {
    return JSON.parse(record.definition);
  } catch (e) {
    return null;
  }
};

/**
 * The restricted boxes of one screen, from both the published copy (what users
 * see) and the draft, so access can be set up before a newly restricted box is
 * published. Tagged `draftOnly` (restricted in the draft, not live yet) or
 * `liftedInDraft` (live but no longer restricted in the draft).
 */
export async function loadScreenBoxes(screenKey) {
  const [liveRes, draftRes] = await Promise.all([getLiveScreen(screenKey), getScreen(screenKey)]);
  const live = liveRes?.success ? docOf(liveRes.data) : null;
  const draft = draftRes?.success ? docOf(draftRes.data) : null;
  const liveBoxes = restrictedBoxes(live?.root);
  const draftBoxes = restrictedBoxes(draft?.root);
  const liveIds = new Set(liveBoxes.map((b) => b.id));
  const draftIds = new Set(draftBoxes.map((b) => b.id));
  return [
    ...liveBoxes.map((b) => (draft && !draftIds.has(b.id) ? { ...b, liftedInDraft: true } : b)),
    ...draftBoxes.filter((b) => !liveIds.has(b.id)).map((b) => ({ ...b, draftOnly: true })),
  ];
}

/** The first of `keys` set on `o` — the role list comes back as raw rows, cased as the database has them. */
const pick = (o, ...keys) => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
  return undefined;
};

/** BindRoleMasterList rows as { id, name, active, dept, centres }; active ones first, then by name. */
export const normRoles = (list) =>
  (Array.isArray(list) ? list : [])
    .map((r) => {
      const active = pick(r, "Active", "active");
      return {
        // `id` is f_rolemaster.ID — what f_login.RoleID, sb_screen_module.ModuleId
        // and sb_screen_access.RoleID hold. (`RoleID` on this row is the centre
        // mapping's id, not the role's.)
        id: idKey(pick(r, "id", "ID", "Id")),
        name: String(pick(r, "RoleName", "roleName") ?? "").trim(),
        active: active === undefined || active === true || Number(active) === 1,
        dept: String(pick(r, "DeptName", "deptName") ?? "").trim(),
        centres: String(pick(r, "CentreName", "centreName") ?? "").trim(),
      };
    })
    .filter((r) => r.id && r.name)
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

/** "TextInput" -> "Text Input", "ActionTile" -> "Action Tile". */
export const typeLabel = (type) =>
  String(type || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

/** An employee id as one key: ids can come back with stray spaces, grants are saved trimmed. */
export const idKey = (id) => String(id ?? "").trim();

/** Sorted, comma-joined ids — two lists hold the same people when these match. */
export const idsOf = (list) =>
  (list || [])
    .map((u) => String(u.employeeID))
    .sort()
    .join(",");

/** Trimmed ids, each person once. */
export const uniqueEmployees = (list) => {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((e) => ({ ...e, employeeID: idKey(e?.employeeID) }))
    .filter((e) => e.employeeID && !seen.has(e.employeeID) && seen.add(e.employeeID));
};

export const initials = (name) =>
  String(name || "?")
    .replace(/^(mr|mrs|ms|dr|miss)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

// A stable tone per user, so the same person looks the same in every box.
const USER_TONES = ["blue", "violet", "teal", "green", "amber", "slate"];
export const toneOf = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return USER_TONES[h % USER_TONES.length];
};

/** Wide enough for the multi-column layout; below this the page scrolls normally. */
export const FIT_MIN_WIDTH = 861;

/**
 * Sizes the page to the rest of the window below where it starts, so the window
 * itself never scrolls; the lists scroll inside. Measured, not hard-coded,
 * because the app header is a different height in each design mode. Returns
 * null on narrow screens.
 */
export function useFitHeight(ref) {
  const [height, setHeight] = useState(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el || window.innerWidth < FIT_MIN_WIDTH) return setHeight(null);
      const top = el.getBoundingClientRect().top + window.scrollY;
      // a little air under the page so its border and shadow show
      setHeight(Math.max(360, Math.floor(window.innerHeight - top - 10)));
    };
    measure();
    // the app header and breadcrumb can settle a moment after the page mounts
    const late = setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(late);
      window.removeEventListener("resize", measure);
    };
  }, [ref]);
  return height;
}

/** A span that acts as a button: click, Enter or Space; nothing while `off`. */
export function Btn({ tone = "blue", off, small, title, onClick, children }) {
  const fire = () => !off && onClick?.();
  return (
    <span
      role="button"
      tabIndex={off ? -1 : 0}
      aria-disabled={off || undefined}
      title={title}
      className={`sbp-btn sbp-btn-${tone}${small ? " sbp-btn-sm" : ""}${off ? " is-off" : ""}`}
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fire();
        }
      }}
    >
      {children}
    </span>
  );
}

/** `text` with every match of `q` wrapped in <mark>. */
export function Highlight({ text, q }) {
  const s = String(text || "");
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return s;
  const out = [];
  let from = 0;
  let at = s.toLowerCase().indexOf(needle);
  while (at !== -1) {
    if (at > from) out.push(s.slice(from, at));
    out.push(<mark key={at}>{s.slice(at, at + needle.length)}</mark>);
    from = at + needle.length;
    at = s.toLowerCase().indexOf(needle, from);
  }
  if (from < s.length) out.push(s.slice(from));
  return out;
}

/**
 * A searchable dropdown in the page header, styled as the screen picker.
 *
 * @param items       [{ id, name, sub?, search?, icon?, badge? }] — `search` is
 *                    extra text the filter matches (an id, a department);
 *                    `icon` replaces the option's default icon.
 * @param fieldIcon   the icon in the closed field; `tone` colours it.
 * @param disabled    shows `disabledText` and does not open.
 * @param multiple    `value` is an array of ids: options tick on and off and
 *                    the list stays open; "Select all" / "Clear" on top.
 *                    `manyLabel(n)` names a selection of more than one.
 */
export function SearchPicker({
  items,
  value,
  onChange,
  t,
  fieldIcon,
  optionIcon,
  tone = "",
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  disabledText,
  loading = false,
  className = "",
  multiple = false,
  manyLabel,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const picked = useMemo(
    () => (multiple ? new Set((Array.isArray(value) ? value : []).map(String)) : new Set(value ? [String(value)] : [])),
    [multiple, value],
  );
  const isOn = (r) => picked.has(String(r.id));
  const chosen = useMemo(() => items.filter((r) => picked.has(String(r.id))), [items, picked]);
  // One chosen option draws as it does in the list; several as a stack.
  const current = chosen.length === 1 ? chosen[0] : null;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((r) => !needle || `${r.name} ${r.search || ""}`.toLowerCase().includes(needle));
  }, [items, q]);

  // Closes when it goes disabled (the role it depends on was cleared).
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return undefined;
    const down = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(Math.max(0, items.findIndex((r) => isOn(r))));
    requestAnimationFrame(() => inputRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => setActive(shown.length ? 0 : -1), [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const ids = () => (Array.isArray(value) ? value.map(String) : []);
  const choose = (r) => {
    if (!r) return;
    if (multiple) {
      // ticks stay in the list's order, so the same people read the same way
      const next = isOn(r) ? ids().filter((id) => id !== String(r.id)) : [...ids(), String(r.id)];
      const order = new Map(items.map((it, i) => [String(it.id), i]));
      onChange(next.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)));
      return;
    }
    setOpen(false);
    if (r.id !== value) onChange(r.id);
  };
  // "Select all": every option the search shows; a second press clears them.
  const allShownOn = shown.length > 0 && shown.every(isOn);
  const toggleShown = () => {
    const shownIds = new Set(shown.map((r) => String(r.id)));
    if (allShownOn) return onChange(ids().filter((id) => !shownIds.has(id)));
    const next = new Set([...ids(), ...shownIds]);
    return onChange(items.map((r) => String(r.id)).filter((id) => next.has(id)));
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(shown[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };
  const toggle = () => !disabled && setOpen((o) => !o);

  return (
    <div className={`sbp-picker ${className}${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`} ref={rootRef}>
      <div
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-disabled={disabled || undefined}
        className="sbp-picker-field"
        onClick={toggle}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {/* the chosen option's own icon (an employee's initials) when it has
            one; several chosen stack their first three */}
        {chosen.length > 1 && chosen[0].icon ? (
          <span className="sbp-picker-stack">
            {chosen.slice(0, 3).map((r) => (
              <span key={r.id}>{r.icon}</span>
            ))}
          </span>
        ) : current?.icon ? (
          <span className="sbp-picker-own-icon">{current.icon}</span>
        ) : (
          <span className={`sbp-picker-icon${tone ? ` is-${tone}` : ""}`}>{fieldIcon}</span>
        )}
        <span className="sbp-picker-value">
          <span className={chosen.length ? "" : "is-placeholder"}>
            {disabled && !chosen.length
              ? disabledText
              : chosen.length > 1
                ? manyLabel
                  ? manyLabel(chosen.length)
                  : `${chosen.length} ${t("selected")}`
                : current
                  ? current.name
                  : placeholder}
          </span>
        </span>
        {loading ? <Loader2 size={14} className="sbp-spin sbp-picker-chevron" /> : current?.badge || null}
        <ChevronDown size={15} className="sbp-picker-chevron" />
      </div>
      {open ? (
        <div className="sbp-picker-panel" role="listbox">
          <div className="sbp-search sbp-picker-search">
            <Search size={13} />
            <input
              ref={inputRef}
              type="text"
              className="sbp-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder={searchPlaceholder}
            />
            {q ? (
              <span className="sbp-search-clear" role="button" tabIndex={-1} onClick={() => setQ("")}>
                <X size={13} />
              </span>
            ) : null}
          </div>
          {multiple && !loading && items.length ? (
            <div className="sbp-picker-tools">
              <span
                role="checkbox"
                tabIndex={0}
                aria-checked={allShownOn ? "true" : shown.some(isOn) ? "mixed" : "false"}
                className={`sbp-all${allShownOn ? " is-on" : shown.some(isOn) ? " is-some" : ""}${shown.length ? "" : " is-off"}`}
                onClick={() => shown.length && toggleShown()}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && shown.length) {
                    e.preventDefault();
                    toggleShown();
                  }
                }}
              >
                <span className="sbp-check">
                  {allShownOn ? <Check size={12} /> : shown.some(isOn) ? <span className="sbp-check-dash" /> : null}
                </span>
                {q.trim() ? t("All shown") : t("Select all")}
                <b>{shown.length}</b>
              </span>
              <span className="sbp-picker-count">
                <b>{chosen.length}</b> {t("selected")}
              </span>
              <Btn tone="slate" small off={!chosen.length} onClick={() => onChange([])}>
                <X size={12} /> {t("Clear")}
              </Btn>
            </div>
          ) : null}
          <div className="sbp-picker-list" ref={listRef}>
            {loading ? (
              <div className="sbp-list-none">
                <Loader2 size={13} className="sbp-spin" /> {t("Loading…")}
              </div>
            ) : (
              shown.map((r, i) => (
                <div
                  key={r.id}
                  role="option"
                  aria-selected={isOn(r)}
                  data-idx={i}
                  className={`sbp-picker-opt${isOn(r) ? " is-selected" : ""}${i === active ? " is-active" : ""}${
                    multiple ? " is-multi" : ""
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(r)}
                >
                  {multiple ? <span className="sbp-check">{isOn(r) ? <Check size={12} /> : null}</span> : null}
                  {r.icon || <span className={`sbp-picker-opt-icon${tone ? ` is-${tone}` : ""}`}>{optionIcon}</span>}
                  <span className="sbp-picker-opt-text">
                    <span className="sbp-picker-opt-name">
                      <Highlight text={r.name} q={q} />
                    </span>
                    {r.sub ? <small>{r.sub}</small> : null}
                  </span>
                  {r.badge || null}
                  {!multiple && isOn(r) ? <Check size={14} className="sbp-picker-check" /> : null}
                </div>
              ))
            )}
            {!loading && !shown.length ? <div className="sbp-list-none">{emptyText}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The role dropdown: `roles` as normRoles gives them. */
export function RolePicker({ roles, value, onChange, t, loading = false }) {
  const items = useMemo(
    () =>
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        search: r.dept,
        sub: [r.dept, r.active ? "" : t("Inactive")].filter(Boolean).join(" · "),
      })),
    [roles, t],
  );
  return (
    <SearchPicker
      className="sbp-role-picker"
      items={items}
      value={value}
      onChange={onChange}
      t={t}
      tone="role"
      fieldIcon={<Briefcase size={14} />}
      optionIcon={<Briefcase size={13} />}
      placeholder={t("Pick a role…")}
      searchPlaceholder={t("Search roles…")}
      emptyText={t("No role matches")}
      loading={loading}
    />
  );
}

/**
 * The employee dropdown: the role's active employees, each with their
 * initials, ID and how many boxes they hold under the role. Several can be
 * ticked (`value` is an array of ids). Disabled until a role is picked.
 */
export function EmployeePicker({ employees, value, onChange, t, loading = false, disabled = false }) {
  const items = useMemo(
    () =>
      employees.map((e) => ({
        id: e.employeeID,
        name: e.employeeName || e.employeeID,
        search: e.employeeID,
        sub: e.employeeID,
        icon: <span className={`sbp-avatar sbp-tone-${toneOf(e.employeeID)}`}>{initials(e.employeeName || e.employeeID)}</span>,
        badge: (
          <span
            className={`sbp-box-count${e.grants ? "" : " is-zero"}`}
            title={t("Restricted boxes this employee can see under this role, on all screens")}
          >
            <ShieldCheck size={11} /> {e.grants || 0}
          </span>
        ),
      })),
    [employees, t],
  );
  return (
    <SearchPicker
      className="sbp-emp-picker"
      items={items}
      value={value}
      onChange={onChange}
      t={t}
      tone="emp"
      multiple
      manyLabel={(n) => `${n} ${t("employees")}`}
      fieldIcon={<User size={14} />}
      placeholder={t("Pick employees…")}
      searchPlaceholder={t("Search by name or ID…")}
      emptyText={employees.length ? t("No employee matches") : t("No active employee logs in under this role.")}
      disabled={disabled}
      disabledText={t("Pick a role first…")}
      loading={loading}
    />
  );
}

/** The page's two views, as a segmented switch in the header. */
export function ViewTabs({ view, onChange, t }) {
  const tabs = [
    { key: "role", icon: <UserCog size={12} />, label: t("By role") },
    { key: "box", icon: <Layers size={12} />, label: t("By box") },
  ];
  return (
    <span className="sbp-tabs" role="tablist">
      {tabs.map((tab) => (
        <span
          key={tab.key}
          role="tab"
          tabIndex={0}
          aria-selected={view === tab.key}
          className={`sbp-tab${view === tab.key ? " is-on" : ""}`}
          onClick={() => onChange(tab.key)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange(tab.key);
            }
          }}
        >
          {tab.icon} {tab.label}
        </span>
      ))}
    </span>
  );
}
