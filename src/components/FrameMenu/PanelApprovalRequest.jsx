import React, { useEffect, useMemo, useState } from "react";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import { useTranslation } from "react-i18next";
import ReactSelect from "../formComponent/ReactSelect";
import {
  AMOUNT_REGX,
  AmountApprovalType,
  CalculateOption,
  CLAIM_REGX,
  PanelApprovalType,
  RateOnOptions,
  RateType,
} from "../../utils/constant";
import SearchByName from "../commonComponents/SearchByName";
import SurgeryDepartmentDetailsTable from "../UI/customTable/billings/SurgeryDepartmentDetailsTable";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import LabeledInput from "../formComponent/LabeledInput";
import PatientBillingDetails from "../commonComponents/PatientBillingDetails";
import {
  BindApprovalData,
  BindPanelDetail,
  BindPanels,
  GetBillDetails,
  GetPanelApprovalDetails,
  PanelAmountAllocationBindPanelsAllocation,
  PanelAmountAllocationGetPatientPanelAmountAllocationDetail,
  PanelAmountAllocationSavePanelAmountAllocationDetails,
  PanelApprovalReject,
  PanelRequestRemovePanelRequest,
  SendPanelApprovalEmail,
  UpdateBilling,
  PanelRequestApprovalView,
  PanelReqquestViewAPI,
} from "../../networkServices/BillingsApi";
import { bindPanelByPatientID } from "../../networkServices/opdserviceAPI";
import {
  handleReactSelectDropDownOptions,
  inputBoxValidation,
  notify,
  SendPanelApprovalBillingPayload,
} from "../../utils/utils";
import SeeMore from "../UI/SeeMore";
import OverLay from "../modalComponent/OverLay";
import SeeMoreList from "../commonComponents/SeeMoreList";
import Modal from "../modalComponent/Modal";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../../components/SvgIcons/index";
import BrowseButton from "../formComponent/BrowseButton";
import PanelApprovalRejectModal from "../modalComponent/Utils/PanelApprovalRejectModal";
import moment from "moment";
import { Tooltip } from "primereact/tooltip";
import CustomSelect from "../formComponent/CustomSelect";
import { translateOptions } from "@components/WrapTranslate";
const PanelApprovalRequest = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [BillDetails, setBillDetails] = useState([]);
  const [allocationData, setAllocationData] = useState([]);
  console.log("allocationData", allocationData);
  const [panelList, setPanelList] = useState([]);
  const [allocationPanel, setAllocationPanel] = useState([]);
  const [allocationPanelDetail, setAllocationPanelDetail] = useState({});
  console.log("allocationPanelDetail", allocationPanelDetail);
  const [panelDetail, setPanelDetail] = useState({});
  const [visible, setVisible] = useState(false);
  const [isEdit, setISEdit] = useState(false);
  const [handleModelData, setHandleModelData] = useState({});
  const [seeMore, setSeeMore] = useState([
    {
      ID: 2,
      MenuName: "Add/Remove Panels List",
      MenuURL: "Add/RemovePanelsList",
    },
  ]);
  const [renderComponent, setRenderComponent] = useState({
    name: "",
    component: null,
  });

  const [t] = useTranslation();
  const tHead = [
    t("CompanyName"),
    t("PolicyNumber"),
    t("ApprovalAmount"),
    t("ApprovalRemark"),
    t("ApprovalSendOn"),
    t("CreateBy"),
    t("View"),
    { name: t("Reject"), width: "1%" },
  ];
  const tHeadApproval = [
    // t("IPDNo"),
    t("PanelName"),
    t("ApprovalAmount"),
    t("ApprovalDate"),
    t("ClaimNo"),
    t("ApprovalType"),
    t("Remarks"),
    t("AmtAppType"),
    t("AppExpiryDate"),
    t("CreatedBy"),
    t("Current Status"),
    t("View"),
    t("Edit"),
    t("Reject"),
    // { name: t("Print"), width: "1%" },
  ];

  const allocationThead = [
    { name: t("Select"), width: "1%" },
    { name: t("S.No."), width: "1%" },
    { name: t("Panel Group") },
    { name: t("Panel Name") },
    { name: t("Allocated Amount") },
    { name: t("Amount") },
    { name: t("Dispatch Type") },
    { name: t("Entry By") },
    // { name: t("Scheme Mode") },
  ];
  const GetBindBillDetails = async () => {
    try {
      const datas = await GetBillDetails(data?.transactionID);
      if (datas?.success) {
        setBillDetails(datas?.data[0]);
      } else {
        setBillDetails({});
      }
    } catch (error) {
      console.log(error);
    }
  };

  const GetbindPanelByPatientID = async () => {
    try {
      let apiResp = await bindPanelByPatientID(data?.patientID);
      if (apiResp?.success) {
        setPanelList(
          handleReactSelectDropDownOptions(
            apiResp?.data,
            "PanelName",
            "PanelID",
          ),
        );
      } else {
        setPanelList([]);
      }
    } catch (error) {}
  };

  const handleDataInDetailView = useMemo(() => {
    if (Object.keys(panelDetail ? panelDetail : {})?.length > 0) {
      const data = [
        {
          label: t("ParentPanel"),
          value: panelDetail?.ParentPanel,
        },
        {
          label: t("Corporate"),
          value: panelDetail?.CorporareName,
        },
        // {
        //   label: t("IgnorePolicy"),
        //   value:  panelDetail?.ParentPanel,
        // },
        // {
        //   label: t("IgnorePolicyReason"),
        //   value:  panelDetail?.ParentPanel,
        // },
        {
          label: t("PolicyNo"),
          value: panelDetail?.PolicyNo,
        },
        {
          label: t("PolicyCardNo"),
          value: panelDetail?.PolicyCardNo,
        },
        {
          label: t("NameOnCard"),
          value: panelDetail?.PanelCardName,
        },
        {
          label: t("ExpireDate"),
          value: panelDetail?.PolicyExpiry,
        },
        {
          label: t("CardHolder"),
          value: panelDetail?.PolciyCardHolderRelation,
        },
        {
          label: t("Amount"),
          value: panelDetail?.ApprovalAmount,
        },
        // {
        //   label: t("Remark"),
        //   value: panelDetail?.ApprovalRemarks,
        // },
      ];

      return data;
    } else {
      return [];
    }
  }, [panelDetail]);

  let PatientRegistrationArg = {
    PatientID: data?.patientID,
    TransactionID: data?.transactionID,
    setVisible: setVisible,
    bindDetailAPI: () => {},
    handleBindPanelByPatientID: GetbindPanelByPatientID,
  };

  const [tBody, setTBody] = useState([]);

  const GetPanelApprovalDetailsAPI = async () => {
    let apiResp = await GetPanelApprovalDetails({
      TID: data?.transactionID,
      PID: data?.patientID,
    });
    if (apiResp?.success) {
      setTBody(apiResp?.data);
    } else {
      setPanelDetail((val) => ({
        ...val,
        PanelApprovalDetailError: apiResp?.message,
      }));
      //  isShowTost && notify(apiResp?.message, "error");
      setTBody([]);
    }
  };

  useEffect(() => {
    let list = SeeMoreList(
      [
        {
          ID: 2,
          MenuName: t("Add/Remove Panels List"),
          MenuURL: "Add/RemovePanelsList",
        },
      ],
      PatientRegistrationArg,
    );
    setSeeMore(list);
    GetPanelApprovalDetailsAPI();
    GetBindBillDetails();
    GetbindPanelByPatientID();
    GetPanelApprovalSearchAPI();
  }, []);

  const ModalComponent = (name, component) => {
    setVisible(true);
    setRenderComponent({
      name: name,
      component: component,
    });
  };

  const handleChange = (e) => {
    setPanelDetail((val) => ({ ...val, [e.target.name]: e.target.value }));
  };

  const saveDetail = async (status) => {
    debugger
    //  panelDocsBase64: panelApprovalDetails?.Document_Base64,
    panelDetail.attachCostEstimation = status;
    let payload = SendPanelApprovalBillingPayload(data, panelDetail,panelApprovalDetails?.Document_Base64);
    let apiResp = await SendPanelApprovalEmail(payload);

    if (apiResp?.success) {
      notify(apiResp?.message, "success");
      GetPanelApprovalDetailsAPI();
      setHandleModelData((val) => ({ ...val, isOpen: false }));
    } else {
      notify(apiResp?.message, "error");
    }
    if (apiResp?.status !== 200) {
      notify(apiResp?.data?.message, "error");
    }
  };

  const savePanelDetail = async () => {
    if (!panelDetail?.approvalAmount) {
      notify(t("approvalAmountRequired"), "error");
      return false;
    }
     saveDetail(false);
    // setHandleModelData({
    //   label: t("Cost Estimation"),
    //   width: "20vw",
    //   isOpen: true,
    //   Component: (
    //     <h3 className="text-center">
    //       <strong>
    //         <div className="text-danger">{t("Are you Sure")}</div>
    //         {t("To Attach Cost Estimation")}
    //       </strong>
    //     </h3>
    //   ),
    //   footer: (
    //     <>
    //       {" "}
    //       <button
    //         className="btn btn-sm btn-primary"
    //         type="button"
    //         onClick={() => {
    //           saveDetail(true);
    //         }}
    //       >
    //         {" "}
    //         {t("Yes")}{" "}
    //       </button>{" "}
    //       <button
    //         className="btn btn-sm btn-primary"
    //         type="button"
    //         onClick={() => {
    //           saveDetail(false);
    //         }}
    //       >
    //         {" "}
    //         {t("Cancel")}{" "}
    //       </button>{" "}
    //     </>
    //   ),
    // });
  };

  // Approval Screen JS

  const [rejectVisible, setRejectVisible] = useState(false);
  const currentDate = moment();
  const panelApproveDate = moment(data.PanelApprovalDate);
  const diff = currentDate.diff(panelApproveDate, "hours");
  const shouldShowImage = diff > 24 || data.IsActive === 0;

  const [activeClass, setActiveClass] = useState("panel-request");
  console.log("activeClass", activeClass);
  const [panelApprovalDetails, setPanelApprovalDetails] = useState({
    PanelApprovalAmount: "",
    ClaimNo: "",
    Remarks: "",
    ApprovalDate: new Date(),
  });
  const [panelApprovalList, setpanelApprovalList] = useState([]);
  const [panelApproalTbody, setPanelApprovalTbody] = useState([]);
  const [panelApproveData, setPanelApproveData] = useState([]);

  const GetBindApprovalData = async () => {
    let apiResp = await BindApprovalData(data?.transactionID);
    if (apiResp?.success) {
      setPanelApproveData(apiResp?.data);
    } else {
      setPanelApproveData([]);
    }
  };

  const GetPanelApprovalSearchAPI = async () => {
    let apiResp = await BindPanelDetail(data?.transactionID);
    if (apiResp?.success) {
      setPanelApprovalTbody(apiResp?.data);
    } else {
      notify(apiResp?.message, "error");
      setPanelApprovalTbody([]);
    }
  };

  const bindPanelApprovalDetails = async () => {
    try {
      Promise.all([
        BindPanelDetail(data?.transactionID),
        BindPanels(data?.transactionID),
      ]).then(([BindPanelDetail, BindPanels]) => {
        let panelDetail = BindPanelDetail?.data;
        panelDetail.Remarks = "";
        panelDetail.PanelApproval = { label: "", value: "92" };
        panelDetail.ClaimNo = "";
        panelDetail.PanelApprovalType = {
          label: "",
          value: "PanelApprovalType",
        };
        panelDetail.AmountApprovalType = { label: "", value: "Open" };

        setPanelApprovalDetails(panelDetail);
        setpanelApprovalList(
          handleReactSelectDropDownOptions(
            BindPanels?.data,
            "Company_Name",
            "PanelID",
          ),
        );
      });
    } catch (error) {}
  };

  const handleClickPanelChange = (classes) => {
    setActiveClass(classes);
    if (classes === "panel-approval") {
      bindPanelApprovalDetails();
    }
    if (classes === "panel-request") {
      GetPanelApprovalDetailsAPI();
    }
    if (classes === "panel-allocation") {
      // GetPanelAllocationDetailsAPI();
    }
  };

  const panelAllocationData = async () => {
    const transactionID = data?.transactionID;
    const repsonse =
      await PanelAmountAllocationBindPanelsAllocation(transactionID);
    if (repsonse?.success) {
      setAllocationPanel(repsonse?.data);
    }
  };
  const HandlePanelPage = () => {
    return (
      <>
        <span
          className={`pointer-cursor ${activeClass === "panel-request" ? "active-panel" : ""}`}
          onClick={() => {
            handleClickPanelChange("panel-request");
          }}
        >
          {" "}
          {t("PanelRequest")}{" "}
        </span>
        <span
          className={`pointer-cursor ml-2 ${activeClass === "panel-approval" ? "active-panel" : ""}`}
          onClick={() => {
            handleClickPanelChange("panel-approval");
          }}
        >
          {" "}
          {t("PanelApproval")}{" "}
        </span>
        <span
          className={`pointer-cursor ml-2 ${activeClass === "panel-allocation" ? "active-panel" : ""}`}
          onClick={() => {
            handleClickPanelChange("panel-allocation");
          }}
        >
          {" "}
          {t("Panel Allocation")}{" "}
        </span>
      </>
    );
  };
  const handleTableDetails = (ele, i) => {
    setPanelApprovalDetails({
      ...panelApprovalDetails,
      BillAmount: panelApproalTbody[i]?.amountBilled,
      PanelApproval: { label: "", value: panelApproalTbody[i]?.PanelID },
      PatientAmount: "",
      PanelApprovalAmount: panelApproalTbody[i]?.PanelApprovedAmt,
      ApprovalDate: panelApproalTbody[i]?.PanelApprovalDate,
      ClaimNo: panelApproalTbody[i]?.ClaimNo,
      FinalApprovalAmount: "",
      PanelApprovalType: {
        label: "",
        value: panelApproalTbody[i]?.PanelApprovalTypeID,
      },
      Remarks: panelApproalTbody[i]?.PanelAppRemarks,
      AmountApprovalType: {
        label: "",
        value: panelApproalTbody[i]?.AmountApprovalTypeID,
      },
      panelid: panelApproalTbody[i]?.PanelID,
      approvalID: panelApproalTbody[i]?.ID,
    });
    setISEdit(ele?.ID)
  };
  const handleImageChange = (e) => {
    const file = e?.target?.files[0];

    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(t("File size exceeds 5MB. Please choose a smaller file."));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader?.result.split(",")[1];
        const fileExtension = file?.name.split(".").pop();
        setPanelApprovalDetails({
          ...panelApprovalDetails,
          SelectFile: file,
          Document_Base64: base64String,
          FileExtension: fileExtension,
        });
      };
      reader.readAsDataURL(file); // Convert file to base64
    }
  };
  const handleReactSelect = (name, value) => {
    if (name === "PanelApproval") {
      setPanelApprovalDetails((val) => ({
        ...val,
        [name]: value,
        PanelApprovalAmount: value?.ApprovalAmount,
      }));
    } else {
      setPanelApprovalDetails((val) => ({ ...val, [name]: value }));
    }
  };

  const handleChangeApproval = (e) => {
    if (
      e.target.name === "PanelApprovalAmount" &&
      Number(e.target.value) <= Number(BillDetails?.NetAmount)
    ) {
      setPanelApprovalDetails((val) => ({
        ...val,
        [e.target.name]: e.target.value,
      }));
    } else if (e.target.name !== "PanelApprovalAmount") {
      setPanelApprovalDetails((val) => ({
        ...val,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const handleUpdateBilling = async () => {
    if (!panelApprovalDetails?.PanelApproval?.value) {
      notify(t("Please Select Panel"), "warn");
      return;
    } else if (!panelApprovalDetails?.PanelApprovalAmount) {
      notify(t("Please Fill Panel Approval Amount"), "warn");
      return;
    } else if (!panelApprovalDetails?.PanelApprovalType?.value) {
      notify(t("Please Select Panel Approval Type"), "warn");
      return;
    } else if (!panelApprovalDetails?.Remarks) {
      notify(t("Please Fill Remarks"), "warn");
      return;
    } else if (!panelApprovalDetails?.AmountApprovalType?.value) {
      notify(t("Please Select Amount Approval Type"), "warn");
      return;
    }
debugger
    const approvalDate = panelApprovalDetails?.ApprovalDate;
    const startDate = approvalDate
      ? new Date(approvalDate).toISOString().split("T")[0]
      : "";
    const payload = {
      transactionID: data?.transactionID,
      dateOfApproval: moment(panelApprovalDetails?.ApprovalDate).format(
        "YYYY-MM-DD",
      ),
      panelBillAmt: panelApprovalDetails?.PanelApprovalAmount,
      typeOfApproval: panelApprovalDetails?.PanelApprovalType.value,
      remarks: panelApprovalDetails?.Remarks,
      appWay: panelApprovalDetails?.AmountApprovalType.value,
      startDate: approvalDate,
      updateBillingText: isEdit? " ": "Save Billing",
      billAmount: panelApprovalDetails?.BillAmount,
      claimNo: panelApprovalDetails?.ClaimNo,
      panelId: panelApprovalDetails?.PanelApproval
        ? panelApprovalDetails?.PanelApproval?.PanelID
        : "",
      // cashBillAmount: panelApproveData?.dt[0]?.PatientCashAmt?panelApproveData?.dt[0]?.PatientCashAmt:"",
      cashBillAmount: 0,
      // prePanelApprovedAmt: panelApproveData?.dt[0]?.PanelApprovedAmt?panelApproveData?.dt[0]?.PanelApprovedAmt:"",
      prePanelApprovedAmt: 0,
      approvalID: panelApprovalDetails?.approvalID,
      panelDocsBase64: panelApprovalDetails?.Document_Base64,
      NetBillAmt: BillDetails?.NetAmount ? BillDetails?.NetAmount : 0,
    };

    try {
      let apiResp = await UpdateBilling(payload);
      if (apiResp?.success) {
        notify(apiResp?.message, "success");
        GetPanelApprovalSearchAPI();
        GetBindBillDetails();
        setPanelApprovalDetails([]);
        setISEdit(false)
      } else {
        notify(apiResp?.message, "error");
      }

      if (apiResp?.status !== 200) {
        notify(apiResp?.data?.message, "error");
      }
    } catch (error) {
      notify(t("Error occurred while processing request"), "error");
    }
  };
  console.log("panelApprovalDetails", panelApprovalDetails);
  const handleIndicator = (state) => {
    return (
      <div className="text-danger">
        (max 300 Character) <span className="text-dark">{t("Remaining :")} </span>{" "}
        <span className="text-success">{Number(300 - state?.length)}</span>
      </div>
    );
  };

  useEffect(() => {
    GetBindApprovalData();
  }, []);
  console.log("BillDetails", BillDetails);

  const handlePanelReject = async (id) => {
    const response = await PanelRequestRemovePanelRequest(id);
    if (response?.success) {
      notify(response?.message, "success");
      GetPanelApprovalDetailsAPI();
    } else {
      notify(response?.message, "error");
    }
  };
  const openBase64Document = ({ base64, mimeType, fileName }) => {
  if (!base64) return false;

  const cleanBase64 = String(base64).includes(",")
    ? String(base64).split(",")[1]
    : String(base64);
  const byteCharacters = window.atob(cleanBase64);
  const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: mimeType || "application/octet-stream",
  });
  const blobUrl = window.URL.createObjectURL(blob);

  if (String(mimeType || "").startsWith("image/") || mimeType === "application/pdf") {
    window.open(blobUrl, "_blank");
    return true;
  }

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName || "ExpenseDocument";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
  return true;
};

  const handleViewDocument = async (item) => {
     try {
      const response = await  PanelRequestApprovalView(item?.ID);
      const documentData = response || {};

      if (!response?.success || !documentData?.base64) {
        notify(response?.message || "File not found", "error");
        return;
      }

      const isOpened = openBase64Document(documentData);
      if (!isOpened) {
        notify(t("File not found"), "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("File not found"), "error");
    }
    // try {
    //   const response = await PanelReqquestViewAPI(item?.ID);
    //   debugger
    //   if (response?.base64) {
    //     // Convert base64 string to blob
    //     const byteCharacters = atob(response.base64);
    //     const byteNumbers = new Array(byteCharacters.length);
    //     for (let i = 0; i < byteCharacters.length; i++) {
    //       byteNumbers[i] = byteCharacters.charCodeAt(i);
    //     }
    //     const byteArray = new Uint8Array(byteNumbers);
    //     const blob = new Blob([byteArray], { type: response.contentType || 'application/pdf' });
        
    //     const url = window.URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = response.data.fileName || `PanelApproval_${item?.ID}_${Date.now()}`;
    //     document.body.appendChild(link);
    //     link.click();
    //     window.URL.revokeObjectURL(url);
    //     document.body.removeChild(link);
    //     notify("Document downloaded successfully", "success");
    //   } else {
    //     notify("Failed to download document", "error");
    //   }
    // } catch (error) {
    //   console.error("Error downloading document:", error);
    //   notify("Error occurred while downloading", "error");
    // }
  };

  const handleAllocationModal = async () => {
    const data = allocationPanel?.filter(
      (item) => item?.PanelID === allocationPanelDetail?.value,
    );
    if (data?.length == 0) {
      notify(t("Please select a panel"), "warn");
      return;
    }
    console.log("data", data);
    if (
      allocationData?.find(
        (item) => item?.panelID === allocationPanelDetail?.value,
      )
    ) {
      notify(t("Panel Already Added"), "warn");
      return;
    }
    setAllocationData([
      ...allocationData,
      ...data?.map((item) => ({
        ...item,
        PanelGroup: item?.PanelGroup,
        panelID: item?.PanelID,
        panelName: item?.Company_Name,
      })),
    ]);
    setAllocationPanelDetail("");
  };
  const handleRowChange = (index, field, value) => {
    const selectedData = allocationData[index];
    const dispatchType = selectedData?.dispatchType?.value;
    if (
      dispatchType == "DR" &&
      field === "amount" &&
      Number(value) > Number(allocationData[index]?.allocatedAmount)
    ) {
      notify(t("Amount cannot be greater than Allocated Amount"), "warn");
      return;
    }
    const updatedRows = [...allocationData];
    updatedRows[index][field] = value;
    if (field === "amount") {
      updatedRows[index]["checkbox"] = Number(value) > 0;
    }
    setAllocationData(updatedRows);
  };

  const handleCustomSelect = (index, field, value) => {
    const updatedRows = [...allocationData];
    updatedRows[index][field] = value;
    setAllocationData(updatedRows);
  };

  const panelAllocationTableData = async () => {
    const payload = {
      transactionID: data?.transactionID,
      PanelAllType: "PanelAllType",
    };
    const response =
      await PanelAmountAllocationGetPatientPanelAmountAllocationDetail(payload);
    if (response?.success) {
      setAllocationData(
        response?.data?.map((item) => ({
          ...item,
          checkbox: false,
          amount: 0,
        })),
      );
    } else {
      setAllocationData([]);
    }
  };

  useEffect(() => {
    if (activeClass === "panel-allocation") {
      panelAllocationData();
      panelAllocationTableData();
    }
  }, [activeClass]);

  const handleSave = async () => {
    const filteredData = allocationData?.filter(
      (item) => item?.checkbox === true,
    );
    debugger;
    if (filteredData?.length === 0) {
      notify(t("Please Select at least one panel"), "warn");
      return;
    }
    if (filteredData?.some((item) => item?.amount === 0)) {
      notify(t("Please Enter Amount in the Selected Rows"), "warn");
      return;
    }
    if (filteredData?.some((item) => !item?.dispatchType)) {
      notify(t("Please Select Dispatch Type"), "warn");
      return;
    }

    let totalDebitedAmount = 0;

    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];

      if (row?.dispatchType?.value === "DR") {
        if (row?.amount > row?.allocatedAmount) {
          notify(
            `In Row ${i + 1}: Amount cannot be greater than Allocated Amount`,
            "warn",
          );
          return;
        }
      }
      if (row?.dispatchType?.value === "CR") {
        if (row?.amount > Number(BillDetails?.NetAmount)) {
          notify(
            `In Row ${i + 1}: Allocated Amount cannot be greater than Net Amount`,
            "warn",
          );
          return;
        }
      }
    }
    if (totalDebitedAmount > Number(BillDetails?.NetAmount)) {
      notify(t("Allocated Amount Exceeds Total Amount"), "warn");
      return;
    }
    const payload = filteredData?.map((item) => {
      return {
        panelID: item?.panelID,
        transactionID: data?.transactionID,
        amount: item?.amount,
        allocationType: item?.dispatchType?.value,
        schemeMode: item?.SchemeMode,
        userID: "",
      };
    });
    // const paylaod = [
    //   {
    //     "panelID": allocationData[0]?.panelID,
    //     "transactionID": data?.transactionID,
    //     "amount": allocationData[0]?.amount,
    //     "allocationType": allocationData[0]?.dispatchType?.value,
    //     "schemeMode": allocationData[0]?.SchemeMode,
    //     "userID": "",
    //   }
    // ]
    try {
      const response =
        await PanelAmountAllocationSavePanelAmountAllocationDetails(payload);
      debugger;
      if (response?.success) {
        notify(response?.message, "success");
        panelAllocationTableData();
        setAllocationData([]);
      } else {
        notify(
          response?.message ? response?.message : response?.data?.Message,
          "error",
        );
      }
    } catch (error) {
      notify(t("Error occurred while processing request"), "error");
    }
  };

  const handleCheckboxChange = (e, item) => {
    const updatedData = allocationData.map((val) => {
      if (val?.panelID === item?.panelID) {
        return {
          ...val,
          checkbox: e.target.checked,
        };
      }
      return val;
    });
    setAllocationData(updatedData);
  };

  // useEffect(() => {
  //   const filteredData = allocationData?.filter((item) => item?.amount > 0);
  //   setAllocationData(filteredData?.map((item) => ({ ...item, checkbox: true })))
  // }, [allocationData]);
 const handleViewExpenseFile = async (item) => {
    

    try {
      const response = await PanelReqquestViewAPI(item?.ID);
      const documentData = response || {};

      if (!response?.success || !documentData?.base64) {
        notify(response?.message || "File not found", "error");
        return;
      }

      const isOpened = openBase64Document(documentData);
      if (!isOpened) {
        notify(t("File not found"), "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("File not found"), "error");
    }
  };

  return (
    <>
      <PatientBillingDetails
        BillDetails={BillDetails}
        heading={t("Patient Bill Details")}
      />
      <div className="card mt-2">
        <Heading
          title={
            <div className="mt-1">
              <HandlePanelPage />
            </div>
          }
        />

        {activeClass === "panel-request" && (
          <>
            <div
              className={`row px-1 mt-2 mb-2 position-relative ${panelDetail?.value ? "pb-4" : ""}`}
            >
              <div className="col-xl-4 col-md-4 col-sm-4 col-12">
                <div className="row">
                  {!panelDetail?.PanelApprovalDetailError ? (
                    <ReactSelect
                      placeholderName={t("Panel")}
                      // isDisabled={true}
                      name="Panel"
                      inputId="Panel"
                      dynamicOptions={panelList}
                      value={panelDetail?.value}
                      handleChange={(name, value) => {
                        setPanelDetail(value);
                      }}
                      searchable={true}
                      respclass="col-11"
                      requiredClassName="required-fields"
                    />
                  ) : (
                    <div className="col-11">
                      <label
                        className="text-danger"
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "block",
                          padding: "10px",
                          backgroundColor: "#fff3cd",
                          border: "1px solid #ffc107",
                          borderRadius: "4px",
                        }}
                      >
                        <i className="fa fa-exclamation-triangle mr-2"></i>
                        {panelDetail?.PanelApprovalDetailError}
                      </label>
                    </div>
                  )}
                  <div className="col-1">
                    {seeMore.length > 0 && (
                      <SeeMore
                        Header={
                          <div
                            style={{
                              position: "relative",
                              right: "1px",
                              top: "2px",
                            }}
                          >
                            {panelDetail?.PanelApprovalDetailError ? (
                              ""
                            ) : (
                              <div className="box-inner">
                                <button
                                  className="btn btn-sm btn-primary"
                                  type="button"
                                  onClick={() =>
                                    ModalComponent(
                                      seeMore[0]?.name,
                                      seeMore[0]?.component,
                                    )
                                  }
                                >
                                  <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        }
                      ></SeeMore>
                    )}
                  </div>
                </div>
              </div>

              {handleDataInDetailView?.length > 0 &&
              panelDetail?.value &&
              panelDetail?.PanelName !== "Cash" ? (
                <>
                  {handleDataInDetailView?.map((data, index) => (
                    <div
                      className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
                      key={index}
                      style={{
                        display: "grid",
                        alignItems: "center",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <LabeledInput
                          label={data?.label}
                          value={data?.value}
                          className={"w-100"}
                          style={{ textAligns: "right" }}
                        />
                      </div>
                    </div>
                  ))}
                  <Input
                    type="text"
                    className="form-control "
                    id="ApprovalRemarks"
                    name="ApprovalRemarks"
                    value={
                      panelDetail?.ApprovalRemarks
                        ? panelDetail?.ApprovalRemarks
                        : ""
                    }
                    onChange={handleChange}
                    lable={t("Remark")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2 "
                    showTooltipCount={true}
                  />
                  <Input
                    type="text"
                    className="form-control required-fields"
                    id="approvalAmount"
                    name="approvalAmount"
                    value={
                      panelDetail?.approvalAmount
                        ? panelDetail?.approvalAmount
                        : ""
                    }
                    onChange={(e) => {
                      inputBoxValidation(AMOUNT_REGX(8), e, handleChange);
                    }}
                    lable={t("Amount")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2 "
                    showTooltipCount={true}
                  />
                    <div className="ml-2 mr-2">
                <BrowseButton
                  label={t("UploadFile")}
                  handleImageChange={handleImageChange}
                />
              </div>
                  <div
                    // className="position-absolute"
                    // style={{ right: "10px", bottom: "0px" }}
                  >
                    <button
                      className="btn btn-sm btn-primary "
                      type="button"
                      onClick={savePanelDetail}
                    >
                      {t("Save")}
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            {tBody?.length > 0 && (
              <div className="card mt-2">
                <Heading title={t("PanelRequestDetails")}> </Heading>

                <Tables
                  thead={tHead}
                  tbody={tBody?.map((item, index) => ({
                    // IPDNo: item?.IPDNo,
                    Company_Name: item?.Company_Name,
                    PolicyNumber: item?.PolicyNumber,
                    ApprovalAmount: item?.ApprovalAmount,
                    ApprovalRemark: item?.ApprovalRemark,
                    Approval_Send_On: item?.Approval_Send_On,
                    Create_By: item?.Create_By ? item?.Create_By : "",
                    View:   item?.emailFileUpload?<i
                      className="fa fa-eye pointer"
                      title={item?.ExpenceFile || item?.expenceFile || t("View File")}
                      onClick={() => handleViewExpenseFile(item)}
                    />:null,
                    print: item?.IsPanelAllocation == 0 && (
                      <>
                        <div
                          id="Reject"
                          className="fa fa-trash cursor-pointer text-danger"
                          onClick={() => handlePanelReject(item?.ID)}
                        ></div>
                      </>
                    ),
                  }))}
                  style={{ maxHeight: "25vh" }}
                />
              </div>
            )}
          </>
        )}
        {activeClass === "panel-approval" && (
          <>
            {rejectVisible && (
              <Modal
                modalWidth={"500px"}
                visible={rejectVisible}
                setVisible={setRejectVisible}
                Header={t("Reject Panel Approval")}
                footer={
                  <>
                    <div className="col-12 d-flex justify-content-end">
                      {/* <button
                        className="btn btn-sm btn-danger"
                        // onClick={handlePanelApprovalReject}
                      >
                        Reject
                      </button> */}
                      {/* <button
                        className="btn btn-sm btn-primary mx-2"
                        style={{ backgroundColor: "red", border: 0 }}
                      >
                        Cancel
                      </button> */}
                    </div>
                  </>
                }
              >
                <PanelApprovalRejectModal
                  rejectVisible={rejectVisible}
                  setRejectVisible={setRejectVisible}
                  tableData={rejectVisible?.showData}
                  data={data}
                  BillDetails={BillDetails}
                  GetPanelApprovalSearchAPI={GetPanelApprovalSearchAPI}
                />
              </Modal>
            )}

            <div className="row px-1 mt-2 mb-2 position-relative ">
              {/* <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <div className="d-flex align-items-center">
                  <LabeledInput
                    label={t("BillAmount")}
                    value={panelApproveData?.amountBilled}
                    className={"w-100"}
                    style={{ textAligns: "right" }}
                  />
                </div>
              </div> */}

              <ReactSelect
                placeholderName={t("Panel")}
                searchable={true}
                requiredClassName={"required-fields"}
                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                id={"PanelApproval"}
                name={"PanelApproval"}
                // PatientCashAmt
                dynamicOptions={panelApprovalList}
                value={panelApprovalDetails?.PanelApproval?.value}
                // requiredClassName="required-fields"
                // handleChange={(name, value) => { setPanelApprovalDetails((val)=>({...val,[name]:value})) }}
                handleChange={handleReactSelect}
              />

              {/* <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <div className="d-flex align-items-center">
                  <LabeledInput
                    label={t("PatientAmount")}
                    value={BillDetails?.PatientPaybleAmt}
                    className={"w-100"}
                    style={{ textAligns: "right" }}
                  />
                </div>
              </div> */}

              <Input
                type="text"
                className="form-control required-fields"
                id="PanelApprovalAmount"
                name="PanelApprovalAmount"
                value={
                  panelApprovalDetails?.PanelApprovalAmount
                    ? panelApprovalDetails?.PanelApprovalAmount
                    : ""
                }
                onChange={(e) => {
                  inputBoxValidation(AMOUNT_REGX(8), e, handleChangeApproval);
                }}
                lable={t("PanelApprovalAmount")}
                placeholder=" "
                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                showTooltipCount={true}
              />
              <DatePicker
                className="custom-calendar"
                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                id="ApprovalDate"
                name="ApprovalDate"
                value={
                  panelApprovalDetails?.ApprovalDate
                    ? new Date(panelApprovalDetails?.ApprovalDate)
                    : new Date()
                }
                handleChange={handleChangeApproval}
                lable={t("ApprovalDate")}
                placeholder={VITE_DATE_FORMAT}
              />

              <Input
                type="text"
                className="form-control "
                id="ClaimNo"
                name="ClaimNo"
                value={
                  panelApprovalDetails.ClaimNo
                    ? panelApprovalDetails.ClaimNo
                    : ""
                }
                onChange={(e) => {
                  inputBoxValidation(CLAIM_REGX(30), e, handleChangeApproval);
                }}
                lable={t("ClaimNo")}
                placeholder=" "
                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                showTooltipCount={true}
              />

              {/* <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <div className="d-flex align-items-center">
                  <LabeledInput
                    label={t("FinalApprovalAmount")}
                    // value={
                    //   panelApproveData?.dt[0]?.PanelApprovedAmt
                    //     ? panelApproveData?.dt[0]?.PanelApprovedAmt
                    //     : ""
                    // }
                    className={"w-100"}
                    style={{ textAligns: "right" }}
                  />
                </div>
              </div> */}

              <ReactSelect
                placeholderName={t("PanelApprovalType")}
                requiredClassName={"required-fields"}
                searchable={true}
                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                id={"PanelApprovalType"}
                name={"PanelApprovalType"}
                value={panelApprovalDetails?.PanelApprovalType?.value}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(PanelApprovalType, t)}
              />

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-0">
                <TextAreaInput
                  lable={t("Remarks")}
                  className="w-100 required-fields h-24"
                  id="Remarks"
                  rows={2}
                  name="Remarks"
                  placeholder=""
                  value={
                    panelApprovalDetails?.Remarks
                      ? panelApprovalDetails?.Remarks
                      : ""
                  }
                  onChange={handleChangeApproval}
                  maxLength={300}
                />
                {/* <div style={{ position: "absolute", top: "35px" }}> {handleIndicator(panelApprovalDetails?.Remarks)}</div> */}
              </div>

              <ReactSelect
                placeholderName={t("AmountApprovalType")}
                searchable={true}
                requiredClassName={"required-fields"}
                respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
                id={"AmountApprovalType"}
                name={"AmountApprovalType"}
                value={panelApprovalDetails?.AmountApprovalType?.value}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(AmountApprovalType, t)}
              />
              {/* <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"> */}
              {/* <div className="d-flex align-items-center"> */}
              <div className="ml-2 mr-2">
                <BrowseButton
                  label={t("BrowseApprovalFile")}
                  handleImageChange={handleImageChange}
                />
              </div>

              {/* </div> */}
              {/* </div> */}
              <div
                className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
                style={{ right: "10px", bottom: "0px" }}
              >
                <button
                  className="btn btn-sm btn-primary "
                  type="button"
                  onClick={handleUpdateBilling}
                >
                  {t("UpdateBilling")}
                </button>
              </div>
            </div>

            <div className="card mt-2">
              <Heading title={t("Panel Approval Details")}></Heading>

              <Tables
                thead={tHeadApproval}
                tbody={panelApproalTbody?.map((item, index) => ({
                  // IPDNo: item?.TransactionID,
                  PanelName: item?.Company_Name,
                  ApprovalAmount: item?.PanelApprovedAmt,
                  ApprovalDate: item?.PanelApprovalDate,
                  ClaimNo: item?.ClaimNo,
                  ApprovalType: item?.PanelApprovalType,
                  Remarks: item?.PanelAppRemarks,
                  AmtAppType: item?.AmountApprovalType,
                  AppExpiryDate: item?.AppExpiryDate,
                  CreatedBy: item?.UserID,
                  CurrentStatus: item?.CurrentStatus,
                  View: item?.ApprovalFileName?(
                    <i
                      className="fa fa-eye"
                      onClick={() => handleViewDocument(item)}
                      style={{ cursor: "pointer" }}
                      title={t("Download document")}
                    ></i>
                  ):null,
                  Edit: String(item?.CurrentStatus) !== "Rejected" && (
                    <>
                      {console.log(item?.CurrentStatus)}
                      <i
                        className="fa fa-edit"
                        onClick={() => handleTableDetails(item, index)}
                        style={{ cursor: "pointer" }}
                      ></i>
                    </>
                  ),
                  Reject: !shouldShowImage &&
                    String(item?.CurrentStatus) !== "Rejected" && (
                      <i
                        className="fa fa-trash"
                        onClick={() => {
                          setRejectVisible({
                            rejectVisible: true,
                            showData: item,
                          });
                        }}
                        style={{ marginLeft: "10px", color: "red" }}
                      ></i>
                    ),
                  // print: (
                  //   <div className="">
                  //     <ReprintSVG />
                  //   </div>
                  // ),
                }))}  
                scrollView={"scrollView"}
                style={{ maxHeight: "25vh" }}
              />
            </div>
          </>
        )}
        {activeClass === "panel-allocation" && (
          <>
            <div className="row px-1 mt-2 mb-2 position-relative">
              <div className="col-xl-4 col-md-4 col-sm-4 col-12">
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Panel")}
                    name="Panel"
                    inputId="Panel"
                    dynamicOptions={allocationPanel?.map((val) => ({
                      label: val?.Company_Name,
                      value: val?.PanelID,
                    }))}
                    value={allocationPanelDetail?.value}
                    handleChange={(name, value) => {
                      setAllocationPanelDetail(value);
                    }}
                    searchable={true}
                    respclass="col-11"
                    requiredClassName="required-fields"
                  />
                  {/* <div className="col-1">
                    <div
                      style={{
                        position: "relative",
                        right: "1px",
                        top: "2px",
                      }}
                    >
                      <div className="box-inner">
                        <button
                          className="btn btn-sm btn-primary"
                          type="button"
                          onClick={() =>
                            handleAllocationModal()
                          }
                        >
                          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
                        </button>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
              {allocationData?.length > 0 && (
                <div className="col-xl-12 col-md-12 col-sm-12 col-12 mt-1">
                  <Heading title={t("Panel Amount Allocation Details")} />
                  <Tables
                    thead={allocationThead}
                    tbody={allocationData?.map((val, index) => ({
                      checkbox: (
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          onChange={(e) => handleCheckboxChange(e, val)}
                          checked={val?.checkbox || false}
                        />
                      ),
                      "S.No.": index + 1,
                      panelGroup: val?.PanelGroup,
                      panelName: val?.panelName,
                      allocatedAmount: val?.allocatedAmount
                        ? String(val?.allocatedAmount)
                        : "0",
                      amount: (
                        <Input
                          type="number"
                          className="table-input"
                          removeFormGroupClass={true}
                          name="amount"
                          placeholder={t("Amount")}
                          value={val.amount}
                          onChange={(e) =>
                            handleRowChange(index, "amount", e.target.value)
                          }
                        />
                      ),
                      dispatchType: (
                        <CustomSelect
                          requiredClassName="required-fields"
                          isRemoveSearchable={true}
                          option={[
                            { label: t("Credit"), value: "CR" },
                            { label: t("Debit"), value: "DR" },
                          ]}
                          placeHolder={t("Select")}
                          value={val?.dispatchType?.value}
                          name="dispatchType"
                          onChange={(name, e) =>
                            handleCustomSelect(index, name, e)
                          }
                        />
                      ),
                      entryBy: val?.EmpName,
                      // "schemeMode": (
                      //   <CustomSelect
                      //     isRemoveSearchable={true}
                      //     option={[
                      //       { label: "Credit", value: "CR" },
                      //       { label: "Debit", value: "DR" }
                      //     ]}
                      //     placeHolder="Select"
                      //     value={val?.schemeMode}
                      //     onChange={(name, e) => handleCustomSelect(index, name, e)}
                      //     name="schemeMode"
                      //   />
                      // ),
                    }))}
                  />
                  <div className="d-flex justify-content-end p-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSave(allocationData)}
                    >
                      {t("Save")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <OverLay
        visible={visible}
        setVisible={setVisible}
        Header={renderComponent?.name}
      >
        {renderComponent?.component}
      </OverLay>

      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={() => {
            setHandleModelData((val) => ({
              ...val,
              isOpen: !handleModelData?.isOpen,
            }));
          }}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"submit"}
          buttons={handleModelData?.extrabutton}
          buttonName={handleModelData?.buttonName}
          // modalData={modalData}
          // setModalData={setModalData}
          footer={handleModelData?.footer}
          // handleAPI={handleModelData?.handleInsertAPI}
          // CancelbuttonName={handleModelData?.CancelbuttonName}
        >
          {handleModelData?.Component}
        </Modal>
      )}
    </>
  );
};

export default PanelApprovalRequest;
