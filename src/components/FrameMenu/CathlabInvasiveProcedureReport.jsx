import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import {
  getCathLabInvasiveProcDetailsApi,
  saveOrUpdateCathLabInvasiveProcApi,
} from "../../networkServices/nursingWardAPI";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
export const preProcedureFormConfig = [
  {
    section: "preProcedureRecord",
    title: "PRE PROCEDURE RECORD / (WARD / CATH LAB)",
    rows: [
      {
        label: "Admission Diagnosis",
        textKey: "admDiagnis",
        wardKey: "adWard",
        labKey: "adLab",
      },
      {
        label: "Informed Consent Signed",
        wardKey: "icsWard",
        labKey: "icsLab",
      },
      {
        label: "Allergy Form Signed (Any allergy to sea food)",
        wardKey: "afsWard",
        labKey: "afsLab",
      },
    ],
  },
  {
    section: "history",
    title: "HISTORY",
    rows: [
      {
        label: "Previous Angiogram / PTCA",
        wardKey: "paWard",
        labKey: "paLab",
      },
      {
        label: "Limb Claudication / Peripheral Vascular Disease",
        wardKey: "lcWard",
        labKey: "lcLab",
      },
      {
        label: "Back Problem / Arthritis",
        wardKey: "bpWard",
        labKey: "bpLab",
      },
      {
        label: "Bleeding Problem",
        wardKey: "blpWard",
        labKey: "blpLab",
      },
      {
        label: "On Aspirin / Anticoagulant",
        wardKey: "oaaWard",
        labKey: "oaaLab",
      },
    ],
  },
  {
    section: "investigation",
    title: "INVESTIGATION",
    rows: [
      {
        label: "Chest X-Ray",
        wardKey: "cxrWard",
        labKey: "cxrLab",
      },
      {
        label: "12 Lead ECG",
        wardKey: "leWard",
        labKey: "leLab",
      },
      {
        label: "HB, Urea, Creatinine, Potassium",
        textKey: "hbUreaCreatininePotassium",
        wardKey: "hucpWard",
        labKey: "hucpLab",
      },
      {
        label: "Serology Screening",
        textKey: "seroScreening",
        wardKey: "ssWard",
        labKey: "ssLab",
      },
      {
        label: "INR",
        textKey: "inr",
        wardKey: "inrWard",
        labKey: "inrLab",
      },
      {
        label: "Latest Blood Sugar for Diabetics",
        textKey: "latestBloodSugar",
        wardKey: "lbsfdWard",
        labKey: "lbsfdLab",
      },
      {
        label:
          "Grouping and Cross Matching (for PTCA / Valvuloplasty) – 2 units of blood",
        textKey: "groupAndCrossMatch",
        wardKey: "gacmWard",
        labKey: "gacmLab",
      },
    ],
  },
  {
    section: "medication",
    title: "MEDICATION",
    rows: [
      {
        label: "Drug Administration Record",
        textKey: "drugAdministrationRecord",
        wardKey: "darWard",
        labKey: "darLab",
      },
      {
        label: "Give Premedication as Ordered",
        textKey: "givePremedication",
        wardKey: "gpoWard",
        labKey: "gpoLab",
      },
      {
        label: "Give Antihypertensive Drug as Ordered",
        textKey: "giveAntihypertensive",
        wardKey: "gadadWard",
        labKey: "gadadLab",
      },
      {
        label: "Omit Hypoglycaemic Drugs / Anticoagulants",
        textKey: "omitHypoglycaemic",
        wardKey: "ohdaWard",
        labKey: "ohdaLab",
      },
      {
        label: "Insertion of Cannula (Left Arm)",
        wardKey: "iocWard",
        labKey: "ioclab",
      },
    ],
  },
  {
    section: "nursingCare",
    title: "NURSING CARE",
    rows: [
      {
        label: "Nil By Mouth 4–6 Hours",
        wardKey: "nbmWard",
        labKey: "nbmLab",
      },
      {
        label: "Bath / Shower Gown",
        wardKey: "bsgWard",
        labKey: "bsglab",
      },
      {
        label: "Theatre Pack",
        wardKey: "tpWard",
        labKey: "tpLab",
      },
      {
        label: "Identification Card Applied",
        wardKey: "icaWard",
        labKey: "icaLab",
      },
    ],
    extraRadios: [
      { label: "Jewellery Removed", key: "jewelleryRemoved" },
      { label: "Makeup Removed", key: "makeupRemoved" },
      { label: "Nail Polish Removed", key: "nailPolishRemoved" },
    ],
  },
  {
    section: "prosthetics",
    title: "PROSTHETICS (tick if remove / cross if not or non)",
    type: "radio",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    fields: [
      { label: "Contact Lens", key: "contactLens" },
      { label: "Hearing Aids", key: "hearingAids" },
      { label: "Caps", key: "caps" },
      { label: "Crowns", key: "crowns" },
      { label: "Dentures Removed", key: "denturesRemoved" },
      { label: "Bridge Work", key: "bridgeWork" },
    ],
  },
  {
    section: "observations",
    title: "OBSERVATIONS",
    type: "all",

    fields: [
      { label: "LMP", key: "lmp", type: "text" },
      { label: "Pulse", key: "pulse", type: "text" },
      { label: "Blood Pressure", key: "bp", type: "text" },
      { label: "Temperature", key: "temp", type: "text" },
      { label: "Weight", key: "weight", type: "text" },
      { label: "Height", key: "height", type: "text" },
    ],

    pulseStatus: [
      { label: "Palpable", key: "pppal", type: "checkbox" },
      { label: "Weak", key: "weak", type: "checkbox" },
      { label: "Absent", key: "alAbsent", type: "checkbox" },
    ],

    wardLabRows: [
      {
        label: "Bladder Emptied",
        textKey: "bladderEmptied",
        wardKey: "beWard",
        labKey: "beLab",
      },
      {
        label: "Urinalysis",
        textKey: "urinalysis",
        wardKey: "urlysWard",
        labKey: "urlysLab",
      },
    ],

    footerFields: [
      { label: "Handover By", key: "handoverBy", type: "text" },
      { label: "Received By", key: "receivedBy", type: "text" },
      { label: "Nature of Procedure", key: "natureOfProcedure", type: "text" },
    ],
  },
  {
    section: "periOperativeProcedure",
    title: "PERI OPERATIVE PROCEDURE",
    type: "all",
    pulseStatus: [
      {
        label: "RADIAL",
        key: "radial",
        type: "checkbox",
      },
      {
        label: "FEMORIAL",
        key: "femorial",
        type: "checkbox",
      },
      {
        label: "Right",
        key: "right",
        type: "checkbox",
      },
      {
        label: "Left",
        key: "left",
        type: "checkbox",
      },
      {
        label: "CONTRAST USED(TICK)",
        key: "contrastUsed",
        type: "checkbox",
      },
      {
        label: "Iconic",
        key: "iconic",
        type: "checkbox",
      },
      {
        label: "Non Iconic",
        key: "noneiconic",
        type: "checkbox",
      },
      {
        label: "Name Of Contrast",
        key: "nameOfContrast",
        type: "text",
      },
      {
        label: "amount Used",
        key: "amountUsed",
        type: "text",
      },
    ],
    PERIfields: [
      {
        label: "Name of Contrast",
        key: "contrastName",
        type: "text",
      },
      {
        label: "Amount Used",
        key: "contrastAmount",
        type: "text",
      },
    ],
  },
  {
    section: "sign",
    title: "SIGN",
    type: "all",
    pulseStatus: [
      {
        label: "Confirm all individuals have introduced themselves",
        type: "checkbox",
        key: "confirmIntroduced",
      },

      {
        label: "Confirm Patient Identity and Procedure",
        type: "checkbox",
        key: "confirmPatientIdentity",
      },
      {
        label: "verbalConsent",
        type: "checkbox",
        key: "verbalConsent",
      },
      {
        label: "writtenConsent",
        type: "checkbox",
        key: "writtenConsent",
      },
      {
        label: "Unable, document best interest decision",
        type: "checkbox",
        key: "unableConsent",
      },
      {
        label: "Does the Patient have a known allergy?",
        type: "checkbox",
        key: "knownAllergy",
      },

      {
        label: "Optimum insertion site selected",
        type: "option",
        options: [
          { label: "Radial", key: "optimumInsertionRadial" },
          { label: "Femoral", key: "optimumInsertionFemoral" },
          { label: "Right", key: "optimumInsertionRight" },
          { label: "Left", key: "optimumInsertionLeft" },
        ],
      },
      {
        label: "Confirm Team Credentials",
        type: "option",
        options: [
          { label: "Cardiologist", key: "teamCardiologist" },
          { label: "Registrar", key: "teamRegistrar" },
          { label: "CathLab Nurse", key: "teamCathLabNurse" },
          { label: "Physiologist", key: "teamPhysiologist" },
          { label: "Radiographer", key: "teamRadiographer" },
          { label: "HCA", key: "teamHca" },
        ],
      },
    ],
  },
  {
    section: "timeOut",
    title: "TIME OUT",
    type: "radio-text",
    timeOut: [
      {
        label: "Confirm Operators",
        type: "radio",
        key: "operatorsSterile",
      },
      {
        label: "Skin cleaned with antiseptic",
        type: "radio",
        key: "skinCleaned",
      },
      {
        label: "Contrast / Pressure lines checked",
        type: "radio",
        key: "pressureLinesReady",
      },
      {
        label: "Sterile Drape in Place",
        type: "radio",
        key: "sterileDrape",
      },
      {
        label: "All solution labelled appropriately",
        type: "radio",
        key: "solutionLabelled",
      },
      {
        label: "Operators are wearing radiology badges",
        type: "radio",
        key: "operatorsWearingRadiologyBadges",
      },
      {
        label: "Confirm guideline removed and intact",
        type: "radio",
        key: "act",
      },
      {
        label: "Confirm",
        type: "text",
        key: "confirmingOperator",
      },
      {
        label: "Scrub Nurse",
        type: "text",
        key: "scrubNurse",
      },
      {
        label: "Circulating Nurse",
        type: "text",
        key: "calculating",
      },
    ],
  },

  {
    section: "signOut",
    type: "radio-text",
    title: "SIGN OUT",
    signOut: [
      {
        label: "Catheters and guidewire/s accounted",
        type: "radio",
        key: "dar",
      },
      {
        label: "All Sharps accounted for and disposed",
        type: "radio",
        key: "groupandcrossmatch",
      },
      {
        label: "Sheath removed and haemostasis",
        type: "radio",
        key: "sheathRemoved",
      },
      {
        label: "Haemostasis Device Used",
        type: "checkbox-group",
        options: [
          { label: "Arm Band", key: "beWard" },
          { label: "ExoSeal", key: "beLab" },
          { label: "Manual Pressure", key: "pressureApplied" },
        ],
      },
      {
        label: "Documentation / Pathway initiated",
        type: "radio",
        key: "turnlsys",
      },
      {
        label: "Recovery Procedure",
        type: "checkbox-group",
        options: [
          { label: "Standard", key: "pppal" },
          { label: "Extra Measure (Specify)", key: "weak" },
        ],
      },
      {
        label: "Intra-Procedural Complications",
        type: "checkbox-group",
        options: [
          { label: "No", key: "absent" },
          { label: "Yes (Specify)", key: "alWeak" },
        ],
      },
      {
        label: "Intravenous cannula flushed",
        type: "checkbox-group",
        options: [
          { label: "No", key: "alAbsent" },
          { label: "Yes (Specify)", key: "hucp" },
        ],
      },
      {
        label: "Monitoring requirement for next 24 hours",
        type: "checkbox-group",
        options: [
          { label: "CCU", key: "iconic" },
          { label: "WARD", key: "noneiconic" },
          { label: "HOME", key: "palpable" },
        ],
      },
    ],
  },
  {
    section: "pacemaker",
    title: "PERMANENT PACEMAKER INSERTION",
    type: "text",
    pacemaker: [
      {
        label: "Preliminary Checks",
        needlesKey: "ppiNeedles",
        bladesKey: "ppiBlades",
      },
      {
        label: "Wound Exposure",
        needlesKey: "weNeedles",
        bladesKey: "weBlades",
      },
      {
        label: "Final Count",
        needlesKey: "fcNeedles",
        bladesKey: "fcBlades",
      },
    ],
  },
  {
    section: "woundClosure",
    title: "WOUND CLOSURE",
    type: "text",
    woundClosure: [
      { label: "Non Absorbable", key: "nonAbsorbable", type: "text" },
      { label: "Absorbable", key: "absorbable", type: "text" },
      { label: "Other", key: "other", type: "text" },
      { label: "Dressing Applied", key: "dressingApplied", type: "text" },
    ],
  },
  {
    section: "postProcedure",
    title: "ASSESSMENT POST PROCEDURE",
    postProcedure: [
      { label: "Blood Pressure", key: "appBloodPressure", type: "text" },
      { label: "Pulse", key: "appPulse", type: "text" },
      {
        label: "Chest Pain (Circle)",
        type: "radio",
        key: "chestPain",
      },
      {
        label: "Peripheral Pulses (Left)",
        type: "checkbox-group",
        options: [
          { label: "Palpable", key: "palpable" },
          { label: "Weak", key: "weak1" },
          { label: "Non Palpable", key: "nonpalpable" },
        ],
      },
      {
        label: "Peripheral Pulses (Right)",
        type: "checkbox-group",
        options: [
          { label: "Palpable", key: "rPalpable" },
          { label: "Weak", key: "rWeak" },
          { label: "Non Palpable", key: "rnonpalpable" },
        ],
      },
      {
        label: "Sheath Removed",
        type: "radio",
        key: "sheathRemoved",
      },
      { label: "Pressure Applied", key: "pressureApplied", type: "text" },
      {
        label: "Pressure Bandage Applied",
        type: "radio",
        key: "pressureBandageApplied",
      },
      { label: "Activating Clotting Time", key: "act", type: "text" },
      { label: "Scrub Nurse", key: "scrubNurse", type: "text" },
      { label: "Calculating Nurse", key: "calculating", type: "text" },
    ],
  },
];
const CathlabInvasiveProcedureReport = ({ data }) => {
  const [t] = useTranslation();
  const { transactionID } = data;
  const yesNoOptions = [
    { label: t("Yes"), value: "yes" },
    { label: t("No"), value: "no" },
  ];
  const [tableDataSaved, setTableDataSaved] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [payload, setPayload] = useState({
    id: 0,
    patientID: "",
    transactionID: "",

    adWard: "",
    adLab: "",

    icsWard: "",
    icsLab: "",

    afsWard: "",
    afsLab: "",

    paWard: "",
    paLab: "",

    lcWard: "",
    lcLab: "",

    bpWard: "",
    bpLab: "",

    blpWard: "",
    blpLab: "",

    oaaWard: "",
    oaaLab: "",

    cxrWard: "",
    cxrLab: "",

    leWard: "",
    leLab: "",

    hucpWard: "",
    hucpLab: "",

    ssWard: "",
    ssLab: "",

    inrWard: "",
    inrLab: "",

    lbsfdWard: "",
    lbsfdLab: "",

    gacmWard: "",
    gacmLab: "",

    darWard: "",
    darLab: "",

    gpoWard: "",
    gpoLab: "",

    gadadWard: "",
    gadadLab: "",

    ohdaWard: "",
    ohdaLab: "",

    iocWard: "",
    iocLab: "",

    nbmWard: "",
    nbmLab: "",

    bsgWard: "",
    bsgLab: "",

    tpWard: "",
    tpLab: "",

    icaWard: "",
    icaLab: "",

    pppal: "",
    weak: "",
    alWeak: "",
    alAbsent: "",

    beWard: "",
    beLab: "",

    urlysWard: "",
    urlysLab: "",

    radial: "",
    femorial: "",

    right: "",
    left: "",

    iconic: "",
    noneiconic: "",

    palpable: "",
    weak1: "",
    nonpalpable: "",

    rPalpable: "",
    rWeak: "",
    rNonpalpable: "",

    hucp: "",
    seroScreening: "",
    inr: "",
    groupandcrossmatch: "",
    dar: "",
    gpo: "",
    gadad: "",
    ohda: "",

    lmp: "",
    pulse: "",
    bp: "",
    temp: "",
    weight: "",
    height: "",

    bladderemptied: "",
    turnlsys: "",

    handoverby: "",
    receivedby: "",
    natureofproc: "",

    nameofcontrast: "",
    amountused: "",

    ppiNeedles: "",
    ppiBlades: "",

    weNeedles: "",
    weBlades: "",

    fcNeedles: "",
    fcBlades: "",

    nonAbsorbable: "",
    absorbable: "",
    other: "",
    dressingApplied: "",

    appBloodPressure: "",
    appPulse: "",
    pressureApplied: "",
    act: "",

    scrubNurse: "",
    calculating: "",

    jewelRemoved: "",
    makeupRemoved: "",
    nailPaintRemoved: "",

    contactLens: "",
    hearingAids: "",
    limbs: "",
    caps: "",
    crown: "",
    bridgework: "",
    dentureRemove: "",

    chestPain: "",
    sheathRemoved: "",
    pressureBandageApplied: "",

    admDiagnis: "",
    absent: "",
    latBloodSugar: "",
  });

  const THEADS = [
    { name: t("Sr.no"), width: "3%" },
    { name: t("PatientID") },
    { name: t("TransactionID") },
    { name: t("CreatedBy") },
    { name: t("Edit") },
  ];
  const handleReactSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value,
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  const fetchCathLabData = async () => {
    try {
      const res = await getCathLabInvasiveProcDetailsApi(transactionID);

      if (!res?.success || !Array.isArray(res.data) || res.data.length === 0) {
        setIsSaved(false);
        setIsEditMode(false);
        setTableDataSaved([]);
        return;
      }

      const record = res.data[0];

      setPayload((prev) => ({
        ...prev,
        ...record,
        patientID: data?.patientID,
        transactionID: data?.transactionID,
      }));

      setTableDataSaved(res.data);

      setIsSaved(true);
      setIsEditMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOrUpdate = async () => {
    try {
      const payloadToSend = {
        ...payload,
        patientID: data?.patientID,
        transactionID: data?.transactionID,
        id: isEditMode ? payload.id : 0,
      };

      const res = await saveOrUpdateCathLabInvasiveProcApi(payloadToSend);

      if (res?.success) {
        notify(res?.message || "Saved successfully", "success");

        await fetchCathLabData();
      } else {
        notify(res?.message || "Save failed", "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("Server error"), "error");
    }
  };

  const handleEdit = (item) => {
    console.log("EDIT CLICKED ID:", item.id);

    setPayload((prev) => ({
      ...prev,
      ...item,
      patientID: data?.patientID,
      transactionID: data?.transactionID,
    }));

    setIsEditMode(true);
    setIsSaved(false);
  };

  useEffect(() => {
    fetchCathLabData();
  }, [transactionID]);

  return (
    <div className="mt-2 card">
      {preProcedureFormConfig?.map((section, sIndex) => (
        <React.Fragment key={sIndex} className="">
          <Heading title={t(section.title)} />

          {section.rows && (
            <div className="row fw-bold mb-2">
              <div className="col-4"></div>
              <div className="col-4 text-center">{t("WARD")}</div>
              <div className="col-4 text-center">{t("LAB")}</div>
            </div>
          )}

          {section?.type !== "all" &&
            section?.type !== "radio" &&
            section?.rows?.map((row, index) => (
              <div className="row align-items-center p-2" key={index}>
                <div className="col-4">{row.label}</div>

                <div className="col-4">
                  {row.textKey && (
                    <Input
                      placeholder=""
                      id={row.textKey}
                      lable={row.label}
                      className="form-control"
                      type="text"
                      name={row.textKey}
                      value={payload[row.textKey] || ""}
                      onChange={handleChange}
                    />
                  )}

                  {row.wardKey && (
                    <ReactSelect
                      id={row.wardKey}
                      name={row.wardKey}
                      value={payload[row.wardKey] || ""}
                      placeholderName={t(row.wardKey)}
                      dynamicOptions={yesNoOptions}
                      handleChange={handleReactSelect}
                      removeIsClearable={true}
                    />
                  )}
                </div>

                <div className="col-4">
                  {row.labKey && (
                    <ReactSelect
                      id={row.labKey}
                      name={row.labKey}
                      placeholderName={t(row.labKey)}
                      value={payload[row.labKey] || ""}
                      dynamicOptions={yesNoOptions}
                      handleChange={handleReactSelect}
                      removeIsClearable={true}
                    />
                  )}
                </div>
              </div>
            ))}

          {section?.type !== "all" &&
            section.type !== "radio" &&
            section.fields?.map((field, i) => (
              <div className="row mb-2" key={i}>
                <div className="col-4">{field.label}</div>
                <div className="col-4">
                  <Input
                    placeholder={""}
                    id={field.key}
                    lable={field.key}
                    className={"form-control"}
                    type="text"
                    name={field.key}
                    value={payload[field.key] || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            ))}
          <div className="row p-2">
            {section.type === "radio" &&
              section.fields?.map((field) => (
                <ReactSelect
                  id={field.key}
                  name={field.key}
                  placeholderName={t(field.label)}
                  dynamicOptions={section.options}
                  value={payload[field.key]}
                  respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                  handleChange={handleReactSelect}
                  removeIsClearable={true}
                />
              ))}
          </div>
          <div className="row p-2">
            {section.type === "all" &&
              section.fields?.map((f) => (
                <Input
                  id={f.key}
                  placeholder={""}
                  respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                  lable={f.label}
                  name={f.key}
                  className={"form-control"}
                  value={payload[f.key] || ""}
                  onChange={handleChange}
                />
              ))}

            {section?.type === "all" &&
              section?.pulseStatus?.map((p) => (
                <div key={p.key} className="col-xl-2 col-md-3">
                  {p.type === "checkbox" && (
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(payload[p.key])}
                        onChange={(e) =>
                          setPayload((prev) => ({
                            ...prev,
                            [p.key]: e.target.checked,
                          }))
                        }
                      />
                      &nbsp;{p.label}
                    </label>
                  )}
                  {p.type === "text" && (
                    <Input
                      id={p.key}
                      placeholder={""}
                      respclass=""
                      lable={p.label}
                      name={p.key}
                      className={"form-control"}
                      value={payload[p.key] || ""}
                      onChange={handleChange}
                    />
                  )}

                  <div className="row">
                    {p?.type === "option" && (
                      <label className="fw-semibold  d-block">{p.label}</label>
                    )}
                    {p?.options?.map((opt) => (
                      <div
                        key={opt.key}
                        className="col-xl-6 col-lg-4 col-md-6 col-12"
                      >
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={opt.key}
                            checked={Boolean(payload[opt.key])}
                            onChange={(e) =>
                              setPayload((prev) => ({
                                ...prev,
                                [opt.key]: e.target.checked,
                              }))
                            }
                          />
                          <label
                            className="form-check-label ml-2"
                            htmlFor={opt.key}
                          >
                            {opt.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {section.type === "all" &&
              section.wardLabRows?.map((row) => (
                <React.Fragment key={row.label}>
                  <Input
                    id={row.textKey}
                    name={row.textKey}
                    lable={t(row.label)}
                    className="form-control"
                    respclass="col-xl-4 col-md-6 col-sm-12"
                    value={payload[row.textKey] || ""}
                    onChange={handleChange}
                  />
                  <ReactSelect
                    id={row.wardKey}
                    name={row.wardKey}
                    placeholderName={t("Ward")}
                    dynamicOptions={yesNoOptions}
                    value={payload[row.wardKey] || ""}
                    handleChange={handleReactSelect}
                    respclass="col-xl-4 col-md-6 col-sm-12"
                    removeIsClearable
                  />

                  <ReactSelect
                    id={row.labKey}
                    name={row.labKey}
                    placeholderName={t("Lab")}
                    dynamicOptions={yesNoOptions}
                    value={payload[row.labKey] || ""}
                    handleChange={handleReactSelect}
                    respclass="col-xl-4 col-md-6 col-sm-12"
                    removeIsClearable
                  />
                </React.Fragment>
              ))}

            {section?.type === "radio-text" &&
              section?.timeOut?.map((row) => (
                <div key={row.key} className="col-xl-2 col-md-6 col-sm-12 mb-2">
                  {row.type === "radio" && (
                    <ReactSelect
                      id={row.key}
                      name={row.key}
                      placeholderName={t(row.label)}
                      dynamicOptions={yesNoOptions}
                      value={payload[row.key]}
                      //   handleChange={(selected) =>
                      //     handleReactSelect(row.key, selected)
                      //   }
                      handleChange={handleReactSelect}
                      removeIsClearable
                    />
                  )}

                  {row.type === "text" && (
                    <Input
                      id={row.key}
                      name={row.key}
                      lable={t(row.label)}
                      className="form-control"
                      value={payload[row.key] || ""}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}

            {section?.type === "radio-text" &&
              section?.signOut?.map((row) => (
                <div key={row.key} className="col-xl-2 col-md-6 col-sm-12 mb-2">
                  {row.type === "radio" && (
                    <ReactSelect
                      id={row.key}
                      name={row.key}
                      placeholderName={t(row.label)}
                      dynamicOptions={yesNoOptions}
                      value={payload[row.key]}
                      handleChange={handleReactSelect}
                      removeIsClearable
                    />
                  )}
                  <div className="row">
                    {row?.type === "checkbox-group" && (
                      <label className="fw-semibold  d-block">
                        {row.label}
                      </label>
                    )}
                    {row?.options?.map((opt) => (
                      <div
                        key={opt.key}
                        className="col-xl-6 col-lg-4 col-md-6 col-12"
                      >
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={opt.key}
                            checked={Boolean(payload[opt.key])}
                            onChange={(e) =>
                              setPayload((prev) => ({
                                ...prev,
                                [opt.key]: e.target.checked,
                              }))
                            }
                          />
                          <label
                            className="form-check-label ml-2"
                            htmlFor={opt.key}
                          >
                            {opt.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {row.type === "text" && (
                    <Input
                      id={row.key}
                      name={row.key}
                      lable={t(row.label)}
                      className="form-control"
                      value={payload[row.key] || ""}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
          </div>
          {section?.type === "text" && section?.pacemaker && (
            <div className="row p-2">
              {section.pacemaker.map((row, index) => (
                <React.Fragment key={index}>
                  <div className="col-xl-2 col-md-4 col-sm-12 mb-2">
                    <Input
                      placeholder=""
                      id={row.needlesKey}
                      lable="Needles"
                      className="form-control"
                      type="text"
                      name={row.needlesKey}
                      value={payload[row.needlesKey] || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-xl-2 col-md-4 col-sm-12 mb-2">
                    <Input
                      placeholder=""
                      id={row.bladesKey}
                      lable="Blades"
                      className="form-control"
                      type="text"
                      name={row.bladesKey}
                      value={payload[row.bladesKey] || ""}
                      onChange={handleChange}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {section?.type === "text" && section?.woundClosure && (
            <div className="row p-2">
              {section?.woundClosure?.map((row, index) => (
                <div className="col-xl-2 col-md-4 col-sm-12 mb-2">
                  <Input
                    placeholder=""
                    id={row.key}
                    lable={row.key}
                    className="form-control"
                    type="text"
                    name={row.key}
                    value={payload[row.key] || ""}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>
          )}

          {section?.postProcedure && (
            <div className="row p-2">
              {section.postProcedure.map((row, index) => (
                <React.Fragment key={index}>
                  {row?.type === "text" && (
                    <div className="col-xl-2 col-md-4 col-sm-12 mb-2">
                      <Input
                        placeholder=""
                        id={row.key}
                        lable={row.key}
                        className="form-control"
                        type="text"
                        name={row.key}
                        value={payload[row.key] || ""}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  {row?.type === "radio" && (
                    <div className="col-xl-2 col-md-4 col-sm-12 mb-2">
                      <ReactSelect
                        name={row.key}
                        key={row.key}
                        id={row.key}
                        placeholderName={row.key}
                        value={payload[row.key]}
                        dynamicOptions={yesNoOptions}
                        handleChange={handleReactSelect}
                        removeIsClearable={true}
                      />
                    </div>
                  )}

                  {row?.type === "checkbox-group" && (
                    <label className="fw-semibold  d-block">{row.label}</label>
                  )}
                  {row?.options?.map((opt) => (
                    <div
                      key={opt.key}
                      className="col-xl-2 col-lg-4 col-md-6 col-12"
                    >
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={opt.key}
                          checked={Boolean(payload[opt.key])}
                          onChange={(e) =>
                            setPayload((prev) => ({
                              ...prev,
                              [opt.key]: e.target.checked,
                            }))
                          }
                        />
                        <label
                          className="form-check-label ml-2"
                          htmlFor={opt.key}
                        >
                          {opt.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
        </React.Fragment>
      ))}
      <div className="col-12 d-flex justify-content-end mb-2">
        {!isEditMode && (
          <button
            className="btn btn-success px-4"
            onClick={handleSaveOrUpdate}
            disabled={isSaved}
          >
            {t("Save")}
          </button>
        )}

        {isEditMode && (
          <button className="btn btn-warning px-4" onClick={handleSaveOrUpdate}>
            {t("Update")}
          </button>
        )}
      </div>

      <Tables
        thead={THEADS}
        tbody={tableDataSaved.map((item, index) => ({
          SRrNo: index + 1,
          PatientID: item?.patientID || data?.patientID,
          TransactionID: item?.transactionID || data?.transactionID,
          CreatedBy: item?.createdBy,
          Edit: (
            <i
              className="fa fa-edit"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => handleEdit(item)}
            />
          ),
        }))}
      />
    </div>
  );
};

export default CathlabInvasiveProcedureReport;
