/**
 * What the AI reads about a patient, for every AI Assistance tab (4 Nov 2026).
 *
 *  - Earlier visits: the SAME list the doctor sees under "Old Pres" (PrescriptionAdvice/GetOldAppointentData,
 *    already loaded by the EMR), and for each visit its full saved prescription (PrescriptionAdvice/GetPrescription -
 *    the data the page loads when the doctor opens an old visit): complaint, history, examination, vitals,
 *    diagnosis, medicines, investigations, advice, notes, next visit.
 *  - Lab results and radiology reports: ChatportAI/GetPatientOPDPrescriptions -> ai_sp_GetPatientLabReport
 *    (lab values per department, and the radiology report text from patient_labobservation_opd_text).
 *
 * Reads only - nothing is saved, no call is made to UpdateCall, and these requests do not show the page
 * spinner. Identifiers (names, IDs, phone, address) are removed before anything reaches the AI.
 * One load per visit is shared by all tabs (module cache keyed by the current visit).
 */
import moment from "moment";
import makeApiRequest from "../networkServices/axiosInstance";
import { apiUrls } from "../networkServices/apiEndpoints";
import { apiUrlsNew } from "../networkServices/newApiEndpoints";
import { scrubHistory, str } from "./aiClinicalLogic";

const MAX_VISITS = 12;
const PER_VISIT_CHARS = 2600;

/* ------------------------------------------------------------------------------------------ */
/* Pure helpers (tested)                                                                       */

/** An "Old Pres" row -> ids + label. valueFieldDesc/valueField are '#'-joined keys/values. */
export const parseOldVisit = (item) => {
  if (!item) return null;
  const keys = String(item.valueFieldDesc ?? "").split("#");
  const values = String(item.valueField ?? "").split("#");
  const map = {};
  keys.forEach((k, i) => {
    if (k) map[k.trim()] = values[i];
  });
  const label = str(item.textField, 160);
  const m = label.match(/(\d{1,2}-[A-Za-z]{3}-\d{4})(?:\s+(\d{1,2}:\d{2}\s*[AP]M))?/);
  const doctor = (label.match(/\bOF\s+(.+)$/i) || [])[1] || "";
  const date = m ? moment(`${m[1]} ${m[2] || ""}`.trim(), ["DD-MMM-YYYY hh:mm A", "DD-MMM-YYYY"]) : null;
  return {
    patientID: map.PatientID || "",
    transactionID: map.TransactionID || "",
    appID: map.App_ID || map.AppID || "",
    type: /^\s*emg|emergency/i.test(label) ? "emg" : /^\s*ipd/i.test(label) ? "ipd" : "opd",
    label,
    dateLabel: date?.isValid() ? date.format("DD MMM YYYY") : m?.[1] || "",
    sortKey: date?.isValid() ? date.valueOf() : 0,
    doctor: doctor.trim(),
    isCurrent: Number(item.isCurrent) === 1,
  };
};

const VISIT_KEYS = [
  "chiefComplaint",
  "historyOfPresentIllness",
  "progressionComplaint",
  "clinicalExamination",
  "generalExamination",
  "cns",
  "cvs",
  "rs",
  "pa",
  "ent",
  "vitalSign",
  "provisionalDiagnosis",
  "allergies",
  "medicines",
  "medications",
  "investigations",
  "procedures",
  "doctorAdvice",
  "doctorAdditionalAdvice",
  "doctorNotes",
  "doctorRemarks",
  "diet",
  "personalHistory",
  "surgicalHistory",
  "familyHistoryRemarks",
  "nextVisit",
  "nextVisitRemarks",
];

/** A saved prescription -> the clinical parts only, identifiers removed, size capped. */
export const compactVisit = (data) => {
  if (!data || typeof data !== "object") return null;
  const lower = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  const picked = {};
  VISIT_KEYS.forEach((k) => {
    const v = data[k] ?? lower[k.toLowerCase()];
    if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)) picked[k] = v;
  });
  if (!Object.keys(picked).length) return null;
  const json = scrubHistory(picked, PER_VISIT_CHARS);
  return json === "{}" || json === "[]" ? null : json;
};

const stripHtml = (html) =>
  String(html ?? "")
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

/**
 * ai_sp_GetPatientLabReport rows -> lab panels ("Name:value | ...") and radiology reports (text).
 * Radiology is told apart by its department name or by an HTML/long text body.
 */
export const splitLabRows = (rows) => {
  const labs = [];
  const imaging = [];
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    const dept = str(r?.Department ?? r?.department, 60);
    const sub = str(r?.SubDepartment ?? r?.subDepartment, 80);
    const date = str(r?.ResultDate ?? r?.resultDate, 20);
    const body = String(r?.Tests ?? r?.tests ?? "");
    if (!body.trim()) return;
    const isImaging = /radio|imaging|x-?ray|ultra|sono|ct\b|mri|usg|echo/i.test(`${dept} ${sub}`) || (/<[a-z]/i.test(body) && !/\|/.test(body));
    if (isImaging) {
      const text = stripHtml(body);
      if (text) imaging.push({ study: sub || dept, date, report: text.slice(0, 2500) });
    } else {
      const results = body
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          const i = p.indexOf(":");
          return i > 0 ? { name: str(p.slice(0, i), 80), value: str(stripHtml(p.slice(i + 1)), 60) } : null;
        })
        .filter((x) => x && x.name && x.value);
      if (results.length) labs.push({ panel: sub || dept, department: dept, date, results: results.slice(0, 60) });
    }
  });
  const byDate = (a, b) => moment(b.date, "DD-MM-YYYY").valueOf() - moment(a.date, "DD-MM-YYYY").valueOf();
  return { labs: labs.sort(byDate).slice(0, 25), imaging: imaging.sort(byDate).slice(0, 10) };
};

/* ------------------------------------------------------------------------------------------ */
/* Loader                                                                                      */

const quiet = async (url, options) => {
  try {
    return await makeApiRequest(url, options);
  } catch (e) {
    return null;
  }
};

/** Runs fns with at most `limit` at a time. */
const pool = async (items, limit, fn) => {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
};

const cache = new Map();

/**
 * @param patient    patientDetail.currentPatient
 * @param oldVisits  apiData.getOldAppointentDataAPI (the "Old Pres" list)
 * @param visitType  "opd" | "emg"
 * @returns {{ visits: [{label,dateLabel,doctor,detail}], visitCount, labs, imaging, historyForAI: string, labsForAI: object }}
 */
export const loadPatientRecord = ({ patient, oldVisits, visitType = "opd" }) => {
  const key = `${patient?.PatientID}|${patient?.TransactionID}|${(oldVisits || []).length}`;
  if (cache.has(key)) return cache.get(key);
  const promise = (async () => {
    const list = (Array.isArray(oldVisits) ? oldVisits : [])
      .map(parseOldVisit)
      .filter((v) => v && v.transactionID && !v.isCurrent && String(v.transactionID) !== String(patient?.TransactionID))
      .sort((a, b) => b.sortKey - a.sortKey)
      .slice(0, MAX_VISITS);

    const [details, labResp] = await Promise.all([
      pool(list, 4, async (v) => {
        const res = await quiet(`${apiUrls.GetPrescription}`, {
          method: "POST",
          data: { patientID: v.patientID || patient?.PatientID, transactionID: v.transactionID, appID: v.appID, Type: v.type === "emg" ? "emg" : visitType },
        });
        return compactVisit(res?.data);
      }),
      patient?.PatientID
        ? quiet(
            `${apiUrlsNew.GetPatientOPDPrescriptions}?PatientID=${encodeURIComponent(patient.PatientID)}&FromDate=${moment().subtract(3, "years").format("YYYY-MM-DD")}&ToDate=${moment().format("YYYY-MM-DD")}`,
            { method: "GET" },
          )
        : null,
    ]);

    const visits = list.map((v, i) => ({ label: v.label, dateLabel: v.dateLabel, doctor: v.doctor, detail: details[i] })).filter((v) => v.dateLabel || v.detail);
    const resp = labResp?.response ?? labResp?.data ?? labResp ?? {};
    const { labs, imaging } = splitLabRows(resp?.LabReports ?? resp?.labReports ?? []);

    // What the model reads: one block per visit, newest first, scrubbed of identifiers (the doctor's
    // name stays on screen only).
    const historyForAI = visits.length
      ? visits.map((v) => `VISIT ${v.dateLabel}: ${v.detail || "(no details saved)"}`).join("\n")
      : scrubHistory(resp?.OPDDetails ?? resp?.opdDetails ?? []);
    return { visits, visitCount: list.length, labs, imaging, historyForAI, labsForAI: { labPanels: labs, radiologyReports: imaging } };
  })();
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
};
