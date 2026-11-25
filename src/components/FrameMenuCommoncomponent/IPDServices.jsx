import { AutoComplete } from "primereact/autocomplete";
import React, { useEffect, useState } from "react";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import ReactSelect from "../formComponent/ReactSelect";
import { useSelector } from "react-redux";
import { Tabfunctionality } from "../../utils/helpers";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  BillingGetRateFromFollowedPanel,
  BindCategory,
  BindItem,
  BindRoomDetails,
  getAlreadyPrescribeItem,
  GetItemHouse,
  PatientBillingGetDiscount,
  PatientBillingGetPackage,
  PatientBillingGetPackageDetail,
} from "../../networkServices/BillingsApi";
import { handleReactSelectDropDownOptions } from "../../utils/utils";
import { GetPatientMembershipDetails } from "../../networkServices/opdserviceAPI";
import { useDispatch } from "react-redux";
import { GetBindSubCatgeory } from "../../store/reducers/common/CommonExportFunction";
import AddItemTable from "../UI/customTable/billings/AddItemTable";
import moment from "moment";
import { ROUNDOFF_VALUE } from "../../utils/constant";
import { use } from "react";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import { notify } from "../../utils/ustil2";
import MembershipCardBanner from "../commonComponents/MembershipCardBanner";
import Confirm from "../modalComponent/Confirm";

const IPDServices = ({
  pateintDetails,
  Authorization,
  handleSaveAddItemSuccessfully,
  GetBindBillDetails,
  data,
  preSelectedItems,
}) => {
  const [t] = useTranslation();
  const location = useLocation();
  const pageName = location?.pathname || "";
  const THEADSERVICEDETAILS = [
    t("Date"),
    t("CPT Code"),
    t("SubCategory Name"),
    t("Service Name"),
    t("Billing Category Name"),
    t("Doctor"),
    t("In / Out House"),
    t("Sample Req. Date"),
    t("Sample Req. Time"),
    t("Tax Type"),
    t("TAX (%)"),
    t("Rate"),
    t("Quantity"),
    t("Dis(%)"),
    t("Dis Amt"),
    t("Amount"),
    t("Tax Amount"),
    t("Pat. Payable"),
    t("Remark"),
    { name: t("Surgery"), width: "12%" },
    { name: "U", width: "0%" },
    { name: "R", width: "1%" },
  ];

  const { GetBindSubCatgeoryData, GetGlobalResources } = useSelector(
    (state) => state.CommonSlice,
  );

  // Opt in switch for the "package amount exceeded" prompt. Without an active
  // IsPackageExceedAlertShow row in fin_global_resources the screen keeps its
  // old behaviour and simply refuses the item.
  const isPackageExceedAlertShow =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsPackageExceedAlertShow")
      ?.Value === "1";
  const { VITE_DATE_FORMAT } = import.meta.env;
  const dispatch = useDispatch();
  const [dropDownState, setDropDownState] = useState([]);
  console.log("dropDownState", dropDownState);
  const [value, setValue] = useState("");
  const [items, setItems] = useState([]);
  const [tableData, setTableData] = useState([]);
  // Active membership card discounts (IPD context), keyed by ItemID.
  const [patientMembershipMap, setPatientMembershipMap] = useState(new Map());
  // Card-level info (name + validity) for the membership banner; null when the
  // patient has no applicable card for the IPD context.
  const [membershipCardInfo, setMembershipCardInfo] = useState(null);
  const dischargeDate=()=>{
    if(data.status==="IN"){
      return new Date();
    }else if(data.status==="OUT"){
      return new Date(data.dischargeDate);
    }else{
      new Date();
    }
//  new Date(data.dischargeDate?data.dischargeDate: new Date())||  new Date(),
  }
  const [formData, setFormData] = useState({
    Category: { lable: "All", value: "0" },
    SubCategory: { lable: "All", value: "0" },
    Quantity: "",
    fromDate:dischargeDate(),
    toDate: new Date(data.status==="IN"?new Date():new Date(data.dischargeDate))|| new Date(),
    Remarks: "",
    doctorID: {},
    discount: "",
    amount: "",
    packageID: "0",
  });
  /* const [formData, setFormData] = useState({
    Category: { lable: "All", value: "0" },
    SubCategory: { lable: "All", value: "0" },
    Quantity: "",
    fromDate: data?.admitDate
      ? moment(data.admitDate, "DD-MMM-YYYY h:mm A")
        .startOf("day")
        .toDate()
      : new Date(),
    toDate: new Date(),
    Remarks: "",
    doctorID: {},
    discount: "",
    amount: "",
    packageID: "0"
  });
 */
  console.log("Admit Date:", data?.admitDate);

  const [packageID, setPackageID] = useState({
    label: "No Package",
    value: "0",
  });
  console.log("packageIDpackageID", packageID);
  const [dropDownData, setDropDownData] = useState({
    category: [],
    subcategory: [],
  });

  const [subPackageDetails, setSubPackageDetails] = useState([]);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Asks before letting an item take the bill past the package amount.
  // `onConfirm` holds the add that runs if the user answers Yes.
  const [exceedPackageConfirm, setExceedPackageConfirm] = useState({
    show: false,
    itemName: "",
    rate: 0,
    available: 0,
    onConfirm: null,
  });

  /* Same as OPD booking: when this patient already got the same service in the last
     24 hours (OPDServiceBooking/getAlreadyPrescribeItem), ask before adding it again. */
  const [alreadyPrescribed, setAlreadyPrescribed] = useState({
    show: false,
    userName: "",
    entryDate: "",
    resolve: null,
  });

  const confirmIfAlreadyPrescribed = async (patientID, itemID) => {
    try {
      const res = await getAlreadyPrescribeItem(patientID, itemID);
      const row = res?.success ? res?.data : null;
      if (!row || !row?.EntryDate) return true;
      return await new Promise((resolve) =>
        setAlreadyPrescribed({
          show: true,
          userName: row?.UserName || "",
          entryDate: row?.EntryDate || "",
          resolve,
        }),
      );
    } catch (error) {
      return true; // the check must not stop billing
    }
  };

  const closeAlreadyPrescribed = (proceed) => {
    const resolve = alreadyPrescribed.resolve;
    setAlreadyPrescribed({ show: false, userName: "", entryDate: "", resolve: null });
    resolve?.(proceed);
  };

  const askExceedPackage = (item, available, onConfirm) => {
    // Switched off: behave exactly as before and refuse the item.
    if (!isPackageExceedAlertShow) {
      notify("Item Can't be added", "error");
      return;
    }

    setExceedPackageConfirm({
      show: true,
      itemName: item?.TypeName || item?.ItemName || "this item",
      rate: Number(item?.Rate) || 0,
      available: Number(available) || 0,
      onConfirm,
    });
  };

  const closeExceedPackage = () =>
    setExceedPackageConfirm({
      show: false,
      itemName: "",
      rate: 0,
      available: 0,
      onConfirm: null,
    });

  // Load the patient's active membership-card discounts for the IPD context
  // (most-specific item/subcategory/category match), keyed by ItemID. Applied to
  // each service row's Dis(%) when an item is added.
  useEffect(() => {
    const patID = pateintDetails?.PatientID || pateintDetails?.patientID;
    if (!patID) {
      setPatientMembershipMap(new Map());
      setMembershipCardInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // The card can hold a panel specific rate, so the patient panel decides
        // which mapping applies.
        const res = await GetPatientMembershipDetails(
          patID,
          "IPD",
          pateintDetails?.PanelID || "",
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
  }, [
    pateintDetails?.PatientID,
    pateintDetails?.patientID,
    pateintDetails?.PanelID,
  ]);

  /* Billing Category Name — the patient's current billing category (what Tariff
     Change last set it to, which can differ from the physical room type), shown
     read-only on each added line for reference. Not sent back on save, just display.
     DoctorShift/BindRoomDetails already resolves the name server-side (same call
     RoomShiftingRequest.jsx uses for its own "Billing Category" line) — the "IN" row
     is the patient's current/active one. */
  const [billingCategoryName, setBillingCategoryName] = useState("");
  useEffect(() => {
    const transactionId = pateintDetails?.TransactionID;
    if (!transactionId) {
      setBillingCategoryName("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await BindRoomDetails(transactionId);
        if (cancelled) return;
        const rows = res?.success ? res?.data || [] : [];
        const activeRoom = rows.find((r) => r?.Status === "IN") || rows[0];
        setBillingCategoryName(activeRoom?.BillingCategory || "");
      } catch (error) {
        if (!cancelled) setBillingCategoryName("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pateintDetails?.TransactionID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const renderApiCall = async () => {
    try {
      const [Category] = await Promise.all([
        BindCategory(12),
        subCategoryBind(12, "0"),
      ]);

      setDropDownData({
        ...dropDownData,
        ["category"]: [
          { label: t("All"), value: "0" },
          ...handleReactSelectDropDownOptions(
            Category?.data,
            "name",
            "categoryID",
          ),
        ],
      });
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const subCategoryBind = async (Type, CategoryID) => {
    try {
      await dispatch(GetBindSubCatgeory({ Type, CategoryID }));
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleReactSelect = async (name, e) => {
    if (name === "Category" && e) {
      await subCategoryBind("12", e.value);
    }
    setFormData({ ...formData, [name]: e || null });
  };

  const handleBindItem = async (requestbody) => {
    try {
      const response = await BindItem(requestbody);
      if (response?.success) {
        return response?.data;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const search = async (event) => {
     if (event?.query?.length < 3) {
        return;
      }
    try {
      const item = await handleBindItem({
        scheduleChargeID: Number(pateintDetails?.ScheduleChargeID),
        panelID: Number(pateintDetails?.PanelID),
        ipdCaseTypeID: Number(pateintDetails?.IPDCaseTypeID),
          // the API rates the items on this admission's billing room type (IPDCaseTypeID_Bill)
          transactionID: String(pateintDetails?.TransactionID ?? ""),
        itemName: event?.query.trim(),
        categoryID: Number(formData?.Category?.value),
        subcategory: Number(formData?.SubCategory?.value),
        requestType: String(""),
        IsInternational: pateintDetails?.IsInternational ? pateintDetails?.IsInternational : "",
        LedgerNumber:"0"
      });
      setItems(item);
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const itemTemplate = (item) => {
    return (
      <div
        className="p-clearfix"
        // onClick={() => validateInvestigation(item, 0, 0, 1, 0)}
      >
        <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
          {item?.TypeName}
        </div>
      </div>
    );
  };

  const handlePatientBillingGetDiscount = async (payload) => {
    try {
      const response = await PatientBillingGetDiscount(payload);
      return response;
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleAddCountDateIteration = (formDate, toDate) => {
    const diffCount =
      toDate.startOf("day").diff(formDate.startOf("day"), "days") + 1;
    return diffCount;
  };

  const handleBillingGetRateFromFollowedPanel = async (
    ItemID,
    PanelID,
    IPDCaseTypeID,
    IsInternational,
  ) => {
    try {
      const response = await BillingGetRateFromFollowedPanel(
        ItemID,
        PanelID,
        IPDCaseTypeID,
        IsInternational,
      );
      return response;
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };
  console.log(remainingAmount, "remainingAmount");

  const handleAddItem = async (e) => {
    // debugger
    let { value } = e;
    let itemID = value?.ItemID || value?.itemID;
    let itemName = value?.TypeName || value?.itemName || value?.ItemName;

    try {
      // If the item data is incomplete (e.g., from indent), fetch full details
      if (!value?.CategoryID || !value?.ConfigID) {
        const itemDetails = await handleBindItem({
          scheduleChargeID: Number(pateintDetails?.ScheduleChargeID),
          panelID: Number(pateintDetails?.PanelID),
          ipdCaseTypeID: Number(pateintDetails?.IPDCaseTypeID),
          // the API rates the items on this admission's billing room type (IPDCaseTypeID_Bill)
          transactionID: String(pateintDetails?.TransactionID ?? ""),
          itemName: itemName,
          categoryID: 0,
          subcategory: 0,
          requestType: String(""),
          IsInternational: pateintDetails?.IsInternational || "",
        });

        const matchedItem = itemDetails?.find(
          (i) => String(i.ItemID) === String(itemID),
        );
        if (matchedItem) {
          value = { ...matchedItem, ...value };
          itemID = matchedItem.ItemID;
        }
      }

      const patientIDForCheck = pateintDetails?.PatientID || pateintDetails?.patientID;
      if (patientIDForCheck && itemID) {
        const proceed = await confirmIfAlreadyPrescribed(patientIDForCheck, itemID);
        if (!proceed) {
          setValue("");
          return;
        }
      }

      const getDiscount = await handlePatientBillingGetDiscount({
        panelID: String(pateintDetails?.PanelID),
        itemID: String(itemID),
        patientTypeID: String(pateintDetails?.PatientTypeID),
        membershipNo: String(pateintDetails?.MemberShipCardNo),
      });
      //
      const GetRateFromFollowedPanel =
        await handleBillingGetRateFromFollowedPanel(
          itemID,
          pateintDetails?.PanelID,
          pateintDetails?.IPDCaseTypeID,
          pateintDetails?.IsInternational,
        );
      const loopCount = handleAddCountDateIteration(
        moment(formData?.fromDate),
        moment(formData?.toDate),
      );
      // The item's mapped In / Out House is the line's default; an unmapped item leaves it blank
      // for the biller to pick in the grid.
      const itemHouse = (await GetItemHouse(itemID))?.data || {};
      const addTableData = [];
      for (let i = 0; i < loopCount; i++) {
        const currentDate = moment(formData?.fromDate);
        const newDate = currentDate.add(i, "days").format("DD-MMM-YYYY");

        const reponseData = getDiscount?.data?.[0] || {};
        const rateData = GetRateFromFollowedPanel?.data?.[0] || {};

        const addObj = {
          ...value,
          ...reponseData,
          ...rateData,

          ipdPanelDiscPercent: Number(
            reponseData?.ipdPanelDiscPercent || 0,
          ).toFixed(ROUNDOFF_VALUE),

          Date: newDate,

          ...pateintDetails,
        };

        // Display-only, not part of pateintDetails (IPDAdvance/BindPatientDetails does
        // not return it) — captured once per screen-open above and stamped onto each
        // line as it's added, same as any other line field.
        addObj.BillingCategoryName = billingCategoryName;

        // Billing/GetRateFromFollowedPanel returns the rate itself as `data` (a number), not
        // a row list, so data?.[0]?.Rate was always undefined and its rate never applied.
        const followedPanelRate =
          typeof GetRateFromFollowedPanel?.data === "number"
            ? GetRateFromFollowedPanel.data
            : Number(rateData?.Rate || 0);
        addObj.Rate = Number(followedPanelRate || value?.Rate || 0);
        addObj.quantity = Number(value?.quantity || 1);
        addObj.SaleTaxPercentage = Number(
          reponseData?.SaleTaxPercentage ||
            rateData?.SaleTaxPercentage ||
            value?.SaleTaxPercentage ||
            0,
        );

        // Active membership card (IPD context) overrides the panel discount when
        // it maps this item.
        const memberRow = patientMembershipMap?.get(Number(itemID));
        if (memberRow?.DiscPer) {
          addObj.ipdPanelDiscPercent = Number(memberRow.DiscPer).toFixed(
            ROUNDOFF_VALUE,
          );
          addObj.IsMembershipCard = 1;
        }

        addObj.discountAmount =
          Number(addObj.Rate) *
          Number(addObj.quantity) *
          Number(addObj?.ipdPanelDiscPercent || 0) *
          0.01;

        addObj.amount =
          Number(addObj.Rate) * Number(addObj.quantity) - addObj.discountAmount;

        addObj.PatientPayable =
          Number(addObj.isPayble) === 1
            ? addObj.amount
            : Number(addObj.amount) *
              Number(addObj?.ipdCoPayPercent).toFixed(ROUNDOFF_VALUE) *
              0.01;

        addObj.HouseID = Number(itemHouse?.HouseID || 0);
        addObj.HouseName = itemHouse?.HouseName || "";
        addObj.sampleReqDate = new Date();
        addObj.sampleReqTime = new Date();
        addObj.remark = value?.remark || "";
        addObj.isUrgent = value?.isUrgent || false;
        addObj.Payable = false;
        addObj.isRateZero = false;
        // addObj.isRateEditable = addObj?.Rate == 0 ? true : false;
        addObj.isRateEditable =
          Authorization?.IsRate === 1
            ? true
            : addObj?.Rate === 0
              ? true
              : false;
        // console.log("Authorization?.IsRate ", Authorization?.IsRate, addObj.Rate)
        addTableData.push(addObj);
      }

      if (packageID?.value === "0") {
        setTableData((prev) => [...prev, ...addTableData]);
        setValue("");
      } else {
        const index = subPackageDetails?.findIndex(
          (val) => val?.CategoryID === value?.CategoryID,
        );

        if (index !== -1) {
          const data = JSON.parse(JSON.stringify(subPackageDetails));
          const categoryLeft = Number(data[index]["NewAmount"]) || 0;

          // Adding within what the package still covers for this category.
          const addWithinCategory = () => {
            data[index]["NewAmount"] = categoryLeft - value?.Rate;
            setSubPackageDetails(data);
            setTableData((prev) => [...prev, ...addTableData]);
            setValue("");
          };

          if (categoryLeft >= value?.Rate) {
            addWithinCategory();
          } else {
            // Rate is over what the package covers - let the user decide instead
            // of blocking. Confirming adds it and takes the category negative,
            // which is what carries the excess onto the bill.
            askExceedPackage(value, categoryLeft, addWithinCategory);
          }
        } else {
          const addAgainstRemaining = () => {
            setTableData((prev) => [...prev, ...addTableData]);
            setValue("");
            setRemainingAmount((prev) => prev - value?.Rate);
          };

          if (remainingAmount >= value?.Rate) {
            addAgainstRemaining();
          } else {
            askExceedPackage(value, remainingAmount, addAgainstRemaining);
          }
        }
      }
      console.log(
        "[...tableData, ...addTableData]",
        [...addTableData],
        pateintDetails,
      );
      //  setTableData([...tableData, ...addTableData]);
      //           setValue("");
    } catch (error) {
      console.log(error, "SomThing Went Wrong");
    }
  };
  const handlePatientBillingGetPackage = async (TransactionID) => {
    try {
      const response = await PatientBillingGetPackage(TransactionID);
      console.log("packageID response", response);
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

  const getPackageDetail = async () => {
    try {
      let payload = {
        TransactionId: pateintDetails?.TransactionID,
        PackageItemID: packageID?.value,
        LedgerTnxRefID: packageID?.LedgerTnxRefID,
      };

      let response = await PatientBillingGetPackageDetail(payload);
      let netAmount = 0;
      if (response?.success) {
        setSubPackageDetails(response?.data);
        netAmount =
          response?.data?.reduce((acc, current) => {
            return (acc += current["NewAmount"]);
          }, 0) || 0;
      } else {
        setSubPackageDetails([]);
      }
      setRemainingAmount(packageID?.HospitalAmt - netAmount);
    } catch (error) {
      setSubPackageDetails([]);
      console.log(error, "Something Went Wrong");
    }
  };

  useEffect(() => {
    if (packageID && packageID?.value !== "0") {
      getPackageDetail();
    } else {
      setSubPackageDetails([]);
      setRemainingAmount(0);
    }
  }, [packageID]);

  useEffect(() => {
    renderApiCall();
    handlePatientBillingGetPackage(pateintDetails?.TransactionID);
  }, []);

  useEffect(() => {
    if (preSelectedItems?.length > 0) {
      preSelectedItems.forEach((item) => {
        handleAddItem({ value: item });
      });
    }
  }, [preSelectedItems]);

  return (
    <>
      {membershipCardInfo && (
        <div className="row px-2 pt-2">
          <MembershipCardBanner cardInfo={membershipCardInfo} />
        </div>
      )}
      <div className="row py-2">
        <ReactSelect
          placeholderName={t("Category")}
          id={"Category"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name={"Category"}
          dynamicOptions={dropDownData?.category}
          value={formData?.Category?.value}
          handleChange={handleReactSelect}
        />
        <ReactSelect
          placeholderName={t("Sub Category")}
          id={"SubCategory"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name={"SubCategory"}
          dynamicOptions={[
            { label: t("All"), value: "0" },
            ...GetBindSubCatgeoryData.map((item) => {
              return {
                label: item?.name,
                value: item?.subCategoryID,
              };
            }),
          ]}
          value={formData?.SubCategory?.value}
          handleChange={handleReactSelect}
        />
        <ReactSelect
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          placeholderName={"package"}
          name={"packageID"}
          id={"packageID"}
          dynamicOptions={dropDownState}
          value={packageID?.value}
          // value={formData.packageID}
          removeIsClearable={true}
          //  handleChange={handleChange}
          handleChange={(_, e) => setPackageID(e)}
          // handleChange={(_, e) => setPackageID(e?.value)}
        />
        {packageID?.value !== "0" && (
          <>
            <Input
              type="text"
              className="form-control"
              id="amountPaid"
              name="amountPaid"
              // onChange={handleChange}
              value={packageID?.Amount}
              lable={t("Amount Paid")}
              disabled={true}
              placeholder=" "
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              onKeyDown={Tabfunctionality}
            />
            <Input
              type="text"
              className="form-control"
              id="UtilizeHospitalAmt"
              name="UtilizeHospitalAmt"
              // onChange={handleChange}
              value={packageID?.UtilizeHospitalAmt}
              lable={t("Utilize Hospital AMT")}
              disabled={true}
              placeholder=" "
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              onKeyDown={Tabfunctionality}
            />

            <Input
              type="text"
              className="form-control"
              id="receiptNo"
              name="receiptNo"
              // onChange={handleChange}
              value={packageID?.HospitalAmt}
              lable={t("Balance Amt")}
              disabled={true}
              placeholder=" "
              respclass="col-xl-2 col-md-3 col-sm-4 col-12 "
              onKeyDown={Tabfunctionality}
            />
          </>
        )}

        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id="fromDate"
          name="fromDate"
          value={formData?.fromDate}
          handleChange={handleChange}
          lable={t("FromDate")}
          minDate={new Date(data.admitDate)}
          maxDate={formData?.toDate}
          placeholder={VITE_DATE_FORMAT}
        />

        {/* </div>
          <div className="row py-2"> */}
        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id="toDate"
          name="toDate"
          value={formData?.toDate}
          handleChange={handleChange}
          lable={t("ToDate")}
          minDate={formData?.fromDate}
          
          maxDate={new Date(data.status==="IN"? new Date():data.dischargeDate)||  new Date()}
          placeholder={VITE_DATE_FORMAT}
        />
        <div
          className="col-xl-4 col-md-4 col-sm-6 col-12"
          style={{ position: "relative" }}
        >
          <AutoComplete
            value={value}
            suggestions={items}
            completeMethod={search}
            // ref={ref}
            className="w-100"
            onSelect={(e) => handleAddItem(e)}
            id="searchtest"
            onChange={(e) => {
              const data =
                typeof e.value === "object" ? e?.value?.TypeName : e.value;
              setValue(data);
            }}
            itemTemplate={itemTemplate}
          />
          <label htmlFor={"searchtest"} className="lable searchtest">
            {t("Search Test")}
          </label>
        </div>
      </div>
      {subPackageDetails?.length > 0 && (
        <div className="card mt-2">
          <Heading title={t("Package Details")} isBreadcrumb={false} />
          {/* {console.log("selectedPackages", selectedPackages)} */}
          <Tables
            thead={[
              { name: t("SNo"), width: "1%" },
              t("Category"),
              t("Sub-Category"),
              t("ItemName"),
              t("Total Amount"),
              t("UtilizedAmt"),
              t("Balance"),
            ]}
            tbody={subPackageDetails.map((item, i) => ({
              SNo: i + 1,
              category: item?.CategoryName || "",
              SubCategory: item?.SubCategoryName || "",
              ItemName: item?.ItemName,

              Amount: item?.Amount || "0.00",
              UtilizedAmt: item?.UtilizedAmt || "0.00",
              NewAmount: item?.NewAmount || "0.00",
            }))}
          />
        </div>
      )}
      <div className="mt-2">
        {console.log(tableData, "tableDatatableData")}
        <Heading title={t("Item Details")} isBreadcrumb={false} />
        <AddItemTable
          THEAD={THEADSERVICEDETAILS}
          tbody={tableData}
          setTableData={setTableData}
          pateintDetails={pateintDetails}
          Authorization={Authorization}
          handleSaveAddItemSuccessfully={handleSaveAddItemSuccessfully}
          GetBindBillDetails={GetBindBillDetails}
          packageID={packageID}
          pageName={pageName}
          data={data}
        // AddItemDetails={AddItemDetails}
        // style={{ marginTop: "10px" }}
        />
      </div>

      {/* Service already given to this patient in the last 24 hours - as on OPD booking. */}
      <Confirm
        confirmBoxvisible={alreadyPrescribed}
        lableMessage={t("Do You Want To Prescribe Again ?")}
        alertMessage={
          <div>
            {t("This Service is Already Prescribed By")}{" "}
            <span style={{ color: "blue", fontWeight: 700 }}>
              {alreadyPrescribed.userName}{" "}
            </span>
            {t("Date on")}{" "}
            <span style={{ color: "blue", fontWeight: 700 }}>
              {alreadyPrescribed.entryDate}
            </span>
          </div>
        }
      >
        <div>
          <button
            type="button"
            className="btn btn-sm btn-primary mx-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeAlreadyPrescribed(true);
            }}
          >
            {t("Prescribe Again")}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger mx-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeAlreadyPrescribed(false);
            }}
          >
            {t("Cancel")}
          </button>
        </div>
      </Confirm>

      {/* Package amount exceeded - ask instead of blocking the item outright. */}
      <Confirm
        confirmBoxvisible={exceedPackageConfirm}
        lableMessage={t("Package Amount Exceeded")}
        alertMessage={`${exceedPackageConfirm.itemName} ${t("costs")} ${Number(
          exceedPackageConfirm.rate,
        ).toFixed(2)} ${t("but only")} ${Number(
          exceedPackageConfirm.available,
        ).toFixed(2)} ${t("is left in the package")}. ${t(
          "Do you want to continue?",
        )}`}
      >
        <div>
          <button
            type="button"
            className="modalConfirmButton"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const proceed = exceedPackageConfirm.onConfirm;
              closeExceedPackage();
              proceed?.();
            }}
          >
            {t("Yes")}
          </button>
          <button
            type="button"
            className="modalCancelButton"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeExceedPackage();
            }}
          >
            {t("No")}
          </button>
        </div>
      </Confirm>
    </>
  );
};

export default IPDServices;
