import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Modal from "../modalComponent/Modal";
import PatientNotesModal from "../modalComponent/Utils/MedicalStore/PatientNotesModal";
import { GetPharmacyPatientNotes } from "../../networkServices/pharmacyPatientNoteApi";

/**
 * KMSI - Pharmacy Issue "Patient Notes" button, beside the Medication Calendar button.
 *
 * When a patient is selected it counts the notes pharmacy users wrote for that patient.
 * With at least one note the button is highlighted and carries the count, so the
 * pharmacist sees "somebody left a note" without opening anything. Clicking opens every
 * note with its date-time and writer, and a box to write a new one for this patient.
 * (Reprint only reads them.)
 *
 * FLAG  fin_global_resources  PharmacyPatientNotes  = 0 hides the button (and makes no
 *       request). Any other value, or no row, shows it.
 *
 * Mounted on /pharmacy-issue and /ipd-pharmacy-issue.
 */

export const PHARMACY_PATIENT_NOTES_FLAG = "PharmacyPatientNotes";

export const usePharmacyPatientNotesFlag = () => {
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  return useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find((item) => item?.Name === PHARMACY_PATIENT_NOTES_FLAG);
    return !row || String(row?.Value).trim() !== "0";
  }, [GetGlobalResources]);
};

function PatientNotesButton({ patient, respclass = "col-xl-2 col-md-3 col-sm-4 col-12" }) {
  const [t] = useTranslation();
  const enabled = usePharmacyPatientNotesFlag();
  const patientID = patient?.PatientID;

  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  // A slow answer for the previous patient must not land on the new one.
  const requestRef = useRef(0);

  useEffect(() => {
    setOpen(false);
    if (!enabled || !patientID) {
      setCount(0);
      return;
    }
    const ticket = ++requestRef.current;
    (async () => {
      const result = await GetPharmacyPatientNotes(patientID, "", { silent: true });
      if (ticket !== requestRef.current) return;
      setCount(result.ok ? result.notes.length : 0);
    })();
  }, [enabled, patientID]);

  if (!enabled || !patientID) return null;

  const hasNotes = count > 0;

  return (
    <div className={respclass}>
      <button
        type="button"
        className={`btn btn-sm btn-primary rx-patient-notes-btn${hasNotes ? " rx-patient-notes-btn--has" : ""}`}
        title={
          hasNotes
            ? `${t("Notes written for this patient")}: ${count}`
            : t("View or add notes for this patient")
        }
        onClick={() => setOpen(true)}
      >
        <i className="far fa-sticky-note mr-1" aria-hidden="true"></i>
        {t("Pharma Notes")}
        {hasNotes && <span className="rx-patient-notes-btn__count">{count}</span>}
      </button>

      {open && (
        <Modal
          visible={open}
          setVisible={setOpen}
          Header={t("Patient Notes")}
          modalWidth="70vw"
          footer={<></>}
        >
          <PatientNotesModal patient={patient} canWrite={true} onSaved={setCount} />
        </Modal>
      )}
    </div>
  );
}

export default PatientNotesButton;
