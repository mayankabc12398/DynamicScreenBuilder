import Input from "@app/components/formComponent/Input";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ReactSelect from "../formComponent/ReactSelect";
import PaymentTable from "../UI/customTable/paymentTable";
import Modal from "../modalComponent/Modal";
import {
  BindPaymentModePanelWise,
  GetConversionFactor,
  LoadCurrencyDetail,
  getBankMaster,
  getConvertCurrency,
} from "../../networkServices/PaymentGatewayApi";
import {
  handleReactSelectDropDownOptions,
  inputBoxValidation,
  notify,
  reactSelectOptionList,
} from "../../utils/utils";
import {
  AMOUNT_REGX,
  OBJECT_PAYMENTMODE,
  ROUNDOFF_VALUE,
} from "../../utils/constant";
import store from "../../store/store";
import {
  GetDiscReasonList,
  GetSwipMachine,
} from "../../networkServices/opdserviceAPI";
import { SaveDiscReason } from "../../networkServices/BillingsApi";
import { getECHSDoctorsListApi } from "../../networkServices/directPatientReg";
import index from "../UI/customTable/ExaminationRoom/SearchPatientTable";
import { useLocation } from "react-router-dom";
import LoyaltyRedeemPanel from "./LoyaltyRedeemPanel";

const PaymentGateway = (props) => {
  const {
    loyalty,
    screenType,
    setScreenType,
    button,
    paymentMethod,
    setPaymentMethod,
    discounts,
    pkgDisable,
    singlePatientData,
    patientDetail,
    thermalPrintout,
    onRazorpayClick,
    // Payment mode ids a screen does not want in its dropdown (e.g. Pharmacy Issue hides
    // Credit = 4 through fin_global). A mode the screen itself defaults to (autoPaymentMode,
    // e.g. Credit for IPD / EMG / indent / package bills) is never hidden, so those bills can
    // still be made.
    hidePaymentModeIDs = [],
  } = props;
  // debugger
  const [t] = useTranslation();
  const [dropDown, setDropDown] = useState({
    currencyDetail: [],
    getBindPaymentMode: [],
    getBankMasterData: [],
    getMachineData: [],
  });
  const location = useLocation();
  const { pathname } = location;
  console.log(location, "location");

  const [currencyData, setCurrencyData] = useState({
    getConvertCurrecncyValue: null,
    selectedCurrency: null,
    apivalue: null,
    notation: null,
    defaultCurrency: null,
  });

  const [handleModelData, setHandleModelData] = useState({});
  const handleModel = (label, width, type, isOpen, Component) => {
    setHandleModelData({
      label: label,
      width: width,
      type: type,
      isOpen: isOpen,
      Component: Component,
    });
  };

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  // "+" beside Discount Type: saves a new discount_reason (Type OPD) and rebinds the list here,
  // so every screen using this payment panel gets it without the parent page reloading.
  const [savedDiscountReasonList, setSavedDiscountReasonList] = useState(null);
  const [discountReasonModal, setDiscountReasonModal] = useState({
    isOpen: false,
    name: "",
  });
  const discountReasonOptions =
    savedDiscountReasonList ?? discounts?.discountReasonList;

  const handleSaveDiscountReason = async () => {
    const reasonName = String(discountReasonModal?.name ?? "").trim();
    if (!reasonName) {
      notify(t("Please Enter Discount Type"), "error");
      return;
    }
    const alreadyExists = (discountReasonOptions ?? []).some(
      (ele) =>
        String(ele?.DiscountReason ?? "").trim().toLowerCase() ===
        reasonName.toLowerCase(),
    );
    if (alreadyExists) {
      notify(t("Discount Type already exists"), "error");
      return;
    }
    try {
      const saveRes = await SaveDiscReason(encodeURIComponent(reasonName), "OPD");
      if (!saveRes?.success) {
        notify(saveRes?.message || t("Discount Type not saved"), "error");
        return;
      }
      const listRes = await GetDiscReasonList("OPD");
      if (Array.isArray(listRes?.data)) {
        setSavedDiscountReasonList(listRes.data);
      }
      setScreenType({ ...screenType, discountReason: reasonName });
      setDiscountReasonModal({ isOpen: false, name: "" });
      notify(t("Discount Type saved successfully"), "success");
    } catch (error) {
      console.error(error);
      notify(t("Discount Type not saved"), "error");
    }
  };

  /**
   *
   * @param {API Call Conversion factor} data
   */
  const handleGetConversionFactor = async (data) => {
    const { CountryID } = data;
    try {
      const apiResponse = await GetConversionFactor(CountryID);
      return apiResponse?.data;
    } catch (error) {
      console.log(error);
    }
  };

  /**
   *
   * @param {API Call Convert Currency} data
   */
  const handlegetConvertCurrency = async (data, balanceAmount) => {
    // ;
    const { CountryID } = data;
    try {
      const data = await getConvertCurrency(CountryID, balanceAmount);
      return data?.data;
    } catch (error) {
      console.log(error);
    }
  };

  const handlePaymentModeChecker = (paymentMode) => {
    if (paymentMethod.some((item) => Number(item?.PaymentModeID) === 4)) {
      return [];
    } else {
      return [...paymentMode];
    }
  };

  const handlePatientAdvanceValue = (
    apiAmount,
    patientAdvance,
    paymentMethodID,
  ) => {
    if (Number(paymentMethodID) === 7) {
      if (Number(apiAmount) > Number(patientAdvance)) {
        return Number(patientAdvance);
      } else {
        return Number(apiAmount);
      }
    } else {
      return Number(apiAmount);
    }
  };

  // Function to add payment mode
  const handleAddPaymentMode = async (e, currencyData) => {
    //
    if (
      paymentMethod.some(
        (data) =>
          data?.PaymentMode === e?.label &&
          data?.PaymentModeID === e?.value &&
          data?.S_CountryID === currencyData?.defaultCurrency,
      )
    ) {
      return store.dispatch(notify(t("paymentMode is already exist!"), "error"));
    }
    const addObject = { ...OBJECT_PAYMENTMODE };
    const appendData =
      Number(e?.value) === 4 ? [] : handlePaymentModeChecker(paymentMethod);

    // ;

    addObject.PaymentMode = e?.label;
    addObject.PaymentModeID = e?.value;
    addObject.patientAdvance = e?.advanceAmount;

    addObject.S_Amount =
      Number(e?.value) === 4
        ? 0
        : handlePatientAdvanceValue(
            currencyData?.getConvertCurrecncyValue,
            addObject.patientAdvance,
            addObject.PaymentModeID,
          );

    addObject.BaseCurrency = currencyData?.notation;

    addObject.S_Notation = currencyData?.selectedCurrency;

    addObject.C_Factor = currencyData?.apivalue;

    addObject.Amount = parseFloat(
      Number(addObject.S_Amount) * Number(addObject.C_Factor),
    ).toFixed(ROUNDOFF_VALUE);

    appendData.push(addObject);

    settleValue(appendData, currencyData);
    setPaymentMethod(appendData);
  };

  /**
   *
   * @param {React Select Handle Change}
   * @param {is handle change per meri handleGetConversionFactor & handlegetConvertCurrency yeh dono api call ho rahi hai...}
   * @param {isme handleAddPaymentMode() yeh function table add kar raha hai}
   */

  const currencyfunctionCall = async (e) => {
    // ;
    const data = await handleGetConversionFactor(e);

    const { balanceAmountValue } = calculateNetAmountAndRoundOff(
      screenType?.billAmount,
      Number(screenType?.discountAmount),
      screenType?.minimumPayableAmount,
      paymentMethod,
    );

    const secondData = await handlegetConvertCurrency(e, balanceAmountValue);

    OBJECT_PAYMENTMODE.S_Currency = e.label;
    OBJECT_PAYMENTMODE.S_CountryID = e.value;

    return { data, secondData };
  };

  const PaymentModefunctionCall = async (e, currencyData) => {
    if (e.label && e.value) {
      await handleAddPaymentMode(e, currencyData);
    } else {
      settleValue(paymentMethod, currencyData);
    }
  };


  // Opt in: the DefaultDiscountReason row in fin_global_resources holds the
  // reason to pre-select when a discount is entered (for example
  // "HOSPITAL DISCOUNT"). Its Value is both the dropdown option to match and the
  // text put in the Discount Reason box, so the wording is controlled from the
  // table, not from here. No active row means nothing is filled and the fields
  // behave exactly as before. Only empty fields are touched, so anything the
  // user picked is never overwritten.
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const defaultDiscountReason = Array.isArray(GetGlobalResources)
    ? String(
        GetGlobalResources.find((item) => item?.Name === "DefaultDiscountReason")
          ?.Value ?? "",
      ).trim()
    : "";

  useEffect(() => {
    if (!defaultDiscountReason) return;
    if (!(Number(screenType?.discountAmount) > 0)) return;

    const wanted = defaultDiscountReason.toUpperCase();
    const matchedReason = (discounts?.discountReasonList ?? []).find(
      (d) => String(d?.DiscountReason ?? "").trim().toUpperCase() === wanted,
    );
    const firstApprover = (discounts?.discountApprovalList ?? [])[0];

    setScreenType((prev) => {
      const next = { ...prev };
      let changed = false;

      if (!prev?.discountReason && matchedReason?.DiscountReason) {
        next.discountReason = matchedReason.DiscountReason;
        changed = true;
      }

      if (!prev?.DiscountReasons1) {
        next.DiscountReasons1 = defaultDiscountReason;
        changed = true;
      }

      if (!prev?.discountApproveBy?.value && firstApprover?.ID) {
        next.discountApproveBy = {
          value: firstApprover.ID,
          label: firstApprover.ApprovalType,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    defaultDiscountReason,
    screenType?.discountAmount,
    discounts?.discountReasonList,
    discounts?.discountApprovalList,
  ]);

  const handleDiscountReasonAndApprove = (name, e) => {
    if (name === "discountApproveBy") {
      setScreenType({
        ...screenType,
        [name]: e,
      });
    } else {
      setScreenType({
        ...screenType,
        [name]: e.value,
      });
    }
  };
  const handleDiscountReasonAndApprove1 = (name, e) => {
    setScreenType({
      ...screenType,
      [name]: e.label,
    });
  };

  const handleReactChange = async (name, e) => {
    const val = paymentMethod[0]?.PaymentMode;
    switch (name) {
      case "currency":
        const response = await currencyfunctionCall(e);

        setCurrencyData({
          selectedCurrency: e.Currency,
          apivalue: response?.data,
          notation: e.B_Currency,
          getConvertCurrecncyValue: response?.secondData,
          defaultCurrency: e.value,
        });

        break;
      case "PaymentMode":
        if (
          Number(screenType?.panelID) !== 1 &&
          [0, "0", "", null].includes(currencyData?.getConvertCurrecncyValue) &&
          Number(e.value) !== 4
        ) {
          notify(t("The total amount is already fully paid"), "error");
          return;
        }

        PaymentModefunctionCall(e, currencyData);
        setCurrencyData({ ...currencyData, defaultPaymentMode: e.value });
        break;

      // case "PaymentMode":
      //   debugger
      //   const usedModes = (paymentMethod || [])
      //     .filter((row) => Number(row?.Amount) > 0)
      //     .map((row) => row?.PaymentMode?.trim())
      //     .filter(Boolean)
      //     .join(", ");
      //   if (
      //     [0, "0", "", null].includes(currencyData?.getConvertCurrecncyValue) &&
      //     Number(e.value) !== 4
      //   ) {
      //     notify(
      //       `The total amount is already fully paid.`,
      //       // `The total amount is already fully paid via ${usedModes}.`,
      //       "error",
      //     );
      //     return;
      //   }

      //   PaymentModefunctionCall(e, currencyData);
      //   setCurrencyData({ ...currencyData, defaultPaymentMode: e.value });
      //   break;

      default:
        return () => {}; // Return a no-op function for the default case
    }
  };

  // Payment Control  API Implement...

  //   const handleReactChange = async (name, e) => {
  //   if (!e) return;

  //   switch (name) {
  //     case "currency": {
  //       try {
  //         const response = await currencyfunctionCall(e);

  //         const newCurrencyState = {
  //           selectedCurrency: e.Currency,
  //           apivalue: response?.data ?? 0,
  //           notation: e.B_Currency,
  //           getConvertCurrecncyValue: response?.secondData ?? 0,
  //           defaultCurrency: e.value,
  //         };

  //         setCurrencyData(prev => ({
  //           ...prev,
  //           ...newCurrencyState,
  //         }));
  //       } catch (err) {
  //         console.error("Currency API failed", err);
  //       }
  //       break;
  //     }

  //     case "PaymentMode": {
  //       setCurrencyData(prev => {
  //         const convertValue = prev?.getConvertCurrecncyValue;

  //         if ([0, "0", "", null, undefined].includes(convertValue) && Number(e.value) !== 4) {
  //           notify("Amount is Fully Paid", "error");
  //           return prev; // ❗ don't update state
  //         }

  //         // Use LATEST state safely
  //         PaymentModefunctionCall(e, prev);

  //         return {
  //           ...prev,
  //           defaultPaymentMode: e.value,
  //         };
  //       });

  //       break;
  //     }

  //     default:
  //       break;
  //   }
  // };

  const fetchCurrencyDetail = async () => {
    try {
      const data = await LoadCurrencyDetail();
      // debugger
      return data?.data;
    } catch (error) {
      console.error("Failed to load currency detail:", error);
    }
  };

  const fetchPaymentMode = async () => {
    try {
      const data = await BindPaymentModePanelWise({
        PanelID: screenType?.panelID,
      });
      return data?.data;
    } catch (error) {
      console.error("Failed to load currency detail:", error);
    }
  };

  const fetchGetBankMaster = async () => {
    try {
      const data = await getBankMaster();
      return data?.data;
    } catch (error) {
      console.error("Failed to load currency detail:", error);
    }
  };

  const fetchGetSwipMachine = async () => {
    try {
      const data = await GetSwipMachine();
      return data?.data;
    } catch (error) {
      console.error("Failed to load currency detail:", error);
    }
  };

  //==========================FETCH ECHS DOCTORS===========================

  const FetchAllDropDown = async () => {
    try {
      const response = await Promise.all([
        fetchCurrencyDetail(),
        fetchPaymentMode(),
        fetchGetBankMaster(),
        fetchGetSwipMachine(),
      ]);

      setDropDown({
        ...dropDown,
        currencyDetail: response[0],
        getBindPaymentMode: response[1],
        getBankMasterData: response[2],
        getMachineData: response[3],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    FetchAllDropDown();

    return () => {
      OBJECT_PAYMENTMODE.S_Currency = "";
      OBJECT_PAYMENTMODE.S_CountryID = "";
    };
  }, []);

  // Function to check and return the net amount or minimum payable amount
  const checkerNetAmountandPatientPayable = (
    netAmount,
    minimumPayableAmount,
  ) => {
    if (netAmount > minimumPayableAmount) {
      return Math.round(minimumPayableAmount).toFixed(ROUNDOFF_VALUE);
    } else {
      return Math.round(netAmount).toFixed(ROUNDOFF_VALUE);
    }
  };

  // Function to calculate various amounts including net amount, round off, etc.
  const calculateNetAmountAndRoundOff = (
    grossAmount,
    DiscountAmount,
    constantMinimumPayableAmount,
    paymentModeList,
  ) => {
    const netAmount = Math.round(
      parseFloat(grossAmount) - parseFloat(DiscountAmount),
    ).toFixed(ROUNDOFF_VALUE);

    const roundOff = (
      netAmount -
      (parseFloat(grossAmount) - parseFloat(DiscountAmount))
    ).toFixed(ROUNDOFF_VALUE);

    const minimumPayableAmount = checkerNetAmountandPatientPayable(
      netAmount - roundOff,
      constantMinimumPayableAmount,
    );

    const { discountPercentage } = calculateDiscountPercentage(
      parseFloat(DiscountAmount).toFixed(ROUNDOFF_VALUE),
      grossAmount,
    );
    const { discountPercentageWithoutRoundoff } = calculateDiscountPercentageWithoutRoundoff(
      parseFloat(DiscountAmount),
      grossAmount,
    );

    const panelPayable = (netAmount - minimumPayableAmount).toFixed(
      ROUNDOFF_VALUE,
    );

    const paidAmount = findPaidAmount(paymentModeList).toFixed(ROUNDOFF_VALUE);

    const balanceAmount = (minimumPayableAmount - paidAmount).toFixed(
      ROUNDOFF_VALUE,
    ); // paidamount;

    const coPayAmount = (
      screenType?.coPayAmount ? Number(screenType?.coPayAmount) : 0.0
    ).toFixed(ROUNDOFF_VALUE);

    const coPayPercent = (
      screenType?.coPayPercent ? Number(screenType?.coPayPercent) : 0.0
    ).toFixed(ROUNDOFF_VALUE);
    return {
      roundOffValue: roundOff,
      netAmountValue: netAmount,
      panelPayableValue: panelPayable,
      paidAmountValue: paidAmount,
      minimumPayableAmountValue: minimumPayableAmount,
      balanceAmountValue: balanceAmount,
      discountPercentageValue: discountPercentage.toFixed(ROUNDOFF_VALUE),
      coPayAmount: coPayAmount,
      coPayPercent: coPayPercent,
      discountPercentageWithoutRoundoff:discountPercentageWithoutRoundoff
    };
  };

  // Function to calculate discount percentage
  const calculateDiscountPercentage = (discountAmount, grossAmount) => {
    const discountPercentage =
      grossAmount > 0
        ? ((discountAmount * 100) / grossAmount).toFixed(ROUNDOFF_VALUE)
        : (0.0).toFixed(ROUNDOFF_VALUE);
    return { discountPercentage: Number(discountPercentage) };
  };
  const calculateDiscountPercentageWithoutRoundoff = (discountAmount, grossAmount) => {
    const discountPercentage =
      grossAmount > 0
        ? ((discountAmount * 100) / grossAmount)
        : (0.0);
    return { discountPercentageWithoutRoundoff: Number(discountPercentage) };
  };

  // Function to calculate discount amount based on percentage
  const calculateDiscountAmount = (percentage, grossAmount) => {
    return ((grossAmount * percentage) / 100).toFixed(ROUNDOFF_VALUE);
  };

  // Function to calculate co-pay percentage

  const calculateCoPayPercent = (copay, netAmount) => {
    const discountPercentage = ((copay * 100) / netAmount).toFixed(
      ROUNDOFF_VALUE,
    );
    return discountPercentage;
  };

  // Function to calculate co-pay amount based on percentage

  const calaculateCoPayAmount = (coPayPercent, netAmount) => {
    return (netAmount * coPayPercent) / 100;
  };

  // Function to find total paid amount from the payment mode list

  const findPaidAmount = (paymentModeList) => {
    return paymentModeList?.length > 0
      ? paymentModeList?.reduce(
          (acc, current) => acc + Number(current?.Amount),
          0,
        )
      : 0;
  };

  // Function to handle change in co-pay percentage amount
console.log(screenType?.discountPercentageWithoutRoundoff,"ssssddsdsdsdsdsdsdddddddd")
  const handleCoPayPercentageAmt = (e) => {
    const { name, value } = e.target;
    setPaymentMethod([]);
    if (value <= 100) {
      const copayAmount = calaculateCoPayAmount(value, screenType?.netAmount);
      const {
        roundOffValue,
        netAmountValue,
        panelPayableValue,
        paidAmountValue,
        balanceAmountValue,
        discountPercentageValue,
        minimumPayableAmountValue,
          discountPercentageWithoutRoundoff
      } = calculateNetAmountAndRoundOff(
        screenType?.billAmount,
        Number(screenType?.discountAmount),
        Number(copayAmount)
          ? Number(copayAmount)
          : screenType?.constantMinimumPayableAmount,
        paymentMethod,
      );
      setScreenType({
        ...screenType,
        roundOff: roundOffValue,
        netAmount: netAmountValue,
        panelPayable: panelPayableValue,
        balanceAmount: balanceAmountValue,
        discountPercentage: discountPercentageValue,
        minimumPayableAmount: minimumPayableAmountValue,
        paidAmount: paidAmountValue,
        coPayAmount: copayAmount,
        discountPercentageWithoutRoundoff: discountPercentageWithoutRoundoff, 
        [name]: value,
      });
    }
  };

  // Function to settle values in the screen type state

  // const settleValue = async (paymentModeList, currencyDatas) => {
  //   const {
  //     roundOffValue,
  //     netAmountValue,
  //     panelPayableValue,
  //     balanceAmountValue,
  //     paidAmountValue,
  //     discountPercentageValue,
  //     minimumPayableAmountValue,
  //     coPayAmount,
  //     coPayPercent,
  //     discountPercentageWithoutRoundoff
  //   } = calculateNetAmountAndRoundOff(
  //     screenType?.billAmount,
  //     Number(screenType?.discountAmount),
  //     screenType?.minimumPayableAmount,
  //     paymentModeList,
  //   );
  //   setScreenType({
  //     ...screenType,
  //     roundOff: roundOffValue,
  //     netAmount: netAmountValue,
  //     panelPayable: panelPayableValue,
  //     balanceAmount: balanceAmountValue,
  //     paidAmount: paidAmountValue,
  //     discountPercentage: discountPercentageValue,
  //     minimumPayableAmount: minimumPayableAmountValue,
  //     coPayAmount: coPayAmount,
  //     coPayPercent: coPayPercent,
  //     discountPercentageWithoutRoundoff: discountPercentageWithoutRoundoff
  //   });
  //   // debugger
  //   const data = await handlegetConvertCurrency(
  //     { CountryID: currencyDatas?.defaultCurrency },
  //     balanceAmountValue,
  //   );

  //   const finalData = {
  //     ...currencyDatas,
  //     getConvertCurrecncyValue: data,
  //   };

  //   setCurrencyData(finalData);
  // };

  const settleValue = async (paymentModeList, currencyDatas) => {
    setScreenType((prev) => {
      const {
        roundOffValue,
        netAmountValue,
        panelPayableValue,
        balanceAmountValue,
        paidAmountValue,
        discountPercentageValue,
        minimumPayableAmountValue,
        coPayAmount,
        coPayPercent,
        discountPercentageWithoutRoundoff,
      } = calculateNetAmountAndRoundOff(
        prev?.billAmount,
        Number(prev?.discountAmount),
        prev?.minimumPayableAmount,
        paymentModeList,
      );
      return {
        ...prev,
        roundOff: roundOffValue,
        netAmount: netAmountValue,
        panelPayable: panelPayableValue,
        balanceAmount: balanceAmountValue,
        paidAmount: paidAmountValue,
        discountPercentage: discountPercentageValue,
        minimumPayableAmount: minimumPayableAmountValue,
        coPayAmount: coPayAmount,
        coPayPercent: coPayPercent,
        discountPercentageWithoutRoundoff: discountPercentageWithoutRoundoff,
      };
    });

    // Currency conversion for this settle's snapshot (display only; a fresh run for
    // the newer amount refreshes it — it never writes back to gross).
    const { balanceAmountValue } = calculateNetAmountAndRoundOff(
      screenType?.billAmount,
      Number(screenType?.discountAmount),
      screenType?.minimumPayableAmount,
      paymentModeList,
    );
    // debugger
    const data = await handlegetConvertCurrency(
      { CountryID: currencyDatas?.defaultCurrency },
      balanceAmountValue,
    );

    const finalData = {
      ...currencyDatas,
      getConvertCurrecncyValue: data,
    };

    setCurrencyData(finalData);
  };

  // Function to handle change in various amounts

  const handleCoPayAmount = (e) => {
    const { name, value } = e.target;
    setPaymentMethod([]);
    // ;
    if (Number(value) <= Number(screenType?.netAmount)) {
      const copayPercentageValue = calculateCoPayPercent(
        Number(value),
        screenType?.netAmount,
      );
      const {
        roundOffValue,
        netAmountValue,
        panelPayableValue,
        paidAmountValue,
        balanceAmountValue,
        discountPercentageValue,
        minimumPayableAmountValue,
        discountPercentageWithoutRoundoff
      } = calculateNetAmountAndRoundOff(
        screenType?.billAmount,
        Number(screenType?.discountAmount),
        Number(value)
          ? Number(value)
          : screenType?.constantMinimumPayableAmount,
        paymentMethod,
      );

      setScreenType({
        ...screenType,
        roundOff: roundOffValue,
        netAmount: netAmountValue,
        panelPayable: panelPayableValue,
        balanceAmount: balanceAmountValue,
        discountPercentage: discountPercentageValue,
        paidAmount: paidAmountValue,
        minimumPayableAmount: minimumPayableAmountValue,
        coPayPercent: copayPercentageValue,
        discountPercentageWithoutRoundoff: discountPercentageWithoutRoundoff,
        [name]: value,
      });
    }
  };

  const handleChangeDiscountAmt = async (e) => {
    const { name, value } = e.target;
    const floatValue = value;
    setPaymentMethod([]);
// debugger
    if (Number(floatValue).toFixed(ROUNDOFF_VALUE) <=Number(screenType?.billAmount)) {

      const {
        roundOffValue,
        netAmountValue,
        panelPayableValue,
        balanceAmountValue,
        paidAmountValue,
        discountPercentageValue,
        minimumPayableAmountValue,
        discountPercentageWithoutRoundoff
      } = calculateNetAmountAndRoundOff(
        screenType?.billAmount,
        Number(floatValue),
        screenType?.constantMinimumPayableAmount,
        [],
      );
      setScreenType({
        ...screenType,
        roundOff: roundOffValue,
        netAmount: netAmountValue,
        panelPayable: panelPayableValue,
        paidAmount: paidAmountValue,
        balanceAmount: balanceAmountValue,
        discountPercentage: discountPercentageValue,
        discountPercentageWithoutRoundoff: discountPercentageWithoutRoundoff,
        minimumPayableAmount: minimumPayableAmountValue,
        coPayAmount: 0.0,
        coPayPercent: 0.0,
        [name]: floatValue,
      });
    }
  };

  // Loyalty coins (opt-in: only a screen that passes the `loyalty` prop gets any of this).
  // The redemption arrives already priced and verified by the server; this just puts it on
  // the bill the way a typed discount amount would be, and fills the discount type, reason
  // and approver so the operator has nothing to enter.
  const applyLoyaltyDiscount = (r) => {
    const amount = Number(r?.discountAmount);
    const gross = Number(screenType?.billAmount);
    if (!(amount > 0) || amount > gross) {
      notify(t("Loyalty discount does not fit this bill"), "error");
      return;
    }
    const approvers = discounts?.discountApprovalList ?? [];
    const approver =
      approvers.find((a) => String(a?.ID) === String(r?.approverID)) ??
      approvers.find(
        (a) =>
          String(a?.ApprovalType ?? "").trim().toLowerCase() ===
          String(r?.approverName ?? "").trim().toLowerCase(),
      ) ??
      approvers[0];

    setPaymentMethod([]);
    const calc = calculateNetAmountAndRoundOff(
      screenType?.billAmount,
      amount,
      screenType?.constantMinimumPayableAmount,
      [],
    );
    setScreenType({
      ...screenType,
      roundOff: calc.roundOffValue,
      netAmount: calc.netAmountValue,
      panelPayable: calc.panelPayableValue,
      paidAmount: calc.paidAmountValue,
      balanceAmount: calc.balanceAmountValue,
      discountPercentage: calc.discountPercentageValue,
      discountPercentageWithoutRoundoff: calc.discountPercentageWithoutRoundoff,
      minimumPayableAmount: calc.minimumPayableAmountValue,
      coPayAmount: 0.0,
      coPayPercent: 0.0,
      discountAmount: amount.toFixed(ROUNDOFF_VALUE),
      discountReason: r?.discountType ?? "",
      DiscountReasons1: r?.discountReason ?? "",
      discountApproveBy: approver
        ? { value: approver.ID, label: approver.ApprovalType }
        : screenType?.discountApproveBy,
    });
    // After the bill is updated, so the panel never sees "applied" next to the old discount.
    loyalty?.setApplied(r);
  };

  // Takes a redemption off. The discount is only zeroed if it is still the loyalty amount
  // (when the bill changed under it the screen has already reset it).
  const removeLoyaltyDiscount = () => {
    const applied = loyalty?.applied;
    loyalty?.setApplied(null);
    if (!applied) return;
    const current = Number(screenType?.discountAmount || 0);
    const stillLoyalty = Math.abs(current - Number(applied.discountAmount)) <= 0.005;
    const next = { ...screenType };
    if (stillLoyalty) {
      setPaymentMethod([]);
      const calc = calculateNetAmountAndRoundOff(
        screenType?.billAmount,
        0,
        screenType?.constantMinimumPayableAmount,
        [],
      );
      Object.assign(next, {
        roundOff: calc.roundOffValue,
        netAmount: calc.netAmountValue,
        panelPayable: calc.panelPayableValue,
        paidAmount: calc.paidAmountValue,
        balanceAmount: calc.balanceAmountValue,
        discountPercentage: calc.discountPercentageValue,
        discountPercentageWithoutRoundoff: calc.discountPercentageWithoutRoundoff,
        minimumPayableAmount: calc.minimumPayableAmountValue,
        discountAmount: "0",
      });
    }
    const leftover = stillLoyalty ? 0 : current;
    if (leftover <= 0 && screenType?.discountReason === applied.discountType) {
      next.discountReason = "";
      next.DiscountReasons1 = "";
      next.discountApproveBy = undefined;
    }
    setScreenType(next);
  };

  const handleChangeDiscount = (e) => {
    let { name, value } = e.target;
    if (name === "discountPercentage") {
      value =
        value > discounts?.Eligible_DiscountPercent
          ? discounts?.Eligible_DiscountPercent
          : value;
    }
    setPaymentMethod([]);
    if (value <= 100) {
      const amount = calculateDiscountAmount(value, screenType?.billAmount);
      const {
        roundOffValue,
        netAmountValue,
        panelPayableValue,
        balanceAmountValue,
        paidAmountValue,
        discountPercentageWithoutRoundoff,
        minimumPayableAmountValue,
      } = calculateNetAmountAndRoundOff(
        screenType?.billAmount,
        Number(amount),
        screenType?.constantMinimumPayableAmount,
        [],
      );
      setScreenType({
        ...screenType,
        discountAmount: amount,
        roundOff: roundOffValue,
        netAmount: netAmountValue,
        panelPayable: panelPayableValue,
        paidAmount: paidAmountValue,
        balanceAmount: balanceAmountValue,
        minimumPayableAmount: minimumPayableAmountValue,
        discountPercentageWithoutRoundoff: discountPercentageWithoutRoundoff,
        coPayAmount: 0.0,
        coPayPercent: 0.0,
        [name]: value,
      });
    }
  };

  // const handleebouningSettle = useCallback(
  //   debounce((data, currencyData) => {

  //   }, 300),
  //   []
  // );

  const handlePaymentTableChange = (e, index) => {
    // ;
    const { name, value } = e.target;
    const data = JSON.parse(JSON.stringify([...paymentMethod]));

    if (name === "S_Amount") {
      data[index]["Amount"] = parseFloat(
        Number(value) * data[index]["C_Factor"],
      ).toFixed(ROUNDOFF_VALUE);

      const paidAmount = findPaidAmount(data);

      if (Number(paidAmount) <= Number(screenType?.minimumPayableAmount)) {
        data[index][name] = value;

        setPaymentMethod(data);
        settleValue(data, currencyData);
      }
    } else {
      data[index][name] = value;
      setPaymentMethod(data);
    }
  };

  const handlePaymentRemove = (index) => {
    const data = JSON.parse(JSON.stringify([...paymentMethod]));
    const filterData = data.filter((_, ind) => ind !== index);
    setPaymentMethod(filterData);
    settleValue(filterData, currencyData);
  };
  useEffect(() => {
    let timeoutId;
    // Same truthiness check as before, but a non-numeric billAmount ("NaN")
    // must not reach the currency APIs &Amount=NaN.
    if (screenType?.billAmount && !isNaN(Number(screenType?.billAmount))) {
      timeoutId = setTimeout(() => {
        asyncEffect();
      }, 500);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [screenType?.constantMinimumPayableAmount, screenType?.billAmount]);

  const asyncEffect = async () => {
    if (
      dropDown?.currencyDetail?.length > 0 &&
      dropDown?.getBindPaymentMode?.length > 0
    ) {
      const data = handleReactSelectDropDownOptions(
        dropDown?.currencyDetail,
        "Currency",
        "CountryID",
      )?.find((ele) => ele?.IsBaseCurrency);

      const check = data
        ? data
        : notify(t("BaseCurrency is not set In Master"), "error");

      const secondData = dropDown?.getBindPaymentMode.find(
        (ele) => ele?.PaymentModeID === Number(screenType?.autoPaymentMode),
      );

      const response1 = await currencyfunctionCall(data);

      const finalResponse = {
        selectedCurrency: data.Currency,
        apivalue: response1?.data,
        notation: data.B_Currency,
        getConvertCurrecncyValue: response1?.secondData,
        defaultCurrency: data.value,
        defaultPaymentMode: screenType?.autoPaymentMode,
      };

      await PaymentModefunctionCall(
        {
          label: secondData?.PaymentMode,
          value: secondData?.PaymentModeID,
        },
        finalResponse,
      );
    }
  };

  const handleBlurFunction = async () => {
    // ;
    // document.getElementById("defaultPaymentMode").value = null;
    const data = handleReactSelectDropDownOptions(
      dropDown?.currencyDetail,
      "Currency",
      "CountryID",
    )?.find((ele) => ele?.IsBaseCurrency);

    const secondData = dropDown?.getBindPaymentMode.find(
      (ele) => ele?.PaymentModeID === Number(screenType?.autoPaymentMode),
    );
    const response1 = await currencyfunctionCall(data);

    const finalResponse = {
      selectedCurrency: data.Currency,
      apivalue: response1?.data,
      notation: data.B_Currency,
      getConvertCurrecncyValue: response1?.secondData,
      defaultCurrency: data.value,
      defaultPaymentMode: null,
    };

    await PaymentModefunctionCall(
      {
        label: secondData?.PaymentMode,
        value: secondData?.PaymentModeID,
      },
      finalResponse,
    );
  };
  const handlePaymentModeDropdOwnFilter = (dropdownData, type, isReceipt) => {
    if (
      (pathname === "/opd-return" ||
        pathname === "/patient-indent-issue-ipd") &&
      Number(patientDetail?.TotalPaidAmount || 0) === 0
    ) {
      return dropdownData?.filter((item) => Number(item?.PaymentModeID) === 4);
    }

    if (isReceipt === 0) {
      return dropdownData?.filter((item) => Number(item?.PaymentModeID) === 4);
    } else {
      switch (type) {
        case 1:
          return dropdownData?.filter(
            (item) =>
              Number(item?.IsForRefund) === 1 &&
              Number(item?.PaymentModeID) !== 7,
          );

        case 2:
          return dropdownData?.filter(
            (item) =>
              Number(item?.IsForAdvance) === 1 &&
              Number(item?.PaymentModeID) !== 7,
          );

        case 3:
          return dropdownData?.filter(
            (item) => Number(item?.PaymentModeID) !== 7,
          );

        default:
          return dropdownData;
      }
    }
  };

  const hiddenModesKey = (hidePaymentModeIDs || []).join(",");
  const handlePaymentDropdown = useMemo(() => {
    const autoMode = Number(screenType?.autoPaymentMode) || 0;
    const hidden = (hidePaymentModeIDs || [])
      .map(Number)
      .filter((id) => id > 0 && id !== autoMode);
    const dropDownData = handlePaymentModeDropdOwnFilter(
      dropDown?.getBindPaymentMode,
      screenType?.refund,
      screenType?.isReceipt,
    )?.filter((item) => !hidden.includes(Number(item?.PaymentModeID)));
    const currencyChecker = dropDown?.currencyDetail.find(
      (items, _) => Number(items?.CountryID) === currencyData?.defaultCurrency,
    );

    if (currencyChecker?.IsBaseCurrency) {
      return dropDownData?.map((ele, index) => {
        return {
          label: ele?.PaymentMode,
          value: ele?.PaymentModeID,
          advanceAmount: screenType?.patientAdvanceAmount,
          index: index,
        };
      });
    } else {
      const dropDownDataNew = dropDownData?.filter(
        (items, _) => Number(items?.PaymentModeID) !== 7,
      );

      return dropDownDataNew?.map((ele, index) => {
        return {
          label: ele?.PaymentMode,
          value: ele?.PaymentModeID,
          advanceAmount: screenType?.patientAdvanceAmount,
          index: index,
        };
      });
    }
  }, [
    dropDown?.getBindPaymentMode,
    screenType?.refund,
    screenType?.patientAdvanceAmount,
    currencyData?.defaultCurrency,
    patientDetail?.TotalPaidAmount,
    screenType?.autoPaymentMode,
    screenType?.isReceipt,
    hiddenModesKey,
  ]);
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    const data = value
    ? Number(
      Number(value).toFixed(ROUNDOFF_VALUE) - screenType?.paidAmount,
    ).toFixed(ROUNDOFF_VALUE)
    : "";
    setScreenType({ ...screenType, [name]: data });
  };

  const handleFormatlabel = (name, label, rest) => {
    if (name === "PaymentMode" && Number(rest?.value) === 7) {
      return (
        <div>
          {label} <span className="text-danger">({rest?.advanceAmount})</span>
        </div>
      );
    } else {
      return <div>{label}</div>;
    }
  };

  return screenType?.billAmount ? (
    <>
      <div className="row  g-4 pt-2 ">
        <div className="col-md-7 col-sm-12">
          <div className="card">
            <div className="row p-2">
              <div className="col-md-2">
                <ReactSelect
                  placeholderName={t("Currency")}
                  searchable="true"
                  respclass=""
                  name="currency"
                  id={"Currency"}
                  dynamicOptions={handleReactSelectDropDownOptions(
                    dropDown?.currencyDetail,
                    "Currency",
                    "CountryID",
                  )}
                  value={currencyData?.defaultCurrency}
                  handleChange={handleReactChange}
                  removeIsClearable={true}
                />
              </div>

              <div className="col-md-3">
                <ReactSelect
                  placeholderName={t("PaymentMode")}
                  searchable="true"
                  respclass=""
                  name="PaymentMode"
                  id={"defaultPaymentMode"}
                  defaultValue={"Cash"}
                  dynamicOptions={handlePaymentDropdown}
                  value={paymentMethod[0]?.PaymentModeID}
                  handleChange={handleReactChange}
                  removeIsClearable={true}
                  handleFormatlabel={handleFormatlabel}
                  isDisabled={pkgDisable}
                />
              </div>

              <Input
                type="text"
                className="form-control "
                id="Remark"
                name="Remark"
                removeFormGroupClass={false}
                lable={t("Remark")}
                placeholder=" "
                required={true}
                respclass="col-md-3"
                value={screenType?.Remark ? screenType?.Remark : ""}
                onChange={(e) => {
                  handleDiscountReasonAndApprove("Remark", {
                    value: e.target?.value,
                  });
                }}
                // onKeyDown={Tabfunctionality}
              />

              <div className="col-md-4">
                <label className="inrkey mx-2">
                  <span>
                    {Number(currencyData?.getConvertCurrecncyValue).toFixed(4)}{" "}
                  </span>
                  <span>{currencyData?.selectedCurrency}</span>
                </label>

                <label>{t("Factor")} :</label>
                <label>
                  1 <span>{currencyData?.selectedCurrency}</span> ={" "}
                  <span>{currencyData?.apivalue}</span>{" "}
                  <span>{currencyData?.notation}</span>
                </label>
              </div>
            </div>
            <PaymentTable
              getBankMasterData={dropDown?.getBankMasterData}
              getMachineData={dropDown?.getMachineData}
              tbody={paymentMethod}
              handleChange={handlePaymentTableChange}
              handlePaymentRemove={handlePaymentRemove}
              singlePatientData={singlePatientData}
              onRazorpayClick={onRazorpayClick}
            />
          </div>
        </div>
        <div className="col-md-5 col-sm-12">
          <div className="card">
            <div className="row p-2">
              {loyalty && (
                <div className="col-12">
                  <LoyaltyRedeemPanel
                    patientID={loyalty.patientID}
                    billAmount={screenType?.billAmount}
                    currentDiscount={screenType?.discountAmount}
                    applied={loyalty.applied}
                    onApplied={(r) =>
                      r ? applyLoyaltyDiscount(r) : removeLoyaltyDiscount()
                    }
                  />
                </div>
              )}
              <Input
                type="text"
                className="form-control "
                id="billAmount"
                name="billAmount"
                removeFormGroupClass={false}
                lable={t("Gross_Amount")}
                placeholder=""
                display="right"
                required={true}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={true}
                value={screenType?.billAmount}
              />
              <Input
                type="text"
                className="form-control "
                id="DiscountAmt"
                name="discountAmount"
                removeFormGroupClass={false}
                display="right"
                lable={t("Discount_Amt")}
                placeholder=" "
                value={screenType?.discountAmount}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={
                  screenType?.disableDiscount
                    ? true
                    : screenType?.discountIsDefault === 1
                      ? true
                      : false
                }
                onChange={(e) => {
                  inputBoxValidation(
                    AMOUNT_REGX(100),
                    e,
                    handleChangeDiscountAmt,
                  );
                }}
                // onChange={handleChangeDiscountAmt}
                onBlur={() => {
                  handleBlurFunction();
                }}
              />

              <Input
                type="text"
                className="form-control "
                id="NetAmount"
                name="netAmount"
                removeFormGroupClass={false}
                lable={t("Net_Amount")}
                placeholder=" "
                display="right"
                value={screenType?.netAmount}
                required={true}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={true}
              />
              <Input
                type="text"
                className="form-control "
                id="Co-PayAmount"
                removeFormGroupClass={false}
                name="coPayAmount"
                lable={t("Co-Pay_Amount")}
                placeholder=" "
                required={true}
                display="right"
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={screenType?.coPayIsDefault === 1 ? true : false}
                value={screenType?.coPayAmount}
                onChange={(e) => {
                  inputBoxValidation(AMOUNT_REGX(100), e, handleCoPayAmount);
                }}
                onBlur={handleBlurFunction}
              />

              <Input
                type="text"
                className="form-control"
                id="Discountin"
                removeFormGroupClass={false}
                lable={t("Discount%")}
                placeholder=" "
                required={true}
                display="right"
                name={"discountPercentage"}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={
                  screenType?.disableDiscount
                    ? true
                    : screenType?.discountIsDefault === 1
                      ? true
                      : false
                }
                value={screenType?.discountPercentage}
                onChange={(e) => {
                  inputBoxValidation(AMOUNT_REGX(100), e, handleChangeDiscount);
                }}
                onBlur={handleBlurFunction}
              />

              <Input
                type="text"
                className="form-control"
                id="PatientPayable"
                name="PatientPayable"
                removeFormGroupClass={false}
                lable={t("Patient_Payable")}
                display="right"
                placeholder=" "
                required={true}
                value={screenType?.minimumPayableAmount}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                // onKeyDown={Tabfunctionality}
                disabled={true}
              />
              {/* //// */}
              <Input
                type="text"
                className="form-control "
                id="Co-PayPercent"
                name="coPayPercent"
                lable={t("Co-Pay_Percent")}
                placeholder=" "
                required={true}
                display="right"
                removeFormGroupClass={false}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={screenType?.coPayIsDefault === 1 ? true : false}
                value={screenType?.coPayPercent}
                onChange={(e) => {
                  inputBoxValidation(
                    AMOUNT_REGX(100),
                    e,
                    handleCoPayPercentageAmt,
                  );
                }}
                onBlur={handleBlurFunction}
              />

              <Input
                type="text"
                className="form-control "
                id="RoundOff"
                name="RoundOff"
                lable={t("Round_Off")}
                placeholder=" "
                removeFormGroupClass={false}
                display="right"
                value={screenType?.roundOff}
                required={true}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={true}
              />

              <Input
                type="text"
                className="form-control "
                id="PanelPayable"
                name="PanelPayable"
                lable={t("Panel_Payable")}
                placeholder=" "
                removeFormGroupClass={false}
                required={true}
                display="right"
                value={screenType?.panelPayable}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={true}
              />

              <Input
                type="text"
                className="form-control "
                id="PaidAmount"
                name="PaidAmount"
                removeFormGroupClass={false}
                lable={t("Paid_Amount")}
                placeholder=" "
                required={true}
                display="right"
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                // onKeyDown={Tabfunctionality}
                disabled={true}
                value={screenType?.paidAmount}
              />

              <Input
                type="text"
                className="form-control "
                id="BalanceAmount"
                name="balanceAmount"
                removeFormGroupClass={false}
                lable={t("Balance_Amount")}
                placeholder=" "
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                disabled={true}
                display="right"
                value={screenType?.balanceAmount}
              />
              {/* <div className="col-xl-4 col-sm-6 col-lg-4 col-md-4 col-lg-4 col-xl-4 col-xxl-3 col-6 ">
                <div className="row"> */}
              <Input
                type="text"
                className="form-control"
                lable={t("Change")}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                name="charge"
                display="right"
                onChange={(e) => {
                  inputBoxValidation(AMOUNT_REGX(100), e, handleAmountChange);
                }}
              />

              <Input
                type="text"
                className="form-control text-danger"
                value={screenType?.charge}
                lable={t("Return")}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                display="right"
                disabled={true}
              />
              {/* </div>
              </div> */}

              {/* <ReactSelect
                placeholderName={t("Discount Reason")}
                id={"SR"}
                searchable={true}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                isDisabled={screenType?.discountAmount > 0 ? false : true}
                dynamicOptions={reactSelectOptionList(
                  discounts?.discountReasonList,
                  "DiscountReason",
                  "DiscountReason",
                  "ID"
                )}
                value={screenType?.discountReason}
                name="discountReason"
                handleChange={handleDiscountReasonAndApprove}
                removeIsClearable={true}
                // respclass="col-xl-2.5 col-md-3 col-sm-4 col-12 input-text"
              /> */}
              <div className="d-flex col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3">
                <ReactSelect
                  placeholderName={t("Discount Type")}
                  id={"SR"}
                  searchable={true}
                  respclass="col-10 pl-0"
                  isDisabled={screenType?.discountAmount > 0 ? false : true}
                  dynamicOptions={reactSelectOptionList(
                    discountReasonOptions,
                    "DiscountReason",
                    "DiscountReason",
                    "ID",
                  )}
                  value={screenType?.discountReason}
                  requiredClassName={
                    screenType?.discountAmount > 0 ? "required-fields" : ""
                  }
                  name="discountReason"
                  handleChange={handleDiscountReasonAndApprove}
                  removeIsClearable={true}
                />
                <div>
                  <button
                    className="btn btn-sm btn-primary"
                    type="button"
                    title={t("Add Discount Type")}
                    onClick={() =>
                      setDiscountReasonModal({ isOpen: true, name: "" })
                    }
                  >
                    <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
                  </button>
                </div>
              </div>
              <Input
                lable={t("Discount Reason")}
                // className="form-control"
                value={
                  screenType.DiscountReasons1 ? screenType.DiscountReasons1 : ""
                }
                disabled={screenType?.discountAmount > 0 ? false : true}
                name="DiscountReasons1"
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                className={`form-control ${screenType?.discountAmount > 0 ? "required-fields" : ""}`}
                onChange={(e) => {
                  handleDiscountReasonAndApprove("DiscountReasons1", {
                    value: e.target?.value,
                  });
                }}
              />

              <ReactSelect
                placeholderName={t("Approved By")}
                id={"AB"}
                searchable={true}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                isDisabled={screenType?.discountAmount > 0 ? false : true}
                dynamicOptions={reactSelectOptionList(
                  discounts?.discountApprovalList,
                  "ApprovalType",
                  "ID",
                )}
                requiredClassName={
                  screenType?.discountAmount > 0 ? "required-fields" : ""
                }
                value={screenType?.discountApproveBy?.value}
                name="discountApproveBy"
                handleChange={handleDiscountReasonAndApprove}
                removeIsClearable={true}
                // respclass="col-xl-2.5 col-md-3 col-sm-4 col-12 input-text"
              />

              {/* <Input
                lable={t("Received By")}
                className="form-control"
                value={screenType?.ReceivedFrom ? screenType?.ReceivedFrom : ""}
                name="ReceivedFrom"
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                onChange={(e) => {
                  handleDiscountReasonAndApprove("ReceivedFrom", {
                    value: e.target?.value,
                  });
                }}
              /> */}

              <Input
                lable={t("Deposited By")}
                value={screenType?.DepositedBy ? screenType?.DepositedBy : ""}
                // className="form-control"
                // className={`form-control ${Number(screenType?.paidAmount) > 0 && "required-fields"}`}
                className={`form-control `}
                name="DepositedBy"
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                onChange={(e) => {
                  handleDiscountReasonAndApprove("DepositedBy", {
                    value: e.target?.value,
                  });
                }}
                // requiredClassName=" required-fields"
              />
              {thermalPrintout && (
                <ReactSelect
                  placeholderName={thermalPrintout?.placeholderName}
                  id={thermalPrintout?.id}
                  searchable={true}
                  respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                  dynamicOptions={thermalPrintout?.dynamicOptions}
                  value={thermalPrintout?.value}
                  name={thermalPrintout?.name}
                  handleChange={thermalPrintout?.handleChange}
                  removeIsClearable={true}
                />
              )}
              {/* 
              <ReactSelect
                placeholderName={t("Discount Type")}
                id={"AB"}
                searchable={true}
                respclass="col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3"
                isDisabled={screenType?.discountAmount > 0 ? false : true}
                dynamicOptions={reactSelectOptionList(
                  discounts?.discountApprovalList,
                  "ApprovalType",
                  "ID"
                )}
                value={screenType?.discountApproveBy}
                name="discountType"
                handleChange={handleDiscountReasonAndApprove}
                removeIsClearable={true}
                // respclass="col-xl-2.5 col-md-3 col-sm-4 col-12 input-text"
              /> */}

              <div className="col-12">
                {button}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* </div> */}

      {discountReasonModal?.isOpen && (
        <Modal
          visible={discountReasonModal?.isOpen}
          setVisible={() => setDiscountReasonModal({ isOpen: false, name: "" })}
          modalWidth="25vw"
          Header={t("Add Discount Type")}
          handleAPI={handleSaveDiscountReason}
        >
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              id="newDiscountReason"
              name="newDiscountReason"
              lable={t("Discount Type")}
              placeholder=" "
              respclass="col-12"
              value={discountReasonModal?.name}
              onChange={(e) =>
                setDiscountReasonModal((val) => ({
                  ...val,
                  name: e.target.value,
                }))
              }
            />
          </div>
        </Modal>
      )}

      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
        >
          {handleModelData?.Component}
        </Modal>
      )}
    </>
  ) : (
    <></>
  );
};

export default PaymentGateway;
