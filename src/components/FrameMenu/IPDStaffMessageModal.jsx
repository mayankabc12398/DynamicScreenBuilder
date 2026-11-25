import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../utils/utils";
import {
  DeleteIPDStaffMessage,
  GetIPDStaffMessages,
  SaveIPDStaffMessage,
} from "../../networkServices/ipdStaffMessageApi";

const AUDIENCES = ["Both", "Nursing", "Emergency"];
const MAX_LENGTH = 1000;

/**
 * MSG popup on the IPD Billing Desk - add, edit and remove the messages shown to
 * Nursing and Emergency staff in the running banner at the top of the page.
 */
const IPDStaffMessageModal = ({ transactionId, patientName, onClose, onSaved }) => {
  const [t] = useTranslation();
  const [messages, setMessages] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [form, setForm] = useState({
    MessageID: 0,
    Message: "",
    MessageFor: "Both",
  });

  const loadMessages = async () => {
    setIsFetching(true);
    const apiResp = await GetIPDStaffMessages(transactionId);
    setMessages(apiResp?.success && Array.isArray(apiResp.data) ? apiResp.data : []);
    setIsFetching(false);
  };

  // Messages are patient wise, so switching patient reloads the list.
  useEffect(() => {
    loadMessages();
  }, [transactionId]);

  const resetForm = () =>
    setForm({ MessageID: 0, Message: "", MessageFor: "Both" });

  const handleSave = async () => {
    const message = form.Message.trim();
    if (!message) return notify(t("Please enter a message"), "error");
    if (message.length > MAX_LENGTH)
      return notify(t("Message should not exceed 1000 characters"), "warn");

    if (!Number(transactionId)) {
      return notify(t("Please select a patient first"), "error");
    }

    const apiResp = await SaveIPDStaffMessage({
      MessageID: Number(form.MessageID) || 0,
      TransactionID: Number(transactionId),
      Message: message,
      MessageFor: form.MessageFor,
    });

    if (!apiResp?.success) {
      return notify(apiResp?.message || t("Failed to save message"), "error");
    }

    notify(apiResp.message, "success");
    resetForm();
    await loadMessages();
    // Let the banner behind the popup pick the change up straight away.
    onSaved?.();
  };

  const handleRemove = async (messageID) => {
    const apiResp = await DeleteIPDStaffMessage(messageID);
    if (!apiResp?.success) {
      return notify(apiResp?.message || t("Failed to remove message"), "error");
    }

    notify(apiResp.message, "success");
    if (Number(form.MessageID) === Number(messageID)) resetForm();
    await loadMessages();
    onSaved?.();
  };

  const isEditing = Number(form.MessageID) > 0;

  const buttonStyle = (background, border) => ({
    padding: "6px 18px",
    fontSize: "13px",
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#ffffff",
    backgroundColor: background,
    border: `1px solid ${border}`,
    borderRadius: "4px",
    cursor: "pointer",
  });

  return (
    <div
      className="modal fade show d-block"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header py-2">
            <h5 className="modal-title">
              {t("Message for Nursing / Emergency Staff")}
              {/* Messages are patient wise, so name who this one belongs to. */}
              {patientName ? (
                <small className="text-muted ms-2">({patientName})</small>
              ) : null}
            </h5>
            <button
              type="button"
              aria-label={t("Close")}
              title={t("Close")}
              onClick={onClose}
              style={{
                width: "30px",
                height: "30px",
                padding: 0,
                fontSize: "20px",
                fontWeight: 700,
                lineHeight: "26px",
                color: "#ffffff",
                backgroundColor: "#dc3545",
                border: "1px solid #b02a37",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
          </div>

          <div className="modal-body pt-2">
            {/* Message spans the full width, with the audience and the actions on
                their own row underneath so nothing is squeezed against it. */}
            <div className="mb-2">
              <label className="form-label mb-1 fw-bold">{t("Message")}</label>
              <textarea
                className="form-control"
                rows={3}
                maxLength={MAX_LENGTH}
                value={form.Message}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, Message: e.target.value }))
                }
                placeholder={t("Type the message for staff")}
                style={{ resize: "vertical" }}
              />
              <small
                className={
                  form.Message.length > MAX_LENGTH * 0.9
                    ? "text-danger"
                    : "text-muted"
                }
              >
                {form.Message.length}/{MAX_LENGTH}
              </small>
            </div>

            <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-1">
              <div style={{ minWidth: "220px" }}>
                <label className="form-label mb-1 fw-bold">{t("For")}</label>
                <select
                  className="form-select"
                  value={form.MessageFor}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, MessageFor: e.target.value }))
                  }
                >
                  {AUDIENCES.map((audience) => (
                    <option key={audience} value={audience}>
                      {t(audience)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-flex gap-2">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={buttonStyle("#6c757d", "#5c636a")}
                  >
                    {t("Cancel")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleSave}
                  style={buttonStyle("#198754", "#146c43")}
                >
                  {isEditing ? t("Update") : t("Save")}
                </button>
              </div>
            </div>

            <hr className="my-3" />

            {isFetching ? (
              <div className="text-center py-3">{t("Loading")}...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-3 text-muted">
                {t("No messages added yet")}
              </div>
            ) : (
              <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
                <table className="table table-sm table-bordered mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "52%" }}>{t("Message")}</th>
                      <th style={{ width: "14%" }}>{t("For")}</th>
                      <th style={{ width: "20%" }}>{t("Last Updated")}</th>
                      <th style={{ width: "14%" }}>{t("Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((row) => (
                      <tr
                        key={row?.MessageID}
                        className={row?.IsActive ? "" : "text-muted"}
                      >
                        <td style={{ whiteSpace: "pre-wrap" }}>
                          {row?.Message}
                          {!row?.IsActive ? (
                            <span className="badge bg-secondary ms-2">
                              {t("Removed")}
                            </span>
                          ) : null}
                        </td>
                        <td>{row?.MessageFor}</td>
                        <td>
                          {row?.UpdatedDate || row?.CreatedDate || "-"}
                          <div className="small text-muted">
                            {row?.UpdatedByName || row?.CreatedByName || ""}
                          </div>
                        </td>
                        <td>
                          {row?.IsActive ? (
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                title={t("Edit")}
                                onClick={() =>
                                  setForm({
                                    MessageID: row?.MessageID,
                                    Message: row?.Message ?? "",
                                    MessageFor: row?.MessageFor || "Both",
                                  })
                                }
                                style={{
                                  ...buttonStyle("#0d6efd", "#0a58ca"),
                                  padding: "2px 10px",
                                  fontSize: "12px",
                                }}
                              >
                                {t("Edit")}
                              </button>
                              <button
                                type="button"
                                title={t("Remove")}
                                onClick={() => handleRemove(row?.MessageID)}
                                style={{
                                  ...buttonStyle("#dc3545", "#b02a37"),
                                  padding: "2px 10px",
                                  fontSize: "12px",
                                }}
                              >
                                {t("Remove")}
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer py-2">
            <button
              type="button"
              onClick={onClose}
              style={buttonStyle("#6c757d", "#5c636a")}
            >
              {t("Close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDStaffMessageModal;
