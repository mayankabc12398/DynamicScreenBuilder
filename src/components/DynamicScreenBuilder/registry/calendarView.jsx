/**
 * The month calendar a DataTable can switch to — the Table ⇆ Calendar view of
 * the hand-coded OPD Confirmation page (OPDConfirmationTable.jsx), drawn the
 * same way: a weekday header, day tiles with the day's total and a chip per
 * status, the picked day's appointments opening under its week, and Previous /
 * Next / Today above it.
 *
 * Only the drawing lives here. The table owns the month, the picked day and
 * what a month change does (writes the range into the form, runs its event,
 * re-reads the rows), so switching to the table and back keeps the month, and
 * the same rows — ticks, edits and all — feed both views.
 *
 * Styles are inline and the colour ramp flips on the modern dark skin, exactly
 * as the page does: the two look the same because they are written the same.
 */
import React, { useMemo } from "react";
import moment from "moment";
import useIsModernDark from "@app/utils/hooks/useIsModernDark";
import { getPath, whenPasses } from "../utils/expressions";
import { tr } from "../utils/i18n";

// ── Colour ramp (the page's own tokens) ─────────────────────────────────────
const C_LIGHT = {
  teal50: "#e8f7f4", teal400: "#1aaa8c", teal600: "#0e7a65",
  blue50: "#eaf2fb", blue400: "#3b8fd9", blue600: "#1e6cb5",
  amber50: "#fff8eb", amber400: "#f5a623", amber600: "#c47d0a",
  red50: "#fff0f0", red400: "#e84040", red600: "#b52020",
  green50: "#edfaf2", green400: "#22c55e", green600: "#15803d",
  purple50: "#f3f0ff", purple400: "#8b5cf6", purple600: "#6d28d9",
  gray50: "#f8f9fa", gray100: "#f1f3f5", gray200: "#e9ecef", gray300: "#dee2e6",
  gray400: "#ced4da", gray500: "#adb5bd", gray600: "#6c757d", gray700: "#495057",
  gray800: "#343a40", gray900: "#212529",
  white: "#fff",
};
const C_DARK = {
  ...C_LIGHT,
  gray50: "#0F172A", gray100: "#1E293B", gray200: "#26344b", gray300: "#334155",
  gray400: "#475569", gray500: "#94A3B8", gray600: "#94A3B8", gray700: "#E2E8F0",
  gray800: "#F1F5F9", gray900: "#F8FAFC",
  white: "#111827",
};
const L = C_LIGHT;

/**
 * The page's statusOf(), as data: tested top to bottom, the first that holds
 * names the appointment, and the fallback is Pending. `order` is where its chip
 * sits in a day tile — the page keeps that order apart from the priority order.
 */
export const DEFAULT_CAL_STATUSES = [
  {
    label: "Canceled", order: 6, color: L.red600, tint: L.red50, bar: L.red400, icon: "fas fa-times-circle",
    when: [{ field: "IsReschedule", op: "eq", value: "1" }, { field: "IsCancel", op: "eq", value: "1" }],
  },
  { label: "ReScheduled", order: 3, color: L.blue600, tint: L.blue50, bar: L.blue400, icon: "fas fa-calendar-alt", when: [{ field: "IsReschedule", op: "eq", value: "1" }] },
  { label: "Confirmed", order: 1, color: L.green600, tint: L.green50, bar: L.green400, icon: "fas fa-check-circle", when: [{ field: "IsConform", op: "eq", value: "1" }] },
  { label: "App. Time Expired", order: 5, color: L.gray700, tint: L.gray100, bar: L.gray400, badge: L.gray500, icon: "fas fa-hourglass-end", when: [{ field: "isExpired", op: "eq", value: "1" }] },
  { label: "Canceled", order: 6, color: L.red600, tint: L.red50, bar: L.red400, icon: "fas fa-times-circle", when: [{ field: "IsCancel", op: "eq", value: "1" }] },
  { label: "UnRegistered", order: 4, color: L.teal600, tint: L.teal50, bar: L.teal400, icon: "fas fa-user", when: [{ field: "PatientID", op: "empty", value: "" }] },
  // No test: what a record is when nothing above holds.
  { label: "Pending", order: 2, color: L.amber600, tint: L.amber50, bar: L.amber400, icon: "far fa-clock" },
];
export const DEFAULT_CAL_FALLBACK = DEFAULT_CAL_STATUSES[DEFAULT_CAL_STATUSES.length - 1];

/**
 * The calendar settings a table starts with — the OPD Confirmation page's
 * appointment record. A table saved before the calendar existed (or written by
 * hand) carries none of these keys, so the table reads every one through
 * `calSettings` rather than straight off its props. An empty string is a real
 * answer ("write the start nowhere"); only a missing key falls back.
 */
export const CAL_DEFAULTS = {
  calDateField: "AppDate",
  calNoField: "AppNo",
  calNameField: "NAME",
  calTagField: "ConsultType",
  calTimeField: "AppTime",
  calDoctorField: "DoctorName",
  calGenderField: "Gender",
  calAgeField: "Age",
  calStartField: "fromDate",
  calEndField: "toDate",
  calDateFormat: "YYYY-MM-DD",
  calReload: true,
  calActionLabel: "",
  calStatuses: DEFAULT_CAL_STATUSES,
};

export function calSettings(props) {
  const out = {};
  Object.keys(CAL_DEFAULTS).forEach((k) => {
    out[k] = props?.[k] === undefined || props?.[k] === null ? CAL_DEFAULTS[k] : props[k];
  });
  if (!Array.isArray(out.calStatuses) || !out.calStatuses.length) out.calStatuses = DEFAULT_CAL_STATUSES;
  return out;
}

const hasTest = (s) => !!s && !!s.when && (Array.isArray(s.when) ? s.when.some((c) => c && c.op) : !!s.when.op);

/** The formats an appointment date arrives in, tried strictly, as the page does. */
const DATE_FORMATS = ["DD-MMM-YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "MM/DD/YYYY", moment.ISO_8601];

export function calDayKey(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const m = moment(raw, DATE_FORMATS, true);
  return m.isValid() ? m.format("YYYY-MM-DD") : null;
}

/**
 * The status a row is in: the first entry WITH a test that holds, else the
 * first entry without one (the "otherwise"), else Pending. An entry without a
 * test is never matched in passing — it would swallow every row below it.
 */
export function makeStatusOf(statuses) {
  const list = (Array.isArray(statuses) && statuses.length ? statuses : DEFAULT_CAL_STATUSES).filter((s) => s && s.label);
  const tested = list.filter(hasTest);
  const other = list.find((s) => !hasTest(s)) || DEFAULT_CAL_FALLBACK;
  return (row) => {
    const scope = { ...(row || {}), row };
    return tested.find((s) => whenPasses(s.when, scope)) || other;
  };
}

/** Status labels in chip order: `order` first, then as listed. Repeats once. */
export function chipOrderOf(statuses) {
  const list = (Array.isArray(statuses) && statuses.length ? statuses : DEFAULT_CAL_STATUSES).filter((s) => s && s.label);
  const sorted = list
    .map((s, i) => ({ s, i, o: Number(s.order) > 0 ? Number(s.order) : 1000 + i }))
    .sort((a, b) => a.o - b.o || a.i - b.i)
    .map((x) => x.s.label);
  return [...new Set(sorted)];
}

const getInitials = (name = "") => {
  const cleaned = String(name).replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|master)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "P";
};
const AVATAR_TONES = [
  { bg: L.teal50, c: L.teal600 }, { bg: L.blue50, c: L.blue600 },
  { bg: L.purple50, c: L.purple600 }, { bg: L.amber50, c: L.amber600 },
  { bg: L.green50, c: L.green600 }, { bg: L.red50, c: L.red600 },
];
const avatarTone = (s = "") => AVATAR_TONES[((s?.charCodeAt(0) || 0) + (s?.length || 0)) % AVATAR_TONES.length];
const genderMeta = (g) => {
  const v = String(g || "").trim().toLowerCase();
  if (v.startsWith("m")) return { icon: "fas fa-mars", c: L.blue600 };
  if (v.startsWith("f")) return { icon: "fas fa-venus", c: "#d6336c" };
  if (v) return { icon: "fas fa-genderless", c: L.gray500 };
  return null;
};
const pill = (c, bg) => ({
  display: "inline-block", fontSize: "11px", fontWeight: 600, color: c, background: bg,
  padding: "3px 11px", borderRadius: "20px", whiteSpace: "nowrap",
});
const text = (row, field) => {
  if (!field) return "";
  const v = getPath(row, field);
  return v === null || v === undefined || typeof v === "object" ? "" : String(v);
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * @param rows          the table's rows (merged with ticks and edits)
 * @param month         a moment inside the month on show
 * @param selectedDay   "YYYY-MM-DD"
 * @param fields        { date, no, name, tag, time, doctor, gender, age } — row keys
 * @param statusOf      row -> { label, color, tint, bar, icon, badge? }
 * @param chipOrder     status labels in the order their chips are drawn
 * @param renderActions row -> the table's own action strip for that row, or null
 * @param actionLabel   the day panel's button ("New Appointment"); empty hides it
 */
export default function CalendarView({
  rows,
  month,
  selectedDay,
  onSelectDay,
  onPrev,
  onNext,
  onToday,
  fields,
  statusOf,
  chipOrder,
  renderActions,
  actionLabel,
  onAction,
  loading,
  design,
}) {
  const C = useIsModernDark() ? C_DARK : C_LIGHT;
  const f = fields || {};

  const byDate = useMemo(() => {
    const map = {};
    (rows || []).forEach((item) => {
      const key = calDayKey(getPath(item, f.date || "AppDate"));
      if (key) (map[key] = map[key] || []).push(item);
    });
    return map;
  }, [rows, f.date]);

  const navBtn = {
    width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.gray300}`,
    background: C.white, color: C.gray700, cursor: "pointer", fontSize: 12,
  };
  const todayBtn = {
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12.5px", fontWeight: 600,
    color: C.gray700, background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 8,
    padding: "5px 12px", cursor: "pointer",
  };

  const gridStart = month.clone().startOf("month").startOf("week");
  const gridEnd = month.clone().endOf("month").endOf("week");
  const days = [];
  const d = gridStart.clone();
  while (d.isSameOrBefore(gridEnd, "day")) {
    days.push(d.clone());
    d.add(1, "day");
  }
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const today = moment();

  const renderDayCell = (day) => {
    const key = day.format("YYYY-MM-DD");
    const appts = byDate[key] || [];
    const inMonth = day.month() === month.month();
    const isToday = day.isSame(today, "day");
    const isSel = key === selectedDay;
    const counts = {};
    const metaOf = {};
    appts.forEach((a) => {
      const st = statusOf(a);
      counts[st.label] = (counts[st.label] || 0) + 1;
      metaOf[st.label] = metaOf[st.label] || st;
    });
    const has = appts.length > 0;
    const ordered = chipOrder.filter((l) => counts[l]).map((l) => [l, counts[l]]);
    // A status the order list does not name still gets its chip, after the rest.
    Object.keys(counts)
      .filter((l) => !chipOrder.includes(l))
      .forEach((l) => ordered.push([l, counts[l]]));
    return (
      <div
        key={key}
        role="button"
        tabIndex={0}
        aria-pressed={isSel}
        onClick={() => onSelectDay(key)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectDay(key)}
        onMouseEnter={(e) => {
          if (!isSel) e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.10)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isSel ? `0 0 0 2px ${C.blue400}` : "none";
          e.currentTarget.style.transform = "none";
        }}
        style={{
          minHeight: 98, borderRadius: 12, padding: 0, cursor: "pointer", overflow: "hidden",
          border: `1px solid ${isSel ? C.blue400 : has ? C.gray200 : C.gray100}`,
          background: isSel ? C.blue50 : inMonth ? C.white : C.gray50,
          boxShadow: isSel ? `0 0 0 2px ${C.blue400}` : "none",
          display: "flex", flexDirection: "column",
          opacity: inMonth ? 1 : 0.5, transition: "box-shadow .15s, transform .15s",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {has ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 21, padding: "0 8px 0 6px", borderRadius: 11, background: C.gray100, color: C.gray700, fontSize: 11.5, fontWeight: 700 }}>
                <i className="far fa-calendar-check" style={{ fontSize: 12, color: C.blue600 }} />
                {appts.length}
              </span>
            ) : (
              <span />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: "22px", color: isToday ? "#fff" : inMonth ? C.gray800 : C.gray400, background: isToday ? C.blue600 : "transparent", minWidth: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              {day.date()}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {ordered.map(([label, n]) => {
              const st = metaOf[label] || {};
              return (
                <span
                  key={label}
                  title={`${label}: ${n}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 21, padding: "0 8px", borderRadius: 11, background: st.tint || C.gray100, color: st.badge || st.color || C.gray600, fontSize: 11.5, fontWeight: 700 }}
                >
                  <i className={st.icon || "fas fa-circle"} style={{ fontSize: 13 }} />
                  {n}
                </span>
              );
            })}
          </div>
        </div>
        {/* accent underline — follows the project's selected theme */}
        {has ? <div className="background-theme-color" style={{ height: 4, width: "100%" }} /> : null}
      </div>
    );
  };

  const renderDayDetail = () => {
    const selAppts = byDate[selectedDay] || [];
    return (
      <div style={{ margin: "2px 0 10px", padding: "12px 14px", background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: C.gray800 }}>
            <i className="fas fa-calendar-day" style={{ marginInlineEnd: 8, color: C.blue600 }} />
            {moment(selectedDay).format("dddd, MMMM D, YYYY")}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={pill(C.blue600, C.blue50)}>
              {selAppts.length} {tr("Appointments")}
            </span>
            {actionLabel ? (
              <button type="button" className="btn btn-sm btn-info" onClick={() => onAction(selectedDay)}>
                <i className="fas fa-plus" /> {tr(actionLabel)}
              </button>
            ) : null}
          </div>
        </div>
        {selAppts.length === 0 ? (
          <div style={{ padding: "26px 16px", textAlign: "center", color: C.gray500, border: `1px dashed ${C.gray300}`, borderRadius: 12, background: C.white }}>
            <div style={{ fontSize: 24, opacity: 0.35, marginBottom: 6 }}>
              <i className="far fa-calendar" />
            </div>
            <div style={{ fontWeight: 500 }}>{tr("No appointments on this day")}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selAppts.map((item, i) => {
              const st = statusOf(item);
              const name = text(item, f.name);
              const no = text(item, f.no);
              const tag = text(item, f.tag);
              const time = text(item, f.time);
              const doctor = text(item, f.doctor);
              const age = text(item, f.age);
              const tone = avatarTone(name);
              const g = genderMeta(text(item, f.gender));
              const actions = renderActions ? renderActions(item) : null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.gray200}`, borderInlineStart: `4px solid ${st.bar || st.color || C.gray400}`, background: C.white }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tone.bg, color: tone.c, fontSize: 12, fontWeight: 700 }}>
                    {getInitials(name)}
                  </span>
                  <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                    <div style={{ fontWeight: 600, color: C.gray800 }}>
                      {no ? <span style={{ color: C.gray500, fontWeight: 700 }}>({no}) </span> : null}
                      {name || "-"}
                      {tag ? <span style={{ color: C.gray500, fontWeight: 500 }}> [{tag}]</span> : null}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray500, display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                      {time ? <span><i className="far fa-clock" style={{ marginInlineEnd: 4 }} />{time}</span> : null}
                      {doctor ? <span><i className="fas fa-user-md" style={{ marginInlineEnd: 4 }} />{doctor}</span> : null}
                      {g ? <span style={{ color: g.c }}><i className={g.icon} style={{ marginInlineEnd: 3 }} />{age}</span> : null}
                    </div>
                  </div>
                  <span style={pill(st.color, st.tint)}>{st.label}</span>
                  {actions ? (
                    <div data-dsb-interactive onClick={(e) => e.stopPropagation()}>
                      {actions}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dsb-calendar" data-dsb-interactive={design ? undefined : true}>
      {/* month navigation — the left half of the page's toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: `1px solid ${C.gray100}`, flexWrap: "wrap" }}>
        <button type="button" onClick={onPrev} style={navBtn} title={tr("Previous Month")} aria-label={tr("Previous Month")}>
          <i className="fas fa-chevron-left" />
        </button>
        <span style={{ fontSize: "13.5px", fontWeight: 700, color: C.gray800, minWidth: 132, textAlign: "center" }}>
          {month.format("MMMM YYYY")}
        </span>
        <button type="button" onClick={onNext} style={navBtn} title={tr("Next Month")} aria-label={tr("Next Month")}>
          <i className="fas fa-chevron-right" />
        </button>
        <button type="button" onClick={onToday} style={todayBtn}>
          {tr("Today")}
        </button>
        {loading ? <i className="fas fa-spinner fa-spin" style={{ marginInlineStart: 6, color: C.gray500 }} aria-label="Loading" /> : null}
      </div>

      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: C.gray500, padding: "4px 0" }}>
              {tr(w)}
            </div>
          ))}
        </div>
        {/* month grid — the picked day's detail opens under its week */}
        {weeks.map((week, wi) => {
          const hasSelected = week.some((day) => day.format("YYYY-MM-DD") === selectedDay);
          return (
            <React.Fragment key={wi}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
                {week.map((day) => renderDayCell(day))}
              </div>
              {hasSelected ? renderDayDetail() : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
