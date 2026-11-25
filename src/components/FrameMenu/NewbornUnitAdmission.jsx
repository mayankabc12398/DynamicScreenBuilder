import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { notify } from "../../utils/utils";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";
import {
  NursingWardUpdateNewBornBaby,
  NursingWardSaveNewBornBaby,
  NursingWardGetNewBornList,
} from "../../networkServices/nursingWardAPI";

const NewbornUnitAdmission = ({ onClose, data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const [values, setValues] = useState({
    indeterminate: "",
    gestation: "",
    rom: [],
    delivery: [],
    csType: [],
    multipleDelivery: [],
    selectedYes: "",
    bvmResuscitation: [],
    apgar: [],
    bornOutside: [],
    selectedBornYes: [],
    name: "",
    ipNo: "",
    age: "",
    parity: "",
    paritySec: "",
    bloodGroup: [],
    rhesus: [],
    pmtctStatus: [],
    vdrl: [],
    motherARVs: [],
    diabetes: [],
    hypertensionInPregnancy: [],
    aph: [],
    prolongedSecondStage: [],
    maternalTreatment: "",
    whenProblemStarts: "",
    temperature: "",
    respiratoryRate: "",
    pulse: "",
    o2: "",
    birthWeight: "",
    weight: "",
    headCircumference: "",
    length: "",
    timeBabySeen: "",
    fever: [],
    difficultyBreathing: [],
    difficultyFeeding: [],
    convulsions: [],
    apnoea: [],
    absent: [],
    bloodyStool: [],
    biliousVomiting: [],
    socialHistory: "",
  });
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

      let response = await NursingWardGetNewBornList(transactionid);

      if (response?.success) {
        setTableData(response.data);
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
      ? selectedOptions.map((opt) => {
          if (opt.name) {
            return opt.name;
          }
          return opt.value || opt;
        })
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
      indeterminate: values.indeterminate,
      gestationWks: values.gestation,
      rom: Array.isArray(values.rom) ? values.rom.join(", ") : values.rom,
      delivery: Array.isArray(values.delivery)
        ? values.delivery.join(", ")
        : values.delivery,
      csType: Array.isArray(values.csType)
        ? values.csType.join(", ")
        : values.csType,
      multipleDelivery: Array.isArray(values.multipleDelivery)
        ? values.multipleDelivery.join(", ")
        : values.multipleDelivery,
      multipleNumber: values.selectedYes,
      bvm: Array.isArray(values.bvmResuscitation)
        ? values.bvmResuscitation.join(", ")
        : values.bvmResuscitation,
      apgar: Array.isArray(values.apgar)
        ? values.apgar.join(", ")
        : values.apgar,
      bornOutside: Array.isArray(values.bornOutside)
        ? values.bornOutside.join(", ")
        : values.bornOutside,
      bornWhere: Array.isArray(values.selectedBornYes)
        ? values.selectedBornYes.join(", ")
        : values.selectedBornYes,
      motherName: values.name,
      motherIPNo: values.ipNo,
      motherAge: values.age,
      parity1: values.parity,
      parity2: values.paritySec,
      bloodGrp: Array.isArray(values.bloodGroup)
        ? values.bloodGroup.join(", ")
        : values.bloodGroup,
      rhesus: Array.isArray(values.rhesus)
        ? values.rhesus.join(", ")
        : values.rhesus,
      pmtct: Array.isArray(values.pmtctStatus)
        ? values.pmtctStatus.join(", ")
        : values.pmtctStatus,
      vdrl: Array.isArray(values.vdrl) ? values.vdrl.join(", ") : values.vdrl,
      motherARVs: Array.isArray(values.motherARVs)
        ? values.motherARVs.join(", ")
        : values.motherARVs,
      diabetes: Array.isArray(values.diabetes)
        ? values.diabetes.join(", ")
        : values.diabetes,
      hypertension: Array.isArray(values.hypertensionInPregnancy)
        ? values.hypertensionInPregnancy.join(", ")
        : values.hypertensionInPregnancy,
      aph: Array.isArray(values.aph) ? values.aph.join(", ") : values.aph,
      prolongedStage: Array.isArray(values.prolongedSecondStage)
        ? values.prolongedSecondStage.join(", ")
        : values.prolongedSecondStage,
      maternalIllness: values.maternalTreatment,
      problemProgress: values.whenProblemStarts,
      temp: values.temperature,
      respRate: values.respiratoryRate,
      pulse: values.pulse,
      o2Sat: values.o2,
      birthWt: values.birthWeight,
      weightNow: values.weight,
      headCirc: values.headCircumference,
      length: values.length,
      vitalTime: values.timeBabySeen,
      fever: Array.isArray(values.fever)
        ? values.fever.join(", ")
        : values.fever,
      difficultyBreathing: Array.isArray(values.difficultyBreathing)
        ? values.difficultyBreathing.join(", ")
        : values.difficultyBreathing,
      difficultyFeeding: Array.isArray(values.difficultyFeeding)
        ? values.difficultyFeeding.join(", ")
        : values.difficultyFeeding,
      convulsions: Array.isArray(values.convulsions)
        ? values.convulsions.join(", ")
        : values.convulsions,
      apnoea: Array.isArray(values.apnoea)
        ? values.apnoea.join(", ")
        : values.apnoea,
      reducedAbsent: Array.isArray(values.absent)
        ? values.absent.join(", ")
        : values.absent,
      bloodyStool: Array.isArray(values.bloodyStool)
        ? values.bloodyStool.join(", ")
        : values.bloodyStool,
      biliousVomiting: Array.isArray(values.biliousVomiting)
        ? values.biliousVomiting.join(", ")
        : values.biliousVomiting,
      otherHistory: values.socialHistory,
    };

    // Add ID only in edit mode
    if (editMode && editId) {
      payload.id = editId;
    }

    return payload;
  };

  const handleSave = async () => {
    try {
      const payload = preparePayload();

      console.log("Save Payload:", payload);

      let response = await NursingWardSaveNewBornBaby(payload);

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
      const payload = preparePayload();

      if (!editId) {
        notify(t("No record selected for update"), "error");
        return;
      }

      console.log("Update Payload:", payload);

      let response = await NursingWardUpdateNewBornBaby(payload);

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
      indeterminate: "",
      gestation: "",
      rom: [],
      delivery: [],
      csType: [],
      multipleDelivery: [],
      selectedYes: "",
      bvmResuscitation: [],
      apgar: [],
      bornOutside: [],
      selectedBornYes: [],
      name: "",
      ipNo: "",
      age: "",
      parity: "",
      paritySec: "",
      bloodGroup: [],
      rhesus: [],
      pmtctStatus: [],
      vdrl: [],
      motherARVs: [],
      diabetes: [],
      hypertensionInPregnancy: [],
      aph: [],
      prolongedSecondStage: [],
      maternalTreatment: "",
      whenProblemStarts: "",
      temperature: "",
      respiratoryRate: "",
      pulse: "",
      o2: "",
      birthWeight: "",
      weight: "",
      headCircumference: "",
      length: "",
      timeBabySeen: "",
      fever: [],
      difficultyBreathing: [],
      difficultyFeeding: [],
      convulsions: [],
      apnoea: [],
      absent: [],
      bloodyStool: [],
      biliousVomiting: [],
      socialHistory: "",
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleEdit = (row) => {
    // Convert backend string values to arrays for multi-select components
    const convertToArray = (value) => {
      if (!value) return [];
      if (typeof value === "string") {
        return value.split(", ").filter((item) => item.trim() !== "");
      }
      return Array.isArray(value) ? value : [];
    };

    setValues({
      indeterminate: row.indeterminate || "",
      gestation: row.gestationWks || "",
      rom: convertToArray(row.rom),
      delivery: convertToArray(row.delivery),
      csType: convertToArray(row.csType),
      multipleDelivery: convertToArray(row.multipleDelivery),
      selectedYes: row.multipleNumber || "",
      bvmResuscitation: convertToArray(row.bvm),
      apgar: convertToArray(row.apgar),
      bornOutside: convertToArray(row.bornOutside),
      selectedBornYes: convertToArray(row.bornWhere),
      name: row.motherName || "",
      ipNo: row.motherIPNo || "",
      age: row.motherAge || "",
      parity: row.parity1 || "",
      paritySec: row.paritySec || "",
      bloodGroup: convertToArray(row.bloodGrp),
      rhesus: convertToArray(row.rhesus),
      pmtctStatus: convertToArray(row.pmtct),
      vdrl: convertToArray(row.vdrl),
      motherARVs: convertToArray(row.motherARVs),
      diabetes: convertToArray(row.diabetes),
      hypertensionInPregnancy: convertToArray(row.hypertension),
      aph: convertToArray(row.aph),
      prolongedSecondStage: convertToArray(row.prolongedStage),
      maternalTreatment: row.maternalIllness || "",
      whenProblemStarts: row.problemProgress || "",
      temperature: row.temp || "",
      respiratoryRate: row.respRate || "",
      pulse: row.pulse || "",
      o2: row.o2Sat || "",
      birthWeight: row.birthWt || "",
      weight: row.weightNow || "",
      headCircumference: row.headCirc || "",
      length: row.length || "",
      timeBabySeen: row.vitalTime || "",
      fever: convertToArray(row.fever),
      difficultyBreathing: convertToArray(row.difficultyBreathing),
      difficultyFeeding: convertToArray(row.difficultyFeeding),
      convulsions: convertToArray(row.convulsions),
      apnoea: convertToArray(row.apnoea),
      absent: convertToArray(row.reducedAbsent),
      bloodyStool: convertToArray(row.bloodyStool),
      biliousVomiting: convertToArray(row.biliousVomiting),
      socialHistory: row.otherHistory || "",
    });

    setEditMode(true);
    setEditId(row.id);
  };

  // Fix the duplicate apgar MultiSelectComp (replace the duplicate multipleDelivery)
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
      <Heading title={<span className="text-dark">{t("Infant's Details")}</span>} />
      <div className="row p-2">
        <Input
          type="checkbox"
          className="form-control"
          id="indeterminate"
          lable={t("Indeterminate")}
          placeholder=" "
          checked={values?.indeterminate === "Yes"}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="indeterminate"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="gestation"
          lable={t("Gestation (wks)")}
          placeholder=" "
          required={true}
          value={values?.gestation}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="gestation"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rom"
          id="rom"
          placeholderName={t("ROM")}
          dynamicOptions={[
            { name: "<18h", value: "<18h" },
            { name: ">18h", value: ">18h" },
            { name: "unk", value: "Unknown" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rom}
          isRemoveTemplate={true}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="delivery"
          id="delivery"
          placeholderName={t("Delivery")}
          dynamicOptions={[
            { name: "SVD", value: "SVD" },
            { name: "Forceps", value: "Forceps" },
            { name: "CS", value: "CS" },
            { name: "Breech", value: "Breech" },
            { name: "Vacuum", value: "Vacuum" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.delivery}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="csType"
          id="csType"
          placeholderName={t("C/S Type")}
          dynamicOptions={[
            { name: "Elective", value: "Elective" },
            { name: "Emergency", value: "Emergency" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.csType}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="multipleDelivery"
          id="multipleDelivery"
          placeholderName={t("Multiple Delivery")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.multipleDelivery}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="selectedYes"
          lable={t("If Yes, Number ?")}
          placeholder=" "
          value={values?.selectedYes}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="selectedYes"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="bvmResuscitation"
          id="bvmResuscitation"
          placeholderName={t("BVM Resuscitation?")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.bvmResuscitation}
          isRemoveTemplate={true}
        />
        {/* Fixed: Changed from duplicate multipleDelivery to apgar */}
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="apgar"
          id="apgar"
          placeholderName={t("Apgar")}
          dynamicOptions={[
            { name: "1m", value: "1m" },
            { name: "5m", value: "5m" },
            { name: "10m", value: "10m" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.apgar}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="bornOutside"
          id="bornOutside"
          placeholderName={t("Born outside this facility")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.bornOutside}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="selectedBornYes"
          id="selectedBornYes"
          placeholderName={t("If Yes, born where?")}
          dynamicOptions={[
            { name: "Home/Roadside", value: "Home/Roadside" },
            { name: "Other Facility", value: "Other Facility" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.selectedBornYes}
          isRemoveTemplate={true}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Mother's Details")}</span>} />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="name"
          lable={t("Name")}
          placeholder=" "
          required={true}
          value={values?.name}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="name"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="ipNo"
          lable={t("IP No.")}
          placeholder=" "
          required={true}
          value={values?.ipNo}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="ipNo"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="age"
          lable={t("Age")}
          placeholder=" "
          required={true}
          value={values?.age}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="age"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="parity"
          lable={t("Parity")}
          placeholder=" "
          required={true}
          value={values?.parity}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="parity"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="paritySec"
          lable={t("Parity")}
          placeholder=" "
          required={true}
          value={values?.paritySec}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="paritySec"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="bloodGroup"
          id="bloodGroup"
          placeholderName={t("Blood Group")}
          dynamicOptions={[
            { name: "O", value: "1" },
            { name: "A", value: "2" },
            { name: "B", value: "3" },
            { name: "AB", value: "4" },
            { name: "unkn", value: "5" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.bloodGroup}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="rhesus"
          id="rhesus"
          placeholderName={t("Rhesus")}
          dynamicOptions={[
            { name: "Pos", value: "1" },
            { name: "Neg", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.rhesus}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="pmtctStatus"
          id="pmtctStatus"
          placeholderName={t("PMTCT Status")}
          dynamicOptions={[
            { name: "Pos", value: "1" },
            { name: "Neg", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.pmtctStatus}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="vdrl"
          id="vdrl"
          placeholderName={t("VDRL")}
          dynamicOptions={[
            { name: "Pos", value: "1" },
            { name: "Neg", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.vdrl}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="motherARVs"
          id="motherARVs"
          placeholderName={t("Mother ARVs")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.motherARVs}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="diabetes"
          id="diabetes"
          placeholderName={t("Diabetes")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.diabetes}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="hypertensionInPregnancy"
          id="hypertensionInPregnancy"
          placeholderName={t("Hypertension in Pregnancy")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.hypertensionInPregnancy}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="aph"
          id="aph"
          placeholderName={t("APH")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No ", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.aph}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="prolongedSecondStage"
          id="prolongedSecondStage"
          placeholderName={t("Prolonged 2nd Stage")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.prolongedSecondStage}
          isRemoveTemplate={true}
        />
      </div>
      <Heading
        title={
          <span className="text-dark">
            {t("Mother's problems during pregnency/ labour & relevant maternal treatment")}
          </span>
        }
      />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="maternalTreatment"
          lable={t(
            "Any maternal illness / fever / Any maternal treatment for TB or antibiotics in labour or relevant maternal treatment (Describe)"
          )}
          placeholder=""
          required={true}
          value={values?.maternalTreatment}
          respclass="col-xl col-12"
          name="maternalTreatment"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="whenProblemStarts"
          lable={t(
            "When did problems start, how did they progress and what are problems now?"
          )}
          placeholder=""
          required={true}
          value={values?.whenProblemStarts}
          respclass="col-xl col-12"
          name="whenProblemStarts"
          onChange={handleChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Vital Signs")}</span>} />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="temperature"
          lable={t("Temp (°C)")}
          placeholder=" "
          required={true}
          value={values?.temperature}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="temperature"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="respiratoryRate"
          lable={t("Resp Rate (bpm)")}
          placeholder=" "
          required={true}
          value={values?.respiratoryRate}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="respiratoryRate"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="pulse"
          lable={t("Pulse (/min)")}
          placeholder=" "
          required={true}
          value={values?.pulse}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="pulse"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="o2"
          lable={t("O2 Sat (%)")}
          placeholder=" "
          required={true}
          value={values?.o2}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="o2"
          onChange={handleChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Anthropometry")}</span>} />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="birthWeight"
          lable={t("Birth Weight (grams)")}
          placeholder=" "
          required={true}
          value={values?.birthWeight}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="birthWeight"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="weight"
          lable={t("Weight now (grams)")}
          placeholder=" "
          required={true}
          value={values?.weight}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="weight"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="headCircumference"
          lable={t("Head Circumference")}
          placeholder=" "
          required={true}
          value={values?.headCircumference}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="headCircumference"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="length"
          lable={t("Length (cm)")}
          placeholder=" "
          required={true}
          value={values?.length}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="length"
          onChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Temp Time")}
          lable={t("Time baby seen")}
          id="timeBabySeen"
          name="timeBabySeen"
          value={values?.timeBabySeen}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Normal Symptoms")}</span>} />
      <div className="row p-2">
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="fever"
          id="fever"
          placeholderName={t("Fever")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.fever}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="difficultyBreathing"
          id="difficultyBreathing"
          placeholderName={t("Difficulty breathing")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.difficultyBreathing}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="difficultyFeeding"
          id="difficultyFeeding"
          placeholderName={t("Difficulty feeding")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.difficultyFeeding}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="convulsions"
          id="convulsions"
          placeholderName={t("Convulsions")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.convulsions}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="apnoea"
          id="apnoea"
          placeholderName={t("Apnoea")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.apnoea}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="absent"
          id="absent"
          placeholderName={t("Reduced/Absent")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.absent}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="bloodyStool"
          id="bloodyStool"
          placeholderName={t("Bloody stool")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
            { name: "UnKnown", value: "3" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.bloodyStool}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="biliousVomiting"
          id="biliousVomiting"
          placeholderName={t("Bilious Vomiting")}
          dynamicOptions={[
            { name: "Yes", value: "1" },
            { name: "No", value: "2" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.biliousVomiting}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="socialHistory"
          lable={t("Any other important history and family / social history?")}
          placeholder=" "
          required={true}
          value={values?.socialHistory}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="socialHistory"
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
        <Tables
          thead={NEWBORNRECORDS}
          tbody={tableData.map((row, index) => ({
            "Sr.No": index + 1,
            ROM: row.rom || "-",
            Delivery: row.delivery || "-",
            "C/S Type": row.csType || "-",
            "Multiple Delivery": row.multipleDelivery || "-",
            "BVM Resuscitation?": row.bvm || "-",
            "Born outside this facility": row.bornOutside || "-",
            Name: row.motherName || "-",
            "Blood Grp": row.bloodGrp || "-",
            Rhesus: row.rhesus || "-",
            "PMTCT Status": row.pmtct || "-",
            VDRL: row.vdrl || "-",
            "Mother ARVs": row.motherARVs || "-",
            APH: row.aph || "-",
            "Created By": row.createdBy || "-",
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

export default NewbornUnitAdmission;
