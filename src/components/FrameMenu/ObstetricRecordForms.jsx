import React from "react";
import { useTranslation } from "react-i18next";
import Accordion from "../UI/Accordion";
import ObstetricRecord from "./ObstetricRecord";
import MidwifesClinic from "./MidwifesClinic";
import LabourRecord from "./LabourRecord";
import DeliveryGenerationsForm from "./DeliveryGenerationsForm";
import ReportOnLabour from "./ReportOnLabour";

const ObstetricRecordForms = ({ data }) => {
  const [t] = useTranslation();
  return (
    <div>
      <Accordion title={t("Obstetric Record")} defaultValue={true}>
        <ObstetricRecord data={data} section={1} />
      </Accordion>
      <Accordion title={t("Midwifes Clinic")} defaultValue={false}>
        <MidwifesClinic data={data} section={2} />
      </Accordion>
      <Accordion title={t("Labour Record")} defaultValue={false}>
        <LabourRecord data={data} section={3} />
      </Accordion>
      <Accordion title={t("Report On Labour")} defaultValue={false}>
        <ReportOnLabour data={data} section={4} />
      </Accordion>
      <Accordion title={t("Delivery Generations Form")} defaultValue={false}>
        <DeliveryGenerationsForm data={data} section={5} />
      </Accordion>
    </div>
  );
};

export default ObstetricRecordForms;
