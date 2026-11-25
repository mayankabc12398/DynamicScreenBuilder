import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import ReactSelect from "../formComponent/ReactSelect";
import TimePicker from "../formComponent/TimePicker";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import RoomShiftTable from "../UI/customTable/billings/RoomShiftTable";
import Heading from "../UI/Heading";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import { handleReactSelectDropDownOptions, notify } from "../../utils/utils";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import {
  BillingCategory,
  BindRoomBed,
  BindRoomDetails,
  RoomTypeWithoutRoleFilter,
} from "../../networkServices/BillingsApi";
import {
  NursingWardGetRoomShiftRequset,
  NursingWardRejectRoomShiftRequset,
  NursingWardSaveRoomShiftRequset,
} from "../../networkServices/nursingWardAPI";
import { CancelRoomShift } from "../../networkServices/DoctorShiftRequestApi";

/* Room Shift, approval mode.

   Shown in place of RoomShift when the RoomShiftApprovalRequired resource key is on. The ward
   states the bed it wants and WHY, and that is all it can do - the patient does not move and no
   room bill is raised here. IPD > Request Room Shift is where a request turns into a shift.

   The fields are deliberately the same ones, in the same order, as the direct Shift screen, so
   that a ward switched over to approval mode is not learning a new form. */
const RoomShiftRequest = ({ data }) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const userData = useLocalStorage("userData", "get");

  const TransactionID = data?.transactionID ?? data?.TransactionID ?? "";

  const [requestList, setRequestList] = useState([]);
  const [RoomDetail, setRoomDetail] = useState([]);

  // The bed the patient is in right now. Sent along so the request records where they came from,
  // and used to stop somebody requesting the bed they are already lying in.
  //
  // The frame does not always carry the room - the demographic panel above shows Room No blank
  // when it does not, and a request saved from that state has an empty Previous Room. The
  // occupancy grid always knows, because the IN row IS the current bed, so fall back to it.
  const currentOccupancy = RoomDetail?.find((item) => item?.Status === "IN");
  const currentRoomID = data?.roomId || data?.RoomID || currentOccupancy?.RoomID || "";
  const currentRoomName =
    data?.roomName || data?.RoomName || currentOccupancy?.Room || "";
  const [errors, setErrors] = useState({});
  const [DropDownState, setDropDownState] = useState({
    getRoomType: [],
    getBindRoomBed: [],
    getBillingCategory: [],
  });

  const emptyPayload = {
    IPDCaseTypeID: "",
    RoomBed: "",
    BillingCategory: "",
    Remark: "",
    shiftDate: new Date(),
    shiftTime: new Date(),
  };

  const [payload, setPayload] = useState(emptyPayload);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleReactSelect = async (name, value, secondName) => {
    const obj = { ...payload };
    obj[name] = value?.value || "";
    // The room type row carries its own billing category, same as the direct shift screen.
    if (secondName) obj[secondName] = value?.BillingCategoryID || "";

    if (name === "IPDCaseTypeID") {
      // The old bed belongs to the old ward. Leaving it selected lets a request go out for a
      // bed in a ward nobody asked for.
      obj.RoomBed = "";
      const response = await getBindRoom({ caseType: value?.value });
      setDropDownState((prevState) => ({
        ...prevState,
        getBindRoomBed: response || [],
      }));
    }

    setPayload(obj);
  };

  const getBindRoomType = async () => {
    try {
      const response = await RoomTypeWithoutRoleFilter();
      return response?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getBindRoom = async (params) => {
    const newPayload = {
      caseType: String(params?.caseType ?? ""),
      isDisIntimated: 0,
      type: "1",
      bookingDate: "",
    };

    try {
      const dataRes = await BindRoomBed(newPayload);
      return dataRes?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getBindBillingCategory = async () => {
    try {
      const response = await BillingCategory();
      return response?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const FetchAllDropDown = async () => {
    try {
      const response = await Promise.all([
        getBindRoomType(),
        getBindBillingCategory(),
      ]);

      setDropDownState((prevState) => ({
        ...prevState,
        getRoomType: handleReactSelectDropDownOptions(
          response[0],
          "Name",
          "IPDCaseTypeID",
        ),
        getBillingCategory: handleReactSelectDropDownOptions(
          response[1],
          "Name",
          "IPDCaseTypeID",
        ),
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // The same room-occupancy history the direct Shift screen shows under Item Details. Approval
  // mode replaced that screen, and losing this grid with it left the ward asking for a move with
  // no view of where the patient has already been.
  const getRoomDetails = async () => {
    if (!TransactionID) return;
    try {
      const response = await BindRoomDetails(TransactionID);
      setRoomDetail(response?.data || []);
    } catch (error) {
      console.error(error);
      setRoomDetail([]);
    }
  };

  const getRequestList = async () => {
    if (!TransactionID) return;
    try {
      const response = await NursingWardGetRoomShiftRequset(TransactionID);
      setRequestList(response?.success ? response?.data || [] : []);
    } catch (error) {
      console.error(error);
      setRequestList([]);
    }
  };

  useEffect(() => {
    FetchAllDropDown();
    getRoomDetails();
    getRequestList();
  }, [TransactionID]);

  const ErrorHandling = () => {
    let errors = {};
    errors.id = [];

    if (!payload?.IPDCaseTypeID) {
      errors.IPDCaseTypeID = "Room Type Is Required";
      errors.id[errors.id?.length] = "IPDCaseTypeIDFocus";
    }
    if (!payload?.RoomBed) {
      errors.RoomBed = "Room/Bed Is Required";
      errors.id[errors.id?.length] = "RoomBedFocus";
    }
    if (payload?.RoomBed && String(payload?.RoomBed) === String(currentRoomID)) {
      errors.RoomBed = "Room/Bed should not be Same";
      errors.id[errors.id?.length] = "RoomBedFocus";
    }
    // The remark is the reason the approver has to go on. Without it the approval screen shows
    // a list of beds somebody wants and no way to tell an infection-control move from a whim.
    if (!payload?.Remark?.trim()) {
      errors.Remark = "Remark Is Required";
      errors.id[errors.id?.length] = "RemarkFocus";
    }

    return errors;
  };

  // One open request per patient. A ward that presses the button twice would otherwise queue
  // the same patient for two beds, and approving both shifts them twice and bills them twice.
  const hasPendingRequest = requestList?.some(
    (item) => item?.STATUS === "Pending",
  );

  const handleRequest = async () => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 1) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[1], "error");
        setErrors(customerrors);
      }
      return;
    }

    if (hasPendingRequest) {
      notify(
        t("A room shift request for this patient is already awaiting approval."),
        "error",
      );
      return;
    }

    const roomType = DropDownState?.getRoomType?.find(
      (item) => String(item?.value) === String(payload?.IPDCaseTypeID),
    );
    const roomBed = DropDownState?.getBindRoomBed?.find(
      (item) => String(item?.RoomID) === String(payload?.RoomBed),
    );
    const billingCategory = DropDownState?.getBillingCategory?.find(
      (item) => String(item?.value) === String(payload?.BillingCategory),
    );

    const requestBody = {
      transactionID: Number(TransactionID || 0),
      priviousRoomName: currentRoomName ? String(currentRoomName) : "",
      priviousRoomID: currentRoomID ? Number(currentRoomID) : 0,
      // Ward and bed are two different things and go to two different columns. The old code
      // put the ward id in the bed column, which is why the grid printed somebody else's bed.
      requestIPDCaseTypeID: payload?.IPDCaseTypeID
        ? Number(payload?.IPDCaseTypeID)
        : 0,
      requestIPDCaseTypeName: roomType?.label ? String(roomType?.label) : "",
      requestRoomID: payload?.RoomBed ? Number(payload?.RoomBed) : 0,
      requestRoomName: roomBed?.Name ? String(roomBed?.Name) : "",
      requestBillingTypeID: payload?.BillingCategory
        ? Number(payload?.BillingCategory)
        : 0,
      requestBillingTypeName: billingCategory?.label
        ? String(billingCategory?.label)
        : "",
      requestDate: moment(
        `${moment(payload?.shiftDate).format("YYYY-MM-DD")} ${moment(
          payload?.shiftTime,
        ).format("HH:mm:ss")}`,
      ).format("YYYY-MM-DD HH:mm:ss"),
      requestBy: String(userData?.employeeID ?? ""),
      remark: payload?.Remark ? String(payload?.Remark).trim() : "",
    };

    try {
      const response = await NursingWardSaveRoomShiftRequset(requestBody);

      if (response?.success) {
        notify(response?.message, "success");
        setPayload(emptyPayload);
        setErrors({});
        getRequestList();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
      notify(t("Something went wrong"), "error");
    }
  };

  const handleReject = async (item) => {
    try {
      const response = await NursingWardRejectRoomShiftRequset({
        transactionID: Number(TransactionID || 0),
        id: Number(item?.ID || 0),
      });

      if (response?.success) {
        notify(response?.message, "success");
        getRequestList();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("Something went wrong"), "error");
    }
  };

  const statusColour = (status) => {
    if (status === "Approved") return "#ddffc3";
    if (status === "Reject") return "#f8d7da";
    return "";
  };

  const handleCancelShift = async (item) => {
    if (!window.confirm(t("Are you sure you want to cancel this room shift?"))) return;
    try {
      const response = await CancelRoomShift({
        id: Number(item?.ID || 0),
        transactionID: Number(TransactionID || 0),
      });
      if (response?.success) {
        notify(response?.message, "success");
        getRoomDetails();
        getRequestList();
      } else {
        notify(response?.message || t("Something went wrong"), "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };

  // Same columns as the direct Shift screen, so the grid reads identically in both modes.
  const itemThead = [
    t("S.No."),
    t("IPD No."),
    t("UHID"),
    t("Patient Name"),
    t("Room Type"),
    t("Room"),
    t("Entry Date"),
    t("Leave Date"),
    t("Shifted By"),
    t("Status"),
  ];

  // Fourteen columns did not fit the slide-out frame and the last few were clipped off the
  // right-hand edge with no way to reach them. Three pairs collapse without losing anything:
  // the requested ward and bed are one destination, and "shifted by + when" / "rejected by"
  // are the same fact - who acted on this request, and when. Only one of them is ever set.
  const thead = [
    { name: t("S.No."), width: "1%" },
    t("Request Date"),
    t("Previous Room"),
    t("Requested Room"),
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
          placeholderName={t("Room_Type")}
          id={"IPDCaseTypeID"}
          name="IPDCaseTypeID"
          value={payload?.IPDCaseTypeID}
          handleChange={(name, e) =>
            handleReactSelect(name, e, "BillingCategory")
          }
          dynamicOptions={DropDownState?.getRoomType}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          requiredClassName={`required-fields ${errors?.IPDCaseTypeID ? "required-fields-active" : ""}`}
        />

        <ReactSelect
          placeholderName={t("Room BedNo")}
          id={"RoomBed"}
          searchable={true}
          respclass="col-xl-2 col-md-2 col-sm-6 col-12"
          name="RoomBed"
          dynamicOptions={DropDownState?.getBindRoomBed?.map((item) => ({
            ...item,
            label: item?.Name,
            value: item?.RoomID,
          }))}
          value={payload?.RoomBed}
          handleChange={handleReactSelect}
          requiredClassName={`required-fields ${errors?.RoomBed ? "required-fields-active" : ""}`}
        />

        <ReactSelect
          isDisabled={true}
          placeholderName={t("Billing Category")}
          id={"BillingCategory"}
          searchable={true}
          respclass="col-xl-2 col-md-2 col-sm-6 col-12"
          name="BillingCategory"
          dynamicOptions={DropDownState?.getBillingCategory}
          value={payload?.BillingCategory}
          handleChange={handleReactSelect}
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
      </div>

      <div className="row m-2">
        <Input
          className={`form-control required-fields ${errors?.Remark ? "required-fields-active" : ""}`}
          lable={t("Remark")}
          placeholder=" "
          id="Remark"
          name="Remark"
          value={payload?.Remark}
          onChange={handleChange}
          maxLength={500}
          respclass="col-xl-8 col-md-8 col-sm-8 col-12"
        />

        <div className="col-xl-4 col-md-4 col-sm-4 col-12">
          <button
            className="btn btn-sm btn-success"
            onClick={handleRequest}
            disabled={hasPendingRequest}
            title={
              hasPendingRequest
                ? t("A room shift request for this patient is already awaiting approval.")
                : ""
            }
          >
            {t("Request for Approval")}
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <RoomShiftTable THEAD={itemThead} tbody={RoomDetail} onCancel={handleCancelShift} />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <Heading
            title={t("Room Shift Requests")}
            secondTitle={
              <>
                <ColorCodingSearch color={"#ffffff"} label={t("Pending")} />
                <ColorCodingSearch color={"#ddffc3"} label={t("Approved")} />
                <ColorCodingSearch color={"#f8d7da"} label={t("Reject")} />
              </>
            }
          />
          <Tables
            thead={thead}
            tbody={requestList?.map((item, index) => {
              // Whoever acted on the request. A row is approved or rejected, never both, so
              // these never compete for the one column.
              const actionBy =
                item?.STATUS === "Reject" ? item?.RejectedBy : item?.ShiftedBy;
              const actionDate =
                item?.STATUS === "Reject" ? item?.RejectedDate : item?.ShiftedDate;

              return {
              SNo: index + 1,
              RequestDate: item?.RequestDate || "",
              PreviousRoom: item?.PreviousRoomName || "",
              RequestedRoom: [item?.RequestIPDCaseTypeName, item?.BedRoomNo]
                .filter(Boolean)
                .join(" / "),
              Remark: item?.Remark || "",
              RequestBy: item?.RequestBy || "",
              Status: item?.STATUS || "",
              ShiftedTo: item?.ApprovedRoomName || "",
              ApproveRemark: item?.ApproveRemark || "",
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
              // Only a request still waiting can be withdrawn. Once it is approved the patient
              // has already been moved and billed, and once it is rejected there is nothing left
              // to reject.
              Reject:
                item?.STATUS === "Pending" ? (
                  <i
                    className="fa fa-trash"
                    onClick={() => handleReject(item)}
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
            // .TabScroll only sets overflow inside media queries, so at desktop width this
            // wrapper clips instead of scrolling. Set it here rather than widening the global
            // rule, which every other table in the app shares.
            style={{ maxHeight: "278px", overflow: "auto" }}
          />
        </div>
      </div>
    </>
  );
};

export default RoomShiftRequest;
