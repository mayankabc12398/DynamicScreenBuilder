import React, { useState, useEffect } from "react";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import {
  NursingWardSaveConsentForm,
  NursingWardUpdateConsentForm,
  NursingWardEditConsentForm,
  NursingWardBindConsentForm,
} from "../../networkServices/nursingWardAPI";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";

const ConsentFormAndInduction = ({ data }) => {
  const [t] = useTranslation();
  const [activeForm, setActiveForm] = useState("induction"); // 'induction' or 'consent'
  const [values, setValues] = useState({
    // Induction form fields
    methodUsedForPatient: "",
    patientName: "",
    ipNo: "",
    date: "",
    Time: "",
    dob: "",
    year: "",
    g: "",
    p: "",
    lmp: "",
    edd: "",
    lpm: "",
    gestationalAge20Weeks: "",
    historyOfAnyAllergy: [],
    inductionReviewed: [],
    contraindication: [],
    methodOfInduction: [],
    formSignedByPatients: [],
    heartRateAssessment: [],
    score: [],
    cervicalDilation: [],
    cervixPosition: [],
    cervicalConsistency: [],
    cervicalLength: [],
    fetalHead: [],
    patientScore: "",
    doctorSignature: "",
    bishopDate: "",
    bishopTime: "",
    
    // Consent form fields
    consentPatientName: "",
    consentWifeOf: "",
    consentIDnumber: "",
    consentDOB: "",
    consentAge: "",
    consentDoctorName: "",
    consentIndication: "",
    consentTime: "",
    consentDate: "",
    consentPlace: "",
    consentPatientSignature: "",
    consentKinSignature: "",
    consentAttendingSignature: "",
    consentWitnessSignature: "",
  });
  
  const [tableData, setTableData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableFormType, setTableFormType] = useState("inductionChecklist");

  const CONSENTFORMINDUCTION = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("Patient Id") },
    { width: "3%", name: t("Form Type") },
    { width: "3%", name: t("ID No") },
    { width: "3%", name: t("Created Date") },
    { width: "5%", name: t("Created By") },
    { width: "3%", name: t("Edit") },
  ];

  useEffect(() => {
    // Set default form type to induction
    setActiveForm("induction");
    fetchTableData("inductionChecklist");
  }, []);

  const fetchTableData = async (formTypeToFetch) => {
    try {
      const PatientID = data?.patientID;

      if (!PatientID) {
        notify(t("Patient ID missing"), "error");
        return;
      }

      setLoading(true);
      let response = await NursingWardBindConsentForm(PatientID, formTypeToFetch);

      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(response?.message || "Failed to fetch data", "error");
      }
    } catch (error) {
      notify(error?.message || "Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update table when activeForm changes
  useEffect(() => {
    if (data?.patientID) {
      const formTypeToFetch = activeForm === "induction" ? "inductionChecklist" : "consentForm";
      fetchTableData(formTypeToFetch);
    }
  }, [activeForm]);

  const handleFormTypeChange = (type) => {
    setActiveForm(type);
    // Reset edit mode when switching forms
    setEditMode(false);
    setEditId(null);
    // Reset form values when switching
    resetFormValues();
  };

  const resetFormValues = () => {
    setValues({
      methodUsedForPatient: "",
      patientName: "",
      ipNo: "",
      date: "",
      Time: "",
      dob: "",
      year: "",
      g: "",
      p: "",
      lmp: "",
      edd: "",
      lpm: "",
      gestationalAge20Weeks: "",
      historyOfAnyAllergy: [],
      inductionReviewed: [],
      contraindication: [],
      methodOfInduction: [],
      formSignedByPatients: [],
      heartRateAssessment: [],
      score: [],
      cervicalDilation: [],
      cervixPosition: [],
      cervicalConsistency: [],
      cervicalLength: [],
      fetalHead: [],
      patientScore: "",
      doctorSignature: "",
      bishopDate: "",
      bishopTime: "",
      consentPatientName: "",
      consentWifeOf: "",
      consentIDnumber: "",
      consentDOB: "",
      consentAge: "",
      consentDoctorName: "",
      consentIndication: "",
      consentTime: "",
      consentDate: "",
      consentPlace: "",
      consentPatientSignature: "",
      consentKinSignature: "",
      consentAttendingSignature: "",
      consentWitnessSignature: "",
    });
  };

  const preparePayload = () => {
    let payloadFormType = activeForm === "induction" ? "inductionChecklist" : "consentForm";

    const payload = {
      id: editId || 0,
      patientID: data?.patientID || "",
      transactionId: data?.transactionID || "",
      formType: payloadFormType,
      recordID: editId || 0,

      // Only include fields based on active form type
      ...(activeForm === "induction" ? {
        // Induction Checklist fields
        methodUsed: values.methodUsedForPatient || "",
        patientName: values.patientName || "",
        ipNo: values.ipNo || "",
        dateOfInduction: values.date || "",
        timeOfInduction: values.Time || "",
        age: values.dob || "",
        year: values.year || "",
        g: values.g || "",
        p: values.p || "",
        lmp: values.lmp || "",
        edd: values.edd || "",
        gestationalAgeByLMP: values.lpm || "",
        gestationalAgeByUS: values.gestationalAge20Weeks || "",
        allergyOrCondition: getMultiSelectValue(values.historyOfAnyAllergy),
        indicationReviewed: getMultiSelectValue(values.inductionReviewed),
        contraindicationExcluded: getMultiSelectValue(values.contraindication),
        plannedMethod: getMultiSelectValue(values.methodOfInduction),
        consentSigned: getMultiSelectValue(values.formSignedByPatients),
        fhrByCTG: getMultiSelectValue(values.heartRateAssessment),
        bishopScore: getMultiSelectValue(values.score),
        cervicalDilation: getMultiSelectValue(values.cervicalDilation),
        cervixPosition: getMultiSelectValue(values.cervixPosition),
        cervicalConsistency: getMultiSelectValue(values.cervicalConsistency),
        cervicalLength: getMultiSelectValue(values.cervicalLength),
        stationOfFetalHead: getMultiSelectValue(values.fetalHead),
        totalScore: values.patientScore || "",
        doctorName: values.doctorSignature || "",
        doctorDate: values.bishopDate || "",
        doctorTime: values.bishopTime || "",
      } : {
        // Consent Form fields
        consent_PatientName: values.consentPatientName || "",
        consent_WifeOf: values.consentWifeOf || "",
        consent_IDNo: values.consentIDnumber || "",
        consent_DOB: values.consentDOB || "",
        consent_Age: values.consentAge || "",
        consent_DoctorName: values.consentDoctorName || "",
        consent_Indication: values.consentIndication || "",
        consent_Time: values.consentTime || "",
        consent_Date: values.consentDate || "",
        consent_Place: values.consentPlace || "",
        consent_PatientSignature: values.consentPatientSignature || "",
        consent_NextOfKinSignature: values.consentKinSignature || "",
        consent_AttendingDoctorSignature: values.consentAttendingSignature || "",
        consent_WitnessSignature: values.consentWitnessSignature || "",
      })
    };

    return payload;
  };

  const getMultiSelectValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value || "";
  };

  const parseMultiSelectValue = (value) => {
    if (!value) return [];
    if (typeof value === 'string') {
      // Try to split by comma and trim whitespace
      return value.split(",").map(item => item.trim()).filter(item => item !== "");
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  };

  const handleSave = async () => {
    try {
      const payload = preparePayload();

      if (!data?.patientID) {
        notify(t("Patient ID is required"), "error");
        return;
      }

      setLoading(true);
      let response = await NursingWardSaveConsentForm(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        resetForm();
        // Refresh table data
        const formTypeToFetch = activeForm === "induction" ? "inductionChecklist" : "consentForm";
        await fetchTableData(formTypeToFetch);
      } else {
        notify(response?.message || "Failed to save", "error");
      }
    } catch (error) {
      notify(error?.message || "Error saving data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = preparePayload();

      if (!editId) {
        notify(t("No record selected for update"), "error");
        return;
      }

      setLoading(true);
      let response = await NursingWardUpdateConsentForm(payload);

      if (response?.success) {
        notify(t("Updated successfully"), "success");
        resetForm();
        // Refresh table data
        const formTypeToFetch = activeForm === "induction" ? "inductionChecklist" : "consentForm";
        await fetchTableData(formTypeToFetch);
      } else {
        notify(response?.message || "Failed to update", "error");
      }
    } catch (error) {
      notify(error?.message || "Error updating data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (row) => {
    try {
      const recordId = row.Id;
      if (!recordId) {
        notify(t("Record ID missing"), "error");
        return;
      }

      setLoading(true);
      let response = await NursingWardEditConsentForm(recordId);

      if (response?.success) {
        const formData = response.data;
        
        // Check if data is an array
        const dataToUse = Array.isArray(formData) && formData.length > 0 ? formData[0] : formData;
        
        // Set form type based on fetched data
        if (dataToUse.FormType === "inductionChecklist") {
          setActiveForm("induction");
        } else if (dataToUse.FormType === "consentForm") {
          setActiveForm("consent");
        }

        // Map API response to form values - FIXED
        const newValues = {
          // Reset all values first
          methodUsedForPatient: "",
          patientName: "",
          ipNo: "",
          date: "",
          Time: "",
          dob: "",
          year: "",
          g: "",
          p: "",
          lmp: "",
          edd: "",
          lpm: "",
          gestationalAge20Weeks: "",
          historyOfAnyAllergy: [],
          inductionReviewed: [],
          contraindication: [],
          methodOfInduction: [],
          formSignedByPatients: [],
          heartRateAssessment: [],
          score: [],
          cervicalDilation: [],
          cervixPosition: [],
          cervicalConsistency: [],
          cervicalLength: [],
          fetalHead: [],
          patientScore: "",
          doctorSignature: "",
          bishopDate: "",
          bishopTime: "",
          consentPatientName: "",
          consentWifeOf: "",
          consentIDnumber: "",
          consentDOB: "",
          consentAge: "",
          consentDoctorName: "",
          consentIndication: "",
          consentTime: "",
          consentDate: "",
          consentPlace: "",
          consentPatientSignature: "",
          consentKinSignature: "",
          consentAttendingSignature: "",
          consentWitnessSignature: "",
          
          // Now set the actual values from API
          ...(dataToUse.FormType === "inductionChecklist" ? {
            // Induction fields
            methodUsedForPatient: dataToUse.MethodUsed || "",
            patientName: dataToUse.PatientName || "",
            ipNo: dataToUse.IPNo || "",
            date: dataToUse.DateOfInduction || "",
            Time: dataToUse.TimeOfInduction || "",
            dob: dataToUse.Age || "",
            year: dataToUse.Year || "",
            g: dataToUse.G || "",
            p: dataToUse.P || "",
            lmp: dataToUse.LMP || "",
            edd: dataToUse.EDD || "",
            lpm: dataToUse.GestationalAgeByLMP || "",
            gestationalAge20Weeks: dataToUse.GestationalAgeByUS || "",
            historyOfAnyAllergy: parseMultiSelectValue(dataToUse.AllergyOrCondition),
            inductionReviewed: parseMultiSelectValue(dataToUse.IndicationReviewed),
            contraindication: parseMultiSelectValue(dataToUse.ContraindicationExcluded),
            methodOfInduction: parseMultiSelectValue(dataToUse.PlannedMethod),
            formSignedByPatients: parseMultiSelectValue(dataToUse.ConsentSigned),
            heartRateAssessment: parseMultiSelectValue(dataToUse.FHRByCTG),
            score: parseMultiSelectValue(dataToUse.BishopScore),
            cervicalDilation: parseMultiSelectValue(dataToUse.CervicalDilation),
            cervixPosition: parseMultiSelectValue(dataToUse.CervixPosition),
            cervicalConsistency: parseMultiSelectValue(dataToUse.CervicalConsistency),
            cervicalLength: parseMultiSelectValue(dataToUse.CervicalLength),
            fetalHead: parseMultiSelectValue(dataToUse.StationOfFetalHead),
            patientScore: dataToUse.TotalScore || "",
            doctorSignature: dataToUse.DoctorName || "",
            bishopDate: dataToUse.DoctorDate || "",
            bishopTime: dataToUse.DoctorTime || "",
          } : {
            // Consent fields
            consentPatientName: dataToUse.Consent_PatientName || "",
            consentWifeOf: dataToUse.Consent_WifeOf || "",
            consentIDnumber: dataToUse.Consent_IDNo || "",
            consentDOB: dataToUse.Consent_DOB || "",
            consentAge: dataToUse.Consent_Age || "",
            consentDoctorName: dataToUse.Consent_DoctorName || "",
            consentIndication: dataToUse.Consent_Indication || "",
            consentTime: dataToUse.Consent_Time || "",
            consentDate: dataToUse.Consent_Date || "",
            consentPlace: dataToUse.Consent_Place || "",
            consentPatientSignature: dataToUse.Consent_PatientSignature || "",
            consentKinSignature: dataToUse.Consent_NextOfKinSignature || "",
            consentAttendingSignature: dataToUse.Consent_AttendingDoctorSignature || "",
            consentWitnessSignature: dataToUse.Consent_WitnessSignature || "",
          })
        };

        console.log("Loaded edit data:", newValues);
        console.log("From API:", dataToUse);
        
        setValues(newValues);
        setEditId(recordId);
        setEditMode(true);
        notify(t("Form data loaded for editing"), "success");
      } else {
        notify(response?.message || "Failed to load form data", "error");
      }
    } catch (error) {
      console.error("Edit error:", error);
      notify(error?.message || "Error loading form data", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    resetFormValues();
    setEditId(null);
    setEditMode(false);
    // Keep current form type
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    const selectedValues = Array.isArray(selectedOptions)
      ? selectedOptions.map((opt) => opt.name || opt.value || opt)
      : [];

    setValues((prev) => ({
      ...prev,
      [name]: selectedValues,
    }));
  };

  const formatTableData = () => {
    return tableData.map((row, index) => ({
      "Sr.No": index + 1,
      "Patient Id": row.PatientID || "-",
      "Form Type": row.FormType === "inductionChecklist" ? "Induction Checklist" : "Consent Form",
      "ID No": row.Id || "-",
      "Created Date": row.CreatedDate ? new Date(row.CreatedDate).toLocaleDateString() : "-",
      "Created By": row.EnteredByName || "-",
      Edit: (
        <i
          className="bi bi-pencil-square"
          style={{ cursor: "pointer", color: "#007bff", fontSize: "1.2rem" }}
          onClick={() => handleEdit(row)}
          title={t("Edit")}
        />
      ),
    }));
  };

  return (
    <>
      <Heading title={<span className="text-dark">{t("Labor Forms")}</span>} />

      {/* Radio buttons for form type selection */}
      <div className="row p-2">
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              id="inductionRadio"
              name="formType"
              checked={activeForm === "induction"}
              onChange={() => handleFormTypeChange("induction")}
            />
            <label className="form-check-label" htmlFor="inductionRadio">
              {t("Induction of Labor Checklist")}
            </label>
          </div>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              id="consentRadio"
              name="formType"
              checked={activeForm === "consent"}
              onChange={() => handleFormTypeChange("consent")}
            />
            <label className="form-check-label" htmlFor="consentRadio">
              {t("Consent Form")}
            </label>
          </div>
        </div>
      </div>

      {/* Induction Form */}
      {activeForm === "induction" && (
        <>
          <Heading title={<span>{t("INDUCTION OF LABOR CHECKLIST")}</span>} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              id="methodUsedForPatient"
              lable={t("Method used for the patient")}
              placeholder=" "
              required={true}
              value={values.methodUsedForPatient || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="methodUsedForPatient"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="patientName"
              lable={t("Name of patient")}
              placeholder=" "
              required={true}
              value={values.patientName || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="patientName"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="ipNo"
              lable={t("IP Number")}
              placeholder=" "
              required={true}
              value={values.ipNo || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="ipNo"
              onChange={handleChange}
            />
            <DatePicker
              className="custom-calendar"
              placeholder={t("date")}
              lable={t("Date")}
              respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
              name="date"
              id="date"
              value={values.date || ""}
              handleChange={handleChange}
            />
            <TimePicker
              placeholderName=""
              lable={t("Time")}
              id="Time"
              name="Time"
              value={values.Time || ""}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="dob"
              lable={t("Age (DOB)")}
              placeholder=" "
              required={true}
              value={values.dob || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="dob"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="year"
              lable={t("Year")}
              placeholder=" "
              required={true}
              value={values.year || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="year"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="g"
              lable={t("G")}
              placeholder=" "
              required={true}
              value={values.g || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="g"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="p"
              lable={t("P")}
              placeholder=" "
              required={true}
              value={values.p || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="p"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="lmp"
              lable={t("LMP (last normal menstrual period)")}
              placeholder=" "
              required={true}
              value={values.lmp || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="lmp"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="edd"
              lable={t("Expected date of delivery (EDD)")}
              placeholder=" "
              required={true}
              value={values.edd || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="edd"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="lpm"
              lable={t("Gestational age by date (LPM)")}
              placeholder=" "
              required={true}
              value={values.lpm || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="lpm"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="gestationalAge20Weeks"
              lable={t(
                "Gestational age by first u/s (done within 20 weeks' gestation)"
              )}
              placeholder=" "
              required={true}
              value={values.gestationalAge20Weeks || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="gestationalAge20Weeks"
              onChange={handleChange}
            />
          </div>
          <div className="row p-2">
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="historyOfAnyAllergy"
              id="historyOfAnyAllergy"
              placeholderName={t("History of any allergy, medical condition")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.historyOfAnyAllergy || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="inductionReviewed"
              id="inductionReviewed"
              placeholderName={t("Indication for Induction Reviewed")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.inductionReviewed || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="contraindication"
              id="contraindication"
              placeholderName={t(
                "Contraindication excluded e.g. malposition, malformation, CPD"
              )}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.contraindication || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="methodOfInduction"
              id="methodOfInduction"
              placeholderName={t("Planned Method of Induction")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.methodOfInduction || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="formSignedByPatients"
              id="formSignedByPatients"
              placeholderName={t(
                "Consent form signed by patients and next of kin"
              )}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.formSignedByPatients || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="heartRateAssessment"
              id="heartRateAssessment"
              placeholderName={t("Fetal heart rate assessment by CTG done")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.heartRateAssessment || []}
              isRemoveTemplate={true}
            />
          </div>
          <Heading title={<span>{t("Pre induction Modified Bishop's score")}</span>} />
          <div className="row p-2">
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="score"
              id="score"
              placeholderName={t("Score")}
              dynamicOptions={[
                { name: "0", value: "0" },
                { name: "1", value: "1" },
                { name: "2", value: "2" },
                { name: "3", value: "3" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.score || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="cervicalDilation"
              id="cervicalDilation"
              placeholderName={t("Cervical dilation (cm)")}
              dynamicOptions={[
                { name: "Closed", value: "Closed" },
                { name: "1-2", value: "1-2" },
                { name: "3-4", value: "3-4" },
                { name: ">5", value: ">5" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.cervicalDilation || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="cervixPosition"
              id="cervixPosition"
              placeholderName={t("Position of cervix")}
              dynamicOptions={[
                { name: "Posterior", value: "Posterior" },
                { name: "Central", value: "Central" },
                { name: "Anterior", value: "Anterior" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.cervixPosition || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="cervicalConsistency"
              id="cervicalConsistency"
              placeholderName={t("Cervical consistency")}
              dynamicOptions={[
                { name: "Firm", value: "Firm" },
                { name: "Medium", value: "Medium" },
                { name: "Soft", value: "Soft" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.cervicalConsistency || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="cervicalLength"
              id="cervicalLength"
              placeholderName={t("Cervical length")}
              dynamicOptions={[
                { name: ">4", value: ">4" },
                { name: "3-4", value: "3-4" },
                { name: "1-2", value: "1-2" },
                { name: "<1", value: "<1" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.cervicalLength || []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="fetalHead"
              id="fetalHead"
              placeholderName={t("Station of fetal head")}
              dynamicOptions={[
                { name: "-3", value: "-3" },
                { name: "-2", value: "-2" },
                { name: "-1,0", value: "-1,0" },
                { name: "+1,+2", value: "+1,+2" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values.fetalHead || []}
              isRemoveTemplate={true}
            />
            <Input
              type="text"
              className="form-control"
              id="patientScore"
              lable={t("Total score of the patient")}
              placeholder="(Favourable scores 6-13, Unfavourable 0-5)"
              required={true}
              value={values.patientScore || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="patientScore"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="doctorSignature"
              lable={t("Name & signature of the doctor")}
              placeholder=""
              required={true}
              value={values.doctorSignature || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="doctorSignature"
              onChange={handleChange}
            />
            <DatePicker
              className="custom-calendar"
              placeholder=""
              lable={t("Date")}
              respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
              name="bishopDate"
              id="bishopDate"
              value={values.bishopDate || ""}
              handleChange={handleChange}
            />
            <TimePicker
              placeholderName=""
              lable={t("Time")}
              id="bishopTime"
              name="bishopTime"
              value={values.bishopTime || ""}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              handleChange={handleChange}
            />
          </div>
        </>
      )}

      {/* Consent Form */}
      {activeForm === "consent" && (
        <>
          <Heading title={<span>{t("CONSENT FORM")}</span>} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              id="consentPatientName"
              lable={t("Patient Name")}
              placeholder=""
              required={true}
              value={values.consentPatientName || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentPatientName"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentWifeOf"
              lable={t("W/O")}
              placeholder=""
              required={true}
              value={values.consentWifeOf || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentWifeOf"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentIDnumber"
              lable={t("ID Number")}
              placeholder=""
              required={true}
              value={values.consentIDnumber || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentIDnumber"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentDOB"
              lable={t("DOB")}
              placeholder=""
              required={true}
              value={values.consentDOB || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentDOB"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentAge"
              lable={t("Age")}
              placeholder=""
              required={true}
              value={values.consentAge || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentAge"
              onChange={handleChange}
            />
          </div>
          <div className="row p-2">
            <p>
              {t("Have read the above document and have understood the need for the proposed procedure.")}
            </p>
          </div>
          <div className="row p-2">
            <p>
              The indication, possible complications and need for further
              procedure in case of failure of the induction of labor have been
              explained to us by our doctor
            </p>
          </div>
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              id="consentDoctorName"
              lable={t("Name of the Doctor")}
              placeholder=""
              required={true}
              value={values.consentDoctorName || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentDoctorName"
              onChange={handleChange}
            />
          </div>
          <div className="row p-2">
            <p>
              {t("I have been given the opportunity to ask questions and clarify my doubts.")}
            </p>
          </div>
          <div className="row p-2">
            <p>
              I hereby give my full consent to undergo the procedure of
              induction. I understand the risk involved in the procedure.
            </p>
          </div>
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              id="consentIndication"
              lable={t("Indication")}
              placeholder=""
              required={true}
              value={values.consentIndication || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentIndication"
              onChange={handleChange}
            />
            <TimePicker
              placeholderName=""
              lable={t("Time")}
              id="consentTime"
              name="consentTime"
              value={values.consentTime || ""}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <DatePicker
              className="custom-calendar"
              placeholder=""
              lable={t("Date")}
              respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
              name="consentDate"
              id="consentDate"
              value={values.consentDate || ""}
              handleChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentPlace"
              lable={t("Place")}
              placeholder=""
              required={true}
              value={values.consentPlace || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentPlace"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentPatientSignature"
              lable={t("Name & Signature of Patient")}
              placeholder=""
              required={true}
              value={values.consentPatientSignature || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentPatientSignature"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentKinSignature"
              lable={t("Name & Signature of the Next of Kin")}
              placeholder=""
              required={true}
              value={values.consentKinSignature || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentKinSignature"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentAttendingSignature"
              lable={t("Name & Signature of Attending Doctor")}
              placeholder=""
              required={true}
              value={values.consentAttendingSignature || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentAttendingSignature"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="consentWitnessSignature"
              lable={t("Name & Signature of Witness")}
              placeholder=""
              required={true}
              value={values.consentWitnessSignature || ""}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="consentWitnessSignature"
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2 px-2 mt-3">
        {!editMode ? (
          <button
            type="button"
            className="btn btn-sm btn-primary mr-1"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? t("Saving...") : t("Save")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary mr-1"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? t("Updating...") : t("Update")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary mr-1"
              onClick={resetForm}
              disabled={loading}
            >
              {t("Cancel")}
            </button>
          </>
        )}
      </div>

      {/* Table Section */}
      {tableData.length > 0 && (
        <div className="mt-4">
          <Heading title={<span className="text-dark">{t("Saved Forms")}</span>} />
          <Tables
            thead={CONSENTFORMINDUCTION}
            tbody={formatTableData()}
            loading={loading}
          />
        </div>
      )}
    </>
  );
};

export default ConsentFormAndInduction;