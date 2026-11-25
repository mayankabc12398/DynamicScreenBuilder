import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Modal from "../modalComponent/Modal";
// Animated warning icon for the Drug Alerts button (generated, 22x22, transparent).
import drugAlertGif from "../../assets/image/drug-alert.gif";
import DrugInteractionWidget, {
  lookupInteractions,
  getGeminiInteractions,
  getGeminiDiseaseContraindications,
  getGeminiAllergyInteractions,
  getGeminiLabAlerts,
  getGeminiPregnancyAlerts,
  splitPatientDiagnoses,
  splitPatientAllergies,
  extractPatientAllergies,
} from "../../layouts/Chatbot/DrugInteractionWidget";
import {
  GetPatientOPDPrescriptions,
  GetPatientDiagnosis,
} from "../../networkServices/DoctorApi";
import {
  loadRecentLabContext,
  patientMetaLine,
} from "../../utils/patientLabContext";
import { loadPregnancyContext } from "../../utils/patientPregnancyContext";

/**
 * Pharmacy Issue — drug vs disease / allergy / organ-function / pregnancy alert while
 * issuing (KMSI A3, A5, A6, A8 on the pharmacy side).
 *
 * THE ASK
 *   The doctor's prescription page checks every medicine it adds against the patient's
 *   diagnoses, allergies, recent lab results and pregnancy status through the Drug
 *   Interaction Checker. The pharmacist issuing medicine has no such check. So: when a
 *   medicine is added to the issue grid, look up what the doctor module captured for this
 *   patient in the last N days (default 7) - provisional diagnoses, final ICD diagnoses,
 *   past history, allergies - plus the last 30 days of liver / kidney related lab results
 *   and the pregnancy / obstetric status recorded on the latest visit, and if the AI flags
 *   anything, open the very same checker popup the doctor sees, with the Drug Information
 *   drawer (dose by kidney function, pregnancy categories, warnings) and the high-risk
 *   acknowledgement panel. A "Drug Alerts" button beside the Medication Calendar runs the
 *   full check on demand for everything in the grid.
 *
 * FLAGS
 *   fin_global_resources  PharmacyDrugDiseaseAlert = 1   turns the whole thing on (opt-in).
 *   fin_global_resources  DrugLabFunctionAlert     = 0   switches the lab leg off.
 *   fin_global_resources  DrugPregnancyAlert       = 0   switches the pregnancy leg off.
 *   (the last two are the same switches the doctor page uses.)
 *   Flag off: renders nothing, makes no request, changes nothing.
 *
 * PATIENT SIDE
 *   1. Doctor/GetPatientOPDPrescriptions for the last N days - one record per visit; any
 *      field whose name mentions diagnosis, ICD or history is collected (the row shape
 *      varies by client, so this is by field-name pattern, not a fixed list), the
 *      Allergies field the checker already reads, and the latest visit's ids for step 4.
 *   2. GetPatientDiagnosis (saved ICD rows) as a second source, kept only when the row
 *      carries a date inside the window.
 *   3. utils/patientLabContext.js - last 30 days of labs through the app's own lab
 *      result APIs, plus Cockcroft-Gault creatinine clearance from the pharmacy
 *      vitals (weight) and the patient's age / sex.
 *   4. utils/patientPregnancyContext.js - the Pregnant vital and obstetric block of the
 *      latest visit (GetPrescription), for female patients of childbearing age.
 *
 * NOTHING OPENS ON ITS OWN HERE. Unlike the doctor page, the pharmacy popup is opened only
 * by the Drug Alerts button (client decision, 2026-09-18: a popup that appears while
 * issuing is hard to close). The button checks everything in the grid at once. Every run
 * writes one "[PharmacyDrugAlert]" line to the console saying what was loaded and what
 * came back, so "nothing happened" can be read from DevTools without guessing.
 *
 * Mounted on /pharmacy-issue and /ipd-pharmacy-issue beside the Medication Calendar.
 */

export const PHARMACY_DISEASE_ALERT_FLAG = "PharmacyDrugDiseaseAlert";
export const LAB_ALERT_FLAG = "DrugLabFunctionAlert";
export const PREGNANCY_ALERT_FLAG = "DrugPregnancyAlert";
export const DEFAULT_LOOKBACK_DAYS = 7;
export const LAB_LOOKBACK_DAYS = 30;

const resourceList = (globalResources) =>
  Array.isArray(globalResources)
    ? globalResources
    : globalResources?.data || [];

const offSwitch = (list, name) => {
  const row = list?.find((item) => item?.Name === name);
  return !row || String(row?.Value).trim() !== "0";
};

export const usePharmacyDiseaseAlertFlag = () => {
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  return useMemo(() => {
    const list = resourceList(GetGlobalResources);
    return {
      enabled:
        list?.find((item) => item?.Name === PHARMACY_DISEASE_ALERT_FLAG)?.Value == 1,
      labEnabled: offSwitch(list, LAB_ALERT_FLAG),
      pregnancyEnabled: offSwitch(list, PREGNANCY_ALERT_FLAG),
    };
  }, [GetGlobalResources]);
};

const DIAGNOSIS_FIELD = /diagnos|icd|pasthistory|past_history|disease|comorbid/i;
// Description candidates in preference order; the bare ICD code is the last resort so a
// row with both a code and a description reads "description (ICD code)".
const TEXT_FIELDS = [
  "WHO_Full_Desc",
  "ICDDesc",
  "IcdDesc",
  "Desc",
  "Description",
  "Diagnosis",
  "Name",
  "Value",
  "ValueField",
  "Text",
  "ICD",
];

/** Turn one value (string, array, object) from a visit record into diagnosis strings. */
const collectText = (value, depth = 0) => {
  if (value === null || value === undefined || depth > 4) return [];
  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }
  if (Array.isArray(value)) return value.flatMap((v) => collectText(v, depth + 1));
  if (typeof value === "object") {
    const desc = TEXT_FIELDS.map((f) => value[f]).find(
      (v) => typeof v === "string" && v.trim(),
    );
    const code =
      typeof value.ICD === "string" && value.ICD.trim() && desc !== value.ICD
        ? value.ICD.trim()
        : "";
    if (desc) return [code ? `${desc.trim()} (ICD ${code})` : desc.trim()];
    return Object.values(value).flatMap((v) => collectText(v, depth + 1));
  }
  return [];
};

/**
 * Diagnosis strings from one doctor-module visit record. Exported for tests.
 * Keys are matched by name so the varying per-client row shapes all work.
 */
export const extractDiagnosisText = (record) => {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record)
    .filter(([key]) => DIAGNOSIS_FIELD.test(key))
    .flatMap(([, value]) => collectText(value));
};

const rowDate = (row) =>
  [
    row?.EntryDate,
    row?.CreatedDate,
    row?.Date,
    row?.DiagnosisDate,
    row?.AppointmentDate,
    row?.entryDate,
    row?.VisitDate,
  ]
    .map((v) => (v ? moment(v) : null))
    .find((m) => m && m.isValid()) || null;

/** The ids of the most recent visit row, for the pregnancy lookup. */
const latestVisitIds = (visitRows, patientID) => {
  const rows = [...visitRows].sort(
    (a, b) => (rowDate(b)?.valueOf() || 0) - (rowDate(a)?.valueOf() || 0),
  );
  const v = rows[0];
  if (!v) return null;
  return {
    patientID,
    transactionID: v?.TransactionID ?? v?.transactionID ?? v?.TID ?? "",
    appID: v?.App_ID ?? v?.AppID ?? v?.AppointmentID ?? v?.appID ?? "",
    type: "opd",
  };
};

/**
 * Everything the doctor module captured about this patient in the window:
 * `{ diagnoses: string[], allergies: string[], visits: number, latestVisit }`.
 * Failures in either source are logged and skipped; the other still counts.
 */
export const loadRecentPatientContext = async (patient, lookbackDays) => {
  const patientID = patient?.PatientID;
  const empty = { diagnoses: [], allergies: [], visits: 0, latestVisit: null };
  if (!patientID) return empty;
  const from = moment().subtract(lookbackDays, "days").startOf("day");
  const to = moment().endOf("day");
  const diagnoses = [];
  let allergies = [];
  let visits = 0;
  let latestVisit = null;

  try {
    const resp = await GetPatientOPDPrescriptions(
      String(patientID),
      from.format("YYYY-MM-DD"),
      to.format("YYYY-MM-DD"),
    );
    const body = resp?.response ?? resp?.data ?? resp ?? {};
    const list = body?.OPDDetails ?? body?.opdDetails ?? [];
    const visitRows = Array.isArray(list) ? list : [];
    visits = visitRows.length;
    visitRows.forEach((visit) => diagnoses.push(...extractDiagnosisText(visit)));
    allergies = extractPatientAllergies(resp);
    latestVisit = latestVisitIds(visitRows, patientID);
  } catch (error) {
    console.error("[PharmacyDrugAlert] OPD prescriptions lookup failed:", error);
  }

  try {
    const resp = await GetPatientDiagnosis({
      patientID,
      transactionID: patient?.TransactionID || "",
      appID: "",
    });
    const rows = Array.isArray(resp?.data) ? resp.data : [];
    rows.forEach((row) => {
      const when = rowDate(row);
      if (!when || when.isBefore(from) || when.isAfter(to)) return;
      diagnoses.push(...collectText(row));
    });
  } catch (error) {
    console.error("[PharmacyDrugAlert] saved ICD lookup failed:", error);
  }

  return {
    diagnoses: splitPatientDiagnoses(diagnoses),
    allergies: splitPatientAllergies(allergies),
    visits,
    latestVisit,
  };
};

const medicineItemsOf = (medicines) =>
  (Array.isArray(medicines) ? medicines : [])
    .map((m) => ({
      name: String(m?.ItemName || m?.MedicineName || m?.Name || "").trim(),
      itemID: m?.ItemID ?? m?.ItemId ?? "",
      generic: m?.Generic ?? m?.Composition ?? m?.GenericName ?? "",
      // Product row of the AI drug monograph: what this hospital sells it as.
      mrp: m?.MRP ?? m?.majormrp ?? "",
      unitType: m?.UnitType ?? "",
    }))
    .filter((m) => m.name);

const EMPTY_CONTEXT = { diagnoses: [], allergies: [], visits: 0, latestVisit: null };

function PharmacyDiseaseAlert({
  patient,
  medicines,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  labLookbackDays = LAB_LOOKBACK_DAYS,
  respclass = "col-xl-2 col-md-3 col-sm-4 col-12",
}) {
  const [t] = useTranslation();
  const { enabled, labEnabled, pregnancyEnabled } = usePharmacyDiseaseAlertFlag();
  const patientID = patient?.PatientID;

  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [context, setContext] = useState(EMPTY_CONTEXT);
  const [labContext, setLabContext] = useState(null);
  const [pregnancy, setPregnancy] = useState(null);
  const [acks, setAcks] = useState({});
  const [checking, setChecking] = useState(false);

  const contextRef = useRef({ key: "", value: null });
  const labRef = useRef({ key: "", value: null });
  const pregRef = useRef({ key: "", value: null });
  const runRef = useRef(0);

  const items = medicineItemsOf(medicines);
  const names = items.map((m) => m.name);
  const namesJoined = names.join(", ");

  // New patient: forget what was shown and what was loaded for the previous one.
  useEffect(() => {
    contextRef.current = { key: "", value: null };
    labRef.current = { key: "", value: null };
    pregRef.current = { key: "", value: null };
    setContext(EMPTY_CONTEXT);
    setLabContext(null);
    setPregnancy(null);
    setAcks({});
    setResults(null);
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID]);

  const getContext = async () => {
    const key = `${patientID}|${lookbackDays}`;
    if (contextRef.current.key === key && contextRef.current.value) {
      return contextRef.current.value;
    }
    const value = await loadRecentPatientContext(patient, lookbackDays);
    contextRef.current = { key, value };
    setContext(value);
    return value;
  };

  const getLabContext = async () => {
    if (!labEnabled) return null;
    const key = `${patientID}|${labLookbackDays}|${patient?.Vital || ""}`;
    if (labRef.current.key === key && labRef.current.value) {
      return labRef.current.value;
    }
    const value = await loadRecentLabContext(patient, { days: labLookbackDays });
    labRef.current = { key, value };
    setLabContext(value);
    return value;
  };

  const getPregnancy = async () => {
    if (!pregnancyEnabled) return null;
    const ctx = await getContext();
    const key = `${patientID}|${JSON.stringify(ctx.latestVisit || {})}`;
    if (pregRef.current.key === key && pregRef.current.value) {
      return pregRef.current.value;
    }
    const value = await loadPregnancyContext(patient, { visit: ctx.latestVisit });
    pregRef.current = { key, value };
    setPregnancy(value);
    return value;
  };

  /**
   * Check `drugs` against the patient's diagnoses, allergies, recent labs and pregnancy
   * status. Opens the popup when there is something the pharmacist has not seen yet (or
   * always, when `force`).
   */
  const runCheck = async (drugs, { force = false } = {}) => {
    const ticket = ++runRef.current;
    setChecking(true);
    try {
      const [ctx, labCtx, pregCtx] = await Promise.all([
        getContext(),
        getLabContext(),
        getPregnancy(),
      ]);
      if (ticket !== runRef.current) return;

      // Drug-drug interactions, same order as the checker: local table first, AI second.
      let matches = [];
      if (drugs.length >= 2) {
        try {
          matches = lookupInteractions(drugs);
          if (!matches.length) matches = await getGeminiInteractions(drugs);
        } catch (error) {
          console.error("[PharmacyDrugAlert] interaction check failed:", error);
        }
      }
      let diseaseMatches = [];
      let allergyMatches = [];
      let labMatches = [];
      let pregnancyMatches = [];
      if (drugs.length && ctx.diagnoses.length) {
        diseaseMatches = await getGeminiDiseaseContraindications(drugs, ctx.diagnoses);
      }
      if (drugs.length && ctx.allergies.length) {
        allergyMatches = await getGeminiAllergyInteractions(drugs, ctx.allergies);
      }
      if (drugs.length && labCtx?.lines?.length) {
        labMatches = await getGeminiLabAlerts(
          drugs,
          labCtx.lines,
          patientMetaLine(labCtx.meta),
        );
      }
      if (drugs.length && pregCtx?.applicable && pregCtx?.line) {
        pregnancyMatches = await getGeminiPregnancyAlerts(drugs, pregCtx.line);
      }
      if (ticket !== runRef.current) return;

      const all = [
        ...matches,
        ...diseaseMatches,
        ...allergyMatches,
        ...labMatches,
        ...pregnancyMatches,
      ];

      console.info(
        `[PharmacyDrugAlert] ${patientID} last ${lookbackDays}d: ${ctx.visits} visit(s), ` +
          `diagnoses=[${ctx.diagnoses.join("; ")}] allergies=[${ctx.allergies.join(", ")}] ` +
          `labs(${labLookbackDays}d)=[${(labCtx?.lines || []).join(" | ")}] ` +
          `pregnancy=[${pregCtx?.line || "n/a"}] ` +
          `checked=[${drugs.join(", ")}] -> interactions=${matches.length} disease=${diseaseMatches.length} allergy=${allergyMatches.length} lab=${labMatches.length} pregnancy=${pregnancyMatches.length}`,
      );

      if (force || all.length) {
        setResults({
          matches,
          diseaseMatches,
          allergyMatches,
          labMatches,
          pregnancyMatches,
          numDrugs: names.length,
        });
        setOpen(true);
      }
    } catch (error) {
      console.error("[PharmacyDrugAlert] check failed:", error);
    } finally {
      if (ticket === runRef.current) setChecking(false);
    }
  };

  // No automatic check on the pharmacy side (client decision, 2026-09-18): the popup is
  // hard to dismiss mid-issue, so it opens only from the Drug Alerts button below.

  if (!enabled || !patientID) return null;

  const labCount = labContext?.labs?.length || 0;
  const pregCount = pregnancy?.applicable ? 1 : 0;
  const contextCount =
    context.diagnoses.length + context.allergies.length + labCount + pregCount;
  // Findings from the last run: the button turns red and shows this number so the
  // pharmacist sees "there is something" without reopening the popup.
  const alertCount = results
    ? (results.matches?.length || 0) +
      (results.allergyMatches?.length || 0) +
      (results.diseaseMatches?.length || 0) +
      (results.labMatches?.length || 0) +
      (results.pregnancyMatches?.length || 0)
    : 0;
  const allFindings = results
    ? [
        ...(results.matches || []),
        ...(results.allergyMatches || []),
        ...(results.diseaseMatches || []),
        ...(results.labMatches || []),
        ...(results.pregnancyMatches || []),
      ]
    : [];
  const countSeverity = (s) =>
    allFindings.filter((m) => String(m?.severity || "").toLowerCase() === s).length;
  const highCount = countSeverity("high");
  const mediumCount = countSeverity("moderate");
  /* Button colour follows the medical alarm-priority convention (IEC 60601-1-8):
     red = high priority, yellow = medium, cyan = low / information, and green once a
     check has run and found nothing. Before any check the button is cyan (information). */
  const alertTone = !results
    ? ""
    : highCount > 0
      ? "high"
      : mediumCount > 0
        ? "medium"
        : alertCount > 0
          ? "low"
          : "clear";
  const hoverText = contextCount
    ? `${t("Diagnoses")}: ${context.diagnoses.join("; ") || "-"} | ${t("Allergies")}: ${
        context.allergies.join(", ") || "-"
      } | ${t("Labs")}: ${labCount ? (labContext?.lines || []).join("; ") : "-"}${
        pregnancy?.applicable ? ` | ${pregnancy.line}` : ""
      }`
    : t(
        "Check the medicines being issued against the patient's recent diagnoses, allergies, lab results and pregnancy status",
      );

  return (
    <div className={respclass}>
      <button
        type="button"
        className={`btn btn-sm rx-med-calendar-btn rx-drug-alert-btn${
          alertTone ? " rx-drug-alert-btn--" + alertTone : ""
        }`}
        title={
          alertCount > 0
            ? `${alertCount} ${t("alert(s) found")}${
                highCount ? ` (${highCount} ${t("high risk")})` : ""
              }: ${t("interactions")} ${results.matches?.length || 0}, ${t("allergy")} ${
                results.allergyMatches?.length || 0
              }, ${t("disease")} ${results.diseaseMatches?.length || 0}, ${t("lab")} ${
                results.labMatches?.length || 0
              }, ${t("pregnancy")} ${results.pregnancyMatches?.length || 0}. ${t(
                "Click to open",
              )}.`
            : hoverText
        }
        disabled={checking || !names.length}
        onClick={() => runCheck(names, { force: true })}
      >
        <img src={drugAlertGif} alt="" className="rx-drug-alert-btn__gif" />
        {checking ? t("Checking...") : t("Alerts")}
        {alertCount > 0 ? (
          <span className="rx-med-calendar-btn__count rx-drug-alert-btn__count">
            {alertCount}
          </span>
        ) : (
          contextCount > 0 && (
            <span className="rx-med-calendar-btn__count">{contextCount}</span>
          )
        )}
      </button>

      {open && (
        <Modal
          visible={open}
          setVisible={setOpen}
          modalWidth={"80vw"}
          Header={t("💊 Drug Interaction Checker")}
          footer={<></>}
        >
          <DrugInteractionWidget
            open={open}
            setOpen={setOpen}
            initialMedicines={namesJoined}
            initialResults={results}
            patientDetails={patient}
            initialAllergies={context.allergies.join(", ")}
            initialDiagnoses={context.diagnoses.join("; ")}
            loadPatientDiagnoses={async () => (await getContext()).diagnoses}
            loadPatientLabs={labEnabled ? getLabContext : null}
            loadPatientPregnancy={pregnancyEnabled ? getPregnancy : null}
            medicineItems={items}
            onAcknowledge={(next) => setAcks(next)}
          />
        </Modal>
      )}
    </div>
  );
}

export default PharmacyDiseaseAlert;
