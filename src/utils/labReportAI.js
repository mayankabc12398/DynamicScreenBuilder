import { GEMINI_MODEL } from "./constant";
import { normalizeExtraction } from "./labTrendLogic";

import { aiFetch, AI_GENERATE_URL } from "./aiClient";
/**
 * Reads a lab report (a PDF or a photo / scan) and returns its parameters as editable rows.
 *
 * It uses the same AI model and key as the Patient Summary's "upload a PDF / image" (the file goes
 * straight from the browser to the model as inline data). What comes back is only a DRAFT: the
 * doctor checks every row against the report and saves it - nothing is stored by this function.
 * The patient's name and other identifiers on the report are not asked for and are not returned.
 */
const GEMINI_URL = AI_GENERATE_URL;

export const MAX_REPORT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_REPORT_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const SYSTEM = `You read laboratory and investigation reports for a doctor and copy their results into structured data.
Return STRICT JSON only - no markdown, no commentary - in exactly this shape:
{
 "reportDate": string | null    (the date the sample was collected or the report issued, as YYYY-MM-DD),
 "labName": string | null       (the laboratory or hospital that produced the report),
 "reportTitle": string | null   (e.g. "Complete Blood Count", "Lipid Profile", "Liver Function Test"),
 "parameters": [
   {
     "section": string          (the group the parameter sits under on the report, e.g. "CBC", "Lipid Profile"; "" if none),
     "name": string             (the parameter name EXACTLY as printed),
     "canonicalName": string    (the standard English name of the test, e.g. "Hemoglobin", "Total Leukocyte Count", "Platelet Count", "HbA1c", "Creatinine", "ALT (SGPT)"),
     "value": string            (the result EXACTLY as printed, e.g. "13.2", "<0.5", "Positive", "Non Reactive"),
     "valueNumber": number | null,
     "comparator": "<" | ">" | "<=" | ">=" | null,
     "unit": string             (e.g. "g/dL", "/cumm", "mg/dL"; "" if none),
     "refRange": string         (the reference / normal range exactly as printed; "" if none),
     "refLow": number | null,
     "refHigh": number | null,
     "flag": "L" | "H" | "N" | null   (only if the report itself marks the result low, high or normal)
   }
 ]
}
Rules:
- Include EVERY measured parameter on EVERY page, one entry per result, in the order they appear. Do not summarise and do not skip any.
- Copy values and units exactly; never calculate, convert, correct or invent a value. If something is unreadable leave "value" out of that entry rather than guess.
- Do not include comments, interpretation text, method names, page headers or footers as parameters.
- Do NOT output the patient's name, age, sex, ID, phone, address or the doctor's name anywhere.
- If the document is not a laboratory or investigation report, return {"reportDate": null, "labName": null, "reportTitle": null, "parameters": []}.`;

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("The file could not be read"));
    reader.readAsDataURL(file);
  });

const parseJson = (raw) => {
  const cleaned = String(raw || "").replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw e;
  }
};

/** Checks a chosen file before anything is sent anywhere. Returns an error message or "". */
export const checkReportFile = (file) => {
  if (!file) return "Choose a report file";
  if (!ACCEPTED_REPORT_TYPES.includes(file.type)) return "Only PDF, PNG, JPG or WEBP files can be read";
  if (file.size > MAX_REPORT_BYTES) return "The report file must be smaller than 10 MB";
  return "";
};

/**
 * @returns { extraction, base64 } - the draft (see normalizeExtraction) and the file as base64, so
 *          saving can keep the original without reading it a second time.
 */
export const extractLabReport = async (file) => {
  const problem = checkReportFile(file);
  if (problem) throw new Error(problem);

  const base64 = await fileToBase64(file);
  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: "Extract every result from this report as the JSON described." },
            { inline_data: { mime_type: file.type, data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 8192, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`The AI service returned ${res.status}`);
  const data = await res.json();
  const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join("") || "";
  if (!answer.trim()) throw new Error("The AI service returned no answer");
  return { extraction: normalizeExtraction(parseJson(answer)), base64 };
};
