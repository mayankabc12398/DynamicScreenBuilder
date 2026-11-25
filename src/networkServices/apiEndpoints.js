import { BindReportData } from "./CollectionReportApi";
import { BindTransactionTypes } from "./finance";
import { BindVendor } from "./InventoryApi";
import { getPatientIndentAPI } from "./pharmecy";

export const apiUrls = {
  // onBoarding
  BindOnboardingMasterURL: "Onboarding/BindOnboardingMaster",
  BindOnboardingDetailsURL: "Onboarding/BindOnboardingDetails",
  // onBoarding
  // Auth
  login: "Login/Login",
  LoginGetEmployeeForForget: "Login/GetEmployeeForForget",
  LoginSendForgetPassword: "Login/SendForgetPassword",
  ReportAIChatPdf: "ReportAI/ReportAIChatPdf",
  PageConfigurationURL: "CommonAPI/PageConfiguration",
  GetLoginPageImageURL: "CommonAPI/GetLoginPageImage",
  CKEditorShortKeyAPIControls: "CommonAPI/ShortKeyAPIControls",
  GetUserColumnPreferenceURL: "CommonAPI/GetUserColumnPreference",
  SaveUserColumnPreferenceURL: "CommonAPI/SaveUserColumnPreference",

  // What's New / Release Update module
  ReleaseCreate: "ReleaseUpdate/CreateRelease",
  ReleaseUpdateEdit: "ReleaseUpdate/UpdateRelease",
  ReleasePublish: "ReleaseUpdate/PublishRelease",
  ReleaseLatest: "ReleaseUpdate/GetLatestRelease",
  ReleaseHistory: "ReleaseUpdate/GetReleaseHistory",
  ReleaseAcknowledge: "ReleaseUpdate/AcknowledgeRelease",
  ReleasePending: "ReleaseUpdate/GetPendingRelease",
  ReleaseEmailConfigGet: "ReleaseUpdate/GetEmailConfig",
  ReleaseEmailConfigSave: "ReleaseUpdate/SaveEmailConfig",

  // Global Resource Master (fin_global_resources configuration keys)
  GlobalResourceList: "GlobalResource/GetGlobalResourceList",
  GlobalResourceSave: "GlobalResource/SaveGlobalResource",
  GlobalResourceStatus: "GlobalResource/UpdateGlobalResourceStatus",

  // IPD Auto Charge Scheduler (item auto-posted to admitted IPD patients by panel + billing category)
  IPDAutoChargeSchedulerList: "IPDAutoChargeScheduler/GetSchedulerList",
  IPDAutoChargeSchedulerSearchItems: "IPDAutoChargeScheduler/SearchItems",
  IPDAutoChargeSchedulerPanels: "IPDAutoChargeScheduler/GetPanelList",
  IPDAutoChargeSchedulerSave: "IPDAutoChargeScheduler/SaveScheduler",
  IPDAutoChargeSchedulerPause: "IPDAutoChargeScheduler/PauseScheduler",
  IPDAutoChargeSchedulerStatus: "IPDAutoChargeScheduler/UpdateSchedulerStatus",

  // Screen builder
  GetScreenBuilderCommonAPIURL: "CommonAPI/GetScreenBuilderCommonAPIList",
  SavescreenbuilderURL: "CommonAPI/Savescreenbuilder",
  GetScreenBuilderPageConfigurationURL:
    "CommonAPI/GetScreenBuilderPageConfiguration",
  SaveMasterPageConfigurationURL: "CommonAPI/SaveMasterPageConfiguration",

  // claim update

  UpdateCliam: "Claims/UpdateCliam",

  // Aftab url // -------- Doctor Share --------
  BindDoctorShareControls: "DocAccount/BindDoctorShareControls", // get
  BindDoctorShareCentreWiseDoctorWise:
    "DocAccount/BindDoctorShareCentreWiseDoctorWise", // post
  SaveDoctorShare: "DocAccount/SaveDoctorShare", // post
  SaveExcludePackageDetails: "DocAccount/SaveExcludePackageDetails", // post
  SaveDoctorConfiguration: "DocAccount/SaveDoctorConfiguration", // post
  ReCalculateDoctorWiseShare: "/DocAccount/ReCalculateDoctorWiseShare", // post
  BindDetail: "DocAccount/BindDetail", // verification / table search
  PostDoctorShareNew: "DocAccount/PostDoctorShareNew", // verify & post
  IgnoreItemBindDetail: "DocAccount/IgnoreItemBindDetail", // ignore post
  SaveIgnoreItem: "DocAccount/SaveIgnoreItem", // save ignore
  SaveRevertItem: "DocAccount/SaveRevertItem", // revert ignore
  BindPanel: "Master/BindPanel", //get scheme
  BindPanelGroup: "PanelDetail/BindPanelGroup", //get insurance
  DRAccountBindPanelGroup: "CreditControl/BindInsurance", //get insurance
  DRAccountBindScheme: "CreditControl/BindScheme", //get insurance
  PostDoctorShareNew: "DocAccount/PostDoctorShareNew", //verify & pot button
  IgnoreItemBindDetail: "DocAccount/IgnoreItemBindDetail", //igonre posy
  SaveIgnoreItem: "DocAccount/SaveIgnoreItem", //save ignore
  SaveRevertItem: "DocAccount/SaveRevertItem", //save ignore
  SavePanelAdvanceAmount: "CreditControl/SavePanelAdvanceAmount", //creditcontrol
  BindPanelAdvanceDetails: "CreditControl/BindPanelAdvanceDetails", //credit control get
  UpdatePanelAdvanceAmount: "CreditControl/UpdatePanelAdvanceAmount", //post
  BindPanelAdvanceAprovalDetails:
    "CreditControl/BindPanelAdvanceAprovalDetails", //post panel-adavance
  SaveApproval: "CreditControl/SaveApproval", //get panel-advance
  GenerateInvoiceDetail: "CreditControl/GenerateInvoiceDetail", //generativeinvoice post
  NotGenerateInvoiceDetail: "CreditControl/NotGenerateInvoiceDetail", //not genrariveinvoice post
  SaveInvoiceDispatch: "CreditControl/SaveInvoiceDispatch", //gerative post
  GenerateAndNotGenerateInvoiceRemark:
    "CreditControl/GenerateAndNotGenerateInvoiceRemark", //genrative remark post
  GenerateInvoiceReport: "CreditControl/GenerateInvoiceReport", //post print invoice
  SearchInvoiceDataBulkBillWise: "CreditControl/SearchInvoiceDataBulkBillWise", //post settlment
  DownLoadExcel: "CreditControl/DownLoadExcel", //settlement get
  UploadExcell: "CreditControl/UploadExcell", //settlement post
  WrongInvoiceBillsDeatils: "CreditControl/WrongInvoiceBillsDeatils", //settlement get
  BindInvoiceUploadedReport: "CreditControl/BindInvoiceUploadedReport", //settlement get
  CreditControlBindBank: "CreditControl/CreditControlBindBank", //get settleinvoce
  CreditControlBindCurrency: "CreditControl/CreditControlBindCurrency", //get settleinvoce
  BindPaymentModeOnlyBulkSettlement:
    "CreditControl/BindPaymentModeOnlyBulkSettlement", //get settleinvoce
  CreditControlBindSettlePanel: "CreditControl/CreditControlBindSettlePanel", //get settleinvoce
  CreditControlBindPanelAdvanceDetails:
    "CreditControl/CreditControlBindPanelAdvanceDetails", //get settleinvoce
  ExportToExcel: "CreditControl/ExportToExcel", //post excel
  BindInsuranceAndScheme: "CreditControl/BindInsuranceAndScheme", //get insurance and scheme
  BindAdvanceOnBehalf: "CreditControl/BindAdvanceOnBehalf", //get advance on behalf
  SaveMultipleSettlement: "CreditControl/SaveMultipleSettlement", //post settleinvoce
  GetExcelDoccShareReorts: "DocAccount/GetExcelDoccShareReorts", //post excel doctor share
  // payment control
  CreditLoadCurrencyDetail: "PaymentControl/LoadCurrencyDetail", //get settleinvoce
  CreditGetConversionFactor: "PaymentControl/GetConversionFactor", //get settleinvoce
  CreditgetConvertCurrecncy: "PaymentControl/getConvertCurrecncy", //post settleinvoce
  //panel Advance reprint
  AdvanceReprintDetail: "CreditControl/AdvanceReprintDetail", //post advance reprint
  AdvanceReceiptReprints: "CreditControl/AdvanceReceiptReprint", //post advance print

  // -------- Master / Panel --------
  BindPanel: "Master/BindPanel", // scheme
  BindPanelGroup: "PanelDetail/BindPanelGroup", // insurance

  // -------- Credit Control --------
  SavePanelAdvanceAmount: "CreditControl/SavePanelAdvanceAmount",
  BindPanelAdvanceDetails: "CreditControl/BindPanelAdvanceDetails",
  UpdatePanelAdvanceAmount: "CreditControl/UpdatePanelAdvanceAmount",
  BindPanelAdvanceAprovalDetails:
    "CreditControl/BindPanelAdvanceAprovalDetails",
  SaveApproval: "CreditControl/SaveApproval",

  // -------- Invoice --------
  GenerateInvoiceDetail: "CreditControl/GenerateInvoiceDetail",
  NotGenerateInvoiceDetail: "CreditControl/NotGenerateInvoiceDetail",
  SaveInvoiceDispatch: "CreditControl/SaveInvoiceDispatch",
  GenerateAndNotGenerateInvoiceRemark:
    "CreditControl/GenerateAndNotGenerateInvoiceRemark",
  GenerateInvoiceReport: "CreditControl/GenerateInvoiceReport",
  UpdateInvoiceClaimNo: "CreditControl/UpdateInvoiceClaimNo",
  BindPanelRemarks: "CreditControl/BindPanelRemarks",
  SavePanelRemark: "CreditControl/SavePanelRemark",
  SaveInvoicePanelRemark: "CreditControl/SaveInvoicePanelRemark",
  SearchInvoiceDataBulkBillWise: "CreditControl/SearchInvoiceDataBulkBillWise",

  // -------- Settlement / Excel --------
  DownLoadExcel: "CreditControl/DownLoadExcel",
  DownLoadExcelBulkBillWise: "CreditControl/DownLoadExcelBulkBillWise", //settlement post
  UploadExcell: "CreditControl/UploadExcell",
  WrongInvoiceBillsDeatils: "CreditControl/WrongInvoiceBillsDeatils",
  BindInvoiceUploadedReport: "CreditControl/BindInvoiceUploadedReport",
  // Aftab url

  BindPanel: "Master/BindPanel", //get scheme
  BindPanelGroup: "PanelDetail/BindPanelGroup", //get insurance
  PostDoctorShareNew: "DocAccount/PostDoctorShareNew", //verify & pot button
  IgnoreItemBindDetail: "DocAccount/IgnoreItemBindDetail", //igonre posy
  SaveIgnoreItem: "DocAccount/SaveIgnoreItem", //save ignore
  SaveRevertItem: "DocAccount/SaveRevertItem", //save ignore

  //Aditya
  CurrentStockFCConsentForm: "CurrentStock/FCConsentForm",
  CurrentStockCheckList: "CurrentStock/CheckList",
  CurrentStockChargeSheet: "CurrentStock/ChargeSheet",
  SampleCollectionTrfForm: "SampleCollection/Trf_Form",
  AuditLog: "AuditLog/Insert", // audit log
  MemberShipCardSave: "MembershipCardSeparate/SaveCard", // membership card send data
  GetCardDetails: "MembershipCardSeparate/GetCards", // GetCardDetails
  // membership card -> applicable-for + category/subcategory/item discount mapping
  MembershipGetDiscountMappings: "MembershipCardSeparate/GetDiscountMappings",
  MembershipSaveDiscountMapping: "MembershipCardSeparate/SaveDiscountMapping",
  MembershipSaveDiscountMappings: "MembershipCardSeparate/SaveDiscountMappings",
  MembershipDeleteDiscountMapping: "MembershipCardSeparate/DeleteDiscountMapping",
  MembershipGetCategories: "MembershipCardSeparate/GetCategories",
  MembershipGetSubCategories: "MembershipCardSeparate/GetSubCategories",
  MembershipGetItems: "MembershipCardSeparate/GetItems",
  // Template Designer & Print (generic engine)
  CoverNoteGetDocumentTypes: "CoverNote/GetDocumentTypes",
  CoverNoteGetTemplates: "CoverNote/GetTemplates",
  CoverNoteGetTemplate: "CoverNote/GetTemplate",
  CoverNoteCreateTemplate: "CoverNote/CreateTemplate",
  CoverNoteUpdateTemplate: "CoverNote/UpdateTemplate",
  CoverNoteDuplicateTemplate: "CoverNote/DuplicateTemplate",
  CoverNoteDeleteTemplate: "CoverNote/DeleteTemplate",
  CoverNoteSetDefaultTemplate: "CoverNote/SetDefaultTemplate",
  CoverNoteSearchRecords: "CoverNote/SearchRecords",
  CoverNoteResolveRecord: "CoverNote/ResolveRecord",
  CoverNotePrint: "CoverNote/Print",
  CoverNotePrintBatch: "CoverNote/PrintBatch",
  CoverNoteRenderByType: "CoverNote/RenderByType",
  CoverNoteGetPanels: "CoverNote/GetPanels",
  CoverNoteSearchBills: "CoverNote/SearchBills",
  CoverNoteGenerate: "CoverNote/GenerateCoverNote",
  BindCoverNoteData: "CoverNote/BindCoverNoteData",
  SaveCoverNote: "CoverNote/SaveCoverNote",
  CoverNoteGetBills: "CoverNote/GetCoverNoteBills",
  CoverNoteUpdate: "CoverNote/UpdateCoverNote",

  CoverNoteSearchCoverNotes: "CoverNote/SearchCoverNotes",
  CoverNoteGetLetterFormats: "CoverNote/GetLetterFormats",
  CoverNotePrintLetter: "CoverNote/PrintLetter",
  QualificationSave:"EDP/EmployeeSetUp/QualificationSave",
  SearchInterviewCandidate:"EDP/EmployeeSetUp/SearchInterviewCandidate",
  SearchInterViewRoundDetails : "EDP/EmployeeSetUp/SearchInterViewRoundDetails",
  SaveInterviewRoundDetails : "EDP/EmployeeSetUp/SaveInterviewRoundDetails",
  ReprintPersonnelForm : "EDP/EmployeeSetUp/ReprintPersonnelForm",
  CloseJobRequestInterviewProcess : "EDP/EmployeeSetUp/CloseJobRequestInterviewProcess",
  SearchCandidateAfterInterviewRound:"EDP/EmployeeSetUp/SearchCandidateAfterInterviewRound",
  GetPreviousAcknowledgerdetails:"EDP/EmployeeSetUp/getCandidatePreviousAcknowledgerdetails",
  BindInterViewInvolvedEmployees :"EDP/EmployeeSetUp/bindInterViewInvolvedEmployees",
  SaveLoginEmpProfile: "EDP/EmployeeSetUp/SaveLogin",
  BindStaffData: "EDP/EmployeeSetUp/BindStaffData",
  QualificationSave: "EDP/EmployeeSetUp/QualificationSave",
  SearchInterviewCandidate: "EDP/EmployeeSetUp/SearchInterviewCandidate",
  SearchInterViewRoundDetails: "EDP/EmployeeSetUp/SearchInterViewRoundDetails",
  SaveInterviewRoundDetails: "EDP/EmployeeSetUp/SaveInterviewRoundDetails",
  ReprintPersonnelForm: "EDP/EmployeeSetUp/ReprintPersonnelForm",
  CloseJobRequestInterviewProcess:
    "EDP/EmployeeSetUp/CloseJobRequestInterviewProcess",
  SearchCandidateAfterInterviewRound:
    "EDP/EmployeeSetUp/SearchCandidateAfterInterviewRound",
  GetPreviousAcknowledgerdetails:
    "EDP/EmployeeSetUp/getCandidatePreviousAcknowledgerdetails",
  BindInterViewInvolvedEmployees:
    "EDP/EmployeeSetUp/bindInterViewInvolvedEmployees",
  AuditLogView: "AuditLog/View", //  audit log serach and view
  // crdr not dispatch credit-control
  SearchPanelInvoiceCRDR: "CreditControl/SearchPanelInvoiceCRDR", //post crdr
  GetPanelInvoiceDetails_CRDR: "CreditControl/GetPanelInvoiceDetails_CRDR", //get showdetails
  GetPanelInvoiceBillItemsDetailsCRDR:
    "CreditControl/GetPanelInvoiceBillItemsDetailsCRDR", //post cdr model
  SaveOnlyPanelInvoiceCRDR: "CreditControl/SaveOnlyPanelInvoiceCRDR", //post crdr save
  SavePanelInvoiceCRDR: "CreditControl/SavePanelInvoiceCRDR", //post crdrsave2
  CancleInvoiceData: "CreditControl/CancleInvoiceData", // cancel get invoice
  SaveCancleInvoiceSettlement: "CreditControl/SaveCancleInvoiceSettlement", //cancel post invoice
  BindPanel: "Master/BindPanel", //get scheme
  BindPanelGroup: "PanelDetail/BindPanelGroup", //get insurance
  PostDoctorShareNew: "DocAccount/PostDoctorShareNew", //verify & pot button
  IgnoreItemBindDetail: "DocAccount/IgnoreItemBindDetail", //igonre posy
  SaveIgnoreItem: "DocAccount/SaveIgnoreItem", //save ignore
  SaveRevertItem: "DocAccount/SaveRevertItem", //save ignore

  // crdr not dispatch credit-control
  SearchPanelInvoiceCRDR: "CreditControl/SearchPanelInvoiceCRDR", //post crdr
  GetPanelInvoiceDetails_CRDR: "CreditControl/GetPanelInvoiceDetails_CRDR", //get showdetails
  GetPanelInvoiceBillItemsDetailsCRDR:
    "CreditControl/GetPanelInvoiceBillItemsDetailsCRDR", //post cdr model
  SaveOnlyPanelInvoiceCRDR: "CreditControl/SaveOnlyPanelInvoiceCRDR", //post crdr save
  SavePanelInvoiceCRDR: "CreditControl/SavePanelInvoiceCRDR", //post crdrsave2
  CancelInvoiceData: "CreditControl/CancelInvoiceData", // cancel get invoice
  SaveCancelInvoiceSettlement: "CreditControl/SaveCancelInvoiceSettlement", //cancel post invoice

  //aftab end

  // Language Api End Points
  SaveLanguage: "LanguageMaster/SaveLangauge",
  GetLangaugeURL: "LanguageMaster/GetLangauge",
  UpdateLangaugeURL: "LanguageMaster/UpdateLangauge",
  GetApplicationLanguageURL: "LanguageMaster/GetApplicationLanguage",

  // API cache admin (Cache Manager screen; admin roles only)
  CacheAdminStats: "CacheAdmin/Stats",
  CacheAdminClearTag: "CacheAdmin/ClearTag",
  CacheAdminClearAll: "CacheAdmin/ClearAll",
  CacheAdminWarmup: "CacheAdmin/Warmup",
  // Screen Load Monitor (/screen-load-monitor): live-screen loads per user
  ScreenLoadLogReport: "ScreenLoadLog/Report",
  ScreenLoadLogList: "ScreenLoadLog/List",
  ScreenLoadLogClear: "ScreenLoadLog/Clear",

  // master api
  UpdateUserTheme: "MasterPage/UpdateUserTheme",
  UpdateApplicationFont: "MasterPage/UpdateApplicationFont",
  ChangePassword: "MasterPage/ChangePassword",
  VerifyLoginPassword: "MasterPage/VerifyLoginPassword",
  UpdateEmployeeProfile: "MasterPage/UpdateEmployeeProfile",
  getRoleList: "MasterPage/CentreWiseRoleList",
  EmployeeWiseCentreList: "MasterPage/EmployeeWiseCentreList",
  BindMenuList: "MasterPage/BindMenu",
  getNotificationDetail: "MasterPage/Notification",
  BindFrameMenuByRoleID: "MasterPage/BindFrameMenuByRoleID",
  StoreState: "PatientControl/StateInsert",
  StateInsert: "PatientControl/StateInsert",
  DistrictInsert: "PatientControl/DistrictInsert",
  CityInsert: "PatientControl/CityInsert",
  PoliceStationInsert: "PatientControl/PoliceStationInsert",
  GetPoliceStations: "PatientControl/GetPoliceStations",
  GetAadhaarMissingPatients: "PatientControl/GetAadhaarMissingPatients",
  GetMLCMissingDocPatients: "PatientControl/GetMLCMissingDocPatients",
  CentreWiseCacheByCenterID: "PatientControl/CentreWiseCache",
  // CentreWiseCacheByCenterID: "PatientControl/CentreWiseCache",

  // DirectPatientReg Mayank START
  CentreWisePanelControlCache: "PanelControl/CentreWisePanelControlCache",
  GetPanelDocument: "PanelControl/GetPanelDocument",
  PanelControlSearchPatient: "PanelControl/SearchPatient",
  PanelControlpanelband: "PanelControl/panelband",
  PanelControlsearchlounumber: "PanelControl/searchlounumber",
  PanelControlsavepaneldetails: "PanelControl/SavePanelDetails",
  PanelControlUpdatePanelDetails: "PanelControl/UpdatePanelDetails",
  // GetPatientUploadDocument: "PatientControl/GetMasterDocuments",
  GetPatientDocument: "PatientControl/GetPatientDocumentUpload",

  GetPatientUploadDocument: "PatientControl/GetMasterDocument",
  // Panel documents scanned in the "Panel Document" popup (Add/Remove Panels List ->
  // Upload). They are stored against the visit, which is what lets Patient Encounter
  // History show them as one folder per visit day. Gated by ShowVisitWisePanelDocument.
  SavePatientPanelDocument: "PatientControl/SavePatientPanelDocument",
  GetPatientPanelDocumentVisitWise:
    "PatientControl/GetPatientPanelDocumentVisitWise",
  GetPatientPanelDocumentFile: "PatientControl/GetPatientPanelDocumentFile",
  CreateTypeOfReference: "PatientControl/CreateTypeOfReference",
  BindSeeMoreList: "CommonAPI/BindSeeMoreList",
  CommonAPIGetEmpBirthDay: "CommonAPI/GetEmpBirthDay",
  HIMSDashboardUserRightsURL: "Dashboard/HIMSDashboardUserRights",
  HIMSDashboardGraphicalURL: "Dashboard/HIMSDashboardGraphical",
  ValidateDuplicatePatientEntry: "PatientControl/ValidateDuplicatePatientEntry",
  GetAgeByDateOfBirth: "CommonAPI/GetAgeByDateOfBirth",
  SaveReg: "Registration/SaveReg",
  UpdateRegistration: "Registration/UpdateRegistration",
  DirectDepartmentIssue: "DirectDepartmentIssue/DirectDepartmentIssueReport",
  // DirectPatientReg Mayank END

  // FRONT OFFICE API
  getECHSDoctorListApi: "PatientControl/BindECHSDoctor",
  getECHSPolyclinicsListApi: "PatientControl/BindECHSPolyclinic",
  getReferEmployees: "CommonAPI/GetReferralEmployee",
  OPDDoctorConsulationData: "OPD/DoctorConsulationData",
  OPDDoctorsBySubCategory: "OPD/DoctorsBySubCategory",
  OPDGetChangeBillDetails: "OPD/GetChangeBillDetails",
  OPDUpdateBillReferDoctor: "OPD/UpdateBillReferDoctor",
  OPDUpdateBillDetails: "OPD/UpdateBillDetails",
  ChangeTransactionalPanel: "OPD/ChangeTransactionalPanel",
  ChangePatientRelationDetail: "OPD/ChangePatientRelationDetail",
  OPDPatientRelationDetail: "OPD/PatientRelationDetail",
  OPDChangeTransactionalDoctor: "OPD/ChangeTransactionalDoctor",
  OPDGetBillServiceDoctors: "OPD/GetBillServiceDoctors",
  OPDChangeServiceDoctor: "OPD/ChangeServiceDoctor",
  OPDCheckServiceDoctorRate: "OPD/CheckServiceDoctorRate",
  OPDBindUnitDoctors: "OPD/BindUnitDoctors",
  OPDChangeUnitDoctor: "OPD/ChangeUnitDoctor",
  OPDChangeInvestigationDoctor: "OPD/ChangeInvestigationDoctor",
  OPDGetIsFollowUpExist: "OPD/GetIsFollowUpExist",
  PatientFeedBackReport: "FeedBack/FeedBack/PatientDetailFeedBack",
  PatientFeedBackReportPrint: "FeedBack/FeedBack/PatientFeedBackReport",

  // payment control
  LoadCurrencyDetail: "PaymentControl/LoadCurrencyDetail",
  PaymentControlBindPaymentModePanelWise:
    "PaymentControl/BindPaymentModePanelWise",
  GetSwipMachine: "PaymentControl/GetSwipMachine",
  GetBankMaster: "PaymentControl/GetBankMaster",
  getConvertCurrecncy: "PaymentControl/getConvertCurrecncy",
  GetConversionFactor: "PaymentControl/GetConversionFactor",
  // opdServiceBooking ----sahil--
  Oldpatientsearch: "PatientControl/Oldpatientsearch",
  PatientSearchbyBarcode: "PatientControl/PatientSearchbyBarcode",
  BindReferDoctor: "PatientControl/BindReferDoctor",
  bindPanelByPatientID: "CommonAPI/bindPanelByPatientID",
  // Agent master for OPD booking
  BindAgent: "PatientControl/BindAgent",
  SaveAgent: "PatientControl/SaveAgent",
  UpdateAgent: "PatientControl/UpdateAgent",
  DeleteAgent: "PatientControl/DeleteAgent",
  SavePatientAgent: "PatientControl/SavePatientAgent",
  BindPatientAgent: "PatientControl/BindPatientAgent",
  BindRefferalType: "CommonAPI/bindReferalType",
  BindCorporatePanelList: "CommonAPI/BindCorporatePanelList",
  BindGetRMODoctor: "EDP/DoctorSetUp/GetRMODoctor",
  BindUserTypeSuperVisor: "EDP/EmployeeSetUp/BindUserTypeSuperVisor",
  BindPRO: "PatientControl/bindPRO",
  GetPatientRemarks: "PatientControl/GetPatientRemarks",
  GetPatientIPDAdmissionStatus: "PatientControl/GetPatientIPDAdmissionStatus",
  GetPatientIPDAdmissions: "PatientControl/GetPatientIPDAdmissions",
  GetExpiredPatientDocuments: "PatientControl/GetExpiredPatientDocuments",
  // IPD frame tab "Attendant Details"
  IPDAttendantList: "IPDAttendant/GetAttendants",
  IPDAttendantFilterList: "IPDAttendant/GetAttendantFilterList",
  IPDAttendantSave: "IPDAttendant/SaveAttendant",
  IPDAttendantCancel: "IPDAttendant/CancelAttendant",
  IPDAttendantDischarge: "IPDAttendant/DischargeAttendant",
  IPDAttendantRoomTypes: "IPDAttendant/GetRoomTypes",
  IPDAttendantAvailableBeds: "IPDAttendant/GetAvailableBeds",
  IPDAttendantVacateBed: "IPDAttendant/VacateAttendantBed",
  SavePatientRemark: "PatientControl/SavePatientRemark",
  BindArea: "PatientControl/BindArea",
  SaveArea: "PatientControl/SaveArea",
  UpdateArea: "PatientControl/UpdateArea",
  SavePatientType: "PatientControl/SavePatientType",
  UpdatePatientType: "PatientControl/UpdatePatientType",
  BindPostalAddress: "PatientControl/BindPostalAddress",
  SavePostalAddress: "PatientControl/SavePostalAddress",
  // Field Boy - master_fieldboy. OPD Booking par PRO ki jagah cash panel me.
  BindFieldBoy: "PatientControl/BindFieldBoy",
  SaveFieldBoy: "PatientControl/SaveFieldBoy",
  DeleteFieldBoy: "PatientControl/DeleteFieldBoy",
  PatientControlSearchBlacklist: "PatientControl/SearchBlacklist",
  PatientControlAddToBlacklist: "PatientControl/AddToBlacklist",
  FutureInvestigationsSaveFutureInv: "FutureInvestigations/SaveFutureInv",
  InvestigationsSearchFutureBookingInv:
    "FutureInvestigations/SearchFutureBookingInv",
  FutureInvestigationsGetPatientBookingReport:
    "FutureInvestigations/GetPatientBookingReport",
  FutureGetServicesContinueRequest:
    "FutureInvestigations/GetServicesContinueRequest",
  FutureInvestigationServicesContinueRequest:
    "FutureInvestigations/SearchPatientServicesContinueRequest",
  FutureInvestigationsSaveServiceContinueRequest:
    "FutureInvestigations/SaveServiceContinueRequest",
  FutureInvestigationsUpdateRequestStatus:
    "FutureInvestigations/UpdateRequestStatus",
  FutureInvestigationscancelBookingItem:
    "FutureInvestigations/cancelBookingItem",
  FutureInvestigationsGetBookingDetails:
    "FutureInvestigations/GetBookingDetails",
  FutureInvestigationITem: "FutureInvestigations/FutureInvestigationITem",
  FutureInvestigationsGetDataToFill: "FutureInvestigations/GetDataToFill",
  FutureInvestigationsOpenService: "FutureInvestigations/OpenService",
  FutureInvestigationsCloseService: "FutureInvestigations/CloseService",
  FutureInvestigationsStopService: "FutureInvestigations/StopService",
  FutureInvestigationsStartService: "FutureInvestigations/StartService",
  FutureInvestigationsGetDataVisitLog: "FutureInvestigations/GetDataVisitLog",
  FutureInvestigationsGetEncounterPendingActivities: "FutureInvestigations/GetEncounterPendingActivities",
  PatientControlUpdateBlacklist: "PatientControl/UpdateBlacklist",
  CommonAPISearchStaff: "CommonAPI/SearchStaff",
  BindDepartment: "CommonAPI/bindDepartment",
  BindDoctorDept: "CommonAPI/bindDoctorDept",
  BindHospitalDepartmentURL: "CommonAPI/BindHospitalDepartment",
  CommonAPIGetDoctorIDByEmployeeID: "CommonAPI/GetDoctorIDByEmployeeID",
  bindHashCode: "CommonAPI/bindHashCode",
  GetOPDSources: "OPDServiceBooking/GetOPDSources",
  RoleWiseOPDServiceBookingControls:
    "OPDServiceBooking/RoleWiseOPDServiceBookingControls",
  LoadOPD_All_ItemsLabAutoComplete:
    "CommonAPI/LoadOPD_All_ItemsLabAutoComplete",
  LoadOPD_All_Items: "CommonAPI/LoadOPD_All_Items",
  PackageExpirayDate: "OPDServiceBooking/PackageExpirayDate",
  ValidateDoctorMap: "OPDServiceBooking/ValidateDoctorMap",
  ValidateDoctorLeave: "OPDServiceBooking/ValidateDoctorLeave",
  GetDiscountWithCoPay: "CommonAPI/GetDiscountWithCoPay",
  getAlreadyPrescribeItem: "OPDServiceBooking/getAlreadyPrescribeItem",
  BindLabInvestigationRate: "PatientControl/BindLabInvestigationRate",
  GetAuthorization: "CommonAPI/GetAuthorization",
  BindResourceList: "CommonAPI/BindResourceList",
  GetAppointmentCount: "OPDServiceBooking/GetAppointmentCount",

  GetDoctorAppointmentTimeSlotConsecutive:
    "OPDServiceBooking/GetDoctorAppointmentTimeSlotConsecutive",

  DeleteMedicineTemplate: "PrescriptionAdvice/DeleteMedicineTemplate",
  SampleCollectionDiagonsis: "SampleCollection/SampleCollectionDiagonsis",
  SampleCollectionType: "SampleCollection/SampleCollectionType",
  GetBarcodeInfo: "SampleCollection/GetBarcodeInfo",

  BindPackageItemDetailsNew: "OPDServiceBooking/BindPackageItemDetailsNew",
  checkblacklist: "PatientControl/Checkblacklist",
  PatientControlGetOutStanding: "PatientControl/GetPatientOutStanding",
  ValidateForNotGeneratedInviceAndNotPaid:
    "OPD/ValidateForNotGeneratedInviceAndNotPaid",
  BindDisApproval: "PaymentControl/BindDisApproval",
  GetEligiableDiscountPercent: "PaymentControl/GetEligiableDiscountPercent",
  GetInvestigationTimeSlot: "OPDServiceBooking/GetInvestigationTimeSlot",
  BindModality: "CommonAPI/BindModality",
  HoldTimeSlot: "OPDServiceBooking/HoldTimeSlot",
  BindInvestigation: "OPDServiceBooking/BindInvestigation",
  // Which of the prescribed tests the doctor marked urgent, joined onto the
  // CPOE rows by PatientTest_ID.
  GetUrgentPrescribedTests: "OPDServiceBooking/GetUrgentPrescribedTests",
  // Razorpay collect (payment link + on-screen QR)
  RZPCreatePaymentLink: "RazorPay/CreatePaymentLink",
  RZPGetPaymentLinkStatus: "RazorPay/GetPaymentLinkStatus",
  RZPCreateQrCode: "RazorPay/CreateQrCode",
  RZPGetQrPayments: "RazorPay/GetQrPayments",
  // Future (booked) investigations
  SearchFutureBookingInv: "FutureInvestigations/SearchFutureBookingInv",
  GetFutureBookingDetails: "FutureInvestigations/GetBookingDetails",
  GetFutureBookingDetailsForBilling: "FutureInvestigations/GetBookingDetailsForBilling",
  HoldTimeSlot: "OPDServiceBooking/HoldTimeSlot",
  GetLastVisitDetail: "OPDServiceBooking/GetLastVisitDetail",
  GetIsDoctorVisitedToday: "OPDServiceBooking/GetIsDoctorVisitedToday",
  LastVisitDetails: "OPDServiceBooking/LastVisitDetails",
  OPDCheckPanelWiseRate: "OPD/CheckPanelWiseRate",
  OPDCheckDoctorWiseRate: "OPD/CheckDoctorWiseRate",
  StickerPrintVisitWiseReport: "Sticker_Print/VisitWiseReport",
  BindSmartCardCheckAndSlade: "SmartIntegration/BindSmartCardCheckAndSlade",
  KRABindbilldataBindBillData: "KRABindbilldata/BindBillData",
  KRABindbilldataPushToKRA: "KRABindbilldata/PushToKRA",
  BankAPIBankAPIInserAndInitiatePayment:
    "BankAPI/BankAPI/InserAndInitiatePayment",
  GetMemberDetails: "SmartIntegration/GetMemberDetails",
  BankAPIBankAPIGetResponse: "BankAPI/BankAPI/GetResponse",
  PanelControlGetPatientData: "PanelControl/GetPatientData",
  ApprovalSearchOPDBills: "Approval/SearchOPDBills",
  ApprovalGetApprovalExcel: "Approval/GetApprovalExcel",
  DebitCreditSearchPatientForApproval: "DebitCredit/SearchPatientForApproval",
  ApprovalGetItemToApproved: "Approval/GetItemToApproved",
  ApprovalCheckServiceApproval: "Approval/CheckServiceApproval",
  DebitCreditSaveCreditDebitSaveForApproval:
    "DebitCredit/SaveCreditDebitSaveForApproval",
  // Bill Item Edit - add a service to an existing OPD bill, and see what is on it.
  // Removing a line is a Credit Note and goes through the existing DebitCredit calls.
  BillItemEditSearchBills: "OPDBillItemEdit/SearchBills",
  BillItemEditGetBillItems: "OPDBillItemEdit/GetBillItems",
  BillItemEditSearchServices: "OPDBillItemEdit/SearchServices",
  BillItemEditAddBillItem: "OPDBillItemEdit/AddBillItem",
  BillItemEditSaveBillDiscount: "OPDBillItemEdit/SaveBillDiscount",
  ApprovalApprovedPaymentItemWise: "Approval/ApprovedPaymentItemWise",
  ApprovalApprovedCashCopayPaymentItemWise:
    "Approval/ApprovedCashCopayPaymentItemWise",
  DebitCreditRejectCreditDebitItem: "DebitCredit/RejectCreditDebitItem",

  SaveLabPrescriptionOPD: "OPDServiceBooking/SaveLabPrescriptionOPD",

  // Referral Dashboard - refer doctor / PRO / agent performance.
  ReferralDashboardSummary: "ReferralDashboard/Summary",
  ReferralDashboardDetail: "ReferralDashboard/Detail",
  //expense voucher API --Arshad--
  GetEmployeeDoctors: "ExpenseVoucher/GetEmployeeDoctors",
  GetExpenceHead: "ExpenseVoucher/GetExpenceHead",
  GetExpenceSubHead: "ExpenseVoucher/GetExpenceSubHead",
  getApproveBy: "ExpenseVoucher/GetApprovalBy",
  addNewExpense: "ExpenseVoucher/NewExpenceTo",
  getExpenseList: "ExpenseVoucher/GetExpenceList",
  saveExpense: "ExpenseVoucher/SaveExpence",
  ExpenseVoucherExpenseReport: "ExpenseVoucher/ExpenseReport",

  ExpenseGetEmployeeDoctors: "PaymentAtDesk/GetEmployeeDoctors",
  ExpenseGetRoles: "PaymentAtDesk/GetDepartments",
  ExpenseGetSubHead: "PaymentAtDesk/GetExpenceSubHead",
  ExpenseGetApprovalBy: "PaymentAtDesk/GetApprovalBy",
  ExpenseAddNewExpenseTo: "PaymentAtDesk/NewExpenceTo",
  ExpenseSaveExpense: "PaymentAtDesk/SaveExpence",
  ExpenseGetExpenseList: "PaymentAtDesk/GetExpenceList",
  ExpenseViewResume: "PaymentAtDesk/ExpenceViewResume",
  ExpensePrintExpenseReceipt: "ExpenseVoucher/PrintExpenseReceipt",
  // Opd Advance
  GetAdvanceReason: "OPDAdvance/GetAdvanceReason",
  CreateAdvanceReason: "OPDAdvance/CreateAdvanceReason",
  SaveAdvanceAmount: "OPDAdvance/SaveAdvanceAmount",
  CommonAPIBindOPDAdvanceMaster: "CommonAPI/BindOPDAdvanceMaster",

  // end OPD Advance

  // opd Settlement
  SearchOPDBills: "OPDSettlement/SearchOPDBills",
  SaveOPDSettlement: "OPDSettlement/SaveOPDSettlement",

  // IPD Pharmacy Bill Management
  GetIPDPharmacyBills: "IPDPharmacyBill/GetIPDPharmacyBills",
  GetIPDPharmacyBillItems: "IPDPharmacyBill/GetIPDPharmacyBillItems",
  SaveIPDPharmacyBulkDiscount: "IPDPharmacyBill/SaveIPDPharmacyBulkDiscount",

  // Pharmacy Bill Discount & Payment. Discount only - the screen's payment and
  // return modals call the existing SaveOPDSettlement and CRDRNotePharmacy calls.
  SearchPharmacyBills: "PharmacyBillDiscount/SearchPharmacyBills",
  GetPharmacyBillItems: "PharmacyBillDiscount/GetPharmacyBillItems",
  GetBillReceipts: "PharmacyBillDiscount/GetBillReceipts",
  SaveBillWiseDiscount: "PharmacyBillDiscount/SaveBillWiseDiscount",
  SaveMultipleBillDiscount: "PharmacyBillDiscount/SaveMultipleBillDiscount",
  GetBillDiscountAudit: "PharmacyBillDiscount/GetBillDiscountAudit",
  // Patient-wise tab: pick a patient, open all their bills, discount them together.
  SearchPharmacyPatients: "PharmacyBillDiscount/SearchPharmacyPatients",
  GetPatientPharmacyBills: "PharmacyBillDiscount/GetPatientPharmacyBills",
  SavePatientWiseDiscount: "PharmacyBillDiscount/SavePatientWiseDiscount",
  GetPharmacyStoreRoles: "PharmacyBillDiscount/GetPharmacyStoreRoles",

  // end opd settlement

  // Confirmation
  getAppointmentDetails: "Confirmation/GetApppointmentDetails",
  ConfirmationGetAppointmentReport: "Confirmation/GetAppointmentReport",
  updateAppointmentShedule: "Confirmation/UpdateDoctorAppointmentSchedule",
  previewAppointmentTransfer: "Confirmation/PreviewAppointmentTransfer",
  transferAppointments: "Confirmation/TransferAppointments",
  getDoctorDayAppointments: "Confirmation/GetDoctorDayAppointments",
  UpdateRadiologySchedule: "Confirmation/UpdateRadiologySchedule",
  GetDoctorMonthSlotSummary: "Confirmation/GetDoctorMonthSlotSummary",
  GetPatientDoctorAppointmentDetails:
    "OPDServiceBooking/GetPatientDoctorAppointmentDetails",
  // Receipt_Reprint
  GetReceiptDetailnew: "ReceiptRePrint/GetReceiptDetailnew",
  OPDBillClosed: "OPD/BillClosed",
  UpdateAppointmentStatus: "Confirmation/UpdateAppointmentStatus",
  // Card Print
  searchCardPrint: "CardPrint/Binddetail",
  UploadPhoto: "CardPrint/UploadPhoto",
  ViewPhoto: "CardPrint/ViewPhoto",
  getRadiologyAppointmentDetails:
    "Confirmation/GetRadiologyApppointmentDetails",
  getBindSubCategory: "CommonAPI/BindSubCategory",
  bindAppointmentDetail: "Confirmation/bindAppointmentDetail",
  UpdatePatientDetailInAppointmentByAppID:
    "Confirmation/UpdatePatientDetailInAppointmentByAppID",

  // debitCreditNote
  SearchPatientCreditDebit: "DebitCredit/SearchPatient",
  GetDepartmentWiseDetails: "DebitCredit/GetDepartmentWiseDetails",
  GetDepartmentItemDetails: "DebitCredit/GetDepartmentItemDetails",

  GetPanelList: "DebitCredit/GetPanelList",
  SaveCreditDebitDetails: "DebitCredit/SaveCreditDebitDetails",
  GetCRDRApprovalAuthorization: "DebitCredit/GetCRDRApprovalAuthorization",

  /* Patient Return (New). Its own controller, copied from DebitCredit so the new screen
     can change without any of it reaching the screen already in use. */
  PatientReturnSearchPatient: "PatientReturn/SearchPatient",
  PatientReturnDepartmentWiseDetails: "PatientReturn/GetDepartmentWiseDetails",
  PatientReturnItemDetails: "PatientReturn/GetDepartmentItemDetails",
  PatientReturnPanelList: "PatientReturn/GetPanelList",
  PatientReturnSave: "PatientReturn/SaveCreditDebitDetails",
  PatientReturnSaveForApproval: "PatientReturn/SaveCreditDebitSaveForApproval",
  GetPendingCRDRApprovalCount: "DebitCredit/GetPendingCRDRApprovalCount",
  GetDoctorChangeReceiptAuthorization: "OPD/GetDoctorChangeReceiptAuthorization",
  BillingToolBillClaimDetails: "Billing/Tool/BillClaimDetails",
  BillingToolSaveBillClaimDetails: "Billing/Tool/SaveBillClaimDetails",
  BillingToolChemoPatientDetail: "Billing/Tool/ChemoPatientDetail",
  BillingToolSaveChemoPatientDetail: "Billing/Tool/SaveChemoPatientDetail",
  BillingToolSearchChemoHistory: "Billing/Tool/SearchChemoHistory",
  BillingToolRemoveChemoPatientDetail: "Billing/Tool/RemoveChemoPatientDetail",
  BillingToolSearchWhatsAppLog: "Billing/Tool/SearchWhatsAppLog",
  BillingToolGetWhatsAppTemplateIDList: "Billing/Tool/GetWhatsAppTemplateIDList",
  BillingToolReSendWhatsAppMessages: "Billing/Tool/ReSendWhatsAppMessages",
  BillingToolGetWhatsAppLogHistory: "Billing/Tool/GetWhatsAppLogHistory",
  PanelControlGetPatientPendingBills: "PanelControl/GetPatientPendingBills",
  PanelControlGetPatientPanelAmountAllocationDetails:
    "PanelControl/GetPatientPanelAmountAllocationDetails",
  PanelControlSavePanelAmountAllocationDetails:
    "PanelControl/SavePanelAmountAllocationDetails",
  PanelControlpanelband: "PanelControl/panelband",
  DebitCreditGetPatientDetailsdeitcredit:
    "DebitCredit/GetPatientDetailsdeitcredit",

  // doctor Timming

  DoctorAppointmentStatusByDoctorID:
    "PrescriptionAdvice/DoctorAppointmentStatusByDoctorID",

  // Token Management
  getBindCenterAPI: "CommonAPI/BindCentre",
  getBindFloorAPI: "ModalityMaster/BindFloor",
  saveModality: "ModalityMaster/SaveModality",
  SearchModality: "ModalityMaster/SearchModality",
  GetCounter: "ExamCounterMaster/GetCounter",
  SaveCounter: "ExamCounterMaster/SaveCounter",
  deleteCounter: "ExamCounterMaster/UpdateActive",
  updateCounter: "ExamCounterMaster/UpdateCounter",
  CheckCenterExists: "ExamCounterMaster/CheckCenterExists",
  BindCategory: "CommonAPI/BindCategory",
  SearchInvestigationSlotSchedule:
    "OnlineInvSlotMaster/SearchInvestigationSlotSchedule",
  BindDocTimingShift: "OnlineInvSlotMaster/BindDocTimingShift",
  GetBindDetail: "RecieptTokenMaster/BindDetail",
  GetCategoryName: "RecieptTokenMaster/GetCategoryName",
  SaveTokenmasterDetail: "RecieptTokenMaster/SaveTokenmasterDetail",
  IsGroupNameExists: "RecieptTokenMaster/IsGroupNameExists",
  CheckTokenPrefixExist: "RecieptTokenMaster/CheckTokenPrefixExist",
  GetSubCategoryName: "RecieptTokenMaster/GetSubCategoryName",
  GetGroupName: "RecieptTokenMaster/GetGroupName",
  GetPanelName: "CommonAPI/GetPanel",
  GetCountryList: "CommonAPI/getCountry",
  GetStateList: "CommonAPI/getState",
  GetDistrictList: "CommonAPI/getDistrict",
  GetCityList: "CommonAPI/getCity",
  EDPCityInsert: "EDP/LocationMaster/CityInsert",
  EDPDeleteCity: "EDP/LocationMaster/DeleteCity",
  EDPUpdateCity: "EDP/LocationMaster/UpdateCity",

  // Reports
  // BindDetailUser: "DailyCollection/BindUser",
  // BindTypeOfTnx: "DailyCollection/BindTypeOfTnx",
  // BindSpeciality: "CommonAPI/BindSpeciality",
  LoadOPDDiagnosisItems: "CommonAPI/LoadOPDDiagnosisItems",

  // Reports

  BindDetailUser: "DailyCollection/BindUser",
  BindTypeOfTnx: "DailyCollection/BindTypeOfTnx",
  BindSpeciality: "CommonAPI/BindSpeciality",
  //Doctor Prescription Preview
  DoctorUpdatePrescriptionview: "Doctor/UpdatePrescriptionview",
  DoctorGetPrescriptionview: "Doctor/GetPrescriptionview",
  GetAllEyeFrameByPatinetId: "Doctor/GetAllEyeFrameByPatinetId",

  //GET DOCTOR DEPARTMENTS
  getDoctorDepartments: "PrescriptionAdvice/GetDoctorDepartment",
  ExaminationRoomBindAllergyList: "ExaminationRoom/BindAllergyList",
  ExaminationRoomBindTypeList: "ExaminationRoom/BindTypeList",
  ExaminationRoomSaveNewType: "ExaminationRoom/SaveNewType",

  // View Consultation // Doctor API
  // SearchList: "ViewConsultation/SearchList",
  SearchList: "Doctor/SearchPatientConsultation",
  UpdateCall: "ViewConsultation/UpdateCall",
  UpdateUncall: "ViewConsultation/UpdateUncall",
  UpdateIn: "ViewConsultation/UpdateIn",
  LoadPrescriptionView: "PrescriptionAdvice/LoadPrescriptionView",
  SearchChiefComplaintTemplate:
    "PrescriptionAdvice/SearchChiefComplaintTemplate",

  // Chief Complaint Template Mapping
  CCTemplateMapGetDoctors: "CCTemplateMap/GetDoctors",
  CCTemplateMapGetTemplates: "CCTemplateMap/GetTemplates",
  CCTemplateMapGetMapping: "CCTemplateMap/GetMapping",
  CCTemplateMapSaveMapping: "CCTemplateMap/SaveMapping",
  CCTemplateMapGetBindValues: "CCTemplateMap/GetBindValues",
  SearchPastHistory: "PrescriptionAdvice/SearchPastHistory",
  SearchTreatmentHistory: "PrescriptionAdvice/SearchTreatmentHistory",
  SearchPersonalHistory: "PrescriptionAdvice/SearchPersonalHistory",
  SearchGeneralExamination: "PrescriptionAdvice/SearchGeneralExamination",
  SystematicExamination: "PrescriptionAdvice/SystematicExamination",
  BindGroup: "ExaminationRoom/BindGroup",
  UpdateTemperatureRoomOut: "CPOE/UpdateTemperatureRoomOut",
  ExaminationRoomTransferPatientToOtherDr:
    "ExaminationRoom/TransferPatientToOtherDr",
  TemperatureRoomSearch: "ExaminationRoom/TemperatureRoomSearch",
  ExaminationRoomAddTriageBooking: "ExaminationRoom/AddTriageBooking",
  ExaminationRoomSaveTriageBooking: "ExaminationRoom/SaveTriageBooking",
  ExaminationRoomBindTriageBooking: "ExaminationRoom/BindTriageBooking",
  ExaminationRoomBindClinic: "ExaminationRoom/BindClinic",
  ExaminationRoomBindTriageCode: "ExaminationRoom/BindTriageCode",
  SearchProvisionalDiagnosis: "PrescriptionAdvice/SearchProvisionalDiagnosis",
  SearchDoctorAdvoice: "PrescriptionAdvice/SearchDoctorAdvoice",
  LoadInvestigation: "PrescriptionAdvice/LoadInvestigation",
  SearchPrescribeMedicine: "PrescriptionAdvice/SearchPrescribeMedicine",
  SearchDietTemplate: "PrescriptionAdvice/SearchDietTemplate",
  MedicineItemSearch: "PrescriptionAdvice/MedicineItemSearch",
  GetMedicineDose: "PrescriptionAdvice/GetMedicineDose",
  BindCPOEMenu: "Doctor/BindCPOEMenu",
  FileClose: "PrescriptionAdvice/FileClose",
  FileOpen: "PrescriptionAdvice/FileOpen",
  SaveTemplate: "PrescriptionAdvice/SaveTemplate",
  DeleteTemplate: "PrescriptionAdvice/DeleteLabTemplate",
  getHoldAPI: "PrescriptionAdvice/Hold",
  OutPatient: "PrescriptionAdvice/OutPatient",
  DoctorNotes: "PrescriptionAdvice/DoctorNotes",
  VaccinationStatus: "PrescriptionAdvice/VaccinationStatus",
  ProcedureItemSearch: "Doctor/ProcedureItemSearch",
  GetSignAndSymptoms: "Doctor/GetSignAndSymptoms",
  GetMolecular: "Doctor/GetMolecular",
  GetDoctor: "Doctor/GetDoctor",
  BindConsentType: "ConsentForm/BindConsentType",
  BindTemplateContent: "ConsentForm/BindTemplateContent",
  BindPatientConsent: "ConsentForm/BindPatientConsent",
  BindTemplate: "ConsentForm/BindTemplate",
  SaveConsentType: "ConsentForm/SaveConsentType",
  SavePatientConsent: "ConsentForm/SavePatientConsent",
  DeleteSelectedTemplate: "ConsentForm/DeleteSelectedTemplate",
  ConsentFormBindPatientConsentReport: "ConsentForm/BindPatientConsentReport",
  SaveConsentMaster: "PatientConsent/PatientConsent/SaveConsentMaster",
  GetConsentMaster: "PatientConsent/PatientConsent/GetConsentMaster",
  SaveMedicineTemplate: "PrescriptionAdvice/SaveMedicineTemplate",
  ViewDischargeSummaryBind: "ViewDischargeSummary/Bind",
  SaveVitals: "VitalSign/SaveVitals",
  AddTriageBooking: "ExaminationRoom/AddTriageBooking",
  ExaminationRoomBindDoctorDept: "ExaminationRoom/BindDoctorDept",
  UpdateVitals: "VitalSign/UpdateVitals",
  SaveDoctorVitals: "VitalSign/SaveDoctorVitals", // doctor's vitals strip (eight values only)
  BindDetails: "VitalSign/BindDetails",
  SavePrescription: "PrescriptionAdvice/SavePrescription",
  SaveSMS: "PrescriptionAdvice/SaveSMS",
  SaveSMSDoctorsEmployee: "EDP/SMSMaster/SaveSMSDoctorsEmployee",
  SendEmailToPatient: "PrescriptionAdvice/SendEmailToPatient",
  SearchByICDDesc: "FinalDiagnosis/SearchByICDDesc",
  SearchByICDCode: "FinalDiagnosis/SearchByICDCode",
  GetPatientDiagnosis: "FinalDiagnosis/GetPatientDiagnosis",
  DiagnosisInformationSave: "FinalDiagnosis/DiagnosisInformationSave",
  DeleteDiagnosis: "FinalDiagnosis/DeleteDiagnosis",
  SearchPatient: "ViewLabReports/SearchPatient",
  SearchPatient: "ViewLabReports/SearchPatient",
  GetPrescription: "PrescriptionAdvice/GetPrescription",
  SavePrescriptionDraft: "PrescriptionAdvice/SavePrescriptionDraft",
  GetOldAppointentData: "PrescriptionAdvice/GetOldAppointentData",
  SaveDoctorLeave: "Doctor/SaveDoctorLeave",
  BindLeave: "Doctor/BindLeave",
  UpdateDoctorLeave: "Doctor/UpdateDoctorLeave",
  BindPendingPages: "Doctor/BindPendingPages",
  BindAvailablePages: "Doctor/BindAvailablePages",
  MenuInsert: "Doctor/MenuInsert",
  MenuUpdate: "Doctor/MenuUpdate",
  SequenceUpdate: "Doctor/SequenceUpdate",
  SaveDoctorNA: "Doctor/SaveDoctorNA",
  BindDoctorNA: "Doctor/BindDoctorNA",
  BindProMaster: "DoctorRealtedOpdReports/BindProMaster",
  UpdateDoctorNA: "Doctor/UpdateDoctorNA",

  //Doctor Prescription multi print Api

  getAppointDetailsSearch: "PrescriptionAdvice/AppointDetailsSearch",
  getPrescriptionPrint:
    "DoctorPrescriptionPrint/MultipleDoctorPrescriptionReportPdf",

  // Dashboard API

  HIMSDashboard: "Dashboard/HIMSDashboard",
  HIMSDashboardTYPEID: "Dashboard/HIMSDashboardDetail",
  DashboardMISUserWiseGraphSetting: "Dashboard/MISUserWiseGraphSetting",
  ExecutiveDashboard: "ExecutiveDashboard/GetExecutiveDashboard",

  // IPDHelpDesk
  IPDDetail: "IPDHelpDesk/IPDDetail",
  Report: "IPDHelpDesk/Report",
  IPDLabHelpDesk: "IPDHelpDesk/SearchLabInvestigation",
  IPDEmployeeBindCountry: "EDP/Employee_Leave/bindCountry",
  IPDEmployeeBindCounty: "EDP/Employee_Leave/bindSubCounty",
  BindJobGrade: "EDP/Employee_Leave/bindJobGrade",
  BindReportingToEmp: "EDP/Employee_Leave/bindReportingToEmp",
  BindLeaveType: "EDP/Employee_Leave/bindLeaveType",
  BindWardHR: "EDP/Employee_Leave/bindWard",
  BindExistEmployee: "EDP/EmployeeSetUp/BindExistEmployee",
  SaveLeaveRequest: "EDP/EmployeeSetUp/SaveLeaveRequest",
  CancelLeaveRequest: "EDP/EmployeeSetUp/cancelLeaveRequest",
  BindLeaveAndHolidays: "EDP/EmployeeSetUp/BindLeaveAndHolidays",
  BindLocationEmpProfile: "EDP/EmployeeSetUp/bindLocation_EmployeeProfile",
  BindJobDocumentsType: "EDP/EmployeeSetUp/bindJobDocumentsType",
  SearchCandidateDetails: "EDP/EmployeeSetUp/SearchCandidateDetails",
  BindEmployeeBasicDetails: "EDP/EmployeeSetUp/BindEmployeeBasicDetails",
  BindEmployeeProfessionalDtl: "EDP/EmployeeSetUp/bindEmployeeProfessionalDtl",
  BindHrVacancy: "EDP/EmployeeSetUp/bindHrVacancy",
  BindRequsest: "EDP/EmployeeSetUp/BindRequsest",
  BindEmployeeJobExplation: "EDP/EmployeeSetUp/bindEmployeeJobExplation",
  BindIssueWarning: "EDP/EmployeeSetUp/bindIssueWarningDetail",
  ConfirmIssueWarning: "EDP/EmployeeSetUp/ConfirmIssueWarning",
  BindCommitteeMessageDetail: "EDP/EmployeeSetUp/BindCommitteeMessageDetail",
  BindEmployeeChatMessages: "EDP/EmployeeSetUp/BindEmployeeChatMessages",
  SaveEmployeeReplyEmp: "EDP/EmployeeSetUp/SaveEmployeeReplyEmp",
  
  BindTransportDoctor: "Transport/BindDoctor",
  EDPdietMasterBindward: "EDP/DietMaster/BindWard",
  IPDCommonGetCounty: "CommonAPI/GetCounty",
  IPDHelpDeskDoctor: "HelpDesk/GetEmployeeDoctors",
  IPDHelpDeskSave: "HelpDesk/SavePatientFeedbackScreen",

  // PackageDetailOPD
  BindOPDPackage: "OPDPackageDetail/BindOPDPackage",
  PackageDetail: "OPDPackageDetail/PackageDetail",
  BindPackageRate: "OPDPackageDetail/BindPackageRate",
  GetOpdPackageDetail: "OPD/GetOpdPackageDetail",

  // PanelDetail

  BindPanelGroup: "PanelDetail/BindPanelGroup",
  PanelSearch: "PanelDetail/PanelSearch",

  // CostEstimateBilling
  BindRoomType: "SurgeryEstimate/BindRoomType",
  BindIPDPackage: "SurgeryEstimate/BindIPDPackage",
  BindSurgery: "SurgeryEstimate/BindSurgery",
  BindPredefinedEstimation: "SurgeryEstimate/BindPredefinedEstimation",
  BindPreEstimateCost: "SurgeryEstimate/BindPreEstimateCost",
  BindEstimationByDefault: "SurgeryEstimate/BindEstimationByDefault",
  SaveCostEstimation: "SurgeryEstimate/SaveCostEstimation2",
  EstimateMedicineSearch: "SurgeryEstimate/EstimateMedicineSearch",
  SearchCostEstimationPrint: "CostEstimationReprint/SearchCostEstimationPrint",
  SearchCostEstimation: "CostEstimationReprint/SearchCostEstimation",

  // Billings
  AdmissionType: "IPDDetail/AdmissionType",
  RoomType: "IPDDetail/RoomType",
  RoomTypeWithoutRoleFilter: "IPDDetail/RoomTypeWithoutRoleFilter",
  BillingCategory: "IPDDetail/BillingCategory",
  BindRoomBed: "IPDDetail/BindRoomBed",
  BindFloor: "IPDDetail/BindFloor",
  PatientSearch: "IPDDetail/PatientSearch",
  SaveIPDAdmission: "IPDDetail/SaveIPDAdmission",
  SaveCashPanelBillApprovalRequest: "IPDDetail/SaveCashPanelBillApprovalRequest",
  SearchCashPanelBillApprovalRequest: "IPDDetail/GetCashPanelBillApprovalList",
  ApproveCashPanelBillApprovalRequest: "IPDDetail/UpdateCashPanelBillApproval",
  IPDAdmissionReport: "CurrentStock/IPDAdmissionReport",
  IPDVisitorPass: "CurrentStock/IPDVisitorPass",
  CounsellingSearchIPDPatient: "PatientCounselling/SearchIPDPatient",
  CounsellingGetCounselling: "PatientCounselling/GetCounselling",
  CounsellingSaveCounselling: "PatientCounselling/SaveCounselling",
  CounsellingPrintCounselling: "PatientCounselling/PrintCounselling",
  bindPanelRoleWisePanelGroupWise: "IPDDetail/bindPanelRoleWisePanelGroupWise",
  BindInsuranceOfPatient: "Emergency/BindInsuranceOfPatient",
  GetPatientAdmissionDetails: "IPDDetail/GetPatientAdmissionDetails",
  UpdatePatientAdmissionDetails: "IPDDetail/UpdatePatientAdmissionDetails",
  IsReceivedPatient: "IPDDetail/IsReceivedPatient",
  GetNotAdmittedReason: "IPDDetail/GetNotAdmittedReason",
  GetBillDetails: "PatientBilling/GetBillDetails",
  SendProvisionalBillSms: "PatientBilling/SendProvisionalBillSms",
  GetBindDepartment: "PatientBilling/GetBindDepartment",
  GetBillItemEditLog: "PatientBilling/GetBillItemEditLog",
  GetAllAuthorization: "PatientBilling/GetAllAuthorization",
  PatientBillingBindItem: "PatientBilling/BindItem",
  LoadDetails: "Clearance/LoadDetails",
  CheckDetails: "Clearance/CheckDetails",
  SaveClearance: "Clearance/SaveClearance",
  BindCurrencyDetails: "Clearance/BindCurrencyDetails",
  LoadMedetail: "Clearance/LoadMedetail",
  BindIPDPatientDetails: "IPDAdvance/BindIPDPatientDetails",
  getCTBRequestDetail: "IPDAdvance/getCTBRequestDetail",
  SelectIPDDetail: "IPDAdvance/SelectIPDDetail",
  GetDiscReason: "PaymentControl/GetDiscReason",
  CurrencyDetail: "PaymentControl/LoadCurrencyDetail",
  SaveDiscReason: "IPDAdvance/SaveDiscReason",
  SaveIPDAdvance: "IPDAdvance/SaveIPDAdvance",
  SendPanelApprovalEmail: "PanelRequest/SendPanelApprovalEmail",
  GetPanelApprovalDetails: "PanelRequest/GetPanelApprovalDetails",
  BindPanelDetail: "PanelRequest/BindPanelDetail",
  BindPanels: "PanelRequest/BindPanels",
  IPDAdvanceBindPatientDetails: "IPDAdvance/BindPatientDetails",
  BillingShowItemDetails: "Billing/ShowItemDetails",
  // Har department ek saath - IPD Billing ke liye, jo sab khole rakhta hai.
  BillingShowAllItemDetails: "Billing/ShowAllItemDetails",
  BindItemSurgery: "InvesigationRequisition/BindItemSurgery",
  BindDocType: "IPDAdvance/BindDocType",
  Rate: "IPDAdvance/Rate",
  SaveSurgery: "IPDAdvance/SaveSurgery",
  PatientBillingGetDiscount: "PatientBilling/GetDiscount",
  BillingGetRateFromFollowedPanel: "Billing/GetRateFromFollowedPanel",
  BillingSaveSaveServicesBilling: "BillingSave/SaveServicesBilling",
  BindHouseList: "EDP/LaboratorySetup/BindHouseList",
  GetItemHouse: "EDP/LaboratorySetup/GetItemHouse",
  BillingSaveGetPendingBarcodes: "BillingSave/GetPendingBarcodes",
  // IPD me service save hote hi usi save ka parcha
  IPDServiceBillPdf: "IPDServiceReceipt/ServiceBillPdf",
  PatientBillingEditPackage: "PatientBilling/EditPackage",
  BillingRemarkLoadRemarks: "BillingRemark/LoadRemarks",
  BillingRemarkSaveRemark: "BillingRemark/SaveRemark",
  BillingRemarkSave: "BillingRemark/SaveUserRemark",
  userRemarkLoad: "BillingRemark/LoadUserRemarks",
  BillingRemarkSaveUserRemark: "BillingRemark/UserRemarkSaveRemark",
  BillingRemarkSaveItemRemark: "BillingRemark/SaveItemRemark",
  PatientBillingUpdateModal: "PatientBilling/UpdateDiscountOnBill",
  GetDiscountCategoryBreakup: "PatientBilling/GetDiscountCategoryBreakup",
  DeleteDiscountCategory: "PatientBilling/DeleteDiscountCategory",
  IPDAdvanceLoadSurgeryDetail: "IPDAdvance/LoadSurgeryDetail",
  IPDAdvanceLoadSurgery: "IPDAdvance/LoadSurgery",
  ReportMenu: "Billing/ReportMenu",
  ReportSubMenu: "Billing/ReportSubMenu",
  BindSupplier: "Billing/BindSupplier",
  CurrentStockSelfDeclaration: "CurrentStock/SelfDeclaration",
  CurrentStockDischargeSlip: "CurrentStock/DischargeSlip",
  DischargeCardSearch: "CurrentStock/DischargeCardSearch",
  DischargeCardPrint: "CurrentStock/DischargeCardPrint",
  NursingERGetAssessment: "NursingERAssessment/GetAssessment",
  NursingERSaveAssessment: "NursingERAssessment/SaveAssessment",
  NursingERPrintAssessment: "NursingERAssessment/PrintAssessment",
  PeripheralCannulaGet: "PeripheralCannula/GetCannulas",
  PeripheralCannulaSave: "PeripheralCannula/SaveCannula",
  PeripheralCannulaDelete: "PeripheralCannula/DeleteCannula",
  PeripheralCannulaPrint: "PeripheralCannula/PrintCannula",
  FallRiskSAIHGet: "FallRiskSAIH/GetAssessment",
  FallRiskSAIHSave: "FallRiskSAIH/SaveAssessment",
  FallRiskSAIHPrint: "FallRiskSAIH/PrintAssessment",
  EmergencyIARNextNo: "EmergencyInitialAssessment/NextNo",
  EmergencyIARGetPatient: "EmergencyInitialAssessment/GetPatient",
  EmergencyIARSearch: "EmergencyInitialAssessment/SearchRecords",
  EmergencyIARGet: "EmergencyInitialAssessment/GetRecord",
  EmergencyIARSave: "EmergencyInitialAssessment/SaveRecord",
  EmergencyIARPrint: "EmergencyInitialAssessment/PrintRecord",
  CurrentStockGeneralConsertForm: "CurrentStock/GeneralConsertForm",
  // Emergency Print menu - Moderate Sedation Consent Form (JC/IPD/F-29).
  CurrentStockModerateSedationConsentForm: "CurrentStock/ModerateSedationConsentForm",
  CurrentStockMinorProcedureConsentForm: "CurrentStock/MinorProcedureConsentForm",
  CurrentStockHighRiskConsentForm: "CurrentStock/HighRiskConsentForm",
  CurrentStockDeathCauseCertificate: "CurrentStock/DeathCauseCertificate",
  CurrentStockEmergencyAssessmentForm: "CurrentStock/EmergencyAssessmentForm",

  //PanelApproval
  BindApprovalData: "PanelRequest/BindApprovalData",
  PanelApprovalReject: "PanelRequest/PanelApprovalReject",
  GetPanelAprovalAmount: "PanelRequest/GetPanelAprovalAmount",
  UpdateBilling: "PanelRequest/UpdateBilling",
  BindStoreDepartment: "MedicineRequisition/BindStoreDepartment",
  ToolBindDepartment: "Tool/BindDepartment",
  BindItem: "MedicineRequisition/BindItem",
  BindSubcategory: "MedicineRequisition/BindSubcategory",
  BindRoute: "MedicineRequisition/BindRoute",
  GetTimeDuration: "MedicineRequisition/GetTimeDuration",
  PatientBillingReject: "PatientBilling/DebitCreditNodeOnReject",
  PatientBillingSaveEdit: "/PatientBilling/SaveEdit",
  PatientBillingChangeItemDoctor: "PatientBilling/ChangeItemDoctor",
  PatientBillingAllTabSave: "PatientBilling/AllTabSave",
  PatientBillingGetPackage: "PatientBilling/GetPackage",
  PatientBillingGetPackageDetail: "PatientBilling/GetPackageDetail",
  IPDLabRadiologyReport: "Billing/BillingReports/IPDLabRadiologyReport",
  BillingGetIPDPackageAudit: "Billing/GetIPDPackageAudit",
  OPDAddOrRemoveIPDPackage: "OPD/AddOrRemoveIPDPackage",
  getAlreadyPrescribeItem: "OPDServiceBooking/getAlreadyPrescribeItem",
  LoadIndentMedicine: "MedicineRequisition/LoadIndentMedicine",
  LoadMedicineSet: "MedicineAdviceOld/LoadMedicineSet",
  LoadMedSetItems: "MedicineRequisition/LoadMedSetItems",
  LoadIndentItems: "MedicineRequisition/LoadIndentItems",
  SaveIndent: "MedicineRequisition/SaveIndent",
  GetMedicineStock: "MedicineRequisition/GetMedicineStock",
  BindRequisitionType: "MedicineRequisition/BindRequisitionType",
  PatientBillingItemPackageSave: "PatientBilling/ItemPackageSave",
  BillingIPDPackageReject: "Billing/IPD/PackageReject",
  PatientBillingPayable: "PatientBilling/Payable",
  MISBedManagementSummary: "MIS/MIS/BedManagementSummary",
  MISBindBedStatus: "MIS/MIS/BindBedStatus",
  SaveRequisition: "MedicineRequisition/SaveRequisition",
  SaveIndentInvestigatinMedcine: "Doctor/SaveIndentInvestigatinMedcine",
  BindPatientReturnDetails:
    "MedicineReturnRequisition/BindPatientReturnDetails",
  BillingCTBDetail: "Billing/IPD/CTBDetail",
  BillingIPDSaveBillSheetTiming: "Billing/IPD/SaveBillSheetTiming",
  SearchBillSheetTiming: "Billing/IPD/SearchBillSheetTiming",
  BillingIPDSaveCTBDetail: "Billing/IPD/SaveCTBDetail",
  BillingIPDGetCTBDetails: "Billing/IPD/GetCTBDetails",
  DoctorAndRoomShift: "DoctorShift/DoctorAndRoomShift",
  SaveDoctorShiftRequest: "DoctorShift/SaveDoctorShiftRequest",
  GetDoctorShiftRequests: "DoctorShift/GetDoctorShiftRequests",
  GetDoctorShiftRequestList: "DoctorShift/GetDoctorShiftRequestList",
  GetIPDPatientDoctors: "IPDAdditionalDoctor/GetIPDPatientDoctors",
  AddIPDDoctor: "IPDAdditionalDoctor/AddIPDDoctor",
  RemoveIPDDoctor: "IPDAdditionalDoctor/RemoveIPDDoctor",
  ApproveDoctorShiftRequest: "DoctorShift/ApproveDoctorShiftRequest",
  RejectDoctorShiftRequest: "DoctorShift/RejectDoctorShiftRequest",
  CancelDoctorShift: "DoctorShift/CancelDoctorShift",
  CancelRoomShift: "DoctorShift/CancelRoomShift",
  approveRoomShiftRequest: "DoctorShift/ApproveRoomShiftRequest",
  BindDocDetails: "DoctorShift/BindDocDetails",
  IPDAdvanceGetCTBList: "IPDAdvance/GetCTBList",
  IPDAdvanceGetCTBDetails: "IPDAdvance/GetCTBDetails",
  IPDAdvanceGetCTBDetailsReport: "IPDAdvance/GetCTBDetailsReport",
  BindRoomDetails: "DoctorShift/BindRoomDetails",
  SaveInvestigationRequisition:
    "InvesigationRequisition/SaveInvestigationRequisition",
  LoadDiffPanelRates: "TariffChange/LoadDiffPanelRates",
  SaveTariffic: "TariffChange/SaveTariffic",
  BindBloodGroup: "BloodBank/BindBloodGroup",
  LoadItems: "BloodBank/LoadItems",
  SaveReturnReuisition: "MedicineReturnRequisition/SaveReturnReuisition",
  BindOtIndent: "PatientBilling/BindOtIndent",
  UpdateBloodgroup: "BloodBank/UpdateBloodgroup",
  SaveBloodBank: "BloodBank/SaveBloodBank",
  BindRequestDetails: "BloodBank/BindRequestDetails",
  GetPatientAdjustmentDetails: "IPDAdvance/GetPatientAdjustmentDetails",
  GetPatientReceipt: "IPDAdvance/GetPatientReceipt",
  GetApproval: "Approval/GetApproval",
  UpdateApproval: "Approval/UpdateApproval",
  CommonReceiptPdf: "CommonReciept_PDF/CommonReceiptPdf",
  SaveReceiptToPatientDocument: "CommonReciept_PDF/SaveReceiptToPatientDocument",
  PatientAdvancePrintBuilderPdfURL: "PrintBuilder/GeneratePdf",
  pharmecyissuePrintBuilderURL: "PrintBuilder/CommonReceiptPdf",
  PrintBuilderGeneratePdfPrintBuilder: "PrintBuilder/GeneratePdf",
  CommonReceiptData: "CommonReciept_PDF/CommonReceiptData",

  GetStickersReceipt: "Sticker_Print/Sticker_PrintPDF",
  BindHospLedgerAccount: "IPDAdvance/BindHospLedgerAccount",
  RevenueAnalysisDetail: "IPDBillingStatus/RevenueAnalysisDetail",
  PatientAdmittedList: "IPDBillingStatus/PatientAdmittedList",
  DischargeIntimation: "IPDBillingStatus/DischargeIntimation",
  BillFreezedButNotDischarged: "IPDBillingStatus/BillFreezedButNotDischarged",
  PatientDischarged: "IPDBillingStatus/PatientDischarged",
  DischargedButBillNotGenerated:
    "IPDBillingStatus/DischargedButBillNotGenerated",
  BillGenerated: "IPDBillingStatus/BillGenerated",
  IPDBillRegisterSummary: "IPDBillingStatus/IPDBillRegisterSummary",
  getStoreBindDepartment: "Requisition/BindDepartment",
  GetCategoryByStoreType: "Requisition/GetCategoryByStoreType",
  GetSubCategoryByCategory: "Requisition/GetSubCategoryByCategory",
  GetStore: "Requisition/GetStore",
  BindSubGroup: "IssueDepartment/BindSubGroup",
  // BindStoreDepartment :"CommonAPI/BindStoreDepartment",
  GetItems: "Requisition/GetItems",
  GetItemStockDetailsRequisition: "Requisition/GetItemStockDetails",
  BindStoreRequisitionDepartment: "Requisition/BindDepartment",
  getCreateRequisition: "Requisition/CreateRequisition",
  GetAutoPurchaseRequestItemsApi: "Requisition/GetAutoPurchaseRequestItems",
  BindEmployeeInPanel: "Master/BindEmployee",
  BindItemsInPanel: "Pharmacy/BindPharmacyInvoiceItems",
  BindSearchItems: "Pharmacy/PharmacyInvoiceSearch",

  //======================GET BILL API=======================
  getIncludeBill: "OPD/GetBillDetails",
  saveOPDSaveLabPackageDetails: "OPD/OPDSaveLabPckageDetails",

  //Discharge Tracker
  LoadDetailsTracker: "DischargeTracker/LoadDetails",
  DischargeTrackerReport: "DischargeTracker/DischargeTrackerReport",

  // NurseAssignment
  bindAvailablenurse: "NurseAssignment/bindAvailablenurse",
  RoomTypeNurse: "IPDDetail/RoomType",
  BindFloorNurse: "IPDDetail/BindFloor",
  SearchNurse: "NurseAssignment/Search",
  SaveNurseAssignment: "NurseAssignment/SaveNurseAssignment",

  // sampleCOllection
  SearchSampleCollectionWord: "NursingWard/SearchSampleCollectionWord",
  SearchInvestigation: "SampleCollection/SearchInvestigation",
  BindSampleType: "SampleCollection/BindSampleType",
  SaveSamplecollection: "SampleCollection/SaveSamplecollection",
  SampleArchieveSearchSampleArchive: "SampleArchieve/SearchSampleArchive",
  SampleArchievesave: "SampleArchieve/save",
  SampleArchieveShowDetails: "SampleArchieve/ShowDetails",
  SampleRejection: "SampleCollection/SampleRejection",
  SampleCollUploadDocument: "NursingWard/UploadDocument",
  bindSampleColleDocumentURL: "NursingWard/bindAttachment",
  SampleCollOpenDocumentURL: "NursingWard/bindAttachment",

  // reports Api start here

  SampleCollectionReport: "SampleCollectionReport/SearchSampleCollection",
  SampleOutSource: "SampleCollectionReport/SearchOutSourceCollection",
  LabCountReport: "LaboratoryCountReport/LabReport",
  BindDepartmentCount: "LaboratoryCountReport/BindDepartment",

  // SampleCollection Module
  // SearchSampleCollection: "SampleCollection/SearchSampleCollection",
  SearchSampleCollection: "SampleCollection/SearchSampleCollections",
  BindCentre: "SampleCollection/BindCentre",
  SampleTransferSearchInvestigation:
    "SampleCollection/SampleTransferSearchInvestigation",
  SaveSampleTransfer: "SampleCollection/SaveSampleTransfer",
  SampleDispatchSearch: "SampleCollection/SampleDispatchSearch",
  LogisticReceiveSearch: "LogisticReceive/SearchInvestigation",
  LogisticReceiveSaveLogistic: "LogisticReceive/SaveLogistic",

  // Category Medication Record
  CategoryMedicationRecord: "NursingWard/BindCategoryMedicationRecordNew",
  BindMedicineGrid: "NursingWard/BindMedicineGrid",
  BindMedicineDetail: "NursingWard/BindMedicineDetail",
  MedicineTimes: "NursingWard/MedicineTimes",
  FreQuency: "NursingWard/FreQuency",
  Route: "NursingWard/Route",
  MedicineDetailsSave: "NursingWard/MedicineDetailsSave",
  DiscontinueMedicine: "NursingWard/DiscontinueMedicine",
  VerifiedByQrCode: "NursingWard/VerifiedByQrCode",
  SaveDoseDetails: "NursingWard/SaveDoseDetails",
  MedicineDetailsCancel: "NursingWard/MedicineDetailsCancel",
  BindMedicationRecord: "NursingWard/BindMedicationRecord",
  SaveMedicationRecord: "NursingWard/SaveMedicationRecord",
  CancelMedicationRecord: "NursingWard/CancelMedicationRecord",

  // vitalSign
  SearchVitalSignChart: "NursingWard/SearchVitalSignChart",
  SaveVitalSignChart: "NursingWard/SaveVitalSignChart",
  UpdateVitalSignChart: "NursingWard/UpdateVitalSignChart",
  PrintVitalSignChart: "NursingWard/PrintVitalSignChart",
  // Nusing progressnote
  SearchNursingProgress: "NursingWard/SearchNursingProgress",
  SaveNursingProgress: "NursingWard/NursingProgress",
  UpdateClickNursingProgress: "NursingWard/UpdateClickNursingProgress",
  DeleteNursingProgress: "NursingWard/DeleteNursingProgress",
  PrintNurNote: "NursingWard/PrintNurNote",
  NursingWardSaveRoomShiftRequset: "NursingWard/Nursing/SaveRoomShiftRequset",
  NursingWardGetRoomShiftRequset: "NursingWard/Nursing/GetRoomShiftRequset",
  NursingWardRejectRoomShiftRequset:
    "NursingWard/Nursing/RejectRoomShiftRequset",

  // oxygen Record form
  bindOxygenData: "NursingWard/bindOxygenData",
  bindOxygenRecord: "NursingWard/bindOxygenRecord",
  validateOxygenRecord: "NursingWard/validateOxygenRecord",
  SaveOxygenRecord: "NursingWard/SaveOxygenRecord",
  UpdateOxygenRecord: "NursingWard/UpdateOxygenRecord",
  MachineSettingRecord: "EDP/OTMaster/SaveOxygenmachinesetting",
  UpdateOxygenMachine: "EDP/OTMaster/UpdateOxygenmachinesetting",

  // Blood Gas Chart
  bindGasBloodChart: "NursingWard/GrdNursingbind",
  BloodGasChartSave: "NursingWard/BloodGasChartSave",
  BloodGasChartUpdate: "NursingWard/BloodGasChartUpdate",
  BloodGasChartPrintURL: "NursingWard/BloodGasChartPrint",

  // PhysiologicalEarlyWarning
  BindPhysiologicalEarlyWarning: "NursingWard/BindPhysiologicalEarlyWarning",
  PhysiologicalSearchAssessmentData:
    "NursingWard/PhysiologicalSearchAssessmentData",
  SaveEarlyWarningScoringDetails: "NursingWard/SaveEarlyWarningScoringDetails",

  // nurseWard
  BindDiabiaticParticular: "NursingWard/BindDiabiaticParticular",
  DiabeticChartSave: "NursingWard/DiabeticChartSave",
  BindDiabiaticChart: "NursingWard/BindDiabiaticChart",
  DiabeticChartUpdate: "NursingWard/DiabeticChartUpdate",
  DiabeticChartPrintURL: "NursingWard/DiabeticChartPrint",
  getDiabaticInsulationMasterAll: "NursingWard/GetDiabaticInsulationMasterAll",
  // intake and outputchart
  NursingWardBindData: "/NursingWard/BindData",
  NursingWardSaveIntake: "/NursingWard/SaveIntake",
  NursingWardIntakeOutPutChartPrintURL: "/NursingWard/IntakeOutPutChartPrint",

  // NursesDischargeNote

  NursingWardBindDetails: "/NursingWard/BindDetails",
  NursingWardNursingDischargeSave: "NursingWard/NursingDischargeSave",
  NursingWardNursingDischargeDeleting: "NursingWard/NursingDischargeDeleting", //pending

  // needle injury

  NursingWardBindNeedleName: "NursingWard/BindNeedleName",
  NursingWardNeedleInjurySave: "NursingWard/NeedleInjurySave",
  NursingWardBindInjury: "NursingWard/BindInjury",

  // NICU Serum

  NursingWardBindGraphTemp: "NursingWard/BindGraphTemp",
  NursingWardSerumBilirubinSave: "NursingWard/SerumBilirubinSave",

  // Bady Charts
  NursingWardGetBabyCharDetails: "NursingWard/GetBabyCharDetails",
  NursingWardSaveBabyChart: "NursingWard/SaveBabyChart",
  NursingWardBabyChartPrintURL: "NursingWard/BabyChartPrint",

  // discharge checklist

  NursingWardBindPatientDetail: "NursingWard/BindPatientDetail",
  NursingWardSaveCheckList: "NursingWard/SaveCheckList",
  NursingWardUpdateCheckList: "NursingWard/UpdateCheckList",
  NursingWardDischargeCheckListPrintURL: "NursingWard/DischargeCheckListPrint",

  // DeceasedPatientDetail

  NursingWardBindDeceasedPatientDetail: "NursingWard/BindDeceasedPatientDetail",
  NursingWardDeceasedPrint: "NursingWard/DeceasedPrint",
  NursingWardDeceasedUpdateCheckList: "NursingWard/DeceasedUpdateCheckList",
  NursingWardDeceasedSaveCheckList: "NursingWard/DeceasedSaveCheckList",

  // adult fall Risk Assesment

  NursingWardSaveAssessMentRecord: "NursingWard/SaveAssessMentRecord",
  NursingWardSearchAssessmentData: "NursingWard/SearchAssessmentData",
  NursingWardUpdateAssessMentRecord: "NursingWard/UpdateAssessMentRecord",

  // update Patient Documents
  NursingWardPatientDocumentDetail: "/NursingWard/PatientDocumentDetail",
  NursingWardSaveViewUploadDocument: "NursingWard/SaveViewUploadDocument",

  // BindBabyFeeding

  NursingWardBindBabyFeeding: "NursingWard/BindBabyFeeding",
  NursingWardSaveBabyFeeding: "NursingWard/SaveBabyFeeding",

  // credit Control

  // genreate Invoice

  CreditControlSearch: "CreditControl/Search",
  CreditControlSaveDispatch: "CreditControl/SaveDispatch",

  // cancel invoice

  CreditControlInvoiceSearch: "CreditControl/InvoiceSearch",
  CreditControldispatchData: "CreditControl/dispatchData",
  CreditControlDispatchCancel: "CreditControl/DispatchCancel",

  // invoice settlement
  CreditControlPanelInvoiceSearch: "CreditControl/PanelInvoiceSearch",
  CreditControlBindInoviceData: "CreditControl/BindInoviceData",

  // discharge summary

  DischargeSummaryBindReportHeader: "/DischargeSummary/BindReportHeader",
  DischargeSummaryBindConsultant: "DischargeSummary/BindConsultant",
  DischargeSummaryConsultantAdd: "DischargeSummary/ConsultantAdd",
  DischargeSummaryDeleteConsultant: "DischargeSummary/DeleteConsultant",
  DischargeSummaryDRHeader: "DischargeSummary/DRHeader",
  DischargeSummaryBindRoute: "DischargeSummary/BindRoute",
  DischargeSummaryBindTimeofNextDose: "DischargeSummary/BindTimeofNextDose",
  DischargeSummaryBindMeal: "DischargeSummary/BindMeal",
  DischargeSummaryBindTime: "DischargeSummary/BindTime",
  DischargeSummaryEMRMedicine: "DischargeSummary/EMRMedicine",
  DischargeSummaryICDDescriptionSave: "DischargeSummary/ICDDescriptionSave",
  DischargeSummaryBindPatient: "DischargeSummary/BindPatient",
  DischargeSummaryICDCodeRemove: "DischargeSummary/ICDCodeRemove",
  DischargeSummaryICDMasterSave: "DischargeSummary/ICDMasterSave",
  BindEMRMedicine: "DischargeSummary/BindEMRMedicine",
  DeleteEMRMedicine: "DischargeSummary/DeleteEMRMedicine",
  BindEMRInvItem: "DischargeSummary/BindEMRInvItem",
  DischargeClinicalRecord: "DischargeClinicalRecord/Get",
  SaveEMRInvItem: "DischargeSummary/SaveEMRInvItem",

  NuclearMedicine: "DischargeSummary/SaveNuclearMedTest",
  GetNuclearMedicineTable: "DischargeSummary/GetNuclearMedTest",
  UpdateNuclearMedTest: "DischargeSummary/UpdateNuclearMedTest",

  // Discharge Report
  DRDetailsLoadHeaders: "DRDetails/LoadHeaders",
  DRDetailsGetDRDetails: "DRDetails/GetDRDetails",
  DRDetailsLoadTemplates: "DRDetails/LoadTemplates",
  DRDetailsLoadTemplatesByDiagnosis: "DRDetails/LoadTemplatesByDiagnosis",
  DRDetailsBindDetails: "DRDetails/BindDetails",
  DRDetailsBindApprovalDoctor: "DRDetails/BindApprovalDoctor",
  DRDetailsTemplateChange: "DRDetails/TemplateChange",
  DRDetailsTemplateDelete: "DRDetails/TemplateDelete",
  DRDetailsSaveDischargeSummary: "DRDetails/SaveDischargeSummary",
  DRDetailsPatientTemplateDelete: "DRDetails/PatientTemplateDelete",
  // DRDetailsBindApprovalDoctor: "DRDetails/BindApprovalDoctor",
  DRDetailsApproveDischargeSummary: "DRDetails/ApproveDischargeSummary",
  DRDetailsGetAmendmentHistory: "DRDetails/GetAmendmentHistory",

  // dischargeSummary master

  DischargeSummarySaveEMRHeader: "DischargeSummary/SaveEMRHeader",
  DischargeSummaryBindEMRHeader: "DischargeSummary/BindEMRHeader",
  DischargeSummarySaveEMRHeaderTable: "DischargeSummary/SaveEMRHeaderTable",
  DischargeSummaryDeleteEMRHeader: "DischargeSummary/DeleteEMRHeader",

  // dischargeSummary setHeaderDeptWise

  DischargeSummaryBindHeaderList: "DischargeSummary/BindHeaderList",
  DischargeSummarySaveSetHeaderDeptWise:
    "DischargeSummary/SaveSetHeaderDeptWise",

  // dischargeSummary setHeaderMandoratoy

  DischargeSummaryBindHeader: "DischargeSummary/BindHeader",
  DischargeSummaryBindDischargeType: "DischargeSummary/BindDischargeType",
  DischargeSummarySaveDischargeType: "DischargeSummary/SaveDischargeType",
  DischargeSummaryDeleteDischargeType: "DischargeSummary/DeleteDischargeType",

  // MRD
  MRDBindPatientType: "MRD/BindPatientType",
  MRDBindCaseType: "MRD/BindCaseType",
  MRDBindPanelIPD: "MRD/BindPanelIPD",
  MRDBindParentPanel: "MRD/BindParentPanel",
  MRDBindDischargeType: "MRD/BindDischargeType",
  MRDSearchGrid: "MRD/SearchGrid",
  MRDPatientSearchMRDRecieved: "MRD/PatientSearchMRDRecieved",
  MRDBindDocuments: "MRD/BindDocuments",
  MRDFileRegisterSave: "/MRD/FileRegisterSave",
  MRDBindgrd: "MRD/Bindgrd",
  MRDScanFileUpload: "MRD/ScanFileUpload",
  MRDScanFileView: "MRD/ScanFileView",
  MRDBindRoomCMB: "MRD/BindRoomCMB",
  MRDBindAlmirah: "MRD/BindAlmirah",
  MRDBindShelf: "MRD/BindShelf",
  MRDSetLocation: "MRD/SetLocation",
  MRDSearchPatient: "MRD/SearchPatient",
  MRDSaveSentFile: "MRD/SaveSentFile",
  MRDMRDSentfilestatus: "MRD/MRDSentfilestatus",
  MRDMRDRequisitionSearch: "/MRD/MRDRequisitionSearch",
  MRDSaveMRDRequisition: "MRD/SaveMRDRequisition",
  SaveMRDReturnFile: "MRD/SaveMRDReturnFile",
  MRDGetFileStatus: "MRD/GetFileStatus",
  MRDMLCDetailUpdate: "MRD/MLCDetailUpdate",
  MRDBindDetails: "MRD/BindDetails",
  MRDSearchMRDRequisition: "MRD/SearchMRDRequisition",
  MRDApprovedRequisition: "MRD/ApprovedRequisition",
  MRDSearchRequisition: "MRD/SearchRequisition",
  MRDSearchIssueFile: "MRD/SearchIssueFile",
  MRDBindPatientDetails: "MRD/BindPatientDetails",
  MRDBindPatientDetail: "MRD/BindPatientDetail",
  MRDBindFileDetailURL: "MRD/BindFileDetail",
  MRDBindRequisitionDetailURL: "MRD/BindRequisitionDetail",
  MRDBindFileDocURL: "MRD/BindFileDoc",
  MRDBindEmployeeURL: "MRD/BindEmployee",
  MRDFileIssueSaveURL: "MRD/FileIssueSave",
  MRDFileReturnSave: "/MRD/FileReturnSave",
  EnDisableSave: "/MRD/EnDisableSave",
  MRDSearch: "MRD/Search",
  MRDSavedocument: "MRD/Savedocument",
  MRDBindDocumentlist: "MRD/BindDocumentlist",
  MRDEditDcouementName: "MRD/EditDcouementName",
  MRDBindRoom: "MRD/BindRoom",
  MRDSaveNewRoom: "MRD/SaveNewRoom",
  MRDBindMRDRack: "MRD/BindMRDRack",
  MRDSaveNewRack: "MRD/SaveNewRack",
  MRDBindRackDetail: "MRD/BindRackDetail",
  MRDSaveLoation: "MRD/SetLocationSave",
  BindNABH: "MRD/BindNABH",
  // pdf url
  CommonReciept_PDFCommonReceiptPdf: "CommonReciept_PDF/CommonReceiptPdf",
  NursingWardDeceasedPrint: "NursingWard/DeceasedPrint",
  NursingWardPrintNurNote: "NursingWard/PrintNurNote",
  NursingWardDischargeCheckListPrint: "NursingWard/DischargeCheckListPrint",
  NursingWardDiabeticChartPrint: "NursingWard/DiabeticChartPrint",
  NursingWardIntakeOutPutChartPrint: "NursingWard/IntakeOutPutChartPrint",
  PrintSticker: "CardPrint/PrintSticker",
  ViewReqEmgPrintURL: "Emergency/PatientRequisitionReportPdf",
  PrintCard: "CardPrint/PrintCard",
  GetOPDCardDoctors: "CardPrint/GetOPDCardDoctors",
  GetConsultationHeaderInfo: "CardPrint/GetConsultationHeaderInfo",
  PhysiologicalEWSPrint: "NursingWard/PhysiologicalEWSPrint",
  BloodGasChartPrint: "NursingWard/BloodGasChartPrint",
  NursingWardAdultFallRiskPrint: "NursingWard/AdultFallRiskPrint",
  NursingWardNeedleInjuryPrint: "NursingWard/NeedleInjuryPrint",
  NursingWardBabyChartPrint: "NursingWard/BabyChartPrint",
  DoctorPrescriptionPrint:
    "DoctorPrescriptionPrint/DynamicDoctorPrescriptionReportPdf",

  //top 5 suggestion by doctor ID - Akhilesh
  DoctorPrescriptionPrintGetSuggestion: "DoctorPrescriptionPrint/GetSuggestion",
  createPreRegistrationApi: "DoctorDisplay/CreatePreRegistration",
  getPreRegistrationByMobile: "DoctorDisplay/GetPreRegistrationByMobile",
  centreWiseCacheDisplay: "DoctorDisplay/CentreWiseCacheDisplay",
  DoctorDisplayGetPreRegisteredUsers: "DoctorDisplay/GetPreRegisteredUsers",
  GmailGetDoctorMeeting: "Gmail/GetDoctorMeeting",

  //investigation Manual Entry
  GetInvestigationManualEntries:
    "DoctorPrescriptionPrint/GetInvestigationManualEntries",
  DoctorPrescriptionPrintCreateInvestigationManualEntries:
    "DoctorPrescriptionPrint/CreateInvestigationManualEntries",
  DoctorPrescriptionPrintGetPatientManualEntry:
    "DoctorPrescriptionPrint/GetPatientManualEntry",
  DoctorPrescriptionPrintGetInvestigationManualEntriesbyDate:
    "DoctorPrescriptionPrint/GetInvestigationManualEntriesbyDate",

  //eye form ----------------
  DoctorSaveEyeFrame: "Doctor/SaveEyeFrame",

  // Onco Assessment (EMR form) - pain, examination, neck nodes and TNM staging.
  // Stored as key/value rows per visit, same shape as the eye form.
  SaveOncoAssessment: "Doctor/SaveOncoAssessment",
  GetOncoAssessment: "Doctor/GetOncoAssessment",

  // Surgical Oncology Assessment & Treatment Plan (EMR form). Its own storage:
  // each form's save supersedes the visit's rows in its own table.
  SaveSurgicalOncoAssessment: "Doctor/SaveSurgicalOncoAssessment",
  GetSurgicalOncoAssessment: "Doctor/GetSurgicalOncoAssessment",

  // Radiotherapy Treatment Prescription (EMR form). Its own storage, for the same
  // reason as the other oncology forms: each one supersedes its visit's rows.
  SaveRadiotherapyPrescription: "Doctor/SaveRadiotherapyPrescription",
  GetRadiotherapyPrescription: "Doctor/GetRadiotherapyPrescription",

  // Summary of Previous Radiotherapy (EMR form). A list of dated treatment
  // records rather than one form per visit, so these are row-level calls and the
  // read is by patient - the point of the screen is the whole course so far.
  SaveRadiotherapySummary: "Doctor/SaveRadiotherapySummary",
  DeleteRadiotherapySummary: "Doctor/DeleteRadiotherapySummary",
  GetRadiotherapySummary: "Doctor/GetRadiotherapySummary",
  // Its Treatment Site / Techniques dropdowns, and the "New" button beside them.
  GetRadiotherapyOptions: "Doctor/GetRadiotherapyOptions",
  SaveRadiotherapyOption: "Doctor/SaveRadiotherapyOption",

  // Imaging QA (Physicist) (EMR form). Same row-level shape as the radiotherapy
  // summary; the read takes the screen's From / To search.
  SaveImagingQA: "Doctor/SaveImagingQA",
  DeleteImagingQA: "Doctor/DeleteImagingQA",
  GetImagingQA: "Doctor/GetImagingQA",

  // Follow-up booked by the doctor from the prescription. The appointment is
  // created unconfirmed, like an online booking, and the front office confirms
  // it in the Confirmation screen.
  BookFollowUpAppointment: "Doctor/BookFollowUpAppointment",
  GetFollowUpAppointments: "Doctor/GetFollowUpAppointments",

  // Physicists Planning (EMR form). A plan with its beams; a patient has a list
  // of plans, each saved on its own and frozen once approved.
  SavePhysicistPlanning: "Doctor/SavePhysicistPlanning",
  ApprovePhysicistPlanning: "Doctor/ApprovePhysicistPlanning",
  DeletePhysicistPlanning: "Doctor/DeletePhysicistPlanning",
  GetPhysicistPlanning: "Doctor/GetPhysicistPlanning",

  // Brachytherapy Planning (EMR form). One flat form per save; a patient has a
  // list of them, read by patient.
  SaveBrachytherapyPlanning: "Doctor/SaveBrachytherapyPlanning",
  DeleteBrachytherapyPlanning: "Doctor/DeleteBrachytherapyPlanning",
  GetBrachytherapyPlanning: "Doctor/GetBrachytherapyPlanning",

  // Tumor Board. The EMR flags a patient; the /tumor-board window lists flagged
  // patients and records the discussion; the EMR shows it read-only after that.
  GetTumorBoardStatus: "TumorBoard/GetTumorBoardStatus",
  FlagTumorBoard: "TumorBoard/FlagTumorBoard",
  UnflagTumorBoard: "TumorBoard/UnflagTumorBoard",
  SearchTumorBoard: "TumorBoard/SearchTumorBoard",
  SaveTumorBoardDiscussion: "TumorBoard/SaveTumorBoardDiscussion",
  GetTumorBoardDiscussion: "TumorBoard/GetTumorBoardDiscussion",

  // Bed reservation (IPD admission's "Reserve Bed"). Rows live in the existing
  // advance_room_booking table, so the admission save, the MIS bed summary and
  // the OPD registration line all see them.
  SaveBedReservation: "BedReservation/SaveBedReservation",
  CancelBedReservation: "BedReservation/CancelBedReservation",
  GetBedReservations: "BedReservation/GetBedReservations",

  // Referral requests raised from the EMR's "Transfer Referral For Consultation",
  // read by the front office on OPD booking.
  GetPatientReferralRequests: "Doctor/GetPatientReferralRequests",
  // Written back once the booking exists, so the referral carries the visit that
  // answered it.
  MarkReferralBooked: "Doctor/MarkReferralBooked",

  //ULtraSound
  DoctorPrescriptionPrintGetUltraSoundTest:
    "DoctorPrescriptionPrint/GetUltraSoundTest",
  DoctorPrescriptionPrintSaveUltraSound:
    "DoctorPrescriptionPrint/SaveUltraSound",

  // Child vaccination chat
  PrescriptionAdviceGetChildVaccineChart:
    "PrescriptionAdvice/GetChildVaccineChart",
  PrescriptionAdviceGiveVaccineToChild: "PrescriptionAdvice/GiveVaccineToChild",

  PrescriptionAdviceGetNewChildVaccineChart:
    "PrescriptionAdvice/GetNewChildVaccineChart",

  // baby growth chart
  DoctorAddBabyGrowth: "Doctor/AddBabyGrowth",
  DoctorGetBabyGrowthRecords: "Doctor/GetBabyGrowthRecords",
  DoctorUpdateBabyGrowth: "Doctor/UpdateBabyGrowth",
  DoctorBindchartWeight: "Doctor/BindchartWeight",

  ReportsRegistrationDetail: "Reports/RegistrationDetail",
  OPDAdvanceOutStandingReport: "Reports/OPDAdvanceOutStandingReport",
  DoctorRealtedOpdReportsRefundReport:
    "DoctorRealtedOpdReports/AppointmentConfirmationReport",
  RefundReport: "Reports/RefundReport",
  DailyCollectionDailyCollection: "DailyCollection/DailyCollection",
  UserwiseCollectionReport:
    "UserwiseCollectionReport/GetUserwiseCollectionReport",
  RegistrationReport: "RegistrationReport/GetRegistrationReport",
  PanelWiseInvoiceSummary:
    "PanelWiseInvoiceSummary/GetPanelWiseInvoiceSummary",
  IPDItemCancelReport: "IPDItemCancelReport/GetIPDItemCancelReport",
  // Naya (v12) Refund Report. Upar wala `RefundReport` purana v11 endpoint hai
  // aur abhi doosri screens use kar rahi hain, isliye alag key.
  GetRefundReport: "RefundReport/GetRefundReport",
  OPDBillRegisterReports: "Reports/OPDBillRegister",
  CreditControlInvoiceSettlementReport: "CreditControl/InvoiceSettlementReport",
  CreditControlInvoiceSettlementPdf: "CreditControl/InvoiceSettlementPdf",
  PatientHistoryDetails: "Reports/PatientHistoryDetails",
  //  doctor department mapping
  CreatDepartmentMapping: "PrescriptionAdvice/CreatDepartmentMapping",
  GetDoctorDepartmentMapping: "PrescriptionAdvice/GetDoctorDepartmentMapping",
  UpdateIsdefaulDepartmentMapping:
    "PrescriptionAdvice/UpdateIsdefaulDepartmentMapping",

  //by Aakash start
  GetOpdPrintOptions: "DoctorPrescriptionPrint/GetPrecriptionPreviewSetting",
  getInvestigationFavrateTemplates: "PrescriptionAdvice/GetLabTemplete",
  saveInvestigationFavrateTemplates:
    "PrescriptionAdvice/CreateSummaryWithDetails",
  getInvestigationFavrateTemplatesDetails:
    "PrescriptionAdvice/GetLabTempleteDetails",
  getLabRadiolozyCategory: "MachineResultEntry/GetRadiologyLabCateogry",
  getLabRadiolozySubCategory: "MachineResultEntry/GetRadiologyLabSubCategory",
  saveSaveLabTemplateAndComment: "MachineResultEntry/SaveLabTemplateAndComent",
  updateLabTemplate: "MachineResultEntry/UpdateLabTemplate",
  dietPatientSearch: "KichenDiet/KitchenPatientSearch",
  savePatientDiet: "KichenDiet/AddPatientIssue",
  getPatientKitchenDietType: "KichenDiet/DietMasterList",
  getPatientKitchenDietList: "KichenDiet/PatientIssueDetails",
  bindDietSchedular: "KichenDiet/CreatePreviousDay",
  getPatientRequestType: "KichenDiet/GetNatureOfRequisition",
  SavePatientRequest: "KichenDiet/PatientDietRequesition",
  getPatientRequestList: "KichenDiet/getDietRequesition",
  updatePatientStatusRequisition:
    "KichenDiet/UpdatePatientDietRequesitionStatus",
  wardWisePatientAsDate: "KitchenDietReport/WardWisePatientAsDate",
  dietRequisitionReport: "KitchenDietReport/DietRequisitionReport",
  dietReport: "KitchenDietReport/DietReport",
  getPatientIndentApproval: "KichenDiet/GetDietRequesitionDateWise",
  getBloodGroups: "MachineResultEntry/GetBloodGroup",
  updateLabBloodGroup: "MachineResultEntry/UpdateBloodgroup",
  radiologyWordCreate: "RadiologyWord/Create",
  radiologyWordStatus: "RadiologyWord/Status",
  radiologyWordHtml: "RadiologyWord/Html",
  radiologyWordDelete: "RadiologyWord/Delete",
  getPatientBloodBankIndentApproval:
    "BloodRequisition/GetBloodRequisitionDateWise",
  updatePatientStatusBloodRequisition:
    "BloodRequisition/UpdatePatientBloodRequisitionStatus",
  getPatientBloodDetails: "MachineResultEntry/GetBloodDetail",
  saveInvoiceSettlement: "creditcontrol/savesettlement",
  getDefaultMachine: "MachineResultEntry/GetDefaultMachine",
  saveMedicineTreatmentAndPrescription:
    "NursingWard/Nursing/TreatmentPrescriptionInsrt",
  getMedicineTreatmentAndPrescription:
    "NursingWard/Nursing/GetTreatmentPrescription",
  saveNursingWardCrossConsultations: "NursingWard/CrossConsultations",
  getNursingWardCrossConsultations:
    "NursingWard/GetCrossconsultationdoctorById",
  GetNursingFormMasterURL: "NursingWard/Nursing/GetNursingFormMaster",
  NursingFormEntryURL: "NursingWard/Nursing/NursingFormEntry",
  NursingGetFormEntryURL: "NursingWard/Nursing/NursingGetFormEntry",
  NursingPreviousMedicineEntryURL:
    "NursingWard/Nursing/NursingPreviousMedicineEntry",
  NursingGetPreviousMedicineEntryURL:
    "NursingWard/Nursing/NursingGetPreviousMedicineEntry",
  nursingWardUpdateCrossconsultationStatus:
    "NursingWard/UpdateCrossconsultationStatus",
  NursingWardSaveTurning: "NursingWard/Nursing/SaveTurningChart",
  NursingWardUpdateTurning: "NursingWard/Nursing/UpdateTurningChart",
  NursingWardGetData: "NursingWard/Nursing/DetailTurningChart",
  NursingWardSaveAnaethestic: "NursingWard/Nursing/SaveAnaestheticRecord",
  NursingWardUpdateAnaethestic: "NursingWard/Nursing/UpdateAnaestheticRecord",
  NursingWardGetAnaethestic: "NursingWard/Nursing/GetAnaestheticRecord",
  NursingWardSaveNewBorn: "NursingWard/Nursing/SaveNewborn",
  NursingWardUpdateNewBorn: "NursingWard/Nursing/UpdateNewborn",
  NursingWardGetNewBorn: "NursingWard/Nursing/GetNewborn",
  NursingWardSaveInternalNewBorn: "NursingWard/Nursing/SaveInternalNewborn",
  NursingWardUpdateInternalNewBorn: "NursingWard/Nursing/UpdateInternalNewborn",
  NursingWardGetInternalNewBorn: "NursingWard/Nursing/GetInternalNewborn",
  NursingWardSaveNeonatalIntensive:
    "NursingWard/Nursing/SaveNeonatalIntensiveMonitoring",
  NursingWardBindNeonatalIntensive:
    "NursingWard/Nursing/bindNeonatalIntensiveMonitoring",
  NursingWardUpdateNeonatalIntensive:
    "NursingWard/Nursing/UpdateNeonatalIntensiveMonitoring",
  NursingWardDetailUpdateNeonatalIntensive:
    "NursingWard/Nursing/DetailUpdateNeonatalIntensiveMonitoring",
  NursingWardSaveConsent: "NursingWard/Nursing/SaveConsentForm",
  NursingWardBindConsent: "NursingWard/Nursing/GetdataConsentForm",
  NursingWardEditConsent: "NursingWard/Nursing/EditDetail",
  NursingWardUpdateConsent: "NursingWard/Nursing/UpdateConsentForm",
  NursingWardSaveCPOT: "NursingWard/Nursing/SaveCPOTRecord",
  NursingWardBindCPOT: "NursingWard/Nursing/DetailCPOTData",
  NursingWardEditCPOT: "NursingWard/Nursing/DetailEditCPOTRecord",
  NursingWardUpdateCPOT: "NursingWard/Nursing/UpdateCPOTRecord",
  NursingWardSaveLabourChart: "NursingWard/Nursing/saveRecordOfLabourChart",
  NursingWardGetLabourChart: "NursingWard/Nursing/GetRecordOfLabourChart",
  NursingWardUpdateLabourChart: "NursingWard/Nursing/UpdateRecordOfLabourChart",
  NursingWardSaveLivkanNeclampsia: "NursingWard/Nursing/SaveEclampsiaForm",
  NursingWardGetLivkanNeclampsia:
    "NursingWard/Nursing/GetLIVKANeclampsiaRecords",
  NursingWardUpdateLivkanNeclampsia:
    "NursingWard/Nursing/UpdateLIVKANeclampsia",
  NursingWardGetPartograph: "NursingWard/Nursing/DetailUpdatePartograph",
  NursingWardSavePartograph: "NursingWard/Nursing/SavePartograph",
  NursingWardUpdatePartograph: "NursingWard/Nursing/UpdatePartograph",
  NursingWardSaveTablePartograph: "NursingWard/Nursing/SaveIntake",
  NursingWardGetTablePartograph: "NursingWard/Nursing/DetailSaveIntake",
  NursingWardSavePartographChart:
    "NursingWard/Nursing/SaveUpdatePartographChart",
  NursingWardSaveIntekPartographChart:
    "NursingWard/Nursing/SaveIntekPartographChart",
  NursingWardSearchPartographChart: "NursingWard/Nursing/SearchPartographChart",
  NursingWardBindFHR: "NursingWard/Nursing/BindFHR_graph",
  NursingWardCervixDescent: "NursingWard/Nursing/bindCervixDescent_graph",
  NursingWardBindBpChart: "NursingWard/Nursing/bindBP_graph",
  NursingWardPulseGraph: "NursingWard/Nursing/bindPulse_graph",

  //Aakash End

  // discharge summary

  DRDetailsPrintDischargeReport: "DRDetails/PrintDischargeReport",

  // MRD API
  PrintCurrentIPPatientRegister: "MRD/PrintCurrentIPPatientRegister",
  RefundReport: "Reports/RefundReport",
  MRDPrintMRDAllReports: "MRD/PrintMRDAllReports",
  PrintMRDAnalysisDetail: "MRD/PrintMRDAnalysisDetail",
  PrintFileLocationInMRD: "MRD/PrintFileLocationInMRD",
  PrintFileIssuesStatus: "MRD/PrintFileIssuesStatus",
  PrintBedOccupancyReport: "MRD/PrintBedOccupancy",
  PrintPatientICDCodeReport: "MRD/PrintPatientICDCodeReport",
  PrintNBHReport: "MRD/PrintNBHReport",
  // Emergency API URL START
  EmergencyAdmissionFeildSearchPatientDropDown:
    "EmergencyAdmission/FeildSearchPatientDropDown",
  EmergencyAdmissionbindEmergencyRoomType:
    "EmergencyAdmission/bindEmergencyRoomType",
  EmergencyAdmissionBindAllRoomDetail: "EmergencyAdmission/BindAllRoomDetail",
  SaveEmergencyAdmission: "EmergencyAdmission/SaveEmergencyAdmission",
  EmergencyPatientSearch: "Emergency/PatientSearch",
  SaveEmergencyServices: "Emergency/SaveEmergencyServices",
  EmergencyRelaseForIPD: "Emergency/RelaseForIPD",
  getEmergencyBillItemDetails: "EmergencyAdmission/getEmergencyBillItemDetails",
  EmergencyBtnDischarge_Click: "Emergency/BtnDischarge_Click",
  shiftEmergencyBed: "EmergencyAdmission/shiftEmergencyBed",
  EmgBindItemMed: "MedicineRequisition/BindItemMed",
  SaveEMGMedReq: "Emergency/SaveIndent",
  GetUrgencyLevelsReq: "MedicineRequisition/GetUrgencyLevels",
  BindSubcategoryMedReq: "MedicineRequisition/BindSubcategory",
  GetTimeRouteDurationMedReq: "MedicineRequisition/GetTimeRouteDuration",
  ViewEmgRequisition: "Emergency/BindDetailsPatientRequisitionSearch",
  getEmergencyPatientDetails: "EmergencyAdmission/getEmergencyPatientDetails",
  getEmergencyBillDetails: "EmergencyAdmission/getEmergencyBillDetails",
  CheckDoctorClearanceEMG: "Emergency/CheckDoctorClearance",
  CheckNursingClearanceEMG: "Emergency/CheckNursingClearance",
  CheckBillingClearanceEMG: "Emergency/CheckBillingClearance",
  ShiftToIPDEmg: "EmergencyAdmission/ShiftToIPD",
  IPDDetailBillingCategory: "IPDDetail/BillingCategory",

  SaveBillingClearanceEMG: "Emergency/btnBillingClearance_Click",
  SaveNursingClearanceEMG: "Emergency/btnnurseSave_Click",
  SaveDoctorClearanceEMG: "Emergency/btnDoctorClean_Click",
  BindInvestigationViewListEMG: "Emergency/getLabToPrintNew",
  LoadMedSetIndentMedURL: "MedicineAdviceOld/LoadMedSetItems",
  SaveEmergencyVisitURL: "EmergencyAdmission/SaveEmergencyVisit",
  MedicineRequisitionGrdRequsition_RowCommandURL:
    "MedicineRequisition/GrdRequsition_RowCommand",
  EMGGetItemRateByType_IDURL: "MedicineRequisition/GetItemRateByType_ID",
  handleSaveDialysisURL: "Emergency/SaveDialysisForm",
  bindDialysisFormListURL: "Emergency/BindDialysis",
  dialysisFormDeleteURL: "Emergency/SMDelete",
  bindDoctorCarePlanURL: "CpoeCarePlan/BindData",
  EMGSaveDoctorProgressNoteURL: "CpoeCarePlan/SaveCarePlan",
  BloodBankGetCategoriesURL: "BloodBank/GetCategories",
  getBloodGroupURL: "BloodBank/BindBloodGroup",
  getBloodBankLoadURl: "BloodBank/LoadItems",
  GetEmergencyRateURL: "BloodBank/GetEmergencyRate",
  BindRequestDetailsURL: "BloodBank/BindRequestDetails",
  BindItemStockDetailURL: "BloodBank/BindItemStockDetail",
  SaveBloodBankURL: "BloodBank/SaveBloodBank",
  UpdatePanelEMGURL: "Emergency/UpdatePanel",
  EmgRegReportURL: "EmergencyRegistration/GetEmergencyRegister",

  // Emergency API URL END

  /* Day Care API URL START
     Every one of these is served by DayCareController, which is standalone - it
     shares no endpoint with Emergency, so a change on either side cannot reach
     the other. The day care EPISODE is still an emergency_patient_details row,
     which is why the board's sub-screens (billing, clearance, discharge, the
     nursing forms) keep using the Emergency endpoints above on a day care
     TransactionID, unchanged. */
  BindDayCareRoomType: "DayCare/BindDayCareRoomType",
  BindDayCareRoomBed: "DayCare/BindDayCareRoomBed",
  SaveDayCareAdmission: "DayCare/SaveDayCareAdmission",
  SaveDayCareBooking: "DayCare/SaveDayCareBooking",
  GetDayCareBookings: "DayCare/GetDayCareBookings",
  ConfirmDayCareBooking: "DayCare/ConfirmDayCareBooking",
  CancelDayCareBooking: "DayCare/CancelDayCareBooking",
  DayCarePatientSearch: "DayCare/DayCarePatientSearch",
  DayCareDashboardCount: "DayCare/DayCareDashboardCount",
  /* Books a whole package's sessions in one transaction. Reachable only when
     fin_global_resources.DayCarePackageBooking = '1'. */
  SaveDayCarePackageBooking: "DayCare/SaveDayCarePackageBooking",
  /* Every medicine and investigation ordered for a visit, each with whether it
     has been billed. Read-only. */
  GetDayCareOrderSummary: "DayCare/GetDayCareOrderSummary",
  /* Writes medicines/investigations to patient_medicine and patient_test against
     the day care visit, so Pharmacy and the front desk see them. */
  SaveDayCareOrder: "DayCare/SaveDayCareOrder",
  /* The Day Care counterpart of OPDServiceBooking/BindInvestigation - same row
     shape, reached through the day care episode instead of an appointment. */
  BindDayCareInvestigation: "DayCare/BindDayCareInvestigation",
  /* Adult Nursing Initial Assessment. Keyed on the visit, not on day care, so
     the same screen and the same row serve IPD and Emergency too. */
  SaveNursingInitialAssessment: "DayCare/SaveNursingInitialAssessment",
  GetNursingInitialAssessment: "DayCare/GetNursingInitialAssessment",
  /* Every milestone of one visit and the gaps between them. Read-only. */
  GetDayCareTAT: "DayCare/GetDayCareTAT",
  /* Stamps the bill onto sessions that were booked before it existed. */
  LinkDayCareBookingsToBill: "DayCare/LinkDayCareBookingsToBill",
  // Day Care API URL END

  // Pharmecy API URL STart
  PharmacyPatientURL: "Pharmacy/BindData",
  PharmacyBindMedicineListURL: "Pharmacy/bindMedicineList",
  PharmacySearchPrescribedMedicineDataURL:
    "Pharmacy/searchPrescribedMedicineData",
  PharmacySaveMedicineDetailVMURL: "Pharmacy/SaveMedicineDetail",
  PHMedicineItemSearchURL: "Pharmacy/MedicineItemSearch",
  ShowOtherDepMedicineItemSearchURL: "Pharmacy/ShowOtherDepMedicineItemSearch",
  PharmacyAddItemURL: "Pharmacy/AddItem",
  PharmacyAddItemURL: "Pharmacy/AddItem",
  PharmacyAddItemByItemIDURL: "Pharmacy/AddItemByItemID",
  PharmacyClinicalTrialURL: "Pharmacy/ClinicalTrial",
  PharmacyGetAllPendingIndentsURL: "Pharmacy/GetAllPendingIndents",
  bindFromDepartmentsURL: "Pharmacy/BindDepartmentFrom",
  PendingDraftListURL: "Pharmacy/GetDrafts",
  MarkedasUsedDraftURL: "Pharmacy/MarkedasUsedDraft",
  GetDemandItemDetailsPrint: "Pharmacy/GetDemandItemDetailsPrint",
  BindIndentDetailsURL: "Pharmacy/GetIndentItemsStockDetails",
  BindIndentDetailsPrint: "Pharmacy/GetIndentItemsStockDetailsPrint",
  BindDraftDetailsURL: "Pharmacy/GetDemandItemDetails",
  GetPatientIndentLISTURL: "Pharmacy/GetPatientIndent",
  BillingIPDAcknowledgmentIndent: "Billing/IPD/AcknowledgmentIndent",
  BillingIPDIssueIndentAccept: "Billing/IPD/IssueIndentAccept",
  BindPrescribeDetailsURL: "Pharmacy/GetPrescribedItemStockDetails",
  SaveOPDPharmacyURL: "Pharmacy/SaveOPDPharmacy",
  PharmacyDraftBillURL: "Pharmacy/DraftBill",
  PharmacyOPDReturnSearch: "Pharmacy/OPDReturnSearch",
  PharmacyRejectIndentItemURL: "Pharmacy/RejectIndentItem",
  PharmacySaveOPDReturnURL: "Pharmacy/SaveOPDReturn",
  SaveIPDReurnURL: "Pharmacy/PatientReturnItemSave",
  PharmacySearchIPDReturnURL: "Pharmacy/Search",
  PharmacyBindIPDPatientDetailsURL: "Pharmacy/BindPatientDetails",
  PharmacyIPDReturnItemURL: "Pharmacy/ReturnItem",
  CurrentStockInvoiceURL: "CurrentStock/Invoice",
  BindPharmacySubcategory: "Pharmacy/BindSubcategory",
  ReferDoctorReportList: "Pharmacy/PharmacyReferDoctorReport",
  GetIPDSearchSalesURL: "Pharmacy/SearchIPDSales",
  PharmacyBindDoseItemURL: "Pharmacy/BindDose",

  BillGenerationSearchDetail: "BillGeneration/SearchDetail",
  SavePharmacyIssue: "Pharmacy/PharmacyIssue/SavePharmacyIssue",
  GetDetailsAgainstRecieptNO:
    "Pharmacy/PharmacyIssue/GetDetailsAgainstRecieptNO",
  UpdatePaymentMode: "Pharmacy/PharmacyIssue/UpdatePaymentMode",
  UpdateWalkInPatientInfo: "Pharmacy/PharmacyIssue/UpdateWalkInPatientInfo",
  PharmacyBillReturnCredit: "BillGeneration/CashToCredit",
  ManageCreditPharmacy: "CRDRNotePharmacy/CRDRNoteSearchPatient",
  GetDepartmentWiseBillDetails: "CRDRNotePharmacy/GetDepartmentWiseDetail",
  DepartmentWiseItemDetails: "CRDRNotePharmacy/GetDepartmentItemDetail",
  ManageCardGetPanelList: "CRDRNotePharmacy/GetPanelLists",
  ManageCreditDebitSaveDetails: "CRDRNotePharmacy/SaveCreditDebitDetail",

  // Pharmecy API URL END

  // Credit issue Api Url Satrt
  IndentIssueAddItem: "Pharmacy/PatientIndentIssueIPD/IndentIssueAddItem",
  BindDataPatientIssue: "Pharmacy/PatientIndentIssueIPD/BindDataPatientIssue",
  SavePatientIndentIssueIPD:
    "Pharmacy/PatientIndentIssueIPD/SavePatientIndentIssueIPD",
  // Credit Issue Api Url End

  // Finace API URL Start
  bindVoucerListURL: "Finance/BindVoucherBillingScreenControls",
  bindCOGGroupsBackendData: "Finance/BindCOGGroupsBackendData",
  BindGroupTableURL: "Finance/BindGroupTable",
  BindChartOfAccountURL: "Finance/BindChartOfAccount",
  LoadGroupRecordsURL: "Finance/LoadGroupRecords",
  SaveNewGroupAPI: "Finance/SaveNewGroup",
  GetParentsData: "Finance/GetParentsData",
  SearchGroupTableURL: "Finance/SearchGroupTable",
  ChartOfGroupUpdateStatusURL: "Finance/UpdateStatus",
  UpdateGroupCodeDisplayURL: "Finance/UpdateGroupCodeDisplay",
  UpdateGroupNameURL: "Finance/UpdateGroupName",
  LoadCentreChartOfAccountURL: "Finance/LoadCentreChartOfAccount",
  GetCurrencyConversionFactorURL: "Finance/GetCurrencyConversionFactor",
  GetPeriodClosedURL: "Finance/GetPeriodClosed",
  BinduploadOpeningBalanceControls: "Finance/BinduploadOpeningBalanceControls",
  BindReconciliationDetails: "Finance/BindReconciliationDetails",
  BankReconciliationURL: "Finance/BindReconciliationBank",
  SearchVoucher: "Finance/SearchVoucher",
  UpdateVoucherStatusURL: "Finance/UpdateVoucherStatus",
  GetPendingsettleInvoiceURL: "Finance/GetPendingsettleInvoice",
  UpdateReconciliation: "Finance/UpdateReconciliation",
  GetBankChargesUploadExcel: "Finance/GetBankChargesUploadExcel",
  BalanceTransaferControls: "Finance/BalanceTransaferControls",
  GetBalanceToTransafer: "Finance/GetBalanceToTransafer",
  UploadBalanceTransfer: "Finance/UploadBalanceTransfer",
  GetBankReconciliationExcel: "Finance/GetBankReconciliationExcel",
  GetOpeningBalanceToUpload: "Finance/GetOpeningBalanceToUpload",
  GetOpeningBalanceExcell: "Finance/GetOpeningBalanceExcell",
  SaveOpeningBalance: "Finance/SaveOpeningBalance",
  GetOpeningUploadExcel: "Finance/GetOpeningUploadExcel",
  UploadOpeningBalanceInvoiceWise: "Finance/UploadOpeningBalance",
  SearchAccountBookReport: "Finance/SearchAccountBookReport",
  SaveCurrencyConverter: "CommonAPI/SaveCurrencyConversionFactor",
  CurrencyConversionDetails: "CommonAPI/GetCurrencyConversionDetails",
  SupplierBindBackendData: "Finance/SupplierAdvanceMappingBindBackendData",
  // Finance API URL END

  // Chat API URL START

  ChatHubChatTicket: "Chat/ChatTicket",
  ChatHubSaveChat: "Chat/SaveChat",
  AIReportsAIClientDetails: "AIReports/AIClientDetails",
  AIClientQuestionMasterURL: "AIReports/AIClientQuestionMaster",
  AIClientOpeningURL: "AIReports/AIClientOpening",
  AIClientTokenConsumeDetailsInsert:
    "AIReports/AIClientTokenConsumeDetailsInsert",
  AIClientLedgerURL: "AIReports/AIClientLedger",
  AIClientRechargeTnxDetailsInsertURL:
    "AIReports/AIClientRechargeTnxDetailsInsert",
  AIRateCardMasterURL: "AIReports/AIRateCardMaster",

  // Chat API URL END

  // chat bot API URL START
  ChatBotAIAPIURL: "ReportAI/PatientChatBot",
  GetOPDEnquiryURL: "CommonAPI/GetOPDEnquiry",

  // chat bot API URL END

  // medical Store API URL START
  SearchDirectDepartment: "DirectDepartmentIssue/SearchDirectDepartment",

  //Gate Entry1
  GateEntryGetPurchaseOrders: "GRN/GetPurchaseOrders",
  GateEntrySaveGateEntry: "GateEntry/GateEntry/SaveGateEntry",
  EDPGateEntrySearchGetEntry: "GateEntry/GateEntry/SearchGateEntry",
  GateEntryUserValidate: "GateEntry/GateEntry/UserValidate",
  GateEntryBindGateEntryItems: "GateEntry/GateEntry/BindGateEntryItems",
  GateEntryGateEntryGateEntryReport: "GateEntry/GateEntry/GateEntryReport",
  GateEntryBindGateEntryItems: "GateEntry/GateEntry/BindGateEntryItems",
  GateEntryUpdateGateEntry: "GateEntry/GateEntry/UpdateGateEntry",
  SearchGateEntryItem: "GateEntry/GateEntry/SearchGateEntryItem",
  GateEntryGRNPost: "GateEntry/GateEntry/GRNPost",
  GateEntryGRNUnPost: "GateEntry/GateEntry/GRNUnPost",
  GateEntryViewDetailGRNItem: "GateEntry/GateEntry/ViewDetailGRNItem",
  GateEntryPostToGRN: "GateEntry/GateEntry/PostToGRN",
  GRNCancel: "GRN/GRNCancel",

  //GRN API
  GetItemList: "GRN/GetItemList",
  GetTaxGroups: "GRN/GetTaxGroups",
  GetManufacturer: "GRN/GetManufactures",
  SaveGRN: "GRN/SaveGRN",
  SaveStockAdjustment: "GRN/SaveStockAdjustment",
  GetStockAdjustmentItems: "GRN/GetStockAdjustmentItems",
  HoldStockGetFilters: "HoldStockMedicine/GetFilters",
  HoldStockGetItems: "HoldStockMedicine/GetItems",
  HoldStockSearch: "HoldStockMedicine/Search",
  HoldStockSave: "HoldStockMedicine/Save",
  GetItemPriviousHistoryURL: "GRN/GetItemPriviousHistory",
  RemoveGRNItemURL: "GRN/RemoveGRNItems",

  GetGRNList: "GRN/GetGRNList",
  DirectGRNReport: "GRN/GetDirectGRNReport",
  updateInvoiceDetails: "GRN/updateInvoiceDetails",
  GRNPost: "GRN/GRNPost",
  IsGRNUnpostPost: "GRN/GRNUNPost",
  GRNReject: "GRN/GRNCancel",
  BindGRNItems: "GRN/BindGRNItems",
  BindVendor: "GRN/BindVendor",
  UpdateGRN: "GRN/UpdateGRN",
  GetPurchaseOrders: "GRN/GetPurchaseOrders",
  GetPurchaseOrderItems: "GRN/GetPurchaseOrderItems",
  ReprintGRN: "GRN/GetDirectGRNReport",
  ReprintGRNPrintbuilder: "PrintBuilder/GetDirectGRNReport",
  GRNSameStateBuyierSupplier: "GRN/SameStateBuyierSupplier",
  GetVendorState: "GRN/GetVendorState",
  GetRevenueDashboard: "RevenueDashboard/GetRevenueDashboard",
  GetRevenueDetail: "RevenueDashboard/GetRevenueDetail",
  BillAccountsItemizedBilling: "BillAccountsMIS/ItemizedBillingReport",
  BillAccountsItemizedServices: "BillAccountsMIS/ItemizedServicesReport",
  BillAccountsPackageAnalysis: "BillAccountsMIS/PackageAnalysisReport",
  BillAccountsSalesGstHsn: "BillAccountsMIS/SalesGstHsnReport",
  AccountsDashboardOperational: "AccountsDashboard/Operational",
  AccountsDashboardRevenue: "AccountsDashboard/Revenue",
  AccountsDashboardRevenueDetail: "AccountsDashboard/RevenueDetail",
  AccountsDashboardReceiptDetail: "AccountsDashboard/ReceiptDetail",
  AccountsDashboardDiscountDetail: "AccountsDashboard/DiscountDetail",
  AccountsDashboardReceipts: "AccountsDashboard/Receipts",
  AccountsDashboardDiscounts: "AccountsDashboard/Discounts",
  GetGRNNarrations: "GRN/GetGRNNarrations",
  // GRN page role dropdown (fin_global_resources IsGRNRoleDropdown / GRNRoleDropdownRoleIDs)
  GRNGetRoleDropdown: "GRN/GetRoleDropdown",

  // Tools API
  GetDataToFill: "StockTake/GetDataToFill",
  StockTakeSaveData: "StockTake/SaveData",
  BindPhysicalData: "StockTake/BindPhysicalData",
  GridView1_RowCommand: "StockTake/SaveStockTake_Approval",
  // consume
  ConsumeBindItem: "Consume/BindItem",
  ShowStock: "Consume/ShowStock",
  BindStock: "Consume/BindStock",
  SaveConsume: "Consume/SaveConsume",
  SearchStock: "Consume/SearchStock",
  SearchDetail: "IssueDepartment/SearchDetail",
  BindSubGroup: "IssueDepartment/BindSubGroup",
  View: "IssueDepartment/View",
  ViewDetail: "IssueDepartment/ViewDetail",
  SaveIssueDepartment: "IssueDepartment/SaveIndentData",
  DirectDepartmentIssueReport:
    "DirectDepartmentIssue/DirectDepartmentIssueReport",
  PrintIssue: "CurrentStock/PrintIssue",
  GetStockItem: "IssueDepartment/GetStockItem",

  // viewRequisition

  ViewRequisition: "ViewRequisition/ViewRequisition",
  ViewRequisitionReceiveTransfer: "ViewRequisition/ReceiveTransfer",
  ViewIndent: "ViewRequisition/ViewIndent",
  Reject: "ViewRequisition/Reject",
  NursingRejectIndent: "ViewRequisition/NursingRejectIndent",
  Approve: "ViewRequisition/Approve",
  PrintRequisition: "CurrentStock/PrintRequisition",
  medViewRequisition: "ViewRequisition/ViewRequisition",
  viewItem: "ViewRequisition/View",

  // medical Store API URL END

  // LABORATORY API end point start
  BindInvListBox: "Laboratory/BindInvListBox",
  BindSampleType: "Laboratory/BindSampleType",
  BindAnatomicSite: "Laboratory/BindAnatomicSite",
  UpdateInvestigation: "Laboratory/UpdateInvestigation",

  // by akash print pending list in lab
  PrintResultEntryPendingList: "LabReports/GetLabReport",

  // *Department API Start Here**
  BindDepartmentLab: "DepartmentReceiving/BindDepartment",
  SaveDeptReceiveLab: "DepartmentReceiving/SaveDeptReceive",
  SaveSampleReciveLab: "DepartmentReceiving/SaveSampleReceive",
  SaveTransferDataLab: "DepartmentReceiving/savetranferdata",
  RejectDepartmentDataLab: "/SampleCollection/SampleRejection",
  DeptServiceGetDepartments: "DepartmentServicePatient/GetDepartments",
  DeptServiceSearchPatients: "DepartmentServicePatient/SearchPatients",
  DeptServiceReceivePatient: "DepartmentServicePatient/ReceivePatient",
  SampleRejectionReport: "SampleCollectionReport/SampleRejectionReport",
  SampleStatusUsers: "SampleCollectionReport/SampleStatusUsers",
  EDPEmailSetUpSearchMail: "EDP/EmailSetUp/SearchMail",

  // SampleSendOutsouceLab API end here

  SaveDeptReceive: "SampleSendOutsouceLab/SaveDeptReceive",
  // Outsource test report (PDF) for the Send To OutSource Lab search
  OutsourceReportPdf: "SampleSendOutsouceLab/OutsourceReportPdf",
  BindDepartmentOutsourceLab: "SampleSendOutsouceLab/BindDepartmentOutsouceLab",
  BindLabOutSource: "SampleSendOutsouceLab/BindlabOutSource",
  SaveOutsourceSample: "SampleSendOutsouceLab/SaveOutsourceSample",
  RemoveOutsourceSample: "SampleSendOutsouceLab/RemoveOutsourceSample",
  getSampleRejectReasonOption: "SampleCollection/SampleCollectionResion",
  SaveSampleRejectReasonOption: "SampleCollection/SaveSampleReason",
  LaboratoryBindOutSourceReason: "Laboratory/BindOutSourceReason",
  EmailSetUpSendMail: "EDP/EmailSetUp/SendMail",

  // *ResultEntry API Start Here**
  BindDepartmentResultEntryLab:
    "MachineResultEntry/BindDepartmentMachineResult",
  GetRadiologyAndDoctor: "MachineResultEntry/GetRadiologyAndDoctor",
  MachineResultEntryBindApprovedBy: "MachineResultEntry/BindApprovedBy",
  GetAmendmentReportsByTestId: "MachineResultEntry/GetAmendmentReportsByTestId",
  TestResultEntryLab: "MachineResultEntry/GetTestMaster",
  SearchResultEntryLab: "MachineResultEntry/PatientSearchMachineResult",
  SendResultEntryRowToPacs: "Pacs/send-fhir",
  GiloysRequestDoctorAccess: "Giloys/RequestDoctorAccess",
  GiloysInitiate: "Giloys/Initiate",
  GiloysCreatePatient: "Giloys/CreatePatient",
  GiloysGetDoctorDashboardUrl: "Giloys/GetDoctorDashboardUrl",
  GiloysValidateSsoUser: "Giloys/ValidateSsoUser",
  HistoCytoGrossingAndSliding: "HistoCytoGrossingAndSliding/SearchDataHisto",
  HistoCytoGrossingAndSlidingSaveRemarks:
    "HistoCytoGrossingAndSliding/SavePatientRemarks",
  HistoCyBindDoctor: "HistoCytoGrossingAndSliding/BindDoctor",
  HistoCytoGBindDept: "HistoCytoGrossingAndSliding/BindDept",

  HistoCytoGrossPatientSearchCyto:
    "HistoCytoGrossingAndSliding/PatientSearchCyto",
  MachineResultEntryGetTestMaster: "/MachineResultEntry/GetTestMaster",
  MachineResultEntryPatientSearchCyto: "MachineResultEntry/PatientSearchCyto",
  HistoCytoGrossingSaveGrossData: "HistoCytoGrossingAndSliding/SaveGrossData",
  HistoCytoGrossingSaveDataSlide: "HistoCytoGrossingAndSliding/SaveDataSlide",
  HistoCytoSaveCompleteData: "HistoCytoGrossingAndSliding/SaveCompleteData",
  HistoCytoSaveDispatch: "HistoCytoGrossingAndSliding/SaveDispatch",
  HistoCytoSaveRemarksWithStatus:
    "HistoCytoGrossingAndSliding/SaveRemarksWithStatus",
  HistoCytoMarkComplete: "HistoCytoGrossingAndSliding/MarkComplete",
  MachineResultEntryPatientSearch:
    "MachineResultEntry/PatientSearchMachineResult",
  MachineResultEntryPatientSearchCyto: "MachineResultEntry/PatientSearchCyto",
  HistoCytoGrossingAndSlidingViewLog: "HistoCytoGrossingAndSliding/ViewLog",
  MachineResultEntryBindsampleinfo: "MachineResultEntry/Bindsampleinfo",
  HistoCytoGrossLoadSpecimenTemplate:
    "HistoCytoGrossingAndSliding/LoadSpecimenTemplate",
  HistoCytoGrossGetTemplateHisto:
    "HistoCytoGrossingAndSliding/GetTemplateHisto",
  HistoCytoGrossSaveDataAsTemplate:
    "HistoCytoGrossingAndSliding/SaveDataAsTemplate",
  MachineResultEntryBindTestDDL: "MachineResultEntry/BindTestDDL",
  HistoCytoGrossFinalDone: "HistoCytoGrossingAndSliding/FinalDone/FinalDone",
  HistoCytoGrossSaveHistoReport: "HistoCytoGrossingAndSliding/SaveHistoReport",
  HistoCytoGrossCheckAddendumAuthorizationt:
    "HistoCytoGrossingAndSliding/CheckAddendumAuthorization",
  HistoCytoGrossSaveAddendum: "HistoCytoGrossingAndSliding/SaveAddendum",

  HistoCytoGrossinggetdetailblock: "HistoCytoGrossingAndSliding/getdetailblock",
  HistoCytoGrossinggetdetaildatablock:
    "HistoCytoGrossingAndSliding/getdetaildatablock",
  HistoCytoGetGrossDetail: "HistoCytoGrossingAndSliding/GetGrossDetail",
  HistoCytoGrossingGetRemarks: "HistoCytoGrossingAndSliding/GetRemarks",
  LabObservationSearch: "MachineResultEntry/LabObservationSearch",
  GetPatientInvsetigationsNameOnly:
    "MachineResultEntry/GetPatientInvsetigationsNameOnly",
  SaveResultEntryLab: "MachineResultEntry/SaveLabObservationOpdData",
  BindAttachmentLab: "MachineResultEntry/ProcessRequest",
  DispatchResultEntryLab: "/LabReportDispatch/SearchPatientLab",
  BindAttachment: "MachineResultEntry/BindAttachment",
  HistoCytoGrossRemoveRadiologyUplodedData:
    "HistoCytoGrossingAndSliding/RemoveRadiologyUplodedData",
  BindAttachmentPdf: "MachineResultEntry/BindAttachmentPdf",
  BindPatientDetailsImage: "MachineResultEntry/BindPatientDetailsImage",
  BindDepartmentDispatch: "LabReportDispatch/BindCentreLab",
  BindDoctor: "MachineResultEntry/BindDoctorToForward",
  ProvisionalTatReport: "MachineResultEntry/ProvisionalTatReport",
  LabObservationReportMaster: "LabReports/LabObservationReportMaster",
  LabObservationReport: "LabReports/LabObservationReport",
  // "LaboratoryCountReport/LabReport",
  // Dispatch API end here

  GetPatientInvsetigationsNameOnly:
    "MachineResultEntry/GetPatientInvsetigationsNameOnly",
  ApprovedapI: "LabReports/GetLabApprovalReport",
  BindTestDdlLab: "MachineResultEntry/BindTestDDL",
  BindTestResultEntryLab: "MachineResultEntry/GetTestMaster",
  GetTestMasterForReport: "MachineResultEntry/GetTestMasterForReport",
  BindSampleinfo: "MachineResultEntry/Bindsampleinfo",

  LabSampleRejection: "SampleCollection/SampleRejection",
  BindLabReport: "MachineResultEntry/DynamicBindMultipleLabReport",
  CheckLabReportPrintPayment: "MachineResultEntry/CheckLabReportPrintPayment",
  BindAttachmentDetails: "MachineResultEntry/BindAttachmentDetails",
  BindInvestigationLabURL: "LabReportDispatch/BindInvestigationLab",
  BindApprovedBy: "MachineResultEntry/BindApprovedBy",
  LaboratorySetupBind_Employee: "EDP/LaboratorySetup/Bind_Employee",
  BindMachine: "MachineResultEntry/BindMachine",
  GetCommentsDropdown: "MachineResultEntry/GetComments_labobservation",
  CommentlabObservation: "MachineResultEntry/Comments_LabObservation",
  TrackInvestigation: "MachineResultEntry/TrackInvestigation",
  DeltaCheckReport: "MachineResultEntry/DeltaCheckReport",
  HoverHeaderresultEntry: "MachineResultEntry/HoverHeader",
  HoverDeltaCheck: "MachineResultEntry/HoverDeltaCheck",
  Getpatientlabobservationopdtext:
    "MachineResultEntry/Getpatient_labobservation_opd_text",
  SaveSampleRejectReasonApi: "MachineResultEntry/SaveUnApproveReason",
  CommonAPIGetAllPanel: "CommonAPI/GetAllPanel",
  holdReason: "MachineResultEntry/GetUnHoldReason",
  SaveUnHoldReason: "MachineResultEntry/SaveUnHoldReason",
  ddlCommentsLabObservation1: "MachineResultEntry/ddlCommentsLabObservation1",
  GetUnApproveReason: "MachineResultEntry/GetUnApproveReason",
  SaveSampleRejectReasonApi: "MachineResultEntry/SaveUnApproveReason",
  // ResultEntry API End Here

  // Report Dispatch Api Start here

  DispatchLabReports: "LabReportDispatch/DispatchLabReport",
  // Doctor Detail (old Help Desk Doctor Timing page)
  // Lost and Found Management
  SaveLostFound: "LostFound/SaveLostFound",
  UpdateLostFound: "LostFound/UpdateLostFound",
  SearchLostFound: "LostFound/SearchLostFound",
  GetLostFoundHistory: "LostFound/GetLostFoundHistory",
  SearchLostFoundReport: "LostFound/SearchLostFoundReport",
  // Future Appointment Advice (Help Desk)
  SearchFutureAppointmentAdvice: "FutureAppointmentAdvice/SearchFutureAppointmentAdvice",
  GetFollowUpCalls: "FutureAppointmentAdvice/GetFollowUpCalls",
  SaveFollowUpCall: "FutureAppointmentAdvice/SaveFollowUpCall",
  UpdateFollowUpStatus: "FutureAppointmentAdvice/UpdateFollowUpStatus",
  SendFollowUpMessage: "FutureAppointmentAdvice/SendFollowUpMessage",
  SearchPortalLogins: "FutureAppointmentAdvice/SearchPortalLogins",
  SaveReportCallRemarks: "LabReportDispatch/SaveReportCallRemarks",
  GetReportCallRemarks: "LabReportDispatch/GetReportCallRemarks",

  // MachineResultEntry Culture API start here

  PatientSearchMachineResult: "MicroCultureLabResult/PatientSearchLabCultrure",
  CultureLabObservationSearch: "MicroCultureLabResult/LabObservationSearch",
  SaveLabObservationOpdData: "MicroCultureLabResult/SaveLabObservationOpdData",
  BindOrganism: "MicroCultureLabResult/BindOrganism",
  BindobsAntibiotic: "MicroCultureLabResult/BindobsAntibiotic",
  // LabWorkSheet API Start Here
  SearchLabSeet: "LabWorkSheet/SearchLabSeet",
  LabWorkSheet: "LabWorkSheet/GenerateWorksheet",
  LabOutsource: "LabReports/GetOutsourceReport",
  BindDepartmentSeet: "LabWorkSheet/BindDepartmentSeet",
  WorkSheetGetPanel: "MicroCultureLabResult/GetPanel",
  // MicroLabEntry API Start Here
  MicroLabEntry: "MicroLabEntry/SearchData",
  GetMicroScopyData: "MicroLabEntry/GetMicroScopyData",
  MicroEntrySavedData: "MicroLabEntry/GetSavedData",
  SaveMicroScopicdata: "MicroLabEntry/SaveMicroScopicdata",
  SavePlatingdata: "MicroLabEntry/SavePlatingdata",
  SaveIncubationdata: "MicroLabEntry/SaveIncubationdata",
  UpdateAllMicroLab: "MicroLabEntry/UpdateAllData",
  GetMicroScopyDataAfterSave: "MicroLabEntry/GetMicroScopyDataAfterSave",
  // LABORATORY API end point end

  // Radiology API end point start here

  RadiologyAcceptance: "RadiologyAcceptance/SearchAcceptance",
  ProcedureAcceptance: "RadiologyAcceptance/SearchProcedureAcceptance",
  SaveProcedureAcceptance: "RadiologyAcceptance/SaveProcedureAcceptance",
  RadiologyBindLabDepartment: "RadiologyAcceptance/BindLabDepartment",
  RadiologybindRoomList: "RadiologyAcceptance/bindRoomList",
  RadiologyCallToken: "RadiologyAcceptance/CallToken",
  RadiologyUnCallToken: "RadiologyAcceptance/UncallTokens",
  RadiologySaveAcceptance: "RadiologyAcceptance/SaveAcceptance",
  RadiologyRemoveSample: "RadiologyAcceptance/RemoveSample",
  //IPDBillPrint start
  IPDBillPrints: "Reports/IPDBillPrint",
  IPDBillPrintMultiple: "Reports/IPDBillPrintMultiple",
  NabhManualGetNabhDetail: "/NabhManual/GetNabhDetail",

  //IPDBillPrint End
  // inventry

  BindMedicineStoreDepartment: "Return/BindDepartment",
  BindStoreGroup: "Return/BindCategory",
  BindStoreSubCategory: "Return/BindSubCategory",
  BindStoreItems: "Return/BindItems",
  IssueDetail: "Return/BindDepartmentIssue",
  SearchSales: "IssueReturn/SearchSales",
  SearchSalesPrint: "IssueReturn/SearchSalesPrint",
  BindUser: "IssueReturn/BindUser",
  BindSearchSalesItem: "IssueReturn/BindSearchSalesItem",
  StoreCommonReceiptPdf: "CommonReciept_PDF/CommonReceiptPdf",
  StoreCommonReceiptReportIPD: "CommonReciept_PDF/CommonReceiptReportIPD",
  MedicalStoreThermalPrint: "CommonReciept_PDF/CommonPrinterOPDThermal",
  PharmacyPrintLabel: "Pharmacy/PharmacyPrintToLabel",
  PharmacyPrintBarcode: "Pharmacy/PharmacyPrintBarcode",
  BindItemForLabelPrint: "Pharmacy/BindItemForLabelPrint",
  ReportDetail: "IssueReturn/ReportDetail",
  LoadStock: "DirectDepartmentIssue/LoadStock",
  BindDepartmentItemIssueToDept: "DirectDepartmentIssue/BindDepartment",
  SearchItem: "DirectDepartmentIssue/SearchItem",
  getBindDetails: "ViewRequisition/BindDetails",
  SaveDirectMedicalIssue: "DirectDepartmentIssue/SaveDirectMedicalIssue",
  ReturnBindItem: "Return/BindItem",
  FromDepartment: "Return/FromDepartment",
  SearchDepartmet: "Return/SearchDepartmet",
  BarCode: "Return/BarCode",
  PatientReturnReport: "CurrentStock/PatientReturnReport",
  ReturnBindVendor: "Return/BindVendor",
  SaveFromDepartment: "Return/SaveFromDepartment",
  BindItemSupplair: "Return/BindItemSupplair",
  SearchSupplair: "Return/SearchSupplierReturn",
  // View Supplier Return (15-Nov-2026)
  SupplierReturnViewSearch: "SupplierReturnView/Search",
  SupplierReturnViewDetail: "SupplierReturnView/Detail",
  SupplierReturnViewUpdate: "SupplierReturnView/Update",
  SupplierReturnViewPost: "SupplierReturnView/Post",
  SupplierReturnViewUnPost: "SupplierReturnView/UnPost",
  SupplierReturnViewPrint: "SupplierReturnView/Print",
  SearchItemType: "Return/SearchItemType",
  SaveSupplair: "Return/SaveSupplair",
  SaveSupplairDraft: "Return/SaveSupplairDraft",
  GetSupplairDrafts: "Return/GetSupplairDrafts",
  GetSupplairDraftDetail: "Return/GetSupplairDraftDetail",
  DeleteSupplairDraft: "Return/DeleteSupplairDraft",
  DeleteSupplairDraftItems: "Return/DeleteSupplairDraftItems",
  SupplierReturnPrint: "Return/SupplierReturnPrint",
  SupplierReturnList: "Return/SupplierReturnList",
  SaveVendorCreditNote: "Return/SaveVendorCreditNote",
  VendorCreditNoteList: "Return/VendorCreditNoteList",
  RGPSaveRGP: "MedicalStore/RGP/SaveRGP",
  consignmentReturnSearch: "Return/Search",
  ConsignmentBindItem: "Return/ConsignmentBindItem",
  BindPatientReturn: "Return/BindPatient",
  ReturnItem: "Return/ReturnItem",
  IPDPrintSticker: "CurrentStock/IPDPrintSticker",
  ConsignmentSave: "Return/ConsignmentSave",
  GetDrugFormularyPdf: "NabhManual/GetDrugFormularyPdf",
  NabhManualGetNabhpdf: "NabhManual/GetNabhpdf",
  GetDrugFormulary: "NabhManual/GetDrugFormulary",

  // purchase start
  QuotationGetCategories: "QuotationAndCompare/GetCategories",
  QuotationGetSubCategories: "QuotationAndCompare/GetSubCategories",
  QuotationGetManufacturers: "QuotationAndCompare/GetManufacturers",
  QuotationGetVendors: "CommonAPI/GetVendors",
  QuotationAddItems: "QuotationAndCompare/GetPurchaseItems",
  SearchQuotation: "QuotationAndCompare/SearchQuotation",
  AddItems: "QuotationAndCompare/AddItems",
  SaveQuotation: "QuotationAndCompare/SaveQuotation",
  QuotationSetDefault: "QuotationAndCompare/SetDefault",
  GetCurrencyFactor: "CommonAPI/GetCurrencyFactor",
  GetTaxGroup: "CommonAPI/GetTaxGroup",
  QuotationGetTaxAmount: "CommonAPI/GetTaxAmount",
  SearchPurchaseRequestBindItem: "SearchPurchaseRequest/BindItem",
  POApprovalMasterBindEmployee: "POApprovalMaster/BindEmployee",
  POApprovalMasterSaveApprovalMaster: "POApprovalMaster/SaveApprovalMaster",
  POApprovalMasterBindApprovalMaster: "POApprovalMaster/BindApprovalMaster",
  PODeleteApprovalMaster: "POApprovalMaster/DeleteApprovalMaster",
  POBindCategoryApprovalMaster: "POApprovalMaster/BindCategoryApprovalMaster",
  GetPurchaseMarkUpPercent: "QuotationAndCompare/GetPurchaseMarkUpPercent",
  ViewPurchaseOrderBindPORemark: "ViewPurchaseOrder/BindPORemark",

  PurchaseReportPrint: "ItemMaster/ItemMasterReport",
  ItemMasterBindDetail: "ItemMaster/BindDetail",

  //✔ ---> Approval
  ApprovalBindDepartment: "Approval/BindDepartment",
  ApprovalBindPRRequest: "Approval/BindPRRequest",
  ApprovalBindLedger: "Approval/BindLedger",
  ApprovalGRNAppovalCancel: "Approval/GRNAppovalCancel",
  ApprovalGetSelectedItems: "Approval/GetSelectedItems",
  ApprovalSavePurchaseApproval: "Approval/SavePurchaseApproval",
  ApprovalRejectItem: "Approval/RejectItem",
  ApprovalLoadApprovalRight: "Approval/LoadApprovalRight",
  ApprovalUpdatePurchaseApproval: "Approval/UpdatePurchaseApproval",

  // Purchase order approval

  // PurchaseOrderApprovalGetPurchaseItems:"PurchaseOrderApproval/GetPurchaseItems",
  PurchaseOrderApprovalGetPurchaseItems: "PurchaseOrderApproval/GetRequestions",
  PurchaseOrderApprovalRejectPurchaseOrder:
    "PurchaseOrderApproval/RejectPurchaseOrder",
  ApprovedPurchaseOrder: "PurchaseOrderApproval/ApprovedPurchaseOrde",

  // purchase end

  // CreatePurchaseRequest Start

  GetBindAllCenter: "/CommonAPI/BindAllCenter",
  GetItemsByCategory: "CommonAPI/GetCategorysByStoreType",
  GetSubCategoryByCategory: "CreatePurchaseOrder/GetSubCategoryByCategory",
  GetDepartMent: "CommonAPI/GetDepartMent",
  GetAutoPurchaseRequestItems:
    "CreatePurchaseRequest/GetAutoPurchaseRequestItems",
  PurchaseGetItems: "CreatePurchaseRequest/GetItems",
  SavePurchaseRequest: "CreatePurchaseRequest/SavePurchaseRequest",
  GetItemStockDetails: "CreatePurchaseRequest/GetItemStockDetails",
  GetPurchaseRequest: "CreatePurchaseRequest/GetPurchaseRequest",
  OnEditPurchaseRequest: "CreatePurchaseRequest/OnEditPurchaseRequest",
  DeletePurchaseRequestItem: "CreatePurchaseRequest/DeletePurchaseRequestItem",

  // CreatePurchaseRequest End

  // Create Purchase Order start
  PurchaseOrderGetCategorys: "CreatePurchaseOrder/GetCategorys",
  PurchaseOrderSearchPOURL: "ViewPurchaseOrder/SearchPO",
  PurchaseOrderGetSubCategoryByCategory:
    "CreatePurchaseOrder/GetSubCategoryByCategory",
  PurchaseOrderGetPurchaseItems: "CreatePurchaseOrder/GetPurchaseItems",
  PurchaseOrderGetPOList: "CreatePurchaseOrder/GetPOList",
  PurchaseOrderGetRemarks: "CreatePurchaseOrder/GetPurchaseOrderRemarks",
  PurchaseOrderGetSavePODraftDetails: "CreatePurchaseOrder/SavePODraftDetails",
  CreatePurchaseOrderSave: "CreatePurchaseOrder/SavePurchaseOrder",
  CreatePOGetPurchaseRequests: "CreatePurchaseOrder/GetPurchaseRequests",
  GetPurchaseRequestItems: "CreatePurchaseOrder/GetPurchaseRequestItems",
  GetPurchaseOrderItemDetailsTerms:
    "CreatePurchaseOrder/GetPurchaseOrderItemDetailsTerms",
  POGetTermAndConditions: "CreatePurchaseOrder/GetTermAndConditions",
  GetPurchaseOrderItemDetails:
    "CreatePurchaseOrder/GetPurchaseOrderItemDetails",
  GetPOpuchaseTermsAndConditon: "TermsandCondition/GetTermsAndConditon",
  CreatePurchaseOrderGetPOByTermsandCondition:
    "CreatePurchaseOrder/GetPOByTermsandCondition",
  ViewPurchaseOrderAddRemark: "ViewPurchaseOrder/AddRemark",

  // Create Purchase Order End

  // View purchse request start
  SearchPRSummary: "SearchPurchaseRequest/SearchPRSummary",
  BindEmployee: "SearchPurchaseRequest/BindEmployee",
  PRBindLedger: "SearchPurchaseRequest/BindLedger",
  PRGetPRDetailsByPRNo: "SearchPurchaseRequest/GetPRDetailsByPRNo",
  PRSearchPRDetails: "SearchPurchaseRequest/SearchPRDetails",
  CreatePurchaseOrderGetPOItemsDetails: "CreatePurchaseOrder/GetPOItemsDetails",

  // View purchse request end

  // purchase order approval start
  PurchaseOrderApprovalUpdatePurchaseOrder:
    "PurchaseOrderApproval/UpdatePurchaseOrder",
  PurchaseOrderApprovalGetPurchaseOrderDetails:
    "PurchaseOrderApproval/GetPurchaseOrderDetails",
  PurchaseOrderApprovalApprovedPurchaseOrder:
    "PurchaseOrderApproval/ApprovedPurchaseOrder",
  CancelPurchaseOrderItem: "PurchaseOrderApproval/CancelPurchaseOrderItem",

  // purchase order approval End

  //purchase Tools Start
  PurchaseOrderApprovalPOReport: "PurchaseOrderApproval/POReport",
  PRGetPRDetailsReport: "CreatePurchaseRequest/GetPRDetailsReport",
  //terms and condition

  PurchaseTermsandConditionSave: "TermsandCondition/Save",
  PurchaseTermsandConditionSearch: "TermsandCondition/Search",
  PurchaseTermsandConditionUpdate: "TermsandCondition/Update",
  PurchaseTermsandConditionDelete: "TermsandCondition/Delete",

  // GRN Analysis start
  GRNGetStore: "Requisition/GetStore",
  GRNBindRequisitionType: "MedicineRequisition/BindRequisitionType",
  GRNGetVendor: "PRPOGRNAnalysis/GetVendor",
  GRNSearch: "PRPOGRNAnalysis/Search",
  PRPOGRNAnalysisBindItemapp: "PRPOGRNAnalysis/BindItemapp",
  // GRN Analysis End

  //purchase Tools End

  // Consignment Start

  GetConsignmentList: "Consignment/GetConsignmentList",
  BindConsignmentItemList: "Consignment/BindConsignmentItemList",
  ConsignmentPost: "Consignment/ConsignmentPost",
  ConsignmentCancelAll: "Consignment/ConsignmentCancelAll",
  GRNViewUploadfile: "GRN/UploadGRNDocument",
  // GRNFetchBindAttachment:"GRN/BindAttachment",
  GRNBindPdf: "GRN/BindGRNPdf",
  ConsignmentRejectItem: "Consignment/ConsignmentRejectItem",
  GetConsignmentEditDetails: "Consignment/GetConsignmentEditDetails",
  PatientSearchList: "ConsignmentStockTransfer/PatientSearchList",
  BindPatientDetailsList: "ConsignmentStockTransfer/BindPatientDetails",
  ConsignmentStockItemList: "ConsignmentStockTransfer/BindItemList",
  AddConsignmentStockItemList: "ConsignmentStockTransfer/AddItemList",
  SaveConsignmentStockTransfer: "ConsignmentStockTransfer/Save",
  BindConsignmentVendorList: "OrderAnalysis/OrderAnalysisStore",
  ConsignmentReturnSearchList: "ConsignmentReturn/ConsignmentReturnSearchList",
  SaveConsignmentItemReturnList:
    "ConsignmentReturn/SaveConsignmentItemReturnList",
  ConsignmentReturnPrint: "ConsignmentReturn/ConsignmentReturnPrint",
  ConsignmentReceivePrint: "ConsignmentReturn/ConsignmentReceivePrint",
  PrintIndent: "IPDBillingStatus/PrintIndent",
  ItemAnalysisDetail: "IPDBillingStatus/ItemAnalysisDetail",
  EDPBasicMasterSavePro: "EDP/BasicMaster/SavePro",
  EDPBasicMasterBindPro: "Asset/BasicMaster/BindPro",
  BillingIPDSaveReferDoctor: "Billing/IPD/SaveReferDoctor",
  searchUnderMaintenance: "Billing/IPD/SearchUnderMaintenance",
  bindMaintenance: "Billing/IPD/BindMaintenance",
  saveRoomMaintenance: "Billing/IPD/SaveRoomMaintenance",
  searchRoomMaintenance: "Billing/IPD/SearchRoomMaintenance",
  saveRoomCleaningMaintenance: "Billing/IPD/SaveRoomCleaningMaintenance",
  requestRoomDetail: "Billing/IPD/RequestRoomDetail",
  saveRequestRoomDetail: "Billing/IPD/SaveRequestRoomDetail",
  AssetAndEquipmentLoadUnit: "AssetAndEquipment/loadUnit",
  AssetAndEquipmentSaveAccessoriesMaster:
    "AssetAndEquipment/SaveAccessoriesMaster",
  AssetAndEquipmentBindAccessoriesMasterList:
    "AssetAndEquipment/BindAccessoriesMasterList",
  AssetAndEquipmentSaveAssetDocumentMaster:
    "AssetAndEquipment/SaveAssetDocumentMaster",
  AssetAndEquipmentBindAssetDocumentMasterList:
    "AssetAndEquipment/BindAssetDocumentMasterList",

  //calibaration master
  AssetAndEquipmentSaveComponentCalibrationMaster:
    "AssetAndEquipment/SaveComponentCalibrationMaster",
  AssetAndEquipmentSaveParameterCalibrationMaster:
    "AssetAndEquipment/SaveParameterCalibrationMaster",
  AssetAndEquipmentCalibrationMasterSearch:
    "AssetAndEquipment/CalibrationMasterSearch",
  AssetAndEquipmentLoadAssetParameter: "AssetAndEquipment/LoadAssetParameter",
  AssetAndEquipmentbindFloor: "AssetAndEquipment/bindFloor",
  AssetAndEquipmentSaveBlocks: "AssetAndEquipment/SaveBlocks",
  AssetAndEquipmentloadBlockDetails: "AssetAndEquipment/loadBlockDetails",
  AssetAndEquipmentSaveBuilding: "AssetAndEquipment/SaveBuilding",
  AssetAndEquipmentloadBuildingDetail: "AssetAndEquipment/loadBuildingDetail",
  AssetAndEquipmentSaveFloorBuildingMapping:
    "AssetAndEquipment/SaveFloorBuildingMapping",
  AssetAndEquipmentSaveFloorBuildingMapping:
    "AssetAndEquipment/SaveFloorBuildingMapping",
  AssetAndEquipmentloadFloorMappingDetail:
    "AssetAndEquipment/loadFloorMappingDetail",
  AssetAndEquipmentUpdateFloorMapping: "AssetAndEquipment/UpdateFloorMapping",
  AssetAndEquipmentUpdateFloorMapping: "AssetAndEquipment/UpdateFloorMapping",
  AssetAndEquipmentSaveRoom: "AssetAndEquipment/SaveRoom",
  AssetAndEquipmentLoadRoomDetails: "AssetAndEquipment/loadRoomDetail",
  AssetAndEquipmentSaveCubical: "AssetAndEquipment/SaveCubical",
  AssetAndEquipmentloadCubicalDetail: "AssetAndEquipment/loadCubicalDetail",
  AssetAndEquipmentSaveRoomType: "AssetAndEquipment/SaveRoomType",
  AssetAndEquipmentLoadGroup: "AssetAndEquipment/LoadGroup",
  AssetAndEquipmentLoadAllAssetItems: "AssetAndEquipment/LoadAllAssetItems",
  AssetAndEquipmentbindRoomType: "AssetAndEquipment/bindRoomType",
  AssetAndEquipmentbindRoom: "AssetAndEquipment/bindRoom",
  AssetAndEquipmentBindDepartment: "AssetAndEquipment/BindDepartment",
  AssetAndEquipmentLoadItems: "AssetAndEquipment/LoadItems",
  AssetAndEquipmentSaveIssueAsset: "AssetAndEquipment/SaveIssueAsset",
  AssetAndEquipmentReprintDepartmentIssue:
    "AssetAndEquipment/ReprintDepartmentIssue",
  AssetAndEquipmentSearchIndent: "AssetAndEquipment/SearchIndent",
  AssetAndEquipmentSearchAssetStockbyItemID:
    "AssetAndEquipment/SearchAssetStockbyItemID",
  loadSupplier: "AssetAndEquipment/loadSupplier",
  loadInsuranceSupplier: "AssetAndEquipment/loadInsuranceSupplier",
  SearchGRNDataforWarrantyAMC: "AssetAndEquipment/SearchGRNDataforWarrantyAMC",
  LoadWarrantyDetails: "AssetAndEquipment/LoadWarrantyDetails",
  SaveWarrantyDetails: "AssetAndEquipment/SaveWarrantyDetails",
  LoadAMCDetails: "AssetAndEquipment/LoadAMCDetails",
  SaveAMCDetails: "AssetAndEquipment/SaveAMCDetails",
  LoadCAMCDetails: "AssetAndEquipment/LoadCAMCDetails",
  SaveCAMCDetails: "AssetAndEquipment/SaveCAMCDetails",
  LoadInsuranceDetails: "AssetAndEquipment/LoadInsuranceDetails",
  SaveInsuranceDetails: "AssetAndEquipment/SaveInsuranceDetails",
  LoadServiceProviderDetails: "AssetAndEquipment/LoadServiceProviderDetails",
  SaveServiceProviderDetails: "AssetAndEquipment/SaveServiceProviderDetails",
  SaveNotApplicableDetails: "AssetAndEquipment/SaveNotApplicableDetails",
  BindAssetDocument: "AssetAndEquipment/BindAssetDocument",
  UploadAssetDocument: "AssetAndEquipment/UploadAssetDocument",
  AssetBindVendor: "AssetAndEquipment/BindVendor",
  AssetGetPurchaseOrders: "AssetAndEquipment/GetPurchaseOrders",
  AssetGetPurchaseOrderItems: "AssetAndEquipment/GetPurchaseOrderItems",
  AssetSaveGRN: "AssetAndEquipment/SaveGRN",
  AssetGetTaxCalculations: "GRN/CalculateTaxAmount",
  AssetGetItemList: "AssetAndEquipment/GetItemList",

  // Master
  MasterSearchItem: "ManufactureMaster/SearchItem",
  SaveManufacture: "ManufactureMaster/SaveManufacture",
  UpdateManufacture: "ManufactureMaster/UpdateManufacture",
  ManufactureReportList: "ManufactureMaster/ManufactureReportList",

  //Vendor
  SearchVendor: "VendorDetail/SearchVendor",
  SaveVendor: "VendorDetail/SaveVendor",
  UpdateVendor: "VendorDetail/UpdateVendor",
  BindTerms: "VendorDetail/BindTerms",
  VendorForExcelReport: "VendorDetail/SearchVendorForExcelReport",

  // Item Master
  ItemMasterBindGroup: "ItemMaster/BindGroup",
  BindManufactureData: "ItemMaster/BindManufactureData",
  BindVatType: "ItemMaster/BindVatType",
  BindVatLine: "ItemMaster/BindVatLine",
  BindSaleVatType: "ItemMaster/BindSaleVatType",
  BindSaleVatLine: "ItemMaster/BindSaleVatLine",
  BindDrugCategoryMaster: "ItemMaster/BindDrugCategoryMaster",
  BindMajorUnit: "ItemMaster/BindMajorUnit",
  BindMinorUnit: "ItemMaster/BindMinorUnit",
  BindServiceItems: "ItemMaster/BindServiceItems",
  Bind_Active_salt: "ItemMaster/Bind_Active_salt",
  BindInventoryGrid: "ItemMaster/BindInventoryGrid",
  SaveNewItem: "ItemMaster/SaveNewItem",
  BindSaltItem: "ItemMaster/BindSaltItem",

  // SRSSAIH-2026-0061 Point 1 — Item Master enhancements
  GetNextItemCode: "ItemMaster/GetNextItemCode",
  GetItemExtendedDetail: "ItemMaster/GetItemExtendedDetail",
  BindMinorGroup: "ItemMaster/BindMinorGroup",
  SaveMinorGroup: "ItemMaster/SaveMinorGroup",
  RenameMasterOption: "ItemMaster/RenameMasterOption",
  BindDivision: "ItemMaster/BindDivision",
  SaveDivision: "ItemMaster/SaveDivision",
  BindMarketedBy: "ItemMaster/BindMarketedBy",
  SaveMarketedBy: "ItemMaster/SaveMarketedBy",
  MarketedByList: "ItemMaster/MarketedByList",
  // PO Signature Master
  POSignGetDesignation: "POSignatureMaster/GetDesignation",
  POSignInsertDesignation: "POSignatureMaster/InsertDesignation",
  POSignUpdateDesignation: "POSignatureMaster/UpdateDesignation",
  POSignGetSignatories: "POSignatureMaster/GetSignatories",
  POSignGetPDepartments: "POSignatureMaster/GetPDepartments",
  POSignSave: "POSignatureMaster/SaveSignatureMaster",
  POSignGet: "POSignatureMaster/GetSignMaster",
  POSignUpdate: "POSignatureMaster/UpdateSignMaster",
  SavePurchaseUnit: "ItemMaster/SavePurchaseUnitSave",
  SaveSaleUnit: "ItemMaster/SaveSaleUnit",
  SearchItemForAlike: "ItemMaster/SearchItemForAlike",

  // reports

  StockStatusReport: "CurrentStock/StockStatusReport",
  StockLedgerReport: "CurrentStock/StockLedgerReport",
  CurrentStockReport: "CurrentStock/CurrentStockReport",
  IssueDetailReport: "CurrentStock/IssueDetail",
  StockBinCardReport: "CurrentStock/StockBinCardReport",
  ABCAnalysis: "CurrentStock/ABCAnalysis",
  LowStockDetail: "CurrentStock/LowStockDetail",
  ItemExpiryReport: "CurrentStock/ItemExpiryReport",
  ItemMovementReport: "CurrentStock/ItemMovementReport",
  AdjustmentDetailReport: "CurrentStock/AdjustmentDetailReport",
  ConsumptionReport: "CurrentStock/ConsumptionReport",
  PurchaseSummaryReport: "CurrentStock/PurchaseSummaryReport",
  BindGroupIndentStatusReport: "Return/BindGroupIndentStatusReport",
  ItemBindIndentStatusReport: "Return/ItemBindIndentStatusReport",
  GRNDetailReport: "CurrentStock/GRNDetailReport",
  SupplierReturnReport: "CurrentStock/SupplierReturnReport",
  IndentStatusReport: "CurrentStock/IndentStatusReport",
  getGSTReport: "GSTReport/GSTReport",
  GetBankReconciliationReport: "Finance/GetBankReconciliationReport",

  // Generic Master

  BindGeneric: "GenericMaster/BindGeneric",
  SaveGenericEdit: "GenericMaster/SaveGenericEdit",
  AddNewGeneric: "GenericMaster/AddNewGeneric",
  SearchGenericItem: "GenericMaster/SearchGenericItem",
  BindUnitMaster: "GenericMaster/BindUnitMaster",
  SaveGeneric: "GenericMaster/SaveGeneric",
  BindItemIdList: "GenericMaster/BindItemIdList",
  GenericDeleteitem: "GenericMaster/GenericDeleteitem",
  ReportList: "GenericMaster/ReportList",
  GenericReport: "GenericMaster/GenericReport",

  // SRSSAIH-2026-0061 Point 2 — Generic Master and Mapping
  GetMappingList: "GenericMaster/GetMappingList",
  GetItemMapping: "GenericMaster/GetItemMapping",
  SearchGenericOrSalt: "GenericMaster/SearchGenericOrSalt",
  BindATCLevel: "GenericMaster/BindATCLevel",
  // SRSSAIH-2026-0061 P2b — the whole L1..L5 chain for one generic.
  GetGenericATC: "GenericMaster/GetGenericATC",
  // SRSSAIH-2026-0061 P2c — the Generic Master screen (definition + classification).
  GetGenericMasterList: "GenericMaster/GetGenericMasterList",
  SaveGenericMasterFull: "GenericMaster/SaveGenericMasterFull",
  // SRSSAIH-2026-0061 P2g — a generic's name and ATC classification, in one write.
  SaveGenericDefinition: "GenericMaster/SaveGenericDefinition",
  SaveATCLevel: "GenericMaster/SaveATCLevel",
  BindGenericList: "GenericMaster/BindGenericList",
  SaveGenericMaster: "GenericMaster/SaveGenericMaster",
  SaveItemMapping: "GenericMaster/SaveItemMapping",
  // SRSSAIH-2026-0061 P2h — masters first, then map items by sub generic only.
  BindSubGenericList: "GenericMaster/BindSubGenericList",
  GetGenericMasterSummary: "GenericMaster/GetGenericMasterSummary",

  // SRSSAIH-2026-0061 Point 3 — Department ROL/ROQ/Classification Master
  DeptNormGetItems: "DeptStockNorm/GetItems",
  DeptNormSaveBulk: "DeptStockNorm/SaveBulk",
  DeptNormImportExcel: "DeptStockNorm/ImportExcel",
  DeptNormBindRack: "DeptStockNorm/BindRack",
  DeptNormBindShelf: "DeptStockNorm/BindShelf",
  DeptNormBindType: "DeptStockNorm/BindType",
  DeptNormBindClass: "DeptStockNorm/BindClass",
  DeptNormSaveRack: "DeptStockNorm/SaveRack",
  DeptNormSaveShelf: "DeptStockNorm/SaveShelf",
  DeptNormSaveType: "DeptStockNorm/SaveType",
  DeptNormSaveClass: "DeptStockNorm/SaveClass",

  // SRSSAIH-2026-0061 Point 8 — Map item with Panel / Panel Group
  PanelItemMapGetItems: "PanelItemMap/GetItems",
  PanelItemMapBindPanelGroup: "PanelItemMap/BindPanelGroup",
  PanelItemMapBindPanel: "PanelItemMap/BindPanel",
  PanelItemMapGetItemMapping: "PanelItemMap/GetItemMapping",
  PanelItemMapSaveBulk: "PanelItemMap/SaveBulk",
  PanelItemMapReapplyGroup: "PanelItemMap/ReapplyGroup",
  IsItemAllowedForPanel: "PanelItemMap/IsItemAllowedForPanel",

  // SRSSAIH-2026-0061 Point 4 — Pharmacy Discount Master
  DiscountPreviewScope: "PharmacyDiscount/PreviewScope",
  DiscountSaveRule: "PharmacyDiscount/SaveRule",
  DiscountGetCaps: "PharmacyDiscount/GetCaps",
  ResolveDiscount: "PharmacyDiscount/ResolveDiscount",
  // SRSSAIH-2026-0061 P7C — panel-driven substitution at IPD pharmacy issue.
  SubstitutionResolve: "PanelSubstitution/Resolve",
  SubstitutionOptions: "PanelSubstitution/Options",
  SubstitutionApply: "PanelSubstitution/Apply",
  SubstitutionLog: "PanelSubstitution/GetLog",

  // SRSSAIH-2026-0061 Point 5 — GRN accounts posting / price rules (all flag-gated)
  GRNGetFeatureFlags: "GRNAccountPost/GetFeatureFlags",
  GRNGetPostStatus: "GRNAccountPost/GetPostStatus",
  GRNMarkAccountPosted: "GRNAccountPost/MarkAccountPosted",
  GRNReverseAccountPost: "GRNAccountPost/ReverseAccountPost",
  GRNUpdateCreditNote: "GRN/UpdateGRNCreditNote",
  GRNMarkAccountPostedStock: "GRN/MarkGRNAccountPosted",
  GRNIsLocked: "GRNAccountPost/IsGRNLocked",
  GRNValidatePrices: "GRNAccountPost/ValidateGRNPrices",
  GRNGetPOPrices: "GRNAccountPost/GetPOPricesForItems",

  // SRSSAIH-2026-0061 Point 6 — PO price from the last GRN (flag-gated)
  POPriceGetFeatureFlags: "POPriceLookup/GetFeatureFlags",
  POGetLastGrnPrice: "POPriceLookup/GetLastGrnPrice",
  // Item Ledger - screen aur PDF, dono ek hi hisaab se
  ItemLedgerSearchItem: "ItemLedger/SearchItem",
  ItemLedgerGetSummary: "ItemLedger/GetSummary",
  ItemLedgerDownloadSummary: "ItemLedger/DownloadSummary",
  // IPD patient ka Pharmacy bill -> Hospital bill
  MoveToHospitalGetBills: "PharmacyMoveToHospital/GetBills",
  MoveToHospitalPreview: "PharmacyMoveToHospital/Preview",
  MoveToHospitalMove: "PharmacyMoveToHospital/Move",
  MoveToHospitalGetLog: "PharmacyMoveToHospital/GetLog",
  // Return + Reissue: return (like /PatientReturnNew), Hospital issue, paisa usi receipt par
  ReissueGetBills: "PharmacyReissue/GetBills",
  ReissuePreview: "PharmacyReissue/Preview",
  ReissueExecute: "PharmacyReissue/Execute",
  ReissueGetLog: "PharmacyReissue/GetLog",
  POGetLastGrnByItem: "POPriceLookup/GetLastGrnByItem",

  // SRSSAIH-2026-0061 Point 9 — Purchase Request item load (flag-gated)
  PRLoadGetFeatureFlags: "PurchaseRequestLoad/GetFeatureFlags",
  PRLoadItemsForPR: "PurchaseRequestLoad/LoadItemsForPR",
  PRGetItemRateAndPendingPR: "PurchaseRequestLoad/GetItemRateAndPendingPR",
  PRGetPendingGRNPurchaseOrders: "PurchaseRequestLoad/GetPendingGRNPurchaseOrders",

  // SRSSAIH-2026-0061 Point 7 Slice B — indent approval (flag-gated)
  IndentApprovalFlags: "PharmacyIndentApproval/GetFeatureFlags",
  EvaluateIndentApproval: "PharmacyIndentApproval/EvaluateIndentApproval",
  RequestIndentApproval: "PharmacyIndentApproval/RequestApproval",
  GetPendingIndentApprovals: "PharmacyIndentApproval/GetPendingApprovals",
  DecideIndentApproval: "PharmacyIndentApproval/DecideApproval",
  GetPanelApprovalLimits: "PharmacyIndentApproval/GetPanelLimits",
  SavePanelApprovalLimits: "PharmacyIndentApproval/SavePanelLimits",

  //Consignment End

  // Tools Start

  GetExpiryItems: "Tool/GetExpiryItems",
  SaveItemExpiry: "Tool/SaveItemExpiry",
  SearchChangeMRP: "Tool/SearchChangeMRP",
  SaveChangeMRP: "Tool/SaveChangeMRP",
  BindToolItem: "Tool/BindItem",
  SaveDepartmentWiseRack: "Tool/SaveDepartmentWiseRack",
  GetMergePatientDetail: "Tool/GetMergePatientDetail",
  MergeDuplicatePatient: "Tool/MergeDuplicatePatient",

  // Tools End
  BindDepartments: "MedicineReturnRequisition/BindDepartments",

  // Display Management Start
  DisplayBindRoom: "Display/BindRoom",
  serachBindRoom: "Display/BindDoctorData",
  bindCurrentPatient: "Display/bindCurrentPatient",
  // BindDoctorData:"Display/BindDoctorData",
  BindDisplayToken: "Display/BindDisplayToken",
  BindRoomdata: "Display/GetDisplayToken",
  DisplayBindUser: "Display/BindUser",
  DisplayFloorName: "Display/FloorName",
  DisplayWardData: "Display/BindWardData",

  // Finance API start here
  BindMainCenter: "Finance/BindMainCentre",
  SavePCDeptRequest: "Finance/SavePCDeptRequest",
  BindBackendData: "/Finance/BindBackendData",
  AccessMasterSaveMapping: "Finance/AccessMasterSaveMapping",
  getSessionDate: "Finance/getSessionDate",
  getCurrencyConversionFactor: "Finance/getCurrencyConversionFactor",
  bindVoucherBillingScreenControls: "Finance/BindVoucherBillingScreenControls",
  GetCOACurrentClosingBalance: "Finance/GetCOACurrentClosingBalance",
  SearchPettyCashRequest: "Finance/SearchPettyCashRequest",
  UpdateRequestStatus: "Finance/UpdateRequestStatus",
  SearchPendingPettyCashRequest: "Finance/SearchPendingPettyCashRequest",
  SavePCRequestApproval: "Finance/SavePCRequestApproval",
  searchPendingPettyCashApproval: "Finance/searchPendingPettyCashApproval",
  updatePettyCashApprovalStatus: "Finance/updatePettyCashApprovalStatus",
  SavePCEntry: "Finance/SavePCEntry",
  searchPettyCashEntry: "/Finance/searchPettyCashEntry",
  updatePettyCashEntryStatus: "/Finance/updatePettyCashEntryStatus",
  BindMappingData: "/Finance/BindMappingData",
  SaveMapping: "/Finance/SaveMapping",
  FinanceBindCentre: "Finance/BindCentre",
  BindMappingDetails: "Finance/BindMappingDetails",
  RemoveMapping: "Finance/RemoveMapping",
  ActionChartOfAccount: "Finance/ActionChartOfAccount",
  SaveNewAccountType: "Finance/SaveNewAccountType",
  SaveChartOfAccount: "Finance/SaveChartOfAccount",
  Bindglobalresources: "Finance/Bindglobalresources",

  // Master Start
  FinanceConsumptionBindBranchCentre: "Finance/ConsumptionBindBranchCentre",
  BindHisDerpatment: "Finance/BindHisDerpatment",
  BindTransactionType: "Finance/BindTransactionType",
  BindScreenControls: "Finance/BindScreenControls",
  ConsumptionSaveMapping: "Finance/ConsumptionSaveMapping",
  ChangeStatus: "Finance/ChangeStatus",
  CopyMapping: "Finance/CopyMapping",
  FinanceLoadType: "Finance/LoadType",
  SaveMasterCreation: "Finance/SaveMasterCreation",
  FinanceBindMasterCreation: "Finance/BindMasterCreation",
  SaveVoucherTypeMaster: "Finance/SaveVoucherTypeMaster",
  BindVoucherTypeMaster: "Finance/BindVoucherTypeMaster",
  BindUsertypeApprovalMasterURL: "Finance/BindUsertypeApprovalMaster",
  GetCountry: "Finance/GetCountry",
  BindCurrencyMaster: "Finance/BindCurrencyMaster",
  SaveMappingData: "Finance/SaveMappingData",
  CentreWise_Coa_Mapping: "Finance/CentreWise_Coa_Mapping",
  CostBindMapping: "Finance/CostBindMapping",
  CostSaveMapping: "Finance/CostSaveMapping",
  DeActiveVoucherTypeMaster: "Finance/DeActiveVoucherTypeMaster",
  SaveCurrencyMaster: "Finance/SaveCurrencyMaster",
  BindHREmployeeDepartment: "Finance/BindHREmployeeDepartment",
  BindDoctorDepartment: "Finance/BindDoctorDepartment",
  CostLoadGroupRecords: "Finance/CostLoadGroupRecords",
  FinanceAccount: "Finance/FinanceAccount",
  CostChangeStatus: "Finance/CostChangeStatus",
  // Master End

  // finance approval start
  VoucherLimitBindMapping: "Finance/VoucherLimitBindMapping",
  BindReconciliationBank: "Finance/BindReconciliationBank",
  VoucherLimitSaveMapping: "Finance/VoucherLimitSaveMapping",
  BindReconciliationVerifyDetails: "Finance/BindReconciliationVerifyDetails",
  LoadAccountDetailsURL: "Finance/LoadAccountDetails",
  SearchReconcileDetails: "Finance/SearchReconcileDetails",
  UpdateVoucherPostingReview: "Finance/UpdateVoucherPostingReview",
  FinanceUpdateStatusBulk: "Finance/UpdateStatusBulk",
  FinanceBindAuditBackendData: "Finance/BindAuditBackendData",
  FinanceSaveVoucherAudit: "Finance/SaveVoucherAudit",
  SaveMapAdvanceWithPurchase: "Finance/SaveMapAdvanceWithPurchase",
  // finance approval end

  // finance voucher start
  GetPendingCheque: "Finance/GetPendingCheque",
  SaveChequeDeposit: "Finance/SaveChequeDeposit",
  GetDepositCheque: "Finance/GetDepositCheque",
  SaveChequeBounce: "Finance/SaveChequeBounce",
  UpdateReconciliationVerifyURL: "Finance/UpdateReconciliationVerify",
  DownloadVoucher: "Finance/DownlaodVoucherAttachment",
  // finance voucher end
  // Finance Voucher Audit Api Start

  BindAuditBackendData: "Finance/BindAuditBackendData",
  BindReportControlsURL: "Finance/BindReportControls",

  FinanceSaveVoucher: "Finance/SaveVoucher",
  ReplicateVoucherHistoryURL: "Finance/SearchReplicateVoucher",
  // finance voucher end
  helpMenu: "MachineResultEntry/BindMapping",

  // finance Report start
  GetTrialBalanceReport: "Finance/GetTrialBalanceReport",
  GetGLReport: "Finance/GetGLReport",
  PurchaseBillDueReport: "Finance/PurchaseBillDueReport",
  SaleBillDueReport: "Finance/SaleBillDueReport",
  VoucherSummaryReport: "Finance/VoucherSummaryReport",
  GetWithHoldingTaxReport: "Finance/GetWithHoldingTaxReport",
  GetPayableBankWiseReportURL: "Finance/GetPayableBankWiseReport",
  BindPayableGroup: "Finance/BindPayableGroup",
  PaybleAgingSummary: "Finance/PaybleAgingSummary",
  GetStatementReport: "Finance/GetStatementReport",
  BindSettlementDetailsURL: "Finance/BindSettlementDetails",
  // finance Report end
  // finance report Start
  FinanceBindBranchCentre: "Finance/BindBranchCentre",
  FinanceSaveBalanceInvoice: "Finance/SaveBalanceInvoice",
  FinanceReceibleAgingSummary: "Finance/ReceibleAgingSummary",
  SearchForBoucherPostingBatch: "Finance/SearchForBoucherPostingBatch",
  FinanceSearchVoucher: "Finance/FinanceSearchVoucher",
  GetBSReportURL: "Finance/GetBSReport",
  GetBSDetailReportURL: "Finance/GetBSDetailReport",
  GetISReportURL: "Finance/GetISReport",

  // finance report End

  // EDP Start
  // Centre Management STart
  SaveCentreEDP: "EDP/CentreSetUp/SaveCentre",
  UpdateCentreEDP: "EDP/CentreSetUp/UpdateCentre",
  EDPAllMappingsURL: "EDP/CentreSetUp/GetAllMappings",
  SavesRolesMappingsDetailsURL: "EDP/CentreSetUp/SavesRolesMappingsDetails",
  SavesDoctorMappingsDetailsURL: "EDP/CentreSetUp/SavesDoctorsMappingsDetails",
  // Centre Access Rights - the two indent columns write IsDepartmentIndent /
  // IsPatientIndent on f_centre_role. They are role-level flags, not panel or
  // role mappings, so they have their own endpoints.
  SavesDIMappingsDetailsURL: "EDP/CentreSetUp/SavesDIMappingsDetails",
  SavesPIMappingsDetailsURL: "EDP/CentreSetUp/SavesPIMappingsDetails",
  CentreWiseItemSearchURL: "EDP/CentreSetUp/GetItems",
  CentreWiseItemSaveURL: "EDP/CentreSetUp/SaveItems",
  // Centre Management End
  GetCategory: "EDP/ServicesSetup/GetCategory",
  GetSubCategory: "EDP/ServicesSetup/GetSubCategory",
  GetDepartment: "EDP/ServicesSetup/GetDepartment",
  GetGST: "EDP/ServicesSetup/GetGST",
  SaveItem: "EDP/ServicesSetup/SaveItem",
  LoadItems: "EDP/ServicesSetup/LoadItem",
  EDPBindAllCentre: "EDP/CentreSetUp/BindAllCentre",
  EDPBindAllOrganizationURL: "CommonAPI/BindAllOrganization",
  GetSubScreenMenuByRoleURL: "MasterPage/GetSubScreenMenuByRole",
  CentreManagementSearchURL: "EDP/CentreSetUp/SearchCenter",
  EDPLoadPrescriptionViewURL: "EDP/CentreSetUp/LoadPrescriptionView",
  ServicesSetupBindDisplayName: "EDP/ServicesSetup/BindDisplayName",
  ServicesSetupSaveDisplayName: "EDP/ServicesSetup/SaveDisplayName",
  ServicesSetupUpdateDisplayName: "EDP/ServicesSetup/UpdateDisplayName",
  BindCategoryType: "EDP/ServicesSetup/BindCategoryType",
  SaveCategory: "EDP/ServicesSetup/SaveCategory",
  BindReturn: "EDP/ServicesSetup/BindReturn",
  EditCategory: "EDP/ServicesSetup/EditCategory",
  EDPBindCategoryURL: "EDP/ServicesSetup/BindCategoryList",
  LoadDisplayName: "EDP/ServicesSetup/BindDisplayName",
  SaveDepartment: "EDP/ServicesSetup/SaveDepartment",
  UpdateItem: "EDP/ServicesSetup/UpdateItem",
  EdpSearchEmployee: "EDP/EmployeeSetUp/SearchEmp",
  EDPLoadPrescriptionView: "EDP/EmployeeSetUp/LoadPrescriptionView",
  SaveSubCategory: "EDP/ServicesSetup/SaveSubCategory?",
  BindGrid: "EDP/ServicesSetup/BindGrid",
  EditSaveSubCategory: "EDP/ServicesSetup/EditSaveSubCategory",
  EDPUploadForm: "EDP/EmployeeSetUp/UploadDigitalForm",
  EDPGetForm: "EDP/EmployeeSetUp/BindDigitalForms",
  SearchPatientByIPDNo: "MasterPage/SearchPatientByIPDNo",
  UpdateBillingAndDischarge: "MasterPage/UpdateBillingAndDischarge",

  // Laboratory Mangagement
  ManagementBindInvestigation: "EDP/LaboratorySetup/BindInvestigation",
  SaveInvestigation: "EDP/LaboratorySetup/SaveInvestigation",
  BindCategorylabortarymanagment: "EDP/LaboratorySetup/BindCategory",
  SaveObservation: "EDP/LaboratorySetup/SaveObservation",
  BindObservationType: "EDP/LaboratorySetup/BindObservationType",
  UpdateObservation: "EDP/LaboratorySetup/UpdateObservation",
  GetDocTypeList: "EDP/LaboratorySetup/GetDocTypeList",
  // Formula Master
  Formula: "EDP/LaboratorySetup/Formula",

  // HelpObservation
  BindInvestigationHelp: "EDP/LaboratorySetup/BindInvestigationHelp",
  BindHelp: "EDP/LaboratorySetup/BindHelp",
  BindMapping: "EDP/LaboratorySetup/BindMapping",
  RemoveObservationHelp: "EDP/LaboratorySetup/RemoveObservationHelp",
  SaveObservationHelp: "EDP/LaboratorySetup/SaveObservationHelp",
  AddObservationHelp: "EDP/LaboratorySetup/AddObservationHelp",
  UpdateObservationHelp: "EDP/LaboratorySetup/UpdateObservationHelp",
  BindPayrollDepartment: "EDP/EmployeeSetUp/BindPayrollDepartment",
  EPDsaveEmployee: "EDP/EmployeeSetUp/SaveEmployee",
  EDPBindPayrollDesignation: "EDP/EmployeeSetUp/BindPayrollDesignation",
  BindEmployeeGroup: "EDP/EmployeeSetUp/BindEmployeeGroup",
  BindUserType: "EDP/EmployeeSetUp/BindUserType",
  BindQualification: "EDP/EmployeeSetUp/BindQualification",
  BloodBank: "BloodBank/BindBloodGroup",
  BindTitleWithGender: "EDP/EmployeeSetUp/BindTitleWithGender",
  EDPGetEmployee: "EDP/EmployeeSetUp/GetEmployee",
  EDPupdateEmployee: "EDP/EmployeeSetUp/UpdateEmployee",
  EDPCentreSetUpGetCenter: "EDP/CentreSetUp/GetCenter",
  EDPgetSetCentre: "EDP/EmployeeSetUp/GetSetCentre",
  EDPGetUserAccess: "EDP/EmployeeSetUp/GetUserAccess",
  EDPSaveUserRoles: "EDP/EmployeeSetUp/SaveUserRoles",

  // rate setup Start
  ServicesRateSetupLoadCategory: "EDP/ServicesRateSetup/LoadCategory",
  RateSetupLoadSubCategory: "EDP/ServicesRateSetup/LoadSubCategory",
  EDPGetDeptWiseAuth: "EDP/EmployeeSetUp/GetDeptWiseAuth",
  EDPCheckUserAuthorization: "EDP/EmployeeSetUp/CheckUserAuthorization",
  ServicesRateSetup: "EDP/ServicesRateSetup/PanelChange",
  SaveRateSchedule: "EDP/ServicesRateSetup/SaveRateSchedule",
  UpdateRateSchedule: "EDP/ServicesRateSetup/UpdateRateSchedule",
  // RateSetupCaseTypeBind:"EDP/ServicesRateSetup/CaseTypeBind",
  RateSetupLoadItems: "EDP/ServicesRateSetup/LoadItems",
  RateSetupBindCentre: "EDP/ServicesRateSetup/BindCentre",
  ServicesRateSetupBindModelCentre: "EDP/ServicesRateSetup/BindModelCentre",
  RateSetupLoadRates: "EDP/ServicesRateSetup/LoadRates",
  RateSetupSaveSetItemRate: "EDP/ServicesRateSetup/SaveSetItemRate",
  RateSetupCaseTypeBind: "EDP/ServicesRateSetup/CaseTypeBind",
  RateSetupLoadSubCategorySurgery:
    "EDP/ServicesRateSetup/LoadSubCategorySurgery",
  RateSetupLoadItemSurgery: "EDP/ServicesRateSetup/LoadItemSurgery",
  RateSetupLoadRatesSurgery: "EDP/ServicesRateSetup/LoadRatesSurgery",
  RateSetupSaveSurgeryRates: "EDP/ServicesRateSetup/SaveSurgeryRate",
  ServicesRateSetupCopyToIPD: "EDP/ServicesRateSetup/CopyToIPD",
  ServicesRateSetupCopyToOPD: "EDP/ServicesRateSetup/CopyToOPD",
  ServicesRateSetupCopyFromIPD: "EDP/ServicesRateSetup/CopyFromIPD",
  ServicesRateSetupCopyFromOPD: "EDP/ServicesRateSetup/CopyFromOPD",
  ServicesRateSetupBindFromCentreIPD: "EDP/ServicesRateSetup/BindFromCentreIPD",
  ServicesRateSetupBindFromCentreOPD: "EDP/ServicesRateSetup/BindFromCentreOPD",
  ServicesRateSetupBindToCentreOPD: "EDP/ServicesRateSetup/BindToCentreOPD",
  ServicesRateSetupBindToCentreIPD: "EDP/ServicesRateSetup/BindToCentreIPD",
  handleSubCategoryRateListURL: "EDP/ServicesRateSetup/BindSubCategoryIPD",
  SaveEDPSetRateURL: "EDP/ServicesRateSetup/SaveCopyRateList",
  // Import Rate List (/import-rate-list) - port of Design/EDP/ImportRateList.aspx
  ImportRateListPanelURL: "EDP/ServicesRateSetup/LoadPanelCSV",
  ImportRateListScheduleChargeURL: "EDP/ServicesRateSetup/LoadScheduleChargesCSV",
  ImportRateListMastersURL: "EDP/ServicesRateSetup/ImportRateListMasters",
  RateListReportFiltersURL: "EDP/ServicesRateSetup/RateListReportFilters",
  RateListReportURL: "EDP/ServicesRateSetup/RateListReport",
  ValidateImportRateListURL: "EDP/ServicesRateSetup/ValidateImportRateList",
  ImportRateListURL: "EDP/ServicesRateSetup/ImportRateList",
  ImportRateListLogURL: "EDP/ServicesRateSetup/ImportRateListLog",
  // rate setup End

  EDPGetRoleWisePages: "EDP/EmployeeSetUp/GetRoleWisePages",
  EDPSearchEmpforCopyFromBind: "EDP/EmployeeSetUp/SearchEmpforCopyFromBind",
  EDPSearchEmpforCopyToBind: "EDP/EmployeeSetUp/SearchEmpforCopyToBind",
  EDPUpdateCentre: "EDP/EmployeeSetUp/UpdateCentre",
  EDPGetCenter: "EDP/EmployeeSetUp/GetCenter",
  EDPResetPassword: "EDP/EmployeeSetUp/ResetPassword",
  EDPSavePageAccess: "EDP/EmployeeSetUp/SavePageAccess",
  EDPSaveUserAuth: "EDP/EmployeeSetUp/SaveUserAuth",
  EDPLoadEmployee: "EDP/EmployeeSetUp/LoadEmployee",
  EDPLoadDoctor: "EDP/EmployeeSetUp/LoadDoctor",
  EDPanelMaster: "EDP/ServicesSetup/BindPanel",
  EDPSurgeryItem: "EDP/ServicesSetup/LoadSurgeryItem",
  EDPActDeactEmpSave: "EDP/EmployeeSetUp/ActDeactEmpSave",
  ActivateDeActivateDrEmp: "EDP/EmployeeSetUp/ActivateDeActivateDrEmp",
  EDPSaveSurgeryGrouping: "EDP/ServicesSetup/SaveSurgeryGrouping",
  SaveSurgeryGroupName: "EDP/ServicesSetup/SaveSurgeryGroupName",
  BindGroupSurgery: "EDP/ServicesSetup/BindGroupSurgery",

  // MapInvestigationObservationNew
  BindInvestigationMaster: "EDP/LaboratorySetup/Bind_Investigation",
  BindObservationInvestigation:
    "EDP/LaboratorySetup/BindObservationInvestigation",
  SaveObservationInvestigation:
    "EDP/LaboratorySetup/SaveObservationInvestigation",
  SaveNewObservation: "EDP/LaboratorySetup/SaveNewObservation",
  GetObservationData: "EDP/LaboratorySetup/GetObservationData",
  RemoveObservationInvestigation:
    "EDP/LaboratorySetup/RemoveObservationInvestigation",
  SaveObservationInvestigationMapping: "EDP/LaboratorySetup/SaveMapping",
  BindInvestigationOrder: "EDP/LaboratorySetup/BindInvestigationOrder",
  BindinvestigationLabOutSource: "EDP/LaboratorySetup/BindLabOutSource",
  LoadHeadDepartment: "EDP/LaboratorySetup/LoadHead",
  SaveInvestigationOrder: "EDP/LaboratorySetup/SaveInvestigationOrder",
  BindinvestigationTamplate: "EDP/LaboratorySetup/BindinvestigationTamplate",
  LoadTamplate: "EDP/LaboratorySetup/LoadTamplate",
  RejectTamplate: "EDP/LaboratorySetup/RejectTamplate",
  RejectComment: "EDP/LaboratorySetup/RejectComment",
  SaveTamplateInv: "EDP/LaboratorySetup/SaveTamplate",
  SaveUpdateTamplate: "EDP/LaboratorySetup/SaveUpdateTamplate",
  EditTamplate: "EDP/LaboratorySetup/EditTamplate",
  EditComment: "EDP/LaboratorySetup/EditComment",
  BindObservationLabcomment: "EDP/LaboratorySetup/BindObservationLabcomment",
  SaveComment: "EDP/LaboratorySetup/SaveComment",
  BindHumanResourceManager: "EDP/EmployeeSetUp/BindHumanResourceManager",
  BindChiefExecutiveOfficer: "EDP/EmployeeSetUp/BindChiefExecutiveOfficer",
  EDPBindUserGroup: "EDP/EmployeeSetUp/BindUserGroup",
  EDPSaveUserGroup: "EDP/EmployeeSetUp/SaveUserGroup",
  EDPEmployeeSetUpSaveUserType: "EDP/EmployeeSetUp/SaveUserType",
  EDPCommonMasterBindUserType: "EDP/EmployeeSetUp/CommonMasterBindUserType",
  EDPBindDesignationtableinMaster:
    "EDP/EmployeeSetUp/BindDesignationtableinMaster",
  EDPBindGrade: "EDP/EmployeeSetUp/BindGrade",
  EDPSaveDesignation: "EDP/EmployeeSetUp/SaveDesignation",
  EDPBindJobType: "EDP/EmployeeSetUp/BindJobType",
  EDPSaveJobType: "EDP/EmployeeSetUp/SaveJobType",
  EDPSaveSurgeryType: "EDP/ServicesSetup/SaveSurgeryType",
  EDPSearchSurgeryType: "EDP/ServicesSetup/SearchSurgeryType",
  EDPUpdateSurgeryType: "EDP/ServicesSetup/UpdateSurgeryType",
  LoadComment: "EDP/LaboratorySetup/LoadComment",
  SearchSurgeryItem: "EDP/ServicesSetup/SearchSurgeryItem",
  BindManageApprovalDetail: "/EDP/LaboratorySetup/BindDetail",
  BindDoctorApproval: "EDP/LaboratorySetup/Bind_Employee",
  BindEmployeeApproval: "EDP/LaboratorySetup/BindEmployee",
  BindRoleApproval: "EDP/LaboratorySetup/BindRole",
  SaveManageApproval: "EDP/LaboratorySetup/SaveManageApproval",
  BindDetailApproval: "EDP/LaboratorySetup/BindDetail",
  // Manage Approval Rights: employee-group dropdown + Edit (fin_global_resources IsMultipleTechnicianApproval)
  GetApprovalGroupOptions: "EDP/LaboratorySetup/GetApprovalGroupOptions",
  RemoveSignApproval: "EDP/LaboratorySetup/RemoveSign",
  manageDeliveryBindCentre: "EDP/LaboratorySetup/BindCentre",
  GetDeliveryDays: "EDP/LaboratorySetup/GetDeliveryDays",
  SaveOutSourceLab: "EDP/LaboratorySetup/SaveOutSourceLab",
  UpdateOutSourceLab: "/LaboratorySetup/UpdateOutSourceLab",
  EDPBindAllItems: "EDP/ServicesSetup/BindAllItems",
  EDPSaveLocation: "EDP/LocationMaster/SaveLocation",
  EDPLoadLocationDetail: "EDP/LocationMaster/LoadLocationDetail",

  //satish start

  GetInvCheckListMaster: "MachineResultEntry/GetInvCheckListMaster",
  SaveInvItemCheckList: "MachineResultEntry/SaveInvItemCheckList",
  GetAllEyeFramePrintReport: "Doctor/GetAllEyeFramePrintReport",
  GetPatientReferralRequests: "Doctor/GetPatientReferralRequests",
    MarkReferralBooked: "Doctor/MarkReferralBooked",
  SaveSurgicalOncoAssessment: "Doctor/SaveSurgicalOncoAssessment",
  GetSurgicalOncoAssessment: "Doctor/GetSurgicalOncoAssessment",

  SaveNewInvestigation: "Laboratory/SaveNewInvestigation",
  PathologistApprovalSearchPatient: "PathologistApproval/SearchPatient",
  PathologistApprovalSaveLabObservationOpdPathologist:
    "PathologistApproval/SaveLabObservationOpdPathologist",
  UpdateSerialMarkViewLab: "MachineResultEntry/UpdateSerialMarkViewLab",
  // Updates the sample Registration / Collection / Receive / Report date-times.
  // Backend: MachineResultEntryController.UpdateResultEntryDates.
  UpdateResultEntryDates: "MachineResultEntry/UpdateResultEntryDates",
  updatePatientIssue: "KichenDiet/UpdatePatientIssue",
  deletePatientIssue: "KichenDiet/DeletePatientIssue",
  getBloodVolumeOfRequisition: "BloodRequisition/GetBloodVolumeOfRequisition",
  getProductOfRequisition: "BloodRequisition/GetProductOfRequisition",
  getBloodNatureOfRequisition: "BloodRequisition/GetBloodNatureOfRequisition",
  patientBloodRequisition: "BloodRequisition/PatientBloodRequisition",
  getBloodRequisition: "BloodRequisition/GetBloodRequisition",
  updatePatientBloodRequisitionStatus:
    "BloodRequisition/UpdatePatientBloodRequisitionStatus",
  getBloodRequisitionReport: "BloodRequisition/GetBloodRequisitionReport",
  getCtbNo: "BloodRequisition/GetCTBNo",
  getIndentBloodUnits: "BloodRequisition/GetIndentBloodUnits",
  getBloodRequisitionIndentReport:
    "BloodRequisition/BloodRequisitionIndentReportPDF",
  // getCollectionReport:"CommonReports/commonReports/getFields/getFields/collectionreport",
  createDiagnosisTreatment: "VitalSign/CreateDiagnosisTreatment",
  getPatientAllergiesDiagnosisAllById:
    "VitalSign/GetPatientAllergiesDiagnosisAllById",
  deleteDiagnosisTreatment: "VitalSign/DeleteDiagnosisTreatment",
  getAllVitalMaster: "VitalSign/GetAllVitalMaster",
  insertReportNumberFormat: "MachineResultEntry/InsertReportNumberFormat",
  getEquipmentMasterAll: "NursingWard/GetEquipmentMasterAll",
  createNursingNotes: "NursingWard/CreateNursingNotes",
  getNursingNoteById: "NursingWard/GetNursingNoteById",
  getNursingNote: "NursingWard/GetNursingNote",
  deleteNursingNote: "NursingWard/DeleteNursingNote",
  createPatientTransferCheck: "NursingWard/CreatetientTransferCheck",
  getPatientTransferChecklist: "NursingWard/GetPatientTransferChecklist",
  deletePatientTransferChecklist: "NursingWard/DeletePatientTransferChecklist",
  getNursing_DischargeNoteAll: "NursingWard/GetNursing_DischargeNoteAll",
  createDiagnosisTreatment: "VitalSign/CreateDiagnosisTreatment",
  getPatientAllergiesDiagnosisAllById:
    "VitalSign/GetPatientAllergiesDiagnosisAllById",
  deleteDiagnosisTreatment: "VitalSign/DeleteDiagnosisTreatment",
  getAllVitalMaster: "VitalSign/GetAllVitalMaster",
  insertReportNumberFormat: "MachineResultEntry/InsertReportNumberFormat",
  getEquipmentMasterAll: "NursingWard/GetEquipmentMasterAll",
  createNursingNotes: "NursingWard/CreateNursingNotes",
  getNursingNoteById: "NursingWard/GetNursingNoteById",
  getNursingNote: "NursingWard/GetNursingNote",
  deleteNursingNote: "NursingWard/DeleteNursingNote",
  createPatientTransferCheck: "NursingWard/CreatetientTransferCheck",
  getPatientTransferChecklist: "NursingWard/GetPatientTransferChecklist",
  deletePatientTransferChecklist: "NursingWard/DeletePatientTransferChecklist",
  getNursing_DischargeNoteAll: "NursingWard/GetNursing_DischargeNoteAll",
  saveAntibioticChart: "Emergency/SaveAntibioticChart",
  getListOfAntibioticChart: "Emergency/GetListOfAntibioticChart",
  updateAntibioticChart: "Emergency/UpdateAntibioticChart",
  antibioticReportPrint: "NursingWard/AntibioticReportPrint",
  bindAllergyList: "Emergency/BindAllergyList",
  bindAdmitToWard: "Emergency/BindAdmitToWard",
  saveOrUpdateAllergy: "Emergency/SaveOrUpdateAllergy",
  saveAandETriageRecord: "Emergency/SaveAandETriageRecord",
  getListOfAandETriage: "Emergency/GetListOfAandETriage",
  AETriageReport: "Emergency/AETriageReport",
  getDiagnosisByPatientId: "Emergency/GetDiagnosisByPatientId",
  saveFetalDisposal: "Emergency/SaveFetalDisposal",
  getFetalDisposalDetails: "Emergency/GetFetalDisposalDetails",
  saveOrUpdateHandHygineAudit: "Emergency/SaveOrUpdateHandHygineAudit",
  getHandHygieneAuditDetails: "Emergency/GetHandHygieneAuditDetails",
  saveOrUpdateInPatientFallsAssessmentAndPrecaution:
    "Emergency/SaveOrUpdateInPatientFallsAssessmentAndPrecaution",
  getInPatientFallsAssessment:
    "Emergency/GetInPatientFallsAssessmentAndPrecautionDetails",
  InPatientFallsAssessmentAndPrecautionReport:
    "Emergency/InPatientFallsAssessmentAndPrecautionReport",
  saveInTakeOutTakeChart: "Emergency/SaveInTakeOutTakeChart",
  getIntakeOutputDetails: "Emergency/GetIntakeOutputDetails",
  deleteIntakeOutputById: "Emergency/DeleteIntakeOutputById",
  searchIntakeOutputDetails: "Emergency/SearchIntakeOutputDetails",
  saveOrUpdateMedicalCare: "Emergency/SaveOrUpdateMedicalCare",
  getMedicalCareCheckListByPId: "Emergency/GetMedicalCareCheckListByPId",
  medicalCareCheckListReport: "Emergency/MedicalCareCheckListReport",
  saveOrUpdatePainManagement: "Emergency/SaveOrUpdatePainManagement",
  getPainManagementList: "Emergency/GetPainManagementList",
  saveOrUpdatePressureSore: "Emergency/SaveOrUpdatePressureSore",
  getPressureSoreList: "Emergency/GetPressureSoreList",
  saveOrUpdatePhysicalExam: "Emergency/SaveOrUpdatePhysicalExam",
  getPhysicalExamList: "Emergency/GetPhysicalExamList",
  saveOrUpdateReferral: "Emergency/SaveOrUpdateReferral",
  getReferralList: "Emergency/GetReferralList",
  saveOrUpdateLeavingAgainstMedicalAdvice:
    "Emergency/SaveOrUpdateLeavingAgainstMedicalAdvice",
  getLeavingAgainstMedicalAdviceList:
    "Emergency/GetLeavingAgainstMedicalAdviceList",
  saveOrUpdateNutritionAssessment:
    "EmergencyBilling/SaveOrUpdateNutritionAssessment",
  getNutritionAssessment: "EmergencyBilling/GetNutritionAssessment",
  saveOrUpdateBloodTransfusionReactionWorkUp:
    "EmergencyBilling/SaveOrUpdateBloodTransfusionReactionWorkUp",
  getAdverseEvents: "EmergencyBilling/GetAdverseEvents",
  getUndesirableEffects: "EmergencyBilling/GetUndesirableEffects",
  getApprovedByCenterId: "EmergencyBilling/GetApprovedByCenterId",
  getBloodTransfusionReaction: "EmergencyBilling/GetBloodTransfusionReaction",
  SaveOrUpdateBloodResultsOfWorkUp:
    "EmergencyBilling/SaveOrUpdateBloodTransfusionReactionResultsOfWorkUp",
  updateEmergencyBillItems: "EmergencyBilling/UpdateEmergencyBillItems",
  getTriagingCodes: "EmergencyAdmission/GetTriagingCodes",
  saveTriaging: "EmergencyAdmission/SaveTriaging",
  releaseEmergencyPatient: "EmergencyBilling/ReleaseEmergencyPatient",
  savePrimaryDoctor: "EmergencyBilling/SavePrimaryDoctor",
  getMedicResidanceCenterWise: "EmergencyBilling/GetMedicResidanceCenterWise",
  saveMedicResidenceDoctor: "EmergencyBilling/SaveMedicResidenceDoctor",
  generateOrCloseBillOfEmergency:
    "EmergencyBilling/GenerateOrCloseBillOfEmergency",
  getWaitingType: "EmergencyBilling/GetWaitingType",
  SaveWaitingType: "EmergencyBilling/SaveWaitingType",
  getremarks: "Emergency/getEmgAdmissionRemark",
  getLabToPrintNew: "Emergency/getLabToPrintNew",
  getFlowSheet: "EmergencyBilling/GetFlowSheet",
  getMedicineRequest: "EmergencyBilling/GetMedicineRequest",
  saveOrUpdateBrainDeathDiagnosis:
    "NursingWard/SaveOrUpdateBrainDeathDiagnosis",
  getBrainDeathDiagnosis: "NursingWard/GetBrainDeathDiagnosis",
  saveOrUpdateChemotherapyTreatmentSheet:
    "NursingWard/SaveOrUpdateChemotherapyTreatmentSheet",
  getChemotherapyTreatmentSheet: "NursingWard/GetChemotherapyTreatmentSheet",
  saveOrUpdateAdvancedDirective: "NursingWard/SaveOrUpdateAdvancedDirective",
  getAdvancedDirectiveFullDetails:
    "NursingWard/GetAdvancedDirectiveFullDetails",
  getAllFieldsValueOfChecklistForRenalTransplant:
    "NursingWard/GetAllFieldsValueOfChecklistForRenalTransplant",
  saveOrUpdateRenalTransplantChecklist:
    "NursingWard/SaveOrUpdateRenalTransplantChecklist",
  getRenalTransplantChecklist: "NursingWard/GetRenalTransplantChecklist",
  saveOrUpdateIntesiveCareUnitApache:
    "NursingWard/SaveOrUpdateIntesiveCareUnitApache",
  getIntesiveCareUnitApache: "NursingWard/GetIntesiveCareUnitApache",
  saveOrUpdateDonorEvaluation: "NursingWard/SaveOrUpdateDonorEvaluation",
  getDonorEvaluation: "NursingWard/GetDonorEvaluation",
  saveOrUpdateDonorEvaluationTransplant:
    "NursingWard/SaveOrUpdateDonorEvaluationTransplant",
  getDonorEvaluationTransplant: "NursingWard/GetDonorEvaluationTransplant",
  saveOrUpdateOncologyTreatmentRecord:
    "NursingWard/SaveOrUpdateOncologyTreatmentRecord",
  getOncologyTreatmentRecord:
    "NursingWard/GetOncologyTreatmentRecordWithObservations",
  saveOrUpdateMedicoLegalRegister:
    "NursingWard/SaveOrUpdateMedicoLegalRegister",
  getMedicoLegalRegister: "NursingWard/GetMedicoLegalRegister",
  saveHospitalRehabilitationForm: "NursingWard/SaveHospitalRehabilitationForm",
  getHospitalRehabilitationForm: "NursingWard/GetHospitalRehabilitationForm",
  saveOrUpdateHospitalInfectionControl:
    "NursingWard/SaveOrUpdateHospitalInfectionControl",
  getHospitalInfectionControl: "NursingWard/GetHospitalInfectionControl",
  saveOrUpdatePatientFamilyConference:
    "NursingWard/SaveOrUpdatePatientFamilyConference",
  getPatientFamilyConference: "NursingWard/GetPatientFamilyConference",
  saveOrUpdateOfferAndAcceptancePrivateWard:
    "NursingWard/SaveOrUpdateOfferAndAcceptancePrivateWard",
  getOfferAndAcceptancePrivateWard:
    "NursingWard/GetOfferAndAcceptancePrivateWard",
  getAllAdmittedPatient: "NursingWard/GetAllAdmittedPatient",
  getPatientWithoutServiceLast24hours:
    "NursingWard/GetPatientWithoutServiceLast24hours",
  GetIPDVisit: "NursingWard/GetIPDVisitNew",
  PatientMedicineInformation: "MediKredit/PatientMedicineInformation",
  //satish end

  // Karan Start

  // Karan Start
  BindOutSourceLabOutSourceLab: "EDP/LaboratorySetup/BindOutSourceLabList",
  BindColours: "EDP/LaboratorySetup/BindColours",
  SaveSampleContainer: "EDP/LaboratorySetup/SaveSampleContainerMaster",
  BindGridsampleContainer: "EDP/LaboratorySetup/BindSampleContainerMasterList",
  UpdateSampleContainer: "EDP/LaboratorySetup/UpdateSampleContainer",
  BindContainer: "EDP/LaboratorySetup/BindContainer",
  SaveSampleType: "EDP/LaboratorySetup/SaveSampleType",
  BindSampleTypeMasterList: "EDP/LaboratorySetup/BindSampleTypeMasterList",
  BindInvSampleContainer: "Laboratory/BindInvSampleContainer",
  SaveInvSampleContainer: "Laboratory/SaveInvSampleContainer",
  BindSampleTypeMaster: "EDP/LaboratorySetup/BindSampleTypeMaster",
  UpdateSampleType: "EDP/LaboratorySetup/UpdateSampleType",
  DeleteSampleType: "EDP/LaboratorySetup/DeleteSampleType",
  UpdateOutSourceLab: "EDP/LaboratorySetup/UpdateOutSourceLab",
  SaveInvDeliveryDays: "EDP/LaboratorySetup/SaveInvDeliveryDays",
  SaveNewInvestigation: "Laboratory/SaveNewInvestigation",
  GetObservationBindData: "/Laboratory/GetObservationData",
  SaveObservationMap: "Laboratory/SaveObservation",
  // Doctor Management Start

  DoctorReg: "EDP/DoctorSetUp/DoctorReg",

  //  Formula Master Start here

  BindInvestigations: "EDP/LaboratorySetup/BindInvestigations",
  EDPLaboratorySetupBind_InvestigationDepartmentWise:
    "EDP/LaboratorySetup/Bind_InvestigationDepartmentWise",
  LoadObservations: "EDP/LaboratorySetup/LoadObservations",
  formulamasterSaveFormula: "EDP/LaboratorySetup/SaveFormula",
  formulamasterDelete: "EDP/LaboratorySetup/Delete",

  // Doctor Managment Start here
  BindDoctorGroupmanagement: "EDP/DoctorSetUp/BindDoctorGroup",
  GetDocTypeList: "EDP/LaboratorySetup/GetDocTypeList",
  GetNablInvestigations: "EDP/LaboratorySetup/Get_NablInvestigations",
  SaveIsNABLInv: "EDP/LaboratorySetup/SaveIsNABLInv",
  GetDoctorReportData: "EDP/DoctorSetUp/GetDoctorReportData", // for excel
  // Doctor Details Start here

  GetDoctorDetail: "EDP/DoctorSetUp/GetDoctorDetail",
  BindDoctorDetail: "EDP/DoctorSetUp/BindDoctorDetail",
  CommonAPIGetCounty: "CommonAPI/GetCounty",

  // MemberShip Start here
  InsertCardItem: "EDP/MemberShipCardSetUp/InsertCardItem",
  edpMemberShipGetBindData: "EDP/MemberShipCardSetUp/GetBindData",
  UpdatedCardItem: "EDP/MemberShipCardSetUp/UpdatedCardItem",
  GetBindConfig: "/EDP/MemberShipCardSetUp/GetBindConfig",
  GetBindDataCard: "EDP/MemberShipCardSetUp/GetBindDataCard",
  EDPBindOPdPackage: "EDP/MemberShipCardSetUp/BindOPdPackage",
  GetBindItem: "EDP/MemberShipCardSetUp/GetBindItem",

  // Ot Start here
  OTImagesUpload: "OT/OTImagesUpload",
  BindOTImages: "OT/BindOTImages",
  ViewOTImagesURL: "OT/ViewOTImages",
  UpdateOTImages: "OT/UpdateOTImages",
  RemoveOTImages: "OT/RemoveOTImages",
  otPatientSearch: "OT/OldPatientSearch",

  // Donor Regestration Start here
  CityInsert: "BloodBank/CityInsert",
  bloodBankSaveData: "BloodBank/SaveData",
  BindQuestions: "BloodBank/BindQuestions",
  BinddonorBloodGroup: "EDP/BBStock/BindBloodGroup",
  donorBindOrganisation: "EDP/BBStock/BindOrganisation",
  DonorGetCity: "BloodBank/GetCity",
  DonorGetCountry: "CommonAPI/GetCountry",

  //  Blood Collection Start here

  bloodCollectionSearchData: "BloodBank/SearchData",
  SaveCollectionRecord: "BloodBank/SaveCollectionRecord",
  BloodBankSaveRecord: "BloodBank/SaveRecord",
  BloodBankBindQuestions: "BloodBank/BindQuestions",
  BloodBankView: "BloodBank/View",
  BloodBankEstablishedDonorView: "BloodBank/EstablishedDonorView",
  BloodBankTTDApprovalAResult: "BloodBank/TTDApprovalAResult",
  BloodBankTTDApprovalAHistory: "BloodBank/TTDApprovalAHistory",
  EDPBloodBankMasterLoadBloodBag: "EDP/BloodBankMaster/LoadBloodBag",

  // Grouping Start Here
  BloodGroupSerach: "BloodBank/BloodGroupSerach",
  BloodBankSearchRecord: "BloodBank/SearchRecord",
  BloodBankSearch: "BloodBank/Search",
  BloodBankTTDApprovalSerach: "BloodBank/TTDApprovalSerach",
  BloodBankBloodGroupSaveRecord: "BloodBank/BloodGroupSaveRecord",
  BloodBankBloodGroupBindBloodMatch: "BloodBank/BindBloodMatch",
  BloodBankTTDApprovalSave: "BloodBank/TTDApprovalSave",
  BloodBankTTDApprovalFinalReject: "BloodBank/TTDApprovalFinalReject",
  BloodBankBloodRequsteIPdBindDoctor: "BloodBank/BloodRequsteIPd/BindDoctor",
  BloodRequsteIPdLoadCategory: "BloodBank/BloodRequsteIPd/LoadCategory",
  BloodBankBloodRequsteIPdGetItemSubCategory:
    "BloodBank/BloodRequsteIPd/GetItemSubCategoryByCategoryConfigID",
  BloodBankRequsteIPdGetItemRate: "BloodBank/BloodRequsteIPd/GetItemRate",
  BloodBankBloodRequsteIPdTransfus_Reason:
    "BloodBank/BloodRequsteIPd/Transfus_Reason",
  BloodBankRequsteIPdSaveIPDReceipt: "BloodBank/BloodRequsteIPd/SaveIPDReceipt",
  // Karan End

  // Govind Start
  EDPBindDepartmenttableinMaster:
    "EDP/EmployeeSetUp/BindDepartmenttableinMaster",
  chatportAPIGetPatientOPDPrescriptions:
    "ChatportAI/GetPatientOPDPrescriptions",
  EDPMenuSetupRoleInsert: "EDP/MenuSetup/RoleInsert",
  EDPMenuSetupRoleUpdate: "EDP/MenuSetup/RoleUpdate",
  EDPBindDepartmentHead: "EDP/EmployeeSetUp/BindDepartmentHead",
  EDPMenuSetupBindAvailableType: "EDP/MenuSetup/BindAvailableType",
  EDPMenuSetupBindSequenceMenu: "EDP/MenuSetup/BindSequenceMenu",
  EDPMenuSetupBindRightFrame: "EDP/MenuSetup/BindRightFrameData",
  EDPMenuSetupBindMenu: "EDP/MenuSetup/BindMenu",
  EDPMenuSetupBindFrameMenu: "EDP/MenuSetup/BindFrameMenu",
  EDPMenuSetupSaveSequence: "EDP/MenuSetup/SaveSequence",
  EDPBindDocumentMaster: "EDP/EmployeeSetUp/BindDocumentMaster",
  EDPSaveDocumentMaster: "EDP/EmployeeSetUp/SaveDocumentMaster",
  EDPBindDesignationDocumentMap: "EDP/EmployeeSetUp/BindDesignationDocumentMap",
  EDPBindDesignation: "EDP/EmployeeSetUp/BindDesignation",
  EDPBindDocumentForMap: "EDP/EmployeeSetUp/BindDocumentForMap",
  EDPSaveDesigDocMap: "EDP/EmployeeSetUp/SaveDesigDocMap",
  EDPDeleteDocumentMap: "EDP/EmployeeSetUp/DeleteDocumentMap",
  EDPSaveDepartment: "EDP/EmployeeSetUp/SaveDepartment",
  EDPGetDepratmentHeadID: "EDP/EmployeeSetUp/GetDepratmentHeadID",
  EDPGetRole: "EDP/RoleAndDepartmentSetUp/GetRole",
  GetCentreWithPanelGroupMappings:
    "EDP/RoleAndDepartmentSetUp/GetCentreWithPanelGroupMappings",
  BindDepartmentBelong: "EDP/RoleAndDepartmentSetUp/BindDepartmentBelong",
  EDPSaveRoleWiseCentrePanelGroup:
    "EDP/RoleAndDepartmentSetUp/SaveRoleWiseCentrePanelGroup",
  UpdateStatusmark: "MachineResultEntry/UpdateStatusmark",
  EDPSaveDiscountReasonMaster: "EDP/BasicMaster/SaveDiscountReasonMaster",
  AssetBasicMasterSavePro: "Asset/BasicMaster/SavePro",
  EDPBindPro: "Asset/BasicMaster/BindPro",
  EDPBindGrid: "EDP/BasicMaster/BindGrid",
  EDPUpdateDiscountReasonMaster: "EDP/BasicMaster/UpdateDiscountReasonMaster",
  EDPBindMappedProDoctor: "EDP/BasicMaster/BindMappedProDoctor",
  EDPUpdateMappedPRODoctor: "EDP/BasicMaster/UpdateMappedPRODoctor",
  EDPSaveMapPRoToDoctor: "EDP/BasicMaster/SaveMapPRoToDoctor",
  EDPUpdatePRODetail: "EDP/BasicMaster/UpdatePRODetail",
  EDPSearchMessage: "Asset/BasicMaster/SearchMessage",
  EDPSaveMessage: "Asset/BasicMaster/SaveMessage",
  EDPUpdateMessage: "Asset/BasicMaster/UpdateMessage",
  EDPThresholdLimitSave: "EDP/BasicMaster/ThresholdLimitSave",
  EDPThresholdLimitSearch: "EDP/BasicMaster/ThresholdLimitSearch",
  EDPBillCancellationSearch: "EDP/Utilities/BillCancellationSearch",
  EDPCancelAdmitDischargeSearch: "EDP/Utilities/CancelAdmitDischargeSearch",
  EDPCancelAdmitDischargeSave: "EDP/Utilities/CancelAdmitDischargeSave",
  EDPBillCancel: "EDP/Utilities/BillCancel",
  EDPAdmitDischSearch: "EDP/Utilities/AdmitDischSearch",
  EDPBindDischargeType: "EDP/Utilities/BindDischargeType",
  EDPAdmitDischUpdate: "EDP/Utilities/AdmitDischUpdate",
  EDPBindProcessStep: "EDP/Utilities/BindProcessStep",
  EDPUpdateProcessStep: "EDP/Utilities/UpdateProcessStep",
  EDPPaymentSearch: "EDP/Utilities/PaymentSearch",
  EDPBindPaymentMode: "EDP/Utilities/BindPaymentMode",
  EDPSavePaymentMode: "EDP/Utilities/SavePaymentMode",
  EDPLoadPanel: "EDP/PanelSetUp/LoadPanel",
  EDPLoadDocument: "EDP/PanelSetUp/LoadDocument",
  EDPSaveDoc: "EDP/PanelSetUp/SaveDoc",
  EDPUpdatePanelForDocuments: "EDP/PanelSetUp/UpdatePanelForDocuments",
  EDPSavePanelDoc: "EDP/PanelSetUp/SavePanelDoc",
  EDPSavePanelDocument: "EDP/PanelSetUp/SavePanelDocument",
  EDPLoadDocumentDetail: "EDP/PanelSetUp/LoadDocumentDetail",
  EDPEmailBindTemplate: "EDP/EmailSetUp/EmailBindTemplate",
  EDPBindEmailId: "EDP/EmailSetUp/BindEmailId",
  EDPEmailTemplateType: "EDP/EmailSetUp/EmailTemplatetype",
  EDPBindColumnField: "EDP/EmailSetUp/BindColumnField",
  EDPBindEmailDetails: "EDP/EmailSetUp/BindEmailDetails",
  EDPBindPanel: "EDP/EmailSetUp/BindPanel",
  EDPBindRole: "EDP/EmailSetUp/BindRole",
  EDPCreateOT: "EDP/OTMaster/CreateOT",
  EDPGetExitingOT: "EDP/OTMaster/GetExitingOT",
  PrintIntraOPVita: "EDP/OTMaster/PrintIntraOPVita",
  EDPSaveDoctorSlotAllocations: "EDP/OTMaster/SaveDoctorSlotAllocations",
  EDPGetDoctorBookedSlots: "EDP/OTMaster/GetDoctorBookedSlots",
  EDPGetOTs: "EDP/OTMaster/GetOTs",
  EDPBindDocDepartment: "EDP/DoctorSetUp/BindDocDepartment",
  EDPDoctorSetupSaveDoc: "EDP/DoctorSetUp/SaveDocDepartment",
  EDPUpdateDocDepartment: "EDP/DoctorSetUp/UpdateDocDepartment",
  OTGetOTSlots: "OT/GetOTSlots",
  EDPSaveRefDoc: "EDP/DoctorSetUp/SaveRefDoc",
  EDPLoadRefDoc: "EDP/DoctorSetUp/LoadRefDoc",
  EDPUpdateRefDoc: "EDP/DoctorSetUp/UpdateRefDoc",
  EDPBindOPdPackage: "EDP/MemberShipCardSetUp/BindOPdPackage",
  EDPGetBindItem: "EDP/MemberShipCardSetUp/GetBindItem",
  EDPSaveData: "EDP/MemberShipCardSetUp/SaveData",
  EDPSaveItemData: "EDP/MemberShipCardSetUp/SaveItemData",

  EDPBindPkgCategory: "EDP/ServicesSetup/BindPkgCategory",
  EDPBindPkgSubCategory: "EDP/ServicesSetup/BindPkgSubCategory",
  EDPBindIPDPackageMaster: "EDP/ServicesSetup/BindIPDPackageMaster",
  EDPLoadPanelCompany: "EDP/ServicesSetup/LoadPanelCompany",
  EDPLoadRoomType: "EDP/ServicesSetup/LoadRoomType",
  EDPBindAllCategory: "EDP/ServicesSetup/BindAllCategory",
  EDPBindAllSubCategory: "EDP/ServicesSetup/BindAllSubCategory",
  EDPSavePackage: "EDP/ServicesSetup/SavePackage",
  EDPBindPackageDetails: "EDP/ServicesSetup/BindPackageDetails",
  EDPGetStateByCountryID: "EDP/LocationMaster/GetStateByCountryID",
  EDPDeleteState: "EDP/LocationMaster/DeleteState",
  EDPGetDistrictByCountryAndStateID:
    "EDP/LocationMaster/GetDistrictByCountryAndStateID",
  EDPInsertState: "EDP/LocationMaster/InsertState",
  EDPDistrictInsert: "EDP/LocationMaster/DistrictInsert",
  EDPDeleteDistrict: "EDP/LocationMaster/DeleteDistrict",
  EDPUpdateDistrict: "EDP/LocationMaster/UpdateDistrict",
  EDPUpdateState: "EDP/LocationMaster/UpdateState",
  EDPGetCityByCountryStateDistrictID:
    "EDP/LocationMaster/GetCityByCountryStateDistrictID",
  EDPBindEmployee: "EDP/UserRightsSetup/BindEmployee",
  EDPApprDisMastSave: "EDP/UserRightsSetup/ApprDisMastSave",
  EDPPurchaseMangeApprBindEmployee:
    "EDP/UserRightsSetup/PurchaseMangeApprBindEmployee",
  EDPPurchaseMangeApprBindListTable:
    "EDP/UserRightsSetup/PurchaseMangeApprBindListTable",
  EDPPurchaseMangeApprDelete: "EDP/UserRightsSetup/PurchaseMangeApprDelete",
  EDPPurchaseMangeApprSave: "EDP/UserRightsSetup/PurchaseMangeApprSave",
  EDPuserRightsLoadEmployee: "EDP/UserRightsSetup/LoadEmployee",
  EDPIPDBillGenBindEmployee: "EDP/UserRightsSetup/IPDBillGenBindEmployee",
  EDPSaveBillAuthorized: "EDP/UserRightsSetup/SaveBillAuthorized",
  OTBindLastUpdateddetail: "OT/BindLastUpdateddetail",
  OTBindCancelled: "OT/BindCancelled",
  OTBindMedicine: "OT/BindMedicine",
  OTBindPrep: "OT/BindPrep",
  OTBindBelong: "OT/BindBelong",
  OTBindRoom: "OT/BindRoom",
  OTOPFlowSheetSave: "OT/OPFlowSheetSave",
  OTBindFlowSheetGrid: "OT/BindFlowSheetGrid",
  OTLoadTemplates: "OT/LoadTemplates",
  OTOPProcedureTemplateSave: "OT/OPProcedureTemplateSave",
  OTOPProcedureTemplateUpdate: "OT/OPProcedureTemplateUpdate",
  OTOPProcedureFillGrid: "OT/OPProcedureFillGrid",
  OTAEdit: "OT/AEdit",
  OTADelete: "OT/ADelete",
  OTCountSheetSave: "OT/CountSheetSave",
  OTCountSheetSearch: "OT/CountSheetSearch",
  OTPostAnesthesiaOrderSave: "OT/PostAnesthesiaOrderSave",
  OTGetPostAnesthesiaMonitoring: "OT/GetPostAnesthesiaMonitoring",
  GetPostAnesthesiaOrder: "OT/GetPostAnesthesiaOrder",
  FinancePrintSearchVoucher: "Finance/PrintSearchVoucher",
  GetConfigurationURL: "Finance/GetConfiguration",
  UpdateConfigurationURL: "Finance/UpdateConfiguration",
  BindCollectionConfigurationDataURL: "Finance/BindCollectionConfigurationData",
  BindAssetMappingScreenDataURL: "Finance/BindAssetMappingScreenData",
  SaveConfigurationURL: "Finance/SaveConfiguration",
  SearchAssetMappingURL: "Finance/SearchAssetMapping",
  PrintAssetMappingURL: "Finance/PrintAssetMapping",
  SaveAssetMappingURL: "Finance/SaveAssetMapping",

  // ot notes

  OTNotesSave: "OT/OTNotesSave",
  OTGetBookingTAT: "OT/GetBookingTAT",
  BindCirculatingNurse: "OT/BindCirculatingNurse",
  BindAnesthetist: "OT/BindAnesthetist",
  SavepreopinstructionURL: "OT/Savepreopinstruction",
  getpreopinstructionURL: "OT/Getpreopresultdetails",
  editpreopresultdetailsURL: "OT/editpreopresultdetails",
  LoadAllOTItemURL: "OT/LoadAllItem",
  RemovegetpreopURL: "OT/Removegetpreop",
  SaveOTPACURL: "OT/SavePAC",
  UpdatePACURL: "OT/UpdatePAC",
  GetpacresultdetailsURL: "OT/Getpacresultdetails",
  EditpacresultdetailURL: "OT/Editpacresultdetails",
  RemovepacURL: "OT/Removepac",
  OTEditSurgerySafety: "OT/EditSurgerySafety",
  OTGetSurgerySafety: "OT/GetSurgerySafety",
  OTRemove: "OT/Remove",
  OTSaveSurgerySafety: "OT/SaveSurgerySafety",
  UpdateSurgerySafety: "OT/UpdateSurgerySafety",
  PrintSurgerySafety: "OT/PrintSurgerySafety",

  // anesthesia notes
  OTGetpreopresultdetails: "OT/Getpreopresultdetails",
  OTBindAnesthetist: "OT/BindAnesthetist",
  OTBindCirculatingNurse: "OT/BindCirculatingNurse",
  OTSaveSurgerySafety: "OT/SaveSurgerySafety",

  //---Mortuary----

  MortuaryGetSerachDeathPerson: "Mortuary/GetSerachDeathPerson",
  MortuarygetReligion: "Mortuary/GetReligion",
  MortuaryGetLocality: "Mortuary/GetLocality",
  MortuaryBindRelation: "Mortuary/BindRelation",
  MortuaryBindPatientType: "Mortuary/BindPatientType",
  MortuaryBindFreezerList: "Mortuary/BindFreezerList",
  serachReceivedCorpse: "Mortuary/SerachReceivedCorpse",
  SearchCorpse: "Mortuary/SearchCorpse",

  // ----BBStock View-----
  EDPBBStockSearch: "EDP/BBStock/Search",
  EDPBBStockViewDetail: "EDP/BBStock/ViewDetail",

  // ---Question Master---
  EDPToolQuestionMasterSaveQuestion: "EDP/ToolQuestionMaster/SaveQuestion",
  EDPToolQuestionMasterUpdateQuestion: "EDP/ToolQuestionMaster/UpdateQuestion",
  EDPToolQuestionValidateQuestion: "EDP/ToolQuestionMaster/ValidateQuestion",
  EDPToolQuestionMasterBindData: "EDP/ToolQuestionMaster/BindData",

  // ---Patient Process---
  BloodBankSearchBloodCollection:
    "BloodBank/PatientProcess/SearchBloodCollection",
  BloodBankSaveCollectionRecordBG:
    "BloodBank/PatientProcess/SaveCollectionRecordBG",
  BloodBankSearchBGABO: "BloodBank/PatientProcess/SearchBGABO",
  BloodBankSaveRecordABO: "BloodBank/PatientProcess/SaveRecordABO",
  BloodBankSearchGroup: "BloodBank/PatientProcess/SearchGroup",
  BloodBankPatientapprove: "BloodBank/PatientProcess/Patientapprove",
  RemarkData: "BloodBank/PatientProcess/RemarkData",
  BloodBankSearchPatient: "BloodBank/PatientProcess/SearchPatient",
  BloodBankSaveScreening: "BloodBank/PatientProcess/SaveScreening",
  BloodBankUpdateScreening: "BloodBank/PatientProcess/UpdateScreening",
  BloodBankCheckPatientValidTime:
    "BloodBank/PatientProcess/CheckPatientValidTime",
  PatientProcessSearchPatientMatch:
    "BloodBank/PatientProcess/SearchPatientMatch",
  PatientProcessBindBag: "BloodBank/PatientProcess/BindBag",
  BloodBankPatientProcessCheckPatientValidTimeMatch:
    "BloodBank/PatientProcess/CheckPatientValidTimeMatch",
  BloodBankPatientProcessGetExpiryDate:
    "BloodBank/PatientProcess/GetExpiryDate",
  BloodBankPatientProcessUpdateBloodCrossmatch:
    "BloodBank/PatientProcess/UpdateBloodCrossmatch",
  BloodBankPatientProcessSaveCrossBlood:
    "BloodBank/PatientProcess/SaveCrossBlood",
  BloodBankComponentSearch: "BloodBank/ComponentSearch",
  BloodBankComponentAResult: "BloodBank/ComponentAResult",
  BloodBankComponentSave: "BloodBank/ComponentSave",
  BloodBankPostStockSearch: "BloodBank/PostStockSearch",
  BloodBankPostStockASelect: "BloodBank/PostStockASelect",
  BloodBankPostStockSave: "BloodBank/PostStockSave",
  BloodBankDiscardStockSearch: "BloodBank/DiscardStockSearch",
  BloodBankDiscardBloodSave: "BloodBank/DiscardBloodSave",
  BloodBankSearchBloodRquest: "BloodBank/PatientProcess/SearchBloodRquest",
  BloodBankPatientProcessSearchListBR: "BloodBank/PatientProcess/SearchListBR",
  BloodBankPatientProcesssearch1BR: "BloodBank/PatientProcess/search1BR",
  BloodBankPatientProcessGetMatchABO: "BloodBank/PatientProcess/GetMatchABO",
  BloodBankPatientProcessGetmatchMABO: "BloodBank/PatientProcess/GetmatchMABO",
  BloodBankPatientProcessGetMatch1ABO: "BloodBank/PatientProcess/GetMatch1ABO",
  BloodBankPatientProcessBloodIssueBI: "BloodBank/PatientProcess/BloodIssueBI",
  BloodBankPatientProcessSaveBloodRquest:
    "BloodBank/PatientProcess/SaveBloodRquest",
  BloodBankPatientProcessSearchHoldIssue:
    "BloodBank/PatientProcess/SearchHoldIssue",
  BloodBankPatientProcessSearchListHoldIssue:
    "BloodBank/PatientProcess/SearchListHoldIssue",
  BloodBankPatientProcessSearchBloodReturn:
    "BloodBank/PatientProcess/SearchBloodReturn",
  BloodBankPatientProcessSearchListBloodReturn:
    "BloodBank/PatientProcess/SearchListBloodReturn",
  BloodBankBloodBanksToolsSaveQuestion:
    "BloodBank/BloodBanksTools/SaveQuestion",
  BloodBankBloodBanksToolsDeleteQuestion:
    "BloodBank/BloodBanksTools/DeleteQuestion",
  BloodBankBloodBanksToolsUpdateQuestion:
    "BloodBank/BloodBanksTools/UpdateQuestion",
  BloodBankBloodBanksToolsBindQuestionData:
    "BloodBank/BloodBanksTools/BindQuestionData",
  BloodBanksToolsGetOrganisationIssueSummary:
    "BloodBank/BloodBanksTools/GetOrganisationIssueSummary",
  BloodBanksToolsGetBagStockDetail:
    "BloodBank/BloodBanksTools/GetBagStockDetail",
  BloodBanksToolsPrintIssueReceipttoOrganisation:
    "BloodBank/BloodBanksTools/PrintIssueReceipttoOrganisation",
  BloodBanksToolsSaveBulkIssueOrganisation:
    "BloodBank/BloodBanksTools/SaveBulkIssueOrganisation",
  BloodBanksToolsSearchBarcodeType:
    "BloodBank/BloodBanksTools/SearchBarcodeType",
  BloodBankToolPrintBarcode: "BloodBank/BloodBanksTools/PrintBarcode",
  BloodBanksToolsPrintDonorRegistrationForm:
    "BloodBank/BloodBanksTools/PrintDonorRegistrationForm",
  BloodBanksToolsSearchCompatibilitySticker:
    "BloodBank/BloodBanksTools/SearchCompatibilitySticker",
  BloodBanksToolsPrintCompatibilitySticker:
    "BloodBank/BloodBanksTools/PrintCompatibilitySticker",
  BloodBanksToolsSearchDonorRegistrationReprint:
    "BloodBank/BloodBanksTools/SearchDonorRegistrationReprint",
  BloodBanksPrintIssueReceipttoOrgPDF:
    "BloodBank/BloodBanksTools/PrintIssueReceipttoOrganisationPDF",

  //------BLOOD BANK REPORT------
  BloodBankBloodBankReportBloodGroupingSearch:
    "BloodBank/BloodBankReport/BloodGroupingSearch",
  BloodBankBloodBankReportBloodGroupingReport:
    "BloodBank/BloodBankReport/BloodGroupingReport",
  BloodBankBloodBankReportDiscardBloodReport:
    "BloodBank/BloodBankReport/DiscardBloodSearchReport",
  BloodBankBloodBankReportBloodCollectionSearch:
    "BloodBank/BloodBankReport/BloodCollectionSearch",
  BloodBankBloodBankReportBloodCollectionReport:
    "BloodBank/BloodBankReport/BloodCollectionReport",
  BloodBankBloodBankReportDonorProcessBloodReport:
    "BloodBank/BloodBankReport/DonorProcessSearchReport",
  BloodBankBloodBankReportDonorProcessSearch:
    "BloodBank/BloodBankReport/DonorProcessSearch",
  BloodBankBloodBankReportBloodCrossMatchReport:
    "BloodBank/BloodBankReport/BloodCrossMatchReport",
  BloodBankBloodBankReportBloodCurrentStockSearch:
    "BloodBank/BloodBankReport/BloodCurrentStockSearch",
  BloodBankBloodBankReportBloodCurrentStockReport:
    "BloodBank/BloodBankReport/BloodCurrentStockReport",
  BloodBankBloodBankReportComponentDetailSearch:
    "BloodBank/BloodBankReport/ComponentDetailSearch",
  BloodBankBloodBankReportComponentDetailReport:
    "BloodBank/BloodBankReport/ComponentDetailReport",
  BloodBankBloodBankReportDiscardBloodSearch:
    "BloodBank/BloodBankReport/DiscardBloodSearch",
  AIReportsAIClientLedgerPrint: "AIReports/AIClientLedgerPrint",
  AIClientQuestionMasterInsert: "AIReports/AIClientQuestionMasterInsert",
  QuestionAllowPermissionURL: "AIReports/AIClientUpdatePatientAccess",
  RazorPayOrderURL: "RazorPay/Order",
  MasterPageSetDefaultRole: "MasterPage/SetDefaultRole",
  StoreItemMasterGetDrugCategoryMaster: "StoreItemMaster/GetDrugCategoryMaster",
  StoreItemMasterSaveDrugCategoryMaster:
    "StoreItemMaster/SaveDrugCategoryMaster",
  NursingWardPrintNurNote: "NursingWard/PrintNurNote",
  NursingWardDeceasedSavePrint: "NursingWard/DeceasedPrint",
  EDPLaboratorySetupSaveAnatomic: "EDP/LaboratorySetup/SaveAnatomic",
  EDPLaboratorySetupBindAnatomic: "EDP/LaboratorySetup/BindAnatomic",
  GetSubCategoryByCategoryRequistion: "Requisition/GetSubCategoryByCategory",
  QuotationAndCompareGetQuotationApproval:
    "QuotationAndCompare/GetQuotationApproval",
  QuotationAndCompareApprovedQuotation: "QuotationAndCompare/ApprovedQuotation",
  QuotationAndCompareRejectQuotation: "QuotationAndCompare/RejectQuotation",
  ViewPurchaseOrderBindItem: "ViewPurchaseOrder/BindItem",
  StoreItemMasterSavePOCategoryMaster: "StoreItemMaster/SavePOCategoryMaster",
  StoreItemMasterGetPOCategoryMaster: "StoreItemMaster/GetPOCategoryMaster",
  RequisitionGetDepartmetItemsToReturn: "Requisition/GetDepartmetItemsToReturn",
  ViewPurchaseOrderServiceSearchPO: "ViewPurchaseOrder/BindServicePO",
  ViewPurchaseOrderBindPoDetails: "ViewPurchaseOrder/BindPoDetails",
  ViewPurchaseOrderServiceOrderClose: "ViewPurchaseOrder/ServiceOrderClose",
  PharmacyInsertPharmacyMarkupMaster: "Pharmacy/InsertPharmacyMarkupMaster",
  PharmacyGetMarkupMaster: "Pharmacy/GetMarkupMaster",
  PharmacyRemoveMarkupMaster: "Pharmacy/RemoveMarkupMaster",
  DirectDepartmentIssueSearchCentreReceive:
    "DirectDepartmentIssue/SearchCentreReceive",
  DirectDepartmentIssueSaveCentreStock: "DirectDepartmentIssue/SaveCentreStock",
  DepartmentRequisitionSearchReceive:
    "DirectDepartmentIssue/SearchDepartmentReceive",
  DepartmentRequisitionSaveReceive: "DirectDepartmentIssue/SaveDepartmentReceive",
  DepartmentRequisitionNotReceive: "DirectDepartmentIssue/NotReceiveDepartment",
  OrderCloseGetOrderDetailsURL: "PurchaseOrderApproval/GetOrderDetails",
  OrderCloseSavePoCloseURL: "PurchaseOrderApproval/SavePoClose",
  // Force Close of a partly received PO: cancels what has no GRN, closes the PO, returns the cancellation printout.
  PurchaseOrderForceClose: "PurchaseOrderApproval/ForceClosePO",
  PurchaseOrderCancellationPrint: "PurchaseOrderApproval/GetPOCancellationPrint",
  // Purchase Order Close, old format (global resource POCloseOldFormat = 1)
  PurchaseOrderDepartments: "PurchaseOrderApproval/GetPODepartments",
  POEditSearch: "PurchaseOrderApproval/GetPOEditSearch",
  POEditItems: "PurchaseOrderApproval/GetPOEditItems",
  POEditUpdateItems: "PurchaseOrderApproval/UpdatePOEditItems",
  POEditSign: "PurchaseOrderApproval/GetPOEditSign",
  POEditUpdateSign: "PurchaseOrderApproval/UpdatePOEditSign",
  PurchaseOrderSearchReport:"PurchaseOrderApproval/GetPOSearchReport",
  PurchaseOrderCloseItems: "PurchaseOrderApproval/GetPOCloseItems",
  PurchaseOrderCloseSaveOld: "PurchaseOrderApproval/SavePOCloseOld",
  PurchaseOrderSearchCancelled: "PurchaseOrderApproval/SearchCancelledPOs",
  ConsignmentReturnConsignmentReturnSearchItem:
    "ConsignmentReturn/ConsignmentReturnSearchItem",
  ViewPurchaseOrderBindPoClosedDetails: "ViewPurchaseOrder/BindPoClosedDetails",
  ViewPurchaseOrderBindFinanceCOA: "ViewPurchaseOrder/BindFinanceCOA",
  ViewPurchaseOrderUpdateInvoiceNo: "ViewPurchaseOrder/UpdateInvoiceNo",
  ViewPurchaseOrderUpdateCOADept: "ViewPurchaseOrder/UpdateCOADept",
  ViewPurchaseOrderSearchClosedPoForApprove:
    "ViewPurchaseOrder/SearchClosedPoForApprove",
  ViewPurchaseOrderSaveApproveClosedPo: "ViewPurchaseOrder/SaveApproveClosedPo",
  IssueConsignmentmedicineItemSearch: "IssueConsignment/medicineItemSearch",
  IssueConsignmentBindConsignmentPatient:
    "IssueConsignment/BindConsignmentPatient",
  IssueConsignmentIssueConsignmentdetail:
    "IssueConsignment/IssueConsignmentdetail",
  CreatePurchaseOrderPurchaseOrderSendForApproval:
    "CreatePurchaseOrder/PurchaseOrderSendForApproval",
  HISConsumeDeptMappingBindHISConsumeDeptMappingScreenData:
    "Finance/BindHISConsumeDeptMappingScreenData",
  HISConsumeDeptMappingBindHISConsumeDeptMappedUnMappedData:
    "Finance/BindHISConsumeDeptMappedUnMappedData",
  FinanceSaveSelectedItemRightHISConsumeDeptMapping:
    "Finance/SaveSelectedItemRightHISConsumeDeptMapping",
  FinanceSaveSelectedItemLeftHISConsumeDeptMapping:
    "Finance/SaveSelectedItemLeftHISConsumeDeptMapping",
  FinanceExportToExcelHISConsumeDeptMapping:
    "Finance/ExportToExcelHISConsumeDeptMapping",
  FinanceExporttoExcelNotMappedDataHISConsumeDeptMapping:
    "Finance/ExporttoExcelNotMappedDataHISConsumeDeptMapping",
  FinanceCopyCentreListHISConsumeDeptMapping:
    "Finance/CopyMappingHISConsumeDeptMapping",

  FinanceBindStockAdjProcessScreenControls:
    "Finance/BindStockAdjProcessScreenControls",
  FinanceSaveStockAdjProcessMapping: "Finance/SaveStockAdjProcessMapping",
  FinanceBindStockAdjProcessMappingData:
    "Finance/BindStockAdjProcessMappingData",
  FinanceChangeStockAdjProcessStatus: "Finance/ChangeStockAdjProcessStatus",
  FinanceCopyStockAdjProcessMapping: "Finance/CopyStockAdjProcessMapping",
  ViewPurchaseOrderBindCOADeptPdf: "ViewPurchaseOrder/BindCOADeptPdf",

  FinanceBindCostOfSaleMappingScreenData:
    "Finance/BindCostOfSaleMappingScreenData",
  FinanceBindCostOfSaleMappedUnMappedData:
    "Finance/BindCostOfSaleMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataBindCostOfSale:
    "Finance/ExporttoExcelNotMappedDataBindCostOfSale",
  FinanceExportToExcelBindCostOfSale: "Finance/ExportToExcelBindCostOfSale",
  FinanceSaveSelectedItemRightBindCostOfSale:
    "Finance/SaveSelectedItemRightBindCostOfSale",
  FinanceSaveSelectedItemLeftBindCostOfSale:
    "Finance/SaveSelectedItemLeftBindCostOfSale",
  FinanceCopyMappingBindCostOfSale: "Finance/CopyMappingBindCostOfSale",

  FinanceFinVHimsMappingScreenData: "Finance/FinVHimsMappingScreenData",
  FinanceFinVHimsMappedUnMappedData: "Finance/FinVHimsMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataFinVHims:
    "Finance/ExporttoExcelNotMappedDataFinVHims",
  FinanceExportToExcelFinVHims: "Finance/ExportToExcelFinVHims",
  FinanceSaveSelectedItemRightFinVHims: "Finance/SaveSelectedItemRightFinVHims",
  FinanceSaveSelectedItemLeftFinVHims: "Finance/SaveSelectedItemLeftFinVHims",
  FinanceCopyMappingItem: "Finance/CopyMappingItem",
  VoucherLimitCopyMappingURL: "Finance/VoucherLimitCopyMapping",

  //prince-item
  FinanceFinVHimsDeptMappingScreenData: "Finance/FinVHimsDeptMappingScreenData",
  FinanceFinVHimsDeptMappedUnMappedData:
    "Finance/FinVHimsDeptMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataFinVHimsDept:
    "Finance/ExporttoExcelNotMappedDataFinVHimsDept",
  FinanceExportToExcelFinVHimsDept: "Finance/ExportToExcelFinVHimsDept",
  FinanceSaveSelectedItemRightFinVHimsDept:
    "Finance/SaveSelectedItemRightFinVHimsDept",
  FinanceSaveSelectedItemLeftFinVHimsDept:
    "Finance/SaveSelectedItemLeftFinVHimsDept",
  FinanceCopyMappingItemDept: "Finance/CopyMappingItemDept",
  FinanceVoucherPrint: "Finance/VoucherPrint",
  FinanceSearchPostingPettyCashEntry: "Finance/SearchPostingPettyCashEntry",
  FinanceSavePettyCashPosting: "Finance/SavePettyCashPosting",
  FinanceSearchPettyCashVoucher: "Finance/SearchPettyCashVoucher",
  FinanceUpdatePettyCashVoucherStatus: "Finance/UpdatePettyCashVoucherStatus",
  bindFinancialYearURL: "Finance/bindFinancialYear",
  CloseBookURL: "Finance/CloseBook",
  bindFinancialURL: "Finance/bindFinancial",
  GrdFinancialYearURL: "Finance/GrdFinancialYear",
  SaveFinancialURL: "Finance/SaveFinancial",
  CloseFinancialYearURL: "Finance/CloseFinancialYear",
  BindFinanceEmployeeURL: "Finance/BindFinanceEmployee",
  BindSICTypeMasterURL: "Finance/BindSICTypeMaster",
  SaveSICAuthorizationURL: "Finance/SaveSICReportTypeAuthorization",
  FinanceSearchForVoucherPrinting: "Finance/SearchForVoucherPrinting",
  FinancePaymentRemittanceAdvicePrint: "Finance/PaymentRemittanceAdvicePrint",
  FinanceChequePrint: "Finance/ChequePrint",
  FinanceBindSICEmployeeAuthorization: "Finance/BindSICEmployeeAuthorization",
  FinanceMonthlyClosureCheck: "Finance/MonthlyClosureCheck",
  FinanceGetSICReports: "Finance/GetSICReports",
  FinanceRunProcSICReport: "Finance/RunProcSICReport",
  FinanceSaveSICApproved: "Finance/SaveSICApproved",
  FinanceApproveSICAllSubHead: "Finance/ApproveSICAllSubHead",

  FinanceSubCategoryMappingMasterScreenData:
    "Finance/SubCategoryMappingMasterScreenData",
  FinanceSubCategoryMappingMasterMappedUnMappedData:
    "Finance/SubCategoryMappingMasterMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataFinVHims:
    "Finance/ExporttoExcelNotMappedDataFinVHims",
  FinanceExportToExcelSubCategoryMappingMaster:
    "Finance/ExportToExcelSubCategoryMappingMaster",
  FinanceSaveSelectedItemRightSubCategoryMappingMaster:
    "Finance/SaveSelectedItemRightSubCategoryMappingMaster",
  FinanceSaveSelectedItemLeftSubCategoryMappingMaster:
    "Finance/SaveSelectedItemLeftSubCategoryMappingMaster",
  FinanceCopyMappingSubCategoryMappingMaster:
    "Finance/CopyMappingSubCategoryMappingMaster",

  FinancePushMaster: "Finance/PushSICMaster",
  FinanceShowApprovalDetails: "Finance/ShowSICApprovalDetails",
  FinanceShowReport: "Finance/ShowSICReport",
  FinanceSaveApproved: "Finance/SaveApproved",
  CommonAPIGetDateTimeNow: "CommonAPI/GetDateTimeNow",

  HISConsumeDeptMappingBindHISConsumeDeptMappingScreenData:
    "Finance/BindHISConsumeDeptMappingScreenData",
  HISConsumeDeptMappingBindHISConsumeDeptMappedUnMappedData:
    "Finance/BindHISConsumeDeptMappedUnMappedData",
  FinanceSaveSelectedItemRightHISConsumeDeptMapping:
    "Finance/SaveSelectedItemRightHISConsumeDeptMapping",
  FinanceSaveSelectedItemLeftHISConsumeDeptMapping:
    "Finance/SaveSelectedItemLeftHISConsumeDeptMapping",
  FinanceExportToExcelHISConsumeDeptMapping:
    "Finance/ExportToExcelHISConsumeDeptMapping",
  FinanceExporttoExcelNotMappedDataHISConsumeDeptMapping:
    "Finance/ExporttoExcelNotMappedDataHISConsumeDeptMapping",
  FinanceCopyCentreListHISConsumeDeptMapping:
    "Finance/CopyMappingHISConsumeDeptMapping",

  FinanceBindStockAdjProcessScreenControls:
    "Finance/BindStockAdjProcessScreenControls",
  FinanceSaveStockAdjProcessMapping: "Finance/SaveStockAdjProcessMapping",
  FinanceBindStockAdjProcessMappingData:
    "Finance/BindStockAdjProcessMappingData",
  FinanceChangeStockAdjProcessStatus: "Finance/ChangeStockAdjProcessStatus",
  FinanceCopyStockAdjProcessMapping: "Finance/CopyStockAdjProcessMapping",
  ViewPurchaseOrderBindCOADeptPdf: "ViewPurchaseOrder/BindCOADeptPdf",

  FinanceBindCostOfSaleMappingScreenData:
    "Finance/BindCostOfSaleMappingScreenData",
  FinanceBindCostOfSaleMappedUnMappedData:
    "Finance/BindCostOfSaleMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataBindCostOfSale:
    "Finance/ExporttoExcelNotMappedDataBindCostOfSale",
  FinanceExportToExcelBindCostOfSale: "Finance/ExportToExcelBindCostOfSale",
  FinanceSaveSelectedItemRightBindCostOfSale:
    "Finance/SaveSelectedItemRightBindCostOfSale",
  FinanceSaveSelectedItemLeftBindCostOfSale:
    "Finance/SaveSelectedItemLeftBindCostOfSale",
  FinanceCopyMappingBindCostOfSale: "Finance/CopyMappingBindCostOfSale",

  FinanceFinVHimsMappingScreenData: "Finance/FinVHimsMappingScreenData",
  FinanceFinVHimsMappedUnMappedData: "Finance/FinVHimsMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataFinVHims:
    "Finance/ExporttoExcelNotMappedDataFinVHims",
  FinanceExportToExcelFinVHims: "Finance/ExportToExcelFinVHims",
  FinanceSaveSelectedItemRightFinVHims: "Finance/SaveSelectedItemRightFinVHims",
  FinanceSaveSelectedItemLeftFinVHims: "Finance/SaveSelectedItemLeftFinVHims",
  FinanceCopyMappingItem: "Finance/CopyMappingItem",
  VoucherLimitCopyMappingURL: "Finance/VoucherLimitCopyMapping",

  //prince-item
  FinanceFinVHimsDeptMappingScreenData: "Finance/FinVHimsDeptMappingScreenData",
  FinanceFinVHimsDeptMappedUnMappedData:
    "Finance/FinVHimsDeptMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataFinVHimsDept:
    "Finance/ExporttoExcelNotMappedDataFinVHimsDept",
  FinanceExportToExcelFinVHimsDept: "Finance/ExportToExcelFinVHimsDept",
  FinanceSaveSelectedItemRightFinVHimsDept:
    "Finance/SaveSelectedItemRightFinVHimsDept",
  FinanceSaveSelectedItemLeftFinVHimsDept:
    "Finance/SaveSelectedItemLeftFinVHimsDept",
  FinanceCopyMappingItemDept: "Finance/CopyMappingItemDept",
  FinanceSearchPostingPettyCashEntry: "Finance/SearchPostingPettyCashEntry",
  FinanceSavePettyCashPosting: "Finance/SavePettyCashPosting",
  FinanceSearchPettyCashVoucher: "Finance/SearchPettyCashVoucher",
  FinanceUpdatePettyCashVoucherStatus: "Finance/UpdatePettyCashVoucherStatus",
  bindFinancialYearURL: "Finance/bindFinancialYear",
  CloseBookURL: "Finance/CloseBook",
  bindFinancialURL: "Finance/bindFinancial",
  GrdFinancialYearURL: "Finance/GrdFinancialYear",
  SaveFinancialURL: "Finance/SaveFinancial",
  CloseFinancialYearURL: "Finance/CloseFinancialYear",
  BindFinanceEmployeeURL: "Finance/BindFinanceEmployee",
  BindSICTypeMasterURL: "Finance/BindSICTypeMaster",
  SaveSICAuthorizationURL: "Finance/SaveSICReportTypeAuthorization",
  FinanceSearchForVoucherPrinting: "Finance/SearchForVoucherPrinting",
  FinancePaymentRemittanceAdvicePrint: "Finance/PaymentRemittanceAdvicePrint",
  FinanceChequePrint: "Finance/ChequePrint",
  FinanceBindSICEmployeeAuthorization: "Finance/BindSICEmployeeAuthorization",
  FinanceMonthlyClosureCheck: "Finance/MonthlyClosureCheck",
  FinanceGetSICReports: "Finance/GetSICReports",
  FinancePushMaster: "Finance/PushMaster",
  FinanceSaveApproved: "Finance/SaveApproved",

  HISConsumeDeptMappingBindHISConsumeDeptMappingScreenData:
    "Finance/BindHISConsumeDeptMappingScreenData",
  HISConsumeDeptMappingBindHISConsumeDeptMappedUnMappedData:
    "Finance/BindHISConsumeDeptMappedUnMappedData",
  FinanceSaveSelectedItemRightHISConsumeDeptMapping:
    "Finance/SaveSelectedItemRightHISConsumeDeptMapping",
  FinanceSaveSelectedItemLeftHISConsumeDeptMapping:
    "Finance/SaveSelectedItemLeftHISConsumeDeptMapping",
  FinanceExportToExcelHISConsumeDeptMapping:
    "Finance/ExportToExcelHISConsumeDeptMapping",
  FinanceExporttoExcelNotMappedDataHISConsumeDeptMapping:
    "Finance/ExporttoExcelNotMappedDataHISConsumeDeptMapping",
  FinanceCopyCentreListHISConsumeDeptMapping:
    "Finance/CopyMappingHISConsumeDeptMapping",
  FinanceBindStockAdjProcessScreenControls:
    "Finance/BindStockAdjProcessScreenControls",
  FinanceSaveStockAdjProcessMapping: "Finance/SaveStockAdjProcessMapping",
  FinanceBindStockAdjProcessMappingData:
    "Finance/BindStockAdjProcessMappingData",
  FinanceChangeStockAdjProcessStatus: "Finance/ChangeStockAdjProcessStatus",
  FinanceCopyStockAdjProcessMapping: "Finance/CopyStockAdjProcessMapping",
  ViewPurchaseOrderBindCOADeptPdf: "ViewPurchaseOrder/BindCOADeptPdf",
  FinanceBindCostOfSaleMappingScreenData:
    "Finance/BindCostOfSaleMappingScreenData",
  FinanceBindCostOfSaleMappedUnMappedData:
    "Finance/BindCostOfSaleMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataBindCostOfSale:
    "Finance/ExporttoExcelNotMappedDataBindCostOfSale",
  FinanceExportToExcelBindCostOfSale: "Finance/ExportToExcelBindCostOfSale",
  FinanceSaveSelectedItemRightBindCostOfSale:
    "Finance/SaveSelectedItemRightBindCostOfSale",
  FinanceSaveSelectedItemLeftBindCostOfSale:
    "Finance/SaveSelectedItemLeftBindCostOfSale",

  FinanceFinVHimsMappingScreenData: "Finance/FinVHimsMappingScreenData",
  FinanceFinVHimsMappedUnMappedData: "Finance/FinVHimsMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataFinVHims:
    "Finance/ExporttoExcelNotMappedDataFinVHims",
  FinanceExportToExcelFinVHims: "Finance/ExportToExcelFinVHims",
  FinanceSaveSelectedItemRightFinVHims: "Finance/SaveSelectedItemRightFinVHims",
  FinanceSaveSelectedItemLeftFinVHims: "Finance/SaveSelectedItemLeftFinVHims",
  FinanceCopyMappingBindCostOfSale: "Finance/CopyMappingBindCostOfSale",
  FinanceBindglobalresources: "Finance/Bindglobalresources",
  FinanceCopyMappingItem: "Finance/CopyMappingItem",
  PhysicalVerifcationUploadDataPV: "PhysicalVerifcation/UploadDataPV",
  PhysicalVerifcationExportStockPVExcel: "PhysicalVerifcation/StockdownloadPV",
  PhysicalVerifcationSavePV: "PhysicalVerifcation/SavePV",
  PhysicalVerifcationBindDepartmentPV: "PhysicalVerifcation/BindDepartmentPV",
  PhysicalVerifcationUpdateStockBalance:
    "PhysicalVerifcation/UpdateStockBalance",
  PhysicalVerifcationBindPhysicalDataPV:
    "PhysicalVerifcation/BindPhysicalDataPVA",
  PhysicalVerifcationViewPhycialVerificationDetail:
    "PhysicalVerifcation/ViewPhycialVerificationDetail",
  PhysicalVerifcationRejectPhysicalApproval:
    "PhysicalVerifcation/RejectPhysicalApproval",
  PhysicalVerifcationSavePhysicalVerificationApproval:
    "PhysicalVerifcation/SavePhysicalVerificationApproval",
  IPDDetailGetPatientAdmissionOrder: "IPDDetail/GetPatientAdmissionOrder",
  PharmacyGetDrugDocument: "Pharmacy/GetDrugDocument",
  PanelRequestRemovePanelRequest: "PanelRequest/RemovePanelRequest",
  PanelRequestApprovalView: "PanelRequest/PanelRequestApprovalView",
  PanelReqquestView: "PanelRequest/PanelRequestView",
  PanelAmountAllocationBindPanelsAllocation:
    "PanelAmountAllocation/BindPanelsAllocation",
  PanelAmountAllocationGetPatientPanelAmountAllocationDetail:
    "PanelAmountAllocation/GetPatientPanelAmountAllocationDetail",
  PanelAmountAllocationSavePanelAmountAllocationDetails:
    "PanelAmountAllocation/SavePanelAmountAllocationDetails",
  AdmitdischargeAdmitDischargeCancelScreenPatient:
    "AdmitdischargeCancel/AdmitDischargeCancelScreenPatient",
  AdmitdischargeBilling_GetPatientForAdmitDiscCancel:
    "AdmitdischargeCancel/Billing_GetPatientForAdmitDiscCancel",
  AdmitdischargeBilling_ForAdmitDiscCancel:
    "AdmitdischargeCancel/Billing_ForAdmitDiscCancel",
  FinanceLoadCentreChartOfAccount: "Finance/LoadCentreChartOfAccount",
  FinanceGetPendingsettleInvoiceSupplierInstallment:
    "Finance/GetPendingsettleInvoiceSupplierInstallment",
  FinanceUpdateInstallmentSupplierInstallment:
    "Finance/UpdateInstallmentSupplierInstallment",
  PhysicalVerifcationDownloadSetLowStockVerification:
    "PhysicalVerifcation/DownloadSetLowStockVerification",
  PhysicalVerifcationSavePVSetLowStockVerification:
    "PhysicalVerifcation/SavePVSetLowStockVerification",
  CreatePurchaseRequestSearchAllIndent: "CreatePurchaseRequest/SearchAllIndent",
  CreatePurchaseRequestSearchIndentDetail:
    "CreatePurchaseRequest/SearchIndentDetail",
  CreatePurchaseRequestSearchIndentItemStockDetail:
    "CreatePurchaseRequest/SearchIndentItemStockDetail",
  PharmacyBindPanelMarkupMaster: "Pharmacy/BindPanelMarkupMaster",
  PharmacyBindSubCategoryMarkupMaster: "Pharmacy/BindSubCategoryMarkupMaster",
  IssueReturnSearchMedicineForDispense: "IssueReturn/SearchMedicineForDispense",
  IssueReturnCheckDispense: "IssueReturn/CheckDispense",
  IssueReturnSaveDispense: "IssueReturn/SaveDispense",
  IssueReturnGetPrescribeMedicines: "IssueReturn/GetPrescribeMedicines",
  IssueReturnPrintPrescribeMedicines: "IssueReturn/PrintPrescribeMedicines",
  CommonRecieptThermal_PDFCommonPrinterOPDThermal:
    "CommonRecieptThermal_PDF/CommonPrinterOPDThermal",
  PanelMasterSavePanelDiscount: "PanelMaster/SavePanelDiscount",
  EDPPanelSetUpGetItems: "EDP/PanelSetUp/GetItems",
  EDPPanelSetUpSaveServiceReduceDetails:
    "EDP/PanelSetUp/saveServiceReduceDetails",
  EDPPanelSetUpSavePanelDiscount: "EDP/PanelSetUp/SavePanelDiscount",
  EDPPanelSetUpcopyPanelDiscount: "EDP/PanelSetUp/copyPanelDiscount",
  EDPPanelSetUpcopyPanelDiscount: "EDP/PanelSetUp/copyPanelDiscount",
  CommonAPIBindPackageOtherDetail: "CommonAPI/BindPackageOtherDetail",
  CommonAPIbindOPDPackageEdit: "CommonAPI/bindOPDPackageEdit",
  CommonAPIbindPackageDocDetail: "CommonAPI/bindOPDPackageDocDetail",
  ServicesSetupLoadAppVisitType: "EDP/ServicesSetup/LoadAppVisitType",
  ServicesSetupLoadDepartment: "EDP/ServicesSetup/LoadDepartment",
  ServicesSetupSavePackageOPD: "EDP/ServicesSetup/SavePackageOPD",
  GetEDPMasterSetupListURL: "CommonAPI/GetEDPMasterSetupList",
  GetEDPMasterSetupStepListURL: "CommonAPI/GetEDPMasterSetupStepList",
  BindPanelIPDURL: "EDP/ServicesRateSetup/LoadPanelIPD",
  BindScheduleChargeURL: "EDP/ServicesRateSetup/BindScheduleCharge",
  EDPDoctorSetUpBindDocDepartmentSpecializationList:
    "EDP/DoctorSetUp/BindDocDepartmentSpecializationList",
  EDPDoctorSetUpBindDocFloor: "EDP/DoctorSetUp/BindDocFloor",
  EDPDoctorSetUpBindDocTimingShift: "EDP/DoctorSetUp/BindDocTimingShift",
  EDPDietMasterGetDeitCommonAPIControls:
    "EDP/DietMaster/GetDeitCommonAPIControls",
  CommonAPIGetCommonAPIControls: "CommonAPI/GetCommonAPIControls",
  EDPDoctorSetUpSaveDoctor: "EDP/DoctorSetUp/SaveDoctor",
  EDPDoctorSetUpBindDoctorDetailList: "EDP/DoctorSetUp/BindDoctorDetailList",
  EDPDoctorSetUpBindDoctorOPDSchedule: "EDP/DoctorSetUp/BindDoctorOPDSchedule",
  EDPDoctorSetUpBindDoctorUnitList: "EDP/DoctorSetUp/BindDoctorUnitList",
  EDPDoctorSetUpBindDoctorRateItems: "EDP/DoctorSetUp/BindDoctorRateItems",
  // Doctor Group master + group rates (flag DoctorGroupRateReview)
  EDPDoctorSetUpBindDoctorGroupList: "EDP/DoctorSetUp/BindDoctorGroupList",
  EDPDoctorSetUpSaveDoctorGroup: "EDP/DoctorSetUp/SaveDoctorGroup",
  EDPDoctorSetUpBindDoctorGroupRate: "EDP/DoctorSetUp/BindDoctorGroupRate",
  EDPDoctorSetUpSaveDoctorGroupRate: "EDP/DoctorSetUp/SaveDoctorGroupRate",
  EDPDoctorSetUpApplyDoctorGroupRateToDoctors:
    "EDP/DoctorSetUp/ApplyDoctorGroupRateToDoctors",
  EDPDoctorSetUpPreviewDoctorGroupRateChange:
    "EDP/DoctorSetUp/PreviewDoctorGroupRateChange",
  EDPDoctorSetUpBindDoctorGroupRateLog: "EDP/DoctorSetUp/BindDoctorGroupRateLog",
  EDPDoctorSetUpBindOPDVisitSubCategory:
    "EDP/DoctorSetUp/BindOPDVisitSubCategory",
  EDPMenuSetupUpdateMenu: "EDP/MenuSetup/UpdateMenu",
  EDPMenuSetupSaveMenuMaster: "EDP/MenuSetup/SaveMenuMaster",
  EDPMenuSetupBindMenuMaster: "EDP/MenuSetup/BindMenuMaster",
  EDPMenuSetupSaveFileMenuMaster: "EDP/MenuSetup/SaveFileMenuMaster",
  EDPMenuSetupBindFileDetailList: "EDP/MenuSetup/BindFileDetailList",
  TransportBindAvailableVehicleList: "Transport/BindAvailableVehicleList",
  TransportOldPatientSearch: "Transport/OldPatientSearch",
  TransportSaveTransportRequest: "Transport/SaveTransportRequest",
  TransportSearchIssueVehicle: "Transport/SearchIssueVehicle",
  TransportAckVehicle: "Transport/BindAckVehicle",
  TransportAckToken: "Transport/AckToken",
  TransportGetBilledPrice: "Transport/GetBilledPrice",
  TransportIssueVehicleDetails: "Transport/IssueVehicle",
  TransportRejectVehicleRequest: "Transport/RejectRequest",
  TransportGetDriverList: "Transport/BindDriverList",
  TransportSaveService: "Transport/saveService",
  TransportSaveFuelEntry: "Transport/saveFuelEntry",
  TransportBindServicingDetail: "Transport/bindServicingDetail",
  TransportBindFuelEntry: "Transport/bindFuelEntry",
  TransportBindVehicle1: "Transport/BindVehicleList",
  TransportUpdateServiceMaintenance: "Transport/UpdateServiceMaintenance",
  TransportUpdateFuelEntry: "Transport/UpdatefuelEntry",
  TransportSearchApproveVehicle: "Transport/SearchVehicleApprovalRequests",
  TransportUpdateApproval: "Transport/ApproveOrRejectVehicle",
  BindVehicleList: "Transport/BindVehicle",
  TransportGetDriverDataList: "Transport/BindDriver",
  TransportBindPurpose: "Transport/BindPurposeList",
  TransportBindTravelingApproval: "Transport/BindApproval",
  TransportSaveTravelingDetail: "Transport/saveTravelingDetail",
  TransportUpdateTravelingDetail: "Transport/updateTravelingDetail",
  TransportBindDetail: "Transport/bindDetail",
  TransportBindStandingOdometer: "Transport/bindStandingOdometer",
  BindOpeningDetail: "Transport/BindOpeningDetail",
  BindClosingDetail: "Transport/BindClosingDetail",
  TransportSavePurpose: "Transport/savePurpose",
  TransportSearchDepartmentRqst: "Transport/SearchDepartmentRqst",
  TransportSearchPatientRqst: "Transport/SearchPatientRqst",
  TransportUpdateRequest: "Transport/updateRequest",
  TransportTokenDetail: "Transport/BindTokenDetail",
  TransportGetVehicleReadingNew: "Transport/GetVehicleReadingNew",
  TransportSaveTransport: "Transport/saveTransport",
  TransportLoadAmbulanceChargesDetail: "Transport/LoadAmbulanceChargesDetail",
  CommonBindRoleDepartment: "CommonAPI/bindRoleDepartment",
  CommonCompareDate: "CommonAPI/CompareDate",
  GenerateTextURL: "AIAssistant/GenerateText",
  GenerateFromFileURL: "AIAssistant/GenerateFromFile",
  GetAISettings: "AISettings/GetAISettings",
  SaveAIFeatures: "AISettings/SaveAIFeatures",
  SaveVertexConfig: "AISettings/SaveVertexConfig",
  ResetVertexConfig: "AISettings/ResetVertexConfig",
  TestVertexConnection: "AISettings/TestVertexConnection",
  CommonAPIGetPatientInformation: "CommonAPI/GetPatientInformation",
  BindVehicleReading: "Transport/BindVehicleReadingNew",
  PrintIssueVehicle: "Transport/PrintIssue",
  AckPrintIssueVehicle: "Transport/AckPrintIssue",
  GetDepartment: "Transport/BindRoleName",

  // Transport Dashboard
  getDashboardKPI: "TransportDashBoard/GetDashboardKPI",
  getDailyTripAnalytics: "TransportDashBoard/GetDailyTripAnalytics",
  getRevenueCollection: "TransportDashBoard/GetRevenueCollection",
  getFuelConsumption: "TransportDashBoard/GetFuelConsumption",
  getVehicleUsage: "TransportDashBoard/GetVehicleUsageGraph",
  getDepartmentWiseRequests: "TransportDashBoard/GetDepartmentWiseRequests",
  getDriverPerformance: "TransportDashBoard/GetDriverPerformance",
  getPeakBookingHours: "TransportDashBoard/GetPeakBookingHours",
  getRequestStatusSplit: "TransportDashBoard/GetRequestStatusSplit",
  getMonthlyTripComparison: "TransportDashBoard/GetMonthlyTripComparison",
  getVehicleServiceStatus: "TransportDashBoard/GetVehicleServiceStatus",
  getLiveActivity: "TransportDashBoard/GetLiveActivity",
  getVehicleStatusList: "TransportDashBoard/vehicle-status",

  //COUPAN
  CoupanInsertCoupan: "Coupan/InsertCoupan",
  CoupanGetCoupan: "Coupan/GetCoupanList",
  CoupanValidateCoupan: "Coupan/ValidateCoupan",

  //FLOWSHEET

  FlowshitBindVitals: "Flowshit/BindVitals",
  FlowshitBindData: "Flowshit/BindData",
  FlowshitBindMedication: "Flowshit/BindMedication",

  // Govind  End

  // Mayank Start
  handleSavePanelCentreURL: "EDP/CentreSetUp/SavesPanelsMappingsDetails",
  SavesEmployeeMappingsDetailsURL:
    "EDP/CentreSetUp/SavesEmployeeMappingsDetails",
  LoadEDPRateItemsURL: "EDP/ServicesRateSetup/LoadItems",
  GetRoleToEditAPI: "EDP/RoleAndDepartmentSetUp/GetRoleToEdit",
  BindLabDeptAPI: "EDP/RoleAndDepartmentSetUp/BindLabDept",
  BindLabDeptAPI: "EDP/RoleAndDepartmentSetUp/BindLabDept",
  SaveRoleToLabAPI: "EDP/RoleAndDepartmentSetUp/SaveRoleToLab",
  SaveMapRoleToLabAPI: "EDP/RoleAndDepartmentSetUp/MapRoleToDeptBelong",
  updateRoleEDPUpdateURL: "EDP/RoleAndDepartmentSetUp/EditRoleById",
  // menu setUp
  MenuSetupBindLoginTypeURL: "EDP/MenuSetup/BindLoginType",
  MenuSetupBindAllMenuURL: "EDP/MenuSetup/BindAllMenu",

  // Panel Setup start
  EDPBindPanelGroupURL: "EDP/PanelSetUp/BindPanelGroup",
  EDPBindPaymentModeURL: "EDP/PanelSetUp/BindPaymentMode",
  EDPBindPanelsURL: "EDP/PanelSetUp/BindPanels",
  EDPBindPanelCurrencyURL: "EDP/ServicesRateSetup/BindPanelCurrency",
  EDPBindCurrencyDetailsURL: "EDP/PanelSetUp/BindCurrencyDetails",
  EDPSavePanelURL: "EDP/PanelSetUp/SavePanel",
  EDPBindPanelDetailsURL: "EDP/PanelSetUp/BindPanelDetails",
  // EDPUpdatePanelURL: "EDP/PanelSetUp/UpdatePanel",
  EDPUpdatePanelURL: "EDP/PanelSetUp/UpdatePanelMaster",
  EDPCategoryMasterURL: "EDP/PanelSetUp/GetCategoryMaster",
  EDPBindPanelsubcatagoryURL: "EDP/PanelSetUp/BindPanelsubcatagory",
  EDPServiceOfferedListURL: "EDP/PanelSetUp/GetItems",
  EDPBindReduceitemdetailsURL: "EDP/PanelSetUp/BindReduceitemdetails",

  // Panel Setup END

  // Blood Bank Start
  EDPLoadBloodBagURL: "EDP/BloodBankMaster/LoadBloodBag",
  EDPLoadBloodComponentURL: "EDP/BloodBankMaster/LoadBloodComponent",
  EDPBindMappedBloodBagURL: "EDP/BloodBankMaster/BindMappedBloodBag",
  EDPDeleteMapBloodBagURL: "EDP/BloodBankMaster/DeleteMapBloodBag",
  EDPSaveMapBloodBagTypeURL: "EDP/BloodBankMaster/SaveMapBloodBagType",
  EDPLoadBagTypeURL: "EDP/BloodBankMaster/LoadBagType",
  EDPSaveBagTypeURL: "EDP/BloodBankMaster/SaveBagType",
  EDPUpdateBagTypeURL: "EDP/BloodBankMaster/UpdateBagType",
  EDPBloodComponmentSearchURL: "EDP/BloodBankMaster/Search",
  EDPSaveBloodComponmentURL: "EDP/BloodBankMaster/SaveBloodComponment",
  EDPUpdateBloodComponmentURL: "EDP/BloodBankMaster/UpdateBloodComponment",
  EDPLoadBloodGroupURL: "EDP/BloodBankMaster/LoadBloodGroup",
  EDPBindMappedBloodGroupURL: "EDP/BloodBankMaster/BindMappedBloodGroup",
  EDPSaveMapBloodGroupURL: "EDP/BloodBankMaster/SaveMapBloodGroup",
  EDPDeleteMapBloodGroupURL: "EDP/BloodBankMaster/DeleteMapBloodGroup",
  EDPBindDataOrganisationURL: "EDP/BloodBankMaster/BindDataOrganisation",
  EDPValidateOrganisationURL: "EDP/BloodBankMaster/ValidateOrganisation",
  EDPSaveOrganisationURL: "EDP/BloodBankMaster/SaveOrganisation",
  EDPBloodBankMasterUpdateOrganisation:
    "EDP/BloodBankMaster/UpdateOrganisation",
  EDPBindComponentNameURL: "EDP/BloodBankMaster/BindComponentName",
  EDPBindBloodBankItemURL: "EDP/BloodBankMaster/BindBloodBankItem",
  EDPSaveItemComponentURL: "EDP/BloodBankMaster/SaveItemComponent",
  EDPBloodBankMasterSaveMethodMaster: "EDP/BloodBankMaster/SaveMethodMaster",
  EDPBloodBankMasterUpdateMethodMaster:
    "EDP/BloodBankMaster/UpdateMethodMaster",
  EDPBloodBankMasterBindMethodMaster: "EDP/BloodBankMaster/BindMethodMaster",
  EDPBloodBankMasterLoadBloodBag: "EDP/BloodBankMaster/LoadBloodBag",

  EDPBloodBankMasterLoadBloodComponent:
    "EDP/BloodBankMaster/LoadBloodComponent",
  EDPBloodBankMasterSaveMapBloodBagType:
    "EDP/BloodBankMaster/SaveMapBloodBagType",
  EDPBloodBankMasterBindMappedBloodBag:
    "EDP/BloodBankMaster/BindMappedBloodBag",
  EDPBloodBankMasterDeleteMapBloodBag: "EDP/BloodBankMaster/DeleteMapBloodBag",
  EDPBloodBankMasterLoadBloodComponent:
    "EDP/BloodBankMaster/LoadBloodComponent",
  EDPBloodBankMasterSaveMapBloodBagType:
    "EDP/BloodBankMaster/SaveMapBloodBagType",
  EDPBloodBankMasterBindMappedBloodBag:
    "EDP/BloodBankMaster/BindMappedBloodBag",
  EDPBloodBankMasterDeleteMapBloodBag: "EDP/BloodBankMaster/DeleteMapBloodBag",

  // bloodbank master start
  EDPBloodBankMasterLoadBloodGroup: "EDP/BloodBankMaster/LoadBloodGroup",
  EDPBloodBankMasterBindBloodComponent:
    "EDP/BloodBankMaster/BindBloodComponent",
  EDPBloodBankMasterSaveBBMinStock: "EDP/BloodBankMaster/SaveBBMinStock",
  BloodBankBindRecord: "BloodBank/BindRecord",
  BloodBankMethodValue: "BloodBank/MethodValue",

  // Package management start
  EDPBindPackageURL: "EDP/ServicesSetup/BindPackage",
  EDPBindSubCategoryURL: "EDP/ServicesSetup/BindSubCategory",
  EDPBindDocSpecializationURL: "EDP/DoctorSetUp/BindDocSpecialization",
  EDPSaveDocSpecializationURL: "EDP/DoctorSetUp/SaveDocSpecialization",
  EDPUpdateDocSpecializationURL: "EDP/DoctorSetUp/UpdateDocSpecialization",
  EDPGetDoctorVisitDetailURL: "EDP/DoctorSetUp/GetDoctorVisitDetail",
  EDPOPDVisitConfigSaveURL: "EDP/DoctorSetUp/OPDVisitConfigSave",
  OPDScheduleDetailsSearch: "EDP/DoctorSetUp/OPDScheduleDetailsSearch",

  // Mayank End

  // Pragya Start
  LoadDepartmentSurgery: "EDP/ServicesSetup/LoadDepartmentSurgery",
  SaveDepartmentSurgery: "EDP/ServicesSetup/SaveDepartmentSurgery",
  SaveSurgeryMaster: "EDP/ServicesSetup/SaveSurgeryMaster",
  LoadSurgery: "EDP/ServicesSetup/LoadSurgery",
  UpdateSurgeryMaster: "EDP/ServicesSetup/UpdateSurgeryMaster",
  SaveBank: "EDP/BasicMaster/SaveBank",
  BindBank: "EDP/BasicMaster/BindBank",
  SaveCountryMaster: "EDP/BasicMaster/SaveCountryMaster",
  LoadCountry: "EDP/BasicMaster/LoadCountry",
  LoadCountryByID: "EDP/BasicMaster/LoadCountryByID",
  UpdateCountryMaster: "EDP/BasicMaster/UpdateCountryMaster",
  SaveApprovalType: "EDP/BasicMaster/SaveApprovalType",
  BindDiscountApproval: "EDP/BasicMaster/BindDiscountApproval",
  UpdateApprovalType: "EDP/BasicMaster/UpdateApprovalType",

  //Role Management API
  EDPRoleBindCentre: "EDP/RoleAndDepartmentSetUp/BindCentre",
  GetRoomByFloor: "EDP/RoleAndDepartmentSetUp/GetRoomByFloor",
  MapRoleToRoom: "EDP/RoleAndDepartmentSetUp/MapRoleToRoom",

  //Panel Management ///... Upload document  master
  BindDocumentName: "EDP/PanelSetUp/BindDocumentName",
  SaveDocumentMaster: "EDP/PanelSetUp/SaveDocumentMaster",
  GetFloorByCentre: "EDP/RoleAndDepartmentSetUp/GetFloorByCentre",
  UpdateDocumentMaster: "EDP/PanelSetUp/UpdateDocumentMaster",
  SearchRoomById: "EDP/RoomMasterSetUp/SearchRoomById",

  //room master
  RoomBindCentre: "EDP/RoomMasterSetUp/RoomBindCentre",
  SearchRoomData: "EDP/RoomMasterSetUp/SearchRoomData",
  SaveRoomData: "EDP/RoomMasterSetUp/SaveRoomData",
  InsertNewRoomType: "EDP/RoomMasterSetUp/InsertNewRoomType",
  InsertRoomDatalog: "EDP/RoomMasterSetUp/InsertRoomDatalog",

  //membershipCard  Discount
  GetBindDataCard: "EDP/MemberShipCardSetUp/GetBindDataCard",

  //dietMaster //component master
  DietComponentBindGrid: "EDP/DietMaster/ComponentBindGrid",
  DietComponentMasterSave: "EDP/DietMaster/ComponentMasterSave",
  DietComponentMasterUpdate: "EDP/DietMaster/ComponentMasterUpdate",

  //dietMaster //dietTypeMaster

  DietBindDetails: "EDP/DietMaster/BindDetail",
  SaveDietType: "EDP/DietMaster/SaveDietType",
  UpdateDietType: "EDP/DietMaster/UpdateDietType",

  //dietMaster //subdietTypeMaster
  SubDietBindGrid: "EDP/DietMaster/SubDietBindGrid",
  SubDietTypeSave: "EDP/DietMaster/SubDietTypeSave",
  SubDietTypeUpdate: "EDP/DietMaster/SubDietTypeUpdate",
  GetDietType: "EDP/DietMaster/GetDietType",
  GetMapSubDiet: "EDP/DietMaster/GetMapSubDiet",
  MapSubDietSave: "EDP/DietMaster/MapSubDietSave",

  //dietMaster // diet timing Master
  BindTimingGrid: "EDP/DietMaster/BindTimingGrid",
  SaveDietTiming: "EDP/DietMaster/SaveDietTiming",
  UpdateDietTiming: "EDP/DietMaster/UpdateDietTiming",

  //dietMaster >> diet menu Master
  BindGridDietMenu: "EDP/DietMaster/BindGridDietMenu",
  DietMenuSave: "EDP/DietMaster/DietMenuSave",
  DietMenuUpdate: "EDP/DietMaster/DietMenuUpdate",

  //dietMaster >> map diet component master
  Diettiming: "EDP/DietMaster/Diettiming",
  BindSubMenu: "EDP/DietMaster/BindSubMenu",
  MenuName: "EDP/DietMaster/MenuName",
  MapDietSearch: "EDP/DietMaster/MapDietSearch",
  MapDietSave: "EDP/DietMaster/MapDietSave",

  //diet >> freeze/issue patient diet
  BindWard: "EDP/DietMaster/BindWard",
  DietIssueBindGrid: "EDP/DietMaster/Diet_Issue_BindGrid",

  //diet >> patient diet request
  DietRequestSearch: "EDP/DietMaster/DietRequestSearch",
  BindDietType: "EDP/DietMaster/BindDietType",
  BindSubDietType: "EDP/DietMaster/BindSubDietType",
  DietBindMenu: "EDP/DietMaster/bindMenu",
  GetComponent: "EDP/DietMaster/GetComponent",
  ReceivedDiet: "EDP/DietMaster/ReceivedDiet",
  DietSaveComponent: "EDP/DietMaster/saveComponent",

  //blood bank >> bbstock >> direct stock receive
  BindOrganisation: "EDP/BBStock/BindOrganisation",
  BindComponent: "EDP/BBStock/BindComponent",
  BindBloodGroup: "EDP/BBStock/BindBloodGroup",
  BindBloodAdd: "EDP/BBStock/Add",
  BindBloodSave: "EDP/BBStock/Save",
  BindRate: "/EDP/BBStock/BindRate",
  BBStockSaveBBStock: "EDP/BBStock/SaveBBStock",
  // Pragya End

  FeedBackSaveQuestionMaster: "FeedBack/FeedBack/SaveQuestionMaster",
  FeedBackSearchQuestionMaster: "FeedBack/FeedBack/SearchQuestionMaster",
  FeedBackDeleteQuestionMaster: "FeedBack/FeedBack/DeleteQuestionMaster",
  FeedBackUpdateQuestionMaster: "FeedBack/FeedBack/UpdateQuestionMaster",
  SaveFeedbackQuestion: "FeedBack/FeedBack/SaveFeedbackQuestion",
  UpdateFeedbackQuestion: "FeedBack/FeedBack/UpdateFeedbackQuestion",
  DeleteFeedbackQuestion: "FeedBack/FeedBack/DeleteFeedbackQuestion",
  SearchFeedbackQuestion: "FeedBack/FeedBack/SearchFeedbackQuestion",
  SearchPatientServiceFeedback: "FeedBack/FeedBack/SearchPatientServiceFeedback",
  SavePatientServiceFeedback: "FeedBack/FeedBack/SavePatientServiceFeedback",
  PrintPatientServiceFeedback: "FeedBack/FeedBack/PrintPatientServiceFeedback",
  SearchServiceFeedbackList: "FeedBack/FeedBack/SearchServiceFeedbackList",
  SearchFeedbackComplaints: "FeedBack/FeedBack/SearchFeedbackComplaints",
  AssignFeedbackComplaint: "FeedBack/FeedBack/AssignFeedbackComplaint",
  GetFeedbackComplaintHistory: "FeedBack/FeedBack/GetFeedbackComplaintHistory",
  CloseFeedbackComplaint: "FeedBack/FeedBack/CloseFeedbackComplaint",
  GetFeedbackComplaintAttachment: "FeedBack/FeedBack/GetFeedbackComplaintAttachment",
  SearchPatientFeedBack: "FeedBack/FeedBack/SearchPatientFeedBack",
  SavePatientFeedBack: "FeedBack/FeedBack/SavePatientFeedBack",
  SaveQuestionDepartment: "FeedBack/FeedBack/SaveQuestionDepartment",
  GetQuestionDepartment: "FeedBack/FeedBack/GetQuestionDepartment",
  BindEmployeeFeedBack: "FeedBack/FeedBack/BindEmployeeFeedBack",
  FeedBackFeedBackReport: "FeedBack/FeedBack/FeedBackReport",
  OPDAdvancCRMFundReport: "OPDAdvance/CRMFundReport",
  OPDGetPanelReport: "OPD/GetPanel",
  OPDGetPackageReport: "OPD/GetPackage",
  OPDPackageReport: "OPD/OPDPackageReport",
  OPDOpenandClosePackage: "OPD/OpenandClosePackage",
  PackageDetail_report: "OPD/PackageDetail",
  OPDPackageSummaryReport: "OPD/OPDPackageSummaryReport",
  BillFinalReport: "Billing/BillFinalReport",
  IPDNoByCeilingDetails: "Billing/IPD/IPDNoByCeilingDetails",
  SaveCeilingAmount: "Billing/IPD/SaveCeilingAmount",
  IPDNoByApprovalDays: "Billing/IPD/IPDNoByApprovalDays",
  SaveApprovalDays: "Billing/IPD/SaveApprovalDays",
  BillingIPDBindTPA: "Billing/IPD/BindTPA",
  IPDAdmissionMultipleReport: "CurrentStock/IPDAdmissionMultipleReport",
  OTBindData: "OT/BindData",
  OTBindSurgery: "OT/BindSurgery",
  OTBindddlProcedure: "OT/BindddlProcedure",
  OTPrintOTNotes: "OT/DynamicPrintOTNotes",
  // EDP End   /
  // OT booking Start here
  GetAllSurgery: "OT/GetAllSurgery",
  OTBookingSave: "OT/OTBookingSave",
  GetPatientBookingDetails: "OT/GetPatientBookingDetails",
  OTBindOTTATTypeURL: "OT/BindOTTATType",
  GetAdmittedPatientURL: "OT/GetAdmittedPatient",
  ValidateExpiredBooking: "OT/ValidateExpiredBooking",
  OtConfirmBooking: "OT/ConfirmBooking",
  CancelBookingOt: "OT/CancelBooking",
  GetAdmitPatientDetailsURL: "OT/GetAdmitPatientDetails",
  OTMappatientidURL: "OT/Mappatientid",
  OTReceivedOTPatientURL: "OT/ReceivedOTPatient",
  OTGetExitingOTsURL: "OT/GetExitingOTs",
  OTGetOTPatientSearchData: "OT/GetOTPatientSearchData",
  CPOEBindVitals: "CPOE/BindVitals",
  BindType: "OT/BindType",
  OTBindStaff: "OT/BindStaff",
  OTBindSavedStaff: "OT/BindSavedStaff",
  OTGetAllSurgery: "OT/GetAllSurgery",
  OTGetBookedMultipleSurgeryList: "OT/GetBookedMultipleSurgeryList",
  OTSaveNewSurgeryBooking: "OT/SaveNewSurgeryBooking",
  BindOTdetails: "OT/BindOTPatientSearch",
  OTSaveType: "OT/SaveType",
  OTBindTATType: "OT/BindTATType",
  OTSaveTAT: "OT/SaveTAT",
  OTSaveStaff: "OT/SaveStaff",
  // OT booking END here
  /*  -----------shoib start------- */
  // doctor module
  SaveOrUpdateVaccineBrandName:
    "PrescriptionAdvice/SaveOrUpdateVaccineBrandName",
  // Laundry  Api Start
  BindMachineMaster: "Laundry/MachineMaster/BindMachineMaster",
  SaveMachineMaster: "Laundry/MachineMaster/SaveMachineMaster",
  // HR Payroll
  SavesMappingsDetails: "EDP/CentreSetUp/SavesMappingsDetails",
  BindEmployeeName: "EDP/EmployeeSetUp/BindEmployeeName",
  SearchRequsertLeave: "EEDP/Employee_Leave/SearchRequsertLeave",
  getMasterPageBooking: "Billing/Tool/getMasterPageBooking",
  HRHRHRDepartment: "HR/HR/HRDepartment",
  HRHRHRDesignation: "HR/HR/HRDesingation",
  HRHRHREmployeeMaster: "HR/HR/HREmployeeMaster",
  HRHRSaveIssueWarning: "HR/HR/SaveIssueWarning",
  HRHRBindIssueWarning: "HR/HR/BindIssueWarning",
  HRHRHRsaveInterRequestData: "HR/HR/HRsaveInterRequestData",
  GetInterRequestDataById: "HR/HR/GetInterRequestDataById",
  HRHRHRBindpay_InterRequestForm: "HR/HR/HRBindpay_InterRequestForm",
  HRUpdateInterRequestData: "HR/HR/HRUpdateInterRequestData",

  SaveHRPublicHoliDaysMaster: "HR/HR/SaveHRPublicHoliDaysMaster",
  BindHRPublicHoliDays: "HR/HR/BindHRPublicHoliDays",
  HRbindBackendData: "HR/HR/HRbindBackendData",
  HRsaveEmployeeClearanceAuthority: "HR/HR/HRsaveEmployeeClearanceAuthority",
  HRSaveAppraisalQuestion: "HR/HR/HRSaveAppraisalQuestion",
  HRBindAppraisalQuestionData: "HR/HR/HRBindAppraisalQuestionData",
  HRGetAppraisalQuestionById: "HR/HR/HRGetAppraisalQuestionById",
  HRUpdateAppraisalQuestion: "HR/HR/HRUpdateAppraisalQuestion",
  HRDeleteAppraisalQuestion: "HR/HR/HRDeleteAppraisalQuestion",
  

  // PayRoll

  PayrollBindRemuneration: "Payroll/BindRemunerationType",
  PayrollBindChartOFAccount: "Payroll/BindChartOfAccount",
  PayrollSaveRemuneration: "Payroll/SaveRemuneration",
  PayrollTableRemuneration: "Payroll/BindRemunerationDetail",
  PayrollUpdateRemuneration: "Payroll/UpdateRemuneration",
  PayrollRemunerationType: "Payroll/RemunerationType",
  PayrollBindEmployee: "Payroll/BindRemunerationEmployee",
  PayrollSearchData: "Payroll/BindRemunerationData",
  PayrollSaveTableInput: "Payroll/SaveMonthwiseRemuneration",
  PayrollBindEmployeeName: "Payroll/BindPayrollAcitveEmployee",
  PayrollSalarySlipDetails: "Payroll/SalarySlipDetail",
  PayrollSalarySlipPrint: "Payroll/SalarySlipPrint",
  PayrollDepartmentData: "Payroll/PayrollDepartment",
  PayrollDesignationList: "Payroll/PayrollDesignation",
  PayrollEmploymentType: "Payroll/BindEmploymentType",
  PayrollBindEmployeeData: "Payroll/BindPayrollEmployee",
  PayrollSalaryCalculate: "Payroll/SalaryCalculateData",
  PayrollSaveCalculate: "Payroll/SaveSalaryCalculate",
  PayrollViewEmployeeBind: "Payroll/BindEmployeeDetail",
  PayrollBindEmployeeSalary: "Payroll/BindEmployeeSalary",
  PayrollEmployeeSaveSalary: "Payroll/SaveSalary",
  PayrollBindRemunerationFormula: "Payroll/BindRemunerationFormula",
  PayrollSaveRemunerationFormula: "Payroll/SaveRemunerationFormula",
  PayrollBindRemunerationList: "Payroll/BindRemuneration",
  PayrollBindApplyOn: "Payroll/BindRemunerationApplyOn",
  BindRemunerationAndHead: "Payroll/BindRemunerationAndHead",
  // Legacy payroll P9 (KRA tax deduction card) — newHr Payroll (Legacy) group
  PayrollP9Search: "Payroll/SearchEmployeeForP9Report",
  PayrollP9Print: "Payroll/P9ReportPrint",
  PayrollStatutoryReport: "Payroll/StatutoryReport",
  BindRegistrationBody: "Payroll/BindRegistrationBody",
  BindCourse: "Payroll/BindCourse",
  SaveEmployeeProfDetails: "Payroll/SaveEmployeeProfDetails",

  // Leave Master
  HRLeaveTypeMaster: "HR/HR/HRLeaveTypeMaster",
  SaveHRLeaveMaster: "HR/HR/SaveHRLeaveMaster",
  GetHRALeaveMasterData: "HR/HR/GetHRALeaveMasterData",
  HRActionLeaveMaster: "HR/HR/HRActionLeaveMaster",

  // Hr-Bank Master
  HRSaveNewBankMaster: "HR/HR/HRSaveNewBankMaster",
  BindBankMaster: "HR/HR/BindBankMaster",
  HRSaveBranchMaster: "HR/HR/HRSaveBranchMaster",
  BindHRBankMasterDetail: "HR/HR/BindHRBankMasterDetail",
  HRUpdateBranchBankMasterDetail: "HR/HR/HRUpdateBranchBankMasterDetail",

  // Hr-Department- clearence master
  HRSaveNewDepartment: "HR/HR/HRSaveNewDepartment",
  HRBindDepartmentBackendData: "HR/HR/HRBindDepartmentBackendData",
  HRSaveDepartmentParticulars: "HR/HR/HRSaveDepartmentParticulars",
  HRDepartmentActionParticular: "HR/HR/HRDepartmentActionParticular",

  // Induction Cheaklist Form
  SaveInductionChecklistDetail: "HR/HR/SaveInductionChecklistDetail",
  GetInductionChecklistDetail: "HR/HR/GetInductionChecklistDetail",
  ExportEmployeeReport: "HR/HR/ExportEmployeeReport",

  // HR - EMPLOYEE TYPE MASTER
  saveEmploymentType: "EDP/EmployeeSetUp/saveEmploymentType",
  EmployeeSearch:"EDP/EmployeeSetUp/EmployeeSearch",
  BindBranchData: "EDP/EmployeeSetUp/BindBranchData",
  //Nursing ward

  SavePaediatricAdmissionRecord:
    "NursingWard/Nursing/SavePaediatricAdmissionRecord",
  GetdataPaediatricAdmissionRecord:
    "NursingWard/Nursing/GetdataPaediatricAdmissionRecord",
  EditPaediatricAdmissionRecord:
    "NursingWard/Nursing/EditPaediatricAdmissionRecord",
  UpdatePaediatricAdmissionRecord:
    "NursingWard/Nursing/UpdatePaediatricAdmissionRecord",
  SaveReceipient: "NursingWard/Forms/SaveReceipient",
  GetReceipientAndDonorData: "NursingWard/Forms/GetReceipientAndDonorData",
  UpdateReceipient: "NursingWard/Forms/UpdateReceipient",
  SavePostPCI: "NursingWard/Forms/SavePostPCI",
  PCIBindData: "NursingWard/Forms/BindData",
  BindMultipleDataByID: "NursingWard/Forms/BindMultipleData",
  UpdatePostPCI: "NursingWard/Forms/UpdatePostPCI",
  SaveDeathNotice: "NursingWard/Forms/SaveDeathNotice",
  BindDetailsDeathNotice: "NursingWard/Forms/BindDetailsDeathNotice",
  SaveTheatreProcedure: "NursingWard/Forms/SaveTheatreProcedure",
  BindGridDetailTHEATREPROCEDURE:
    "NursingWard/Forms/BindGridDetailTHEATREPROCEDURE",
  GetEditTheatreProcedure: "NursingWard/Forms/GetEditTheatreProcedure",
  UpdateTheatreProcedure: "NursingWard/Forms/UpdateTheatreProcedure",
  saveFamilyConference: "NursingWard/Forms/saveFamilyConference",
  bindGridDetail: "NursingWard/Forms/bindGridDetail",
  GetEditFamilyConference: "NursingWard/Forms/GetEditFamilyConference",
  UpdateFamilyConference: "NursingWard/Forms/UpdateFamilyConference",
  GetPatientDocumentUploadHistory: "NursingWard/GetPatientDocumentUploadHistory",
  /*  -----------shoib End------- */
  /*himanshu gupta -starts*/

  // anasthetic operatives
  AnaestheticOperationRecord: "EDP/OTMaster/AnaestheticOperationRecord",
  GetAnaestheticOperationRecord: "EDP/OTMaster/bindPulse",
  EditAnaestheticOperationRecord: "EDP/OTMaster/AnaestheticOperationRecord",
  GetAllAnaestheticOperationRecord: "EDP/OTMaster/BindOperationRecord",

  // bladder Irrigation
  SaveIrrigationChart: "EDP/OTMaster/SaveIrrigationChart",
  IrrigationSearchChartData: "EDP/OTMaster/SearchIrrigationChart",
  UpdateIrrigationChartData: "EDP/OTMaster/UpdateIrrigationChart",

  // anasthesia proceduer
  SaveAnaesProcedure: "EDP/OTMaster/SaveAnaesProcedure",
  GetPreviousCocoaAnesProcedure: "EDP/OTMaster/GetPreviousCocoaAnesProcedure",
  UpdateCocoaAnesProcedure: "EDP/OTMaster/UpdateCocoaAnesProcedure",

  // anasthesia drugs
  SaveAnestheticDrugs: "EDP/OTMaster/SaveAnestheticDrugs",
  BindSearchAnaestheticDrugs: "EDP/OTMaster/BindSearchAnaestheticDrugs",
  UpdateAnestheticDrugs: "EDP/OTMaster/EDP/OTMaster/UpdateAnestheticDrugs",

  // IntraOpVitalEntry

  saveOrUpdateIPDIntraOPPatientObservationChart:
    "EDP/OTMaster/SaveOrUpdateIPDIntraOPPatientObservationChart",

  // body part disposal
  SaveBodyPartDisposal:
    "EDP/OTMaster/SaveBodyPartDisposal/SaveBodyPartDisposal",
  UpdateBodyPartDisposal:
    "EDP/OTMaster/UpdateBodyPartDisposal/UpdateBodyPartDisposal",
  GetBodyPartDisposalByPatient:
    "EDP/OTMaster/GetBodyPartDisposalByPatient/GetBodyPartDisposalByPatient",
  RelationshipList: "EDP/OTMaster/GetRelationshipList/RelationshipList",

  // otconsent form
  SaveOTConsentForm: "EDP/OTMaster/SaveOTConsentForm/SaveOTConsentForm",
  UpdateOTConsentForm: "EDP/OTMaster/UpdateOTConsentForm/UpdateOTConsentForm",
  GetOTConsentByPatient:
    "EDP/OTMaster/GetOTConsentByPatient/GetOTConsentByPatientAsync",

  // preoperative form
  SavePreoperative: "EDP/OTMaster/SavePreoperative/SavePreoperative",
  BindNurse: "EDP/OTMaster/BindNurse",
  GetPreoperativeData: "EDP/OTMaster/GetPreoperativeData",

  //recovery care form
  BindEmployeeTransferDesigantion:
    "EDP/OTMaster/BindEmployeeTransferDesigantion",
  GetImmediateRecoveryCareList: "EDP/OTMaster/GetImmediateRecoveryCareList",
  GetHandOverGivenByTId: "EDP/OTMaster/GetHandOverGivenByTId",
  SaveOrUpdateImmediateRecoveryCare:
    "EDP/OTMaster/SaveOrUpdateImmediateRecoveryCare",

  //TheatreRecord
  SaveUpdateTheatreRecordAsync:
    "EDP/OTMaster/SaveUpdateTheatreRecord/SaveUpdateTheatreRecordAsync",
  GetTheatreRecordAsync: "EDP/OTMaster/GetTheatreRecord/GetTheatreRecordAsync",

  // intraoperativeNursingRecord
  SaveOperationDetailsAsync:
    "EDP/OTMaster/SaveOperationDetails/SaveOperationDetailsAsync",
  GetIntraOperativeNursingRecordAsync:
    "EDP/OTMaster/GetIntraOperativeNursingRecord/GetIntraOperativeNursingRecordAsync",

  // patient property form
  SavePatientPropertyDeclaration:
    "EDP/OTMaster/SavePatientPropertyDeclaration/SavePatientPropertyDeclaration",
  DetailPatientPropertyDeclaration:
    "EDP/OTMaster/DetailPatientPropertyDeclaration",

  // InsertionOfCentralVenousCatheter
  SaveSurgerySafety: "EDP/OTMaster/saveInsertionOfCentral/SaveSurgerySafety",
  UpdateInsertionOfCentral:
    "EDP/OTMaster/UpdateInsertionOfCentral/UpdateInsertionOfCentral",
  BindDetailsInsertionOfCentral: "EDP/OTMaster/BindDetailsInsertionOfCentral",

  //SwabsInstrumentAndSharpsCount
  SaveSwabsInstrumentAndSharpsCount:
    "EDP/OTMaster/SaveSwabsInstrumentAndSharpsCount/SaveSwabsInstrumentAndSharpsCount",
  SwabsInstrumentAndSharpsCountGetSearchData:
    "EDP/OTMaster/SwabsInstrumentAndSharpsCountGetSearchData/DetailSurgerySafety",

  // RecoveryRoomMonitoringChart
  SaveRecoveryRoomMonitoringChart:
    "EDP/OTMaster/SaveRecoveryRoomMonitoringChart/SaveRecoveryRoomMonitoringChart",
  UpdateRecoveryRoomMonitoringChart:
    "EDP/OTMaster/UpdateRecoveryRoomMonitoringChart/UpdateRecoveryRoomMonitoringChart",
  BindRecoveryRoomMonitoringChart:
    "EDP/OTMaster/BindRecoveryRoomMonitoringChart/BindRecoveryRoomMonitoringChart",

  // CheckListSSI

  SaveCheckListSSI: "EDP/OTMaster/SaveCheckListSSI/SaveCheckListSSI",
  bindCheckList: "EDP/OTMaster/BindCheckList/BindCheckList",

  //GetEndoscopyData

  GetEndoscopyData: "EDP/OTMaster/GetEndoscopyData/GetEndoscopyData",
  SaveEndoscopyData: "EDP/OTMaster/SaveEndoscopyData/SaveEndoscopyData",
  EditEndoscopyData: "EDP/OTMaster/EditEndoscopyData/EditEndoscopyData",
  PrintEndoscopyChecklist: "EDP/OTMaster/PrintEndoscopyChecklist",

  //CasereanSectionOperation
  SaveCasereanSectionOperation:
    "EDP/OTMaster/SaveCasereanSectionOperation/SaveCasereanSectionOperation",
  bindDetailsCasereanSectionOperation:
    "EDP/OTMaster/bindDetailsCasereanSectionOperation/bindDetailsCasereanSectionOperation",

  // Ecmo
  OtBindBloodGroup: "EDP/BBStock/BindBloodGroup",
  SaveRecordECMO: "EDP/OTMaster/SaveRecordECMO/SaveRecordECMO",

  LoadECMODetails: "EDP/OTMaster/LoadECMODetails",
  LoadECMOTable: "EDP/OTMaster/LoadECMOTable",
  LoadECMOTable1: "EDP/OTMaster/LoadECMOTable1",
  LoadFluidBalance: "EDP/OTMaster/LoadFluidBalance",

  // ot transfer
  UpdateTransfer: "EDP/OTMaster/UpdateTransfer",

  // post-op record
  SavePostOPRecord: "EDP/OTMaster/SavePostOPRecord",
  BindPostOPRecord: "EDP/OTMaster/BindPostOPRecord",

  // caridiopulmonary bypass

  SaveCardiopulmonaryBypass: "EDP/OTMaster/SaveCardiopulmonaryBypass",
  UpdateCardiopulmonaryBypass: "EDP/OTMaster/UpdateCardiopulmonaryBypass",
  GetCardiopulmonaryDetails: "EDP/OTMaster/GetCardiopulmonaryDetails",

  /*himanshu gupta -end*/

  // priyam

  GetItemsSubCategory: "Requisition/GetItemsByCategory",
  GetDepartmetItemsToReturn: "Requisition/GetDepartmetItemsToReturn",
  GetIndentReturnItemStockDetail: "Requisition/GetIndentReturnItemStockDetail",
  bindApprovalLevel: "QuotationAndCompare/bindApprovalLevel",
  QuotationApprovalCategorys: "QuotationAndCompare/QuotationApprovalCategorys",
  QuotationAndCompareSaveQuotationMaster:
    "QuotationAndCompare/SaveQuotationMaster",
  QuotationAndCompareBindQuotationMaster:
    "QuotationAndCompare/BindQuotationMaster",
  QuotationAndCompareDeleteQuotationMaster:
    "QuotationAndCompare/DeleteQuotationMaster",

  // ANuj KUmar
  BindMasterData: "Master/MasterData",
  BindMasterGetReportColumnList: "Master/GetReportColumnList",
  BindMasterBindCategory: "Master/BindCategory",
  BindMasterBindSubCategory: "Master/BindSubCategory",
  BindMasterBindDoc: "Master/BindDocDepartment",
  BindRevenueAnalysisRevenueAnalysisReport:
    "RevenueAnalysis/RevenueAnalysisReport",
  BindMasterSubReportList: "Master/SubReportList",
  BindMasterBindPanel: "Master/BindPanel",
  BindMasterMasterData: "Master/LoadItems",
  BindMasterBindGroupBy: "Master/BindGroupBy",
  BindMasterBindReportName: "Master/BindReportName",
  BindRequisitionGetStore: "Requisition/GetStore",
  BindMasterCategory: "Master/BindCategoryForStockReport",
  BindMasterSubCategory: "Master/BindSubCategory",
  BindMasterItem: "Master/BindItemBySubCategory",

  // Note Create abhijeet
  getQuickAccessMedicineData: "NoteCreater/GetQuickAccessMedicineData",
  getQuickAccessPatientDemographic:
    "NoteCreater/GetQuickAccessPatientDemographic",
  getQuickAccessLastVital: "NoteCreater/GetQuickAccessLastVital",
  getQuickAccessMedicineFullData: "NoteCreater/GetQuickAccessMedicineFullData",
  bindEMRInvItem: "NoteCreater/bindEMRInvItem",
  getQuickAccessNicu: "NoteCreater/GetQuickAccessNicu",
  saveEMRInvItem: "NoteCreater/SaveEMRInvItem",
  bindheadertemplate: "NoteCreater/bindheadertemplate",
  noteCreatersaveData: "NoteCreater/SaveData",
  ForMedicalCertificatePatientSearch: "Tool/ForMedicalCertificatePatientSearch",
  SaveMedicalCertificate: "Tool/SaveMedicalCertificate",
  SearchMedicalCertificate: "Tool/SearchMedicalCertificate",
  PrintMedicalCertificate: "Tool/PrintMedicalCertificate",
  EditMedicalCertificate: "Tool/EditMedicalCertificate",
  UpdateMedicalCertificate: "Tool/UpdateMedicalCertificate",
  // Note Finder
  noteFinderSearch: "NoteFinderSearch/NoteFinderSearch",
  bindDocSpecialization: "NoteFinderSearch/bindDocSpecialization",
  bindCadreType: "NoteFinderSearch/bindCadreType",
  bindTierType: "NoteFinderSearch/bindTierType",
  bindNoteTypeMaster: "NoteFinderSearch/bindNoteTypeMaster",
  // priyam
  SaveOrUpdateBloodTransfusionMonitoringChart:
    "EmergencyBilling/SaveOrUpdateBloodTransfusionMonitoringChart",
  GetMonitoringChartData: "EmergencyBilling/GetMonitoringChartData",
  // Shashikant Kumar
  BindMasterGetReportColumnList: "Master/GetReportColumnList",
  BindPaymentMode: "Master/BindPaymentMode",
  BindEmployeeUser: "Master/BindEmployee",
  BindDailyCollectionReport: "DailyCollectionReport/DailyCollectionReport",
  BindAllReportData: "AllReport/AllReport",
  CanclePatientList: "AllReport/CanclePatientList",
  BindReportData: "Master/ReportName",
  BindSubReportData: "Master/SubReportName",
  BindSaveReportGroupMaster: "Master/SaveReportGroupMaster", //post
  BindReportGroupMaster: "Master/BindReportGroupMaster", //get
  BindSubReportDataGrp: "Master/BindSubReportData",

  BindReportDataBuilder: "Master/ReportNameReportBuilder",
  BindSubReportDataBuilder: "Master/SubReportNameReportBuilder",
  BindReportField: "Master/ReportField",
  BindMasterReportColumnField: "Master/BindReportColumnDetails",
  BindMasterUserControls: "Master/BindUserControls",
  MasterBindUserGroupBy: "Master/BindUserGroupBy",
  MasterSaveReportMasterListUserWise: "Master/SaveReportMasterListUserWise",
  BindCommonAPIGetRoles: "CommonAPI/GetRoles",
  BindMasterGetDateType: "Master/GetDateType",
  BindPaymentMode: "Master/BindPaymentMode",
  BindEmployeeUser: "Master/BindEmployee",
  BindDailyCollectionReport: "DailyCollectionReport/DailyCollectionReport",
  BindSubReportUserDepartment: "Master/BindReportAssignedDetails",
  BindMasterGetPowerBidata: "Master/GetPowerBidata",
  BindDeleteHeaderFooterMaster: "Master/DeleteHeaderFooterMaster",
  BindGRNBindVendor: "GRN/BindVendor",
  SaveAssignUserAuthorization: "Master/SaveAuthorization",
  BindIPDReportType: "Master/BindIPDReportType",
  BindIPDReportTypeDetail: "Master/BindIPDReportTypeDetail",
  BindAssignedUserData: "Master/BindAssignUserData",
  BindTransportBindVehicleList: "Transport/BindVehicleList",
  BindTransportBindDriverList: "Transport/BindDriverList",

  // Note Create abhijeet
  getQuickAccessMedicineData: "NoteCreater/GetQuickAccessMedicineData",
  getQuickAccessPatientDemographic:
    "NoteCreater/GetQuickAccessPatientDemographic",
  getQuickAccessLastVital: "NoteCreater/GetQuickAccessLastVital",
  getQuickAccessMedicineFullData: "NoteCreater/GetQuickAccessMedicineFullData",
  bindEMRInvItem: "NoteCreater/bindEMRInvItem",
  getQuickAccessNicu: "NoteCreater/GetQuickAccessNicu",
  saveEMRInvItem: "NoteCreater/SaveEMRInvItem",
  bindheadertemplate: "NoteCreater/bindheadertemplate",
  noteCreatersaveData: "NoteCreater/SaveData",

  // Note Finder
  noteFinderSearch: "NoteFinderSearch/NoteFinderSearch",
  bindDocSpecialization: "NoteFinderSearch/bindDocSpecialization",
  bindCadreType: "NoteFinderSearch/bindCadreType",
  bindTierType: "NoteFinderSearch/bindTierType",
  bindNoteTypeMaster: "NoteFinderSearch/bindNoteTypeMaster",
  getData: "NursingWard/Forms/GetData",
  //Nursing Ward
  getInvasiveDeviceData: "NursingWard/Forms/GetInvasiveDeviceData",
  saveInvasiveDeviceData: "NursingWard/Forms/SaveInvasiveDeviceData",
  getSavedInvasiveDeviceData: "NursingWard/Forms/GetSavedInvasiveDeviceData",
  UpdateInvasiveDeviceForm: "NursingWard/Forms/UpdateInvasiveDeviceForm",
  icuGetData: "NursingWard/Forms/GetICUSafetyCheckListData",
  checklistGetData: "NursingWard/Forms/GetData",
  saveTaskStatus: "NursingWard/Forms/SaveTaskStatus",
  loadChecklist: "NursingWard/Forms/LoadChecklist",
  bindDetails: "NursingWard/Forms/bindDetails",
  save: "NursingWard/Forms/Save",
  bindCardioPulmonaryRasuas: "NursingWard/Forms/BindCardioPulmonaryRasuas",
  saveCardiopulmonary: "NursingWard/Forms/SaveCardiopulmonary",
  update_Cardiopulmonary: "NursingWard/Forms/Update_Cardiopulmonary",
  getMultipleSavedData: "NursingWard/Forms/GetMultipleSavedData",
  getNotificationFormDetails: "NursingWard/Forms/GetNotificationFormDetails",
  saveNotification: "NursingWard/Forms/SaveNotification",
  updateNotification: "NursingWard/Forms/UpdateNotification",
  getUserName: "NursingWard/Forms/getUserName",
  saveJacksonVisual: "NursingWard/Forms/SaveJacksonVisual",
  jacksonVisualBindDetails: "NursingWard/Forms/JacksonVisualBindDetails",
  updateJacksonVisual: "NursingWard/Forms/UpdateJacksonVisual",
  cautiCareBundleBindDetails: "NursingWard/Forms/CautiCareBundleBindDetails",
  cautiCareBundleSaveData: "NursingWard/Forms/CautiCareBundleSaveData",
  cautiCareBundleUpdateData: "NursingWard/Forms/CautiCareBundleUpdateData",
  peripheralBindDetails: "NursingWard/Forms/PeripheralBindDetails",
  peripheralSaveData: "NursingWard/Forms/PeripheralSaveData",
  patientAdmissionbindDetails: "NursingWard/Forms/PatientAdmissionbindDetails",
  patientAdmissionbindSave: "NursingWard/Forms/PatientAdmissionbindSave",
  getCrrtFlowSheetMaster: "NursingWard/Forms/GetCrrtFlowSheetMaster",
  saveCRRTFlowSheet: "NursingWard/Forms/SaveCRRTFlowSheet",
  getSavedCrrt_Multiple_Flowsheet:
    "NursingWard/Forms/getSavedCrrt_Multiple_Flowsheet",
  cRRTgetUserName: "NursingWard/Forms/CRRTgetUserName",
  updateCrrtFlowSheetMaster: "NursingWard/Forms/UpdateCrrtFlowSheetMaster",
  neurologicalBindDetails: "NursingWard/Forms/NeurologicalBindDetails",
  neurologicalSave: "NursingWard/Forms/NeurologicalSave",
  neurologicalUpdate: "NursingWard/Forms/NeurologicalUpdate",
  getDataPressureAreaCare: "NursingWard/Forms/GetDataPressureAreaCare",
  savePresureAreaCareForm: "NursingWard/Forms/SavePresureAreaCareForm",
  getUserNamePressureAreaCare: "NursingWard/Forms/getUserNamePressureAreaCare",
  editdata: "NursingWard/Forms/editdata",
  bindDataVENOUS: "NursingWard/Forms/BindDataVENOUS",
  saveDataVENOUS: "NursingWard/Forms/SaveDataVENOUS",
  saveData1VENOUS: "NursingWard/Forms/SaveData1VENOUS",
  saveData2VENOUS: "NursingWard/Forms/SaveData2VENOUS",
  saveData3VENOUS: "NursingWard/Forms/SaveData3VENOUS",
  saveData4VENOUS: "NursingWard/Forms/SaveData4VENOUS",

  // priyam
  // priyam
  SaveOrUpdateBloodTransfusionMonitoringChart:
    "EmergencyBilling/SaveOrUpdateBloodTransfusionMonitoringChart",
  GetMonitoringChartData: "EmergencyBilling/GetMonitoringChartData",
  // Shashikant Kumar
  BindMasterGetReportColumnList: "Master/GetReportColumnList",
  BindPaymentMode: "Master/BindPaymentMode",
  BindEmployeeUser: "Master/BindEmployee",
  BindDailyCollectionReport: "DailyCollectionReport/DailyCollectionReport",
  BindAllReportData: "AllReport/AllReport",
  GetOPDDashboard: "OPDDashboard/GetOPDDashboard",
  CanclePatientList: "AllReport/CanclePatientList",
  BindReportData: "Master/ReportName",
  BindSubReportData: "Master/SubReportName",
  BindReportDataBuilder: "Master/ReportNameReportBuilder",
  BindSubReportDataBuilder: "Master/SubReportNameReportBuilder",
  BindReportField: "Master/ReportField",
  BindMasterReportColumnField: "Master/BindReportColumnDetails",
  BindMasterUserControls: "Master/BindUserControls",
  // MasterBindUserGroupBy: "Master/BindUserGroupBy",
  MasterSaveReportMasterListUserWise: "Master/SaveReportMasterListUserWise",
  BindCommonAPIGetRoles: "CommonAPI/GetRoles",
  BindCommonAPIGetRoles: "CommonAPI/GetRoles",
  BindMasterGetDateType: "Master/GetDateType",
  BindPaymentMode: "Master/BindPaymentMode",
  BindGetTransactionTypes: "Master/BindTransactionType",
  BindEmployeeUser: "Master/BindEmployee",
  BindDailyCollectionReport: "DailyCollectionReport/DailyCollectionReport",
  BindSubReportUserDepartment: "Master/BindReportAssignedDetails",
  BindGetInvoiceVerificationDetail:
    "CreditControl/GetInvoiceVerificationDetail",
  BindCreditControlUpdateInvoiceVerification:
    "CreditControl/UpdateInvoiceVerificationStatus",
  BindControlPhysicalDispatchReport: "CreditControl/PhysicalDispatchReport",
  BindCreditControlUploadInvoiceVerificationDocument:
    "CreditControl/UploadInvoiceVerificationDocument",
  BindMRDBindPatientType: "MRD/BindPatientType",
  // BindBindPanel: "Master/BindPanel",
  BindAllPanel: "CommonAPI/GetAllPanel",
  BindDoctorCentrewise: "PatientControl/BindDoctorCentrewise",
  MasterBindCategory: "Master/BindCategory",
  BindBindCategory: "Master/BindCategory",
  BindSubCategory: "Master/BindSubCategory",
  BindMasterBindDocDepartment: "Master/BindDocDepartment",
  BindCreditControlGetInvoiceVerificationDocument:
    "CreditControl/GetInvoiceVerificationDocument",
  BindCreditControlInvoiceSettlementDetail:
    "CreditControl/InvoiceSettlementDetail",
  BindCreditControlInvoiceSettlementReport:
    "CreditControl/InvoiceSettlementReport",
  BindCreditControlGenerateInvoiceReport: "CreditControl/GenerateInvoiceReport",
  BindCreditControlBindPanelGroup: "CreditControl/BindPanelGroup",
  BindCreditControlBillInvoiceReport: "CreditControl/BillInvoiceReport",
  BindMasterBindAddMoreColumns: "Master/BindAddMoreColumns",
  BindSchedulerCharge: "Master/BindSchedulerCharge",
  BindIpdCaseType: "Master/BindIpdCaseType",
  BindMasterSaveReportControls: "Master/SaveReportControls",
  BindSaveReportHeaderFooterControls: "Master/SaveReportHeaderFooterControls",
  BindMasterBindReportHeaderFooterDetails:
    "Master/BindReportHeaderFooterDetails",
  BindMasterBindReportFooterMaster: "Master/BindReportFooterMaster",
  BindMasterBindDischargeSteps: "Master/BindDischargeSteps",
  BindMasterBindDischargeTypes: "Master/BindDischargeTypes",
  BindMasterBindIPDReport: "Master/BindIPDReport",
  BindMasterBindDrugMaster: "Master/BindDrugMaster",
  BindMasterBindRoleName: "Master/BindRoleName",
  BindMasterBindVisitType: "Master/BindVisitType",
  BindMasterBindClinicName: "Master/BindClinicName",
  BindSaveReport: "Master/SaveReportMaster",
  BindSubReportNameMaster: "Master/SubReportNameMaster",
  BindSaveSubReport: "Master/SaveSubReportMaster",
  BindSaveColumnMaster: "Master/SaveColumnMaster",
  BindColumnMaster: "Master/BindColumnMaster",
  BindReportMasterSavedData: "Master/BindReportMasterSavedData",
  BindReportCopyData: "Master/BindReportCopyData",
  BindSaveColumnSetupMaster: "Master/SaveColumnSetupMaster",
  BindFieldMaster: "Master/BindFieldMaster",
  BindFieldMappingData: "Master/BindFieldMappingData",
  BindSaveFieldMaster: "Master/SaveFieldMaster",
  BindReportMasterAuthorization: "Master/ReportMasterAuthorization",
  BindBindPrintTypeOption: "Master/BindPrintTypeOption",
  BindReportTypeDropdown: "Master/BindReportTypeDropdown",
  BindReportTypeDropdownColumnsData: "Master/BindReportTypeDropdownColumnsData",
  BindSaveReportTypeWiseColumn: "Master/SaveReportTypeWiseColumn",
  // priyam
  SaveOrUpdateBloodTransfusionMonitoringChart:
    "EmergencyBilling/SaveOrUpdateBloodTransfusionMonitoringChart",
  UpdateBloodTransfusionMonitoringChartDTO:
    "EmergencyBilling/UpdateBloodTransfusionMonitoringChartDTO",
  GetMonitoringChartData: "EmergencyBilling/GetMonitoringChartData",
  SaveDamaConsentForm: "Emergency/SaveDamaConsentForm",
  UpdateDamaConsentForm: "Emergency/UpdateDamaConsentForm",
  BindDetailsDamaConsentForm: "Emergency/BindDetailsDamaConsentForm",

  // SRS-2026-0074 : Emergency consent forms
  SaveMinorProcedureConsentForm: "Emergency/SaveMinorProcedureConsentForm",
  UpdateMinorProcedureConsentForm: "Emergency/UpdateMinorProcedureConsentForm",
  BindDetailsMinorProcedureConsentForm:
    "Emergency/BindDetailsMinorProcedureConsentForm",
  SaveHighRiskConsentForm: "Emergency/SaveHighRiskConsentForm",
  UpdateHighRiskConsentForm: "Emergency/UpdateHighRiskConsentForm",
  BindDetailsHighRiskConsentForm: "Emergency/BindDetailsHighRiskConsentForm",

  //rupesh-subCat
  FinanceSubCategoryMappingMasterScreenData:
    "Finance/SubCategoryMappingMasterScreenData",
  FinanceSubCategoryMappingMasterMappedUnMappedData:
    "Finance/SubCategoryMappingMasterMappedUnMappedData",
  FinanceExporttoExcelNotMappedDataFinVHims:
    "Finance/ExporttoExcelNotMappedDataFinVHims",
  FinanceExportToExcelSubCategoryMappingMaster:
    "Finance/ExportToExcelSubCategoryMappingMaster",
  FinanceSaveSelectedItemRightSubCategoryMappingMaster:
    "Finance/SaveSelectedItemRightSubCategoryMappingMaster",
  FinanceSaveSelectedItemLeftSubCategoryMappingMaster:
    "Finance/SaveSelectedItemLeftSubCategoryMappingMaster",
  FinanceCopyMappingSubCategoryMappingMaster:
    "Finance/CopyMappingSubCategoryMappingMaster",

  NoteTypeMaster: "NoteFinderSearch/bindNoteTypeMaster",
  BindNoteTypeTemplate: "HelpDesk/BindTemplate",
  BindPatientNoteCreation: "HelpDesk/BindPatientNoteCreation",
  SaveNoteCreation: "NoteCreater/SaveNoteCreation",
  SaveTemplateCreation: "NoteCreater/CreateTemplateCreation",
  famCheckRequest: "Medikredit/FamCheckRequest",
  checkEligibility: "Medikredit/CheckEligibility",
  checkDoctorBookConsultant: "Medikredit/CheckDoctorBookConsultant",
  doctorClaimSubmit: "Medikredit/DoctorClaimSubmit",
  doctorClaimRversalRequest: "Medikredit/DoctorClaimRversalRequest",
  CheckDoctorBookCons: "Medikredit/CheckDoctorBookConsultantDetails",
  CheckDoctorStatus: "MediKredit/CheckDoctorStatus",
  BindMultipleLabReport: "MachineResultEntry/DynamicBindMultipleLabReport",
  InvestigationBookingSlipReport:
    "FutureInvestigations/InvestigationBookingSlipReport",

  // Front Office Medikredit

  //Akhilesh-Start
  FormBuilderCreateAndUpdateFormLayout: "FormBuilder/CreateAndUpdateFormLayout",
  FormBuilderGetFieldTypeMaster: "FormBuilder/GetFieldTypeMaster",
  FormBuilderGetFormTypeMaster: "FormBuilder/GetFormTypeMaster",
  FormBuilderGetFormPreviewByFormId: "FormBuilder/GetFormPreviewByFormId",
  FormBuilderSaveFormSubmission: "FormBuilder/SaveFormSubmission",
  FormBuilderGetFormSubmissionByPatient:
    "FormBuilder/GetFormSubmissionByPatient",
  FormBuilderGetOtherTableLinkage: "FormBuilder/GetOtherTableLinkage",
  FormBuilderGetOptionValue: "FormBuilder/GetOptionValue",
  FormBuilderGetFormsList: "FormBuilder/GetFormsList",
  FormBuilderUpdateStatus: "FormBuilder/UpdateStatus",
  FormBuilderGetPatientDefaultValue: "FormBuilder/GetPatientDefaultValue",
  FormBuilderPrintForm: "FormBuilder/PrintForm",

  DoctorPrescriptionPrintGetOnlinePresciption:
    "DoctorPrescriptionPrint/GetOnlinePresciption",
  GmailGetDoctorMeeting: "Gmail/GetDoctorMeeting",
  FormBuilderSaveFormSendToEmail: "FormBuilder/SaveFormSendToEmail",
  NewBindglobalresources: "CommonAPI/NewBindglobalresources",
  SaveCounselingRequest: "Doctor/SaveCounselingRequest",
  BindCounselingDetails: "Doctor/BindCounselingDetails",

  EDPEmailSetUpConnectWithUs: "EDP/EmailSetUp/ConnectWithUs",
  GmailScheduleMeetingWithPatient: "Gmail/ScheduleMeetingWithPatient",
  CommonAPIGetPatientRegistration: "CommonAPI/GetPatientRegistration",
  MediKreditInviteRegisterMediKredit: "MediKredit/InviteRegisterMediKredit",
  GmailUnlinkGoogle: "Gmail/UnlinkGoogle",
  //Akhilesh-End

  BindVisitType: "Master/BindVisitType",
  CounsellingPatientSearch: "IVF/IVF/CounsellingPatientSearch",
  IVFSaveLabPrescriptionOPD: "IVF/IVF/IVFSaveLabPrescriptionOPD",
  BindIVFPackages: "IVF/IVF/BindIVFPackages",
  IVFRoomType: "IPDDetail/IVFRoomType",
  BindRoomBedIVF: "IPDDetail/BindRoomBedIVF",
  SaveIVFAdmission: "/IVF/IVF/SaveIVFAdmission",
  IVFPatientSearch: "/IVF/IVF/IVFPatientSearch",
  SaveIVFCurrentStatus: "/IVF/IVF/SaveIVFCurrentStatus",
  IVFCounsellingInvestigationItemSearch:
    "/IVF/IVF/IVFCounsellingInvestigationItemSearch",
  SaveOrUpdateIVFCounselling: "/IVF/IVF/SaveOrUpdateIVFCounselling",
  GetDataOfIVFCounselling: "/IVF/IVF/GetDataOfIVFCounselling",
  SaveOrUpdateIVFConvertToPackage: "/IVF/IVF/SaveOrUpdateIVFConvertToPackage",
  GetDataOfIVFConvertToPackage: "/IVF/IVF/GetDataOfIVFConvertToPackage",
  RenderPDF: "/IVF/IVF/RenderPDF",
  FormG: "/IVF/IVF/FormG",
  MINISTRYOFHEALTH: "/IVF/IVF/MINISTRYOFHEALTH",
  IVFCASESHEET: "/IVF/IVF/IVFCASESHEET",
  SaveOrUpdateIVFVisitStartClose: "/IVF/IVF/SaveIVFVisitStartClose",
  UpdateIVFVisitStartClose: "/IVF/IVF/UpdateIVFVisitStartClose",
  GetDataOfIVFVisitStartClose: "/IVF/IVF/GetDataOfIVFVisitStartClose",
  GetIVFPatientAdmitDetails: "/IVF/IVF/GetIVFPatientAdmitDetails",
  GetIVFDischargSummaryTemplates: "/IVF/IVF/GetIVFDischargSummaryTemplates",
  GetIVFDischargSummaryHeaders: "/IVF/IVF/GetIVFDischargSummaryHeaders",
  SaveOrUpdateIVFDischargeSummary: "/IVF/IVF/SaveOrUpdateIVFDischargeSummary",
  GetIVFPatientDischargeSummaryDetails:
    "/IVF/IVF/GetIVFPatientDischargeSummaryDetails",
  GetIVFPreviousDischargeSummary: "/IVF/IVF/GetIVFPreviousDischargeSummary",
  GetIVFTemplateDetails: "/IVF/IVF/GetIVFTemplateDetails",
  PrintIVFDischargeSummary: "/IVF/IVF/PrintIVFDischargeSummary",
  SaveOrUpdateSocialHistory: "/IVF/IVF/SaveOrUpdateSocialHistory",
  GetDataSocialHistory: "/IVF/IVF/GetDataSocialHistory",
  BindSpouse: "/IVF/IVF/BindSpouse",
  DoctorGoogleConnectAPI: "Gmail/GetDoctorConsent",
  DoctorGoogleConnectAPI: "Gmail/GetDoctorConsent",
  // BindFrameMenuByRoleID: "MasterPage/BindFrameMenuByRoleID",
  GetSpouseAppointments: "IVF/IVF/GetSpouseAppointments",
  CommonReceipthtml: "CommonReciept_PDF/CommonReceipthtml",
  GetLabBalanceCheck: "/MachineResultEntry/GetLabBalanceCheck",

  BindEmploymentType: "EDP/EmployeeSetUp/BindEmploymentTypeData",
  BindDepartmentHR: "EDP/EmployeeSetUp/BindDepartment",
  BindDesignation: "EDP/EmployeeSetUp/BindDesignation",
  BindJoiningCentre: "EDP/EmployeeSetUp/LoadCentre",
  ProbitionalPeriod: "EDP/EmployeeSetUp/calculateProbitionalPeriod",
  SaveCandidateData: "EDP/EmployeeSetUp/SaveInterViewCandidateEntry",
  SearchOfferLetter: "EDP/EmployeeSetUp/SearchOfferLetter",
  BindEmployeeData: "EDP/EmployeeSetUp/BindEmployee",
  BindEmployeeDataHR: "EDP/EmployeeSetUp/bindEmployeeData",
  SaveResignation: "EDP/EmployeeSetUp/saveResignation",
  BindUnitsHR: "EDP/EmployeeSetUp/BindUnits",
  SelectCandidate: "EDP/EmployeeSetUp/SearchSelectedCandidates",
  EditCandidates: "EDP/EmployeeSetUp/SearchCandidateDetails",
  SearchOfferletterApproval: "EDP/EmployeeSetUp/SearchOfferLetterApproval",
  SaveOfferletterApproval: "EDP/EmployeeSetUp/SaveOfferLetterApproval",
  BindEmployeeStatus: "EDP/EmployeeSetUp/bindStatus",
  BindEmployeeSource: "EDP/EmployeeSetUp/bindSource",
  ValidateUserToBill: "Login/ValidateUserToBill",
  GetIVFFormCounselling: "IVF/IVF/GetIVFFormCounselling",
  SaveMealTime: "MealTimeTable/SaveMealTime",
  LoadMealTimeData: "MealTimeTable/LoadPreviousData",
  PrintMealTimeTable: "MealTimeTable/LoadPreviousDataReport",
  GetAdmitDischargeAuthorizationStatus:
    "AdmitdischargeCancel/GetAdmitDischargeAuthorizationStatus",
  GetOnlineLabReport: "MachineResultEntry/GetOnlineLabReport",

  // -------- Barcode Generate (Discount OTP) --------
  GeneratePrePrintedBarcode: "DiscountOTP/GeneratePrePrintedBarcode",
  GetBarcodeByID: "DiscountOTP/GetBarcodeByID",
  GetGlobalResources: "DiscountOTP/GetGlobalResources",
  GetDiscountApprovalList: "DiscountOTP/GetDiscountApprovalList",
  SendDiscountOTP: "DiscountOTP/SendDiscountOTP",
  SaveDiscountOTP: "DiscountOTP/VerifyDiscountOTP/VerifyDiscountOTP",
  ConfirmationCancellationRights:"Confirmation/AfterConfirmationCancellationRights" ,
  BindReferType:"Master/BindReferType",
  BindReferDoctorPrint:"Master/BindReferDoctor",

  SaveAndUpdateModel: "ApplicationModelMaster/SaveAndUpdate",
  UpdateStatusModel: "ApplicationModelMaster/UpdateStatus",
  GetModelMaster: "ApplicationModelMaster/GetModelMaster",  
  SaveAndUpdatemodulemaster: "ApplicationModelMaster/GetModelMaster",  
  GetRoleMapping: "ApplicationModelMaster/GetRoleMapping",
  SaveAndUpdatemodulemaster: "ApplicationModelMaster/SaveAndUpdatemodulemaster",
  SaveUrlMapping: "ApplicationModelMaster/SaveUrlMapping",
  GetUrlMapping: "ApplicationModelMaster/GetUrlMapping",
  GetMissingTables: "Onboarding/GetMissingTables",
  SaveMissingTable: "Onboarding/SaveMissingTable",
  SaveAllMaster: "Onboarding/SaveAllMaster",
  TruncateMasterTables: "Onboarding/TruncateMasterTables",
  SaveMenuMaster: "Onboarding/SaveMenuMaster",
  GetMenuMasterList: "Onboarding/GetMenuMasterList",
  UpdateMenuMaster: "Onboarding/UpdateMenuMaster",
  DeleteMenuMaster: "Onboarding/DeleteMenuMaster",
  SaveFileMaster: "Onboarding/SaveFileMaster",
  GetFileMasterList: "Onboarding/GetFileMasterList",
  UpdateFileMaster: "Onboarding/UpdateFileMaster",
  DeleteFileMaster: "Onboarding/DeleteFileMaster",
  SaveFileRoleList: "Onboarding/SaveFileRoleList",
  UpdateOnboardingMaster: "Onboarding/UpdateOnboardingMaster",
  ConfirmationCancellationRights:
    "Confirmation/AfterConfirmationCancellationRights",
  BindReferType: "Master/BindReferType",
  BindReferDoctorPrint: "Master/BindReferDoctor",
  CommonAPIBindMLCtype: "CommonAPI/BindMLCtype",
  ForceFullyPatientclear: "EDP/EmployeeSetUp/ForceFullyPatientclear",

  // Dynamic screen builder — the API catalog it reads to offer controller /
  // endpoint dropdowns (HospediaAPI/ScreenBuilder).
  ScreenBuilderGetControllers: "ScreenBuilderCatalog/GetControllers",
  ScreenBuilderGetEndpoints: "ScreenBuilderCatalog/GetEndpoints",
  ScreenBuilderGetCatalog: "ScreenBuilderCatalog/GetCatalog",

  // Dynamic screen builder — storage for the screens it designs
  // (HospediaAPI/ScreenBuilder, tables sb_screen / sb_screen_version / sb_template).
  ScreenBuilderIsInstalled: "ScreenBuilder/IsInstalled",
  ScreenBuilderInstall: "ScreenBuilder/Install",
  ScreenBuilderGetScreens: "ScreenBuilder/GetScreens",
  ScreenBuilderGetScreen: "ScreenBuilder/GetScreen",
  // the published version for /screen/:id, served from the API cache
  ScreenBuilderGetLiveScreen: "ScreenBuilder/GetLiveScreen",
  ScreenBuilderSaveScreen: "ScreenBuilder/SaveScreen",
  ScreenBuilderPublishScreen: "ScreenBuilder/PublishScreen",
  ScreenBuilderDeleteScreen: "ScreenBuilder/DeleteScreen",
  ScreenBuilderGetScreenVersions: "ScreenBuilder/GetScreenVersions",
  ScreenBuilderGetScreenVersion: "ScreenBuilder/GetScreenVersion",
  ScreenBuilderRestoreVersion: "ScreenBuilder/RestoreScreenVersion",
  ScreenBuilderDeleteScreenVersion: "ScreenBuilder/DeleteScreenVersion",
  ScreenBuilderGetTemplates: "ScreenBuilder/GetTemplates",
  ScreenBuilderSaveTemplate: "ScreenBuilder/SaveTemplate",
  ScreenBuilderSeedTemplates: "ScreenBuilder/SeedTemplates",
  ScreenBuilderDeleteTemplate: "ScreenBuilder/DeleteTemplate",
  // Restricted boxes: which users may see them (table sb_screen_access).
  ScreenBuilderGetScreenAccess: "ScreenBuilder/GetScreenAccess",
  ScreenBuilderSaveScreenAccess: "ScreenBuilder/SaveScreenAccess",
  ScreenBuilderGetMyScreenAccess: "ScreenBuilder/GetMyScreenAccess",
  ScreenBuilderSearchAccessUsers: "ScreenBuilder/SearchAccessUsers",
  // Role > employee > screen > boxes: the permission page's default view.
  ScreenBuilderGetRoleEmployees: "ScreenBuilder/GetRoleEmployees",
  ScreenBuilderGetEmployeeScreenAccess: "ScreenBuilder/GetEmployeeScreenAccess",
  ScreenBuilderSaveEmployeeScreenAccess: "ScreenBuilder/SaveEmployeeScreenAccess",
  ScreenBuilderGetRoleScreenAccess: "ScreenBuilder/GetRoleScreenAccess",
  ScreenBuilderSaveRoleScreenAccess: "ScreenBuilder/SaveRoleScreenAccess",
  ScreenBuilderSaveRoleAccessBatch: "ScreenBuilder/SaveRoleAccessBatch",
  ScreenBuilderBindRoleMasterList: "EDP/RoleAndDepartmentSetUp/BindRoleMasterList",
  // A screen as an app page: module (f_menumaster) > roles (f_file_role) > employees (user_pageaccess).
  ScreenPageAccessGetMenus: "ScreenPageAccess/GetMenus",
  ScreenPageAccessGetAccess: "ScreenPageAccess/GetAccess",
  ScreenPageAccessSaveAccess: "ScreenPageAccess/SaveAccess",

  // Dynamic print builder (HospediaAPI/PrintBuilder, tables pb_*). GeneratePdf
  // answers like CommonReciept_PDF/CommonReceiptPdf: data.pdfUrl.
  PrintBuilderStatus: "PrintBuilder/Status",
  PrintBuilderEngineInfo: "PrintBuilder/EngineInfo",
  PrintBuilderTemplates: "PrintBuilder/Templates",
  PrintBuilderTemplate: "PrintBuilder/Template",
  PrintBuilderCreateTemplate: "PrintBuilder/CreateTemplate",
  PrintBuilderSaveTemplate: "PrintBuilder/SaveTemplate",
  PrintBuilderDuplicateTemplate: "PrintBuilder/DuplicateTemplate",
  PrintBuilderDeleteTemplate: "PrintBuilder/DeleteTemplate",
  PrintBuilderExportTemplate: "PrintBuilder/ExportTemplate",
  PrintBuilderImportTemplate: "PrintBuilder/ImportTemplate",
  PrintBuilderValidateTemplate: "PrintBuilder/ValidateTemplate",
  PrintBuilderPublishTemplate: "PrintBuilder/PublishTemplate",
  PrintBuilderVersions: "PrintBuilder/Versions",
  PrintBuilderVersion: "PrintBuilder/Version",
  PrintBuilderActivateVersion: "PrintBuilder/ActivateVersion",
  PrintBuilderRestoreVersion: "PrintBuilder/RestoreVersion",
  PrintBuilderStarters: "PrintBuilder/Starters",
  PrintBuilderDatasources: "PrintBuilder/Datasources",
  PrintBuilderDatasource: "PrintBuilder/Datasource",
  PrintBuilderSaveDatasource: "PrintBuilder/SaveDatasource",
  PrintBuilderDeleteDatasource: "PrintBuilder/DeleteDatasource",
  PrintBuilderProcedures: "PrintBuilder/Procedures",
  PrintBuilderProcedureParams: "PrintBuilder/ProcedureParams",
  PrintBuilderFetchSample: "PrintBuilder/FetchSample",
  PrintBuilderSampleLookup: "PrintBuilder/SampleLookup",
  PrintBuilderUploadAsset: "PrintBuilder/UploadAsset",
  PrintBuilderAssets: "PrintBuilder/Assets",
  PrintBuilderAsset: "PrintBuilder/Asset",
  PrintBuilderDeleteAsset: "PrintBuilder/DeleteAsset",
  PrintBuilderGeneratePdf: "PrintBuilder/GeneratePdf",
  // GRN/GetDirectGRNReport printed by the published GRN template (same payload { grnNumber }, same answer)
  PrintBuilderGetDirectGRNReport: "PrintBuilder/GetDirectGRNReport",
  // CommonReciept_PDF/CommonReceiptPdf printed by published templates (same payload; type → template: OPD, PHY)
  PrintBuilderCommonReceiptPdf: "PrintBuilder/CommonReceiptPdf",
  // Reports/IPDBillPrint BillType PKGDET printed by the published PACKAGEDETAILBILLPRINT template (same IPDBillPrintDTO payload)
  PrintBuilderPackageDetailBillPrint: "PrintBuilder/PackageDetailBillPrint",
  // Reports/IPDBillPrint BillType PKGSUM printed by the published IPD_PACKAGE_BILL_SUMMARY template (same IPDBillPrintDTO payload)
  PrintBuilderIPD_Package_Bill_Summary: "PrintBuilder/IPD_Package_Bill_Summary",
  // Reports/IPDBillPrint BillType DET printed by the published DETAILBILLPRINT template (same IPDBillPrintDTO payload)
  PrintBuilderDetailBillPrint: "PrintBuilder/DetailBillPrint",
  // Reports/IPDBillPrint BillType SUM printed by the published SUMMARYBILLPRINT template (same IPDBillPrintDTO payload)
  PrintBuilderSummaryBillPrint: "PrintBuilder/SummaryBillPrint",
  // CurrentStock/GeneralConsertForm printed by the published GENERALCONSERTFORM template (same { transactionID } payload)
  PrintBuilderGeneralConsertForm: "PrintBuilder/GeneralConsertForm",
  // DRDetails/PrintDischargeReport printed by the published PRINTDISCHARGEREPORT template (same DischargeReportDTO payload)
  PrintBuilderPrintDischargeReport: "PrintBuilder/PrintDischargeReport",
  // CurrentStock/IPDAdmissionReport?ReportType=3 (file sticker) printed by the published FILE_STICKER template (same ?TID=&ReportType=3 query)
  PrintBuilderFile_Sticker: "PrintBuilder/File_Sticker",
  // CurrentStock/IPDAdmissionReport?ReportType=2 (Reprint IPD Admission) printed by the published REPRINT_IPD_ADMISSION template (same ?TID=&ReportType=2 query)
  PrintBuilderReprint_IPD_Admission: "PrintBuilder/Reprint_IPD_Admission",
  // CurrentStock/IPDPrintSticker printed by the published IPDPRINTSTICKER template (same { transactionID } payload)
  PrintBuilderIPDPrintSticker: "PrintBuilder/IPDPrintSticker",
  // PurchaseOrderApproval/POReport printed by the published PURCHASE_ORDER template (same { poNumber } payload)
  PrintBuilderPurchase_Order: "PrintBuilder/Purchase_Order",
  // DirectDepartmentIssue/DirectDepartmentIssueReport (department return) printed by the published DEPARTMENT_RETURN template (same ?SalesNo=&CentreIDTo= query)
  PrintBuilderDepartment_Return: "PrintBuilder/Department_Return",
  // DirectDepartmentIssue/DirectDepartmentIssueReport (department issue) printed by the published DIRECT_DEPARTMENT_ISSUE template (same ?SalesNo=&CentreIDTo= query)
  PrintBuilderDirect_Department_Issue: "PrintBuilder/Direct_Department_Issue",
  // CurrentStock/PrintIssue (department indent issue) printed by the published DEPARTMENT_ISSUE template (same ?IndentNo=&ReportType=2 query)
  PrintBuilderDepartment_Issue: "PrintBuilder/Department_Issue",
  // CommonReciept_PDF/CommonReceiptPdf type IPD (IPD advance / settlement receipt) printed by the published IPD_ADVANCE_SETTLEMENT template (same CommonRecieptPDFDTO payload)
  PrintBuilderIPD_Advance_Settlement: "PrintBuilder/IPD_Advance_Settlement",
  // CurrentStock/SelfDeclaration (IPD self declaration) printed by the published SELF_DECLARATION template (same { transactionID } payload)
  PrintBuilderSelf_Declaration: "PrintBuilder/Self_Declaration",
  // CurrentStock/PrintRequisition Type MI/MR (patient medicine requisition issue / return) printed by the published PATIENT_INDENT template (same ?IndentNo=&Status=&Type= query)
  PrintBuilderPatient_Indent: "PrintBuilder/Patient_Indent",
  // CurrentStock/PrintIssue ReportType 2 (department indent issue / requisition) printed by the published DEPARTMENT_INDENT template (same ?IndentNo=&ReportType=2 query)
  PrintBuilderDepartment_Indent: "PrintBuilder/Department_Indent",
  // CurrentStock/DischargeSlip (IPD discharge slip) printed by the published DISCHARGE_SLIP template (same { transactionID } payload)
  PrintBuilderDischarge_Slip: "PrintBuilder/Discharge_Slip",
  // CardPrint/PrintCard (OPD card) printed by the published CARD_PRINT template (same ?pid=&TransactionID=&reportType= query; GET or POST)
  PrintBuilderCard_Print: "PrintBuilder/Card_Print",
  // DoctorPrescriptionPrint/DynamicDoctorPrescriptionReportPdf (OPD doctor prescription) printed by the published DOCTOR_PRESCRIPTION template (same { pid, transactionID, appID, previewSetting } payload; data = pdfUrl string, as before)
  PrintBuilderDoctor_Prescription: "PrintBuilder/Doctor_Prescription",
  // PatientConsent/PatientConsent/PatientConsentPrint (patient consent form) printed by the published PATIENT_CONSENT_FORM template (same { patientID, transactionID, Logo } payload)
  PrintBuilderPatient_Consent_Form: "PrintBuilder/Patient_Consent_Form",
  // MachineResultEntry/DynamicBindMultipleLabReport (lab report, every report type) printed by the published LAB_REPORT template (same LabObservationRequest payload { testID, … }; several testIDs = one report each; data = pdfUrl string, as before)
  PrintBuilderLab_Report: "PrintBuilder/Lab_Report",
  // LabWorkSheet/GenerateWorksheet (lab work sheet) printed by the published LAB_WORK_SHEET template (same [{ labNo, testID, reportType }] payload; one sheet per patient; data.value.pdfUrl, as before)
  PrintBuilderLab_Work_sheet: "PrintBuilder/Lab_Work_sheet",
  // Finance/VoucherPrint (finance voucher) printed by the published VOUCHER_PRINT template (same ?voucherNo= query, GET or POST; data.pdfUrl, as before)
  PrintBuilderVoucheR_Print: "PrintBuilder/VoucheR_Print",
  // ConsignmentReturn/ConsignmentReceivePrint (consignment receipt note) printed by the published CONSIGNMENT_RECEIVE_PRINT template (same { ReturnID } payload)
  PrintBuilderConsignment_Receive_Print: "PrintBuilder/Consignment_Receive_Print",
  PrintBuilderPreviewPdf: "PrintBuilder/PreviewPdf",
  // API 1.3: log, variants, rights, lock, blocks, pickers, batch, export, send, where-used
  PrintBuilderSetTemplateCategory: "PrintBuilder/SetTemplateCategory",
  PrintBuilderVariants: "PrintBuilder/Variants",
  PrintBuilderSaveVariant: "PrintBuilder/SaveVariant",
  PrintBuilderDeleteVariant: "PrintBuilder/DeleteVariant",
  PrintBuilderResolveVariant: "PrintBuilder/ResolveVariant",
  PrintBuilderTemplateAccess: "PrintBuilder/TemplateAccess",
  PrintBuilderSaveTemplateAccess: "PrintBuilder/SaveTemplateAccess",
  PrintBuilderRoles: "PrintBuilder/Roles",
  PrintBuilderEmployees: "PrintBuilder/Employees",
  PrintBuilderLockTemplate: "PrintBuilder/LockTemplate",
  PrintBuilderUnlockTemplate: "PrintBuilder/UnlockTemplate",
  PrintBuilderBlocks: "PrintBuilder/Blocks",
  PrintBuilderSaveBlock: "PrintBuilder/SaveBlock",
  PrintBuilderDeleteBlock: "PrintBuilder/DeleteBlock",
  PrintBuilderParamOptions: "PrintBuilder/ParamOptions",
  PrintBuilderGenerateBatchPdf: "PrintBuilder/GenerateBatchPdf",
  PrintBuilderGenerateExport: "PrintBuilder/GenerateExport",
  PrintBuilderPreviewExport: "PrintBuilder/PreviewExport",
  PrintBuilderRenderFile: "PrintBuilder/RenderFile",
  PrintBuilderWhereUsed: "PrintBuilder/WhereUsed",

  // Nursing form builder (HospediaAPI/NursingFormBuilder, tables nf_*). Uploaded
  // PDF/image forms with patient keys (IPDDetail/PatientSearch) placed on them.
  NursingFormStatus: "NursingFormBuilder/Status",
  NursingFormContext: "NursingFormBuilder/Context",
  NursingFormPatientDetails: "NursingFormBuilder/PatientDetails",
  NursingForms: "NursingFormBuilder/Forms",
  NursingForm: "NursingFormBuilder/Form",
  NursingFormSave: "NursingFormBuilder/SaveForm",
  NursingFormPublish: "NursingFormBuilder/PublishForm",
  NursingFormVersions: "NursingFormBuilder/Versions",
  NursingFormVersion: "NursingFormBuilder/Version",
  NursingFormPublished: "NursingFormBuilder/PublishedForms",
  NursingFormDuplicate: "NursingFormBuilder/DuplicateForm",
  NursingFormDelete: "NursingFormBuilder/DeleteForm",
  NursingFormRestore: "NursingFormBuilder/RestoreForm",
  NursingFormExport: "NursingFormBuilder/ExportForm",
  NursingFormImport: "NursingFormBuilder/ImportForm",
  NursingFormUploadFile: "NursingFormBuilder/UploadFile",
  NursingFormSaveEntryPdf: "NursingFormBuilder/SaveEntryPdf",
  NursingFormDoc: "NursingFormBuilder/Doc",
  NursingFormFile: "NursingFormBuilder/File",
  NursingFormSaveEntry: "NursingFormBuilder/SaveEntry",
  NursingFormEntry: "NursingFormBuilder/Entry",
  NursingFormEntries: "NursingFormBuilder/Entries",
  NursingFormFormEntries: "NursingFormBuilder/FormEntries",
  NursingFormLogPrint: "NursingFormBuilder/LogPrint",
  NursingFormPrintLog: "NursingFormBuilder/PrintLog",
  NursingFormUserPrefs: "NursingFormBuilder/UserPrefs",
  NursingFormSaveUserPrefs: "NursingFormBuilder/SaveUserPrefs",

  PreRegistrationPageConfiguration: "DoctorDisplay/PreRegistrationPageConfiguration",

  // Pharmacy dashboards - item history, pharmaceutical items and the history popup
  PharmacyDashboardFilters: "PharmacyDashboard/GetDashboardFilters",
  // Surgical Package screen
  SurgicalPackageIPDPatients: "SurgicalPackage/SearchIPDPatients",
  SurgicalPackageSave: "SurgicalPackage/SaveSurgicalPackage",
  SurgicalPackageSearch: "SurgicalPackage/SearchSurgicalPackage",
  SurgicalPackagePrint: "SurgicalPackage/PrintSurgicalPackage",
  SurgicalPackageListPrint: "SurgicalPackage/PrintSurgicalPackageList",
  PharmacyCurrentInventory: "PharmacyDashboard/GetCurrentInventory",
  // Sub Category Stock Dashboard - upar wale endpoint se alag, taaki chalu
  // Item History Dashboard par koi asar na pade.
  PharmacyInventoryBySubCategory:
    "PharmacyDashboard/GetInventoryBySubCategory",
  PharmacySalesStatistics: "PharmacyDashboard/GetSalesStatistics",
  PharmaceuticalItems: "PharmacyDashboard/GetPharmaceuticalItems",
  PharmacyItemPurchaseHistory: "PharmacyDashboard/GetItemPurchaseHistory",
  PharmacyItemTransactionHistory: "PharmacyDashboard/GetItemTransactionHistory",

  // IPD Billing Desk - MSG option for Nursing / Emergency staff
  IPDStaffActiveMessages: "IPDStaffMessage/GetActiveMessages",
  IPDStaffMessages: "IPDStaffMessage/GetMessages",
  IPDStaffMessageSave: "IPDStaffMessage/SaveMessage",
  IPDStaffMessageDelete: "IPDStaffMessage/DeleteMessage",
  // KMSI B9 - medicine packing machine link (backend service to build; see docs/pharmacy-safety/B9-packing-machine-link.md)
  PharmacyPackingMachineSendOrder: "Pharmacy/PackingMachine/SendOrder",
  PharmacyPackingMachineOrderStatus: "Pharmacy/PackingMachine/OrderStatus",
  // Pharmacy waiting-area display (patient-facing), polled every 20 s
  PharmacyDispenseQueue: "Pharmacy/DispenseQueue",
  // Pharmacy Issue - Previous Bills popup (repeat medicine)
  PharmacyPatientPreviousBills: "Pharmacy/PatientPreviousBills",
  PharmacyPreviousBillItems: "Pharmacy/PreviousBillItems",
  // Pharmacy Issue > Pending Prescription: print the doctor's lines (buy outside)
  PharmacyPrescriptionPrintLines: "Pharmacy/PrescriptionPrintLines",
  PharmacyPrescriptionPrintPdf: "Pharmacy/PrescriptionPrintPdf",
  // KMSI - pharmacy notes written for a patient (Reprint > Patient Note / Issue > Patient Notes)
  PharmacyPatientNotes: "Pharmacy/PatientNotes",
  PharmacyPatientNoteSave: "Pharmacy/PatientNoteSave",
  GetCensusPanels: "CensusReport/GetCensusPanels",
  GetCensusReport: "CensusReport/GetCensusReport",
  OccupancyByDoctor: "CensusReport/OccupancyByDoctor",
  PanelAdmissionDischarge: "CensusReport/PanelAdmissionDischarge",
  DailyCensus: "CensusReport/DailyCensus",
  OutstandingPatient: "AllReport/OutstandingPatient",
  GetInOutHouseReport: "InOutHouseReport/GetInOutHouseReport",
  // Occupancy Dashboard: occupancy, ward / floor census and panel intimation on one screen
  OccupancyDashboardPanels: "OccupancyDashboard/GetPanels",
  OccupancyDashboardReport: "OccupancyDashboard/GetReport",
  OccupancyDashboardReportPdf: "OccupancyDashboard/GetReportPdf",

  /* Purchase > Quotation Master (6 Oct 2026) - a generic-led quotation kept as its own
     document. Deliberately NOT QuotationAndCompare: these never touch f_storeitemrate. */
  QuotationMasterGetNextNo: "QuotationMaster/GetNextQuotationNo",
  QuotationMasterSave: "QuotationMaster/SaveQuotationMaster",
  QuotationMasterUpdate: "QuotationMaster/UpdateQuotationMaster",
  QuotationMasterList: "QuotationMaster/BindQuotationMasterList",
  QuotationMasterDetail: "QuotationMaster/GetQuotationMasterDetail",
  QuotationMasterDelete: "QuotationMaster/DeleteQuotationMaster",

  /* Loyalty coins (19 Oct 2026) - earn on OPD/IPD bills, redeem on the OPD booking screen. */
  LoyaltyCoinGetMaster: "LoyaltyCoin/GetMaster",
  LoyaltyCoinSaveMaster: "LoyaltyCoin/SaveMaster",
  LoyaltyCoinGetSummary: "LoyaltyCoin/GetSummary",
  LoyaltyCoinSendRedeemOtp: "LoyaltyCoin/SendRedeemOtp",
  LoyaltyCoinVerifyRedeemOtp: "LoyaltyCoin/VerifyRedeemOtp",
  LoyaltyCoinReleaseRedeem: "LoyaltyCoin/ReleaseRedeem",
  LoyaltyCoinOnBillSaved: "LoyaltyCoin/OnBillSaved",
  // Communication Configuration (SMS / Email / WhatsApp)
  CommMeta: "CommunicationConfig/Meta",
  CommEventList: "CommunicationConfig/EventList",
  CommEventGet: "CommunicationConfig/EventGet",
  CommEventValidateQuery: "CommunicationConfig/EventValidateQuery",
  CommEventSave: "CommunicationConfig/EventSave",
  CommEventToggleChannel: "CommunicationConfig/EventToggleChannel",
  CommVendorList: "CommunicationConfig/VendorList",
  CommVendorGet: "CommunicationConfig/VendorGet",
  CommVendorSave: "CommunicationConfig/VendorSave",
  CommVendorTestSend: "CommunicationConfig/VendorTestSend",
  CommLogSummary: "CommunicationConfig/LogSummary",
  CommLogList: "CommunicationConfig/LogList",
  CommLogDetail: "CommunicationConfig/LogDetail",
  CommLogRetry: "CommunicationConfig/LogRetry",
  CommRunNow: "CommunicationConfig/RunNow",
  CommDlrReceive: "CommunicationDlr/Receive",

  /* Hospital Quality Management (HQM) - NABH quality department (3 Nov 2026). */
  HqmMe: "Hqm/Me",
  HqmEmployeeSearch: "Hqm/EmployeeSearch",
  HqmIndicatorList: "Hqm/IndicatorList",
  HqmIndicatorSave: "Hqm/IndicatorSave",
  HqmIndicatorTarget: "Hqm/IndicatorTarget",
  HqmIndicatorSourceQuery: "Hqm/IndicatorSourceQuery",
  HqmValues: "Hqm/Values",
  HqmMatrix: "Hqm/Matrix",
  HqmIndicatorDetail: "Hqm/IndicatorDetail",
  HqmEvidence: "Hqm/Evidence",
  HqmRecalculate: "Hqm/Recalculate",
  HqmValueSave: "Hqm/ValueSave",
  HqmJustify: "Hqm/Justify",
  HqmPeriodSubmit: "Hqm/PeriodSubmit",
  HqmPeriodChecks: "Hqm/PeriodChecks",
  HqmPeriodValidate: "Hqm/PeriodValidate",
  HqmPeriodReturn: "Hqm/PeriodReturn",
  HqmPeriodApprove: "Hqm/PeriodApprove",
  HqmPeriodReopen: "Hqm/PeriodReopen",
  HqmPatientLookup: "Hqm/PatientLookup",
  HqmIncidentSave: "Hqm/IncidentSave",
  HqmIncidentList: "Hqm/IncidentList",
  HqmIncidentGet: "Hqm/IncidentGet",
  HqmIncidentUpdate: "Hqm/IncidentUpdate",
  HqmIncidentRcaSave: "Hqm/IncidentRcaSave",
  HqmCapaList: "Hqm/CapaList",
  HqmCapaSave: "Hqm/CapaSave",
  HqmAuditTemplates: "Hqm/AuditTemplates",
  HqmAuditRuns: "Hqm/AuditRuns",
  HqmAuditSample: "Hqm/AuditSample",
  HqmAuditRunSave: "Hqm/AuditRunSave",
  HqmOEList: "Hqm/OEList",
  HqmOEScoreSave: "Hqm/OEScoreSave",
  HqmOEImport: "Hqm/OEImport",
  HqmCommittees: "Hqm/Committees",
  HqmCommitteeGet: "Hqm/CommitteeGet",
  HqmCommitteeSave: "Hqm/CommitteeSave",
  HqmMemberSave: "Hqm/MemberSave",
  HqmMeetingSave: "Hqm/MeetingSave",
  HqmActionItemSave: "Hqm/ActionItemSave",
  HqmDocuments: "Hqm/Documents",
  HqmDocumentSave: "Hqm/DocumentSave",
  HqmLicences: "Hqm/Licences",
  HqmLicenceSave: "Hqm/LicenceSave",
  HqmFileUpload: "Hqm/FileUpload",
  HqmFileView: "Hqm/FileView",
  HqmPatientVoice: "Hqm/PatientVoice",
  HqmAccessList: "Hqm/AccessList",
  HqmAccessSave: "Hqm/AccessSave",
  HqmSettingSave: "Hqm/SettingSave",

  /* Prescription print language (22 Oct 2026) - each doctor's default language. */
  PrescriptionPrintLanguageGetDefault: "PrescriptionPrintLanguage/GetDefault",
  PrescriptionPrintLanguageSetDefault: "PrescriptionPrintLanguage/SetDefault",

  /* What the doctor usually prescribes for similar patients (counts only) - AI Prescription Suggestion. */
  DoctorPracticePatternSimilarCases: "DoctorPracticePattern/SimilarCases",

  /* Lab Reports and Trends - the doctor's EMR frame that replaced the fixed-list Investigation Manual Entry. */
  PatientLabReportSave: "PatientLabReport/SaveReport",
  PatientLabReportList: "PatientLabReport/GetReports",
  PatientLabReportGet: "PatientLabReport/GetReport",
  PatientLabReportTrends: "PatientLabReport/GetTrends",
  PatientLabReportFile: "PatientLabReport/GetReportFile",
  PatientLabReportDelete: "PatientLabReport/DeleteReport",
  PredictionStatus: "PredictionDashboard/Status",
  PredictionRefresh: "PredictionDashboard/Refresh",
  PredictionConditions: "PredictionDashboard/Conditions",
  PredictionOverview: "PredictionDashboard/Overview",
  PredictionClinical: "PredictionDashboard/Clinical",
  PredictionFinancial: "PredictionDashboard/Financial",
  PredictionCapacity: "PredictionDashboard/Capacity",
  PredictionPincodeGeo: "PredictionDashboard/PincodeGeo",

  /* Purchase > Quotation Chart - read-only analysis over the same two tables. */
  QuotationAnalysisFilters: "QuotationAnalysis/BindAnalysisFilters",
  QuotationAnalysisData: "QuotationAnalysis/GetQuotationAnalysis",

  /* Create Purchase Order: which vendors a row may be raised against, from whichever
     master POVendorSource names (quotation rates, or Vendor Item Mapping). */
  POGetItemVendorOptions: "POPriceLookup/GetItemVendorOptions",
  /* PO by supplier: everything one vendor supplies, from whichever master the flag names. */
  POGetVendorItems: "POPriceLookup/GetVendorItems",

  /* Purchase > Vendor Item Mapping - vendor-wise agreed terms per store item, with the
     vendor's own quotations for the item's sub generic shown on hover. */
  VendorItemMapBindItems: "VendorItemMap/BindVendorItems",
  VendorItemMapGetMapped: "VendorItemMap/GetVendorItemMap",
  VendorItemMapQuotations: "VendorItemMap/GetVendorGenericQuotations",
  VendorItemMapSave: "VendorItemMap/SaveVendorItemMap",
  VendorItemMapDelete: "VendorItemMap/DeleteVendorItemMap",
  VendorItemMapSearchItems: "VendorItemMap/SearchMappableItems",
  VendorItemMapByItem: "VendorItemMap/GetItemVendorMap",
  VendorItemMapList: "VendorItemMap/BindVendorItemMapList",
  // DPDP Act - Data Privacy (4 Nov 2026)
  DpdpConfig: "Dpdp/Config",
  DpdpSettings: "Dpdp/Settings",
  DpdpSettingSave: "Dpdp/SettingSave",
  DpdpAccessSave: "Dpdp/AccessSave",
  DpdpEmployeeSearch: "Dpdp/EmployeeSearch",
  DpdpNoticeList: "Dpdp/NoticeList",
  DpdpNoticeSave: "Dpdp/NoticeSave",
  DpdpNoticePreview: "Dpdp/NoticePreview",
  DpdpPurposeSave: "Dpdp/PurposeSave",
  DpdpServiceMapList: "Dpdp/ServiceMapList",
  DpdpServiceMapSave: "Dpdp/ServiceMapSave",
  DpdpServiceMapDelete: "Dpdp/ServiceMapDelete",
  DpdpCommPurposeSave: "Dpdp/CommPurposeSave",
  DpdpProcessorList: "Dpdp/ProcessorList",
  DpdpProcessorSave: "Dpdp/ProcessorSave",
  DpdpProcessorSuggest: "Dpdp/ProcessorSuggest",
  DpdpRetentionList: "Dpdp/RetentionList",
  DpdpRetentionSave: "Dpdp/RetentionSave",
  DpdpRetentionRun: "Dpdp/RetentionRun",
  DpdpDashboard: "Dpdp/Dashboard",
  DpdpStatus: "Dpdp/Status",
  DpdpStatusBulk: "Dpdp/StatusBulk",
  DpdpPatientSave: "Dpdp/PatientSave",
  DpdpSend: "Dpdp/Send",
  DpdpSessionStatus: "Dpdp/SessionStatus",
  DpdpAssisted: "Dpdp/Assisted",
  DpdpDefer: "Dpdp/Defer",
  DpdpAdmissionCheck: "Dpdp/AdmissionCheck",
  DpdpRecord: "Dpdp/Record",
  DpdpWithdraw: "Dpdp/Withdraw",
  DpdpRestrict: "Dpdp/Restrict",
  DpdpLegalHold: "Dpdp/LegalHold",
  DpdpNomineeSave: "Dpdp/NomineeSave",
  DpdpMerge: "Dpdp/Merge",
  DpdpSummary: "Dpdp/Summary",
  DpdpMyPrivacyLink: "Dpdp/MyPrivacyLink",
  DpdpDisclose: "Dpdp/Disclose",
  DpdpAccessBatch: "Dpdp/AccessBatch",
  DpdpAiLog: "Dpdp/AiLog",
  DpdpAccessLogReport: "Dpdp/AccessLogReport",
  DpdpDisclosureList: "Dpdp/DisclosureList",
  DpdpRequestList: "Dpdp/RequestList",
  DpdpRequestGet: "Dpdp/RequestGet",
  DpdpRequestSave: "Dpdp/RequestSave",
  DpdpRequestNote: "Dpdp/RequestNote",
  DpdpBreachList: "Dpdp/BreachList",
  DpdpBreachGet: "Dpdp/BreachGet",
  DpdpBreachSave: "Dpdp/BreachSave",
  DpdpBreachFindAffected: "Dpdp/BreachFindAffected",
  DpdpBreachNotify: "Dpdp/BreachNotify",
  DpdpLegacyQueue: "Dpdp/LegacyQueue",
  DpdpPublicSession: "DpdpPublic/Session",
  DpdpPublicSubmit: "DpdpPublic/Submit",
  DpdpPublicRaiseRequest: "DpdpPublic/RaiseRequest",
  DpdpPublicNominee: "DpdpPublic/Nominee",
  DpdpPublicSummary: "DpdpPublic/Summary",
  DpdpPublicInfo: "DpdpPublic/Info",
  // Central AI - key in fin_global_resources (4 Nov 2026)
  AiStatus: "AI/Status",
  AiConfigSave: "AI/ConfigSave",
  AiTest: "AI/Test",
  AiTranslateLabels: "AI/TranslateLabels",

  // Priyam
  PrintIUIConsentForm: "IVF/IVF/PrintIUIConsentForm",
  SaveIVFDonorConsent: "IVF/IVF/SaveIVFDonorConsent",
  ReportDispatchBindInvestigation: "/EDP/LaboratorySetup/BindInvestigation",


};
