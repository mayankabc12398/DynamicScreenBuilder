import moment from "moment";
import { GetPatientMedicineList } from "../networkServices/EDP/govindedp";
import { getPatientIndentAPI, BindItemDetailsAPI } from "../networkServices/pharmecy";
import { BindIPDPatientDetails } from "../networkServices/BillingsApi";
import {
  BindMedicineGrid,
  BindMedicineDetail,
} from "../networkServices/nursingWardAPI";

/**
 * Pharmacy Medication Calendar — one month of everything the patient is on, from every
 * source the pharmacy can see.
 *
 * WHY THIS EXISTS
 *   The doctor's Medication Calendar reads one feed, Doctor/GetPatientMedicineList. Opened
 *   from the pharmacy it showed fewer medicines than it does for the doctor, and it never
 *   showed ward (IPD) medication at all, because that lives in the nursing MAR tables.
 *   The pharmacist wants the whole picture before issuing, so this loader fans out to the
 *   three feeds below, converts every row to the shape the calendar already renders
 *   (the Doctor/GetPatientMedicineList row), tags it with its source, and merges.
 *
 * SOURCES
 *   1. Doctor prescriptions   Doctor/GetPatientMedicineList        (what the doctor sees)
 *   2. Pharmacy prescriptions Pharmacy/GetPatientIndent + GetPrescribedItemStockDetails
 *                             (the pharmacy's own prescription list, "Old Pres" on Issue)
 *   3. IPD ward medication    NursingWard BindMedicineGrid + BindMedicineDetail per
 *                             admission — the MAR. The admission TransactionID comes from
 *                             the patient object when the screen has it, otherwise from
 *                             IPDAdvance/BindIPDPatientDetails by UHID.
 *
 *   Each source is independent: one failing (or not applicable) never hides the others.
 *   The same prescription reaches us through 1 and 2, so rows are de-duplicated on
 *   medicine name + start date and the source labels are merged ("Doctor Rx, Pharmacy Rx").
 *
 * OUTPUT
 *   Array of rows in the Doctor/GetPatientMedicineList shape, plus `Source` (label) and
 *   `SourceKey`. The calendar's transform reads `Source` into `rawData` for its tag.
 */

export const MEDICATION_SOURCE = {
  DOCTOR: { key: "doctor", label: "Doctor Rx" },
  PHARMACY: { key: "pharmacy", label: "Pharmacy Rx" },
  WARD: { key: "ward", label: "IPD Ward" },
};

const DATE_FORMATS = [
  moment.ISO_8601,
  "YYYY-MM-DD",
  "YYYY-MM-DD HH:mm:ss",
  "DD-MMM-YYYY",
  "DD-MMM-YYYY HH:mm",
  "DD-MMM-YYYY hh:mm A",
  "DD/MM/YYYY",
  "DD-MM-YYYY",
  "M/D/YYYY h:mm:ss A", // .NET default DateTime.ToString()
  "M/D/YYYY",
];

export const parseAnyDate = (value) => {
  if (!value) return null;
  if (moment.isMoment(value)) return value.isValid() ? value.clone() : null;
  if (value instanceof Date) {
    const m = moment(value);
    return m.isValid() ? m : null;
  }
  const text = String(value).trim();
  // "/Date(1694601600000)/" style from some .NET serialisers
  const dotNet = text.match(/\/Date\((\d+)\)\//);
  if (dotNet) return moment(Number(dotNet[1]));
  const strict = moment(text, DATE_FORMATS, true);
  if (strict.isValid()) return strict;
  // Non-strict against the same formats tolerates odd padding ("2-Sep-2026 9:05")
  // without falling back to the browser Date parser (which moment warns about).
  const lenient = moment(text, DATE_FORMATS);
  return lenient.isValid() ? lenient : null;
};

/** "7 Days", "2 Weeks", "10", 7 → number of days (0 when unknown). */
export const durationToDays = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Math.max(0, Math.round(value));
  const text = String(value).toLowerCase();
  const weeks = text.match(/(\d+(?:\.\d+)?)\s*(?:week|wk)/);
  if (weeks) return Math.round(Number(weeks[1]) * 7);
  const months = text.match(/(\d+(?:\.\d+)?)\s*(?:month|mo)/);
  if (months) return Math.round(Number(months[1]) * 30);
  const days = text.match(/(\d+(?:\.\d+)?)/);
  return days ? Math.round(Number(days[1])) : 0;
};

const monthBounds = (monthYear) => {
  // monthYear is "MM-YYYY" (what the calendar already passes)
  const start = moment(monthYear, "MM-YYYY", true).startOf("month");
  if (!start.isValid()) {
    const now = moment().startOf("month");
    return { start: now, end: now.clone().endOf("month") };
  }
  return { start, end: start.clone().endOf("month") };
};

const overlapsMonth = (start, end, bounds) =>
  !!start &&
  !!end &&
  !start.isAfter(bounds.end, "day") &&
  !end.isBefore(bounds.start, "day");

const statusFor = (end, stopped = false) => {
  if (stopped) return "Completed";
  if (!end) return "Active";
  return end.isBefore(moment(), "day") ? "Completed" : "Active";
};

const firstNonEmpty = (...values) =>
  values.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ??
  "";

/**
 * makeApiRequest resolves with the API envelope on success ({ success, data, message })
 * but with the raw axios error response on HTTP failure ({ status, statusText, data }),
 * so both shapes are read here to produce one human-readable reason.
 */
const responseMessage = (response) =>
  response?.message ||
  response?.data?.message ||
  response?.data?.Message ||
  response?.statusText ||
  (response?.status ? `HTTP ${response.status}` : "");

const describeFailure = (response, what) => {
  if (!response) return `${what}: no response`;
  return `${what}: ${responseMessage(response) || "unexpected response"}`;
};

/** This app's APIs answer "nothing found" with success:false; that is empty, not broken. */
const isNoRecordAnswer = (response) =>
  /no\s*(record|data|result|row)|not\s*(found|available|exist)|does\s*not\s*exist|nothing\s*found/i.test(
    responseMessage(response) || "",
  );

/** Build one calendar row (Doctor/GetPatientMedicineList shape). */
const makeRow = ({
  source,
  transactionID,
  medicineID,
  name,
  dose,
  days,
  frequency,
  meal,
  route,
  doctor,
  start,
  end,
  quantity,
  issued,
  status,
  remarks,
  composition,
}) => ({
  Source: source.label,
  SourceKey: source.key,
  TransactionID: `${source.key}-${transactionID ?? ""}`,
  Medicine_ID: medicineID ?? name,
  MedicineName: name,
  Dose: dose ?? "",
  NoOfDays: days ?? "",
  NoTimesDay: frequency ?? "",
  Meal: meal ?? "",
  Route: route ?? "",
  DrName: doctor ?? "",
  MedicineGiveDate: start ? start.format("YYYY-MM-DD") : "",
  end_date: end ? end.format("YYYY-MM-DD") : "",
  Quantity: quantity ?? "",
  IsIssued: issued ? 1 : 0,
  MedicineStatus: status,
  days_remaining: end ? end.diff(moment().startOf("day"), "days") : 0,
  Remarks: remarks ?? "",
  Composition: composition ?? "",
});

/* ----------------------------------------------------------------------------------- */
/* Source 1 — doctor prescriptions (the calendar's original feed)                        */
/* ----------------------------------------------------------------------------------- */
const loadDoctorPrescriptions = async ({ patientID, monthYear }) => {
  const response = await GetPatientMedicineList({
    PatientID: patientID,
    currentMonth: monthYear,
  });
  if (!response?.success) {
    if (isNoRecordAnswer(response)) return [];
    throw new Error(describeFailure(response, "doctor feed"));
  }
  if (!Array.isArray(response?.data)) return [];
  return response.data.map((item) => ({
    ...item,
    Source: MEDICATION_SOURCE.DOCTOR.label,
    SourceKey: MEDICATION_SOURCE.DOCTOR.key,
  }));
};

/* ----------------------------------------------------------------------------------- */
/* Source 2 — the pharmacy's own prescription list                                        */
/* ----------------------------------------------------------------------------------- */
const MAX_PRESCRIPTIONS_PER_MONTH = 40;

const loadPharmacyPrescriptions = async ({
  patientID,
  monthYear,
  deptLedgerNo,
}) => {
  const bounds = monthBounds(monthYear);
  const listResp = await getPatientIndentAPI({
    deptLedgerNo: deptLedgerNo ?? "",
    IPDNO: "",
    PatientID: patientID,
    fromDate: bounds.start.format("DD-MMM-YYYY"),
    toDate: bounds.end.format("DD-MMM-YYYY"),
    indentID: "",
    searchType: "",
    demandDraftID: 0,
  });
  if (!listResp?.success) {
    if (isNoRecordAnswer(listResp)) return [];
    throw new Error(describeFailure(listResp, "prescription list"));
  }
  if (!Array.isArray(listResp?.data)) return [];

  // The API is already scoped to this UHID; only drop rows that clearly belong to
  // someone else (the list search is a prefix match on the typed key).
  const wanted = String(patientID).trim().toUpperCase();
  const prescriptions = listResp.data
    .filter((p) => {
      const id = String(p?.patientID ?? p?.PatientID ?? "").trim().toUpperCase();
      return !id || id === wanted;
    })
    .slice(0, MAX_PRESCRIPTIONS_PER_MONTH);

  const perPrescription = await Promise.all(
    prescriptions.map(async (p) => {
      const date = p?.Date;
      const doctorID = p?.DoctorID ?? "";
      try {
        const detail = await BindItemDetailsAPI(
          "BindPrescribeDetailsURL",
          `date=${encodeURIComponent(date)}&patientID=${encodeURIComponent(
            patientID,
          )}&doctorID=${encodeURIComponent(doctorID)}`,
        );
        if (!detail?.success || !Array.isArray(detail?.data)) return [];

        // One row per item+batch comes back; the calendar wants one per medicine.
        const seen = new Set();
        const rows = [];
        detail.data.forEach((item) => {
          const itemID = item?.ItemID ?? item?.ItemId ?? item?.Medicine_ID;
          const name = firstNonEmpty(item?.ItemName, item?.MedicineName, item?.Name);
          if (!name) return;
          const key = `${itemID ?? name}`;
          if (seen.has(key)) return;
          seen.add(key);

          const start = parseAnyDate(firstNonEmpty(item?.Date, date)) || bounds.start;
          const daysText = firstNonEmpty(
            item?.NoOfDays,
            item?.Days,
            item?.Duration,
            item?.NoofDays,
          );
          const days = durationToDays(daysText);
          const end = start.clone().add(Math.max(days - 1, 0), "days");
          const issuedQty = Number(item?.ReceiveQty ?? item?.IssueQuantity ?? 0);

          rows.push(
            makeRow({
              source: MEDICATION_SOURCE.PHARMACY,
              transactionID: `${date}-${doctorID}`,
              medicineID: itemID,
              name,
              dose: firstNonEmpty(item?.Dose, item?.DoseName),
              days: daysText ? (days ? `${days} Days` : String(daysText)) : "",
              frequency: firstNonEmpty(
                item?.NoTimesDay,
                item?.Frequency,
                item?.Timing,
                item?.TimingDisplay,
              ),
              meal: firstNonEmpty(item?.Meal),
              route: firstNonEmpty(item?.Route),
              doctor: firstNonEmpty(p?.DName, p?.DoctorName),
              start,
              end,
              quantity: firstNonEmpty(item?.TotalReqQty, item?.ReqQty, item?.Quantity),
              issued: issuedQty > 0,
              status: statusFor(end),
              remarks: firstNonEmpty(item?.Remarks, item?.Remark),
              composition: firstNonEmpty(item?.Composition, item?.Generic),
            }),
          );
        });
        return rows;
      } catch (error) {
        console.error("Pharmacy prescription detail failed", error);
        return [];
      }
    }),
  );

  return perPrescription.flat();
};

/* ----------------------------------------------------------------------------------- */
/* Source 3 — IPD ward medication (the MAR)                                              */
/* ----------------------------------------------------------------------------------- */
const MAR_CATEGORY_ID = 5; // same as MedicationAdministrationRecordCalendar

const resolveAdmissionIDs = async (patient) => {
  const direct = Number(
    patient?.TransactionID ?? patient?.transactionID ?? patient?.TID ?? 0,
  );
  if (direct > 0) return [direct];

  const patientID = patient?.PatientID;
  if (!patientID) return [];
  const resp = await BindIPDPatientDetails(patientID);
  if (!resp?.success) {
    if (isNoRecordAnswer(resp)) return [];
    // Let runSource report this as an error rather than pretending "no admission".
    throw new Error(describeFailure(resp, "IPD admission lookup"));
  }
  const rows = Array.isArray(resp?.data) ? resp.data : [];
  const wanted = String(patientID).trim().toUpperCase();
  const ids = rows
    .filter(
      (row) => String(row?.PatientID ?? "").trim().toUpperCase() === wanted,
    )
    .map((row) => Number(row?.TransactionID ?? row?.TID ?? 0))
    .filter((id) => id > 0);
  return Array.from(new Set(ids));
};

/* The pharmacy patient search (sp_GetIssuePatientDetail) returns TransactionID > 0 and
   PatientType "IPD" for a currently admitted patient, and TransactionID 0 with a blank
   IPDNo once discharged. */
const isCurrentlyAdmitted = (patient) =>
  Number(patient?.TransactionID ?? patient?.transactionID ?? patient?.TID ?? 0) > 0 ||
  String(patient?.PatientType || "").toUpperCase() === "IPD" ||
  !!String(patient?.IPDNo || "").trim();

const loadWardMedication = async ({ patient, monthYear }) => {
  let admissionIDs;
  try {
    admissionIDs = await resolveAdmissionIDs(patient);
  } catch (error) {
    // For an admitted patient a failed lookup is a real problem and is reported as one.
    // For an OPD patient the lookup was only a search for PAST admissions; if that
    // endpoint refuses or fails for this login, the ward feed is simply not applicable,
    // and the reason stays on the chip's hover text and in the console line.
    if (isCurrentlyAdmitted(patient)) throw error;
    throw Object.assign(
      new Error(
        `not admitted; admission history lookup unavailable (${error?.message || error})`,
      ),
      { skipped: true },
    );
  }
  if (!admissionIDs.length) {
    throw Object.assign(new Error("no IPD admission found for this UHID"), {
      skipped: true,
    });
  }
  const bounds = monthBounds(monthYear);

  const perAdmission = await Promise.all(
    admissionIDs.map(async (tid) => {
      try {
        const gridResp = await BindMedicineGrid({
          tid,
          categoryID: MAR_CATEGORY_ID,
        });
        if (!gridResp?.success || !Array.isArray(gridResp?.data)) return [];

        // Same filter the MAR applies: scheduled, with a duration, not cancelled.
        const seen = new Set();
        const meds = [];
        gridResp.data.forEach((row) => {
          if (!row?.Timing || String(row.Timing).trim() === "") return;
          if (!row?.Duration) return;
          if (Number(row?.isCancel) === 1) return;
          const key = `${row.IndentNo}_${row.ItemID}`;
          if (seen.has(key)) return;
          seen.add(key);
          meds.push(row);
        });

        const rows = await Promise.all(
          meds.map(async (med) => {
            let schedule = [];
            try {
              const detail = await BindMedicineDetail({
                tid,
                itemID: med.ItemID,
                indentNo: med.IndentNo,
              });
              schedule = Array.isArray(detail?.data) ? detail.data : [];
            } catch (error) {
              console.error("MAR detail failed", error);
            }

            const dates = schedule
              .map((s) => parseAnyDate(s?.ScheduleDate))
              .filter(Boolean)
              .sort((a, b) => a.valueOf() - b.valueOf());
            const start = dates[0] || parseAnyDate(med?.DATE) || null;
            const days = durationToDays(med?.Duration);
            const end =
              dates[dates.length - 1] ||
              (start ? start.clone().add(Math.max(days - 1, 0), "days") : null);
            if (!overlapsMonth(start, end, bounds)) return null;

            const given = schedule.filter((s) => s?.GivenDateTime).length;
            const stopped = !!med?.StoppedDate;

            return makeRow({
              source: MEDICATION_SOURCE.WARD,
              transactionID: `${tid}-${med.IndentNo}`,
              medicineID: med.ItemID,
              name: firstNonEmpty(med?.ItemName, med?.MedicineName),
              dose: firstNonEmpty(med?.Dose),
              days: days ? `${days} Days` : String(med?.Duration ?? ""),
              frequency: firstNonEmpty(med?.TimingDisplay, med?.Timing),
              route: firstNonEmpty(med?.Route),
              doctor: firstNonEmpty(med?.DoctorName, med?.DrName, med?.PrescribedBy),
              start,
              end,
              quantity: firstNonEmpty(med?.IssueQty, med?.ReceiveQty),
              issued: given > 0,
              status: statusFor(end, stopped),
              remarks: schedule.length
                ? `Given ${given} of ${schedule.length} scheduled doses${
                    stopped ? " (stopped)" : ""
                  }`
                : stopped
                  ? "Stopped"
                  : "",
            });
          }),
        );
        return rows.filter(Boolean);
      } catch (error) {
        console.error("MAR grid failed", error);
        return [];
      }
    }),
  );

  return perAdmission.flat();
};

/* ----------------------------------------------------------------------------------- */
/* Merge                                                                                 */
/* ----------------------------------------------------------------------------------- */
const dedupeKey = (row) => {
  const name = String(row?.MedicineName ?? "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  const start = parseAnyDate(row?.MedicineGiveDate);
  return `${name}|${start ? start.format("YYYY-MM-DD") : ""}`;
};

export const mergeMedicationRows = (lists) => {
  const byKey = new Map();
  lists.flat().forEach((row) => {
    if (!row?.MedicineName) return;
    const key = dedupeKey(row);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...row });
      return;
    }
    // Same medicine, same start: keep the first row, remember every source it came from.
    const labels = new Set(
      String(existing.Source || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    if (row.Source) labels.add(row.Source);
    existing.Source = Array.from(labels).join(", ");
    // Fill blanks from the later row so nothing useful is lost.
    Object.keys(row).forEach((field) => {
      if (
        (existing[field] === undefined ||
          existing[field] === null ||
          existing[field] === "") &&
        row[field] !== undefined &&
        row[field] !== null &&
        row[field] !== ""
      ) {
        existing[field] = row[field];
      }
    });
    if (row.IsIssued === 1) existing.IsIssued = 1;
  });
  return Array.from(byKey.values());
};

/**
 * Run one source and report what happened instead of hiding it. The calendar shows the
 * status strip built from these, so a feed that returns nothing (or is refused for this
 * login) is visible on screen rather than silently absent.
 *
 * status: "ok" (rows found) | "empty" (answered, nothing) | "skipped" (not applicable,
 *         e.g. no IPD admission) | "error" (request failed or API refused)
 */
const runSource = async (source, promise) => {
  try {
    const rows = await promise;
    return {
      key: source.key,
      label: source.label,
      count: rows.length,
      status: rows.length ? "ok" : "empty",
      message: "",
      rows,
    };
  } catch (error) {
    const status = error?.skipped ? "skipped" : "error";
    if (status === "error") {
      console.error(`Medication source "${source.label}" failed`, error);
    }
    return {
      key: source.key,
      label: source.label,
      count: 0,
      status,
      message: error?.message || String(error),
      rows: [],
    };
  }
};

/**
 * @param {{ patient: object, monthYear: string, deptLedgerNo?: string|number }} args
 *   patient    the pharmacy screen's SearchPatient.patientDetail (needs PatientID)
 *   monthYear  "MM-YYYY"
 * @returns {Promise<{ rows: Array, sources: Array<{key,label,count,status,message}> }>}
 *   rows are merged, in the Doctor/GetPatientMedicineList shape; sources is one status
 *   entry per feed, in display order.
 */
export const loadPharmacyPatientMedicines = async ({
  patient,
  monthYear,
  deptLedgerNo,
}) => {
  const patientID = patient?.PatientID;
  if (!patientID) return { rows: [], sources: [] };

  const results = await Promise.all([
    runSource(
      MEDICATION_SOURCE.DOCTOR,
      loadDoctorPrescriptions({ patientID, monthYear }),
    ),
    runSource(
      MEDICATION_SOURCE.PHARMACY,
      loadPharmacyPrescriptions({ patientID, monthYear, deptLedgerNo }),
    ),
    runSource(MEDICATION_SOURCE.WARD, loadWardMedication({ patient, monthYear })),
  ]);

  const sources = results.map(({ rows, ...status }) => status);
  // One line per feed in the console, so a support screenshot of DevTools is enough
  // to tell which feed is empty for this login.
  console.info(
    `[MedicationCalendar] ${patientID} ${monthYear}`,
    sources.map((s) => `${s.label}: ${s.status} (${s.count})${s.message ? " - " + s.message : ""}`).join(" | "),
  );

  return {
    rows: mergeMedicationRows(results.map((r) => r.rows)),
    sources,
  };
};
