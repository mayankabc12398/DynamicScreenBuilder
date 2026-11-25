import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  PatientRegistrationAPI,
  ValidateDuplicatePatientEntry,
} from "../../../networkServices/directPatientReg";

const STATUS = { PENDING: "pending", SUCCESS: "success", DUPLICATE: "duplicate", ERROR: "error" };

export default function BulkPatientRegistration({ handleClose }) {
  const [t] = useTranslation();
  const fileRef = useRef();
  const [rows, setRows] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // ── Get system defaults from Redux (same source as registration form) ──
  const { BindResource } = useSelector((s) => s.CommonSlice);

  const defaults = useMemo(() => ({
    countryID:    parseInt(BindResource?.BaseCurrencyID)   || 0,
    countryName:  BindResource?.DefaultCountry             || "",
    stateID:      parseInt(BindResource?.DefaultStateID)   || 0,
    stateName:    BindResource?.DefaultState               || "",
    districtID:   parseInt(BindResource?.DefaultDistrictID)|| 0,
    districtName: BindResource?.DefaultDistrict            || "",
  }), [BindResource]);

  // ── Template column definitions ────────────────────────────────────
  const COLUMNS = useMemo(() => [
    { key: "Title",        label: "Title *",             width: 10, note: "Mr/Mrs/Ms/Baby/Master", mandatory: true },
    { key: "FirstName",    label: "First Name *",        width: 20, mandatory: true },
    { key: "MiddleName",   label: "Middle Name",         width: 18 },
    { key: "LastName",     label: "Last Name",           width: 18 },
    { key: "Mobile",       label: "Mobile *",            width: 15, mandatory: true },
    { key: "Gender",       label: "Gender *",            width: 10, note: "Male/Female/Other", mandatory: true },
    { key: "DOB",          label: "DOB (DD/MM/YYYY)",   width: 18 },
    { key: "Age",          label: "Age",                 width: 8 },
    { key: "AgeType",      label: "Age Type",            width: 10, note: "YRS/MOS/DAYS", default: "YRS" },
    { key: "LocalAddress", label: "Local Address",       width: 30 },
    { key: "Email",        label: "Email",               width: 25 },
    { key: "CountryID",    label: "Country ID",          width: 12, default: () => defaults.countryID, note: "System default — change only if needed" },
    { key: "Country",      label: "Country Name",        width: 15, default: () => defaults.countryName },
    { key: "StateID",      label: "State ID",            width: 10, default: () => defaults.stateID, note: "System default — change only if needed" },
    { key: "State",        label: "State Name",          width: 15, default: () => defaults.stateName },
    { key: "DistrictID",   label: "District ID",         width: 12, default: () => defaults.districtID, note: "System default — change only if needed" },
    { key: "District",     label: "District Name",       width: 15, default: () => defaults.districtName },
  ], [defaults]);

  // ── Download Excel template ────────────────────────────────────────
  const downloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Patient Registration");

    // Header row
    const headerRow = ws.addRow(COLUMNS.map((c) => c.label));
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A085" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.height = 24;

    // Sample/default row
    const sampleValues = COLUMNS.map((c) =>
      typeof c.default === "function" ? c.default() : (c.default || ""),
    );
    const sampleRow = ws.addRow(sampleValues);
    sampleRow.font = { italic: true, color: { argb: "FF555555" } };
    sampleRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F9F6" } };

    // Column widths, notes, mandatory red headers
    COLUMNS.forEach((col, i) => {
      ws.getColumn(i + 1).width = col.width;
      if (col.note) {
        ws.getCell(1, i + 1).note = col.note;
      }
      if (col.mandatory) {
        ws.getCell(1, i + 1).font = { bold: true, color: { argb: "FFCC0000" } };
      }
    });

    // ID columns — light gray background to indicate "system filled"
    [12, 14, 16].forEach((colNum) => {
      ws.getCell(2, colNum).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E8E8" } };
      ws.getCell(2, colNum).font = { color: { argb: "FF666666" } };
    });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "BulkPatientRegistration_Template.xlsx");
  };

  // ── Parse uploaded Excel ───────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const mapped = raw
        .filter((r) => r["First Name *"] || r["FirstName"])
        .map((r, i) => ({
          _idx: i + 1,
          Title:        r["Title *"]           || r["Title"]         || "",
          FirstName:    r["First Name *"]       || r["FirstName"]     || "",
          MiddleName:   r["Middle Name"]         || r["MiddleName"]    || "",
          LastName:     r["Last Name"]           || r["LastName"]      || "",
          Mobile:       String(r["Mobile *"]    || r["Mobile"]        || ""),
          Gender:       r["Gender *"]            || r["Gender"]        || "",
          DOB:          r["DOB (DD/MM/YYYY)"]    || r["DOB"]           || "",
          Age:          r["Age"]                 || "",
          AgeType:      r["Age Type"]            || r["AgeType"]       || "YRS",
          LocalAddress: r["Local Address"]       || r["LocalAddress"]  || "",
          Email:        r["Email"]               || "",
          // Country / State / District — use from Excel if present, else system defaults
          CountryID:    parseInt(r["Country ID"]   || r["CountryID"]   || defaults.countryID)  || defaults.countryID,
          Country:      r["Country Name"]          || r["Country"]      || defaults.countryName,
          StateID:      parseInt(r["State ID"]     || r["StateID"]      || defaults.stateID)   || defaults.stateID,
          State:        r["State Name"]            || r["State"]        || defaults.stateName,
          DistrictID:   parseInt(r["District ID"]  || r["DistrictID"]   || defaults.districtID) || defaults.districtID,
          District:     r["District Name"]         || r["District"]     || defaults.districtName,
          _status: STATUS.PENDING,
          _uhid: "",
          _msg: "",
        }));

      setRows(mapped);
      setDone(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // ── Build API payload from one row ─────────────────────────────────
  const buildPayload = (row) => ({
    patientMaster: {
      patientID:       "",
      MotherUHID:      "",
      oldPatientID:    "",
      OldPatientID:    "",
      title:           row.Title       || "",
      pFirstName:      row.FirstName   || "",
      PMiddleName:     (row.MiddleName || "").toUpperCase(),
      pLastName:       row.LastName    || "",
      pName:           `${row.FirstName} ${row.MiddleName || ""} ${row.LastName || ""}`.trim().toUpperCase(),
      mobile:          String(row.Mobile || ""),
      gender:          row.Gender      || "",
      age:             `${row.Age || ""} ${row.AgeType || "YRS"}`.trim(),
      dob: (() => {
        if (!row.DOB) return "0001-01-01";
        const parts = String(row.DOB).split("/");
        if (parts.length === 3) return `${parts[2]}-${String(parts[1]).padStart(2,"0")}-${String(parts[0]).padStart(2,"0")}`;
        return "0001-01-01";
      })(),
      house_No:        row.LocalAddress || "",
      email:           row.Email        || "",
      country:         row.Country      || "",
      countryID:       row.CountryID    || 0,
      state:           row.State        || "",
      stateID:         row.StateID      || 0,
      district:        row.District     || "",
      districtID:      row.DistrictID   || 0,
      city:            "",
      cityID:          0,
      taluka:          "",
      talukaID:        0,
      locality:        "",
      landMark:        "",
      policeStation:   "",
      policeStationID: 0,
      pinCode:         "",
      occupation:      "",
      maritalStatus:   "",
      relation:        "Self",
      relationName:    "",
      relationPhoneNo: "",
      passport_No:     "",
      IPAddress:       "",
      patientType:     "",
      patientTypeID:   0,
      trusteeId:       0,
      trusteeStaffType:"",
      panelID:         1,
      source:          "OPD",
      patientRelationData: [],
      patientIDProofs:     [],
      postalCode:          "",
      postalAddressID:     0,
      postalAddress:       "",
      Area:                "",
    },
    policyDetail:  [],
    documentIds:   [],
    documentsList: [],
    remarks:       "",
    RequestId:     0,
  });

  // ── Process all rows ───────────────────────────────────────────────
  const processAll = async () => {
    if (!rows.length) return;
    setProcessing(true);
    const updated = [...rows];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (!row.FirstName || !row.Mobile || !row.Title || !row.Gender) {
        updated[i] = { ...row, _status: STATUS.ERROR, _msg: "Mandatory fields missing (Title / First Name / Mobile / Gender)" };
        setRows([...updated]);
        continue;
      }

      // Duplicate check
      try {
        const dupResp = await ValidateDuplicatePatientEntry({ PFirstName: row.FirstName, Mobile: row.Mobile }, []);
        if (dupResp?.success && Array.isArray(dupResp.data) && dupResp.data.length > 0) {
          const ex = dupResp.data[0];
          updated[i] = { ...row, _status: STATUS.DUPLICATE, _msg: `Duplicate: ${ex?.PatientID || ""} — ${ex?.PName || ""}` };
          setRows([...updated]);
          continue;
        }
      } catch (_) {}

      // Register
      try {
        const resp = await PatientRegistrationAPI(buildPayload(row));
        if (resp?.success) {
          updated[i] = { ...row, _status: STATUS.SUCCESS, _uhid: resp.data || "", _msg: resp.message || "Registered" };
        } else {
          updated[i] = { ...row, _status: STATUS.ERROR, _msg: resp?.message || "Failed" };
        }
      } catch (err) {
        updated[i] = { ...row, _status: STATUS.ERROR, _msg: err?.message || "Error" };
      }
      setRows([...updated]);
    }

    setProcessing(false);
    setDone(true);
  };

  const counts = rows.reduce((acc, r) => { acc[r._status] = (acc[r._status] || 0) + 1; return acc; }, {});
  const badgeClass = (s) =>
    s === STATUS.SUCCESS   ? "badge bg-success" :
    s === STATUS.DUPLICATE ? "badge bg-warning text-dark" :
    s === STATUS.ERROR     ? "badge bg-danger" : "badge bg-secondary";

  return (
    <div className="container-fluid p-0">
      {/* Actions bar */}
      <div className="d-flex gap-2 flex-wrap mb-2 p-2 border-bottom align-items-center">
        <button className="btn btn-outline-success btn-sm" onClick={downloadTemplate}>
          <i className="fa fa-download me-1" /> {t("Download Template")}
        </button>
        <label className="btn btn-outline-primary btn-sm mb-0" style={{ cursor: "pointer" }}>
          <i className="fa fa-upload me-1" /> {t("Choose Excel File")}
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="d-none" onChange={handleFileChange} />
        </label>
        {rows.length > 0 && !processing && !done && (
          <button className="btn btn-success btn-sm" onClick={processAll}>
            <i className="fa fa-paper-plane me-1" />
            {t("Register All")} ({rows.filter((r) => r._status === STATUS.PENDING).length} {t("pending")})
          </button>
        )}
        {rows.length > 0 && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setRows([]); setDone(false); }}>
            <i className="fa fa-trash me-1" /> {t("Clear")}
          </button>
        )}
        {/* System defaults info */}
        <div className="ms-auto small text-muted border rounded px-2 py-1" style={{ fontSize: "0.72rem" }}>
          <b>{t("Defaults")}:</b>&nbsp;
          {t("Country")}: <b>{defaults.countryName}</b> (ID:{defaults.countryID}) &nbsp;|&nbsp;
          {t("State")}: <b>{defaults.stateName}</b> (ID:{defaults.stateID}) &nbsp;|&nbsp;
          {t("District")}: <b>{defaults.districtName}</b> (ID:{defaults.districtID})
        </div>
      </div>

      {/* Summary badges */}
      {rows.length > 0 && (
        <div className="d-flex gap-2 mb-2 px-2 flex-wrap">
          <span className="badge bg-secondary">{t("Total")}: {rows.length}</span>
          {counts[STATUS.SUCCESS]   ? <span className="badge bg-success">{t("Success")}: {counts[STATUS.SUCCESS]}</span> : null}
          {counts[STATUS.DUPLICATE] ? <span className="badge bg-warning text-dark">{t("Duplicate")}: {counts[STATUS.DUPLICATE]}</span> : null}
          {counts[STATUS.ERROR]     ? <span className="badge bg-danger">{t("Error")}: {counts[STATUS.ERROR]}</span> : null}
          {counts[STATUS.PENDING]   ? <span className="badge bg-secondary">{t("Pending")}: {counts[STATUS.PENDING]}</span> : null}
        </div>
      )}

      {/* Table */}
      {rows.length > 0 ? (
        <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
          <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.78rem" }}>
            <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <tr>
                <th>#</th>
                <th>{t("Title")}</th>
                <th>{t("Name")}</th>
                <th>{t("Mobile")}</th>
                <th>{t("Gender")}</th>
                <th>{t("DOB / Age")}</th>
                <th>{t("Country")} (ID)</th>
                <th>{t("State")} (ID)</th>
                <th>{t("District")} (ID)</th>
                <th>{t("Status")}</th>
                <th>{t("UHID / Message")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row._idx}</td>
                  <td>{row.Title}</td>
                  <td>{row.FirstName} {row.LastName}</td>
                  <td>{row.Mobile}</td>
                  <td>{row.Gender}</td>
                  <td>{row.DOB || `${row.Age} ${row.AgeType}`}</td>
                  <td>{row.Country} ({row.CountryID})</td>
                  <td>{row.State} ({row.StateID})</td>
                  <td>{row.District} ({row.DistrictID})</td>
                  <td><span className={badgeClass(row._status)}>{row._status}</span></td>
                  <td>{row._uhid ? <b style={{ color: "#16a085" }}>{row._uhid}</b> : row._msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <i className="fa fa-file-excel fa-3x mb-3 d-block" style={{ color: "#27ae60" }} />
          <div className="mb-2">{t("Download the template, fill patient data, then upload to register in bulk")}</div>
          <div className="small">
            {t("Default values pre-filled in template")}:&nbsp;
            <b>{defaults.countryName}</b> / <b>{defaults.stateName}</b> / <b>{defaults.districtName}</b>
          </div>
        </div>
      )}
    </div>
  );
}
