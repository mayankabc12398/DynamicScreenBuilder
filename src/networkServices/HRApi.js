import makeApiRequest from "./axiosInstance";
import { apiUrls } from "./apiEndpoints";
import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import { apiUrlsNew } from "./newApiEndpoints";
import { stream } from "xlsx-js-style";

export const getAllMapingsDataApi = async (centerId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls.EDPAllMappingsURL}?CenterId=${centerId}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SavesMappingsDetailsApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SavesMappingsDetails}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const getAllBindEmployeeNameApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
    };

    const data = await makeApiRequest(`${apiUrls.BindEmployeeName}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const SearchRequsertLeaveApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SearchRequsertLeave}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const HRHRHRDepartmentApi = async (centerId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(`${apiUrls.HRHRHRDepartment}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRHRHRDesignationApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(`${apiUrls.HRHRHRDesignation}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRRHREmployeeMasterApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRHRHREmployeeMaster}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRHRSaveIssueWarningSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.HRHRSaveIssueWarning}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const HRHRBindIssueWarningApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(
      `${apiUrls.HRHRBindIssueWarning}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const HRHRHRsaveInterRequestDataAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.HRHRHRsaveInterRequestData}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const HRHRHRBindpayInterRequestFormApi = async (
  EmployeeID,
  centerId,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRHRHRBindpay_InterRequestForm}?EmployeeID=${EmployeeID}&CenterID=${centerId}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const GetInterRequestDataByIdApi = async (id, centerId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls.GetInterRequestDataById}?ID=${id}&CenterID=${centerId}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const HRUpdateInterRequestDataApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.HRUpdateInterRequestData}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};
// induction Cheak List form
export const SaveInductionChecklistDetailApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveInductionChecklistDetail}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetInductionChecklistDetail = async (employeeid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetInductionChecklistDetail}?EmployeeID=${employeeid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveHRPublicHoliDaysMasterApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveHRPublicHoliDaysMaster}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const BindHRPublicHoliDaysApi = async (id, centerId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls.BindHRPublicHoliDays}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRbindBackendDataApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(`${apiUrls.HRbindBackendData}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRsaveEmployeeClearanceAuthorityApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.HRsaveEmployeeClearanceAuthority}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const HRSaveAppraisalQuestionApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.HRSaveAppraisalQuestion}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const HRBindAppraisalQuestionDataApi = async (part) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRBindAppraisalQuestionData}?Part=${part}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRGetAppraisalQuestionByIdApi = async (cqid, part) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRGetAppraisalQuestionById}?CQID=${cqid}&Part=${part}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRUpdateAppraisalQuestion = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(
      `${apiUrls.HRUpdateAppraisalQuestion}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRDeleteAppraisalQuestion = async (cqid, part) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRDeleteAppraisalQuestion}?CQID=${cqid}&Part=${part}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

// ----------leave master

export const HRLeaveTypeMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(`${apiUrls.HRLeaveTypeMaster}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const GetHRALeaveMasterData = async (filterType) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls.GetHRALeaveMasterData}?filterType=${filterType}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SaveHRLeaveMaster = async (payload) => {
  debugger;
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(`${apiUrls.SaveHRLeaveMaster}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRActionLeaveMaster = async (LeaveID, ACTIVE_DEACTIVE) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRActionLeaveMaster}?LeaveID=${LeaveID}&IsActive=${ACTIVE_DEACTIVE}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

// Hr Bank Master
export const HRSaveNewBankMaster = async (BankName, BankCode) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRSaveNewBankMaster}?BankName=${BankName}&BankCode=${BankCode}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const BindBankMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BindBankMaster}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const BindBranchData = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: {}, // empty payload, per backend contract
    };
    const data = await makeApiRequest(`${apiUrls.BindBranchData}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const BindHRBankMasterDetail = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindHRBankMasterDetail}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRSaveBranchMaster = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(`${apiUrls.HRSaveBranchMaster}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRUpdateBranchBankMasterDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(
      `${apiUrls.HRUpdateBranchBankMasterDetail}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

// Department  clearence master

export const HRSaveNewDepartment = async (Department, Priority) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };

    const data = await makeApiRequest(
      `${apiUrls.HRSaveNewDepartment}?Department=${Department}&Priority=${Priority}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRBindDepartmentBackendData = async (FilterType) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.HRBindDepartmentBackendData}?filterType=${FilterType}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const HRDepartmentActionParticular = async (particularID, isActive) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };
    const data = await makeApiRequest(
      `${apiUrls.HRDepartmentActionParticular}?particularID=${particularID}&isActive=${isActive}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const HRSaveDepartmentParticulars = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(
      `${apiUrls.HRSaveDepartmentParticulars}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

// HR Employeement Type Master
export const saveEmploymentType = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const data = await makeApiRequest(`${apiUrls.saveEmploymentType}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const BindBackendDataEmpTypeMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.BindBackendDataEmpTypeMaster}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const actionEmploymentType = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.actionEmploymentType}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const BindAllActiveEmployees = async (payload) => {
  store.dispatch(setLoading(true));
  try {
const url = `${apiUrlsNew.BindAllActiveEmployees}?DeptID=0&DesigID=0`; 
   const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
   throw error;
  }
};

export const saveEmployeeBioData = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.saveEmployeeBioData}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SearchEmployeeBioData = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SearchEmployeeBioData}?deptId=${payload?.deptID}&desigId=${payload?.desigID}&employeeId=${payload?.employeeId}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const bindEmployeeBioData = async (empid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.bindEmployeeBioData}?EmployeeID=${empid}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const saveDepartmentReq = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.saveDepartmentReq}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const GetDepartmentDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.GetDepartmentDetails}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const binddatebydata = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrlsNew.binddatebydata}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const GetTrainingDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.GetTrainingDetails}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const EmployeeSetUpApproval = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.EmployeeSetUpApproval}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const EmployeeSetUpReject = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.EmployeeSetUpReject}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const UpdateDepartmentReq = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.UpdateDepartmentReq}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SaveNewReportingPurpose = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveNewReportingPurpose}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SavePersonnelForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SavePersonnelForm}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const InductionChecklistprint = async (empid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.InductionChecklistprint}?id=${""}&Employeeid=${empid}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SearchPersonnelRequest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SearchPersonnelRequest}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const ApprovedRequest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrlsNew.ApprovedRequest}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SaveApprovalForwardRequestApproval = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveApprovalForwardRequestApproval}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SaveFinals = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrlsNew.SaveFinal}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const RejectPersonnelRequest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.RejectPersonnelRequest}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const ViewPersonnelFormProcessDetailJD = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.ViewPersonnelFormProcessDetailJD}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const ViewPersonnelFormProcessDetailpublish = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.ViewPersonnelFormProcessDetailpublish}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const ViewPersonnelFormProcessDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.ViewPersonnelFormProcessDetail}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SavePublish = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SavePublish}?reqID=${params?.id}&publishInNewsPaper=${params?.publishInNewsPaper}&publishInWebsite=${params?.publishInWebsite}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SearchInterView = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrlsNew.SearchInterView}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const SaveInterViewCandidateEntry = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveInterViewCandidateEntry}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const bindRequest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrlsNew.bindRequest}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SearchInterviewCandidate = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SearchInterviewCandidate}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SearchInterviewCand = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SearchInterviewCand}?ReqID=${payload?.reqID}&fromdate=${payload?.fromdate}&todate=${payload?.todate}&status=${payload?.status}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const QualificationSaveApi = async (payload)=>{
  store.dispatch(setLoading(true));
  try{
    const options = {
      method:"POST",
      data : payload
    }
    const data = await makeApiRequest(
      `${apiUrls.QualificationSave}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  }
  catch(error){
    store.dispatch(setLoading(false));
    console.log("Somthing went wrong : ")
    throw error
  }
}

export const SearchRoundDetailsApi = async (payload)=>{
  store.dispatch(setLoading(true));
  try{
    const options = {
      method : "POST",
      data : payload
    }
    const data = await makeApiRequest(
      `${apiUrls.SearchInterviewCandidate}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  }
  catch (error){
    store.dispatch(setLoading(false));
    console.log("Somthing went wrong : ")
    throw error
  }
} 

export const SearchInterViewRoundDetails = async (payload)=>{
  store.dispatch(setLoading(true));
  try{
    const options = {
      method :"POST",
      data : payload
    }
    const data = await makeApiRequest(
      `${apiUrls.SearchInterViewRoundDetails}`,
      options,
    )
    store.dispatch(setLoading(false))
    return data;
  }
  catch(error){
    store.dispatch(setLoading(false));
    console.log("Somthing went wrong")
    throw error
  }
}

export const SearchInterviewCandViewResume = async (candidateId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SearchInterviewCandViewResume}?candidateId=${candidateId}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const sendEmailCandidate = async (payload) => {
  debugger;
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.sendEmailCandidate}?url=${""}&EmailTo${payload?.email}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const SaveInterviewDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveInterviewRoundDetails}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log("Something went wrong");
    throw error;
  }
};

export const ReprintPersonnelPrint =  async (payload)=>{
  store.dispatch(setLoading(true));
  try{
    const options ={
      method : "POST",
      data  : payload
    };
    const data = await makeApiRequest(
     `${apiUrls.ReprintPersonnelForm}`,
     options,
    );
    store.dispatch(setLoading(false));
    return data;
  }
  catch (error){
    store.dispatch(setLoading(false));
    console.log('Somthing went wrong');
    throw error
  }
}

export const CloseJobProcess = async (payload)=>{
  store.dispatch(setLoading(true));
  try{
    const options ={
      method : "POST",
      data : payload
    };
    const data = await makeApiRequest(
      `${apiUrls.CloseJobRequestInterviewProcess}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data
  }
  catch (error){
    store.dispatch(setLoading(false))
    console.log("Somthig went wrong")
    throw error
  }
}

export const SearchCandidateAfterInterviewRound = async (payLoad)=>{
  store.dispatch(setLoading(true));
  try{
    const options = {
      method :"POST",
      data  :payLoad,
    }
    const data = await makeApiRequest(
      `${apiUrls.SearchCandidateAfterInterviewRound}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data
  }
  catch(error){
    store.dispatch(setLoading(false))
    console.log("somthing went wrong")
    throw error
  }
}

export const GetPreviousAcknowledgerdetails = async (payload)=>{
  store.dispatch(setLoading(true));
  try{
    const options = {
      method :"POST",
      data : payload,
    }
    const data = await  makeApiRequest(
      `${apiUrls.GetPreviousAcknowledgerdetails}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data
  }
  catch(error){
    store.dispatch(setLoading(false))
    throw error
  }
}
export const BindInterViewInvolvedEmployees = async ()=>{
  store.dispatch(setLoading(true));
  try{
    const options = {
      method : "get",
    }
    const data = await makeApiRequest(
      `${apiUrls.BindInterViewInvolvedEmployees}`,
      options,
    )
    store.dispatch(setLoading(false));
    return data
  }catch(error){
    store.dispatch(setLoading(false))
     throw error
  }
}




//Aditya  api end



export const SaveInterViewRound = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveInterViewRound}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const BindInterViewRound = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.BindInterViewRound}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const BindDesignationIVRoundMap = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.BindDesignationIVRoundMap}?desiID=${id}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const DeleteDesignationMap = async (id) => {
  store.dispatch(setLoading(true));
  debugger
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.DeleteDesignationMap}?mapID=${id}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SaveDesignationWithIVRound = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveDesignationWithIVRound}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SaveRatingMaster = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveRatingMaster}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const SaveIncrementMaster = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveIncrementMaster}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};
export const BindRatingMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.BindRatingMaster}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const BindUserIncrement = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.BindUserIncrement}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const BindWithDepartment = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindDepartmentHR}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindWithDesignation = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindDesignation}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetEmployeeLeaveDetail = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.GetEmpLeaveDetail}?months=0&departmentID=0&designationID=0&empID=0&Type=0`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindEmployee = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindEmployee}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindEmployeeAttendanceData = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindEmployeeAttendanceData}?employeeID=0&departmentName=0&selectedMonth=0&selectedYear=0`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveEmployeeLeavePlanApproval = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveEmployeeLeavePlanApproval}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const SaveEmployeeLeavePlan = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SaveEmployeeLeavePlan}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const BindDesignationtableinMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindDesignationtableinMaster}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindReportingPurpose = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindReportingPurpose}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindDepartmentPersonnelForm = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindDepartmentPersonnelForm}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindDeptTotalEmployee = async (deptId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindDeptTotalEmployee}?DeptID=${deptId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindDeptEmployeeList = async (deptId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindDeptEmployeeList}?DeptID=${deptId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindStaffEstablishment = async (deptId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.BindStaffEstablishment}?DeptID=${deptId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};


export const BindStaffData = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindStaffData}?employeeID=${payload?.employeeID || ""}&employeeName=${payload?.employeeName || ""}&departmentID=${payload?.departmentID || ""}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const EmployeeSearch = async (payload) => {
  store.dispatch(setLoading(true));
  try {
     const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.EmployeeSearch}`;
    const data = await makeApiRequest(url, options,);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindJobGrade = async (deptId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindJobGrade}?DeptID=${deptId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindReportingToEmp = async (deptId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindReportingToEmp}?DeptID=${deptId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindExistEmployee = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindExistEmployee}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindEmployeeData = async (payload) => {
  store.dispatch(setLoading(true));
  try {
     const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindEmployeeData}`;
    const data = await makeApiRequest(url, options,);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindLeaveType = async (payload) => {
  store.dispatch(setLoading(true));
  try {
     const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindLeaveType}`;
    const data = await makeApiRequest(url, options,);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveLeaveRequest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
     const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveLeaveRequest}`;
    const data = await makeApiRequest(url, options,);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const CancelLeaveRequest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
     const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.CancelLeaveRequest}`;
    const data = await makeApiRequest(url, options,);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindLocationEmpProfile = async (payload) => {
  store.dispatch(setLoading(true));
  try {
     const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindLocationEmpProfile}`;
    const data = await makeApiRequest(url, options,);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindLeaveAndHolidays = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };
    const url = `${apiUrls.BindLeaveAndHolidays}?EmpID=${encodeURIComponent(payload.EmpID)}&Month=${payload.Month}&Year=${payload.Year}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveLoginEmpProfile = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveLoginEmpProfile}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindEmployeeDataHR = async (empId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: { obj: empId },
    };
    const url = `${apiUrls.BindEmployeeDataHR}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveResignation = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveResignation}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindJobDocumentsType = async (empId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: { obj: empId },
    };
    const url = `${apiUrls.BindJobDocumentsType}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindEmployeeBasicDetails = async (empId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: { EmployeeID: empId },  
    };
    const url = `${apiUrls.BindEmployeeBasicDetails}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindEmployeeStatus = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindEmployeeStatus}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindEmployeeSource = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindEmployeeSource}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindUnitsHR = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindUnitsHR}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindWardHR = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindWardHR}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindEmployeeProfessionalDtl = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindEmployeeProfessionalDtl}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindHrVacancy = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindHrVacancy}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindRequsest = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindRequsest}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindEmployeeJobExplation = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.BindEmployeeJobExplation}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindIssueWarning = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindIssueWarning}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const ConfirmIssueWarning = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.ConfirmIssueWarning}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const BindCommitteeMessageDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindCommitteeMessageDetail}?EmployeeID=${payload?.empId || ""}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const BindEmployeeChatMessages = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BindEmployeeChatMessages}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const  SaveEmployeeReplyEmp = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveEmployeeReplyEmp}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const EmployeeBioDataReport = async (empId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.EmployeeBioDataReport}?EmployeeID=${empId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const  SaveEmployeeLeaveAllotment = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrlsNew.SaveEmployeeLeaveAllotment}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};


export const  ExportEmployeeReport = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.ExportEmployeeReport}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const GetEmployeeLeaveReport = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const query = new URLSearchParams({
      fromdate: params.fromdate,
      todate: params.todate,
      empName: params.empName || '""',
      departmentID: params.departmentID ?? 0,
      designationID: params.designationID ?? 0,
      EmployeeID: params.EmployeeID ?? 0,
      printIn: params.printIn, 
    }).toString();

    const url = `${apiUrlsNew.GetEmployeeLeaveReport}?${query}`;
    const data = await makeApiRequest(url, { method: "GET" });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetOverTimeRequestToApprove = async (empId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrlsNew.GetOverTimeRequestToApprove}?EmployeeID=${empId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveAndUpdateModel = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveAndUpdateModel}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const UpdateStatusModel = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.UpdateStatusModel}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const GetModelMaster = async (empId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetModelMaster}?EmployeeID=${empId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetRoleMapping = async (modelId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetRoleMapping}?ModelId=${modelId}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveAndUpdatemodulemaster = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveAndUpdatemodulemaster}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const GetUrlMapping = async (modelID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetUrlMapping}?ModelId=${modelID}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveUrlMapping = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveUrlMapping}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const GetMissingTables = async (empId) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetMissingTables}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveMissingTable = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveMissingTable}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const SaveAllMaster = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveAllMaster}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const TruncateMasterTables = async (TableTruncate) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.TruncateMasterTables}?TableTruncate=${TableTruncate}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveMenuMaster = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveMenuMaster}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const GetMenuMasterList = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.GetMenuMasterList}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const UpdateMenuMaster = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateMenuMaster}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const DeleteMenuMaster = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.DeleteMenuMaster}?id=${id}`,
      { method: "POST" }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveFileMaster = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveFileMaster}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const GetFileMasterList = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.GetFileMasterList}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const UpdateFileMaster = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateFileMaster}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const DeleteFileMaster = async (id) => {
  store.dispatch(setLoading(true));
  debugger
  try {
    const options = {
      method: "POST",
    };
    const data = await makeApiRequest(
      `${apiUrls.DeleteFileMaster}?id=${id}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Something went wrong while fetching mappings:", error);
    throw error;
  }
};

export const SaveFileRoleList = async (payload) => {
  store.dispatch(setLoading(true));
   try {
    const options = {
      method: "POST",
      data: payload,
    };
    const url = `${apiUrls.SaveFileRoleList}`;
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  } 
};

export const UpdateOnboardingMaster = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.UpdateOnboardingMaster}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};