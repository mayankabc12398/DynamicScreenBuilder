import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Tables from "../../../components/UI/customTable";
import { SelectIconSVG } from "../../../components/SvgIcons";
import DatePicker from "../../../components/formComponent/DatePicker";
import LabeledInput from "../../../components/formComponent/LabeledInput";
import Input from "../../../components/formComponent/Input";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { GetPrescriptionPrintPdf } from "../../../networkServices/pharmacyRepeatApi";
import { RedirectURL } from "../../../networkServices/PDFURL";

/**
 * Pending Prescription list on the Pharmacy Issue screen.
 *
 * 2026-09-22: each prescription row has a Print icon. It fetches the doctor's lines for that
 * prescription (patient + date + doctor) with dose, timing, meal, duration, route and
 * remarks, and prints them in the same sheet layout as Reprint > Prescribe Medicine Bill,
 * with an optional hospital header - so the patient can buy the medicines outside when the
 * pharmacy cannot supply them. Selecting and adding a prescription is unchanged.
 */
export default function PrescriptionList({
  bodyData,
  getPatientIndentList,
  SelectPatientIndent,
  handleChange,
  values,
  PatientID,
  patientDetail,
}) {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { GetEmployeeWiseCenter } = useSelector((state) => state?.CommonSlice);
  const userData = useLocalStorage("userData", "get");
  const [withHeader, setWithHeader] = useState(true);
  const [printing, setPrinting] = useState(null);

  const thead = [
    { name: t("S.No."), width: "1%" },
    { name: t("Patient Id"), width: "1%" },
    { name: t("Patient Name"), width: "1%" },
    { name: t("Prescription On"), width: "1%" },
    { name: t("Prescription By"), width: "1%" },
    { name: t("No of Medicine"), width: "1%" },
    { name: t("Select"), width: "1%" },
    { name: t("Print"), width: "1%" },
  ];
  // The list is fetched by IndentReqModal when the popup opens and when a date changes.

  /* 25-10-2026: the sheet is printed by the API (Views/Pharmacy/PrescriptionSheet.cshtml) and opens as a PDF. */
  const printPrescription = async (row) => {
    const key = `${row?.patientID}|${row?.Date}|${row?.DoctorID}`;
    setPrinting(key);
    try {
      const pdfUrl = await GetPrescriptionPrintPdf({
        patientID: row?.patientID,
        date: row?.Date,
        doctorID: row?.DoctorID,
        transactionID: row?.TransactionID ?? row?.transactionID ?? row?.TransactionId ?? row?.TID ?? "",
        appID: row?.App_ID ?? row?.AppID ?? row?.appID ?? "",
        withHeader,
      });
      RedirectURL(pdfUrl);
    } catch (error) {
      notify(error?.message || t("Could not print the prescription"), "error");
    } finally {
      setPrinting(null);
    }
  };

  return (
    <>
      <div className="row pt-2 px-2">
        <div className="col-xl-2 col-md-4 col-sm-4 col-12">
          {/* <LabeledInput
                            label={t("UHID")}
                            value={PatientID}
                        /> */}
          <Input
            type="text"
            className="form-control required-fields"
            removeFormGroupClass={true}
            placeholder=""
            id="PatientID"
            lable={t("UHID")}
            name="PatientID"
            // value={SearchPatient?.patientDetail?.PName}
            value={values?.PatientID}
            onChange={handleChange}
          />
        </div>
        <DatePicker
          className="custom-calendar"
          id="date"
          name="FromDate"
          placeholder={VITE_DATE_FORMAT}
          value={values?.FromDate ? values?.FromDate : ""}
          lable={t("From Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          handleChange={handleChange}
        />
        <DatePicker
          className="custom-calendar"
          id="date"
          name="ToDate"
          placeholder={VITE_DATE_FORMAT}
          value={values?.ToDate ? values?.ToDate : ""}
          lable={t("To Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          handleChange={handleChange}
        />
        <div className="col-xl-1 col-md-2 col-sm-4  col-6">
          <button
            className="btn  btn-success px-3"
            type="button"
            onClick={getPatientIndentList}
          >
            {t("Search")}
          </button>
        </div>
        <div className="col-xl-3 col-md-4 col-sm-6 col-12 rx-prescbill__printopt">
          <label className="rx-prescbill__opt" title={t("Print the selected prescription with the hospital name and patient block on top")}>
            <input type="checkbox" checked={withHeader} onChange={(e) => setWithHeader(e.target.checked)} />
            {t("Hospital header on printed prescription")}
          </label>
        </div>
      </div>
      <Tables
        thead={thead}
        tbody={bodyData?.map((val, index) => ({
          sno: index + 1,
          patientID: val?.patientID,
          patientName: val?.PatientName,
          Date: val?.Date,
          DoctorID: val?.DName,
          NoOfMedicine: val?.NoOfMedicine,
          Select: (
            <span
              onClick={() => {
                SelectPatientIndent(val);
              }}
            >
              <SelectIconSVG />
            </span>
          ),
          Print: (
            <span
              className={`rx-prescbill__printbtn${printing === `${val?.patientID}|${val?.Date}|${val?.DoctorID}` ? " is-busy" : ""}`}
              title={t("Print this prescription for the patient")}
              onClick={() => printPrescription(val)}
            >
              <i className="fa fa-print" aria-hidden="true"></i>
            </span>
          ),
        }))}
        style={{ height: "20vh" }}
      />
    </>
  );
}
