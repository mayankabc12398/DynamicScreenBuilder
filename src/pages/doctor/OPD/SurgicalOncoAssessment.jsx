import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import {
  GetOncoAssessment,
  GetSurgicalOncoAssessment,
  SaveSurgicalOncoAssessment,
} from "../../../networkServices/DoctorApi";

/* =============================================================================
   Surgical Oncology Assessment & Treatment Plan — one EMR form covering the
   assessment, the treatment plan, the hospital protocol followed and the MDT
   review.

   Opened from the EMR form list on /ViewConsultation. The menu row lives in
   cpoe_menumaster with URL 'SurgicalOncoAssessment' (API repo,
   DBScripts/2026-09-28_surgical_onco_assessment.sql), and the EMR lazy-loads
   this file by that name, so the file name and that URL stay in step.

   Saving is an upsert: the visit's previous values are superseded, so the same
   button is the first save and every later update.

   Signing is a save with Meta_Status = Signed plus who and when. A signed
   assessment is read-only until it is reopened, which returns it to draft —
   editing under a signature that was given for different content is the one
   thing a form like this must not allow.
   ============================================================================= */

const C = {
  ink: "#0f2b33", sub: "#6b7d85", line: "#dce6ea", soft: "#f4f8f9",
  teal: "#0d7a72", tealBg: "#e6f4f3", tealLine: "#9ed3cd",
  amber: "#b06a00", amberBg: "#fff6e6",
  red: "#b3261e", white: "#fff",
};

const PRIMARY_SITES = [
  "Buccal mucosa", "Tongue (oral)", "Floor of mouth", "Alveolus / Gingiva",
  "Hard palate", "Retromolar trigone", "Lip", "Oropharynx", "Hypopharynx",
  "Larynx", "Nasopharynx", "Thyroid", "Salivary gland", "Breast", "Other",
];
const LATERALITY = ["Left", "Right", "Midline", "Bilateral", "Not applicable"];
const ECOG = [
  "Not recorded", "0 · Fully active", "1 · Restricted strenuous activity",
  "2 · Ambulatory, self-caring", "3 · Limited self-care", "4 · Completely disabled",
];
const RESECTABILITY = [
  "Not assessed", "Resectable", "Borderline resectable", "Unresectable",
  "Resectable after neoadjuvant",
];
const SURGICAL_FITNESS = [
  "Not assessed", "Fit for surgery", "Fit with optimisation", "High risk", "Unfit for surgery",
];
const TREATMENT_INTENT = ["Curative", "Palliative", "Neoadjuvant", "Adjuvant", "Diagnostic"];
const PRIMARY_MODALITY = [
  "Surgery", "Radiotherapy", "Chemotherapy", "Chemoradiotherapy",
  "Targeted therapy", "Immunotherapy", "Best supportive care",
];
const SIDE_SITE = ["Left", "Right", "Midline", "Bilateral", "Not applicable"];
const MDT_STATUS = ["Not recorded", "Scheduled", "Discussed", "Deferred", "Not required"];
const READINESS = ["Not recorded", "Completed", "Pending", "Not required"];
const REFERRAL_SPECIALTIES = [
  "Medical Oncology", "Radiation Oncology", "Pathology", "Radiology",
  "Anaesthesia", "Nutrition", "Physiotherapy", "Palliative Care",
  "Psycho-oncology", "Speech & Swallow",
];
const INTERVENTIONS = [
  "Surgery", "Chemotherapy cycle", "Radiotherapy fraction", "Imaging review",
  "Pathology review", "Nutrition support", "Follow-up review",
];

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

const INITIAL = {
  // 01 Assessment
  A_Site: "",
  A_Laterality: "",
  A_Diagnosis: "",
  A_ClinicalAssessment: "",
  A_Imported: "", // the staging line carried over from the OP assessment
  A_ImportedConfirmed: "0",
  A_ECOG: "Not recorded",
  A_Resectability: "Not assessed",
  A_SurgicalFitness: "Not assessed",
  A_Comorbidities: "",
  A_LinkedReports: "", // comma separated report references
  // 02 Treatment plan
  P_Intent: "",
  P_Modality: "",
  P_Procedure: "",
  P_Side: "",
  P_NodalProcedure: "",
  P_Reconstruction: "",
  P_Rationale: "",
  P_PlannedDate: "",
  P_Consultant: "",
  // 03 Protocol
  R_ProtocolName: "",
  R_ProtocolID: "",
  R_Version: "",
  R_EffectiveDate: "",
  R_Reference: "",
  R_Deviations: "",
  // 04 MDT & follow-up
  M_Status: "Not recorded",
  M_ReviewDate: "",
  M_Recommendations: "",
  M_PreAnaesthesia: "Not recorded",
  M_Consent: "Not recorded",
  M_Discussion: "",
  M_Referrals: "",
  M_FollowUpDate: "",
  // meta
  Meta_Status: "Draft",
  Meta_SignedBy: "",
  Meta_SignedOn: "",
};

const EMPTY_STEP = { intervention: "", timing: "" };

// ── Building blocks ─────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 4 }}>
    {children}
    {required ? <span style={{ color: C.red }}> *</span> : null}
  </div>
);

const Section = ({ n, title, sub, right, children }) => (
  <div
    style={{
      background: C.white,
      border: `1px solid ${C.line}`,
      borderRadius: 12,
      overflow: "hidden",
      height: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "11px 16px",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 12.5, fontWeight: 700, color: C.sub,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(n).padStart(2, "0")}
        </span>
        <span>
          <b style={{ fontSize: 14.5, color: C.ink }}>{title}</b>
          {sub ? (
            <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{sub}</div>
          ) : null}
        </span>
      </span>
      {right}
    </div>
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

const Pill = ({ tone = "amber", children }) => {
  const map = {
    amber: { bg: C.amberBg, fg: C.amber, bd: "#f0d9ac" },
    teal: { bg: C.tealBg, fg: C.teal, bd: C.tealLine },
    grey: { bg: "#eef2f3", fg: C.sub, bd: C.line },
  };
  const s = map[tone] || map.grey;
  return (
    <span
      style={{
        background: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
        borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

function SurgicalOncoAssessment({ patientDetail }) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";
  const transactionID = patient?.TransactionID || "";

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";
  const userName =
    userData?.employeeName || userData?.EmployeeName || userData?.userName || "";

  const [form, setForm] = useState(INITIAL);
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const signed = form.Meta_Status === "Signed";
  const set = (k, v) => {
    if (signed) return; // a signed assessment is read-only until reopened
    setForm((f) => ({ ...f, [k]: v }));
  };

  // ── Load this visit's assessment ─────────────────────────────────────────
  useEffect(() => {
    if (!patientID || !transactionID) return undefined;
    let active = true;
    (async () => {
      try {
        const res = await GetSurgicalOncoAssessment(patientID, transactionID);
        if (!active) return;
        // "No record found" is a visit not assessed yet, not an error.
        if (!res?.success || !Array.isArray(res?.data) || !res.data.length) return;
        const next = { ...INITIAL };
        let loadedSteps = null;
        res.data.forEach((row) => {
          const key = String(row?.keyName ?? row?.KeyName ?? "").trim();
          const value = row?.value ?? row?.Value ?? "";
          if (key === "R_Steps") {
            try {
              const parsed = JSON.parse(value || "[]");
              if (Array.isArray(parsed)) loadedSteps = parsed;
            } catch {
              loadedSteps = null;
            }
          } else if (key in next) {
            next[key] = value ?? "";
          }
        });
        setForm(next);
        setSteps(loadedSteps && loadedSteps.length ? loadedSteps : [{ ...EMPTY_STEP }]);
        setSaved(true);
      } catch (e) {
        notify(t("Failed to load the surgical oncology assessment"), "error");
      }
    })();
    return () => {
      active = false;
    };
  }, [patientID, transactionID]);

  // ── Import from the OP (Onco) assessment ─────────────────────────────────
  /* The OP assessment for the same visit already holds the site, laterality,
     composed finding and stage. Importing copies them across as a starting
     point and marks them unconfirmed: the surgeon has to look at them before
     this form can be signed, which is why the badge says so. */
  const handleImport = async () => {
    if (signed) return;
    if (!patientID || !transactionID) {
      notify(t("No patient visit is loaded"), "error");
      return;
    }
    try {
      const res = await GetOncoAssessment(patientID, transactionID);
      if (!res?.success || !Array.isArray(res?.data) || !res.data.length) {
        notify(t("No OP assessment found for this visit"), "warn");
        return;
      }
      const map = {};
      res.data.forEach((row) => {
        const key = String(row?.keyName ?? row?.KeyName ?? "").trim();
        map[key] = row?.value ?? row?.Value ?? "";
      });
      const stage = [
        `${map.Dx_Basis === "p" ? "p" : "c"}${map.Dx_T || ""}${map.Dx_N || ""}${map.Dx_M || ""}`,
        map.Dx_StageOverride === "1" ? map.Dx_Stage : "",
      ]
        .filter((x) => x && x.trim())
        .join(" — ");
      setForm((f) => ({
        ...f,
        A_Site: map.Exam_Site || f.A_Site,
        A_Laterality: map.Exam_Laterality || f.A_Laterality,
        A_Diagnosis: map.Dx_Diagnosis || f.A_Diagnosis,
        A_ClinicalAssessment: map.Exam_Finding || f.A_ClinicalAssessment,
        A_ECOG: map.Dx_ECOG || f.A_ECOG,
        A_Imported: stage,
        A_ImportedConfirmed: "0",
      }));
      notify(t("Imported from the OP assessment — please review"), "success");
    } catch (e) {
      notify(t("Failed to import the OP assessment"), "error");
    }
  };

  // ── Protocol steps ───────────────────────────────────────────────────────
  const setStep = (i, k, v) => {
    if (signed) return;
    setSteps((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  };
  const addStep = () => {
    if (signed) return;
    setSteps((rows) => [...rows, { ...EMPTY_STEP }]);
  };
  const removeStep = (i) => {
    if (signed) return;
    setSteps((rows) =>
      rows.length === 1 ? [{ ...EMPTY_STEP }] : rows.filter((_, idx) => idx !== i),
    );
  };

  const referrals = useMemo(
    () => String(form.M_Referrals || "").split(",").map((x) => x.trim()).filter(Boolean),
    [form.M_Referrals],
  );
  const toggleReferral = (name) => {
    if (signed) return;
    const next = referrals.includes(name)
      ? referrals.filter((x) => x !== name)
      : [...referrals, name];
    setForm((f) => ({ ...f, M_Referrals: next.join(", ") }));
  };

  // ── What a signature requires ────────────────────────────────────────────
  /* Deliberately small: a diagnosis, an intent and a modality. It is the plan a
     signature attests to, and an imported stage nobody confirmed is not one. */
  const signBlockers = useMemo(() => {
    const out = [];
    if (!String(form.A_Diagnosis).trim()) out.push(t("Diagnosis / histology"));
    if (!String(form.P_Intent).trim()) out.push(t("Treatment intent"));
    if (!String(form.P_Modality).trim()) out.push(t("Primary modality"));
    if (form.A_Imported && form.A_ImportedConfirmed !== "1") {
      out.push(t("Review the imported staging"));
    }
    return out;
  }, [form, t]);

  // ── Save / sign ──────────────────────────────────────────────────────────
  const persist = async (overrides = {}, successMessage) => {
    if (!patientID || !transactionID) {
      notify(t("No patient visit is loaded"), "error");
      return false;
    }
    setBusy(true);
    try {
      const payload = { ...form, ...overrides };
      const valueDetails = Object.keys(payload).map((k) => ({
        keyName: k,
        value: String(payload[k] ?? ""),
      }));
      // The step list is a list, so it travels as JSON under one key rather than
      // as Step1_*, Step2_* which would need cleaning up on every save.
      valueDetails.push({
        keyName: "R_Steps",
        value: JSON.stringify(steps.filter((s) => s.intervention || s.timing)),
      });
      const res = await SaveSurgicalOncoAssessment({
        patientID,
        transactionID,
        valueDetails,
      });
      if (res?.success) {
        setForm(payload);
        setSaved(true);
        notify(successMessage || res?.message || t("Record saved successfully"), "success");
        return true;
      }
      notify(res?.message || t("Failed to save record"), "error");
      return false;
    } catch (e) {
      notify(t("Failed to save record"), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = () => persist({ Meta_Status: "Draft" }, t("Draft saved"));

  const handleSign = () => {
    if (signBlockers.length) {
      notify(`${t("Cannot sign yet")}: ${signBlockers.join(", ")}`, "warn");
      return;
    }
    persist(
      {
        Meta_Status: "Signed",
        Meta_SignedBy: userName || asText(patient?.DName),
        Meta_SignedOn: new Date().toLocaleString(),
      },
      t("Assessment signed"),
    );
  };

  const handleReopen = () =>
    persist(
      { Meta_Status: "Draft", Meta_SignedBy: "", Meta_SignedOn: "" },
      t("Reopened for editing"),
    );

  // ── Print ────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const esc = (v) =>
      String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
    const block = (title, pairs) => {
      const body = pairs
        .filter(([, v]) => String(v ?? "").trim())
        .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
        .join("");
      return body ? `<h2>${esc(title)}</h2><table class="kv">${body}</table>` : "";
    };

    const liveSteps = steps.filter((s) => s.intervention || s.timing);
    const stepTable = liveSteps.length
      ? `<h2>Treatment protocol steps</h2><table class="grid">
           <tr><th>Step</th><th>Intervention / modality</th><th>Timing / sequence</th></tr>
           ${liveSteps
             .map(
               (s, i) =>
                 `<tr><td>${i + 1}</td><td>${esc(s.intervention)}</td><td>${esc(s.timing)}</td></tr>`,
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
      `<!DOCTYPE html><html><head><title>Surgical Oncology Assessment</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `@page{size:A4;margin:14mm;}` +
      `body{font:12px/1.45 Arial,Helvetica,sans-serif;color:#0f2b33;}` +
      `h1{font-size:16px;text-align:center;}` +
      `.hosp{text-align:center;font-size:13px;font-weight:700;margin-bottom:2px;}` +
      `.sub{text-align:center;font-size:10.5px;color:#6b7d85;margin-bottom:10px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 14px;border:1px solid #dce6ea;` +
      `border-radius:6px;padding:8px 10px;margin:10px 0 14px;}` +
      `.demo div{font-size:11px;}.demo span{color:#6b7d85;display:inline-block;min-width:66px;}` +
      `h2{font-size:12.5px;margin:12px 0 5px;padding-bottom:3px;border-bottom:1px solid #dce6ea;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `.kv th{width:34%;text-align:left;font-weight:600;color:#6b7d85;padding:3px 6px 3px 0;vertical-align:top;}` +
      `.kv td{padding:3px 0;vertical-align:top;}` +
      `.grid th,.grid td{border:1px solid #dce6ea;padding:4px 6px;text-align:left;font-size:11px;}` +
      `.status{margin-top:12px;padding:8px 10px;border:1px solid #9ed3cd;background:#e6f4f3;border-radius:6px;font-size:12px;}` +
      `.sign{margin-top:34px;display:flex;justify-content:space-between;font-size:11px;color:#6b7d85;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>Surgical Oncology Assessment &amp; Treatment Plan</h1>` +
      `<div class="sub">Assessment, treatment planning and protocol documentation</div>` +
      `<div class="demo">${demo}</div>` +
      block("Surgical oncology assessment", [
        ["Primary site / subsite", form.A_Site],
        ["Laterality", form.A_Laterality],
        ["Diagnosis / histology", form.A_Diagnosis],
        ["Staging (imported)", form.A_Imported
          ? `${form.A_Imported}${form.A_ImportedConfirmed === "1" ? " (reviewed)" : " (unconfirmed)"}`
          : ""],
        ["Clinical assessment", form.A_ClinicalAssessment],
        ["ECOG performance status", form.A_ECOG],
        ["Resectability", form.A_Resectability],
        ["Surgical fitness", form.A_SurgicalFitness],
        ["Comorbidities / prior treatment", form.A_Comorbidities],
        ["Imaging / pathology evidence", form.A_LinkedReports],
      ]) +
      block("Treatment plan", [
        ["Treatment intent", form.P_Intent],
        ["Primary modality", form.P_Modality],
        ["Proposed procedure", form.P_Procedure],
        ["Side / site", form.P_Side],
        ["Nodal procedure", form.P_NodalProcedure],
        ["Reconstruction", form.P_Reconstruction],
        ["Sequence & clinical rationale", form.P_Rationale],
        ["Planned date", form.P_PlannedDate],
        ["Responsible consultant", form.P_Consultant],
      ]) +
      block("Treatment protocol", [
        ["Hospital-approved protocol", form.R_ProtocolName],
        ["Protocol ID", form.R_ProtocolID],
        ["Version", form.R_Version],
        ["Effective date", form.R_EffectiveDate],
        ["Reference / linked document", form.R_Reference],
      ]) +
      stepTable +
      block("", [["Protocol deviations & rationale", form.R_Deviations]]) +
      block("MDT review & follow-up", [
        ["MDT review status", form.M_Status],
        ["Review date", form.M_ReviewDate],
        ["MDT recommendations", form.M_Recommendations],
        ["Pre-anaesthesia assessment", form.M_PreAnaesthesia],
        ["Informed consent", form.M_Consent],
        ["Patient discussion / preferences", form.M_Discussion],
        ["Referrals", form.M_Referrals],
        ["Follow-up date", form.M_FollowUpDate],
      ]) +
      `<div class="status"><b>${esc(form.Meta_Status || "Draft")}</b>${
        form.Meta_Status === "Signed"
          ? ` — ${esc(form.Meta_SignedBy)}${form.Meta_SignedOn ? `, ${esc(form.Meta_SignedOn)}` : ""}`
          : ` — ${esc("clinical review pending")}`
      }</div>` +
      `<div class="sign"><span>Printed: ${esc(new Date().toLocaleString())}</span><span>Consultant's signature</span></div>` +
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

  // ── Field helpers ────────────────────────────────────────────────────────
  const text = (key, placeholder, extra = {}) => (
    <input
      type="text"
      className="form-control form-control-sm"
      placeholder={placeholder}
      value={form[key]}
      disabled={signed}
      onChange={(e) => set(key, e.target.value)}
      {...extra}
    />
  );
  const area = (key, placeholder, rows = 2) => (
    <textarea
      className="form-control form-control-sm"
      rows={rows}
      placeholder={placeholder}
      value={form[key]}
      disabled={signed}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const date = (key) => (
    <input
      type="date"
      className="form-control form-control-sm"
      value={form[key]}
      disabled={signed}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const select = (key, options, placeholder) => (
    <select
      className="form-control form-control-sm"
      value={form[key]}
      disabled={signed}
      onChange={(e) => set(key, e.target.value)}
    >
      <option value="">{placeholder || t("Select")}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {t(o)}
        </option>
      ))}
    </select>
  );

  return (
    <div style={{ background: C.soft, padding: 12 }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>
            {t("Surgical Oncology Assessment & Treatment Plan")}
          </div>
          <div style={{ fontSize: 11.5, color: C.sub }}>
            {t("Assessment, treatment planning and protocol documentation")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.sub }}>
            {asText(patient?.Pname || patient?.PatientName)}
            {patientID ? ` · ${patientID}` : ""}
            {patient?.TransNo || transactionID ? ` · ${t("Visit")} ${patient?.TransNo || transactionID}` : ""}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handleImport}
            disabled={signed || busy}
            title={t("Copy site, laterality, finding, stage and ECOG from the OP assessment")}
          >
            <i className="fas fa-file-import mr-1" /> {t("Import OP Assessment")}
          </button>
          <Pill tone={signed ? "teal" : "amber"}>
            {signed ? t("Signed") : t("Draft")}
          </Pill>
        </div>
      </div>

      <div className="row" style={{ margin: 0 }}>
        {/* ── 01 Assessment ─────────────────────────────────────────────── */}
        <div className="col-lg-6" style={{ padding: 6 }}>
          <Section n={1} title={t("Surgical Oncology Assessment")}>
            <div className="row">
              <div className="col-md-4">
                <Label>{t("Primary site / subsite")}</Label>
                {select("A_Site", PRIMARY_SITES)}
              </div>
              <div className="col-md-4">
                <Label>{t("Laterality")}</Label>
                {select("A_Laterality", LATERALITY)}
              </div>
              <div className="col-md-4">
                <Label required>{t("Diagnosis / histology")}</Label>
                {text("A_Diagnosis", t("Enter diagnosis"))}
              </div>
            </div>

            {form.A_Imported ? (
              <div
                style={{
                  marginTop: 12,
                  background: C.soft,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>
                  {t("Imported")}: {form.A_Imported}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Pill tone={form.A_ImportedConfirmed === "1" ? "teal" : "amber"}>
                    {form.A_ImportedConfirmed === "1" ? t("Reviewed") : t("Unconfirmed")}
                  </Pill>
                  {form.A_ImportedConfirmed === "1" ? null : (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0"
                      style={{ fontSize: 11.5 }}
                      disabled={signed}
                      onClick={() => set("A_ImportedConfirmed", "1")}
                    >
                      {t("Mark reviewed")}
                    </button>
                  )}
                </span>
              </div>
            ) : null}

            <div style={{ marginTop: 12 }}>
              <Label>{t("Clinical assessment")}</Label>
              {area("A_ClinicalAssessment", t("Findings on examination"), 3)}
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="col-md-4">
                <Label>{t("ECOG performance status")}</Label>
                {select("A_ECOG", ECOG)}
              </div>
              <div className="col-md-4">
                <Label>{t("Resectability")}</Label>
                {select("A_Resectability", RESECTABILITY)}
              </div>
              <div className="col-md-4">
                <Label>{t("Surgical fitness")}</Label>
                {select("A_SurgicalFitness", SURGICAL_FITNESS)}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>{t("Comorbidities / prior treatment")}</Label>
              {area("A_Comorbidities", t("Document relevant history"))}
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>{t("Imaging / pathology evidence")}</Label>
              {text("A_LinkedReports", t("Report numbers or references, comma separated"))}
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>
                {t("Typed references — this form does not pull the reports themselves.")}
              </div>
            </div>
          </Section>
        </div>

        {/* ── 02 Treatment plan ─────────────────────────────────────────── */}
        <div className="col-lg-6" style={{ padding: 6 }}>
          <Section n={2} title={t("Treatment Plan")}>
            <div className="row">
              <div className="col-md-6">
                <Label required>{t("Treatment intent")}</Label>
                {select("P_Intent", TREATMENT_INTENT, t("Select intent"))}
              </div>
              <div className="col-md-6">
                <Label required>{t("Primary modality")}</Label>
                {select("P_Modality", PRIMARY_MODALITY, t("Select modality"))}
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="col-md-8">
                <Label>{t("Proposed procedure")}</Label>
                {text("P_Procedure", t("Select or enter procedure"))}
              </div>
              <div className="col-md-4">
                <Label>{t("Side / site")}</Label>
                {select("P_Side", SIDE_SITE)}
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="col-md-6">
                <Label>{t("Nodal procedure, if applicable")}</Label>
                {text("P_NodalProcedure", t("Enter procedure"))}
              </div>
              <div className="col-md-6">
                <Label>{t("Reconstruction, if applicable")}</Label>
                {text("P_Reconstruction", t("Enter plan"))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>{t("Treatment sequence & clinical rationale")}</Label>
              {area("P_Rationale", t("Document planned sequence, alternatives and rationale"), 3)}
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="col-md-6">
                <Label>{t("Planned date")}</Label>
                {date("P_PlannedDate")}
              </div>
              <div className="col-md-6">
                <Label>{t("Responsible consultant")}</Label>
                {text("P_Consultant", t("Consultant name"))}
              </div>
            </div>
          </Section>
        </div>

        {/* ── 03 Protocol ───────────────────────────────────────────────── */}
        <div className="col-lg-6" style={{ padding: 6 }}>
          <Section n={3} title={t("Treatment Protocol")}>
            <div className="row">
              <div className="col-md-12">
                <Label>{t("Hospital-approved protocol")}</Label>
                {text("R_ProtocolName", t("Protocol name or code"))}
              </div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <div className="col-md-4">
                <Label>{t("Protocol ID")}</Label>
                {text("R_ProtocolID", "—")}
              </div>
              <div className="col-md-4">
                <Label>{t("Version")}</Label>
                {text("R_Version", "—")}
              </div>
              <div className="col-md-4">
                <Label>{t("Effective date")}</Label>
                {date("R_EffectiveDate")}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Label>{t("Reference / linked document")}</Label>
              {text("R_Reference", t("Document reference or link"))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                margin: "14px 0 6px",
              }}
            >
              <b style={{ fontSize: 12.5, color: C.ink }}>{t("Protocol steps")}</b>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addStep}
                disabled={signed}
              >
                + {t("Add step")}
              </button>
            </div>
            <table className="table table-sm" style={{ marginBottom: 6 }}>
              <thead>
                <tr style={{ fontSize: 11.5, color: C.sub }}>
                  <th style={{ width: 50 }}>{t("Step")}</th>
                  <th>{t("Intervention / modality")}</th>
                  <th>{t("Timing / sequence")}</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {steps.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: C.sub, fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <select
                        className="form-control form-control-sm"
                        value={row.intervention}
                        disabled={signed}
                        onChange={(e) => setStep(i, "intervention", e.target.value)}
                      >
                        <option value="">{t("Select intervention")}</option>
                        {INTERVENTIONS.map((o) => (
                          <option key={o} value={o}>
                            {t(o)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={t("Enter timing")}
                        value={row.timing}
                        disabled={signed}
                        onChange={(e) => setStep(i, "timing", e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        title={t("Remove step")}
                        disabled={signed}
                        onClick={() => removeStep(i)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Label>{t("Protocol deviations & rationale")}</Label>
            {area("R_Deviations", t("Document changes from the selected protocol"))}
          </Section>
        </div>

        {/* ── 04 MDT ────────────────────────────────────────────────────── */}
        <div className="col-lg-6" style={{ padding: 6 }}>
          <Section
            n={4}
            title={t("MDT Review & Follow-up")}
            sub={t("Multidisciplinary team review")}
          >
            <div className="row">
              <div className="col-md-6">
                <Label>{t("MDT review status")}</Label>
                {select("M_Status", MDT_STATUS)}
              </div>
              <div className="col-md-6">
                <Label>{t("Review date")}</Label>
                {date("M_ReviewDate")}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>{t("MDT recommendations")}</Label>
              {area("M_Recommendations", t("Document team decision and agreed plan"))}
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="col-md-6">
                <Label>{t("Pre-anaesthesia assessment")}</Label>
                {select("M_PreAnaesthesia", READINESS)}
              </div>
              <div className="col-md-6">
                <Label>{t("Informed consent")}</Label>
                {select("M_Consent", READINESS)}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>{t("Patient discussion / preferences")}</Label>
              {area("M_Discussion", t("Document options, benefits, risks and preferences"))}
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>{t("Referrals")}</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {REFERRAL_SPECIALTIES.map((sp) => {
                  const on = referrals.includes(sp);
                  return (
                    <button
                      key={sp}
                      type="button"
                      disabled={signed}
                      onClick={() => toggleReferral(sp)}
                      style={{
                        padding: "5px 11px",
                        borderRadius: 16,
                        border: `1px solid ${on ? C.tealLine : C.line}`,
                        background: on ? C.tealBg : C.white,
                        color: on ? C.teal : C.ink,
                        fontWeight: on ? 700 : 500,
                        fontSize: 12,
                        cursor: signed ? "not-allowed" : "pointer",
                      }}
                    >
                      {t(sp)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="col-md-6">
                <Label>{t("Follow-up date")}</Label>
                {date("M_FollowUpDate")}
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          background: C.white,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: "10px 16px",
          marginTop: 6,
        }}
      >
        <span style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 9, height: 9, borderRadius: "50%",
              background: signed ? C.teal : "#e0a800", display: "inline-block",
            }}
          />
          {signed
            ? `${t("Signed")}${form.Meta_SignedBy ? ` · ${form.Meta_SignedBy}` : ""}${
                form.Meta_SignedOn ? ` · ${form.Meta_SignedOn}` : ""
              }`
            : `${t("Draft")} · ${t("clinical review pending")}`}
          {saved && !signed ? (
            <span style={{ color: C.teal }}>
              <i className="fas fa-check-circle mr-1" />
              {t("Saved for this visit")}
            </span>
          ) : null}
        </span>

        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handlePrint}
          >
            <i className="fa fa-print mr-1" /> {t("Preview / Print")}
          </button>
          {signed ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleReopen}
              disabled={busy}
              title={t("Return the assessment to draft so it can be edited")}
            >
              <i className="fas fa-unlock mr-1" /> {t("Reopen for editing")}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleSaveDraft}
                disabled={busy}
              >
                <i className="fa fa-save mr-1" />{" "}
                {busy ? t("Please wait...") : saved ? t("Update") : t("Save Draft")}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={handleSign}
                disabled={busy || signBlockers.length > 0}
                title={
                  signBlockers.length
                    ? `${t("Cannot sign yet")}: ${signBlockers.join(", ")}`
                    : t("Sign this assessment")
                }
              >
                <i className="fas fa-signature mr-1" /> {t("Sign Assessment")}
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

export default SurgicalOncoAssessment;
