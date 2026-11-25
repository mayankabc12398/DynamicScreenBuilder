import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SaveButton from "@app/components/UI/SaveButton";
import CancelButton from "@app/components/UI/CancelButton";

/**
 * "Do you want to release this patient for IPD?" — the one action on the
 * emergency panel that is a question rather than a screen.
 *
 * The reference page (EmergencyPatientSearch) raises this as a page modal with
 * a `handleAPI` and a Release button. A built screen reaches the same action
 * through `utils/appModals`, which means it has to arrive as a component like
 * every other entry — so the question and its two buttons live here, and the
 * call itself stays in the entry's `save`, next to every other write.
 *
 * `onSave` is the host's: it runs the entry's save, reports, closes the dialog
 * and refreshes the grid the row came from.
 */
export default function ReleaseForIpdConfirm({ data, onSave, onClose }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const release = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onSave?.(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "6px 2px" }}>
      <h3 className="text-center">
        <strong style={{ color: "red" }}>{t("Do You Want To Release Patient For IPD ?")}</strong>
      </h3>
      <div className="ftr_btn" style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
        <SaveButton btnName={t("Release")} onClick={release} disabled={busy} />
        <CancelButton cancleBtnName={t("Cancel")} onClick={() => onClose?.()} />
      </div>
    </div>
  );
}
