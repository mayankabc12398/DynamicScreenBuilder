import React, { useEffect, useState } from "react";
import PatientEncounterHistory from "../../frontOffice/OPD/PatientEncounterHistory";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Input from "@app/components/formComponent/Input";
import TextAreaInput from "../../../components/formComponent/TextAreaInput";
import Checkbox from "../../../components/formComponent/Checkbox";
import DatePicker from "../../../components/formComponent/DatePicker";
import AppointmentPatientDetail from "../../../components/UI/customTable/doctorTable/ViewConsultationtable/AppointmentPatientDetail";
import {
  GetBindAllDoctorConfirmation,
  GetBindDepartment,
} from "../../../store/reducers/common/CommonExportFunction";
import { useDispatch, useSelector } from "react-redux";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { useFormik } from "formik";
import {
  AUTOCOMPLETE_STATE,
  ViewConsultationPayload,
  VIEWSTATUS,
  maskValue,
} from "../../../utils/constant";
import moment from "moment";
import {
  CommonAPIGetDoctorIDByEmployeeID,
  GetPatientMedicalInfo,
  SearchList,
  UpdateCall,
  UpdateIn,
  UpdateUncall,
  getGetDoctor,
  SearchChiefComplaintTemplate,
  SearchPastHistory,
  SearchTreatmentHistory,
  SearchPersonalHistory,
  SearchGeneralExamination,
  SearchProvisionalDiagnosis,
  SearchDoctorAdvoice,
  SearchDietTemplate,
  LoadInvestigation,
  SearchPrescribeMedicine,
  getDoctorNotes,
  getProcedureItemSearch,
  getGetSignAndSymptoms,
  getVaccinationStatus,
} from "../../../networkServices/DoctorApi";
import PendingAppointmentPatientList from "../../../components/UI/customTable/doctorTable/ViewConsultationtable/PendingAppointmentPatientList";
import DoneAppointmentDetail from "../../../components/UI/customTable/doctorTable/ViewConsultationtable/DoneAppointmentDetail";
import { notify } from "../../../utils/utils";
import audioFile from "../../../assets/Audio/notification.mp3";
import audioFileOut from "../../../assets/Audio/notifyOut.mp3";
import { SearchListData } from "../../../store/reducers/DoctorModule/VitalSign";
import Modal from "../../../components/modalComponent/Modal";
import OverLay from "../../../components/modalComponent/OverLay";
import MedicationCalendar from "../../../components/modalComponent/Utils/MedicationCalendar";
import FlowsheetModel from "../../../components/modalComponent/Utils/FlowsheetModel";
import PatientSummaryCalendar from "../../../components/modalComponent/Utils/PatientSummaryCalendar";
import { GmailScheduleMeetingWithPatient } from "../../../networkServices/EDP/govindedp";
import { FaStar, FaFileMedical } from "react-icons/fa";
import { GiMedicines } from "react-icons/gi";
import { FaKitMedical } from "react-icons/fa6";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faHashtag, faPhone, faCalendarDays, faUserDoctor,
  faCircleCheck, faTriangleExclamation, faRightToBracket, faPhoneSlash,
  faPaperPlane, faEllipsisVertical, faHeartPulse, faFolderOpen,
  faPills, faNotesMedical, faRotate, faGaugeHigh, faFilter,
  faTableCellsLarge, faList, faUsers,
  faExpand, faCompress, faArrowsRotate,
  faChevronLeft, faChevronRight,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { faClock, faFaceMeh } from "@fortawesome/free-regular-svg-icons";
import RPM from "./RPM";
import { translateOptions } from "@components/WrapTranslate";

// ─── Inline styles ────────────────────────────────────────────────────────────
const C = {
  wrap: { fontFamily: "'DM Sans',sans-serif" },
  // top toolbar
  toolbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 16px 6px", flexWrap: "wrap", gap: 8,
  },
  toolbarLeft: { display: "flex", alignItems: "center", gap: 10 },
  toolbarTitle: { fontSize: 15, fontWeight: 600, color: "#0F1733", display: "flex", alignItems: "center", gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 },
  toolbarRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  // filter toggle button
  filterBtn: (open) => ({
    height: 32, padding: "0 14px", display: "flex", alignItems: "center", gap: 6,
    background: open ? "#EFF6FF" : "#F0F2F8", color: open ? "#1D4ED8" : "#4A5578",
    border: open ? "0.5px solid #BFDBFE" : "0.5px solid #CBD2E8",
    borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer",
  }),
  // view toggle
  viewToggle: {
    display: "flex", gap: 2, background: "#F0F2F8", borderRadius: 8, padding: 3, height: 32,
  },
  viewBtn: (active) => ({
    height: 26, padding: "0 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 5, border: "none", outline: "none",
    background: active ? "#fff" : "transparent",
    color: active ? "#0F1733" : "#8892B0",
    boxShadow: active ? "0 1px 4px rgba(0,0,0,.06)" : "none",
    transition: "all .15s",
  }),
  // filter panel
  filterPanel: {
    padding: "0 16px 12px", borderTop: "0.5px solid #E2E6F0", marginTop: 4,
  },
  // stats
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10,
    padding: "12px 16px 4px",
  },
  statCard: {
    background: "#fff", border: "0.5px solid #E2E6F0", borderRadius: 10,
    padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,.05)",
  },
  statIcon: (bg) => ({
    width: 34, height: 34, borderRadius: 10, background: bg,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }),
  statNum: { fontSize: 20, fontWeight: 600, lineHeight: 1, color: "#0F1733" },
  statLbl: { fontSize: 11, color: "#8892B0", marginTop: 2 },
  // legend
  legend: {
    display: "flex", gap: 14, flexWrap: "wrap",
    padding: "8px 16px", borderTop: "0.5px solid #E2E6F0",
  },
  legItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4A5578" },
  legDot: (bg) => ({ width: 8, height: 8, borderRadius: "50%", background: bg, flexShrink: 0 }),
  // status tabs
  tabsWrap: {
    display: "flex", gap: 2, background: "#F0F2F8", borderRadius: 8,
    padding: 3, width: "fit-content",
  },
  tab: (active) => ({
    padding: "5px 16px", borderRadius: 6, fontSize: 12, fontWeight: 500,
    cursor: "pointer", whiteSpace: "nowrap", border: "none", outline: "none",
    background: active ? "#fff" : "transparent",
    color: active ? "#0F1733" : "#8892B0",
    boxShadow: active ? "0 1px 4px rgba(0,0,0,.06)" : "none",
    transition: "all .15s",
  }),
  // section header
  sectionHead: {
    fontSize: 13, fontWeight: 600, color: "#0F1733",
    padding: "10px 16px 6px", display: "flex", alignItems: "center", gap: 8,
  },
  sectionBadge: (bg, color) => ({
    background: bg, color: color, fontSize: 11, fontWeight: 600,
    padding: "2px 8px", borderRadius: 20,
  }),
  // card grid
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(256px,1fr))",
    gap: 12, padding: "4px 16px 16px",
  },
  // patient card
  pc: (isVip) => ({
    background: isVip ? "linear-gradient(160deg,#FFFBEB 0%,#fff 40%)" : "#fff",
    borderRadius: 12, border: isVip ? "0.5px solid #FCD34D" : "0.5px solid #E2E6F0",
    display: "flex", flexDirection: "column", position: "relative",
    boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "visible",
    transition: "border-color .15s, box-shadow .15s",
  }),
  leftBar: (color) => ({
    position: "absolute", left: 0, top: 14, bottom: 14,
    width: 3, borderRadius: "0 3px 3px 0", background: color,
  }),
  pcHead: (isVip) => ({
    padding: "10px 12px 9px 15px", display: "flex", alignItems: "flex-start", gap: 9,
    borderBottom: isVip ? "0.5px solid #FDE68A" : "0.5px solid #E2E6F0",
  }),
  avWrap: { position: "relative", flexShrink: 0 },
  av: (bg, color, border) => ({
    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 600, letterSpacing: "-.5px",
    background: bg, color: color, border: `2px solid ${border}`,
  }),
  starPin: {
    position: "absolute", bottom: -2, right: -2, width: 15, height: 15,
    borderRadius: "50%", background: "#F59E0B", display: "flex",
    alignItems: "center", justifyContent: "center", border: "2px solid #fff",
    fontSize: 7, color: "#fff", fontWeight: 700,
  },
  pcInfo: { flex: 1, minWidth: 0 },
  pcName: (isVip) => ({
    fontSize: 12, fontWeight: 600, color: isVip ? "#92400E" : "#0F1733",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  }),
  pcId: {
    fontSize: 10, color: "#8892B0", marginTop: 2,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  tokenBadge: (bg, color) => ({
    width: 26, height: 26, borderRadius: 7, fontSize: 11, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, background: bg, color: color,
  }),
  // card body
  pcBody: { padding: "9px 12px 8px 15px", display: "flex", flexDirection: "column", gap: 5 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 6px" },
  iitem: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#1E293B" },
  iitemIcon: { fontSize: 11, color: "#475569", flexShrink: 0, width: 13, textAlign: "center" },
  iitemText: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 },
  badgeRow: { display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", marginTop: 2 },
  badge: (bg, color) => ({
    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 8,
    display: "inline-flex", alignItems: "center", gap: 3, background: bg, color: color,
  }),
  // card footer
  pcFooter: (isVip) => ({
    padding: "8px 10px", display: "flex", alignItems: "center", gap: 5,
    borderTop: isVip ? "0.5px solid #FDE68A" : "0.5px solid #E2E6F0",
  }),
  spacer: { flex: 1 },
  ib: (bg, color, border) => ({
    width: 28, height: 28, flexShrink: 0, borderRadius: 7, cursor: "pointer",
    border: `0.5px solid ${border}`, background: bg, color: color,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "opacity .15s", fontSize: 12,
  }),
  // dropdown
  ddWrap: {
    position: "absolute", bottom: 44, right: 8, background: "#fff",
    border: "0.5px solid #CBD2E8", borderRadius: 12, minWidth: 156,
    zIndex: 400, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.1)",
  },
  ddItem: {
    display: "flex", alignItems: "center", gap: 9, padding: "8px 13px",
    fontSize: 11, color: "#0F1733", cursor: "pointer", borderBottom: "0.5px solid #E2E6F0",
  },
  ddIcon: { fontSize: 12, color: "#8892B0", width: 14, textAlign: "center" },
  // empty
  emptyState: { gridColumn: "1/-1", textAlign: "center", padding: "50px 20px", color: "#8892B0" },
};

// ─── Component ────────────────────────────────────────────────────────────────
const ViewConsultationCardView = () => {
  const [items, setItems] = useState(AUTOCOMPLETE_STATE);
  const [currentDoctor, setCurrentDoctor] = useState({ label: "Loading...", value: "0" });
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const localData = useLocalStorage("userData", "get");
  const dispatch = useDispatch();

  const [encounterModal, setEncounterModal] = useState(null);

  // ── UI state ──
  const [viewMode, setViewMode] = useState("card");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [cardPage, setCardPage] = useState(1);
  const CARDS_PER_PAGE = 15;
  const fullscreenRef = React.useRef(null);

  // ── Patient detail state ──
  const [active, setActive] = useState(true);
  const [calledPatient, setCalledPatient] = useState("UnCall");
  const [getCall, setCall] = useState();
  const [medicalData, setMedicalInfoData] = useState(null);
  const [docID, setDocID] = useState();
  const [selectedIndex, setSelectedIndex] = useState({ index: null, listType: null });
  const [getDoctorID, setDoctorID] = useState(null);
  const [docterError, setDoctorError] = useState();
  const [getUser, setGetUser] = useState({});

  // ── Modal state ──
  const [showFlowSheet, setShowFlowSheet] = useState(false);
  const [showMedicationCalendar, setShowMedicationCalendar] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [rpmModal, setRpmModal] = useState({ show: false, patient: null, index: null, listType: null });
  const [inviteModal, setInviteModal] = useState({ show: false, patient: null });
  const [inviteValues, setInviteValues] = useState({
    Subject: "Online Consultation",
    Description: "Patient consultation via Google Meet",
    MobileNo: "",
    IsLinkSendBySMS: false,
    AttendeesEmails: "",
  });

  // ── Data state ──
  const [bodyData, setBodyData] = useState({
    SearchViewConsultaionList: [],
    DoneAppointmentListList: [],
  });

  const audio = new Audio(audioFile);
  const audioFileP = new Audio(audioFileOut);

  const {
    GetDepartmentList,
    GetBindAllDoctorConfirmationData,
    GetGlobalResources,
  } = useSelector(
    (state) => state.CommonSlice,
  );
  const isTableCardListDefault =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsTableCardShow")
      ?.Value === "1";

  useEffect(() => {
    if (isTableCardListDefault) {
      setViewMode("list");
    }
  }, [isTableCardListDefault]);

  const { handleChange, values, setFieldValue, handleSubmit } = useFormik({
    initialValues: {
      mrNo: "",
      pName: "",
      appNo: "",
      doctorID: currentDoctor,
      status: "2",
      fromDate: moment().format("DD-MMM-YYYY"),
      toDate: moment().format("DD-MMM-YYYY"),
      docDepartment: { label: "All", value: "0" },
      appStatus: "0",
    },
    onSubmit: () => SearchOPDBillsCallAPI(),
  });

  const newValues = {
    mrNo: values?.mrNo,
    pName: values?.pName,
    appNo: values?.appNo,
    docDepartment: values?.docDepartment?.value ?? "",
    doctorID: values?.doctorID?.value ?? "",
    status: values?.status?.value ? values.status.value : values.status,
    fromDate: values?.fromDate
      ? moment(values.fromDate, "DD-MMM-YYYY", true).format("DD-MMM-YYYY")
      : "",
    toDate: values?.toDate
      ? moment(values.toDate, "DD-MMM-YYYY", true).format("DD-MMM-YYYY")
      : "",
  };

  // ── API handlers ──────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const SearchOPDBillsCallAPI = async () => {
    try {
      const dataRes = await SearchList(newValues);
      if (dataRes?.success) {
        setBodyData({
          SearchViewConsultaionList: dataRes?.data?.pendingAppointmentList || [],
          DoneAppointmentListList: dataRes?.data?.viewedAppointmentList || [],
        });
      } else {
        notify(dataRes?.message, "error");
        setBodyData({ SearchViewConsultaionList: [], DoneAppointmentListList: [] });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getUpdateCallAPI = async (item, index, listType) => {
    try {
      const dataRes = await UpdateCall({ app_ID: item?.App_ID, doctorID: item?.DoctorID });
      if (dataRes.success) {
        // SRS-2026-0057 point 1. Matches the list view: Call also marks the
        // patient In and opens the consultation. The card's In button is the
        // re-entry path for a patient who was already called.
        notify(dataRes.message, "success");
        handlePatientSelect(item, index, listType);
        try {
          const medInfoRes = await GetPatientMedicalInfo(item?.PatientID);
          if (medInfoRes?.success) setMedicalInfoData(medInfoRes?.data);
        } catch (e) {
          notify(e?.message, "error");
        }
      } else {
        notify(dataRes.message, "error");
      }
      SearchOPDBillsCallAPI();
    } catch (error) {
      console.error(error);
    }
  };

  const getUpdateUncall = async (item) => {
    try {
      const response = await UpdateUncall(item?.App_ID);
      // Refused by the API, e.g. the patient was called by another doctor.
      if (response && response.success === false && response.message) {
        notify(response.message, "error");
      }
      SearchOPDBillsCallAPI();
    } catch (error) {
      console.error(error);
    }
  };

  const getUpdateInAPI = async (item, index, listType) => {
    let finalItem = item;
    let finalIndex = index;
    let finalListType = listType;

    if (!finalItem?.TransactionID || finalIndex === undefined || finalListType === undefined) {
      const pi = bodyData?.SearchViewConsultaionList?.findIndex((i) => i.App_ID === item.App_ID);
      if (pi !== -1) {
        finalItem = bodyData.SearchViewConsultaionList[pi];
        finalIndex = pi;
        finalListType = "Pending";
      } else {
        const di = bodyData?.DoneAppointmentListList?.findIndex((i) => i.App_ID === item.App_ID);
        if (di !== -1) {
          finalItem = bodyData.DoneAppointmentListList[di];
          finalIndex = di;
          finalListType = "Done";
        }
      }
    }

    try {
      const dataRes = await UpdateIn({ app_ID: finalItem?.App_ID, doctorID: finalItem?.DoctorID });
      if (dataRes?.success) {
        setGetUser(finalItem);
        setDocID(finalItem?.DoctorID);
        SearchOPDBillsCallAPI();
        setSelectedIndex({ index: finalIndex, listType: finalListType });
        setActive(false);
        setShowNotesModal(false);
      } else {
        notify(dataRes?.message, "error");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCallButtonClick = (item, index, listType) => {
    setDocID(item?.DoctorID);
    setGetUser(item);
    if (item.IsCall === 1) {
      audioFileP.play();
      getUpdateUncall(item);
      dispatch(SearchListData(newValues));
    } else {
      audio.play();
      getUpdateCallAPI(item, index, listType);
      dispatch(SearchListData(newValues));
    }
  };

  const handlePatientSelect = async (item, index, listType) => {
    setGetUser(item);
    setDocID(item?.DoctorID);

    // SRS-2026-0057 point 1. Already In - reopen the consultation instead of
    // calling UpdateIn again, which would re-stamp InTime.
    if (Number(item?.P_In) === 1) {
      setSelectedIndex({ index, listType });
      setActive(false);
      setShowNotesModal(false);
      return;
    }

    await getUpdateInAPI(item, index, listType);
  };

  const checkGetDoctorIDForTransationID = async (item) => {
    try {
      const response = await getGetDoctor(item?.TransactionID);
      if (response.success) {
        setDoctorID(response.data);
        item.DoctorID = response.data;
        fetchAllApiData(item);
      } else {
        fetchAllApiData(item);
        setDoctorID(getUser?.DoctorID);
      }
      if (response.success === false) setDoctorError(1);
    } catch (error) {
      console.log(error);
    }
  };

  // All template/suggestion fetchers (same as original)
  const fetchAllApiData = async (details) => {
    const investigationPayload = {
      type: "1", categoryID: "0", subCategoryID: "0",
      isIPDData: 0, transactionId: String(details?.TransactionID),
      appID: String(details?.App_ID),
    };
    const [ccTemp, pastH, treatH, personalH, genExam, provDiag, docAdv, diet, invest, medicine, notes, procedure, signs, vaccine] =
      await Promise.all([
        SearchChiefComplaintTemplate(details?.DoctorID).then((r) => r?.data),
        SearchPastHistory(details?.DoctorID).then((r) => r?.data),
        SearchTreatmentHistory(details?.DoctorID).then((r) => r?.data),
        SearchPersonalHistory(details?.DoctorID).then((r) => r?.data),
        SearchGeneralExamination(details?.DoctorID).then((r) => r?.data),
        SearchProvisionalDiagnosis(details?.DoctorID).then((r) => r?.data),
        SearchDoctorAdvoice(details?.DoctorID).then((r) => r?.data),
        SearchDietTemplate(details?.DoctorID).then((r) => r?.data),
        LoadInvestigation(investigationPayload).then((r) => {
          if (!r?.success) return [];
          return (Array.isArray(r?.data) ? r.data : []).map((e) => ({
            ID: e?.newItemID, ValueField: e?.typeName, value: e?.itemID,
            TemplateName: e?.typeName, AllItemData: e?.newItemID,
            subCategoryID: e?.subCategoryID, categoryID: e?.categoryid,
          }));
        }),
        SearchPrescribeMedicine(details?.DoctorID).then((r) => {
          const result = r?.data?.map((ele) => ({
            ID: ele?.id,
            ValueField: ele?.valueField.map((item) => ({
              TemplateID: ele?.id,
              Name: { value: item?.name, ID: item?.itemID, isDisable: true, AllItemData: ele },
              Dose: { value: item?.dose }, Time: { value: item?.times },
              Duration: { value: item?.duration }, Route: { value: item?.route },
              Meal: { value: item?.meal }, Remarks: { value: item?.remarks },
              AllItemListData: { value: ele },
            })),
            TemplateName: ele?.tempName, templateFor: ele?.templateFor,
          }));
          setItems((v) => ({ ...v, "Prescribed Medicine": result }));
          return result;
        }),
        getDoctorNotes(details?.DoctorID).then((r) => r?.data),
        getProcedureItemSearch().then((r) =>
          r?.data?.map((e) => ({
            ID: e?.NewItemID, ValueField: e?.TypeName, value: e?.NewItemID,
            TemplateName: e?.TypeName, AllItemData: e,
          }))
        ),
        getGetSignAndSymptoms(details?.DoctorID).then((r) => r?.data),
        getVaccinationStatus(details?.DoctorID).then((r) => r?.data),
      ]);

    setItems({
      ...AUTOCOMPLETE_STATE,
      "Chief Complaint": ccTemp,
      "Past History": pastH,
      "Treatment History": treatH,
      "Personal/Occupational History": personalH,
      "General Examination": genExam,
      "Provisional Diagnosis": provDiag,
      "Doctor Advice": docAdv,
      Diet: diet,
      "Investigation(Lab & Radio)": invest,
      "Prescribed Medicine": medicine,
      "Doctor Notes": notes,
      "Prescribed Procedure": procedure,
      "Sign & Symptoms": signs,
      "Vaccination Status": vaccine,
    });
  };

  const DoctorIDByEmployeeID = async () => {
    try {
      const response = await CommonAPIGetDoctorIDByEmployeeID();
      return response?.data[0]?.doctorID;
    } catch {
      return null;
    }
  };

  // ── Invite handlers ──────────────────────────────────────────────────────
  const handleInvitePatient = (patient) => {
    setInviteValues({
      Subject: "Online Consultation",
      Description: "Patient consultation via Google Meet",
      MobileNo: patient?.ContactNo || "",
      IsLinkSendBySMS: false,
      AttendeesEmails: patient?.Email || "",
    });
    setInviteModal({ show: true, patient });
  };

  const handleInviteChange = (e) => {
    if (e.target.name === "MobileNo" && e.target.value.length > 10) return;
    setInviteValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const handleSendInvite = async () => {
    const patient = inviteModal.patient;
    const emailArr = (inviteValues.AttendeesEmails || "").split(",").map((e) => e.trim());
    const invalid = emailArr.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid.length || !emailArr.length) {
      notify(t("Invalid recipient email found"), "error");
      return;
    }
    const payload = {
      AppId: patient?.App_ID,
      TransactionId: patient?.TransactionID,
      DoctorId: patient?.DoctorID,
      IsLinkSendBySMS: inviteValues.IsLinkSendBySMS ? 1 : 0,
      MobileNo: inviteValues.MobileNo,
      StartDateTime: moment(patient?.AppointmentDate, "DD-MMM-YYYY hh:mm A").format("YYYY-MM-DD HH:mm:ss"),
      EndDateTime: moment(patient?.AppointmentDate, "DD-MMM-YYYY hh:mm A").add(30, "minutes").format("YYYY-MM-DD HH:mm:ss"),
      Subject: inviteValues.Subject,
      Description: inviteValues.Description,
      Location: "", Organizer: "", Link: "",
      AttendeesEmails: emailArr,
    };
    const res = await GmailScheduleMeetingWithPatient(payload);
    if (res?.success) setInviteModal({ show: false, patient: null });
    notify(res?.message, res?.success ? "success" : "error");
  };

  const handleReactSelectChange = async (name, e) => {
    setFieldValue(name, e);
    if (name === "DepartmentID") {
      dispatch(GetBindAllDoctorConfirmation({ Department: e.label, CentreID: localData?.centreID }));
    }
  };

  const handleReactSelect = (name, value) => setFieldValue(name, value);

  // ── Effects ───────────────────────────────────────────────────────────────
  // Auto-search on mount with today's date
  useEffect(() => {
    SearchList({
      mrNo: "", pName: "", appNo: "", docDepartment: "0", doctorID: "0",
      status: "2",
      fromDate: moment().format("DD-MMM-YYYY"),
      toDate: moment().format("DD-MMM-YYYY"),
    })
      .then((dataRes) => {
        if (dataRes?.success) {
          setBodyData({
            SearchViewConsultaionList: dataRes?.data?.pendingAppointmentList || [],
            DoneAppointmentListList: dataRes?.data?.viewedAppointmentList || [],
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    dispatch(GetBindAllDoctorConfirmation({ Department: "All", CentreID: localData?.centreID }));
    dispatch(GetBindDepartment());
  }, [dispatch]);

  useEffect(() => {
    if (getUser?.TransactionID) checkGetDoctorIDForTransationID(getUser);
  }, [getUser?.TransactionID]);

  useEffect(() => {
    const fetchCurrentDoctor = async () => {
      const doctorID = await DoctorIDByEmployeeID();
      if (doctorID && GetBindAllDoctorConfirmationData.length > 0) {
        const doc = GetBindAllDoctorConfirmationData.find((d) => d.DoctorID === doctorID);
        if (doc) setCurrentDoctor({ label: doc.Name, value: doc.DoctorID });
      }
    };
    fetchCurrentDoctor();
  }, [GetBindAllDoctorConfirmationData]);

  useEffect(() => {
    if (GetBindAllDoctorConfirmationData.length > 0 && currentDoctor.value !== "0") {
      const doc = GetBindAllDoctorConfirmationData.find((d) => d.DoctorID === currentDoctor.value);
      if (doc) {
        setFieldValue("doctorID", { label: doc.Name, value: doc.DoctorID });
        // Re-search automatically with the resolved doctor ID
        SearchList({
          mrNo: "", pName: "", appNo: "", docDepartment: "0",
          doctorID: doc.DoctorID,
          status: "2",
          fromDate: moment().format("DD-MMM-YYYY"),
          toDate: moment().format("DD-MMM-YYYY"),
        })
          .then((dataRes) => {
            if (dataRes?.success) {
              setBodyData({
                SearchViewConsultaionList: dataRes?.data?.pendingAppointmentList || [],
                DoneAppointmentListList: dataRes?.data?.viewedAppointmentList || [],
              });
            }
          })
          .catch(console.error);
      }
    }
  }, [GetBindAllDoctorConfirmationData, currentDoctor.value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = () => setOpenDropdownId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ── Table headers (for list view) ─────────────────────────────────────────
  const SearchThead = [
    { name: t("Sr.No"), width: "2%" }, { name: t("FlowSheet"), width: "7%" },
    { name: t("Invite Patient"), width: "46%" }, { name: t("RPM"), width: "10%" },
    { name: t("Call"), width: "2%" }, { name: t("UHID"), width: "10%" },
    { name: t("Token No"), width: "10%" }, { name: t("Visit No"), width: "10%" },
    { name: t("Name"), width: "46%" }, { name: t("Age/Gender"), width: "10%" },
    { name: t("Doctor"), width: "20%" }, { name: t("Reg Date"), width: "46%" },
    { name: t("App Date"), width: "46%" }, { name: t("Call Date"), width: "46%" },
    { name: t("Start Date"), width: "46%" }, { name: t("End Date"), width: "46%" },
  ];
  const tHead = [
    { name: t("Sr.No"), width: "2%" }, { name: t("UHID"), width: "10%" },
    { name: t("Name"), width: "46%" }, { name: t("Age/Gender"), width: "10%" },
    { name: t("Doctor"), width: "20%" }, { name: t("Date"), width: "10%" },
    { name: t("RPM"), width: "10%" }, { name: t("In"), width: "2%" },
  ];

  // ── Card helpers ─────────────────────────────────────────────────────────
  const getBarColor = (p) => {
    if (Number(p.IsDoctorConsultancyUrgent) === 1) return "#EF4444";
    if (p.PatientType === "VIP") return "#F59E0B";
    if (p.IsView === 1) return "#22C55E";
    if (p.IsCall === 1) return "#8B5CF6";
    return "#3B82F6";
  };

  const getInitials = (name = "") =>
    name.replace(/^(Mr\.|Ms\.|Mrs\.)\s+/i, "")
      .split(" ").map((w) => w[0] || "").slice(0, 2).join("").toUpperCase();

  const getAvatarStyle = (p) => {
    if (p.PatientType === "VIP") return { bg: "linear-gradient(135deg,#FEF3C7,#FDE68A)", color: "#92400E", border: "#F59E0B" };
    if (p.IsView === 1) return { bg: "#D1FAE5", color: "#065F46", border: "#86EFAC" };
    if (p.Sex === "F" || p.Sex === "Female") return { bg: "#FCE7F3", color: "#9D174D", border: "#F9A8D4" };
    return { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" };
  };

  const getTokenStyle = (p) => {
    if (p.PatientType === "VIP") return { bg: "#FDE68A", color: "#92400E" };
    const tok = Number(p.GenralTokenNo);
    if (tok <= 5) return { bg: "#DBEAFE", color: "#1D4ED8" };
    if (tok <= 20) return { bg: "#FEF3C7", color: "#92400E" };
    return { bg: "#D1FAE5", color: "#065F46" };
  };

  // ── Filter helpers ────────────────────────────────────────────────────────
  const filterList = (list) => {
    switch (activeTab) {
      case "pending": return list.filter((p) => !p.IsView || p.IsView === 0);
      case "called":  return list.filter((p) => p.IsCall === 1);
      case "viewed":  return list.filter((p) => p.IsView === 1);
      case "vip":     return list.filter((p) => p.PatientType === "VIP");
      default:        return list;
    }
  };

  const pendingList  = bodyData.SearchViewConsultaionList || [];
  const doneList     = bodyData.DoneAppointmentListList || [];
  const allPatients  = [...pendingList, ...doneList];
  const totalCount   = allPatients.length;
  const pendingCount = pendingList.filter((p) => !p.IsView).length;
  const viewedCount  = doneList.length;
  const calledCount  = pendingList.filter((p) => p.IsCall === 1).length;
  const vipCount     = allPatients.filter((p) => p.PatientType === "VIP").length;

  // ── Card renderer ─────────────────────────────────────────────────────────
  const renderCard = (patient, index, listType) => {
    const isVip     = patient.PatientType === "VIP";
    const isViewed  = patient.IsView === 1;
    const isCalled  = patient.IsCall === 1;
    const isUrgent  = Number(patient.IsDoctorConsultancyUrgent) === 1;
    const barColor  = getBarColor(patient);
    const av        = getAvatarStyle(patient);
    const tok       = getTokenStyle(patient);
    const initials  = getInitials(patient.Pname);
    const dropKey   = `${listType}-${index}`;
    const ddOpen    = openDropdownId === dropKey;
    const displayName = isVip ? maskValue(patient.Pname) : patient.Pname;

    return (
      <div
        key={dropKey}
        style={C.pc(isVip)}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.1)";
          e.currentTarget.style.borderColor = isVip ? "#F59E0B" : "#CBD2E8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.06)";
          e.currentTarget.style.borderColor = isVip ? "#FCD34D" : "#E2E6F0";
        }}
      >
        {/* Status bar */}
        <div style={C.leftBar(barColor)} />

        {/* Head */}
        <div style={C.pcHead(isVip)}>
          <div style={C.avWrap}>
            <div style={C.av(av.bg, av.color, av.border)}>{initials}</div>
            {isVip && (
              <div style={C.starPin}>
                <FaStar style={{ fontSize: 6 }} />
              </div>
            )}
          </div>
          <div style={C.pcInfo}>
            <div style={C.pcName(isVip)}>{displayName}</div>
            <div style={C.pcId}>
              {patient.MRNo} · {patient.PanelName || t("OPD")}
            </div>
          </div>
          {patient.GenralTokenNo > 0 && (
            <div style={C.tokenBadge(tok.bg, tok.color)}>
              {patient.GenralTokenNo}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={C.pcBody}>
          <div style={C.infoGrid}>
            <div style={C.iitem}>
              <FontAwesomeIcon icon={faUser} style={C.iitemIcon} />
              <span style={C.iitemText}>{patient.Age}Y · {patient.Sex}</span>
            </div>
            <div style={C.iitem}>
              <FontAwesomeIcon icon={faHashtag} style={C.iitemIcon} />
              <span style={C.iitemText}>{t("Visit")} {patient.TransNo || "—"}</span>
            </div>
            <div style={C.iitem}>
              <FontAwesomeIcon icon={faPhone} style={C.iitemIcon} />
              <span style={C.iitemText}>{patient.ContactNo || "—"}</span>
            </div>
            <div style={C.iitem}>
              <FontAwesomeIcon icon={faCalendarDays} style={C.iitemIcon} />
              <span style={C.iitemText}>
                {patient.AppointmentDate
                  ? moment(patient.AppointmentDate, ["DD-MMM-YYYY hh:mm A", "DD-MMM-YYYY"]).format("DD MMM YYYY")
                  : "—"}
              </span>
            </div>
            <div style={{ ...C.iitem, gridColumn: "1/-1" }}>
              <FontAwesomeIcon icon={faUserDoctor} style={C.iitemIcon} />
              <span style={C.iitemText}>{patient.DName}</span>
            </div>
          </div>

          {/* Badges */}
          <div style={C.badgeRow}>
            {isViewed ? (
              <span style={C.badge("#D1FAE5", "#065F46")}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 9 }} /> {t("Done")}
              </span>
            ) : (
              <span style={C.badge("#FEF3C7", "#92400E")}>
                <FontAwesomeIcon icon={faClock} style={{ fontSize: 9 }} /> {t("Pending")}
              </span>
            )}
            {isCalled && (
              <span style={C.badge("#DBEAFE", "#1D4ED8")}>
                <FontAwesomeIcon icon={faPhone} style={{ fontSize: 9 }} /> {t("Called")}
              </span>
            )}
            {isUrgent && (
              <span style={C.badge("#FEF2F2", "#991B1B")}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 9 }} /> {t("Urgent")}
              </span>
            )}
            {isVip && (
              <span style={C.badge("#FEF3C7", "#92400E")}>
                <FaStar style={{ fontSize: 8 }} /> {t("VIP")}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={C.pcFooter(isVip)}>
          {/* Action buttons */}
          {isCalled || isViewed ? (
            <>
              {/* In button */}
              <div
                style={C.ib("#3B82F6", "#fff", "#2563EB")}
                title={t("In Patient")}
                // SRS-2026-0057 point 1. Routed through handlePatientSelect so an
                // already-In patient reopens without re-stamping InTime.
                onClick={() => handlePatientSelect(patient, index, listType)}
              >
                <FontAwesomeIcon icon={faRightToBracket} />
              </div>
              {/* UnCall (only if called, not viewed) */}
              {isCalled && !isViewed ? (
                <div
                  style={C.ib("#FEF2F2", "#991B1B", "#FECACA")}
                  title={t("UnCall")}
                  onClick={() => handleCallButtonClick(patient, index, listType)}
                >
                  <FontAwesomeIcon icon={faPhoneSlash} />
                </div>
              ) : (
                <div style={C.spacer} />
              )}
            </>
          ) : (
            <>
              {/* Call button */}
              <div
                style={C.ib("#ECFDF5", "#065F46", "#A7F3D0")}
                title={t("Call Patient")}
                onClick={() => handleCallButtonClick(patient, index, listType)}
              >
                <FontAwesomeIcon icon={faPhone} />
              </div>
              <div style={C.spacer} />
            </>
          )}

          {/* Invite */}
          <div
            style={C.ib("#EFF6FF", "#1D4ED8", "#BFDBFE")}
            title={t("Invite Patient")}
            onClick={() => handleInvitePatient(patient)}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </div>

          {/* Flowsheet shortcut */}
          <div
            style={C.ib("#F0F9FF", "#0369A1", "#BAE6FD")}
            title={t("Flowsheet")}
            onClick={() => { setSelectedPatient(patient); setShowFlowSheet(true); }}
          >
            <FaFileMedical style={{ fontSize: 11 }} />
          </div>

          {/* Medication shortcut */}
          <div
            style={C.ib("#F0FDF4", "#15803D", "#BBF7D0")}
            title={t("Medication")}
            onClick={() => setShowMedicationCalendar(patient)}
          >
            <GiMedicines style={{ fontSize: 12 }} />
          </div>

          {/* Prescription shortcut */}
          <div
            style={C.ib("#FFF7ED", "#C2410C", "#FED7AA")}
            title={t("Prescription")}
            onClick={() => setShowNotesModal(patient)}
          >
            <FaKitMedical style={{ fontSize: 11 }} />
          </div>

          {/* Encounter History */}
          <div
            style={C.ib("#F5F3FF", "#6D28D9", "#DDD6FE")}
            title={t("Encounter History")}
            onClick={() => setEncounterModal(patient.MRNo)}
          >
            <FontAwesomeIcon icon={faClockRotateLeft} style={{ fontSize: 11 }} />
          </div>

          {/* More ⋮ */}
          <div
            style={C.ib("#F8FAFC", "#8892B0", "#E2E6F0")}
            title={t("More")}
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(ddOpen ? null : dropKey);
            }}
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </div>

          {/* Dropdown */}
          {ddOpen && (
            <div style={C.ddWrap} onClick={(e) => e.stopPropagation()}>
              <div
                style={C.ddItem}
                onClick={() => { setRpmModal({ show: true, patient, index, listType }); setOpenDropdownId(null); }}
              >
                <FontAwesomeIcon icon={faHeartPulse} style={C.ddIcon} /> {t("RPM")}
              </div>
              <div
                style={C.ddItem}
                onClick={() => { setSelectedPatient(patient); setShowFlowSheet(true); setOpenDropdownId(null); }}
              >
                <FontAwesomeIcon icon={faFolderOpen} style={C.ddIcon} /> {t("Flowsheet")}
              </div>
              <div
                style={C.ddItem}
                onClick={() => { setShowMedicationCalendar(patient); setOpenDropdownId(null); }}
              >
                <FontAwesomeIcon icon={faPills} style={C.ddIcon} /> {t("Medication")}
              </div>
              <div
                style={C.ddItem}
                onClick={() => { setShowNotesModal(patient); setOpenDropdownId(null); }}
              >
                <FontAwesomeIcon icon={faNotesMedical} style={C.ddIcon} /> {t("Prescription")}
              </div>
              <div
                style={{ ...C.ddItem, borderBottom: "none" }}
                onClick={() => handleCallButtonClick(patient, index, listType)}
              >
                <FontAwesomeIcon icon={faRotate} style={C.ddIcon} /> {isCalled ? t("UnCall") : t("Call")}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Card view section ─────────────────────────────────────────────────────
  const renderCardView = () => {
    const getMergedForTab = () => {
      const p = (list) => list.map((x) => ({ ...x, _listType: "Pending" }));
      const d = (list) => list.map((x) => ({ ...x, _listType: "Done" }));
      switch (activeTab) {
        case "pending": return p(pendingList.filter((x) => !x.IsView || x.IsView === 0));
        case "viewed":  return [
          ...p(pendingList.filter((x) => x.IsView === 1)),
          ...d(doneList),
        ];
        case "called":  return p(pendingList.filter((x) => x.IsCall === 1));
        case "vip":     return [
          ...p(pendingList.filter((x) => x.PatientType === "VIP")),
          ...d(doneList.filter((x) => x.PatientType === "VIP")),
        ];
        default:        return [...p(pendingList), ...d(doneList)];
      }
    };
    const allPatientsMerged = getMergedForTab();

    return (
      <>
        {/* Legend + Status tabs in one row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "6px 16px", borderTop: "0.5px solid #E2E6F0" }}>
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={C.legItem}><div style={C.legDot("#3B82F6")} />{t("Not Called")}</div>
            <div style={C.legItem}><div style={C.legDot("#8B5CF6")} />{t("Called")}</div>
            <div style={C.legItem}><div style={C.legDot("#22C55E")} />{t("Done")}</div>
            <div style={C.legItem}><div style={C.legDot("#F59E0B")} />{t("⭐ VIP")}</div>
            <div style={C.legItem}><div style={C.legDot("#EF4444")} />{t("Urgent")}</div>
          </div>
          {/* Tabs */}
          <div style={C.tabsWrap}>
            {[
              { key: "all",     label: "All Patients" },
              { key: "pending", label: "Pending" },
              { key: "viewed",  label: "Done" },
              { key: "called",  label: "Called" },
              { key: "vip",     label: "⭐ VIP" },
            ].map(({ key, label }) => (
              <button key={key} style={{ ...C.tab(activeTab === key), margin: 0 }} onClick={() => { setActiveTab(key); setCardPage(1); }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Unified patient list */}
        {(() => {
          const totalCards  = allPatientsMerged.length;
          const totalPages  = Math.ceil(totalCards / CARDS_PER_PAGE);
          const startIdx    = (cardPage - 1) * CARDS_PER_PAGE;
          const endIdx      = Math.min(startIdx + CARDS_PER_PAGE, totalCards);
          const pageSlice   = allPatientsMerged.slice(startIdx, endIdx);

          return (
            <>
              {/* Section header + pagination in one row */}
              <div style={{ ...C.sectionHead, justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                {/* Left: title + badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FontAwesomeIcon icon={faClock} style={{ color: "#F59E0B" }} />
                  {t("Appointment Patient List")}
                  <span style={C.sectionBadge("#EFF6FF", "#1D4ED8")}>{totalCards}</span>
                </div>

                {/* Right: showing text + page buttons */}
                {totalCards > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#8892B0", fontWeight: 400, whiteSpace: "nowrap" }}>
                      {t("Showing")} {startIdx + 1}–{endIdx} {t("of")} {totalCards}
                    </span>
                    {totalPages > 1 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          disabled={cardPage === 1}
                          onClick={() => setCardPage((v) => v - 1)}
                          style={{ height: 26, padding: "0 9px", borderRadius: 6, border: "0.5px solid #CBD2E8", background: cardPage === 1 ? "#F8FAFC" : "#fff", color: cardPage === 1 ? "#CBD2E8" : "#4A5578", cursor: cardPage === 1 ? "default" : "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}
                        >
                          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 9 }} /> {t("Prev")}
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                          <button
                            key={pg}
                            onClick={() => setCardPage(pg)}
                            style={{ height: 26, minWidth: 26, borderRadius: 6, border: "0.5px solid", borderColor: pg === cardPage ? "#3B82F6" : "#CBD2E8", background: pg === cardPage ? "#3B82F6" : "#fff", color: pg === cardPage ? "#fff" : "#4A5578", cursor: "pointer", fontSize: 11, fontWeight: pg === cardPage ? 600 : 400 }}
                          >
                            {pg}
                          </button>
                        ))}
                        <button
                          disabled={cardPage === totalPages}
                          onClick={() => setCardPage((v) => v + 1)}
                          style={{ height: 26, padding: "0 9px", borderRadius: 6, border: "0.5px solid #CBD2E8", background: cardPage === totalPages ? "#F8FAFC" : "#fff", color: cardPage === totalPages ? "#CBD2E8" : "#4A5578", cursor: cardPage === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}
                        >
                          {t("Next")} <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card grid */}
              <div style={C.grid}>
                {totalCards === 0 ? (
                  <div style={C.emptyState}>
                    <FontAwesomeIcon icon={faFaceMeh} style={{ fontSize: 36, display: "block", marginBottom: 12, opacity: .3 }} />
                    <p style={{ fontSize: 13, opacity: .6 }}>{t("No patients in this view")}</p>
                  </div>
                ) : (
                  pageSlice.map((p, i) => renderCard(p, startIdx + i, p._listType))
                )}
              </div>
            </>
          );
        })()}
      </>
    );
  };

  // ── List view section ─────────────────────────────────────────────────────
  const renderListView = () => (
    <>
      <div style={{ padding: "10px 16px 4px" }}>
        <div className="card-header">
          <div className="Card_title">{t("Pending Appointment Patient List")}</div>
        </div>
      </div>
      <div className="card patient_registration_card" style={{ margin: "0 16px" }}>
        <PendingAppointmentPatientList
          thead={SearchThead}
          tbody={bodyData.SearchViewConsultaionList}
          handleChange={handleChange}
          handleCallButtonClick={handleCallButtonClick}
          getUpdateInAPI={getUpdateInAPI}
          setShowFlowSheet={setShowFlowSheet}
          setShowMedicationCalendar={setShowMedicationCalendar}
          setShowNotesModal={setShowNotesModal}
          showFlowSheet={showFlowSheet}
          showMedicationCalendar={showMedicationCalendar}
          showNotesModal={showNotesModal}
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
        />
      </div>
      <div style={{ padding: "14px 16px 4px" }}>
        <div className="card-header">
          <div className="Card_title">{t("Done Appointment Patient List")}</div>
        </div>
      </div>
      <div className="card patient_registration_card" style={{ margin: "0 16px 16px" }}>
        <DoneAppointmentDetail
          thead={tHead}
          tbody={bodyData.DoneAppointmentListList}
          handleChange={handleChange}
          handleCallButtonClick={handleCallButtonClick}
          handlePatientSelect={handlePatientSelect}
        />
      </div>
    </>
  );

  const isMobile = window.innerWidth > 1000;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div ref={fullscreenRef} style={{ ...C.wrap, background: "#fff" }}>
      {active ? (
        <>
          {/* ── Top card: toolbar + collapsible filters ── */}
          <div className="card patient_registration">
            {/* Toolbar row */}
            <div style={C.toolbar}>
              <div style={C.toolbarLeft}>
                <span style={C.toolbarTitle}>
                  <FontAwesomeIcon icon={faGaugeHigh} style={{ color: "#3B82F6" }} />
                  {t("OPD / View Consultation")}
                </span>
                <div style={C.liveDot} title={t("Live")} />
              </div>
              <div style={C.toolbarRight}>
                {/* Summary toggle */}
                <button
                  type="button"
                  style={C.filterBtn(showStats)}
                  onClick={() => setShowStats((v) => !v)}
                >
                  {showStats ? t("Hide Summary") : t("Show Summary")}
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  style={{ ...C.filterBtn(false), gap: 5 }}
                  onClick={SearchOPDBillsCallAPI}
                  title={t("Refresh")}
                >
                  <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 11 }} />
                  {t("Refresh")}
                </button>

                {/* Filter toggle */}
                <button
                  type="button"
                  style={C.filterBtn(showFilters)}
                  onClick={() => setShowFilters((v) => !v)}
                >
                  <FontAwesomeIcon icon={faFilter} style={{ fontSize: 11 }} />
                  {showFilters ? t("Hide Filters") : t("Show Filters")}
                </button>

                {/* View toggle */}
                <div style={C.viewToggle}>
                  <button
                    style={C.viewBtn(viewMode === "card")}
                    onClick={() => setViewMode("card")}
                  >
                    <FontAwesomeIcon icon={faTableCellsLarge} style={{ fontSize: 11 }} />
                    {t("Cards")}
                  </button>
                  <button
                    style={C.viewBtn(viewMode === "list")}
                    onClick={() => setViewMode("list")}
                  >
                    <FontAwesomeIcon icon={faList} style={{ fontSize: 11 }} />
                    {t("List")}
                  </button>
                </div>

                {/* Fullscreen toggle */}
                <button
                  type="button"
                  style={C.filterBtn(isFullscreen)}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} style={{ fontSize: 11 }} />
                  {isFullscreen ? t("Exit") : t("Full Screen")}
                </button>
              </div>
            </div>

            {/* Collapsible filter form */}
            {showFilters && (
              <form style={C.filterPanel}>
                <div className="row pt-2">
                  <Input
                    type="text" className="form-control" id="mrNo" name="mrNo"
                    onChange={handleChange} value={values?.mrNo}
                    lable={t("UHID")} placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  />
                  <Input
                    type="text" className="form-control" id="pName" name="pName"
                    onChange={handleChange} value={values?.pName}
                    lable={t("PatientName")} placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  />
                  <Input
                    type="text" className="form-control" id="appNo" name="appNo"
                    onChange={handleChange} value={values?.appNo}
                    lable={t("App. No.")} placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Specialization")} id="docDepartment"
                    searchable={true} name="docDepartment"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={[
                      ViewConsultationPayload?.docDepartment,
                      ...GetDepartmentList.map((item) => ({ label: item?.Name, value: item?.ID })),
                    ]}
                    value={values?.docDepartment?.value}
                    handleChange={handleReactSelectChange}
                  />
                  <ReactSelect
                    placeholderName={t("Doctor")} searchableDoctorID={true}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    id="doctorID" name="doctorID"
                    dynamicOptions={[
                      ViewConsultationPayload?.doctorID,
                      ...GetBindAllDoctorConfirmationData.map((item) => ({ label: item?.Name, value: item?.DoctorID })),
                    ]}
                    value={values?.doctorID?.value}
                    handleChange={handleReactSelect}
                  />
                  <ReactSelect
                    placeholderName={t("STATUS")} id="status" name="status"
                    searchable={true} dynamicOptions={translateOptions(VIEWSTATUS, t)}
                    value={values?.status ? values.status : parseInt(values?.status?.value)}
                    handleChange={handleReactSelect}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  />
                  <div className="col-xl-2 col-md-4 col-sm-4 col-12 mt-1">
                    <div className="form-group">
                      <DatePicker
                        className="custom-calendar" id="fromDate" name="fromDate"
                        lable={t("FromDate")} placeholder={VITE_DATE_FORMAT}
                        handleChange={handleChange}
                        value={values.fromDate ? moment(values.fromDate, "DD-MMM-YYYY").toDate() : values.fromDate}
                      />
                    </div>
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-4 col-12 mt-1">
                    <div className="form-group">
                      <DatePicker
                        className="custom-calendar" id="toDate" name="toDate"
                        lable={t("ToDate")} placeholder={VITE_DATE_FORMAT}
                        handleChange={handleChange}
                        value={values.toDate ? moment(values.toDate, "DD-MMM-YYYY").toDate() : values.toDate}
                      />
                    </div>
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-4 col-12 mt-1" style={{ display: "flex", alignItems: "center", paddingTop: 18 }}>
                    <button className="btn btn-sm btn-success" type="button" onClick={handleSubmit} style={{ height: 38 }}>
                      {t("Search")}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ── Stats + Legend + Content card ── */}
          <div className="card patient_registration border" style={{ marginTop: 8 }}>
            {/* Stats row */}
            {showStats && <div style={C.statsRow}>
              <div style={C.statCard}>
                <div style={C.statIcon("#DBEAFE")}>
                  <FontAwesomeIcon icon={faUsers} style={{ fontSize: 14, color: "#1D4ED8" }} />
                </div>
                <div>
                  <div style={C.statNum}>{totalCount}</div>
                  <div style={C.statLbl}>{t("Total")}</div>
                </div>
              </div>
              <div style={C.statCard}>
                <div style={C.statIcon("#FEF3C7")}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: 14, color: "#92400E" }} />
                </div>
                <div>
                  <div style={C.statNum}>{pendingCount}</div>
                  <div style={C.statLbl}>{t("Pending")}</div>
                </div>
              </div>
              <div style={C.statCard}>
                <div style={C.statIcon("#D1FAE5")}>
                  <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 14, color: "#065F46" }} />
                </div>
                <div>
                  <div style={C.statNum}>{viewedCount}</div>
                  <div style={C.statLbl}>{t("Viewed")}</div>
                </div>
              </div>
              <div style={C.statCard}>
                <div style={C.statIcon("#EDE9FE")}>
                  <FontAwesomeIcon icon={faPhone} style={{ fontSize: 14, color: "#5B21B6" }} />
                </div>
                <div>
                  <div style={C.statNum}>{calledCount}</div>
                  <div style={C.statLbl}>{t("Called")}</div>
                </div>
              </div>
              <div style={C.statCard}>
                <div style={C.statIcon("#FEF9C3")}>
                  <FaStar style={{ fontSize: 14, color: "#D97706" }} />
                </div>
                <div>
                  <div style={C.statNum}>{vipCount}</div>
                  <div style={C.statLbl}>{t("VIP")}</div>
                </div>
              </div>
            </div>}

            {/* Card or List view */}
            {viewMode === "card" ? renderCardView() : renderListView()}
          </div>
        </>
      ) : (
        <AppointmentPatientDetail
          setActive={setActive}
          isDesktop={isMobile}
          selectedIndex={selectedIndex.index}
          calledPatient={calledPatient}
          getUpdateInAPI={getUpdateInAPI}
          handleSearchPrescribeMedicine={(docID) =>
            SearchPrescribeMedicine(docID).then((r) => r?.data)
          }
          TotaltableData={
            selectedIndex.listType === "Pending"
              ? bodyData.SearchViewConsultaionList
              : bodyData.DoneAppointmentListList
          }
          handleCallButtonClick={handleCallButtonClick}
          SearchOPDBillsCallAPI={SearchOPDBillsCallAPI}
          getDoctorID={getDoctorID}
          items={items}
          setItems={setItems}
          fetchAllApiData={fetchAllApiData}
          checkGetDoctorIDForTransationID={checkGetDoctorIDForTransationID}
          getUser={getUser}
          docterError={docterError}
          getCall={getCall}
          docID={docID}
          getUpdateCallAPI={getUpdateCallAPI}
          getUpdateUncall={getUpdateUncall}
          setMedicalInfoData={setMedicalInfoData}
          medicalData={medicalData}
          setShowFlowSheet={setShowFlowSheet}
          setShowMedicationCalendar={setShowMedicationCalendar}
          setShowNotesModal={setShowNotesModal}
          showFlowSheet={showFlowSheet}
          showMedicationCalendar={showMedicationCalendar}
          showNotesModal={showNotesModal}
        />
      )}

      {/* ── Modals ── */}
      {showFlowSheet && (
        <Modal
          visible={showFlowSheet} setVisible={setShowFlowSheet}
          Header={t("Flow Sheet")} modalWidth="90vw" footer={<></>}
        >
          <FlowsheetModel
            data={selectedPatient}
            setShowMedicationCalendar={setShowMedicationCalendar}
            setShowNotesModal={setShowNotesModal}
            setShowFlowSheet={setShowFlowSheet}
          />
        </Modal>
      )}

      {showMedicationCalendar && (
        <Modal
          visible={showMedicationCalendar} setVisible={setShowMedicationCalendar}
          Header={t("Medication Calendar")} modalWidth="97vw" footer={<></>}
        >
          <MedicationCalendar
            data={showMedicationCalendar}
            setShowFlowSheet={setShowFlowSheet}
            setShowNotesModal={setShowNotesModal}
            setShowMedicationCalendar={setShowMedicationCalendar}
          />
        </Modal>
      )}

      {showNotesModal && (
        <Modal
          visible={showNotesModal} setVisible={setShowNotesModal}
          Header={t("Prescription Calendar")} modalWidth="97vw" footer={<></>}
        >
          <PatientSummaryCalendar
            data={showNotesModal}
            getUpdateInAPI={getUpdateInAPI}
            setShowFlowSheet={setShowFlowSheet}
            setShowNotesModal={setShowNotesModal}
            setShowMedicationCalendar={setShowMedicationCalendar}
          />
        </Modal>
      )}

      {inviteModal.show && (
        <Modal
          visible={inviteModal.show}
          setVisible={() => setInviteModal({ show: false, patient: null })}
          modalWidth="60vw"
          Header={t("Schedule Meeting with Patient")}
          buttonName={t("Proceed")}
          handleAPI={handleSendInvite}
        >
          <div className="row">
            <Input
              lable={t("Recipient Emails")} type="text" className="form-control"
              placeholder=" " onChange={handleInviteChange}
              name="AttendeesEmails" value={inviteValues.AttendeesEmails}
              respclass="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
            />
            <Input
              lable={t("Subject")} type="text" className="form-control"
              placeholder=" " onChange={handleInviteChange}
              name="Subject" value={inviteValues.Subject}
              respclass="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
            />
            <TextAreaInput
              name="Description" value={inviteValues.Description}
              respclass="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
              lable={t("Description")} onChange={handleInviteChange}
            />
            <div className="row px-4">
              <Checkbox
                name="IsLinkSendBySMS" inputId="IsLinkSendBySMS"
                checked={inviteValues.IsLinkSendBySMS}
                onChange={() => setInviteValues((v) => ({ ...v, IsLinkSendBySMS: !v.IsLinkSendBySMS }))}
              />
              <label htmlFor="IsLinkSendBySMS">{t("Send Invite link via SMS")}</label>
              <Input
                lable={t("Mobile No.")} type="number" className="form-control"
                placeholder=" " onChange={handleInviteChange}
                name="MobileNo" value={inviteValues.MobileNo}
                respclass="col-xl-5 col-lg-5 col-md-5 col-sm-6 col-6"
              />
            </div>
          </div>
        </Modal>
      )}

      {encounterModal && (
        <OverLay
          visible={!!encounterModal}
          setVisible={() => setEncounterModal(null)}
          Header={`Encounter History — ${encounterModal}`}
          modalWidth="97vw"
        >
          <PatientEncounterHistory patientId={encounterModal} />
        </OverLay>
      )}

      {rpmModal.show && (
        <OverLay
          visible={rpmModal.show}
          setVisible={() => setRpmModal({ show: false, patient: null, index: null, listType: null })}
          Header={t("Giloys RPM")}
          modalWidth="96vw"
        >
          <RPM
            patientDetail={{
              currentPatient: rpmModal.patient,
              TotaltableData:
                rpmModal.listType === "Pending"
                  ? bodyData.SearchViewConsultaionList
                  : bodyData.DoneAppointmentListList,
              index: rpmModal.index,
            }}
            isPopup={true}
          />
        </OverLay>
      )}
    </div>
  );
};

export default ViewConsultationCardView;
