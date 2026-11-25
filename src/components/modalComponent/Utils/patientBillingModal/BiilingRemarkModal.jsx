import React, { useEffect, useState } from "react";
import TextAreaInput from "../../../formComponent/TextAreaInput";
import {
  BillingRemarkLoadRemarks,
  BillingRemarkSaveRemark,
} from "../../../../networkServices/BillingsApi";
import { notify } from "../../../../utils/utils";
import { useTranslation } from "react-i18next";
import Tables from "../../../UI/customTable";
import Heading from "../../../UI/Heading";

const BiilingRemarkModal = ({
  pateintDetails,
  handleModalState,
  GetBindBillDepartment,
  TransactionID,
}) => {

  const [t] = useTranslation();
  // The admission: passed in, or from the patient details (either spelling).
  const TID =
    TransactionID || pateintDetails?.TransactionID || pateintDetails?.transactionID;

  const [tableData, setTableData] = useState([]);


  const THEAD = [
    { name: t("S.No."), width: "1%" },
    { name: t("Entry Date") },
    { name: t("Remark") },
    { name: t("Entry By") },
  ]
  const [billingRemark, setBillingRemark] = useState("");

  const handleIndicator = (state) => {
    return (
      <div className="text-danger">
        {t("max 200 Charcter")}{" "}
        <span className="text-dark">{t("Remaining")} : </span>{" "}
        <span className="text-success">{Number(200 - state?.length)}</span>
      </div>
    );
  };

  const handleChange = (e) => {
    const { value } = e.target;
    if (value.length <= 200) setBillingRemark(value);
  };

  const handleBillingRemarkLoadRemarks = async (TransactionID) => {
    try {
      const response = await BillingRemarkLoadRemarks(TransactionID);
      if (response?.success) {
        setTableData(Array.isArray(response?.data) ? response.data : []);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleBillingRemarkSaveRemark = async () => {
    if (!billingRemark?.trim()) {
      notify(t("Please enter remark"), "warn");
      return;
    }
    try {
      const payload = {
        TransactionID: Number(TID) || 0,
        Remarks: billingRemark.trim(),
      }
      const response = await BillingRemarkSaveRemark(payload);

      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        // handleModalState(false, null, null, null, <></>);
        GetBindBillDepartment && GetBindBillDepartment();
        handleBillingRemarkLoadRemarks(TID);
        setBillingRemark("");
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  useEffect(() => {
    if (TID) handleBillingRemarkLoadRemarks(TID);
  }, [TID]);
  return (
    <>
      <div className="row">
        <TextAreaInput
          respclass={"col-12"}
          lable={t("Remark")}
          id={"Remark"}
          rows={3}
          value={billingRemark}
          onChange={(e) => handleChange(e)}
        />
        <div className="col-6">{handleIndicator(billingRemark)}</div>
      </div>
      <div className="d-flex align-items-center justify-content-end">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleBillingRemarkSaveRemark}
        >
          {t("Remark")}
        </button>
      </div>



      <div className="mt-2">
        <Heading title={t("Remark Result")} isBreadcrumb={false} />
        <Tables thead={THEAD} tbody={tableData?.map((val, index) => ({
          SNo: index + 1,
          Date: val?.date,
          Remark: val?.note,
          EntryBy: val?.user,
        }))} />
      </div>
    </>
  );
};

export default BiilingRemarkModal;
