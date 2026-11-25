import React, { useEffect, useState } from "react";
import Input from "../../../formComponent/Input";
import { reactSelectOptionList } from "../../../../utils/utils";
import { GetDiscReasonList } from "../../../../networkServices/opdserviceAPI";
import { ALLTABSAVE, AMOUNT_REGX } from "../../../../utils/constant";
import ReactSelect from "../../../formComponent/ReactSelect";
import { notify } from "../../../../utils/ustil2";
import { useTranslation } from "react-i18next";

const Discountchange = ({
  handlePatientBillingAllTabSave,
  data,
  /* Ticked line ka kul Gross - rupaye aur percentage ke beech badalne ka
     aadhaar. PatientBilling se aata hai. */
  selectedGross = 0,
}) => {
  const [t] = useTranslation();
  const [payload, setPayload] = useState({
    discount: 0,
    discountAmt: 0,
    DiscountReason: "",
  });

  const [discounts, setDiscounts] = useState({
    discountApprovalList: [],
    discountReasonList: [],
  });

  const gross = Number(selectedGross) || 0;

  /* Percentage aur rupaye - jo bhi bhara jaye, doosra usi se ban jaata hai.

     Server SIRF percentage leta hai (type "D" par wo har line par
     GrossAmount * DiscPer / 100 lagata hai), isliye rupaye yahin percentage
     me badal kar bheje jaate hain. Rupaye ka khaana sirf bharne ki suvidha
     hai - jama percentage hi hota hai.

     Dono khaane ek hi jagah se bharte hain, to screen par wo kabhi aapas me
     na milne wale aankde nahi dikha sakte. */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "discount") {
      if (!AMOUNT_REGX(3).test(value) || Number(value) > 100) return;

      setPayload({
        ...payload,
        discount: value,
        discountAmt:
          gross > 0 ? ((gross * Number(value)) / 100).toFixed(2) : 0,
      });
      return;
    }

    if (name === "discountAmt") {
      if (!AMOUNT_REGX(8).test(value)) return;

      /* Discount bill se bada nahi ho sakta. Bina rok ke percentage 100 se
         upar chala jaata, aur server use jaisa ka waisa laga deta. */
      if (gross > 0 && Number(value) > gross) {
        notify(
          `Discount Amount cannot exceed ${gross.toFixed(2)}`,
          "warn",
        );
        return;
      }

      setPayload({
        ...payload,
        discountAmt: value,
        discount:
          gross > 0 ? ((Number(value) * 100) / gross).toFixed(2) : 0,
      });
      return;
    }

    setPayload({ ...payload, [name]: value });
  };

  const handleReactChange = (name, e) => {
    setPayload({ ...payload, [name]: e?.value });
  };

  const GetDiscListAPI = async () => {
    try {
      const [discountReasonListRes] = await Promise.all([
        GetDiscReasonList("OPD"),
      ]);

      setDiscounts({
        ...discounts,

        discountReasonList: discountReasonListRes?.data,
      });
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleSave = () => {
    const obj = { ...ALLTABSAVE };
    if (!payload?.DiscountReason) {
      notify(t("Reason Field Is Required !!"), "error")
      return
    }
    /* Rupaye bhare gaye hon par koi line ticked na ho to aadhaar 0 hota hai
       aur percentage ban hi nahi sakta - aise me rokna hi theek hai, warna
       0% jaata aur user samajhta ki discount lag gaya. */
    if (Number(payload?.discountAmt) > 0 && gross <= 0) {
      notify("Please select the items first", "error");
      return;
    }

    obj.cancelReason = payload?.DiscountReason;
    obj.itemDiscPer = Number(payload?.discount);
    obj.type = "D";
    obj.TransactionID=data?.transactionID
    handlePatientBillingAllTabSave(obj);
  };

  useEffect(() => {
    GetDiscListAPI();
  }, []);
  return (
    <>
      <div className="row">
        <Input
          type={"text"}
          lable={"Discount(%)"}
          placeholder={""}
          respclass={"col-6"}
          className={"form-control required-fields"}
          name={"discount"}
          value={payload?.discount}
          onChange={handleChange}
        />

        <Input
          type={"text"}
          lable={"Discount Amt."}
          placeholder={""}
          respclass={"col-6"}
          className={"form-control"}
          name={"discountAmt"}
          value={payload?.discountAmt}
          onChange={handleChange}
        />

        {/* Aadhaar saamne rakha gaya hai - warna user ko pata hi nahi chalta
            ki rupaye kis cheez ka percentage ban rahe hain. */}
        <div className="col-12 mb-2" style={{ fontSize: 12, opacity: 0.75 }}>
          {gross > 0
            ? `Selected items gross: ${gross.toFixed(2)}`
            : "No item selected - tick the items first"}
        </div>
        <ReactSelect
          respclass={"col-12"}
          placeholderName={"Discount Reason"}
          requiredClassName={"required-fields"}
          value={payload?.DiscountReason}
          name={"DiscountReason"}
          dynamicOptions={reactSelectOptionList(
            discounts?.discountReasonList,
            "DiscountReason",
            "ID"
          )}
          handleChange={handleReactChange}
        />
      </div>

      <div className="d-flex align-items-center justify-content-end">
        <button className="btn btn-sm btn-primary" onClick={handleSave}>
          {t("Save")}
        </button>
      </div>
    </>
  );
};

export default Discountchange;
