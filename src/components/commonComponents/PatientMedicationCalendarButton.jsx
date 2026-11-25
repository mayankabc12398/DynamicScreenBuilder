import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Modal from "../modalComponent/Modal";
import MedicationCalendar from "../modalComponent/Utils/MedicationCalendar";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { loadPharmacyPatientMedicines } from "../../utils/patientMedicationSources";

/**
 * Pharmacy Issue — "Medication Calendar" button beside the selected patient.
 *
 * THE ASK
 *   The doctor's screens already have a month calendar of everything prescribed to a
 *   patient (the Medication Calendar modal on View Consultation) and the ward has the MAR.
 *   The pharmacist issuing a new medicine has neither, and wants to look before issuing.
 *   So: once a patient is selected on the issue screens, a button opens that calendar for
 *   that patient, and the button is highlighted when the patient still has doses scheduled
 *   from today onwards, so the pharmacist notices a running course without opening anything.
 *
 * WHAT THE CALENDAR SHOWS HERE
 *   Not just the doctor feed. utils/patientMedicationSources.js merges the doctor
 *   prescriptions, the pharmacy's own prescription list and the IPD ward medication (MAR),
 *   each row tagged with its source, so OPD and IPD medicines both appear. The pending
 *   check below uses the same loader, so the highlight and the calendar never disagree.
 *
 * FLAG
 *   fin_global_resources  ShowPharmacyMedicationCalendar  = 1 shows the button.
 *   Anything else (including no row at all) renders nothing and makes no request, so
 *   clients that did not ask for this see exactly the screen they had.
 *
 * Mounted on /pharmacy-issue and /ipd-pharmacy-issue next to the membership-card banner.
 */

export const PHARMACY_MEDICATION_CALENDAR_FLAG = "ShowPharmacyMedicationCalendar";
/* The laboratory has its own switch. Same calendar, different department and a
   different decision to make about showing it, so one flag must not turn the
   other on. */
export const LAB_MEDICATION_CALENDAR_FLAG = "ShowLabMedicationCalendar";

// GetGlobalResources can arrive either as a bare array or wrapped in `.data`.
const isFlagOn = (globalResources, flagName) => {
  const list = Array.isArray(globalResources)
    ? globalResources
    : globalResources?.data || [];
  return list?.find((item) => item?.Name === flagName)?.Value == 1;
};

export const useMedicationCalendarFlag = (
  flagName = PHARMACY_MEDICATION_CALENDAR_FLAG,
) => {
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  return useMemo(
    () => isFlagOn(GetGlobalResources, flagName),
    [GetGlobalResources, flagName],
  );
};

export const usePharmacyMedicationCalendarFlag = () =>
  useMedicationCalendarFlag(PHARMACY_MEDICATION_CALENDAR_FLAG);

/** Medicines whose course is still running (not completed, ends today or later). */
export const countPendingMedicines = (medicines, today = moment()) => {
  if (!Array.isArray(medicines)) return 0;
  const startOfToday = moment(today).startOf("day");
  return medicines.filter((item) => {
    if (String(item?.MedicineStatus || "").toLowerCase() === "completed") {
      return false;
    }
    const endDate = moment(item?.end_date);
    return endDate.isValid() && !endDate.isBefore(startOfToday, "day");
  }).length;
};

function PatientMedicationCalendarButton({
  patient,
  respclass = "col-xl-2 col-md-3 col-sm-4 col-12",
  /* Which switch shows it, and how it is drawn. "icon" is for a grid cell, where
     a full-width labelled button does not fit. Both default to what Pharmacy
     Issue already had, so that screen is untouched. */
  flagName = PHARMACY_MEDICATION_CALENDAR_FLAG,
  variant = "button",
  title,
  /* Whether to look up the patient's medicines on mount, purely to decide whether
     to highlight the control.
     That check costs several requests per patient (the three feeds, and the ward
     one is a call per admission), which is fine beside ONE selected patient on
     Pharmacy Issue - what it was built for - and ruinous in a grid, where it fires
     once per row: an 87-row laboratory worklist produced hundreds of calls.
     So the grid variant does not prefetch. It fetches when the calendar is opened,
     and nothing before that. */
  prefetchPending = variant !== "icon",
}) {
  const [t] = useTranslation();
  const enabled = useMedicationCalendarFlag(flagName);
  const deptLedgerNo = useLocalStorage("userData", "get")?.deptLedgerNo;
  const patientID = patient?.PatientID;

  const [pendingCount, setPendingCount] = useState(0);
  const [open, setOpen] = useState(false);
  // Guards against a slow response for a previous patient landing after a newer one.
  const requestRef = useRef(0);

  /* MedicationCalendar refetches whenever its `data` prop CHANGES IDENTITY
     (useEffect on [data, currentDate]). A caller that builds the patient inline -
     a grid cell does, once per row per render - hands it a new object every time
     its screen re-renders, and the calendar then refetches on a loop for as long
     as it is open.

     So the object handed down is rebuilt only when the patient it describes
     actually changes. The fields in the key are the ones the feeds read:
     PatientID for all three, and the admission hints the ward feed uses to decide
     whether to look for a MAR at all. */
  const patientKey = [
    patient?.PatientID,
    patient?.TransactionID ?? patient?.transactionID ?? patient?.TID ?? "",
    patient?.PatientType ?? "",
    patient?.IPDNo ?? "",
  ].join("|");

  const stablePatient = useMemo(
    () => patient || null,
    // The key is the identity; `patient` itself is a new object on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patientKey],
  );

  // One loader for both the highlight and the calendar itself. Stable for the same
  // patient, for the same reason as above.
  const loadMedicines = useCallback(
    ({ monthYear }) =>
      loadPharmacyPatientMedicines({
        patient: stablePatient,
        monthYear,
        deptLedgerNo,
      }),
    [stablePatient, deptLedgerNo],
  );

  useEffect(() => {
    setOpen(false);
    if (!enabled || !patientID || !prefetchPending) {
      setPendingCount(0);
      return;
    }

    const ticket = ++requestRef.current;
    let cancelled = false;

    (async () => {
      try {
        const result = await loadMedicines({
          monthYear: moment().format("MM-YYYY"),
        });
        if (cancelled || ticket !== requestRef.current) return;
        setPendingCount(
          countPendingMedicines(Array.isArray(result) ? result : result?.rows),
        );
      } catch (error) {
        console.error("Medication calendar pending check failed", error);
        if (!cancelled && ticket === requestRef.current) setPendingCount(0);
      }
    })();

    return () => {
      cancelled = true;
    };
    // patientID is the identity that matters; `patient` itself is a new object on every
    // search, and re-running on it would re-fetch for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, patientID, prefetchPending]);

  if (!enabled || !patientID) return null;

  const hasPending = pendingCount > 0;
  const hoverText =
    title ||
    (hasPending
      ? `${t("Medicine pending for this patient")}: ${pendingCount}`
      : t("View Medication Calendar"));

  const calendarModal = open ? (
    <Modal
      visible={open}
      setVisible={setOpen}
      Header={t("Medication Calendar")}
      modalWidth="97vw"
      footer={<></>}
    >
      <MedicationCalendar
        data={stablePatient}
        setShowMedicationCalendar={setOpen}
        loadMedicines={loadMedicines}
      />
    </Modal>
  ) : null;

  /* Grid cell: the icon alone, coloured when a course is still running, with no
     column wrapper of its own. */
  if (variant === "icon") {
    return (
      <>
        <span
          role="button"
          title={hoverText}
          aria-label={hoverText}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          style={{
            cursor: "pointer",
            color: hasPending ? "#b45309" : "#0d6efd",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <i className="fa fa-calendar" aria-hidden="true" />
          {hasPending ? (
            <span style={{ fontSize: 10, fontWeight: 700 }}>{pendingCount}</span>
          ) : null}
        </span>
        {calendarModal}
      </>
    );
  }

  return (
    <div className={respclass}>
      <button
        type="button"
        className={`btn btn-sm btn-primary rx-med-calendar-btn${
          hasPending ? " rx-med-calendar-btn--pending" : ""
        }`}
        title={hoverText}
        onClick={() => setOpen(true)}
      >
        <i className="fa fa-calendar mr-1" aria-hidden="true"></i>
        {t("Rx Calendar")}
        {hasPending && (
          <span className="rx-med-calendar-btn__count">{pendingCount}</span>
        )}
      </button>

      {calendarModal}
    </div>
  );
}

export default PatientMedicationCalendarButton;
