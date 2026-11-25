/**
 * Day Care booking slots.
 *
 * A day care chair is not booked in fixed blocks - one patient needs an hour,
 * the next needs three - so a slot is chosen as a START TIME plus a DURATION,
 * and the end time is derived. That is also why the duration doubles as the
 * expected stay: on this screen they were always the same number, and asking
 * for both invited them to disagree.
 *
 * The value a dropdown carries is the start time ("HH:mm"); the duration
 * carries minutes as a string. `slotRange` turns the pair into the
 * SlotFromTime / SlotToTime the API expects.
 *
 * Shared by the Day Care Admission screen and the OPD package booking popup so
 * the two cannot drift apart.
 */

/** The working window the unit books inside. Edit here to change both screens. */
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 20;

/** Granularity of the start-time list, in minutes. */
const START_STEP_MINUTES = 15;

const pad = (n) => String(n).padStart(2, "0");

/** "HH:mm" -> minutes since midnight. Null for anything unparseable. */
export const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return Number.isNaN(h) ? null : h * 60 + (m || 0);
};

/** minutes since midnight -> "HH:mm" */
export const toHHmm = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

/** "14:30" -> "02:30 PM", for labels that sit next to the rest of the UI. */
export const to12Hour = (hhmm) => {
  const mins = toMinutes(hhmm);
  if (mins === null) return "";
  const h24 = Math.floor(mins / 60);
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${pad(h12)}:${pad(mins % 60)} ${suffix}`;
};

/** Start times across the working window, every START_STEP_MINUTES. */
export const START_TIME_OPTIONS = (() => {
  const out = [];
  for (let m = DAY_START_HOUR * 60; m < DAY_END_HOUR * 60; m += START_STEP_MINUTES) {
    const v = toHHmm(m);
    out.push({ label: to12Hour(v), value: v });
  }
  return out;
})();

/**
 * How long the chair is needed. "0" means the whole day: the booking is saved
 * with no slot, which the API treats as 00:00:00-23:59:59 and so blocks the bed
 * for the entire date.
 */
export const DURATION_OPTIONS = [
  { label: "30 Minutes", value: "30", hours: 0.5 },
  { label: "1 Hour", value: "60", hours: 1 },
  { label: "1 Hour 30 Minutes", value: "90", hours: 1.5 },
  { label: "2 Hours", value: "120", hours: 2 },
  { label: "3 Hours", value: "180", hours: 3 },
  { label: "4 Hours", value: "240", hours: 4 },
  { label: "5 Hours", value: "300", hours: 5 },
  { label: "6 Hours", value: "360", hours: 6 },
  { label: "8 Hours", value: "480", hours: 8 },
  { label: "Full Day", value: "0", hours: 0 },
];

/**
 * Turn a start time and a duration into the interval the API wants.
 *
 * Returns { from, to, label, hours, overflow }:
 *   from/to   "HH:mm", or "" for a full-day booking (no slot at all)
 *   hours     decimal hours, to store as ExpectedStayHours
 *   overflow  true when the duration runs past the end of the working day. The
 *             end is clamped to it rather than wrapping past midnight, because
 *             a slot whose end is earlier than its start would break the
 *             overlap comparison on both the client and the server.
 */
export const slotRange = (startValue, durationValue) => {
  const start = typeof startValue === "object" ? startValue?.value : startValue;
  const durRaw = typeof durationValue === "object" ? durationValue?.value : durationValue;
  const minutes = Number(durRaw);

  // Full day, or nothing chosen yet.
  if (!start || !durRaw || minutes === 0) {
    return { from: "", to: "", label: "Full Day", hours: 0, overflow: false };
  }

  const startMin = toMinutes(start);
  if (startMin === null) {
    return { from: "", to: "", label: "Full Day", hours: 0, overflow: false };
  }

  const dayEnd = DAY_END_HOUR * 60;
  const wanted = startMin + minutes;
  const endMin = Math.min(wanted, dayEnd);
  const from = toHHmm(startMin);
  const to = toHHmm(endMin);

  return {
    from,
    to,
    label: `${to12Hour(from)} - ${to12Hour(to)}`,
    hours: Math.round(((endMin - startMin) / 60) * 100) / 100,
    overflow: wanted > dayEnd,
  };
};

/**
 * The reverse of `slotRange`: turn a stored SlotFromTime / SlotToTime back into
 * the Start Time and Duration options the dropdowns hold.
 *
 * Used when the Day Care Admission screen opens against an existing booking -
 * the hold already decided the window, so the form has to show it rather than
 * make the desk re-enter it.
 *
 * A stored window that is not one of the listed durations (a hand-made booking,
 * or a duration list that has since changed) still comes back: the duration
 * option is synthesised from the actual minutes so nothing is silently lost.
 */
export const rangeToSelections = (from, to) => {
  const f = toMinutes(from);
  const t2 = toMinutes(to);
  if (f === null || t2 === null || t2 <= f) {
    // No slot stored means the booking holds the whole day.
    return { start: "", duration: "" };
  }
  const mins = t2 - f;
  const start = { label: to12Hour(toHHmm(f)), value: toHHmm(f) };
  const known = DURATION_OPTIONS.find((d) => Number(d.value) === mins);
  if (known) return { start, duration: known };

  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = [h ? `${h} Hour${h > 1 ? "s" : ""}` : "", m ? `${m} Minutes` : ""]
    .filter(Boolean)
    .join(" ");
  return { start, duration: { label, value: String(mins) } };
};

/**
 * Which of the three questions the bed board is being asked.
 *
 *   "slot"   a start and a real duration - is this chair free 10:00-13:00?
 *   "full"   the Full Day duration was chosen deliberately
 *   "browse" nothing picked yet - show what the chairs are already spoken for
 *
 * The last two both produce an empty from/to, which is why they have to be
 * told apart here rather than guessed at the other end: answering "browse" as
 * though it were "full" is what made a chair booked for three hours look
 * unusable for the rest of the day.
 */
export const slotMode = (startValue, durationValue) => {
  const start = typeof startValue === "object" ? startValue?.value : startValue;
  const dur = typeof durationValue === "object" ? durationValue?.value : durationValue;
  if (dur !== undefined && dur !== null && String(dur) === "0") return "full";
  if (!start || !dur) return "browse";
  return "slot";
};

/** "09:15:00-13:15:00,14:00:00-16:00:00" -> [{ from, to }] */
export const parseWindows = (windows) =>
  String(windows || "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => {
      const [from, to] = w.split("-");
      return { from: (from || "").slice(0, 5), to: (to || "").slice(0, 5) };
    })
    .filter((w) => w.from && w.to)
    .sort((a, b) => (a.from < b.from ? -1 : 1));

/** Does [from,to) meet any of them? Back-to-back does not count as a clash. */
export const overlapsWindows = (from, to, windows) => {
  const f = toMinutes(from);
  const t2 = toMinutes(to);
  if (f === null || t2 === null) return false;
  return parseWindows(windows).some((w) => {
    const wf = toMinutes(w.from);
    const wt = toMinutes(w.to);
    return wf !== null && wt !== null && f < wt && t2 > wf;
  });
};

/** The gaps left in the working day once the booked windows are taken out. */
export const freeGaps = (windows) => {
  const dayStart = DAY_START_HOUR * 60;
  const dayEnd = DAY_END_HOUR * 60;
  const taken = parseWindows(windows)
    .map((w) => [toMinutes(w.from), toMinutes(w.to)])
    .filter(([f, t2]) => f !== null && t2 !== null && t2 > f)
    .sort((a, b) => a[0] - b[0]);

  const gaps = [];
  let cursor = dayStart;
  taken.forEach(([f, t2]) => {
    if (f > cursor) gaps.push([cursor, Math.min(f, dayEnd)]);
    cursor = Math.max(cursor, t2);
  });
  if (cursor < dayEnd) gaps.push([cursor, dayEnd]);

  return gaps
    .filter(([f, t2]) => t2 > f)
    .map(([f, t2]) => ({
      from: toHHmm(f), to: toHHmm(t2),
      minutes: t2 - f,
      label: `${to12Hour(toHHmm(f))} - ${to12Hour(toHHmm(t2))}`,
    }));
};

/**
 * The earliest start that fits `minutes` of treatment around what is already
 * booked, or null if the day cannot take it. Offered to the desk as a
 * suggestion - a chair that is busy 9:15-13:15 is still worth having at 13:15,
 * and making somebody find that by trying start times is needless.
 */
export const suggestStart = (windows, minutes, notBefore) => {
  const need = Number(minutes) || 0;
  const floor = toMinutes(notBefore) ?? DAY_START_HOUR * 60;
  const gaps = freeGaps(windows);
  for (let i = 0; i < gaps.length; i += 1) {
    const gf = Math.max(toMinutes(gaps[i].from), floor);
    const gt = toMinutes(gaps[i].to);
    // A full-day request needs a wholly empty day, so no gap can satisfy it.
    if (need > 0 && gt - gf >= need) return toHHmm(gf);
  }
  return null;
};

/**
 * Is this a bookable interval at all?
 *
 * Returns { ok, error, warning }. `error` blocks the save; `warning` is for
 * something the desk should see but may legitimately want - the end of the
 * slot being clamped to closing time, for instance, which `slotRange` does
 * silently.
 */
export const validateSlot = ({ start, duration, date }) => {
  const mode = slotMode(start, duration);
  if (mode === "browse") {
    return { ok: false, error: "Pick a start time and a duration", warning: "" };
  }
  if (mode === "full") return { ok: true, error: "", warning: "" };

  const range = slotRange(start, duration);
  const startMin = toMinutes(range.from);

  if (startMin === null || !range.to || range.hours <= 0) {
    return { ok: false, error: "That is not a usable time slot", warning: "" };
  }
  if (startMin < DAY_START_HOUR * 60 || startMin >= DAY_END_HOUR * 60) {
    return {
      ok: false,
      error: `Day care runs ${to12Hour(toHHmm(DAY_START_HOUR * 60))} to ${to12Hour(toHHmm(DAY_END_HOUR * 60))}`,
      warning: "",
    };
  }

  /* Booking a slot that has already started today is almost always a wrong
     date rather than an intention, and the bed board cannot honour it. */
  if (date) {
    const d = new Date(date);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isToday && startMin < now.getHours() * 60 + now.getMinutes()) {
      return { ok: false, error: "That start time has already passed today", warning: "" };
    }
  }

  return {
    ok: true,
    error: "",
    // slotRange clamps rather than wrapping past midnight; say so out loud.
    warning: range.overflow
      ? `The slot was shortened to ${range.label} - the unit closes at ${to12Hour(toHHmm(DAY_END_HOUR * 60))}`
      : "",
  };
};
