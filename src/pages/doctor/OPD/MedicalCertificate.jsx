import { useTranslation } from "react-i18next";
import Input from "../../../components/formComponent/Input";
import { useState } from "react";
import Heading from "../../../components/UI/Heading";
import DatePicker from "../../../components/formComponent/DatePicker";
import Tables from "../../../components/UI/customTable";
import moment from "moment";
import TextAreaInput from "../../../components/formComponent/TextAreaInput";
import { notify } from "../../../utils/utils";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { ForMedicalCertificatePatientSearch, SaveMedicalCertificateApi } from "../../../networkServices/DoctorApi";

const MedicalCertificate = () => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [searchPayload, setSearchPayload] = useState({
    mrNo: "",
    ipdNo: "",
    patientName: "",
    mobileNo: "",
    isDateFilter: true,
    fromDate: new Date(),
    toDate: new Date(),
  });

  const [payload, setPayload] = useState({
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
  });

  const [tableData, setTableData] = useState([]);

  const THEAD = [
    { name: t("S.NO"), width: "5%" },
    { name: t("PatientName") },
    { name: t("Mobile") },
    { name: t("UHID NO."), width: "5%" },
    { name: t("Address") },
    { name: t("Select"), width: "5%"},
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
        ipdNo: searchPayload?.ipdNo || "",
        patientName: searchPayload?.patientName || "",
        mobileNo: searchPayload?.mobileNo || "",
        isDateFilter: searchPayload?.isDateFilter,
        fromDate: moment(searchPayload?.fromDate).format("DD-MMM-YYYY"),
        toDate: moment(searchPayload?.toDate).format("DD-MMM-YYYY"),
      };
      const apiResp = await ForMedicalCertificatePatientSearch(finalPayload);
      if (apiResp?.success) {
        const dataWithCheckbox = apiResp.data.map((item) => ({
          ...item,
          isChecked: false,
        }));
        setTableData(dataWithCheckbox);
      } else {
        // SRS-2026-0057 point 4. There was no else branch at all. The API returns
        // success:false for "Record Not Found", for a missing-criteria warning and
        // for a server exception - all three produced no message, and any previous
        // result set stayed on screen. The user could not tell "no match" from
        // "error" from "the button did nothing", which is why this reads as
        // "unable to search by any criteria".
        setTableData([]);
        notify(apiResp?.message || "No matching patient found.", "error");
      }
    } catch (error) {
      console.error(error);
      setTableData([]);
      notify(t("Could not run the search. Please try again."), "error");
    }
  };
  const handleSave = async () => {
    const savePayload = {
      mrNo: payload?.mrNo || "",
      pName: payload?.pName || "",
      address: payload?.address || "",
      relationName: payload?.relationName || "",
      gender: payload?.gender || "",
      age: payload?.age || "",
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
      transactionID: payload?.transactionID || "",
    };

    try {
      const apiResp = await SaveMedicalCertificateApi(savePayload);

      if (apiResp?.success) {
        notify(apiResp?.message, "success");

        resetData();

        if (apiResp?.data?.pdfUrl) {
          RedirectURL(apiResp?.data?.pdfUrl);
        }
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error("Something Went Wrong", error);
    }
  };
  const resetData = () => {
    setPayload({
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
    });
    setTableData((prev) =>
      prev.map((item) => ({
        ...item,
        isChecked: false,
      })),
    );
  };
  const handleCheckboxChange = (index) => {
    const selectedItem = tableData[index];

    const updated = tableData.map((item, i) => ({
      ...item,
      isChecked: i === index ? !item.isChecked : false,
    }));
    setTableData(updated);

    if (!selectedItem.isChecked) {
      setPayload({
        mrNo: selectedItem?.MRNO || "",
        pName: selectedItem?.NAME || "",
        address: selectedItem?.Address || "",
        gender: selectedItem?.Gender || "",
        age: selectedItem?.Age || "",
        doctorName: selectedItem?.doctorname || "",
        transactionID: selectedItem?.TransactionID || "",
        fromDate: selectedItem?.FromDate
          ? new Date(selectedItem.FromDate)
          : new Date(),
        toDate: new Date(),
        relationName: "",
        diagnosis: "",
        remarks: "",
        dSignature: "",
        docDept: "",
      });
    } else {
      resetData();
    }
  };

  return (
    <>
      <div className="patient_registration card">
        {/* SRS-2026-0057 point 4. The heading key was Manage_Debit_Credit_Note,
            left over from whichever screen this page was copied from. There is no
            MEDICALCERTIFICATE row in Country_langauge_master yet, so defaultValue
            carries the caption until one is added (captions are served from that
            table, not from src/locales - see the SRS-2026-0060 notes). */}
        <Heading
          title={t("MedicalCertificate", { defaultValue: "Medical Certificate" })}
          isBreadcrumb={true}
        />
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
            lable={t("IP NO")}
            name="ipdNo"
            id="ipdNo"
            value={searchPayload?.ipdNo}
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
            // value={payload?.fromDate || null}
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
                "S.NO": index + 1,
                PatientName: item?.NAME || "",
                Mobile: item?.Mobile || "",
                "UHID NO.": item?.MRNO || "",
                Address: item?.Address || "",
                Select: (
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={() => handleCheckboxChange(index)}
                  />
                ),
              }))}
              tableHeight={"tableHeight"}
              style={{ height: "150px" }}
            />
          </>
        )}
        {tableData?.some((item) => item?.isChecked) && (
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
                className="form-control"
                id="age"
                name="age"
                handleChange={handleChange}
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
                  respclass="col-xl-2 col-md-4 col-sm-4 col-12"
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

export default MedicalCertificate;
