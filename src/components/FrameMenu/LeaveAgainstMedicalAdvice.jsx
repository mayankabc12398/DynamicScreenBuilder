import React, { useEffect, useState } from "react";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";
import TextAreaInput from "../formComponent/TextAreaInput";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import ReactSelect from "../formComponent/ReactSelect";

import moment from "moment";
import {
  saveOrUpdateLeavingAgainstMedicalAdviceApi,
  getLeavingAgainstMedicalAdviceListApi,
} from "../../networkServices/Emergency";
import Tables from "../UI/customTable";
import { notify } from "../../utils/ustil2";
import { LeavingAgainstMedicalAdvicePdf } from "../../networkServices/nursingWardAPI";
import { RedirectURL } from "../../networkServices/PDFURL";

const LeaveAgainstMedicalAdvice = ({ data }) => {
  const { patientID, transactionID } = data;
  const [t] = useTranslation();
  const [values, setValues] = useState({
    id: 0,
    patientId: "",
    transactionId: "",
    name: "",
    additionalComment: "",
    nameOtherThanPatient: "",
    relationshipToPatient: "",
    nationalId: "",
    date: new Date(),
    time: new Date(),
    nursingService: "",
    financialReason: "",
    environmentNotSuitable: "",
    dateOfAdmission: new Date(),
    dateOfLeaving: new Date(),
    SaveOrUpdateLeavingAgainstMedicalAdvice: new Date(),
    otherCommentIfAny: "",
    dateTime: new Date(),
    time1: new Date(),
    nurseName: "",
    dischargeDiagnosis: "",
    diagnosisSummary: "",
    riskAndTeachingDone: "",
    physicianComments: "",
  });
  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];
  const [tableData, setTableData] = useState([]);
  const THEAD = [
    { name: t("S.No"), width: "1%" },
    { name: t("UHID"), width: "1%" },
    { name: t("Entered By"), width: "1%" },
    { name: t("Action"), width: "1%" },
  ];
  const { VITE_DATE_FORMAT } = import.meta.env;
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({ ...val, [name]: value }));
  };
  const handleReactSelectChange = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));
  };
  const handleSave = async () => {
    if (!values?.dateTime && !values?.time1) {
      return notify(t("please select Date and Time"), "warn");
    }
    // if (!values?.SaveOrUpdateLeavingAgainstMedicalAdvice) {
    //     return notify("please select Date Of Leaving", "warn")
    // }
    const payload = {
      id: values.id || 0,
      patientId: patientID || "",
      transactionId: transactionID || "",
      name: values.name || "",
      additionalComment: values.additionalComment || "",
      nameOtherThanPatient: values.nameOtherThanPatient || "",
      relationshipToPatient: values.relationshipToPatient || "",
      nationalId: values.nationalId || "",
      date: values.date || "",
      time: values.time ? moment(values.time).format("hh:mm A") : "",
      nursingService:
        values.nursingService?.value ?? values.nursingService ?? "",
      financialReason:
        values.financialReason?.value ?? values.financialReason ?? "",
      environmentNotSuitable:
        values.environmentNotSuitable?.value ??
        values.environmentNotSuitable ??
        "",
      dateOfAdmission: values.dateOfAdmission || "",
      dateOfLeaving: values.dateOfLeaving || "",
      otherCommentIfAny: values.otherCommentIfAny || "",
      dateTime:
        moment(values.dateTime).format("DD-MM-YYYY") +
          " " +
          moment(values?.time1).format("hh:mm A") || "",
      nurseName: values.nurseName || "",
      dischargeDiagnosis: values.dischargeDiagnosis ?? "",
      diagnosisSummary:
        values.diagnosisSummary?.value ?? values.diagnosisSummary ?? "",
      riskAndTeachingDone: values.riskAndTeachingDone || "",
      physicianComments: values.physicianComments || "",
    };
    debugger;
    const res = await saveOrUpdateLeavingAgainstMedicalAdviceApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      fetchList();
      setValues({});
    } else {
      notify(res?.message, "error");
    }
  };
  const fetchList = async () => {
    const res = await getLeavingAgainstMedicalAdviceListApi(transactionID);
    if (res?.success) {
      setTableData(res?.data);
    } else {
      setTableData([]);
      notify(res?.message, "error");
    }
  };
  useEffect(() => {
    fetchList();
  }, []);

  const timeFormateDate = (time) => {
    if (!time || typeof time !== "string") return null;

    const date = new Date();

    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      const [h, m, s] = time.split(":").map(Number);
      date.setHours(h);
      date.setMinutes(m);
      date.setSeconds(s);
      return date;
    }

    if (/^\d{2}:\d{2}$/.test(time)) {
      const [h, m] = time.split(":").map(Number);
      date.setHours(h);
      date.setMinutes(m);
      date.setSeconds(0);
      return date;
    }

    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let [_, hh, mm, period] = match;
      hh = Number(hh);
      mm = Number(mm);
      period = period.toUpperCase();

      if (period === "PM" && hh !== 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;

      date.setHours(hh);
      date.setMinutes(mm);
      date.setSeconds(0);
      return date;
    }
    return null;
  };
  const handleEdit = (row) => {
    const splitDateTime = (dateTime) => {
      if (!dateTime) return { date: "", time: "" };

      const [date, time] = dateTime.split(" ");
      return {
        date,
        time: `${time}`,
      };
    };
    const { date, time } = splitDateTime(row.dateTime);

    setValues((prev) => ({
      ...prev,
      ...row,
      date: row?.date ? new Date(row?.date) : "",
      time: row?.time ? timeFormateDate(row?.time) : "",
      dateOfAdmission: row?.dateOfAdmission
        ? new Date(row?.dateOfAdmission)
        : "",
      dateOfLeaving: row?.dateOfLeaving ? new Date(row?.dateOfLeaving) : "",
      dateTime: new Date(date),
      time1: timeFormateDate(time),
    }));
  };
  console.log(values);

  const handlePrint = async () => {
    try {
      const r = await LeavingAgainstMedicalAdvicePdf(data?.patientID,data?.transactionID);
      if (r.success) {
        RedirectURL(r?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message, "eeror");
    }
  };

  return (
    <div className="card">
      <Heading title={t("Leaving Against Medical Advice")} />
      <div className="card text-bold p-2">
        <div className="d-block d-lg-flex">
          <span>I</span>
          <Input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={values?.name ? values?.name : ""}
            onChange={handleChange}
            lable={t("name")}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            placeholder=""
          />
          <span>
            a patient/Parent/Gurdian in The Karen Hospital, am leaving against
            the advice of my physician. I have been informed of the risk(s)
            involved
          </span>
        </div>
        <section>
          and hereby release my physician, the hospital administration and all
          staff, from responsibility for complications, which result from
          action.
        </section>
      </div>
      <div className="row p-2">
        <TextAreaInput
          type="text"
          className="form-textarea"
          id="additionalComment"
          name="additionalComment"
          value={values.additionalComment || ""}
          onChange={handleChange}
          lable={t("Additional Comment")}
          placeholder=""
          respclass="col-xl-4 col-md-3 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="nameOtherThanPatient"
          name="nameOtherThanPatient"
          value={
            values?.nameOtherThanPatient ? values?.nameOtherThanPatient : ""
          }
          onChange={handleChange}
          lable={t("nameOtherThanPatient")}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          placeholder=""
        />
        <Input
          type="text"
          className="form-control"
          id="relationshipToPatient"
          name="relationshipToPatient"
          value={
            values?.relationshipToPatient ? values?.relationshipToPatient : ""
          }
          onChange={handleChange}
          lable={t("relationshipToPatient")}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          placeholder=""
        />
        <Input
          type="text"
          className="form-control"
          id="nationalId"
          name="nationalId"
          value={values?.nationalId ? values?.nationalId : ""}
          onChange={handleChange}
          lable={t("nationalId")}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          placeholder=""
        />

        <DatePicker
          className={`custom-calendar `}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id="Date"
          name="date"
          // inputClassName={"required-fields"}
          value={values?.date ? values?.date : new Date()}
          handleChange={handleChange}
          lable={t("Date")}
          placeholder={VITE_DATE_FORMAT}
        />
        <TimePicker
          placeholderName={t("Time")}
          lable={t("Time")}
          id="time"
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="time"
          value={values?.time ? values?.time : new Date()}
          // value={new Date(`1970-01-01T00:00:00`)}
          handleChange={handleChange}
        />
        <ReactSelect
          placeholderName={t("nursing Service")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"nursingService"}
          name="nursingService"
          value={String(values?.nursingService)}
          removeIsClearable={true}
          dynamicOptions={yesNoOptions}
          handleChange={handleReactSelectChange}
        />

        <ReactSelect
          placeholderName={t("financial Reason")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"financialReason"}
          name="financialReason"
          value={String(values?.financialReason)}
          removeIsClearable={true}
          dynamicOptions={yesNoOptions}
          handleChange={handleReactSelectChange}
        />
        <ReactSelect
          placeholderName={t("environment Not Suitable")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"environmentNotSuitable"}
          name="environmentNotSuitable"
          value={String(values?.environmentNotSuitable)}
          removeIsClearable={true}
          dynamicOptions={yesNoOptions}
          handleChange={handleReactSelectChange}
        />

        {/* <ReactSelect
                    placeholderName={t(
                        "chkOther"
                    )}
                    respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                    id={"chkOther"}
                    name="chkOther"
                    value={String(values?.chkOther)}
                    removeIsClearable={true}
                    dynamicOptions={yesNoOptions}
                    handleChange={handleReactSelectChange}
                /> */}
        <DatePicker
          className={`custom-calendar `}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id="dateOfAdmission"
          name="dateOfAdmission"
          // inputClassName={"required-fields"}
          value={values?.dateOfAdmission ? values?.dateOfAdmission : new Date()}
          handleChange={handleChange}
          lable={t("date Of Admission")}
          placeholder={VITE_DATE_FORMAT}
        />
        <DatePicker
          className={`custom-calendar `}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id="dateOfLeaving"
          name="dateOfLeaving"
          // inputClassName={"required-fields"}
          value={values?.dateOfLeaving}
          // value={values?.dateOfLeaving ? values?.dateOfLeaving : new Date()}
          handleChange={handleChange}
          lable={t("Date of Leaving")}
          placeholder={VITE_DATE_FORMAT}
        />
        <TextAreaInput
          type="text"
          className="form-textarea"
          id="otherCommentIfAny"
          name="otherCommentIfAny"
          value={values.otherCommentIfAny || ""}
          onChange={handleChange}
          lable={t("Other Comment If Any")}
          placeholder=""
          respclass="col-xl-4 col-md-3 col-sm-4 col-12"
        />
        <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
          <DatePicker
            className={`custom-calendar `}
            respclass="vital-sign-date mr-2"
            id="dateTime"
            name="dateTime"
            value={values?.dateTime ? values?.dateTime : new Date()}
            handleChange={handleChange}
            lable={t("date Time")}
            placeholder={VITE_DATE_FORMAT}
          />
          <TimePicker
            placeholderName={t("Time")}
            lable={t("Time")}
            id="time1"
            respclass="vital-sign-date"
            name="time1"
            value={values?.time1 ? values?.time1 : new Date()}
            // value={new Date(`1970-01-01T00:00:00`)}
            handleChange={handleChange}
          />
        </div>
        <Input
          type="text"
          className="form-control"
          id="nurseName"
          name="nurseName"
          value={values?.nurseName ? values?.nurseName : ""}
          onChange={handleChange}
          lable={t("nurse Name")}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          placeholder=""
        />
        <Input
          type="text"
          className="form-control"
          id="dischargeDiagnosis"
          name="dischargeDiagnosis"
          value={values?.dischargeDiagnosis ? values?.dischargeDiagnosis : ""}
          onChange={handleChange}
          lable={t("Discharge Diagnosis")}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          placeholder=""
        />
        <ReactSelect
          placeholderName={t("Diagnosis Summary Provided to Patient")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"diagnosisSummary"}
          name="diagnosisSummary"
          value={String(values?.diagnosisSummary)}
          removeIsClearable={true}
          dynamicOptions={yesNoOptions}
          handleChange={handleReactSelectChange}
        />
        <TextAreaInput
          type="text"
          className="form-textarea"
          id="riskAndTeachingDone"
          name="riskAndTeachingDone"
          value={values.riskAndTeachingDone || ""}
          onChange={handleChange}
          lable={t("RISKS & TEACHING")}
          placeholder=""
          respclass="col-xl-4 col-md-3 col-sm-4 col-12"
        />
        <TextAreaInput
          type="text"
          className="form-textarea"
          id="physicianComments"
          name="physicianComments"
          value={values.physicianComments || ""}
          onChange={handleChange}
          lable={t("Physician Comments")}
          placeholder=""
          respclass="col-xl-4 col-md-3 col-sm-4 col-12"
        />
        {tableData?.length > 0 ? (
          <div className="col-12">
            {values?.id && (
              <button
                className="btn btn-primary"
                type="button"
                style={{ float: "right" }}
                onClick={handleSave}
              >
                {t("Update")}
              </button>
            )}
          </div>
        ) : (
          <div className="col-12">
            <button
              className="btn btn-primary"
              type="button"
              style={{ float: "right" }}
              onClick={handleSave}
            >
              {values?.id ? t("Update") : t("Save")}
            </button>
          </div>
        )}
      </div>
      {tableData?.length > 0 ? (
        <>
          <Heading title={t("List of Leaving Against Medical Advice")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              UHID: item?.patientID,
              EnterBy: item?.employeeName,
              Action: (
                <>
                  <button className="btn btn-sm btn-success">
                    <i
                      className="fa fa-edit"
                      aria-hidden="true"
                      onClick={() => {
                        handleEdit(item);
                      }}
                    ></i>
                  </button>
                  <button className="btn btn-sm btn-success mx-2">
                    <i
                      className="fa fa-print"
                      aria-hidden="true"
                      onClick={() => {
                        handlePrint();
                      }}
                    ></i>
                  </button>
                </>
              ),
            }))}
          />
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default LeaveAgainstMedicalAdvice;
