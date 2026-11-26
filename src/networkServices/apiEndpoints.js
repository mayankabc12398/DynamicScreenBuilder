// URL strings only. Importing API modules here created a cycle back into store.js
// (logoutSlice -> apiEndpoints -> CollectionReportApi -> store) and broke start-up.
export const apiUrls = {
  // onBoarding
  // onBoarding
  // Auth
  login: "Login/Login",
  LoginGetEmployeeForForget: "Login/GetEmployeeForForget",
  LoginSendForgetPassword: "Login/SendForgetPassword",
  PageConfigurationURL: "CommonAPI/PageConfiguration",
  GetLoginPageImageURL: "CommonAPI/GetLoginPageImage",
  CKEditorShortKeyAPIControls: "CommonAPI/ShortKeyAPIControls",

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
  getRoleList: "MasterPage/CentreWiseRoleList",
  EmployeeWiseCentreList: "MasterPage/EmployeeWiseCentreList",
  BindMenuList: "MasterPage/BindMenu",
  getNotificationDetail: "MasterPage/Notification",
  BindFrameMenuByRoleID: "MasterPage/BindFrameMenuByRoleID",
  CentreWiseCacheByCenterID: "PatientControl/CentreWiseCache",

  // DirectPatientReg Mayank START
  CentreWisePanelControlCache: "PanelControl/CentreWisePanelControlCache",
  GetPanelDocument: "PanelControl/GetPanelDocument",
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

// payment control
  // opdServiceBooking ----sahil--
  Oldpatientsearch: "PatientControl/Oldpatientsearch",
  BindReferDoctor: "PatientControl/BindReferDoctor",
  // Agent master for OPD booking
  BindRefferalType: "CommonAPI/bindReferalType",
  // IPD frame tab "Attendant Details"
  // Field Boy - master_fieldboy. OPD Booking par PRO ki jagah cash panel me.
  BindDepartment: "CommonAPI/bindDepartment",
  BindDoctorDept: "CommonAPI/bindDoctorDept",
  GetAuthorization: "CommonAPI/GetAuthorization",
  BindResourceList: "CommonAPI/BindResourceList",

  GetDoctorAppointmentTimeSlotConsecutive:
    "OPDServiceBooking/GetDoctorAppointmentTimeSlotConsecutive",

// Opd Advance
  GetAdvanceReason: "OPDAdvance/GetAdvanceReason",
  CreateAdvanceReason: "OPDAdvance/CreateAdvanceReason",

// Confirmation
  getAppointmentDetails: "Confirmation/GetApppointmentDetails",
  updateAppointmentShedule: "Confirmation/UpdateDoctorAppointmentSchedule",
  GetPatientDoctorAppointmentDetails:
    "OPDServiceBooking/GetPatientDoctorAppointmentDetails",
  // Receipt_Reprint
  UpdateAppointmentStatus: "Confirmation/UpdateAppointmentStatus",
  // Card Print
  getBindSubCategory: "CommonAPI/BindSubCategory",

  // debitCreditNote
  GetDepartmentItemDetails: "DebitCredit/GetDepartmentItemDetails",

/* Patient Return (New). Its own controller, copied from DebitCredit so the new screen
     can change without any of it reaching the screen already in use. */

// Token Management
  getBindCenterAPI: "CommonAPI/BindCentre",
  getBindFloorAPI: "ModalityMaster/BindFloor",
  BindCategory: "CommonAPI/BindCategory",
  GetPanelName: "CommonAPI/GetPanel",

  // Reports
  // BindDetailUser: "DailyCollection/BindUser",
  // BindTypeOfTnx: "DailyCollection/BindTypeOfTnx",
  // BindSpeciality: "CommonAPI/BindSpeciality",
  LoadOPDDiagnosisItems: "CommonAPI/LoadOPDDiagnosisItems",

  // Reports

  BindSpeciality: "CommonAPI/BindSpeciality",

// View Consultation // Doctor API
  // SearchList: "ViewConsultation/SearchList",
  SearchList: "Doctor/SearchPatientConsultation",

  // Chief Complaint Template Mapping
  FileClose: "PrescriptionAdvice/FileClose",
  DoctorNotes: "PrescriptionAdvice/DoctorNotes",
// doctor's vitals strip (eight values only)
  BindDetails: "VitalSign/BindDetails",
  SaveSMSDoctorsEmployee: "EDP/SMSMaster/SaveSMSDoctorsEmployee",
  SearchPatient: "ViewLabReports/SearchPatient",
  SearchPatient: "ViewLabReports/SearchPatient",

// Dashboard API

  HIMSDashboard: "Dashboard/HIMSDashboard",

  // IPDHelpDesk
  Report: "IPDHelpDesk/Report",

// Billings
  RoomType: "IPDDetail/RoomType",
  BillingCategory: "IPDDetail/BillingCategory",
  GetBindDepartment: "PatientBilling/GetBindDepartment",
  // Har department ek saath - IPD Billing ke liye, jo sab khole rakhta hai.
  Rate: "IPDAdvance/Rate",

// Category Medication Record
  Route: "NursingWard/Route",

// Emergency API URL END

  /* Day Care API URL START
     Every one of these is served by DayCareController, which is standalone - it
     shares no endpoint with Emergency, so a change on either side cannot reach
     the other. The day care EPISODE is still an emergency_patient_details row,
     which is why the board's sub-screens (billing, clearance, discharge, the
     nursing forms) keep using the Emergency endpoints above on a day care
     TransactionID, unchanged. */
  /* Books a whole package's sessions in one transaction. Reachable only when
     fin_global_resources.DayCarePackageBooking = '1'. */
  /* Every medicine and investigation ordered for a visit, each with whether it
     has been billed. Read-only. */
  /* Writes medicines/investigations to patient_medicine and patient_test against
     the day care visit, so Pharmacy and the front desk see them. */
  /* The Day Care counterpart of OPDServiceBooking/BindInvestigation - same row
     shape, reached through the day care episode instead of an appointment. */
  /* Adult Nursing Initial Assessment. Keyed on the visit, not on day care, so
     the same screen and the same row serve IPD and Emergency too. */
  /* Every milestone of one visit and the gaps between them. Read-only. */
  /* Stamps the bill onto sessions that were booked before it existed. */

  // Pharmecy API URL STart
  PharmacyAddItemURL: "Pharmacy/AddItem",
  PharmacyAddItemURL: "Pharmacy/AddItem",

// Credit issue Api Url Satrt
  IndentIssueAddItem: "Pharmacy/PatientIndentIssueIPD/IndentIssueAddItem",

//GRN API

  BindVendor: "GRN/BindVendor",

  // Tools API
  // consume
  View: "IssueDepartment/View",

  // viewRequisition

  Reject: "ViewRequisition/Reject",

// "LaboratoryCountReport/LabReport",
  // Dispatch API end here

holdReason: "MachineResultEntry/GetUnHoldReason",

// EDP Start
  // Centre Management STart
  // Centre Access Rights - the two indent columns write IsDepartmentIndent /
  // IsPatientIndent on f_centre_role. They are role-level flags, not panel or
  // role mappings, so they have their own endpoints.
  // Centre Management End
  GetSubScreenMenuByRoleURL: "MasterPage/GetSubScreenMenuByRole",

  // Laboratory Mangagement
  // Formula Master
  Formula: "EDP/LaboratorySetup/Formula",

//prince-item

CommonAPIGetDateTimeNow: "CommonAPI/GetDateTimeNow",

//dietMaster >> map diet component master
  MenuName: "EDP/DietMaster/MenuName",

// EDP End   /
  // OT booking Start here
  // OT booking END here
  /*  -----------shoib start------- */

// HR - EMPLOYEE TYPE MASTER
  //Nursing ward

  /*  -----------shoib End------- */
  /*himanshu gupta -starts*/

// caridiopulmonary bypass

/*himanshu gupta -end*/

// Note Create abhijeet
  // Note Finder
  // priyam
  // Shashikant Kumar
  BindReportData: "Master/ReportName",

// Note Finder
  getData: "NursingWard/Forms/GetData",
  //Nursing Ward
  bindDetails: "NursingWard/Forms/bindDetails",
  save: "NursingWard/Forms/Save",

  // priyam
  // priyam
  // Shashikant Kumar
  BindReportData: "Master/ReportName",

//Akhilesh-Start

  NewBindglobalresources: "CommonAPI/NewBindglobalresources",

// BindFrameMenuByRoleID: "MasterPage/BindFrameMenuByRoleID",

  ValidateUserToBill: "Login/ValidateUserToBill",

  // -------- Barcode Generate (Discount OTP) --------
  GetGlobalResources: "DiscountOTP/GetGlobalResources",
  ConfirmationCancellationRights:"Confirmation/AfterConfirmationCancellationRights" ,

  ConfirmationCancellationRights:
    "Confirmation/AfterConfirmationCancellationRights",

  // Dynamic screen builder — the API catalog it reads to offer controller /
  // endpoint dropdowns (HospediaAPI/ScreenBuilder).
  ScreenBuilderGetControllers: "ScreenBuilderCatalog/GetControllers",
  ScreenBuilderGetEndpoints: "ScreenBuilderCatalog/GetEndpoints",

  // Dynamic screen builder — storage for the screens it designs
  // (HospediaAPI/ScreenBuilder, tables sb_screen / sb_screen_version / sb_template).
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
  // Role > employee > screen > boxes: the permission page's default view.
  ScreenBuilderGetRoleEmployees: "ScreenBuilder/GetRoleEmployees",
  ScreenBuilderGetRoleScreenAccess: "ScreenBuilder/GetRoleScreenAccess",
  ScreenBuilderSaveRoleAccessBatch: "ScreenBuilder/SaveRoleAccessBatch",
  ScreenBuilderBindRoleMasterList: "EDP/RoleAndDepartmentSetUp/BindRoleMasterList",
  // A screen as an app page: module (f_menumaster) > roles (f_file_role) > employees (user_pageaccess).
  ScreenPageAccessGetMenus: "ScreenPageAccess/GetMenus",
  ScreenPageAccessGetAccess: "ScreenPageAccess/GetAccess",
  ScreenPageAccessSaveAccess: "ScreenPageAccess/SaveAccess",

// IPD Billing Desk - MSG option for Nursing / Emergency staff
  // KMSI B9 - medicine packing machine link (backend service to build; see docs/pharmacy-safety/B9-packing-machine-link.md)
  // Pharmacy waiting-area display (patient-facing), polled every 20 s
  // Pharmacy Issue - Previous Bills popup (repeat medicine)
  // Pharmacy Issue > Pending Prescription: print the doctor's lines (buy outside)
  // KMSI - pharmacy notes written for a patient (Reprint > Patient Note / Issue > Patient Notes)
  // Occupancy Dashboard: occupancy, ward / floor census and panel intimation on one screen

  /* Purchase > Quotation Master (6 Oct 2026) - a generic-led quotation kept as its own
     document. Deliberately NOT QuotationAndCompare: these never touch f_storeitemrate. */

  /* Loyalty coins (19 Oct 2026) - earn on OPD/IPD bills, redeem on the OPD booking screen. */
  // Communication Configuration (SMS / Email / WhatsApp)

  /* Hospital Quality Management (HQM) - NABH quality department (3 Nov 2026). */

  /* Prescription print language (22 Oct 2026) - each doctor's default language. */

  /* What the doctor usually prescribes for similar patients (counts only) - AI Prescription Suggestion. */

  /* Lab Reports and Trends - the doctor's EMR frame that replaced the fixed-list Investigation Manual Entry. */

  /* Purchase > Quotation Chart - read-only analysis over the same two tables. */

  /* Create Purchase Order: which vendors a row may be raised against, from whichever
     master POVendorSource names (quotation rates, or Vendor Item Mapping). */
  /* PO by supplier: everything one vendor supplies, from whichever master the flag names. */

  /* Purchase > Vendor Item Mapping - vendor-wise agreed terms per store item, with the
     vendor's own quotations for the item's sub generic shown on hover. */
  // DPDP Act - Data Privacy (4 Nov 2026)
  DpdpConfig: "Dpdp/Config",
  DpdpAccessBatch: "Dpdp/AccessBatch",
  DpdpAiLog: "Dpdp/AiLog",


  // Print builder
  PrintBuilderGeneratePdf: "PrintBuilder/GeneratePdf",
  PrintBuilderStatus: "PrintBuilder/Status",
  PrintBuilderEngineInfo: "PrintBuilder/EngineInfo",
  PrintBuilderTemplates: "PrintBuilder/Templates",
  PrintBuilderTemplate: "PrintBuilder/Template",
  PrintBuilderCreateTemplate: "PrintBuilder/CreateTemplate",
  PrintBuilderSaveTemplate: "PrintBuilder/SaveTemplate",
  PrintBuilderDuplicateTemplate: "PrintBuilder/DuplicateTemplate",
  PrintBuilderDeleteTemplate: "PrintBuilder/DeleteTemplate",
  PrintBuilderSetTemplateCategory: "PrintBuilder/SetTemplateCategory",
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
  PrintBuilderDeleteAsset: "PrintBuilder/DeleteAsset",
  PrintBuilderAsset: "PrintBuilder/Asset",
  PrintBuilderPreviewPdf: "PrintBuilder/PreviewPdf",
  PrintBuilderGenerateBatchPdf: "PrintBuilder/GenerateBatchPdf",
  PrintBuilderGenerateExport: "PrintBuilder/GenerateExport",
  PrintBuilderPreviewExport: "PrintBuilder/PreviewExport",
  PrintBuilderWhereUsed: "PrintBuilder/WhereUsed",
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
};
