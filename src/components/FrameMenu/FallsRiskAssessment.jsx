import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import ReactSelect from "../formComponent/ReactSelect";
import LabeledInput from "../formComponent/LabeledInput";
import Input from "../formComponent/Input";
import { useSelector } from "react-redux";
import { handleReactSelectDropDownOptions } from "../../utils/utils";
import { GetAllDoctor } from "../../store/reducers/common/CommonExportFunction";
import { useDispatch } from "react-redux";
import moment from "moment";
import {
  saveOrUpdateInPatientFallsAssessmentApi,
  getInPatientFallsAssessmentApi,
  InPatientFallsAssessmentAndPrecautionReportApi,
} from "../../networkServices/Emergency";
import { notify } from "../../utils/ustil2";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import { RedirectURL } from "../../networkServices/PDFURL";

const FallsRiskAssessment = ({ data }) => {
  const { patientID, transactionID } = data;
  const [t] = useTranslation();
  const initialValue = {
    patientID: patientID,
    transactionID: transactionID,
    // patientName: data?.patientName,
    AssessmentBy: "",

    id: "",
    DATE: new Date(),
    Time: new Date(),
    DateOfExam: new Date(),
    TimeOfExam: new Date(),
    FpDate: new Date(),
    FpTime: new Date(),
    date_ChargeOfSister: new Date(),
    time_ChargeOfSister: new Date(),
  };
  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];
  const fallRiskDropdown = {
    patientAge: [
      { label: t("60 - 69 years"), value: 1 },
      { label: t("70 - 79 years"), value: 2 },
      { label: t("80 years and above"), value: 3 },
    ],

    patientCareEquipment: [
      { label: t("1 Present"), value: 1 },
      { label: t("2 Present"), value: 2 },
      { label: t("3 or more Present"), value: 3 },
    ],

    levelOfConsciousness: [
      { label: t("alert: (oriented x3) or comatose"), value: 1 },
      // { label: "disoriented x1 time", value: 2 },
      { label: t("disoriented x3 at all time"), value: 2 },
    ],

    historyOfFalls: [
      { label: t("No falls in past 3 months"), value: 1 },
      { label: t("1–2 falls in past 3 months"), value: 2 },
      { label: t("3 or more falls in past 3 months"), value: 3 },
    ],

    mobility: [
      { label: t("Ambulatory/continent"), value: 1 },
      { label: t("requires assistance / restraints / supervision"), value: 2 },
      { label: t("Ambulatory/incontinent"), value: 3 },
    ],

    visionStatus: [
      { label: t("adequate (with or without glasses)"), value: 1 },
      { label: t("poor (with or without glasses)"), value: 2 },
      { label: t("legally blind"), value: 3 },
    ],

    gaitBalance: [
      { label: t("GAIT/BALANCE normal"), value: 1 },
      { label: t("balance problem while standing"), value: 2 },
      { label: t("balance problem while walking"), value: 3 },
      { label: t("decreased muscular coordination"), value: 4 },
    ],

    medication: [
      {
        label: t("None of the medications taken currently/within 7 days"),
        value: 1,
      },
      { label: t("Takes 1–2 of these medications in last 7 days"), value: 2 },
      { label: t("Takes 3–4 of these medications in last 7 days"), value: 3 },
      { label: t("Change in medication or dosage in last few days"), value: 4 },
    ],

    predisposingDiseases: [
      { label: t("None Present"), value: 1 },
      { label: t("1-2 Present"), value: 2 },
      { label: t("3 or more Present"), value: 3 },
    ],
  };

  const { GetAllDoctorList } = useSelector((state) => state?.CommonSlice);

  const { VITE_DATE_FORMAT } = import.meta.env;

  const [values, setValues] = useState(initialValue);
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({ ...val, [name]: value }));
  };
  const THEAD = [
    { name: t("S.No"), width: "1%" },
    { name: t("Mobility"), width: "10%" },
    { name: t("MentalState"), width: "10%" },
    { name: t("Toileting"), width: "10%" },
    { name: t("PatientAge"), width: "10%" },
    { name: t("Diagnosis"), width: "10%" },
    { name: t("Gender"), width: "10%" },
    { name: t("Medication"), width: "10%" },
    { name: t("Total"), width: "10%" },
    { name: t("UHID"), width: "10%" },
    { name: t("Date"), width: "10%" },
    { name: t("Time"), width: "10%" },
    { name: t("FpDate"), width: "10%" },
    { name: t("FpTime"), width: "10%" },
    { name: t("Edit"), width: "1%" },
    { name: t("Print"), width: "1%" },
  ];

  const handleReactSelectChange = (name, selected) => {
    setValues((prev) => {
      const updated = { ...prev, [name]: selected };

      const totalScore =
        (updated.PatientAge?.value || 0) +
        (updated.patientCare?.value || 0) +
        (updated.levelOfConsiousness?.value || 0) +
        (updated.HistoryOfFalls?.value || 0) +
        (updated.Mobility?.value || 0) +
        (updated.VisionStatus?.value || 0) +
        (updated.GaitBalance?.value || 0) +
        (updated.Medication?.value || 0) +
        (updated.PreDisposingDiseases?.value || 0);

      updated.total = totalScore;

      return updated;
    });
  };
  const dispatch = useDispatch();
  const handleUpdateAPI = () => {};
  const boolToInt = (field) => {
    const val = typeof field === "object" ? field?.value : field;
    // Convert string or boolean to number 1/0
    if (val === "1" || val === 1 || val === true) return 1;
    if (val === "0" || val === 0 || val === false) return 0;
    return 0;
  };
  const handleSave = async () => {
    const payload = {
      fpDate: values?.FpDate
        ? moment(values.FpDate).format("YYYY-MM-DD")
        : values?.FpDate,
      fpTime: values?.FpTime ? moment(values.FpTime).format("hh:mm A") : null,

      superVision1: values?.superVision1?.value ?? values?.superVision1 ?? 0,
      superVision2: values?.superVision2?.value ?? values?.superVision2 ?? 0,
      superVision3: values?.superVision3?.value ?? values?.superVision3 ?? 0,

      patientRoom1: values?.patientRoom1?.value ?? values?.patientRoom1 ?? 0,
      patientRoom2: values?.patientRoom2?.value ?? values?.patientRoom2 ?? 0,
      patientRoom3: values?.patientRoom3?.value ?? values?.patientRoom3 ?? 0,
      patientRoom4: values?.patientRoom4?.value ?? values?.patientRoom4 ?? 0,
      patientRoom5: values?.patientRoom5?.value ?? values?.patientRoom5 ?? 0,
      patientRoom6: values?.patientRoom6?.value ?? values?.patientRoom6 ?? 0,

      // High Risk Patient Score Section
      hrpS1: values?.hrpS1?.value ?? values?.hrpS1 ?? 0,
      hrpS2: values?.hrpS2?.value ?? values?.hrpS2 ?? 0,
      hrpS3: values?.hrpS3?.value ?? values?.hrpS3 ?? 0,

      // Patient and Family Section
      patientAndFamily1:
        values?.patientAndFamily1?.value ?? values?.patientAndFamily1 ?? 0,
      patientAndFamily2:
        values?.patientAndFamily2?.value ?? values?.patientAndFamily2 ?? 0,
      patientAndFamily3:
        values?.patientAndFamily3?.value ?? values?.patientAndFamily3 ?? 0,
      patientAndFamily4:
        values?.patientAndFamily4?.value ?? values?.patientAndFamily4 ?? 0,

      // Checked By
      checkedBy: values?.checkedBy || "",

      id: values?.id ? values?.id : 0,
      patientId: values?.patientID || "",
      transactionId: values?.transactionID || "",

      // General Falls Risk Assessment (Likely from a previous step)
      toileting: values?.toileting || 0,
      diagnosis: values?.diagnosis || 0,
      gender: values?.gender || 0,
      mentalState: values?.mentalState || 0,

      date: values?.DATE
        ? moment(values?.DATE)?.format("YYYY-MM-DD")
        : values?.DATE || "",
      time: moment(values?.Time)?.format("hh:mm A") || "",
      mobility:
        Number(
          values?.Mobility?.value
            ? values?.Mobility?.value
            : values?.Mobility ?? 0
        ) || 0,
      patientAge:
        Number(
          values?.PatientAge?.value
            ? values?.PatientAge?.value
            : values?.PatientAge ?? 0
        ) || 0,
      medication: values?.Medication?.value
        ? values?.Medication?.value
        : values?.Medication ?? 0,
      predesposingdisease:
        Number(
          values?.PreDisposingDiseases?.value
            ? values?.PreDisposingDiseases?.value
            : values?.PreDisposingDiseases ?? 0
        ) || 0,
      total: values?.total || "0",
      totalFallsRiskScore: values?.totalFallsRiskScore ?? "",
      assessmentBy: values?.AssessmentBy || "",

      // Physical Assessment
      physicalAssessmentExaminationFinding: values?.physicalAssessment || "",
      buttocks: boolToInt(values?.Buttocks) || 0,
      chest: boolToInt(values?.Chest) || 0,
      abdomen: boolToInt(values?.Abdomen) || 0,
      back: boolToInt(values?.Back) || 0,
      shoulder: boolToInt(values?.Shoulder) || 0,
      hand_Arm: boolToInt(values?.HandArm) || 0,
      legs_feetburn: boolToInt(values?.LegsFeetburn) || 0,
      face_head_neck: boolToInt(values?.FaceHeadNeck) || 0,
      groin: boolToInt(values?.Groin) || 0,

      // Injuries
      abrasion: boolToInt(values?.Abrasion) || 0,
      laceration: boolToInt(values?.Laceration) || 0,
      sprain_Strain: boolToInt(values?.SprainStrain) || 0,
      hematoma: boolToInt(values?.Hematoma) || 0,
      fracture: boolToInt(values?.Fracture) || 0,
      other_TOI: boolToInt(values?.OtherTOI) || 0,
      other_TypeOfInjury: values?.OtherTypeOfInjury ?? "",

      // Post Fall Plan / Treatment
      nofollowupindicated: boolToInt(values?.NoFollowUpIndicated) || 0,
      keepUnderObservation: boolToInt(values?.keepUnderObservation) || 0,
      firstAidGiven: boolToInt(values?.FirstAidGiven) || 0,
      painManagement: boolToInt(values?.PainManagement) || 0,
      labordered: boolToInt(values?.Labordered) || 0,
      xray: boolToInt(values?.xray) || 0,
      sultures: boolToInt(values?.Sultures) || 0,
      sultures_PostFallPlan: values?.SulturesPostFallPlan ?? "",
      other_PFP: boolToInt(values?.other_PFP) || 0,
      other_PostFallPlan: values?.other_PostFallPlan ?? "",

      // Doctor Exam
      dateOfExam: values?.DateOfExam
        ? moment(values?.DateOfExam).format("YYYY-MM-DD")
        : "",
      timeOfExam: values?.TimeOfExam
        ? moment(values?.TimeOfExam).format("hh:mm A")
        : "",
      doctorName: values?.Doctor?.value
        ? values?.Doctor?.value
        : values?.Doctor ?? "",

      // Post Fall Root Cause (PRC)
      patientwasnotassess_PRC: boolToInt(values?.patientwasnotassess_PRC) || 0,
      equipwasusedincorretly_PRC:
        boolToInt(values?.equipwasusedincorretly_PRC) || 0,
      patient_PRC: boolToInt(values?.patient_PRC) || 0,
      staff_PRC: boolToInt(values?.staff_PRC) || 0,
      staffneededu_PRC: boolToInt(values?.staffneededu_PRC) || 0,
      restraintusenotmonti_PRC:
        boolToInt(values?.restraintusenotmonti_PRC) || 0,
      stafflackofmisin_PRC: boolToInt(values?.stafflackofmisin_PRC) || 0,
      staffdis_PRC: boolToInt(values?.staffdis_PRC) || 0,
      patcondinotdoc_PRC: boolToInt(values?.patcondinotdoc_PRC) || 0,
      patiecareenviron_PRC: boolToInt(values?.patiecareenviron_PRC) || 0,
      maintenanceprogram_PRC: boolToInt(values?.maintenanceprogram_PRC) || 0,
      workload_PRC: boolToInt(values?.workload_PRC) || 0,
      unitareabusy_PRC: boolToInt(values?.unitareabusy_PRC) || 0,
      changeshift_PRC: boolToInt(values?.changeshift_PRC) || 0,
      actualstaff_PRC: boolToInt(values?.actualstaff_PRC) || 0,
      other_PRC: values?.other_PRC || "",

      // Prevention & Outcomes
      patientfamilyeducation: boolToInt(values?.patientfamilyeducation) || 0,
      staffeducation: boolToInt(values?.staffeducation) || 0,
      nursingcareplanrevised: boolToInt(values?.nursingcareplanrevised) || 0,
      staffingadjust: boolToInt(values?.staffingadjust) || 0,
      biomedengineernotified: boolToInt(values?.biomedengineernotified) || 0,
      fallprevention: boolToInt(values?.fallprevention) || 0,
      other_PreventionMeasure: values?.other_PreventionMeasure || "",
      date_ChargeOfSister: values?.date_ChargeOfSister
        ? moment(values?.date_ChargeOfSister).format("YYYY-MM-DD")
        : "",
      time_ChargeOfSister: values?.time_ChargeOfSister
        ? moment(values?.time_ChargeOfSister).format("hh:mm A")
        : "",
      noInjury: boolToInt(values?.NoInjury) || 0,
      minorInjury: boolToInt(values?.MinorInjury) || 0,
      majorInjury: boolToInt(values?.MajorInjury) || 0,
      death: boolToInt(values?.Death) || 0,
      equipmentReplaced_Repaired:
        boolToInt(values?.equipmentReplaced_Repaired) || 0,
      enhancedSafetyObservation:
        boolToInt(values?.enhancedSafetyObservation) || 0,
      patientCare:
        Number(
          values?.patientCare?.value
            ? values?.patientCare?.value
            : values?.patientCare ?? 0
        ) || 0,
      levelOfConsiousness:
        Number(
          values?.levelOfConsiousness?.value
            ? values?.levelOfConsiousness?.value
            : values?.levelOfConsiousness ?? 0
        ) || 0,
      historyofFalls:
        Number(
          values?.HistoryOfFalls?.value
            ? values?.HistoryOfFalls?.value
            : values?.HistoryOfFalls ?? 0
        ) || 0,
      visionStatus:
        Number(
          values?.VisionStatus?.value
            ? values?.VisionStatus?.value
            : values?.VisionStatus ?? 0
        ) || 0,
      gait_balance:
        Number(
          values?.GaitBalance?.value
            ? values?.GaitBalance?.value
            : values?.GaitBalance ?? 0
        ) || 0,
    };
    debugger;
    const resp = await saveOrUpdateInPatientFallsAssessmentApi(payload);
    if (resp?.success) {
      notify(resp?.message, "success");
      getList();
    } else {
      notify(resp?.message, "error");
    }
  };

  const getList = async () => {
    const res = await getInPatientFallsAssessmentApi(transactionID, patientID);
    console.log(res);
    if (res?.success) {
      setTableData(res?.data);
    } else {
      setTableData([]);
      notify(res?.message, "error");
    }
  };
  console.log(tableData);

  const handlePrint = async (id) => {
    const res = await InPatientFallsAssessmentAndPrecautionReportApi(
      id,
      transactionID
    );
    if (res?.success) {
      RedirectURL(res?.data?.pdfUrl);
    } else {
      notify(res?.message, "error");
    }
  };
  const handleEdit = (row) => {
    // const timeFormateDate = (time) => {
    //     if (typeof time === "string") {
    //         const date = new Date();
    //         if (time) {
    //             const [hours, minutes, period] = time?.match(/(\d+):(\d+)\s*(AM|PM)/i)?.slice(1);
    //             date?.setHours(
    //                 period === "PM" && hours !== "12"
    //                     ? +hours + 12
    //                     : hours === "12" && period === "AM"
    //                         ? 0
    //                         : +hours
    //             );
    //             date?.setMinutes(+minutes);
    //         }
    //         return date;
    //     };
    // }

    const timeFormateDate = (time) => {
      if (!time || typeof time !== "string") return null;

      const date = new Date();

      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        const [h, m, s] = time.split(":").map(Number);
        date.setHours(h);
        date.setMinutes(m);
        date.setSeconds(s);
        return date;
      }

      if (/^\d{2}:\d{2}$/.test(time)) {
        const [h, m] = time.split(":").map(Number);
        date.setHours(h);
        date.setMinutes(m);
        date.setSeconds(0);
        return date;
      }

      const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let [_, hh, mm, period] = match;
        hh = Number(hh);
        mm = Number(mm);
        period = period.toUpperCase();

        if (period === "PM" && hh !== 12) hh += 12;
        if (period === "AM" && hh === 12) hh = 0;

        date.setHours(hh);
        date.setMinutes(mm);
        date.setSeconds(0);
        return date;
      }
      return null;
    };

    setValues({
      // ...values,
      FpDate: row?.FPDate ? new Date(row?.FPDate) : new Date(),
      FpTime: row?.FPTime ? timeFormateDate(row?.FPTime) : new Date(),
      superVision1: row?.SuperVision1,
      superVision2: row?.SuperVision2,
      superVision3: row?.SuperVision3,
      patientRoom1: row?.PatientRoom1,
      patientRoom2: row?.PatientRoom2,
      patientRoom3: row?.PatientRoom3,
      patientRoom4: row?.PatientRoom4,
      patientRoom5: row?.PatientRoom5,
      patientRoom6: row?.PatientRoom6,
      hrpS1: row?.HRPS1,
      hrpS2: row?.HRPS2,
      hrpS3: row?.HRPS3,
      patientAndFamily1: row?.PatientAndFamily1,
      patientAndFamily2: row?.PatientAndFamily2,
      patientAndFamily3: row?.PatientAndFamily3,
      patientAndFamily4: row?.PatientAndFamily4,
      checkedBy: row?.CheckedBy,
      id: row?.ID,
      patientID: row?.PatientID,
      transactionID: row?.TransactionID,
      toileting: row?.Toileting,
      diagnosis: row?.Diagnosis,
      gender: row?.Gender,
      mentalState: row?.MentalState,
      DATE: row?.Date ? new Date(row?.Date) : new Date(),
      Time: row?.Time ? timeFormateDate(row?.Time) : new Date(),
      Mobility: row?.Mobility,
      PatientAge: row?.PatientAge,
      Medication: row?.Medication,
      PreDisposingDiseases: row?.Predesposingdisease,
      total: row?.Total,
      totalFallsRiskScore: row?.TotalFallsRiskScore,
      AssessmentBy: row?.AssessmentBy,
      physicalAssessment: row?.PhysicalAssessmentExaminationFinding,
      Buttocks: row?.Buttocks,
      Chest: row?.Chest,
      Abdomen: row?.Abdomen,
      Back: row?.Back,
      Shoulder: row?.Shoulder,
      HandArm: row?.Hand_Arm,
      LegsFeetburn: row?.Legs_feetburn,
      FaceHeadNeck: row?.face_head_neck,
      Groin: row?.Groin,
      Abrasion: row?.Abrasion,
      Laceration: row?.Laceration,
      SprainStrain: row?.Sprain_Strain,
      Hematoma: row?.Hematoma,
      Fracture: row?.Fracture,
      OtherTOI: row?.Other_TOI,
      OtherTypeOfInjury: row?.Other_TypeOfInjury,
      NoFollowUpIndicated: row?.Nofollowupindicated,
      keepUnderObservation: row?.KeepUnderObservation,
      FirstAidGiven: row?.FirstAidGiven,
      PainManagement: row?.PainManagement,
      Labordered: row?.labordered,
      xray: row?.xray,
      Sultures: row?.Sultures,
      SulturesPostFallPlan: row?.Sultures_PostFallPlan,
      other_PFP: row?.Other_PFP,
      other_PostFallPlan: row?.Other_PostFallPlan,
      DateOfExam: row?.DateofExam ? new Date(row?.DateofExam) : new Date(),
      TimeofExam: row?.TimeofExam
        ? timeFormateDate(row?.TimeofExam)
        : new Date(),
      Doctor: row?.DoctorName,
      patientwasnotassess_PRC: row?.Patientwasnotassess_PRC,
      equipwasusedincorretly_PRC: row?.equipwasusedincorretly_PRC,
      patient_PRC: row?.patient_PRC,
      staff_PRC: row?.staff_PRC,
      staffneededu_PRC: row?.staffneededu_PRC,
      restraintusenotmonti_PRC: row?.restraintusenotmonti_PRC,
      stafflackofmisin_PRC: row?.stafflackofmisin_PRC,
      staffdis_PRC: row?.staffdis_PRC,
      patcondinotdoc_PRC: row?.patcondinotdoc_PRC,
      patiecareenviron_PRC: row?.patiecareenviron_PRC,
      maintenanceprogram_PRC: row?.maintenanceprogram_PRC,
      workload_PRC: row?.workload_PRC,
      unitareabusy_PRC: row?.unitareabusy_PRC,
      changeshift_PRC: row?.changeshift_PRC,
      actualstaff_PRC: row?.actualstaff_PRC,
      other_PRC: row?.Other_PRC,
      patientfamilyeducation: row?.Patientfamilyeducation,
      staffeducation: row?.Staffeducation,
      nursingcareplanrevised: row?.nursingcareplanrevised,
      staffingadjust: row?.staffingadjust,
      biomedengineernotified: row?.biomedengineernotified,
      fallprevention: row?.fallprevention,
      other_PreventionMeasure: row?.Other_PreventionMeasure,
      date_ChargeOfSister: row?.Date_chargeofSister
        ? new Date(row?.Date_chargeofSister)
        : new Date(),
      time_ChargeOfSister: row?.Time_chargeofSister
        ? timeFormateDate(row?.Time_chargeofSister)
        : new Date(),
      NoInjury: row?.NoInjury,
      MinorInjury: row?.MinorInjury,
      MajorInjury: row?.MajorInjury,
      Death: row?.Death,
      equipmentReplaced_Repaired: row?.EquipmentReplaced_Repaired,
      enhancedSafetyObservation: row?.EnhancedSafetyObservation,
      patientCare: row?.PatientCare,
      levelOfConsiousness: row?.LevelOfConsiousness,
      HistoryOfFalls: row?.HistoryofFalls,
      VisionStatus: row?.VisionStatus,
      GaitBalance: row?.Gait_balance ?? 0,
      EmpName: row?.EmpName,
      AssessmentBy1: row?.AssessmentBy1 ?? "",
    });
  };
  console.log(values);

  useEffect(() => {
    dispatch(GetAllDoctor());
    getList();
  }, []);
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("Falls Risk Assessment")} isBreadcrumb={false} />
        <div className="row p-2">
          <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
            <DatePicker
              className={`custom-calendar `}
              respclass="vital-sign-date"
              id="Date"
              name="DATE"
              inputClassName={"required-fields"}
              value={values?.DATE ? values?.DATE : ""}
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
          <ReactSelect
            placeholderName={t("Patient Age")}
            name="PatientAge"
            value={
              values?.PatientAge?.value
                ? values?.PatientAge?.value
                : values?.PatientAge
            }
            handleChange={handleReactSelectChange}
            dynamicOptions={fallRiskDropdown?.patientAge}
            searchable={true}
            id="PatientAge"
            respclass="col-xl-2 col-md-4 col-sm-4 col-12 "
            removeIsClearable={true}
          />

          <ReactSelect
            placeholderName={t(
              "Patient Care equipments(any equipment that tethers a patient e.g. IVI, chest tube, indwelling catheter, dranins...)"
            )}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"patientCare"}
            name="patientCare"
            value={values?.patientCare}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.patientCareEquipment}
            handleChange={handleReactSelectChange}
          />
          <ReactSelect
            placeholderName={t("level Of Consiousness")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"levelOfConsiousness"}
            name="levelOfConsiousness"
            value={values?.levelOfConsiousness}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.levelOfConsciousness}
            handleChange={handleReactSelectChange}
          />
          <ReactSelect
            placeholderName={t("history Of Falls")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"HistoryOfFalls"}
            name="HistoryOfFalls"
            value={values?.HistoryOfFalls}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.historyOfFalls}
            handleChange={handleReactSelectChange}
          />
          <ReactSelect
            placeholderName={t("Mobility")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"Mobility"}
            name="Mobility"
            value={values?.Mobility}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.mobility}
            handleChange={handleReactSelectChange}
          />
          <ReactSelect
            placeholderName={t("Vision Status")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"VisionStatus"}
            name="VisionStatus"
            value={values?.VisionStatus}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.visionStatus}
            handleChange={handleReactSelectChange}
          />
          <ReactSelect
            placeholderName={t("Gait Balance")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"GaitBalance"}
            name="GaitBalance"
            value={values?.GaitBalance}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.gaitBalance}
            handleChange={handleReactSelectChange}
          />
          <ReactSelect
            placeholderName={t("Medication")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"Medication"}
            name="Medication"
            value={values?.Medication}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.medication}
            handleChange={handleReactSelectChange}
          />
          <ReactSelect
            placeholderName={t("pre Desposing Disease")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            id={"PreDisposingDiseases"}
            name="PreDisposingDiseases"
            value={values?.PreDisposingDiseases}
            removeIsClearable={true}
            dynamicOptions={fallRiskDropdown?.predisposingDiseases}
            handleChange={handleReactSelectChange}
          />
          <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
            <LabeledInput
              label={t("total")}
              value={values?.total ? values?.total : ""}
            />
          </div>
          <Input
            type="text"
            className="form-control"
            id="physicalAssessment"
            name="physicalAssessment"
            value={values?.physicalAssessment}
            onChange={handleChange}
            lable={t("physical Assessment Examination Finding")}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            placeholder=""
          />
          <div className="col-12 ">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("Site of Injury")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("Buttocks")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Buttocks"}
                  name="Buttocks"
                  value={String(values?.Buttocks)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Chest")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Chest"}
                  name="Chest"
                  value={String(values?.Chest)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Abdomen")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Abdomen"}
                  name="Abdomen"
                  value={String(values?.Abdomen)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Back")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Back"}
                  name="Back"
                  value={String(values?.Back)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Shoulder")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Shoulder"}
                  name="Shoulder"
                  value={String(values?.Shoulder)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("HandArm")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"HandArm"}
                  name="HandArm"
                  value={String(values?.HandArm)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("legs Feetburn")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"LegsFeetburn"}
                  name="LegsFeetburn"
                  value={String(values?.LegsFeetburn)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("face head neck")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"FaceHeadNeck"}
                  name="FaceHeadNeck"
                  value={String(values?.FaceHeadNeck)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Groin")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Groin"}
                  name="Groin"
                  value={String(values?.Groin)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
              </div>
            </div>
          </div>
          <div className="col-12 ">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("Type of Injury")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("Abrasion")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Abrasion"}
                  name="Abrasion"
                  value={String(values?.Abrasion)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Laceration")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Laceration"}
                  name="Laceration"
                  value={String(values?.Laceration)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Sprain / Strain")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"SprainStrain"}
                  name="SprainStrain"
                  value={String(values?.SprainStrain)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Hematoma")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Hematoma"}
                  name="Hematoma"
                  value={String(values?.Hematoma)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Fracture")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Fracture"}
                  name="Fracture"
                  value={String(values?.Fracture)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Other")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Other"}
                  name="OtherTOI"
                  value={String(values?.OtherTOI)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                {values?.OtherTOI ? (
                  <Input
                    type="text"
                    className="form-control"
                    id="Othertext"
                    name="OtherTypeOfInjury"
                    value={values?.OtherTypeOfInjury}
                    onChange={handleChange}
                    lable={t("physical Assessment Examination Finding")}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    placeholder=""
                  />
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
          <div className="col-12 ">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("Severity")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("No Injury")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"NoInjury"}
                  name="NoInjury"
                  value={String(values?.NoInjury)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Minor Injury")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"MinorInjury"}
                  name="MinorInjury"
                  value={String(values?.MinorInjury)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Major Injury")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"MajorInjury"}
                  name="MajorInjury"
                  value={String(values?.MajorInjury)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Death")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"Death"}
                  name="Death"
                  value={String(values?.Death)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
              </div>
            </div>
          </div>
          <div className="col-12 ">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("Post Fall Plan of Care")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("nofollowupindicated")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"NoFollowUpIndicated"}
                  name="NoFollowUpIndicated"
                  value={String(values?.NoFollowUpIndicated)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("keepUnderObservation")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"keepUnderObservation"}
                  name="keepUnderObservation"
                  value={String(values?.keepUnderObservation)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("firstAidGiven")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"firstAidGiven"}
                  name="FirstAidGiven"
                  value={String(values?.FirstAidGiven)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("painManagement")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"painManagement"}
                  name="PainManagement"
                  value={String(values?.PainManagement)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("labordered")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"labordered"}
                  name="Labordered"
                  value={String(values?.Labordered)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("xray")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"xray"}
                  name="xray"
                  value={String(values?.xray)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("sultures")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"sultures"}
                  name="Sultures"
                  value={String(values?.Sultures)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                {values?.Sultures ? (
                  <Input
                    type="text"
                    className="form-control"
                    id="sultures_PostFallPlan"
                    name="SulturesPostFallPlan"
                    value={values?.SulturesPostFallPlan}
                    onChange={handleChange}
                    lable={t("sultures Post Fall Plan")}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    placeholder=""
                  />
                ) : (
                  ""
                )}
                <ReactSelect
                  placeholderName={t("other_PFP")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"other_PFP"}
                  name="other_PFP"
                  value={String(values?.other_PFP)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                {values?.other_PFP ? (
                  <Input
                    type="text"
                    className="form-control"
                    id="other_PostFallPlan"
                    name="other_PostFallPlan"
                    value={values?.other_PostFallPlan}
                    onChange={handleChange}
                    lable={t("other_PostFallPlan")}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    placeholder=""
                  />
                ) : (
                  ""
                )}
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
                  <DatePicker
                    className={`custom-calendar `}
                    respclass="vital-sign-date mr-1"
                    id="DateOfExam"
                    name="DateOfExam"
                    inputClassName={"required-fields"}
                    value={values?.DateOfExam ? values?.DateOfExam : ""}
                    handleChange={handleChange}
                    lable={t("Date Of Exam")}
                    placeholder={VITE_DATE_FORMAT}
                  />
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("TimeOfExam")}
                    id="TimeOfExam"
                    respclass="vital-sign-date"
                    name="TimeOfExam"
                    value={values?.TimeOfExam ? values?.TimeOfExam : new Date()}
                    // value={new Date(`1970-01-01T00:00:00`)}
                    handleChange={handleChange}
                  />
                </div>
                <ReactSelect
                  placeholderName={t("Doctor")}
                  className="form-control"
                  id={"Doctor"}
                  name="Doctor"
                  dynamicOptions={handleReactSelectDropDownOptions(
                    GetAllDoctorList,
                    "Name",
                    "DoctorID"
                  )}
                  searchable={true}
                  removeIsClearable={true}
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                  // requiredClassName={"required-fields"}
                  value={
                    values?.Doctor?.value
                      ? values?.Doctor?.value
                      : values?.Doctor
                  }
                  handleChange={handleReactSelectChange}
                />
              </div>
            </div>
          </div>

          <div className="col-12 ">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t(
                  "Possible Root Cause(tick all that apply)- To be completed by Charge sister/shift in charge"
                )}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("patientwasnotassess_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientwasnotassess_PRC"}
                  name="patientwasnotassess_PRC"
                  value={String(values?.patientwasnotassess_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />

                <ReactSelect
                  placeholderName={t("equipwasusedincorretly_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"equipwasusedincorretly_PRC"}
                  name="equipwasusedincorretly_PRC"
                  value={String(values?.equipwasusedincorretly_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("patient_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patient_PRC"}
                  name="patient_PRC"
                  value={String(values?.patient_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("staff PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"staff_PRC"}
                  name="staff_PRC"
                  value={String(values?.staff_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("staffneededu PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"staffneededu_PRC"}
                  name="staffneededu_PRC"
                  value={String(values?.staffneededu_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("restraintusenotmonti PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"restraintusenotmonti_PRC"}
                  name="restraintusenotmonti_PRC"
                  value={String(values?.restraintusenotmonti_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("stafflackofmisin PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"stafflackofmisin_PRC"}
                  name="stafflackofmisin_PRC"
                  value={String(values?.stafflackofmisin_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("staffdis_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"staffdis_PRC"}
                  name="staffdis_PRC"
                  value={String(values?.staffdis_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("patcondinotdoc_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patcondinotdoc_PRC"}
                  name="patcondinotdoc_PRC"
                  value={String(values?.patcondinotdoc_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("patiecareenviron_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patiecareenviron_PRC"}
                  name="patiecareenviron_PRC"
                  value={String(values?.patiecareenviron_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("maintenanceprogram_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"maintenanceprogram_PRC"}
                  name="maintenanceprogram_PRC"
                  value={String(values?.maintenanceprogram_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("workload_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"workload_PRC"}
                  name="workload_PRC"
                  value={String(values?.workload_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("unitareabusy_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"unitareabusy_PRC"}
                  name="unitareabusy_PRC"
                  value={String(values?.unitareabusy_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("changeshift_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"changeshift_PRC"}
                  name="changeshift_PRC"
                  value={String(values?.changeshift_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("actualstaff_PRC")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"actualstaff_PRC"}
                  name="actualstaff_PRC"
                  value={String(values?.actualstaff_PRC)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />

                <Input
                  type="text"
                  className="form-control"
                  id="other_PRC"
                  name="other_PRC"
                  value={values?.other_PRC}
                  onChange={handleChange}
                  lable={t("other_PRC")}
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="col-12 ">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t(
                  "Corrective/Preventive measures taken to reduce risk of reoccurrence post fall"
                )}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("patientfamilyeducation")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientfamilyeducation"}
                  name="patientfamilyeducation"
                  value={String(values?.patientfamilyeducation)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("staffeducation")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"staffeducation"}
                  name="staffeducation"
                  value={String(values?.staffeducation)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("nursing care plan revised")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"nursingcareplanrevised"}
                  name="nursingcareplanrevised"
                  value={String(values?.nursingcareplanrevised)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Equipment Replaced/Repaired")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"equipmentReplaced_Repaired"}
                  name="equipmentReplaced_Repaired"
                  value={String(values?.equipmentReplaced_Repaired)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Enhanced Safety observation")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"enhancedSafetyObservation"}
                  name="enhancedSafetyObservation"
                  value={String(values?.enhancedSafetyObservation)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("staffingadjust")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"staffingadjust"}
                  name="staffingadjust"
                  value={String(values?.staffingadjust)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("biomedengineernotified")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"biomedengineernotified"}
                  name="biomedengineernotified"
                  value={String(values?.biomedengineernotified)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("fallprevention")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"fallprevention"}
                  name="fallprevention"
                  value={String(values?.fallprevention)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <Input
                  type="text"
                  className="form-control"
                  id="other_PreventionMeasure"
                  name="other_PreventionMeasure"
                  value={values?.other_PreventionMeasure}
                  onChange={handleChange}
                  lable={t("other_PreventionMeasure")}
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                  placeholder=""
                />
                <DatePicker
                  className={`custom-calendar `}
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                  id="date_ChargeOfSister"
                  name="date_ChargeOfSister"
                  inputClassName={"required-fields"}
                  value={
                    values?.date_ChargeOfSister
                      ? values?.date_ChargeOfSister
                      : ""
                  }
                  handleChange={handleChange}
                  lable={t("date")}
                  placeholder={VITE_DATE_FORMAT}
                />

                <TimePicker
                  placeholderName={t("Time")}
                  lable={t("Time")}
                  id="time_ChargeOfSister"
                  respclass=" col-xl-2 col-md-4 col-sm-6 col-12"
                  name="time_ChargeOfSister"
                  value={
                    values?.time_ChargeOfSister
                      ? values?.time_ChargeOfSister
                      : ""
                  }
                  // value={new Date(`1970-01-01T00:00:00`)}
                  handleChange={handleChange}
                />

                <Input
                  type="text"
                  className="form-control"
                  id="totalFallsRiskScore"
                  name="totalFallsRiskScore"
                  value={values?.totalFallsRiskScore}
                  onChange={handleChange}
                  lable={t("action")}
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                  placeholder=""
                />
                {/* <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                                    <LabeledInput
                                        label={t("Assessment By (Nurse Initials)")}
                                        value={values?.AssessmentBy}
                                    />
                                </div> */}
              </div>
            </div>
          </div>
        </div>
        <Heading title={t("Falls Precautions")} isBreadcrumb={false} />
        <div className="row p-2">
          <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
            <DatePicker
              className={`custom-calendar `}
              respclass="vital-sign-date"
              id="fpDate"
              name="FpDate"
              inputClassName={"required-fields"}
              value={values?.FpDate ? values?.FpDate : ""}
              handleChange={handleChange}
              lable={t("Date")}
              placeholder={VITE_DATE_FORMAT}
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="fpTime"
              respclass="vital-sign-time ml-1"
              name="FpTime"
              value={values?.FpTime}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
          </div>

          <div className="col-12 col-lg-10">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("super Vision")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t(
                    "Patient is under 24 hr care by care taker"
                  )}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"superVision1"}
                  name="superVision1"
                  value={String(values?.superVision1)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Patient is supervised during transfer")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"superVision2"}
                  name="superVision2"
                  value={String(values?.superVision2)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("During Procedure Patient is supervised")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"superVision3"}
                  name="superVision3"
                  value={String(values?.superVision3)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
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
                {t("Patient room")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("Room is free of clutter")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientRoom1"}
                  name="patientRoom1"
                  value={String(values?.patientRoom1)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("cot rails are up")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientRoom2"}
                  name="patientRoom2"
                  value={String(values?.patientRoom2)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Wheeled equipments secured")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientRoom3"}
                  name="patientRoom3"
                  value={String(values?.patientRoom3)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t(
                    "Patient is not left on unsecured bed or high places"
                  )}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientRoom4"}
                  name="patientRoom4"
                  value={String(values?.patientRoom4)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("Room is well fit and obstructions free")}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientRoom5"}
                  name="patientRoom5"
                  value={String(values?.patientRoom5)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t(
                    "Call bells are accessable and functional"
                  )}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  id={"patientRoom6"}
                  name="patientRoom6"
                  value={String(values?.patientRoom6)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-12">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("high risk patients score>=6")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("Room is closed to nurses")}
                  respclass="col-sm-4 col-12"
                  id={"hrpS1"}
                  name="hrpS1"
                  value={String(values?.hrpS1)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t(
                    "yellow identification snap is put on patient's arm band"
                  )}
                  respclass="col-sm-4 col-12"
                  id={"hrpS2"}
                  name="hrpS2"
                  value={String(values?.hrpS2)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t("falls high risk posters has been placed")}
                  respclass="col-sm-4 col-12"
                  id={"hrpS3"}
                  name="hrpS3"
                  value={String(values?.hrpS3)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("Patient and family")}
              </label>
              <div className="row">
                <ReactSelect
                  placeholderName={t("Oriented to room and ward/department")}
                  respclass="col-sm-4 col-12"
                  id={"patientAndFamily1"}
                  name="patientAndFamily1"
                  value={String(values?.patientAndFamily1)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t(
                    "Educated on falls prevention and these falls precaution"
                  )}
                  respclass="col-sm-4 col-12"
                  id={"patientAndFamily2"}
                  name="patientAndFamily2"
                  value={String(values?.patientAndFamily2)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t(
                    "Did Patient experience any fall associated with injury today?(Yes/No) high risk posters has been placed"
                  )}
                  respclass="col-sm-4 col-12"
                  id={"patientAndFamily3"}
                  name="patientAndFamily3"
                  value={String(values?.patientAndFamily3)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                <ReactSelect
                  placeholderName={t(
                    "Q-Pulse SE No if Yes in 4.3(For follow Up)"
                  )}
                  respclass="col-sm-4 col-12"
                  id={"patientAndFamily4"}
                  name="patientAndFamily4"
                  value={String(values?.patientAndFamily4)}
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  handleChange={handleReactSelectChange}
                />
                {/* <div className="col-sm-4 col-sm-4 col-12">
                                    <LabeledInput
                                        label={t("Assessment By (Nurse Initials)")}
                                        value={values?.checkedBy}
                                    />
                                </div> */}
              </div>
            </div>
          </div>
        </div>
        <Heading title={t("Total Score")} isBreadcrumb={false} />
        <div className="row p-2">
          <div className="col-6">
            <LabeledInput
              label={t("(0-5)")}
              value={"Initiate Falls Prevention Precautions"}
            />
          </div>
          <div className="col-6">
            <LabeledInput
              label={t("(6 and Above)")}
              value={
                "Falls high risk patient, initiate falls prevention precautions and in additional put a yellow snap on the patient armband pl risk poster on the patient door and where possible move patient closer to the nurse station"
              }
            />
          </div>
        </div>
        <div className="p-1">
          <button
            className="btn btn-primary"
            type="button"
            style={{ float: "right" }}
            onClick={handleSave}
          >
            {values?.id ? t("Update") : t("Save")}
          </button>
        </div>
        {tableData?.length > 0 ? (
          <>
            <Heading title={t("List")} isBreadcrumb={false} />
            <Tables
              thead={THEAD}
              tbody={tableData?.map((item, index) => ({
                sNo: index + 1,
                Mobility: item?.Mobility,
                MentalState: item?.MentalState,
                Toileting: item?.Toileting,
                PatientAge: item?.PatientAge,
                Diagnosis: item?.Diagnosis,
                Gender: item?.Gender,
                Medication: item?.Medication,
                Total: item?.Total,
                UHID: item?.PatientID,
                Date: moment(item?.Date).format("DD-MM-YYYY"),
                Time: item?.Time,
                FpDate: moment(item?.FPDate)?.format("DD-MM-YYYY"),
                FpTime: item?.FPTime,
                Edit: (
                  <i
                    className="fa fa-edit"
                    aria-hidden="true"
                    onClick={() => {
                      handleEdit(item);
                    }}
                  ></i>
                ),
                print: (
                  <div
                    // className='btn btn-primary'
                    style={{ textAlign: "center", cursor: "pointer" }}
                    onClick={() => handlePrint(item?.ID)}
                  >
                    <ReprintSVG />
                  </div>
                ),
              }))}
              scrollView={true}
            />
          </>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default FallsRiskAssessment;
