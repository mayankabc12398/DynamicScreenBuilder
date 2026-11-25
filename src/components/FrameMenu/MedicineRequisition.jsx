import React, { useEffect, useRef, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import MedicineIndentTable from "../UI/customTable/billings/MedicineIndentTable";
import Modal from "../modalComponent/Modal";
import IndentMedicine from "../modalComponent/Utils/IndentMedicine";
import { MEALOPTIONS, TypeOptions } from "../../utils/constant";
import TimePicker from "../formComponent/TimePicker";

import {
  BillingSaveSaveServicesBilling,
  BindCategory,
  BindDepartments,
  BindOtIndent,
  BindRequisitionType,
  BindRoute,
  BindStoreDepartment,
  BindSubcategory,
  CommonReceiptPdf,
  GetAllAuthorization,
  getAlreadyPrescribeItem,
  GetApproval,
  getCTBRequestDetail,
  GetTimeDuration,
  handleValidateUserToBill,
  IPDAdvanceBindPatientDetails,
  MedBindDetails,
  SaveInvestigationRequisition,
  SaveRequisition,
  SaveReturnReuisition,
  UpdateApproval,
} from "../../networkServices/BillingsApi";
import SearchByMedicineItemName from "../commonComponents/SearchByMedicineItemName";
import {
  bindHashCode,
  GetBindDoctorDept,
} from "../../networkServices/opdserviceAPI";
import { handleReactSelectDropDownOptions, notify } from "../../utils/utils";
import { useLocation } from "react-router-dom";
import MedicineReturnTable from "../UI/customTable/billings/MedicineReturnTable";
import MedicineInvestigationTable from "../UI/customTable/billings/MedicineInvestigationTable";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import RequestApprovalModal from "../modalComponent/Utils/patientBillingModal/RequestApprovalModal";
import moment from "moment";
import { GetBindResourceList } from "../../store/reducers/common/CommonExportFunction";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import ViewReqTable from "../UI/customTable/requisitionTable/ViewReqTable";
import {
  getBindDetails,
  PrintRequisition,
} from "../../networkServices/InventoryApi";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import CTBModal from "../modalComponent/Utils/CTBModal";
import { RedirectURL } from "../../networkServices/PDFURL";
import { translateOptions } from "@components/WrapTranslate";
import { isIndentWiseMedicineOPDReturnEnabled } from "../../utils/indentWiseMedicineOPDReturn";

const MedicineRequisition = ({ data, item, preSelectedItems }) => {
  /* Bill finalize ho chuka hai ya nahi.

     fin_global_resources -> BillFinalizedOpenScreens me is screen ka naam daal dene se
     page finalize ke baad bhi khulta hai (BillLockGate dekhiye), par khulna aur badalna
     ek baat nahi: bill band ho chuka hai, to usme ab na dawa jodi jaani chahiye na
     wapas li jaani chahiye. Isliye page padhne ke liye khula rehta hai aur likhne wale
     do button band ho jaate hain.

     Wahi strict test jo BillLockGate karta hai - string "1" - taaki dono ek hi baat
     kahein aur koi screen aise hi band na hone lage. */
  const billLocked = data?.isBilledClosed === "1";

  // The frame menus hand this screen the patient in different casings - patientID
  // from the emergency list, PatientID from the billing/IPD menus - so the ids are
  // resolved once here. Reading only one casing left the indent saving a blank
  // patient whenever it was opened from the other menu.
  const patientIdValue = String(
    data?.patientID ?? data?.PatientID ?? data?.patientId ?? "",
  );
  const transactionIdValue = Number(
    data?.transactionID ?? data?.TransactionID ?? data?.transactionId ?? 0,
  );
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const filterData =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item.Name === "IsMedicalStoreShow");
  const medicalStoreValue = filterData?.Value;
  /* Indent-wise medicine work, fin_global_resources 'IsIndentWiseMedicineOPDReturn'.
     Off (Value 0, or no row at all) this screen drops the "Issued From" column and
     the issueSource it reports, exactly as before the feature landed.

     "Other Medicine" is NOT gated: nursing must be able to request an item the
     master does not carry whatever this key says. */
  const indentWiseOPDReturn = isIndentWiseMedicineOPDReturnEnabled(GetGlobalResources);
  const [t] = useTranslation();
  const location = useLocation();
  const localData = useLocalStorage("userData", "get");
  const dispatch = useDispatch();
  const { BindResource } = useSelector((state) => state?.CommonSlice);
  const [DropDownState, setDropDownState] = useState({
    requisition: [],
    Department: [],
    doctor: [],
    category: [],
    subcategory: [],
    RouteList: [],
    times: [],
  });
  const [errors, setErrors] = useState({});
  const [ItemIndexValue, setItemIndexValue] = useState({});
  const [tableData, setTableData] = useState([]);
  const [MedReturnItems, setMedReturnItems] = useState([]);
  const [pateintDetails, setPatientDetails] = useState({});
  const [CTBList, setCTBList] = useState([]);
  const [Authorization, setAuthorization] = useState({});
  const [bindApprovalList, setBindApprovalList] = useState([]);
  const [list, setList] = useState([]);
  // Starts on the Type the screen opens with (initialState.Type = "MI"). It used to start on "SE",
  // so a Medicine Issue saved without touching Type reloaded the Service list and showed nothing.
  const [statusType, setStatusType] = useState("MI");
  const [returnDept, setReturnDept] = useState([]);

  const initialState = {
    Type: "MI",
    RequestType: "",
    department: filterData?.Value??"",
    payload: "",
    Category: { lable: "All", value: "0" },
    SubCategoryID: { lable: "All", value: "0" },
    itemName: "",
    DoctorID: data?.doctorID,
    Dose: "",
    Times: "",
    Duration: "",
    Route: "",
    Meals: "",
    Quantity: "",
    Remarks: "",
    isDischargeMedicine: "",
    otType: {},
    // Nursing can request a medicine the item master does not carry. The row is
    // then saved with itemID 0 and the typed text as its name.
    isOtherMedicine: 0,
  };
  const [payload, setPayload] = useState({ ...initialState });
  const [modalData, setModalData] = useState({
    visible: false,
    component: null,
    size: null,
    Header: null,
    setVisible: false,
    prescription: null,
  });
  useEffect(() => {
    if (medicalStoreValue) {
      const selectedDepartment =
        payload?.Type === "MI"
          ? DropDownState?.Department?.find(
              (val) => val?.value == medicalStoreValue,
            ) ?? ""
          : returnDept?.find((val) => val?.value == medicalStoreValue) ?? "";

      setPayload((prev) => {
        const prevDepartmentValue =
          typeof prev?.department === "object"
            ? prev?.department?.value
            : prev?.department;
        const nextDepartmentValue =
          typeof selectedDepartment === "object"
            ? selectedDepartment?.value
            : selectedDepartment;

        if (prevDepartmentValue == nextDepartmentValue) {
          return prev;
        }

        return { ...prev, department: selectedDepartment };
      });
    }
  }, [medicalStoreValue, DropDownState?.Department, returnDept, payload?.Type]);

  // Medicine Issue opens with the ward's usual pharmacy already chosen. The name comes from
  // fin_global_resources 'DefaultRequisitionDepartment' and falls back to IPD PHARMACY.
  // IsMedicalStoreShow, when a client sets it, still wins. The Search Item list then shows
  // the medicines of whatever department is selected.
  const defaultRequisitionDepartment =
    (Array.isArray(GetGlobalResources) &&
      GetGlobalResources?.find(
        (item) => item?.Name === "DefaultRequisitionDepartment",
      )?.Value) ||
    "IPD PHARMACY";
  useEffect(() => {
    if (medicalStoreValue || payload?.Type !== "MI" || payload?.department) return;
    const match = DropDownState?.Department?.find(
      (val) =>
        String(val?.label || "").trim().toLowerCase() ===
        String(defaultRequisitionDepartment).trim().toLowerCase(),
    );
    if (match) {
      setPayload((prev) =>
        prev?.department ? prev : { ...prev, department: match.value },
      );
    }
  }, [DropDownState?.Department, payload?.Type, payload?.department, defaultRequisitionDepartment]);
  useEffect(() => {
    dispatch(GetBindResourceList());
  }, []);
  const GetBindApproval = async () => {
    try {
      const TID = data?.transactionID
        ? data?.transactionID
        : data?.TransactionID;

      const response = await GetApproval(TID);
      if (response?.success) {
        setBindApprovalList(
          response?.data?.filter((val) => val?.IsApproved === 0),
        );
      } else {
        setBindApprovalList([]);
      }
      // if (response?.data?.length === 0) {
      //   notify("No Records Found", "error");
      // }
    } catch (error) {
      console.error("Error fetching CBT request details:", error);
    }
  };
  const GetBindAuthorization = async () => {
    try {
      const response = await GetAllAuthorization();
      setAuthorization(response?.data[0]);
    } catch (error) {
      console.log(error);
    }
  };
  const handlePackageDetails = (prescription, size) => {
    setModalData({
      visible: true,
      prescription: prescription,
      component: <IndentMedicine pateintDetails={pateintDetails} />,
      size: "40vw",
      Header: t("Medicine_Set_And_Indent_Medicine"),
      setVisible: false,
    });
  };
  const ip = useLocalStorage("ip", "get");
  const handleBillingSaveSaveServicesBilling = async () => {
    const hashcode = await bindHashCode();
    try {
      const UpdatedItem = [];
      bindApprovalList?.forEach((ele) => {
        if (ele?.IsApproved === 1) {
          UpdatedItem.push(ele);
        }
      });

      const data = {
        typeOfTnx: String(UpdatedItem[0]?.TypeOfTnx),
        grossAmount: Number(UpdatedItem[0]?.GrossAmount),
        // grossAmount: Number(UpdatedItem[0]?.Rate * UpdatedItem[0]?.Quantity),
        netAmount: Number(UpdatedItem[0]?.NetAmount),
        // netAmount: UpdatedItem[0]?.NetAmount
        //   ? Number(UpdatedItem[0]?.NetAmount)
        //   : 0,
        discountOnTotal: 0,
        roundOff: 0,
        patientID: String(UpdatedItem[0]?.PatientId),
        panelID: Number(UpdatedItem[0]?.PanelID),
        transactionID: Number(UpdatedItem[0]?.TransactionID),
        uniqueHash: String(hashcode?.data),
        patientType: String(UpdatedItem[0]?.Patient_Type),
        discountApproveBy: String(UpdatedItem[0]?.DiscountApprovedBy),
        discountReason: String(UpdatedItem[0]?.DiscountReason),
      };
      const dataLTDList = UpdatedItem?.map((ele) => ({
        entryDate: moment(new Date()).format("YYYY-MM-DD"),
        itemID: String(ele?.ItemID),
        subCategoryID: String(ele?.SubCategoryID),
        rate: String(ele?.Rate),
        quantity: String(ele?.Quantity),
        discountPercentage: Number(ele?.DiscountPercentage),
        isPayable: Number(ele?.Ispayable),
        configID: String(ele?.ConfigID),
        coPayPercent: String(ele?.CoPayPercent),
        itemName: String(ele?.ItemName),
        doctorID: Number(ele?.DoctorID),
        ipdCaseTypeID: Number(ele?.IPDCaseTypeID),
        rateListID: Number(ele?.RateListID),
        rateItemCode: String(ele?.rateItemCode),
        roomID: Number(ele?.RoomID),
        typeOfTnx: String(ele?.TypeOfTnx),
        igstPercent: String(ele?.IGSTPercent),
        cgstPercent: String(ele?.CGSTPercent),
        sgstPercent: String(ele?.SGSTPercent),
        hsnCode: "",
        gstType: String(ele?.GSTType),
        pageName: location?.pathname ? String(location?.pathname) : "",
      }));
      const PLIList = UpdatedItem?.map((ele) => ({
        isSampleCollected: String(ele?.IsSampleCollected),
        investigation_ID: String(ele?.Investigtaion_ID),
        remarks: String(ele?.Remark),
        isUrgent: Number(ele?.IsUrgent),
        currentAge: String(ele?.CurrentAge),
        isOutSource: Number(ele?.IsOutSource),
        outSourceLabID: Number(ele?.OutSourceLabID),
        scRequestdatetime: String(ele?.RequestDateTime),
      }));
      const requestBody = {
        dataLT: data,
        dataLTD: dataLTDList,
        pli: PLIList,
        patientTypeID: "",
        membershipNo: "",
        ipAddress: ip,
      };

      const response = await BillingSaveSaveServicesBilling(requestBody);

      notify(response?.message, response?.success ? "success" : "error");
      // if (response?.success) handleSaveAddItemSuccessfully();
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };
  const handleApprovalDetails = (prescription, size) => {
    setModalData({
      visible: true,
      prescription: prescription,
      component: (
        <RequestApprovalModal
          bindApprovalList={bindApprovalList}
          setBindApprovalList={setBindApprovalList}
        />
      ),
      size: "80vw",
      Header: t("Approval Request"),
      setVisible: false,
      footer: (
        <button className="btn btn-sm btn-success" onClick={handleApproveItems}>
          {t("Approve")}
        </button>
      ),
    });
    GetBindApproval();
  };

  const handleApproveItems = async () => {
    const UpdatedItem = [];
    bindApprovalList?.forEach((ele) => {
      if (ele?.IsApproved === 1) {
        UpdatedItem.push(ele);
      }
    });
    const data = UpdatedItem?.map((ele) => ({
      requestNo: ele?.RequestNo,
      itemID: ele?.ItemID,
    }));

    try {
      const response = await UpdateApproval({ data });
      if (response?.success) {
        notify(response?.message, "success");
        if (BindResource?.IsCTBBillingOnReciept === "0") {
          handleBillingSaveSaveServicesBilling();
        }
        GetBindApproval();
        setModalData({ setVisible: false });
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Error fetching Request details:", error);
    }
  };
  const getBindCTBRequestDetail = async () => {
    try {
      const TransactionID = data?.transactionID || data?.TransactionID;
      const RequestType = "SE";
      const response = await getCTBRequestDetail(TransactionID, RequestType);
      if (response?.success) {
        let data = response?.data?.map((val) => {
          val.isChecked = false;
          return val;
        });
        setCTBList(data);
      } else {
        setCTBList([]);
      }
      // if (response?.data?.length === 0) {
      //   notify("No Records Found", "error");
      // }
    } catch (error) {
      console.error("Error fetching CBT request details:", error);
    }
  };

  const AddItemHead = [
    t("sn"),
    t("Code"),
    t("Item_Name"),
    t("Dose"),
    t("Time"),
    t("Duration"),
    t("Route"),
    t("Meals"),
    t("Quantity"),
    t("Remarks"),
    t("Remove"),
  ];
  const AddInvestigationItemHead = [
    t("Code"),
    t("Item_Name"),
    t("Payable"),
    t("Date"),
    t("Remarks"),
    t("Rate"),
    t("Quantity"),
    t("Discount"),
    t("Amount"),
    t("Remove"),
  ];
  const AddMedReturnHead = [
    t("Code"),
    t("Item_Name"),
    /* The same item can be in hand from two places at once: units billed on the
       admission ("Save in Hospital") and units billed by the pharmacy ("Save in
       Pharmacy"). They are returned down different paths, so they are listed as
       separate rows and the source is named rather than left to be guessed.

       This head and MedicineReturnTable's IssuedFrom cell are switched by the one
       flag: <Tables> pairs heads with row keys by position, so dropping one of the
       two would shift every column after it. */
    ...(indentWiseOPDReturn ? [t("Issued From")] : []),
    t("Available Qty."),
    t("Indented Qty."),
    t("MRP"),
    t("Quantity"),
    t("Remarks"),
    // t("Discount"),
    // t("Amount"),
    t("Select"),
  ];

  const handleConfirm = (name, value) => {
    setPayload((val) => ({ ...val, [name]: value?.value }));
    setModalData((val) => ({ ...val, visible: false }));
  };

  const getOTItem = async (id) => {
    try {
      const response = await BindOtIndent(id);
      if (response?.success) {
        const sharedItems = response?.data || [];

        const newRows = sharedItems.map((shareItem) => ({
          ...shareItem, // response.data.share ka ek item

          DoctorID: data?.doctorID,
          Type: "MI",
        }));

        setTableData([]);
        notify(response?.message, "success");
      } else {
        setTableData([]);
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleReactSelect = (name, value) => {
    if (name === "Times" || (name === "Duration" && payload?.Dose)) {
      if (name === "Times" && payload?.Duration) {
        setPayload((val) => ({
          ...val,
          ["Quantity"]:
            Number(payload?.Dose) * value?.value * payload?.Duration,
        }));
      } else if (payload?.Times) {
        setPayload((val) => ({
          ...val,
          ["Quantity"]: Number(payload?.Dose) * value?.value * payload?.Times,
        }));
      }
    }

    if (name === "Type" && tableData?.length > 0) {
      setModalData({
        visible: true,
        component: (
          <div className="text-center">
            <label className="text-danger bold">{t("Are You Sure!")} </label>
            <br />
            <label>{t("You Want to Change Type")}</label>
          </div>
        ),
        size: "20vw",
        Header: t("Confirmation"),
        setVisible: false,
        footer: (
          <button
            className="btn btn-sm btn-success"
            onClick={() => {
              handleConfirm(name, value);
            }}
          >
            {t("Confirm")}
          </button>
        ),
      });

      // setPayload((val) => ({ ...val, [name]: value?.value }));
    } else if (name === "Type") {
      setPayload((val) => ({ ...val, [name]: value?.value }));
      setStatusType(value?.value ? value?.value : "SE");
      handleCallViewMedReq("Open", value?.value);
    } else {
      setPayload((val) => ({ ...val, [name]: value?.value }));
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (name === "Dose" && payload?.Times && payload?.Duration) {
      setPayload((val) => ({
        ...val,
        ["Quantity"]: Number(value) * payload?.Times * payload?.Duration,
      }));
    }
    setPayload((val) => ({
      ...val,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const GetMedBindDetails = async (dept) => {
    try {
      const response = await MedBindDetails(
        dept ? dept : payload?.department,
        data?.transactionID || data?.TransactionID,
      );
      if (response?.success) {
        setMedReturnItems(response?.data);
      } else {
        setMedReturnItems([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   GetMedBindDetails();
  // }, [payload?.Type === "MR"]);

  const GetBindRequisitionType = async () => {
    try {
      const data = await BindRequisitionType();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };
  const getBindStoreDepartment = async () => {
    try {
      const data = await BindStoreDepartment();
      const newdata = data?.data.filter(
        (ele) => ele.LedgerNumber !== localData?.deptLedgerNo,
      );
      return newdata;
    } catch (error) {
      console.error(error);
    }
  };
  const getBindCategory = async () => {
    try {
      const data = await BindCategory(12);
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };
  const getBindSubcategory = async () => {
    try {
      const data = await BindSubcategory();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };
  const getBindDepartments = async () => {
    const TratransactionID = data?.transactionID || data?.TransactionID;
    try {
      const response = await BindDepartments(TratransactionID);
      if (response?.success) {
        setReturnDept(response?.data);
      } else {
        setReturnDept([]);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const getBindRoute = async () => {
    try {
      const data = await BindRoute();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };
  const GetBindTimeDuration = async () => {
    try {
      const data = await GetTimeDuration();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const handleOtherMedicineName = (e) => {
    const typed = e.target.value;
    setItemIndexValue({});
    setPayload((prev) => ({
      ...prev,
      itemName: typed ? { label: typed, value: "0" } : "",
    }));
  };

  // Clearing the box has to clear the item too, otherwise a name picked from the
  // master would survive the switch into free text and be saved with its old id.
  const handleOtherMedicineToggle = (e) => {
    const on = e.target.checked ? 1 : 0;
    setItemIndexValue({});
    setPayload((prev) => ({ ...prev, isOtherMedicine: on, itemName: "" }));
  };

  const handleItemSelect = (label, value, val, type, e) => {
    setItemIndexValue(val);
    setPayload({
      ...payload,
      itemName: {
        label: label,
        value: value,
      },
    });
    // if (type === "keydown") {
    // AddRowData({ ...payload, itemName: { label: label, value: value, } })
    // }
    // Medicine picked: the cursor goes straight to Quantity
    setTimeout(() => document.getElementById("Quantity")?.focus(), 150);
  };

  // Tab out of Search Item lands on Quantity (the Other Medicine tick-box is skipped)
  const handleSearchItemTab = (e) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    if (!e.target?.closest?.(".p-autocomplete")) return;
    const qty = document.getElementById("Quantity");
    if (!qty) return;
    e.preventDefault();
    qty.focus();
  };

  const handleIPDAdvanceBindPatientDetails = async (
    patientID,
    transactionID,
  ) => {
    try {
      const response = await IPDAdvanceBindPatientDetails(
        patientID,
        transactionID,
      );
      setPatientDetails(response?.data[0]);
    } catch (error) {
      console.log(error, "Somthing Went Wrong");
    }
  };

  const getBindAlreadyPrescribeItem = async () => {
    const PatientID = pateintDetails?.PatientID;
    const ItemID = payload?.itemName?.value?.split("#")[0];
    try {
      const response = await getAlreadyPrescribeItem(PatientID, ItemID);
      setTableData(response?.data[0]);
    } catch (error) {
      console.log(error, "Somthing Went Wrong");
    }
  };

  // const handleReactSelectItem = (name, value) => {
  //   setPayload((val) => ({ ...val, [name]: value }));
  // };
  const handleReactSelectItem = (name, value) => {
    if (name === "Category") {
      const filtered =
        value.value === "0"
          ? masterSubcategory
          : masterSubcategory.filter(
              (item) => String(item.categoryID) === String(value.value),
            );

      setDropDownState((st) => ({
        ...st,
        subcategory: [
          { label: t("All"), value: "0" },
          ...handleReactSelectDropDownOptions(
            filtered,
            "name",
            "subCategoryID",
          ),
        ],
      }));

      setPayload((s) => ({
        ...s,
        Category: value,
        SubCategoryID: { label: "All", value: "0" },
      }));

      return;
    }

    if (name === "SubCategoryID") {
      setPayload((s) => ({ ...s, SubCategoryID: value }));
      return;
    }

    setPayload((s) => ({ ...s, [name]: value }));
  };

  const handleReactOTChange = (name, value) => {
    setPayload((val) => ({ ...val, [name]: value }));
    getOTItem(value?.value);
  };

  const handleReactSelectChange = async (name, e) => {
    switch (name) {
      case "department":
        const data = await GetMedBindDetails(e.value);
        // setDoctor(data[0]);
        setPayload({
          ...payload,
          [name]: e.value,
        });
        break;
      default:
        setPayload({
          ...payload,
          [name]: e.value,
        });
        break;
    }
  };

  const handleDoctorDeptWise = async () => {
    const Department = "All";
    try {
      const data = await GetBindDoctorDept(Department);
      return data?.data;
    } catch (error) {
      console.log(error);
    }
  };

  const FetchAllDropDown = async () => {
    try {
      const [
        BindCategory,
        BindSubcategory,
        BindRoute,
        BindTimeDuration,
        RequisitionType,
        DoctorDeptWise,
        StoreDepartment,
      ] = await Promise.all([
        getBindCategory(),
        getBindSubcategory(),
        getBindRoute(),
        GetBindTimeDuration(),
        GetBindRequisitionType(),
        handleDoctorDeptWise(),
        getBindStoreDepartment(),
      ]);

      const dropDownData = {
        category: [
          { label: t("All"), value: "0" },
          ...handleReactSelectDropDownOptions(
            BindCategory,
            "name",
            "categoryID",
          ),
        ],
        subcategory: [
          { label: t("All"), value: "0" },
          ...handleReactSelectDropDownOptions(
            BindSubcategory,
            "name",
            "subCategoryID",
          ),
        ],
        RouteList: handleReactSelectDropDownOptions(BindRoute),
        times: handleReactSelectDropDownOptions(
          BindTimeDuration,
          "NAME",
          "Quantity",
        ),

        // This page offers Normal / Discharge / Regular (f_typemaster also holds types used by other
        // screens). If none of them is in the master yet, the full list shows as before.
        requisition: (() => {
          // "Normal" (TypeID 1) is shown - and saved - as "New"; the ID is unchanged, so the
          // IsUrgent rule (TypeID 1) keeps working. f_typemaster is renamed by
          // DBScripts/2026-10-22_RequisitionType_Normal_to_New.sql; until then the label is mapped here.
          const all = handleReactSelectDropDownOptions(RequisitionType, "TypeName", "TypeID").map((o) =>
            String(o?.label || "").trim().toLowerCase() === "normal" ? { ...o, label: "New" } : o,
          );
          const order = ["new", "discharge", "regular"];
          const key = (o) => String(o?.label || "").trim().toLowerCase();
          const wanted = all
            .filter((o) => order.includes(key(o)))
            .sort((a, b) => order.indexOf(key(a)) - order.indexOf(key(b)));
          return wanted.length ? wanted : all;
        })(),
        doctor: handleReactSelectDropDownOptions(
          DoctorDeptWise,
          "Name",
          "DoctorID",
        ),

        Department: handleReactSelectDropDownOptions(
          StoreDepartment,
          "LedgerName",
          "LedgerNumber",
        ),
      };

      setDropDownState(dropDownData);
      setMasterSubcategory(BindSubcategory);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const [masterSubcategory, setMasterSubcategory] = useState([]);
  const sendReset = () => {
    // setPayload({
    //   itemName: "",
    // });
    setAddList([]);
    setTableData([]);
  };

  useEffect(() => {
  
    FetchAllDropDown();
    GetBindApproval();
    GetBindAuthorization();
  }, []);
  useEffect(() => {
    if (payload?.department){
      handleIPDAdvanceBindPatientDetails(
      data?.patientID || data?.PatientID,
      data?.transactionID || data?.TransactionID,
    );
    }
      
  }, [payload?.department]);

  const ErrorHandling = (data) => {
    let errors = {};
    if (data?.Type == "MI") {
      if (!data?.DoctorID) {
        errors.DoctorID = "DoctorID Is Required";
      }
    }
    if (!data?.itemName?.label) {
      errors.itemName = "Item Name Is Required";
    }

    if (data?.Type == "MI") {
      if (!Number(data?.Quantity)) {
        errors.Quantity = "Quantity Is Required";
      }
    }
    if (data?.Type == "MI") {
      if (!data?.department) {
        errors.department = "Department Is Required";
      }
    }
    // Requisition Type mandatory for Medicine Issue (MI) and Medicine Return (MR)
    if (data?.Type == "MI" || data?.Type == "MR") {
      const reqTypeValue =
        typeof data?.RequestType === "object"
          ? data?.RequestType?.value
          : data?.RequestType;
      if (!reqTypeValue) {
        errors.RequestType = "Requisition Type Is Required";
      }
    }
    return errors;
  };
  const [addList, setAddList] = useState([]);

  // After an item is added the cursor goes back to Search Item, ready for the next medicine
  // Scoped to this screen's own wrapper: the sidebar Menu Search also uses id="searchtest",
  // so a bare #searchtest lookup lands on the menu box instead.
  // View Requisition stays closed until the heading (or a status colour) is clicked
  const [showViewReq, setShowViewReq] = useState(false);

  const focusSearchItem = () =>
    setTimeout(
      () => document.querySelector("#medReqSearchItem input")?.focus(),
      150,
    );

  const AddRowData = (data) => {
    /* Same rule as the button above: a finalized bill takes no new item. */
    if (billLocked) {
      notify(t("Bill is finalized - no new item can be added"), "warn");
      return;
    }
    const customerrors = ErrorHandling(data);
    if (Object.keys(customerrors)?.length > 0) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[0], "error");
        setErrors(customerrors);
      }
      return;
    }
    const isDuplicate = tableData?.find((val) =>
      data?.isOtherMedicine
        ? String(val?.itemID) === "0" &&
          String(val?.itemName || "").trim().toLowerCase() ===
            String(data?.itemName?.label || "").trim().toLowerCase()
        : val?.itemID === data?.itemName?.value,
    );
    if (isDuplicate) {
      notify(t("Item Name already exist"), "error");
      return;
    }

    if (payload?.Type === "SE") {
      const ServiceRow = {
        ...ItemIndexValue,
        itemName: data?.itemName?.label,
        itemId: data?.itemName?.value,
        Payable: ItemIndexValue?.IsPayable,
        Date: moment(new Date()).format("DD-MMM-YYYY"),
        Remarks: data?.Remarks,
        Rate: ItemIndexValue?.Rate,
        Quantity: ItemIndexValue?.Quantity,
        DiscountPer: ItemIndexValue?.DiscountPer,
        Amount: ItemIndexValue?.Rate * ItemIndexValue?.Quantity,
        DoctorID: data?.DoctorID,
      };
      setAddList((prevState) => [...prevState, ServiceRow]);
      setPayload({ ...initialState });
      focusSearchItem();
    } else {
      const scheduledTimes = times
        ?.filter((val) => val)
        ?.map((val) => moment(val).format("HH:mm"))
        .join(",");
        
      const newRow = {
        Type: data?.Type,
        itemID: data?.itemName?.value,
        // keep the whole option { label, value }: the save sends .label (type name) and uses .value
        // (TypeID). The dropdown stores only the TypeID in the form, so it is looked up here.
        RequestType:
          data?.RequestType && typeof data.RequestType === "object"
            ? data.RequestType
            : DropDownState?.requisition?.find(
                (o) => String(o?.value) === String(data?.RequestType ?? ""),
              ) || "",
        department: data?.department,
        SubCategoryID: data?.SubCategoryID,
        itemName: data?.itemName?.label,
        Dose: data?.Dose,
        Times: data?.Times,
        Duration: data?.Duration,
        Route: data?.Route,
        Meals: data?.Meals,
        Quantity: data?.Quantity,
        MaxQuantity: Number(data?.Quantity),
        StockQty:
          ItemIndexValue?.AvlQty != null && ItemIndexValue?.AvlQty !== ""
            ? Number(ItemIndexValue.AvlQty)
            : null,
        Remarks: data?.Remarks,
        DoctorID: data?.DoctorID,
        isDischargeMedicine: data?.isDischargeMedicine,
        ScheduledTime: scheduledTimes,
        isOtherMedicine: data?.isOtherMedicine ? 1 : 0,
      };
      setPayload({
        ...initialState,
        Type: payload?.Type,
        department: payload?.department,
        otType: payload?.otType,
        DoctorID: payload?.DoctorID,
        isOtherMedicine: payload?.isOtherMedicine,
      });
      setTableData((prevState) => [...prevState, newRow]);
      focusSearchItem();
    }
  };

  const handleRateItemsChange = (index, name, e, ele) => {
    const data = [...addList];
    data[index][name] = e ? e : e.value;
    setAddList(data);
  };
  const viewReqSeqRef = useRef(0);
  const handleCallViewMedReq = async (valstatus = "Open", val) => {
    // const status = valstatus;
    const Type = val ? val : statusType;
    const TID = data?.transactionID ? data?.transactionID : data?.TransactionID;
    // const Dept = localData?.deptLedgerNo;
    if (!TID) return; // patient not bound yet - the effect below loads once it is
    const seq = ++viewReqSeqRef.current;

    try {
      const apiResp = await getBindDetails(TID, Type);
      // A newer load (another Type / status, or the patient changed) started meanwhile: drop this one.
      if (seq !== viewReqSeqRef.current) return;
      const filteredData = apiResp?.data?.filter(
        (item) => item?.StatusNew === valstatus || valstatus === "Open",
      );
      setList(filteredData ? filteredData : apiResp?.data);
      // if (apiResp?.success) {
      //   setList(data);
      // } else {
      //   notify(apiResp?.message, "error")
      // }
    } catch (error) {
      console.log(error, "Somthing Went Wrong");
    }
  };
  let userData = useLocalStorage("userData", "get");
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
        notify(response?.message || "Verification Successful", "success");
        setUserConfirmation(false);
        setShowPassword(false);
        setPassword("");
        handleSaves();
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
    setPassword("");
    if (userData?.validateUserForBill) {
      setUserConfirmation(true);
    } else {
      handleSaves();
    }
  };

  const handleSaves = async () => {
    const zeroQtyRow = tableData?.find((ele) => !Number(ele?.Quantity));
    if (zeroQtyRow) {
      notify(`Please enter quantity for "${zeroQtyRow?.itemName}".`, "error");
      return;
    }
    try {
      const itemList = tableData.map((ele) => ({
        ScheduledTime:
          ele?.ScheduledTime || ele?.scheduledTime || ele?.Scheduledtime || "",
        itemID: ele?.itemID ? Number(ele?.itemID) : 0,
        // itemID: ItemIndexValue?.ItemID ? Number(ItemIndexValue?.ItemID) : 0,
        dose: ele?.Dose ? String(ele?.Dose) : "",
        time: ele?.Times ? String(ele?.Times) : "",
        duration: ele?.Duration ? String(ele?.Duration) : "",
        durationValue: ele?.Duration ? String(ele?.Duration) : "",
        route: ele?.Route ? String(ele?.Route) : "",
        meal: ele?.Meals ? String(ele?.Meals) : "",
        tid: transactionIdValue,
        pid: patientIdValue,
        doc: "",
        lnxNo: "0",
        medicineName: ele?.itemName ? String(ele?.itemName) : "",
        // dept: ele?.department ? String(ele?.department) : "0",
        dept: String(payload?.department?.value?payload?.department?.value:payload?.department) || "0",
        quantity: ele?.Quantity ? Number(ele?.Quantity) : "",
        unitType: "",
        indentType: ele?.RequestType?.label
          ? String(ele?.RequestType?.label)
          : "",
        doctorID: ele?.DoctorID ? Number(ele?.DoctorID) : "",
        ipdCaseTypeID: data?.ipdCaseTypeID ? Number(data?.ipdCaseTypeID) : 0,
        room_ID: 0,
        ledgerTransactionNo: "",
        isAdvance: 0,
        rate: ItemIndexValue?.Rate ? Number(ItemIndexValue?.Rate) : 0,
        discAmt: 0,
        discountPercentage: 0,
        amount: 0,
        subCategoryID: ItemIndexValue?.SubCategoryID
          ? Number(ItemIndexValue?.SubCategoryID)
          : 0,
        itemName: ele?.itemName ? String(ele?.itemName) : "",
        type: ele?.Type ? String(ele?.Type) : "",
        typeID: 0,
        tnxTypeID: Number(ele?.tnxTypeID ? ele?.tnxTypeID : "0"),
        // tnxTypeID: Number(ItemIndexValue?.tnxTypeID?ItemIndexValue?.tnxTypeID:"0"),
        sampleType: ItemIndexValue?.SampleTypeName
          ? String(ItemIndexValue?.SampleTypeName)
          : "",
        rateListID: 0,
        isOutSource: 0,
        rateItemCode: "",
        isCancel: 0,
        pageURL: location?.pathname ? String(location?.pathname) : "",
        patient_Type: data?.patientType ? String(data?.patientType) : "",
        panelID: data?.panelID ? String(data?.panelID) : "",
        coPayPercent: 0,
        remark: ele?.Remarks ? String(ele?.Remarks) : "",
        isUrgent: ele?.RequestType?.value === 1 ? 0 : 1,
        transNo: data?.ipdno ? String(data?.ipdno) : "",
        entryID:
          ele?.entryID || ele?.EntryID || ele?.EntryId
            ? Number(ele?.entryID || ele?.EntryID || ele?.EntryId)
            : 0,
      }));
      const InvestigationitemList = addList.map((ele) => ({
        isAdvance: 0,
        itemID: ele?.ItemID ? Number(ele?.ItemID) : 0,
        rate: ele?.Rate ? Number(ele?.Rate) : 0,
        quantity: ele?.Quantity ? Number(ele?.Quantity) : 0,
        discAmt: (Number(ele?.Rate) * Number(ele?.DiscountPer)) / 100,
        amount:
          Number(ele?.Quantity) * Number(ele?.Rate) -
          (Number(ele?.Rate) * Number(ele?.DiscountPer)) / 100,
        discountPercentage: ele?.DiscountPer ? Number(ele?.DiscountPer) : 0,
        subCategoryID: ele?.SubCategoryID ? Number(ele?.SubCategoryID) : 0,
        tid: Number(data?.transactionID ?? data?.TransactionID ?? 0),

        itemName: ele?.itemName ? String(ele?.itemName) : "",
        doctorID: ele?.DoctorID ? Number(ele?.DoctorID) : 0,
        type: payload?.Type ? String(payload?.Type) : "",
        typeID: ele?.Type_ID ? Number(ele?.Type_ID) : 0,
        tnxTypeID: Number(ele?.tnxTypeID),
        sampleType: ele?.SampleTypeName ? String(ele?.SampleTypeName) : "",
        rateListID: ele?.RateListID ? Number(ele?.RateListID) : 0,
        isOutSource: ele?.IsOutSource ? Number(ele?.IsOutSource) : 0,
        rateItemCode: "",
        coPayPercent: 0,
        ipdCaseTypeID: data?.ipdCaseTypeID ? Number(data?.ipdCaseTypeID) : 0,
        roomID: data?.roomId ? Number(data?.roomId) : 0,
        remark: ele?.Remarks ? String(ele?.Remarks) : "",
        isUrgent: ele?.RequestType?.value === 1 ? 0 : 1,
        // Requisition Type name (Normal / Discharge / Regular) -> f_indent_detail_patient.RequisitionType
        indentType: ele?.RequestType?.label ? String(ele?.RequestType?.label) : "",
        isCancel: 0,
        pageURL: location?.pathname ? String(location?.pathname) : "",
        patientId: patientIdValue,
        patient_Type: data?.patientType ? String(data?.patientType) : "",
        panelID: data?.panelID ? String(data?.panelID) : "",
        transNo: data?.ipdno ? String(data?.ipdno) : "",
        // dept: String(data?.department ? data?.department : "0"),
       dept: String(payload?.department?.value?payload?.department?.value:payload?.department) || "0",
        StoreType: String(ele?.StoreType ? ele?.StoreType : ""),
        StoreTypeID: String(ele?.StoreTypeID ? ele?.StoreTypeID : "0"),
      }));

      // SaveRequisition
      const medicalRequisitionRequestBody = {
        data: itemList,
        isDischargeMedicine: payload?.isDischargeMedicine
          ? payload?.isDischargeMedicine
          : "0",
      };

      // SaveInvestigationRequisition
      const investigationRequisitionRequestBody = {
        requisition: InvestigationitemList,
      };

      if (payload?.Type === "MI") {
        medicalRequisitionRequestBody.TransactionType = "Issue";
        const response = await SaveRequisition(medicalRequisitionRequestBody);
        if (response?.success) {
          // The indent is saved at this point, so the screen is reset and the list
          // reloaded before the print call: a failing print used to throw past these
          // and leave the saved rows sitting in the grid.
          notify(response?.message, "success");
          setPayload({ ...initialState, Type: payload?.Type });
          sendReset();
          setShowViewReq(true);
          await handleCallViewMedReq("Open", payload?.Type || statusType);
          try {
            let apiResp = await PrintRequisition(
              response?.data?.indentNo,
              "Open",
              payload?.Type,
            );
            if (apiResp?.success) {
              RedirectURL(apiResp?.data?.pdfUrl);
            } else {
              notify(apiResp?.message, "error");
            }
          } catch (printError) {
            console.error("Print requisition failed", printError);
            notify("Requisition saved, but print could not be generated", "error");
          }
        } else {
          notify(response?.message, "error");
        }
      } else if (payload?.Type === "SE") {
        const response = await SaveInvestigationRequisition(
          investigationRequisitionRequestBody,
        );
        if (response?.success) {
          notify(response?.message, "success");
          getBindCTBRequestDetail();
          GetBindApproval();
          sendReset();
          await handleCallViewMedReq("Open", payload?.Type || statusType);
        } else {
          notify(response?.message, "error");
        }
      } else {
        notify(t("Invalid Type in payload"), "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };

  const handleRemove = (index) => {
    setAddList((prevState) => prevState.filter((_, i) => i !== index));
  };
  // An added row's quantity can be edited, but never above the stock shown in the
  // item search (AvlQty). Rows without a known stock fall back to the quantity first given.
  const handleTableQtyChange = (index, value) => {
    const row = tableData[index];
    if (!row) return;
    const hasStock = row?.StockQty != null && !Number.isNaN(Number(row.StockQty));
    const max = hasStock ? Number(row.StockQty) : Number(row?.MaxQuantity ?? row?.Quantity);
    if (value !== "") {
      const qty = Number(value);
      // whole units only
      if (!/^[0-9]+$/.test(String(value))) return;
      if (Number.isNaN(qty) || qty < 0) return;
      if (qty > max) {
        notify(
          hasStock
            ? `Quantity cannot be greater than available stock (${max})`
            : `Quantity cannot be greater than the given quantity (${max})`,
          "warn",
        );
        return;
      }
    }
    setTableData((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, Quantity: value === "" ? "" : Number(value) } : r,
      ),
    );
  };
  const handleRemoveIR = (index) => {
    setTableData((prevState) => prevState.filter((_, i) => i !== index));
  };

  const saveReturn = async () => {
    /* The button is disabled, but the save is what actually writes - so the rule lives
       here too. A disabled button is a courtesy; this is the rule. */
    if (billLocked) {
      notify(t("Bill is finalized - nothing can be returned on it"), "warn");
      return;
    }
    if(!payload?.department){
      notify(t("Please select department"), "error");
      return
    }
    try {
      const itemList = MedReturnItems?.filter(
        (ele) => ele.IsChecked === true,
      )?.map((ele) => {
        return {
          ScheduledTime: "",
          itemID: ele?.itemid ? Number(ele.itemid) : 0,
          dose: "",
          time: "",
          duration: "",
          durationValue: "",
          route: "",
          meal: "",
          tid: transactionIdValue,
          pid: patientIdValue,
          doc: "",
          lnxNo: "0",
          // medicine name
          medicineName: ele?.ItemName ? String(ele.ItemName) : "",
          ...(indentWiseOPDReturn
            ? { issueSource: ele?.IssueSource ? String(ele.IssueSource) : "" }
            : {}),
          // dept: payload?.department ? String(payload?.department) : "0",
          dept:String(payload?.department) || "0",
          quantity: ele?.quantity ? Number(ele.quantity) : 0,
          unitType: ele?.UnitType ? String(ele.UnitType) : "",
          indentType: payload?.RequestType ? String(payload?.RequestType) : "",
          doctorID: ele?.DoctorID ? Number(ele.DoctorID) : 0,
          ipdCaseTypeID: data?.ipdCaseTypeID ? Number(data.ipdCaseTypeID) : 0,
          room_ID: 0,
          ledgerTransactionNo: "",
          isAdvance: 0,
          rate: ItemIndexValue?.Rate ? Number(ItemIndexValue.Rate) : 0,
          discAmt: 0,
          discountPercentage: 0,
          amount: 0,
          subCategoryID: ItemIndexValue?.SubCategoryID
            ? Number(ItemIndexValue.SubCategoryID)
            : 0,
          itemName: ele?.ItemName ? String(ele?.ItemName) : "",
          type: "MR",
          typeID: 0,
          tnxTypeID: 0,
          sampleType: "",
          rateListID: 0,
          isOutSource: 0,
          rateItemCode: "",
          isCancel: 0,
          pageURL: location?.pathname ? String(location.pathname) : "",
          patient_Type: "",
          panelID: data?.panelID ? String(data.panelID) : "",
          coPayPercent: 0,
          remark: ele?.Remarks ? String(ele.Remarks) : "",
          isUrgent: 0,
          transNo: data?.ipdno ? String(data.ipdno) : "",
        };
      });
      if(itemList?.length === 0){
        notify(t("Please select atleast one medicine"), "error");
        return
      }
   const invalidIndex = itemList.findIndex((ele) => ele?.quantity == 0);
if (invalidIndex !== -1) {
  notify(
    `Please enter quantity for "${itemList[invalidIndex].itemName}".`,
    "error"
  );
  return;
}
      const medicalRequisitionRequestBody = {
        data: itemList,
        isDischargeMedicine: payload?.isDischargeMedicine
          ? payload?.isDischargeMedicine
          : "0",
        TransactionType: "Return",
      };

      const response = await SaveRequisition(medicalRequisitionRequestBody);

      if (response?.success) {
        notify(response?.message, "success");
        let apiResp = await PrintRequisition(
          response?.data?.indentNo,
          "Open",
          payload?.Type,
        );
        if (apiResp?.success) {
          setPayload({ ...initialState, Type: payload?.Type });
          RedirectURL(apiResp?.data?.pdfUrl);
        } else {
          notify(apiResp?.message, "error");
        }
        await handleCallViewMedReq("Open", payload?.Type || statusType);
        // setPayload({
        //   Doctor: "",
        //   IPDCaseTypeID: "",
        //   RoomBed: "",
        //   BillingCategory: "",
        //   shiftDate: new Date(),
        //   shiftTime: new Date(),
        // });
        setMedReturnItems([]);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };

  // const handleItemsChange = (index, name, e) => {
  //   if(name==="quantity"){
  //     console.log("MedReturnItems",MedReturnItems?.inHandUnits)
  //   }

  //   const data = [...MedReturnItems];
  //   data[index][name] = e ? e : e.value;
  //   setMedReturnItems(data);
  // };
  const handleItemsChange = (index, name, e) => {
    const data = [...MedReturnItems];

    if (name === "quantity") {
      const inputValue = Number(e?.target?.value || e); // e can be direct value or event
      const inHand = Number(
        data[index]?.inHandUnits - data[index]?.IndentQty || 0,
      );

      if (inputValue > inHand) {
        // Optional: Show warning or stop input
        notify(
          `Quantity cannot be greater than In Hand Units (${inHand})`,
          "warn",
        );
        return; // exit without updating
      }

      data[index][name] = inputValue;
      if (Number(inputValue) > 0) {
        data[index]["IsChecked"] = true;
      } else {
        data[index]["IsChecked"] = false;
      }
    } else {
      data[index][name] = e?.value || e;
    }

    setMedReturnItems(data);
  };

  const handleSelect = (e, index, item) => {
    const { name, checked } = e.target;
    const data = [...MedReturnItems];
    data[index][name] = checked;
    setMedReturnItems(data);
  };

  const [times, setTimes] = useState([]);
  useEffect(() => {
    const initialTime = new Date();
    initialTime.setHours(0);
    initialTime.setMinutes(0);

    let timeslist = Array.from({ length: payload?.Times }, (_, index) => {
      const newTime = new Date(initialTime);
      newTime.setHours(
        initialTime.getHours() +
          (index * 24) / Number(payload?.Times ? payload?.Times : 1),
      ); // 3-hour interval
      return newTime;
      // return newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    setTimes(timeslist);
  }, [payload?.Times]);
  const handleTimeChange = (event, index) => {
    const newTimes = [...times];
    newTimes[index] = event.value;
    setTimes(newTimes);
  };

  useEffect(() => {
    getBindDepartments();
  }, []);

  /* View Requisition list: loaded for the Type on screen (Medicine Issue by default). It was
     loaded as "SE" (Service) on open, so after a refresh / reopen the list held the patient's
     Service requisitions - usually none - while the screen showed Medicine Issue, and the
     medicine requisitions never appeared. Re-runs when the patient (TransactionID) is bound
     or changes, which is what a refresh / reopening the frame does. */
  const viewReqTID = data?.transactionID || data?.TransactionID;
  useEffect(() => {
    if (!viewReqTID || item) return; // with `item` the effect below loads its own Type
    handleCallViewMedReq("Open", payload?.Type || statusType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewReqTID]);

  useEffect(() => {
    if (item) {
      setPayload((val) => ({ ...val, Type: item?.Type }));
      handleCallViewMedReq("Open", item?.Type);
    }
  }, [item]);

  useEffect(() => {
    const processItems = async () => {
      if (preSelectedItems?.length > 0) {
        setPayload((prev) => ({ ...prev, Type: "MI" }));
        const enrichedItems = await Promise.all(
          preSelectedItems.map(async (item) => {
            const itemID = item?.itemID || item?.ItemID;
            const itemName =
              item?.medicineName ||
              item?.itemName ||
              item?.ItemName ||
              item?.TypeName;

            let enrichedItem = { ...item };

            // If the item data is incomplete, fetch full details
            if (!item?.ConfigID) {
              try {
                const itemDetails = await BindItem({
                  scheduleChargeID: Number(pateintDetails?.ScheduleChargeID),
                  panelID: Number(pateintDetails?.PanelID),
                  ipdCaseTypeID: Number(pateintDetails?.IPDCaseTypeID),
                  itemName: itemName,
                  categoryID: 0,
                  subcategory: 0,
                  requestType: "MI",
                  IsInternational: pateintDetails?.IsInternational || "2",
                });

                const matchedItem = itemDetails?.data?.find(
                  (i) => String(i.ItemID) === String(itemID),
                );
                if (matchedItem) {
                  enrichedItem = { ...matchedItem, ...item };
                }
              } catch (error) {
                console.error("Error enriching medicine item:", error);
              }
            }

            return {
              Type: "MI",
              itemID: enrichedItem?.itemID || enrichedItem?.ItemID,
              itemName:
                enrichedItem?.medicineName ||
                enrichedItem?.itemName ||
                enrichedItem?.ItemName ||
                enrichedItem?.TypeName,
              Dose: enrichedItem?.dose || "",
              Times: enrichedItem?.time || "",
              Duration: enrichedItem?.duration || "",
              Route: enrichedItem?.route || "",
              Meals: enrichedItem?.meal || "",
              Quantity: enrichedItem?.quantity || 1,
              MaxQuantity: Number(enrichedItem?.quantity || 1),
              Remarks: enrichedItem?.remark || "",
              DoctorID:
                enrichedItem?.doctorID ||
                pateintDetails?.DoctorID ||
                data?.DoctorID,
              isDischargeMedicine: false,
              SubCategoryID: {
                label: enrichedItem?.SubCategoryName || "All",
                value: enrichedItem?.SubCategoryID || "0",
              },
              RequestType: { label: "Direct", value: "Direct" },
              isUrgent: enrichedItem?.isUrgent || false,
              ConfigID: enrichedItem?.ConfigID,
              EntryID:
                enrichedItem?.EntryID ||
                enrichedItem?.entryId ||
                enrichedItem?.EntryId,
              ScheduledTime:
                enrichedItem?.ScheduledTime ||
                enrichedItem?.scheduledTime ||
                enrichedItem?.ScheduledTimeValue ||
                "",
            };
          }),
        );
        setTableData((prev) => [...prev, ...enrichedItems]);
      }
    };

    processItems();
  }, [preSelectedItems]);

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
      <div className="card mt-2">
        <Heading title={t("Requisition")} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("Type")}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            id={"Type"}
            name={"Type"}
            value={payload?.Type}
            isDisabled={preSelectedItems?.length > 0}
            handleChange={handleReactSelect}
            dynamicOptions={translateOptions(TypeOptions, t)}
          />
          <>
            {payload?.Type === "MR" ? (
              <ReactSelect
                      placeholderName={t("Department")}
                      searchable={true}
                      respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                      id={"department"}
                      name={"department"}
                      value={payload?.department}
                      isDisabled={tableData?.length > 0 ? true : false}
                      handleChange={handleReactSelectChange}
                      dynamicOptions={returnDept?.map((ele) => ({
                        label: ele?.RoleName,
                        value: ele?.RoleID,
                      }))}
                      requiredClassName={`required-fields ${errors?.department ? "required-fields-active" : ""}`}
                    />
            ) : (
              <>
                <ReactSelect
                  placeholderName={t("Category")}
                  id={"Category"}
                  searchable={true}
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                  name={"Category"}
                  dynamicOptions={DropDownState?.category}
                  value={payload?.Category?.value}
                  handleChange={handleReactSelectItem}
                />
                <ReactSelect
                  placeholderName={t("Sub_Category")}
                  id={"SubCategoryID"}
                  searchable={true}
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                  name={"SubCategoryID"}
                  dynamicOptions={DropDownState?.subcategory}
                  value={payload?.SubCategoryID?.value}
                  handleChange={handleReactSelectItem}
                />
                {payload?.Type === "MR" && (
                  <>
                    <ReactSelect
                      placeholderName={t("Department")}
                      searchable={true}
                      respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                      id={"department"}
                      name={"department"}
                      value={payload?.department}
                      isDisabled={tableData?.length > 0 ? true : false}
                      handleChange={handleReactSelectChange}
                      dynamicOptions={returnDept?.map((ele) => ({
                        label: ele?.RoleName,
                        value: ele?.RoleID,
                      }))}
                      requiredClassName={`required-fields ${errors?.department ? "required-fields-active" : ""}`}
                    />
                  </>
                )}
                {payload?.Type === "MI" && (
                  <>
                    <ReactSelect
                      placeholderName={t("Department")}
                      searchable={true}
                      respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                      id={"department"}
                      name={"department"}
                      value={payload?.department}
                      handleChange={handleReactSelectChange}
                      // isDisabled={tableData?.length > 0 ? true : false}
                      // dynamicOptions={DropDownState?.Department}
                      dynamicOptions={[
                        // { value: "0", label: "ALL" },
                        ...handleReactSelectDropDownOptions(
                          DropDownState?.Department
                            ? DropDownState?.Department
                            : "",
                          "label",
                          "value",
                        ),
                      ]}
                      requiredClassName={`required-fields ${errors?.department ? "required-fields-active" : ""}`}
                    />
                    <ReactSelect
                      placeholderName={t("Only For OT")}
                      searchable={true}
                      respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                      id={"otType"}
                      name={"otType"}
                      value={payload?.otType}
                      isDisabled={tableData?.length > 0 ? true : false}
                      handleChange={handleReactOTChange}
                      dynamicOptions={[
                        {
                          label: t("Select"),
                          value: "",
                        },
                        {
                          label:
                            t("General anesthesia medicine for panel patient"),
                          value: "1",
                        },
                        {
                          label: t("Spinal anesthesia medicine for panel patient"),
                          value: "2",
                        },
                      ]}
                      // requiredClassName={`required-fields ${errors?.department ? "required-fields-active" : ""}`}
                    />
                  </>
                )}
                <div
                  id="medReqSearchItem"
                  onKeyDown={handleSearchItemTab}
                  className="col-xl-4 col-md-4 col-sm-4 col-sm-4 col-12"
                >
                  {/* <div className="box-size">
                    <div className="box-upper"> */}
                  {payload?.isOtherMedicine ? (
                    <Input
                      type="text"
                      className="form-control"
                      id="otherMedicineName"
                      name="otherMedicineName"
                      lable={t("Other Medicine")}
                      placeholder=" "
                      value={payload?.itemName?.label || ""}
                      onChange={handleOtherMedicineName}
                      respclass="col-12"
                      maxLength={100}
                    />
                  ) : (
                    <SearchByMedicineItemName
                      // onClick={handleSinglePatientData}
                      data={data}
                      handleItemSelect={handleItemSelect}
                      itemName={payload?.itemName}
                      pateintDetails={pateintDetails}
                      payload={payload}
                      isAvailQyantity={true}
                      // AddRowData={AddRowData}
                    />
                  )}
                  {/* Nursing can always request a medicine the item master does not
                      carry - deliberately NOT behind IsIndentWiseMedicineOPDReturn,
                      so it works whatever that key is set to. The row is saved with
                      itemID 0 and the typed text as its name. */}
                  {/* Medicine Issue has this tick-box on its second line; other types keep it here */}
                  {payload?.Type !== "MI" && (
                    <div className="d-flex">
                      <Input
                        type="checkbox"
                        placeholder=" "
                        className="mt-2"
                        id="isOtherMedicine"
                        name="isOtherMedicine"
                        checked={!!payload?.isOtherMedicine}
                        onChange={handleOtherMedicineToggle}
                        respclass="col-md-1 col-1"
                      />
                      <label className="mt-2 ml-3">{t("Other Medicine")}</label>
                    </div>
                  )}
                  {/* </div> */}
                  {/* <div className="box-inner">
                      <button
                        className="btn btn-sm btn-primary"
                        type="button"
                        onClick={() => handlePackageDetails("40vw")}
                      >
                        {" "}
                        {t("Medicine_Set")}
                      </button>
                    </div> */}
                  {/* </div> */}
                </div>
                {/* Quantity sits right after Search Item so Enter adds the row and focus returns to the search */}
                {payload?.Type == "MI" && (
                  <Input
                    type="number"
                    // className="form-control"
                    id="Quantity"
                    name="Quantity"
                    value={payload?.Quantity ? payload?.Quantity : ""}
                    onChange={handleChange}
                    lable={t("Quantity")}
                    onKeyDown={(e) => {
                      if ([".", ",", "e", "E", "-", "+"].includes(e.key)) {
                        e.preventDefault();
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        AddRowData(payload);
                      }
                    }}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-6 col-12"
                    className={`form-control required-fields ${errors?.Quantity ? "required-fields-active" : ""}`}
                  />
                )}
              </>
            )}
          </>
          {/* </div> */}

          <>
            {/* <div className="row px-2 pb-2"> */}
            {payload?.Type == "MI" && (
              <>
                <Input
                  type="number"
                  className="form-control"
                  id="Dose"
                  name="Dose"
                  lable={t("Dose")}
                  placeholder=""
                  respclass="col-xl-2 col-md-2 col-sm-6 col-12"
                  value={payload?.Dose}
                  onChange={handleChange}
                />
                <ReactSelect
                  placeholderName={t("Times")}
                  searchable={true}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                  id={"Times"}
                  name={"Times"}
                  value={payload?.Times}
                  handleChange={handleReactSelect}
                  dynamicOptions={DropDownState?.times?.filter(
                    (item, _) => item.TYPE === "Time",
                  )}
                  // const durationOptions = times?.filter((item) => item.TYPE === "Duration");)}
                />

                <ReactSelect
                  placeholderName={t("Duration")}
                  searchable={true}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                  id={"Duration"}
                  name={"Duration"}
                  value={payload?.Duration}
                  handleChange={handleReactSelect}
                  dynamicOptions={DropDownState?.times?.filter(
                    (item, _) => item.TYPE === "Duration",
                  )}
                />
                {/* Route and Meals are not asked for on a nursing requisition, so they are not shown.
                    Second line: Other Medicine, Requisition Type, Doctor, Is Discharge, Add Items. */}
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex align-items-center">
                  <Input
                    type="checkbox"
                    placeholder=" "
                    id="isOtherMedicine"
                    name="isOtherMedicine"
                    checked={!!payload?.isOtherMedicine}
                    onChange={handleOtherMedicineToggle}
                    respclass="col-md-2 col-2"
                  />
                  <label className="ml-2 mb-0">{t("Other Medicine")}</label>
                </div>
              </>
            )}
            {payload?.Type === "SE" ? (
              <>
                {/* <ReactSelect
                  placeholderName={t("Doctor")}
                  searchable={true}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  id={"DoctorID"}
                  name={"DoctorID"}
                  value={payload?.DoctorID}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={DropDownState?.doctor}
                /> */}
                <Input
                  type="text"
                  className="form-control"
                  id="Remarks"
                  name="Remarks"
                  value={payload?.Remarks}
                  onChange={handleChange}
                  lable={t("Remarks")}
                  placeholder=""
                  respclass="col-xl-4 col-md-2 col-sm-6 col-12"
                />
              </>
            ) : (
              ""
            )}
            {payload?.Type === "MR" || payload?.Type === "MI" ? (
              <>
                <ReactSelect
                  placeholderName={t("Requisition_Type")}
                  searchable={true}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                  id={"RequestType"}
                  name={"RequestType"}
                  value={payload?.RequestType}
                  handleChange={handleReactSelect}
                  dynamicOptions={DropDownState?.requisition}
                  requiredClassName={`required-fields ${errors?.RequestType ? "required-fields-active" : ""}`}
                />
              </>
            ) : (
              ""
            )}
            {}
            {payload?.Type === "MI" || payload?.Type === "SE" ? (
              <>
                <ReactSelect
                  placeholderName={t("Doctor")}
                  searchable={true}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  id={"DoctorID"}
                  name={"DoctorID"}
                  // value={data?.dName ? data?.dName : payload?.DoctorID}
                  value={payload?.DoctorID}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={DropDownState?.doctor}
                  requiredClassName={`required-fields ${errors?.DoctorID ? "required-fields-active" : ""}`}
                />
                {/* <Input
                      type="text"
                      className="form-control"
                      id="Remarks"
                      name="Remarks"
                      value={payload?.Remarks}
                      onChange={handleChange}
                      lable={t("Remarks")}
                      placeholder=""
                      respclass="col-xl-2 col-md-2 col-sm-6 col-12"
                    /> */}
              </>
            ) : (
              ""
            )}

            {payload?.Type === "MI" && (
              <>
                {times?.map((val, index) => {
                  return (
                    <>
                      <TimePicker
                        placeholderName={t("Time")}
                        lable={t("Time")}
                        id="time"
                        respclass="col-xl-1 col-md-4 col-sm-4 col-12"
                        name="time"
                        value={new Date(val)}
                        handleChange={(e) => {
                          handleTimeChange(e, index);
                        }}
                      />
                    </>
                  );
                })}

                {/* Same line as Other Medicine / Requisition Type / Doctor */}
                <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex align-items-center">
                  <Input
                    type="checkbox"
                    placeholder=" "
                    name="isDischargeMedicine"
                    checked={payload?.isDischargeMedicine}
                    onChange={handleChange}
                    respclass="col-md-2 col-2"
                  />
                  <label className="ml-2 mb-0">
                    {t("Is_Discharge_Medicine")}
                  </label>
                </div>
                <div className="col-xl-auto col-md-2 col-sm-6 col-12 d-flex align-items-center">
                  {/* <button
                    className="btn btn-sm btn-primary"
                    type="button"
                    onClick={() => handlePackageDetails("40vw")}
                  >
                    {" "}
                    {t("Medicine_Set")}
                  </button> */}
                  <button
                    className="btn btn-sm btn-success ml-1"
                    disabled={billLocked}
                    title={
                      billLocked
                        ? t("Bill is finalized - no new item can be added")
                        : undefined
                    }
                    onClick={() => {
                      if (billLocked) return;
                      AddRowData(payload);
                    }}
                  >
                    {t("Add_Items")}
                  </button>
                </div>
              </>
            )}
            <div className="col-sm-8 text-right">
              {/* {payload?.Type === "MR" ? (
                ""
              ) : (
                <button
                  className="btn btn-sm btn-success"
                  // onClick={getBindAlreadyPrescribeItem}
                  onClick={() => {
                    AddRowData(payload);
                  }}
                >
                  {t("Add_Items")}
                </button>
              )} */}
              {payload?.Type === "SE" && (
                <>
                  <button
                    className="btn btn-sm btn-success"
                    // onClick={getBindAlreadyPrescribeItem}
                    onClick={() => {
                      AddRowData(payload);
                    }}
                  >
                    {t("Add_Items")}
                  </button>
                  {bindApprovalList?.length > 0 && (
                    <button
                      className="btn btn-sm btn-primary ml-2"
                      type="button"
                      onClick={() => handleApprovalDetails("70vw")}
                    >
                      {t("Approval Pending Request")}
                    </button>
                  )}
                </>
              )}
            </div>
            {/* </div> */}
          </>
        </div>{" "}
        <div className="row px-2">
          <div className="col-sm-12">
            {payload?.Type === "SE" && (
              <MedicineIndentTable
                THEAD={AddInvestigationItemHead}
                tbody={addList}
                handleRateItemsChange={handleRateItemsChange}
                handleRemove={handleRemove}
                Authorization={Authorization}
              />
            )}
            {(payload?.Type === "MI" || payload?.Type === "MR") && (
              <MedicineInvestigationTable
                THEAD={AddItemHead}
                tbody={tableData}
                handleRemoveIR={handleRemoveIR}
                handleQtyChange={handleTableQtyChange}
              />
            )}
            {payload?.Type === "MR" && (
              <>
              <MedicineReturnTable
                THEAD={AddMedReturnHead}
                tbody={MedReturnItems}
                handleItemsChange={handleItemsChange}
                handleSelect={handleSelect}
                showIssueSource={indentWiseOPDReturn}
              />
              <div className="col-sm-12 d-flex justify-content-end">
              <button
                className="btn btn-sm btn-success"
                disabled={billLocked}
                title={
                  billLocked
                    ? t("Bill is finalized - nothing can be returned on it")
                    : undefined
                }
                onClick={saveReturn}
              >
                {t("Return")}
              </button>
            </div>
            </>
            )}
            
          </div>
        </div>
        {/* {payload?.Type === "MR" && (
          <div className="row p-2">
            <div className="col-sm-12 d-flex justify-content-end">
              <button className="btn btn-sm btn-success" onClick={saveReturn}>
                {t("Return")}
              </button>
            </div>
          </div>
        )} */}
        {payload?.Type === "SE" && addList?.length > 0 && (
          <>
            <div className="row p-2">
              <div className="col-sm-12 d-flex justify-content-end">
                <button className="btn btn-sm btn-success" onClick={handleSave}>
                  {t("Save")}
                </button>
              </div>
            </div>
          </>
        )}
        {payload?.Type === "MI" && tableData?.length > 0 && (
          <>
            <div className="row p-2">
              <div className="col-sm-12 d-flex justify-content-end">
                <button className="btn btn-sm btn-success" onClick={handleSave}>
                  {t("Save")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* {CTBList?.length > 0 && (
        <div className="card">
          <div className="row p-2">
            <div className="col-sm-12">
              <CTBModal
                tbody={CTBList}
                CTBList={CTBList} 
                setCTBList={setCTBList}
              />
            </div>
          </div>
        </div>
      )} */}
      <div className="card mt-2">
        <Heading
          title={
            <span
              style={{ cursor: "pointer" }}
              onClick={() => {
                const opening = !showViewReq;
                setShowViewReq(opening);
                if (opening) handleCallViewMedReq("Open", payload?.Type || statusType);
              }}
            >
              <i
                className={`fa fa-chevron-${showViewReq ? "down" : "right"} mr-2`}
              />
              {t("View Requisition")}
            </span>
          }
          isBreadcrumb={false}
          secondTitle={
            <>
              <span className="pointer-cursor">
                {" "}
                <ColorCodingSearch
                  color={"#add8e6"}
                  label={t("Open")}
                  onClick={() => {
                    setShowViewReq(true);
                    handleCallViewMedReq("Open", statusType);
                  }}
                />
              </span>
              <span className="pointer-cursor">
                {" "}
                <ColorCodingSearch
                  color={"#ffb6c1"}
                  label={t("Closed")}
                  onClick={() => {
                    setShowViewReq(true);
                    handleCallViewMedReq("Closed", statusType);
                  }}
                />
              </span>
              <span className="pointer-cursor">
                {" "}
                <ColorCodingSearch
                  color={"#ffa500"}
                  label={t("Reject")}
                  onClick={() => {
                    setShowViewReq(true);
                    handleCallViewMedReq("Reject", statusType);
                  }}
                />
              </span>
              <span className="pointer-cursor">
                {" "}
                <ColorCodingSearch
                  color={"rgb(160, 216, 160)"}
                  label={t("Partial")}
                  onClick={() => {
                    setShowViewReq(true);
                    handleCallViewMedReq("Partial", statusType);
                  }}
                />
              </span>
            </>
          }
        />
        {showViewReq && (
        <ViewReqTable
          tbody={list}
          payload={payload}
          handleCallViewMedReq={handleCallViewMedReq}
          Tid={data?.transactionID || data?.TransactionID}
        />
        )}
      </div>
      {modalData.visible && (
        <Modal
          visible={modalData.visible}
          Header={modalData.Header}
          modalWidth={modalData?.size}
          onHide={modalData?.setVisible}
          setVisible={() => {
            setModalData((val) => ({ ...val, visible: false }));
          }}
          footer={modalData?.footer}
        >
          {modalData?.component}
        </Modal>
      )}
    </>
  );
};

export default MedicineRequisition;
