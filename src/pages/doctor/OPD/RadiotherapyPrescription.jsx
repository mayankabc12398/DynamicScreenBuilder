import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import {
  GetRadiotherapyPrescription,
  SaveRadiotherapyPrescription,
} from "../../../networkServices/DoctorApi";

/* =============================================================================
   Radiotherapy Treatment Prescription — the EMR form.

   Opened from the EMR form list on /ViewConsultation. The menu row lives in
   cpoe_menumaster with URL 'RadiotherapyPrescription' (API repo,
   DBScripts/2026-09-29_radiotherapy_prescription.sql), and the EMR lazy-loads
   this file by that name, so the file name and that URL stay in step.

   Saving is an upsert: the visit's previous values are superseded, so the same
   button is the first save and every later update.

   The treatment prescription lines are a list — ADD appends one and the grid
   below shows them — so they are stored as JSON under one key rather than as
   Line1_*, Line2_*, which would need cleaning up on every save.
   ============================================================================= */

const C = {
  ink: "#12313a", sub: "#64757d", line: "#d9e4e8", soft: "#f5f9fa",
  blue: "#1667a8", blueBg: "#e8f2fa",
  red: "#b3261e", white: "#fff",
};

const TREATMENT_INTENT = [
  "Non Malignant", "Adjuvant", "Radical", "Palliative", "Prophylactic",
];

const TREATMENT_SITES = [
  "Brain", "Head & Neck", "Breast", "Chest / Lung", "Abdomen", "Pelvis",
  "Spine", "Extremity", "Whole Body", "Other",
];

const TECHNIQUES = [
  "2D Conventional", "3D CRT", "IMRT", "VMAT", "SRS", "SBRT",
  "Electron", "Brachytherapy", "Other",
];

/* The requirements checklist, in the order the paper form lists it — the
   radiographers read down it, so the order is part of the form. */
const REQUIREMENTS = [
  "MOULDROOM-(Thermoplastic Mask)", "MOULDROOM-(Vacloc Mask)", "CT PLANNING",
  "IV CONTRAST", "ORAL CONTRAST", "ELECTRON CUT OUT", "BOLUS cm",
  "CHEMOTHERAPY WEEKLY", "CHEMOTHERAPY CONCURRENT", "CHEMOTHERAPY OTHERS",
  "PORTAL IMAGING PRE TRT", "1ST TRT", "WEEKLY", "NONE", "PATIENT PHOTO",
  "CONSENT FORM", "OTHERS", "Rescan", "Retreat", "Reradiation",
];

const PREGNANCY_STATUS = ["Yes", "No", "NA"];

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

const csv = (arr) => (arr || []).join(", ");
const fromCsv = (s) =>
  String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

const INITIAL = {
  H_OncoID: "",
  H_DataOnMOSAIQ: "",
  H_PatientAlert: "",
  H_Intent: "", // csv of TREATMENT_INTENT
  R_Requirements: "", // csv of REQUIREMENTS
  R_Remark: "",
  R_IMRTDoseConstraint: "0",
  P_Status: "",
  P_DateOfLMP: "",
  P_TestDone: "0",
  P_Result: "",
};

/* One line of the treatment prescription — the fields the ADD button collects. */
const EMPTY_LINE = {
  site: "",
  technique: "",
  totalTumorDose: "",
  appliedDose: "",
  fractionPerWeek: "",
  duration: "",
  noOfFraction: "",
  modalityEnergy: "",
  criticalOrganDose: "",
  depthDose: "",
  primary: "",
  boost: "",
  medicineBeforeTherapy: "",
};

const Label = ({ children }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 4 }}>
    {children}
  </div>
);

const Band = ({ title, children }) => (
  <div
    style={{
      border: `1px solid ${C.line}`,
      borderRadius: 8,
      marginBottom: 12,
      overflow: "hidden",
      background: C.white,
    }}
  >
    <div
      style={{
        background: C.blue,
        color: C.white,
        padding: "6px 12px",
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: 0.3,
      }}
    >
      {title}
    </div>
    <div style={{ padding: 12 }}>{children}</div>
  </div>
);

function RadiotherapyPrescription({ patientDetail }) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";
  const transactionID = patient?.TransactionID || "";

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  const [form, setForm] = useState(INITIAL);
  const [lines, setLines] = useState([]);
  const [draft, setDraft] = useState({ ...EMPTY_LINE });
  const [editingIndex, setEditingIndex] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setDraftField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const toggleCsv = (key, value) => {
    const list = fromCsv(form[key]);
    set(
      key,
      csv(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]),
    );
  };
  const inCsv = (key, value) => fromCsv(form[key]).includes(value);

  // ── Load this visit's prescription ───────────────────────────────────────
  useEffect(() => {
    if (!patientID || !transactionID) return undefined;
    let active = true;
    (async () => {
      try {
        const res = await GetRadiotherapyPrescription(patientID, transactionID);
        if (!active) return;
        // "No record found" is a visit with no prescription yet, not an error.
        if (!res?.success || !Array.isArray(res?.data) || !res.data.length) return;
        const next = { ...INITIAL };
        let loadedLines = null;
        res.data.forEach((row) => {
          const key = String(row?.keyName ?? row?.KeyName ?? "").trim();
          const value = row?.value ?? row?.Value ?? "";
          if (key === "T_Lines") {
            try {
              const parsed = JSON.parse(value || "[]");
              if (Array.isArray(parsed)) loadedLines = parsed;
            } catch {
              loadedLines = null;
            }
          } else if (key in next) {
            next[key] = value ?? "";
          }
        });
        setForm(next);
        setLines(loadedLines || []);
        setSaved(true);
      } catch (e) {
        notify(t("Failed to load the radiotherapy prescription"), "error");
      }
    })();
    return () => {
      active = false;
    };
  }, [patientID, transactionID]);

  // ── Treatment lines ──────────────────────────────────────────────────────
  const draftHasContent = useMemo(
    () => Object.values(draft).some((v) => String(v ?? "").trim()),
    [draft],
  );

  const handleAddLine = () => {
    if (!draftHasContent) {
      notify(t("Fill the treatment prescription before adding it"), "warn");
      return;
    }
    if (!String(draft.site).trim()) {
      notify(t("Treatment site is required"), "warn");
      return;
    }
    if (editingIndex !== null) {
      setLines((rows) => rows.map((r, i) => (i === editingIndex ? draft : r)));
      setEditingIndex(null);
    } else {
      setLines((rows) => [...rows, draft]);
    }
    setDraft({ ...EMPTY_LINE });
  };

  const handleEditLine = (i) => {
    setDraft({ ...EMPTY_LINE, ...lines[i] });
    setEditingIndex(i);
  };

  const handleRemoveLine = (i) => {
    setLines((rows) => rows.filter((_, idx) => idx !== i));
    if (editingIndex === i) {
      setEditingIndex(null);
      setDraft({ ...EMPTY_LINE });
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!patientID || !transactionID) {
      notify(t("No patient visit is loaded"), "error");
      return;
    }
    if (!lines.length) {
      notify(t("Add at least one treatment prescription"), "warn");
      return;
    }
    /* A prescription with no intent is not a prescription: it decides whether the
       course is radical or palliative, which changes everything downstream. */
    if (!fromCsv(form.H_Intent).length) {
      notify(t("Treatment intent is required"), "warn");
      return;
    }
    setBusy(true);
    try {
      const valueDetails = Object.keys(form).map((k) => ({
        keyName: k,
        value: String(form[k] ?? ""),
      }));
      valueDetails.push({ keyName: "T_Lines", value: JSON.stringify(lines) });
      const res = await SaveRadiotherapyPrescription({
        patientID,
        transactionID,
        valueDetails,
      });
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

    const lineTable = lines.length
      ? `<h2>Treatment prescription</h2><table class="grid">
           <tr><th>#</th><th>Site</th><th>Technique</th><th>Total dose (Gy)</th>
               <th>Applied dose (Gy)</th><th>Fractions</th><th>Fr/week</th>
               <th>Modality / energy</th><th>Duration</th></tr>
           ${lines
             .map(
               (l, i) =>
                 `<tr><td>${i + 1}</td><td>${esc(l.site)}</td><td>${esc(l.technique)}</td>` +
                 `<td>${esc(l.totalTumorDose)}</td><td>${esc(l.appliedDose)}</td>` +
                 `<td>${esc(l.noOfFraction)}</td><td>${esc(l.fractionPerWeek)}</td>` +
                 `<td>${esc(l.modalityEnergy)}</td><td>${esc(l.duration)}</td></tr>`,
             )
             .join("")}
         </table>`
      : "";

    const demo = [
      ["Patient", patient?.Pname || patient?.PatientName],
      ["UHID", patientID],
      ["Age / Sex", [patient?.Age, patient?.Gender || patient?.Sex].filter(Boolean).join(" / ")],
      ["Onco ID", form.H_OncoID],
      ["Panel", patient?.PanelName],
      ["Doctor", patient?.DName],
      ["Visit date", patient?.AppointmentDate],
      ["Visit no", patient?.TransNo || transactionID],
    ]
      .filter(([, v]) => String(v ?? "").trim())
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
      .join("");

    const html =
      `<!DOCTYPE html><html><head><title>Radiotherapy Treatment Prescription</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `@page{size:A4;margin:12mm;}` +
      `body{font:11.5px/1.4 Arial,Helvetica,sans-serif;color:#12313a;}` +
      `h1{font-size:15px;text-align:center;}` +
      `.hosp{text-align:center;font-size:12.5px;font-weight:700;margin-bottom:2px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px 12px;border:1px solid #d9e4e8;` +
      `border-radius:5px;padding:7px 9px;margin:9px 0 12px;}` +
      `.demo div{font-size:10.5px;}.demo span{color:#64757d;display:inline-block;min-width:62px;}` +
      `h2{font-size:12px;margin:11px 0 4px;padding-bottom:3px;border-bottom:1px solid #d9e4e8;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `.kv th{width:30%;text-align:left;font-weight:600;color:#64757d;padding:3px 6px 3px 0;vertical-align:top;}` +
      `.kv td{padding:3px 0;vertical-align:top;}` +
      `.grid th,.grid td{border:1px solid #d9e4e8;padding:3px 5px;text-align:left;font-size:10.5px;}` +
      `.sign{margin-top:30px;display:flex;justify-content:space-between;font-size:10.5px;color:#64757d;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>Radiotherapy Treatment Prescription</h1>` +
      `<div class="demo">${demo}</div>` +
      block("Header", [
        ["Data on MOSAIQ", form.H_DataOnMOSAIQ],
        ["Patient alert", form.H_PatientAlert],
        ["Treatment intent", form.H_Intent],
      ]) +
      lineTable +
      block("Requirements", [
        ["Selected", form.R_Requirements],
        ["Remark", form.R_Remark],
        ["IMRT dose constraint", form.R_IMRTDoseConstraint === "1" ? "Yes" : ""],
      ]) +
      block("Pregnancy status", [
        ["Status", form.P_Status],
        ["Date of LMP", form.P_DateOfLMP],
        ["Pregnancy test done", form.P_TestDone === "1" ? "Yes" : ""],
        ["Result", form.P_Result],
      ]) +
      `<div class="sign"><span>Printed: ${esc(new Date().toLocaleString())}</span><span>Radiation Oncologist's signature</span></div>` +
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
  const text = (key, placeholder) => (
    <input
      type="text"
      className="form-control form-control-sm"
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const lineText = (key, placeholder) => (
    <input
      type="text"
      className="form-control form-control-sm"
      placeholder={placeholder}
      value={draft[key]}
      onChange={(e) => setDraftField(key, e.target.value)}
    />
  );
  const lineSelect = (key, options) => (
    <select
      className="form-control form-control-sm"
      value={draft[key]}
      onChange={(e) => setDraftField(key, e.target.value)}
    >
      <option value="">{t("Select")}</option>
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
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 12,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>
            {t("Radiotherapy Treatment Prescription")}
          </div>
          <div style={{ fontSize: 12, color: C.sub }}>
            {asText(patient?.Pname || patient?.PatientName)}
            {patientID ? ` · ${patientID}` : ""}
            {patient?.TransNo || transactionID
              ? ` · ${t("Visit")} ${patient?.TransNo || transactionID}`
              : ""}
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <Label>{t("Onco ID")}</Label>
            {text("H_OncoID", t("e.g. ONC-26-0001273"))}
            {/* There is no Onco ID anywhere in this system - no column, no sequence,
                no generator - so it is recorded as entered and nothing derives from
                it. Generating and reserving that number is a separate decision. */}
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 3 }}>
              {t("Recorded as entered — this form does not generate the number.")}
            </div>
          </div>
          <div className="col-md-4">
            <Label>{t("Data on MOSAIQ")}</Label>
            {text("H_DataOnMOSAIQ", "")}
          </div>
          <div className="col-md-4">
            <Label>{t("Patient Alert")}</Label>
            {text("H_PatientAlert", "")}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>{t("Treatment Intent")}</Label>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {TREATMENT_INTENT.map((o) => (
              <label
                key={o}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12.5, color: C.ink, marginBottom: 0, cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={inCsv("H_Intent", o)}
                  onChange={() => toggleCsv("H_Intent", o)}
                />
                {t(o)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Treatment prescription ───────────────────────────────────────── */}
      <Band title={t("TREATMENT PRESCRIPTION")}>
        <div className="row">
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Treatment Site")}</Label>
            {lineSelect("site", TREATMENT_SITES)}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Techniques")}</Label>
            {lineSelect("technique", TECHNIQUES)}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Total Tumor Dose Gy")}</Label>
            {lineText("totalTumorDose", "")}
          </div>

          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Applied Dose Gy")}</Label>
            {lineText("appliedDose", "")}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Fraction Per Week")}</Label>
            {lineText("fractionPerWeek", "")}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Duration")}</Label>
            {lineText("duration", "")}
          </div>

          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("No. Of Fraction")}</Label>
            {lineText("noOfFraction", "")}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("MODALITY/ENERGY")}</Label>
            {lineText("modalityEnergy", "")}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Critical Organ / Dose Gy")}</Label>
            {lineText("criticalOrganDose", "")}
          </div>

          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("% DEPTH DOSE")}</Label>
            {lineText("depthDose", "")}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Primary")}</Label>
            {lineText("primary", "")}
          </div>
          <div className="col-md-4" style={{ marginBottom: 10 }}>
            <Label>{t("Boost")}</Label>
            {lineText("boost", "")}
          </div>

          <div className="col-md-8">
            <Label>{t("Medicine Before Therapy")}</Label>
            {lineText("medicineBeforeTherapy", "")}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-sm btn-primary px-4"
            onClick={handleAddLine}
          >
            {editingIndex !== null ? t("UPDATE") : t("ADD")}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary ml-2"
              onClick={() => {
                setEditingIndex(null);
                setDraft({ ...EMPTY_LINE });
              }}
            >
              {t("Cancel")}
            </button>
          )}
        </div>

        {lines.length > 0 && (
          <table className="table table-sm" style={{ marginTop: 12, marginBottom: 0 }}>
            <thead>
              <tr style={{ fontSize: 11, color: C.sub }}>
                <th style={{ width: 40 }}>#</th>
                <th>{t("Site")}</th>
                <th>{t("Technique")}</th>
                <th>{t("Total Tumor Dose Gy")}</th>
                <th>{t("No. Of Fraction")}</th>
                <th>{t("MODALITY/ENERGY")}</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} style={{ background: editingIndex === i ? C.blueBg : undefined }}>
                  <td style={{ color: C.sub, fontSize: 12 }}>{i + 1}</td>
                  <td>{asText(l.site)}</td>
                  <td>{asText(l.technique)}</td>
                  <td>{asText(l.totalTumorDose)}</td>
                  <td>{asText(l.noOfFraction)}</td>
                  <td>{asText(l.modalityEnergy)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 mr-2"
                      onClick={() => handleEditLine(i)}
                    >
                      {t("Edit")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-danger"
                      onClick={() => handleRemoveLine(i)}
                    >
                      {t("Remove")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Band>

      {/* ── Requirements ─────────────────────────────────────────────────── */}
      <Band title={t("REQUIREMENTS")}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 6,
          }}
        >
          {REQUIREMENTS.map((o) => (
            <label
              key={o}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: C.ink, marginBottom: 0, cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={inCsv("R_Requirements", o)}
                onChange={() => toggleCsv("R_Requirements", o)}
              />
              {t(o)}
            </label>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>{t("Remark")}</Label>
          {text("R_Remark", "")}
        </div>

        <label
          style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 12,
            fontSize: 12.5, color: C.ink, marginBottom: 0, cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.R_IMRTDoseConstraint === "1"}
            onChange={(e) => set("R_IMRTDoseConstraint", e.target.checked ? "1" : "0")}
          />
          {t("IMRT Dose Constraint")}
        </label>
      </Band>

      {/* ── Pregnancy status ─────────────────────────────────────────────── */}
      <Band title={t("PREGNANCY STATUS")}>
        <div className="row">
          <div className="col-md-4">
            <Label>{t("Status")}</Label>
            <div style={{ display: "flex", gap: 16 }}>
              {PREGNANCY_STATUS.map((o) => (
                <label
                  key={o}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 12.5, color: C.ink, marginBottom: 0, cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="P_Status"
                    checked={form.P_Status === o}
                    onChange={() => set("P_Status", o)}
                  />
                  {t(o)}
                </label>
              ))}
            </div>
          </div>
          <div className="col-md-4">
            <Label>{t("Date of LMP")}</Label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={form.P_DateOfLMP}
              onChange={(e) => set("P_DateOfLMP", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <Label>{t("Result")}</Label>
            {text("P_Result", "")}
          </div>
        </div>

        <label
          style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 12,
            fontSize: 12.5, color: C.ink, marginBottom: 0, cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.P_TestDone === "1"}
            onChange={(e) => set("P_TestDone", e.target.checked ? "1" : "0")}
          />
          {t("Pregnancy Test Done")}
        </label>
      </Band>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
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
            <i className="fas fa-check-circle mr-1" style={{ color: C.blue }} />
            {t("A prescription is already recorded for this visit")}
          </span>
        )}
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handlePrint}>
          <i className="fa fa-print mr-1" /> {t("Print")}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary px-4"
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

export default RadiotherapyPrescription;
