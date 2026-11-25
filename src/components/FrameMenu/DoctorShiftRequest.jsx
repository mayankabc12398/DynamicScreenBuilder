import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import ReactSelect from "../formComponent/ReactSelect";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import DoctorShiftTable from "../UI/customTable/billings/DoctorShiftTable";
import { GetBindAllDoctorConfirmation } from "../../store/reducers/common/CommonExportFunction";
import { BindDocDetails } from "../../networkServices/BillingsApi";
import {
  CancelDoctorShift,
  GetDoctorShiftRequests,
  RejectDoctorShiftRequest,
  SaveDoctorShiftRequest,
} from "../../networkServices/DoctorShiftRequestApi";
import { notify } from "../../utils/utils";

/* Doctor Shift, approval mode (key DoctorShiftApprovalRequired = 1).

   Shown in place of DoctorShift: the ward picks the doctor and says WHY - the doctor
   does not change here. IPD > View IPD Patient > Approve DoctorShift Request turns the
   request into a shift. Same idea as Room Shift's approval mode (RoomShiftRequest). */
const DoctorShiftRequest = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const TransactionID = data?.transactionID ?? data?.TransactionID ?? "";

  const emptyPayload = {
    Doctor: "",
    label_Doctor: "",
    shiftDate: new Date(),
    shiftTime: new Date(),
    Remark: "",
  };
  const [payload, setPayload] = useState(emptyPayload);
  const [doctorHistory, setDoctorHistory] = useState([]);
  const [requestList, setRequestList] = useState([]);

  const { GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );

  const loadHistory = async () => {
    if (!TransactionID) return;
    try {
      const response = await BindDocDetails(TransactionID);
      setDoctorHistory(response?.data || []);
    } catch (error) {
      setDoctorHistory([]);
    }
  };

  const loadRequests = async () => {
    if (!TransactionID) return;
    const response = await GetDoctorShiftRequests(TransactionID, -1);
    setRequestList(response?.success ? response?.data || [] : []);
  };

  useEffect(() => {
    dispatch(GetBindAllDoctorConfirmation({ Department: "All" }));
    loadHistory();
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TransactionID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleDoctor = (name, value) => {
    setPayload((prev) => ({
      ...prev,
      Doctor: value?.value || "",
      label_Doctor: value?.label || "",
    }));
  };

  // One open request per patient.
  const hasPendingRequest = requestList?.some(
    (item) => item?.STATUS === "Pending",
  );

  const handleRequest = async () => {
    if (!payload.Doctor) {
      notify(t("Doctor is required"), "error");
      return;
    }
    if (String(payload.Doctor) === String(data?.doctorID ?? data?.DoctorID ?? "")) {
      notify(t("Doctor should not be Same"), "error");
      return;
    }
    if (!payload.Remark?.trim()) {
      notify(t("Remark Is Required"), "error");
      return;
    }
    if (hasPendingRequest) {
      notify(
        t("A doctor shift request for this patient is already awaiting approval."),
        "error",
      );
      return;
    }
    const response = await SaveDoctorShiftRequest({
      transactionID: Number(TransactionID || 0),
      requestDoctorID: String(payload.Doctor),
      requestDoctorName: payload.label_Doctor || "",
      requestDate: `${moment(payload.shiftDate).format("YYYY-MM-DD")} ${moment(
        payload.shiftTime,
      ).format("HH:mm:ss")}`,
      remark: payload.Remark.trim(),
    });
    if (response?.success) {
      notify(response?.message, "success");
      setPayload(emptyPayload);
      loadRequests();
    } else {
      notify(response?.message || t("Request not saved"), "error");
    }
  };

  // The ward can withdraw its own request while it is still pending.
  const handleWithdraw = async (item) => {
    const response = await RejectDoctorShiftRequest({
      id: Number(item?.ID || 0),
      transactionID: Number(TransactionID || 0),
      remark: "Withdrawn by ward",
    });
    if (response?.success) {
      notify(response?.message, "success");
      loadRequests();
    } else {
      notify(response?.message || t("Something went wrong"), "error");
    }
  };

  const statusColour = (status) => {
    if (status === "Approved") return "#ddffc3";
    if (status === "Reject") return "#f8d7da";
    return "";
  };

  const handleCancelShift = async (item) => {
    if (!window.confirm(t("Are you sure you want to cancel this doctor shift?"))) return;
    try {
      const response = await CancelDoctorShift({
        id: Number(item?.ID || 0),
        transactionID: Number(TransactionID || 0),
      });
      if (response?.success) {
        notify(response?.message, "success");
        loadHistory();
        loadRequests();
      } else {
        notify(response?.message || t("Something went wrong"), "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };

  const historyThead = [
    t("S.No."),
    t("Admitted Under"),
    t("Current Doctor"),
    t("Entry Date"),
    t("Leave Date"),
    t("User"),
    t("Status"),
  ];

  const requestThead = [
    { name: t("S.No."), width: "1%" },
    t("Request Date"),
    t("Previous Doctor"),
    t("Requested Doctor"),
    t("Remark"),
    t("Requested By"),
    t("Status"),
    t("Shifted To"),
    t("Approver Remark"),
    t("Action By"),
    { name: t("Reject"), width: "1%" },
  ];

  return (
    <>
      <div className="row m-2">
        <ReactSelect
          placeholderName={t("Select Doctor")}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          id="Doctor"
          name="Doctor"
          value={payload?.Doctor}
          removeIsClearable={true}
          handleChange={handleDoctor}
          dynamicOptions={(GetBindAllDoctorConfirmationData || []).map(
            (item) => ({ label: item?.Name, value: item?.DoctorID }),
          )}
          requiredClassName="required-fields"
        />
        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          id="shiftDate"
          name="shiftDate"
          value={payload?.shiftDate}
          handleChange={handleChange}
          label={t("Shift Date")}
          placeholder={VITE_DATE_FORMAT}
        />
        <TimePicker
          placeholderName={t("Shift Time")}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          id="shiftTime"
          name="shiftTime"
          value={payload?.shiftTime}
          handleChange={handleChange}
        />
        <Input
          className="form-control required-fields"
          lable={t("Remark")}
          placeholder=" "
          id="DoctorShiftRemark"
          name="Remark"
          value={payload?.Remark}
          onChange={handleChange}
          maxLength={500}
          respclass="col-xl-4 col-md-6 col-sm-8 col-12"
        />
        <div className="col-xl-2 col-md-3 col-sm-4 col-12">
          <button
            className="btn btn-sm btn-success"
            onClick={handleRequest}
            disabled={hasPendingRequest}
            title={
              hasPendingRequest
                ? t("A doctor shift request for this patient is already awaiting approval.")
                : ""
            }
          >
            {t("Request for Approval")}
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <DoctorShiftTable THEAD={historyThead} tbody={doctorHistory} onCancel={handleCancelShift} />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <Heading
            title={t("Doctor Shift Requests")}
            secondTitle={
              <>
                <ColorCodingSearch color={"#ffffff"} label={t("Pending")} />
                <ColorCodingSearch color={"#ddffc3"} label={t("Approved")} />
                <ColorCodingSearch color={"#f8d7da"} label={t("Reject")} />
              </>
            }
          />
          <Tables
            thead={requestThead}
            tbody={requestList?.map((item, index) => {
              const isReject = item?.STATUS === "Reject";
              const actionBy = isReject ? item?.RejectedBy : item?.ShiftedBy;
              const actionDate = isReject ? item?.RejectedDate : item?.ShiftedDate;
              return {
                SNo: index + 1,
                RequestDate: item?.RequestDate || "",
                PreviousDoctor: item?.PreviousDoctorName || "",
                RequestedDoctor: item?.RequestDoctorName || "",
                Remark: item?.Remark || "",
                RequestBy: item?.RequestBy || "",
                Status: item?.STATUS || "",
                ShiftedTo: item?.ApprovedDoctorName || "",
                ApproveRemark: isReject
                  ? item?.RejectReason || ""
                  : item?.ApproveRemark || "",
                ActionBy: actionBy ? (
                  <div>
                    {actionBy}
                    {actionDate ? (
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {actionDate}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  ""
                ),
                Reject:
                  item?.STATUS === "Pending" ? (
                    <i
                      className="fa fa-trash"
                      onClick={() => handleWithdraw(item)}
                      aria-hidden="true"
                      id="redDeleteColor"
                      title={t("Reject")}
                    ></i>
                  ) : (
                    ""
                  ),
                colorcode: statusColour(item?.STATUS),
              };
            })}
            style={{ maxHeight: "278px", overflow: "auto" }}
          />
        </div>
      </div>
    </>
  );
};

export default DoctorShiftRequest;
