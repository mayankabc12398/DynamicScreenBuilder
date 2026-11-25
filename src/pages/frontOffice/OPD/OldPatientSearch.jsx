import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import DatePicker from "../../../components/formComponent/DatePicker";
import moment from "moment";
import { BloodBankEstablishedDonorView } from "../../../networkServices/blooadbankApi";
import Tables from "../../../components/UI/customTable";
import { notify } from "../../../utils/ustil2";
import { OtPatientSearch } from "../../../networkServices/Tools";

export default function OldPatientSearch({
  handleChangeModel,
  inputData,
  selectPatient
}) {
  const initialdata = {
    toDate: new Date(),
    fromDate: new Date(),
    DOB: "",
    UHID: "",
    FamilyNo: "",
    contactNo: "",
    LastName: "",
    FirstName: "",
    address: "",
  }
  const [bodyData, setBodyData] = useState([]);

  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const [values, setValues] = useState({ inputData, ...initialdata });

  useEffect(() => {
    handleChangeModel(values);
  }, [values]);

  const thead = [
    { width: "5%", name: t("SNo") },
    { width: "5%", name: t("Title") },
    { width: "15%", name: t("Name") },
    { width: "15%", name: t("DOB") },
    { width: "15%", name: t("Sex") },
    { width: "15%", name: t("Date") },
    { width: "15%", name: t("House_No") },
    { width: "10%", name: t("Contact_No") },
    { width: "10%", name: t("RelationName") },
    { width: "10%", name: t("Select") },
  ];

  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));

  };


  const handleSearch = async (inputData) => {

    const Payload =
{
  "patientID":String(inputData?.UHID ?? ""),
  "pName":  String(inputData?.name ?? ""),
  "lName": "",
  "contactNo":  String(inputData?.contactNo ?? ""),
  "address": String(inputData?.address ?? ""),
  "fromDate": moment(inputData?.fromDate).format("YYYY-MM-DD"),
  "toDate": moment(inputData?.toDate).format("YYYY-MM-DD"),
  "patientRegStatus": 0,
  "isCheck": "",
  "idProof": "",
  "membershipCardNo": "",
  "dob":inputData?.DOB ? moment(inputData?.DOB).format("YYYY-MM-DD") : "",
  "isDOBChecked": 0,
  "relation": "",
  "relationName": (inputData?.Relative?.value ?? ""),
  "ipdno": "",
  "panelID": "",
  "cardNo": "",
  "visitID": "",
  "emailID": ""
}

    try {
      const Response = await OtPatientSearch(Payload);
      // const Response = await BloodBankEstablishedDonorView(Payload);
      // const Response = await BloodBankBindQuestions(Payload);

      if (Response?.success) {
        setBodyData(Response?.data)
        // notify(Response?.message, "success");
        // setHandleModelData((val) => ({ ...val, isOpen: false }));
      } else {
        notify(Response?.message, "error");
      }
    } catch (error) {
      notify(t("Error saving reason"), "error");
    }
  };


  return (
    <>
      <div className="d-flex align-items-baseline w-100">

        <div className="row  p-2">
          {/* <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2"> */}
          <Input
            type="text"
            className="form-control"
            id="UHID"
            placeholder=" "
            name="UHID"
            value={values?.UHID || ""}
            onChange={handleChange}
            lable={t("UHID")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"

          />

          <Input
            type="text"
            placeholder=""
            className="form-control"
            id="FamilyNo"
            name="FamilyNo"
            value={values?.FamilyNo || ""}
            onChange={handleChange}
            lable={t("Family No.")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            type="text"
            placeholder=""
            className="form-control"
            id="FirstName"
            name="FirstName"
            value={values?.FirstName || ""}
            onChange={handleChange}
            lable={t("First Name")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            type="text"
            placeholder=""
            className="form-control"
            id="LastName"
            name="LastName"
            value={values?.LastName || ""}
            onChange={handleChange}
            lable={t("Last Name")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />



          <Input
            type="text"
            placeholder=""
            className="form-control"
            id="contactNo"
            name="contactNo"
            value={values?.contactNo || ""}
            onChange={handleChange}
            lable={t("Contact No.")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />



          <Input
            type="text"
            placeholder=""
            className="form-control"
            id="address"
            name="address"
            value={values?.address || ""}
            onChange={handleChange}
            lable={t("Address")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <DatePicker
            className="custom-calendar"
            id="fromDate"
            name="fromDate"
            handleChange={handleChange}
            value={
              values.fromDate
                ? moment(values?.fromDate, "DD-MMM-YYYY").toDate()
                : values?.fromDate
            }
            lable={t("From Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
          />
          <DatePicker
            className="custom-calendar"
            id="toDate"
            name="toDate"
            handleChange={handleChange}
            value={
              values.toDate
                ? moment(values?.toDate, "DD-MMM-YYYY").toDate()
                : values?.toDate
            }
            lable={t("To Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
          />
          <div className="col-sm-2 col-xl-1">
            <button
              className="btn btn-sm btn-success"
              type="button"
              onClick={handleSearch}
            >
              {t("Search")}
            </button>
          </div>
        </div>
      </div>
      <Tables
        thead={thead}
        tbody={bodyData?.map((val, index) => ({
          sno: index + 1,
          Title: val.Title,
          PName: `${val.PName}`,
          DOB: val.DOB || "",
          sexGroup: val.Gender || "",
          Date: val.Date || "",
          House_No: val?.House_No || "",
          ContactNo: val.ContactNo || "",
          Relation: val.Relation || "",
          status:
            <button
              onClick={() => {
                selectPatient(val);
              }}
              className="btn btn-sm btn-success"
            >{t("Select")}</button>
        }))}
      />

    </>
  );
}
