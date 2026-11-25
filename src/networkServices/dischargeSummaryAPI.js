import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const DischargeSummaryBindReportHeader = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryBindReportHeader,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryDRHeader = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryDRHeader,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryBindConsultant = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.DischargeSummaryBindConsultant}?TID=${TID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryConsultantAdd = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryConsultantAdd,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryDeleteConsultant = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryDeleteConsultant,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryBindRoute = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryBindRoute,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "Something Went Wrong");
  }
};

export const DischargeSummaryBindTimeofNextDose = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryBindTimeofNextDose,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryBindMeal = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryBindMeal,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryBindTime = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryBindTime,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryEMRMedicine = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryEMRMedicine,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryICDDescriptionSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryICDDescriptionSave,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryBindPatient = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DischargeSummaryBindPatient}?TID=${TID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryICDCodeRemove = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryICDCodeRemove,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryICDMasterSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryICDMasterSave,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

// master

export const DischargeSummarySaveEMRHeader = async (HeaderName) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DischargeSummarySaveEMRHeader}?HeaderName=${HeaderName}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryBindEMRHeader = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryBindEMRHeader,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DischargeSummarySaveEMRHeaderTable = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls?.DischargeSummarySaveEMRHeaderTable,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DischargeSummaryDeleteEMRHeader = async (HeaderID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
    };
    const data = await makeApiRequest(
      `${apiUrls?.DischargeSummaryDeleteEMRHeader}?HeaderID=${HeaderID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

// set Header Deptwise

export const DischargeSummaryBindHeaderList = async (Department) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DischargeSummaryBindHeaderList}?Department=${Department}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummarySaveSetHeaderDeptWise = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummarySaveSetHeaderDeptWise,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

// setHEaderMandaortoy

export const DischargeSummaryBindHeader = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      apiUrls?.DischargeSummaryBindHeader,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryBindDischargeType = async (DischargeName) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DischargeSummaryBindDischargeType}?DischargeName=${DischargeName}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

// Set Header Mandatory: save one Discharge Type + Header pair
// ({ dischargeType, headerType, finalDiagnosisId? })
export const DischargeSummarySaveDischargeType = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      apiUrls?.DischargeSummarySaveDischargeType,
      { method: "post", data: payload }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DischargeSummaryDeleteDischargeType = async (Id) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls?.DischargeSummaryDeleteDischargeType}?Id=${Id}`,
      { method: "delete" }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsGetDRDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.DRDetailsGetDRDetails, options);
 store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsLoadHeaders = async (
  department,
  DischargeName,
  TransactionID
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsLoadHeaders}?department=${department}&DischargeName=${DischargeName}&TransactionID=${TransactionID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsLoadTemplates = async (TempHeaderID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsLoadTemplates}?TempHeaderID=${TempHeaderID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsTemplateChange = async (TemplateID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsTemplateChange}?TemplateID=${TemplateID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsTemplateDelete = async (TemplateID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "delete",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsTemplateDelete}?TemplateID=${TemplateID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsSaveDischargeSummary = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.DRDetailsSaveDischargeSummary,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

// templates saved under a Final Diagnosis (icd_id): the latest one per header, with its text
export const DRDetailsLoadTemplatesByDiagnosis = async (icdID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsLoadTemplatesByDiagnosis}?IcdID=${encodeURIComponent(icdID)}`,
      { method: "get" }
    );
    return data;
  } catch (error) {
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsBindDetails = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsBindDetails}?TransactionID=${transactionID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsPatientTemplateDelete = async (
  transactionID,
  ReportTypeHeaderID
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "delete",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsPatientTemplateDelete}?TransactionID=${transactionID}&ReportTypeHeaderID=${ReportTypeHeaderID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsBindApprovalDoctor = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsBindApprovalDoctor}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsApproveDischargeSummary = async (
  ApprovedDoctorID,
  TransactionID,
  Type,
  Reason = ""
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsApproveDischargeSummary}?ApprovedDoctorID=${ApprovedDoctorID || 0}&TransactionID=${TransactionID}&Type=${Type}&Reason=${encodeURIComponent(
        Reason || ""
      )}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

/**
 * Amendment history: kis user ne, kab aur kya kiya.
 * ActionType "UnApprove" ya "Delete"; khaali bhejne par dono aati hain.
 */
export const DRDetailsGetAmendmentHistory = async (
  TransactionID,
  ActionType = ""
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.DRDetailsGetAmendmentHistory}?TransactionID=${TransactionID}&ActionType=${ActionType || ""}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const DRDetailsPrintDischargeReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const response = await makeApiRequest(
      `${apiUrls?.DRDetailsPrintDischargeReport}`,
      options
    );

    return response;
  } catch (error) {
    console.error("Error in DRDetailsPrintDischargeReport:", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const BindEMRMedicine = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.BindEMRMedicine}?TID=${TID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const DeleteEMRMedicine = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.DeleteEMRMedicine, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const NuclearMedicineApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.NuclearMedicine, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const GetNuclearMedicinesData = async (date) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.GetNuclearMedicineTable}?InvestigationDate=${date}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const UpdateNuclearMedTest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.UpdateNuclearMedTest, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const BindEMRInvItemApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.BindEMRInvItem, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const SaveEMRInvItemApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.SaveEMRInvItem, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

/** Everything clinical recorded for one admission (notes, OT, labs, reports, medicines). Read only. { TID } */
export const DischargeClinicalRecordApi = async (payload) => {
  try {
    return await makeApiRequest(apiUrls?.DischargeClinicalRecord, { method: "post", data: payload });
  } catch (error) {
    console.log(error, "SomeThing Went Wrong");
  }
};
