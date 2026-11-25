import { GEMINI_MODEL } from "./constant";

import { aiFetch, AI_GENERATE_URL } from "./aiClient";
// Vision model used for PACS image reading. Falls back to the app-wide model
// configured in constant.js when no vision-specific override is provided.
export const AI_VISION_MODEL =
  import.meta.env.VITE_GEMINI_VISION_MODEL || GEMINI_MODEL || "gemini-2.5-flash";


export const AI_MAX_IMAGES = 6;
export const AI_MAX_IMAGE_MB = 5;
// Gemini rejects inline requests over ~20MB; keep the encoded payload well under it.
const AI_MAX_TOTAL_BASE64_BYTES = 15 * 1024 * 1024;
export const AI_ACCEPTED_TYPES = "image/png,image/jpeg,image/jpg,image/webp,application/pdf";

/**
 * What the radiologist picked in "AI Model". "auto" is the default: the model
 * identifies the modality from the image itself, which is what makes the same
 * assistant usable for plain films, cross-sectional studies and ultrasound.
 */
export const MODALITY_FOCUS = {
  auto: "",
  xray:
    "The study is a plain radiograph. Read bones, joints, soft tissues, lines/tubes and any visible chest or abdominal viscera.",
  chest:
    "The study is a chest examination. Read lungs, pleura, mediastinum, cardiac silhouette, hila, diaphragm, bones and any support devices.",
  musculoskeletal:
    "The study is musculoskeletal. Read cortical outlines, trabecular pattern, joint spaces, alignment, physes where present, and periarticular soft tissues.",
  neuro:
    "The study is a neuro CT or MRI. Read grey/white differentiation, ventricles and sulci, midline, extra-axial spaces, posterior fossa, vessels and skull.",
  ct: "The study is a CT. State the plane and window, and read the organs covered by the field of view systematically.",
  mri: "The study is an MRI. Name the sequence and plane as far as they are evident, and describe signal characteristics rather than density.",
  ultrasound:
    "The study is an ultrasound. Describe echotexture, margins, measurements where scale is visible, and any Doppler signal shown.",
  mammography:
    "The study is a mammogram. Report breast composition, masses, calcifications, asymmetry and architectural distortion, and give an ACR BI-RADS category in the impression.",
  abdomen:
    "The study covers the abdomen/pelvis. Read bowel gas pattern, solid organs, calcifications, free gas or fluid, and the visualised skeleton.",
  dental:
    "The study is a dental/maxillofacial image. Read dentition, periapical regions, alveolar bone, sinuses and the mandibular condyles.",
  general: "",
};

export const SIGNIFICANCE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "abnormal", label: "Abnormal" },
  { value: "critical", label: "Critical" },
];

/**
 * Gemini sometimes wraps JSON in ``` fences even with responseMimeType set.
 * Strip them and slice to the outermost object before parsing.
 */
export function parseGeminiObject(raw = "") {
  let text = String(raw).trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
};

const cleanText = (value) => String(value ?? "").trim();

/**
 * Normalise whatever the model returned into the shape the modal renders,
 * so a partially-formed response never crashes the UI.
 */
export function normalizeAnalysis(raw) {
  const data = raw || {};
  const findings = asArray(data.findings)
    .map((item) => {
      if (typeof item === "string") {
        return {
          region: "",
          observation: cleanText(item),
          significance: "abnormal",
          confidence: null,
        };
      }
      const confidence = Number(item?.confidence ?? item?.probability);
      return {
        region: cleanText(item?.region || item?.area || item?.structure),
        observation: cleanText(item?.observation || item?.finding || item?.description),
        significance: ["normal", "abnormal", "critical"].includes(
          String(item?.significance || "").toLowerCase(),
        )
          ? String(item.significance).toLowerCase()
          : "abnormal",
        confidence: Number.isFinite(confidence)
          ? Math.round(Math.max(0, Math.min(100, confidence <= 1 ? confidence * 100 : confidence)))
          : null,
      };
    })
    .filter((item) => item.observation);

  const regions = asArray(data.regionsOfInterest || data.regions_of_interest)
    .map((item) => {
      const box = asArray(item?.box_2d || item?.box).map((n) => Number(n));
      if (box.length !== 4 || box.some((n) => !Number.isFinite(n))) return null;
      const confidence = Number(item?.confidence);
      return {
        label: cleanText(item?.label) || "Region of interest",
        location: cleanText(item?.location),
        box_2d: box.map((n) => Math.max(0, Math.min(1000, n))),
        confidence: Number.isFinite(confidence)
          ? Math.max(0, Math.min(100, confidence <= 1 ? confidence * 100 : confidence))
          : null,
        imageIndex: Number.isFinite(Number(item?.imageIndex)) ? Number(item.imageIndex) : 0,
      };
    })
    .filter(Boolean);

  const suggestedDiagnosis = asArray(data.suggestedDiagnosis || data.suggested_diagnosis)
    .map((item) => {
      if (typeof item === "string") return { label: cleanText(item), value: null };
      const value = Number(item?.probability ?? item?.value ?? item?.confidence);
      return {
        label: cleanText(item?.label || item?.diagnosis || item?.name),
        value: Number.isFinite(value)
          ? Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
          : null,
      };
    })
    .filter((item) => item.label)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 3);

  return {
    modality: cleanText(data.modality),
    bodyPart: cleanText(data.bodyPart || data.body_part),
    view: cleanText(data.view || data.projection || data.viewPosition),
    clinicalHistory: cleanText(data.clinicalHistory || data.clinical_history),
    regions,
    suggestedDiagnosis,
    imageQuality: cleanText(data.imageQuality || data.image_quality),
    technique: cleanText(data.technique),
    comparison: cleanText(data.comparison),
    findings,
    impression: asArray(data.impression).map(cleanText).filter(Boolean),
    recommendation: asArray(data.recommendation || data.recommendations)
      .map(cleanText)
      .filter(Boolean),
    criticalFinding:
      data.criticalFinding === true ||
      data.critical_finding === true ||
      findings.some((f) => f.significance === "critical"),
    criticalReason: cleanText(data.criticalReason || data.critical_reason),
    limitations: cleanText(data.limitations),
    confidence: ["high", "medium", "low"].includes(
      String(data.confidence || "").toLowerCase(),
    )
      ? String(data.confidence).toLowerCase()
      : "medium",
    confidenceScore: deriveConfidenceScore(data, regions, suggestedDiagnosis),
  };
}

const CONFIDENCE_FALLBACK = { high: 90, medium: 72, low: 50 };

/** A single headline percentage for the report footer / assistant panel. */
function deriveConfidenceScore(data, regions, suggestedDiagnosis) {
  const explicit = Number(data?.confidenceScore ?? data?.confidence_score);
  if (Number.isFinite(explicit)) {
    return Math.round(Math.max(0, Math.min(100, explicit <= 1 ? explicit * 100 : explicit)));
  }
  const candidates = [
    ...regions.map((r) => r.confidence),
    ...suggestedDiagnosis.map((d) => d.value),
  ].filter((n) => Number.isFinite(n));
  if (!candidates.length) {
    const findingScores = asArray(data?.findings)
      .map((f) => Number(f?.confidence ?? f?.probability))
      .filter((n) => Number.isFinite(n));
    if (findingScores.length) {
      return Math.round(findingScores.reduce((a, b) => a + b, 0) / findingScores.length);
    }
  }
  if (candidates.length) return Math.round(Math.max(...candidates));
  return CONFIDENCE_FALLBACK[String(data?.confidence || "").toLowerCase()] ?? 72;
}

/**
 * Drop low-confidence regions and differentials below the radiologist's
 * threshold. Findings without a numeric confidence are always kept.
 */
export function applyConfidenceThreshold(analysis, threshold = 0) {
  if (!analysis) return analysis;
  return {
    ...analysis,
    regions: (analysis.regions || []).filter(
      (region) => !Number.isFinite(region?.confidence) || region.confidence >= threshold,
    ),
    suggestedDiagnosis: (analysis.suggestedDiagnosis || []).filter(
      (item) => !Number.isFinite(item?.value) || item.value >= threshold,
    ),
  };
}

function buildPrompt(context = {}) {
  const lines = [
    `Study / Investigation: ${context.investigationName || "Not specified"}`,
    `Patient: ${context.patientName || "Not specified"}`,
    `Age / Gender: ${context.ageGender || "Not specified"}`,
    `Referring Doctor: ${context.referDoctor || "Not specified"}`,
    `Clinical history / indication: ${context.clinicalHistory || "Not provided"}`,
  ].join("\n");

  const focus = MODALITY_FOCUS[context.modalityFocus] || MODALITY_FOCUS[context.model] || "";

  return `You are assisting a qualified radiologist by preparing a DRAFT structured read of the attached study image(s). The radiologist reviews, edits and signs off on everything you produce; nothing you output is issued to a patient directly.

Study context:
${lines}

Modality handling:
- First identify the modality and body region from the image itself: plain radiograph (including chest, skeletal, abdominal, dental/OPG), CT, MRI, ultrasound (including Doppler and obstetric), mammography, fluoroscopy/contrast study, DEXA, or nuclear medicine / PET. The study context above may be wrong or missing — trust the image.
- Report in the register proper to that modality: density for radiographs and CT, signal intensity and sequence for MRI, echogenicity for ultrasound, breast composition and a BI-RADS category for mammography, tracer uptake for nuclear medicine.
- Screenshots or photographs of a PACS monitor are acceptable input; read the image content and note any capture artefact under "limitations".${focus ? `
- ${focus}` : ""}

Instructions:
- Describe only what is visible in the supplied image(s). Never invent priors, lab values or clinical events that are not given above.
- Cover the relevant anatomy systematically for this modality/body part, and explicitly state normal structures as normal.
- If image quality, projection or coverage limits the read, say so in "limitations" and lower "confidence".
- Flag "criticalFinding": true only for findings that need immediate communication to the referring clinician.
- Keep the wording in standard radiology reporting register, concise and free of hedging filler.
- For every abnormality you can localise on the image, add a "regionsOfInterest" entry with a bounding box in normalised 0-1000 coordinates ([ymin, xmin, ymax, xmax], origin top-left) and "imageIndex" = the 0-based position of the image it belongs to. Omit boxes you cannot localise confidently rather than guessing.
- Give every entry in "findings" a "confidence" between 0 and 100 reflecting how certain you are of that specific observation.
- "suggestedDiagnosis" is a ranked differential of at most 3 entries with a probability 0-100 that sums to no more than 100.
- If the image is not a diagnostic medical image at all (or is unreadable), return empty findings and explain why in "limitations". Do not refuse an unfamiliar modality — describe what is visible and lower "confidence" instead.

Return ONLY JSON in exactly this shape, with no markdown:
{
  "modality": "<X-Ray | CT | MRI | Ultrasound | Mammography | Fluoroscopy | DEXA | Nuclear Medicine>",
  "bodyPart": "<region imaged>",
  "view": "<projection / view, e.g. AP/PA, lateral, axial T2 — empty string if not determinable>",
  "imageQuality": "<short note on diagnostic quality>",
  "clinicalHistory": "<restate the supplied indication in one line, else empty string>",
  "technique": "<one or two sentences on projections/sequences/contrast as evident from the image>",
  "comparison": "<prior comparison if visible in the image, else empty string>",
  "findings": [
    { "region": "<anatomical region>", "observation": "<what is seen>", "significance": "normal | abnormal | critical", "confidence": 0-100 }
  ],
  "regionsOfInterest": [
    { "label": "<short finding label>", "location": "<anatomical location>", "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0-100, "imageIndex": 0 }
  ],
  "impression": ["<numbered-style impression point>"],
  "suggestedDiagnosis": [ { "label": "<differential diagnosis>", "probability": 0-100 } ],
  "recommendation": ["<suggested next step or correlation, if any>"],
  "criticalFinding": false,
  "criticalReason": "<why it is critical, else empty string>",
  "limitations": "<what could not be assessed>",
  "confidence": "high | medium | low"
}`;
}

/**
 * Send one or more PACS images (base64, no data-url prefix) to Gemini and get
 * back a normalised structured read.
 *
 * @param {Array<{base64: string, mimeType: string}>} images
 * @param {Object} context patient/study context used to steer the prompt
 */
export async function analyzePacsImages(images = [], context = {}) {
  if (!images.length) throw new Error("No image supplied for analysis.");

  const totalBytes = images.reduce((sum, img) => sum + (img.base64?.length || 0), 0);
  if (totalBytes > AI_MAX_TOTAL_BASE64_BYTES) {
    throw new Error(
      "Selected images are too large to analyse together. Please remove some images and retry.",
    );
  }

  const parts = [
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType || "image/jpeg", data: img.base64 },
    })),
    { text: buildPrompt(context) },
  ];

  const response = await aiFetch(AI_GENERATE_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "AI analysis request failed.");
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = parseGeminiObject(text);
  if (!parsed) {
    const blocked = data?.promptFeedback?.blockReason;
    throw new Error(
      blocked
        ? `AI could not process this image (${blocked}).`
        : "AI returned an unreadable response. Please retry.",
    );
  }
  return normalizeAnalysis(parsed);
}

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Build report HTML in the same font the radiology CKEditor defaults to,
 * so inserted text matches the rest of the report.
 */
export function buildReportHtml(analysis, options = {}) {
  const {
    includeDisclaimer = true,
    includeConfidence = true,
    includeCommentsBlock = true,
    clinicalHistory = "",
  } = options;
  if (!analysis) return "";

  const font = 'font-family:"Times New Roman", Times, serif; font-size:18px;';
  const heading = (text) =>
    `<p style="${font}"><strong><u>${escapeHtml(text)}</u></strong></p>`;
  const para = (text) => `<p style="${font}">${escapeHtml(text)}</p>`;

  const blocks = [];

  const header = [analysis.modality, analysis.bodyPart].filter(Boolean).join(" - ");
  if (header) blocks.push(`<p style="${font}"><strong>${escapeHtml(header)}</strong></p>`);

  const history = clinicalHistory || analysis.clinicalHistory;
  if (history) {
    blocks.push(heading("CLINICAL HISTORY"));
    blocks.push(para(history));
  }

  if (analysis.technique) {
    blocks.push(heading("TECHNIQUE"));
    blocks.push(para(analysis.technique));
  }

  if (analysis.comparison) {
    blocks.push(heading("COMPARISON"));
    blocks.push(para(analysis.comparison));
  }

  const findings = (analysis.findings || []).filter((f) => f?.observation?.trim());
  if (findings.length) {
    blocks.push(heading("FINDINGS"));
    const items = findings
      .map((f) => {
        const label = f.region ? `<strong>${escapeHtml(f.region)}:</strong> ` : "";
        return `<li style="${font}">${label}${escapeHtml(f.observation)}</li>`;
      })
      .join("");
    blocks.push(`<ul style="${font}">${items}</ul>`);
  }

  const impression = (analysis.impression || []).filter((i) => i?.trim());
  if (impression.length) {
    blocks.push(heading("IMPRESSION"));
    const items = impression
      .map((i) => `<li style="${font}">${escapeHtml(i)}</li>`)
      .join("");
    blocks.push(`<ol style="${font}">${items}</ol>`);
  }

  const recommendation = (analysis.recommendation || []).filter((r) => r?.trim());
  if (recommendation.length) {
    blocks.push(heading("RECOMMENDATION"));
    const items = recommendation
      .map((r) => `<li style="${font}">${escapeHtml(r)}</li>`)
      .join("");
    blocks.push(`<ul style="${font}">${items}</ul>`);
  }

  if (analysis.criticalFinding) {
    blocks.push(
      `<p style="${font} color:#b00020;"><strong>CRITICAL FINDING: </strong>${escapeHtml(
        analysis.criticalReason || "Requires immediate clinical correlation.",
      )}</p>`,
    );
  }

  if (analysis.limitations) {
    blocks.push(heading("LIMITATIONS"));
    blocks.push(para(analysis.limitations));
  }

  if (includeConfidence || includeCommentsBlock) {
    blocks.push(`<hr />`);
  }

  if (includeConfidence && Number.isFinite(analysis.confidenceScore)) {
    blocks.push(
      `<p style="${font}"><strong>AI Confidence: </strong><span style="color:#16a34a;">${analysis.confidenceScore}%</span></p>`,
    );
  }

  if (includeCommentsBlock) {
    blocks.push(heading("RADIOLOGIST COMMENTS"));
    blocks.push(`<p style="${font}">&nbsp;</p>`);
  }

  if (includeDisclaimer) {
    blocks.push(
      `<p style="font-family:&quot;Times New Roman&quot;, Times, serif; font-size:14px; color:#666;"><em>AI-assisted draft - reviewed and verified by the reporting radiologist.</em></p>`,
    );
  }

  return blocks.join("");
}
