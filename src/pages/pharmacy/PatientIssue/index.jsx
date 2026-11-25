import React, { useMemo, useRef, useState } from "react";
import { Tooltip } from "primereact/tooltip";
import Modal from "../../../components/modalComponent/Modal";
import OverLay from "../../../components/modalComponent/OverLay";
import PatientRegistration from "../../frontOffice/PatientRegistration/Index";
import Heading from "../../../components/UI/Heading";
import SearchItemEassyUI from "../../../components/commonComponents/SearchItemEassyUI";
import {
  AGE_TYPE,
  AMOUNT_REGX,
  BIND_TABLE_OLDPATIENTSEARCH_PHARMECY,
  BIND_TABLE_BY_MED_FIRST_NAME_PHARMECY,
  PAYMENT_OBJECT,
  ROUNDOFF_VALUE,
  MOBILE_NUMBER_VALIDATION_REGX,
} from "../../../utils/constant";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import LabeledInput from "../../../components/formComponent/LabeledInput";
import Input from "../../../components/formComponent/Input";
import {
  BindDisApprovalList,
  bindHashCode,
  bindPanelByPatientID,
  GetBindDoctorDept,
  GetDiscountWithCoPay,
  GetDiscReasonList,
  GetEligiableDiscountPercent,
  GetPatientMembershipDetails,
  PatientSearchbyBarcode,
} from "../../../networkServices/opdserviceAPI";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  ResolveDiscount,
  SubstitutionApply,
  SubstitutionResolve,
} from "../../../networkServices/InventoryApi";
import { useEffect } from "react";
import {
  CentreWiseCacheByCenterID,
  GetBindReferDoctor,
  GetGlobalResources as FetchGlobalResources,
} from "../../../store/reducers/common/CommonExportFunction";
import { useDispatch } from "react-redux";
import { setLoading } from "../../../store/reducers/loadingSlice/loadingSlice";
import { useLeaveGuard } from "../../../utils/hooks/useLeaveGuard";
import {
  AddItemPharmecy,
  calculateBillAmount,
  filterByTypes,
  handleCalculatePatientIssue,
  handleReactSelectDropDownOptions,
  inputBoxValidation,
  notify,
} from "../../../utils/utils";
import {
  AddItemByItemIDPharmecy,
  bindFromDepartments,
  DraftPharmecyAPICall,
  GetPharmacyPatientDetail,
  PharmacyClinicalTrialAPI,
  PharmacyMedicineItemSearch,
  SavePharmecyAPICall,
  GetGlobalResourcesAPI,
} from "../../../networkServices/pharmecy";
import PatientIssueTable from "./PatientIssueTable";
import PaymentGateway from "../../../components/front-office/PaymentGateway";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import ClinicalTrialModal from "./ClinicalTrialModal";
import IndentReqModal from "./IndentReqModal";
import BillConfirmationModal from "../../../components/modalComponent/Utils/patientBillingModal/BillConfirmationModal";
import { isIndentWiseMedicineOPDReturnEnabled } from "../../../utils/indentWiseMedicineOPDReturn";
import AsACreditConfirmation from "../../../components/modalComponent/Utils/patientBillingModal/AsACreditConfirmation";
import {
  CashPanel,
  DraftPharmecyAPIPayload,
  SavePharmecyAPIPayload,
} from "../../../utils/ustil2";
import {
  ReservePrintTab,
  RedirectURLInTab,
  CloseReservedTab,
} from "../../../networkServices/PDFURL";
import {
  BindStoreRequisitionDepartment,
  CommonReceiptData,
  CommonReceiptPdf,
  handleValidateUserToBill,
  PatientBillingGetPackage,
  PostIncludeBillApi,
} from "../../../networkServices/BillingsApi";

import Tables from "../../../components/UI/customTable";
import { Checkbox } from "primereact/checkbox";
import { MedicineIconSVG } from "../../../components/SvgIcons";
import BrowseButton from "../../../components/formComponent/BrowseButton";
import ColorCodingSearch from "../../../components/commonComponents/ColorCodingSearch";
import MembershipCardBanner from "../../../components/commonComponents/MembershipCardBanner";
// Flag-gated (ShowPharmacyMedicationCalendar) — renders nothing unless the flag is on.
import PatientMedicationCalendarButton from "../../../components/commonComponents/PatientMedicationCalendarButton";
// Flag-gated (PharmacyDrugDiseaseAlert) — popup only, renders nothing unless a
// contraindication is found for a medicine being issued.
import PharmacyDiseaseAlert from "../../../components/commonComponents/PharmacyDiseaseAlert";
import PatientNotesButton from "../../../components/commonComponents/PatientNotesButton";
import { isStockExpired, isStockNearExpiry, isLowStock, stockExpiryText, EXPIRED_STOCK_COLOUR, LOW_STOCK_COLOUR, NEAR_EXPIRY_COLOUR } from "../../../utils/stockExpiry";
// Repeat medicine: re-add items from the patient's earlier pharmacy bills.
import PreviousBillsModal from "./PreviousBillsModal";
import MedicalInfoModal from "../../../components/modalComponent/Utils/MedicalInfoModal";
import { GetPatientMedicalInfo } from "../../../networkServices/DoctorApi";
import { translateOptions } from "@components/WrapTranslate";
import StockDepartmentWiseModal from "../../../components/modalComponent/StockDepartmentWiseModal";

export default function Index({ data }) {
  const [t] = useTranslation();
  const thead = [
    { name: t("Select"), width: "1%" },
    t("Date"),
    t("BillNo"),
    t("ReceiptNo"),
    t("Type"),
    t("Ipd No"),
    t("PName"),
    t("Package Name"),
    t("Paid Amount"),
    t("Package Amount"),
    t("Pharmacy Amt"),
    t("Utilize Pharmacy Amt"),
  ];
  const titleRef = useRef(null);
  const MedicineRef = useRef(null);
  const nameRef = useRef(null);
  const searchPatientRef = useRef(null);
  const quantityRef = useRef(null);
  const medDataRef = useRef([]);
  // Guard against rapid multiple clicks on the indent modal's "Add" button.
  // The ref blocks re-entry synchronously; the state disables the button in the UI.
  const isAddingIndentRef = useRef(false);
  const [isAddingIndent, setIsAddingIndent] = useState(false);
  // Guards AddItem against re-entrancy: addSingleItem's duplicate check reads
  // the (stale) bodyData closure, so rapid-fire Enter/Add before the first
  // AddItemPharmecy call resolves can add the same item multiple times.
  const isAddingItemRef = useRef(false);
  const [packageData, setPackageData] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState([]);
  const [handleModelData, setHandleModelData] = useState({});
  const [ischecked, setIsChecked] = useState(false);
  const [medicalInfos, setmedicalInfo] = useState(null);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const TYPE = [
    { label: t("Registered"), value: 1 },
    { label: t("Walk-in"), value: 2 },
  ];
  const DISMED = [
    { label: t("YES"), value: "1" },
    { label: t("NO"), value: "0" },
  ];
  const SearchByOption = [
    { label: t("Item Name"), value: "1" },
    { label: t("With Generic"), value: "2" },
    { label: t("Barcode"), value: "3" },
    { label: t("Generic"), value: "4" },
    { label: t("Batch No."), value: "5" },
  ];
  const SellOnOption = [
    { label: t("MRP"), value: "0" },
    { label: t("Rate"), value: "1" },
  ];
  let initialValue = {
    type: { value: 1 },
    SearchBy: { value: "1" },
    itemType: { value: "1" },
    Generic: { value: "0" },
    addToImplant: { value: false },
    SellOn: SellOnOption[0],
    title: { value: t("Mr.") },
    Gender: { value: t("Male") },
    AgeType: { value: t("YRS") },
    DisMed: { value: "0" },
    Panel: CashPanel,
  };

  const [values, setValues] = useState({ ...initialValue });
  const [department, setDepartment] = useState();
  const [panelList, setPanelList] = useState([]);
  const [saleOnList, setSaleOnList] = useState([]);
  const [mainDoctorList, setMainDoctorList] = useState([]);
  const dispatch = useDispatch();
  const { GetBindReferDoctorList, CentreWiseCache, BindResource ,GetGlobalResources, GetRoleList} = useSelector(
    (state) => state.CommonSlice,
  );

  useEffect(() => {
    const list = filterByTypes(
      CentreWiseCache,
      [28],
      ["TypeID"],
      "TextField",
      "ValueField",
      "Department",
    );
    if (list?.length === 1) {
      setValues((val) => ({ ...val, SellOn: list[0] }));
    }
    setSaleOnList(list);
  }, [CentreWiseCache?.length]);

  /* Teesra option - "Register & Issue".

     fin_global_resources -> IsPharmacyRegisterAndIssue

        0 / qatar hi na ho  ->  option dikhta hi nahi. Screen bilkul aaj jaisi -
                                har site par ye nahi chahiye.
        1                   ->  Type me teesra option aata hai. Usme patient
                                patient_master me register bhi hota hai aur
                                medicine issue bhi - dono ek hi transaction me.

     Walk-In (2) aur Registered (1) ka vyavhaar isse bilkul nahi badalta. */
  const isRegisterAndIssueOn =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "IsPharmacyRegisterAndIssue",
    )?.Value === "1";

  const TYPE_OPTIONS = isRegisterAndIssueOn
    ? [...TYPE, { label: t("Register & Issue"), value: 3 }]
    : TYPE;

  /* Roop ke hisaab se 3 bhi walk-in hi hai - farq sirf iraade ka hai.

     Walk-In ke khane (Title, Name, Age, Address, ContactNo) naye option par bhi
     wahi hain, isliye jahan-jahan "2" dekha jaata tha wahan ab ye dekha jaata
     hai. Jo check "1" (Registered) ke hain unhe chhua nahi gaya - 3 unme girta
     bhi nahi aur girna chahiye bhi nahi. */
  const isWalkInShape =
    values?.type?.value === 2 || values?.type?.value === 3;

  // Register karna hai ya nahi - sirf teesre option par.
  const isRegisterMode = values?.type?.value === 3;

  useEffect(() => {
    try {

      const IsExpiry = GetGlobalResources?.find(item => item.Name === "IsExpiryColourShow");
      if (IsExpiry?.Value == 1) {
        setIsExpiryColour(true);
      } else {
        setIsExpiryColour(false);
      }
      const lowStockVal = GetGlobalResources?.find(item => item.Name === "PharmacyLowStockQty");
      if (lowStockVal?.Value) setLowStockThreshold(Number(lowStockVal.Value) || 5);
      const nearExpiryVal = GetGlobalResources?.find(item => item.Name === "PharmacyNearExpiryMonths");
      if (nearExpiryVal?.Value) setNearExpiryMonths(Number(nearExpiryVal.Value) || 2);
    } catch (error) {
      console.error(error);
    }
  }, [GetGlobalResources]);

  const focusInput = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  let userData = useLocalStorage("userData", "get");

  /* ---------------------------------------------------------------- store switch

     The store this screen issues from is the signed-in role, and until now the only way
     to change it was the module picker in the header, which lands you back on the
     dashboard. A counter that works two stores had to leave the screen and come back.

     Only pharmacy stores are offered. SettlementType = 1 is what marks one in
     f_rolemaster - the same flag the settlement screen keys off - and the list is the
     employee's own roles, so a store they do not hold cannot be picked. */
  /* fin_global_resources -> ShowStoreSwitchOnPharmacyIssue.

     Opt-in, and off unless a site has switched it on. Changing store mid-screen is not
     something every counter should be able to do - at a site where one person is tied to
     one store it is a way to issue against the wrong one by accident - so the box only
     appears where somebody has asked for it.

     Read off the list this screen already holds, so it costs no extra call. The endpoint
     behind that list selects WHERE IsActive = 1, which is why IsActive = 0, Value = 0 and
     no row at all all leave it off. */
  /* fin_global_resources -> HidePharmacyDraftButton. Value 1 hides Draft on this screen (the
     Drafts list button and the Draft save button); any other value, or no row, shows them as
     before. The settings are re-read when the screen opens, so a change applies on the next
     open without logging in again. */
  useEffect(() => {
    dispatch(FetchGlobalResources());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const hideDraftButton = useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find((item) => item?.Name === "HidePharmacyDraftButton");
    return String(row?.Value ?? "0").trim() === "1";
  }, [GetGlobalResources]);

  /* fin_global_resources -> PharmacyIssueHideCreditPaymentMode: comma separated store role ids
     (f_rolemaster.ID, e.g. the OPD Pharmacy role). Working as one of those stores, Credit
     (PaymentModeID 4) is taken out of the Payment Mode dropdown; other stores, an empty value
     or no row show it as before. Bills this screen itself puts on Credit (IPD / EMG / indent /
     package) still get Credit - PaymentGateway never hides the screen's own default mode. */
  const hideCreditRoleIDs = useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find(
      (item) => item?.Name === "PharmacyIssueHideCreditPaymentMode",
    );
    return String(row?.Value ?? "")
      .split(",")
      .map((id) => Number(String(id).trim()))
      .filter((id) => id > 0);
  }, [GetGlobalResources]);

  const showStoreSwitch = useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find(
      (item) => item?.Name === "ShowStoreSwitchOnPharmacyIssue",
    );
    return String(row?.Value ?? "0") === "1";
  }, [GetGlobalResources]);

  const pharmacyStores = useMemo(
    () =>
      !showStoreSwitch
        ? []
        : (Array.isArray(GetRoleList) ? GetRoleList : [])
            .filter((r) => Number(r?.settlementType) === 1)
            .map((r) => ({ value: Number(r?.roleID), label: r?.roleName })),
    [GetRoleList, showStoreSwitch],
  );

  /* Held in state rather than read off localStorage at render, because the switch below
     does not reload the page - without this the box would keep showing the old store. */
  const [currentStore, setCurrentStore] = useState(Number(userData?.defaultRole));

  /* The store every call on this screen acts as.

     fin_global_resources -> ShowStoreSwitchOnPharmacyIssue, the same switch that puts the
     Store box on screen. One switch, because the box and this are one feature: a box that
     chooses a store the calls then ignore would be worse than no box at all.

     ON  - the chosen store travels with each call (search, batch, save) and nothing is
           written to the session. This is what fixes two tabs fighting over one store: the
           token and the stored user live in localStorage, which every tab of the same
           browser shares, so the last role set there won and the other tab silently issued
           against it. Nothing touches the session now, so each tab keeps its own store.

     OFF - 0 is sent and the server uses the session's role. Byte for byte how the screen
           behaved before the Store box existed.

     Deliberately not the stored defaultRole when off: that is the very value two tabs
     share and overwrite, so sending it would carry the bug into sites that never asked
     for any of this.

     Whatever is sent, the server checks it against the roles the employee actually holds.
     That check is not behind any flag - it is the guard, not the feature. */
  /* The store the calls act as.

     Nothing picked yet means the box's own starting value, which is the role this user
     signed in with - so the id that travels is the one that was being used before the box
     existed, not a 0 for the server to interpret.

     That starting value comes from localStorage, which every browser tab shares, so until
     a store is actually picked two tabs still agree with each other. Picking one is what
     makes this tab its own - and that is the case the box is there for. */
  const effectiveStoreRole = showStoreSwitch ? Number(currentStore) || 0 : 0;
  /* The chosen store, readable from inside a frozen callback.

     SearchItemEassyUI memoises its debounced search with deps that never change on this
     screen, so the BindListAPI it calls is the one from the first render - and that one
     closed over the store as it was at mount. Switching the Store box then changed the box
     and the state, but the search went on asking for the store the page opened with.

     A ref is read when it is used rather than when it was captured, so a callback frozen
     at mount still gets today's store. */
  const storeRoleRef = useRef(0);
  storeRoleRef.current = effectiveStoreRole;


  const [storeSwitching, setStoreSwitching] = useState(false);

  /* Which stores get the Indents button.

     The same rule the Requisition screen uses for its Department box, read from the same
     call (Requisition/BindDepartment):

         f_centre_role.IsDepartmentIndent = 1, for an active role in this centre

     A department only has indents worth looking at if an indent can be raised against it,
     so the button follows that flag rather than a second list kept by hand - set the flag
     in the masters and both screens agree, with no setting to edit.

     It keys on the Store box at the top of this screen, not on the person logged in: the
     button belongs to the store on screen, so switching the box moves it.

     fin_global_resources -> ShowIndentButtonRoles overrides this where a site wants to
     pin it: a comma separated list of role ids wins over the department list. Role ids and
     not names, because a role can be renamed and a name list would quietly stop matching.

     If neither can be worked out - the list did not load, or came back empty - nothing is
     restricted and the button appears wherever it does today. A lookup that failed must
     not take a working button away. */
  const [indentDepartmentRoles, setIndentDepartmentRoles] = useState([]);

  useEffect(() => {
    let cancelled = false;

    /* storetype is in the signature but the procedure ignores it - the two branches that
       used it are commented out - so what comes back is every indent department. */
    BindStoreRequisitionDepartment("")
      .then((resp) => {
        if (cancelled) return;
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        setIndentDepartmentRoles(
          rows
            .map((row) => Number(row?.id ?? row?.ID ?? 0))
            .filter((value) => Number.isFinite(value) && value > 0),
        );
      })
      .catch(() => {
        // Leave it empty, which means "do not restrict".
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const indentButtonRoles = useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find((item) => item?.Name === "ShowIndentButtonRoles");

    const pinned = String(row?.Value ?? "")
      .split(",")
      .map((value) => Number(String(value).trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    return pinned.length > 0 ? pinned : indentDepartmentRoles;
  }, [GetGlobalResources, indentDepartmentRoles]);

  const indentButtonAllowed =
    indentButtonRoles.length === 0 ||
    indentButtonRoles.includes(Number(currentStore));

  const handleStoreChange = async (name, e) => {
    const roleID = Number(e?.value || 0);
    if (!showStoreSwitch) return;
    if (!roleID || roleID === Number(currentStore) || storeSwitching) return;

    setStoreSwitching(true);
    try {
      /* The session is deliberately left alone.

         This used to swap the claims, the token, the stored user and the menu so that
         later calls picked the new store up by themselves. Three problems: it was slow, it
         moved every other screen into the new store as well, and because all of that lives
         in localStorage it is exactly what let two tabs overwrite each other's store.

         The store travels with the call instead - effectiveStoreRole goes into the search,
         the batch lookup and the save - so switching here changes this screen and nothing
         else. Nothing to await, so the switch cannot half happen. */

      /* The patient stays. What was already picked out is cleared, because a medicine
         row carries the batch and stock of the store it was taken from - keeping it
         would issue one store's stock against another's bill. The counter keeps the
         patient it had and picks the medicines again from the new store.

         Deliberately not a page reload: that was slow and took the patient with it. */
      medDataRef.current = [];
      setBodyData([]);
      setPackageData([]);
      setSelectedPackage([]);
      setPaymentControlModeState(PAYMENT_OBJECT);
      setPaymentMethod([]);
      setValues((val) => ({
        ...val,
        medicineName: "",
        Quantity: "",
      }));

      setCurrentStore(roleID);
      notify(`${t("Store changed to")} ${e?.label || ""}`, "success");
    } catch (error) {
      notify(t("Could not change the store"), "error");
    } finally {
      setStoreSwitching(false);
    }
  };

  let isCashPanel =
    panelList?.find((item) => item?.value === values?.Panel?.value)?.IsCash ||
    0;

  const getMainDoctorList = async () => {
    let apiResp = await GetBindDoctorDept("ALL");
    if (apiResp?.success) {
      setMainDoctorList(apiResp?.data);
    } else {
      setMainDoctorList([]);
    }
  };

  const GetDepartmentList = async () => {
    const apiResp = await bindFromDepartments();
    if (apiResp?.success) {
      setDepartment(apiResp?.data);
    }
  };

  useEffect(() => {
    dispatch(GetBindReferDoctor());
    dispatch(CentreWiseCacheByCenterID({}));
    getMainDoctorList();
    GetDepartmentList();
    focusInput(nameRef);
  }, []);

  const [BindDetails, setBindDetails] = useState({
    label: t("Search Medicine"),
    value: "",
    className: "required-fields",
  });
  const [SearchPatient, setSearchPatient] = useState({
    label: t("UHID/IPDNo/EMGNo/Name/Mobile"),
    id: "UHIDPatientNameIPDNo",
    value: "",
    patientDetail: {},
  });

  // Idempotency key to stop the same pharmacy issue being saved multiple times
  // (repeat submits / slow-network retries). Sent as pmh.UniqueHash and stored in
  // patient_medical_history.UniqueHash for server-side dedupe. Refreshed whenever a
  // new patient is loaded so each issue gets its own key.
  const [uniqueHash, setUniqueHash] = useState("");

  /* Save abhi chal raha hai ya nahi.

     Server par duplicate ki rok pehle se hai (OPDPharmacy.cs - UniqueHash par), aur
     wo rehni bhi chahiye - wo aakhri bachaav hai. Par wo tabhi bolti hai jab nuksaan
     ho chuka hota hai: user ko "already been saved" dikhta hai aur lagta hai kuch toot
     gaya. Isliye dohra submit yahin rok diya jaata hai, server tak pahunchne hi nahi
     diya jaata.

     useState nahi, useRef - state agle render par badalti hai, aur do click ke beech
     render hone ka intezaar nahi hota. Ref usi pal badal jaata hai. */
  const saveInFlightRef = useRef(false);
  const generateUniqueHash = async () => {
    const hashcode = await bindHashCode();
    setUniqueHash(hashcode?.data ?? "");
  };
  useEffect(() => {
    generateUniqueHash();
  }, [SearchPatient?.patientDetail?.PatientID]);
  useEffect(() => {
    if (data?.ipdno) {
      setSearchPatient((val) => ({
        ...val,
        value: data?.ipdno,
        isCallhandleChange: true,
      }));
    }
  }, []);

  const [modalData, setModalData] = useState({ visible: false });
  const [bodyData, setBodyData] = useState([]);

  /* Dawa chun lene ke baad page chhodne par poochha jaata hai.

     Bina save kiye nikal jaane par jo chuna tha wo chala jaata hai, aur user ko pata
     tabhi chalta hai jab wapas aa kar dekhta hai. Ab menu se kahin aur jaate waqt,
     tab band karte waqt ya refresh par ek sawaal aata hai.

     Hook, message aur menu wala confirmLeave() teeno pehle se hain - GRN aur Create
     Purchase Order par yahi chal raha hai. Naya kuch nahi banaya.

     Save hote hi list khaali ho jaati hai, to rok apne aap hat jaati hai - save ke
     baad bhi sawaal poochhna sabse chidhane wali baat hoti. */
  useLeaveGuard(bodyData?.length > 0);

  /* Naya issue shuru hote hi naya hash.

     Sirf upar wali shart kaafi nahi thi, kyunki wo PATIENT par tiki hai:

       - Walk-in par patientDetail set hi nahi hota (WalkIn.jsx), aur sab walk-in
         ka PatientID waise bhi ek hi hai - CASH002 par 762 bill. To do walk-in ke
         beech PatientID badalta hi nahi, aur hash wahi ka wahi reh jaata tha.

       - Save ka timeout: server par bill ban gaya par client ko jawab nahi mila.
         Tab hash refresh NAHI hota, aur ye sahi hai - usi issue ko dobara bhejna
         ho to wahi hash chahiye. Par user us issue ko chhod kar AGLE patient par
         chala jaata tha aur purana hash saath le jaata tha. Server use pehchan
         leta: "already been saved" - aur us Bill No me PICHHLE patient ka bill.

     Isliye hash ab patient se nahi, "naya issue shuru hua" se bandha hai: jis pal
     medicine ki list khaali se bhari hoti hai. List baarah jagah se bharti hai
     (dawa, draft, prescription, indent, package...), aur ye ek hi jagah un sab ko
     pakad leti hai.

     Retry par asar nahi padta: save fail hone par list waisi hi rehti hai, khaali
     se bhari nahi hoti, to hash bhi wahi rehta hai - aur wahi chahiye. */
  const issueStartedRef = useRef(false);
  useEffect(() => {
    const hasRows = (bodyData?.length ?? 0) > 0;
    if (hasRows && !issueStartedRef.current) generateUniqueHash();
    issueStartedRef.current = hasRows;
  }, [bodyData?.length]);

  // Active membership card discounts (Pharmacy context), keyed by ItemID.
  const [patientMembershipMap, setPatientMembershipMap] = useState(new Map());
  // Card-level info (name + validity) for the membership banner; null when the
  // patient has no applicable card for the PHARMACY context.
  const [membershipCardInfo, setMembershipCardInfo] = useState(null);

  const latestValuesRef = useRef(values);
  const latestSearchPatientRef = useRef(SearchPatient);
  const latestPatientMembershipMapRef = useRef(patientMembershipMap);
  const latestPanelListRef = useRef(panelList);
  const latestSelectedPackageRef = useRef(selectedPackage);

  useEffect(() => {
    latestValuesRef.current = values;
  }, [values]);

  useEffect(() => {
    latestSearchPatientRef.current = SearchPatient;
  }, [SearchPatient]);

  useEffect(() => {
    latestPatientMembershipMapRef.current = patientMembershipMap;
  }, [patientMembershipMap]);

  useEffect(() => {
    latestPanelListRef.current = panelList;
  }, [panelList]);

  useEffect(() => {
    latestSelectedPackageRef.current = selectedPackage;
  }, [selectedPackage]);

  useEffect(() => {
    if (!values?.removeIsFocus) {
      focusInput(searchPatientRef);
    }
  }, [values?.type]);

  const handleReactSelect = async (name, value) => {
    if (name === "SearchBy" || name === "Panel" || name === "SellOn") {
      setBindDetails((val) => ({
        ...val,
        [name]: value?.value,
        [`${name}_label`]: value?.label,
      }));
    }
    if (name === "type") {
      setSearchPatient((val) => ({ ...val, patientDetail: {} }));
    }

    setValues((val) => ({ ...val, [name]: value }));
  };

  const handlePatientSearchPage = () => {
    setBodyData([]);
    setValues(initialValue);
    setPaymentControlModeState(PAYMENT_OBJECT);
    setPaymentMethod([]);
    setSearchPatient((val) => ({ ...val, ["patientDetail"]: {}, value: "" }));
    setPackageData([]);
  };

  const handleChange = (e) => {
    setValues((val) => ({ ...val, [e.target.name]: e.target.value }));
  };
  const onEnterAddItem = (e) => {
    if (e?.keyCode === 13) {
      AddItem();
    }
  };

  const BindListAPI = async (
    itemName,
    BindDetails,
    selectedPackage,
    isCashPanel,
  ) => {
    let payload = {
      searchBy: BindDetails?.SearchBy ? BindDetails?.SearchBy : "1",
      itemName: itemName,
      PanelId: BindDetails?.Panel ? BindDetails?.Panel : values?.Panel?.value,
      isCashPanel: isCashPanel,
      isPackage: selectedPackage?.length > 0 ? 1 : 0,
       saleOn: BindDetails?.SellOn?.label
        ? BindDetails?.SellOn?.label
        : values?.SellOn?.label,
      /* The medicine list is per store, so the search has to look in the same store the
         issue will be written against - otherwise the counter picks a batch the save
         cannot use. */
      RoleID: storeRoleRef.current,
      // saleOn:
      //   values?.SellOn?.label || BindDetails?.SellOn_label || "",
      PatientType: SearchPatient?.patientDetail?.PatientType,
      // medicines with no stock are listed too (red, Avl 0) so their substitutes can be opened
      IncludeNoStock: true,
    };
  
    try {
      let apiResp = await PharmacyMedicineItemSearch(payload);
      if (!apiResp?.success) {
        notify(apiResp?.message, "error");
      }
      return apiResp;
    } catch (error) { }
  };

  const getPatientDetail = async (name) => {
    let apiResp = await GetPharmacyPatientDetail(name);
    return apiResp;
  };

  // "Add/Remove Panels List" - wahi popup jo OPD Booking ke See More (...) menu me
  // milta hai, ab Panel dropdown ke bagal wale + button se bhi khulta hai.
  // PatientRegistration (type="panelDetail") update ke baad bindDetailAPI aur
  // handleBindPanelByPatientID dono ko BINA guard ke await karta hai, isliye dono
  // ka function hona zaroori hai - warna popup "Update Panel" par crash karega.
  const [panelListPopup, setPanelListPopup] = useState(false);

  // Panel add/remove hone ke baad dropdown ko dobara bharta hai. Agar chuna hua
  // panel hata diya gaya ho to selection wapas CASH par le aata hai, warna
  // values.Panel ek aise id par atka rehta jo list me hai hi nahi.
  const refreshPatientPanelList = async () => {
    const patientID = SearchPatient?.patientDetail?.PatientID;
    if (!patientID) return [];
    try {
      const apiResp = await bindPanelByPatientID(patientID);
      const options = apiResp?.success
        ? handleReactSelectDropDownOptions(
            apiResp?.data,
            "PanelName",
            "PanelID",
          )
        : [];
      setPanelList(options);
      setValues((prev) =>
        options?.some(
          (item) => String(item?.value) === String(prev?.Panel?.value),
        )
          ? prev
          : { ...prev, Panel: CashPanel },
      );
      return apiResp?.data;
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const getPanelIdList = async (value) => {
    let apiResp = await bindPanelByPatientID(value?.PatientID);
    let panel = {};
    let patientDetail = {};
    if (apiResp?.success) {
      panel = apiResp?.data?.find((item) => item?.PanelID === value?.PanelID);
      panel.value = panel?.PanelID;
      setPanelList(
        handleReactSelectDropDownOptions(apiResp?.data, "PanelName", "PanelID"),
      );
    } else {
      panel = CashPanel;
      setPanelList([]);
    }
    //
    // if (value?.PatientType === "OPD") {
    if (values?.type?.value === 1) {
      let apiResp = await PatientSearchbyBarcode(value?.PatientID, 1);
      if (apiResp?.success) {
        patientDetail = apiResp?.data;
      } else {
        patientDetail = {};
      }
    }
    // ;
    /* sp_patientSearchByBarcode already works this patient's doctor out: the
       one on their last visit, or on their last appointment when there is no
       visit. The row from the patient list only carries a doctor while an
       admission is running, so it comes up empty for an OPD or discharged
       patient - prefer the resolved one and keep the list row as the fallback. */
    const searchedDoctorID =
      Number(patientDetail?.DoctorID) > 0 ? patientDetail?.DoctorID : null;
    const doctor = searchedDoctorID
      ? {
          value: searchedDoctorID,
          label: patientDetail?.DoctorName || value?.DoctorName,
        }
      : { value: value?.DoctorID, label: value?.DoctorName };

    setValues((val) => ({
      ...val,
      Doctor: doctor,
      Panel: panel,
      SearchTypeNumber: "",
      patientAdvanceAmount: patientDetail?.OPDAdvanceAmount,
      patientBarcode: patientDetail,
    }));
    setTimeout(() => {
      focusInput(MedicineRef);
    }, 0);
  };

  // "No stock" medicine picked from the search list: its same-salt, in-stock substitutes open in a popup.
  const [substituteModal, setSubstituteModal] = useState({ open: false, item: null, rows: [], loading: false });
  const openSubstitutes = async (item) => {
    const baseItemID = Number(String(item?.ItemID || "").split("#")[0]);
    setSubstituteModal({ open: true, item, rows: [], loading: true });
    try {
      const apiResp = await PharmacyMedicineItemSearch({
        searchBy: "1",
        itemName: item?.ItemName,
        PanelId: values?.Panel?.value,
        isCashPanel: isCashPanel,
        isPackage: 0,
        saleOn: values?.SellOn?.label,
        RoleID: storeRoleRef.current,
        PatientType: SearchPatient?.patientDetail?.PatientType,
        ForItemID: baseItemID,
      });
      setSubstituteModal({ open: true, item, rows: apiResp?.success ? apiResp?.data || [] : [], loading: false });
      if (!apiResp?.success) notify(apiResp?.message || t("No substitute with stock found"), "warn");
    } catch (error) {
      console.log(error);
      setSubstituteModal({ open: true, item, rows: [], loading: false });
    }
  };

  const hanldeCloseSearchMed = (value) => {
    if (Number(value?.NoStock) === 1) {
      if (values?.type?.value === 1 && !values?.patientBarcode?.PatientID) {
        notify(t("Please Enter Patient Details"), "error");
        return;
      }
      setBindDetails((val) => ({ ...val, value: null }));
      openSubstitutes(value);
      return;
    }
    //
    if (values?.type?.value === 1 && !values?.patientBarcode?.PatientID) {
      notify(t("Please Enter Patient Details"), "error");
      setBindDetails((val) => ({ ...val, value: null }));
      return;
    }
    // Expired batch: tinted in the search list and refused here (mouse and Enter both
    // arrive through this handler), so expired stock can never reach the issue grid.
    if (isStockExpired(value)) {
      notify(
        t("This stock is expired and cannot be issued") +
          " (" + t("Batch") + " " + (value?.BatchNumber || "-") + ", " + t("Expiry") + " " + stockExpiryText(value) + ")",
        "error",
      );
      setBindDetails((val) => ({ ...val, value: null }));
      return;
    }
    setValues((val) => ({ ...val, medicineName: value }));
    setBindDetails((val) => ({ ...val, value: value?.ItemName }));
    focusInput(quantityRef);
  };

  /* The batch's stock id, whichever way the row carries it: "stockid" (item search),
     "StockID" / "StockId" (some procedures), or the "ItemID#StockID" form of ItemID. A row
     without one used to send the text "undefined" as stockID, and the add-item procedure
     failed with "Incorrect integer value: 'undefined' for column 'vStockID'". */
  const stockIdOf = (row) => {
    const id =
      row?.stockid ??
      row?.StockID ??
      row?.StockId ??
      String(row?.ItemID ?? "").split("#")[1];
    return Number(id) > 0 ? Number(id) : 0;
  };

  const addMoreItemByItemId = async () => {
    const payload = {
      itemID: String(values?.medicineName?.ItemID?.split("#")[0]),
      qty: String(values?.Quantity),
      // deptLedgerNo: String(userData?.deptLedgerNo),

      PanelId: values?.Panel?.value,
      // Same store the medicine was searched in. See effectiveStoreRole.
      RoleID: storeRoleRef.current,
    };
    let apiResp = await AddItemByItemIDPharmecy(payload);
    if (apiResp?.success) {
      if (apiResp?.data[0]?.TotalQty < Number(values?.Quantity)) {
        // notify("Stock Not Available", "error");
         notify(
    `Only ${apiResp?.data[0]?.TotalQty} item(s) are available in stock. You requested ${values?.Quantity}. Please enter a quantity less than or equal to the available stock.`,
    "error"
  );
        return 0;
      } else {
        let pendingQty = 0;
        for (let index = 0; index < apiResp?.data?.length; index++) {
          const val = apiResp?.data[index];
          let needToIssuQty = Number(values?.Quantity);
          if (val?.ItemID === apiResp?.data[index - 1]?.ItemID) {
            val.IssueQuantity = 0;
            if (pendingQty > 0) {
              if (pendingQty > val?.AvlQty) {
                val.IssueQuantity = val?.AvlQty;
                pendingQty = pendingQty - val?.AvlQty;
              } else {
                val.IssueQuantity = pendingQty;
                pendingQty = 0;
              }
            }
          } else {
            if (needToIssuQty > val?.AvlQty) {
              val.IssueQuantity = val?.AvlQty;
              pendingQty = needToIssuQty - val?.AvlQty;
            } else {
              val.IssueQuantity = needToIssuQty;
              pendingQty = 0;
            }
          }
          if (val?.IssueQuantity !== 0) {
            await addSingleItem(
              String(val?.ItemID ?? "").split("#")[0],
              val?.IssueQuantity,
              stockIdOf(val),
              index === apiResp?.data?.length - 1 ? 1 : 0,
              // index === apiResp?.data?.length - 1 ? true : false,
            );
          }
        }
      }
    } else {
      notify(apiResp?.message, "error");
    }
  };
  /* ---------------------------------------------------------------------------------
     Repeat medicine - "Previous Bills" popup.

     A returning patient usually wants the same medicines again. The popup lists the
     patient's earlier pharmacy bills with their items; whatever is ticked there comes
     back here as [{ ItemID, ItemName, Quantity }] and is added through the SAME path as
     typing the item and pressing ADD: AddItemByItemID resolves today's stock batches
     (first-expiry first, as returned), and addSingleItem prices each batch line with
     today's MRP, tax, panel rate and discounts. Nothing from the old bill but the item
     and the quantity is reused.

     Switch: fin_global_resources "PharmacyRepeatPreviousBill" = 0 hides the button;
     no row (or any other value) shows it.
     --------------------------------------------------------------------------------- */
  const [previousBillsOpen, setPreviousBillsOpen] = useState(false);
  const repeatBillsEnabled = (() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find((item) => item?.Name === "PharmacyRepeatPreviousBill");
    return !row || String(row?.Value).trim() !== "0";
  })();

  const addRepeatItems = async (items) => {
    const notes = [];
    let added = 0;
    const inGrid = new Set(
      (bodyData || []).map((row) => String(row?.ItemID ?? "").split("#")[0]),
    );

    for (const item of items || []) {
      const itemID = String(item?.ItemID ?? "").split("#")[0];
      const wanted = Number(item?.Quantity) || 0;
      if (!itemID || wanted <= 0) continue;
      if (inGrid.has(itemID)) {
        notes.push(`${item.ItemName}: ${t("already in this issue")}`);
        continue;
      }

      let apiResp;
      try {
        apiResp = await AddItemByItemIDPharmecy({
          itemID,
          qty: String(wanted),
          PanelId: values?.Panel?.value,
        });
      } catch (error) {
        notes.push(`${item.ItemName}: ${error?.message || t("could not be added")}`);
        continue;
      }
      const rows = Array.isArray(apiResp?.data) ? apiResp.data : [];
      if (!apiResp?.success || !rows.length) {
        notes.push(`${item.ItemName}: ${apiResp?.message || t("Stock Not Available")}`);
        continue;
      }

      const totalStock = Number(
        rows[0]?.TotalQty ?? rows.reduce((sum, r) => sum + Number(r?.AvlQty || 0), 0),
      );
      if (totalStock <= 0) {
        notes.push(`${item.ItemName}: ${t("Stock Not Available")}`);
        continue;
      }
      let need = Math.min(wanted, totalStock);
      if (totalStock < wanted) {
        notes.push(
          `${item.ItemName}: ${t("only")} ${totalStock} ${t("in stock, added")} ${totalStock} ${t("of")} ${wanted}`,
        );
      }

      // Fill from the batches in the order the API returned them (first expiry first).
      for (const row of rows) {
        if (need <= 0) break;
        const take = Math.min(need, Number(row?.AvlQty || 0));
        if (take <= 0) continue;
        await addSingleItem(
          String(row?.ItemID ?? itemID),
          take,
          row?.stockid,
          values?.Panel?.value,
          true,
        );
        need -= take;
      }
      inGrid.add(itemID);
      added += 1;
    }

    if (added > 0) {
      notify(`${added} ${t("medicine(s) added from previous bills")}`, "success");
      setPreviousBillsOpen(false);
    }
    if (notes.length) {
      notify(notes.join(" | "), added > 0 ? "warn" : "error");
    }
  };

  let medData = [...bodyData];
console.log("patientMembershipMappatientMembershipMap",patientMembershipMap)
  const addSingleItem = async (
    ItemID,
    Quantity,
    stockid,
    PanelId,
    isPaymentControl = true,
    IndentNo = "",
    draftID = 0,
    patientMedicine = 0,
    isSubtitute,
    subtituteItemName,
    subtituteItemId,
    draftSavedQty = 0,
  ) => {
    const currentValues = latestValuesRef.current;
    const currentSearchPatient = latestSearchPatientRef.current;
    const currentPatientMembershipMap = latestPatientMembershipMapRef.current;
    const currentPanelList = latestPanelListRef.current;
    const currentSelectedPackage = latestSelectedPackageRef.current;

    let currentIsCashPanel =
      currentPanelList?.find((item) => item?.value === currentValues?.Panel?.value)?.IsCash ||
      0;

    let apiResp = await AddItemPharmecy(
      ItemID,
      Quantity,
      stockid,
      PanelId,
      0,
      currentIsCashPanel,
      currentSelectedPackage?.length > 0 ? 1 : 0,
      currentValues,
      currentSearchPatient?.patientDetail?.PatientType,
      storeRoleRef.current,
    );
    // If API failed or returned no data, refresh payment binding so PaymentGateway updates
    if (!apiResp?.success || !(apiResp?.data && apiResp?.data.length > 0)) {
      try {
        handleCalculateBillAmount(bodyData);
        // trigger a rerender so PaymentGateway receives latest screen state
        setBodyData((prev) => [...prev]);
      } catch (err) {
        console.error(err);
      }
      if (!apiResp?.success)
      return;
    }

    if (apiResp?.success && apiResp?.data?.length > 0) {
      /* Resolved per item, alongside the panel discount that is already fetched per item
         here — so this adds no new round-trip pattern, just one more call on a path that
         already makes one. Skipped entirely when the flag is off. */
      const ruleHit = applyPharmacyDiscountRules
        ? (
            await ResolveDiscount({
              itemIDs: [Number(ItemID)],
              panelID: Number(currentValues?.Panel?.value) || 0,
              patientType:
                currentSearchPatient?.patientDetail?.PatientType === "IPD"
                  ? 2
                  : 1,
            })
          )?.data?.[0]
        : null;

      const getDiscount = await GetDiscountWithCoPay(
        ItemID,
        currentValues?.Panel?.value ? currentValues?.Panel?.value : "1",
        currentSearchPatient?.patientDetail?.PatientTypeID
          ? currentSearchPatient?.patientDetail?.PatientTypeID
          : "1",
        "",
      );

      // to check duplicate item — compare against the live accumulator
      // (medDataRef.current), NOT the stale `bodyData` closure. During an indent add
      // the table is reset (medDataRef.current = []) and re-populated in a loop; the
      // `bodyData` closure still holds the pre-reset rows, so using it would wrongly
      // flag every re-added item as a duplicate (items get removed but never re-added).
      // Every caller syncs medDataRef.current before calling addSingleItem
      // (manual add -> [...bodyData]; indent add -> []), so it always reflects the
      // rows that are actually about to be in the table.
      let isDuplicate = false;
      medDataRef.current?.map((item) => {
        let duplicate = apiResp?.data?.find(
          (val) => val?.stockid === item?.stockid,
        );
        if (duplicate) {
          isDuplicate = true;
        }
      });

      let data = [...apiResp?.data]?.map((val) => {
        // Stock is re-read here, so a quantity carried in from a saved draft (or an
        // indent) is re-checked against it: the draft may have been saved days ago
        // and the batch may since have been issued to someone else. Cap rather than
        // drop the row, and say why, so the grid can never start out over stock.
        const availableQty = Number(val?.AvlQty);
        const carriedQty = Number(Quantity);
        if (
          !isNaN(availableQty) &&
          availableQty > 0 &&
          !isNaN(carriedQty) &&
          carriedQty > availableQty
        ) {
          notify(
            `Quantity cannot be more than the available stock for item: ${
              val?.ItemName || "Medicine"
            }`,
            "error",
          );
          val.Quantity = availableQty;
        } else {
          val.Quantity = Quantity;
        }
        val.isClinicalTrial = false;
        val.IndentNo = IndentNo;
        // Items added against a pending indent: remember the originally indented quantity.
        // It is not a ceiling — the grid Qty is freely editable.
        if (IndentNo) {
          val.IndentMaxQty = Number(Quantity);
        }
        val.patientMedicine = patientMedicine;
        val.draftID = draftID;
        // Quantity the draft actually holds in the DB. Issuing less than this is a
        // partial issue and is fine; issuing MORE means the draft is out of date, so
        // it has to be updated before the medicine can be billed.
        val.DraftSavedQty = Number(draftSavedQty) || 0;
        val.panelID = currentValues?.Panel?.value ? currentValues?.Panel?.value : 1;
        val.discountCoPay = getDiscount?.data;
        val.patientType = currentSearchPatient?.patientDetail?.PatientType;
        val.DisPer =
          currentSearchPatient?.patientDetail?.PatientType === "IPD"
            ? String(getDiscount?.data?.IPDPanelDiscPercent)
            : String(getDiscount?.data?.OPDPanelDiscPercent);

        /* A saved pharmacy discount rule REPLACES the panel percentage — it does not stack
           on top of it. Two percentages compounding on one line is almost never what anyone
           intends, and once it is billed it cannot be told apart from a correct figure.
           The rule is already the more specific statement: it was written for this panel,
           this patient type and this item.

           A rule that resolves to 0% still replaces: "no discount for this scope" is a
           deliberate thing to have written, and silently falling back to the panel figure
           would ignore it.

           The membership card override below is left exactly where it was — it still wins,
           because it is an entitlement the patient holds rather than a pricing policy. */
        if (applyPharmacyDiscountRules && ruleHit?.HasRule) {
          val.DisPer = String(Number(ruleHit?.DiscountPercent ?? 0));
          // Carried so the counter can answer "why this discount?" with a rule number
          // rather than just a percentage.
          val.PharmacyDiscountRuleID = Number(ruleHit?.MatchedRuleID) || 0;
          val.IsPharmacyRuleDiscount = 1;
        }

        // Active membership card (PHARMACY context) overrides the panel discount
        // when it maps this item.
        const memberRow = currentPatientMembershipMap?.get(Number(val?.ItemID));
        if (memberRow?.DiscPer) {
          val.DisPer = String(memberRow.DiscPer);
          val.IsMembershipCard = 1;
          // The card won, so this line is no longer rule-driven.
          val.IsPharmacyRuleDiscount = 0;
        }
        val.MRP = val?.MRP;
        val.grossAmount = val?.Quantity * val?.MRP;
        val.discountAmount = (
          (val?.Quantity * val?.MRP * val.DisPer) /
          100
        ).toFixed(ROUNDOFF_VALUE);
        val.isSubtitute = isSubtitute ? 1 : 0;
        val.subtituteItemName = subtituteItemName ? subtituteItemName : "";
        val.subtituteItemId = subtituteItemId ? subtituteItemId : "";
        let modifyData = handleCalculatePatientIssue(val);
        // medData.push(modifyData)
        return modifyData;
      });

      if (!isDuplicate) {
        medDataRef.current = [...medDataRef.current, ...data];
        const netData =
          isPaymentControl && handleCalculateBillAmount(medDataRef.current);

        if (netData !== 0) {
          setBodyData(medDataRef.current);
          setValues((val) => ({ ...val, Quantity: "" }));
          setBindDetails((val) => ({ ...val, value: "" }));
          focusInput(MedicineRef);
        }
      } else {
        notify(t("This Item Already Added In List"), "error");
      }
    } else {
      notify(apiResp?.message, "error");
    }
  };

  // let medData = [...bodyData];
  const AddItem = async () => {
    // Blocks a second Add while the first is still in flight — the
    // duplicate check inside addSingleItem reads bodyData, which hasn't
    // been updated yet for an Add that's still awaiting its API call, so
    // rapid-fire Enter/Add before it resolves would otherwise add the same
    // item repeatedly.
    if (isAddingItemRef.current) return 0;

    if (!values?.medicineName) {
      notify(t("Medicine Name Field Is Required"), "error");
      return 0;
    } else if (!values?.Quantity) {
      notify(t("Quantity Field Is Required"), "error");
      return 0;
    } else if (Number(values?.Quantity) <= 0) {
      notify(t("Quantity should be greater than 0"), "error");
      return 0;
    }

    if (
      values?.medicineName?.DrugCategoryName !== "" &&
      Number(values?.Quantity) > Number(values?.medicineName?.DrugQty)
    ) {
      notify(
        t(
          `You cannot Issue more then ${values?.medicineName?.DrugQty} Qty. for ${values?.medicineName?.DrugCategoryName} Drug`,
        ),
        "error",
      );
      return 0;
    }

    // addSingleItem(
    //   values?.medicineName?.ItemID?.split("#")[0],
    //   values?.Quantity,
    //   values?.medicineName?.stockid,
    //   values?.Panel?.value
    // );

    isAddingItemRef.current = true;
    try {
      // No batch picked (e.g. a no-stock row, stockid 0) - let the item-wise lookup find the
      // batches instead of asking for stock id 0 / "undefined".
      if (
        values?.medicineName?.AvlQty < Number(values?.Quantity) ||
        !stockIdOf(values?.medicineName)
      ) {
        medDataRef.current = [...bodyData];
        await addMoreItemByItemId();
      } else {
        medDataRef.current = [...bodyData];
        await addSingleItem(
          values?.medicineName?.ItemID?.split("#")[0],
          values?.Quantity,
          stockIdOf(values?.medicineName),
          values?.Panel?.value,
        );
      }
    } finally {
      isAddingItemRef.current = false;
    }
  };

  /* SRSSAIH-2026-0061 — with the IPD split on, IPD is issued on /ipd-pharmacy-issue and
     this screen refuses it, so the same issue cannot be raised on two screens.

     Flag off (the default) this screen behaves exactly as it always has: OPD, IPD and EMG
     all accepted here. */
  const separateIPDIssue =
    (Array.isArray(GetGlobalResources) ? GetGlobalResources : [])?.find(
      (item) => item?.Name === "SeparateIPDPharmacyIssue",
    )?.Value == 1;

  /* SRSSAIH-2026-0061 Point 4 — apply the discount rules saved on
     /pharmacy-discount-setup to the medicine being issued.

     Default 0 = off = today's behaviour: the panel percentage alone. This is the switch
     that changes BILLED AMOUNTS, so it is opt-in per client and per environment. */
  const applyPharmacyDiscountRules =
    (Array.isArray(GetGlobalResources) ? GetGlobalResources : [])?.find(
      (item) => item?.Name === "ApplyPharmacyDiscountRules",
    )?.Value == 1;

  /* SRSSAIH-2026-0061 Point 7 Slice C — a medicine the ward indented that is not payable on
     the patient's panel is replaced by a same-salt medicine that is, the indent line is
     updated, and the original is recorded.

     Default 0 = off = issue exactly what was indented. This flag changes WHICH MEDICINE
     reaches a patient, so it stays off until the panel mappings have been reviewed. */
  const panelSubstituteMedicine =
    (Array.isArray(GetGlobalResources) ? GetGlobalResources : [])?.find(
      (item) => item?.Name === "PanelSubstituteUnmappedMedicine",
    )?.Value == 1;

  /* Indent-wise medicine work, fin_global_resources 'IsIndentWiseMedicineOPDReturn'.

     Default 0 = off = the value this screen has always written. On, a "Save in
     Pharmacy" bill for an admitted patient carries the admission's TransactionID,
     which is what makes that medicine reachable from the admission for return and
     indent. See utils/indentWiseMedicineOPDReturn.js. */
  const indentWiseOPDReturn = isIndentWiseMedicineOPDReturnEnabled(GetGlobalResources);

  /* Refusing an IPD PATIENT is not enough. The Pending Indents list is itself IPD data,
     and it is reachable before any patient is chosen — pick an indent there and the screen
     adopts that indent's IPD patient, never passing through the check below. So with the
     split on, this screen must not offer the IPD door at all. */

  const patientTypeAllowedHere = (patientType) => {
    if (
      separateIPDIssue &&
      String(patientType || "").toUpperCase() === "IPD"
    ) {
      notify(
        t("IPD patients are issued on the IPD Pharmacy Issue screen."),
        "error",
      );
      return false;
    }
    return true;
  };

  const handleCloseSearchPatient = async (value) => {
    if (!patientTypeAllowedHere(value?.PatientType)) return;

    setSearchPatient((val) => ({
      ...val,
      value: value?.PatientName,
      patientDetail: value,
    }));
    //
    // setValues((val) => ({
    //   ...val,
    //   Doctor: { value: value?.DoctorID },
    //   // Panel: { value: value?.PanelID ? value?.PanelID : 1 },
    //   SearchTypeNumber: "",
    // }));

    handleGetPharmacyPackageData(value);
    getPanelIdList(value);
  };

  const handleGetPharmacyPackageData = async (value) => {
    try {
      const payload = {
        uhid: value?.PatientID,
        pName: "",
        billNo: "",
        fromDate: "",
        toDate: "",
        recieptNo: "",
        ipdNo: value?.IPDNo ? value?.IPDNo : "0",
      };
      const apiResp = await PostIncludeBillApi(payload);

      if (apiResp?.success) {
        setPackageData(apiResp?.data);
      } else {
        setPackageData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setPackageData([]);
    }
  };

  /* A discount is never negative. The boxes are plain text, so a minus - typed, or pasted in
     front of a figure already there - got through the number check and took the line's
     amount above its own price. */
  const isNegativeText = (value) => String(value ?? "").includes("-");

  const handleCustomInput = (index, name, value, type, max, errorMsg) => {
    // ;
    if (
      (name === "DisPer" || name === "discountAmount") &&
      isNegativeText(value)
    ) {
      return false;
    }
    if (type === "number") {
      if (!isNaN(value) && Number(value) <= max) {
        const data = [...bodyData];
        data[index][name] = value;
        let calculatedData = handleCalculatePatientIssue(data[index], name);
        data[index] = calculatedData;
        handleCalculateBillAmount(data);
        setBodyData(data);
      } else {
        if (errorMsg && !isNaN(value) && Number(value) > max) {
          notify(errorMsg, "error");
        }
        return false;
      }
    } else {
      const data = [...bodyData];
      data[index][name] = value;
      name !== "isClinicalTrial" &&
        name !== "ClinicalRemark" &&
        handleCalculateBillAmount(data);
      setBodyData(data);
    }
  };

  /* Discount boxes in the item table's header - type once, every line gets it.

     Until now a discount had to be typed line by line. On a bill of fifteen medicines
     that is fifteen keystrokes for one figure, and it is easy to miss a line. These two
     boxes sit in the table header and write the same discount down the whole table.

     The two are the same figure seen two ways, so each one fills the other in:

       Dis(%)    the percent goes on every line as it stands, and the box beside it
                 shows what that comes to in rupees.
       Dis Amt   a rupee total for the bill, split across the lines in proportion to
                 what each one costs, so a line worth twice as much carries twice the
                 discount. The last line takes the rounding difference, which is how the
                 split always adds back to exactly the figure that was typed.

     Nothing here is a separate kind of discount: the lines end up holding the same
     DisPer / Dis Amt they would hold had each one been typed by hand, and the bill,
     the payload and the save see nothing new. A line can still be corrected afterwards
     - the header box does not hold it. */
  const [bulkDiscount, setBulkDiscount] = useState({
    DisPer: "",
    discountAmount: "",
  });

  const handleBulkDiscount = (name, value) => {
    if (
      ischecked ||
      isNaN(value) ||
      isNegativeText(value) ||
      !(bodyData?.length > 0)
    ) {
      return false;
    }
    const data = bodyData?.map((row) => ({ ...row }));
    const totalGross = data?.reduce(
      (ac, row) => ac + Number(row?.Quantity || 0) * Number(row?.MRP || 0),
      0,
    );

    if (name === "DisPer") {
      if (Number(value) > 100) {
        return false;
      }
      data?.forEach((row) => {
        row.DisPer = value;
        handleCalculatePatientIssue(row, "DisPer");
      });
      const spread = data?.reduce(
        (ac, row) => ac + Number(row?.discountAmount || 0),
        0,
      );
      setBulkDiscount({
        DisPer: value,
        discountAmount: value === "" ? "" : spread.toFixed(ROUNDOFF_VALUE),
      });
    } else {
      // More discount than the bill is worth is not a discount, and with no gross
      // there is nothing to split against.
      if (Number(value) > totalGross || !(totalGross > 0)) {
        return false;
      }
      const total = Number(value || 0);
      let left = total;
      const lastIndex = data.length - 1;
      data?.forEach((row, index) => {
        const gross = Number(row?.Quantity || 0) * Number(row?.MRP || 0);
        // The last line is given whatever is left rather than its own share, so the
        // rounding on the lines above cannot make the split miss the typed figure.
        const share =
          index === lastIndex
            ? left
            : Number(((total * gross) / totalGross).toFixed(ROUNDOFF_VALUE));
        left = Number((left - share).toFixed(ROUNDOFF_VALUE));
        row.discountAmount = share.toFixed(ROUNDOFF_VALUE);
        handleCalculatePatientIssue(row, "discountAmount");
      });
      setBulkDiscount({
        discountAmount: value,
        DisPer:
          value === "" ? "" : ((total * 100) / totalGross).toFixed(ROUNDOFF_VALUE),
      });
    }

    handleCalculateBillAmount(data);
    setBodyData(data);
  };
  // Final stock guard. The grid Qty input and the indent/draft popup already cap
  // what can be typed, but those caps live in the UI only. This re-checks the rows
  // that are actually being submitted, so a quantity that never went through an
  // onChange — a draft re-opened after the stock dropped, or a value patched into
  // the React state directly — still cannot be billed or saved as a draft.
  const findOverStockRow = (rows) =>
    rows?.find((val) => {
      const available = Number(val?.AvlQty);
      const quantity = Number(val?.Quantity);
      return (
        !isNaN(available) && !isNaN(quantity) && quantity > available
      );
    });

  const deleteRowData = (index) => {
    const data = [...bodyData];
    data.splice(index, 1);
    handleCalculateBillAmount(data);
    setBodyData(data);
  };
  const [paymentControlModeState, setPaymentControlModeState] =
    useState(PAYMENT_OBJECT);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [discounts, setDiscounts] = useState({
    discountApprovalList: [],
    discountReasonList: [],
  });

  /* Discount ke teen list - reason, Approved By, aur is user ki eligible %.

     Pehle ye teeno Promise.all me thin. Promise.all me se EK bhi call girti hai to
     poora catch me chala jaata hai aur TEENO list khaali reh jaati hain - aur catch
     me sirf console.error tha, user ko kuch pata hi nahi chalta.

     Isi se wo hota tha jo live par kabhi-kabhi dikhta hai: discount bharne par
     "Approved By" bind hi nahi hota. Auto-bind ki shart list par tiki hai
     (PaymentGateway me firstApprover = discountApprovalList[0]), aur list khaali
     ho to kuch nahi hota. Local par network girta hi nahi, isliye wahan kabhi nahi dikha.

     Ab allSettled - ek call girne par baaki do apna kaam kar leti hain. Aur Approved By
     ki list na aaye to user ko batate hain, chupchaap nahi rehte. */
  const GetDiscListAPI = async () => {
    const [reasonRes, approvalRes, eligibleRes] = await Promise.allSettled([
      GetDiscReasonList("OPD"),
      BindDisApprovalList("HOSPITAL", "1"),
      GetEligiableDiscountPercent(userData?.employeeID),
    ]);

    const discountReasonList =
      reasonRes.status === "fulfilled" ? reasonRes.value?.data : null;
    const discountApprovalList =
      approvalRes.status === "fulfilled" ? approvalRes.value?.data : null;
    const eligibleDiscountPercent =
      eligibleRes.status === "fulfilled"
        ? eligibleRes.value?.data?.Eligible_DiscountPercent
        : null;

    if (discountReasonList)
      setDiscounts((val) => ({ ...val, discountReasonList }));
    if (discountApprovalList)
      setDiscounts((val) => ({ ...val, discountApprovalList }));
    if (eligibleDiscountPercent)
      setDiscounts((val) => ({
        ...val,
        Eligible_DiscountPercent: eligibleDiscountPercent,
      }));

    /* Sirf Approved By ki khabar di jaati hai. Baaki do chup-chaap chhoot jaayein to
       chal jaata hai, par ye na ho to discount save hi nahi hoga - aur user ko wajah
       pata honi chahiye. */
    return Boolean(discountApprovalList?.length);
  };
  useEffect(() => {
    GetDiscListAPI();
  }, []);

  /* Dobara koshish - jab user discount bharta hai aur Approved By ki list khaali hai.

     List mount par ek hi baar aati hai. Us waqt call gir gayi to page dobara khole
     bina kabhi nahi aati thi, aur user discount bhar kar atak jaata tha. Ab jis pal
     discount bhara jaata hai, list khaali ho to ek baar aur mangwayi jaati hai. */
  const discountListRetryRef = useRef(false);
  useEffect(() => {
    const needsList =
      Number(bulkDiscount?.discountAmount) > 0 ||
      Number(bulkDiscount?.DisPer) > 0;

    if (!needsList) return;
    if (discounts?.discountApprovalList?.length > 0) return;
    if (discountListRetryRef.current) return;

    discountListRetryRef.current = true;
    (async () => {
      const ok = await GetDiscListAPI();
      if (!ok) {
        notify(
          t("Approved By list could not be loaded. Please refresh the page."),
          "error",
        );
      }
    })();
  }, [bulkDiscount?.discountAmount, bulkDiscount?.DisPer, discounts?.discountApprovalList]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (values?.type?.value === 2 || values?.type?.value === 3) {
        document.querySelector("#title input")?.focus();
      }

      if (values?.type?.value === 1) {
        searchPatientRef?.current?.focus?.();
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [values?.type?.value]);
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
      discountIsDefault,
      coPayIsDefault,
      DepositedBy,
    } = details;
    const setData = {
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
      discountIsDefault,
      coPayIsDefault,
      DepositedBy,
    };

    const currentSelectedPackage = latestSelectedPackageRef.current;
    if (currentSelectedPackage?.length > 0) {
      setData.autoPaymentMode = 4;
    }

    if (
      currentSelectedPackage?.length > 0 &&
      setData?.minimumPayableAmount > currentSelectedPackage[0]?.PharmacyAmt
    ) {
      notify(t("Your Package credit is Exhausted"), "error");
      return 0;
    } else {
      setPaymentMethod([]);
      setPaymentControlModeState(setData);
    }
    return setData;
  };

  const handleCalculateBillAmount = (tableList) => {
    // Default payment mode = Credit (PaymentModeID 4) only for IPD / EMG, or
    // whenever the bill contains items added from an indent (indent issues are
    // always against IPD / EMG patients — the IndentNo is a reliable signal even
    // before the patient detail finishes loading). OPD / walk-in patients get
    // no Credit default (0).
    const currentValues = latestValuesRef.current;
    const currentSearchPatient = latestSearchPatientRef.current;

    const isIndentIssue = tableList?.some((row) => row?.IndentNo);
    const patientType = currentSearchPatient?.patientDetail?.PatientType;
    const autoPaymentMode =
      isIndentIssue || patientType === "IPD" || patientType === "EMG" ? 4 : 0;
    const data = calculateBillAmount(
      tableList,
      BindResource?.IsReceipt,
      currentValues?.type === 2
        ? 0
        : currentValues?.patientAdvanceAmount
          ? currentValues?.patientAdvanceAmount
          : 0,
      0,
      autoPaymentMode,
      0.0,
      Number(currentValues?.Panel?.value) === 1 ? 1 : 0,
      0,
    );
    return handlePaymentGateWay(data);
  };
  // Handle Payment End

  const handleOpenClinicalTrial = async (val, index) => {
    const apiResp = await PharmacyClinicalTrialAPI(
      `?ItemID=${bodyData[index]?.ItemID}&PatientId=${SearchPatient?.patientDetail?.PatientID}`,
    );
    if (!apiResp?.success) {
      notify(apiResp?.message, "error");
      return false;
    }
    setModalData({
      visible: true,
      width: "50vw",
      label: (
        <span>
          {t("Clinical Trial Remarks")}({t("Item Name")} :{" "}
          <span style={{ color: "#004eff" }}>
            {" "}
            {apiResp?.data[0]?.TypeName}{" "}
          </span>{" "}
          ){" "}
        </span>
      ),
      footer: <></>,
      Component: <ClinicalTrialModal bodyData={apiResp?.data} />,
    });
  };

  /* ?indentNo=... ke saath aane par wo indent khud khul jaata hai.

     Yaani /pharmacy-issue?indentNo=PIDL2627-001110 jaisa link seedha us indent
     ka popup khol deta hai - Indents dabane aur usme dhoondhne ki zarurat nahi.

     Abhi app ke andar se koi aisa link nahi banata: Clearance ki "View
     Requisition" pehle yahan bhejti thi, par ab wo popup wahin khol leti hai
     taaki Discharge Process ki screen na chhoote. Ye raasta jaan-bujh kar
     rakha gaya hai - link bheja ja sakta hai aur reload par bhi chalta hai.

     Ek hi baar - openedIndentFromUrlRef. Bina iske har render par popup dobara
     khulta rehta.

     URL se isliye, state se nahi: reload par bhi bacha rehta hai aur link
     kisi aur ko bheja ja sakta hai. Padhne ke baad use URL se hata diya jaata
     hai, warna user popup band kare aur page refresh ho to wo phir khul jata. */
  const openedIndentFromUrlRef = useRef(false);

  useEffect(() => {
    if (openedIndentFromUrlRef.current) return;

    const fromUrl = new URLSearchParams(window.location.search).get("indentNo");
    if (!fromUrl) return;

    openedIndentFromUrlRef.current = true;

    // URL saaf, taaki refresh par popup dobara na khule.
    try {
      const clean = new URL(window.location.href);
      clean.searchParams.delete("indentNo");
      window.history.replaceState({}, "", clean.toString());
    } catch (error) {
      /* URL saaf na ho paye to bhi popup khulna chahiye */
    }

    handleOpenIndent({
      label: t("Pending Indent`s"),
      width: "90vw",
      type: "indent",
      buttonName: "Add",
      CallAPI: handleAddIndentItem,
      saleOnList: saleOnList,
      autoIndentNo: fromUrl,
    });
  }, [saleOnList]);

  const handleOpenIndent = async (args) => {
    /* Guard the ACTION, not only the button. Anything that opens the IPD indent list on
       the shared page, or the OPD prescription list on the IPD page, is refused here with
       the message that says where to go instead. */
    if (args?.type === "indent" && separateIPDIssue) {
      notify(
        t("IPD indents are issued on the IPD Pharmacy Issue screen."),
        "error",
      );
      return;
    }
    return handleOpenIndentInner(args);
  };

  const handleOpenIndentInner = async ({
    label,
    width,
    type,
    CallAPI,
    buttonName,
    saleOnList,
    /* Clearance se aane par wahan ka indent, taaki popup khulte hi wahi indent
       khud khul jaye. Aam Indents button par ye hota hi nahi, isliye tab sab
       pehle jaisa. */
    autoIndentNo,
  }) => {
    if (type === "indent") {
      setSearchPatient((val) => ({ ...val, patientDetail: {} }));
    }

    setModalData({
      visible: true,
      type: type,
      width: width,
      label: label,
      buttonName: buttonName,
      CallAPI: CallAPI,
      // footer: <></>,
      Component: (
        <IndentReqModal
          department={department}
          type={type}
          saleOnList={saleOnList}
          autoIndentNo={autoIndentNo}
          setParentValues={setValues}
          setSearchPatient={setSearchPatient}
          SearchPatient={SearchPatient?.patientDetail}
          handleCustomInput={handleCustomInput}
          setModalData={setModalData}
        />
      ),
    });
  };

  const handleAddIndentItem = async (data) => {
    // Prevent duplicate additions when the "Add" button is clicked multiple times
    // quickly: a second invocation would overlap the first (both reset then append
    // to medDataRef.current) and produce duplicate rows.
    
    if (isAddingIndentRef.current) {
      return;
    }
    if (data?.length) {
      isAddingIndentRef.current = true;
      setIsAddingIndent(true);
      try {
      if (data[0]?.draftDetailID) {
        if (data[0]?.PatientID !== "CASH002") {
          setSearchPatient((val) => ({
            ...val,
            value: data[0]?.PatientID,
            isCallhandleChange: true,
          }));
        } else {
          let { Address, Title, PName, Age, ContactNo, DoctorID, gender } =
            data[0];
          // The draft stores a registered DoctorID, so keep it as an option object
          // (that is what preserves pmh.doctorID) but resolve its label too — without
          // one, pmh.doctorName silently fell back to "DR. SELF".
          const draftDoctorName =
            data[0]?.DoctorName ||
            mainDoctorList?.find(
              (doc) => String(doc?.DoctorID) === String(DoctorID),
            )?.Name ||
            "";
          setValues((val) => ({
            ...val,
            Address: Address,
            type: { value: 2 },
            title: { value: Title },
            Name: PName.split(`${Title} `)[1],
            Age: Age.split(" ")[0],
            AgeType: { value: Age.split(" ")[1] },
            Gender: { value: gender },
            ContactNo: ContactNo,
            Doctor: { value: DoctorID, label: draftDoctorName },
          }));
          setSearchPatient((val) => ({ ...val, value: "", patientDetail: {} }));
        }
      } else if (data[0]?.screenType === "prescription") {
        setSearchPatient((val) => ({
          ...val,
          value: data[0]?.PatientID,
          isCallhandleChange: true,
        }));
        // setValues((val)=>({...val,patientBarcode:data[0]}))
      }
// debugger
      setBodyData([]);
      medDataRef.current = [];
      // setIndentData(data);

      /* P7C — swap anything the panel will not pay for, BEFORE the rows are added.
         Doing it here rather than per row means one lookup for the whole indent, and the
         pharmacist sees the finished list rather than watching it change under them. */
      let panelSubstitutions = [];
      if (panelSubstituteMedicine) {
        const substPanelID =
          Number(data?.[0]?.PanelID) || Number(values?.Panel?.value) || 0;

        // Item ids arrive as "123" or "123#456" (item#stock) depending on the path.
        const bareID = (v) => Number(String(v ?? "").split("#")[0]) || 0;
        const askedIDs = [...new Set(data.map((d) => bareID(d?.ItemID)))].filter(
          Boolean,
        );

        const res = askedIDs.length
          ? await SubstitutionResolve({
              panelID: substPanelID,
              itemIDs: askedIDs,
            })
          : null;

        if (res?.success) {
          const byID = new Map(
            (res?.data || []).map((r) => [Number(r?.ItemID), r]),
          );

          const blockedWithNothing = [];

          data = data.map((row) => {
            const hit = byID.get(bareID(row?.ItemID));
            if (hit?.Status !== "BLOCKED") return row;

            if (!hit?.Suggested?.ItemID) {
              // Nothing to swap to. Say so — never guess across salts.
              blockedWithNothing.push(hit?.ItemName || row?.ItemName);
              return row;
            }

            panelSubstitutions.push({
              requestedItemID: bareID(row?.ItemID),
              issuedItemID: Number(hit.Suggested.ItemID),
              saltID: Number(hit.Suggested.SaltID) || 0,
              strengthMatched: Number(hit.Suggested.StrengthMatched) || 0,
              indentNo: row?.IndentNo || "",
              transactionID: Number(row?.TransactionID) || 0,
              _from: hit?.ItemName || "",
              _to: hit.Suggested.ItemName || "",
              _strengthMatched: Number(hit.Suggested.StrengthMatched) === 1,
            });

            return {
              ...row,
              ItemID: String(hit.Suggested.ItemID),
              ItemName: hit.Suggested.ItemName,
              /* The batch id on this row belongs to the medicine that is NOT being
                 issued. Carrying it over would pick a batch of the wrong item, so the
                 line falls back to the default and lets the add API choose. */
              stockid: 1,
            };
          });

          if (blockedWithNothing.length > 0) {
            notify(
              `Not payable on this panel and no same-salt alternative is mapped: ${blockedWithNothing.join(
                ", ",
              )}`,
              "warn",
            );
          }
        }
      }

      // A row contributes an item only when it issues a positive quantity — either
      // the main item or a selected substitute. Rows with zero issue quantity must
      // not be added (the user can zero out the Issue field in the popup).
      const willAddItem = (row) => {
        const main = Number(row?.IssueQuantity || 0);
        const sub = Number(row?.ItemObj?.IssueQuantity || 0);
        if (sub > 0) return true;
        if (row?.isSubtitute === 1) return false; // substitute selected but zeroed
        return main > 0;
      };
      // The bill amount is recalculated on the final add (isPaymentControl), so that
      // flag must land on the last row that is actually added — not simply the last
      // row in the list, which may have been skipped for zero quantity.
      let lastAddIndex = -1;
      for (let i = data.length - 1; i >= 0; i--) {
        if (willAddItem(data[i])) {
          lastAddIndex = i;
          break;
        }
      }

      for (let index = 0; index < data.length; index++) {
        const val = data[index];
        const mainIssueQty = Number(val?.IssueQuantity || 0);
        const subIssueQty = Number(val?.ItemObj?.IssueQuantity || 0);

        // Skip zero-qty rows.
        if (!willAddItem(val)) {
          continue;
        }
        const isLastAdd = index === lastAddIndex;
        // What this item currently holds in the draft (the popup's "Requested"
        // column). Only meaningful for draft rows; indent/prescription rows leave it 0.
        const draftSavedQty = val?.draftDetailID
          ? Number(val?.TotalReqQty ?? val?.ReqQty ?? 0)
          : 0;
        // If both main item and substitute have quantities, add both.
        if (subIssueQty > 0) {
          // add main item first if it has quantity
          if (mainIssueQty > 0) {
            await addSingleItem(
              String(val?.ItemID),
              mainIssueQty,
              val?.stockid || 1,
              val?.PanelID,
              false,
              val?.IndentNo,
              val?.draftDetailID,
              val?.patientMedicine,
              0,
              "",
              "",
              draftSavedQty,
            );
          }

          // then add substitute
          await addSingleItem(
            String(val?.ItemObj?.ItemID?.split("#")[0]),
            subIssueQty,
            val?.ItemObj?.ItemID?.split("#")[1] != null ? String(val.ItemObj.ItemID.split("#")[1]) : val?.stockid || 1,
            val?.PanelID,
            isLastAdd,
            val?.IndentNo,
            val?.draftDetailID,
            val?.patientMedicine,
            1,
            val?.ItemName || "",
            val?.ItemID || "",
          );
        } else {
          // only the main item has a positive quantity (subIssueQty is 0 here, and a
          // zeroed substitute row was already skipped above)
          await addSingleItem(
            String(val?.ItemID),
            mainIssueQty,
            val?.stockid || 1,
            val?.PanelID,
            isLastAdd,
            val?.IndentNo,
            val?.draftDetailID,
            val?.patientMedicine,
            0,
            "",
            "",
            draftSavedQty,
          );
        }
      }
      /* P7C — the rows are in, so make the swap durable and tell the pharmacist what
         changed. Recorded here rather than at save because the indent line has to point at
         what is actually going out, and the pharmacist is looking at the substituted list
         right now; a swap they can see is one they can undo before saving.

         A failure to record must NOT lose the issue: the medicines are already on screen
         and the pharmacist can still save. It is reported and left to be reconciled from
         the log rather than silently swallowed. */
      if (panelSubstitutions.length > 0) {
        const applyRes = await SubstitutionApply({
          panelID:
            Number(data?.[0]?.PanelID) || Number(values?.Panel?.value) || 0,
          patientID: SearchPatient?.patientDetail?.PatientID || "",
          reason: "Not mapped to the patient's panel",
          rows: panelSubstitutions.map((x) => ({
            requestedItemID: x.requestedItemID,
            issuedItemID: x.issuedItemID,
            saltID: x.saltID,
            strengthMatched: x.strengthMatched,
            indentNo: x.indentNo,
            transactionID: x.transactionID,
          })),
        });

        const swaps = panelSubstitutions
          .map(
            (x) =>
              `${x._from} → ${x._to}${x._strengthMatched ? "" : " (different strength)"}`,
          )
          .join(" · ");

        if (applyRes?.success) {
          notify(`Not payable on this panel, substituted: ${swaps}`, "warn");
        } else {
          notify(
            `Substituted ${swaps}, but the change could not be recorded: ${
              applyRes?.message || "unknown error"
            }. Check the indent before issuing.`,
            "error",
          );
        }
      }

      setModalData({ visible: false });
      } finally {
        isAddingIndentRef.current = false;
        setIsAddingIndent(false);
      }
    } else {
      notify(t("Please Select Atleast One Item"), "error");
      return 0;
    }
  };

  const DraftPharmecyAPI = async () => {
    const overStockItem = findOverStockRow(bodyData);
    if (overStockItem) {
      notify(
        `Quantity cannot be more than the available stock for item: ${
          overStockItem?.ItemName || "Medicine"
        }`,
        "error",
      );
      return;
    }
    const payload = DraftPharmecyAPIPayload(
      SearchPatient?.patientDetail,
      bodyData,
      values,
      BindResource,
    );
    const apiResp = await DraftPharmecyAPICall(payload);
    if (apiResp?.success) {
      notify(apiResp?.message, "success");
      setBodyData([]);
      setValues(initialValue);
      setPaymentControlModeState(PAYMENT_OBJECT);
      setPaymentMethod([]);
      setBindDetails({
        label: t("Search Medicine"),
        value: "",
        className: "required-fields",
      });
      setSearchPatient((val) => ({ ...val, ["patientDetail"]: {}, value: "" }));
      setPackageData([]);
    } else {
      notify(apiResp?.message, "error");
    }
  };
  useEffect(() => {
    if (SearchPatient?.patientDetail?.PatientID) {
      const fetchMedicalInfo = async () => {
        const res = await GetPatientMedicalInfo(
          SearchPatient?.patientDetail?.PatientID,
        );

        if (res?.success) {
          setmedicalInfo(res?.data);
        }
      };

      fetchMedicalInfo();
    }
  }, [
    SearchPatient?.patientDetail?.PatientID,
    SearchPatient?.patientDetail?.IPDNo,
    SearchPatient?.patientDetail?.EmergencyNo,
    SearchPatient?.patientDetail?.ContactNo,
    SearchPatient?.patientDetail?.PatientName,
  ]);

  // Load the patient's active membership-card discounts for the PHARMACY context
  // (most-specific item/subcategory/category match), keyed by ItemID. Applied to
  // each row's DisPer when a medicine is added.
  useEffect(() => {
    if(!SearchPatient?.patientDetail?.PatientID){
      return
    }
    const patID = SearchPatient?.patientDetail?.PatientID;
    if (!patID) {
      setPatientMembershipMap(new Map());
      setMembershipCardInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // The card can carry a panel specific rate (e.g. Northern Railway), so the
        // patient's panel decides which mapping applies.
        const res = await GetPatientMembershipDetails(
          patID,
          "PHARMACY",
          values?.Panel?.value || "",
        );
        if (cancelled || !res?.success) {
          if (!cancelled) {
            setPatientMembershipMap(new Map());
            setMembershipCardInfo(null);
          }
          return;
        }
        const list = Array.isArray(res?.data) ? res.data : [];
        setPatientMembershipMap(
          new Map(list.map((m) => [Number(m?.ItemId), m])),
        );
        setMembershipCardInfo(list[0] || null);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-run when the panel arrives or changes: the card can hold a panel
    // specific rate, and on first load the panel is not populated yet.
  }, [SearchPatient?.patientDetail?.PatientID, values?.Panel?.value]);

  const ErrorValidation = () => {
    let errors = {};
    if (!values?.Name) {
      errors.name = t("Name Field Is Required.");
    } else if (!String(values?.ContactNo ?? "").trim()) {
      // Walk In: Contact No is mandatory (the API refuses a walk-in sale without it too)
      errors.ContactNo = t("Please Enter Contact No.");
    }

    /* Register & Issue par Mobile aur Gender zaroori hain.

       Register ka matlab hi pehchaan hai. Mobile na ho to patient_master me ek
       aisi qatar ban jaati hai jise dobara pehchana nahi ja sakta, aur Gender
       ke bina report aur clinical kaam dono adhoore reh jaate hain.

       Ye rok SIRF teesre option par hai. Walk-In aur Registered ki validation
       jaisi thi waisi hi hai - wahan aaj bhi sirf Naam zaroori hai. */
    if (isRegisterMode) {
      if (!values?.ContactNo) {
        errors.ContactNo = t("Contact No. Field Is Required.");
      } else if (!values?.Gender?.value) {
        errors.Gender = t("Gender Field Is Required.");
      }
    }
    // else if (!values?.Age) {
    //   errors.Age = t("Age Field Is Required.");
    // } else if (!values?.Gender?.value) {
    //   errors.Gender = t("Gender Field Is Required.");
    // } else if (!values?.ContactNo) {
    //   errors.ContactNo = t("Contact No. Field Is Required.");
    // }
    //  else if (!values?.Doctor) {
    //   errors.Doctor = t("Please Select A doctor.");
    // }
    return errors;
  };
  const fileInputRef = useRef(null);
  const [password, setPassword] = useState("");
  const [userConfirmation, setUserConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExpiryColour, setIsExpiryColour] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [nearExpiryMonths, setNearExpiryMonths] = useState(2);
  const [patientTypeState, setPatientTypeState] = useState("");
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
        notify(response?.message || "Verification Successful", "success");
        setUserConfirmation(false);
        setShowPassword(false);
        setPassword("");
        ExecuteSaveAPI(patientTypeState);
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
    setPassword("");
    setPatientTypeState("");
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
  const handleSave = (skipPrescriptionCheck = false, patientType = "") => {
  /* Ek save chal raha ho to doosra andar hi nahi aata. Slow network par user do-teen
     baar daba deta hai, aur tabhi server ki duplicate wali rok bolti hai. */
  if (saveInFlightRef.current) return;

  // First ask Save Location
  if (!patientType) {
    const ipdNo = SearchPatient?.patientDetail?.IPDNo || data?.ipdno;

    const isCredit =
      paymentMethod?.length > 0 &&
      paymentMethod[0]?.PaymentModeID === 4;

    const isCash =
      paymentMethod?.length > 0 &&
      paymentMethod[0]?.PaymentModeID === 1;


    let showModal = false;
    if ((ipdNo && isCredit) || (ipdNo && isCash)) {
      const setting = GetGlobalResources?.find(
        item => item.Name === "IsBillSattlmentIPDOPD"
      );
      if (setting?.Value == 1 ) {
        showModal = true;
      }
    }
    /* Panels whose medicine may not go onto the admission.

       Kept in fin_global_resources (PharmacyIssueBlockSaveInHospitalPanels) as a list of
       panel ids, so a site changes who is on it without a deployment. Empty - or the
       setting missing - blocks nobody, which is how this screen worked before.

       Save in Pharmacy is always offered; only the hospital side is closed, and the
       button says why rather than simply refusing to respond. */
    const blockedPanels = String(
      GetGlobalResources?.find(
        (item) => item.Name === "PharmacyIssueBlockSaveInHospitalPanels",
      )?.Value ?? "",
    )
      .split(",")
      .map((id) => Number(String(id).trim()))
      .filter((id) => id > 0);

    const currentPanel = Number(values?.Panel?.value) || 0;
    const saveInHospitalBlocked =
      currentPanel > 0 && blockedPanels.includes(currentPanel);

    if (showModal && SearchPatient?.patientDetail?.STATUS === "IN") {
      handleModel(
        t("Confirmation"),
        "30vw",
        "confirmation",
        true,

        <div>
        {/* Why one of the two is dead. A greyed button with nothing beside it reads as a
            screen that has stopped working. */}
        {saveInHospitalBlocked && (
          <div className="text-center text-danger pt-2" style={{ fontSize: "0.78rem" }}>
            <i className="fa fa-info-circle mr-1" aria-hidden="true" />
            {t("This scheme's medicine is billed by the pharmacy, not the admission")}
          </div>
        )}
        <div className="d-flex justify-content-center py-2">

          <button
            className="btn mx-3"
            style={{
              color: "white",
              borderRadius: "8px",
              minWidth: "100px",
              padding: "6px 10px",
              ...(saveInHospitalBlocked
                ? { opacity: 0.5, cursor: "not-allowed" }
                : {}),
            }}
            disabled={saveInHospitalBlocked}
            title={
              saveInHospitalBlocked
                ? t("This scheme's medicine is billed by the pharmacy")
                : undefined
            }
            onClick={()=>{
              setHandleModelData(false);
              handleSave(skipPrescriptionCheck,"IPD");
            }}
          >
            {t("Save in Hospital")}
          </button>


          <button
            className="btn mx-3"
            style={{
              color:"white",
              borderRadius:"8px",
              minWidth:"100px",
              padding:"6px 10px"
            }}

            onClick={()=>{
              setHandleModelData(false);
              handleSave(skipPrescriptionCheck,"OPD");
            }}
          >
            {t("Save in Pharmacy")}
          </button>

        </div>
        </div>
      );

      return;
    }
  }



  // -----------------------------
  // Your Existing Validation Start
  // -----------------------------


  if (bodyData?.length === 0) {
    notify(t("Please Add Atleast One Item"), "error");
    return;
  }


  if (!paymentMethod || paymentMethod.length === 0) {
    notify(t("Please select payment mode"), "error");
    return;
  }



  const itemWithLowMRP = bodyData?.find((item)=>{

    if(item?.MRP && item?.Rate){
      return Number(item.MRP) < Number(item.Rate);
    }

    return false;
  });



  if(itemWithLowMRP){

    notify(
      `MRP Price cannot be less than Unit Price for item: ${
        itemWithLowMRP?.ItemName || "Medicine"
      }`,
      "error"
    );

    return;
  }



  if(
    selectedPackage?.length > 0 &&
    paymentControlModeState?.netAmount >
    selectedPackage[0]?.PharmacyAmt
  ){

    notify(
      t("Bill exceeds the allowed package amount"),
      "warn"
    );

    return;
  }




  /* A discount still needs a reason chosen — unless it came from a saved rule. A rule
     already carries its own audit trail (the rule id is on the line), and asking the
     counter to justify a policy somebody else configured turns a required field into a
     box people tick without reading.

     Only rule-driven lines are exempt: a manual or panel discount on any other line still
     demands a reason, exactly as today. With the flag off nothing is exempt and this is the
     original check. */
  const discPer = bodyData?.find(
    val =>
      Number(val?.DisPer) > 0 &&
      !(applyPharmacyDiscountRules && Number(val?.IsPharmacyRuleDiscount) === 1)
  );


  if(discPer){

    if(!paymentControlModeState?.discountReason){

      notify(t("Please Select Discount Type"),"warn");
      return;

    }
    else if(!paymentControlModeState?.DiscountReasons1){

      notify(t("Discount Resion Field is required"),"warn");
      return;

    }
    else if(!paymentControlModeState?.discountApproveBy){

      notify(t("Discount Approved By Field is required"),"warn");
      return;
    }

  }




  let validationFields = Object.keys(ErrorValidation());


  if(isWalkInShape &&
    validationFields?.length>0){

    notify(
      ErrorValidation()[validationFields[0]],
      "error"
    );

    return;
  }



  else if(values?.type?.value===1){


    if(values?.Doctor?.value==="0"){

      notify(
        t("Please Select A doctor."),
        "error"
      );

      return;
    }


    else if(!values?.Panel?.value){

      notify(
        t("Please Select A Panel."),
        "error"
      );

      return;
    }

  }




  const qtyerr = bodyData?.findIndex(
    val=>val?.Quantity==="" || val?.Quantity==="0"
  );


  if(qtyerr!==-1){

    notify(
      `Please enter the quantity for row number ${qtyerr+1}`,
      "error"
    );

    return;
  }


  const overStockItem = findOverStockRow(bodyData);


  if(overStockItem){

    notify(
      `Quantity cannot be more than the available stock for item: ${
        overStockItem?.ItemName || "Medicine"
      }`,
      "error"
    );

    return;
  }


  // A row taken from a draft may be issued short (that is a partial issue, and
  // draftMedicineData carries the receiveQty), but it may not be issued for MORE
  // than the draft holds — the draft would stay behind and the extra quantity
  // would never be reflected in it. Make the user update the draft first.
  const overDraftItem = bodyData?.find((val) => {
    const draftQty = Number(val?.DraftSavedQty);
    const quantity = Number(val?.Quantity);
    return (
      val?.draftID &&
      draftQty > 0 &&
      !isNaN(quantity) &&
      quantity > draftQty
    );
  });


  if(overDraftItem){

    notify(
      `${
        overDraftItem?.ItemName || "Medicine"
      }: quantity is more than the saved draft quantity (${Number(
        overDraftItem?.DraftSavedQty
      )}). Please save/update the draft first, then issue.`,
      "error"
    );

    return;
  }




  // Prescription Check

  if(
    !skipPrescriptionCheck &&
    bodyData?.some(
      item=>item?.IsPrescriptionRequired===1
    ) &&
    !values?.prescription
  ){


    setModalData({

      visible:true,

      width:"40vw",

      label:t("Some Medicine required Prescription"),

      footer:<></>,


      Component:(

      <>

      <h3
      style={{
        textAlign:"center",
        fontWeight:"400",
        fontSize:"18px"
      }}
      >

      {t("Do you want to Upload Prescription ?")}

      </h3>



      <div
      className="d-flex align-items-center w-100 justify-content-center"
      style={{gap:"10px"}}
      >


      <button
      className="btn btn-success"

      onClick={()=>{

        setModalData({
          visible:false
        });


        if(fileInputRef.current){
          fileInputRef.current.click();
        }

      }}

      >

      {t("Continue & Upload")}

      </button>



      <button
      className="btn btn-danger"

      onClick={()=>{

        setModalData({
          visible:false
        });


        handleSave(true,patientType);

      }}

      >

      {t("Skip & Save")}

      </button>


      </div>


      </>

      )

    });


    return;
  }





  setPassword("");


  // if(true){
  if(userData?.validateUserForBill){

    setPatientTypeState(patientType);
    setUserConfirmation(true);

  }
  else{

    ExecuteSaveAPI(patientType);

  }

};
  // const handleSave = (skipPrescriptionCheck = false) => {
  //   if (bodyData?.length === 0) {
  //     notify("Please Add Atleast One Item", "error");
  //     return;
  //   }
  //   if (!paymentMethod || paymentMethod.length === 0) {
  //     notify("Please select payment mode", "error");
  //     return;
  //   }

  //   const itemWithLowMRP = bodyData?.find((item) => {
  //     if (item?.MRP && item?.Rate) {
  //       return Number(item.MRP) < Number(item.Rate);
  //     }
  //     return false;
  //   });

  //   if (itemWithLowMRP) {
  //     notify(
  //       `MRP Price cannot be less than Unit Price for item: ${itemWithLowMRP?.ItemName || "Medicine"}`,
  //       "error",
  //     );
  //     return;
  //   }
  //   if (
  //     selectedPackage?.length > 0 &&
  //     paymentControlModeState?.netAmount > selectedPackage[0]?.PharmacyAmt
  //   ) {
  //     notify("Bill exceeds the allowed package amount", "warn");
  //     return;
  //   }
  //   const discPer = bodyData?.find((val) => Number(val?.DisPer) > 0);
  //   if (discPer) {
  //     if (!paymentControlModeState?.discountReason) {
  //       notify("Please Select Discount Type", "warn");
  //       return;
  //     } else if (!paymentControlModeState?.DiscountReasons1) {
  //       notify("Discount Resion Field is required", "warn");
  //       return;
  //     } else if (!paymentControlModeState?.discountApproveBy) {
  //       notify("Discount Approved By Field is required", "warn");
  //       return;
  //     }
  //   }
  //   // if (!paymentControlModeState?.DepositedBy) {
  //   //   notify("Please Fill Deposited by", "warn");
  //   //   return;
  //   // }

  //   let validationFields = Object.keys(ErrorValidation());
  //   if (values?.type?.value === 2 && validationFields?.length > 0) {
  //     notify(ErrorValidation()[validationFields[0]], "error");
  //     return 0;
  //   } else if (values?.type?.value === 1) {
  //     if (values?.Doctor?.value === "0") {
  //       notify(t("Please Select A doctor."), "error");
  //       return 0;
  //     } else if (!values?.Panel?.value) {
  //       notify(t("Please Select A Panel."), "error");
  //       return 0;
  //     }
  //   }
  //   const qtyerr = bodyData?.findIndex(
  //     (val) => val?.Quantity === "" || val?.Quantity === "0",
  //   );
  //   if (qtyerr !== -1) {
  //     notify(`Please enter the quantity for row number ${qtyerr + 1}`, "error");
  //     return 0;
  //   }

  //   // Prescription Validation Check
  //   if (
  //     !skipPrescriptionCheck &&
  //     bodyData?.length > 0 &&
  //     bodyData?.some((item) => item?.IsPrescriptionRequired === 1) &&
  //     !values?.prescription
  //   ) {
  //     setModalData({
  //       visible: true,
  //       width: "40vw",
  //       label: t("Some Medicine required Prescription"),
  //       footer: <></>,
  //       Component: (
  //         <>
  //           <h3
  //             style={{
  //               textAlign: "center",
  //               fontWeight: "400",
  //               fontSize: "18px",
  //             }}
  //           >
  //             {t("Do you want to Upload Prescription ?")}
  //           </h3>
  //           <div
  //             className="d-flex align-items-center w-100 justify-content-center"
  //             style={{ gap: "10px" }}
  //           >
  //             <button
  //               className="btn btn-success"
  //               onClick={() => {
  //                 setModalData({ visible: false });
  //                 if (fileInputRef.current) {
  //                   fileInputRef.current.click();
  //                 }
  //               }}
  //             >
  //               {t("Continue & Upload")}
  //             </button>
  //             <button
  //               className="btn btn-danger"
  //               onClick={() => {
  //                 setModalData({ visible: false });
  //                 handleSave(true);
  //               }}
  //             >
  //               {t("Skip & Save")}
  //             </button>
  //           </div>
  //         </>
  //       ),
  //     });
  //     return;
  //   }

  //   // If all validation checks pass, trigger User Password Confirmation
  //   setPassword("");
  //   if (userData?.validateUserForBill) {
  //     setUserConfirmation(true);
  //   } else {
  //     ExecuteSaveAPI();
  //   }
  // };
const ExecuteSaveAPI = async (patientType) => {

  /* Print ka tab YAHIN, sabse pehle - kisi bhi await se pehle.

     Ye line user ke click wale usi pal me chalti hai, jab browser ka "abhi click
     hua tha" wala jod taza hai. Niche save, hash aur PDF - teen API chalti hain;
     unke baad tab kholne ki koshish ki jaye to browser aksar rok deta hai, aur
     yahi wo "kabhi print aata hai kabhi nahi" wali baat thi.

     Tab ab khaali khul kar intezaar karta hai, aur PDF taiyaar hote hi usi ka
     pata badal diya jaata hai. Baat bigad jaye to niche ise band kar diya jaata
     hai, taaki khaali tab ka dher na lage. */
  const printTab = ReservePrintTab();

  const handleSaveAfterConfirmationModal = async (
    patientTypes,
    paymentMethod,
    btnType,
    referenceTransactionID = 0
  ) => {

    let payload = SavePharmecyAPIPayload(
      SearchPatient?.patientDetail,
      bodyData,
      values,
      BindResource,
      paymentControlModeState,
      paymentMethod,
      selectedPackage,
      undefined,
      patientTypes
    );

    if (payload?.pmh) payload.pmh.UniqueHash = uniqueHash || "";

    if (payload?.ltd) {

      payload.ltd = payload.ltd.map((item) => ({
        ...item,
        /* 1 is not an id: SaveOPDPharmacy reads it as "put this bill's own
           TransactionID on the line", and writes 0 for anything else. So the
           literal 1 is what every pharmacy save has always sent, and it is sent
           whatever IsIndentWiseMedicineOPDReturn is set to - that flag drives the
           indent work on the return screen, the item filter and the requisition's
           "Issued From" column, and has no say here. */
        ReferenceTransactionID: patientType === "IPD" ? 0 : 1,
      }));

    }



    const filterData =
      GetGlobalResources?.find(
        (item) => item.Name === "IsCommonReceiptData"
      );



    // The store this issue belongs to, carried with the call rather than by switching the
    // session. See effectiveStoreRole above.
    payload.RoleID = storeRoleRef.current;

    /* Yahin se asli call jaati hai, isliye yahin se taala lagta hai aur niche
       finally me khulta hai - chahe save chale ya na chale. */
    saveInFlightRef.current = true;

    let apiResp;
    try {
      apiResp = await SavePharmecyAPICall(payload);
    } catch (error) {
      // Bill hi nahi bana - rakha hua tab ab bekaar hai.
      CloseReservedTab(printTab);
      saveInFlightRef.current = false;
      dispatch(setLoading(false));
      notify(t("Could not save. Please try again."), "error");
      return;
    }

    /* Loader ko yahin se aakhir tak pakad kar rakha jaata hai.

       Har API call apna-apna loader chalati hai - SavePharmecyAPICall true karke
       lautne se pehle false kar deti hai, phir CommonReceiptPdf dobara true karti
       hai. Beech me loader gayab ho jaata tha aur screen khaali khadi dikhti thi,
       jabki kaam abhi baaki tha: PDF banna, naya tab khulna, screen saaf hona.
       User ko lagta kaam ho gaya aur wo dobara Save daba deta tha.

       Isliye save lautte hi loader wapas on, aur band sirf sabse aakhir me - jab
       PDF khul chuka ho aur screen saaf ho chuki ho. */
    dispatch(setLoading(true));

    if (apiResp?.success) {

      /* Bill ban chuka hai. Naya hash turant le liya jaata hai.

         Pehle yahan setUniqueHash("") tha aur naya hash PDF ke BAAD banta tha. Beech ke
         us hisse me hash khaali rehta tha - aur server ki rok khaali hash par chalti hi
         nahi (if (!string.IsNullOrWhiteSpace(UniqueHash))). Yaani us pal dobara Save
         dabta to rok bina roke nikal jaati aur SACH ME doosra bill ban jaata.

         AWAIT jaan-bujh kar hai. Loader poore app me ek hi boolean hai, aur HAR api
         call lautte waqt use false kar deti hai - bindHashCode bhi. Bina await ke ye
         call peeche-peeche chalti rehti thi aur PDF ke beech me loader band kar deti
         thi. Isliye pehle ise poora hone diya jaata hai, phir loader wapas on. */
      await generateUniqueHash();
      dispatch(setLoading(true));

      let reportResp;

      /* Print apne try me.

         Bill ban chuka hai - print nikla ya nahi, usse screen saaf hone ka koi rishta
         nahi hona chahiye. Pehle ye call bina try ke thi aur poore save ke raaste me ek
         bhi catch nahi tha: PDF ki ek hichki (network, timeout, service) poore aage ke
         code ko chhod jaati thi, screen bhari ki bhari reh jaati, success ka message bhi
         nahi aata. User ko lagta save hua hi nahi, wo dobara dabata, aur server ki
         duplicate wali rok bolti - "already been saved".

         Ab print na nikle to sirf print ka message aata hai; bill aur screen dono apna
         kaam poora karte hain. */
      try {

      if(filterData?.Value === "1"){

        reportResp = await CommonReceiptPdf({
 "ledgerTransactionNo": "0",
 isNewVersion : "0",
          isBill: String(apiResp?.data?.isBill || ""),

          TransactionID:
            apiResp?.data?.transactionId,

          receiptNo:"",

          duplicate:"0",

          type:"PHY",

          supplierID:"",

          billNo:
            apiResp?.data?.billNo || "",

          isEMGBilling:
            String(apiResp?.data?.isEMGBilling ? 1 : ""),

          isOnlinePrint:"",

          isRefound:0,

        });

      }

      else{


        reportResp = await CommonReceiptPdf({

          ledgerTransactionNo:
            apiResp?.data?.ledTxnID,

          isBill:
            String(apiResp?.data?.isBill || ""),

          TransactionID:
            apiResp?.data?.transactionId,

          receiptNo:"",

          duplicate:"0",

          type:"PHY",

          supplierID:"",

          billNo:
            apiResp?.data?.billNo || "",

          isEMGBilling:
            String(apiResp?.data?.isEMGBilling ? 1 : ""),

          isOnlinePrint:"",

          isRefound:0,

        });

      }




      } catch (error) {
        reportResp = null;
      }

      /* CommonReceiptPdf bhi lautne se pehle loader band kar deti hai, isliye
         yahan dobara on - PDF ka tab khulne tak chalu rehna chahiye. */
      dispatch(setLoading(true));

      setPackageData([]);

      setSelectedPackage([]);

      setHandleModelData(false);



      if(reportResp?.success){

        RedirectURLInTab(
          printTab,
          reportResp?.data?.pdfUrl
        );

      }
      else{

        CloseReservedTab(printTab);

        /* Bill ban gaya, bas print nahi nikla. Ye saaf bata dena zaroori hai - warna
           user print ka intezaar karta reh jaata hai ya dobara save kar baithta hai.
           Reprint se ye bill dobara nikala ja sakta hai. */
        notify(
          t("Bill saved, but the print could not be generated. Please use Reprint."),
          "warn",
        );

      }



      notify(
        apiResp?.message,
        "success"
      );


      // reset

      setBodyData([]);

      /* The bill-wide discount boxes go with the rows they applied to.

         They are not a setting that carries over - they are a percentage or a rupee total
         for the bill that was just saved, spread across its lines. Left standing they
         would read as if the next patient already had a discount, and the first medicine
         added would be silently discounted by a number nobody typed for them. */
      setBulkDiscount({ DisPer: "", discountAmount: "" });

      setValues(initialValue);

      setPaymentControlModeState(
        PAYMENT_OBJECT
      );

      setPaymentMethod([]);

      setPackageData([]);



      setSearchPatient((val)=>({

        ...val,

        patientDetail:{},

        value:"",

      }));



      setBindDetails({

        label:t("Search Medicine"),

        value:"",

        className:"required-fields",

      });



    }

    else{

      // Bill nahi bana - rakha hua tab band.
      CloseReservedTab(printTab);

      notify(
        apiResp?.message,
        "error"
      );


    }

    // Save poora hua - chala ho ya na chala. Ab loader band aur agla click chalu.
    dispatch(setLoading(false));
    saveInFlightRef.current = false;


  };





  await handleSaveAfterConfirmationModal(

    patientType ||
    SearchPatient?.patientDetail?.PatientType ||
    "OPD",

    paymentMethod,

    true

  );

};
  // const ExecuteSaveAPI = async () => {
  //   const handleSaveAfterConfirmationModal = async (
  //     patientTypes,
  //     paymentMethod,
  //     btnType,
  //     referenceTransactionID = 0,
  //   ) => {
  //     /* const isCredit = paymentMethod[0]?.PaymentModeID === 4;
  //     const isOPD =
  //       patientTypes === "OPD" &&
  //       values?.type?.value === 1 &&
  //       btnType === "btnTypeOPD";

  //     // ✅ 1. Credit + OPD → Open Modal
  //     if (isCredit && isOPD) {
  //       setHandleModelData(false);
  //       handleModel(
  //         t(""),
  //         "50vw",
  //         "bank",
  //         true,
  //         <AsACreditConfirmation
  //           setHandleModelData={setHandleModelData}
  //           data={SearchPatient?.patientDetail}
  //         />,
  //       );
  //       return;
  //     } */
  //    debugger
  //     let payload = SavePharmecyAPIPayload(
  //       SearchPatient?.patientDetail,
  //       bodyData,
  //       values,
  //       BindResource,
  //       paymentControlModeState,
  //       paymentMethod,
  //       selectedPackage,
  //       undefined,
  //       patientTypes,
  //     );

  //     if (payload?.ltd) {
  //       payload.ltd = payload.ltd.map((item) => ({
  //         ...item,
  //         ReferenceTransactionID: referenceTransactionID,
  //       }));
  //     }
  //       const filterData =
  //   GetGlobalResources?.find(
  //     (item) => item.Name === "IsCommonReceiptData"
  //   );

  //     debugger;
  //     let apiResp = await SavePharmecyAPICall(payload);

  //     if (apiResp?.success) {
  //       let reportResp ;
  //       debugger
  //       if(filterData?.Value === "1"){

  //       reportResp = await CommonReceiptPdf({
  //       // reportResp = await CommonReceiptData({
  //         // ledgerTransactionNo: apiResp?.data?.ledTxnID,
  //         isBill: String(apiResp?.data?.isBill || ""),
  //         TransactionID: apiResp?.data?.transactionId,
  //         receiptNo: "",
  //         duplicate: "0",
  //         type: "PHY",
  //         supplierID: "",
  //         billNo: apiResp?.data?.billNo || "",
  //         isEMGBilling: String(apiResp?.data?.isEMGBilling ? 1 : ""),
  //         isOnlinePrint: "",
  //         isRefound: 0,
  //       });
  //       }
  //      else{
  //        reportResp = await  CommonReceiptPdf({
  //         ledgerTransactionNo: apiResp?.data?.ledTxnID,
  //         isBill: String(apiResp?.data?.isBill || ""),
  //         TransactionID: apiResp?.data?.transactionId,
  //         receiptNo: "",
  //         duplicate: "0",
  //         type: "PHY",
  //         supplierID: "",
  //         billNo: apiResp?.data?.billNo || "",
  //         isEMGBilling: String(apiResp?.data?.isEMGBilling ? 1 : ""),
  //         isOnlinePrint: "",
  //         isRefound: 0,
  //       });
  //      }

  //       setPackageData([]);
  //       setSelectedPackage([]);
  //       setHandleModelData(false);

  //       if (reportResp?.success) {
  //         RedirectURL(reportResp?.data?.pdfUrl);
  //       }

  //       notify(apiResp?.message, "success");

  //       // reset
  //       setBodyData([]);
  //       setValues(initialValue);
  //       setPaymentControlModeState(PAYMENT_OBJECT);
  //       setPaymentMethod([]);
  //       setPackageData([]);

  //       setSearchPatient((val) => ({
  //         ...val,
  //         patientDetail: {},
  //         value: "",
  //       }));

  //       setBindDetails({
  //         label: t("Search Medicine"),
  //         value: "",
  //         className: "required-fields",
  //       });
  //     } else {
  //       notify(apiResp?.message, "error");
  //     }
  //   };

  //   const ipdNo = SearchPatient?.patientDetail?.IPDNo || data?.ipdno;
  //   const isCredit = paymentMethod?.length > 0 && paymentMethod[0]?.PaymentModeID === 4;
  //   const isCash = paymentMethod?.length > 0 && paymentMethod[0]?.PaymentModeID === 1;

  //   let showModal = false;

  //   if (ipdNo && isCredit || ipdNo && isCash) {
  //     try {
  //       const setting = GetGlobalResources?.find(item => item.Name === "IsBillSattlmentIPDOPD");
  //       if (setting?.Value == 1) {
  //         showModal = true;
  //       }else{
  //         showModal = false;
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }

  //   if (showModal) {
  //     handleModel(
  //       t("Confirmation"),
  //       "30vw",
  //       "confirmation",
  //       true,
  //       <div className="d-flex justify-content-center py-2 ">

  //         <button
  //           className="btn mx-3"
  //           style={{ color: "white", borderRadius: "8px", minWidth: "100px", padding: "6px 10px", fontWeight: "500", border: "none" }}
  //           onClick={() => {
  //             setHandleModelData(false);
  //             handleSaveAfterConfirmationModal("IPD", paymentMethod, true, 0);
  //           }}
  //         >
  //           {t("Save in Hospital")}
  //         </button><button
  //           className="btn mx-3"
  //           style={{ color: "white", borderRadius: "8px", minWidth: "100px", padding: "6px 10px", fontWeight: "500", border: "none" }}
  //           onClick={() => {
  //             setHandleModelData(false);
  //             handleSaveAfterConfirmationModal("OPD", paymentMethod, true, 1);
  //           }}
  //         >
  //           {t("Save in Pharmacy")}
  //         </button>
  //       </div>
  //     );
  //   } else {
  //     await handleSaveAfterConfirmationModal(
  //       SearchPatient?.patientDetail?.PatientType || "OPD",
  //       paymentMethod, // ✅
  //       true, // ✅ btnType
  //     );
  //   }
  //   // IPD/EMG check - handleSaveAfterConfirmationModal ke BAAD
  //   /* if (
  //     (SearchPatient?.patientDetail?.PatientType === "IPD" ||
  //       SearchPatient?.patientDetail?.PatientType === "EMG") &&
  //     SearchPatient?.patientDetail?.STATUS === "IN" &&
  //     paymentMethod[0].PaymentModeID === 4
  //   ) {
  //     handleModel(
  //       t(""),
  //       "50vw",
  //       "confirmation",
  //       true,
  //       <BillConfirmationModal
  //         handleChangeModel={handleChangeModel}
  //         setHandleModelData={setHandleModelData}
  //         data={SearchPatient?.patientDetail}
  //         handleSaveAfterConfirmationModal={handleSaveAfterConfirmationModal}
  //         paymentMethod={paymentMethod}
  //       />,
  //     );
  //   } */
  // };

  // const cellCss = (row, value) => {
  //   if (row?.EXPIRYCOLO === "RED") return "red";
  //   if (row?.EXPIRYCOLO === "NORMAL") return "blue";
  //   return row?.DrugCaregoryColor;
  // };
  /* Low stock first, then expiry. ExpiryColor 0 = expired; 1/2/3 = expiring within
     1/3/6 months, matching the legend above the item table. */
  const cellCss = (row) => {
    if (isLowStock(row, lowStockThreshold)) return LOW_STOCK_COLOUR;
    switch (Number(row?.ExpiryColor)) {
      case 0:
        return "red";
      case 1:
        return "#ff000040";
      case 2:
        return "#ff000026";
      case 3:
        return "#ffff0040";
      case 4:
        return "";
      default:
        return row?.DrugCaregoryColor || "";
    }
  };

  const cellCssClass = (row) => {
    if (isStockNearExpiry(row, nearExpiryMonths)) return "near-expiry-blink";
    return "";
  };
  const handleImageChange = (e) => {
    const file = e?.target?.files[0];

    if (file) {
      // Check if file size exceeds 5MB (5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        notify(t("File size exceeds 5MB. Please choose a smaller file."), "error");
        return;
      }
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader?.result.split(",")[1];
        const fileExtension = file?.name.split(".").pop();
        setValues((val) => ({ ...val, [e?.target?.name]: base64String }));
      };
      reader.readAsDataURL(file); // Convert file to base64
    }
  };
  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };
  const handleChangeModel = (data) => {
    setModalData(data);
  };
  const handleModel = (
    label,
    width,
    type,
    isOpen,
    Component,
    handleInsertAPI,
    extrabutton,
  ) => {
    setHandleModelData({
      label: label,
      width: width,
      type: type,
      isOpen: isOpen,
      Component: Component,
      handleInsertAPI: handleInsertAPI,
      extrabutton: extrabutton ? extrabutton : <></>,
    });
  };


  
  return (
    <>
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
          IsCancelFlag={true}
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
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading
            isBreadcrumb={data?.ipdno ? false : true}
            title={data?.FileName}
          />
          {/* Which store this screen issues from. Shown only where there is more than
              one to choose between - a counter with a single store has no decision to
              make and should not be given one. */}
          {showStoreSwitch && pharmacyStores?.length > 1 && (
            <div className="row pt-2 px-2">
              <ReactSelect
                placeholderName={t("Store")}
                id="pharmacyStore"
                inputId="pharmacyStore"
                name="pharmacyStore"
                value={currentStore}
                dynamicOptions={pharmacyStores}
                searchable={true}
                removeIsClearable={true}
                isDisabled={storeSwitching}
                handleChange={handleStoreChange}
                respclass={"col-xl-3 col-md-4 col-sm-6 col-12"}
              />
            </div>
          )}
          {!Object?.keys(SearchPatient?.patientDetail)?.length && (
            <div className="row pt-2 px-2">
              <ReactSelect
                placeholderName={t("TYPE")}
                id="type"
                inputId="type"
                name="type"
                value={values?.type?.value}
                dynamicOptions={TYPE_OPTIONS}
                searchable={true}
                removeIsClearable={true}
                handleChange={(name, e) => {
                  handleReactSelect(name, e);
                }}
                respclass={"col-xl-1 col-md-2 col-sm-4 col-12"}
              />

              {/* Walk in Patient start */}
              {isWalkInShape && (
                <>
                  <div className="col-xl-2 col-md-4 col-sm-4 col-12 d-flex">
                    <ReactSelect
                      ref={titleRef}
                      placeholderName={t("Title")}
                      id="title"
                      name="title"
                      removeIsClearable={true}
                      value={values?.title?.value}
                      handleChange={(name, value) => {
                        setValues((val) => ({
                          ...val,
                          [name]: value,
                          Gender:
                            value?.extraColomn !== "UnKnown"
                              ? { value: value?.extraColomn }
                              : "",
                        }));
                      }}
                      dynamicOptions={filterByTypes(
                        CentreWiseCache,
                        [1],
                        ["TypeID"],
                        "TextField",
                        "ValueField",
                        "Department",
                      )}
                      searchable={true}
                      respclass="w-45"
                    />

                    <Input
                      type="text"
                      className="form-control required-fields"
                      inputRef={nameRef}
                      id="Name"
                      name="Name"
                      value={values?.Name ? values?.Name : ""}
                      onChange={handleChange}
                      lable={t("Name")}
                      placeholder=" "
                      respclass="w-75 ml-1"
                    />
                  </div>

                  <div className="col-xl-2 col-md-4 col-sm-4 col-12 d-flex">
                    <Input
                      type="text"
                      className="form-control"
                      id="Age"
                      name="Age"
                      value={values?.Age ? values?.Age : ""}
                      onChange={(e) => {
                        inputBoxValidation(AMOUNT_REGX(3), e, handleChange);
                      }}
                      lable={t("Age")}
                      placeholder=" "
                      respclass="w-45"
                    />

                    <ReactSelect
                      placeholderName={t("Age Type")}
                      id="AgeType"
                      name="AgeType"
                      value={values?.AgeType?.value}
                      removeIsClearable={true}
                      handleChange={handleReactSelect}
                      dynamicOptions={translateOptions(AGE_TYPE, t)}
                      searchable={true}
                      respclass="w-75 ml-1"
                    />
                  </div>

                  {/* Gender.

                      Ye comment me pada tha, isliye walk-in me Gender kabhi liya
                      hi nahi jaata tha - DB me jo "Male" dikhta hai wo initialValue
                      ka default hai, user ka chunav nahi.

                      Sirf Register & Issue par khola gaya hai, kyunki wahi ek
                      jagah hai jahan ye patient_master me jaata hai. Walk-In par
                      ise wapas laana ek alag faisla hai - wahan screen aaj jaisi
                      hi rehne di gayi. */}
                  {isRegisterMode && (
                    <ReactSelect
                      placeholderName={t("Gender")}
                      id="Gender"
                      name="Gender"
                      value={values?.Gender?.value}
                      requiredClassName={"required-fields"}
                      removeIsClearable={true}
                      handleChange={(name, e) => handleReactSelect(name, e)}
                      dynamicOptions={filterByTypes(
                        CentreWiseCache,
                        [22],
                        ["TypeID"],
                        "TextField",
                        "ValueField",
                      )}
                      searchable={true}
                      respclass="col-xl-1 col-md-2 col-sm-4 col-12"
                    />
                  )}
                  <Input
                    type="text"
                    className="form-control"
                    id="Address"
                    name="Address"
                    value={values?.Address ? values?.Address : ""}
                    onChange={handleChange}
                    lable={t("Address")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-2 col-sm-4 col-12"
                  />
                  <Input
                    type="text"
                    /* Register & Issue par Mobile zaroori hai, isliye wahan laal
                       kinara dikhta hai. Walk-In par jaisa tha waisa hi. */
                    className={
                      isRegisterMode
                        ? "form-control required-fields"
                        : "form-control"
                    }
                    id="ContactNo"
                    name="ContactNo"
                    value={values?.ContactNo ? values?.ContactNo : ""}
                    onChange={(e) => {
                      inputBoxValidation(
                        MOBILE_NUMBER_VALIDATION_REGX,
                        e,
                        handleChange,
                      );
                    }}
                    lable={t("ContactNo")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-2 col-sm-4 col-12"
                  />

                  <div className="col-xl-2 col-md-6 col-sm-4 col-12">
                    <div className="d-flex">
                      <Input
                        type="text"
                        className="form-control"
                        id="Doctor"
                        name="Doctor"
                        value={values?.Doctor ? values?.Doctor : ""}
                        onChange={handleChange}
                        lable={t("Doctor")}
                        placeholder=" "
                        respclass="w-100 pr-2"
                      />
                      {/* <ReactSelect
                        placeholderName={t("Doctor")}
                        id="Doctor"
                        name="Doctor"
                        value={values?.Doctor?.value}
                        requiredClassName={"required-fields"}
                        handleChange={(name, e) => handleReactSelect(name, e)}
                        dynamicOptions={handleReactSelectDropDownOptions(
                          GetBindReferDoctorList,
                          "NAME",
                          "DoctorID"
                        )}
                        searchable={true}
                        respclass="w-100 pr-2"
                      /> */}
                    </div>
                  </div>
                </>
              )}
              {values?.type?.value === 1 && (
                <div className="col-xl-5 col-md-5 col-sm-8 col-12 ">
                  <SearchItemEassyUI
                    onClick={handleCloseSearchPatient}
                    BindListAPI={getPatientDetail}
                    BindDetails={SearchPatient}
                    Head={BIND_TABLE_OLDPATIENTSEARCH_PHARMECY}
                    customInputRef={searchPatientRef}
                    isSelectFirst={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* Registered Patient */}
          {values?.type?.value === 1 &&
            Object.keys(SearchPatient?.patientDetail)?.length > 0 && (
              <>
                <div className="row p-2">
                  <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                    <div className="row">
                      {!data?.ipdno && (
                        <div className="col-1">
                          <i
                            className="fa fa-search "
                            aria-hidden="true"
                            onClick={handlePatientSearchPage}
                            style={{
                              border: "1px solid #447dd5",
                              padding: "5px 3px",
                              borderRadius: "3px",
                              backgroundColor: "#447dd5",
                              color: "white",
                            }}
                          ></i>
                        </div>
                      )}
                      <div className={`${data?.ipdno ? "col-12" : "col-11"}`}>
                        <LabeledInput
                          label={t("PatientName")}
                          value={SearchPatient?.patientDetail?.PName}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12 ">
                    <LabeledInput
                      // className="viewIssue"
                      label={t("UHID")}
                      value={SearchPatient?.patientDetail?.PatientID}
                    />
                  </div>

                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <LabeledInput
                      label={t("Age / Gender")}
                      value={SearchPatient?.patientDetail?.AgeGender}
                    />
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <LabeledInput
                      label={t("IPD No.")}
                      value={SearchPatient?.patientDetail?.IPDNo}
                    />
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <LabeledInput
                      label={t("Address")}
                      value={`${SearchPatient?.patientDetail?.Address}`}
                    />
                  </div>
                  {/* <div className="col-xl-3 col-md-4 col-sm-4 col-12 pb-2 d-flex">
                    <div className="w-xl-25  w-md-100 w-100">
                      <LabeledInput
                        label={t("Age / Gender")}
                        value={SearchPatient?.patientDetail?.AgeGender}
                      />
                    </div>
                    <div className="w-xl-25  w-md-100 w-100 ml-3">
                      <LabeledInput
                        label={t("IPD No.")}
                        value={SearchPatient?.patientDetail?.IPDNo}
                      />
                    </div>
                    <div className="w-xl-50  w-md-100 w-100 ml-3">
                      <LabeledInput
                        label={t("Address")}
                        value={`${SearchPatient?.patientDetail?.Address}`}
                      />
                    </div>
                  </div> */}

                  <div className="col-xl-2 col-md-2 col-sm-4 col-12">
                    <LabeledInput
                      label={t("ContactNo")}
                      value={SearchPatient?.patientDetail?.ContactNo}
                    />
                  </div>
                 
                  <div className="col-xl-2 col-md-2 col-sm-4 col-12">
                    <LabeledInput
                      label={t("Height")}
                      value={
                        SearchPatient?.patientDetail?.Vital?.length > 0 &&
                        SearchPatient?.patientDetail?.Vital?.split("#")[0]
                      }
                    />
                  </div>
                  <div className="col-xl-2 col-md-2 col-sm-4 col-12">
                    <LabeledInput
                      label={t("Weight")}
                      value={
                        SearchPatient?.patientDetail?.Vital?.length > 0 &&
                        SearchPatient?.patientDetail?.Vital?.split("#")[1]
                      }
                    />
                  </div>

                  <ReactSelect
                    placeholderName={t("Doctor")}
                    id="Doctor"
                    name="Doctor"
                    value={values?.Doctor?.value}
                    requiredClassName={"required-fields"}
                    handleChange={(name, e) => handleReactSelect(name, e)}
                    dynamicOptions={handleReactSelectDropDownOptions(
                      mainDoctorList,
                      "Name",
                      "DoctorID",
                    )}
                    searchable={true}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  />

                  {/* Panel + "Add/Remove Panels List" button - dono ek hi column me */}
                  <div className="d-flex col-xl-2 col-md-4 col-sm-4 col-12">
                    <ReactSelect
                      placeholderName={t("Panel")}
                      id="Panel"
                      name="Panel"
                      value={values?.Panel?.value}
                      handleChange={(name, e) => handleReactSelect(name, e)}
                      dynamicOptions={panelList}
                      searchable={true}
                      requiredClassName={"required-fields"}
                      respclass="col-xl-10 col-md-10 col-sm-10 pl-0"
                    />
                    <div className="col-1">
                      <Tooltip
                        target="#addRemovePanelsList"
                        position="top"
                        content={t("Add/Remove Panels List")}
                      />
                      <button
                        id="addRemovePanelsList"
                        className="btn btn-sm btn-primary"
                        type="button"
                        disabled={!SearchPatient?.patientDetail?.PatientID}
                        onClick={() => setPanelListPopup(true)}
                      >
                        <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
                      </button>
                    </div>
                  </div>
                  <ReactSelect
                    placeholderName={t("Dis.Med.")}
                    id="DisMed"
                    name="DisMed"
                    value={values?.DisMed?.value}
                    handleChange={(name, e) => handleReactSelect(name, e)}
                    dynamicOptions={DISMED}
                    removeIsClearable={true}
                    searchable={true}
                    requiredClassName={"required-fields"}
                    respclass="col-xl-1 col-md-2 col-sm-4 col-12"
                  />
                  <MembershipCardBanner cardInfo={membershipCardInfo} />
                  {/* KMSI patient buttons - one auto-width group so they stay together,
                      in this order, right after the fields (they used to wrap one by one). */}
                  <div className="col-xl-3 col-md-6 col-12 rx-patient-actions">
                    <PatientMedicationCalendarButton
                      patient={SearchPatient?.patientDetail}
                      respclass="rx-patient-actions__item"
                    />
                    <PharmacyDiseaseAlert
                      patient={SearchPatient?.patientDetail}
                      medicines={bodyData}
                      respclass="rx-patient-actions__item"
                    />
                    <PatientNotesButton
                      patient={SearchPatient?.patientDetail}
                      respclass="rx-patient-actions__item"
                    />
                  </div>
                </div>
              </>
            )}
        </div>
      </div>
      {packageData?.length > 0 && (
        <div className="card mt-2">
          <Heading title={t("Package Details")} />
          <Tables
            thead={thead}
            tbody={packageData?.map((item, index) => ({
              select: (
                <Checkbox
                  className="mt-2"
                  disabled={bodyData?.length > 0 ? true : false}
                  checked={
                    selectedPackage?.[0]?.LedgerTransactionNo ===
                    item?.LedgerTransactionNo
                  }
                  // checked={packageData?.find((item)=> item?.BillNo === selectedPackage?.[0]?.BillNo) ? true : false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    if (isChecked) {
                      setIsChecked(true);
                      setSelectedPackage([item]);
                      setValues((val) => ({
                        ...val,
                        Doctor: { value: item?.doctorID },
                      }));
                    } else {
                      setIsChecked(false);
                      setSelectedPackage([]);
                      setValues((val) => ({
                        ...val,
                        Doctor: { value: "" },
                      }));
                    }
                  }}
                />
              ),
              Date: item?.BillDATE,
              BillNo: item?.BillNo,
              ReceiptNo: item?.ReceiptNo,
              pType: item?.TYPE,
              ipd: item?.IpdNo ? item?.IpdNo : "-",
              PName: item?.PName,
              PackageName: item?.PackageName,
              AmountPaid: item?.AmountPaid,
              NetAmount: item?.NetAmount,
              PharmacyAmt: item?.PharmacyAmt ? item?.PharmacyAmt : "0",
              UtilizePharmacyAmt: item?.UtilizePharmacyAmt
                ? item?.UtilizePharmacyAmt
                : "0",
            }))}
          />
        </div>
      )}
      {
        isExpiryColour &&

        <Heading
          title={
            <>
              {t("Medicine Details")}

            </>
          }
          secondTitle={
            <>
              <style>{`
                  @media (max-width: 767.98px) {
                    .ipd-status-toggle-btn { display: inline-flex !important; }
                    .ipd-status-list.is-collapsed { display: none !important; }
                  }
                  @media (min-width: 768px) {
                    .ipd-status-toggle-btn { display: none !important; }
                    .ipd-status-list { display: contents !important; }
                  }
                `}</style>
                
                <div
                  // className={`ipd-status-list ${statusCollapsed ? "is-collapsed" : ""}`}
                  style={{ display: "contents" }}
                >
                  <ColorCodingSearch
                    color={"red"}
                    label={t("Expired")}
                  />
                  <ColorCodingSearch
                    color={"#ff000040"}
                    label={t(
                      "Expiring within 1 months",)}
                    // onClick={() => filteredTableData("mlc")}
                  />
                  <ColorCodingSearch
                    color={"#ff000026"}
                    label={t(
                      "Expiring within 3 months",)}
                    // onClick={() => filteredTableData("mlc")}
                  />
                  <ColorCodingSearch
                    color={"#ffff0040"}
                    label={t(
                      "Expiring within 6 months",)}
                    // onClick={() => filteredTableData("mlc")}
                  />
                  <ColorCodingSearch
                    color={"#fde68a"}
                    label={t("Low Stock") + ` (≤ ${lowStockThreshold})`}
                  />
                  <ColorCodingSearch
                    color={"#fed7aa"}
                    label={t("Near Expiry Blink") + ` (≤ ${nearExpiryMonths} months)`}
                  />
                </div>
              </>
            }
          />
}
      {/* {values?.type?.value === 1 && values?.patientBarcode?.PatientID && ( */}
      <div className="patient_registration card mt-2">
        <div className="row p-2 ">
          {saleOnList?.length > 1 && (
            <ReactSelect
              placeholderName={t("Sale On")}
              id="SellOn"
              name="SellOn"
              value={values?.SellOn?.value}
              removeIsClearable={true}
              handleChange={(name, e) => handleReactSelect(name, e)}
              dynamicOptions={saleOnList}
              searchable={true}
              respclass="col-xl-1 col-md-2 col-sm-4  col-12"
            />
          )}
          <ReactSelect
            placeholderName={t("Search By")}
            id="SearchBy"
            name="SearchBy"
            value={values?.SearchBy?.value}
            handleChange={(name, e) => {
              handleReactSelect(name, e);
            }}
            isDisabled={
              values?.type?.value === 1 && !values?.patientBarcode?.PatientID
            }
            dynamicOptions={SearchByOption}
            removeIsClearable={true}
            searchable={true}
            respclass="col-xl-1 col-md-2 col-sm-4 col-12"
          />

          <div className="col-xl-6 col-md-6 col-sm-4 col-12">
           
            <SearchItemEassyUI
              onClick={hanldeCloseSearchMed}
              isDisabled={
                values?.type?.value === 1 && !values?.patientBarcode?.PatientID
              }
              BindListAPI={BindListAPI}
              BindDetails={BindDetails}
              Head={BIND_TABLE_BY_MED_FIRST_NAME_PHARMECY}
              customInputRef={MedicineRef}
              cellCss={(row) => {
                if (Number(row?.NoStock) === 1) return "#fecaca";
                if (isStockExpired(row)) return EXPIRED_STOCK_COLOUR;
                if (isLowStock(row, lowStockThreshold)) return LOW_STOCK_COLOUR;
                return isExpiryColour ? cellCss(row) : undefined;
              }}
              cellCssClass={cellCssClass}
              selectedPackage={selectedPackage}
              isCashPanel={isCashPanel}
            />
          </div>
          <Input
            type="text"
            inputRef={quantityRef}
            className="form-control required-fields"
            id="Quantity"
            name="Quantity"
            value={values?.Quantity !== undefined && values?.Quantity !== null ? values?.Quantity : ""}
            min={1}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                handleChange(e);
              }
            }}
            onKeyDown={onEnterAddItem}
            lable={t("Quantity")}
            placeholder=" "
            respclass="col-xl-1 col-md-2 col-sm-4  col-12"
            disabled={
              values?.type?.value === 1 && !values?.patientBarcode?.PatientID
            }
          />
          <div className="col-xl-2 col-md-2 col-sm-4 col-4 d-flex justify-content-around">
            <button
              className="btn  btn-success px-4"
              type="button"
              onClick={AddItem}
            >
              {t("Add")}
            </button>
            {/* </div> */}
            {/* <div className="col-xl-1 col-md-2 col-sm-4  col-4"> */}
            {!hideDraftButton && (
            <button
              className="btn  btn-success px-3 ml-2"
              type="button"
              onClick={() => {
                handleOpenIndent({
                  label: t("Drafts"),
                  width: "90vw",
                  type: "draft",
                  buttonName: "Add",
                  CallAPI: handleAddIndentItem,
                });
              }}
            >
              {t("Drafts")}
            </button>
            )}
            {repeatBillsEnabled &&
              SearchPatient?.patientDetail?.PatientID &&
              !/^CASH/i.test(String(SearchPatient?.patientDetail?.PatientID)) && (
                <button
                  className="btn btn-sm btn-success ml-2"
                  type="button"
                  title={t("Re-add medicines from this patient's earlier pharmacy bills")}
                  onClick={() => setPreviousBillsOpen(true)}
                >
                  <i className="fa fa-history mr-1" aria-hidden="true"></i>
                  {t("Previous Bills")}
                </button>
              )}
            {/* </div> */}

            {/* <div className="col-xl-2 col-md-2 col-sm-4 col-4"> */}

            {(SearchPatient?.patientDetail?.PatientType === "OPD" ||
              Object?.keys(SearchPatient?.patientDetail)?.length === 0) && (
              <button
                className="btn btn-sm btn-success ml-2"
                type="button"
                onClick={() => {
                  handleOpenIndent({
                    label: t("Pending Prescription"),
                    width: "90vw",
                    type: "prescription",
                    buttonName: "Add",
                    CallAPI: handleAddIndentItem,
                  });
                }}
              >
                <span className="mr-0">{t("Prescription")}</span>
              </button>
            )}
            {!separateIPDIssue &&
              indentButtonAllowed &&
              (SearchPatient?.patientDetail?.PatientType === "IPD" ||
              Object?.keys(SearchPatient?.patientDetail)?.length === 0) && (
                <button
                  className="btn btn-sm btn-success ml-2"
                  type="button"
                  onClick={() => {
                    handleOpenIndent({
                      label: t("Pending Indent`s"),
                      width: "90vw",
                      type: "indent",
                      buttonName: "Add",
                      CallAPI: handleAddIndentItem,
                      saleOnList: saleOnList,
                    });
                  }}
                >
                  <span className="mr-0">{t("Indents")}</span>
                </button>
              )}
            <div className="col-xl-5 col-md-5 col-sm-8 col-12 ">
              <button className="btn btn-sm btn-success " onClick={() => setStockModalVisible(true)}>
                {t("Show Stock")}
              </button>
            </div>
          </div>


          {/* {values?.type?.value === 1 && (
            <div className="col-xl-1 col-md-2 col-sm-4 col-4">
              {SearchPatient?.patientDetail?.PatientType === "OPD" ? (
                <button
                  className="btn btn-sm btn-success "
                  type="button"
                  onClick={() => {
                    handleOpenIndent({
                      label: t("Pending Prescription"),
                      width: "90vw",
                      type: "prescription",
                      buttonName: "Add",
                      CallAPI: handleAddIndentItem,
                    });
                  }}
                >
                  <span className="mr-0">{t("Prescription")}</span>
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-success "
                  type="button"
                  onClick={() => {
                    handleOpenIndent({
                      label: t("Pending Indent`s"),
                      width: "90vw",
                      type: "indent",
                      buttonName: "Add",
                      CallAPI: handleAddIndentItem,
                    });
                  }}
                >
                  <span className="mr-0">{t("Pending Indents")}</span>
                </button>
              )}
            </div>
          )} */}
        </div>
      </div>
      {/* )} */}
      <PatientIssueTable
        handleCustomInput={handleCustomInput}
        deleteRowData={deleteRowData}
        tbody={bodyData}
        handleOpenClinicalTrial={handleOpenClinicalTrial}
        ischecked={ischecked}
        bulkDiscount={bulkDiscount}
        handleBulkDiscount={handleBulkDiscount}
        disableDiscount={true}
        lowStockThreshold={lowStockThreshold}
        nearExpiryMonths={nearExpiryMonths}
      />
      {substituteModal.open && (
        <Modal
          visible={substituteModal.open}
          setVisible={() => setSubstituteModal({ open: false, item: null, rows: [], loading: false })}
          modalWidth={"60vw"}
          Header={`${t("Substitute for")} ${substituteModal.item?.ItemName || ""}`}
          footer={<></>}
        >
          <div className="p-2">
            <div className="text-danger mb-2">
              {t("No stock of this medicine in this store. Select a substitute (same generic) below.")}
            </div>
            {substituteModal.loading ? (
              <div className="text-center p-3">{t("Loading")}...</div>
            ) : substituteModal.rows.length === 0 ? (
              <div className="text-center p-3">{t("No substitute with stock found")}</div>
            ) : (
              <table className="table table-bordered table-sm mb-0">
                <thead>
                  <tr>
                    <th>{t("Item Name")}</th>
                    <th>{t("Batch No")}</th>
                    <th>{t("Avl. Qty.")}</th>
                    <th>{t("Expiry")}</th>
                    <th>{t("MRP")}</th>
                    <th>{t("Generic")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {substituteModal.rows.map((r, i) => (
                    <tr
                      key={`${r?.ItemID}-${i}`}
                      style={{ cursor: isStockExpired(r) ? "not-allowed" : "pointer", backgroundColor: isStockExpired(r) ? EXPIRED_STOCK_COLOUR : undefined }}
                      onClick={() => {
                        setSubstituteModal({ open: false, item: null, rows: [], loading: false });
                        hanldeCloseSearchMed(r);
                      }}
                    >
                      <td>{r?.ItemName}</td>
                      <td>{r?.BatchNumber}</td>
                      <td><b>{r?.AvlQty}</b></td>
                      <td>{r?.Expiry}</td>
                      <td>{r?.MRP}</td>
                      <td>{r?.Generic}</td>
                      <td><button type="button" className="btn btn-sm btn-success">{t("Select")}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {(medicalInfos?.diagnosisList?.length > 0 ||
        medicalInfos?.allergyList?.length > 0) && (
        <Modal
          visible={medicalInfos}
          setVisible={setmedicalInfo}
          modalWidth={"60vw"}
          Header={t("Medical Information")}
          footer={<></>}
        >
          <MedicalInfoModal medicalData={medicalInfos} />
        </Modal>
      )}

      {/* Add/Remove Panels List - OPD Booking wala hi popup (PatientRegistration
          ka panelDetail mode). bindDetail sirf panel refresh ke liye chahiye;
          yahan demographic details nahi badalti, isliye bindDetailAPI no-op hai. */}
      {panelListPopup && (
        <OverLay
          visible={panelListPopup}
          setVisible={setPanelListPopup}
          Header={t("Add/Remove Panels List")}
        >
          <PatientRegistration
            PatientID={SearchPatient?.patientDetail?.PatientID}
            type={"panelDetail"}
            setVisible={setPanelListPopup}
            bindDetail={true}
            bindDetailAPI={() => {}}
            updateButtonName={"Update Panel"}
            handleBindPanelByPatientID={refreshPatientPanelList}
          />
        </OverLay>
      )}

      {previousBillsOpen && (
        <Modal
          visible={previousBillsOpen}
          setVisible={setPreviousBillsOpen}
          modalWidth={"80vw"}
          Header={t("Previous Bills - Repeat Medicine")}
          footer={<></>}
        >
          <PreviousBillsModal
            patient={SearchPatient?.patientDetail}
            existingItemIDs={
              new Set(
                (bodyData || []).map((row) => String(row?.ItemID ?? "").split("#")[0]),
              )
            }
            onAdd={addRepeatItems}
          />
        </Modal>
      )}
      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"submit"}
          buttons={handleModelData?.extrabutton}
          modalData={handleModelData?.modalData}
          setModalData={setModalData}
          handleAPI={handleModelData?.handleInsertAPI}
          footer={<></>}
        >
          {handleModelData?.Component}
        </Modal>
      )}
      
      <PaymentGateway
        pkgDisable={selectedPackage?.length > 0 ? true : false}
        hidePaymentModeIDs={
          hideCreditRoleIDs.includes(Number(currentStore)) ? [4] : []
        }
        screenType={paymentControlModeState}
        setScreenType={setPaymentControlModeState}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        discounts={discounts}
        button={
          <div className="d-flex">
            <button className="button " onClick={() => handleSave(false)}>
              {t("Bill")}
            </button>
            {/* {<button onKeyDown={handleKeyDown} className="button ">
              {t("Bill")}
            </button>} */}
            {!hideDraftButton && (
            <button
              className="button bg-primary ml-2"
              onClick={DraftPharmecyAPI}
            >
              <MedicineIconSVG />
              <span className="ml-2">{t("Draft")}</span>
            </button>
            )}
          </div>
        }
      />
      {bodyData?.length > 0 &&
        bodyData?.some((item) => item?.IsPrescriptionRequired === 1) && (
          <div className="row g-4 pt-2">
            <div className="col-md-7 col-sm-12"></div>
            <div
              className="col-md-5 col-sm-12 card p-3"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexDirection: "row",
              }}
            >
              <label htmlFor="prescription">
                {t(`Upload Prescription`)}
                <span className="ml-2" style={{ color: "red" }}>
                  {t("Pdf & Image only")}
                </span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept=".pdf,.jpg,.jpeg,.png"
                name="prescription"
              />
            </div>
          </div>
        )}
      {modalData?.visible && (
        <Modal
          visible={modalData?.visible}
          setVisible={() => {
            setModalData((val) => ({ ...val, visible: false }));
          }}
          modalData={modalData?.modalData}
          modalWidth={modalData?.width}
          Header={modalData?.label}
          buttonType="button"
          buttonName={modalData?.buttonName}
          buttonDisabled={isAddingIndent}
          footer={modalData?.footer}
          handleAPI={modalData?.CallAPI}
        >
          {modalData?.Component}
        </Modal>
      )}
      {stockModalVisible && (
        <StockDepartmentWiseModal
          visible={stockModalVisible}
          setVisible={setStockModalVisible}
        />
      )}
    </>
  );
}
