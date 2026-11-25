import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { FormDate, FormTime } from "../formComponent/StringDateTimePicker";
import TextAreaInput from "../formComponent/TextAreaInput";
import { notify } from "../../utils/ustil2";
import { RedirectURL } from "../../networkServices/PDFURL";
import {
  PeripheralCannulaDeleteAPI,
  PeripheralCannulaGetAPI,
  PeripheralCannulaPrintAPI,
  PeripheralCannulaSaveAPI,
} from "../../networkServices/nursingWardAPI";

// IPD frame tab "Peripheral Cannula Care Bundle" - paper form SAIH117/IC. One card per cannula:
// insertion record, daily AM/PM/Night checks (In use, Dressing, Needlefree, VIP, Signature) and removal record.

const SHIFTS = [
  { key: "AM", label: "AM" },
  { key: "PM", label: "PM" },
  { key: "N", label: "Night" },
];
const CHECKS = [
  { key: "InUse", label: "In use", type: "tick" },
  { key: "Dressing", label: "Dressing", type: "tick" },
  { key: "Needlefree", label: "Needlefree", type: "tick" },
  { key: "VIP", label: "VIP", type: "vip" },
  { key: "Sign", label: "Signature", type: "text" },
];
const VIP_ACTION = {
  0: "No signs of phlebitis - Observe cannula",
  1: "Possibly first signs of phlebitis - Observe cannula",
  2: "Early stage of phlebitis - Resite cannula",
  3: "Medium stage of phlebitis - Resite cannula, consider treatment",
  4: "Advanced phlebitis / start of thrombophlebitis - Resite cannula, initiate treatment",
  5: "Advanced thrombophlebitis - Resite cannula, initiate treatment",
};
const FIELDS = [
  "ID", "InsertionDate", "InsertionTime", "Size", "DressingType", "Attempts", "InsertionReason", "InsertedBy", "Site",
  "Monitoring", "RemovedDate", "DaysInSitu", "VIPAtRemoval", "VIP24HrPostRemoval", "RemovalReason", "RemovedBy", "Comments",
];

const newCannula = () => ({
  ...Object.fromEntries(FIELDS.map((f) => [f, ""])),
  ID: 0,
  InsertionDate: moment().format("YYYY-MM-DD"),
  InsertionTime: moment().format("HH:mm"),
  Monitoring: [],
});

// The API camel-cases DTO property names; the Monitoring rows keep their own keys.
const fromApi = (c) => {
  const lc = Object.fromEntries(Object.entries(c || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const out = newCannula();
  FIELDS.forEach((f) => {
    const v = lc[f.toLowerCase()];
    if (v !== undefined && v !== null) out[f] = v;
  });
  return out;
};

const VipSelect = ({ value, onChange, className }) => (
  <select className={className} value={value || ""} onChange={(e) => onChange(e.target.value)}>
    <option value="" />
    {[0, 1, 2, 3, 4, 5].map((n) => (
      <option key={n} value={String(n)}>{n}</option>
    ))}
  </select>
);

function DayBlock({ t, day, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...day, [k]: v });
  const highVip = SHIFTS.some((s) => Number(day?.[`${s.key}_VIP`]) >= 2);
  return (
    <div className="border rounded p-1 m-1" style={{ minWidth: 300, flex: "1 1 300px", maxWidth: 420 }}>
      <div className="d-flex align-items-center mb-1">
        <span className="mr-1 font-weight-bold small">{t("Date")}:</span>
        <FormDate compact name="Date" value={day?.Date || ""} onChange={(e) => set("Date", e.target.value)} />
        <i className="fa fa-trash text-danger ml-auto" style={{ cursor: "pointer" }} title={t("Remove day")} onClick={onRemove} />
      </div>
      <table className="table table-sm table-bordered mb-0" style={{ fontSize: 12 }}>
        <thead>
          <tr><th />{SHIFTS.map((s) => <th key={s.key} className="text-center">{t(s.label)}</th>)}</tr>
        </thead>
        <tbody>
          {CHECKS.map((c) => (
            <tr key={c.key}>
              <td className="text-nowrap">{t(c.label)}</td>
              {SHIFTS.map((s) => {
                const k = `${s.key}_${c.key}`;
                const cls = "form-control form-control-sm border-0 px-1";
                return (
                  <td key={k} className="p-0">
                    {c.type === "tick" && (
                      <select className={cls} value={day?.[k] || ""} onChange={(e) => set(k, e.target.value)}>
                        <option value="" />
                        <option value="✓">✓</option>
                        <option value="✗">✗</option>
                      </select>
                    )}
                    {c.type === "vip" && <VipSelect className={cls} value={day?.[k]} onChange={(v) => set(k, v)} />}
                    {c.type === "text" && <input className={cls} value={day?.[k] || ""} onChange={(e) => set(k, e.target.value)} />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {highVip && <div className="text-danger small mt-1">{t("VIP score 2 or more - replace (resite) the cannula.")}</div>}
    </div>
  );
}

function CannulaCard({ t, index, cannula, onChange, onSave, onDelete }) {
  const set = (k, v) => {
    const next = { ...cannula, [k]: v };
    // Days in situ follows the insertion / removal dates unless typed by hand.
    if ((k === "RemovedDate" || k === "InsertionDate") && next.InsertionDate && next.RemovedDate) {
      const days = moment(next.RemovedDate).diff(moment(next.InsertionDate), "days");
      if (days >= 0) next.DaysInSitu = String(days);
    }
    onChange(next);
  };
  const onInput = (e) => set(e.target.name, e.target.value);
  const days = cannula.Monitoring || [];
  const isRemoved = !!cannula.RemovedDate;

  return (
    <div className={`card border mb-2 ${isRemoved ? "border-secondary" : "border-primary"}`}>
      <Heading
        title={`${t("Cannula")} ${index + 1}${cannula.Size ? ` - ${cannula.Size}` : ""}${isRemoved ? ` (${t("Removed")})` : ""}`}
        isBreadcrumb={false}
      />
      <div className="px-2 pt-1 small font-weight-bold">{t("Peripheral Cannula Insertion Record")}</div>
      <div className="row px-2 pt-1">
        <FormDate lable={t("Date")} name="InsertionDate" value={cannula.InsertionDate} onChange={onInput} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
        <FormTime lable={t("Time")} name="InsertionTime" value={cannula.InsertionTime} onChange={onInput} respclass="col-xl-1 col-md-3 col-sm-6 col-12" />
        <Input type="text" lable={t("Size")} name="Size" value={cannula.Size} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-1 col-md-3 col-sm-6 col-12" />
        <Input type="text" lable={t("Site")} name="Site" value={cannula.Site} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
        <div className="col-xl-2 col-md-3 col-sm-6 col-12 d-flex align-items-center">
          <span className="small mr-1">{t("Dressing")}:</span>
          {["Transparent", "Sterile Gauze"].map((o) => (
            <label key={o} className="small mb-0 mr-2">
              <input type="radio" className="mr-1" checked={cannula.DressingType === o} onChange={() => set("DressingType", o)} />
              {t(o)}
            </label>
          ))}
        </div>
        <Input type="number" lable={t("Number of attempts")} name="Attempts" value={cannula.Attempts} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-1 col-md-3 col-sm-6 col-12" />
        <Input type="text" lable={t("Reason for insertion")} name="InsertionReason" value={cannula.InsertionReason} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
        <Input type="text" lable={t("Inserted by")} name="InsertedBy" value={cannula.InsertedBy} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-1 col-md-3 col-sm-6 col-12" />
      </div>

      <div className="px-2 small font-weight-bold">{t("Daily checks (every shift)")}</div>
      <div className="d-flex flex-wrap px-1">
        {days.map((d, i) => (
          <DayBlock
            key={i}
            t={t}
            day={d}
            onChange={(nd) => set("Monitoring", days.map((x, j) => (j === i ? nd : x)))}
            onRemove={() => set("Monitoring", days.filter((_, j) => j !== i))}
          />
        ))}
      </div>
      <div className="px-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary mb-2"
          onClick={() => set("Monitoring", [...days, { Date: moment().format("YYYY-MM-DD") }])}
        >
          <i className="fa fa-plus mr-1" />
          {t("Add Day")}
        </button>
      </div>

      <div className="px-2 small font-weight-bold">{t("Peripheral Cannula Removal Record")}</div>
      <div className="row px-2 pt-1">
        <FormDate lable={t("Date removed")} name="RemovedDate" value={cannula.RemovedDate} onChange={onInput} respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
        <Input type="text" lable={t("Days in situ")} name="DaysInSitu" value={cannula.DaysInSitu} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-1 col-md-3 col-sm-6 col-12" />
        <div className="col-xl-2 col-md-3 col-sm-6 col-12 d-flex align-items-center">
          <span className="small mr-1 text-nowrap">{t("VIP upon removal")}:</span>
          <VipSelect className="form-control form-control-sm" value={cannula.VIPAtRemoval} onChange={(v) => set("VIPAtRemoval", v)} />
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12 d-flex align-items-center">
          <span className="small mr-1 text-nowrap">{t("VIP 24 hrs post removal")}:</span>
          <VipSelect className="form-control form-control-sm" value={cannula.VIP24HrPostRemoval} onChange={(v) => set("VIP24HrPostRemoval", v)} />
        </div>
        <Input type="text" lable={t("Reason for removal")} name="RemovalReason" value={cannula.RemovalReason} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-3 col-md-6 col-12" />
        <Input type="text" lable={t("Removed by")} name="RemovedBy" value={cannula.RemovedBy} onChange={onInput} placeholder=" " className="form-control" respclass="col-xl-2 col-md-3 col-sm-6 col-12" />
      </div>
      {cannula.VIPAtRemoval !== "" && cannula.VIPAtRemoval !== undefined && (
        <div className="px-3 small text-muted">VIP {cannula.VIPAtRemoval}: {t(VIP_ACTION[Number(cannula.VIPAtRemoval)] || "")}</div>
      )}
      <div className="row px-2">
        <TextAreaInput lable={t("Comments")} name="Comments" value={cannula.Comments} onChange={onInput} rows={2} className="form-control" respclass="col-12" />
      </div>
      <div className="d-flex justify-content-end px-2 pb-2">
        {cannula.ID > 0 && (
          <button type="button" className="btn btn-sm btn-outline-danger mr-2" onClick={onDelete}>
            {t("Delete")}
          </button>
        )}
        <button type="button" className="btn btn-sm btn-primary px-4" onClick={onSave}>
          {cannula.ID > 0 ? t("Update") : t("Save")}
        </button>
      </div>
    </div>
  );
}

export default function PeripheralCannula({ data }) {
  const [t] = useTranslation();
  const transactionID = data?.transactionID;
  const [patient, setPatient] = useState({});
  const [cannulas, setCannulas] = useState([]);

  const load = async () => {
    if (!transactionID) return;
    const res = await PeripheralCannulaGetAPI(transactionID);
    if (!res?.success) {
      notify(res?.message || "Unable to load cannula records", "error");
      return;
    }
    setPatient(res?.data?.patient || {});
    setCannulas((res?.data?.cannulas || []).map(fromApi));
  };

  useEffect(() => {
    load();
  }, [transactionID]);

  const update = (i, c) => setCannulas((prev) => prev.map((x, j) => (j === i ? c : x)));

  const save = async (i) => {
    const res = await PeripheralCannulaSaveAPI({ ...cannulas[i], TransactionID: Number(transactionID) });
    if (res?.success) {
      notify(res?.message || "Saved", "success");
      load();
    } else {
      notify(res?.message || "Unable to save", "error");
    }
  };

  const remove = async (i) => {
    const c = cannulas[i];
    if (!c?.ID) return;
    if (!window.confirm(t("Delete this cannula record?"))) return;
    const res = await PeripheralCannulaDeleteAPI(c.ID, transactionID);
    notify(res?.message, res?.success ? "success" : "error");
    if (res?.success) load();
  };

  const print = async () => {
    const res = await PeripheralCannulaPrintAPI(transactionID);
    if (res?.success && res?.data?.pdfUrl) RedirectURL(res.data.pdfUrl);
    else notify(res?.message || "Unable to print", "error");
  };

  return (
    <div className="mt-2">
      <div className="card patient_registration border mb-2">
        <Heading title={t("Peripheral Cannula Care Bundle")} isBreadcrumb={false} />
        <div className="row px-2 py-2 small">
          <div className="col-md-4"><b>{t("Name")}:</b> {patient?.PName} ({patient?.AgeSex})</div>
          <div className="col-md-3"><b>{t("UHID")}:</b> {patient?.PatientID} &nbsp; <b>{t("IP No.")}:</b> {patient?.IPDNo}</div>
          <div className="col-md-3"><b>{t("Ward / Bed")}:</b> {patient?.Ward} {patient?.BedNo ? `- ${patient.BedNo}` : ""}</div>
          <div className="col-md-2"><b>{t("Doctor")}:</b> {patient?.Doctor}</div>
        </div>
        <div className="d-flex justify-content-end px-2 pb-2">
          <button type="button" className="btn btn-sm btn-outline-primary mr-2" onClick={() => setCannulas((prev) => [...prev, newCannula()])}>
            <i className="fa fa-plus mr-1" />
            {t("Add Cannula")}
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={print}>
            <i className="fa fa-print mr-1" />
            {t("Print")}
          </button>
        </div>
      </div>

      {cannulas.length === 0 && (
        <div className="text-center text-muted small my-3">{t("No cannula recorded yet. Click Add Cannula to record an insertion.")}</div>
      )}
      {cannulas.map((c, i) => (
        <CannulaCard
          key={c.ID || `new-${i}`}
          t={t}
          index={i}
          cannula={c}
          onChange={(nc) => update(i, nc)}
          onSave={() => save(i)}
          onDelete={() => remove(i)}
        />
      ))}
    </div>
  );
}
