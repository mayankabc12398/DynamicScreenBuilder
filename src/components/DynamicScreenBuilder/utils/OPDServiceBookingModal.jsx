import React, { Suspense, lazy, useEffect, useState } from "react";
import { GetPatientDoctorAppointmentDetails } from "@app/networkServices/OPDConfirmation";

const OPDServiceBooking = lazy(() => import("@app/pages/frontOffice/OPD/OPDServiceBooking"));

const given = (v) => v !== undefined && v !== null && v !== "";

/**
 * OPD Service Booking, opened the way the Confirmation page opens it.
 *
 * The page (pages/frontOffice/OPD/Confirmation.jsx) hands it four props:
 *
 *   UHID             the patient — the row's PatientID ("" for a new booking)
 *   appointmentID    the row's App_ID — 0 for a new booking, never empty: the
 *                    API binds it as an Int32 and rejects null
 *   TestData         [ GetPatientDoctorAppointmentDetails(appointmentID).data ]
 *                    — fetched first, as handleOpenOPDServiceBooking does; []
 *                    for a new booking
 *   appointmentDate  the day a new booking is for (the calendar's day)
 *
 * A built screen opens it through "Open modal" with only the row in hand, so
 * this works all four out of the row. Any of them named on the action
 * (Props: UHID = {{row.PatientID}} …) wins over what is read off the row.
 *
 * Booking done (handleConfirmationSubmit) closes the dialog and runs a
 * `handleConfirmationSubmit` callback when the action wired one — that is
 * where the screen's search goes, the page's handleSubmit.
 */
export default function OPDServiceBookingModal({
  data,
  UHID,
  appointmentID,
  TestData,
  appointmentDate,
  handleConfirmationSubmit,
  onClose,
}) {
  const row = data && typeof data === "object" ? data : {};
  const uhid = given(UHID) ? UHID : row.PatientID ?? row.UHID ?? "";
  const appId = given(appointmentID) ? appointmentID : row.App_ID ?? row.appointmentID ?? row.AppointmentID ?? 0;
  const date = given(appointmentDate) ? appointmentDate : row.appointmentDate ?? row.date ?? undefined;
  const hasTests = Array.isArray(TestData) && TestData.length > 0;
  const isNew = !appId || Number(appId) === 0;

  const [tests, setTests] = useState(hasTests ? TestData : isNew ? [] : null);
  useEffect(() => {
    if (hasTests || isNew) return undefined;
    let alive = true;
    GetPatientDoctorAppointmentDetails(appId)
      .then((res) => alive && setTests([res?.data]))
      .catch(() => alive && setTests([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  if (tests === null) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <OPDServiceBooking
        UHID={uhid}
        appointmentID={isNew ? 0 : appId}
        TestData={tests}
        appointmentDate={date}
        handleConfirmationSubmit={() => {
          onClose?.();
          if (typeof handleConfirmationSubmit === "function") handleConfirmationSubmit();
        }}
      />
    </Suspense>
  );
}
