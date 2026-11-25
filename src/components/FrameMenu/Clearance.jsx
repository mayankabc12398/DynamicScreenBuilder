import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
/* Wahi popup jo Patient Issue par "Indents" dabane se khulta hai. Yahan wo
   SIRF DEKHNE ke liye khulta hai - niche Modal ko footer={<></>} diya gaya
   hai, isliye Add/Save ka button aata hi nahi aur yahan se kuch issue nahi
   kiya ja sakta. */
import IndentReqModal from "../../pages/pharmacy/PatientIssue/IndentReqModal";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import Modal from "../modalComponent/Modal";
import {
  BindCurrencyDetails,
  GetAllAuthorization,
  LoadDetails,
  LoadMedetail,
  SaveClearance,
  GetBillDetails,
  ForceFullyPatientclear,
  AdmitdischargeBilling_ForAdmitDiscCancel,
} from "../../networkServices/BillingsApi";
import Input from "../formComponent/Input";
import DischargeIntimationModal from "../modalComponent/Utils/DischargeIntimationModal";
import { notify } from "../../utils/utils";
import DischargeIntimation from "../modalComponent/Utils/DischargeIntimation";
import BillFreezeModel from "../modalComponent/Utils/BillFreezeModel";
import MedicalClearanceModal from "../modalComponent/Utils/MedicalClearanceModal";
import DischargeModal from "../modalComponent/Utils/DischargeModal";
import BillGenerateModal from "../modalComponent/Utils/BillGenerateModal";
import PatientClearanceModal from "../modalComponent/Utils/PatientClearanceModal";
import NurseClearanceModal from "../modalComponent/Utils/NurseClearanceModal";
import OTClearanceModal from "../modalComponent/Utils/OTClearanceModal";
import RoomClearanceModal from "../modalComponent/Utils/RoomClearanceModal";
import moment from "moment";
import BillFinalizeModal from "../modalComponent/Utils/BillFinalizeModal";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import MedicineRequisition from "./MedicineRequisition";
import SlideScreen from "../front-office/SlideScreen";

import DpdpDischargeCheck from "../front-office/DpdpDischargeCheck";
const Clearance = ({ data }) => {

  const [t] = useTranslation();

  /* View Requisition par khulne wala indent ka popup.

     Apna alag modal, jaan-bujh kar: upar ke dono modal apne Save/Yes aur apne
     handleAPI ke saath bandhe hue hain, aur unme ye daalte to yahan bhi ek
     Save ka button aa jaata jo kuch karta hi nahi. */
  const [indentViewModal, setIndentViewModal] = useState({
    isOpen: false,
    indentNo: "",
  });

  /* View Requisition par kya khulega.

     fin_global_resources -> IsClearanceRequisitionOpenInIssue
        0 / qatar na ho -> purani SlideScreen (MedicineRequisition), screen
                           bilkul aaj jaisi
        1               -> wahi popup jo Issue ke waqt khulta hai, usi indent
                           par - par YAHIN, isi screen par. Discharge Process
                           chhodna nahi padta. */
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const openRequisitionInIssue =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "IsClearanceRequisitionOpenInIssue",
    )?.Value === "1";
  const [handleModelData, setHandleModelData] = useState({});
  const [SecondModal, setSecondModal] = useState({});
  const [modalData, setModalData] = useState({});
  const [secModalData, setSecModalData] = useState([]);
  const [PatientStatus, setPatientStatus] = useState([]);
  const [payload, setPayload] = useState({});
  const [auth, setAuth] = useState([]);
  const [MedDetail, setMedDetail] = useState([]);
  const [currencyDetails, setCurrencyDetails] = useState([]);
  const ip = useLocalStorage("ip", "get");
  const [ForceClearModal, setForceClearModal] = useState({
    isOpen: false,
    reason: "",
    checked: false,
  });
  const [CancelStepModal, setCancelStepModal] = useState({
    isOpen: false,
    item: null,
    reason: "",
  });

  /* Each completed step gets a Cancel button that reverts it (ShowDischargeStepCancel key).
     Steps come undone in reverse order only: the API refuses anything but the latest
     completed step, and the FE says so up front instead of round-tripping. */
 
  const globalResourcesList = Array.isArray(GetGlobalResources)
    ? GetGlobalResources
    : GetGlobalResources?.data || [];
  const showStepCancel =
    globalResourcesList?.find((item) => item?.Name === "ShowDischargeStepCancel")
      ?.Value === "1";
  const lastDoneStep = (Array.isArray(PatientStatus) ? PatientStatus : [])
    .filter((item) => item?.dStatus == 1)
    .reduce(
      (last, item) =>
        !last || Number(item?.sequenceNo) > Number(last?.sequenceNo) ? item : last,
      null,
    );

  const [slideScreenState, setSlideScreenState] = useState({
    // name: "",
    // component: null,
    name: t("View Requisition"),
    show: false,
  });

  const resetForm = () => {
    setPayload({});

    setSecModalData({});
    GetLoadDetails();
  };

  const GetLoadDetails = async () => {
    const TID = data?.transactionID;
    try {
      const datas = await LoadDetails(TID);
      if (datas?.success) {
        setPatientStatus(datas?.data);
      } else {
        notify(data?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  console.log(MedDetail);
  const GetLoadMedDetail = async () => {
    const TID = data?.transactionID;
    try {
      const datas = await LoadMedetail(TID);
      setMedDetail(datas?.data);
    } catch (error) {
      setMedDetail([]);
      console.log(error);
    }
  };

  const getBindCurrencyDetails = async () => {
    try {
      const data = await BindCurrencyDetails();
      setCurrencyDetails(data?.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getBindCurrencyDetails();
  }, []);

  const getPayloadData = (data) => {
    setPayload(data);
  };

  const GetBindAuthorization = async () => {
    try {
      const datas = await GetAllAuthorization();
      return datas?.data;
    } catch (error) {
      console.log(error);
    }
  };

  const GetAuthorizationList = async () => {
    try {
      const data = await GetBindAuthorization();
      setAuth(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    GetLoadDetails();
    GetAuthorizationList();
    GetLoadMedDetail();
  }, []);

  const handleModel = (
    label,
    width,
    type,
    isOpen,
    Component,
    handleInsertAPI,
    extrabutton,
    item,
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
    setModalData(item);
  };

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };
  const setIsOpenClose = () => {
    setSecondModal((val) => ({ ...val, isOpen: false }));
  };

  const handleChangeModel = (data) => {
    console.log("StepStep", data);
    // setModalData(data, item);
    // setSecModalData(data, item);
  };

  const handleCheckRights = (keyName, item) => {
    const [response] = auth;
    if (Number(response[keyName])) {
      handleStateInsertAPI(item);
      // handleModel(
      //   item?.Step,
      //   "20vw",
      //   "State",
      //   true,
      //   <>
      //     <DischargeIntimationModal
      //       handleChangeModel={handleChangeModel}
      //       item={item}
      //     />
      //   </>,
      //   handleStateInsertAPI,
      //   <></>,
      //   item
      // );
    } else {
      notify(t("You Don't Have Right"), "error");
      return;
    }
  };

  const handleInsertSecondModelAPI = async () => { };

  const handleCancelStepClick = (e, item) => {
    e.stopPropagation();
    if (lastDoneStep && String(lastDoneStep?.ID) !== String(item?.ID)) {
      notify(`Please Cancel ${t(lastDoneStep?.Step)} First`, "error");
      return;
    }
    const [response] = auth || [];
    if (!Number(response?.[item?.UserAuth]) && !Number(response?.IsReject)) {
      notify("You Don't Have Right", "error");
      return;
    }
    setCancelStepModal({ isOpen: true, item, reason: "" });
  };

  const handleCancelStepSubmit = async () => {
    const { item, reason } = CancelStepModal;
    if (!reason?.trim()) {
      notify("Please enter the cancel reason", "error");
      return;
    }
    try {
      const response = await AdmitdischargeBilling_ForAdmitDiscCancel({
        id: String(item?.ID),
        remark: reason.trim(),
        transactionID: String(data?.transactionID),
        patientID: data?.patientID,
        ipAddress: ip,
      });
      if (response?.success) {
        notify(`${t(item?.Step)} Cancelled Successfully`, "success");
        setCancelStepModal({ isOpen: false, item: null, reason: "" });
        resetForm();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error(error);
      notify("Something went wrong", "error");
    }
  };

  const handleModelComponent = (newData, id) => {
    if (id === 6) {
      return (
        <DischargeIntimation
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
          data={data}
        />
      );
    } else if (id === 19) {
      // OT Clearance - runs right after Discharge Intimation
      return (
        <OTClearanceModal
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
        />
      );
    } else if (id === 8) {
      return (
        <BillFreezeModel
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
        />
      );
    } else if (id === 7) {
      return (
        <MedicalClearanceModal
          handleSlideScreen={handleSlideScreen}
          parentData={data}
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
          MedDetail={MedDetail}
        />
      );
    } else if (id === 9) {
      return (
        <DischargeModal
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
          admidateDate={data}
        />
      );
    } else if (id === 10) {
      return (
        <BillGenerateModal
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
          currencyDetails={currencyDetails}
          patientSearchDetails={data}
        />
      );
    } else if (id === 11) {
      return (
        <PatientClearanceModal
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
        />
      );
    } else if (id === 12) {
      return (
        <NurseClearanceModal
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
        />
      );
    } else if (id === 13) {
      return (
        <RoomClearanceModal
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
        />
      );
    } else if (id === 14) {
      return (
        <BillFinalizeModal
          data={newData?.newData}
          payload={payload}
          setPayload={setPayload}
          getPayloadData={getPayloadData}
          secModalData={secModalData}
        />
      );
    }

    return newData; // Make sure to return the data
  };

  const handleStateInsertAPI = async (data) => {
    setHandleModelData({
      isOpen: false,
    });

    setSecondModal({
      label: data?.Step,
      width: "50vw",
      isOpen: true,
      Component: handleModelComponent({ newData: data?.Step }, data?.ID),
      handleInsertAPI: handleInsertSecondModelAPI,
      extrabutton: (
        // data?.Step == "Patient Clearance" ? (
        //   <button className="btn btn-sm btn-success">Print</button>
        // ) : (
        <></>
      ),
      // ),
    });

    setSecModalData(data);
  };

  const handleSlideScreen = (item) => {
    /* View Requisition par seedha Issue ki screen.

       fin_global_resources -> IsClearanceRequisitionOpenInIssue

          0 / qatar hi na ho  ->  wahi purani SlideScreen (MedicineRequisition).
                                  Screen bilkul aaj jaisi.
          1                   ->  Patient Issue par le jaata hai aur wahan wahi
                                  popup khulta hai jo Indents dabane par khulta
                                  hai - usi indent par.

       Indent ka number URL me jaata hai, kisi router state me nahi: URL reload
       par bhi bacha rehta hai aur link copy karke kisi aur ko bheja ja sakta
       hai.

       DHYAN: ye Discharge Process ki screen CHHOD deta hai. Clearance ka kaam
       beech me reh jayega aur user ko wapas aana padega - isiliye ye flag ke
       peeche hai, taaki jis site ko ye raasta chahiye wahi ise khole. */
    if (openRequisitionInIssue && item?.indentno) {
      /* Medical Clearance ki popup band kar ke uski jagah indent wali popup.
         Discharge Process ki screen NAHI chhodi jaati - clearance ka kaam
         wahin ka wahin rehta hai aur user popup band karte hi wapas usi
         jagah hota hai. */
      setSecondModal({ isOpen: false });
      setIndentViewModal({ isOpen: true, indentNo: item.indentno });
      return;
    }

    setSecondModal({
      isOpen: false,
    });
    setSlideScreenState({
      name: t("View Requisition"),
      show: true,
      component: (
        <div className="card patient_registration border mt-2">
          <div className="row p-2">
            <div className="col-sm-12">
              <MedicineRequisition data={data} item={item} />
            </div>
          </div>
        </div>
      ),
    });
  };
  const ErrorHandling = () => {
    let errors = {};

    if (payload?.btnDischarge === "") {
      errors.btnDischarge = "Discharge Type Is Required";
    }
    if (payload?.date === null) {
      errors.date = "Date Is Required";
    }
    if (payload?.startTime === null) {
      errors.startTime = "Start Time Is Required";
    }
    if (payload?.entryDateDeath === null) {
      errors.entryDateDeath = "Death Date Is Required";
    }
    if (payload?.entryTimeDeath === null) {
      errors.entryTimeDeath = "Death Time Is Required";
    }
    if (payload?.btnDischarge === "Death" && payload?.causeOfDeath === "") {
      errors.causeOfDeath = "Cause Of Death Is Required";
    }
    if (payload?.btnDischarge === "Death" && payload?.typeOfDeath === "") {
      errors.typeOfDeath = "Type Of Death Is Required";
    }

    if (payload?.BillingType === "") {
      errors.BillingType = "Billing Type Is Required";
    }
    if (payload?.Narration === "") {
      errors.BillingType = "Narration Is Required";
    }

    return errors;
  };

  const handleSecondInsertAPI = async (modalsdetails) => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 0) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[0], "error");
      }
      return false;
    }
    try {
      const requestBody = {
        tid: parseInt(data?.transactionID),
        type: parseInt(secModalData?.ID),

        clearanceRemark: payload?.clearanceRemark
          ? payload?.clearanceRemark
          : "",
        startTime: moment(payload?.startTime).format("HH:mm:ss")
          ? moment(payload?.startTime).format("HH:mm:ss")
          : "",
        date: moment(payload?.date).format("YYYY-MM-DD")
          ? moment(payload?.date).format("YYYY-MM-DD")
          : "",
        typeOfDischarge: payload?.btnDischarge ? payload?.btnDischarge : "",
        reason: payload?.reason ? payload?.reason : "",
        entryDateDeath: moment(payload?.entryDateDeath).format("YYYY-MM-DD")
          ? moment(payload?.entryDateDeath).format("YYYY-MM-DD")
          : "",
        entryTimeDeath: moment(payload?.entryTimeDeath).format("HH:mm:ss")
          ? moment(payload?.entryTimeDeath).format("HH:mm:ss")
          : "",
        typeOfDeath: payload?.typeOfDeath ? payload?.typeOfDeath : "",
        causeOfDeath: payload?.causeOfDeath ? payload?.causeOfDeath : "",
        deathover48hrs: true,
        remarks: "",
        ipdCaseTypeID: data?.ipdCaseTypeID ? data?.ipdCaseTypeID : "",
        patientID: data?.patientID ? data?.patientID : "",
        billType: parseInt(payload?.BillingType)
          ? parseInt(payload?.BillingType)
          : 0,
        gsTcharges: "",
        surchargePer: 0,
        serviceCharge: 0,
        serTaxBillAmount: 0,
        billConFactor: parseInt(currencyDetails?.Selling_Specific),
        billNotation: currencyDetails?.S_Notation,
        billCountryId: parseInt(currencyDetails?.S_CountryID),
        roundOff: 0,
        narration: payload?.Narration ? payload?.Narration : "",
        totalBillAmount: 0,
        TypeName: modalsdetails?.Step,
        IpAddress: ip,
        PageURL: data?.pathname,
      };
      const response = await SaveClearance(requestBody);
      if (response?.success) {
        notify(response?.message, "success");
        resetForm();
        setSecondModal({ isOpen: false });
        
      } else {
        notify(response?.message, "error");
        if ( response?.data?.isPanelApproval === 1 || response?.data?.isPanelApproval === "1") {
        // if (response?.data === false || response?.data?.isPanelApproval === 1 || response?.data?.isPanelApproval === "1") {
          if (String(data?.panelID) === "1" || String(data?.PanelID) === "1") {
             setForceClearModal({
                isOpen: true,
                reason: "",
                checked: false
              });
            return;
          }
          try {
            const billDetailsData = await GetBillDetails(data?.transactionID);
            if (billDetailsData?.success && billDetailsData?.data && billDetailsData?.data[0]?.PanelPaybleAmt > 0) {
              setForceClearModal({
                isOpen: true,
                reason: "",
                checked: false
              });
            } else {
              window.dispatchEvent(
                new CustomEvent("navigateFrameMenu", {
                  detail: { 
                    targetMenu: "PanelApprovalRequest",
                    transactionID: data?.transactionID
                  },
                })
              );
            }
          } catch (err) {
            console.error("Error fetching bill details", err);
            window.dispatchEvent(
              new CustomEvent("navigateFrameMenu", {
                detail: { 
                  targetMenu: "PanelApprovalRequest",
                  transactionID: data?.transactionID
                },
              })
            );
          }
        }
        // resetForm();
        // setSecondModal({ isOpen: false });
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };

  const handleCloseForceClearModal = () => {
    setForceClearModal((prev) => ({ ...prev, isOpen: false }));
    window.dispatchEvent(
      new CustomEvent("navigateFrameMenu", {
        detail: { 
          targetMenu: "PanelApprovalRequest",
          transactionID: data?.transactionID
        },
      })
    );
  };

  const handleForceClearSubmit = async () => {
    if (!ForceClearModal.checked) {
      notify(t("Please check the Force Fully Patient Clear checkbox to proceed"), "error");
      return;
    }
    if (!ForceClearModal.reason || !ForceClearModal.reason.trim()) {
      notify(t("Reason is required"), "error");
      return;
    }
    try {
      const userData = useLocalStorage("userData", "get");
      const requestPayload = {
        transactionID: String(data?.transactionID),
        forceFullyPatientClearBy: String(userData?.employeeName || userData?.userName || userData?.employeeID || ""),
        forceFullyPatientClearReason: ForceClearModal.reason,
        ForceFullyPatientClear: ForceClearModal.checked===true?1:0
      };

      const response = await ForceFullyPatientclear(requestPayload);
      if (response?.success) {
        notify(response?.message || "Force cleared successfully", "success");
        setForceClearModal({ isOpen: false, reason: "", checked: false });
        resetForm();
        setSecondModal({ isOpen: false });
      } else {
        notify(response?.message || "Force clearance failed", "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("Something went wrong"), "error");
    }
  };
  return (
    <>
      <DpdpDischargeCheck data={data} />
      <div className="patient_registration card mt-2">
        <Heading
          title={<label>{t("Patient Status")}</label>}
          secondTitle={
            <>
              <ColorCodingSearch
                label={t("Status Done")}
                color="StatusDone"
                marginRight={"5px"}
              />
              <ColorCodingSearch
                label={t("Pending")}
                color="sPending"
                marginRight={"5px"}
              />
              <ColorCodingSearch
                label={t("Discharge Delay")}
                color="DischargeD"
                marginRight={"5px"}
              />
              <ColorCodingSearch
                label={t("Not Reached")}
                color="statusNotReached"
                marginRight={"5px"}
              />

              {/* <div
                className="col-sm-3 d-flex align-items-center "
                style={{ gap: "10px" }}
              >
                <div className="StatusDone"></div>
                <label className="text-dark m-0 ">{t("Status Done")}</label>
              </div>
              <div
                className="col-sm-3 d-flex align-items-center "
                style={{ gap: "10px" }}
              >
                <div className="sPending"></div>
                <label className="text-dark m-0">{t("Pending")}</label>
              </div>
              <div
                className="col-sm-3 d-flex align-items-center "
                style={{ gap: "px" }}
              >
                <div className="DischargeD"></div>
                <label className="text-dark m-0">{t("Discharge Delay")}</label>
              </div>
              <div
                className="col-sm-3 d-flex align-items-center"
                style={{ gap: "10px" }}
              >
                <div className="statusNotReached"></div>
                <label className="text-dark m-0">{t("Not Reached")}</label>
              </div> */}
            </>
          }
          isBreadcrumb={false}
        />
        <div
        // style={{
        //   background: auth?.success ? "" : "rgba(255, 255, 255, 0.5)",
        //   opacity: auth?.success ? 1 : 0.2,
        //   pointerEvents: auth?.success ? "auto" : "none",
        // }}
        >
          <div className="row text-center">
            {
              // Array.isArray(PatientStatus) &&
              PatientStatus?.map((item, index) => (
                <>
                  <div
                    className="col-sm-2 m-3 d-flex justify-content-around"
                    key={index}
                    style={{
                      background:
                        item?.nextPending == 1
                          ? ""
                          : "rgba(255, 255, 255, 0.5)",
                      opacity:
                        item?.nextPending == 1
                          ? //  ||
                          // (item?.ID == 9 &&
                          //   item?.nextPending == "0" )
                          1
                          : 0.7,
                      pointerEvents:
                        item?.nextPending == 1
                          ? // ||
                          // (item?.ID == 9 &&
                          //   item?.nextPending == "0" )
                          "auto"
                          : "none",
                    }}
                  >
                    <div
                      className={`card position-relative  ${item?.nextPending == 1 && "blink-box"}`}
                      style={{
                        border: "2px solid #568203",
                        textAlign: "center",
                        width: "150px",
                        borderRadius: "5px",
                      }}
                      onClick={() => handleCheckRights(item?.UserAuth, item)}
                    >
                      <div
                        className="stepcard"
                        style={{
                          background:
                            item?.nextPending == 1
                              ? "linear-gradient(0deg, rgb(187, 53, 4) 10%, rgb(255, 69, 0))"
                              : item.dStatus == 1
                                ? "linear-gradient(0deg, rgb(10, 90, 46) 10%, rgb(46, 139, 87))"
                                : "linear-gradient(0deg, rgb(185, 141, 10) 10%, rgb(255, 191, 0))",
                        }}
                      >
                        <label className="steps">{item?.sequenceNo}</label>
                      </div>
                      <div
                        className="d-flex justify-content-center"
                        style={{
                          paddingTop: "6px",
                          paddingBottom: "2px",
                          background:
                            item?.nextPending == 1
                              ? "#ff4500"
                              : item.dStatus == 1
                                ? "#2e8b57"
                                : "#ffbf00",
                          margin: "5px",
                          borderRadius: "0px 0px 100px 100px ",
                        }}
                      >
                        <>
                          {item?.nextPending == 1 ? (
                            <>
                              <svg
                                fill="#000000"
                                width="70px"
                                height="70px"
                                viewBox="-1.5 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="m6.53 8.098.14-.012c.053-.006.101-.025.141-.053l-.001.001c.134.462.298.948.503 1.457.263.666.522 1.213.812 1.741l-.04-.08c-.024.364-.053.738-.091 1.1-.018.223-.062.431-.129.627l.005-.018c-.012.005-.029 2.08-.029 2.08.001 1.353.938 2.486 2.198 2.787l.02.004c.057-.145.195-.246.357-.246h.574c.161.002.299.102.356.243l.001.003c1.283-.302 2.224-1.435 2.229-2.789v-.001s-.035-2.066-.053-2.08c-.055-.175-.099-.381-.122-.593l-.001-.015c-.035-.364-.058-.729-.091-1.1.247-.446.506-.992.734-1.555l.038-.106c.205-.509.364-.994.503-1.457.039.028.087.047.139.053h.001l.141.012c.17.018.32-.122.334-.339l.152-1.931c0-.001 0-.002 0-.002 0-.163-.122-.297-.279-.317h-.002-.017c.039-.281.061-.605.061-.934 0-.718-.106-1.412-.303-2.065l.013.051c-.577-1.266-1.721-2.185-3.099-2.442l-.026-.004c-.296-.061-.641-.102-.993-.112h-.009-.012c-.359.007-.704.047-1.038.118l.036-.006c-1.402.264-2.544 1.183-3.114 2.419l-.011.027c-.186.6-.293 1.29-.293 2.004 0 .333.023.661.068.981l-.004-.037c-.159.018-.282.151-.282.313v.007l.152 1.931c.014.222.166.356.33.338z" />
                                <path d="m21.416 20.878c-.07-3.04-.374-3.728-.538-4.194-.065-.187-.118-1.451-2.206-2.271-1.28-.504-2.932-.514-4.33-1.105v1.644c-.003 1.768-1.269 3.239-2.944 3.56l-.023.004c-.031.182-.187.318-.374.32h-.018v1.24c0 1.212.982 2.194 2.194 2.194s2.194-.982 2.194-2.194v-.866c-.608-.091-1.069-.609-1.069-1.235 0-.689.559-1.248 1.248-1.248s1.248.559 1.248 1.248c0 .546-.351 1.01-.839 1.18l-.009.003v.918.047c0 1.532-1.242 2.774-2.774 2.774s-2.774-1.242-2.774-2.774c0-.017 0-.033 0-.05v.002-1.251c-.178-.012-.322-.146-.35-.318v-.002c-1.69-.329-2.95-1.795-2.954-3.556v-1.657c-1.404.603-3.066.615-4.353 1.12-2.094.819-2.142 2.08-2.206 2.27-.16.468-.468 1.153-.538 4.195-.012.4 0 1.013 1.206 1.549 2.626 1.03 6.009 1.35 9.344 1.58h.32c3.342-.228 6.72-.547 9.344-1.58 1.201-.533 1.212-1.142 1.201-1.546zm-14.681-1.24h-1.246v1.251h-.89v-1.247h-1.246v-.89h1.246v-1.246h.89v1.246h1.246z" />
                                <path d="m16.225 17.965v-.001c0-.372-.301-.673-.673-.673s-.673.301-.673.673.301.673.673.673c.371 0 .672-.301.673-.672z" />
                              </svg>
                            </>
                          ) : (
                            <svg
                              fill="#000000"
                              width="30px"
                              height="30px"
                              viewBox="-1.5 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="m6.53 8.098.14-.012c.053-.006.101-.025.141-.053l-.001.001c.134.462.298.948.503 1.457.263.666.522 1.213.812 1.741l-.04-.08c-.024.364-.053.738-.091 1.1-.018.223-.062.431-.129.627l.005-.018c-.012.005-.029 2.08-.029 2.08.001 1.353.938 2.486 2.198 2.787l.02.004c.057-.145.195-.246.357-.246h.574c.161.002.299.102.356.243l.001.003c1.283-.302 2.224-1.435 2.229-2.789v-.001s-.035-2.066-.053-2.08c-.055-.175-.099-.381-.122-.593l-.001-.015c-.035-.364-.058-.729-.091-1.1.247-.446.506-.992.734-1.555l.038-.106c.205-.509.364-.994.503-1.457.039.028.087.047.139.053h.001l.141.012c.17.018.32-.122.334-.339l.152-1.931c0-.001 0-.002 0-.002 0-.163-.122-.297-.279-.317h-.002-.017c.039-.281.061-.605.061-.934 0-.718-.106-1.412-.303-2.065l.013.051c-.577-1.266-1.721-2.185-3.099-2.442l-.026-.004c-.296-.061-.641-.102-.993-.112h-.009-.012c-.359.007-.704.047-1.038.118l.036-.006c-1.402.264-2.544 1.183-3.114 2.419l-.011.027c-.186.6-.293 1.29-.293 2.004 0 .333.023.661.068.981l-.004-.037c-.159.018-.282.151-.282.313v.007l.152 1.931c.014.222.166.356.33.338z" />
                              <path d="m21.416 20.878c-.07-3.04-.374-3.728-.538-4.194-.065-.187-.118-1.451-2.206-2.271-1.28-.504-2.932-.514-4.33-1.105v1.644c-.003 1.768-1.269 3.239-2.944 3.56l-.023.004c-.031.182-.187.318-.374.32h-.018v1.24c0 1.212.982 2.194 2.194 2.194s2.194-.982 2.194-2.194v-.866c-.608-.091-1.069-.609-1.069-1.235 0-.689.559-1.248 1.248-1.248s1.248.559 1.248 1.248c0 .546-.351 1.01-.839 1.18l-.009.003v.918.047c0 1.532-1.242 2.774-2.774 2.774s-2.774-1.242-2.774-2.774c0-.017 0-.033 0-.05v.002-1.251c-.178-.012-.322-.146-.35-.318v-.002c-1.69-.329-2.95-1.795-2.954-3.556v-1.657c-1.404.603-3.066.615-4.353 1.12-2.094.819-2.142 2.08-2.206 2.27-.16.468-.468 1.153-.538 4.195-.012.4 0 1.013 1.206 1.549 2.626 1.03 6.009 1.35 9.344 1.58h.32c3.342-.228 6.72-.547 9.344-1.58 1.201-.533 1.212-1.142 1.201-1.546zm-14.681-1.24h-1.246v1.251h-.89v-1.247h-1.246v-.89h1.246v-1.246h.89v1.246h1.246z" />
                              <path d="m16.225 17.965v-.001c0-.372-.301-.673-.673-.673s-.673.301-.673.673.301.673.673.673c.371 0 .672-.301.673-.672z" />
                            </svg>
                          )}
                        </>
                      </div>
                      <label
                        className="statusIcon"
                        style={{
                          background:
                            item?.nextPending == 1
                              ? "linear-gradient(0deg, rgb(187, 53, 4) 10%, rgb(255, 69, 0))"
                              : item.dStatus == 1
                                ? "linear-gradient(0deg, rgb(10, 90, 46) 10%, rgb(46, 139, 87))"
                                : "linear-gradient(0deg, rgb(185, 141, 10) 10%, rgb(255, 191, 0))",
                        }}
                      >
                        {t(item?.Step)}
                      </label>
                      <div
                        className="card-body text-center"
                        style={{
                          background:
                            item?.nextPending == 1
                              ? "#ff4500"
                              : item.dStatus == 1
                                ? "#2e8b57"
                                : "#ffbf00",
                          color: "white",
                          padding: "0px",
                          margin: "0px",
                        }}
                      >
                        <p className="card-text text-center m-0">
                          {item?.Step === "Discharge"
                            ? item?.DischargeDate
                            : item?.StartDateTime}
                          {/* {item?.StartDateTime} */}
                        </p>
                        <p className="card-text text-center m-0">
                          {item?.BedNo}
                        </p>
                        <p className="card-text text-center m-0">
                          <label>{item.dUser}</label>
                        </p>
                      </div>
                      {showStepCancel && item?.dStatus == 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-info w-100 text-white"
                          style={{ borderRadius: 0, pointerEvents: "auto" }}
                          onClick={(e) => handleCancelStepClick(e, item)}
                        >
                          {t("Cancel")} {t(item?.Step)}
                        </button>
                      )}
                    </div>
                    {index === PatientStatus.length - 1 ? (
                      ""
                    ) : (
                      <div className="d-flex justify-content-center align-items-center">
                        <label className="Clearancearrow"></label>
                      </div>
                    )}
                  </div>
                </>
              ))
            }
          </div>
        </div>
      </div>

      <SlideScreen
        visible={slideScreenState?.show}
        setVisible={() =>
          setSlideScreenState({
            show: false,
            name: "",
            component: null,
          })
        }
        Header={slideScreenState?.name}
      >
        {slideScreenState?.component}
      </SlideScreen>

      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"button"}
          buttonName={t("Yes")}
          buttons={handleModelData?.extrabutton}
          modalData={modalData}
          setModalData={setModalData}
          handleAPI={handleStateInsertAPI}
        >
          {handleModelData?.Component}
        </Modal>
      )}

      {SecondModal?.isOpen && (
        <Modal
          visible={SecondModal?.isOpen}
          setVisible={setIsOpenClose}
          modalWidth={SecondModal?.width}
          Header={t(SecondModal?.label)}
          buttonType={"button"}
          buttonName={t("Save")}
          // buttonName={SecondModal?.label}
          buttons={SecondModal?.extrabutton}
          modalData={secModalData}
          setSecModalData={setSecModalData}
          handleAPI={handleSecondInsertAPI}
        >
          {SecondModal?.Component}
        </Modal>
      )}

      {CancelStepModal?.isOpen && (
        <Modal
          visible={CancelStepModal?.isOpen}
          setVisible={() =>
            setCancelStepModal({ isOpen: false, item: null, reason: "" })
          }
          modalWidth="30vw"
          Header={`${t("Cancel")} ${t(CancelStepModal?.item?.Step)}`}
          buttonType="button"
          buttonName="Cancel Step"
          CancelbuttonName="Close"
          handleAPI={handleCancelStepSubmit}
        >
          <div className="row p-2">
            <Input
              type="text"
              className="form-control required-fields"
              id="CancelStepReason"
              name="CancelStepReason"
              lable={t("Cancel Reason")}
              placeholder=" "
              maxLength={200}
              value={CancelStepModal?.reason}
              onChange={(e) =>
                setCancelStepModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              respclass="col-12"
            />
          </div>
        </Modal>
      )}

      {indentViewModal?.isOpen && (
        <Modal
          visible={indentViewModal?.isOpen}
          setVisible={() => setIndentViewModal({ isOpen: false, indentNo: "" })}
          modalWidth={"90vw"}
          Header={t("Pending Indent`s")}
          /* Khaali footer = na Add, na Save. Ye popup yahan sirf dekhne ke
             liye hai; issue karna Patient Issue ki screen ka kaam hai, aur
             wahan ka Add button usi screen ke modal me rehta hai. */
          footer={<></>}
        >
          <IndentReqModal
            type={"indent"}
            /* Jis indent par click hua - popup khulte hi wahi khud khul jaata
               hai. Filter ek saal peeche se lagta hai aur Status ALL rehta
               hai, warna purane ya CLOSE ho chuke indent milte hi nahi. */
            autoIndentNo={indentViewModal?.indentNo}
            department={[]}
            saleOnList={[]}
            SearchPatient={{}}
            /* Ye teeno Patient Issue ki screen ko chalate hain - yahan wo
               screen hai hi nahi. Khaali function isliye, taaki andar ka code
               jyon ka tyon chale aur kuch chhutne par crash na ho. */
            setParentValues={() => {}}
            setSearchPatient={() => {}}
            setModalData={() => {}}
          />
        </Modal>
      )}

      {ForceClearModal?.isOpen && (
        <Modal
          visible={ForceClearModal?.isOpen}
          setVisible={handleCloseForceClearModal}
          modalWidth="35vw"
          Header={t("Force Fully Patient Clear")}
          buttonType="button"
          buttonName={t("Submit")}
          handleAPI={handleForceClearSubmit}
        >
          <div className="p-3">
            <div className="form-group mb-3 d-flex align-items-center" style={{ gap: "10px" }}>
              <input
                type="checkbox"
                id="forceClearCheckbox"
                checked={ForceClearModal.checked}
                onChange={(e) =>
                  setForceClearModal((prev) => ({ ...prev, checked: e.target.checked }))
                }
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="forceClearCheckbox" style={{ cursor: "pointer", fontWeight: "600", margin: 0 }}>
                {t("Force Fully Patient Clear")}
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="forceClearReason" style={{ fontWeight: "600" }}>
                {t("Reason/Remarks")} <span className="text-danger">*</span>
              </label>
              <textarea
                id="forceClearReason"
                className="form-control"
                rows={5}
                placeholder={t("Enter reason for forcefully clearing patient...")}
                value={ForceClearModal.reason}
                onChange={(e) =>
                  setForceClearModal((prev) => ({ ...prev, reason: e.target.value }))
                }
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Clearance;
