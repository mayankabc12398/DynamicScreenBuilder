import React from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useTranslation } from "react-i18next";

const ConfirmBox = ({ visible, header, message, onConfirm, onCancel }) => {
  const [t] = useTranslation();
  const isMobile = window.innerWidth <= 768;

  return (
    <ConfirmDialog
      group="declarative"
      visible={visible}
      header={header || t("Confirmation")}
      message={message || t("Are you sure?")}
      icon="pi pi-exclamation-triangle"
      draggable={false}
      closable={false}
      style={{ width: isMobile ? "80vw" : "24vw" }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            type="button"
            className="modalCancelButton"
            onClick={onCancel}
          >
            {t("No")}
          </button>
          <button
            type="button"
            className="modalConfirmButton"
            onClick={onConfirm}
          >
            {t("Yes")}
          </button>
        </div>
      }
    />
  );
};

export default ConfirmBox;
