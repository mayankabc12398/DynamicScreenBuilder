import React, { useEffect, useState } from "react";
import moment from "moment";
import Heading from "../../UI/Heading";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCommentDots,
  FaStethoscope,
  FaExclamationTriangle,
  FaMedkit,
  FaCalendarCheck,
  FaInfoCircle,
  FaFileMedical,
} from "react-icons/fa";
import { FaKitMedical, FaUserDoctor } from "react-icons/fa6";
import "./MedicationCalendar.css";
import { GetPatientAppointments } from "../../../networkServices/EDP/govindedp";
import i18next from "i18next";
const t = (key, options) => i18next.t(key, options);
import { notify } from "../../../utils/utils";
import { UpdateCall } from "../../../networkServices/DoctorApi";
import { GiMedicines } from "react-icons/gi";

const PatientSummaryCalendar = ({
  data,
  getUpdateInAPI,
  setShowNotesModal,
  setShowFlowSheet,
  setShowMedicationCalendar,
  /* Viewers outside the consulting room - the laboratory opens this from its
     worklist - get the calendar and the visit details, but not the doctor's
     actions on them. Those are not merely irrelevant there: "Get prescription"
     calls UpdateCall, which marks the patient, and the other two switch between
     popups that only the doctor's screen owns. Defaults to false, so the doctor's
     screens are unchanged. */
  readOnly = false,
}) => {
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const currentMonth = String(currentDate.month() + 1).padStart(2, "0");
      const currentYear = currentDate.year();
      const payload = {
        PatientID: data?.PatientID,
        currentMonth: `${currentMonth}-${currentYear}`,
      };
      const res = await GetPatientAppointments(payload);
      if (res?.success) {
        setAppointments(res?.data || []);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.PatientID) {
      fetchAppointments();
    }
  }, [data?.PatientID, currentDate]);

  // Calendar generation
  const generateCalendarDays = () => {
    const startOfMonth = moment(currentDate).startOf("month");
    const endOfMonth = moment(currentDate).endOf("month");
    const startDay = startOfMonth.day(); // 0 = Sunday
    const totalDays = endOfMonth.date();

    const days = [];

    // Leading empty cells
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, month: "empty", dateObj: null });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = moment(currentDate).date(i);
      days.push({ day: i, month: "current", dateObj: date });
    }

    // Trailing empty cells
    const remaining = 42 - days.length;
    for (let i = 0; i < remaining; i++) {
      days.push({ day: null, month: "empty", dateObj: null });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const getAppointmentsForDate = (dateMoment) => {
    if (!dateMoment) return [];
    const dateStr = dateMoment.format("DD-MMM-YYYY");
    return appointments.filter((app) => {
      // Parse "01-May-2026 08:00 AM"
      const appDate = app.AppDateTime ? app.AppDateTime.split(" ")[0] : "";
      return appDate === dateStr;
    });
  };

  const handlePrevMonth = () =>
    setCurrentDate(moment(currentDate).subtract(1, "month"));
  const handleNextMonth = () =>
    setCurrentDate(moment(currentDate).add(1, "month"));
  const handleToday = () => setCurrentDate(moment());

  return (
    <div className="patient-calendar-container">
      {/* Header */}
      <div className="calendar-header-actions">
        <div className="month-nav">
          <button className="btn btn-sm btn-success" onClick={handlePrevMonth}>
            <FaChevronLeft />
          </button>

          <h4 className="theme-color background-theme-color">
            {currentDate.format("MMMM YYYY")}
          </h4>
          <button className="btn btn-sm btn-success" onClick={handleNextMonth}>
            <FaChevronRight />
          </button>
          <button className="btn btn-sm btn-primary ml-3" onClick={handleToday}>
            {t("Current Month")}
          </button>
          {!readOnly && (
            <>
              <button
                className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary mx-1"
                title={t("Flow Sheet")}
                onClick={() => {
                  setShowFlowSheet?.(data);
                  setShowNotesModal?.(false);
                }}
              >
                <FaFileMedical className="pointer-cursor" />
              </button>
              <button
                className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary  mx-1"
                title={t("Notes")}
                onClick={() => {
                  setShowMedicationCalendar?.(data);
                  setShowNotesModal?.(false);
                }}
              >
                <GiMedicines className="pointer-cursor" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="main-content-layout">
        {/* Calendar Grid */}
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="calendar-day-head">
                {t(day)}
              </div>
            ))}
            {calendarDays.map((cell, idx) => {
              const isCurrentMonth = cell.month === "current";
              const dayApps = isCurrentMonth
                ? getAppointmentsForDate(cell.dateObj)
                : [];

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${!isCurrentMonth ? "empty-cell" : ""}`}
                >
                  {isCurrentMonth && (
                    <>
                      <div className="day-number">{cell.day}</div>
                      <div className="medication-list">
                        {dayApps.map((app, i) => (
                          <div
                            key={app.App_ID || i}
                            className="med-item active"
                            style={{
                              cursor: "pointer",
                              padding: "6px",
                              marginBottom: "4px",
                              borderLeft: "4px solid #2c7da0",
                              background: "#f1f9fe",
                            }}
                            onClick={() => setSelectedAppointment(app)}
                          >
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#1e293b",
                                marginBottom: "2px",
                              }}
                            >
                              <FaUserDoctor style={{ minWidth: "12px" }} />{" "}
                              {app.NAME}
                            </div>
                            {app.ChiefComplaint && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#64748b",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaCommentDots style={{ minWidth: "12px" }} />{" "}
                                {app.ChiefComplaint}
                              </div>
                            )}

                            {app.PDiagnosis && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#2c7da0",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaStethoscope style={{ minWidth: "12px" }} />{" "}
                                {app.PDiagnosis}
                              </div>
                            )}

                            {app.Allergies && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#ef4444",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaExclamationTriangle
                                  style={{ minWidth: "12px" }}
                                />{" "}
                                {app.Allergies}
                              </div>
                            )}

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: "2px",
                                fontSize: "13px",
                              }}
                            >
                              {app.TotalMedicine > 0 && (
                                <span
                                  style={{
                                    color: "#10b981",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <FaMedkit /> {app.TotalMedicine}
                                </span>
                              )}

                              {app.NextVisit && (
                                <span
                                  style={{
                                    color: "#f59e0b",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <FaCalendarCheck /> {app.NextVisit}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="calendar-sidebar">
          <div className="sidebar-card">
            <Heading
              title={t("Patient Details")}
              isBreadcrumb={false}
              secondTitle={
                /* Hidden for a read-only viewer: this does not just navigate, it
                   calls UpdateCall and marks the patient for the doctor. */
                readOnly ? null : (
                <button
                  className="btn btn-sm btn-success"
                  onClick={async () => {
                    if (selectedAppointment) {
                      try {
                        await UpdateCall({
                          app_ID: selectedAppointment?.App_ID,
                          doctorID:
                            selectedAppointment?.DoctorID ||
                            selectedAppointment?.Doctor_ID ||
                            data?.DoctorID ||
                            data?.Doctor_ID,
                        });
                      } catch (error) {
                        console.error("Error calling UpdateCall API:", error);
                      }
                      getUpdateInAPI?.(selectedAppointment);
                    } else {
                      notify(t("Please select an appointment first"), "error");
                    }
                  }}
                >
                  {t("Get prescription")}
                </button>
                )
              }
            />

            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-label">{t("Name")}</span>
                <span className="summary-value">{data?.Pname}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t("Patient ID")}</span>
                <span className="summary-value">{data?.PatientID}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h5>{t("Visit Details")}</h5>
            {selectedAppointment ? (
              <div className="active-med-list">
                <div className="info-group mb-3">
                  <label className="text-primary d-block mb-1">{t("Time")}</label>
                  <span className="mb-2 font-weight-bold">
                    {selectedAppointment.AppDateTime}
                  </span>
                </div>
                <div className="info-group mb-3">
                  <label className="text-primary d-block mb-1">
                    {t("Chief Complaint")}
                  </label>
                  <span className="mb-2">
                    {selectedAppointment.ChiefComplaint || t("None")}
                  </span>
                </div>
                <div className="info-group mb-3">
                  <label className="text-primary d-block mb-1">{t("Diagnosis")}</label>
                  <span className="mb-2">
                    {selectedAppointment.PDiagnosis || t("Not recorded")}
                  </span>
                </div>
                <div className="info-group mb-3">
                  <label className="text-primary d-block mb-1">{t("Allergies")}</label>
                  <span className="mb-2 text-danger font-weight-bold">
                    {selectedAppointment.Allergies || t("None")}
                  </span>
                </div>
                <div className="info-group mb-3">
                  <label className="text-primary d-block mb-1">
                    {t("Doctor Notes")}
                  </label>
                  <span className="mb-2">
                    {selectedAppointment.DoctorNotes || t("None")}
                  </span>
                </div>
                <div className="info-group mb-3">
                  <label className="text-primary d-block mb-1">{t("Medicines")}</label>
                  <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                    {selectedAppointment.Medicines
                      ? selectedAppointment.Medicines.split("||").map(
                          (medicine, index) => (
                            <div key={index} className="mb-1">
                              {medicine.trim()}
                            </div>
                          ),
                        )
                      : t("None")}
                  </p>
                </div>
                <div className="info-group mb-3">
                  <label className="text-primary d-block mb-1">
                    {t("Next Visit")}
                  </label>
                  <p className="mb-2">
                    {selectedAppointment.NextVisit || t("Not scheduled")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted">{t("Click an appointment to view details")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSummaryCalendar;
