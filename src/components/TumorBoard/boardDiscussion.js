/* =============================================================================
   Tumor Board — the discussion sheet's shape, shared by the editor (the
   /tumor-board window), the read-only view (the EMR) and the tests.

   Pure: no React, no network.
   ============================================================================= */

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

/* Dapper answers in camelCase, older wrappers in PascalCase — take whichever
   arrived rather than betting on one. */
const pick = (row, k) => asText(row?.[k] ?? row?.[k[0].toUpperCase() + k.slice(1)] ?? "");

/* makeApiRequest does not throw on failure — it hands back the raw axios
   response — so an absent `success` is the only reliable failure signal. */
export const readApiResult = (res) => ({
  ok: res?.success === true,
  data: res?.data,
  rows: Array.isArray(res?.data) ? res.data : [],
  message: asText(res?.message),
});

/* The sheet, section by section, in the order the board works through it. Each
   field is [key, label, rows-for-the-textarea]. */
export const SECTIONS = [
  {
    key: "so",
    title: "Surgical Oncologist",
    who: "documents the case summary with supporting documentation",
    fields: [
      ["caseSummary", "Case summary", 4],
      ["supportingDocumentation", "Supporting documentation", 3],
    ],
  },
  {
    key: "ro",
    title: "Radiation Oncologist",
    who: "proposes the neo-adjuvant TRF protocol prior to surgery",
    fields: [["neoAdjuvantProtocol", "Proposed neo-adjuvant TRF protocol", 3]],
  },
  {
    key: "st",
    title: "Speech Therapist",
    who: "plans post-operative rehabilitation",
    fields: [["speechTherapyPlan", "Post-operative rehabilitation plan", 3]],
  },
  {
    key: "nu",
    title: "Nutritionist",
    who: "notes nutritional status and support needs",
    fields: [["nutritionStatus", "Nutritional status and support needs", 3]],
  },
  {
    key: "co",
    title: "Coordinator — discussion record",
    who: "documents the discussion in real time",
    fields: [
      ["diagnosis", "Diagnosis", 2],
      ["histopathologySummary", "Histopathology summary", 3],
      ["labSummary", "Lab summary", 3],
      ["imagingSummary", "Imaging / Radiology summary", 3],
      ["treatmentPlanPhaseWise", "Phase-wise recommended treatment plan", 4],
      ["supportiveCarePlan", "Supportive care plan", 3],
      ["followUpNotes", "Follow-up for the next Tumor Board meeting", 2],
    ],
  },
  {
    key: "ch",
    title: "Chemotherapy",
    who: "treatment protocol and pre / post chemo drugs",
    fields: [["chemoProtocol", "Chemo treatment protocol", 3]],
  },
];

export const TEXT_FIELDS = SECTIONS.flatMap((s) => s.fields.map(([k]) => k));

export const PHASES = ["Pre", "Post"];
export const ROUTES = ["IV", "PO", "SC", "IM", "IT"];

/* The regimen named in the brief (TPF), one click each. */
export const DRUG_PRESETS = [
  { drugName: "Docetaxel", dose: "75", unit: "mg/m2", route: "IV", schedule: "Day 1" },
  { drugName: "Cisplatin", dose: "75", unit: "mg/m2", route: "IV", schedule: "Day 1" },
  { drugName: "5-Fluorouracil", dose: "750", unit: "mg/m2", route: "IV", schedule: "Days 1–5, continuous infusion" },
];

export const EMPTY_DRUG = { phase: "Pre", drugName: "", dose: "", unit: "mg/m2", route: "IV", schedule: "" };

export const EMPTY_SHEET = {
  id: 0,
  referralID: 0,
  nextMeetingDate: "",
  ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, ""])),
};

export const normaliseDrug = (row) => ({
  phase: pick(row, "phase") || "Pre",
  drugName: pick(row, "drugName"),
  dose: pick(row, "dose"),
  unit: pick(row, "unit"),
  route: pick(row, "route"),
  schedule: pick(row, "schedule"),
});

export const normaliseSheet = (row) => ({
  id: Number(row?.id ?? row?.ID ?? 0) || 0,
  referralID: Number(row?.referralID ?? row?.ReferralID ?? 0) || 0,
  patientID: pick(row, "patientID"),
  nextMeetingDate: pick(row, "nextMeetingDate").slice(0, 10),
  ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, pick(row, k)])),
  referredBy: pick(row, "referredBy").trim(),
  referralDate: pick(row, "referralDate"),
  entryByName: pick(row, "entryByName").trim(),
  entryDate: pick(row, "entryDate"),
  updatedByName: pick(row, "updatedByName").trim(),
  updateDate: pick(row, "updateDate"),
  drugs: (Array.isArray(row?.drugs) ? row.drugs : Array.isArray(row?.Drugs) ? row.Drugs : [])
    .map(normaliseDrug),
});

export const drugHasContent = (d) => asText(d?.drugName).trim() !== "";

/**
 * Empty string when the sheet can be saved, otherwise what is missing.
 *
 * A sheet with nothing on it records no discussion. The one thing that is
 * required beyond that is the diagnosis: a board decision without a diagnosis
 * is not one anyone downstream can act on.
 */
export const validateSheet = (sheet, drugs) => {
  const anyText = TEXT_FIELDS.some((k) => asText(sheet?.[k]).trim() !== "");
  const anyDrug = (drugs || []).some(drugHasContent);
  if (!anyText && !anyDrug) return "Record the discussion before saving it";
  if (!asText(sheet?.diagnosis).trim()) return "Diagnosis is required";
  return "";
};

export const toPayload = (sheet, drugs, referralID, patientID, transactionID) => ({
  id: Number(sheet?.id ?? 0) || 0,
  referralID: Number(referralID ?? sheet?.referralID ?? 0) || 0,
  patientID,
  transactionID,
  nextMeetingDate: asText(sheet?.nextMeetingDate).trim(),
  ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, asText(sheet?.[k]).trim()])),
  drugs: (drugs || []).filter(drugHasContent).map((d) => ({
    phase: asText(d.phase).trim() || "Pre",
    drugName: asText(d.drugName).trim(),
    dose: asText(d.dose).trim(),
    unit: asText(d.unit).trim(),
    route: asText(d.route).trim(),
    schedule: asText(d.schedule).trim(),
  })),
});

/* A drug line as one readable string: "Docetaxel 75 mg/m2 IV · Day 1". */
export const drugLabel = (d) =>
  [
    [d?.drugName, d?.dose, d?.unit, d?.route].map(asText).map((s) => s.trim()).filter(Boolean).join(" "),
    asText(d?.schedule).trim(),
  ]
    .filter(Boolean)
    .join(" · ");

/**
 * The EMR toolbar's state from the status call. The flag button is always
 * there (it is how a doctor puts a patient on the board); the discussion button
 * exists only when a discussion does.
 */
export const toolbarState = (status) => ({
  isFlagged: status?.isFlagged === true || status?.IsFlagged === true,
  referralID: Number(status?.referralID ?? status?.ReferralID ?? 0) || 0,
  hasDiscussion: status?.hasDiscussion === true || status?.HasDiscussion === true,
  nextMeetingDate: asText(status?.nextMeetingDate ?? status?.NextMeetingDate),
  referredBy: asText(status?.referredBy ?? status?.ReferredBy).trim(),
  referralDate: asText(status?.referralDate ?? status?.ReferralDate),
});
