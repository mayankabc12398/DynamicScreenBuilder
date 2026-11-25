import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { FormDate, FormTime, FormDateTime } from "../formComponent/StringDateTimePicker";
import { notify } from "../../utils/ustil2";
import { RedirectURL } from "../../networkServices/PDFURL";
import {
  FallRiskSAIHGetAPI,
  FallRiskSAIHPrintAPI,
  FallRiskSAIHSaveAPI,
} from "../../networkServices/nursingWardAPI";

// IPD frame tab "Fall Risk Assessment (SAIH271)" - paper form SAIH271/IPD: 7-item scale (total 0-12),
// interventions per level with Yes/No, and the re-assessment log. The API recomputes total and level on save.

const ITEMS = [
  { key: "Age", title: "1. Age", options: [["Age <65", 0], ["Age >65", 1]] },
  { key: "Feeding", title: "2. Feeding problem", options: [["No", 0], ["Yes", 1]] },
  { key: "HistoryOfFall", title: "3. History of fall", options: [["No", 0], ["Home", 1], ["Hospital", 2], ["Injury", 3]] },
  { key: "Sensory", title: "4. Sensory Deficit (Visual, Speech & Hearing)", options: [["No", 0], ["Yes - one of the three deficit", 1], ["Yes - two of the three deficit", 2], ["Yes - all the three deficit", 3]] },
  { key: "Elimination", title: "5. Elimination problem", options: [["No", 0], ["Single problem eg. Urine incontinence", 1], ["More than one problem", 2]] },
  { key: "SelfCare", title: "6. Self care problem", options: [["No", 0], ["Yes", 1]] },
  { key: "Mobility", title: "7. Mobility problem", options: [["No", 0], ["Yes", 1]] },
];

const LEVELS = [
  {
    level: "L1", title: "Level I - All patients", min: 0, steps: [
      "Identify High Risk Patients", "Maintain beds at lower level", "Side Rails up and locked", "Call bell within reach",
      "Breaks of beds, Wheel Chair and trolley to be locked", "Attendant to accompany patients who are potential to fall",
      "Prevention of fall counselling",
    ],
  },
  {
    level: "L2", title: "Level I + Add on intervention - Level II (score 1-7)", min: 1, steps: [
      "Instruct patient to call for assistance when needs to move from bed, chair wheel chair, toilet etc.",
      "Establish a bowel and bladder routine program as appropriate",
      "Instruct patient / family regarding medication responses, side effects and precautions as appropriate",
      "Explain patient / family the need for these precautions & encourage family",
      "Alert all other staff on the fall precautions.",
    ],
  },
  {
    level: "L3", title: "Level I + II + Add on intervention - Level III (score 8-10)", min: 8, steps: [
      "Frequently re-orient & repetitively reinforce the need to call for assistance",
      "Utilize soft chest restrain, seat belt, or limbs restraint as appropriate (obtain)",
    ],
  },
  {
    level: "L4", title: "Level I + II + III + Add on intervention - Level IV (score 11-12)", min: 11, steps: [
      "Provide close supervision as appropriate",
      "Provide one to one supervision as appropriate (obtain a physician order)",
      "Get physicians order for restrain (physical or chemical)",
    ],
  },
];

const RE_COLS = [
  { key: "DateTime", label: "Date & Time", type: "datetime-local" },
  { key: "TotalScore", label: "Total Score", type: "number" },
  { key: "Level", label: "Intervention Level (I-IV)" },
  { key: "Action", label: "Special Care / Action Taken", wide: true },
  { key: "DutyDoctor", label: "Duty Doctor" },
  { key: "AssignedNurse", label: "Assigned Nurse" },
  { key: "InchargeNurse", label: "Incharge Nurse" },
];

const levelOf = (total) => (total >= 11 ? "IV" : total >= 8 ? "III" : total >= 1 ? "II" : "I");

export default function FallRiskSAIH({ data }) {
  const [t] = useTranslation();
  const transactionID = data?.transactionID;
  const [patient, setPatient] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [form, setForm] = useState({
    AssessDate: moment().format("YYYY-MM-DD"),
    AssessTime: moment().format("HH:mm"),
    Scores: {},
    Interventions: {},
    Reassessments: [],
  });

  const total = useMemo(
    () => Object.values(form.Scores || {}).reduce((s, v) => s + (Number(v) || 0), 0),
    [form.Scores],
  );
  const level = levelOf(total);

  const load = async () => {
    if (!transactionID) return;
    const res = await FallRiskSAIHGetAPI(transactionID);
    if (!res?.success) {
      notify(res?.message || "Unable to load the assessment", "error");
      return;
    }
    setPatient(res?.data?.patient || {});
    setIsSaved(!!res?.data?.isSaved);
    const f = res?.data?.form;
    if (f) {
      setForm({
        AssessDate: f.assessDate ?? f.AssessDate ?? "",
        AssessTime: f.assessTime ?? f.AssessTime ?? "",
        Scores: f.scores ?? f.Scores ?? {},
        Interventions: f.interventions ?? f.Interventions ?? {},
        Reassessments: f.reassessments ?? f.Reassessments ?? [],
      });
    }
  };

  useEffect(() => {
    load();
  }, [transactionID]);

  const setScore = (key, score) => setForm((p) => ({ ...p, Scores: { ...p.Scores, [key]: String(score) } }));
  const setIntervention = (key, val) =>
    setForm((p) => ({ ...p, Interventions: { ...p.Interventions, [key]: p.Interventions?.[key] === val ? "" : val } }));
  const setRe = (rows) => setForm((p) => ({ ...p, Reassessments: rows }));

  const handleSave = async () => {
    const missing = ITEMS.filter((i) => form.Scores?.[i.key] === undefined || form.Scores?.[i.key] === "");
    if (missing.length) {
      notify(`${t("Please score")}: ${missing.map((m) => m.title).join(", ")}`, "warn");
      return;
    }
    const res = await FallRiskSAIHSaveAPI({ TransactionID: Number(transactionID), ...form });
    if (res?.success) {
      notify(res?.message || "Saved", "success");
      load();
    } else {
      notify(res?.message || "Unable to save", "error");
    }
  };

  const handlePrint = async () => {
    const res = await FallRiskSAIHPrintAPI(transactionID);
    if (res?.success && res?.data?.pdfUrl) RedirectURL(res.data.pdfUrl);
    else notify(res?.message || "Unable to print", "error");
  };

  const addReassessment = () =>
    setRe([
      ...(form.Reassessments || []),
      { DateTime: moment().format("YYYY-MM-DDTHH:mm"), TotalScore: String(total), Level: level },
    ]);

  return (
    <div className="mt-2">
      <div className="card patient_registration border mb-2">
        <Heading title={t("Fall Risk Assessment")} isBreadcrumb={false} />
        <div className="row px-2 pt-2 small">
          <div className="col-md-4"><b>{t("Name")}:</b> {patient?.PName} ({patient?.AgeSex})</div>
          <div className="col-md-3"><b>{t("UHID")}:</b> {patient?.PatientID} &nbsp; <b>{t("IP No.")}:</b> {patient?.IPDNo}</div>
          <div className="col-md-3"><b>{t("Ward / Bed")}:</b> {patient?.Ward} {patient?.BedNo ? `- ${patient.BedNo}` : ""}</div>
          <div className="col-md-2"><b>{t("Doctor")}:</b> {patient?.Doctor}</div>
        </div>
        <div className="row p-2">
          <FormDate lable={t("Date")} name="AssessDate" value={form.AssessDate} onChange={(e) => setForm((p) => ({ ...p, AssessDate: e.target.value }))} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
          <FormTime lable={t("Time")} name="AssessTime" value={form.AssessTime} onChange={(e) => setForm((p) => ({ ...p, AssessTime: e.target.value }))} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
          <div className="col d-flex align-items-center">
            <span className={`badge px-3 py-2 ${level === "IV" || level === "III" ? "badge-danger" : level === "II" ? "badge-warning" : "badge-success"}`} style={{ fontSize: 13 }}>
              {t("Total Score")}: {total} / 12 &nbsp;|&nbsp; {t("Level")} {level}
            </span>
          </div>
        </div>

        <div className="row px-2 pb-2">
          <div className="col-lg-5 col-12">
            <div className="font-weight-bold mb-1">{t("Fall Risk Assessment Scale")}</div>
            {ITEMS.map((item) => (
              <div key={item.key} className="border rounded p-2 mb-1">
                <div className="font-weight-bold small mb-1">{t(item.title)}</div>
                {item.options.map(([label, score]) => (
                  <label key={label} className="d-flex justify-content-between mb-0 small" style={{ cursor: "pointer" }}>
                    <span>
                      <input type="radio" className="mr-2" name={`fr_${item.key}`} checked={form.Scores?.[item.key] === String(score)} onChange={() => setScore(item.key, score)} />
                      {t(label)}
                    </span>
                    <span className="font-weight-bold">{score}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="col-lg-7 col-12">
            <div className="font-weight-bold mb-1">{t("Interventions - Action Taken")}</div>
            {LEVELS.map((lv) => {
              const applies = total >= lv.min;
              return (
                <div key={lv.level} className={`border rounded p-2 mb-1 ${applies ? "border-primary" : ""}`} style={applies ? undefined : { opacity: 0.6 }}>
                  <div className="font-weight-bold small mb-1">
                    {t(lv.title)} {applies && <span className="badge badge-primary ml-1">{t("Applicable")}</span>}
                  </div>
                  <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                    <tbody>
                      {lv.steps.map((s, i) => {
                        const key = `${lv.level}_${i + 1}`;
                        const v = form.Interventions?.[key];
                        return (
                          <tr key={key}>
                            <td>{i + 1}. {t(s)}</td>
                            <td className="text-nowrap" style={{ width: 120 }}>
                              {["Yes", "No"].map((o) => (
                                <label key={o} className="mr-2 mb-0" style={{ cursor: "pointer" }}>
                                  <input type="checkbox" className="mr-1" checked={v === o} onChange={() => setIntervention(key, o)} />
                                  {t(o)}
                                </label>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card patient_registration border mb-2">
        <Heading title={t("Fall Risk Re-Assessment")} isBreadcrumb={false} />
        <div className="px-3 pt-2 small text-muted">
          {t("Every shift for ICU's and vulnerable patients; every 48 hrs when score is 1-7 (ward); every 24 hrs when score is 8-12.")}
        </div>
        <div className="table-responsive px-2 pt-1">
          <table className="table table-sm table-bordered mb-1" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                {RE_COLS.map((c) => <th key={c.key} style={c.wide ? { minWidth: 200 } : undefined}>{t(c.label)}</th>)}
                <th style={{ width: 30 }} />
              </tr>
            </thead>
            <tbody>
              {(form.Reassessments || []).map((r, i) => (
                <tr key={i}>
                  {RE_COLS.map((c) => (
                    <td key={c.key} className="p-0">
                      {c.key === "Level" ? (
                        <select className="form-control form-control-sm border-0" value={r?.Level || ""} onChange={(e) => setRe(form.Reassessments.map((x, j) => (j === i ? { ...x, Level: e.target.value } : x)))}>
                          <option value="" />
                          {["I", "II", "III", "IV"].map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      ) : c.type === "datetime-local" ? (
                        <FormDateTime
                          compact
                          name={c.key}
                          value={r?.[c.key] || ""}
                          onChange={(e) => setRe(form.Reassessments.map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)))}
                        />
                      ) : (
                        <input
                          type={c.type || "text"}
                          className="form-control form-control-sm border-0"
                          value={r?.[c.key] || ""}
                          onChange={(e) => setRe(form.Reassessments.map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)))}
                        />
                      )}
                    </td>
                  ))}
                  <td className="text-center">
                    <i className="fa fa-trash text-danger" style={{ cursor: "pointer" }} onClick={() => setRe(form.Reassessments.filter((_, j) => j !== i))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn btn-sm btn-outline-primary mb-2" onClick={addReassessment}>
            <i className="fa fa-plus mr-1" />
            {t("Add Re-Assessment")}
          </button>
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
