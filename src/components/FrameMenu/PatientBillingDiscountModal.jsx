// import React, { useEffect, useState } from "react";
// import Input from "../formComponent/Input";
// import ReactSelect from "../formComponent/ReactSelect";
// import { AMOUNT_REGX, ROUNDOFF_VALUE_BILLING_PERCENTAGE } from "../../utils/constant";
// import { GetDiscReasonList } from "../../networkServices/opdserviceAPI";
// import { notify, reactSelectOptionList } from "../../utils/utils";
// import { PatientBillingSaveEdit } from "../../networkServices/BillingsApi";
// import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
// import { useTranslation } from "react-i18next";
// import { PatientBillingSaveModalData } from "../../networkServices/BillingsApi";

// const PatientBillingDiscountModal = ({ 
//   data, 
//   GetBindBillDepartment,
//   GetBindBillDetails 
// }) => {
//     console.log("data",data);
//   const [t] = useTranslation();
//   const ip = useLocalStorage("ip", "get");

//   const [discounts, setDiscounts] = useState({
//     discountReasonList: [],
//   });

//   const [payload, setPayload] = useState({
//     DiscPer: data?.DiscPer || "0.00",
//     DiscountAmt: data?.DiscAmt || "0.00",
//     NetAmt: data?.NetAmount || data?.NetAmt || "0.00",
//     TransactionID: data?.TransactionID,
//     DiscountReason: data?.DiscountReason || "",
//   });

//   const GetDiscListAPI = async () => {
//     try {
//       const discountReasonListRes = await GetDiscReasonList("OPD");
//       setDiscounts({
//         discountReasonList: discountReasonListRes?.data || [],
//       });
//     } catch (error) {
//       console.log(error, "Something Went Wrong");
//     }
//   };

//   const handlePatientBillingUpdate = async () => {
//     const discountAmount = Number(payload?.DiscountAmt);
//     const DiscPer = Number(payload?.DiscPer);
//     const netAmount = Number(payload?.NetAmt);

//     // Validation 1: Discount amount cannot exceed net amount
//     if (discountAmount > netAmount) {
//       notify(
//         `Discount Amount (${discountAmount.toFixed(2)}) cannot exceed Net Amount (${netAmount.toFixed(2)})`, 
//         "error"
//       );
//       return;
//     }

//     // Validation 2: If discount amount or percentage exists, reason is mandatory
//     const hasDiscount = discountAmount > 0 || DiscPer > 0;

//     if (hasDiscount && !payload?.DiscountReason) {
//       notify("Please Select Discount Reason when discount is applied", "warn");
//       return;
//     }

//     try {
//       const requestBody = {
//         TransactionID: Number(data.TransactionID),
//         DiscountAmount: Number(payload?.DiscountAmt),
//         DiscountPercent: Number(payload?.DiscPer),
//         DiscountReason: String(payload?.DiscountReason || ""),
//       };

//       const response = await PatientBillingSaveModalData(requestBody);
//       notify(response?.message, response?.success ? "success" : "error");

//       if (response?.success) {
//         onclose;
//         await GetBindBillDepartment();
//         if (GetBindBillDetails) {
//           await GetBindBillDetails();
//         }
//       }
//     } catch (error) {
//       console.log(error, "Something Went Wrong");
//     }
//   };

//   const handleCalulateOfTableData = (modifiedData, name) => {
//     if (!["EditReason", "DiscountReason"].includes(name)) {
//       const grossAmount = data?.NetAmount || 0;

//       if (name !== "DiscountAmt") {
//         modifiedData.DiscountAmt = Number(
//           Number(grossAmount) * Number(modifiedData?.DiscPer) * 0.01
//         ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);
//       }

//       if (name !== "DiscPer") {
//         if (Number(grossAmount) !== 0) {
//           modifiedData.DiscPer = Number(
//             (Number(modifiedData.DiscountAmt) * 100) / Number(grossAmount)
//           ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);
//         } else {
//           modifiedData.DiscPer = "0.00";
//         }
//       }
//     }

//     return modifiedData;
//   };

//   const handleReactChange = (name, e) => {
//     setPayload({ ...payload, [name]: e?.label });
//   };

//   const handleChange = (e, ...rest) => {
//     const { name, value } = e.target;
//     if (rest.length > 0 && rest.some((ele) => ele === false)) {
//       return;
//     }

//     const modifiedData = {
//       ...payload,
//       [name]: value,
//     };

//     const resultData = handleCalulateOfTableData(modifiedData, name);

//     if (name === "DiscountAmt") {
//       const netAmount = Number(data?.NetAmount || data?.NetAmt || 0);
//       const discountAmount = Number(value);

//       if (discountAmount > netAmount) {
//         notify(`Discount Amount cannot exceed Net Amount (${netAmount.toFixed(2)})`, "warn");
//         return;
//       }
//     }

//     setPayload(resultData);
//   };

//   useEffect(() => {
//     GetDiscListAPI();
//   }, []);

//   return (
//     <>
//       <div className="row">
//         <Input
//           className={"form-control"}
//           respclass={"col-12 col-md-4 col-lg-4 col-xl-4"}
//           lable={t("Disc. Amt.")}
//           display={"right"}
//           value={payload?.DiscountAmt}
//           type={"text"}
//           name={"DiscountAmt"}
//           onChange={(e) =>
//             handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
//           }
//         />

//         <Input
//           className={"form-control"}
//           respclass={"col-12 col-md-4 col-lg-4 col-xl-4"}
//           lable={t("Disc. %")}
//           display={"right"}
//           value={payload?.DiscPer}
//           type={"text"}
//           name={"DiscPer"}
//           onChange={(e) =>
//             handleChange(
//               e,
//               AMOUNT_REGX(8).test(e?.target?.value),
//               Number(e?.target?.value) <= 100
//             )
//           }
//         />

//         <ReactSelect
//           respclass={"col-12 col-md-4 col-lg-4 col-xl-4"}
//           placeholderName={t("Discount Reason")}
//           value={payload?.DiscountReason}
//           name={"DiscountReason"}
//           requiredClassName={"required-fields"}
//           dynamicOptions={reactSelectOptionList(
//             discounts?.discountReasonList,
//             "DiscountReason",
//             "ID"
//           )}
//           handleChange={handleReactChange}
//           isRequired={Number(payload?.DiscountAmt) > 0 || Number(payload?.DiscPer) > 0}
//         />
//       </div>

//       <div className="d-flex align-items-center justify-content-end mt-3">
//         <button
//           className="btn btn-sm btn-primary"
//           onClick={handlePatientBillingUpdate}
//         >
//           {t("Save")}
//         </button>
//       </div>
//     </>
//   );
// };

// export default PatientBillingDiscountModal;


import React, { useEffect, useState } from "react";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import TextAreaInput from "../formComponent/TextAreaInput";
import { AMOUNT_REGX, ROUNDOFF_VALUE_BILLING_PERCENTAGE } from "../../utils/constant";
import {
  BindDisApprovalList,
  GetDiscReasonList,
} from "../../networkServices/opdserviceAPI";
import {
  BasicMasterBindPro,
  BasicMasterSavePro,
} from "../../networkServices/BillingsApi";
import { notify, reactSelectOptionList } from "../../utils/utils";
import { PatientBillingSaveEdit } from "../../networkServices/BillingsApi";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { useTranslation } from "react-i18next";
import {
  DeleteDiscountCategory,
  GetDiscountCategoryBreakup,
  PatientBillingSaveModalData,
  SaveDiscReason,
} from "../../networkServices/BillingsApi";
const DISCOUNT_CATEGORY_TYPE = "Category";

const PatientBillingDiscountModal = ({
  data,
  handleModalState,
  GetBindBillDepartment,
  GetBindBillDetails,
  isShowDiscountCategoryField,
}) => {
  console.log("data", data);
  const [t] = useTranslation();
  const ip = useLocalStorage("ip", "get");

  const [discounts, setDiscounts] = useState({
    discountReasonList: [],
    categoryList: [],
  });

  /* Who may approve a discount (f_discountapproval - the same list every other discount
     screen picks from) and the PRO list. The approver is stored by name, because that is
     what DiscountApprovedBy holds and what the bill prints. */
  const [approvers, setApprovers] = useState([]);
  const [proList, setProList] = useState([]);

  /* Adding a PRO opens a box here rather than a second modal: this screen is already
     inside one, and a modal over a modal loses the backdrop click. */
  const [addProOpen, setAddProOpen] = useState(false);
  const [newProName, setNewProName] = useState("");

  /* A bill can carry more than one category discount. These are the ones already
     booked against it - the bill's Discount On Bill is their sum, and the bill print
     lists them the same way. */
  const [categoryBreakup, setCategoryBreakup] = useState([]);

  const [payload, setPayload] = useState({
    DiscPer: data?.DiscPer || "0.00",
    DiscountAmt: data?.DiscAmt || "0.00",
    NetAmt: data?.NetAmount || data?.NetAmt || "0.00",
    TransactionID: data?.TransactionID,
    DiscountReason: data?.DiscountReason || "",
    DiscountRemark: data?.DiscountOnBillRemark || "",
    /* Bound from the bill so reopening the popup shows what was saved last time. */
    DiscountApprovedBy: data?.DiscountApprovedBy || "",
    ProID: Number(data?.DiscountProID || 0),
    ProName: data?.DiscountProName || "",
    CoPaymentPer: data?.CoPaymentPer || "0.00",
    CoPaymentAmount: data?.CoPaymentAmount || "0.00",
    NonPayable: data?.NonPayable || "0.00",
    IsPayable: data?.IsPayable || "0.00",
    PanelPaybleAmt: data?.PanelPaybleAmt || "0.00",
    categoryDisc: data?.categoryDisc || "",
    otherCategory: data?.otherCategory || "",
  });

  // Discount Reason me "Other": chunne par textarea khulta hai, aur wahi likha hua
  // reason save hota hai.
  const OTHER_REASON = "Other";
  const [otherReason, setOtherReason] = useState("");

  const GetDiscListAPI = async () => {
    try {
      const discountReasonListRes = await GetDiscReasonList("OPD");
      const list = discountReasonListRes?.data || [];
      setDiscounts((prev) => ({
        ...prev,
        discountReasonList: list,
      }));
      // Pehle se haath se likha reason (list me nahi) ho to "Other" + wahi text dikhao.
      const saved = String(data?.DiscountReason || "").trim();
      if (
        saved &&
        saved !== OTHER_REASON &&
        !list.some((r) => String(r?.DiscountReason).trim() === saved)
      ) {
        setOtherReason(saved);
        setPayload((prev) => ({ ...prev, DiscountReason: OTHER_REASON }));
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  /* The Pro API has been seen returning its columns in different casings, so every
     spelling seen in the other screens is accepted here too. */
  const buildProOptions = (response) =>
    (Array.isArray(response?.data) ? response.data : [])
      .map((ele) => ({
        label: ele?.ProName ?? ele?.proName ?? ele?.PRONAME ?? "",
        value: ele?.Pro_ID ?? ele?.pro_ID ?? ele?.proID ?? ele?.ProID ?? "",
      }))
      .filter((ele) => ele?.label);

  const GetApproverListAPI = async () => {
    try {
      const response = await BindDisApprovalList("HOSPITAL", "1");
      setApprovers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.log(error, "Approval list not loaded");
    }
  };

  const GetProListAPI = async () => {
    try {
      const list = buildProOptions(await BasicMasterBindPro());
      setProList(list);
      return list;
    } catch (error) {
      console.log(error, "Pro list not loaded");
      return [];
    }
  };

  const GetDiscountCategoryListAPI = async () => {
    try {
      const categoryListRes = await GetDiscReasonList(DISCOUNT_CATEGORY_TYPE);
      const categoryList = categoryListRes?.data || [];
      setDiscounts((prev) => ({
        ...prev,
        categoryList: categoryList,
      }));
      return categoryList;
    } catch (error) {
      console.log(error, "Something Went Wrong");
      return [];
    }
  };

  const handleSaveNewPro = async () => {
    const proName = newProName.trim();
    if (!proName) {
      notify("Name is required", "warn");
      return;
    }
    try {
      const response = await BasicMasterSavePro({ proName, ipaddress: ip || "" });
      if (!response?.success) {
        notify(response?.message || "Error saving Pro Name", "error");
        return;
      }
      notify(response?.message || "Pro name saved successfully", "success");
      /* Reload and select it straight away, so the discount can be saved in one go
         instead of making the biller find the new name themselves. */
      const list = await GetProListAPI();
      const saved = list?.find(
        (ele) =>
          String(ele?.label ?? "").trim().toLowerCase() === proName.toLowerCase(),
      );
      if (saved) {
        setPayload((prev) => ({
          ...prev,
          ProID: Number(saved.value) || 0,
          ProName: saved.label,
        }));
      }
      setNewProName("");
      setAddProOpen(false);
    } catch (error) {
      notify(error?.message || "Error saving Pro Name", "error");
    }
  };

  const GetCategoryBreakupAPI = async () => {
    try {
      const response = await GetDiscountCategoryBreakup(data?.TransactionID);
      const breakup = response?.data || [];
      setCategoryBreakup(breakup);
      if (breakup.length > 0) {
        setPayload((prev) => ({
          ...prev,
          DiscountAmt: "0.00",
          DiscPer: "0.00",
        }));
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
      setCategoryBreakup([]);
    }
  };

  const handleRemoveCategoryDiscount = async (categoryName) => {
    try {
      const response = await DeleteDiscountCategory({
        transactionID: Number(data?.TransactionID),
        discountCategory: String(categoryName || ""),
      });

      if (response?.success) {
        notify(response?.message, "success");
        await GetCategoryBreakupAPI();
        await GetBindBillDepartment();
        if (GetBindBillDetails) {
          await GetBindBillDetails();
        }
      } else {
        notify(response?.message || "Something Went Wrong", "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
      notify("Something Went Wrong", "error");
    }
  };

  const handleSaveDiscountCategory = async () => {
    const categoryName = String(payload?.otherCategory || "").trim();

    if (!categoryName) {
      notify("Please enter Category Discount", "warn");
      return;
    }

    const isAlreadySaved = (discounts?.categoryList || []).some(
      (ele) =>
        String(ele?.DiscountReason || "").trim().toLowerCase() ===
        categoryName.toLowerCase()
    );

    if (isAlreadySaved) {
      notify("Category Discount already exists", "warn");
      return;
    }

    try {
      const response = await SaveDiscReason(
        encodeURIComponent(categoryName),
        DISCOUNT_CATEGORY_TYPE
      );

      if (response?.success) {
        notify("Category Discount saved successfully", "success");
        await GetDiscountCategoryListAPI();
        // Bind the newly saved category back into the Category dropdown above.
        setPayload((prev) => ({
          ...prev,
          categoryDisc: { label: categoryName, value: categoryName },
          otherCategory: "",
        }));
      } else {
        notify(response?.message || "Something Went Wrong", "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
      notify("Something Went Wrong", "error");
    }
  };

  const handlePatientBillingUpdate = async () => {
    // if (!payload?.DiscountAmt || Number(payload.DiscountAmt) <= 0) {
    //       notify("Please enter a valid Discount Amount greater than 0", "warn");
    //       return;
    //     }

    const discountAmount = Number(payload?.DiscountAmt);
    const DiscPer = Number(payload?.DiscPer);
    const netAmount = Number(payload?.NetAmt);

    // Validation 1: Discount amount cannot exceed net amount
    // if (discountAmount > netAmount) {
    //   notify(
    //     `Discount Amount (${discountAmount.toFixed(2)}) cannot exceed Net Amount (${netAmount.toFixed(2)})`, 
    //     "error"
    //   );
    //   return;
    // }

    // Validation 2: If discount amount or percentage exists, reason is mandatory
    const hasDiscount = discountAmount > 0 || DiscPer > 0;

    if (hasDiscount && !payload?.DiscountReason) {
      notify(t("Please Select Discount Reason when discount is applied"), "warn");
      return;
    }

    const selectedCategory = payload?.categoryDisc?.value || "";

    if (isShowDiscountCategoryField) {
      if (hasDiscount && !selectedCategory) {
        notify("Please Select Category when discount is applied", "warn");
        return;
      }
      // "Other" is only the door to adding a new category - it is never itself one.
      if (selectedCategory === "other") {
        notify("Please save the Category Discount first", "warn");
        return;
      }
    }

    const isOtherReason = payload?.DiscountReason === OTHER_REASON;
    if (isOtherReason && !otherReason.trim()) {
      notify("Please enter the Discount Reason", "warn");
      return;
    }
    const discountReasonToSave = isOtherReason
      ? otherReason.trim()
      : String(payload?.DiscountReason || "");
    try {
      const requestBody = {
        TransactionID: Number(data.TransactionID),
        DiscountAmount: Number(payload?.DiscountAmt),
        DiscountPercent: Number(payload?.DiscPer),
        DiscountReason: discountReasonToSave,
        DiscountRemark: String(payload?.DiscountRemark || ""),
        DiscountApprovedBy: String(payload?.DiscountApprovedBy || ""),
        ProID: Number(payload?.ProID || 0),
        ProName: String(payload?.ProName || ""),
        CoPaymentPer: String(payload?.CoPaymentPer || ""),
        CoPaymentAmount: String(payload?.CoPaymentAmount || ""),
        DiscountCategory: isShowDiscountCategoryField
          ? String(selectedCategory)
          : "",
      };
      const response = await PatientBillingSaveModalData(requestBody);
      notify(response?.message, response?.success ? "success" : "error");

      if (response?.success) {
        handleModalState(false, null, null, null);
        await GetBindBillDepartment();
        if (GetBindBillDetails) {
          await GetBindBillDetails();
        }
      } else {
        notify(response?.message || response?.data?.message, "error");
      }
    } catch (error) {
      notify(response?.message || response?.data?.message, "error");
    }
  };
  const handleCalulateOfTableData = (modifiedData, name) => {
    const netAmount = Number(data?.GrossBillAmount) - Number(data?.DiscAmt) || 0;
    // const grossAmount = Number(data?.GrossBillAmount || 0);

    // ================= Discount =================
    if (["DiscountAmt", "DiscPer"].includes(name)) {
      if (name !== "DiscountAmt") {
        modifiedData.DiscountAmt = (
          netAmount *
          Number(modifiedData.DiscPer) *
          0.01
        ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);
      }

      if (name !== "DiscPer") {
        modifiedData.DiscPer =
          netAmount !== 0
            ? (
              (Number(modifiedData.DiscountAmt) * 100) /
              netAmount
            ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE)
            : "0.00";
      }
    }

    // NetAmount hamesha Gross - Discount se recalculate hoga
    modifiedData.NetAmt = (netAmount).toFixed(
      ROUNDOFF_VALUE_BILLING_PERCENTAGE
    );

    // ================= CoPay =================
    // const netAmountForCoPay = Number(modifiedData.NetAmt || 0);

    // if (["CoPaymentAmount", "CoPaymentPer"].includes(name)) {
    //   if (name !== "CoPaymentAmount") {
    //     modifiedData.CoPaymentAmount = (
    //       netAmountForCoPay *
    //       Number(modifiedData.CoPaymentPer) *
    //       0.01
    //     ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);
    //   }

    //   if (name !== "CoPaymentPer") {
    //     modifiedData.CoPaymentPer =
    //       netAmountForCoPay !== 0
    //         ? (
    //             (Number(modifiedData.CoPaymentAmount) * 100) /
    //             netAmountForCoPay
    //           ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE)
    //         : "0.00";
    //   }
    // }
    // ================= CoPay =================
    const nonPayable = Number(data?.NonPayable || 0);
    const netAmountForCoPay = Number(modifiedData.NetAmt || 0) - nonPayable;

    if (["CoPaymentAmount", "CoPaymentPer"].includes(name)) {
      if (name !== "CoPaymentAmount") {
        modifiedData.CoPaymentAmount = (
          netAmountForCoPay *
          Number(modifiedData.CoPaymentPer) *
          0.01
        ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);
      }

      if (name !== "CoPaymentPer") {
        modifiedData.CoPaymentPer =
          netAmountForCoPay !== 0
            ? (
              (Number(modifiedData.CoPaymentAmount) * 100) /
              netAmountForCoPay
            ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE)
            : "0.00";
      }
    }

    return modifiedData;
  };

  const handleChange = (e, ...rest) => {
    const { name, value } = e.target;
    if (rest.length > 0 && rest.some((ele) => ele === false)) {
      return;
    }
    // const grossAmount = Number(data?.GrossBillAmount || 0);
    const netAmt = Number(data?.GrossBillAmount) - Number(data?.DiscAmt) || 0

    // ---- Validation 1: DiscountAmt gross amount se jyada nahi ho ----
    if (name === "DiscountAmt") {
      const discountAmount = Number(value);
      if (discountAmount > netAmt) {
        notify(
          `Discount Amount cannot exceed Gross Amount (${netAmt.toFixed(2)})`,
          "warn"
        );
        return;
      }
    }

    const modifiedData = {
      ...payload,
      [name]: value,
    };

    const resultData = handleCalulateOfTableData(modifiedData, name);

    if (name === "CoPaymentAmount") {
      const nonPayable = Number(data?.NonPayable || 0);
      const netAmount = Number(resultData?.NetAmt || 0);
      const allowedAmount = netAmount - nonPayable;
      const CoPaymentAmount = Number(value);

      if (CoPaymentAmount > allowedAmount) {
        notify(
          `CoPay Amount cannot exceed Net Amount minus Non Payable Amount (${allowedAmount.toFixed(2)})`,
          "warn"
        );
        return;
      }
    }
    setPayload(resultData);
  };
  // const handleCalulateOfTableData = (modifiedData, name) => {
  //   const grossAmount = Number(data?.NetAmount || 0);

  //   // ================= Discount =================

  //   if (["DiscountAmt", "DiscPer"].includes(name)) {
  //     if (name !== "DiscountAmt") {
  //       modifiedData.DiscountAmt = (
  //         grossAmount *
  //         Number(modifiedData.DiscPer) *
  //         0.01
  //       ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);
  //     }

  //     if (name !== "DiscPer") {
  //       modifiedData.DiscPer =
  //         grossAmount !== 0
  //           ? (
  //               (Number(modifiedData.DiscountAmt) * 100) /
  //               grossAmount
  //             ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE)
  //           : "0.00";
  //     }
  //   }

  //   // ================= CoPay =================

  //   if (["CoPayAmount", "CoPayPercentage"].includes(name)) {
  //     if (name !== "CoPayAmount") {
  //       modifiedData.CoPayAmount = (
  //         grossAmount *
  //         Number(modifiedData.CoPayPercentage) *
  //         0.01
  //       ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);
  //     }

  //     if (name !== "CoPayPercentage") {
  //       modifiedData.CoPayPercentage =
  //         grossAmount !== 0
  //           ? (
  //               (Number(modifiedData.CoPayAmount) * 100) /
  //               grossAmount
  //             ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE)
  //           : "0.00";
  //     }
  //   }

  //   return modifiedData;
  // };
  // Categories saved in the master table plus the built in ones.
  const categoryOptions = [
    { label: "Committee Wise", value: "Committee Wise" },
    ...reactSelectOptionList(
      discounts?.categoryList,
      "DiscountReason",
      "DiscountReason"
    ),
    { label: "Other", value: "other" },
  ].filter(
    (ele, index, list) =>
      list.findIndex(
        (item) =>
          String(item?.value || "").toLowerCase() ===
          String(ele?.value || "").toLowerCase()
      ) === index
  );

  const handleReactChange = (name, e) => {
    /* DiscountReason / DiscountApprovedBy are saved as plain text (the label), the way
       they were before the category work - only categoryDisc keeps the whole option. */
    setPayload((prev) => ({
      ...prev,
      [name]: name == "categoryDisc" ? e : e?.label,
    }));
    if (name == "categoryDisc") {
      const alreadyBooked = categoryBreakup?.find(
        (ele) =>
          String(ele?.DiscountCategory || "").toLowerCase() ===
          String(e?.value || "").toLowerCase(),
      );

      setPayload((prev) => ({
        ...prev,
        categoryDisc: e,
        // An already booked category is being edited - show what it currently holds.
        // Anything else starts blank so the entry is added, not carried over.
        ...(categoryBreakup?.length > 0
          ? {
              DiscountAmt: Number(alreadyBooked?.DiscountAmount || 0).toFixed(2),
              DiscPer: Number(alreadyBooked?.DiscountPercent || 0).toFixed(2),
            }
          : {}),
      }));
    }
  };

  /* The PRO needs both halves kept: the id is what the visit row stores, the name is
     what is read back onto the screen and the printout. */
  const handleProChange = (name, option) =>
    setPayload((prev) => ({
      ...prev,
      ProID: Number(option?.value) || 0,
      ProName: option?.label || "",
    }));

  // const handleChange = (e, ...rest) => {
  //   const { name, value } = e.target;
  //   if (rest.length > 0 && rest.some((ele) => ele === false)) {
  //     return;
  //   }

  //   const modifiedData = {
  //     ...payload,
  //     [name]: value,
  //   };

  //   const resultData = handleCalulateOfTableData(modifiedData, name);

  //   if (name === "DiscountAmt") {
  //     const netAmount = Number(data?.NetAmount || data?.NetAmt || 0);
  //     const discountAmount = Number(value);

  //     if (discountAmount > netAmount) {
  //       notify(`Discount Amount cannot exceed Net Amount (${netAmount.toFixed(2)})`, "warn");
  //       return;
  //     }
  //   }

  //   setPayload(resultData);
  // };

  // Calculate percentage when modal opens first time
  useEffect(() => {
    GetDiscListAPI();
    GetApproverListAPI();
    GetProListAPI();
    if (isShowDiscountCategoryField) {
      GetDiscountCategoryListAPI();
      GetCategoryBreakupAPI();
    }

    // Calculate discount percentage on initial load
    // const initialDiscountAmt = Number(data?.DiscAmt || 0);
    // const netAmount = Number(data?.NetAmount || data?.NetAmt || 0);

    // if (initialDiscountAmt > 0 && netAmount > 0) {
    //   const calculatedPercentage = Number(
    //     (initialDiscountAmt * 100) / netAmount
    //   ).toFixed(ROUNDOFF_VALUE_BILLING_PERCENTAGE);

    // setPayload(prev => ({
    //   ...prev,
    //   DiscPer: calculatedPercentage
    // }));
    // }
  }, []);

  return (
    <>
      <div className="row">
        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          readOnly={true}
          lable={t("Gross Amount")}
          display={"right"}
          value={data?.GrossBillAmount}
          type={"text"}
          name={"GrossBillAmount"}
        // onChange={(e) =>
        //   handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
        // }
        />
        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          readOnly={true}
          lable={t("Disc Amount")}
          display={"right"}
          value={data?.DiscAmt}
          type={"text"}
          name={"DiscAmt"}
        // onChange={(e) =>
        //   handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
        // }
        />
        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          readOnly={true}
          lable={t("Net Amount")}
          display={"right"}
          value={Number(data?.GrossBillAmount) - Number(data?.DiscAmt)}
          type={"text"}
          name={"DiscAmt"}
        // onChange={(e) =>
        //   handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
        // }
        />
        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          readOnly={true}
          lable={t("Non Payable Amount")}
          display={"right"}
          value={data?.NonPayable}
          type={"text"}
          name={"DiscAmt"}
        // onChange={(e) =>
        //   handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
        // }
        />
        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          readOnly={true}
          lable={t("Payable Amount")}
          display={"right"}
          value={data?.IsPayable}
          type={"text"}
          name={"DiscAmt"}
        // onChange={(e) =>
        //   handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
        // }
        />
        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          readOnly={true}
          lable={t("Panel Payble Amount")}
          display={"right"}
          value={data?.PanelPaybleAmt}
          type={"text"}
          name={"DiscAmt"}
        // onChange={(e) =>
        //   handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
        // }
        />

      </div>

      <div className="row">
        <Input
          className={"form-control "}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          lable={t("Disc. Amt.")}
          display={"right"}
          value={payload?.DiscountAmt}
          type={"text"}
          name={"DiscountAmt"}
          onChange={(e) =>
            handleChange(e, AMOUNT_REGX(8).test(e?.target?.value))
          }
        />

        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          lable={t("Disc. %")}
          display={"right"}
          value={payload?.DiscPer}
          type={"text"}
          name={"DiscPer"}
          onChange={(e) =>
            handleChange(
              e,
              AMOUNT_REGX(8).test(e?.target?.value),
              Number(e?.target?.value) <= 100
            )
          }
        />
        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          lable={"CoPay Amount"}
          display={"right"}
          value={payload?.CoPaymentAmount}
          type={"text"}
          name={"CoPaymentAmount"}
          onChange={(e) =>
            handleChange(e, AMOUNT_REGX(8).test(e.target.value))
          }
        />

        <Input
          className={"form-control"}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
          lable={"CoPay %"}
          display={"right"}
          value={payload?.CoPaymentPer}
          type={"text"}
          name={"CoPaymentPer"}
          onChange={(e) =>
            handleChange(
              e,
              AMOUNT_REGX(8).test(e.target.value),
              Number(e.target.value) <= 100
            )
          }
        />

      </div>
      {isShowDiscountCategoryField && (
        <div className="card pt-2">
          <ReactSelect
            respclass="col-md-12 col-sm-4 col-12"
            placeholderName={t("Category")}
            value={payload?.categoryDisc}
            name={"categoryDisc"}
            requiredClassName={"required-fields"}
            dynamicOptions={categoryOptions}
            handleChange={handleReactChange}
          />
          {payload?.categoryDisc?.value === "other" && (
            <>
              <TextAreaInput
                className={"form-control"}
                respclass="col-12"
                rows="4"
                lable={t("Category Discount")}
                value={payload?.otherCategory}
                name={"otherCategory"}
                requiredClassName={"required-fields"}
                onChange={(e) =>
                  setPayload((prev) => ({
                    ...prev,
                    otherCategory: e?.target?.value,
                  }))
                }
              />
              <div className="d-flex align-items-center justify-content-end mt-3 mb-3 mx-3">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveDiscountCategory}
                >
                  {t("Save")}
                </button>
              </div>
            </>
          )}

          {categoryBreakup?.length > 0 && (
            <div className="col-12 mt-2 mb-2">
              <table className="table table-sm table-bordered mb-0">
                <thead>
                  <tr>
                    <th>{t("Category")}</th>
                    <th className="text-right">{t("Disc. %")}</th>
                    <th className="text-right">{t("Disc. Amt.")}</th>
                    <th className="text-center" style={{ width: "60px" }}>
                      {t("Remove")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakup?.map((ele) => (
                    <tr key={ele?.ID}>
                      <td>{ele?.DiscountCategory}</td>
                      <td className="text-right">
                        {Number(ele?.DiscountPercent || 0).toFixed(2)}
                      </td>
                      <td className="text-right">
                        {Number(ele?.DiscountAmount || 0).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <i
                          className="fa fa-trash text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            handleRemoveCategoryDiscount(ele?.DiscountCategory)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th colSpan={2} className="text-right">
                      {t("Total Discount")}
                    </th>
                    <th className="text-right">
                      {categoryBreakup
                        ?.reduce(
                          (sum, ele) => sum + Number(ele?.DiscountAmount || 0),
                          0,
                        )
                        ?.toFixed(2)}
                    </th>
                    <th />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
      <ReactSelect
        respclass=" col-md-12 col-sm-4 col-12 mt-3"
        placeholderName={t("Discount Reason")}
        value={payload?.DiscountReason}
        name={"DiscountReason"}
        requiredClassName={"required-fields"}
        dynamicOptions={[
          ...reactSelectOptionList(
            discounts?.discountReasonList,
            "DiscountReason",
            "DiscountReason"
          ),
          { label: OTHER_REASON, value: OTHER_REASON },
        ]}
        handleChange={handleReactChange}
        isRequired={Number(payload?.DiscountAmt) > 0 || Number(payload?.DiscPer) > 0}
      />
      <div className="row">
        <ReactSelect
          respclass="col-md-6 col-12"
          placeholderName={t("Approved By")}
          id={"DiscountApprovedBy"}
          name={"DiscountApprovedBy"}
          searchable={true}
          value={payload?.DiscountApprovedBy}
          dynamicOptions={reactSelectOptionList(
            approvers,
            "ApprovalType",
            "ApprovalType",
          )}
          handleChange={handleReactChange}
        />

        {/* PRO and the add button share the row: the name is often created while the
            discount is being given, and sending the biller to the PRO master would
            lose the half-filled popup. */}
        <div className="col-md-6 col-12">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <ReactSelect
                respclass=""
                placeholderName={t("PRO")}
                id={"ProID"}
                name={"ProID"}
                searchable={true}
                value={payload?.ProID || ""}
                dynamicOptions={proList}
                handleChange={handleProChange}
              />
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary ml-1"
              title={t("Add PRO")}
              onClick={() => setAddProOpen((open) => !open)}
            >
              +
            </button>
          </div>
        </div>

        {addProOpen && (
          <div className="col-12 mt-2">
            <div className="d-flex align-items-center">
              <input
                className="form-control form-control-sm"
                placeholder={t("New PRO Name")}
                value={newProName}
                onChange={(e) => setNewProName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNewPro();
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary ml-1"
                onClick={handleSaveNewPro}
              >
                {t("Save")}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary ml-1"
                onClick={() => {
                  setAddProOpen(false);
                  setNewProName("");
                }}
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        )}

        <TextAreaInput
          id="DiscountRemark"
          name="DiscountRemark"
          lable={t("Discount Remark")}
          value={payload?.DiscountRemark}
          onChange={(e) =>
            setPayload((prev) => ({ ...prev, DiscountRemark: e.target.value }))
          }
          respclass="col-12"
        />
      </div>
      {payload?.DiscountReason === OTHER_REASON && (
        <TextAreaInput
          respclass="col-md-12 col-12 mt-2"
          lable={t("Enter Discount Reason")}
          className="w-100 required-fields"
          id="OtherDiscountReason"
          name="OtherDiscountReason"
          rows={2}
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
        />
      )}
      <div className="d-flex align-items-center justify-content-end mt-3">
        <button
          className="btn btn-sm btn-primary"
          onClick={handlePatientBillingUpdate}
        >
          {t("Save")}
        </button>
      </div>
    </>
  );
};

// co

export default PatientBillingDiscountModal;
