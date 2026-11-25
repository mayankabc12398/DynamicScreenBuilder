import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../formComponent/ReactSelect";
import Input from "../../formComponent/Input";
import TimePicker from "../../formComponent/TimePicker";
import DatePicker from "../../formComponent/DatePicker";
import {
  DISCHARGEINTIMATION_OPTIONS,
  TYPE_OF_DEATH_OPTIONS,
} from "../../../utils/constant";
import { translateOptions } from "@components/WrapTranslate";

const ReleaseModal = ({ onSave }) => {

  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const initialValues = {
    releaseType: "",
    reason: "",
    dateDeath: new Date(),
    timeDeath: new Date(),
    causeOfDeath: "",
    typeOfDeath: "",
    remarks: "",
    isDeath48hrs: false,
  };

  const [payload, setPayload] = useState(initialValues);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPayload({
      ...payload,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleReactSelect = (name, value) => {
    setPayload((prev) => ({
      ...prev,
      [name]: value?.value,
    }));
  };



  return (
    <>
      <div className="row">

        <ReactSelect
          placeholderName={"Release Type"}
          id="releaseType"
          name="releaseType"
          value={payload.releaseType}
          handleChange={handleReactSelect}
          dynamicOptions={translateOptions(DISCHARGEINTIMATION_OPTIONS, t)}
          respclass="col-xl-6 col-md-6 col-sm-4 col-12"
          requiredClassName={"required-fields"}
        />


        <Input
          type="text"
          className="form-control required-fields"
          id="reason"
          name="reason"
          value={payload.reason}
          onChange={handleChange}
          lable={t("Reason")}
          respclass="col-xl-6 col-md-6 col-sm-4 col-12"
        />
      </div>


      {payload.releaseType === "Death" && (
        <>
          <div className="row">
            <DatePicker
              className={`custom-calendar`}
              respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              id="dateDeath"
              name="dateDeath"
              value={payload.dateDeath}
              handleChange={handleChange}
              lable={t("Date of Death")}
              placeholder={VITE_DATE_FORMAT}
              inputClassName={"required-fields"}
            />

            <TimePicker
              lable={t("Time of Death")}
              respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              id="timeDeath"
              name="timeDeath"
              value={payload.timeDeath}
              handleChange={handleChange}
              className="required-fields"
            />

            <Input
              type="text"
              className="form-control required-fields"
              id="causeOfDeath"
              name="causeOfDeath"
              value={payload.causeOfDeath}
              onChange={handleChange}
              lable={t("Cause of Death")}
              respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
            />

            <ReactSelect
              placeholderName={"Type of Death"}
              id="typeOfDeath"
              name="typeOfDeath"
              value={payload.typeOfDeath}
              handleChange={handleReactSelect}
              dynamicOptions={translateOptions(TYPE_OF_DEATH_OPTIONS, t)}
              respclass="col-xl-3 col-md-3 col-sm-4 col-12"
              requiredClassName={"required-fields"}
            />
          </div>

          <div className="row">
            <Input
              type="text"
              className="form-control"
              id="remarks"
              name="remarks"
              value={payload.remarks}
              onChange={handleChange}
              lable={t("Remarks")}
              respclass={"col-xl-6 col-md-6 col-sm-4 col-12"}
            />

            <div className="col-xl-6 col-md-6 col-sm-4 col-12 d-flex align-items-center">
              <input
                type="checkbox"
                id="isDeath48hrs"
                name="isDeath48hrs"
                checked={payload.isDeath48hrs}
                onChange={handleChange}
                className="me-2"
              />
              <label htmlFor="isDeath48hrs">{t("Death Over 48hrs")}</label>
            </div>
          </div>

        </>
      )}
      <div className="d-flex align-items-center justify-content-end mt-3">
        <button
          className="btn btn-sm btn-primary"
          onClick={() => onSave(payload)}   // send payload directly
        >
          {t("Save")}
        </button>
      </div>
    </>
  );
};

export default ReleaseModal;
