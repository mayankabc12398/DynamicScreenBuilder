import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import DetailsCardForDefaultValue from "../../../components/commonComponents/DetailsCardForDefaultValue";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import {
  AdvanceTypeOption,
  BillAccountOption,
  MOBILE_NUMBER_VALIDATION_REGX,
  PAYMENT_OBJECT,
  ROUNDOFF_VALUE,
} from "../../../utils/constant";
import Input from "../../../components/formComponent/Input";
import Modal from "../../../components/modalComponent/Modal";
import Button from "../../../components/formComponent/Button";
import PaymentGateway from "../../../components/front-office/PaymentGateway";
import IPDAdvanceSearchByPatient from "../../../components/commonComponents/IPDAdvanceSearchByPatient";
import {
  BillingSavePayload,
  calculateBillAmount,
  filterByTypes,
  handleReactSelectDropDownOptions,
  inputBoxValidation,
  notify,
} from "../../../utils/utils";
import { debounce } from "../../../networkServices/axiosInstance";
import {
  BillingSaveSaveServicesBilling,
  BindHospLedgerAccount,
  CommonReceiptPdf,
  GetApproval,
  getApproveBy,
  getCTBRequestDetail,
  GetDiscReason,
  GetPatientReceipt,
  SaveDiscReason,
  SaveIPDAdvance,
  SelectIPDDetail,
} from "../../../networkServices/BillingsApi";
import UserPasswordVerificationModal from "../../../components/modalComponent/Utils/patientBillingModal/UserPasswordVerificationModal";
import { bindHashCode } from "../../../networkServices/opdserviceAPI";
import moment from "moment";
import CTBModal from "../../../components/modalComponent/Utils/CTBModal";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { OpenPDFURL, RedirectURL } from "../../../networkServices/PDFURL";
import PatientAdvanceDetailTable from "../../../components/UI/customTable/billings/PatientAdvanceDetailTable";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { GetBindResourceList } from "../../../store/reducers/common/CommonExportFunction";
import { useLocation } from "react-router-dom";
import Tables from "../../../components/UI/customTable";
import { SaveIPDAdvancePayload, isRefundFunIPD } from "../../../utils/ustil2";
import { translateOptions } from "@components/WrapTranslate";
const IPDAdmissionNew = ({ data, onSaved }) => {
  const [t] = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const userData = useLocalStorage("userData", "get");
  const [userConfirmation, setUserConfirmation] = useState(false);

  const [singlePatientData, setSinglePatientData] = useState({});
  const [paymentMethod, setPaymentMethod] = useState([{ PaymentMode: "Cash" }]);
  const [paientAdvanceDetails, setPaientAdvanceDetails] = useState([]);
  const location = useLocation();
  const dispatch = useDispatch();
  const { BindResource } = useSelector((state) => state?.CommonSlice);
  const [paymentControlModeState, setPaymentControlModeState] =
    useState(PAYMENT_OBJECT);

  const initialState = {
    Type: "IPD",
    BillAccount:
      singlePatientData?.dtAdjust?.STATUS === "OUT" &&
      singlePatientData?.dtAdjust?.BillNo !== ""
        ? "LSHHI12"
        : "LSHHI11",
    // BillAccount: "LSHHI11",
    ReasonID: "",
    Approval: "",
    amount: "",
    // amount: "",
  };

  const [payload, setPayload] = useState({
    ...initialState,
  });
  const [CTBList, setCTBList] = useState([]);
  const [CTBSelectedList, setCTBSelectedList] = useState([]);
  const [dataFromChild, setDataFromChild] = useState(null);
  const [advanceReason, setAdvanceReason] = useState([]);
  const [approval, setApproval] = useState([]);
  const [billPay, setBillPay] = useState([]);
  useEffect(() => {
    dispatch(GetBindResourceList());
  }, []);
  const getBindCTBRequestDetail = async () => {
    try {
      const TID = singlePatientData?.dtAdjust?.TransactionID;

      const response = await GetApproval(TID);

      if (response?.success) {
        let data = response?.data?.map((val) => {
          val.isChecked = false;
          return val;
        });
        setCTBList(data);
      } else {
        setCTBList([]);
      }
    } catch (error) {
      console.error("Error fetching CBT request details:", error);
    }
  };

  const GetBindHospLedgerAccount = async (type) => {
    try {
      const response = await BindHospLedgerAccount();
      if (response?.success) {
        setBillPay(response?.data);
      } else {
        if (!type) {
          notify(response?.message, "error");
        }
      }
    } catch (error) {
      console.error("Error fetching CBT request details:", error);
    }
  };

  useEffect(() => {
    if (payload?.Type === "CTB") {
      getBindCTBRequestDetail();
    }
    if (payload?.Type === "IPD") {
      GetBindHospLedgerAccount(payload?.Type);
    }
  }, [payload?.Type]);

  const handleSinglePatientData = async (data) => {
    setDataFromChild(data);
    const { PatientID, TransactionID } = data;
    try {
      const data = await SelectIPDDetail(PatientID, TransactionID);
      setSinglePatientData(data?.data);
      // if(data?.data?.dtAdjust?.PaymentType===""){
      //   setBillPay(billPay.filter((ele) => ele?.LedgerNumber === 2));
      // }
    } catch (error) {
      console.log(error);
    }
  };
  // Opened from a patient's billing screen: the patient is already known, so load
  // that stay straight away instead of asking for a UHID / IPD No. search.
  useEffect(() => {
    const patientID = data?.PatientID || data?.patientID;
    const transactionID = data?.TransactionID || data?.transactionID;
    if (!patientID || !transactionID) return;
    handleSinglePatientData({
      PatientID: patientID,
      TransactionID: transactionID,
      pname: data?.pname || data?.patientName || data?.PatientName || data?.PName,
      IPDNo: data?.IPDNo || data?.ipdNo || data?.ipdno,
      roomno: data?.roomno || data?.roomNo || data?.RoomName,
    });
  }, [data?.TransactionID, data?.transactionID]);
  const handleGetPatientAdjustmentDetails = async () => {
    const TransactionID = singlePatientData?.dtAdjust?.TransactionID;
    try {
      const response = await GetPatientReceipt(TransactionID);
      if (response?.success) {
        setPaientAdvanceDetails(response?.data);
      } else {
        setPaientAdvanceDetails([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log("firstfirst", billPay);
  const sendReset = () => {
    setSinglePatientData({});
    setPaymentControlModeState(PAYMENT_OBJECT);
    setPaymentMethod([]);
    // setPaientAdvanceDetails([]);
    setPayload(initialState);
    setPaientAdvanceDetails([]);
  };

  const handlePaymentGateWay = useCallback((details) => {
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
      // disableDiscount: true,
      // coPayIsDefault: true,
    };
    setPaymentMethod([]);
    setPaymentControlModeState(setData);
    // handleGetPatientAdjustmentDetails();
  }, []);

  // const handleSaveAPI = async () => {
  //   try {

  //     if (Number(paymentControlModeState?.paidAmount) === 0) {
  //       notify("Please enter paid amount", "error");
  //       return
  //     }

  //     const savepayload = SaveIPDAdvancePayload(paymentMethod, payload, dataFromChild, paymentControlModeState, CTBSelectedList, singlePatientData)
  //     const response = await SaveIPDAdvance(savepayload);
  //     if (response?.success) {
  //       setPaientAdvanceDetails([]);
  //       notify(response?.message, "success");
  //       sendReset();
  //       // handleGetPatientAdjustmentDetails();
  //       // handleBillingSaveSaveServicesBilling();
  //       const reportResp = await CommonReceiptPdf({
  //         ledgerTransactionNo: "1",
  //         isBill: 0,
  //         receiptNo: String(response?.data),
  //         duplicate: "",
  //         type: "IPD",
  //         supplierID: "",
  //         billNo: "",
  //         isEMGBilling: "",
  //         isOnlinePrint: "",
  //         isRefound: 0,
  //       });
  //       if (reportResp?.success) {
  //         RedirectURL(reportResp?.data?.pdfUrl);
  //       } else {
  //         notify(reportResp?.data?.message, "error");
  //       }
  //     } else {
  //       notify(response?.message, "error");
  //     }
  //   } catch (error) {
  //     console.error("Something went wrong", error);
  //   }
  // };

  const executeSaveAdvance = async () => {
    try {
      const savepayload = SaveIPDAdvancePayload(
        paymentMethod,
        payload,
        dataFromChild,
        paymentControlModeState,
        CTBSelectedList,
        singlePatientData,
      );
      const response = await SaveIPDAdvance(savepayload);

      if (response?.success) {
        setPaientAdvanceDetails([]);
        notify(response?.message, "success");
        sendReset();
        // Check if the response data is not empty before calling CommonReceiptPdf
        if (response?.data && response?.data !== "") {
          const reportResp = await CommonReceiptPdf({
            ledgerTransactionNo: "1",
            isBill: 0,
            receiptNo: String(response?.data),
            duplicate: "",
            type: "IPD",
            supplierID: "",
            billNo: "",
            isEMGBilling: "",
            isOnlinePrint: "",
            isRefound: 0,
            isLogo:1 
          });
          if (reportResp?.success) {
            RedirectURL(reportResp?.data?.pdfUrl);
          } else {
            notify(
              reportResp?.data?.message || "Error generating receipt.",
              "error",
            );
          }
        }
        // Opened from a patient's billing screen: the receipt has been sent to print, so close the pop-up.
        onSaved?.();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
      notify(t("Something went wrong. Please try again."), "error");
    }
  };



  const handleSaveAPI = async () => {
    if (Number(paymentControlModeState?.paidAmount) === 0) {
      notify("Please enter paid amount", "error");
      return;
    }

    if (userData?.validateUserForBill) {
      setUserConfirmation(true);
    } else {
      executeSaveAdvance();
    }
  };

  useEffect(() => {
    if (singlePatientData?.dtAdjust?.TransactionID) {
      handleGetPatientAdjustmentDetails();
    }
  }, [singlePatientData?.dtAdjust?.TransactionID]);

  useEffect(() => {
    setPaymentControlModeState({
      ...paymentControlModeState,
      patientAdvanceAmount: Number(singlePatientData?.dtAdjust?.PatientAdvance),
    });
  }, [singlePatientData?.dtAdjust?.PatientAdvance]);

  return (
    <>
      {userConfirmation && (
        <UserPasswordVerificationModal
          visible={userConfirmation}
          setVisible={setUserConfirmation}
          userId={userData?.employeeID}
          onSuccess={executeSaveAdvance}
        />
      )}
      <div className="card patient_registration border">
        <Heading title={t("Search Criteria")} isBreadcrumb={true} />
        {!data && Object.keys(singlePatientData)?.length === 0 ? (
          <IPDAdvanceSearchByPatient
            onClick={handleSinglePatientData}
            data={data}
          />
        ) : (
          <>
            <DetailCard
              singlePatientData={singlePatientData}
              handlePaymentGateWay={handlePaymentGateWay}
              sendReset={sendReset}
              data={data}
              payload={payload}
              setPayload={setPayload}
              CTBList={CTBList}
              CTBSelectedList={CTBSelectedList}
              setCTBSelectedList={setCTBSelectedList}
              setCTBList={setCTBList}
              dataFromChild={dataFromChild}
              advanceReason={advanceReason}
              approval={approval}
              setAdvanceReason={setAdvanceReason}
              setApproval={setApproval}
              handleGetPatientAdjustmentDetails={
                handleGetPatientAdjustmentDetails
              }
              GetBindHospLedgerAccount={GetBindHospLedgerAccount}
              setBillPay={setBillPay}
              billPay={billPay}
              paientAdvanceDetails={paientAdvanceDetails}
            />
          </>
        )}
      </div>

      <PaymentGateway
        screenType={paymentControlModeState}
        setScreenType={setPaymentControlModeState}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        button={
          <button className="button" onClick={handleSaveAPI}>
            {/* Same rule the save uses (isRefundFunIPD), so the label always matches what will be posted:
                "IPD Advance" saves as an advance even if the patient has already paid more than the bill. */}
            {Number(
              isRefundFunIPD(
                payload?.BillAccount,
                singlePatientData?.dtAdjust?.isRefund,
              ),
            ) === 1
              ? t("Refund")
              : t("Save")}
          </button>
        }
      />
      {/* {(paientAdvanceDetails?.length > 0 && paymentMethod?.length > 0) && ( */}
      {paientAdvanceDetails?.length > 0 && (
        <div className="card mt-2">
          <div className="row">
            <PatientAdvanceDetailTable tbody={paientAdvanceDetails} />
          </div>
        </div>
      )}
    </>
  );
};

export default IPDAdmissionNew;

const DetailCard = ({
  singlePatientData,
  handlePaymentGateWay,
  sendReset,
  data,
  payload,
  setPayload,
  CTBList,
  CTBSelectedList,
  setCTBSelectedList,
  setCTBList,
  dataFromChild,
  setAdvanceReason,
  setApproval,
  handleGetPatientAdjustmentDetails,
  GetBindHospLedgerAccount,
  billPay,
  setBillPay,
}) => {
  const [t] = useTranslation();
   const { BindResource } = useSelector((state) => state?.CommonSlice);
  const [handleModelData, setHandleModelData] = useState({});
  const [modalData, setModalData] = useState({});
  const [totalNetAmount, setTotalNetAmount] = useState(0);
  const localData = useLocalStorage("userData", "get");
  const calculateAndHandlePayment = useCallback(
    (value) => {
      const data = calculateBillAmount(
        [
          {
            panelID: 1,
            grossAmount: Math.abs(Number(value)),
            discountAmount: 0,
            PayableAmount: Math.abs(Number(value)),
          },
        ],
        "1",
        singlePatientData?.dtAdjust?.PatientAdvance,
        // Number(payload?.amount) > 0 ? 0 : 1,
        Number(value) > 0 ? 0 : 1,
        0,
        1,
        1,
        1,
      );
      handlePaymentGateWay(data);
    },
    [singlePatientData, handlePaymentGateWay],
  );
  const [modalHandlerState, setModalHandlerState] = useState({
    header: null,
    show: false,
    size: null,
    component: null,
    footer: null,
  });

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

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  useEffect(() => {
    setHandleModelData((val) => ({ ...val, modalData: modalData }));
  }, [modalData]);

  useEffect(() => {
    // let netAmt = singlePatientData?.dtAdjust?.netBalanceAmount
    if (payload?.amount) {
      setTotalNetAmount(payload?.amount);
      calculateAndHandlePayment(payload?.amount);
    }
  }, [payload?.amount, calculateAndHandlePayment]);
  const handleChangeModel = (data) => {
    setModalData(data);
  };

  const handleReactSelect = async (name, value) => {
    console.log(name);
    setPayload((prevData) => ({
      ...prevData,
      [name]: value?.value,
      amount: "",
    }));
  };
  const handleReactSelectItem = (name, value) => {
    setPayload((val) => ({ ...val, [name]: value?.value }));
  };
  const handleReactSelectChange = async (name, selectedOption) => {
    if (name == "Type") {
      setTotalNetAmount(0);
      if (selectedOption?.value) {
        GetBindHospLedgerAccount();
      }
      await GetBindDiscReason(selectedOption?.value);
      setPayload((prevPayload) => ({
        ...prevPayload,
        [name]: selectedOption?.value,
      }));
    } else {
      setPayload((prevPayload) => ({
        ...prevPayload,
        [name]: selectedOption,
      }));
    }
  };

  const getBindApproveBy = async () => {
    try {
      const response = await getApproveBy();
      setApproval([response?.data]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateAdvanceReason = async (data) => {
    try {
      const DiscReason = data?.advanceReason;
      const Type = payload?.Type;
      let insData = await SaveDiscReason(DiscReason, Type);
      if (insData?.success) {
        GetBindDiscReason(payload?.Type);
        setModalData({});
        setHandleModelData((val) => ({ ...val, isOpen: false }));
      }
    } catch (error) {
      console.error("Error creating advance reason:", error);
    }
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount" && payload?.BillAccount === "IPD-Settlement") {
      if (value > Math.abs(singlePatientData?.dtAdjust?.patientBalanceAmount)) {
        return;
      }
    }
    if (name === "amount" && payload?.BillAccount === "IPD-Refund") {
      if (value > Number(singlePatientData?.dtAdjust?.TotalPaidAmount)) {
        return;
      }
    }
    setPayload({
      ...payload,
      [name]: value,
    });
    // if (name === amount) {
    // handleGetPatientAdjustmentDetails();
    // }
    // debouncedCalculateAndHandlePayment(value);
  };
  const handleDataInDetailView = useMemo(() => {
    //
    if (Object.keys(singlePatientData)?.length > 0) {
      const data = [];

      // singlePatientData?.dtAdjust?.forEach((adjustItem, index) => {
      const adjustItem = singlePatientData?.dtAdjust;
      //
      data.push(
        {
          label: t(`UHID`),
          value: dataFromChild?.PatientID ?? "",
        },
        {
          label: t(`Patient Name`),
          value: dataFromChild?.pname,
        },
        {
          label: t(`IPD No.`),
          value: dataFromChild?.IPDNo,
        },
        {
          label: t(`Age/Gender `),
          value: adjustItem?.CurrentAgeGender ?? "",
        },
        {
          label: t(`Room`),
          value: dataFromChild?.roomno,
        },
        {
          label: t(`Address`),
          value: dataFromChild?.Address,
        },
        {
          label: t(`Status `),
          value: adjustItem?.STATUS ?? "",
        },
        {
          label: t("Main Panel"),
          value: dataFromChild?.company_name,
        },
        {
          label: t("Net Bill Amount"),
          value:
            Number(adjustItem?.NetAmount)?.toFixed(ROUNDOFF_VALUE) ?? "0.00",
          // Number(adjustItem?.s_Amount)?.toFixed(ROUNDOFF_VALUE) ?? "0.00",
        },
        {
          label: t("Total Paid Amount"),
          value: adjustItem?.TotalPaidAmount ?? "0.00",
          // value: singlePatientData?.paidAmt ?? "0.00",
        },
        {
          label: t("Balance Amount"),
          value: adjustItem?.netBalanceAmount ?? "0.00",
          // Number(adjustItem?.NetAmount)?.toFixed(ROUNDOFF_VALUE) - singlePatientData?.TotalPaidAmount ?? "0.00",
        },
        {
          label: t("Round Off"),
          value: Number(adjustItem?.roundOff).toFixed(ROUNDOFF_VALUE) ?? "0.00",
        },
        {
          label: t("Panel Approved Amount"),
          value:
            Number(adjustItem?.PanelApprovedAmt).toFixed(ROUNDOFF_VALUE) ??
            "0.00",
        },
        {
          label: t("Panel Payable Amount"),
          value: Number(adjustItem?.PanelPaybleAmt).toFixed(ROUNDOFF_VALUE),
          // value: Number(adjustItem?.panelPaybleAmt).toFixed(ROUNDOFF_VALUE),
        },
        {
          label: t("Panel Paid Amount"),
          value: Number(adjustItem?.PanelPaidAmt).toFixed(ROUNDOFF_VALUE),
        },
        {
          label: t("Panel Balance Amount"),
          value: adjustItem?.PanelBalanceAmount ?? "0.00",
        },
        {
          label: t("Patient Payable Amount"),
          value:
            Number(adjustItem?.PatientPaybleAmt).toFixed(ROUNDOFF_VALUE) ??
            "0.00",
        },
        {
          label: t("Patient Paid Amount"),
          value:
            Number(adjustItem?.PatientPaidAmt).toFixed(ROUNDOFF_VALUE) ??
            "0.00",
        },
        {
          label: t("Patient Balance Amount"),
          value: adjustItem?.patientBalanceAmount ?? "0.00",
        },
      );
      // });

      singlePatientData?.dt?.forEach((dtItem, index) => {
        data.push(
          {
            label: t(`Doctor `),
            value: dtItem?.doctorName ?? "",
          },
          {
            label: t(`Admission Date `),
            value:
              moment(dtItem?.dateOfAdmit).format("DD-MMM-YYYY hh:mm A") ?? "",
          },
          {
            label: t(`Discharge Date `),
            value:
              moment(dtItem?.dateOfDischarge).format("DD-MMM-YYYY hh:mm A") ??
              "",
          },
        );
      });

      return data;
    } else {
      return [];
    }
  }, [singlePatientData]);

  const handleModalState = () => {
    setModalHandlerState({
      show: true,
      header: "CBT Details",
      size: "40vw",
      component: (
        <CTBModal tbody={CTBList} CTBList={CTBList} setCTBList={setCTBList} />
      ),
      footer: (
        <div>
          <div className="d-flex align-items-center justify-content-end">
            <div>
              <Button
                name={"Add"}
                className={"btn btn-sm btn-primary mx-1"}
                handleClick={handleAddAPI}
              />
            </div>
          </div>
        </div>
      ),
    });
  };
  const GetBindDiscReason = async (Type) => {
    try {
      const { data } = await GetDiscReason(Type);
      setAdvanceReason(data);
    } catch (error) {
      console.error("Error fetching discount reasons:", error);
    }
  };

  const commonFetchAllDropDown = async () => {
    try {
      const [discReasonResponse] = await Promise.all([
        GetDiscReason(payload?.Type),
      ]);
      return {
        discReasonResponse,
      };
    } catch (error) {
      console.log("Something went wrong during dropdown fetching:", error);
      return {};
    }
  };

  const FetchAllDropDown = async () => {
    try {
      const responseDropdown = await commonFetchAllDropDown();
      if (responseDropdown.discReasonResponse) {
        setAdvanceReason(responseDropdown.discReasonResponse?.data);
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  useEffect(() => {
    if (payload?.Type) {
      FetchAllDropDown();
    }
    getBindApproveBy();
  }, [payload?.Type]);

  const handleAddAPI = async () => {
    const newArr = CTBList.filter((ele) => ele?.isChecked === true);
    let totalAmount = 0;
    CTBList?.map((val) => {
      if (val?.isChecked) {
        totalAmount += val?.NetAmount;
      }
    });
    setTotalNetAmount(totalAmount);
    setCTBSelectedList(newArr);
    setModalHandlerState({
      show: false,
      component: null,
      size: null,
    });
    calculateAndHandlePayment(totalAmount);
  };

  useEffect(() => {
    if (singlePatientData?.dtAdjust?.PaymentType === "") {
      setBillPay(billPay.filter((ele) => ele?.LedgerNumber != 2));
    } else if (
      "ipd-settlement" ===
      singlePatientData?.dtAdjust?.PaymentType.toLowerCase()
    ) {
      setPayload((val) => ({
        ...val,
        amount: singlePatientData?.dtAdjust?.patientBalanceAmount,
        BillAccount: singlePatientData?.dtAdjust?.PaymentType,
      }));
    }
  }, [singlePatientData?.dtAdjust]);
 
  const isMatch = BindResource?.IsAdvanceRefund
  ?.split(",")
  .map(item => Number(item.trim()))
  .includes(localData?.defaultRole);
  useEffect(() => {
    if (billPay && isMatch) {
      if(isMatch){
        setPayload((val) => ({ ...val, BillAccount: "IPD-Refund" }));
      }
      else{
        setPayload((val) => ({ ...val, BillAccount: billPay?.[0]?.LedgerName }));
      }
    }
  }, [billPay,BindResource,isMatch]);
  console.log("singlePatientData",singlePatientData)
  return (
    <>
      <DetailsCardForDefaultValue
        singlePatientData={handleDataInDetailView}
        sendReset={sendReset}
        show={data}
        isElipsis={true}
      >
        {payload?.Type === "IPD" ? (
          <ReactSelect
            placeholderName={t("Payment Type")}
            handleChange={handleReactSelect}
            id={"BillAccount"}
            name={"BillAccount"}
            value={payload?.BillAccount}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            dynamicOptions={handleReactSelectDropDownOptions(
              billPay,
              "LedgerName",
              "LedgerName",
            )}
            // dynamicOptions={billPay.map((ele) => ({
            //   label: ele?.LedgerName,
            //   value: ele?.LedgerNumber,
            // }))}
            searchable={true}
            // isDisabled={singlePatientData?.dtAdjust?.PaymentType.toLowerCase() === "ipd-settlement"}
            // isDisabled={
            //   singlePatientData?.dtAdjust?.patientBalanceAmount < 0
            //     ? false
            //     : true ||
            //       singlePatientData?.dtAdjust?.PaymentType.toLowerCase() ===
            //         "ipd-settlement"
            // }
            isDisabled={
  singlePatientData?.dtAdjust?.patientBalanceAmount < 0
    ? (singlePatientData?.dtAdjust?.PaymentType?.toLowerCase() === "ipd-settlement")
    : isMatch ? true : false
}
          />
        ) : (
          ""
        )}
        <ReactSelect
          placeholderName={t("Advance Type")}
          id={"Type"}
          searchable={true}
          handleChange={handleReactSelectChange}
          value={payload?.Type}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          dynamicOptions={translateOptions(AdvanceTypeOption, t)}
          name={"Type"}
          isDisabled={
            singlePatientData?.dtAdjust?.PaymentType.toLowerCase() ===
            "ipd-settlement"
          }
        />
        <Input
          type="number"
          className="form-control"
          id="amount"
          name="amount"
          onChange={(e) => {
            handleChange(e);
            inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, () => {});
          }}
          // onKeyDown={(e) => {
          //   inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, () => {});
          // }}
          value={payload?.amount ? Math?.abs(Number(payload?.amount)) : ""}
          lable={t("Amount")}
          placeholder=" "
          required={true}
          // disabled={payload?.Type === "CTB" ? true : false}
          disabled={
  payload?.Type === "CTB"
    ? true
    : false
}
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />

        {/* <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
          <div className="box-size">
            <div className="box-upper">
              <ReactSelect
                placeholderName={t("FrontOffice.OPD.OPDAdvance.label.Reason")}
                searchable={true}
                respclass=""
                id="ReasonID"
                name="ReasonID"
                handleChange={handleReactSelectItem}
                // handleChange={handleReactSelectChange}
                value={`${payload?.ReasonID}`}
                dynamicOptions={advanceReason?.map((item) => ({
                  label: item?.DiscountReason,
                  value: item?.ID,
                }))}
              />
            </div>
            <div className="box-inner">
              <button
                className="btn btn-sm btn-primary"
                type="button"
                onClick={() =>
                  handleModel(
                    "Reason Add Modal",
                    "20vw",
                    "Reason",
                    true,
                    <ReasonAddModal handleChangeModel={handleChangeModel} />,
                    handleCreateAdvanceReason
                  )
                }
              >
                <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
              </button>
            </div>
          </div>
        </div>
        <ReactSelect
          placeholderName={t("Approval")}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
          id={"Approval"}
          name={"Approval"}
          value={payload?.Approval}
          dynamicOptions={approval.map((ele) => ({
            value: ele?.ApprovalType,
            label: ele?.ApprovalType,
          }))}
          handleChange={handleReactSelectItem}
        /> */}
        {payload?.Type === "CTB" && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <Button
              name={t("CTB")}
              className="btn btn-sm btn-primary"
              handleClick={() => handleModalState()}
            />
          </div>
        )}
      </DetailsCardForDefaultValue>
      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"submit"}
          modalData={handleModelData?.modalData}
          setModalData={setModalData}
          handleAPI={handleModelData?.handleInsertAPI}
        >
          {handleModelData?.Component}
        </Modal>
      )}
      {modalHandlerState?.show && (
        <Modal
          visible={modalHandlerState?.show}
          setVisible={() =>
            setModalHandlerState({
              show: false,
              component: null,
              size: null,
            })
          }
          modalWidth={modalHandlerState?.size}
          Header={modalHandlerState?.header}
          footer={modalHandlerState?.footer}
        >
          {modalHandlerState?.component}
        </Modal>
      )}
    </>
  );
};



// new Changes......................................................................................................
// import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
// import Heading from "../../../components/UI/Heading";
// import { useTranslation } from "react-i18next";
// import DetailsCardForDefaultValue from "../../../components/commonComponents/DetailsCardForDefaultValue";
// import ReactSelect from "../../../components/formComponent/ReactSelect";
// import {
//   AdvanceTypeOption,
//   BillAccountOption,
//   MOBILE_NUMBER_VALIDATION_REGX,
//   PAYMENT_OBJECT,
//   ROUNDOFF_VALUE,
// } from "../../../utils/constant";
// import Input from "../../../components/formComponent/Input";
// import Modal from "../../../components/modalComponent/Modal";
// import Button from "../../../components/formComponent/Button";
// import PaymentGateway from "../../../components/front-office/PaymentGateway";
// import IPDAdvanceSearchByPatient from "../../../components/commonComponents/IPDAdvanceSearchByPatient";
// import {
//   BillingSavePayload,
//   calculateBillAmount,
//   filterByTypes,
//   handleReactSelectDropDownOptions,
//   inputBoxValidation,
//   notify,
// } from "../../../utils/utils";
// import { debounce } from "../../../networkServices/axiosInstance";
// import {
//   BillingSaveSaveServicesBilling,
//   BindHospLedgerAccount,
//   CommonReceiptPdf,
//   GetApproval,
//   getApproveBy,
//   getCTBRequestDetail,
//   GetDiscReason,
//   GetPatientReceipt,
//   SaveDiscReason,
//   SaveIPDAdvance,
//   SelectIPDDetail,
// } from "../../../networkServices/BillingsApi";
// import UserPasswordVerificationModal from "../../../components/modalComponent/Utils/patientBillingModal/UserPasswordVerificationModal";
// import { bindHashCode } from "../../../networkServices/opdserviceAPI";
// import moment from "moment";
// import CTBModal from "../../../components/modalComponent/Utils/CTBModal";
// import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
// import { OpenPDFURL, RedirectURL } from "../../../networkServices/PDFURL";
// import PatientAdvanceDetailTable from "../../../components/UI/customTable/billings/PatientAdvanceDetailTable";
// import { useDispatch } from "react-redux";
// import { useSelector } from "react-redux";
// import { GetBindResourceList } from "../../../store/reducers/common/CommonExportFunction";
// import { useLocation } from "react-router-dom";
// import Tables from "../../../components/UI/customTable";
// import { SaveIPDAdvancePayload } from "../../../utils/ustil2";
// const IPDAdmissionNew = ({ data }) => {
//   const [t] = useTranslation();
//   const ip = useLocalStorage("ip", "get");
//   const userData = useLocalStorage("userData", "get");
//   const [userConfirmation, setUserConfirmation] = useState(false);

//   const [singlePatientData, setSinglePatientData] = useState({});
//   const [paymentMethod, setPaymentMethod] = useState([{ PaymentMode: "Cash" }]);
//   const [paientAdvanceDetails, setPaientAdvanceDetails] = useState([]);
//   const location = useLocation();
//   const dispatch = useDispatch();
//   const { BindResource } = useSelector((state) => state?.CommonSlice);
//   const [paymentControlModeState, setPaymentControlModeState] =
//     useState(PAYMENT_OBJECT);

//   const initialState = {
//     Type: "IPD",
//     BillAccount:
//       singlePatientData?.dtAdjust?.STATUS === "OUT" &&
//         singlePatientData?.dtAdjust?.BillNo !== ""
//         ? "LSHHI12"
//         : "LSHHI11",
//     // BillAccount: "LSHHI11",
//     ReasonID: "",
//     Approval: "",
//     amount: "",
//     // amount: "",
//   };

//   const [payload, setPayload] = useState({
//     ...initialState,
//   });
//   const [CTBList, setCTBList] = useState([]);
//   const [CTBSelectedList, setCTBSelectedList] = useState([]);
//   const [dataFromChild, setDataFromChild] = useState(null);
//   const [advanceReason, setAdvanceReason] = useState([]);
//   const [approval, setApproval] = useState([]);
//   const [billPay, setBillPay] = useState([]);
//   useEffect(() => {
//     dispatch(GetBindResourceList());
//   }, []);
//   const getBindCTBRequestDetail = async () => {
//     try {
//       const TID = singlePatientData?.dtAdjust?.TransactionID;

//       const response = await GetApproval(TID);

//       if (response?.success) {
//         let data = response?.data?.map((val) => {
//           val.isChecked = false;
//           return val;
//         });
//         setCTBList(data);
//       } else {
//         setCTBList([]);
//       }
//     } catch (error) {
//       console.error("Error fetching CBT request details:", error);
//     }
//   };

//   const GetBindHospLedgerAccount = async (type) => {
//     try {
//       const response = await BindHospLedgerAccount();
//       if (response?.success) {
//         setBillPay(response?.data);
//       } else {
//         if (!type) {
//           notify(response?.message, "error");
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching CBT request details:", error);
//     }
//   };

//   useEffect(() => {
//     if (payload?.Type === "CTB") {
//       getBindCTBRequestDetail();
//     }
//     if (payload?.Type === "IPD") {
//       GetBindHospLedgerAccount(payload?.Type);
//     }
//   }, [payload?.Type]);

//   const handleSinglePatientData = async (data) => {
//     setDataFromChild(data);
//     const { PatientID, TransactionID } = data;
//     try {
//       const data = await SelectIPDDetail(PatientID, TransactionID);
//       setSinglePatientData(data?.data);
//       // if(data?.data?.dtAdjust?.PaymentType===""){
//       //   setBillPay(billPay.filter((ele) => ele?.LedgerNumber === 2));
//       // }
//     } catch (error) {
//       console.log(error);
//     }
//   };
//   const handleGetPatientAdjustmentDetails = async () => {
//     const TransactionID = singlePatientData?.dtAdjust?.TransactionID;
//     try {
//       const response = await GetPatientReceipt(TransactionID);
//       if (response?.success) {
//         setPaientAdvanceDetails(response?.data);
//       } else {
//         setPaientAdvanceDetails([]);
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };
//   console.log("firstfirst", billPay);
//   const sendReset = () => {
//     setSinglePatientData({});
//     setPaymentControlModeState(PAYMENT_OBJECT);
//     setPaymentMethod([]);
//     // setPaientAdvanceDetails([]);
//     setPayload(initialState);
//     setPaientAdvanceDetails([]);
//   };

//   const handlePaymentGateWay = useCallback((details) => {
//     const {
//       panelID,
//       billAmount,
//       discountAmount,
//       isReceipt,
//       patientAdvanceAmount,
//       autoPaymentMode,
//       minimumPayableAmount,
//       panelAdvanceAmount,
//       disableDiscount,
//       refund,
//       constantMinimumPayableAmount,
//       discountIsDefault,
//       coPayIsDefault,
//     } = details;

//     const setData = {
//       panelID,
//       billAmount,
//       discountAmount,
//       isReceipt,
//       patientAdvanceAmount,
//       autoPaymentMode,
//       minimumPayableAmount,
//       panelAdvanceAmount,
//       disableDiscount,
//       refund,
//       constantMinimumPayableAmount,
//       discountIsDefault,
//       coPayIsDefault,
//       // disableDiscount: true,
//       // coPayIsDefault: true,
//     };
//     setPaymentMethod([]);
//     setPaymentControlModeState(setData);
//     // handleGetPatientAdjustmentDetails();
//   }, []);

//   // const handleSaveAPI = async () => {
//   //   try {

//   //     if (Number(paymentControlModeState?.paidAmount) === 0) {
//   //       notify("Please enter paid amount", "error");
//   //       return
//   //     }

//   //     const savepayload = SaveIPDAdvancePayload(paymentMethod, payload, dataFromChild, paymentControlModeState, CTBSelectedList, singlePatientData)
//   //     const response = await SaveIPDAdvance(savepayload);
//   //     if (response?.success) {
//   //       setPaientAdvanceDetails([]);
//   //       notify(response?.message, "success");
//   //       sendReset();
//   //       // handleGetPatientAdjustmentDetails();
//   //       // handleBillingSaveSaveServicesBilling();
//   //       const reportResp = await CommonReceiptPdf({
//   //         ledgerTransactionNo: "1",
//   //         isBill: 0,
//   //         receiptNo: String(response?.data),
//   //         duplicate: "",
//   //         type: "IPD",
//   //         supplierID: "",
//   //         billNo: "",
//   //         isEMGBilling: "",
//   //         isOnlinePrint: "",
//   //         isRefound: 0,
//   //       });
//   //       if (reportResp?.success) {
//   //         RedirectURL(reportResp?.data?.pdfUrl);
//   //       } else {
//   //         notify(reportResp?.data?.message, "error");
//   //       }
//   //     } else {
//   //       notify(response?.message, "error");
//   //     }
//   //   } catch (error) {
//   //     console.error("Something went wrong", error);
//   //   }
//   // };

//   const executeSaveAdvance = async () => {
//     try {
//       const savepayload = SaveIPDAdvancePayload(
//         paymentMethod,
//         payload,
//         dataFromChild,
//         paymentControlModeState,
//         CTBSelectedList,
//         singlePatientData,
//       );
//       const response = await SaveIPDAdvance(savepayload);
//       debugger
//       if (response?.success) {
//         setPaientAdvanceDetails([]);
//         notify(response?.message, "success");
//         sendReset();
//         // Check if the response data is not empty before calling CommonReceiptPdf
//         if (response?.data && response?.data !== "") {
//           const reportResp = await CommonReceiptPdf({
//             ledgerTransactionNo: "1",
//             isBill: 0,
//             receiptNo: String(response?.data),
//             duplicate: "",
//             type: "IPD",
//             supplierID: "",
//             billNo: "",
//             isEMGBilling: "",
//             isOnlinePrint: "",
//             isRefound: 0,
//             isLogo: 1
//           });
//           if (reportResp?.success) {
//             RedirectURL(reportResp?.data?.pdfUrl);
//           } else {
//             notify(
//               reportResp?.data?.message || "Error generating receipt.",
//               "error",
//             );
//           }
//         }
//       } else {
//         notify(response?.message || response?.data?.message, "error");
//       }
//     } catch (error) {
//       console.error("Something went wrong", error);
//       notify("Something went wrong. Please try again.", "error");
//     }
//   };

//   const handleSaveAPI = async () => {
//     if (Number(paymentControlModeState?.paidAmount) === 0) {
//       notify("Please enter paid amount", "error");
//       return;
//     }

//     if (userData?.validateUserForBill) {
//       setUserConfirmation(true);
//     } else {
//       executeSaveAdvance();
//     }
//   };

//   useEffect(() => {
//     if (singlePatientData?.dtAdjust?.TransactionID) {
//       handleGetPatientAdjustmentDetails();
//     }
//   }, [singlePatientData?.dtAdjust?.TransactionID]);

//   useEffect(() => {
//     setPaymentControlModeState({
//       ...paymentControlModeState,
//       patientAdvanceAmount: Number(singlePatientData?.dtAdjust?.PatientAdvance),
//     });
//   }, [singlePatientData?.dtAdjust?.PatientAdvance]);

//   return (
//     <>
//       {userConfirmation && (
//         <UserPasswordVerificationModal
//           visible={userConfirmation}
//           setVisible={setUserConfirmation}
//           userId={userData?.employeeID}
//           onSuccess={executeSaveAdvance}
//         />
//       )}
//       <div className="card patient_registration border">
//         <Heading title={"Search Criteria"} isBreadcrumb={true} />
//         {!data && Object.keys(singlePatientData)?.length === 0 ? (
//           <IPDAdvanceSearchByPatient
//             onClick={handleSinglePatientData}
//             data={data}
//           />
//         ) : (
//           <>
//             <DetailCard
//               singlePatientData={singlePatientData}
//               handlePaymentGateWay={handlePaymentGateWay}
//               sendReset={sendReset}
//               data={data}
//               payload={payload}
//               setPayload={setPayload}
//               CTBList={CTBList}
//               CTBSelectedList={CTBSelectedList}
//               setCTBSelectedList={setCTBSelectedList}
//               setCTBList={setCTBList}
//               dataFromChild={dataFromChild}
//               advanceReason={advanceReason}
//               approval={approval}
//               setAdvanceReason={setAdvanceReason}
//               setApproval={setApproval}
//               handleGetPatientAdjustmentDetails={
//                 handleGetPatientAdjustmentDetails
//               }
//               GetBindHospLedgerAccount={GetBindHospLedgerAccount}
//               setBillPay={setBillPay}
//               billPay={billPay}
//               paientAdvanceDetails={paientAdvanceDetails}
//             />
//           </>
//         )}
//       </div>

//       <PaymentGateway
//         screenType={paymentControlModeState}
//         setScreenType={setPaymentControlModeState}
//         paymentMethod={paymentMethod}
//         setPaymentMethod={setPaymentMethod}
//         button={
//           <button className="button" onClick={handleSaveAPI}>
//             {console.log(
//               "btnData",
//               payload?.paymentType,
//               singlePatientData?.dtAdjust?.isRefund,
//             )}
//             {payload?.BillAccount === "IPD-Refund" ||
//               singlePatientData?.dtAdjust?.isRefund
//               ? t("Refund")
//               : t("Save")}
//           </button>
//         }
//       />
//       {/* {(paientAdvanceDetails?.length > 0 && paymentMethod?.length > 0) && ( */}
//       {paientAdvanceDetails?.length > 0 && (
//         <div className="card mt-2">
//           <div className="row">
//             <PatientAdvanceDetailTable tbody={paientAdvanceDetails} />
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default IPDAdmissionNew;

// const DetailCard = ({
//   singlePatientData,
//   handlePaymentGateWay,
//   sendReset,
//   data,
//   payload,
//   setPayload,
//   CTBList,
//   CTBSelectedList,
//   setCTBSelectedList,
//   setCTBList,
//   dataFromChild,
//   setAdvanceReason,
//   setApproval,
//   handleGetPatientAdjustmentDetails,
//   GetBindHospLedgerAccount,
//   billPay,
//   setBillPay,
// }) => {
//   const [t] = useTranslation();
//   const { BindResource } = useSelector((state) => state?.CommonSlice);
//   const [handleModelData, setHandleModelData] = useState({});
//   const [modalData, setModalData] = useState({});
//   const [totalNetAmount, setTotalNetAmount] = useState(0);
//   const localData = useLocalStorage("userData", "get");
//   const calculateAndHandlePayment = useCallback(
//     (value) => {
//       const data = calculateBillAmount(
//         [
//           {
//             panelID: 1,
//             grossAmount: Math.abs(Number(value)),
//             discountAmount: 0,
//             PayableAmount: Math.abs(Number(value)),
//           },
//         ],
//         "1",
//         singlePatientData?.dtAdjust?.PatientAdvance,
//         // Number(payload?.amount) > 0 ? 0 : 1,
//         Number(value) > 0 ? 0 : 1,
//         0,
//         1,
//         1,
//         1,
//       );
//       handlePaymentGateWay(data);
//     },
//     [singlePatientData, handlePaymentGateWay],
//   );
//   const [modalHandlerState, setModalHandlerState] = useState({
//     header: null,
//     show: false,
//     size: null,
//     component: null,
//     footer: null,
//   });

//   const handleModel = (
//     label,
//     width,
//     type,
//     isOpen,
//     Component,
//     handleInsertAPI,
//     extrabutton,
//   ) => {
//     setHandleModelData({
//       label: label,
//       width: width,
//       type: type,
//       isOpen: isOpen,
//       Component: Component,
//       handleInsertAPI: handleInsertAPI,
//       extrabutton: extrabutton ? extrabutton : <></>,
//     });
//   };

//   const setIsOpen = () => {
//     setHandleModelData((val) => ({ ...val, isOpen: false }));
//   };

//   useEffect(() => {
//     setHandleModelData((val) => ({ ...val, modalData: modalData }));
//   }, [modalData]);

//   useEffect(() => {
//     // let netAmt = singlePatientData?.dtAdjust?.netBalanceAmount
//     if (payload?.amount) {
//       setTotalNetAmount(payload?.amount);
//       calculateAndHandlePayment(payload?.amount);
//     }
//   }, [payload?.amount, calculateAndHandlePayment]);
//   const handleChangeModel = (data) => {
//     setModalData(data);
//   };

//   const handleReactSelect = async (name, value) => {
//     console.log(name);
//     setPayload((prevData) => ({
//       ...prevData,
//       [name]: value?.value,
//       amount: "",
//     }));
//   };
//   const handleReactSelectItem = (name, value) => {
//     setPayload((val) => ({ ...val, [name]: value?.value }));
//   };
//   const handleReactSelectChange = async (name, selectedOption) => {
//     if (name == "Type") {
//       setTotalNetAmount(0);
//       if (selectedOption?.value) {
//         GetBindHospLedgerAccount();
//       }
//       await GetBindDiscReason(selectedOption?.value);
//       setPayload((prevPayload) => ({
//         ...prevPayload,
//         [name]: selectedOption?.value,
//       }));
//     } else {
//       setPayload((prevPayload) => ({
//         ...prevPayload,
//         [name]: selectedOption,
//       }));
//     }
//   };

//   const getBindApproveBy = async () => {
//     try {
//       const response = await getApproveBy();
//       setApproval([response?.data]);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const handleCreateAdvanceReason = async (data) => {
//     try {
//       const DiscReason = data?.advanceReason;
//       const Type = payload?.Type;
//       let insData = await SaveDiscReason(DiscReason, Type);
//       if (insData?.success) {
//         GetBindDiscReason(payload?.Type);
//         setModalData({});
//         setHandleModelData((val) => ({ ...val, isOpen: false }));
//       }
//     } catch (error) {
//       console.error("Error creating advance reason:", error);
//     }
//   };



//   const handleChange = (e) => {
//     debugger
//     const { name, value } = e.target;
//     if (name === "amount") {
//       if (value === "0") {
//         return
//       }
//     }
//     if (name === "amount" && payload?.BillAccount === "IPD-Settlement") {
//       if (value < 0) {
//         return
//       }
//       if (value > Math.abs(singlePatientData?.dtAdjust?.patientBalanceAmount)) {
//         notify("Settlement amount cannot be greater than patient balance amount", "warn");
//         return;
//       }
//     }

//     if (name === "amount" && payload?.BillAccount === "IPD-Refund") {
//       if (value < 0) {
//         return
//       }
//       if (value > Math.abs(singlePatientData?.dtAdjust?.patientBalanceAmount)) {
//         // if (value > Number(singlePatientData?.dtAdjust?.TotalPaidAmount)) {
//         notify("Refund amount cannot be greater than patient balance amount", "warn");
//         return;
//       }
//     }
//     setPayload({
//       ...payload,
//       [name]: value,
//     });
//     // if (name === amount) {
//     // handleGetPatientAdjustmentDetails();
//     // }
//     // debouncedCalculateAndHandlePayment(value);
//   };
//   const handleDataInDetailView = useMemo(() => {
//     //
//     if (Object.keys(singlePatientData)?.length > 0) {
//       const data = [];

//       // singlePatientData?.dtAdjust?.forEach((adjustItem, index) => {
//       const adjustItem = singlePatientData?.dtAdjust;
//       //
//       data.push(
//         {
//           label: t(`UHID`),
//           value: dataFromChild?.PatientID ?? "",
//         },
//         {
//           label: t(`Patient Name`),
//           value: dataFromChild?.pname,
//         },
//         {
//           label: t(`IPD No.`),
//           value: dataFromChild?.IPDNo,
//         },
//         {
//           label: t(`Age/Gender `),
//           value: adjustItem?.CurrentAgeGender ?? "",
//         },
//         {
//           label: t(`Room`),
//           value: dataFromChild?.roomno,
//         },
//         {
//           label: t(`Address`),
//           value: dataFromChild?.Address,
//         },
//         {
//           label: t(`Status `),
//           value: adjustItem?.STATUS ?? "",
//         },
//         {
//           label: t("Main Panel"),
//           value: dataFromChild?.company_name,
//         },
//         {
//           label: t("Net Bill Amount"),
//           value:
//             Number(adjustItem?.NetAmount)?.toFixed(ROUNDOFF_VALUE) ?? "0.00",
//           // Number(adjustItem?.s_Amount)?.toFixed(ROUNDOFF_VALUE) ?? "0.00",
//         },
//         {
//           label: t("Total Paid Amount"),
//           value: adjustItem?.TotalPaidAmount ?? "0.00",
//           // value: singlePatientData?.paidAmt ?? "0.00",
//         },
//         {
//           label: t("Balance Amount"),
//           value: adjustItem?.netBalanceAmount ?? "0.00",
//           // Number(adjustItem?.NetAmount)?.toFixed(ROUNDOFF_VALUE) - singlePatientData?.TotalPaidAmount ?? "0.00",
//         },
//         {
//           label: t("Round Off"),
//           value: Number(adjustItem?.roundOff).toFixed(ROUNDOFF_VALUE) ?? "0.00",
//         },
//         {
//           label: t("Panel Approved Amount"),
//           value:
//             Number(adjustItem?.PanelApprovedAmt).toFixed(ROUNDOFF_VALUE) ??
//             "0.00",
//         },
//         {
//           label: t("Panel Payable Amount"),
//           value: Number(adjustItem?.PanelPaybleAmt).toFixed(ROUNDOFF_VALUE),
//           // value: Number(adjustItem?.panelPaybleAmt).toFixed(ROUNDOFF_VALUE),
//         },
//         {
//           label: t("Panel Paid Amount"),
//           value: Number(adjustItem?.PanelPaidAmt).toFixed(ROUNDOFF_VALUE),
//         },
//         {
//           label: t("Panel Balance Amount"),
//           value: adjustItem?.PanelBalanceAmount ?? "0.00",
//         },
//         {
//           label: t("Patient Payable Amount"),
//           value:
//             Number(adjustItem?.PatientPaybleAmt).toFixed(ROUNDOFF_VALUE) ??
//             "0.00",
//         },
//         {
//           label: t("Patient Paid Amount"),
//           value:
//             Number(adjustItem?.PatientPaidAmt).toFixed(ROUNDOFF_VALUE) ??
//             "0.00",
//         },
//         {
//           label: t("Patient Balance Amount"),
//           value: adjustItem?.patientBalanceAmount ?? "0.00",
//         },
//       );
//       // });

//       singlePatientData?.dt?.forEach((dtItem, index) => {
//         data.push(
//           {
//             label: t(`Doctor `),
//             value: dtItem?.doctorName ?? "",
//           },
//           {
//             label: t(`Admission Date `),
//             value:
//               moment(dtItem?.dateOfAdmit).format("DD-MMM-YYYY hh:mm A") ?? "",
//           },
//           {
//             label: t(`Discharge Date `),
//             value:
//               moment(dtItem?.dateOfDischarge).format("DD-MMM-YYYY hh:mm A") ??
//               "",
//           },
//         );
//       });

//       return data;
//     } else {
//       return [];
//     }
//   }, [singlePatientData]);

//   const handleModalState = () => {
//     setModalHandlerState({
//       show: true,
//       header: "CBT Details",
//       size: "40vw",
//       component: (
//         <CTBModal tbody={CTBList} CTBList={CTBList} setCTBList={setCTBList} />
//       ),
//       footer: (
//         <div>
//           <div className="d-flex align-items-center justify-content-end">
//             <div>
//               <Button
//                 name={"Add"}
//                 className={"btn btn-sm btn-primary mx-1"}
//                 handleClick={handleAddAPI}
//               />
//             </div>
//           </div>
//         </div>
//       ),
//     });
//   };
//   const GetBindDiscReason = async (Type) => {
//     try {
//       const { data } = await GetDiscReason(Type);
//       setAdvanceReason(data);
//     } catch (error) {
//       console.error("Error fetching discount reasons:", error);
//     }
//   };

//   const commonFetchAllDropDown = async () => {
//     try {
//       const [discReasonResponse] = await Promise.all([
//         GetDiscReason(payload?.Type),
//       ]);
//       return {
//         discReasonResponse,
//       };
//     } catch (error) {
//       console.log("Something went wrong during dropdown fetching:", error);
//       return {};
//     }
//   };

//   const FetchAllDropDown = async () => {
//     try {
//       const responseDropdown = await commonFetchAllDropDown();
//       if (responseDropdown.discReasonResponse) {
//         setAdvanceReason(responseDropdown.discReasonResponse?.data);
//       }
//     } catch (error) {
//       console.error("Error fetching dropdown data:", error);
//     }
//   };

//   useEffect(() => {
//     if (payload?.Type) {
//       FetchAllDropDown();
//     }
//     getBindApproveBy();
//   }, [payload?.Type]);

//   const handleAddAPI = async () => {
//     const newArr = CTBList.filter((ele) => ele?.isChecked === true);
//     let totalAmount = 0;
//     CTBList?.map((val) => {
//       if (val?.isChecked) {
//         totalAmount += val?.NetAmount;
//       }
//     });
//     setTotalNetAmount(totalAmount);
//     setCTBSelectedList(newArr);
//     setModalHandlerState({
//       show: false,
//       component: null,
//       size: null,
//     });
//     calculateAndHandlePayment(totalAmount);
//   };

//   useEffect(() => {
//     debugger
//     if (singlePatientData?.dtAdjust?.PaymentType === "") {
//       setBillPay(billPay.filter((ele) => ele?.LedgerNumber != 2));
//     } else if (
//       "ipd-settlement" ===
//       singlePatientData?.dtAdjust?.PaymentType.toLowerCase() && isMatch
//     ) {

//       setPayload((val) => ({
//         ...val,
//         amount: 0,
//         BillAccount: singlePatientData?.dtAdjust?.PaymentType,
//       }));
//     }
//     else if (
//       "ipd-settlement" ===
//       singlePatientData?.dtAdjust?.PaymentType.toLowerCase()
//     ) {
//       setPayload((val) => ({
//         ...val,
//         amount: singlePatientData?.dtAdjust?.patientBalanceAmount,
//         BillAccount: singlePatientData?.dtAdjust?.PaymentType,
//       }));
//     }
//   }, [singlePatientData?.dtAdjust]);

//   const isMatch = BindResource?.IsAdvanceRefund
//     ?.split(",")
//     .map(item => Number(item.trim()))
//     .includes(localData?.defaultRole);
//   useEffect(() => {
//     debugger
//     if (billPay && isMatch) {
//       if (isMatch) {
//         setPayload((val) => ({ ...val, BillAccount: "IPD-Refund" }));
//       }
//       else {
//         setPayload((val) => ({ ...val, BillAccount: billPay?.[0]?.LedgerName }));
//       }
//     }

//   }, [billPay, BindResource, isMatch]);
//   console.log("singlePatientData", singlePatientData)
//   const isDisabled = () => {
//     debugger
//     if (payload?.Type === "CTB") {
//       true
//     } else if (singlePatientData?.dtAdjust?.patientBalanceAmount > 0) {
//       return true
//     }
//     else if (isMatch && "ipd-settlement" ===
//       singlePatientData?.dtAdjust?.PaymentType.toLowerCase()) {
//       return true
//     }
//      else {
//      return false
//     }
//   }
//   return (
//     <>
//       <DetailsCardForDefaultValue
//         singlePatientData={handleDataInDetailView}
//         sendReset={sendReset}
//         show={data}
//         isElipsis={true}
//       >
//         {payload?.Type === "IPD" ? (
//           <ReactSelect
//             placeholderName={t("Payment Type")}
//             handleChange={handleReactSelect}
//             id={"BillAccount"}
//             name={"BillAccount"}
//             value={payload?.BillAccount}
//             respclass="col-xl-2 col-md-4 col-sm-6 col-12"
//             dynamicOptions={handleReactSelectDropDownOptions(
//               billPay,
//               "LedgerName",
//               "LedgerName",
//             )}
//             // dynamicOptions={billPay.map((ele) => ({
//             //   label: ele?.LedgerName,
//             //   value: ele?.LedgerNumber,
//             // }))}
//             searchable={true}
//             // isDisabled={singlePatientData?.dtAdjust?.PaymentType.toLowerCase() === "ipd-settlement"}
//             // isDisabled={
//             //   singlePatientData?.dtAdjust?.patientBalanceAmount < 0
//             //     ? false
//             //     : true ||
//             //       singlePatientData?.dtAdjust?.PaymentType.toLowerCase() ===
//             //         "ipd-settlement"
//             // }
//             isDisabled={

//               (singlePatientData?.dtAdjust?.PaymentType?.toLowerCase() === "ipd-settlement") ? true
//                 : isMatch ? true : false
//             }
//           //             isDisabled={
//           //   singlePatientData?.dtAdjust?.patientBalanceAmount < 0
//           //     ? (singlePatientData?.dtAdjust?.PaymentType?.toLowerCase() === "ipd-settlement")
//           //     : isMatch ? true : false
//           // }
//           />
//         ) : (
//           ""
//         )}
//         <ReactSelect
//           placeholderName={t("Advance Type")}
//           id={"Type"}
//           searchable={true}
//           handleChange={handleReactSelectChange}
//           value={payload?.Type}
//           respclass="col-xl-2 col-md-4 col-sm-6 col-12"
//           dynamicOptions={AdvanceTypeOption}
//           name={"Type"}
//           isDisabled={
//             singlePatientData?.dtAdjust?.PaymentType.toLowerCase() ===
//             "ipd-settlement"
//           }
//         />
//         <Input
//           type="number"
//           className="form-control"
//           id="amount"
//           name="amount"
//           onChange={(e) => {
//             handleChange(e);
//             inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, () => { });
//           }}
//           // onKeyDown={(e) => {
//           //   inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, () => {});
//           // }}
//           value={payload?.amount ? Math?.abs(Number(payload?.amount)) : ""}
//           lable={t("Amount")}
//           placeholder=" "
//           required={true}
//           // disabled={payload?.Type === "CTB" ? true : false}
//           //           disabled={
//           //   payload?.Type === "CTB"
//           //     ? true
//           //     : false
//           // }
//           //           disabled={
//           //   payload?.Type === "CTB"
//           //     ? true
//           //     :  (isMatch && "ipd-settlement" ===
//           //       singlePatientData?.dtAdjust?.PaymentType.toLowerCase())?true:false


//           // }
//           disabled={isDisabled()
//           }
//           respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
//         />
//         {
//           (isMatch && "ipd-settlement" ===
//             singlePatientData?.dtAdjust?.PaymentType.toLowerCase()) && (
//             <span style={{ color: "red" }}>Patient already settled this amount, so you can not make advance or refund</span>
//           )
//         }

//         {/* <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
//           <div className="box-size">
//             <div className="box-upper">
//               <ReactSelect
//                 placeholderName={t("FrontOffice.OPD.OPDAdvance.label.Reason")}
//                 searchable={true}
//                 respclass=""
//                 id="ReasonID"
//                 name="ReasonID"
//                 handleChange={handleReactSelectItem}
//                 // handleChange={handleReactSelectChange}
//                 value={`${payload?.ReasonID}`}
//                 dynamicOptions={advanceReason?.map((item) => ({
//                   label: item?.DiscountReason,
//                   value: item?.ID,
//                 }))}
//               />
//             </div>
//             <div className="box-inner">
//               <button
//                 className="btn btn-sm btn-primary"
//                 type="button"
//                 onClick={() =>
//                   handleModel(
//                     "Reason Add Modal",
//                     "20vw",
//                     "Reason",
//                     true,
//                     <ReasonAddModal handleChangeModel={handleChangeModel} />,
//                     handleCreateAdvanceReason
//                   )
//                 }
//               >
//                 <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
//               </button>
//             </div>
//           </div>
//         </div>
//         <ReactSelect
//           placeholderName={t("Approval")}
//           searchable={true}
//           respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
//           id={"Approval"}
//           name={"Approval"}
//           value={payload?.Approval}
//           dynamicOptions={approval.map((ele) => ({
//             value: ele?.ApprovalType,
//             label: ele?.ApprovalType,
//           }))}
//           handleChange={handleReactSelectItem}
//         /> */}
//         {payload?.Type === "CTB" && (
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               width: "100%",
//             }}
//           >
//             <Button
//               name={t("CTB")}
//               className="btn btn-sm btn-primary"
//               handleClick={() => handleModalState()}
//             />
//           </div>
//         )}
//       </DetailsCardForDefaultValue>
//       {handleModelData?.isOpen && (
//         <Modal
//           visible={handleModelData?.isOpen}
//           setVisible={setIsOpen}
//           modalWidth={handleModelData?.width}
//           Header={t(handleModelData?.label)}
//           buttonType={"submit"}
//           modalData={handleModelData?.modalData}
//           setModalData={setModalData}
//           handleAPI={handleModelData?.handleInsertAPI}
//         >
//           {handleModelData?.Component}
//         </Modal>
//       )}
//       {modalHandlerState?.show && (
//         <Modal
//           visible={modalHandlerState?.show}
//           setVisible={() =>
//             setModalHandlerState({
//               show: false,
//               component: null,
//               size: null,
//             })
//           }
//           modalWidth={modalHandlerState?.size}
//           Header={modalHandlerState?.header}
//           footer={modalHandlerState?.footer}
//         >
//           {modalHandlerState?.component}
//         </Modal>
//       )}
//     </>
//   );
// };
