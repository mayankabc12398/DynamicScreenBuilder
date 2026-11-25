import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";

import {
  GetNursingInitialAssessment,
  SaveNursingInitialAssessment,
} from "../../networkServices/DayCare";
import { notify } from "../../utils/utils";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";

/*
 * Adult Nursing Initial Assessment - the 16-section hospital form.
 *
 * TWO DECISIONS WORTH KNOWING
 *
 * 1. The form is DATA, not markup. Every field is declared in SECTIONS below and
 *    both the screen and the printout are rendered by walking it. A field added
 *    there appears in both, correctly, with no second edit - which matters
 *    because this form is explicitly meant to be adapted by each nursing team
 *    before use.
 *
 * 2. Patient and admission details are NOT fields. Section 1 of the paper form
 *    asks the nurse to copy name, UHID, ward, bed, consultant and admission time
 *    by hand; here they are read from the visit, shown read-only, and printed in
 *    the header. Re-typing them is how a chart ends up disagreeing with the
 *    admission about who is in the bed.
 *
 * A partial save is normal and never blocked - the form has its own "partially
 * completed, reason" state, and findings belong in the record even when the
 * assessment is still in progress.
 */

const C = {
  gray50: "#f8f9fa", gray100: "#f1f3f5", gray200: "#e9ecef", gray300: "#dee2e6",
  gray500: "#adb5bd", gray600: "#6c757d", gray700: "#495057", gray800: "#343a40",
  blue50: "#eaf2fb", blue600: "#1e6cb5",
  red50: "#fff0f0", red600: "#b52020",
  green600: "#15803d",
};

/* Field kinds the renderer understands:
     text | num | area | date | time | select | radio | checks | tablegrid    */
const SECTIONS = [
  {
    no: 2, title: "Immediate concerns and escalation",
    fields: [
      { k: "urgentConcern", l: "Urgent concern identified", t: "radio", o: ["No", "Yes"] },
      { k: "urgentFinding", l: "Concern / finding", t: "text", w: 12 },
      { k: "immediateAction", l: "Immediate action and time", t: "area", w: 12 },
      { k: "clinicianInformed", l: "Clinician / response team informed", t: "text" },
      { k: "clinicianTime", l: "Time", t: "time" },
      { k: "clinicianResponse", l: "Response", t: "text" },
    ],
  },
  {
    no: 3, title: "Allergies and sensitivities",
    note: "Include medicines, food, latex and other substances. Record reaction and severity if known.",
    fields: [
      { k: "allergyStatus", l: "Status", t: "radio", w: 12,
        o: ["No known allergies", "Known allergies", "Unknown / unable to confirm"] },
      { k: "allergies", l: "Allergies", t: "tablegrid", w: 12,
        cols: [
          { k: "substance", l: "Substance" },
          { k: "reaction", l: "Reaction and severity" },
          { k: "source", l: "Source / verification" },
        ] },
      { k: "allergyAlertUpdated", l: "Allergy record / alert updated", t: "radio", o: ["Yes", "Pending"] },
      { k: "allergyAlertAction", l: "Reason / action", t: "text" },
    ],
  },
  {
    no: 4, title: "Presenting concern and relevant history",
    fields: [
      { k: "mainComplaint", l: "Main complaint, onset and duration", t: "area", w: 12 },
      { k: "conditions", l: "Relevant conditions", t: "checks", w: 12,
        o: ["Diabetes", "Hypertension", "Heart disease", "Respiratory disease",
            "Kidney disease", "Seizures", "Other"] },
      { k: "conditionDetails", l: "Details", t: "text", w: 12 },
      { k: "previousSurgery", l: "Previous surgery / admissions", t: "area", w: 12 },
      { k: "medsRecorded", l: "Current medicines and last doses recorded", t: "radio", o: ["Yes", "Pending"] },
      { k: "medRecStatus", l: "Medication reconciliation status / owner", t: "text" },
      { k: "medRecReference", l: "Record reference", t: "text" },
    ],
  },
  {
    no: 5, title: "Baseline observations",
    note: "M = measured; E = estimated. Record when a measurement cannot be obtained.",
    fields: [
      { k: "obsDateTime", l: "Observation date / time", t: "datetime" },
      { k: "obsRecordedBy", l: "Recorded by", t: "text" },
      { k: "bpSys", l: "BP systolic (mmHg)", t: "num", w: 2 },
      { k: "bpDia", l: "BP diastolic (mmHg)", t: "num", w: 2 },
      { k: "pulse", l: "Pulse (beats/min)", t: "num", w: 2 },
      { k: "resp", l: "Respiratory rate (breaths/min)", t: "num", w: 2 },
      { k: "spo2", l: "SpO2 (%)", t: "num", w: 2 },
      { k: "temp", l: "Temperature (°C)", t: "num", w: 2 },
      { k: "tempSite", l: "Measurement site", t: "text", w: 3 },
      { k: "weight", l: "Weight (kg)", t: "num", w: 2 },
      { k: "weightMode", l: "Weight", t: "radio", o: ["Measured", "Estimated"], w: 3 },
      { k: "height", l: "Height (cm)", t: "num", w: 2 },
      { k: "heightMode", l: "Height", t: "radio", o: ["Measured", "Estimated"], w: 3 },
      { k: "oxygen", l: "Oxygen", t: "radio", o: ["Room air", "Supplemental oxygen"] },
      { k: "oxygenDevice", l: "Device", t: "text", w: 2 },
      { k: "oxygenFlow", l: "Flow (L/min)", t: "num", w: 2 },
      { k: "fio2", l: "FiO2 (%) if known", t: "num", w: 2 },
      { k: "o2Target", l: "Prescribed oxygen target (%)", t: "num", w: 2 },
      { k: "o2Plan", l: "Order / plan", t: "text", w: 3 },
      { k: "consciousness", l: "Consciousness", t: "radio", w: 12,
        o: ["Alert", "Responds to voice", "Responds to pain", "Unresponsive"] },
      { k: "newConfusion", l: "New confusion", t: "radio", o: ["No", "Yes", "Unknown"] },
      { k: "confusionDetails", l: "Baseline / assessment details", t: "text", w: 6 },
      { k: "glucose", l: "Blood glucose if indicated", t: "text", w: 2 },
      { k: "glucoseUnit", l: "Unit", t: "radio", o: ["mg/dL", "mmol/L", "Not indicated"], w: 4 },
      { k: "glucoseTime", l: "Time", t: "time", w: 2 },
      { k: "ewsTool", l: "Early warning tool / version", t: "text" },
      { k: "ewsScore", l: "Score", t: "num", w: 2 },
      { k: "ewsTime", l: "Time", t: "time", w: 2 },
      { k: "ewsAction", l: "Trigger or clinical concern and action", t: "area", w: 12 },
    ],
  },
  {
    no: 6, title: "Pain assessment",
    note: "0 = no pain; 10 = worst pain imaginable.",
    fields: [
      { k: "pain", l: "Pain", t: "radio", o: ["No", "Yes", "Unable to self-report"] },
      { k: "painSite", l: "Site / onset", t: "text", w: 6 },
      { k: "painScore", l: "Self-report score (/10)", t: "num", w: 2 },
      { k: "painTool", l: "Alternative validated tool if needed", t: "text" },
      { k: "painToolScore", l: "Score", t: "num", w: 2 },
      { k: "painToolTime", l: "Time", t: "time", w: 2 },
      { k: "painCharacter", l: "Character / radiation / aggravating or relieving factors", t: "area", w: 12 },
      { k: "painAction", l: "Action / order followed", t: "text", w: 6 },
      { k: "painReassessDue", l: "Reassessment due", t: "text", w: 3 },
    ],
  },
  {
    no: 7, title: "Physical and functional findings",
    note: "Record findings and support needs. Do not leave an unassessed system marked as normal.",
    fields: [
      { k: "neuro", l: "Neurological: orientation, behaviour, speech, strength", t: "area", w: 12 },
      { k: "gcsPupils", l: "GCS / pupils if indicated", t: "text", w: 6 },
      { k: "gcsNotIndicated", l: "Not indicated", t: "check", w: 3 },
      { k: "respiratory", l: "Respiratory: breathing effort, cough, breath sounds", t: "area", w: 12 },
      { k: "cardio", l: "Cardiovascular: circulation, chest symptoms, oedema", t: "area", w: 12 },
      { k: "gastro", l: "Gastrointestinal: abdomen, nausea / vomiting, bowel pattern", t: "area", w: 12 },
      { k: "lastBowel", l: "Last bowel movement", t: "text" },
      { k: "continenceStoma", l: "Continence / stoma", t: "text" },
      { k: "urinary", l: "Urinary: voiding, urine concerns, continence, catheter", t: "area", w: 12 },
      { k: "mobilityBaseline", l: "Mobility / transfers: baseline", t: "text" },
      { k: "mobilityCurrent", l: "Current", t: "text" },
      { k: "walkingAid", l: "Walking aid", t: "text" },
      { k: "assistanceRequired", l: "Assistance required", t: "text" },
      { k: "visionHearing", l: "Vision / hearing / communication aids", t: "area", w: 12 },
      { k: "adlHelp", l: "Help with bathing, dressing, toileting, feeding", t: "area", w: 12 },
      { k: "sleep", l: "Sleep / rest concerns", t: "text" },
      { k: "pregnancy", l: "Pregnancy status if relevant", t: "text" },
      { k: "deferred", l: "Other findings / assessments deferred and reason", t: "area", w: 12 },
    ],
  },
  {
    no: 8, title: "Skin and pressure injury assessment",
    fields: [
      { k: "skinAssessed", l: "Skin assessed", t: "radio", o: ["Yes", "Partly", "Not assessed"] },
      { k: "skinReason", l: "Reason / follow-up", t: "text", w: 6 },
      { k: "skinFindings", l: "Skin / mucosal findings, wounds and devices causing pressure", t: "area", w: 12 },
      { k: "woundLocation", l: "Location, appearance and dimensions / wound chart reference", t: "area", w: 12 },
      { k: "presentOnAdmission", l: "Present on admission", t: "radio", o: ["Yes", "No", "Uncertain"] },
      { k: "pressureStage", l: "Stage / category if assessed", t: "text" },
      { k: "skinTool", l: "Risk tool / version", t: "text" },
      { k: "skinScore", l: "Score", t: "num", w: 2 },
      { k: "skinTime", l: "Time", t: "time", w: 2 },
      { k: "skinRiskFactors", l: "Clinical risk factors / risk category", t: "area", w: 12 },
      { k: "skinPlan", l: "Prevention / support surface / repositioning plan", t: "area", w: 12 },
    ],
  },
  {
    no: 9, title: "Falls and safe mobility",
    note: "Record individual risk factors and actions; a score alone does not replace assessment.",
    fields: [
      { k: "fallsPast12", l: "Falls in past 12 months", t: "radio", o: ["No", "Yes", "Unknown"] },
      { k: "fallsCircumstances", l: "Number / circumstances", t: "text", w: 6 },
      { k: "fallRiskFactors", l: "Risk factors", t: "checks", w: 12,
        o: ["Gait / balance", "Weakness", "Dizziness / postural symptoms", "Confusion",
            "Vision", "Medicines", "Toileting needs", "Environment", "Other"] },
      { k: "fallsFindings", l: "Individual assessment findings / linked assessment", t: "area", w: 12 },
      { k: "fallsActions", l: "Assistance, mobility aids and prevention actions", t: "area", w: 12 },
    ],
  },
  {
    no: 10, title: "Nutrition and swallowing",
    fields: [
      { k: "dietOrder", l: "Diet order / restrictions", t: "text" },
      { k: "appetite", l: "Appetite / intake", t: "text" },
      { k: "weightLoss", l: "Unintentional weight loss", t: "radio", o: ["No", "Yes", "Unknown"] },
      { k: "weightLossAmount", l: "Amount / period", t: "text" },
      { k: "swallowConcern", l: "Swallowing / choking concern", t: "radio", o: ["No", "Yes", "Not assessed"] },
      { k: "swallowDetails", l: "Details", t: "text", w: 6 },
      { k: "feedingRoute", l: "Feeding route / assistance", t: "text" },
      { k: "oralHealth", l: "Oral health / dentures", t: "text" },
      { k: "nutritionTool", l: "Nutrition tool / version", t: "text" },
      { k: "nutritionScore", l: "Score", t: "num", w: 2 },
      { k: "nutritionTime", l: "Time", t: "time", w: 2 },
      { k: "dietitianReferral", l: "Action / dietitian or swallowing referral", t: "text" },
      { k: "dietitianDue", l: "Due / status", t: "text" },
    ],
  },
  {
    no: 11, title: "Infection precautions and devices",
    note: "Devices, for example: IV cannula, central line, urinary catheter, drain, feeding tube.",
    fields: [
      { k: "infectionSymptoms", l: "Infection symptoms / exposure / known infection", t: "area", w: 12 },
      { k: "precautions", l: "Precautions required", t: "radio", o: ["Standard", "Additional per policy"] },
      { k: "precautionType", l: "Type / reason", t: "text", w: 6 },
      { k: "devices", l: "Devices", t: "tablegrid", w: 12,
        cols: [
          { k: "device", l: "Device and site" },
          { k: "inserted", l: "Insertion date or unknown" },
          { k: "action", l: "Site / function and action" },
        ] },
    ],
  },
  {
    no: 12, title: "Psychosocial and additional needs",
    fields: [
      { k: "mood", l: "Mood / anxiety, coping, support and cultural or spiritual needs", t: "area", w: 12 },
      { k: "substanceHistory", l: "Tobacco / alcohol / substance history relevant to care", t: "area", w: 12 },
      { k: "safeguarding", l: "Safeguarding or immediate mental health concern / referral", t: "area", w: 12 },
      { k: "vteRisk", l: "VTE / bleeding risk assessment status or referral per policy", t: "area", w: 12 },
      { k: "dischargeSupport", l: "Discharge support, home situation and equipment needs", t: "area", w: 12 },
      { k: "otherReferral", l: "Other risk / referral", t: "text" },
      { k: "referralOwner", l: "Owner / review due", t: "text" },
    ],
  },
  {
    no: 13, title: "Initial nursing care plan",
    note: "Prioritise identified problems. Record individual goals, actions within orders / policy, and review times.",
    fields: [
      { k: "carePlan", l: "Care plan", t: "tablegrid", w: 12, rows: 3,
        cols: [
          { k: "problem", l: "Problem / priority" },
          { k: "goal", l: "Goal or expected outcome" },
          { k: "action", l: "Planned action / referral" },
          { k: "owner", l: "Owner / review due" },
        ] },
      { k: "carePlanReference", l: "Additional care plan / record reference", t: "text", w: 12 },
    ],
  },
  {
    no: 14, title: "Monitoring and handover",
    fields: [
      { k: "obsToMonitor", l: "Observations to monitor", t: "area", w: 12 },
      { k: "obsFrequency", l: "Frequency / next observations due", t: "text" },
      { k: "escalationPlan", l: "Escalation plan", t: "text" },
      { k: "outstanding", l: "Outstanding assessment / investigation / referral", t: "area", w: 12 },
      { k: "pendingReasonMon", l: "Reason pending", t: "text" },
      { k: "responsiblePerson", l: "Responsible person / due", t: "text" },
      { k: "handoverTo", l: "Handover given to", t: "text" },
      { k: "handoverTime", l: "Date / time", t: "datetime" },
      { k: "priorityCommunicated", l: "Priority concerns and actions communicated", t: "area", w: 12 },
    ],
  },
  {
    no: 15, title: "Patient and caregiver education",
    fields: [
      { k: "educationGiven", l: "Explained", t: "checks", w: 12,
        o: ["Call bell / assistance", "Falls prevention", "Ward orientation", "Infection prevention",
            "Medicines", "Diet", "Pain reporting", "Pressure injury prevention", "Other"] },
      { k: "educationTo", l: "Education given to", t: "text" },
      { k: "educationLanguage", l: "Language / interpreter", t: "text" },
      { k: "understandingChecked", l: "Understanding checked", t: "checks", w: 12,
        o: ["Teach-back", "Demonstration", "Follow-up required"] },
      { k: "learningBarriers", l: "Learning barriers / further education needed", t: "area", w: 12 },
      { k: "valuablesTo", l: "Valuables and personal aids recorded / handed over to", t: "text" },
      { k: "valuablesReference", l: "Reference", t: "text" },
    ],
  },
];

const COMPLETION = {
  no: 16, title: "Completion and authentication",
  fields: [
    { k: "pendingSections", l: "Pending sections and completion plan", t: "area", w: 12 },
    { k: "nurseName", l: "Nurse name", t: "text" },
    { k: "nurseEmployeeID", l: "Employee / registration ID", t: "text" },
    { k: "reviewerName", l: "Reviewer if required by policy", t: "text" },
    { k: "reviewedOn", l: "Reviewer date / time", t: "datetime" },
  ],
};

const ALL_SECTIONS = [...SECTIONS, COMPLETION];

// ── small presentational helpers ───────────────────────────────────────────
const lbl = { fontSize: 11, fontWeight: 600, color: C.gray700, display: "block", marginBottom: 2 };
const box = { width: "100%", fontSize: 12, padding: "4px 7px", border: `1px solid ${C.gray300}`, borderRadius: 6 };

const NursingInitialAssessmentForm = ({ data, onSaved }) => {
  const [t] = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const userData = useLocalStorage("userData", "get");

  const tid = data?.TID ?? data?.transactionID ?? data?.TransactionID;

  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({});
  const [grids, setGrids] = useState({ allergies: [], devices: [], carePlan: [] });
  const [status, setStatus] = useState("Partial");
  const [pendingReason, setPendingReason] = useState("");
  const [savedInfo, setSavedInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  const blankRow = (cols) => Object.fromEntries(cols.map((c) => [c.k, ""]));
  const gridCols = (key) =>
    ALL_SECTIONS.flatMap((s) => s.fields).find((f) => f.k === key)?.cols ?? [];

  const load = async () => {
    if (!tid) return;
    setLoading(true);
    try {
      const res = await GetNursingInitialAssessment(tid);
      const payload = res?.data ?? {};
      setPatient(payload?.Patient ?? payload?.patient ?? null);

      const saved = payload?.Assessment ?? payload?.assessment ?? null;
      setSavedInfo(saved);
      const raw = saved?.AssessmentData ?? saved?.assessmentData;
      if (raw) {
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          setForm(parsed?.form ?? {});
          setGrids({
            allergies: parsed?.grids?.allergies ?? [],
            devices: parsed?.grids?.devices ?? [],
            carePlan: parsed?.grids?.carePlan ?? [],
          });
        } catch (e) {
          // A row we cannot parse must not wipe itself by saving over the top,
          // so the nurse is told rather than silently given a blank form.
          notify(t("The saved assessment could not be read. Showing a blank form."), "error");
        }
      }
      setStatus(saved?.Status ?? saved?.status ?? "Partial");
      setPendingReason(saved?.PendingReason ?? saved?.pendingReason ?? "");

      // Signing is the nurse's own name; prefill it from the login rather than
      // make them type it, but leave it editable for the nurse who takes over.
      if (!saved) {
        setForm((f) => ({
          ...f,
          nurseName: f.nurseName || userData?.employeeName || "",
          nurseEmployeeID: f.nurseEmployeeID || userData?.employeeID || "",
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid]);

  // Each grid always offers one empty row to type into.
  useEffect(() => {
    setGrids((g) => {
      const next = { ...g };
      ["allergies", "devices", "carePlan"].forEach((key) => {
        const cols = gridCols(key);
        if (cols.length && next[key].length === 0) next[key] = [blankRow(cols)];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedInfo]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCheck = (k, option) =>
    setForm((f) => {
      const cur = Array.isArray(f[k]) ? f[k] : [];
      return { ...f, [k]: cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option] };
    });

  const setGridCell = (key, i, col, v) =>
    setGrids((g) => ({ ...g, [key]: g[key].map((r, idx) => (idx === i ? { ...r, [col]: v } : r)) }));
  const addGridRow = (key) =>
    setGrids((g) => ({ ...g, [key]: [...g[key], blankRow(gridCols(key))] }));
  const removeGridRow = (key, i) =>
    setGrids((g) => ({ ...g, [key]: g[key].filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!tid) {
      notify(t("No visit selected"), "error");
      return;
    }
    if (status === "Partial" && !String(pendingReason).trim()) {
      notify(t("A partially completed assessment needs a reason."), "error");
      return;
    }
    try {
      const res = await SaveNursingInitialAssessment({
        transactionID: Number(tid),
        assessmentData: JSON.stringify({ form, grids }),
        status,
        pendingReason,
        nurseName: form?.nurseName || userData?.employeeName || "",
        nurseEmployeeID: form?.nurseEmployeeID || userData?.employeeID || "",
        reviewerName: form?.reviewerName || "",
        ipAddress: ip ?? "",
      });
      notify(res?.message, res?.success ? "success" : "error");
      if (res?.success) {
        load();
        if (onSaved) onSaved();
      }
    } catch (error) {
      console.error(error);
      notify(t("Something went wrong"), "error");
    }
  };

  /* Printed from a block built off the same SECTIONS, with the patient header
     the screen deliberately does not make editable. */
  const handlePrint = () => {
    const node = printRef.current;
    if (!node) return;
    const w = window.open("", "_blank", "width=950,height=700");
    if (!w) {
      notify(t("Allow pop-ups to print"), "error");
      return;
    }
    w.document.write(`<!doctype html><html><head><title>${t("Nursing Initial Assessment")}</title>
      <style>
        body{font-family:system-ui,sans-serif;font-size:11.5px;color:#212529;padding:16px;}
        h1{font-size:17px;margin:0 0 2px;} h2{font-size:12.5px;margin:14px 0 5px;border-bottom:1px solid #dee2e6;padding-bottom:3px;}
        .hdr{border:1px solid #dee2e6;padding:8px 10px;border-radius:6px;margin-bottom:10px;background:#f8f9fa;}
        .hdr span{display:inline-block;min-width:200px;margin:2px 10px 2px 0;}
        .f{display:inline-block;min-width:260px;margin:2px 12px 2px 0;vertical-align:top;}
        .f b{font-weight:600;} .v{border-bottom:1px solid #adb5bd;padding:0 4px;min-width:90px;display:inline-block;}
        table{width:100%;border-collapse:collapse;margin:4px 0 8px;}
        th,td{border:1px solid #dee2e6;padding:4px 6px;text-align:left;font-size:11px;}
        th{background:#f1f3f5;}
        .note{color:#6c757d;font-size:10.5px;margin-bottom:4px;}
        .sign{margin-top:18px;font-size:11px;}
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  // ── field renderer ───────────────────────────────────────────────────────
  const renderField = (f) => {
    const col = `col-xl-${f.w ?? 4} col-md-6 col-12`;
    const v = form[f.k] ?? "";
    if (f.t === "tablegrid") {
      const rows = grids[f.k] ?? [];
      return (
        <div key={f.k} className="col-12" style={{ marginBottom: 8 }}>
          <span style={lbl}>{t(f.l)}</span>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {f.cols.map((c) => (
                  <th key={c.k} style={{ border: `1px solid ${C.gray200}`, background: C.gray100, padding: "4px 6px", fontSize: 11, textAlign: "left" }}>
                    {t(c.l)}
                  </th>
                ))}
                <th style={{ border: `1px solid ${C.gray200}`, background: C.gray100, width: 34 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {f.cols.map((c) => (
                    <td key={c.k} style={{ border: `1px solid ${C.gray200}`, padding: 3 }}>
                      <input style={{ ...box, border: "none" }} value={r[c.k] ?? ""}
                        onChange={(e) => setGridCell(f.k, i, c.k, e.target.value)} />
                    </td>
                  ))}
                  <td style={{ border: `1px solid ${C.gray200}`, textAlign: "center" }}>
                    <button type="button" className="btn btn-sm" style={{ color: C.red600 }}
                      onClick={() => removeGridRow(f.k, i)} title={t("Remove")}>
                      <i className="fas fa-times" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => addGridRow(f.k)}>
            <i className="fas fa-plus mr-1" aria-hidden="true" />{t("Add Row")}
          </button>
        </div>
      );
    }
    return (
      <div key={f.k} className={col} style={{ marginBottom: 8 }}>
        <span style={lbl}>{t(f.l)}</span>
        {f.t === "area" ? (
          <textarea rows={2} style={box} value={v} onChange={(e) => set(f.k, e.target.value)} />
        ) : f.t === "radio" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 2 }}>
            {f.o.map((o) => (
              <label key={o} style={{ fontSize: 11.5, color: C.gray700, display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
                <input type="radio" name={f.k} checked={v === o} onChange={() => set(f.k, o)} />
                {t(o)}
              </label>
            ))}
          </div>
        ) : f.t === "checks" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 2 }}>
            {f.o.map((o) => (
              <label key={o} style={{ fontSize: 11.5, color: C.gray700, display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
                <input type="checkbox" checked={Array.isArray(v) && v.includes(o)} onChange={() => toggleCheck(f.k, o)} />
                {t(o)}
              </label>
            ))}
          </div>
        ) : f.t === "check" ? (
          <label style={{ fontSize: 11.5, color: C.gray700, display: "inline-flex", alignItems: "center", gap: 5, margin: 0 }}>
            <input type="checkbox" checked={!!v} onChange={(e) => set(f.k, e.target.checked)} />
            {t(f.l)}
          </label>
        ) : (
          <input
            type={f.t === "num" ? "number" : f.t === "date" ? "date" : f.t === "time" ? "time" : f.t === "datetime" ? "datetime-local" : "text"}
            style={box} value={v} onChange={(e) => set(f.k, e.target.value)}
          />
        )}
      </div>
    );
  };

  // ── print body, built from the same schema ───────────────────────────────
  const printValue = (f) => {
    const v = form[f.k];
    if (Array.isArray(v)) return v.join(", ");
    if (f.t === "check") return v ? "Yes" : "";
    return v ?? "";
  };

  const printBody = useMemo(
    () => (
      <div>
        <h1>{t("Nursing Initial Assessment")}</h1>
        <div className="note">{t("Adult inpatient admission")}</div>

        {/* Section 1 of the paper form, filled from the visit rather than typed. */}
        <div className="hdr">
          <span><b>{t("Patient name")}:</b> {patient?.PatientName ?? patient?.patientName ?? "-"}</span>
          <span><b>{t("UHID")}:</b> {patient?.PatientID ?? patient?.patientID ?? "-"}</span>
          <span><b>{t("Age")}/{t("Sex")}:</b> {patient?.Age ?? patient?.age ?? "-"} / {patient?.Gender ?? patient?.gender ?? "-"}</span>
          <span><b>{t("DOB")}:</b> {patient?.DOB ?? patient?.dob ?? "-"}</span>
          <span><b>{t("Visit No")}:</b> {patient?.VisitNo ?? patient?.visitNo ?? "-"}</span>
          <span><b>{t("Ward")}:</b> {patient?.Ward ?? patient?.ward ?? "-"}</span>
          <span><b>{t("Bed")}:</b> {patient?.Bed ?? patient?.bed ?? "-"}</span>
          <span><b>{t("Admitted On")}:</b> {patient?.AdmittedOn ?? patient?.admittedOn ?? "-"}</span>
          <span><b>{t("Consultant")}:</b> {patient?.Consultant ?? patient?.consultant ?? "-"}</span>
          <span><b>{t("Panel")}:</b> {patient?.Panel ?? patient?.panel ?? "-"}</span>
          <span><b>{t("ContactNo")}:</b> {patient?.ContactNo ?? patient?.contactNo ?? "-"}</span>
        </div>

        {ALL_SECTIONS.map((s) => (
          <div key={s.no}>
            <h2>{s.no}. {t(s.title)}</h2>
            {s.note && <div className="note">{t(s.note)}</div>}
            {s.fields.map((f) =>
              f.t === "tablegrid" ? (
                <table key={f.k}>
                  <thead>
                    <tr>{f.cols.map((c) => <th key={c.k}>{t(c.l)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(grids[f.k] ?? []).map((r, i) => (
                      <tr key={i}>{f.cols.map((c) => <td key={c.k}>{r[c.k] || ""}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span className="f" key={f.k}>
                  <b>{t(f.l)}:</b> <span className="v">{printValue(f)}</span>
                </span>
              ),
            )}
          </div>
        ))}

        <div className="sign">
          <b>{t("Assessment status")}:</b> {status}
          {status === "Partial" && pendingReason ? ` — ${pendingReason}` : ""}<br />
          <b>{t("Nurse")}:</b> {form?.nurseName || "-"} ({form?.nurseEmployeeID || "-"}) &nbsp;
          <b>{t("Printed")}:</b> {moment().format("DD-MMM-YYYY hh:mm A")}
        </div>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, grids, patient, status, pendingReason],
  );

  return (
    <div style={{ padding: 10, fontFamily: "'DM Sans', system-ui, sans-serif", background: C.gray50 }}>
      {/* ── Patient header. Read-only on purpose: see the note at the top. ── */}
      <div style={{ background: "#fff", border: `1px solid ${C.gray200}`, borderRadius: 10, padding: "9px 12px", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>
              {patient?.PatientName ?? patient?.patientName ?? data?.Name ?? "-"}
            </div>
            <div style={{ fontSize: 11.5, color: C.gray600 }}>
              {patient?.PatientID ?? data?.PatientID} · {patient?.Age ?? ""}/{patient?.Gender ?? ""}
              {patient?.VisitNo ? ` · ${patient.VisitNo}` : ""}
              {patient?.Bed ? ` · ${patient.Bed}` : ""}
              {patient?.Consultant ? ` · ${patient.Consultant}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {savedInfo && (
              <span style={{ fontSize: 11, color: C.gray600 }}>
                {t("Last saved")}: {savedInfo?.UpdatedOn || savedInfo?.CompletedOn || "-"}
              </span>
            )}
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={load} title={t("Refresh")}>
              <i className="fas fa-sync" aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-sm btn-info" onClick={handlePrint}>
              <i className="fas fa-print mr-1" aria-hidden="true" />{t("Print")}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: C.gray500, marginTop: 4 }}>
          <i className="fas fa-info-circle mr-1" aria-hidden="true" />
          {t("Patient and admission details are taken from the visit and appear on the printout.")}
        </div>
      </div>

      {loading && (
        <div style={{ padding: 10, fontSize: 12, color: C.gray500 }}>{t("Loading")}...</div>
      )}

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      {ALL_SECTIONS.map((s) => (
        <div key={s.no} style={{ background: "#fff", border: `1px solid ${C.gray200}`, borderRadius: 10, marginBottom: 8 }}>
          <div style={{ padding: "7px 11px", background: C.gray100, borderRadius: "10px 10px 0 0", fontSize: 12.5, fontWeight: 700, color: C.gray800 }}>
            {s.no}. {t(s.title)}
          </div>
          <div style={{ padding: "8px 10px" }}>
            {s.note && <div style={{ fontSize: 11, color: C.gray600, marginBottom: 6 }}>{t(s.note)}</div>}
            <div className="row">{s.fields.map(renderField)}</div>

            {/* The status control belongs with the authentication section. */}
            {s.no === 16 && (
              <div className="row" style={{ marginTop: 4 }}>
                <div className="col-xl-4 col-md-6 col-12" style={{ marginBottom: 8 }}>
                  <span style={lbl}>{t("Assessment status")}</span>
                  <div style={{ display: "flex", gap: 12, paddingTop: 2 }}>
                    {["Completed", "Partial"].map((o) => (
                      <label key={o} style={{ fontSize: 11.5, color: C.gray700, display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
                        <input type="radio" name="assessmentStatus" checked={status === o} onChange={() => setStatus(o)} />
                        {o === "Partial" ? t("Partially completed") : t(o)}
                      </label>
                    ))}
                  </div>
                </div>
                {status === "Partial" && (
                  <div className="col-xl-8 col-md-6 col-12" style={{ marginBottom: 8 }}>
                    <span style={lbl}>{t("Reason")}</span>
                    <input style={box} value={pendingReason} onChange={(e) => setPendingReason(e.target.value)} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "right", paddingBottom: 6 }}>
        <button type="button" className="btn btn-sm btn-info px-4" onClick={handleSave}>
          <i className="fas fa-save mr-1" aria-hidden="true" />
          {status === "Completed" ? t("Save & Complete") : t("Save")}
        </button>
      </div>

      {/* Print source, kept out of view. */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>{printBody}</div>
      </div>
    </div>
  );
};

export default NursingInitialAssessmentForm;
