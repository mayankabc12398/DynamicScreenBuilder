/**
 * AI Assistance on the doctor EMR (Scribe, Safety and Analysis tabs) - the logic with no React and no
 * network in it, so it can be tested on its own. The model calls are in aiClinicalAI.js, the tabs in
 * components/Doctor/AIClinicalTools, shown inside the existing AI Assistance panel (layouts/Chatbot/AIPatientSummary).
 *
 * What lives here: the clinical context sent to the AI (never a name, UHID, phone or address), vital-sign
 * flags, making every AI answer safe to render (normalize*), and merging what the doctor accepts into the
 * prescription's own tag state without mutating it.
 */
import { PRESCRIBED_MEDICINE } from "./constant";
import { medicineKey } from "./prescriptionSuggestLogic";

export const str = (v, limit = 400) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > limit ? `${s.slice(0, limit - 1)}…` : s;
};
const list = (v) => (Array.isArray(v) ? v : []);
const strings = (v, limit = 200, max = 8) =>
  list(v)
    .map((x) => str(typeof x === "string" ? x : x?.text ?? x?.name ?? "", limit))
    .filter(Boolean)
    .slice(0, max);
const pct = (v) => {
  const n = Number(String(v ?? "").replace("%", ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(0, Math.min(100, n > 0 && n <= 1 ? n * 100 : n)));
};
const oneOf = (v, allowed, fallback) => {
  const s = str(v).toLowerCase();
  return allowed.find((a) => a.toLowerCase() === s) ?? fallback;
};

/** The model's text as JSON, tolerating a ```json fence or chatter around the object. */
export const parseJson = (raw) => {
  const cleaned = String(raw || "")
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw e;
  }
};

/* ------------------------------------------------------------------------------------------ */
/* Context                                                                                     */

const tagTexts = (tags, key) =>
  list(tags?.[key])
    .map((item) => item?.ValueField ?? item?.value ?? item)
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => v.trim());

const splitWords = (...values) => [
  ...new Set(
    values
      .flatMap((a) => (Array.isArray(a) ? a : [a]))
      .flatMap((a) => String(a ?? "").split(/[,;\n]+/))
      .map((a) => a.trim())
      .filter((a) => a && !/^(no|nil|none|nka|nkda|na|n\/a|-)$/i.test(a)),
  ),
];

/** Medicines on the grid, as the AI needs them (filled rows only). */
export const medicinesOnGrid = (tags) =>
  list(tags?.["Prescribed Medicine"])
    .filter((row) => row && !Array.isArray(row) && (row?.Name?.value || row?.Name?.ID))
    .map((row) => ({
      name: str(row?.Name?.value, 120),
      generic: str(row?.Name?.Generic ?? row?.AllItemListData?.Generic, 120),
      dose: str(row?.Dose?.value, 60),
      frequency: str(row?.Time?.value, 40),
      duration: str(row?.Duration?.value, 40),
      route: str(row?.Route?.value, 40),
    }));

export const bmiOf = (wt, ht) => {
  const w = Number(wt);
  const h = Number(ht) / 100;
  if (!(w > 0) || !(h > 0.3)) return "";
  const b = w / (h * h);
  return b > 5 && b < 90 ? b.toFixed(1) : "";
};

/**
 * Clinical context only. Age, sex, vitals, allergies and what the doctor has written so far - no name,
 * UHID, phone, address, doctor or visit id: they add nothing to an answer and have no business leaving
 * the building.
 */
export const buildClinicalContext = ({ patient = {}, vitals = {}, tags = {}, form = {} } = {}) => ({
  age: str(patient?.Age, 40),
  sex: str(patient?.Gender ?? patient?.Sex, 20),
  weightKg: str(vitals?.wt, 10),
  heightCm: str(vitals?.ht, 10),
  bmi: bmiOf(vitals?.wt, vitals?.ht),
  vitals: {
    temperatureF: str(vitals?.t, 10),
    pulse: str(vitals?.p, 10),
    respiratoryRate: str(vitals?.respiratory, 10),
    bp: str(vitals?.bp, 15),
    spO2: str(vitals?.spO2, 10),
  },
  allergies: splitWords(tagTexts(tags, "Allergies"), vitals?.allergy, form?.Allergies),
  chiefComplaint: tagTexts(tags, "Chief Complaint"),
  signsAndSymptoms: tagTexts(tags, "Sign & Symptoms"),
  historyOfPresentIllness: str(form?.historyOfPresentIllness, 1500),
  generalExamination: tagTexts(tags, "General Examination"),
  systemicExamination: [
    ...tagTexts(tags, "Systematic Examination"),
    ...["CNS", "CVS", "RS", "PA", "ENT"].filter((k) => str(form?.[k])).map((k) => `${k}: ${str(form[k], 200)}`),
  ],
  provisionalDiagnosis: tagTexts(tags, "Provisional Diagnosis"),
  pastHistory: tagTexts(tags, "Past History"),
  treatmentHistory: tagTexts(tags, "Treatment History"),
  familyHistory: tagTexts(tags, "Family History"),
  riskFactors: tagTexts(tags, "Risk Factor"),
  currentMedicines: medicinesOnGrid(tags),
  investigationsOrdered: tagTexts(tags, "Investigation(Lab & Radio)"),
  advice: tagTexts(tags, "Doctor Advice"),
  notes: tagTexts(tags, "Doctor Notes"),
});

/** True when the doctor has written nothing clinical yet (the AI then leans on history). */
export const isContextEmpty = (ctx) =>
  !ctx ||
  ![
    ctx.chiefComplaint,
    ctx.signsAndSymptoms,
    ctx.provisionalDiagnosis,
    ctx.currentMedicines,
    ctx.generalExamination,
  ].some((a) => a?.length) && !ctx.historyOfPresentIllness;

const SENSITIVE = /^(patient_?id|patientname|pname|p_name|uhid|mrno|mr_no|contact|contactno|mobile|mobileno|phone|email|address|house|street|city|pincode|aadhar|aadhaar|pan|passport|doctorid|doctorname|dname|appointmentid|app_?id|transactionid|transaction_id|ipno|opdno|billno|relative|relation|kin|guardian|photo|patientphoto|signature|.*url)$/i;

/** Earlier visits for the model: identifiers and empty values removed, capped in size. */
export const scrubHistory = (raw, maxChars = 24000) => {
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk).filter((x) => x !== undefined);
    if (v && typeof v === "object") {
      const out = {};
      Object.entries(v).forEach(([k, val]) => {
        if (SENSITIVE.test(k)) return;
        const w = walk(val);
        if (w === undefined || w === null || w === "" || (Array.isArray(w) && !w.length)) return;
        if (typeof w === "object" && !Array.isArray(w) && !Object.keys(w).length) return;
        out[k] = w;
      });
      return out;
    }
    if (typeof v === "string") return v.trim() ? v.trim().slice(0, 600) : undefined;
    return v;
  };
  const data = raw?.data ?? raw;
  const json = JSON.stringify(walk(data) ?? []);
  return json.length > maxChars ? `${json.slice(0, maxChars)} …(older history cut)` : json;
};

/** Lab trends (PatientLabReport/GetTrends) reduced to what the model needs: name, unit, readings, flag. */
export const labsForAI = (trends, maxParams = 40) =>
  list(trends?.parameters)
    .slice(0, maxParams)
    .map((p) => ({
      test: str(p?.name, 80),
      unit: str(p?.unit ?? p?.points?.[p.points.length - 1]?.unit, 20),
      readings: list(p?.points)
        .slice(-6)
        .map((pt) => `${pt?.date ?? ""}: ${pt?.value ?? pt?.num ?? ""}${pt?.flag && pt.flag !== "N" ? ` (${pt.flag})` : ""}`),
    }))
    .filter((p) => p.test && p.readings.length);

/* ------------------------------------------------------------------------------------------ */
/* Vital-sign flags (adult thresholds; a prompt to look, not a diagnosis)                      */

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** One chip per vital: { key, label, value, unit, level: "danger" | "warn" | "ok" | "none" }. */
export const vitalFlags = (vitals = {}) => {
  const out = [];
  const add = (key, label, value, unit, level) => out.push({ key, label, value: str(value, 15), unit, level });
  const t = num(vitals.t);
  // Temperature may be typed in °C on some sites; anything under 50 is read as Celsius.
  const tf = t == null ? null : t < 50 ? t * 1.8 + 32 : t;
  add("t", "Temp", vitals.t, t != null && t < 50 ? "°C" : "°F", tf == null ? "none" : tf >= 102.2 || tf < 95 ? "danger" : tf >= 100.4 ? "warn" : "ok");
  const p = num(vitals.p);
  add("p", "Pulse", vitals.p, "/min", p == null ? "none" : p > 120 || p < 45 ? "danger" : p > 100 || p < 55 ? "warn" : "ok");
  const rr = num(vitals.respiratory);
  add("respiratory", "Resp", vitals.respiratory, "/min", rr == null ? "none" : rr >= 30 || rr < 8 ? "danger" : rr > 20 ? "warn" : "ok");
  const s = num(vitals.spO2);
  add("spO2", "SpO₂", vitals.spO2, "%", s == null ? "none" : s < 92 ? "danger" : s < 95 ? "warn" : "ok");
  const bp = String(vitals.bp ?? "").match(/(\d{2,3})\s*[/\\-]\s*(\d{2,3})/);
  const sys = bp ? Number(bp[1]) : null;
  const dia = bp ? Number(bp[2]) : null;
  add(
    "bp",
    "BP",
    vitals.bp,
    "mmHg",
    sys == null ? "none" : sys >= 180 || dia >= 120 || sys < 90 ? "danger" : sys >= 140 || dia >= 90 ? "warn" : "ok",
  );
  const b = num(bmiOf(vitals.wt, vitals.ht));
  add("wt", "Weight", vitals.wt, "kg", num(vitals.wt) == null ? "none" : "ok");
  add("bmi", "BMI", b == null ? "" : b.toFixed(1), "", b == null ? "none" : b >= 30 || b < 18.5 ? "warn" : "ok");
  return out;
};

/* ------------------------------------------------------------------------------------------ */
/* Normalisers - every field present, strings trimmed, lists capped                            */

const SPEAKERS = ["Doctor", "Patient", "Attendant"];

export const normalizeScribe = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  const n = r.note && typeof r.note === "object" ? r.note : r;
  const days = Math.round(Number(n.followUpDays ?? n.followUp?.days));
  return {
    transcript: list(r.transcript)
      .map((l) => ({ speaker: oneOf(l?.speaker, SPEAKERS, "Doctor"), text: str(l?.text, 600) }))
      .filter((l) => l.text)
      .slice(0, 200),
    bullets: strings(r.bullets ?? r.summary, 160, 6),
    note: {
      chiefComplaint: strings(n.chiefComplaint, 160, 6),
      historyOfPresentIllness: str(n.historyOfPresentIllness ?? n.hpi, 1500),
      signsAndSymptoms: strings(n.signsAndSymptoms ?? n.symptoms, 120, 10),
      generalExamination: strings(n.generalExamination, 200, 8),
      systemicExamination: strings(n.systemicExamination, 200, 8),
      pastHistory: strings(n.pastHistory, 160, 6),
      provisionalDiagnosis: list(n.provisionalDiagnosis ?? n.diagnoses)
        .map((d) => (typeof d === "string" ? { name: str(d, 120), icd10: "", confidence: null } : { name: str(d?.name, 120), icd10: str(d?.icd10 ?? d?.code, 12), confidence: pct(d?.confidence) }))
        .filter((d) => d.name)
        .slice(0, 5),
      investigations: list(n.investigations)
        .map((i) => ({ name: str(typeof i === "string" ? i : i?.name, 120), kind: /radio|imag|x-?ray|scan|mri|ct|ultra|usg|echo/i.test(str(i?.kind ?? i)) ? "Radiology" : "Lab" }))
        .filter((i) => i.name)
        .slice(0, 10),
      medicines: list(n.medicines)
        .map((m) => ({
          name: str(m?.name, 120),
          dose: str(m?.dose, 60),
          frequency: str(m?.frequency, 40),
          meal: str(m?.meal, 40),
          duration: str(m?.duration, 40),
          route: str(m?.route, 40),
          remarks: str(m?.remarks, 200),
        }))
        .filter((m) => m.name)
        .slice(0, 10),
      advice: strings(n.advice, 200, 8),
      notes: strings(n.notes, 180, 6),
      followUpDays: Number.isFinite(days) && days >= 1 && days <= 365 ? days : null,
    },
  };
};

export const normalizeBrief = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    snapshot: str(r.snapshot, 900),
    timeline: list(r.timeline)
      .map((v) => ({ date: str(v?.date, 30), text: str(v?.text ?? v?.summary, 260) }))
      .filter((v) => v.text)
      .slice(0, 8),
    trends: list(r.trends)
      .map((tr) => ({
        name: str(tr?.name, 60),
        unit: str(tr?.unit, 20),
        note: str(tr?.note, 200),
        points: list(tr?.points)
          .map((p) => ({ date: str(p?.date, 30), value: num(p?.value) }))
          .filter((p) => p.value != null)
          .slice(-12),
      }))
      .filter((tr) => tr.name && tr.points.length >= 2)
      .slice(0, 6),
    differentials: list(r.differentials)
      .map((d) => ({ name: str(d?.name, 120), percent: pct(d?.percent ?? d?.likelihood) ?? 0, reason: str(d?.reason, 200) }))
      .filter((d) => d.name)
      .slice(0, 5),
    careGaps: strings(r.careGaps, 220, 6),
    redFlags: strings(r.redFlags, 220, 6),
  };
};

const SEVERITY = ["Major", "Moderate", "Minor"];

export const normalizeSafety = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  const score = r.score && typeof r.score === "object" ? r.score : null;
  return {
    interactions: list(r.interactions)
      .map((x) => ({
        drugs: strings(x?.drugs, 80, 4),
        severity: oneOf(x?.severity, SEVERITY, "Moderate"),
        effect: str(x?.effect, 400),
        options: list(x?.options)
          .map((o) => ({
            label: str(o?.label, 120),
            action: oneOf(o?.action, ["remove", "replace", "none"], "none"),
            medicine: str(o?.medicine, 120),
            replacement: o?.replacement && typeof o.replacement === "object"
              ? {
                  name: str(o.replacement.name, 120),
                  dose: str(o.replacement.dose, 60),
                  frequency: str(o.replacement.frequency, 40),
                  meal: str(o.replacement.meal, 40),
                  duration: str(o.replacement.duration, 40),
                  route: str(o.replacement.route, 40),
                  remarks: "",
                }
              : null,
          }))
          .filter((o) => o.label)
          .slice(0, 3),
      }))
      .filter((x) => x.drugs.length >= 1 && x.effect)
      .slice(0, 8),
    allergy: list(r.allergyConflicts ?? r.allergy)
      .map((a) => ({ medicine: str(a?.medicine, 120), allergen: str(a?.allergen, 80), note: str(a?.note, 240) }))
      .filter((a) => a.medicine)
      .slice(0, 6),
    doseAlerts: list(r.doseAlerts)
      .map((d) => ({ medicine: str(d?.medicine, 120), note: str(d?.note, 300) }))
      .filter((d) => d.note)
      .slice(0, 8),
    score: score && str(score.name)
      ? {
          name: str(score.name, 60),
          value: str(score.value, 20),
          interpretation: str(score.interpretation, 300),
          criteria: list(score.criteria)
            .map((c) => ({ name: str(c?.name, 40), met: c?.met === true || /^(true|yes|1)$/i.test(str(c?.met)) }))
            .filter((c) => c.name)
            .slice(0, 8),
        }
      : null,
    passed: strings(r.passed ?? r.checksPassed, 200, 6),
  };
};

export const ORGANS = ["brain", "eyes", "heart", "lungs", "liver", "gut", "kidneys", "metabolic", "blood", "bones", "skin", "feet"];
const STATUSES = ["danger", "warn", "ok", "none"];
const PRIORITY = ["High", "Medium", "Routine"];

export const normalizeInsights = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  const course = r.course && typeof r.course === "object" ? r.course : {};
  return {
    headline: str(r.headline, 300),
    organs: list(r.organs)
      .map((o) => ({
        key: oneOf(o?.key, ORGANS, ""),
        status: oneOf(o?.status, STATUSES, "none"),
        metric: str(o?.metric, 80),
        detail: str(o?.detail, 400),
      }))
      .filter((o) => o.key)
      .slice(0, ORGANS.length),
    risks: list(r.risks)
      .map((k) => ({
        name: str(k?.name, 80),
        percent: pct(k?.percent),
        level: oneOf(k?.level, ["High", "Moderate", "Low"], "Moderate"),
        basis: str(k?.basis, 160),
        drivers: list(k?.drivers)
          .map((d) => ({ factor: str(d?.factor, 80), weight: Math.max(-5, Math.min(5, Number(d?.weight) || 0)) }))
          .filter((d) => d.factor && d.weight)
          .slice(0, 7),
      }))
      .filter((k) => k.name && k.percent != null)
      .slice(0, 4),
    course: {
      summary: str(course.summary, 400),
      expectedDays: Math.max(0, Math.min(365, Math.round(Number(course.expectedDays) || 0))) || null,
      checkpoints: list(course.checkpoints)
        .map((c) => ({ day: Math.max(0, Math.min(365, Math.round(Number(c?.day) || 0))), label: str(c?.label, 120) }))
        .filter((c) => c.label)
        .sort((a, b) => a.day - b.day)
        .slice(0, 6),
      returnCriteria: strings(course.returnCriteria, 160, 6),
    },
    options: list(r.options)
      .map((o) => ({
        name: str(o?.name, 140),
        recommended: o?.recommended === true,
        efficacy: str(o?.efficacy, 60),
        interactions: str(o?.interactions, 120),
        sideEffects: str(o?.sideEffects, 120),
        cost: str(o?.cost, 40),
        pillsPerDay: str(o?.pillsPerDay, 20),
        why: str(o?.why, 300),
        medicines: list(o?.medicines)
          .map((m) => ({ name: str(m?.name, 120), dose: str(m?.dose, 60), frequency: str(m?.frequency, 40), meal: str(m?.meal, 40), duration: str(m?.duration, 40), route: str(m?.route, 40), remarks: "" }))
          .filter((m) => m.name)
          .slice(0, 5),
      }))
      .filter((o) => o.name)
      .slice(0, 3),
    actions: list(r.actions)
      .map((a) => ({
        priority: oneOf(a?.priority, PRIORITY, "Routine"),
        text: str(a?.text, 200),
        why: str(a?.why, 220),
        kind: oneOf(a?.kind, ["advice", "note", "investigation"], "note"),
      }))
      .filter((a) => a.text)
      .slice(0, 7),
    voice: list(r.patientVoice)
      .map((v) => ({ quote: str(v?.quote, 240), meaning: str(v?.meaning, 240) }))
      .filter((v) => v.quote && v.meaning)
      .slice(0, 4),
    disposition: normalizeDisposition(r.disposition),
    simulator: normalizeSimulator(r.simulator),
  };
};

/* ------------------------------------------------------------------------------------------ */
/* Where to treat                                                                              */

const SETTINGS = ["Home", "Day care", "Observation", "Admission", "ICU"];

export const normalizeDisposition = (raw) => {
  const d = raw && typeof raw === "object" ? raw : null;
  if (!d) return null;
  const setting = oneOf(d.setting, SETTINGS, "");
  if (!setting) return null;
  return {
    setting,
    review: str(d.review, 80),
    reason: str(d.reason, 300),
    escalateIf: strings(d.escalateIf, 160, 5),
  };
};

/* ------------------------------------------------------------------------------------------ */
/* What-if simulator                                                                           */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * The AI gives the outcome, today's risk and how much each modifiable factor moves it (log-odds per
 * unit, or per switch for yes/no factors); the browser recomputes the risk as the doctor moves the
 * sliders. Anything inconsistent (min >= max, current outside the range, no effect) is dropped.
 */
export const normalizeSimulator = (raw) => {
  const s = raw && typeof raw === "object" ? raw : null;
  if (!s) return null;
  const base = Number(s.baselinePercent);
  if (!str(s.outcome) || !(base > 0 && base < 100)) return null;
  const factors = list(s.factors)
    .map((f) => {
      const min = Number(f?.min);
      const max = Number(f?.max);
      const step = Number(f?.step) > 0 ? Number(f.step) : 1;
      const current = Number(f?.current);
      const perUnit = Number(f?.perUnit);
      if (![min, max, current, perUnit].every(Number.isFinite) || min >= max || !perUnit) return null;
      const target = Number(f?.target);
      return {
        key: str(f?.key || f?.label, 30).replace(/[^A-Za-z0-9_]/g, "_"),
        label: str(f?.label, 50),
        unit: str(f?.unit, 15),
        min,
        max,
        step,
        current: clamp(current, min, max),
        target: Number.isFinite(target) ? clamp(target, min, max) : clamp(current, min, max),
        perUnit: clamp(perUnit, -3, 3),
      };
    })
    .filter((f) => f && f.label)
    .slice(0, 5);
  const toggles = list(s.toggles)
    .map((g) => ({
      key: str(g?.key || g?.label, 30).replace(/[^A-Za-z0-9_]/g, "_"),
      label: str(g?.label, 60),
      on: g?.on === true,
      target: g?.target === true,
      effect: clamp(Number(g?.effect) || 0, -3, 3),
    }))
    .filter((g) => g.label && g.effect)
    .slice(0, 4);
  if (!factors.length && !toggles.length) return null;
  return { outcome: str(s.outcome, 80), basis: str(s.basis, 120), baselinePercent: base, factors, toggles };
};

const logit = (p) => Math.log(p / (1 - p));
const expit = (x) => 1 / (1 + Math.exp(-x));

/** Values -> risk %. `values` holds slider numbers and toggle booleans by key; missing ones = today. */
export const simulateRisk = (sim, values = {}) => {
  if (!sim) return null;
  let x = logit(sim.baselinePercent / 100);
  sim.factors.forEach((f) => {
    const v = Number.isFinite(Number(values[f.key])) ? clamp(Number(values[f.key]), f.min, f.max) : f.current;
    x += f.perUnit * (v - f.current);
  });
  sim.toggles.forEach((g) => {
    const on = typeof values[g.key] === "boolean" ? values[g.key] : g.on;
    x += g.effect * ((on ? 1 : 0) - (g.on ? 1 : 0));
  });
  return clamp(expit(x) * 100, 0.1, 99.9);
};

export const simulatorToday = (sim) =>
  sim ? Object.fromEntries([...sim.factors.map((f) => [f.key, f.current]), ...sim.toggles.map((g) => [g.key, g.on])]) : {};
export const simulatorTargets = (sim) =>
  sim ? Object.fromEntries([...sim.factors.map((f) => [f.key, f.target]), ...sim.toggles.map((g) => [g.key, g.target])]) : {};

/* ------------------------------------------------------------------------------------------ */
/* AI tools (Tools tab)                                                                        */

const ITEM_KINDS = ["diagnosis", "investigation", "advice", "note", "info"];

/** { title, summary, items: [{ text, detail, kind, code }] } - kind decides where "Add" puts it. */
export const normalizeTool = (raw) => {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    title: str(r.title, 120),
    summary: str(r.summary, 900),
    items: list(r.items)
      .map((i) => ({
        text: str(i?.text, 240),
        detail: str(i?.detail, 400),
        kind: oneOf(i?.kind, ITEM_KINDS, "info"),
        code: str(i?.code, 12),
        level: oneOf(i?.level, ["High", "Medium", "Low", ""], ""),
      }))
      .filter((i) => i.text)
      .slice(0, 12),
    caution: str(r.caution, 300),
  };
};

/* ------------------------------------------------------------------------------------------ */
/* Merge into the prescription                                                                 */

/**
 * A pure merge of accepted items into a copy of the tags. Nothing is mutated and nothing is counted as a
 * side effect, so it can run once to know what was new (for the message) and once inside setTags (which
 * React may call twice) with the same answer.
 *
 * @param base       current tags
 * @param texts      { [tagCategory]: string[] } - one tag each, never the same text twice
 * @param investigationTags  ready tags for "Investigation(Lab & Radio)"
 * @param medicineRows       rows built by buildMedicineRow
 * @param removeMedicines    medicine names to take off the grid (case-insensitive name or id match)
 */
export const mergeIntoTags = (base, { texts = {}, investigationTags = [], medicineRows = [], removeMedicines = [] } = {}) => {
  const next = { ...(base || {}) };
  const counts = { med: 0, inv: 0, text: 0, removed: 0 };

  Object.entries(texts).forEach(([category, values]) => {
    const add = list(values).map((v) => str(v, 400)).filter(Boolean);
    if (!add.length) return;
    const existing = [...list(next[category])];
    const seen = new Set(existing.map((x) => String(x?.ValueField ?? x?.value ?? "").trim().toLowerCase()));
    add.forEach((v) => {
      const key = v.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      existing.push({ ValueField: v });
      counts.text += 1;
    });
    next[category] = existing;
  });

  if (investigationTags.length) {
    const existing = [...list(next["Investigation(Lab & Radio)"])];
    const seen = new Set(
      existing.flatMap((x) => [String(x?.ID ?? ""), String(x?.ValueField ?? "").trim().toLowerCase()]).filter(Boolean),
    );
    investigationTags.forEach((tag) => {
      const keys = [String(tag.ID ?? ""), String(tag.ValueField ?? "").trim().toLowerCase()].filter(Boolean);
      if (!keys.length || keys.some((k) => seen.has(k))) return;
      keys.forEach((k) => seen.add(k));
      existing.push(tag);
      counts.inv += 1;
    });
    next["Investigation(Lab & Radio)"] = existing;
  }

  if (medicineRows.length || removeMedicines.length) {
    const drop = new Set(removeMedicines.map((m) => String(m ?? "").trim().toLowerCase()).filter(Boolean));
    const nameHit = (row) => {
      const n = String(row?.Name?.value ?? "").toLowerCase();
      const g = String(row?.Name?.Generic ?? row?.AllItemListData?.Generic ?? "").toLowerCase();
      return [...drop].some((d) => (n && (n.includes(d) || d.includes(n))) || (g && (g.includes(d) || d.includes(g))));
    };
    // The grid keeps one blank entry row at the end; new rows go in front of it.
    const filled = list(next["Prescribed Medicine"]).filter((row) => row && !Array.isArray(row) && (row?.Name?.value || row?.Name?.ID));
    const kept = filled.filter((row) => !(drop.size && nameHit(row)));
    counts.removed = filled.length - kept.length;
    const seen = new Set(kept.map(medicineKey).filter(Boolean));
    medicineRows.forEach((row) => {
      const key = medicineKey(row);
      if (key && seen.has(key)) return;
      seen.add(key);
      kept.push(row);
      counts.med += 1;
    });
    kept.push({ ...PRESCRIBED_MEDICINE });
    next["Prescribed Medicine"] = kept;
  }
  return { next, counts };
};

/** "J18.9 Community-acquired pneumonia" - how a diagnosis with a code is written into the tag. */
export const diagnosisText = (d) => (d?.icd10 ? `${d.name} (${d.icd10})` : d?.name || "");
