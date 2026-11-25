import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import TextAreaInput from "../formComponent/TextAreaInput";
import TimePicker from "../formComponent/TimePicker";
import {
  getNotificationFormDetailsApi,
  saveNotificationApi,
  updateNotificationApi,
} from "../../networkServices/nursingWardAPI";
import moment from "moment";
import { notify, parseApiTime } from "../../utils/utils";

const Notifaction = ({ data }) => {
  const { patientID } = data || {};
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [isEditing, setIsEditing] = useState(false);

  const [payload, setPayload] = useState({
    employeeContactNo: "",
    department: "",
    designation: "",
    dateofIncident: new Date(),
    timeofIncident: "",
    dateOfReporting: new Date(),
    timeofReporting: "",
    locationOfIncident: "",
    superficial: "",
    bleeding: "",
    deep: "",
    glovesPenetratedbysharp: "",
    partofBodyInjured: "",
    bloodstainedFluid: "",
    nonBloodstainedfluid: "",
    unknown: "",
    needlePrick: "",
    mucosalexposure: "",
    detailsoFIncident: "",
    firstAid: "",
    ifYes_Specify: "",
    dutyManager: "",
    dutyManagerDate: "",
    dutyManagerTime: "",
    staffSeening: "",
    staffSeeningDate: new Date(),
    staffSeeningTime: "",
    signatureofEmployee: "",
    signatureDate: "",
    signatureTime: "",
    heptitsBVaccination: "",
    dateVaccination: "",
    monthVaccination: "",
    yearVaccination: "",
    vaccinationbyDoctor: "",
    vaccinationbyDoctorDate: "",
    vaccinationbyDoctorTime: "",
    informationRegarding: "",
    sourcePatientName: "",
    uhid: "",
    patientConsent: "",
    bloodRequest: "",
    bloodObtained: "",
    hivPositive: "",
    hivNegative: "",
    hbvPositive: "",
    hbvNegative: "",
    hcvPositive: "",
    hcvNegative: "",
    levelofExpousere: "",
    postExpousere: "",
    dateExpectedCompletion: "",
    psychologicalsupport: "",
    psychologicalDate: new Date(),
    psychologicalTime: "",
    pepPrescription: "",
    oneMonthPostExposure: "",
    oneMonthPostExposureDate: new Date(),
    threeMonthPostInjury: "",
    sixMonthPostInjury: "",
    sixWeeksDate: "",
    twelveWeeksDate: new Date,
    twntyFourWeeksDate: new Date,
    createdBy: "",
  });

  const [tableDataSaved, setTableDataSaved] = useState([]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleReactSelect = (name, option) => {
    setPayload((prev) => ({ ...prev, [name]: option?.value || "" }));
  };
  const THEAD = [
    { name: t("SNo."), width: "3%" },
    { name: t("UHID") },
    { name: t("Entered By") },
    { name: t("Edit") },
  ];

  const yesNoOptions = [
    { label: t("Yes"), value: 1 },
    { label: t("No"), value: "0" },
  ];

  const handleEdit = (item) => {
    setIsEditing(true);

    setPayload({
      employeeContactNo: item?.EmployeeContactNo ?? "",
      department: item?.Department ?? "",
      designation: item?.Designation ?? "",

      dateofIncident: item?.DateofIncident ? new Date(item.DateofIncident) : "",
      timeofIncident: parseApiTime(item?.TimeofIncident ?? ""),

      dateOfReporting: item?.DateOfReporting
        ? new Date(item.DateOfReporting)
        : "",
      timeofReporting: parseApiTime(item?.TimeofReporting ?? ""),

      locationOfIncident: item?.LocationOfIncident ?? "",

      superficial: item?.Superficial ?? null,
      bleeding: item?.Bleeding ?? null,
      deep: item?.Deep ?? null,
      glovesPenetratedbysharp: item?.GlovesPenetratedbysharp ?? null,
      bloodstainedFluid: item?.BloodstainedFluid ?? null,
      nonBloodstainedfluid: item?.NonBloodstainedfluid ?? null,
      unknown: item?.Unknown ?? null,
      needlePrick: item?.NeedlePrick ?? null,

      partofBodyInjured: item?.PartofBodyInjured ?? "",
      mucosalexposure: item?.Mucosalexposure ?? "",
      detailsoFIncident: item?.DetailsoFIncident ?? "",

      firstAid: item?.FirstAid !== undefined ? Number(item.FirstAid) : null,
      ifYes_Specify: item?.IfYes_Specify ?? "",

      dutyManager:
        item?.DutyManager !== undefined ? Number(item.DutyManager) : null,
      dutyManagerDate: item?.DutyManagerDate
        ? new Date(item.DutyManagerDate)
        : "",
      dutyManagerTime: parseApiTime(item?.DutyManagerTime ?? ""),

      staffSeening:
        item?.StaffSeening !== undefined ? Number(item.StaffSeening) : null,
      staffSeeningDate: item?.StaffSeeningDate
        ? new Date(item.StaffSeeningDate)
        : "",
      staffSeeningTime: parseApiTime(item?.StaffSeeningTime ?? ""),

      signatureofEmployee: item?.SignatureofEmployee ?? "",
      signatureDate: item?.SignatureDate ? new Date(item.SignatureDate) : "",
      signatureTime: parseApiTime(item?.SignatureTime ?? ""),

      heptitsBVaccination: item?.HeptitsBVaccination ?? null,
      dateVaccination: item?.DateVaccination ?? "",
      monthVaccination: item?.MonthVaccination ?? "",
      yearVaccination: item?.YearVaccination ?? "",

      vaccinationbyDoctor:
        item?.VaccinationbyDoctor !== undefined
          ? Number(item.VaccinationbyDoctor)
          : null,
      vaccinationbyDoctorDate: item?.VaccinationbyDoctorDate
        ? new Date(item.VaccinationbyDoctorDate)
        : "",
      vaccinationbyDoctorTime: parseApiTime(
        item?.VaccinationbyDoctorTime ?? ""
      ),

      informationRegarding:
        item?.InformationRegarding !== undefined
          ? Number(item.InformationRegarding)
          : null,

      sourcePatientName: item?.SourcePatientName ?? "",
      uhid: item?.UHID ?? "",

      patientConsent: item?.PatientConsent ?? null,
      bloodRequest:
        item?.BloodRequest !== undefined ? Number(item.BloodRequest) : null,
      bloodObtained:
        item?.BloodObtained !== undefined ? Number(item.BloodObtained) : null,

      hivPositive: item?.HIVPositive ?? null,
      hivNegative: item?.HIVNegative ?? null,
      hbvPositive: item?.HBVPositive ?? null,
      hbvNegative: item?.HBVNegative ?? null,
      hcvPositive: item?.HCVPositive ?? null,
      hcvNegative: item?.HCVNegative ?? null,

      levelofExpousere: item?.LevelofExpousere ?? null,
      postExpousere: item?.PostExpousere ?? null,

      dateExpectedCompletion: item?.DateExpectedCompletion
        ? new Date(item.DateExpectedCompletion)
        : "",

      psychologicalsupport: item?.Psychologicalsupport ?? "",
      psychologicalDate: item?.PsychologicalDate
        ? new Date(item.PsychologicalDate)
        : "",
      psychologicalTime: parseApiTime(item?.PsychologicalTime ?? ""),

      pepPrescription: item?.PEPPrescription ?? "",
      oneMonthPostExposure: item?.OneMonthPostExposure ?? "",
      oneMonthPostExposureDate: item?.OneMonthPostExposureDate
        ? new Date(item.OneMonthPostExposureDate)
        : "",

      threeMonthPostInjury: item?.ThreeMonthPostInjury
        ? new Date(item.ThreeMonthPostInjury)
        : "",
      sixMonthPostInjury: item?.SixMonthPostInjury
        ? new Date(item.SixMonthPostInjury)
        : "",
      sixWeeksDate: item?.SixWeeksDate ? new Date(item.SixWeeksDate) : "",
      twelveWeeksDate: item?.TwelveWeeksDate
        ? new Date(item.TwelveWeeksDate)
        : "",
      twntyFourWeeksDate: item?.TwentyFourWeeksDate
        ? new Date(item.TwentyFourWeeksDate)
        : "",

      createdBy: item?.CreatedBy ?? "",
    });
  };

  const formatDate = (date) => (date ? moment(date).format("YYYY-MM-DD") : "");

  useEffect(() => {
    fetchNotificationForm();
  }, []);

  const fetchNotificationForm = async () => {
    try {
      const response = await getNotificationFormDetailsApi(patientID);

      const apiData = response?.data || [];

      if (apiData.length > 0) {
        setPayload((prev) => ({
          ...prev,
          ...apiData[0],
        }));
      }

      setTableDataSaved(apiData);
    } catch (error) {
      notify(error?.message, "error");
    }
    setTableDataSaved([]);
  };
  const handleSaveAPI = async () => {
    try {
      const savePayload = {
        id: payload.id || 0,
        patientId: patientID,
        transactionId: data?.transactionID || "",

        uhid: payload.uhid || "",
        employeeContactNo: payload.employeeContactNo || "",
        department: payload.department || "",
        designation: payload.designation || "",

        dateofIncident: formatDate(payload.dateofIncident),
        timeofIncident: payload.timeofIncident || "",
        dateOfReporting: formatDate(payload.dateOfReporting),
        timeofReporting: payload.timeofReporting || "",
        locationOfIncident: payload.locationOfIncident || "",
        superficial: payload.superficial || "",
        bleeding: payload.bleeding || "",
        deep: payload.deep || "",
        glovesPenetratedbysharp: payload.glovesPenetratedbysharp || "",
        partofBodyInjured: payload.partofBodyInjured || "",
        bloodstainedFluid: payload.bloodstainedFluid || "",
        nonBloodstainedfluid: payload.nonBloodstainedfluid || "",
        unknown: payload.unknown || "",
        needlePrick: payload.needlePrick || "",
        mucosalexposure: payload.mucosalexposure || "",
        detailsoFIncident: payload.detailsoFIncident || "",
        firstAid: payload.firstAid || "",
        ifYes_Specify: payload.ifYes_Specify || "",

        dutyManager: payload.dutyManager || "",
        dutyManagerDate: formatDate(payload.dutyManagerDate),
        dutyManagerTime: payload.dutyManagerTime || "",
        staffSeening: payload.staffSeening || "",
        staffSeeningDate: formatDate(payload.staffSeeningDate),
        staffSeeningTime: payload.staffSeeningTime || "",
        signatureofEmployee: payload.signatureofEmployee || "",
        signatureDate: formatDate(payload.signatureDate),
        signatureTime: payload.signatureTime || "",

        heptitsBVaccination: payload.heptitsBVaccination || "",
        dateVaccination: payload.dateVaccination || "",
        monthVaccination: payload.monthVaccination || "",
        yearVaccination: payload.yearVaccination || "",
        vaccinationbyDoctor: payload.vaccinationbyDoctor || "",
        vaccinationbyDoctorDate: formatDate(payload.vaccinationbyDoctorDate),
        vaccinationbyDoctorTime: payload.vaccinationbyDoctorTime || "",
        informationRegarding: payload.informationRegarding || "",
        sourcePatientName: payload.sourcePatientName || "",
        patientConsent: payload.patientConsent || "",
        bloodRequest: payload.bloodRequest || "",
        bloodObtained: payload.bloodObtained || "",
        pepPrescription: payload.pepPrescription || "",
        oneMonthPostExposure: payload.oneMonthPostExposure || "",
        oneMonthPostExposureDate: formatDate(payload.oneMonthPostExposureDate),

        hivPositive: payload.hivPositive || "",
        hivNegative: payload.hivNegative || "",
        hbvPositive: payload.hbvPositive || "",
        hbvNegative: payload.hbvNegative || "",
        hcvPositive: payload.hcvPositive || "",
        hcvNegative: payload.hcvNegative || "",

        levelofExpousere: payload.levelofExpousere || "",
        postExpousere: payload.postExpousere || "",
        dateExpectedCompletion: formatDate(payload.dateExpectedCompletion),

        psychologicalsupport: payload.psychologicalsupport || "",
        psychologicalDate: formatDate(payload.psychologicalDate),
        psychologicalTime: payload.psychologicalTime || "",

        threeMonthPostInjury: formatDate(payload.threeMonthPostInjury),
        sixMonthPostInjury: formatDate(payload.sixMonthPostInjury),
        sixWeeksDate: formatDate(payload.sixWeeksDate),
        twelveWeeksDate: formatDate(payload.twelveWeeksDate),
        twntyFourWeeksDate: formatDate(payload.twntyFourWeeksDate),

        createdBy: payload.createdBy || "SYSTEM",
      };

      let response;
      if (isEditing) {
        response = await updateNotificationApi([savePayload]);
      } else {
        response = await saveNotificationApi([savePayload]);
      }

      if (response?.success) {
        notify(response?.message, "success");
        fetchNotificationForm();
        setIsEditing(false);
        setPayload({
          employeeContactNo: "",
          department: "",
          designation: "",
          dateofIncident: "",
          timeofIncident: "",
          dateOfReporting: "",
          timeofReporting: "",
          locationOfIncident: "",
          superficial: "",
          bleeding: "",
          deep: "",
          glovesPenetratedbysharp: "",
          partofBodyInjured: "",
          bloodstainedFluid: "",
          nonBloodstainedfluid: "",
          unknown: "",
          needlePrick: "",
          mucosalexposure: "",
          detailsoFIncident: "",
          firstAid: "",
          ifYes_Specify: "",
          dutyManager: "",
          dutyManagerDate: "",
          dutyManagerTime: "",
          staffSeening: "",
          staffSeeningDate: "",
          staffSeeningTime: "",
          signatureofEmployee: "",
          signatureDate: "",
          signatureTime: "",
          heptitsBVaccination: "",
          dateVaccination: "",
          monthVaccination: "",
          yearVaccination: "",
          vaccinationbyDoctor: "",
          vaccinationbyDoctorDate: "",
          vaccinationbyDoctorTime: "",
          informationRegarding: "",
          sourcePatientName: "",
          uhid: "",
          patientConsent: "",
          bloodRequest: "",
          bloodObtained: "",
          hivPositive: "",
          hivNegative: "",
          hbvPositive: "",
          hbvNegative: "",
          hcvPositive: "",
          hcvNegative: "",
          levelofExpousere: "",
          postExpousere: "",
          dateExpectedCompletion: "",
          psychologicalsupport: "",
          psychologicalDate: "",
          psychologicalTime: "",
          pepPrescription: "",
          oneMonthPostExposure: "",
          oneMonthPostExposureDate: "",
          threeMonthPostInjury: "",
          sixMonthPostInjury: "",
          sixWeeksDate: "",
          twelveWeeksDate: "",
          twntyFourWeeksDate: "",
          createdBy: "",
          id: 0,
        });
      } else {
        notify(response?.message || "Failed to save", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      notify(t("Something went wrong"), "error");
    }
  };

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("Notification Form")} />
        <div className="p-2">
          <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2">
            <Input
              lable={t("Employee")}
              name="employeeContactNo"
              className="form-control"
              id="employeeContactNo"
              placeholder=""
              value={payload.employeeContactNo}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              lable={t("Department")}
              className="form-control"
              name="department"
              id="department"
              placeholder=""
              value={payload.department}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <Input
              lable={t("Designation")}
              className="form-control"
              name="designation"
              id="designation"
              placeholder=""
              value={payload.designation}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <DatePicker
              lable={t("Date / Time of Incident")}
              className="custom-calendar"
              name="dateofIncident"
              id="dateofIncident"
              value={payload.dateofIncident}
              showTime
              hourFormat="12"
              placeholder=""
              handleChange={handleChange}
              respclass="col-xl-2 col-md-5 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName=""
              className="required-fields"
              lable={t("Time Incident")}
              id="timeofIncident"
              name="timeofIncident"
              value={payload?.timeofIncident}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <DatePicker
              lable={t("Date Reporting")}
              className="custom-calendar"
              name="dateOfReporting"
              id="dateOfReporting"
              value={payload.dateOfReporting}
              hourFormat="12"
              placeholder=""
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName=""
              lable={t("Time Reporting")}
              id="timeofReporting"
              name="timeofReporting"
              value={payload?.timeofReporting || ""}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              lable={t("Location Incident")}
              className="form-control"
              name="locationOfIncident"
              id="locationOfIncident"
              placeholder=""
              value={payload.locationOfIncident}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Superficial")}
              name="superficial"
              id="superficial"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.superficial)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Bleeding")}
              searchable={true}
              name="bleeding"
              id="bleeding"
              placeholder=""
              dynamicOptions={yesNoOptions}
              removeIsClearable={true}
              value={yesNoOptions.find((o) => o.value === payload.bleeding)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Deep")}
              searchable={true}
              name="deep"
              id="deep"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.deep)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              lable={t("Gloves Penetrated by Sharp")}
              searchable={true}
              name="glovesPenetratedbysharp"
              id="glovesPenetratedbysharp"
              placeholderName={t("Select")}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.glovesPenetratedbysharp
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              lable={t("Part of Body Injured")}
              className="form-control"
              name="partofBodyInjured"
              placeholder=""
              id="partofBodyInjured"
              value={payload.partofBodyInjured}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Blood Stained Fluid")}
              searchable={true}
              name="bloodstainedFluid"
              id="bloodstainedFluid"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.bloodstainedFluid
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Non Blood Stained Fluid")}
              searchable={true}
              name="nonBloodstainedfluid"
              id="nonBloodstainedfluid"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.nonBloodstainedfluid
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Unknown Exposure")}
              name="unknown"
              id="unknown"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.unknown)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              lable={t("Needle Prick")}
              name="needlePrick"
              id="needlePrick"
              placeholderName={t("Select")}
              dynamicOptions={yesNoOptions}
              removeIsClearable={true}
              value={yesNoOptions.find((o) => o.value === payload.needlePrick)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              lable={t("Mucosal Exposure")}
              className="form-control"
              name="mucosalexposure"
              id="mucosalexposure"
              placeholder=""
              value={payload.mucosalexposure}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <TextAreaInput
              id="detailsoFIncident"
              name="detailsoFIncident"
              lable={t("Details Incident")}
              value={payload.detailsoFIncident}
              rows={3}
              maxLength={500}
              className="form-control"
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("First Measures")}
              name="firstAid"
              id="firstAid"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.firstAid)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              lable={t("If Specify")}
              className="form-control"
              name="ifYes_Specify"
              id="ifYes_Specify"
              value={payload.ifYes_Specify}
              disabled={payload.firstAid !== 1}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Duty Manager Notified")}
              name="dutyManager"
              id="dutyManager"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.dutyManager)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("Duty Manager Date")}
              name="dutyManagerDate"
              value={payload.dutyManagerDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />

            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="dutyManagerTime"
              name="dutyManagerTime"
              value={payload?.dutyManagerTime || ""}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Staff Seening")}
              name="staffSeening"
              id="staffSeening"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.staffSeening)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("Staff SeeningDate")}
              name="staffSeeningDate"
              value={payload.staffSeeningDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <TimePicker
              placeholderName=""
              lable={t("Staff Seening Time")}
              id="staffSeeningTime"
              name="staffSeeningTime"
              value={payload?.staffSeeningTime || ""}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              lable={t("Signature Employee")}
              className="form-control"
              name="signatureofEmployee"
              id="signatureofEmployee"
              placeholder=""
              value={payload.signatureofEmployee}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("Signature Date")}
              name="signatureDate"
              value={payload.signatureDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <TimePicker
              placeholderName=""
              lable={t("Signature Time")}
              id="signatureTime"
              name="signatureTime"
              value={payload?.signatureTime || ""}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Heptits BVaccination")}
              searchable={true}
              name="heptitsBVaccination"
              id="heptitsBVaccination"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.heptitsBVaccination
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              lable={t("Date Vaccination")}
              className="form-control"
              name="dateVaccination"
              id="dateVaccination"
              placeholder=""
              value={payload.dateVaccination}
              disabled={payload.heptitsBVaccination !== 1}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              lable={t("Month Vaccination")}
              className="form-control"
              name="monthVaccination"
              id="monthVaccination"
              placeholder=""
              value={payload.monthVaccination}
              disabled={payload.heptitsBVaccination !== 1}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              lable={t("Year Vaccination")}
              className="form-control"
              name="yearVaccination"
              id="yearVaccination"
              placeholder=""
              value={payload.yearVaccination}
              disabled={payload.heptitsBVaccination !== 1}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Vaccination Doctor")}
              name="vaccinationbyDoctor"
              id="vaccinationbyDoctor"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.vaccinationbyDoctor
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("Vaccination DoctorDate")}
              name="vaccinationbyDoctorDate"
              value={payload.vaccinationbyDoctorDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <TimePicker
              placeholderName=""
              lable={t("Vaccination DoctorTime")}
              id="vaccinationbyDoctorTime"
              name="vaccinationbyDoctorTime"
              value={payload?.vaccinationbyDoctorTime || ""}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Information Regarding")}
              name="informationRegarding"
              id="informationRegarding"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.informationRegarding
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              lable={t("Source PatientName")}
              className="form-control"
              name="sourcePatientName"
              id="sourcePatientName"
              placeholder=""
              value={payload.sourcePatientName}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <Input
              lable={t("UHID")}
              className="form-control"
              name="uhid"
              id="uhid"
              placeholder=""
              value={payload.uhid}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Patient Consent")}
              name="patientConsent"
              id="patientConsent"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.patientConsent
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Blood Request")}
              name="bloodRequest"
              id="bloodRequest"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.bloodRequest)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Blood Obtained")}
              name="bloodObtained"
              id="bloodObtained"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.bloodObtained
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Hiv Positive")}
              name="hivPositive"
              id="hivPositive"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.hivPositive)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Hiv Negative")}
              name="hivNegative"
              id="hivNegative"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.hivNegative)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Hbv Positive")}
              name="hbvPositive"
              id="hbvPositive"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.hbvPositive)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Hbv Negative")}
              name="hbvNegative"
              id="hbvNegative"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.hbvNegative)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Hcv Positive")}
              name="hcvPositive"
              id="hcvPositive"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.hcvPositive)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Hcv Negative")}
              name="hcvNegative"
              id="hcvNegative"
              placeholder=""
              searchable={true}
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find((o) => o.value === payload.hcvNegative)}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Level Expousere")}
              name="levelofExpousere"
              id="levelofExpousere"
              placeholder=""
              searchable={true}
              dynamicOptions={yesNoOptions}
              removeIsClearable={true}
              value={yesNoOptions.find(
                (o) => o.value === payload.levelofExpousere
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Post Expousere")}
              name="postExpousere"
              id="postExpousere"
              placeholder=""
              searchable={true}
              dynamicOptions={yesNoOptions}
              value={yesNoOptions.find(
                (o) => o.value === payload.postExpousere
              )}
              handleChange={handleReactSelect}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              lable={t("Expected Completion")}
              className="form-control"
              name="dateExpectedCompletion"
              id="dateExpectedCompletion"
              placeholder=""
              value={payload.dateExpectedCompletion}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <TextAreaInput
              id="psychologicalsupport"
              name="psychologicalsupport"
              lable={t("sychological support")}
              value={payload.psychologicalsupport}
              rows={3}
              maxLength={500}
              className="form-control"
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />

            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("Psychological Date")}
              name="psychologicalDate"
              value={payload.psychologicalDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Psychological Time")}
              id="psychologicalTime"
              name="psychologicalTime"
              value={payload?.psychologicalTime || ""}
              handleChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <TextAreaInput
              id="pepPrescription"
              name="pepPrescription"
              lable={t("Pep Prescription")}
              value={payload.pepPrescription}
              rows={3}
              maxLength={500}
              className="form-control"
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              lable={t("PostExposure")}
              className="form-control"
              name="oneMonthPostExposure"
              id="oneMonthPostExposure"
              placeholder=""
              value={payload.oneMonthPostExposure}
              onChange={handleChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("PostExposure Date")}
              name="oneMonthPostExposureDate"
              value={payload.oneMonthPostExposureDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("ThreeMonth PostInjury")}
              name="threeMonthPostInjury"
              value={payload.threeMonthPostInjury}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("SixMonth PostInjury")}
              name="sixMonthPostInjury"
              value={payload.sixMonthPostInjury}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("Six WeeksDate")}
              name="sixWeeksDate"
              value={payload.sixWeeksDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("Twelve WeeksDate")}
              name="twelveWeeksDate"
              value={payload.twelveWeeksDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
              className="custom-calendar"
              lable={t("TwntyFour WeeksDate")}
              name="twelveWeeksDate"
              value={payload.twntyFourWeeksDate}
              showTime
              hourFormat="12"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleChange}
            />
          </div>

          <div className="col-12 mt-3 text-end">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={handleSaveAPI}
            >
              {isEditing ? t("Update") : t("Save")}
            </button>

            {/* <button type="button" className="btn btn-primary">
              {t("Print")}
            </button> */}
          </div>

          <div className="row mt-2">
            <div className="col-12">
              <Tables
                thead={THEAD}
                tbody={tableDataSaved?.map((item, index) => ({
                  SNo: index + 1,
                  UHID: item?.PatientId,
                  EnteredBy: item?.EmployeeName,
                  Edit: (
                    <i
                      className="fa fa-edit p-1"
                      style={{ cursor: "pointer", color: "blue" }}
                      onClick={() => handleEdit(item)}
                    />
                  ),
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifaction;
