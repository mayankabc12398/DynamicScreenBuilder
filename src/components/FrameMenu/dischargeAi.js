import { GEMINI_MODEL } from "../../utils/constant";
import { escapeHtml } from "./dischargeClinicalRecord";

import { aiFetch, AI_GENERATE_URL } from "../../utils/aiClient";
/** One Gemini call. `parts` = text and/or inline image / pdf parts. Returns the text of the answer. */
const gemini = async (parts) => {
  const response = await aiFetch(AI_GENERATE_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationConfig: { temperature: 0.1 }, contents: [{ parts }] }),
    },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || "Gemini request failed");
  const text = (result?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("Empty response received from Gemini");
  return text;
};

const stripFences = (s) => s.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

/** Plain text (or, failing that, whatever the model returned) as safe paragraphs. */
const asHtml = (s) => (/<(p|div|ul|ol|table|h\d)\b/i.test(s) ? s : s.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`).join(""));

/**
 * A short clinical summary of the recorded data - only what is in `sourceText`, nothing added.
 * @returns HTML paragraphs
 */
export const summariseClinicalRecord = async (sourceText) => {
  const prompt = `You are a clinician preparing the "hospital course" for a discharge summary.
Using ONLY the clinical record below (notes, surgery notes, results, medicines), write a concise professional summary in short paragraphs:
presenting problem, key findings and investigations (quote values with their dates), procedures / surgery, course in hospital, condition and plan at discharge.
Rules: do not invent facts; if something is not in the record leave it out; no patient name, UHID, age or gender; no markdown, no headings with # or *;
return simple HTML using only <p>, <ul>, <li>, <b>.

CLINICAL RECORD:
${sourceText}`;
  return asHtml(stripFences(await gemini([{ text: prompt }])));
};

/** Reads a photographed or scanned hand-written summary. file = a File (image or PDF). @returns HTML */
export const transcribeHandwriting = async (file) => {
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
  const prompt = `This is a hand-written (or printed) hospital discharge summary. Read it carefully and convert it to clean, typed text.
Rules: keep the original wording, order, headings and numbers; correct only obvious spelling slips; if a word is illegible write [illegible] instead of guessing;
keep drug names, doses, dates and lab values exactly; turn lists into <ul><li>; turn tables into <table>; no commentary and no markdown.
Return simple HTML using only <p>, <h3>, <ul>, <ol>, <li>, <b>, <table>, <tr>, <th>, <td>, <br/>.`;
  return asHtml(stripFences(await gemini([{ inline_data: { mime_type: file.type || "image/jpeg", data } }, { text: prompt }])));
};
