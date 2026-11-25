import moment from "moment";
import { apiUrlsNew } from "./newApiEndpoints";
import makeApiRequest from "./axiosInstance";
import { GetPatientMedicineList } from "./EDP/govindedp";

/**
 * KMSI - running-medicine alert (doctor's prescription page).
 *
 * Primary: GET Doctor/RunningMedicines?PatientID - every active prescription line of the
 * patient from the last 400 days with StartDate / NoOfDays / EndDate (API build 2026-09-22).
 *
 * Fallback for an API build without that route (HTTP 404): the calendar's own feed,
 * Doctor/GetPatientMedicineList, for this month and the previous one, mapped to the same
 * row shape (MedicineGiveDate -> StartDate, end_date -> EndDate). Courses that started
 * more than two months ago are only seen through the primary route.
 *
 * @returns {{ ok: boolean, rows: Array, source: "api"|"fallback", message: string }}
 */

const isMissing = (resp) => resp === null || resp === undefined || resp?.status === 404;

const mapFeedRow = (r) => ({
  TransactionID: r?.TransactionID,
  App_ID: r?.App_ID,
  Medicine_ID: r?.Medicine_ID,
  MedicineName: r?.MedicineName,
  Composition: r?.Composition,
  Dose: r?.Dose,
  NoTimesDay: r?.NoTimesDay,
  NoOfDays: r?.NoOfDays,
  Meal: r?.Meal,
  Route: r?.route ?? r?.Route,
  StartDate: toIso(r?.MedicineGiveDate ?? r?.DATE ?? r?.Date),
  EndDate: toIso(r?.end_date),
  IsIssued: Number(r?.IsIssued ?? 0),
  DrName: r?.DrName,
});

const toIso = (v) => {
  if (!v) return null;
  const m = moment(v, [moment.ISO_8601, "YYYY-MM-DD", "DD-MMM-YYYY", "DD-MMM-YY", "DD/MM/YYYY"], true);
  return m.isValid() ? m.format("YYYY-MM-DD") : null;
};

export const GetRunningMedicines = async (patientID) => {
  if (!patientID) return { ok: true, rows: [], source: "api", message: "" };
  try {
    const resp = await makeApiRequest(
      `${apiUrlsNew?.DoctorRunningMedicines}?PatientID=${encodeURIComponent(patientID)}`,
      { method: "GET" },
    );
    if (resp?.success && Array.isArray(resp?.data)) return { ok: true, rows: resp.data, source: "api", message: "" };
    if (resp?.success === false && /no record/i.test(resp?.message || "")) {
      return { ok: true, rows: [], source: "api", message: "" };
    }
    if (!isMissing(resp)) {
      return { ok: false, rows: [], source: "api", message: resp?.message || "Running-medicine check failed" };
    }
  } catch (error) {
    return { ok: false, rows: [], source: "api", message: error?.message || String(error) };
  }

  // Route not on this API build: this month + last month from the calendar feed.
  try {
    const months = [moment().format("MM-YYYY"), moment().subtract(1, "month").format("MM-YYYY")];
    const rows = [];
    for (const currentMonth of months) {
      const feed = await GetPatientMedicineList({ PatientID: patientID, currentMonth });
      if (feed?.success && Array.isArray(feed?.data)) rows.push(...feed.data.map(mapFeedRow));
    }
    return {
      ok: true,
      rows,
      source: "fallback",
      message: "Doctor/RunningMedicines is not on this API build - using the monthly medicine feed",
    };
  } catch (error) {
    return { ok: false, rows: [], source: "fallback", message: error?.message || String(error) };
  }
};
