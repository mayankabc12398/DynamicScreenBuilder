import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  bindDetails_ANCPatientHistoryII,
  blankPrint_ANCPatientHistoryII,
  print_ANCPatientHistoryII,
  save_ANCPatientHistoryII,
} from "../../networkServices/IVFApi";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import Heading from "../UI/Heading";
import { RedirectURL } from "../../networkServices/PDFURL";

const ANCPatientHistoryII = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  console.log("data", data);
  const [payload, setPayload] = useState({
    // transactionID: "",
    // patientID: "",
    ivfID: "",
    ishypertnsn: "",
    hypertnsn: "",
    ischstdisease: "",
    chstdisease: "",
    isthyroid: "",
    thyroid: "",
    isTuberculosis: "",
    tuberculosis: "",
    isEndometriosis: "",
    endometriosis: "",
    isDiabetes: "",
    diabetes: "",
    isHeartDisease: "",
    heartDisease: "",
    isFeverwthRashes: "",
    feverwthRashes: "",
    isDrugIntake: "",
    drugIntake: "",
    isSTD: "",
    std: "",
    isThalassemia: "",
    thalassemia: "",
    isAllergyofanyType: "",
    allergyofanyType: "",
    isFits: "",
    fits: "",
    isBronchialAsthma: "",
    bronchialAsthma: "",
    isBloodTransfusion: "",
    bloodTransfusion: "",
    pastsurgicalhistory: "",
    isfh_HOHypertension: "",
    isfh_Diabetes: "",
    isfh_MentalIllness: "",
    isfh_Thalassemia: "",
    isfh_Twins: "",
    isfh_Others: "",
    fh_Others: "",
    isUseofContraception: "",
    useofContraception: "",
    isAlcohol: "",
    alcohol: "",
    isSmoking: "",
    smoking: "",
    isInfertilityTreated: "",
    isAntiDInjection: "",
    isNonVeg: "",
    isVeg: "",
    id: "",
  });

  const THEAD = [
    { name: t("SNo"), width: "1%" },
    {
      name: (
        <>
          H/O <br />
          {t("Hypertension")}
        </>
      ),
    },
    {
      name: (
        <>
          {t("Chest")}
          <br /> {t("Disease")}
        </>
      ),
      width: "2%",
    },
    { name: t("Thyroid") },
    { name: t("Tuberculosis") },
    { name: t("Endometriosis") },

    { name: t("Diabetes") },
    {
      name: (
        <>
          {t("Heart")} <br />
          {t("Disease")}
        </>
      ),
    },
    {
      name: (
        <>
          {t("Fever")} <br />
          {t("with Rashes")}
        </>
      ),
    },
    {
      name: (
        <>
          {t("Drug")} <br />
          {t("Intake(Steroids)")}
        </>
      ),
    },
    { name: t("STD") },
    { name: t("Thalassemia&C") },
    {
      name: (
        <>
          {t("Allergy of")} <br />
          {t("any Type")}
        </>
      ),
    },
    { name: t("Edit") },
    { name: t("Print") },
  ];
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const handleSave = async () => {
    const finalPayload = {
      transactionID: data?.transactionID,
      patientID: data?.patientID,
      ivfID: payload.ivfID || "",
      id: payload.id || "0",

      ishypertnsn: payload.ishypertnsn || "",
      hypertnsn: payload.hypertnsn || "",
      ischstdisease: payload.ischstdisease || "",
      chstdisease: payload.chstdisease || "",
      isthyroid: payload.isthyroid || "",
      thyroid: payload.thyroid || "",
      isTuberculosis: payload.isTuberculosis || "",
      tuberculosis: payload.tuberculosis || "",
      isEndometriosis: payload.isEndometriosis || "",
      endometriosis: payload.endometriosis || "",
      isDiabetes: payload.isDiabetes || "",
      diabetes: payload.diabetes || "",
      isHeartDisease: payload.isHeartDisease || "",
      heartDisease: payload.heartDisease || "",
      isFeverwthRashes: payload.isFeverwthRashes || "",
      feverwthRashes: payload.feverwthRashes || "",
      isDrugIntake: payload.isDrugIntake || "",
      drugIntake: payload.drugIntake || "",
      isSTD: payload.isSTD || "",
      std: payload.std || "",
      isThalassemia: payload.isThalassemia || "",
      thalassemia: payload.thalassemia || "",
      isAllergyofanyType: payload.isAllergyofanyType || "",
      allergyofanyType: payload.allergyofanyType || "",
      isFits: payload.isFits || "",
      fits: payload.fits || "",
      isBronchialAsthma: payload.isBronchialAsthma || "",
      bronchialAsthma: payload.bronchialAsthma || "",
      isBloodTransfusion: payload.isBloodTransfusion || "",
      bloodTransfusion: payload.bloodTransfusion || "",

      pastsurgicalhistory: payload.pastsurgicalhistory || "",
      isfh_HOHypertension: payload.isfh_HOHypertension || "",
      isfh_Diabetes: payload.isfh_Diabetes || "",
      isfh_MentalIllness: payload.isfh_MentalIllness || "",
      isfh_Thalassemia: payload.isfh_Thalassemia || "",
      isfh_Twins: payload.isfh_Twins || "",
      isfh_Others: payload.isfh_Others || "",
      fh_Others: payload.fh_Others || "",

      isUseofContraception: payload.isUseofContraception || "",
      useofContraception: payload.useofContraception || "",
      isAlcohol: payload.isAlcohol || "",
      alcohol: payload.alcohol || "",
      isSmoking: payload.isSmoking || "",
      smoking: payload.smoking || "",
      isInfertilityTreated: payload.isInfertilityTreated || "",
      isAntiDInjection: payload.isAntiDInjection || "",
      isNonVeg: payload.isNonVeg || "",
      isVeg: payload.isVeg || "",
    };

    try {
      const response = await save_ANCPatientHistoryII(finalPayload);

      if (response?.success) {
        notify(response.message, "success");
        fetchData();
        resetForm();
        setIsEdit(false);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };
  const resetForm = () => {
    setPayload({
      // transactionID: "",
      // patientID: "",
      ivfID: "",

      ishypertnsn: "",
      hypertnsn: "",
      ischstdisease: "",
      chstdisease: "",
      isthyroid: "",
      thyroid: "",
      isTuberculosis: "",
      tuberculosis: "",
      isEndometriosis: "",
      endometriosis: "",
      isDiabetes: "",
      diabetes: "",
      isHeartDisease: "",
      heartDisease: "",
      isFeverwthRashes: "",
      feverwthRashes: "",
      isDrugIntake: "",
      drugIntake: "",
      isSTD: "",
      std: "",
      isThalassemia: "",
      thalassemia: "",
      isAllergyofanyType: "",
      allergyofanyType: "",
      isFits: "",
      fits: "",
      isBronchialAsthma: "",
      bronchialAsthma: "",
      isBloodTransfusion: "",
      bloodTransfusion: "",

      pastsurgicalhistory: "",
      isfh_HOHypertension: "",
      isfh_Diabetes: "",
      isfh_MentalIllness: "",
      isfh_Thalassemia: "",
      isfh_Twins: "",
      isfh_Others: "",
      fh_Others: "",

      isUseofContraception: "",
      useofContraception: "",
      isAlcohol: "",
      alcohol: "",
      isSmoking: "",
      smoking: "",
      isInfertilityTreated: "",
      isAntiDInjection: "",
      isNonVeg: "",
      isVeg: "",
      id: "0",
    });
  };

  const fetchData = async () => {
    const res = await bindDetails_ANCPatientHistoryII(data?.transactionID);
    if (res?.success) {
      setTableData(res?.data);
    } else {
      notify(res?.message, "error");
      setTableData([]);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const hanldleprint = async () => {
    try {
      const response = await blankPrint_ANCPatientHistoryII(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_ANCPatientHistoryII(data?.transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];

  const handleEdit = (item) => {
    setPayload({
      // transactionID: transactionID,
      // patientID: patientID,
      ivfID: item?.IVFID || "",

      ishypertnsn: item?.Ishypertnsn?.toString() || "",
      hypertnsn: item?.hypertnsn || "",

      ischstdisease: item?.Ischstdisease?.toString() || "",
      chstdisease: item?.chstdisease || "",

      isthyroid: item?.Isthyroid?.toString() || "",
      thyroid: item?.thyroid || "",

      isTuberculosis: item?.IsTuberculosis?.toString() || "",
      tuberculosis: item?.Tuberculosis || "",

      isEndometriosis: item?.IsEndometriosis?.toString() || "",
      endometriosis: item?.Endometriosis || "",

      isDiabetes: item?.IsDiabetes?.toString() || "",
      diabetes: item?.Diabetes || "",

      isHeartDisease: item?.IsHeartDisease?.toString() || "",
      heartDisease: item?.HeartDisease || "",

      isFeverwthRashes: item?.IsFeverwthRashes?.toString() || "",
      feverwthRashes: item?.FeverwthRashes || "",

      isDrugIntake: item?.IsDrugIntake?.toString() || "",
      drugIntake: item?.DrugIntake || "",

      isSTD: item?.IsSTD?.toString() || "",
      std: item?.STD || "",

      isThalassemia: item?.IsThalassemia?.toString() || "",
      thalassemia: item?.Thalassemia || "",

      isAllergyofanyType: item?.IsAllergyofanyType?.toString() || "",
      allergyofanyType: item?.AllergyofanyType || "",

      isFits: item?.IsFits?.toString() || "",
      fits: item?.Fits || "",

      isBronchialAsthma: item?.IsBronchialAsthma?.toString() || "",
      bronchialAsthma: item?.BronchialAsthma || "",

      isBloodTransfusion: item?.IsBloodTransfusion?.toString() || "",
      bloodTransfusion: item?.BloodTransfusion || "",

      pastsurgicalhistory: item?.pastsurgicalhistory || "",

      isfh_HOHypertension: item?.Isfh_HOHypertension?.toString() || "",
      isfh_Diabetes: item?.Isfh_Diabetes?.toString() || "",
      isfh_MentalIllness: item?.Isfh_MentalIllness?.toString() || "",
      isfh_Thalassemia: item?.Isfh_Thalassemia?.toString() || "",
      isfh_Twins: item?.Isfh_Twins?.toString() || "",
      isfh_Others: item?.Isfh_Others?.toString() || "",
      fh_Others: item?.fh_Others || "",

      isUseofContraception: item?.IsUseofContraception?.toString() || "",
      useofContraception: item?.UseofContraception || "",

      isAlcohol: item?.IsAlcohol?.toString() || "",
      alcohol: item?.Alcohol || "",

      isSmoking: item?.IsSmoking?.toString() || "",
      smoking: item?.Smoking || "",

      isInfertilityTreated: item?.IsInfertilityTreated?.toString() || "",
      isAntiDInjection: item?.IsAntiDInjection?.toString() || "",

      isNonVeg: item?.IsNonVeg?.toString() || "",
      isVeg: item?.IsVeg?.toString() || "",

      id: item?.ID?.toString() || "0",
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="patient_registration card mt-2">
        {/* <Heading title={t("ANC Record")} /> */}
        <Heading title={t("Past Medical History")} isBreadcrumb={false} />

        <div className="row p-2">
          <ReactSelect
            placeholderName={t("H/O Hypertension")}
            id="ishypertnsn"
            name="ishypertnsn"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.ishypertnsn}
            handleChange={handleSelect}
          />
          <Input
            className="form-control"
            type="text"
            name="hypertnsn"
            id="hypertnsn"
            placeholder=""
            lable={t("H/O Hypertension Txt")}
            value={payload.hypertnsn}
            onChange={handleChange}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Chest Disease")}
            id="ischstdisease"
            name="ischstdisease"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.ischstdisease}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="chstdisease"
            name="chstdisease"
            placeholder=""
            lable={t("Chest Disease Txt")}
            value={payload.chstdisease}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <ReactSelect
            placeholderName={t("Thyroid")}
            id="isthyroid"
            name="isthyroid"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isthyroid}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="thyroid"
            name="thyroid"
            placeholder=""
            lable={t("Thyroid Txt")}
            value={payload.thyroid}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Tuberculosis")}
            id="isTuberculosis"
            name="isTuberculosis"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isTuberculosis}
            handleChange={handleSelect}
          />

          <Input
            type="text"
            id="tuberculosis"
            name="tuberculosis"
            placeholder=""
            lable={t("Tuberculosis Txt")}
            value={payload.tuberculosis}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Endometriosis")}
            id="isEndometriosis"
            name="isEndometriosis"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isEndometriosis}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="endometriosis"
            name="endometriosis"
            placeholder=""
            lable={t("Endometriosis Txt")}
            value={payload.endometriosis}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Diabetes")}
            id="isDiabetes"
            name="isDiabetes"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isDiabetes}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="diabetes"
            name="diabetes"
            placeholder=""
            lable={t("Diabetes Txt")}
            value={payload.diabetes}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Heart Disease")}
            id="isHeartDisease"
            name="isHeartDisease"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isHeartDisease}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="heartDisease"
            name="heartDisease"
            placeholder=""
            lable={t("Heart Disease Txt")}
            value={payload.heartDisease}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Fever with Rashes")}
            id="isFeverwthRashes"
            name="isFeverwthRashes"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isFeverwthRashes}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="feverwthRashes"
            name="feverwthRashes"
            placeholder=""
            lable={t("Fever with Rashes Txt")}
            value={payload.feverwthRashes}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <ReactSelect
            placeholderName={t("Drug Intake(Steroids)")}
            id="isDrugIntake"
            name="isDrugIntake"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isDrugIntake}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="drugIntake"
            name="drugIntake"
            placeholder=""
            lable={t("Drug Intake(Steroids)Txt")}
            value={payload.drugIntake}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("STD")}
            id="isSTD"
            name="isSTD"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isSTD}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="std"
            name="std"
            placeholder=""
            lable={t("STD Txt")}
            value={payload.std}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Thalassemia")}
            id="isThalassemia"
            name="isThalassemia"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isThalassemia}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="thalassemia"
            name="thalassemia"
            placeholder=""
            lable={t("Thalassemia Txt")}
            value={payload.thalassemia}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Allergy of any Type")}
            id="isAllergyofanyType"
            name="isAllergyofanyType"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isAllergyofanyType}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="allergyofanyType"
            name="allergyofanyType"
            placeholder=""
            lable={t("Allergy of any Type Txt")}
            value={payload.allergyofanyType}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Fits(Epilepsy)")}
            id="isFits"
            name="isFits"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isFits}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="fits"
            name="fits"
            placeholder=""
            lable={t("Fits(Epilepsy) Txt")}
            value={payload.fits}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Bronchial Asthma")}
            id="isBronchialAsthma"
            name="isBronchialAsthma"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isBronchialAsthma}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="bronchialAsthma"
            name="bronchialAsthma"
            placeholder=""
            lable={t("Bronchial Asthma Txt")}
            value={payload.bronchialAsthma}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Blood Transfusion")}
            id="isBloodTransfusion"
            name="isBloodTransfusion"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isBloodTransfusion}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            id="bloodTransfusion"
            name="bloodTransfusion"
            placeholder=""
            lable={t("Blood Transfusion Txt")}
            value={payload.bloodTransfusion}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
        </div>
        <Heading title={t("Past Surgical History")} />
        <div className="row p-2">
          <TextAreaInput
            name="pastsurgicalhistory"
            id="pastsurgicalhistory"
            placeholder=""
            lable={t("Past Surgical History")}
            value={payload.pastsurgicalhistory}
            onChange={handleChange}
            rows={4}
            respclass="col-12"
          />
        </div>
        <Heading title={t("Family History")} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("H/O Hypertension")}
            id="isfh_HOHypertension"
            name="isfh_HOHypertension"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isfh_HOHypertension}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Diabetes")}
            id="isfh_Diabetes"
            name="isfh_Diabetes"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isfh_Diabetes}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Mental Illness")}
            id="isfh_MentalIllness"
            name="isfh_MentalIllness"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isfh_MentalIllness}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Thalassemia")}
            id="isfh_Thalassemia"
            name="isfh_Thalassemia"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isfh_Thalassemia}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Twins")}
            id="isfh_Twins"
            name="isfh_Twins"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isfh_Twins}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Others")}
            id="isfh_Others"
            name="isfh_Others"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isfh_Others}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            name="fh_Others"
            id="fh_Others"
            placeholder=""
            lable={t("Others")}
            value={payload.fh_Others}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
        </div>
        <Heading title={t("Personal History")} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("Use of Contraception")}
            id="isUseofContraception"
            name="isUseofContraception"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isUseofContraception}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            name="useofContraception"
            id="useofContraception"
            placeholder=""
            lable={t("Use of Contraception Txt")}
            value={payload.useofContraception}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Alcohol")}
            id="isAlcohol"
            name="isAlcohol"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isAlcohol}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            name="alcohol"
            id="alcohol"
            placeholder=""
            lable={t("Alcohol Txt")}
            value={payload.alcohol}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Smoking")}
            id="isSmoking"
            name="isSmoking"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isSmoking}
            handleChange={handleSelect}
          />
          <Input
            type="text"
            name="smoking"
            id="smoking"
            placeholder=""
            lable={t("Smoking Txt")}
            value={payload.smoking}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Infertility Treated")}
            id="isInfertilityTreated"
            name="isInfertilityTreated"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isInfertilityTreated}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Anti D Injection")}
            id="isAntiDInjection"
            name="isAntiDInjection"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isAntiDInjection}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Non Veg")}
            id="isNonVeg"
            name="isNonVeg"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isNonVeg}
            handleChange={handleSelect}
          />
          <ReactSelect
            placeholderName={t("Veg")}
            id="isVeg"
            name="isVeg"
            searchable={true}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            value={payload?.isVeg}
            handleChange={handleSelect}
          />
        </div>
        <div className="d-flex justify-content-end gap-2 p-2">
          <button
            type="button"
            className="btn btn-primary mr-2"
            onClick={handleSave}
          >
            {isEdit ? t("Update") : t("Save")}
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={hanldleprint}
          >
            {t("Print Blank")}
          </button>
        </div>
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("History Details")} />
          <Tables
            thead={THEAD}
            tbody={tableData.map((item, index) => ({
              SNo: index + 1,
              "H/O Hypertension": item?.hypertnsn,
              "Chest Disease": item?.chstdisease,
              Thyroid: item?.thyroid,
              Tuberculosis: item?.Tuberculosis,
              Endometriosis: item?.Endometriosis,
              Diabetes: item?.Diabetes,
              "Heart Disease": item?.HeartDisease,
              "Fever with Rashes": item?.FeverwthRashes,
              "Drug Intake(Steroids)": item?.DrugIntake,
              STD: item?.STD,
              Thalassemia: item?.Thalassemia,
              "Allergy of any Type": item?.AllergyofanyType,

              Edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => handleEdit(item)}
                  style={{ cursor: "pointer", color: "blue" }}
                  title={t("Edit")}
                />
              ),

              Print: (
                <i
                  className="fa fa-print p-1"
                  onClick={() => handleRowPrint(item)}
                  style={{ cursor: "pointer", color: "green" }}
                  title={t("Print")}
                />
              ),
            }))}
          />
        </>
      )}
    </>
  );
};
export default ANCPatientHistoryII;
