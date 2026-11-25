import React, { useEffect, useMemo, useState, useRef, Suspense } from "react";
import LabeledInput from "../../../../formComponent/LabeledInput";
import Table from "react-bootstrap/Table";
import { useTranslation } from "react-i18next";
import logoitdose from "../../../../../assets/image/logoitdose.png";
import DoctorDetails from "../../../../HelpDesk/DoctorDetails";
import MedicalInfoModal from "../../../../../components/modalComponent/Utils/MedicalInfoModal";
import Confirm from "../../../../modalComponent/Confirm";
import { GetRunningMedicines } from "../../../../../networkServices/doctorRunningMedicineApi";
import { SaveDoctorVitals } from "../../../../../networkServices/doctorVitalsApi";
import {
  findRunningMedicine,
  describeRunningMedicine,
  normaliseMedicineName,
  tSentence,
} from "../../../../../utils/runningMedicineCheck";
import {
  LoadPrescriptionView,
  updateFileClosed,
  saveTemplateAPI,
  getListBindMenu,
  holdAPI,
  setGetOutPatientAPI,
  getGetDoctor,
  SaveMedicineTemplate,
  SavePrescriptionForm,
  SaveSMS,
  sendEmail,
  GetPrescription,
  UpdateCall,
  SavePrescriptionDraft,
  GetOldAppointentData,
  getGetMolecular,
  DoctorPrescriptionGetTopSuggestion,
  CommonAPIGetDoctorIDByEmployeeID,
  DoctorGetPrescriptionview,
  DoctorUpdatePrescriptionview,
  updateFileOpen,
  saveInvestigationFavoriteTemplateApi,
  getInvestigationFavoriteTemplateApi,
  getInvestigationFavoriteTemplateDetailsApi,
  getLabRadiologyCategoryApi,
  getLabRadiologySubCategoryApi,
  GetEditTemplate,
  LoadInvestigation,
} from "../../../../../networkServices/DoctorApi";
import Modal from "../../../../modalComponent/Modal";
import TemplateSearchModal from "../../../../modalComponent/Utils/TemplateSearchModal";
import AIPrescriptionSuggestModal from "../../../../Doctor/AIPrescriptionSuggestModal";
import { translateIfKnown } from "../../../../WrapTranslate";
import { parseAgeYears } from "../../../../../utils/prescriptionSuggestLogic";
import Heading from "../../../Heading";
import { AutoComplete } from "primereact/autocomplete";
import {
  handleActiveInputVoiceToText,
  notify,
  reactSelectOptionList,
} from "../../../../../utils/utils";
import Favorite from "./Favorite";
import PrescribedMedicineTable, { RxReorderToggle } from "./PrescribedMedicineTable";
import { isFilledMedicineRow } from "./MedicineReorderPanel";
import SystemMaticEmergency from "../../../../Doctor/SystemMaticEmergency";
import {
  AUTOCOMPLETE_STATE,
  PRESCRIBED_MEDICINE,
} from "../../../../../utils/constant";
import ReactSelect from "../../../../formComponent/ReactSelect";

import ScrollComponent from "../../../../ScrollComponent";
import DatePicker from "../../../../formComponent/DatePicker";
import TransferReffralConsultation from "../../../../Doctor/TransferReffralConsultation";

import SaveButton from "@components/UI/SaveButton";
import CancelButton from "../../../CancelButton";
import UserInfoPedia from "../../../../Doctor/UserInfoPedia";
import { useLocalStorage } from "../../../../../utils/hooks/useLocalStorage";
import moment from "moment";
import SeeMore from "../../../SeeMore";
import SendSMSDoctor from "../../../../modalComponent/Utils/SendSMSDoctor";
import { getBindVital } from "../../../../../store/reducers/DoctorModule/VitalSign";
import { useDispatch } from "react-redux";
import useSpeechRecognition from "../../../../../utils/hooks/useSpeechRecognition";
import SendEmailDoctor from "../../../../modalComponent/Utils/SendEmailDoctor";
// import useSpeechToText from "react-hook-speech-to-text";
import DoctorPresciptionOrdering from "../../../../../pages/doctor/Settings/DoctorPresciptionOrdering";
import DoctorLeave from "../../../../../pages/doctor/Settings/DoctorLeave";
import OverLay from "../../../../modalComponent/OverLay";
import PrintSetting from "../../../../../pages/doctor/Settings/PrintSetting";
import AddCustomTabing from "../../../../../pages/doctor/Settings/AddCustomTabing";
import DoctorNotAvailble from "../../../../../pages/doctor/Settings/DoctorNotAvailble";
import { toggleFullScreen } from "../../../../../utils/helpers";
import DocVitalSignPatientDetailCard from "../../../../commonComponents/DocVitalSignPatientDetailCard";
import SlideScreen from "../../../../front-office/SlideScreen";
import SeeMoreSlideScreen from "../../../SeeMoreSlideScreen";
import { PatientSearchbyBarcode } from "../../../../../networkServices/opdserviceAPI";
import { CCTemplateMapGetBindValues } from "../../../../../networkServices/CCTemplateMapApi";
import { getConsultationHeaderInfo } from "../../../../../networkServices/cardPrint";
import { useSelector } from "react-redux";
import FollowUpAppointmentModal from "@components/Doctor/FollowUpAppointmentModal";
import icBookFollowUp from "@app/assets/image/doctor-toolbar/book-followup.svg";
import Input from "@app/components/formComponent/Input";
import { Tooltip } from "primereact/tooltip";
import MenstrualAndObstetric from "./ComponentPrescription/MenstrualAndObstetric";
import PreviousPregnancyTable from "./ComponentPrescription/PreviousPregnancyTable";
import FamilyHistoryTable from "./ComponentPrescription/FamilyHistoryTable";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import TextAreaInput from "../../../../formComponent/TextAreaInput";
import { Next } from "react-bootstrap/esm/PageItem";
import SingleNameCreateTemplateModal from "./SingleNameCreateTemplateModal";
import SuggestionTextarea from "../../../../formComponent/SuggestionTextarea";
import ChipAutocomplete from "../../../../commonComponents/ChipAutocomplete";
import { GetBindSpouseAppointments } from "../../../../../networkServices/IVFCounsellingAPI";
// import DoctorAssisstance from "../../../../../layouts/Chatbot/DoctorAssisstance";
import DrugInteractionWidget, {
  lookupInteractions,
  getGeminiInteractions,
  getGeminiDiseaseContraindications,
  getGeminiLabAlerts,
  getGeminiPregnancyAlerts,
  splitPatientDiagnoses,
} from "../../../../../layouts/Chatbot/DrugInteractionWidget";
// Pregnancy / breast-feeding leg (KMSI A6): reads the Pregnant vital and the obstetric
// block already loaded into loadSaveData - no extra request on this page.
import { pregnancyFromPrescriptionData } from "../../../../../utils/patientPregnancyContext";
// Liver / kidney function leg (KMSI A5): last 30 days of labs + Cockcroft-Gault CrCl.
import {
  loadRecentLabContext,
  patientMetaLine,
} from "../../../../../utils/patientLabContext";
// Saved ICD diagnoses (Final Diagnosis) — the disease side of the drug-vs-disease alert.
import { GetPatientDiagnosis as GetPatientDiagnosisForAlert } from "../../../../../networkServices/DoctorApi";
import MedicalAssistant from "../../../../../layouts/Chatbot/AIPatientSummary";
import NotePadModal from "@components/modalComponent/Utils/NotePadModal";
import "./AISummaryPanel.css";
// import CancelButton from "../UI/CancelButton";

// Not Found Component
const NotFound = () => { const [t] = useTranslation(); return ( <div>{t("Component Not Found")}</div>); };

function formatString(str) {
  return str
    .replace(/([A-Z])/g, " $1") // Add space before each capital letter
    .replace(/^./, (char) => char.toUpperCase()); // Capitalize the first letter
}

const { VITE_APP_REACT_APP_DOCTOR_PRESCRIPTION_ZOOM } = import.meta.env;
const isZoom = VITE_APP_REACT_APP_DOCTOR_PRESCRIPTION_ZOOM ?? false;

let SExamination = [
  "CVS",
  "RS",
  "PA",
  "CNS",
  "General",
  "ENT",
  "pallor",
  "odema",
  "uterus",
  "varicoseVeins",
  "respiratory",
  "anyAdventitiousSounds",
  "breasts",
];

const AppointmentPatientDetail = ({
  setActive,
  type,
  TotaltableData,
  selectedIndex,
  handleCallButtonClick,
  SearchOPDBillsCallAPI,
  fetchAllApiData,
  getUpdateInAPI,
  getDoctorID,
  setItems,
  items,
  checkGetDoctorIDForTransationID,
  getUser,
  docterError,
  getCall,
  handleSearchPrescribeMedicine,
  docID,
  getUpdateCallAPI,
  getUpdateUncall,
  setMedicalInfoData,
  medicalData,
  showFlowSheet,
  showMedicationCalendar,
  showNotesModal,
  setShowFlowSheet,
  setShowMedicationCalendar,
  setShowNotesModal,
}) => {
  const [currentDoctorID, setCurrentDoctorID] = useState(null);
  const [doctorTopSuggestions, setDoctorTopSuggestions] = useState([]);
  const [transformedSuggestions, setTransformedSuggestions] = useState([]);
  const dispatch = useDispatch();
  const [presTable, setPresTable] = useState([]);
  const { VITE_DATE_FORMAT } = import.meta.env;
  const showSuggestions = import.meta.env.VITE_APP_FIELD_VISIBILITY === "true";

  const localData = useLocalStorage("userData", "get");
  const [loadSaveData, setLoadSaveData] = useState({});
  const [isPrescriptionButton, setIsPrescriptionButton] = useState(false);
  const [isDocChecked, setIsDocChecked] = useState(false);
  const [labCategoryList, setLabCategoryList] = useState([]);
  const [textAreaSuggestions, setTextAreaSuggestions] = useState([]);
  const [labSubCategoryList, setLabSubCategoryList] = useState([]);
  const [labCategoryIds, setLabCategoryIds] = useState({
    categoryId: "",
    subCategoryId: "",
  });
  //pregnancy basic details state getting updated form userInfoPedia
  const [pregnancyDetails, setPregnancyDetails] = useState({});
  //Previous Pregnancy Table State
  const [previousPregnancyData, setPreviousPregnancyData] = useState([]);
  const [familyHistoryData, setFamilyHistoryData] = useState([]);
  const [isDeleteTemplate, setIsDeleteTemplate] = useState(false);
  const reloadDoctor = useSelector((state) => state.reloadDoctor.loading);
  const selectedFromSuggestion = useRef({});
  const [runReport, setRunReport] = useState(false);
  const [open, setOpen] = useState(false);
  /* "Book Follow-up Appointment" on the Next Visit block. Nothing is fetched
     until it opens - see FollowUpAppointmentModal. */
  const [showFollowUpBooking, setShowFollowUpBooking] = useState(false);
  const [prisciptionForm, setPrisciptionForm] = useState({
    Allergies: "",
    NextVisit: new Date(),
    NextVisitRemarks: "",
    ConfidentialData: "",
    // SystematicExamination: {
    CNS: "",
    ENT: "",
    RS: "",
    PA: "",
    General: "",
    CVS: "",
    // },
    TransferReferralForConsultation: "",
    DoctorType: "",
    department: "",
    referTo: "",
    referralType: "",
    consultType: "",
    ImpressionDiagnosis: "",
    Remarks: "",
    //New items added akay--->>
    MenstrualAndObstetricsHistory: {},
    DeatilsOfPreviousPregnancies: {},
    FamilyHistory: {},
    FamilyHistoryRemark: "",
    RiskFactor: "",
    AnyAncHospitalisations: "",
    NST: "",
    PelvicAssessment: "",
    ParturitionDetailsAndOutCome: "",
    pallor: "",
    odema: "",
    uterus: "",
    varicoseVeins: "",
    nodes: "",
    respiratory: "",
    breasts: "",
    anyAdventitiousSounds: "",
    knownOfs: [],
    keyNote: [],
    previousDoctor: [],
    paExaminantion: "",
    pvExaminantion: "",
    historyOfCovid: "",
    historyOfPresentIllness: "",
    surgicalHistory: "",
    FamilyHistoryRemark: "",
    imunigrationHistory: "",
    precaution: "",
    admissionRequired: false,
    AdmissionDate: "",
    NutritionAdviseRemarks: "",
    NutritionAdvise: "",
    doctorRemarks: "",
    doctorAdditionalAdvice: "",
  });

  const [showAISummary, setShowAISummary] = useState(false);
  const [showNotPad, setShowNotPad] = useState(false);
  const [notepadTextForAI, setNotepadTextForAI] = useState("");

  const { getBindVitalData } = useSelector((state) => state.vitalSignSlice);

  const [vitalSign, setVitalSign] = useState({
    wt: "",
    t: "",
    p: "",
    bp: "",
    respiratory: "",
    spO2: "",
    ht: "",
    allergy: "",
    ID: "",
  });

  const [shouldSaveDraft, setShouldSaveDraft] = useState(false);

  // const removeTagprisciptionForm = (key) => {
  //   if (key === "NextVisit") {
  //     setPrisciptionForm((val) => ({ ...val, [key]: new Date() }));
  //   } else {
  //     setPrisciptionForm((val) => ({ ...val, [key]: "" }));
  //   }
  // };
  const removeTagprisciptionForm = (key, value = "") => {
    if (key === "NextVisit") {
      setPrisciptionForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    } else {
      setPrisciptionForm((val) => ({ ...val, [key]: "" }));
    }
  };

  const childRef = useRef(null);
  const [t] = useTranslation();

  // const [inputValue, setInputValue] = useState({
  //   "Investigation(Lab & Radio)": "",
  //   "Prescribed Procedure": "",
  //   "Sign & Symptoms": "",
  //   "Doctor Notes": "",
  //   "Chief Complaint": "",
  //   "Vaccination Status": "",
  //   "Past History": "",
  //   "Provisional Diagnosis": "",
  //   "Doctor Advice": "",
  //   "Treatment History": "",
  //   "Personal/Occupational History": "",
  //   "General Examination": "",
  //   "Diet": "",

  // });

  const [inputValue, setInputValue] = useState({
    Allergies: "",
    "PA Examination": "",
    "PV Examination": "",
    "Prescribed Medicine": "",
    "Known OFF": "",
    "Chief Complaint": "",
    "Menstrual And Obstetrics History": "",
    "Vaccination Status": "",
    "Doctor Advice": "",
    "Investigation(Lab & Radio)": "",
    Remarks: "",

    "Provisional Diagnosis": "",
    "Prescribed Procedure": "",
    "Deatils Of Previous Pregnancies": "",
    "Transfer/Referral For Consultation": "",
    "Personal/Occupational History": "",
    "General Examination": "",
    NextVisit: "",
    NextVisitRemarks: "",

    "Risk Factor": "",
    "Any Anc Hospitalisations": "",
    "Confidential Data": "",
    Diet: "",
    "Past History": "",
    "Molecular Allergies": "",
    "Treatment History": "",
    "Family History": "",
    NST: "",
    "Pelvic Assessment": "",
    "Sign & Symptoms": "",
    "Parturition Details & OutCome": "",
    "Previous Doctor": "",
    "Key Note": "",
    "Doctor Notes": "",
    "Systematic Examination": "",
  });

  const doctorSuggestionCategories = [
    "Allergies",
    "PA Examination",
    "PV Examination",
    "Prescribed Medicine",
    "Chief Complaint",
    "Vaccination Status",
    "Doctor Advice",
    "Investigation(Lab & Radio)",
    "Provisional Diagnosis",
    "Prescribed Procedure",
    "General Examination",
    "Risk Factor",
    "Any Anc Hospitalisations",
    "Diet",
    "NST",
    "Pelvic Assessment",
    "Sign & Symptoms",
    "Parturition Details & OutCome",
    "Key Note",
    "Doctor Notes",
  ];

  const fieldMapping = {
    Allergies: "allergies",
    "PA Examination": "paExaminantion",
    "PV Examination": "pvExaminantion",
    "Prescribed Medicine": "medicines",
    "Chief Complaint": "chiefComplaint",
    "Vaccination Status": "vaccinationStatus",
    "Doctor Advice": "doctorAdvice",
    "Investigation(Lab & Radio)": "investigations",
    "Provisional Diagnosis": "provisionalDiagnosis",
    "Prescribed Procedure": "procedures",
    "General Examination": "generalExamination",
    "Risk Factor": "riskFactors",
    "Any Anc Hospitalisations": "anyAncHospitalisations",
    Diet: "diet",
    NST: "nst",
    "Pelvic Assessment": "pelvicAssesment",
    "Sign & Symptoms": "clinicalExamination",
    "Parturition Details & OutCome": "parturitionDetails",
    "Key Note": "keyNote",
    "Doctor Notes": "doctorNotes",
    "Known OFF": "knownOfs",
    "Past History": "progressionComplaint",
    "Treatment History": "medications",
    "Previous Doctor": "previousDoctor",
    "Personal/Occupational History": "personalHistory",
  };
  const [apiData, setApiData] = useState({
    getCPEOMenuList: [],
    getBindConsentTypeAPI: [],
    getBindTemplateAPI: [],
    getBindPatientConsentAPI: [],
    getOldAppointentDataAPI: [],
    getOldSpouseAppointentDataAPI: [],
  });
  const [editTagIndex, setEditTagIndex] = useState(null);

  const handleTagDoubleClick = (event, category, index) => {
    setEditTagIndex(`${category}-${index}`);
    event.target.setAttribute("contentEditable", "true");
    event.target.focus();
  };
  const handleTagBlur = (event, category, index) => {
    const updatedValue = event.target.innerText.trim();

    setTags((prevTags) => ({
      ...prevTags,
      [category]: prevTags[category].map((tag, i) =>
        i === index ? { ...tag, ValueField: updatedValue } : tag,
      ),
    }));

    event.target.removeAttribute("contentEditable");
    setEditTagIndex(null);
  };

  const handleTagKeyPress = (event, category, index) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents new lines inside span
      event.target.blur(); // Saves and exits editing mode
    }
  };

  const [filteredItems, setFilteredItems] = useState(AUTOCOMPLETE_STATE);

  const [actionType, setActionType] = useState("Save");
  const [prescription, setPrescription] = useState([]);
  const [tags, setTags] = useState({
    ...AUTOCOMPLETE_STATE,
    NextVisit: [],
    TransferReferral: [],
  });
  const [interactionResults, setInteractionResults] = useState(null);
  const prescribedMedicineNames =
    tags["Prescribed Medicine"]
      ?.filter((item) => item?.Name?.ID || item?.Name?.isDisable)
      ?.map((item) => item.Name.value)
      ?.join(", ") || "";
  const handleClickOpenDrugInteraction = () => {
    setOpen(true);
  };

  /* Drug vs disease contraindication alert (KMSI A3).

     Runs through the same Gemini pipeline as the drug-drug and drug-allergy checks. The
     disease side is everything the page knows about the patient's conditions:
       - saved ICD diagnoses (Final Diagnosis screen, GetPatientDiagnosis)
       - the Provisional Diagnosis and Past History tags typed on this page
       - the Impression / Diagnosis free-text field
     Switchable per client: fin_global_resources "DrugDiseaseContraindicationAlert" = 0
     turns it off; no row (or any other value) leaves it on, like the interaction check. */
  const globalResourcesForAlert = useSelector(
    (state) => state?.CommonSlice?.GetGlobalResources,
  );
  const diseaseAlertEnabled = useMemo(() => {
    const list = Array.isArray(globalResourcesForAlert)
      ? globalResourcesForAlert
      : globalResourcesForAlert?.data || [];
    const row = list?.find(
      (item) => item?.Name === "DrugDiseaseContraindicationAlert",
    );
    return !row || String(row?.Value).trim() !== "0";
  }, [globalResourcesForAlert]);

  /* Liver / kidney function alert (KMSI A5). Same switch style as the disease alert:
     fin_global_resources "DrugLabFunctionAlert" = 0 turns it off; otherwise on. */
  const labAlertEnabled = useMemo(() => {
    const list = Array.isArray(globalResourcesForAlert)
      ? globalResourcesForAlert
      : globalResourcesForAlert?.data || [];
    const row = list?.find((item) => item?.Name === "DrugLabFunctionAlert");
    return !row || String(row?.Value).trim() !== "0";
  }, [globalResourcesForAlert]);

  // Lab context is fetched once per patient (+ typed weight, which changes the CrCl).
  const labContextRef = useRef({ key: "", value: null });
  const loadPatientLabsForAlert = async () => {
    const current = patientDetail?.currentPatient;
    if (!current?.PatientID || !labAlertEnabled) return null;
    const key = `${current.PatientID}|${current.TransactionID || ""}|${vitalSign?.wt || ""}`;
    if (labContextRef.current.key === key && labContextRef.current.value) {
      return labContextRef.current.value;
    }
    const value = await loadRecentLabContext(current, {
      days: 30,
      weightKg: vitalSign?.wt,
    });
    labContextRef.current = { key, value };
    return value;
  };

  /* Pregnancy / breast-feeding alert (KMSI A6). fin_global_resources
     "DrugPregnancyAlert" = 0 turns it off; otherwise on. */
  const pregnancyAlertEnabled = useMemo(() => {
    const list = Array.isArray(globalResourcesForAlert)
      ? globalResourcesForAlert
      : globalResourcesForAlert?.data || [];
    const row = list?.find((item) => item?.Name === "DrugPregnancyAlert");
    return !row || String(row?.Value).trim() !== "0";
  }, [globalResourcesForAlert]);

  const loadPatientPregnancyForAlert = async () =>
    pregnancyAlertEnabled
      ? pregnancyFromPrescriptionData(loadSaveData, {
          ...(patientDetail?.currentPatient || {}),
          Gender: patientDetail?.currentPatient?.Gender || patientDetail?.currentPatient?.Sex,
        })
      : null;

  // Name + item id + composition of every prescribed medicine, for the Drug Information
  // drawer in the checker.
  const medicineItemsForAlert = (tags["Prescribed Medicine"] || [])
    .filter((item) => item?.Name?.ID || item?.Name?.isDisable)
    .map((item) => ({
      name: item?.Name?.value || "",
      itemID: item?.Name?.ID || "",
      generic:
        item?.Name?.Generic ??
        item?.Name?.composition ??
        item?.AllItemListData?.Generic ??
        item?.AllItemListData?.composition ??
        "",
    }))
    .filter((m) => m.name);

  /* High-risk acknowledgements from the checker (KMSI A8). Stored on the medicine rows
     as `AlertAcknowledgement` so they travel with the prescription state; persisting
     them server-side needs the save API to accept the field (C19 audit trail). */
  const handleAlertAcknowledge = (acks) => {
    const entries = Object.values(acks || {});
    if (!entries.length) return;
    setTags((prev) => {
      const rows = [...(prev["Prescribed Medicine"] || [])];
      let changed = false;
      const next = rows.map((row) => {
        const name = String(row?.Name?.value || "").toLowerCase();
        if (!name) return row;
        const mine = entries.filter((a) =>
          String(a?.title || "").toLowerCase().includes(name),
        );
        if (!mine.length) return row;
        const text = mine
          .map((a) => `${a.title}: OK - ${a.comment}${a.by ? " (" + a.by + ")" : ""}`)
          .join(" | ");
        if (row.AlertAcknowledgement === text) return row;
        changed = true;
        return { ...row, AlertAcknowledgement: text };
      });
      return changed ? { ...prev, "Prescribed Medicine": next } : prev;
    });
  };

  const tagText = (key) =>
    (tags?.[key] || [])
      .map((item) => item?.ValueField ?? item?.value ?? item)
      .filter((v) => typeof v === "string" && v.trim());

  const localDiagnosisText = [
    ...tagText("Provisional Diagnosis"),
    ...tagText("Past History"),
    prisciptionForm?.ImpressionDiagnosis || "",
  ]
    .filter(Boolean)
    .join("; ");

  // Saved ICD rows, fetched once per patient and cached (they change only on the Final
  // Diagnosis screen, which reloads this page's patient anyway).
  const savedDiagnosesRef = useRef({ key: "", list: [] });
  const loadSavedDiagnoses = async () => {
    const current = patientDetail?.currentPatient;
    const key = `${current?.PatientID || ""}|${current?.TransactionID || ""}|${current?.App_ID || ""}`;
    if (!current?.PatientID) return [];
    if (savedDiagnosesRef.current.key === key) return savedDiagnosesRef.current.list;
    try {
      const res = await GetPatientDiagnosisForAlert({
        patientID: current?.PatientID,
        transactionID: current?.TransactionID,
        appID: current?.App_ID,
      });
      const rows = Array.isArray(res?.data) ? res.data : [];
      const list = rows
        .map((row) => {
          const desc = row?.WHO_Full_Desc || row?.Group_Desc || "";
          const code = row?.ICD || "";
          if (!desc && !code) return "";
          return code ? `${desc} (ICD ${code})` : desc;
        })
        .filter(Boolean);
      savedDiagnosesRef.current = { key, list };
      return list;
    } catch (error) {
      console.error("Saved diagnosis lookup failed:", error);
      return [];
    }
  };

  const loadPatientDiagnosesForAlert = async () =>
    splitPatientDiagnoses([
      ...(await loadSavedDiagnoses()),
      ...splitPatientDiagnoses(localDiagnosisText),
    ]);

  const currentMedicineNames = () =>
    (tags["Prescribed Medicine"] || [])
      .filter((item) => item?.Name?.ID || item?.Name?.isDisable)
      .map((m) => m.Name?.value)
      .filter(Boolean);

  /* Pairs (drug|disease) already shown to the doctor this visit. The check re-runs from
     three places — a medicine added, a diagnosis typed, an ICD saved — and the checker
     must not pop again for the same finding each time. New findings still open it. */
  const shownDiseaseAlertsRef = useRef(new Set());

  /**
   * Check `drugNames` against the patient's current diagnoses and open the checker if
   * there is anything the doctor has not seen yet. Returns the matches.
   */
  const runDiseaseCheck = async (drugNames, extraMatches = []) => {
    if (
      (!diseaseAlertEnabled && !labAlertEnabled && !pregnancyAlertEnabled) ||
      !drugNames?.length
    ) {
      return [];
    }

    // Disease leg
    let diseaseMatches = [];
    if (diseaseAlertEnabled) {
      try {
        const diagnoses = await loadPatientDiagnosesForAlert();
        if (diagnoses.length) {
          diseaseMatches = await getGeminiDiseaseContraindications(
            drugNames,
            diagnoses,
          );
        }
      } catch (err) {
        console.error("Drug-disease check failed:", err);
      }
    }

    // Liver / kidney (lab) leg
    let labMatches = [];
    if (labAlertEnabled) {
      try {
        const labCtx = await loadPatientLabsForAlert();
        if (labCtx?.lines?.length) {
          labMatches = await getGeminiLabAlerts(
            drugNames,
            labCtx.lines,
            patientMetaLine(labCtx.meta),
          );
        }
      } catch (err) {
        console.error("Drug-lab (organ function) check failed:", err);
      }
    }

    // Pregnancy / breast-feeding leg
    let pregnancyMatches = [];
    if (pregnancyAlertEnabled) {
      try {
        const pregCtx = await loadPatientPregnancyForAlert();
        if (pregCtx?.applicable && pregCtx?.line) {
          pregnancyMatches = await getGeminiPregnancyAlerts(drugNames, pregCtx.line);
        }
      } catch (err) {
        console.error("Drug-pregnancy check failed:", err);
      }
    }

    const keyOf = (m) =>
      `${m.drug}|${m.disease ?? m.parameter ?? m.category ?? ""}`.toLowerCase();
    const unseen = [...diseaseMatches, ...labMatches, ...pregnancyMatches].filter(
      (m) => !shownDiseaseAlertsRef.current.has(keyOf(m)),
    );
    unseen.forEach((m) => shownDiseaseAlertsRef.current.add(keyOf(m)));

    if (unseen.length > 0 || extraMatches.length > 0) {
      setInteractionResults({
        matches: extraMatches,
        diseaseMatches,
        labMatches,
        pregnancyMatches,
        numDrugs: currentMedicineNames().length,
      });
      setOpen(true);
    }
    return [...diseaseMatches, ...labMatches, ...pregnancyMatches];
  };

  // Final Diagnosis saved or deleted while this page is open: forget the cached ICD
  // list and re-check every prescribed medicine against the new one.
  const handleDiagnosisSaved = () => {
    savedDiagnosesRef.current = { key: "", list: [] };
    runDiseaseCheck(currentMedicineNames());
  };

  // Provisional Diagnosis / Past History / Impression changed on the page (typed after
  // the medicines, say): re-check everything prescribed. Debounced because the
  // impression field changes on every keystroke; skipped on first render.
  const diagnosisTextSeenRef = useRef(null);
  useEffect(() => {
    if (diagnosisTextSeenRef.current === null) {
      diagnosisTextSeenRef.current = localDiagnosisText;
      return;
    }
    if (diagnosisTextSeenRef.current === localDiagnosisText) return;
    diagnosisTextSeenRef.current = localDiagnosisText;
    if (!localDiagnosisText.trim()) return;
    const drugs = currentMedicineNames();
    if (!drugs.length) return;
    const timer = setTimeout(() => runDiseaseCheck(drugs), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDiagnosisText]);
  const [tags1, setTags1] = useState({
    ...AUTOCOMPLETE_STATE,
    NextVisit: [],
    TransferReferral: [],
  });

  const [smsModal, setSmsModal] = useState({
    isShow: false,
    component: null,
    size: null,
    Header: null,
  });
  console.log("filteredItemsfilteredItems", filteredItems);
  const [selectedOption, setSelectedOption] = useState(null);

  const [emailModal, setEmailModal] = useState({
    isShow: false,
    component: null,
    size: null,
    Header: null,
  });

  const [openPageModal, setOpenPageModal] = useState({
    isShow: false,
    component: null,
    size: null,
    Header: null,
  });

  const [patientDetail, setPatientDetail] = useState({
    TotaltableData: TotaltableData,
    index: selectedIndex,
    currentPatient: getUser,
  });

  const newUpdateTags = (newData) => {
    // Transform the new data to match the desired structure
    const transformedData = newData.map((item) => ({
      ValueField: item.knownOff, // Convert "knownOff" to "ValueField"
    }));

    // Update the state using setTags
    setTags((prevTags) => ({
      ...prevTags, // Keep all other keys unchanged
      "Known OFF": transformedData, // Update the "Known OFF" key with transformed data
    }));
  };

  useEffect(() => {
    let Pdetails = TotaltableData?.find(
      (val) => val?.App_ID === patientDetail?.currentPatient?.App_ID,
    );
    setPatientDetail((val) => ({ ...val, TotaltableData: TotaltableData }));

    if (Pdetails?.App_ID) {
      setPatientDetail((val) => ({ ...val, currentPatient: Pdetails }));
    }
  }, [TotaltableData]);

  /* KMSI - "already prescribed and still running" alert. When the doctor picks a medicine
     that an earlier visit prescribed and whose course (prescribed date + duration) has not
     ended, a confirm box asks whether to prescribe it again; "No" removes the line.
     fin_global_resources DoctorRunningMedicineAlert = 0 switches it off. */
  const runningAlertEnabled = useMemo(() => {
    const list = Array.isArray(globalResourcesForAlert)
      ? globalResourcesForAlert
      : globalResourcesForAlert?.data || [];
    const row = list?.find((item) => item?.Name === "DoctorRunningMedicineAlert");
    return !row || String(row?.Value).trim() !== "0";
  }, [globalResourcesForAlert]);
  const runningMedsRef = useRef({ patientID: "", rows: [] });
  const runningAcceptedRef = useRef(new Set()); // names the doctor said "yes" to
  const runningInitRef = useRef(false); // skip the lines already on the page when it opens
  const [runningQueue, setRunningQueue] = useState([]); // [{ key, name, match }]
  // C18 reorder toggle lives in the Prescribed Medicine header (beside View Interaction)
  const [rxReorderOpen, setRxReorderOpen] = useState(false);
  useEffect(() => {
    const pid = patientDetail?.currentPatient?.PatientID;
    runningMedsRef.current = { patientID: pid || "", rows: [] };
    runningAcceptedRef.current = new Set();
    runningInitRef.current = false;
    setRunningQueue([]);
    if (!runningAlertEnabled || !pid) return;
    let cancelled = false;
    (async () => {
      const result = await GetRunningMedicines(pid);
      if (cancelled) return;
      if (!result.ok) console.warn("[RunningMedicineAlert]", result.message);
      else if (result.message) console.warn("[RunningMedicineAlert]", result.message);
      console.info("[RunningMedicineAlert]", pid, result.source, result.rows.length, "line(s) loaded");
      runningMedsRef.current = { patientID: pid, rows: result.rows };
    })();
    return () => {
      cancelled = true;
    };
  }, [runningAlertEnabled, patientDetail?.currentPatient?.PatientID]);
  const queueRunningChecks = (addedRows) => {
    if (!runningAlertEnabled) return;
    const rows = runningMedsRef.current.rows;
    if (!rows.length) return;
    const hits = [];
    addedRows.forEach((row) => {
      const name = row?.Name?.value || "";
      const key = normaliseMedicineName(name);
      if (!key || runningAcceptedRef.current.has(key)) return;
      const match = findRunningMedicine(
        rows,
        { name, itemID: row?.Name?.ID },
        { excludeTransactionID: patientDetail?.currentPatient?.TransactionID },
      );
      if (match) hits.push({ key, name, match });
    });
    if (hits.length) setRunningQueue((q) => [...q, ...hits.filter((h) => !q.some((x) => x.key === h.key))]);
  };
  const runningKeep = () => {
    const cur = runningQueue[0];
    if (cur) runningAcceptedRef.current.add(cur.key);
    setRunningQueue((q) => q.slice(1));
  };
  const runningDrop = () => {
    const cur = runningQueue[0];
    setRunningQueue((q) => q.slice(1));
    if (!cur) return;
    setTags((prev) => {
      const list = [...(prev["Prescribed Medicine"] || [])];
      let idx = -1;
      for (let i = list.length - 1; i >= 0; i--) {
        if (normaliseMedicineName(list[i]?.Name?.value) === cur.key) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return prev;
      list.splice(idx, 1);
      const last = list[list.length - 1];
      if (!list.length || last?.Name?.ID || last?.Name?.isDisable) list.push({ ...PRESCRIBED_MEDICINE });
      return { ...prev, "Prescribed Medicine": list };
    });
  };
  // fin_global_resources DisableDrugInteractionAutoPopup = 1 stops the checker
  // from opening by itself while medicines are added (site wise). The View
  // Interaction button still opens it on demand.
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isDrugInteractionAutoPopupOff =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "DisableDrugInteractionAutoPopup",
      )?.Value ?? "",
    ).trim() === "1";

  /* AI Prescription Suggestion - a button on the Provisional Diagnosis header opens a popup that
     reads the diagnosis and proposes medicines, tests, advice, notes and a follow-up. It only
     proposes: nothing reaches the prescription unless the doctor ticks it and presses Add
     Selected, and nothing on this page changes while the popup is closed. Shown unless
     fin_global_resources DoctorAIPrescriptionSuggest is set to 0. */
  const isAiSuggestEnabled = !(
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find((item) => item?.Name === "DoctorAIPrescriptionSuggest")?.Value ?? "",
    ).trim() === "0"
  );
  const [aiSuggest, setAiSuggest] = useState({ open: false, context: null, patternRequest: null });

  /* AI Assistance - Scribe, Safety and Analysis tabs. They read today's entries and only propose;
     nothing on this page changes until the doctor presses Apply / Add in them. Shown unless
     fin_global_resources DoctorAIClinicalTools is set to 0. */
  const isAiClinicalToolsEnabled = !(
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find((item) => item?.Name === "DoctorAIClinicalTools")?.Value ?? "",
    ).trim() === "0"
  );

  const openAiSuggest = () => {
    const provisionalDiagnosis = tagText("Provisional Diagnosis");
    if (!provisionalDiagnosis.length) {
      notify(t("Write the provisional diagnosis first"), "warn");
      return;
    }
    const current = patientDetail?.currentPatient || {};
    // Clinical context only - no name, UHID, phone or address ever goes to the model.
    const allergies = [
      ...new Set(
        [...tagText("Allergies"), vitalSign?.allergy, prisciptionForm?.Allergies]
          .flatMap((a) => String(a ?? "").split(/[,;\n]+/))
          .map((a) => a.trim())
          .filter(Boolean),
      ),
    ];
    setAiSuggest({
      open: true,
      /* What to compare with this doctor's own earlier visits (the server counts, and returns no
         patient detail). The doctor id and visit id are for that lookup only; they are not part of
         the context given to the AI model. */
      patternRequest: {
        doctorID: String(docID || currentDoctorID || getDoctorID || ""),
        diagnoses: provisionalDiagnosis,
        ageYears: parseAgeYears(current?.Age),
        excludeTransactionID: Number(current?.TransactionID) || 0,
      },
      context: {
        age: String(current?.Age ?? "").trim(),
        sex: String(current?.Sex ?? current?.Gender ?? "").trim(),
        weightKg: String(vitalSign?.wt ?? "").trim(),
        vitals: {
          bp: vitalSign?.bp || "",
          pulse: vitalSign?.p || "",
          temperatureF: vitalSign?.t || "",
          spO2: vitalSign?.spO2 || "",
          respiratoryRate: vitalSign?.respiratory || "",
        },
        allergies,
        chiefComplaint: tagText("Chief Complaint"),
        provisionalDiagnosis,
        pastHistory: tagText("Past History"),
        currentMedicines: (tags["Prescribed Medicine"] || [])
          .map((row) => row?.Name?.value)
          .filter(Boolean),
      },
    });
  };

  // Everything this visit can order, for matching suggested tests to real items.
  const loadAiInvestigationCatalog = async () => {
    const response = await LoadInvestigation({
      type: "0",
      categoryID: "0",
      subCategoryID: "0",
      isIPDData: Number(0),
      transactionId: String(getUser?.TransactionID),
      appID: String(getUser?.AppID),
    });
    return response?.success && Array.isArray(response?.data) ? response.data : [];
  };
  /* fin_global_resources -> IsChiefComplaintTemplateMapping. '1' par Chief
     Complaint chunte hi uske jude hue template baaki section me khud jud jaate
     hain (CC Template Mapping screen se joda gaya mapping). '0' ya row hi na ho
     to pehle jaisa - Chief Complaint sirf apne box me jaata hai. */
  const isCCTemplateMappingOn =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "IsChiefComplaintTemplateMapping",
      )?.Value ?? "",
    ).trim() === "1";

  const prevMedicineCount = useRef(0);
  useEffect(() => {
    const checkInteractionsSilently = async () => {
      const currentMedicines =
        tags["Prescribed Medicine"]?.filter(
          (item) => item?.Name?.ID || item?.Name?.isDisable,
        ) || [];

      const medicineAdded =
        currentMedicines.length > prevMedicineCount.current;
      const drugNames = currentMedicines
        .map((m) => m.Name?.value)
        .filter(Boolean);

      // DisableDrugInteractionAutoPopup = 1: the interaction / disease checker does not
      // open by itself. The running-medicine alert is its own confirm box and still runs.
      if (isDrugInteractionAutoPopupOff) {
        if (medicineAdded && runningInitRef.current) {
          queueRunningChecks(currentMedicines.slice(prevMedicineCount.current));
        }
        prevMedicineCount.current = currentMedicines.length;
        runningInitRef.current = true;
        return;
      }

      // Drug-drug: unchanged — needs two medicines.
      let matches = [];
      if (medicineAdded && currentMedicines.length >= 2) {
        // Perform local check
        matches = lookupInteractions(drugNames);

        // If no local matches, perform AI check
        if (matches.length === 0) {
          try {
            matches = await getGeminiInteractions(drugNames);
          } catch (err) {
            console.error("Silent interaction check failed:", err);
          }
        }
      }

      if (medicineAdded) {
        // Drug-disease: one medicine is enough; only the newly added medicines are
        // sent, so a long prescription is not re-checked in full on every addition.
        // runDiseaseCheck opens the checker itself when there is anything new to show
        // (including the drug-drug matches passed alongside).
        const newDrugs = drugNames.slice(prevMedicineCount.current);
        // Running-medicine alert: only the medicines just added; the lines already on
        // the page when it opened are not questioned.
        if (runningInitRef.current) {
          queueRunningChecks(currentMedicines.slice(prevMedicineCount.current));
        }
        const found = await runDiseaseCheck(newDrugs, matches || []);

        if (!diseaseAlertEnabled && !labAlertEnabled && !pregnancyAlertEnabled) {
          // Original behaviour: drug-drug only.
          if (matches && matches.length > 0) {
            setInteractionResults({ matches, numDrugs: drugNames.length });
            setOpen(true);
          } else {
            setInteractionResults(null);
          }
        } else if (!(matches && matches.length > 0) && !found.length) {
          setInteractionResults(null);
        }
      }
      prevMedicineCount.current = currentMedicines.length;
      runningInitRef.current = true;
    };

    checkInteractionsSilently();
  }, [tags["Prescribed Medicine"]]);

  // Passing update function to parent via props

  const [saveTemplate, setSaveTemplate] = useState({
    templateName: "",
    valueField: "",
  });
  console.log("prescriptionprescription", prescription);
  const [favTempData, setFavTempData] = useState([]);

  const saveTemplateHandleChange = (e) => {
    const { value, name } = e.target;
    setSaveTemplate((val) => ({ ...val, [name]: value }));
  };

  const [modalData, setModalData] = useState({
    visible: false,
    component: null,
    size: null,
    Header: null,
    setVisible: false,
    prescription: null,
  });
  const [nameTemplateModalData, setNameTemplateModalData] = useState({
    visible: false,
    component: null,
    size: null,
    Header: null,
    setVisible: false,
    prescription: null,
  });
  const handleLoadInvestigation = async (labCategoryIds, subCategoryId) => {
    const serachInvestigationPayload = {
      type: "1",
      categoryID: labCategoryIds ?? "0",
      subCategoryID: subCategoryId ?? "0",
      isIPDData: Number(0),
      transactionId: String(getUser?.TransactionID),
      appID: String(getUser?.AppID),
      // appID: String(patientDetail?.currentPatient?.App_ID),
    };
    try {
      const response = await LoadInvestigation(serachInvestigationPayload);
      if (!response?.success) {
        notify("LoadInvestigation API failed" ?? response?.message, "Warning");
        return [];
      }
      // debugger;
      const data = Array.isArray(response?.data) ? response?.data : [];
      const nameChangeResponse = data?.map((ele) => {
        return {
          ID: ele?.newItemID,
          ValueField: ele?.typeName,
          value: ele?.itemID,
          TemplateName: ele?.typeName,
          AllItemData: ele?.newItemID,
          subCategoryID: ele?.subCategoryID,
          categoryID: ele?.categoryid,
          /* Display only. PrescriptionAdvice/LoadInvestigation already LEFT JOINs
             f_ratelist for this visit's panel, centre and schedule charge - the rate
             a CASH patient is shown is the CASH rate - and returns it as Rate. It was
             simply being dropped here. Nothing prices anything off this: the bill is
             still raised by the front office from its own rate lookup. */
          rate: Number(ele?.rate ?? ele?.Rate ?? 0),
        };
      });
      setTags((prev) => ({
        ...prev,
        ["Investigation(Lab & Radio)"]: nameChangeResponse,
      }));
      setFilteredItems(nameChangeResponse);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  console.log(tags, "aaaaaaaazzzzzzzaaa");
  const setIsOpen = () => {
    setNameTemplateModalData((val) => ({ ...val, visible: false }));
  };
  const handlePackageDetails = async (prescription, size) => {
    if ([4, 5, 6, 7, 10, 12, 13, 16, 18, 19, 21].includes(prescription.ID)) {
      let tempDetails;
      tempDetails = await GetEditTemplate(
        prescription?.templateData?.ID || prescription?.ID,
        prescription?.templateData?.templateFor || prescription?.templateFor,
      );
      setSaveTemplate({
        templateName: tempDetails?.data?.TemplateName,
        valueField: tempDetails?.data?.ValueField,
        saveid: tempDetails?.data?.ID,
      });
      if (prescription?.ID == 2 || prescription?.ID == 3) {
        setModalData({ data: prescription }),
          setNameTemplateModalData({
            visible: true,
            prescription: prescription,
            component: (
              <SingleNameCreateTemplateModal
                selectedAccordion={prescription}
                searchData={items}
                handleChangeModel={setModalData}
                editData={{
                  tagsData: tempDetails?.data?.map((item) => ({
                    Name: { value: item?.itemName },
                    ID: item?.itemId,
                  })),
                  templateName: prescription?.templateData?.TemplateName,
                }}
              />
            ),
            handleInsertApi: handleSaveInvestigationTemplate,
            size: "35vw",
            Header: prescription?.isEdit
              ? "Update Template"
              : "Create New Template",
            extrabutton: <></>,
            footer: <></>,
          });
      } else {
        setModalData({
          visible: true,
          prescription: prescription,
          // component: <TemplateSearchModal prescription={prescription} saveTemplate={saveTemplate} saveTemplateHandleChange={saveTemplateHandleChange} />,
          size: size,
          Header: "Create New Template",
          setVisible: false,
        });
      }
    } else {
      let tempDetails;
      if (prescription?.templateData?.ID) {
        tempDetails = await getInvestigationFavoriteTemplateDetailsApi(
          prescription?.templateData?.ID,
        );
      }
      if (prescription?.ID == 2 || prescription?.ID == 3) {
        setModalData({ data: prescription }),
          setNameTemplateModalData({
            visible: true,
            prescription: prescription,
            component: (
              <SingleNameCreateTemplateModal
                selectedAccordion={prescription}
                searchData={items}
                handleChangeModel={setModalData}
                editData={{
                  tagsData: tempDetails?.data?.map((item) => ({
                    Name: { value: item?.itemName },
                    ID: item?.itemId,
                  })),
                  templateName: prescription?.templateData?.TemplateName,
                }}
              />
            ),
            handleInsertApi: handleSaveInvestigationTemplate,
            size: "35vw",
            Header: prescription?.isEdit
              ? "Update Template"
              : "Create New Template",
            extrabutton: <></>,
            footer: <></>,
          });
      } else {
        setModalData({
          visible: true,
          prescription: prescription,
          // component: <TemplateSearchModal prescription={prescription} saveTemplate={saveTemplate} saveTemplateHandleChange={saveTemplateHandleChange} />,
          size: size,
          Header: "Create New Template",
          setVisible: false,
        });
      }
    }
  };

  async function handleSaveInvestigationTemplate(data) {
    const getFilteredTagsPayload = () => {
      return data?.tagsData.filter((tag) => tag?.Name?.value?.trim() !== "");
    };
    const filterPayload = getFilteredTagsPayload();
    if (data?.templateName.trim() === "") {
      notify(t("TemplateName is required!"), "error");
      return;
    }
    const payload = {
      id: data?.templateId ? data?.templateId : 0,
      AccordianId: data?.data.ID,
      name: data?.templateName,
      AccordianName: data?.data?.DisplayName,
      templateLabDetails: filterPayload?.map((temp) => ({
        itemId: temp?.ID,
        itemName: temp?.Name?.value,
        isOutSource: temp?.ID ? 0 : 1,
      })),
    };

    try {
      const res = await saveInvestigationFavoriteTemplateApi(payload);

      if (res?.success) {
        notify(t("Template saved successfully!"), "success");
        setNameTemplateModalData({ visible: false });

        /* Nayi template turant list me aa jaye. Pehle sirf modal band hota tha
           aur list purani padi rehti thi - banane wale ko lagta tha ki save hua
           hi nahi. AccordianId wahi hai jis par modal khula tha. */
        await handleGetInvestigationTemplate(data?.data?.ID);
      } else {
        notify(t("Something went wrong while saving the template."), "warn");
      }
    } catch (error) {
      console.error("Save template error:", error);
      notify(t("Failed to save template. Please try again later."), "error");
    }
  }

  const handleGetInvestigationTemplate = async (id) => {
    try {
      const res = await getInvestigationFavoriteTemplateApi(id);
      const newData = res?.data?.map((item) => {
        return {
          ...item,
          ValueField: item?.TemplateName,
          value: item?.ID,
        };
      });
      setFavTempData(newData);
    } catch (e) {
      notify(e?.message, "error");
    }
  };

  const reverseTableData = async () => {
    if (patientDetail?.index > 0) {
      const index = patientDetail?.index - 1;
      setPatientDetail((val) => ({
        ...val,
        index: index,
        currentPatient: patientDetail?.TotaltableData[index],
      }));
      dispatch(
        getBindVital(patientDetail?.TotaltableData[index].TransactionID),
      );
      SearchOPDBillsCallAPI();
      try {
        const response = await GetPrescription({
          patientID: patientDetail?.TotaltableData[index]?.PatientID,
          transactionID: patientDetail?.TotaltableData[index]?.TransactionID,
          appID: patientDetail?.TotaltableData[index]?.App_ID,
          Type: type === "Emergency" ? "emg" : "opd",
        });
        if (response?.success) {
          setLoadSaveData(response.data);
          // debugger;
        } else {
          setLoadSaveData([]);
        }
        if (patientDetail?.TotaltableData[index]?.App_ID) {
          await UpdateCall({
            app_ID: patientDetail?.TotaltableData[index]?.App_ID,
            doctorID:
              patientDetail?.TotaltableData[index]?.DoctorID ||
              docID ||
              getDoctorID,
          });
        }
      } catch (error) {}

      try {
        const res = await GetOldAppointentData({
          patientID: patientDetail?.TotaltableData[index]?.PatientID,
          transactionID: patientDetail?.TotaltableData[index]?.TransactionID,
          appID: patientDetail?.TotaltableData[index]?.App_ID,
          Type: type === "Emergency" ? "emg" : "opd",
        });
        if (res?.success) {
          setApiData((prev) => ({
            ...prev,
            getOldAppointentDataAPI: res.data,
          }));
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  // const handleSpouseDetailsChange = async (e) => {
  //   const valueParts = e?.ValueField?.split("#") || [];
  //   const app_id = valueParts[0]?.trim();
  //   const tid = valueParts[1]?.trim();

  //   const spousePatientID =
  //     apiData?.getOldSpouseAppointentDataAPI?.spousePatientID;

  //   // âœ… Step 1: Get correct source data
  //   const sourceData =
  //     patientDetail?.TotaltableData?.length
  //       ? patientDetail.TotaltableData
  //       : TotaltableData || [];

  //   // âœ… Step 2: Find correct index
  //   const selectedIndex = sourceData.findIndex(
  //     (item) => parseInt(item?.App_ID) === parseInt(app_id)
  //   );

  //   if (selectedIndex === -1) {
  //     notify("Spouse appointment not found in the current list.", "error");
  //     return;
  //   }

  //   // âœ… Step 3: Get selected patient
  //   const selectedPatient = sourceData[selectedIndex];

  //   // âœ… Step 4: Update state
  //   setPatientDetail((val) => ({
  //     ...val,
  //     currentPatient: selectedPatient,
  //     TotaltableData: sourceData,
  //     index: selectedIndex
  //   }));

  //   // âœ… Step 5: Update the status to 'IN' seamlessly
  //   await getUpdateInAPI(selectedPatient, selectedIndex, "spouse");

  //   // âœ… Step 6: Load spouse appointments using the correct patient ID
  //   handleSpouseAppointments(spousePatientID);

  //   dispatch(getBindVital(tid));

  //   // Clear previous form inputs before loading
  //   handleClearForm();

  //   // âœ… Prescription API
  //   try {
  //     const response = await GetPrescription({
  //       patientID: spousePatientID,
  //       transactionID: tid,
  //       appID: app_id,
  //       Type: type === "Emergency" ? "emg" : "opd",
  //     });

  //     setLoadSaveData(response?.success ? response.data : []);
  //   } catch (error) {}

  //   // âœ… Old appointment API
  //   try {
  //     const res = await GetOldAppointentData({
  //       patientID: spousePatientID,
  //       transactionID: tid,
  //       appID: app_id,
  //       Type: type === "Emergency" ? "emg" : "opd",
  //     });

  //     if (res?.success) {
  //       setApiData((prev) => ({
  //         ...prev,
  //         getOldAppointentDataAPI: res.data,
  //       }));
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const fetchLabCategory = async () => {
    try {
      const res = await getLabRadiologyCategoryApi();
      if (res?.success) {
        const newData = res?.data?.map((item) => {
          return {
            ...item,
            label: item?.NAME,
            value: item?.CategoryID,
          };
        });
        setLabCategoryList(newData);
      } else {
        notify(res.message, "error");
      }
    } catch (e) {
      notify(e?.message, "error");
    }
  };

  const fetchLabSubCategory = async (id) => {
    try {
      const res = await getLabRadiologySubCategoryApi(id);
      if (res?.success) {
        const newData = res?.data?.map((item) => {
          return {
            ...item,
            label: item?.Name,
            value: item?.SubCategoryID,
          };
        });
        setLabSubCategoryList(newData);
      } else {
        notify(res.message, "error");
      }
    } catch (e) {
      notify(e?.message, "error");
    }
  };

  const forwardTableData = async () => {
    if (patientDetail?.index < patientDetail?.TotaltableData?.length - 1) {
      const index = patientDetail?.index + 1;
      setPatientDetail((val) => ({
        ...val,
        index: index,
        currentPatient: patientDetail?.TotaltableData[index],
      }));
      dispatch(
        getBindVital(patientDetail?.TotaltableData[index].TransactionID),
      );
      SearchOPDBillsCallAPI();
      try {
        const response = await GetPrescription({
          patientID: patientDetail?.TotaltableData[index]?.PatientID,
          transactionID: patientDetail?.TotaltableData[index]?.TransactionID,
          appID: patientDetail?.TotaltableData[index]?.App_ID,
          Type: type === "Emergency" ? "emg" : "opd",
        });
        if (response?.data) {
          setLoadSaveData(response.data);
        }
        if (patientDetail?.TotaltableData[index]?.App_ID) {
          await UpdateCall({
            app_ID: patientDetail?.TotaltableData[index]?.App_ID,
            doctorID:
              patientDetail?.TotaltableData[index]?.DoctorID ||
              docID ||
              getDoctorID,
          });
        }
      } catch (error) {}

      try {
        const res = await GetOldAppointentData({
          patientID: patientDetail?.TotaltableData[index]?.PatientID,
          transactionID: patientDetail?.TotaltableData[index]?.TransactionID,
          appID: patientDetail?.TotaltableData[index]?.App_ID,
          Type: type === "Emergency" ? "emg" : "opd",
        });
        setApiData((prev) => ({ ...prev, getOldAppointentDataAPI: res.data }));
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleChange = (e) => {
    const { value, name } = e.target;
    setInputValue((val) => ({ ...val, [name]: value }));
  };
  const handleChangeRemarks = (e) => {
    const { value, name } = e.target;

    // Update input value as user types
    setInputValue((val) => ({ ...val, [name]: value }));

    // Only proceed if Enter key was pressed
    if (e.key === "Enter") {
      setTags((prev) => {
        const arr = [...(prev["Investigation(Lab & Radio)"] || [])];

        if (arr.length > 0) {
          arr[arr.length - 1] = {
            ...arr[arr.length - 1],
            remarks: value,
          };
        }

        return {
          ...prev,
          ["Investigation(Lab & Radio)"]: arr,
        };
      });

      // Clear the input after saving
      setInputValue((val) => ({ ...val, [name]: "" }));
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const apir = await getGetDoctor(
        patientDetail?.currentPatient?.TransactionID,
      );

      // Check if apir is undefined or null
      if (!apir) {
        throw new Error(
          "checkGetDoctorIDForTransationID API call returned undefined or null",
        );
      }

      let doctorID;

      if (apir.success === true) {
        doctorID = apir.data;
      } else {
        doctorID = String(patientDetail?.currentPatient?.DoctorID);
      }
      const getPayLoadData = {
        TransactionID: getUser?.TransactionID,
        App_ID: getUser?.AppID,
        DoctorID: doctorID,
      };
      const res = await saveTemplateAPI({
        id: saveTemplate?.saveid || 0,
        valueField: saveTemplate.valueField,
        templateName: saveTemplate.templateName || saveTemplate.valueField,
        doctorID: doctorID,
        templateFor: Number(modalData.prescription.ID),
      });
      fetchAllApiData(getPayLoadData);

      if (!res) {
        throw new Error("saveTemplateAPI call returned undefined or null");
      }

      if (res.success) {
        notify(res.message, "success");
        try {
          setModalData((prev) => ({ visible: false }));
          setSaveTemplate({
            templateName: "",
            valueField: "",
          });
          setTags1({
            ...AUTOCOMPLETE_STATE,
            NextVisit: [],
            TransferReferral: [],
          });
        } catch (error) {
          console.error("Error in checkGetDoctorIDForTransationID:", error);
        }
      } else {
        console.error("API call failed with response:", res);
        notify(t("Failed to save template. Please try again."), "error");
      }
    } catch (error) {
      console.error("Error in handleSaveTemplate:", error);
    }
  };

  useEffect(() => {
    fetchLabCategory();
  }, []);
  useEffect(() => {
    if (labCategoryIds?.categoryId) {
      fetchLabSubCategory(labCategoryIds?.categoryId);
    }
  }, [labCategoryIds?.categoryId]);

  // ViewConsultation already loads the templates when the patient opens, for the
  // doctor mapped to the logged-in user. Loading them again here on mount with
  // the appointment's doctor raced that call and, when that doctor has no
  // templates, emptied the list a moment after it appeared. So only reload after
  // a template is deleted, and for the same doctor.
  const skipTemplateReloadOnMount = useRef(true);
  useEffect(() => {
    if (skipTemplateReloadOnMount.current) {
      skipTemplateReloadOnMount.current = false;
      return;
    }
    const getPayLoadData = {
      TransactionID: getUser?.TransactionID,
      App_ID: getUser?.AppID,
      DoctorID: String(getDoctorID || patientDetail?.currentPatient?.DoctorID),
    };

    fetchAllApiData(getPayLoadData);
  }, [isDeleteTemplate]);

  const duplicateChecker = (arrayofObject, checker) => {
    if (arrayofObject.length > 0) {
      const returnData = arrayofObject?.some(
        (ele) =>
          ele?.ValueField?.toLowerCase().trim() ===
          checker?.toLowerCase().trim(),
      );
      return returnData;
    } else {
      return false;
    }
  };

  const handleKeyPress = (e, category) => {
    if ((e.key === "Enter" || e.key === "Tab") && inputValue[category]) {
      if (selectedFromSuggestion.current[category]) {
        selectedFromSuggestion.current[category] = false;
        setInputValue((prev) => ({ ...prev, [category]: "" }));
        return;
      }

      const currentTags = tags[category] || [];
      const currentLength = currentTags
        .map((tag) => tag?.ValueField || "")
        .join(" ").length;

      const newInputLength = inputValue[category].length;
      const totalLength = currentLength + newInputLength;
      const charLimit = getCharLimit(category);
      if (totalLength > charLimit) {
        e.preventDefault();
        notify(t("Character limit exceeded"), "error");
        return;
      }

      if (!duplicateChecker(tags[category], inputValue[category])) {
        setTags((prevTags) => ({
          ...prevTags,
          [category]: [
            ...(prevTags[category] || []),
            { ValueField: inputValue[category] },
          ],
        }));
      } else {
        notify(t("duplicate Value"), "error");
      }

      setInputValue((prevInputValue) => ({
        ...prevInputValue,
        [category]: "",
      }));
    }
  };

  const onSelected = (e, category) => {
    selectedFromSuggestion.current[category] = true;
    const { value } = e;
    const charLimit = getCharLimit(category);
    const currentTags = tags[category] || [];

    const currentLength = currentTags
      .map((tag) => tag?.ValueField || "")
      .join(" ").length;

    const newInputLength = (value?.ValueField || "").length;
    const totalLength = currentLength + newInputLength;

    if (totalLength > charLimit) {
      notify(t("Character limit exceeded"), "error");
      setInputValue((prev) => ({ ...prev, [category]: "" }));
      return;
    }

    if (!duplicateChecker(tags[category], value?.ValueField)) {
      const val = { ...value, isChecked: true };
      const mainArray = [...items[category]];
      const index = mainArray.findIndex(
        (itd) => Number(itd?.ID) === Number(val?.ID),
      );

      mainArray[index] = val;
      setItems((prev) => ({ ...prev, [category]: mainArray }));
      setTags((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), value],
      }));
      setInputValue((prev) => ({ ...prev, [category]: "" }));
      // setTimeout(() => {
      //   autoCompleteRefs.current[category]?.hide();
      //   document.activeElement.blur();
      // }, 100);
      setShouldSaveDraft(true);
    } else {
      notify(t("Duplicate Values Not Allowed"), "error");
      setInputValue((prev) => ({ ...prev, [category]: "" }));
    }
  };

  const removeTag = (category, indexToRemove, id, tag) => {
    if (tag) {
      setTags((prevTags) => ({
        ...prevTags,
        [category]: prevTags[category]?.filter(
          (_, index) => index !== indexToRemove,
        ),
      }));
    } else {
      let ID = Number(id) ? id : undefined;
      const singleData = JSON.parse(JSON.stringify([...items[category]]));
      if (ID) {
        const index = singleData.findIndex(
          (itd) => Number(itd?.ID) === Number(ID),
        );

        /* Pehle yahan `!index === -1` likha tha. JavaScript use
           `(!index) === -1` padhta hai, yaani `true === -1` ya `false === -1`
           - dono haalat me hamesha false. Isliye ye hissa kabhi chala hi nahi.

           Nateeja ye tha ki tag hatane par bhi andar wali list me uski tick
           lagi rehti thi, aur dobara jodne wala code tick dekh kar chhod deta
           tha ("pehle se laga hua hai") - to hataya hua item phir kabhi wapas
           nahi aata tha. */
        if (index !== -1) {
          singleData[index]["isChecked"] = false;
          setItems((prev) => ({ ...prev, [category]: singleData }));
        }
      }

      setTags((prevTags) => ({
        ...prevTags,
        [category]: prevTags[category]?.filter(
          (_, index) => index !== indexToRemove,
        ),
      }));
    }
  };
  const handleSaveMedicine = async (event) => {
    // debugger;
    // event.preventDefault();
    const KEYS_NAME = "Prescribed Medicine";
    // Prepare the data for submission, filtering out empty entries
    const formData = tags1[KEYS_NAME].map((item) => {
      // Extract values and filter out any entries where all values are empty
      const values = {
        Name: item.Name?.value || "",
        Dose: item.Dose?.value || "",
        Time: item.Time?.value || "",
        Duration: item.Duration?.value || "",
        Meal: item.Meal?.value || "",
        Route: item.Route?.value || "",
        ItemID: item.Name.ID || "",
      };

      // Check if all values are empty
      const isEmpty = Object.values(values).every(
        (value) => value?.trim() === "",
      );

      return isEmpty ? null : values; // Return null if all fields are empty
    }).filter((item) => item !== null); // Remove null entries

    const payload = {
      id: 0,
      valueField: "",
      templateName: saveTemplate.templateName,
      doctorID: getDoctorID,
      templateFor: Number(modalData.prescription.ID),
      medicines: formData.map((item) => ({
        itemID: item.ItemID,
        name: item.Name,
        quantity: 1,
        setID: 0,
        dose: item.Dose,
        route: item.Route,
        meal: item.Meal,
        time: item.Time,
        duration: item.Duration,
      })),
    };

    await SaveMedicineTemplateAPI(payload);
  };

  const SaveMedicineTemplateAPI = async (payload) => {
    try {
      const apiResponse = await SaveMedicineTemplate(payload);
      if (apiResponse?.success) {
        await handleSearchPrescribeMedicine(payload?.doctorID);
        notify(apiResponse?.message, "success");
        setModalData((prev) => ({ visible: false }));
        setSaveTemplate({
          templateName: "",
          valueField: "",
        });
        setTags1({
          ...AUTOCOMPLETE_STATE,
          NextVisit: [],
          TransferReferral: [],
        });
      } else {
        notify(apiResponse?.message, "success");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getLoadPrescriptionView = async (
    TransactionID,
    PatientID,
    isIPDData = 0,
  ) => {
    // debuggerr
    try {
      const response = await LoadPrescriptionView(
        isIPDData,
        TransactionID,
        PatientID,
      );
      if (response?.success) {
        setPrescription(response?.data?.filter((val) => val?.IsHide === 0));

        // setPrescription(response?.data);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const itemTemplate = (item) => {
    /* The panel rate, where the item carries one - the same value shown in the
       favourites list, so the doctor sees the price whichever way they pick the
       test. Display only; nothing bills from it. */
    const rate = Number(item?.rate ?? item?.Rate ?? 0);
    const showRate = Number.isFinite(rate) && rate > 0;
    return (
      <div className="p-clearfix">
        {/* <div style={{ float: "left", fontSize: "12px", width: "100%" }}> */}
        <div
          style={{
            fontSize: "12px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>{item?.TemplateName || item?.TypeName}</span>
          {showRate ? (
            <span
              title={t("Rate for this patient's panel")}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#0e7a65",
                whiteSpace: "nowrap",
              }}
            >
              {rate.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  const search = (event, type) => {
    const { query } = event;
    const data = items[type]?.filter(
      (ele) =>
        ele?.TemplateName.toLowerCase()
          .trim()
          .includes(query.toLowerCase().trim()) ||
        ele?.TypeName?.toLowerCase()
          .trim()
          .includes(query.toLowerCase().trim()),
    );
    setFilteredItems({
      ...filteredItems,
      [type]: data,
    });
  };

  const selectItem = (item, category) => {
    setInputValue((prev) => ({
      ...prev,
      [category]: item.ValueField,
    }));

    setTimeout(() => {
      addTag(category, item);
      closeDropdown(category);
      // Chief Complaint ke saath jude hue template bhi bind ho jaate hain.
      // Flag band ho to applyCCMapping pehli line me hi laut jaata hai.
      if (category === "Chief Complaint") applyCCMapping(item?.ID);
    }, 100); // Ensure UI updates before processing selection
  };
  const closeDropdown = (category) => {
    const autoCompleteElement = autoCompleteRefs.current[category];

    if (autoCompleteElement) {
      autoCompleteElement.hide(); // âœ… Hide dropdown properly
    }
  };
  const addTag = (category, item) => {
    if (!duplicateChecker(tags[category], item.ValueField)) {
      setTags((prevTags) => ({
        ...prevTags,
        [category]: [
          ...(prevTags[category] || []),
          { ValueField: item.ValueField },
        ],
      }));
    } else {
      notify(t("Duplicate Value"), "error");
    }

    setInputValue((prevInputValue) => ({
      ...prevInputValue,
      [category]: "",
    }));
  };

  /* Ye do section apne template `items` me nahi rakhte - unke template
     folder ke andar star dabane par TemplateLabSummary se aate hain. Baaki
     har section apne template `items` me hi rakhta hai. */
  const LAB_TEMPLATE_SECTIONS = [
    "Investigation(Lab & Radio)",
    "Prescribed Procedure",
  ];

  /**
   * Chief Complaint ke saath jude hue template bind karta hai.
   *
   * Naya bind NAHI likha gaya - wahi `handleFavoriteSelectChange` dobara
   * bulaya jaata hai jo doctor ke khud template chunne par chalta hai. Isliye
   * har section par bilkul wahi shart lagti hai jo pehle se lagti thi: lab
   * template apne items ke saath khulta hai, medicine set apni duplicate-rok
   * ke saath aur aakhir me ek khaali row ke saath, aur saada text apne tarike
   * se jud jaata hai.
   *
   * Poora kaam try/catch me hai aur chup-chaap fail hota hai - mapping me kuch
   * gadbad ho to bas kuch bind nahi hoga; Chief Complaint khud to pehle jaisa
   * lag hi jaata hai. Flag band ho to ye chalta hi nahi.
   */
  const applyCCMapping = async (chiefCompTemplateID) => {
    if (!isCCTemplateMappingOn) return;

    const doctorID = Number(getDoctorID || docID) || 0;
    const ccID = Number(chiefCompTemplateID) || 0;
    if (!doctorID || !ccID) return;

    try {
      const mapped = await CCTemplateMapGetBindValues(doctorID, ccID);
      if (!mapped?.length) return;

      for (const row of mapped) {
        const section = String(row?.SectionName ?? "");
        const templateID = Number(row?.TemplateID);
        if (!section || !templateID) continue;

        // Us section ke template usi list me se dhoondho jo screen pehle se
        // bhar chuki hai - taaki row ka poora dhancha wahi rahe jo doctor ke
        // khud chunne par hota.
        const list = items?.[section] || [];
        const idx = list.findIndex(
          (tpl) => Number(tpl?.ID) === templateID,
        );

        if (idx >= 0) {
          if (list[idx]?.isChecked) continue; // pehle se laga hua hai

          await handleFavoriteSelectChange(
            { target: { name: "isChecked", checked: true } },
            idx,
            section,
            list[idx],
            section,
          );
          continue;
        }

        /* Yahan pahunchne ka matlab - template us list me mila hi nahi.

           Lab aur Procedure ke liye ye normal hai: unke template `items` me
           hote hi nahi, folder ke andar star dabane par alag API se aate hain.
           Isliye row yahin bana kar bind kar diya jaata hai; aage ka kaam wahi
           purana raasta karta hai - template ke andar ke items la kar grid me
           jodna.

           Baaki section (Prescribed Medicine samet) apne template `items` me
           hi rakhte hain, isliye unke liye ye raasta nahi chalta - wahan na
           milna sach me "nahi hai" hi hota hai. */
        if (!LAB_TEMPLATE_SECTIONS.includes(section)) continue;

        // Ek hi template dobara na jud jaye - jaise Chief Complaint phir se
        // chuna jaye to.
        const alreadyBound = (tags?.[section] || []).some(
          (bound) => Number(bound?.isDefaultTemplate) === templateID,
        );
        if (alreadyBound) continue;

        await handleFavoriteSelectChange(
          { target: { name: "isChecked", checked: true } },
          -1,
          section,
          { ID: templateID, IsTemplate: 1, value: templateID },
          section,
        );
      }
    } catch (error) {
      console.error("applyCCMapping", error);
    }
  };

  const handleFavoriteSelectChange = async (
    e,
    index,
    mainArray,
    singleData,
    modalName,
  ) => {
    const { name, checked } = e.target;
    singleData[name] = checked;

    /* index < 0 matlab ye row screen ki kisi list me hai hi nahi. Aisa tab
       hota hai jab Chief Complaint ki mapping se Lab ya Procedure ka template
       aata hai - wo template `items` me rehte hi nahi, folder ke andar star
       dabane par alag se aate hain. Us haalat me `items` me likhne ko kuch
       hai hi nahi, sirf bind karna hai.

       Baaki har purani call sahi index bhejti hai, isliye unke liye kuch
       nahi badla. */
    if (index >= 0) {
      /* Abhi ka state padha jaata hai, render ke waqt ka nahi. Mapping ek saath
         kai section par chalti hai, aur purane `items` par likhte to har call
         pichhli call ka badlaav mita deti - favourites ki tick kuch section me
         lagti hi nahi. Ek hi call ke liye matlab pehle jaisa hi hai. */
      setItems((prev) => {
        const data = [...(prev?.[mainArray] || [])];
        data[index] = singleData;
        return { ...prev, [mainArray]: data };
      });
    }

    let itemsToAdd = [];
    try {
      if (checked) {
        if (singleData?.IsTemplate) {
          const response = await getInvestigationFavoriteTemplateDetailsApi(
            singleData?.ID,
          );
          const apiData = response?.data || [];

          itemsToAdd = apiData.map((item) => ({
            ID: item?.itemId,
            isDefaultTemplate: singleData?.ID,
            TemplateName: item?.itemName,
            ValueField: item?.itemName,
            value: item?.itemId,
            isOutSource: item?.isOutSource || 0,
            isChecked: true,
          }));
        } else {
          if (modalName === "Prescribed Medicine") {
            itemsToAdd = [...(singleData?.ValueField || [])];
          } else {
            itemsToAdd = [singleData];
          }
        }

        // setTags((prevTags) => ({
        //   ...prevTags,
        //   [mainArray]: [...prevTags[mainArray],
        //   ...itemsToAdd.filter(item => item && Object.keys(item).length > 0)
        //   ],

        // }));
        setTags((prevTags) => {
          const previous = [...(prevTags[mainArray] || [])];

          // Remove the last item if it's an empty row
          const lastItem = previous[previous.length - 1];
          const isLastItemEmpty =
            lastItem && !lastItem?.ID && !lastItem?.ValueField;
          if (isLastItemEmpty) previous.pop();

          // A medicine already in the grid (typed, saved earlier or brought in by
          // another template) is not added a second time.
          let newItems = itemsToAdd;
          if (modalName === "Prescribed Medicine") {
            const medicineKey = (row) =>
              String(row?.Name?.ID ?? row?.Name?.value ?? "")
                .trim()
                .toLowerCase();
            const present = new Set(
              previous.map(medicineKey).filter((key) => key !== ""),
            );
            newItems = itemsToAdd.filter((row) => {
              const key = medicineKey(row);
              if (key === "") return true;
              if (present.has(key)) return false;
              present.add(key);
              return true;
            });
          }

          const updated = [...newItems, ...previous];

          // Always push one empty row at the end
          if (modalName === "Prescribed Medicine") {
            updated.push({});
          }

          return {
            ...prevTags,
            [mainArray]: updated,
          };
        });
      } else {
        if (singleData?.IsTemplate) {
          const tagItem = JSON.parse(JSON.stringify(tags));
          const filterTagData = tagItem[mainArray]?.filter(
            (val) => val?.isDefaultTemplate !== singleData?.ID,
          );
          setTags((prevTags) => ({
            ...prevTags,
            [mainArray]: filterTagData,
          }));
          return;
        }

        if (modalName === "Prescribed Medicine") {
          setTags((prevTags) => ({
            ...prevTags,
            [mainArray]: prevTags[mainArray].filter(
              (item) => Number(item?.TemplateID) !== Number(singleData?.ID),
            ),
          }));
        } else {
          const mainIndex = tags[mainArray].findIndex(
            (itd) => Number(itd?.ID) === Number(singleData?.ID),
          );
          setTags((prevTags) => ({
            ...prevTags,
            [mainArray]: prevTags[mainArray].filter((_, i) => i !== mainIndex),
          }));
        }
      }

      /* Favourites se Chief Complaint ka template lagaya gaya ho to uske jude
         hue template bhi saath aa jaate hain - wahi jo autocomplete se chunne
         par hota hai. Hatate waqt (checked = false) kuch nahi hota: jo laga
         chuka hai use doctor khud hataye. Flag band ho to applyCCMapping
         pehli line me hi laut jaata hai. */
      if (checked && mainArray === "Chief Complaint") {
        await applyCCMapping(singleData?.ID);
      }
    } catch (error) {
      console.error("Error in handleFavoriteSelectChange:", error);
    }
  };

  const handleFileClosed = async (params) => {
    try {
      const res = await updateFileClosed(params.App_ID);
      if (res.success) {
        notify(res.message, "success");
        setActive(true);
        SearchOPDBillsCallAPI();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleFileOpen = async (params) => {
    try {
      const res = await updateFileOpen(params.App_ID);
      if (res.success) {
        notify(res.message, "success");
        setActive(true);
        SearchOPDBillsCallAPI();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getBindMenuCPEOList = async () => {
    try {
      const res = await getListBindMenu(getUser?.TransactionID);
      if (res?.success) {
        setApiData((prev) => ({ ...prev, getCPEOMenuList: res?.data }));
      } else {
        // notify(res?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getHoldAPID = async () => {
    try {
      const res = await holdAPI(patientDetail?.currentPatient?.App_ID);
      if (res.success) {
        notify(res?.message, "success");
        setActive(true);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getOutPatientAPI = async () => {
    try {
      const res = await setGetOutPatientAPI(
        patientDetail?.currentPatient?.App_ID,
      );
      if (res.success) {
        notify(res?.message, "success");
        // setOutPatient("In")
        setActive(true);
        SearchOPDBillsCallAPI();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleBlur = (e, accordianName) => {
    const typedValue = (inputValue[accordianName] || "").trim();

    setTimeout(() => {
      if (selectedFromSuggestion.current[accordianName]) {
        selectedFromSuggestion.current[accordianName] = false;
        return;
      }

      if (!typedValue) return;
      const exists = (tags[accordianName] || []).some(
        (t) =>
          (t?.ValueField || "").toString().toLowerCase() ===
          typedValue.toLowerCase(),
      );
      if (exists) {
        setInputValue((prev) => ({ ...prev, [accordianName]: "" }));
        return;
      }
      const charLimit = getCharLimit(accordianName);
      const currentLength = (tags[accordianName] || [])
        .map((tag) => tag?.ValueField || "")
        .join(" ").length;
      if (currentLength + typedValue.length > charLimit) {
        notify(t("Character limit exceeded"), "error");
        setInputValue((prev) => ({ ...prev, [accordianName]: "" }));
        return;
      }
      setTags((prev) => ({
        ...prev,
        [accordianName]: [
          ...(prev[accordianName] || []),
          { ValueField: typedValue, ID: null },
        ],
      }));
      setInputValue((prev) => ({ ...prev, [accordianName]: "" }));
    }, 150);
  };

  const fieldWordLimits = {
    "Chief Complaint": 1000,
    "History Of Present illness": 2000,
    "Family History": 500,
    "Provisional Diagnosis": 1000,
    "Impression Diagnosis": 1000,
    "Past History": 1000,
  };

  const defaultWordLimit = 500;

  // Convert word count to approximate character limit
  const getCharLimit = (field) => fieldWordLimits[field] || defaultWordLimit;
  const handleCheckDateAndAutocomplete = (item, tags) => {
    switch (item.ID) {
      case 20:
        return (
          <SystemMaticEmergency
            prisciptionForm={prisciptionForm}
            handlechangebyPrisciption={handlechangebyPrisciption}
            handleReactSelectChangebyPrisciption={
              handleReactSelectChangebyPrisciption
            }
            onFocus={handleInputFocus}
            disabled={isInputDisabled(item.Gender)}
            setPrisciptionForm={setPrisciptionForm}
          />
        );
      case 41:
        return (
          <div className="row col-12">
            <div className="col-lg-6 col-md-6 col-sm-12">
              <TextAreaInput
                id="NutritionAdvise"
                className="col-12"
                value={prisciptionForm.NutritionAdvise}
                lable={t("Advice")}
                onChange={handlechangebyPrisciption}
                onFocus={(e) => handleInputFocus(e, "NutritionAdvise")}
                name="NutritionAdvise"
                disabled={isInputDisabled(item.Gender)}
                maxLength={getCharLimit(item?.AccordianName)}
              />
              <div className="text-right text-sm text-muted mb-1">
                {`${(prisciptionForm[item?.AccordianName] || "").length} / ${getCharLimit(item?.AccordianName)}`}
              </div>
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12">
              <TextAreaInput
                id="NutritionAdviseRemarks"
                className="col-12"
                value={prisciptionForm.NutritionAdviseRemarks}
                lable={t("Remarks")}
                onChange={handlechangebyPrisciption}
                onFocus={(e) => handleInputFocus(e, "NutritionAdviseRemarks")}
                name="NutritionAdviseRemarks"
                disabled={isInputDisabled(item.Gender)}
                maxLength={getCharLimit(item?.AccordianName)}
              />
              <div className="text-right text-sm text-muted mb-1">
                {`${(prisciptionForm[item?.AccordianName] || "").length} / ${getCharLimit(item?.AccordianName)}`}
              </div>
            </div>
          </div>
        );
      case 40:
        return (
          <>
            <div className="d-flex align-items-center justify-items-center ml-2 mb-2 ">
              <div className="d-flex align-items-center justify-items-center">
                <RadioButton
                  inputId="yes"
                  name="yes"
                  value="1"
                  checked={prisciptionForm.admissionRequired}
                  onChange={() => {
                    setPrisciptionForm((prev) => ({
                      ...prev,
                      admissionRequired: !prisciptionForm.admissionRequired,
                    }));
                  }}
                />
                <label htmlFor="yes" className="m-2">
                  {t("Yes")}
                </label>
              </div>
              <div className="d-flex align-items-center justify-items-center">
                <RadioButton
                  inputId="no"
                  name="no"
                  value="0"
                  // checked={true}
                  checked={!prisciptionForm.admissionRequired}
                  // checked={Number(prisciptionForm.admissionRequired) === 1 ? true: false}
                  onChange={() => {
                    setPrisciptionForm((prev) => ({
                      ...prev,
                      admissionRequired: !prisciptionForm.admissionRequired,
                    }));
                  }}
                />
                <label htmlFor="no" className="m-2">
                  {t("No")}
                </label>
              </div>
            </div>
            {prisciptionForm?.admissionRequired && (
              <DatePicker
                className="custom-calendar"
                id="AdmissionDate"
                name="AdmissionDate"
                lable={t("Admision Date")}
                placeholder={VITE_DATE_FORMAT}
                respclass={"col-12 mt-2"}
                value={
                  prisciptionForm?.AdmissionDate
                    ? moment(
                        prisciptionForm.AdmissionDate,
                        "DD-MMM-YYYY",
                      ).toDate()
                    : null
                }
                handleChange={(date) => {
                  const formattedDate = moment(date?.value).format(
                    "DD-MMM-YYYY",
                  );
                  const event = {
                    target: {
                      name: "AdmissionDate",
                      value: formattedDate,
                    },
                  };
                  handlechangebyPrisciption(event);
                }}
                disabled={isInputDisabled(item.Gender)}
              />
            )}
          </>
        );

      case 44:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="doctorAdditionalAdvice"
              value={prisciptionForm.doctorAdditionalAdvice}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "doctorAdditionalAdvice")}
              suggestions={textAreaSuggestions?.doctorAdditionalAdvice}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter additional advice...")}
            />

            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm.doctorAdditionalAdvice || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 43:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="doctorRemarks"
              value={prisciptionForm.doctorRemarks}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "doctorRemarks")}
              suggestions={textAreaSuggestions?.doctorRemarks}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter Doctor's Remarks...")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm.doctorRemarks || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 8:
        return (
          <>
            {/* <textarea
              id={""}
              className="w-100 "
              value={prisciptionForm.Allergies}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "Allergies")}
              name="Allergies"
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
            /> */}
            <SuggestionTextarea
              id=""
              className="w-100"
              name="Allergies"
              value={prisciptionForm.Allergies}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "Allergies")}
              suggestions={textAreaSuggestions?.allergies}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter Allergies...")}
            />

            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm.Allergies || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 34:
        return !isPregnancy ? null : (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="paExaminantion"
              value={prisciptionForm?.paExaminantion}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "paExaminantion")}
              suggestions={textAreaSuggestions?.paExaminantion}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter PA Examination...")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 35:
        return !isPregnancy ? null : (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="pvExaminantion"
              value={prisciptionForm?.pvExaminantion}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "pvExaminantion")}
              suggestions={textAreaSuggestions?.pvExaminantion}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter PV Examination...")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 14:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="ConfidentialData"
              value={prisciptionForm.ConfidentialData}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "ConfidentialData")}
              suggestions={textAreaSuggestions?.confidentialData}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter Confidential Data...")}
            />
            <div className="text-right text-sm text-muted">
              {(prisciptionForm.ConfidentialData || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 15:
        return (
          <TransferReffralConsultation
            prisciptionForm={prisciptionForm}
            handlechangebyPrisciption={handlechangebyPrisciption}
            onFocus={handleInputFocus}
            handleReactSelectChangebyPrisciption={
              handleReactSelectChangebyPrisciption
            }
            disabled={isInputDisabled(item.Gender)}
          />
        );

      case 22:
        return (
          <>
            <DatePicker
              className="custom-calendar"
              id="NextVisit"
              name="NextVisit"
              lable={t("Visit Date")}
              placeholder={VITE_DATE_FORMAT}
              respclass={"w-100"}
              value={
                prisciptionForm?.NextVisit
                  ? moment(prisciptionForm.NextVisit, "DD-MMM-YYYY").toDate()
                  : null
              }
              handleChange={(date) => {
                const formattedDate = moment(date?.value).format("DD-MMM-YYYY");
                const event = {
                  target: {
                    name: "NextVisit",
                    value: formattedDate,
                  },
                };
                handlechangebyPrisciption(event);
              }}
              // handleChange={handlechangebyPrisciption}
              disabled={isInputDisabled(item.Gender)}
            />
            {/* <TextAreaInput
              id="NextVisitRemarks"
              className="col-12 mt-2"
              value={prisciptionForm.NextVisitRemarks}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "NextVisitRemarks")}
              name="NextVisitRemarks"
zxc            /> */}
            {/* <div className="col-lg-6 col-md-6 col-sm-12"> */}
            <TextAreaInput
              id="NextVisitRemarks"
              className="col-12"
              value={prisciptionForm.NextVisitRemarks}
              lable={t("Next Visit Remarks")}
              onChange={handlechangebyPrisciption}
              onFocus={(e) => handleInputFocus(e, "NextVisitRemarks")}
              name="NextVisitRemarks"
              maxLength={getCharLimit(item?.AccordianName)}
            />
            <div className="text-right text-sm text-muted mb-1">
              {`${(prisciptionForm[item?.AccordianName] || "").length} / ${getCharLimit(item?.AccordianName)}`}
            </div>

            {/* Turn the next visit date into an actual appointment. It is created
                unconfirmed, like an appointment booked online, and the front
                office confirms it - so writing a follow-up date and booking it
                stay separate decisions. */}
            <div className="col-12 mb-2">
              {/* Solid, white-on-blue: the theme paints this block orange, and an
                  outline button's blue text on it could not be read. */}
              <button
                type="button"
                title={t("Book the follow-up appointment for this visit date")}
                aria-label={t("Book Follow-up Appointment")}
                className="btn btn-sm d-inline-flex align-items-center"
                style={{
                  gap: 8,
                  padding: "0 14px 0 10px",
                  background: "#2563eb",
                  borderColor: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  borderRadius: 6,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                  whiteSpace: "nowrap",
                }}
                onClick={() => setShowFollowUpBooking(true)}
                disabled={isInputDisabled(item.Gender)}
              >
                <img src={icBookFollowUp} alt="" width={18} height={18} />
                {t("Book Follow-up")}
              </button>
              {!prisciptionForm?.NextVisit && (
                <div className="text-sm text-muted mt-1">
                  {t("Pick the visit date above and it is carried into the booking.")}
                </div>
              )}
            </div>

            <FollowUpAppointmentModal
              visible={showFollowUpBooking}
              setVisible={setShowFollowUpBooking}
              patient={patientDetail?.currentPatient}
              defaultDoctorID={followUpDoctorID}
              doctorOptions={followUpDoctorOptions}
              defaultDate={prisciptionForm?.NextVisit}
              defaultRemarks={prisciptionForm?.NextVisitRemarks}
            />
            {/* </div> */}
          </>
        );

      case 23:
        return (
          <MenstrualAndObstetric
            loadSaveData={loadSaveData}
            setPregnancyDetails={setPregnancyDetails}
            patientDetail={patientDetail}
            disabled={isInputDisabled(item.Gender)}
            // isPregnancy={isPregnancy}
          />
        );

      case 26:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="RiskFactor"
              value={prisciptionForm.RiskFactor}
              onFocus={(e) => handleInputFocus(e, "RiskFactor")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.riskFactors}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter Risk Factors...")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 27:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="AnyAncHospitalisations"
              value={prisciptionForm.AnyAncHospitalisations}
              onFocus={(e) => handleInputFocus(e, "AnyAncHospitalisations")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.anyAncHospitalisations}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Any ANC Hospitalisations?")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 28:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="NST"
              value={prisciptionForm.NST}
              onFocus={(e) => handleInputFocus(e, "NST")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.nst}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("NST Result")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 29:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="PelvicAssessment"
              value={prisciptionForm.PelvicAssessment}
              onFocus={(e) => handleInputFocus(e, "PelvicAssessment")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.pelvicAssessment}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Enter Pelvic Assessment...")}
            />
            <div className="text-right text-sm text-muted">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 30:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="ParturitionDetailsAndOutCome"
              value={prisciptionForm.ParturitionDetailsAndOutCome}
              onFocus={(e) =>
                handleInputFocus(e, "ParturitionDetailsAndOutCome")
              }
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.parturitionDetails}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Parturition Details and Outcome")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 36:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="historyOfCovid"
              value={prisciptionForm.historyOfCovid}
              onFocus={(e) => handleInputFocus(e, "historyOfCovid")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.historyOfCovid}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("COVID History")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 37:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="historyOfPresentIllness"
              value={prisciptionForm.historyOfPresentIllness}
              onFocus={(e) => handleInputFocus(e, "historyOfPresentIllness")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.historyOfPresentIllness}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("History of Present Illness")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 38:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="surgicalHistory"
              value={prisciptionForm.surgicalHistory}
              onFocus={(e) => handleInputFocus(e, "surgicalHistory")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.surgicalHistory}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Surgical History")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );
      case 52:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="FamilyHistoryRemark"
              value={prisciptionForm.FamilyHistoryRemark}
              onFocus={(e) => handleInputFocus(e, "FamilyHistoryRemark")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.FamilyHistoryRemark}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Family History Remark")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 39:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="imunigrationHistory"
              value={prisciptionForm.imunigrationHistory}
              onFocus={(e) => handleInputFocus(e, "imunigrationHistory")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.imunigrationHistory}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Immunization History")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 42:
        return (
          <>
            <SuggestionTextarea
              id=""
              className="w-100"
              name="precaution"
              value={prisciptionForm.precaution}
              onFocus={(e) => handleInputFocus(e, "precaution")}
              onChange={handlechangebyPrisciption}
              suggestions={textAreaSuggestions?.precaution}
              disabled={isInputDisabled(item.Gender)}
              maxLength={getCharLimit(item?.AccordianName)}
              placeholder={t("Medicine History")}
            />
            <div className="text-right text-sm text-muted mb-1">
              {(prisciptionForm[item?.AccordianName] || "").length} /{" "}
              {getCharLimit(item?.AccordianName)}
            </div>
          </>
        );

      case 2:
        return (
          <div className="p-1">
            <div className="d-flex" style={{ gap: "5px" }}>
              <ReactSelect
                name="categoryId"
                placeholderName="Category"
                dynamicOptions={[
                  { label: t("All"), value: "" },
                  ...labCategoryList,
                ]}
                respclass="flex-grow-1"
                value={labCategoryIds?.categoryId}
                removeIsClearable={true}
                handleChange={(name, e) =>
                  setLabCategoryIds({
                    ...labCategoryIds,
                    categoryId: e?.value,
                    subCategoryId: "",
                  })
                }
              />
              <ReactSelect
                name="subCategoryId"
                dynamicOptions={[
                  { label: t("All"), value: "" },
                  ...labSubCategoryList,
                ]}
                placeholderName="Sub Category"
                respclass="flex-grow-1"
                value={labCategoryIds?.subCategoryId}
                removeIsClearable={true}
                handleChange={(name, e) => {
                  const newSubCategoryId = e?.value;

                  const updatedState = {
                    ...labCategoryIds,
                    subCategoryId: newSubCategoryId,
                  };

                  setLabCategoryIds(updatedState);
                }}
              />
            </div>
            <ChipAutocomplete
              chips={tags[item?.AccordianName] || []}
              inputValue={inputValue[item?.AccordianName] || ""}
              suggestions={filteredItems[item?.AccordianName]}
              onInputChange={handleChange}
              onSearch={(e) => search(e, item?.AccordianName)}
              onSelect={(e) => onSelected(e, item?.AccordianName)}
              onRemove={(index) =>
                removeTag(item?.AccordianName, index, null, "")
              }
              onUpdate={(index, newValue) =>
                handleTagUpdate(item?.AccordianName, index, newValue)
              }
              onFocus={(e) => handleInputFocus(e, item?.AccordianName)}
              placeholder={t("Type and Press Enter")}
              name={item?.AccordianName}
              id="searchtest"
              itemTemplate={itemTemplate}
              urgentEnabled={item?.AccordianName === "Investigation(Lab & Radio)"}
              isChipUrgent={(chip) => !!chip?.isUrgent}
              onToggleUrgent={handleToggleInvestigationUrgent}
              disabled={
                isInputDisabled(item.Gender) ||
                (tags[item?.AccordianName] || [])
                  .map((tag) => tag?.ValueField || "")
                  .join(" ").length >= getCharLimit(item?.AccordianName)
              }
              maxLength={getCharLimit(item?.AccordianName)}
            />

            <textarea
              id={""}
              className="w-100 mt-1"
              value={inputValue["Remarks"]}
              onFocus={(e) => handleInputFocus(e, "labRemarks")}
              name="Remarks"
              placeholder={t("Enter remarks")}
              // onChange={handleChangeRemarks}
              maxLength={getCharLimit(item?.AccordianName)}
              onChange={(e) =>
                setInputValue((val) => ({
                  ...val,
                  [e.target.name]: e.target.value,
                }))
              }
              onKeyDown={handleChangeRemarks}
            />
            <div className="text-right text-sm text-muted mb-1">
              {`${
                (tags[item?.AccordianName] || [])
                  .map((tag) => tag?.ValueField || "")
                  .join(" ").length
              } / ${getCharLimit(item?.AccordianName)}`}
            </div>
          </div>
        );

      default:
        return (
          <>
            <div className="text-right text-sm text-muted mb-1">
              {`${
                (tags[item?.AccordianName] || [])
                  .map((tag) => tag?.ValueField || "")
                  .join(" ").length
              } / ${getCharLimit(item?.AccordianName)}`}
            </div>
            {console.log(
              "tags[item?.AccordianName]",
              items[item?.AccordianName],
            )}
            <ChipAutocomplete
              chips={tags[item?.AccordianName] || []}
              inputValue={inputValue[item?.AccordianName] || ""}
              suggestions={
                filteredItems[item?.AccordianName] || items[item?.AccordianName]
              }
              onInputChange={handleChange}
              onSearch={(e) => search(e, item?.AccordianName)}
              onSelect={(e) => onSelected(e, item?.AccordianName)}
              onRemove={(index) =>
                removeTag(item?.AccordianName, index, null, "")
              }
              onUpdate={(index, newValue) =>
                handleTagUpdate(item?.AccordianName, index, newValue)
              }
              onFocus={(e) => handleInputFocus(e, item?.AccordianName)}
              placeholder={t("Type and Press Enter")}
              name={item?.AccordianName}
              id="searchtest"
              itemTemplate={itemTemplate}
              disabled={
                isInputDisabled(item.Gender) ||
                (tags[item?.AccordianName] || [])
                  .map((tag) => tag?.ValueField || "")
                  .join(" ").length >= getCharLimit(item?.AccordianName)
              }
              maxLength={getCharLimit(item?.AccordianName)}
            />
          </>
        );
    }
  };

  const handleEmailModalOpen = (component, header) => {
    setEmailModal({
      isShow: true,
      component: component,
      size: null,
      Header: header,
    });
  };

  const handleSMSModalOpen = (component, header) => {
    setSmsModal({
      isShow: true,
      component: component,
      size: null,
      Header: header,
    });
  };

  const handleClickDataSet = () => {
    if (actionType === "ConsentForm") {
      childRef.current.callChildFunction();
      // childRef.current.callChildFunctionSaveDiagnosisInformationSave(); // Call save function
    } else if (actionType === "Update") {
      childRef.current.callChildFunctionUpdated(); // Call edit function
    } else if (actionType === "SaveDiagnosis") {
      childRef.current.callChildFunctionSaveDiagnosisInformationSave();
    } else if (actionType === "VitalSign") {
      childRef.current.callChildFunctionHandleSaveVitals();
    } else if (actionType === "UpdateVitalSign") {
      childRef.current.callChildFunctionHandleUpdateVitals();
    }
  };

  // Dynamic Component Import
  const importComponent = (path) => {
    return React.lazy(() =>
      import(`../../../../../pages/doctor/OPD/${path}.jsx`)
        .then((module) => ({ default: module.default }))
        .catch(() => ({
          default: () => <div>{t("Component not found:")} {path}</div>,
        })),
    );
  };

  const handleSelectChange = (name, e) => {
    switch (e?.label) {
      case "Final Diagnosis":
        setActionType("SaveDiagnosis");
        break;
      case "Vital Sign":
        setActionType("VitalSign");
        break;
      case "Consent Form":
        setActionType("ConsentForm");
        break;
      default:
        break;
    }
    const selectedItem = apiData.getCPEOMenuList.find(
      (item) => item?.menuName === e?.label,
    );
    if (!selectedItem) {
      return;
    }

    // const SelectedComponent = componentMapping[selectedItem?.menuName] || NotFound;
    const SelectedComponent = importComponent(selectedItem?.url) || NotFound;
    setSelectedOption(name);

    // Open the modal with the selected component or NotFound component
    setOpenPageModal({
      isShow: true,
      component: (
        <Suspense fallback={<div>{t("Loading...")}</div>}>
          <SelectedComponent
            patientDetail={patientDetail} // Pass relevant props
            getDoctorID={getDoctorID}
            setActionType={setActionType}
            ref={childRef}
            menuItemData={selectedItem}
            toggleAction={toggleAction}
            onDiagnosisSaved={handleDiagnosisSaved}
          />
        </Suspense>
      ),
      Header: selectedItem?.menuName,
      size: "80vw", // Adjust size based on your requirement
    });
  };

  // Update for Consent Form
  const toggleAction = (params) => {
    setActionType(params === "Save" ? "Save" : "Update");
  };

  const [patientAllDetail, setPatientAllDetail] = useState({});
  // Preview header: OPD card details of this visit (CardPrint/GetConsultationHeaderInfo).
  const [visitHeaderInfo, setVisitHeaderInfo] = useState({});
  const vh = (key) => {
    const v = visitHeaderInfo?.[key.charAt(0).toLowerCase() + key.slice(1)] ?? visitHeaderInfo?.[key];
    return v === null || v === undefined ? "" : String(v).trim();
  };
  useEffect(() => {
    const tid = patientDetail?.currentPatient?.TransactionID;
    setVisitHeaderInfo({});
    if (!tid) return;
    let alive = true;
    getConsultationHeaderInfo(tid).then((resp) => {
      if (alive && resp?.success && resp?.data) setVisitHeaderInfo(resp.data);
    });
    return () => {
      alive = false;
    };
  }, [patientDetail?.currentPatient?.TransactionID]);

  const getPatientDetails = async () => {
    // debugger
    let apiResp = await PatientSearchbyBarcode(
      patientDetail?.currentPatient?.PatientID,
      1,
    );
    if (apiResp?.success) {
      setPatientAllDetail(apiResp?.data);
    }
  };

  useEffect(() => {
    // debugger
    if (patientDetail?.currentPatient?.PatientID) {
      const { PatientID, TransactionID } = patientDetail?.currentPatient;
      getLoadPrescriptionView(TransactionID, PatientID);
    }
    getPatientDetails();
    // fetchAllApiData();
    getBindMenuCPEOList();
    // data?.DoctorID
  }, [patientDetail?.currentPatient?.PatientID, reloadDoctor]);

  useEffect(() => {
    if (!showSuggestions) {
      const labels = document.querySelectorAll(".theme-color");
      labels.forEach((label) => {
        label.style.color = "black !important";
      });
    }
  }, [showSuggestions]);

  // Save prisciption form

  const newPayload = {
    investigations: [],
    procedures: [],
    medicines: [],
    molecularAllergies: [],
    // prescriptionHeader: [1,2],
    prescriptionHeader: prescription.map((item, index) => {
      return { Id: item.ID };
    }),
    transactionID: patientDetail?.currentPatient?.TransactionID,
    app_ID: patientDetail?.currentPatient?.App_ID,
    patientID: patientDetail?.currentPatient?.PatientID,
    chiefComplaint: "",
    doctorNotes: "",
    /* The ID, not the name. cpoe_referralConsultation.DoctorID is a narrow column
       built for an id: a name written into it is silently truncated (DR. SOK
       KHEMVITOU was stored as DR. SOK KHE), which left the front office unable to
       match the referral back to a bookable doctor.
       In-House -> doctor_master.DoctorID, which the front office books against.
       Out-Side -> doctor_referal.DoctorID, the referral id of a doctor at another
       hospital: shown at the counter, but no appointment is generated here.
       doctorType below is what says which of the two this is. */
    refferdoctor: prisciptionForm.referTo?.value ?? prisciptionForm.referTo ?? "",
    clinicalExamination: "",
    appointmentDoctorID: getDoctorID,
    vaccinationStatus: [],
    allergies: prisciptionForm.Allergies,
    medications: "",
    progressionComplaint: "",
    ledgerTransactionNo: patientDetail?.currentPatient?.LedgerTnxNo,
    provisionalDiagnosis: "",
    doctorAdvice: [],
    confidentialData: prisciptionForm.ConfidentialData,
    referral: prisciptionForm.ImpressionDiagnosis,
    referralRemarks: prisciptionForm.Remarks,
    referaltype: prisciptionForm.referralType?.value
      ? prisciptionForm.referralType?.value
      : prisciptionForm.referralType,
    consultationType: prisciptionForm.consultType?.value
      ? prisciptionForm.consultType?.value
      : prisciptionForm.consultType,
    referDept: prisciptionForm.department?.label
      ? prisciptionForm.department?.label
      : prisciptionForm.department,
    doctorType: prisciptionForm.DoctorType?.value
      ? prisciptionForm.DoctorType?.value
      : prisciptionForm.DoctorType,
    appointmentDate: patientDetail?.currentPatient?.AppointmentDate,
    appointmentTime: "",
    isDoctorAppointment: 0,
    isIPDData: type === "Emergency" ? 2 : 0,
    personalHistory: [],
    generalExamination: [],
    nextVisit: prisciptionForm.NextVisit,
    nextVisitRemarks: prisciptionForm.NextVisitRemarks,
    diet: [],
    followUpVisit: "",
    cvs: prisciptionForm.CVS,
    ent: prisciptionForm.ENT,
    rs: prisciptionForm.RS,
    pa: prisciptionForm.PA,
    cns: prisciptionForm.CNS,
    general: prisciptionForm.General,
    pregnancyBasicDetails: pregnancyDetails,
    detailsOfPrevious: previousPregnancyData ? previousPregnancyData : [],
    familyHistories: familyHistoryData ? familyHistoryData : [],
    riskFactors: prisciptionForm.RiskFactor,
    anyAncHospitalisations: prisciptionForm.AnyAncHospitalisations,
    nst: prisciptionForm.NST,
    pelvicAssesment: prisciptionForm.PelvicAssessment,
    parturitionDetails: prisciptionForm.ParturitionDetailsAndOutCome,

    historyOfCovid: prisciptionForm.historyOfCovid,
    historyOfPresentIllness: prisciptionForm.historyOfPresentIllness,
    surgicalHistory: prisciptionForm.surgicalHistory,
    familyHistoryRemarks: prisciptionForm.FamilyHistoryRemark,
    imunigrationHistory: prisciptionForm.imunigrationHistory,
    precaution: prisciptionForm.precaution,
    admissionRequired: prisciptionForm.admissionRequired ? 1 : 0,
    AdmissionDate: prisciptionForm.AdmissionDate,
    NutritionAdviseRemarks: prisciptionForm.NutritionAdviseRemarks,
    NutritionAdvise: prisciptionForm.NutritionAdvise,

    pallor: prisciptionForm.pallor,
    odema: prisciptionForm.odema,
    uterus: prisciptionForm.uterus,
    varicoseVeins: prisciptionForm.varicoseVeins,
    nodes: prisciptionForm.nodes,
    breasts: prisciptionForm.breasts,
    respiratory: prisciptionForm.respiratory,
    anyAdventitiousSounds: prisciptionForm.anyAdventitiousSounds,
    DoctorRemarks: prisciptionForm.doctorRemarks,
    DoctorAdditionalAdvice: prisciptionForm.doctorAdditionalAdvice,

    knownOfs:
      tags &&
      tags["Known OFF"].map((item) => {
        return {
          ValueField: item.ValueField,
        };
      }),
    keyNote:
      tags &&
      tags["Key Note"].map((item) => {
        return {
          ValueField: item.ValueField,
        };
      }),
    previousDoctor:
      tags &&
      tags["Previous Doctor"].map((item) => {
        return {
          ValueField: item.ValueField,
        };
      }),

    paExaminantion: {
      value: prisciptionForm?.paExaminantion,
    },

    pvExaminantion: {
      value: prisciptionForm?.pvExaminantion,
    },
    updateVitalsDTO: {
      id: vitalSign?.ID || 0,
      bp: vitalSign?.bp || "",
      p: vitalSign?.p || "",
      t: vitalSign?.t || "",
      ht: vitalSign?.ht || "",
      wt: vitalSign?.wt || "",
      repiratory: vitalSign?.respiratory || "",
      spO2: vitalSign?.spO2 || "",
      allergy: vitalSign?.allergy || "",
    },
  };

  // ----------------------------------------------------------------------------------------------------

  const handlechangebyPrisciption = (e) => {
    const { name, value } = e.target;
    setPrisciptionForm((prevForm) => {
      const keys = name.split(".");
      if (keys.length === 1) {
        // If it's a top-level field
        return {
          ...prevForm,
          [name]: value,
        };
      } else {
        // If it's a nested field
        return {
          ...prevForm,
          [keys[0]]: {
            ...prevForm[keys[0]],
            [keys[1]]: value,
          },
        };
      }
    });
  };

  const handleReactSelectChangebyPrisciption = (name, selectedOption) => {
    setPrisciptionForm((prevForm) => {
      const keys = name.split("."); // Split the name on dots if it's nested
      if (keys.length === 1) {
        // If it's a top-level field
        return {
          ...prevForm,
          [name]: selectedOption, // Update with the selected value
          ...(name === "department" && { referTo: null }),
          // [name]: selectedOption?.value, // Update with the selected value
        };
      } else {
        // If it's a nested field
        return {
          ...prevForm,
          [keys[0]]: {
            ...prevForm[keys[0]],
            [keys[1]]: selectedOption?.value,
          },
        };
      }
    });
  };

  /* Mark one prescribed investigation urgent. It rides on the tag itself, so it
     survives editing and removal of the others, and goes to patient_test.IsUrgent -
     a column that has always existed but which nothing outside Emergency ever set.
     The front office reads it back on the CPOE popup. */
  const handleToggleInvestigationUrgent = (index) => {
    setTags((prev) => {
      const list = [...(prev["Investigation(Lab & Radio)"] || [])];
      if (!list[index]) return prev;
      list[index] = { ...list[index], isUrgent: !list[index]?.isUrgent };
      return { ...prev, ["Investigation(Lab & Radio)"]: list };
    });
  };

  const handleSavePriscciptionForm = async (type) => {
    saveVitals(false); // doctor's vitals edits go with the prescription
    const investigations = tags["Investigation(Lab & Radio)"] || [];

    const investigationsData = investigations.length
      ? investigations.map((ele) => {
          // const isGeneratedID = !ele?.ID || ele.ID === "0"||ele?.isDefaultTemplate || ele?.isOutSource ==1;
          const isGeneratedID =
            !ele?.ID || ele.ID === "0" || ele?.isOutSource == 1;
          const test_ID = isGeneratedID
            ? Math.floor(100000 + Math.random() * 900000).toString()
            : ele.ID;
          // debugger;
          return {
            patientID: patientDetail?.currentPatient?.PatientID,
            app_ID: patientDetail?.currentPatient?.App_ID,
            transactionID: patientDetail?.currentPatient?.TransactionID,
            test_ID,
            name: ele?.ValueField,
            ledgerTransactionNo: patientDetail?.currentPatient?.LedgerTnxNo,
            quantity: 1,
            remarks: ele?.remarks,
            prescribeDate: new Date().toISOString(),
            configID: "25",
            isUrgent: ele?.isUrgent ? "1" : "0",
            outsource: isGeneratedID ? 1 : 0,
            doctorID: getDoctorID,
            createdBy: "",
            isPackage: 0,
            isIPDData: "0",
            IsDefaultTemplet: ele?.isDefaultTemplate ? 1 : 0,
          };
        })
      : [];

    const procedureData = tags["Prescribed Procedure"].map((ele) => ({
      patientID: patientDetail?.currentPatient?.PatientID,
      app_ID: patientDetail?.currentPatient?.App_ID,
      transactionID: patientDetail?.currentPatient?.TransactionID,
      test_ID: ele?.ID ? ele?.ID : "0",
      name: ele?.ValueField,
      ledgerTransactionNo: patientDetail?.currentPatient?.LedgerTnxNo,
      quantity: 1,
      remarks: "",
      prescribeDate: new Date().toISOString(),
      configID: "3",
      isUrgent: "",
      outsource: ele?.isDefaultTemplate ? 1 : 0,
      doctorID: getDoctorID,
      createdBy: "",
      isPackage: 0,
      isIPDData: "0",
      IsDefaultTemplet: ele?.isDefaultTemplate ? 1 : 0,
    }));

    const medicineData = tags["Prescribed Medicine"]
      ?.filter((item) => item.Name) // First filter to remove items with missing Name or Dose
      .filter((item) => Object.keys(item.Name).length > 0) // Second filter to remove rows where Name or Dose are empty objects
      .filter(Boolean); // Remove any null or undefined values

    // const payloadMedicine = {
    const payloadMedicine = medicineData.map((item) => ({
      patientID: patientDetail?.currentPatient?.PatientID,
      transactionID: patientDetail?.currentPatient?.TransactionID,
      app_ID: patientDetail?.currentPatient?.App_ID,
      ledgerTransactionNo: patientDetail?.currentPatient?.LedgerTnxNo,
      doctorID: getDoctorID,
      // a hand-typed medicine has no dose / times / days / meal / route yet: send "" not
      // undefined, so the API never receives nulls for them
      meal: (typeof item.Meal === "object" ? item.Meal?.value : item.Meal) ?? "",
      medicine_ID: item?.AllItemListData?.medicine_ID || item?.Name?.ID || null,
      medicineName: (item.Name?.value || item.Name) ?? "",
      // noOfDays: item.Duration.value || item.Duration,
      noOfDays:
        (typeof item.Duration === "object" ? item.Duration?.value : item.Duration) ?? "",
      // noTimesDay: item.Time.value || item.Time,
      noTimesDay: (typeof item.Time === "object" ? item.Time?.value : item.Time) ?? "",
      remarks:
        (typeof item.Remarks === "object" ? item.Remarks?.value : item.Remarks) ?? "",
      quantity:
        typeof item?.Quantity === "object" &&
        Object.keys(item?.Quantity).length === 0
          ? 1
          : typeof item?.Quantity === "object"
            ? parseInt(item?.Quantity?.value) || 1
            : item?.Quantity || 1,

      route: (typeof item.Route === "object" ? item.Route?.value : item.Route) ?? "",
      dose: (typeof item.Dose === "object" ? item.Dose?.value : item.Dose) ?? "",
      // route: item.Route.value ? item.Route.value : typeof(item.Route)!=="object"?item.Route:"",
      // quantity: 0,
      // dose: item.Dose.value ? item.Dose.value : typeof(item.Dose)!=="object"?item.Dose:"",
      // quantity: 0,
      // dose: item.Dose.value || item.Dose,
      enteryBy: "",
      // route: item.Route.value || item.Route,
      isEmergency: "",
      centreID: localData?.centreID,
      hospital_ID: localData?.hospital_ID,
      isIPDData: "0",
      changeReason: "",
      ischange: 0,
      date: new Date().toISOString(),
      outsource: 0,
      isEmergencyData: 0,
      composition: item?.Name?.Generic ? String(item?.Name?.Generic) : "",
    }));

    // }
    const mapAndCreatePayload = (tagKey, tabID, tabValue) => {
      const dynamicData = tags[tagKey].map((item) => ({
        Value: item?.ValueField,
        TABID: tabID,
        TabValue: tabValue,
      }));

      return {
        TABID: dynamicData[0]?.TABID,
        TabValue: dynamicData[0]?.TabValue,
        Value: dynamicData?.map((item) => item.Value),
      };
    };

    const chiefComplaintPayload = mapAndCreatePayload(
      "Chief Complaint",
      6,
      "Chief Complaint",
    );
    const doctorNotesPayload = mapAndCreatePayload(
      "Doctor Notes",
      5,
      "Doctor Notes",
    );
    const doctorAdvicePayload = mapAndCreatePayload(
      "Doctor Advice",
      13,
      "Doctor Advice",
    );
    const personalHistoryPayload = mapAndCreatePayload(
      "Personal/Occupational History",
      18,
      "Personal/Occupational History",
    );
    const generalExaminationDynamic = mapAndCreatePayload(
      "General Examination",
      19,
      "General Examination",
    );
    const vaccinationStatusDynamic = mapAndCreatePayload(
      "Vaccination Status",
      7,
      "Vaccination Status",
    );
    const pastHistoryDynamic = mapAndCreatePayload(
      "Past History",
      10,
      "Past History",
    );
    const treatmentHistoryDynamic = mapAndCreatePayload(
      "Treatment History",
      16,
      "Treatment History",
    );
    const ProvisionalDiagnosisDynamic = mapAndCreatePayload(
      "Provisional Diagnosis",
      12,
      "Provisional Diagnosis",
    );
    const signAndSymptonsDynamic = mapAndCreatePayload(
      "Sign & Symptoms",
      4,
      "Sign & Symptoms",
    );
    const dietDynamic = mapAndCreatePayload("Diet", 21, "Diet");

    newPayload.transactionID = patientDetail?.currentPatient?.TransactionID; // Example of setting a single value
    newPayload.app_ID = patientDetail?.currentPatient?.App_ID;
    newPayload.patientID = patientDetail?.currentPatient?.PatientID;

    // // Update arrays in the payload
    newPayload.investigations = investigationsData; // Add Your Investigation Data
    // newPayload.procedures = []; // Add your procedures data
    newPayload.procedures = procedureData; // Add your procedures data
    newPayload.medicines = payloadMedicine; // Add your medicines data

    // // Example of updating with form data (assuming you have form data to insert)
    newPayload.chiefComplaint = chiefComplaintPayload;
    newPayload.doctorNotes = doctorNotesPayload;
    newPayload.doctorAdvice = doctorAdvicePayload;
    newPayload.personalHistory = personalHistoryPayload;
    newPayload.generalExamination = generalExaminationDynamic;
    newPayload.diet = dietDynamic;
    newPayload.vaccinationStatus = vaccinationStatusDynamic;
    newPayload.progressionComplaint = pastHistoryDynamic;
    newPayload.medications = treatmentHistoryDynamic;
    newPayload.provisionalDiagnosis = ProvisionalDiagnosisDynamic;
    newPayload.clinicalExamination = signAndSymptonsDynamic;
    // // Check the updated payload

    // Now you can make the API call with the updated payload
    // debugger
    try {
      if (
        type === "save" &&
        loadSaveData?.transactionID !==
          patientDetail?.currentPatient?.TransactionID
      ) {
        // debugger
        notify(t("You can't copy old data to current appointment data"), "error");
        return false;
      }

      const apiResponse = await SavePrescriptionForm(newPayload);

      if (apiResponse.success) {
        if (type === "copy") {
          notify(t("Prescription Copied successfully"), "success");
          handleClearForm();
          getLoadPrescriptionData();
          setRunReport(true);
          handleDoctorTopSuggestions({
            doctorID: docID || currentDoctorID || getDoctorID,
          });
          return true;
        } else {
          notify(apiResponse.message, "success");
          handleClearForm();
          getLoadPrescriptionData();
          setRunReport(true);
          handleDoctorTopSuggestions({
            doctorID: docID || currentDoctorID || getDoctorID,
          });
          // return true;
        }
      }

      if (!apiResponse.success) {
        notify(apiResponse.message, "error");
      }
      setIsPrescriptionButton(true);
    } catch (error) {
      console.error("Error saving prescription form:", error);
    }
  };

  const handleSavePrescriptionDraft = async () => {
    const investigationsData = tags["Investigation(Lab & Radio)"].map(
      (ele) => ({
        patientID: patientDetail?.currentPatient?.PatientID,
        app_ID: patientDetail?.currentPatient?.App_ID,
        transactionID: patientDetail?.currentPatient?.TransactionID,
        test_ID: ele?.ID ? ele?.ID : "0",
        name: ele?.ValueField,
        ledgerTransactionNo: patientDetail?.currentPatient?.LedgerTnxNo,
        quantity: 1,
        remarks: "",
        prescribeDate: new Date().toISOString(),
        configID: "25",
        isUrgent: ele?.isUrgent ? "1" : "0",
        outsource: 0,
        doctorID: getDoctorID,
        createdBy: "",
        isPackage: 0,
        isIPDData: "0",
      }),
    );

    const procedureData = tags["Prescribed Procedure"].map((ele) => ({
      patientID: patientDetail?.currentPatient?.PatientID,
      app_ID: patientDetail?.currentPatient?.App_ID,
      transactionID: patientDetail?.currentPatient?.TransactionID,
      test_ID: ele?.ID ? ele?.ID : "0",
      name: ele?.ValueField,
      ledgerTransactionNo: patientDetail?.currentPatient?.LedgerTnxNo,
      quantity: 1,
      remarks: "",
      prescribeDate: new Date().toISOString(),
      configID: "3",
      isUrgent: "",
      outsource: 0,
      doctorID: getDoctorID,
      createdBy: "",
      isPackage: 0,
      isIPDData: "0",
    }));
    const medicineData = tags["Prescribed Medicine"]
      .map((item) => {
        if (
          item.Name?.value ||
          item.Duration?.value ||
          item.Time?.value ||
          item.Remarks?.value ||
          item.Dose?.value ||
          item.Route?.value
        ) {
          return {
            patientID: patientDetail?.currentPatient?.PatientID,
            transactionID: patientDetail?.currentPatient?.TransactionID,
            app_ID: patientDetail?.currentPatient?.App_ID,
            ledgerTransactionNo: patientDetail?.currentPatient?.LedgerTnxNo,
            doctorID: getDoctorID,
            medicine_ID: item?.Name?.ID || null,
            medicineName: item.Name?.value || "",
            noOfDays: item.Duration?.value || "",
            noTimesDay: item.Time?.value || "",
            remarks: item.Remarks?.value || "",
            quantity: 0,
            dose: item.Dose?.value || "",
            enteryBy: "",
            route: item.Route?.value || "",
            isEmergency: "",
            centreID: localData?.centreID,
            hospital_ID: localData?.hospital_ID,
            isIPDData: "0",
            changeReason: "",
            ischange: 0,
            date: new Date().toISOString(),
            outsource: 0,
            isEmergencyData: 0,
          };
        }
      })
      .filter(Boolean); // Yeh filter function undefined ya null values ko remove karega
    const mapAndCreatePayload = (tagKey, tabID, tabValue) => {
      const dynamicData = tags[tagKey].map((item) => ({
        Value: item?.ValueField,
        TABID: tabID,
        TabValue: tabValue,
      }));

      return {
        TABID: dynamicData[0]?.TABID,
        TabValue: dynamicData[0]?.TabValue,
        Value: dynamicData?.map((item) => item.Value),
      };
    };

    const chiefComplaintPayload = mapAndCreatePayload(
      "Chief Complaint",
      6,
      "Chief Complaint",
    );
    const doctorNotesPayload = mapAndCreatePayload(
      "Doctor Notes",
      5,
      "Doctor Notes",
    );
    const doctorAdvicePayload = mapAndCreatePayload(
      "Doctor Advice",
      13,
      "Doctor Advice",
    );
    const personalHistoryPayload = mapAndCreatePayload(
      "Personal/Occupational History",
      18,
      "Personal/Occupational History",
    );
    const generalExaminationDynamic = mapAndCreatePayload(
      "General Examination",
      19,
      "General Examination",
    );
    const vaccinationStatusDynamic = mapAndCreatePayload(
      "Vaccination Status",
      7,
      "Vaccination Status",
    );
    const pastHistoryDynamic = mapAndCreatePayload(
      "Past History",
      10,
      "Past History",
    );
    const treatmentHistoryDynamic = mapAndCreatePayload(
      "Treatment History",
      16,
      "Treatment History",
    );
    const ProvisionalDiagnosisDynamic = mapAndCreatePayload(
      "Provisional Diagnosis",
      12,
      "Provisional Diagnosis",
    );
    const signAndSymptonsDynamic = mapAndCreatePayload(
      "Sign & Symptoms",
      4,
      "Sign & Symptoms",
    );
    const dietDynamic = mapAndCreatePayload("Diet", 21, "Diet");

    newPayload.transactionID = patientDetail?.currentPatient?.TransactionID; // Example of setting a single value
    newPayload.app_ID = patientDetail?.currentPatient?.App_ID;
    newPayload.patientID = patientDetail?.currentPatient?.PatientID;

    // // Update arrays in the payload
    newPayload.investigations = investigationsData; // Add Your Investigation Data
    // newPayload.procedures = []; // Add your procedures data
    newPayload.procedures = procedureData; // Add your procedures data
    newPayload.medicines = medicineData; // Add your medicines data

    // // Example of updating with form data (assuming you have form data to insert)
    newPayload.chiefComplaint = chiefComplaintPayload;
    newPayload.doctorNotes = doctorNotesPayload;
    newPayload.doctorAdvice = doctorAdvicePayload;
    newPayload.personalHistory = personalHistoryPayload;
    newPayload.generalExamination = generalExaminationDynamic;
    newPayload.diet = dietDynamic;
    newPayload.vaccinationStatus = vaccinationStatusDynamic;
    newPayload.progressionComplaint = pastHistoryDynamic;
    newPayload.medications = treatmentHistoryDynamic;
    newPayload.provisionalDiagnosis = ProvisionalDiagnosisDynamic;
    newPayload.clinicalExamination = signAndSymptonsDynamic;
    // // Check the updated payload

    // Now you can make the API call with the updated payload
    try {
      const apiResponse = await SavePrescriptionDraft(
        newPayload,
        shouldSaveDraft,
      );

      if (apiResponse.success === true) {
        !shouldSaveDraft && notify(apiResponse.message, "success");
        handleClearForm();
        getLoadPrescriptionData();
      }
    } catch (error) {
      console.error("Error saving prescription form:", error);
    }
  };

  const handleClearForm = () => {
    setTags((prevTags) => {
      // Create a new object to update tags
      const updatedTags = { ...prevTags };

      // Reset all sections except "Prescribed Medicine"
      Object.keys(updatedTags).forEach((key) => {
        if (key === "Prescribed Medicine") {
          // Remove only those rows in "Prescribed Medicine" that have data
          updatedTags["Prescribed Medicine"] = updatedTags[
            "Prescribed Medicine"
          ].filter((medData) => {
            // Check if the row has data (non-empty)
            return Object.keys(medData).every(
              (medKey) => Object.keys(medData[medKey]).length === 0,
            );
          });
        } else {
          updatedTags[key] = []; // Reset other sections
        }
      });

      // Update the tags state
      return updatedTags;
    });

    setItems((prevItems) => {
      // Create a new object to update items
      const updatedItems = { ...prevItems };

      // Uncheck all items by setting checked to false
      Object.keys(updatedItems)?.forEach((mainArray) => {
        updatedItems[mainArray] = updatedItems[mainArray]?.map((item) => ({
          ...item,
          isChecked: false, // Ensure this field exists in item and set it to false
        }));
      });

      // Update the items state
      return updatedItems;
    });

    setPrisciptionForm((prev) => ({
      ...prescription,
      Allergies: "",
      ConfidentialData: "",
      NextVisit: new Date(),
      NextVisitRemarks: "",
      // SystematicExamination: "",
      CNS: "",
      ENT: "",
      RS: "",
      PA: "",
      General: "",
      CVS: "",
      // TransferReferralForConsultation: "",
      DoctorType: "",
      department: "",
      referTo: "",
      referralType: "",
      consultType: "",
      ImpressionDiagnosis: "",
      Remarks: "",
    }));
  };

  const settingBTNListSeemote = [
    {
      id: 1,
      name: "Doctor Prescription Ordering",
      onClick: "",
      component: (
        <DoctorPresciptionOrdering
          getDoctorID={getDoctorID}
          getLoadPrescriptionView={getLoadPrescriptionView}
          patientDetail={patientDetail?.currentPatient}
        />
      ),
    },
    {
      id: 4,
      name: "Doctor Leave",
      onClick: "",
      component: <DoctorLeave getDoctorID={getDoctorID} />,
    },
    {
      id: 6,
      name: "Im  Not Available",
      onClick: "",
      component: <DoctorNotAvailble getDoctorID={getDoctorID} />,
    },
  ];

  /// SMS Send API

  const [sms, setSms] = useState({
    mobileNo: "" || patientDetail?.currentPatient?.ContactNo,
    textSMS: "",
  });

  const [error1, setError1] = useState("");
  const [emailError, setEmailError] = useState("");

  const validatePhoneNumber = (value) => {
    const phoneRegex = /^[0-9]{10}$/; // Example: Indian phone number format
    if (!phoneRegex.test(value)) {
      setError1("Please enter a valid 10-digit phone number");
    } else {
      setError1("");
    }
  };

  const handleChangeSMS = (name, value) => {
    // const { name, value } = e.target;
    setSms((val) => ({ ...val, [name]: value?.value }));
  };

  const handleClickSentSMS = async () => {
    try {
      const res = await SaveSMS({
        mobile_No: sms.mobileNo
          ? sms.mobileNo
          : patientDetail?.currentPatient?.ContactNo,
        smS_Text: sms.textSMS,
        doctorID: getDoctorID,
        patientID: patientDetail?.currentPatient?.PatientID,
        templateID: 0,
        smsType: 1,
        bookingNo: patientDetail?.currentPatient?.App_ID,
      });

      if (res.success) {
        notify(res.message, "success");
        setSms((prev) => ({ ...prev, mobileNo: "", textSMS: "" }));
      }
    } catch (error) {}
  };

  const [emailSend, setEmailSend] = useState({
    toEmailID: "",
    emailSubject: "",
    emailBody: patientDetail?.currentPatient?.email,
    // attachementPath:""
  });

  const validateEmail = (value) => {
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };
  const emailHandleChange = (e) => {
    const { name, value } = e.target;

    if (name === "toEmailID") {
      setEmailSend((prev) => ({
        ...prev,
        [name]: value,
      }));
      validateEmail(value);
    } else {
      setEmailSend((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const handleClickSentEmail = async () => {
    try {
      const res = await sendEmail({
        toEmailID: emailSend.toEmailID,
        emailSubject: emailSend.emailSubject,
        emailBody: emailSend.emailBody,
        patientID: patientDetail?.currentPatient?.PatientID,
        templateID: 0,
        transactionID: patientDetail?.currentPatient?.TransactionID,
        attachementPath: "",
      });

      if (res.success) {
        notify(res.message, "success");
        setEmailSend((prev) => ({
          ...prev,
          emailBody: "",
          emailSubject: "",
          toEmailID: "",
        }));
      }
    } catch (error) {}
  };

  // EDP Master Doctor ====================================================

  const [settingModal, setSettingModal] = useState({
    component: "",
    size: "95vw",
    header: "",
    isShow: false,
  });

  const handleClickSettingPage = (item) => {
    setSettingModal({
      component: item.component,
      size: item?.id === 1 ? "30vw" : "",
      header: item.name,
      isShow: true,
    });
  };

  const getLoadPrescriptionData = async () => {
    try {
      const response = await GetPrescription({
        patientID: patientDetail?.currentPatient?.PatientID,
        transactionID: patientDetail?.currentPatient?.TransactionID,
        appID: patientDetail?.currentPatient?.App_ID,
        Type: type === "Emergency" ? "emg" : "opd",
      });
      if (response?.data) {
        setLoadSaveData(response.data);
      }
      if (patientDetail?.currentPatient?.App_ID) {
        await UpdateCall({
          app_ID: patientDetail?.currentPatient?.App_ID,
          doctorID:
            patientDetail?.currentPatient?.DoctorID || docID || getDoctorID,
        });
      }
    } catch (error) {}
  };

  const {
    GetDepartmentList,
    GetBindAllDoctorConfirmationData,
    GetBindReferDoctorList,
  } = useSelector((state) => state.CommonSlice);

  /* The follow-up booking's doctor list - the same source the referral field
     uses, so the doctor picks from a list they already know. Already loaded for
     this screen, so the modal costs no extra request. */
  const followUpDoctorOptions = useMemo(
    () => reactSelectOptionList(GetBindReferDoctorList, "NAME", "DoctorID") || [],
    [GetBindReferDoctorList],
  );
  /* The follow-up defaults to the doctor holding the consultation. */
  const followUpDoctorID =
    patientDetail?.currentPatient?.DoctorID || docID || currentDoctorID || "";

  useEffect(() => {
    if (loadSaveData) {
      let referDept = reactSelectOptionList(
        GetDepartmentList,
        "Name",
        "ID",
      ).find((val) => val?.label && loadSaveData?.referDept && val.label.startsWith(loadSaveData.referDept)) || reactSelectOptionList(
        GetDepartmentList,
        "Dept_Name",
        "Dept_ID",
      ).find((val) => val?.label && loadSaveData?.referDept && val.label.startsWith(loadSaveData.referDept));
      
      /* Referrals are saved as an id now (In-House -> doctor_master, Out-Side ->
         doctor_referal), so resolve by id first. Rows written before that change
         hold the doctor's name, truncated to the column width, which is why the
         fallback is startsWith and not an equality test. */
      const inHouseOptions = reactSelectOptionList(
        GetBindAllDoctorConfirmationData,
        "Name",
        "DoctorID",
      );
      const outsideOptions = reactSelectOptionList(
        GetBindReferDoctorList,
        "NAME",
        "DoctorID",
      );
      const savedRefer = loadSaveData?.refferdoctor;
      const byId = (list) =>
        savedRefer === undefined || savedRefer === null || String(savedRefer).trim() === ""
          ? undefined
          : list.find((val) => String(val?.value) === String(savedRefer).trim());
      const byName = (list) =>
        list.find(
          (val) => val?.label && savedRefer && val.label.startsWith(savedRefer),
        );
      /* Out-Side referrals resolve against the referral master, In-House against
         the hospital's own doctors - a numeric id means different people in the
         two lists, so the type decides which list is searched first. */
      const preferred =
        loadSaveData?.doctorType === "Out-Side"
          ? [outsideOptions, inHouseOptions]
          : [inHouseOptions, outsideOptions];
      let refferdoctor =
        byId(preferred[0]) ||
        byId(preferred[1]) ||
        byName(preferred[0]) ||
        byName(preferred[1]);
      setPrisciptionForm({
        Allergies: loadSaveData?.allergies ? loadSaveData?.allergies : "",
        NextVisit: loadSaveData?.nextVisit,
        NextVisitRemarks: loadSaveData?.nextVisitRemarks
          ? loadSaveData?.nextVisitRemarks
          : "",
        ConfidentialData: loadSaveData?.confidentialData
          ? loadSaveData?.confidentialData
          : "",
        // SystematicExamination: {
        CNS: loadSaveData?.cns,
        ENT: loadSaveData.ent,
        RS: loadSaveData.rs,
        PA: loadSaveData.pa,
        General: loadSaveData.general,
        CVS: loadSaveData.cvs,
        // },
        // TransferReferralForConsultation: {
        DoctorType: loadSaveData?.doctorType,
        // department: loadSaveData.referDept,
        department: referDept,
        // referTo: loadSaveData.refferdoctor,
        referTo: refferdoctor,
        referralType: loadSaveData.referaltype,
        consultType: loadSaveData.consultationType,
        ImpressionDiagnosis: loadSaveData.referral,
        Remarks: loadSaveData.referralRemarks
          ? loadSaveData.referralRemarks
          : "",
        RiskFactor: loadSaveData.riskFactors ? loadSaveData.riskFactors : "",
        AnyAncHospitalisations: loadSaveData.anyAncHospitalisations
          ? loadSaveData.anyAncHospitalisations
          : "",
        NST: loadSaveData.nst ? loadSaveData.nst : "",
        PelvicAssessment: loadSaveData.pelvicAssesment
          ? loadSaveData.pelvicAssesment
          : "",
        ParturitionDetailsAndOutCome: loadSaveData.parturitionDetails
          ? loadSaveData.parturitionDetails
          : "",
        pallor: loadSaveData.pallor ? loadSaveData.pallor : "",
        odema: loadSaveData.odema ? loadSaveData.odema : "",
        uterus: loadSaveData.uterus ? loadSaveData.uterus : "",
        varicoseVeins: loadSaveData.varicoseVeins
          ? loadSaveData.varicoseVeins
          : "",
        nodes: loadSaveData.nodes ? loadSaveData.nodes : "",
        breasts: loadSaveData.breasts ? loadSaveData.breasts : "",
        respiratory: loadSaveData.respiratory ? loadSaveData.respiratory : "",
        anyAdventitiousSounds: loadSaveData.anyAdventitiousSounds
          ? loadSaveData.anyAdventitiousSounds
          : "",
        // knownOfs: loadSaveData.knownOfs ? loadSaveData.knownOfs : "",
        // keyNote: loadSaveData.keyNote ? loadSaveData.keyNote : "",
        // previousDoctor: loadSaveData.previousDoctor ? loadSaveData.previousDoctor : "",
        paExaminantion: loadSaveData?.paExaminantion?.value
          ? loadSaveData?.paExaminantion?.value
          : "",
        pvExaminantion: loadSaveData?.pvExaminantion?.value
          ? loadSaveData?.pvExaminantion?.value
          : "",
        historyOfCovid: loadSaveData?.historyOfCovid,
        historyOfPresentIllness: loadSaveData?.historyOfPresentIllness,
        surgicalHistory: loadSaveData?.surgicalHistory,
        FamilyHistoryRemark: loadSaveData?.familyHistoryRemarks,
        imunigrationHistory: loadSaveData?.imunigrationHistory,
        precaution: loadSaveData?.precaution,
        admissionRequired: loadSaveData?.admissionRequired === 1 ? true : false,
        AdmissionDate: loadSaveData?.admissionDate,
        NutritionAdviseRemarks: loadSaveData?.nutritionAdviseRemarks,
        NutritionAdvise: loadSaveData?.nutritionAdvise,
        doctorRemarks: loadSaveData?.doctorRemarks,
        doctorAdditionalAdvice: loadSaveData?.doctorAdditionalAdvice,
      });
      const {
        keyNote = [],
        knownOfs = [],
        previousDoctor = [],
      } = loadSaveData || {};

      setTags((prevTags) => ({
        ...prevTags,
        "Key Note": keyNote.map((item) => ({ ValueField: item.valueField })),
        "Known OFF": knownOfs.map((item) => ({ ValueField: item.valueField })),
        "Previous Doctor": previousDoctor.map((item) => ({
          ValueField: item.valueField,
        })),
      }));

      updateAutocompleteField(
        "Chief Complaint",
        loadSaveData?.chiefComplaint?.value,
      );
      updateAutocompleteField(
        // "Sign & Symptoms",
        "Past History",
        loadSaveData?.progressionComplaint?.value,
      );
      updateAutocompleteField(
        "Sign & Symptoms",
        // "Past History",
        loadSaveData?.clinicalExamination?.value,
      );
      updateAutocompleteField(
        "Treatment History",
        loadSaveData?.medications?.value,
      );
      updateAutocompleteField(
        "Vaccination Status",
        loadSaveData?.vaccinationStatus?.value,
      );
      updateAutocompleteField("Doctor Notes", loadSaveData?.doctorNotes?.value);
      updateAutocompleteField(
        "Provisional Diagnosis",
        loadSaveData?.provisionalDiagnosis?.value,
      );
      updateAutocompleteField(
        "Doctor Advice",
        loadSaveData?.doctorAdvice?.value,
      );
      updateAutocompleteField(
        "Personal/Occupational History",
        loadSaveData?.personalHistory?.value,
      );
      updateAutocompleteField(
        "General Examination",
        loadSaveData?.generalExamination?.value,
      );
      updateAutocompleteField("Diet", loadSaveData?.diet?.value);

      updateCompleteFillInvestionProceder(
        "Investigation(Lab & Radio)",
        loadSaveData?.investigations?.map((ele) => ele),
      );
      updateCompleteFillInvestionProceder(
        "Prescribed Procedure",
        loadSaveData?.procedures?.map((ele) => ele),
      );
      updateAutocompleteField("Prescribed Medicine", loadSaveData.medicines);
    }
  }, [loadSaveData, reloadDoctor]);

  const updateAutocompleteField = (fieldName, data) => {
    if (fieldName === "Prescribed Medicine") {
      // debugger;
      const transformedMedicineData = data?.map((item) => {
        // Ensure default values are used if fields are undefined or empty
        const values = {
          Name:
            {
              value: item?.medicineName,
              ID: item?.medicine_ID,
              Generic: item?.generic,
              Typename: item?.medicineName,
            } || "",
          Dose: item.dose || "",
          Time: item.noTimesDay || "",
          Duration: item.noOfDays || "",
          Meal: item.meal || "",
          Route: item.route || "",
          Remarks: item.remarks || "",
          Quantity: item.quantity || "",
          AllItemListData: item, // Store the full item data
        };

        // Return values object
        return values;
      });
      const blankRow = {
        Name: {},
        Dose: {},
        Time: {},
        Duration: {},
        Meal: {},
        Route: {},
        Remarks: {},
        Quantity: {},
        AllItemListData: {},
      };
      const finalMedicineData =
        transformedMedicineData?.length > 0
          ? [...transformedMedicineData, blankRow]
          : [blankRow];
      setTags((prevTags) => ({
        ...prevTags,
        [fieldName]: finalMedicineData, // Update the specific field
      }));
    } else {
      const transformedData = data
        ?.filter((val) => val !== "" || null)
        .map((text) => ({
          ValueField: text,
          ID: null,
        }));

      setTags((prevTags) => ({
        ...prevTags,
        [fieldName]: transformedData || [], // Dynamically update the specific field
      }));
    }
  };

  const updateCompleteFillInvestionProceder = (fieldName, data) => {
    const transformedData = data
      ?.filter((val) => val !== null)
      ?.map((text) => ({
        ValueField: text.name,
        ID: text.test_ID,
        isDefaultTemplate: text?.outsource == 1 ? true : false,
        remarks: text?.remarks,
        // The urgent mark survives a reload, so reopening a saved prescription
        // shows what was flagged rather than quietly clearing it on the next save.
        isUrgent:
          String(text?.isUrgent ?? text?.IsUrgent ?? "0") === "1" ||
          text?.isUrgent === true,
      }));

    setTags((prevTags) => ({
      ...prevTags,
      [fieldName]: transformedData || [],
    }));
  };

  const getGetOldAppointentData = async () => {
    try {
      const res = await GetOldAppointentData({
        patientID: patientDetail?.currentPatient?.PatientID,
        transactionID: patientDetail?.currentPatient?.TransactionID,
        appID: patientDetail?.currentPatient?.App_ID,
        Type: type === "Emergency" ? "emg" : "opd",
      });
      setApiData((prev) => ({ ...prev, getOldAppointentDataAPI: res.data }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleSpouseAppointments = async (pid) => {
    try {
      const targetPid = pid ? pid : patientDetail?.currentPatient?.PatientID;
      if (!targetPid) return;
      const res = await GetBindSpouseAppointments(targetPid);
      setApiData((prev) => ({
        ...prev,
        getOldSpouseAppointentDataAPI: res.data,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getGetOldAppointentData();
    handleSpouseAppointments();
    getLoadPrescriptionData();
  }, [reloadDoctor]);

  const [splitData, setSplitData] = useState({});
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    if (splitData?.PatientID && splitData?.TransactionID && splitData?.App_ID) {
      handleAPICall();
    }
  }, [splitData]);

  const splitFunctionConvertObject = (itemSplit) => {
    const key = itemSplit.valueFieldDesc.split("#");
    const value = itemSplit.valueField.split("#");
    const res = {};
    key.forEach((e, i) => {
      res[e] = value[i];
    });
    setSplitData(res);
  };

  const handleAPICall = async () => {
    try {
      const response = await GetPrescription({
        patientID: splitData?.PatientID,
        transactionID: splitData?.TransactionID,
        appID: splitData?.App_ID,
        Type: type === "Emergency" ? "emg" : "opd",
      });
      if (response?.data) {
        setLoadSaveData(response.data);
      }
      if (splitData?.App_ID) {
        await UpdateCall({
          app_ID: splitData?.App_ID,
          doctorID: splitData?.DoctorID || docID || getDoctorID,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGetDataForOLDAppointment = (item) => {
    setCurrentItem(item);
    splitFunctionConvertObject(item);
  };
  //upDATED FUNCTION BY Aakash
  const handleFullScreen = () => {
    // Zoom / full screen. The app header (#main-header) and the sticky patient bar are
    // looked up defensively: when either is not in the DOM (a layout without the header,
    // or the header already removed) the toggle still runs instead of crashing the page.
    const header = document.getElementById("main-header");
    const topPosition = document.querySelector(".sticky-desktop");
    const headerHidden = header ? header.style.display === "none" : false;

    if (header) header.style.display = headerHidden ? "block" : "none";
    if (topPosition) topPosition.style.top = headerHidden ? "100px" : "0px";
    toggleFullScreen();
  };

  const [visible, setVisible] = useState(false);
  const [seeMore, setSeeMore] = useState([]);
  const [renderComponent, setRenderComponent] = useState({
    name: "",
    component: null,
  });
  const ModalComponent = (name, component) => {
    setVisible(true);
    setRenderComponent({
      name: name,
      component: component,
    });
  };
  const handleChangeComponent = (e) => {
    ModalComponent(e?.label, e?.component);
  };

  // voice to text
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const activeInputRef = useRef(null);

  const startRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert(t("Speech recognition is not supported by your browser."));
      return;
    }

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      const activeInput = activeInputRef.current;

      if (activeInput) {
        setInputValue((prevValues) => ({
          ...prevValues,
          [activeInput]: prevValues[activeInput] + transcript,
        }));
        if (handleActiveInputVoiceToText(activeInput)) {
          setPrisciptionForm((prevForm) => {
            const keys = activeInput.split(".");
            if (keys.length === 1) {
              return {
                ...prevForm,
                [activeInput]: prevForm[activeInput] + transcript,
              };
            } else {
              return {
                ...prevForm,
                [keys[0]]: {
                  ...prevForm[keys[0]],
                  [keys[1]]: prevForm[activeInput] + transcript,
                },
              };
            }
          });
        }
      }
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        startRecognition(); // Restart if user still wants to listen
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current.start(); // Start recognition
  };

  // Stop Speech Recognition
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
    setIsListening(!isListening); // Toggle the listening state
  };

  const autoCompleteRefs = useRef({});
  const [focusedType, setFocusedType] = useState(null);

  const handleTagUpdate = (category, index, newValue) => {
    // debugger
    setTags((prevTags) => ({
      ...prevTags,
      [category]: prevTags[category].map((tag, i) => {
        if (i === index) {
          // If newValue is an object (selected from dropdown), update the whole tag
          if (typeof newValue === "object" && newValue !== null) {
            return {
              ...newValue,
              ValueField:
                newValue.ValueField ||
                newValue.TemplateName ||
                newValue.TypeName,
            };
          }
          // If it's just a string (typed manually), only update the text
          return { ...tag, ValueField: newValue };
        }
        return tag;
      }),
    }));
  };

  const handleInputFocus = (e, type) => {
    activeInputRef.current = type;

    search({ query: "" }, type);
  };

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, []);

  useEffect(() => {
    if (getBindVitalData && getBindVitalData.length > 0) {
      const v = getBindVitalData[0];

      setVitalSign({
        wt: v.WT || "",
        t: v.T || "",
        p: v.P || "",
        bp: v.BP || "",
        respiratory: v.Repiratory || v.Rr || "",
        spO2: v.SPO2 || "",
        ht: v.HT || "",
        allergy: v.Allergy || "",
        ID: v.ID || "",
      });
      vitalsDirtyRef.current = false;
      setVitalsStatus({ state: "idle", at: "", message: "" });
    }
  }, [getBindVitalData]);

  const [isInputFocus, setIsInputFocus] = useState(false);

  const handleDecimalInputChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value);

    const regex = /^\d*\.?\d{0,2}$/;
    // console.log(first)
    if (regex.test(value) || value === "") {
      console.log("call");

      vitalsDirtyRef.current = true;
      setVitalSign((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    vitalsDirtyRef.current = true;
    setVitalSign((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* Vitals save. The strip used to be display-only: the values came from the triage
     (cpoe_vital by visit) and the doctor's edits went nowhere - the prescription save
     carried them under a key the API never read. Now every edit is saved when the field
     loses focus (and again when the prescription is saved) through
     VitalSign/SaveDoctorVitals, which touches only these eight values on the visit's
     vitals row, or creates the row when triage never made one. */
  const vitalSignRef = useRef(vitalSign);
  useEffect(() => {
    vitalSignRef.current = vitalSign;
  }, [vitalSign]);
  const vitalsDirtyRef = useRef(false);
  const vitalsTimerRef = useRef(null);
  const [vitalsStatus, setVitalsStatus] = useState({ state: "idle", at: "", message: "" });
  const saveVitals = async (force = false) => {
    const cur = patientDetail?.currentPatient;
    if (!cur?.PatientID || !cur?.TransactionID) return;
    if (!force && !vitalsDirtyRef.current) return;
    const v = vitalSignRef.current || {};
    const hasAny = ["wt", "t", "p", "bp", "respiratory", "spO2", "ht", "allergy"].some(
      (k) => String(v[k] ?? "").trim() !== "",
    );
    if (!hasAny && !v.ID) return; // nothing typed and no row to update
    clearTimeout(vitalsTimerRef.current);
    setVitalsStatus({ state: "saving", at: "", message: "" });
    const result = await SaveDoctorVitals({
      id: v.ID,
      tid: cur.TransactionID,
      pid: cur.PatientID,
      appID: cur.App_ID,
      bp: v.bp,
      p: v.p,
      r: v.respiratory,
      t: v.t,
      ht: v.ht,
      wt: v.wt,
      spO2: v.spO2,
      allergy: v.allergy,
    });
    if (result.ok) {
      vitalsDirtyRef.current = false;
      if (result.id && !v.ID) setVitalSign((prev) => ({ ...prev, ID: result.id }));
      setVitalsStatus({
        state: "saved",
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        message: "",
      });
      notify(t("Vitals saved"), "success"); // the application standard toast
    } else {
      setVitalsStatus({ state: "error", at: "", message: result.message });
      notify(result.message, "error");
    }
  };
  const scheduleVitalsSave = () => {
    clearTimeout(vitalsTimerRef.current);
    vitalsTimerRef.current = setTimeout(() => saveVitals(false), 400);
  };
  const vitalsBmi = (() => {
    const h = parseFloat(vitalSign?.ht);
    const w = parseFloat(vitalSign?.wt);
    if (!(h > 0) || !(w > 0)) return "";
    return (w / ((h / 100) * (h / 100))).toFixed(1);
  })();

  const isMobile = window.innerWidth > 100;
  const [isDesktop, setIsDesktop] = useState(false);

  //Doctor Get TopSuggestion Akhilesh

  // get doctor ID

  const getCurerntDoctorID = async () => {
    try {
      const response = await CommonAPIGetDoctorIDByEmployeeID();
      setCurrentDoctorID(response?.data[0]?.doctorID);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const DoctorGetPrescriptionPreview = async () => {
    try {
      const response = await DoctorGetPrescriptionview();
      let data = Number(response?.data?.[0]) === 1 ? true : false;
      setIsDesktop(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const DoctorUpdatePrescriptionPreview = async (payload) => {
    try {
      const response = await DoctorUpdatePrescriptionview(payload);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    DoctorGetPrescriptionPreview();
  }, []);

  const handleDoctorTopSuggestions = async (payload) => {
    try {
      // debugger
      const response = await DoctorPrescriptionGetTopSuggestion(payload);
      // debugger

      if (response.success) {
        setDoctorTopSuggestions(response.data);
        transformToArrayFormat(response?.data || []);
      } else {
        console.error(
          "API returned success as false or invalid response:",
          response,
        );
        // notify(response?.message, "error");
        setDoctorTopSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      // notify(apiResp?.message, "error");
      setDoctorTopSuggestions([]);
    }
  };

  const transformToArrayFormat = (data) => {
    return data.map((item) => {
      const transformedItem = {};

      Object.keys(item).forEach((key) => {
        const value = item[key];
        let arrayValue = [];

        if (Array.isArray(value)) {
          arrayValue = value;
        } else if (value && typeof value === "object" && "value" in value) {
          arrayValue = Array.isArray(value.value) ? value.value : [value.value];
        } else if (typeof value === "string") {
          arrayValue = value.includes("~")
            ? value
                .split("~")
                .map((v) => v.trim())
                .filter(Boolean)
            : [value];
        } else if (value === null || value === undefined) {
          arrayValue = [];
        } else {
          arrayValue = [String(value)];
        }

        transformedItem[key] = [...new Set(arrayValue)];
      });

      setTextAreaSuggestions(transformedItem);
    });
  };

  useEffect(() => {
    const { Age, Sex } = patientDetail?.currentPatient;
    let payload = {
      age: "",
      sex: "",
      doctorID: docID || currentDoctorID || getDoctorID,
    };

    getCurerntDoctorID();
    handleDoctorTopSuggestions(payload);
  }, [isDeleteTemplate]);

  const transformSuggestions = (suggestions) => {
    const groupedData = {};
    // debugger
    suggestions.forEach((suggestion) => {
      Object.entries(fieldMapping).forEach(([key, fieldKey]) => {
        const fieldValue = suggestion[fieldKey];

        if (!groupedData[key]) {
          groupedData[key] = [];
        }

        // -----------------------------
        // Case 1: null or empty
        // -----------------------------
        if (!fieldValue) return;

        // -----------------------------
        // Case 2: ARRAY (medicines, procedures, allergies, value[])
        // -----------------------------
        if (Array.isArray(fieldValue)) {
          fieldValue.forEach((value) => {
            // ARRAY INSIDE OBJECT (value.value[])
            if (value?.value && Array.isArray(value.value)) {
              value.value.forEach((item) => {
                if (item?.trim()) {
                  groupedData[key].push({
                    ValueField: item,
                    TemplateName: item,
                  });
                }
              });
              return;
            }

            // Simple object with fields
            groupedData[key].push({
              ValueField:
                value.ValueField ||
                value.name ||
                value.medicineName ||
                value.TemplateName ||
                value.generic ||
                value.test_ID ||
                "",
              TemplateName:
                value.TemplateName ||
                value.name ||
                value.medicineName ||
                value.ValueField ||
                value.generic ||
                value.test_ID ||
                "",
            });
          });

          return;
        }

        // -----------------------------
        // Case 3: Single object with value: []
        // -----------------------------
        if (fieldValue?.value && Array.isArray(fieldValue.value)) {
          fieldValue.value.forEach((item) => {
            if (item?.trim()) {
              groupedData[key].push({
                ValueField: item,
                TemplateName: item,
              });
            }
          });
          return;
        }

        // -----------------------------
        // Case 4: Single object
        // -----------------------------
        groupedData[key].push({
          ValueField:
            fieldValue.ValueField ||
            fieldValue.name ||
            fieldValue.medicineName ||
            fieldValue.TemplateName ||
            fieldValue.value ||
            "",
          TemplateName:
            fieldValue.TemplateName ||
            fieldValue.name ||
            fieldValue.medicineName ||
            fieldValue.ValueField ||
            fieldValue.value ||
            "",
        });
      });
    });

    return groupedData;
  };

  // Use useEffect to transform the data when doctorTopSuggestions changes
  useEffect(() => {
    // debugger;
    if (doctorTopSuggestions.length > 0) {
      // debugger
      const transformedData = transformSuggestions(doctorTopSuggestions);
      setTransformedSuggestions(transformedData);
    }
  }, [doctorTopSuggestions]);

  //zoom 110%

  const getClassName = (ID) => {
    if (ID === 8 || ID === 14 || ID === 22) {
      return "";
    } else if (ID === 822) {
    } else {
      return "App py-1  ";
    }
    // `${item?.ID===8||item?.ID===14?"col-6":"App py-1 mx-1 col-12"}`
  };

  const isInputDisabled = (prescriptionGender) => {
    const patientGender = patientDetail?.currentPatient?.Gender;

    // Logic:
    // - If patient is Male (M), disable Female (F) inputs.
    // - If patient is Female (F), disable Male (M) inputs.
    // - If patient is Both (B), enable all inputs.
    if (patientGender === "M" && prescriptionGender === "F") {
      return true;
    } else if (patientGender === "F" && prescriptionGender === "M") {
      return true;
    } else {
      return false;
    }
  };

  const isPregnancy =
    loadSaveData?.vitalSign === null
      ? true
      : true || loadSaveData?.vitalSign?.isPregnancy === null
        ? true
        : true || loadSaveData?.vitalSign?.isPregnancy === 0
          ? false
          : true;

  useEffect(() => {
    const container = document.querySelector(".appoinment-details-container");
    const onTop = document.querySelector(".sticky-desktop ");

    if (container && window.innerWidth >= 1024 && isZoom === "true") {
      container.style.zoom = "1.2";
      container.style.overflowX = "clip";
      container.style.width = "100%";
      onTop.style.top = "85px";
    }

    return () => {
      container.style.zoom = "1";
      container.style.overflowX = "auto";
      onTop.style.top = "unset";
    };
  }, []);

  const handleSpouseDetailsChange = async (e) => {
    const valueParts = e?.ValueField?.split("#") || [];
    const app_id = valueParts[0]?.trim();
    const tid = valueParts[1]?.trim();

    const spousePatientID =
      apiData?.getOldSpouseAppointentDataAPI?.spousePatientID;

    // Step 1: Get correct source data
    const sourceData = patientDetail?.TotaltableData?.length
      ? patientDetail.TotaltableData
      : TotaltableData || [];

    // Step 2: Find correct index
    const selectedIndex = sourceData.findIndex(
      (item) => parseInt(item?.App_ID) === parseInt(app_id),
    );

    if (selectedIndex === -1) {
      notify(t("Spouse appointment not found in the current list."), "error");
      return;
    }

    // Step 3: Get selected patient
    const selectedPatient = sourceData[selectedIndex];

    // Step 4: Mark as In
    await getUpdateInAPI(selectedPatient, selectedIndex, "spouse");

    // Step 5: Update state
    setPatientDetail((val) => ({
      ...val,
      currentPatient: selectedPatient,
      TotaltableData: sourceData,
      index: selectedIndex,
    }));

    // Step 6: Load spouse appointments
    handleSpouseAppointments(spousePatientID);

    dispatch(getBindVital(tid));

    // Clear previous form inputs before loading
    handleClearForm();

    // Prescription API
    try {
      const response = await GetPrescription({
        patientID: spousePatientID,
        transactionID: tid,
        appID: app_id,
        Type: type === "Emergency" ? "emg" : "opd",
      });

      setLoadSaveData(response?.success ? response.data : []);
      if (app_id) {
        await UpdateCall({
          app_ID: app_id,
          doctorID: selectedPatient?.DoctorID || docID || getDoctorID,
        });
      }
    } catch (error) {}

    // Old appointment API
    try {
      const res = await GetOldAppointentData({
        patientID: spousePatientID,
        transactionID: tid,
        appID: app_id,
        Type: type === "Emergency" ? "emg" : "opd",
      });

      if (res?.success) {
        setApiData((prev) => ({
          ...prev,
          getOldAppointentDataAPI: res.data,
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className="appoinment-details-container" // style={{ position: "fixed", zIndex: 9999999999, top: 0, width: "100%" }}
    >
      {runningQueue.length > 0 && (
        <Confirm
          confirmBoxvisible={{ show: true }}
          lableMessage={tSentence(t)("Medicine already running")}
          alertMessage={
            <div className="rx-running-confirm">
              <div className="rx-running-confirm__name">{runningQueue[0].name}</div>
              {describeRunningMedicine(runningQueue[0].match, t).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <div className="rx-running-confirm__ask">
                {tSentence(t)("Do you still want to prescribe this medicine again?")}
              </div>
            </div>
          }
        >
          <div className="rx-running-confirm__btns">
            <button type="button" className="modalConfirmButton" onClick={runningKeep}>
              {tSentence(t)("Yes, prescribe again")}
            </button>
            <button type="button" className="modalCancelButton" onClick={runningDrop}>
              {tSentence(t)("No, leave it")}
            </button>
          </div>
        </Confirm>
      )}
      {(medicalData?.diagnosisList?.length > 0 ||
        medicalData?.allergyList?.length > 0) && (
        <Modal
          visible={medicalData}
          setVisible={setMedicalInfoData}
          modalWidth={"60vw"}
          Header={t("Medical Information")}
          footer={<></>}
        >
          <MedicalInfoModal medicalData={medicalData} />
        </Modal>
      )}
      <div className="sticky-desktop md:py-1 wantsToSticky">
        {type !== "Emergency" && (
          <div className="card md:mt-2">
            <Heading
              title={
                <div className="d-flex">
                  <div className="mt-1 ">{t("Patient Details")} </div>
                  <DocVitalSignPatientDetailCard
                    ModalComponent={ModalComponent}
                    setSeeMore={setSeeMore}
                    data={patientDetail?.currentPatient}
                    keyName={"menuName"}
                    pageName={"AppontmentDetail"}
                    isShowPatient={false}
                  />
                </div>
              }
              isBreadcrumb={false}
              secondTitle={
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {isMobile && (
                    <>
                      <Tooltip target=".tooltip-target1" />
                      <Checkbox
                        type="checkbox"
                        name=""
                        id="DextopView"
                        checked={isDesktop}
                        onChange={(e) => {
                          let payload = e.target.checked ? 1 : 0;
                          DoctorUpdatePrescriptionPreview(payload);
                          setIsDesktop(e.target.checked);
                        }}
                        title={t("Desktop View")}
                        className="tooltip-target1  d-flex align-items-center"
                        data-pr-tooltip={translateIfKnown(t, "Prescription Preview")}
                        data-pr-position="top"
                        label={t("Hover Me")}
                      />
                      <Checkbox
                        type="checkbox"
                        checked={isDocChecked}
                        onChange={() => {
                          setIsDocChecked(!isDocChecked);
                        }}
                        className="tooltip-target d-flex align-items-center "
                        data-pr-tooltip={translateIfKnown(t, "Doctor Details")}
                        data-pr-position="top"
                        label={t("Hover Me")}
                      />
                      <Tooltip target=".tooltip-target" />
                    </>
                  )}
                  <i
                    className="fa fa-arrows-alt"
                    aria-hidden="true"
                    onClick={handleFullScreen}
                  ></i>
                  <div className="mt-1 d-flex">
                    <i
                      className="pi pi-arrow-left px-2"
                      aria-hidden="true"
                      onClick={() => setActive(true)}
                    ></i>
                  </div>

                  <div>
                    <SeeMore
                      Header={
                        <div>
                          <i
                            className="pi pi-spins pi-cog"
                            aria-hidden="true"
                          ></i>
                        </div>
                      }
                      docterError={docterError}
                    >
                      <ul
                        className="list-group"
                        style={{
                          whiteSpace: "nowrap",
                          position: "fixed",
                          right: "6px",
                        }}
                      >
                        {settingBTNListSeemote?.map((items, index) => {
                          return (
                            <li
                              className="list-group-item p-2"
                              key={index}
                              // onClick={() =>
                              //   ModalComponent(items?.name, items?.component)
                              // }
                              onClick={() => handleClickSettingPage(items)}
                              style={{
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {items.name}
                            </li>
                          );
                        })}
                      </ul>
                    </SeeMore>
                  </div>
                </div>
              }
            />

            <div className="row ">
              <div className="col-sm-12 ">
                <DoctorDetails
                  payloadData={{
                    DoctorID: patientDetail?.currentPatient?.DoctorID,
                    Date: patientDetail?.currentPatient?.AppointmentDate,
                  }}
                  isDocChecked={isDocChecked}
                  prescription={prescription}
                  tags={tags}
                  setTags={setTags}
                  items={items}
                />
              </div>
            </div>
          </div>
        )}

        <UserInfoPedia
          pregnancyDetails={pregnancyDetails}
          tags={tags}
          setTags={setTags}
          items={items}
          setPregnancyDetails={setPregnancyDetails}
          patientDetail={patientDetail}
          type={type}
          getUpdateInAPI={getUpdateInAPI}
          handleCallButtonClick={handleCallButtonClick}
          handleFileClosed={handleFileClosed}
          handleFileOpen={handleFileOpen}
          handleEmailModalOpen={handleEmailModalOpen}
          handleSMSModalOpen={handleSMSModalOpen}
          reverseTableData={reverseTableData}
          forwardTableData={forwardTableData}
          getHoldAPID={getHoldAPID}
          getOutPatientAPI={getOutPatientAPI}
          handleSavePriscciptionForm={handleSavePriscciptionForm}
          setIsPrescriptionButton={setIsPrescriptionButton}
          isPrescriptionButton={isPrescriptionButton}
          handleSavePrescriptionDraft={handleSavePrescriptionDraft}
          setIsDesktop={setIsDesktop}
          isDesktop={isDesktop}
          handleClearForm={handleClearForm}
          SearchOPDBillsCallAPI={SearchOPDBillsCallAPI}
          TotaltableData={TotaltableData}
          selectedIndex={selectedIndex}
          apiData={apiData}
          handleGetDataForOLDAppointment={handleGetDataForOLDAppointment}
          getGetDoctor={getGetDoctor}
          docterError={docterError}
          getCall={getCall}
          loadSaveData={loadSaveData}
          prescription={prescription}
          toggleListening={toggleListening}
          isListening={isListening}
          runReport={runReport}
          setRunReport={setRunReport}
          handleSpouseDetailsChange={handleSpouseDetailsChange}
          setShowAISummary={setShowAISummary}
          showAISummary={showAISummary}
          setShowNotPad={setShowNotPad}
          showNotPad={showNotPad}
          setShowFlowSheet={setShowFlowSheet}
          setShowMedicationCalendar={setShowMedicationCalendar}
          setShowNotesModal={setShowNotesModal}
          showFlowSheet={showFlowSheet}
          showMedicationCalendar={showMedicationCalendar}
          showNotesModal={showNotesModal}
        />
      </div>
      {console.log(prescription, "prescriptionprescription")}
      {/* <ScrollComponent viewPort={"0.6"}> */}
      <div className="card restcontent consultation-layout-container">
        {/* AI Sidebar */}
        {/* SRS-2026-0057 point 2. This used to be `showAISummary && isDesktop`.
            `isDesktop` is not a screen-size flag despite the name - it is the
            per-doctor "Prescription Preview" setting loaded by
            DoctorGetPrescriptionPreview. So AI Assistance only appeared when the
            print-preview pane was switched on, and did nothing at all in full
            view: the button set showAISummary but the panel never rendered.
            The sidebar layout (AISummaryPanel.css) does not depend on the
            preview mode, so the gate was simply wrong. */}
        {showAISummary && (
          <div className="ai-sidebar-container aim-side fade-in-slide">
            {/* The header (AI orb, status, vitals and allergy strip, close) is drawn by AI Assistance itself. */}
            <div className="ai-sidebar-body">
              <MedicalAssistant
                patientDetails={patientDetail.currentPatient}
                notepadTextForAI={notepadTextForAI}
                onClose={() => setShowAISummary(false)}
                clinical={
                  isAiClinicalToolsEnabled
                    ? {
                        vitals: vitalSign,
                        tags,
                        setTags,
                        form: prisciptionForm,
                        setForm: setPrisciptionForm,
                        sections: prescription,
                        loadInvestigationCatalog: loadAiInvestigationCatalog,
                        onOpenInteractionChecker: handleClickOpenDrugInteraction,
                        // the "Old Pres" list; the AI reads each visit's full prescription from it
                        oldVisits: apiData?.getOldAppointentDataAPI,
                        visitType: type === "Emergency" ? "emg" : "opd",
                      }
                    : null
                }
              />
            </div>
          </div>
        )}

        <div
          className={`consultation-main-content ${showAISummary ? "shrunk" : "full"}`}
        >
          <div className="row m-0 w-100">
            {/* Right Column: Other boxes */}
            {/* assa */}
            <>
              {/* Vital Signs - one compact strip (was a full-height card with a grid).
                  Edits save on blur and with the prescription; see saveVitals. */}
              <div className="rx-vitals">
                <div className="rx-vitals__title">
                  <i className="fas fa-heartbeat mr-1" aria-hidden="true"></i>
                  {t("Vital Signs")}
                </div>
                {[
                  ["wt", "Weight", "Kg", handleDecimalInputChange, ""],
                  ["t", "Temp", "°F", handleDecimalInputChange, ""],
                  ["p", "Pulse", "/min", handleDecimalInputChange, ""],
                  ["respiratory", "Resp", "/min", handleDecimalInputChange, ""],
                  ["spO2", "SpO₂", "%", handleDecimalInputChange, ""],
                  ["ht", "Height", "cm", handleDecimalInputChange, ""],
                  ["bp", "BP", "mm/Hg", handleInputChange, " rx-vitals__item--bp"],
                  ["allergy", "Allergy", "", handleInputChange, " rx-vitals__item--wide"],
                ].map(([name, label, unit, onChange, extra]) => (
                  <Input
                    key={name}
                    type="text"
                    className="form-control"
                    id={name}
                    lable={t(label)}
                    placeholder=" "
                    required={true}
                    respclass={`rx-vitals__item${extra}`}
                    name={name}
                    value={vitalSign?.[name]}
                    onChange={onChange}
                    onBlur={scheduleVitalsSave}
                    placeholderLabel={unit || undefined}
                  />
                ))}
                {vitalsBmi && (
                  <span className="rx-vitals__bmi" title={t("Body mass index from height and weight")}>
                    {t("BMI")} <b>{vitalsBmi}</b>
                  </span>
                )}
                <button
                  type="button"
                  className="rx-vitals__save"
                  title={t("Save vitals")}
                  onClick={() => saveVitals(true)}
                >
                  <i className="fas fa-save" aria-hidden="true"></i>
                </button>
              </div>
            </>
            <div
              className={`${isDesktop ? "col-md-4 preview-doctor-print-test" : "col-md-12"}`}
              id="second-compo"
            >
              {prescription.map((item, index) => {
                // IDs to exclude from rendering in the second-compo block
                const excludedIds = [
                  1, 22, 20, 15, 23, 26, 27, 28, 29, 30, 8, 36, 37, 38, 39,
                  40, 41, 42, 14, 34, 35, 25, 24, 43, 44, 52,
                ];

                // Render top 3 items (ID === 1, 24, 25) in the first-compo-top block

                {
                  /* ------------------------------------------------------------------------------------- */
                }

                if (!isDesktop && [1, 24, 25].includes(item.ID)) {
                  if (item.ID === 1) {
                    return (
                      <div className="px-2" key={`item-1-${index}`}>
                        <div className="">
                          <div className="App py-1 mx-1">
                            <div className="tag-input-container">
                              {/* for med */}
                              <label
                                className={`${isDesktop ? "col-sm-4 background-theme-color theme-color" : "col-sm-2 background-theme-color theme-color p-2"}`}
                              >
                                {t(item?.DisplayName)}
                              </label>
                              <div className="px-1 d-flex">
                                <div className="px-1">
                                  <Favorite
                                    data={items[item?.AccordianName]}
                                    name={item?.AccordianName}
                                    handleChange={handleFavoriteSelectChange}
                                    refresh={setIsDeleteTemplate}
                                  />
                                </div>
                                <div
                                  className="px-1"
                                  onClick={() =>
                                    handlePackageDetails(item, "90vw")
                                  }
                                >
                                  <i className="pi pi-pen-to-square"></i>
                                </div>
                              </div>

                              <div className="col-12">
                                <PrescribedMedicineTable
                                  isDesktop={false}
                                  isShowFirst={true}
                                  tags={tags}
                                  setTags={setTags}
                                  type={"FromPage"}
                                  presTable={presTable}
                                  setPresTable={setPresTable}
                                  apiData={doctorTopSuggestions}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (item.ID === 24) {
                    return (
                      <div className="row" key={`item-24-${index}`}>
                        <div className="col-sm-12">
                          <div className="App py-1 mx-1">
                            <div
                              className="tag-input-container"
                              style={{
                                position: "static",
                                maxHeight: "200px",
                                overflow: "scroll",
                              }}
                            >
                              <div className="col-12">
                                <PreviousPregnancyTable
                                  loadSaveData={loadSaveData}
                                  setPreviousPregnancyData={
                                    setPreviousPregnancyData
                                  }
                                  patientDetail={patientDetail}
                                  disabled={isInputDisabled(item.Gender)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (item.ID === 25) {
                    return (
                      <div className="row" key={`item-25-${index}`}>
                        <div className="col-12">
                          <div className="App py-1 mx-1">
                            <div
                              className="tag-input-container"
                              style={{
                                position: "static",
                                maxHeight: "200px",
                                overflow: "scroll",
                              }}
                            >
                              <div className="px-1 d-flex col-12">
                                <div className="col-12">
                                  <FamilyHistoryTable
                                    loadSaveData={loadSaveData}
                                    setFamilyHistoryData={setFamilyHistoryData}
                                    patientDetail={patientDetail}
                                    disabled={isInputDisabled(item.Gender)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }

                {
                  /* ---------------------------------------------------------------------------------------------- */
                }

                // Render items that are not excluded
                {
                  if (!excludedIds.includes(item.ID)) {
                    return (
                      <div className="">
                        <div
                          className={`tag-input-container ${item?.AccordianName === "Investigation(Lab & Radio)" ? "investigation-section" : ""}`}
                          // style={{ position: "relative" }}
                          key={index}
                        >
                          {/* fro all */}
                          <label
                            className={`${isDesktop ? "col-sm-4 background-theme-color theme-color" : "col-sm-2 background-theme-color theme-color p-2"}`}
                          >
                            {translateIfKnown(t, item?.DisplayName)}
                          </label>

                          {![
                            20, 22, 8, 36, 37, 38, 39, 40, 41, 42, 23, 26, 27,
                            28, 29, 30, 15, 14, 34, 35, 31, 32, 33, 44, 45, 46,
                            47, 48, 43, 52,
                          ].includes(item.ID) && (
                            <div className="px-1 d-flex">
                              <Favorite
                                data={items[item?.AccordianName]}
                                name={item?.AccordianName}
                                handleChange={handleFavoriteSelectChange}
                                refresh={setIsDeleteTemplate}
                                handleGetInvestigationTemplate={
                                  handleGetInvestigationTemplate
                                }
                                Id={item?.ID}
                                favTempData={favTempData}
                                patientDetails={handlePackageDetails}
                                labCategoryIds={labCategoryIds}
                              />

                              {![
                                1, 8, 36, 37, 38, 39, 40, 41, 42, 9, 24, 25, 14,
                                15, 17, 20, 23, 26, 27, 28, 29, 30, 31, 32, 33,
                                34, 35, 44, 45, 46, 47, 48, 43, 52,
                              ].includes(item.ID) && (
                                <div
                                  className="px-1"
                                  onClick={() =>
                                    handlePackageDetails(item, "50vw")
                                  }
                                >
                                  <i className="pi pi-pen-to-square"></i>
                                </div>
                              )}
                              {isAiSuggestEnabled &&
                                item?.AccordianName === "Provisional Diagnosis" && (
                                  <div className="px-1">
                                    <button
                                      type="button"
                                      className="btn btn-sm text-white aps-btn"
                                      onClick={openAiSuggest}
                                      title={t("Treatment Plan")}
                                    >
                                      <i className="fas fa-wand-magic-sparkles" aria-hidden="true" />
                                      {t("Treatment Plan")}
                                    </button>
                                  </div>
                                )}
                            </div>
                          )}

                          {handleCheckDateAndAutocomplete(item, tags)}
                        </div>
                      </div>
                    );
                  }
                }

                // Render desktop-specific items
                if (
                  isDesktop &&
                  [
                    20, 15, 22, 8, 36, 37, 38, 39, 41, 42, 23, 26, 27, 28, 29,
                    30, 40, 14, 34, 35, 43, 44, 45, 46, 47, 48, 52,
                  ].includes(item.ID)
                ) {
                  return (
                    <div
                      key={index}
                      className="tag-input-container"
                      style={{ position: "relative", display: "block" }}
                    >
                      <p className="col-sm-12 background-theme-color theme-color font-weight-bold">
                        {item?.DisplayName === "Imunigration History"
                          ? t("Immunization History")
                          : translateIfKnown(t, item?.DisplayName)}
                      </p>

                      {![
                        20, 22, 8, 36, 37, 38, 39, 41, 42, 23, 26, 27, 28, 29,
                        30, 40, 15, 14, 34, 35, 43, 44, 45, 46, 47, 48, 52,
                      ].includes(item.ID) && (
                        <div className="px-1 d-flex">
                          <Favorite
                            data={items[item?.AccordianName]}
                            name={item?.AccordianName}
                            handleChange={handleFavoriteSelectChange}
                          />

                          <div
                            className="px-1"
                            onClick={() => handlePackageDetails(item, "50vw")}
                          >
                            <i className="pi pi-pen-to-square"></i>
                          </div>
                        </div>
                      )}

                      {tags[item?.AccordianName]?.map((tag, index) => (
                        <div
                          key={index}
                          className="tag"
                          style={{
                            backgroundColor: tag?.ID ? "#FEFAE0" : "#F5EDED",
                          }}
                        >
                          {tag?.ValueField || tag?.TypeName}
                          <span
                            className="tag-close-icon"
                            onClick={() =>
                              removeTag(item?.AccordianName, index, tag?.ID)
                            }
                          >
                            <i
                              className="fa fa-times-circle"
                              aria-hidden="true"
                            ></i>
                          </span>
                        </div>
                      ))}

                      {handleCheckDateAndAutocomplete(item, tags)}
                    </div>
                  );
                }

                // Render non-desktop-specific items
                if (
                  !isDesktop &&
                  [
                    20, 15, 22, 8, 36, 37, 38, 39, 41, 40, 42, 34, 35, 23, 26,
                    27, 28, 29, 30, 31, 32, 33, 14, 43, 52,
                  ].includes(item.ID)
                ) {
                  if (!isPregnancy && (item.ID === 34 || item.ID === 35)) {
                    return null; // Skip rendering for these items when isPregnancy is false
                  }
                  return (
                    <div key={index} className={getClassName(item?.ID)}>
                      <div
                        className="tag-input-container "
                        style={{ position: "relative", display: "block" }}
                      >
                        <p className="col-sm-12 background-theme-color theme-color font-weight-bold">
                          {translateIfKnown(t, item?.DisplayName)}
                        </p>

                        {Number(item?.ID) !== 20 &&
                          Number(item?.ID) !== 22 &&
                          Number(item?.ID) !== 23 &&
                          Number(item?.ID) !== 26 &&
                          Number(item?.ID) !== 27 &&
                          Number(item?.ID) !== 28 &&
                          Number(item?.ID) !== 29 &&
                          Number(item?.ID) !== 30 &&
                          Number(item?.ID) !== 8 &&
                          Number(item?.ID) !== 34 &&
                          Number(item?.ID) !== 35 &&
                          Number(item?.ID) !== 36 &&
                          Number(item?.ID) !== 37 &&
                          Number(item?.ID) !== 38 &&
                          Number(item?.ID) !== 52 &&
                          Number(item?.ID) !== 39 &&
                          Number(item?.ID) !== 40 &&
                          Number(item?.ID) !== 41 &&
                          Number(item?.ID) !== 42 &&
                          Number(item?.ID) !== 43 &&
                          Number(item?.ID) !== 15 &&
                          Number(item?.ID) !== 14 && (
                            <div className="px-1 d-flex">
                              <Favorite
                                data={items[item?.AccordianName]}
                                name={item?.AccordianName}
                                handleChange={handleFavoriteSelectChange}
                              />
                              <div
                                className="px-1"
                                onClick={() =>
                                  handlePackageDetails(item, "50vw")
                                }
                              >
                                <i className="pi pi-pen-to-square"></i>
                              </div>
                            </div>
                          )}
                        {tags[item?.AccordianName]?.map((tag, index) => (
                          <div
                            key={index}
                            className="tag"
                            style={{
                              backgroundColor: tag?.ID ? "#FEFAE0" : "#F5EDED",
                            }}
                          >
                            {tag?.ValueField || tag?.TypeName}
                            <span
                              className="tag-close-icon"
                              onClick={() =>
                                removeTag(item?.AccordianName, index, tag?.ID)
                              }
                            >
                              <i
                                className="fa fa-times-circle"
                                aria-hidden="true"
                              ></i>
                            </span>
                          </div>
                        ))}

                        {handleCheckDateAndAutocomplete(item, tags)}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {isDesktop && (
              <div
                className="col-md-8 col-12 preview-doctor-print-test"
                id="mynk-component"
              >
                <div className="border">
                  <div className="border-bottom border-top p-3">
                    <div className="row">
                      <div className="col-3">
                        <strong>{t("UHID :")}</strong> {patientAllDetail?.PatientID}
                      </div>
                      <div className="col-3">
                        <strong>{t("Patient Name :")}</strong>{" "}
                        {patientAllDetail?.PName}
                      </div>
                      <div className="col-3">
                        <strong>{t("Age/Sex :")}</strong> {patientAllDetail?.Age} /{" "}
                        {patientAllDetail?.Gender}
                      </div>
                      <div className="col-3">
                        <strong>{t("Ph No :")}</strong> {patientAllDetail?.Mobile}
                      </div>
                      <div className="col-3">
                        <strong>{t("Address :")}</strong> {patientAllDetail?.City} ,{" "}
                        {patientAllDetail?.Country}
                      </div>
                      <div className="col-3">
                        <strong>{t("Panel :")}</strong>{" "}
                        {patientDetail?.currentPatient?.PanelName}
                      </div>
                      <div className="col-3">
                        <strong>{t("Bill No :")}</strong> {vh("BillNo")}
                      </div>
                      <div className="col-3">
                        <strong>{t("Doctor :")}</strong>
                        {patientDetail?.currentPatient?.DName}
                      </div>
                      <div className="col-3">
                        <strong>{t("Department :")}</strong> {vh("Department")}
                      </div>
                      <div className="col-3">
                        <strong>{t("Visit Date :")}</strong>{" "}
                        {patientDetail?.currentPatient?.AppointmentDate}
                      </div>
                      {/* OPD card details of this visit - only the ones that have a value */}
                      {(vh("IssueDate") || vh("IssueTime")) && (
                        <div className="col-3">
                          <strong>{t("Issue D & T :")}</strong> {vh("IssueDate")} {vh("IssueTime")}
                        </div>
                      )}
                      {vh("AppType") && (
                        <div className="col-3">
                          <strong>{t("App. Type :")}</strong> {vh("AppType")}
                        </div>
                      )}
                      {vh("DayTime") && (
                        <div className="col-3">
                          <strong>{t("Day/Time :")}</strong> {vh("DayTime")}
                        </div>
                      )}
                      {(vh("RoomNo") || vh("TokenNo")) && (
                        <div className="col-3">
                          <strong>{t("Room No/Q.No :")}</strong> {vh("RoomNo")}
                          {vh("TokenNo") ? `/${vh("TokenNo")}` : ""}
                        </div>
                      )}
                      {vh("UnitName") && (
                        <div className="col-3">
                          <strong>{t("Unit :")}</strong> {vh("UnitName")}
                        </div>
                      )}
                      {vh("BillNo") && (
                        <div className="col-3">
                          <strong>{t("Bill Amt. :")}</strong> Rs:{vh("Amount")}
                        </div>
                      )}
                      {vh("Doctors") && vh("Doctors") !== String(patientDetail?.currentPatient?.DName ?? "").trim() && (
                        <div className="col-12">
                          <strong>{t("Unit Doctors :")}</strong> {vh("Doctors")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="row">
                      <div className="col-md-12 border-right">
                        <div className="p-3 ">
                          <div className="d-none">
                            <strong>{t("Vital Signs :")}</strong>

                            <div className="row g-5 m-2 ">
                              {/* Weight */}
                              <Input
                                type="text"
                                className="form-control "
                                id="wt"
                                lable={t("Weight")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                name="wt"
                                value={vitalSign?.wt}
                                onChange={handleDecimalInputChange}
                                placeholderLabel={"Kg"}
                              />

                              {/* Temperature */}
                              <Input
                                type="text"
                                className="form-control "
                                id="t"
                                lable={t("Temp")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                name="t"
                                value={vitalSign?.t}
                                onChange={handleDecimalInputChange}
                                placeholderLabel={"Â°F"}
                              />

                              {/* Pulse */}
                              <Input
                                type="text"
                                className="form-control "
                                id="p"
                                lable={t("Pulse")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                name="p"
                                value={vitalSign?.p}
                                onChange={handleDecimalInputChange}
                                placeholderLabel={"/min"}
                              />

                              {console.log(
                                getBindVitalData,
                                "getBindVitalData",
                              )}

                              {/* Respiratory Rate */}
                              <Input
                                type="text"
                                className="form-control "
                                id="respiratory"
                                lable={t("Resp")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                name="respiratory"
                                value={vitalSign?.respiratory}
                                onChange={handleDecimalInputChange}
                                placeholderLabel={"/min"}
                              />

                              {/* SpO2 */}
                              <Input
                                type="text"
                                className="form-control "
                                id="spO2"
                                lable={t("SpOâ‚‚")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                name="spO2"
                                value={vitalSign?.spO2}
                                onChange={handleDecimalInputChange}
                                placeholderLabel={"%"}
                              />

                              {/* Height */}
                              <Input
                                type="text"
                                className="form-control "
                                id="ht"
                                lable={t("Height")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                name="ht"
                                value={vitalSign?.ht}
                                onChange={handleDecimalInputChange}
                                placeholderLabel={"cm"}
                              />
                              {/* BP */}
                              <Input
                                type="text"
                                className="form-control "
                                id="bp"
                                lable={t("BP")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                name="bp"
                                value={vitalSign?.bp}
                                onChange={handleInputChange} // 120/80 style
                                placeholderLabel={"mm/Hg"}
                              />

                              {/* Allergy */}
                              <Input
                                type="text"
                                className="form-control "
                                id="allergy"
                                lable={t("Allergy")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-3 col-md-4 col-sm-4 col-12"
                                name="allergy"
                                value={vitalSign?.allergy}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-12">
                        {prescription
                          ?.filter(
                            (val) => ![1, 24, 25, 20].includes(val.ID),
                          )
                          ?.map((item, index) => {
                            const key = item?.AccordianName;
                            const newKey = item?.DisplayName;

                            const isTransferReferralKey =
                              key === "TransferReferralForConsultation";

                            const transferReferralElements =
                              isTransferReferralKey
                                ? Object.keys(prisciptionForm).filter(
                                    (ele) =>
                                      [
                                        "referTo",
                                        "referralType",
                                        "consultType",
                                        "ImpressionDiagnosis",
                                        "Remarks",
                                      ].includes(ele) &&
                                      prisciptionForm[ele] &&
                                      (typeof prisciptionForm[ele] ===
                                        "string" ||
                                        typeof prisciptionForm[ele] ===
                                          "number" ||
                                        (typeof prisciptionForm[ele] ===
                                          "object" &&
                                          prisciptionForm[ele].label)),
                                  )
                                : [];

                            const hasPrescriptionForm =
                              prisciptionForm[key] &&
                              !SExamination.includes(key) &&
                              // key !== "NextVisit" &&
                              (prisciptionForm[key]?.length > 0 ||
                                prisciptionForm[key]?.label ||
                                prisciptionForm["admissionRequired"] ||
                                prisciptionForm["NutritionAdvise"]);

                            const hasTags =
                              tags[key]?.length > 0 ||
                              (key === "Chief Complaint" &&
                                tags["Chief Complaint"]?.length > 0);

                            const hasSystematicExamination =
                              SExamination.includes(key) &&
                              prisciptionForm[key];

                            if (
                              !hasPrescriptionForm &&
                              !hasTags &&
                              !hasSystematicExamination &&
                              transferReferralElements.length === 0
                            ) {
                              return null;
                            }

                            return (
                              <div key={index} className="p-1">
                                {hasPrescriptionForm &&
                                  key !== "admissionRequired" &&
                                  key !== "NutritionAdvise" &&
                                  key !== "NextVisit" && (
                                    <div>
                                      <strong className="hover_effect">
                                        {formatString(newKey)} :
                                      </strong>
                                      <span
                                        className="tag hover_effect"
                                        style={{
                                          backgroundColor: "#F5EDED",
                                          display: "inline-table",
                                        }}
                                      >
                                        <span className="pl-1">
                                          {prisciptionForm[key]?.label ||
                                            prisciptionForm[key]}
                                        </span>
                                        <span
                                          className="tag-close-icon"
                                          onClick={() =>
                                            removeTagprisciptionForm(key)
                                          }
                                        >
                                          <i
                                            className="fa fa-times-circle"
                                            aria-hidden="true"
                                          ></i>
                                        </span>
                                      </span>
                                    </div>
                                  )}

                                {key === "admissionRequired" && (
                                  <div>
                                    <strong className="hover_effect">
                                      {formatString(key)} :
                                    </strong>
                                    <span
                                      className="tag hover_effect"
                                      style={{
                                        backgroundColor: "#F5EDED",
                                        display: "inline-table",
                                      }}
                                    >
                                      <span className="pl-1">
                                        {prisciptionForm[
                                          "admissionRequired"
                                        ] === true
                                          ? t("Yes")
                                          : t("No")}
                                      </span>
                                      <span
                                        className="tag-close-icon"
                                        onClick={() =>
                                          removeTagprisciptionForm(key)
                                        }
                                      >
                                        <i
                                          className="fa fa-times-circle"
                                          aria-hidden="true"
                                        ></i>
                                      </span>
                                    </span>

                                    {prisciptionForm["AdmissionDate"] && (
                                      <span
                                        className="tag hover_effect"
                                        style={{
                                          backgroundColor: "#F5EDED",
                                          display: "inline-table",
                                        }}
                                      >
                                        <span className="pl-1">
                                          {prisciptionForm["AdmissionDate"]}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {key === "NextVisit" &&
                                  Object.keys(prisciptionForm)
                                    .filter(
                                      (ele) =>
                                        [
                                          "NextVisit",

                                          "NextVisitRemarks",
                                        ].includes(ele) && prisciptionForm[ele],
                                    )
                                    .map((element) => (
                                      <div key={element}>
                                        <strong>
                                          {formatString(element)} :
                                        </strong>

                                        {prisciptionForm[element] !==
                                          "Invalid date" &&
                                          element !== "NextVisitRemarks" && (
                                            <>
                                              <span
                                                className="tag hover_effect"
                                                style={{
                                                  backgroundColor: "#F5EDED",
                                                  display: "inline-table",
                                                }}
                                              >
                                                <span className="pl-1">
                                                  {prisciptionForm[
                                                    element
                                                  ] instanceof Date
                                                    ? prisciptionForm[
                                                        element
                                                      ].toLocaleDateString()
                                                    : String(
                                                        prisciptionForm[
                                                          element
                                                        ],
                                                      )}
                                                </span>

                                                <span
                                                  className="tag-close-icon"
                                                  onClick={() => {
                                                    removeTagprisciptionForm(
                                                      element,
                                                      element === "NextVisit"
                                                        ? null
                                                        : "",
                                                    );
                                                  }}
                                                >
                                                  <i
                                                    className="fa fa-times-circle"
                                                    aria-hidden="true"
                                                  ></i>
                                                </span>
                                              </span>
                                            </>
                                          )}
                                        {prisciptionForm["NextVisitRemarks"] &&
                                          element !== "NextVisit" && (
                                            <>
                                              <span
                                                className="tag hover_effect"
                                                style={{
                                                  backgroundColor: "#F5EDED",
                                                  display: "inline-table",
                                                }}
                                              >
                                                <span className="pl-1">
                                                  {prisciptionForm[element]}
                                                </span>
                                                <span
                                                  className="tag-close-icon"
                                                  onClick={() =>
                                                    removeTagprisciptionForm(
                                                      element,
                                                    )
                                                  }
                                                >
                                                  <i
                                                    className="fa fa-times-circle"
                                                    aria-hidden="true"
                                                  ></i>
                                                </span>
                                              </span>
                                            </>
                                          )}
                                      </div>
                                    ))}
                                {key === "NutritionAdvise" &&
                                  Object.keys(prisciptionForm)
                                    .filter(
                                      (ele) =>
                                        [
                                          "NutritionAdviseRemarks",
                                          "NutritionAdvise",
                                        ].includes(ele) && prisciptionForm[ele],
                                    )
                                    .map((element) => (
                                      <div key={element}>
                                        <strong>
                                          {formatString(element)} :
                                        </strong>
                                        <span
                                          className="tag hover_effect"
                                          style={{
                                            backgroundColor: "#F5EDED",
                                            display: "inline-table",
                                          }}
                                        >
                                          <span className="pl-1">
                                            {prisciptionForm[element]}
                                          </span>
                                          <span
                                            className="tag-close-icon"
                                            onClick={() =>
                                              removeTagprisciptionForm(element)
                                            }
                                          >
                                            <i
                                              className="fa fa-times-circle"
                                              aria-hidden="true"
                                            ></i>
                                          </span>
                                        </span>
                                      </div>
                                    ))}

                                {key === "TransferReferralForConsultation" &&
                                  transferReferralElements.map((element, i) => {
                                    const value = prisciptionForm[element];
                                    const displayValue =
                                      typeof value === "object" && value.label
                                        ? value.label
                                        : value;

                                    return (
                                      <div
                                        key={element}
                                        className="d-flex align-items-center"
                                      >
                                        {i === 0 && (
                                          <strong className="hover_effect">
                                            {formatString(key)} :
                                          </strong>
                                        )}
                                        <div className=" p-1">
                                          <span
                                            className="tag hover_effect"
                                            style={{
                                              backgroundColor: "#F5EDED",
                                              display: "inline-table",
                                            }}
                                          >
                                            <span className="pl-1">
                                              <strong className="hover_effect">
                                                {formatString(element)}:{" "}
                                              </strong>
                                              {displayValue}
                                            </span>
                                            <span
                                              className="tag-close-icon"
                                              onClick={() =>
                                                removeTagprisciptionForm(
                                                  element,
                                                )
                                              }
                                            >
                                              <i
                                                className="fa fa-times-circle"
                                                aria-hidden="true"
                                              ></i>
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}

                                {hasTags && (
                                  <div>
                                    <strong>{translateIfKnown(t, item?.DisplayName || key)}:</strong>
                                    {tags[key]?.map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="tag hover_effect"
                                        /* An urgent investigation reads the same
                                           here as it does in the box on the left:
                                           this preview is what the doctor checks
                                           before saving, so a mark that showed on
                                           one side only would be worse than none. */
                                        title={
                                          tag?.isUrgent ? t("Marked urgent") : undefined
                                        }
                                        style={{
                                          backgroundColor: tag?.isUrgent
                                            ? "#ffe4e4"
                                            : tag?.ID
                                              ? "#FEFAE0"
                                              : "#F5EDED",
                                          color: tag?.isUrgent ? "#8a1c1c" : undefined,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          // padding: "4px",
                                          cursor: "pointer",
                                          borderRadius: "5px",
                                          border: tag?.isUrgent
                                            ? "1px solid #e0a0a0"
                                            : "1px solid #ccc",
                                        }}
                                      >
                                        {tag?.isUrgent ? (
                                          <span
                                            style={{
                                              background: "#dc2626",
                                              color: "#fff",
                                              borderRadius: "50%",
                                              width: 14,
                                              height: 14,
                                              fontSize: 10,
                                              fontWeight: 700,
                                              lineHeight: "14px",
                                              textAlign: "center",
                                              marginLeft: 4,
                                              flexShrink: 0,
                                            }}
                                          >
                                            !
                                          </span>
                                        ) : null}
                                        <span
                                          onDoubleClick={(e) =>
                                            handleTagDoubleClick(
                                              e,
                                              key,
                                              tagIndex,
                                            )
                                          }
                                          onBlur={(e) =>
                                            handleTagBlur(e, key, tagIndex)
                                          }
                                          onKeyDown={(e) =>
                                            handleTagKeyPress(e, key, tagIndex)
                                          }
                                          contentEditable={
                                            editTagIndex ===
                                            `${key}-${tagIndex}`
                                          }
                                          suppressContentEditableWarning={true}
                                          style={{
                                            outline: "none",
                                            minWidth: "50px",
                                            display: "inline-block",
                                            padding: "2px 5px",
                                          }}
                                        >
                                          {tag?.ValueField || tag?.TypeName}
                                        </span>
                                        <span
                                          className="tag-close-icon"
                                          onClick={() =>
                                            removeTag(key, tagIndex, tag?.ID)
                                          }
                                        >
                                          <i
                                            className="fa fa-times-circle"
                                            aria-hidden="true"
                                          ></i>
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        <div className="systematic-examination pl-1">
                          <div className="d-flex flex-wrap">
                            {SExamination.map(
                              (item, index) =>
                                prisciptionForm[item] &&
                                (prisciptionForm[item]?.length > 0 ||
                                  prisciptionForm[item]?.label) && (
                                  <div key={index} className="p-1 hover_effect">
                                    <span>{formatString(item)} :</span>
                                    <span
                                      className="tag"
                                      style={{
                                        backgroundColor: "#F5EDED",
                                        display: "inline-block",
                                        marginRight: "10px",
                                      }}
                                    >
                                      <span className="pl-1">
                                        {prisciptionForm[item]?.label
                                          ? prisciptionForm[item]?.label
                                          : prisciptionForm[item]}
                                      </span>
                                      <span
                                        className="tag-close-icon"
                                        onClick={() =>
                                          removeTagprisciptionForm(item)
                                        }
                                      >
                                        <i
                                          className="fa fa-times-circle"
                                          aria-hidden="true"
                                        ></i>
                                      </span>
                                    </span>
                                  </div>
                                ),
                            )}
                          </div>
                        </div>

                        {JSON.parse(JSON.stringify(prescription))
                          ?.filter(
                            (val) =>
                              val.ID === 1 || val.ID === 24 || val.ID === 25,
                          )
                          .map((item, index) => (
                            <div className="row" key={index}>
                              <div className="col-sm-12">
                                <div className="App py-1 mx-1">
                                  {item.ID === 1 && (
                                    <strong className="p">{t("Rx :")}</strong>
                                  )}
                                  <div className="col-12">
                                    {/* Show PrescribedMedicineTable only if val.ID is 1 */}
                                    {item.ID === 1 && (
                                      <div
                                        className="tag-input-container rx-rxgrid-block"
                                        style={{
                                          /* the prescription grows with its rows; no
                                             200px cap and no forced scrollbars here */
                                          position: "static",
                                          maxHeight: "none",
                                          overflow: "visible",
                                        }}
                                      >
                                        <label className="col-sm-4 col-10 background-theme-color theme-color">
                                          {t(item?.DisplayName)}
                                        </label>
                                        <div className="px-1 d-flex">
                                          <div className="px-1">
                                            <Favorite
                                              data={items[item?.AccordianName]}
                                              name={item?.AccordianName}
                                              handleChange={
                                                handleFavoriteSelectChange
                                              }
                                            />
                                          </div>
                                          <div
                                            className="px-1"
                                            onClick={() =>
                                              handlePackageDetails(item, "90vw")
                                            }
                                          >
                                            <i className="pi pi-pen-to-square"></i>
                                          </div>
                                          <button
                                            className="btn-success btn-sm btn mb-2 px-2 "
                                            onClick={
                                              handleClickOpenDrugInteraction
                                            }
                                          >
                                            {t("View Interaction")}
                                          </button>
                                          <RxReorderToggle
                                            className="mb-2 ml-1 px-2"
                                            open={rxReorderOpen}
                                            onToggle={() => setRxReorderOpen((v) => !v)}
                                            show={
                                              (tags["Prescribed Medicine"] || []).filter(isFilledMedicineRow).length >= 2
                                            }
                                          />
                                        </div>

                                        <div className="col-12 p-0">
                                          <PrescribedMedicineTable
                                            isDesktop={false}
                                            isShowFirst={true}
                                            tags={tags}
                                            setTags={setTags}
                                            type={"FromPage"}
                                            presTable={presTable}
                                            setPresTable={setPresTable}
                                            apiData={doctorTopSuggestions}
                                            reorderOpen={rxReorderOpen}
                                            setReorderOpen={setRxReorderOpen}
                                            hideReorderToggle={true}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Show PreviousPregnancyTable only if val.ID is 24 */}
                                    {item.ID === 24 && (
                                      <PreviousPregnancyTable
                                        loadSaveData={loadSaveData}
                                        setPreviousPregnancyData={
                                          setPreviousPregnancyData
                                        }
                                        patientDetail={patientDetail}
                                        disabled={isInputDisabled(item.Gender)}
                                      />
                                    )}
                                    {item.ID === 25 && (
                                      <FamilyHistoryTable
                                        loadSaveData={loadSaveData}
                                        setFamilyHistoryData={
                                          setFamilyHistoryData
                                        }
                                        patientDetail={patientDetail}
                                        disabled={isInputDisabled(item.Gender)}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className=" border-top">
                    <div className=" p-3 ">
                      <div
                        style={{
                          height: "40px",
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          textAlign: "right",
                        }}
                      >
                        {t("Signature")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <SlideScreen
          visible={visible}
          setVisible={() => {
            setVisible(false);
            setRenderComponent({
              name: null,
              component: null,
            });
          }}
          Header={
            <SeeMoreSlideScreen
              name={renderComponent?.name}
              seeMore={seeMore}
              handleChangeComponent={handleChangeComponent}
            />
          }
        >
          {renderComponent?.component}
        </SlideScreen>

        {/* </ScrollComponent> */}
        {modalData.visible && (
          <Modal
            visible={modalData.visible}
            Header={modalData.Header}
            modalWidth={modalData?.size}
            onHide={modalData?.setVisible}
            handleAPI={
              modalData.prescription.AccordianName === "Prescribed Medicine"
                ? handleSaveMedicine
                : handleSaveTemplate
            }
            setVisible={() => {
              setModalData((val) => ({ visible: false }));
              setSaveTemplate({
                templateName: "",
                valueField: "",
              });
              setTags1({
                ...AUTOCOMPLETE_STATE,
                NextVisit: [],
                TransferReferral: [],
              });
            }}
          >
            <TemplateSearchModal
              prescription={modalData.prescription}
              saveTemplate={saveTemplate}
              saveTemplateHandleChange={saveTemplateHandleChange}
              tags={tags}
              setTags={setTags}
              tags1={tags1}
              setTags1={setTags1}
            />
          </Modal>
        )}

        {openPageModal.isShow && (
          <OverLay
            visible={openPageModal.isShow}
            Header={
              <>
                <div className="d-flex" style={{ gap: "10px" }}>
                  <p className="m-0">{openPageModal.Header}</p>
                  <div className="" style={{ width: "150px" }}>
                    <ReactSelect
                      dynamicOptions={apiData.getCPEOMenuList
                        ?.filter(
                          (val) => val.menuName !== "Prescription Advice",
                        )
                        ?.map((ele) => {
                          return {
                            value: ele.id,
                            label: ele.menuName,
                          };
                        })}
                      name={"PageList"}
                      value={selectedOption}
                      handleChange={handleSelectChange}
                      placeholderName={"Select Form"}
                      id={"Select"}
                      // value={pageList}
                    />
                  </div>
                </div>
              </>
            }
            modalWidth={"90vw"}
            setVisible={() => setOpenPageModal(false)}
            handleAPI={handleClickDataSet}
          >
            {openPageModal.component}
          </OverLay>
        )}
        {/* <DoctorAssisstance patientDetail={patientDetail?.currentPatient} /> */}
        {isAiSuggestEnabled && aiSuggest.open && (
          <AIPrescriptionSuggestModal
            visible={aiSuggest.open}
            setVisible={(visible) => setAiSuggest((prev) => ({ ...prev, open: !!visible }))}
            context={aiSuggest.context}
            patternRequest={aiSuggest.patternRequest}
            tags={tags}
            setTags={setTags}
            setPrisciptionForm={setPrisciptionForm}
            loadInvestigationCatalog={loadAiInvestigationCatalog}
          />
        )}
        {/* */}
        <Modal
          visible={open}
          setVisible={setOpen}
          modalWidth={"80vw"}
          Header={t("💊 Drug Interaction Checker")}
          footer={<></>}
        >
          <DrugInteractionWidget
            open={open}
            setOpen={setOpen}
            initialMedicines={prescribedMedicineNames}
            initialResults={interactionResults}
            patientDetails={patientDetail?.currentPatient}
            initialAllergies={prisciptionForm?.Allergies}
            initialDiagnoses={diseaseAlertEnabled ? localDiagnosisText : ""}
            loadPatientDiagnoses={
              diseaseAlertEnabled ? loadPatientDiagnosesForAlert : null
            }
            loadPatientLabs={labAlertEnabled ? loadPatientLabsForAlert : null}
            loadPatientPregnancy={
              pregnancyAlertEnabled ? loadPatientPregnancyForAlert : null
            }
            medicineItems={medicineItemsForAlert}
            onAcknowledge={handleAlertAcknowledge}
          />
        </Modal>
        {emailModal.isShow && (
          <Modal
            visible={emailModal.isShow}
            Header={t("Send report Via Email")}
            modalWidth={"50vw"}
            setVisible={() => setEmailModal(false)}
            handleAPI={handleClickSentEmail}
          >
            {/* {emailModal.component} */}
            <SendEmailDoctor
              emailHandleChange={emailHandleChange}
              emailSend={emailSend}
              setEmailSend={setEmailSend}
              error={emailError}
            />
          </Modal>
        )}

        {nameTemplateModalData.visible && (
          <Modal
            visible={nameTemplateModalData.visible}
            Header={nameTemplateModalData.Header}
            modalWidth={nameTemplateModalData?.size}
            setVisible={setIsOpen}
            handleAPI={nameTemplateModalData.handleInsertApi}
            children={nameTemplateModalData.component}
            modalData={modalData}
            setModalData={setModalData}
          />
        )}

        {smsModal.isShow && (
          <Modal
            visible={smsModal.isShow}
            Header={t("Send report Via Mobile")}
            modalWidth={"20vw"}
            setVisible={() => setSmsModal(false)}
            handleAPI={handleClickSentSMS}
          >
            <SendSMSDoctor
              phoneNumber={patientDetail?.currentPatient}
              sms={sms}
              setSms={setSms}
              handleChangeSMS={handleChangeSMS}
              error={error1}
            />
          </Modal>
        )}

        {settingModal.isShow && (
          <OverLay
            visible={settingModal.isShow}
            Header={
              <div className="d-flex" style={{ gap: "10px" }}>
                {settingModal.header}
              </div>
            }
            modalWidth={settingModal?.size}
            setVisible={(prev) => setSettingModal({ ...prev, isShow: false })}
            // handleAPI={handleClickSentSMS}
          >
            {settingModal.component
              ? settingModal.component
              : t("No Component Found")}
          </OverLay>
        )}
        <Modal
          visible={showNotPad}
          Header={t("Note Pad")}
          modalWidth={"90vw"}
          setVisible={() => setShowNotPad(false)}
          footer={<></>}
        >
          <NotePadModal
            onSave={(text) => {
              setNotepadTextForAI(text);
              setShowNotPad(false);
              setShowAISummary(true);
            }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default AppointmentPatientDetail;
