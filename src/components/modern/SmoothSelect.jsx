import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search as SearchIcon } from "lucide-react";
import { useTheme } from "@app/hooks/useTheme";
import FieldShell from "./FieldShell";
import { usePopupPosition, useOutside } from "./hooks";
import { useModernPopAnim } from "./modernPopAnim";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { OptionLabel, optionFillStyle, selectedFillStyle } from "@app/components/formComponent/optionColor";

export default function SmoothSelect({
  icon,
  label,
  id,
  name,
  value,
  options = [],
  onChange,
  clearable = true,
  placeholder = "",
  compact = false,
  truncateAt = 16,
  searchable = true,
  searchThreshold = 6,
  required = false,
  tabSkip = false,
}) {
  useModernPopAnim();
  const { theme } = useTheme();
  const T = theme.colors;
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hi, setHi] = useState(-1);
  const [query, setQuery] = useState("");
  const [tipShown, setTipShown] = useState(false);
  const tipTimer = useRef(null);
  const wrapRef = useRef(null);
  const popRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const triggerRef = useRef(null);
  const showSearch = searchable && options.length >= searchThreshold;
const themeClass = useLocalStorage("theme", "get");
  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        String(o?.label ?? "").toLowerCase().includes(q) ||
        String(o?.value ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const popH = Math.min(280, (showSearch ? 96 : 56) + filtered.length * 32);
  const pos = usePopupPosition(wrapRef, popRef, open, popH, 240);
  useOutside(wrapRef, popRef, open, () => setOpen(false));

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHi(-1);
      return;
    }
    const idx = options.findIndex((o) => o.value === value);
    setHi(idx >= 0 ? idx : 0);
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHi((h) => {
      if (filtered.length === 0) return -1;
      if (h < 0 || h >= filtered.length) return 0;
      return h;
    });
  }, [filtered.length, open]);

  useEffect(() => {
    if (!open || hi < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${hi}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  const selected = options.find((o) => o.value === value);
  // keyboard focus must look identical to mouse/open focus
  const isFocused = open || focused;
  const active = isFocused || !!selected;

  const fire = (val) => {
    if (typeof onChange === "function") {
      onChange({ target: { value: val, name } });
    }
  };

  // close popup and put focus back on the trigger so the form-level
  // Tab cycle (handletab) still sees an in-form activeElement
  const closeAndRefocus = () => {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const pick = (o) => {
    fire(o.value);
    closeAndRefocus();
  };

  const fullLabel = selected?.label != null ? String(selected.label) : "";
  const isTruncated = truncateAt > 0 && fullLabel.length > truncateAt;
  const showLabel = isTruncated
    ? fullLabel.slice(0, truncateAt) + "..."
    : fullLabel;

  const [tipPos, setTipPos] = useState({ top: 0, left: 0 });
  const enterTip = () => {
    if (!isTruncated || open) return;
    if (tipTimer.current) clearTimeout(tipTimer.current);
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setTipPos({
        top: r.top + window.scrollY - 8,
        left: r.left + window.scrollX + r.width / 2,
      });
    }
    tipTimer.current = setTimeout(() => setTipShown(true), 200);
  };
  const leaveTip = () => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    setTipShown(false);
  };

  return (
    <div ref={wrapRef}>
      <FieldShell
        icon={icon}
        label={label}
        focus={isFocused}
        active={active}
        hasClear={clearable && !!selected}
        onClear={() => fire("")}
        height={compact ? "1.75rem" : undefined}
        required={required}
      >
        <div
          id={id}
          ref={triggerRef}
          role="button"
          tabIndex={0}
          data-tab-field="true"
          data-tab-required={required ? "true" : undefined}
          data-tab-skip={tabSkip ? "true" : undefined}
          onClick={() => {
            leaveTip();
            setOpen((o) => !o);
          }}
          onMouseEnter={enterTip}
          onMouseLeave={leaveTip}
          onFocus={() => {
            setFocused(true);
            enterTip();
          }}
          onBlur={() => {
            setFocused(false);
            leaveTip();
          }}
          onKeyDown={(e) => {
            // when the popup is open without a search box, focus stays here,
            // so the trigger must drive highlight/select itself
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (open && filtered[hi]) pick(filtered[hi]);
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
            // kill browser default keyboard outline; FieldShell renders the
            // visible focus ring (accessibility indicator preserved)
            outline: "none",
            paddingLeft: icon ? 26 : 10,
            // single trailing icon: clear X when selected, chevron otherwise
            paddingRight: 28,
            cursor: "pointer",
            fontSize: compact ? "0.9583rem" : "1.0417rem",
            color: selected ? T.text : T.textMuted + "99",
            userSelect: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            // A closed box in the colour of what it holds, when the selection
            // asks to be drawn that way.
            ...(selectedFillStyle(selected) || {}),
          }}
        >
          {selected ? <OptionLabel option={selected}>{showLabel}</OptionLabel> : placeholder}
        </div>
        {isTruncated &&
          tipShown &&
          createPortal(
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: tipPos.top,
                left: tipPos.left,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
                background:
                  "linear-gradient(180deg, rgba(15,23,42,.97), rgba(30,41,59,.94))",
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: 0.2,
                padding: "6px 10px",
                borderRadius: 8,
                boxShadow:
                  "0 10px 28px -10px rgba(15,23,42,.55), 0 0 0 1px rgba(255,255,255,.06) inset",
                whiteSpace: "nowrap",
                maxWidth: 360,
                overflow: "hidden",
                textOverflow: "ellipsis",
                zIndex: 2147483641,
                animation: "modernTipIn .15s ease-out",
              }}
            >
              {fullLabel}
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -4,
                  transform: "translateX(-50%) rotate(45deg)",
                  width: 8,
                  height: 8,
                  background: "rgba(30,41,59,.94)",
                  borderRadius: 2,
                }}
              />
            </div>,
            document.body
          )}
        {!(clearable && selected) && (
          <ChevronDown
            size={13}
            style={{
              position: "absolute",
              right: 9,
              top: "50%",
              transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
              transition: "transform .2s",
              color: open ? T.accent : T.textMuted,
              pointerEvents: "none",
            }}
          />
        )}
      </FieldShell>

      {open &&
        createPortal(
          <div className={themeClass}>
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
              minWidth: pos.width,
              zIndex: 2147483640,
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              boxShadow: `0 18px 40px -16px rgba(15,23,42,.35), 0 0 0 3px ${T.accentSoft}`,
              padding: 4,
              transformOrigin: pos.openUp ? "bottom left" : "top left",
            }}
          >
            {showSearch && (
              <div style={{ position: "relative", padding: "2px 2px 6px 2px" }}>
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
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHi((h) => Math.min(filtered.length - 1, (h < 0 ? -1 : h) + 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHi((h) => Math.max(0, (h < 0 ? filtered.length : h) - 1));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      if (filtered[hi]) pick(filtered[hi]);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      closeAndRefocus();
                    } else if (e.key === "Tab") {
                      e.preventDefault();
                      closeAndRefocus();
                    }
                  }}
                  placeholder="Search..."
                  autoComplete="off"
                  style={{
                    width: "100%",
                    height: 28,
                    padding: "0 10px 0 28px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 7,
                    background: T.panel,
                    color: T.text,
                    fontSize: 12,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                  // onFocus={(e) => {
                  //   e.currentTarget.style.borderColor = T.accent;
                  //   e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentSoft}`;
                  // }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}

                  className={focus?"border-colornew":""}
                />
              </div>
            )}
            <div
              ref={listRef}
              style={{ maxHeight: 240, overflowY: "auto" }}
              tabIndex={showSearch ? -1 : 0}
              onKeyDown={(e) => {
                if (showSearch) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHi((h) => Math.min(filtered.length - 1, (h < 0 ? -1 : h) + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHi((h) => Math.max(0, (h < 0 ? filtered.length : h) - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[hi]) pick(filtered[hi]);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  closeAndRefocus();
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  closeAndRefocus();
                }
              }}
            >
              {filtered.length === 0 ? (
                <div style={{ padding: "10px", textAlign: "center", color: T.textMuted, fontSize: 12 }}>
                  No options
                </div>
              ) : (
                filtered.map((o, i) => {
                  const sel = o.value === value;
                  const hot = i === hi;
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      data-idx={i}
                      onClick={() => pick(o)}
                      onMouseEnter={() => setHi(i)}

                     className={
  sel
    ? "background-theme-colornew text-theme-colornew"
    : hot
    ? "background-theme-colornew"
    : ""
}
style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "7px 10px",
  borderRadius: 7,
  border: "none",
  cursor: "pointer",
  background: "transparent",
  fontWeight: sel ? 600 : 500,
  fontFamily: "inherit",
  fontSize: 12.5,
  textAlign: "left",
  transition: "background .12s",
  marginBlock:"2px",
  // An option carrying its own colour paints over the selected/hot classes:
  // an inline background is the only one that can win against them.
  ...(optionFillStyle(o, { selected: sel, focused: hot }) || {}),
}}
                    >
                      <span style={{ flex: 1 }}>
                        <OptionLabel option={o} />
                      </span>
                      {sel && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          </div>
          ,
          document.body
        )}
    </div>
  );
}
