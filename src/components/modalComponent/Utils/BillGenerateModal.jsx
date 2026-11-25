import React, { useEffect, useState } from "react";
import TextAreaInput from "../../formComponent/TextAreaInput";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../formComponent/ReactSelect";
import { BILLINGSTYPE_OPTION } from "../../../utils/constant";
import LabeledInput from "../../formComponent/LabeledInput";
import { translateOptions } from "@components/WrapTranslate";
import { SaveCashPanelBillApprovalRequest, GetCashPanelApprovalStatus } from "../../../networkServices/BillingsApi";
import { notify } from "../../../utils/utils";

const BillGenerateModal = ({
  getPayloadData,
  currencyDetails,
  patientSearchDetails,
}) => {
  debugger
  const [t] = useTranslation();
  const initialValues = {
    Narration: "",
    BillingType: "",
    IsChecked: 0,
  };
  const OutStandingFlag = localStorage.getItem("ICPAARABG_V");

  const [payload, setPayload] = useState({ ...initialValues });
  const [approvalMessage, setApprovalMessage] = useState("");

  useEffect(() => {
    if (
      Number(OutStandingFlag) !== 1 ||
      Number(patientSearchDetails?.panelID) !== 1 ||
      !patientSearchDetails?.transactionID
    ) {
      return;
    }

    const fetchApprovalStatus = async () => {
      try {
        const response = await GetCashPanelApprovalStatus(
          patientSearchDetails.transactionID
        );

        if (response) {
          setApprovalMessage(
            response?.data?.approvalStatusName
          );
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchApprovalStatus();
  }, [
    OutStandingFlag,
    patientSearchDetails?.panelID,
    patientSearchDetails?.transactionID,
  ]);

  useEffect(() => {
    getPayloadData(payload);
  }, [payload]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPayload({
      ...payload,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };
  const handleReactSelect = async (name, value) => {
    setPayload((prevData) => ({
      ...prevData,
      [name]: value?.value,
    }));
  };

  const handleOutstandingApproval = async () => {
    try {
      const apiPayload = {
        patientID: patientSearchDetails?.patientID,
        transactionID: patientSearchDetails?.transactionID,
        ipdNo: patientSearchDetails?.ipdno,
        netAmount: Number(patientSearchDetails?.netAmount) || 0,
        paidAmount: Number(patientSearchDetails?.totalPaidAmount) || 0,
        outstandingAmount: Number(patientSearchDetails?.netBalanceAmount) || 0,
      };

      const response = await SaveCashPanelBillApprovalRequest(apiPayload);
      if (response?.success) {
        notify(response?.message, "success");
      } else {
        notify(response?.message || "Something went wrong", "error");
      }
    } catch (error) {
      console.error(error);
      notify("Failed to send outstanding approval request", "error");
    }
  };
  console.log(payload);
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-success text-white";
      case "pending":
        return "bg-warning text-dark";
      case "rejected":
        return "bg-danger text-white";
      case "in progress":
        return "bg-info text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  return (
    <>
      <div className="row">
        {approvalMessage && (
          <div className="col-12 mb-3">
            <div
              className={`p-3 rounded-5 text-center fw-bold ${getStatusClass(
                approvalMessage
              )}`}
            >
              <strong>Status: {approvalMessage}</strong>
            </div>
          </div>
        )}
        <ReactSelect
          placeholderName={"Billing Type"}
          id="BillingType"
          inputId="BillingType"
          name="BillingType"
          handleChange={handleReactSelect}
          value={payload?.BillingType}
          dynamicOptions={translateOptions(BILLINGSTYPE_OPTION, t)}
          searchable={true}
          respclass="col-xl-6 col-md-6 col-sm-4 col-12 my-3"
          requiredClassName={"required-fields "}
        />
        <div className="col-xl-6 col-md-6 col-sm-4 col-12 my-3">
          <TextAreaInput
            lable={t("Narration")}
            className="w-100 required-fields form-control"
            id="Narration"
            rows={2}
            name="Narration"
            maxLength={1000}
            onChange={handleChange}
          />
        </div>
        <div className="col-xl-4 col-md-4 col-sm-6 col-12">
          <LabeledInput
            label={t("Currency")}
            value={currencyDetails?.S_Currency}
          />
        </div>
        <div className="col-xl-4 col-md-4 col-sm-6 col-12">
          <LabeledInput
            label={t("Notation")}
            value={currencyDetails?.S_Notation}
          />
        </div>
        <div className="col-xl-4 col-md-4 col-sm-6 col-12">
          <LabeledInput
            label={t("Conversion Factor")}
            value={currencyDetails?.Selling_Specific}
          />
        </div>
        <div className="d-flex my-3 col-12">
          {Number(patientSearchDetails?.panelID) === 1 &&
            Number(OutStandingFlag) === 1 && (
              <div className="col-xl-6 col-md-6 col-sm-4 col-12">
                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    name="IsChecked"
                    id="outStandingApproval"
                    checked={payload?.IsChecked === 1}
                    onChange={handleChange}
                  />
                  <label
                    htmlFor="outStandingApproval"
                    className="mx-2"
                  >
                    {t("Outstanging Approval")}
                  </label>
                </div>
              </div>
            )}

          {Number(patientSearchDetails?.panelID) === 1 &&
            Number(OutStandingFlag) === 1 &&
            payload?.IsChecked === 1 && (
              <div className="col-xl-6 col-md-6 col-sm-4 col-12 text-right">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOutstandingApproval}
                >
                  {t("Send Request for Approval")}
                </button>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default BillGenerateModal;
