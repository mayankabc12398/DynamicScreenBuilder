import { useTranslation } from "react-i18next";
import Heading from "../../../components/UI/Heading";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import OverLay from "../../../components/modalComponent/OverLay";
import { Fragment, lazy, useEffect, useMemo, useRef, useState } from "react";
import TestPayment from "../../../components/front-office/TestPayment";
import { referralBookingPatch } from "../../../components/front-office/ReferralRequestModal";
import { MarkReferralBooked } from "../../../networkServices/DoctorApi";
import PaymentGateway from "../../../components/front-office/PaymentGateway";
import TestAddingTable from "../../../components/UI/customTable/frontofficetables/TestAddingTable";
import BalanceModal from "../../../components/modalComponent/Utils/BalanceModal";
import ConsentConfrimationModal from "../../../components/modalComponent/Utils/ConsentConfrimationModal";
import {
  BindDisApprovalList,
  BindPRO,
  BindFieldBoy,
  BindSmartCardCheckAndSlade,
  CheckblacklistAPI,
  CommonRecieptThermal_PDFCommonPrinterOPDThermal,
  GetBindDoctorDept,
  GetDiscReasonList,
  GetDiscountApprovalList,
  GetEligiableDiscountPercent,
  // GetGlobalResources,
  GetLastVisitDetail,
  GetMemberDetails,
  GetPatientBalance,
  GetPatientMembershipDetails,
  LastVisitDetails,
  PatientControlGetOutStanding,
  PatientSearchbyBarcode,
  SaveLabPrescriptionOPD,
  SaveDiscountOTP,
  SendDiscountOTP,
  StickerPrintVisitWiseReport,
  ValidateForNotGeneratedInviceAndNotPaid,
  bindHashCode,
  bindPanelByPatientID,
  GetPatientIPDAdmissionStatus,
  OPDDoctorsBySubCategory,
  GetExpiredPatientDocuments,
  GetOPDSources,
  } from "../../../networkServices/opdserviceAPI";
import {
  MOBILE_NUMBER_VALIDATION_REGX,
  PAYMENT_OBJECT,
  SEARCH_BY_TESTNAME_DEFAULT,
  THEAD,
} from "../../../utils/constant";
import { useDispatch, useSelector } from "react-redux";
import {
  GetBindDepartment,
  GetBindReferDoctor,
  GetBindReferalType,
  PageConfigurationAPIDetails,
  getEmployeeWise,
  CentreWisePanelControlCache,
  SavePatientPanelDocument,
} from "../../../store/reducers/common/CommonExportFunction";
import {
  OPDServiceBookingPayload,
  ReactSelectisDefaultValue,
  apiField,
  filterByTypes,
  handleReactSelectDropDownOptions,
  handlereferDocotorIDByReferalType,
  inputBoxValidation,
  notify,
} from "../../../utils/utils";
import SearchComponentByUHIDMobileName from "../../../components/commonComponents/SearchComponentByUHIDMobileName";
import DetailsCardForDefaultValue from "../../../components/commonComponents/DetailsCardForDefaultValue";
import Index from "../../frontOffice/PatientRegistration/Index";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import NotificationCard from "../Re_Print/NotificationCard";
import MessageCard from "../Re_Print/MessageCard";
import { useLocation, useNavigate } from "react-router-dom";
import { OpenPDFURL, RedirectURL } from "../../../networkServices/PDFURL";
import {
  BasicMasterBindPro,
  BasicMasterSavePro,
  BillingIPDSaveReferDoctor,
  CommonReceiptPdf,
  SaveReceiptToPatientDocument,
  handleValidateUserToBill,
} from "../../../networkServices/BillingsApi";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import {
  getECHSDoctorsListApi,
  getECHSPolyclinicListApi,
  getReferEmployeesListApi,
} from "../../../networkServices/directPatientReg";
import { MultiSelect } from "primereact/multiselect";
import Input from "../../../components/formComponent/Input";
import LabeledInput from "../../../components/formComponent/LabeledInput";
import { Card } from "react-bootstrap";
import Tables from "../../../components/UI/customTable";

import { Checkbox } from "primereact/checkbox";
import moment from "moment";
import NotificationVisitCard from "../../../components/commonComponents/NotificationVisitCard";
import ReferDoctorModal from "../../Billing/IPD/ReferDoctorModal";
import AgentModal from "../../../components/front-office/AgentModal";
import {
  BindAgent,
  BindPatientAgent,
  SaveAgent,
} from "../../../networkServices/agent";
import LastVisitAccordion from "../../../components/commonComponents/LastVisitAccordion";
import Modal from "../../../components/modalComponent/Modal";
import MembershipCardModal from "../../../components/modalComponent/Utils/MembershipCardModal";
import DayCarePackageBookingModal from "../../../components/modalComponent/Utils/DayCare/DayCarePackageBookingModal";
import { LinkDayCareBookingsToBill } from "../../../networkServices/DayCare";
import { LoyaltyCoinOnBillSaved } from "../../../networkServices/LoyaltyCoinApi";
import MembershipCardBanner from "../../../components/commonComponents/MembershipCardBanner";
import RazorpayPaymentModal from "../../../components/modalComponent/Utils/RazorpayPaymentModal";
import LabelInputBox from "../../../components/formComponent/LabelInputCheckbox";
import DynamicForm from "../../../components/formComponent/DynamicForm";
import SmartDetails from "./SmartDetails";
import PanelDetailsTable from "../PanelDetailsTable";
import EncounterNoManagment from "../tools/EncounterNoManagment";
import WrapTranslate from "../../../components/WrapTranslate";
import ValidateForNotGeneratedTable from "./ValidateForNotGeneratedTable";
import MedikreditPopup from "../tools/MedikreditPopup";
import { getPrintCardPrintOut } from "../../../networkServices/cardPrint";
import { getSampleCollectionTrfForm } from "../../../networkServices/SampleCollectionAPI";
import { CoupanValidateCoupan } from "../../../networkServices/CouponApi";
import clsx from "clsx";
import { AssetBasicMasterSavePro } from "../../../networkServices/EDP/govindedp";
import PatientEncounterHistory from "./PatientEncounterHistory";
import PatientRemarksModal from "../../../components/modalComponent/Utils/PatientRemarksModal";
import { getViewIPDAdmissionRemarkApi } from "../../../networkServices/nursingWardAPI";

/* An outside referral has to say who referred it.

   referraltype_master: 1 Walk-In, 2 IN, 3 Out, 4 Self. Only "Out" means the patient came
   from a doctor outside the hospital, so only "Out" needs the name - without it the
   referral is recorded as having come from nobody, and the referring doctor can neither be
   paid nor followed up.

   At module level because the two places that need it sit in different components of this
   file: the field that turns red is in DetailCard, the save that refuses is in
   OPDServiceBooking. Two copies of the rule would drift apart and leave a red field that
   saves, or a save that refuses with nothing marked. */
const REFERRAL_TYPE_OUT = 3;

/* fin_global_resources -> OPDBookingReferOutDefault. A booking always opens on Refer Type
   Self. When this is on, a patient who was referred Out before is brought in as Out with
   that referral doctor; off, nothing is changed. Read the way the other page flags are:
   Value "1", and not switched off by IsActive. */
const isReferOutDefaultOn = (resources) => {
  const flag = Array.isArray(resources)
    ? resources.find((item) => item?.Name === "OPDBookingReferOutDefault")
    : null;
  return (
    String(flag?.Value ?? flag?.value) === "1" &&
    (flag?.IsActive === undefined || String(flag?.IsActive) === "1")
  );
};

const isReferDoctorMissing = (payloadData) =>
  Number(payloadData?.referalTypeID?.value) === REFERRAL_TYPE_OUT &&
  !payloadData?.referDoctorID;

export default function OPDServiceBooking(props) {
  const { UHID, TestData, handleConfirmationSubmit, appointmentID, autoLoadUHID, presetSlot } = props;
  const { GetGlobalResources, GetDepartmentList: departmentList } = useSelector(
    (state) => state.CommonSlice,
  );
  const filterData = GetGlobalResources?.find(
    (item) => item.Name === "ShowPatientConsent",
  );
  const showConcentForm =
    filterData?.Value === "1" || filterData?.value === "1";
  // Same switch Sample Collection prints its TRF behind:
  //     fin_global_resources.Name = 'Trf_form', Value = '1'.
  // With the row off - or missing - booking prints what it always printed.
  const isTrfFormEnabled =
    (Array.isArray(GetGlobalResources)
      ? GetGlobalResources.find((item) => item?.Name === "Trf_form")?.Value
      : undefined) == 1;
  // fin_global_resources.Name = 'PrintOPDCardOnAllBookings', Value = '1': the OPD
  // card prints after every booking (lab/radiology-only ones too), as it did
  // before the consultation-only rule. Row off or missing - consultation only.
  const isOPDCardOnAllBookings =
    (Array.isArray(GetGlobalResources)
      ? GetGlobalResources.find(
          (item) => item?.Name === "PrintOPDCardOnAllBookings"
        )?.Value
      : undefined) == 1;
  /* fin_global_resources -> ShowOPDCardOnReprint: the one switch for the OPD Card - the
     Reprint dropdown's option and the card printed after a booking. The resource list carries
     only IsActive = 1 rows, so the card prints while the row is active with Value 1; IsActive
     (or Value) 0, or no row, and no card is printed here either. */
  const isOPDCardEnabled =
    String(
      (Array.isArray(GetGlobalResources)
        ? GetGlobalResources.find((item) => item?.Name === "ShowOPDCardOnReprint")?.Value
        : "") ?? "",
    ).trim() === "1";
  // fin_global_resources.PrintOPDStickerOnBooking = 1: after a consultation booking the OPD
  // sticker prints too - 2 labels per consulting doctor (one PDF per doctor, like the OPD card).
  const isOPDStickerOnBooking =
    (Array.isArray(GetGlobalResources)
      ? GetGlobalResources.find(
          (item) => item?.Name === "PrintOPDStickerOnBooking"
        )?.Value
      : undefined) == 1;
  // fin_global_resources 'TIDMandatoryOnOPDBooking' = 1: TID/Claim ID must be filled for an
  // insurance patient (red * and a save check). 0 / missing = optional (field still shown).
  const isTIDMandatory =
    (Array.isArray(GetGlobalResources)
      ? GetGlobalResources.find(
          (item) => item?.Name === "TIDMandatoryOnOPDBooking"
        )?.Value
      : undefined) == 1;
  /* fin_global_resources.Name = 'DayCarePackageBooking', Value = '1': once a
     package is on the bill, offer to schedule its sessions into Day Care and
     hold the beds. Row off or missing - this page behaves exactly as it always
     has, which is why every piece of it below is guarded by this one flag. */
  const isDayCarePackageBooking =
    String(
      (Array.isArray(GetGlobalResources)
        ? GetGlobalResources.find((item) => item?.Name === "DayCarePackageBooking")?.Value
        : undefined) ?? ""
    ).trim() === "1";
  /* fin_global_resources.Name = 'LoyaltyCoinsEnabled', Value = '1': coins are earned on bills
     and can be redeemed with the patient's OTP. Off or missing - nothing below runs. */
  const isLoyaltyCoinsEnabled =
    String(
      (Array.isArray(GetGlobalResources)
        ? GetGlobalResources.find((item) => item?.Name === "LoyaltyCoinsEnabled")?.Value
        : undefined) ?? ""
    ).trim() === "1";
  const location = useLocation();
  const [t] = useTranslation();

  const start = moment();
  const end = moment(start).add(5, "minutes");
  const AppointmentFormattedString = `${start.format("DD-MMM-YYYY")}#${start.format("hh:mm A")}-${end.format("hh:mm A")}`;
  let isPAdmissionRemark = useLocalStorage("IsAdmassionRemarks", "get");
  const [singlePatientData, setSinglePatientData] = useState({});
  // Panel documents attached in "Upload Patient Document" before the booking exists,
  // keyed by PanelID; filed against the visit once the booking save returns its TransactionID.
  const [pendingPanelDocs, setPendingPanelDocs] = useState({});
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState("");
  const [showPatientAdmissionRemarkModal, setShowPatientAdmissionRemarkModal] = useState(false);
  // patient_remarks of the loaded patient. Starts from the search response's
  // RemarksHistory and is replaced with the list SavePatientRemark returns.
  const [patientRemarks, setPatientRemarks] = useState([]);
  // Key BlockOPDBookingForIPDAdmitted = 1: a patient currently admitted in IPD
  // (patient_medical_history Type IPD, Status IN) cannot be booked any OPD service.
  const isBlockOPDForIPDAdmitted =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources.find((item) => item?.Name === "BlockOPDBookingForIPDAdmitted")?.Value ?? ""
    ).trim() === "1";
  const [ipdAdmission, setIpdAdmission] = useState(null);
  const ipdAdmittedMessage = (info) =>
    `This patient is admitted in IPD${info?.IPDNo ? ` (IPD No: ${info.IPDNo})` : ""}. OPD services cannot be booked.`;
  useEffect(() => {
    const patientID = singlePatientData?.PatientID;
    setIpdAdmission(null);
    if (!patientID || !isBlockOPDForIPDAdmitted) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetPatientIPDAdmissionStatus(patientID);
        if (cancelled) return;
        const info = res?.data;
        if (Number(info?.IsAdmitted) === 1) {
          setIpdAdmission(info);
          notify(ipdAdmittedMessage(info), "error");
        }
      } catch (e) {
        console.log(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [singlePatientData?.PatientID, isBlockOPDForIPDAdmitted]);
  useEffect(() => {
    setPatientRemarks(
      Array.isArray(singlePatientData?.RemarksHistory)
        ? singlePatientData.RemarksHistory
        : [],
    );
  }, [singlePatientData?.PatientID, singlePatientData?.RemarksHistory]);
  const handleCloseModal = () => {
    setShowExpiredModal(false);
  };
  // Idempotency key to stop the same booking being saved multiple times (repeat
  // submits / slow-network retries create bills with different BillNo & ReceiptNo).
  // Loaded once on page load, refreshed only when a new patient is searched, and
  // sent to the API as pmh.UniqueHash -> stored in patient_medical_history.UniqueHash
  // and used server-side to dedupe repeat saves.
  const [uniqueHash, setUniqueHash] = useState("");
  const [selectedPanel, setSelectedPanel] = useState([null]);

  // T ID is an insurance-only field: mandatory whenever the visit is booked
  // against a panel, and hidden for cash. bindPanelByPatientID returns
  // PanelGroupID = 1 for the CASH group (the SP's own commented-out filter reads
  // "pnl.panelgroupid <> 1" for panel patients), so anything else is insurance.
  // Defaults to the cash group while no panel has loaded, so an empty screen
  // never blocks Save.
  const isInsurancePanel = Number(selectedPanel?.PanelGroupID ?? 1) !== 1;
  const showTIDField =
    isInsurancePanel &&
    (Array.isArray(GetGlobalResources)
      ? GetGlobalResources.find((item) => item?.Name === "ShowTIDOnOPDBooking")?.Value
      : undefined) == 1;
  const [relationdata, setRelationData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [openMessageModal, setOpenMessageModal] = useState(false);
  const [showMemeberShipCardAccess, setShowMemeberShipCardAccess] =
    useState(false);
  const [balanceData, setbalanceData] = useState(false);
  const [checkBlnc, setCheckBlnc] = useState(false);
  const [patientMembershipMap, setPatientMembershipMap] = useState(
    () => new Map(),
  );
  const [renderComponent, setRenderComponent] = useState({
    name: "",
    component: null,
  });
  const isUserInteraction = useRef(false);
  const [discounts, setDiscounts] = useState({
    discountApprovalList: [],
    discountReasonList: [],
  });
  const [isOtpDiscountEnabled, setIsOtpDiscountEnabled] = useState(false);
  /* Loyalty coins redeemed on this bill: { token, coins, discountAmount, billAmount } once the
     patient's OTP was verified (see LoyaltyRedeemPanel), else null. The patient's own OTP is
     the approval, so the approver-OTP step below is skipped while this is set. */
  const [loyaltyApplied, setLoyaltyApplied] = useState(null);
  const [discountOtp, setDiscountOtp] = useState("");
  const [showDiscountOtpInput, setShowDiscountOtpInput] = useState(false);
  const [discountOtpTimer, setDiscountOtpTimer] = useState(0);
  const [isDiscountOtpVerified, setIsDiscountOtpVerified] = useState(false);
  const [isOtpApprovalListLoaded, setIsOtpApprovalListLoaded] = useState(false);

  /* Bind a doctor's referral request (TestPayment -> Referral -> Bind Referral):
     point the booking header at the doctor the referral names. The Doctor
     dropdown itself lives in DetailCard, which keeps its own option list - it
     reloads that list when it sees a DoctorID it cannot show yet, so setting the
     ids here is all this has to do. */
  /* The referral the counter bound, held until the booking has a TransactionID to
     write back to it. A ref, not state: it must survive the re-renders between the
     bind and the save without re-triggering anything. */
  const boundReferralRef = useRef(null);

  const handleBindReferral = (row) => {
    const patch = referralBookingPatch(
      row,
      handleReactSelectDropDownOptions(departmentList, "Name", "ID"),
    );
    if (!patch) return;
    const { departmentName, ...fields } = patch;
    boundReferralRef.current = row?.referID ? { referID: row.referID } : null;
    setPayloadData((prev) => ({ ...prev, ...fields }));
  };

  /* Close the loop: the referral now carries the visit booked for it. Deliberately
     after the save and outside its success path - the visit is already saved and
     paid for, so a failed link is reported, never a reason to fail the booking. */
  const linkBookedReferral = async (transactionID) => {
    const referral = boundReferralRef.current;
    if (!referral || !transactionID) return;
    boundReferralRef.current = null;
    try {
      const res = await MarkReferralBooked(referral, transactionID);
      if (!res?.success) notify(res?.message || t("Referral could not be linked"), "warn");
    } catch (e) {
      notify(t("The booking was saved but the referral could not be linked"), "warn");
    }
  };

  /* The bill exists now: settle the loyalty redemption against it (so the same coins cannot be
     used again) and credit what this bill earns. After the save and outside its success path,
     like the referral link above - the visit is already saved and paid, so a failure is only
     reported. Retried once because an unsettled redemption frees its coins when the 30 minute
     reservation lapses. */
  const recordLoyaltyCoins = async (transactionID) => {
    const token = loyaltyApplied?.token || null;
    setLoyaltyApplied(null);
    const patientID = singlePatientData?.PatientID || singlePatientData?.PatientId;
    if (!isLoyaltyCoinsEnabled || !patientID || !transactionID) return;
    const payload = {
      patientID,
      transactionID: Number(transactionID),
      reservationToken: token,
    };
    let res = await LoyaltyCoinOnBillSaved(payload);
    if (!res?.success) res = await LoyaltyCoinOnBillSaved(payload);
    if (!res?.success) {
      if (token) {
        notify(
          t("The bill was saved but the loyalty coins could not be marked as used. Please inform the administrator"),
          "warn",
        );
      }
      return;
    }
    const earned = Number(apiField(res.data, "earned") || 0);
    if (earned > 0) notify(`${earned} ${t("loyalty coins earned on this bill")}`, "success");
  };

  const [testPaymentState, setTestPaymentState] = useState({
    type: "",
    category: "0",
    subCategory: "0",
    searchType: SEARCH_BY_TESTNAME_DEFAULT,
  });
  const [testAddingTableState, setTestAddingTable] = useState([]);
  const [lastVisitData, setLastVisitData] = useState(null);
  const [lastVisitItemData, setLastVisitItemData] = useState(null);
  const [medikreditData, setMedikreditData] = useState(null);
  let userData = useLocalStorage("userData", "get");
  const dispatch = useDispatch();
  const { state } = useLocation();
  const navigate = useNavigate();
  const initialPayloadState = {
    panelID: singlePatientData?.PanelID,
    referalTypeID: {
      label: "Self",
      value: 4,
    },
    isThermal: "0",
    referDoctorID: "",
    DepartmentID: "ALL",
    DoctorID: "",
    proId: "",
    ECHSDoctorID: "",
    ECHSPolyClinicID: "",
    Source: "",
    MLC: "",
    ReferEmpID: "",
    BarcodeNo: "",
    TID: "",
    PatientRelationData: [],
    contactNo: singlePatientData?.ContactNo,
    isPartialPaymentAllowed: true,
    Smart: { label: "select", value: "" },
    ProcessManual: false,
  };
  const [payloadData, setPayloadData] = useState(initialPayloadState);

  const localdata = useLocalStorage("userData", "get");
  const { GetEmployeeWiseCenter } = useSelector((state) => state?.CommonSlice);
  useEffect(() => {
    if (localdata?.employeeID) {
      dispatch(getEmployeeWise({ employeeID: localdata?.employeeID }));
    }
  }, [dispatch]);
  const [paymentControlModeState, setPaymentControlModeState] =
    useState(PAYMENT_OBJECT);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [rzpOpen, setRzpOpen] = useState(false);
  const [rzpAmount, setRzpAmount] = useState(null);
  const [rzpSavePending, setRzpSavePending] = useState(false);
  // Opened from the UPI "Make Payment" area — collect the UPI row's amount.
  const openRzp = (amount) => {
    setRzpAmount(amount);
    setRzpOpen(true);
  };

  const [notificationDetail, setNotificationData] = useState([]);
  const [password, setPassword] = useState("");
  const [userConfirmation, setUserConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleValidateUserToBillConfirmation = async () => {
    if (!password) {
      notify(t("Please Enter Password"), "error");
      return;
    }
    const requestbody = {
      userId: userData?.employeeID,
      password: password,
    };
    try {
      const response = await handleValidateUserToBill(requestbody);
      if (response?.success || response?.status) {
        notify(response?.message, "success");
        setUserConfirmation(false);
        setShowPassword(false);
        setPassword("");
        handleOPDServiceAPI();
      } else {
        notify(response?.message || "Invalid Password", "error");
      }
    } catch (error) {
      notify(
        error?.response?.data?.message || "Authentication Failed",
        "error",
      );
      console.log(error);
    }
  };

  const handleCancelComment = () => {
    setUserConfirmation(false);
    setShowPassword(false);
  };

  const sendReset = () => {
    setSinglePatientData({});
    setShowPatientAdmissionRemarkModal(false);
    setShowMemeberShipCardAccess([]);
    setTestPaymentState({
      type: "",
      category: "0",
      subCategory: "0",
      searchType: SEARCH_BY_TESTNAME_DEFAULT,
    });
    setTestAddingTable([]);
    setPayloadData(initialPayloadState);
    setPaymentControlModeState(PAYMENT_OBJECT);
    setPaymentMethod([]);
    setNotificationData([]);
    isUserInteraction.current = false;
  };

  const ModalComponent = (name, component) => {
    setVisible(true);
    setRenderComponent({
      name: name,
      component: component,
    });
  };

  const handleGetLastVisitDetail = async (PatientID, DoctorID) => {
    try {
      const response = await GetLastVisitDetail(PatientID, DoctorID);
      return response?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleLastVisitDetails = async (PatientID) => {
    try {
      const data = await LastVisitDetails(PatientID);
      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleJSXNotificationDetils = (details) => {
    const { getLastDetail, lastDetail } = details;
    const response = {
      getLastDetail: {},
      lastDetail: {},
    };

    // Sort to find the latest visit date for the header
    const parseDate = (dateStr) => {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    const sortedVisits = [...(getLastDetail || [])].sort((a, b) => {
      if (a.Days !== undefined && b.Days !== undefined) {
        return Number(a.Days) - Number(b.Days);
      }
      const dateA = a.appDate ? new Date(a.appDate).getTime() : parseDate(a.VisitDate);
      const dateB = b.appDate ? new Date(b.appDate).getTime() : parseDate(b.VisitDate);
      return dateB - dateA;
    });

    const latestVisitDate = sortedVisits[0]?.VisitDate || "";
    response.getLastDetail.header = latestVisitDate ? `${t("Last Visit Date")}: ${latestVisitDate}` : t("Last Visit Details");

    const component = (
      <LastVisitAccordion getLastDetail={getLastDetail} />
    );

    response.getLastDetail.component = component;
    response.getLastDetail.autoClose = false;

    response.lastDetail.header = "Last Visit Details";
    const responselastDetail = lastDetail;

    const responselastDetailcomponent = (
      <div className="visit-test-list">
        {responselastDetail?.map((ele, index) => (
          <div className="visit-test-item" key={index}>
            <span className="visit-test-index">{index + 1}</span>
            <span>{ele?.Name}</span>
          </div>
        ))}
      </div>
    );

    response.lastDetail.component = responselastDetailcomponent;
    return response;
  };

  const ControlGetOutStanding = async (MRNo) => {
    try {
      const response = await PatientControlGetOutStanding(MRNo);
      if (response?.success) {
        return response;
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const NotGeneratedInviceAndNotPaid = async (MRNo, ContactNo) => {
    const payload = {
      contactNo: ContactNo ?? "",
      nationalId: "",
      oldPatientID: "",
      patientID: MRNo ?? "",
    };
    try {
      const response = await ValidateForNotGeneratedInviceAndNotPaid(payload);
      if (response?.success) {
        return response;
      } else {
        ModalComponent(
          "Service",
          <ValidateForNotGeneratedTable
            data={response?.data}
            message={response?.message}
          />,
        );
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  // Fetch a fresh idempotency key from the server and hold it in state.
  const generateUniqueHash = async () => {
    const hashcode = await bindHashCode();
    const key = hashcode?.data ?? "";
    setUniqueHash(key);
    return key;
  };

  // Load the key once when the page mounts.
  useEffect(() => {
    generateUniqueHash();
  }, []);

  /* fin_global_resources -> ShowExpiredDocumentAlert = 1: on patient search, a popup lists
     the documents whose latest upload is past the expiry date entered for it. The old
     IsDocumentExpired flag (Old Patient Search only, every old upload) is then not used. */
  const showExpiredDocumentAlert =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources.find((item) => item?.Name === "ShowExpiredDocumentAlert")
        ?.Value ?? "",
    ).trim() === "1";

  const checkExpiredDocuments = async (patientID) => {
    if (!showExpiredDocumentAlert || !patientID) return;
    const res = await GetExpiredPatientDocuments(patientID);
    const rows = res?.success && Array.isArray(res?.data) ? res.data : [];
    if (rows.length) {
      setExpiredMsg(
        rows
          .map((r) => `${r?.DocumentName} expired on ${r?.ExpiryDate}`)
          .join(", "),
      );
      setShowExpiredModal(true);
    }
  };

  const handleSinglePatientData = async (patientData) => {
    if (
      !showExpiredDocumentAlert &&
      Number(patientData?.IsDocumentExpired) === 1 &&
      patientData?.ExpiredDocumentMessage
    ) {
      setExpiredMsg(patientData.ExpiredDocumentMessage);
      setShowExpiredModal(true);
    }
    const { MRNo, ContactNo } = patientData;
    let blacklist = await CheckblacklistAPI(MRNo, ContactNo);
    let GetOutStanding = await ControlGetOutStanding(MRNo);
    let InviceAndNotPaid = await NotGeneratedInviceAndNotPaid(MRNo, ContactNo);
    if (blacklist?.success) {
      notify(blacklist?.message, "error");
      return;
    }
    if (GetOutStanding?.success) {
      notify(GetOutStanding?.message, "error");
      return;
    }
    if (!InviceAndNotPaid?.success) {
      notify(InviceAndNotPaid?.message, "error");
      return;
    }

    try {
      const data = await PatientSearchbyBarcode(MRNo, 1);
      if (data?.success) {
        if (showExpiredDocumentAlert) {
          checkExpiredDocuments(data?.data?.PatientID || MRNo);
        } else if (Number(data?.data?.IsDocumentExpired) === 1 && data?.data?.ExpiredDocumentMessage) {
          setExpiredMsg(data.data.ExpiredDocumentMessage);
          setShowExpiredModal(true);
        }
        // New patient searched -> start a fresh booking session with a new key.
        generateUniqueHash();
        // DoctorID comes space-padded from the patient-search response
        // (CHAR column); trim once so every downstream use gets a clean value.
        generateUniqueHash();
        const patientDoctorID = String(data?.data?.DoctorID ?? "").trim();
        const responseGetLastVisitDetail = await handleGetLastVisitDetail(
          MRNo,
          patientDoctorID,
        );
        try {
          const resBalanceRes = await GetPatientBalance(MRNo);
          if (resBalanceRes?.success) {
            const isBalanceCheck = resBalanceRes?.data?.find(
              (itm) => itm?.Balance,
            );
            setCheckBlnc(isBalanceCheck);
            setbalanceData(resBalanceRes);
          }
          /* else{
            notify(resBalanceRes?.message,"error")
          } */
        } catch (error) {
          notify(error?.message, "error");
        }
        if (responseGetLastVisitDetail?.length > 0) {
          const finalData = responseGetLastVisitDetail?.flatMap((item) => [
            { label: t("Date"), value: item?.VisitDate || "" },
            { label: t("Valid To"), value: item?.ValidTo || "" },
            { label: t("Amount Paid"), value: item?.AmountPaid || 0 },
            { label: t("Days"), value: item?.Days || 0 },
            { label: t("Type"), value: item?.VisitType || "" },
            { label: t("Doctor"), value: item?.Doctor || "" },
          ]);

          setLastVisitData(finalData);
        }

        const responseLastVisitDetail = await handleLastVisitDetails(MRNo);
        if (responseLastVisitDetail?.length > 0) {
          const finalData = responseLastVisitDetail?.flatMap((item, i) => [
            { label: i + 1, value: item?.Name || "" },
          ]);

          setLastVisitItemData(finalData);
        }

        const hasLastVisit = responseGetLastVisitDetail?.length > 0;
        const hasLastVisitItems = responseLastVisitDetail?.length > 0;

        // Show the popup when EITHER dataset has data, and include only the
        // card(s) that actually have data. Optional chaining above prevents a
        // crash when a handler returns undefined (API error / empty body).
        if (hasLastVisit || hasLastVisitItems) {
          const { getLastDetail, lastDetail } = handleJSXNotificationDetils({
            getLastDetail: responseGetLastVisitDetail ?? [],
            lastDetail: responseLastVisitDetail ?? [],
          });

          const notificationResponse = [];
          if (hasLastVisit) notificationResponse.push(getLastDetail);
          if (hasLastVisitItems) notificationResponse.push(lastDetail);

          setNotificationData(notificationResponse);
        }
        const patientDataObj = Array.isArray(data?.data) ? data?.data[0] : data?.data;
        if (patientDataObj?.DOB) {
          const dob = moment(patientDataObj.DOB, ["DD-MM-YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]);
          if (dob.isValid()) {
            const today = moment();
            const years = today.diff(dob, "years");
            if (years > 0) {
              patientDataObj.Age = `${years} YRS`;
            } else {
              const months = today.diff(dob, "months");
              if (months > 0) {
                patientDataObj.Age = `${months} MONTH(S)`;
              } else {
                const days = today.diff(dob, "days");
                patientDataObj.Age = `${Math.max(days, 0)} DAY(S)`;
              }
            }
          }
        }
        setSinglePatientData(patientDataObj);
        // No earlier visit = DoctorID "0"/blank: default the booking to Dr. Self
        // (fin_global_resources DoctorID_Self). A real earlier doctor is kept.
        const selfDoctorID = String(
          (Array.isArray(GetGlobalResources) &&
            GetGlobalResources.find((item) => item?.Name === "DoctorID_Self")?.Value) ||
            "",
        ).trim();
        const bookingDoctorID =
          ["", "0"].includes(patientDoctorID) && selfDoctorID
            ? selfDoctorID
            : patientDoctorID;
        setPayloadData((val) => ({
          ...val,
          // T ID this patient was booked with before, if any (empty on the first
          // visit). Pre-filled only as a convenience - the field stays editable,
          // so this visit can be booked with a different T ID when needed.
          TID: String(patientDataObj?.TID ?? "").trim(),
          DoctorID: bookingDoctorID,
          DoctorName: data?.data?.DoctorName,
          Source: data?.data?.Source,
          referDoctorID:
            Number(val?.referalTypeID?.value) === 4
              ? bookingDoctorID
              : val?.referDoctorID,
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // autoLoadUHID loads the patient WITHOUT setting the UHID flag (which the
    // confirmation flow uses to hide the service-add section). This lets the
    // page be embedded for a patient while keeping the full service UI.
    const loadId = UHID || autoLoadUHID;
    if (loadId) {
      handleSinglePatientData({ MRNo: loadId });
    }
  }, [UHID, autoLoadUHID]);

  useEffect(() => {
    const patID =
      singlePatientData?.PatientID ||
      singlePatientData?.PatientId ||
      singlePatientData?.patientID ||
      singlePatientData?.patientId;
    if (state?.uhid && !patID) {
      handleSinglePatientData({ MRNo: state?.uhid });
      navigate(location.pathname, {
        replace: true,
        state: {
          data: state?.subMenuID,
          subMenuID: state?.subMenuID,
          actualUrl: state?.actualUrl,
          uhid: "",
        },
      });
    }
  }, [state?.uhid]);

  const handlePaymentGateWay = (details) => {

    const {
      panelID,
      billAmount,
      discountAmount,
      isReceipt,
      patientAdvanceAmount,
      autoPaymentMode,
      minimumPayableAmount,
      panelAdvanceAmount,
      disableDiscount,
      refund,
      constantMinimumPayableAmount,
      coPayIsDefault,
      discountIsDefault,
      discountReason,
      discountApproveBy,
      discountPercentage,
      coPayAmount,
      coPayPercent,
    } = details;

    // Per-row membership discounts already applied in TestAddingTable.
    // Parent trusts aggregated details.
    const finalDiscountPercentage = discountPercentage || 0;
    const finalDiscountAmount = discountAmount || 0;
    const finalMinimumPayableAmount = minimumPayableAmount;
    const finalConstantMinimumPayableAmount = finalMinimumPayableAmount
      ? finalMinimumPayableAmount
      : constantMinimumPayableAmount;

    const setData = {
      panelID,
      billAmount,
      isReceipt,
      patientAdvanceAmount,
      // TestAddingTable sends 0 (no mode) on add/delete; on this page the payment
      // mode starts on Cash (PaymentModeID 1). A mode it does send (4 = Credit)
      // is kept. PaymentGateway skips it when the panel does not offer Cash.
      autoPaymentMode: Number(autoPaymentMode) || 1,
      panelAdvanceAmount,
      disableDiscount,
      refund,
      coPayIsDefault,
      discountIsDefault,
      discountApproveBy,
      discountAmount: finalDiscountAmount, // ✅
      discountPercentage: finalDiscountPercentage, // ✅
      minimumPayableAmount: finalMinimumPayableAmount, // ✅
      constantMinimumPayableAmount: finalConstantMinimumPayableAmount, // ✅
      coPayAmount: coPayAmount ?? 0,
      coPayPercent: coPayPercent ?? 0,
      netAmount: Number(billAmount) - Number(finalDiscountAmount),
      panelPayable: Number(billAmount) - Number(finalDiscountAmount),
    };

    const netAmt = Number(billAmount) - Number(finalDiscountAmount);
    if (netAmt === 0 && Number(panelID || selectedPanel?.PanelID || payloadData?.panelID?.PanelID) === 1) {
      // PaymentGateway's own asyncEffect (debounced off screenType.billAmount, which
      // setPaymentControlModeState below also updates in this same call) already seeds
      // the default Cash/autoPaymentMode row through handleAddPaymentMode, using the
      // real base-currency CountryID. Building a second row here duplicated it - its
      // dedupe check compares that real CountryID against this block's hardcoded
      // S_CountryID: 1, which rarely matched, so both rows survived as "Cash / 0.00".
    } else {
      setPaymentMethod([]);
    }
    // debugger
    console.log("sssssssss", {
      ...setData
    })
    setPaymentControlModeState((prev) => {
      let newDiscountReason = discountReason || prev?.discountReason;
      if (!newDiscountReason) {
        if (showMemeberShipCardAccess?.length > 0) {
          newDiscountReason = "MEMBERSHIP DISCOUNT";
        } else if (payloadData?.couponCode) {
          newDiscountReason = "CAMP DISCOUNT";
        } else if (Number(setData?.discountAmount || 0) > 0) {
          newDiscountReason = "MANAGEMENT DISCOUNT";
        }
      }

      let newDiscountReasons1 = prev?.DiscountReasons1;
      if (!newDiscountReasons1) {
        if (showMemeberShipCardAccess?.length > 0) {
          newDiscountReasons1 = "Membership Discount";
        } else if (payloadData?.couponCode) {
          newDiscountReasons1 = "Coupon Discount";
        } else if (Number(setData?.discountAmount || 0) > 0) {
          newDiscountReasons1 = "Management Discount";
        }
      }

      return {
        ...prev,
        ...setData,
        discountReason: newDiscountReason,
        DiscountReasons1: newDiscountReasons1,
      };
    });
  };

  const handleChange = (e, index, name) => {
    const { value } = e.target;
    const data = [...bodyData];
    data[index][name] = value;
    setBodyData(data);
  };

  const renderNotification = useMemo(() => {
    return (
      <NotificationCard>
        {notificationDetail.map((row, index) => {
          return (
            <MessageCard header={row?.header} key={index} variant="modern" autoClose={row?.autoClose}>
              {row?.component}
            </MessageCard>
          );
        })}
      </NotificationCard>
    );
  }, [notificationDetail]);

  const normalizeDiscountApprovalList = (list = []) =>
    list?.map((item) => ({
      ...item,
      ID:
        item?.ID ??
        item?.ApproverEmpID ??
        item?.EmployeeID ??
        item?.EmpID ??
        item?.ApprovalID ??
        item?.ValueField ??
        "",
      ApprovalType:
        item?.ApprovalType ??
        item?.Name ??
        item?.EmployeeName ??
        item?.NAME ??
        item?.TextField ??
        "",
    }));

  const GetDiscListAPI = async () => {
    try {
      const [
        discountReasonListRes,
        eligibleDiscountPercentRes,
        discountApprovalListRes,
        // globalResourcesRes,
      ] = await Promise.all([
        GetDiscReasonList("OPD"),
        GetEligiableDiscountPercent(userData?.employeeID),
        BindDisApprovalList("HOSPITAL", "1"),
        // GetGlobalResources(),
      ]);
      const discountReasonList = discountReasonListRes?.data;
      const eligibleDiscountPercent =
        eligibleDiscountPercentRes?.data?.Eligible_DiscountPercent;

      const otpDiscountResource = GetGlobalResources?.data?.find(
        (item) => item?.Name === "IsOtpVerify",
      );
      // const otpDiscountResource = globalResourcesRes?.data?.find(
      //   (item) => item?.Name === "IsOtpVerify",);
      const isOtpDiscount =
        String(otpDiscountResource?.Value) === "1" ||
        String(otpDiscountResource?.value) === "1";
      setIsOtpDiscountEnabled(isOtpDiscount);
      const discountApprovalList = normalizeDiscountApprovalList(
        discountApprovalListRes?.data || [],
      );

      if (discountReasonList)
        setDiscounts((val) => ({ ...val, discountReasonList }));
      if (discountApprovalList)
        setDiscounts((val) => ({ ...val, discountApprovalList }));
      if (eligibleDiscountPercent)
        setDiscounts((val) => ({
          ...val,
          Eligible_DiscountPercent: eligibleDiscountPercent,
        }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const bindOtpDiscountApprovalList = async () => {
    if (!isOtpDiscountEnabled || isOtpApprovalListLoaded) return;
    try {
      const response = await GetDiscountApprovalList();
      setDiscounts((val) => ({
        ...val,
        discountApprovalList: normalizeDiscountApprovalList(
          response?.data || [],
        ),
      }));
      setIsOtpApprovalListLoaded(true);
    } catch (error) {
      console.error("Error fetching OTP approval list:", error);
    }
  };

  const itemDiscountAmount = useMemo(
    () =>
      testAddingTableState?.reduce(
        (total, item) => total + Number(item?.discountAmount || 0),
        0,
      ) || 0,
    [testAddingTableState],
  );

  const itemDiscountPercentage = useMemo(() => {
    const discountedItem = testAddingTableState?.find(
      (item) => Number(item?.discountPercentage || 0) > 0,
    );
    return Number(discountedItem?.discountPercentage || 0);
  }, [testAddingTableState]);

  /* ── Day Care session booking off a package ────────────────────────────
     The button lives on the package row inside TestAddingTable - which rows
     are packages is that table's own test (TnxTypeID "23", the same one that
     shows the package-details "+"). Every package is offered, not only day
     care ones, because which of them is delivered in a chair is the desk's
     call, not something the item master records.
     All of this is inert unless DayCarePackageBooking is on. */
  const [dayCareBookingModal, setDayCareBookingModal] = useState({
    isShow: false,
    packageRow: null,
  });
  /* Nothing opens on its own. Adding a package to a bill is not the same as
     wanting to schedule it, and a popup that appeared by itself interrupted
     a clerk who was still building the bill. The booking screen is reached
     from the button on the package row instead. */

  /* Groups booked this session, so the bill can be stamped onto exactly those
     sessions below. Group numbers rather than patient-and-date guesswork: a
     course booked yesterday must not be attached to today's bill. */
  const [dayCareGroups, setDayCareGroups] = useState([]);

  useEffect(() => {
    setDayCareGroups([]);
    setDayCareBookingModal({ isShow: false, packageRow: null });
  }, [singlePatientData?.PatientID]);

  /*
   * Day care sessions are booked BEFORE the bill exists, so they cannot carry
   * its reference at the time. Once the bill saves, stamp it onto them.
   *
   * Deliberately not awaited into the save path and never surfaced as an
   * error: the bill is already saved and printing by this point, and failing
   * a completed bill over a cross-reference would be the wrong trade. It is
   * recoverable - the sessions keep their package and OPD visit either way.
   */
  const linkDayCareSessionsToBill = async (billTransactionID, billNo) => {
    if (!isDayCarePackageBooking) return;
    if (!dayCareGroups.length) return;
    if (!Number(billTransactionID)) return;
    try {
      await LinkDayCareBookingsToBill({
        billTransactionID: Number(billTransactionID),
        billNo: String(billNo ?? ""),
        bookingGroupNos: dayCareGroups,
        opdTransactionID: Number(appointmentID) || 0,
      });
      setDayCareGroups([]);
    } catch (error) {
      console.error("Day care bill link failed", error);
    }
  };

  const hasDiscountForOtp =
    Number(paymentControlModeState?.discountAmount || 0) > 0 ||
    itemDiscountAmount > 0;

  const isApprovedByEnabled =
    Number(paymentControlModeState?.discountAmount || 0) > 0;

  const discountPercentageForOtp =
    Number(paymentControlModeState?.discountPercentage || 0) ||
    itemDiscountPercentage;
  const canShowSaveButton =
    !isOtpDiscountEnabled ||
    !isApprovedByEnabled ||
    isDiscountOtpVerified ||
    Boolean(loyaltyApplied);

  const handleStickerPrint = async (data) => {
    try {
      let payload = {
        TransactionID: Number(data?.transactionId),
        isCounsltation: Number(data?.isConsultant),
        isfree: Number(data?.isFreeVisit),
      };
      const stickerData = await StickerPrintVisitWiseReport(payload);

      if (stickerData?.success) {
        const urlsKeys = Object.keys(stickerData?.data);
        urlsKeys.map((url) => {
          RedirectURL(stickerData?.data[url]);
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const validatePaymentModeCheck = () => {
    const chequePayment = paymentMethod?.find(
      (ele) => ele?.PaymentMode === "Cheque",
    );

    if (chequePayment) {
      if (!chequePayment?.BankName?.trim()) {
        return "Bank Name is required for Cheque payment.";
      }
      if (!chequePayment?.RefNo?.trim()) {
        return "Reference Number is required for Cheque payment.";
      }
    }
    return null;
  };
  console.log(localdata, "GetEmployeeWiseCenterGetEmployeeWiseCenter");
  const bindSearchOPDBillsData = (data) => {
    let employeeDetails = GetEmployeeWiseCenter?.filter(
      (val) => val?.CentreID === localdata?.defaultCentre,
    );

    if (roleDetails?.settlementType === 1) {
      return data?.filter((val) => val?.PatientType === "PHY");
    } else if (roleDetails?.settlementType === 0) {
      return data?.filter((val) => val?.PatientType === "OPD");
    } else if (roleDetails?.settlementType === 2) {
      return data;
    }
  };
  const passwordRef = useRef(null);
  useEffect(() => {
    if (userConfirmation) {
      setTimeout(() => {
        if (passwordRef.current) {
          passwordRef.current.focus();
        }
      }, 100);
    }
  }, [userConfirmation]);
  const handleSave = () => {
    if (isBlockOPDForIPDAdmitted && Number(ipdAdmission?.IsAdmitted) === 1) {
      notify(ipdAdmittedMessage(ipdAdmission), "error");
      return;
    }
    // 1. Discount Validations
    if (paymentControlModeState?.discountAmount > 0) {
      if (!paymentControlModeState?.discountReason) {
        notify(t("Discount Type is required"), "error");
        return;
      } else if (!paymentControlModeState?.DiscountReasons1) {
        notify(t("Discount Reason is required"), "error");
        return;
      } else if (!paymentControlModeState?.discountApproveBy?.value) {
        notify(t("Discount Approve By is required"), "error");
        return;
      }
    }

    // 2. Payment Mode Validations
    const errorMsg = validatePaymentModeCheck();
    if (errorMsg) {
      notify(errorMsg, "error");
      return;
    }
    if (isMemberShipCardAccess && !testPaymentState?.MemberShipCardNo) {
      notify(t("Member ship card No is requires"), "error");
    }
    if (
      isOtpDiscountEnabled &&
      isApprovedByEnabled &&
      !isDiscountOtpVerified &&
      !loyaltyApplied
    ) {
      notify(t("Please verify discount OTP"), "error");
      return;
    }

    // 3. Consultation slot check. A slot is only handed back while it is still
    // Available, so a consultation row left without an AppointedDateTime means
    // every slot for that visit has expired. Booking against an expired window
    // is not allowed. Subcategory 6 never gets a slot, so it is left alone.
    const rowWithoutSlot = testAddingTableState?.find(
      (row) =>
        String(row?.TnxTypeID) === "5" &&
        Number(row?.SubCategoryID) !== 6 &&
        row?.typeOfApp &&
        !row?.AppointedDateTime,
    );
    if (rowWithoutSlot) {
      notify(
        `No slot is available for ${rowWithoutSlot?.ItemDisplayName || rowWithoutSlot?.ItemName || "this consultation"}. Please choose another appointment date or visit type.`,
        "error",
      );
      return;
    }

    // 3b. An outside referral has to say who referred. The field is marked red while it
    //     is missing, so this only stops someone who ignored that.
    if (isReferDoctorMissing(payloadData)) {
      notify("Please select the Refer Doctor for an Out referral", "error");
      return;
    }

    // 4. T ID is mandatory for insurance patients when TIDMandatoryOnOPDBooking = 1 (cash
    // patients never see the field, so this only ever fires on a panel booking).
    if (isTIDMandatory && isInsurancePanel && !String(payloadData?.TID || "").trim()) {
      notify("TID/Claim ID is required for insurance patients", "error");
      return;
    }

    // 5. Payload Check Validations (so errors trigger before the modal opens)
    const { pathname } = location;
    const { response } = OPDServiceBookingPayload(
      singlePatientData,
      payloadData,
      testAddingTableState,
      paymentControlModeState,
      paymentMethod,
      pathname,
      relationdata,
      AppointmentFormattedString,
      null,
      selectedPanel
    );

    if (Object?.keys(response || {}).length > 0) {
      notify(response?.message, response?.status);
      return;
    }
    // const isUserAllowToPassModal = GetEmployeeWiseCenter?.find
    // (
    //   (val) => val?.CentreID === localdata?.defaultCentre,
    // );
    if (localdata?.validateUserForBill) {
      setUserConfirmation(true);
    } else {
      handleOPDServiceAPI();
    }
    // 4. Everything is valid, open password modal
  };

  const handleOPDServiceAPI = async () => {
    const { pathname } = location;
    try {
      // Fresh IPD check right before saving (the patient may have been admitted
      // after this page loaded them).
      if (isBlockOPDForIPDAdmitted && singlePatientData?.PatientID) {
        const ipdRes = await GetPatientIPDAdmissionStatus(singlePatientData.PatientID);
        if (Number(ipdRes?.data?.IsAdmitted) === 1) {
          setIpdAdmission(ipdRes.data);
          notify(ipdAdmittedMessage(ipdRes.data), "error");
          return;
        }
      }
      // Re-run payload construction since we know it's valid now
      const { payload } = OPDServiceBookingPayload(
        singlePatientData,
        payloadData,
        testAddingTableState,
        paymentControlModeState,
        paymentMethod,
        pathname,
        relationdata,
        AppointmentFormattedString,
        testPaymentState?.MemberShipCardNo,
        null,
        selectedPanel
      );
      //     debugger
      // return;
      if (Array.isArray(payload?.ltd)) {
        payload.ltd = payload.ltd.map((item) => ({
          ...item,
          appointmentID: appointmentID,
          CoupanCode: payloadData?.couponCode || "",
          MemberNo: "",
        }));
      }

      // if ((!payload?.pmh?.DepositedBy || payload.pmh.DepositedBy.trim() === "") && Number(paymentControlModeState?.paidAmount) > 0) {

      //   notify("Deposited By is required", "warn");
      //   return;
      // }
      // if (Object?.keys(response).length > 0) {
      //   notify(response?.message, response?.status);
      //   return;
      // }

      // if (type === "confirmation") {
      //   handleConfirmationSubmit(payload);
      //   return;
      // }

      // const data = await SaveLabPrescriptionOPD({
      //   ...payload,
      // });
      const data = await SaveLabPrescriptionOPD({
        ...payload,
        BarcodeNo: payloadData?.BarcodeNo || "",
        TID: payloadData?.TID || "",
        pmh: {
          ...payload.pmh,
          UniqueHash: uniqueHash || "",
          otp: isDiscountOtpVerified ? discountOtp : "",
          integrationId: Number(payloadData?.Smart?.value ?? 0),
          MediKreditMemberNo: medikreditData?.memberNumber ?? "",
          MediKreditPlanId: "631372" ?? "",
          MediKreditid_nbr: medikreditData?.id_nbr ?? "",
          MediKreditmem_acc_nbr: medikreditData?.mem_acc_nbr ?? "",
          MediKreditAuthNumber: medikreditData?.authNumber ?? "",
          CorporatePanelID: Number(payloadData?.panelID?.PanelCroporateID ?? 0),
          CorporatePanelName: String(payloadData?.panelID?.CorporareName ?? ""),
          panelID: Number(selectedPanel?.PanelID),
          panelName: selectedPanel?.PanelName
        },
      });

      if (data?.success) {
        /* The agent is saved with the booking now, onto patient_medical_history, so it
           belongs to the visit it brought in. It used to be written onto patient_master
           here, where one column held only the most recent agent and every earlier visit's
           was overwritten. */

        const transactionID =
          data?.data?.transactionId ?? data?.data?.transactionID;
        linkBookedReferral(transactionID);
        recordLoyaltyCoins(transactionID);
        /* The bill now exists, so the day care sessions booked against this
           patient before it can carry its reference. */
        linkDayCareSessionsToBill(transactionID, data?.data?.billNo ?? data?.data?.BillNo);
        // Panel documents attached before the visit existed are filed under this booking.
        const pendingDocs = Object.values(pendingPanelDocs).flat();
        if (pendingDocs.length > 0 && Number(transactionID) !== 0) {
          try {
            const docResp = await SavePatientPanelDocument({
              transactionID: String(transactionID),
              patientID: String(singlePatientData?.PatientID),
              panelDocuments: pendingDocs,
            });
            if (docResp?.success) setPendingPanelDocs({});
            else notify(docResp?.message || "Panel documents could not be saved", "error");
          } catch (docError) {
            console.error(docError);
            notify("Panel documents could not be saved", "error");
          }
        }
        if (showConcentForm) {
          setOpenMessageModal(data?.data);
        }
        if (Number(transactionID) !== 0) {
          const reportResp = await CommonReceiptPdf({
            ledgerTransactionNo: "0",
            isBill: 1,
            transactionID:
              data?.data?.transactionId ?? data?.data?.transactionID,
            receiptNo: "",
            duplicate: "",
            type: "OPD",
            supplierID: "",
            billNo: "",
            isEMGBilling: "",
            isOnlinePrint: "",
            isRefound: 0,
            // The receipt carries the letterhead; only the OPD card below goes
            // out without it.
            isLogo: 1
          });

          // Keep a copy of this receipt in the patient's documents. Fire-and-forget: it never
          // delays or blocks the printouts below; the API saves nothing unless the
          // OPDReceiptDocumentID key is set.
          if (reportResp?.data?.pdfUrl) {
            SaveReceiptToPatientDocument({
              patientID: String(data?.data?.patientID ?? singlePatientData?.PatientID ?? ""),
              transactionID: String(transactionID),
              pdfUrl: reportResp.data.pdfUrl,
            });
          }

          const thermalPrint =
            payloadData?.isThermal == "1"
              ? await CommonRecieptThermal_PDFCommonPrinterOPDThermal({
                ledgerTransactionNo: "0",
                isBill: 1,
                transactionID:
                  data?.data?.transactionId ?? data?.data?.transactionID,
                receiptNo: "",
                duplicate: "",
                type: "OPD",
                supplierID: "",
                billNo: "",
                isEMGBilling: "",
                isOnlinePrint: "",
                isRefound: 0,
              })
              : "";

          // OPD Card sirf consultation wali booking par. Backend ConfigID 5 ki
          // line milne par IsConsultant=1 bhejta hai; sirf jaanch (lab/radiology)
          // book karne par ye 0 rehta hai. Pehle sirf isPrintOPDCard flag dekha
          // jata tha, isliye akeli CBC booking par bhi card nikal aata tha.
          const isConsultationBooked =
            isOPDCardOnAllBookings ||
            Number(data?.data?.IsConsultant ?? data?.data?.isConsultant ?? 0) === 1;

          // Arguments are (patientID, transactionID, reportType, isLogo).
          // The card prints on pre-printed stationery - no logo.
          const OPDCARD = isConsultationBooked && isOPDCardEnabled
            ? await getPrintCardPrintOut(
                data?.data?.patientID,
                transactionID,
                0,
                0,
              )
            : null;

          // Test Requisition Form. Sample Collection prints it the moment a
          // sample is collected; booking prints the same form for the tests
          // just booked, so the form can travel with the patient before any
          // sample exists. Same API, same Trf_form switch.
          const trfForm = isTrfFormEnabled
            ? await getSampleCollectionTrfForm({
                transactionID,
                barcodeNo: payloadData?.BarcodeNo || "",
                // Booking ki copy ke saare box khaali. Ye form lab tak jaata hai
                // aur box wahan haath se tick hote hain - is patient ka koi
                // purana test pehle se collect ho to bhi uska tick nahi chahiye.
                showTick: false,
              }).catch(() => null)
            : null;

          payloadData?.isThermal == "1" &&
            RedirectURL(thermalPrint?.data?.pdfUrl);
          RedirectURL(reportResp?.data?.pdfUrl);
          if (trfForm?.success && trfForm?.data?.pdfUrl) {
            RedirectURL(trfForm.data.pdfUrl);
          } else if (
            isTrfFormEnabled &&
            // A consultation-only booking has no lab test, so the API answering
            // "no test found" is the normal case, not a failure worth a toast.
            !/no test/i.test(trfForm?.message || "")
          ) {
            notify(trfForm?.message || "Failed to generate TRF Form", "error");
          }
          // Two consulting doctors = two cards (pdfUrls, OPDCardPerDoctor = 1); one = pdfUrl as before.
          if (data?.data?.isPrintOPDCard == 1 && isConsultationBooked && isOPDCardEnabled) {
            const cardUrls = Array.isArray(OPDCARD?.data?.pdfUrls)
              ? OPDCARD.data.pdfUrls
              : [OPDCARD?.data?.pdfUrl];
            cardUrls.filter(Boolean).forEach((url) => RedirectURL(url));
          }
          // OPD sticker - same logic as the card: one PDF (2 labels) per consulting doctor.
          if (isOPDStickerOnBooking && isConsultationBooked) {
            try {
              const sticker = await getPrintCardPrintOut(
                data?.data?.patientID,
                transactionID,
                0,
                0,
                undefined,
                1,
              );
              // An API without the sticker answers with the OPD card again - opened only when it
              // says the PDF really is a sticker, so the card never prints twice.
              if (sticker?.success && sticker?.data?.isSticker) {
                const stickerUrls = Array.isArray(sticker?.data?.pdfUrls)
                  ? sticker.data.pdfUrls
                  : [sticker?.data?.pdfUrl];
                stickerUrls.filter(Boolean).forEach((url) => RedirectURL(url));
              } else if (sticker?.success) {
                console.warn("OPD sticker: this server's API has no sticker print yet - deploy the latest API");
              }
            } catch (stickerError) {
              console.error("OPD sticker print failed", stickerError);
            }
          }
        }

        notify(data?.message, "success");
        sendReset();
        if (UHID) {
          handleConfirmationSubmit();
        }
      } else {
        notify(data?.message, "error");
      }
    } catch (error) {
      notify(error?.message || error, "error");
      console.log(error, "error");
    }
  };

  const handleReactSelectData = (name, e) => {
    setPayloadData((prev) => ({
      ...prev,
      [name]: e?.value,
    }));
  };

  // Razorpay payment confirmed → stamp the reference on the UPI / Razor Pay
  // payment row, then auto-save (the effect fires once the row updates so
  // handleSave reads the latest paymentMethod).
  const handleRzpPaid = (reference) => {
    setRzpOpen(false);
    const isRzpRow = (row) =>
      row?.PaymentMode === "UPI" || /razor/i.test(row?.BankName || "");
    const hasRow = (paymentMethod || []).some(isRzpRow);
    if (!hasRow) {
      notify(
        t("Add a UPI / Razor Pay payment row (Make Payment) before collecting."),
        "warn",
      );
      return;
    }
    setPaymentMethod((prev) =>
      (prev || []).map((row) =>
        isRzpRow(row) ? { ...row, RefNo: reference } : row,
      ),
    );
    setRzpSavePending(true);
  };

  useEffect(() => {
    if (rzpSavePending) {
      setRzpSavePending(false);
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, rzpSavePending]);

  useEffect(() => {
    GetDiscListAPI();
  }, []);

  useEffect(() => {
    if (!discountOtpTimer) return;
    const timer = setInterval(() => {
      setDiscountOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [discountOtpTimer]);

  useEffect(() => {
    setIsDiscountOtpVerified(false);
    setDiscountOtp("");
    if (isOtpDiscountEnabled && isApprovedByEnabled) {
      bindOtpDiscountApprovalList();
      setDiscountOtpTimer(0);
    } else {
      setShowDiscountOtpInput(false);
      setIsOtpApprovalListLoaded(false);
      setDiscountOtpTimer(0);
    }
  }, [
    isOtpDiscountEnabled,
    isApprovedByEnabled,
    paymentControlModeState?.discountPercentage,
    paymentControlModeState?.discountAmount,
    paymentControlModeState?.discountApproveBy?.value,
  ]);

  const getDiscountOtpPayload = () => ({
    patientID: singlePatientData?.PatientID || singlePatientData?.MRNo || "",
    requestedEmpID:
      paymentControlModeState?.discountApproveBy?.value ||
      userData?.employeeID ||
      "",
    discountPercentage: Number(discountPercentageForOtp || 0),
    patientName:
      singlePatientData?.Pname ||
      singlePatientData?.PName ||
      singlePatientData?.PatientName ||
      `${singlePatientData?.Title || ""} ${singlePatientData?.PName || ""}`.trim(),
    age: singlePatientData?.Age || "",
    sex: singlePatientData?.Sex || singlePatientData?.Gender || "",
    patientMobile:
      singlePatientData?.ContactNo || singlePatientData?.Mobile || "",
  });

  const handleSendDiscountOTP = async () => {
    if (!hasDiscountForOtp) {
      notify(t("Please apply discount first"), "warn");
      return;
    }
    if (!paymentControlModeState?.discountApproveBy?.value) {
      notify(t("Approved By is required"), "error");
      return;
    }
    const payload = getDiscountOtpPayload();
    if (!payload?.patientID) {
      notify(t("Please select patient first"), "warn");
      return;
    }
    try {
      const response = await SendDiscountOTP(payload);
      if (response?.success) {
        notify(response?.message || "OTP sent successfully", "success");
        setShowDiscountOtpInput(true);
        setDiscountOtp("");
        setIsDiscountOtpVerified(false);
        setDiscountOtpTimer(60);
      } else {
        notify(response?.message || "Unable to send OTP", "error");
      }
    } catch (error) {
      notify(error?.message || "Unable to send OTP", "error");
    }
  };

  const handleVerifyDiscountOTP = async (otpValue) => {
    const payload = getDiscountOtpPayload();
    try {
      const response = await SaveDiscountOTP({
        otp: otpValue,
        patientID: payload?.patientID,
        requestedEmpID: payload?.requestedEmpID,
      });
      if (response?.success) {
        notify(response?.message || "OTP verified successfully", "success");
        setIsDiscountOtpVerified(true);
      } else {
        notify(response?.message || "Invalid OTP", "error");
        setIsDiscountOtpVerified(false);
      }
    } catch (error) {
      notify(error?.message || "Unable to verify OTP", "error");
      setIsDiscountOtpVerified(false);
    }
  };

  const handleDiscountOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setDiscountOtp(value);
    setIsDiscountOtpVerified(false);
    if (value.length === 6) {
      handleVerifyDiscountOTP(value);
    }
  };

  const setCallingApi = (validateInvestigation) => {
    validateInvestigation();
  };
  const isMemberShipCardAccess = useMemo(() => {
    return testAddingTableState?.some((item) => item?.IsMembershipCard === 1);
  }, [testAddingTableState]);
  useEffect(() => {
    const patID =
      singlePatientData?.PatientID ||
      singlePatientData?.PatientId ||
      singlePatientData?.patientID ||
      singlePatientData?.patientId;
    if (!patID) {
      setPatientMembershipMap(new Map());
      setShowMemeberShipCardAccess([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // OPD booking applies only OPD-applicable (and ALL) membership mappings.
        // The card can hold a panel specific rate, so the patient's panel decides
        // which mapping wins; without it only "All Panels" mappings would match.
        const res = await GetPatientMembershipDetails(
          patID,
          "OPD",
          selectedPanel?.PanelID ||
            payloadData?.panelID?.PanelID ||
            singlePatientData?.PanelID ||
            "",
        );

        if (cancelled || !res?.success) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setPatientMembershipMap(
          new Map(list.map((m) => [Number(m?.ItemId), m])),
        );

        setShowMemeberShipCardAccess(list);
        if (list.length > 0) {
          setPaymentControlModeState((prev) => ({
            ...prev,
            discountReason: "MEMBERSHIP DISCOUNT",
            DiscountReasons1: "Membership Discount",
          }));
        } else {
          setPaymentControlModeState((prev) => ({
            ...prev,
            discountReason: "",
            DiscountReasons1: "",
          }));
        }
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-run when the panel arrives or is changed: on first load the panel is
    // not resolved yet, and switching scheme changes which mapping applies.
  }, [
    singlePatientData?.PatientID,
    singlePatientData?.PatientId,
    singlePatientData?.patientID,
    singlePatientData?.patientId,
    selectedPanel?.PanelID,
    payloadData?.panelID?.PanelID,
  ]);
  console.log(singlePatientData, "singlePatientData");

  return (
    <>
      {checkBlnc?.Balance > 0 && (
        <Modal
          visible={balanceData}
          setVisible={setbalanceData}
          modalWidth={"30vw"}
          Header={t("Balance Data")}
          footer={<></>}
        >
          <BalanceModal balanceData={balanceData} />
        </Modal>
      )}

      {showPatientAdmissionRemarkModal && singlePatientData?.PatientID && (
        <Modal
          visible={showPatientAdmissionRemarkModal}
          setVisible={setShowPatientAdmissionRemarkModal}
          modalWidth={"50vw"}
          Header={t("Patient Remarks")}
          footer={<></>}
        >
          <PatientRemarksModal
            patientId={singlePatientData?.PatientID}
            remarks={patientRemarks}
            onSaved={setPatientRemarks}
          />
        </Modal>
      )}

      {userConfirmation && (
        <Modal
          visible={userConfirmation}
          setVisible={setUserConfirmation}
          modalWidth="30vw"
          Header={t("User verification")}
          buttonType="button"
          modalData={false}
          handleAPI={handleValidateUserToBillConfirmation}
          buttonName={t("Yes")}
          handleCancelComment={handleCancelComment}
        >
          <div className="text-center">
            <div className="position-relative w-100">
              <Input
                inputRef={passwordRef}
                type={showPassword ? "text" : "password"}
                lable={"Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Password")}
                className={`form-control required-fields w-100`}
                style={{ paddingRight: "35px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValidateUserToBillConfirmation();
                }}
              />
              <i
                className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} position-absolute`}
                style={{
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#6c757d",
                  zIndex: 10,
                }}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? t("Hide Password") : t("Show Password")}
              ></i>
            </div>
          </div>
        </Modal>
      )}
      <div className="card patient_registration border py-2">
        <Heading
          title={t("Search Criteria")}
          isBreadcrumb={true}
          secondTitle={
            !UHID && (
              <>
                {/* Always there once a patient is loaded: remarks are read and added
                    here. It blinks only while the patient has at least one remark. */}
                {singlePatientData?.PatientID && (
                  <button
                    className="btn btn-success btn-sm px-3 ml-1"
                    type="button"
                    onClick={() => setShowPatientAdmissionRemarkModal(true)}
                  >
                    <b
                      style={{
                        // Yellow text so the remarks button catches the eye.
                        color: "#FFD700",
                        animation:
                          patientRemarks?.length > 0 ? "blinking 1s infinite" : "none",
                      }}
                    >
                      {t("User Remarks")}
                      {patientRemarks?.length > 0 ? ` (${patientRemarks.length})` : ""}
                    </b>
                  </button>
                )}
                {singlePatientData?.PatientID && (
                  <button
                    className="btn btn-primary btn-sm px-3 ml-1"
                    type="button"
                    onClick={() =>
                      ModalComponent(
                        t("Patient Encounter History"),
                        <PatientEncounterHistory
                          patientId={singlePatientData?.PatientID}
                        />,
                      )
                    }
                  >
                    {t("View Patient History")}
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm px-3 ml-1"
                  onClick={() =>
                    ModalComponent(
                      "Service",
                      <EncounterNoManagment
                        singlePatientData={singlePatientData}
                      />,
                    )
                  }
                >
                  {t("Service")}
                </button>
                {/* Pre Registration: registration form with the pre-registered
                    patient list open; saving loads the patient here, like New Registration. */}
                <button
                  className="btn btn-primary btn-sm px-3 ml-1"
                  onClick={() =>
                    ModalComponent(
                      " Pre Registration",
                      <Index
                        bindDetail={true}
                        bindDetailAPI={handleSinglePatientData}
                        setVisible={setVisible}
                        openPreRegistration={true}
                      />,
                    )
                  }
                >
                  {t("Pre Registration")}
                </button>
                <button
                  className="btn btn-primary btn-sm px-3 ml-1"
                  onClick={() =>
                    ModalComponent(
                      " New Registration",
                      <Index
                        bindDetail={true}
                        bindDetailAPI={handleSinglePatientData}
                        setVisible={setVisible}
                      />,
                    )
                  }
                >
                  {t("New Registration")}
                </button>
              </>
            )
          }
        />
        {Object.keys(singlePatientData)?.length === 0 ? (
          <SearchComponentByUHIDMobileName onClick={handleSinglePatientData} />
        ) : (
          <DetailCard
            ModalComponent={ModalComponent}
            singlePatientData={singlePatientData}
            payloadData={payloadData}
            setPayloadData={setPayloadData}
            sendReset={sendReset}
            visible={visible}
            setVisible={setVisible}
            bindDetailAPI={handleSinglePatientData}
            UHID={UHID ?? false}
            setRelationData={setRelationData}
            lastVisitData={lastVisitData}
            lastVisitItemData={lastVisitItemData}
            medikreditData={medikreditData}
            setMedikreditData={setMedikreditData}
            testAddingTableState={testAddingTableState}
            setPaymentControlModeState={setPaymentControlModeState}
            showMemeberShipCardAccess={showMemeberShipCardAccess}
            testPaymentState={testPaymentState}
            isInsurancePanel={isInsurancePanel}
            isTIDMandatory={isTIDMandatory}
          />
        )}
      </div>
      {Object.keys(singlePatientData)?.length > 0 && (
        <PanelDetailsTable
          singlePatientData={singlePatientData}
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
          testAddingTableState={testAddingTableState}
          showDocumentUpload
          isOpdServiceBooking
          onPendingDocuments={(panelID, docs) =>
            setPendingPanelDocs((prev) => ({ ...prev, [panelID]: docs }))
          }
        />
      )}
      <TestPayment
        selectedPanel={selectedPanel}
        testPaymentState={testPaymentState}
        setTestPaymentState={setTestPaymentState}
        payloadData={payloadData}
        setPayloadData={setPayloadData}
        singlePatientData={singlePatientData}
        setTestAddingTable={setTestAddingTable}
        testAddingTableState={testAddingTableState}
        handlePaymentGateWay={handlePaymentGateWay}
        TestData={TestData ?? []}
        presetSlot={presetSlot}
        UHID={UHID ?? false}
        isUserInteraction={isUserInteraction}
        isMemberShipCardAccess={isMemberShipCardAccess}
        patientMembershipMap={patientMembershipMap}
        onBindReferral={handleBindReferral}
        // apiCalling={apiCalling}
        // sendFunctionToParent={sendFunctionToParent}
      />


      <TestAddingTable
        /* The flag that used to gate the popup now gates the button. Off, and
           the table renders exactly as it always did. */
        onBookDayCare={
          isDayCarePackageBooking
            ? (row) => setDayCareBookingModal({ isShow: true, packageRow: row })
            : undefined
        }
        bodyData={testAddingTableState || []}
        setBodyData={setTestAddingTable}
        handlePaymentGateWay={handlePaymentGateWay}
        paymentControlModeState={paymentControlModeState}
        setPaymentControlModeState={setPaymentControlModeState}
        singlePatientData={singlePatientData}
        payloadData={payloadData}
        discounts={discounts}
        THEAD={[...THEAD.slice(0, -1), "House Type", THEAD[THEAD.length - 1]]}
        showHouse={true}
        handleChange={handleChange}
        UHID={UHID ?? false}
        patientMembershipMap={patientMembershipMap}
        selectedPanel={selectedPanel}
      />

      <PaymentGateway
        screenType={paymentControlModeState}
        setScreenType={setPaymentControlModeState}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        discounts={discounts}
        testAddingTableState={testAddingTableState}
        singlePatientData={singlePatientData}
        setTestAddingTable={setTestAddingTable}
        thermalPrintout={{
          placeholderName: t("Thermal Printout"),
          id: "isThermal",
          dynamicOptions: [
            { label: t("Yes"), value: "1" },
            { label: t("No"), value: "0" },
          ],
          value: payloadData?.isThermal,
          name: "isThermal",
          handleChange: handleReactSelectData,
        }}
        onRazorpayClick={openRzp}
        loyalty={{
          patientID: singlePatientData?.PatientID || singlePatientData?.PatientId || "",
          applied: loyaltyApplied,
          setApplied: setLoyaltyApplied,
        }}
        button={
          <div className="w-100">
            {isOtpDiscountEnabled && isApprovedByEnabled && !loyaltyApplied ? (
              <div className="row align-items-center">
                <div className="col-12 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3">
                  <button
                    className="button w-100"
                    type="button"
                    onClick={handleSendDiscountOTP}
                    disabled={discountOtpTimer > 0 || isDiscountOtpVerified}
                  >
                    {isDiscountOtpVerified
                      ? t("OTP Verified")
                      : discountOtpTimer > 0
                        ? `${t("OTP")} ${discountOtpTimer}s`
                        : t("OTP")}
                  </button>
                </div>
                {showDiscountOtpInput && (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3">
                    <Input
                      type="text"
                      className={`form-control text-center ${isDiscountOtpVerified ? "border-success" : ""
                        }`}
                      id="DiscountOTP"
                      name="DiscountOTP"
                      value={discountOtp}
                      onChange={handleDiscountOtpChange}
                      disabled={isDiscountOtpVerified}
                      placeholder="000000"
                      maxLength="6"
                      respclass=""
                      style={{
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    />
                  </div>
                )}
                {canShowSaveButton && (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3">
                    <button className="button w-100" onClick={handleSave}>
                      {t("Save")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="button" onClick={handleSave}>
                {t("Save")}
              </button>
            )}
          </div>
        }
      />

      <OverLay
        visible={visible}
        setVisible={setVisible}
        Header={renderComponent?.name}
      >
        {renderComponent?.component}
      </OverLay>

      {renderNotification}

      <Modal
        modalWidth="50vw"
        visible={!!openMessageModal}
        setVisible={setOpenMessageModal}
        Header={t("Confirmation Consent")}
        footer={<></>}
      >
        <ConsentConfrimationModal
          patientData={{
            ...singlePatientData,
            PatientID:
              openMessageModal?.patientID || singlePatientData?.PatientID || "",
          }}
          transactionId={
            openMessageModal?.transactionId ||
            openMessageModal?.transactionID ||
            appointmentID ||
            ""
          }
          onClose={() => setOpenMessageModal(false)}
        />
      </Modal>

      {isDayCarePackageBooking && dayCareBookingModal.isShow && (
        <Modal
          visible={dayCareBookingModal.isShow}
          setVisible={() => setDayCareBookingModal({ isShow: false, packageRow: null })}
          Header={t("Day Care Session Booking")}
          modalWidth="80vw"
          footer={<></>}
        >
          <DayCarePackageBookingModal
            singlePatientData={singlePatientData}
            packageRow={dayCareBookingModal.packageRow}
            doctorID={payloadData?.DoctorID}
            panelID={selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID}
            opdTransactionID={appointmentID}
            onBooked={(res) => {
              const group = res?.BookingGroupNo ?? res?.bookingGroupNo;
              if (group) setDayCareGroups((g) => (g.includes(group) ? g : [...g, group]));
            }}
            onClose={() => setDayCareBookingModal({ isShow: false, packageRow: null })}
          />
        </Modal>
      )}

      {rzpOpen && (
        <RazorpayPaymentModal
          visible={rzpOpen}
          setVisible={setRzpOpen}
          amount={rzpAmount ?? paymentControlModeState?.minimumPayableAmount}
          patientName={
            singlePatientData?.PName ||
            singlePatientData?.PatientName ||
            singlePatientData?.Pname ||
            ""
          }
          mobile={singlePatientData?.ContactNo || singlePatientData?.Mobile || ""}
          patientID={singlePatientData?.PatientID || singlePatientData?.MRNo || ""}
          centreId={userData?.centreID || localdata?.defaultCentre || ""}
          userId={userData?.employeeID || ""}
          onPaid={handleRzpPaid}
        />
      )}

      {showExpiredModal && (
        <Modal
          visible={showExpiredModal}
          setVisible={handleCloseModal}
          Header={t("Document Expiry Alert")}
          modalWidth="50vw"
          footer={
            // <div className="d-flex justify-content-end p-2">
            //   <button
            //     className="btn btn-danger btn-sm"
            //     onClick={handleCloseModal}
            //   >
            //     {t("Close")}
            //   </button>
            // </div>
            <></>
          }
        >
          <div className="text-center p-3">
            <i className="fa fa-exclamation-triangle text-warning fa-3x mb-3" aria-hidden="true"></i>
            <h5 className="text-danger mb-3">
              <strong>{t("Expired Document Details")}</strong>
            </h5>
            <p className="font-weight-bold text-danger" style={{ fontSize: "16px", lineHeight: "1.6" }}>
              {expiredMsg}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}

const DetailCard = ({
  ModalComponent,
  singlePatientData,
  payloadData,
  setPayloadData,
  sendReset,
  visible,
  setVisible,
  bindDetailAPI,
  UHID,
  setRelationData,
  lastVisitData,
  lastVisitItemData,
  medikreditData,
  setMedikreditData,
  testAddingTableState,
  setPaymentControlModeState,
  showMemeberShipCardAccess,
  testPaymentState,
  isInsurancePanel,
  isTIDMandatory,
}) => {
  const [t] = useTranslation();
  const dispatch = useDispatch();
  // Who this patient was last referred by (an Out referral); see the agent effect below.
  const lastReferDoctorRef = useRef(null);
  let ip = useLocalStorage("ip", "get");

  const {
    GetBindReferDoctorList,
    GetReferTypeList,
    GetDepartmentList,
    PageConfigurationAPIList,
    GetGlobalResources: detailGlobalResources,
    CentreWisePanelControlCacheList,
  } = useSelector((state) => state?.CommonSlice);
  const referOutDefault = isReferOutDefaultOn(detailGlobalResources);

  /* Parent-panel rule (fin_global_resources):
     OPDRuleParentPanelID            - parent panel ID(s), comma separated
     OPDRuleConsultationSubCategoryID - consultation subcategory ID(s), comma separated
     When the Parent Panel chosen below is one of the first key's panels, the Doctor list
     keeps only doctors with an OPD timing for those subcategories, and the consultation
     added for the doctor is of that subcategory (TestPayment reads
     payloadData.RuleSubCategoryIDs). Either key empty = no rule. */
  const ruleKeyList = (name) =>
    String(
      (Array.isArray(detailGlobalResources) &&
        detailGlobalResources.find((item) => item?.Name === name)?.Value) ||
        "",
    )
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  const ruleParentPanelIDs = ruleKeyList("OPDRuleParentPanelID");
  const ruleSubCategoryIDs = ruleKeyList("OPDRuleConsultationSubCategoryID");
  const isParentPanelRuleOn =
    ruleParentPanelIDs.length > 0 && ruleSubCategoryIDs.length > 0;

  // fin_global_resources.HideDoctorOnOPDBooking = 1: hides the top Doctor field (and its
  // required validation) on this screen. Row off or missing - field shows as before.
  const isDoctorFieldHidden =
    String(
      (Array.isArray(detailGlobalResources)
        ? detailGlobalResources.find((item) => item?.Name === "HideDoctorOnOPDBooking")?.Value
        : "") ?? "",
    ).trim() === "1";

  useEffect(() => {
    if (isParentPanelRuleOn && !CentreWisePanelControlCacheList?.length) {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      dispatch(
        CentreWisePanelControlCache({
          centreID: userData?.defaultCentre || userData?.centreID,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParentPanelRuleOn]);

  // Parent panels: top-level panels plus any panel that is another panel's parent.
  const parentPanelOptions = useMemo(() => {
    const list = Array.isArray(CentreWisePanelControlCacheList)
      ? CentreWisePanelControlCacheList
      : [];
    const parentIDs = new Set(
      list
        .filter((p) => Number(p?.TypeID) === 1 && Number(p?.ParentID) > 0)
        .map((p) => String(p?.ParentID)),
    );
    const seen = new Set();
    return list
      .filter(
        (p) =>
          Number(p?.TypeID) === 5 ||
          (Number(p?.TypeID) === 1 && parentIDs.has(String(p?.ValueField))),
      )
      .filter((p) => {
        const key = String(p?.ValueField);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((p) => ({ label: p?.TextField, value: String(p?.ValueField) }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [CentreWisePanelControlCacheList]);

  // Default: the parent of the panel chosen in Panel Details.
  useEffect(() => {
    if (!isParentPanelRuleOn) return;
    const parentID = String(
      payloadData?.panelID?.ParentPanelID ?? payloadData?.panelID?.ParentID ?? "",
    );
    setPayloadData((prev) => ({ ...prev, RuleParentPanelID: parentID }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadData?.panelID?.PanelID, isParentPanelRuleOn]);

  const isRuleActive =
    isParentPanelRuleOn &&
    ruleParentPanelIDs.includes(String(payloadData?.RuleParentPanelID ?? ""));
  const ruleSubCategoryKey = isRuleActive ? ruleSubCategoryIDs.join(",") : "";

  // Hand the active subcategories to TestPayment through payloadData.
  useEffect(() => {
    setPayloadData((prev) =>
      (prev?.RuleSubCategoryIDs || []).join(",") === ruleSubCategoryKey
        ? prev
        : {
            ...prev,
            RuleSubCategoryIDs: ruleSubCategoryKey
              ? ruleSubCategoryKey.split(",")
              : [],
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleSubCategoryKey]);

  // Doctors allowed by the rule.
  const [ruleDoctorIDs, setRuleDoctorIDs] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!ruleSubCategoryKey) {
      setRuleDoctorIDs(null);
      return;
    }
    (async () => {
      const res = await OPDDoctorsBySubCategory(ruleSubCategoryKey);
      if (!cancelled)
        setRuleDoctorIDs(
          res?.success && Array.isArray(res?.data)
            ? res.data.map((id) => String(id).trim())
            : [],
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [ruleSubCategoryKey]);

  // Same fin_global_resources key the bill printout reads, so the unit's doctors
  // either show everywhere (dropdown hover and print) or nowhere.
  const showUnitDoctorNames =
    detailGlobalResources?.find((item) => item?.Name === "ShowUnitDoctorNames")
      ?.Value === "1";

  const relationCheckList = singlePatientData?.PatientRelationData?.filter(
    (rel) => rel?.IsPersonal === 1,
  );

  const [selectedRelations, setSelectedRelations] = useState(relationCheckList);
  const [ECHSDoctors, setECHSDoctors] = useState([]);
  const [ECHSPolyclinics, setECHSPolyclinics] = useState([]);
  const [referEmployeesList, setReferEmployeesList] = useState([]);
  const [handleModelData, setHandleModelData] = useState({});
  // Field Boy dropdown ki list, aur ek counter jo har save ke baad badhta hai
  // taaki modal apni list dobara le aaye aur form khaali ho jaye.
  const [fieldBoyList, setFieldBoyList] = useState([]);

  const [modalData, setModalData] = useState({});
  const [samartList, setSamartList] = useState({});
  const [membershipCardOpen, setMembershipCardOpen] = useState(false);

  const [values, setValues] = useState({
    contactNo: singlePatientData?.Mobile,
  });

  const [DropDownState, setDropDownState] = useState({
    getBindPanelByPatientID: [],
    getBindProList: [],
    getDoctorDeptWise: [],
  });
  const [agentList, setAgentList] = useState([]);

  // Agents mapped to the given PRO (ProID saved with the agent).
  const agentsOfPro = (proId) =>
    Number(proId) > 0
      ? agentList.filter((ele) => Number(ele?.ProID) === Number(proId))
      : [];

  // Agent dropdown shows the selected PRO's agents; with no PRO, or a PRO that
  // has no agent mapped yet, every agent stays available.
  const agentOptions = useMemo(() => {
    const proAgents = agentsOfPro(payloadData?.proId);
    return proAgents.length > 0 ? proAgents : agentList;
  }, [agentList, payloadData?.proId]);

  /* The walk-in PRO and the walk-in agent, picked by name rather than by id.

     Both exist as ordinary master records - "WalkIN" on f_pro_master, "Mr. Walkin" on
     f_agent_master - and their ids differ from one site to the next, so matching the name
     is what travels. Spaces, case and the Title prefix are all ignored, because the two
     are spelt differently from each other already.

     A booking that came through nobody is still a walk-in, and saying so is more use than
     leaving the field blank for somebody to wonder about later. Anything actually picked
     is left alone - this only fills an empty box. */
  const isWalkIn = (option) =>
    String(option?.label ?? "")
      .replace(/[^a-z]/gi, "")
      .toLowerCase()
      .endsWith("walkin");

  const WALK_IN_PRO = useMemo(
    () => (DropDownState?.getBindProList || []).find(isWalkIn),
    [DropDownState?.getBindProList],
  );

  const WALK_IN_AGENT = useMemo(() => agentList.find(isWalkIn), [agentList]);

  useEffect(() => {
    setPayloadData((prev) => {
      const next = { ...prev };
      let changed = false;

      /* proId is held as the bare id, the way picking one from the dropdown holds it -
         the payload sends Number(proId), so an option object here would go as NaN.
         agentID is held as the whole option, which is how the PRO change already sets it
         and what the payload reads. */
      if (WALK_IN_PRO && !prev?.proId) {
        next.proId = WALK_IN_PRO?.value;
        next.proName = WALK_IN_PRO?.label;
        changed = true;
      }
      if (WALK_IN_AGENT && !prev?.agentID) {
        next.agentID = WALK_IN_AGENT;
        changed = true;
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WALK_IN_PRO, WALK_IN_AGENT]);

  /* fin_global_resources 'DoctorID_Self' = the doctor id of "Dr. Self". When set, the
     Doctor field defaults to that doctor and stays editable. */
  const SELF_DOCTOR_ID = String(
    (Array.isArray(detailGlobalResources)
      ? detailGlobalResources.find((item) => item?.Name === "DoctorID_Self")?.Value
      : "") ?? "",
  ).trim();

  // Default only: set Self when no doctor is chosen yet, so the user can still change it.
  // Without the DoctorID_Self resource, fall back to the doctor named "Self" in the list.
  const defaultSelfDoctorID =
    SELF_DOCTOR_ID ||
    String(
      (DropDownState?.getDoctorDeptWise || []).find((d) =>
        /^(dr\.?\s*)?self$/i.test(String(d?.label ?? "").trim()),
      )?.value ?? "",
    ).trim();

  useEffect(() => {
    if (!defaultSelfDoctorID) return;
    // A patient with no earlier visit comes back with DoctorID "0" (or blank), which is "none".
    const isNoDoctor = (id) => ["", "0"].includes(String(id ?? "").trim());
    setPayloadData((prev) =>
      isNoDoctor(prev?.DoctorID) ? { ...prev, DoctorID: defaultSelfDoctorID } : prev,
    );
  }, [defaultSelfDoctorID, payloadData?.DoctorID]);




  // A unit (doctor_master.IsUnit=1) stands for several doctors, so hovering the
  // Doctor field names them instead of just repeating "Doctor". The tooltip text
  // is rendered with white-space: pre-line, so \n gives one doctor per line.
  const doctorTooltipContent = useMemo(() => {
    const selectedDoctor = DropDownState?.getDoctorDeptWise?.find(
      (option) => String(option?.value) === String(payloadData?.DoctorID),
    );

    if (
      !showUnitDoctorNames ||
      !selectedDoctor ||
      Number(selectedDoctor?.IsUnit) !== 1
    ) {
      return "";
    }

    // UnitDoctorNames arrives pipe separated from BindDoctorDept.
    const unitDoctorNames = String(selectedDoctor?.UnitDoctorNames || "")
      .split("|")
      .map((doctorName) => doctorName.trim())
      .filter(Boolean);

    const heading = `${selectedDoctor?.label} - ${t("Total Doctor")}: ${
      Number(selectedDoctor?.UnitDoctorCount) || unitDoctorNames.length
    }`;

    return unitDoctorNames.length > 0
      ? `${heading}\n${unitDoctorNames.join("\n")}`
      : heading;
  }, [
    DropDownState?.getDoctorDeptWise,
    payloadData?.DoctorID,
    showUnitDoctorNames,
    t,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayloadData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  console.log(DropDownState?.getDoctorDeptWise, "GetBindReferDoctorList");
  const handleFetchData = async () => {
    try {
      const payload = {
        patientid: singlePatientData?.PatientID ?? "",
        panelid: payloadData?.panelID?.PanelID ?? "",
        IntegrationId: "1",
      };
      const response = await GetMemberDetails(payload);
      if (response?.success) {
        setHandleModelData({
          label: t("Details"),
          buttonName: t(""),
          width: "30vw",
          isOpen: true,
          Component: <SmartDetails />,
          handleInsertAPI: saveReferalDoctor,
        });
      } else {
        notify(response?.message, "success");
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const CardCheckAndSlade = async (PanelID) => {
    try {
      const response = await BindSmartCardCheckAndSlade(198);
      if (response?.success) {
        setSamartList(() => ({
          Smart: handleReactSelectDropDownOptions(response?.data, "Name", "Id"),
        }));
      } else {
        setSamartList([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChecked = (e) => {
    const { checked, name } = e.target;
    setPayloadData((prev) => ({
      ...prev,
      Smart: { label: "select", value: "0" },
      [name]: checked,
    }));
  };

  const handlePanelReactSelectChange = (name, e) => {
    if (name === "panelID") {
      CardCheckAndSlade(e?.PanelID);
    }

    if (name === "Integration") {
      setPayloadData((prev) => ({
        ...prev,
        [name]: e,
      }));
      return;
    }
    if (Number(e?.value) === 5) {
      ModalComponent(
        "Choose Dependants",
        <MedikreditPopup
          singlePatientData={singlePatientData}
          setVisible={setVisible}
          Panel={payloadData?.panelID}
          onSelectRow={(data) => {
            setMedikreditData(data);
          }}
        />,
      );
      setPayloadData((prev) => ({
        ...prev,
        [name]: e,
      }));
    } else {
      const data = DropDownState?.getBindPanelByPatientID.find(
        (ele) => Number(ele?.value) === Number(e?.value),
      );

      setPayloadData((prev) => ({
        ...prev,
        [name]: data,
      }));
    }
  };

  useEffect(() => {
    CardCheckAndSlade(singlePatientData?.PanelID);
  }, [singlePatientData]);

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  const handleReactSelectChange = async (name, e) => {
    switch (name) {
      case "referDoctorID":
        // handleBindPRO(e?.value);
        setPayloadData((prev) => ({
          ...prev,
          [name]: e?.value,
          referDoctorName: e?.label,
        }));
        break;
      case "DepartmentID":
        const data = await handleDoctorDeptWise(e?.label);
        setDropDownState({
          ...DropDownState,
          getDoctorDeptWise: handleReactSelectDropDownOptions(
            data,
            "Name",
            "DoctorID",
          ),
        });

        setPayloadData((prev) => ({
          ...prev,
          [name]: e?.value,
        }));

      case "referalTypeID":
        setPayloadData((prev) => ({
          ...prev,
          [name]: e,
          referDoctorID:
            e?.value === 4
              ? payloadData?.DoctorID
              : e?.value === REFERRAL_TYPE_OUT && lastReferDoctorRef.current
                ? lastReferDoctorRef.current.value
                : "",
          ...(e?.value === REFERRAL_TYPE_OUT && lastReferDoctorRef.current
            ? { referDoctorName: lastReferDoctorRef.current.label }
            : {}),
        }));
        break;

      case "DoctorID":
        setPayloadData((prev) => ({
          ...prev,
          [name]: e?.value,
          SelectDoctor: e?.value,
          DoctorName: e.label,
          referDoctorID: handlereferDocotorIDByReferalType(
            payloadData?.referalTypeID?.value,
            e?.value,
            payloadData?.referDoctorID,
          ),
        }));
        break;

      case "ECHSDoctorID":
        fetchECHSPolyclinic(e.value);
        setPayloadData((val) => ({ ...val, [name]: e?.value }));
        break;

      case "fieldBoyID":
        setPayloadData((val) => ({
          ...val,
          [name]: e?.value,
          fieldBoyName: e?.label,
        }));
        break;
      case "proId": {
        // Agents are saved with a PRO, so picking a PRO brings its agent along:
        // one agent -> selected; several -> kept only if the current one is among
        // them; none mapped -> the agent already chosen is left alone.
        const proAgents = agentsOfPro(e?.value);
        setPayloadData((val) => {
          const currentAgentID = Number(val?.agentID?.value ?? val?.agentID ?? 0);
          let agentID = val?.agentID;
          if (proAgents.length === 1) {
            agentID = proAgents[0];
          } else if (
            proAgents.length > 1 &&
            !proAgents.some((ele) => Number(ele?.value) === currentAgentID)
          ) {
            agentID = "";
          }
          return { ...val, [name]: e?.value, proName: e?.label, agentID };
        });
        break;
      }
      default:
        setPayloadData((prev) => ({
          ...prev,
          [name]: e?.value,
        }));
        break;
    }
  };

  const fetchECHSDoctors = async () => {
    try {
      const data = await getECHSDoctorsListApi();
      setECHSDoctors(
        data?.data?.map((ele) => ({
          label: ele?.DoctorName,
          value: ele?.DoctorID,
        })),
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchReferEmployees = async () => {
    try {
      const data = await getReferEmployeesListApi();
      setReferEmployeesList(
        data?.data?.map((ele) => ({
          label: ele?.EmployeeName,
          value: ele?.EmployeeID,
        })),
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchECHSPolyclinic = async (ECHSDoctorID) => {
    try {
      const data = await getECHSPolyclinicListApi(ECHSDoctorID);
      if (data?.success) {
        setPayloadData((prev) => ({
          ...prev,
          ECHSDoctorID: ECHSDoctorID,
          ECHSPolyclinic: data?.data[0]?.PolyclinicID,
        }));
      }
      setECHSPolyclinics(
        data?.data?.map((ele) => ({
          label: ele?.PolyclinicName,
          value: ele?.PolyclinicID,
        })),
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleBindPanelByPatientID = async () => {
    try {
      const patID =
        singlePatientData?.PatientID ||
        singlePatientData?.PatientId ||
        singlePatientData?.patientID ||
        singlePatientData?.patientId;
      const data = await bindPanelByPatientID(patID);
      return data.data;
    } catch (error) {
      console.log(error);
    }
  };

  const handleBindPRO = async (referDoctorID) => {
    try {
      const data = await BindPRO(referDoctorID);
      setDropDownState({
        ...DropDownState,
        getBindProList: handleReactSelectDropDownOptions(
          data?.data,
          "ProName",
          "Pro_ID",
        ),
      });
    } catch (error) {
      console.log(error);
    }
  };

  /* The Doctor dropdown can only show a doctor its option list holds, and that
     list is loaded per department. When a doctor arrives from outside this card -
     binding a referral sets DoctorID on the booking header - reload the list for
     the selected department so the name actually appears instead of a blank box. */
  useEffect(() => {
    const doctorID = payloadData?.DoctorID;
    if (!doctorID) return;
    const options = DropDownState?.getDoctorDeptWise || [];
    if (options.some((o) => String(o?.value) === String(doctorID))) return;
    let active = true;
    (async () => {
      const deptName =
        handleReactSelectDropDownOptions(GetDepartmentList, "Name", "ID").find(
          (d) => String(d?.value) === String(payloadData?.DepartmentID),
        )?.label || "ALL";
      const list = await handleDoctorDeptWise(deptName);
      if (!active) return;
      setDropDownState((prev) => ({
        ...prev,
        getDoctorDeptWise: handleReactSelectDropDownOptions(
          list,
          "Name",
          "DoctorID",
        ),
      }));
    })();
    return () => {
      active = false;
    };
  }, [payloadData?.DoctorID, payloadData?.DepartmentID]);

  const getProNameList = async () => {
    try {
      const response = await BasicMasterBindPro();
      if (response?.success) {
        return response?.data;
      }
      console.error("Pro Name List not loaded:", response?.message);
    } catch (error) {
      console.error("Error fetching Pro Name List:", error);
    }
    return [];
  };

  // The BindPro API has been seen returning the columns in different casings,
  // so the option list is built from whichever pair is present on the row.
  const buildProOptions = (data) =>
    (Array.isArray(data) ? data : [])
      .map((ele) => ({
        ...ele,
        label: ele?.ProName ?? ele?.proName ?? ele?.PRONAME ?? "",
        value: ele?.Pro_ID ?? ele?.pro_ID ?? ele?.proID ?? ele?.ProID ?? "",
      }))
      .filter((ele) => ele?.label);

  const handleDoctorDeptWise = async (Department) => {
    try {
      const data = await GetBindDoctorDept(Department);
      return data?.data;
    } catch (error) {
      console.log(error);
    }
  };

  const saveProName = async (modalData) => {
    const proName = modalData?.name?.trim();
    if (!proName) {
      notify(t("Name is required"), "error");
      return;
    }

    try {
      let payload = {
        proName: proName,
        ipaddress: ip || "",
      };
      const response = await AssetBasicMasterSavePro(payload);
      if (response?.success) {
        notify(response?.message || "Pro name saved successfully", "success");
        setIsOpen();
        setModalData({});
        // Reload only the PRO list and select the PRO just added. FetchAllDropDown
        // used to replace every dropdown here and left the new PRO unselected (or
        // missing, when the list was the refer doctor's mapped PROs). SavePro returns
        // no ID, so the new row is found by its name.
        const proList = buildProOptions(await getProNameList());
        if (proList?.length) {
          setDropDownState((prev) => ({ ...prev, getBindProList: proList }));
        }
        const savedPro = proList?.find(
          (ele) =>
            String(ele?.label ?? "").trim().toLowerCase() ===
            proName.toLowerCase(),
        );
        if (savedPro) {
          // proId is held as the bare id (the payload sends Number(proId)).
          setPayloadData((prev) => ({
            ...prev,
            proId: savedPro.value,
            proName: savedPro.label,
          }));
        }
      } else {
        notify(
          response?.error || response?.message || "Error saving Pro Name",
          "error",
        );
      }
    } catch (error) {
      console.error("Error saving Pro Name:", error);
      notify(error?.message || "Error saving Pro Name", "error");
    }
  };

  // Agent master for the booking screen: the list feeds the dropdown, and a new
  // agent saved from the modal is selected straight away.
  const buildAgentOptions = (data) =>
    (Array.isArray(data) ? data : []).map((ele) => ({
      ...ele,
      label: `${ele?.Title ? ele.Title + " " : ""}${ele?.AgentName ?? ""}`.trim(),
      value: ele?.AgentID,
    }));

  const getAgentList = async () => {
    try {
      const response = await BindAgent(1);
      if (response?.success) {
        return response?.data;
      }
    } catch (error) {
      console.error("Error fetching Agent List:", error);
    }
    return [];
  };

  const refreshAgentList = async () => {
    const list = buildAgentOptions(await getAgentList());
    setAgentList(list);
    return list;
  };

  const saveAgent = async (modalData) => {
    const agentName = modalData?.name?.trim();
    if (!agentName) {
      notify("Agent Name is required", "error");
      return;
    }

    try {
      const payload = {
        agentID: 0,
        title: modalData?.title?.value || "",
        agentName: agentName,
        mobile: modalData?.contactNo || "",
        address: modalData?.address || "",
        pincode: modalData?.pincode || "",
        proID: Number(modalData?.proName?.value || 0),
        ipaddress: ip || "",
      };
      const response = await SaveAgent(payload);
      if (response?.success) {
        notify(response?.message || "Agent saved successfully", "success");
        setIsOpen();
        setModalData({});
        const list = await refreshAgentList();
        const savedAgent = list?.find(
          (ele) =>
            String(ele?.AgentName ?? "").trim().toLowerCase() ===
            agentName.toLowerCase(),
        );
        if (savedAgent) {
          setPayloadData((prev) => ({ ...prev, agentID: savedAgent }));
        }
      } else {
        notify(response?.message || "Error saving Agent", "error");
      }
    } catch (error) {
      console.error("Error saving Agent:", error);
      notify(error?.message || "Error saving Agent", "error");
    }
  };

  const handleBindFieldBoy = async () => {
    try {
      const resp = await BindFieldBoy();
      const rows = resp?.success || resp?.status ? resp?.data || [] : [];
      setFieldBoyList(
        handleReactSelectDropDownOptions(rows, "FieldBoyName", "FieldBoyID"),
      );
    } catch (error) {
      console.error("Error fetching Field Boy List:", error);
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
        doctorCode: modalData?.nextDoctorCode || 0,
      };

      const response = await BillingIPDSaveReferDoctor(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setIsOpen();
        setModalData({});
        dispatch(GetBindReferDoctor());
      } else {
        notify(response?.message, "error");
        setIsOpen();
        setModalData({});
      }
    } catch (error) {
      console.error("Error saving Pro Name:", error);
    }
  };

  const FetchAllDropDown = async () => {
    try {
      const response = await Promise.all([
        handleBindPanelByPatientID(),
        handleDoctorDeptWise(payloadData?.DepartmentID),
        getProNameList(),
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

        getBindProList: buildProOptions(response[2]),
      };
      setDropDownState(responseDropdown);
      handleBindFieldBoy();

      setPayloadData((prev) => ({
        ...prev,
        panelID: DropDownState?.getBindPanelByPatientID?.find(
          (ele) => ele["isDefaultPanel"] === 1,
        ),
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    setPayloadData((prev) => ({
      ...prev,
      panelID: DropDownState?.getBindPanelByPatientID?.find(
        (ele) => ele["isDefaultPanel"] === 1,
      ),
    }));
  }, [DropDownState?.getBindPanelByPatientID]);

  const FALLBACK_SOURCE_OPTIONS = [
    { label: t("OPD"), value: "OPD" },
    { label: t("EMG"), value: "EMG" },
    { label: t("OUTSOURCE"), value: "OUTSOURCE" },
  ];
  const [sourceOptions, setSourceOptions] = useState(FALLBACK_SOURCE_OPTIONS);
  useEffect(() => {
    GetOPDSources().then((res) => {
      if (res?.status && Array.isArray(res?.data) && res.data.length > 0) {
        setSourceOptions(res.data.map((r) => ({ label: r.label, value: r.label })));
      }
      // if API fails or empty → keep FALLBACK_SOURCE_OPTIONS
    });
  }, []);

  const handleDataInDetailView = useMemo(() => {
    const data = [
      {
        label: t("PatientID"),
        value: `${singlePatientData?.PatientID}`,
      },
      {
        label: t("Patient Name"),
        value: `${singlePatientData?.Title} ${singlePatientData?.PName}`,
      },
      {
        label: t("Gender/Age"),
        value: `${singlePatientData?.Gender} / ${singlePatientData?.Age}`,
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
  }, [singlePatientData]);

  useEffect(() => {
    FetchAllDropDown();
    fetchECHSDoctors();
    refreshAgentList();
  }, [visible]);

  // A patient who came through an agent last time keeps that agent, so it is
  // bound as soon as the patient is loaded instead of being picked again.
  useEffect(() => {
    const patientId =
      singlePatientData?.PatientID ||
      singlePatientData?.PatientId ||
      singlePatientData?.patientID;
    if (!patientId) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await BindPatientAgent(patientId);
        const agent = response?.data;
        if (cancelled) return;

        /* The doctor this patient was last referred by (an Out referral). A patient who
           went Out before comes in as Out with that doctor; one who did not stays on, or
           goes back to, Self. Kept for the Refer Type box too, so choosing Out later
           binds the doctor. */
        const lastReferDoctor =
          response?.success && Number(agent?.ReferDoctorID) > 0
            ? {
                value: Number(agent.ReferDoctorID),
                label: agent?.ReferDoctorName ?? "",
              }
            : null;
        lastReferDoctorRef.current = referOutDefault ? lastReferDoctor : null;
        if (referOutDefault) {
          setPayloadData((prev) => {
            if (lastReferDoctor) {
              return {
                ...prev,
                referalTypeID: { label: "Out", value: REFERRAL_TYPE_OUT },
                referDoctorID: lastReferDoctor.value,
                referDoctorName: lastReferDoctor.label,
              };
            }
            // No Out referral on record: an earlier patient's Out must not carry over.
            return Number(prev?.referalTypeID?.value) === REFERRAL_TYPE_OUT
              ? {
                  ...prev,
                  referalTypeID: { label: "Self", value: 4 },
                  referDoctorID: prev?.DoctorID ?? "",
                  referDoctorName: "",
                }
              : prev;
          });
        }

        if (!response?.success) return;
        // Agent comes from the patient; PRO from the patient's last visit that
        // had one (else the agent's PRO). Each is bound only when it exists.
        setPayloadData((prev) => ({
          ...prev,
          ...(Number(agent?.AgentID) > 0 && {
            agentID: {
              ...agent,
              label: `${agent?.Title ? agent.Title + " " : ""}${agent?.AgentName ?? ""}`.trim(),
              value: agent?.AgentID,
            },
          }),
          ...(Number(agent?.ProID) > 0 && {
            proId: Number(agent.ProID),
            proName: agent?.ProName ?? "",
          }),
        }));
      } catch (error) {
        console.error("Error binding patient agent:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [singlePatientData]);

  useEffect(() => {
    dispatch(GetBindReferDoctor());
    dispatch(GetBindReferalType());
    dispatch(GetBindDepartment());
    fetchReferEmployees();
  }, []);

  useEffect(() => {
    setRelationData(selectedRelations);
  }, [selectedRelations]);

  const findReferDisable = (GetReferTypeListData, KeyMatch, valueMatch) => {
    return GetReferTypeListData?.find(
      (ele) => Number(ele[KeyMatch]) === Number(valueMatch),
    );
  };

  let PatientRegistrationArg = {
    PatientID: singlePatientData?.PatientID,
    setVisible: setVisible,
    bindDetailAPI: bindDetailAPI,
    handleBindPanelByPatientID: handleBindPanelByPatientID,
  };

  const getDynamicOptionData = (CommonAPITypeID, ControlName) => {
    let data;
    if (ControlName === "ECHSDoctorID") {
      data = ECHSDoctors;
    } else if (ControlName === "ECHSPolyclinic") {
      data = ECHSPolyclinics;
    } else if (ControlName === "ReferEmpID") {
      data = referEmployeesList;
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

  const dynamicForm = useMemo(() => {
    return (
      <DynamicForm
        dynamicData={PageConfigurationAPIList?.filter(
          (ele) => ele?.IsActive === 1 && ele?.URLID === 7,
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
    ECHSDoctors,
    ECHSPolyclinics,
    referEmployeesList,
    payloadData,
  ]);

  const validateCoupon = async () => {
    try {
      if (!payloadData?.couponCode) {
        return notify(t("Please Enter Coupon Code"), "error");
      }
      const payload = {
        CoupanCode: payloadData?.couponCode,
        CategoryId: 0,
        SubCategoryId: 0,
      };
      const response = await CoupanValidateCoupan(payload);
      if (response?.success) {
        console.log("resposne", response?.data);
        const discPer = response?.data?.discPer || 0;
        setPayloadData((prev) => ({
          ...prev,
          couponDiscountPercentage: discPer,
        }));
        debugger
        setPaymentControlModeState((prev) => ({
          ...prev,
          Remark: `Coupoun Discount : ${payloadData?.couponCode}`,
          discountReason: "CAMP DISCOUNT",
          DiscountReasons1: "Coupon Discount",
        }));
        notify(response?.message, "success");
      } else {
        notify(response?.message, "error");
      }
    } catch (e) {
      console.error(e.message);
      notify(e.message, "error");
    }
  };

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
      <DetailsCardForDefaultValue
        singlePatientData={handleDataInDetailView}
        PatientRegistrationArg={PatientRegistrationArg}
        ModalComponent={ModalComponent}
        sendReset={sendReset}
        show={UHID}
      >
        <>
          <Input
            type="text"
            className="form-control"
            id="contactNo"
            name="contactNo"
            maxLength="10"
            onChange={(e) => {
              setValues((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
              }));
              setPayloadData((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
              }));
            }}
            value={values?.contactNo || ""}
            lable={t("Contact No.")}
            placeholder=" "
            respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          />

          <ReactSelect
            placeholderName={t("InSurancePanel")}
            id={"InSurancePanel"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            value={payloadData?.panelID?.value}
            name={"panelID"}
            dynamicOptions={DropDownState?.getBindPanelByPatientID}
            handleChange={handlePanelReactSelectChange}
            removeIsClearable={true}
            isDisabled={true}
          />
          {samartList?.Smart?.length > 0 && (
            <ReactSelect
              placeholderName={t("Integration")}
              id={"Smart"}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              value={payloadData?.Smart?.value}
              name={"Smart"}
              dynamicOptions={[
                { label: t("select"), value: "0" },
                ...samartList?.Smart,
              ]}
              handleChange={handlePanelReactSelectChange}
              removeIsClearable={true}
            />
          )}

          {payloadData?.Smart?.value && (
            <>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
                <div className="form-check mb-2 justify-items-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="processManual"
                    name="ProcessManual"
                    value={payloadData?.ProcessManual}
                    onChange={handleChecked}
                  />
                  <label
                    className="form-check-label ml-2"
                    htmlFor="processManual"
                  >
                    {t("Process Manual")}
                  </label>
                  <button
                    className="btn btn-sm btn-primary ml-2"
                    onClick={handleFetchData}
                  >
                    {t("Fetch Data")}
                  </button>
                </div>
              </div>
            </>
          )}

          <ReactSelect
            placeholderName={t("Source")}
            id={"Source"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            value={payloadData?.Source}
            name={"Source"}
            dynamicOptions={sourceOptions}
            handleChange={handleReactSelectChange}
            removeIsClearable={true}
          />
          <ReactSelect
            placeholderName={t("MLC")}
            id={"MLC"}
            searchable={true}
            respclass="col-xl-1 col-md-4 col-sm-6 col-12"
            value={payloadData?.MLC}
            name={"MLC"}
            dynamicOptions={[
              { label: t("Yes"), value: "1" },
              { label: t("No"), value: "0" },
            ]}
            handleChange={handleReactSelectChange}
            removeIsClearable={true}
          />

          <ReactSelect
            placeholderName={t("Refer Type")}
            id={"referalTypeID"}
            searchable={true}
            respclass="col-xl-1 col-md-4 col-sm-6 col-12"
            dynamicOptions={handleReactSelectDropDownOptions(
              GetReferTypeList,
              "ReferalType",
              "ReferalTypeID",
            )}
            name={"referalTypeID"}
            value={payloadData?.referalTypeID?.value}
            handleChange={handleReactSelectChange}
            isDisabled={UHID ? true : false}
            removeIsClearable={true}
          />
          <div className="d-flex col-xl-2 col-md-4 col-sm-6 col-12">
            <ReactSelect
              placeholderName={t("Refer Doctor")}
              id={"referDoctor"}
              searchable={true}
              // Red underline while an Out referral has no doctor, the same way the
              // other required fields on this form are marked.
              requiredClassName={isReferDoctorMissing(payloadData) ? " required-fields" : ""}
              respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
              isDisabled={
                findReferDisable(
                  GetReferTypeList,
                  "ReferalTypeID",
                  payloadData?.referalTypeID?.value,
                )?.IsDisable
              }
              dynamicOptions={
                Number(
                  findReferDisable(
                    GetReferTypeList,
                    "ReferalTypeID",
                    payloadData?.referalTypeID?.value,
                  )?.IsMainDoctor,
                ) === 0
                  ? handleReactSelectDropDownOptions(
                    GetBindReferDoctorList,
                    "NAME",
                    "DoctorID",
                  )
                  : DropDownState?.getDoctorDeptWise
              }
              name="referDoctorID"
              value={payloadData?.referDoctorID}
              handleChange={handleReactSelectChange}
            />
            <div className="col-1">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setHandleModelData({
                    label: t("Add Refer Doctor"),
                    buttonName: t(""),
                    width: "50vw",
                    isOpen: true,
                    Component: (
                      <ReferDoctorModal
                        isProName={false}
                        setModalData={setModalData}
                        DropDownState={DropDownState}
                        GetBindReferDoctorList={GetBindReferDoctorList}
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

          <div className="d-flex col-xl-2 col-md-4 col-sm-6 col-12">
            <ReactSelect
              placeholderName={t("PRO")}
              id={"PRO"}
              searchable={true}
              name={"proId"}
              respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
              dynamicOptions={DropDownState?.getBindProList}
              value={payloadData?.proId}
              handleChange={handleReactSelectChange}
              isDisabled={UHID ? true : false}
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
                type="button"
              >
                <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
              </button>
            </div>
          </div>

          {/* Field Boy - master_fieldboy se, sirf dropdown. Naam jodna / badalna /
              hataana EDP > Tools > Field Boy Master page se hota hai. */}
          <ReactSelect
            placeholderName={t("Field Boy")}
            id={"fieldBoyID"}
            searchable={true}
            name={"fieldBoyID"}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            dynamicOptions={fieldBoyList}
            value={payloadData?.fieldBoyID}
            handleChange={handleReactSelectChange}
            isDisabled={UHID ? true : false}
          />

          <div className="d-flex col-xl-2 col-md-4 col-sm-6 col-12">
            <ReactSelect
              placeholderName={t("Agent")}
              id={"agentID"}
              searchable={true}
              name={"agentID"}
              respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
              dynamicOptions={agentOptions}
              value={payloadData?.agentID}
              handleChange={handleReactSelectChange}
            />
            <div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setHandleModelData({
                    label: t("Add Agent"),
                    buttonName: t(""),
                    width: "50vw",
                    isOpen: true,
                    Component: (
                      <AgentModal
                        setModalData={setModalData}
                        DropDownState={DropDownState}
                        onListChange={refreshAgentList}
                      />
                    ),
                    handleInsertAPI: saveAgent,
                  });
                }}
                type="button"
              >
                <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
              </button>
            </div>
          </div>

          <ReactSelect
            placeholderName={t("Department")}
            id={"department"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
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
            isDisabled={UHID ? true : false}
            removeIsClearable={true}
          />
          {isParentPanelRuleOn && (
            <ReactSelect
              placeholderName={t("Parent Panel")}
              id="RuleParentPanelID"
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              dynamicOptions={parentPanelOptions}
              name="RuleParentPanelID"
              value={payloadData?.RuleParentPanelID || ""}
              handleChange={(name, e) =>
                setPayloadData((prev) => ({
                  ...prev,
                  RuleParentPanelID: e?.value ? String(e.value) : "",
                }))
              }
              isDisabled={UHID ? true : false}
            />
          )}
          {!isDoctorFieldHidden && (
            <div className="col-xl-2 col-md-4 col-sm-6 col-12">
              <ReactSelect
                placeholderName={t("Doctor")}
                id={"doctor"}
                searchable={true}
                requiredClassName=" required-fields"
                dynamicOptions={
                  ruleDoctorIDs
                    ? (DropDownState?.getDoctorDeptWise || []).filter((d) =>
                        ruleDoctorIDs.includes(String(d?.value).trim()),
                      )
                    : DropDownState?.getDoctorDeptWise
                }
                name="DoctorID"
                value={Number(payloadData?.DoctorID)}
                handleChange={handleReactSelectChange}
                isDisabled={UHID ? true : false}
                removeIsClearable={true}
                tooltipContent={doctorTooltipContent}
              />
            </div>
          )}
          <LabeledInput
            className="col-xl-2 col-md-4 col-sm-6 col-12"
            label={t("International Patient")}
            value={singlePatientData?.IsInternational === 1 ? "Yes" : "No"}
            disabled={true}
          />
          <LabeledInput
            className="col-xl-2 col-md-4 col-sm-6 col-12"
            label={t("Employee Id")}
            value={singlePatientData?.EmployeeReferenceID}
            disabled={true}
          />
          {/* Staff ID / Trustee ID as entered at registration
              (sp_patientSearchByBarcode: Staff_ID, TrusteeId); shown only when filled. */}
          {String(singlePatientData?.Staff_ID ?? "").trim() !== "" && (
            <LabeledInput
              className="col-xl-2 col-md-4 col-sm-6 col-12"
              label={t("Staff ID")}
              value={singlePatientData?.Staff_ID}
              disabled={true}
            />
          )}
          {String(singlePatientData?.TrusteeId ?? singlePatientData?.TrusteeID ?? "").trim() !== "" && (
            <LabeledInput
              className="col-xl-2 col-md-4 col-sm-6 col-12"
              label={t("Trustee ID")}
              value={singlePatientData?.TrusteeId ?? singlePatientData?.TrusteeID}
              disabled={true}
            />
          )}
          <Input
            type="text"
            className="form-control"
            id="BarcodeNo"
            name="BarcodeNo"
            onChange={handleChange}
            value={payloadData?.BarcodeNo || ""}
            lable={t("Barcode No")}
            placeholder=" "
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          />

          {/* Insurance-only field. Hidden for cash patients so the row stays
              unchanged for them; mandatory only when TIDMandatoryOnOPDBooking = 1
              (checked in handleSave before the payload is built). */}
          {isInsurancePanel && (
            <Input
              type="text"
              className={`form-control ${
                isTIDMandatory && !String(payloadData?.TID || "").trim() ? "required-fields" : ""
              }`}
              id="TID"
              name="TID"
              maxLength="50"
              onChange={handleChange}
              value={payloadData?.TID || ""}
              lable={t("TID/Claim ID")}
              placeholder=" "
              respclass={`col-xl-2 col-md-4 col-sm-6 col-12 ${isTIDMandatory ? "required-label" : ""}`}
            />
          )}

          {testAddingTableState?.length > 0 && (
            <>
              <div className="col-xl-2">
                <div className="row">
                  <Input
                    type="text"
                    className="form-control"
                    id="couponCode"
                    name="couponCode"
                    maxLength="10"
                    onChange={(e) => {
                      setValues((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }));
                      setPayloadData((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }));
                    }}
                    value={values?.couponCode || ""}
                    lable={t("Coupon Code")}
                    placeholder=" "
                    respclass="col-xl-8 col-md-8 col-sm-6 col-12"
                  />
                  <div className="col-xl-4">
                    <button
                      className="btn btn-success ml-2"
                      onClick={validateCoupon}
                    >
                      {t("Apply")}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          {showMemeberShipCardAccess?.length > 0 && (
            <MembershipCardBanner
              cardInfo={showMemeberShipCardAccess[0]}
              onClick={() => setMembershipCardOpen(true)}
            />
          )}

          {membershipCardOpen && (
            <MembershipCardModal
              visible={membershipCardOpen}
              setVisible={setMembershipCardOpen}
              uhid={singlePatientData?.PatientID}
              cardInfo={showMemeberShipCardAccess?.[0]}
              cardNo={
                testPaymentState?.MemberShipCardNo ||
                singlePatientData?.MemberShipCardNo ||
                ""
              }
            />
          )}

          {dynamicForm}
        </>
      </DetailsCardForDefaultValue>
      {medikreditData && (
        <div className="card mt-2 p-2">
          <Heading title={t("Dependants")} />
          <Tables
            thead={[
              t("Member Number"),
              t("Name"),
              t("ID Number"),
              t("DOB"),
              t("Gender"),
              t("Service Provider BHF Number"),
              t("Time"),
              t("Transaction Number"),
              t("Transaction Code"),
              t("Plan"),
            ]}
            style={{ height: "auto" }}
            tbody={[
              {
                "Member Number": medikreditData.memberNumber,
                Name: `${medikreditData.sName}${medikreditData.fName ? ` ${medikreditData.fName}` : ""}`,
                "ID Number": medikreditData.id_nbr,
                DOB: medikreditData.dob,
                Gender: medikreditData.gender === "1" ? "Male" : "Female",
                sp_bhf: medikreditData.apiResponse?.DOCUMENT?.TX?.sp_bhf,
                tm: medikreditData.apiResponse?.DOCUMENT?.TX?.tm,
                tx_nbr: medikreditData.apiResponse?.DOCUMENT?.TX?.tx_nbr,
                tx_cd: medikreditData.apiResponse?.DOCUMENT?.TX?.tx_cd,
                Plan: medikreditData.plan,
              },
            ]}
          />
        </div>
      )}

      <div>
        {singlePatientData?.PatientRelationData?.length > 0 && (
          <div className="row px-2">
            {relationCheckList?.map((rel, index) => {
              return (
                <LabelInputBox
                  key={index}
                  isChecked={selectedRelations?.includes(rel)}
                  style={{ cursor: "pointer" }}
                  className={"col-xl-4 col-md-4 col-sm-6 col-12"}
                  label={`Relation_${index + 1}`}
                  value={rel.RelationName}
                  relation={rel.RelationOf}
                  recontactNo={rel.RelationPhoneNo}
                  setCheclBoxValue={(name, isChecked) => {
                    if (isChecked) {
                      setSelectedRelations((prev) => [...prev, rel]);
                    } else {
                      setSelectedRelations(() =>
                        selectedRelations.filter((item) => item !== rel),
                      );
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

    </>
  );
};
