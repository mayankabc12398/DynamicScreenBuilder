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
  ApproveDoctorShiftRequest as ApproveDoctorShiftRequestApi,
  CancelDoctorShift,
  GetDoctorShiftRequests,
  RejectDoctorShiftRequest,
} from "../../networkServices/DoctorShiftRequestApi";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { notify } from "../../utils/utils";

/* IPD > View IPD Patient > Approve DoctorShift Request.
   Lists the doctor shift requests the ward raised for this admission. Picking a
   pending one fills the doctor; Approve & Shift shifts the doctor (same code as the
   direct Doctor Shift), Reject closes the request with a reason. With no request
   picked the user can shift the doctor directly (like Room Shift); the API records
   it as a "DIRECT SHIFT (NO REQUEST)" row. */
const STATUS_OPTIONS = [
  { label: "Pending", value: 0 },
  { label: "Approved", value: 1 },
  { label: "Reject", value: 2 },
  { label: "All", value: -1 },
];

const ApproveDoctorShiftRequest = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const ip = useLocalStorage("ip", "get");
  const { VITE_DATE_FORMAT } = import.meta.env;
  const TransactionID = data?.transactionID ?? data?.TransactionID ?? "";

  const emptyForm = {
    Doctor: "",
    label_Doctor: "",
    shiftDate: new Date(),
    shiftTime: new Date(),
    Remark: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(0);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [doctorHistory, setDoctorHistory] = useState([]);

  const { GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );
  const doctorOptions = (GetBindAllDoctorConfirmationData || []).map((item) => ({
    label: item?.Name,
    value: item?.DoctorID,
  }));

  const loadRequests = async (st = status) => {
    if (!TransactionID) return;
    const response = await GetDoctorShiftRequests(TransactionID, st);
    setRequests(response?.success ? response?.data || [] : []);
  };

  const loadHistory = async () => {
    if (!TransactionID) return;
    try {
      const response = await BindDocDetails(TransactionID);
      setDoctorHistory(response?.data || []);
    } catch (error) {
      setDoctorHistory([]);
    }
  };

  useEffect(() => {
    dispatch(GetBindAllDoctorConfirmation({ Department: "All" }));
    loadRequests(0);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TransactionID]);

  const handleSelect = (item) => {
    setSelected(item);
    const requestDate = item?.RequestDateValue
      ? moment(item.RequestDateValue, "YYYY-MM-DD HH:mm:ss").toDate()
      : new Date();
    setForm({
      Doctor: item?.RequestDoctorID || "",
      label_Doctor: item?.RequestDoctorName || "",
      shiftDate: requestDate,
      shiftTime: requestDate,
      Remark: "",
    });
  };

  const resetForm = () => {
    setSelected(null);
    setForm(emptyForm);
  };

  const currentDoctorID = String(data?.doctorID ?? data?.DoctorID ?? "");

  const handleApprove = async () => {
    if (!form.Doctor) {
      notify(t("Doctor is required"), "error");
      return;
    }
    if (!selected?.ID && String(form.Doctor) === currentDoctorID) {
      notify(t("Doctor should not be Same"), "error");
      return;
    }
    const response = await ApproveDoctorShiftRequestApi({
      // 0 = direct shift without a request
      id: Number(selected?.ID || 0),
      transactionID: Number(TransactionID || 0),
      doctorID: String(form.Doctor),
      doctorName: form.label_Doctor || "",
      shiftDate: moment(form.shiftDate).format("YYYY-MM-DD"),
      shiftTime: moment(form.shiftTime).format("YYYY-MM-DD HH:mm:ss"),
      ipAddress: ip || "",
      remark: form.Remark?.trim() || "",
    });
    if (response?.success) {
      notify(response?.message || t("Doctor Shifted Successfully"), "success");
      resetForm();
      loadRequests();
      loadHistory();
    } else {
      notify(response?.message || t("Doctor not shifted"), "error");
    }
  };

  const handleReject = async () => {
    if (!selected?.ID) {
      notify(t("Select a pending request first"), "error");
      return;
    }
    if (!form.Remark?.trim()) {
      notify(t("Enter the reject reason in Remark"), "error");
      return;
    }
    const response = await RejectDoctorShiftRequest({
      id: Number(selected.ID),
      transactionID: Number(TransactionID || 0),
      remark: form.Remark.trim(),
    });
    if (response?.success) {
      notify(response?.message, "success");
      resetForm();
      loadRequests();
    } else {
      notify(response?.message || t("Something went wrong"), "error");
    }
  };

  const statusColour = (st) => {
    if (st === "Approved") return "#ddffc3";
    if (st === "Reject") return "#f8d7da";
    return "";
  };

  const thead = [
    { name: t("Select"), width: "1%" },
    t("Request Date"),
    t("Previous Doctor"),
    t("Requested Doctor"),
    t("Remark"),
    t("Requested By"),
    t("Status"),
    t("Shifted To"),
    t("Approver Remark"),
    t("Action By"),
  ];

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
    t("Requested By"),
    t("Approved By"),
    t("Status"),
  ];

  return (
    <div className="card">
      <Heading title={t("Approve Doctor Shift Request")} isBreadcrumb={false} />
      <div className="row m-2">
        <ReactSelect
          placeholderName={t("Status")}
          id="DoctorShiftReqStatus"
          name="status"
          value={status}
          removeIsClearable={true}
          dynamicOptions={STATUS_OPTIONS}
          handleChange={(name, e) => {
            const st = Number(e?.value ?? 0);
            setStatus(st);
            resetForm();
            loadRequests(st);
          }}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        />
        <ReactSelect
          placeholderName={t("Doctor")}
          searchable={true}
          id="ApproveDoctor"
          name="Doctor"
          value={form.Doctor}
          removeIsClearable={true}
          handleChange={(name, e) =>
            setForm((prev) => ({
              ...prev,
              Doctor: e?.value || "",
              label_Doctor: e?.label || "",
            }))
          }
          dynamicOptions={doctorOptions}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          requiredClassName="required-fields"
        />
        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="ApproveShiftDate"
          name="shiftDate"
          value={form.shiftDate}
          handleChange={(e) =>
            setForm((prev) => ({ ...prev, shiftDate: e.target.value }))
          }
          label={t("Shift Date")}
          placeholder={VITE_DATE_FORMAT}
        />
        <TimePicker
          placeholderName={t("Shift Time")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="ApproveShiftTime"
          name="shiftTime"
          value={form.shiftTime}
          handleChange={(e) =>
            setForm((prev) => ({ ...prev, shiftTime: e.target.value }))
          }
        />
        <Input
          className="form-control"
          lable={t("Remark")}
          placeholder=" "
          id="ApproveDoctorShiftRemark"
          name="Remark"
          value={form.Remark}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, Remark: e.target.value }))
          }
          maxLength={500}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        />
        <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex" style={{ gap: "6px" }}>
          <button
            className="btn btn-sm btn-success"
            onClick={handleApprove}
            disabled={!form.Doctor}
            title={selected ? "" : t("No request selected: shift the doctor directly")}
          >
            {selected ? t("Approve & Shift") : t("Shift")}
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={handleReject}
            disabled={!selected}
          >
            {t("Reject")}
          </button>
        </div>
      </div>

      <Heading
        title={t("Doctor Shift Requests")}
        isBreadcrumb={false}
        secondTitle={
          <>
            <ColorCodingSearch color={"#ffffff"} label={t("Pending")} />
            <ColorCodingSearch color={"#ddffc3"} label={t("Approved")} />
            <ColorCodingSearch color={"#f8d7da"} label={t("Reject")} />
          </>
        }
      />
      {requests.length > 0 ? (
        <Tables
          thead={thead}
          tbody={requests.map((item) => {
            const isReject = item?.STATUS === "Reject";
            const actionBy = isReject ? item?.RejectedBy : item?.ShiftedBy;
            const actionDate = isReject ? item?.RejectedDate : item?.ShiftedDate;
            return {
              Select:
                item?.STATUS === "Pending" ? (
                  <input
                    type="radio"
                    name="doctorShiftRequestSelect"
                    checked={Number(selected?.ID) === Number(item?.ID)}
                    onChange={() => handleSelect(item)}
                  />
                ) : (
                  ""
                ),
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
              ActionBy: actionBy ? `${actionBy}${actionDate ? ` / ${actionDate}` : ""}` : "",
              colorcode: statusColour(item?.STATUS),
            };
          })}
          style={{ maxHeight: "260px", overflow: "auto" }}
        />
      ) : (
        <div className="p-2 text-center">{t("No request found")}</div>
      )}

      <Heading title={t("Doctor History")} isBreadcrumb={false} />
      <DoctorShiftTable THEAD={historyThead} tbody={doctorHistory} showShiftBy onCancel={handleCancelShift} />
    </div>
  );
};

export default ApproveDoctorShiftRequest;
