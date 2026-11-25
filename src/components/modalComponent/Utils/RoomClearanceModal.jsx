import React from "react";
import { useTranslation } from "react-i18next";

const RoomClearanceModal = () => {
  const [t] = useTranslation();
  return (
    <>
      <div className="row">
        <div className="col-sm-12 text-center">
          <label className="text-danger bold">
            {t("Please Room Clearance.")}
          </label>
        </div>
      </div>
    </>
  );
};

export default RoomClearanceModal;
