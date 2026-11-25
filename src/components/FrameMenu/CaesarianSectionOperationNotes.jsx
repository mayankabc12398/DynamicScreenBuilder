import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import TextAreaInput from "../formComponent/TextAreaInput";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import { notify } from "../../utils/ustil2";
import {
  bindDetailsCasereanSectionOperationAPI,
  SaveCasereanSectionOperationAPI,
} from "../../networkServices/OT/otAPI";
import MultiSelectComp from "../formComponent/MultiSelectComp";

const CaesarianSectionOperationNotes = ({ data }) => {
  const PatientID = data?.patientID || data?.PatientID;
  const TransactionID = data?.transactionID || data?.TransactionID;
  const [t] = useTranslation();

  const initialValues = {
    PatientID: "",
    TransactionID: "",
    ID: "",
    IntroductionToTeam: "",
    InformedConsentSigned: "",
    Surgeon: "",
    Anaesthesiologist: "",
    Assistant: "",
    ScrubNurse: "",
    PreopDiagnosis: "",
    FinalDiagnosis: "",
    CSCategory1: "",
    CSCategory2: "",
    CSCategory3: "",
    CSCategory4: "",
    CSCategoryEMCS: "",
    CSCategoryECS: "",
    AnaesthesiaG: "",
    AnaesthesiaS: "",
    AsepticCatherization: "",
    PreppedDraped: "",
    AbdClean: "",
    IscYes: "",
    IscNo: "",
    IscNoScar: "",
    SharpEntry: "",
    BluntEntry: "",
    VesicFM: "",
    DelayedCc: "",
    FindingsLivInfant: "",
    FindingsFSB: "",
    FindingsMacerated: "",
    PmdViaCCT: "",
    PmdViaManualRemoval: "",
    PmdViaWhole: "",
    PmdViaPieceMeal: "",
    PmdViaUterineCavityCleaned: "",
    PmdViaOvariesAndTubesNormal: "",
    UterineClosureSingleLayer: "",
    UterineClosureMultiple: "",
    AbdominalFatApposedYes: "",
    AbdominalFatApposedNo: "",
    SkinAppoContinous: "",
    SkinAppoIntermittent: "",
    AppositionAbsorbable: "",
    AppositionNonAbsorbable: "",
    UrineClear: "",
    UrineBloodStained: "",
    OxytocinGivenYes: "",
    OxytocinGivenNo: "",
    MisoprostolGivenYes: "",
    MisoprostolGivenNo: "",
    WHSCSVVTPreOp: "",
    WHSCSVVTPostOp: "",
    LevelOfCareRoutine: "",
    LevelOfCareHDU: "",
    LevelOfCareICU: "",
    VTERiskLow: "",
    VTERiskMedium: "",
    VTERiskHigh: "",
    Sex: "",
    ApgarScore: "",
    BirthWeight: "",
    UterineClosureSuture: "",
    RectusFasciaClosureSuture: "",
    EBL: "",
    OtherMedication: "",
    MFPPNeeded: "",
    VitalSign: "",
    EAA: "",
    RoomingAndLactational: "",
    MedicationAndFluids: "",
    Thromboprophylaxis: "",
    OralSipsAndGraduateDietFrom: "",
    AdditionalNotes: "",
  };

  const [payload, setPayload] = useState(initialValues);
  console.log(payload);

  const [tableData, setTableData] = useState([]);

  const saveUpdatePayload = {
    PatientID: PatientID,
    TransactionID: TransactionID,
    id: payload.ID || 0,

    IntroductionToTeam: Number(payload.IntroductionToTeam) || 0,
    InformedConsentSigned: Number(payload.InformedConsentSigned) || 0,
    Surgeon: payload.Surgeon,
    Anaesthesiologist: payload.Anaesthesiologist,
    Assistant: payload.Assistant,
    ScrubNurse: payload.ScrubNurse,

    PreopDiagnosis: payload.PreopDiagnosis,
    FinalDiagnosis: payload.FinalDiagnosis,

    CSCategory1: payload.CSCategory1,
    CSCategory2: payload.CSCategory2,
    CSCategory3: payload.CSCategory3,
    CSCategory4: payload.CSCategory4,
    CSCategoryEMCS: payload.CSCategoryEMCS,
    CSCategoryECS: payload.CSCategoryECS,

    AnaesthesiaG: payload.AnaesthesiaG,
    AnaesthesiaS: payload.AnaesthesiaS,

    AsepticCatherization: Number(payload.AsepticCatherization) || 0,
    PreppedDraped: payload.PreppedDraped,
    AbdClean: payload.AbdClean,

    IscYes: payload.IscYes,
    IscNo: payload.IscNo,
    IscNoScar: payload.IscNoScar,

    SharpEntry: payload.SharpEntry,
    BluntEntry: payload.BluntEntry,
    VesicFM: payload.VesicFM,
    DelayedCc: payload.DelayedCc,

    FindingsLivInfant: payload.FindingsLivInfant,
    FindingsFSB: payload.FindingsFSB,
    FindingsMacerated: payload.FindingsMacerated,

    PmdViaCCT: payload.PmdViaCCT,
    PmdViaManualRemoval: payload.PmdViaManualRemoval,
    PmdViaWhole: payload.PmdViaWhole,
    PmdViaPieceMeal: payload.PmdViaPieceMeal,
    PmdViaUterineCavityCleaned: payload.PmdViaUterineCavityCleaned,
    PmdViaOvariesAndTubesNormal: payload.PmdViaOvariesAndTubesNormal,

    UterineClosureSingleLayer: payload.UterineClosureSingleLayer,
    UterineClosureMultiple: payload.UterineClosureMultiple,

    AbdominalFatApposedYes: payload.AbdominalFatApposedYes,
    AbdominalFatApposedNo: payload.AbdominalFatApposedNo,

    SkinAppoContinous: payload.SkinAppoContinous,
    SkinAppoIntermittent: payload.SkinAppoIntermittent,

    AppositionAbsorbable: payload.AppositionAbsorbable,
    AppositionNonAbsorbable: payload.AppositionNonAbsorbable,

    UrineClear: payload.UrineClear,
    UrineBloodStained: payload.UrineBloodStained,

    OxytocinGivenYes: payload.OxytocinGivenYes,
    OxytocinGivenNo: payload.OxytocinGivenNo,

    MisoprostolGivenYes: payload.MisoprostolGivenYes,
    MisoprostolGivenNo: payload.MisoprostolGivenNo,

    WHSCSVVTPreOp: payload.WHSCSVVTPreOp,
    WHSCSVVTPostOp: payload.WHSCSVVTPostOp,

    LevelOfCareRoutine: payload.LevelOfCareRoutine,
    LevelOfCareHDU: payload.LevelOfCareHDU,
    LevelOfCareICU: payload.LevelOfCareICU,

    VTERiskLow: payload.VTERiskLow,
    VTERiskMedium: payload.VTERiskMedium,
    VTERiskHigh: payload.VTERiskHigh,

    Sex: payload.Sex,
    ApgarScore: payload.ApgarScore,
    BirthWeight: payload.BirthWeight,

    UterineClosureSuture: payload.UterineClosureSuture,
    RectusFasciaClosureSuture: payload.RectusFasciaClosureSuture,

    EBL: payload.EBL,
    OtherMedication: payload.OtherMedication,

    MFPPNeeded: payload.MFPPNeeded,
    VitalSign: payload.VitalSign,
    EAA: payload.EAA,
    RoomingAndLactational: payload.RoomingAndLactational,
    MedicationAndFluids: payload.MedicationAndFluids,
    Thromboprophylaxis: payload.Thromboprophylaxis,
    OralSipsAndGraduateDietFrom: payload.OralSipsAndGraduateDietFrom,

    AdditionalNotes: payload.AdditionalNotes,
  };

  const THEAD = [
    t("S.No"),
    t("Patient ID"),
    t("CreatedBy"),
    t("CreatedDatetime"),
    t("Edit"),
    // "Print",
  ];

  const options = [
    { value: "0", label: t("No") },
    { value: "1", label: t("Yes") },
  ];

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSelectChange = (name, option) => {
    setPayload((prev) => ({
      ...prev,
      [name]: option?.value ?? "",
    }));
  };

  const handleGetData = async (TransactionID) => {
    try {
      const APIresponse =
        await bindDetailsCasereanSectionOperationAPI(TransactionID);

      const data = APIresponse?.data || [];
      console.log(data);

      if (data.length > 0) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = (saveUpdatePayload) => {
    const fixedPayload = {
      ...saveUpdatePayload,

      IntroductionToTeam: saveUpdatePayload?.Introductiontoteam,

      PreopDiagnosis: saveUpdatePayload?.PreOpDiagnosis,
      CSCategory1: saveUpdatePayload?.CScategory1,
      CSCategory2: saveUpdatePayload?.CScategory2,
      CSCategory3: saveUpdatePayload?.CScategory3,
      CSCategory4: saveUpdatePayload?.CScategory4,
      CSCategoryEMCS: saveUpdatePayload?.CScategoryEMcs,
      CSCategoryECS: saveUpdatePayload?.CScategoryEcs,
      SharpEntry: saveUpdatePayload?.Sharpentry,
      BluntEntry: saveUpdatePayload?.Bluntentry,
      BirthWeight: saveUpdatePayload?.Birthweight,
      UterineClosureSuture: saveUpdatePayload?.Uterineclosuresuture,
      MFPPNeeded: saveUpdatePayload?.MFPPCNeeded,
      VitalSign: saveUpdatePayload?.Vitalsign,
      RoomingAndLactational: saveUpdatePayload?.Roomingandlactational,
      MedicationAndFluids: saveUpdatePayload?.Medicationandfluids,
      OralSipsAndGraduateDietFrom:
        saveUpdatePayload?.Oralsipsandgraduatedietfrom,

      PmdViaCCT: saveUpdatePayload?.PmdviaCCT,
      PmdViaManualRemoval: saveUpdatePayload?.PmdviaManualremoval,
      PmdViaWhole: saveUpdatePayload?.PmdviaWhole,
      PmdViaPieceMeal: saveUpdatePayload?.PmdviaPiecemeal,
      PmdViaUterineCavityCleaned: saveUpdatePayload?.PmdviaUterinecavitycleaned,
      PmdViaOvariesAndTubesNormal:
        saveUpdatePayload?.PmdviaOvariesandtubesnormal,

      UterineClosureMultiple: saveUpdatePayload?.UterineclosureMultiple,
      UterineClosureSingleLayer: saveUpdatePayload?.UterineclosureSinglelayer,

      AbdominalFatApposedNo: saveUpdatePayload?.AbdominalfatapposedNo,
      AbdominalFatApposedYes: saveUpdatePayload?.Abdominalfatapposedyes,
      OxytocinGivenYes: saveUpdatePayload?.Oxytocingivenyes,
      OxytocinGivenNo: saveUpdatePayload?.Oxytocingivenno,

      MisoprostolGivenNo: saveUpdatePayload?.Misoprostolgivenno,
      MisoprostolGivenYes: saveUpdatePayload?.Misoprostolgivenyes,
      WHSCSVVTPreOp: saveUpdatePayload?.WHSCSVVTpreOp,
      WHSCSVVTPostOp: saveUpdatePayload?.WHSCSVVTpostOp,

      LevelOfCareRoutine: saveUpdatePayload?.LevelofcareRoutine,
      LevelOfCareHDU: saveUpdatePayload?.Levelofcarehdu,
      LevelOfCareICU: saveUpdatePayload?.Levelofcareicu,
      VTERiskLow: saveUpdatePayload?.VTEriskLow,
      VTERiskMedium: saveUpdatePayload?.VTEriskMedium,
      VTERiskHigh: saveUpdatePayload?.VTEriskhigh,
    };

    // Remove wrong keys
    delete fixedPayload.Introductiontoteam;
    delete fixedPayload.PreOpDiagnosis;
    delete fixedPayload.CScategory1;
    delete fixedPayload.CScategory2;
    delete fixedPayload.CScategory3;
    delete fixedPayload.CScategory4;
    delete fixedPayload.CScategoryEMcs;
    delete fixedPayload.CScategoryEcs;

    delete fixedPayload.Bluntentry;
    delete fixedPayload.Sharpentry;
    delete fixedPayload.Birthweight;
    delete fixedPayload.Rectusfasciaclosuresuture;
    delete fixedPayload.Uterineclosuresuture;
    delete fixedPayload.MFPPCNeeded;
    delete fixedPayload.Vitalsign;
    delete fixedPayload.Roomingandlactational;
    delete fixedPayload.Medicationandfluids;
    delete fixedPayload.Oralsipsandgraduatedietfrom;

    delete fixedPayload.PmdviaCCT;
    delete fixedPayload.PmdviaManualremoval;
    delete fixedPayload.PmdviaWhole;
    delete fixedPayload.PmdviaPiecemeal;
    delete fixedPayload.PmdviaUterinecavitycleaned;
    delete fixedPayload.PmdviaOvariesandtubesnormal;
    delete fixedPayload.UterineclosureMultiple;
    delete fixedPayload.UterineclosureSinglelayer;
    delete fixedPayload.AbdominalfatapposedNo;
    delete fixedPayload.Abdominalfatapposedyes;
    delete fixedPayload.Oxytocingivenno;
    delete fixedPayload.Oxytocingivenyes;
    delete fixedPayload.Misoprostolgivenyes;
    delete fixedPayload.Misoprostolgivenno;
    delete fixedPayload.WHSCSVVTpostOp;
    delete fixedPayload.WHSCSVVTpreOp;

    delete fixedPayload.LevelofcareRoutine;
    delete fixedPayload.Levelofcarehdu;
    delete fixedPayload.Levelofcareicu;
    delete fixedPayload.VTEriskLow;
    delete fixedPayload.VTEriskMedium;
    delete fixedPayload.VTEriskhigh;

    setPayload(fixedPayload);
  };

  const handleCancel = () => {
    setPayload((prev) => {
      const cleared = {};
      Object.keys(prev).forEach((key) => {
        cleared[key] = "";
      });
      return cleared;
    });
  };

  const handlePrint = async (row) => { };

  const handleTableData = (tableData) => {
    console.log(tableData);

    return tableData?.map((items, index) => {
      const { patientID, CreatedBy, CreatedDatetime } = items;
      return {
        SNO: index + 1,
        PatientID,
        CreatedBy,
        CreatedDatetime,

        Edit: (
          <i className="fa fa-edit p-1" onClick={() => handleEdit(items)} />
        ),
        // print: (
        //   <div onClick={handlePrint}>
        //     <ReprintSVG />
        //   </div>
        // ),
      };
    });
  };

  const handlesave = async () => {
    try {
      const response = await SaveCasereanSectionOperationAPI(saveUpdatePayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialValues);
        handleGetData(TransactionID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const block2Config = [
    {
      component: "ReactSelect",
      id: "IntroductionToTeam",
      name: "IntroductionToTeam",
      label: t("INTRODUCTION to team"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "InformedConsentSigned",
      name: "InformedConsentSigned",
      label: t("Informed Consent SIGNED"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "Input",
      id: "Surgeon",
      name: "Surgeon",
      label: t("Surgeon"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },

    {
      component: "Input",
      id: "Anaesthesiologist",
      name: "Anaesthesiologist",
      label: t("Anaesthesiologist"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "Assistant",
      name: "Assistant",
      label: t("Assistant"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "ScrubNurse",
      name: "ScrubNurse",
      label: t("Scrub Nurse"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "PreopDiagnosis",
      name: "PreopDiagnosis",
      label: t("Pre-operative Diagnosis"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "FinalDiagnosis",
      name: "FinalDiagnosis",
      label: t("Final Diagnosis"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "TextArea",
      id: "AdditionalNotes",
      name: "AdditionalNotes",
      label: t("Additional Notes"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
  ];

  const block3Config = [
    {
      component: "ReactSelect",
      id: "AsepticCatherization",
      name: "AsepticCatherization",
      label: t("Aseptic Catherization"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "PreppedDraped",
      name: "PreppedDraped",
      label: t("Prepped & Draped"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "AbdClean",
      name: "AbdClean",
      label: t("Abdomen Cleaned(Hibitane,Iodine)"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "SharpEntry",
      name: "SharpEntry",
      label: t("Sharp entry?"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "BluntEntry",
      name: "BluntEntry",
      label: t("Blunt entry?"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "VesicFM",
      name: "VesicFM",
      label: t("Vesicouterine flap made?"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "DelayedCc",
      name: "DelayedCc",
      label: t("Delayed cord clamping"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
      options: options,
    },
    {
      component: "Input",
      id: "Sex",
      name: "Sex",
      label: t("Sex"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "ApgarScore",
      name: "ApgarScore",
      label: t("Apgar Score"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "BirthWeight",
      name: "BirthWeight",
      label: t("Birth Weight"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "UterineClosureSuture",
      name: "UterineClosureSuture",
      label: t("Uterine closure suture"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "RectusFasciaClosureSuture",
      name: "RectusFasciaClosureSuture",
      label: t("Rectus fascia closure suture"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "EBL",
      name: "EBL",
      label: t("EBL"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "OtherMedication",
      name: "OtherMedication",
      label: t("Other Medication"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "MFPPNeeded",
      name: "MFPPNeeded",
      label: t("1.Monitor for PV bleeding Pad Count Needed"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },

    {
      component: "Input",
      id: "VitalSign",
      name: "VitalSign",
      label:
        t("2. Vital Signs Q15mins for 1hr, then Q30mins for 2hrs then routine. If BP<90/60>110bpm inform Doctor."),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "EAA",
      name: "EAA",
      label: t("3.Early assisted ambulation if applicable"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "RoomingAndLactational",
      name: "RoomingAndLactational",
      label: t("4.Rooming in and lactational if applicable"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "MedicationAndFluids",
      name: "MedicationAndFluids",
      label: t("5.Medication and fluids as per Treatment sheet"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "Thromboprophylaxis",
      name: "Thromboprophylaxis",
      label: t("6.Thromboprophylaxis"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
    {
      component: "Input",
      id: "OralSipsAndGraduateDietFrom",
      name: "OralSipsAndGraduateDietFrom",
      label: t("7.Oral sips and graduate diet as tolerated from"),
      respclass: "col-xl-2 col-md-4 col-sm-4 col-12",
    },
  ];

  const renderField = (field) => {
    const commonProps = {
      id: field.id,
      name: field.name,
      lable: t(field.label),
      respclass: field.respclass,
      value: payload[field.name],
    };

    switch (field.component) {
      case "Input":
        return (
          <Input
            {...commonProps}
            type="text"
            className="form-control"
            onChange={handleChange}
            placeholder={""}
          />
        );

      case "ReactSelect":
        return (
          <ReactSelect
            {...commonProps}
            placeholderName={t(field.label)}
            dynamicOptions={field.options}
            handleChange={handleSelectChange}
          />
        );

      case "TextArea":
        return (
          <TextAreaInput
            {...commonProps}
            className="w-100"
            placeholder=""
            rows={field.rows || 2}
            onChange={handleChange}
            maxLength={field.maxLength || 1000}
          />
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    handleGetData(TransactionID);
  }, []);

  const levelOfCareOptions = [
    { name: "Routine", value: "LevelOfCareRoutine" },
    { name: "HDU", value: "LevelOfCareHDU" },
    { name: "ICU", value: "LevelOfCareICU" },
  ];

  const vteRiskOptions = [
    { name: "Low", value: "VTERiskLow" },
    { name: "Medium", value: "VTERiskMedium" },
    { name: "High", value: "VTERiskHigh" },
  ];

  const IncisionScarExcisedOptions = [
    { name: "Yes", value: "IscYes" },
    { name: "No", value: "IscNo" },
    { name: "No scar", value: "IscNoScar" },
  ];

  const FindingsOptions = [
    { name: "Live Infant", value: "FindingsLivInfant" },
    { name: "FSB", value: "FindingsFSB" },
    { name: "Macerated", value: "FindingsMacerated" },
  ];

  const placentaAndMembranesOptions = [
    { name: "CCT", value: "PmdViaCCT" },
    { name: "Manual removal", value: "PmdViaManualRemoval" },
    { name: "Whole", value: "PmdViaWhole" },
    { name: "Piecemeal", value: "PmdViaPieceMeal" },
    { name: "Uterine cavity cleaned", value: "PmdViaUterineCavityCleaned" },
    { name: "Ovaries & tubes normal", value: "PmdViaOvariesAndTubesNormal" },
  ];

  const uterineClosureOptions = [
    { name: "Single layer", value: "UterineClosureSingleLayer" },
    { name: "Multiple", value: "UterineClosureMultiple" },
  ];

  const abdominalFatApposedOptions = [
    { name: "Yes", value: "AbdominalFatApposedYes" },
    { name: "No", value: "AbdominalFatApposedNo" },
  ];

  const skinAppositionOptions = [
    { name: "Continuous", value: "SkinAppoContinous" },
    { name: "Intermittent", value: "SkinAppoIntermittent" },
    { name: "Absorbable", value: "AppositionAbsorbable" },
    { name: "Non-Absorbable", value: "AppositionNonAbsorbable" },
  ];

  const urineOptions = [
    { name: "Clear", value: "UrineClear" },
    { name: "Blood Stained", value: "UrineBloodStained" },
  ];

  const oxytocinOptions = [
    { name: "Yes", value: "OxytocinGivenYes" },
    { name: "No", value: "OxytocinGivenNo" },
  ];

  const misoprostolOptions = [
    { name: "Yes", value: "MisoprostolGivenYes" },
    { name: "No", value: "MisoprostolGivenNo" },
  ];

  const whsCsvvtOptions = [
    { name: "VVT Pre-Op", value: "WHSCSVVTPreOp" },
    { name: "VVT Post-Op", value: "WHSCSVVTPostOp" },
  ];

  const csCategoryOptions = [
    { name: "1", value: "CSCategory1" },
    { name: "2", value: "CSCategory2" },
    { name: "3", value: "CSCategory3" },
    { name: "4", value: "CSCategory4" },
    { name: "Emergency CS", value: "CSCategoryEMCS" },
    { name: "Elective CS", value: "CSCategoryECS" },
  ];

  const anaesthesiaOptions = [
    { name: "General", value: "AnaesthesiaG" },
    { name: "Spinal", value: "AnaesthesiaS" },
  ];

  const levelOfCareSelected = Object.keys(payload).filter((key) =>
    levelOfCareOptions.find((o) => o.value === key && payload[key] === 1)
  );

  const vteRiskSelected = Object.keys(payload).filter((key) =>
    vteRiskOptions.find((o) => o.value === key && payload[key] === 1)
  );
  const IncisionScarExcised = Object.keys(payload).filter((key) =>
    IncisionScarExcisedOptions.find(
      (o) => o.value === key && payload[key] === 1
    )
  );
  const Findings = Object.keys(payload).filter((key) =>
    FindingsOptions.find((o) => o.value === key && payload[key] === 1)
  );

  const placentaAndMembranesSelected = Object.keys(payload).filter((key) =>
    placentaAndMembranesOptions.find(
      (o) => o.value === key && payload[key] === 1
    )
  );
  const UterineClosure = Object.keys(payload).filter((key) =>
    uterineClosureOptions.find((o) => o.value === key && payload[key] === 1)
  );

  const AbdominalFatApposed = Object.keys(payload).filter((key) =>
    abdominalFatApposedOptions.find(
      (o) => o.value === key && payload[key] === 1
    )
  );
  const skinApposition = Object.keys(payload).filter((key) =>
    skinAppositionOptions.find((o) => o.value === key && payload[key] === 1)
  );

  const WHSSurgicalChecklist = Object.keys(payload).filter((key) =>
    whsCsvvtOptions.find((o) => o.value === key && payload[key] === 1)
  );
  const misoprostolSelected = Object.keys(payload).filter((key) =>
    misoprostolOptions.find((o) => o.value === key && payload[key] === 1)
  );
  const oxytocinSelected = Object.keys(payload).filter((key) =>
    oxytocinOptions.find((o) => o.value === key && payload[key] === 1)
  );
  const urineSelected = Object.keys(payload).filter((key) =>
    urineOptions.find((o) => o.value === key && payload[key] === 1)
  );
  const csCategorySelected = Object.keys(payload).filter((key) =>
    csCategoryOptions.find((o) => o.value === key && payload[key] === 1)
  );
  const anaesthesiaSelected = Object.keys(payload).filter((key) =>
    anaesthesiaOptions.find((o) => o.value === key && payload[key] === 1)
  );

  const handleMultiSelectChange = (field, selectedValues) => {
    const updatedPayload = { ...payload };

    if (field === "LevelOfCare") {
      levelOfCareOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }

    if (field === "VTERisk") {
      vteRiskOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "IncisionScarExcised") {
      IncisionScarExcisedOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "Findings") {
      FindingsOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "placentaAndMembranesSelected") {
      placentaAndMembranesOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "UterineClosure") {
      uterineClosureOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "AbdominalFatApposed") {
      abdominalFatApposedOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "skinApposition") {
      skinAppositionOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "urineSelected") {
      urineOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "oxytocinSelected") {
      oxytocinOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "misoprostolSelected") {
      misoprostolOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "WHSSurgicalChecklist") {
      whsCsvvtOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "anaesthesiaSelected") {
      anaesthesiaOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }
    if (field === "csCategorySelected") {
      csCategoryOptions.forEach((opt) => {
        updatedPayload[opt.value] = selectedValues.includes(opt.value) ? 1 : 0;
      });
    }

    setPayload(updatedPayload);
  };

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading
            title={t("Ceasarian Section Operation Notes")}
            isBreadcrumb={false}
          />
          <div className="row">
            <div className="col-xl-12 col-md-12 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("PRE-OPERATIVE NOTES")}
                </label>
                <div className="row">
                  {block2Config.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={csCategoryOptions}
                    value={csCategorySelected}
                    name="csCategorySelected"
                    placeholderName={t("CS Category")}
                    handleChange={handleMultiSelectChange}
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={anaesthesiaOptions}
                    value={anaesthesiaSelected}
                    name="anaesthesiaSelected"
                    placeholderName={t("CS Category")}
                    handleChange={handleMultiSelectChange}
                  />
                </div>
                {/* <div className="row pl-3">
                  <span
                    className="form-check-label ml-2 text-bold"
                    htmlFor={`cao`}
                  >
                    {t("CS Category :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="CSCategory1 "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="CSCategory1"
                      checked={payload.CSCategory1 === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="CSCategory1"
                    >
                      {t("1")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="CSCategory2 "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="CSCategory2"
                      checked={payload.CSCategory2 === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="CSCategory2"
                    >
                      {t("2")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="CSCategory3 "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="CSCategory3"
                      checked={payload.CSCategory3 === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="CSCategory3"
                    >
                      {t("3")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="CSCategory4 "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="CSCategory4"
                      checked={payload.CSCategory4 === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="CSCategory4"
                    >
                      {t("4")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="CSCategoryEMCS "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="CSCategoryEMCS"
                      checked={payload.CSCategoryEMCS === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="CSCategoryEMCS"
                    >
                      {t("Emergency CS")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="CSCategoryECS "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="CSCategoryECS"
                      checked={payload.CSCategoryECS === 1}
                      onChange={handleChange}
                    />
                    <label
                      className="form-check-label ml-2"
                      htmlFor="CSCategoryECS"
                    >
                      {t("Elective CS")}
                    </label>
                  </div>

                  <span className="form-check-label ml-2 text-bold">
                    {t("Anaesthesia :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="AnaesthesiaG "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="AnaesthesiaG"
                      checked={payload.AnaesthesiaG === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="AnaesthesiaG"
                    >
                      {t("General ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="AnaesthesiaS "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="AnaesthesiaS"
                      checked={payload.AnaesthesiaS === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="AnaesthesiaS"
                    >
                      {t("Spinal")}
                    </label>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12 col-md-12 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("PROCEDURE NOTES")}
                </label>
                <div className="row">
                  {block3Config.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={levelOfCareOptions}
                    value={levelOfCareSelected}
                    name="LevelOfCare"
                    placeholderName={t("Level of care")}
                    handleChange={(name, val) =>
                      handleMultiSelectChange(name, val)
                    }
                  />

                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    searchable={true}
                    dynamicOptions={vteRiskOptions}
                    value={vteRiskSelected}
                    name="VTERisk"
                    placeholderName={t("VTE Risk")}
                    handleChange={(name, val) =>
                      handleMultiSelectChange(name, val)
                    }
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    searchable={true}
                    dynamicOptions={IncisionScarExcisedOptions}
                    value={IncisionScarExcised}
                    name="IncisionScarExcised"
                    placeholderName={t("INCISION SCAR EXCISED")}
                    handleChange={(name, val) =>
                      handleMultiSelectChange(name, val)
                    }
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    searchable={true}
                    dynamicOptions={FindingsOptions}
                    value={Findings}
                    name="Findings"
                    placeholderName={t("Findings")}
                    handleChange={(name, val) =>
                      handleMultiSelectChange(name, val)
                    }
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    searchable={true}
                    dynamicOptions={placentaAndMembranesOptions}
                    value={placentaAndMembranesSelected}
                    name="placentaAndMembranesSelected"
                    placeholderName={t("Placenta & membranes")}
                    handleChange={(name, val) =>
                      handleMultiSelectChange(name, val)
                    }
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={uterineClosureOptions}
                    value={UterineClosure}
                    name="UterineClosure"
                    placeholderName={t("Uterine closure")}
                    handleChange={handleMultiSelectChange}
                  />

                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={abdominalFatApposedOptions}
                    value={AbdominalFatApposed}
                    name="AbdominalFatApposed"
                    placeholderName={t("Abdominal fat apposed")}
                    handleChange={handleMultiSelectChange}
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={skinAppositionOptions}
                    value={skinApposition}
                    name="skinApposition"
                    placeholderName={t("Skin Apposition")}
                    handleChange={handleMultiSelectChange}
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    dynamicOptions={urineOptions}
                    value={urineSelected}
                    name="urineSelected"
                    placeholderName={t("Urine")}
                    handleChange={handleMultiSelectChange}
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    dynamicOptions={oxytocinOptions}
                    value={oxytocinSelected}
                    name="oxytocinSelected"
                    placeholderName={t("OXYTOCIN GIVEN")}
                    handleChange={handleMultiSelectChange}
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    dynamicOptions={misoprostolOptions}
                    value={misoprostolSelected}
                    name="misoprostolSelected"
                    placeholderName={t("MISOPROSTOL GIVEN")}
                    handleChange={handleMultiSelectChange}
                  />
                  <MultiSelectComp
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    dynamicOptions={whsCsvvtOptions}
                    value={WHSSurgicalChecklist}
                    name="WHSSurgicalChecklist"
                    placeholderName={t("SURGICAL SAFETY CHECKLIST")}
                    handleChange={handleMultiSelectChange}
                  />
                </div>
                {/* <div className="row pl-3 mt-2">
                  <span className="form-check-label ml-2 text-bold">
                    {t("Level of care")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="LevelOfCareRoutine"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="LevelOfCareRoutine"
                      checked={payload.LevelOfCareRoutine === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="LevelOfCareRoutine"
                    >
                      {t("Routine")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="LevelOfCareHDU "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="LevelOfCareHDU"
                      checked={payload.LevelOfCareHDU === 1}
                      onChange={handleChange}
                    />
                    <label
                      className="form-check-label ml-2"
                      htmlFor="LevelOfCareHDU"
                    >
                      {t("HDU")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="LevelOfCareICU "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="LevelOfCareICU"
                      checked={payload.LevelOfCareICU === 1}
                      onChange={handleChange}
                    />
                    <label
                      className="form-check-label ml-2"
                      htmlFor="LevelOfCareICU"
                    >
                      {t("ICU")}
                    </label>
                  </div>
                  <span className="form-check-label ml-2 text-bold">
                    {t("VTE risk")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="VTERiskLow "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="VTERiskLow"
                      checked={payload.VTERiskLow === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="VTERiskLow"
                    >
                      {t("Low ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="VTERiskMedium "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="VTERiskMedium"
                      checked={payload.VTERiskMedium === 1}
                      onChange={handleChange}
                    />
                    <label
                      className="form-check-label ml-2"
                      htmlFor="VTERiskMedium"
                    >
                      {t("Medium")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="VTERiskHigh"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="VTERiskHigh"
                      checked={payload.VTERiskHigh === 1}
                      onChange={handleChange}
                    />
                    <label
                      className="form-check-label ml-2"
                      htmlFor="VTERiskHigh"
                    >
                      {t("High")}
                    </label>
                  </div>
                </div> */}
                <div className="row pl-3">
                  {/* <span className="form-check-label ml-2 text-bold ">
                    {t("Incision scar excised :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="IscYes "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="IscYes"
                      checked={payload.IscYes === 1}
                      onChange={handleChange}
                    />

                    <label className="form-check-label ml-2" htmlFor="IscYes">
                      {t("Yes ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="IscNo "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="IscNo"
                      checked={payload.IscNo === 1}
                      onChange={handleChange}
                    />
                    <label className="form-check-label ml-2" htmlFor="IscNo">
                      {t("No")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="IscNoScar "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="IscNoScar"
                      checked={payload.IscNoScar === 1}
                      onChange={handleChange}
                    />
                    <label
                      className="form-check-label ml-2"
                      htmlFor="IscNoScar"
                    >
                      {t("No scar")}
                    </label>
                  </div> */}
                  {/* <span className="form-check-label ml-2 text-bold ml-3">
                    {t("Findings :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="FindingsLivInfant"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="FindingsLivInfant"
                      checked={payload.FindingsLivInfant === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="FindingsLivInfant"
                    >
                      {t("Live Infant ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="FindingsFSB"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="FindingsFSB"
                      checked={payload.FindingsFSB === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="FindingsFSB"
                    >
                      {t("FSB ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="FindingsMacerated"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="FindingsMacerated"
                      checked={payload.FindingsMacerated === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="FindingsMacerated"
                    >
                      {t("Macerated")}
                    </label>
                  </div> */}
                </div>
                {/* <div className="row pl-2 pt-2">
                  {" "}
                  <span className="form-check-label ml-2 text-bold ml-3">
                    {t("Placenta & membranes delivered via :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="PmdViaCCT"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="PmdViaCCT"
                      checked={payload.PmdViaCCT === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="PmdViaCCT"
                    >
                      {t("CCT ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="PmdViaManualRemoval"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="PmdViaManualRemoval"
                      checked={payload.PmdViaManualRemoval === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="PmdViaManualRemoval"
                    >
                      {t("Manual removal ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="PmdViaWhole"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="PmdViaWhole"
                      checked={payload.PmdViaWhole === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="PmdViaWhole"
                    >
                      {t("Whole ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="PmdViaPieceMeal"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="PmdViaPieceMeal"
                      checked={payload.PmdViaPieceMeal === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="PmdViaPieceMeal"
                    >
                      {t("Piecemeal  ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="PmdViaUterineCavityCleaned"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="PmdViaUterineCavityCleaned"
                      checked={payload.PmdViaUterineCavityCleaned === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="PmdViaUterineCavityCleaned"
                    >
                      {t("Uterine cavity cleaned ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="PmdViaOvariesAndTubesNormal"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="PmdViaOvariesAndTubesNormal"
                      checked={payload.PmdViaOvariesAndTubesNormal === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="PmdViaOvariesAndTubesNormal"
                    >
                      {t("Ovaries & tubes normal ")}
                    </label>
                  </div>
                </div> */}
                <div className="row pl-3 pt-2">
                  {/* <span className="form-check-label ml-2 text-bold ">
                    {t("Uterine closure :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="UterineClosureSingleLayer "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="UterineClosureSingleLayer"
                      checked={payload.UterineClosureSingleLayer === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="UterineClosureSingleLayer"
                    >
                      {t("Single layer ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="UterineClosureMultiple "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="UterineClosureMultiple"
                      checked={payload.UterineClosureMultiple === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="UterineClosureMultiple"
                    >
                      {t("Multiple ")}
                    </label>
                  </div>
                  <span className="form-check-label ml-2 text-bold">
                    {t("Abdominal fat apposed? :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="AbdominalFatApposedYes "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="AbdominalFatApposedYes"
                      checked={payload.AbdominalFatApposedYes === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="AbdominalFatApposedYes"
                    >
                      {t("Yes ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="AbdominalFatApposedNo "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="AbdominalFatApposedNo"
                      checked={payload.AbdominalFatApposedNo === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="AbdominalFatApposedNo"
                    >
                      {t("No ")}
                    </label>
                  </div> */}
                  {/* <span className="form-check-label ml-2 text-bold">
                    {t("Skin Apposition :")}
                  </span>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="SkinAppoContinous "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="SkinAppoContinous"
                      checked={payload.SkinAppoContinous === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="SkinAppoContinous"
                    >
                      {t("Continous  ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="SkinAppoIntermittent "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="SkinAppoIntermittent"
                      checked={payload.SkinAppoIntermittent === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="SkinAppoIntermittent"
                    >
                      {t("Intermittent  ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="AppositionAbsorbable "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="AppositionAbsorbable"
                      checked={payload.AppositionAbsorbable === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="AppositionAbsorbable"
                    >
                      {t("Absorbable  ")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      id="AppositionNonAbsorbable "
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="AppositionNonAbsorbable"
                      checked={payload.AppositionNonAbsorbable === 1}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label ml-2"
                      htmlFor="AppositionNonAbsorbable"
                    >
                      {t("Non-Absorbable ")}
                    </label>
                  </div> */}

                  {/* <div className="row pl-2 mt-2">
                    <span className="form-check-label ml-2 text-bold">
                      {t("Urine")}
                    </span>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="UrineClear "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="UrineClear"
                        checked={payload.UrineClear === 1}
                        onChange={handleChange}
                      />

                      <label
                        className="form-check-label ml-2"
                        htmlFor="UrineClear"
                      >
                        {t("Clear")}
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="UrineBloodStained "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="UrineBloodStained"
                        checked={payload.UrineBloodStained === 1}
                        onChange={handleChange}
                      />

                      <label
                        className="form-check-label ml-2"
                        htmlFor="UrineBloodStained"
                      >
                        {t("Blood Stained")}
                      </label>
                    </div>
                    <span className="form-check-label ml-2 text-bold">
                      {t("Oxytocin given")}
                    </span>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="OxytocinGivenYes "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="OxytocinGivenYes"
                        checked={payload.OxytocinGivenYes === 1}
                        onChange={handleChange}
                      />

                      <label
                        className="form-check-label ml-2"
                        htmlFor="OxytocinGivenYes"
                      >
                        {t("Yes")}
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="OxytocinGivenNo "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="OxytocinGivenNo"
                        checked={payload.OxytocinGivenNo === 1}
                        onChange={handleChange}
                      />

                      <label
                        className="form-check-label ml-2"
                        htmlFor="OxytocinGivenNo"
                      >
                        {t("No")}
                      </label>
                    </div>
                    <span className="form-check-label ml-2 text-bold">
                      {t("Misoprostol given")}
                    </span>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="MisoprostolGivenYes "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="MisoprostolGivenYes"
                        checked={payload.MisoprostolGivenYes === 1}
                        onChange={handleChange}
                      />

                      <label
                        className="form-check-label ml-2"
                        htmlFor="MisoprostolGivenYes"
                      >
                        {t("Yes")}
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="MisoprostolGivenNo "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="MisoprostolGivenNo"
                        checked={payload.MisoprostolGivenNo === 1}
                        onChange={handleChange}
                      />

                      <label
                        className="form-check-label ml-2"
                        htmlFor="MisoprostolGivenNo"
                      >
                        {t("No")}
                      </label>
                    </div>
                    <span className="form-check-label ml-2 text-bold">
                      {t("WHO Surgical Safety Checklist signed in and out")}
                    </span>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="WHSCSVVTPreOp "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="WHSCSVVTPreOp"
                        checked={payload.WHSCSVVTPreOp === 1}
                        onChange={handleChange}
                      />

                      <label
                        className="form-check-label ml-2"
                        htmlFor="WHSCSVVTPreOp"
                      >
                        {t("VVT Pre-Op")}
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input table-checkbox"
                        id="WHSCSVVTPostOp "
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="WHSCSVVTPostOp"
                        checked={payload.WHSCSVVTPostOp === 1}
                        onChange={handleChange}
                      />
                      <label
                        className="form-check-label ml-2"
                        htmlFor="WHSCSVVTPostOp"
                      >
                        {t("VVT Post-Op")}
                      </label>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-2">
          {payload?.ID ? (
            <>
              <button className="btn btn-sm btn-primary" onClick={handlesave}>
                {t("Update")}
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={handlesave}>
              {t("Save")}
            </button>
          )}
          <button
            className="btn btn-sm btn-secondary ml-2"
            onClick={handleCancel}
          >
            {t("Cancel")}
          </button>
        </div>
      </div>
      {tableData?.length > 0 &&
        <>
          <Heading title={t("CEASARIAN NOTES List")} />
          <Tables thead={THEAD} tbody={handleTableData(tableData)} />
        </>
      }

    </>
  );
};

export default CaesarianSectionOperationNotes;
