import { useEffect, useState } from "react";
import DatePicker from "../../formComponent/DatePicker";
import TimePicker from "../../formComponent/TimePicker";
import Tables from "../../UI/customTable";
import Heading from "../../UI/Heading";
import { useTranslation } from "react-i18next";
import {
  bindOpuHistoryApi,
  printOPUFormApi,
  saveIvfOPUFormdetailsApi,
} from "../../../networkServices/IVFApi";
import { RedirectURL } from "../../../networkServices/PDFURL";
import moment from "moment/moment";
import { notify } from "../../../utils/utils";

const IVFOPUForm = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [payload, setPayload] = useState({
    hcgDate: new Date(),
    hcgTime: "",
    bloodTestDate: new Date(),
    bloodTestTime: new Date(),
    otherDate: new Date(),
    otherTime: new Date(),
    tid: "",
    pid: "",
    ivfid: "",
    id: "",
  });
  const THEAD = [
    { name: t("SNo"), width: "1%" },
    { name: t("IVFID") },
    { name: t("Hcg Date") },
    { name: t("Hcg Time") },
    { name: t("Blood Test Date") },
    { name: t("Blood Test Time") },
    { name: t("Other Date") },
    { name: t("Other Time") },
    { name: t("Enter By") },
    { name: t("Edit"), width: "2%" },
    { name: t("Print"), width: "2%" },
  ];
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const bindHistory = async () => {
    try {
      const res = await bindOpuHistoryApi(transactionID);

      if (res?.success) {
        setTableData(res?.data || []);
      } else {
        notify(res?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message, "error");
      console.error(error);
    }
  };

  useEffect(() => {
    bindHistory();
  }, []);

  const handleSave = async () => {
    try {
      const apiPayload = {
        hcgDate: payload?.hcgDate
          ? moment(payload.hcgDate).format("YYYY-MM-DD")
          : "",
        hcgTime: payload?.hcgTime
          ? moment(payload.hcgTime).format("HH:mm:ss")
          : "",
        bloodTestDate: payload?.bloodTestDate
          ? moment(payload.bloodTestDate).format("YYYY-MM-DD")
          : "",
        bloodTestTime: payload?.bloodTestTime
          ? moment(payload.bloodTestTime).format("HH:mm:ss")
          : "",
        otherDate: payload?.otherDate
          ? moment(payload.otherDate).format("YYYY-MM-DD")
          : "",
        otherTime: payload?.otherTime
          ? moment(payload.otherTime).format("HH:mm:ss")
          : "",
        tid: transactionID,
        pid: patientID,
        ivfid: payload?.ivfid || "",

        id: isEdit ? editId : "",
      };

      console.log("FINAL PAYLOAD", apiPayload);

      const res = await saveIvfOPUFormdetailsApi(apiPayload);

      if (res?.success) {
        notify(res?.message, "success");
        bindHistory();
        resetForm();
      } else {
        notify(res?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message || "Something went wrong", "error");
    }
  };

  const resetForm = () => {
    setPayload({
      hcgDate: "",
      hcgTime: "",
      bloodTestDate: "",
      bloodTestTime: "",
      otherDate: "",
      otherTime: "",
      tid: "",
      pid: "",
      ivfid: "",
    });
    setEditId(null);
    setIsEdit(false);
  };

  const handleRowPrint = async (item) => {
    try {
      const response = await printOPUFormApi({
        tid: transactionID,
        id: item?.ID,
        printType: "OPU",
      });

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message || "Print failed", "error");
      }
    } catch (error) {
      notify(
        error?.response?.data?.errors?.PrintType?.[0] ||
          error?.response?.data?.message ||
          "Print error",
        "error",
      );
    }
  };

  const handleEdit = (item) => {
    setPayload({
      hcgDate: item?.HcgDate ? new Date(item.HcgDate) : "",
      hcgTime: item?.HcgTime ? moment(item.HcgTime, "HH:mm:ss").toDate() : "",
      bloodTestDate: item?.BloodTestDate ? new Date(item.BloodTestDate) : "",
      bloodTestTime: item?.BloodTestTIME
        ? moment(item.BloodTestTIME, "HH:mm:ss").toDate()
        : "",
      otherDate: item?.OtherDate ? new Date(item.OtherDate) : "",
      otherTime: item?.OtherTIME
        ? moment(item.OtherTIME, "HH:mm:ss").toDate()
        : "",
      ivfid: item?.IVFID,
    });

    setEditId(item?.Id);
    setIsEdit(true);
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Details")} isBreadcrumb={false} />
          <div className="row p-2">
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("HCG Date")}
              name="hcgDate"
              id="hcgDate"
              value={payload?.hcgDate}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("HCG Time")}
              lable={t("HCG Time")}
              id="hcgTime"
              name="hcgTime"
              value={payload?.hcgTime}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("DBlood Test(BHCG) Date")}
              name="bloodTestDate"
              id="bloodTestDate"
              value={payload?.bloodTestDate}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Blood Test(BHCG)Time")}
              lable={t("Blood Test(BHCG)Time")}
              id="bloodTestTime"
              name="bloodTestTime"
              value={payload?.bloodTestTime}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Other Date")}
              name="otherDate"
              id="otherDate"
              value={payload?.otherDate}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Other Time")}
              lable={t("Other Time")}
              id="otherTime"
              name="otherTime"
              value={payload?.otherTime}
              handleChange={handleChange}
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
          </div>
        </div>
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("History Details")} />
          <Tables
            thead={THEAD}
            tbody={tableData.map((item, index) => ({
              SNo: index + 1,
              IVFID: item?.IVFID || "",
              "Hcg Date": item?.HcgDate || "",
              "Hcg Time": item?.HcgTime || "",
              "Blood Test Date": item?.BloodTestDate || "",
              "Blood Test Time": item?.BloodTestTIME || "",
              "Other Date": item?.OtherDate || "",
              "Other Time": item?.OtherTIME || "",
              "Enter By": item?.EmpName || "",
              Edit: (
                <i
                  className="fa fa-edit"
                  style={{ cursor: "pointer", color: "blue" }}
                  onClick={() => handleEdit(item)}
                />
              ),
              Print: (
                <i
                  className="fa fa-print"
                  style={{ cursor: "pointer", color: "green" }}
                  onClick={() => handleRowPrint(item)}
                />
              ),
            }))}
          />
        </>
      )}
    </>
  );
};
export default IVFOPUForm;
