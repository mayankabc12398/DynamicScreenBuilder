import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import AiThinkingRobot from "../Doctor/AiThinkingRobot";
import LabFlagChip from "./LabFlagChip";
import { notify } from "../../utils/utils";
import { PatientLabReportSave } from "../../networkServices/PatientLabReportApi";
import { ACCEPTED_REPORT_TYPES, checkReportFile, extractLabReport } from "../../utils/labReportAI";
import { blankRow, rowFlag } from "../../utils/labTrendLogic";

/**
 * Add (or correct) a lab report.
 *
 * The doctor loads a PDF or a photo of a report - or types values in - and the AI reads every
 * parameter into a table. That table is only a DRAFT: each row is editable, flags are worked out
 * as the doctor types, and nothing is stored until Save. Saving keeps the original file with the
 * report and every parameter under a key shared with the same test on other reports, which is
 * what lets the Trends tab draw one line through reports from different laboratories.
 *
 * The page is not tied to any fixed list of tests: a report can have any parameters, and a
 * patient can have any number of reports.
 */
const readingSteps = ["Reading the report", "Finding every parameter", "Matching units and reference ranges", "Preparing the table for you to check"];

export default function LabReportEntry({ patient, editing, onSaved, onCancelEdit }) {
  const [t] = useTranslation();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null); // { name, type, base64, url } - base64 only for a file loaded now
  const [reading, setReading] = useState(false);
  const [step, setStep] = useState(0);
  const [reportDate, setReportDate] = useState(new Date());
  const [labName, setLabName] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState("MANUAL");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const paramsRef = useRef(null);

  // On a narrow screen the parameters sit below the report preview, out of sight: bring them into view
  // when the AI starts reading and again when its rows arrive, so they are not missed or left unsaved.
  const showParams = () => requestAnimationFrame(() => paramsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }));

  /* ---------------------------------- the preview URL ---------------------------------- */

  const urlRef = useRef(null);
  const showFile = useCallback((next) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next?.url || null;
    setFile(next);
  }, []);
  useEffect(() => () => urlRef.current && URL.revokeObjectURL(urlRef.current), []);

  /* ---------------------------------- editing an old report ---------------------------------- */

  useEffect(() => {
    if (!editing) return;
    showFile(null);
    setReportDate(moment(editing.reportDate, "YYYY-MM-DD").toDate());
    setLabName(editing.labName || "");
    setReportTitle(editing.reportTitle || "");
    setSource(editing.sourceType === "AI" ? "AI" : "MANUAL");
    setRows(
      (editing.parameters || []).map((p) => ({
        ...blankRow(),
        section: p.section || "",
        name: p.name || "",
        // The key the parameter was saved under: sent back as its standard name so a correction
        // keeps the reading on the same trend line instead of re-deciding it from the spelling.
        standardName: p.key || "",
        value: p.value || "",
        unit: p.unit || "",
        refRange: p.refRange || "",
        refLow: p.refLow ?? null,
        refHigh: p.refHigh ?? null,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  /* ---------------------------------- reading a file ---------------------------------- */

  useEffect(() => {
    if (!reading) return undefined;
    const timer = setInterval(() => setStep((s) => s + 1), 2400);
    return () => clearInterval(timer);
  }, [reading]);

  const handleFile = async (chosen) => {
    const problem = checkReportFile(chosen);
    if (problem) {
      notify(t(problem), "error");
      return;
    }
    const url = URL.createObjectURL(chosen);
    showFile({ name: chosen.name, type: chosen.type, base64: "", url });
    setStep(0);
    setReading(true);
    showParams();
    try {
      const { extraction, base64 } = await extractLabReport(chosen);
      showFile({ name: chosen.name, type: chosen.type, base64, url });
      if (extraction.rows.length === 0) {
        notify(t("No parameters could be read from this file. You can type them in below."), "warn");
        setRows((prev) => (prev.length ? prev : [blankRow()]));
      } else {
        // Rows the doctor has already typed are kept; the AI's rows go after them.
        setRows((prev) => {
          const typed = prev.filter((r) => r.name.trim() || r.value.trim());
          return [...typed, ...extraction.rows];
        });
        setSource("AI");
        notify(`${extraction.rows.length} ${t("parameters read. Please check every value against the report before saving.")}`, "success");
      }
      if (extraction.reportDate) setReportDate(moment(extraction.reportDate, "YYYY-MM-DD").toDate());
      setLabName((prev) => prev || extraction.labName);
      setReportTitle((prev) => prev || extraction.reportTitle);
    } catch (error) {
      console.log(error);
      // The file stays, so it can still be kept with the report and the values typed in by hand.
      showFile({ name: chosen.name, type: chosen.type, base64: await toBase64Safe(chosen), url });
      notify(`${error?.message || t("The report could not be read")}. ${t("You can type the values in below.")}`, "warn");
      setRows((prev) => (prev.length ? prev : [blankRow()]));
    } finally {
      setReading(false);
      showParams();
    }
  };

  const onPick = (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (chosen) handleFile(chosen);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const chosen = e.dataTransfer?.files?.[0];
    if (chosen) handleFile(chosen);
  };

  /* ---------------------------------- the table ---------------------------------- */

  const update = (id, field, value) => setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)));
  const remove = (id) => setRows((prev) => prev.filter((r) => r._id !== id));
  const add = () => setRows((prev) => [...prev, blankRow()]);

  const filled = useMemo(() => rows.filter((r) => r.name.trim() && r.value.trim()), [rows]);
  const abnormal = useMemo(() => filled.filter((r) => ["L", "H"].includes(rowFlag(r))).length, [filled]);

  const cell = (row, field, props = {}) => (
    <input
      type="text"
      className="table-input"
      value={row[field] ?? ""}
      onChange={(e) => update(row._id, field, e.target.value)}
      {...props}
    />
  );

  const tbody = rows.map((row, index) => ({
    sno: index + 1,
    section: cell(row, "section", { maxLength: 120 }),
    name: (
      <div className="d-flex align-items-center" style={{ gap: 4 }}>
        {cell(row, "name", { maxLength: 200, className: "table-input flex-grow-1" })}
        {row.fromAI && <span className="lrt-ai" title={t("Read by the AI - please check")}>AI</span>}
      </div>
    ),
    value: cell(row, "value", { maxLength: 120 }),
    unit: cell(row, "unit", { maxLength: 40 }),
    refRange: cell(row, "refRange", { maxLength: 120 }),
    flag: <LabFlagChip flag={rowFlag(row)} />,
    action: (
      <i
        className="fa fa-trash text-danger text-center"
        role="button"
        aria-label={t("Remove")}
        onClick={() => remove(row._id)}
      />
    ),
  }));

  /* ---------------------------------- saving ---------------------------------- */

  const reset = () => {
    showFile(null);
    setRows([]);
    setLabName("");
    setReportTitle("");
    setReportDate(new Date());
    setSource("MANUAL");
  };

  const handleSave = async () => {
    if (!patient?.PatientID) return notify(t("Select a patient first"), "error");
    if (!reportDate || !moment(reportDate).isValid()) return notify(t("Enter the date on the report"), "error");
    if (filled.length === 0) return notify(t("Add at least one parameter with its value"), "error");

    setSaving(true);
    try {
      const res = await PatientLabReportSave({
        reportID: editing?.reportId || null,
        patientID: patient.PatientID,
        transactionID: Number(patient.TransactionID) || null,
        reportDate: moment(reportDate).format("YYYY-MM-DD"),
        labName,
        reportTitle,
        sourceType: source,
        fileName: file?.base64 ? file.name : null,
        fileType: file?.base64 ? file.type : null,
        fileBase64: file?.base64 || null,
        parameters: filled.map((r) => ({
          section: r.section,
          name: r.name,
          standardName: r.standardName,
          value: r.value,
          unit: r.unit,
          refRange: r.refRange,
          refLow: r.refLow ?? null,
          refHigh: r.refHigh ?? null,
          flag: r.labFlag || null,
        })),
      });
      if (res?.success) {
        const skipped = rows.length - filled.length;
        notify(skipped > 0 ? `${res.message}. ${skipped} ${t("row(s) without a name or value were left out")}` : res.message, "success");
        reset();
        onSaved?.();
      } else {
        notify(res?.message || t("The report could not be saved"), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------- rendering ---------------------------------- */

  const isPdf = file?.type === "application/pdf";

  return (
    <div className="lrt-entry">
      {editing && (
        <div className="lrt-editing">
          <i className="fas fa-pen mr-1" aria-hidden="true" />
          {t("Correcting the report of")} <b>{moment(editing.reportDate, "YYYY-MM-DD").format("DD MMM YYYY")}</b>.{" "}
          {t("Saving replaces its parameters.")}
          <button type="button" className="btn btn-sm text-white ml-2" onClick={onCancelEdit}>
            {t("Cancel")}
          </button>
        </div>
      )}

      <div className="card patient_registration border p-2 mb-2">
        <div className="row align-items-center">
          <div className="col-xl-5 col-12 mb-2">
            <div
              className={`lrt-drop${dragging ? " lrt-drop--on" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input ref={fileInput} type="file" hidden accept={ACCEPTED_REPORT_TYPES.join(",")} onChange={onPick} />
              <button type="button" className="btn btn-sm text-white" disabled={reading} onClick={() => fileInput.current?.click()}>
                <i className="fas fa-file-upload mr-1" aria-hidden="true" />
                {t("Load PDF / Image")}
              </button>
              <button type="button" className="btn btn-sm text-white" disabled={reading || rows.length > 0} onClick={add}>
                <i className="fas fa-keyboard mr-1" aria-hidden="true" />
                {t("Type values")}
              </button>
              <span className="lrt-drop__hint">{t("or drop the report here")}</span>
            </div>
          </div>
          <DatePicker
            className="custom-calendar"
            id="lab-report-date"
            name="reportDate"
            lable={t("Report Date")}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            value={reportDate ? moment(reportDate).toDate() : ""}
            maxDate={new Date()}
            handleChange={(e) => setReportDate(e?.target?.value ?? e?.value ?? null)}
          />
          <Input
            id="lab-name"
            lable={t("Laboratory / Hospital")}
            name="labName"
            className="form-control"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            maxLength={200}
            placeholder=" "
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
          />
          <Input
            id="lab-title"
            lable={t("Report Title")}
            name="reportTitle"
            className="form-control"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            maxLength={200}
            placeholder=" "
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          />
        </div>
        <small className="text-muted">
          <i className="fas fa-info-circle mr-1" aria-hidden="true" />
          {t("The file is sent to the AI service to read the values. Check every value against the report: the AI can misread a scan.")}
        </small>
      </div>

      <div className="lrt-split">
        <div>
          <Heading title={t("Report")} isBreadcrumb={false} secondTitle={file ? <span className="lrt-filename" title={file.name}>{file.name}</span> : null} />
          <div className="lrt-preview">
            {file?.url ? (
              isPdf ? (
                <iframe title={t("Report")} src={file.url} className="lrt-preview__frame" />
              ) : (
                <img alt={t("Report")} src={file.url} className="lrt-preview__image" />
              )
            ) : editing?.hasFile ? (
              <div className="lrt-empty">{t("The original file is kept with this report. Load a new one to replace it.")}</div>
            ) : (
              <div className="lrt-empty">
                <i className="far fa-file-alt" aria-hidden="true" />
                <div>{t("No file loaded")}</div>
              </div>
            )}
          </div>
        </div>

        <div className="lrt-split__params" ref={paramsRef} style={{ scrollMarginTop: 8 }}>
          <Heading
            title={t("Parameters")}
            isBreadcrumb={false}
            secondTitle={
              rows.length > 0 ? (
                <span className="lrt-counts">
                  {filled.length} {t("parameters")}
                  {abnormal > 0 && <span className="lrt-counts__bad"> · {abnormal} {t("out of range")}</span>}
                </span>
              ) : null
            }
          />
          {reading ? (
            <AiThinkingRobot message={t(readingSteps[step % readingSteps.length])} />
          ) : rows.length === 0 ? (
            <div className="lrt-empty lrt-empty--tall">
              <i className="fas fa-vials" aria-hidden="true" />
              <div>{t("Load a report and the AI will list every parameter here, or type the values in.")}</div>
            </div>
          ) : (
            <>
              <Tables
                thead={[
                  { name: "#", width: "3%" },
                  { name: t("Test / Group"), width: "15%" },
                  { name: t("Parameter"), width: "27%" },
                  { name: t("Value"), width: "12%" },
                  { name: t("Unit"), width: "10%" },
                  { name: t("Reference Range"), width: "17%" },
                  { name: t("Flag"), width: "10%" },
                  { name: "", width: "3%" },
                ]}
                tbody={tbody}
                style={{ maxHeight: "52vh" }}
              />
              <div className="d-flex justify-content-between align-items-center px-1 pt-1">
                <button type="button" className="btn btn-sm text-white" onClick={add}>
                  <i className="fas fa-plus mr-1" aria-hidden="true" />
                  {t("Add Parameter")}
                </button>
                <small className="text-muted">{t("Flags are worked out from the value and the reference range.")}</small>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`lrt-savebar${filled.length > 0 ? " lrt-savebar--pending" : ""}`}>
        {filled.length > 0 && !reading && (
          <span className="lrt-savebar__msg">
            <i className="fas fa-exclamation-triangle mr-1" aria-hidden="true" />
            {filled.length} {t("parameters")} - {t("not saved yet. Check the values, then press Save.")}
          </span>
        )}
        <button type="button" className="btn btn-sm text-white px-3" onClick={handleSave} disabled={saving || reading || filled.length === 0}>
          {t("Save")}
        </button>
      </div>
    </div>
  );
}

// The base64 of a file, or "" - used when the AI could not read it but the file should still be kept.
const toBase64Safe = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
