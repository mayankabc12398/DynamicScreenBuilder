import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import {
  DeleteImagingQA,
  GetImagingQA,
  SaveImagingQA,
} from "../../../networkServices/DoctorApi";

/* =============================================================================
   Imaging QA (Physicist) — the EMR form.

   Opened from the EMR form list on /ViewConsultation. The menu row lives in
   cpoe_menumaster with URL 'ImagingQA' (API repo,
   DBScripts/2026-09-29_imaging_qa.sql), and the EMR lazy-loads this file by that
   name, so the file name and that URL stay in step.

   Same shape as the Summary of Previous Radiotherapy and not the per-visit
   forms: a dated list per patient, one row per QA check, each edited on its own.
   A check belongs to the fraction it was taken on, and the physicist reads it
   against the whole course.

   The measurements are kept as typed. An axis nobody measured stays blank rather
   than becoming 0, which would read as "measured, no shift".
   ============================================================================= */

const C = {
  ink: "#12313a", sub: "#64757d", line: "#d9e4e8", soft: "#f5f9fa",
  blue: "#1667a8", blueBg: "#e8f2fa", head: "#1d6fa5",
  green: "#1b7f4f", red: "#b3261e", white: "#fff",
};

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  id: 0,
  qaDate: "",
  imagingMode: "",
  transX: "", transY: "", transZ: "",
  rotX: "", rotY: "", rotZ: "",
  remark: "",
};

/* The six axes, in the order the paper form reads them. */
const TRANSLATIONAL = [
  ["transX", "X"],
  ["transY", "Y"],
  ["transZ", "Z"],
];
const ROTATIONAL = [
  ["rotX", "X"],
  ["rotY", "Y"],
  ["rotZ", "Z"],
];

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
  qaDate: toDateInput(row?.qaDate ?? row?.QADate ?? row?.qADate),
  imagingMode: pick(row, "ImagingMode"),
  transX: pick(row, "TransX"),
  transY: pick(row, "TransY"),
  transZ: pick(row, "TransZ"),
  rotX: pick(row, "RotX"),
  rotY: pick(row, "RotY"),
  rotZ: pick(row, "RotZ"),
  remark: pick(row, "Remark"),
  status: pick(row, "Status") || "Done",
  checkedBy: pick(row, "CheckedBy").trim(),
});

/**
 * Empty string when the check can be saved, otherwise what is missing.
 *
 * A check with a date and nothing else records nothing, so at least one
 * measurement, the imaging mode or a remark is required. Individual axes stay
 * optional: the paper form's own rows leave CBCT/2D and whole axes blank.
 */
export const validateQA = (form) => {
  if (!asText(form?.qaDate).trim()) return "Date is required";
  const filled = [
    "imagingMode", "transX", "transY", "transZ",
    "rotX", "rotY", "rotZ", "remark",
  ].some((k) => asText(form?.[k]).trim() !== "");
  if (!filled) return "Enter at least one measurement";
  return "";
};

export const toPayload = (form, patientID, transactionID) => ({
  id: Number(form?.id ?? 0) || 0,
  patientID,
  transactionID,
  qaDate: asText(form?.qaDate).trim(),
  imagingMode: asText(form?.imagingMode).trim(),
  transX: asText(form?.transX).trim(),
  transY: asText(form?.transY).trim(),
  transZ: asText(form?.transZ).trim(),
  rotX: asText(form?.rotX).trim(),
  rotY: asText(form?.rotY).trim(),
  rotZ: asText(form?.rotZ).trim(),
  remark: asText(form?.remark).trim(),
});

const Band = ({ title, children, center }) => (
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
        textAlign: center ? "center" : "left",
      }}
    >
      {title}
    </div>
    <div style={{ padding: 12 }}>{children}</div>
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 4 }}>
    {children}
  </div>
);

function ImagingQA({ patientDetail }) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";
  const transactionID = patient?.TransactionID || "";

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  const [form, setForm] = useState({ ...EMPTY, qaDate: today() });
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── The patient's QA history ─────────────────────────────────────────────
  /* t is left out of the deps on purpose: react-i18next hands back a new
     function identity on every render, and depending on it turns this into a
     fetch-per-render loop. */
  const load = useCallback(async (from, to) => {
    if (!patientID) return;
    try {
      const res = await GetImagingQA(patientID, from || "", to || "");
      // "No record found" is a patient with no checks yet, not an error.
      const list = Array.isArray(res?.data) ? res.data : [];
      setRows(res?.success && list.length ? list.map(normaliseRow) : []);
    } catch (e) {
      notify(t("Failed to load the imaging QA records"), "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID]);

  /* Opens on the whole course — the From / To boxes start at today, but a
     physicist opening the screen wants every check, then narrows it. */
  useEffect(() => {
    load("", "");
  }, [load]);

  const handleSearch = () => load(fromDate, toDate);

  // ── Save / edit / delete ─────────────────────────────────────────────────
  const resetForm = () => setForm({ ...EMPTY, qaDate: today() });

  const handleSave = async () => {
    if (!patientID) {
      notify(t("No patient is loaded"), "error");
      return;
    }
    const problem = validateQA(form);
    if (problem) {
      notify(t(problem), "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await SaveImagingQA(toPayload(form, patientID, transactionID));
      if (res?.success) {
        notify(res?.message || t("Record saved successfully"), "success");
        resetForm();
        await load("", "");
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
      const res = await DeleteImagingQA(row.id, patientID);
      if (res?.success) {
        notify(res?.message || t("Record deleted successfully"), "success");
        if (form.id === row.id) resetForm();
        await load("", "");
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
  const esc = (v) =>
    asText(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

  const demographics = () =>
    [
      ["Patient", patient?.Pname || patient?.PatientName],
      ["UHID", patientID],
      ["Age / Sex", [patient?.Age, patient?.Gender || patient?.Sex].filter(Boolean).join(" / ")],
      ["Panel", patient?.PanelName],
      ["Doctor", patient?.DName],
      ["Visit no", patient?.TransNo || transactionID],
    ]
      .filter(([, v]) => asText(v).trim())
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
      .join("");

  const printDoc = (title, inner, landscape) => {
    const html =
      `<!DOCTYPE html><html><head><title>${esc(title)}</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `@page{size:A4${landscape ? " landscape" : ""};margin:12mm;}` +
      `body{font:11px/1.4 Arial,Helvetica,sans-serif;color:#12313a;}` +
      `h1{font-size:14px;text-align:center;}` +
      `.hosp{text-align:center;font-size:12px;font-weight:700;margin-bottom:2px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px 12px;border:1px solid #d9e4e8;` +
      `border-radius:5px;padding:7px 9px;margin:9px 0 12px;}` +
      `.demo div{font-size:10.5px;}.demo span{color:#64757d;display:inline-block;min-width:60px;}` +
      `h2{font-size:12px;margin:11px 0 4px;padding-bottom:3px;border-bottom:1px solid #d9e4e8;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `th,td{border:1px solid #d9e4e8;padding:3px 5px;text-align:left;font-size:10px;}` +
      `th{background:#eef5fa;}` +
      `.kv th{width:28%;background:none;border:none;color:#64757d;padding:3px 6px 3px 0;}` +
      `.kv td{border:none;padding:3px 0;}` +
      `.sign{margin-top:30px;display:flex;justify-content:space-between;font-size:10.5px;color:#64757d;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>${esc(title)}</h1>` +
      `<div class="demo">${demographics()}</div>` +
      inner +
      `<div class="sign"><span>Printed: ${esc(new Date().toLocaleString())}</span>` +
      `<span>Medical Physicist's signature</span></div>` +
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

  /* One check — the Print icon on a grid row. */
  const handlePrintRow = (row) => {
    const kv = [
      ["Date", row.qaDate],
      ["CBCT/2D", row.imagingMode],
      ["Translational X (cm)", row.transX],
      ["Translational Y (cm)", row.transY],
      ["Translational Z (cm)", row.transZ],
      ["Rotational X", row.rotX],
      ["Rotational Y", row.rotY],
      ["Rotational Z", row.rotZ],
      ["Remark", row.remark],
      ["Checked by", row.checkedBy],
      ["Status", row.status],
    ]
      .filter(([, v]) => asText(v).trim())
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join("");
    printDoc("Imaging QA (Physicist)", `<table class="kv">${kv}</table>`, false);
  };

  /* The list as it stands — the Report button beside the search. */
  const handleReport = () => {
    if (!rows.length) {
      notify(t("Nothing to report for this range"), "warn");
      return;
    }
    const head = [
      "S.No.", "Date", "CBCT/2D",
      "Translational-X", "Translational-Y", "Translational-Z",
      "Rotational-X", "Rotational-Y", "Rotational-Z",
      "Remark", "Checked by", "Status",
    ]
      .map((h) => `<th>${esc(h)}</th>`)
      .join("");
    const body = rows
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${esc(r.qaDate)}</td><td>${esc(r.imagingMode)}</td>` +
          `<td>${esc(r.transX)}</td><td>${esc(r.transY)}</td><td>${esc(r.transZ)}</td>` +
          `<td>${esc(r.rotX)}</td><td>${esc(r.rotY)}</td><td>${esc(r.rotZ)}</td>` +
          `<td>${esc(r.remark)}</td><td>${esc(r.checkedBy)}</td><td>${esc(r.status)}</td></tr>`,
      )
      .join("");
    printDoc(
      "Imaging QA Report",
      `<table><tr>${head}</tr>${body}</table>`,
      true, // twelve columns will not read on a portrait page
    );
  };

  // ── Field helpers ────────────────────────────────────────────────────────
  const text = (key) => (
    <input
      type="text"
      className="form-control form-control-sm"
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  );

  const axisRow = (axes) => (
    <div className="row">
      {axes.map(([key, label]) => (
        <div className="col-md-4 mb-2" key={key}>
          <Label>{label}</Label>
          {text(key)}
        </div>
      ))}
    </div>
  );

  const editing = form.id > 0;

  return (
    <div style={{ background: C.soft, padding: 12 }}>
      <Band title={t("IMAGING QA (PHYSICIST)")} center>
        <div style={{ textAlign: "center", marginBottom: 10, fontSize: 12, color: C.sub }}>
          {asText(patient?.Pname || patient?.PatientName)}
          {patientID ? ` · ${patientID}` : ""}
          {patient?.TransNo || transactionID
            ? ` · ${t("Visit")} ${patient?.TransNo || transactionID}`
            : ""}
        </div>

        <div className="row">
          <div className="col-md-6 mb-2">
            <Label>{t("Date")}</Label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={form.qaDate}
              onChange={(e) => set("qaDate", e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-2">
            <Label>{t("CBCT/2D")}</Label>
            {text("imagingMode")}
          </div>
        </div>
      </Band>

      <Band title={t("TRANSLATIONAL MOVEMENTS (CM)")}>{axisRow(TRANSLATIONAL)}</Band>

      <Band title={t("ROTATIONAL MOVEMENTS")}>
        {axisRow(ROTATIONAL)}
        <div className="row">
          <div className="col-md-12">
            <Label>{t("Remark")}</Label>
            {text("remark")}
          </div>
        </div>
      </Band>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
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
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          background: C.white,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div className="row align-items-end">
          <div className="col-md-4 mb-2">
            <Label>{t("From Date")}</Label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("To Date")}</Label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2" style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleSearch}>
              <i className="fa fa-search mr-1" /> {t("Search")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={handleReport}
            >
              <i className="fa fa-print mr-1" /> {t("Report")}
            </button>
            {/* The screen opens on the whole course, so there has to be a way back
                to it once a range has been applied. */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => load("", "")}
            >
              {t("All")}
            </button>
          </div>
        </div>
      </div>

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
                <th>{t("S.No.")}</th>
                <th>{t("DATE")}</th>
                <th>{t("CBCT/2D")}</th>
                <th>{t("Translational-X")}</th>
                <th>{t("Translational-Y")}</th>
                <th>{t("Translational-Z")}</th>
                <th>{t("Rotational-X")}</th>
                <th>{t("Rotational-Y")}</th>
                <th>{t("Rotational-Z")}</th>
                <th>{t("Remark")}</th>
                <th>{t("Checked By")}</th>
                <th>{t("Status")}</th>
                <th>{t("Edit")}</th>
                <th>{t("Print")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", color: C.sub, padding: 14 }}>
                    {t("No imaging QA recorded for this patient")}
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  style={form.id === r.id ? { background: C.blueBg } : undefined}
                >
                  <td>{i + 1}</td>
                  <td>{r.qaDate}</td>
                  <td>{r.imagingMode}</td>
                  <td>{r.transX}</td>
                  <td>{r.transY}</td>
                  <td>{r.transZ}</td>
                  <td>{r.rotX}</td>
                  <td>{r.rotY}</td>
                  <td>{r.rotZ}</td>
                  <td>{r.remark}</td>
                  <td>{r.checkedBy}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: C.green,
                        color: C.white,
                        fontWeight: 600,
                        padding: "3px 8px",
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
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
                      onClick={() => handlePrintRow(r)}
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

export default ImagingQA;
