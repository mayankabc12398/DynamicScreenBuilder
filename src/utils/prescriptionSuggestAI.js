import { GEMINI_MODEL } from "./constant";
import { normalizeSuggestion } from "./prescriptionSuggestLogic";

import { aiFetch, AI_GENERATE_URL } from "./aiClient";
/**
 * Asks the AI model (same model and key as the interaction checker, leaflet and print
 * translation) to read the doctor's provisional diagnosis and suggest how the visit could be
 * written up: likely diagnoses, expected course, medicines, tests and imaging, advice, notes
 * and follow-up.
 *
 * What is sent is clinical context only - age, sex, weight, vitals, allergies, complaint,
 * diagnosis, history and what is already prescribed. No name, UHID, phone, address or
 * doctor: they add nothing to the answer and have no business leaving the building.
 */
const GEMINI_URL = AI_GENERATE_URL;

const SYSTEM = `You are a clinical decision-support assistant for a licensed doctor writing an outpatient prescription.
You never replace the doctor's judgement: you propose, the doctor decides.
Return STRICT JSON only - no markdown, no commentary - in exactly this shape:
{
 "summary": string (max 2 sentences: what the diagnosis most likely means for this patient),
 "diagnoses": [ { "name": string, "likelihood": "High"|"Medium"|"Low", "reasoning": string } ]  (max 4: the stated diagnosis refined, plus differentials worth ruling out),
 "prediction": { "expectedCourse": string, "prognosis": string, "timeToRecovery": string, "complications": [string], "redFlags": [string] },
 "medicines": [ { "name": string (generic name with strength, e.g. "Paracetamol 500 mg"), "dose": string (e.g. "1 tablet"), "frequency": string (e.g. "1-0-1", "TDS", "BD", "OD"), "meal": "Before Meal"|"After Meal"|"With Meal"|"Empty Stomach"|"At Bedtime"|"Any Time", "duration": string (e.g. "5 Days"), "route": string (e.g. "Oral"), "remarks": string, "rationale": string (one short line) } ]  (max 8),
 "investigations": [ { "name": string (a standard test name, e.g. "Complete Blood Count"), "kind": "Lab"|"Radiology", "reason": string } ]  (max 8),
 "advice": [string]  (max 6 short lines of patient advice: diet, rest, hydration, warning signs, when to return),
 "notes": [string]  (max 4 short clinical notes for the doctor's notes, each under 160 characters),
 "followUp": { "days": integer or null, "reason": string },
 "warnings": [string]  (anything the doctor should double-check: allergy, age, pregnancy, kidney or liver caution, interactions)
}
Rules:
- Suggest only widely accepted standard-of-care options. Keep lists short and relevant; an empty list is better than a padded one.
- Dose for the patient's age and weight. For a child give the weight-based dose in "dose".
- Never suggest a drug the patient is allergic to or a class that cross-reacts with a listed allergy; if the diagnosis would normally call for one, say so in "warnings" and offer an alternative.
- Do not repeat a medicine that is already prescribed.
- If the information is too thin to be useful, say so in "summary" and keep the lists minimal.
- If "practicePattern" is present it is what THIS doctor usually prescribes for similar patients (same diagnosis, same age range), with the share of those patients each item was used for. Prefer consistency with it where it is clinically sound, say "matches your usual practice" in the rationale of a suggestion that agrees with it, and do not copy it blindly: allergies, age, weight and the current presentation always come first.
- Write in English. Do not include any patient identifier.`;

const parseJson = (text) => {
  const cleaned = String(text || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
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

/**
 * @param {object} context  { age, sex, weightKg, vitals, allergies[], chiefComplaint[], provisionalDiagnosis[],
 *                            pastHistory[], currentMedicines[] }
 * @returns normalised suggestion (see normalizeSuggestion); throws if the model cannot be reached or answers badly
 */
export const getGeminiPrescriptionSuggestion = async (context) => {
  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: `Patient and visit context (JSON):\n${JSON.stringify(context)}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 6000, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`The AI service returned ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join("") || "";
  if (!text.trim()) throw new Error("The AI service returned no answer");
  return normalizeSuggestion(parseJson(text));
};
