import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { FormDateTimeByType, FormDate, FormTime, FormDateTime } from "../formComponent/StringDateTimePicker";
import TextAreaInput from "../formComponent/TextAreaInput";
import { notify } from "../../utils/ustil2";
import { RedirectURL } from "../../networkServices/PDFURL";
import {
  NursingERGetAssessmentAPI,
  NursingERPrintAssessmentAPI,
  NursingERSaveAssessmentAPI,
} from "../../networkServices/nursingWardAPI";

// IPD frame tab "Nurses Initial Assessment - Emergency Department" - the 4-page paper form
// SAIH224/EMR. One form per admission (nursing_er_initial_assessment); grids are saved as JSON.

const VITAL_COLS = [
  { key: "Date", label: "Date", type: "date" },
  { key: "Time", label: "Time", type: "time" },
  { key: "BP", label: "BP" },
  { key: "Pulse", label: "Pulse" },
  { key: "RespRate", label: "Respiratory Rate" },
  { key: "SPO2", label: "SPO2" },
  { key: "Temperature", label: "Temperature" },
  { key: "RBS", label: "RBS" },
  { key: "PainScore", label: "Pain Score" },
];
const MED_COLS = [
  { key: "Drug", label: "Name of the drug", wide: true },
  { key: "Dose", label: "Dose" },
  { key: "Route", label: "Route" },
  { key: "Frequency", label: "Frequency" },
  { key: "Time", label: "Time", type: "time" },
  { key: "SignWithID", label: "Sign with ID" },
];
const INFUSION_COLS = [
  { key: "Name", label: "Name", wide: true },
  { key: "DropRate", label: "Drop Rate" },
  { key: "StartTime", label: "Start Time", type: "time" },
  { key: "StartSign", label: "Sign with ID" },
  { key: "FinishTime", label: "Finish Time", type: "time" },
  { key: "FinishSign", label: "Sign with ID" },
];
const INVESTIGATION_COLS = [
  { key: "Investigation", label: "Investigations advised by CMO/Consultant", wide: true },
  { key: "CollectionDateTime", label: "Collection of sample Date & Time", type: "datetime-local" },
  { key: "HandedOverTo", label: "Handed Over to Dept. Name" },
  { key: "ReceivedBy", label: "Received by (sign with ID)" },
];
const VALUABLE_COLS = [
  { key: "Materials", label: "Materials", wide: true },
  { key: "PersonName", label: "Name of the person" },
  { key: "Relationship", label: "Relationship with the patient" },
  { key: "DateTime", label: "Date & Time", type: "datetime-local" },
];

const CONDITIONS = ["Conscious", "Semi Conscious", "Un-Conscious", "Oriented", "Delirium Confused", "Irritable", "Hyper Active", "Intubated"];
const DISPOSITIONS = ["MICU", "SICU", "PICU", "NICU", "NURSERY", "LABOUR ROOM", "CCU", "CATH LAB", "CTVS ICU", "WARD", "DAY CARE", "OT", "DISCHARGED TO HOME", "REFERRAL", "LAMA", "DEATH"];
const PAIN_BANDS = { 0: "No Pain", 1: "Mild", 2: "Mild", 3: "Mild", 4: "Moderate", 5: "Moderate", 6: "Moderate", 7: "Severe", 8: "Severe", 9: "Severe", 10: "Very Severe" };

const FIELDS = [
  "ArrivalDate", "ArrivalTime", "TimeSeenByNurse", "BodyWeight", "Vitals", "GeneralCondition", "PainScore", "Complaints",
  "OutsideMLC", "SampleObtained", "MLCInformedPolice", "Dak", "MedicationDate", "Medications", "Infusions",
  "AdditionalTherapy", "SpecialOrders", "Investigations", "PlanOfManagement", "Disposition", "ReferralDetails",
  "DispositionCondition", "Valuables", "NursesNotes", "AssessedByName", "AssessedBySignID", "AssessedDateTime",
];
const GRID_FIELDS = ["Vitals", "Medications", "Infusions", "Investigations", "Valuables"];

const emptyForm = () =>
  Object.fromEntries(FIELDS.map((f) => [f, GRID_FIELDS.includes(f) || f === "GeneralCondition" ? [] : ""]));

// The API camel-cases property names (e.g. mlcInformedPolice); map them back by lower-case name.
const fromApi = (apiForm) => {
  const lc = Object.fromEntries(Object.entries(apiForm || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const form = emptyForm();
  FIELDS.forEach((f) => {
    const v = lc[f.toLowerCase()];
    if (v !== undefined && v !== null) form[f] = v;
  });
  return form;
};

function EditGrid({ t, columns, rows, onChange, addLabel }) {
  const update = (i, key, value) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  return (
    <div className="table-responsive px-2">
      <table className="table table-sm table-bordered mb-1" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ width: 40 }}>{t("S.No.")}</th>
            {columns.map((c) => (
              <th key={c.key} style={c.wide ? { minWidth: 200 } : undefined}>{t(c.label)}</th>
            ))}
            <th style={{ width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              {columns.map((c) => (
                <td key={c.key} className="p-0">
                  {c.type ? (
                    <FormDateTimeByType
                      compact
                      type={c.type}
                      name={c.key}
                      value={r?.[c.key] || ""}
                      onChange={(e) => update(i, c.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-sm border-0"
                      value={r?.[c.key] || ""}
                      onChange={(e) => update(i, c.key, e.target.value)}
                    />
                  )}
                </td>
              ))}
              <td className="text-center">
                <i
                  className="fa fa-trash text-danger"
                  style={{ cursor: "pointer" }}
                  title={t("Remove row")}
                  onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn btn-sm btn-outline-primary mb-2" onClick={() => onChange([...rows, {}])}>
        <i className="fa fa-plus mr-1" />
        {t(addLabel || "Add Row")}
      </button>
    </div>
  );
}

function Choice({ t, label, options, value, onChange }) {
  return (
    <div className="col-xl-3 col-md-6 col-12 d-flex align-items-center flex-wrap py-1">
      <span className="mr-2 font-weight-bold">{t(label)}:</span>
      {options.map((o) => (
        <label key={o} className="mr-3 mb-0" style={{ cursor: "pointer" }}>
          <input type="radio" className="mr-1" checked={value === o} onChange={() => onChange(o)} />
          {t(o)}
        </label>
      ))}
    </div>
  );
}

export default function NursingERAssessment({ data }) {
  const [t] = useTranslation();
  const transactionID = data?.transactionID;
  const [patient, setPatient] = useState({});
  const [form, setForm] = useState(emptyForm());
  const [isSaved, setIsSaved] = useState(false);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const onInput = (e) => set(e.target.name, e.target.value);

  const load = async () => {
    if (!transactionID) return;
    const res = await NursingERGetAssessmentAPI(transactionID);
    if (!res?.success) {
      notify(res?.message || "Unable to load the assessment", "error");
      return;
    }
    const pat = res?.data?.patient || {};
    setPatient(pat);
    setIsSaved(!!res?.data?.isSaved);
    if (res?.data?.form) {
      setForm(fromApi(res.data.form));
    } else {
      // New form: arrival defaults to the admission date / time.
      setForm({ ...emptyForm(), ArrivalDate: pat?.AdmitDate || "", ArrivalTime: pat?.AdmitTime || "" });
    }
  };

  useEffect(() => {
    load();
  }, [transactionID]);

  const toggleCondition = (c) =>
    set(
      "GeneralCondition",
      form.GeneralCondition.includes(c) ? form.GeneralCondition.filter((x) => x !== c) : [...form.GeneralCondition, c],
    );

  const handleSave = async () => {
    const res = await NursingERSaveAssessmentAPI({ TransactionID: Number(transactionID), ...form });
    if (res?.success) {
      notify(res?.message || "Saved", "success");
      setIsSaved(true);
      load();
    } else {
      notify(res?.message || "Unable to save", "error");
    }
  };

  const handlePrint = async () => {
    const res = await NursingERPrintAssessmentAPI(transactionID);
    if (res?.success && res?.data?.pdfUrl) RedirectURL(res.data.pdfUrl);
    else notify(res?.message || "Unable to print", "error");
  };

  const pain = form.PainScore === "" ? null : Number(form.PainScore);

  return (
    <div className="mt-2">
      {/* ---------------- Page 1 ---------------- */}
      <div className="card patient_registration border mb-2">
        <Heading title={t("Nurses Initial Assessment - Emergency Department")} isBreadcrumb={false} />
        <div className="row px-2 pt-2 small">
          <div className="col-md-4"><b>{t("Patient")}:</b> {patient?.PName} ({patient?.AgeSex})</div>
          <div className="col-md-3"><b>{t("UHID")}:</b> {patient?.PatientID} &nbsp; <b>{t("IP No.")}:</b> {patient?.IPDNo}</div>
          <div className="col-md-2"><b>{t("S/D/W/o")}:</b> {patient?.RelationOf}</div>
          <div className="col-md-3"><b>{t("Contact")}:</b> {patient?.ContactNo}</div>
        </div>
        <div className="row p-2">
          <FormDate lable={t("Arrival Date")} name="ArrivalDate" value={form.ArrivalDate} onChange={onInput} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
          <FormTime lable={t("Arrival Time")} name="ArrivalTime" value={form.ArrivalTime} onChange={onInput} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
          <FormTime lable={t("Time seen by ER Nurse")} name="TimeSeenByNurse" value={form.TimeSeenByNurse} onChange={onInput} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
          <Input type="text" lable={t("Body Weight (kg)")} name="BodyWeight" value={form.BodyWeight} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
        </div>

        <Heading title={t("Initial Vital Signs on Arrival")} isBreadcrumb={false} />
        <EditGrid t={t} columns={VITAL_COLS} rows={form.Vitals} onChange={(v) => set("Vitals", v)} addLabel="Add Vitals" />

        <Heading title={t("General condition of the patient on arrival")} isBreadcrumb={false} />
        <div className="px-3 py-2">
          {CONDITIONS.map((c) => (
            <label key={c} className="mr-4 mb-1" style={{ cursor: "pointer" }}>
              <input type="checkbox" className="mr-1" checked={form.GeneralCondition.includes(c)} onChange={() => toggleCondition(c)} />
              {t(c)}
            </label>
          ))}
        </div>

        <Heading title={t("Pain Assessment (0-10 numeric pain rating scale)")} isBreadcrumb={false} />
        <div className="px-3 py-2 d-flex align-items-center flex-wrap">
          {[...Array(11).keys()].map((n) => (
            <button
              key={n}
              type="button"
              className={`btn btn-sm mr-1 mb-1 ${pain === n ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => set("PainScore", pain === n ? "" : String(n))}
            >
              {n}
            </button>
          ))}
          <span className="ml-2 font-weight-bold">{pain !== null ? t(PAIN_BANDS[pain]) : ""}</span>
        </div>

        <div className="row px-2">
          <TextAreaInput lable={t("Patient brought to the Emergency Department with complaints of")} name="Complaints" value={form.Complaints} onChange={onInput} rows={2} className="form-control" respclass="col-12" />
        </div>
        <div className="row px-3 pb-2">
          <Choice t={t} label="Out Side MLC" options={["Yes", "No"]} value={form.OutsideMLC} onChange={(v) => set("OutsideMLC", v)} />
          <Choice t={t} label="Sample Obtained" options={["Yes", "No", "Not Required"]} value={form.SampleObtained} onChange={(v) => set("SampleObtained", v)} />
          <Choice t={t} label="MLC informed to Police" options={["Yes", "No"]} value={form.MLCInformedPolice} onChange={(v) => set("MLCInformedPolice", v)} />
          <Choice t={t} label="Dak" options={["Yes", "No"]} value={form.Dak} onChange={(v) => set("Dak", v)} />
        </div>
      </div>

      {/* ---------------- Page 2 ---------------- */}
      <div className="card patient_registration border mb-2">
        <Heading title={t("Comprehensive Nursing Documentation after Assessment by CMO")} isBreadcrumb={false} />
        <div className="row p-2">
          <FormDate lable={t("Date")} name="MedicationDate" value={form.MedicationDate} onChange={onInput} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
        </div>
        <Heading title={t("Medication Administration")} isBreadcrumb={false} />
        <EditGrid t={t} columns={MED_COLS} rows={form.Medications} onChange={(v) => set("Medications", v)} addLabel="Add Drug" />
        <Heading title={t("IV Infusions")} isBreadcrumb={false} />
        <EditGrid t={t} columns={INFUSION_COLS} rows={form.Infusions} onChange={(v) => set("Infusions", v)} addLabel="Add Infusion" />
        <div className="row px-2 pt-2">
          <TextAreaInput lable={t("Additional Therapy if any")} name="AdditionalTherapy" value={form.AdditionalTherapy} onChange={onInput} rows={2} className="form-control" respclass="col-md-6 col-12" />
          <TextAreaInput lable={t("Special Orders / Consultations if any")} name="SpecialOrders" value={form.SpecialOrders} onChange={onInput} rows={2} className="form-control" respclass="col-md-6 col-12" />
        </div>
      </div>

      {/* ---------------- Page 3 ---------------- */}
      <div className="card patient_registration border mb-2">
        <Heading title={t("Investigations (Lab & Radiology)")} isBreadcrumb={false} />
        <EditGrid t={t} columns={INVESTIGATION_COLS} rows={form.Investigations} onChange={(v) => set("Investigations", v)} addLabel="Add Investigation" />
        <div className="row px-2 pt-2">
          <TextAreaInput lable={t("Plan of management as advised by CMO / Consultant")} name="PlanOfManagement" value={form.PlanOfManagement} onChange={onInput} rows={3} className="form-control" respclass="col-12" />
        </div>
        <Heading title={t("Patient Disposition")} isBreadcrumb={false} />
        <div className="px-3 py-2">
          {DISPOSITIONS.map((d) => (
            <label key={d} className="mr-4 mb-1" style={{ cursor: "pointer" }}>
              <input type="radio" className="mr-1" checked={form.Disposition === d} onChange={() => set("Disposition", d)} />
              {t(d)}
            </label>
          ))}
        </div>
        <div className="row px-2">
          {form.Disposition === "REFERRAL" && (
            <Input type="text" lable={t("Referral Details")} name="ReferralDetails" value={form.ReferralDetails} onChange={onInput} placeholder=" " className="form-control" respclass="col-md-6 col-12" />
          )}
          <Choice t={t} label="Condition at disposition" options={["Stable", "Unstable"]} value={form.DispositionCondition} onChange={(v) => set("DispositionCondition", v)} />
        </div>
      </div>

      {/* ---------------- Page 4 ---------------- */}
      <div className="card patient_registration border mb-2">
        <Heading title={t("Details of valuables handed over to the relatives")} isBreadcrumb={false} />
        <EditGrid t={t} columns={VALUABLE_COLS} rows={form.Valuables} onChange={(v) => set("Valuables", v)} addLabel="Add Valuable" />
        <div className="row px-2 pt-2">
          <TextAreaInput lable={t("Nurses Notes")} name="NursesNotes" value={form.NursesNotes} onChange={onInput} rows={4} className="form-control" respclass="col-12" />
        </div>
        <Heading title={t("Assessed by (Nurse)")} isBreadcrumb={false} />
        <div className="row p-2">
          <Input type="text" lable={t("Name of the Staff")} name="AssessedByName" value={form.AssessedByName} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-3 col-md-4 col-12" />
          <Input type="text" lable={t("Signature with Id")} name="AssessedBySignID" value={form.AssessedBySignID} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-3 col-md-4 col-12" />
          <FormDateTime lable={t("Date & Time")} name="AssessedDateTime" value={form.AssessedDateTime} onChange={onInput} respclass="col-xl-3 col-md-4 col-12" />
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-sm btn-primary mr-2 px-4" onClick={handleSave}>
          {isSaved ? t("Update") : t("Save")}
        </button>
        <button type="button" className="btn btn-sm btn-primary px-4" onClick={handlePrint} disabled={!isSaved} title={isSaved ? "" : t("Save the assessment before printing")}>
          <i className="fa fa-print mr-1" />
          {t("Print")}
        </button>
      </div>
    </div>
  );
}
