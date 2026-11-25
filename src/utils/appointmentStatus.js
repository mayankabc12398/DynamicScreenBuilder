/**
 * Doctor appointment list - status of a pending appointment row, and the legend.
 *
 * Mirrors the row colouring of the classic list (PendingAppointmentPatientList.getRowClass)
 * so both views tell the same story: one status per row, checked in this order.
 * Colours are soft tints that read as a full row fill and as a pill background; `dot` is
 * the saturated companion used for the pill dot and the row accent bar.
 */
export const APPOINTMENT_STATUS = {
  urgent: { key: "urgent", label: "Urgent", colour: "#fecaca", dot: "#dc2626" },
  emergency: { key: "emergency", label: "Emergency", colour: "#fbd5d5", dot: "#c81010" },
  tempPending: { key: "tempPending", label: "Pending Temp Status", colour: "#fef3c7", dot: "#d97706" },
  refer: { key: "refer", label: "Refer", colour: "#dcfce7", dot: "#16a34a" },
  viewedIn: { key: "viewedIn", label: "Viewed & IN", colour: "#dbeafe", dot: "#2563eb" },
  hold: { key: "hold", label: "Hold", colour: "#fde68a", dot: "#ca8a04" },
  waiting: { key: "waiting", label: "Waiting", colour: "#f1f5f9", dot: "#94a3b8" },
};

/** Legend entries in the order the classic screen shows them. */
export const APPOINTMENT_LEGEND = [
  APPOINTMENT_STATUS.emergency,
  APPOINTMENT_STATUS.tempPending,
  APPOINTMENT_STATUS.refer,
  APPOINTMENT_STATUS.viewedIn,
  APPOINTMENT_STATUS.hold,
  APPOINTMENT_STATUS.urgent,
];

const on = (v) => Number(v) === 1;

/** The status of one pending-list row (same precedence as the classic row colour). */
export const getAppointmentStatus = (item) => {
  if (on(item?.IsDoctorConsultancyUrgent)) return APPOINTMENT_STATUS.urgent;
  if (on(item?.IsEmergency) || on(item?.Emergency)) return APPOINTMENT_STATUS.emergency;
  if (on(item?.TemperatureRoom)) return APPOINTMENT_STATUS.tempPending;
  if (on(item?.IsRefer) || on(item?.Refer)) return APPOINTMENT_STATUS.refer;
  if (on(item?.IsView)) return APPOINTMENT_STATUS.viewedIn;
  if (on(item?.Hold)) return APPOINTMENT_STATUS.hold;
  return APPOINTMENT_STATUS.waiting;
};
