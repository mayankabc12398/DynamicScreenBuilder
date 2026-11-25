import React, { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import TextAreaInput from "../formComponent/TextAreaInput";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { handleReactSelectDropDownOptions, notify } from "../../utils/utils";
import moment from "moment";
import {
    BillingCategory,
    BindRoomBed,
    BindRoomDetails,
    RoomTypeWithoutRoleFilter,
    SaveRoomShiftRequest,
} from "../../networkServices/BillingsApi";
import {
    NursingWardRejectRoomShiftRequset,
    NursingWardSaveRoomShiftRequset,
    SearchPendingRequest,
} from "../../networkServices/nursingWardAPI";

const RoomShiftingRequest = ({ data }) => {
    const { t } = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;
    const { employeeID } = useLocalStorage("userData", "get");
    const TransactionID = data?.transactionID || data?.TransactionID;

    // State lists
    const [roomHistory, setRoomHistory] = useState([]);
    const [allRequests, setAllRequests] = useState([]);

    // Dropdown States
    const [dropdownState, setDropdownState] = useState({
        roomTypes: [],
        roomBeds: [],
        billingCategories: [],
    });

    // Form Payload state
    const [payload, setPayload] = useState({
        remarks: "",
        shiftDate: new Date(),
        shiftTime: new Date(),
        requisitionStatus: { label: "All", value: "" },
    });

    const [errors, setErrors] = useState({});

    // Fetch Room History (Room Shift Details)
    const fetchRoomHistory = async () => {
        if (!TransactionID) return;
        try {
            const response = await BindRoomDetails(TransactionID);
            if (response?.success || response?.status) {
                setRoomHistory(response?.data || []);
            } else {
                setRoomHistory([]);
            }
        } catch (error) {
            console.error("Error fetching room details:", error);
        }
    };

    // Fetch Shifting Requests (Requisition Details)
    const fetchShiftingRequests = async (status = payload?.requisitionStatus?.value ?? "") => {
        if (!TransactionID) return;
        try {
            const response = await SearchPendingRequest(TransactionID, status);
            if (response?.success || response?.status) {
                const list = response?.data || [];
                setAllRequests(list);
            } else {
                setAllRequests([]);
            }
        } catch (error) {
            console.error("Error fetching room shift requests:", error);
            setAllRequests([]);
        }
    };

    // Filter requests locally


    // Fetch dropdowns
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
            updatedPayload.RoomBed = ""; // reset bed on room type change
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

        setPayload(updatedPayload);
    };

    // Handles Requisition Status filter change
    const handleStatusFilterChange = (name, option) => {
        setPayload((prev) => ({
            ...prev,
            [name]: option,
        }));
        const statusVal = option?.value ?? "";
        fetchShiftingRequests(statusVal);
    };

    // Validates inputs


    // Saves a new request
    const handleSaveRequest = async () => {
        if (!payload.remarks) {
            notify("Please enter remarks.", "error");
            return;
        }

        const currentActiveRoom = roomHistory.find((r) => r?.Status === "IN");

        const requestBody = {
            tid: Number(TransactionID),
            remarks: payload.remarks,
        };

        try {
            const response = await SaveRoomShiftRequest(requestBody);
            if (response?.success || response?.status) {
                notify(response?.message || "Room shift requested successfully", "success");
                // Refresh tables and reset form
                fetchShiftingRequests();
                setPayload((prev) => ({
                    ...prev,
                    remarks: "",
                    shiftDate: new Date(),
                    shiftTime: new Date(),
                }));
            } else {
                notify(response?.message || "Failed to save request", "error");
            }
        } catch (error) {
            console.error("Error saving room request:", error);
            notify("Something went wrong", "error");
        }
    };

    // Cancels/rejects request
    const handleCancelRequest = async (item) => {
        const cancelPayload = {
            transactionID: TransactionID,
            id: item?.ID || item?.id,
        };
        try {
            const response = await NursingWardRejectRoomShiftRequset(cancelPayload);
            if (response?.success || response?.status) {
                notify(response?.message || "Request cancelled successfully", "success");
                fetchShiftingRequests();
            } else {
                notify(response?.message || "Failed to cancel request", "error");
            }
        } catch (error) {
            console.error("Error cancelling request:", error);
            notify("Something went wrong", "error");
        }
    };

    useEffect(() => {
        fetchRoomHistory();
        fetchShiftingRequests();
        fetchDropdowns();
    }, [TransactionID]);

    // Extract patient active room info for current info display
    const activeRoom = roomHistory.find((r) => r?.Status === "IN");
    // Room history row class highlighting (Status IN = green, Status OUT = pink)
    const getHistoryRowClass = (row) => {
        if (row?.Status === "IN") return "IsConform";
        if (row?.Status === "OUT") return "Statusdone";
        return "";
    };

    // Shifting requests row color class (Pending = light blue/white, Complete = green, Reject = red)
    const getRequestRowClass = (row) => {
        const status = (row?.STATUS || row?.status || "").toLowerCase();
        if (row?.isApprove === 0 || status === "pending") return "";
        if (row?.isApprove === 1 || row?.isApprove === 2 || status === "complete" || status === "shifted" || status === "approved") {
            return "color-indicator-4-bg"; // green
        }
        if (row?.isApprove === 3 || status === "reject" || status === "rejected" || status === "cancelled") {
            return "color-indicator-21-bg"; // red
        }
        return "";
    };

    // Tables Headers
    const requestHeaders = [
        { name: t("S.No."), width: "1%" },
        t("Date"),
        t("Previous Room"),
        t("Required Room"),
        t("Bed/Room No"),
        t("Requested By"),
        t("Shifted By"),
        t("Cancel By"),
        t("Cancel Reason"),
        { name: t("Action"), width: "1%" },
    ];

    const historyHeaders = [
        { name: t("S.No."), width: "1%" },
        t("IPD No."),
        t("UHID"),
        t("Patient Name"),
        t("Room Type"),
        t("Room/Bed"),
        t("Entry Date"),
        t("Leave Date"),
        t("Shifted By"),
        t("Status"),
    ];

    // Remarks character indicator
    const handleRemarksIndicator = (text) => {
        const len = text ? text.length : 0;
        return (
            <div className="text-danger text-right" style={{ fontSize: "11px" }}>
                (Max 1000 Char.) <span className="text-dark">{t("Remaining")} :</span>{" "}
                <span className="text-success">{1000 - len}</span>
            </div>
        );
    };

    return (
        <div className="mt-2 spatient_registration_card">
            <div className="patient_registration card border p-1">
                <Heading title={t("Patient Room Shifting Request")} isBreadcrumb={false} />

                {/* Current Information Panel */}
                <div className="patient_registration card border m-2">
                    <Heading title={t("Current Information")} isBreadcrumb={false} />
                    <div className="row p-2" style={{ fontSize: "16px", lineHeight: "1.8" }}>
                        <div className="col-md-6 col-12">
                            <div>
                                <strong>{t("Room Type")} :</strong> <span className="bold">{activeRoom?.RoomType || "-"}</span>
                            </div>
                            <div>
                                <strong>{t("Room")} :</strong> <span className="bold">{activeRoom?.Room || data?.roomName || "-"}</span>
                            </div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div>
                                <strong>{t("Billing Category")} :</strong> <span className="bold">{activeRoom?.BillingCategory || "-"}</span>
                            </div>
                            <div>
                                <strong>{t("Admitted/Shifted On")} :</strong> <span className="bold">{activeRoom?.EntryDate || data?.admitDate || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Update Information Panel */}
                <div className="patient_registration card border m-2">
                    <Heading title={t("Update Information")} isBreadcrumb={false} />
                    <div className="row p-2">
                        {/* Remarks Textarea */}
                        <div className="col-xl-6 col-md-12 col-12">
                            <TextAreaInput
                                lable={t("Remarks")}
                                placeholder=""
                                className="w-100"
                                id="remarks"
                                name="remarks"
                                value={payload.remarks}
                                onChange={handleChange}
                                rows={4}
                                maxLength={1000}
                            />
                            {handleRemarksIndicator(payload.remarks)}
                        </div>

                        {/* Select options and pickers */}
                        <div className="col-xl-6 col-md-12 col-12">
                            <div className="row">
                                <ReactSelect
                                    placeholderName={t("Requisition Status")}
                                    id="requisitionStatus"
                                    name="requisitionStatus"
                                    value={payload?.requisitionStatus}
                                    handleChange={handleStatusFilterChange}
                                    dynamicOptions={[
                                        { label: t("All"), value: "" },
                                        { label: t("Pending"), value: "P" },
                                        { label: t("Shifted"), value: "A" },
                                        { label: t("Cancelled"), value: "C" },
                                    ]}
                                    searchable={false}
                                    respclass="col-xl-6 col-md-6 col-12 mb-2"
                                />
                            </div>

                            {/* Date time rows */}
                            <div className="row align-items-center">
                                <div className="col-xl-6 col-md-6 col-12 mb-2">
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

                                <TimePicker
                                    placeholderName={t("Shift Time")}
                                    respclass="col-xl-6 col-md-6 col-12 mb-2"
                                    id="shiftTime"
                                    name="shiftTime"
                                    value={payload.shiftTime}
                                    handleChange={handleChange}
                                    removeFormControl={true}
                                />
                            </div>

                            {/* Save Button & Legend */}
                            <div className="d-flex align-items-center justify-content-end mt-2">
                                <button
                                    className="btn btn-sm btn-success px-4"
                                    type="button"
                                    onClick={handleSaveRequest}
                                >
                                    {t("Save Room Request")}
                                </button>

                                <div className="d-flex align-items-center" style={{ fontSize: "12px" }}>
                                    <span className="mr-3">
                                        <ColorCodingSearch color="IsConform" label={t("Status In")} />
                                    </span>
                                    <span>
                                        <ColorCodingSearch color="Statusdone" label={t("Status Out")} />
                                    </span>
                                </div>
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
                            <div className="d-flex align-items-center" style={{ gap: "15px", fontSize: "12px" }}>
                                <ColorCodingSearch color="#ffffff" label={t("Pending")} />
                                <ColorCodingSearch color="color-indicator-4-bg" label={t("Shifted")} />
                                <ColorCodingSearch color="color-indicator-21-bg" label={t("Cancelled")} />
                            </div>
                        }
                    />
                    <div className="p-1" style={{ overflowX: "auto" }}>
                        <Tables
                            thead={requestHeaders}
                            tbody={allRequests.map((item, index) => ({
                                SNo: index + 1,
                                Date: item?.requestTime || "-",
                                PreviousRoom: item?.PreviousRoomName || item?.currentRoom || "N/A",
                                RequiredRoom: item?.RequestRoomName || item?.requestedRoomType || item?.requestedRoom || "N/A",
                                BedRoomNo: item?.bedRoomNo || item?.requestedRoom || "N/A",
                                RequestedBy: item?.RequestBy || item?.requestedBy || "N/A",
                                ShiftedBy: item?.approvedBy || "-",
                                CancelBy: item?.cancelBy || "-",
                                cancelReason: item?.cancelReason || "-",
                                Action: (
                                    <div>
                                        {item?.canRejectsss ? (
                                            <i
                                                className="fa fa-trash text-danger text-center cursor-pointer"
                                                style={{ fontSize: "14px" }}
                                                onClick={() => handleCancelRequest(item)}
                                                title={t("Cancel Request")}
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                ),
                            }))}
                            getRowClass={getRequestRowClass}
                            tableHeight="tableHeight"
                        />
                    </div>
                </div>

                {/* Room Shift Details Section */}
                <div className="patient_registration card border m-2">
                    <Heading title={t("Room Shift Details")} isBreadcrumb={false} />
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
                                EntryDate: item?.EntryDate || "N/A",
                                LeaveDate: item?.LeaveDate || "-",
                                ShiftedBy: item?.Name || "-",
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

export default RoomShiftingRequest;
