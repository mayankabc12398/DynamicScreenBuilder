import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import LabeledInput from "../formComponent/LabeledInput";
import moment from "moment";
import Tables from "../UI/customTable";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import { notify } from "../../utils/utils";
import {
  patientAdmissionbindDetailsApi,
  patientAdmissionbindSaveApi,
} from "../../networkServices/nursingWardAPI";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import ReactSelect from "../formComponent/ReactSelect";

const AdmissionRecord = ({ data }) => {
  const { t } = useTranslation();
  const { patientID, transactionID } = data;
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [form, setForm] = useState({
    id: 0,
    transactionID: "",
    patientID: "",
    bedNo: "",
    timeofarrival: "",
    admission: "",
    admissiondiagnosis: "",
    confirmeddiagnosis: "",
    date: new Date(),
    maritalstatus: "",
    nationality: "",
    religion: "",
    mobile: "",
    language: "",
    office: "",
    occupation: "",
    home: "",
    residence: "",
    email: "",
    ministerYes: "",
    ministerNo: "",
    ht: "",
    wt: "",
    bmi: "",
    lmp: "",
    bloodgroup: "",
    allergies: "",
    pward: "",
    proom: "",
    pvip: "",
    ppaed: "",
    name: "",
    relationship: "",
    address: "",
    mobileno: "",
    residencE1: "",
    teloffice: "",
    emaiL1: "",
    homE1: "",
    space: "",
    space1: "",
    adM1: "",
    adM2: "",
    adM3: "",
    adI1: "",
    adI2: "",
    adI3: "",
    ldbanD1: "",
    ldbanD2: "",
    ldbanD3: "",
    ward1: "",
    ward2: "",
    ward3: "",
    urinalysiS1: "",
    urinalysiS2: "",
    urinalysiS3: "",
    allergY1: "",
    allergY2: "",
    allergY3: "",
    admBook1: "",
    admBook2: "",
    admBook3: "",
    medicatioN1: "",
    medicatioN2: "",
    medicatioN3: "",
    investigatioN1: "",
    investigatioN2: "",
    investigatioN3: "",
    menU1: "",
    menU2: "",
    menU3: "",
    patienT1: "",
    patienT2: "",
    patienT3: "",
    valuableS1: "",
    valuableS2: "",
    valuableS3: "",
    comment: "",
  });

  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [checklistState, setChecklistState] = useState({});
  const toApiValue = (v) => (v === 1 ? 1 : 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const admissionChecklist = [
    {
      left: "Admission Form",
      right: "Admitting Doctor Informed",
    },
    {
      left: "ID Band Given",
      right: "Ward Orientation Routine",
    },
    {
      left: "Urinalysis",
      right: "Allergy Form Filled",
    },
    {
      left: "Admission Book Entry",
      right: "Medication Commenced",
    },
    {
      left: "Investigation Commenced",
      right: "Menu Filled",
    },
    {
      left: "Patient relatives informed of NHIF, insurance letters etc",
      right: "Valuables Forms Filled",
    },
  ];

  const THEADS = [
    { name: t("Admission Checklist (If No Please Comment)") },
    { name: t("Yes") },
    { name: t("No") },
    { name: "N/A" },
    {
      name: (
        <Input
          className="form-control"
          placeholder={t("Comment")}
          name="space"
          value={form.space}
          onChange={handleChange}
        />
      ),
    },

    { name: t("Checklist Right") },
    { name: t("Yes") },
    { name: t("No") },
    { name: "N/A" },

    {
      name: (
        <Input
          className="form-control"
          placeholder={t("Comment")}
          name="space1"
          value={form.space1}
          onChange={handleChange}
        />
      ),
    },
  ];

  const yesNoOptions = [
    { label: t("Yes"), value: 1 },
    { label: t("No"), value: 0 },
  ];
  const mapChecklistFromApi = (item) => ({
    "0_left_yes": item.ADM1 ?? 0,
    "0_left_no": item.ADM2 ?? 0,
    "0_left_na": item.ADM3 ?? 0,

    "0_right_yes": item.ADI1 ?? 0,
    "0_right_no": item.ADI2 ?? 0,
    "0_right_na": item.ADI3 ?? 0,
  });

  const handleSelect = (name, val) => {
    setForm((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const handleChecklistChange = (key, checked) => {
    setChecklistState((prev) => ({
      ...prev,
      [key]: checked ? 1 : 0,
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        patientId: patientID || "",
        transactionId: transactionID || "",
        id: form.id || "",

        bedNo: form.bedNo || "",
        timeofarrival: form.timeofarrival || "",
        admission: form.admission
          ? moment(form.admission).format("YYYY-MM-DD")
          : "",
        admissiondiagnosis: form.admissiondiagnosis || "",
        confirmeddiagnosis: form.confirmeddiagnosis || "",
        date: form.date ? moment(form.date).format("YYYY-MM-DD") : "",

        maritalstatus: form.maritalstatus || "",
        nationality: form.nationality || "",
        religion: form.religion || "",
        mobile: form.mobile || "",
        language: form.language || "",
        office: form.office || "",
        occupation: form.occupation || "",
        home: form.home || "",
        residence: form.residence || "",
        email: form.email || "",

        ministerYes: form.ministerYes || "",
        ministerNo: form.ministerNo || "",

        ht: form.ht || "",
        wt: form.wt || "",
        bmi: form.bmi || "",
        lmp: form.lmp || "",
        bloodgroup: form.bloodgroup || "",
        allergies: form.allergies || "",

        pward: form.pward || "",
        proom: form.proom || "",
        pvip: form.pvip || "",
        ppaed: form.ppaed || "",

        name: form.name || "",
        relationship: form.relationship || "",
        address: form.address || "",
        mobileno: form.mobileno || "",
        residencE1: form.residencE1 || "",
        teloffice: form.teloffice || "",
        emaiL1: form.emaiL1 || "",
        homE1: form.homE1 || "",

        space: form.space || "",
        space1: form.space1 || "",

        adM1: checklistState["0_left_yes"] ?? 0,
        adM2: checklistState["0_left_no"] ?? 0,
        adM3: checklistState["0_left_na"] ?? 0,

        ldbanD1: checklistState["1_left_yes"] ?? 0,
        ldbanD2: checklistState["1_left_no"] ?? 0,
        ldbanD3: checklistState["1_left_na"] ?? 0,

        urinalysiS1: checklistState["2_left_yes"] ?? 0,
        urinalysiS2: checklistState["2_left_no"] ?? 0,
        urinalysiS3: checklistState["2_left_na"] ?? 0,

        admBook1: checklistState["3_left_yes"] ?? 0,
        admBook2: checklistState["3_left_no"] ?? 0,
        admBook3: checklistState["3_left_na"] ?? 0,

        investigatioN1: checklistState["4_left_yes"] ?? 0,
        investigatioN2: checklistState["4_left_no"] ?? 0,
        investigatioN3: checklistState["4_left_na"] ?? 0,

        patienT1: checklistState["5_left_yes"] ?? 0,
        patienT2: checklistState["5_left_no"] ?? 0,
        patienT3: checklistState["5_left_na"] ?? 0,

        adI1: checklistState["0_right_yes"] ?? 0,
        adI2: checklistState["0_right_no"] ?? 0,
        adI3: checklistState["0_right_na"] ?? 0,

        ward1: checklistState["1_right_yes"] ?? 0,
        ward2: checklistState["1_right_no"] ?? 0,
        ward3: checklistState["1_right_na"] ?? 0,

        allergY1: checklistState["2_right_yes"] ?? 0,
        allergY2: checklistState["2_right_no"] ?? 0,
        allergY3: checklistState["2_right_na"] ?? 0,

        medicatioN1: checklistState["3_right_yes"] ?? 0,
        medicatioN2: checklistState["3_right_no"] ?? 0,
        medicatioN3: checklistState["3_right_na"] ?? 0,

        menU1: checklistState["4_right_yes"] ?? 0,
        menU2: checklistState["4_right_no"] ?? 0,
        menU3: checklistState["4_right_na"] ?? 0,

        valuableS1: checklistState["5_right_yes"] ?? 0,
        valuableS2: checklistState["5_right_no"] ?? 0,
        valuableS3: checklistState["5_right_na"] ?? 0,

        comment: form.comment || "",
      };

      const response = await patientAdmissionbindSaveApi(payload);

      // Reset form & checklist
      setForm({
        id: 0,
        transactionID: "",
        patientID: "",
        bedNo: "",
        timeofarrival: "",
        admission: "",
        admissiondiagnosis: "",
        confirmeddiagnosis: "",
        date: new Date(),
        maritalstatus: "",
        nationality: "",
        religion: "",
        mobile: "",
        language: "",
        office: "",
        occupation: "",
        home: "",
        residence: "",
        email: "",
        ministerYes: "",
        ministerNo: "",
        ht: "",
        wt: "",
        bmi: "",
        lmp: "",
        bloodgroup: "",
        allergies: "",
        pward: "",
        proom: "",
        pvip: "",
        ppaed: "",
        name: "",
        relationship: "",
        address: "",
        mobileno: "",
        residencE1: "",
        teloffice: "",
        emaiL1: "",
        homE1: "",
        space: "",
        space1: "",
        adM1: 0,
        adM2: 0,
        adM3: 0,
        adI1: 0,
        adI2: 0,
        adI3: 0,
        ldbanD1: 0,
        ldbanD2: 0,
        ldbanD3: 0,
        ward1: 0,
        ward2: 0,
        ward3: 0,
        urinalysiS1: 0,
        urinalysiS2: 0,
        urinalysiS3: 0,
        allergY1: 0,
        allergY2: 0,
        allergY3: 0,
        admBook1: 0,
        admBook2: 0,
        admBook3: 0,
        medicatioN1: 0,
        medicatioN2: 0,
        medicatioN3: 0,
        investigatioN1: 0,
        investigatioN2: 0,
        investigatioN3: 0,
        menU1: 0,
        menU2: 0,
        menU3: 0,
        patienT1: 0,
        patienT2: 0,
        patienT3: 0,
        valuableS1: 0,
        valuableS2: 0,
        valuableS3: 0,
        comment: "",
      });

      setChecklistState({});
      fetchData();

      if (response?.success) {
        notify(response?.message || "Saved successfully", "success");
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      console.error("SAVE ERROR:", error);
      notify(t("Something went wrong"), "error");
    }
  };

  const handleEdit = (item) => {
    debugger;
    setIsEdit(true);
    setForm({
      id: item.ID,
      patientID: item.patientID,
      transactionID: item.transactionID,

      bedNo: item.BedNo || "",
      timeofarrival: item.TIMEOFARRIVAL || "",
      admission: item.ADMISSION ? new Date(item.ADMISSION) : "",
      admissiondiagnosis: item.ADMISSIONDIAGNOSIS || "",
      confirmeddiagnosis: item.CONFIRMEDDIAGNOSIS || "",
      date: item.DATE ? new Date(item.DATE) : new Date(),
      maritalstatus: item.MARITALSTATUS || "",
      nationality: item.NATIONALITY || "",
      religion: item.RELIGION || "",
      mobile: item.MOBILE || "",
      language: item.LANGUAGE || "",
      office: item.OFFICE || "",
      occupation: item.OCCUPATION || "",
      home: item.HOME || "",
      residence: item.RESIDENCE || "",
      email: item.EMAIL || "",
      ministerYes: item?.MinisterYes,
      ministerNo: item?.MinisterNo,
      ht: item.HT || "",
      wt: item.WT || "",
      bmi: item.BMI || "",
      lmp: item.LMP || "",
      bloodgroup: item.BLOODGROUP || "",
      allergies: item.ALLERGIES || "",
      pward: item?.PWARD,
      proom: item?.PROOM,
      pvip: item?.PVIP,
      ppaed: item?.PPAED,
      name: item.NAME || "",
      relationship: item.RELATIONSHIP || "",
      address: item.ADDRESS || "",
      mobileno: item.MOBILENO || "",
      residencE1: item.RESIDENCE1 || "",
      teloffice: item.TELOFFICE || "",
      emaiL1: item.EMAIL1 || "",
      homE1: item.HOME1 || "",
      comment: item.COMMENT || "",
      space: item.Space || "",
      space1: item.Space1 || "",
    });
    setChecklistState(mapChecklistFromApi(item));
  };

  const fetchData = async () => {
    const res = await patientAdmissionbindDetailsApi(transactionID);

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

  const THEAD = [
    { name: t("S.No."), width: "4%" },
    { name: t("PatientID") },
    { name: t("CreatedBy") },
    { name: t("CreatedDatetime") },
    { name: t("Edit") },
    // { name: t("Print") },
  ];

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("Admission Record Form")} />
        <div className="row row-cols-lg-6 row-cols-md-3 row-cols-1 p-2">
          <Input
            type="number"
            lable={t("BED ROOM NO.")}
            name="bedNo"
            className="form-control"
            id="bedNo"
            placeholder=""
            value={form.bedNo}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("TIME OF ARRIVAL OF WARD")}
            name="timeofarrival"
            className="form-control"
            id="timeofarrival"
            placeholder=""
            value={form.timeofarrival}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <DatePicker
            placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
            name="admission"
            className="custom-calendar"
            lable={t("DATE OF ADMISSION")}
            value={form.admission}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <Input
            lable={t("Admission Diagnosis")}
            name="admissiondiagnosis"
            className="form-control"
            id="admissiondiagnosis"
            placeholder=""
            value={form.admissiondiagnosis}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Confirmed Diagnosis")}
            name="confirmeddiagnosis"
            className="form-control"
            id="confirmeddiagnosis"
            placeholder=""
            value={form.confirmeddiagnosis}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <DatePicker
            placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
            name="date"
            id="date"
            className="custom-calendar"
            lable={t("Date")}
            value={form.date}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <Input
            lable={t("Marital Status")}
            name="maritalstatus"
            className="form-control"
            id="maritalstatus"
            placeholder=""
            value={form.maritalstatus}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Nationality")}
            name="nationality"
            className="form-control"
            id="nationality"
            placeholder=""
            value={form.nationality}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Religion")}
            name="religion"
            className="form-control"
            id="religion"
            placeholder=""
            value={form.religion}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            type="number"
            lable={t("Mobile")}
            name="mobile"
            className="form-control"
            id="mobile"
            placeholder=""
            value={form.mobile}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Language")}
            name="language"
            className="form-control"
            id="language"
            placeholder=""
            value={form.language}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Office")}
            name="office"
            className="form-control"
            id="office"
            placeholder=""
            value={form.office}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Occupation")}
            name="occupation"
            className="form-control"
            id="occupation"
            placeholder=""
            value={form.occupation}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Home")}
            id="home"
            name="home"
            placeholder=""
            value={form?.home}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Residence")}
            id="residence"
            name="residence"
            placeholder=""
            value={form?.residence}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Email")}
            id="email"
            name="email"
            placeholder=""
            value={form?.email}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <ReactSelect
            placeholderName={t(
              "Do you want a Minister/Prist to visit during this hospitalization Yes"
            )}
            name="ministerYes"
            dynamicOptions={yesNoOptions}
            value={form.ministerYes}
            handleChange={handleSelect}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-12"
          />

          <ReactSelect
            placeholderName={t(
              "Do you want a Minister/Prist to visit during this hospitalization No"
            )}
            name="ministerNo"
            dynamicOptions={yesNoOptions}
            value={form.ministerNo}
            handleChange={handleSelect}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            lable={t("HT")}
            id="ht"
            name="ht"
            placeholder=""
            value={form?.ht}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />
          <Input
            type="text"
            className="form-control"
            lable={t("WT")}
            id="wt"
            name="wt"
            placeholder=""
            value={form?.wt}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Bmi")}
            id="bmi"
            name="bmi"
            placeholder=""
            value={form?.bmi}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Lmp")}
            id="lmp"
            name="lmp"
            placeholder=""
            value={form?.lmp}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <ReactSelect
            placeholderName={t("Blood Group")}
            name="bloodgroup"
            dynamicOptions={yesNoOptions}
            value={form.bloodgroup}
            handleChange={handleSelect}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-12"
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Allergies")}
            id="allergies"
            name="allergies"
            placeholder=""
            value={form?.allergies}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <ReactSelect
            placeholderName={t("P Ward")}
            name="pward"
            dynamicOptions={yesNoOptions}
            value={form.pward}
            handleChange={handleSelect}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-12"
          />

          <ReactSelect
            placeholderName={t("P Room")}
            name="proom"
            dynamicOptions={yesNoOptions}
            value={form.proom}
            handleChange={handleSelect}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <ReactSelect
            placeholderName={t("P Vip")}
            name="pvip"
            dynamicOptions={yesNoOptions}
            value={form.pvip}
            handleChange={handleSelect}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <ReactSelect
            placeholderName={t("P Paed")}
            name="ppaed"
            dynamicOptions={yesNoOptions}
            value={form.ppaed}
            handleChange={handleSelect}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-12"
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Relationship")}
            id="relationship"
            name="relationship"
            placeholder=""
            value={form?.relationship}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Address")}
            id="address"
            name="address"
            placeholder=""
            value={form?.address}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Mobile No")}
            id="mobileno"
            name="mobileno"
            placeholder=""
            value={form?.mobileno}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Residenc E1")}
            id="residencE1"
            name="residencE1"
            placeholder=""
            value={form?.residencE1}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Tel Office")}
            id="teloffice"
            name="teloffice"
            placeholder=""
            value={form?.teloffice}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("EmaiL1")}
            id="emaiL1"
            name="emaiL1"
            placeholder=""
            value={form?.emaiL1}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />

          <Input
            type="text"
            className="form-control"
            lable={t("HomE1")}
            id="homE1"
            name="homE1"
            placeholder=""
            value={form?.homE1}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 com-sm-4 col-12  "
          />
        </div>
        <Tables
          thead={THEADS}
          tbody={admissionChecklist.map((row, index) => {
            const leftValue = checklistState[`${index}_left`];
            const rightValue = checklistState[`${index}_right`];

            return {
              leftLabel: row.left,

              leftYes: (
                <input
                  type="checkbox"
                  checked={checklistState[`${index}_left_yes`] === 1}
                  onChange={(e) =>
                    handleChecklistChange(`${index}_left_yes`, e.target.checked)
                  }
                />
              ),

              leftNo: (
                <input
                  type="checkbox"
                  checked={checklistState[`${index}_left_no`] === 1}
                  onChange={(e) =>
                    handleChecklistChange(`${index}_left_no`, e.target.checked)
                  }
                />
              ),

              leftNA: (
                <input
                  type="checkbox"
                  checked={checklistState[`${index}_left_na`] === 1}
                  onChange={(e) =>
                    handleChecklistChange(`${index}_left_na`, e.target.checked)
                  }
                />
              ),

              leftComment: null,

              rightLabel: row.right,

              rightYes: (
                <input
                  type="checkbox"
                  checked={checklistState[`${index}_right_yes`] === 1}
                  onChange={(e) =>
                    handleChecklistChange(
                      `${index}_right_yes`,
                      e.target.checked
                    )
                  }
                />
              ),

              rightNo: (
                <input
                  type="checkbox"
                  checked={checklistState[`${index}_right_no`] === 1}
                  onChange={(e) =>
                    handleChecklistChange(`${index}_right_no`, e.target.checked)
                  }
                />
              ),

              rightNA: (
                <input
                  type="checkbox"
                  checked={checklistState[`${index}_right_na`] === 1}
                  onChange={(e) =>
                    handleChecklistChange(`${index}_right_na`, e.target.checked)
                  }
                />
              ),

              rightComment: null,
            };
          })}
        />

        <div className="col-12 mt-3">
          <TextAreaInput
            className="form-textarea"
            lable={t("Comment")}
            id="comment"
            name="comment"
            value={form.comment}
            onChange={handleChange}
          />
        </div>
        <div className="col-12 d-flex justify-content-end mb-2">
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? t("Update") : t("Save")}
          </button>
        </div>
        <Heading title={t(History)} />
        {tableData.length > 0 && (
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              "S.No.": index + 1,
              PatientID: item?.patientID || "",
              CreatedBy: item?.CreatedBy || "",
              CreatedDatetime: item?.CreatedDatetime || "",
              Edit: (
                <i
                  className="fa fa-edit text-primary"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(item)}
                />
              ),
              // Print: (
              //   <i
              //     className="fa fa-print text-success"
              //     style={{ cursor: "pointer" }}
              //   />
              // ),
            }))}
          />
        )}
      </div>
    </div>
  );
};

export default AdmissionRecord;
