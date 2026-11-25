import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  bindHashCode,
  bindPanelByPatientID,
  BindPRO,
  CheckblacklistAPI,
  GetBindDoctorDept,
  GetLastVisitDetail,
  GetOPDSources,
  LastVisitDetails,
  PatientSearchbyBarcode,
} from "../../../networkServices/opdserviceAPI";
import { BindCorporatePanelList, BindGetRMODoctor, BindUserTypeSuperVisor } from "../../../networkServices/EDP/edpApi";
import { useDemographicEditAuth } from "../../../utils/hooks/useDemographicEditAuth";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import DatePicker from "../../../components/formComponent/DatePicker";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import TimePicker from "../../../components/formComponent/TimePicker";
import Input from "../../../components/formComponent/Input";
import {
  AdmissionType,
  BasicMasterBindPro,
  BasicMasterSavePro,
  BillingCategory,
  BillingIPDBindTPA,
  BillingIPDSaveReferDoctor,
  BindRoomBed,
  CommonAPIBindMLCtype,
  CommonReceiptPdf,
  GetPatientAdmissionDetails,
  IPDAdmissionMultipleReport,
  IPDAdmissionReport,
  IPDPrintSticker,
  MISBedManagementSummary,
  RoomType,
  SaveIPDAdmission,
  UpdatePatientAdmissionDetails,
} from "../../../networkServices/BillingsApi";
import {
  filterByType,
  filterByTypes,
  handleReactSelectDropDownOptions,
  handlereferDocotorIDByReferalType,
  handleSaveIPDAdmissionPayload,
  handleUpdateIPDAdmissionPayload,
  inputBoxValidation,
  notify,
  parseTimeString,
  ReactSelectisDefaultValue,
} from "../../../utils/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  BindSeeMoreList,
  CentreWiseCacheByCenterID,
  GetBindDepartment,
  GetBindReferalType,
  GetBindReferDoctor,
} from "../../../store/reducers/common/CommonExportFunction";
import SeeMore from "../../../components/UI/SeeMore";
import SeeMoreList from "../../../components/commonComponents/SeeMoreList";
import PatientEncounterHistory from "../../frontOffice/OPD/PatientEncounterHistory";
import {
  MapGeneric_OPTION,
  MOBILE_NUMBER_VALIDATION_REGX,
  ReferedSourceConst,
} from "../../../utils/constant";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { useLocation } from "react-router-dom";
import { RedirectURL } from "../../../networkServices/PDFURL";
import moment from "moment";
import Tables from "../../../components/UI/customTable";
import { Checkbox } from "primereact/checkbox";
import Modal from "../../../components/modalComponent/Modal";
import ReferDoctorModal from "./ReferDoctorModal";
import ReserveBedModal from "../../../components/IPD/ReserveBedModal";
import BedReservationsModal from "../../../components/IPD/BedReservationsModal";
import { GetBedReservations } from "../../../networkServices/DoctorApi";
import {
  isOwnReservation,
  normaliseReservation,
  readApiResult as readReservationResult,
  reservationFor,
  toIsoDate as reservationIsoDate,
} from "../../../components/IPD/bedReservation";
import DynamicForm from "../../../components/formComponent/DynamicForm";
import LabelInputBox from "../../../components/formComponent/LabelInputCheckbox";
import { BindAllPanel, CurrentStockGeneralConsertForm } from "../../../networkServices/CollectionReportApi";
import { AssetBasicMasterSavePro } from "../../../networkServices/EDP/govindedp";
import { translateOptions } from "@components/WrapTranslate";
import { MRDBindParentPanel } from "../../../networkServices/MRDApi";
import PatientPhotoZoom from "../../../components/commonComponents/PatientPhotoZoom";

// The bed list comes from sp_ipd_bindRoomBed, and the API returns each column name exactly as the
// procedure spells it. This database's procedure returns "RoomId" (the IVF admission screen already
// reads that), while this screen only read "RoomID" - so bed.RoomID was undefined: every bed looked
// "Selected", RoomBed became undefined, and the save sent pip.roomID as "" (API: "Error converting
// value {null} to type System.Int32. Path 'pip.roomID'"). Read whichever spelling the procedure sent.
const getBedRoomId = (bed) =>
  bed?.RoomID ?? bed?.RoomId ?? bed?.roomID ?? bed?.roomId;

const DetailCard = ({
  SearchPatient,
  singlePatientData,
  data,
  ModalComponent,
  setVisible,
  sendReset,
  bindDetailAPI,
  getOldPatientData,
}) => {
  debugger
  const [t] = useTranslation();
  const { handleAuthorizedDemographicEdit } = useDemographicEditAuth();
  const dispatch = useDispatch();
  let ip = useLocalStorage("ip", "get");
  const location = useLocation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  let dates = [];
  if (singlePatientData?.PreviousAdmissionDate) {
    let parsed = [];
    if (Array.isArray(singlePatientData.PreviousAdmissionDate)) {
      parsed = singlePatientData.PreviousAdmissionDate;
    } else {
      try {
        parsed = JSON.parse(singlePatientData.PreviousAdmissionDate);
      } catch (e) {
        parsed = [singlePatientData.PreviousAdmissionDate];
      }
    }
    const seen = new Set();
    dates = parsed
      .filter((item) => {
        if (typeof item === "string") return true;
        const key = `${item?.AdmissionDate}_${item?.DischargeDateTime}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 2);
  }

  const {
    CentreWiseCache,
    CentreWisePanelControlCacheList,
    PageConfigurationAPIList,
    BindResource,
    BindSeeMoreListData,
    GetGlobalResources,
  } = useSelector((state) => state.CommonSlice);

  // fin_global_resources -> IsGeneralConsentPrintHide
  // IsActive = 1 aur Value = 1 ho to Save par GENERAL CONSENT FOR ADMISSION ka
  // print out nahi nikalega. Default (row na ho / IsActive = 0) me pehle jaisa hi dono print nikalte hain.
  const isGeneralConsentPrintHide =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "IsGeneralConsentPrintHide",
      )?.Value ?? "",
    ).trim() === "1";
  // fin_global_resources -> ShowParentPanelOnIPDAdmission = 1: a "Parent Panel" dropdown
  // beside Panel. It starts on the selected panel's own parent and can be changed; the
  // choice rides on panelID.ParentPanelID / ParentPanel, which the save payload sends.
  const showParentPanelSelect =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "ShowParentPanelOnIPDAdmission",
      )?.Value ?? "",
    ).trim() === "1";
  // fin_global_resources -> IPDAdmissionBedDropdown = 1: the bed of the Room Type is picked from a
  // "Bed No." dropdown instead of the bed cards. Same bed list, only free beds can be picked; the
  // stats, legend and Selected Bed panel stay. Key 0 / missing = the bed cards as before.
  const isBedDropdown =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "IPDAdmissionBedDropdown",
      )?.Value ?? "",
    ).trim() === "1";
  const isAadhaarMandatory =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "IsAadhaarMandatoryOnIPDAdmission",
      )?.Value ?? "",
    ).trim() === "1";
  const showMlcIdentification =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "ShowMlcIdentification",
      )?.Value ?? "",
    ).trim() === "1";
  const showExtraFields =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "ShowIPDExtraAdmissionFields",
      )?.Value ?? "",
    ).trim() === "1";
  // fin_global_resources -> IPDBlockOccupiedBedSelection = 1 (default): occupied beds
  // in the Bed/Ward grid are non-clickable (dimmed, cursor not-allowed).
  // Set to 0 to allow selecting any bed regardless of occupancy status.
  const blockOccupiedBedSelection = !Array.isArray(GetGlobalResources) ||
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "IPDBlockOccupiedBedSelection",
      )?.Value ?? "1",
    ).trim() !== "0";
  // fin_global_resources -> IPDAdmissionBedPopup = 1: Bed/Ward grid opens in a modal
  // popup instead of rendering inline. The inline card shows only the stats and
  // selected-bed summary; a "Select Bed" button opens the full grid in the modal.
  const bedInPopup =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "IPDAdmissionBedPopup",
      )?.Value ?? "",
    ).trim() === "1";
  const [parentPanelOptions, setParentPanelOptions] = useState([]);
  useEffect(() => {
    if (!showParentPanelSelect) return;
    (async () => {
      const res = await MRDBindParentPanel();
      const rows = res?.success && Array.isArray(res?.data) ? res.data : [];
      setParentPanelOptions(
        rows.map((row) => ({
          label: row?.Company_Name,
          value: Number(row?.PanelID),
        })),
      );
    })();
  }, [showParentPanelSelect]);
  const handleParentPanelChange = (name, e) => {
    setPayloadData((prev) => ({
      ...prev,
      panelID: prev?.panelID
        ? {
            ...prev.panelID,
            ParentPanelID: e?.value ?? 0,
            ParentPanel: e?.label ?? "",
          }
        : prev?.panelID,
    }));
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [handleModelData, setHandleModelData] = useState({});
  const [modalData, setModalData] = useState({});
  const [bedSearch, setBedSearch] = useState("");
  // True only while beds for the chosen room type are being fetched, so the
  // "no bed in this ward" message is never shown against a not-yet-loaded list.
  const [bedLoading, setBedLoading] = useState(false);
  // Set when the bed API itself failed — an empty grid then means "could not
  // load", not "this ward has no bed", and must not be reported as the latter.
  const [bedLoadFailed, setBedLoadFailed] = useState(false);
  // Hospital-wide bed summary (same source as the Bed Management page) for the
  // stat cards — independent of the room-type-filtered grid below.
  const [bedSummary, setBedSummary] = useState({});
  /* Bed reservations for the chosen room type, from today on. Overlaid on the
     bed grid as a SOFT mark: a reserved bed stays selectable, the card and the
     Selected Bed panel say who holds it, and the user decides. Fetched once per
     room type, and again after a reservation is made or cancelled. */
  const [bedReservations, setBedReservations] = useState([]);
  const [showReserveBed, setShowReserveBed] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [showBedPopup, setShowBedPopup] = useState(false);
  const loadBedReservations = useCallback(async (caseTypeID) => {
    if (!caseTypeID) {
      setBedReservations([]);
      return;
    }
    try {
      const { ok, rows } = readReservationResult(
        await GetBedReservations({ ipdCaseTypeID: caseTypeID }),
      );
      setBedReservations(ok ? rows.map(normaliseReservation) : []);
    } catch (e) {
      setBedReservations([]);
    }
  }, []);

  const [referedSourceOptions, setReferedSourceOptions] = useState(
    ReferedSourceConst.map((o) => ({ label: o.label, value: o.value }))
  );
  useEffect(() => {
    GetOPDSources().then((res) => {
      if (res?.status && Array.isArray(res?.data) && res.data.length > 0) {
        setReferedSourceOptions(res.data.map((r) => ({ label: r.label, value: r.label })));
      }
    });
  }, []);

  const [relation, setRelation] = useState({
    RelationOf: "",
    IsPersonal: 1,
    RelationName: "",
    RelationPhone: "",
  });

  const [relationsOnEdit, setRelationsOnEdit] = useState([]);
  const relationCheckList = singlePatientData?.PatientRelationData?.filter(
    (rel) => rel?.IsPersonal === 1,
  );
  const [selectedRelations, setSelectedRelations] = useState(
    !data ? relationCheckList : [],
  );
  const relationsData = data ? relationsOnEdit : relationCheckList;
  const initialState = {
    panelID: "",
    TPA: "",
    MLC: "",
    mlcIdentification1: "",
    mlcIdentification2: "",
    admittedBy: "",
    referalTypeID: { label: "Self", value: 4 },
    referDoctorID: "",
    proId: "",
    DepartmentID: "ALL",
    DoctorID: [],
    ConsultingDoctor: "",
    dateOfVisit: new Date(),
    time: new Date(),
    admissionType: "",
    IPDCaseTypeID: "",
    RoomBed: "",
    BillingCategory: "",
    ReferedSource: "",
    requestedRoomType: "",
    entitlement: "",
    IssuedVisitorCardNo: "",
    admissionReason: "",
    treatment: "",
    ECHS: "",
    diagnosis: "",
    RoomName: "",
    IPDCaseTypeName: "",
    AttendeesName: "",
    AttendeesMobile: "",
    AttendeesAddress: "",
    PoliceStation: "",
    AmbulanceNo: "",
    DriverName: "",
    DriverPhone: "",
    IsVulnerable: 0,
    PrimaryTreatment: "",
    IPDRemarks: "",
    VisitorCardQty: 1,
    CorporatePanelID: "0",
    CorporatePanelName: "",
    RMODoctorID: "",
    RMODoctor: "",
    SuperVisorID: "",
    SuperVisor: "",

  };
  const [payloadData, setPayloadData] = useState({ ...initialState });
  console.log("payloadData", payloadData)
  const [errors, setErrors] = useState({});
  // Idempotency key to stop the same admission being saved multiple times (repeat
  // submits / slow-network retries). Sent to the API as pmh.UniqueHash and stored in
  // patient_medical_history.UniqueHash for server-side dedupe. Refreshed whenever a
  // new patient is loaded so each admission gets its own key.
  const [uniqueHash, setUniqueHash] = useState("");
  const generateUniqueHash = async () => {
    const hashcode = await bindHashCode();
    setUniqueHash(hashcode?.data ?? "");
  };
  useEffect(() => {
    generateUniqueHash();
  }, [singlePatientData?.PatientID]);
  const { GetBindReferDoctorList, GetReferTypeList, GetDepartmentList } =
    useSelector((state) => state?.CommonSlice);
  const [updataDataList, setUpdataDataList] = useState([]);
  const [DropDownState, setDropDownState] = useState({
    getBindPanelByPatientID: [],
    getBindProList: [],
    getDoctorDeptWise: [],
    doctorMulti: [],
    getRoomType: [],
    getBillingCategory: [],
    getBindRoomBed: [],
    getAdmissionType: [],
    getBindCorporatePanelList: [],
    SuperVisorList: [],
    RMODoctorList: [],
    mLCTypeList: [],

  });

  const handleChangRelation = (name, selectedOption) => {
    if (selectedOption) {
      setRelation({ ...relation, RelationOf: selectedOption.value });
    } else {
      setRelation({ ...relation, RelationOf: "" });
    }
  };

  const handleAddRelation = () => {
    if (relation.RelationOf && relation.RelationName) {
      const updatedList = [
        ...selectedRelations,
        { ...relation, IsPersonal: 1 },
      ];
      setSelectedRelations(updatedList);
      setRelationsOnEdit(updatedList);
      setRelation({ Relation: "", RelationName: "", RelationPhone: "" });
    }
  };

  const handleDeleteRelation = (index) => {
    const updatedRelations = relationsOnEdit.filter((_, i) => i !== index);
    setRelationsOnEdit(updatedRelations);
    setSelectedRelations(updatedRelations);
  };

  const multipleRepots = async (transactionID) => {
    try {
      const payload = { transactionID: transactionID };
      const response = await IPDAdmissionMultipleReport(payload);
      if (response?.success) {
        Object.keys(response.data).forEach((key) => {
          const url = response.data[key];
          RedirectURL(url);
        });
      }
    } catch (error) {
      console.error("Error in multipleReports:", error);
    }
  };

  const ErrorHandling = () => {
    let errors = {};
    if (payloadData?.panelID == "" || !payloadData?.panelID) {
      errors.panelID = "Scheme Is Required";
    }
    if (payloadData?.referalTypeID == "") {
      errors.referalTypeID = "referalTypeID Is Required";
    }
    if (payloadData?.referalTypeID == "") {
      errors.referalTypeID = "referalTypeID Is Required";
    }
    if (!payloadData?.DoctorID?.length > 0) {
      errors.DoctorID = "Doctor field Is Required";
    }
    if (!payloadData?.dateOfVisit) {
      errors.dateOfVisit = "Date of Visit Is Required";
    }
    if (payloadData?.admissionType == "") {
      errors.admissionType = "admissionType Is Required";
    }
    if (payloadData?.IPDCaseTypeID == "") {
      errors.IPDCaseTypeID = "Room Type Is Required";
    }
    // `== ""` alone let undefined / null through, and the save then went out with pip.roomID = ""
    // (API: Error converting value {null} to type System.Int32). Stop it here instead.
    if (payloadData?.RoomBed == "" || payloadData?.RoomBed == null) {
      errors.RoomBed = "Room/Bed Is Required";
    }
    if (payloadData?.BillingCategory == "") {
      errors.BillingCategory = "Billing Category Is Required";
    }
    // MLC = Yes: the MLC No. has to be filled.
    if (String(payloadData?.MLC) === "1" && !String(payloadData?.mlcNo ?? "").trim()) {
      errors.mlcNo = "MLC No. Is Required";
    }
    // Admission Remark is optional now (was mandatory).
    return errors;
  };

  const handleBindPanelByPatientID = async (PatientID) => {
    const item = PatientID ? PatientID : data?.patientID;
    try {
      const res = await bindPanelByPatientID(item);
      if (res?.data?.length > 0) return res.data;
      // Fallback: patient has no assigned panel — load all active panels
      const allRes = await BindAllPanel();
      return (allRes?.data || []).map((p) => ({ ...p, PanelName: p.Company_Name }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleDoctorDeptWise = async (Department) => {
    try {
      const data = await GetBindDoctorDept(Department);
      return data?.data;
    } catch (error) {
      console.log(error);
    }
  };

  const getBindAdmissionType = async () => {
    try {
      const data = await AdmissionType();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getProNameList = async () => {
    try {
      const response = await BasicMasterBindPro();
      if (response?.success) {
        return response?.data;
      }
    } catch (error) {
      console.error("Error fetching Pro Name List:", error);
    }
  };

  const getBindRoomType = async () => {
    try {
      const data = await RoomType();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getBindRoom = async (params) => {
    const newPayload = {
      caseType: params.caseType,
      isDisIntimated: 0,
      /* 0, not 1: type 1 makes sp_ipd_bindRoomBed DROP every bed with an advance
         booking on the date, which would hide a reserved bed instead of marking
         it. Type 0 applies the same clean/active/room-type filters without that
         exclusion; the reservation overlay does the marking. */
      type: "0",
      bookingDate: singlePatientData?.DateEnrolled
        ? singlePatientData?.DateEnrolled
        : params?.bookingDate,
    };

    if (!data) {
      newPayload.TransactionID = 0;
    } else {
      newPayload.TransactionID = Number(
        data?.transactionID ? data?.transactionID : 0,
      );
    }
    try {
      const dataRes = await BindRoomBed(newPayload);
      if (dataRes?.success) {
        /* sp_ipd_bindRoomBed's two branches alias the same columns differently:
           type 1 gives RoomID / Name, type 0 (which this screen sends) gives
           RoomId / NAME. The grid reads RoomID and Name, so both spellings are
           folded to those here rather than taught to every reader. */
        return (Array.isArray(dataRes?.data) ? dataRes.data : []).map((b) => ({
          ...b,
          RoomID: b?.RoomID ?? b?.RoomId ?? b?.roomId ?? b?.roomID,
          Name: b?.Name ?? b?.NAME ?? b?.name,
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getBindBillingCategory = async () => {
    try {
      const data = await BillingCategory();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const commonFetchAllDropDown = async () => {

    try {
      const response = await Promise.all([
        handleBindPanelByPatientID(singlePatientData?.PatientID),
        handleDoctorDeptWise(payloadData?.DepartmentID),
        getBindAdmissionType(),
        getBindRoomType(),
        getBindBillingCategory(),
        getProNameList(),
        BindCorporatePanelList(),
        BindGetRMODoctor(),
        BindUserTypeSuperVisor(),
        CommonAPIBindMLCtype(),
        BillingIPDBindTPA(),
      ]);

      const responseDropdown = {
        getBindPanelByPatientID: handleReactSelectDropDownOptions(
          response[0],
          "PanelName",
          "PanelID",
        ),
        getDoctorDeptWise: handleReactSelectDropDownOptions(
          response[1],
          "Name",
          "DoctorID",
        ),
        getAdmissionType: handleReactSelectDropDownOptions(
          response[2],
          "ADMISSIONTYPE",
          "ID",
        ),
        getRoomType: handleReactSelectDropDownOptions(
          response[3],
          "Name",
          "IPDCaseTypeID",
        ),
        getBillingCategory: handleReactSelectDropDownOptions(
          response[4],
          "Name",
          "IPDCaseTypeID",
        ),
        getBindProList: handleReactSelectDropDownOptions(
          response[5],
          "ProName",
          "Pro_ID",
        ),
        getBindCorporatePanelList: handleReactSelectDropDownOptions(
          response[6]?.data,
          "Company_Name",
          "PanelID",
        ),
        RMODoctorList: handleReactSelectDropDownOptions(
          response[7]?.data,
          "Name",
          "DoctorID",
        ),
        SuperVisorList: handleReactSelectDropDownOptions(
          response[8]?.data,
          "Name",
          "EmployeeID",
        ),
        mLCTypeList: handleReactSelectDropDownOptions(
          response[9]?.data,
          "mlctype",
          "ID",
        ),
        getBindTPA: handleReactSelectDropDownOptions(
          response[10]?.data,
          "TextField",
          "ValueField",
        ),
      };

      return responseDropdown;
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };


  const FetchAllDropDown = async () => {
    try {
      const responseDropdown = await commonFetchAllDropDown();
      setDropDownState(responseDropdown);

      setPayloadData({
        ...payloadData,
        panelID: ReactSelectisDefaultValue(
          responseDropdown?.getBindPanelByPatientID,
          "isDefaultPanel",
        ),
        CorporatePanelID: {
          label:
            responseDropdown?.getBindPanelByPatientID[0]?.CorporareName,
          value: responseDropdown?.getBindPanelByPatientID[0]?.PanelCroporateID
        }
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDataInDetailView = useMemo(() => {
    if (Object.keys(singlePatientData)?.length > 0 && !data) {
      const data = [
        {
          label: t("PatientID"),
          value: `${singlePatientData?.PatientID}`,
        },
        {
          label: t("PatientName"),
          value: `${singlePatientData?.Title} ${singlePatientData?.PName}`,
        },
        {
          label: t("GenderAge"),
          value: `${singlePatientData?.Gender} / ${singlePatientData?.Age}`,
        },
        {
          label: t("ContactNo"),
          value: singlePatientData?.Mobile,
        },
        {
          label: t("Address"),
          value: singlePatientData.House_No,
        },
        {
          label: t("Outstanding"),
          value: singlePatientData?.Outstanding ?? "0.00",
        },
      ];

      return data;
    } else {
      return [];
    }
  }, [singlePatientData, data]);

  const handlePanelReactSelectChange = (name, e) => {
    const data = DropDownState?.getBindPanelByPatientID.find(
      (ele) => Number(ele?.value) === Number(e?.value),
    );

    // Auto-fill Insurance from the panel's ParentPanel name
    const parentName = data?.ParentPanel || data?.parentPanel || "";
    const autoTPA = parentName
      ? { label: parentName, value: parentName }
      : "";

    setPayloadData({
      ...payloadData,
      [name]: data,
      TPA: autoTPA,
    });
  };

  const handleCorporatePanelChange = (name, e) => {
    const data = DropDownState?.getBindCorporatePanelList.find(
      (ele) => Number(ele?.value) === Number(e?.value),
    );

    setPayloadData({
      ...payloadData,
      [name]: data,
      CorporatePanelName: data?.label || "",
    });
  };
  const handleSuperVisorChange = (name, e) => {

    const data = DropDownState?.SuperVisorList.find(
      (ele) => (ele?.value) === (e?.value),
    );

    setPayloadData({
      ...payloadData,
      [name]: data,
      SuperVisor: data?.label || "",
    });
  };
  const handleRMODoctorChange = (name, e) => {
    const data = DropDownState?.RMODoctorList.find(
      (ele) => Number(ele?.value) === Number(e?.value),
    );

    setPayloadData({
      ...payloadData,
      [name]: data,
      RMODoctor: data?.label || "",
    });
  };
  const handleMultiSelectDropDown = (state) => {
    return state?.map((items, _) => {
      return {
        name: items?.Name,
        code: items?.DoctorID,
      };
    });
  };

  const handleReactSelectChange = async (name, e) => {
    switch (name) {
      case "referDoctorID":
        setPayloadData({
          ...payloadData,
          [name]: e?.value,
          referDoctorName: e?.label,
        });
        break;
      case "DepartmentID":
        const data = await handleDoctorDeptWise(e?.label);
        setDropDownState({
          ...DropDownState,
          getDoctorDeptWise: handleMultiSelectDropDown(data),
        });
        setPayloadData({
          ...payloadData,
          [name]: e?.value,
        });
        break;
      case "referalTypeID":
        setPayloadData({
          ...payloadData,
          [name]: e,
          // Consulting Doctor is a multi-select, so payloadData.DoctorID is an array of
          // {code, name}. Handing that array over made referDoctorID an array the picker
          // could not resolve, which is why Refer Doctor went blank on every type change.
          referDoctorID: handlereferDocotorIDByReferalType(
            e?.value,
            payloadData?.DoctorID?.[0]?.code ?? "",
            "",
          ),
        });
        break;

      default:
        setPayloadData({
          ...payloadData,
          [name]: e?.value,
          [`${name}_label`]: e?.label,
        });
        break;
    }
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    setPayloadData({
      ...payloadData,
      [name]: selectedOptions,
    });
  };

  const handleChange = (e) => {
    const { value, name } = e.target;
    setPayloadData({
      ...payloadData,
      [name]: value,
    });
  };

  const handleReactSelect = async (name, value, secondName) => {
    const obj = { ...payloadData };
    obj[name] = value?.value || "";
    obj[`${name}_label`] = value?.label;

    if (secondName) {
      obj[secondName] = value?.BillingCategoryID || "";
      obj[`${secondName}_label`] = value?.label;
    }
    setPayloadData(obj);
    if (name === "IPDCaseTypeID") {
      // Always send a valid bookingDate so beds load even when the patient record
      // has no DateEnrolled (fresh search) — getBindRoom uses DateEnrolled first,
      // then falls back to this date.
      setBedLoading(true);
      setBedLoadFailed(false);
      let response;
      try {
        response = await getBindRoom({
          caseType: value.value,
          bookingDate: moment(payloadData?.dateOfVisit || new Date()).format(
            "YYYY-MM-DD",
          ),
        });
      } finally {
        setBedLoading(false);
      }
      // getBindRoom returns undefined only when the call itself threw.
      const bedLoadOk = Array.isArray(response);
      setBedLoadFailed(!bedLoadOk);
      response = bedLoadOk ? response : [];
      setDropDownState((prevState) => ({
        ...prevState,
        getBindRoomBed: response,
      }));
      // Auto-select the first AVAILABLE bed for the chosen room type (new admission).
      const firstAvailable = (response || []).find(
        (b) => getBedState(b) === "available",
      );
      // Tell the user WHY the bed grid is empty instead of leaving the generic
      // "select a room type" placeholder standing: no bed defined in the ward at
      // all, vs. beds defined but every one of them already taken.
      if (value?.value && bedLoadOk) {
        if (response.length === 0) {
          notify(t("There is no bed in this ward"), "warn");
        } else if (!firstAvailable) {
          notify(t("All beds are occupied in this ward"), "warn");
        }
      }
      // Auto-fill Billing Category to match the Room Type (same IPDCaseType master;
      // fall back to the room type's own value/label if no separate match exists).
      // 25-10-2026 - the room type's OWN configured Billing Category (Create Room Type > Billing Category) wins.
      // The same-name match below used to overwrite it, so a CCU room type configured to bill as
      // "LABOUR DELIVERY ROOM SUITE" was still charged at CCU's rate.
      const configuredBilling =
        Number(value?.BillingCategoryID) > 0
          ? (DropDownState?.getBillingCategory || []).find(
              (bc) => Number(bc?.IPDCaseTypeID) === Number(value?.BillingCategoryID),
            )
          : null;
      const billingMatch =
        configuredBilling ||
        (DropDownState?.getBillingCategory || []).find(
          (bc) =>
            Number(bc?.IPDCaseTypeID) === Number(value?.value) ||
            String(bc?.Name || "").toLowerCase() ===
              String(value?.label || "").toLowerCase(),
        );
      setPayloadData((val) => ({
        ...val,
        BillingCategory: billingMatch?.IPDCaseTypeID ?? value?.value ?? "",
        BillingCategory_label: billingMatch?.Name ?? value?.label ?? "",
        // Auto-fill Requested Room Type to match the selected Room Type.
        requestedRoomType: value?.value ?? "",
        requestedRoomType_label: value?.label ?? "",
        RoomBed: getBedRoomId(firstAvailable) ?? "",
        // The label travels to the API as roomName, so the auto-selected bed has to
        // carry it exactly like a hand-picked one does; without it the admission was
        // saved with a blank room name.
        RoomBed_label: firstAvailable?.Name ?? "",
      }));
    }
  };

  const handleReactSelectDynamicOptions = (name, value) => {
    setPayloadData((prevData) => {
      return {
        ...prevData,
        [name]: value || "",
      };
    });
  };

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  const findReferDisable = useCallback(
    (GetReferTypeListData, KeyMatch, valueMatch) => {
      return GetReferTypeListData?.find(
        (ele) => Number(ele[KeyMatch]) === Number(valueMatch),
      );
    },
    [payloadData?.referalTypeID],
  );

  /* Which list the Refer Doctor picker offers. The refer type master normally decides
     it through IsMainDoctor, but a referrer the admission already stored wins: if that
     doctor is not in the list the flag asks for, the other list is used so the saved
     value can actually be shown and kept. The refer type itself is left exactly as the
     record has it - flipping it here would write a type nobody picked back to the
     record on the next Update. */
  const referDoctorOptions = useMemo(() => {
    const optionID = (opt) => String(opt?.value ?? opt?.code ?? "");
    const mainDoctors = [...(DropDownState?.getDoctorDeptWise || [])];
    const referDoctors =
      handleReactSelectDropDownOptions(
        GetBindReferDoctorList,
        "NAME",
        "DoctorID",
      ) || [];

    const wantsMainDoctor =
      Number(
        findReferDisable(
          GetReferTypeList,
          "ReferalTypeID",
          payloadData?.referalTypeID?.value,
        )?.IsMainDoctor,
      ) === 1;

    const preferred = wantsMainDoctor ? mainDoctors : referDoctors;
    const fallback = wantsMainDoctor ? referDoctors : mainDoctors;

    const selected = payloadData?.referDoctorID;
    if (!selected) return preferred;
    if (preferred.some((opt) => optionID(opt) === String(selected)))
      return preferred;
    if (fallback.some((opt) => optionID(opt) === String(selected)))
      return fallback;
    return preferred;
  }, [
    DropDownState?.getDoctorDeptWise,
    GetBindReferDoctorList,
    GetReferTypeList,
    payloadData?.referalTypeID,
    payloadData?.referDoctorID,
    findReferDisable,
  ]);

  const handleUpdatePatientAdmissionDetails = async () => {
    if (payloadData?.isDischarge) {
      notify(t("You Can Not Edit Admission. Patient is discharged"), "error");
      return 0;
    }
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 0) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[0], "error");
      }
      return false;
    }
    try {
      const requestPayload = {
        ...handleUpdateIPDAdmissionPayload(
          singlePatientData,
          payloadData,
          updataDataList,
          selectedRelations,
          relation,
        ),
        AdmitDateTime: moment(payloadData?.dateOfVisit)
          .set({
            hour: moment(payloadData?.time).hour(),
            minute: moment(payloadData?.time).minute(),
          })
          .format("YYYY-MM-DD-HH:mm"),
      };

      const response = await UpdatePatientAdmissionDetails(requestPayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayloadData({ ...initialState });
        sendReset();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleSaveIPDAdmission = async () => {
    debugger
    if (isAadhaarMandatory) {
      let hasAadhaar = singlePatientData?.AdharCardNo && singlePatientData?.AdharCardNo !== "0";
      if (!hasAadhaar && singlePatientData?.patientIDProofs) {
        const proofStr = String(singlePatientData.patientIDProofs).toLowerCase();
        hasAadhaar = proofStr.includes("aadhaar") || proofStr.includes("adhar");
      }
      if (!hasAadhaar) {
        notify(t("Aadhaar No is not added for this patient. Please update Aadhaar in Registration first."), "error");
        return false;
      }
    }
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 0) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[0], "error");
      }
      return false;
    }
    try {
      const requestBody = handleSaveIPDAdmissionPayload(
        SearchPatient?.patientDetail,
        singlePatientData,
        payloadData,
        ip,
        location,
        selectedRelations,
      );
      if (requestBody?.pmh) requestBody.pmh.UniqueHash = uniqueHash || "";
      /* Admitting the patient onto a bed reserved for THEM closes the
         reservation - the admission save already knows how, given the id. A bed
         reserved for someone else is left alone: the reservation is theirs. */
      if (selectedBedReservation && !selectedBedReservedForOther) {
        requestBody.isAdmissionAgainstAdvanceBooking = 1;
        requestBody.advanceID = selectedBedReservation.id;
      }
      const response = await SaveIPDAdmission(requestBody);

      if (response?.success) {
        notify(response?.message, "success");
        if (!isGeneralConsentPrintHide) {
          handleConsertFormPrint(response?.data?.transactionID);
        } else {
          // 28-10-2026: with the consent form switched off (IsGeneralConsentPrintHide = 1)
          // the IPD sticker prints in its place
          handleIPDStickerPrint(response?.data?.transactionID);
        }
        handleIPDAdmissionPrint(response?.data?.transactionID);
        if (showExtraFields) {
          const qty = Math.max(1, Number(payloadData?.VisitorCardQty) || 1);
          for (let i = 0; i < qty; i++) {
            await handleVisitorCardPrint(response?.data?.transactionID);
          }
        }
        setPayloadData({ ...initialState });
        sendReset(response?.data?.ipdno);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) { }
  };
  const handleIPDAdmissionPrint = async (transactionID) => {
    try {
      const reportResp = await IPDAdmissionReport(Number(transactionID), 2);
      if (reportResp?.success) {
        RedirectURL(reportResp?.data?.pdfUrl);
      } else {
        notify(reportResp?.data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  // IPD sticker - same print as "Stickers" on the IPD patient list
  const handleIPDStickerPrint = async (transactionID) => {
    try {
      const stickerResp = await IPDPrintSticker({
        transactionID: Number(transactionID),
      });
      if (stickerResp?.success) {
        RedirectURL(stickerResp?.data?.pdfUrl);
      } else {
        notify(stickerResp?.data?.message || stickerResp?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleVisitorCardPrint = async (transactionID) => {
    try {
      const reportResp = await IPDAdmissionReport(Number(transactionID), 5);
      if (reportResp?.success) {
        RedirectURL(reportResp?.data?.pdfUrl);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleConsertFormPrint = async (transactionID) => {
    let payload = {
      transactionID: Number(transactionID),
    };
    try {
      const consentForm = await CurrentStockGeneralConsertForm(payload);
      if (consentForm?.success) {
        RedirectURL(consentForm?.data?.pdfUrl);
      } else {
        notify(consentForm?.data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const GetPatientAdmissionitem = async (data) => {
    try {
      const datas = await GetPatientAdmissionDetails(
        data?.patientID,
        data?.transactionID,
      );
      if (datas?.success) {
        if (
          datas?.data?.admissionDetails?.length > 0 &&
          datas?.data?.doctorList?.length > 0
        ) {
          const responseAdmissionDetails = datas?.data?.admissionDetails[0];
          const responseDoctorList = datas?.data?.doctorList;

          setUpdataDataList(responseAdmissionDetails);

          const bindroomResponse = await getBindRoom({
            caseType: responseAdmissionDetails?.roomTypeID,
            bookingDate: responseAdmissionDetails?.bookingDate,
          });

          const responseDropdown = await commonFetchAllDropDown();

          setDropDownState({
            ...responseDropdown,
            getBindRoomBed: bindroomResponse,
          });

          const doctorIDData = responseDoctorList?.map((items, _) => {
            return {
              name: items?.text,
              code: String(items?.value || ""),
            };
          });
          setSelectedRelations(datas?.data?.patientrelationList || []);
          setRelationsOnEdit(datas?.data?.patientrelationList || []);

          /* Refer Type / Refer Doctor / PRO were never read back out of the admission
             record, so editing an admission always reopened with the Self default and
             two empty pickers.

             sp_ipd_AdmissionDetailsForEdit does not return a plain id here - it returns
             CONCAT(Id,'#',IsMainDoctor,'#',IsDisable), e.g. "3#0#0". Using the whole
             string made Number() produce NaN, which fell back to the Self default, and
             Self lists the hospital's own doctors - so a refer doctor that was saved
             could never appear in the picker. Only the id part is the refer type. */
          const storedReferType = String(
            responseAdmissionDetails?.referralTypeID ??
            responseAdmissionDetails?.referalTypeID ??
            responseAdmissionDetails?.ReferralTypeID ??
            "",
          ).split("#")[0];
          const storedReferTypeID = Number(storedReferType);
          const referType =
            storedReferType === undefined ||
              storedReferType === null ||
              storedReferType === "" ||
              Number.isNaN(storedReferTypeID)
              ? payloadData?.referalTypeID
              : {
                label:
                  (GetReferTypeList || []).find(
                    (ele) => Number(ele?.ReferalTypeID) === storedReferTypeID,
                  )?.ReferalType ?? "",
                value: storedReferTypeID,
              };
          /* Only what the admission actually stored. No falling back to the consulting
             doctor on a Self admission: Refer Doctor is its own field, and showing a
             doctor nobody entered would save that doctor as the referrer on the next
             Update. Nothing stored means the picker stays empty. */
          const storedReferDoctor = responseAdmissionDetails?.referedBy ?? "";
          const referDoctor = (() => {
            if (storedReferDoctor === "" || storedReferDoctor === null) return "";
            // An id can be used as-is. Some records carry the referrer's name instead,
            // and the picker is keyed by DoctorID, so that is matched back to an id.
            if (!Number.isNaN(Number(storedReferDoctor))) return storedReferDoctor;
            const match = (GetBindReferDoctorList || []).find(
              (ele) =>
                String(ele?.NAME || "").trim().toUpperCase() ===
                String(storedReferDoctor).trim().toUpperCase(),
            );
            return match?.DoctorID ?? "";
          })();

          setPayloadData({
            ...payloadData,
            MLC: responseAdmissionDetails?.mlc,
            AttendeesName: responseAdmissionDetails?.attendeesName,
            AttendeesMobile: responseAdmissionDetails?.attendeesMobile,
            AttendeesAddress: responseAdmissionDetails?.kinAddress ?? responseAdmissionDetails?.KinAddress ?? "",
            PoliceStation: responseAdmissionDetails?.policeStation ?? "",
            AmbulanceNo: responseAdmissionDetails?.ambulanceNo ?? "",
            DriverName: responseAdmissionDetails?.driverName ?? "",
            DriverPhone: responseAdmissionDetails?.driverPhone ?? "",
            IsVulnerable: Number(responseAdmissionDetails?.isVulnerable ?? 0),
            PrimaryTreatment: responseAdmissionDetails?.primaryTreatment ?? "",
            IPDRemarks: responseAdmissionDetails?.iPDRemarks ?? "",
            VisitorCardQty: 1,
            admittedBy: responseAdmissionDetails?.admittedBy,
            dateOfVisit: new Date(responseAdmissionDetails?.dateOfAdmit),
            time: parseTimeString(responseAdmissionDetails?.timeOfAdmit),
            admissionType: responseAdmissionDetails?.admission_Type,
            IPDCaseTypeID: responseAdmissionDetails?.roomTypeID,
            RoomBed: responseAdmissionDetails?.roomId,
            BillingCategory: responseAdmissionDetails?.rommType_BillID,
            ReferedSource: responseAdmissionDetails?.source,
            requestedRoomType: responseAdmissionDetails?.requestedRoomType,
            entitlement: responseAdmissionDetails?.entitlement,
            IssuedVisitorCardNo: responseAdmissionDetails?.admissionReason,
            admissionReason: responseAdmissionDetails?.admissionReason,
            treatment: responseAdmissionDetails?.treatment
              ? responseAdmissionDetails?.treatment
              : "",
            diagnosis: responseAdmissionDetails?.diagnosis,
            IPDCaseTypeName: responseAdmissionDetails?.IPDCaseTypeName
              ? responseAdmissionDetails?.IPDCaseTypeName
              : "",
            RoomName: responseAdmissionDetails?.RoomName
              ? responseAdmissionDetails?.RoomName
              : "",
            DoctorID: doctorIDData,
            panelID: responseDropdown?.getBindPanelByPatientID.find(
              (ele) =>
                Number(ele?.value) ===
                Number(responseAdmissionDetails?.panelID),
            ),
            CorporatePanelID: responseDropdown?.getBindCorporatePanelList?.find(
              (ele) =>
                Number(ele?.value) ===
                Number(responseAdmissionDetails?.corporatePanelID),
            ),
            CorporatePanelName: responseAdmissionDetails?.corporatePanelName || "",
            SuperVisorID: responseDropdown?.SuperVisorList?.find(
              (ele) =>
                (ele?.value) ===
                (responseAdmissionDetails?.superVisorID),
            ),
            SuperVisor: responseAdmissionDetails?.SuperVisor || "",
            referalTypeID: referType,
            referDoctorID: referDoctor,
            proId: responseAdmissionDetails?.proID ?? "",
            RMODoctorID: responseDropdown?.RMODoctorList?.find(
              (ele) =>
                Number(ele?.value) ===
                Number(responseAdmissionDetails?.mroDoctorID),
              // Number(responseAdmissionDetails?.RMODoctorID),
            ),
            RMODoctor: responseAdmissionDetails?.RMODoctor || "",
            mlcNo: responseAdmissionDetails?.mlC_NO || "",
            mlcIdentification1: responseAdmissionDetails?.mlcIdentification1 || "",
            mlcIdentification2: responseAdmissionDetails?.mlcIdentification2 || "",
            // mLCType: responseAdmissionDetails?.mlC_Type || "",
            mLCType: responseDropdown?.mLCTypeList?.find(
              (ele) =>
                (ele?.label) == (responseAdmissionDetails?.mlC_Type),
            ),
            TPA: responseDropdown?.getBindTPA?.find(
              (ele) =>
                Number(ele?.value) === Number(responseAdmissionDetails?.tpaId),
            ) || "",
          });
        }
      } else {
        setPayloadData((val) => ({ ...val, isDischarge: true }));
        notify(t("You Can Not Edit Admission. Patient is discharged"), "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const CentreWiseCacheByCenterIDAPI = async () => {
    let data = await dispatch(CentreWiseCacheByCenterID({}));
    if (data?.payload?.success) {
      let countryCode = filterByTypes(
        data?.payload?.data,
        [7, BindResource?.BaseCurrencyID],
        ["TypeID", "ValueField"],
        "TextField",
        "ValueField",
        "STD_CODE",
      );
    }
  };

  const saveProName = async (modalData) => {
    if (!modalData.name || modalData.name.trim() === "") {
      notify(t("Name is required"), "error");
      return
    }
    try {
      let payload = {
        proName: modalData?.name,
        ipaddress: ip || "",
      };
      const response = await AssetBasicMasterSavePro(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setIsOpen();
        setModalData({});
        FetchAllDropDown();
      }
    } catch (error) {
      console.error("Error saving Pro Name:", error);
    }
  };

  const saveReferalDoctor = async (modalData) => {
    if (!modalData?.name || modalData?.name.trim() === "") {
      notify(t("Name is required"), "error");
      return;
    }

    try {
      let payload = {
        title: modalData?.title?.value,
        doctorName: modalData?.name,
        mobile: modalData?.contactNo,
        address: modalData?.address,
        proID: modalData?.proName?.value,
      };

      const response = await BillingIPDSaveReferDoctor(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setIsOpen();
        setModalData({});
        FetchAllDropDown();
      } else {
        notify(response?.message, "error");
        setIsOpen();
        setModalData({});
      }
    } catch (error) {
      console.error("Error saving Pro Name:", error);
    }
  };

  useEffect(() => {
    dispatch(GetBindReferDoctor());
    dispatch(GetBindReferalType());
    dispatch(GetBindDepartment());
    if (BindSeeMoreListData?.length === 0) {
      dispatch(BindSeeMoreList());
    }
    handleBedSummary();
    CentreWiseCacheByCenterIDAPI();
    getProNameList();

  }, []);

  const handleBedSummary = async () => {
    try {
      const response = await MISBedManagementSummary();
      setBedSummary(response?.data?.[0] || {});
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  useEffect(() => {
    if (data) {

      GetPatientAdmissionitem(data);
    } else {
      FetchAllDropDown();

    }
  }, [data]);

  let PatientRegistrationArg = {
    PatientID: singlePatientData?.PatientID,
    TransactionID: data?.transactionID,
    setVisible: setVisible,
    bindDetailAPI: bindDetailAPI,
    handleBindPanelByPatientID: handleBindPanelByPatientID,
  };

  const getDynamicOptionData = (CommonAPITypeID, ControlName) => {
    let data = [];
    if (ControlName === "MLC") {
      data = MapGeneric_OPTION;
    } else if (ControlName === "treatment") {
      data = filterByTypes(
        DropDownState?.getAdmissionType?.length > 0
          ? DropDownState?.getAdmissionType
          : [],
        ["Treatment"],
        ["AType"],
        "label",
        "label",
        "value",
      );
    }
    return data;
  };

  const handleCustomReactSelect = (name, value) => {
    handleReactSelectChange(name, value);
  };

  const handleCustomChange = (e, Type, ControlName) => {
    if (Type === "text") {
      return handleChange(e);
    } else if (Type === "number") {
      return inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, handleChange);
    }
  };

  const handleKeyDownFun = (e, ControlName) => {
    // hanlde onkeydown if any
  };

  const handleAddNewData = (ControlName) => {
    // return button if any need to render
  };

  useEffect(() => {
    if (!payloadData?.IPDCaseTypeID) {
      setPayloadData((val) => ({
        ...val,
        RoomBed: "",
        RoomBed_label: "",
      }));
    }
  }, [payloadData?.IPDCaseTypeID]);

  const dynamicForm = useMemo(() => {
    return (
      <DynamicForm
        dynamicData={PageConfigurationAPIList?.filter(
          (ele) => ele?.IsActive === 1 && ele?.URLID === 12,
        )}
        values={payloadData}
        handleCustomChange={handleCustomChange}
        handleKeyDownFun={handleKeyDownFun}
        handleCustomReactSelect={handleCustomReactSelect}
        getDynamicOptionData={getDynamicOptionData}
        handleAddNewData={handleAddNewData}
        t={t}
        setValues={setPayloadData}
      />
    );
  }, [
    PageConfigurationAPIList,
    DropDownState?.getAdmissionType,
    MapGeneric_OPTION,
    payloadData,
  ]);

  // ── Display-only helpers for the redesigned layout (NO new functionality; every
  //    value is derived from existing state/props). Bed stats & legend are computed
  //    from the SAME getBindRoomBed list the grid already renders, and bed selection
  //    still calls the SAME handleReactSelectChange("RoomBed", ...). ───────────────
  const C = {
    primary: "#447dd5",
    available: "#16a34a",
    occupied: "#dc2626",
    reserved: "#f59e0b",
    maintenance: "#6b7280",
  };
  const stateColor = {
    available: C.available,
    occupied: C.occupied,
    reserved: C.reserved,
    maintenance: C.maintenance,
  };
  const bedList = DropDownState?.getBindRoomBed || [];
  const getBedState = (bed) => {
    const status = String(bed?.Status || "").toLowerCase();
    if (status.includes("reserv")) return "reserved";
    if (status.includes("maint")) return "maintenance";
    const occupied =
      bed?.IsAvailable === false || bed?.IsAvailable === 0 || bed?.IsAvailable === "0" ||
      bed?.Available === false || bed?.Available === 0 || bed?.Available === "0" ||
      bed?.IsOccupied === true || bed?.IsOccupied === 1 || bed?.IsOccupied === "1" ||
      status.includes("occup");
    return occupied ? "occupied" : "available";
  };
  const bedStats = bedList.reduce(
    (acc, b) => {
      acc.total += 1;
      acc[getBedState(b)] += 1;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0 },
  );
  const bedPct = (n) => (bedStats.total ? Math.round((n / bedStats.total) * 100) : 0);
  // Hospital-wide counts from MISBedManagementSummary (Bed Management page source).
  const hospTotal = Number(bedSummary?.TotalCapacity) || 0;
  const hospOccupied = Number(bedSummary?.OccupiedRoom) || 0;
  const hospAvailable = Number(bedSummary?.AvailableRoom) || 0;
  const hospReserved = Number(bedSummary?.TodayAdvanceRoomBoking) || 0;
  const hospPct = (n) => (hospTotal ? Math.round((n / hospTotal) * 100) : 0);
  const filteredBeds = bedList.filter((b) =>
    String(b?.Name || "")
      .toLowerCase()
      .includes(bedSearch.trim().toLowerCase()),
  );
  const selectedBedObj = bedList.find(
    (b) => String(getBedRoomId(b)) === String(payloadData?.RoomBed),
  );
  const admissionDateIso = reservationIsoDate(
    payloadData?.AdmissionDate || payloadData?.DateOfAdmission || payloadData?.AdmissionDateTime,
  );
  const selectedBedReservation = reservationFor(bedReservations, payloadData?.RoomBed, admissionDateIso);
  const selectedBedReservedForOther =
    !!selectedBedReservation && !isOwnReservation(selectedBedReservation, singlePatientData?.PatientID);
  const roomTypeSelected = !!payloadData?.IPDCaseTypeID;
  const noBedInWard =
    roomTypeSelected && !bedLoading && !bedLoadFailed && bedList.length === 0;
  const allBedsOccupied = bedList.length > 0 && bedStats.available === 0;
  const emergencyContact = relationCheckList?.[0];
  /* Here rather than beside the state: payloadData is declared further down
     the component than bedSummary, and a hook reading it above its declaration
     would hit the const before it exists. */
  useEffect(() => {
    loadBedReservations(payloadData?.IPDCaseTypeID);
  }, [payloadData?.IPDCaseTypeID, loadBedReservations]);
  const reservationModals = (
    <>
      <ReserveBedModal
        visible={showReserveBed}
        setVisible={setShowReserveBed}
        patient={singlePatientData}
        bed={selectedBedObj ? { RoomID: selectedBedObj?.RoomID, Name: selectedBedObj?.Name } : null}
        ipdCaseTypeID={payloadData?.IPDCaseTypeID}
        roomTypeName={payloadData?.IPDCaseTypeID_label || payloadData?.IPDCaseTypeName}
        doctorID={payloadData?.ConsultingDoctor?.value ?? payloadData?.ConsultingDoctor}
        panelID={payloadData?.PanelID ?? singlePatientData?.PanelID}
        defaultDate={payloadData?.AdmissionDate || payloadData?.DateOfAdmission || payloadData?.AdmissionDateTime}
        onReserved={() => loadBedReservations(payloadData?.IPDCaseTypeID)}
      />
      <BedReservationsModal
        visible={showReservations}
        setVisible={setShowReservations}
        ipdCaseTypeID={payloadData?.IPDCaseTypeID}
        onChanged={() => loadBedReservations(payloadData?.IPDCaseTypeID)}
      />
    </>
  );
  const seeMoreItems = !data
    ? SeeMoreList(BindSeeMoreListData, PatientRegistrationArg)
    : [];

  // "Edit Demographic Details" (MenuURL = PatientRegistration) opens only when the
  // fin_global_resources IsDemographicEditAuthorization flag is off, or the user has
  // the IsEditDemographic right (EDP > User Authorization). Other items open directly.
  const handleSeeMoreClick = (item) => {
    const openModal = () => ModalComponent(item?.name, item?.component);
    if (item?.menuURL === "PatientRegistration") {
      handleAuthorizedDemographicEdit(openModal, t("You are not authorized to edit demographic details"));
      return;
    }
    openModal();
  };
  const handleClearAll = () => {
    setPayloadData({ ...initialState });
    sendReset();
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const renderSummaryRow = (icon, label, value, alignStart = false) => (
    <div
      className={`d-flex justify-content-between py-1 ${alignStart ? "align-items-start" : "align-items-center"}`}
      style={{ fontSize: 12, borderBottom: "1px dashed #eef2f7" }}
    >
      <span className="text-muted d-flex align-items-center" style={{ gap: 6, paddingTop: alignStart ? "2px" : "0px" }}>
        <i className={`fa ${icon}`} style={{ width: 14, color: C.primary }} />
        {label}
      </span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value || "-"}</span>
    </div>
  );
  const renderSummaryRowLast = (icon, label, value, alignStart = false) => (
    <div
      className={`py-1 px-1 card ${alignStart ? "align-items-start" : "align-items-center"}`}
      style={{ fontSize: 12, borderBottom: "1px dashed #eef2f7" }}
    >
      <span className="text-muted d-flex align-items-center justify-content-center" style={{ gap: 6, paddingTop: alignStart ? "2px" : "0px" }}>
        <i className={`fa ${icon}`} style={{ width: 14, color: C.primary }} />
        {label}
      </span>
      <span style={{ fontWeight: 800, textAlign: "" }}>{value || "-"}</span>
    </div>
  );
  const renderStat = (icon, label, value, sub, color, bg) => (
    <div className="col-6 mb-2">
      <div className="card border h-100" style={{ borderRadius: 8 }}>
        <div
          className="card-body p-2 d-flex align-items-center"
          style={{ gap: 8 }}
        >
          <span
            className="d-inline-flex align-items-center justify-content-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: bg,
              color,
              flex: "0 0 auto",
            }}
          >
            <i className={`fa ${icon}`} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="text-muted text-truncate" style={{ fontSize: 10 }}>
              {label}
            </div>
            <div className="d-flex align-items-baseline" style={{ gap: 5 }}>
              <strong style={{ fontSize: 15 }}>{value}</strong>
              {sub != null && (
                <span style={{ fontSize: 9, color }}>{sub}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"submit"}
          buttons={handleModelData?.extrabutton}
          buttonName={handleModelData?.buttonName}
          modalData={modalData}
          setModalData={setModalData}
          footer={handleModelData?.footer}
          handleAPI={handleModelData?.handleInsertAPI}
        >
          {handleModelData?.Component}
        </Modal>
      )}
      <div className="row px-2 ipd-admission-redesign">
        {/* ══════════ LEFT · Patient Summary ══════════ */}
        <div className="col-xl-3 col-lg-4 col-12 mb-2">
          <div className="card border h-100">
            <div
              className="card-header d-flex align-items-center justify-content-between py-2"
              style={{ background: "#f8f9fa" }}
            >
              <span className="d-flex align-items-center" style={{ gap: 6 }}>
                <i className="fa fa-user-circle" style={{ color: C.primary }} />
                <strong style={{ fontSize: 13 }}>{t("Patient Summary")}</strong>
              </span>
              <span className="d-flex align-items-center" style={{ gap: 10 }}>
                {!data && (
                  <i
                    className="fa fa-search"
                    title={t("New Search")}
                    style={{ cursor: "pointer", color: C.primary }}
                    onClick={handleClearAll}
                  />
                )}
                {!data && seeMoreItems?.length > 0 && (
                  <SeeMore Header={<i className="fa fa-ellipsis-v" />}>
                    <ul
                      className="list-group"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {seeMoreItems.map((item, idx) => (
                        <li
                          className="list-group-item p-2"
                          key={idx}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSeeMoreClick(item)}
                        >
                          {item?.name}
                        </li>
                      ))}
                    </ul>
                  </SeeMore>
                )}
              </span>
            </div>
            <div className="card-body py-2">
              <div
                className="d-flex align-items-center mb-2"
                style={{ gap: 10 }}
              >
                {/* photo from the barcode search (Image = base64, like Patient Registration);
                    an empty "data:image/jpg;base64," means no photo -> the icon */}
                <PatientPhotoZoom
                  src={String(singlePatientData?.Image || "").split(",")[1] ? singlePatientData.Image : ""}
                  size={46}
                  title={singlePatientData?.PName}
                />
                <div style={{ minWidth: 0 }}>
                  <div className="text-muted" style={{ fontSize: 10 }}>
                    {t("UHID")}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {singlePatientData?.PatientID || "-"}
                  </div>
                  <div className="text-truncate" style={{ fontWeight: 600 }}>
                    {`${singlePatientData?.Title || ""} ${singlePatientData?.PName || ""}`.trim() ||
                      "-"}
                  </div>
                  <span
                    className="badge mt-1"
                    style={{ background: "#dcfce7", color: C.available }}
                  >
                    {t("Active")}
                  </span>
                </div>
              </div>

              {renderSummaryRow(
                "fa-venus-mars",
                t("GenderAge"),
                `${singlePatientData?.Gender || "-"} / ${singlePatientData?.Age || "-"}`,
              )}
              {renderSummaryRow(
                "fa-mobile-alt",
                t("Mobile"),
                singlePatientData?.Mobile,
              )}
              {renderSummaryRow(
                "fa-address-card",
                t("Aadhaar No"),
                singlePatientData?.AdharCardNo || singlePatientData?.AadhaarNo || "-",
              )}
              {renderSummaryRow(
                "fa-map-marker-alt",
                t("Address"),
                singlePatientData?.House_No,
              )}
              {renderSummaryRow(
                "fa-id-card",
                t("Panel"),
                payloadData?.panelID?.label,
              )}
              {/* Parent panel of the selected panel (bindPanelByPatientID's ParentPanel). */}
              {renderSummaryRow(
                "fa-sitemap",
                t("Parent Panel"),
                payloadData?.panelID?.ParentPanel || "-",
              )}
              {/* Patient Type saved at registration (patient_master.PatientType, sent as RegPatientType). */}
              {renderSummaryRow(
                "fa-user-tag",
                t("Patient Type"),
                String(singlePatientData?.RegPatientType ?? "").trim() || "-",
              )}
              {renderSummaryRow(
                "fa-rupee-sign",
                t("Outstanding"),
                singlePatientData?.Outstanding ?? "0.00",
              )}

              {/* ── Extra fields requested by hospital ── */}
              {renderSummaryRow(
                "fa-phone-square",
                t("Secondary Mobile"),
                singlePatientData?.Phone || null,
              )}
              {renderSummaryRow(
                "fa-flag",
                t("Nationality"),
                singlePatientData?.Country || null,
              )}
              {renderSummaryRow(
                "fa-user-friends",
                t("Father / Husband"),
                singlePatientData?.RelationName
                  ? `${singlePatientData?.Relation ? singlePatientData.Relation + ": " : ""}${singlePatientData.RelationName}`
                  : null,
              )}
              {renderSummaryRow(
                "fa-map-pin",
                t("Post Office"),
                singlePatientData?.Place || null,
              )}
              {renderSummaryRow(
                "fa-map",
                t("District"),
                singlePatientData?.District || null,
              )}
              {renderSummaryRow(
                "fa-globe-asia",
                t("State"),
                singlePatientData?.State || null,
              )}
              {renderSummaryRow(
                "fa-pray",
                t("Religion"),
                singlePatientData?.Religion || null,
              )}
              {renderSummaryRow(
                "fa-handshake",
                t("Attendees Relation"),
                // RelationOf from patient_relation_master (IsPersonal=1, first entry)
                emergencyContact?.RelationOf || null,
              )}
              {renderSummaryRow(
                "fa-home",
                t("Attendees Address"),
                payloadData?.AttendeesAddress || null,
                true,
              )}
              {/* ── End extra fields ── */}

              {emergencyContact && (
                <>
                  <div
                    className="text-uppercase text-muted mt-2 mb-1"
                    style={{ fontSize: 10, letterSpacing: 0.5 }}
                  >
                    {t("Emergency Contact")}
                  </div>
                  {renderSummaryRow(
                    "fa-user",
                    t("Name"),
                    emergencyContact?.RelationName,
                  )}
                  {renderSummaryRow(
                    "fa-link",
                    t("Relation"),
                    emergencyContact?.RelationOf,
                  )}
                  {renderSummaryRow(
                    "fa-phone",
                    t("Mobile"),
                    emergencyContact?.RelationPhoneNo,
                  )}
                </>
              )}

              {singlePatientData?.PatientID && (
                <button
                  className="btn btn-sm btn-success my-2"
                  type="button"
                  onClick={() =>
                    ModalComponent(
                      t("Patient Encounter History"),
                      <PatientEncounterHistory
                        patientId={singlePatientData?.PatientID}
                        isIPD={true}
                      />,
                    )
                  }
                >
                  {t("View Patient History")}
                </button>
              )}
              {dates?.length > 0 && renderSummaryRowLast(
                "fa-calendar",
                t("Last two visited Date"),
                <div>
                  {dates.map((item, index) => {
                    const isDischarged = item?.DischargeDateTime && !item.DischargeDateTime.includes("01-Jan-0001");
                    return (
                      <div key={index} className="align-items-center flex-wrap" style={{ gap: "6px" }}>
                        {(item?.PanelName || item?.DoctorName) && (
                          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", whiteSpace: "wrap" }}>
                            <div>{item?.PanelName || ""}</div>
                            <div>{item?.DoctorName || ""}</div>
                            {/* {item?.PanelName && item?.DoctorName ? " - " : ""}{item?.DoctorName || ""} */}
                          </span>
                        )}
                        <span className="badge bg-info text-white px-2 py-0.5" style={{ fontSize: "11px", fontWeight: "normal", whiteSpace: "nowrap" }}>
                          {t("Admit")}: {item?.AdmissionDate || ""}
                        </span>
                        &nbsp;
                        {isDischarged && (
                          <span className="badge bg-secondary text-white px-2 py-0.5" style={{ fontSize: "11px", fontWeight: "normal", whiteSpace: "nowrap" }}>
                            {t("Discharge")}: {item?.DischargeDateTime || ""}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>,
                true
              )}
            </div>
          </div>
        </div>

        {/* ══════════ LAST · Bed / Ward Selection (order-last → renders after Admission) ══════════ */}
        <div className="col-xl-5 col-lg-12 col-12 mb-2 order-last">
          <div
            className={`card border h-100 ${errors?.RoomBed ? "border-danger" : ""}`}
          >
            <div
              className="card-header d-flex align-items-center flex-wrap py-2"
              style={{ gap: 8, background: "#f8f9fa" }}
            >
              <i className="fa fa-bed" style={{ color: C.primary }} />
              <strong style={{ fontSize: 13 }}>
                {t("Bed / Ward Selection")}
              </strong>
              {hospTotal > 0 && (
                <span className="badge bg-light text-dark border ml-auto">
                  {hospTotal} {t("Beds")}
                </span>
              )}
              {bedInPopup && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary py-0"
                  style={{ marginLeft: hospTotal > 0 ? 4 : "auto" }}
                  onClick={() => setShowBedPopup(true)}
                >
                  <i className="fa fa-bed mr-1" />
                  {payloadData?.RoomBed ? t("Change Bed") : t("Select Bed")}
                </button>
              )}
              <button
                type="button"
                className={`btn btn-sm btn-outline-secondary py-0${hospTotal > 0 || bedInPopup ? " ml-1" : " ml-auto"}`}
                title={t("View reserved beds")}
                onClick={() => setShowReservations(true)}
              >
                <i className="fa fa-bookmark mr-1" /> {t("Reserved")}
                {bedReservations.length ? ` (${bedReservations.length})` : ""}
              </button>
            </div>
            <div className="card-body py-2">
              <div className="row">
                {renderStat(
                  "fa-bed",
                  t("Total Beds"),
                  hospTotal,
                  null,
                  C.primary,
                  "#eaf1fb",
                )}
                {renderStat(
                  "fa-procedures",
                  t("Occupied"),
                  hospOccupied,
                  `${hospPct(hospOccupied)}%`,
                  C.occupied,
                  "#fde8e8",
                )}
                {renderStat(
                  "fa-check",
                  t("Available"),
                  hospAvailable,
                  `${hospPct(hospAvailable)}%`,
                  C.available,
                  "#e7f8ef",
                )}
                {renderStat(
                  "fa-clock",
                  t("Reserved"),
                  hospReserved,
                  `${hospPct(hospReserved)}%`,
                  C.reserved,
                  "#fef3e2",
                )}
              </div>

              {/* ── Bed-grid body: inline when bedInPopup=false, inside modal when =true ── */}
              {(() => {
                const bedGridBody = (
                  <>
                    <div className="row align-items-end">
                      <ReactSelect
                        placeholderName={t("Room_Type")}
                        id={"IPDCaseTypeID"}
                        name="IPDCaseTypeID"
                        value={payloadData?.IPDCaseTypeID}
                        handleChange={(name, e) =>
                          handleReactSelect(name, e, "BillingCategory")
                        }
                        dynamicOptions={handleReactSelectDropDownOptions(
                          DropDownState?.getRoomType ? DropDownState?.getRoomType : "",
                          "Name",
                          "IPDCaseTypeID",
                        )}
                        searchable={true}
                        respclass="col-md-6 col-12"
                        requiredClassName={`required-fields ${errors?.IPDCaseTypeID ? "required-fields-active" : ""}`}
                      />
                      {isBedDropdown ? (
                        <ReactSelect
                          placeholderName={t("Bed No.")}
                          id={"RoomBed"}
                          name="RoomBed"
                          value={payloadData?.RoomBed}
                          handleChange={(name, e) =>
                            handleReactSelectChange("RoomBed", {
                              value: e?.value,
                              label: e?.bedName ?? e?.label,
                            })
                          }
                          dynamicOptions={bedList.map((bed) => {
                            const st = getBedState(bed);
                            const rsv = reservationFor(bedReservations, bed?.RoomID, admissionDateIso);
                            const note =
                              st !== "available"
                                ? ` (${t(cap(st))})`
                                : rsv
                                  ? isOwnReservation(rsv, singlePatientData?.PatientID)
                                    ? ` (${t("Reserved for this patient")})`
                                    : ` (${t("Reserved")}: ${rsv.patientName})`
                                  : "";
                            return {
                              value: bed?.RoomID,
                              label: `${bed?.Name ?? ""}${note}`,
                              bedName: bed?.Name,
                              isDisabled: blockOccupiedBedSelection ? st !== "available" : false,
                            };
                          })}
                          searchable={true}
                          respclass="col-md-6 col-12"
                        />
                      ) : (
                        <Input
                          type="text"
                          className="form-control"
                          id="bedSearch"
                          name="bedSearch"
                          value={bedSearch}
                          onChange={(e) => setBedSearch(e.target.value)}
                          lable={t("Search Bed No.")}
                          placeholder=""
                          respclass="col-md-6 col-12"
                        />
                      )}
                    </div>

                    {allBedsOccupied && (
                      <div
                        className="d-flex align-items-center mt-2 p-2"
                        style={{
                          background: "#fef2f2",
                          border: `1px solid ${C.occupied}`,
                          borderRadius: 8,
                          color: C.occupied,
                          fontSize: 12,
                          gap: 6,
                        }}
                      >
                        <i className="fa fa-exclamation-triangle" />
                        <span>{t("All beds are occupied in this ward")}</span>
                      </div>
                    )}

                    {bedList.length > 0 ? (
                      isBedDropdown ? null : filteredBeds.length > 0 ? (
                        <div className="row mt-1">
                          {filteredBeds.map((bed, i) => {
                            const st = getBedState(bed);
                            const selected =
                              String(payloadData?.RoomBed) === String(bed?.RoomID);
                            const clickable = blockOccupiedBedSelection ? st === "available" : true;
                            const col = stateColor[st];
                            return (
                              <div
                                key={bed?.RoomID ?? i}
                                className="col-6 col-md-4 mb-2"
                              >
                                <div
                                  className="card h-100 p-2 position-relative"
                                  style={{
                                    cursor: clickable ? "pointer" : "not-allowed",
                                    border: `2px solid ${selected ? C.available : col}`,
                                    background: selected ? "#ecfdf5" : "#fff",
                                    opacity: st === "available" || selected ? 1 : 0.85,
                                  }}
                                  onClick={
                                    clickable
                                      ? () => {
                                          handleReactSelectChange("RoomBed", {
                                            value: bed?.RoomID,
                                            label: bed?.Name,
                                          });
                                          if (bedInPopup) setShowBedPopup(false);
                                        }
                                      : undefined
                                  }
                                  title={bed?.Name}
                                >
                                  {selected && (
                                    <i
                                      className="fa fa-check-circle position-absolute"
                                      style={{ top: 6, right: 6, color: C.available }}
                                    />
                                  )}
                                  {(() => {
                                    const rsv = reservationFor(bedReservations, bed?.RoomID, admissionDateIso);
                                    if (!rsv) return null;
                                    const own = isOwnReservation(rsv, singlePatientData?.PatientID);
                                    return (
                                      <div
                                        className="small"
                                        title={`${t("Reserved for")} ${rsv.patientName} (${rsv.patientID}) · ${rsv.bookingDateDisplay}`}
                                        style={{
                                          background: own ? "#ecfdf5" : "#fdf6e3",
                                          color: own ? "#166534" : "#8a6100",
                                          border: `1px solid ${own ? "#bbf7d0" : "#efe0b8"}`,
                                          borderRadius: 4, padding: "1px 6px", marginBottom: 4,
                                          fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                        }}
                                      >
                                        <i className="fa fa-bookmark mr-1" />
                                        {own ? t("Reserved for this patient") : `${t("Reserved")}: ${rsv.patientName}`}
                                        {` · ${rsv.bookingDateDisplay}`}
                                      </div>
                                    );
                                  })()}
                                  <div
                                    className="d-flex align-items-center mb-1"
                                    style={{ gap: 6 }}
                                  >
                                    <span
                                      className="d-inline-flex align-items-center justify-content-center"
                                      style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: "50%",
                                        background: `${col}1a`,
                                        color: col,
                                        flex: "0 0 auto",
                                      }}
                                    >
                                      <i className="fa fa-procedures" />
                                    </span>
                                    <span
                                      className="text-truncate"
                                      style={{ fontWeight: 600, fontSize: 12 }}
                                    >
                                      {bed?.Name}
                                    </span>
                                  </div>
                                  <span
                                    className="d-inline-flex align-items-center"
                                    style={{ gap: 5, fontSize: 11, color: col }}
                                  >
                                    <span
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: col,
                                        display: "inline-block",
                                      }}
                                    />
                                    {selected ? t("Selected") : t(cap(st))}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-muted small px-2 py-2">
                          <i className="fa fa-info-circle mr-1" />
                          {t("No bed matches the search")}
                        </div>
                      )
                    ) : bedLoading ? (
                      <div className="text-muted small px-2 py-2">
                        <i className="fa fa-spinner fa-spin mr-1" />
                        {t("Loading beds")}...
                      </div>
                    ) : noBedInWard ? (
                      <div
                        className="d-flex align-items-center mt-2 p-2"
                        style={{
                          background: "#fef2f2",
                          border: `1px solid ${C.occupied}`,
                          borderRadius: 8,
                          color: C.occupied,
                          fontSize: 12,
                          gap: 6,
                        }}
                      >
                        <i className="fa fa-exclamation-triangle" />
                        <span>{t("There is no bed in this ward")}</span>
                      </div>
                    ) : (
                      <div className="text-muted small px-2 py-2">
                        <i className="fa fa-info-circle mr-1" />
                        {t("Select a Room Type to view available beds")}
                      </div>
                    )}

                    <div
                      className="d-flex flex-wrap align-items-center mt-2"
                      style={{ gap: 12, fontSize: 11 }}
                    >
                      {["available", "occupied", "reserved", "maintenance"].map(
                        (s) => (
                          <span
                            key={s}
                            className="d-flex align-items-center"
                            style={{ gap: 5 }}
                          >
                            <span
                              style={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                background: stateColor[s],
                                display: "inline-block",
                              }}
                            />
                            {t(cap(s))}
                          </span>
                        ),
                      )}
                    </div>
                  </>
                );
                if (!bedInPopup) return bedGridBody;
                return (
                  <>
                    <Modal
                      visible={showBedPopup}
                      setVisible={setShowBedPopup}
                      Header={t("Bed / Ward Selection")}
                      modalWidth="900px"
                      footer={
                        <div className="ftr_btn">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowBedPopup(false)}
                          >
                            {t("Close")}
                          </button>
                        </div>
                      }
                    >
                      <div style={{ padding: "8px 4px" }}>{bedGridBody}</div>
                    </Modal>
                  </>
                );
              })()}

              {payloadData?.RoomBed && (
                <div
                  className="mt-2 p-2"
                  style={{
                    background: "#ecfdf5",
                    border: `1px solid ${C.available}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <div
                    className="d-flex align-items-center flex-wrap"
                    style={{ gap: 6 }}
                  >
                    <i className="fa fa-bed" style={{ color: C.available }} />
                    <strong>{t("Selected Bed")}:</strong>
                    <span>
                      {selectedBedObj?.Name || payloadData?.RoomName || "-"}
                    </span>
                  </div>
                  <div className="text-muted mt-1">
                    {t("Room Type")}:{" "}
                    {payloadData?.IPDCaseTypeID_label ||
                      payloadData?.IPDCaseTypeName ||
                      "-"}
                  </div>
                  {selectedBedReservation && (
                    <div
                      className="mt-2 small"
                      role="note"
                      style={{
                        background: selectedBedReservedForOther ? "#fdf6e3" : "#ecfdf5",
                        color: selectedBedReservedForOther ? "#8a6100" : "#166534",
                        border: `1px solid ${selectedBedReservedForOther ? "#efe0b8" : "#bbf7d0"}`,
                        borderRadius: 6, padding: "6px 10px",
                      }}
                    >
                      <i className="fa fa-bookmark mr-1" />
                      {selectedBedReservedForOther ? (
                        <>
                          {t("This bed is reserved for")}{" "}
                          <b>{selectedBedReservation.patientName}</b> ({selectedBedReservation.patientID}
                          {selectedBedReservation.mobile ? `, ${selectedBedReservation.mobile}` : ""})
                          {" "}{t("on")} {selectedBedReservation.bookingDateDisplay}
                          {selectedBedReservation.reservedBy ? ` · ${t("reserved by")} ${selectedBedReservation.reservedBy}` : ""}
                          . {t("You can still admit this patient here.")}
                        </>
                      ) : (
                        <>
                          {t("Reserved for this patient on")} {selectedBedReservation.bookingDateDisplay}
                          {" — "}{t("admitting here will close the reservation.")}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {errors?.RoomBed && (
                <div className="text-danger small px-2 pt-1">
                  {t("Room/Bed Is Required")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ CENTER · Admission Details ══════════ */}
        <div className="col-xl-4 col-lg-8 col-12 mb-2">
          <div className="card border h-100">
            <div
              className="card-header d-flex align-items-center py-2"
              style={{ gap: 6, background: "#f8f9fa" }}
            >
              <i className="fa fa-notes-medical" style={{ color: C.primary }} />
              <strong style={{ fontSize: 13 }}>{t("Admission Details")}</strong>
            </div>
            <div className="card-body py-2">
              <div className="row">
                <ReactSelect
                  placeholderName={t("Admission_Type")}
                  id={"admissionType"}
                  name="admissionType"
                  value={payloadData?.admissionType}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={filterByTypes(
                    DropDownState?.getAdmissionType?.length > 0
                      ? DropDownState?.getAdmissionType
                      : [],
                    ["AdmissionType"],
                    ["AType"],
                    "label",
                    "label",
                    "value",
                  )}
                  searchable={true}
                  respclass="col-md-6 col-12"
                  requiredClassName={`required-fields ${errors?.admissionType ? "required-fields-active" : ""}`}
                />

                <ReactSelect
                  placeholderName={t("Panel")}
                  id={"InSurancePanel"}
                  searchable={true}
                  respclass="col-md-6 col-12"
                  value={payloadData?.panelID?.value}
                  name={"panelID"}
                  dynamicOptions={DropDownState?.getBindPanelByPatientID}
                  isDisabled={data ? true : false}
                  handleChange={handlePanelReactSelectChange}
                  removeIsClearable={true}
                  requiredClassName={`required-fields ${errors?.panelID ? "required-fields-active" : ""}`}
                />

                {showParentPanelSelect && (
                  <ReactSelect
                    placeholderName={t("Parent Panel")}
                    id={"ParentPanel"}
                    searchable={true}
                    respclass="col-md-6 col-12"
                    value={
                      payloadData?.panelID?.ParentPanelID
                        ? Number(payloadData?.panelID?.ParentPanelID)
                        : ""
                    }
                    name={"parentPanelID"}
                    dynamicOptions={parentPanelOptions}
                    isDisabled={!payloadData?.panelID}
                    handleChange={handleParentPanelChange}
                    removeIsClearable={true}
                  />
                )}

                <ReactSelect
                  placeholderName={t("Insurance")}
                  id={"TPA"}
                  searchable={true}
                  respclass="col-md-6 col-12"
                  value={payloadData?.TPA?.value ?? ""}
                  name={"TPA"}
                  dynamicOptions={Array.from(
                    new Map(
                      (DropDownState?.getBindPanelByPatientID || [])
                        .filter((p) => p?.ParentPanel)
                        .map((p) => [
                          p.ParentPanel,
                          { label: p.ParentPanel, value: p.ParentPanel },
                        ]),
                    ).values(),
                  )}
                  handleChange={(name, e) =>
                    setPayloadData((prev) => ({ ...prev, TPA: e }))
                  }
                />

                <ReactSelect
                  placeholderName={t("department")}
                  id={"department"}
                  searchable={true}
                  respclass="col-md-6 col-12"
                  dynamicOptions={[
                    { label: t("All"), value: "ALL" },
                    ...handleReactSelectDropDownOptions(
                      GetDepartmentList,
                      "Name",
                      "ID",
                    ),
                  ]}
                  name="DepartmentID"
                  value={payloadData?.DepartmentID}
                  handleChange={handleReactSelectChange}
                  removeIsClearable={true}
                />

                <MultiSelectComp
                  respclass="col-md-6 col-12"
                  name="DoctorID"
                  id="DoctorID"
                  placeholderName={t(" Consulting Doctor ")}
                  dynamicOptions={DropDownState?.getDoctorDeptWise?.map(
                    (ele) => ({
                      code: String(ele?.code || ele?.DoctorID || ""),
                      name: ele?.name || ele?.Name,
                    }),
                  )}
                  handleChange={handleMultiSelectChange}
                  value={payloadData?.DoctorID}
                  requiredClassName={`required-fields ${errors?.DoctorID ? "required-fields-active" : ""}`}
                />

                {payloadData?.DoctorID?.length > 0 && (
                  <div className="col-12">
                    <div className="doctorBind">
                      <div className="doctorsName">
                        {payloadData?.DoctorID?.map((item) => {
                          return item?.name;
                        }).join("  ,  ")}
                      </div>
                    </div>
                  </div>
                )}

                {
                  DropDownState?.getBindCorporatePanelList?.length > 0 && (<ReactSelect
                    placeholderName={t("Parent Panel")}
                    id={"CorporatePanelID"}
                    searchable={true}
                    respclass="col-md-6 col-12"
                    value={payloadData?.CorporatePanelID?.value}
                    name={"CorporatePanelID"}
                    dynamicOptions={DropDownState?.getBindCorporatePanelList}
                    handleChange={handleCorporatePanelChange}
                    removeIsClearable={true}
                  />)
                }
                {
                  DropDownState?.SuperVisorList?.length > 0 && (<ReactSelect
                    placeholderName={t("SuperVisor")}
                    id={"SuperVisorID"}
                    searchable={true}
                    respclass="col-md-6 col-12"
                    value={payloadData?.SuperVisorID?.value}
                    name={"SuperVisorID"}
                    dynamicOptions={DropDownState?.SuperVisorList}
                    //    dynamicOptions={handleReactSelectDropDownOptions(
                    //   DropDownState?.SuperVisorList,
                    //   "Name",
                    //   "EmployeeID",
                    // )}
                    handleChange={handleSuperVisorChange}
                    removeIsClearable={true}
                  />)
                }
                {
                  DropDownState?.RMODoctorList?.length > 0 && (<ReactSelect
                    placeholderName={t("RMO Doctor")}
                    id={"RMODoctorID"}
                    searchable={true}
                    respclass="col-md-6 col-12"
                    value={payloadData?.RMODoctorID?.value}
                    name={"RMODoctorID"}
                    dynamicOptions={handleReactSelectDropDownOptions(
                      DropDownState?.RMODoctorList,
                      "Name",
                      "DoctorID",
                    )}
                    // dynamicOptions={DropDownState?.RMODoctorList}
                    handleChange={handleRMODoctorChange}
                    removeIsClearable={true}
                  />)
                }
                <ReactSelect
                  placeholderName={t("refertype")}
                  id={"refertype"}
                  searchable={true}
                  respclass="col-md-6 col-12"
                  dynamicOptions={handleReactSelectDropDownOptions(
                    GetReferTypeList,
                    "ReferalType",
                    "ReferalTypeID",
                  )}
                  name={"referalTypeID"}
                  value={payloadData?.referalTypeID?.value}
                  handleChange={handleReactSelectChange}
                  removeIsClearable={true}
                />

                <div className="d-flex col-md-6 col-12">
                  <ReactSelect
                    placeholderName={t("referDoctor")}
                    id={"referDoctor"}
                    searchable={true}
                    respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
                    /* referraltype_master carries IsDisable per type (Self and Walk-In
                       are 1 today), and OPD Service Booking and Emergency Admission both
                       honour it. IPD was the odd one out, leaving the picker open on
                       types that are not meant to have a referrer at all. */
                    isDisabled={
                      Number(
                        findReferDisable(
                          GetReferTypeList,
                          "ReferalTypeID",
                          payloadData?.referalTypeID?.value,
                        )?.IsDisable,
                      ) === 1
                    }
                    dynamicOptions={referDoctorOptions}
                    name="referDoctorID"
                    value={payloadData?.referDoctorID}
                    handleChange={handleReactSelectChange}
                  />

                  <div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setHandleModelData({
                          label: t("Add Refer Doctor"),
                          buttonName: t(""),
                          width: "30vw",
                          isOpen: true,
                          Component: (
                            <ReferDoctorModal
                              isProName={false}
                              setModalData={setModalData}
                              DropDownState={DropDownState}
                            />
                          ),
                          handleInsertAPI: saveReferalDoctor,
                        });
                      }}
                      type="button"
                    >
                      <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex col-md-6 col-12">
                  <ReactSelect
                    placeholderName={t("PRO")}
                    id={"PRO"}
                    searchable={true}
                    name={"proId"}
                    respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
                    dynamicOptions={DropDownState?.getBindProList}
                    value={payloadData?.proId}
                    handleChange={handleReactSelectChange}
                  />

                  <div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setHandleModelData({
                          label: t("Add Pro Name"),
                          buttonName: t(""),
                          width: "30vw",
                          isOpen: true,
                          Component: (
                            <ReferDoctorModal
                              isProName={true}
                              setModalData={setModalData}
                            />
                          ),
                          handleInsertAPI: saveProName,
                        });
                      }}
                      // disabled={isDisableInputs}
                      type="button"
                    >
                      <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
                    </button>
                  </div>
                </div>

                <div className="col-md-6 col-12 d-flex">
                  <DatePicker
                    className={`custom-calendar `}
                    respclass="vital-sign-date"
                    id="dateOfVisit"
                    name="dateOfVisit"
                    value={
                      payloadData?.dateOfVisit
                        ? moment(payloadData?.dateOfVisit).toDate()
                        : ""
                    }
                    minDate={yesterday}
                    maxDate={new Date()}
                    handleChange={(e) => {
                      const dateInput = e.target.value;

                      setPayloadData((prev) => ({
                        ...prev,
                        dateOfVisit: moment(dateInput).toDate(), // Ensure state updates
                      }));
                    }}
                    lable={t("Admission Date")}
                    placeholder={VITE_DATE_FORMAT}
                    inputClassName={"required-fields"}
                    disable={!data ? false : true}
                  />

                  <TimePicker
                    lable={t("Time")}
                    respclass="vital-sign-time ml-1"
                    id="time"
                    name="time"
                    value={payloadData?.time}
                    handleChange={handleChange}
                    className={"required-fields"}
                  />
                </div>

                <ReactSelect
                  placeholderName={t("Billing_Category")}
                  id={"BillingCategory"}
                  searchable={true}
                  respclass="col-md-6 col-12"
                  name="BillingCategory"
                  dynamicOptions={DropDownState?.getBillingCategory?.map(
                    (item) => ({
                      label: item?.Name,
                      value: item?.IPDCaseTypeID,
                    }),
                  )}
                  // 16-11-2026: Billing Category can be changed on Edit Admission too (saved by
                  // UpdatePatientAdmissionDetails on the current bed row); only a discharged patient keeps it locked.
                  isDisabled={data ? !!payloadData?.isDischarge : false}
                  value={payloadData?.BillingCategory}
                  handleChange={handleReactSelect}
                  requiredClassName={`required-fields ${errors?.BillingCategory ? "required-fields-active" : ""}`}
                />

                <Input
                  type="text"
                  className="form-control"
                  id="diagnosis"
                  name="diagnosis"
                  value={payloadData?.diagnosis}
                  onChange={handleChange}
                  lable={t("Diagnosis")}
                  placeholder=""
                  respclass="col-md-6 col-12"
                />

                <ReactSelect
                  placeholderName={t("Refered Source")}
                  id={"ReferedSource"}
                  searchable={true}
                  respclass="col-md-6 col-12"
                  name="ReferedSource"
                  dynamicOptions={referedSourceOptions}
                  value={payloadData?.ReferedSource}
                  handleChange={handleReactSelectChange}
                />

                <ReactSelect
                  placeholderName={t("Requested_Room_Type")}
                  id={"requestedRoomType"}
                  name="requestedRoomType"
                  value={payloadData?.requestedRoomType}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={DropDownState?.getRoomType?.map((item) => ({
                    label: item?.Name,
                    value: item?.IPDCaseTypeID,
                  }))}
                  searchable={true}
                  respclass="col-md-6 col-12"
                />
                <ReactSelect
                  placeholderName={t("Entitlement")}
                  id={"entitlement"}
                  name="entitlement"
                  value={payloadData?.entitlement}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={[
                    {
                      label: "General",
                      value: "General"
                    },
                    {
                      label: "Private",
                      value: "Private"
                    },
                    {
                      label: "Semi Private",
                      value: "Semi Private"
                    },
                    {
                      label: "Deluxe",
                      value: "Deluxe"
                    }
                  ]}
                  searchable={true}
                  respclass="col-md-6 col-12"
                />



                <Input
                  type="text"
                  className="form-control"
                  id="AttendeesName"
                  name="AttendeesName"
                  value={payloadData?.AttendeesName}
                  onChange={handleChange}
                  lable={t("Attendees Name")}
                  placeholder=""
                  respclass="col-md-6 col-12"
                />

                <Input
                  type="number"
                  className="form-control"
                  id="AttendeesMobile"
                  name="AttendeesMobile"
                  value={payloadData?.AttendeesMobile}
                  onChange={(e) =>
                    inputBoxValidation(
                      MOBILE_NUMBER_VALIDATION_REGX,
                      e,
                      handleChange,
                    )
                  }
                  lable={t("Attendees Mobile")}
                  placeholder=""
                  respclass="col-md-6 col-12"
                  showTooltipCount={true}
                />

                {showExtraFields && (
                  <>
                    <Input
                      type="text"
                      className="form-control"
                      id="PoliceStation"
                      name="PoliceStation"
                      value={payloadData?.PoliceStation}
                      onChange={handleChange}
                      lable={t("Police Station")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                    <Input
                      type="text"
                      className="form-control"
                      id="AmbulanceNo"
                      name="AmbulanceNo"
                      value={payloadData?.AmbulanceNo}
                      onChange={handleChange}
                      lable={t("Ambulance Number")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                    <Input
                      type="text"
                      className="form-control"
                      id="DriverName"
                      name="DriverName"
                      value={payloadData?.DriverName}
                      onChange={handleChange}
                      lable={t("Driver Name")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                    <Input
                      type="number"
                      className="form-control"
                      id="DriverPhone"
                      name="DriverPhone"
                      value={payloadData?.DriverPhone}
                      onChange={(e) =>
                        inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, handleChange)
                      }
                      lable={t("Driver Number")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                      showTooltipCount={true}
                    />
                    <div className="col-md-6 col-12 d-flex align-items-center gap-2 pt-2">
                      <Checkbox
                        inputId="IsVulnerable"
                        name="IsVulnerable"
                        checked={payloadData?.IsVulnerable === 1}
                        onChange={(e) =>
                          setPayloadData((prev) => ({
                            ...prev,
                            IsVulnerable: e.checked ? 1 : 0,
                          }))
                        }
                      />
                      <label htmlFor="IsVulnerable" className="mb-0">
                        {t("Vulnerable")}
                      </label>
                    </div>
                    <Input
                      type="text"
                      className="form-control"
                      id="PrimaryTreatment"
                      name="PrimaryTreatment"
                      value={payloadData?.PrimaryTreatment}
                      onChange={handleChange}
                      lable={t("Primary Treatment")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                    <Input
                      type="text"
                      className="form-control"
                      id="IPDRemarks"
                      name="IPDRemarks"
                      value={payloadData?.IPDRemarks}
                      onChange={handleChange}
                      lable={t("Remarks")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                    <Input
                      type="number"
                      className="form-control"
                      id="VisitorCardQty"
                      name="VisitorCardQty"
                      value={payloadData?.VisitorCardQty}
                      onChange={handleChange}
                      lable={t("Visitor Card QTY")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                  </>
                )}

                <Input
                  type="text"
                  className="form-control"
                  id="admissionReason"
                  name="admissionReason"
                  value={payloadData?.admissionReason}
                  onChange={handleChange}
                  lable={t("Admission Remark")}
                  placeholder=""
                  respclass="col-md-6 col-12"
                />
                {/* Order: MLC -> MLC Type -> MLC No. (MLC No. only when MLC = Yes).
                    Dynamic (config-driven) fields render at their own narrow
                    config width (e.g. col-xl-2), which clips the value inside the
                    card. Make this a normal half-width grid cell (so it sits in
                    the 2-per-row grid, no gap) and let the inner field fill it. */}
                <div className="col-md-6 col-12 ipd-dyn-form">
                  <style>{`
                    .ipd-dyn-form > div[class*="col-"] {
                      flex: 0 0 100%; max-width: 100%;
                      padding-left: 0; padding-right: 0;
                    }
                  `}</style>
                  {dynamicForm}
                </div>
                <ReactSelect
                  placeholderName={t("MLC Type")}
                  id={"mLCType"}
                  name="mLCType"
                  value={payloadData?.mLCType}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={DropDownState?.mLCTypeList?.map((item) => ({
                    label: item?.mlctype,
                    value: item?.ID,
                  }))}
                  searchable={true}
                  respclass="col-md-6 col-12"
                />

                {
                  console.log("payloadData111", payloadData)
                }
                {
                  payloadData?.MLC === "1" && <Input
                    type="text"
                    className="form-control required-fields"
                    id="mlcNo"
                    name="mlcNo"
                    value={payloadData?.mlcNo}
                    onChange={handleChange}
                    lable={t("MLC No.")}
                    placeholder=""
                    required
                    respclass="col-md-6 col-12"
                  />
                }
                {
                  payloadData?.MLC === "1" && showMlcIdentification && <>
                    <Input
                      type="text"
                      className="form-control"
                      id="mlcIdentification1"
                      name="mlcIdentification1"
                      value={payloadData?.mlcIdentification1}
                      onChange={handleChange}
                      lable={t("Identification 1")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                    <Input
                      type="text"
                      className="form-control"
                      id="mlcIdentification2"
                      name="mlcIdentification2"
                      value={payloadData?.mlcIdentification2}
                      onChange={handleChange}
                      lable={t("Identification 2")}
                      placeholder=""
                      respclass="col-md-6 col-12"
                    />
                  </>
                }

                {singlePatientData?.PatientRelationData?.length > 0 && (
                  <>
                    {relationCheckList?.map((rel, index) => {
                      return (
                        <LabelInputBox
                          isChecked={selectedRelations?.includes(rel)}
                          style={{ cursor: "pointer" }}
                          className={"col-md-6 col-12"}
                          label={`Relation_${index + 1}`}
                          value={rel.RelationName}
                          relation={rel.RelationOf}
                          recontactNo={rel.RelationPhoneNo}
                          setCheclBoxValue={(name, isChecked) => {
                            if (isChecked) {
                              setSelectedRelations((prev) => [...prev, rel]);
                            } else {
                              setSelectedRelations(() =>
                                selectedRelations.filter(
                                  (item) => item !== rel,
                                ),
                              );
                            }
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ FOOTER · Actions (project-standard buttons) ══════════ */}
      <div className="row px-2">
        <div className="col-12 d-flex justify-content-end flex-wrap py-2 border-top">
          <button
            className="btn btn-sm btn-secondary ml-1"
            type="button"
            onClick={handleClearAll}
          >
            {t("Clear All")}
          </button>
          {/* Reserve the selected bed for the selected patient on a date. Only
              on a new admission - an admitted patient has a bed. */}
          {!data && (
            <button
              className="btn btn-sm btn-secondary ml-1"
              type="button"
              disabled={!singlePatientData?.PatientID || !payloadData?.RoomBed}
              title={
                !singlePatientData?.PatientID
                  ? t("Select the patient first")
                  : !payloadData?.RoomBed
                    ? t("Select a bed first")
                    : t("Reserve the selected bed for this patient")
              }
              onClick={() => setShowReserveBed(true)}
            >
              <i className="fa fa-bookmark mr-1" /> {t("Reserve Bed")}
            </button>
          )}
          {data ? (
            <button
              className="btn btn-primary btn-sm px-3 ml-1"
              type="button"
              onClick={handleUpdatePatientAdmissionDetails}
              disabled={payloadData?.isDischarge}
            >
              {t("Update")}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm px-3 ml-1"
              type="button"
              onClick={handleSaveIPDAdmission}
            >
              {t("Save Admission")}
            </button>
          )}
        </div>
      </div>
      {reservationModals}
    </>
  );
};

export default DetailCard;
