import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { FaSun, FaMoon, FaFileMedical } from "react-icons/fa";
import "./MedicationCalendar.css";
import Modal from "../../../components/modalComponent/Modal";
import { GetPatientMedicineList } from "../../../networkServices/EDP/govindedp";
import { Tooltip } from "primereact/tooltip";
import { FaKitMedical } from "react-icons/fa6";
// import { Tooltip } from "primereact/tooltip";

/**
 * `loadMedicines` is optional. When given it replaces the default
 * Doctor/GetPatientMedicineList call: `async ({ PatientID, monthYear }) => rows`, where
 * rows are in that same API's shape (optionally with a `Source` label). The pharmacy
 * issue screens use it to merge doctor, pharmacy and ward feeds; the doctor screens
 * pass nothing and behave exactly as before.
 */
const MedicationCalendar = ({
  data,
  setShowFlowSheet,
  setShowNotesModal,
  setShowMedicationCalendar,
  loadMedicines,
}) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(moment());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [medications, setMedications] = useState([]);
  // Per-feed status when a multi-source loader is used (pharmacy); [] for the doctor feed.
  const [sourceStatus, setSourceStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGetPatientMedicineList = async () => {
    if (!data?.PatientID) {
      return;
    }
    const currentMonth = String(currentDate.month() + 1).padStart(2, "0");
    const currentYear = currentDate.year();
    const formattedDate = `${currentMonth}-${currentYear}`;
    const payload = {
      PatientID: data?.PatientID,
      currentMonth: formattedDate,
    };
    console.log(payload, "payload");

    setLoading(true);
    try {
      if (typeof loadMedicines === "function") {
        const result = await loadMedicines({
          PatientID: data?.PatientID,
          monthYear: formattedDate,
        });
        const rows = Array.isArray(result) ? result : result?.rows;
        setSourceStatus(Array.isArray(result?.sources) ? result.sources : []);
        setMedications(transformApiData(Array.isArray(rows) ? rows : []));
        return;
      }
      const response = await GetPatientMedicineList(payload);
      if (response?.success && response?.data) {
        // Transform API data to component format
        const transformedData = transformApiData(response.data);
        setMedications(transformedData);
      } else {
        setMedications([]);
      }
    } catch (error) {
      console.error("Error fetching medicine list:", error);
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData) => {
    return apiData.map((item, index) => {
      const scheduledDays = getScheduledDays(
        item.MedicineGiveDate,
        item.end_date,
        item.NoOfDays,
        item.NoTimesDay,
      );

      let type = "Active";
      if (item.MedicineStatus === "Completed") {
        type = "Completed";
      } else if (
        item.days_remaining < 0 &&
        item.MedicineStatus !== "Completed"
      ) {
        type = "Completed";
      }

      const times = getTimesFromFrequency(item.NoTimesDay);

      const startDate = moment(item.MedicineGiveDate).format("DD MMM YYYY");
      const endDate = moment(item.end_date).format("DD MMM YYYY");
      const givenDate = moment(item.MedicineGiveDate).format("DD MMM YYYY");

      return {
        id: item.TransactionID + "_" + item.Medicine_ID,
        name: item.MedicineName,
        type: type,
        dose: item.Dose,
        times: times,
        startDate: startDate,
        endDate: endDate,
        frequency: formatFrequency(item.NoTimesDay, item.Meal),
        duration: item.NoOfDays,
        givenBy: item.DrName,
        givenDate: givenDate,
        finalDose: item.IsIssued === 1 ? "Yes" : "No",
        scheduledDays: scheduledDays,
        noOfDays: item.NoOfDays,
        noTimesDay: item.NoTimesDay,
        meal: item.Meal,
        rawData: item,
        route: item.Route,
        remarks: item.Remarks,
        composition: item.Composition,
        quantity: item.Quantity,
        medicineStatus: item.MedicineStatus,
        daysRemaining: item.days_remaining,
        // Set by multi-source loaders (pharmacy); blank for the doctor feed.
        source: item.Source || "",
      };
    });
  };

  /**
   * The calendar dates ("YYYY-MM-DD") a medicine occupies.
   *
   * Earlier this returned day-of-month numbers and trusted both dates blindly. A row
   * with a blank or unparseable end date (a prescription saved without a duration)
   * therefore produced no days at all, so the medicine appeared in the sidebar but never
   * on the grid; and a course running across a month boundary painted its previous-month
   * day numbers onto the current month's cells. Full dates fix both, and the fallbacks
   * below make sure a medicine with a give date always lands on at least that day.
   */
  const getScheduledDays = (startDate, endDate, noOfDays, noTimesDay) => {
    const parse = (value) => {
      if (!value) return null;
      // Known API formats first (strict), then moment's own parser as a last resort.
      const strict = moment(
        value,
        [moment.ISO_8601, "YYYY-MM-DD", "DD-MMM-YYYY", "DD-MMM-YYYY HH:mm", "DD/MM/YYYY"],
        true,
      );
      const m = strict.isValid() ? strict : moment(value);
      return m.isValid() ? m.startOf("day") : null;
    };

    let totalDaysFromNoOfDays = 0;
    if (noOfDays) {
      const text = String(noOfDays);
      const daysMatch = text.match(/(\d+)\s*(?:day|Days?)/i);
      const weeksMatch = text.match(/(\d+)\s*(?:week|Weeks?)/i);
      const bareNumber = text.match(/^\s*(\d+)\s*$/);
      if (daysMatch) {
        totalDaysFromNoOfDays = parseInt(daysMatch[1]);
      } else if (weeksMatch) {
        totalDaysFromNoOfDays = parseInt(weeksMatch[1]) * 7;
      } else if (bareNumber) {
        totalDaysFromNoOfDays = parseInt(bareNumber[1]);
      }
    }
    const spanFromDuration = Math.max(totalDaysFromNoOfDays - 1, 0);

    let start = parse(startDate);
    let end = parse(endDate);
    if (start && end && end.isBefore(start)) [start, end] = [end, start];
    if (start && !end) end = start.clone().add(spanFromDuration, "days");
    if (!start && end) start = end.clone().subtract(spanFromDuration, "days");
    if (!start || !end) return [];

    const frequency = noTimesDay?.toLowerCase() || "";
    const isAlternateDay = frequency.includes("alternate");
    const totalDays = end.diff(start, "days") + 1;

    const days = [];
    for (let i = 0; i < totalDays; i++) {
      if (isAlternateDay && i % 2 !== 0) continue;
      days.push(start.clone().add(i, "days").format("YYYY-MM-DD"));
    }
    return days;
  };

  const getTimesFromFrequency = (noTimesDay) => {
    if (!noTimesDay) return ["As prescribed"];

    const freq = noTimesDay.toLowerCase();
    if (freq.includes("qid") || freq.includes("four times")) {
      return ["9:00 AM", "1:00 PM", "5:00 PM", "9:00 PM"];
    } else if (freq.includes("tid") || freq.includes("three times")) {
      return ["9:00 AM", "2:00 PM", "8:00 PM"];
    } else if (freq.includes("bid") || freq.includes("twice")) {
      return ["9:00 AM", "8:00 PM"];
    } else if (freq.includes("od") || freq.includes("once")) {
      return ["9:00 AM"];
    } else if (freq.includes("alternate")) {
      return ["9:00 AM (Alternate Days)"];
    }
    return ["As prescribed"];
  };

  const formatFrequency = (noTimesDay, meal) => {
    let frequency = noTimesDay || "";
    if (meal) {
      frequency += ` (${meal})`;
    }
    return frequency;
  };

  useEffect(() => {
    handleGetPatientMedicineList();
  }, [data, currentDate]);

  const generateCalendarDays = () => {
    const startOfMonth = moment(currentDate).startOf("month");
    const endOfMonth = moment(currentDate).endOf("month");
    const startDay = startOfMonth.day(); // 0 = Sunday
    const totalDays = endOfMonth.date();

    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, month: "empty", dateObj: null });
    }

    for (let i = 1; i <= totalDays; i++) {
      const date = moment(currentDate).date(i);
      days.push({ day: i, month: "current", dateObj: date });
    }

    const remaining = 42 - days.length;
    for (let i = 0; i < remaining; i++) {
      days.push({ day: null, month: "empty", dateObj: null });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const handlePrevMonth = () =>
    setCurrentDate(moment(currentDate).subtract(1, "month"));
  const handleNextMonth = () =>
    setCurrentDate(moment(currentDate).add(1, "month"));
  const handleToday = () => setCurrentDate(moment());

  const getMedicationsForDay = (dayObj) => {
    if (!dayObj.dateObj) return []; // empty cell

    // scheduledDays holds full dates, so a course that spans two months lands on the
    // right cells in each and never leaks day numbers across months.
    const dateKey = dayObj.dateObj.format("YYYY-MM-DD");
    const dateStr = dayObj.dateObj.format("YYYYMMDD");
    return medications
      .filter((med) => med.scheduledDays.includes(dateKey))
      .map((med, index) => ({
        ...med,
        id: `${dateStr}_${index}`,
      }));
  };

  const handleMedicationClick = (medication) => {
    setSelectedMedication(medication);
    setIsDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">{t("Loading...")}</span>
        </div>
        <p>{t("Loading medications...")}</p>
      </div>
    );
  }

  return (
    <div className="medication-calendar-container">
      <div className="calendar-header-actions">
        <div className="month-nav">
          <button className="btn btn-sm btn-success" onClick={handlePrevMonth}>
            <i className="fa fa-chevron-left" />
          </button>
          <h4 className="theme-color background-theme-color">
            {currentDate.format("MMMM YYYY")}
          </h4>
          <button className="btn btn-sm btn-success" onClick={handleNextMonth}>
            <i className="fa fa-chevron-right" />
          </button>
          <button className="btn btn-sm btn-primary ml-3" onClick={handleToday}>
            {t("Current Month")}
          </button>
          {/* Flow Sheet / Notes open doctor-screen modals; callers without them
              (the pharmacy issue screens) omit the callbacks and get no button. */}
          {typeof setShowFlowSheet === "function" && (
            <button
              className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary mx-1"
              title={t("Flow Sheet")}
              onClick={() => {
                setShowMedicationCalendar(false);
                setShowFlowSheet(data);
              }}
            >
              <FaFileMedical className="pointer-cursor" />
            </button>
          )}
          {typeof setShowNotesModal === "function" && (
            <button
              className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary  mx-1"
              title={t("Notes")}
              onClick={() => {
                setShowNotesModal(data);
                setShowMedicationCalendar(false);
              }}
            >
              <FaKitMedical className="pointer-cursor" />
            </button>
          )}
        </div>
        {/* <div className="d-flex align-items-center gap-2">
         
        </div> */}
        <div className="legend-section">
          <div className="legend-item">
            <span className="dot active"></span> {t("Active (Ongoing)")}
          </div>
          <div className="legend-item">
            <span className="dot completed"></span> {t("Completed")}
          </div>
          {/* <div className="ml-auto text-muted background-theme-color theme-color px-3 py-2 rounded">
          {t("Click on any medication to view details")}
        </div> */}
        </div>
      </div>

      {/* Which feeds were consulted for this month and what each returned. Only rendered
          for multi-source loaders (pharmacy); the doctor screens never see it. A feed that
          answered "nothing" or was refused is shown as such rather than silently missing. */}
      {sourceStatus.length > 0 && (
        <div className="rx-med-sources">
          <span className="rx-med-sources__title">{t("Sources")}:</span>
          {sourceStatus.map((s) => (
            <span
              key={s.key}
              className={`rx-med-sources__item rx-med-sources__item--${s.status}`}
              title={s.message || ""}
            >
              {s.label}
              <span className="rx-med-sources__count">
                {s.status === "ok" || s.status === "empty"
                  ? s.count
                  : s.status === "skipped"
                    ? t("N/A")
                    : t("Error")}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="main-content-layout">
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="calendar-day-head">
                {t(day)}
              </div>
            ))}

            {calendarDays.map((dayObj, idx) => {
              const isEmpty = dayObj.month === "empty";
              const dayMeds = isEmpty ? [] : getMedicationsForDay(dayObj);

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${isEmpty ? "empty-cell" : ""}`}
                >
                  {!isEmpty && (
                    <>
                      <div className="day-number">{dayObj.day}</div>
                      <div className="medication-list">
                        {dayMeds.map((med, i) => (
                          <div
                            key={med.id}
                            className={`med-item ${med.type === "Completed" ? "completed" : ""}`}
                            onClick={() => handleMedicationClick(med)}
                            style={{ cursor: "pointer" }}
                            id={`medication-details-${med.id}`}
                          >
                            <div className="med-name-dose">
                              <span className="med-name">{med.name}</span>
                              <span className="med-dose">{med.dose}</span>
                            </div>
                            {med.source && (
                              <span className="rx-med-source-tag">
                                {med.source}
                              </span>
                            )}

                            <div className="med-info">
                              <div className="med-no-of-days">
                                <i className="fa fa-calendar"></i>{" "}
                                {med.noOfDays}
                              </div>

                              <div className="med-frequency">
                                <i className="fa fa-clock-o"></i>{" "}
                                {med.noTimesDay}
                              </div>
                              <div className="med-doctor">
                                <i className="fa fa-user-md"></i> {med.givenBy}
                              </div>
                            </div>
                            <Tooltip
                              target={`#medication-details-${med?.id}`}
                              content={t(
                                "Click on any Medication to view details",
                              )}
                              position="top"
                            />
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

        <div className="calendar-sidebar">
          <div className="sidebar-card">
            <h5>{t("Summary (")}{currentDate.format("MMMM YYYY")})</h5>
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-label">{t("Total Medications")}</span>
                <span className="summary-value">{medications.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label text-success">
                  {t("Active (Ongoing)")}
                </span>
                <span className="summary-value text-success">
                  {medications.filter((m) => m.type === "Active").length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label text-primary">{t("Completed")}</span>
                <span className="summary-value text-primary">
                  {medications.filter((m) => m.type === "Completed").length}
                </span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h5>{t("Active Medications")}</h5>
            <div className="active-med-list">
              {medications
                .filter((m) => m.type === "Active")
                .map((med) => (
                  <div
                    key={med.id}
                    className="active-med-item"
                    onClick={() => handleMedicationClick(med)}
                    style={{ cursor: "pointer" }}
                  >
                    <h6>
                      {med.name}
                      {med.source && (
                        <span className="rx-med-source-tag ml-1">
                          {med.source}
                        </span>
                      )}
                    </h6>
                    <p>
                      {t("Dose:")} {med.dose} | {med.noOfDays}
                    </p>
                    <p>{t("Frequency:")} {med.noTimesDay}</p>
                    <p>{t("Prescribed by:")} {med.givenBy}</p>
                  </div>
                ))}
              {medications.filter((m) => m.type === "Active").length === 0 && (
                <p className="text-muted">{t("No active medications")}</p>
              )}
            </div>
          </div>

          <div className="sidebar-card">
            <h5>{t("Completed Medications")}</h5>
            <div className="active-med-list">
              {medications
                .filter((m) => m.type === "Completed")
                .map((med) => (
                  <div
                    key={med.id}
                    className="active-med-item"
                    style={{ borderLeftColor: "#007bff", cursor: "pointer" }}
                    onClick={() => handleMedicationClick(med)}
                  >
                    <h6>
                      {med.name}
                      {med.source && (
                        <span className="rx-med-source-tag ml-1">
                          {med.source}
                        </span>
                      )}
                    </h6>
                    <p>
                      {t("Dose:")} {med.dose} | Duration: {med.noOfDays}
                    </p>
                    <p>{t("Frequency:")} {med.noTimesDay}</p>
                    <p>{t("Prescribed by:")} {med.givenBy}</p>
                  </div>
                ))}
              {medications.filter((m) => m.type === "Completed").length ===
                0 && <p className="text-muted">{t("No completed medications")}</p>}
            </div>
          </div>

          <div className="info-box">
            <i className="fa fa-info-circle text-primary mt-1"></i>
            <span>{t("Click on any medication card to view complete details.")}</span>
          </div>
        </div>
      </div>

      <div className="footer-note mt-3">
        <i className="fa fa-info-circle text-primary"></i>
        <span>
          {t("Note: Only Active (Ongoing) and Completed medications are shown.")}
        </span>
      </div>

      <Modal
        visible={isDetailModalOpen}
        setVisible={setIsDetailModalOpen}
        modalWidth="50vw"
        Header={t("Medication Details")}
        footer={<></>}
      >
        {selectedMedication && (
          <div className="medication-detail-modal">
            <div className="detail-header">
              <h3>{selectedMedication.name}</h3>
              <span
                className={`status-badge ${selectedMedication.type.toLowerCase()}`}
              >
                {selectedMedication.type}
              </span>
            </div>

            <div className="detail-grid">
              <div className="detail-section">
                <h5>
                  <i className="fa fa-info-circle"></i> {t("Medication Information")}
                </h5>
                <div className="detail-row">
                  <span className="detail-label">{t("Medicine Name:")}</span>
                  <span className="detail-value">
                    {selectedMedication.name}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("Dose:")}</span>
                  <span className="detail-value">
                    {selectedMedication.dose}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("Frequency:")}</span>
                  <span className="detail-value">
                    {selectedMedication.noTimesDay}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("Duration:")}</span>
                  <span className="detail-value">
                    {selectedMedication.noOfDays}
                  </span>
                </div>
                {selectedMedication.meal && (
                  <div className="detail-row">
                    <span className="detail-label">{t("Meal:")}</span>
                    <span className="detail-value">
                      {selectedMedication.meal}
                    </span>
                  </div>
                )}
                {selectedMedication.route && (
                  <div className="detail-row">
                    <span className="detail-label">{t("Route:")}</span>
                    <span className="detail-value">
                      {selectedMedication.route}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">{t("Quantity:")}</span>
                  <span className="detail-value">
                    {selectedMedication.quantity}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h5>
                  <i className="fa fa-calendar"></i> {t("Schedule Information")}
                </h5>
                <div className="detail-row">
                  <span className="detail-label">{t("Start Date:")}</span>
                  <span className="detail-value">
                    {selectedMedication.startDate}
                  </span>
                </div>
                {selectedMedication.endDate && (
                  <div className="detail-row">
                    <span className="detail-label">{t("End Date:")}</span>
                    <span className="detail-value">
                      {selectedMedication.endDate}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">{t("Medicine Status:")}</span>
                  <span className="detail-value">
                    {selectedMedication.medicineStatus}
                  </span>
                </div>
                {selectedMedication.daysRemaining !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">{t("Days Remaining:")}</span>
                    <span className="detail-value">
                      {selectedMedication.daysRemaining}
                    </span>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h5>
                  <i className="fa fa-user-md"></i> {t("Prescriber Information")}
                </h5>
                <div className="detail-row">
                  <span className="detail-label">{t("Given By:")}</span>
                  <span className="detail-value">
                    {selectedMedication.givenBy}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("Given Date:")}</span>
                  <span className="detail-value">
                    {selectedMedication.givenDate}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h5>
                  <i className="fa fa-flag-checkered"></i> {t("Status Information")}
                </h5>
                <div className="detail-row">
                  <span className="detail-label">{t("Final Dose:")}</span>
                  <span
                    className={`detail-value ${selectedMedication.finalDose === "Yes" ? "text-danger" : "text-success"}`}
                  >
                    {selectedMedication.finalDose === "Yes"
                      ? t("Yes - Final Dose")
                      : t("No - Regular Dose")}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("Status:")}</span>
                  <span className="detail-value">
                    {selectedMedication.type}
                  </span>
                </div>
                {selectedMedication.source && (
                  <div className="detail-row">
                    <span className="detail-label">{t("Source:")}</span>
                    <span className="detail-value">
                      {selectedMedication.source}
                    </span>
                  </div>
                )}
              </div>

              {selectedMedication.remarks && (
                <div className="detail-section">
                  <h5>
                    <i className="fa fa-comment"></i> {t("Remarks")}
                  </h5>
                  <div className="detail-row">
                    <span className="detail-value">
                      {selectedMedication.remarks}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {isFilterModalOpen && (
        <Modal
          visible={isFilterModalOpen}
          setVisible={setIsFilterModalOpen}
          modalWidth="40vw"
          Header={t("Medication Filters")}
        >
          <div className="row p-3">
            <div className="col-12">
              <ReactSelect
                placeholderName={t("Medication Type")}
                dynamicOptions={[
                  { label: t("All"), value: "All" },
                  { label: t("Active"), value: "Active" },
                  { label: t("Completed"), value: "Completed" },
                ]}
              />
            </div>
            <div className="col-12 mt-3 text-right">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setIsFilterModalOpen(false)}
              >
                {t("Apply Filters")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MedicationCalendar;
