import React from "react";
import { useTranslation } from "react-i18next";

const NurseClearanceModal = () => {
  const [t] = useTranslation();
  return (
    <>
      <div className="row">
        <div className="col-sm-12 text-center">
          <label className="text-danger bold">
            {t("Please Nursing Clearance.")}
          </label>
        </div>
      </div>
    </>
  );
};

export default NurseClearanceModal;
