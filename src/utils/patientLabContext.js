import moment from "moment";
import { buildLabData } from "../components/modalComponent/Utils/Emergency/EmergencyLabResults";

/**
 * Liver / kidney function context for the drug alerts (KMSI A5).
 *
 * THE ASK
 *   "No eGFR, creatinine-clearance, or dose-adjustment logic anywhere." The drug alert
 *   popup checks drug-drug, drug-allergy and drug-disease; nothing looks at the patient's
 *   organ function. So: pull the last 30 days of lab results, keep the parameters that
 *   matter for dosing (renal, hepatic, electrolytes, coagulation, key haematology), work
 *   out creatinine clearance from weight, age and sex, and hand all of it to the same AI
 *   check so it can say "this drug needs a dose adjustment / is contraindicated at this
 *   kidney function" with the actual value and date as evidence.
 *
 * SOURCE
 *   buildLabData() from the Emergency lab results panel - the proven two-step flow the
 *   app already uses (patient lab records, then LabObservationSearch per record), with
 *   the same flag rules the lab technician sees. Nothing new is invented here.
 *
 * OUTPUT (loadRecentLabContext)
 *   {
 *     labs:  [{ key, group, name, value, numValue, unit, range, flag, isAbnormal,
 *               isCritical, date }]   latest value per relevant parameter
 *     meta:  { ageYears, sex, weightKg }
 *     crcl:  { value, label } | null   Cockcroft-Gault, when creatinine+weight+age+sex known
 *     lines: string[]                  one human-readable line per lab (+ CrCl), for the
 *                                      prompt and the on-screen strip
 *     from, to, recordCount, valueCount
 *   }
 */

export const ORGAN_FUNCTION_PARAMS = [
  // renal
  { key: "creatinine", group: "Renal", pattern: /\bcreatinine\b(?!.*(urine|clearance|ratio))/i },
  { key: "egfr", group: "Renal", pattern: /\begfr\b|glomerular/i },
  { key: "urea", group: "Renal", pattern: /\burea\b(?!.*urine)|\bbun\b|blood urea/i },
  { key: "uric_acid", group: "Renal", pattern: /uric\s*acid/i },
  // hepatic
  { key: "bilirubin_total", group: "Hepatic", pattern: /bilirubin.*total|total.*bilirubin|^bilirubin$/i },
  { key: "bilirubin_direct", group: "Hepatic", pattern: /bilirubin.*direct|direct.*bilirubin/i },
  { key: "alt", group: "Hepatic", pattern: /\bsgpt\b|\balt\b|alanine/i },
  { key: "ast", group: "Hepatic", pattern: /\bsgot\b|\bast\b|aspartate/i },
  { key: "alp", group: "Hepatic", pattern: /alkaline\s*phosphatase|\balp\b/i },
  { key: "ggt", group: "Hepatic", pattern: /\bggt\b|gamma\s*gt|glutamyl/i },
  { key: "albumin", group: "Hepatic", pattern: /\balbumin\b(?!.*urine)/i },
  // coagulation
  { key: "inr", group: "Coagulation", pattern: /\binr\b/i },
  { key: "pt", group: "Coagulation", pattern: /prothrombin|\bpt\b(?!t)/i },
  // electrolytes
  { key: "potassium", group: "Electrolytes", pattern: /potassium|\bk\+?\b(?!.*urine)/i },
  { key: "sodium", group: "Electrolytes", pattern: /sodium|\bna\+?\b(?!.*urine)/i },
  { key: "calcium", group: "Electrolytes", pattern: /\bcalcium\b(?!.*urine)/i },
  { key: "magnesium", group: "Electrolytes", pattern: /magnesium/i },
  // haematology / glucose
  { key: "platelet", group: "Haematology", pattern: /platelet/i },
  { key: "hemoglobin", group: "Haematology", pattern: /h[ae]moglobin\b(?!.*a1c)|\bhb\b(?!a1c)/i },
  { key: "wbc", group: "Haematology", pattern: /\bwbc\b|total leu[ck]ocyte|\btlc\b/i },
  { key: "hba1c", group: "Metabolic", pattern: /a1c/i },
  { key: "glucose", group: "Metabolic", pattern: /glucose|blood sugar|\bfbs\b|\brbs\b|\bppbs\b/i },
  { key: "tsh", group: "Metabolic", pattern: /\btsh\b/i },
];

export const matchOrganParam = (name) =>
  ORGAN_FUNCTION_PARAMS.find((p) => p.pattern.test(String(name || "")));

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Age in years, sex and weight from whichever fields the screen's patient object has. */
export const derivePatientMeta = (patient, extra = {}) => {
  const p = patient || {};
  const ageSexText = String(
    p.AgeGender ?? p.AgeSex ?? p.Age_Gender ?? p.ageGender ?? p.Age ?? "",
  );

  let ageYears = null;
  const dob = p.DOB ?? p.dob ?? p.DateOfBirth;
  if (dob && moment(dob).isValid()) {
    ageYears = moment().diff(moment(dob), "years");
  } else if (/^\d+(\.\d+)?$/.test(String(p.Age ?? "").trim())) {
    ageYears = Number(p.Age);
  } else {
    const y = ageSexText.match(/(\d+)\s*Y/i);
    if (y) ageYears = Number(y[1]);
    else if (p.AGE_in_Days) ageYears = Math.floor(Number(p.AGE_in_Days) / 365);
  }

  let sex = String(p.Gender ?? p.Sex ?? p.gender ?? "").trim();
  if (!sex) {
    if (/female|\/\s*F\b/i.test(ageSexText)) sex = "Female";
    else if (/male|\/\s*M\b/i.test(ageSexText)) sex = "Male";
  }
  if (/^f/i.test(sex)) sex = "Female";
  else if (/^m/i.test(sex)) sex = "Male";

  // Pharmacy carries vitals as "height#weight"; the prescription page passes the typed
  // weight through `extra`.
  let weightKg = num(extra.weightKg);
  if (weightKg === null && typeof p.Vital === "string" && p.Vital.includes("#")) {
    weightKg = num(p.Vital.split("#")[1]);
  }
  if (weightKg === null) weightKg = num(p.Weight ?? p.weight);
  if (weightKg !== null && (weightKg <= 0 || weightKg > 400)) weightKg = null;

  return { ageYears, sex, weightKg };
};

/** Cockcroft-Gault creatinine clearance (mL/min). Creatinine in mg/dL. */
export const cockcroftGault = ({ ageYears, weightKg, sex, creatinineMgDl }) => {
  if (
    !Number.isFinite(ageYears) ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(creatinineMgDl) ||
    ageYears <= 0 ||
    weightKg <= 0 ||
    creatinineMgDl <= 0
  ) {
    return null;
  }
  let crcl = ((140 - ageYears) * weightKg) / (72 * creatinineMgDl);
  if (/^f/i.test(sex || "")) crcl *= 0.85;
  return Math.round(crcl * 10) / 10;
};

export const classifyCrCl = (crcl) => {
  if (!Number.isFinite(crcl)) return "";
  if (crcl >= 90) return "normal kidney function";
  if (crcl >= 60) return "mildly reduced kidney function";
  if (crcl >= 30) return "moderately reduced kidney function";
  if (crcl >= 15) return "severely reduced kidney function";
  return "kidney failure range";
};

/** Creatinine may be reported in µmol/L; the formula wants mg/dL. */
const creatinineToMgDl = (value, unit) => {
  if (!Number.isFinite(value)) return null;
  if (/mol/i.test(unit || "")) return Math.round((value / 88.4) * 100) / 100;
  return value;
};

const flagWord = (flag) =>
  flag === "MAXC" || flag === "MINC"
    ? "CRITICAL"
    : flag === "High" || flag === "Low"
      ? flag.toUpperCase()
      : "normal";

export const labLine = (lab) =>
  `${lab.name}: ${lab.value}${lab.unit ? " " + lab.unit : ""}` +
  `${lab.range ? " (ref " + lab.range + ")" : ""} - ${flagWord(lab.flag)}` +
  `${lab.date ? ", " + lab.date : ""}`;

/**
 * @param {object} patient   the screen's patient object (needs PatientID)
 * @param {{ days?: number, weightKg?: number|string }} options
 */
/* buildLabData makes one LabObservationSearch call per lab test. Opening a patient runs the
   drug alerts several times (every change to the medicine list while the saved prescription
   loads, and again when the weight arrives), and each run used to start the whole fetch again
   while the first was still in flight - dozens of identical calls. One fetch per patient and
   date range is now shared by every caller, in flight and for LAB_CACHE_MS after; the weight
   only changes the creatinine clearance, which is computed from the shared result below. */
const LAB_CACHE_MS = 5 * 60 * 1000;
const labDataCache = new Map();

const cachedLabData = (labPatient, fromDate, toDate) => {
  const key = `${labPatient?.PatientID}|${fromDate}|${toDate}`;
  const hit = labDataCache.get(key);
  if (hit && Date.now() - hit.at < LAB_CACHE_MS) return hit.promise;
  const promise = buildLabData(labPatient, fromDate, toDate);
  labDataCache.set(key, { at: Date.now(), promise });
  // Not kept: a failure, or no lab records at all (buildLabData turns a network error into an
  // empty result, and looking for records again is a single cheap request).
  promise.then(
    (data) => {
      if (!data?.recordCount) labDataCache.delete(key);
    },
    () => labDataCache.delete(key),
  );
  // drop entries that have expired so the map does not grow over a long session
  labDataCache.forEach((v, k) => {
    if (Date.now() - v.at >= LAB_CACHE_MS) labDataCache.delete(k);
  });
  return promise;
};

/** For tests. */
export const clearLabContextCache = () => labDataCache.clear();

export const loadRecentLabContext = async (patient, options = {}) => {
  const days = options.days ?? 30;
  const to = moment();
  const from = moment().subtract(days, "days");
  const meta = derivePatientMeta(patient, { weightKg: options.weightKg });
  const empty = {
    labs: [],
    meta,
    crcl: null,
    lines: [],
    from: from.format("DD-MMM-YYYY"),
    to: to.format("DD-MMM-YYYY"),
    recordCount: 0,
    valueCount: 0,
  };
  if (!patient?.PatientID) return empty;

  // buildLabData derives gender / age-in-days from these fields when a lab row lacks them.
  const labPatient = {
    ...patient,
    Gender: patient?.Gender || meta.sex,
    AgeSex: patient?.AgeSex || patient?.AgeGender || patient?.Age_Gender,
  };

  let data;
  try {
    data = await cachedLabData(
      labPatient,
      from.format("YYYY-MM-DD"),
      to.format("YYYY-MM-DD"),
    );
  } catch (error) {
    console.error("[LabContext] lab lookup failed:", error);
    return empty;
  }

  const labs = [];
  const seenKeys = new Set();
  (data?.parameters || []).forEach((param) => {
    const match = matchOrganParam(param.name);
    if (!match || seenKeys.has(match.key)) return;
    const latest = param.latest;
    if (!latest || latest.numValue === null) return;
    seenKeys.add(match.key);
    labs.push({
      key: match.key,
      group: match.group,
      name: param.name,
      value: latest.value,
      numValue: latest.numValue,
      unit: param.unit || latest.unit || "",
      range: param.range || latest.range || "",
      flag: latest.flag || "",
      isAbnormal: !!latest.isAbnormal,
      isCritical: !!latest.isCritical,
      date: latest.dateObj ? latest.dateObj.format("DD-MMM-YYYY") : latest.dateRaw || "",
      testName: latest.testName || "",
    });
  });

  const groupOrder = ["Renal", "Hepatic", "Electrolytes", "Coagulation", "Haematology", "Metabolic"];
  labs.sort(
    (a, b) =>
      groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group) ||
      (b.isCritical - a.isCritical) ||
      (b.isAbnormal - a.isAbnormal),
  );

  let crcl = null;
  const creat = labs.find((l) => l.key === "creatinine");
  if (creat) {
    const mgdl = creatinineToMgDl(creat.numValue, creat.unit);
    const value = cockcroftGault({
      ageYears: meta.ageYears,
      weightKg: meta.weightKg,
      sex: meta.sex,
      creatinineMgDl: mgdl,
    });
    if (value !== null) crcl = { value, label: classifyCrCl(value) };
  }

  const lines = labs.map(labLine);
  if (crcl) {
    lines.push(
      `Estimated creatinine clearance (Cockcroft-Gault): ${crcl.value} mL/min - ${crcl.label}` +
        ` (age ${meta.ageYears}, ${meta.sex || "sex unknown"}, ${meta.weightKg} kg)`,
    );
  }

  return {
    labs,
    meta,
    crcl,
    lines,
    from: from.format("DD-MMM-YYYY"),
    to: to.format("DD-MMM-YYYY"),
    recordCount: data?.recordCount ?? 0,
    valueCount: data?.valueCount ?? 0,
  };
};

/** One line describing the patient for the prompt. */
export const patientMetaLine = (meta) =>
  [
    Number.isFinite(meta?.ageYears) ? `age ${meta.ageYears} years` : "",
    meta?.sex ? meta.sex : "",
    Number.isFinite(meta?.weightKg) ? `weight ${meta.weightKg} kg` : "",
  ]
    .filter(Boolean)
    .join(", ");
