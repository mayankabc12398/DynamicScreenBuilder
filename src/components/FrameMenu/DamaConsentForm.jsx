import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import LabeledInput from "../formComponent/LabeledInput";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Tables from "../UI/customTable";
import { notify } from "../../utils/ustil2";
import {
  getBindDetailsDamaConsentForm,
  handleSaveDamaConsentForm,
  handleUpdateDamaConsentForm,
  damaConsentFormPdfApi
} from "../../networkServices/Emergency";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { exportToExcel } from "../../utils/exportLibrary";
import { RedirectURL } from "../../networkServices/PDFURL";
const intialState = {
  Name: "",
  Witness: "",
  HealthWorker: "",
  Date: new Date(),
};
const DamaConsentForm = ({ data }) => {
  const PatientID = data?.PatientID || data?.patientID;
  const { t } = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [tableData, setTableData] = useState([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const [payload, setPayload] = useState({
    ...intialState,
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({ ...payload, [name]: value });
  };
  const thead = [
    { name: t("S.No."), width: "4%" },
    { width: "4%", name: t("Patient Name") },
    t("National No"),
    t("Witness"),
    t("Health Worker"),
    t("Entry By"),
    t("Entry Date"),
    t("Date"),
    t("Edit"),
  ];

  console.log(payload?.Date, "data");
  const handleSave = async () => {
    if (payload?.Name.trim() === "") {
      notify(t("Please Enter Name"), "error");
      return;
    }
    const requestBody = {
      id: isUpdate ? payload?.ID || 0 : 0,
      patientName: payload?.Name || "",
      nationalNo: data?.NationalNo || "",
      witness: payload?.Witness || "",
      healthWorker: payload?.HealthWorker || "",
      patientID: data?.patientID || "",
      transactionID: data?.TransactionID || data?.transactionID || "",
      ipAddress: ip || "",
      date: payload?.Date,
      enteredByName: data?.Name || "",
    };

    try {
      let response;
      if (isUpdate) {
        response = await handleUpdateDamaConsentForm(requestBody);
      } else {
        response = await handleSaveDamaConsentForm(requestBody);
      }

      if (response?.success) {
        getBindData();
        notify(response?.message, "success");
        setPayload(intialState);
        setIsUpdate(false);
      } else {
        notify(response?.message || "Something went wrong", "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("Server error"), "error");
    }
  };
  const getBindData = async () => {
    try {
      const response = await getBindDetailsDamaConsentForm(
        data?.patientID || 0
      );
      if (response?.success) {
        // notify(response?.message, "success");
        setTableData(response?.data);
      } else {
        notify(response?.message, "error");
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };
  const handleEdit = (index, ele) => {
    // debugger;
    setIsUpdate(true);
    setPayload({
      Name: ele?.PatientName || "",
      Witness: ele?.Witness || "",
      HealthWorker: ele?.HealthWorker || "",
      Date: parseApiDate(ele?.DATE),
      ID: ele?.ID,
    });
  };
  const handlePrint = async () => {
    const res = await damaConsentFormPdfApi(PatientID)
    if (res?.success) {
      RedirectURL(res?.data?.pdfUrl);
    } else {
      notify(res?.message, "error")
    }
    debugger
  }
  const handleExcelPrint = () => {
    const printUrl = `${import.meta.env.VITE_BASE_URL}/Emergency/DamaConsentFormExcel?patientID=${data?.patientID || 0}&transactionID=${data?.TransactionID || data?.transactionID || ""}`;
    window.open(printUrl, "_blank");
  };
  useEffect(() => {
    getBindData();
  }, []);
  return (
    <>
      <div className="card">
        <Heading title={t("Dama Consent Form")} />
        <div className="row p-2">
          <LabeledInput
            label={t("Patient Name")}
            value={data?.Name || ""}
            className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          />
          <LabeledInput
            label={t("Admission No")}
            value={"CHMEMG-25-13"}
            className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          />
        </div>
        <div className="row p-2">
          <span className="p-2 col-sm-1">I,</span>
          <Input
            type="text"
            className="form-control"
            lable={t("Name")}
            placeholder=""
            name="Name"
            id="Name"
            value={payload?.Name}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
            onChange={handleChange}
          />
          <p className="col-sm-9">
            the undersigned of this Consent, I declare my full responsibility
            for my decision of declare my full responsibility for my decision of
            going/taking patient home against medical advice.
          </p>
          <p className="col-sm-12 mt-3">
            I have been explained in details and I understood my medical
            condition and yet I'm insisting to go/take the patient home and
            accepting the full responsibility of whatever happens in the future
            after this decision. I have no right to complain against the
            hospital or the doctors for whatever complications that might
            develop as this was my personal decision.
          </p>
        </div>
        <div className="row p-2">
          {/* <LabeledInput
            label={t("Signature")}
            value={"....................."}
            className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          /> */}
          <label className="col-sm-3">{t("Signature:")}</label>
          <label className="col-sm-3">.................................</label>
          <label className="col-sm-3">{t("National No")}</label>
          <label className="col-sm-3">.................................</label>

          <label className="col-sm-3">{t("Witness:")}</label>
          <Input
            type="text"
            className="form-control"
            // lable={t("Witness")}
            placeholder=""
            name="Witness"
            id="Witness"
            value={payload?.Witness}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
            onChange={handleChange}
          />
          <label className="col-sm-3">{t("Signature:")}</label>
          <label className="col-sm-3">.................................</label>
          <label className="col-sm-3">{t("Health Worker:")}</label>
          <Input
            type="text"
            className="form-control"
            // lable={t("HealthWorker")}
            placeholder=""
            name="HealthWorker"
            id="HealthWorker"
            value={payload?.HealthWorker}
            respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
            onChange={handleChange}
          />
          <label className="col-sm-3">{t("Signature:")}</label>
          <label className="col-sm-3">.................................</label>
          <DatePicker
            className="custom-calendar"
            placeholder={VITE_DATE_FORMAT}
            lable={t("Date")}
            respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
            name="Date"
            id="Date"
            value={payload?.Date}
            showTime
            hourFormat="12"
            handleChange={handleChange}
          />
          <div className="col-sm-2">
            <button className="btn btn-sm btn-success" onClick={handleSave}>
              {isUpdate ? t("Update") : t("Save")}
            </button>
            <button
              className="btn btn-sm btn-success ml-2"
              // onClick={handleExcelPrint}
              onClick={() =>
                exportToExcel(
                  tableData,
                  "Dama Consent Form Detail",
                  `Patient Name: ${data?.Name || ""} | Admission No: CHMEMG-25-13`,
                  false,
                  `Dama_Consent_Form_Detail_${data?.Name || ""}`
                )
              }
            >
              {t("Print")}
            </button>
            <button
              className="btn btn-sm btn-success ml-2"
              // onClick={handleExcelPrint}
              onClick={handlePrint}
            >
              {t("Print PDF")}
            </button>
          </div>
        </div>
      </div>
      <Heading title={t("Dama Consent Form Detail")} />
      <div className="row p-2">
        <Tables
          thead={thead}
          tbody={tableData?.map((ele, index) => ({
            sr: index + 1,
            PatientName: ele?.PatientName,
            NationalNo: ele?.NationalNo,
            Witness: ele?.Witness,
            HealthWorker: ele?.HealthWorker,
            EntryBy: ele?.EntryBy,
            EntryDate: ele?.EntryDate,
            DATE: ele?.DATE,
            Edit: (
              <span onClick={() => handleEdit(index, ele)}>
                <i
                  className="fa fa-edit text-primary"
                  style={{ cursor: "pointer" }}
                />
              </span>
            ),
          }))}
        />
      </div>
    </>
  );
};

export default DamaConsentForm;
