import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { notify } from "../../utils/utils";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";
import {
  NursingWardSaveInternalNewBornBaby,
  NursingWardUpdateInternalNewBornBaby,
  NursingWardGetInternalNewBornList,
} from "../../networkServices/nursingWardAPI";
import DatePicker from "../formComponent/DatePicker";

const InternalNewbornUnit = ({ onClose, data }) => {
  console.log("Received props:", data);
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const [values, setValues] = useState({});
  const [tableData, setTableData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const NEWBORNRECORDS = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("ROM") },
    { width: "5%", name: t("Delivery") },
    { width: "5%", name: t("C/S Type") },
    { width: "5%", name: t("Multiple Delivery") },
    { width: "5%", name: t("BVM Resuscitation?") },
    { width: "8%", name: t("Born outside this facility") },
    { width: "3%", name: t("Name") },
    { width: "5%", name: t("Blood Grp") },
    { width: "5%", name: t("Rhesus") },
    { width: "5%", name: t("PMTCT Status") },
    { width: "5%", name: t("VDRL") },
    { width: "5%", name: t("Mother ARVs") },
    { width: "5%", name: t("APH") },
    { width: "5%", name: t("Created By") },
    { width: "3%", name: t("Edit") },
  ];

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const transactionid = data?.transactionID;

      if (!transactionid) {
        notify(t("Transaction ID missing"), "error");
        return;
      }

      let response = await NursingWardGetInternalNewBornList(transactionid);

      if (response?.success) {
        setTableData(response.data);
      } else {
        notify(response?.message || "Failed to fetch data", "error");
      }
    } catch (error) {
      notify(error?.message || "Error fetching data", "error");
    }
  };

  // String से array में convert करने का function
  const stringToArray = (str) => {
    if (!str || str.trim() === "") return [];
    return str.split(",").map((item) => item.trim());
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setValues((val) => ({
        ...val,
        [name]: checked ? "Yes" : "No",
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

  const preparePayload = () => {
    const transactionID = data?.transactionID;
    const patientID = data?.patientID;

    const payload = {
      patientID: patientID || "",
      transactionID: transactionID || 0,

      // Mother's Details
      txtMotherName: values?.txtMotherName || "",
      txtMotherAge: values?.txtMotherAge || "",
      txtMotherIPNo: values?.txtMotherIPNo || "",
      txtGestationWks: values?.txtGestationWks || "",
      txtParity1: values?.txtParity1 || "",
      txtParity2: values?.txtParity2 || "",
      rblANCAttendance: Array.isArray(values?.rblANCAttendance)
        ? values.rblANCAttendance.join(", ")
        : values?.rblANCAttendance || "",
      rblBloodGrp: Array.isArray(values?.rblBloodGrp)
        ? values.rblBloodGrp.join(", ")
        : values?.rblBloodGrp || "",
      txtLMP: values?.txtLMP || "",
      txtEDD: values?.txtEDD || "",
      rblVDRL: Array.isArray(values?.rblVDRL)
        ? values.rblVDRL.join(", ")
        : values?.rblVDRL || "",
      rblPMTCT: Array.isArray(values?.rblPMTCT)
        ? values.rblPMTCT.join(", ")
        : values?.rblPMTCT || "",
      rblMotherARVs: Array.isArray(values?.rblMotherARVs)
        ? values.rblMotherARVs.join(", ")
        : values?.rblMotherARVs || "",
      rblDiabetes: Array.isArray(values?.rblDiabetes)
        ? values.rblDiabetes.join(", ")
        : values?.rblDiabetes || "",
      rblCurrentTB: Array.isArray(values?.rblCurrentTB)
        ? values.rblCurrentTB.join(", ")
        : values?.rblCurrentTB || "",
      rblAntibiotics: Array.isArray(values?.rblAntibiotics)
        ? values.rblAntibiotics.join(", ")
        : values?.rblAntibiotics || "",
      rblHTNPregnancy: Array.isArray(values?.rblHTNPregnancy)
        ? values.rblHTNPregnancy.join(", ")
        : values?.rblHTNPregnancy || "",
      rblAPH: Array.isArray(values?.rblAPH)
        ? values.rblAPH.join(", ")
        : values?.rblAPH || "",
      rblMultiplePG: Array.isArray(values?.rblMultiplePG)
        ? values.rblMultiplePG.join(", ")
        : values?.rblMultiplePG || "",
      txtMultipleNumber: values?.txtMultipleNumber || "",
      rblPreeclampsia: Array.isArray(values?.rblPreeclampsia)
        ? values.rblPreeclampsia.join(", ")
        : values?.rblPreeclampsia || "",
      rblEclampsia: Array.isArray(values?.rblEclampsia)
        ? values.rblEclampsia.join(", ")
        : values?.rblEclampsia || "",
      rblFever: Array.isArray(values?.rblFever)
        ? values.rblFever.join(", ")
        : values?.rblFever || "",
      rblRhesus: Array.isArray(values?.rblRhesus)
        ? values.rblRhesus.join(", ")
        : values?.rblRhesus || "",
      txtMaternalCond: values?.txtMaternalCond || "",
      txtMaternalDrugs: values?.txtMaternalDrugs || "",

      // Labour/Delivery
      txtFirstStg: values?.txtFirstStg || "",
      txtSecondStg: values?.txtSecondStg || "",
      txtTimeDelivery: values?.txtTimeDelivery || "",
      rblROM: Array.isArray(values?.rblROM)
        ? values.rblROM.join(", ")
        : values?.rblROM || "",
      rblFetalDistress: Array.isArray(values?.rblFetalDistress)
        ? values.rblFetalDistress.join(", ")
        : values?.rblFetalDistress || "",
      rblThickMeconium: Array.isArray(values?.rblThickMeconium)
        ? values.rblThickMeconium.join(", ")
        : values?.rblThickMeconium || "",
      rblMeconiumGrade: Array.isArray(values?.rblMeconiumGrade)
        ? values.rblMeconiumGrade.join(", ")
        : values?.rblMeconiumGrade || "",
      cblDelivery: Array.isArray(values?.cblDelivery)
        ? values.cblDelivery.join(", ")
        : values?.cblDelivery || "",
      rblCSType: Array.isArray(values?.rblCSType)
        ? values.rblCSType.join(", ")
        : values?.rblCSType || "",
      txtReasonEmergencyCS: values?.txtReasonEmergencyCS || "",
      rblBVM: Array.isArray(values?.rblBVM)
        ? values.rblBVM.join(", ")
        : values?.rblBVM || "",
      rblPlacentaComplete: Array.isArray(values?.rblPlacentaComplete)
        ? values.rblPlacentaComplete.join(", ")
        : values?.rblPlacentaComplete || "",
      rblAbnormalPlacenta: Array.isArray(values?.rblAbnormalPlacenta)
        ? values.rblAbnormalPlacenta.join(", ")
        : values?.rblAbnormalPlacenta || "",
      txtPlacentaAbnormalities: values?.txtPlacentaAbnormalities || "",
      rblOPV: Array.isArray(values?.rblOPV)
        ? values.rblOPV.join(", ")
        : values?.rblOPV || "",
      rblBCG: Array.isArray(values?.rblBCG)
        ? values.rblBCG.join(", ")
        : values?.rblBCG || "",
      rblTEO: Array.isArray(values?.rblTEO)
        ? values.rblTEO.join(", ")
        : values?.rblTEO || "",
      rblVitK: Array.isArray(values?.rblVitK)
        ? values.rblVitK.join(", ")
        : values?.rblVitK || "",
      rblCHX: Array.isArray(values?.rblCHX)
        ? values.rblCHX.join(", ")
        : values?.rblCHX || "",

      // Infant's Details
      txtDateOfBirth: values?.txtDateOfBirth || "",
      rblSex: Array.isArray(values?.rblSex)
        ? values.rblSex.join(", ")
        : values?.rblSex || "",
      chkIndeterminate: values?.chkIndeterminate || "No",
      txtInfantIPNo: values?.txtInfantIPNo || "",
      cblApgar: Array.isArray(values?.cblApgar)
        ? values.cblApgar.join(", ")
        : values?.cblApgar || "",
      txtBirthWt: values?.txtBirthWt || "",
      txtWeightNow: values?.txtWeightNow || "",
      rblPostnatalWard: Array.isArray(values?.rblPostnatalWard)
        ? values.rblPostnatalWard.join(", ")
        : values?.rblPostnatalWard || "",
      txtAgeBBA: values?.txtAgeBBA || "",
      txtAgeDaysHrs: values?.txtAgeDaysHrs || "",
      rblBornOutside: Array.isArray(values?.rblBornOutside)
        ? values.rblBornOutside.join(", ")
        : values?.rblBornOutside || "",
      rblBornWhere: Array.isArray(values?.rblBornWhere)
        ? values.rblBornWhere.join(", ")
        : values?.rblBornWhere || "",
      txtReasonsReferral: values?.txtReasonsReferral || "",
      txtCompletedBy: values?.txtCompletedBy || "",
      txtReceivedBy: values?.txtReceivedBy || "",
      txtReceivedTime: values?.txtReceivedTime || "",

      // General Examination
      rblJaundice: Array.isArray(values?.rblJaundice)
        ? values.rblJaundice.join(", ")
        : values?.rblJaundice || "",
      rblCry: Array.isArray(values?.rblCry)
        ? values.rblCry.join(", ")
        : values?.rblCry || "",
      rblCentralCyanosis: Array.isArray(values?.rblCentralCyanosis)
        ? values.rblCentralCyanosis.join(", ")
        : values?.rblCentralCyanosis || "",
      rblIndrawing: Array.isArray(values?.rblIndrawing)
        ? values.rblIndrawing.join(", ")
        : values?.rblIndrawing || "",
      rblGrunting: Array.isArray(values?.rblGrunting)
        ? values.rblGrunting.join(", ")
        : values?.rblGrunting || "",
      rblGoodBilateralAirEntry: Array.isArray(values?.rblGoodBilateralAirEntry)
        ? values.rblGoodBilateralAirEntry.join(", ")
        : values?.rblGoodBilateralAirEntry || "",
      rblCrackles: Array.isArray(values?.rblCrackles)
        ? values.rblCrackles.join(", ")
        : values?.rblCrackles || "",
      txtCapRefill: values?.txtCapRefill || "",
      rblPallorAnemia: Array.isArray(values?.rblPallorAnemia)
        ? values.rblPallorAnemia.join(", ")
        : values?.rblPallorAnemia || "",
      rblMurmur: Array.isArray(values?.rblMurmur)
        ? values.rblMurmur.join(", ")
        : values?.rblMurmur || "",
      txtMurmurDescription: values?.txtMurmurDescription || "",
      rblCanBreastfeed: Array.isArray(values?.rblCanBreastfeed)
        ? values.rblCanBreastfeed.join(", ")
        : values?.rblCanBreastfeed || "",
      rblBulgingFontanelle: Array.isArray(values?.rblBulgingFontanelle)
        ? values.rblBulgingFontanelle.join(", ")
        : values?.rblBulgingFontanelle || "",
      rblIrritable: Array.isArray(values?.rblIrritable)
        ? values.rblIrritable.join(", ")
        : values?.rblIrritable || "",
      rblTone: Array.isArray(values?.rblTone)
        ? values.rblTone.join(", ")
        : values?.rblTone || "",
      rblDistension: Array.isArray(values?.rblDistension)
        ? values.rblDistension.join(", ")
        : values?.rblDistension || "",
      rblUmbilicus: Array.isArray(values?.rblUmbilicus)
        ? values.rblUmbilicus.join(", ")
        : values?.rblUmbilicus || "",
      txtNeuroDescription: values?.txtNeuroDescription || "",
      txtFurtherExamination: values?.txtFurtherExamination || "",
      rblBirthDefects: Array.isArray(values?.rblBirthDefects)
        ? values.rblBirthDefects.join(", ")
        : values?.rblBirthDefects || "",
      cblBirthDefectsTypes: Array.isArray(values?.cblBirthDefectsTypes)
        ? values.cblBirthDefectsTypes.join(", ")
        : values?.cblBirthDefectsTypes || "",
      txtBirthDefectsDescription: values?.txtBirthDefectsDescription || "",
      txtProblemsSummary: values?.txtProblemsSummary || "",

      // Vital Signs
      rblGlucose: Array.isArray(values?.rblGlucose)
        ? values.rblGlucose.join(", ")
        : values?.rblGlucose || "",
      txtGlucoseValue: values?.txtGlucoseValue || "",
      rblBilirubin: Array.isArray(values?.rblBilirubin)
        ? values.rblBilirubin.join(", ")
        : values?.rblBilirubin || "",
      txtBilirubinValue: values?.txtBilirubinValue || "",
      rblBiliunit: Array.isArray(values?.rblBiliunit)
        ? values.rblBiliunit.join(", ")
        : values?.rblBiliunit || "",
      txtOtherInvestigations: values?.txtOtherInvestigations || "",

      // Admission Diagnoses - ये आपके checkboxes के लिए हैं
      chkSevere1: values?.chkSevere1 || "No",
      chkSevere2: values?.chkSevere2 || "No",
      chkMild1: values?.chkMild1 || "No",
      chkMild2: values?.chkMild2 || "No",
      chkPreterm1: values?.chkPreterm1 || "No",
      chkPreterm2: values?.chkPreterm2 || "No",
      chkNeonatalSepsis1: values?.chkNeonatalSepsis1 || "No",
      chkNeonatalSepsis2: values?.chkNeonatalSepsis2 || "No",
      chkMeconium1: values?.chkMeconium1 || "No",
      chkMeconium2: values?.chkMeconium2 || "No",
      chkMultipleDelivery1: values?.chkMultipleDelivery1 || "No",
      chkMultipleDelivery2: values?.chkMultipleDelivery2 || "No",
      chkNewbornRDS1: values?.chkNewbornRDS1 || "No",
      chkNewbornRDS2: values?.chkNewbornRDS2 || "No",
      chkJaundice1: values?.chkJaundice1 || "No",
      chkJaundice2: values?.chkJaundice2 || "No",
      chkMeningitis1: values?.chkMeningitis1 || "No",
      chkMeningitis2: values?.chkMeningitis2 || "No",
      chkBirthWt1: values?.chkBirthWt1 || "No",
      chkBirthWt2: values?.chkBirthWt2 || "No",

      txtOtherDiagnosis: values?.txtOtherDiagnosis || "",
      txtClinicianName: values?.txtClinicianName || "",
      txtClinicianTime: values?.txtClinicianTime || "",
      txtClinicianDate: values?.txtClinicianDate || "",
    };

    // Edit mode में ID add करें
    if (editMode && editId) {
      payload.id = editId;
    }

    return payload;
  };

  const handleSave = async () => {
    try {
      const payload = preparePayload();

      console.log("Save Payload:", JSON.stringify(payload, null, 2));

      let response = await NursingWardSaveInternalNewBornBaby(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        resetForm();
        await fetchTableData();
      } else {
        notify(response?.message || "Failed to save", "error");
      }
    } catch (error) {
      console.error("Save Error:", error);
      notify(error?.message || "Error saving data", "error");
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = preparePayload();

      if (!editId) {
        notify(t("No record selected for update"), "error");
        return;
      }

      console.log("Update Payload:", JSON.stringify(payload, null, 2));

      let response = await NursingWardUpdateInternalNewBornBaby(payload);

      if (response?.success) {
        notify(t("Updated successfully"), "success");
        resetForm();
        await fetchTableData();
      } else {
        notify(response?.message || "Failed to update", "error");
      }
    } catch (error) {
      console.error("Update Error:", error);
      notify(error?.message || "Error updating data", "error");
    }
  };

  const resetForm = () => {
    setValues({});
    setEditMode(false);
    setEditId(null);
  };

  const handleEdit = (row) => {
    console.log("Editing row:", row);

    // Table से मिले data को form में load करें
    setValues({
      // Mother's Details
      txtMotherName: row.txtMotherName || "",
      txtMotherAge: row.txtMotherAge || "",
      txtMotherIPNo: row.txtMotherIPNo || "",
      txtGestationWks: row.txtGestationWks || "",
      txtParity1: row.txtParity1 || "",
      txtParity2: row.txtParity2 || "",
      rblANCAttendance: stringToArray(row.rblANCAttendance),
      rblBloodGrp: stringToArray(row.rblBloodGrp),
      txtLMP: row.txtLMP || "",
      txtEDD: row.txtEDD || "",
      rblVDRL: stringToArray(row.rblVDRL),
      rblPMTCT: stringToArray(row.rblPMTCT),
      rblMotherARVs: stringToArray(row.rblMotherARVs),
      rblDiabetes: stringToArray(row.rblDiabetes),
      rblCurrentTB: stringToArray(row.rblCurrentTB),
      rblAntibiotics: stringToArray(row.rblAntibiotics),
      rblHTNPregnancy: stringToArray(row.rblHTNPregnancy),
      rblAPH: stringToArray(row.rblAPH),
      rblMultiplePG: stringToArray(row.rblMultiplePG),
      txtMultipleNumber: row.txtMultipleNumber || "",
      rblPreeclampsia: stringToArray(row.rblPreeclampsia),
      rblEclampsia: stringToArray(row.rblEclampsia),
      rblFever: stringToArray(row.rblFever),
      rblRhesus: stringToArray(row.rblRhesus),
      txtMaternalCond: row.txtMaternalCond || "",
      txtMaternalDrugs: row.txtMaternalDrugs || "",

      // Labour/Delivery
      txtFirstStg: row.txtFirstStg || "",
      txtSecondStg: row.txtSecondStg || "",
      txtTimeDelivery: row.txtTimeDelivery || "",
      rblROM: stringToArray(row.rblROM),
      rblFetalDistress: stringToArray(row.rblFetalDistress),
      rblThickMeconium: stringToArray(row.rblThickMeconium),
      rblMeconiumGrade: stringToArray(row.rblMeconiumGrade),
      cblDelivery: stringToArray(row.cblDelivery),
      rblCSType: stringToArray(row.rblCSType),
      txtReasonEmergencyCS: row.txtReasonEmergencyCS || "",
      rblBVM: stringToArray(row.rblBVM),
      rblPlacentaComplete: stringToArray(row.rblPlacentaComplete),
      rblAbnormalPlacenta: stringToArray(row.rblAbnormalPlacenta),
      txtPlacentaAbnormalities: row.txtPlacentaAbnormalities || "",
      rblOPV: stringToArray(row.rblOPV),
      rblBCG: stringToArray(row.rblBCG),
      rblTEO: stringToArray(row.rblTEO),
      rblVitK: stringToArray(row.rblVitK),
      rblCHX: stringToArray(row.rblCHX),

      // Infant's Details
      txtDateOfBirth: row.txtDateOfBirth || "",
      rblSex: stringToArray(row.rblSex),
      chkIndeterminate: row.chkIndeterminate || "No",
      txtInfantIPNo: row.txtInfantIPNo || "",
      cblApgar: stringToArray(row.cblApgar),
      txtBirthWt: row.txtBirthWt || "",
      txtWeightNow: row.txtWeightNow || "",
      rblPostnatalWard: stringToArray(row.rblPostnatalWard),
      txtAgeBBA: row.txtAgeBBA || "",
      txtAgeDaysHrs: row.txtAgeDaysHrs || "",
      rblBornOutside: stringToArray(row.rblBornOutside),
      rblBornWhere: stringToArray(row.rblBornWhere),
      txtReasonsReferral: row.txtReasonsReferral || "",
      txtCompletedBy: row.txtCompletedBy || "",
      txtReceivedBy: row.txtReceivedBy || "",
      txtReceivedTime: row.txtReceivedTime || "",

      // General Examination
      rblJaundice: stringToArray(row.rblJaundice),
      rblCry: stringToArray(row.rblCry),
      rblCentralCyanosis: stringToArray(row.rblCentralCyanosis),
      rblIndrawing: stringToArray(row.rblIndrawing),
      rblGrunting: stringToArray(row.rblGrunting),
      rblGoodBilateralAirEntry: stringToArray(row.rblGoodBilateralAirEntry),
      rblCrackles: stringToArray(row.rblCrackles),
      txtCapRefill: row.txtCapRefill || "",
      rblPallorAnemia: stringToArray(row.rblPallorAnemia),
      rblMurmur: stringToArray(row.rblMurmur),
      txtMurmurDescription: row.txtMurmurDescription || "",
      rblCanBreastfeed: stringToArray(row.rblCanBreastfeed),
      rblBulgingFontanelle: stringToArray(row.rblBulgingFontanelle),
      rblIrritable: stringToArray(row.rblIrritable),
      rblTone: stringToArray(row.rblTone),
      rblDistension: stringToArray(row.rblDistension),
      rblUmbilicus: stringToArray(row.rblUmbilicus),
      txtNeuroDescription: row.txtNeuroDescription || "",
      txtFurtherExamination: row.txtFurtherExamination || "",
      rblBirthDefects: stringToArray(row.rblBirthDefects),
      cblBirthDefectsTypes: stringToArray(row.cblBirthDefectsTypes),
      txtBirthDefectsDescription: row.txtBirthDefectsDescription || "",
      txtProblemsSummary: row.txtProblemsSummary || "",

      // Vital Signs
      rblGlucose: stringToArray(row.rblGlucose),
      txtGlucoseValue: row.txtGlucoseValue || "",
      rblBilirubin: stringToArray(row.rblBilirubin),
      txtBilirubinValue: row.txtBilirubinValue || "",
      rblBiliunit: stringToArray(row.rblBiliunit),
      txtOtherInvestigations: row.txtOtherInvestigations || "",

      // Admission Diagnoses
      chkSevere1: row.chkSevere1 || "No",
      chkSevere2: row.chkSevere2 || "No",
      chkMild1: row.chkMild1 || "No",
      chkMild2: row.chkMild2 || "No",
      chkPreterm1: row.chkPreterm1 || "No",
      chkPreterm2: row.chkPreterm2 || "No",
      chkNeonatalSepsis1: row.chkNeonatalSepsis1 || "No",
      chkNeonatalSepsis2: row.chkNeonatalSepsis2 || "No",
      chkMeconium1: row.chkMeconium1 || "No",
      chkMeconium2: row.chkMeconium2 || "No",
      chkMultipleDelivery1: row.chkMultipleDelivery1 || "No",
      chkMultipleDelivery2: row.chkMultipleDelivery2 || "No",
      chkNewbornRDS1: row.chkNewbornRDS1 || "No",
      chkNewbornRDS2: row.chkNewbornRDS2 || "No",
      chkJaundice1: row.chkJaundice1 || "No",
      chkJaundice2: row.chkJaundice2 || "No",
      chkMeningitis1: row.chkMeningitis1 || "No",
      chkMeningitis2: row.chkMeningitis2 || "No",
      chkBirthWt1: row.chkBirthWt1 || "No",
      chkBirthWt2: row.chkBirthWt2 || "No",

      txtOtherDiagnosis: row.txtOtherDiagnosis || "",
      txtClinicianName: row.txtClinicianName || "",
      txtClinicianTime: row.txtClinicianTime || "",
      txtClinicianDate: row.txtClinicianDate || "",
    });

    setEditMode(true);
    setEditId(row.id);

    // Form के top पर scroll करें
    window.scrollTo({ top: 0, behavior: "smooth" });

    notify(t("Record loaded for editing"), "success");
  };

  const renderForm = () => (
    <>
      <Heading
        title={<span className="text-dark">{t("Newborn Unit Admission Record")}</span>}
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
      <Heading title={<span className="text-dark">{t("Mother's Details")}</span>} />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="txtMotherName"
          lable={t("Name")}
          placeholder=" "
          required={true}
          value={values?.txtMotherName}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtMotherName"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtMotherAge"
          lable={t("Age")}
          placeholder=" "
          required={true}
          value={values?.txtMotherAge}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtMotherAge"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtMotherIPNo"
          lable={t("IP No.")}
          placeholder=" "
          required={true}
          value={values?.txtMotherIPNo}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtMotherIPNo"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtGestationWks"
          lable={t("Gestation (wks)")}
          placeholder=" "
          required={true}
          value={values?.txtGestationWks}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtGestationWks"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtParity1"
          lable={t("Parity")}
          placeholder=" "
          required={true}
          value={values?.txtParity1}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtParity1"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtParity2"
          lable={t("Second Parity")}
          placeholder=" "
          required={true}
          value={values?.txtParity2}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtParity2"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblANCAttendance"
          id="rblANCAttendance"
          placeholderName={t("ANC Attendance")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblANCAttendance}
          isRemoveTemplate={true}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblBloodGrp"
          id="rblBloodGrp"
          placeholderName={t("Blood Group")}
          dynamicOptions={[
            { name: "O", value: "1" },
            { name: "A", value: "2" },
            { name: "B", value: "3" },
            { name: "AB", value: "4" },
            { name: "unkn", value: "5" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblBloodGrp}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtLMP"
          lable={t("LMP")}
          placeholder=" "
          value={values?.txtLMP}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtLMP"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtEDD"
          lable={t("EDD")}
          placeholder=" "
          value={values?.txtEDD}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtEDD"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblVDRL"
          id="rblVDRL"
          placeholderName={t("VDRL")}
          dynamicOptions={[
            { name: "Pos", value: "1" },
            { name: "Neg", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblVDRL}
          isRemoveTemplate={true}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblPMTCT"
          id="rblPMTCT"
          placeholderName={t("PMTCT Status")}
          dynamicOptions={[
            { name: "Pos", value: "1" },
            { name: "Neg", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblPMTCT}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblMotherARVs"
          id="rblMotherARVs"
          placeholderName={t("Mother ARVs")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblMotherARVs}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblDiabetes"
          id="rblDiabetes"
          placeholderName={t("Diabetes")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblDiabetes}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblCurrentTB"
          id="rblCurrentTB"
          placeholderName={t("Current TB Treatment")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblCurrentTB}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblAntibiotics"
          id="rblAntibiotics"
          placeholderName={t("Antibiotics")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblAntibiotics}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblHTNPregnancy"
          id="rblHTNPregnancy"
          placeholderName={t("Hypertension in Pregnancy")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblHTNPregnancy}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblAPH"
          id="rblAPH"
          placeholderName={t("APH")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No ", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblAPH}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblMultiplePG"
          id="rblMultiplePG"
          placeholderName={t("Multiple PG")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblMultiplePG}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtMultipleNumber"
          lable={t("If Yes, Number ?")}
          placeholder=" "
          value={values?.txtMultipleNumber}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtMultipleNumber"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblPreeclampsia"
          id="rblPreeclampsia"
          placeholderName={t("Pre-eclampsia")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblPreeclampsia}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblEclampsia"
          id="rblEclampsia"
          placeholderName={t("Eclampsia")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblEclampsia}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblFever"
          id="rblFever"
          placeholderName={t("Fever")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblFever}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblRhesus"
          id="rblRhesus"
          placeholderName={t("Rhesus")}
          dynamicOptions={[
            { name: "Pos", value: "1" },
            { name: "Neg", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblRhesus}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtMaternalDrugs"
          lable={t("Maternal Drugs")}
          placeholder=" "
          required={true}
          value={values?.txtMaternalDrugs}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtMaternalDrugs"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtMaternalCond"
          lable={t("Any other maternal condition")}
          placeholder=" "
          required={true}
          value={values?.txtMaternalCond}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtMaternalCond"
          onChange={handleChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Labour / Delivery")}</span>} />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="txtFirstStg"
          lable={t("Labour 1st Stg (hr)")}
          placeholder=" "
          required={true}
          value={values?.txtFirstStg}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtFirstStg"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtSecondStg"
          lable={t("2nd Stage (min)")}
          placeholder=" "
          required={true}
          value={values?.txtSecondStg}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtSecondStg"
          onChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Delivery Time")}
          lable={t("Time of Delivery")}
          id="txtTimeDelivery"
          name="txtTimeDelivery"
          value={values?.txtTimeDelivery}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblROM"
          id="rblROM"
          placeholderName={t("ROM")}
          dynamicOptions={[
            { name: "<18h", value: "<18h" },
            { name: ">18h", value: ">18h" },
            { name: "unk", value: "Unknown" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblROM}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblFetalDistress"
          id="rblFetalDistress"
          placeholderName={t("Fetal Distress")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblFetalDistress}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblThickMeconium"
          id="rblThickMeconium"
          placeholderName={t("Thick Meconium")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblThickMeconium}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblMeconiumGrade"
          id="rblMeconiumGrade"
          placeholderName={t("If yes, Meconium grade?")}
          dynamicOptions={[
            { name: "1", value: "1" },
            { name: "2", value: "2" },
            { name: "3", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblMeconiumGrade}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="cblDelivery"
          id="cblDelivery"
          placeholderName={t("Delivery")}
          dynamicOptions={[
            { name: "SVD", value: "SVD" },
            { name: "Forceps", value: "Forceps" },
            { name: "CS", value: "CS" },
            { name: "Breech", value: "Breech" },
            { name: "Vacuum", value: "Vacuum" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.cblDelivery}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblCSType"
          id="rblCSType"
          placeholderName={t("If C/S Type?")}
          dynamicOptions={[
            { name: "Elective", value: "Elective" },
            { name: "Emergency", value: "Emergency" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblCSType}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtReasonEmergencyCS"
          lable={t("Reason for Emergency CS")}
          placeholder=" "
          value={values?.txtReasonEmergencyCS}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtReasonEmergencyCS"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblBVM"
          id="rblBVM"
          placeholderName={t("BVM Resuscitation?")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblBVM}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblPlacentaComplete"
          id="rblPlacentaComplete"
          placeholderName={t("Placenta Complete?")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblPlacentaComplete}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblAbnormalPlacenta"
          id="rblAbnormalPlacenta"
          placeholderName={t("Abnormal Placenta?")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblAbnormalPlacenta}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtPlacentaAbnormalities"
          lable={t("Specify Placenta Abnormalities")}
          placeholder=" "
          value={values?.txtPlacentaAbnormalities}
          respclass="col-xl col-12"
          name="txtPlacentaAbnormalities"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblOPV"
          id="rblOPV"
          placeholderName={t("OPV")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblOPV}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblBCG"
          id="rblBCG"
          placeholderName={t("BCG")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblBCG}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblTEO"
          id="rblTEO"
          placeholderName={t("TEO")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblTEO}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblVitK"
          id="rblVitK"
          placeholderName={t("Vit K")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblVitK}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblCHX"
          id="rblCHX"
          placeholderName={t("CHX")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblCHX}
          isRemoveTemplate={true}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Infant's Details")}</span>} />
      <div className="row p-2">
        <DatePicker
          className="custom-calendar"
          placeholder={t("dob")}
          lable={t("Date of Birth")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="txtDateOfBirth"
          id="txtDateOfBirth"
          value={values?.txtDateOfBirth}
          handleChange={handleDateTimeChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblSex"
          id="rblSex"
          placeholderName={t("Sex")}
          dynamicOptions={[
            { name: "Female", value: "Female" },
            { name: "Male", value: "Male" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblSex}
          isRemoveTemplate={true}
        />
        <div className="col-xl-2 col-md-3 col-sm-6 col-12">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="chkIndeterminate"
              name="chkIndeterminate"
              checked={values?.chkIndeterminate === "Yes"}
              onChange={handleChange}
            />
            <label className="form-check-label ml-3 mt-1" htmlFor="chkIndeterminate">
              {t("Indeterminate")}
            </label>
          </div>
        </div>
        <Input
          type="text"
          className="form-control"
          id="txtInfantIPNo"
          lable={t("IP No.")}
          placeholder=" "
          required={true}
          value={values?.txtInfantIPNo}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtInfantIPNo"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="cblApgar"
          id="cblApgar"
          placeholderName={t("Apgar")}
          dynamicOptions={[
            { name: "1m", value: "1m" },
            { name: "5m", value: "5m" },
            { name: "10m", value: "10m" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.cblApgar}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtBirthWt"
          lable={t("Birth Weight (grams)")}
          placeholder=" "
          required={true}
          value={values?.txtBirthWt}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtBirthWt"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtWeightNow"
          lable={t("Weight now (grams)")}
          placeholder=" "
          required={true}
          value={values?.txtWeightNow}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtWeightNow"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblPostnatalWard"
          id="rblPostnatalWard"
          placeholderName={t("Baby from postnatal ward?")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblPostnatalWard}
          isRemoveTemplate={true}
        />
        {values?.rblPostnatalWard &&
          values.rblPostnatalWard.includes("Yes") && (
            <>
              <Input
                type="text"
                className="form-control"
                id="txtAgeBBA"
                lable={t("If Yes Fill in Age and BBA")}
                placeholder=" "
                value={values?.txtAgeBBA}
                respclass="col-xl-2 col-md-3 col-sm-6 col-12"
                name="txtAgeBBA"
                onChange={handleChange}
              />
              <Input
                type="text"
                className="form-control"
                id="txtAgeDaysHrs"
                lable={t("Age (days/hrs)")}
                placeholder=" "
                value={values?.txtAgeDaysHrs}
                respclass="col-xl-2 col-md-3 col-sm-6 col-12"
                name="txtAgeDaysHrs"
                onChange={handleChange}
              />
            </>
          )}
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblBornOutside"
          id="rblBornOutside"
          placeholderName={t("Born outside this facility?")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblBornOutside}
          isRemoveTemplate={true}
        />
        {values?.rblBornOutside && values.rblBornOutside.includes("Yes") && (
          <>
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="rblBornWhere"
              id="rblBornWhere"
              placeholderName={t("Born outside this facility")}
              dynamicOptions={[
                { name: "Home/Roadside", value: "Home/Roadside" },
                { name: "Other Facility", value: "Other Facility" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values?.rblBornWhere}
              isRemoveTemplate={true}
            />
          </>
        )}
        <Input
          type="text"
          className="form-control"
          id="txtReasonsReferral"
          lable={t("Reasons for referral to NBU")}
          placeholder=" "
          required={true}
          value={values?.txtReasonsReferral}
          respclass="col-xl col-12"
          name="txtReasonsReferral"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtCompletedBy"
          lable={t("Completed by (Name)")}
          placeholder=" "
          required={true}
          value={values?.txtCompletedBy}
          respclass="col-xl col-12"
          name="txtCompletedBy"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtReceivedBy"
          lable={t("Baby received on NBU by")}
          placeholder=" "
          required={true}
          value={values?.txtReceivedBy}
          respclass="col-xl col-12"
          name="txtReceivedBy"
          onChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Time")}
          lable={t("Time AM/PM")}
          id="txtReceivedTime"
          name="txtReceivedTime"
          value={values?.txtReceivedTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("General Examination")}</span>} />
      <div className="row p-2">
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblJaundice"
          id="rblJaundice"
          placeholderName={t("Jaundice")}
          dynamicOptions={[
            { name: "None", value: "0" },
            { name: "+", value: "1" },
            { name: "++", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblJaundice}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblCry"
          id="rblCry"
          placeholderName={t("Cry")}
          dynamicOptions={[
            { name: "Normal", value: "Normal" },
            { name: "Weak/Absent", value: "Weak/Absent" },
            { name: "High pitched", value: "High pitched" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblCry}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblCentralCyanosis"
          id="rblCentralCyanosis"
          placeholderName={t("Central Cyanosis")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblCentralCyanosis}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblIndrawing"
          id="rblIndrawing"
          placeholderName={t("Indrawing")}
          dynamicOptions={[
            { name: "None/Mild", value: "None/Mild" },
            { name: "Severe", value: "Severe" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblIndrawing}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblGrunting"
          id="rblGrunting"
          placeholderName={t("Grunting")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblGrunting}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblGoodBilateralAirEntry"
          id="rblGoodBilateralAirEntry"
          placeholderName={t("Good bilateral air entry")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblGoodBilateralAirEntry}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblCrackles"
          id="rblCrackles"
          placeholderName={t("Crackles")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblCrackles}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtCapRefill"
          lable={t("Cap Refill (Sternal)")}
          placeholder=" "
          value={values?.txtCapRefill}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtCapRefill"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblPallorAnemia"
          id="rblPallorAnemia"
          placeholderName={t("Pallor/Anemia")}
          dynamicOptions={[
            { name: "None", value: "0" },
            { name: "+", value: "1" },
            { name: "++", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblPallorAnemia}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblMurmur"
          id="rblMurmur"
          placeholderName={t("Murmur")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblMurmur}
          isRemoveTemplate={true}
        />
        {values?.rblMurmur && values.rblMurmur.includes("Yes") && (
          <>
            <Input
              type="text"
              className="form-control"
              id="txtMurmurDescription"
              lable={t("If murmur YES describe in free text")}
              placeholder=" "
              value={values?.txtMurmurDescription}
              respclass="col-xl col-12"
              name="txtMurmurDescription"
              onChange={handleChange}
            />
          </>
        )}
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblCanBreastfeed"
          id="rblCanBreastfeed"
          placeholderName={t("Can breastfeed?")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblCanBreastfeed}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblBulgingFontanelle"
          id="rblBulgingFontanelle"
          placeholderName={t("Bulging fontanelle")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblBulgingFontanelle}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblIrritable"
          id="rblIrritable"
          placeholderName={t("Irritable")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblIrritable}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblTone"
          id="rblTone"
          placeholderName={t("Tone")}
          dynamicOptions={[
            { name: "Normal", value: "Normal" },
            { name: "Increased", value: "Increased" },
            { name: "Reduced", value: "Reduced" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblTone}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblDistension"
          id="rblDistension"
          placeholderName={t("Distension")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblDistension}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblUmbilicus"
          id="rblUmbilicus"
          placeholderName={t("Umbilicus")}
          dynamicOptions={[
            { name: "Clean", value: "Clean" },
            { name: "Pus-red skin", value: "Pus-red skin" },
            { name: "Local pus", value: "Local pus" },
            { name: "Others", value: "Others" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblUmbilicus}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="txtNeuroDescription"
          lable={t(
            "Neuro - Describe any abnormal posture / movement and check reflexes(Sucking; Rooting; Grasp; Moro)"
          )}
          placeholder=" "
          value={values?.txtNeuroDescription}
          respclass="col-xl col-12"
          name="txtNeuroDescription"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtFurtherExamination"
          lable={t(
            "Further examination of Resp / CVS / GIT / GU / Skin / Birth Trauma? (Specify)"
          )}
          placeholder=" "
          value={values?.txtFurtherExamination}
          respclass="col-xl col-12"
          name="txtFurtherExamination"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblBirthDefects"
          id="rblBirthDefects"
          placeholderName={t("Birth defects")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblBirthDefects}
          isRemoveTemplate={true}
        />
        {values?.rblBirthDefects && values.rblBirthDefects.includes("Yes") && (
          <>
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="cblBirthDefectsTypes"
              id="cblBirthDefectsTypes"
              placeholderName={t("Birth defects Describe")}
              dynamicOptions={[
                { name: "Major GI Abnormality", value: "Major GI Abnormality" },
                { name: "Neural tube defects", value: "Neural tube defects" },
                { name: "Hydrocephalus", value: "Hydrocephalus" },
                { name: "Cleft lip/palate", value: "Cleft lip/palate" },
                { name: "Limb abnormalities", value: "Limb abnormalities" },
                { name: "Microcephaly", value: "Microcephaly" },
                {
                  name: "Birth injury/abnormalities",
                  value: "Birth injury/abnormalities",
                },
              ]}
              handleChange={handleMultiSelectChange}
              value={values?.cblBirthDefectsTypes}
              isRemoveTemplate={true}
            />
            <Input
              type="text"
              className="form-control"
              id="txtBirthDefectsDescription"
              lable={t("Birth defects Description")}
              placeholder=" "
              value={values?.txtBirthDefectsDescription}
              respclass="col-xl col-12"
              name="txtBirthDefectsDescription"
              onChange={handleChange}
            />
          </>
        )}
        <Input
          type="text"
          className="form-control"
          id="txtProblemsSummary"
          lable={t("List problems (most important first)")}
          placeholder=" "
          value={values?.txtProblemsSummary}
          respclass="col-xl col-12"
          name="txtProblemsSummary"
          onChange={handleChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Vital Signs")}</span>} />
      <div className="row p-2">
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblGlucose"
          id="rblGlucose"
          placeholderName={t("Glucose")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblGlucose}
          isRemoveTemplate={true}
        />
        {values?.rblGlucose && values.rblGlucose.includes("Yes") && (
          <>
            <Input
              type="text"
              className="form-control"
              id="txtGlucoseValue"
              lable={t("mmol/l")}
              placeholder=" "
              value={values?.txtGlucoseValue}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="txtGlucoseValue"
              onChange={handleChange}
            />
          </>
        )}
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rblBilirubin"
          id="rblBilirubin"
          placeholderName={t("Bilirubin")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rblBilirubin}
          isRemoveTemplate={true}
        />
        {values?.rblBilirubin && values.rblBilirubin.includes("Yes") && (
          <>
            <Input
              type="text"
              className="form-control"
              id="txtBilirubinValue"
              lable={t("Bilirubin Value")}
              placeholder=" "
              value={values?.txtBilirubinValue}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="txtBilirubinValue"
              onChange={handleChange}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="rblBiliunit"
              id="rblBiliunit"
              placeholderName={t("Unit")}
              dynamicOptions={[
                { name: "hmol/l", value: "hmol/l" },
                { name: "mg/dl", value: "mg/dl" },
              ]}
              handleChange={handleMultiSelectChange}
              value={values?.rblBiliunit}
              isRemoveTemplate={true}
            />
          </>
        )}
        <Input
          type="text"
          className="form-control"
          id="txtOtherInvestigations"
          lable={t("List other Investigations ordered")}
          placeholder=" "
          value={values?.txtOtherInvestigations}
          respclass="col-xl col-12"
          name="txtOtherInvestigations"
          onChange={handleChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Admission Diagnoses")}</span>} />
      <div className="row p-2">
        <div className="col-12 mb-2">
          <label className="form-label">{t("Primary Diagnosis")}</label>
          <div className="row">
            {[
              { name: "chkSevere1", label: "Severe / Encephalopathy" },
              { name: "chkMild1", label: "Mild / Moderate" },
              { name: "chkPreterm1", label: "Preterm" },
              { name: "chkNeonatalSepsis1", label: "Neonatal sepsis" },
              { name: "chkMeconium1", label: "Meconium aspiration" },
              { name: "chkMultipleDelivery1", label: "Multiple delivery" },
              { name: "chkNewbornRDS1", label: "Newborn RDS" },
              { name: "chkJaundice1", label: "Jaundice" },
              { name: "chkMeningitis1", label: "Meningitis" },
              { name: "chkBirthWt1", label: "Birth Wt < 2 kg" },
            ].map((item) => (
              <div key={item.name} className="col-xl-2 col-md-3 col-sm-4 col-6">
                <div className="form-check mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={item.name}
                    name={item.name}
                    checked={values?.[item.name] === "Yes"}
                    onChange={handleChange}
                  />
                  <label className="form-check-label ml-2" htmlFor={item.name}>
                    {item.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Input
          type="text"
          className="form-control"
          id="txtOtherDiagnosis"
          lable={t("ANY secondary diagnoses")}
          placeholder=" "
          value={values?.txtOtherDiagnosis}
          respclass="col-xl-6 col-md-6 col-sm-12 col-12"
          name="txtOtherDiagnosis"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="txtClinicianName"
          lable={t("Clinician Name")}
          placeholder=" "
          required={true}
          value={values?.txtClinicianName}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="txtClinicianName"
          onChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Time")}
          lable={t("Time")}
          id="txtClinicianTime"
          name="txtClinicianTime"
          value={values?.txtClinicianTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder={t("Date")}
          lable={t("Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="txtClinicianDate"
          id="txtClinicianDate"
          value={values?.txtClinicianDate}
          handleChange={handleDateTimeChange}
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
        <Tables
          thead={NEWBORNRECORDS}
          tbody={tableData.map((row, index) => ({
            "Sr.No": index + 1,
            ROM: row.rblROM || "-",
            Delivery: row.cblDelivery || "-",
            "C/S Type": row.rblCSType || "-",
            "Multiple Delivery": row.rblMultiplePG === "Yes" ? "Yes" : "No",
            "BVM Resuscitation?": row.rblBVM || "-",
            "Born outside this facility": row.rblBornOutside || "-",
            Name: row.txtMotherName || "-",
            "Blood Grp": row.rblBloodGrp || "-",
            Rhesus: row.rblRhesus || "-",
            "PMTCT Status": row.rblPMTCT || "-",
            VDRL: row.rblVDRL || "-",
            "Mother ARVs": row.rblMotherARVs || "-",
            APH: row.rblAPH || "-",
            "Created By": row.txtCompletedBy || "-",
            Edit: (
              <i
                className="bi bi-pencil-square"
                style={{
                  cursor: "pointer",
                  color: "#007bff",
                  fontSize: "1.2rem",
                }}
                onClick={() => handleEdit(row)}
                title={t("Edit")}
              />
            ),
          }))}
        />
      )}
    </div>
  );
};

export default InternalNewbornUnit;
