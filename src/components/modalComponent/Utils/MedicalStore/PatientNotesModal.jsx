import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TextAreaInput from "../../../formComponent/TextAreaInput";
import { notify } from "../../../../utils/utils";
import {
  GetPharmacyPatientNotes,
  SavePharmacyPatientNote,
} from "../../../../networkServices/pharmacyPatientNoteApi";

/**
 * KMSI - Pharmacy patient notes.
 *
 * One modal, two places:
 *   - Pharmacy Issue > Patient Notes button (canWrite): a box to write a new note for the
 *     selected patient, then every note ever written for the patient below it.
 *   - Reprint > sticky-note action (read-only): the same list for the patient of that bill.
 *     Notes that carry this bill's transaction are marked "this bill".
 *
 * Who wrote a note and when are stamped by the API (token + server clock).
 *
 * @param patient  { PatientID, PName | PatientName }
 * @param bill     { TransactionID, BillNo, BillDate }  the Reprint row (optional; a note
 *                 written with it is stored under that bill)
 * @param canWrite show the write box
 * @param onSaved  called with the new note count after a save (the issue-screen badge
 *                 and the Reprint action use it)
 */
export default function PatientNotesModal({ patient, bill, canWrite = false, onSaved }) {
  const [t] = useTranslation();
  const patientID = patient?.PatientID || bill?.PatientID || "";
  const patientName = patient?.PName || patient?.PatientName || bill?.PName || "";
  const transactionID = bill?.TransactionID ? String(bill.TransactionID) : "";

  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!patientID) return;
    setLoading(true);
    const result = await GetPharmacyPatientNotes(patientID, transactionID);
    setLoading(false);
    setNotes(result.notes);
    setMessage(result.ok ? "" : result.message);
    if (!result.ok) notify(result.message, "error");
    onSaved?.(result.notes.length);
    // onSaved is a parent callback; re-running on its identity would refetch for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID, transactionID]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const note = draft.trim();
    if (!note) {
      notify(t("Please write the note first"), "warn");
      return;
    }
    setSaving(true);
    const result = await SavePharmacyPatientNote({
      patientID,
      transactionID,
      billNo: bill?.BillNo || "",
      note,
    });
    setSaving(false);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    notify(t("Note saved"), "success");
    setDraft("");
    load();
  };

  return (
    <div className="rx-pnotes">
      <div className="rx-pnotes__head">
        <div>
          <b>{patientName}</b>
          {patientID && <span className="rx-pnotes__uhid">{patientID}</span>}
        </div>
        {bill?.BillNo && (
          <div className="rx-pnotes__bill">
            {t("Bill No")}: <b>{bill.BillNo}</b>
            {bill?.BillDate ? ` (${bill.BillDate})` : ""}
          </div>
        )}
        <div className="rx-pnotes__count">
          {t("Notes")}: <b>{notes.length}</b>
        </div>
      </div>

      {canWrite && (
        <div className="rx-pnotes__write">
          <div className="row">
            <TextAreaInput
              id="rxPatientNoteDraft"
              name="rxPatientNoteDraft"
              className="form-control"
              respclass="col-12"
              lable={t("Note for this patient")}
              placeholder=""
              rows={3}
              maxLength={2000}
              value={draft}
              showTooltipCount={true}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
          <div className="rx-pnotes__actions">
            <span className="rx-pnotes__hint">
              {t("Saved with the date and time and your user name")}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-success rx-pnotes__save"
              disabled={saving || !draft.trim()}
              onClick={save}
            >
              <i className="fas fa-save mr-1" aria-hidden="true"></i>
              {t("Save Note")}
            </button>
          </div>
        </div>
      )}

      {loading && <div className="rx-pnotes__empty">{t("Loading")}...</div>}
      {!loading && message && <div className="rx-pnotes__error">{message}</div>}
      {!loading && !message && notes.length === 0 && (
        <div className="rx-pnotes__empty">{t("No notes have been written for this patient yet")}</div>
      )}

      {notes.length > 0 && (
        <ul className="rx-pnotes__list">
          {notes.map((n) => (
            <li
              key={n.NoteID}
              className={`rx-pnotes__item${n.IsCurrentBill ? " rx-pnotes__item--current" : ""}`}
            >
              <div className="rx-pnotes__meta">
                <span className="rx-pnotes__when">
                  <i className="far fa-clock mr-1" aria-hidden="true"></i>
                  {n.EntryDateTime}
                </span>
                <span className="rx-pnotes__who">
                  <i className="far fa-user mr-1" aria-hidden="true"></i>
                  {n.EmployeeName || n.UserName}
                  {n.UserName && n.EmployeeName && n.UserName !== n.EmployeeName ? ` (${n.UserName})` : ""}
                </span>
                {n.BillNo && (
                  <span className="rx-pnotes__billno">
                    <i className="fas fa-receipt mr-1" aria-hidden="true"></i>
                    {n.BillNo}
                  </span>
                )}
                {n.IsCurrentBill && <span className="rx-pnotes__tag">{t("this bill")}</span>}
              </div>
              <div className="rx-pnotes__text">{n.Note}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
