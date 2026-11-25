import React, { useState, useEffect } from "react";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import { useTranslation } from "react-i18next";
import { notify } from "../../utils/utils";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import {
  GetBindDataOfIVFVisitStartClose,
  handleSaveIVFVisitStartClose,
  handleUpdateIVFVisitStartClose,
} from "../../networkServices/IVFCounsellingAPI";
import moment from "moment";
import TimePicker from "../formComponent/TimePicker";
import { translateHead } from "@components/WrapTranslate";

const thead = [
  { name: "S.No", width: "3%" },
  "Start Date",
  "Start Time",
  "Start Remarks",
  "Close Date",
  "Close Time",
  "Close Remarks",
  "Edit",
  "PServiceBill",
  "IVF Summary",
];

const IVFVisitStartandCloseStatus = ({ data }) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const [payload, setPayload] = useState({
    visitID: "",
    StartDate: new Date(),
    StartTime: new Date(),
    StartRemarks: "",
    CloseDate: new Date(),
    CloseTime: new Date(),
    CloseRemarks: "",
  });

  useEffect(() => {
    handleSearch();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((val) => ({
      ...val,
      [name]: value,
    }));
  };

  const handleSearch = async () => {
    try {
      const response = await GetBindDataOfIVFVisitStartClose(
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
    if (!payload?.StartDate) {
      notify(t("Start Date Time is Required"), "danger");
      return;
    }
    const updateReqbody = {
      dischargeDate: moment(payload?.CloseDate).format("YYYY-MM-DD"),
      dischargeTime: moment(payload?.CloseTime).format("HH:mm"),
      dischargeRemarks: payload?.CloseRemarks || "",
      ivfid: payload?.visitID,
      admitDate: moment(payload?.StartDate).format("YYYY-MM-DD"),
      admitTime: moment(payload?.StartTime).format("HH:mm"),
      admitRemarks: payload?.StartRemarks || "",
      newRoomid: "",
      oldRoomid: data?.roomID ?? "",
      roomName: data?.roomName ?? "",
    };
    const reqBody = {
      admitDate: moment(payload?.StartDate).format("YYYY-MM-DD"),
      admitTime: moment(payload?.StartTime).format("HH:mm"),
      admitRemarks: payload?.StartRemarks,
      tid: data?.transactionID,
      pid: data?.patientID,
      roomName: data?.RoomName ?? "",
      roomID: data?.RoomID ?? "",
    };
    const url = isEdit
      ? handleUpdateIVFVisitStartClose
      : handleSaveIVFVisitStartClose;

    try {
      const response = await url(isEdit ? updateReqbody : reqBody);

      if (response?.success) {
        notify(response?.message, "success");
        setPayload({
          visitID: "",
          StartDate: new Date(),
          CloseDate: new Date(),
          StartTime: new Date(),
          CloseTime: new Date(),
          StartRemarks: "",
          CloseRemarks: "",
        });

        setIsEdit(false);

        handleSearch();
      } else {
        notify(response?.message, "warn");
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log(payload);
  const handleEdit = (ele) => {
    setPayload({
      visitID: ele?.id,
      StartDate: ele?.Admit_date ? new Date(ele?.Admit_date) : new Date(),
      StartTime: ele?.AdmitTime
        ? moment(ele?.AdmitTime, "HH:mm:ss").toDate()
        : new Date(),
      StartRemarks: ele?.Admit_Remarks || "",
      RoomName: ele?.RoomName,
      RoomID: ele?.RoomID,
      CloseDate: ele?.Discharge_date
        ? new Date(ele?.Discharge_date)
        : new Date(),
      CloseTime: ele?.DischargeTime
        ? moment(ele?.DischargeTime, "HH:mm:ss").toDate()
        : new Date(),
      CloseRemarks: ele?.Discharge_Remarks || "",
    });

    setIsEdit(true);
  };
  return (
    <>
      <Heading title={t("Start Details")} />

      <div className="row p-2">
        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id="StartDate"
          name="StartDate"
          inputClassName={"required-fields"}
          value={payload?.StartDate}
          handleChange={handleChange}
          lable={t("Start Date")}
          placeholder={VITE_DATE_FORMAT}
          //   showTime
          hourFormat="12"
        />
        <TimePicker
          placeholderName={t("Start Time")}
          lable={t("Start Time")}
          id="StartTime"
          name="StartTime"
          value={payload?.StartTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="StartRemarks"
          name="StartRemarks"
          value={payload?.StartRemarks}
          onChange={handleChange}
          lable={t("Start Remarks")}
          placeholder=" "
          respclass="col-xl-5 col-md-3 col-sm-4 col-12"
          showTooltipCount={true}
        />
        {!isEdit && (
          <div className="col-sm-1">
            <button className="btn btn-lg btn-success" onClick={handleSave}>
              {t("Save")}
            </button>
          </div>
        )}
      </div>
      {isEdit && (
        <div className="row p-2">
          <DatePicker
            className="custom-calendar"
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            id="CloseDate"
            name="CloseDate"
            inputClassName={"required-fields"}
            value={payload?.CloseDate}
            handleChange={handleChange}
            lable={t("Close Date")}
            placeholder={VITE_DATE_FORMAT}
            //   showTime
            hourFormat="12"
          />
          <TimePicker
            placeholderName={t("Close Time")}
            lable={t("Close Time")}
            id="CloseTime"
            name="CloseTime"
            value={payload?.CloseTime}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            handleChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="CloseRemarks"
            name="CloseRemarks"
            value={payload?.CloseRemarks}
            onChange={handleChange}
            lable={t("Close Remarks")}
            placeholder=" "
            respclass="col-xl-5 col-md-3 col-sm-4 col-12"
            showTooltipCount={true}
          />

          <div className="col-sm-1">
            <button className="btn btn-lg btn-success" onClick={handleSave}>
              {t("Update")}
            </button>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-sm-12">
          <Heading title={t("History")} />

          <Tables
            thead={translateHead(thead, t)}
            tbody={tableData?.map((ele, index) => ({
              SrNo: index + 1,
              StartDate: ele?.Admit_date,
              StartTime: ele?.AdmitTime,
              StartRemarks: ele?.Admit_Remarks,
              CloseDate: ele?.Discharge_date,
              CloseTime: ele?.DischargeTime,
              CloseRemarks: ele?.Discharge_Remarks,

              Edit: (
                <i
                  className="fa fa-edit"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(ele)}
                ></i>
              ),

              PServiceBill: (
                <i className="fa fa-print" style={{ cursor: "pointer" }}></i>
              ),

              IVFSummary: (
                <div>
                  <ReprintSVG />
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </>
  );
};

export default IVFVisitStartandCloseStatus;
