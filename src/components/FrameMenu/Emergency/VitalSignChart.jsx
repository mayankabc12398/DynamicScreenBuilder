import React, { useEffect, useState } from "react";
import Heading from "../../UI/Heading";
import { useTranslation } from "react-i18next";
import DatePicker from "../../formComponent/DatePicker";
import TimePicker from "../../formComponent/TimePicker";
import Input from "../../formComponent/Input";
import TextAreaInput from "../../formComponent/TextAreaInput";
import Tables from "../../UI/customTable";
import {
  SaveVitalSignChart,
  SearchVitalSignChart,
  UpdateVitalSignChart,
} from "../../../networkServices/nursingWardAPI";
import {
  MOBILE_NUMBER_VALIDATION_REGX,
  NUMBER_VALIDATION_REGX,
} from "../../../utils/constant";
import {
  handleReactSelectDropDownOptions,
  inputBoxValidation,
  notify,
  payloadVitalSignChart,
} from "../../../utils/utils";
import moment from "moment";
import { OpenPDFURL } from "../../../networkServices/PDFURL";
import ReactSelect from "../../formComponent/ReactSelect";
import { BindBloodGroup } from "../../../networkServices/BillingsApi";
import SystolicDiagnosisChart from "../../commonComponents/VitalCharts";

// ── Live "critical vital" detection while the nurse types. Ranges are in the
//    units this form captures (Temp is °C). Purely additive: it only surfaces a
//    warning banner — it does NOT block saving or change any existing flow. ──
const CAPTURE_RANGES = {
  Temp: { min: 36.0, max: 37.5, label: "Temp", unit: "°C" },
  pulse: { min: 60, max: 100, label: "Pulse", unit: "ppm" },
  resp: { min: 12, max: 20, label: "Resp", unit: "/min" },
  SPO2: { min: 95, max: 100, label: "SPO2", unit: "%" },
  BloodSugar: { min: 3.9, max: 11, label: "Blood Sugar", unit: "mmol/L" },
  HeartRate: { min: 60, max: 100, label: "Heart Rate", unit: "bpm" },
  PainScore: { min: 0, max: 3, label: "Pain Score" },
  BP: { parse: "bp", min: "90/60", max: "140/90", label: "BP", unit: "mmHg" },
};
const captureToNum = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
// Returns the list of currently-typed vitals that are out of range.
const getCriticalVitals = (values) =>
  Object.entries(CAPTURE_RANGES).reduce((acc, [name, cfg]) => {
    const raw = (values?.[name] ?? "").toString().trim();
    if (raw === "" || raw === "-") return acc;
    if (cfg.parse === "bp") {
      const [sys, dia] = raw.split("/").map(captureToNum);
      const [sysMin, diaMin] = String(cfg.min).split("/").map(Number);
      const [sysMax, diaMax] = String(cfg.max).split("/").map(Number);
      const bad =
        (sys != null && (sys < sysMin || sys > sysMax)) ||
        (dia != null && (dia < diaMin || dia > diaMax));
      if (bad) acc.push({ label: cfg.label, value: `${raw} ${cfg.unit}`, range: `${cfg.min}–${cfg.max}` });
      return acc;
    }
    const n = captureToNum(raw);
    if (n != null && (n < cfg.min || n > cfg.max)) {
      acc.push({ label: cfg.label, value: `${raw}${cfg.unit ? " " + cfg.unit : ""}`, range: `${cfg.min}–${cfg.max}${cfg.unit ? " " + cfg.unit : ""}` });
    }
    return acc;
  }, []);

// Inject the pulse keyframes once for the live capture alert.
if (typeof document !== "undefined" && !document.getElementById("vital-capture-alert-style")) {
  const s = document.createElement("style");
  s.id = "vital-capture-alert-style";
  s.textContent =
    "@keyframes vitalCaptureGlow{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.45)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}";
  document.head.appendChild(s);
}

export default function ({ data }) {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const thead = [
    { width: "1%", name: t("S No.") },
    t("Date"),
    t("Time"),
    t("Temperature"),
    t("Pulse"),
    t("Resp"),
    t("BP"),
    // t("Wounds"),
    // t("Drains"),
    t("BloodSugar"),
    t("Weight"),
    t("SHeight"),
    // t("POD"),
    // t("Oxygen"),
    t("Height"),
    t("BMI"),
    t("IBW"),
    t("BSA"),
    t("Blood Group"),
    t("PainScore"),
    t("ArmSpan"),
    t("Comments"),
    t("Alcohol"),
    t("Smoking"),
    t("Diabetes"),
    t("Isimplant"),
    t("IsPregnancy"),
    t("EntryBy"),
    t("Edit"),
  ];

  const initialValue = {
    transactionID: data?.transactionID,
    patientID: data?.patientID,
    type: "save",
    UnableToDrinkOrBreastfeed: "0",
    VomitsEverything: "0",
    HadConvulsions: "0",
    IsLethargicOrUnconscious: "0",
    IsConvulsingNow: "0",
    Alcohol: "0",
    Smoking: "0",
    Diabetes: "0",
    Pregnant: "0",
    Implant: "0",
    Cough2WeeksOrHIVPositive: "0",
    PersistentFever2Weekse: "0",
    UnexplainedWeightLoss: "0",
    DrenchingNightSweats: "0",
    // bloodGroup: { label: "A+", value: "A+" },
    // muac:{label: "Red", value: "Red"}
  }
  const [tbody, setTbody] = useState([]);
  const [values, setValues] = useState(initialValue);
  const [DropDownState, setDropDownState] = useState({
    bloodGroup: [],
  })
  const TRUE_FALSE_OPTIONS = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];

  const MUAC = [
    { label: t("Red"), value: "Red" },
    { label: t("Green"), value: "Green" },
    { label: t("Yellow"), value: "Yellow" },
  ]
  const handleEdit = (val) => {
    const date = new Date();
    if (val?.Time) {
      const [hours, minutes, period] = val?.Time.match(
        /(\d+):(\d+)\s*(AM|PM)/i
      ).slice(1);
      date.setHours(
        period === "PM" && hours !== "12"
          ? +hours + 12
          : hours === "12" && period === "AM"
            ? 0
            : +hours
      );
      date.setMinutes(+minutes);
    }

    setValues({
      ...val,
      ...{
        transactionID: data?.transactionID,
        patientID: data?.patientID,
        Comments: val?.comments,
        SPO2: val?.Oxygen,
        type: "edit",
        Time: date,
        DATE: new Date(val?.DATE),
      },
      DrenchingNightSweats: val?.Drenchingnight,
      Pregnant: val?.IsPregnancy,
      Implant: val?.Isimplant,
      Cough2WeeksOrHIVPositive: val?.Cough,
      PersistentFever2Weeks: val?.Persistent,
      UnexplainedWeightLoss: val?.Unexplainedweight,
    });

  };
  console.log("sss", values);

  const SearchVitalSignChartAPI = async () => {
    let apiResp = await SearchVitalSignChart(data?.transactionID);
    if (apiResp?.success) {
      let data = [];

      apiResp?.data?.map((val, i) => {
        let obj = {};
        obj.sno = i + 1;
        obj.DATE = val?.DATE;
        obj.Time = val?.Time;
        obj.Temp = val?.Temp;
        obj.pulse = val?.pulse;
        obj.resp = val?.resp;
        obj.BP = val?.BP;
        // obj.wound = val?.wound;
        // obj.drains = val?.drains;
        obj.BloodSugar = val?.BloodSugar;
        obj.Weight = val?.Weight;
        obj.SHeight = val?.SittingHeight;
        // obj.POD = val?.POD;
        // obj.Oxygen = val?.Oxygen;
        obj.Height = val?.Height;
        obj.BMI = val?.BMI;
        obj.IBW = val?.IBW;
        obj.BSA = val?.BSA;
        obj.BloodGroup = val?.BloodGroup;
        obj.PainScore = val?.PainScore;
        obj.ArmSpan = val?.ArmSpan;
        obj.Comments = val?.comments;
        obj.Alcohol = val?.Alcohol === 0 ? "No" : "Yes";
        obj.Smoking = val?.Smoking === 0 ? "No" : "Yes";
        obj.Diabetes = val?.Diabetes === 0 ? "No" : "Yes";
        obj.Isimplant = val?.Isimplant === 0 ? "No" : "Yes";
        obj.IsPregnancy = val?.IsPregnancy === 0 ? "No" : "Yes";

        obj.Username = val?.Username;
        obj.edit = (
          <i
            className="fa fa-edit"
            aria-hidden="true"
            onClick={() => {
              handleEdit(val);
            }}
          ></i>
        );
        data.push(obj);
      });
      // setVitalSignList(apiResp?.data)
      setTbody(data);
    } else {
      setTbody([]);
    }
  };


  useEffect(() => {
    FetchAllDropDown();
    SearchVitalSignChartAPI();
  }, []);

  const ErrorHandling = () => {
    let errors = {};
    errors.id = [];
    if (!values?.Temp) {
      errors.Temp = "Temp Is Required";
    }
    if (!values?.pulse) {
      errors.pulse = "pulse Is Required";
    }
    if (!values?.resp) {
      errors.resp = "resp Is Required";
    }
    if (!values?.Weight) {
      errors.PanelCardName = "Weight Is Required";
    }
    if (!values?.Height) {
      errors.Height = "Height Is Required";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({ ...val, [name]: value }));
  };

  const SaveVitalSignChartAPI = async (type) => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 1) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[1], "error");
      }
      return false;
    }
    let payload = payloadVitalSignChart(values);

    let apiResp;
    if (type === "save") {
      apiResp = await SaveVitalSignChart(payload);
    } else {
      // console.log("Asdsd", payload)
      apiResp = await UpdateVitalSignChart(payload);
    }
    if (apiResp?.success) {
      SearchVitalSignChartAPI();
      setValues(initialValue);
      notify(apiResp.message, "success");
    } else {
      notify(apiResp.message, "error");
    }
  };

  const handleVitalPrintOut = async () => {

    OpenPDFURL("PrintVitalSignChart", data?.transactionID);
  //  const apiResp = await PrintVitalSignChart(data?.transactionID);
  //   console.log(apiResp);
  //   RedirectURL(apiResp.data.pdfUrl);
  }


  useEffect(() => {
    const weight = parseFloat(values?.Weight);
    const height = parseFloat(values?.Height);

    // if either missing, reset BMI and BSA
    if (!weight || !height) {
      setValues((val) => ({
        ...val,
        bmiValue: null,
        bmiStatus: null,
        bsaValue: null,
      }));
      return;
    }


    const heightInMeters = height / 100;
    const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(2);

    let bmiStatus = "";
    if (bmiValue < 18.5) bmiStatus = "Underweight";
    else if (bmiValue < 24.9) bmiStatus = "Normal weight";
    else if (bmiValue < 29.9) bmiStatus = "Overweight";
    else bmiStatus = "Obesity";


    const bsaValue = Math.sqrt((height * weight) / 3600).toFixed(2);

    setValues((val) => ({
      ...val,
      bmiValue,
      bmiStatus,
      bsaValue,
    }));
  }, [values?.Weight, values?.Height]);

  const getBindBloodGroup = async () => {
    try {
      const data = await BindBloodGroup();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };
  const FetchAllDropDown = async () => {
    try {
      const [bloodGroupData] = await Promise.all([
        // getBindBloodRequisition(),
        getBindBloodGroup(),
        // getBindProductRequsition(),
        // getBindBloodNatuareOfReaction(),
      ]);

      const dropDownData = {

        bloodGroup: handleReactSelectDropDownOptions(
          bloodGroupData,
          "bloodgroup",
          "id"
        ),
      };

      setDropDownState(dropDownData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleReactSelectChange = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));
  }


  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <form className="patient_registration card">
          <Heading
            title={t("VITAL SIGN")}
            isBreadcrumb={false}
          />

          {/* Live critical-vital alert — updates as the nurse types. Additive only. */}
          {(() => {
            const critical = getCriticalVitals(values);
            if (critical.length === 0) return null;
            return (
              <div
                role="alert"
                className="mx-2 mt-2"
                style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  border: "1px solid #fecaca", background: "#fef2f2",
                  borderLeft: "4px solid #ef4444", borderRadius: "10px",
                  padding: "9px 12px", animation: "vitalCaptureGlow 1.6s ease-in-out infinite",
                }}
              >
                <i className="fas fa-triangle-exclamation" style={{ color: "#ef4444", fontSize: "16px", marginTop: "1px" }} aria-hidden="true" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#b91c1c", marginBottom: "3px" }}>
                    {t("Critical vital value entered")} ({critical.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {critical.map((c) => (
                      <span key={c.label} style={{ fontSize: "11px", fontWeight: 600, color: "#fff", background: "#ef4444", borderRadius: "6px", padding: "2px 8px", whiteSpace: "nowrap" }}>
                        {t(c.label)}: {c.value}
                        <span style={{ opacity: 0.85, fontWeight: 400 }}> · {t("normal")} {c.range}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="row p-2">
            <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
              <DatePicker
                className={`custom-calendar `}
                respclass="vital-sign-date"
                id="Date"
                name="DATE"
                inputClassName={"required-fields"}
                value={values?.DATE ? values?.DATE : new Date()}
                handleChange={handleChange}
                lable={t("Date")}
                placeholder={VITE_DATE_FORMAT}
              />
              <TimePicker
                placeholderName={t("Time")}
                lable={t("Time")}
                id="Time"
                respclass="vital-sign-time ml-1"
                name="Time"
                value={values?.Time ? values?.Time : new Date()}
                // value={new Date(`1970-01-01T00:00:00`)}
                handleChange={handleChange}
              />
            </div>

            <Input
              type="text"
              className="form-control required-fields"
              id="Temp"
              name="Temp"
              value={values?.Temp ? values?.Temp : ""}
              onChange={handleChange}
              // onChange={(e) => { inputBoxValidation(NUMBER_VALIDATION_REGX, e, handleChange) }}
              lable={t("Temp")}
              placeholder=" "
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholderLabel={"°C"}
            />
            <Input
              type="text"
              className="form-control required-fields"
              id="pulse"
              name="pulse"
              value={values?.pulse ? values?.pulse : ""}
              onChange={handleChange}
              lable={t("Pulse")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"ppm"}
            />
            <Input
              type="text"
              className="form-control required-fields"
              id="Resp"
              name="resp"
              value={values?.resp ? values?.resp : ""}
              onChange={handleChange}
              lable={t("Resp")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"Rate/Min"}
            />
            <Input
              type="text"
              className="form-control "
              id="BP"
              name="BP"
              value={values?.BP ? values?.BP : ""}
              onChange={handleChange}
              lable={t("BP")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"mm/Hg"}
            />
            {/* <Input
              type="text"
              className="form-control "
              id="Wounds"
              name="wound"
              value={values?.wound ? values?.wound : ""}
              onChange={handleChange}
              lable={t("Wounds")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
            /> */}
            {/* <Input
              type="text"
              className="form-control "
              id="drains"
              name="drains"
              value={values?.drains ? values?.drains : ""}
              onChange={handleChange}
              lable={t("Drains")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"ml"}
            /> */}
            <Input
              type="text"
              className="form-control required-fields"
              id="Height"
              name="Height"
              value={values?.Height ? values?.Height : ""}
              onChange={handleChange}
              lable={t("Height")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"CM"}
            />
            <Input
              type="text"
              className="form-control required-fields"
              id="Weight"
              name="Weight"
              value={values?.Weight ? values?.Weight : ""}
              onChange={handleChange}
              lable={t("Weight")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"kg"}
            />
            <Input
              type="text"
              className="form-control"
              id="ArmSpan"
              name="ArmSpan"
              value={values?.ArmSpan ? values?.ArmSpan : ""}
              onChange={handleChange}
              lable={t("Arm Span")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"cm"}
            />
            <Input
              type="text"
              className="form-control"
              id="SittingHeight"
              name="SittingHeight"
              value={values?.SittingHeight ? values?.SittingHeight : ""}
              onChange={handleChange}
              lable={t("Sitting Height")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"cm"}
            />
            <Input
              type="text"
              className="form-control "
              id="IBW"
              name="IBW"
              value={values?.IBW ? values?.IBW : ""}
              onChange={handleChange}
              lable={t("IBW")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"kg/m²"}
            />
            {/* <Input
              type="text"
              className="form-control "
              id="POD"
              name="POD"
              value={values?.POD ? values?.POD : ""}
              onChange={handleChange}
              lable={t("POD")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"Days"}
            /> */}
            <Input
              type="text"
              className="form-control "
              id="BloodSugar"
              name="BloodSugar"
              value={values?.BloodSugar ? values?.BloodSugar : ""}
              onChange={handleChange}
              lable={t("BloodSugar")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"mmol/L"}
            />
            <Input
              type="text"
              className="form-control "
              id="SPO2"
              name="SPO2"
              value={values?.SPO2 ? values?.SPO2 : ""}
              onChange={handleChange}
              lable={t("SPO2")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"%"}
            />
            <Input
              type="text"
              className="form-control "
              id="painScore"
              name="PainScore"
              value={values?.PainScore ? values?.PainScore : ""}
              onChange={handleChange}
              lable={t("Pain Score")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"%"}
            />

            <Input
              type="text"
              className="form-control "
              id="GCS"
              name="GCS"
              value={values?.GCS ? values?.GCS : ""}
              onChange={handleChange}
              lable={t("GCS")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
            />
            <Input
              type="text"
              className="form-control "
              id="CIWA"
              name="CIWA"
              value={values?.CIWA ? values?.CIWA : ""}
              onChange={handleChange}
              lable={t("CIWA")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
            />

            <ReactSelect
              placeholderName={t("Blood Group")}
              name="BloodGroup"
              value={`${values?.BloodGroup?.value ? values?.BloodGroup?.value : values?.BgId}`}
              handleChange={handleReactSelectChange}
              // requiredClassName={"required-fields"}
              dynamicOptions={DropDownState?.bloodGroup}
              searchable={true}
              id={"bloodGroup"}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Muac Select")}
              name="MUAC"
              value={`${values?.MUAC?.value ? values?.MUAC?.value : values?.MUAC}`}
              handleChange={handleReactSelectChange}
              // requiredClassName={"required-fields"}
              dynamicOptions={MUAC}
              searchable={true}
              id={"muac"}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />

            <Input
              type="text"
              className="form-control "
              id="HeartRate"
              name="HeartRate"
              value={values?.HeartRate ? values?.HeartRate : ""}
              onChange={handleChange}
              lable={t("HeartRate")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
            />

            <TextAreaInput
              type="text"
              className={`form-textarea `}
              id="Comments"
              name="Comments"
              value={values?.Comments ? values?.Comments : ""}
              onChange={handleChange}
              lable={t("Comments")}
              placeholder=" "
              respclass="col-12"
            />



            {/* <Input
              type="text"
              className="form-control "
              id="BMI"
              name="BMI"
              value={values?.BMI ? values?.BMI : ""}
              onChange={handleChange}
              lable={t("BMI")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"kg/m²"}
            /> */}

            {/* <Input
              type="text"
              className="form-control "
              id="BSA"
              name="BSA"
              value={values?.BSA ? values?.BSA : ""}
              onChange={handleChange}
              lable={t("BSA")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=" "
              placeholderLabel={"m²"}
            /> */}


            <ReactSelect
              placeholderName={t("Unable to drink or breastfeed")}
              name="UnableToDrinkOrBreastfeed"
              value={values?.UnableToDrinkOrBreastfeed ? values?.UnableToDrinkOrBreastfeed : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="UnableToDrinkOrBreastfeed"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />


            <ReactSelect
              placeholderName={t("Vomits everything")}
              name="VomitsEverything"
              value={values?.VomitsEverything ? values?.VomitsEverything : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="unableToDrinkOrBreastfeed"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Had Convulsions in this illness")}
              name="HadConvulsions"
              value={values?.HadConvulsions ? values?.HadConvulsions : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="HadConvulsions"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Is lethargic or Unconscious")}
              name="IsLethargicOrUnconscious"
              value={values?.IsLethargicOrUnconscious ? values?.IsLethargicOrUnconscious : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="isLethargicOrUnconscious"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />

            <ReactSelect
              placeholderName={t("Is convulsing now")}
              name="IsConvulsingNow"
              value={values?.IsConvulsingNow ? values?.IsConvulsingNow : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="isConvulsingNow"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />

            <ReactSelect
              placeholderName={t("Alcohol")}
              name="Alcohol"
              value={values?.Alcohol ? values?.Alcohol : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="alcohol"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />

            <ReactSelect
              placeholderName={t("Smoking")}
              name="Smoking"
              value={values?.Smoking ? values?.Smoking : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="smoking"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />

            <ReactSelect
              placeholderName={t("Diabetes")}
              name="Diabetes"
              value={values?.Diabetes ? values?.Diabetes : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="diabetes"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Pregnant")}
              name="Pregnant"
              value={values?.Pregnant ? values?.Pregnant : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="Pregnant"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Implant")}
              name="Implant"
              value={values?.Implant ? values?.Implant : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="Implant"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />

            {values?.bmiValue && (
              <>
                <div className="col-md-3 d-flex align-items-center justify-content-end">
                  <p style={{ color: "red", fontWeight: "bold", margin: "0" }}>
                    {t("BMI Calculate:")} {values?.bmiValue}
                  </p>

                </div>
                <div className="col-md-3 d-flex align-items-center justify-content-end">
                  <p style={{ color: "red", fontWeight: "bold", margin: "0" }}>
                    {t("BSA Calculate:")} {values?.bsaValue}
                  </p>

                </div>
              </>
            )}
            {/* <TextAreaInput
              type="text"
              className={`form-textarea `}
              id="Comments"
              name="Comments"
              value={values?.Comments ? values?.Comments : ""}
              onChange={handleChange}
              lable={t("Comments")}
              placeholder=" "
              respclass=" col-12"
            /> */}

          </div>
          <Heading
            title={t("Adult TB Symptoms Screening")}
            isBreadcrumb={false}
          />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Cough ≥ 2 weeks OR of any duration if HIV positive")}
              name="Cough2WeeksOrHIVPositive"
              value={values?.Cough2WeeksOrHIVPositive ? values?.Cough2WeeksOrHIVPositive : "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="cough2WeeksOrHIVPositive"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Persistent fever ≥ 2 weeks")}
              name="PersistentFever2Weeks"
              value={values?.PersistentFever2Weeks || "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="persistentFever2Weeks"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Unexplained weight loss > 1.5 kg in a month")}
              name="UnexplainedWeightLoss"
              value={values?.UnexplainedWeightLoss || "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="unexplainedWeightLoss"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />
            <ReactSelect
              placeholderName={t("Drenching night sweats ≥ 2 weeks")}
              name="DrenchingNightSweats"
              value={values?.DrenchingNightSweats || "0"}
              handleChange={handleReactSelectChange}
              // requiredClassName="required-fields"
              dynamicOptions={TRUE_FALSE_OPTIONS}
              searchable={false}
              id="drenchingNightSweats"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              removeIsClearable={true}
            />

          </div>

          <div className="ml-2 mb-2">
            {/* <button
              className="btn btn-sm btn-success ml-2"
              type="button"
              style={{ float: "right" }}
              onClick={handleVitalPrintOut}
            >
              {t("Print")}
            </button> */}

            {values?.type === "save" ? (
              <button
                className="btn btn-sm btn-success"
                type="button"
                style={{ float: "right" }}
                onClick={() => {
                  SaveVitalSignChartAPI("save");
                }}
              >
                {t("Save")}
              </button>
            ) : (
              <button
                className="btn btn-sm btn-success"
                type="button"
                style={{ float: "right" }}
                onClick={() => {
                  SaveVitalSignChartAPI("update");
                }}
              >
                {t("Update")}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="patient_registration card">
        <Heading
          title={t("result")}
          isBreadcrumb={false}
        />

        <Tables
          thead={thead}
          tbody={tbody}
          tableHeight={"scrollView"}
        // tableHeight={"nurse-assignment-table-height"}
        />
      </div>
      <SystolicDiagnosisChart  tbody={tbody}/>
    </>
  );
}
