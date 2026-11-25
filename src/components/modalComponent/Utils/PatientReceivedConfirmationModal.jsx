import React from "react";
import { useTranslation } from "react-i18next";

const PatientReceivedConfirmationModal = () => {
  const [t] = useTranslation();
  return (
    <div className="text-center">
      <label>{t("Do You Want To Receive Patient?")}</label>
    </div>
  );
};

export default PatientReceivedConfirmationModal;
