import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import {
  NursingWardSaveAnaethesticChart,
  NursingWardGetAnaethesticChart,
  NursingWardUpdateAnaethesticChart,
} from "../../networkServices/nursingWardAPI";
import TimePicker from "../formComponent/TimePicker";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";

const AestheticOperativeChart = ({ onClose, data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const [values, setValues] = useState({
    id: "",
    diagnosis: "",
    operation: "",
    anaesthetists: "",
    surgeons: "",
    assistants: "",
    premedication: "",
    date: "",
    timeIn: "",
    timeOut: "",
    effect: "",
    induction: "",
    airway: [],
    anaesthesiaTime: "",
    surgeryTime: "",
    bp: "",
    bptime: "",
    rr: "",
    rrtime: "",
    map: "",
    maptime: "",
    drugSelections: "",
    fluidSelections: "",
    fluidTime: "",
    drugTime: "",
    position: "",
    operatorResult: "",
    postOperative: "",
    temp: "",
    tempTime: "",
    type: "save",
  });
  const [tableData, setTableData] = useState([]);

  const ANAESTHETICRECORDS = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("Diagnosis") },
    { width: "5%", name: t("Operation") },
    { width: "5%", name: t("Anaesthetists") },
    { width: "5%", name: t("Surgeons") },
    { width: "5%", name: t("Assistants") },
    { width: "8%", name: t("Type of Premedication") },
    { width: "3%", name: t("Date") },
    { width: "5%", name: t("Time In") },
    { width: "5%", name: t("Time Out") },
    { width: "5%", name: t("Effect") },
    { width: "5%", name: t("Induction") },
    { width: "5%", name: t("Airway") },
    { width: "5%", name: t("Anaesthesia") },
    { width: "5%", name: t("Surgery") },
    { width: "3%", name: t("Edit") },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const patientId = data?.patientID;
      const transactionId = data?.transactionID;

      if (!patientId || !transactionId) {
        notify(t("Patient ID or Transaction ID missing"), "error");
        return;
      }

      let response = await NursingWardGetAnaethesticChart(patientId);

      if (response?.success) {
        setTableData(response.data);
      } else {
        notify(response?.message || "Failed to fetch data", "error");
      }
    } catch (error) {
      notify(error?.message || "Error fetching data", "error");
    }
  };

  const handleEdit = (row) => {
    const airwayOptions = [
      { name: "ORO/NASOPHARYGEAL R/L BLIND", value: "1" },
      { name: "ORO/NASOTRACHEAL CUFF PACK", value: "2" },
      { name: "ENDOTRACHEAL R/L UNDER MASK", value: "3" },
    ];

    const airwayArray = [
      row.AirwaySelections1,
      row.AirwaySelections2,
      row.AirwaySelections3,
    ]
      .filter(Boolean)
      .map((val) => {
        const option = airwayOptions.find((opt) => opt.value === String(val));
        return option ? option.value : val;
      });

    setValues({
      id: row.Id,
      diagnosis: row.Diagnosis || "",
      operation: row.Operation || "",
      anaesthetists: row.Anaesthetists || "",
      surgeons: row.Surgeons || "",
      assistants: row.Assistants || "",
      premedication: row.Premedication || "",
      date: row.Date || "",
      timeIn: row.TimeIn || "",
      timeOut: row.TimeOut || "",
      effect: row.Effect || "",
      induction: row.Induction || "",
      airway: airwayArray,
      anaesthesiaTime: row.AnaesthesiaTime || "",
      surgeryTime: row.SurgeryTime || "",
      bp: row.BP || "",
      bptime: row.BPTIME || "",
      rr: row.RR || "",
      rrtime: row.RRTIME || "",
      map: row.MAP || "",
      maptime: row.MAPTIME || "",
      drugSelections: row.DrugSelections || "",
      fluidSelections: row.FluidSelections || "",
      fluidTime: row.FluidTime || "",
      drugTime: row.DrugTime || "",
      position: row.Position || "",
      operatorResult: row.OperatorResult || "",
      postOperative: row.PostOperative || "",
      temp: row.Temp || "",
      tempTime: row.TempTime || "",
      type: "update",
    });
  };

  const resetForm = () => {
    setValues({
      id: 0,
      diagnosis: "",
      operation: "",
      anaesthetists: "",
      surgeons: "",
      assistants: "",
      premedication: "",
      date: "",
      timeIn: "",
      timeOut: "",
      effect: "",
      induction: "",
      airway: [],
      anaesthesiaTime: "",
      surgeryTime: "",
      bp: "",
      bptime: "",
      rr: "",
      rrtime: "",
      map: "",
      maptime: "",
      drugSelections: "",
      fluidSelections: "",
      fluidTime: "",
      drugTime: "",
      position: "",
      operatorResult: "",
      postOperative: "",
      temp: "",
      tempTime: "",
      type: "save",
    });
  };

  const handleSave = async () => {
    try {
      const airwayValues = Array.isArray(values.airway) ? values.airway : [];

      const payload = {
        id: 0,
        patientId: data?.patientID,
        transactionId: data?.transactionID,
        diagnosis: values?.diagnosis || "",
        operation: values?.operation || "",
        anaesthetists: values?.anaesthetists || "",
        surgeons: values?.surgeons || "",
        assistants: values?.assistants || "",
        premedication: values?.premedication || "",
        date: values?.date || null,
        timeIn: moment(values?.timeIn).format("hh:mm") || "",
        timeOut: values?.timeOut || "",
        effect: values?.effect || "",
        induction: values?.induction || "",
        airwaySelections1: airwayValues[0] || "",
        airwaySelections2: airwayValues[1] || "",
        airwaySelections3: airwayValues[2] || "",
        anaesthesiaTime: values?.anaesthesiaTime || "",
        surgeryTime: values?.surgeryTime || "",
        bp: values?.bp || "",
        bptime: values?.bptime || "",
        rr: values?.rr || "",
        rrtime: values?.rrtime || "",
        map: values?.map || "",
        maptime: values?.maptime || "",
        drugSelections: values?.drugSelections || "",
        fluidSelections: values?.fluidSelections || "",
        fluidTime: values?.fluidTime || "",
        drugTime: values?.drugTime || "",
        position: values?.position || "",
        operatorResult: values?.operatorResult || "",
        postOperative: values?.postOperative || "",
        temp: values?.temp || "",
        tempTime: values?.tempTime || "",
      };

      console.log("Payload sending to backend:", payload);

      let response = await NursingWardSaveAnaethesticChart(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        resetForm();
        await fetchTableData();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handleUpdate = async () => {
    try {
      const airwayValues = Array.isArray(values.airway) ? values.airway : [];

      const payload = {
        id: values.id,
        patientId: data?.patientID,
        transactionId: data?.transactionID,
        diagnosis: values?.diagnosis || "",
        operation: values?.operation || "",
        anaesthetists: values?.anaesthetists || "",
        surgeons: values?.surgeons || "",
        assistants: values?.assistants || "",
        premedication: values?.premedication || "",
        date: values?.date || null,
        timeIn: values?.timeIn || "",
        timeOut: values?.timeOut || "",
        effect: values?.effect || "",
        induction: values?.induction || "",
        airwaySelections1: airwayValues[0] || "",
        airwaySelections2: airwayValues[1] || "",
        airwaySelections3: airwayValues[2] || "",
        anaesthesiaTime: values?.anaesthesiaTime || "",
        surgeryTime: values?.surgeryTime || "",
        bp: values?.bp || "",
        bptime: values?.bptime || "",
        rr: values?.rr || "",
        rrtime: values?.rrtime || "",
        map: values?.map || "",
        maptime: values?.maptime || "",
        drugSelections: values?.drugSelections || "",
        fluidSelections: values?.fluidSelections || "",
        fluidTime: values?.fluidTime || "",
        drugTime: values?.drugTime || "",
        position: values?.position || "",
        operatorResult: values?.operatorResult || "",
        postOperative: values?.postOperative || "",
        temp: values?.temp || "",
        tempTime: values?.tempTime || "",
      };

      console.log("Payload sending to backend:", payload);

      let response = await NursingWardUpdateAnaethesticChart(payload);

      if (response?.success) {
        notify(t("Updated successfully"), "success");
        await fetchTableData();
        resetForm();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    const selectedArray = Array.isArray(selectedOptions)
      ? selectedOptions.map((opt) => opt.value || opt)
      : [];

    setValues({
      ...values,
      [name]: selectedArray,
    });
  };

  return (
    <div className="card">
      <Heading
        title={<span className="text-dark">{t("ANAESTHETIC RECORD")}</span>}
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
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="diagnosis"
          lable={t("Diagnosis")}
          placeholder=" "
          required={true}
          value={values?.diagnosis}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="diagnosis"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="operation"
          lable={t("Operation")}
          placeholder=" "
          required={true}
          value={values?.operation}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="operation"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="anaesthetists"
          lable={t("Anaesthetists")}
          placeholder=" "
          required={true}
          value={values?.anaesthetists}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="anaesthetists"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="surgeons"
          lable={t("Surgeons")}
          placeholder=" "
          required={true}
          value={values?.surgeons}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="surgeons"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="assistants"
          lable={t("Assistants")}
          placeholder=" "
          required={true}
          value={values?.assistants}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="assistants"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="premedication"
          lable={t("Type of Premedication")}
          placeholder=" "
          required={true}
          value={values?.premedication}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="premedication"
          onChange={handleChange}
        />
        <DatePicker
          className="custom-calendar"
          id="date"
          name="date"
          placeholder={VITE_DATE_FORMAT}
          value={values?.date}
          lable={t("Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          handleChange={handleDateTimeChange}
        />
        <TimePicker
          placeholderName={t("Time In")}
          lable={t("Time In")}
          id="timeIn"
          name="timeIn"
          value={values?.timeIn}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <TimePicker
          placeholderName={t("Time Out")}
          lable={t("Time Out")}
          id="timeOut"
          name="timeOut"
          value={values?.timeOut}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="effect"
          lable={t("Effect")}
          placeholder=" "
          required={true}
          value={values?.effect}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="effect"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="induction"
          lable={t("Induction")}
          placeholder=" "
          required={true}
          value={values?.induction}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="induction"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="airway"
          id="airway"
          placeholderName={t("Airway")}
          dynamicOptions={[
            { name: "ORO/NASOPHARYGEAL R/L BLIND", value: "1" },
            { name: "ORO/NASOTRACHEAL CUFF PACK", value: "2" },
            { name: "ENDOTRACHEAL R/L UNDER MASK", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.airway}
          isRemoveTemplate={true}
        />

        <TimePicker
          placeholderName=""
          lable={t("Anaesthesia Time")}
          id="anaesthesiaTime"
          name="anaesthesiaTime"
          value={values?.anaesthesiaTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <TimePicker
          placeholderName=""
          lable={t("Surgery")}
          id="surgeryTime"
          name="surgeryTime"
          value={values?.surgeryTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
      </div>

      <Heading title={<span className="text-dark">{t("BP")}</span>} />
      <div className="row p-2">
        <TimePicker
          placeholderName={t("BP Time")}
          lable={t("Time")}
          id="bptime"
          name="bptime"
          value={values?.bptime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={(name, value) => {
            console.log("BP Time selected:", name, value);
            handleDateTimeChange(name, value);
          }}
        />
        <Input
          type="text"
          className="form-control"
          id="bp"
          lable={t("BP Value")}
          placeholder=" "
          required={true}
          value={values?.bp}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="bp"
          onChange={handleChange}
        />
      </div>

      <Heading title={<span className="text-dark">{t("RR")}</span>} />
      <div className="row p-2">
        <TimePicker
          placeholderName={t("RR Time")}
          lable={t("Time")}
          id="rrtime"
          name="rrtime"
          value={values?.rrtime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="rr"
          lable={t("RR Value")}
          placeholder=" "
          required={true}
          value={values?.rr}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rr"
          onChange={handleChange}
        />
      </div>

      <Heading title={<span className="text-dark">{t("MAP")}</span>} />
      <div className="row p-2">
        <TimePicker
          placeholderName={t("MAP Time")}
          lable={t("Time")}
          id="maptime"
          name="maptime"
          value={values?.maptime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="map"
          lable={t("MAP")}
          placeholder=" "
          required={true}
          value={values?.map}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="map"
          onChange={handleChange}
        />
      </div>

      <Heading title={<span className="text-dark">{t("TEMP")}</span>} />
      <div className="row p-2">
        <TimePicker
          placeholderName={t("Temp Time")}
          lable={t("Time")}
          id="tempTime"
          name="tempTime"
          value={values?.tempTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="temp"
          lable={t("TEMP")}
          placeholder=" "
          required={true}
          value={values?.temp}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="temp"
          onChange={handleChange}
        />
      </div>

      <Heading title={<span className="text-dark">{t("DRUG")}</span>} />
      <div className="row p-2">
        <TimePicker
          placeholderName={t("Drug Time")}
          lable={t("Time")}
          id="drugTime"
          name="drugTime"
          value={values?.drugTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="drugSelections"
          lable={t("DRUG")}
          placeholder=" "
          required={true}
          value={values?.drugSelections}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="drugSelections"
          onChange={handleChange}
        />
      </div>

      <Heading title={<span className="text-dark">{t("FLUID")}</span>} />
      <div className="row p-2">
        <TimePicker
          placeholderName={t("Fluid Time")}
          lable={t("Time")}
          id="fluidTime"
          name="fluidTime"
          value={values?.fluidTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="fluidSelections"
          lable={t("Fluid")}
          placeholder=" "
          required={true}
          value={values?.fluidSelections}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="fluidSelections"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="position"
          lable={t("Positions")}
          placeholder=" "
          required={true}
          value={values?.position}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="position"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="operatorResult"
          lable={t("Result Of Operators")}
          placeholder=" "
          required={true}
          value={values?.operatorResult}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="operatorResult"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="postOperative"
          lable={t("Post Operative instruction to ward")}
          placeholder=" "
          required={true}
          value={values?.postOperative}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="postOperative"
          onChange={handleChange}
        />
      </div>

      <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2 px-2">
        {values?.type === "save" ? (
          <button
            type="button"
            className="btn btn-sm btn-primary mr-1"
            onClick={() => handleSave()}
          >
            {t("Save")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary mr-1"
              onClick={() => handleUpdate()}
            >
              {t("Update")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary mr-1"
              onClick={resetForm}
            >
              {t("Cancel")}
            </button>
          </>
        )}
      </div>

      {tableData.length > 0 && (
        <Tables
          thead={ANAESTHETICRECORDS}
          tbody={tableData.map((row, index) => ({
            "Sr.No": index + 1,
            Diagnosis: row.Diagnosis || "-",
            Operation: row.Operation || "-",
            Anaesthetists: row.Anaesthetists || "-",
            Surgeons: row.Surgeons || "-",
            Assistants: row.Assistants || "-",
            "Type of Premedication": row.Premedication || "-",
            Date: row.Date || "-",
            "Time In": row.TimeIn || "-",
            "Time Out": row.TimeOut || "-",
            Effect: row.Effect || "-",
            Induction: row.Induction || "-",
            Airway:
              `${row.AirwaySelections1 || ""} ${row.AirwaySelections2 || ""} ${row.AirwaySelections3 || ""}`.trim() ||
              "-",
            Anaesthesia: row.AnaesthesiaTime || "-",
            Surgery: row.SurgeryTime || "-",
            Edit: (
              <i
                className="bi bi-pencil-square"
                style={{ cursor: "pointer", color: "#007bff" }}
                onClick={() => handleEdit(row)}
              />
            ),
          }))}
        />
      )}
    </div>
  );
};

export default AestheticOperativeChart;
