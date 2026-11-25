import React, { useState } from "react";
import Input from "../../formComponent/Input";
import { useTranslation } from "react-i18next";
import { PanelApprovalReject } from "../../../networkServices/BillingsApi";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import TextAreaInput from "../../formComponent/TextAreaInput";

const PanelApprovalRejectModal = ({ visible, tableData, BillDetails, setRejectVisible, GetPanelApprovalSearchAPI }) => {

  const [t] = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const [payload, setPayload] = useState({ CancelReason: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const handlePanelApprovalReject = async () => {
    if (!payload?.CancelReason) {
      notify(t("Please enter Cancel Reason"), "error");
      return
    }

    const payload1 = {
      id: tableData?.ID,
      transactionID: tableData?.TransactionID,
      panelApprovedAmt: tableData?.PanelApprovedAmt,
      cancelReason: payload?.CancelReason,
      ipAddress: ip,
      PanelID: BillDetails?.PanelID ? BillDetails?.PanelID : 0
    };

    try {
      let apiResp = await PanelApprovalReject(payload1);
      if (apiResp?.success) {
        notify(apiResp?.data);
        setRejectVisible(false)
        GetPanelApprovalSearchAPI();
      } else {
        notify(apiResp?.message, "error");
        notify([]);
      }

      if (apiResp?.status !== 200) {
        notify(apiResp?.data?.message, "error");
      }
    } catch (error) {
      notify(t("Error occurred while processing request"), "error");
    }
  };

  return (
    <>
      <TextAreaInput
        lable={t("Cancel Reason")}
        className="w-100 required-fields"
        id="CancelReason"
        rows={2}
        name="CancelReason"
        placeholder=""
        onChange={handleChange}
        maxLength={300}
      />


      <div style={{ textAlign: "end" }}>
        <button
          className="btn btn-sm btn-danger"
          // style={{ background: "red", color: "white", border: "none" }}
          onClick={handlePanelApprovalReject}
        >
          {t("Reject")}
        </button>
      </div>

    </>
  );
};
export default PanelApprovalRejectModal;
