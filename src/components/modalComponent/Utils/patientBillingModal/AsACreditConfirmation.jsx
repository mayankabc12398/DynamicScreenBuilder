import React from "react";
import { useTranslation } from "react-i18next";

function AsACreditConfirmation({ data }) {
  const [t] = useTranslation();
  return (
    <div>
      <h4 className="text-center text-lg-start">
        <b>
          {t("This patient(")} {data?.PName}) as credit , you cant't save !
        </b>
      </h4>
    </div>
  );
}

export default AsACreditConfirmation;
