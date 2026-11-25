import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { notify } from "../../utils/utils";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";
import {
  NursingWardSaveLabourChartForm,
  NursingWardGetLabourChartForm,
  NursingWardUpdateLabourChartForm,
} from "../../networkServices/nursingWardAPI";
import DatePicker from "../formComponent/DatePicker";
import CustomSelect from "../formComponent/CustomSelect";

const RecordOfLabourChart = ({ onClose, data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const [values, setValues] = useState({
    // Initialize form values
    phone: "",
    ancVisits: "",
    village: "",
    nearBySchool: "",
    occupation: "",
    nextOfKin: "",
    relationPatient: "",
    kinVillage: "",
    kinOccupation: "",
    kinTelephone: "",
    modeOfPayment: [],
    admissionDate: "",
    dischargeDate: "",
    medicalHistory: "",
    obstericHistoryPara: "",
    gravida: "",
    lmp: "",
    edd: "",
    numberOfANC: "",
    diagnosis: "",
    ancLaboratory: "",
    vdrl: "",
    hbsag: "",
    hiv: "",
    weight: "",
    height: "",
    urineTesting: "",
    glucose: "",
    acetone: "",
    temperature: "",
    pulse: "",
    respiration: "",
    bloodPressure: "",
    oedema: "",
    generalObservations: "",
    onsetDate: "",
    time: "",
    membranesState: "",
    liquorDescription: "",
    abdominalExamination: "",
    inspection: "",
    lie: "",
    presentation: "",
    fundalNight: "",
    foetalHeart: "",
    position: "",
    uterinAction: "",
    vaginalExamination: "",
    pelvicAssessment: "",
    signatureName: "",
    consentTreatment: "",
    date: "",
    signed: "",
    // Initialize array for previous labour history table
    previousLabourHistory: [
      {
        year: "",
        place: "",
        labour: "",
        delivery: "",
        babySex: "",
        weight: "",
        fate: "",
        puerperium: "",
      },
    ],
  });
  const [tableData, setTableData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const PREVIOUSLABOURHISTORY = [
    { width: "1%", name: t("Year") },
    { width: "5%", name: t("Place") },
    { width: "5%", name: t("Labour") },
    { width: "5%", name: t("Delivery") },
    { width: "5%", name: t("Baby Sex") },
    { width: "5%", name: t("Weight") },
    { width: "5%", name: t("Fate") },
    { width: "5%", name: t("Puerperium") },
    { width: "5%", name: t("Action") },
  ];

  const LABOURCHARTRECORD = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("Tel") },
    { width: "5%", name: t("No. Of ANC Visits") },
    { width: "5%", name: t("Created Date") },
    { width: "5%", name: t("Created By") },
    { width: "3%", name: t("Edit") },
  ];

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const transactionID = data?.transactionID;

      if (!transactionID) {
        notify(t("Transaction ID missing"), "error");
        return;
      }

      let response = await NursingWardGetLabourChartForm(transactionID);

      if (response?.success) {
        setTableData(response.data || []);
        console.log("Fetched Table Data:", response.data); // Debug log
      } else {
        notify(response?.message || "Failed to fetch data", "error");
      }
    } catch (error) {
      notify(error?.message || "Error fetching data", "error");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setValues((val) => ({
        ...val,
        [name]: checked ? 1 : 0,
      }));
    } else {
      setValues((val) => ({
        ...val,
        [name]: value,
      }));
    }
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    const selectedValues = Array.isArray(selectedOptions)
      ? selectedOptions.map((opt) => opt.name || opt.value || opt)
      : [];

    setValues({
      ...values,
      [name]: selectedValues,
    });
  };

  const handlePreviousLabourChange = (index, field, value) => {
    const updatedHistory = [...values.previousLabourHistory];
    updatedHistory[index][field] = value;
    setValues({
      ...values,
      previousLabourHistory: updatedHistory,
    });
  };

  const addPreviousLabourRow = () => {
    setValues({
      ...values,
      previousLabourHistory: [
        ...values.previousLabourHistory,
        {
          year: "",
          place: "",
          labour: "",
          delivery: "",
          babySex: "",
          weight: "",
          fate: "",
          puerperium: "",
        },
      ],
    });
  };

  const removePreviousLabourRow = (index) => {
    if (values.previousLabourHistory.length > 1) {
      const updatedHistory = values.previousLabourHistory.filter(
        (_, i) => i !== index
      );
      setValues({
        ...values,
        previousLabourHistory: updatedHistory,
      });
    }
  };

  const formatDateForAPI = (dateValue) => {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    } catch (error) {
      console.error("Date format error:", error);
      return "";
    }
  };

  const formatTimeForAPI = (timeValue) => {
    if (!timeValue) return "";
    try {
      // Handle different time formats
      if (typeof timeValue === "string") {
        if (timeValue.includes("T")) {
          // ISO format
          const date = new Date(timeValue);
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}:00`;
        } else if (timeValue.match(/^\d{1,2}:\d{2}/)) {
          // HH:MM format
          const [hours, minutes] = timeValue.split(":");
          return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
        }
      }
      return timeValue;
    } catch (error) {
      console.error("Time format error:", error);
      return "";
    }
  };

  const preparePayload = () => {
    const transactionID = data?.transactionID || "0";
    const patientID = data?.patientID || "string";
    const patientName = data?.patientName || "string";
    const idNo = data?.idNo || "string";
    const ipRegNo = data?.ipRegNo || "string";
    const ageDOB = data?.ageDOB || "string";

    // Extract mode of payment values
    const modeOfPaymentArray = values.modeOfPayment || [];
    const modeOfPayment = modeOfPaymentArray.join(",");
    const hasCash = modeOfPaymentArray.includes("Cash");
    const hasCooperative = modeOfPaymentArray.includes("Co-Operate");
    const hasInsurance = modeOfPaymentArray.includes("Insurance");

    const payload = {
      id: editMode && editId ? editId : 0,
      labourID: editMode && editId ? editId : 0,
      rows: values.previousLabourHistory.map((row) => ({
        year: row.year || "",
        place: row.place || "",
        labour: row.labour || "",
        delivery: row.delivery || "",
        babySex: row.babySex || "",
        weight: row.weight || "",
        fate: row.fate || "",
        puerperium: row.puerperium || "",
      })),
      patientID: patientID,
      transactionID: transactionID,
      patientName: patientName,
      idNo: idNo,
      ipRegNo: ipRegNo,
      ageDOB: ageDOB,
      tel: values.phone || "",
      noOfANCVisits: values.ancVisits || "",
      village: values.village || "",
      nearbyChurchSchool: values.nearBySchool || "",
      occupation: values.occupation || "",
      nextOfKin: values.nextOfKin || "",
      relationToPatient: values.relationPatient || "",
      villageKin: values.kinVillage || "",
      occupationKin: values.kinOccupation || "",
      telKin: values.kinTelephone || "",
      modeOfPayment: modeOfPayment,
      modeOfPayment_Cash: hasCash ? "Yes" : "No",
      modeOfPayment_Cooperative: hasCooperative ? "Yes" : "No",
      modeOfPayment_Insurance: hasInsurance ? "Yes" : "No",
      dateOfAdmission: formatDateForAPI(values.admissionDate) || "",
      dateOfDischarge: formatDateForAPI(values.dischargeDate) || "",
      pastMedicalHistory: values.medicalHistory || "",
      obstetricHistoryPara: values.obstericHistoryPara || "",
      gravida: values.gravida || "",
      lmp: formatDateForAPI(values.lmp) || "",
      edd: formatDateForAPI(values.edd) || "",
      noOfANC: values.numberOfANC || "",
      diagnosis: values.diagnosis || "",
      ancLabResult: values.ancLaboratory || "",
      vdrl: values.vdrl || "",
      groupHBSAG: values.hbsag || "",
      hivStatus: values.hiv || "",
      observationsWeight: values.weight || "",
      height: values.height || "",
      urineProtein: values.urineTesting || "",
      glucose: values.glucose || "",
      urineAcetone: values.acetone || "",
      temperature: values.temperature || "",
      pulse: values.pulse || "",
      respiration: values.respiration || "",
      bloodPressure: values.bloodPressure || "",
      oedema: values.oedema || "",
      generalObservations: values.generalObservations || "",
      onsetDate: formatDateForAPI(values.onsetDate) || "",
      onsetTime: formatTimeForAPI(values.time) || "",
      stateMembranes: values.membranesState || "",
      descriptionLiquor: values.liquorDescription || "",
      abdominalExam: values.abdominalExamination || "",
      inspection: values.inspection || "",
      lie: values.lie || "",
      presentation: values.presentation || "",
      fundalHeight: values.fundalNight || "",
      foetalHeart: values.foetalHeart || "",
      positionAction: values.position || "",
      uterinAction: values.uterinAction || "",
      vaginalExam: values.vaginalExamination || "",
      pelvicAssessmentConsent: values.pelvicAssessment || "",
      pelvicName: values.signatureName || "",
      pelvicSigned: values.signed || "",
      pelvicDate: formatDateForAPI(values.date) || "",
      signedBy: values.consentTreatment || "",
    };

    return payload;
  };

  const handleSave = async () => {
    try {
      const payload = preparePayload();

      console.log("Save Payload:", JSON.stringify(payload, null, 2));

      let response = await NursingWardSaveLabourChartForm(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        resetForm();
        await fetchTableData();
      } else {
        notify(response?.message || "Failed to save", "error");
      }
    } catch (error) {
      notify(error?.message || "Error saving data", "error");
    }
  };

  const handleUpdate = async () => {
    try {
      if (!editId) {
        notify(t("No record selected for update"), "error");
        return;
      }

      const payload = preparePayload();

      console.log("Update Payload:", JSON.stringify(payload, null, 2));

      let response = await NursingWardUpdateLabourChartForm(payload);

      if (response?.success) {
        notify(t("Updated successfully"), "success");
        resetForm();
        await fetchTableData();
      } else {
        notify(response?.message || "Failed to update", "error");
      }
    } catch (error) {
      notify(error?.message || "Error updating data", "error");
    }
  };

  const resetForm = () => {
    setValues({
      phone: "",
      ancVisits: "",
      village: "",
      nearBySchool: "",
      occupation: "",
      nextOfKin: "",
      relationPatient: "",
      kinVillage: "",
      kinOccupation: "",
      kinTelephone: "",
      modeOfPayment: [],
      admissionDate: "",
      dischargeDate: "",
      medicalHistory: "",
      obstericHistoryPara: "",
      gravida: "",
      lmp: "",
      edd: "",
      numberOfANC: "",
      diagnosis: "",
      ancLaboratory: "",
      vdrl: "",
      hbsag: "",
      hiv: "",
      weight: "",
      height: "",
      urineTesting: "",
      glucose: "",
      acetone: "",
      temperature: "",
      pulse: "",
      respiration: "",
      bloodPressure: "",
      oedema: "",
      generalObservations: "",
      onsetDate: "",
      time: "",
      membranesState: "",
      liquorDescription: "",
      abdominalExamination: "",
      inspection: "",
      lie: "",
      presentation: "",
      fundalNight: "",
      foetalHeart: "",
      position: "",
      uterinAction: "",
      vaginalExamination: "",
      pelvicAssessment: "",
      signatureName: "",
      consentTreatment: "",
      date: "",
      signed: "",
      previousLabourHistory: [
        {
          year: "",
          place: "",
          labour: "",
          delivery: "",
          babySex: "",
          weight: "",
          fate: "",
          puerperium: "",
        },
      ],
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleEdit = (row) => {
    try {
      let foundId = row.LabourID;
      if (!foundId) {
        notify(t("Cannot edit: Missing record ID"), "error");
        return;
      }

      // Map the API response to form values - adjust based on actual field names
      const formValues = {
        phone: row.tel || row.Tel || row.TEL || "",
        ancVisits:
          row.noOfANCVisits || row.NoOfANCVisits || row.ancVisits || "",
        village: row.village || row.Village || "",
        nearBySchool: row.nearbyChurchSchool || row.NearbyChurchSchool || "",
        occupation: row.occupation || row.Occupation || "",
        nextOfKin: row.nextOfKin || row.NextOfKin || "",
        relationPatient: row.relationToPatient || row.RelationToPatient || "",
        kinVillage: row.villageKin || row.VillageKin || "",
        kinOccupation: row.occupationKin || row.OccupationKin || "",
        kinTelephone: row.telKin || row.TelKin || "",
        modeOfPayment: row.modeOfPayment
          ? typeof row.modeOfPayment === "string"
            ? row.modeOfPayment.split(",")
            : []
          : [],
        admissionDate: row.dateOfAdmission || row.DateOfAdmission || "",
        dischargeDate: row.dateOfDischarge || row.DateOfDischarge || "",
        medicalHistory: row.pastMedicalHistory || row.PastMedicalHistory || "",
        obstericHistoryPara:
          row.obstetricHistoryPara || row.ObstetricHistoryPara || "",
        gravida: row.gravida || row.Gravida || "",
        lmp: row.lmp || row.LMP || "",
        edd: row.edd || row.EDD || "",
        numberOfANC: row.noOfANC || row.NoOfANC || "",
        diagnosis: row.diagnosis || row.Diagnosis || "",
        ancLaboratory: row.ancLabResult || row.ancLabResult || "",
        vdrl: row.vdrl || row.VDRL || "",
        hbsag: row.groupHBSAG || row.GroupHBSAG || "",
        hiv: row.hivStatus || row.HIVStatus || "",
        weight: row.observationsWeight || row.observationsWeight || "",
        height: row.height || row.Height || "",
        urineTesting: row.urineProtein || row.UrineProtein || "",
        glucose: row.glucose || row.Glucose || "",
        acetone: row.urineAcetone || row.UrineAcetone || "",
        temperature: row.temperature || row.Temperature || "",
        pulse: row.pulse || row.Pulse || "",
        respiration: row.respiration || row.Respiration || "",
        bloodPressure: row.bloodPressure || row.BloodPressure || "",
        oedema: row.oedema || row.Oedema || "",
        generalObservations:
          row.generalObservations || row.GeneralObservations || "",
        onsetDate: row.onsetDate || row.OnsetDate || "",
        time: row.onsetTime || row.OnsetTime || "",
        membranesState: row.stateMembranes || row.StateMembranes || "",
        liquorDescription: row.descriptionLiquor || row.DescriptionLiquor || "",
        abdominalExamination: row.abdominalExam || row.AbdominalExam || "",
        inspection: row.inspection || row.Inspection || "",
        lie: row.lie || row.Lie || "",
        presentation: row.presentation || row.Presentation || "",
        fundalNight: row.fundalHeight || row.FundalHeight || "",
        foetalHeart: row.foetalHeart || row.FoetalHeart || "",
        position: row.positionAction || row.PositionAction || "",
        uterinAction: row.uterinAction || row.UterinAction || "",
        vaginalExamination: row.vaginalExam || row.VaginalExam || "",
        pelvicAssessment:
          row.pelvicAssessmentConsent || row.PelvicAssessmentConsent || "",
        signatureName: row.pelvicName || row.PelvicName || "",
        consentTreatment: row.signedBy || row.SignedBy || "",
        date: row.pelvicDate || row.PelvicDate || "",
        signed: row.pelvicSigned || row.PelvicSigned || "",
        previousLabourHistory: row.rows ||
          row.Rows || [
            {
              year: "",
              place: "",
              labour: "",
              delivery: "",
              babySex: "",
              weight: "",
              fate: "",
              puerperium: "",
            },
          ],
      };

      setValues(formValues);
      setEditMode(true);
      setEditId(foundId);
    } catch (error) {
      notify(t("Error loading data for editing"), "error");
    }
  };

  const renderPreviousLabourTable = () => (
    <Tables
      thead={PREVIOUSLABOURHISTORY}
      tbody={values.previousLabourHistory.map((row, ind) => ({
        Year: (
          <div style={{ whiteSpace: "wrap" }}>
            <CustomSelect
              placeHolder={t("Year")}
              name="year"
              requiredClassName="required-fields"
              onChange={(name, e) => {
                handlePreviousLabourChange(ind, "year", e?.value || e || "");
              }}
              value={row?.year}
              option={Array.from({ length: 20 }, (_, i) => 2025 + i).map(
                (year) => ({
                  value: year.toString(),
                  label: year.toString(),
                })
              )}
            />
          </div>
        ),
        Place: (
          <div style={{ width: "150px" }}>
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="place"
              placeholder=""
              value={row.place}
              onChange={(e) =>
                handlePreviousLabourChange(ind, "place", e.target.value)
              }
            />
          </div>
        ),
        Labour: (
          <div style={{ width: "150px" }}>
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="labour"
              placeholder=""
              value={row.labour}
              onChange={(e) =>
                handlePreviousLabourChange(ind, "labour", e.target.value)
              }
            />
          </div>
        ),
        Delivery: (
          <div style={{ width: "150px" }}>
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="delivery"
              placeholder=""
              value={row.delivery}
              onChange={(e) =>
                handlePreviousLabourChange(ind, "delivery", e.target.value)
              }
            />
          </div>
        ),
        "Baby Sex": (
          <div style={{ width: "150px" }}>
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="babySex"
              placeholder=""
              value={row.babySex}
              onChange={(e) =>
                handlePreviousLabourChange(ind, "babySex", e.target.value)
              }
            />
          </div>
        ),
        Weight: (
          <div style={{ width: "150px" }}>
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="weight"
              placeholder=""
              value={row.weight}
              onChange={(e) =>
                handlePreviousLabourChange(ind, "weight", e.target.value)
              }
            />
          </div>
        ),
        Fate: (
          <div style={{ width: "150px" }}>
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="fate"
              placeholder=""
              value={row.fate}
              onChange={(e) =>
                handlePreviousLabourChange(ind, "fate", e.target.value)
              }
            />
          </div>
        ),
        Puerperium: (
          <div style={{ width: "150px" }}>
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="puerperium"
              placeholder=""
              value={row.puerperium}
              onChange={(e) =>
                handlePreviousLabourChange(ind, "puerperium", e.target.value)
              }
            />
          </div>
        ),
        Action: (
          <div className="d-flex gap-1">
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={addPreviousLabourRow}
            >
              +
            </button>
            {values.previousLabourHistory.length > 1 && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => removePreviousLabourRow(ind)}
              >
                –
              </button>
            )}
          </div>
        ),
      }))}
    />
  );

  const renderForm = () => (
    <>
      {editMode && (
        <div className="alert alert-info mb-3">
          <i className="bi bi-pencil me-2"></i>
          {t("Editing Mode Active - Editing Record ID:")} {editId}
        </div>
      )}
      <Heading
        title={<span className="text-dark">{t("RECORD OF LABOUR CHART")}</span>}
      />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="phone"
          lable={t("Telephone")}
          placeholder=" "
          required={true}
          value={values?.phone}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="phone"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="ancVisits"
          lable={t("NO OF ANC VISITS")}
          placeholder=" "
          required={true}
          value={values?.ancVisits}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="ancVisits"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="village"
          lable={t("Village")}
          placeholder=" "
          required={true}
          value={values?.village}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="village"
          onChange={handleChange}
        />

        <Input
          type="text"
          className="form-control"
          id="nearBySchool"
          lable={t("Nearby Church/School")}
          placeholder=" "
          required={true}
          value={values?.nearBySchool}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="nearBySchool"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="occupation"
          lable={t("Occupation")}
          placeholder=" "
          required={true}
          value={values?.occupation}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="occupation"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="nextOfKin"
          lable={t("Next of Kin")}
          placeholder=" "
          required={true}
          value={values?.nextOfKin}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="nextOfKin"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="relationPatient"
          lable={t("Relation to Patient")}
          placeholder=" "
          required={true}
          value={values?.relationPatient}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="relationPatient"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="kinVillage"
          lable={t("Village")}
          placeholder=" "
          required={true}
          value={values?.kinVillage}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="kinVillage"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="kinOccupation"
          lable={t("Occupation")}
          placeholder=" "
          required={true}
          value={values?.kinOccupation}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="kinOccupation"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="kinTelephone"
          lable={t("Telephone")}
          placeholder=" "
          required={true}
          value={values?.kinTelephone}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="kinTelephone"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="modeOfPayment"
          id="modeOfPayment"
          placeholderName={t("Mode Of Payment")}
          dynamicOptions={[
            { name: "Cash", value: "Cash" },
            { name: "Co-Operate", value: "Co-Operate" },
            { name: "Insurance", value: "Insurance" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.modeOfPayment}
          isRemoveTemplate={true}
        />
        <DatePicker
          className="custom-calendar"
          placeholder=""
          lable={t("Date of Addmission")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="admissionDate"
          id="admissionDate"
          value={values?.admissionDate}
          handleChange={handleDateTimeChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder=""
          lable={t("Date of Discharge")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="dischargeDate"
          id="dischargeDate"
          value={values?.dischargeDate}
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="medicalHistory"
          lable={t("Past Medical Family History")}
          placeholder=" "
          required={true}
          value={values?.medicalHistory}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="medicalHistory"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="obstericHistoryPara"
          lable={t("Obsetric History-Para")}
          placeholder=" "
          required={true}
          value={values?.obstericHistoryPara}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="obstericHistoryPara"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="gravida"
          lable={t("Gravida")}
          placeholder=" "
          required={true}
          value={values?.gravida}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="gravida"
          onChange={handleChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder=""
          lable={t("LMP")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="lmp"
          id="lmp"
          value={values?.lmp}
          handleChange={handleDateTimeChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder=""
          lable={t("EDD")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="edd"
          id="edd"
          value={values?.edd}
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="numberOfANC"
          lable={t("No. of ANC")}
          placeholder=" "
          required={true}
          value={values?.numberOfANC}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="numberOfANC"
          onChange={handleChange}
        />
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
      </div>
      <Heading
        title={<span className="text-dark">{t("Previous Labour History Table")}</span>}
      />
      <div className="row p-2">{renderPreviousLabourTable()}</div>
      <Heading
        title={
          <span className="text-dark">
            {t("ANC Laboratory Results & Observations")}
          </span>
        }
      />
      <div className="row p-2">
        <div className="col-xl-12 col-md-12 col-sm-12 col-12">
          <div className="row">
            <Input
              type="text"
              className="form-control"
              id="ancLaboratory"
              lable={t("ANC LABORATORY RESULTS=HB")}
              placeholder=" "
              required={true}
              value={values.ancLaboratory}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="ancLaboratory"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="vdrl"
              lable={t("VDRL")}
              placeholder=" "
              required={true}
              value={values.vdrl}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="vdrl"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="hbsag"
              lable={t("GROUP/HBSAG")}
              placeholder=" "
              required={true}
              value={values.hbsag}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="hbsag"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="hiv"
              lable={t("HIV Status")}
              placeholder=" "
              required={true}
              value={values.hiv}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="hiv"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="weight"
              lable={t("Observations on Admission=Weight")}
              placeholder=" "
              required={true}
              value={values.weight}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="weight"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="height"
              lable={t("Height")}
              placeholder=" "
              required={true}
              value={values.height}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="height"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="urineTesting"
              lable={t("Urine Testing - Protein")}
              placeholder=" "
              required={true}
              value={values.urineTesting}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="urineTesting"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="glucose"
              lable={t("Glucose")}
              placeholder=" "
              required={true}
              value={values.glucose}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="glucose"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="acetone"
              lable={t("Acetone")}
              placeholder=" "
              required={true}
              value={values.acetone}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="acetone"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="temperature"
              lable={t("Temperature")}
              placeholder=" "
              required={true}
              value={values.temperature}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="temperature"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="pulse"
              lable={t("Pulse")}
              placeholder=" "
              required={true}
              value={values.pulse}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="pulse"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="respiration"
              lable={t("Respiration")}
              placeholder=" "
              required={true}
              value={values.respiration}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="respiration"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="bloodPressure"
              lable={t("Blood Pressure")}
              placeholder=" "
              required={true}
              value={values.bloodPressure}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="bloodPressure"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="oedema"
              lable={t("Oedema")}
              placeholder=" "
              required={true}
              value={values.oedema}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="oedema"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="generalObservations"
              lable={t("General Observations")}
              placeholder=" "
              required={true}
              value={values.generalObservations}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="generalObservations"
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <Heading
        title={
          <span className="text-dark">{t("Observations of Labour on Admission")}</span>
        }
      />
      <div className="row p-2">
        <DatePicker
          className="custom-calendar"
          placeholder=""
          lable={t("Onset Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="onsetDate"
          id="onsetDate"
          value={values?.onsetDate}
          handleChange={handleDateTimeChange}
        />
        <TimePicker
          placeholderName={t("Time")}
          lable={t("Time AM/PM")}
          id="time"
          name="time"
          value={values?.time}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="membranesState"
          lable={t("State of Membranes")}
          placeholder=" "
          required={true}
          value={values?.membranesState}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="membranesState"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="liquorDescription"
          lable={t("Description of Liquor")}
          placeholder=" "
          required={true}
          value={values?.liquorDescription}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="liquorDescription"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="abdominalExamination"
          lable={t("Abdominal Examination")}
          placeholder=" "
          required={true}
          value={values?.abdominalExamination}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="abdominalExamination"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="inspection"
          lable={t("Inspection")}
          placeholder=" "
          required={true}
          value={values?.inspection}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="inspection"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="lie"
          lable={t("LIE")}
          placeholder=" "
          required={true}
          value={values?.lie}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="lie"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="presentation"
          lable={t("Presentation")}
          placeholder=" "
          required={true}
          value={values?.presentation}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="presentation"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="fundalNight"
          lable={t("Fundal Night")}
          placeholder=" "
          required={true}
          value={values?.fundalNight}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="fundalNight"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="foetalHeart"
          lable={t("Foetal Heart")}
          placeholder=" "
          required={true}
          value={values?.foetalHeart}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="foetalHeart"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="position"
          lable={t("Position")}
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
          id="uterinAction"
          lable={t("Uterin Action")}
          placeholder=" "
          required={true}
          value={values?.uterinAction}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="uterinAction"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="vaginalExamination"
          lable={t("Vaginal Examination")}
          placeholder=" "
          required={true}
          value={values?.vaginalExamination}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="vaginalExamination"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="pelvicAssessment"
          lable={t("Pelvic Assessment")}
          placeholder=" "
          required={true}
          value={values?.pelvicAssessment}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="pelvicAssessment"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="signatureName"
          lable={t("Signature & Name")}
          placeholder=" "
          required={true}
          value={values?.signatureName}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="signatureName"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="consentTreatment"
          lable={t("Give Consent for Treatment")}
          placeholder=" "
          required={true}
          value={values?.consentTreatment}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="consentTreatment"
          onChange={handleChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder=""
          lable={t("Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="date"
          id="date"
          value={values?.date}
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="signed"
          lable={t("Signed")}
          placeholder=" "
          required={true}
          value={values?.signed}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="signed"
          onChange={handleChange}
        />
      </div>
      <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2 px-2">
        {!editMode ? (
          <button
            type="button"
            className="btn btn-sm btn-primary mr-1"
            onClick={handleSave}
          >
            {t("Save")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary mr-1"
              onClick={handleUpdate}
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
    </>
  );

  return (
    <div className="card">
      {renderForm()}
      {tableData.length > 0 && (
        <div className="mt-4">
          <Heading title={<span className="text-dark">{t("Saved Records")}</span>} />
          <Tables
            thead={LABOURCHARTRECORD}
            tbody={tableData.map((row, index) => {
              return {
                "Sr.No": index + 1,
                Tel: row.tel || row.Tel || row.TEL || "-",
                "No. Of ANC Visits":
                  row.noOfANCVisits || row.NoOfANCVisits || "-",
                "Created Date": row.CreatedDate || row.createdDate || "-",
                "Created By": row.CreatedByName || row.CreatedBy || "-",
                Edit: (
                  <i
                    className="bi bi-pencil-square"
                    style={{
                      cursor: "pointer",
                      color: "#007bff",
                      fontSize: "1.2rem",
                    }}
                    onClick={() => handleEdit(row)}
                    title={t("Edit Record")}
                  />
                ),
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

export default RecordOfLabourChart;
