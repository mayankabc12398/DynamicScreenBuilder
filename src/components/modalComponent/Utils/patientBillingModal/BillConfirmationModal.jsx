import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function BillConfirmationModal({
  data,
  handleSaveAfterConfirmationModal,
  paymentMethod,
  setHandleModelData,
}) {
  debugger;
  const [t] = useTranslation();

  return (
    <div className="p-2">
      {" "}
      <h4 className="text-center text-lg-start">
        <b>
          {t("This patient(")} {data?.PName} )is currently admitted (Status :
          {data?.STATUS ? data?.STATUS : t("No Status")}). Are you sure you want to
          save the bill?
        </b>
      </h4>
      <div
        className="d-flex justify-content-between p-2 "
        style={{ marginBottom: "-1rem" }}
      >
        <button
          className="btn-success btn btn-lg"
          onClick={() => handleSaveAfterConfirmationModal("OPD",paymentMethod,"btnTypeOPD")}
        >
          {t("Save as Opd")}
        </button>
        <button
          className={`btn-success btn btn-lg ${paymentMethod[0].PaymentModeID !== 4 ? "d-none":""}`}
          onClick={() => handleSaveAfterConfirmationModal("IPD",paymentMethod,"btnTypeIPD")}
        >
          {t("Save as Ipd")}
        </button>
        <button className="btn-success btn btn-lg" onClick={setHandleModelData}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
