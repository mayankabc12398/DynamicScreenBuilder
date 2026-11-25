/**
 * AI prescription suggestion - the logic that has no React and no network in it, so it can be
 * tested on its own. The model call is in prescriptionSuggestAI.js, the popup in
 * components/Doctor/AIPrescriptionSuggestModal.jsx.
 *
 * What lives here: tidying the model's answer into a shape the popup can trust, turning a
 * suggested medicine / investigation into the exact row the prescription grid keeps, and
 * matching a suggested name to the hospital's own masters.
 */

const MAX = { diagnoses: 4, medicines: 8, investigations: 8, advice: 6, notes: 4, flags: 6 };

const str = (v, limit = 400) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > limit ? `${s.slice(0, limit - 1)}…` : s;
};
const list = (v) => (Array.isArray(v) ? v : []);
const strings = (v, limit) => list(v).map((x) => str(x, limit)).filter(Boolean);

/** The model's JSON, made safe: every field present, strings trimmed, every list capped. */
export const normalizeSuggestion = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  const prediction = r.prediction && typeof r.prediction === "object" ? r.prediction : {};
  const followRaw = r.followUp && typeof r.followUp === "object" ? r.followUp : {};
  const days = Math.round(Number(followRaw.days));

  return {
    summary: str(r.summary, 500),
    diagnoses: list(r.diagnoses)
      .map((d) => ({
        name: str(d?.name, 120),
        likelihood: ["High", "Medium", "Low"].includes(str(d?.likelihood)) ? str(d?.likelihood) : "Medium",
        reasoning: str(d?.reasoning, 300),
      }))
      .filter((d) => d.name)
      .slice(0, MAX.diagnoses),
    prediction: {
      expectedCourse: str(prediction.expectedCourse, 400),
      prognosis: str(prediction.prognosis, 300),
      timeToRecovery: str(prediction.timeToRecovery, 120),
      complications: strings(prediction.complications, 160).slice(0, MAX.flags),
      redFlags: strings(prediction.redFlags, 200).slice(0, MAX.flags),
    },
    medicines: list(r.medicines)
      .map((m) => ({
        name: str(m?.name, 120),
        dose: str(m?.dose, 60),
        frequency: str(m?.frequency, 40),
        meal: str(m?.meal, 40),
        duration: str(m?.duration, 40),
        route: str(m?.route, 40),
        remarks: str(m?.remarks, 200),
        rationale: str(m?.rationale, 240),
      }))
      .filter((m) => m.name)
      .slice(0, MAX.medicines),
    investigations: list(r.investigations)
      .map((i) => ({
        name: str(i?.name, 120),
        kind: /radio|imag|x-?ray|scan|mri|ct|ultra/i.test(str(i?.kind)) ? "Radiology" : "Lab",
        reason: str(i?.reason, 240),
      }))
      .filter((i) => i.name)
      .slice(0, MAX.investigations),
    advice: strings(r.advice, 200).slice(0, MAX.advice),
    notes: strings(r.notes, 180).slice(0, MAX.notes),
    followUp: {
      days: Number.isFinite(days) && days >= 1 && days <= 365 ? days : null,
      reason: str(followRaw.reason, 200),
    },
    warnings: strings(r.warnings, 240).slice(0, MAX.flags),
  };
};

/* ------------------------------------------------------------------------------------ */

/** "5 Days", "2 weeks", "1 month", "10d" -> days. Open-ended wording ("continue") -> null. */
export const parseDurationDays = (text) => {
  const m = String(text ?? "").match(/(\d+(?:\.\d+)?)\s*(days?|d|weeks?|wks?|w|months?|mo|m)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("w")) return Math.round(n * 7);
  if (unit.startsWith("mo") || unit === "m") return Math.round(n * 30);
  return Math.round(n);
};

/** "1-0-1" -> 2, "TDS" -> 3, "BD" -> 2, "OD" -> 1, "4 times a day" -> 4. 0 when it cannot tell (SOS, unclear). */
export const perDayFromFrequency = (text) => {
  const raw = String(text ?? "").trim();
  if (!raw) return 0;
  const dashed = raw.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?$/);
  if (dashed) return dashed.slice(1).filter((x) => x !== undefined).reduce((a, b) => a + Number(b), 0);
  const t = raw.toLowerCase();
  const times = t.match(/(\d+)\s*(x|times)/);
  if (times) return Number(times[1]);
  if (/\bqid\b|\bqds\b|four times/.test(t)) return 4;
  if (/\btid\b|\btds\b|thrice|three times/.test(t)) return 3;
  if (/\bbid\b|\bbd\b|twice|two times/.test(t)) return 2;
  if (/\bod\b|\bhs\b|once|daily|bedtime|\bqd\b/.test(t)) return 1;
  return 0;
};

/* ------------------------------------------------------------------------------------ */

const tokens = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

/**
 * How much of the SUGGESTED name is found in a master name (0..1). Every word of the
 * suggestion has to appear, so "Paracetamol 500 mg" matches "PARACETAMOL 500 MG" fully and
 * "Paracetamol 650 mg" only partly - a different strength is never passed off as a match.
 */
export const nameScore = (suggested, masterName) => {
  const a = tokens(suggested);
  if (!a.length) return 0;
  const b = new Set(tokens(masterName));
  return a.filter((t) => b.has(t)).length / a.length;
};

/** Best master row for a suggested name, or null when nothing is close enough. */
export const bestMatch = (suggested, rows, nameOf, threshold = 0.75) => {
  let best = null;
  (rows || []).forEach((row) => {
    const name = nameOf(row);
    const score = nameScore(suggested, name);
    if (score < threshold) return;
    if (
      !best ||
      score > best.score ||
      (score === best.score && String(name).length < String(nameOf(best.row)).length)
    ) {
      best = { row, score };
    }
  });
  return best?.row ?? null;
};

/* ------------------------------------------------------------------------------------ */

/**
 * The exact row the Prescribed Medicine grid keeps. `master` is the item-master row the
 * grid's own name search returns (Brand, ItemID, Typename, Generic ...) or null when the
 * medicine is not in the master - then it is added as typed, the way a doctor typing a name
 * and pressing Enter does, and the pharmacy sees a medicine without an item id.
 *
 * Time and Duration carry a Factor (doses a day, days) because that is what the grid's
 * quantity sum multiplies; Quantity is only set when both are known.
 */
export const buildMedicineRow = (med, master) => {
  const perDay = perDayFromFrequency(med.frequency);
  const days = parseDurationDays(med.duration);
  const quantity = perDay > 0 && days > 0 ? perDay * days : null;

  return {
    Name: master
      ? {
          value: master.Brand,
          ID: master.ItemID,
          isDisable: true,
          Typename: master.Typename,
          Generic: master.Generic,
        }
      : { value: med.name, isDisable: true },
    Dose: { value: med.dose || master?.Dose || "" },
    Time: { value: med.frequency || "", ...(perDay > 0 ? { Factor: perDay } : {}) },
    Duration: { value: med.duration || "", ...(days > 0 ? { Factor: days } : {}) },
    Meal: { value: med.meal || "" },
    Route: { value: med.route || master?.Route || "" },
    Remarks: { value: med.remarks || "" },
    ...(quantity ? { Quantity: { value: quantity } } : {}),
    AllItemListData: master || {},
  };
};

/** A medicine already on the grid (same item id, or same typed name) is not added twice. */
export const medicineKey = (row) =>
  String(row?.Name?.ID ?? row?.Name?.value ?? "")
    .trim()
    .toLowerCase();

/**
 * Allergy words found in a suggestion. A plain word match on purpose: it is a prompt to
 * look twice, not a verdict, so it errs on the side of flagging.
 */
export const allergyHits = (allergies, ...texts) => {
  const words = list(allergies)
    .flatMap((a) => String(a ?? "").split(/[,;/\n]+/))
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3 && !/^(no|nil|none|nka|nkda|na|n\/a)$/.test(w));
  if (!words.length) return [];
  const haystack = texts.join(" ").toLowerCase();
  return [...new Set(words.filter((w) => haystack.includes(w)))];
};

/** Next visit date as the page keeps it: DD-MMM-YYYY. */
export const nextVisitDate = (days, from = new Date()) => {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

/* ------------------------------------------------------------------------------------ */
/* The doctor's own pattern (DoctorPracticePattern/SimilarCases): counts for patients like this one */

/** "40 Y, 5 M 3 D/M" -> 40.42, "6 MONTHS" -> 0.5, "10 DAYS" -> 0.03, "40" -> 40, "" -> null. */
export const parseAgeYears = (text) => {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  let years = 0;
  let found = false;
  const re = /(\d+(?:\.\d+)?)\s*(years?|yrs?|y|months?|mo|m|days?|d)\b/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    found = true;
    if (unit.startsWith("y")) years += n;
    else if (unit.startsWith("mo") || unit === "m") years += n / 12;
    else years += n / 365;
  }
  if (found) return Math.round(years * 100) / 100;
  const plain = Number(raw);
  return Number.isFinite(plain) && plain >= 0 ? plain : null;
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** The pattern answer made safe: every list present, numbers numeric. Null when absent or not enough cases. */
export const normalizePattern = (raw) => {
  if (!raw || typeof raw !== "object" || !raw.enough) return null;
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    matchedPatients: num(raw.matchedPatients),
    matchedVisits: num(raw.matchedVisits),
    ageFrom: raw.ageFrom == null ? null : num(raw.ageFrom),
    ageTo: raw.ageTo == null ? null : num(raw.ageTo),
    medicines: arr(raw.medicines)
      .map((m) => ({
        name: str(m?.name, 120),
        itemId: m?.itemId == null || m.itemId === "" ? null : String(m.itemId),
        patients: num(m?.patients),
        share: num(m?.share),
        dose: str(m?.dose, 60),
        frequency: str(m?.frequency, 40),
        meal: str(m?.meal, 40),
        duration: str(m?.duration, 40),
        route: str(m?.route, 40),
      }))
      .filter((m) => m.name),
    tests: arr(raw.tests)
      .map((t) => ({
        name: str(t?.name, 120),
        testId: t?.testId == null || t.testId === "" ? null : String(t.testId),
        kind: t?.kind === "Procedure" ? "Procedure" : "Test",
        patients: num(t?.patients),
        share: num(t?.share),
      }))
      .filter((t) => t.name),
    advice: arr(raw.advice).map((a) => ({ text: str(a?.text, 240), patients: num(a?.patients), share: num(a?.share) })).filter((a) => a.text),
    notes: arr(raw.notes).map((a) => ({ text: str(a?.text, 240), patients: num(a?.patients), share: num(a?.share) })).filter((a) => a.text),
    followUp: raw.followUp && num(raw.followUp.days) > 0 ? { days: num(raw.followUp.days), cases: num(raw.followUp.cases) } : null,
  };
};

/** "9 of 14 similar patients" */
export const patternShareText = (item, pattern) => `${item.patients} / ${pattern.matchedPatients}`;

/** The pattern entry for a medicine name (by item id when the suggestion carries one, else by name), or null. */
export const matchPatternMedicine = (name, pattern, itemId) => {
  if (!pattern) return null;
  if (itemId) {
    const byId = pattern.medicines.find((m) => m.itemId && String(m.itemId) === String(itemId));
    if (byId) return byId;
  }
  return bestMatch(name, pattern.medicines, (m) => m.name);
};

/**
 * What of the pattern may be passed to the AI model: medicine and test names with the percentage
 * of similar patients they were used for, and the usual dosing. NEVER the advice or note wording
 * (free text, shown on screen only) and nothing per patient - there is nothing per patient in a
 * pattern to begin with.
 */
export const patternForAI = (pattern) =>
  pattern
    ? {
        similarPatients: pattern.matchedPatients,
        ageRangeYears: pattern.ageFrom == null ? "" : `${Math.round(pattern.ageFrom)}-${Math.round(pattern.ageTo)}`,
        medicines: pattern.medicines.slice(0, 8).map((m) => ({
          name: m.name,
          percentOfPatients: Math.round(m.share * 100),
          dose: m.dose,
          frequency: m.frequency,
          meal: m.meal,
          duration: m.duration,
        })),
        tests: pattern.tests.slice(0, 8).map((t) => ({ name: t.name, percentOfPatients: Math.round(t.share * 100) })),
        usualFollowUpDays: pattern.followUp?.days ?? null,
      }
    : null;
