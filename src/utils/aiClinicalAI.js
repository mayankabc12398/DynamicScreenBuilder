/**
 * AI Assistance (doctor EMR) - the model calls behind the Scribe, Safety and Analysis tabs. Every call goes
 * through the central AI (utils/aiClient.js -> API AI/Generate), so the key, model and DPDP pseudonymisation
 * are the ones set on EDP > AI Configuration.
 *
 * What is sent is clinical context only (see buildClinicalContext / scrubHistory): never a name, UHID,
 * phone, address or doctor.
 */
import { aiText } from "./aiClient";
import { normalizeBrief, normalizeInsights, normalizeSafety, normalizeScribe, normalizeTool, parseJson } from "./aiClinicalLogic";

const BASE = `You are the hospital's clinical AI assistant, giving decision support to a licensed doctor in an outpatient clinic.
You propose; the doctor decides. Be accurate, concise and practical. Use widely accepted standard-of-care guidance.
Never invent findings, results or history that are not in the data you are given; when something is unknown, say so or leave it out.
Never include a patient identifier (name, ID number, phone, address).`;

const askJson = async (prompt, system, opts = {}) => {
  const raw = await aiText(prompt, { json: true, temperature: 0.2, system: `${BASE}\n${system}`, ...opts });
  return parseJson(raw);
};

const ctxBlock = (ctx) => `TODAY'S VISIT (what the doctor has recorded so far):\n${JSON.stringify(ctx)}`;

/* ------------------------------------------------------------------------------------------ */

const SCRIBE = `You turn a doctor-patient consultation into a structured outpatient note.
Return STRICT JSON only, exactly this shape:
{
 "transcript": [ { "speaker": "Doctor"|"Patient"|"Attendant", "text": string } ],
 "bullets": [string] (max 5 one-line highlights of the visit),
 "note": {
   "chiefComplaint": [string] (short phrases with duration, e.g. "Cough with yellow sputum x 3 days"),
   "historyOfPresentIllness": string (2-5 sentences),
   "signsAndSymptoms": [string],
   "generalExamination": [string] (only findings actually stated),
   "systemicExamination": [string] (only findings actually stated, e.g. "RS: crackles right base"),
   "pastHistory": [string],
   "provisionalDiagnosis": [ { "name": string, "icd10": string, "confidence": integer 0-100 } ],
   "investigations": [ { "name": string (standard test name), "kind": "Lab"|"Radiology" } ],
   "medicines": [ { "name": string (as said, generic or brand with strength), "dose": string, "frequency": string (e.g. "1-0-1", "BD", "TDS", "OD"), "meal": "Before Meal"|"After Meal"|"With Meal"|"Empty Stomach"|"At Bedtime"|"Any Time", "duration": string (e.g. "7 Days"), "route": string, "remarks": string } ],
   "advice": [string] (patient advice that was actually given),
   "notes": [string] (short clinical notes for the record),
   "followUpDays": integer or null
 }
}
Rules: record ONLY what was said or examined in the conversation - do not add medicines, tests or diagnoses that were not mentioned
(a diagnosis the doctor clearly stated or strongly implied may be listed with its ICD-10 code). Write the note in English even when the
conversation is in another language; keep the transcript in the language spoken. If the "transcript" input is already text, clean it into
speaker turns.`;

/** Audio (base64) or typed text in, structured note out. */
export const scribeConsultation = async ({ audioBase64, mimeType, transcriptText, ctx }) => {
  const parts = audioBase64 ? [{ inlineData: { mimeType: (mimeType || "audio/webm").split(";")[0], data: audioBase64 } }] : [];
  const prompt = [
    ctxBlock(ctx),
    audioBase64
      ? "The consultation audio is attached. Transcribe it with speaker labels, then structure the note."
      : `CONSULTATION TRANSCRIPT:\n${String(transcriptText || "").slice(0, 30000)}`,
  ].join("\n\n");
  return normalizeScribe(await askJson(prompt, SCRIBE, { parts, temperature: 0.1 }));
};

/* ------------------------------------------------------------------------------------------ */

const BRIEF = `You write a pre-visit brief from the patient's previous prescriptions, lab results, radiology reports and today's visit.
Return STRICT JSON only:
{
 "snapshot": string (3-4 sentences: who the patient is clinically, long-term conditions, how control has changed, what is happening today),
 "timeline": [ { "date": string (e.g. "12 Aug 2026"), "text": string } ] (most recent first, max 6 meaningful visits/events),
 "trends": [ { "name": string (e.g. "HbA1c", "Systolic BP", "Weight"), "unit": string, "points": [ { "date": string, "value": number } ], "note": string (one line on direction and meaning) } ] (only numbers actually present in the data, max 5, oldest point first),
 "differentials": [ { "name": string, "percent": integer, "reason": string } ] (likely causes of TODAY's presentation; percents add up to at most 100; empty if nothing is recorded today),
 "careGaps": [string] (overdue screening, vaccines, monitoring - only when supported by the data),
 "redFlags": [string] (things in the record the doctor should not miss)
}`;

export const patientBrief = async ({ ctx, history, labs }) =>
  normalizeBrief(
    await askJson(
      [ctxBlock(ctx), `EARLIER VISITS (each previous prescription in full, newest first, identifiers removed):\n${history || "[]"}`, `LAB RESULTS, RADIOLOGY REPORTS AND UPLOADED LAB REPORTS:\n${JSON.stringify(labs || [])}`].join("\n\n"),
      BRIEF,
    ),
  );

/* ------------------------------------------------------------------------------------------ */

const SAFETY = `You check today's prescription for safety.
Return STRICT JSON only:
{
 "interactions": [ { "drugs": [string, string], "severity": "Major"|"Moderate"|"Minor", "effect": string (mechanism and risk in one or two sentences),
     "options": [ { "label": string (a concrete fix, e.g. "Switch clarithromycin to doxycycline 100 mg"), "action": "remove"|"replace"|"none",
                    "medicine": string (the prescribed medicine to remove or replace, exactly as listed),
                    "replacement": { "name": string, "dose": string, "frequency": string, "meal": string, "duration": string, "route": string } or null } ] } ],
 "allergyConflicts": [ { "medicine": string, "allergen": string, "note": string } ],
 "doseAlerts": [ { "medicine": string, "note": string } ] (age, weight, kidney, liver, pregnancy, duplicate therapy, dose above usual maximum),
 "score": { "name": string (the ONE validated bedside score most relevant to today's diagnosis, e.g. CURB-65, qSOFA, Wells, CHA2DS2-VASc, Centor), "value": string, "interpretation": string, "criteria": [ { "name": string (short), "met": boolean } ] } or null when none applies or data is missing,
 "passed": [string] (short lines for checks that found nothing, e.g. "No allergy conflict with sulfonamide allergy")
}
Only report clinically meaningful interactions (no trivia). Include running/long-term medicines named in the history when relevant.`;

export const safetyCheck = async ({ ctx, history }) =>
  normalizeSafety(await askJson([ctxBlock(ctx), `EARLIER VISITS (each previous prescription in full, newest first):\n${history || "[]"}`].join("\n\n"), SAFETY, { temperature: 0.1 }));

/* ------------------------------------------------------------------------------------------ */

const INSIGHTS = `You produce "patient intelligence" for the doctor's AI analysis view.
Return STRICT JSON only:
{
 "headline": string (one sentence: the most important thing about this patient today),
 "organs": [ { "key": "brain"|"eyes"|"heart"|"lungs"|"liver"|"gut"|"kidneys"|"metabolic"|"blood"|"bones"|"skin"|"feet",
               "status": "danger" (active problem today) | "warn" (needs attention / long-term risk) | "ok" (assessed, stable) | "none" (relevant but not assessed),
               "metric": string (the key number or finding, e.g. "SpO2 94%, crackles right base"), "detail": string (2 sentences) } ]
            (only systems the record says something about, or that a known condition makes relevant),
 "risks": [ { "name": string (e.g. "Deterioration in 72 h", "Admission in 30 days", "10-year heart attack or stroke"), "percent": integer 0-100,
              "level": "High"|"Moderate"|"Low", "basis": string (the validated score or evidence used, e.g. "SCORE2-Diabetes", "CURB-65", "clinical estimate"),
              "drivers": [ { "factor": string, "weight": number -5..5 (positive raises risk, negative lowers it) } ] } ] (max 4, only those that matter for this patient),
 "course": { "summary": string (expected course with today's plan), "expectedDays": integer (days to expected recovery or next milestone),
             "checkpoints": [ { "day": integer, "label": string } ], "returnCriteria": [string] (measurable where possible, e.g. "SpO2 below 92%") },
 "options": [ { "name": string, "recommended": boolean (exactly one true), "efficacy": string, "interactions": string (for THIS patient's medicines), "sideEffects": string (for THIS patient),
                "cost": string (relative: "Low"|"Medium"|"High"), "pillsPerDay": string, "why": string,
                "medicines": [ { "name": string, "dose": string, "frequency": string, "meal": string, "duration": string, "route": string } ] } ]
            (2-3 treatment options for today's main diagnosis compared for this patient; empty when there is no diagnosis to treat),
 "actions": [ { "priority": "High"|"Medium"|"Routine", "text": string, "why": string, "kind": "advice"|"note"|"investigation" } ] (next best actions ranked by benefit; investigations as standard test names),
 "patientVoice": [ { "quote": string (the patient's own words from the transcript), "meaning": string (what it means for the conversation) } ] (only if a transcript is given),
 "disposition": { "setting": "Home"|"Day care"|"Observation"|"Admission"|"ICU", "review": string (e.g. "Review in 48-72 h"), "reason": string,
                  "escalateIf": [string] (measurable triggers that change the setting, e.g. "SpO2 below 92%") } or null when there is no acute problem,
 "simulator": { "outcome": string (the long-term outcome that matters most for this patient, e.g. "10-year heart attack or stroke risk"),
                "baselinePercent": number (today's risk, 0.5-95), "basis": string (score or evidence used),
                "factors": [ { "key": string, "label": string (e.g. "HbA1c"), "unit": string, "current": number (today's value from the record), "min": number, "max": number, "step": number,
                               "target": number (guideline target for this patient), "perUnit": number (change in log-odds of the outcome per 1 unit; positive = higher value raises risk) } ] (2-4 modifiable factors that have a value in the record),
                "toggles": [ { "key": string, "label": string (e.g. "Smoking", "Add an SGLT2 inhibitor"), "on": boolean (today), "target": boolean (recommended), "effect": number (change in log-odds when switched on) } ] (0-3) }
              or null when there is no meaningful long-term risk to simulate
}
Percentages are estimates for decision support. Prefer a validated score when one applies and name it in "basis"; otherwise say "clinical estimate".
For "perUnit"/"effect" use realistic published effect sizes (for example a hazard ratio of 1.2 per 1% HbA1c is about 0.18 per unit).`;

export const patientInsights = async ({ ctx, history, labs, transcript }) =>
  normalizeInsights(
    await askJson(
      [
        ctxBlock(ctx),
        `EARLIER VISITS (each previous prescription in full, newest first, identifiers removed):\n${history || "[]"}`,
        `LAB RESULTS, RADIOLOGY REPORTS AND UPLOADED LAB REPORTS:\n${JSON.stringify(labs || [])}`,
        transcript ? `CONSULTATION TRANSCRIPT:\n${transcript.slice(0, 12000)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      INSIGHTS,
    ),
  );

/* ------------------------------------------------------------------------------------------ */
/* Tools tab: one-click AI tools, one shared answer shape (normalizeTool)                      */

export const AI_TOOLS = {
  icd: {
    label: "ICD-10 coding",
    task: `Give the best ICD-10 code for each provisional diagnosis and any coded diagnosis clearly supported by the record.
Each item: "text" = diagnosis name, "code" = ICD-10 code, "detail" = why this code (specificity notes), "kind" = "diagnosis".`,
  },
  ddx: {
    label: "Differential diagnosis",
    task: `List the differential diagnoses for today's presentation, most likely first, with the finding for and against each and the one test that best separates it.
Each item: "text" = diagnosis, "detail" = reasoning and the deciding test, "level" = "High"|"Medium"|"Low" likelihood, "kind" = "diagnosis". Add the deciding tests as separate items with "kind" = "investigation".`,
  },
  labs: {
    label: "Explain lab results",
    task: `Interpret the lab trends: what is abnormal, what changed, what it means for today's problem, and what to repeat or add.
Each item: "text" = finding (e.g. "HbA1c 8.2% - rising"), "detail" = meaning, "kind" = "info"; tests to order as "kind" = "investigation".`,
  },
  dose: {
    label: "Dose check",
    task: `Check the dose, frequency and duration of every prescribed medicine for this patient's age, weight, kidney and liver function and pregnancy status.
Each item: "text" = medicine and verdict (e.g. "Paracetamol 1 g TDS - appropriate"), "detail" = the usual adult/child dose and any adjustment, "level" = "High" when a change is needed, "kind" = "note".`,
  },
  followup: {
    label: "Follow-up plan",
    task: `Write a follow-up and monitoring plan: when to review, what to measure at home, which tests to repeat and when, and warning signs for an urgent return.
Each item: "text" = one action, "detail" = timing or reason, "kind" = "advice" for patient actions, "investigation" for tests, "note" for clinician tasks.`,
  },
  education: {
    label: "Patient education",
    task: `Write patient education in simple words (reading age about 12) in the requested language: what the illness is, how to take each medicine, diet and activity, and warning signs.
Each item: "text" = one short instruction in that language, "kind" = "advice".`,
  },
  referral: {
    label: "Referral advice",
    task: `Say whether a referral is needed now or later, to which specialty, how urgently and with which information.
Each item: "text" = specialty and urgency, "detail" = reason and what to send, "kind" = "note".`,
  },
  guideline: {
    label: "Guideline summary",
    task: `Summarise the key current guideline recommendations for the main diagnosis as they apply to THIS patient (name the guideline and year), and anything in today's plan that differs.
Each item: "text" = one recommendation, "detail" = how it applies here, "kind" = "note"; tests as "investigation".`,
  },
};

const TOOL_SYSTEM = `You run one decision-support tool for the doctor and answer in STRICT JSON only:
{ "title": string, "summary": string (2-3 sentences), "items": [ { "text": string, "detail": string, "kind": "diagnosis"|"investigation"|"advice"|"note"|"info", "code": string, "level": "High"|"Medium"|"Low"|"" } ] (max 10), "caution": string (what the doctor must double-check, or "") }
Use only the data given; if it is not enough for this tool, say so in "summary" and return few or no items.`;

export const runAiTool = async ({ tool, ctx, labs, language }) => {
  const def = AI_TOOLS[tool];
  if (!def) throw new Error("Unknown tool");
  return normalizeTool(
    await askJson(
      [`TOOL: ${def.label}\n${def.task}`, `LANGUAGE for patient-facing text: ${language || "English"}`, ctxBlock(ctx), `LAB RESULTS, RADIOLOGY REPORTS AND UPLOADED LAB REPORTS:\n${JSON.stringify(labs || [])}`].join("\n\n"),
      TOOL_SYSTEM,
      { temperature: 0.2 },
    ),
  );
};
