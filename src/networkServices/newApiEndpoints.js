import { BindReportData } from "./CollectionReportApi";
import { BindTransactionTypes } from "./finance";
import { BindVendor } from "./InventoryApi";
import { getPatientIndentAPI } from "./pharmecy";

export const apiUrlsNew = {
  test: "test",
  //  satish
  getIPDPatientsearchReport: "NursingWard/GetIPDPatientsearchReport",
  getViewIPDAdmissionRemark: "NursingWard/GetViewIPDAdmissionRemark",
  getPatientFinalMsg: "NursingWard/GetPatientFinalMsg",
  getFeedbackDetails: "HelpDesk/GetFeedbackDetails",
  updatePatientFeedbackStatus: "HelpDesk/UpdatePatientFeedbackStatus",
  getNoteDetail: "HelpDesk/GetNoteDetail",
  insertFeebackNotes: "HelpDesk/InsertFeebackNotes",
  saveAsing: "HelpDesk/SaveAsing",
  searchPatientFeedback: "HelpDesk/SearchPatientFeedback",
  sendMessage: "Chat/SendMessage",
  saveOrUpdateNoticBoardNews: "HelpDesk/SaveOrUpdateNoticBoardNews",
  getNoticBoardNews: "HelpDesk/GetNoticBoardNews",
  ViewNoticeBoardFileById: "helpdesk/ViewNoticeBoardFileById",
  saveOrUpdatePlanofAnesthesia: "EDP/OTMaster/SaveOrUpdatePlanofAnesthesia",
  getAllAnesthesiaDetails: "EDP/OTMaster/GetAllAnesthesiaDetails",
  getIPDIntraOPPatientObservationChart:
    "EDP/OTMaster/GetIPDIntraOPPatientObservationChart",
  damaConsentFormPdf: "Emergency/DamaConsentFormPdf",
  minorProcedureConsentFormPdf: "Emergency/MinorProcedureConsentFormPdf",
  highRiskConsentFormPdf: "Emergency/HighRiskConsentFormPdf",
  saveIpdAdmissionOrder: "Emergency/SaveIpdAdmissionOrder",
  getIpdAdmissionOrder: "Emergency/GetIpdAdmissionOrder",
  emergencyAdmissionRecord: "Emergency/EmergencyAdmissionRecord",
  bindAllergyTypeList: "Emergency/BindAllergyTypeList",
  saveOrUpdateAllergyType: "Emergency/SaveOrUpdateAllergyType",
  getCreateDocumentMasterList: "MRD/GetCreateDocumentMasterList",
  saveOrUpdateFeedBackForm: "HelpDesk/SaveOrUpdateFeedBackForm",
  getFeedBackFormByFromDAteToDate: "HelpDesk/GetFeedBackFormByFromDAteToDate",
  getCardiopulmonaryBloodGas: "EDP/OTMaster/GetCardiopulmonaryBloodGas",
  GetDoctorAppTimeSlotMediKredit: "MediKredit/GetDoctorAppTimeSlotMediKredit",
  getDoctorConfirmedAppointment: "MediKredit/GetDoctorConfirmedAppointment",
  // satish end

  // HEMODIALYSIS CHART Abhijeet
  getHemodialysis_Pre_Dialysis_Vital:
    "NursingWard/Forms/GetHemodialysis_Pre_Dialysis_Vital",
  saveHemodialysis_Pre_Dialysis_Vital:
    "NursingWard/Forms/saveHemodialysis_Pre_Dialysis_Vital",
  updateHemodialysis_Pre_Dialysis_Vital:
    "NursingWard/Forms/UpdateHemodialysis_Pre_Dialysis_Vital",
  saveHemodialysis_Dialysis_Order:
    "NursingWard/Forms/SaveHemodialysis_Dialysis_Order",
  getHemodialysis_Dialysis_Order:
    "NursingWard/Forms/GetHemodialysis_Dialysis_Order",
  updateHemodialysis_Dialysis_Order:
    "NursingWard/Forms/UpdateHemodialysis_Dialysis_Order",
  getHemodialysis_Machine_Check:
    "NursingWard/Forms/GetHemodialysis_Machine_Check",
  saveHemodialysis_Machine_Check:
    "NursingWard/Forms/saveHemodialysis_Machine_Check",
  UpdateHemodialysis_Machine_Check:
    "NursingWard/Forms/UpdateHemodialysis_Machine_Check",
  getHemodialysis_Dialysis_Examination:
    "NursingWard/Forms/GetHemodialysis_Dialysis_Examination",
  saveHemodialysis_Dialysis_Examination:
    "NursingWard/Forms/saveHemodialysis_Dialysis_Examination",
  UpdateHemodialysis_Dialysis_Examination:
    "NursingWard/Forms/UpdateHemodialysis_Dialysis_Examination",
  bindGrid: "NursingWard/Forms/BindGrid",
  getHemodialysis_Intra_Dialytic_Observation:
    "NursingWard/Forms/GetHemodialysis_Intra_Dialytic_Observation",
  saveHemodialysis_Intra_Dialytic_Observation:
    "NursingWard/Forms/SaveHemodialysis_Intra_Dialytic_Observation",
  updateHemodialysis_Intra_Dialytic_Observation:
    "NursingWard/Forms/UpdateHemodialysis_Intra_Dialytic_Observation",
  getHemodialysis_Post_Dialytic_Observation:
    "NursingWard/Forms/GetHemodialysis_Post_Dialytic_Observation",
  saveHemodialysis_Post_Dialytic_Observation:
    "NursingWard/Forms/SaveHemodialysis_Post_Dialytic_Observation",
  updateHemodialysis_Post_Dialytic_Observation:
    "NursingWard/Forms/UpdateHemodialysis_Post_Dialytic_Observation",
  getDiagnosis: "NursingWard/Forms/GetDiagnosis",
  saveDiagnosis: "NursingWard/Forms/SaveDiagnosis",
  updateDiagnosis: "NursingWard/Forms/UpdateDiagnosis",
  // Abhijeet End

  // CATHLAB INVASIVE PROCEDURE REPORT Abhijeet Start
  saveOrUpdateCathLabInvasiveProc:
    "NursingWard/SaveOrUpdateCathLabInvasiveProc",
  getCathLabInvasiveProcDetails: "NursingWard/GetCathLabInvasiveProcDetails",
  // Abhijeet End

  // Obstetric Record Abhijeet Start
  saveOrUpdateObstetricRecordForms:
    "NursingWard/SaveOrUpdateObstetricRecordForms",
  getObstetricRecordForms: "NursingWard/GetObstetricRecordForms",
  // Obstetric Record Abhijeet end
  // CHECK LIST FOR OPEN HEART SURGERY Abhijeet  start
  bindDataLaboratory: "NursingWard/Forms/BindDataLaboratory",
  saveLaboratory: "NursingWard/Forms/SaveLaboratory",
  bindBioMedicalData: "NursingWard/Forms/BindBioMedicalData",
  saveBiomedical: "NursingWard/Forms/SaveBiomedical",
  bindDentalData: "NursingWard/Forms/BindDentalData",
  save_Dental: "NursingWard/Forms/Save_Dental",
  save_Physiotherapy: "NursingWard/Forms/Save_Physiotherapy",
  bindPhysiotherapyData: "NursingWard/Forms/BindPhysiotherapyData",
  bindWardData: "NursingWard/Forms/BindWardData",
  save_Ward: "NursingWard/Forms/Save_Ward",
  bindFollowUpData: "NursingWard/Forms/BindFollowUpData",
  save_Follow: "NursingWard/Forms/Save_Follow",
  save_Theatre: "NursingWard/Forms/Save_Theatre",
  bindThreatreData: "NursingWard/Forms/BindThreatreData",
  bindICUData: "NursingWard/Forms/BindICUData",
  save_ICU: "NursingWard/Forms/Save_ICU",

  //  SHOIB START
  NoteFinderSearch: "NoteCreater/NoteFinderSearch",
  BindOtherUserTemplate: "NoteCreater/BindOtherUserTemplate",
  PatientDRPrint: "NoteCreater/PatientDRPrint",
  bindEmployee: "NursingWard/bindNurse",
  BindTemplateData: "NoteCreater/BindTemplateData",
  BillingIPDDeleteDoctorReferal: "Billing/IPD/DeleteDoctorReferal",
  BindReferDoctorforEdit: "PatientControl/BindReferDoctorforEdit",
  UpdateReferDoctor: "Billing/IPD/UpdateReferDoctor",
  SaveRoomShiftRequest: "Billing/IPD/SaveRoomShiftRequest",
  GetRoomShiftRequestList: "Billing/IPD/GetRoomShiftRequestList",
  ApproveRoomShiftRequest: "Billing/IPD/ApproveRoomShiftRequest",
  CancelRoomShiftRequest: "Billing/IPD/CancelRoomShiftRequest",
  GetRoomShiftHistory: "Billing/IPD/GetRoomShiftHistory",
  SearchPendingRequest: "Billing/IPD/SearchPendingRequest",
  // Hr
  BindBackendDataEmpTypeMaster:
    "EDP/EmployeeSetUp/BindBackendData_EmpTypeMaster",
  actionEmploymentType: "EDP/EmployeeSetUp/actionEmploymentType",
  BindAllActiveEmployees: "EDP/EmployeeSetUp/BindAllActiveEmployees",
  GetEmpLeaveDetail: "EDP/EmployeeSetUp/GetEmpLeaveDetail",
  BindEmployee: "EDP/EmployeeSetUp/bindEmployee",
  SaveEmployeeLeavePlanApproval: "EDP/EmployeeSetUp/SaveEmployeeLeavePlanApproval",
  BindEmployeeAttendanceData: "EDP/EmployeeSetUp/bindEmployeeAttendanceData",
  BindDesignationtableinMaster: "EDP/EmployeeSetUp/BindDesignationtableinMaster",
  BindReportingPurpose: "EDP/EmployeeSetUp/BindReportingPurpose",
  BindDepartmentPersonnelForm: "EDP/EmployeeSetUp/BindDepartmentPersonnelForm",
  BindDeptTotalEmployee: "EDP/EmployeeSetUp/BindDeptTotalEmployee",
  BindDeptEmployeeList: "EDP/EmployeeSetUp/BindDeptEmployeeList",
  BindStaffEstablishment: "EDP/EmployeeSetUp/BindStaffEstablishment",

  saveEmployeeBioData: "EDP/EmployeeSetUp/saveEmployeeBioData",
  SearchEmployeeBioData: "EDP/EmployeeSetUp/SearchEmployeeBioData",
  bindEmployeeBioData: "EDP/EmployeeSetUp/bindEmployeeBioData",
  saveDepartmentReq: "EDP/EmployeeSetUp/saveDepartmentReq",
  GetDepartmentDetails: "EDP/EmployeeSetUp/GetDepartmentDetails",
  binddatebydata: "EDP/EmployeeSetUp/binddatebydata",
  GetTrainingDetails: "EDP/EmployeeSetUp/GetTrainingDetails",
  EmployeeSetUpApproval: "EDP/EmployeeSetUp/Approval",
  EmployeeSetUpReject: "EDP/EmployeeSetUp/Reject",
  UpdateDepartmentReq: "EDP/EmployeeSetUp/UpdateDepartmentReq",
  SaveNewReportingPurpose: "EDP/EmployeeSetUp/SaveNewReportingPurpose",
  SavePersonnelForm: "EDP/EmployeeSetUp/SavePersonnelForm",
  InductionChecklistprint: "EDP/EmployeeSetUp/InductionChecklistprint",
  SearchPersonnelRequest: "EDP/EmployeeSetUp/SearchPersonnelRequest",
  ApprovedRequest: "EDP/EmployeeSetUp/Approved_Request",
  SaveApprovalForwardRequestApproval:
    "EDP/EmployeeSetUp/SaveApprovalForwardRequestApproval",
  SaveFinal: "EDP/EmployeeSetUp/SaveFinal",
  RejectPersonnelRequest: "EDP/EmployeeSetUp/RejectPersonnelRequest",
  ViewPersonnelFormProcessDetailJD:
    "EDP/EmployeeSetUp/ViewPersonnelFormProcessDetail_JD",
  ViewPersonnelFormProcessDetailpublish:
    "EDP/EmployeeSetUp/ViewPersonnelFormProcessDetail_publish",
  ViewPersonnelFormProcessDetail:
    "EDP/EmployeeSetUp/ViewPersonnelFormProcessDetail",
  SavePublish: "EDP/EmployeeSetUp/SavePublish",
  SearchInterView: "EDP/EmployeeSetUp/SearchInterView",
  SaveInterViewCandidateEntry:
    "EDP/EmployeeSetUp/SaveInterViewCandidateEntry" /* work in progress backend D drive create remain by gayan */,
  bindRequest: "EDP/EmployeeSetUp/bindRequest",
  SearchInterviewCandidate: "EDP/EmployeeSetUp/SearchInterviewCandidate",
  SearchInterviewCand: "EDP/EmployeeSetUp/SearchInterviewCand",
  SearchInterviewCandViewResume: "/EDP/EmployeeSetUp/ViewResume",
  sendEmailCandidate: "EDP/EmployeeSetUp/sendEmailCandidate",
  SaveInterViewRound: "EDP/EmployeeSetUp/SaveInterViewRound",
  BindInterViewRound: "EDP/EmployeeSetUp/BindInterViewRound",
  BindDesignationIVRoundMap: "EDP/EmployeeSetUp/BindDesignationIVRoundMap",
  SaveDesignationWithIVRound: "EDP/EmployeeSetUp/SaveDesignationWithIVRound",
  DeleteDesignationMap: "EDP/EmployeeSetUp/DeleteDesignationMap",
  SaveRatingMaster: "EDP/EmployeeSetUp/SaveRatingMaster",
  BindRatingMaster: "EDP/EmployeeSetUp/BindRatingMaster",
  SaveIncrementMaster: "EDP/EmployeeSetUp/SaveIncrementMaster",
  BindUserIncrement: "EDP/EmployeeSetUp/BindUserIncrement",
  GetOverTimeRequestToApprove: "EDP/EmployeeSetUp/GetOverTimeRequestToApprove",

  // nursing ward End points
  ICUSafetyCheckListReport: "NursingWard/ICUSafetyCheckListReport",
  LeavingAgainstMedicalAdvicePdf: "Emergency/LeavingAgainstMedicalAdvicePdf",
  // lab-master
  GetMasterData: "EDP/LaboratorySetup/BindMicroMasterList",
  LaboratorySetupSaveMasterData: "EDP/LaboratorySetup/SaveMicroMasterData",
  LaboratorySetupUpdateMasterData: "EDP/LaboratorySetup/UpdateMasterData",
  LaboratorySetupSaveReason: "EDP/LaboratorySetup/SaveReason",
  LaboratoryBindReasonDescription: "EDP/LaboratorySetup/BindReasonDescription",
  UpdateReasonDescription: "EDP/LaboratorySetup/UpdateReasonDescription",
  RecollectSample: "SampleCollection/RecollectSample",
  SaveCalledPatient: "SampleCollection/SaveCalledPatient",
  SaveUnCalledPatient: "SampleCollection/SaveUnCalledPatient",
  EmployeeLeaveInvestigation: "EDP/Employee_Leave/Investigation",
  Employee_LeaveGetItems: "EDP/Employee_Leave/GetItems",
  GetSubCategoryByCategory: "EDP/CentreSetUp/GetSubCategoryByCategory",
  CentreSetUpGetAllCategor: "EDP/CentreSetUp/GetAllCategory",
  EmployeeLeaveHoldItem: "EDP/Employee_Leave/HoldItem",
  UnHoldItem: "EDP/Employee_Leave/UnHoldItem",
  GetReportPrintCulture: "MicroCultureLabResult/GetReportPrintCulture",
  GetObservationList: "EDP/Employee_Leave/GetObservationList",
  RerunLabTest: "MachineResultEntry/RerunLabTest",
  GetObservationMasterData: "EDP/LaboratorySetup/GetObservationMasterData",
  GetObservationDetails: "EDP/LaboratorySetup/GetObservationDetails",
  ObservationExists: "EDP/LaboratorySetup/ObservationExists",
  UpdateObservationRanges: "EDP/LaboratorySetup/UpdateObservationRanges",
  BindOutSourceLabListReport: "EDP/LaboratorySetup/BindOutSourceLabListReport",
  SelectGender: "EDP/Employee_Leave/SelectGender",
  CheckMotherBaby: "PatientControl/CheckMotherBaby",
  SaveEmployeeLeaveAllotment: "EDP/Employee_Leave/saveEmployeeLeaveAllotment",

  // micro master Api
  LaboratorySetupGetUnMappedData: "/EDP/LaboratorySetup/GetUnMappedData",
  MicroLabEntryGetSavedData: "/EDP/LaboratorySetup/GetSaveData",
  SaveMappingMicro: "/EDP/LaboratorySetup/SaveMappingMicro",
  DeleteMapping: "/EDP/LaboratorySetup/DeleteMapping",
  GetLabBalanceCheck: "/MachineResultEntry/GetLabBalanceCheck",
  GetPatientBalance: "/CommonAPI/GetPatientBalance",
  GetPatientMedicalInfo: "/CommonAPI/GetPatientMedicalInfoV2",
  GetPatientMembershipDetails:
    "/MembershipCardSeparate/GetPatientMembershipDetails",
  UpdateTemperatureRoomCall: "/ExaminationRoom/UpdateTemperatureRoomCall",
  UpdateTemperatureRoomUnCall: "/ExaminationRoom/UpdateTemperatureRoomUnCall",
  GetPatientMedicineList: "/Doctor/GetPatientMedicineList",
  // KMSI - running-medicine alert on the prescription page
  DoctorRunningMedicines: "/Doctor/RunningMedicines",
  GetPatientAppointments: "/Doctor/GetPatientAppointments",
  GetPatientOrdersByDoctor: "/Doctor/GetPatientOrdersByDoctor",
  GetIndentListByEntryID: "Doctor/GetIndentListByEntryID",
  AddOutsideMedication: "Medication/AddOutsideMedication",
  GetOutsideMedication: "Medication/GetOutsideMedication",
  GiveOutsideMedication: "Medication/GiveOutsideMedication",
  AcknowledgeNoteByTransaction: "NoteFinderSearch/AcknowledgeNoteByTransaction",
  ApproveNote: "NoteFinderSearch/ApproveNote",
  GetPatientOPDPrescriptions: "ChatPortAi/GetPatientOPDPrescriptions",
  InsertConsentData: "PatientConsent/PatientConsent/GetConsentMaster",
  SavePatientConsent: "PatientConsent/PatientConsent/SavePatientConsent",
  SendConsentLink: "PatientConsent/PatientConsent/SendConsentLink",
  FetchConsentSaved: "PatientConsent/PatientConsent/FetchConsentSaved",
  //  SHOIB  END
  //IBF Start Abhijeet
  saveANCRecord: "IVF/IVF/SaveANCRecord",
  bindDetails: "IVF/IVF/BindDetails",
  print: "IVF/IVF/Print",
  blankPrint_ANCReport: "IVF/IVF/BlankPrint_ANCReport",
  bindDoctorPA: "IVF/IVF/BindDoctorPA",
  bindDoctorPM: "IVF/IVF/BindDoctorPM",
  save_ANCPatientHistoryI: "IVF/IVF/Save_ANCPatientHistoryI",
  bindDetails_ANCPatientHistory1: "IVF/IVF/BindDetails_ANCPatientHistory1",
  print_ANCPatientHistoryI: "IVF/IVF/Print_ANCPatientHistoryI",
  blankPrint_ANCPatientHistoryI: "IVF/IVF/BlankPrint_ANCPatientHistoryI",
  bindDetails_ANCPatientHistoryII: "IVF/IVF/BindDetails_ANCPatientHistoryII",
  save_ANCPatientHistoryII: "IVF/IVF/Save_ANCPatientHistoryII",
  print_ANCPatientHistoryII: "IVF/IVF/Print_ANCPatientHistoryII",
  blankPrint_ANCPatientHistoryII: "IVF/IVF/BlankPrint_ANCPatientHistoryII",
  save_History_Sheet: "IVF/IVF/Save_History_Sheet",
  bindDetails_History_Sheet: "IVF/IVF/BindDetails_History_Sheet",
  print_History_Sheet: "IVF/IVF/Print_History_Sheet",
  blankPrint_History_Sheet: "IVF/IVF/BlankPrint_History_Sheet",
  bindDetails_Physical_Systemic: "IVF/IVF/BindDetails_Physical_Systemic",
  save_Physical_Systemic: "IVF/IVF/Save_Physical_Systemic",
  print_Physical_Systemic: "IVF/IVF/Print_Physical_Systemic",
  blankPrint_Physical_Systemic: "IVF/IVF/BlankPrint_Physical_Systemic",
  bindDetails_Marital_Details: "IVF/IVF/BindDetails_Marital_Details",
  save_Marital_Details: "IVF/IVF/Save_Marital_Details",
  print_Marital_Details: "IVF/IVF/Print_Marital_Details",
  blankPrint_Marital_Details: "IVF/IVF/BlankPrint_Marital_Details",
  bindDetails_Previous_Infertility: "IVF/IVF/BindDetails_Previous_Infertility",
  bindDoctor: "IVF/IVF/BindDoctor",
  save_Previous_Infertility: "IVF/IVF/Save_Previous_Infertility",
  print_Previous_Infertility: "IVF/IVF/Print_Previous_Infertility",
  blankPrint_Previous_Infertility: "IVF/IVF/BlankPrint_Previous_Infertility",
  bindDetails_Ovum_Pickup: "IVF/IVF/BindDetails_Ovum_Pickup",
  save_Ovum_Pickup: "IVF/IVF/Save_Ovum_Pickup",
  print_Ovum_Pickup: "IVF/IVF/Print_Ovum_Pickup",
  bindDetails_IVFOvum_Pickup: "IVF/IVF/BindDetails_IVFOvum_Pickup",
  bindDoctor_IVFOvum_Pickup: "IVF/IVF/BindDoctor_IVFOvum_Pickup",
  save_IVFOvum_Pickup: "IVF/IVF/Save_IVFOvum_Pickup",
  print_IVFOvum_Pickup: "IVF/IVF/Print_IVFOvum_Pickup",
  bindDetails_IVF_EMBRYO_Transfer: "IVF/IVF/BindDetails_IVF_EMBRYO_Transfer",
  bindDoctor_IVF_EMBRYO_Transfer: "IVF/IVF/BindDoctor_IVF_EMBRYO_Transfer",
  save_IVF_EMBRYO_Transfer: "IVF/IVF/Save_IVF_EMBRYO_Transfer",
  print_IVF_EMBRYO_Transfer: "IVF/IVF/Print_IVF_EMBRYO_Transfer",
  bindOpuHistory: "IVF/IVF/BindOpuHistory",
  saveIvfOPUFormdetails: "IVF/IVF/SaveIvfOPUFormdetails",
  printOPUForm: "IVF/IVF/PrintOPUForm",
  bindDetails_Ovulation_Induction: "IVF/IVF/bindDetails_Ovulation_Induction",
  save_Ovulation_Induction: "IVF/IVF/Save_Ovulation_Induction",
  print_Ovulation_Induction: "IVF/IVF/Print_Ovulation_Induction",
  bindDetails_ET_SHEET: "IVF/IVF/BindDetails_ET_SHEET",
  save_ET_SHEET: "IVF/IVF/Save_ET_SHEET",
  print_ET_SHEET: "IVF/IVF/Print_ET_SHEET",
  blankPrint_ET_SHEET: "IVF/IVF/BlankPrint_ET_SHEET",
  bindDetails_IUI_SHEET: "IVF/IVF/BindDetails_IUI_SHEET",
  save_IUI_SHEET: "IVF/IVF/Save_IUI_SHEET",
  blankPrint_IUI_SHEET: "IVF/IVF/BlankPrint_IUI_SHEET",
  print_IUI_SHEET: "IVF/IVF/Print_IUI_SHEET",
  blankPrint_IUI_SHEET: "IVF/IVF/BlankPrint_IUI_SHEET",
  blankDonorUSightRetrievalPickup: "IVF/IVF/BlankDonorUSightRetrievalPickup",
  bindDetails_PreOperative_Checkup: "IVF/IVF/BindDetails_PreOperative_Checkup",
  bindDoctor_PreOperative_Checkup: "IVF/IVF/BindDoctor_PreOperative_Checkup",
  save_PreOperative_Checkup: "IVF/IVF/Save_PreOperative_Checkup",
  print_PreOperative_Checkup: "IVF/IVF/Print_PreOperative_Checkup",
  blank_PreOperative_Checkup: "IVF/IVF/Blank_PreOperative_Checkup",
  bindDetails_General_Examination: "IVF/IVF/BindDetails_General_Examination",
  save_General_Examination: "IVF/IVF/Save_General_Examination",
  print_General_Examination: "IVF/IVF/Print_General_Examination",
  blankPrint_General_Examination: "IVF/IVF/BlankPrint_General_Examination",
  bindTreatmentSheet: "IVF/IVF/BindTreatmentSheet",
  save_TreatmentSheet: "IVF/IVF/Save_TreatmentSheet",
  print_TreatmentSheet: "IVF/IVF/Print_TreatmentSheet",
  save_ARTSummary: "IVF/IVF/Save_ARTSummary",
  print_ARTSummary: "IVF/IVF/Print_ARTSummary",
  bindDetails_ARTSummary: "IVF/IVF/BindDetails_ARTSummary",
  bindDetails_6_a_IVF_Financial_Agreement: "IVF/IVF/BindDetails_6_a_IVF_Financial_Agreement",
  save_6_a_IVF_Financial_Agreement: "IVF/IVF/Save_6_a_IVF_Financial_Agreement",
  delete_6_a_IVF_Financial_Agreement: "IVF/IVF/Delete_6_a_IVF_Financial_Agreement",
  print_6_a_IVF_Financial_Agreement: "IVF/IVF/Print_6_a_IVF_Financial_Agreement",
  bindDetails_6_b_IVF_Consent_Own_Gametes:
    "IVF/IVF/BindDetails_6_b_IVF_Consent_Own_Gametes",
  save_6_b_IVF_Consent_Own_Gametes: "IVF/IVF/Save_6_b_IVF_Consent_Own_Gametes",
  delete_6_b_IVF_Consent_Own_Gametes:
    "IVF/IVF/Delete_6_b_IVF_Consent_Own_Gametes",
  print_6_b_IVF_Consent_Own_Gametes: "IVF/IVF/Print_6_b_IVF_Consent_Own_Gametes",
  bindDetails_6_c_CONSENT_FOR_OVARIAN_STIMULATION:
    "IVF/IVF/BindDetails_6_c_CONSENT_FOR_OVARIAN_STIMULATION",
  save_6_c_CONSENT_FOR_OVARIAN_STIMULATION:
    "IVF/IVF/Save_6_c_CONSENT_FOR_OVARIAN_STIMULATION",
  delete_6_c_CONSENT_FOR_OVARIAN_STIMULATION:
    "IVF/IVF/Delete_6_c_CONSENT_FOR_OVARIAN_STIMULATION",
  print_6_c_CONSENT_FOR_OVARIAN_STIMULATION:
    "IVF/IVF/Print_6_c_CONSENT_FOR_OVARIAN_STIMULATION",
  bindDetails_6_d_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/BindDetails_6_d_Consent_for_Infectious_Disease_Screening",
  save_6_d_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/Save_6_d_Consent_for_Infectious_Disease_Screening",
  delete_6_d_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/Delete_6_d_Consent_for_Infectious_Disease_Screening",
  print_6_d_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/Print_6_d_Consent_for_Infectious_Disease_Screening",
  bindDetails_6_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/BindDetails_6_e_Consent_for_Anaesthesia_Sedation",
  save_6_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/Save_6_e_Consent_for_Anaesthesia_Sedation",
  delete_6_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/Delete_6_e_Consent_for_Anaesthesia_Sedation",
  print_6_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/Print_6_e_Consent_for_Anaesthesia_Sedation",
  bindDetails_6_f_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/BindDetails_6_f_Consent_for_Oocyte_Retrieval",
  save_6_f_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/Save_6_f_Consent_for_Oocyte_Retrieval",
  delete_6_f_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/Delete_6_f_Consent_for_Oocyte_Retrieval",
  print_6_f_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/Print_6_f_Consent_for_Oocyte_Retrieval",
  bindDetails_6_g_IVF_Embryo_Freezing_Consent:
    "IVF/IVF/BindDetails_6_g_IVF_Embryo_Freezing_Consent",
  save_6_g_IVF_Embryo_Freezing_Consent:
    "IVF/IVF/Save_6_g_IVF_Embryo_Freezing_Consent",
  delete_6_g_IVF_Embryo_Freezing_Consent:
    "IVF/IVF/Delete_6_g_IVF_Embryo_Freezing_Consent",
  print_6_g_IVF_Embryo_Freezing_Consent:
    "IVF/IVF/Print_6_g_IVF_Embryo_Freezing_Consent",
  bindDetails_6_h_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/BindDetails_6_h_Nomination_and_Instructions_Death_or_Incapacity",
  save_6_h_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/Save_6_h_Nomination_and_Instructions_Death_or_Incapacity",
  delete_6_h_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/Delete_6_h_Nomination_and_Instructions_Death_or_Incapacity",
  print_6_h_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/Print_6_h_Nomination_and_Instructions_Death_or_Incapacity",
  bindDetails_6_i_Consent_for_Extending_Storage_of_Embryos:
    "IVF/IVF/BindDetails_6_i_Consent_for_Extending_Storage_of_Embryos",
  save_6_i_Consent_for_Extending_Storage_of_Embryos:
    "IVF/IVF/Save_6_i_Consent_for_Extending_Storage_of_Embryos",
  delete_6_i_Consent_for_Extending_Storage_of_Embryos:
    "IVF/IVF/Delete_6_i_Consent_for_Extending_Storage_of_Embryos",
  print_6_i_Consent_for_Extending_Storage_of_Embryos:
    "IVF/IVF/Print_6_i_Consent_for_Extending_Storage_of_Embryos",
  bindDetails_6_k_IVF_Frozen_Embryo_Transfer_Consent:
    "IVF/IVF/BindDetails_6_k_IVF_Frozen_Embryo_Transfer_Consent",
  save_6_k_IVF_Frozen_Embryo_Transfer_Consent:
    "IVF/IVF/Save_6_k_IVF_Frozen_Embryo_Transfer_Consent",
  delete_6_k_IVF_Frozen_Embryo_Transfer_Consent:
    "IVF/IVF/Delete_6_k_IVF_Frozen_Embryo_Transfer_Consent",
  print_6_k_IVF_Frozen_Embryo_Transfer_Consent:
    "IVF/IVF/Print_6_k_IVF_Frozen_Embryo_Transfer_Consent",
  bindDetails_6_l_IVF_Consent_Donor_Sperm_Couple:
    "IVF/IVF/BindDetails_6_l_IVF_Consent_Donor_Sperm_Couple",
  save_6_l_IVF_Consent_Donor_Sperm_Couple:
    "IVF/IVF/Save_6_l_IVF_Consent_Donor_Sperm_Couple",
  delete_6_l_IVF_Consent_Donor_Sperm_Couple:
    "IVF/IVF/Delete_6_l_IVF_Consent_Donor_Sperm_Couple",
  print_6_l_IVF_Consent_Donor_Sperm_Couple:
    "IVF/IVF/Print_6_l_IVF_Consent_Donor_Sperm_Couple",
  bindDetails_6_o_IVF_Consent_Donor_Oocyte_Couple:
    "IVF/IVF/BindDetails_6_o_IVF_Consent_Donor_Oocyte_Couple",
  save_6_o_IVF_Consent_Donor_Oocyte_Couple:
    "IVF/IVF/Save_6_o_IVF_Consent_Donor_Oocyte_Couple",
  delete_6_o_IVF_Consent_Donor_Oocyte_Couple:
    "IVF/IVF/Delete_6_o_IVF_Consent_Donor_Oocyte_Couple",
  print_6_o_IVF_Consent_Donor_Oocyte_Couple:
    "IVF/IVF/Print_6_o_IVF_Consent_Donor_Oocyte_Couple",
  bindDetails_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos:
    "IVF/IVF/BindDetails_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos",
  save_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos:
    "IVF/IVF/Save_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos",
  delete_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos:
    "IVF/IVF/Delete_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos",
  print_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos:
    "IVF/IVF/Print_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos",
  bindDetails_EF_4_a_Oocyte_Freezing_Financial_Agreement:
    "IVF/IVF/BindDetails_EF_4_a_Oocyte_Freezing_Financial_Agreement",
  save_EF_4_a_Oocyte_Freezing_Financial_Agreement:
    "IVF/IVF/Save_EF_4_a_Oocyte_Freezing_Financial_Agreement",
  delete_EF_4_a_Oocyte_Freezing_Financial_Agreement:
    "IVF/IVF/Delete_EF_4_a_Oocyte_Freezing_Financial_Agreement",
  print_EF_4_a_Oocyte_Freezing_Financial_Agreement:
    "IVF/IVF/Print_EF_4_a_Oocyte_Freezing_Financial_Agreement",
  bindDetails_EF_4_b_Consent_for_Ovarian_Stimulation:
    "IVF/IVF/BindDetails_EF_4_b_Consent_for_Ovarian_Stimulation",
  save_EF_4_b_Consent_for_Ovarian_Stimulation:
    "IVF/IVF/Save_EF_4_b_Consent_for_Ovarian_Stimulation",
  delete_EF_4_b_Consent_for_Ovarian_Stimulation:
    "IVF/IVF/Delete_EF_4_b_Consent_for_Ovarian_Stimulation",
  print_EF_4_b_Consent_for_Ovarian_Stimulation:
    "IVF/IVF/Print_EF_4_b_Consent_for_Ovarian_Stimulation",
  bindDetails_EF_4_c_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/BindDetails_EF_4_c_Consent_for_Infectious_Disease_Screening",
  save_EF_4_c_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/Save_EF_4_c_Consent_for_Infectious_Disease_Screening",
  delete_EF_4_c_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/Delete_EF_4_c_Consent_for_Infectious_Disease_Screening",
  print_EF_4_c_Consent_for_Infectious_Disease_Screening:
    "IVF/IVF/Print_EF_4_c_Consent_for_Infectious_Disease_Screening",
  bindDetails_EF_4_d_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/BindDetails_EF_4_d_Consent_for_Oocyte_Retrieval",
  save_EF_4_d_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/Save_EF_4_d_Consent_for_Oocyte_Retrieval",
  delete_EF_4_d_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/Delete_EF_4_d_Consent_for_Oocyte_Retrieval",
  print_EF_4_d_Consent_for_Oocyte_Retrieval:
    "IVF/IVF/Print_EF_4_d_Consent_for_Oocyte_Retrieval",
  bindDetails_EF_4_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/BindDetails_EF_4_e_Consent_for_Anaesthesia_Sedation",
  save_EF_4_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/Save_EF_4_e_Consent_for_Anaesthesia_Sedation",
  delete_EF_4_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/Delete_EF_4_e_Consent_for_Anaesthesia_Sedation",
  print_EF_4_e_Consent_for_Anaesthesia_Sedation:
    "IVF/IVF/Print_EF_4_e_Consent_for_Anaesthesia_Sedation",
  bindDetails_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification:
    "IVF/IVF/BindDetails_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification",
  save_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification:
    "IVF/IVF/Save_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification",
  delete_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification:
    "IVF/IVF/Delete_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification",
  print_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification:
    "IVF/IVF/Print_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification",
  bindDetails_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/BindDetails_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity",
  save_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/Save_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity",
  delete_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/Delete_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity",
  print_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity:
    "IVF/IVF/Print_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity",
  bindDetails_EF_4_h_Consent_for_Extending_Storage_of_Oocytes:
    "IVF/IVF/BindDetails_EF_4_h_Consent_for_Extending_Storage_of_Oocytes",
  save_EF_4_h_Consent_for_Extending_Storage_of_Oocytes:
    "IVF/IVF/Save_EF_4_h_Consent_for_Extending_Storage_of_Oocytes",
  delete_EF_4_h_Consent_for_Extending_Storage_of_Oocytes:
    "IVF/IVF/Delete_EF_4_h_Consent_for_Extending_Storage_of_Oocytes",
  print_EF_4_h_Consent_for_Extending_Storage_of_Oocytes:
    "IVF/IVF/Print_EF_4_h_Consent_for_Extending_Storage_of_Oocytes",
  bindDetails_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes:
    "IVF/IVF/BindDetails_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes",
  save_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes:
    "IVF/IVF/Save_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes",
  delete_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes:
    "IVF/IVF/Delete_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes",
  print_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes:
    "IVF/IVF/Print_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes",
  bindDetails_IUI_1_a_IUI_Financial_Agreement:
    "IVF/IVF/BindDetails_IUI_1_a_IUI_Financial_Agreement",
  save_IUI_1_a_IUI_Financial_Agreement:
    "IVF/IVF/Save_IUI_1_a_IUI_Financial_Agreement",
  delete_IUI_1_a_IUI_Financial_Agreement:
    "IVF/IVF/Delete_IUI_1_a_IUI_Financial_Agreement",
  print_IUI_1_a_IUI_Financial_Agreement:
    "IVF/IVF/Print_IUI_1_a_IUI_Financial_Agreement",
  bindDetails_IUI_1_b_IUI_Consent_Form_Husband_Semen:
    "IVF/IVF/BindDetails_IUI_1_b_IUI_Consent_Form_Husband_Semen",
  save_IUI_1_b_IUI_Consent_Form_Husband_Semen:
    "IVF/IVF/Save_IUI_1_b_IUI_Consent_Form_Husband_Semen",
  delete_IUI_1_b_IUI_Consent_Form_Husband_Semen:
    "IVF/IVF/Delete_IUI_1_b_IUI_Consent_Form_Husband_Semen",
  print_IUI_1_b_IUI_Consent_Form_Husband_Semen:
    "IVF/IVF/Print_IUI_1_b_IUI_Consent_Form_Husband_Semen",
  bindDetails_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple:
    "IVF/IVF/BindDetails_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple",
  save_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple:
    "IVF/IVF/Save_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple",
  delete_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple:
    "IVF/IVF/Delete_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple",
  print_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple:
    "IVF/IVF/Print_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple",
  bindDetails_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor:
    "IVF/IVF/BindDetails_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor",
  save_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor:
    "IVF/IVF/Save_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor",
  delete_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor:
    "IVF/IVF/Delete_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor",
  print_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor:
    "IVF/IVF/Print_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor",
  bindDetails_Sono_TBPCR_Consent_Form_Financial_Agreement:
    "IVF/IVF/BindDetails_Sono_TBPCR_Consent_Form_Financial_Agreement",
  save_Sono_TBPCR_Consent_Form_Financial_Agreement:
    "IVF/IVF/Save_Sono_TBPCR_Consent_Form_Financial_Agreement",
  delete_Sono_TBPCR_Consent_Form_Financial_Agreement:
    "IVF/IVF/Delete_Sono_TBPCR_Consent_Form_Financial_Agreement",
  print_Sono_TBPCR_Consent_Form_Financial_Agreement:
    "IVF/IVF/Print_Sono_TBPCR_Consent_Form_Financial_Agreement",
  //IBF End Abhijeet

  SavePatientAllergy: "Emergency/SavePatientAllergy",
  GetPatientAllergyList: "Emergency/GetPatientAllergyList",
  DeletePatientAllergy: "Emergency/DeletePatientAllergy",
  GetIPDVisit: "BillingSave/GetIPDVisitNew",
  SaveIPDVisit: "NursingWard/SaveIPDVisit",
  btnCentralLine: "NursingWard/Nursing/btnCentralLine",
  GetDoctorPrescriptionSuggestion:
    "PrescriptionAdvice/GetDoctorPrescriptionSuggestion",
  DeleteActionTemplate: "PrescriptionAdvice/DeleteTemplate",
  GetEditTemplate: "PrescriptionAdvice/GetTemplate",
  SaveBabyGrowthChart: "PrescriptionAdvice/SaveBabyGrowthChart",
  GetBabyGrowthChart: "PrescriptionAdvice/GetBabyGrowthChart",
  GetVaccineBrand: "PrescriptionAdvice/GetVaccineBrand",
  SaveOrUpdateVaccineBrandName:
    "PrescriptionAdvice/SaveOrUpdateVaccineBrandName",
  GetNewChildVaccineChart: "PrescriptionAdvice/GetNewChildVaccineChart",
  GetNewChildVaccineChart: "PrescriptionAdvice/GetNewChildVaccineChart",
  GetPatentDOB: "PrescriptionAdvice/GetPatientDOB",

  // Edit Lab reeport start
  SearchTest: "EDP/LaboratorySetup/SearchTest",
  UpdateTiming: "EDP/LaboratorySetup/UpdateTiming",
  // Edit Lab Report End

  //akhilesh calender code merge
  GetDoctorAppTimeSlotMediKredit: "MediKredit/GetDoctorAppTimeSlotMediKredit",
  getDoctorConfirmedAppointment: "MediKredit/GetDoctorConfirmedAppointment",
  saveRegisterMediKredit: "MediKredit/SaveRegisterMediKredit",
  loadPatinetBasicDetails: "MediKredit/loadPatinetBasicDetails",
  searchPatientDetailsForMobile: "MediKredit/SearchPatientDetailsForMobile",
  getPatientDoctorAppMediKreditDetails:
    "MediKredit/GetPatientDoctorAppMediKreditDetails",
  mediKreditApppointmentDocument: "MediKredit/MediKreditApppointmentDocument",
  scanFileViewAppointment: "MediKredit/ScanFileViewAppointment",
  loadConsentFormDetails: "MediKredit/loadConsentFormDetails",
  consentFormDetailsUpdate: "MediKredit/ConsentFormDetailsUpdate",
  centreWiseCacheAllBasicData: "MediKredit/CentreWiseCacheAllBasicData",
  getAllPanel: "MediKredit/GetAllPanel",
  MediKreditGetPatientDocument: "MediKredit/GetPatientDocument",
  MediKreditUploadDocumentPatient: "MediKredit/UploadDocumentPatient",

  //end akhileshf


  EmployeeBioDataReport: "EDP/HrReport/EmployeeBioDataReport",

  // ===== NewHR (Aurora HR module — src/pages/newHr) =====
  // Employee
  newHRGetEmployeeList: "NewHR/NewHREmployee/GetEmployeeList", // get
  newHRGetEmployeeDetail: "NewHR/NewHREmployee/GetEmployeeDetail", // get
  newHRBindEmployeeDropdown: "NewHR/NewHREmployee/BindEmployeeDropdown", // get
  newHRSaveEmployee: "NewHR/NewHREmployee/SaveEmployee", // post
  newHRUpdateEmployee: "NewHR/NewHREmployee/UpdateEmployee", // post
  // Employee actions (warnings)
  newHRGetWarningList: "NewHR/NewHREmployeeActions/GetWarningList", // get
  newHRSaveWarning: "NewHR/NewHREmployeeActions/SaveWarning", // post
  newHRIssueWarning: "NewHR/NewHREmployeeActions/IssueWarning", // post
  newHRAcknowledgeWarning: "NewHR/NewHREmployeeActions/AcknowledgeWarning", // post
  newHRRespondWarning: "NewHR/NewHREmployeeActions/RespondWarning", // post
  newHRCloseWarning: "NewHR/NewHREmployeeActions/CloseWarning", // post
  newHREscalateWarning: "NewHR/NewHREmployeeActions/EscalateWarning", // post
  newHRDeleteWarning: "NewHR/NewHREmployeeActions/DeleteWarning", // post
  newHRGetWarningSummary: "NewHR/NewHREmployeeActions/GetWarningSummary", // get
  // Approval center
  newHRGetPendingApprovals: "NewHR/NewHRApprovalCenter/GetPendingApprovals", // get
  newHRGetApprovalCounts: "NewHR/NewHRApprovalCenter/GetApprovalCounts", // get
  newHRGetApprovalSummary: "NewHR/NewHRApprovalCenter/GetApprovalSummary", // get
  newHRActOnApproval: "NewHR/NewHRApprovalCenter/ActOnApproval", // post
  newHRBulkActOnApprovals: "NewHR/NewHRApprovalCenter/BulkActOnApprovals", // post
  // Leave
  newHRGetLeaveTypeList: "NewHR/NewHRLeave/GetLeaveTypeList", // get
  newHRSaveLeaveType: "NewHR/NewHRLeave/SaveLeaveType", // post
  newHRUpdateLeaveType: "NewHR/NewHRLeave/UpdateLeaveType", // post
  newHRGetLeaveRequestList: "NewHR/NewHRLeave/GetLeaveRequestList", // get
  newHRSaveLeaveRequest: "NewHR/NewHRLeave/SaveLeaveRequest", // post
  newHRApproveLeaveRequest: "NewHR/NewHRLeave/ApproveLeaveRequest", // post
  newHRRejectLeaveRequest: "NewHR/NewHRLeave/RejectLeaveRequest", // post
  newHRCancelLeaveRequest: "NewHR/NewHRLeave/CancelLeaveRequest", // post
  newHRGetLeaveAdjustmentList: "NewHR/NewHRLeave/GetLeaveAdjustmentList", // get
  newHRSaveLeaveAdjustment: "NewHR/NewHRLeave/SaveLeaveAdjustment", // post
  newHRApproveLeaveAdjustment: "NewHR/NewHRLeave/ApproveLeaveAdjustment", // post
  newHRRejectLeaveAdjustment: "NewHR/NewHRLeave/RejectLeaveAdjustment", // post
  newHRGetLeaveAllotmentList: "NewHR/NewHRLeave/GetLeaveAllotmentList", // get
  newHRSaveLeaveAllotment: "NewHR/NewHRLeave/SaveLeaveAllotment", // post
  newHRPublishLeaveAllotment: "NewHR/NewHRLeave/PublishLeaveAllotment", // post
  newHRGetLeaveBalances: "NewHR/NewHRLeave/GetLeaveBalances", // get
  newHRGetMedicalLeaveList: "NewHR/NewHRLeave/GetMedicalLeaveList", // get
  newHRSaveMedicalLeave: "NewHR/NewHRLeave/SaveMedicalLeave", // post
  newHRApproveMedicalLeave: "NewHR/NewHRLeave/ApproveMedicalLeave", // post
  newHRRejectMedicalLeave: "NewHR/NewHRLeave/RejectMedicalLeave", // post
  newHRGetLeaveSummary: "NewHR/NewHRLeave/GetLeaveSummary", // get
  // Attendance & OT
  newHRGetDailyAttendanceList: "NewHR/NewHRAttendance/GetDailyAttendanceList", // get
  newHRGetAttendanceRequestList: "NewHR/NewHRAttendance/GetAttendanceRequestList", // get
  newHRSaveAttendanceRequest: "NewHR/NewHRAttendance/SaveAttendanceRequest", // post
  newHRApproveAttendanceRequest: "NewHR/NewHRAttendance/ApproveAttendanceRequest", // post
  newHRRejectAttendanceRequest: "NewHR/NewHRAttendance/RejectAttendanceRequest", // post
  newHRGetOvertimeList: "NewHR/NewHRAttendance/GetOvertimeList", // get
  newHRSaveOvertime: "NewHR/NewHRAttendance/SaveOvertime", // post
  newHRApproveOvertime: "NewHR/NewHRAttendance/ApproveOvertime", // post
  newHRRejectOvertime: "NewHR/NewHRAttendance/RejectOvertime", // post
  newHRBulkApproveOvertime: "NewHR/NewHRAttendance/BulkApproveOvertime", // post
  newHRSavePunch: "NewHR/NewHRAttendance/SavePunch", // post
  newHRGetMonthAttendance: "NewHR/NewHRAttendance/GetMonthAttendance", // get
  newHRSaveManualAttendance: "NewHR/NewHRAttendance/SaveManualAttendance", // post
  newHRGetAttendanceSummary: "NewHR/NewHRAttendance/GetAttendanceSummary", // get
  newHRGetAttendanceTrend: "NewHR/NewHRAttendance/GetAttendanceTrend", // get
  // Duty roster
  newHRGetRosterList: "NewHR/NewHRDutyRoster/GetRosterList", // get
  newHRGetRosterSummary: "NewHR/NewHRDutyRoster/GetRosterSummary", // get
  newHRGetRosterCoverage: "NewHR/NewHRDutyRoster/GetRosterCoverage", // get
  newHRSaveRoster: "NewHR/NewHRDutyRoster/SaveRoster", // post
  newHRUpdateRosterShift: "NewHR/NewHRDutyRoster/UpdateRosterShift", // post
  newHRPublishRoster: "NewHR/NewHRDutyRoster/PublishRoster", // post
  newHRCopyRosterWeek: "NewHR/NewHRDutyRoster/CopyRosterWeek", // post
  newHRGetRosterMonth: "NewHR/NewHRDutyRoster/GetRosterMonth", // get — month grid (Month=YYYY-MM)
  newHRUpdateRosterMonthShift: "NewHR/NewHRDutyRoster/UpdateRosterMonthShift", // post — edit one day by date
  newHRPublishRosterMonth: "NewHR/NewHRDutyRoster/PublishRosterMonth", // post
  // Locum
  newHRGetLocumList: "NewHR/NewHRLocum/GetLocumList", // get
  newHRSaveLocum: "NewHR/NewHRLocum/SaveLocum", // post
  newHRApproveLocum: "NewHR/NewHRLocum/ApproveLocum", // post
  newHRRejectLocum: "NewHR/NewHRLocum/RejectLocum", // post
  newHREngageLocum: "NewHR/NewHRLocum/EngageLocum", // post
  newHRCompleteLocum: "NewHR/NewHRLocum/CompleteLocum", // post
  newHRWithdrawLocum: "NewHR/NewHRLocum/WithdrawLocum", // post
  newHRVerifyLocumCredentials: "NewHR/NewHRLocum/VerifyLocumCredentials", // post
  newHRGetLocumSummary: "NewHR/NewHRLocum/GetLocumSummary", // get
  // Onboarding
  newHRGetRegistrationList: "NewHR/NewHROnboarding/GetRegistrationList", // get
  newHRSaveRegistration: "NewHR/NewHROnboarding/SaveRegistration", // post
  newHRApproveRegistration: "NewHR/NewHROnboarding/ApproveRegistration", // post
  newHRRejectRegistration: "NewHR/NewHROnboarding/RejectRegistration", // post
  newHRRequestRegistrationDocuments: "NewHR/NewHROnboarding/RequestRegistrationDocuments", // post
  newHRUpdateRegistrationBgv: "NewHR/NewHROnboarding/UpdateRegistrationBgv", // post
  newHRGetRegistrationDocuments: "NewHR/NewHROnboarding/GetRegistrationDocuments", // get
  newHRToggleRegistrationDocument: "NewHR/NewHROnboarding/ToggleRegistrationDocument", // post
  newHRUploadRegistrationDocument: "NewHR/NewHROnboarding/UploadRegistrationDocument", // post
  newHRDownloadRegistrationDocument: "NewHR/NewHROnboarding/DownloadRegistrationDocument", // get
  newHRGetRegistrationChecklist: "NewHR/NewHROnboarding/GetRegistrationChecklist", // get
  newHRSeedRegistrationChecklist: "NewHR/NewHROnboarding/SeedRegistrationChecklist", // post
  newHRToggleChecklistItem: "NewHR/NewHROnboarding/ToggleChecklistItem", // post
  newHRCompleteRegistrationChecklist: "NewHR/NewHROnboarding/CompleteRegistrationChecklist", // post
  newHRGetOnboardingSummary: "NewHR/NewHROnboarding/GetOnboardingSummary", // get
  // Documents (letters)
  newHRGetLetterList: "NewHR/NewHRDocuments/GetLetterList", // get
  newHRSaveLetter: "NewHR/NewHRDocuments/SaveLetter", // post
  newHRSignLetter: "NewHR/NewHRDocuments/SignLetter", // post
  newHRDeliverLetter: "NewHR/NewHRDocuments/DeliverLetter", // post
  newHRAcknowledgeLetter: "NewHR/NewHRDocuments/AcknowledgeLetter", // post
  newHRRevokeLetter: "NewHR/NewHRDocuments/RevokeLetter", // post
  newHRGetDocumentsSummary: "NewHR/NewHRDocuments/GetDocumentsSummary", // get
  newHRGetLetterTypeCounts: "NewHR/NewHRDocuments/GetLetterTypeCounts", // get
  // Performance
  newHRGetQuestionList: "NewHR/NewHRPerformance/GetQuestionList", // get
  newHRSaveQuestion: "NewHR/NewHRPerformance/SaveQuestion", // post
  newHRUpdateQuestion: "NewHR/NewHRPerformance/UpdateQuestion", // post
  newHRReorderQuestions: "NewHR/NewHRPerformance/ReorderQuestions", // post
  newHRToggleQuestion: "NewHR/NewHRPerformance/ToggleQuestion", // post
  newHRDeleteQuestion: "NewHR/NewHRPerformance/DeleteQuestion", // post
  newHRGetCycleList: "NewHR/NewHRPerformance/GetCycleList", // get
  newHRGetPerformanceSummary: "NewHR/NewHRPerformance/GetPerformanceSummary", // get
  // Clearance config
  newHRGetClearanceDepartmentList: "NewHR/NewHRClearanceConfig/GetClearanceDepartmentList", // get
  newHRSaveClearanceDepartment: "NewHR/NewHRClearanceConfig/SaveClearanceDepartment", // post
  newHRUpdateClearanceDepartment: "NewHR/NewHRClearanceConfig/UpdateClearanceDepartment", // post
  newHRToggleClearanceDepartment: "NewHR/NewHRClearanceConfig/ToggleClearanceDepartment", // post
  newHRMoveClearanceDepartment: "NewHR/NewHRClearanceConfig/MoveClearanceDepartment", // post
  newHRDeleteClearanceDepartment: "NewHR/NewHRClearanceConfig/DeleteClearanceDepartment", // post
  newHRGetClearanceApproverList: "NewHR/NewHRClearanceConfig/GetClearanceApproverList", // get
  newHRSaveClearanceApprover: "NewHR/NewHRClearanceConfig/SaveClearanceApprover", // post
  newHRUpdateClearanceApprover: "NewHR/NewHRClearanceConfig/UpdateClearanceApprover", // post
  newHRToggleClearanceApprover: "NewHR/NewHRClearanceConfig/ToggleClearanceApprover", // post
  newHRDeleteClearanceApprover: "NewHR/NewHRClearanceConfig/DeleteClearanceApprover", // post
  newHRGetClearanceConfigSummary: "NewHR/NewHRClearanceConfig/GetClearanceConfigSummary", // get
  // Masters
  newHRGetBankList: "NewHR/NewHRMaster/GetBankList", // get
  newHRSaveBank: "NewHR/NewHRMaster/SaveBank", // post
  newHRUpdateBank: "NewHR/NewHRMaster/UpdateBank", // post
  newHRGetDepartmentList: "NewHR/NewHRMaster/GetDepartmentList", // get
  newHRSaveDepartment: "NewHR/NewHRMaster/SaveDepartment", // post
  newHRUpdateDepartment: "NewHR/NewHRMaster/UpdateDepartment", // post
  newHRGetDesignationList: "NewHR/NewHRMaster/GetDesignationList", // get
  newHRSaveDesignation: "NewHR/NewHRMaster/SaveDesignation", // post
  newHRUpdateDesignation: "NewHR/NewHRMaster/UpdateDesignation", // post
  newHRGetBranchList: "NewHR/NewHRMaster/GetBranchList", // get
  newHRSaveBranch: "NewHR/NewHRMaster/SaveBranch", // post
  newHRUpdateBranch: "NewHR/NewHRMaster/UpdateBranch", // post
  newHRGetEmploymentTypeList: "NewHR/NewHRMaster/GetEmploymentTypeList", // get
  newHRSaveEmploymentType: "NewHR/NewHRMaster/SaveEmploymentType", // post
  newHRUpdateEmploymentType: "NewHR/NewHRMaster/UpdateEmploymentType", // post
  newHRToggleEmploymentType: "NewHR/NewHRMaster/ToggleEmploymentType", // post
  newHRGetShiftList: "NewHR/NewHRMaster/GetShiftList", // get
  newHRSaveShift: "NewHR/NewHRMaster/SaveShift", // post
  newHRUpdateShift: "NewHR/NewHRMaster/UpdateShift", // post
  newHRGetHolidayList: "NewHR/NewHRMaster/GetHolidayList", // get
  newHRSaveHoliday: "NewHR/NewHRMaster/SaveHoliday", // post
  newHRUpdateHoliday: "NewHR/NewHRMaster/UpdateHoliday", // post
  newHRBindLookupGroups: "NewHR/NewHRMaster/BindLookupGroups", // get
  newHRGetLookupsByGroup: "NewHR/NewHRMaster/GetLookupsByGroup", // get
  newHRSaveLookup: "NewHR/NewHRMaster/SaveLookup", // post
  newHRDeleteLookup: "NewHR/NewHRMaster/DeleteLookup", // post
  // Employee special-leave eligibility mapping — PROPOSED endpoints; backend
  // controller + table not shipped yet. The frontend falls back to a local
  // store until these resolve (see employeeLeaveEligibilityStore.js).
  newHRGetEmployeeLeaveEligibilityList: "NewHR/NewHRMaster/GetEmployeeLeaveEligibilityList", // get
  newHRSaveEmployeeLeaveEligibility: "NewHR/NewHRMaster/SaveEmployeeLeaveEligibility", // post
  newHRUpdateEmployeeLeaveEligibility: "NewHR/NewHRMaster/UpdateEmployeeLeaveEligibility", // post
  newHRDeleteEmployeeLeaveEligibility: "NewHR/NewHRMaster/DeleteEmployeeLeaveEligibility", // post
  // Employee weekly-off policy (Saturday/Sunday off rules)
  newHRGetWeeklyOffPolicyList: "NewHR/NewHRMaster/GetWeeklyOffPolicyList", // get
  newHRSaveWeeklyOffPolicy: "NewHR/NewHRMaster/SaveWeeklyOffPolicy", // post
  newHRUpdateWeeklyOffPolicy: "NewHR/NewHRMaster/UpdateWeeklyOffPolicy", // post
  newHRDeactivateWeeklyOffPolicy: "NewHR/NewHRMaster/DeactivateWeeklyOffPolicy", // post
  newHRBulkAssignWeeklyOffPolicy: "NewHR/NewHRMaster/BulkAssignWeeklyOffPolicy", // post
  newHRGetWeeklyOffDates: "NewHR/NewHRMaster/GetWeeklyOffDates", // get
  // Designation-wise required documents
  newHRGetDesignationDocumentMapList: "NewHR/NewHRMaster/GetDesignationDocumentMapList", // get
  newHRSaveDesignationDocumentMap: "NewHR/NewHRMaster/SaveDesignationDocumentMap", // post
  // Increment master
  newHRGetIncrementMasterList: "NewHR/NewHRMaster/GetIncrementMasterList", // get
  newHRSaveIncrementMaster: "NewHR/NewHRMaster/SaveIncrementMaster", // post
  newHRUpdateIncrementMaster: "NewHR/NewHRMaster/UpdateIncrementMaster", // post
  newHRDeleteIncrementMaster: "NewHR/NewHRMaster/DeleteIncrementMaster", // post
  // Screen Field Builder (custom fields backed by real cf_ table columns)
  newHRFieldBuilderGetScreens: "NewHR/NewHRFieldBuilder/GetScreens", // get
  newHRFieldBuilderGetScreenLayout: "NewHR/NewHRFieldBuilder/GetScreenLayout", // get
  newHRFieldBuilderGetControlTypeCatalog: "NewHR/NewHRFieldBuilder/GetControlTypeCatalog", // get
  newHRFieldBuilderGetApiSources: "NewHR/NewHRFieldBuilder/GetApiSources", // get
  newHRFieldBuilderGetFieldOptions: "NewHR/NewHRFieldBuilder/GetFieldOptions", // get
  newHRFieldBuilderGetFieldUsage: "NewHR/NewHRFieldBuilder/GetFieldUsage", // get
  newHRFieldBuilderGetRecordValues: "NewHR/NewHRFieldBuilder/GetRecordValues", // get
  newHRFieldBuilderSaveRecordValues: "NewHR/NewHRFieldBuilder/SaveRecordValues", // post
  newHRFieldBuilderGetDdlAudit: "NewHR/NewHRFieldBuilder/GetDdlAudit", // get
  newHRFieldBuilderProbeApiSource: "NewHR/NewHRFieldBuilder/ProbeApiSource", // post
  newHRFieldBuilderTestFormula: "NewHR/NewHRFieldBuilder/TestFormula", // post
  newHRFieldBuilderAddField: "NewHR/NewHRFieldBuilder/AddField", // post
  newHRFieldBuilderUpdateField: "NewHR/NewHRFieldBuilder/UpdateField", // post
  newHRFieldBuilderReorderFields: "NewHR/NewHRFieldBuilder/ReorderFields", // post
  newHRFieldBuilderDeleteField: "NewHR/NewHRFieldBuilder/DeleteField", // post

  // Print / Template Designer — page + section + field layout for printable documents
  newHRPrintTemplateGetDocumentTypes: "NewHR/NewHRPrintTemplate/GetDocumentTypes", // get
  newHRPrintTemplateGetTemplates: "NewHR/NewHRPrintTemplate/GetTemplates", // get
  newHRPrintTemplateGetTemplate: "NewHR/NewHRPrintTemplate/GetTemplate", // get
  newHRPrintTemplateGetAvailableFields: "NewHR/NewHRPrintTemplate/GetAvailableFields", // get
  newHRPrintTemplateGetSampleData: "NewHR/NewHRPrintTemplate/GetSampleData", // get
  newHRPrintTemplateResolveTemplate: "NewHR/NewHRPrintTemplate/ResolveTemplate", // get
  newHRPrintTemplateSaveTemplate: "NewHR/NewHRPrintTemplate/SaveTemplate", // post
  newHRPrintTemplateCloneTemplate: "NewHR/NewHRPrintTemplate/CloneTemplate", // post
  newHRPrintTemplateSetDefault: "NewHR/NewHRPrintTemplate/SetDefault", // post
  newHRPrintTemplateDeleteTemplate: "NewHR/NewHRPrintTemplate/DeleteTemplate", // post
  newHRPrintTemplateApplyLayoutToAll: "NewHR/NewHRPrintTemplate/ApplyLayoutToAllDocuments", // post
  // Recruitment
  newHRGetRequisitionList: "NewHR/NewHRRecruitment/GetRequisitionList", // get
  newHRSaveRequisition: "NewHR/NewHRRecruitment/SaveRequisition", // post
  newHRApproveRequisition: "NewHR/NewHRRecruitment/ApproveRequisition", // post
  newHRRejectRequisition: "NewHR/NewHRRecruitment/RejectRequisition", // post
  newHRHoldRequisition: "NewHR/NewHRRecruitment/HoldRequisition", // post
  newHRCloseRequisition: "NewHR/NewHRRecruitment/CloseRequisition", // post
  newHRGetCandidateList: "NewHR/NewHRRecruitment/GetCandidateList", // get
  newHRSaveCandidate: "NewHR/NewHRRecruitment/SaveCandidate", // post
  newHRUpdateCandidateStage: "NewHR/NewHRRecruitment/UpdateCandidateStage", // post
  newHRExtendOffer: "NewHR/NewHRRecruitment/ExtendOffer", // post
  newHRSendOfferLetter: "NewHR/NewHRRecruitment/SendOfferLetter", // post
  newHRGetCandidateStageHistory: "NewHR/NewHRRecruitment/GetCandidateStageHistory", // get
  newHRGetInterviewList: "NewHR/NewHRRecruitment/GetInterviewList", // get
  newHRSaveInterview: "NewHR/NewHRRecruitment/SaveInterview", // post
  newHRUpdateInterview: "NewHR/NewHRRecruitment/UpdateInterview", // post
  newHRSaveInterviewFeedback: "NewHR/NewHRRecruitment/SaveInterviewFeedback", // post
  newHRGetRecruitmentFunnel: "NewHR/NewHRRecruitment/GetRecruitmentFunnel", // get
  newHRGetRecruitmentSummary: "NewHR/NewHRRecruitment/GetRecruitmentSummary", // get
  newHRGetDeptRoundMapList: "NewHR/NewHRRecruitment/GetDeptRoundMapList", // get
  newHRSaveDeptRoundMap: "NewHR/NewHRRecruitment/SaveDeptRoundMap", // post
  newHRGetInterviewRoundMaster: "NewHR/NewHRRecruitment/GetInterviewRoundMaster", // get
  newHRSaveInterviewRound: "NewHR/NewHRRecruitment/SaveInterviewRound", // post
  newHRReorderInterviewRounds: "NewHR/NewHRRecruitment/ReorderInterviewRounds", // post
  newHRDeleteInterviewRound: "NewHR/NewHRRecruitment/DeleteInterviewRound", // post
  // Reports
  newHRGetHeadcountTrend: "NewHR/NewHRReports/GetHeadcountTrend", // get
  newHRGetDepartmentSplit: "NewHR/NewHRReports/GetDepartmentSplit", // get
  newHRGetGenderMix: "NewHR/NewHRReports/GetGenderMix", // get
  newHRGetStatusMix: "NewHR/NewHRReports/GetStatusMix", // get
  newHRGetGradeDistribution: "NewHR/NewHRReports/GetGradeDistribution", // get
  newHRGetTenureDistribution: "NewHR/NewHRReports/GetTenureDistribution", // get
  newHRGetSalaryDistributionReport: "NewHR/NewHRReports/GetSalaryDistribution", // get
  newHRGetRecruitmentFunnelReport: "NewHR/NewHRReports/GetRecruitmentFunnelReport", // get
  newHRGetRecruitmentSourceMix: "NewHR/NewHRReports/GetRecruitmentSourceMix", // get
  newHRGetPayrollCostByDepartment: "NewHR/NewHRReports/GetPayrollCostByDepartment", // get
  newHRGetOtCostTrend: "NewHR/NewHRReports/GetOtCostTrend", // get
  newHRGetPayrollSummaryReport: "NewHR/NewHRReports/GetPayrollSummary", // get
  newHRGetReportsSummary: "NewHR/NewHRReports/GetReportsSummary", // get
  // Lifecycle
  newHRGetProbationList: "NewHR/NewHRLifecycle/GetProbationList", // get
  newHRConfirmProbation: "NewHR/NewHRLifecycle/ConfirmProbation", // post
  newHRExtendProbation: "NewHR/NewHRLifecycle/ExtendProbation", // post
  newHRGetExitList: "NewHR/NewHRLifecycle/GetExitList", // get
  newHRSaveExit: "NewHR/NewHRLifecycle/SaveExit", // post
  newHRAcceptExit: "NewHR/NewHRLifecycle/AcceptExit", // post
  newHRRejectExit: "NewHR/NewHRLifecycle/RejectExit", // post
  newHRWithdrawExit: "NewHR/NewHRLifecycle/WithdrawExit", // post
  newHRGetClearanceList: "NewHR/NewHRLifecycle/GetClearanceList", // get
  newHRGetClearanceDetail: "NewHR/NewHRLifecycle/GetClearanceDetail", // get
  newHRToggleClearanceItem: "NewHR/NewHRLifecycle/ToggleClearanceItem", // post
  newHRCompleteClearance: "NewHR/NewHRLifecycle/CompleteClearance", // post
  newHRGetRelievingList: "NewHR/NewHRLifecycle/GetRelievingList", // get
  newHRProcessRelieving: "NewHR/NewHRLifecycle/ProcessRelieving", // post
  newHRGetLifecycleSummary: "NewHR/NewHRLifecycle/GetLifecycleSummary", // get

  // --- NewHRSecurity (Build A: RBAC + audit trail) ---
  newHRGetMyPermissions: "NewHR/NewHRSecurity/GetMyPermissions", // get
  // Self-service identity: resolves the caller (login email) to their own
  // new_hr_employees row. Returns { EmployeeId, IsPrivileged, ... } or null.
  newHRGetMyEmployee: "NewHR/NewHRSecurity/GetMyEmployee", // get
  newHRGetRoles: "NewHR/NewHRSecurity/GetRoles", // get
  newHRSaveRole: "NewHR/NewHRSecurity/SaveRole", // post
  newHRGetPermissionMatrix: "NewHR/NewHRSecurity/GetPermissionMatrix", // get
  newHRSaveRolePermissions: "NewHR/NewHRSecurity/SaveRolePermissions", // post
  newHRGetUserRoles: "NewHR/NewHRSecurity/GetUserRoles", // get
  newHRSearchUsers: "NewHR/NewHRSecurity/SearchUsers", // get
  newHRAssignRole: "NewHR/NewHRSecurity/AssignRole", // post
  newHRRemoveUserRole: "NewHR/NewHRSecurity/RemoveUserRole", // post
  newHRGetAuditLogs: "NewHR/NewHRSecurity/GetAuditLogs", // get

  // --- NewHRPayroll (Build B: runs, compute engine, statutory, reimbursements) ---
  newHRGetPayrollRuns: "NewHR/NewHRPayroll/GetPayrollRuns", // get
  newHRCreatePayrollRun: "NewHR/NewHRPayroll/CreateRun", // post
  newHRLockAttendance: "NewHR/NewHRPayroll/LockAttendance", // post
  newHRComputeRun: "NewHR/NewHRPayroll/ComputeRun", // post
  newHRSendForReview: "NewHR/NewHRPayroll/SendForReview", // post
  newHRApproveRun: "NewHR/NewHRPayroll/ApproveRun", // post
  newHRDisburseRun: "NewHR/NewHRPayroll/DisburseRun", // post
  newHRGetPayslips: "NewHR/NewHRPayroll/GetPayslips", // get
  newHRHoldPayslip: "NewHR/NewHRPayroll/HoldPayslip", // post
  newHRReleasePayslip: "NewHR/NewHRPayroll/ReleasePayslip", // post
  newHRGetPayrollComponents: "NewHR/NewHRPayroll/GetComponents", // get
  newHRSavePayrollComponent: "NewHR/NewHRPayroll/SaveComponent", // post
  newHRReviseSalary: "NewHR/NewHRPayroll/ReviseSalary", // post
  newHRGetStatutory: "NewHR/NewHRPayroll/GetStatutory", // get
  newHRGenerateChallan: "NewHR/NewHRPayroll/GenerateChallan", // post
  newHRGetPayrollTrend: "NewHR/NewHRPayroll/GetPayrollTrend", // get
  newHRGetReimbursements: "NewHR/NewHRPayroll/GetReimbursements", // get
  newHRSaveReimbursement: "NewHR/NewHRPayroll/SaveReimbursement", // post
  newHRVerifyReimbursement: "NewHR/NewHRPayroll/VerifyReimbursement", // post
  newHRRejectReimbursement: "NewHR/NewHRPayroll/RejectReimbursement", // post
  newHRPayReimbursement: "NewHR/NewHRPayroll/PayReimbursement", // post
  newHRExportBankFile: "NewHR/NewHRPayroll/ExportBankFile", // get
  newHRExportEcr: "NewHR/NewHRPayroll/ExportEcr", // get
  newHRExportEsiReturn: "NewHR/NewHRPayroll/ExportEsiReturn", // get
  newHRExport24Q: "NewHR/NewHRPayroll/Export24Q", // get
  newHRExportForm16: "NewHR/NewHRPayroll/ExportForm16", // get

  // --- NewHRPayroll extension (Build C: remuneration/formula masters, upload,
  //     statutory config, standards-compliant compute, salary slips) ---
  // Screen 1 — Remuneration Master
  newHRPayrollGetComponentList: "NewHR/NewHRPayrollComponent/GetComponentList", // get
  newHRPayrollGetComponentDetail: "NewHR/NewHRPayrollComponent/GetComponentDetail", // get
  newHRPayrollSaveComponent: "NewHR/NewHRPayrollComponent/SaveComponent", // post
  newHRPayrollUpdateComponent: "NewHR/NewHRPayrollComponent/UpdateComponent", // post
  newHRPayrollDeleteComponent: "NewHR/NewHRPayrollComponent/DeleteComponent", // post
  newHRPayrollGetComponentUsage: "NewHR/NewHRPayrollComponent/GetComponentUsage", // get
  newHRPayrollBindComponentDropdown: "NewHR/NewHRPayrollComponent/BindComponentDropdown", // get
  newHRPayrollGetStatutoryConfigList: "NewHR/NewHRPayrollComponent/GetStatutoryConfigList", // get
  newHRPayrollSaveStatutoryConfig: "NewHR/NewHRPayrollComponent/SaveStatutoryConfig", // post
  newHRPayrollGetStatutorySlabList: "NewHR/NewHRPayrollComponent/GetStatutorySlabList", // get
  newHRPayrollSaveStatutorySlab: "NewHR/NewHRPayrollComponent/SaveStatutorySlab", // post
  newHRPayrollDeleteStatutorySlab: "NewHR/NewHRPayrollComponent/DeleteStatutorySlab", // post
  // Screen 2 — Formula Master
  newHRPayrollGetFormulaList: "NewHR/NewHRPayrollFormula/GetFormulaList", // get
  newHRPayrollGetFormulaDetail: "NewHR/NewHRPayrollFormula/GetFormulaDetail", // get
  newHRPayrollSaveFormula: "NewHR/NewHRPayrollFormula/SaveFormula", // post
  newHRPayrollUpdateFormula: "NewHR/NewHRPayrollFormula/UpdateFormula", // post
  newHRPayrollDeleteFormula: "NewHR/NewHRPayrollFormula/DeleteFormula", // post
  newHRPayrollValidateFormula: "NewHR/NewHRPayrollFormula/ValidateFormula", // post
  newHRPayrollTestFormula: "NewHR/NewHRPayrollFormula/TestFormula", // post
  newHRPayrollGetFormulaDependencyTree: "NewHR/NewHRPayrollFormula/GetFormulaDependencyTree", // get
  // Screen 3 — Upload Employee Remuneration
  newHRPayrollDownloadRemunerationTemplate: "NewHR/NewHRPayrollRemunerationUpload/DownloadRemunerationTemplate", // get
  newHRPayrollPreviewRemunerationUpload: "NewHR/NewHRPayrollRemunerationUpload/PreviewRemunerationUpload", // post
  newHRPayrollImportRemunerationUpload: "NewHR/NewHRPayrollRemunerationUpload/ImportRemunerationUpload", // post
  newHRPayrollDownloadRemunerationErrors: "NewHR/NewHRPayrollRemunerationUpload/DownloadRemunerationErrors", // get
  newHRPayrollCancelRemunerationUpload: "NewHR/NewHRPayrollRemunerationUpload/CancelRemunerationUpload", // post
  newHRPayrollGetUploadLogList: "NewHR/NewHRPayrollRemunerationUpload/GetUploadLogList", // get
  newHRPayrollGetEmployeeRemuneration: "NewHR/NewHRPayrollRemunerationUpload/GetEmployeeRemuneration", // get
  newHRPayrollPreviewEmployeeRemuneration: "NewHR/NewHRPayrollRemunerationUpload/PreviewEmployeeRemuneration", // post
  newHRPayrollSaveEmployeeRemuneration: "NewHR/NewHRPayrollRemunerationUpload/SaveEmployeeRemuneration", // post
  // Screen 4 — View Employee Remuneration
  newHRPayrollGetRemunerationList: "NewHR/NewHRPayrollRemuneration/GetRemunerationList", // get
  newHRPayrollGetRemunerationDetail: "NewHR/NewHRPayrollRemuneration/GetRemunerationDetail", // get
  newHRPayrollGetRemunerationHistory: "NewHR/NewHRPayrollRemuneration/GetRemunerationHistory", // get
  newHRPayrollExportRemuneration: "NewHR/NewHRPayrollRemuneration/ExportRemuneration", // get
  // Screen 5 — Calculate Salary
  newHRPayrollGetRunList: "NewHR/NewHRPayrollCalculation/GetRunList", // get
  newHRPayrollCreateCalcRun: "NewHR/NewHRPayrollCalculation/CreateRun", // post
  newHRPayrollDeleteCalcRun: "NewHR/NewHRPayrollCalculation/DeleteRun", // post
  newHRPayrollLockCalcAttendance: "NewHR/NewHRPayrollCalculation/LockAttendance", // post
  newHRPayrollComputeCalcRun: "NewHR/NewHRPayrollCalculation/ComputeRun", // post
  newHRPayrollGetRunResult: "NewHR/NewHRPayrollCalculation/GetRunResult", // get
  newHRPayrollGetRunEmployeeTrace: "NewHR/NewHRPayrollCalculation/GetRunEmployeeTrace", // get
  newHRPayrollGetRunExceptions: "NewHR/NewHRPayrollCalculation/GetRunExceptions", // get
  newHRPayrollSkipRunException: "NewHR/NewHRPayrollCalculation/SkipRunException", // post
  newHRPayrollLockCalcRun: "NewHR/NewHRPayrollCalculation/LockRun", // post
  newHRPayrollApproveCalcRun: "NewHR/NewHRPayrollCalculation/ApproveRun", // post
  newHRPayrollDisburseCalcRun: "NewHR/NewHRPayrollCalculation/DisburseRun", // post
  // Screen 6 — Salary Slip
  newHRPayrollGetSlipList: "NewHR/NewHRPayrollSlip/GetSlipList", // get
  newHRPayrollGetSlipDetail: "NewHR/NewHRPayrollSlip/GetSlipDetail", // get
  newHRPayrollDownloadSlipPdf: "NewHR/NewHRPayrollSlip/DownloadSlipPdf", // get
  newHRPayrollDownloadSlipsZip: "NewHR/NewHRPayrollSlip/DownloadSlipsZip", // get
  newHRPayrollEmailSlip: "NewHR/NewHRPayrollSlip/EmailSlip", // post
  newHRPayrollEmailRunSlips: "NewHR/NewHRPayrollSlip/EmailRunSlips", // post
  newHRPayrollGetMySlips: "NewHR/NewHRPayrollSlip/GetMySlips", // get
};
