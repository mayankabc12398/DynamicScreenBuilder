/**
 * Day Care course patterns.
 *
 * A day care package is rarely one sitting. Dialysis runs three times a week
 * for months; chemotherapy runs in cycles; physiotherapy runs daily for a
 * fortnight. The desk knows the pattern ("Mon/Wed/Fri, twelve sittings") and
 * should say that once, not fill in twelve dates by hand and then pick twelve
 * beds.
 *
 * This module only turns a pattern into a list of DATES. It deliberately knows
 * nothing about beds, slots or the API - the booking screen does the
 * allocating, and keeping the arithmetic separate means the awkward cases
 * (month ends, a start date that is not one of the chosen weekdays) can be
 * reasoned about on their own.
 */

import moment from "moment";

/** The patterns the booking screen offers. `value` is what it stores. */
export const REPEAT_OPTIONS = [
  { label: "Does not repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Alternate days", value: "alternate" },
  { label: "Selected days of the week", value: "weekdays" },
  { label: "Weekly (same weekday)", value: "weekly" },
  { label: "Every N days", value: "everyn" },
];

/** Monday-first, matching how the unit's rota is written up. */
export const WEEKDAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

/** Common courses, so the usual case is two clicks. */
export const COURSE_PRESETS = [
  {
    label: "Dialysis · Mon/Wed/Fri · 12 sittings",
    pattern: "weekdays", weekdays: [1, 3, 5], count: 12,
  },
  {
    label: "Dialysis · Tue/Thu/Sat · 12 sittings",
    pattern: "weekdays", weekdays: [2, 4, 6], count: 12,
  },
  {
    label: "Chemotherapy · every 21 days · 6 cycles",
    pattern: "everyn", everyNDays: 21, count: 6,
  },
  {
    label: "Chemotherapy · weekly · 8 cycles",
    pattern: "weekly", count: 8,
  },
  {
    label: "Daily · 7 sittings",
    pattern: "daily", count: 7,
  },
];

/** Hard ceiling. A course longer than this is a data-entry slip, not a plan. */
export const MAX_SESSIONS = 60;

/**
 * The dates a course falls on.
 *
 * @param pattern     one of REPEAT_OPTIONS' values
 * @param startDate   the first sitting, or the day the course starts from
 * @param count       how many sittings to produce
 * @param weekdays    for "weekdays": day numbers, 0 = Sunday
 * @param everyNDays  for "everyn": the gap in days
 *
 * The start date is always honoured as the first sitting EXCEPT under
 * "weekdays", where it is a starting point: if the course is Mon/Wed/Fri and
 * the desk opens the form on a Tuesday, the first sitting is the Wednesday.
 * Booking a Tuesday just because the form was opened then would quietly put a
 * sitting outside the prescribed rota.
 */
export const generateCourseDates = ({
  pattern = "none",
  startDate,
  count = 1,
  weekdays = [],
  everyNDays = 2,
} = {}) => {
  const start = moment(startDate || new Date()).startOf("day");
  if (!start.isValid()) return [];

  const wanted = Math.max(1, Math.min(Number(count) || 1, MAX_SESSIONS));
  if (pattern === "none") return [start.toDate()];

  const out = [];

  if (pattern === "weekdays") {
    const days = (weekdays || []).map(Number).filter((d) => d >= 0 && d <= 6);
    // Without at least one weekday there is no rota to follow; the caller
    // validates this, but returning the start date alone keeps it harmless.
    if (days.length === 0) return [start.toDate()];

    const cursor = start.clone();
    // A whole year is far more than MAX_SESSIONS of any rota can need; it only
    // exists so a mistaken pattern cannot spin forever.
    const limit = start.clone().add(1, "year");
    while (out.length < wanted && cursor.isBefore(limit)) {
      if (days.includes(cursor.day())) out.push(cursor.clone().toDate());
      cursor.add(1, "day");
    }
    return out;
  }

  const step =
    pattern === "daily" ? 1
      : pattern === "alternate" ? 2
        : pattern === "weekly" ? 7
          : Math.max(1, Number(everyNDays) || 1);
  const unit = "day";

  for (let i = 0; i < wanted; i += 1) {
    out.push(start.clone().add(i * step, unit).toDate());
  }
  return out;
};

/** "Mon, Wed & Fri" - for the one-line summary above the generated rows. */
export const describeCourse = ({ pattern, count, weekdays = [], everyNDays }) => {
  const n = Number(count) || 1;
  const sittings = `${n} ${n === 1 ? "sitting" : "sittings"}`;
  switch (pattern) {
    case "daily":
      return `${sittings}, one a day`;
    case "alternate":
      return `${sittings}, every other day`;
    case "weekly":
      return `${sittings}, one a week`;
    case "everyn":
      return `${sittings}, every ${Math.max(1, Number(everyNDays) || 1)} days`;
    case "weekdays": {
      const names = WEEKDAYS.filter((d) => weekdays.includes(d.value)).map((d) => d.label);
      if (names.length === 0) return sittings;
      const list =
        names.length === 1
          ? names[0]
          : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
      return `${sittings}, ${list}`;
    }
    default:
      return sittings;
  }
};
