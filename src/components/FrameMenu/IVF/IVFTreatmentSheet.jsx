import { useTranslation } from "react-i18next";
import Heading from "../../UI/Heading";
import Input from "../../formComponent/Input";
import DatePicker from "../../formComponent/DatePicker";
import TimePicker from "../../formComponent/TimePicker";
import Tables from "../../UI/customTable";
import { useEffect, useState } from "react";
import moment from "moment/moment";
import { notify } from "../../../utils/utils";
import {
  bindTreatmentSheetApi,
  print_TreatmentSheetApi,
  save_TreatmentSheetApi,
} from "../../../networkServices/IVFApi";
import TextAreaInput from "../../formComponent/TextAreaInput";
import { RedirectURL } from "../../../networkServices/PDFURL";

const IVFTreatmentSheet = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const { VITE_DATE_FORMAT } = import.meta.env;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const THEAD = [
    { name: t("SNo"), width: "1%" },
    { name: t("Date") },
    { name: t("Time") },
    { name: t("SeenBy") },
    { name: t("Finding") },
    { name: t("Treatment") },
    { name: t("Edit"), width: "2%" },
  ];
  const [payload, setPayload] = useState({
    transactionID: "",
    date: new Date(),
    time: "",
    seenby: "",
    finding: "",
    treatment: "",
    id: "",
  });
  const fetchData = async () => {
    try {
      const response = await bindTreatmentSheetApi(transactionID);
      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {}
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleSave = async () => {
    const apiPayload = {
      transactionID,
      date: payload?.date ? moment(payload.date).format("YYYY-MM-DD") : "",
      time: payload?.time ? moment(payload.time).format("hh-mm A") : "",
      seenby: payload?.seenby || "",
      finding: payload?.finding || "",
      treatment: payload?.treatment || "",
      id: payload?.id || 0,
    };

    try {
      const response = await save_TreatmentSheetApi(apiPayload);

      if (response?.success) {
        notify(response?.message, "success");
        fetchData();
        setIsEdit(false);
        resetForm();
      } else {
        notify(response?.message || "Something went wrong", "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("Server error. Please try again later."), "error");
    }
  };

  const resetForm = () => {
    setPayload({
      transactionID: "",
      date: new Date(),
      time: "",
      seenby: "",
      finding: "",
      treatment: "",
      id: "",
    });
  };
  const handleEdit = (row) => {
    setIsEdit(true);

    setPayload({
      transactionID: transactionID,
      date: row?.DATE ? moment(row.DATE, "DD-MMM-YYYY").toDate() : "",
      time: row?.TIME ? moment(row.TIME, "hh-mm A").toDate() : "",
      seenby: row?.SeenBy || "",
      finding: row?.Finding || "",
      treatment: row?.Treatment || "",
      id: row?.ID || 0,
    });
  };

  const handleRowPrint = async (item) => {
    try {
      const response = await print_TreatmentSheetApi(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Marital Details")} />
          <div className="row p-2">
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
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="time"
              name="time"
              handleChange={handleChange}
              value={payload?.time}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />

            <Input
              type="text"
              placeholder=""
              className="form-control"
              name="seenby"
              id="seenby"
              lable={t("Seen by")}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
              onChange={handleChange}
              value={payload?.seenby}
            />
            <TextAreaInput
              type="text"
              placeholder=""
              lable={t("Finding")}
              id="finding"
              name="finding"
              onChange={handleChange}
              value={payload?.finding}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <TextAreaInput
              type="text"
              placeholder=""
              lable={t("Treatment")}
              id="treatment"
              name="treatment"
              onChange={handleChange}
              value={payload?.treatment}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
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
              onClick={handleRowPrint}
            >
              {t("Print")}
            </button>
          </div>
        </div>
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <Heading title={t("History")} />
          <Tables
            thead={THEAD}
            tbody={tableData.map((data, index) => ({
              SNo: index + 1,
              Date: data?.DATE || "",
              Time: data?.TIME || "",
              SeenBy: data?.SeenBy || "",
              Finding: data?.Finding || "",
              Treatment: data?.Treatment || "",
              Edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => handleEdit(data)}
                  style={{ cursor: "pointer", color: "blue" }}
                  title={t("Edit")}
                />
              ),
            }))}
          />
        </>
      )}
    </>
  );
};

export default IVFTreatmentSheet;
