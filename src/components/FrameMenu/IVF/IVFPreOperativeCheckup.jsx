import { useTranslation } from "react-i18next";
import DatePicker from "../../formComponent/DatePicker";
import TimePicker from "../../formComponent/TimePicker";
import Input from "../../formComponent/Input";
import ReactSelect from "../../formComponent/ReactSelect";
import TextAreaInput from "../../formComponent/TextAreaInput";
import { useEffect, useState } from "react";
import Tables from "../../UI/customTable";
import {
  bindDetails_PreOperative_CheckupApi,
  bindDoctor_PreOperative_CheckupApi,
  blank_PreOperative_CheckupApi,
  print_PreOperative_CheckupApi,
  save_PreOperative_CheckupApi,
} from "../../../networkServices/IVFApi";
import { notify } from "../../../utils/utils";
import moment from "moment/moment";
import Heading from "../../UI/Heading";
import { RedirectURL } from "../../../networkServices/PDFURL";

const IVFPreOperativeCheckup = (data) => {
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [payload, setPayload] = useState({
    transactionID: transactionID || "",
    poO_Date: new Date(),
    poO_Time: "",
    poO_Nilbymonthforhour: "",
    poO_Medication: "",
    poO_PreOperative: "",
    poO_Consent: "",
    poO_Bloodforgroupandcrossmatching: "",
    poO_Recordingofallinvstigatndn: "",
    poO_Anaethesiafitnessphysicianassesmentsos: "",
    poO_sendpatienttootat: "",

    popcU_Date: new Date(),
    popcU_Time: "",
    popcU_Temp: "",
    popcU_Pulse: "",
    popcU_BP: "",
    popcU_RSCVS: "",
    popcU_CNS: "",
    popcU_ECG: "",
    popcU_Saturation: "",
    popcU_Remarks: "",

    poacU_Date: new Date(),
    poacU_Time: "",
    poacU_DM: "",
    poacU_HT: "",
    poacU_HID: "",
    poacU_intract: "",
    poacU_asthma: "",
    poacU_Surgery: "",
    poacU_Cough: "",
    poacU_Kochs: "",
    poacU_Allergy: "",
    poacU_Alcohol: "",
    poacU_Tobacco: "",
    poacU_Smoking: "",
    poacU_Denture: "",
    poachU_historyrelatedtoanae: "",
    poacU_nrm: "",
    poacU_Temp: "",
    poacU_Pulse: "",
    poacU_BP: "",
    poacU_RSCVS: "",
    poacU_CNS: "",
    poacU_ECG: "",
    poacU_Saturation: "",

    poacR_ASARISK_GradeOne: "",
    poacR_ASARISK_Gradetwo: "",
    anestheticName: "",

    id: "",
  });

  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];
  const preOpeartiveOptins = [
    { label: t("Shaving"), value: "Shaving" },
    { label: t("Enemia"), value: "Enemia" },
  ];
  const ASARISKGradeOptions = [
    { label: t("Emergency"), value: "Emergency" },
    { label: t("Minor"), value: "Major" },
    { label: t("Supermajor"), value: "Supermajor" },
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "poO_Nilbymonthforhour") {
      const numericValue = value.replace(/\D/g, "").slice(0, 2);
      setPayload((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await bindDetails_PreOperative_CheckupApi(transactionID);
      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message, "error");
      console.error(error);
    }
  };
  const fetchDoctorList = async () => {
    try {
      const res = await bindDoctor_PreOperative_CheckupApi();
      if (res?.success) {
        const options = res.data.map((item) => ({
          label: item?.DoctorName,
          value: item?.DoctorID,
        }));
        setDoctorOptions(options);
      } else {
        setDoctorOptions([]);
        notify(res?.message, "error");
      }
    } catch (error) {
      notify(t("Doctor list error"), "error");
    }
  };
  useEffect(() => {
    fetchDoctorList();
  }, []);
  const hanldleprint = async () => {
    try {
      const response = await blank_PreOperative_CheckupApi(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const PrintType = 2;

      const response = await print_PreOperative_CheckupApi(
        transactionID,
        item?.ID,
        PrintType,
      );

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message || "Print failed", "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message || "Print error", "error");
    }
  };

  const handleSave = async () => {
    const body = {
      id: payload.id ? payload.id : 0,
      transactionID: transactionID,

      poO_Date: payload.poO_Date
        ? moment(payload.poO_Date).format("DD-MMM-YYYY")
        : "",
      poO_Time: payload.poO_Time
        ? moment(payload.poO_Time, "hh:mm A").format("HH:mm")
        : "",
      poO_Nilbymonthforhour: payload.poO_Nilbymonthforhour || "",
      poO_Medication: payload.poO_Medication || "",
      poO_PreOperative: payload.poO_PreOperative || "",
      poO_Consent: payload.poO_Consent || "",
      poO_Bloodforgroupandcrossmatching:
        payload.poO_Bloodforgroupandcrossmatching || "",
      poO_Recordingofallinvstigatndn:
        payload.poO_Recordingofallinvstigatndn || "",
      poO_Anaethesiafitnessphysicianassesmentsos:
        payload.poO_Anaethesiafitnessphysicianassesmentsos || "",
      poO_sendpatienttootat: payload.poO_sendpatienttootat || "",

      popcU_Date: payload.popcU_Date
        ? moment(payload.popcU_Date).format("DD-MMM-YYYY")
        : "",
      popcU_Time: payload.popcU_Time
        ? moment(payload.popcU_Time, "hh:mm A").format("HH:mm")
        : "",
      popcU_Temp: payload.popcU_Temp || "",
      popcU_Pulse: payload.popcU_Pulse || "",
      popcU_BP: payload.popcU_BP || "",
      popcU_RSCVS: payload.popcU_RSCVS || "",
      popcU_CNS: payload.popcU_CNS || "",
      popcU_ECG: payload.popcU_ECG || "",
      popcU_Saturation: payload.popcU_Saturation || "",
      popcU_Remarks: payload.popcU_Remarks || "",

      poacU_Date: payload.poacU_Date
        ? moment(payload.poacU_Date).format("DD-MMM-YYYY")
        : "",
      poacU_Time: payload.poacU_Time
        ? moment(payload.poacU_Time, "hh:mm A").format("HH:mm")
        : "",
      poacU_DM: payload.poacU_DM || "",
      poacU_HT: payload.poacU_HT || "",
      poacU_HID: payload.poacU_HID || "",
      poacU_intract: payload.poacU_intract || "",
      poacU_asthma: payload.poacU_asthma || "",
      poacU_Surgery: payload.poacU_Surgery || "",
      poacU_Cough: payload.poacU_Cough || "",
      poacU_Kochs: payload.poacU_Kochs || "",
      poacU_Allergy: payload.poacU_Allergy || "",
      poacU_Alcohol: payload.poacU_Alcohol || "",
      poacU_Tobacco: payload.poacU_Tobacco || "",
      poacU_Smoking: payload.poacU_Smoking || "",
      poacU_Denture: payload.poacU_Denture || "",
      poachU_historyrelatedtoanae: payload.poachU_historyrelatedtoanae || "",
      poacU_nrm: payload.poacU_nrm || "",
      poacU_Temp: payload.poacU_Temp || "",
      poacU_Pulse: payload.poacU_Pulse || "",
      poacU_BP: payload.poacU_BP || "",
      poacU_RSCVS: payload.poacU_RSCVS || "",
      poacU_CNS: payload.poacU_CNS || "",
      poacU_ECG: payload.poacU_ECG || "",
      poacU_Saturation: payload.poacU_Saturation || "",

      poacR_ASARISK_GradeOne: payload.poacR_ASARISK_GradeOne || "",
      poacR_ASARISK_Gradetwo: payload.poacR_ASARISK_Gradetwo || "",
      anestheticName: payload.anestheticName || "",
    };
    try {
      const response = await save_PreOperative_CheckupApi(body);

      if (response?.success) {
        notify(response?.message || "Saved successfully", "success");
        fetchData();
        setIsEdit(false);
        resetForm();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(
        error?.response?.data?.message || "Something went wrong while saving",
        "error",
      );
    }
  };
  const resetForm = () => {
    setPayload({
      transactionID: transactionID || "",
      poO_Date: new Date(),
      poO_Time: "",
      poO_Nilbymonthforhour: "",
      poO_Medication: "",
      poO_PreOperative: "",
      poO_Consent: "",
      poO_Bloodforgroupandcrossmatching: "",
      poO_Recordingofallinvstigatndn: "",
      poO_Anaethesiafitnessphysicianassesmentsos: "",
      poO_sendpatienttootat: "",

      popcU_Date: new Date(),
      popcU_Time: "",
      popcU_Temp: "",
      popcU_Pulse: "",
      popcU_BP: "",
      popcU_RSCVS: "",
      popcU_CNS: "",
      popcU_ECG: "",
      popcU_Saturation: "",
      popcU_Remarks: "",

      poacU_Date: null,
      poacU_Time: "",
      poacU_DM: "",
      poacU_HT: "",
      poacU_HID: "",
      poacU_intract: "",
      poacU_asthma: "",
      poacU_Surgery: "",
      poacU_Cough: "",
      poacU_Kochs: "",
      poacU_Allergy: "",
      poacU_Alcohol: "",
      poacU_Tobacco: "",
      poacU_Smoking: "",
      poacU_Denture: "",
      poachU_historyrelatedtoanae: "",
      poacU_nrm: "",
      poacU_Temp: "",
      poacU_Pulse: "",
      poacU_BP: "",
      poacU_RSCVS: "",
      poacU_CNS: "",
      poacU_ECG: "",
      poacU_Saturation: "",

      poacR_ASARISK_GradeOne: "",
      poacR_ASARISK_Gradetwo: "",
      anestheticName: "",

      id: "",
    });
  };

  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",

      poO_Date: item?.PreOperativeOrder_Date
        ? moment(item.PreOperativeOrder_Date, "DD-MMM-YYYY").toDate()
        : "",

      poO_Time: item?.PreOperativeOrder_Time
        ? moment(item.PreOperativeOrder_Time, "hh:mm A").toDate()
        : "",
      poO_Nilbymonthforhour: item?.PreOperativeOrder_NilbyMnthforHour
        ? String(item.PreOperativeOrder_NilbyMnthforHour).slice(0, 2)
        : "",

      poO_Medication: item?.PreOperativeOrder_Medication || "",
      poO_PreOperative: item?.PreOperativeOrder_Optional || "",
      poO_Consent: item?.PreOperativeOrder_Consent?.toString() || "",
      poO_Bloodforgroupandcrossmatching:
        item?.PreOperativeOrder_BloodforGroupingandCrossMatching?.toString() ||
        "",
      poO_Recordingofallinvstigatndn:
        item?.PreOperativeOrder_RecordingofAllinvestigationdone?.toString() ||
        "",
      poO_Anaethesiafitnessphysicianassesmentsos:
        item?.PreOperativeOrder_AnaethesiafitnessphysianassesmentSOS?.toString() ||
        "",
      poO_sendpatienttootat: item?.PreOperativeOrder_SendPatienttoOTat || "",

      popcU_Date: item?.PreOperativePhyChkUp_Date
        ? moment(item.PreOperativePhyChkUp_Date, "DD-MMM-YYYY").toDate()
        : "",

      popcU_Time: item?.PreOperativePhyChkUp_Time
        ? moment(item.PreOperativePhyChkUp_Time, "hh:mm A").toDate()
        : "",
      popcU_Temp: item?.PreOperativePhyChkUp_Temp || "",
      popcU_Pulse: item?.PreOperativePhyChkUp_Pulse || "",
      popcU_BP: item?.PreOperativePhyChkUp_BP || "",
      popcU_RSCVS: item?.PreOperativePhyChkUp_RSCVS || "",
      popcU_CNS: item?.PreOperativePhyChkUp_CNS || "",
      popcU_ECG: item?.PreOperativePhyChkUp_ECG || "",
      popcU_Saturation: item?.PreOperativePhyChkUp_Saturation || "",
      popcU_Remarks: item?.PreOperativePhyChkUp_Remarks || "",

      poacU_Date: item?.PreOperativeAnaeChkUp_Date
        ? moment(item.PreOperativeAnaeChkUp_Date, "DD-MMM-YYYY").toDate()
        : null,

      poacU_Time: item?.PreOperativeAnaeChkUp_Time
        ? moment(item.PreOperativeAnaeChkUp_Time, "hh:mm A").toDate()
        : "",
      poacU_DM: item?.PreOperativeAnaeChkUp_DM || "",
      poacU_HT: item?.PreOperativeAnaeChkUp_HT || "",
      poacU_HID: item?.PreOperativeAnaeChkUp_HID || "",
      poacU_intract: item?.PreOperativeAnaeChkUp_Intract || "",
      poacU_asthma: item?.PreOperativeAnaeChkUp_Asthma || "",
      poacU_Surgery: item?.PreOperativeAnaeChkUp_Surgery || "",
      poacU_Cough: item?.PreOperativeAnaeChkUp_Cough || "",
      poacU_Kochs: item?.PreOperativeAnaeChkUp_Kochs || "",
      poacU_Allergy: item?.PreOperativeAnaeChkUp_Allergy || "",
      poacU_Alcohol: item?.PreOperativeAnaeChkUp_Alcohol || "",
      poacU_Tobacco: item?.PreOperativeAnaeChkUp_Tobacco || "",
      poacU_Smoking: item?.PreOperativeAnaeChkUp_Smoking || "",
      poacU_Denture: item?.PreOperativeAnaeChkUp_Denture || "",
      poachU_historyrelatedtoanae:
        item?.PreOperativeAnaeChkUp_HistoryrltdtoAnae || "",
      poacU_nrm: item?.PreOperativeAnaeChkUp_NRM || "",
      poacU_Temp: item?.PreOperativeAnaeChkUp_Temp || "",
      poacU_Pulse: item?.PreOperativeAnaeChkUp_Pulse || "",
      poacU_BP: item?.PreOperativeAnaeChkUp_BP || "",
      poacU_RSCVS: item?.PreOperativeAnaeChkUp_RSCVS || "",
      poacU_CNS: item?.PreOperativeAnaeChkUp_CNS || "",
      poacU_ECG: item?.PreOperativeAnaeChkUp_ECG || "",
      poacU_Saturation: item?.PreOperativeAnaeChkUp_Saturation || "",

      poacR_ASARISK_GradeOne:
        item?.PreOperativeAnaeChkUp_ASARiskGradeone?.toString() || "",
      poacR_ASARISK_Gradetwo: item?.PreOperativeAnaeChkUp_ASARiskGradetwo || "",

      anestheticName: item?.AnestheticName || "",
    });

    setIsEdit(true);
  };

  const THEAD = [
    { name: t("SNo") },
    { name: t("PreOperativeOrder_Date") },
    { name: t("PreOperativeOrder_Time") },
    { name: t("NilByMonthforHour") },
    { name: t("Medication") },
    { name: t("PreOperativeOrder") },
    { name: t("Send Patient to OT at") },
    { name: t("Edit"), width: "2%" },
    { name: t("Print"), width: "2%" },
  ];
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [doctorOptions, setDoctorOptions] = useState();
  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Pre Operative Orders")} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="poO_Date"
              id="poO_Date"
              value={payload?.poO_Date}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="poO_Time"
              name="poO_Time"
              value={payload?.poO_Time}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="number"
              lable={t("Nil by Mouth for Hour")}
              className="form-control"
              id="poO_Nilbymonthforhour"
              name="poO_Nilbymonthforhour"
              value={payload?.poO_Nilbymonthforhour}
              onChange={handleChange}
              min={0}
              max={99}
              placeholder=""
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("PreOperative")}
              name="poO_PreOperative"
              id="poO_PreOperative"
              value={payload?.poO_PreOperative}
              handleChange={handleSelect}
              removeIsClearable={true}
              searchable={true}
              dynamicOptions={preOpeartiveOptins}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Consent")}
              id="poO_Consent"
              name="poO_Consent"
              handleChange={handleSelect}
              removeIsClearable={true}
              searchable={true}
              value={payload?.poO_Consent}
              dynamicOptions={yesNoOptions}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Blood For Grouping")}
              id="poO_Bloodforgroupandcrossmatching"
              name="poO_Bloodforgroupandcrossmatching"
              handleChange={handleSelect}
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={payload?.poO_Bloodforgroupandcrossmatching}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Recording of all Investigation")}
              name="poO_Recordingofallinvstigatndn"
              id="poO_Recordingofallinvstigatndn"
              handleChange={handleSelect}
              value={payload?.poO_Recordingofallinvstigatndn}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              searchable={true}
            />
            <ReactSelect
              placeholderName={t("Anaethesia fitness/Physician's")}
              name="poO_Anaethesiafitnessphysicianassesmentsos"
              id="poO_Anaethesiafitnessphysicianassesmentsos"
              handleChange={handleSelect}
              value={payload?.poO_Anaethesiafitnessphysicianassesmentsos}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
              removeIsClearable={true}
              searchable={true}
              dynamicOptions={yesNoOptions}
            />
            <TextAreaInput
              type="text"
              lable={t("Send Patient to OT at")}
              id="poO_sendpatienttootat"
              name="poO_sendpatienttootat"
              value={payload?.poO_sendpatienttootat}
              rows={2}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TextAreaInput
              type="text"
              lable={t("Medication")}
              id="poO_Medication"
              name="poO_Medication"
              value={payload?.poO_Medication}
              rows={2}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Pre Operative Physician CheckUp")} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="popcU_Date"
              id="popcU_Date"
              value={payload?.popcU_Date}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Time")}
              label={t("Time")}
              name="popcU_Time"
              id="popcU_Time"
              handleChange={handleChange}
              value={payload?.popcU_Time}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Temp")}
              className="form-control"
              id="poacU_Temp"
              name="poacU_Temp"
              value={payload?.poacU_Temp}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Pulse")}
              className="form-control"
              id="poacU_Pulse"
              name="poacU_Pulse"
              value={payload?.poacU_Pulse}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("B.P")}
              className="form-control"
              id="poacU_BP"
              name="poacU_BP"
              value={payload?.poacU_BP}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("RS/CVS")}
              className="form-control"
              id="poacU_RSCVS"
              name="poacU_RSCVS"
              value={payload?.poacU_RSCVS}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("CNS")}
              className="form-control"
              id="poacU_CNS"
              name="poacU_CNS"
              value={payload?.poacU_CNS}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("ECG")}
              className="form-control"
              id="popcU_ECG"
              name="popcU_ECG"
              value={payload?.popcU_ECG}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Saturation")}
              className="form-control"
              id="popcU_Saturation"
              name="popcU_Saturation"
              value={payload?.popcU_Saturation}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TextAreaInput
              type="text"
              lable={t("Remarks")}
              id="popcU_Remarks"
              name="popcU_Remarks"
              value={payload?.popcU_Remarks}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Pre Operative Anaesthetic Check Up")} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="poacU_Date"
              id="poacU_Date"
              value={payload?.poacU_Date}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Time")}
              label={t("Time")}
              name="poacU_Time"
              id="poacU_Time"
              handleChange={handleChange}
              value={payload?.poacU_Time}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("AnestheticName")}
              name="anestheticName"
              id="anestheticName"
              handleChange={handleSelect}
              removeIsClearable={true}
              searchable={true}
              dynamicOptions={doctorOptions}
              value={payload?.anestheticName}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("DM")}
              className="form-control"
              id="poacU_DM"
              name="poacU_DM"
              value={payload?.poacU_DM}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("HT")}
              className="form-control"
              id="poacU_HT"
              name="poacU_HT"
              value={payload?.poacU_HT}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("HID")}
              className="form-control"
              id="poacU_HID"
              name="poacU_HID"
              value={payload?.poacU_HID}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Intract")}
              className="form-control"
              id="poacU_intract"
              name="poacU_intract"
              value={payload?.poacU_intract}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Asthma")}
              className="form-control"
              id="poacU_asthma"
              name="poacU_asthma"
              value={payload?.poacU_asthma}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Surgery")}
              className="form-control"
              id="poacU_Surgery"
              name="poacU_Surgery"
              value={payload?.poacU_Surgery}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Cough")}
              className="form-control"
              id="poacU_Cough"
              name="poacU_Cough"
              value={payload?.poacU_Cough}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Kochs")}
              className="form-control"
              id="poacU_Kochs"
              name="poacU_Kochs"
              value={payload?.poacU_Kochs}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Allergy")}
              className="form-control"
              id="poacU_Allergy"
              name="poacU_Allergy"
              value={payload?.poacU_Allergy}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Alcohol")}
              className="form-control"
              id="poacU_Alcohol"
              name="poacU_Alcohol"
              value={payload?.poacU_Alcohol}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Tobacco")}
              className="form-control"
              id="poacU_Tobacco"
              name="poacU_Tobacco"
              value={payload?.poacU_Tobacco}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Smoking")}
              className="form-control"
              id="poacU_Smoking"
              name="poacU_Smoking"
              value={payload?.poacU_Smoking}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Denture")}
              className="form-control"
              id="poacU_Denture"
              name="poacU_Denture"
              value={payload?.poacU_Denture}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("History Related to Anaethesia")}
              className="form-control"
              id="poachU_historyrelatedtoanae"
              name="poachU_historyrelatedtoanae"
              value={payload?.poachU_historyrelatedtoanae}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("NRM")}
              className="form-control"
              id="poacU_nrm"
              name="poacU_nrm"
              value={payload?.poacU_nrm}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Temp")}
              className="form-control"
              id="popcU_Temp"
              name="popcU_Temp"
              value={payload?.popcU_Temp}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Pulse")}
              className="form-control"
              id="popcU_Pulse"
              name="popcU_Pulse"
              value={payload?.popcU_Pulse}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("B.P")}
              className="form-control"
              id="popcU_BP"
              name="popcU_BP"
              value={payload?.popcU_BP}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("RS/CVS")}
              className="form-control"
              id="popcU_RSCVS"
              name="popcU_RSCVS"
              value={payload?.popcU_RSCVS}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("CNS")}
              className="form-control"
              id="popcU_CNS"
              name="popcU_CNS"
              value={payload?.popcU_CNS}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("ECG")}
              className="form-control"
              id="popcU_ECG"
              name="popcU_ECG"
              value={payload?.popcU_ECG}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              lable={t("Saturation")}
              className="form-control"
              id="poacU_Saturation"
              name="poacU_Saturation"
              value={payload?.poacU_Saturation}
              onChange={handleChange}
              placeholder=""
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("ASA RISK Grade One")}
              removeIsClearable={true}
              searchable={true}
              id="poacR_ASARISK_GradeOne"
              name="poacR_ASARISK_GradeOne"
              handleChange={handleSelect}
              value={payload?.poacR_ASARISK_GradeOne}
              dynamicOptions={yesNoOptions}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("ASA RISK Grade One")}
              removeIsClearable={true}
              searchable={true}
              id="poacR_ASARISK_Gradetwo"
              name="poacR_ASARISK_Gradetwo"
              handleChange={handleSelect}
              value={payload?.poacR_ASARISK_Gradetwo}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              dynamicOptions={ASARISKGradeOptions}
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
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <Heading title={t("History")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              PreOperativeOrder_Date: item?.PreOperativeOrder_Date || "",
              PreOperativeOrder_Time: item?.PreOperativeOrder_Time || "",
              NilByMonthforHour: item?.PreOperativeOrder_NilbyMnthforHour || "",
              Medication: item?.PreOperativeOrder_Medication || "",
              PreOperativeOrder: item?.PreOperativeOrder_Optional || "",
              "Send Patient to OT at":
                item?.PreOperativeOrder_SendPatienttoOTat || "",
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
export default IVFPreOperativeCheckup;
