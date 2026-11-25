import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import { useEffect, useState } from "react";
import {
  bindDetails_Previous_Infertility,
  bindDoctorApi,
  handlePrintPreviousInfertility,
  PrintblankPrint_Previous_Infertility,
  save_Previous_Infertility,
} from "../../networkServices/IVFApi";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import { RedirectURL } from "../../networkServices/PDFURL";

const PreviousInfertility = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { name: t("SNo") },
    { name: t("Procedure") },
    { name: t("Hospital Name") },
    { name: t("Date") },
    { name: t("Doctor's Name") },
    { name: t("Sub Proc.") },
    { name: t("City") },
    { name: t("Result") },
    { name: t("Remarks") },
    { name: t("Edit") },
    { name: t("Print") },
  ];

  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    ivfID: "",
    procedure: "",
    hospitalName: "",
    date: new Date(),
    doctorName: "",
    subProc: "",
    city: "",
    result: "",
    remarks: "",
    id: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const handleSelect = (name, value) => {
    setPayload((prev) => ({
      ...prev,
      [name]: value?.value || "",
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchData = async () => {
    try {
      const response = await bindDetails_Previous_Infertility(transactionID);
      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(response?.message, "error");
      console.error(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const hanldleprint = async () => {
    try {
      const response = await PrintblankPrint_Previous_Infertility(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await handlePrintPreviousInfertility(
        transactionID,
        item?.ID,
      );
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleSave = async () => {
    const finalPayload = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: payload?.ivfID || "",
      procedure: payload?.procedure || "",
      hospitalName: payload?.hospitalName || "",
      date: payload?.date ? moment(payload.date).format("YYYY-MM-DD") : "",
      doctorName: payload?.doctorName || "",
      subProc: payload?.subProc || "",
      city: payload?.city || "",
      result: payload?.result || "",
      remarks: payload?.remarks || "",
    };
    try {
      const response = await save_Previous_Infertility(finalPayload);
      if (response?.success) {
        notify(response?.message, "success");
        fetchData();
        resetForm();
        setIsEdit();
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      notify(response?.message, "error");
      console.error(error);
    }
  };
  const resetForm = () => {
    setPayload({
      transactionID: "",
      patientID: "",
      ivfID: "",
      procedure: "",
      hospitalName: "",
      date: "",
      doctorName: "",
      subProc: "",
      city: "",
      result: "",
      remarks: "",
      id: "",
    });
  };
  const getDoctorNameById = (doctorId) => {
    const doctor = doctorOptions.find(
      (doc) => String(doc.value) === String(doctorId),
    );
    return doctor ? doctor.label : doctorId;
  };

  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",
      patientID,
      transactionID,
      ivfID: item?.IVFID || "",
      procedure: item?.Procedures || "",
      hospitalName: item?.HospitalName || "",
      doctorName: item?.DoctorName || "",
      date: item?.Date ? moment(item.Date, "DD-MMM-YYYY").toDate() : "",
      subProc: item?.SubProc || "",
      city: item?.City || "",
      result: item?.Result || "",
      remarks: item?.Remarks || "",
    });

    setIsEdit(true);
  };
  const fetchDoctorList = async () => {
    try {
      const res = await bindDoctorApi();
      if (res?.success) {
        const options = res.data.map((item) => ({
          label: item?.DoctorName,
          value: item?.DoctorID,
        }));
        setDoctorOptions(options);
      } else {
        setDoctorOptions([]);
        notify(res?.message, "error");
      }
    } catch (error) {
      notify(t("Doctor list error"), "error");
    }
  };
  useEffect(() => {
    fetchDoctorList();
  }, []);
  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading
            title={t("Previous Infertility Previous History")}
            isBreadcrumb={false}
          />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Procedure")}
              id="procedure"
              name="procedure"
              value={payload?.procedure}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date")}
              name="date"
              id="date"
              value={payload?.date}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Hospital Name")}
              id="hospitalName"
              name="hospitalName"
              value={payload?.hospitalName}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Doctor's Name")}
              id="doctorName"
              name="doctorName"
              searchable={true}
              onChange={handleChange}
              value={payload?.doctorName}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={doctorOptions}
              handleChange={handleSelect}
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Sub Proc.")}
              id="subProc"
              name="subProc"
              value={payload?.subProc}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("City")}
              id="city"
              name="city"
              value={payload?.city}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Result")}
              id="result"
              name="result"
              value={payload?.result}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Remarks")}
              id="remarks"
              name="remarks"
              value={payload?.remarks}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>

          <div className="d-flex justify-content-end gap-2 p-2">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={handleSave}
            >
              {isEdit ? t("Update") : t("Save")}
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={hanldleprint}
            >
              {t("Print Blank")}
            </button>
          </div>
        </div>
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("History")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              Procedure: item?.Procedures,
              "Hospital Name": item?.HospitalName,
              Date: item?.Date,
              "Doctor's Name": getDoctorNameById(item?.DoctorName),
              "Sub Proc.": item?.SubProc,
              City: item?.City,
              Result: item?.Result,
              Remarks: item?.Remarks,
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
    </>
  );
};
export default PreviousInfertility;
