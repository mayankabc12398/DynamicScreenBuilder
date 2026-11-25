import { useTranslation } from "react-i18next";
import Input from "../../../components/formComponent/Input";
import { useState } from "react";
import Heading from "../../../components/UI/Heading";
import DatePicker from "../../../components/formComponent/DatePicker";
import Tables from "../../../components/UI/customTable";
import moment from "moment";
import {
  EditMedicalCertificateApi,
  PrintMedicalCertificateApi,
  SearchMedicalCertificateApi,
  UpdateMedicalCertificateApi,
} from "../../../networkServices/DoctorApi";
import TextAreaInput from "../../../components/formComponent/TextAreaInput";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { notify } from "../../../utils/utils";

const MedicalCertificateSearch = () => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [searchPayload, setSearchPayload] = useState({
    mrNo: "",
    certID: "",
    ipNo: "",
    mobileNo: "",
    patientName: "",
    fromDate: new Date(),
    toDate: new Date(),
  });

  const initialPayload = {
    mrNo: "",
    pName: "",
    address: "",
    relationName: "",
    gender: "",
    age: "",
    diagnosis: "",
    fromDate: new Date(),
    toDate: new Date(),
    remarks: "",
    doctorName: "",
    dSignature: "",
    docDept: "",
    transactionID: "",
    certID: "",
  };

  const [payload, setPayload] = useState(initialPayload);
  const [tableData, setTableData] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const THEAD = [
    { name: t("Certificate NO."), width: "3%" },
    { name: t("PatientName") },
    { name: t("Mobile") },
    { name: t("UHID NO.") },
    { name: t("Address") },
    { name: t("Edit"), width: "5%" },
    { name: t("Print"), width: "5%" },
  ];

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchApi = async () => {
    try {
      const finalPayload = {
        mrNo: searchPayload?.mrNo || "",
        certID: searchPayload?.certID || "",
        ipNo: searchPayload?.ipNo || "",
        mobileNo: searchPayload?.mobileNo || "",
        patientName: searchPayload?.patientName || "",
        fromDate: moment(searchPayload?.fromDate).format("DD-MMM-YYYY"),
        toDate: moment(searchPayload?.toDate).format("DD-MMM-YYYY"),
      };

      const apiResp = await SearchMedicalCertificateApi(finalPayload);

      if (apiResp?.success) {
        setTableData(apiResp?.data || []);
      } else {
        setTableData([]);
        notify(apiResp?.message || "No records found", "error");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRowPrint = async (item) => {
    try {
      const response = await PrintMedicalCertificateApi(item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

 const handleSave = async () => {
  const savePayload = {
    id: payload?.certID || "",
    pName: payload?.pName || "",
    address: payload?.address || "",
    relationName: payload?.relationName || "",
    diagnosis: payload?.diagnosis || "",
    fromDate: payload?.fromDate
      ? moment(payload?.fromDate).format("DD-MM-YYYY")
      : "",
    toDate: payload?.toDate
      ? moment(payload?.toDate).format("DD-MM-YYYY")
      : "",
    remarks: payload?.remarks || "",
    doctorName: payload?.doctorName || "",
    dSignature: payload?.dSignature || "",
    docDept: payload?.docDept || "",
  };

  try {
    const apiResp = await UpdateMedicalCertificateApi(savePayload);
    if (apiResp?.success) {
      notify(apiResp?.message, "success");

    //   if (apiResp?.data?.pdfUrl) {
    //     RedirectURL(apiResp?.data?.pdfUrl);
    //   }
    if(apiResp?.data?.pdfURL) {
        RedirectURL(apiResp?.message, "success")
    }

      resetData();
    } else {
      notify(apiResp?.message, "error");
    }
  } catch (error) {
    console.error("Something Went Wrong:", error);
    notify(t("Something Went Wrong"), "error");
  }
};

  const handleEdit = async (item) => {
    try {
      const apiResp = await EditMedicalCertificateApi(item?.ID);

      if (apiResp?.success) {
        const data = apiResp?.data;

        setPayload({
          mrNo: data?.MRNO || "",
          pName: data?.PName || "",
          address: data?.Address || "",
          relationName: data?.RelationName || "",
          gender: data?.Gender || "",
          age: data?.Age || "",
          diagnosis: data?.Diagnosis || "",
          fromDate: data?.FDate ? moment(data.FDate).toDate() : new Date(),
          toDate: data?.TDate ? moment(data.TDate).toDate() : new Date(),
          remarks: data?.Remarks || "",
          doctorName: data?.DoctorName || "",
          dSignature: data?.DSignature || "",
          docDept: data?.docdept || "",
          transactionID: data?.TransactionID || "",
          certID: item?.ID || "",
        });

        setIsEditMode(true);
      } else {
        notify(apiResp?.message || "Data not found", "error");
      }
    } catch (error) {
      console.error("Edit error:", error);
      notify(t("Something Went Wrong"), "error");
    }
  };

  const resetData = () => {
    setPayload(initialPayload);
    setTableData([]);
    setIsEditMode(false);
  };

  return (
    <>
      <div className="patient_registration card">
        <Heading title={t("Manage_Debit_Credit_Note")} isBreadcrumb={true} />

        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            lable={t("UHID NO")}
            name="mrNo"
            id="mrNo"
            value={searchPayload?.mrNo}
            placeholder=""
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            onChange={handleSearchChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Certificate NO.")}
            name="certID"
            id="certID"
            value={searchPayload?.certID}
            placeholder=""
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            onChange={handleSearchChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Patient Name")}
            name="patientName"
            id="patientName"
            placeholder=""
            value={searchPayload?.patientName}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            onChange={handleSearchChange}
          />
          <Input
            type="number"
            className="form-control"
            name="mobileNo"
            id="mobileNo"
            lable={t("MobileNO")}
            value={searchPayload?.mobileNo}
            placeholder=""
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            onChange={handleSearchChange}
          />
          <DatePicker
            className="custom-calendar"
            id="fromDate"
            name="fromDate"
            handleChange={handleSearchChange}
            value={
              searchPayload.fromDate
                ? moment(searchPayload?.fromDate, "DD-MMM-YYYY").toDate()
                : searchPayload?.fromDate
            }
            lable={t("From Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <DatePicker
            className="custom-calendar"
            id="toDate"
            name="toDate"
            handleChange={handleSearchChange}
            value={
              searchPayload.toDate
                ? moment(searchPayload?.toDate, "DD-MMM-YYYY").toDate()
                : searchPayload?.toDate
            }
            lable={t("To Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
        </div>

        <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-primary" onClick={handleSearchApi}>
            {t("Search")}
          </button>
        </div>

        {tableData?.length > 0 && (
          <>
            <Heading title={t("Patient Details Found")} isBreadcrumb={false} />
            <Tables
              thead={THEAD}
              tbody={tableData.map((item, index) => ({
                "Certificate NO.": item?.ID || index + 1,
                PatientName: item?.PName || "",
                Mobile: item?.Mobile || "",
                "UHID NO.": item?.PatientID || "",
                Address: item?.Address || "",
                Edit: (
                  <i
                    className="fa fa-edit p-1"
                    onClick={() => handleEdit(item)}
                    style={{ cursor: "pointer", color: "blue" }}
                    title={t("Edit")}
                  />
                ),
                Print: (
                  <i
                    className="fa fa-print p-1"
                    onClick={() => handleRowPrint(item)}
                    style={{ cursor: "pointer", color: "green" }}
                    title={t("Print")}
                  />
                ),
              }))}
            />
          </>
        )}
        {isEditMode && (
          <div className="patient_registration card">
            <Heading title={t("Patient Details")} isBreadcrumb={false} />
            <div className="row p-2">
              <Input
                type="text"
                className="form-control"
                lable={t("Name")}
                name="pName"
                id="pName"
                value={payload?.pName}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                onChange={handleChange}
              />
              <Input 
                type="text"
                className="form-control"
                id="age"
                name="age"
                onChange={handleChange}
                value={payload?.age}
                lable={t("Age")}
                placeholder=""
                respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              />
              <Input
                type="text"
                className="form-control"
                lable={t("Gender")}
                name="gender"
                id="gender"
                value={payload?.gender}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                onChange={handleChange}
              />
              <div className="col-xl-2 col-md-3 col-sm-4 col-12">
                <TextAreaInput
                  type="text"
                  //   className="form-control"
                  lable={t("Address")}
                  name="address"
                  id="address"
                  value={payload?.address}
                  placeholder=""
                  onChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-3 col-sm-4 col-12">
                <TextAreaInput
                  type="text"
                //   className="form-control"
                  lable={t("Diagnosis")}
                  name="diagnosis"
                  id="diagnosis"
                  value={payload?.diagnosis}
                  placeholder=""
                  onChange={handleChange}
                />
              </div>
              <Input
                type="text"
                className="form-control"
                lable={t("Relationship")}
                name="relationName"
                id="relationName"
                value={payload?.relationName}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                onChange={handleChange}
              />
              <Input
                type="text"
                className="form-control"
                lable={t("UHID")}
                name="mrNo"
                id="mrNo"
                value={payload?.mrNo}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                onChange={handleChange}
              />
              <div className="col-xl-2 col-md-3 col-sm-4 col-12">
                <TextAreaInput
                  type="text"
                //   className="form-control"
                  lable={t("Remarks")}
                  name="remarks"
                  id="remarks"
                  value={payload?.remarks}
                  placeholder=""
                  onChange={handleChange}
                />
              </div>
              <DatePicker
                className="custom-calendar"
                id="fromDate"
                name="fromDate"
                handleChange={handleChange}
                value={payload?.fromDate || null}
                lable={t("From Date")}
                placeholder={VITE_DATE_FORMAT}
                respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              />
              <DatePicker
                className="custom-calendar"
                id="toDate"
                name="toDate"
                handleChange={handleChange}
                value={payload?.toDate || null}
                lable={t("To Date")}
                placeholder={VITE_DATE_FORMAT}
                respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              />
              <Input
                type="text"
                className="form-control"
                lable={t("Doctor")}
                name="doctorName"
                id="doctorName"
                value={payload?.doctorName}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                onChange={handleChange}
              />
              <Input
                type="text"
                className="form-control"
                lable={t("Signature")}
                name="dSignature"
                id="dSignature"
                value={payload?.dSignature}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                onChange={handleChange}
              />
              <Input
                type="text"
                className="form-control"
                lable={t("Department")}
                name="docDept"
                id="docDept"
                value={payload?.docDept}
                placeholder=""
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                onChange={handleChange}
              />
            </div>
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
              >
                {t("Save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MedicalCertificateSearch;
