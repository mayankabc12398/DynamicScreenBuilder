import React, { useEffect, useTransition } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import moment from "moment";
import DatePicker from "../../../components/formComponent/DatePicker";
import TimePicker from "../../../components/formComponent/TimePicker";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import TextAreaInput from "../../../components/formComponent/TextAreaInput";
import Tables from "../../../components/UI/customTable";
import {
  GetBindCounselingDetails,
  handleSaveCounselingRequest,
} from "../../../networkServices/DoctorApi";
import { notify } from "../../../utils/ustil2";
import { useSelector } from "react-redux";
import { translateHead } from "@components/WrapTranslate";

const thead = [
  { name: "SrNo", width: "3%" },
  { name: "Counseler" },
  { name: "Counseler Remark" },
  { name: "RequestBy" },
  { name: "RequestDate" },
  { name: "RequestTime" },
  { name: "Status" },
  { name: "Edit", width: "3%" },
];
const IVFCounselingRequest = (data) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );
  const [isupdate, setIsUpdate] = React.useState(false);
  const [tableData, setTableData] = React.useState([]);
  const [payload, setPayload] = React.useState({
    RequestDate: new Date(),
    RequestTime: new Date(),
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };
  const handleSelect = (name, value) => {
    setPayload((prev) => ({ ...prev, [name]: value?.value }));
  };
  console.log("dataaaaaaaaaaaaaaa", data);
  const handleSave = async () => {
    if (!payload?.RequestDate) {
      notify(t("Please select request date"), "error");
      return;
    }
    if (!payload?.RequestTime) {
      notify(t("Please select request time"), "error");
      return;
    }
    if (!payload?.Counseling) {
      notify(t("Please select counseler"), "error");
      return;
    }
    const reqBody = {
      id: payload?.id ? payload?.id : 0,
      transactionID: String(data?.patientDetail?.TransactionID) || "",
      patientID: String(data?.patientDetail?.PatientID) || "",
      spouseID: "",
      requestDate: moment(payload?.RequestDate).format("YYYY-MM-DD"),
      requestTime: moment(payload?.RequestTime).format("HH:mm"),
      counselingRemark: payload?.CounselingRemaks || "",
      counseler: payload?.Counseling || "",
    };
    try {
      const response = await handleSaveCounselingRequest(reqBody);
      if (response?.success) {
        notify(
          response?.message || "Counseling request saved successfully",
          "success",
        );
        handleSearch();
        setIsUpdate(false);
        setPayload({
          RequestDate: new Date(),
          RequestTime: new Date(),
          Counseling: "",
          CounselingRemaks: "",
        });
      } else {
        notify(
          response?.message || "Failed to save counseling request",
          "error",
        );
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSearch = async () => {
    try {
      const response = await GetBindCounselingDetails(
        String(data?.patientDetail?.TransactionID),
      );
      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(t("Failed to fetch counseling history"), "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    handleSearch();
  }, []);
  const handleEdit = (ele) => {
    debugger
    setIsUpdate(true);
    setPayload({
      RequestDate: ele?.RequestDate ? moment(ele?.RequestDate).toDate() : "",
      RequestTime: ele?.RequestTime
        ? moment(ele?.RequestTime, "HH:mm").toDate()
        : "",
      Counseling: ele?.Counseler || "",
      CounselingRemaks: ele?.CounselerRemark || "",
      id: ele?.ID || "",
    });
  };
  return (
    <>
      <div className="card">
        <Heading title={t("Entry Details")} />
        <div className="row p-2">
          <DatePicker
            className="custom-calendar required-fields"
            id="RequestDate"
            name="RequestDate"
            value={moment(payload?.RequestDate).toDate()}
            handleChange={handleChange}
            lable={t("Request Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass={"col-xl-2 col-md-4 col-sm-6 col-12"}
            // className="required-fields"
          />
          <TimePicker
            placeholderName={t("Time")}
            lable={t("Request Time")}
            id="RequestTime"
            name="RequestTime"
            value={payload?.RequestTime}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleChange}
            className="required-fields"
          />
          <ReactSelect
            dynamicOptions={[
              ...GetBindAllDoctorConfirmationData.map((item) => {
                return {
                  label: item?.Name,
                  value: item?.DoctorID,
                };
              }),
            ]}
            name={"Counseling"}
            value={payload?.Counseling}
            handleChange={handleSelect}
            placeholderName={"Counseling"}
            requiredClassName="required-fields"
            id={"Counseling"}
            respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
          />
          <TextAreaInput
            type="text"
            className={`form-textarea `}
            id="CounselingRemaks"
            name="CounselingRemaks"
            rows={2}
            value={payload?.CounselingRemaks ? payload?.CounselingRemaks : ""}
            onChange={handleChange}
            lable={t("Counseling Remaks")}
            placeholder=" "
            respclass=" col-sm-5 col-12"
          />
          <div className="col-sm-1">
            <button className="btn btn-primary mt-4" onClick={handleSave}>
              {isupdate ? t("Update") : t("Save")}
            </button>
          </div>
        </div>
        <Heading title={t("History")} />
        <div className="row">
          <div className="col-12">
            <Tables
              thead={translateHead(thead, t)}
              tbody={tableData?.map((ele, index) => ({
                srNo: index + 1,
                Counseler: ele?.CounselerName || "-",
                CounselerRemark: ele?.CounselerRemark || "-",
                RequestBy: ele?.RequestBy || "-",
                RequestDate: ele?.RequestDate
                  ? moment(ele?.RequestDate).format(VITE_DATE_FORMAT)
                  : "-",
                RequestTime: ele?.RequestTime || "-",
                Status: ele?.STATUS || "-",
                Edit: (
                  <i
                    className="fa fa-edit"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleEdit(ele)}
                  />
                ),
              }))}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default IVFCounselingRequest;
