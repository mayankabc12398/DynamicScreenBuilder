import React, { useEffect, useMemo, useState } from "react";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import { useTranslation } from "react-i18next";
import ReactSelect from "../formComponent/ReactSelect";
import {
  CalculateOption,
  RateOnOptions,
  ROUNDOFF_VALUE,
} from "../../utils/constant";
import SearchByName from "../commonComponents/SearchByName";
import SurgeryDepartmentDetailsTable from "../UI/customTable/billings/SurgeryDepartmentDetailsTable";
import Input from "../formComponent/Input";
import SurgeryDetailsTable from "../UI/customTable/billings/SurgeryDetailsTable";
import {
  BindDocType,
  GetAllAuthorization,
  getApproveBy,
  IPDAdvanceBindPatientDetails,
  IPDAdvanceLoadSurgery,
  IPDAdvanceLoadSurgeryDetail,
  Rate,
  SaveSurgery,
} from "../../networkServices/BillingsApi";
import { notify } from "../../utils/utils";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import moment from "moment";
import { useLocation } from "react-router-dom";
import { translateOptions } from "@components/WrapTranslate";

// Mirrors SurgeryDetailsTable's NO_DOCTOR_TYPES: these rows never show the Doctor
// dropdown, so the Save validation below must not demand one for them either.
const NO_DOCTOR_TYPES = [
  "OT CHARGES",
  "OT GASES",
  "ANESTHESIA (MEDICINES) CHARGES",
  "INSTRUMENT CHARGES",
];

const Surgery = ({
  data,
  handleModalState,
  LedgerTnxNo,
  setModalState,
  onSurgerySaved,
}) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const location = useLocation();
  const ip = useLocalStorage("ip", "get");
  const [items, setItems] = useState([]);
  const [DocType, setDocType] = useState([]);
  const [approval, setApproval] = useState([]);
  const [auth, setAuth] = useState([]);
  const [pateintDetails, setPatientDetails] = useState({});
  const initialState = {
    date: new Date(),
    RateOn: {
      label: "Surgeon",
      value: "2",
    },
    itemName: {},
    Type: "",
    CalculateOn: {
      label: "%age",
      value: "2",
    },
    SurgeryAmount: "",
    SurgeonAmount: "",
    Approval: "",
    Remarks: "",
  };

  const [payload, setPayload] = useState({ ...initialState });

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
    GetAuthorizationList();
  }, []);

  const sendReset = () => {
    setPayload(initialState);
    setDocType([]);
    setItems([]);
  };

  const getDefaultReduce = (index) => {
    if (index === 0) return 0;
    if (index === 1) return 50;
    return 25;
  };

 
// const getItemAmount = (item, rateOnValue) => {
//   if (rateOnValue === "2") {
//     return parseFloat(item?.SurgeonCharge ?? item?.surgeonCharge) || 0;
//   }
//   return parseFloat(item?.DocCharge ?? item?.docCharge) || 0;
// };
// RateOn ke hisaab se amount nikalna
const getItemAmount = (item, rateOnValue) => {
  if (rateOnValue === "2") {
    return parseFloat(item?.SurgeonCharge ?? item?.surgeonCharge) || 0;
  }
  return parseFloat(item?.DocCharge ?? item?.docCharge) || 0;
};
const reassignReduceByAmount = (itemsList, rateOnValue) => {
  const sorted = [...itemsList].sort(
    (a, b) => getItemAmount(b, rateOnValue) - getItemAmount(a, rateOnValue),
  );
  return sorted.map((item, index) => ({
    ...item,
    Reduce: getDefaultReduce(index),
  }));
};
  const getRate = async () => {
    const dataPayload = {
      TID: parseInt(data?.transactionID || data?.TransactionID),
      SurgeryID: String(payload?.itemName?.value),
    };
    try {
      if (payload?.itemName?.value) {
        const response = await Rate(dataPayload?.TID, dataPayload?.SurgeryID);
       setItems((prev) => {
  const isAlreadyAdded = prev.some(
    (item) => String(item?.Surgery_ID) === String(response?.data?.Surgery_ID),
  );

  if (isAlreadyAdded) {
    notify(t("Surgery already added"), "warn");
    return prev;
  }

  // Seed the editable CPT Code box. A real code (billed earlier on this
  // admission, panel rate list, or surgery master) wins; when the surgery has
  // none the column keeps showing rateListID, which is what it displayed
  // before it became editable.
  const newRow = { ...response?.data };
  newRow.SurgeryCode = String(
    newRow?.SurgeryCode || newRow?.rateListID || "",
  );

  const newItems = [...prev, newRow];
  return reassignReduceByAmount(newItems, payload?.RateOn?.value);
});
        // setItems((prev) => {
        //   const isAlreadyAdded = prev.some(
        //     (item) => String(item?.Surgery_ID) === String(response?.data?.Surgery_ID),
        //   );

        //   if (isAlreadyAdded) {
        //     notify("Surgery already added", "warn");
        //     return prev;
        //   }

        //   return [
        //     ...prev,
        //     {
        //       ...response?.data,
        //       Reduce: getDefaultReduce(prev.length),
        //     },
        //   ];
        // });
        getBindDocType(
          payload?.RateOn?.value,
          response?.data?.Surgery_ID,
          data?.panelID,
        );
        setPayload((prev) => ({
          ...prev,
          itemName: {},
        }));
      } else {
        notify(t("Item Name Is Required"), "error");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getBindDocType = async (RateType, SurgeryID, panelID) => {
    try {
      if (RateType && SurgeryID) {
        const response = await BindDocType(RateType, SurgeryID, panelID);
        if (response?.success) {
          // EMERGENCY and MICU I charge types are not shown on this screen -
          // filtered out before indexing so IsChecked's "first 3 rows" and every
          // row-edit handler (which index straight into this array) stay aligned.
          const HIDDEN_TYPES = ["EMERGENCY", "MICU I"];
          let data = response?.data
            ?.filter(
              (val) =>
                !HIDDEN_TYPES.includes(String(val?.TYPE || "").trim().toUpperCase()),
            )
            ?.map((val, i) => {
            val.IsChecked = i < 3 ? true : false;
            val.chargeAmt = 0;
            // Quantity surgery rate ka guna hai, isliye default poora rate = 1.
            val.Quantity = 1;
            return val;
          });
          setDocType(data);
        } else {
          setDocType([]);
        }
      }
    } catch (error) {
      console.error("Error fetching document type:", error);
    }
  };
  const getBindApproveBy = async () => {
    try {
      const response = await getApproveBy();
      if (response?.success) {
        setApproval([response?.data]);
      } else {
        setApproval([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleIndexChange = (index, name, value, item) => {
    // if (!Array.isArray(items?.dtSur)) return;
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value,
    };

    // Rate ya Reduce chhedne par Calculator ka daala hua New Rate hat jaata hai,
    // warna edit ka koi asar hi na dikhta.
    if (["SurgeonCharge", "surgeonCharge", "DocCharge", "docCharge", "Reduce"].includes(name)) {
      delete updatedItems[index].NewRate;
    }

    setItems(updatedItems);
  };

  const handleItemsChange = (index, name, e) => {
    const data = [...DocType];
    data[index][name] = e ? e : e.value;

   if (name === "DiscountAmt") {
      data[index].DiscountEditedField = "Amt";
    } else if (name === "DiscountPer") {
      data[index].DiscountEditedField = "Per";
    }

    setDocType(data);
  };
  const handleSelect = (e, index, item) => {
    const { name, checked } = e.target;
    const data = [...DocType];
    data[index][name] = checked;
    setDocType(data);
  };

  // const onDelete = (item, index) => {
  //   const updatedItems = items
  //     .filter((_, i) => i !== index)
  //     .map((item, itemIndex) => ({
  //       ...item,
  //       Reduce: getDefaultReduce(itemIndex),
  //     }));
  //   setItems(updatedItems);
  // };
const onDelete = (item, index) => {
  const updatedItems = items.filter((_, i) => i !== index);
  setItems(reassignReduceByAmount(updatedItems, payload?.RateOn?.value));
};
  const handleCustomSelect = (index, name, e) => {
    const data = [...DocType];
    data[index][name] = e.value;
    data[index][`${name}_label`] = e.label;
    setDocType(data);
  };
  const handleItemSelect = (label, value) => {
    setPayload({
      ...payload,
      itemName: {
        label: label,
        value: value,
      },
    });
  };

  const AddItemHead = [
    t("S.No."),
    t("CPT Code"),
    t("Surgery Name"),
    t("Department"),
    t("Remarks"),
    t("Rate"),
    t("Reduce(%)"),
    t("New Rate"),
    t("Remove"),
  ];
  const SurgeryHead = [
    t("Action"),
    t("S.No."),
    t("Type"),
    t("Doctor"),
    t("Quantity"),
    t("Charges (%)"),
    t("Tax Type"),
    t("TAX (%)"),
    t("Charges (Amount)"),
    t("Discount %"),
    t("Discount Amount"),
    t("Tax Amount"),
    t("Net Amount"),
    t("Panel Non-Payable"),
    t("Panel Co-Payment"),
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };
  const handleReactSelect = (name, value) => {
    setPayload((val) => ({ ...val, [name]: value }));
  };
  const handleReactSelectItem = (name, value) => {
    setPayload((val) => ({ ...val, [name]: value?.value }));
  };

  useEffect(() => {
    getBindApproveBy();
    handleIPDAdvanceBindPatientDetails(
      data?.patientID || data?.PatientID,
      data?.transactionID || data?.TransactionID,
    );
  }, []);

  const handleIPDAdvanceLoadSurgeryDetail = async (LedgerTnxNo) => {
    try {
      const response = await IPDAdvanceLoadSurgeryDetail(LedgerTnxNo);
      
      const data = {
        rateListID: "",
        DocCharge: "",
        Surgery_ID: response?.data?.SurgeryID,
        Department: response?.data?.Department,
        SurgeryCode: response?.data?.SurgeryCode,
        SurgeryName: response?.data?.SurgeryName,
        Remarks: response?.data?.Remark,
        surgeonCharge: response?.data?.Rate,
        Reduce: response?.data?.ReducePerOn,
      };
      setItems([data]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleIPDAdvanceLoadSurgery = async (LedTnxID) => {
    try {
      const response = await IPDAdvanceLoadSurgery(LedTnxID);

      const newresponse = response?.data?.map((item) => {
        if (item.isSelected === "true") {
          return {
            ...item,
            IsChecked: true,
            Type: item.type,
            Doctor: Number(item.doctorID),
            DoctorChargePer: Number(item.doctorChargePer).toFixed(
              ROUNDOFF_VALUE,
            ),
            DiscountPer: Number(item.discountPer).toFixed(ROUNDOFF_VALUE),
            DiscountAmt: Number(item.discountAmt).toFixed(ROUNDOFF_VALUE),
            NetAmt: Number(item.netAmt).toFixed(ROUNDOFF_VALUE),
            isPayable: item.isPayable,
            CoPayment: Number(item.coPayment).toFixed(ROUNDOFF_VALUE),
          };
        } else {
          return {
            ...item,
            IsChecked: false,
            Type: item.type,
            Doctor: item.doctorID,
            DoctorChargePer: Number(item.doctorChargePer).toFixed(
              ROUNDOFF_VALUE,
            ),
            DiscountPer: Number(item.discountPer).toFixed(ROUNDOFF_VALUE),
            DiscountAmt: Number(item.discountAmt).toFixed(ROUNDOFF_VALUE),
            NetAmt: Number(item.netAmt).toFixed(ROUNDOFF_VALUE),
            isPayable: item.isPayable,
            CoPayment: Number(item.coPayment).toFixed(ROUNDOFF_VALUE),
          };
        }
        // return item;
      });

      setDocType(newresponse);
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  useEffect(() => {
    if (LedgerTnxNo) {
      handleIPDAdvanceLoadSurgeryDetail(LedgerTnxNo);
      handleIPDAdvanceLoadSurgery(LedgerTnxNo);
    }
  }, [LedgerTnxNo]);
  const handleSaveSurgery = async () => {
    if (payload?.RateOn?.value === "2") {
      if (!items[0]?.SurgeonCharge) {
        notify(t("Rate is Required"),"warn");
        return;
      }
    }
    try {
      const SurItem = [];
      DocType?.forEach((ele) => {
        if (ele?.IsChecked === true) {
          SurItem.push(ele);
        }
      });
    
      const SurItems = DocType?.filter((ele) => ele?.IsChecked);

      // validate only the rows that actually show a Doctor dropdown
      const hasInvalid = SurItems.some(
        (ele) =>
          ele?.Type_ID !== 3 &&
          !NO_DOCTOR_TYPES.includes(String(ele?.TYPE || "").trim().toUpperCase()) &&
          !ele?.SurgeryDoctorId,
      );
      

      if (hasInvalid) {
        notify(t("Selected List Doctor Is Required"), "error");
        return;
      }
       const getRates = (item) =>
    payload?.RateOn?.value === "2"
      ? Number(item?.SurgeonCharge ?? item?.surgeonCharge ?? 0)
      : Number(item?.DocCharge ?? item?.docCharge ?? 0);

 /* Calculator pressing writes the Total Amt back onto the rows as NewRate, so once
    that has happened the stored figure wins over the Rate/Reduce formula. Editing
    Rate or Reduce afterwards drops the override and the formula takes over again. */
 const calculateNewRate = (item) => {
    if (item?.NewRate !== undefined && item?.NewRate !== null && item?.NewRate !== "") {
      return Number(item?.NewRate).toFixed(ROUNDOFF_VALUE);
    }

    const rate = getRates(item);
    const reduce = Number(item?.Reduce ?? 0);

    if (reduce === 0) return rate.toFixed(ROUNDOFF_VALUE);
    return ((rate * reduce) / 100).toFixed(ROUNDOFF_VALUE);
  };
      const surgeryItems = SurItem?.map((ele) => {
   
        return {
          itemID: ele?.ItemID ? Number(ele?.ItemID) : 0,
          doctorChargePer: ele?.DoctorChargePer
            ? Number(ele?.DoctorChargePer)
            : 0,
          netAmt: ele?.NetAmt ? Number(ele?.NetAmt) : 0,
          isPanelWiseDiscount: ele?.IsPanelWiseDiscount
            ? Number(ele?.IsPanelWiseDiscount)
            : 0,
          doctorID: ele?.SurgeryDoctorId ? Number(ele?.SurgeryDoctorId) : 0,
          discountPer:
            ele?.DiscountPer === "NaN" ? 0 : Number(ele?.DiscountPer || 0),
          subCategoryID: ele?.SubCategoryID ? Number(ele?.SubCategoryID) : 0,
          discountAmt: ele?.DiscountAmt ? Number(ele?.DiscountAmt) : 0,
          type: ele?.TYPE ? String(ele?.TYPE) : "",
          isPayble: ele?.isPayable ? Number(ele?.isPayable) : 0,
          coPayment: ele?.CoPayment ? Number(ele?.CoPayment) : 0,
          isChecked: ele?.IsChecked ? true : false,
          doctorCharge: ele?.DoctorChargePer
            ? parseFloat(ele?.DoctorChargePer)
            : 0,
          chargeAmt: ele?.chargeAmt ? Number(ele?.chargeAmt) : 0,
          surgeryID: items[0]?.Surgery_ID ? String(items[0]?.Surgery_ID) : "",

          // new added keys
          PurchaseTaxGroupName: ele?.PurchaseTaxGroupName
            ? String(ele?.PurchaseTaxGroupName)
            : "",
          PurchaseTaxPercent: ele?.PurchaseTaxPercentage
            ? ele?.PurchaseTaxPercentage
            : 0, // not found
          PurchaseTaxAmount: (
            ((Number(ele?.chargeAmt ? ele?.chargeAmt : 0) * 100) /
              (100 + ele?.PurchaseTaxPercentage)) *
            ele?.PurchaseTaxPercentage *
            0.01
          ).toFixed(ROUNDOFF_VALUE),
          SalesTaxGroupName: ele?.SalesTaxGroupName
            ? String(ele?.SalesTaxGroupName)
            : "",
          SalesTaxPercent: ele?.SalesTaxPercent ? ele?.SalesTaxPercent : 0,
          SalesTaxAmount: (
            ((Number(ele?.chargeAmt ? ele?.chargeAmt : 0) * 100) /
              (100 + ele?.SaleTaxPercentage)) *
            ele?.SaleTaxPercentage *
            0.01
          ).toFixed(ROUNDOFF_VALUE),
          CategoryID: ele?.CategoryID ? Number(ele?.CategoryID) : 0,
          CategoryName: String(ele?.CategoryName ? ele?.CategoryName : ""),
          SubCategoryName: String(
            ele?.SubCategoryName ? ele?.SubCategoryName : "",
          ),
          SubCategoryDisplayName: String(
            ele?.SubCategoryDisplayName ? ele?.SubCategoryDisplayName : "",
          ),
          DoctorName: String(
            ele?.SurgeryDoctorId_label ? ele?.SurgeryDoctorId_label : "",
          ),
        };
      });
      // Constructing request body
      const requestBody = {
        details: [
          {
            surDate: payload?.date
              ? moment(payload?.date).format("DD-MMM-YYYY")
              : "",
            ipdCaseTypeID: data?.ipdCaseTypeID
              ? parseInt(data?.ipdCaseTypeID)
              : 0,
            ipAddress: ip || "",
            roomID: data?.roomId ? parseInt(data?.roomId) : 0,
          },
        ],
        gvSurgeryDetail: items?.map((item) => ({
  surgeryName: item?.SurgeryName ? String(item.SurgeryName) : "",
  surgeryCode: item?.SurgeryCode ? String(item.SurgeryCode) : "",
  surgeryID: item?.Surgery_ID ? String(item.Surgery_ID) : "",
  department: item?.Department ? String(item.Department) : "",
  // rate: Number(totalNewRate),
  rate: Number(item?.SurgeonCharge),
  reducePerOn: item?.Reduce ? parseFloat(item.Reduce) : 0,
  calReducePerOn: Number(totalNewRate),
  // newRate: Number(TotalNetAmount),
  newRate:Number(calculateNewRate(item)),
  remark: item?.Remarks ? String(item.Remarks) : "",
  bookingType: "",
  bookingID: "",
})),
        // gvSurgeryDetail: [
        //   {
        //     surgeryName: items[0]?.SurgeryName
        //       ? String(items[0]?.SurgeryName)
        //       : "",
        //     surgeryCode: items[0]?.SurgeryCode
        //       ? String(items[0].SurgeryCode)
        //       : "",
        //     surgeryID: items[0]?.Surgery_ID ? String(items[0]?.Surgery_ID) : "",
        //     department: items[0]?.Department
        //       ? String(items[0]?.Department)
        //       : "",
        //     rate: Number(totalNewRate),
        //     reducePerOn: items[0]?.Reduce ? parseFloat(items[0]?.Reduce) : 0,
        //     calReducePerOn: Number(totalNewRate),
        //     // calReducePerOn: (items[0]?.surgeonCharge * items[0]?.Reduce) / 100,
        //     newRate: Number(TotalNetAmount),

        //     // newRate: totalNewRate,
        //     remark: items[0]?.Remarks ? String(items[0]?.Remarks) : "",
        //     bookingType: "",
        //     bookingID: "",
        //   },
        // ],
        surgeryItem: surgeryItems, // Passing the surgeryItems array
        approveBy: payload?.Approval ? String(payload?.Approval) : "",
        narration: payload?.Remarks ? String(payload?.Remarks) : "",
        ledgerTnxNo: "", // Assuming ledgerTnxNo is left as empty string
        ipdCaseTypeID: data?.ipdCaseTypeID ? parseInt(data?.ipdCaseTypeID) : 0,
        patientTypeID: "", // Assuming patientTypeID is left empty
        ipAddress: ip || "",
        transactionID: data?.transactionID ? parseInt(data?.transactionID) : 0,
        surDate: payload?.date
          ? moment(payload?.date).format("DD-MMM-YYYY")
          : "",
        rateType: payload?.RateOn?.value ? parseInt(payload.RateOn.value) : 0,
        surgeryCalculate: TotalNetAmount ? parseFloat(TotalNetAmount) : 0,
        totalBill_Amt: "0",
        panelID: data?.panelID ? String(data.panelID) : "",
        code: items[0]?.rateListID ? String(items[0]?.rateListID) : "",
        pageUrl: location?.pathname ? String(location?.pathname) : "",

        // new Keys Added
        PatientID: data?.patientID ? String(data?.patientID) : "",
        DiscountApproveBy: payload?.Approval ? String(payload?.Approval) : "",
      };
      //       requestBody
      //       debugger
      // return
      if (!payload?.Approval) {
        notify(t("Approval is required"), "error");
      } else {
        const response = await SaveSurgery(requestBody);
        if (response?.success) {
          notify(response?.message, "success");
          // Read before sendReset wipes it. Callers that opened this screen to pick
          // a surgery (Edit Package) need the saved row back; the ones that did not
          // pass the callback behave exactly as before.
          const savedSurgery = items?.[0];
          sendReset();
          if (typeof onSurgerySaved === "function") {
            onSurgerySaved(savedSurgery);
          }
          handleModalState(false, null, null, null);
        } else {
          notify(response?.message, "error");
        }
      }
    } catch (error) {
      console.error("Something went wrong while saving surgery", error);
    }
  };

  /* Ek surgery row ka New Rate. Calculator ne Total Amt daal diya ho to wahi chalta
     hai, warna Rate/Reduce ka formula. Save handler ke andar bhi isi naam ka ek local
     helper hai, par wo us block se bahar dikhta nahi - isliye component level par
     yahi ek jagah se Total New Rate aur Calculator dono kaam lete hain. */
  const getRowNewRate = (item) => {
    if (
      item?.NewRate !== undefined &&
      item?.NewRate !== null &&
      item?.NewRate !== ""
    ) {
      return parseFloat(item?.NewRate) || 0;
    }

    const rate =
      payload?.RateOn?.value === "2"
        ? parseFloat(item?.SurgeonCharge ?? item?.surgeonCharge) || 0
        : parseFloat(item?.DocCharge ?? item?.docCharge) || 0;
    const reduce = parseFloat(item?.Reduce) || 0;

    return reduce === 0 ? rate : (rate * reduce) / 100;
  };

  const totalNewRate = useMemo(() => {
    return items?.reduce((total, item) => total + getRowNewRate(item), 0);
  }, [items, payload?.RateOn?.value]);

  /* Calculator ka base: Rate column (Reduce ke saath), Calculator ka likha New Rate
     nahi. Warna har baar dabane par pichhle Net Amount se hisaab hota aur amount
     ghat-ta chala jaata. */
  const totalBaseRate = useMemo(() => {
    return items?.reduce((total, item) => {
      const rate =
        payload?.RateOn?.value === "2"
          ? parseFloat(item?.SurgeonCharge ?? item?.surgeonCharge) || 0
          : parseFloat(item?.DocCharge ?? item?.docCharge) || 0;
      const reduce = parseFloat(item?.Reduce) || 0;
      return total + (reduce === 0 ? rate : (rate * reduce) / 100);
    }, 0);
  }, [items, payload?.RateOn?.value]);
  // const totalNewRate = useMemo(() => {
  //   return items?.reduce((total, item) => {
  //     const surgeonCharge = parseFloat(item.surgeonCharge) || 0;
  //     const reduce = parseFloat(item.Reduce) || 0;
  //     const newRate = surgeonCharge - surgeonCharge * (reduce / 100);
  //     return total + newRate;
  //   }, 0);
  // }, [items]);
  // const handleMainCalculateAmt = (modifiedObj) => {
  //   const totalDoctorChargePer = DocType?.filter(
  //     (item) => item.IsChecked === true
  //   ).reduce((sum, item) => sum + item.DoctorChargePer, 0);

  //   const surgeryRate = DocType?.filter((item) => item.IsChecked === true)?.map(
  //     (ele, index) =>
  //       (ele?.DoctorChargePer / totalDoctorChargePer) * totalNewRate
  //   );
  //   console.log("surgeryRate", surgeryRate);
  //   console.log(modifiedObj);

  //   if (modifiedObj?.IsChecked === true) {
  //     if (String(payload?.RateOn?.value) === "1") {
  //       modifiedObj.chargeAmt = Number(
  //         (Number(modifiedObj?.DoctorChargePer) / totalDoctorChargePer) *
  //           totalNewRate
  //       ).toFixed(ROUNDOFF_VALUE);

  //       modifiedObj.DiscountAmt = Number(
  //         modifiedObj.chargeAmt * Number(modifiedObj.DiscountPer) * 0.01
  //       ).toFixed(ROUNDOFF_VALUE);

  //       modifiedObj.DiscountPer = Number(
  //         Number(Number(modifiedObj?.DiscountAmt) * 100) /
  //           Number(modifiedObj.chargeAmt)
  //       ).toFixed(ROUNDOFF_VALUE);

  //       modifiedObj.NetAmt = Number(
  //         modifiedObj.chargeAmt - Number(modifiedObj?.DiscountAmt)
  //       ).toFixed(ROUNDOFF_VALUE);
  //     } else {
  //       const rate = Number(
  //         Number(totalNewRate) * Number(modifiedObj?.DoctorChargePer) * 0.01
  //       ).toFixed(ROUNDOFF_VALUE);
  //       modifiedObj.chargeAmt = Number(rate);

  //       modifiedObj.DiscountAmt = Number(
  //         rate * Number(modifiedObj.DiscountPer) * 0.01
  //       ).toFixed(ROUNDOFF_VALUE);

  //       modifiedObj.DiscountPer = Number(
  //         Number(Number(modifiedObj?.DiscountAmt) * 100) / Number(rate)
  //       ).toFixed(ROUNDOFF_VALUE);

  //       modifiedObj.NetAmt = Number(rate) - Number(modifiedObj?.DiscountAmt);
  //     }
  //   }
  //   return modifiedObj;
  // };

  // const CalculateAmt = () => {

  //   const totalDoctorChargePer = DocType?.filter(
  //     (item) => item.IsChecked === true
  //   ).reduce((sum, item) => sum + item.DoctorChargePer, 0);

  //   // const surgeryRate = DocType?.filter((item) => item.IsChecked === true)?.map(
  //   //   (ele, index) =>
  //   //     (ele?.DoctorChargePer / totalDoctorChargePer) * totalNewRate
  //   // );
  //   // console.log("surgeryRate", surgeryRate);

  //   if (DocType.some((ele, _) => ele?.IsChecked === true)) {
  //     console.log("cccccccccc", DocType);

  //     console.log(totalDoctorChargePer);

  //     if (
  //       String(payload?.RateOn?.value) === "1" &&
  //       DocType.filter((item, _) => item.IsChecked)?.reduce(
  //         (acc, current) => Number(acc) + Number(current?.DoctorChargePer),
  //         0
  //       ) > totalDoctorChargePer
  //     ) {
  //       notify("Your Charge Percentage is Higher Then 100%", "error");
  //       return;
  //     }
  //     const response = DocType.map((item, index) => {
  //       const obj = handleMainCalculateAmt(item);
  //       return obj;
  //     });

  //     setDocType(response);
  //   } else {
  //     notify("Please Select One Test", "error");
  //   }
  // };

  const toNumber = (val, defaultValue = 0) =>
    isNaN(Number(val)) ? defaultValue : Number(val);

  // const handleMainCalculateAmt = (modifiedObj) => {
  //   const totalDoctorChargePer = toNumber(
  //     DocType?.filter((item) => item.IsChecked)?.reduce(
  //       (sum, item) => sum + toNumber(item.DoctorChargePer),
  //       0
  //     ),
  //     1 // Prevent division by zero
  //   );

  //   const doctorChargePer = toNumber(modifiedObj?.DoctorChargePer);
  //   // const discountPer = toNumber(modifiedObj?.DiscountPer || 0);
  //   const discountPer = toNumber(
  //     modifiedObj?.DiscountPer == null || "NaN" ? 0 : modifiedObj?.DiscountPer
  //   );
  //   const totalRate = toNumber(totalNewRate);
  //   const rateOn = String(payload?.RateOn?.value);

  //   if (modifiedObj?.IsChecked) {
  //     if (rateOn === "1") {
  //       const chargeAmt = (doctorChargePer / totalDoctorChargePer) * totalRate;
  //       modifiedObj.chargeAmt = toNumber(chargeAmt).toFixed(ROUNDOFF_VALUE);

  //       modifiedObj.DiscountAmt = toNumber(
  //         modifiedObj.chargeAmt * discountPer * 0.01
  //       ).toFixed(ROUNDOFF_VALUE);

  //       modifiedObj.DiscountPer = totalRate
  //         ? (
  //             (toNumber(modifiedObj?.DiscountAmt || 0) * 100) /
  //             toNumber(modifiedObj.chargeAmt)
  //           ).toFixed(ROUNDOFF_VALUE)
  //         : "0";

  //       modifiedObj.NetAmt = (
  //         toNumber(modifiedObj.chargeAmt) - toNumber(modifiedObj?.DiscountAmt)
  //       ).toFixed(ROUNDOFF_VALUE);
  //     } else {
  //       const rate = (totalRate * doctorChargePer * 0.01).toFixed(
  //         ROUNDOFF_VALUE
  //       );
  //       modifiedObj.chargeAmt = toNumber(rate);

  //       modifiedObj.DiscountAmt = (toNumber(rate) * discountPer * 0.01).toFixed(
  //         ROUNDOFF_VALUE
  //       );

  //       modifiedObj.DiscountPer = rate
  //         ? (
  //             (toNumber(modifiedObj?.DiscountAmt || 0) * 100) /
  //             toNumber(rate)
  //           ).toFixed(ROUNDOFF_VALUE)
  //         : "0";

  //       modifiedObj.NetAmt = (
  //         toNumber(rate) - toNumber(modifiedObj?.DiscountAmt)
  //       ).toFixed(ROUNDOFF_VALUE);
  //     }
  //   }

  //   return modifiedObj;
  // };
const handleCalculateReduce = () => {
  if (!items?.length) {
    notify(t("Please Add Surgery First"), "warn");
    return;
  }

  // amount ke hisaab se descending sort
  const sorted = [...items].sort(
    (a, b) =>
      getItemAmount(b, payload?.RateOn?.value) -
      getItemAmount(a, payload?.RateOn?.value),
  );


  const updatedItems = sorted.map((item, index) => {
    const { NewRate, ...rest } = item;
    return {
      ...rest,
      Reduce: getDefaultReduce(index),
    };
  });

  setItems(updatedItems);
};
  
  const distributeNewRate = (itemsList, totalAmount) => {
    if (!itemsList?.length) return itemsList;

    const total = toNumber(totalAmount);
    const currentRates = itemsList.map((item) => getRowNewRate(item));
    const currentTotal = currentRates.reduce((sum, rate) => sum + rate, 0);

    let allocated = 0;
    return itemsList.map((item, index) => {
      const isLast = index === itemsList.length - 1;

      let share;
      if (isLast) {
        share = total - allocated;
      } else if (currentTotal > 0) {
        share = Number(
          ((total * currentRates[index]) / currentTotal).toFixed(ROUNDOFF_VALUE),
        );
      } else {
        share = Number((total / itemsList.length).toFixed(ROUNDOFF_VALUE));
      }

      allocated += share;
      return { ...item, NewRate: Number(share).toFixed(ROUNDOFF_VALUE) };
    });
  };

  const handleMainCalculateAmt = (item) => {
    if (!item?.IsChecked) return item;

    const calculateOn = String(payload?.CalculateOn?.value);
    const taxPer = toNumber(item?.SaleTaxPercentage || 0);

    /* Quantity surgery ke rate ka guna hai - 0.5 par aadha rate uthega, 1 par poora,
       2 par dugna. Khaali chhoda to 1 hi maana jaata hai.
       Amount mode me ye lagta nahi: wahan chargeAmt user ka apna bhara hua hai aur
       usi field me wapas likha jaata hai, to guna karne par Calculator har baar
       dabane par amount chadhta chala jaata. Isiliye Quantity wahan disabled bhi hai. */
    const rawQty = item?.Quantity;
    const quantity =
      rawQty === undefined || rawQty === null || rawQty === ""
        ? 1
        : toNumber(rawQty);

    let chargeAmt = 0;

    if (calculateOn === "1") {
      // AMOUNT MODE
      chargeAmt = toNumber(item?.chargeAmt);
    } else {
      //  PERCENT MODE
      if (payload?.RateOn?.value === "1") {
        
        const totalRate = toNumber(totalBaseRate);
        const doctorChargePer = toNumber(item?.DoctorChargePer);
        chargeAmt = ((totalRate * doctorChargePer) / 200) * quantity;
      } else {
        
        const totalRate = toNumber(totalBaseRate);
        const doctorChargePer = toNumber(item?.DoctorChargePer);
        chargeAmt = ((totalRate * doctorChargePer) / 100) * quantity;
      }
    }

    /* =========================
       STEP 2: Discount
       Discount Amount seedha type kiya ho (DiscountEditedField === "Amt") to
       wahi amount final maana jaata hai aur Discount % usi se ulta nikalta
       hai; warna pehle jaisa Discount % se Discount Amount banta hai.
       ========================= */
    let discountAmt;
    let discountPer;
    if (item?.DiscountEditedField === "Amt") {
      discountAmt = toNumber(item?.DiscountAmt || 0);
      discountPer = chargeAmt ? (discountAmt * 100) / chargeAmt : 0;
    } else {
      discountPer = toNumber(item?.DiscountPer || 0);
      discountAmt = (chargeAmt * discountPer) / 100;
    }

    /* =========================
       STEP 3: Net + Tax
       ========================= */
    const netBeforeTax = chargeAmt - discountAmt;
    const taxAmt = (netBeforeTax * taxPer) / 100;
    const finalNetAmt = netBeforeTax + taxAmt;

    /* =========================
       Assign values
       ========================= */
    item.chargeAmt = chargeAmt.toFixed(ROUNDOFF_VALUE);
    item.DiscountAmt = discountAmt.toFixed(ROUNDOFF_VALUE);
    item.DiscountPer = discountPer.toFixed(ROUNDOFF_VALUE);
    item.NetAmt = finalNetAmt.toFixed(ROUNDOFF_VALUE);

    return item;
  };

  const CalculateAmt = () => {
    
    const totalDoctorChargePer = toNumber(
      DocType?.filter((item) => item.IsChecked)?.reduce(
        (sum, item) => sum + toNumber(item.DoctorChargePer),
        0,
      ),
      0,
    );

    if (DocType?.some((ele) => ele?.IsChecked)) {
      if (
        String(payload?.RateOn?.value) === "1" &&
        toNumber(
          DocType.filter((item) => item.IsChecked)?.reduce(
            (acc, current) => acc + toNumber(current?.DoctorChargePer),
            0,
          ),
        ) > totalDoctorChargePer
      ) {
        notify(t("Your Charge Percentage is Higher Than 100%"), "error");
        return;
      }

      const response = DocType.map((item) =>
        handleMainCalculateAmt({ ...item }),
      );
      setDocType(response);

      /* The doctor rows are now priced, so their Net Amount total - the Total Amt box -
         is carried back onto the surgery rows as their New Rate. Pressing Calculator
         again therefore works off this figure, not the original rate. */
      const totalNetAmt = response
        ?.filter((ele) => ele?.IsChecked)
        ?.reduce((sum, ele) => sum + toNumber(ele?.NetAmt), 0);

      setItems((prev) => distributeNewRate(prev, totalNetAmt));
    } else {
      notify(t("Please Select One Test"), "error");
    }
  };

  const TotalNetAmount = DocType.filter((item, _) => item.IsChecked)?.reduce(
    (acc, current) => Number(acc) + Number(current?.NetAmt),
    0,
  );

  return (
    <>
      <div className="card mt-2">
        <Heading title={t("Item Detail")} />
        <div className="row p-2">
          <DatePicker
            className="custom-calendar"
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            id="date"
            name="date"
            value={payload?.date ? payload?.date : new Date()}
            handleChange={handleChange}
            lable={t("Date")}
            placeholder={VITE_DATE_FORMAT}
          />
          <ReactSelect
            placeholderName={t("Rate On")}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            id={"RateOn"}
            name={"RateOn"}
            value={payload?.RateOn?.value}
            removeIsClearable={true}
            handleChange={(name, e) =>
              handleReactSelect(
                name,
                e,
                getBindDocType(e?.value, items[0]?.Surgery_ID),
              )
            }
            dynamicOptions={translateOptions(RateOnOptions, t)}
          />
          <div className="col-sm-4">
            <SearchByName
              data={data}
              handleItemSelect={handleItemSelect}
              itemName={payload?.itemName}
              pateintDetails={pateintDetails}
            />

          </div>
          {/* <ReactSelect
            placeholderName={t("Type")}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            id={"Type"}
            name={"Type"}
            value={payload?.Type?.value}
            handleChange={handleReactSelect}
            dynamicOptions={RateType}
          /> */}
          <div className="col-sm-1">
            <div className="d-flex justify-content-between">
              <button className="btn btn-sm btn-success" onClick={getRate}>
                {t("Get Rate")}
              </button>
              <button className="btn btn-sm btn-success ml-2">
                {t("Reset")}
              </button>
            </div>
          </div>
        </div>
        <div className="row px-2 pb-2 mx-1">
          <SurgeryDepartmentDetailsTable
            THEAD={AddItemHead}
            tbody={items}
            handleIndexChange={handleIndexChange}
            handleDelete={onDelete}
            payload={payload}
            auth={auth}
          />
        </div>
        {items?.length > 0 && (
  <div className="row px-2">
    <div className="col-sm-12 d-flex justify-content-end">
      <button
        className="btn btn-sm btn-success mr-2"
        onClick={handleCalculateReduce}
      >
        {t("Calculate")}
      </button>
    </div>
  </div>
)}
        {items?.length > 0 && (
          <div className="row px-2">
            <div className="col-sm-12 d-flex justify-content-end">
              <b>{t("Total New Rate")}:</b>
              <b className="text-danger"> {totalNewRate}</b>
            </div>
          </div>
        )}
      </div>
      {items?.length > 0 && (
        <>
          <div className="card mt-2">
            <Heading title={t("Surgery Detail")} />
            <SurgeryDetailsTable
              THEAD={SurgeryHead}
              tbody={DocType}
              handleCustomSelect={handleCustomSelect}
              handleItemsChange={handleItemsChange}
              handleSelect={handleSelect}
              payload={payload}
            />
          </div>

          <div className="card mt-2">
            <div className="row px-2 py-2">
              <button
                className="btn btn-sm btn-success ml-2"
                onClick={CalculateAmt}
              >
                {t("Calculator")}
              </button>
              <ReactSelect
                placeholderName={t("Calculate On")}
                searchable={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                id={"CalculateOn"}
                name={"CalculateOn"}
                value={payload?.CalculateOn?.value}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(CalculateOption, t)}
              />
              {/* <Input
                type="text"
                className="form-control"
                id="SurgeryAmount"
                name="SurgeryAmount"
                value={payload?.SurgeryAmount}
                onChange={handleChange}
                lable={t("Surgery Amount")}
                placeholder=""
                respclass="col-xl-2 col-md-2 col-sm-6 col-12"
              /> */}
              {/* <Input
                type="number"
                className="form-control"
                id="SurgeonAmount"
                name="SurgeonAmount"
                value={
                  payload?.SurgeonAmount
                    ? payload?.SurgeonAmount
                    : totalNewRate.toFixed(2)
                }
                onChange={handleChange}
                lable={t("Surgeon Amount")}
                placeholder=""
                respclass="col-xl-2 col-md-2 col-sm-6 col-12"
              /> */}
              <Input
                type="number"
                className="form-control"
                id="TotalNetAmount"
                name="TotalNetAmount"
                lable={t("Total Amt.")}
                value={TotalNetAmount}
                placeholder=""
                respclass="col-xl-2 col-md-2 col-sm-6 col-12"
              />
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
                requiredClassName={"required-fields"}
              />

              <Input
                type="text"
                className="form-control"
                id="Remarks"
                name="Remarks"
                value={payload?.Remarks}
                onChange={handleChange}
                lable={t("Remarks")}
                placeholder=""
                respclass="col-xl-2 col-md-2 col-sm-6 col-12"
              />
              <div className="col-sm-1">
                <button
                  className="btn btn-sm btn-success"
                  onClick={handleSaveSurgery}
                >
                  {t("Save")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Surgery;
