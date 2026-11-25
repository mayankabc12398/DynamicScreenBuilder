import React from "react";
import { useTranslation } from "react-i18next";
// import ViewThreaterRecord from "./preOperativeChecklist/ViewThreaterRecord";
import PreDialysisVitalSign from "./PreDialysisVitalSign";
import Accordion from "../UI/Accordion";

import Laboratory from "./Laboratory";
import Biomedical from "./Biomedical";
import DentalChecklist from "./DentalChecklist";
import PyysiotherapyCheckList from "./PyysiotherapyCheckList";
import TheatreChecklist from "./TheatreChecklist";
import WardChecklist from "./WardChecklist";
import IcuChecklist from "./IcuChecklist";
import DishargeFollowUp from "./DishargeFollowUp";

const CheckListForOpenHeartSurgery = ({ data }) => {
  const [t] = useTranslation();
  return (
    <div>
      <Accordion
        title={t(
          "LABORATORY - Laboratory workup should be done a week before the operation date"
        )}
        defaultValue={true}
      >
        <Laboratory data={data} />
      </Accordion>
      <Accordion
        title={t("BIOMEDICAL ENGINEERING CHECKLIST")}
        defaultValue={false}
      >
        <Biomedical data={data} />
      </Accordion>

      <Accordion title={t("DENTAL CHECKLIST")} defaultValue={false}>
        <DentalChecklist data={data} />
      </Accordion>
      <Accordion title={t("PHYSIOTHERAPY CHECKLIST")} defaultValue={false}>
        <PyysiotherapyCheckList data={data} />
      </Accordion>

      <Accordion title={t("THEATRE CHECKLIST")} defaultValue={false}>
        <TheatreChecklist data={data} />
      </Accordion>

      <Accordion title={t("ICU CHECKLIST")} defaultValue={false}>
        <IcuChecklist data={data} />
      </Accordion>
      <Accordion title={t("WARD CHECKLIST")} defaultValue={false}>
        <WardChecklist data={data} />
      </Accordion>
      <Accordion title={t("POST DISCHARGE FOLLOW UP")} defaultValue={false}>
        <DishargeFollowUp data={data} />
      </Accordion>
    </div>
  );
};

export default CheckListForOpenHeartSurgery;
