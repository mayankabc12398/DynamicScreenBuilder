import React from "react";
import { useTranslation } from "react-i18next";

const BillFinalizeModal = () => {
  const [t] = useTranslation();
  return (
    <>
      <div className="row">
        <div className="col-sm-12 text-center">
          <label className="text-danger bold">{t("Please Bill Finalize.")}</label>
        </div>
      </div>
    </>
  );
};

export default BillFinalizeModal;
