import { useState, useEffect, useRef } from "react";
import { GEMINI_MODEL } from "../../utils/constant";

// import DRUGBANK from "./drugbank_interactions.json";
// import INTERACTIONS from "./interactions.json";
import "./DrugInteractionWidget.css";
import { useTranslation } from "react-i18next";
import TextAreaInput from "../../components/formComponent/TextAreaInput";
import { getPatientApiUrl } from "./AIPatientSummary";
import { withAiFeature } from "@app/utils/aiSettings";

import DrugInfoPanel, { AcknowledgementPanel } from "./DrugInfoPanel";

import { aiFetch, AI_GENERATE_URL } from "../../utils/aiClient";
const GEMINI_URL = AI_GENERATE_URL;

const parseGeminiArrayResponse = (rawText = "[]") => {
  const sanitized = rawText
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const parsed = JSON.parse(sanitized || "[]");
  return Array.isArray(parsed) ? parsed : [];
};

const uniqueCaseInsensitive = (items = []) => {
  const seen = new Set();
  const blocked = new Set([
    "nka",
    "nkda",
    "no known allergy",
    "no known allergies",
    "no known drug allergy",
    "no known drug allergies",
    "none",
    "nil",
    "na",
  ]);

  return items.filter((item) => {
    const value = `${item || ""}`.trim();
    if (!value) return false;

    const key = value.toLowerCase();
    if (blocked.has(key)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const splitPatientAllergies = (value) => {
  if (Array.isArray(value)) {
    return uniqueCaseInsensitive(
      value.flatMap((item) => splitPatientAllergies(item)),
    );
  }

  if (value && typeof value === "object") {
    return uniqueCaseInsensitive(
      Object.values(value).flatMap((item) => splitPatientAllergies(item)),
    );
  }

  return uniqueCaseInsensitive(
    `${value || ""}`
      .split(/[,;\n|/]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
};

export const extractPatientAllergies = (apiResponse) => {
  const responseObj =
    apiResponse?.response ?? apiResponse?.data ?? apiResponse ?? {};
  const opdDetails = responseObj?.OPDDetails ?? responseObj?.opdDetails ?? [];

  return uniqueCaseInsensitive(
    opdDetails.flatMap((item) =>
      splitPatientAllergies(item?.Allergies ?? item?.allergies),
    ),
  );
};

export function lookupInteractions(drugNames) {
  const matched = [];
  const n = drugNames.length;
  const lower = drugNames.map((d) => d.toLowerCase().trim());

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = lower[i];
      const b = lower[j];
      const key1 = `${a}|${b}`;
      const key2 = `${b}|${a}`;

      // const dbInfo = DRUGBANK[key1] || DRUGBANK[key2];
      // if (dbInfo) {
      //   matched.push({
      //     drug1: drugNames[i],
      //     drug2: drugNames[j],
      //     severity: "high",
      //     message: dbInfo.message || "",
      //     source: "DrugBank",
      //   });
      //   continue;
      // }

      // const tsInfo = INTERACTIONS[key1] || INTERACTIONS[key2];
      // if (tsInfo) {
      //   matched.push({
      //     drug1: drugNames[i],
      //     drug2: drugNames[j],
      //     severity: tsInfo.severity || "moderate",
      //     message: tsInfo.message || "",
      //     source: "TWOSIDES",
      //   });
      // }
    }
  }

  return matched;
}

export async function getGeminiInteractions(drugsList) {
  const prompt = `You are a clinical pharmacist API. Analyze these drugs for interactions: ${drugsList.join(", ")}.

Return ONLY a raw JSON array (no markdown, no backticks, no explanation) of interaction objects.
Each object must have exactly these keys:
- "drug1": string
- "drug2": string
- "severity": exactly one of "high", "moderate", or "low"
- "message": one plain-English sentence describing the clinical risk

If there are no significant interactions, return an empty array: []`;

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
  const parsed = parseGeminiArrayResponse(text);

  return parsed.map((item) => ({ ...item, source: "Gemini AI" }));
}

export async function getGeminiAllergyInteractions(drugsList, allergyList) {
  if (!drugsList?.length || !allergyList?.length) return [];

  const prompt = `You are a clinical pharmacist API. Analyze drug-allergy risk for this patient.

Drugs: ${drugsList.join(", ")}
Known Allergies: ${allergyList.join(", ")}

Return ONLY a raw JSON array (no markdown, no backticks, no explanation).
Each object must have exactly these keys:
- "drug": string
- "allergy": string
- "severity": exactly one of "high", "moderate", or "low"
- "message": one plain-English sentence describing the clinical risk

If there are no meaningful drug-allergy risks, return []`;

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
  const parsed = parseGeminiArrayResponse(text);

  return parsed.map((item) => ({ ...item, source: "Gemini AI" }));
}

/**
 * Diagnoses arrive as free text ("Fever of other and unknown origin (ICD R50)", the
 * Provisional Diagnosis tags, Past History tags). Same splitting as allergies but with
 * the diagnosis-flavoured "nothing" markers filtered out.
 */
export const splitPatientDiagnoses = (value) => {
  const blocked = new Set([
    "none",
    "nil",
    "na",
    "n/a",
    "nad",
    "no known disease",
    "no known diseases",
    "no significant history",
    "nothing significant",
  ]);
  const flatten = (v) => {
    if (Array.isArray(v)) return v.flatMap(flatten);
    if (v && typeof v === "object") return Object.values(v).flatMap(flatten);
    return `${v || ""}`
      .split(/[;\n|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  };
  const seen = new Set();
  return flatten(value).filter((item) => {
    const key = item.toLowerCase();
    if (blocked.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Drug vs disease (contraindication) check — same Gemini call, prompt and JSON contract
 * as the drug-drug and drug-allergy checks above, so the three run through one pipeline.
 * KMSI A3: "ICD diagnosis coding exists, but nothing cross-checks it against ordered drugs."
 */
export async function getGeminiDiseaseContraindications(drugsList, diseaseList) {
  if (!drugsList?.length || !diseaseList?.length) return [];

  const prompt = `You are a clinical pharmacist API. Check each drug against the patient's diagnoses and medical history for contraindications, cautions and disease-state interactions.

Drugs: ${drugsList.join(", ")}
Diagnoses / history: ${diseaseList.join("; ")}

Return ONLY a raw JSON array (no markdown, no backticks, no explanation).
Each object must have exactly these keys:
- "drug": string (one of the drugs above)
- "disease": string (the diagnosis or history item it conflicts with)
- "severity": exactly one of "high", "moderate", or "low" ("high" = contraindicated, "moderate" = use with caution or dose adjustment, "low" = minor concern)
- "message": one plain-English sentence describing the clinical risk and what to do

Only report clinically meaningful conflicts. If there are none, return []`;

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
  const parsed = parseGeminiArrayResponse(text);

  return parsed.map((item) => ({ ...item, source: "Gemini AI" }));
}

/**
 * Drug vs organ function (liver / kidney) check - KMSI A5. Same Gemini call and JSON
 * contract as the other legs. `labLines` are the patient's recent lab values as text
 * (see utils/patientLabContext.js), `patientLine` is "age 40 years, Male, weight 76 kg".
 * Each result names the lab parameter it is based on and carries a recommendation
 * (dose adjustment / monitoring / avoid), which the card shows as evidence + action.
 */
export async function getGeminiLabAlerts(drugsList, labLines, patientLine = "") {
  if (!drugsList?.length || !labLines?.length) return [];

  const prompt = `You are a clinical pharmacist API. Using the patient's recent laboratory results, assess whether each drug is safe at this patient's kidney and liver function and whether it needs a dose adjustment, monitoring, or should be avoided. Also flag drugs likely to worsen an already abnormal result (for example nephrotoxic drugs with a raised creatinine, hepatotoxic drugs with raised transaminases, potassium-raising drugs with a high potassium, anticoagulants with a raised INR or low platelets).

Patient: ${patientLine || "not specified"}
Drugs: ${drugsList.join(", ")}
Recent lab results (last 30 days):
${labLines.map((line) => "- " + line).join("\n")}

Return ONLY a raw JSON array (no markdown, no backticks, no explanation).
Each object must have exactly these keys:
- "drug": string (one of the drugs above)
- "parameter": string (the lab result it is based on, e.g. "Creatinine 2.1 mg/dL" or "CrCl 38 mL/min")
- "severity": exactly one of "high", "moderate", or "low" ("high" = contraindicated / avoid at this organ function, "moderate" = dose adjustment or close monitoring needed, "low" = minor caution)
- "message": one plain-English sentence describing the risk
- "recommendation": one plain-English sentence with the suggested action (suggested dose or interval, monitoring, or alternative)

Only report clinically meaningful findings. If the labs raise no concern for any drug, return []`;

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1536 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
  const parsed = parseGeminiArrayResponse(text);

  return parsed.map((item) => ({ ...item, source: "Gemini AI" }));
}

/**
 * Drug vs pregnancy / breast-feeding check - KMSI A6. `pregnancyLine` comes from
 * utils/patientPregnancyContext.js ("Female patient, 28 years: PREGNANT, 22 weeks
 * gestation, LMP ..."). Same Gemini call and JSON contract as the other legs.
 */
export async function getGeminiPregnancyAlerts(drugsList, pregnancyLine) {
  if (!drugsList?.length || !pregnancyLine) return [];

  const prompt = `You are a clinical pharmacist API. Assess each drug for use in this patient with respect to pregnancy and breast-feeding.

Patient: ${pregnancyLine}
Drugs: ${drugsList.join(", ")}

If the patient is pregnant, judge by trimester where it matters. If breast-feeding is possible, include lactation risk. If pregnancy status is not recorded for a woman of childbearing potential, flag only drugs that are contraindicated or category D/X in pregnancy, so the prescriber confirms status first.

Return ONLY a raw JSON array (no markdown, no backticks, no explanation).
Each object must have exactly these keys:
- "drug": string (one of the drugs above)
- "category": string (e.g. "FDA D / TGA D", "Contraindicated in pregnancy", "Avoid in breast-feeding")
- "severity": exactly one of "high", "moderate", or "low" ("high" = contraindicated / category D or X, "moderate" = use only if benefit outweighs risk / category C, "low" = minor caution)
- "message": one plain-English sentence describing the risk and the recommended action

Only report clinically meaningful findings. If none, return []`;

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
  const parsed = parseGeminiArrayResponse(text);

  return parsed.map((item) => ({ ...item, source: "Gemini AI" }));
}

const SEVERITY_CONFIG = {
  high: {
    color: "#FF4757",
    bg: "#FFF0F1",
    badge: "#FFD0D4",
    text: "#7A0012",
    label: "HIGH RISK",
  },
  moderate: {
    color: "#FF8C00",
    bg: "#FFF8EE",
    badge: "#FFE4B3",
    text: "#7A3800",
    label: "MODERATE",
  },
  low: {
    color: "#F6C90E",
    bg: "#FEFCE8",
    badge: "#FEF3A0",
    text: "#6B5300",
    label: "LOW",
  },
  unknown: {
    color: "#94A3B8",
    bg: "#F8FAFC",
    badge: "#E2E8F0",
    text: "#334155",
    label: "UNKNOWN",
  },
};

const getSev = (s = "") =>
  SEVERITY_CONFIG[(s || "").toLowerCase()] || SEVERITY_CONFIG.unknown;

const getPatientIdentifier = (patientDetails) =>
  patientDetails?.PatientID ||
  patientDetails?.PatientId ||
  patientDetails?.patientID ||
  patientDetails?.patientId ||
  "";

function DrugInteractionWidget({
  open,
  setOpen,
  initialMedicines = "",
  initialResults = null,
  patientDetails = null,
  initialAllergies = "",
  /** Diagnosis text already on the prescription page (tags, impression). */
  initialDiagnoses = "",
  /** Optional async () => string[] that fetches the saved ICD diagnoses for the patient. */
  loadPatientDiagnoses = null,
  /** Optional async () => lab context from utils/patientLabContext.js (liver/kidney leg). */
  loadPatientLabs = null,
  /** Optional async () => pregnancy context from utils/patientPregnancyContext.js. */
  loadPatientPregnancy = null,
  /** [{ name, itemID, generic }] - lets the Drug Information drawer show the composition. */
  medicineItems = [],
  /** { [drugNameLowerCase]: "text" } - the client's own pregnancy rules per drug. */
  hospitalRules = {},
  /** (acks, pendingCount) => void - high-risk acknowledgements for the page to keep. */
  onAcknowledge = null,
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [usedAI, setUsedAI] = useState(false);
  const [highCount, setHighCount] = useState(0);
  const [patientAllergies, setPatientAllergies] = useState([]);
  const [patientDiagnoses, setPatientDiagnoses] = useState([]);
  const [patientLabs, setPatientLabs] = useState(null);
  const [patientPregnancy, setPatientPregnancy] = useState(null);
  const [acks, setAcks] = useState({});
  const inputRef = useRef();
  const allergyCacheRef = useRef({ key: "", allergies: [] });

  const loadPatientAllergies = async () => {
    const patientId = getPatientIdentifier(patientDetails);
    const cacheKey = `${patientId}::${initialAllergies || ""}`;

    if (allergyCacheRef.current.key === cacheKey) {
      setPatientAllergies(allergyCacheRef.current.allergies);
      return allergyCacheRef.current.allergies;
    }

    const localAllergies = splitPatientAllergies(initialAllergies);
    let apiAllergies = [];

    if (patientId) {
      try {
        const apiResponse = await getPatientApiUrl(patientDetails);
        apiAllergies = extractPatientAllergies(apiResponse);
      } catch (error) {
        console.error("Failed to load patient allergies:", error);
      }
    }

    const mergedAllergies = uniqueCaseInsensitive([
      ...localAllergies,
      ...apiAllergies,
    ]);

    allergyCacheRef.current = {
      key: cacheKey,
      allergies: mergedAllergies,
    };
    setPatientAllergies(mergedAllergies);

    return mergedAllergies;
  };

  const loadDiagnoses = async () => {
    const local = splitPatientDiagnoses(initialDiagnoses);
    let saved = [];
    if (typeof loadPatientDiagnoses === "function") {
      try {
        saved = splitPatientDiagnoses(await loadPatientDiagnoses());
      } catch (error) {
        console.error("Failed to load patient diagnoses:", error);
      }
    }
    const merged = splitPatientDiagnoses([...saved, ...local]);
    setPatientDiagnoses(merged);
    return merged;
  };

  const loadLabs = async () => {
    if (typeof loadPatientLabs !== "function") return null;
    try {
      const ctx = await loadPatientLabs();
      setPatientLabs(ctx || null);
      return ctx || null;
    } catch (error) {
      console.error("Failed to load patient lab results:", error);
      return null;
    }
  };

  const runLabLeg = async (drugs, ctx) => {
    if (!ctx?.lines?.length || !drugs.length) return [];
    try {
      const patientLine = [
        Number.isFinite(ctx?.meta?.ageYears) ? `age ${ctx.meta.ageYears} years` : "",
        ctx?.meta?.sex || "",
        Number.isFinite(ctx?.meta?.weightKg) ? `weight ${ctx.meta.weightKg} kg` : "",
      ]
        .filter(Boolean)
        .join(", ");
      return await getGeminiLabAlerts(drugs, ctx.lines, patientLine);
    } catch (error) {
      console.error("Drug-lab (organ function) check failed:", error);
      return [];
    }
  };

  const loadPregnancy = async () => {
    if (typeof loadPatientPregnancy !== "function") return null;
    try {
      const ctx = await loadPatientPregnancy();
      setPatientPregnancy(ctx || null);
      return ctx || null;
    } catch (error) {
      console.error("Failed to load pregnancy context:", error);
      return null;
    }
  };

  const runPregnancyLeg = async (drugs, ctx) => {
    if (!ctx?.applicable || !ctx?.line || !drugs.length) return [];
    try {
      return await getGeminiPregnancyAlerts(drugs, ctx.line);
    } catch (error) {
      console.error("Drug-pregnancy check failed:", error);
      return [];
    }
  };

  const buildFinalResults = ({
    matches = [],
    allergyMatches = [],
    diseaseMatches = [],
    labMatches = [],
    pregnancyMatches = [],
    drugs = [],
    allergies = [],
  }) => {
    const combined = [
      ...matches,
      ...allergyMatches,
      ...diseaseMatches,
      ...labMatches,
      ...pregnancyMatches,
    ];

    setHighCount(
      combined.filter((item) => (item.severity || "").toLowerCase() === "high")
        .length,
    );
    setUsedAI(combined.some((item) => item.source === "Gemini AI"));
    setResults({
      matches,
      allergyMatches,
      diseaseMatches,
      labMatches,
      pregnancyMatches,
      drugs,
      numDrugs: drugs.length,
      allergies,
    });
    setStatus("done");
  };

  const enrichInitialResultsWithAllergies = async (
    baseResults,
    medicinesText,
  ) => {
    const drugs = medicinesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const allergies = await loadPatientAllergies();
    let allergyMatches = baseResults?.allergyMatches || [];

    if (!allergyMatches.length && drugs.length && allergies.length) {
      try {
        allergyMatches = await getGeminiAllergyInteractions(drugs, allergies);
      } catch (error) {
        console.error("Allergy interaction check failed:", error);
      }
    }

    const diagnoses = await loadDiagnoses();
    let diseaseMatches = baseResults?.diseaseMatches || [];

    if (!diseaseMatches.length && drugs.length && diagnoses.length) {
      try {
        diseaseMatches = await getGeminiDiseaseContraindications(
          drugs,
          diagnoses,
        );
      } catch (error) {
        console.error("Drug-disease contraindication check failed:", error);
      }
    }

    const labCtx = await loadLabs();
    let labMatches = baseResults?.labMatches || [];
    if (!labMatches.length && drugs.length && labCtx?.lines?.length) {
      labMatches = await runLabLeg(drugs, labCtx);
    }

    const pregCtx = await loadPregnancy();
    let pregnancyMatches = baseResults?.pregnancyMatches || [];
    if (!pregnancyMatches.length && drugs.length && pregCtx?.applicable) {
      pregnancyMatches = await runPregnancyLeg(drugs, pregCtx);
    }

    buildFinalResults({
      matches: baseResults?.matches || [],
      allergyMatches,
      diseaseMatches,
      labMatches,
      pregnancyMatches,
      drugs,
      allergies,
    });
  };

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();

    if (open && initialResults) {
      setInput(initialMedicines);
      enrichInitialResultsWithAllergies(initialResults, initialMedicines);
    } else if (open && initialMedicines) {
      setInput(initialMedicines);
      setTimeout(() => {
        handleCheck(initialMedicines);
      }, 100);
    } else if (open) {
      loadPatientAllergies();
      loadDiagnoses();
      loadLabs();
      loadPregnancy();
    }
  }, [open, initialMedicines, initialResults]);

  const handleCheck = async (overriddenInput = null) => {
    const drugsInput = overriddenInput || input;
    const drugs = drugsInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    const singleDrugContext =
      drugs.length === 1 &&
      (patientAllergies.length > 0 ||
        patientDiagnoses.length > 0 ||
        splitPatientDiagnoses(initialDiagnoses).length > 0 ||
        (patientLabs?.lines?.length || 0) > 0 ||
        typeof loadPatientLabs === "function" ||
        typeof loadPatientPregnancy === "function");

    if (drugs.length < 2 && !singleDrugContext) {
      setErrMsg(
        t("please_enter_at_least_2_medications") ||
          "Please enter at least 2 medications separated by commas.",
      );
      setStatus("error");
      return;
    }

    setStatus("loading");
    setResults(null);
    setUsedAI(false);
    setErrMsg("");

    let matches = drugs.length >= 2 ? lookupInteractions(drugs) : [];

    if (matches.length === 0 && drugs.length >= 2) {
      try {
        matches = await getGeminiInteractions(drugs);
      } catch (geminiErr) {
        setErrMsg(
          t("UnReachable") ||
            "No local interactions found and Gemini is unreachable. Check your API key or network.",
        );
        setStatus("error");
        return;
      }
    }

    const allergies = await loadPatientAllergies();
    let allergyMatches = [];

    if (allergies.length > 0) {
      try {
        allergyMatches = await getGeminiAllergyInteractions(drugs, allergies);
      } catch (allergyErr) {
        console.error("Drug-allergy interaction check failed:", allergyErr);
      }
    }

    const diagnoses = await loadDiagnoses();
    let diseaseMatches = [];

    if (diagnoses.length > 0) {
      try {
        diseaseMatches = await getGeminiDiseaseContraindications(
          drugs,
          diagnoses,
        );
      } catch (diseaseErr) {
        console.error("Drug-disease contraindication check failed:", diseaseErr);
      }
    }

    const labCtx = patientLabs || (await loadLabs());
    const labMatches = await runLabLeg(drugs, labCtx);

    const pregCtx = patientPregnancy || (await loadPregnancy());
    const pregnancyMatches = await runPregnancyLeg(drugs, pregCtx);

    buildFinalResults({
      matches,
      allergyMatches,
      diseaseMatches,
      labMatches,
      pregnancyMatches,
      drugs,
      allergies,
    });
  };

  // High-risk findings across every leg, in one list for the acknowledgement panel.
  const highRiskFindings = (r) => {
    if (!r) return [];
    const list = [];
    (r.matches || []).forEach((m) =>
      list.push({ key: `dd|${m.drug1}|${m.drug2}`, title: `${m.drug1} + ${m.drug2}`, detail: m.message, severity: m.severity }),
    );
    (r.allergyMatches || []).forEach((m) =>
      list.push({ key: `al|${m.drug}|${m.allergy}`, title: `${m.drug} vs allergy ${m.allergy}`, detail: m.message, severity: m.severity }),
    );
    (r.diseaseMatches || []).forEach((m) =>
      list.push({ key: `ds|${m.drug}|${m.disease}`, title: `${m.drug} vs ${m.disease}`, detail: m.message, severity: m.severity }),
    );
    (r.labMatches || []).forEach((m) =>
      list.push({ key: `lb|${m.drug}|${m.parameter}`, title: `${m.drug} vs ${m.parameter}`, detail: m.message, severity: m.severity }),
    );
    (r.pregnancyMatches || []).forEach((m) =>
      list.push({ key: `pg|${m.drug}|${m.category}`, title: `${m.drug} - ${m.category}`, detail: m.message, severity: m.severity }),
    );
    return list;
  };

  const handleAcknowledge = (next) => {
    setAcks(next);
    if (typeof onAcknowledge === "function") {
      const pending = highRiskFindings(results).filter((f) => !next[f.key]).length;
      onAcknowledge(next, pending);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCheck();
    }
  };

  const reset = () => {
    setStatus("idle");
    setResults(null);
    setErrMsg("");
    setInput("");
    setUsedAI(false);
    setHighCount(0);
    setPatientAllergies([]);
    setPatientDiagnoses([]);
    setPatientLabs(null);
    setPatientPregnancy(null);
    setAcks({});
  };

  return (
    <>
      {open && (
        <div
          className="drug-interaction-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="drug-interaction-panel">
            <div className="drug-interaction-body">
              <label className="drug-interaction-input-label">
                {t("Enter Medications")}
              </label>
              <TextAreaInput
                ref={inputRef}
                rows={""}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                label={t("enter_medications") || "Enter Medications"}
                onKeyDown={handleKeyDown}
                placeholder={"e.g. Warfarin, Aspirin, Metformin"}
              />
              <div className="row">
                <div className="col-xl-9 col-lg-8 col-md-6 col-12">
                  <p
                    style={{ fontSize: "1.3rem" }}
                    className="background-theme-color theme-color px-3 rounded"
                  >
                    {t("Separate drug names with commas .")}
                  </p>
                </div>
                <div className="col-xl-3 col-lg-4 col-md-6 col-12">
                  <button
                    className="w-100 btn btn-sm btn-success"
                    onClick={handleCheck}
                    disabled={status === "loading"}
                  >
                    {status === "loading"
                      ? t("Analyzing...")
                      : t("Check Interactions")}
                  </button>
                </div>
              </div>

              {patientAllergies.length > 0 && (
                <div className="drug-interaction-allergy-strip">
                  <strong>{t("Patient Allergies:")}</strong>{" "}
                  {patientAllergies.join(", ")}
                </div>
              )}

              {patientDiagnoses.length > 0 && (
                <div className="drug-interaction-disease-strip">
                  <strong>{t("Patient Diagnoses / History:")}</strong>{" "}
                  {patientDiagnoses.join("; ")}
                </div>
              )}

              {patientLabs?.labs?.length > 0 && (
                <div className="drug-interaction-lab-strip">
                  <div className="drug-interaction-lab-strip__title">
                    {t("Recent Lab Results")} ({patientLabs.from} - {patientLabs.to})
                    {patientLabs.crcl && (
                      <span className="drug-interaction-lab-crcl">
                        {t("CrCl")} {patientLabs.crcl.value} {t("mL/min -")} {patientLabs.crcl.label}
                      </span>
                    )}
                  </div>
                  <div className="drug-interaction-lab-strip__items">
                    {patientLabs.labs.map((lab) => (
                      <span
                        key={lab.key}
                        className={`drug-interaction-lab-item${
                          lab.isCritical
                            ? " drug-interaction-lab-item--critical"
                            : lab.isAbnormal
                              ? " drug-interaction-lab-item--abnormal"
                              : ""
                        }`}
                        title={`${lab.testName ? lab.testName + " - " : ""}${lab.name}: ${lab.value} ${lab.unit}${lab.range ? " (ref " + lab.range + ")" : ""}${lab.date ? " on " + lab.date : ""}`}
                      >
                        <span className="drug-interaction-lab-item__name">{lab.name}</span>
                        <strong>
                          {lab.value}
                          {lab.unit ? " " + lab.unit : ""}
                        </strong>
                        {lab.flag && lab.flag !== "Normal" && (
                          <em>{lab.isCritical ? t("CRIT") : lab.flag.toUpperCase()}</em>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {patientLabs && !patientLabs.labs?.length && (
                <div className="drug-interaction-lab-strip drug-interaction-lab-strip--empty">
                  {t("No liver / kidney related lab results in the last 30 days")}
                </div>
              )}

              {patientPregnancy?.applicable && (
                <div
                  className={`drug-interaction-pregnancy-strip${
                    patientPregnancy.isPregnant || patientPregnancy.lactationPossible
                      ? " drug-interaction-pregnancy-strip--active"
                      : ""
                  }`}
                >
                  <strong>
                    <i className="fa fa-female mr-1" aria-hidden="true"></i>
                    {t("Pregnancy / Breast feeding:")}
                  </strong>{" "}
                  {patientPregnancy.line}
                  {patientPregnancy.source && (
                    <span className="drug-interaction-pregnancy-strip__src">
                      {t("Source:")}
                      {patientPregnancy.source}
                    </span>
                  )}
                </div>
              )}

              {status === "loading" && (
                <div className="drug-interaction-loading">
                  <div>{t("Checking...")}</div>
                  {t("Searching drug, allergy, disease, lab (organ function) and pregnancy interactions...")}
                </div>
              )}

              {status === "error" && (
                <div className="drug-interaction-error-box">
                  {t("Warning:")} {errMsg}
                </div>
              )}

              {status === "done" && results && (
                <>
                  <div className="drug-interaction-divider" />

                  <div className="drug-interaction-summary-row drug-interaction-summary-grid">
                    <div className="drug-interaction-summary-chip drug-interaction-primary">
                      <div className="drug-interaction-summary-num drug-interaction-primary">
                        {results.numDrugs}
                      </div>
                      <div className="drug-interaction-summary-lbl">
                        {t("Drugs") || t("Drugs")}
                      </div>
                    </div>
                    <div className="drug-interaction-summary-chip drug-interaction-warning">
                      <div className="drug-interaction-summary-num drug-interaction-warning">
                        {results.matches.length}
                      </div>
                      <div className="drug-interaction-summary-lbl">
                        {t("interactions") || t("Interactions")}
                      </div>
                    </div>
                    <div className="drug-interaction-summary-chip drug-interaction-danger">
                      <div className="drug-interaction-summary-num drug-interaction-danger">
                        {
                          results.matches.filter(
                            (m) => (m.severity || "").toLowerCase() === "high",
                          ).length
                        }
                      </div>
                      <div className="drug-interaction-summary-lbl">
                        {t("High Risk")}
                      </div>
                    </div>
                    <div className="drug-interaction-summary-chip drug-interaction-allergy">
                      <div className="drug-interaction-summary-num drug-interaction-allergy">
                        {results.allergyMatches?.length || 0}
                      </div>
                      <div className="drug-interaction-summary-lbl">
                        {t("Allergy Alerts")}
                      </div>
                    </div>
                    <div className="drug-interaction-summary-chip drug-interaction-disease">
                      <div className="drug-interaction-summary-num drug-interaction-disease">
                        {results.diseaseMatches?.length || 0}
                      </div>
                      <div className="drug-interaction-summary-lbl">
                        {t("Disease Alerts")}
                      </div>
                    </div>
                    <div className="drug-interaction-summary-chip drug-interaction-lab">
                      <div className="drug-interaction-summary-num drug-interaction-lab">
                        {results.labMatches?.length || 0}
                      </div>
                      <div className="drug-interaction-summary-lbl">
                        {t("Lab / Organ Alerts")}
                      </div>
                    </div>
                    <div className="drug-interaction-summary-chip drug-interaction-pregnancy">
                      <div className="drug-interaction-summary-num drug-interaction-pregnancy">
                        {results.pregnancyMatches?.length || 0}
                      </div>
                      <div className="drug-interaction-summary-lbl">
                        {t("Pregnancy Alerts")}
                      </div>
                    </div>
                  </div>

                  <AcknowledgementPanel
                    findings={highRiskFindings(results)}
                    acks={acks}
                    onChange={handleAcknowledge}
                  />

                  <div className="drug-interaction-section-title">
                    {t("Drug Information")}
                    <span className="drug-interaction-section-sub">
                      {t("dose adjustment by kidney function, pregnancy / breast-feeding categories, warnings")}
                    </span>
                  </div>
                  <DrugInfoPanel
                    drugs={results.drugs || []}
                    medicineItems={medicineItems}
                    labs={patientLabs}
                    pregnancy={patientPregnancy}
                    hospitalRules={hospitalRules}
                  />

                  <div className="drug-interaction-section-title">
                    {t("Drug Interactions")}
                  </div>
                  <div className="row g-10">
                    {results.matches.length > 0 ? (
                      results.matches.map((m, i) => {
                        const sev = getSev(m.severity);
                        return (
                          <div key={i} className="col-xl-4 col-md-6 col-12">
                            <div
                              className={`drug-interaction-card drug-interaction-${(m.severity || "unknown").toLowerCase()}`}
                            >
                              <div className="drug-interaction-card-drugs">
                                {m.drug1}
                                <span> + </span>
                                {m.drug2}
                              </div>
                              <div
                                className={`drug-interaction-badge drug-interaction-${(m.severity || "unknown").toLowerCase()}`}
                              >
                                {t(sev.label.toLowerCase().replace(" ", " ")) ||
                                  sev.label}
                              </div>
                              <div className="drug-interaction-card-msg">
                                {m.message}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12">
                        <div className="drug-interaction-safe-box">
                          <div>{t("OK")}</div>
                          <p>{t("No Known Interactions Found")}</p>
                          <p>
                            {
                              t("Always consult a healthcare provider before prescribing.")
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="drug-interaction-section-title">
                    {t("Drug Allergy Interactions")}
                  </div>
                  <div className="row g-10">
                    {results.allergyMatches?.length > 0 ? (
                      results.allergyMatches.map((item, index) => {
                        const sev = getSev(item.severity);
                        return (
                          <div
                            key={`${item.drug}-${item.allergy}-${index}`}
                            className="col-xl-4 col-md-6 col-12"
                          >
                            <div
                              className={`drug-interaction-card drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                            >
                              <div className="drug-interaction-card-drugs">
                                {item.drug}
                                <span> {t("vs")} </span>
                                {item.allergy}
                              </div>
                              <div
                                className={`drug-interaction-badge drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                              >
                                {t(sev.label.toLowerCase().replace(" ", " ")) ||
                                  sev.label}
                              </div>
                              <div className="drug-interaction-card-msg">
                                {item.message}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12">
                        <div className="drug-interaction-safe-box drug-interaction-safe-box-compact">
                          <p>{t("No Drug-Allergy Alerts Found")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="drug-interaction-section-title">
                    {t("Drug Disease Contraindications")}
                  </div>
                  <div className="row g-10">
                    {results.diseaseMatches?.length > 0 ? (
                      results.diseaseMatches.map((item, index) => {
                        const sev = getSev(item.severity);
                        return (
                          <div
                            key={`${item.drug}-${item.disease}-${index}`}
                            className="col-xl-4 col-md-6 col-12"
                          >
                            <div
                              className={`drug-interaction-card drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                            >
                              <div className="drug-interaction-card-drugs">
                                {item.drug}
                                <span> {t("vs")} </span>
                                {item.disease}
                              </div>
                              <div
                                className={`drug-interaction-badge drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                              >
                                {t(sev.label.toLowerCase().replace(" ", " ")) ||
                                  sev.label}
                              </div>
                              <div className="drug-interaction-card-msg">
                                {item.message}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12">
                        <div className="drug-interaction-safe-box drug-interaction-safe-box-compact">
                          <p>
                            {patientDiagnoses.length
                              ? t("No Drug-Disease Contraindications Found")
                              : t("No diagnosis recorded for this patient - nothing to check against")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="drug-interaction-section-title">
                    {t("Liver / Kidney Function (Lab) Alerts")}
                  </div>
                  <div className="row g-10">
                    {results.labMatches?.length > 0 ? (
                      results.labMatches.map((item, index) => {
                        const sev = getSev(item.severity);
                        return (
                          <div
                            key={`${item.drug}-${item.parameter}-${index}`}
                            className="col-xl-4 col-md-6 col-12"
                          >
                            <div
                              className={`drug-interaction-card drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                            >
                              <div className="drug-interaction-card-drugs">
                                {item.drug}
                                <span> {t("vs")} </span>
                                {item.parameter}
                              </div>
                              <div
                                className={`drug-interaction-badge drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                              >
                                {t(sev.label.toLowerCase().replace(" ", " ")) ||
                                  sev.label}
                              </div>
                              <div className="drug-interaction-card-msg">
                                {item.message}
                              </div>
                              {item.recommendation && (
                                <div className="drug-interaction-card-reco">
                                  <strong>{t("Suggested:")}</strong> {item.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12">
                        <div className="drug-interaction-safe-box drug-interaction-safe-box-compact">
                          <p>
                            {patientLabs?.labs?.length
                              ? t("No Liver / Kidney Function Concerns Found")
                              : t("No recent liver / kidney lab results - nothing to check against")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {patientPregnancy?.applicable && (
                    <>
                      <div className="drug-interaction-section-title">
                        {t("Pregnancy / Breast-feeding Alerts")}
                      </div>
                      <div className="row g-10">
                        {results.pregnancyMatches?.length > 0 ? (
                          results.pregnancyMatches.map((item, index) => {
                            const sev = getSev(item.severity);
                            return (
                              <div
                                key={`${item.drug}-${item.category}-${index}`}
                                className="col-xl-4 col-md-6 col-12"
                              >
                                <div
                                  className={`drug-interaction-card drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                                >
                                  <div className="drug-interaction-card-drugs">
                                    {item.drug}
                                    <span> - </span>
                                    {item.category}
                                  </div>
                                  <div
                                    className={`drug-interaction-badge drug-interaction-${(item.severity || "unknown").toLowerCase()}`}
                                  >
                                    {t(sev.label.toLowerCase().replace(" ", " ")) ||
                                      sev.label}
                                  </div>
                                  <div className="drug-interaction-card-msg">
                                    {item.message}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-12">
                            <div className="drug-interaction-safe-box drug-interaction-safe-box-compact">
                              <p>{t("No Pregnancy / Breast-feeding Concerns Found")}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}


                  <div className="text-center">
                    <button className="btn btn-sm btn-success" onClick={reset}>
                      {t("check again") || t("Check Again")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAiFeature("drugInteraction", DrugInteractionWidget);
