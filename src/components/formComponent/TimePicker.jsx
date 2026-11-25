import React, { useState, useRef, useEffect, useContext } from "react";
import moment from "moment";
import { Calendar } from "primereact/calendar";
import { notify } from "../../utils/ustil2";
import { DesignContext } from "@app/providers/DesignProvider";
import "./ModernTimePicker.css";

const pad = (n) => String(n).padStart(2, "0");

// parse free typed text -> { hour(1-12), minute, period } | null
// accepts: "8", "8:5", "08:05", "0805", "8:05 pm", "8 am", "13:30", "1330"
const parseTimeText = (raw) => {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toUpperCase();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[:.\s]?(\d{1,2})?\s*(AM|PM|A|P)?$/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  let mm = m[2] != null ? parseInt(m[2], 10) : 0;
  if (isNaN(hh) || isNaN(mm) || mm > 59) return null;
  const ap = m[3];
  let period;
  if (ap) {
    period = ap[0] === "P" ? "PM" : "AM";
    if (hh < 1 || hh > 12) return null;
  } else {
    if (hh > 23) return null;
    period = hh >= 12 ? "PM" : "AM";
    if (hh === 0) hh = 12;
    else if (hh > 12) hh -= 12;
  }
  return { hour: hh, minute: mm, period };
};

// Date -> { hour(1-12), minute, period } | null
const partsFromValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  const h = d.getHours();
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: d.getMinutes(), period: h >= 12 ? "PM" : "AM" };
};

// parts -> Date, preserving the date portion of the current value when present
const valueFromParts = (base, { hour, minute, period }) => {
  let d;
  if (base instanceof Date && !isNaN(base.getTime())) {
    d = new Date(base);
  } else if (base && !isNaN(new Date(base).getTime())) {
    d = new Date(base);
  } else {
    d = new Date();
  }
  let h = hour % 12;
  if (period === "PM") h += 12;
  d.setHours(h, minute, 0, 0);
  return d;
};
import { useTranslation } from "react-i18next";
import { translateIfKnown } from "@components/WrapTranslate";

/**
 * Manual time entry for the legacy picker (opt-in: manualEntry). Accepts "9:30 AM", "09:30 pm",
 * "9:30P", "9.30 AM", "14:45" and returns a Date, or null when the text is not a valid time.
 * Without AM/PM, an hour 13-23 is read as 24-hour time; an hour 1-12 keeps the AM/PM of the
 * time already in the box. Hour 0 is only accepted as 24-hour time (00:00 - 00:59).
 */
export const parseManualTime = (text, current) => {
  const m = String(text ?? "")
    .trim()
    .match(/^(d{1,2})s*[:.]s*(d{1,2})s*([AaPp])?.?s*([Mm])?.?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const suffix = m[3] ? m[3].toUpperCase() : "";
  if (m[4] && !suffix) return null;
  if (minute > 59) return null;

  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (suffix === "P" ? 12 : 0);
  } else if (hour > 23) {
    return null;
  } else if (hour >= 1 && hour <= 12) {
    const isPm = current instanceof Date && !Number.isNaN(current.getTime()) && current.getHours() >= 12;
    hour = (hour % 12) + (isPm ? 12 : 0);
  }
  const base = current instanceof Date && !Number.isNaN(current.getTime()) ? new Date(current) : new Date();
  base.setHours(hour, minute, 0, 0);
  return base;
};

const TimePicker = (props) => {
  const [t] = useTranslation();
  const {
    respclass,
    placeholderName,
    value,
    handleChange,
    name,
    lable,
    id,
    className,
    disable,
    removeFormControl,
    // Opt-in: a "Now" button that fills in the current time. Off by default,
    // so every existing page keeps the picker it had.
    showNow = false,
    manualEntry,
  } = props;

  const { isModern } = useContext(DesignContext);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("hour");
  const [typing, setTyping] = useState(null); // raw text while user types; null = show committed value
  const wrapperRef = useRef(null);
  const faceRef = useRef(null);

  const committed = partsFromValue(value);
  const [draft, setDraft] = useState(committed || { hour: 12, minute: 0, period: "AM" });

  // keep internal draft in sync with the controlled value
  useEffect(() => {
    const p = partsFromValue(value);
    if (p) setDraft(p);
  }, [value]);

  // close when clicking outside
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setMode("hour");
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // fire the same event shape PrimeReact Calendar produced: e.value & e.target.value are Dates
  const emit = (next) => {
    setDraft(next);
    const date = valueFromParts(value, next);
    handleChange?.({
      originalEvent: null,
      value: date,
      target: { name, id, value: date },
    });
  };

  // parse + commit typed text (Enter / blur / before opening); revert to last valid on bad input
  const commitTyping = () => {
    if (typing === null) return;
    const parsed = parseTimeText(typing);
    if (parsed) emit(parsed);
    setTyping(null);
  };

  const openPicker = () => {
    if (disable) return;
    commitTyping();
    setMode("hour");
    setOpen((o) => !o);
  };

  // user typing in the input
  const onInputChange = (e) => setTyping(e.target.value);

  // keyboard select on a focused number
  const handleNumberClick = (num) => {
    if (mode === "hour") {
      emit({ ...draft, hour: num });
      setMode("minute");
    } else {
      emit({ ...draft, minute: num });
    }
  };

  // pointer position on the face -> value (allows any minute, smooth drag)
  const selectAtPointer = (clientX, clientY, activeMode) => {
    if (!faceRef.current) return;
    const rect = faceRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = Math.atan2(clientX - cx, cy - clientY) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    if (activeMode === "hour") {
      let h = Math.round(deg / 30) % 12;
      if (h === 0) h = 12;
      emit({ ...draft, hour: h });
    } else {
      const m = Math.round(deg / 6) % 60;
      emit({ ...draft, minute: m });
    }
  };

  // drag anywhere on the dial (mouse + touch via pointer events)
  const onFacePointerDown = (e) => {
    e.preventDefault();
    const startMode = mode;
    const face = faceRef.current;
    face?.setPointerCapture?.(e.pointerId);
    selectAtPointer(e.clientX, e.clientY, startMode);
    const onMove = (ev) => selectAtPointer(ev.clientX, ev.clientY, startMode);
    const onUp = () => {
      face?.removeEventListener("pointermove", onMove);
      face?.removeEventListener("pointerup", onUp);
      face?.removeEventListener("pointercancel", onUp);
      if (startMode === "hour") setMode("minute");
    };
    face?.addEventListener("pointermove", onMove);
    face?.addEventListener("pointerup", onUp);
    face?.addEventListener("pointercancel", onUp);
  };

  const setPeriod = (period) => emit({ ...draft, period });

  // The current time, on the date the value already carries (valueFromParts).
  const pickNow = () => {
    const p = partsFromValue(new Date());
    if (p) emit(p);
    setTyping(null);
    setOpen(false);
    setMode("hour");
  };

  const displayText = committed
    ? `${pad(committed.hour)}:${pad(committed.minute)} ${committed.period}`
    : "";

  // dial geometry (must match .mtp-face / .mtp-center in ModernTimePicker.css)
  const R = 66;
  const C = 84;
  const numbers =
    mode === "hour"
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: 60 }, (_, i) => i);

  const needleAngle = mode === "hour" ? draft.hour * 30 : draft.minute * 6;

  const show = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? moment(d).format("hh:mm A") : "");

  // Legacy view, manualEntry: typed text is checked when the box loses focus or Enter is pressed
  // (before PrimeReact puts its own text back). Valid -> sent through handleChange like a pick;
  // invalid -> a message and the last valid time stays.
  const commitTyped = (input) => {
    if (!manualEntry || !input || input.tagName !== "INPUT") return;
    const text = input.value;
    const current = value instanceof Date ? value : value ? new Date(value) : null;
    if (!text.trim()) {
      input.value = show(current);
      return;
    }
    const parsed = parseManualTime(text, current);
    if (!parsed) {
      notify(
        `Invalid ${lable || placeholderName || "time"}. Enter the time like 09:30 AM (hh:mm AM/PM) or 14:45.`,
        "error"
      );
      input.value = show(current);
      return;
    }
    input.value = show(parsed);
    if (!current || show(current) !== show(parsed)) {
      handleChange?.({ value: parsed, target: { name, value: parsed } });
    }
  };

  // Legacy (non-modern) view: keep the original PrimeReact Calendar time picker.
  if (!isModern) {
    return (
      <div
        className={respclass}
        style={{
          position: "relative",
          marginBottom: removeFormControl ? "" : "4px",
        }}
        onBlurCapture={manualEntry ? (e) => commitTyped(e.target) : undefined}
        onKeyDownCapture={
          manualEntry
            ? (e) => {
                if (e.key === "Enter" && e.target.tagName === "INPUT") {
                  e.preventDefault();
                  commitTyped(e.target);
                }
              }
            : undefined
        }
      >
        <Calendar
          id="calendar-timeonly"
          style={{ width: "100%" }}
          wrapperclassname="datepicker"
          className={className}
          value={value}
          onChange={handleChange}
          timeOnly
          showTime
          inputMode="text"
          hourFormat="12"
          placeholder={placeholderName}
          disabled={disable}
          name={name}
          autoHide={true}
          // Legacy view: PrimeReact's own button bar, whose Today sets the
          // current time on a time-only calendar.
          showButtonBar={showNow}
        />
        {lable && (
          <label
            htmlFor={id}
            className="label lable truncate time_Lable"
            style={{ fontSize: "5px !important" }}
          >
            {translateIfKnown(t, lable)}
          </label>
        )}
      </div>
    );
  }

  // Modern view: custom clock-dial picker.
  return (
    <div
      className={`mtp-wrapper ${respclass || ""}`}
      ref={wrapperRef}
      style={{
        position: "relative",
        marginBottom: removeFormControl ? "" : "4px",
      }}
    >
      <div className={`mtp-field ${disable ? "mtp-disabled" : ""}`}>
        <input
          id={id}
          name={name}
          className={`form-control mtp-input ${className || ""}`}
          value={typing !== null ? typing : displayText}
          placeholder={placeholderName}
          onChange={onInputChange}
          onBlur={commitTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitTyping();
              setOpen(false);
            }
          }}
          disabled={disable}
          autoComplete="off"
        />
        <i
          className="pi pi-clock mtp-clock-icon"
          aria-hidden="true"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openPicker}
        />
        {lable && (
          <label
            htmlFor={id}
            className="label lable truncate time_Lable"
            style={{ fontSize: "5px !important" }}
          >
            {lable}
          </label>
        )}
      </div>

      {open && !disable && (
        <div className="mtp-popup" role="dialog" aria-label="Select time">
          <div className="mtp-header">
            <div className="mtp-display">
              <i className="pi pi-clock mtp-clock-glyph" aria-hidden="true" />
              <span
                className={`mtp-seg ${mode === "hour" ? "mtp-seg-active" : ""}`}
                onClick={() => setMode("hour")}
              >
                {pad(draft.hour)}
              </span>
              <span className="mtp-colon">:</span>
              <span
                className={`mtp-seg ${mode === "minute" ? "mtp-seg-active" : ""}`}
                onClick={() => setMode("minute")}
              >
                {pad(draft.minute)}
              </span>
            </div>
            <div className={`mtp-switch ${draft.period === "PM" ? "is-pm" : "is-am"}`}>
              <span className="mtp-switch-thumb" />
              <button
                type="button"
                className={draft.period === "AM" ? "mtp-sw-active" : ""}
                onClick={() => setPeriod("AM")}
              >
                AM
              </button>
              <button
                type="button"
                className={draft.period === "PM" ? "mtp-sw-active" : ""}
                onClick={() => setPeriod("PM")}
              >
                PM
              </button>
            </div>
          </div>

          <div
            className="mtp-face"
            ref={faceRef}
            onPointerDown={onFacePointerDown}
            style={{ touchAction: "none" }}
          >
            <div
              className="mtp-needle"
              style={{ transform: `rotate(${needleAngle}deg)` }}
            />
            <div className="mtp-center" />

            {numbers.map((num) => {
              const angle = (mode === "hour" ? num * 30 : num * 6) * (Math.PI / 180);
              const x = C + R * Math.sin(angle);
              const y = C - R * Math.cos(angle);
              const isActive =
                mode === "hour" ? num === draft.hour : num === draft.minute;
              // 5-step marks (and all hours) show a number; in-between minutes are small dots
              const isMajor = mode === "hour" || num % 5 === 0;

              if (!isMajor) {
                return (
                  <span
                    key={num}
                    className={`mtp-dot ${isActive ? "mtp-dot-active" : ""}`}
                    style={{ left: `${x}px`, top: `${y}px` }}
                  />
                );
              }
              return (
                <span
                  key={num}
                  className={`mtp-num ${isActive ? "mtp-num-active" : ""}`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleNumberClick(num);
                  }}
                >
                  {mode === "hour" ? num : pad(num)}
                </span>
              );
            })}
          </div>

          <div className="mtp-actions">
            {showNow ? (
              <button type="button" className="mtp-btn-now" onClick={pickNow} title="Use the current time">
                <i className="pi pi-history" aria-hidden="true" /> Now
              </button>
            ) : null}
            <button
              type="button"
              className="mtp-btn-primary"
              onClick={() => {
                setOpen(false);
                setMode("hour");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
