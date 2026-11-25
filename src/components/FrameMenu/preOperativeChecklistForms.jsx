import React from "react";
import Accordion from "../UI/Accordion";
import { useTranslation } from "react-i18next";
import ViewThreaterRecord from "../../pages/OT/OTPatientSearch/FrameMenu/preOperativeChecklist/ViewThreaterRecord";
import IntraOperativeNursingRecord from "../../pages/OT/OTPatientSearch/FrameMenu/preOperativeChecklist/IntraOperativeNursingRecord";
import RecoveryCheckForm from "../../pages/OT/OTPatientSearch/FrameMenu/RecoveryCheckForm";
import Recoverypayload from "../../pages/OT/OTPatientSearch/FrameMenu/preOperativeChecklist/RecoveryForm";
import SwabsInstrumentAndSharpsCount from "../../pages/OT/OTPatientSearch/FrameMenu/preOperativeChecklist/SwabsInstrumentAndSharpsCount";
// import IntraOperativeNursingRecord from "./preOperativeChecklist/IntraOperativeNursingRecord";
// import SurgerySafetyCheckList from "./preOperativeChecklist/ViewSurgerySafetyCheckList";

const preOperativeChecklistForms = ({ data }) => {
  const [t] = useTranslation();
  return (
    <div>
      <Accordion title={t("View TheaterRecord")} defaultValue={false}>
        <ViewThreaterRecord data={data} />
      </Accordion>
      <Accordion
        title={t("Visit Intra_operative_nursing_record")}
        defaultValue={false}
      >
        <IntraOperativeNursingRecord data={data} />
      </Accordion>
      <Accordion
        title={t("View SurgerySafetyCheckListNew")}
        defaultValue={false}
      >
        {t("working on it")}
        {/* <SurgerySafetyCheckList data={data} /> */}
      </Accordion>
      <Accordion title={t("immediateRecoveryCare")} defaultValue={false}>
        <RecoveryCheckForm noHead={true} />
      </Accordion>
      <Accordion title={t("Swabs Instrument Form")} defaultValue={false}>
        <SwabsInstrumentAndSharpsCount data={data} />
      </Accordion>
      <Accordion title={t("Recovery Form")} defaultValue={false}>
        <Recoverypayload data={data} />
      </Accordion>
    </div>
  );
};

export default preOperativeChecklistForms;
