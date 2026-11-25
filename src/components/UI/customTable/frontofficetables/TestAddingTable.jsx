import React, { useCallback, useEffect, useState } from "react";
import Tables from "..";
import Modal from "../../../modalComponent/Modal";
import SlotModal from "../../../modalComponent/Utils/SlotModal";
import HtmlSelect from "../../../formComponent/HtmlSelect";
import { useSelector } from "react-redux";
import CustomSelect from "../../../formComponent/CustomSelect";
import Input from "../../../formComponent/Input";
import { ROUNDOFF_VALUE } from "../../../../utils/constant";
import { calculateBillAmount, notify } from "../../../../utils/utils";
import { Tooltip } from "primereact/tooltip";
import PackageDetails from "../../../modalComponent/Utils/PackageDetails";
import InvestigationModal from "../../../modalComponent/Utils/InvestigationModal";
import { GetDoctorAppointmentTimeSlotConsecutive } from "../../../../networkServices/opdserviceAPI";
import { debounce } from "../../../../networkServices/axiosInstance";
import { BindHouseList, GetItemHouse } from "../../../../networkServices/BillingsApi";
import WrapTranslate from "../../../WrapTranslate";
import { useTranslation } from "react-i18next";

function TestAddingTable(props) {
  const [t] = useTranslation();
  const {
    THEAD,
    bodyData,
    setBodyData,
    handlePaymentGateWay,
    paymentControlModeState,
    payloadData,
    singlePatientData,
    discounts,
    UHID,
    patientMembershipMap,
    selectedPanel,
    /* Day Care session booking off a package row. Optional: callers that do
       not pass it get exactly the table they had before, which is every
       caller except OPD Service Booking with the flag on. */
    onBookDayCare,
    // OPD Booking only: adds the "House Type" column (In / Out House) after U. Other screens that
    // share this grid pass nothing and are unchanged.
    showHouse = false,
  } = props;

  // In / Out House names (one list) for the row dropdown
  const [houseList, setHouseList] = useState([]);
  useEffect(() => {
    if (!showHouse) return;
    (async () => {
      const resp = await BindHouseList();
      setHouseList(
        resp?.success
          ? (resp?.data || []).map((h) => ({ label: h?.name, value: h?.id }))
          : [],
      );
    })();
  }, [showHouse]);

  // A newly added item takes its mapped In / Out House as the row default (blank when unmapped,
  // the biller then picks). HouseLoaded marks a row already looked up so this runs once per row.
  useEffect(() => {
    if (!showHouse) return;
    const pending = (bodyData || []).filter((r) => r && !r.HouseLoaded && r.itemID);
    if (!pending.length) return;
    (async () => {
      const ids = [...new Set(pending.map((r) => String(r.itemID)))];
      const found = {};
      await Promise.all(
        ids.map(async (id) => {
          found[id] = (await GetItemHouse(id))?.data || {};
        }),
      );
      setBodyData((prev) =>
        prev.map((r) =>
          r && !r.HouseLoaded && r.itemID
            ? {
                ...r,
                HouseID: Number(found[String(r.itemID)]?.HouseID || 0),
                HouseName: found[String(r.itemID)]?.HouseName || "",
                HouseLoaded: true,
              }
            : r,
        ),
      );
    })();
  }, [showHouse, bodyData?.length]);

  const [modalData, setModalData] = useState({
    show: false,
    component: null,
    size: null,
    header: null,
  });

  const { BindResource, GetAllDoctorList, GetGlobalResources } = useSelector(
    (state) => state?.CommonSlice,
  );

  /* fin_global_resources -> OPDDoctorSelectCategoryIDs: CategoryID(s), comma separated (e.g. 6 = PROCEDURE
     CHARGES). When set, the Doctor dropdown in this grid shows only on items of those categories; the other
     rows keep the doctor chosen at the top as before. Empty / missing key = dropdown on every item (old way). */
  const doctorSelectCategoryIDs = (
    (Array.isArray(GetGlobalResources) ? GetGlobalResources : GetGlobalResources?.data || [])
      ?.find((item) => item?.Name === "OPDDoctorSelectCategoryIDs")?.Value ?? ""
  )
    .toString()
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "" && value !== "0");
  // const handleCustomSelect = (index, name, e) => {
  //   let data = [...bodyData];

  //   // Update selected field value
  //   data[index][name] = e.value;

  //   // Add or update DoctorID for the specific row
  //   data[index].DoctorID = payloadData?.DoctorID;

  //   // Set the updated bodyData
  //   setBodyData(data);

  // useEffect(()=>{
  //   handleCustomSelect()
  // },[payloadData?.DoctorID])

  const handleCustomSelect = (index, name, e) => {
    let data = [...bodyData];
    data[index][name] = e.value;
    data[index]["DoctorName"] = e.label;
    setBodyData(data);
  };
  useEffect(() => {
    let updatedData = [...bodyData];
    //
    updatedData = updatedData.map((item) => ({
      ...item,
      DoctorID: payloadData?.DoctorID, // Add DoctorID to every row
      DoctorName: payloadData?.DoctorName,
    }));

    // Set updated data
    setBodyData(updatedData);
  }, [payloadData?.DoctorID]);
  useEffect(() => {
    if (!patientMembershipMap || patientMembershipMap.size === 0) return;

    setBodyData((prev) =>
      prev.map((item) => {
        const match = patientMembershipMap.get(Number(item?.itemID));
        if (!match?.DiscPer) return item;

        const modifiedData = {
          ...item,
          discountPercentage: Number(match.DiscPer),
        };

        return handleCalculation(modifiedData, "discountPercentage");
      }),
    );
  }, [patientMembershipMap]);


  const handleDeleteRow = (index) => {
    // ;
    // if(BindResource?.RegistrationChargeApplicable==="1" && singlePatientData?.Registration===0){
    //   notify("Cannot delete:registration for new patient.", "warn");
    //   return
    // }
    let data = [...bodyData];
    data.splice(index, 1);
    const amount = calculateBillAmount(
      data,
      BindResource?.isReceipt,
      singlePatientData?.OPDAdvanceAmount,
      false,
      0,
      0.0,
      ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
      // payloadData?.panelID?.value === 1 ? 1 : 0,
      0,
    );
    //
    handlePaymentGateWay(amount);
    setBodyData(data);
  };

  const handleCalculation = useCallback((modifiedData, name, value) => {
    const rate = parseFloat(modifiedData?.Rate) || 0;
    const qty = parseFloat(modifiedData?.defaultQty) || 1;
    const coPayPct = parseFloat(modifiedData?.coPaymentPercent) || 0;
    const gstPer = parseFloat(modifiedData?.GstPer) || 0;

    modifiedData.grossAmount = rate * qty;
// debugger
    if (name === "discountPercentage") {
      modifiedData.discountPercentageWithoutRoundoff = value>100?100:value;
    } else if(name==="Rate"){
    modifiedData.discountPercentageWithoutRoundoff = modifiedData?.discountPercentage
    }else {
      modifiedData.discountPercentageWithoutRoundoff =
        modifiedData.grossAmount > 0
          ? parseFloat(
              (parseFloat(modifiedData.discountAmount || 0) * 100) /
                modifiedData.grossAmount,
            )
          : 0;
          // debugger
    }
    if (name !== "discountAmount") {
      modifiedData.discountAmount = parseFloat(
        (
          rate *
          qty *
          (parseFloat(modifiedData?.discountPercentage) || 0) *
          0.01
        ).toFixed(ROUNDOFF_VALUE),
      );
    }

    if (name !== "discountPercentage") {
      modifiedData.discountPercentage =
        modifiedData.grossAmount > 0
          ? parseFloat(
            (
              (parseFloat(modifiedData.discountAmount || 0) * 100) /
              modifiedData.grossAmount
            ).toFixed(ROUNDOFF_VALUE),
          )
          : 0;
    }

    modifiedData.amount = parseFloat(
      (rate * qty - (parseFloat(modifiedData?.discountAmount) || 0)).toFixed(
        ROUNDOFF_VALUE,
      ),
    );

    modifiedData.coPaymentAmount = parseFloat(
      (modifiedData.amount * coPayPct * 0.01).toFixed(ROUNDOFF_VALUE),
    );

    modifiedData.GSTAmount = parseFloat(
      (modifiedData.amount * gstPer * 0.01).toFixed(ROUNDOFF_VALUE),
    );

    const isPayable = modifiedData?.IsPayable === "1" ? "1" : "0";

    modifiedData.PayableAmount =
      isPayable === "1" ? modifiedData.amount : modifiedData.coPaymentAmount;
    return modifiedData;
  }, []);

  const debouncedHandlePaymentGateWay = useCallback(
    debounce((data, BindResource, singlePatientData, payloadData,selectedPanel) => {
      console.log("aaaaaaaaaa111",data)
      
      const amount = calculateBillAmount(
        data,
        BindResource?.isReceipt,
        singlePatientData?.OPDAdvanceAmount,
        false,
        0,
        // 1,
        0.0,
        ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
        // payloadData?.panelID?.value === 1 ? 1 : 0,
        0,
      );
      console.log("aaaaaaaaaa",amount)
      handlePaymentGateWay(amount);
    }, 1000),
    [bodyData],
  );

  // const handleInputChange = (e, index) => {
  //   const { name, value } = e.target;
  //   let data = [...bodyData];
  //   let modifiedData = data[index];
  //   if (name === "discountPercentage") {
  //     modifiedData[name] =
  //       value > discounts?.Eligible_DiscountPercent
  //         ? discounts?.Eligible_DiscountPercent
  //         : value;
  //   } else {
  //     modifiedData[name] = value;
  //   }
  //   const resultData = handleCalculation(modifiedData, name);
  //   data[index] = resultData;
  //   setBodyData(data);
  //   debouncedHandlePaymentGateWay(
  //     data.filter((ele) => Number(ele["typeOfApp"]) === 2),
  //     BindResource,
  //     singlePatientData,
  //     payloadData
  //   );
  // };

  const handleInputChange = useCallback(
    (e, index) => {
      const { name, value, checked, type } = e.target;

      // ✅ Early return for checkbox — no calculation needed
      if (name === "isUrgent") {
        const data = [...bodyData];
        const modifiedData = { ...data[index] };
        modifiedData[name] = type === "checkbox" ? checked : value;
        data[index] = modifiedData;
        setBodyData(data);
        return;
      }

      let newValue = value;

      if (name === "defaultQty") newValue = parseFloat(value) || 1;
      if (name === "Rate") newValue = parseFloat(value) || 0;
      if (name === "discountPercentage") newValue = parseFloat(value) || 0;

      const data = [...bodyData];
      const modifiedData = { ...data[index] }; // ✅ shallow copy row, don't mutate
      if (name === "discountPercentage") {
        modifiedData[name] =
          newValue > discounts?.Eligible_DiscountPercent
            ? discounts?.Eligible_DiscountPercent
            : newValue;
      } else if (name === "discountAmount") {
        // Clamp discountAmount so it can't exceed Rate * Qty
        const rate = parseFloat(modifiedData?.Rate) || 0;
        const qty = parseFloat(modifiedData?.defaultQty) || 1;
        const maxAllowed = parseFloat(rate * qty);
        const parsed = parseFloat(newValue) || 0;
        if (parsed > maxAllowed) {
          modifiedData[name] = maxAllowed;
        } else {
          modifiedData[name] = parsed;
        }
      } else {
        modifiedData[name] = newValue;
      }

      data[index] = handleCalculation(modifiedData, name, newValue);
      setBodyData(data);

      // ✅ Debounced payment gateway called OUTSIDE of setBodyData to prevent React warning/blocking
      debouncedHandlePaymentGateWay(
        data.filter((ele) => Number(ele["typeOfApp"]) === 2),
        BindResource,
        singlePatientData,
        payloadData,
        selectedPanel
      );
    },
    [
      bodyData,
      discounts,
      BindResource,
      singlePatientData,
      payloadData,
      handleCalculation,
      selectedPanel,
      setBodyData,
      debouncedHandlePaymentGateWay
    ],
  );

  const handleWalkInData = async (modifiedData) => {
    try {
      const apiResponse = await GetDoctorAppointmentTimeSlotConsecutive(
        modifiedData?.Type_ID,
        modifiedData?.AppointedDate,
        modifiedData?.SubCategoryID,
      );
      if (apiResponse?.success) {
        const AppointedDateTime = apiResponse.data.find(
          (ele) => ele?.IsDefault === 1,
        );

        // As above: no IsDefault row means nothing is left to walk in to today.
        if (!AppointedDateTime) {
          notify(
            "No slot is available for this visit. Please choose another appointment date or visit type.",
            "warn",
          );
        }

        const AppointedData = AppointedDateTime
          ? `${AppointedDateTime?.SlotDateDisplay}#${AppointedDateTime?.FromTimeDisplay}-${AppointedDateTime?.ToTimeDisplay}`
          : "";

        return AppointedData;
      } else {
        notify(apiResponse?.message, "error");
        return "";
      }
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handletypeOfApp = async (e, index) => {
    const { name, value } = e.target;

    //     const isDifferentTypeExists = bodyData.some(
    //   (row, i) => i !== index && row.typeOfApp && row.typeOfApp !== value
    // );

    // if (isDifferentTypeExists) {
    //   notify(
    //     "All items must have the same appointment type. Slot can be added only once.",
    //     "warn"
    //   );
    //   return;
    // }

    let data = [...bodyData];
    let modifiedData = data[index];
    modifiedData[name] = value;

    if (value !== "2") {
      handleSlotModal(index);
    } else {
      const appointmentData = await handleWalkInData(modifiedData);
      modifiedData.AppointedDateTime = appointmentData;
    }
    data[index] = modifiedData;
    debouncedHandlePaymentGateWay(
      data.filter((ele) => Number(ele["typeOfApp"]) === 2),
      BindResource,
      singlePatientData,
      payloadData,
      selectedPanel
    );
    setBodyData(data);
  };
  // const handletypeOfApp = async (e, index) => {

  //   const { name, value } = e.target;
  //   let data = [...bodyData];
  //   let modifiedData = data[index];
  //   modifiedData[name] = value;

  //   if (value !== "2") {
  //     handleSlotModal(index);
  //   } else {
  //     const appointmentData = await handleWalkInData(modifiedData);
  //     modifiedData.AppointedDateTime = appointmentData;
  //   }
  //   data[index] = modifiedData;
  //   debouncedHandlePaymentGateWay(
  //      data.filter((ele) => Number(ele["typeOfApp"]) === 2),
  //     BindResource,
  //     singlePatientData,
  //     payloadData
  //   );
  //   setBodyData(data);
  // };

  const handleSlotModal = (index) => {
    setModalData({
      show: true,
      component: (
        <div>
          <SlotModal
            data={{ ...bodyData[index], Item: bodyData[index]?.label }}
            handleSetData={(e, slotData) => handleSetData(e, index, slotData)}
          />
        </div>
      ),
      size: "95vw",
      header: "Doctor Slot",
    });
  };

  const handleInvestigationSlot = (index) => {
    setModalData({
      show: true,
      component: (
        <div>
          <InvestigationModal
            data={bodyData[index]}
            handleSetData={(e) => handleSetData(e, index)}
          />
        </div>
      ),
      size: "90vw",
      header: "Investigation Slot",
    });
  };

  const handlePackageData = (modifiedData, index) => {
    const data = [...bodyData];
    data[index] = modifiedData;
    setModalData({
      show: true,
      component: (
        <div>
          <PackageDetails
            data={data[index]}
            handlePackageData={(e) => handlePackageData(e, index)}
          />
        </div>
      ),
      size: "70vw",
      header: "Package Details",
    });
    setBodyData(data);
  };
  // console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn",bodyData)
  const handlePackageDetails = (index) => {
    setModalData({
      show: true,
      component: (
        <div>
          <PackageDetails
            data={bodyData[index]}
            handlePackageData={(e) => handlePackageData(e, index)}
          />
        </div>
      ),
      size: "70vw",
      header: "Package Details",
    });
  };

  const handleSetData = (modifiedData, index, slotData) => {
    const data = [...bodyData];
    data[index] = modifiedData;
    setBodyData(data);
    debugger
    const amount = calculateBillAmount(
      data,
      BindResource?.isReceipt,
      0,
      false,
      4,
      0.0,
    ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
      // payloadData?.panelID?.value === 1 ? 1 : 0,
      0,
    );
    //
    handlePaymentGateWay(amount);
    setModalData({
      show: false,
      component: null,
      header: null,
      size: null,
    });
  };

  const handleSplit = (data, replace, byreplace) => {
    return data ? data?.replace(replace, byreplace) : data;
  };

  const SlotComponent = ({ index, row, isDisable }) => {
    // tnxtypeID===5
    return (
      <>
        <Tooltip
          target={`#appointMent${index}`}
          position="mouse"
          content={handleSplit(row?.AppointedDateTime, "#", " ")}
          event="hover"
          className="ToolTipCustom"
        />
        <i
          className="fa fa-calendar"
          aria-hidden="true"
          id={`appointMent${index}`}
          onClick={() => {
            if (isDisable || row?.SubCategoryID === 6) return;
            handleSlotModal(index);
          }}
        ></i>
      </>
    );
  };

  const InvestigationSlot = ({ index, row, isDisable }) => {
    // categoryID===7
    return (
      <>
        <Tooltip
          target={`#InvestigationSlot${index}`}
          position="mouse"
          content={handleSplit(row?.AppointedDateTime, "#", " ")}
          event="hover"
          className="ToolTipCustom"
        />
        <i
          className="fa fa-calendar"
          aria-hidden="true"
          id={`InvestigationSlot${index}`}
          onClick={() =>
            isDisable ? () => { } : handleInvestigationSlot(index)
          }
        ></i>
      </>
    );
  };
  const truncateText = (text, limit = 20) =>
    text?.length > limit ? text.substring(0, limit) + "..." : text;

  const settleFunction = (row, index) => {
    let tableData = {
      Slot: null,
      type: null,
      ItemCode: null,
      PackageView: null,
      ItemDisplayName: null,
      Token: null,
      Doctor: null,
      GstType: null,
      GstPer: null,
      Rate: null,
      Qty: null,
      DiscountPercentage: null,
      DisAmount: null,
      amount: null,
      GSTAmount: null,
      PayableAmount: null,
      Checkbox: null,
      House: null,
      action: null,
    };

    if (
      row?.CategoryID === "7" &&
      // BindResource?.IsInvestigationAppointment === "1" &&
      row?.isMobileBooking === 1
    ) {
      tableData.Slot = <i className="fa fa-calendar" aria-hidden="true"></i>;
    } else if (
      row?.CategoryID === "7" &&
      // BindResource?.IsInvestigationAppointment === "1" &&
      row?.isMobileBooking === 0
    ) {
      tableData.Slot = (
        <InvestigationSlot index={index} row={row} isDisable={UHID} />
      ); // popup function 1
    } else if (row?.TnxTypeID === "5") {
      tableData.Slot = (
        <SlotComponent index={index} row={row} isDisable={UHID} />
      ); // popup function 2
    }

    // type Condition
    if (row?.TnxTypeID === "5") {
      tableData.type = (
        <HtmlSelect
          option={row?.AppointedType}
          value={row?.typeOfApp}
          name="typeOfApp"
          onChange={(e) => handletypeOfApp(e, index)}
          isDisable={UHID || row?.SubCategoryID === 6}
        /> //handleChange && popup function 1
      );
    }

    // code
    tableData.ItemCode = row?.ItemCode;

    // PackageView

    if (row?.TnxTypeID === "23") {
      tableData.PackageView = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
          <button
            className="btn btn-sm text-white"
            onClick={() => handlePackageDetails(index)}
            disabled={UHID}
          >
            +
          </button>
          {/* Sits on the package itself, so the desk books the sittings where
              the package is rather than from a banner elsewhere on the page. */}
          {onBookDayCare && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ color: "#0d9488", padding: "2px 5px" }}
              title={t("Book Day Care Sessions")}
              onClick={() => onBookDayCare(row)}
            >
              <i className="fas fa-calendar-plus" aria-hidden="true" />
            </button>
          )}
        </span>
      ); //bindpackageItemDetailnew api call
    }

    // ItemName

    tableData.SubCategory = row?.SubCategory;
    tableData.ItemDisplayName = (
      // <span title={row?.ItemDisplayName}>{row?.ItemDisplayName}</span>;
      <span title={row?.ItemDisplayName}>
        {" "}
        {truncateText(row?.ItemDisplayName, 80)}
      </span>
    );
    // tableData.ItemDisplayName = row?.ItemDisplayName;

    // last Token Number;

    tableData.Token = (
      <div style={{ color: "#f9183f", fontWeight: 800, textAlign: "center" }}>
        {row?.Token}
      </div>
    );

    // Doctor
    //

    if (
      row?.TnxTypeID !== "5" &&
      row?.TnxTypeID !== "23" &&
      (doctorSelectCategoryIDs.length === 0 ||
        doctorSelectCategoryIDs.includes(String(row?.CategoryID ?? "").trim()))
    ) {
      tableData.Doctor = (
        <CustomSelect
          option={GetAllDoctorList}
          // value={payloadData?.DoctorID ? payloadData?.DoctorID : row?.DoctorID}
          value={row?.DoctorID !== "0" ? row?.DoctorID : payloadData?.DoctorID}
          placeHolder="Select Doctor"
          name="DoctorID"
          isDisable={UHID}
          onChange={(name, e) => handleCustomSelect(index, name, e)}
        />
      );
    }

    // GstType

    tableData.GstType = <div>{row?.GstType}</div>;

    // GstPer

    tableData.GstPer = (
      <div className="text-right">
        {isNaN(Number(row?.GstPer)) ? 0 : Number(row?.GstPer)}
      </div>
    );

    // Rate

    tableData.Rate = (
      <div style={{width:"70px"}}>
      <Input
        type="number"
        className="table-input"
        name={"Rate"}
        removeFormGroupClass={true}
        display={"right"}
        onChange={(e) => handleInputChange(e, index)}
        // onBlur={(e) => handleInputBlur(e, index)}
        value={row?.Rate}
        // disabled={row?.constantRate > 1 ? row?.rateEditAble : false}
        disabled={row?.rateEditAble === 0 ? true : false}
        style={row?.IsEmergencyRateApplied ? {textAlign:"right", borderColor:"#dc3545", background:"#fff5f5"} : undefined}
      />
      {row?.IsEmergencyRateApplied && (
        <div title="Emergency Rate Applied — Rate increased as per emergency schedule" style={{marginTop:"1px", background:"#dc3545", color:"#fff", borderRadius:"3px", fontSize:"9px", textAlign:"center", padding:"1px 4px", fontWeight:"600", letterSpacing:"0.5px"}}>EMG RATE</div>
      )}
      </div>
    );

    // Qty
    tableData.Qty = (
        <div style={{width:"60px"}}>
      <Input
        type="number"
        className="table-input"
        value={row?.defaultQty}
        removeFormGroupClass={true}
        name={"defaultQty"}
        display={"right"}
        onChange={(e) => handleInputChange(e, index)}
        max={row?.defaultQty}
        disabled={["7", "3"].includes(row?.TnxTypeID) ? true : false}
      />
      </div>
    );

    // DiscountPercentage
    tableData.DiscountPercentage = (
      <Input
        type="number"
        className="table-input"
        name={"discountPercentage"}
        removeFormGroupClass={true}
        value={row?.discountPercentage}
        display={"right"}
        onChange={(e) => handleInputChange(e, index)}
        max={
          patientMembershipMap?.get(Number(row?.itemID))?.DiscPer ?? 100
        }
        disabled={
          [2].includes(Number(row?.typeOfApp)) ? !row?.IsDiscountEnable : true
        }
      />
    );

    // DisAmount

    tableData.DisAmount = (
      <Input
        type="number"
        className="table-input"
        removeFormGroupClass={true}
        display={"right"}
        name="discountAmount"
        value={row?.discountAmount}
        max={Number(row?.Rate || 0) * Number(row?.defaultQty || 1)}
        disabled={
          [2].includes(Number(row?.typeOfApp)) ? !row?.IsDiscountEnable : true
        }
        onChange={(e) => handleInputChange(e, index)}
      />
    );

    // amount

    tableData.amount = (
      <div className="text-right">
        {Number(row?.amount).toFixed(ROUNDOFF_VALUE)}
      </div>
    );

    // GSTAmount

    tableData.GSTAmount = (
      <div className="text-right">
        {" "}
        {(
          ((Number(row?.amount ? row?.amount : 0) * 100) /
            (100 + row?.SaleTaxPercentage)) *
          row?.SaleTaxPercentage *
          0.01
        ).toFixed(ROUNDOFF_VALUE)}
      </div>
    );

    // PayableAmount

    tableData.PayableAmount = (
      <div className="text-right">
        {isNaN(Number(row?.PayableAmount)) ? 0 : Number(row?.PayableAmount)}
      </div>
    );

    // Checkbox
    if (!["5", "23", "20"].includes(row?.TnxTypeID)) {
      tableData.Checkbox = (
        <input
          type="checkbox"
          className="table-checkbox"
          name="isUrgent"
          onChange={(e) => handleInputChange(e, index)}
        />
      );
    }

    // In / Out House: defaults to the item's mapping, blank when unmapped
    if (showHouse) {
      tableData.House = (
        <CustomSelect
          option={houseList}
          value={row?.HouseID ? row?.HouseID : ""}
          placeHolder="Select House Type"
          name="HouseID"
          isDisable={UHID}
          onChange={(name, e) => {
            const data = [...bodyData];
            data[index] = {
              ...data[index],
              HouseID: e?.value ?? 0,
              HouseName: e?.label ?? "",
              HouseLoaded: true,
            };
            setBodyData(data);
          }}
        />
      );
    }

    // action
    tableData.action = (
      <i
        className="fa fa-trash text-danger text-center "
        aria-hidden="true"
        onClick={() => (UHID ? () => { } : handleDeleteRow(index))}
      />
    );

    return tableData;
  };

  useEffect(() => {
    if (payloadData?.couponDiscountPercentage === undefined) return;

    let updatedData = [];
    setBodyData((prev) => {
      const data = prev.map((item) => {
        const modifiedData = {
          ...item,
          discountPercentage: payloadData.couponDiscountPercentage,
        };

        return handleCalculation(modifiedData, "discountPercentage");
      });
      updatedData = data;
      return data;
    });

    debouncedHandlePaymentGateWay(
      updatedData.filter((ele) => Number(ele["typeOfApp"]) === 2),
      BindResource,
      singlePatientData,
      payloadData,
      selectedPanel
    );
  }, [
    payloadData?.couponDiscountPercentage,
    handleCalculation,
    debouncedHandlePaymentGateWay,
    BindResource,
    singlePatientData,
    payloadData,
    selectedPanel,
    setBodyData
  ]);

  console.log("bodyData1", bodyData);
  return (
    <div className="card patient_registration_card my-1">
      <Tables
        thead={WrapTranslate(THEAD)}
        style={{
          maxHeight: "185px",
        }}
        tbody={bodyData?.map((row, index) => {
          // debugger;
          const {
            Slot,
            type,
            ItemCode,
            PackageView,
            ItemDisplayName,
            SubCategory,
            Token,
            Doctor,
            GstType,
            GstPer,
            Rate,
            Qty,
            DisAmount,
            DiscountPercentage,
            amount,
            GSTAmount,
            PayableAmount,
            Checkbox,
            House,
            action,
          } = settleFunction(row, index);

          return {
            Slot: Slot,
            type: type,
            ItemCode: ItemCode,
            PackageView: PackageView,
            SubCategory: SubCategory,
            ItemDisplayName: ItemDisplayName,
            Token: Token,
            Doctor: Doctor,
            GstType: GstType,
            GstPer: GstPer,
            Rate: Rate,
            Qty: Qty,
            DiscountPercentage: DiscountPercentage,
            DisAmount: DisAmount,
            amount: amount,
            GSTAmount: GSTAmount,
            PayableAmount: PayableAmount,
            Checkbox: Checkbox,
            // only keyed in when the screen shows the House Type column, so the other screens keep
            // their column count
            ...(showHouse ? { House: House } : {}),
            action: action,
          };
        })}
        scrollView="scrollView"
      />

      {modalData?.show && (
        <Modal
          visible={modalData?.show}
          setVisible={() =>
            setModalData({
              show: false,
              component: null,
              size: null,
            })
          }
          modalWidth={modalData?.size}
          Header={modalData?.header}
          footer={<></>}
        >
          {modalData?.component}
        </Modal>
      )}
    </div>
  );
}

export default TestAddingTable;