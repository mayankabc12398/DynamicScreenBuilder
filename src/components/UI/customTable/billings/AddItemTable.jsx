import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "..";
import Input from "../../../formComponent/Input";
import CustomSelect from "../../../formComponent/CustomSelect";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { GetAllDoctor } from "../../../../store/reducers/common/CommonExportFunction";
import DatePicker from "../../../formComponent/DatePicker";
import TimePicker from "../../../formComponent/TimePicker";
import { AMOUNT_REGX, ROUNDOFF_VALUE } from "../../../../utils/constant";
import {
  findSumBillAmount,
  handleReactSelectDropDownOptions,
  handleRequestBodyBillingSaveSaveServicesBilling,
  notify,
  reactSelectOptionList,
} from "../../../../utils/utils";
import {
  BillingSaveSaveServicesBilling,
  BindHouseList,
  GetPendingBarcodes,
  handleValidateUserToBill,
  IPDServiceBillPdf,
  PatientBillingGetPackage,
} from "../../../../networkServices/BillingsApi";
import { useLocation } from "react-router-dom";
import {
  BindDisApprovalList,
  bindHashCode,
  GetDiscReasonList,
} from "../../../../networkServices/opdserviceAPI";
import ReactSelect from "../../../formComponent/ReactSelect";
import TimeInputPicker from "../../../formComponent/CustomTimePicker/TimeInputPicker";
import Modal from "../../../modalComponent/Modal";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
import { RedirectURL } from "../../../../networkServices/PDFURL";
import Surgery from "../../../FrameMenu/Surgery";

const AddItemTable = (props) => {
  const {
    THEAD,
    tbody,
    setTableData,
    Authorization,
    pateintDetails,
    handleSaveAddItemSuccessfully,
    GetBindBillDetails,
    packageID,
    data,
  } = props;
  console.log("packageID", packageID);
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { GetAllDoctorList, GetGlobalResources } = useSelector(
    (state) => state?.CommonSlice,
  );
  /* Same rule as OPD Booking (TestAddingTable): fin_global_resources -> OPDDoctorSelectCategoryIDs,
     CategoryID(s) comma separated (6 = PROCEDURE CHARGES). When set, the Doctor dropdown shows only on
     items of those categories; other rows keep their doctor as before. Empty / missing key = dropdown on
     every item (old way). */
  const doctorSelectCategoryIDs = (
    (Array.isArray(GetGlobalResources) ? GetGlobalResources : GetGlobalResources?.data || [])
      ?.find((item) => item?.Name === "OPDDoctorSelectCategoryIDs")?.Value ?? ""
  )
    .toString()
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "" && value !== "0");
  // TRF (Test Requisition Form) yahan se hata diya gaya hai - IPD me service
  // save hote hi ab sirf usi save ka parcha nikalta hai. TRF pehle ki tarah
  // Sample Collection aur OPD Booking se nikalta rahega; unka Trf_form switch
  // jaisa tha waisa hi hai.

  // Save karte hi usi save ka parcha - jitni baar Save, utni baar print.
  // Switch fin_global_resources me hai (IPDServiceBillPrint), isliye jis
  // hospital ko ye nahi chahiye wahan Value 0 karte hi band ho jaata hai.
  const isServiceBillPrintEnabled =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find((item) => item?.Name === "IPDServiceBillPrint")
        ?.Value,
    ) === "1";

  // Parche par SIRF abhi save hui items chahiye, poora bill nahi - is liye
  // save ki lautayi hui ID range hi aage bhejte hain.
  // 25-10-2026: the "IPD Bill" slip of a Save prints when "Print on Save" is ticked (or the
  // IPDServiceBillPrint switch is on).
  // "Print on Save" tick box: ticked = the slip prints right after a successful Save.
  const [printOnSave, setPrintOnSave] = useState(false);
  const handleServiceBillPrint = async (saveData, force = false) => {
    if (!force && !isServiceBillPrintEnabled) return;

    const transactionID = Number(
      saveData?.transactionID ||
        saveData?.TransactionID ||
        pateintDetails?.TransactionID,
    );
    const fromLedgerTnxID = Number(
      saveData?.fromLedgerTnxID ?? saveData?.FromLedgerTnxID,
    );
    const toLedgerTnxID = Number(
      saveData?.toLedgerTnxID ?? saveData?.ToLedgerTnxID,
    );

    // Purana API (bina range wala) chal raha ho to parcha chhodna behtar hai -
    // warna range 0 se jaati aur poora bill chhap jaata, jo maanga hi nahi gaya.
    if (
      !transactionID ||
      !Number.isFinite(fromLedgerTnxID) ||
      !Number.isFinite(toLedgerTnxID) ||
      toLedgerTnxID <= fromLedgerTnxID
    ) {
      return;
    }

    try {
      const billResp = await IPDServiceBillPdf({
        transactionID,
        fromLedgerTnxID,
        toLedgerTnxID,
        isLogo: 1,
      });
      if (billResp?.success && billResp?.data?.pdfUrl) {
        RedirectURL(billResp?.data?.pdfUrl);
      } else {
        notify(billResp?.message || "Failed to generate IPD Bill", "error");
      }
    } catch (error) {
      notify("Error generating IPD Bill", "error");
    }
  };

  // Opt in switch for typing the CPT code straight into the grid. Without an
  // active IsCptCodeEditable row in fin_global_resources the column stays the
  // read only item code it has always been.
  const isCptCodeEditable =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsCptCodeEditable")
      ?.Value === "1";
  const dispatch = useDispatch();
  //  const [packageID, setPackageID] = useState("0");
  const [dropDownState, setDropDownState] = useState([]);
  // console.log("dropDownState",dropDownState)
  const { IsDiscount, IsRate } = Authorization;
  const location = useLocation();
  const [discounts, setDiscounts] = useState({
    discountApprovalList: [],
    discountReasonList: [],
  });

  const [values, setValues] = useState({
    discountReason: "",
    discountApproveBy: "",
    existingBarcode: "",
  });

  // fin_global_resources -> IsAddTestOnExistingBarcode = 1 hone par hi pehle se
  // bane (pending) barcode par naya test joda ja sakta hai. Warna purana
  // behaviour: har save par naya barcode banta hai.
  const isAddTestOnExistingBarcode =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsAddTestOnExistingBarcode")
      ?.Value === "1";
  const [pendingBarcodeList, setPendingBarcodeList] = useState([]);
  const hasLabItem = tbody?.some((item) => String(item?.ConfigID) === "3");
  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const [t] = useTranslation();
  const handlePatientBillingGetPackage = async (TransactionID) => {
    // debugger
    try {
      const response = await PatientBillingGetPackage(TransactionID);
      console.log("firstresponse", response);
      setDropDownState([
        { label: t("No Package"), value: "0" },
        ...handleReactSelectDropDownOptions(
          response?.data,
          "TypeName",
          "ItemID",
        ),
      ]);
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };
  const handleCalulateOfTableData = (data, name) => {
    // debugger
    let modifiedData = JSON.parse(JSON.stringify(data));
    const rate = Number(modifiedData.Rate) || 0;
    const qty = Number(modifiedData.quantity) || 0;
    const discPercent = Number(modifiedData.ipdPanelDiscPercent || 0);
    const discountAmount = Number(modifiedData.discountAmount || 0);
    const coPayPercent = Number(modifiedData.ipdCoPayPercent || 0);

    if (!["sampleReqDate", "remark", "ItemCode", "HouseID"].includes(name)) {
      if (name !== "discountAmount") {
        modifiedData.discountAmount = Number(
          rate * qty * discPercent * 0.01,
        ).toFixed(ROUNDOFF_VALUE);
      }

      // if (name !== "ipdPanelDiscPercent") {
      //   const total = rate * qty;
      //   modifiedData.ipdPanelDiscPercent =
      //     total > 0
      //       ? Number((discountAmount * 100) / total).toFixed(ROUNDOFF_VALUE)
      //       : "0.00";
      // }
      if (name === "discountAmount") {
        const total = rate * qty;
        modifiedData.ipdPanelDiscPercent =
          total > 0
            ? Number((discountAmount * 100) / total).toFixed(ROUNDOFF_VALUE)
            : "0.00";
      }
      const discount = Number(modifiedData.discountAmount) || 0;
      modifiedData.amount = rate * qty - discount;

      if (Number(modifiedData.isPayble) === 1) {
        modifiedData.PatientPayable = modifiedData.amount;
      } else {
        modifiedData.PatientPayable = (
          modifiedData.amount *
          coPayPercent *
          0.01
        ).toFixed(ROUNDOFF_VALUE);
      }
    }

    return modifiedData;
  };

  const handleDeleteItem = (index) => {
    const data = tbody.filter((_, inx) => index !== inx);
    setTableData(data);
    notify(t("Successfully Removed Item"), "success");
  };

  // "Add Surgery" on a package row, after Remark - same surgery picker the Edit
  // Package modal uses. Shown only on ConfigID 14 (IPD Package) rows; everything
  // else leaves surgeryID/surgeryName blank, same as before this column existed.
  const [surgeryModal, setSurgeryModal] = useState({
    visible: false,
    rowIndex: null,
  });

  const handleSurgerySavedForRow = (surgery) => {
    if (surgeryModal.rowIndex !== null) {
      const updated = [...tbody];
      updated[surgeryModal.rowIndex] = {
        ...updated[surgeryModal.rowIndex],
        surgeryID: surgery?.Surgery_ID ? String(surgery.Surgery_ID) : "",
        surgeryName: surgery?.SurgeryName || "",
      };
      setTableData(updated);
    }
    setSurgeryModal({ visible: false, rowIndex: null });
  };

  const handleRemoveSurgeryFromRow = (index) => {
    const updated = [...tbody];
    updated[index] = { ...updated[index], surgeryID: "", surgeryName: "" };
    setTableData(updated);
  };

  const handleCheckData = (e, index) => {
    const { name, checked } = e.target;
    const data = [...tbody];
    data[index][name] = checked;
    setTableData(data);
  };

  const findTotalSumBillAmount = (data, key) => {
    // ;
    const value = data?.reduce(
      (acc, current) =>
        acc +
        ((Number(current[key] ? current[key] : 0) * 100) /
          (100 + current?.SaleTaxPercentage)) *
          current?.SaleTaxPercentage *
          0.01,
      0,
    );
    return Number(value);
  };

  const handleChange = (e, index, ...rest) => {
    const { name, value, label, labelName } = e.target;

    if (rest?.length > 0 && rest.some((element) => element === false)) {
      return;
    }
    const data = [...tbody];
    // debugger
    const modifiedData = { ...data[index] };
    modifiedData[name] = value;
    const resultData = handleCalulateOfTableData(modifiedData, name);
    data[index] = resultData;
    if (label) {
      data[index][labelName] = label;
    }
    setTableData(data);
  };

  const handleTableData = (tableData) => {
    const reponse = tableData.map((item, index) => {
      return {
        date: item?.Date,
        CPT: isCptCodeEditable ? (
          <Input
            type="text"
            className="table-input"
            removeFormGroupClass={true}
            name={"ItemCode"}
            maxLength={"50"}
            value={item?.ItemCode || ""}
            onChange={(e) => handleChange(e, index)}
          />
        ) : (
          item?.ItemCode
        ),
        SubCategoryName: item?.SubCategoryName,
        itemName: item?.TypeName,
        BillingCategoryName: item?.BillingCategoryName || "-",
        Doctor: (doctorSelectCategoryIDs.length === 0 ||
          doctorSelectCategoryIDs.includes(String(item?.CategoryID ?? "").trim())) && (
          <CustomSelect
            placeHolder={"Select Doctor"}
            value={item?.DoctorID}
            name={"DoctorID"}
            option={GetAllDoctorList}
            onChange={(e, option) =>
              handleChange(
                {
                  target: {
                    name: "DoctorID",
                    value: option?.value,
                    label: option?.label,
                    labelName: "DoctorName",
                  },
                },
                index,
              )
            }
            // onChange={(name, option) => console.log("name", name,{target:{name:"DoctorID",value:option?.value}})}
          />
        ),
        // Defaults to the item's mapped name; blank when the item is not mapped - the biller picks.
        House: (
          <CustomSelect
            placeHolder={"Select In / Out House"}
            value={item?.HouseID ? item?.HouseID : ""}
            name={"HouseID"}
            option={houseList}
            onChange={(e, option) =>
              handleChange(
                {
                  target: {
                    name: "HouseID",
                    value: option?.value ?? 0,
                    label: option?.label,
                    labelName: "HouseName",
                  },
                },
                index,
              )
            }
          />
        ),
        SampleReqDate: (
          <DatePicker
            className="custom-calendar w-100"
            respclass={"table-calender-height"}
            value={item?.sampleReqDate}
            removeFormGroupClass={true}
            id="sampleReqDate"
            name="sampleReqDate"
            placeholder={VITE_DATE_FORMAT}
            showTime
            hourFormat="12"
            disable={![3].includes(Number(item?.ConfigID))}
            handleChange={(e) => handleChange(e, index)}
          />
        ),
        SampleReqTime: (
          <TimePicker
            removeFormControl={true}
            className={"table-time"}
            value={item?.sampleReqTime}
          />
        ),
        TaxType: item?.SalesTaxGroupName,
        TAX: item?.SaleTaxPercentage,
        rate: (
          <>
            <Input
              type="number"
              className="table-input"
              removeFormGroupClass={true}
              display={"right"}
              name={"Rate"}
              value={Number(item?.Rate) || 0}
              // disabled={!Boolean(IsRate)}
              disabled={item?.RateEditable === 0}
              // disabled={!item?.isRateEditable}

              onChange={(e) =>
                handleChange(e, index, AMOUNT_REGX(8).test(e?.target?.value))
              }
            />
          </>
        ),
        Quantity: (
          <Input
            type="number"
            className="table-input"
            removeFormGroupClass={true}
            display={"right"}
            name={"quantity"}
            value={Number(item?.quantity) || 0}
            disabled={[1, 3].includes(Number(item?.ConfigID))}
            onChange={(e) =>
              handleChange(e, index, AMOUNT_REGX(3).test(e?.target?.value))
            }
          />
        ),
        discountPer: (
          <Input
            type="number"
            className="table-input"
            removeFormGroupClass={true}
            value={item?.ipdPanelDiscPercent ? item?.ipdPanelDiscPercent : "0"}
            name={"ipdPanelDiscPercent"}
            disabled={!Boolean(IsDiscount)}
            display={"right"}
            maxLength={"3"}
            onChange={(e) =>
              handleChange(
                e,
                index,
                AMOUNT_REGX(3).test(e?.target?.value),
                Number(e?.target?.value) <= 100,
              )
            }
          />
        ),
        discountAmt: (
          <Input
            type="number"
            className="table-input"
            removeFormGroupClass={true}
            value={item?.discountAmount || 0}
            name={"discountAmount"}
            disabled={!Boolean(IsDiscount)}
            display={"right"}
            onChange={(e) =>
              handleChange(
                e,
                index,
                AMOUNT_REGX(8).test(e?.target?.value),
                Number(e?.target?.value) <= item?.Rate,
              )
            }
          />
        ),
        Amount: <div className="text-right">{String(item?.amount)}</div>,
        GSTAmount: (
          <div className="text-right">
            {" "}
            {(
              ((Number(item?.amount ? item?.amount : 0) * 100) /
                (100 + item?.SaleTaxPercentage)) *
              item?.SaleTaxPercentage *
              0.01
            ).toFixed(ROUNDOFF_VALUE)}
          </div>
        ),
        Payable: (
          <div className="text-right">
            {Number(item?.PatientPayable).toFixed(ROUNDOFF_VALUE)}
          </div>
        ),
        Remark: (
          <Input
            type="text"
            className="table-input"
            removeFormGroupClass={true}
            name={"remark"}
            value={item?.remark}
            onChange={(e) => handleChange(e, index)}
          />
        ),
        Surgery:
          String(item?.ConfigID) === "14" ? (
            <div className="d-flex align-items-center" style={{ whiteSpace: "nowrap" }}>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setSurgeryModal({ visible: true, rowIndex: index })}
              >
                {item?.surgeryID ? t("Change") : t("Add Surgery")}
              </button>
              {item?.surgeryID ? (
                <>
                  <span className="ml-1" title={item?.surgeryName}>
                    {item?.surgeryName} ({item?.surgeryID})
                  </span>
                  <i
                    className="fa fa-times text-danger ml-1"
                    title={t("Remove surgery from this item")}
                    onClick={() => handleRemoveSurgeryFromRow(index)}
                  />
                </>
              ) : null}
            </div>
          ) : null,
        urgent: (
          <input
            type="checkbox"
            checked={item?.isUrgent}
            name="isUrgent"
            onChange={(e) => handleCheckData(e, index)}
          />
        ),
        Remove: (
          <i
            className="fa fa-trash text-danger"
            onClick={() => handleDeleteItem(index)}
          />
        ),
      };
    });
    console.log("tableDatatableData", reponse);
    const obj = {
      date: null,
      CPT: null,
      SubCategoryName: null,
      itemName: null,
      BillingCategoryName: null,
      Doctor: null,
      House: null,
      SampleReqDate: null,
      TaxType: null,
      TAX: null,
      SampleReqTime: null,
      rate: (
        <div className="text-right py-1">
          {findSumBillAmount(tableData, "Rate").toFixed(ROUNDOFF_VALUE)}
        </div>
      ),
      Quantity: null,
      discountPer: null,
      discountAmt: null,
      Amount: (
        <div className="text-right py-1">
          {findSumBillAmount(tableData, "amount").toFixed(ROUNDOFF_VALUE)}
        </div>
      ),
      GSTAmount: (
        <div className="text-right py-1">
          {findTotalSumBillAmount(tableData, "amount").toFixed(ROUNDOFF_VALUE)}
        </div>
      ),
      Payable: (
        <div className="text-right">
          {findSumBillAmount(tableData, "PatientPayable").toFixed(
            ROUNDOFF_VALUE,
          )}
        </div>
      ),
      Remark: null,
      Surgery: null,
      urgent: null,
      Remove: null,
      colorcode: "#cfcfcf",
    };

    reponse.push(obj);
    return reponse;
  };

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
  const GetPendingBarcodeListAPI = async () => {
    if (!isAddTestOnExistingBarcode || !pateintDetails?.TransactionID) return;
    try {
      const apiResp = await GetPendingBarcodes(pateintDetails?.TransactionID);
      setPendingBarcodeList(apiResp?.success ? apiResp?.data || [] : []);
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  console.log("tbody", tbody);
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
        handleBillingSaveSaveServicesBilling();
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
  const handleSave = async () => {
    const hashcode = await bindHashCode();
    const requestBody = handleRequestBodyBillingSaveSaveServicesBilling(
      tbody,
      pateintDetails,
      location,
      hashcode?.data,
      values,
      packageID,
    );

    if (requestBody?.dataLT?.discountOnTotal) {
      if (!values?.discountReason?.value) {
        notify(t("Please select Discount Reason"), "warn");
        return;
      }
      if (!values?.discountApproveBy?.value) {
        notify(t("Please select Approved By"), "warn");
        return;
      }
    }
    setPassword("");
    if (userData?.validateUserForBill) {
      setUserConfirmation(true);
    } else {
      handleBillingSaveSaveServicesBilling();
    }
  };
  const handleBillingSaveSaveServicesBilling = async () => {
    try {
      const hashcode = await bindHashCode();
      const requestBody = handleRequestBodyBillingSaveSaveServicesBilling(
        tbody,
        pateintDetails,
        location,
        hashcode?.data,
        values,
        packageID,
      );

      if (requestBody?.dataLT?.discountOnTotal) {
        if (!values?.discountReason?.value) {
          notify(t("Please select Discount Reason"), "warn");
          return;
        }
        if (!values?.discountApproveBy?.value) {
          notify(t("Please select Approved By"), "warn");
          return;
        }
      }

      const response = await BillingSaveSaveServicesBilling(requestBody);

      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        await handleServiceBillPrint(response?.data, printOnSave);
        handleSaveAddItemSuccessfully();
        GetBindBillDetails();
        setValues((prev) => ({ ...prev, existingBarcode: "" }));
        GetPendingBarcodeListAPI();
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  // In / Out House names for the line dropdown (one master, label carries the type)
  const [houseList, setHouseList] = useState([]);
  const loadHouseList = async () => {
    const resp = await BindHouseList();
    setHouseList(
      resp?.success
        ? (resp?.data || []).map((h) => ({ label: h?.name, value: h?.id }))
        : [],
    );
  };

  useEffect(() => {
    dispatch(GetAllDoctor());
    loadHouseList();
    GetDiscListAPI();
    handlePatientBillingGetPackage(pateintDetails?.TransactionID);
  }, []);

  // Global resource redux me app start par aata hai, isliye flag milne ke baad
  // hi barcode list mangwa rahe hain.
  useEffect(() => {
    GetPendingBarcodeListAPI();
  }, [isAddTestOnExistingBarcode, pateintDetails?.TransactionID]);

  console.log(discounts, "sjcsbcjkb");

  return (
    <>
      {surgeryModal.visible && (
        <Modal
          visible={surgeryModal.visible}
          setVisible={() => setSurgeryModal({ visible: false, rowIndex: null })}
          modalWidth="90vw"
          Header={t("Add Surgery")}
          footer={<></>}
        >
          <Surgery
            data={data}
            handleModalState={() => setSurgeryModal({ visible: false, rowIndex: null })}
            onSurgerySaved={handleSurgerySavedForRow}
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
      <Tables
        thead={THEAD}
        tbody={handleTableData(tbody)}
        style={{ maxHeight: "300px" }}
        scrollView={"scrollView"}
        // tableHeight={"tableHeight"}
        // style={{ maxHeight: "auto" }}
      />
      {/* <TimeInputPicker /> */}
      <div className="d-flex aling-items-center justify-content-end mt-2">
        {/* <ReactSelect
                  respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        placeholderName={"package"}
                            name={"packageID"}
                               id={"packageID"}
                        dynamicOptions={dropDownState}
                        value={packageID}
                        // value={packageID.packageID}
                        // value={values.ItemID}
                        removeIsClearable={true}
                            //  handleChange={handleChange}
                        handleChange={(_, e) => setPackageID(e?.value)}
                      /> */}
        {isAddTestOnExistingBarcode && hasLabItem ? (
          <ReactSelect
            placeholderName={t("Existing Barcode")}
            id={"EB"}
            searchable={true}
            respclass={"col-md-2 mx-2"}
            dynamicOptions={reactSelectOptionList(
              pendingBarcodeList,
              "BarcodeLabel",
              "BarcodeNo",
            )}
            name="existingBarcode"
            handleChange={handleSelect}
            value={`${values?.existingBarcode?.value}`}
          />
        ) : null}

        <ReactSelect
          placeholderName={t("Discount Reason")}
          id={"SR"}
          searchable={true}
          respclass={"col-md-2 mx-2"}
          dynamicOptions={reactSelectOptionList(
            discounts?.discountReasonList,
            "DiscountReason",
            "ID",
          )}
          name="discountReason"
          handleChange={handleSelect}
          requiredClassName={
            findSumBillAmount(tbody, "discountAmount") > 0
              ? "required-fields"
              : ""
          }
          value={`${values?.discountReason?.value}`}
          removeIsClearable={true}
        />

        <ReactSelect
          placeholderName={t("Approved By")}
          id={"AB"}
          searchable={true}
          respclass={"col-md-2 mx-2"}
          dynamicOptions={reactSelectOptionList(
            discounts?.discountApprovalList,
            "ApprovalType",
            "ID",
          )}
          handleChange={handleSelect}
          name="discountApproveBy"
          value={`${values?.discountApproveBy?.value}`}
          requiredClassName={
            findSumBillAmount(tbody, "discountAmount") > 0
              ? "required-fields"
              : ""
          }
          removeIsClearable={true}
        />
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          // onClick={handleBillingSaveSaveServicesBilling}
        >
          {t("Save")}
        </button>
        <label
          className="d-flex align-items-center mb-0 mx-2"
          style={{ whiteSpace: "nowrap", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            className="mr-1"
            checked={printOnSave}
            onChange={(e) => setPrintOnSave(e.target.checked)}
          />
          {t("Print on Save")}
        </label>

      </div>
    </>
  );
};

export default AddItemTable;
