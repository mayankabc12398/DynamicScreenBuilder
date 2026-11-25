import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Heading from "../UI/Heading";
import IPDStaffMessageModal from "./IPDStaffMessageModal";
import { GetIPDStaffActiveMessages } from "../../networkServices/ipdStaffMessageApi";
import { useTranslation } from "react-i18next";
import BillingDepartmentDetailTable from "../UI/customTable/billings/BillingDepartmentDetailTable";
import LabeledInput from "../formComponent/LabeledInput";
import { useDispatch, useSelector } from "react-redux";
import { GetBindAllDoctorConfirmation } from "../../store/reducers/common/CommonExportFunction";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import useBillAmountVisibility from "../../utils/hooks/useBillAmountVisibility";
import {
  BillingRemarkLoadRemarks,
  BillingShowItemDetails,
  GetAllAuthorization,
  GetBillDetails,
  GetBindDepartment,
  GetIPDLabRadiologyReport,
  IPDAdvanceBindPatientDetails,
  PatientBillingAllTabSave,
  PatientBillingPayable,
  BillingShowAllItemDetails,
  SendProvisionalBillSms,
} from "../../networkServices/BillingsApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { belongsToPackage, notify } from "../../utils/utils";
import IPDServices from "../FrameMenuCommoncomponent/IPDServices";
import { ROUNDOFF_VALUE } from "../../utils/constant";
import SlideScreen from "../front-office/SlideScreen";
import { setLoading } from "../../store/reducers/loadingSlice/loadingSlice";
import Modal from "../modalComponent/Modal";
import RejectModal from "../modalComponent/Utils/patientBillingModal/RejectModal";
import { IPDServiceBillPdf } from "../../networkServices/BillingsApi";
import EditItemModal from "../modalComponent/Utils/patientBillingModal/EditItemModal";
import ChangeItemDoctorModal from "../modalComponent/Utils/patientBillingModal/ChangeItemDoctorModal";
import ViewLogModal from "../modalComponent/Utils/patientBillingModal/ViewLogModal";
import PatientBillingDiscountModal from "./PatientBillingDiscountModal";
import {
  AddSVG,
  DiscountSVG,
  NoNPayableSVG,
  PackageSVG,
  PayableSVG,
  QuantitySVG,
  RateSVG,
  RefreshIconSVG,
  RejectSVG,
} from "../SvgIcons";
import RateChange from "../modalComponent/Utils/patientBillingModal/RateChange";
import Discountchange from "../modalComponent/Utils/patientBillingModal/Discountchange";
import ItemRemarkModal from "../modalComponent/Utils/patientBillingModal/ItemRemarkModal";
import EditPackage from "../modalComponent/Utils/patientBillingModal/EditPackage";
import PackageBilling from "../modalComponent/Utils/patientBillingModal/PackageBilling";
import { Tooltip } from "primereact/tooltip";
import store from "../../store/store";
import QuantityChange from "../modalComponent/Utils/patientBillingModal/QuantityChange";
import BiilingRemarkModal from "../modalComponent/Utils/patientBillingModal/BiilingRemarkModal";
import UserRemarkModal from "../modalComponent/Utils/patientBillingModal/UserRemarksModal";
import Surgery from "./Surgery";
import { formatCurrency } from "../../utils/ustil2";
import MembershipCardBanner from "../commonComponents/MembershipCardBanner";
import IPDAdvanceAndRefund from "../../pages/Billing/IPD/IPDAdvanceAndRefund";
import TariffChange from "./TariffChange";
import { GetGlobalResources as fetchGlobalResources } from "../../networkServices/opdserviceAPI";
import MembershipCardModal from "../modalComponent/Utils/MembershipCardModal";
import {
  GetPatientMembershipDetails,
  GetPatientRemarks,
} from "../../networkServices/opdserviceAPI";
import PatientRemarksModal from "../modalComponent/Utils/PatientRemarksModal";

const PatientBilling = ({ data }) => {
  const [t] = useTranslation();
  const dispatch = useDispatch();
  const localdata = useLocalStorage("userData", "get");
  const ip = useLocalStorage("ip", "get");
  // IPD Billing role sees amounts straight away; every other role is blurred
  // until EDP > User Authorization grants IsViewPatientBillAnyModule.
  const showBillAmounts = useBillAmountVisibility();
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const IsDeptDiscountAllowed =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "ShowDeptWiseDiscountOnIPDBillPrint",
    )?.Value === "1";
  const IsLabStatusColourAllowed =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "ShowLabStatusColourOnIPDBilling",
    )?.Value === "1";
  // ShowRadiologyAcceptColourOnIPDBilling = 1: RADIOLOGY items green once accepted on Radiology
  // Acceptance, red until then (RadiologyStatus from BillingShowItemDetails). Other departments untouched.
  const IsRadiologyAcceptColourAllowed =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "ShowRadiologyAcceptColourOnIPDBilling",
      )?.Value ?? "",
    ).trim() === "1";
  const isShowUserRemarks =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "isShowUserRemarks",
    )?.Value === "1";
  const isShowDiscountCategoryField =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "ShowDiscountCategoryField",
    )?.Value === "1";
  // Edit Package modal ka "Add Surgery" button. 0 ya key hi na ho to button gayab
  // aur Save bilkul pehle jaisa - koi surgery payload me nahi jaata.
  const isShowAddSurgeryOnEditPackage =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "ShowAddSurgeryOnEditPackage",
    )?.Value === "1";
  // Department Details ka View Log column. 0 ya key hi na ho to column aur icon
  // dono gayab, aur koi log API call nahi hoti.
  const isShowBillItemViewLog =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "IsShowBillItemViewLog",
    )?.Value === "1";
  // Department Details row, next to Edit: a second icon that changes the doctor
  // credited on that one billed item (f_ledgertnxdetail.DoctorID/DoctorName only -
  // rate, qty, discount, amount untouched). 0 or key missing = icon stays hidden
  // and nothing about the row changes.
  const isShowChangeDoctorOnBillItem =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "ShowChangeDoctorOnBillItem",
    )?.Value === "1";
  const [pateintDetails, setPatientDetails] = useState({});
  // Set while the Advance pop-up is open, so the bill amounts can be refreshed when it closes.
  const advanceOpenRef = useRef(false);
  // Backend switches (fin_global_resources): IsBillingAdvanceButtonAllowed = 1 shows the
  // Advance button; BillingAdvanceButtonRoleIDs = comma separated role ids allowed to see it
  // (empty = every role). Off unless a client enables it.
  // IsPackageItemsCategoryWise = 1: the IPD PACKAGES department lists categories first, items on click.
  const [openPackageCategories, setOpenPackageCategories] = useState({});
  const [advanceSetting, setAdvanceSetting] = useState({
    packageCategoryWise: false,
    enabled: false,
    roleIDs: "",
    // Tariff Change ka button - bilkul Advance wali hi jodi, alag naamo se.
    tariffEnabled: false,
    tariffRoleIDs: "",
  });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // The store already holds fin_global_resources (loaded at login); only fetch the
        // whole list again when it is not there - it was fetched on every billing open.
        const resp = Array.isArray(GetGlobalResources) && GetGlobalResources.length
          ? { data: GetGlobalResources }
          : await fetchGlobalResources();
        const get = (name) => resp?.data?.find((r) => r?.Name === name)?.Value;
        if (active)
          setAdvanceSetting({
            enabled: String(get("IsBillingAdvanceButtonAllowed")) === "1",
            roleIDs: String(get("BillingAdvanceButtonRoleIDs") ?? ""),
            packageCategoryWise: String(get("IsPackageItemsCategoryWise")) === "1",
            tariffEnabled:
              String(get("IsBillingTariffChangeButtonAllowed")) === "1",
            tariffRoleIDs: String(get("BillingTariffChangeButtonRoleIDs") ?? ""),
          });
      } catch (e) {
        if (active)
          setAdvanceSetting({
            enabled: false,
            roleIDs: "",
            tariffEnabled: false,
            tariffRoleIDs: "",
          });
      }
    })();
    return () => {
      active = false;
    };
  }, [GetGlobalResources]);
  // Card-level info (name + validity) for the membership banner shown on the IPD
  // billing page; null when the patient has no applicable card for IPD.
  const [membershipCardInfo, setMembershipCardInfo] = useState(null);
  const [membershipCardOpen, setMembershipCardOpen] = useState(false);
  // MSG option - notices for Nursing / Emergency staff, shown as a running
  // banner at the top of the billing desk.
  const [staffMessages, setStaffMessages] = useState([]);
  const [staffMessageOpen, setStaffMessageOpen] = useState(false);

  // The whole MSG feature is switched from fin_global_resources: set
  // IsIPDStaffMessageShow to IsActive = 0 (or Value <> '1') and the button and
  // banner disappear, and nothing is fetched.
  const isStaffMessageShow = Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsIPDStaffMessageShow")
      ?.Value === "1";

  /* Bill finalize ho chuka hai to ye page sirf DEKHNE ke liye reh jaata hai.

     fin_global_resources -> BillFinalizedOpenScreens me 'Billing' pehle se
     pada hai, isliye finalize ke baad bhi ye page khulta hai (BillLockGate
     dekhiye). Par khulna aur badalna ek baat nahi: bill band ho chuka hai, to
     usme ab na service judni chahiye, na rate/discount/quantity badalni
     chahiye, na koi line reject honi chahiye.

     Isliye page padhne ke liye khula rehta hai aur likhne wale saare button
     hat jaate hain. Dekhne wali cheezein - Refresh, View Log, department
     khol-band karna, MSG aur membership - waise ki waisi chalti hain.

     Do shart ek saath lagti hain:

       1. data.isBilledClosed === "1"   -> isi bill ka finalize ho chuka ho.
          Wahi strict test jo BillLockGate aur MedicineRequisition karte hain,
          taaki teeno ek hi baat kahein.

       2. fin_global_resources -> BillFinalizedBillingReadOnly = '1'
          Row na ho ya 0 ho to kuch nahi badalta - page bilkul pehle jaisa
          chalta rehta hai. Ye isliye hai ki har site par ye rok nahi chahiye.

     Ye rok sirf screen par hai. Server ki apni jaanch jaisi thi waisi hi hai -
     ye uski jagah nahi le rahi. */
  const isBillFinalizedReadOnlySite =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "BillFinalizedBillingReadOnly",
    )?.Value === "1";

  const isBillViewOnly =
    isBillFinalizedReadOnlySite && data?.isBilledClosed === "1";

  /* Line ke apne remark ka khana aur uska button.

     fin_global_resources -> IsIPDBillingItemRemarks

        0 / row hi na ho  ->  na column dikhta hai, na button. Screen bilkul
                              pehle jaisi - har site par ye nahi chahiye.
        1                 ->  har line ke saamne Remark ka column aur uske aage
                              ek button jo popup kholta hai.

     Remark f_ledgertnxdetail.Remarks me us line ki apni ID par jaata hai.

     DHYAN: wahi column Set Rate aur Set Quantity bhi likhte hain - wahan jo
     reason bhara jaata hai wo isi khaane me jaata hai. Ek line par dono me se
     jo baad me chalega wahi reh jayega. Isi liye popup purana remark pehle se
     bhar kar dikhata hai. */
  const isItemRemarksOn =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "IsIPDBillingItemRemarks",
    )?.Value === "1";

  // Messages belong to the admission being viewed, so the banner follows the
  // patient rather than showing every notice in the centre.
  const staffMessageTransID = data?.transactionID || data?.TransactionID;

  const loadStaffMessages = useCallback(async () => {
    if (!isStaffMessageShow || !staffMessageTransID) {
      setStaffMessages([]);
      return;
    }
    const apiResp = await GetIPDStaffActiveMessages(staffMessageTransID);
    setStaffMessages(
      apiResp?.success && Array.isArray(apiResp.data) ? apiResp.data : [],
    );
  }, [isStaffMessageShow, staffMessageTransID]);

  useEffect(() => {
    loadStaffMessages();
  }, [loadStaffMessages]);
  const [slideScreenState, setSlideScreenState] = useState({
    // name: "",
    // component: null,
    name: t("Add Services Details"),
    show: false,
  });

  const iconElements = [
    // {
    //   Component: AddSVG,
    //   tooltipText: "Add Services",
    //   onClick: () => handleSlideScreen()
    // },
    {
      Component: RateSVG,
      tooltipText: "Set Rate",
      onClick: () =>
        handleModalState(
          true,
          t("Set Rate"),
          <RateChange
            handlePatientBillingAllTabSave={handlePatientBillingAllTabSave}
            data={data}
          />,
          "25vw",
          <></>,
        ),
    },
    {
      Component: DiscountSVG,
      tooltipText: "Set Discount",
      onClick: () =>
        handleModalState(
          true,
          t("Set Discount"),
          <Discountchange
            handlePatientBillingAllTabSave={handlePatientBillingAllTabSave}
            data={data}
            /* Modal ko pata hona chahiye ki rupaye kis cheez ka percentage
               banenge - ticked line ka kul Gross. */
            selectedGross={selectedItemsGross()}
          />,
          "25vw",
          <></>,
        ),
    },
    {
      Component: QuantitySVG,
      tooltipText: t("Quantity"),
      onClick: () =>
        handleModalState(
          true,
          t("Set Quantity"),
          <QuantityChange
            handlePatientBillingAllTabSave={handlePatientBillingAllTabSave}
            data={data}
          />,
          "25vw",
          <></>,
        ),
    },
    {
      Component: RejectSVG,
      tooltipText: "Rejection Reason",
      onClick: () =>
        handleModalState(
          true,
          t("Rejection Reason"),
          <RejectModal
            data={department}
            handleModalState={handleModalState}
            GetBindBillDepartment={GetBindBillDepartment}
            /* parentCategory jaan-bujh kar nahi bheja: bulk reject me kai
               department ke item ek saath ja sakte hain, isliye poora reload
               hi sahi hai. */
            GetBindBillDetails={GetBindBillDetails}
            pateintDetails={data}
          />,
          "25vw",
          <></>,
        ),
    },
    {
      Component: PackageSVG,
      tooltipText: "Package",
      onClick: () =>
        handleModalState(
          true,
          t("Package"),
          <PackageBilling
            data={department}
            handleModalState={handleModalState}
            GetBindBillDepartment={GetBindBillDepartment}
            pateintDetails={pateintDetails}
            TransactionID={data?.transactionID || data?.TransactionID}
          />,
          "25vw",
          <></>,
        ),
    },
    {
      Component: PayableSVG,
      tooltipText: "Payable",
      onClick: () =>
        handleModalState(
          true,
          t("Payable"),
          <>
            <div
              style={{ fontSize: "12px", fontWeight: 900, color: "red" }}
              className="text-center"
            >
              {t("Are You Sure ?")}
            </div>
          </>,
          "15vw",
          <div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handlePatientBillingPayable("Payable")}
            >
              {t("Yes")}
            </button>
          </div>,
        ),
    },
    {
      Component: NoNPayableSVG,
      tooltipText: t("Non-Payable"),
      onClick: () =>
        handleModalState(
          true,
          t("Non-Payable"),
          <>
            <div
              style={{ fontSize: "12px", fontWeight: 900, color: "red" }}
              className="text-center"
            >
              {t("Are You Sure ?")}
            </div>
          </>,
          "15vw",
          <div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handlePatientBillingPayable("NonPayable")}
            >
              {t("Yes")}
            </button>
          </div>,
        ),
    },
  ];

  const thead = [
    { width: "3%", name: t("Action") },
    ...(IsDeptDiscountAllowed ? [{ width: "3%", name: t("Dep Disc") }] : []),
    { width: "3%", name: t("S.No.") },
    t("Department"),
    { width: "10%", name: t("Quantity") },
    { width: "10%", name: t("Amount") },
    { width: "5%", name: t("Edit") },
    ...(isShowBillItemViewLog ? [{ width: "5%", name: t("View Log") }] : []),
  ];

  const [BillDetails, setBillDetails] = useState([]);
  const [department, setDepartment] = useState([]);
  // Department row jiska discount checkbox abhi tick hai (ek waqt me ek hi).
  const [discountRowIndex, setDiscountRowIndex] = useState(null);

  const [modalState, setModalState] = useState({
    show: false,
    name: null,
    component: null,
    size: null,
  });

  const [Authorization, setAuthorization] = useState({});

  const GetBindBillDetails = async () => {
    const transID = data?.transactionID
      ? data?.transactionID
      : data?.TransactionID;
    try {
      const data = await GetBillDetails(transID);
      if (data?.success) {
        setBillDetails(data?.data[0]);
      } else {
        setBillDetails({});
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* Read once and kept.

     These are the signed-in user's own permissions. They cannot change while the page is
     open, but they were fetched again on every department reload - which, after a rate
     edit, meant asking the server for the same answer it had just given. */
  const authorizationRef = useRef(null);
  const [sendingProvSms, setSendingProvSms] = useState(false);

  const handleSendProvisionalBillSms = async () => {
    const transID = data?.transactionID
      ? data?.transactionID
      : data?.TransactionID;
    if (!transID) return;
    setSendingProvSms(true);
    try {
      const res = await SendProvisionalBillSms(transID);
      notify(
        res?.message || (res?.success ? "SMS sent" : "SMS could not be sent"),
        res?.success ? "success" : "warn",
      );
    } catch (error) {
      notify(t("Could not send the provisional bill SMS"), "error");
    } finally {
      setSendingProvSms(false);
    }
  };

  const GetBindAuthorization = async () => {
    if (authorizationRef.current) return authorizationRef.current;
    try {
      const datas = await GetAllAuthorization();
      authorizationRef.current = datas?.data;
      return datas?.data;
    } catch (error) {
      console.log(error);
    }
  };

  /* Reload the departments.

     `onlyCategory` - a department's Category key ("7#0") - reloads that one department's
     lines and keeps every other department's lines that are already on screen.

     Editing one item's rate used to reload the whole bill: the department list, and then
     the lines of EVERY department, because the screen opens them all. On a patient with
     seven departments that was ten calls to change one line. The bill recalculation
     (sp_Billing_UpdateIPDBillDetails) does move the department subtotals, so the list
     itself is still re-read - but one line's lines are the only lines that changed.

     Called with nothing, it behaves exactly as before and loads everything, which is what
     the first paint needs. */
  const GetBindBillDepartment = async (onlyCategory) => {
    const transID = data?.transactionID
      ? data?.transactionID
      : data?.TransactionID;
    try {
      const response = await GetBindAuthorization();

      // SRS-2026-0057 point 7 / SRS-2026-0061 follow-up.
      //
      // This used to pass response[0]?.CanViewRate. sp_Ipd_Billing_GetBillDepartment
      // then applies IF(vViewRate = 1, SUM(t1.Amount), 0), so a login without that
      // permission got 0 for every department and the Amount column was empty.
      //
      // The gate is vestigial - it covers exactly one cell on a screen that shows
      // the identical figure everywhere else, none of which honours it:
      //   * Patient Bill Details (Gross, Net, Patient Payable, Balance, ROOM
      //     CHARGES, GST ON ROOM ...) comes from GetBillDetails(transID), which
      //     takes no ViewRate parameter at all;
      //   * the expanded child rows come from BillingShowItemDetails, which also
      //     takes no ViewRate - Rate and Net Amt are shown in full.
      // So masking the department subtotal hid nothing; it only made the summary
      // disagree with the rows it is summing.
      //
      // Passing 1 makes the subtotal consistent with the rest of the screen. If
      // rate-hiding is ever a genuine requirement it has to be applied to the
      // whole screen as one piece of work - panel, child rows and this subtotal
      // together - not to a single cell.
      const datas = await GetBindDepartment(transID, 1);
      setAuthorization(response[0]);

      /* Every department opened as the page loads.

         The + used to be pressed department by department, and the bill one came to read
         was three or four clicks away every time. The lines are what the screen is for,
         so they are there to begin with.

         Fetched together and written in ONE setDepartment. Calling the per-row loader in
         a loop would not do: each call copies the department list as it stands when it
         runs, so the second would be built on a copy that does not yet carry the first
         one's rows and would wipe them. */
      const nextRows = await withAllDepartmentsOpen(
        datas?.data,
        transID,
        onlyCategory,
      );
      departmentRef.current = nextRows;
      setDepartment(nextRows);
    } catch (error) {
      setDepartment([]);
      console.log(error);
    }
  };
  const handleRefreshPage = () => {
    dispatch(
      GetBindAllDoctorConfirmation({
        Department: "All",
        CentreID: localdata?.centreID,
      }),
    );
    /* Once. The same three calls were written out twice here, so Refresh asked the
       server for everything, then asked again for the same thing. */
    GetBindBillDetails();
    GetBindBillDepartment();
    handleIPDAdvanceBindPatientDetails(
      data?.patientID || data?.PatientID,
      data?.transactionID || data?.TransactionID,
    );
  };
  /* Page open: one round of the bill, departments and patient details. There were two
     mount effects doing the same three calls, so every one went twice. The all-doctor list
     is fetched only when the store does not have it yet. */
  const allDoctorList = useSelector(
    (state) => state.CommonSlice?.GetBindAllDoctorConfirmationData,
  );
  useEffect(() => {
    if (!Array.isArray(allDoctorList) || allDoctorList.length === 0) {
      dispatch(
        GetBindAllDoctorConfirmation({
          Department: "All",
          CentreID: localdata?.centreID,
        }),
      );
    }
    GetBindBillDetails();
    GetBindBillDepartment();
    handleIPDAdvanceBindPatientDetails(
      data?.patientID || data?.PatientID,
      data?.transactionID || data?.TransactionID,
    );
  }, [dispatch]);

  /* The second copy of this effect is gone.

     There were two, one on [dispatch] and one on [], and both ran on mount - so the page
     read the bill, the departments and the advances twice over before it had drawn
     anything. On a patient with seven departments that was twenty calls to open a screen.
     The effect above does all of it once. */

  // Load the patient's active membership card (IPD context) so the billing page
  // shows the card banner "if purchased". Same resolver/id source as IPDServices.
  useEffect(() => {
    const patID =
      pateintDetails?.PatientID ||
      pateintDetails?.patientID ||
      data?.patientID ||
      data?.PatientID;
    if (!patID) {
      setMembershipCardInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await GetPatientMembershipDetails(
          patID,
          "IPD",
          pateintDetails?.PanelID || data?.PanelID || "",
        );
        if (cancelled) return;
        if (!res?.success) {
          setMembershipCardInfo(null);
          return;
        }
        const list = Array.isArray(res?.data) ? res.data : [];
        setMembershipCardInfo(list[0] || null);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    pateintDetails?.PatientID,
    pateintDetails?.patientID,
    data?.patientID,
    data?.PatientID,
    pateintDetails?.PanelID,
    data?.PanelID,
  ]);

  /* The item rows of every department, fetched together.

     Quiet by design: the per-row loader toasts the server's message, which is right for
     one click and wrong for eight at once. A department whose items fail to load simply
     stays closed rather than taking the whole page down with it - the + is still there
     to try again by hand. */
  /* Keeps a copy of what is on screen, so a targeted reload can put back the lines it did
     not ask the server for. A ref rather than state: it is read inside an async reload
     that must see the latest rows, not the ones captured when it started. */
  const departmentRef = useRef([]);

  /* fin_global_resources -> IPDBillingExpandDepartments
         '1' (default)  har department khula, lines ke saath - jo abhi chal raha hai
         '0'            department band, line tabhi jab + dabayein - purana vyavhaar

     Kholne ki apni keemat hai: har department ki lines alag call me aati hain (ek
     department ka jawab 90.9 kB tak dekha gaya) aur saari rows ek saath render hoti
     hain. Jis patient ke ek hi department me 123 item hain, wahan ye mehsoos hota hai.
     Isliye ye site ke haath me rakha gaya hai, code me nahi. */
  const expandDepartments =
    String(
      (Array.isArray(GetGlobalResources)
        ? GetGlobalResources
        : GetGlobalResources?.data || []
      )?.find((item) => item?.Name === "IPDBillingExpandDepartments")?.Value ?? "",
    ).trim() !== "0";

  const withAllDepartmentsOpen = async (rows, transID, onlyCategory) => {
    if (!Array.isArray(rows) || rows.length === 0) return rows ?? [];

    /* Band rakha gaya hai: list jaisi aayi waisi, koi line nahi laayi jaati.
       Ek call, koi item row nahi - bilkul wahi jo is feature se pehle tha.
       Targeted reload (onlyCategory) phir bhi chalta hai, taaki edit ke baad khula
       hua department taaza ho jaye. */
    if (!expandDepartments && !onlyCategory) return rows;

    /* The lines already on screen, by department. A targeted reload reuses these instead
       of asking for them again. */
    const existing = new Map(
      (departmentRef.current ?? [])
        .filter((row) => row?.subRow?.subRowList)
        .map((row) => [String(row?.Category ?? ""), row.subRow.subRowList]),
    );

    /* Which departments actually need their lines read.

       One request for all of them, not one each. Seven of the per-department calls
       measured ~1,730 ms against this API - and the same whether the browser sent them
       together or one at a time, so Promise.all was buying nothing. The server also read
       the user's permissions once per call, seven times over, which the one call does
       once. */
    const wanted = [];
    rows.forEach((row) => {
      const key = String(row?.Category ?? "");
      if (!key) return;

      if (onlyCategory && key !== String(onlyCategory)) {
        /* Targeted reload me doosre department ki lines tabhi mangwayi jaati
           hain jab wo screen par dikhni to chahiye par abhi hain nahi.

           Collapsed mode (IPDBillingExpandDepartments = 0) me kisi bhi
           department ki lines dikhti hi nahi, isliye `existing` hamesha khaali
           rehta hai - aur bina is shart ke SAARE department mangwa liye jaate,
           jabki dikhana ek bhi nahi tha. */
        if (!expandDepartments) return;
        if (existing.has(key)) return;
      }

      wanted.push(key);
    });

    const fetched = new Map();

    /* Ye alag se rakhna zaroori hai: "call chali ya nahi" aur "lines mili ya
       nahi" do alag baatein hain.

       Pehle fallback ki shart `fetched.size === 0` thi. Par ek department me
       sach me ek bhi line na ho - jaise package ka wo department jiske saare
       item DR/CR lag kar hat chuke hon - tab bhi yahi 0 aata tha, aur screen
       har baar poora fallback chala deti thi. Yaani har reload par do baar
       kaam: ek naya endpoint, phir har department ke liye alag-alag purani
       call. Us patient par to ye HAMESHA hota tha.

       Ab fallback sirf tab chalta hai jab call hi na chali ho (endpoint abhi
       deploy na hua ho). Khaali jawab ko sach maana jaata hai. */
    let allItemsWorked = false;

    if (wanted.length > 0) {
      try {
        const response = await BillingShowAllItemDetails({
          transID: String(transID),
          categories: wanted,
        });
        if (response?.success && Array.isArray(response?.data)) {
          allItemsWorked = true;
          response.data.forEach((entry) => {
            const key = String(entry?.Category ?? entry?.category ?? "");
            const items = entry?.Items ?? entry?.items;
            // Khaali list bhi rakhi jaati hai - wo bhi ek jawab hai.
            if (key && Array.isArray(items)) {
              fetched.set(key, items);
            }
          });
        }
      } catch (error) {
        /* The one-call endpoint is new. If it is not there yet - a front end deployed
           ahead of its API - this falls back to the per-department call the screen has
           always used, so the page is correct either way and the two can be deployed in
           any order. Slower, but that is what it was before. */
      }

      if (!allItemsWorked) {
        const fallback = await Promise.all(
          wanted.map(async (key) => {
            try {
              const [categoryId, configID] = key.split("#");
              if (!categoryId) return null;
              const row = rows.find((r) => String(r?.Category ?? "") === key);
              const response = await BillingShowItemDetails({
                transID: String(transID),
                categoryId: String(categoryId),
                configID: String(configID ?? ""),
                dispName: row?.DisplayName,
                filterItem: [""],
                userID: "",
              });
              return response?.success ? response?.data : null;
            } catch (err) {
              return null;
            }
          }),
        );
        wanted.forEach((key, index) => {
          if (fallback[index]) fetched.set(key, fallback[index]);
        });
      }
    }

    const loaded = rows.map((row) => {
      const key = String(row?.Category ?? "");
      if (fetched.has(key)) return fetched.get(key);
      if (existing.has(key)) return existing.get(key);
      return null;
    });

    return rows.map((row, index) =>
      loaded[index]
        ? { ...row, subRow: { subRowList: loaded[index], isopen: true } }
        : row,
    );
  };

  // "User Remarks" - the same patient_remarks list as OPD Booking: read and add here,
  // blinking only while the patient has at least one remark.
  const remarksPatientID =
    pateintDetails?.PatientID ||
    pateintDetails?.patientID ||
    data?.patientID ||
    data?.PatientID;
  const [patientRemarks, setPatientRemarks] = useState([]);
  const [showPatientRemarks, setShowPatientRemarks] = useState(false);
  useEffect(() => {
    if (!remarksPatientID) {
      setPatientRemarks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await GetPatientRemarks(remarksPatientID);
      if (!cancelled) setPatientRemarks(Array.isArray(res?.data) ? res.data : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [remarksPatientID]);

  // "Billing Remarks" blinks like User Remarks while the admission has at least one
  // billing remark; the count is read again after a remark is saved in the modal.
  const billingRemarkTID = data?.transactionID || data?.TransactionID;
  const [billingRemarkCount, setBillingRemarkCount] = useState(0);
  const loadBillingRemarkCount = async () => {
    if (!billingRemarkTID) return setBillingRemarkCount(0);
    try {
      const res = await BillingRemarkLoadRemarks(billingRemarkTID);
      setBillingRemarkCount(res?.success && Array.isArray(res?.data) ? res.data.length : 0);
    } catch {
      setBillingRemarkCount(0);
    }
  };
  useEffect(() => {
    loadBillingRemarkCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingRemarkTID]);

  const handleBillingShowItemDetails = async (item, index) => {
    // Already fetched (closed with -, opened again): show the same rows, no second call.
    // GetBindBillDepartment rebuilds the list after every save / refresh, which clears this.
    if (Array.isArray(item?.subRow?.subRowList)) {
      const tableData = [...department];
      tableData[index] = {
        ...tableData[index],
        subRow: { ...tableData[index].subRow, isopen: true },
      };
      setDepartment(tableData);
      return;
    }
    dispatch(setLoading(true));
    try {
      const [categoryId, configID] = item?.Category.split("#");
      const response = await BillingShowItemDetails({
        transID: String(data?.transactionID || data?.TransactionID),
        categoryId: String(categoryId),
        configID: String(configID),
        dispName: item?.DisplayName,
        filterItem: [""],
        userID: "",
      });

      const tableDataMain = [...department];
      tableDataMain[index]["subRow"] = {
        subRowList: response?.data,
        isopen: true,
      };

      /* Kept in step with the screen, so a later targeted reload knows these lines are
         already here and does not ask for them again. */
      departmentRef.current = tableDataMain;
      setDepartment(tableDataMain);
      notify(response?.message, response?.success ? "success" : "error");
    } catch (error) {
      console.log(error, "Something Went Wrong");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleModalState = (show, name, component, size, footer) => {
    if (!show) {
      setDiscountRowIndex(null);
    }
    setModalState({
      show: show,
      name: name,
      component: component,
      size: size,
      footer: footer,
    });
  };

  const handleSubRowChange = (e, outerIndex, innerIndex) => {
    const { name, checked } = e.target;
    const data = JSON.parse(JSON.stringify(department));
    data[outerIndex]["subRow"]["subRowList"][innerIndex][name] = checked;
    setDepartment(data);
  };

  /* `parentCategory` is the department key ("7#0") these lines belong to. The lines
     themselves do not carry it - sp_ipd_billing_showItemsDetails does not return it - so
     it is handed down from the department row, and Edit uses it to reload only this
     department instead of the whole bill. */
  const handleDepartmentSubRow = (
    subRow,
    inx,
    parentCategory,
    isLabDepartment = false,
    isRadiologyDepartment = false,
    isProcedureChargeDepartment = false,
  ) => {
    // Lab status ka colour sirf LABORATORY department ke items par. Baaki
    // departments (Room Charges, Radiology, Hospital Charges...) ke rows par
    // LabStatus ka koi matlab nahi, isliye wahan rang aur legend dono band.
    const showLabStatus = IsLabStatusColourAllowed && isLabDepartment;
    const showRadiologyStatus =
      IsRadiologyAcceptColourAllowed && isRadiologyDepartment;

    const buildRow = (row, index) => {
        // Approved = hara, Provisional = pink, Rejected = laal. LabStatus khaali
        // (result aaya hi nahi) ho to row normal safed rehti hai.
        const labStatus = String(row?.LabStatus || "").trim();
        const labStatusStyle = !showLabStatus
          ? null
          : /^approved$/i.test(labStatus)
            ? { bg: "#1b5e20", text: "#ffffff" }
            : /^provisional$/i.test(labStatus)
              ? { bg: "#ffc0cb", text: "#212529" }
              : /^reject(ed)?$/i.test(labStatus)
                ? { bg: "#d32f2f", text: "#ffffff" }
                : null;
        // Radiology: accepted = green, rejected = red, not accepted yet (billed) = no colour.
        const radiologyStatus = String(row?.RadiologyStatus || "").trim();
        const radiologyStyle = !showRadiologyStatus || !radiologyStatus
          ? null
          : /^accepted$/i.test(radiologyStatus)
            ? { bg: "#1b5e20", text: "#ffffff" }
            : /^reject(ed)?$/i.test(radiologyStatus)
              ? { bg: "#d32f2f", text: "#ffffff" }
              : null;
        const rowStyle = labStatusStyle || radiologyStyle;

        return {
          input: (
            <div className="text-center">
              <input
                type="checkbox"
                checked={row?.isChecked}
                disabled={
                  row?.IsRowDisabled == 1
                    ? true
                    : !(row?.Rate === 0 || row?.Quantity > 0)
                }
                className="table-checkbox"
                name="isChecked"
                onChange={(e) => handleSubRowChange(e, inx, index)}
              />
            </div>
          ),

          CTBDate: row?.CTBDate ? row?.CTBDate : "",
          CTBNo: row?.CTBNo ? row?.CTBNo : "",
          // Rang on ho to hover par status bhi dikh jaye; poori row ka rang niche
          // colorcode se aata hai.
          Item: showLabStatus ? (
            <span title={labStatus}>{row?.ItemName}</span>
          ) : showRadiologyStatus && radiologyStatus ? (
            <span title={radiologyStatus}>{row?.ItemName}</span>
          ) : (
            row?.ItemName
          ),
          IssueDate: row?.IssueDate,
          Rate: <div className="text-right">{row?.Rate}</div>,
          Quantity: <div className="text-right">{row?.Quantity}</div>,
          DiscPer: <div className="text-right">{row?.DiscPer}</div>,
          DiscAmt: <div className="text-right">{row?.DiscAmt}</div>,
          Amount: <div className="text-right">{row?.Amount}</div>,
          Package: <div className="text-right">{row?.Package}</div>,
          Name: row?.Name,
          DiscGivenBy: row?.DiscGivenBy,
          Payable: row?.Payable,
          // Hidden - not rendered as its own column (NestedRowTable excludes it like
          // colorcode/textcolor/LabStatus). Only feeds the Set Filter "Sub Dept" dropdown,
          // same sp_ipd_billing_showItemsDetails column the old ASPX Set Filter used.
          SubCat: row?.SubCat || row?.subCategoryname || "",
          /* Remark - jo likha hai wo dikhta hai, aur uske aage button se popup
             khulta hai. Bill finalize ho chuka ho to sirf padha ja sakta hai,
             badla nahi - wahi rok jo baaki likhne wale button par lagi hai. */
          ...(isItemRemarksOn
            ? {
                Remark: (
                  <div className="d-flex align-items-center" style={{ gap: 6 }}>
                    <span
                      title={row?.Remarks || ""}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row?.Remarks || ""}
                    </span>

                    {!isBillViewOnly && (
                      <i
                        className="fa fa-comment p-1 text-primary"
                        style={{ cursor: "pointer" }}
                        title={t("Add / Edit Remark")}
                        onClick={() =>
                          handleModalState(
                            true,
                            t("Remark"),
                            <ItemRemarkModal
                              data={row}
                              handleModalState={handleModalState}
                              GetBindBillDepartment={GetBindBillDepartment}
                              parentCategory={parentCategory}
                            />,
                            "30vw",
                            <></>,
                          )
                        }
                      />
                    )}
                  </div>
                ),
              }
            : {}),
          Edit: (
            <div className="text-center">
              {/* {row?.configid != "11" && row?.IsRowDisabled == 0 && ( */}
              {
                //  row?.configid != "11" &&
                !isBillViewOnly && row?.IsRowDisabled == 0 && row?.IsEdit && (
                  <i
                    className="fa fa-edit p-1 text-primary"
                    onClick={() =>
                      handleModalState(
                        true,
                        t("Edit Item"),
                        <EditItemModal
                          data={row}
                          parentCategory={parentCategory}
                          handleModalState={handleModalState}
                          GetBindBillDepartment={GetBindBillDepartment}
                        />,
                        "50vw",
                        <></>,
                      )
                    }
                  />
                )
              }
              {isShowChangeDoctorOnBillItem &&
                isProcedureChargeDepartment &&
                row?.IsRowDisabled == 0 && (
                  <i
                    className="fa fa-user-md p-1 text-primary"
                    title={t("Change Doctor")}
                    onClick={() =>
                      handleModalState(
                        true,
                        t("Change Doctor"),
                        <ChangeItemDoctorModal
                          data={row}
                          handleModalState={handleModalState}
                          GetBindBillDepartment={GetBindBillDepartment}
                        />,
                        "40vw",
                        <></>,
                      )
                    }
                  />
                )}
            </div>
          ),
          Reprint: (
            <div className="text-center">
              {row?.ID ? (
                <i
                  className={`fa fa-print ${labStatusStyle?.text === "#ffffff" ? "text-white" : "text-primary"}`}
                  style={{ cursor: "pointer" }}
                  title={t("Reprint IPD Bill")}
                  onClick={() => handleServiceSlipReprint(row)}
                />
              ) : null}
            </div>
          ),
          Reject: (
            <div className="text-center">
              {" "}
              {/* {row?.configid != "11" && row?.IsRowDisabled == 0 && ( */}
              {!isBillViewOnly && row?.IsReject && row?.IsRowDisabled == 0 && (
                <i
                  className={`fa fa-trash ${labStatusStyle?.text === "#ffffff" ? "text-white" : "text-danger"}`}
                  onClick={() => {
                    const isPackageItem = belongsToPackage(row?.Package);
                    if (isPackageItem) {
                      notify(
                        t("This item is part of a package. Please remove the item from the package first, then delete it."),
                        "error",
                      );
                      return;
                    }
                    handleModalState(
                      true,
                      "Rejection Reason",
                      <RejectModal
                        data={row}
                        pateintDetails={data}
                        handleModalState={handleModalState}
                        GetBindBillDepartment={GetBindBillDepartment}
                        GetBindBillDetails={GetBindBillDetails}
                        /* Sirf isi department ki lines dobara aayengi. Package
                           wala item yahan tak pahunchta hi nahi - upar uski
                           rok lagi hui hai. */
                        parentCategory={parentCategory}
                      />,
                      "25vw",
                      <></>,
                    );
                  }}
                />
              )}
            </div>
          ),

          // Lab test ka result status - sp_ipd_billing_showItemsDetails se LabStatus aata
          // hai. Provisional = halka laal, Approved = halka hara. Lab ke alawa items par
          // LabStatus khaali rehta hai, to unki row ka rang nahi badalta.
          // NestedRowTable colorcode ko column ki tarah render nahi karta, sirf row ka
          // background banata hai.
          // LabStatus khaali = test bill to ho gaya par result aaya hi nahi -> row white.
          colorcode: rowStyle?.bg || "",
          // Background par text padha ja sake - gehre rang par safed, pink par kaala.
          textcolor: rowStyle?.text || "",
          // LabStatus — tooltip display ke liye; column render nahi hoga (NestedRowTable filter karta hai)
          LabStatus: showLabStatus ? labStatus : "",
        };
    };
    // Package department (config 14): when IsPackageItemsCategoryWise is on, show one row per
    // category first; clicking it opens that category's items. Items keep their original index
    // so the row checkboxes still update the right entry.
    const rows = subRow?.subRowList || [];
    const isPackageDept =
      String(department?.[inx]?.Category?.split("#")?.[1]) === "14";
    let tableResponse;
    if (advanceSetting.packageCategoryWise && isPackageDept && rows.length > 0) {
      const groups = new Map();
      rows.forEach((row, index) => {
        const key =
          row?.CategoryName || row?.categoryName || row?.subCategoryname || row?.TypeOfTnx || "Other";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ row, index });
      });
      tableResponse = [];
      groups.forEach((items, key) => {
        const openKey = `${inx}|${key}`;
        const open = !!openPackageCategories[openKey];
        const total = items.reduce((s, x) => s + (Number(x.row?.Amount) || 0), 0);
        tableResponse.push({
          input: "",
          CTBDate: "",
          CTBNo: "",
          Item: (
            <span
              style={{ cursor: "pointer", fontWeight: "bold" }}
              onClick={() =>
                setOpenPackageCategories((prev) => ({
                  ...prev,
                  [openKey]: !prev[openKey],
                }))
              }
            >
              <i className={`fa ${open ? "fa-minus" : "fa-plus"} mr-2`} aria-hidden="true" />
              {key} ({items.length})
            </span>
          ),
          IssueDate: "",
          Rate: "",
          Quantity: "",
          DiscPer: "",
          DiscAmt: "",
          Amount: <div className="text-right">{total.toFixed(ROUNDOFF_VALUE)}</div>,
          Package: "",
          Name: "",
          DiscGivenBy: "",
          Payable: "",
          /* Ye package wale group ka sirf heading row hai - iska koi apna
             remark nahi hota. Phir bhi khaali khana rakhna padta hai, kyunki
             column header aur row ka milan GINTI se hota hai: ek khana chhoota
             to Edit/Reject ek jagah baayein khisak jate hain. */
          ...(isItemRemarksOn ? { Remark: "" } : {}),
          Edit: "",
          Reprint: "",
          Reject: "",
        });
        if (open) items.forEach(({ row, index }) => tableResponse.push(buildRow(row, index)));
      });
    } else {
      tableResponse = rows.length > 0 && rows.map((row, index) => buildRow(row, index));
    }

    return {
      subRowList: tableResponse,
      isopen: subRow?.isopen,
      // NestedRowTable isi flag par legend dikhata hai, isliye legend bhi sirf
      // LABORATORY ke neeche aata hai.
      showLabStatusLegend: showLabStatus,
      showRadiologyStatusLegend: showRadiologyStatus,
      secondThead: [
        <input
          type="checkbox"
          className="table-checkbox"
          onChange={(e) => handleMainCheck(e, inx, subRow?.subRowList)}
          checked={
            subRow?.subRowList?.length > 0 &&
            subRow?.subRowList.every((row, _) => row?.isChecked === true)
          }
          disabled={
            subRow?.subRowList?.length > 0 &&
            subRow?.subRowList.every((row, _) => row?.configid == "")
          }
        />,
        t("CTB Date"),
        t("CTB No"),

        t("Item"),
        t("Date"),
        t("Rate"),
        t("Quantity"),
        t("Disc. %"),
        t("Disc.Amt."),
        t("Net Amt."),
        t("Package"),
        t("User"),
        t("Disc. Given By"),
        t("Non Payable"),
        /* Column tabhi, jab flag chaalu ho. Ye thead aur row ke object - dono
           me ek saath shart par hai; ek jagah chhoot jaye to saari columns
           khisak jaati hain. */
        ...(isItemRemarksOn ? [t("Remark")] : []),
        { width: "3%", name: t("Edit") },
        { width: "3%", name: t("Reprint") },
        { width: "3%", name: t("Reject") },
      ],
    };
  };

  // 25-10-2026: Reprint of the "IPD Bill" slip (the same one "Print on Save" gives on Add Services)
  // for one bill line - the slip prints ledger lines ID > from AND ID <= to.
  const handleServiceSlipReprint = async (row) => {
    const lineId = Number(row?.ID);
    const transactionID = Number(data?.TransactionID || data?.transactionID);
    if (!lineId || !transactionID) {
      notify(t("This line cannot be reprinted"), "error");
      return;
    }
    try {
      const resp = await IPDServiceBillPdf({
        transactionID,
        fromLedgerTnxID: lineId - 1,
        toLedgerTnxID: lineId,
        isLogo: 1,
      });
      if (resp?.success && resp?.data?.pdfUrl) {
        RedirectURL(resp?.data?.pdfUrl);
      } else {
        notify(resp?.message || t("Failed to generate IPD Bill"), "error");
      }
    } catch (error) {
      notify(t("Error generating IPD Bill"), "error");
    }
  };

  const handleMini = (index) => {
    const tableData = JSON.parse(JSON.stringify(department));
    tableData[index]["subRow"]["isopen"] = false;
    departmentRef.current = tableData;
    setDepartment(tableData);
  };

  const handleMainCheck = (e, index, data) => {
    const { checked } = e.target;
    const val = JSON.parse(JSON.stringify(department));

    val[index].subRow.subRowList = data.map((item) => {
      const isDisabled = item.configid === "11" || item.IsRowDisabled == 1;

      return {
        ...item,
        isChecked: isDisabled ? item.isChecked : checked,
      };
    });

    setDepartment(val);
  };

  const handleDepartmentTable = (tableData) => {
    return (
      Array.isArray(tableData) &&
      tableData?.map((item, index) => {
        const [_, configID] = item?.Category.split("#");
        return {
          Action: item?.subRow?.isopen ? (
            <div
              onClick={() => {
                handleMini(index);
              }}
              className="text-center"
            >
              <i className="fa fa-minus py-1 " aria-hidden="true"></i>
            </div>
          ) : (
            <div
              onClick={() => handleBillingShowItemDetails(item, index)}
              className="text-center"
            >
              <i className="fa fa-plus py-1 " aria-hidden="true"></i>
            </div>
          ),
          ...(IsDeptDiscountAllowed
            ? {
              Discount: (
                <div className="text-center">
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={discountRowIndex === index}
                    onChange={(e) =>
                      handleDepartmentDiscountCheck(
                        e.target.checked,
                        item,
                        index,
                      )
                    }
                  />
                </div>
              ),
            }
            : {}),
          sno: index + 1,
          Department: item?.DisplayName,
          Quantity: <div className="text-right">{item?.Qty}</div>,
          // SRS-2026-0057 point 7. The department subtotal is the sum of the
          // child rows below it and matches the totals in Patient Bill Details
          // above, both of which are always shown. GetBindBillDepartment now
          // requests it unmasked (see the comment there), so render it plainly.
          Amount: (
            <div className="text-right">
              {Number(item?.NetAmt).toFixed(ROUNDOFF_VALUE)}
            </div>
          ),

          Edit:
            !isBillViewOnly && String(configID) === "14" ? (
              <div className="text-center">
                <i
                  className="fa fa-edit text-primary"
                  aria-hidden="true"
                  onClick={() => {
                    handleModalState(
                      true,
                      "Edit Package",
                      <EditPackage
                        item={item}
                        pateintDetails={pateintDetails}
                        handleModalState={handleModalState}
                        GetBindBillDepartment={GetBindBillDepartment}
                        isShowAddSurgery={isShowAddSurgeryOnEditPackage}
                        onAddSurgery={(picked) =>
                          handleAddSurgeryFromPackage(item, picked)
                        }
                      />,
                      "45vw",
                      <></>,
                    );
                  }}
                ></i>
              </div>
            ) : (
              ""
            ),
          // Is department ke items par hue rate / qty / discount ke edits.
          // Category "categoryId#configID" format me aata hai, log ConfigID par
          // filter hota hai.
          ...(isShowBillItemViewLog
            ? {
                ViewLog: (
                  <div className="text-center">
                    <i
                      className="fas fa-search text-primary"
                      aria-hidden="true"
                      onClick={() =>
                        handleModalState(
                          true,
                          t("Rate Change Log"),
                          <ViewLogModal
                            transID={String(
                              data?.transactionID || data?.TransactionID,
                            )}
                            configID={item?.Category?.split("#")[1] || ""}
                            departmentName={item?.DisplayName}
                          />,
                          "75vw",
                          <></>,
                        )
                      }
                    ></i>
                  </div>
                ),
              }
            : {}),
          subRow: handleDepartmentSubRow(
            item?.subRow,
            index,
            item?.Category,
            String(item?.DisplayName || "").trim().toUpperCase() ===
              "LABORATORY",
            String(item?.DisplayName || "").trim().toUpperCase() ===
              "RADIOLOGY",
            String(item?.DisplayName || "").trim().toUpperCase() ===
              "PROCEDURE CHARGES",
          ),
        };
      })
    );
  };

  const advanceRoleList = String(advanceSetting.roleIDs)
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  // After an advance is saved (and its receipt sent to print) close the pop-up and refresh the bill amounts.
  const handleAdvanceSaved = () => {
    advanceOpenRef.current = false;
    handleModalState(false, null, null, null, <></>);
    GetBindBillDetails();
  };
  /* Tariff change bill ke rate hi badal deta hai, isliye save ke baad upar ke
     jod dobara padhe jaate hain - warna purane aankde dikhte rehte. Pop-up khula
     chhoda jaata hai, kyunki user aksar ek ke baad doosri tulna dekhta hai. */
  const tariffRoleList = String(advanceSetting.tariffRoleIDs)
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const handleTariffSaved = () => {
    GetBindBillDetails();
    GetBindBillDepartment();
  };

  const billingPatient = data; // the useMemo below shadows `data` with its own list
  const tariffChangeButtonVisible =
    // Bill finalize ho chuka ho to tariff bhi nahi badalna chahiye - wahi rok
    // jo baaki likhne wale button par lagi hai.
    !isBillViewOnly &&
    advanceSetting.tariffEnabled &&
    (tariffRoleList.length === 0 ||
      tariffRoleList.includes(String(localdata?.defaultRole)));

  const advanceButtonVisible =
    // Finalize ke baad paisa idhar-udhar nahi hona chahiye, isliye Advance /
    // Refund bhi usi rok me aata hai.
    !isBillViewOnly &&
    advanceSetting.enabled &&
    (advanceRoleList.length === 0 ||
      advanceRoleList.includes(String(localdata?.defaultRole)));
  const handleDataInDetailView = useMemo(() => {
    if (Object.keys(BillDetails)?.length > 0) {
      const data = [
        {
          label: t("Gross Amount"),
          value: BillDetails?.GrossBillAmount || "0.00",
        },
        {
          label: t("Item Discount"),
          value: BillDetails?.ItemWiseDiscount || "0.00",
        },
        {
          label: t("Discount On Bill"),
          value: BillDetails?.DiscountOnBill || "0.00",
        },
        {
          label: t("Total Discount"),
          value: BillDetails?.TotalDiscount || "0.00",
        },
        {
          label: t("Round Off"),
          value: BillDetails?.RoundOff || "0.00",
        },
        {
          label: t("Net Amount"),
          value: BillDetails?.NetAmount || "0.00",
        },
        {
          label: t("Patient Payable"),
          value: BillDetails?.PatientPaybleAmt || "0.00",
        },
        {
          label: t("Panel Payable"),
          value: BillDetails?.PanelPaybleAmt || "0.00",
        },
        {
          label: t("Patient Paid"),
          value: BillDetails?.PatientPaidAmt || "0.00",
        },
        {
          label: t("Panel Paid"),
          value: BillDetails?.PanelPaidAmt || "0.00",
        },
        {
          label: t("Total Paid"),
          value: BillDetails?.TotalPaidAmount || "0.00",
        },
        {
          label: t("Deduction"),
          value: BillDetails?.TotalDeductions || "0.00",
        },
        {
          label: t("TDS"),
          value: BillDetails?.TotalTDS || "0.00",
        },
        {
          label: t("Write Off"),
          value: BillDetails?.TotalWriteOff || "0.00",
        },
        {
          label: t("Balance Amt"),
          value: BillDetails?.RemainingAmt || "0.00",
        },
        {
          label: t("Patient Balance"),
          value: BillDetails?.PatientRemaining || "0.00",
        },
        {
          label: t("Panel Balance"),
          value: BillDetails?.PanelRemaining || "",
        },
        {
          label: t("Room Charges"),
          value: BillDetails?.RoomCharges || "0.00",
        },
        {
          label: t("GST On Room"),
          value: BillDetails?.GSTONRoom || "0.00",
        },
        {
          /* Medicines of this admission are billed on their own pharmacy bills, tied
             back by f_ledgertnxdetail.ReferenceTransactionID, so they are shown beside
             the IPD bill rather than inside it. */
          label: "Pharmacy Bill Amount",
          value: BillDetails?.PharmacyBillAmount ?? "0.00",
        },
        {
          label: "Pharmacy Total Amount",
          value: BillDetails?.PharmacyNetAmount ?? "0.00",
        },
        {
          label: "Pharmacy Paid Amount",
          value: BillDetails?.PharmacyPaidAmount ?? "0.00",
        },
        {
          label: "Pharmacy Balance Amt",
          value: BillDetails?.PharmacyBalanceAmount ?? "0.00",
          action: (
            <>
              {advanceButtonVisible ? (
                <button
                  type="button"
                  className="btn btn-sm btn-success ml-1"
                  onClick={() => {
                    advanceOpenRef.current = true;
                    handleModalState(
                      true,
                      t("IPD Advance & Refund"),
                      <IPDAdvanceAndRefund
                        data={billingPatient}
                        onSaved={handleAdvanceSaved}
                      />,
                      "80vw",
                      <></>,
                    );
                  }}
                >
                  {t("Advance")}
                </button>
              ) : null}

              {/* Advance ke bilkul bagal me, aur bilkul usi tarah: apna flag,
                  apni role wali suchi, aur wahi pop-up. Isi se wo screen
                  khulti hai jo frame menu me "Tariff Change" tab par hai -
                  wahi component, wahi data. */}
              {tariffChangeButtonVisible ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary ml-1"
                  onClick={() =>
                    handleModalState(
                      true,
                      t("Tariff Change"),
                      <TariffChange
                        data={billingPatient}
                        onSaved={handleTariffSaved}
                      />,
                      "80vw",
                      <></>,
                    )
                  }
                >
                  {t("Tariff Change")}
                </button>
              ) : null}
            </>
          ),
        },
      ];

      return data;
    } else {
      return [];
    }
  }, [
    BillDetails,
    advanceButtonVisible,
    tariffChangeButtonVisible,
    billingPatient,
  ]);

  const handleIPDAdvanceBindPatientDetails = async (
    patientID,
    transactionID,
  ) => {

    try {
      const response = await IPDAdvanceBindPatientDetails(
        patientID,
        transactionID,
      );
      if (response?.success) {
        setPatientDetails(response?.data[0]);
      } else {
        notify(response?.message, "error");
      }

    } catch (error) {
      console.log(error, "Somthing Went Wrong");
    }
  };

  const handleSaveAddItemSuccessfully = async () => {
    await GetBindBillDepartment();
    setSlideScreenState({
      show: false,
      name: "",
      component: null,
    });
  };

  const handlePatientBillingPayable = async (type) => {
    store.dispatch(setLoading(true));
    try {
      const checkedData = [];
      for (let i = 0; i < department?.length; i++) {
        const { subRow } = department[i];
        for (let j = 0; j < subRow?.subRowList?.length; j++) {
          if (subRow?.subRowList[j]?.["isChecked"] === true) {
            checkedData.push(`'${subRow?.subRowList[j]?.["ID"]}'`);
          }
        }
      }

      const response = await PatientBillingPayable({
        isSurgery: false,
        type: String(type),
        ipAddress: String(ip),
        ID: checkedData.join(","),
      });

      notify(response?.message, response?.success ? "success" : "error");

      if (response?.success) {
        handleModalState(false, null, null, null, null);
        await GetBindBillDepartment();
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  /* Jin line par tick lagi hai unka kul Gross.

     Set Discount (D) ab rupaye me bhi liya ja sakta hai, par server sirf
     percentage leta hai - wo har chuni hui line par
     GrossAmount * DiscPer / 100 lagata hai. Rupaye ko percentage me badalne
     ke liye un line ka kul Gross chahiye, aur wahi yahan gina jaata hai.

     Gross = Rate x Quantity. Ye maan kar nahi liya - DB par jaancha:
     1-Oct se ab tak ki 16,806 line me se 16,806 par GrossAmount theek
     Rate x Quantity hai. Server khud bhi Quantity badalte waqt
     GrossAmount=(@Qty*Rate) hi likhta hai.

     Gross isliye, Net (Amount) nahi: server ka hisaab Gross par chalta hai.
     Net par ginte to pehle se discount lagi line par aankda kam baith jaata. */
  const selectedItemsGross = () => {
    let total = 0;
    for (let i = 0; i < department?.length; i++) {
      const { subRow } = department[i];
      for (let j = 0; j < subRow?.subRowList?.length; j++) {
        const row = subRow?.subRowList[j];
        if (row?.isChecked === true) {
          total += (Number(row?.Rate) || 0) * (Number(row?.Quantity) || 0);
        }
      }
    }
    return total;
  };

  const handlePatientBillingAllTabSave = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      payload.ipAddress = String(ip);
      const checkedData = [];
      for (let i = 0; i < department?.length; i++) {
        const { subRow } = department[i];
        for (let j = 0; j < subRow?.subRowList?.length; j++) {
          if (subRow?.subRowList[j]?.["isChecked"] === true) {
            checkedData.push(`'${subRow?.subRowList[j]?.["ID"]}'`);
          }
        }
      }
      payload.ID = checkedData.join(",");

      const response = await PatientBillingAllTabSave(payload);
      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        handleModalState(false, null, null, null, <></>);
        GetBindBillDetails();
        GetBindBillDepartment();
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    } finally {
      store.dispatch(setLoading(false));
    }
  };
  const getDepartmentItemIds = async (item) => {
    let itemList = item?.subRow?.subRowList;
    if (!Array.isArray(itemList) || itemList?.length === 0) {
      const [categoryId, configID] = item?.Category?.split("#") || [];
      const response = await BillingShowItemDetails({
        transID: String(data?.transactionID || data?.TransactionID),
        categoryId: String(categoryId),
        configID: String(configID),
        dispName: item?.DisplayName,
        filterItem: [""],
        userID: "",
      });
      itemList = response?.data;
    }
    return (Array.isArray(itemList) ? itemList : [])
      .map((row) => row?.ID)
      .filter((id) => id !== undefined && id !== null && id !== "");
  };
  const handleDepartmentDiscountSave = async (item, payload) => {
    store.dispatch(setLoading(true));
    try {
      const itemIds = await getDepartmentItemIds(item);
      if (itemIds?.length === 0) {
        notify(t("No item found in this department"), "error");
        return;
      }
      payload.ipAddress = String(ip);
      payload.ID = itemIds.map((id) => `'${id}'`).join(",");
      // Save ke baad backend sp_Billing_UpdateIPDBillDetails isi ID par bill total
      // dobara banata hai, isliye dono naming (transactionID / TransactionID) cover ki hai.
      payload.TransactionID =
        payload?.TransactionID || data?.transactionID || data?.TransactionID;

      const response = await PatientBillingAllTabSave(payload);
      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        handleModalState(false, null, null, null, <></>);
        GetBindBillDetails();
        GetBindBillDepartment();
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  const handleDepartmentDiscountCheck = (checked, item, index) => {
    if (!checked) {
      handleModalState(false, null, null, null, <></>);
      return;
    }
    setDiscountRowIndex(index);
    handleModalState(
      true,
      `${t("Set Discount")} - ${item?.DisplayName || ""}`,
      <Discountchange
        handlePatientBillingAllTabSave={(obj) =>
          handleDepartmentDiscountSave(item, obj)
        }
        data={data}
      />,
      "25vw",
      <></>,
    );
  };

  const handleSlideScreen = (data) => {
    setSlideScreenState({
      name: t("Add Services Details"),
      show: true,
      component: (
        <div className="card patient_registration border mt-2">
          <div className="row p-2">
            <div className="col-sm-12">
              <IPDServices
                pateintDetails={pateintDetails}
                Authorization={Authorization}
                handleSaveAddItemSuccessfully={handleSaveAddItemSuccessfully}
                GetBindBillDetails={GetBindBillDetails}
                data={data}
              />
            </div>
          </div>
        </div>
      ),
    });
  };

  /* "Add Surgery" on the Edit Package modal. The slide-up frame sits BELOW PrimeReact
     dialogs (z-index 2 in Classic / 1050 in Modern, against the dialog's ~1100), so the
     modal has to be closed for the surgery screen to be visible at all. It is opened
     again with whatever surgery was picked, which is also why Edit Package takes its
     selection as a prop - the component is a fresh mount on the way back. */
  const handleAddSurgeryFromPackage = (item, currentSurgery) => {
    const closeSlideScreen = () =>
      setSlideScreenState({ show: false, name: "", component: null });

    const openEditPackage = (surgery) =>
      handleModalState(
        true,
        "Edit Package",
        <EditPackage
          item={item}
          pateintDetails={pateintDetails}
          handleModalState={handleModalState}
          GetBindBillDepartment={GetBindBillDepartment}
          isShowAddSurgery={isShowAddSurgeryOnEditPackage}
          initialSurgery={surgery}
          onAddSurgery={(picked) => handleAddSurgeryFromPackage(item, picked)}
        />,
        "45vw",
        <></>,
      );

    handleModalState(false, null, null, null, <></>);

    setSlideScreenState({
      name: t("Add Surgery"),
      show: true,
      // Closing the frame by its X counts as "changed my mind", so the package rows
      // come back with the surgery they already had rather than the screen ending up
      // on the bare billing desk.
      onClose: () => openEditPackage(currentSurgery),
      component: (
        <div className="card patient_registration border mt-2">
          <div className="row p-2">
            <div className="col-sm-12">
              <Surgery
                data={data}
                /* Surgery closes itself through this once it has saved. Only the
                   slide frame is closed here - the modal is re-opened by
                   onSurgerySaved, which Surgery calls just before this. */
                handleModalState={closeSlideScreen}
                onSurgerySaved={(surgery) => {
                  closeSlideScreen();
                  openEditPackage(
                    surgery?.Surgery_ID
                      ? {
                          surgeryID: surgery?.Surgery_ID,
                          surgeryName: surgery?.SurgeryName || "",
                        }
                      : currentSurgery,
                  );
                }}
              />
            </div>
          </div>
        </div>
      ),
    });
  };

  /* Har row ka JSX ek hi baar banta hai.

     Ye `tbody={handleDepartmentTable(department)}` tha - JSX ke andar function call, yaani
     is page ke KISI BHI state badalne par (yahan tereh useState hain) poori table ka JSX
     dobara banta tha: har department, har item, aur har item ke andar checkbox, input aur
     icons. Jis patient ke ek hi department me 123 item hain, wahan ye har keystroke, har
     modal khulne-band hone par dohra raha tha.

     Ab sirf tab banta hai jab department ki rows sach me badlein. */
  const departmentTableRows = useMemo(
    () => handleDepartmentTable(department),
    /* Everything the rows are actually drawn from. Narrower deps would have been faster
       still and wrong: a row would keep showing the permission, the bill figure or the
       open package it was built with, not the one on screen now. */
    [
      data,
      department,
      Authorization,
      BillDetails,
      advanceSetting,
      openPackageCategories,
      pateintDetails,
      IsLabStatusColourAllowed,
    ],
  );
  const handleLabRadiologyReport = async () => {
    const tid = data?.transactionID || data?.TransactionID;
    if (!tid) return notify("Transaction ID not found", "error");
    try {
      const res = await GetIPDLabRadiologyReport(tid);
      if (res?.success && res?.data?.pdfUrl) {
        RedirectURL(res.data.pdfUrl);
      } else {
        notify(res?.message || "No records found", "error");
      }
    } catch (err) {
      notify("Failed to generate report", "error");
    }
  };

  return (
    <>
      <Tooltip
        target={`#RefreshIcon`}
        position="top"
        content={t("Refresh")}
        event="hover"
        className="ToolTipCustom"
      />

      {/* MSG - running notice for Nursing / Emergency staff. Sits at the very top
          of the billing desk, directly under the View IPD Patient menu. */}
      {isStaffMessageShow ? (
        <div className="d-flex align-items-center gap-2 mb-1">
          <button
            type="button"
            title={t("Add / edit message for Nursing and Emergency staff")}
            onClick={() => setStaffMessageOpen(true)}
            style={{
              flex: "0 0 auto",
              padding: "1px 12px",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: "18px",
              color: "#ffffff",
              backgroundColor: "#0d6efd",
              border: "1px solid #0a58ca",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            {t("MSG")}
          </button>

          <div
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              overflow: "hidden",
              height: "20px",
              padding: "0 8px",
              borderRadius: "3px",
              backgroundColor: staffMessages.length ? "#fff3cd" : "transparent",
              border: staffMessages.length ? "1px solid #ffe69c" : "1px solid transparent",
            }}
          >
            {staffMessages.length ? (
              <marquee scrollamount="4" behavior="scroll" direction="left">
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#664d03", lineHeight: "18px" }}>
                  {staffMessages
                    .map((m) => `${m?.MessageFor ? `[${m.MessageFor}] ` : ""}${m?.Message ?? ""}`)
                    .join("     •     ")}
                </span>
              </marquee>
            ) : (
              <span className="text-muted" style={{ fontSize: "11px", lineHeight: "18px" }}>
                {t("No message for staff")}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {membershipCardInfo && (
        <div className="row mx-0 mb-2">
          <MembershipCardBanner
            cardInfo={membershipCardInfo}
            onClick={() => setMembershipCardOpen(true)}
          />
        </div>
      )}

      {isStaffMessageShow && staffMessageOpen ? (
        <IPDStaffMessageModal
          transactionId={staffMessageTransID}
          patientName={data?.patientName || data?.PatientName || data?.PName}
          onClose={() => setStaffMessageOpen(false)}
          onSaved={loadStaffMessages}
        />
      ) : null}

      {showPatientRemarks && remarksPatientID && (
        <Modal
          visible={showPatientRemarks}
          setVisible={setShowPatientRemarks}
          modalWidth={"50vw"}
          Header={t("Patient Remarks")}
          footer={<></>}
        >
          <PatientRemarksModal
            patientId={remarksPatientID}
            remarks={patientRemarks}
            onSaved={setPatientRemarks}
          />
        </Modal>
      )}
      <div className="card">
        <Heading
          title={<div>{t("Patient Bill Details")}</div>}
          secondTitle={
            <>
              <span
                id="RefreshIcon"
                style={{ cursor: "pointer", marginRight: "10px" }}
                onClick={() => handleRefreshPage()}
              >
                {" "}
                <RefreshIconSVG />
              </span>
              {remarksPatientID && (
                <button
                  className="btn btn-success btn-sm px-3 mr-2"
                  type="button"
                  onClick={() => setShowPatientRemarks(true)}
                >
                  <b
                    style={{
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
              {isShowUserRemarks && (
                <button
                  className="btn btn-sm btn-primary mr-2"
                  onClick={() =>
                    handleModalState(
                      true,
                      t("User Remarks"),
                      <UserRemarkModal
                        pateintDetails={pateintDetails}
                        handleModalState={handleModalState}
                        GetBindBillDepartment={GetBindBillDepartment}
                      />,
                      "50vw",
                      <></>,
                    )
                  }
                >
                  {t("User Remarks")}
                </button>
              )}
              {!isBillViewOnly && (
              <button
                className="btn btn-sm btn-primary mr-2"
                onClick={() =>
                  handleModalState(
                    true,
                    t("Billing Remarks"),
                    <BiilingRemarkModal
                      pateintDetails={pateintDetails}
                      TransactionID={data?.transactionID || data?.TransactionID}
                      handleModalState={handleModalState}
                      // after a save: refresh the bill and the Billing Remarks count
                      GetBindBillDepartment={() => {
                        GetBindBillDepartment();
                        loadBillingRemarkCount();
                      }}
                    />,
                    "50vw",
                    <></>,
                  )
                }
              >
                <b
                  style={{
                    color: billingRemarkCount > 0 ? "#FFD700" : undefined,
                    animation: billingRemarkCount > 0 ? "blinking 1s infinite" : "none",
                  }}
                >
                  {t("Billing Remarks")}
                  {billingRemarkCount > 0 ? ` (${billingRemarkCount})` : ""}
                </b>
              </button>
              )}

              {!isBillViewOnly && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() =>
                  handleModalState(
                    true,
                    t("Discount On Bill"),
                    <PatientBillingDiscountModal
                      data={{
                        ...pateintDetails,
                        DiscPer: BillDetails?.DiscountOnBillPer || "0.00",
                        DiscAmt: BillDetails?.DiscountOnBill || "0.00",
                        DiscountReason: BillDetails?.DiscountOnBillReason || "",
                        DiscountApprovedBy:
                          BillDetails?.DiscountApprovedBy || "",
                        DiscountProID: BillDetails?.DiscountProID || 0,
                        DiscountProName: BillDetails?.DiscountProName || "",
                        TransactionID:
                          data?.transactionID || data?.TransactionID,
                        NetAmount: BillDetails?.NetAmount || "0.00",
                        GrossBillAmount: BillDetails?.GrossBillAmount || "0.00",
                      }}
                      handleModalState={handleModalState}
                      GetBindBillDepartment={GetBindBillDepartment}
                      GetBindBillDetails={GetBindBillDetails}
                      isShowDiscountCategoryField={isShowDiscountCategoryField}
                    />,
                    "50vw",
                    <></>,
                  )
                }
              >
                {t("Discount On Bill")}
              </button>
              )}
              <button
                className="btn btn-sm btn-info ml-2"
                onClick={handleLabRadiologyReport}
              >
                {t("Lab & Radiology Report")}
              </button>
            </>
          }
        />
        <div className="row m-2">
          {handleDataInDetailView?.map((data, index) => (
            <>
              <div
                className="col-9inrow"
                key={index}
                style={{
                  display: "grid",
                  alignItems: "center",
                }}
              >
                <div
                  className="d-flex align-items-center"
                  style={{ position: "relative" }}
                >
                  {data?.icons}
                  <LabeledInput
                    label={t(data?.label)}
                    value={formatCurrency(
                      data?.value ? data?.value : "0",
                      data?.Currency
                        ? data?.Currency
                        : localdata?.centreCurrency,
                    )}
                    className={"w-100"}
                    // valueClassName="red"
                    style={{
                      textAlign: "right",
                      color: "red",
                      ...(showBillAmounts
                        ? {}
                        : { filter: "blur(5px)", userSelect: "none" }),
                    }}
                  />
                  {data?.action ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "100%",
                        marginLeft: "6px",
                        zIndex: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {data.action}
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          ))}
        </div>
      </div>
      <div className="card patient_registration border mt-2">
        <div className="card card_background">
          <Heading
            title={<div>{t("Department Details")}</div>}
            secondTitle={
              <>
                {/* Add Services aur uske bagal wale saare icon (Set Rate, Set
                    Discount, Quantity, Rejection Reason, Package, Payable,
                    Non-Payable) bill ko badalte hain, isliye finalize ke baad
                    poora ye hissa hat jaata hai. */}
                {!isBillViewOnly && (
                  <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleSlideScreen(data)}
                >
                  {t("Add Services")}
                </button>
                <button
                  className="btn btn-sm btn-primary ml-1"
                  disabled={sendingProvSms}
                  onClick={handleSendProvisionalBillSms}
                >
                  {t(sendingProvSms ? "Sending..." : "Prov. SMS Send")}
                </button>
                {iconElements.map((item, index) => (
                  <div key={index} style={{ display: "inline-block" }}>
                    <Tooltip
                      target={`#icon-${index}`}
                      content={t(item.tooltipText)}
                      event="hover"
                      position="top"
                    />
                    <span
                      id={`icon-${index}`}
                      onClick={item.onClick ? item.onClick : null}
                    >
                      <item.Component />
                    </span>
                  </div>
                ))}
                  </>
                )}
              </>
            }
          />
          {/* <div className="d-flex align-items-center justify-content-end p-1">
            {iconElements.map((item, index) => (
              <div key={index} style={{ display: "inline-block" }}>
                <Tooltip
                  target={`#icon-${index}`}
                  content={t(item.tooltipText)}
                  event="hover"
                  position="top"
                />
                <span
                  id={`icon-${index}`}
                  onClick={item.onClick ? item.onClick : null}
                >
                  <item.Component />
                </span>
              </div>
            ))}
          </div> */}
          <div className="row p-2">
            <div className="col-12">
              <BillingDepartmentDetailTable
                thead={thead}
                tbody={departmentTableRows}
                isLabStatusColourAllowed={IsLabStatusColourAllowed}
              />
            </div>
          </div>
        </div>
      </div>

      <SlideScreen
        visible={slideScreenState?.show}
        setVisible={() => {
          // Read before the state is cleared: a frame can ask to be told when the
          // user dismisses it, which is how Add Surgery gets its modal back.
          const onClose = slideScreenState?.onClose;
          setSlideScreenState({
            show: false,
            name: "",
            component: null,
          });
          if (typeof onClose === "function") {
            onClose();
          }
        }}
        Header={slideScreenState?.name}
      >
        {slideScreenState?.component}
      </SlideScreen>

      <Modal
        Header={modalState?.name}
        modalWidth={modalState?.size}
        visible={modalState?.show}
        setVisible={() => {
          handleModalState(false, null, null, null, <></>);
          if (advanceOpenRef.current) {
            advanceOpenRef.current = false;
            GetBindBillDetails();
          }
        }}
        footer={modalState?.footer}
      >
        {modalState?.component}
      </Modal>

      {membershipCardOpen && (
        <MembershipCardModal
          visible={membershipCardOpen}
          setVisible={setMembershipCardOpen}
          uhid={
            data?.patientID ||
            data?.PatientID ||
            pateintDetails?.PatientID ||
            pateintDetails?.patientID
          }
          cardInfo={membershipCardInfo}
          cardNo={
            pateintDetails?.MemberShipCardNo || data?.MemberShipCardNo || ""
          }
        />
      )}
    </>
  );
};

export default PatientBilling;
