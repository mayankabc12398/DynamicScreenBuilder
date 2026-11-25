import React, { useState, useEffect } from "react";
import Heading from "../../UI/Heading";
import "./MachineSettingRecordForm.css";
import { useTranslation } from "react-i18next";
import {
  MachineSettingRecordSave,
  UpdateOxygenMachineSetting,
} from "../../../networkServices/OT/otAPI";
import Input from "../../formComponent/Input";
import Tables from "../../UI/customTable";
import { notify } from "../../../utils/ustil2";

const MachineSettingRecordForm = ({ show, onClose, data }) => {
  const [t] = useTranslation();
  const [values, setValues] = useState({});

  if (!show) return null;

  const theads = [
    { width: "1%", name: t("S.No") },
    { width: "5%", name: t("Set TV") },
    { width: "5%", name: t("FIO2") },
    { width: "5%", name: t("I:E ratio") },
    { width: "5%", name: t("Alarm Limit Set") },
    { width: "3%", name: t("Action") },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        PatientID: data?.PatientID,
        TransactionID: data?.TransactionID,
        SetTV: values?.setTV,
        TargetTV: values?.targetTV,
        FIO2: values?.fiO2,
        SetRR: values?.setRR,
        TargetRR: values?.targetRR,
        PEEP: values?.peep,
        PressureSupport: values?.pressureSupport,
        IERatio: values?.ieRatio,
        AlertLimitSet: values?.alarmLimitSet,
        OxygenPerMinute: values?.oxygenPerMinute,
      };

      console.log("Payload sending to backend:", payload);

      let response = await MachineSettingRecordSave(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        setValues({});
        onClose();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        PatientID: data?.PatientID,
        TransactionID: data?.TransactionID,
        SetTV: values?.setTV,
        TargetTV: values?.targetTV,
        FIO2: values?.fiO2,
        SetRR: values?.setRR,
        TargetRR: values?.targetRR,
        PEEP: values?.peep,
        PressureSupport: values?.pressureSupport,
        IERatio: values?.ieRatio,
        AlertLimitSet: values?.alarmLimitSet,
        OxygenPerMinute: values?.oxygenPerMinute,
      };

      console.log("Payload sending to backend:", payload);

      let response = await UpdateOxygenMachineSetting(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        setValues({});
        onClose();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  return (
    <div className="msrf_overlay">
      <div className="msrf_modal">
        <Heading
          title={<span className="text-dark">{t("Machine Setting")}</span>}
          secondTitle={
            <button
              className="py-2"
              onClick={onClose}
              style={{ background: "none", border: "none" }}
            >
              ✕
            </button>
          }
        />
        <div className="msrf_modal-content">
          <div className="row p-2">
            <Input
              type="text"
              className="form-control "
              id="setTV"
              lable={t("Set TV")}
              placeholder=" "
              required={true}
              value={values?.setTV}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="setTV"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="targetTV"
              lable={t("Target TV")}
              placeholder=" "
              required={true}
              value={values?.targetTV}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="targetTV"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="fiO2"
              lable={t("FIO2")}
              placeholder=" "
              required={true}
              value={values?.fiO2}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="fiO2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="setRR"
              lable={t("Set RR")}
              placeholder=" "
              required={true}
              value={values?.setRR}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="setRR"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="targetRR"
              lable={t("Target RR")}
              placeholder=" "
              required={true}
              value={values?.targetRR}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="targetRR"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="peep"
              lable={t("PEEP")}
              placeholder=" "
              required={true}
              value={values?.peep}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="peep"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="pressureSupport"
              lable={t("Pressure Support")}
              placeholder=" "
              required={true}
              value={values?.pressureSupport}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="pressureSupport"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="ieRatio"
              lable={t("I:E ratio")}
              placeholder=" "
              required={true}
              value={values?.ieRatio}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="ieRatio"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="alarmLimitSet"
              lable={t("Alarm Limit Set")}
              placeholder=" "
              required={true}
              value={values?.alarmLimitSet}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="alarmLimitSet"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control "
              id="oxygenPerMinute"
              lable={t("Oxygen Per Minute (LTR)")}
              placeholder=" "
              required={true}
              value={values?.oxygenPerMinute}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="oxygenPerMinute"
              onChange={handleChange}
            />
          </div>
          <div className="col-xl-2 col-md-3 col-sm-6 col-12">
            <button
              type="button"
              className="btn btn-sm btn-primary mr-1 mb-2"
              onClick={() => handleSave()}
            >
              {t("Save")}
            </button>
          </div>
          <Tables
            thead={theads.map((thead, index) => (
              <th key={index} style={{ width: thead.width }}>
                {thead.name}
              </th>
            ))}
          />
        </div>
      </div>
    </div>
  );    
};

export default MachineSettingRecordForm;
