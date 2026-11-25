import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import { useTheme } from "@app/hooks/useTheme";
import FieldShell from "./FieldShell";
import { usePopupPosition, useOutside, fmtISO, MONTHS, WK } from "./hooks";
import { useModernPopAnim } from "./modernPopAnim";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";

export default function SmoothDate({
  icon,
  label,
  id,
  name,
  value,
  onChange,
  displayFormat = "DD-MMM-YYYY",
  minDate,
  maxDate,
  clearable = true,
  required = false,
  tabSkip = false,
  enableYearPicker = true,
}) {
  useModernPopAnim();
  const { theme, isDark } = useTheme();
  const T = theme.colors;
  const themeClass = useLocalStorage("theme", "get");
  // dark-aware accent tints — the picker shipped hardcoded sky-blue lights
  // (#f0f8ff / #03a0e7 / #b3e4e4) that wash out on the dark panel
  const selBg = isDark ? "rgba(45,212,191,.16)" : "#f0f8ff";
  const selText = isDark ? (T.accent || "#2DD4BF") : "#03a0e7";
  const daySelBg = isDark ? (T.accent || "#2DD4BF") : "#b3e4e4";
  const daySelText = isDark ? "#06281F" : "#03a0e7";

  const initialISO = value
    ? moment(value, ["YYYY-MM-DD", "DD-MMM-YYYY", moment.ISO_8601]).format("YYYY-MM-DD")
    : "";

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = initialISO ? new Date(initialISO) : new Date();
    return { y: d.getFullYear(), m: d.getMonth(), mode: "day" };
  });
  const wrapRef = useRef(null);
  const popRef = useRef(null);
  const triggerRef = useRef(null);
  const pos = usePopupPosition(wrapRef, popRef, open, 320, 256);
  useOutside(wrapRef, popRef, open, () => setOpen(false));

  const active = open || !!initialISO;
  const today = new Date();
  const todayISO = fmtISO(today);
  const selISO = initialISO;
  const display = initialISO ? moment(initialISO).format(displayFormat) : "";

  // selected vs current year/month for grid highlighting
  const selDate = selISO ? new Date(selISO) : null;
  const selYear = selDate ? selDate.getFullYear() : null;
  const selMonth = selDate ? selDate.getMonth() : null;
  const curYear = today.getFullYear();
  const curMonth = today.getMonth();
  const MO = MONTHS.map((m) => m.slice(0, 3)); // Jan, Feb, ... for month grid
  // 16-year paged window (4 x 4) for the year grid
  const yearStart = view.y - 7;

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const prevDays = new Date(view.y, view.m, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, cur: false, m: view.m - 1 });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, cur: true, m: view.m });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - daysInMonth - firstDay + 1, cur: false, m: view.m + 1 });

  const goto = (delta) => {
    // chevrons page by year-block in year mode, by year in month mode,
    // by month in day mode
    if (view.mode === "year") { setView({ ...view, y: view.y + delta * 16 }); return; }
    if (view.mode === "month") { setView({ ...view, y: view.y + delta }); return; }
    let m = view.m + delta, y = view.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setView({ ...view, y, m });
  };

  // drill-down: year grid -> month grid -> day grid (fast DOB selection)
  const pickYear = (y) => setView({ ...view, y, mode: "month" });
  const pickMonth = (m) => setView({ ...view, m, mode: "day" });

  const fire = (iso) => {
    if (typeof onChange === "function") {
      onChange({ target: { value: iso, name } });
    }
  };

  const isOutOfRange = (iso) => {
    if (minDate && iso < moment(minDate).format("YYYY-MM-DD")) return true;
    if (maxDate && iso > moment(maxDate).format("YYYY-MM-DD")) return true;
    return false;
  };

  // close popup and refocus the trigger so the form-level Tab cycle
  // (handletab) still sees an in-form activeElement
  const closeAndRefocus = () => {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const pick = (cell) => {
    const m = cell.m < 0 ? 11 : cell.m > 11 ? 0 : cell.m;
    const y = cell.m < 0 ? view.y - 1 : cell.m > 11 ? view.y + 1 : view.y;
    const iso = fmtISO(new Date(y, m, cell.d));
    if (isOutOfRange(iso)) return;
    fire(iso);
    closeAndRefocus();
  };

  const setToday = () => {
    if (isOutOfRange(todayISO)) return;
    fire(todayISO);
    setView({ y: today.getFullYear(), m: today.getMonth(), mode: "day" });
  };
  const clear = () => fire("");
  const navBtn = {
    width: 24, height: 24, borderRadius: 7,
    border: `1px solid ${selBg}`, background: selBg,
    color: T.text, cursor: "pointer",
    display: "grid", placeItems: "center",
  };

  const titleBtn = {
    flex: 1, padding: "5px 8px", borderRadius: 7, border: "none",
    background: T.accentSoft, cursor: "pointer", fontWeight: 700,
    fontSize: 12, fontFamily: "inherit", textAlign: "center",
  };

  // grid cell shared style for month/year pickers
  const gridCell = (isSel, isCur) => ({
    padding: "9px 5px", borderRadius: 7, border: "none", cursor: "pointer",
    fontFamily: "inherit", fontSize: 12, fontWeight: isSel ? 700 : 600,
    background: isSel ? selBg : "transparent",
    color: isSel ? selText : T.text,
    boxShadow: !isSel && isCur ? `inset 0 0 0 1.5px ${T.accent}` : "none",
    transition: "background .12s",
    textAlign: "center",
  });

  return (
    <div ref={wrapRef}>
      <FieldShell
        icon={icon}
        label={label}
        focus={open}
        active={active}
        hasClear={clearable && !!initialISO}
        onClear={clear}
      >
        <div
          id={id}
          ref={triggerRef}
          role="button"
          tabIndex={0}
          data-tab-field="true"
          data-tab-required={required ? "true" : undefined}
          data-tab-skip={tabSkip ? "true" : undefined}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            paddingLeft: icon ? 26 : 10,
            paddingRight: initialISO && clearable ? 24 : 10,
            cursor: "pointer",
            fontSize: "1.0417rem",
            color: initialISO ? T.text : "transparent",
            userSelect: "none",
          }}
        >
          {display}
        </div>
      </FieldShell>

      {open &&
        createPortal(
           <div className={themeClass}>
          <div
            ref={popRef}
            className="md-pop"
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Tab") {
                e.preventDefault();
                closeAndRefocus();
              }
            }}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: 256,
              zIndex: 2147483640,
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              boxShadow: `0 18px 40px -16px rgba(15,23,42,.35), 0 0 0 3px ${T.accentSoft}`,
              padding: 10,
              fontSize: 12,
              transformOrigin: pos.openUp ? "bottom left" : "top left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span type="button" onClick={() => goto(-1)} style={navBtn} title="Previous">
                <ChevronLeft size={13} />
              </span>
              <span
                type="button"
                onClick={() =>
                  enableYearPicker &&
                  setView({ ...view, mode: view.mode === "day" ? "year" : "day" })
                }
                style={{ ...titleBtn, margin: "0 5px", cursor: enableYearPicker ? "pointer" : "default" }}
                // className="text-theme-colornew background-theme-colornew"
                title={enableYearPicker ? "Select year" : undefined}
              >
                {MONTHS[view.m]} {view.y}
              </span>
              <span type="button" onClick={() => goto(1)} style={navBtn} title="Next">
                <ChevronRight size={13} />
              </span>
            </div>

            <div key={view.mode} style={{ animation: "mdPopIn .15s cubic-bezier(.4,0,.2,1) both" }}>
            {view.mode === "year" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, padding: 2 }}>
                {Array.from({ length: 16 }, (_, i) => yearStart + i).map((y) => (
                  <span
                    key={y}
                    type="button"
                    onClick={() => pickYear(y)}
                    style={gridCell(y === selYear, y === curYear)}
                    // className={y === selYear ? "datepicker-bgnew" : ""}
                  >
                    {y}
                  </span>
                ))}
              </div>
            ) : view.mode === "month" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, padding: 2 }}>
                {MO.map((mName, m) => {
                  const isSel = m === selMonth && view.y === selYear;
                  const isCur = m === curMonth && view.y === curYear;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => pickMonth(m)}
                      style={gridCell(isSel, isCur)}
                      // className={isSel ? "datepicker-bgnew" : ""}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 3 }}>
                  {WK.map((w, i) => (
                    <div
                      key={w}
                      style={{
                        textAlign: "center", padding: "3px 0", fontSize: 9.5, fontWeight: 700,
                        color: i === 0 ? "undefined" : T.textMuted,
                        textTransform: "uppercase", letterSpacing: ".4px",
                      }}
                      // className={i===0?"text-theme-colornew":""}
                    >
                      {w}
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                  {cells.map((cellc, i) => {
                    const m = cellc.m < 0 ? 11 : cellc.m > 11 ? 0 : cellc.m;
                    const y = cellc.m < 0 ? view.y - 1 : cellc.m > 11 ? view.y + 1 : view.y;
                    const iso = fmtISO(new Date(y, m, cellc.d));
                    const isSel = iso === selISO;
                    const isToday = iso === todayISO;
                    const isSun = i % 7 === 0;
                    const disabled = isOutOfRange(iso);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pick(cellc)}
                        disabled={disabled}
                       style={{
  aspectRatio: "1/1", borderRadius: 7, border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit", fontSize: 11.5,
  fontWeight: isSel ? 700 : 500,
  // background: isSel ? undefined : "transparent",
  background: isSel ? daySelBg : "transparent",
  // color: isSel ? "#fff" : disabled ? undefined : !cellc.cur ? T.textMuted + "88" : isSun ? "undefined" : T.text,
  color: isSel ? daySelText : disabled ? undefined : !cellc.cur ? T.textMuted + "88" : isSun ? "undefined" : T.text,

  // boxShadow: isSel ? `0 4px 10px -4px ${T.accent}` : isToday ? `inset 0 0 0 1.5px ${T.accent}` : "none",
  opacity: cellc.cur ? 1 : 0.55,
  transition: "background .12s",

}}
// className={`${isSel ? "datepicker-bgnew " : ""}${disabled ? "text-theme-colornew" : ""}${isSun ? "text-theme-colornew" : ""}`}

                      >
                        {cellc.d}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 5, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <span
                type="button"
                onClick={clear}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 7, cursor: "pointer",
                  border: `1px solid #F43F5E40`, background: "#F43F5E12",
                  // color: "#F43F5E",
                   fontWeight: 700, fontSize: 11, fontFamily: "inherit",
                   textAlign: "center",
                }}
                // className="text-theme-colornew"
              >
                Clear
              </span>
              <button
                type="button"
                onClick={setToday}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 7, cursor: "pointer",
                  border: "none", background: selBg, color: selText,
                  fontWeight: 700, fontSize: 11, fontFamily: "inherit",
                }}
                // className="datepicker-bgnew"

              >
                Today
              </button>
            </div>
          </div>
          </div>
          ,
          document.body
        )}
    </div>
  );
}
