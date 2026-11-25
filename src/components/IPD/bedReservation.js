/* =============================================================================
   Bed reservation — the shape shared by the reserve popup, the reservations
   list, the admission screen's bed grid and the tests. Pure: no React.

   A reservation is SOFT. It marks a bed as held for a patient on a date; it
   never stops another patient being admitted to it. The screen's job is to make
   sure the user sees who holds it before they decide.
   ============================================================================= */

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);
const pick = (row, k) => asText(row?.[k] ?? row?.[k[0].toUpperCase() + k.slice(1)] ?? "");

/* makeApiRequest does not throw on failure — it hands back the raw axios
   response — so an absent `success` is the only reliable failure signal. */
export const readApiResult = (res) => ({
  ok: res?.success === true,
  data: res?.data,
  rows: Array.isArray(res?.data) ? res.data : [],
  message: asText(res?.message),
});

const pad = (n) => String(n).padStart(2, "0");
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const plusDaysIso = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* The admission screen keeps dates as "29/Sep/2026" or "29-Sep-2026" or a Date;
   the reserve popup's date input wants "2026-09-29". */
export const toIsoDate = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const s = asText(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/-]([A-Za-z]{3})[\/-](\d{4})/);
  if (m) {
    const parsed = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
    }
  }
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

export const normaliseReservation = (r) => ({
  id: Number(r?.id ?? r?.ID ?? 0) || 0,
  patientID: pick(r, "patientID"),
  patientName: pick(r, "patientName").trim(),
  age: pick(r, "age"),
  gender: pick(r, "gender"),
  mobile: pick(r, "mobile"),
  roomID: Number(r?.roomID ?? r?.RoomID ?? 0) || 0,
  roomName: pick(r, "roomName"),
  roomNo: pick(r, "roomNo"),
  bedNo: pick(r, "bedNo"),
  floor: pick(r, "floor"),
  ipdCaseTypeID: Number(r?.ipdCaseTypeID ?? r?.IPDCaseTypeID ?? 0) || 0,
  roomType: pick(r, "roomType"),
  bookingDate: pick(r, "bookingDate").slice(0, 10),
  bookingDateDisplay: pick(r, "bookingDateDisplay") || pick(r, "bookingDate").slice(0, 10),
  doctorName: pick(r, "doctorName").trim(),
  panelName: pick(r, "panelName"),
  remarks: pick(r, "remarks"),
  isAdmitted: Number(r?.isAdmitted ?? r?.IsAdmitted ?? 0) || 0,
  isCancel: Number(r?.isCancel ?? r?.IsCancel ?? 0) || 0,
  status: pick(r, "status") || "Reserved",
  reservedBy: pick(r, "reservedBy").trim(),
  reservedOn: pick(r, "reservedOn"),
  cancelReason: pick(r, "cancelReason"),
});

/* "Ward A-101 / Bed:3 / Floor:2", from whichever parts the row carries. */
export const bedLabel = (r) => {
  const head = [r?.roomName, r?.roomNo].map(asText).filter(Boolean).join("-");
  return [head, r?.bedNo ? `Bed:${r.bedNo}` : "", r?.floor ? `Floor:${r.floor}` : ""]
    .filter(Boolean)
    .join(" / ");
};

/**
 * The live reservation (if any) on a bed, from the list the screen fetched for
 * the room type. Prefers a reservation for the admission date; otherwise the
 * soonest one, so a bed held for tomorrow still shows as held today.
 */
export const reservationFor = (reservations, roomID, admissionDateIso) => {
  const mine = (reservations || []).filter(
    (r) => String(r?.roomID) === String(roomID) && !r?.isCancel && !r?.isAdmitted,
  );
  if (!mine.length) return null;
  const exact = admissionDateIso ? mine.find((r) => r.bookingDate === admissionDateIso) : null;
  if (exact) return exact;
  return [...mine].sort((a, b) => asText(a.bookingDate).localeCompare(asText(b.bookingDate)))[0];
};

/* Whether a reservation belongs to the patient being admitted. */
export const isOwnReservation = (reservation, patientID) =>
  !!reservation && !!patientID && String(reservation.patientID) === String(patientID);

/**
 * Empty string when the reservation can be sent, otherwise what is missing.
 * The past is refused here as well as in the API, so the user is told before
 * a round trip.
 */
export const validateReservation = (form, patientID, roomID, today) => {
  if (!patientID) return "Select the patient first";
  if (!roomID) return "Select the bed to reserve";
  const date = asText(form?.bookingDate).trim();
  if (!date) return "Select the reservation date";
  if (today && date < today) return "A bed cannot be reserved for a past date";
  return "";
};

export const toReservationPayload = (form, { patientID, roomID, ipdCaseTypeID, doctorID, panelID }) => ({
  patientID: asText(patientID),
  roomID: Number(roomID) || 0,
  ipdCaseTypeID: Number(ipdCaseTypeID) || 0,
  bookingDate: asText(form?.bookingDate).trim(),
  doctorID: Number(doctorID) || 0,
  panelID: Number(panelID) || 0,
  remarks: asText(form?.remarks).trim(),
});
