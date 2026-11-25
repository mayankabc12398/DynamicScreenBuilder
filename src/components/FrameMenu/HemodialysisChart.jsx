import React from "react";
import { useTranslation } from "react-i18next";
// import ViewThreaterRecord from "./preOperativeChecklist/ViewThreaterRecord";
import PreDialysisVitalSign from "./PreDialysisVitalSign";
import Accordion from "../UI/Accordion";
import DialysisOrder from "./DialysisOrder";
import MachineCheck from "./MachineCheck";
import DialysisExamination from "./DialysisExamination";
import IntraDialyticObservations from "./IntraDialyticObservations";
import HemodialysisTable from "./HemoDialysiaTable";
import Diagnosis from "./Diagnosis";
import PostDlalyticObservation from "./PostDlalyticObservation";
// import IntraOperativeNursingRecord from "./preOperativeChecklist/IntraOperativeNursingRecord";
// import RecoveryCheckForm from "./RecoveryCheckForm";
// import Recoverypayload from "./preOperativeChecklist/RecoveryForm";
// import SwabsInstrumentAndSharpsCount from "./preOperativeChecklist/SwabsInstrumentAndSharpsCount";

const HemodialysisChart = ({ data }) => {
  const [t] = useTranslation();
  return (
    <div>
      <Accordion title={t("PreDialysis Vital Sign")} defaultValue={false}>
        <PreDialysisVitalSign data={data} />
      </Accordion>
      <Accordion title={t("Dialysis Order")} defaultValue={false}>
        <DialysisOrder data={data} />
      </Accordion>
      <Accordion title={t("Machine Check")} defaultValue={false}>
        <MachineCheck data={data} />
      </Accordion>
      <Accordion title={t("Dialysis Examinations")} defaultValue={false}>
        <DialysisExamination data={data} />
      </Accordion>
      <Accordion title={t("Intra Dialytic Observations")} defaultValue={false}>
        <IntraDialyticObservations data={data} />
      </Accordion>
       <Accordion title={t("Diagnosis")} defaultValue={false}>
        <Diagnosis data={data} />
      </Accordion>
     <Accordion title={t("Post Dlalytic Observation")} defaultValue={false}>
        <PostDlalyticObservation data={data} />
      </Accordion>
      <Accordion title={t("Hemodialysis Table")} defaultValue={false}>
        <HemodialysisTable data={data} />
      </Accordion>
     
    </div>
  );
};

export default HemodialysisChart;
