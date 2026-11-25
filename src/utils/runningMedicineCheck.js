import moment from "moment";

/**
 * KMSI - "already prescribed and still running" check on the doctor's prescription page.
 *
 * Rows come from Doctor/RunningMedicines: every active prescription line of the patient
 * (last 400 days) with StartDate, NoOfDays and the computed EndDate (start + duration;
 * null when the duration is not a number of days / weeks / months / years).
 *
 * A course is RUNNING when today is before its end (a 7-day course prescribed on the 22nd
 * runs through the 28th), or when the duration says the medicine is continuous
 * ("continue", "continuous", "ongoing", "lifelong", "SOS" is NOT continuous).
 */

const CONTINUOUS = /contin|ongoing|life ?long|till next|until next|indefinite/i;

export const normaliseMedicineName = (name) =>
  String(name ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Exclusive end of the course as a moment, or null when unknown. */
export const courseEnd = (row) => {
  if (row?.EndDate) {
    const m = moment(row.EndDate, ["YYYY-MM-DD", moment.ISO_8601], true);
    if (m.isValid()) return m;
  }
  const start = moment(row?.StartDate, ["YYYY-MM-DD", moment.ISO_8601], true);
  const n = parseInt(String(row?.NoOfDays ?? ""), 10);
  if (!start.isValid() || !Number.isFinite(n) || n <= 0) return null;
  const unit = /week/i.test(row?.NoOfDays) ? "weeks" : /month/i.test(row?.NoOfDays) ? "months" : /year/i.test(row?.NoOfDays) ? "years" : "days";
  return start.clone().add(n, unit);
};

export const isCourseRunning = (row, today = moment()) => {
  if (CONTINUOUS.test(String(row?.NoOfDays ?? ""))) return true;
  const end = courseEnd(row);
  return !!end && moment(today).startOf("day").isBefore(end, "day");
};

/**
 * The most recent still-running line for the medicine being added, or null.
 * @param rows      Doctor/RunningMedicines rows
 * @param medicine  { name, itemID }   the medicine just picked on the grid
 * @param options   { excludeTransactionID, today }  the current visit is never a match
 */
export const findRunningMedicine = (rows, medicine, { excludeTransactionID, today } = {}) => {
  const name = normaliseMedicineName(medicine?.name);
  const id = String(medicine?.itemID ?? "").split("#")[0].trim();
  if (!name && !id) return null;
  const skip = String(excludeTransactionID ?? "").trim();
  const candidates = (rows || []).filter((r) => {
    if (skip && String(r?.TransactionID ?? "").trim() === skip) return false;
    const sameId = id && String(r?.Medicine_ID ?? "").split("#")[0].trim() === id;
    const sameName = name && normaliseMedicineName(r?.MedicineName) === name;
    return (sameId || sameName) && isCourseRunning(r, today);
  });
  if (!candidates.length) return null;
  return candidates.sort((a, b) => String(b?.StartDate ?? "").localeCompare(String(a?.StartDate ?? "")))[0];
};

/**
 * Translate a sentence fragment but keep its own wording on a miss. The project's t()
 * hands back the UPPERCASED key when a translation row does not exist, which is fine
 * for a short label and unreadable for a sentence.
 */
export const tSentence = (t) => (s) => (typeof t === "function" ? t(s, { defaultValue: s }) : s);

/** Sentences describing a running line for the confirm box (array, one per line). */
export const describeRunningMedicine = (row, t) => {
  const tt = tSentence(t);
  const start = row?.StartDate ? moment(row.StartDate).format("DD-MMM-YYYY") : "";
  const end = courseEnd(row);
  const lines = [];
  lines.push(
    [
      tt("Prescribed on"),
      start || "-",
      row?.DrName ? `${tt("by")} ${row.DrName}` : "",
      row?.NoOfDays ? `${tt("for")} ${row.NoOfDays}` : "",
    ]
      .filter(Boolean)
      .join(" ") + ".",
  );
  lines.push(
    end
      ? `${tt("The course is still running until")} ${end.clone().subtract(1, "day").format("DD-MMM-YYYY")}.`
      : tt("The course is continuous."),
  );
  if (Number(row?.IsIssued) === 1) lines.push(tt("The pharmacy has already issued it."));
  return lines;
};
