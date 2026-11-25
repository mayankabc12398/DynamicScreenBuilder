import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import TimePicker from "../formComponent/TimePicker";
import DatePicker from "../formComponent/DatePicker";
import ReactSelect from "../formComponent/ReactSelect";
import { Convert_OPTION } from "../../utils/constant";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import {
  GetBindDataOfIVFConvertToPackage,
  handleSaveOrUpdateIVFConvertToPackage,
} from "../../networkServices/IVFCounsellingAPI";
import moment from "moment";
import { toast } from "react-toastify";
import { translateHead, translateOptions } from "@components/WrapTranslate";
const thead = [
  { name: "Sr.No", width: "3%" },
  "Counseler",
  "Convert By",
  "Request Date",
  "Request Time",
  "Converted",
];
const IVFConvertToPackage = ({ data }) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [tableData, setTableData] = useState([0]);
  const [payload, setPayload] = useState({
    RequestDate: new Date(),
    RequestTime: new Date(),
    Convert: "",
    CounselingRemark: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((val) => ({ ...val, [name]: value }));
  };
  const handleReactSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value,
    }));
  };
  console.log(data);
  const handleSearch = async () => {
    try {
      const response = await GetBindDataOfIVFConvertToPackage(
        data?.transactionID,
      );
      if (response?.success) {
        setTableData(response?.data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSave = async () => {
    if (!payload?.Convert) {
      toast(t("Convert is Required"), "danger");
      return;
    }
    const reqBody = {
      transactionID: data?.transactionID ?? "",
      patientID: String(data?.patientID) ?? "",
      requestDate: moment(payload?.RequestDate).format("YYYY/MM/DD") ?? "",
      requestTime: moment(payload?.RequestTime).format("hh:mm") ?? "",
      counselingRemark: String(payload?.CounselingRemark) ?? "",
      counseler: payload?.Convert ?? "",
      spouseID: String(data?.spouseid) ?? "",
      id: 0,
    };
    try {
      const response = await handleSaveOrUpdateIVFConvertToPackage(reqBody);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload({
          RequestDate: new Date(),
          RequestTime: new Date(),
          Convert: "",
          CounselingRemark: "",
        });
        handleSearch();
      } else {
        notify(response?.message, "danger");
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    handleSearch();
  }, []);
  return (
    <>
      <Heading title={t("Entry details")} />
      <div className="row p-2">
        <DatePicker
          className={`custom-calendar `}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id="RequestDate"
          name="RequestDate"
          inputClassName={"required-fields"}
          value={payload?.RequestDate ? payload?.RequestDate : ""}
          handleChange={handleChange}
          lable={t("Request Date")}
          placeholder={VITE_DATE_FORMAT}
          //   showTime
          hourFormat="12"
        />
        <TimePicker
          placeholderName={t("Request Time")}
          lable={t("Request Time")}
          id="RequestTime"
          name="RequestTime"
          value={payload?.RequestTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleChange}
        />
        <ReactSelect
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="Convert"
          name="Convert"
          value={payload?.Convert}
          placeholderName="Convert"
          handleChange={handleReactSelect}
          dynamicOptions={translateOptions(Convert_OPTION, t)}
        />
        <Input
          type="text"
          className="form-control"
          id="CounselingRemark"
          name="CounselingRemark"
          value={payload?.CounselingRemark}
          onChange={handleChange}
          lable={t("Counseling Remark")}
          placeholder=" "
          respclass="col-xl-5 col-md-3 col-sm-4 col-12"
          showTooltipCount={true}
        />
        <div className="col-sm-1">
          <button className="btn btn-lg btn-success" onClick={handleSave}>
            {t("Save")}
          </button>
        </div>
      </div>
      <Heading title={t("History")} />
      <div className="row">
        <div className="col-sm-12">
          <Tables
            thead={translateHead(thead, t)}
            tbody={tableData?.map((ele, index) => ({
              SrNo: index + 1,
              Counseler: ele?.CounselerName,
              CovertBy: ele?.RequestBy,
              RequestDate: ele?.RequestDate,
              RequestTime: ele?.RequestTime,
              converted: ele?.STATUS,
            }))}
          />
        </div>
      </div>
    </>
  );
};

export default IVFConvertToPackage;
