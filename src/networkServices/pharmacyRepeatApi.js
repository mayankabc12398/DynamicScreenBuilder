import moment from "moment";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { GetIPDSearchSalesAPI } from "./pharmecy";
import { IssueReturnSearchMedicineForDispense } from "./InventoryApi";

/**
 * Pharmacy Issue - "Previous Bills" (refill / repeat medicine). Two steps:
 *
 *   1. GetPatientPreviousBills   SUMMARY - one row per earlier pharmacy bill: bill no,
 *                                date-time, medicines, amount, issued by, dispensed by/at.
 *   2. GetPreviousBillItems      the MEDICINES of one bill, fetched when it is expanded,
 *                                with the last time each was given to the patient.
 *
 * Primary endpoints (PharmacyController, added 2026-09-21):
 *   GET Pharmacy/PatientPreviousBills?PatientID&FromDate&ToDate
 *   GET Pharmacy/PreviousBillItems?TransactionID&PatientID
 *
 * Fallback, for an API build that does not have them yet (HTTP 404): the summary comes
 * from the Reprint search (POST Pharmacy/SearchIPDSales - dates sent as ISO timestamps,
 * exactly as the Reprint screen sends them) and a bill's medicines from the Dispense list
 * (IssueReturn/SearchMedicineForDispense). Those rows may lack an ItemID on some clients;
 * such a line is shown but cannot be auto-added.
 */


/** Case-insensitive field read: the API camel-cases properties of objects it builds itself
 *  ("transactionID", "billNo") but keeps database column names on raw rows ("TransactionID"),
 *  so the same field can arrive under either spelling. */
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

const normaliseBill = (row) => ({
  TransactionID: String(row?.TransactionID ?? ""),
  BillNo: row?.BillNo ?? "",
  BillDate: row?.BillDateTime ?? row?.BillDate ?? "",
  NetAmount: row?.NetAmount ?? row?.GrossAmount ?? "",
  ItemCount: row?.ItemCount ?? "",
  TotalQty: row?.TotalQty ?? "",
  PanelName: row?.PanelName ?? "",
  PatientType: row?.PatientType ?? row?.patientType ?? "",
  IssuedBy: row?.IssuedBy ?? row?.UserName ?? row?.EntryByName ?? "",
  DispensedBy: row?.DispensedBy ?? row?.DispanseByName ?? "",
  DispensedAt: row?.DispensedAt ?? "",
  itemsLoaded: false,
  Items: [],
});

const normaliseItem = (row) => ({
  ItemID: String(field(row, "ItemID", "Item_ID") ?? "").split("#")[0],
  ItemName: field(row, "ItemName", "TypeName", "Name") ?? "",
  Quantity: Number(field(row, "Quantity", "SoldUnits", "IssueQty") ?? 0) || 0,
  MRP: field(row, "MRP") ?? "",
  BatchNumber: field(row, "BatchNumber") ?? "",
  LastGivenAt: field(row, "LastGivenAt") ?? "",
  LastGivenQty: field(row, "LastGivenQty") ?? "",
  LastGivenBy: field(row, "LastGivenBy") ?? "",
});

const isMissingEndpoint = (resp) =>
  !resp || resp?.status === 404 || resp?.status === 405 || resp?.success === undefined;

export const GetPatientPreviousBills = async ({ patientID, fromDate, toDate }) => {
  const from = moment(fromDate || moment().subtract(90, "days")).startOf("day");
  const to = moment(toDate || moment()).endOf("day");
  store.dispatch(setLoading(true));
  try {
    // 1. dedicated summary endpoint
    let resp = null;
    try {
      resp = await makeApiRequest(
        `${apiUrls.PharmacyPatientPreviousBills}?PatientID=${encodeURIComponent(
          patientID,
        )}&FromDate=${from.format("YYYY-MM-DD")}&ToDate=${to.format("YYYY-MM-DD")}`,
        { method: "GET" },
      );
    } catch (error) {
      resp = null;
    }
    if (resp?.success && Array.isArray(resp?.data)) {
      return { ok: true, source: "api", message: "", bills: resp.data.map(normaliseBill) };
    }
    if (resp?.success === false && /no record/i.test(resp?.message || "")) {
      return { ok: true, source: "api", message: "", bills: [] };
    }
    if (!isMissingEndpoint(resp)) {
      // the endpoint exists and reported a real error
      return { ok: false, source: "api", message: resp?.message || "Search failed", bills: [] };
    }

    // 2. fallback: Reprint search. Dates go as ISO timestamps like the Reprint screen's.
    const fb = await GetIPDSearchSalesAPI({
      typeOfTnx: "Sales",
      patientID,
      pName: "",
      panelID: 0,
      fromDate: from.toDate(),
      toDate: to.toDate(),
      ipdNo: "",
      userID: "",
    });
    if (fb?.success) {
      const wanted = String(patientID).trim().toUpperCase();
      const bills = (fb?.data || [])
        .filter((r) => String(r?.PatientID ?? "").trim().toUpperCase() === wanted)
        .filter((r) => !r?.TypeOfTnx || /pharmacy-issue|sales/i.test(r.TypeOfTnx))
        .map(normaliseBill);
      return { ok: true, source: "fallback", message: "", bills };
    }
    if (/no record/i.test(fb?.message || "")) {
      return { ok: true, source: "fallback", message: "", bills: [] };
    }
    return { ok: false, source: "fallback", message: fb?.message || "Search failed", bills: [] };
  } catch (error) {
    return { ok: false, source: "fallback", message: error?.message || String(error), bills: [] };
  } finally {
    store.dispatch(setLoading(false));
  }
};

/** Step 2: the medicines of one bill. */
export const GetPreviousBillItems = async (transactionID, patientID = "") => {
  // dedicated endpoint
  try {
    const resp = await makeApiRequest(
      `${apiUrls.PharmacyPreviousBillItems}?TransactionID=${encodeURIComponent(
        transactionID,
      )}&PatientID=${encodeURIComponent(patientID || "")}`,
      { method: "GET" },
    );
    if (resp?.success && Array.isArray(resp?.data)) {
      return resp.data.map(normaliseItem).filter((i) => i.ItemName);
    }
    if (resp?.success === false && !isMissingEndpoint(resp)) return [];
  } catch (error) {
    /* fall through */
  }
  // fallback: the Dispense list
  try {
    const resp = await IssueReturnSearchMedicineForDispense(transactionID);
    if (resp?.success && Array.isArray(resp?.data)) {
      return resp.data.map(normaliseItem).filter((i) => i.ItemName);
    }
  } catch (error) {
    console.error("[PreviousBills] bill items failed:", error);
  }
  return [];
};

/**
 * Pending Prescription > Print: the doctor's lines for one prescription (patient + date +
 * doctor), in the order the doctor saved them. Dates arrive as "DD-MMM-YYYY" from the list.
 */
export const GetPrescriptionPrintLines = async ({ patientID, date, doctorID, transactionID, appID }) => {
  store.dispatch(setLoading(true));
  try {
    const day = moment(date, ["DD-MMM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
    const resp = await makeApiRequest(
      `${apiUrls.PharmacyPrescriptionPrintLines}?PatientID=${encodeURIComponent(patientID || "")}&Date=${
        day.isValid() ? day.format("YYYY-MM-DD") : encodeURIComponent(date || "")
      }&DoctorID=${encodeURIComponent(doctorID || "")}&TransactionID=${encodeURIComponent(transactionID || "")}&AppID=${encodeURIComponent(appID || "")}`,
      { method: "GET" },
    );
    if (resp?.success && Array.isArray(resp?.data)) return resp.data;
    // A 404 means the API build on the server does not have this route yet - say so,
    // rather than reporting the prescription as missing.
    if (resp?.status === 404 || resp?.status === 405) {
      throw new Error("The API on this server does not have Pharmacy/PrescriptionPrintLines yet - deploy the latest API build");
    }
    if (resp?.success === false && !/no record/i.test(resp?.message || "")) {
      throw new Error(resp?.message || "Prescription lines could not be loaded");
    }
    if (resp?.success === undefined) {
      throw new Error(resp?.statusText || resp?.message || "Prescription lines could not be loaded");
    }
    return [];
  } finally {
    store.dispatch(setLoading(false));
  }
};

/**
 * Pending Prescription > Print: the printed sheet is built by the API (Views/Pharmacy/PrescriptionSheet.cshtml)
 * and comes back as a PDF link. Resolves with the link; throws a readable message when it cannot be made.
 */
export const GetPrescriptionPrintPdf = async ({ patientID, date, doctorID, transactionID, appID, withHeader = true }) => {
  store.dispatch(setLoading(true));
  try {
    const day = moment(date, ["DD-MMM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
    const resp = await makeApiRequest(
      `${apiUrls.PharmacyPrescriptionPrintPdf}?PatientID=${encodeURIComponent(patientID || "")}&Date=${
        day.isValid() ? day.format("YYYY-MM-DD") : encodeURIComponent(date || "")
      }&DoctorID=${encodeURIComponent(doctorID || "")}&TransactionID=${encodeURIComponent(transactionID || "")}&AppID=${encodeURIComponent(appID || "")}&WithHeader=${withHeader ? "true" : "false"}`,
      { method: "GET" },
    );
    if (resp?.success && (resp?.data?.pdfUrl || resp?.data?.PdfUrl)) return resp.data.pdfUrl || resp.data.PdfUrl;
    if (resp?.status === 404 || resp?.status === 405) {
      throw new Error("The API on this server does not have Pharmacy/PrescriptionPrintPdf yet - deploy the latest API build");
    }
    throw new Error(resp?.message || "The prescription could not be printed");
  } finally {
    store.dispatch(setLoading(false));
  }
};
