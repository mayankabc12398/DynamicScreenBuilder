import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ColorCodingSearch from "../../commonComponents/ColorCodingSearch";
import MedicalClearanceModalTable from "../../UI/customTable/billings/MedicalClearanceModalTable";
import Input from "../../formComponent/Input";

const MedicalClearanceModal = ({ parentData,getPayloadData,MedDetail , handleSlideScreen}) => {
  const [t] = useTranslation();
  const initialValues = {
    deathover48hrs: "",
  };
  const [payload, setPayload] = useState({ ...initialValues });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const Thead = [
    t("S.No."),
    t("RequisitionDate"),
    t("RequisitionNo"),
    t("ToDepartment"),
    t("Status"),
    t("View Requisition"),
  ];

  useEffect(() => {
    getPayloadData(payload);
  }, [payload]);
  return (
    <>
      <div className="row">
        <div className="col-sm-12 d-flex align-items-center justify-content-center">
          <ColorCodingSearch label={t("Pending")} color="color-indicator-22-bg" />
          <ColorCodingSearch label={t("Close")} color="color-indicator-24-bg" />
          <ColorCodingSearch label={t("Reject")} color="color-indicator-25-bg" />
          <ColorCodingSearch label={t("Partial")} color="color-indicator-29-bg" />
        </div>
      </div>
      <div className="row mt-2">
        <MedicalClearanceModalTable THEAD={Thead} tbody={MedDetail} handleSlideScreen={handleSlideScreen}/>
      </div>
      <div className="row mt-2 d-flex justify-content-center">
        <Input
          type="checkbox"
          name="deathover48hrs"
          checked={payload?.deathover48hrs}
          handleChange={handleChange}
        />
        <label className="ml-2">{t("Check for clearance Medicion / Pharmacy")}</label>
      </div>
    </>
  );
};

export default MedicalClearanceModal;
