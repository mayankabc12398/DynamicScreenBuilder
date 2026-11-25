import React, { useEffect, useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import { RedirectURL } from "../../networkServices/PDFURL";
import {
  EmergencyCertificatePrintAPI,
  ERInitialAssessmentPrintAPI,
  GetERInitialAssessmentByIDAPI,
  SaveERInitialAssessmentAPI,
  SearchERInitialAssessmentAPI,
  UpdateERInitialAssessmentAPI,
} from "../../networkServices/erInitialAssessmentAPI";
import CustomTooltip from "../formComponent/CustomTooltip";
/* ------------------------------------------------------------------ *
 *  Static option lists (as printed on SJMSSH/COP/IA/2024/70 form)
 * ------------------------------------------------------------------ */
const DDLTriagePriority = [
  { label: "Red", value: "R" },
  { label: "Yellow", value: "Y" },
  { label: "Green", value: "G" },
];

const DDLVisitType = [
  { label: "ER", value: "ER" },
  { label: "OP", value: "OP" },
];

const DDLGender = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
];

const DDLArrivalType = [
  { label: "Walk in", value: "Walk in" },
  { label: "Referred by Dr.", value: "Referred by Dr." },
  { label: "Referred by Relatives / Friends", value: "Referred by Relatives / Friends" },
  { label: "Follow up case of Dr.", value: "Follow up case of Dr." },
  { label: "Brought by Ambulance", value: "Brought by Ambulance" },
  { label: "EMT / Out side Ambulance", value: "EMT / Out side Ambulance" },
];

const DDLYesNo = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const DDLAirwayAssessment = [
  { label: "Patent", value: "Patent" },
  { label: "Protected", value: "Protected" },
  { label: "Maintained", value: "Maintained" },
  { label: "Compromised", value: "Compromised" },
];

const DDLAirwayManagement = [
  { label: "Positioning", value: "Positioning" },
  { label: "HTCL", value: "HTCL" },
  { label: "JT", value: "JT" },
  { label: "OPA / NPA", value: "OPA/NPA" },
];

const DDLO2Device = [
  { label: "Nasal Prong", value: "Nasal Prong" },
  { label: "Mask", value: "Mask" },
  { label: "HFNM", value: "HFNM" },
  { label: "AMBU", value: "AMBU" },
];

const DDLEyeOpening = [
  { label: "None (1)", value: "1" },
  { label: "To Pressure (2)", value: "2" },
  { label: "To Speech (3)", value: "3" },
  { label: "Spontaneous (4)", value: "4" },
];

const DDLVerbalResponse = [
  { label: "None (1)", value: "1" },
  { label: "Sounds (2)", value: "2" },
  { label: "Words (3)", value: "3" },
  { label: "Confused (4)", value: "4" },
  { label: "Oriented (5)", value: "5" },
];

const DDLMotorResponse = [
  { label: "None (1)", value: "1" },
  { label: "Extension (2)", value: "2" },
  { label: "Abnormal Flexion (3)", value: "3" },
  { label: "Normal Flexion (4)", value: "4" },
  { label: "Localizing (5)", value: "5" },
  { label: "Obeying Commands (6)", value: "6" },
];

const DDLAVPU = [
  { label: "Alert", value: "A" },
  { label: "Verbal", value: "V" },
  { label: "Pain", value: "P" },
  { label: "Unresponsive", value: "U" },
];

const DDLPainScore = [0, 2, 4, 6, 8, 10].map((item) => ({
  label: String(item),
  value: String(item),
}));

const DDLRoute = ["PO", "IM", "IV", "SC"].map((item) => ({
  label: item,
  value: item,
}));

const DDLEventType = [
  { label: "Blunt (Motor Vehicle / Pedestrian / Fall / Crush)", value: "Blunt" },
  { label: "Penetrating (Gunshot / Shotgun / Stab)", value: "Penetrating" },
  {
    label: "Environmental (Burn / Cold / Chemical / Radiological / Biological)",
    value: "Environmental",
  },
  { label: "Primary Pressure Wave (Blast)", value: "Primary Pressure Wave" },
  { label: "Explosions", value: "Explosions" },
  { label: "Assault", value: "Assault" },
  { label: "Others", value: "Others" },
];

/* ------------------------------------------------------------------ *
 *  Table headers
 * ------------------------------------------------------------------ */
const MEDICATION_THEAD = ["S.No", "Drug", "Dose", "Route", "Doctor", "Time", "Remark", "Action"];
const TREATMENT_THEAD = ["S.No", "Drug", "Dose", "Route", "Doctor", "Time", "Action"];
const PROCEDURE_THEAD = ["S.No", "Procedure Name", "Time", "Done By", "Notes", "Action"];
const CONSULTATION_THEAD = ["S.No", "Speciality", "Consultant Name", "Time", "Informed By", "Opinion", "Action"];
const RECORD_THEAD = [
  { name: ("S.No"), width: "5%" },
  { name: ("Date"), width: "10%" },
  { name: ("Time"), width: "8%" },
  { name: ("Triage"), width: "10%" },
  { name: ("UHID"), width: "10%" },
  { name: ("Patient Name"), width: "15%" },
  { name: ("Working Diagnosis"), width: "15%", },
  { name: ("Entry By"), width: "12%" },
  { name: ("Action"), width: "10%" },
];

/* ------------------------------------------------------------------ *
 *  Initial states
 * ------------------------------------------------------------------ */
const initialValue = {
  id: "",
  /* i) Demographics */
  visitType: "ER",
  triagePriority: "",
  uhidNo: "",
  patientName: "",
  age: "",
  gender: "",
  bodyWeight: "",
  erBedNo: "",
  arrivalDate: new Date(),
  arrivalTime: new Date(),
  assessmentTime: new Date(),
  mlcNo: "",
  arrivalType: "",
  referredByDoctor: "",
  broughtBy: "",
  previousAdmission: "No",
  /* ii) Presenting complaints */
  presentingComplaints: "",
  /* iii) Primary survey */
  airwayAssessment: "",
  airwayManagement: "",
  pulse: "",
  bpSystolic: "",
  bpDiastolic: "",
  peripheralPulses: "",
  temperature: "",
  respiratoryRate: "",
  isLaboured: "0",
  spo2OnRA: "",
  spo2OnO2: "",
  o2Device: "",
  o2FlowRate: "",
  cardiacMonitor: "",
  grbs: "",
  avpu: "",
  pupils: "",
  painScore: "",
  /* iv) Glasgow Coma Scale */
  eyeOpening: "",
  verbalResponse: "",
  motorResponse: "",
  gcsTotal: "",
  /* v) Secondary survey */
  heent: "",
  chest: "",
  cvs: "",
  abd: "",
  neuro: "",
  pelvis: "",
  extremities: "",
  secondaryOthers: "",
  /* v-a) Allergies */
  isAllergy: "No",
  allergyDetail: "",
  /* v-p) Past history */
  pastHistory: "",
  /* v-e) Events / Environment */
  eventType: "",
  eventDetail: "",
  /* vi) Working diagnosis */
  workingDiagnosis: "",
  /* vii) Investigations */
  investigations: "",
};

const initialMedication = {
  drug: "",
  dose: "",
  route: "",
  doctor: "",
  time: new Date(),
  remark: "",
};

const initialTreatment = {
  drug: "",
  dose: "",
  route: "",
  doctor: "",
  time: new Date(),
};

const initialProcedure = {
  procedureName: "",
  time: new Date(),
  doneBy: "",
  notes: "",
};

const initialConsultation = {
  speciality: "",
  consultantName: "",
  time: new Date(),
  informedBy: "",
  opinion: "",
};

const ERInitialAssessmentTreatment = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();

  const { transactionID, patientID, pName, age, ageSex } = data || {};

  /* Patient demographics come from the frame-menu patient context, exactly as
     PersonalDetailsOfPatient binds them. ageSex is "45 / Male". */
  const patientDetail = {
    uhidNo: patientID ?? "",
    patientName: pName ?? "",
    age: age ?? String(ageSex ?? "").split(" / ")[0] ?? "",
    gender: String(ageSex ?? "").split(" / ")[1]?.charAt(0)?.toUpperCase() ?? "",
  };

  const [payload, setPayload] = useState({ ...initialValue, ...patientDetail });
  const [medication, setMedication] = useState({ ...initialMedication });
  const [treatment, setTreatment] = useState({ ...initialTreatment });
  const [procedure, setProcedure] = useState({ ...initialProcedure });
  const [consultation, setConsultation] = useState({ ...initialConsultation });

  const [medicationList, setMedicationList] = useState([]);
  const [treatmentList, setTreatmentList] = useState([]);
  const [procedureList, setProcedureList] = useState([]);
  const [consultationList, setConsultationList] = useState([]);

  const [tableData, setTableData] = useState([]);

  /* ---------------------------- handlers ---------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckChange = (e) => {
    const { name, checked } = e.target;
    setPayload((prev) => ({ ...prev, [name]: checked ? "1" : "0" }));
  };

  const handleReactSelect = (name, e) => {
    setPayload((prev) => ({ ...prev, [name]: e?.value ?? "" }));
  };

  const handleGCSChange = (name, e) => {
    setPayload((prev) => {
      const updated = { ...prev, [name]: e?.value ?? "" };
      const total =
        Number(updated.eyeOpening || 0) +
        Number(updated.verbalResponse || 0) +
        Number(updated.motorResponse || 0);
      return { ...updated, gcsTotal: total ? String(total) : "" };
    });
  };

  const handleRowChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowSelect = (setter) => (name, e) => {
    setter((prev) => ({ ...prev, [name]: e?.value ?? "" }));
  };

  const handleAddRow = (row, requiredField, list, setList, setRow, initial) => {
    if (!row?.[requiredField]) {
      notify(t("Please fill the required detail"), "error");
      return;
    }
    setList([...list, row]);
    setRow({ ...initial });
  };

  const handleRemoveRow = (index, list, setList) => {
    setList(list.filter((_, rowIndex) => rowIndex !== index));
  };

  /* ------------------------------ APIs ------------------------------ */
  const buildPayload = () => ({
    id: payload?.id ? String(payload?.id) : "0",
    tid: String(transactionID ?? ""),
    pid: String(patientID ?? ""),
    data: [
      {
        ...payload,
        arrivalDate: moment(payload?.arrivalDate).format("DD-MMM-YYYY"),
        arrivalTime: moment(payload?.arrivalTime).format("hh:mm A"),
        assessmentTime: moment(payload?.assessmentTime).format("hh:mm A"),
      },
    ],
    medication: medicationList?.map((item) => ({
      ...item,
      time: moment(item?.time).format("hh:mm A"),
    })),
    treatment: treatmentList?.map((item) => ({
      ...item,
      time: moment(item?.time).format("hh:mm A"),
    })),
    procedure: procedureList?.map((item) => ({
      ...item,
      time: moment(item?.time).format("hh:mm A"),
    })),
    consultation: consultationList?.map((item) => ({
      ...item,
      time: moment(item?.time).format("hh:mm A"),
    })),
  });

  const handleReset = () => {
    setPayload({ ...initialValue, ...patientDetail });
    setMedicationList([]);
    setTreatmentList([]);
    setProcedureList([]);
    setConsultationList([]);
    setMedication({ ...initialMedication });
    setTreatment({ ...initialTreatment });
    setProcedure({ ...initialProcedure });
    setConsultation({ ...initialConsultation });
  };

  const handleSearchERInitialAssessment = async () => {
    try {
      const APIresponse = await SearchERInitialAssessmentAPI(transactionID);
      if (APIresponse?.success) {
        setTableData(APIresponse?.data ?? []);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleSave = async () => {
    try {
      if (!payload?.presentingComplaints) {
        notify(t("Presenting Complaints is required"), "error");
        return;
      }
      const response = payload?.id
        ? await UpdateERInitialAssessmentAPI(buildPayload())
        : await SaveERInitialAssessmentAPI(buildPayload());

      if (response?.success) {
        notify(response?.message, "success");
        handleReset();
        handleSearchERInitialAssessment();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleEdit = async (item) => {
    try {
      const APIresponse = await GetERInitialAssessmentByIDAPI(item?.ID);
      if (APIresponse?.success) {
        /* the API serialises with the default camelCase policy, so acronym
           properties arrive as spO2OnRA / uhidNo / grbs / heent / cvs */
        const { master, medication, treatment, procedure, consultation } =
          APIresponse?.data ?? {};

        if (master) {
          setPayload({
            ...initialValue,
            ...patientDetail,
            id: master?.id,
            visitType: master?.visitType ?? "",
            triagePriority: master?.triagePriority ?? "",
            uhidNo: master?.uhidNo || patientDetail.uhidNo,
            patientName: master?.patientName || patientDetail.patientName,
            age: master?.age || patientDetail.age,
            gender: master?.gender || patientDetail.gender,
            bodyWeight: master?.bodyWeight ?? "",
            erBedNo: master?.erBedNo ?? "",
            arrivalDate: master?.arrivalDate
              ? moment(master?.arrivalDate, "DD-MMM-YYYY").toDate()
              : new Date(),
            arrivalTime: master?.arrivalTime
              ? moment(master?.arrivalTime, "hh:mm A").toDate()
              : new Date(),
            assessmentTime: master?.assessmentTime
              ? moment(master?.assessmentTime, "hh:mm A").toDate()
              : new Date(),
            mlcNo: master?.mlcNo ?? "",
            arrivalType: master?.arrivalType ?? "",
            referredByDoctor: master?.referredByDoctor ?? "",
            broughtBy: master?.broughtBy ?? "",
            previousAdmission: master?.previousAdmission ?? "No",
            presentingComplaints: master?.presentingComplaints ?? "",
            airwayAssessment: master?.airwayAssessment ?? "",
            airwayManagement: master?.airwayManagement ?? "",
            pulse: master?.pulse ?? "",
            bpSystolic: master?.bpSystolic ?? "",
            bpDiastolic: master?.bpDiastolic ?? "",
            peripheralPulses: master?.peripheralPulses ?? "",
            temperature: master?.temperature ?? "",
            respiratoryRate: master?.respiratoryRate ?? "",
            isLaboured: String(master?.isLaboured ?? "0"),
            spo2OnRA: master?.spO2OnRA ?? "",
            spo2OnO2: master?.spO2OnO2 ?? "",
            o2Device: master?.o2Device ?? "",
            o2FlowRate: master?.o2FlowRate ?? "",
            cardiacMonitor: master?.cardiacMonitor ?? "",
            grbs: master?.grbs ?? "",
            avpu: master?.avpu ?? "",
            pupils: master?.pupils ?? "",
            painScore: master?.painScore ?? "",
            eyeOpening: master?.eyeOpening ?? "",
            verbalResponse: master?.verbalResponse ?? "",
            motorResponse: master?.motorResponse ?? "",
            gcsTotal: master?.gcsTotal ?? "",
            heent: master?.heent ?? "",
            chest: master?.chest ?? "",
            cvs: master?.cvs ?? "",
            abd: master?.abd ?? "",
            neuro: master?.neuro ?? "",
            pelvis: master?.pelvis ?? "",
            extremities: master?.extremities ?? "",
            secondaryOthers: master?.secondaryOthers ?? "",
            isAllergy: master?.isAllergy ?? "No",
            allergyDetail: master?.allergyDetail ?? "",
            pastHistory: master?.pastHistory ?? "",
            eventType: master?.eventType ?? "",
            eventDetail: master?.eventDetail ?? "",
            workingDiagnosis: master?.workingDiagnosis ?? "",
            investigations: master?.investigations ?? "",
          });
        }

        setMedicationList(
          (medication ?? []).map((item) => ({
            drug: item?.drug ?? "",
            dose: item?.dose ?? "",
            route: item?.route ?? "",
            doctor: item?.doctor ?? "",
            time: item?.time ? moment(item?.time, "hh:mm A").toDate() : new Date(),
            remark: item?.remark ?? "",
          })),
        );
        setTreatmentList(
          (treatment ?? []).map((item) => ({
            drug: item?.drug ?? "",
            dose: item?.dose ?? "",
            route: item?.route ?? "",
            doctor: item?.doctor ?? "",
            time: item?.time ? moment(item?.time, "hh:mm A").toDate() : new Date(),
          })),
        );
        setProcedureList(
          (procedure ?? []).map((item) => ({
            procedureName: item?.procedureName ?? "",
            time: item?.time ? moment(item?.time, "hh:mm A").toDate() : new Date(),
            doneBy: item?.doneBy ?? "",
            notes: item?.notes ?? "",
          })),
        );
        setConsultationList(
          (consultation ?? []).map((item) => ({
            speciality: item?.speciality ?? "",
            consultantName: item?.consultantName ?? "",
            time: item?.time ? moment(item?.time, "hh:mm A").toDate() : new Date(),
            informedBy: item?.informedBy ?? "",
            opinion: item?.opinion ?? "",
          })),
        );
      } else {
        notify(APIresponse?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handlePrint = async (item) => {
    try {
      const printPayload = {
        tid: String(transactionID ?? ""),
        id: String(item?.ID ?? payload?.id ?? "0"),
      };
      const APIresponse = await ERInitialAssessmentPrintAPI(printPayload);
      if (APIresponse?.success) {
        RedirectURL(APIresponse?.data?.pdfUrl);
      } else {
        notify(APIresponse?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleEmergencyCertificate = async (item) => {
    try {
      const APIresponse = await EmergencyCertificatePrintAPI({
        tid: String(transactionID ?? ""),
        id: String(item?.ID ?? payload?.id ?? "0"),
      });
      if (APIresponse?.success) {
        RedirectURL(APIresponse?.data?.pdfUrl);
      } else {
        notify(APIresponse?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  /* ---------------------------- table body -------------------------- */
  const handleChildTableData = (list, setList, columns) =>
    list?.map((item, index) => {
      const row = { SNO: index + 1 };
      columns?.forEach((column) => {
        row[column] =
          column === "time"
            ? moment(item?.[column]).format("hh:mm A")
            : item?.[column];
      });
      row.Action = (
        <i
          className="fa fa-trash p-1"
          role="button"
          onClick={() => handleRemoveRow(index, list, setList)}
        />
      );
      return row;
    });
  const handleRecordTableData = (records) =>
    records?.map((item, index) => ({
      SNO: index + 1,
      Date: item?.ArrivalDate,
      Time: item?.ArrivalTime,
      Triage: item?.TriagePriority,
      UHID: item?.UHIDNo,
      PatientName: item?.PatientName,
      WorkingDiagnosis: item?.WorkingDiagnosis,
      EntryBy: item?.EntryBy,
      Edit: (
        <>
          <i
            className="fa fa-edit p-1"
            role="button"
            title={t("Edit")}
            onClick={() => handleEdit(item)}
          />
          <CustomTooltip
            id={`print_${index}`}
            content="Print"
            icon={
              <button
                id={`print_${index}`}
                className="btn btn-sm bg-success"
                onClick={() => handlePrint(item)}
              >
                <i
                  className="fa fa-print p-1"
                  role="button"
                />
              </button>
            }
          />
          {/* Emergency Certificate - only offered once complaints are recorded */}
          {item?.PresentingComplaints ? (
            <CustomTooltip
              id={`emg_cer_${index}`}
              content="Emergency Certificate"
              icon={
                <button
                  id={`emg_cer_${index}`}
                  className="btn btn-sm bg-success"
                  onClick={() => handleEmergencyCertificate(item)}
                >
                  <i class="fa fa-file-medical" />
                </button>
              }
            />
          ) : null}
        </>
      ),
    }));


  useEffect(() => {
    if (transactionID) {
      handleSearchERInitialAssessment();
    }
  }, [transactionID]);

  /* patient context can resolve after the first render - keep demographics in sync
     while a saved record is not being edited */
  useEffect(() => {
    setPayload((prev) => (prev?.id ? prev : { ...prev, ...patientDetail }));
  }, [patientID, pName, age, ageSex]);

  return (
    <div className="mt-2 spatient_registration_card">
      {/* ------------------------- i) Demographics ------------------------- */}
      <div className="patient_registration card">
        <Heading title={t("ER Initial Assessment & Treatment")} isBreadcrumb={false} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("Visit Type")}
            className="form-control"
            id="visitType"
            name="visitType"
            searchable={true}
            value={payload?.visitType}
            dynamicOptions={DDLVisitType}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleReactSelect}
          />
          <ReactSelect
            placeholderName={t("Triage Priority")}
            className="form-control"
            id="triagePriority"
            name="triagePriority"
            searchable={true}
            value={payload?.triagePriority}
            dynamicOptions={DDLTriagePriority}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            id="uhidNo"
            name="uhidNo"
            lable={t("UHID No.")}
            value={payload?.uhidNo}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            readOnly
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="patientName"
            name="patientName"
            lable={t("Name")}
            value={payload?.patientName}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            readOnly
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="age"
            name="age"
            lable={t("Age")}
            value={payload?.age}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            readOnly
            onChange={handleChange}
          />
          <ReactSelect
            placeholderName={t("Gender")}
            className="form-control"
            id="gender"
            name="gender"
            searchable={true}
            value={payload?.gender}
            dynamicOptions={DDLGender}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            isDisabled={Boolean(patientDetail.gender)}
            handleChange={handleReactSelect}
          />
          <Input
            type="number"
            className="form-control"
            id="bodyWeight"
            name="bodyWeight"
            lable={t("Body Wt.")}
            value={payload?.bodyWeight}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="erBedNo"
            name="erBedNo"
            lable={t("ER Bed No.")}
            value={payload?.erBedNo}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <DatePicker
            className="custom-calendar"
            id="arrivalDate"
            name="arrivalDate"
            placeholder={VITE_DATE_FORMAT}
            value={payload?.arrivalDate}
            lable={t("Arrival Date")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleChange}
            maxDate={new Date()}
          />
          <TimePicker
            placeholderName="Arrival Time"
            lable={t("Arrival Time")}
            id="arrivalTime"
            name="arrivalTime"
            value={payload?.arrivalTime}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleChange}
          />
          <TimePicker
            placeholderName="Assessment Time"
            lable={t("Assessment Time")}
            id="assessmentTime"
            name="assessmentTime"
            value={payload?.assessmentTime}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="mlcNo"
            name="mlcNo"
            lable={t("MLC No.")}
            value={payload?.mlcNo}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <ReactSelect
            placeholderName={t("Type")}
            className="form-control"
            id="arrivalType"
            name="arrivalType"
            searchable={true}
            value={payload?.arrivalType}
            dynamicOptions={DDLArrivalType}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            id="referredByDoctor"
            name="referredByDoctor"
            lable={t("To Dr.")}
            value={payload?.referredByDoctor}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="broughtBy"
            name="broughtBy"
            lable={t("Brought By")}
            value={payload?.broughtBy}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <ReactSelect
            placeholderName={t("Previous Admission")}
            className="form-control"
            id="previousAdmission"
            name="previousAdmission"
            searchable={true}
            value={payload?.previousAdmission}
            dynamicOptions={DDLYesNo}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleReactSelect}
          />
        </div>
      </div>

      {/* --------------------- ii) Presenting complaints -------------------- */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Presenting Complaints")} isBreadcrumb={false} />
        <div className="row p-2">
          <TextAreaInput
            className="form-control"
            id="presentingComplaints"
            name="presentingComplaints"
            lable={t("Presenting Complaints")}
            value={payload?.presentingComplaints}
            rows={3}
            maxLength={1000}
            showTooltipCount
            respclass="col-12"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ------------------------ iii) Primary Survey ----------------------- */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Primary Survey")} isBreadcrumb={false} />
        <div className="row p-2">
          <div className="col-12 mb-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("Airway")}
          </div>
          <ReactSelect
            placeholderName={t("Airway Assessment")}
            className="form-control"
            id="airwayAssessment"
            name="airwayAssessment"
            searchable={true}
            value={payload?.airwayAssessment}
            dynamicOptions={DDLAirwayAssessment}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            handleChange={handleReactSelect}
          />
          <ReactSelect
            placeholderName={t("Airway Management")}
            className="form-control"
            id="airwayManagement"
            name="airwayManagement"
            searchable={true}
            value={payload?.airwayManagement}
            dynamicOptions={DDLAirwayManagement}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            handleChange={handleReactSelect}
          />

          <div className="col-12 my-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("Circulation")}
          </div>
          <Input
            type="number"
            className="form-control"
            id="pulse"
            name="pulse"
            lable={t("Pulse /min")}
            value={payload?.pulse}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="number"
            className="form-control"
            id="bpSystolic"
            name="bpSystolic"
            lable={t("BP Systolic (mmHg)")}
            value={payload?.bpSystolic}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="number"
            className="form-control"
            id="bpDiastolic"
            name="bpDiastolic"
            lable={t("BP Diastolic (mmHg)")}
            value={payload?.bpDiastolic}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="peripheralPulses"
            name="peripheralPulses"
            lable={t("Peripheral Pulses")}
            value={payload?.peripheralPulses}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="number"
            className="form-control"
            id="temperature"
            name="temperature"
            lable={t("Temp (°F)")}
            value={payload?.temperature}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />

          <div className="col-12 my-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("Breathing")}
          </div>
          <Input
            type="number"
            className="form-control"
            id="respiratoryRate"
            name="respiratoryRate"
            lable={t("RR /min")}
            value={payload?.respiratoryRate}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <div className="col-xl-2 col-md-3 col-sm-4 col-12">
            <div className="form-group d-flex align-items-center">
              <input
                type="checkbox"
                id="isLaboured"
                name="isLaboured"
                checked={String(payload?.isLaboured) === "1"}
                onChange={handleCheckChange}
              />
              <label className="m-0 ml-2" htmlFor="isLaboured">
                {t("Laboured")}
              </label>
            </div>
          </div>
          <Input
            type="number"
            className="form-control"
            id="spo2OnRA"
            name="spo2OnRA"
            lable={t("SpO2 % on RA")}
            value={payload?.spo2OnRA}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="number"
            className="form-control"
            id="spo2OnO2"
            name="spo2OnO2"
            lable={t("SpO2 % on O2")}
            value={payload?.spo2OnO2}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <ReactSelect
            placeholderName={t("O2 Via")}
            className="form-control"
            id="o2Device"
            name="o2Device"
            searchable={true}
            value={payload?.o2Device}
            dynamicOptions={DDLO2Device}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleReactSelect}
          />
          <Input
            type="number"
            className="form-control"
            id="o2FlowRate"
            name="o2FlowRate"
            lable={t("Ltr/min")}
            value={payload?.o2FlowRate}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />

          <div className="col-12 my-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("Others")}
          </div>
          <Input
            type="text"
            className="form-control"
            id="cardiacMonitor"
            name="cardiacMonitor"
            lable={t("Cardiac Monitor")}
            value={payload?.cardiacMonitor}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="number"
            className="form-control"
            id="grbs"
            name="grbs"
            lable={t("GRBS (mg/dL)")}
            value={payload?.grbs}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <ReactSelect
            placeholderName={t("AVPU")}
            className="form-control"
            id="avpu"
            name="avpu"
            searchable={true}
            value={payload?.avpu}
            dynamicOptions={DDLAVPU}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            id="pupils"
            name="pupils"
            lable={t("Pupils (NSERTL)")}
            value={payload?.pupils}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <ReactSelect
            placeholderName={t("Pain Score")}
            className="form-control"
            id="painScore"
            name="painScore"
            searchable={true}
            value={payload?.painScore}
            dynamicOptions={DDLPainScore}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleReactSelect}
          />
        </div>
      </div>

      {/* --------------------- iv) Glasgow Coma Scale ---------------------- */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Glasgow Coma Scale")} isBreadcrumb={false} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("Eye Opening")}
            className="form-control"
            id="eyeOpening"
            name="eyeOpening"
            searchable={true}
            value={payload?.eyeOpening}
            dynamicOptions={DDLEyeOpening}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            handleChange={handleGCSChange}
          />
          <ReactSelect
            placeholderName={t("Verbal Response")}
            className="form-control"
            id="verbalResponse"
            name="verbalResponse"
            searchable={true}
            value={payload?.verbalResponse}
            dynamicOptions={DDLVerbalResponse}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            handleChange={handleGCSChange}
          />
          <ReactSelect
            placeholderName={t("Motor Response")}
            className="form-control"
            id="motorResponse"
            name="motorResponse"
            searchable={true}
            value={payload?.motorResponse}
            dynamicOptions={DDLMotorResponse}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            handleChange={handleGCSChange}
          />
          <Input
            type="text"
            className="form-control"
            id="gcsTotal"
            name="gcsTotal"
            lable={t("Total GCS")}
            value={payload?.gcsTotal}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            readOnly
            onChange={() => { }}
          />
        </div>
      </div>

      {/* ---------------------- v) Secondary Survey ------------------------ */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Secondary Survey")} isBreadcrumb={false} />
        <div className="row p-2">
          {[
            { id: "heent", lable: "HEENT" },
            { id: "chest", lable: "CHEST" },
            { id: "cvs", lable: "CVS" },
            { id: "abd", lable: "ABD" },
            { id: "neuro", lable: "Neuro" },
            { id: "pelvis", lable: "PELVIS" },
            {
              id: "extremities",
              lable:
                "EXTREMITIES (Deformity / Swelling / Skin Integrity / Neuromuscular Function / Pulses / Peripheral)",
            },
            { id: "secondaryOthers", lable: "Others" },
          ]?.map((item) => (
            <TextAreaInput
              key={item?.id}
              className="form-control"
              id={item?.id}
              name={item?.id}
              lable={t(item?.lable)}
              value={payload?.[item?.id]}
              rows={2}
              maxLength={500}
              showTooltipCount
              respclass="col-xl-6 col-md-6 col-12"
              onChange={handleChange}
            />
          ))}
        </div>

        {/* ------------------------- v-a) Allergies ------------------------- */}
        <div className="row px-2">
          <div className="col-12 my-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("A - Allergies")}
          </div>
          <ReactSelect
            placeholderName={t("Allergies")}
            className="form-control"
            id="isAllergy"
            name="isAllergy"
            searchable={true}
            value={payload?.isAllergy}
            dynamicOptions={DDLYesNo}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            id="allergyDetail"
            name="allergyDetail"
            lable={t("If Yes, Details of Allergy")}
            value={payload?.allergyDetail}
            disabled={payload?.isAllergy !== "Yes"}
            respclass="col-xl-9 col-md-8 col-sm-6 col-12"
            onChange={handleChange}
          />
        </div>

        {/* ------------------------ v-m) Medication ------------------------ */}
        <div className="row px-2">
          <div className="col-12 my-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("M - Medication")}
          </div>
          <Input
            type="text"
            className="form-control"
            id="medicationDrug"
            name="drug"
            lable={t("Drug")}
            isUpperCase
            value={medication?.drug}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setMedication)}
          />
          <Input
            type="text"
            className="form-control"
            id="medicationDose"
            name="dose"
            lable={t("Dose")}
            value={medication?.dose}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setMedication)}
          />
          <ReactSelect
            placeholderName={t("Route")}
            className="form-control"
            id="medicationRoute"
            name="route"
            searchable={true}
            value={medication?.route}
            dynamicOptions={DDLRoute}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleRowSelect(setMedication)}
          />
          <Input
            type="text"
            className="form-control"
            id="medicationDoctor"
            name="doctor"
            lable={t("Doctor")}
            value={medication?.doctor}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setMedication)}
          />
          <TimePicker
            placeholderName="Time"
            lable={t("Time")}
            id="medicationTime"
            name="time"
            value={medication?.time}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleRowChange(setMedication)}
          />
          <Input
            type="text"
            className="form-control"
            id="medicationRemark"
            name="remark"
            lable={t("Remark")}
            value={medication?.remark}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setMedication)}
          />
          <div className="col-12 d-flex justify-content-end pb-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                handleAddRow(
                  medication,
                  "drug",
                  medicationList,
                  setMedicationList,
                  setMedication,
                  initialMedication,
                )
              }
            >
              {t("Add")}
            </button>
          </div>
          {medicationList?.length > 0 && (
            <div className="col-12">
              <Tables
                thead={MEDICATION_THEAD}
                tbody={handleChildTableData(medicationList, setMedicationList, [
                  "drug",
                  "dose",
                  "route",
                  "doctor",
                  "time",
                  "remark",
                ])}
              />
            </div>
          )}
        </div>

        {/* ------------------------ v-p) Past history ----------------------- */}
        <div className="row px-2">
          <div className="col-12 my-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("P - Past History")}
          </div>
          <TextAreaInput
            className="form-control"
            id="pastHistory"
            name="pastHistory"
            lable={t("Past History")}
            value={payload?.pastHistory}
            rows={2}
            maxLength={1000}
            showTooltipCount
            respclass="col-12"
            onChange={handleChange}
          />
        </div>

        {/* --------------------- v-e) Events / Environment ------------------ */}
        <div className="row px-2">
          <div className="col-12 my-1" style={{ fontWeight: "900", borderBottom: "1px solid #d0d6db" }}>
            {t("E - Events / Environment")}
          </div>
          <ReactSelect
            placeholderName={t("Events / Environment")}
            className="form-control"
            id="eventType"
            name="eventType"
            searchable={true}
            value={payload?.eventType}
            dynamicOptions={DDLEventType}
            respclass="col-xl-4 col-md-5 col-sm-6 col-12"
            handleChange={handleReactSelect}
          />
          <TextAreaInput
            className="form-control"
            id="eventDetail"
            name="eventDetail"
            lable={t("Event Detail")}
            value={payload?.eventDetail}
            rows={2}
            maxLength={500}
            showTooltipCount
            respclass="col-xl-8 col-md-7 col-sm-6 col-12"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ------------- vi) Working Diagnosis  vii) Investigations ---------- */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Working Diagnosis / Differentials & Investigations")} isBreadcrumb={false} />
        <div className="row p-2">
          <TextAreaInput
            className="form-control"
            id="workingDiagnosis"
            name="workingDiagnosis"
            lable={t("Working Diagnosis / Differentials")}
            value={payload?.workingDiagnosis}
            rows={3}
            maxLength={1000}
            showTooltipCount
            respclass="col-xl-6 col-md-6 col-12"
            onChange={handleChange}
          />
          <TextAreaInput
            className="form-control"
            id="investigations"
            name="investigations"
            lable={t("Investigations")}
            value={payload?.investigations}
            rows={3}
            maxLength={1000}
            showTooltipCount
            respclass="col-xl-6 col-md-6 col-12"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ----------------------- viii) Treatment Advised ------------------- */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Treatment Advised")} isBreadcrumb={false} />
        <div className="row p-2">
          <div className="col-12 pb-1" style={{ fontSize: "11px", fontWeight: "600" }}>
            {t("NOTE : ALL DRUGS TO BE WRITTEN IN CAPITAL LETTERS ONLY")}
          </div>
          <Input
            type="text"
            className="form-control"
            id="treatmentDrug"
            name="drug"
            lable={t("Drug")}
            isUpperCase
            value={treatment?.drug}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setTreatment)}
          />
          <Input
            type="text"
            className="form-control"
            id="treatmentDose"
            name="dose"
            lable={t("Dose")}
            value={treatment?.dose}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setTreatment)}
          />
          <ReactSelect
            placeholderName={t("Route")}
            className="form-control"
            id="treatmentRoute"
            name="route"
            searchable={true}
            value={treatment?.route}
            dynamicOptions={DDLRoute}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleRowSelect(setTreatment)}
          />
          <Input
            type="text"
            className="form-control"
            id="treatmentDoctor"
            name="doctor"
            lable={t("Doctor")}
            value={treatment?.doctor}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setTreatment)}
          />
          <TimePicker
            placeholderName="Time"
            lable={t("Time")}
            id="treatmentTime"
            name="time"
            value={treatment?.time}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleRowChange(setTreatment)}
          />
          <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex justify-content-end pb-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                handleAddRow(
                  treatment,
                  "drug",
                  treatmentList,
                  setTreatmentList,
                  setTreatment,
                  initialTreatment,
                )
              }
            >
              {t("Add")}
            </button>
          </div>
          {treatmentList?.length > 0 && (
            <div className="col-12">
              <Tables
                thead={TREATMENT_THEAD}
                tbody={handleChildTableData(treatmentList, setTreatmentList, [
                  "drug",
                  "dose",
                  "route",
                  "doctor",
                  "time",
                ])}
              />
            </div>
          )}
        </div>
      </div>

      {/* --------------------------- ix) Procedures ------------------------ */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Procedures")} isBreadcrumb={false} />
        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            id="procedureName"
            name="procedureName"
            lable={t("Procedure Name")}
            value={procedure?.procedureName}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            onChange={handleRowChange(setProcedure)}
          />
          <TimePicker
            placeholderName="Time"
            lable={t("Time")}
            id="procedureTime"
            name="time"
            value={procedure?.time}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleRowChange(setProcedure)}
          />
          <Input
            type="text"
            className="form-control"
            id="procedureDoneBy"
            name="doneBy"
            lable={t("Done By")}
            value={procedure?.doneBy}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setProcedure)}
          />
          <Input
            type="text"
            className="form-control"
            id="procedureNotes"
            name="notes"
            lable={t("Notes")}
            value={procedure?.notes}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            onChange={handleRowChange(setProcedure)}
          />
          <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex justify-content-end pb-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                handleAddRow(
                  procedure,
                  "procedureName",
                  procedureList,
                  setProcedureList,
                  setProcedure,
                  initialProcedure,
                )
              }
            >
              {t("Add")}
            </button>
          </div>
          {procedureList?.length > 0 && (
            <div className="col-12">
              <Tables
                thead={PROCEDURE_THEAD}
                tbody={handleChildTableData(procedureList, setProcedureList, [
                  "procedureName",
                  "time",
                  "doneBy",
                  "notes",
                ])}
              />
            </div>
          )}
        </div>
      </div>

      {/* --------------------- x) Referral / Consultations ----------------- */}
      <div className="patient_registration card mt-2">
        <Heading title={t("Referral / Consultations")} isBreadcrumb={false} />
        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            id="consultationSpeciality"
            name="speciality"
            lable={t("Speciality")}
            value={consultation?.speciality}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setConsultation)}
          />
          <Input
            type="text"
            className="form-control"
            id="consultantName"
            name="consultantName"
            lable={t("Consultant Name")}
            value={consultation?.consultantName}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setConsultation)}
          />
          <TimePicker
            placeholderName="Time"
            lable={t("Time")}
            id="consultationTime"
            name="time"
            value={consultation?.time}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleRowChange(setConsultation)}
          />
          <Input
            type="text"
            className="form-control"
            id="consultationInformedBy"
            name="informedBy"
            lable={t("Informed By")}
            value={consultation?.informedBy}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setConsultation)}
          />
          <Input
            type="text"
            className="form-control"
            id="consultationOpinion"
            name="opinion"
            lable={t("Opinion")}
            value={consultation?.opinion}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleRowChange(setConsultation)}
          />
          <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex justify-content-end pb-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                handleAddRow(
                  consultation,
                  "speciality",
                  consultationList,
                  setConsultationList,
                  setConsultation,
                  initialConsultation,
                )
              }
            >
              {t("Add")}
            </button>
          </div>
          {consultationList?.length > 0 && (
            <div className="col-12">
              <Tables
                thead={CONSULTATION_THEAD}
                tbody={handleChildTableData(consultationList, setConsultationList, [
                  "speciality",
                  "consultantName",
                  "time",
                  "informedBy",
                  "opinion",
                ])}
              />
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end p-2">
          <button className="btn btn-sm btn-secondary mx-2" onClick={handleReset}>
            {t("Clear")}
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleSave}>
            {payload?.id ? t("Update") : t("Save")}
          </button>
        </div>
      </div>

      {/* ----------------------------- Records ---------------------------- */}
      <div className="patient_registration card mt-2">
        <Heading title={t("ER Initial Assessment Records")} isBreadcrumb={false} />
        {tableData?.length > 0 && (
          <div className="px-2 row">
            <div className="col-12">
              <Tables thead={RECORD_THEAD} tbody={handleRecordTableData(tableData)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ERInitialAssessmentTreatment;
