import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * KMSI - Pharmacy patient notes.
 *
 *   GetPharmacyPatientNotes(patientID, transactionID?)  all active notes for a patient,
 *                                                        newest first (IsCurrentBill = 1 on
 *                                                        the rows written under that bill)
 *   SavePharmacyPatientNote({ patientID, transactionID, billNo, note })
 *
 * Endpoints (PharmacyController, API build 2026-09-22):
 *   GET  Pharmacy/PatientNotes?PatientID&TransactionID
 *   POST Pharmacy/PatientNoteSave   { PatientID, TransactionID, BillNo, Note }
 *
 * Writer (user id / login / name) and the time are stamped by the API from the token and
 * the server clock, so nothing about "who" is sent from here.
 */

/** Case-insensitive field read: raw Dapper rows keep column names, objects the API builds
 *  itself come back camel-cased. */
const field = (row, ...names) => {
  if (!row || typeof row !== "object") return undefined;
  for (const n of names) if (row[n] !== undefined && row[n] !== null) return row[n];
  const keys = Object.keys(row);
  for (const n of names) {
    const hit = keys.find((k) => k.toLowerCase() === String(n).toLowerCase());
    if (hit && row[hit] !== undefined && row[hit] !== null) return row[hit];
  }
  return undefined;
};

const isMissingEndpoint = (resp) =>
  resp === null || resp === undefined || resp?.status === 404 || resp?.statusText === "Not Found";

const MISSING_API_MESSAGE =
  "Patient notes are not available on this API build - deploy the latest API build.";

export const normalisePatientNote = (row) => ({
  NoteID: field(row, "NoteID") ?? "",
  PatientID: field(row, "PatientID") ?? "",
  TransactionID: String(field(row, "TransactionID") ?? ""),
  BillNo: field(row, "BillNo") ?? "",
  Note: field(row, "Note") ?? "",
  EntryDateTime: field(row, "EntryDateTime") ?? "",
  UserID: field(row, "UserID") ?? "",
  UserName: field(row, "UserName") ?? "",
  EmployeeName: field(row, "EmployeeName") ?? "",
  IsCurrentBill: Number(field(row, "IsCurrentBill") ?? 0) === 1,
});

/**
 * @returns {{ ok: boolean, notes: Array, message: string }}
 *   ok=true with an empty list when the patient simply has no notes.
 */
export const GetPharmacyPatientNotes = async (patientID, transactionID = "", { silent = false } = {}) => {
  if (!patientID) return { ok: true, notes: [], message: "" };
  if (!silent) store.dispatch(setLoading(true));
  try {
    const qs = `PatientID=${encodeURIComponent(patientID)}${
      transactionID ? `&TransactionID=${encodeURIComponent(transactionID)}` : ""
    }`;
    const resp = await makeApiRequest(`${apiUrls.PharmacyPatientNotes}?${qs}`, { method: "GET" });
    if (resp?.success && Array.isArray(resp?.data)) {
      return { ok: true, notes: resp.data.map(normalisePatientNote), message: "" };
    }
    if (resp?.success === false && /no record/i.test(resp?.message || "")) {
      return { ok: true, notes: [], message: "" };
    }
    if (isMissingEndpoint(resp)) return { ok: false, notes: [], message: MISSING_API_MESSAGE };
    return { ok: false, notes: [], message: resp?.message || "Could not load the patient notes" };
  } catch (error) {
    return { ok: false, notes: [], message: error?.message || String(error) };
  } finally {
    if (!silent) store.dispatch(setLoading(false));
  }
};

/**
 * @returns {{ ok: boolean, noteID: number|string, message: string }}
 */
export const SavePharmacyPatientNote = async ({ patientID, transactionID, billNo, note }) => {
  store.dispatch(setLoading(true));
  try {
    const resp = await makeApiRequest(apiUrls.PharmacyPatientNoteSave, {
      method: "POST",
      data: {
        PatientID: patientID ?? "",
        TransactionID: transactionID ? String(transactionID) : "",
        BillNo: billNo ?? "",
        Note: note ?? "",
      },
    });
    if (resp?.success) {
      return { ok: true, noteID: field(resp?.data, "NoteID") ?? "", message: resp?.message || "" };
    }
    if (isMissingEndpoint(resp)) return { ok: false, noteID: "", message: MISSING_API_MESSAGE };
    return { ok: false, noteID: "", message: resp?.message || "Could not save the note" };
  } catch (error) {
    return { ok: false, noteID: "", message: error?.message || String(error) };
  } finally {
    store.dispatch(setLoading(false));
  }
};
