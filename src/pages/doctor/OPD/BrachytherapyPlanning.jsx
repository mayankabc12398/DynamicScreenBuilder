import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import {
  DeleteBrachytherapyPlanning,
  GetBrachytherapyPlanning,
  SaveBrachytherapyPlanning,
} from "../../../networkServices/DoctorApi";

/* =============================================================================
   Brachytherapy Planning Form — the EMR form.

   Opened from the EMR form list on /ViewConsultation. The menu row lives in
   cpoe_menumaster with URL 'BrachytherapyPlanning' (API repo,
   DBScripts/2026-09-29_brachytherapy_planning.sql), and the EMR lazy-loads this
   file by that name, so the file name and that URL stay in step.

   A flat form — prescription, simulation, one block per applicator technique,
   two free-text panels — and a patient has a LIST of them, each edited on its
   own from the grid at the bottom. Save writes one row; Edit loads it back.
   Read by patient, like the other radiotherapy screens.
   ============================================================================= */

const C = {
  ink: "#12313a", sub: "#64757d", line: "#d9e4e8", soft: "#f5f9fa",
  blue: "#1667a8", blueBg: "#e8f2fa", head: "#1d6fa5", red: "#b3261e", white: "#fff",
};

/* The dropdowns. No master holds these in the system, so they are the standard
   clinical lists, kept here where a new size is a one-line change; the chosen
   value is stored as text so nothing downstream needs a migration. */
const YES_NO = ["Yes", "No"];
const OVOID_SIZES = ["Small (2.0 cm)", "Medium (2.5 cm)", "Large (3.0 cm)"];
const RING_SIZES = ["26 mm", "30 mm", "34 mm"];
const CYLINDER_DIAMETERS = ["2.0", "2.5", "3.0", "3.5", "4.0"];
const ONLY_OVOID_SIZES = ["2.0", "2.5", "3.0"];
const APPLICATOR_TYPES = ["Needles", "Plastic tubes", "Catheters"];
const SIMULATION = ["CT", "XRAY", "None"];

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);
const csv = (arr) => (arr || []).join(", ");
const fromCsv = (s) =>
  asText(s).split(",").map((x) => x.trim()).filter(Boolean);

/* Field keys, in the order of the paper form. The API's column names are these
   with an upper-case first letter. */
export const FIELDS = [
  "dosePerFraction", "noOfFractions", "dosePrescribedTo", "interfractionTime", "simulation",
  "icOvoidFullApplication", "icOvoidSize", "icOvoidTubeLength",
  "icRingFullApplication", "icRingSize", "icRingTubeLength",
  "cylinderTreatmentLength", "cylinderDiameter",
  "onlyOvoids", "onlyOvoidSize",
  "interstitialSite", "interstitialApplicators", "interstitialApplicatorType",
  "mouldSite", "mouldApplicators",
  "luminalSite", "luminalTreatmentLength",
  "additionalInformation", "applicatorConfiguration",
];

const EMPTY = Object.fromEntries(FIELDS.map((k) => [k, ""]));
EMPTY.id = 0;

const upper = (k) => k[0].toUpperCase() + k.slice(1);

/* Dapper answers in camelCase, older wrappers in PascalCase — take whichever
   arrived rather than betting on one. */
const pick = (row, k) => asText(row?.[k] ?? row?.[upper(k)] ?? "");

const fmtDate = (v) => {
  const s = asText(v).trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
};

export const normaliseRow = (row) => ({
  id: Number(row?.id ?? row?.ID ?? 0) || 0,
  ...Object.fromEntries(FIELDS.map((k) => [k, pick(row, k)])),
  entryByName: pick(row, "entryByName").trim(),
  updatedByName: pick(row, "updatedByName").trim(),
  entryDate: fmtDate(row?.entryDate ?? row?.EntryDate),
  updateDate: fmtDate(row?.updateDate ?? row?.UpdateDate),
});

/**
 * Empty string when the form can be saved, otherwise what is missing. A form
 * with nothing on it records nothing; beyond that every block is optional
 * because a plan uses one applicator technique, not all of them.
 */
export const validateForm = (form) => {
  const filled = FIELDS.some((k) => asText(form?.[k]).trim() !== "");
  if (!filled) return "Fill the form before saving it";
  return "";
};

export const toPayload = (form, patientID, transactionID) => ({
  id: Number(form?.id ?? 0) || 0,
  patientID,
  transactionID,
  ...Object.fromEntries(FIELDS.map((k) => [k, asText(form?.[k]).trim()])),
});

const Label = ({ children }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 4 }}>
    {children}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div
      style={{
        fontSize: 12, fontWeight: 800, color: C.ink, fontStyle: "italic",
        textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6,
        paddingBottom: 3, borderBottom: `1px solid ${C.line}`,
      }}
    >
      {title}
    </div>
    <div className="row">{children}</div>
  </div>
);

const Band = ({ title, children }) => (
  <div
    style={{
      border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 12,
      overflow: "hidden", background: C.white,
    }}
  >
    <div
      style={{
        background: C.head, color: C.white, padding: "6px 12px", fontSize: 12.5,
        fontWeight: 700, letterSpacing: 0.3, textAlign: "center",
      }}
    >
      {title}
    </div>
    <div style={{ padding: 12 }}>{children}</div>
  </div>
);

function BrachytherapyPlanning({ patientDetail }) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";
  const transactionID = patient?.TransactionID || "";

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  const [form, setForm] = useState({ ...EMPTY });
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSim = (v) => {
    const list = fromCsv(form.simulation);
    // "None" and a modality contradict each other; picking one drops the other.
    const next = list.includes(v)
      ? list.filter((x) => x !== v)
      : v === "None"
        ? ["None"]
        : [...list.filter((x) => x !== "None"), v];
    set("simulation", csv(next));
  };

  // ── The patient's forms ──────────────────────────────────────────────────
  /* t is left out of the deps on purpose: react-i18next hands back a new
     function identity on every render, and depending on it turns this into a
     fetch-per-render loop. */
  const load = useCallback(async () => {
    if (!patientID) return;
    try {
      const res = await GetBrachytherapyPlanning(patientID);
      // "No record found" is a patient with no form yet, not an error.
      const list = Array.isArray(res?.data) ? res.data : [];
      setRows(res?.success && list.length ? list.map(normaliseRow) : []);
    } catch (e) {
      notify(t("Failed to load the brachytherapy plans"), "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Save / edit / delete ─────────────────────────────────────────────────
  const resetForm = () => setForm({ ...EMPTY });

  const handleSave = async () => {
    if (!patientID) {
      notify(t("No patient is loaded"), "error");
      return;
    }
    const problem = validateForm(form);
    if (problem) {
      notify(t(problem), "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await SaveBrachytherapyPlanning(toPayload(form, patientID, transactionID));
      if (res?.success) {
        notify(res?.message || t("Record saved successfully"), "success");
        resetForm();
        await load();
      } else {
        notify(res?.message || t("Failed to save record"), "error");
      }
    } catch (e) {
      notify(t("Failed to save record"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (row) => {
    setForm({ ...EMPTY, ...Object.fromEntries(FIELDS.map((k) => [k, row[k]])), id: row.id });
    try {
      window?.scrollTo?.({ top: 0, behavior: "smooth" });
    } catch (_) {
      /* ignored */
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    setBusy(true);
    try {
      const res = await DeleteBrachytherapyPlanning(row.id, patientID);
      if (res?.success) {
        notify(res?.message || t("Record deleted successfully"), "success");
        if (form.id === row.id) resetForm();
        await load();
      } else {
        notify(res?.message || t("Failed to delete record"), "error");
      }
    } catch (e) {
      notify(t("Failed to delete record"), "error");
    } finally {
      setBusy(false);
    }
  };

  // ── Print ────────────────────────────────────────────────────────────────
  const handlePrint = (row) => {
    const esc = (v) =>
      asText(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
    const block = (title, pairs) => {
      const body = pairs
        .filter(([, v]) => asText(v).trim())
        .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
        .join("");
      return body ? `<h2>${esc(title)}</h2><table class="kv">${body}</table>` : "";
    };

    const demo = [
      ["Patient", patient?.Pname || patient?.PatientName],
      ["UHID", patientID],
      ["Age / Sex", [patient?.Age, patient?.Gender || patient?.Sex].filter(Boolean).join(" / ")],
      ["Panel", patient?.PanelName],
      ["Doctor", patient?.DName],
      ["Visit no", patient?.TransNo || transactionID],
      ["Entered by", row.entryByName],
      ["Entered on", row.entryDate],
    ]
      .filter(([, v]) => asText(v).trim())
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
      .join("");

    const html =
      `<!DOCTYPE html><html><head><title>Brachytherapy Planning Form</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `@page{size:A4;margin:12mm;}` +
      `body{font:11.5px/1.4 Arial,Helvetica,sans-serif;color:#12313a;}` +
      `h1{font-size:15px;text-align:center;}` +
      `.hosp{text-align:center;font-size:12.5px;font-weight:700;margin-bottom:2px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px 12px;border:1px solid #d9e4e8;` +
      `border-radius:5px;padding:7px 9px;margin:9px 0 12px;}` +
      `.demo div{font-size:10.5px;}.demo span{color:#64757d;display:inline-block;min-width:66px;}` +
      `h2{font-size:12px;margin:11px 0 4px;padding-bottom:3px;border-bottom:1px solid #d9e4e8;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `.kv th{width:34%;text-align:left;font-weight:600;color:#64757d;padding:3px 6px 3px 0;vertical-align:top;}` +
      `.kv td{padding:3px 0;vertical-align:top;white-space:pre-wrap;}` +
      `.sign{margin-top:30px;display:flex;justify-content:space-between;font-size:10.5px;color:#64757d;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>Brachytherapy Planning Form</h1>` +
      `<div class="demo">${demo}</div>` +
      block("Prescription", [
        ["Dose per fraction (cGy)", row.dosePerFraction],
        ["No. of fractions", row.noOfFractions],
        ["Dose prescribed to", row.dosePrescribedTo],
        ["Interfractionation time", row.interfractionTime],
        ["Simulation", row.simulation],
      ]) +
      block("Intracavitary (intrauterine tube + ovoids)", [
        ["Full application", row.icOvoidFullApplication],
        ["Ovoid size", row.icOvoidSize],
        ["IU tube length (cm)", row.icOvoidTubeLength],
      ]) +
      block("Intracavitary (intrauterine tube + ring)", [
        ["Full application", row.icRingFullApplication],
        ["Ring size", row.icRingSize],
        ["IU tube length (cm)", row.icRingTubeLength],
      ]) +
      block("Cylinder", [
        ["Treatment length", row.cylinderTreatmentLength],
        ["Cylinder diameter (cm)", row.cylinderDiameter],
      ]) +
      block("Only ovoids", [
        ["Only ovoids", row.onlyOvoids],
        ["Ovoid size (cm)", row.onlyOvoidSize],
      ]) +
      block("Interstitial", [
        ["Site", row.interstitialSite],
        ["No. of applicators", row.interstitialApplicators],
        ["Type of applicators", row.interstitialApplicatorType],
      ]) +
      block("Surface mould", [
        ["Site", row.mouldSite],
        ["No. of applicators", row.mouldApplicators],
      ]) +
      block("Intraluminal", [
        ["Site", row.luminalSite],
        ["Treatment length (cm)", row.luminalTreatmentLength],
      ]) +
      block("Additional information", [["", row.additionalInformation]]) +
      block("Applicator configuration", [["", row.applicatorConfiguration]]) +
      `<div class="sign"><span>Printed: ${esc(new Date().toLocaleString())}</span>` +
      `<span>Medical Physicist</span><span>Radiation Oncologist</span></div>` +
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
  const text = (key, label) => (
    <input
      type="text"
      className="form-control form-control-sm"
      aria-label={label}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const area = (key, label, rows = 2) => (
    <textarea
      className="form-control form-control-sm"
      aria-label={label}
      rows={rows}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const select = (key, label, options) => (
    <select
      className="form-control form-control-sm"
      aria-label={label}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    >
      <option value="">{t("Select")}</option>
      {/* A value saved before the list carried it still shows, instead of the
          dropdown silently falling back to "Select" and losing it on save. */}
      {(options.includes(form[key]) || !form[key] ? options : [...options, form[key]]).map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
  const col = (n, label, control) => (
    <div className={`col-md-${n} mb-2`}>
      <Label>{label}</Label>
      {control}
    </div>
  );

  const editing = form.id > 0;

  return (
    <div style={{ background: C.soft, padding: 12 }}>
      <Band title={t("Brachytherapy Planning Form")}>
        <div style={{ textAlign: "center", marginBottom: 10, fontSize: 12, color: C.sub }}>
          {asText(patient?.Pname || patient?.PatientName)}
          {patientID ? ` · ${patientID}` : ""}
          {patient?.TransNo || transactionID
            ? ` · ${t("Visit")} ${patient?.TransNo || transactionID}`
            : ""}
        </div>

        <Section title={t("Prescription")}>
          {col(3, t("Dose per Fraction cGy"), area("dosePerFraction", "Dose per Fraction cGy"))}
          {col(3, t("No. of Fractions"), area("noOfFractions", "No. of Fractions"))}
          {col(3, t("Dose Prescribed to"), area("dosePrescribedTo", "Dose Prescribed to"))}
          {col(3, t("Interfractionation Time"), area("interfractionTime", "Interfractionation Time"))}
        </Section>

        <Section title={t("Simulation")}>
          <div className="col-md-12 mb-2" style={{ display: "flex", gap: 18 }}>
            {SIMULATION.map((o) => (
              <label
                key={o}
                style={{
                  display: "flex", alignItems: "center", gap: 6, fontSize: 12.5,
                  color: C.ink, marginBottom: 0, cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={fromCsv(form.simulation).includes(o)}
                  onChange={() => toggleSim(o)}
                />
                {o}
              </label>
            ))}
          </div>
        </Section>

        <Section title={t("Intracavitary")}>
          {col(4, t("Full Application (Intrauterine tube + Ovoids)"),
            select("icOvoidFullApplication", "Full Application (Ovoids)", YES_NO))}
          {col(4, t("Ovoid Size"), select("icOvoidSize", "Ovoid Size", OVOID_SIZES))}
          {col(4, t("IU Tube Length (cm)"), text("icOvoidTubeLength", "IU Tube Length (Ovoids)"))}
        </Section>

        <Section title={t("Intracavitary")}>
          {col(4, t("Full Application (Intrauterine tube + Ring)"),
            select("icRingFullApplication", "Full Application (Ring)", YES_NO))}
          {col(4, t("Ring Size"), select("icRingSize", "Ring Size", RING_SIZES))}
          {col(4, t("IU Tube Length (cm)"), text("icRingTubeLength", "IU Tube Length (Ring)"))}
        </Section>

        <Section title={t("Cylinder")}>
          {col(6, t("Treatment Length"), text("cylinderTreatmentLength", "Cylinder Treatment Length"))}
          {col(6, t("Cylinder Diameter (cm)"), select("cylinderDiameter", "Cylinder Diameter", CYLINDER_DIAMETERS))}
        </Section>

        <Section title={t("Only Ovoids")}>
          {col(6, t("Only Ovoids"), select("onlyOvoids", "Only Ovoids", YES_NO))}
          {col(6, t("Ovoid size (cm)"), select("onlyOvoidSize", "Only Ovoid Size", ONLY_OVOID_SIZES))}
        </Section>

        <Section title={t("Interstitial")}>
          {col(4, t("Site"), text("interstitialSite", "Interstitial Site"))}
          {col(4, t("No. of applicators"), text("interstitialApplicators", "Interstitial Applicators"))}
          {col(4, t("Type of applicators"), select("interstitialApplicatorType", "Type of applicators", APPLICATOR_TYPES))}
        </Section>

        <Section title={t("Surface Mould")}>
          {col(6, t("Site"), text("mouldSite", "Mould Site"))}
          {col(6, t("No. of applicators"), text("mouldApplicators", "Mould Applicators"))}
        </Section>

        <Section title={t("Intraluminal")}>
          {col(6, t("Site"), text("luminalSite", "Intraluminal Site"))}
          {col(6, t("Treatment Length (cm)"), text("luminalTreatmentLength", "Intraluminal Treatment Length"))}
        </Section>

        <Section title={t("Additional Information")}>
          <div className="col-md-12 mb-2">{area("additionalInformation", "Additional Information", 3)}</div>
        </Section>

        <Section title={t("Applicator Configuration")}>
          <div className="col-md-12 mb-2">{area("applicatorConfiguration", "Applicator Configuration", 3)}</div>
        </Section>

        <div
          style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 4,
          }}
        >
          {editing && (
            <span style={{ fontSize: 11.5, color: C.sub, marginRight: 6 }}>
              <i className="fas fa-pen mr-1" style={{ color: C.blue }} />
              {t("Editing record")} #{form.id}
            </span>
          )}
          <button
            type="button"
            className="btn btn-sm btn-primary px-4"
            onClick={handleSave}
            disabled={busy}
          >
            <i className="fa fa-save mr-1" />{" "}
            {busy ? t("Please wait...") : editing ? t("Update") : t("Save")}
          </button>
          {editing && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
              {t("New Record")}
            </button>
          )}
        </div>
      </Band>

      {/* ── The list ─────────────────────────────────────────────────────── */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: C.white, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
          <table className="table table-sm table-bordered mb-0" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ background: C.head, color: C.white }}>
                <th>{t("SN.")}</th>
                <th>{t("UHID")}</th>
                <th>{t("Prescription")}</th>
                <th>{t("EntryBy")}</th>
                <th>{t("EntryDate")}</th>
                <th>{t("UpdatedBy")}</th>
                <th>{t("UpdatedDate")}</th>
                <th>{t("Edit")}</th>
                <th>{t("Print")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: C.sub, padding: 14 }}>
                    {t("No brachytherapy plan recorded for this patient")}
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id} style={form.id === r.id ? { background: C.blueBg } : undefined}>
                  <td>{i + 1}</td>
                  <td>{patientID}</td>
                  <td>
                    {[r.dosePerFraction && `${r.dosePerFraction} cGy`, r.noOfFractions && `× ${r.noOfFractions}`]
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td>{r.entryByName}</td>
                  <td>{r.entryDate}</td>
                  <td>{r.updatedByName}</td>
                  <td>{r.updateDate}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span
                      role="button"
                      title={t("Edit")}
                      aria-label={`${t("Edit")} ${i + 1}`}
                      onClick={() => handleEdit(r)}
                      style={{ cursor: "pointer", color: C.blue, marginRight: 10 }}
                    >
                      <i className="fa fa-edit" />
                    </span>
                    <span
                      role="button"
                      title={t("Delete")}
                      aria-label={`${t("Delete")} ${i + 1}`}
                      onClick={() => handleDelete(r)}
                      style={{ cursor: "pointer", color: C.red }}
                    >
                      <i className="fa fa-trash" />
                    </span>
                  </td>
                  <td>
                    <span
                      role="button"
                      title={t("Print")}
                      aria-label={`${t("Print")} ${i + 1}`}
                      onClick={() => handlePrint(r)}
                      style={{ cursor: "pointer", color: C.blue }}
                    >
                      <i className="fa fa-print" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BrachytherapyPlanning;
