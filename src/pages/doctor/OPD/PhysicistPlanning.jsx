import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import {
  ApprovePhysicistPlanning,
  DeletePhysicistPlanning,
  GetPhysicistPlanning,
  GetRadiotherapyOptions,
  SavePhysicistPlanning,
} from "../../../networkServices/DoctorApi";

/* =============================================================================
   Physicists Planning — the EMR form.

   Opened from the EMR form list on /ViewConsultation. The menu row lives in
   cpoe_menumaster with URL 'PhysicistPlanning' (API repo,
   DBScripts/2026-09-29_physicist_planning.sql), and the EMR lazy-loads this file
   by that name, so the file name and that URL stay in step.

   A plan is a header (remarks, bolus, treatment site, specific plan) over a grid
   of beams — fourteen columns each — and a patient has a LIST of plans, each
   saved on its own. Save writes one plan and replaces its beams as a set. The
   list's Approve freezes a plan: the API refuses further saves and the screen
   opens it read-only.

   Beams are entered in the grid itself: "Add" appends a row with the beam number
   and the treatment site filled in, and every cell is an input.
   ============================================================================= */

const C = {
  ink: "#12313a", sub: "#64757d", line: "#d9e4e8", soft: "#f5f9fa",
  blue: "#1667a8", blueBg: "#e8f2fa", head: "#1d6fa5",
  green: "#1b7f4f", amber: "#8a6100", red: "#b3261e", white: "#fff",
};

/* Used until radiotherapy_option_master is seeded, and if the lookup fails. */
const FALLBACK_SITES = [
  "Brain", "Head & Neck", "Breast", "Chest / Lung", "Oesophagus", "Abdomen",
  "Pelvis", "Spine", "Extremity", "Whole Body",
];

const BEAM_TYPES = ["Photons", "Electron"];

/* The grid's columns, in the paper form's order. `w` is a hint for the input
   width so fourteen of them fit on one row. */
export const BEAM_COLUMNS = [
  ["beamNo", "Beam No.", 60],
  ["site", "Site", 110],
  ["fieldSize", "Field Size", 80],
  ["x1y1", "X1 | Y1", 80],
  ["x2y2", "X2 | Y2", 80],
  ["electronApplicator", "Electron Applicator", 100],
  ["wedge", "Wedge", 80],
  ["monitorUnits", "No. of Monitor Unit(MU)", 80],
  ["gantryAngle", "Gantry Angle", 70],
  ["collimatorAngle", "Collimator Angle", 80],
  ["couchAngle", "Couch Angle", 70],
  ["fsd", "FSD", 70],
  ["orientation", "Orientation", 90],
  ["beamType", "Electron/Photons", 90],
];

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

const pick = (row, name) =>
  asText(row?.[name[0].toLowerCase() + name.slice(1)] ?? row?.[name] ?? "");

export const EMPTY_BEAM = Object.fromEntries(BEAM_COLUMNS.map(([k]) => [k, ""]));

const EMPTY_PLAN = {
  id: 0,
  remarks: "",
  bolus: "", // "1" | "0" | ""
  bolusText: "",
  treatmentSite: "",
  specificPlan: "",
  isApproved: 0,
};

export const normaliseBeam = (row) => ({
  beamNo: pick(row, "BeamNo"),
  site: pick(row, "Site"),
  fieldSize: pick(row, "FieldSize"),
  x1y1: asText(row?.x1Y1 ?? row?.X1Y1 ?? row?.x1y1 ?? ""),
  x2y2: asText(row?.x2Y2 ?? row?.X2Y2 ?? row?.x2y2 ?? ""),
  electronApplicator: pick(row, "ElectronApplicator"),
  wedge: pick(row, "Wedge"),
  monitorUnits: pick(row, "MonitorUnits"),
  gantryAngle: pick(row, "GantryAngle"),
  collimatorAngle: pick(row, "CollimatorAngle"),
  couchAngle: pick(row, "CouchAngle"),
  fsd: asText(row?.fsd ?? row?.FSD ?? row?.fSD ?? ""),
  orientation: pick(row, "Orientation"),
  beamType: pick(row, "BeamType"),
});

export const normalisePlan = (row) => {
  const bolusRaw = row?.bolus ?? row?.Bolus;
  return {
    id: Number(row?.id ?? row?.ID ?? 0) || 0,
    remarks: pick(row, "Remarks"),
    bolus: bolusRaw === null || bolusRaw === undefined || bolusRaw === "" ? "" : String(Number(bolusRaw)),
    bolusText: pick(row, "BolusText"),
    treatmentSite: pick(row, "TreatmentSite"),
    specificPlan: pick(row, "SpecificPlan"),
    isApproved: Number(row?.isApproved ?? row?.IsApproved ?? 0) || 0,
    approvedByName: pick(row, "ApprovedByName").trim(),
    inputPreparedBy: pick(row, "InputPreparedBy").trim(),
    calculatedBy: pick(row, "CalculatedBy").trim(),
    beams: (Array.isArray(row?.beams) ? row.beams : Array.isArray(row?.Beams) ? row.Beams : [])
      .map(normaliseBeam),
  };
};

/* A beam row that has nothing typed in it is noise, not a beam. */
export const beamHasContent = (b) =>
  BEAM_COLUMNS.some(([k]) => asText(b?.[k]).trim() !== "");

/**
 * Empty string when the plan can be saved, otherwise what is missing. A plan
 * without a beam is not a plan; everything else on the header is optional
 * because the physicist may record the beams before the remarks are known.
 */
export const validatePlan = (plan, beams) => {
  if (!(beams || []).some(beamHasContent)) return "Add at least one beam";
  return "";
};

export const toPayload = (plan, beams, patientID, transactionID) => ({
  id: Number(plan?.id ?? 0) || 0,
  patientID,
  transactionID,
  remarks: asText(plan?.remarks).trim(),
  bolus: asText(plan?.bolus),
  bolusText: plan?.bolus === "1" ? asText(plan?.bolusText).trim() : "",
  treatmentSite: asText(plan?.treatmentSite).trim(),
  specificPlan: asText(plan?.specificPlan).trim(),
  beams: (beams || []).filter(beamHasContent).map((b) => ({
    beamNo: asText(b.beamNo).trim(),
    site: asText(b.site).trim(),
    fieldSize: asText(b.fieldSize).trim(),
    x1y1: asText(b.x1y1).trim(),
    x2y2: asText(b.x2y2).trim(),
    electronApplicator: asText(b.electronApplicator).trim(),
    wedge: asText(b.wedge).trim(),
    monitorUnits: asText(b.monitorUnits).trim(),
    gantryAngle: asText(b.gantryAngle).trim(),
    collimatorAngle: asText(b.collimatorAngle).trim(),
    couchAngle: asText(b.couchAngle).trim(),
    fsd: asText(b.fsd).trim(),
    orientation: asText(b.orientation).trim(),
    beamType: asText(b.beamType).trim(),
  })),
});

/* The next beam number: one past the highest numeric beam number so far. */
export const nextBeamNo = (beams) => {
  const max = (beams || []).reduce((m, b) => {
    const n = Number(asText(b?.beamNo).trim());
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return String(max + 1);
};

const Label = ({ children }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 4 }}>
    {children}
  </div>
);

const Band = ({ title, children, center }) => (
  <div
    style={{
      border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 12,
      overflow: "hidden", background: C.white,
    }}
  >
    <div
      style={{
        background: C.head, color: C.white, padding: "6px 12px", fontSize: 12.5,
        fontWeight: 700, letterSpacing: 0.3, textAlign: center ? "center" : "left",
      }}
    >
      {title}
    </div>
    <div style={{ padding: 12 }}>{children}</div>
  </div>
);

function PhysicistPlanning({ patientDetail }) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";
  const transactionID = patient?.TransactionID || "";

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  const [plan, setPlan] = useState({ ...EMPTY_PLAN });
  const [beams, setBeams] = useState([]);
  const [beamNoDraft, setBeamNoDraft] = useState("");
  const [plans, setPlans] = useState([]);
  const [sites, setSites] = useState(FALLBACK_SITES);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setPlan((p) => ({ ...p, [k]: v }));
  const readOnly = plan.isApproved === 1;

  // ── The patient's plans ──────────────────────────────────────────────────
  /* t is left out of the deps on purpose: react-i18next hands back a new
     function identity on every render, and depending on it turns this into a
     fetch-per-render loop. */
  const loadPlans = useCallback(async () => {
    if (!patientID) return;
    try {
      const res = await GetPhysicistPlanning(patientID);
      // "No record found" is a patient with no plan yet, not an error.
      const list = Array.isArray(res?.data) ? res.data : [];
      setPlans(res?.success && list.length ? list.map(normalisePlan) : []);
    } catch (e) {
      notify(t("Failed to load the physicist plans"), "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // ── Treatment sites: the radiotherapy site master, one call on mount ─────
  const loadSites = useCallback(async () => {
    try {
      const res = await GetRadiotherapyOptions("SITE");
      const list = Array.isArray(res?.data) ? res.data : [];
      if (!res?.success || !list.length) return; // keep the fallback
      const names = list
        .map((o) => asText(o?.optionName ?? o?.OptionName))
        .filter(Boolean);
      if (names.length) setSites(names);
    } catch (e) {
      /* The fallback list is already on screen. */
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // ── Beams ────────────────────────────────────────────────────────────────
  const handleAddBeam = () => {
    if (readOnly) return;
    const beamNo = asText(beamNoDraft).trim() || nextBeamNo(beams);
    setBeams((rows) => [
      ...rows,
      { ...EMPTY_BEAM, beamNo, site: plan.treatmentSite },
    ]);
    setBeamNoDraft("");
  };

  const setBeamField = (i, key, value) =>
    setBeams((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const removeBeam = (i) => setBeams((rows) => rows.filter((_, idx) => idx !== i));

  // ── Save / edit / approve / delete ───────────────────────────────────────
  const resetForm = () => {
    setPlan({ ...EMPTY_PLAN });
    setBeams([]);
    setBeamNoDraft("");
  };

  const handleSave = async () => {
    if (!patientID) {
      notify(t("No patient is loaded"), "error");
      return;
    }
    if (readOnly) {
      notify(t("This plan is approved and can no longer be changed"), "warn");
      return;
    }
    const problem = validatePlan(plan, beams);
    if (problem) {
      notify(t(problem), "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await SavePhysicistPlanning(toPayload(plan, beams, patientID, transactionID));
      if (res?.success) {
        notify(res?.message || t("Record saved successfully"), "success");
        resetForm();
        await loadPlans();
      } else {
        notify(res?.message || t("Failed to save record"), "error");
      }
    } catch (e) {
      notify(t("Failed to save record"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (p) => {
    setPlan({
      id: p.id, remarks: p.remarks, bolus: p.bolus, bolusText: p.bolusText,
      treatmentSite: p.treatmentSite, specificPlan: p.specificPlan,
      isApproved: p.isApproved,
    });
    setBeams(p.beams.map((b) => ({ ...EMPTY_BEAM, ...b })));
    try {
      window?.scrollTo?.({ top: 0, behavior: "smooth" });
    } catch (_) {
      /* ignored */
    }
  };

  const handleApprove = async (p) => {
    if (!p?.id || p.isApproved) return;
    setBusy(true);
    try {
      const res = await ApprovePhysicistPlanning(p.id, patientID);
      if (res?.success) {
        notify(res?.message || t("Plan approved"), "success");
        if (plan.id === p.id) resetForm();
        await loadPlans();
      } else {
        notify(res?.message || t("Failed to approve the plan"), "error");
      }
    } catch (e) {
      notify(t("Failed to approve the plan"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (p) => {
    if (!p?.id || p.isApproved) return;
    setBusy(true);
    try {
      const res = await DeletePhysicistPlanning(p.id, patientID);
      if (res?.success) {
        notify(res?.message || t("Record deleted successfully"), "success");
        if (plan.id === p.id) resetForm();
        await loadPlans();
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
  const handlePrint = (p) => {
    const esc = (v) =>
      asText(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

    const kv = [
      ["Treatment site", p.treatmentSite],
      ["Specific plan", p.specificPlan],
      ["Bolus", p.bolus === "1" ? `Yes${p.bolusText ? ` — ${p.bolusText}` : ""}` : p.bolus === "0" ? "No" : ""],
      ["Remarks", p.remarks],
      ["Input prepared", p.inputPreparedBy],
      ["Calculated by", p.calculatedBy],
      ["Status", p.isApproved ? `Approved${p.approvedByName ? ` by ${p.approvedByName}` : ""}` : "Not approved"],
    ]
      .filter(([, v]) => asText(v).trim())
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join("");

    const head = BEAM_COLUMNS.map(([, label]) => `<th>${esc(label)}</th>`).join("");
    const body = p.beams
      .map((b) => `<tr>${BEAM_COLUMNS.map(([k]) => `<td>${esc(b[k])}</td>`).join("")}</tr>`)
      .join("");

    const demo = [
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

    const html =
      `<!DOCTYPE html><html><head><title>Physicists Planning</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      // Landscape: fourteen beam columns will not read on a portrait page.
      `@page{size:A4 landscape;margin:10mm;}` +
      `body{font:10.5px/1.35 Arial,Helvetica,sans-serif;color:#12313a;}` +
      `h1{font-size:14px;text-align:center;}` +
      `.hosp{text-align:center;font-size:12px;font-weight:700;margin-bottom:2px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px 12px;border:1px solid #d9e4e8;` +
      `border-radius:5px;padding:7px 9px;margin:8px 0 10px;}` +
      `.demo div{font-size:10px;}.demo span{color:#64757d;display:inline-block;min-width:58px;}` +
      `h2{font-size:12px;margin:10px 0 4px;padding-bottom:3px;border-bottom:1px solid #d9e4e8;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `th,td{border:1px solid #d9e4e8;padding:3px 4px;text-align:left;font-size:9.5px;}` +
      `th{background:#eef5fa;}` +
      `.kv th{width:22%;background:none;border:none;color:#64757d;padding:3px 6px 3px 0;}` +
      `.kv td{border:none;padding:3px 0;}` +
      `.sign{margin-top:26px;display:flex;justify-content:space-between;font-size:10px;color:#64757d;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>Physicists Planning</h1>` +
      `<div class="demo">${demo}</div>` +
      `<table class="kv">${kv}</table>` +
      `<h2>Beam details</h2><table><tr>${head}</tr>${body}</table>` +
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

  // ── Render ───────────────────────────────────────────────────────────────
  const cell = (i, key, width) =>
    key === "beamType" ? (
      <select
        className="form-control form-control-sm"
        style={{ minWidth: width }}
        value={beams[i][key]}
        disabled={readOnly}
        onChange={(e) => setBeamField(i, key, e.target.value)}
      >
        <option value="">{t("Select")}</option>
        {BEAM_TYPES.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    ) : (
      <input
        type="text"
        className="form-control form-control-sm"
        style={{ minWidth: width }}
        aria-label={`${BEAM_COLUMNS.find(([k]) => k === key)?.[1]} ${i + 1}`}
        value={beams[i][key]}
        disabled={readOnly}
        onChange={(e) => setBeamField(i, key, e.target.value)}
      />
    );

  return (
    <div style={{ background: C.soft, padding: 12 }}>
      <Band title={t("Physicists Planning")} center>
        <div style={{ textAlign: "center", marginBottom: 10, fontSize: 12, color: C.sub }}>
          {asText(patient?.Pname || patient?.PatientName)}
          {patientID ? ` · ${patientID}` : ""}
          {patient?.TransNo || transactionID
            ? ` · ${t("Visit")} ${patient?.TransNo || transactionID}`
            : ""}
        </div>

        {readOnly && (
          <div
            style={{
              background: "#fdf6e3", border: "1px solid #efe0b8", color: C.amber,
              borderRadius: 6, padding: "7px 10px", fontSize: 11.5, marginBottom: 12,
            }}
          >
            <i className="fa fa-lock mr-1" />
            {t("This plan is approved and is shown read-only.")}
          </div>
        )}

        <div className="row">
          <div className="col-md-12 mb-2">
            <Label>{t("Remarks")}</Label>
            <textarea
              className="form-control form-control-sm"
              rows={3}
              value={plan.remarks}
              disabled={readOnly}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("Bolus")}</Label>
            <div style={{ display: "flex", gap: 16 }}>
              {[["1", "Yes"], ["0", "No"]].map(([v, label]) => (
                <label
                  key={v}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: 12.5,
                    color: C.ink, marginBottom: 0, cursor: readOnly ? "default" : "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="bolus"
                    checked={plan.bolus === v}
                    disabled={readOnly}
                    onChange={() => set("bolus", v)}
                  />
                  {t(label)}
                </label>
              ))}
            </div>
          </div>
          {plan.bolus === "1" && (
            <div className="col-md-8 mb-2">
              <Label>{t("Bolus details")}</Label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={t("thickness, material")}
                value={plan.bolusText}
                disabled={readOnly}
                onChange={(e) => set("bolusText", e.target.value)}
              />
            </div>
          )}
        </div>
      </Band>

      <Band title={t("Beam Config")}>
        <div className="row align-items-end">
          <div className="col-md-4 mb-2">
            <Label>{t("Treatment Site")}</Label>
            <select
              className="form-control form-control-sm"
              value={plan.treatmentSite}
              disabled={readOnly}
              onChange={(e) => set("treatmentSite", e.target.value)}
            >
              <option value="">{t("Select")}</option>
              {(sites.includes(plan.treatmentSite) || !plan.treatmentSite
                ? sites
                : [...sites, plan.treatmentSite]
              ).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("Specific Plan")}</Label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={plan.specificPlan}
              disabled={readOnly}
              onChange={(e) => set("specificPlan", e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <Label>{t("Beam")}</Label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={t("Beam no.")}
                value={beamNoDraft}
                disabled={readOnly}
                onChange={(e) => setBeamNoDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{ whiteSpace: "nowrap" }}
                onClick={handleAddBeam}
                disabled={readOnly}
              >
                {t("Add")}
              </button>
            </div>
          </div>
        </div>
      </Band>

      <Band title={t("Beam Details")}>
        <div style={{ overflowX: "auto" }}>
          <table className="table table-sm table-bordered mb-0" style={{ fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: C.head, color: C.white }}>
                {BEAM_COLUMNS.map(([k, label]) => (
                  <th key={k} style={{ whiteSpace: "nowrap" }}>
                    {t(label)}
                  </th>
                ))}
                {!readOnly && <th />}
              </tr>
            </thead>
            <tbody>
              {beams.length === 0 && (
                <tr>
                  <td
                    colSpan={BEAM_COLUMNS.length + 1}
                    style={{ textAlign: "center", color: C.sub, padding: 14 }}
                  >
                    {t("No beams yet — set the treatment site and press Add")}
                  </td>
                </tr>
              )}
              {beams.map((b, i) => (
                <tr key={i}>
                  {BEAM_COLUMNS.map(([k, , w]) => (
                    <td key={k} style={{ padding: 3 }}>
                      {cell(i, k, w)}
                    </td>
                  ))}
                  {!readOnly && (
                    <td style={{ padding: 3, whiteSpace: "nowrap" }}>
                      <span
                        role="button"
                        title={t("Remove")}
                        aria-label={`${t("Remove beam")} ${i + 1}`}
                        onClick={() => removeBeam(i)}
                        style={{ cursor: "pointer", color: C.red }}
                      >
                        <i className="fa fa-trash" />
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      <div
        style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: 10, marginBottom: 12,
        }}
      >
        {plan.id > 0 && (
          <span style={{ fontSize: 11.5, color: C.sub, marginRight: 6 }}>
            <i className="fas fa-pen mr-1" style={{ color: C.blue }} />
            {t("Editing plan")} #{plan.id}
          </span>
        )}
        {!readOnly && (
          <button
            type="button"
            className="btn btn-sm btn-primary px-4"
            onClick={handleSave}
            disabled={busy}
          >
            <i className="fa fa-save mr-1" />{" "}
            {busy ? t("Please wait...") : plan.id > 0 ? t("Update") : t("Save")}
          </button>
        )}
        {plan.id > 0 && (
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
            {t("New Plan")}
          </button>
        )}
      </div>

      {/* ── The list ─────────────────────────────────────────────────────── */}
      <Band title={t("List")}>
        <div style={{ overflowX: "auto" }}>
          <table
            className="table table-sm table-bordered mb-0"
            style={{ fontSize: 11.5, whiteSpace: "nowrap" }}
          >
            <thead>
              <tr style={{ background: C.head, color: C.white }}>
                <th>{t("Sn.")}</th>
                <th>{t("Remarks")}</th>
                <th>{t("Site / Plan")}</th>
                <th>{t("Beams")}</th>
                <th>{t("Bolus")}</th>
                <th>{t("BolusText")}</th>
                <th>{t("Calculated By")}</th>
                <th>{t("Input Prepared")}</th>
                <th>{t("Edit")}</th>
                <th>{t("Approved")}</th>
                <th>{t("Print")}</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", color: C.sub, padding: 14 }}>
                    {t("No plan recorded for this patient")}
                  </td>
                </tr>
              )}
              {plans.map((p, i) => (
                <tr key={p.id} style={plan.id === p.id ? { background: C.blueBg } : undefined}>
                  <td>{i + 1}</td>
                  <td style={{ whiteSpace: "normal", maxWidth: 260 }}>{p.remarks}</td>
                  <td>
                    {p.treatmentSite}
                    {p.specificPlan ? ` / ${p.specificPlan}` : ""}
                  </td>
                  <td>{p.beams.length}</td>
                  <td>{p.bolus === "1" ? t("Yes") : p.bolus === "0" ? t("No") : ""}</td>
                  <td>{p.bolusText}</td>
                  <td>{p.calculatedBy}</td>
                  <td>{p.inputPreparedBy}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span
                      role="button"
                      title={p.isApproved ? t("View") : t("Edit")}
                      aria-label={`${t("Edit")} ${i + 1}`}
                      onClick={() => handleEdit(p)}
                      style={{ cursor: "pointer", color: C.blue, marginRight: 10 }}
                    >
                      <i className={`fa ${p.isApproved ? "fa-eye" : "fa-edit"}`} />
                    </span>
                    {!p.isApproved && (
                      <span
                        role="button"
                        title={t("Delete")}
                        aria-label={`${t("Delete")} ${i + 1}`}
                        onClick={() => handleDelete(p)}
                        style={{ cursor: "pointer", color: C.red }}
                      >
                        <i className="fa fa-trash" />
                      </span>
                    )}
                  </td>
                  <td>
                    {p.isApproved ? (
                      <span
                        className="badge"
                        title={p.approvedByName}
                        style={{ background: C.green, color: C.white, fontWeight: 600, padding: "3px 8px" }}
                      >
                        {t("Approved")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-0"
                        aria-label={`${t("Approve")} ${i + 1}`}
                        onClick={() => handleApprove(p)}
                        disabled={busy}
                      >
                        {t("Approve")}
                      </button>
                    )}
                  </td>
                  <td>
                    <span
                      role="button"
                      title={t("Print")}
                      aria-label={`${t("Print")} ${i + 1}`}
                      onClick={() => handlePrint(p)}
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
      </Band>
    </div>
  );
}

export default PhysicistPlanning;
