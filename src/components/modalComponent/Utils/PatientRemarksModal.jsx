import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../../UI/customTable";
import { notify } from "../../../utils/utils";
import { SavePatientRemark } from "../../../networkServices/opdserviceAPI";

/* "User Remarks" (OPD Booking and IPD Billing): add a remark for the patient (patient_remarks) and see
   every remark kept so far, newest first. onSaved receives the refreshed list so the
   booking page can start (or keep) blinking its button. */
export default function PatientRemarksModal({ patientId, remarks = [], onSaved }) {
  const [t] = useTranslation();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = text.trim();
    if (!value) {
      notify(t("Please enter remarks"), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await SavePatientRemark({ PatientID: patientId, Remarks: value });
      if (res?.success) {
        notify(res?.message || t("Remarks saved successfully"), "success");
        setText("");
        onSaved?.(Array.isArray(res?.data) ? res.data : []);
      } else {
        notify(res?.message || t("Failed to save remarks"), "error");
      }
    } catch (error) {
      notify(t("Failed to save remarks"), "error");
    } finally {
      setSaving(false);
    }
  };

  const THEAD = [
    { name: t("S.No."), width: "5%" },
    { name: t("Remarks"), width: "50%" },
    { name: t("Entry By"), width: "20%" },
    { name: t("Entry Date & Time"), width: "25%" },
  ];

  const tbody = (remarks || []).map((item, index) => ({
    SNo: index + 1,
    Remarks: item?.Remarks || "-",
    EntryBy: item?.EntryBy || "-",
    EntryDateTime: item?.EntryDateTime || "-",
  }));

  return (
    <div>
      <div className="row px-2 pb-2 align-items-end">
        <div className="col-10">
          <label className="mb-1" style={{ fontSize: "12px", fontWeight: 600 }}>
            {t("Remarks")}
          </label>
          <textarea
            className="form-control"
            rows={2}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("Write remarks for this patient")}
          />
        </div>
        <div className="col-2">
          <button
            className="btn btn-sm btn-primary w-100"
            type="button"
            onClick={handleSave}
            disabled={saving || !patientId}
          >
            {t("Save")}
          </button>
        </div>
      </div>

      {tbody.length > 0 ? (
        <Tables thead={THEAD} tbody={tbody} />
      ) : (
        <div className="text-center p-3 text-muted">{t("No Remarks Found")}</div>
      )}
    </div>
  );
}
