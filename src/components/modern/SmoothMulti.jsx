import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search as SearchIcon, X } from "lucide-react";
import { useTheme } from "@app/hooks/useTheme";
import FieldShell from "./FieldShell";
import { usePopupPosition, useOutside } from "./hooks";
import { useModernPopAnim } from "./modernPopAnim";

/*
  <SmoothMulti
    icon={Building}
    id="department"
    name="department"
    label="Department"
    value={values?.department}                 // array of option objects
    options={dynamicOptions}                   // [{name, code}] or [{label, value}]
    optionLabel="name"                         // default "label"
    optionValue="code"                         // default "value"
    onChange={(name, selectedOptions) => ...}  // matches legacy MultiSelectComp signature
    compact
    showSelectAll
    maxSelectedLabels={2}
    placeholder=""
    searchable
    searchThreshold={6}
    truncateAt={16}
  />
*/

export default function SmoothMulti({
  icon,
  label,
  id,
  name,
  value,
  options = [],
  optionLabel = "label",
  optionValue = "value",
  onChange,
  placeholder = "",
  compact = false,
  showSelectAll = true,
  maxSelectedLabels = 2,
  searchable = true,
  searchThreshold = 6,
  truncateAt = 24,
  disabled = false,
  required = false,
  tabSkip = false,
}) {
  useModernPopAnim();
  const { theme } = useTheme();
  const T = theme.colors;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef(null);
  const popRef = useRef(null);
  const searchRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const lbl = (o) => String(o?.[optionLabel] ?? "");
  const val = (o) => o?.[optionValue];

  const selected = Array.isArray(value) ? value : [];
  const selectedKeys = useMemo(
    () => new Set(selected.map((s) => String(val(s)))),
    [selected, optionValue],
  );

  const showSearch = searchable && options.length >= searchThreshold;

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        lbl(o).toLowerCase().includes(q) ||
        String(val(o) ?? "").toLowerCase().includes(q),
    );
  }, [options, query, optionLabel, optionValue]);

  const popH = Math.min(320, (showSearch ? 100 : 60) + filtered.length * 32);
  const pos = usePopupPosition(wrapRef, popRef, open, popH, 260);
  useOutside(wrapRef, popRef, open, () => setOpen(false));

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHi(-1);
      return;
    }
    setHi(0);
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open || hi < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${hi}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  const fire = (next) => {
    if (typeof onChange === "function") onChange(name, next);
  };

  const toggle = (o) => {
    const k = String(val(o));
    if (selectedKeys.has(k)) {
      fire(selected.filter((s) => String(val(s)) !== k));
    } else {
      fire([...selected, o]);
    }
  };

  const clearAll = (e) => {
    e?.stopPropagation();
    fire([]);
  };

  const toggleAll = () => {
    const allSelected =
      filtered.length > 0 && filtered.every((o) => selectedKeys.has(String(val(o))));
    if (allSelected) {
      const remaining = selected.filter(
        (s) => !filtered.some((o) => String(val(o)) === String(val(s))),
      );
      fire(remaining);
    } else {
      const additions = filtered.filter((o) => !selectedKeys.has(String(val(o))));
      fire([...selected, ...additions]);
    }
  };

  const labels = selected.map(lbl).filter(Boolean);
  let displayText = "";
  if (labels.length === 0) {
    displayText = "";
  } else if (labels.length <= maxSelectedLabels) {
    const joined = labels.join(", ");
    displayText =
      truncateAt > 0 && joined.length > truncateAt
        ? joined.slice(0, truncateAt) + "..."
        : joined;
  } else {
    displayText = `${labels.length} ${labels.length === 1 ? "item" : "items"} selected`;
  }
  const fullLabels = labels.join(", ");

  const active = open || selected.length > 0;

  // close popup and refocus the trigger so the form-level Tab cycle
  // (handletab) still sees an in-form activeElement
  const closeAndRefocus = () => {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const handleListKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(filtered.length - 1, (h < 0 ? -1 : h) + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, (h < 0 ? filtered.length : h) - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (filtered[hi]) toggle(filtered[hi]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      closeAndRefocus();
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((o) => selectedKeys.has(String(val(o))));

  return (
    <div ref={wrapRef}>
      <FieldShell
        icon={icon}
        label={label}
        focus={open}
        active={active}
        hasClear={selected.length > 0 && !disabled}
        onClear={clearAll}
        height={compact ? "1.75rem" : undefined}
      >
        <div
          id={id}
          ref={triggerRef}
          role="button"
          tabIndex={disabled ? -1 : 0}
          data-tab-field={disabled ? undefined : "true"}
          data-tab-required={required && !disabled ? "true" : undefined}
          data-tab-skip={tabSkip && !disabled ? "true" : undefined}
          title={fullLabels}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (disabled) return;
            // when the popup is open without a search box, focus stays here,
            // so the trigger must drive highlight/toggle itself
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (open && filtered[hi]) toggle(filtered[hi]);
              else setOpen((o) => !o);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open) setOpen(true);
              else setHi((h) => Math.min(filtered.length - 1, (h < 0 ? -1 : h) + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (!open) setOpen(true);
              else setHi((h) => Math.max(0, (h < 0 ? filtered.length : h) - 1));
            } else if (e.key === "Escape" && open) {
              e.preventDefault();
              closeAndRefocus();
            }
          }}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            paddingLeft: icon ? 26 : 10,
            paddingRight: selected.length > 0 ? 50 : 28,
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: compact ? "0.9583rem" : "1.0417rem",
            color: selected.length > 0 ? T.text : T.textMuted + "99",
            userSelect: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {selected.length > 0 ? displayText : placeholder}
        </div>
        <ChevronDown
          size={13}
          style={{
            position: "absolute",
            right: selected.length > 0 ? 24 : 9,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform .2s",
            color: open ? T.accent : T.textMuted,
            pointerEvents: "none",
          }}
        />
      </FieldShell>

      {open &&
        createPortal(
          <div
            ref={popRef}
            className="md-pop"
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                closeAndRefocus();
              }
            }}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              minWidth: Math.max(pos.width, 240),
              zIndex: 2147483640,
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              boxShadow: `0 18px 40px -16px rgba(15,23,42,.35), 0 0 0 3px ${T.accentSoft}`,
              padding: 4,
              transformOrigin: pos.openUp ? "bottom left" : "top left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 2px 6px 2px",
              }}
            >
              {showSelectAll && (
                <button
                  type="button"
                  onClick={toggleAll}
                  title={allFilteredSelected ? "Unselect all" : "Select all"}
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    background: allFilteredSelected ? T.accent : T.panel,
                    color: allFilteredSelected ? "#fff" : T.textMuted,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "inherit",
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </button>
              )}
              {showSearch && (
                <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                  <SearchIcon
                    size={12}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: T.textMuted,
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleListKey}
                    placeholder="Search..."
                    autoComplete="off"
                    style={{
                      width: "100%",
                      height: 28,
                      padding: "0 26px 0 28px",
                      border: `1px solid ${T.border}`,
                      borderRadius: 7,
                      background: T.panel,
                      color: T.text,
                      fontSize: 12,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = T.accent;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentSoft}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = T.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      tabIndex={-1}
                      style={{
                        position: "absolute",
                        right: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        padding: 2,
                        cursor: "pointer",
                        color: T.textMuted,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div
              ref={listRef}
              tabIndex={showSearch ? -1 : 0}
              onKeyDown={showSearch ? undefined : handleListKey}
              style={{ maxHeight: 240, overflowY: "auto" }}
            >
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: 10,
                    textAlign: "center",
                    color: T.textMuted,
                    fontSize: 12,
                  }}
                >
                  No options
                </div>
              ) : (
                filtered.map((o, i) => {
                  const k = String(val(o));
                  const sel = selectedKeys.has(k);
                  const hot = i === hi;
                  return (
                    <button
                      key={k}
                      type="button"
                      data-idx={i}
                      onClick={() => toggle(o)}
                      onMouseEnter={() => setHi(i)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 7,
                        border: "none",
                        cursor: "pointer",
                        background: hot
                          ? T.accentSoft
                          : sel
                          ? T.accentSoft
                          : "transparent",
                        color: sel ? T.accent : T.text,
                        fontWeight: sel ? 600 : 500,
                        fontFamily: "inherit",
                        fontSize: 12.5,
                        textAlign: "left",
                        transition: "background .12s",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: "inline-grid",
                          placeItems: "center",
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: `1.5px solid ${sel ? T.accent : T.border}`,
                          background: sel ? T.accent : "transparent",
                          color: "#fff",
                          flexShrink: 0,
                          transition: "background .12s, border-color .12s",
                        }}
                      >
                        {sel && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6.3 L5 8.8 L9.5 3.5"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lbl(o)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
