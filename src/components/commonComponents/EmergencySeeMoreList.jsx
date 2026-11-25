import React, { Suspense, useCallback } from "react";
import SeeMoreSlideScreen from "../UI/SeeMoreSlideScreen";
import EMGPersonalDetailsOfPatient from "../FrameMenu/Emergency/EMGPersonalDetailsOfPatient";
import { useTranslation } from "react-i18next";
// The frame menu answers with a component name (`URL`); this is what that name
// means. Exported so the screen builder's frame-menu action loads the same
// screens from this one list rather than a copy that drifts.
export const EMERGENCY_FRAME_COMPONENTS = {
  BillingDetails:()=> import("../FrameMenu/Emergency/BillingDetails.jsx"),
  EMGMedicineRequisition:()=> import("../FrameMenu/MedicineRequisition.jsx"),
  MedicationAdministrationRecord:()=> import("../FrameMenu/MedicationAdministrationRecord.jsx"),
  MedicationAdministrationRecordCalendar:()=> import("../FrameMenu/MedicationAdministrationRecordCalendar.jsx"),
  VitalSignChart:()=> import("../FrameMenu/Emergency/VitalSignChart.jsx"),
  InvestigationView:()=> import("../FrameMenu/InvestigationView.jsx"),
  FinalDiagnosis:()=> import("../FrameMenu/FinalDiagnosis.jsx"),
  Discharge:()=> import("../FrameMenu/Emergency/Discharge.jsx"),
  DischargeSummary:()=> import("../FrameMenu/DischargeSummary.jsx"),
  UploadPatientDocuments:()=> import("../FrameMenu/UploadPatientDocuments.jsx"),
  AntibioticChart:()=>import("../FrameMenu/AntibioticChart.jsx"),
  DamaConsentForm:()=>import("../FrameMenu/DamaConsentForm.jsx"),
  MinorProcedureConsentForm:()=>import("../FrameMenu/MinorProcedureConsentForm.jsx"),
  HighRiskConsentForm:()=>import("../FrameMenu/HighRiskConsentForm.jsx"),
  BloodTransfusionMonitoring:()=>import("../FrameMenu/BloodTransfusionMonitoring.jsx"),
  IPDAdmissionOrder:()=>import("../FrameMenu/Emergency/IPDAdmissionOrder.jsx"),
  InTakeOutPutChart:()=>import("../FrameMenu/Emergency/InTakeOutPutChart.jsx"),
  PainManagementTool:()=>import("../FrameMenu/PainManagementTool.jsx"),
  FallsRiskAssessment:()=>import("../FrameMenu/FallsRiskAssessment.jsx"),
  PhysicalExamination:()=>import("../FrameMenu/PhysicalExamination.jsx"),
  'A&ETriageRecord':()=>import("../FrameMenu/Emergency/A&ETriageRecord.jsx"),
  BloodTransfusionReaction:()=>import("../FrameMenu/BloodTransfusionReaction.jsx"),
  FetalDisposalForm:()=>import("../FrameMenu/FetalDisposalForm.jsx"),
  PatientPropertyForm:()=>import("../FrameMenu/PatientPropertyForm.jsx"),
  MedicalCareCheckList:()=>import("../FrameMenu/MedicalCareCheckList.jsx"),
  NutritionAssessment:()=>import("../FrameMenu/NutritionAssessment.jsx"),
  LeaveAgainstMedicalAdvice:()=>import("../FrameMenu/LeaveAgainstMedicalAdvice.jsx"),
  HandHygieneAudit:()=>import("../FrameMenu/Emergency/HandHygieneAudit.jsx"),
  PressureSoreAssessment:()=>import("../FrameMenu/PressureSoreAssessment.jsx"),
  RefferalLetter:()=>import("../FrameMenu/Emergency/RefferalLetter.jsx"),
  NoteCreater:()=>import("../FrameMenu/Emergency/NoteCreater.jsx"),
  NoteFinder:()=>import("../FrameMenu/Emergency/NoteFinder.jsx"),
  PatientAllergy:()=>import ("../FrameMenu/PatientAllergy.jsx"),

  /* These components already existed but were never in this map, so any frame
     row pointing at them rendered "Component not found". Mapping them makes
     the Day Care frame's clinical screens work. Emergency only gains a row
     where its own f_framemenumaster already lists one, so nothing it shows
     today changes. */
  Clearance:()=> import("../FrameMenu/Emergency/Clearance.jsx"),
  ShiftToIPD:()=> import("../FrameMenu/Emergency/ShiftToIPD.jsx"),
  BedShift:()=> import("../FrameMenu/Emergency/BedShift.jsx"),
  PanelChange:()=> import("../FrameMenu/Emergency/PanelChange.jsx"),
  PanelApprovalRequest:()=> import("../FrameMenu/Emergency/PanelApprovalRequest.jsx"),
  EmergencyNote:()=> import("../FrameMenu/Emergency/EmergencyNote.jsx"),
  SampleCollection:()=> import("../FrameMenu/Emergency/SampleCollection.jsx"),
  BloodGasChart:()=> import("../FrameMenu/Emergency/BloodGasChart.jsx"),
  DialysisForm:()=> import("../FrameMenu/Emergency/DialysisForm.jsx"),
  NursingProgressNote:()=> import("../FrameMenu/Emergency/NursingProgressNote.jsx"),
  DoctorProgressNote:()=> import("../FrameMenu/Emergency/DoctorProgressNote.jsx"),

  // Nursing assessment / notes - the forms Day Care asked for by name.
  NursingInitialAssessment:()=> import("../FrameMenu/NursingInitialAssessmentForm.jsx"),
  NursingNote:()=> import("../FrameMenu/NursingNote.jsx"),
  NursingCarePlanandProgress:()=> import("../FrameMenu/NursingCarePlanandProgress.jsx"),
  NursingERAssessment:()=> import("../FrameMenu/NursingERAssessment.jsx")
};

function EmergencySeeMoreList({ ModalComponent, setSeeMore, data, isShowPatient, handleBindFrameMenu,setVisible,refreshAndReopen }) {
  const [t] = useTranslation();

  // const importComponent = (path) => {
  //   // let fullPath = ""
  //   // if (path === "VitalSignChart") {
  //   //   fullPath = `../FrameMenu/${path}.jsx`
  //   // } else {
  //   //   fullPath = `../FrameMenu/Emergency/${path}.jsx`
  //   // }
  //   return React.lazy(() =>
  //     import(`../FrameMenu/Emergency/${path}.jsx`)
  //       .then((module) => ({ default: module.default }))
  //       .catch(() => ({ default: () => <div>Component not found: {path}</div> }))
  //   );
  // };

  const componentMap={
    BillingDetails:()=> import("../FrameMenu/Emergency/BillingDetails.jsx"),
    EMGMedicineRequisition:()=> import("../FrameMenu/MedicineRequisition.jsx"),
    MedicationAdministrationRecord:()=> import("../FrameMenu/MedicationAdministrationRecord.jsx"),
    MedicationAdministrationRecordCalendar:()=> import("../FrameMenu/MedicationAdministrationRecordCalendar.jsx"),
    VitalSignChart:()=> import("../FrameMenu/Emergency/VitalSignChart.jsx"),
    InvestigationView:()=> import("../FrameMenu/InvestigationView.jsx"),
    FinalDiagnosis:()=> import("../FrameMenu/FinalDiagnosis.jsx"),
    Discharge:()=> import("../FrameMenu/Emergency/Discharge.jsx"),
    DischargeSummary:()=> import("../FrameMenu/DischargeSummary.jsx"),
    UploadPatientDocuments:()=> import("../FrameMenu/UploadPatientDocuments.jsx"),
    AntibioticChart:()=>import("../FrameMenu/AntibioticChart.jsx"),
    DamaConsentForm:()=>import("../FrameMenu/DamaConsentForm.jsx"),
    MinorProcedureConsentForm:()=>import("../FrameMenu/MinorProcedureConsentForm.jsx"),
    HighRiskConsentForm:()=>import("../FrameMenu/HighRiskConsentForm.jsx"),
    BloodTransfusionMonitoring:()=>import("../FrameMenu/BloodTransfusionMonitoring.jsx"),
    IPDAdmissionOrder:()=>import("../FrameMenu/Emergency/IPDAdmissionOrder.jsx"),
    InTakeOutPutChart:()=>import("../FrameMenu/Emergency/InTakeOutPutChart.jsx"),
    PainManagementTool:()=>import("../FrameMenu/PainManagementTool.jsx"),
    FallsRiskAssessment:()=>import("../FrameMenu/FallsRiskAssessment.jsx"),
    PhysicalExamination:()=>import("../FrameMenu/PhysicalExamination.jsx"),
    'A&ETriageRecord':()=>import("../FrameMenu/Emergency/A&ETriageRecord.jsx"),
    BloodTransfusionReaction:()=>import("../FrameMenu/BloodTransfusionReaction.jsx"),
    FetalDisposalForm:()=>import("../FrameMenu/FetalDisposalForm.jsx"),
    PatientPropertyForm:()=>import("../FrameMenu/PatientPropertyForm.jsx"),
    MedicalCareCheckList:()=>import("../FrameMenu/MedicalCareCheckList.jsx"),
    NutritionAssessment:()=>import("../FrameMenu/NutritionAssessment.jsx"),
    LeaveAgainstMedicalAdvice:()=>import("../FrameMenu/LeaveAgainstMedicalAdvice.jsx"),
    HandHygieneAudit:()=>import("../FrameMenu/Emergency/HandHygieneAudit.jsx"),
    PressureSoreAssessment:()=>import("../FrameMenu/PressureSoreAssessment.jsx"),
    RefferalLetter:()=>import("../FrameMenu/Emergency/RefferalLetter.jsx"),
    NoteCreater:()=>import("../FrameMenu/Emergency/NoteCreater.jsx"),
    NoteFinder:()=>import("../FrameMenu/Emergency/NoteFinder.jsx"),
    PatientAllergy:()=>import ("../FrameMenu/PatientAllergy.jsx"),

    /* These components already existed but were never in this map, so any frame
       row pointing at them rendered "Component not found". Mapping them makes
       the Day Care frame's clinical screens work. Emergency only gains a row
       where its own f_framemenumaster already lists one, so nothing it shows
       today changes. */
    Clearance:()=> import("../FrameMenu/Emergency/Clearance.jsx"),
    // Frame menu "Shift To IPD" (f_framemenumaster ID 146, URl ShiftToIPD).
    ShiftToIPD:()=> import("../FrameMenu/Emergency/ShiftToIPD.jsx"),
    BedShift:()=> import("../FrameMenu/Emergency/BedShift.jsx"),
    PanelChange:()=> import("../FrameMenu/Emergency/PanelChange.jsx"),
    PanelApprovalRequest:()=> import("../FrameMenu/Emergency/PanelApprovalRequest.jsx"),
    EmergencyNote:()=> import("../FrameMenu/Emergency/EmergencyNote.jsx"),
    SampleCollection:()=> import("../FrameMenu/Emergency/SampleCollection.jsx"),
    BloodGasChart:()=> import("../FrameMenu/Emergency/BloodGasChart.jsx"),
    DialysisForm:()=> import("../FrameMenu/Emergency/DialysisForm.jsx"),
    NursingProgressNote:()=> import("../FrameMenu/Emergency/NursingProgressNote.jsx"),
    DoctorProgressNote:()=> import("../FrameMenu/Emergency/DoctorProgressNote.jsx"),

    // Nursing assessment / notes - the forms Day Care asked for by name.
    NursingInitialAssessment:()=> import("../FrameMenu/NursingInitialAssessmentForm.jsx"),
    NursingNote:()=> import("../FrameMenu/NursingNote.jsx"),
    NursingCarePlanandProgress:()=> import("../FrameMenu/NursingCarePlanandProgress.jsx"),
    NursingERAssessment:()=> import("../FrameMenu/NursingERAssessment.jsx")
  }
  const importComponent = (path, header) => {
    if (header) {
      const loader = componentMap[path];
      if (!loader) {
        return React.lazy(() =>
          Promise.resolve({
            default: () => <div>{t("Component not found:")} {path}</div>,
          })
        );
      }
      return React.lazy(() =>
        loader()
          .then((module) => ({ default: module.default }))
          .catch(() => ({
            default: () => <div>{t("Component not found:")} {path}</div>,
          }))
      );
    }
    // else {
    //   return React.lazy(() =>
    //     import(`./FrameMenu/${path}.jsx`)
    //       .then((module) => ({ default: module.default }))
    //       .catch(() => ({ default: () => <div>Component not found: {path}</div> }))
    //   );
    // }
  };

  function BillingSeeMoreList(handleBindFrameMenu, data) {
    let patientDetail = {
      ...data,
      transactionID: data.TID, patientID: data?.PatientID,
    }
    // Shared IPD screens (e.g. Discharge Summary) read lower-case gender/status; the
    // emergency row only has Gender/AgeSex ("50 YRS/M") and Status.
    // if (!patientDetail.gender) {
    //   const sex = String(data?.Gender ?? data?.AgeSex?.split("/")?.pop() ?? "").trim().toUpperCase();
    //   patientDetail.gender = sex.startsWith("F") ? "Female" : sex.startsWith("M") ? "Male" : sex;
    // }
    // if (!patientDetail.status) patientDetail.status = data?.Status ?? "";

    let seeMore = [];
    for (let i = 0; i < handleBindFrameMenu?.length; i++) {
      const { URL, FileName } = handleBindFrameMenu[i];
      const Component = importComponent(URL,true);
      const Obj = {
        name: FileName,
        component: (
          <div key={i}>
            <Suspense fallback={<div>{t("Loading...")}</div>}>
              {isShowPatient && <EMGPersonalDetailsOfPatient data={data} />}
              <Component data={patientDetail} setActionType={() => { }} menuItemData={{ id: "1" }} toggleAction={() => { }} setVisible={setVisible}
               refreshAndReopen={refreshAndReopen} 
                handleBindFrameMenu={handleBindFrameMenu}
                handleComponentRender={handleComponentRender}
                />
            </Suspense>
          </div>
        ),
      };
      seeMore.push(Obj);
    }
    return seeMore;
  }
  const handleComponentRender = async (data, items) => {

    const componentData = BillingSeeMoreList([items], data);
    ModalComponent(componentData[0]?.name, componentData[0]?.component);
    const forsetSeeMore = BillingSeeMoreList(handleBindFrameMenu, data);
    setSeeMore(forsetSeeMore);
  };

  const handleBindFrameMenuByRoleIDS = useCallback(
    (dataBind) => {
      return dataBind?.map((items, _) => {
        return {
          ...items,
          name: items?.FileName,
        };
      });
    },
    [handleBindFrameMenu]
  );

  return (
    <>
      <div style={{ position: "relative" }}>
        <SeeMoreSlideScreen
          seeMore={handleBindFrameMenuByRoleIDS(handleBindFrameMenu)}
          handleChangeComponent={(item) => handleComponentRender(data, item)}
          data={data}
        />
      </div>
    </>
  );
}

export default EmergencySeeMoreList;
