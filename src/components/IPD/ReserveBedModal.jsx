import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Modal from "../modalComponent/Modal";
import DatePicker from "../formComponent/DatePicker";
import TextAreaInput from "../formComponent/TextAreaInput";
import { notify } from "../../utils/utils";
import { SaveBedReservation } from "../../networkServices/DoctorApi";
import {
  bedLabel, normaliseReservation, readApiResult, toIsoDate, todayIso,
  toReservationPayload, validateReservation,
} from "./bedReservation";

/* =============================================================================
   Reserve Bed — the popup behind the admission screen's button.

   Shows who and which bed, asks for the date the bed is held for (defaulting
   to the admission date on the screen, else today) and a remark, and saves to
   advance_room_booking through the API. If the bed is already held for someone
   on that date the API says who, and this shows it rather than stacking a
   second reservation behind them.

   Built on the project's DatePicker and TextAreaInput so it reads like the
   admission form beside it.
   ============================================================================= */

const { VITE_DATE_FORMAT } = import.meta.env;

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

function ReserveBedModal({
  visible,
  setVisible,
  patient,          // { PatientID, PName/Pname, Title, Age, Gender, Mobile }
  bed,              // { RoomID, Name }
  ipdCaseTypeID,
  roomTypeName,
  doctorID,
  panelID,
  defaultDate,
  onReserved,
}) {
  const [t] = useTranslation();
  const today = useMemo(() => todayIso(), []);
  const [form, setForm] = useState({ bookingDate: null, remarks: "" });
  const [holder, setHolder] = useState(null);
  const [busy, setBusy] = useState(false);

  const patientID = asText(patient?.PatientID);
  const patientName = [patient?.Title, patient?.PName ?? patient?.Pname].map(asText).filter(Boolean).join(" ");
  const roomID = bed?.RoomID ?? bed?.RoomId ?? "";

  useEffect(() => {
    if (!visible) return;
    const iso = toIsoDate(defaultDate) || today;
    setForm({ bookingDate: moment(iso, "YYYY-MM-DD").toDate(), remarks: "" });
    setHolder(null);
  }, [visible, defaultDate, today]);

  const bookingIso = form.bookingDate ? moment(form.bookingDate).format("YYYY-MM-DD") : "";

  const handleReserve = async () => {
    const problem = validateReservation({ bookingDate: bookingIso }, patientID, roomID, today);
    if (problem) {
      notify(t(problem), "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await SaveBedReservation(
        toReservationPayload(
          { bookingDate: bookingIso, remarks: form.remarks },
          { patientID, roomID, ipdCaseTypeID, doctorID, panelID },
        ),
      );
      const { ok, data, message } = readApiResult(res);
      if (ok) {
        notify(message || t("Bed reserved"), "success");
        if (typeof onReserved === "function") onReserved(data);
        setVisible(false);
      } else {
        /* The API answers a clash with the holder's row; showing it is more
           useful than the toast alone. */
        if (data && typeof data === "object" && (data.patientID || data.PatientID)) {
          setHolder(normaliseReservation(data));
        }
        notify(message || t("Failed to reserve the bed"), "warn");
      }
    } catch (e) {
      notify(t("Failed to reserve the bed"), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      Header={t("Reserve Bed")}
      modalWidth="45vw"
      footer={
        <div className="d-flex justify-content-end" style={{ gap: 8 }}>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setVisible(false)}>
            {t("Cancel")}
          </button>
          <button type="button" className="btn btn-sm btn-primary px-3" onClick={handleReserve} disabled={busy}>
            {busy ? t("Please wait...") : t("Reserve")}
          </button>
        </div>
      }
    >
      <div className="row g-4 m-2">
        <div className="col-md-6 col-12">
          <div className="text-muted small">{t("Patient")}</div>
          <div>
            <strong>{patientName || "-"}</strong>
            {patientID ? <div className="text-muted small">{patientID}</div> : null}
            {[patient?.Age, patient?.Gender].filter(Boolean).length ? (
              <div className="text-muted small">{[patient?.Age, patient?.Gender].filter(Boolean).join(" / ")}</div>
            ) : null}
          </div>
        </div>
        <div className="col-md-6 col-12">
          <div className="text-muted small">{t("Bed")}</div>
          <div>
            <strong>{bed?.Name || "-"}</strong>
            {roomTypeName ? <div className="text-muted small">{roomTypeName}</div> : null}
          </div>
        </div>

        <DatePicker
          className="custom-calendar"
          id="rsvBookingDate"
          name="bookingDate"
          lable={t("Reserve For Date")}
          placeholder={VITE_DATE_FORMAT}
          respclass={"col-md-6 col-12"}
          minDate={new Date()}
          value={form.bookingDate}
          handleChange={(e) => setForm((f) => ({ ...f, bookingDate: e?.target?.value ?? null }))}
        />
        <TextAreaInput
          id="rsvRemarks"
          name="remarks"
          className="form-control"
          lable={t("Remarks")}
          respclass="col-12"
          rows={2}
          maxLength={500}
          value={form.remarks}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
        />

        {holder && (
          <div className="col-12">
            <div className="alert alert-warning py-2 mb-0 small" role="note">
              <i className="fa fa-info-circle mr-1" />
              {t("Already reserved for")} <strong>{holder.patientName}</strong> ({holder.patientID})
              {" · "}{bedLabel(holder) || holder.roomName}{" · "}{holder.bookingDateDisplay}
              {holder.reservedBy ? ` · ${t("by")} ${holder.reservedBy}` : ""}
            </div>
          </div>
        )}

        <div className="col-12 text-muted small">
          {t("A reservation holds the bed softly: it shows who it is held for, and does not stop another admission.")}
        </div>
      </div>
    </Modal>
  );
}

export default ReserveBedModal;
