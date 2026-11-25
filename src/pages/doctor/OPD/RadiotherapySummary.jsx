import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import {
  DeleteRadiotherapySummary,
  GetRadiotherapyOptions,
  GetRadiotherapySummary,
  SaveRadiotherapyOption,
  SaveRadiotherapySummary,
} from "../../../networkServices/DoctorApi";

/* =============================================================================
   Summary of Previous Radiotherapy — the EMR form.

   Opened from the EMR form list on /ViewConsultation. The menu row lives in
   cpoe_menumaster with URL 'RadiotherapySummary' (API repo,
   DBScripts/2026-09-29_radiotherapy_summary.sql), and the EMR lazy-loads this
   file by that name, so the file name and that URL stay in step.

   NOT the same save shape as the other oncology forms. Those are one form per
   visit, superseded on every save. This is a LIST of dated treatment records
   that grows across the whole course — the paper form shows 10-Aug to 20-Aug on
   one patient — so Save writes ONE record and leaves the rest of the history
   alone, and the grid's Edit icon loads a record back into the form.

   It also reads by PATIENT, not by visit: "previous radiotherapy" means every
   fraction already delivered, whichever visit recorded it.
   ============================================================================= */

const C = {
  ink: "#12313a", sub: "#64757d", line: "#d9e4e8", soft: "#f5f9fa",
  blue: "#1667a8", blueBg: "#e8f2fa", head: "#1d6fa5",
  red: "#b3261e", white: "#fff",
};

/* Used until radiotherapy_option_master is seeded, and if the lookup fails — the
   screen stays usable either way. Same vocabulary as the Radiotherapy
   Prescription form. */
const FALLBACK_SITES = [
  "Brain", "Head & Neck", "Breast", "Chest / Lung", "Oesophagus", "Abdomen",
  "Pelvis", "Spine", "Extremity", "Whole Body",
];
const FALLBACK_TECHNIQUES = [
  "2D Conventional", "3D CRT", "IMRT", "VMAT", "SRS", "SBRT", "Electron",
  "Brachytherapy",
];

/* The eight SET dose boxes. The old screen labelled its entry boxes 1..8 but its
   grid "SET Dose, SET Dose 1..7" — one behind — so a value typed in "SET Dose 3"
   read back under "SET Dose 2". Both are numbered 1..8 here. */
const SET_DOSE_KEYS = [
  "setDose1", "setDose2", "setDose3", "setDose4",
  "setDose5", "setDose6", "setDose7", "setDose8",
];

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  id: 0,
  treatmentDate: "",
  areaTreated: "",
  tumorDoseFractionation: "",
  trtdBy: "",
  ckdBy: "",
  cumGD: "",
  treatmentSite: "",
  techniques: "",
  setDose1: "", setDose2: "", setDose3: "", setDose4: "",
  setDose5: "", setDose6: "", setDose7: "", setDose8: "",
};

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

/* Dapper answers in camelCase, older wrappers in PascalCase — take whichever
   arrived rather than betting on one. */
const pick = (row, name) =>
  asText(row?.[name[0].toLowerCase() + name.slice(1)] ?? row?.[name] ?? "");

/* "2026-08-10T00:00:00" -> "2026-08-10", which is what a date input wants. */
export const toDateInput = (value) => {
  const s = asText(value).trim();
  if (!s) return "";
  return s.length >= 10 ? s.slice(0, 10) : s;
};

export const normaliseRow = (row) => ({
  id: Number(row?.id ?? row?.ID ?? 0) || 0,
  treatmentDate: toDateInput(row?.treatmentDate ?? row?.TreatmentDate),
  areaTreated: pick(row, "AreaTreated"),
  tumorDoseFractionation: pick(row, "TumorDoseFractionation"),
  trtdBy: asText(row?.trtdBy ?? row?.TRTDBy ?? row?.trtdby ?? ""),
  ckdBy: asText(row?.ckdBy ?? row?.CKDBy ?? row?.ckdby ?? ""),
  cumGD: asText(row?.cumGD ?? row?.CumGD ?? row?.cumGd ?? ""),
  treatmentSite: pick(row, "TreatmentSite"),
  techniques: pick(row, "Techniques"),
  setDose1: pick(row, "SetDose1"),
  setDose2: pick(row, "SetDose2"),
  setDose3: pick(row, "SetDose3"),
  setDose4: pick(row, "SetDose4"),
  setDose5: pick(row, "SetDose5"),
  setDose6: pick(row, "SetDose6"),
  setDose7: pick(row, "SetDose7"),
  setDose8: pick(row, "SetDose8"),
});

/**
 * The cumulative given dose the next record starts from: the running total plus
 * this record's tumour dose.
 *
 * Only when the dose is a plain number. The column is free text on purpose (the
 * paper form carries "180 x 5" and "2 Gy/#" as well as "180"), and guessing a
 * total out of that is worse than leaving it to the clinician — this is a
 * prefill, and the field stays editable.
 */
export const nextCum = (lastCum, dose) => {
  const d = Number(asText(dose).trim());
  if (!asText(dose).trim() || !Number.isFinite(d)) return "";
  const base = Number(asText(lastCum).trim());
  const start = Number.isFinite(base) ? base : 0;
  const total = start + d;
  // Avoid 539.9999999999999 on decimal fraction doses.
  return String(Math.round(total * 1000) / 1000);
};

/**
 * Empty string when the record can be saved, otherwise what is missing.
 *
 * A dose with nothing to attach it to is not a record, so one of area treated /
 * treatment site is required. The dose boxes themselves are optional: records
 * copied from another centre's summary are often partial.
 */
export const validateEntry = (form) => {
  if (!asText(form?.treatmentDate).trim()) return "Date is required";
  if (!asText(form?.areaTreated).trim() && !asText(form?.treatmentSite).trim())
    return "Area treated or treatment site is required";
  return "";
};

export const toPayload = (form, patientID, transactionID) => ({
  id: Number(form?.id ?? 0) || 0,
  patientID,
  transactionID,
  treatmentDate: asText(form?.treatmentDate).trim(),
  areaTreated: asText(form?.areaTreated).trim(),
  tumorDoseFractionation: asText(form?.tumorDoseFractionation).trim(),
  trtdBy: asText(form?.trtdBy).trim(),
  ckdBy: asText(form?.ckdBy).trim(),
  cumGD: asText(form?.cumGD).trim(),
  treatmentSite: asText(form?.treatmentSite).trim(),
  techniques: asText(form?.techniques).trim(),
  setDose1: asText(form?.setDose1).trim(),
  setDose2: asText(form?.setDose2).trim(),
  setDose3: asText(form?.setDose3).trim(),
  setDose4: asText(form?.setDose4).trim(),
  setDose5: asText(form?.setDose5).trim(),
  setDose6: asText(form?.setDose6).trim(),
  setDose7: asText(form?.setDose7).trim(),
  setDose8: asText(form?.setDose8).trim(),
});

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
        background: C.head,
        color: C.white,
        padding: "6px 12px",
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: 0.3,
        textAlign: "center",
      }}
    >
      {title}
    </div>
    <div style={{ padding: 12 }}>{children}</div>
  </div>
);

function RadiotherapySummary({ patientDetail }) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";
  const transactionID = patient?.TransactionID || "";

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  const [form, setForm] = useState({ ...EMPTY, treatmentDate: today() });
  const [rows, setRows] = useState([]);
  const [sites, setSites] = useState(FALLBACK_SITES);
  const [techniques, setTechniques] = useState(FALLBACK_TECHNIQUES);
  const [newSite, setNewSite] = useState(null); // null = the New box is closed
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── The patient's history ────────────────────────────────────────────────
  /* t is left out of the deps on purpose: react-i18next hands back a new
     function identity on every render, and depending on it turns this into a
     fetch-per-render loop. */
  const loadRows = useCallback(async () => {
    if (!patientID) return;
    try {
      const res = await GetRadiotherapySummary(patientID);
      // "No record found" is a patient with no history yet, not an error.
      const list = Array.isArray(res?.data) ? res.data : [];
      setRows(res?.success && list.length ? list.map(normaliseRow) : []);
    } catch (e) {
      notify(t("Failed to load the radiotherapy history"), "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // ── The two dropdowns: one call, on mount ────────────────────────────────
  const loadOptions = useCallback(async () => {
    try {
      const res = await GetRadiotherapyOptions();
      const list = Array.isArray(res?.data) ? res.data : [];
      if (!res?.success || !list.length) return; // keep the fallbacks
      const named = (type) =>
        list
          .filter(
            (o) =>
              asText(o?.optionType ?? o?.OptionType).toUpperCase() === type,
          )
          .map((o) => asText(o?.optionName ?? o?.OptionName))
          .filter(Boolean);
      const s = named("SITE");
      const q = named("TECHNIQUE");
      if (s.length) setSites(s);
      if (q.length) setTechniques(q);
    } catch (e) {
      /* The fallback lists are already on screen; a master that cannot be read
         must not stop a clinician recording a fraction. */
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // ── CUM G.D prefill ──────────────────────────────────────────────────────
  /* The running total the next record continues from: the last dated record's
     CUM G.D, ignoring the record currently being edited. */
  const lastCum = useMemo(() => {
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      if (form.id && rows[i].id === form.id) continue;
      const v = asText(rows[i]?.cumGD).trim();
      if (v && Number.isFinite(Number(v))) return v;
    }
    return "";
  }, [rows, form.id]);

  /* What this field last prefilled. If the clinician has typed over it we leave
     their value alone; if it is still ours, a changed dose updates it. */
  const prefilledCum = useRef("");

  const handleDoseChange = (value) => {
    const suggestion = nextCum(lastCum, value);
    setForm((f) => {
      const typedOver =
        asText(f.cumGD).trim() !== "" && f.cumGD !== prefilledCum.current;
      // Editing an existing record: its CUM G.D is history, not a prediction.
      const keep = f.id > 0 || typedOver;
      return {
        ...f,
        tumorDoseFractionation: value,
        cumGD: keep ? f.cumGD : suggestion,
      };
    });
    prefilledCum.current = suggestion;
  };

  // ── Save / edit / delete ─────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ ...EMPTY, treatmentDate: today() });
    prefilledCum.current = "";
  };

  const handleSave = async () => {
    if (!patientID) {
      notify(t("No patient is loaded"), "error");
      return;
    }
    const problem = validateEntry(form);
    if (problem) {
      notify(t(problem), "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await SaveRadiotherapySummary(
        toPayload(form, patientID, transactionID),
      );
      if (res?.success) {
        notify(res?.message || t("Record saved successfully"), "success");
        resetForm();
        await loadRows();
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
    setForm({ ...EMPTY, ...row });
    prefilledCum.current = "";
    // Bring the form back into view. Cosmetic, and not worth an exception in a
    // host that does not implement it.
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
      const res = await DeleteRadiotherapySummary(row.id, patientID);
      if (res?.success) {
        notify(res?.message || t("Record deleted successfully"), "success");
        if (form.id === row.id) resetForm();
        await loadRows();
      } else {
        notify(res?.message || t("Failed to delete record"), "error");
      }
    } catch (e) {
      notify(t("Failed to delete record"), "error");
    } finally {
      setBusy(false);
    }
  };

  // ── "New" beside Treatment Site ──────────────────────────────────────────
  const handleAddSite = async () => {
    const name = asText(newSite).trim();
    if (!name) {
      notify(t("Enter the treatment site"), "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await SaveRadiotherapyOption("SITE", name);
      if (res?.success) {
        // Show it straight away rather than re-reading the master for one name.
        setSites((list) => (list.includes(name) ? list : [...list, name]));
        set("treatmentSite", name);
        setNewSite(null);
        notify(t("Treatment site added"), "success");
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
      asText(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

    const head =
      ["#", "Date", "Area treated", "Tumor dose / fractionation", "TRTD by",
       "CKD by", "CUM G.D", "Treatment site", "Techniques"]
        .map((h) => `<th>${esc(h)}</th>`)
        .join("") +
      SET_DOSE_KEYS.map((_, i) => `<th>SET ${i + 1}</th>`).join("");

    const body = rows
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${esc(r.treatmentDate)}</td><td>${esc(r.areaTreated)}</td>` +
          `<td>${esc(r.tumorDoseFractionation)}</td><td>${esc(r.trtdBy)}</td>` +
          `<td>${esc(r.ckdBy)}</td><td>${esc(r.cumGD)}</td><td>${esc(r.treatmentSite)}</td>` +
          `<td>${esc(r.techniques)}</td>` +
          SET_DOSE_KEYS.map((k) => `<td>${esc(r[k])}</td>`).join("") +
          `</tr>`,
      )
      .join("");

    const demo = [
      ["Patient", patient?.Pname || patient?.PatientName],
      ["UHID", patientID],
      ["Age / Sex", [patient?.Age, patient?.Gender || patient?.Sex].filter(Boolean).join(" / ")],
      ["Panel", patient?.PanelName],
      ["Doctor", patient?.DName],
      ["Visit date", patient?.AppointmentDate],
      ["Visit no", patient?.TransNo || transactionID],
      ["Records", rows.length],
    ]
      .filter(([, v]) => asText(v).trim())
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
      .join("");

    const html =
      `<!DOCTYPE html><html><head><title>Summary of Previous Radiotherapy</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      // Landscape: seventeen columns will not read on a portrait page.
      `@page{size:A4 landscape;margin:10mm;}` +
      `body{font:10.5px/1.35 Arial,Helvetica,sans-serif;color:#12313a;}` +
      `h1{font-size:14px;text-align:center;}` +
      `.hosp{text-align:center;font-size:12px;font-weight:700;margin-bottom:2px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:3px 12px;border:1px solid #d9e4e8;` +
      `border-radius:5px;padding:7px 9px;margin:8px 0 10px;}` +
      `.demo div{font-size:10px;}.demo span{color:#64757d;display:inline-block;min-width:58px;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `th,td{border:1px solid #d9e4e8;padding:3px 4px;text-align:left;font-size:9.5px;}` +
      `th{background:#eef5fa;}` +
      `.sign{margin-top:26px;display:flex;justify-content:space-between;font-size:10px;color:#64757d;}` +
      `.none{padding:14px;text-align:center;color:#64757d;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>Summary of Previous Radiotherapy</h1>` +
      `<div class="demo">${demo}</div>` +
      (rows.length
        ? `<table><tr>${head}</tr>${body}</table>`
        : `<div class="none">No radiotherapy recorded for this patient.</div>`) +
      `<div class="sign"><span>Printed: ${esc(new Date().toLocaleString())}</span>` +
      `<span>Radiation Oncologist's signature</span></div>` +
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
      placeholder={placeholder || ""}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  );

  const select = (key, options) => (
    <select
      className="form-control form-control-sm"
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    >
      <option value="">{t("Select")}</option>
      {/* A value saved before the master held it still shows, instead of the
          dropdown silently falling back to "Select" and losing it on save. */}
      {(options.includes(form[key]) || !form[key]
        ? options
        : [...options, form[key]]
      ).map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );

  const editing = form.id > 0;

  return (
    <div style={{ background: C.soft, padding: 12 }}>
      <Band title={t("Summary of Previous Radiotherapy")}>
        <div style={{ textAlign: "center", marginBottom: 10, fontSize: 12, color: C.sub }}>
          {asText(patient?.Pname || patient?.PatientName)}
          {patientID ? ` · ${patientID}` : ""}
          {patient?.TransNo || transactionID
            ? ` · ${t("Visit")} ${patient?.TransNo || transactionID}`
            : ""}
        </div>

        <div className="row">
          <div className="col-md-4 mb-2">
            <Label>{t("Area Treated")}</Label>
            {text("areaTreated")}
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("Tumor Dose/Fractionation")}</Label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={form.tumorDoseFractionation}
              onChange={(e) => handleDoseChange(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("Date")}</Label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={form.treatmentDate}
              onChange={(e) => set("treatmentDate", e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-2">
            <Label>{t("TRTD BY")}</Label>
            {text("trtdBy")}
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("CKD BY")}</Label>
            {text("ckdBy")}
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("CUM G.D")}</Label>
            {text("cumGD")}
            {!editing && lastCum ? (
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 3 }}>
                {t("Running total so far")}: {lastCum}
              </div>
            ) : null}
          </div>

          <div className="col-md-4 mb-2">
            <Label>{t("Treatment Site")}</Label>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>{select("treatmentSite", sites)}</div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{ whiteSpace: "nowrap" }}
                onClick={() => setNewSite(newSite === null ? "" : null)}
              >
                {t("New")}
              </button>
            </div>
            {newSite !== null && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder={t("New treatment site")}
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleAddSite}
                  disabled={busy}
                >
                  {t("Add")}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setNewSite(null)}
                >
                  {t("Cancel")}
                </button>
              </div>
            )}
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("Techniques")}</Label>
            {select("techniques", techniques)}
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("SET Dose")} 1</Label>
            {text("setDose1")}
          </div>

          {SET_DOSE_KEYS.slice(1).map((key, i) => (
            <div className="col-md-4 mb-2" key={key}>
              <Label>
                {t("SET Dose")} {i + 2}
              </Label>
              {text(key)}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
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
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={resetForm}
            >
              {t("New Record")}
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handlePrint}
          >
            <i className="fa fa-print mr-1" /> {t("Print")}
          </button>
        </div>
      </Band>

      {/* ── The history ──────────────────────────────────────────────────── */}
      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          background: C.white,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
          <table
            className="table table-sm table-bordered mb-0"
            style={{ fontSize: 11.5, whiteSpace: "nowrap" }}
          >
            <thead>
              <tr style={{ background: C.head, color: C.white }}>
                <th>{t("SN")}</th>
                <th>{t("Date")}</th>
                <th>{t("Area Treated")}</th>
                <th>{t("Tumor Dose/Fractionation")}</th>
                <th>{t("TRTD BY")}</th>
                <th>{t("CKD BY")}</th>
                <th>{t("CUM G.D")}</th>
                <th>{t("Treatment Site")}</th>
                <th>{t("Techniques")}</th>
                {SET_DOSE_KEYS.map((key, i) => (
                  <th key={key}>
                    {t("SET Dose")} {i + 1}
                  </th>
                ))}
                <th>{t("Edit")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={18} style={{ textAlign: "center", color: C.sub, padding: 14 }}>
                    {t("No radiotherapy recorded for this patient")}
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  style={form.id === r.id ? { background: C.blueBg } : undefined}
                >
                  <td>{i + 1}</td>
                  <td>{r.treatmentDate}</td>
                  <td>{r.areaTreated}</td>
                  <td>{r.tumorDoseFractionation}</td>
                  <td>{r.trtdBy}</td>
                  <td>{r.ckdBy}</td>
                  <td>{r.cumGD}</td>
                  <td>{r.treatmentSite}</td>
                  <td>{r.techniques}</td>
                  {SET_DOSE_KEYS.map((key) => (
                    <td key={key}>{r[key]}</td>
                  ))}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RadiotherapySummary;
