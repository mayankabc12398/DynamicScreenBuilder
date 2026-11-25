import { GEMINI_MODEL } from "./constant";

import { aiFetch, AI_GENERATE_URL } from "./aiClient";
/**
 * Translates the texts a printed prescription still needs, with the same AI model and key the
 * other AI features here use (checker, leaflet, assistant). The API decides WHICH texts need it
 * (it already filled in the fixed labels from the language master, left dates, measurements and
 * drug names alone, masked the patient's identifiers and reused its cache) and applies the
 * answers; this only does the AI call.
 *
 * Speed: the texts are cut into small batches that are sent TOGETHER (a few at a time) rather
 * than one after another, so a prescription costs about one model round trip instead of one per
 * batch. A batch that fails for a passing reason (rate limit, server hiccup) is tried once more.
 *
 * Returns { sourceText: translatedText } for every text, or throws - a prescription is never
 * printed half translated.
 */
const GEMINI_URL = AI_GENERATE_URL;
const BATCH_SIZE = 25;
const PARALLEL = 4;

const askBatch = async (batch, languageName) => {
  const prompt =
    `You translate text on a printed medical prescription into ${languageName} for the patient.\n` +
    "Input is a JSON array of strings. Return ONLY a JSON array of the same length, in the same order, " +
    "where each element is the translation of the element at that position.\n" +
    "Rules: keep numbers, units, doses, dates, times, abbreviations (OD, BD, TDS, SOS...), drug and brand names, " +
    "email addresses and URLs exactly as written; translate only the words around them. " +
    "Placeholders written like [[PNAME]] must be copied unchanged. " +
    "Use the standard, plain medical wording a pharmacist or doctor would use in that language. " +
    "Do not add explanations or extra text.\n\n" +
    JSON.stringify(batch);

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const error = new Error(`Translation service returned ${res.status}`);
    error.status = res.status;
    throw error;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.length !== batch.length) {
    throw new Error("The translation came back incomplete");
  }
  return parsed;
};

// One more try for a passing problem (too many requests, a server error, a malformed answer).
const askBatchWithRetry = async (batch, languageName) => {
  try {
    return await askBatch(batch, languageName);
  } catch (error) {
    const passing = !error.status || error.status === 429 || error.status >= 500;
    if (!passing) throw error;
    await new Promise((resolve) => setTimeout(resolve, 600));
    return askBatch(batch, languageName);
  }
};

export const translatePrescriptionTexts = async (texts, languageName) => {
  const batches = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) batches.push(texts.slice(i, i + BATCH_SIZE));

  const out = {};
  let next = 0;
  // A small pool: PARALLEL workers each take the next batch until none are left. The first
  // failure ends the print (the other workers stop picking up work).
  let failure = null;
  const worker = async () => {
    while (!failure && next < batches.length) {
      const batch = batches[next++];
      try {
        const translated = await askBatchWithRetry(batch, languageName);
        batch.forEach((source, idx) => {
          const tr = String(translated[idx] ?? "").trim();
          if (tr) out[source] = tr;
        });
      } catch (error) {
        failure = failure || error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, batches.length) }, worker));
  if (failure) throw failure;
  return out;
};
