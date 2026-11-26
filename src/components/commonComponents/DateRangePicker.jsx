import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { DesignContext } from "@app/providers/DesignProvider";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isWithinInterval, isSameMonth, startOfDay, startOfWeek, subDays, addYears, subYears } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { notify } from "../../utils/ustil2";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { useTranslation } from "react-i18next";

export default function CustomDateRangePicker({
  startDate: propStart = null,
  endDate: propEnd = null,
  months = 2,
  dateFormat = "dd/MMM/yyyy",
  placeholder = "",
  label = "Date Range",
  disableField = false,
  disableRange = false,
  minDate = startOfDay(new Date(1947, 0, 1)),
  maxDate = new Date(),
  open: controlledOpen,
  currentMonth: controlledMonth,
  onChange,
  onOpenChange,
  labelKey,
  presets = [],
  name = "",
  id,
  respClass,
  isShowFullDate = false,
  allowSingleDate = true,
  ...rest
}) {
  const [t] = useTranslation();
  const [openState, setOpenState] = useState(false);
  const appFontSize = useLocalStorage("appFontSize", "get");
  const open = controlledOpen !== undefined ? controlledOpen : openState;
console.log("asdasdasdsadas",propStart,propEnd)
  const [monthState, setMonthState] = useState(
    startOfMonth(propStart || new Date())
  );
  const currentMonth =
    controlledMonth !== undefined ? controlledMonth : monthState;

    const { isModern } = useContext(DesignContext);
  const [view, setView] = useState("day"); // 'day','month','year'
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const inputRef = useRef(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [singleMode, setSingleMode] = useState(false); // pick one day → from = to
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!propStart) {
      setInputValue("");
      return;
    }
    const startStr = format(propStart, dateFormat);
    // collapse to a single date when from === to (single-date selection)
    const isSingle = !propEnd || isSameDay(propStart, propEnd);
    setInputValue(isSingle ? startStr : `${startStr} to ${format(propEnd, dateFormat)}`);
  }, [propStart, propEnd, dateFormat]);

  useEffect(() => {
    const handler = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        if (controlledOpen === undefined) setOpenState(false);
        onOpenChange?.(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, controlledOpen, onOpenChange]);

  const toggleOpen = useCallback(() => {
    if (disableField) return;
    const newOpen = !open;
    if (controlledOpen === undefined) setOpenState(newOpen);
    onOpenChange?.(newOpen);
  }, [open, disableField, controlledOpen, onOpenChange]);


  const handleDayClick = useCallback(
    (day) => {
      if (disableField || disableRange || day < minDate || day > maxDate) return;

      // Single-date mode: one click picks just that day (from = to), then close.
      if (singleMode) {
        const ev = {
          target: {
            name: name || labelKey || id,
            value: { startDate: day, endDate: day },
          },
        };
        onChange?.(ev);
        if (controlledOpen === undefined) setOpenState(false);
        onOpenChange?.(false);
        return;
      }

      let newStart = propStart;
      let newEnd = propEnd;

      if (!propStart) {
        newStart = day;
        newEnd = null;
      } else if (propStart && propEnd) {
        newStart = day;
        newEnd = null;
      } else if (propStart && !propEnd) {
        if (isSameDay(day, propStart)) {
          newStart = null;
          newEnd = null;
        } else {
          newStart = day < propStart ? day : propStart;
          newEnd = day < propStart ? propStart : day;
        }
      }

      const fakeEvent = {
        target: {
          name: name || labelKey || id,
          value: { startDate: newStart, endDate: newEnd ?? undefined },
        },
      };
      onChange?.(fakeEvent);

      if (newEnd) {
        if (controlledOpen === undefined) setOpenState(false);
        onOpenChange?.(false);
      }
    },
    [
      propStart,
      propEnd,
      disableField,
      disableRange,
      minDate,
      maxDate,
      onChange,
      name,
      labelKey,
      id,
      controlledOpen,
      onOpenChange,
      singleMode,
    ]
  );

  const getPreviewEnd = () => (propStart && !propEnd ? hoverDate : null);
  const isInRange = (day) => {
    const start = propStart;
    const end = propEnd ?? getPreviewEnd();
    if (!start || !end) return false;
    const [s, e] = start < end ? [start, end] : [end, start];
    return isWithinInterval(day, { start: s, end: e }) && !isSameDay(day, s) && !isSameDay(day, e);
  };
  const isStart = (day) => propStart && isSameDay(day, propStart);
  const isEnd = (day) => propEnd && isSameDay(day, propEnd);


  const effectiveMonths = view === "day" ? (isMobile ? 1 : months) : 1;
  const monthArray = Array.from({ length: effectiveMonths }, (_, i) =>
    addMonths(currentMonth, i)
  );

  const handleMonthChange = useCallback(
    (e, direction) => {
      e.preventDefault();
      const next = direction === "next";
      let newMonth;
      if (view === "day") newMonth = (next ? addMonths : subMonths)(currentMonth, 1);
      else if (view === "month") newMonth = (next ? addYears : subYears)(currentMonth, 1);
      else newMonth = (next ? addYears : subYears)(currentMonth, 10);
      if (controlledMonth === undefined) setMonthState(newMonth);
    },
    [view, currentMonth, controlledMonth]
  );

  const handleHeaderClick = useCallback(() => {
    if (view === "day") setView("month");
    else if (view === "month") setView("year");
  }, [view]);

  const getTitle = (monthDate, view) => {
    if (view === "day") return format(monthDate, "MMMM yyyy");
    if (view === "month") return format(monthDate, "yyyy");
    const y = monthDate.getFullYear();
    const decade = Math.floor(y / 10) * 10;
    return `${decade} - ${decade + 9}`;
  };


  const today = startOfDay(new Date());
  const defaultPresets = [
    { label: t("Week to date"), getRange: () => ({ start: startOfWeek(today, { weekStartsOn: 0 }), end: today }) },
    { label: t("Month to date"), getRange: () => ({ start: startOfMonth(today), end: today }) },
    { label: t("Last 7 days"), getRange: () => ({ start: subDays(today, 6), end: today }) },
    { label: t("Last 14 days"), getRange: () => ({ start: subDays(today, 13), end: today }) },
    { label: t("Last 30 days"), getRange: () => ({ start: subDays(today, 29), end: today }) },
  ];

  const activePresets = presets.length ? presets : defaultPresets;
  const showPresetPanel = activePresets.length > 0;

  const isDateAllowed = (date) => date >= minDate && date <= maxDate;

  const handlePresetClick = (preset) => {
    setSingleMode(false); // preset = range selection, clears single-date mode
    const { start, end } = preset.getRange(propStart);
    if ((start && !isDateAllowed(start)) || (end && !isDateAllowed(end))) {
      notify(t("Can't Select preset contains disabled dates"), "warn")
      return;
    }

    const fakeEvent = {
      target: { name: name || labelKey || id, value: { startDate: start, endDate: end } },
    };
    onChange?.(fakeEvent);
    if (controlledOpen === undefined) setOpenState(false);
    onOpenChange?.(false);
  };

  const isPresetActive = (preset) => {
    if (singleMode) return false; // single-date mode active → no preset highlighted (mutually exclusive)
    if (!propStart || !propEnd) return false;
    const { start: s, end: e } = preset.getRange(propStart);
    return isSameDay(propStart, s) && isSameDay(propEnd, e);
  };

  const toggleSingleMode = () => {
    const next = !singleMode;
    // Enabling single mode: collapse any existing range to one day (keep start)
    // so the calendar shows a single selected date, not the old start→end range.
    if (next && propStart && propEnd && !isSameDay(propStart, propEnd)) {
      onChange?.({
        target: {
          name: name || labelKey || id,
          value: { startDate: propStart, endDate: propStart },
        },
      });
    }
    setSingleMode(next);
  };
  const updatePopupPosition = useCallback(() => {
    if (!open || !containerRef.current || !popupRef.current) return;
    const container = containerRef.current;
    const popup = popupRef.current;
    const rect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    popup.style.left = "";
    popup.style.right = "";
    popup.style.top = "";
    popup.style.bottom = "";
    popup.style.transform = "";

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const popupHeight = popup.offsetHeight;
    const popupWidth = popup.offsetWidth;

    if (spaceBelow >= popupHeight + 10) {
      popup.style.top = `${rect.bottom + 4}px`;
    } else if (spaceAbove >= popupHeight + 10) {
      popup.style.bottom = `${viewportHeight - rect.top + 4}px`;
    } else {
      popup.style.top = `${rect.bottom + 4}px`;
    }

    if (isMobile) {
      popup.style.left = "8px";
      popup.style.right = "8px";
      popup.style.maxWidth = "calc(100vw - 16px)";
    } else {
      const left = rect.left;
      if (left + popupWidth > viewportWidth) {
        popup.style.right = `${viewportWidth - rect.right}px`;
      } else {
        popup.style.left = `${left}px`;
      }
    }
  }, [open, isMobile]);

  useEffect(() => {
    if (open) {
      updatePopupPosition();
      const onResize = () => updatePopupPosition();
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize, true);
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onResize, true);
      };
    }
  }, [open, updatePopupPosition]);

  return (
    <div className={`cds-date-picker-container ${respClass}`} ref={containerRef}>
      <style>{`
        .cds-date-picker-container { position: relative; width: 100%; }
        .cds-input-wrapper { display: flex; flex-direction: column; gap: 4px; }
        .cds-input-field {
          position: relative; display: flex; align-items: center; background:#fff;
          border:1px solid #ced4da; border-radius:4px; padding:0 0 0 12px;
          cursor:pointer; transition:all .2s; box-shadow:0 1px 3px rgba(0,0,0,.05);
        }
        .cds-input-field:hover { box-shadow:0 2px 8px rgba(0,102,204,.15); }
        .cds-input-field.cds-disabled { cursor:not-allowed; opacity:.6; background:#f9f9f9; }
        .cds-label {
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          font-size:1.17rem; color:#000; pointer-events:none; transition:all .2s;
          font-weight:500 !important; background:transparent;
        }
        .cds-label-active {
          top:0.17rem; left:10px; font-size:10px; background:#fff; color:#212529;
          padding:0 4px; font-weight:600!important; border-radius:8px;font-size:0.75rem !important;
        }
        .cds-input-value {
          flex:1; font-size:1rem; font-weight:500; color:#333;
          border:none; outline:none; background:transparent;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          pointer-events:none;
          height:2.1rem;
        }
        .cds-calendar-trigger {
           align-items:center; justify-content:center;
           position:absolute; right:0;
          width:30px; height:2rem; background:#e6f7ff; border-radius:0 2px 2px 0;
          color:#0066cc; font-size:1.17rem; margin-left:8px; transition:background .2s;
        }
        .cds-input-field:hover .cds-calendar-trigger,
        .cds-input-field.cds-focused .cds-calendar-trigger { background:#bae7ff; }
        .cds-input-field.cds-disabled .cds-calendar-trigger { background:#f0f0f0; color:#999; }

        /* POPUP – always inside viewport */
        .cds-calendar-popup {
          position:fixed; z-index:10000; background:#fff;
          border:1px solid #ced4da; border-radius:12px;
          box-shadow:0 8px 24px rgba(0,0,0,.12);
          padding:12px; max-height:90vh; overflow-y:auto;
        }

        /* Mobile – presets on top */
        @media (max-width:768px) {
          .cds-preset-panel-mobile {
            display:flex; gap:8px; overflow-x:auto; margin-bottom:12px;
            padding-bottom:4px; scrollbar-width:thin;
          }
          .cds-preset-item-mobile {
            white-space:nowrap; padding:6px 12px; font-size:13px;
            border-radius:6px; cursor:pointer; transition:all .2s;
          }
          .cds-preset-item-mobile:hover { background:#f0f0f0; }
          .cds-preset-item-mobile.active { background:#e6f3ff; color:#0066cc; font-weight:600; }
        }

        /* Desktop – presets on left */
        @media (min-width:769px) {
          .cds-calendar-popup { display:flex; gap:16px; min-width:735px; }
          .cds-preset-panel { width:140px; }
          .cds-calendar-container { flex:1; display:flex; gap:24px; }
        }

        .cds-preset-item { margin-bottom:4px; padding:6px 8px; border-radius:6px;
          font-size:13px; cursor:pointer; transition:all .2s; }
        .cds-preset-item:hover { background:#f0f0f0; }
        .cds-preset-item.active { background:#e6f3ff; color:#0066cc; font-weight:600; }

        .cds-calendar-month { flex:1; min-width:260px; }
        .cds-month-header { display:flex; align-items:center; justify-content:space-between;
          margin-bottom:12px; padding:0 4px; }
        .cds-month-title {
          font-size:1.17rem; font-weight:600; color:#333; text-align:center; flex:1;
          background:none; border:none; cursor:pointer; display:flex;
          align-items:center; justify-content:center; border-radius:6px;
          padding:4px 8px; transition:all .2s;
        }
        .cds-nav-btn {
          background:none; border:none; width:32px; height:32px;
          display:flex; align-items:center; justify-content:center;
          border-radius:6px; cursor:pointer; color:#000; font-size:12px;
          transition:all .2s;
        }
        .cds-nav-btn:hover:not(:disabled) { background:#f0f0f0; color:#333; }
        .cds-nav-btn:disabled { opacity:.3; cursor:not-allowed; }

        .cds-weekdays { display:grid; grid-template-columns:repeat(7,1fr); gap:2px;
          margin-bottom:8px; font-size:11px; font-weight:600; color:#999; text-align:center; }
        .cds-weekday { padding:4px 0; }
        .cds-days-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
        .cds-day { height:32px; display:flex; align-items:center; justify-content:center; }
        .cds-day-btn {
          width:32px; height:32px; border:none; border-radius:50%; background:transparent;
          color:#000; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s;
          display:flex; align-items:center; justify-content:center;
        }
        .cds-day-btn:hover:not(.cds-disabled):not(.cds-selected) { background:#e6f3ff; color:#0066cc; }
        .cds-day-btn.cds-other-month { opacity:.3; color:#ccc; }
        .cds-day-btn.cds-disabled { opacity:.3; cursor:not-allowed; }
        .cds-day-btn.cds-selected { background:#0066cc; color:#fff; font-weight:600; border-radius:50%; }
        .cds-day-btn.cds-in-range { background:#f0f8ff !important; color:#0066cc !important; }
        .cds-day-btn.cds-preview-range { background:#e6f3ff !important; color:#0066cc !important; }

        .cds-months-list,.cds-years-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        .cds-month-item,.cds-year-item {
          padding:4px 12px; border:none; background:transparent; cursor:pointer;
          border-radius:6px; font-size:1.17rem; transition:all .2s; margin:auto;
        }
        .cds-month-item:hover:not(.cds-disabled),
        .cds-year-item:hover:not(.cds-disabled) { background:#f0f0f0; }
        .cds-month-item.active,.cds-year-item.active { background:#e6f3ff; color:#0066cc; font-weight:600; }
        .cds-month-item.cds-disabled,.cds-year-item.cds-disabled { opacity:.3; cursor:not-allowed; }

        /* ===================================================================
           MODERN DESIGN — compact look + DARK-MODE theming.
           Scoped to [data-design="modern"] → legacy view is fully untouched.
           Dark rules pull --ds-color-* tokens (same as modern-skin/dark.css).
           =================================================================== */
        :root[data-design="modern"] .cds-input-field { border-radius:6px; padding-left:10px; box-shadow:none; }
        :root[data-design="modern"] .cds-input-value { height:1.9rem; font-size:.85rem; }
        :root[data-design="modern"] .cds-label { font-size:.85rem; }
        /* active label sits as a notch ON the top border — cancel the base
           translateY(-50%) (else top compounds and the label floats detached above) */
        :root[data-design="modern"] .cds-label.cds-label-active {
          font-size:.68rem !important; top:-.5rem; left:8px; padding:0 4px; transform:none;
        }
        :root[data-design="modern"] .cds-calendar-trigger { height:1.9rem; }
        :root[data-design="modern"] .cds-calendar-popup {
          border-radius:10px; padding:10px;
          transform-origin:top center;
          animation:cds-pop-in .16s cubic-bezier(.16,1,.3,1);
        }
        @keyframes cds-pop-in {
          from { opacity:0; transform:translateY(-6px) scale(.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce){
          :root[data-design="modern"] .cds-calendar-popup { animation:none; }
        }
        @media (min-width:769px){ :root[data-design="modern"] .cds-calendar-popup { min-width:680px; gap:12px; } }

        /* ---- DARK ---- */
        :root[data-design="modern"][data-theme="dark"] .cds-input-field {
          background: var(--ds-color-input-bg,#0F172A) !important;
          border:1px solid #3A4A63 !important; box-shadow:none !important;
        }
        :root[data-design="modern"][data-theme="dark"] .cds-input-field:hover {
          box-shadow:0 0 0 1px var(--ds-color-accent-soft,rgba(45,212,191,.18)) !important;
        }
        /* inner readOnly input: dark.css global input rule (border #3A4A63) draws a
           SECOND border inside the field. Its :not([type]) chain has specificity
           (0,7,1) — outrank it with the full ancestor path + [readonly] (0,8,1). */
        :root[data-design="modern"][data-theme="dark"] .cds-date-picker-container .cds-input-wrapper .cds-input-field input.cds-input-value[readonly] {
          background:transparent !important; border:none !important; box-shadow:none !important;
          color: var(--ds-color-text,#E2E8F0) !important;
        }
        /* floating label: kill the white pill, use panel + readable text */
        :root[data-design="modern"][data-theme="dark"] .cds-label { color: var(--ds-color-text-muted,#94A3B8) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-label.cds-label-active {
          background: var(--ds-color-panel,#111827) !important; color: var(--ds-color-text,#E2E8F0) !important;
        }
        :root[data-design="modern"][data-theme="dark"] .cds-calendar-trigger {
          background: var(--ds-color-accent-soft,rgba(45,212,191,.14)) !important;
          color: var(--ds-color-accent,#2DD4BF) !important;
        }
        /* opened calendar popup */
        :root[data-design="modern"][data-theme="dark"] .cds-calendar-popup {
          background: var(--ds-color-panel,#111827) !important;
          border:1px solid var(--ds-color-border,#1E293B) !important;
          color: var(--ds-color-text,#E2E8F0) !important;
          box-shadow:0 12px 32px rgba(0,0,0,.5) !important;
        }
        :root[data-design="modern"][data-theme="dark"] .cds-preset-item,
        :root[data-design="modern"][data-theme="dark"] .cds-preset-item-mobile { color: var(--ds-color-text,#E2E8F0) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-preset-item:hover,
        :root[data-design="modern"][data-theme="dark"] .cds-preset-item-mobile:hover { background: var(--ds-color-accent-soft,rgba(45,212,191,.12)) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-preset-item.active,
        :root[data-design="modern"][data-theme="dark"] .cds-preset-item-mobile.active {
          background: var(--ds-color-accent-soft,rgba(45,212,191,.16)) !important; color: var(--ds-color-accent,#2DD4BF) !important;
        }
        :root[data-design="modern"][data-theme="dark"] .cds-preset-item.border-bottom { border-color: var(--ds-color-border,#1E293B) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-month-title { color: var(--ds-color-text,#E2E8F0) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-month-title:hover { background: var(--ds-color-accent-soft,rgba(45,212,191,.12)) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-nav-btn { color: var(--ds-color-text,#E2E8F0) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-nav-btn:hover:not(:disabled) { background: var(--ds-color-accent-soft,rgba(45,212,191,.12)) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-weekdays { color: var(--ds-color-text-muted,#94A3B8) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-day-btn { color: var(--ds-color-text,#E2E8F0) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-day-btn.cds-other-month { color: var(--ds-color-text-muted,#94A3B8) !important; opacity:.45; }
        :root[data-design="modern"][data-theme="dark"] .cds-day-btn:hover:not(.cds-disabled):not(.cds-selected) {
          background: var(--ds-color-accent-soft,rgba(45,212,191,.14)) !important; color: var(--ds-color-accent,#2DD4BF) !important;
        }
        :root[data-design="modern"][data-theme="dark"] .cds-day-btn.cds-in-range,
        :root[data-design="modern"][data-theme="dark"] .cds-day-btn.cds-preview-range {
          background: var(--ds-color-accent-soft,rgba(45,212,191,.12)) !important; color: var(--ds-color-accent,#2DD4BF) !important;
        }
        :root[data-design="modern"][data-theme="dark"] .cds-day-btn.cds-selected { background: var(--ds-color-accent,#2DD4BF) !important; color:#06281F !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-month-item,
        :root[data-design="modern"][data-theme="dark"] .cds-year-item { color: var(--ds-color-text,#E2E8F0) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-month-item:hover:not(.cds-disabled),
        :root[data-design="modern"][data-theme="dark"] .cds-year-item:hover:not(.cds-disabled) { background: var(--ds-color-accent-soft,rgba(45,212,191,.12)) !important; }
        :root[data-design="modern"][data-theme="dark"] .cds-month-item.active,
        :root[data-design="modern"][data-theme="dark"] .cds-year-item.active {
          background: var(--ds-color-accent-soft,rgba(45,212,191,.16)) !important; color: var(--ds-color-accent,#2DD4BF) !important;
        }
      `}</style>

      {/* INPUT */}
      <div className="cds-input-wrapper mb-2">
        <div
          className={`cds-input-field ${isModern ? "cds-input-field-new" : ""} ${disableField ? "cds-disabled" : ""} ${open ? "cds-focused" : ""}`}
          onClick={toggleOpen}
        >
          <label
            htmlFor={labelKey || id}
            className={`cds-label truncate ${open || inputValue ? "cds-label-active" : ""}`}
          >
            {label}
          </label>

          <input
            ref={inputRef}
            id={labelKey || id}
            name={name}
            type="text"
            className="cds-input-value"
            value={isShowFullDate ? inputValue : inputValue.slice(0, 20) + "..."}
            placeholder={placeholder}
            disabled={disableField}
            readOnly
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
            {...rest}
          />
          <div className={`cds-calendar-trigger ${isModern ? "cds-calendar-trigger-new" : ""} background-theme-color theme-color`} onClick={toggleOpen}>
            <i className="fa fa-calendar ml-2" aria-hidden="true"></i>
          </div>
        </div>
      </div>

      {open && !disableField && (
        <div className="cds-calendar-popup" ref={popupRef}>
          {isMobile && (showPresetPanel || allowSingleDate) && (
            <div className="cds-preset-panel-mobile">
              {allowSingleDate && (
                <div
                  className={`cds-preset-item-mobile ${singleMode ? "background-theme-color theme-color active" : ""}`}
                  onClick={toggleSingleMode}
                  title="Pick one day (from = to)"
                >
                  {singleMode ? "✓ Single date" : "Single date"}
                </div>
              )}
              {activePresets.map((p, i) => (
                <div
                  key={i}
                  className={`cds-preset-item-mobile ${isPresetActive(p) ? "background-theme-color theme-color active" : ""}`}
                  onClick={() => handlePresetClick(p)}
                >
                  {p.label}
                </div>
              ))}
            </div>
          )}

          {!isMobile && (showPresetPanel || allowSingleDate) && (
            <div className="cds-preset-panel">
              {allowSingleDate && (
                <div
                  className={`cds-preset-item border-bottom ${singleMode ? "background-theme-color theme-color active" : ""}`}
                  onClick={toggleSingleMode}
                  style={{ fontWeight: 600 }}
                  title="Pick one day (from = to)"
                >
                  {singleMode ? "✓ Single date" : "Single date"}
                </div>
              )}
              {activePresets.map((p, i) => (
                <div
                  key={i}
                  className={`cds-preset-item border-bottom ${isPresetActive(p) ? "background-theme-color theme-color active" : ""}`}
                  onClick={() => handlePresetClick(p)}
                >
                  {p.label}
                </div>
              ))}
            </div>
          )}

          <div className={isMobile ? "" : "cds-calendar-container"}>
            {monthArray.map((month, idx) => {
              const days = eachDayOfInterval({
                start: startOfMonth(month),
                end: endOfMonth(month),
              });
              const blanks = Array(days[0].getDay()).fill(null);
              const year = month.getFullYear();
              const decade = Math.floor(year / 10) * 10;

              return (
                <div className="cds-calendar-month" key={idx}>
                  <div className="cds-month-header">
                    <button
                      className="cds-nav-btn background-theme-color theme-color"
                      onClick={(e) => handleMonthChange(e, "prev")}
                      style={{ display: idx !== 0 ? "none" : "inline-flex" }}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span
                      className="cds-month-title"
                      onClick={handleHeaderClick}
                      style={{ cursor: view === "year" ? "default" : "pointer" }}
                    >
                      {getTitle(month, view)}
                      {view !== "year" && <ChevronDown size={16} style={{ marginLeft: 4 }} />}
                    </span>

                    <button
                      className="cds-nav-btn background-theme-color theme-color"
                      onClick={(e) => handleMonthChange(e, "next")}
                      style={{ display: idx !== monthArray.length - 1 ? "none" : "inline-flex" }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {view === "day" ? (
                    <>
                      <div className="cds-weekdays">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div key={d} className="cds-weekday">{t(d)}</div>
                        ))}
                      </div>

                      <div className="cds-days-grid">
                        {blanks.map((_, i) => (
                          <div key={`blank-${i}`} className="cds-day cds-empty" />
                        ))}
                        {days.map((day) => {
                          const disabled = day < minDate || day > maxDate;
                          const otherMonth = !isSameMonth(day, month);
                          const selected = isStart(day) || isEnd(day);
                          const inRange = isInRange(day);
                          const preview = !propEnd && propStart && hoverDate && isInRange(day);

                          return (
                            <div key={day.toISOString()} className="cds-day">
                              <span
                                className={`
                                  cds-day-btn
                                  ${selected ? "cds-selected background-theme-color" : ""}
                                  ${inRange ? "cds-in-range" : ""}
                                  ${preview ? "cds-preview-range" : ""}
                                  ${disabled ? "cds-disabled" : ""}
                                  ${otherMonth ? "cds-other-month" : ""}
                                `}
                                onClick={() => handleDayClick(day)}
                                onMouseEnter={() => setHoverDate(day)}
                                onMouseLeave={() => setHoverDate(null)}
                              >
                                {format(day, "d")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : view === "month" ? (
                    <div className="cds-months-list">
                      {Array.from({ length: 12 }, (_, m) => {
                        const md = new Date(year, m, 1);
                        const name = format(md, "MMMM");
                        const cur = m === currentMonth.getMonth();
                        const disabled = endOfMonth(md) < minDate || md > maxDate;
                        return (
                          <span
                            key={m}
                            className={`cds-month-item ${cur ? "active" : ""} ${disabled ? "cds-disabled" : ""}`}
                            onClick={() => {
                              if (!disabled) {
                                setMonthState(startOfMonth(md));
                                setView("day");
                              }
                            }}
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="cds-years-grid">
                      {Array.from({ length: 10 }, (_, i) => {
                        const y = decade + i;
                        const yd = new Date(y, 0, 1);
                        const cur = y === year;
                        const disabled = new Date(y, 11, 31) < minDate || yd > maxDate;
                        return (
                          <span
                            key={y}
                            className={`cds-year-item ${cur ? "active" : ""} ${disabled ? "cds-disabled" : ""}`}
                            onClick={() => {
                              if (!disabled) {
                                setMonthState(new Date(y, currentMonth.getMonth(), 1));
                                setView("month");
                              }
                            }}
                          >
                            {y}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}