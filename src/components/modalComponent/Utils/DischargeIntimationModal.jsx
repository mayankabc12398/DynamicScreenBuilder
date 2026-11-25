import React, { useEffect } from "react";
import { GetAuthorization } from "../../../networkServices/BillingsApi";
import { useTranslation } from "react-i18next";

const DischargeIntimationModal = ({ item, handleChangeModel }) => {
  const [t] = useTranslation();
  useEffect(() => {
    handleChangeModel(item);
  }, [item]);
  //console.log(item);
  return (
    <div className="row">
      <>
        <div className="col-sm-12 text-center">
          <div>
            <label className="text-danger bold"> {t("Are you Sure!")}</label>
          </div>
          <label> {t("You want")} {item?.Step} ?</label>
        </div>
      </>
    </div>
  );
};

export default DischargeIntimationModal;
