import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import Input from "../formComponent/Input";
import moment from "moment";
import { notify } from "../../utils/ustil2";
import Tables from "../UI/customTable";
import { RedirectURL } from "../../networkServices/PDFURL";
import Heading from "../UI/Heading";
import {
  getMedicalCareCheckListByPIdApi,
  medicalCareCheckListReportApi,
  saveOrUpdateMedicalCareApi,
} from "../../networkServices/Emergency";

const MedicalCareCheckList = ({ data }) => {
  const { patientID, transactionID } = data;
  const [t] = useTranslation();
  const initialValues = {
    feedingNutritionist: "",
    familyCareUpdates: "",
    appropriateDiagnosis: "",
    confirmed: "",
    differential: "",
    appropriateTreatment: "",
    painKiller: "",
    antibiotic: "",
    allergies: "",
    vitalSignsAssessment: "",
    steroidsCaution: "",
    sleepingPattern: "",
    skinCare: "",
    safetySecurity: "",
    thrombolyticProphylaxis: "",
    appropriateTest: "",
    transfusionCaution: "",
    handWashingInfectionPrevention: "",
    hemorrhage: "",
    ulcerProphylaxis: "",
    urineOutput: "",
    glycaemicMonitoring: "",
    gutPattern: "",
    compassinateCare: "",
    communication: "",
    earlyAmbulation: "",
    accountsDischarge: "",
    accommodationComfort: "",
    reportingRecording: "",
    rehabilitationSupport: "",
    patientFamilyEducation: "",
    cleanEnvironment: "",
    nurseSignature: "",
  };

  const { VITE_DATE_FORMAT } = import.meta.env;

  const [values, setValues] = useState({
    initialValues,
    DATE: new Date(),
    Time: new Date(),
  });
  const [tableData, setTableData] = useState([]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({ ...val, [name]: value }));
  };
  const handleSave = async () => {
    const data = {
      id: values?.id || 0,
      patientId: patientID || "",
      transactionID: transactionID || "",
      date: values?.DATE
        ? moment(values.DATE).format("YYYY-MM-DD")
        : values?.DATE,
      time: values?.Time ? moment(values.Time).format("hh:mm A") : null,

      feedingNutritionist: values?.feedingNutritionist || "",
      familyCareUpdates: values?.familyCareUpdates || "",
      appropriateDiagnosis: values?.appropriateDiagnosis || "",
      confirmed: values?.confirmed || "",
      differential: values?.differential || "",
      appropriateTreatment: values?.appropriateTreatment || "",
      painKiller: values?.painKiller || "",
      antibiotic: values?.antibiotic || "",
      allergies: values?.allergies || "",

      vitalSignsAssessment: values?.vitalSignsAssessment || "",
      steroidsCaution: values?.steroidsCaution || "",
      sleepingPattern: values?.sleepingPattern || "",
      skinCare: values?.skinCare || "",
      safetySecurity: values?.safetySecurity || "",
      thrombolyticProphylaxis: values?.thrombolyticProphylaxis || "",
      appropriateTest: values?.appropriateTest || "",
      transfusionCaution: values?.transfusionCaution || "",
      handWashingInfectionPrevention:
        values?.handWashingInfectionPrevention || "",
      hemorrhage: values?.hemorrhage || "",
      ulcerProphylaxis: values?.ulcerProphylaxis || "",
      urineOutput: values?.urineOutput || "",
      glycaemicMonitoring: values?.glycaemicMonitoring || "",
      gutPattern: values?.gutPattern || "",
      compassinateCare: values?.compassinateCare || "",
      communication: values?.communication || "",
      earlyAmbulation: values?.earlyAmbulation || "",
      accountsDischarge: values?.accountsDischarge || "",
      accommodationComfort: values?.accommodationComfort || "",
      reportingRecording: values?.reportingRecording || "",
      rehabilitationSupport: values?.rehabilitationSupport || "",
      patientFamilyEducation: values?.patientFamilyEducation || "",
      cleanEnvironment: values?.cleanEnvironment || "",
      nurseSignature: values?.nurseSignature || "",
    };
    const res = await saveOrUpdateMedicalCareApi(data);
    if (res?.success) {
      notify(res?.message, "success");
      setValues(initialValues)
      fetchList();
    } else {
      notify(res?.message, "error");
    }
  };
  const handleEdit = (editData) => {
    const timeFormateDate = (time) => {
      if (typeof time === "string") {
        const date = new Date();
        if (time) {
          const [hours, minutes, period] = time
            ?.match(/(\d+):(\d+)\s*(AM|PM)/i)
            ?.slice(1);
          date.setHours(
            period === "PM" && hours !== "12"
              ? +hours + 12
              : hours === "12" && period === "AM"
                ? 0
                : +hours
          );
          date.setMinutes(+minutes);
        }
        return date;
      }
    };
    setValues((prev) => ({
      ...prev,
      ...editData,
      DATE: editData?.date ? new Date(editData?.date) : new Date(),
      Time: editData?.time ? timeFormateDate(editData?.time) : new Date(),
    }));
  };
  const tableHead = [
    { name: t("S.No."), width: "60px" },
    { name: t("Date"), width: "120px" },
    { name: t("Time"), width: "100px" },
    { name: t("Feeding / Nutritionist (Mode)"), width: "250px" },
    { name: t("Family Care (Updates)"), width: "200px" },
    { name: t("Appropriate Diagnosis Made"), width: "220px" },
    { name: t("Confirmed"), width: "140px" },
    { name: t("Differential"), width: "140px" },
    { name: t("Appropriate Treatment"), width: "200px" },
    { name: t("Pain Killer"), width: "150px" },
    { name: t("Antibiotic"), width: "150px" },
    { name: t("Allergies"), width: "150px" },
    { name: t("Vital Signs & Assessment"), width: "250px" },
    { name: t("Steroids with Caution"), width: "200px" },
    { name: t("Sleeping Pattern"), width: "160px" },
    { name: t("Skin Care"), width: "140px" },
    { name: t("Safety / Security"), width: "150px" },
    { name: t("Thrombolytic Prophylaxis"), width: "200px" },
    { name: t("Appropriate Test"), width: "160px" },
    { name: t("Transfusion with Caution"), width: "200px" },
    { name: t("Hand Washing / Infection Prevention"), width: "260px" },
    { name: t("Hemorrhage"), width: "140px" },
    { name: t("Ulcer Prophylaxis"), width: "160px" },
    { name: t("Urine Output"), width: "150px" },
    { name: t("Glycaemic Monitoring"), width: "180px" },
    { name: t("Gut Pattern - BA"), width: "160px" },
    { name: t("Compassionate Care"), width: "180px" },
    { name: t("Communication w/ Patient & Family"), width: "260px" },
    { name: t("Early Ambulation"), width: "160px" },
    { name: t("Accounts / Discharge Preparation"), width: "260px" },
    { name: t("Accommodation / Comfort"), width: "200px" },
    { name: t("Reporting / Recording - Handover"), width: "260px" },
    { name: t("Rehabilitation / Psychological Support"), width: "280px" },
    { name: t("Patient / Family Education"), width: "220px" },
    { name: t("Clean Environment"), width: "180px" },
    { name: t("Nurse Signature"), width: "160px" },
    { name: t("Action"), width: "160px" },
  ];

  const fetchList = async () => {
    const res = await getMedicalCareCheckListByPIdApi(patientID);
    if (res?.success) {
      setTableData(res?.data);
    } else {
      setTableData([]);
      notify(res?.message, "error");
    }
  };
  const handlePrint = async () => {
    const res = await medicalCareCheckListReportApi(patientID, transactionID);
    if (res?.success) {
      RedirectURL(res?.data?.pdfUrl);
    } else {
      notify(res?.message, "error");
    }
  };
  useEffect(() => {
    fetchList();
  }, []);
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading
          title={t("Medical Care CheckList")}
          isBreadcrumb={false}
          secondTitle={
            <div className=" flex">
              <button
                className="btn btn-primary"
                type="button"
                style={{ float: "right" }}
                onClick={handleSave}
              >
                {values?.id ? t("Update") : t("Save")}
              </button>
              <button
                className="btn btn-primary mr-2"
                type="button"
                style={{ float: "right" }}
                onClick={handlePrint}
              >
                {t("Print")}
              </button>
            </div>
          }
        />
        <div className="row p-2">
          <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
            <DatePicker
              className={`custom-calendar `}
              respclass="vital-sign-date mr-1"
              id="DATE"
              name="DATE"
              inputClassName={"required-fields"}
              value={values?.DATE ? values?.DATE : new Date()}
              handleChange={handleChange}
              lable={t("DATE")}
              placeholder={VITE_DATE_FORMAT}
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="Time"
              respclass="vital-sign-date"
              name="Time"
              value={values?.Time ? values?.Time : new Date()}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
          </div>
          <div className="col-sm-6 col-12  col-md-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: 4,
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("F")}
              </label>

              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="feedingNutritionist"
                  name="feedingNutritionist"
                  value={values?.feedingNutritionist}
                  onChange={handleChange}
                  lable={t("Feeding / Nutritionist Required")}
                  respclass="col-sm-6 col-12"
                />

                <Input
                  type="text"
                  className="form-control"
                  id="familyCareUpdates"
                  name="familyCareUpdates"
                  value={values?.familyCareUpdates}
                  onChange={handleChange}
                  lable={t("Family Care Updates")}
                  respclass="col-sm-6 col-12"
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("t")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="thrombolyticProphylaxis"
                  name="thrombolyticProphylaxis"
                  value={values?.thrombolyticProphylaxis}
                  onChange={handleChange}
                  lable={t("thrombolyticProphylaxis ")}
                  respclass="col-sm-6  col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="appropriateTest"
                  name="appropriateTest"
                  value={values?.appropriateTest}
                  onChange={handleChange}
                  lable={t("appropriateTest")}
                  respclass="col-sm-6  col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="transfusionCaution"
                  name="transfusionCaution"
                  value={values?.transfusionCaution}
                  onChange={handleChange}
                  lable={t("transfusion Caution")}
                  respclass="col-sm-6  col-md-4 col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <div className="col-12">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("A")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="appropriateDiagnosis"
                  name="appropriateDiagnosis"
                  value={values?.appropriateDiagnosis}
                  onChange={handleChange}
                  lable={t("appropriate Diagnosis ")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="confirmed"
                  name="confirmed"
                  value={values?.confirmed}
                  onChange={handleChange}
                  lable={t("confirmed")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="differential"
                  name="differential"
                  value={values?.differential}
                  onChange={handleChange}
                  lable={t("Differential")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="appropriateTreatment"
                  name="appropriateTreatment"
                  value={values?.appropriateTreatment}
                  onChange={handleChange}
                  lable={t("appropriate Treatment ")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="painKiller"
                  name="painKiller"
                  value={values?.painKiller}
                  onChange={handleChange}
                  lable={t("Pain Killer")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="antibiotic"
                  name="antibiotic"
                  value={values?.antibiotic}
                  onChange={handleChange}
                  lable={t("Antibiotic")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="allergies"
                  name="allergies"
                  value={values?.allergies}
                  onChange={handleChange}
                  lable={t("Allergies")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="col-12">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("S")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="vitalSignsAssessment"
                  name="vitalSignsAssessment"
                  value={values?.vitalSignsAssessment}
                  onChange={handleChange}
                  lable={t("vitalSignsAssessment ")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="steroidsCaution"
                  name="steroidsCaution"
                  value={values?.steroidsCaution}
                  onChange={handleChange}
                  lable={t("steroidsCaution")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="transfusionCaution"
                  name="sleepingPattern"
                  value={values?.sleepingPattern}
                  onChange={handleChange}
                  lable={t("sleeping Pattern")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="skinCare"
                  name="skinCare"
                  value={values?.skinCare}
                  onChange={handleChange}
                  lable={t("skin Care")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="safetySecurity"
                  name="safetySecurity"
                  value={values?.safetySecurity}
                  onChange={handleChange}
                  lable={t("safety Security")}
                  respclass="col-sm-6 col-lg-2 col-md-4 col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("H")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="handWashingInfectionPrevention"
                  name="handWashingInfectionPrevention"
                  value={values?.handWashingInfectionPrevention}
                  onChange={handleChange}
                  lable={t("handWashingInfectionPrevention ")}
                  respclass="col-sm-6 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="hemorrhage"
                  name="hemorrhage"
                  value={values?.hemorrhage}
                  onChange={handleChange}
                  lable={t("hemorrhage")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("U")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="ulcerProphylaxis"
                  name="ulcerProphylaxis"
                  value={values?.ulcerProphylaxis}
                  onChange={handleChange}
                  lable={t("ulcerProphylaxis")}
                  respclass="col-sm-6 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="urineOutput"
                  name="urineOutput"
                  value={values?.urineOutput}
                  onChange={handleChange}
                  lable={t("urineOutput")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("G")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="glycaemicMonitoring"
                  name="glycaemicMonitoring"
                  value={values?.glycaemicMonitoring}
                  onChange={handleChange}
                  lable={t("glycaemicMonitoring")}
                  respclass="col-sm-6 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="gutPattern"
                  name="gutPattern"
                  value={values?.gutPattern}
                  onChange={handleChange}
                  lable={t("gutPattern")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("C")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="compassinateCare"
                  name="compassinateCare"
                  value={values?.compassinateCare}
                  onChange={handleChange}
                  lable={t("compassinateCare")}
                  respclass="col-sm-6 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="communication"
                  name="communication"
                  value={values?.communication}
                  onChange={handleChange}
                  lable={t("communication")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("A")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="earlyAmbulation"
                  name="earlyAmbulation"
                  value={values?.earlyAmbulation}
                  onChange={handleChange}
                  lable={t("earlyAmbulation")}
                  respclass="col-sm-6 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="accountsDischarge"
                  name="accountsDischarge"
                  value={values?.accountsDischarge}
                  onChange={handleChange}
                  lable={t("accountsDischarge")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="accommodationComfort"
                  name="accommodationComfort"
                  value={values?.accommodationComfort}
                  onChange={handleChange}
                  lable={t("accommodationComfort")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("R")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="reportingRecording"
                  name="reportingRecording"
                  value={values?.reportingRecording}
                  onChange={handleChange}
                  lable={t("reportingRecording")}
                  respclass="col-sm-6 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="rehabilitationSupport"
                  name="rehabilitationSupport"
                  value={values?.rehabilitationSupport}
                  onChange={handleChange}
                  lable={t("rehabilitationSupport")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("E")}
              </label>
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="patientFamilyEducation"
                  name="patientFamilyEducation"
                  value={values?.patientFamilyEducation}
                  onChange={handleChange}
                  lable={t("patientFamilyEducation")}
                  respclass="col-sm-6 col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="cleanEnvironment"
                  name="cleanEnvironment"
                  value={values?.cleanEnvironment}
                  onChange={handleChange}
                  lable={t("cleanEnvironment")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
                <Input
                  type="text"
                  className="form-control"
                  id="nurseSignature"
                  name="nurseSignature"
                  value={values?.nurseSignature}
                  onChange={handleChange}
                  lable={t("nurseSignature")}
                  respclass="col-sm-6  col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
        </div>

        {tableData?.length > 0 ? (
          <>
            <Heading title={t("List")} isBreadcrumb={false} />
            <Tables
              thead={tableHead}
              tbody={tableData?.map((item, index) => ({
                SNo: index + 1,
                Date: item?.date || "",
                Time: item?.time || "",
                FeedingNutritionist: item?.feedingNutritionist || "",
                FamilyCareUpdates: item?.familyCareUpdates || "",
                AppropriateDiagnosis: item?.appropriateDiagnosis || "",
                Confirmed: item?.confirmed || "",
                Differential: item?.differential || "",
                AppropriateTreatment: item?.appropriateTreatment || "",
                PainKiller: item?.painKiller || "",
                Antibiotic: item?.antibiotic || "",
                Allergies: item?.allergies || "",
                VitalSignsAssessment: item?.vitalSignsAssessment || "",
                SteroidsCaution: item?.steroidsCaution || "",
                SleepingPattern: item?.sleepingPattern || "",
                SkinCare: item?.skinCare || "",
                SafetySecurity: item?.safetySecurity || "",
                ThrombolyticProphylaxis: item?.thrombolyticProphylaxis || "",
                AppropriateTest: item?.appropriateTest || "",
                TransfusionCaution: item?.transfusionCaution || "",
                HandWashingInfectionPrevention:
                  item?.handWashingInfectionPrevention || "",
                Hemorrhage: item?.hemorrhage || "",
                UlcerProphylaxis: item?.ulcerProphylaxis || "",
                UrineOutput: item?.urineOutput || "",
                GlycaemicMonitoring: item?.glycaemicMonitoring || "",
                GutPattern: item?.gutPattern || "",
                CompassinateCare: item?.compassinateCare || "",
                Communication: item?.communication || "",
                EarlyAmbulation: item?.earlyAmbulation || "",
                AccountsDischarge: item?.accountsDischarge || "",
                AccommodationComfort: item?.accommodationComfort || "",
                ReportingRecording: item?.reportingRecording || "",
                RehabilitationSupport: item?.rehabilitationSupport || "",
                PatientFamilyEducation: item?.patientFamilyEducation || "",
                CleanEnvironment: item?.cleanEnvironment || "",
                NurseSignature: item?.nurseSignature || "",
                Action: (
                  <i
                    className="fa fa-edit"
                    aria-hidden="true"
                    onClick={() => {
                      handleEdit(item);
                    }}
                  ></i>
                ),
              }))}
              scrollView={"scrollView"}
              style={{ maxHeight: "23vh" }}
            />
          </>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default MedicalCareCheckList;
