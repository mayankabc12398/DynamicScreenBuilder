import React, { useEffect, useMemo, useState } from "react";
import Heading from "../../UI/Heading";
import EMGSevices from "./EMGSevices";
import { DiscountSVG, RateSVG } from "../../SvgIcons";
import { Tooltip } from "primereact/tooltip";
import SlideScreen from "../../front-office/SlideScreen";
import Modal from "../../modalComponent/Modal";
import BillingDetailsTable from "../../UI/customTable/Emergency/BillingDetailsTable";
import {
  getEmergencyBillDetailsAPI,
  getEmergencyBillItemDetails,
} from "../../../networkServices/Emergency";
import Discountchange from "../../modalComponent/Utils/patientBillingModal/Discountchange";
import {
  GetAllAuthorization,
  GetBindDepartment,
  PatientBillingAllTabSave,
  saveTriagingApi,
  updateEmergencyBillItemsApi,
  releaseEmergencyPatientApi,
  savePrimaryDoctorApi,
  saveMedicResidenceDoctorApi,
  generateOrCloseBillOfEmergencyApi,
  CommonReceiptPdf,
} from "../../../networkServices/BillingsApi";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import store from "../../../store/store";
import { setLoading } from "../../../store/reducers/loadingSlice/loadingSlice";
import {
  findSumBillAmount,
  notify,
  reactSelectOptionList,
} from "../../../utils/utils";
import { useTranslation } from "react-i18next";
import LabeledInput from "../../formComponent/LabeledInput";
import { formatCurrency } from "../../../utils/ustil2";
import { useDispatch } from "react-redux";
import ReactSelect from "../../formComponent/ReactSelect";
import {
  BindDisApprovalList,
  GetDiscReasonList,
} from "../../../networkServices/opdserviceAPI";
import TriagingSaveModal from "../../modalComponent/Utils/patientBillingModal/TriagingSaveModel";
import ReleaseModal from "../../modalComponent/Utils/ReleaseModal";
import moment from "moment";
import PrimaryDoctorModel from "../../modalComponent/Utils/PrimaryDoctorModel";
import MedicResidentModal from "../../modalComponent/Utils/MedicResidentModal";
import { toast } from "react-toastify";
import BiilingRemarkModal from "../../modalComponent/Utils/patientBillingModal/BiilingRemarkModal";
import { IPDBillPrints } from "../../../networkServices/ReportsAPI";
import { GetGlobalResources } from "../../../networkServices/opdserviceAPI";
import { RedirectURL } from "../../../networkServices/PDFURL";

export default function BillingDetails({
  data,
  refreshAndReopen,
  setVisible,
  handleBindFrameMenu,
  handleComponentRender,
}) {
  const [billDetailList, setBillDetailList] = useState([]);
  const [department, setDepartment] = useState([]);
  const [bodyData, setBodyData] = useState([]);
  const dispatch = useDispatch();
  const [discounts, setDiscounts] = useState({
    discountApprovalList: [],
    discountReasonList: [],
  });
  const [t] = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const [patientDetail, setPatientDetail] = useState(data);
  const [slideScreenState, setSlideScreenState] = useState({
    name: "",
    component: null,
  });
  const [modalState, setModalState] = useState({
    show: false,
    name: null,
    component: null,
    size: null,
    footer: "Do you want to continue",
  });
  const getBillingDetailListApi = async () => {
    let apiResp = await getEmergencyBillItemDetails(data?.TID);
    debugger;
    if (apiResp?.success) {
      let modifyData = apiResp?.data?.map((val) => {
        val.isChecked = false;
        return val;
      });
      setBillDetailList(modifyData);
    } else {
      setBillDetailList([]);
    }
  };

  const iconElements = [
    {
      Component: "Update Triaging",
      tooltipText: t("Update Triaging"),
      onClick: () =>
        handleModalState(
          true,
          t("Update Triaging"),
          <TriagingSaveModal onSave={TragingApiCall} />,
          "25vw",
          <></>,
        ),
    },
    {
      Component: "Cloasing patient without Bill",
      tooltipText: t("Cloasing patient without Bill"),
      onClick: () =>
        handleModalState(
          true,
          t("Cloasing patient without Bill"),
          <ReleaseModal onSave={ReleaseApiCall} />,
          "50vw",
          <></>,
        ),
    },
    {
      Component: "Primary Doctor Changes",
      tooltipText: t("Primary Doctor Changes"),
      onClick: () =>
        handleModalState(
          true,
          t("Primary Doctor Changes"),
          <PrimaryDoctorModel onSave={DoctorModalApiCall} />,
          "25vw",
          <></>,
        ),
    },
    {
      Component: "Medic/Resident Doctor",
      tooltipText: t("Medic/Resident Doctor"),
      onClick: () =>
        handleModalState(
          true,
          t("Medic/Resident Doctor"),
          <MedicResidentModal onSave={MedicResidentModalApiCall} />,
          "25vw",
          <></>,
        ),
    },
  ];

  const closePatientBill = () => {
    handleModalState(
      true,
      t("Cloasing patient without Bill"),
      <ReleaseModal onSave={ReleaseApiCall} />,
      "50vw",
      <></>,
    );
  };
  const handleModalState = (show, name, component, size, footer) => {
    setModalState({
      show: show,
      name: name,
      component: component,
      size: size,
      footer: footer,
    });
  };

  // Emergency bills sit in the same ledger tables as IPD, so the IPD bill print
  // (Reports/IPDBillPrint) prints them - as a detail bill (item-wise), with logo and receipts.
  const handleBilPrint = async () => {
    const transactionID = patientDetail?.transactionID || data?.transactionID;
    if (!transactionID) {
      notify("Transaction not found for this patient", "error");
      return;
    }
    let isResourceLogo = 0;
    try {
      const resp = await GetGlobalResources();
      const resourceLogo = resp?.data?.find(
        (item) => item?.Name === "IsResourceLogo"
      );
      isResourceLogo = String(resourceLogo?.Value) === "1" ? 1 : 0;
    } catch (error) {
      console.error(error);
    }
    try {
      store.dispatch(setLoading(true));
      const response = await IPDBillPrints({
        TransactionID: String(transactionID),
        Duplicate: 1,
        BillType: "DET",
        IsBaseCurrency: 0,
        IsReceipt: 1,
        logo: "1",
        signature: 0,
        IsPrintedDate: 0,
        typeOfBill: 0,
        ReportType: 0,
        IsResourceLogo: String(isResourceLogo),
      });
      if (response?.success && response?.data?.pdfUrl) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message || "No Record Found", "error");
      }
    } catch (error) {
      notify("Bill print failed", "error");
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  const getEmergencyPatientDetails = async () => {
    let apiResp = await getEmergencyBillDetailsAPI(data?.transactionID);
    if (apiResp?.success) {
      setPatientDetail((val) => ({ ...val, ...apiResp?.data[0] }));
      // setBillDetail(apiResp?.data[0])
    }
  };

  console.log(patientDetail, "patientDetail");

  const localdata = useLocalStorage("userData", "get");
  const handleDataInDetailView = useMemo(() => {
    if (Object.keys(patientDetail)?.length > 0) {
      const data = [
        {
          label: t("Gross Amount"),
          value: patientDetail?.GrossBillAmount || "0.00",
        },
        {
          label: t("Item Discount"),
          value: patientDetail?.ItemWiseDiscount || "0.00",
        },
        {
          label: t("Discount On Bill"),
          value: patientDetail?.DiscountOnBill || "0.00",
        },
        {
          label: t("Total Discount"),
          value: patientDetail?.TotalDiscount || "0.00",
        },
        {
          label: t("Round Off"),
          value: patientDetail?.RoundOff || "0.00",
        },
        {
          label: t("Net Amount"),
          value: patientDetail?.NetAmount || "0.00",
        },
        {
          label: t("Patient Payable"),
          value: patientDetail?.PatientPaybleAmt || "0.00",
        },
        {
          label: t("Panel Payable"),
          value: patientDetail?.PanelPaybleAmt || "0.00",
        },
        {
          label: t("Patient Paid"),
          value: patientDetail?.PatientPaidAmt || "0.00",
        },
        {
          label: t("Panel Paid"),
          value: patientDetail?.PanelPaidAmt || "0.00",
        },
        {
          label: t("Total Paid"),
          value: patientDetail?.TotalPaidAmount || "0.00",
        },
        {
          label: t("Deduction"),
          value: patientDetail?.TotalDeductions || "0.00",
        },
        {
          label: t("TDS"),
          value: patientDetail?.TotalTDS || "0.00",
        },
        {
          label: t("Write Off"),
          value: patientDetail?.TotalWriteOff || "0.00",
        },
        {
          label: t("Balance Amt"),
          value: patientDetail?.RemainingAmt || "0.00",
        },
        {
          label: t("Patient Balance"),
          value: patientDetail?.PatientRemaining || "0.00",
        },
        {
          label: t("Panel Balance"),
          value: patientDetail?.PanelRemaining || "",
        },
      ];

      return data;
    } else {
      return [];
    }
  }, [patientDetail]);
  console.log("ss", patientDetail);

  const GetDiscListAPI = async () => {
    try {
      const [discountReasonListRes, discountApprovalListRes] =
        await Promise.all([
          GetDiscReasonList("OPD"),
          BindDisApprovalList("HOSPITAL", "1"),
        ]);

      setDiscounts({
        ...discounts,
        discountApprovalList: discountApprovalListRes?.data,
        discountReasonList: discountReasonListRes?.data,
      });
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  useEffect(() => {
    getEmergencyPatientDetails();
    GetDiscListAPI();
  }, []);
  const [values, setValues] = useState({});
  const handleChangeReactSelect = (name, e) => {
    setValues({
      ...values,
      [name]: e.value,
    });
  };
  useEffect(() => {
    const selected = billDetailList?.filter((x) => x.isChecked);

    const updated = selected.map((x) => ({
      ...x,
      discountReason: values?.discountReason?.value || "",
      approvedBy: values?.discountApproveBy?.value || "",
    }));

    setBodyData(updated);
  }, [billDetailList, values.discountReason, values.discountApproveBy]);

  const isDiscountApplied = billDetailList.some(
    (x) => x.isChecked && (x.DiscPer > 0 || x.DiscAmt > 0),
  );
  const GetBindAuthorization = async () => {
    try {
      const datas = await GetAllAuthorization();
      return datas?.data;
    } catch (error) {
      console.log(error);
    }
  };

  const GetBindBillDepartment = async () => {
    const transID = data?.transactionID;
    try {
      const response = await GetBindAuthorization();
      const datas = await GetBindDepartment(transID, response[0]?.CanViewRate);
      setDepartment(datas?.data);
      setAuthorization(response[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const TragingApiCall = async (dataFromChild) => {
    const res = await saveTriagingApi(
      dataFromChild?.triageCode,
      patientDetail?.transactionID,
    );
    if (res?.success) {
      notify(res?.message, "success");
      handleModalState(false, null, null, null, <></>);
      if (typeof refreshAndReopen === "function") {
        setVisible();
      }
    } else {
      notify(res?.message, "error");
      handleModalState(false, null, null, null, <></>);
    }
  };

  const validateReleaseData = (check) => {
    const errors = [];

    if (!check.releaseType) {
      errors.push("Please select release type.");
    }

    if (check.releaseType === "Death") {
      if (!check.reason) errors.push("Please enter released reason.");

      if (!check.dateDeath) errors.push("Please select death date.");

      if (!check.timeDeath) errors.push("Please select death time.");

      if (!check.causeOfDeath) errors.push("Please enter cause of death.");

      if (!check.typeOfDeath) errors.push("Please enter type of death.");

      if (check.deathOver48hr === undefined || check.deathOver48hr === null) {
        errors.push("Please select death over 48hr yes/no.");
      }
    }

    return errors;
  };
  const ReleaseApiCall = async (dataFromChild) => {
    const validationErrors = validateReleaseData(dataFromChild);

    if (validationErrors.length > 0) {
      notify(validationErrors[0], "error"); // show first error
      return; // do not continue
    }
    let payload;
    dataFromChild?.releaseType == "Death"
      ? (payload = {
          transactionID: patientDetail?.transactionID,
          releaseType: dataFromChild?.releaseType || "",
          releasedReason: dataFromChild?.reason,
          isDeath: dataFromChild?.releaseType === "Death" ? "1" : "0",
          deathDate: dataFromChild?.dateDeath
            ? moment(dataFromChild?.dateDeath).format("DD-MM-YYYY")
            : "",
          deathTime: dataFromChild?.timeDeath
            ? moment(dataFromChild?.timeDeath).format("hh:mm A")
            : "",
          deathCause: dataFromChild?.causeOfDeath || "",
          remarks: dataFromChild?.remarks || "",
          deathType: dataFromChild?.typeOfDeath,
          deathOver48hr: dataFromChild?.deathOver48hr == true ? "1" : "0",
          isWithoutBill: "0",
        })
      : (payload = {
          transactionID: patientDetail?.transactionID,
          releaseType: dataFromChild?.releaseType || "",
          isWithoutBill: "0",
        });

    const res = await releaseEmergencyPatientApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      handleModalState(false, null, null, null, <></>);
    } else {
      notify(res?.message, "error");
      handleModalState(false, null, null, null, <></>);
    }
  };
  const DoctorModalApiCall = async (dataFromChild) => {
    console.log("ss", dataFromChild);
    const payload = {
      doctorID: dataFromChild?.Doctor,
      tid: patientDetail?.transactionID,
    };
    const res = await savePrimaryDoctorApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      handleModalState(false, null, null, null, <></>);
      if (typeof refreshAndReopen === "function") {
        setVisible();
      }

      // const updatedPatient = {
      //     ...patientDetail,
      //     DoctorID: dataFromChild?.Doctor,
      //     DoctorName: dataFromChild?.DoctorName
      // };
      // debugger
      // // 4️⃣ Find BillingDetails file in menu list
      // const billingItem = handleBindFrameMenu.find(
      //     (x) => x.URL === "BillingDetails"
      // );

      // // 5️⃣ Reopen BillingDetails with updated data
      // if (billingItem && typeof handleComponentRender === "function") {
      //     handleComponentRender(updatedPatient, billingItem);
      // }
    } else {
      notify(res?.message, "error");
      handleModalState(false, null, null, null, <></>);
    }
  };
  const MedicResidentModalApiCall = async (dataFromChild) => {
    debugger;
    const payload = {
      doctorID: dataFromChild?.Doctor,
      transactionID: patientDetail?.transactionID,
    };
    const res = await saveMedicResidenceDoctorApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      handleModalState(false, null, null, null, <></>);
      if (typeof refreshAndReopen === "function") {
        setVisible();
      }
    } else {
      notify(res?.message, "error");
      handleModalState(false, null, null, null, <></>);
    }
  };
  const handlePatientBillingAllTabSave = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      payload.ipAddress = String(ip);
      const checkedData = [];

      billDetailList?.map((val, index) => {
        if (val?.isChecked) {
          checkedData.push(`'${val?.LedgerTnxID}'`);
        }
      });

      // for (let i = 0; i < billDetailList?.length; i++) {
      //     const { subRow } = billDetailList[i];
      //         if (subRow?.subRowList[j]?.["isChecked"] === true) {
      //             checkedData.push(`'${subRow?.subRowList[j]?.["LtNo"]}'`);

      //     }
      // }
      payload.ltdNo = checkedData.join(",");
      // debugger
      const response = await PatientBillingAllTabSave(payload);
      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        handleModalState(false, null, null, null, <></>);
        getBillingDetailListApi();
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getBillingDetailListApi();
  }, [slideScreenState?.show]);

  const ConfirmToast = ({ message, onConfirm, onCancel }) => (
    <div>
      <p>{message}</p>
      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
        <button onClick={onConfirm}>{t("Yes")}</button>
        <button onClick={onCancel}>{t("No")}</button>
      </div>
    </div>
  );

  const handleCloseBill = () => {
    debugger;
    if (patientDetail?.DischargeStatus === "IN") {
      toast(t("Please Discharge the Patient before closing the bill."), {
        autoClose: true,
        closeOnClick: false,
      });
      return;
    }

    // Show confirmation toast
    const toastId = toast(
      <ConfirmToast
        message={t("Are you sure you want to close the bill?")}
        onConfirm={() => handleConfirmClose(toastId)}
        onCancel={() => toast.dismiss(toastId)}
      />,
      {
        autoClose: false,
        closeOnClick: false,
      },
    );
  };
  const handleConfirmClose = async (toastId) => {
    toast.dismiss(toastId);

    try {
      console.log("call");
      const payload = {
        pid: patientDetail?.PatientID,
        transactionID: patientDetail?.TID,
        roomId: patientDetail?.RoomId,
        panelID: patientDetail?.PanelID,
      };
      const res = await generateOrCloseBillOfEmergencyApi(payload);
      if (res?.success) {
        notify(res?.message, "success");
      } else {
        notify(res?.message, "error");
      }
    } catch (error) {
      toast.error(t("Something went wrong!"));
    }
  };

  const handleRowChange = (e, index, field) => {
    // const { name, checked } = e.target;
    // const data = JSON.parse(JSON.stringify(billDetailList));
    // data[index][name] = checked;
    // setBillDetailList(data);

    let updated = [...billDetailList];
    let row = updated[index];
    if (row.ConfigID === 11) return;
    let value = e.target.value;

    if (field) {
      updated[index][field] = value;
    } else {
      updated[index].isChecked = e.target.checked;
    }

    let rate = Number(updated[index].Rate || 0);
    let qty = Number(updated[index].Qty || 1);
    let discPer = Number(updated[index].DiscPer || 0);
    let discAmt = Number(updated[index].DiscAmt || 0);

    let baseAmount = rate * qty;

    if (field === "DiscPer") {
      discAmt = (baseAmount * discPer) / 100;
      updated[index].DiscAmt = discAmt.toFixed(2);
    }

    if (field === "DiscAmt") {
      if (baseAmount > 0) {
        discPer = (discAmt / baseAmount) * 100;
        updated[index].DiscPer = discPer.toFixed(2);
      } else {
        updated[index].DiscPer = "0";
      }
    }

    if (field === "Rate" || field === "Qty") {
      discAmt = (baseAmount * discPer) / 100;
      updated[index].DiscAmt = discAmt.toFixed(2);
    }

    updated[index].Amount = (baseAmount - discAmt).toFixed(2);
    setBillDetailList(updated);
  };

  const handleHeaderRateChange = (e) => {
    const newRate = Number(e.target.value);
    if (!newRate) return;

    let updated = billDetailList.map((item) => {
      if (!item.isChecked || item?.ConfigID == 11) return item;

      let rate = newRate;
      let qty = Number(item.Qty || 1);
      let discPer = Number(item.DiscPer || 0);

      let baseAmount = rate * qty;
      let discAmt = (baseAmount * discPer) / 100;

      return {
        ...item,
        Rate: rate,
        DiscAmt: discAmt.toFixed(2),
        Amount: (baseAmount - discAmt).toFixed(2),
      };
    });

    setBillDetailList(updated);
  };
  const handleDiscountChange = (e) => {
    const newDiscPer = Number(e.target.value);
    if (newDiscPer < 0) return;

    let updated = billDetailList.map((item) => {
      if (!item.isChecked || item?.ConfigID == 11) return item;

      let rate = Number(item.Rate || 0);
      let qty = Number(item.Qty || 1);

      let baseAmount = rate * qty;
      let discAmt = (baseAmount * newDiscPer) / 100;

      return {
        ...item,
        DiscPer: newDiscPer,
        DiscAmt: discAmt.toFixed(2),
        Amount: (baseAmount - discAmt).toFixed(2),
      };
    });

    setBillDetailList(updated);
  };

  console.log(bodyData);

  const handleSlideScreen = () => {
    setSlideScreenState({
      name: "Add Services Details",
      show: true,
      component: (
        <div className="card patient_registration border mt-2">
          <div className="row p-2">
            <div className="col-sm-12">
              <EMGSevices
                data={patientDetail}
                setSlideScreenState={setSlideScreenState}
              />
            </div>
          </div>
        </div>
      ),
    });
  };
  const handleUpdate = async () => {
    console.log(bodyData);

    const ltdList = bodyData.map((row) => ({
      id: Number(row.ID),
      rate: Number(row.Rate),
      quantity: Number(row.Quantity),
      amount: Number(row.Amount),
      discountPercentage: Number(row.DiscPer),
      discAmt: Number(row.DiscAmt),
    }));
    const payload = {
      transactionID: patientDetail?.transactionID || "",
      discountReason: values?.discountReason || "",
      discountApproveBy: values?.discountApproveBy || "",
      ipAddress: String(ip),
      ltd: ltdList,
    };
    const res = await updateEmergencyBillItemsApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      getBillingDetailListApi();
      getEmergencyPatientDetails();
      setValues({});
    } else {
      notify(res?.message, "error");
    }
  };
  return (
    <>
      <div className="card patient_registration border mt-2">
        <div className="card card_background">
          <Heading
            title={t("Patient Bill Details")}
            secondTitle={
              <button
                className="btn btn-sm btn-primary mr-2"
                onClick={() =>
                  handleModalState(
                    true,
                    t("Billing Remarks"),
                    <BiilingRemarkModal
                      pateintDetails={patientDetail}
                      handleModalState={handleModalState}
                      GetBindBillDepartment={GetBindBillDepartment}
                    />,
                    "25vw",
                    <></>,
                  )
                }
              >
                {t("Billing Remarks")}
              </button>
            }
          />
          <div className="row p-2">
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
                  <div className="d-flex align-items-center">
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
                      style={{ textAlign: "right", color: "red" }}
                    />
                  </div>
                </div>
              </>
            ))}
          </div>

          <Heading
            title={<div>{t("Department Details")}</div>}
            secondTitle={
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSlideScreen}
                >
                  {t("Add Services")}
                </button>
              </>
            }
          />

          <div className="d-flex align-items-center justify-content-end p-1">
            {iconElements.map((item, index) => (
              <div key={index} style={{ display: "inline-block" }}>
                <Tooltip
                  target={`#icon-${index}`}
                  content={item.tooltipText}
                  event="hover"
                  position="top"
                />
                <span
                  id={`icon-${index}`}
                  onClick={item.onClick ? item.onClick : null}
                >
                  <button className="btn btn-sm btn-primary mr-2">
                    {item?.Component}
                  </button>
                  {/* <item.Component /> */}
                </span>
              </div>
            ))}
          </div>
          <div className="row p-2">
            <div className="col-12">
              <BillingDetailsTable
                tbody={billDetailList}
                handleRowChange={handleRowChange}
                setBillDetailList={setBillDetailList}
                handleModalState={handleModalState}
                GetBindBillDepartment={getBillingDetailListApi}
                pateintDetails={patientDetail}
                rateChange={handleHeaderRateChange}
                discChnage={handleDiscountChange}
              />
              <div className="d-flex aling-items-center justify-content-end mt-2">
                <ReactSelect
                  isDisabled={!isDiscountApplied}
                  placeholderName={"Discount Reason"}
                  id={"SR"}
                  searchable={true}
                  respclass={"col-md-2 mx-2"}
                  dynamicOptions={reactSelectOptionList(
                    discounts?.discountReasonList,
                    "DiscountReason",
                    "ID",
                  )}
                  name="discountReason"
                  handleChange={handleChangeReactSelect}
                  value={values?.discountReason}
                  requiredClassName={
                    findSumBillAmount(bodyData, "discountAmount") > 0
                      ? "required-fields"
                      : ""
                  }
                  removeIsClearable={true}
                />

                <ReactSelect
                  isDisabled={!isDiscountApplied}
                  placeholderName={"Approved By"}
                  id={"AB"}
                  searchable={true}
                  respclass={"col-md-2 mx-2"}
                  handleChange={handleChangeReactSelect}
                  value={values?.discountApproveBy}
                  dynamicOptions={reactSelectOptionList(
                    discounts?.discountApprovalList,
                    "ApprovalType",
                    "ID",
                  )}
                  name="discountApproveBy"
                  requiredClassName={
                    findSumBillAmount(bodyData, "discountAmount") > 0
                      ? "required-fields"
                      : ""
                  }
                  removeIsClearable={true}
                />
                {/* {isDiscountApplied && ( */}
                <button
                  className="btn btn-sm btn-primary mr-2"
                  onClick={handleUpdate}
                >
                  {t("Update Billing")}
                </button>
                {/* )} */}
                <button
                  className="btn btn-sm btn-primary mr-2"
                  onClick={closePatientBill}
                >
                  {t("Closeing Patient Without Bill")}
                </button>
                <button
                  className="btn btn-sm btn-primary mr-2"
                  onClick={handleCloseBill}
                >
                  {t("Close Billing")}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleBilPrint}
                >
                  {t("Print")}
                </button>
              </div>
            </div>
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

      <Modal
        Header={modalState?.name}
        modalWidth={modalState?.size}
        visible={modalState?.show}
        setVisible={() => {
          handleModalState(false, null, null, null, <></>);
        }}
        footer={modalState?.footer}
      >
        {modalState?.component}
      </Modal>
    </>
  );
}
