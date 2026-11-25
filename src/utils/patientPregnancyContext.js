import moment from "moment";
import { GetPrescription } from "../networkServices/DoctorApi";
import { derivePatientMeta } from "./patientLabContext";

/**
 * Pregnancy / lactation context for the drug alerts (KMSI A6).
 *
 * THE ASK
 *   "Pregnancy status is captured in vitals, triage and obstetric forms but never read at
 *   ordering time." The prescription page already loads it: GetPrescription returns
 *   `vitalSign.isPregnancy` (the Pregnant flag on Vital Signs) and `pregnancyBasicDetails`
 *   (LMP, EDD, gestational age, delivered status, G/P/L/A from the Menstrual & Obstetric
 *   block). This file turns that into one object the drug checker can use, and one
 *   sentence for the AI prompt.
 *
 * WHO IT APPLIES TO
 *   Female patients aged 10-55. Everyone else gets { applicable: false } and no check.
 *   A female of childbearing age with NO recorded status is still flagged as
 *   "status not recorded" so the AI can warn about drugs that matter in that case.
 *
 * SOURCES (in order)
 *   1. `loadSaveData` when the caller already has it (doctor page) - no request.
 *   2. GetPrescription for the visit ids the caller supplies (pharmacy: the latest visit
 *      from the doctor-module feed, when that feed carries the ids).
 */

const CHILDBEARING_MIN = 10;
const CHILDBEARING_MAX = 55;

const parseDate = (v) => {
  if (!v) return null;
  const m = moment(v);
  return m.isValid() ? m : null;
};

const gestationalWeeksFromLmp = (lmp) => {
  const d = parseDate(lmp);
  if (!d) return null;
  const weeks = moment().diff(d, "weeks");
  return weeks >= 0 && weeks <= 45 ? weeks : null;
};

/** Build the context from a GetPrescription payload (loadSaveData). */
export const pregnancyFromPrescriptionData = (loadSaveData, patient) => {
  const meta = derivePatientMeta(patient);
  const base = {
    applicable: false,
    sex: meta.sex,
    ageYears: meta.ageYears,
    isPregnant: false,
    statusRecorded: false,
    lmp: "",
    edd: "",
    gestationalWeeks: null,
    delivered: false,
    lactationPossible: false,
    gravida: "",
    para: "",
    source: "",
    line: "",
  };

  const female = /^f/i.test(meta.sex || "");
  const ageOk =
    meta.ageYears === null ||
    (meta.ageYears >= CHILDBEARING_MIN && meta.ageYears <= CHILDBEARING_MAX);
  if (!female || !ageOk) return base;

  const ctx = { ...base, applicable: true };
  const vital = loadSaveData?.vitalSign;
  const preg = loadSaveData?.pregnancyBasicDetails;

  if (vital && vital.isPregnancy !== undefined && vital.isPregnancy !== null) {
    ctx.statusRecorded = true;
    ctx.isPregnant = Number(vital.isPregnancy) === 1;
    ctx.source = "Vital Signs";
  }
  if (preg && (preg.lmp || preg.edd || preg.ga || preg.status)) {
    ctx.statusRecorded = true;
    ctx.lmp = preg.lmp ? moment(preg.lmp).format("DD-MMM-YYYY") : "";
    ctx.edd = preg.edd ? moment(preg.edd).format("DD-MMM-YYYY") : "";
    ctx.gestationalWeeks =
      Number(preg.ga) > 0 ? Number(preg.ga) : gestationalWeeksFromLmp(preg.lmp);
    ctx.delivered = Number(preg.status) === 1;
    ctx.gravida = preg.gravida ?? "";
    ctx.para = preg.para ?? "";
    if (!ctx.isPregnant && !ctx.delivered && ctx.gestationalWeeks !== null) {
      ctx.isPregnant = true;
    }
    // Delivered within the last year: breast-feeding is likely; the AI is told to
    // treat lactation as possible.
    const delivery = parseDate(preg.currentPregnancy) || parseDate(preg.edd);
    ctx.lactationPossible =
      ctx.delivered && (!delivery || moment().diff(delivery, "months") <= 12);
    ctx.source = ctx.source
      ? `${ctx.source} + Obstetric record`
      : "Obstetric record";
  }

  ctx.line = pregnancyLine(ctx);
  return ctx;
};

/** One sentence for the prompt and the on-screen strip. */
export const pregnancyLine = (ctx) => {
  if (!ctx?.applicable) return "";
  const who = `Female patient${
    Number.isFinite(ctx.ageYears) ? `, ${ctx.ageYears} years` : ""
  }`;
  if (ctx.isPregnant) {
    const parts = [
      "PREGNANT",
      ctx.gestationalWeeks !== null ? `${ctx.gestationalWeeks} weeks gestation` : "",
      ctx.lmp ? `LMP ${ctx.lmp}` : "",
      ctx.edd ? `EDD ${ctx.edd}` : "",
    ].filter(Boolean);
    return `${who}: ${parts.join(", ")}`;
  }
  if (ctx.lactationPossible) {
    return `${who}: recently delivered, breast-feeding possible`;
  }
  if (ctx.statusRecorded) {
    return `${who}: not pregnant (recorded)`;
  }
  return `${who}: of childbearing potential, pregnancy status NOT recorded`;
};

/**
 * @param {object} patient       screen's patient object (needs sex/age fields)
 * @param {object} options
 *   loadSaveData   the doctor page's GetPrescription payload, if already loaded
 *   visit          { patientID, transactionID, appID } to fetch it with (pharmacy)
 */
export const loadPregnancyContext = async (patient, options = {}) => {
  if (options.loadSaveData) {
    return pregnancyFromPrescriptionData(options.loadSaveData, patient);
  }
  // Nothing to fetch for a patient the check does not apply to.
  const probe = pregnancyFromPrescriptionData(null, patient);
  if (!probe.applicable) return probe;

  const visit = options.visit;
  if (!visit?.patientID || (!visit?.transactionID && !visit?.appID)) return probe;
  try {
    const resp = await GetPrescription({
      patientID: visit.patientID,
      transactionID: visit.transactionID || "",
      appID: visit.appID || "",
      Type: visit.type || "opd",
    });
    if (resp?.success && resp?.data) {
      return pregnancyFromPrescriptionData(resp.data, patient);
    }
  } catch (error) {
    console.error("[PregnancyContext] GetPrescription failed:", error);
  }
  return probe;
};
