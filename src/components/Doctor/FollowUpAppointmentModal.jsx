import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../modalComponent/Modal";
import { notify } from "../../utils/utils";
import {
  BookFollowUpAppointment,
  GetFollowUpAppointments,
} from "../../networkServices/DoctorApi";


/* =============================================================================
   Book the patient's follow-up, from the prescription.

   The doctor writes a Next Visit date; this asks whether to turn it into an
   actual appointment. The appointment is created UNCONFIRMED — exactly the state
   an appointment booked online arrives in — so it lands in the front office's
   Confirmation screen and is confirmed, billed and given its visit there.

   Nothing here bills or opens a visit. The doctor is making a request; the front
   office decides the final slot, which is why the modal says so on its face
   rather than leaving the doctor to assume the patient is booked.
   ============================================================================= */

const C = {
  ink: "#12313a", sub: "#64757d", line: "#d9e4e8", soft: "#f7fafb",
  blue: "#1667a8", amber: "#8a6100", amberBg: "#fdf6e3",
  green: "#1b7f4f", white: "#fff",
};

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

const pad = (n) => String(n).padStart(2, "0");

/* makeApiRequest does not throw on failure — it hands back the raw axios
   response — so an absent `success` is the only reliable failure signal. */
export const readApiResult = (res) => ({
  ok: res?.success === true,
  rows: Array.isArray(res?.data) ? res.data : [],
  message: asText(res?.message),
});

/**
 * The prescription keeps Next Visit as "29-Sep-2026" (or a Date); a date input
 * wants "2026-09-29".
 */
export const toIsoDate = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const s = asText(value).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

export const normaliseAppointment = (row) => ({
  appID: Number(row?.app_ID ?? row?.App_ID ?? row?.appId ?? 0) || 0,
  appNo: asText(row?.appNo ?? row?.AppNo),
  doctorID: asText(row?.doctorID ?? row?.DoctorID),
  doctorName: asText(row?.doctorName ?? row?.DoctorName).trim(),
  date: asText(row?.appointmentDateDisplay ?? row?.AppointmentDateDisplay)
    || asText(row?.appointmentDate ?? row?.AppointmentDate),
  time: asText(row?.appointmentTime ?? row?.AppointmentTime),
  visitType: asText(row?.visitType ?? row?.VisitType),
  notes: asText(row?.notes ?? row?.Notes),
  isConform: Number(row?.isConform ?? row?.IsConform ?? 0) || 0,
});

/**
 * Empty string when the booking can be sent, otherwise what is missing.
 *
 * The past is refused here as well as in the API: the doctor should be told
 * before a round trip, and the API cannot trust the browser's clock anyway.
 */
export const validateBooking = (form, todayIso) => {
  if (!asText(form?.doctorID).trim()) return "Select the doctor for the follow-up";
  const date = asText(form?.appointmentDate).trim();
  if (!date) return "Select the follow-up date";
  if (todayIso && date < todayIso) return "A follow-up cannot be booked in the past";
  return "";
};

export const toBookingPayload = (form, patientID) => ({
  patientID,
  doctorID: asText(form?.doctorID).trim(),
  appointmentDate: asText(form?.appointmentDate).trim(),
  appointmentTime: asText(form?.appointmentTime).trim(),
  remarks: asText(form?.remarks).trim(),
  // A follow-up is a return visit by definition.
  visitType: "Old Patient",
});

const Label = ({ children }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 4 }}>
    {children}
  </div>
);

function FollowUpAppointmentModal({
  visible,
  setVisible,
  patient,
  defaultDoctorID,
  doctorOptions,
  defaultDate,
  defaultRemarks,
  onBooked,
}) {
  const [t] = useTranslation();

  const patientID = patient?.PatientID || patient?.MRNo || "";
  const patientName = asText(patient?.Pname || patient?.PatientName);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const [form, setForm] = useState({
    doctorID: "",
    appointmentDate: "",
    appointmentTime: "09:00",
    remarks: "",
  });
  const [existing, setExisting] = useState([]);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /* Seeded from the prescription every time the modal opens, so reopening after
     the doctor changed the Next Visit date picks the new one up. */
  useEffect(() => {
    if (!visible) return;
    setForm({
      doctorID: asText(defaultDoctorID),
      appointmentDate: toIsoDate(defaultDate),
      appointmentTime: "09:00",
      remarks: asText(defaultRemarks),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, defaultDoctorID, defaultDate, defaultRemarks]);

  /* t is left out of the deps on purpose: react-i18next hands back a new
     function identity on every render, and depending on it turns this into a
     fetch-per-render loop. */
  const loadExisting = useCallback(async () => {
    if (!patientID) return;
    try {
      const { ok, rows } = readApiResult(await GetFollowUpAppointments(patientID));
      // "No record found" is a patient with nothing booked, not an error.
      setExisting(ok ? rows.map(normaliseAppointment) : []);
    } catch (e) {
      setExisting([]);
    }
  }, [patientID]);

  /* Only once the modal is open. The prescription screen is heavy enough
     without a lookup for a popup nobody has asked for yet. */
  useEffect(() => {
    if (visible) loadExisting();
  }, [visible, loadExisting]);

  const handleBook = async () => {
    if (!patientID) {
      notify(t("No patient is loaded"), "error");
      return;
    }
    const problem = validateBooking(form, todayIso);
    if (problem) {
      notify(t(problem), "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await BookFollowUpAppointment(toBookingPayload(form, patientID));
      if (res?.success) {
        notify(res?.message || t("Follow-up appointment requested"), "success");
        if (typeof onBooked === "function") onBooked(res?.data);
        setVisible(false);
      } else {
        /* The API reports an existing appointment for the same doctor and day
           this way. It is not a failure the doctor needs to retry — it is the
           answer to what they asked for — so the list is refreshed to show it. */
        notify(res?.message || t("Failed to book the follow-up appointment"), "warn");
        await loadExisting();
      }
    } catch (e) {
      notify(t("Failed to book the follow-up appointment"), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  const options = Array.isArray(doctorOptions) ? doctorOptions : [];
  const knownDoctor = options.some((o) => asText(o?.value) === asText(form.doctorID));

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      Header={t("Book Follow-up Appointment")}
      modalWidth="46vw"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            className="btn btn-sm text-white"
            onClick={() => setVisible(false)}
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary px-4"
            onClick={handleBook}
            disabled={busy}
          >
            <i className="fa fa-calendar-check mr-1" />{" "}
            {busy ? t("Please wait...") : t("Book Appointment")}
          </button>
        </div>
      }
    >
      <div style={{ padding: 4 }}>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>
          {patientName}
          {patientID ? ` · ${patientID}` : ""}
        </div>

        {/* The doctor is asking, not booking. Saying so here is the difference
            between the patient being told "you are booked" and "you will be
            called to confirm". */}
        <div
          style={{
            background: C.amberBg,
            border: `1px solid #efe0b8`,
            color: C.amber,
            borderRadius: 6,
            padding: "7px 10px",
            fontSize: 11.5,
            marginBottom: 12,
          }}
        >
          <i className="fa fa-info-circle mr-1" />
          {t(
            "This creates an unconfirmed appointment. The front office confirms it and sets the final slot.",
          )}
        </div>

        {existing.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Label>{t("Already booked for this patient")}</Label>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
              <table
                className="table table-sm mb-0"
                style={{ fontSize: 11.5, background: C.white }}
              >
                <thead>
                  <tr style={{ background: C.soft }}>
                    <th>{t("Date")}</th>
                    <th>{t("Time")}</th>
                    <th>{t("Doctor")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {existing.map((a) => (
                    <tr key={a.appID}>
                      <td>{a.date}</td>
                      <td>{a.time}</td>
                      <td>{a.doctorName}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: a.isConform ? C.green : C.amber,
                            color: C.white,
                            fontWeight: 600,
                            padding: "3px 8px",
                          }}
                        >
                          {a.isConform ? t("Confirmed") : t("Awaiting confirmation")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-2">
            <Label>{t("Follow-up Date")}</Label>
            <input
              type="date"
              className="form-control form-control-sm"
              min={todayIso}
              value={form.appointmentDate}
              onChange={(e) => set("appointmentDate", e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-2">
            <Label>{t("Time")}</Label>
            <input
              type="time"
              className="form-control form-control-sm"
              value={form.appointmentTime}
              onChange={(e) => set("appointmentTime", e.target.value)}
            />
          </div>
          <div className="col-md-12 mb-2">
            <Label>{t("Doctor")}</Label>
            <select
              className="form-control form-control-sm"
              value={form.doctorID}
              onChange={(e) => set("doctorID", e.target.value)}
            >
              <option value="">{t("Select")}</option>
              {/* The consulting doctor may not be in the referral list this
                  screen loads; losing the default would silently book the
                  follow-up with nobody. */}
              {!knownDoctor && form.doctorID ? (
                <option value={form.doctorID}>
                  {asText(patient?.DName) || form.doctorID}
                </option>
              ) : null}
              {options.map((o) => (
                <option key={asText(o?.value)} value={asText(o?.value)}>
                  {asText(o?.label)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-12 mb-2">
            <Label>{t("Remarks")}</Label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default FollowUpAppointmentModal;
