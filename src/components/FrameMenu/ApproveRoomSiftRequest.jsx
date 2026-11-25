import React, { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import Modal from "../modalComponent/Modal";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { notify } from "../../utils/utils";
import moment from "moment";
import {
  ApproveRoomShiftRequest,
  BillingCategory,
  BindRoomBed,
  BindRoomDetails,
  RoomTypeWithoutRoleFilter,
} from "../../networkServices/BillingsApi";
import {
  CancelRoomShiftRequest,
  GetRoomShiftRequestList,
} from "../../networkServices/nursingWardAPI";
import TextAreaInput from "../formComponent/TextAreaInput";

const ApproveRoomSiftRequest = ({ activeClass, data }) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const ip = useLocalStorage("ip", "get");
  const TransactionID = data?.transactionID || data?.TransactionID;

  // Lists State
  const [roomHistory, setRoomHistory] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedCancelItem, setSelectedCancelItem] = useState(null);

  // Dropdown options State
  const [dropdownState, setDropdownState] = useState({
    roomTypes: [],
    roomBeds: [],
    billingCategories: [],
  });

  // Form payload
  const [payload, setPayload] = useState({
    shiftDate: new Date(),
    shiftTime: new Date(),
    IPDCaseTypeID: "",
    RoomBed: "",
    BillingCategory: "",
    cancelReason: "",
    requisitionStatus: { label: t("Pending"), value: 0 },
  });

  const [errors, setErrors] = useState({});
  const [userConfirmation, setUserConfirmation] = useState(false);

  // Fetch Patient Room History
  const fetchRoomHistory = async () => {
    if (!TransactionID) return;
    try {
      const response = await BindRoomDetails(TransactionID);
      if (response?.success || response?.status) {
        setRoomHistory(Array.isArray(response?.data) ? response?.data : []);
      } else {
        setRoomHistory([]);
      }
    } catch (error) {
      console.error("Error fetching room details:", error);
      setRoomHistory([]);
    }
  };

  // Fetch Pending Room Shift Requests
  const fetchPendingRequests = async (statusVal) => {
    if (!TransactionID) return;
    const currentStatus =
      statusVal !== undefined
        ? statusVal
        : payload?.requisitionStatus?.value ?? 0;
    const reqPayload = {
      tid: Number(TransactionID),
      isApprove: Number(currentStatus),
    };
    try {
      const res = await GetRoomShiftRequestList(reqPayload);
      if (res?.success || res?.status) {
        setPendingRequests(Array.isArray(res?.data) ? res?.data : []);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error("Error fetching room shift requests:", error);
      setPendingRequests([]);
    }
  };

  // Fetch Dropdown options
  const fetchDropdowns = async () => {
    try {
      const [roomTypeData, billingCategoryData] = await Promise.all([
        RoomTypeWithoutRoleFilter(),
        BillingCategory(),
      ]);

      setDropdownState({
        roomTypes: roomTypeData?.data || [],
        billingCategories: billingCategoryData?.data || [],
        roomBeds: [],
      });
    } catch (error) {
      console.error("Error fetching dropdown values:", error);
    }
  };

  // Fetch beds when room type changes
  const fetchBeds = async (caseTypeId) => {
    if (!caseTypeId) {
      setDropdownState((prev) => ({ ...prev, roomBeds: [] }));
      return;
    }
    const params = {
      caseType: String(caseTypeId),
      isDisIntimated: 0,
      type: "1",
      bookingDate: "",
    };
    try {
      const response = await BindRoomBed(params);
      setDropdownState((prev) => ({
        ...prev,
        roomBeds: response?.data || [],
      }));
    } catch (error) {
      console.error("Error fetching beds:", error);
      setDropdownState((prev) => ({ ...prev, roomBeds: [] }));
    }
  };

  // Handles standard inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handles dropdown selections
  const handleReactSelect = async (name, option) => {
    const updatedPayload = { ...payload, [name]: option };

    if (name === "IPDCaseTypeID") {
      updatedPayload.RoomBed = "";
      fetchBeds(option?.value);
      // Auto fill Billing Category if matching
      const matchingBilling = dropdownState.billingCategories.find(
        (b) => String(b.IPDCaseTypeID) === String(option?.value)
      );
      if (matchingBilling) {
        updatedPayload.BillingCategory = {
          label: matchingBilling.Name,
          value: matchingBilling.IPDCaseTypeID,
        };
      }
    }

    if (name === "requisitionStatus") {
      fetchPendingRequests(option?.value);
    }

    setPayload(updatedPayload);
  };

  // Requests come from the front desk (patient_roomshift_request) and from Nursing Ward
  // (nursing_room_shift); API sends source "NURSING" for the latter.
  const nursingShiftIdOf = (item) =>
    String(item?.source ?? item?.Source ?? "").toUpperCase() === "NURSING"
      ? Number(item?.id ?? item?.ID ?? 0)
      : 0;

  // Handle selection of a pending request row
  const handleSelectRequest = (item) => {
    if (!item) return;
    setSelectedRequest(item);

    const reqRoomId =
      item.RequestRoomID || item.requestedIPDCaseTypeID || item.IPDCaseTypeID;
    const reqBillingId =
      item.requestBillingTypeID || item.billingCategoryID || reqRoomId;
    const reqBedId =
      item.availRooms || item.requestedRoomID || item.RoomID || item.roomID;

    const matchedRoomType = dropdownState.roomTypes.find(
      (r) => String(r.IPDCaseTypeID) === String(reqRoomId)
    );
    const matchedBillingCategory = dropdownState.billingCategories.find(
      (b) => String(b.IPDCaseTypeID) === String(reqBillingId)
    );

    setPayload((prev) => ({
      ...prev,
      // The shift happens now; the request's date is only shown in the list.
      shiftDate: new Date(),
      shiftTime: new Date(),
      IPDCaseTypeID: matchedRoomType
        ? { label: matchedRoomType.Name, value: matchedRoomType.IPDCaseTypeID }
        : reqRoomId
          ? {
            label: item.requestedRoomType || item.RequestRoomName || item.roomTypeName || item.RoomType || "",
            value: reqRoomId,
          }
          : prev.IPDCaseTypeID,
      RoomBed: reqBedId
        ? {
          label: item.bedRoomNo || item.roomName || item.Room || "",
          value: reqBedId,
        }
        : prev.RoomBed,
      BillingCategory: matchedBillingCategory
        ? {
          label: matchedBillingCategory.Name,
          value: matchedBillingCategory.IPDCaseTypeID,
        }
        : reqBillingId
          ? {
            label: item.requestBillingTypeName || "",
            value: reqBillingId,
          }
          : prev.BillingCategory,
    }));

    if (reqRoomId) {
      fetchBeds(reqRoomId);
    }
  };

  // Extract patient active room info for current info display
  const activeRoom = roomHistory.find((r) => r?.Status === "IN" || r?.status === "IN");

  // Validation
  const validateForm = () => {
    const err = {};
    if (!payload.IPDCaseTypeID || !payload.IPDCaseTypeID?.value) {
      err.IPDCaseTypeID = true;
    }
    if (!payload.RoomBed || !payload.RoomBed?.value) {
      err.RoomBed = true;
    }
    const currentRoomId =
      activeRoom?.RoomID || activeRoom?.roomID || data?.roomId || data?.RoomID;
    if (
      currentRoomId &&
      String(payload.RoomBed?.value) === String(currentRoomId)
    ) {
      err.RoomBed = "Room/Bed should not be the same as current room";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Shift triggers validation and API call
  const handleShiftTrigger = async () => {
    const isValid = validateForm();
    if (!isValid) {
      if (errors.RoomBed && typeof errors.RoomBed === "string") {
        notify(errors.RoomBed, "error");
      } else {
        notify("Please select both Room Type and Room BedNo.", "error");
      }
      return;
    }

    const requestPayload = {
      tid: Number(TransactionID),
      requestedIPDCaseTypeID: payload?.IPDCaseTypeID?.value
        ? Number(payload?.IPDCaseTypeID?.value)
        : 0,
      requestedRoomID: payload?.RoomBed?.value
        ? Number(payload?.RoomBed?.value)
        : 0,
      billingCategoryID: payload?.BillingCategory?.value
        ? Number(payload?.BillingCategory?.value)
        : 0,
      // A selected Nursing Ward request is marked shifted with this shift.
      nursingShiftID: nursingShiftIdOf(selectedRequest),
    };

    try {
      const response = await ApproveRoomShiftRequest(requestPayload);
      if (response?.success || response?.status) {
        notify(response?.message || "Room Shifted Successfully", "success");
        setSelectedRequest(null);
        setPayload((prev) => ({
          ...prev,
          shiftDate: new Date(),
          shiftTime: new Date(),
          IPDCaseTypeID: "",
          RoomBed: "",
          BillingCategory: "",
          cancelReason: "",
        }));
        setDropdownState((prev) => ({
          ...prev,
          roomBeds: [],
        }));
        setErrors({});
        fetchPendingRequests();
        fetchRoomHistory();
      } else {
        notify(response?.message || "Failed to Shift Room", "error");
      }
    } catch (error) {
      console.error("Error approving room shift:", error);
      notify(error?.response?.data?.message || "Failed to Shift Room", "error");
    }
  };

  // Cancel room shift request
  const handleValidateUser = async () => {
    if (!payload?.cancelReason || !payload?.cancelReason.trim()) {
      notify("Please enter cancel reason", "error");
      return;
    }

    const requestbody = {
      tid: Number(TransactionID),
      cancelReason: payload?.cancelReason.trim(),
      nursingShiftID: nursingShiftIdOf(selectedCancelItem),
    };

    try {
      const response = await CancelRoomShiftRequest(requestbody);
      if (response?.success || response?.status) {
        notify(
          response?.message || "Room shift request cancelled successfully",
          "success"
        );
        setUserConfirmation(false);
        setSelectedCancelItem(null);
        setSelectedRequest(null);
        setPayload((prev) => ({
          ...prev,
          cancelReason: "",
          IPDCaseTypeID: "",
          RoomBed: "",
          BillingCategory: "",
        }));
        setDropdownState((prev) => ({
          ...prev,
          roomBeds: [],
        }));
        setErrors({});
        fetchPendingRequests();
        fetchRoomHistory();
      } else {
        notify(response?.message || "Failed to cancel request", "error");
      }
    } catch (error) {
      console.error("Error cancelling room shift request:", error);
      notify(
        error?.response?.data?.message || "Failed to cancel request",
        "error"
      );
    }
  };

  const handleCancelComment = () => {
    setUserConfirmation(false);
    setSelectedCancelItem(null);
    setPayload((prev) => ({ ...prev, cancelReason: "" }));
  };

  useEffect(() => {
    fetchRoomHistory();
    fetchPendingRequests();
    fetchDropdowns();
  }, [TransactionID]);

  // Highlighting historical room rows (IN = green, OUT = pink)
  const getHistoryRowClass = (row) => {
    if (row?.Status === "IN" || row?.status === "IN") return "IsConform";
    if (row?.Status === "OUT" || row?.status === "OUT") return "Statusdone";
    return "";
  };

  // Highlighting selected pending requisition request row
  const getRequestRowClass = (row, index) => {
    const item = pendingRequests[index];
    if (
      selectedRequest &&
      item &&
      // Same row = same id from the same source (both tables number their own ids).
      (selectedRequest === item ||
        (String(selectedRequest.id ?? selectedRequest.ID) ===
          String(item.id ?? item.ID) &&
          String(selectedRequest.source ?? selectedRequest.Source ?? "") ===
            String(item.source ?? item.Source ?? "")))
    ) {
      return "color-indicator-3-bg"; // selected color highlight
    }
    return "";
  };

  // Table Headers
  const requestHeaders = [
    { name: t("S.No."), width: "1%" },
    t("Patient Name"),
    t("Request From"),
    t("Current Room"),
    t("Bed/Room No"),
    t("Remarks"),
    t("Requested Date Time"),
    t("Requested By"),
    t("Cancel Reason"),
    t("Cancel By"),
    { name: t("Action"), width: "1%" },
  ];

  const historyHeaders = [
    { name: t("S.No."), width: "1%" },
    t("IPD No."),
    t("UHID"),
    t("Patient Name"),
    t("Room Type"),
    t("Room/Bed"),
    t("Billing Category"),
    t("Entitlement"),
    t("Entry Date"),
    t("Leave Date"),
    t("Shifted By"),
    t("Status"),
  ];

  return (
    <div className="mt-2 spatient_registration_card">
      {userConfirmation && (
        <Modal
          visible={userConfirmation}
          setVisible={setUserConfirmation}
          modalWidth="30vw"
          Header={t("Cancel Reason")}
          buttonType="button"
          modalData={false}
          handleAPI={handleValidateUser}
          buttonName={t("Yes")}
          handleCancelComment={handleCancelComment}
        >
          <div className="text-center">
            <TextAreaInput
              lable={t("Cancel Reason")}
              rows={3}
              value={payload?.cancelReason}
              onChange={(e) =>
                setPayload({ ...payload, cancelReason: e.target.value })
              }
            />
          </div>
        </Modal>
      )}

      <div className="patient_registration card border p-1">
        <Heading title={t("Shift Patient Room")} isBreadcrumb={false} />

        {/* Current Information Panel */}
        <div className="patient_registration card border m-2">
          <Heading title={t("Current Information")} isBreadcrumb={false} />
          <div
            className="row p-2"
            style={{ fontSize: "16px", lineHeight: "1.8" }}
          >
            <div className="col-md-6 col-12">
              <div>
                <strong>{t("Room Type")} :</strong>{" "}
                <span className="bold">
                  {activeRoom?.RoomType || data?.roomTypeName || "N/A"}
                </span>
              </div>
              <div>
                <strong>{t("Room")} :</strong>{" "}
                <span className="bold">
                  {activeRoom?.Room || data?.roomName || "N/A"}
                </span>
              </div>
            </div>
            <div className="col-md-6 col-12">
              <div>
                <strong>{t("Billing Category")} :</strong>{" "}
                <span className="bold">
                  {data?.billingCategoryName ||
                    ""}
                </span>
              </div>
              <div>
                {/* Entitlement admission ke waqt patient_ipd_profile me save hota
                    hai aur room shift par nayi row me carry forward hota hai. */}
                <strong>{t("Entitlement")} :</strong>{" "}
                <span className="bold">
                  {activeRoom?.Entitlement || "N/A"}
                </span>
              </div>
              <div>
                <strong>{t("Admitted/Shifted On")} :</strong>{" "}
                <span className="bold">
                  {activeRoom?.EntryDate || data?.admitDate || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Information Panel */}
        <div className="patient_registration card border m-2">
          <Heading title={t("Update Information")} isBreadcrumb={false} />
          <div className="row p-2">
            <div className="col-12">
              <div className="row">
                <ReactSelect
                  placeholderName={t("Room Type")}
                  id="IPDCaseTypeID"
                  name="IPDCaseTypeID"
                  value={payload.IPDCaseTypeID}
                  handleChange={handleReactSelect}
                  dynamicOptions={dropdownState.roomTypes.map((item) => ({
                    label: item.Name,
                    value: item.IPDCaseTypeID,
                  }))}
                  searchable={true}
                  respclass="col-xl-4 col-md-6 col-12 mb-2"
                  requiredClassName={
                    errors.IPDCaseTypeID ? "required-fields-active" : ""
                  }
                />

                <ReactSelect
                  placeholderName={t("Billing Category")}
                  id="BillingCategory"
                  name="BillingCategory"
                  value={payload.BillingCategory}
                  handleChange={handleReactSelect}
                  dynamicOptions={dropdownState.billingCategories.map(
                    (item) => ({
                      label: item.Name,
                      value: item.IPDCaseTypeID,
                    })
                  )}
                  searchable={true}
                  respclass="col-xl-4 col-md-6 col-12 mb-2"
                />

                <div className="col-xl-4 col-md-6 col-12 mb-2">
                  <DatePicker
                    className="custom-calendar"
                    id="shiftDate"
                    name="shiftDate"
                    value={payload.shiftDate}
                    handleChange={handleChange}
                    lable={t("Shift Date")}
                    placeholder={VITE_DATE_FORMAT}
                    removeFormGroupClass={true}
                  />
                </div>

                <ReactSelect
                  placeholderName={t("Available Room")}
                  id="RoomBed"
                  name="RoomBed"
                  value={payload.RoomBed}
                  handleChange={handleReactSelect}
                  dynamicOptions={dropdownState.roomBeds.map((item) => ({
                    label: item.Name,
                    value: item.RoomID,
                  }))}
                  searchable={true}
                  respclass="col-xl-4 col-md-6 col-12 mb-2"
                  requiredClassName={
                    errors.RoomBed ? "required-fields-active" : ""
                  }
                />

                <ReactSelect
                  placeholderName={t("Requisition Status")}
                  id="requisitionStatus"
                  name="requisitionStatus"
                  value={payload.requisitionStatus}
                  handleChange={handleReactSelect}
                  dynamicOptions={[
                    { label: t("Pending"), value: 0 },
                    { label: t("Shifted"), value: 1 },
                    { label: t("Cancelled"), value: 3 },
                  ]}
                  searchable={false}
                  respclass="col-xl-4 col-md-6 col-12 mb-2"
                  isDisabled={true}
                />

                <div className="col-xl-4 col-md-6 col-12 mb-2">
                  <TimePicker
                    placeholderName={t("Shift Time")}
                    id="shiftTime"
                    name="shiftTime"
                    value={payload.shiftTime}
                    handleChange={handleChange}
                    removeFormControl={true}
                  />
                  <small
                    className="text-muted d-block mt-1"
                    style={{ fontSize: "10px" }}
                  >
                    (Type A or P to switch AM/PM)
                  </small>
                </div>
              </div>
              <div className="d-flex justify-content-end p-2">
                <button
                  className="btn btn-sm btn-success px-5"
                  type="button"
                  onClick={handleShiftTrigger}
                >
                  {t("Shift")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Requisition Details Section */}
        <div className="patient_registration card border m-2">
          <Heading
            title={t("Requisition Details")}
            isBreadcrumb={false}
            secondTitle={
              <div
                className="d-flex align-items-center"
                style={{ gap: "15px", fontSize: "12px" }}
              >
                <ColorCodingSearch color="#ffffff" label={t("Pending")} />
                <ColorCodingSearch
                  color="color-indicator-3-bg"
                  label={t("Selected")}
                />
              </div>
            }
          />
          {pendingRequests?.length > 0 ? (
            <div className="p-1 mb-2" style={{ overflowX: "auto" }}>
              <Tables
                thead={requestHeaders}
                tbody={pendingRequests.map((item, index) => ({
                  SNo: index + 1,
                  patientName: item?.patientName || item?.PName || "N/A",
                  source: item?.source || item?.Source || "-",
                  currentRoom: item?.currentRoom || item?.Room || "N/A",
                  bedRoomNo:
                    item?.bedRoomNo || item?.roomNo || item?.RoomBed || "N/A",
                  remarks: item?.remarks || "N/A",
                  requestDateTime:
                    item?.requestDateTime ||
                    (item?.RequestDate
                      ? moment(item.RequestDate).format("DD-MMM-YYYY hh:mm A")
                      : "N/A"),
                  RequestedBy: item?.requestedBy || item?.RequestBy || "-",
                  cancelReason: item?.cancelReason || "-",
                  cancelBy: item?.cancelBy || "-",
                  action: (
                    <button
                      className="btn btn-sm btn-danger"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCancelItem(item);
                        setUserConfirmation(true);
                      }}
                    >
                      {t("Cancel")}
                    </button>
                  ),
                }))}
                getRowClass={getRequestRowClass}
                tableHeight="tableHeight"
                getRowClick={(ele, index) =>
                  handleSelectRequest(pendingRequests[index])
                }
              />
            </div>
          ) : (
            <div className="p-2 text-center text-muted">
              {t("No Requisition Requests Found")}
            </div>
          )}
        </div>

        {/* Room Shift Details Section */}
        <div className="patient_registration card border m-2">
          <Heading
            title={t("Room Shift Details")}
            isBreadcrumb={false}
            secondTitle={
              <div
                className="d-flex align-items-center"
                style={{ gap: "15px", fontSize: "12px" }}
              >
                <ColorCodingSearch
                  color="IsConform"
                  label={t("Status In")}
                />
                <ColorCodingSearch
                  color="Statusdone"
                  label={t("Status Out")}
                />
              </div>
            }
          />
          <div className="p-1" style={{ overflowX: "auto" }}>
            <Tables
              thead={historyHeaders}
              tbody={roomHistory.map((item, index) => ({
                SNo: index + 1,
                IPDNo: item?.IPDNo || "N/A",
                UHID: item?.MRNo || "N/A",
                PatientName: item?.PatientName || "N/A",
                RoomType: item?.RoomType || "N/A",
                RoomBed: item?.Room || "N/A",
                BillingCategory:
                  item?.BillingCategory || item?.RoomType || "N/A",
                Entitlement: item?.Entitlement || "N/A",
                EntryDate: item?.EntryDate || "N/A",
                LeaveDate: item?.LeaveDate || "-",
                ShiftedBy: item?.ShiftedBy || "-",
                Status: item?.Status || "N/A",
              }))}
              getRowClass={getHistoryRowClass}
              tableHeight="tableHeight"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveRoomSiftRequest;

