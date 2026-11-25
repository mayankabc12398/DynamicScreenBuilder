import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import {
  GetOncoAssessment,
  SaveOncoAssessment,
} from "../../../networkServices/DoctorApi";

/* =============================================================================
   Onco Assessment — one EMR form covering pain, clinical examination, neck nodes
   and TNM staging for a head & neck / oral cavity patient.

   Opened from the EMR form list on /ViewConsultation. The menu row lives in
   cpoe_menumaster with URL 'OncoAssessment' (see the API repo,
   DBScripts/2026-09-27_onco_assessment.sql), and the EMR lazy-loads this file by
   that name, so the file name and that URL have to stay in step.

   Saving is an upsert: Doctor/SaveOncoAssessment supersedes the visit's previous
   values, so the same button is the insert on a fresh visit and the update on a
   revisit — the label switches once a saved assessment has been loaded.
   ============================================================================= */

const C = {
  ink: "#1f2d33", sub: "#6c757d", line: "#e4e9ec", soft: "#f6f8f9",
  teal: "#0e7a65", tealBg: "#e8f7f4", tealLine: "#9fd8cb",
  amber: "#c47d0a", red: "#b52020", chip: "#ffffff",
};

const SCALES = [
  { key: "NRS", label: "NRS 0–10" },
  { key: "FACES", label: "Faces · children and non-verbal" },
];
// Wong-Baker style anchors, used when the patient cannot self-report a number.
const FACE_SCORES = [
  { score: 0, face: "😀" }, { score: 2, face: "🙂" }, { score: 4, face: "😐" },
  { score: 6, face: "🙁" }, { score: 8, face: "😣" }, { score: 10, face: "😭" },
];
const PAIN_CHARACTER = ["Burning", "Stabbing", "Dull aching", "Throbbing", "Shooting"];
const HN_SYMPTOMS = ["Referred otalgia", "Odynophagia", "Dysphagia", "Trismus", "Change in voice"];

const ORAL_SITES = [
  "Buccal mucosa", "Tongue (oral)", "Floor of mouth", "Alveolus / Gingiva",
  "Hard palate", "Retromolar trigone", "Lip",
];
const LATERALITY = ["Left", "Right", "Midline", "Bilateral"];
const MORPHOLOGY = ["Ulcerative", "Proliferative", "Ulceroproliferative", "Infiltrative", "Verrucous"];
/* Extension drives the T suggestion: the first three upstage to T4a (moderately
   advanced local disease), the masticator space to T4b (very advanced). */
const EXTENSION = [
  "GB sulcus", "Retromolar trigone", "Skin of face",
  "Mandible (cortical bone)", "Maxillary sinus", "Masticator space",
];
const T4A_EXTENSION = ["Skin of face", "Mandible (cortical bone)", "Maxillary sinus"];
const T4B_EXTENSION = ["Masticator space"];

const NODE_LEVELS = ["Ia", "Ib", "IIa", "IIb", "III", "IV", "Va", "Vb", "VI", "VII"];
const NODE_SIDES = ["Left", "Right"];
const NODE_MOBILITY = ["Mobile", "Restricted", "Fixed"];
const YES_NO = ["Yes", "No"];

const T_OPTIONS = ["TX", "Tis", "T1", "T2", "T3", "T4a", "T4b"];
const N_OPTIONS = ["NX", "N0", "N1", "N2a", "N2b", "N2c", "N3a", "N3b"];
const M_OPTIONS = ["M0", "M1"];
const ECOG_OPTIONS = [
  "0 · Fully active", "1 · Restricted strenuous activity", "2 · Ambulatory, self-caring",
  "3 · Limited self-care", "4 · Completely disabled",
];
const STAGE_OPTIONS = ["Stage 0", "Stage I", "Stage II", "Stage III", "Stage IVA", "Stage IVB", "Stage IVC"];

const T_HELP = {
  TX: "Primary tumour cannot be assessed.",
  Tis: "Carcinoma in situ.",
  T1: "Tumour 2 cm or less with DOI 5 mm or less.",
  T2: "Tumour 2 cm or less with DOI over 5 mm, or over 2 cm up to 4 cm with DOI 10 mm or less.",
  T3: "Tumour over 4 cm, or any tumour with DOI over 10 mm.",
  T4a: "Moderately advanced local disease — invades cortical bone, maxillary sinus or skin of face.",
  T4b: "Very advanced local disease — invades masticator space, pterygoid plates or skull base.",
};
const N_HELP = {
  NX: "Regional nodes cannot be assessed.",
  N0: "No regional lymph node metastasis.",
  N1: "Single ipsilateral node, 3 cm or less, ENE negative.",
  N2a: "Single ipsilateral node, over 3 cm up to 6 cm, ENE negative.",
  N2b: "Multiple ipsilateral nodes, none over 6 cm, ENE negative.",
  N2c: "Bilateral or contralateral nodes, none over 6 cm, ENE negative.",
  N3a: "Node over 6 cm, ENE negative.",
  N3b: "Clinically overt extranodal extension.",
};

const num = (v) => {
  const n = parseFloat(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};
const csv = (arr) => (arr || []).join(", ");
const fromCsv = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const severityOf = (score) => {
  if (score === null || score === "") return null;
  const n = Number(score);
  if (n === 0) return { label: "None", color: "#8a979e" };
  if (n <= 3) return { label: "Mild", color: "#7fc8ad" };
  if (n <= 6) return { label: "Moderate", color: "#e8b84b" };
  return { label: "Severe", color: "#9e2b25" };
};

/* AJCC 8th edition, oral cavity. DOI (depth of invasion) only comes off the
   biopsy report, so while it is blank the suggestion takes the lower T — and
   says so, rather than quietly assuming a depth nobody measured. */
export const suggestT = ({ sizeCm, doiMm, extension = [] }) => {
  if (extension.some((e) => T4B_EXTENSION.includes(e))) {
    return { t: "T4b", why: "extension to masticator space" };
  }
  const t4a = extension.filter((e) => T4A_EXTENSION.includes(e));
  if (t4a.length) {
    return { t: "T4a", why: `extension to ${csv(t4a).toLowerCase()}` };
  }
  if (sizeCm === null) return null;
  const doiText = doiMm === null ? "DOI not recorded" : `DOI ${doiMm} mm`;
  const size = `largest dimension ${sizeCm} cm`;
  if (sizeCm > 4) return { t: "T3", why: `${size}, ${doiText}` };
  if (doiMm !== null && doiMm > 10) return { t: "T3", why: `${size}, ${doiText}` };
  if (sizeCm <= 2) {
    return doiMm !== null && doiMm > 5
      ? { t: "T2", why: `${size}, ${doiText}` }
      : { t: "T1", why: `${size}, ${doiText}` };
  }
  return { t: "T2", why: `${size}, ${doiText}` };
};

/* Clinical N from the neck table. "Ipsilateral" is read against the lesion's own
   laterality — a single node on the other side is N2c, not N1. */
export const suggestN = (nodes = [], lesionSide) => {
  const live = nodes.filter((n) => n?.level || n?.size || n?.side);
  if (!live.length) return { n: "N0", why: "no palpable node recorded" };
  if (live.some((n) => n?.ene === "Yes")) {
    return { n: "N3b", why: "extranodal extension present" };
  }
  const sizes = live.map((n) => num(n?.size)).filter((s) => s !== null);
  const max = sizes.length ? Math.max(...sizes) : null;
  if (max !== null && max > 6) return { n: "N3a", why: `node ${max} cm, no ENE` };

  const sides = [...new Set(live.map((n) => n?.side).filter(Boolean))];
  const contralateral =
    (lesionSide === "Left" || lesionSide === "Right") &&
    sides.some((s) => s !== lesionSide);
  if (sides.length > 1 || contralateral) {
    return { n: "N2c", why: "bilateral or contralateral nodes, none over 6 cm" };
  }
  if (live.length > 1) {
    return { n: "N2b", why: `${live.length} ipsilateral nodes, none over 6 cm` };
  }
  const only = max === null ? "" : `, ${max} cm`;
  return max !== null && max > 3
    ? { n: "N2a", why: `single ipsilateral node${only}, no ENE` }
    : { n: "N1", why: `single ipsilateral node${only}, no ENE` };
};

/* AJCC 8th edition stage table for the oral cavity. Ordered most advanced first —
   M1 outranks everything, then N3 / T4b, then N2 / T4a. */
export const stageGroup = (T, N, M) => {
  if (!T || !N || !M) return null;
  if (M === "M1") return "Stage IVC";
  if (T === "Tis") return "Stage 0";
  if (T === "TX" || N === "NX") return null;
  if (N.startsWith("N3") || T === "T4b") return "Stage IVB";
  if (T === "T4a" || N.startsWith("N2")) return "Stage IVA";
  if (N === "N1") return "Stage III";
  if (T === "T3") return "Stage III";
  if (T === "T2") return "Stage II";
  if (T === "T1") return "Stage I";
  return null;
};

/* The sentence the doctor would have typed, assembled from what they already
   ticked. Once they edit it by hand it stops being overwritten — the structured
   values stay as they are, which is what the staging reads. */
export const composeFinding = ({ sizeL, sizeW, morphology, laterality, site, extension = [] }) => {
  const size = sizeL && sizeW ? `${sizeL}x${sizeW} cm ` : sizeL ? `${sizeL} cm ` : "";
  const morph = morphology ? `${morphology.toLowerCase()} ` : "";
  const where = [laterality ? laterality.toLowerCase() : "", site ? site.toLowerCase() : ""]
    .filter(Boolean)
    .join(" ");
  if (!size && !morph && !where) return "";
  const head = `${size}${morph}lesion${where ? `, ${where}` : ""}`;
  return extension.length
    ? `${head}, extending to ${csv(extension).toLowerCase()}`
    : head;
};

const EMPTY_NODE = { level: "", side: "", size: "", mobility: "", ene: "" };

const INITIAL = {
  Pain_Scale: "NRS",
  Pain_Score: "",
  Pain_Site: "",
  Pain_Onset: "",
  Pain_Duration: "",
  Pain_Aggravating: "",
  Pain_Relieving: "",
  Pain_Analgesic: "",
  Pain_Character: "",
  Pain_HNSymptoms: "",
  Pain_Plan: "",
  Exam_Site: "",
  Exam_Laterality: "",
  Exam_SizeL: "",
  Exam_SizeW: "",
  Exam_Morphology: "",
  Exam_Induration: "",
  Exam_Bleeding: "",
  Exam_MouthOpening: "",
  Exam_Extension: "",
  Exam_Finding: "",
  Exam_FindingEdited: "0",
  Exam_Oropharynx: "",
  Exam_Nose: "",
  Exam_Larynx: "",
  Exam_CranialNerves: "",
  Neck_Thyroid: "",
  Neck_Salivary: "",
  Dx_Diagnosis: "",
  Dx_ICD10: "",
  Dx_Status: "Provisional",
  Dx_Basis: "c",
  Dx_DOI: "",
  Dx_T: "",
  Dx_N: "",
  Dx_M: "M0",
  Dx_ECOG: "",
  Dx_StageOverride: "0",
  Dx_Stage: "",
};

// ── Small building blocks ───────────────────────────────────────────────────
const Chip = ({ active, onClick, children, width }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "7px 14px",
      borderRadius: 18,
      border: `1px solid ${active ? C.tealLine : C.line}`,
      background: active ? C.tealBg : C.chip,
      color: active ? C.teal : C.ink,
      fontWeight: active ? 700 : 500,
      fontSize: 12.5,
      cursor: "pointer",
      minWidth: width,
    }}
  >
    {children}
  </button>
);

const Box = ({ active, onClick, children, width }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "9px 14px",
      borderRadius: 8,
      border: `1px solid ${active ? C.tealLine : C.line}`,
      background: active ? C.tealBg : C.chip,
      color: active ? C.teal : C.ink,
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      minWidth: width,
    }}
  >
    {children}
  </button>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 5 }}>
    {children}
  </div>
);

const Section = ({ n, title, right, children }) => (
  <div
    style={{
      background: "#fff",
      border: `1px solid ${C.line}`,
      borderRadius: 12,
      marginBottom: 14,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "12px 16px",
        borderBottom: `1px solid ${C.line}`,
        background: C.soft,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 24, height: 24, borderRadius: "50%", background: C.tealBg,
            color: C.teal, fontSize: 12, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {n}
        </span>
        <b style={{ fontSize: 14.5, color: C.ink }}>{title}</b>
      </span>
      {right}
    </div>
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

function OncoAssessment({ patientDetail }) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";
  const transactionID = patient?.TransactionID || "";

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  const [form, setForm] = useState(INITIAL);
  const [nodes, setNodes] = useState([{ ...EMPTY_NODE }]);
  const [saved, setSaved] = useState(false); // a stored assessment was loaded
  const [busy, setBusy] = useState(false);
  const printRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k, value) => {
    const list = fromCsv(form[k]);
    set(k, csv(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]));
  };
  const has = (k, value) => fromCsv(form[k]).includes(value);

  // ── Load the visit's assessment ───────────────────────────────────────────
  useEffect(() => {
    if (!patientID || !transactionID) return undefined;
    let active = true;
    (async () => {
      try {
        const res = await GetOncoAssessment(patientID, transactionID);
        if (!active) return;
        // "No record found" is a visit not assessed yet, not an error.
        if (!res?.success || !Array.isArray(res?.data) || !res.data.length) return;
        const next = { ...INITIAL };
        let loadedNodes = null;
        res.data.forEach((row) => {
          const key = String(row?.keyName ?? row?.KeyName ?? "").trim();
          const value = row?.value ?? row?.Value ?? "";
          if (key === "Neck_Nodes") {
            try {
              const parsed = JSON.parse(value || "[]");
              if (Array.isArray(parsed)) loadedNodes = parsed;
            } catch {
              loadedNodes = null;
            }
          } else if (key in next) {
            next[key] = value ?? "";
          }
        });
        setForm(next);
        setNodes(loadedNodes && loadedNodes.length ? loadedNodes : [{ ...EMPTY_NODE }]);
        setSaved(true);
      } catch (e) {
        notify(t("Failed to load the onco assessment"), "error");
      }
    })();
    return () => {
      active = false;
    };
  }, [patientID, transactionID]);

  // ── Derived clinical values ───────────────────────────────────────────────
  const score = form.Pain_Score === "" ? null : Number(form.Pain_Score);
  const severity = severityOf(form.Pain_Score);
  const planRequired = score !== null && score >= 4;

  const extension = fromCsv(form.Exam_Extension);
  const autoFinding = useMemo(
    () =>
      composeFinding({
        sizeL: form.Exam_SizeL,
        sizeW: form.Exam_SizeW,
        morphology: form.Exam_Morphology,
        laterality: form.Exam_Laterality,
        site: form.Exam_Site,
        extension,
      }),
    [form.Exam_SizeL, form.Exam_SizeW, form.Exam_Morphology, form.Exam_Laterality, form.Exam_Site, form.Exam_Extension],
  );
  useEffect(() => {
    if (form.Exam_FindingEdited === "1") return;
    setForm((f) => (f.Exam_Finding === autoFinding ? f : { ...f, Exam_Finding: autoFinding }));
  }, [autoFinding, form.Exam_FindingEdited]);

  const largest = useMemo(() => {
    const l = num(form.Exam_SizeL);
    const w = num(form.Exam_SizeW);
    if (l === null && w === null) return null;
    return Math.max(l ?? 0, w ?? 0);
  }, [form.Exam_SizeL, form.Exam_SizeW]);

  const tSuggest = useMemo(
    () => suggestT({ sizeCm: largest, doiMm: num(form.Dx_DOI), extension }),
    [largest, form.Dx_DOI, form.Exam_Extension],
  );
  const nSuggest = useMemo(
    () => suggestN(nodes, form.Exam_Laterality),
    [nodes, form.Exam_Laterality],
  );
  const calculatedStage = stageGroup(form.Dx_T, form.Dx_N, form.Dx_M);
  const overriding = form.Dx_StageOverride === "1";
  const shownStage = overriding ? form.Dx_Stage : calculatedStage;

  // ── Neck nodes ────────────────────────────────────────────────────────────
  const setNode = (i, k, v) =>
    setNodes((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addNode = () => setNodes((rows) => [...rows, { ...EMPTY_NODE }]);
  const removeNode = (i) =>
    setNodes((rows) => (rows.length === 1 ? [{ ...EMPTY_NODE }] : rows.filter((_, idx) => idx !== i)));

  // ── Save / update ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!patientID || !transactionID) {
      notify(t("No patient visit is loaded"), "error");
      return;
    }
    if (planRequired && !String(form.Pain_Plan).trim()) {
      notify(t("A pain management plan is required when the score is 4 or more"), "warn");
      return;
    }
    if (!String(form.Dx_Diagnosis).trim()) {
      notify(t("Diagnosis is required"), "warn");
      return;
    }
    setBusy(true);
    try {
      const valueDetails = Object.keys(form).map((k) => ({
        keyName: k,
        value: String(form[k] ?? ""),
      }));
      // The node table is a list, so it travels as JSON under one key rather than
      // as Node1_Level, Node2_Level ... which would need cleaning up on every save.
      valueDetails.push({
        keyName: "Neck_Nodes",
        value: JSON.stringify(nodes.filter((n) => n.level || n.side || n.size)),
      });
      const res = await SaveOncoAssessment({ patientID, transactionID, valueDetails });
      if (res?.success) {
        notify(res?.message || t("Record saved successfully"), "success");
        setSaved(true);
      } else {
        notify(res?.message || t("Failed to save record"), "error");
      }
    } catch (e) {
      notify(t("Failed to save record"), "error");
    } finally {
      setBusy(false);
    }
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const printRows = () => {
    const rows = [
      ["Pain scale", form.Pain_Scale === "FACES" ? "Faces" : "NRS 0–10"],
      ["Pain score", score === null ? "Not recorded" : `${score}${severity ? ` (${severity.label})` : ""}`],
      ["Site", form.Pain_Site],
      ["Onset", form.Pain_Onset],
      ["Duration", form.Pain_Duration],
      ["Aggravating factors", form.Pain_Aggravating],
      ["Relieving factors", form.Pain_Relieving],
      ["Current analgesic", form.Pain_Analgesic],
      ["Character", form.Pain_Character],
      ["Head & neck symptoms", form.Pain_HNSymptoms],
      ["Pain management plan", form.Pain_Plan],
    ];
    const exam = [
      ["Primary site", form.Exam_Site],
      ["Laterality", form.Exam_Laterality],
      ["Size", form.Exam_SizeL && form.Exam_SizeW ? `${form.Exam_SizeL} x ${form.Exam_SizeW} cm` : ""],
      ["Morphology", form.Exam_Morphology],
      ["Induration", form.Exam_Induration],
      ["Bleeding on touch", form.Exam_Bleeding],
      ["Mouth opening", form.Exam_MouthOpening ? `${form.Exam_MouthOpening} mm` : ""],
      ["Extension", form.Exam_Extension],
      ["Examination finding", form.Exam_Finding],
      ["Oropharynx", form.Exam_Oropharynx],
      ["Nose & nasopharynx", form.Exam_Nose],
      ["Larynx (IDL / scopy)", form.Exam_Larynx],
      ["Cranial nerves", form.Exam_CranialNerves],
      ["Thyroid", form.Neck_Thyroid],
      ["Salivary glands", form.Neck_Salivary],
    ];
    const dx = [
      ["Diagnosis", form.Dx_Diagnosis],
      ["ICD-10", form.Dx_ICD10],
      ["Status", form.Dx_Status],
      ["Staging basis", form.Dx_Basis === "p" ? "Pathological" : "Clinical"],
      ["Depth of invasion", form.Dx_DOI ? `${form.Dx_DOI} mm` : ""],
      ["T", form.Dx_T],
      ["N", form.Dx_N],
      ["M", form.Dx_M],
      ["Stage group", shownStage ? `${shownStage}${overriding ? " (overridden)" : ""}` : ""],
      ["ECOG", form.Dx_ECOG],
    ];
    return { rows, exam, dx };
  };

  const handlePrint = () => {
    const { rows, exam, dx } = printRows();
    const esc = (v) =>
      String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
    const block = (title, pairs) => {
      const body = pairs
        .filter(([, v]) => String(v ?? "").trim())
        .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
        .join("");
      return body ? `<h2>${esc(title)}</h2><table class="kv">${body}</table>` : "";
    };
    const liveNodes = nodes.filter((n) => n.level || n.side || n.size);
    const nodeTable = liveNodes.length
      ? `<h2>Neck examination</h2><table class="grid">
           <tr><th>#</th><th>Level</th><th>Side</th><th>Size</th><th>Mobility</th><th>Extranodal ext.</th></tr>
           ${liveNodes
             .map(
               (n, i) =>
                 `<tr><td>${i + 1}</td><td>${esc(n.level)}</td><td>${esc(n.side)}</td>` +
                 `<td>${esc(n.size ? `${n.size} cm` : "")}</td><td>${esc(n.mobility)}</td><td>${esc(n.ene)}</td></tr>`,
             )
             .join("")}
         </table>`
      : "";

    const demo = [
      ["Patient", patient?.Pname || patient?.PatientName],
      ["UHID", patientID],
      ["Age / Sex", [patient?.Age, patient?.Gender || patient?.Sex].filter(Boolean).join(" / ")],
      ["Contact", patient?.ContactNo],
      ["Panel", patient?.PanelName],
      ["Doctor", patient?.DName],
      ["Visit date", patient?.AppointmentDate],
      ["Visit no", patient?.TransNo || transactionID],
    ]
      .filter(([, v]) => String(v ?? "").trim())
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
      .join("");

    const html =
      `<!DOCTYPE html><html><head><title>Onco Assessment</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `@page{size:A4;margin:14mm;}` +
      `body{font:12px/1.45 Arial,Helvetica,sans-serif;color:#1f2d33;}` +
      `h1{font-size:16px;text-align:center;}` +
      `.hosp{text-align:center;font-size:13px;font-weight:700;margin-bottom:2px;}` +
      `.sub{text-align:center;font-size:10.5px;color:#6c757d;margin-bottom:10px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 14px;border:1px solid #e4e9ec;` +
      `border-radius:6px;padding:8px 10px;margin:10px 0 14px;}` +
      `.demo div{font-size:11px;}.demo span{color:#6c757d;display:inline-block;min-width:66px;}` +
      `h2{font-size:12.5px;margin:12px 0 5px;padding-bottom:3px;border-bottom:1px solid #e4e9ec;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `.kv th{width:32%;text-align:left;font-weight:600;color:#6c757d;padding:3px 6px 3px 0;vertical-align:top;}` +
      `.kv td{padding:3px 0;vertical-align:top;}` +
      `.grid th,.grid td{border:1px solid #e4e9ec;padding:4px 6px;text-align:left;font-size:11px;}` +
      `.stage{margin-top:12px;padding:8px 10px;border:1px solid #9fd8cb;background:#e8f7f4;border-radius:6px;font-size:13px;}` +
      `.sign{margin-top:34px;display:flex;justify-content:space-between;font-size:11px;color:#6c757d;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>Onco Assessment</h1>` +
      `<div class="sub">AJCC 8th edition · Oral cavity</div>` +
      `<div class="demo">${demo}</div>` +
      block("Pain assessment", rows) +
      block("Clinical examination", exam) +
      nodeTable +
      block("Diagnosis & staging", dx) +
      (shownStage
        ? `<div class="stage"><b>${esc(shownStage)}</b> — ${esc(
            `${form.Dx_Basis === "p" ? "p" : "c"}${form.Dx_T || "T?"} ${form.Dx_N || "N?"} ${form.Dx_M || "M?"}`,
          )}</div>`
        : "") +
      `<div class="sign"><span>Printed: ${esc(new Date().toLocaleString())}</span><span>Doctor's signature</span></div>` +
      `</body></html>`;

    // Hidden iframe, not window.open: not blocked by popup blockers.
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (_) {
            /* already removed */
          }
        }, 500);
      }
    }, 200);
  };

  const input = (key, placeholder, extra = {}) => (
    <input
      type="text"
      className="form-control form-control-sm"
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
      {...extra}
    />
  );

  return (
    <div ref={printRef} style={{ background: C.soft, padding: 12 }}>
      {/* ── 1 · Pain assessment ───────────────────────────────────────────── */}
      <Section
        n={1}
        title={t("Pain assessment")}
        right={
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 12,
              background: severity ? C.tealBg : "#eef1f3",
              color: severity ? C.teal : C.sub,
            }}
          >
            {score === null
              ? t("Score not recorded")
              : `${t("Score")} ${score} · ${t(severity.label)}`}
          </span>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 12.5, color: C.sub }}>{t("Scale")}</span>
          {SCALES.map((s) => (
            <Box
              key={s.key}
              active={form.Pain_Scale === s.key}
              onClick={() => set("Pain_Scale", s.key)}
            >
              {t(s.label)}
            </Box>
          ))}
        </div>

        {form.Pain_Scale === "NRS" ? (
          <>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Array.from({ length: 11 }).map((_, i) => (
                <Box
                  key={i}
                  width={62}
                  active={String(score) === String(i)}
                  onClick={() => set("Pain_Score", String(i))}
                >
                  {i}
                </Box>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[
                { flex: 1, color: "#c8d2d6", text: "0 None" },
                { flex: 3, color: "#7fc8ad", text: "1–3 Mild" },
                { flex: 3, color: "#e8b84b", text: "4–6 Moderate" },
                { flex: 4, color: "#9e2b25", text: "7–10 Severe" },
              ].map((b) => (
                <div key={b.text} style={{ flex: b.flex }}>
                  <div style={{ height: 4, borderRadius: 2, background: b.color }} />
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{t(b.text)}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FACE_SCORES.map((f) => (
              <Box
                key={f.score}
                width={76}
                active={String(score) === String(f.score)}
                onClick={() => set("Pain_Score", String(f.score))}
              >
                <span style={{ fontSize: 18 }}>{f.face}</span>
                <div style={{ fontSize: 11 }}>{f.score}</div>
              </Box>
            ))}
          </div>
        )}

        <div className="row" style={{ marginTop: 14 }}>
          <div className="col-md-4">
            <Label>{t("Site")}</Label>
            {input("Pain_Site", t("e.g. Left cheek, radiating to ear"))}
          </div>
          <div className="col-md-4">
            <Label>{t("Onset")}</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Sudden", "Gradual"].map((o) => (
                <Box
                  key={o}
                  active={form.Pain_Onset === o}
                  onClick={() => set("Pain_Onset", form.Pain_Onset === o ? "" : o)}
                >
                  {t(o)}
                </Box>
              ))}
            </div>
          </div>
          <div className="col-md-4">
            <Label>{t("Duration")}</Label>
            {input("Pain_Duration", t("e.g. 6 weeks"))}
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <div className="col-md-4">
            <Label>{t("Aggravating factors")}</Label>
            {input("Pain_Aggravating", t("e.g. Spicy food, chewing"))}
          </div>
          <div className="col-md-4">
            <Label>{t("Relieving factors")}</Label>
            {input("Pain_Relieving", t("e.g. Analgesics"))}
          </div>
          <div className="col-md-4">
            <Label>{t("Current analgesic")}</Label>
            {input("Pain_Analgesic", t("Drug, dose, frequency"))}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Label>{t("Character")}</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PAIN_CHARACTER.map((c) => (
              <Chip
                key={c}
                active={has("Pain_Character", c)}
                onClick={() => toggleIn("Pain_Character", c)}
              >
                {t(c)}
              </Chip>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Label>{t("Head & neck symptoms")}</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {HN_SYMPTOMS.map((c) => (
              <Chip
                key={c}
                active={has("Pain_HNSymptoms", c)}
                onClick={() => toggleIn("Pain_HNSymptoms", c)}
              >
                {t(c)}
              </Chip>
            ))}
          </div>
        </div>

        {planRequired ? (
          <div style={{ marginTop: 14 }}>
            <Label>
              {t("Pain management plan")}{" "}
              <span style={{ color: C.red }}>* {t("required at score 4 or more")}</span>
            </Label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              value={form.Pain_Plan}
              onChange={(e) => set("Pain_Plan", e.target.value)}
              placeholder={t("Step, drug, dose, review date")}
            />
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 14 }}>
            {t("A pain management plan becomes mandatory when the score is 4 or more.")}
          </div>
        )}
      </Section>

      {/* ── 2 · Clinical examination ──────────────────────────────────────── */}
      <Section n={2} title={t("Clinical examination")}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 0.6, marginBottom: 10 }}>
          {t("PRIMARY LESION · ORAL CAVITY")}
        </div>
        <div className="row">
          <div className="col-md-4">
            <Label>{t("Site")}</Label>
            <select
              className="form-control form-control-sm"
              value={form.Exam_Site}
              onChange={(e) => set("Exam_Site", e.target.value)}
            >
              <option value="">{t("Select")}</option>
              {ORAL_SITES.map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <Label>{t("Laterality")}</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LATERALITY.map((l) => (
                <Box
                  key={l}
                  active={form.Exam_Laterality === l}
                  onClick={() => set("Exam_Laterality", form.Exam_Laterality === l ? "" : l)}
                >
                  {t(l)}
                </Box>
              ))}
            </div>
          </div>
          <div className="col-md-4">
            <Label>{t("Size (length × width)")}</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {input("Exam_SizeL", "", { style: { width: 80 } })}
              <span style={{ color: C.sub }}>×</span>
              {input("Exam_SizeW", "", { style: { width: 80 } })}
              <span style={{ fontSize: 12, color: C.sub }}>{t("cm")}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>{t("Morphology")}</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MORPHOLOGY.map((m) => (
              <Box
                key={m}
                active={form.Exam_Morphology === m}
                onClick={() => set("Exam_Morphology", form.Exam_Morphology === m ? "" : m)}
              >
                {t(m)}
              </Box>
            ))}
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div className="col-md-4">
            <Label>{t("Induration")}</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {YES_NO.map((v) => (
                <Box
                  key={v}
                  active={form.Exam_Induration === v}
                  onClick={() => set("Exam_Induration", form.Exam_Induration === v ? "" : v)}
                >
                  {t(v)}
                </Box>
              ))}
            </div>
          </div>
          <div className="col-md-4">
            <Label>{t("Bleeding on touch")}</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {YES_NO.map((v) => (
                <Box
                  key={v}
                  active={form.Exam_Bleeding === v}
                  onClick={() => set("Exam_Bleeding", form.Exam_Bleeding === v ? "" : v)}
                >
                  {t(v)}
                </Box>
              ))}
            </div>
          </div>
          <div className="col-md-4">
            <Label>{t("Mouth opening (inter-incisor)")}</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {input("Exam_MouthOpening", "0", { style: { width: 110 } })}
              <span style={{ fontSize: 12, color: C.sub }}>{t("mm")}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>{t("Extension to adjacent structures")}</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EXTENSION.map((e) => (
              <Chip
                key={e}
                active={has("Exam_Extension", e)}
                onClick={() => toggleIn("Exam_Extension", e)}
              >
                {t(e)}
              </Chip>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            border: `1px solid ${C.tealLine}`,
            background: C.tealBg,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <b style={{ fontSize: 12.5, color: C.ink }}>{t("Examination finding")}</b>
            <span
              style={{
                fontSize: 10.5,
                background: "#fff",
                color: C.teal,
                borderRadius: 10,
                padding: "1px 8px",
                fontWeight: 600,
              }}
            >
              {form.Exam_FindingEdited === "1" ? t("Edited") : t("Auto-composed")}
            </span>
            {form.Exam_FindingEdited === "1" && (
              <button
                type="button"
                className="btn btn-sm btn-link p-0"
                style={{ fontSize: 11 }}
                onClick={() => set("Exam_FindingEdited", "0")}
              >
                {t("Recompose")}
              </button>
            )}
          </div>
          <textarea
            className="form-control form-control-sm"
            rows={2}
            value={form.Exam_Finding}
            onChange={(e) => {
              setForm((f) => ({ ...f, Exam_Finding: e.target.value, Exam_FindingEdited: "1" }));
            }}
          />
          <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>
            {t("Composed from site, laterality, size, morphology and extension. Editing the text keeps the structured values unchanged.")}
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 0.6, margin: "16px 0 10px" }}>
          {t("OTHER SITES")}
        </div>
        <div className="row">
          <div className="col-md-6" style={{ marginBottom: 10 }}>
            <Label>{t("Oropharynx")}</Label>
            {input("Exam_Oropharynx", t("NAD or findings"))}
          </div>
          <div className="col-md-6" style={{ marginBottom: 10 }}>
            <Label>{t("Nose & nasopharynx")}</Label>
            {input("Exam_Nose", t("NAD or findings"))}
          </div>
          <div className="col-md-6">
            <Label>{t("Larynx (IDL / scopy)")}</Label>
            {input("Exam_Larynx", t("NAD or findings"))}
          </div>
          <div className="col-md-6">
            <Label>{t("Cranial nerves")}</Label>
            {input("Exam_CranialNerves", t("Intact or deficits"))}
          </div>
        </div>
      </Section>

      {/* ── 3 · Neck examination ──────────────────────────────────────────── */}
      <Section
        n={3}
        title={t("Neck examination")}
        right={<span style={{ fontSize: 11.5, color: C.sub }}>{t("One row per palpable node")}</span>}
      >
        <table className="table table-sm" style={{ marginBottom: 8 }}>
          <thead>
            <tr style={{ fontSize: 11.5, color: C.sub }}>
              <th style={{ width: 40 }}>#</th>
              <th>{t("Level")}</th>
              <th>{t("Side")}</th>
              <th>{t("Size")}</th>
              <th>{t("Mobility")}</th>
              <th>{t("Extranodal ext.")}</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {nodes.map((row, i) => (
              <tr key={i}>
                <td style={{ color: C.sub, fontSize: 12 }}>{i + 1}</td>
                <td>
                  <select
                    className="form-control form-control-sm"
                    value={row.level}
                    onChange={(e) => setNode(i, "level", e.target.value)}
                  >
                    <option value="">{t("Select")}</option>
                    {NODE_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="form-control form-control-sm"
                    value={row.side}
                    onChange={(e) => setNode(i, "side", e.target.value)}
                  >
                    <option value="">{t("Select")}</option>
                    {NODE_SIDES.map((s) => (
                      <option key={s} value={s}>
                        {t(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.size}
                      onChange={(e) => setNode(i, "size", e.target.value)}
                    />
                    <span style={{ fontSize: 11, color: C.sub }}>{t("cm")}</span>
                  </div>
                </td>
                <td>
                  <select
                    className="form-control form-control-sm"
                    value={row.mobility}
                    onChange={(e) => setNode(i, "mobility", e.target.value)}
                  >
                    <option value="">{t("Select")}</option>
                    {NODE_MOBILITY.map((m) => (
                      <option key={m} value={m}>
                        {t(m)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="form-control form-control-sm"
                    value={row.ene}
                    onChange={(e) => setNode(i, "ene", e.target.value)}
                  >
                    <option value="">{t("Select")}</option>
                    {YES_NO.map((v) => (
                      <option key={v} value={v}>
                        {t(v)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    title={t("Remove node")}
                    onClick={() => removeNode(i)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addNode}>
          + {t("Add node")}
        </button>

        <div className="row" style={{ marginTop: 14 }}>
          <div className="col-md-6">
            <Label>{t("Thyroid")}</Label>
            {input("Neck_Thyroid", t("NAD or findings"))}
          </div>
          <div className="col-md-6">
            <Label>{t("Salivary glands")}</Label>
            {input("Neck_Salivary", t("NAD or findings"))}
          </div>
        </div>
      </Section>

      {/* ── 4 · Diagnosis & TNM staging ───────────────────────────────────── */}
      <Section
        n={4}
        title={t("Diagnosis & TNM staging")}
        right={<span style={{ fontSize: 11.5, color: C.sub }}>{t("AJCC 8th edition · Oral cavity")}</span>}
      >
        <div className="row">
          <div className="col-md-5">
            <Label>{t("Diagnosis")}</Label>
            {input("Dx_Diagnosis", t("e.g. Carcinoma, left buccal mucosa"))}
          </div>
          <div className="col-md-3">
            <Label>{t("ICD-10")}</Label>
            {input("Dx_ICD10", "C06.0")}
          </div>
          <div className="col-md-4">
            <Label>{t("Status")}</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Provisional", "Confirmed"].map((s) => (
                <Box key={s} active={form.Dx_Status === s} onClick={() => set("Dx_Status", s)}>
                  {t(s)}
                </Box>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ margin: "14px 0", borderColor: C.line }} />

        <div className="row">
          <div className="col-md-7">
            <Label>{t("Staging basis")}</Label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Box active={form.Dx_Basis === "c"} onClick={() => set("Dx_Basis", "c")}>
                {t("c · Clinical")}
              </Box>
              <Box active={form.Dx_Basis === "p"} onClick={() => set("Dx_Basis", "p")}>
                {t("p · Pathological")}
              </Box>
            </div>

            <Label>{t("Depth of invasion (DOI)")}</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {input("Dx_DOI", t("Not recorded"), { style: { width: 140 } })}
              <span style={{ fontSize: 12, color: C.sub }}>{t("mm")}</span>
            </div>
            <div style={{ fontSize: 11, color: C.sub, margin: "5px 0 14px" }}>
              {t("Leave blank until the biopsy report is available. It changes the T suggestion.")}
            </div>

            <Label>{t("T · primary tumour")}</Label>
            <select
              className="form-control form-control-sm"
              value={form.Dx_T}
              onChange={(e) => set("Dx_T", e.target.value)}
            >
              <option value="">{t("Select")}</option>
              {T_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            {form.Dx_T && T_HELP[form.Dx_T] ? (
              <div style={{ fontSize: 11, color: "#3f7fa6", marginTop: 5 }}>{t(T_HELP[form.Dx_T])}</div>
            ) : null}
            {tSuggest ? (
              <Suggestion
                text={`${t("Suggested")} ${tSuggest.t}: ${tSuggest.why}`}
                matches={form.Dx_T === tSuggest.t}
                onApply={() => set("Dx_T", tSuggest.t)}
                t={t}
              />
            ) : null}

            <div style={{ marginTop: 14 }}>
              <Label>{t("N · regional nodes")}</Label>
              <select
                className="form-control form-control-sm"
                value={form.Dx_N}
                onChange={(e) => set("Dx_N", e.target.value)}
              >
                <option value="">{t("Select")}</option>
                {N_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {form.Dx_N && N_HELP[form.Dx_N] ? (
                <div style={{ fontSize: 11, color: "#3f7fa6", marginTop: 5 }}>{t(N_HELP[form.Dx_N])}</div>
              ) : null}
              <Suggestion
                text={`${t("Suggested")} ${nSuggest.n}: ${nSuggest.why}`}
                matches={form.Dx_N === nSuggest.n}
                onApply={() => set("Dx_N", nSuggest.n)}
                t={t}
              />
            </div>

            <div className="row" style={{ marginTop: 14 }}>
              <div className="col-md-6">
                <Label>{t("M · distant metastasis")}</Label>
                <select
                  className="form-control form-control-sm"
                  value={form.Dx_M}
                  onChange={(e) => set("Dx_M", e.target.value)}
                >
                  {M_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 5 }}>
                  {form.Dx_M === "M1" ? t("Distant metastasis.") : t("No distant metastasis.")}
                </div>
              </div>
              <div className="col-md-6">
                <Label>{t("ECOG performance status")}</Label>
                <select
                  className="form-control form-control-sm"
                  value={form.Dx_ECOG}
                  onChange={(e) => set("Dx_ECOG", e.target.value)}
                >
                  <option value="">{t("Select")}</option>
                  {ECOG_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {t(o)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stage group panel */}
          <div className="col-md-5">
            <div
              style={{
                border: `1px solid ${C.tealLine}`,
                background: C.tealBg,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: C.sub }}>
                {t("STAGE GROUP")}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: C.teal, margin: "6px 0 2px" }}>
                {shownStage || t("—")}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 14, color: C.ink }}>
                {`${form.Dx_Basis === "p" ? "p" : "c"}${form.Dx_T || "T?"} ${form.Dx_N || "N?"} ${form.Dx_M || "M?"}`}
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 8 }}>
                {calculatedStage
                  ? t("Calculated from the AJCC 8th edition stage table.")
                  : t("Pick T, N and M to calculate the stage.")}
              </div>
              <hr style={{ borderColor: C.tealLine, margin: "12px 0" }} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={overriding}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      Dx_StageOverride: on ? "1" : "0",
                      Dx_Stage: on ? f.Dx_Stage || calculatedStage || "" : "",
                    }));
                  }}
                />
                {t("Override calculated stage")}
              </label>
              {overriding && (
                <select
                  className="form-control form-control-sm mt-2"
                  value={form.Dx_Stage}
                  onChange={(e) => set("Dx_Stage", e.target.value)}
                >
                  <option value="">{t("Select")}</option>
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "4px 2px 10px",
        }}
      >
        {saved && (
          <span style={{ fontSize: 11.5, color: C.sub, marginRight: "auto" }}>
            <i className="fas fa-check-circle mr-1" style={{ color: C.teal }} />
            {t("An assessment is already recorded for this visit")}
          </span>
        )}
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handlePrint}>
          <i className="fa fa-print mr-1" /> {t("Print")}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          disabled={busy}
        >
          <i className="fa fa-save mr-1" />{" "}
          {busy ? t("Please wait...") : saved ? t("Update") : t("Save")}
        </button>
      </div>
    </div>
  );
}

/* The suggestion line under T and N: what the recorded measurements imply, and a
   one-click way to take it. It never sets the value on its own — the stage is the
   doctor's call, and a suggestion that quietly filled the field would be signed
   off without being read. */
const Suggestion = ({ text, matches, onApply, t }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 6,
      padding: "7px 10px",
      background: C.soft,
      border: `1px solid ${C.line}`,
      borderRadius: 8,
      fontSize: 11.5,
      color: C.ink,
    }}
  >
    <span>{text}</span>
    {matches ? (
      <span style={{ color: C.teal, fontWeight: 600, whiteSpace: "nowrap" }}>{t("Matches")}</span>
    ) : (
      <button
        type="button"
        className="btn btn-sm btn-link p-0"
        style={{ fontSize: 11.5, whiteSpace: "nowrap" }}
        onClick={onApply}
      >
        {t("Apply")}
      </button>
    )}
  </div>
);

export default OncoAssessment;
