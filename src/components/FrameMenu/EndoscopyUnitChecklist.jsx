import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TextAreaInput from "../formComponent/TextAreaInput";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";

import moment from "moment";
import { ReprintSVG } from "../SvgIcons";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import {
  EditEndoscopyDataAPI,
  GetEndoscopyDataAPI,
  PrintEndoscopyChecklistAPI,
  SaveEndoscopyDataAPI,
} from "../../networkServices/OT/otAPI";
import { notify } from "../../utils/ustil2";
import { RedirectURL } from "../../networkServices/PDFURL";

const EndoscopyUnitChecklist = ({ data }) => {
  const PatientID = data?.patientID || data?.PatientID;
  const TransactionID = data?.transactionID || data?.TransactionID;

  const [t] = useTranslation();

  const initialValues = {
    PatientId: "",
    Id: "",
    TransactionID: "",

    Procedure: "",
    Diagnosis: "",
    Consent: "",
    MedicalHistory: "",
    LastTimeUrine: "",

    Jewellery: "",
    Gown: "",
    IdentityBand: "",
    Dentures: "",
    Caps: "",
    ContactLenses: "",
    Prosthesis: "",

    Medications: "",
    Allergies: "",

    Endoscopist: "",
    ScrubNurse: "",
    Technician: "",
    LastMeal: "",

    Date: new Date(),
    Time: "",

    BowelPrep: "",
    HIVTested: "",
    HBSAg: "",
    InformEndoscopyNurse: "",

    Temp: "",
    Pulse: "",
    BP: "",
    Resp: "",
    TimeVital: "",

    NextOfKin: "",
    ContactNo: "",
    HandOverBy: "",
    Airway15: "",
    Airway30: "",
    Airway45: "",
    Airway60: "",
    Airway75: "",
    Airway90: "",

    TwoLMin15: "",
    TwoLMin30: "",
    TwoLMin45: "",
    TwoLMin60: "",
    TwoLMin75: "",
    TwoLMin90: "",

    RESP15: "",
    RESP30: "",
    RESP45: "",
    RESP60: "",
    RESP75: "",
    RESP90: "",

    PULSE15: "",
    PULSE30: "",
    PULSE45: "",
    PULSE60: "",
    PULSE75: "",
    PULSE90: "",

    TEMP15: "",
    TEMP30: "",
    TEMP45: "",
    TEMP60: "",
    TEMP75: "",
    TEMP90: "",

    BP15: "",
    BP30: "",
    BP45: "",
    BP60: "",
    BP75: "",
    BP90: "",

    SAT15: "",
    SAT30: "",
    SAT45: "",
    SAT60: "",
    SAT75: "",
    SAT90: "",

    LOC15: "",
    LOC30: "",
    LOC45: "",
    LOC60: "",
    LOC75: "",
    LOC90: "",

    HeadLift15: "",
    HeadLift30: "",
    HeadLift45: "",
    HeadLift60: "",
    HeadLift75: "",
    HeadLift90: "",

    Limb15: "",
    Limb30: "",
    Limb45: "",
    Limb60: "",
    Limb75: "",
    Limb90: "",

    Tprocedure: "",
    scopeused: "",
    starttime: "",
    finished: "",
    throat: "",
    nurse1: "",
    Tpulse: "",
    nurse2: "",
    oxygen: "",
    recoverycomments: "",
    biopsy: "",
    OtherNursingComments: "",
  };
  const [payload, setPayload] = useState(initialValues);
  const [tableData, setTableData] = useState([]);

  const saveUpdatePayload = {
    PatientId: PatientID,
    Id: payload.Id || 0,
    TransactionID: TransactionID,

    Procedure: payload.Procedure,
    Diagnosis: payload.Diagnosis,
    Consent: Number(payload.Consent),
    MedicalHistory: payload.MedicalHistory,
    LastTimeUrine: payload.LastTimeUrine,

    Jewellery: payload.Jewellery,
    Gown: payload.Gown,
    IdentityBand: payload.IdentityBand,
    Dentures: payload.Dentures,
    Caps: payload.Caps,
    ContactLenses: payload.ContactLenses,
    Prosthesis: payload.Prosthesis,

    Medications: payload.Medications,
    Allergies: payload.Allergies,

    Endoscopist: payload.Endoscopist,
    ScrubNurse: payload.ScrubNurse,
    Technician: payload.Technician,
    LastMeal: payload.LastMeal,

    Date: payload.Date,
    Time: moment(payload.Time).format("hh:mm A"),

    BowelPrep: payload.BowelPrep,
    HIVTested: payload.HIVTested,
    HBSAg: payload.HBSAg,
    InformEndoscopyNurse: payload.InformEndoscopyNurse,

    Temp: payload.Temp,
    Pulse: payload.Pulse,
    BP: payload.BP,
    Resp: payload.Resp,
    TimeVital: payload.TimeVital,

    NextOfKin: payload.NextOfKin,
    ContactNo: payload.ContactNo,
    HandOverBy: payload.HandOverBy,

    // --- Monitoring Table ---

    Airway15: payload.Airway15,
    Airway30: payload.Airway30,
    Airway45: payload.Airway45,
    Airway60: payload.Airway60,
    Airway75: payload.Airway75,
    Airway90: payload.Airway90,

    TwoLMin15: payload.TwoLMin15,
    TwoLMin30: payload.TwoLMin30,
    TwoLMin45: payload.TwoLMin45,
    TwoLMin60: payload.TwoLMin60,
    TwoLMin75: payload.TwoLMin75,
    TwoLMin90: payload.TwoLMin90,

    RESP15: payload.RESP15,
    RESP30: payload.RESP30,
    RESP45: payload.RESP45,
    RESP60: payload.RESP60,
    RESP75: payload.RESP75,
    RESP90: payload.RESP90,

    PULSE15: payload.PULSE15,
    PULSE30: payload.PULSE30,
    PULSE45: payload.PULSE45,
    PULSE60: payload.PULSE60,
    PULSE75: payload.PULSE75,
    PULSE90: payload.PULSE90,

    TEMP15: payload.TEMP15,
    TEMP30: payload.TEMP30,
    TEMP45: payload.TEMP45,
    TEMP60: payload.TEMP60,
    TEMP75: payload.TEMP75,
    TEMP90: payload.TEMP90,

    BP15: payload.BP15,
    BP30: payload.BP30,
    BP45: payload.BP45,
    BP60: payload.BP60,
    BP75: payload.BP75,
    BP90: payload.BP90,

    SAT15: payload.SAT15,
    SAT30: payload.SAT30,
    SAT45: payload.SAT45,
    SAT60: payload.SAT60,
    SAT75: payload.SAT75,
    SAT90: payload.SAT90,

    LOC15: payload.LOC15,
    LOC30: payload.LOC30,
    LOC45: payload.LOC45,
    LOC60: payload.LOC60,
    LOC75: payload.LOC75,
    LOC90: payload.LOC90,

    HeadLift15: payload.HeadLift15,
    HeadLift30: payload.HeadLift30,
    HeadLift45: payload.HeadLift45,
    HeadLift60: payload.HeadLift60,
    HeadLift75: payload.HeadLift75,
    HeadLift90: payload.HeadLift90,

    Limb15: payload.Limb15,
    Limb30: payload.Limb30,
    Limb45: payload.Limb45,
    Limb60: payload.Limb60,
    Limb75: payload.Limb75,
    Limb90: payload.Limb90,

    Tprocedure: payload.Tprocedure,
    scopeused: payload.scopeused,
    starttime: payload.starttime,
    finished: payload.finished,
    throat: payload.throat,
    nurse1: payload.nurse1,
    Tpulse: payload.Tpulse,
    nurse2: payload.nurse2,
    oxygen: payload.oxygen,
    recoverycomments: payload.recoverycomments,
    biopsy: payload.biopsy,
    OtherNursingComments: payload.OtherNursingComments,
  };

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

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
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

  const handleEdit = (saveUpdatePayload) => {
    setPayload({ ...saveUpdatePayload });
  };


  const handlePrint = async (row) => {
    const res = await PrintEndoscopyChecklistAPI(row?.Id)
    if (res?.success) {
      RedirectURL(res?.data?.pdfUrl);
    } else {
      notify(res?.message, "error")
    }
  };

  const T1_HEAD = [
    t("TIME"),
    t("15 min"),
    t("30 min"),
    t("45 min"),
    t("60 min"),
    t("75 min"),
    t("90 min"),
  ];

  const THEAD = [
    t("S.No"),
    t("Procedure"),
    t("Diagnosis"),
    t("Consent"),
    t("Medical History"),
    t("Last Time Urine"),
    t("Jewellery"),
    t("Gown"),
    t("Identity Band"),
    t("Dentures"),
    t("Caps"),
    t("Contact Lenses"),
    t("Prosthesis"),
    t("Edit"),
    t("Print"),
  ];

  const block6Config = [
    {
      component: "Input",
      id: "Procedure",
      name: "Procedure",
      label: t("Procedure"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Diagnosis",
      name: "Diagnosis",
      label: t("Diagnosis"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "Consent",
      name: "Consent",
      label: t("Written Consent obtained by Dr"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "Input",
      id: "MedicalHistory",
      name: "MedicalHistory",
      label: t("Medical/Surgical History"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "LastTimeUrine",
      name: "LastTimeUrine",
      label: t("Last Time Passed Urine"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "Jewellery",
      name: "Jewellery",
      required: "required-fields",
      label: t("Jewellery Removed"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "Gown",
      required: "required-fields",
      name: "Gown",
      label: t("Gown On Correctly"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "IdentityBand",
      name: "IdentityBand",
      required: "required-fields",
      label: t("Identity Brand"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "Dentures",
      required: "required-fields",
      name: "Dentures",
      label: t("Dentures Removed"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      required: "required-fields",
      id: "Caps",
      name: "Caps",
      label: t("Caps/Crowns/Bridge"),
      respclass: "col-sm-2 col-1",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "ContactLenses",
      name: "ContactLenses",
      required: "required-fields",
      label: t("Contact Lenses Removed"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "Prosthesis",
      name: "Prosthesis",
      required: "required-fields",
      label: t("Prosthesis"),
      respclass: "col-sm-2 col-12",
      options: options,
    },

    {
      component: "Input",
      id: "OtherNursingComments",
      name: "OtherNursingComments",
      label: t("Details"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "Input",
      id: "Medications",
      name: "Medications",
      label: t("Present Medications (Last Time Taken)(Name Only)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Allergies",
      name: "Allergies",
      label: t("Allergies"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Tprocedure",
      name: "Tprocedure",
      label: t("PROCEDURE"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "scopeused",
      name: "scopeused",
      label: t("Scope Used"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "starttime",
      name: "starttime",
      label: t("Start Time"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "finished",
      name: "finished",
      label: t("Time Finished"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "throat",
      name: "throat",
      label: t("Throat Spray"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "nurse1",
      name: "nurse1",
      label: t("Nurse 1"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Tpulse",
      name: "Tpulse",
      label: t("Pulse Oxymeter"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "nurse2",
      name: "nurse2",
      label: t("Nurse 2"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "oxygen",
      name: "oxygen",
      label: t("Oxygen"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "biopsy",
      name: "biopsy",
      label: t("Biopsy"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TextArea",
      id: "recoverycomments",
      name: "recoverycomments",
      label: t("Recovery Comments"),
      respclass: "col-sm-2 col-12",
    },
  ];

  const block2Config = [
    {
      component: "Input",
      id: "Endoscopist",
      name: "Endoscopist",
      label: t("Gastroenterologist"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "ScrubNurse",
      name: "ScrubNurse",
      label: t("Scrub Nurse"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Technician",
      name: "Technician",
      label: t("Technician"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "LastMeal",
      name: "LastMeal",
      label: t("Last Meal/Beverage"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "ReactSelect",
      id: "BowelPrep",
      name: "BowelPrep",
      required: "required-fields",
      label: t("Bowel Prep"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "DatePicker",
      id: "Date",
      name: "Date",
      label: t("Date"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "Time",
      name: "Time",
      label: t("Time"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "HBSAg",
      name: "HBSAg",
      label: t("HB SAg"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "HIVTested",
      required: "required-fields",
      name: "HIVTested",
      label: t("H.I.V. - State if Tested"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "ReactSelect",
      id: "InformEndoscopyNurse",
      name: "InformEndoscopyNurse",
      required: "required-fields",
      label: t("If +ve inform Endoscopy Nurses Prior to Procedure"),
      respclass: "col-sm-2 col-12",
      options: options,
    },
    {
      component: "Input",
      id: "Temp",
      name: "Temp",
      label: t("Temp"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Pulse",
      name: "Pulse",
      label: t("Pulse"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "BP",
      name: "BP",
      label: t("BP"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Resp",
      name: "Resp",
      label: t("Resp"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "TimeVital",
      name: "TimeVital",
      label: t("Time"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "Input",
      id: "NextOfKin",
      name: "NextOfKin",
      label: t("Next Of Kin"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "ContactNo",
      name: "ContactNo",
      label: t("Contact No"),
      respclass: "col-sm-2 col-12",
    },
  ];

  const T1_BODY = [
    {
      TIME: "Airway",
      "15 min": (
        <Input
          id="Airway15"
          value={payload?.Airway15}
          onChange={handleChange}
          className="form-control"
          name="Airway15"
        />
      ),
      "30 min": (
        <Input
          id="Airway30"
          value={payload?.Airway30}
          onChange={handleChange}
          className="form-control"
          name="Airway30"
        />
      ),
      "45 min": (
        <Input
          id="Airway45"
          value={payload?.Airway45}
          onChange={handleChange}
          className="form-control"
          name="Airway45"
        />
      ),
      "60 min": (
        <Input
          id="Airway60"
          value={payload?.shavAirway60edby}
          onChange={handleChange}
          className="form-control"
          name="Airway60"
        />
      ),
      "75 min": (
        <Input
          id="Airway75"
          value={payload?.Airway75}
          onChange={handleChange}
          className="form-control"
          name="Airway75"
        />
      ),
      "90 min": (
        <Input
          id="Airway90"
          value={payload?.Airway90}
          onChange={handleChange}
          className="form-control"
          name="Airway90"
        />
      ),
    },

    {
      TIME: "OXYGEN L/min",
      "15 min": (
        <Input
          id="TwoLMin15"
          value={payload?.TwoLMin15}
          onChange={handleChange}
          className="form-control"
          name="TwoLMin15"
        />
      ),
      "30 min": (
        <Input
          id="TwoLMin30"
          value={payload?.TwoLMin30}
          onChange={handleChange}
          className="form-control"
          name="TwoLMin30"
        />
      ),
      "45 min": (
        <Input
          id="TwoLMin45"
          value={payload?.TwoLMin45}
          onChange={handleChange}
          className="form-control"
          name="TwoLMin45"
        />
      ),
      "60 min": (
        <Input
          id="TwoLMin60"
          value={payload?.TwoLMin60}
          onChange={handleChange}
          className="form-control"
          name="TwoLMin60"
        />
      ),
      "75 min": (
        <Input
          id="TwoLMin75"
          value={payload?.TwoLMin75}
          onChange={handleChange}
          className="form-control"
          name="TwoLMin75"
        />
      ),
      "90 min": (
        <Input
          id="TwoLMin90"
          value={payload?.TwoLMin90}
          onChange={handleChange}
          className="form-control"
          name="TwoLMin90"
        />
      ),
    },

    {
      TIME: "RESP",
      "15 min": (
        <Input
          id="RESP15"
          value={payload?.RESP15}
          onChange={handleChange}
          className="form-control"
          name="RESP15"
        />
      ),
      "30 min": (
        <Input
          id="RESP30"
          value={payload?.RESP30}
          onChange={handleChange}
          className="form-control"
          name="RESP30"
        />
      ),
      "45 min": (
        <Input
          id="RESP45"
          value={payload?.RESP45}
          onChange={handleChange}
          className="form-control"
          name="RESP45"
        />
      ),
      "60 min": (
        <Input
          id="RESP60"
          value={payload?.RESP60}
          onChange={handleChange}
          className="form-control"
          name="RESP60"
        />
      ),
      "75 min": (
        <Input
          id="RESP75"
          value={payload?.RESP75}
          onChange={handleChange}
          className="form-control"
          name="RESP75"
        />
      ),
      "90 min": (
        <Input
          id="RESP90"
          value={payload?.RESP90}
          onChange={handleChange}
          className="form-control"
          name="RESP90"
        />
      ),
    },

    {
      TIME: "PULSE",
      "15 min": (
        <Input
          id="PULSE15"
          value={payload?.PULSE15}
          onChange={handleChange}
          className="form-control"
          name="PULSE15"
        />
      ),
      "30 min": (
        <Input
          id="PULSE30"
          value={payload?.PULSE30}
          onChange={handleChange}
          className="form-control"
          name="PULSE30"
        />
      ),
      "45 min": (
        <Input
          id="PULSE45"
          value={payload?.PULSE45}
          onChange={handleChange}
          className="form-control"
          name="PULSE45"
        />
      ),
      "60 min": (
        <Input
          id="PULSE60"
          value={payload?.PULSE60}
          onChange={handleChange}
          className="form-control"
          name="PULSE60"
        />
      ),
      "75 min": (
        <Input
          id="PULSE75"
          value={payload?.PULSE75}
          onChange={handleChange}
          className="form-control"
          name="PULSE75"
        />
      ),
      "90 min": (
        <Input
          id="PULSE90"
          value={payload?.PULSE90}
          onChange={handleChange}
          className="form-control"
          name="PULSE90"
        />
      ),
    },

    {
      TIME: "TEMP",
      "15 min": (
        <Input
          id="TEMP15"
          value={payload?.TEMP15}
          onChange={handleChange}
          className="form-control"
          name="TEMP15"
        />
      ),
      "30 min": (
        <Input
          id="TEMP30"
          value={payload?.TEMP30}
          onChange={handleChange}
          className="form-control"
          name="TEMP30"
        />
      ),
      "45 min": (
        <Input
          id="TEMP45"
          value={payload?.TEMP45}
          onChange={handleChange}
          className="form-control"
          name="TEMP45"
        />
      ),
      "60 min": (
        <Input
          id="TEMP60"
          value={payload?.TEMP60}
          onChange={handleChange}
          className="form-control"
          name="TEMP60"
        />
      ),
      "75 min": (
        <Input
          id="TEMP75"
          value={payload?.TEMP75}
          onChange={handleChange}
          className="form-control"
          name="TEMP75"
        />
      ),
      "90 min": (
        <Input
          id="TEMP90"
          value={payload?.TEMP90}
          onChange={handleChange}
          className="form-control"
          name="TEMP90"
        />
      ),
    },

    {
      TIME: "B.P.",
      "15 min": (
        <Input
          id="BP15"
          value={payload?.BP15}
          onChange={handleChange}
          className="form-control"
          name="BP15"
        />
      ),
      "30 min": (
        <Input
          id="BP30"
          value={payload?.BP30}
          onChange={handleChange}
          className="form-control"
          name="BP30"
        />
      ),
      "45 min": (
        <Input
          id="BP45"
          value={payload?.BP45}
          onChange={handleChange}
          className="form-control"
          name="BP45"
        />
      ),
      "60 min": (
        <Input
          id="BP60"
          value={payload?.BP60}
          onChange={handleChange}
          className="form-control"
          name="BP60"
        />
      ),
      "75 min": (
        <Input
          id="BP75"
          value={payload?.BP75}
          onChange={handleChange}
          className="form-control"
          name="BP75"
        />
      ),
      "90 min": (
        <Input
          id="BP90"
          value={payload?.BP90}
          onChange={handleChange}
          className="form-control"
          name="BP90"
        />
      ),
    },

    {
      TIME: "SAT/COLOR",
      "15 min": (
        <Input
          id="SAT15"
          value={payload?.SAT15}
          onChange={handleChange}
          className="form-control"
          name="SAT15"
        />
      ),
      "30 min": (
        <Input
          id="SAT30"
          value={payload?.SAT30}
          onChange={handleChange}
          className="form-control"
          name="SAT30"
        />
      ),
      "45 min": (
        <Input
          id="SAT45"
          value={payload?.SAT45}
          onChange={handleChange}
          className="form-control"
          name="SAT45"
        />
      ),
      "60 min": (
        <Input
          id="SAT60"
          value={payload?.SAT60}
          onChange={handleChange}
          className="form-control"
          name="SAT60"
        />
      ),
      "75 min": (
        <Input
          id="SAT75"
          value={payload?.SAT75}
          onChange={handleChange}
          className="form-control"
          name="SAT75"
        />
      ),
      "90 min": (
        <Input
          id="SAT90"
          value={payload?.SAT90}
          onChange={handleChange}
          className="form-control"
          name="SAT90"
        />
      ),
    },

    {
      TIME: "LOC",
      "15 min": (
        <Input
          id="LOC15"
          value={payload?.LOC15}
          onChange={handleChange}
          className="form-control"
          name="LOC15"
        />
      ),
      "30 min": (
        <Input
          id="LOC30"
          value={payload?.LOC30}
          onChange={handleChange}
          className="form-control"
          name="LOC30"
        />
      ),
      "45 min": (
        <Input
          id="LOC45"
          value={payload?.LOC45}
          onChange={handleChange}
          className="form-control"
          name="LOC45"
        />
      ),
      "60 min": (
        <Input
          id="LOC60"
          value={payload?.LOC60}
          onChange={handleChange}
          className="form-control"
          name="LOC60"
        />
      ),
      "75 min": (
        <Input
          id="LOC75"
          value={payload?.LOC75}
          onChange={handleChange}
          className="form-control"
          name="LOC75"
        />
      ),
      "90 min": (
        <Input
          id="LOC90"
          value={payload?.LOC90}
          onChange={handleChange}
          className="form-control"
          name="LOC90"
        />
      ),
    },

    {
      TIME: "HeadLift",
      "15 min": (
        <Input
          id="HeadLift15"
          value={payload?.HeadLift15}
          onChange={handleChange}
          className="form-control"
          name="HeadLift15"
        />
      ),
      "30 min": (
        <Input
          id="HeadLift30"
          value={payload?.HeadLift30}
          onChange={handleChange}
          className="form-control"
          name="HeadLift30"
        />
      ),
      "45 min": (
        <Input
          id="HeadLift45"
          value={payload?.HeadLift45}
          onChange={handleChange}
          className="form-control"
          name="HeadLift45"
        />
      ),
      "60 min": (
        <Input
          id="HeadLift60"
          value={payload?.HeadLift60}
          onChange={handleChange}
          className="form-control"
          name="HeadLift60"
        />
      ),
      "75 min": (
        <Input
          id="HeadLift75"
          value={payload?.HeadLift75}
          onChange={handleChange}
          className="form-control"
          name="HeadLift75"
        />
      ),
      "90 min": (
        <Input
          id="HeadLift90"
          value={payload?.HeadLift90}
          onChange={handleChange}
          className="form-control"
          name="HeadLift90"
        />
      ),
    },

    {
      TIME: "Limb Obs",
      "15 min": (
        <Input
          id="Limb15"
          value={payload?.Limb15}
          onChange={handleChange}
          className="form-control"
          name="Limb15"
        />
      ),
      "30 min": (
        <Input
          id="Limb30"
          value={payload?.Limb30}
          onChange={handleChange}
          className="form-control"
          name="Limb30"
        />
      ),
      "45 min": (
        <Input
          id="Limb45"
          value={payload?.Limb45}
          onChange={handleChange}
          className="form-control"
          name="Limb45"
        />
      ),
      "60 min": (
        <Input
          id="Limb60"
          value={payload?.Limb60}
          onChange={handleChange}
          className="form-control"
          name="Limb60"
        />
      ),
      "75 min": (
        <Input
          id="Limb75"
          value={payload?.Limb75}
          onChange={handleChange}
          className="form-control"
          name="Limb75"
        />
      ),
      "90 min": (
        <Input
          id="Limb90"
          value={payload?.Limb90}
          onChange={handleChange}
          className="form-control"
          name="Limb90"
        />
      ),
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
            className={`form-control ${field?.required}`}
            onChange={handleChange}
            placeholder={""}
          />
        );

      case "DatePicker":
        return (
          <DatePicker
            {...commonProps}
            handleChange={handleChange}
            {...field.extra}
          />
        );

      case "ReactSelect":
        return (
          <ReactSelect
            {...commonProps}
            value={String(payload[field.name])}
            placeholderName={t(field.label)}
            requiredClassName={`${field?.required}`}
            dynamicOptions={field.options}
            handleChange={handleSelectChange}
          />
        );

      case "TimePicker":
        return (
          <TimePicker
            {...commonProps}
            placeholderName={t("Time")}
            handleChange={handleDateTimeChange}
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

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const {
        Procedure,
        Diagnosis,
        Consent,
        MedicalHistory,
        LastTimeUrine,
        Jewellery,
        Gown,
        IdentityBand,
        Dentures,
        Caps,
        ContactLenses,
        Prosthesis,
      } = items;
      return {
        SNO: index + 1,
        Procedure,
        Diagnosis,
        Consent,
        MedicalHistory,
        LastTimeUrine,
        Jewellery,
        Gown,
        IdentityBand,
        Dentures,
        Caps,
        ContactLenses,
        Prosthesis,

        Edit: (
          <i className="fa fa-edit p-1" onClick={() => handleEdit(items)} />
        ),
        print: (
          <div onClick={() => handlePrint(items)}>
            <ReprintSVG />
          </div>
        ),
      };
    });
  };

  const handleGetData = async (PatientID) => {
    try {
      const APIresponse = await GetEndoscopyDataAPI(PatientID);
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

  const handlesave = async (update) => {
    try {
      debugger
      // if (!payload?.Caps) {
      //   return notify("Caps fields is Required", "warn")
      // }
      // if (!payload?.Gown) {
      //   return notify("Gown fields is Required", "warn")
      // }
      // if (!payload?.Dentures) {
      //   return notify("Dentures fields is Required", "warn")
      // }
      // if (!payload?.BowelPrep) {
      //   return notify("BowelPrep fields is Required", "warn")
      // }
      // if (!payload?.HIVTested) {
      //   return notify("HIVTested fields is Required", "warn")
      // }
      // if (!payload?.Jewellery) {
      //   return notify("Jewellery fields is Required", "warn")
      // }
      // if (!payload?.Prosthesis) {
      //   return notify("Prosthesis fields is Required", "warn")
      // }
      // if (!payload?.IdentityBand) {
      //   return notify("IdentityBand fields is Required", "warn")
      // }
      // if (!payload?.ContactLenses) {
      //   return notify("ContactLenses fields is Required", "warn")
      // }
      // if (!payload?.InformEndoscopyNurse) {
      //   return notify("InformEndoscopyNurse fields is Required", "warn")
      // }
      let response;
      if (update) {
        response = await EditEndoscopyDataAPI(saveUpdatePayload);
      } else {
        response = await SaveEndoscopyDataAPI(saveUpdatePayload);
      }

      if (response?.success) {
        notify(response?.message, "success");
        // setPayload(initialValues);
        handleGetData(PatientID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleGetData(PatientID);
  }, []);

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading
            title={t("Endoscopy Unit Checklist Details")}
            isBreadcrumb={false}
          />
          <div className="row p-2">
            {block6Config.map((field, index) => (
              <React.Fragment key={index}>{renderField(field)}</React.Fragment>
            ))}
          </div>
          <div className="row p-2">
            {block2Config.map((field, index) => (
              <React.Fragment key={index}>{renderField(field)}</React.Fragment>
            ))}
          </div>
          <div className="col-12">
            <Tables thead={T1_HEAD} tbody={T1_BODY} />
          </div>
        </div>
        <div className="p-2">
          {payload?.Id ? (
            <>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handlesave(true)}
              >
                {t("Update")}
              </button>
            </>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handlesave()}
            >
              {t("Save")}
            </button>
          )}{" "}
          <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
            {t("Cancel")}
          </button>
        </div>
      </div>
      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
};

export default EndoscopyUnitChecklist;
