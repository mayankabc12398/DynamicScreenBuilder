import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";

export default function DuplicatePatientAlertModel({setVisible}) {
  const [t] = useTranslation();
  return (
    <div className="row p-2 d-flex justify-content-center text-center">
      <h2 style={{fontWeight:"bold"}}>{t("Patient is already Admited. Do you want to admit her child.")} </h2>
    </div>
  );
}
