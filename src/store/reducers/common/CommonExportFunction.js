import { createAsyncThunk } from "@reduxjs/toolkit";
import { setLoading } from "../loadingSlice/loadingSlice";
import { apiUrls } from "../../../networkServices/apiEndpoints";
import makeApiRequest from "../../../networkServices/axiosInstance";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import store from "../../store";

export const CentreWiseCacheByCenterID = createAsyncThunk(
  "CentreWiseCache",
  async ({ centreID }, { dispatch }) => {
    const options = {
      method: "GET",
    };

    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.CentreWiseCacheByCenterID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const CentreWisePanelControlCache = createAsyncThunk(
  "CentreWisePanelControlCache",
  async ({ centreID }, { dispatch }) => {
    const options = {
      method: "GET",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.CentreWisePanelControlCache}?CentreID=${centreID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);
export const PageConfigurationAPIDetails = createAsyncThunk(
  "PageConfigurationAPIDetails",
  async (pageURLID , { dispatch }) => {
    const options = {
      method: "GET",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PageConfigurationURL}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const getEmployeeWise = createAsyncThunk(
  "centre",
  async ({ employeeID }, { dispatch }) => {
    const options = {
      method: "GET",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.EmployeeWiseCentreList}?EmployeeId=${employeeID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const GetBindMenu = createAsyncThunk(
  "BindMenu",
  async ({ RoleID }, { dispatch }) => {
    // console.log("RoleID", RoleID);
    const options = {
      method: "GET",
    };
    try {
      dispatch(setLoading(true));
      const data = await makeApiRequest(
        `${apiUrls.BindMenuList}?RoleID=${RoleID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const getNotification = createAsyncThunk(
  "GetNotify",
  async ({ RoleID, EmployeeID, CentreID }, { dispatch }) => {
    const options = {
      method: "GET",
    };
    try {
      dispatch(setLoading(true));
      const data = await makeApiRequest(
        `${apiUrls.getNotificationDetail}?RoleID=${RoleID}&EmployeeID=${EmployeeID}&CentreID=${CentreID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);
export const BindFrameMenuByRoleID = createAsyncThunk(
  "BindFrameMenu",
  async ({ frameName }, { dispatch }) => {
    const options = {
      method: "post",
      data: {
        frameName: frameName,
      },
    };
    try {
      dispatch(setLoading(true));
      const data = await makeApiRequest(
        `${apiUrls.BindFrameMenuByRoleID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const GetRoleListByEmployeeIDAndCentreID = createAsyncThunk(
  "GetRoleList",
  async ({ centreID, employeeID }, { dispatch }) => {
    const options = {
      method: "GET",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.getRoleList}?centreID=${centreID}&employeeID=${employeeID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const GetBindReferDoctor = createAsyncThunk(
  "GetBindDoctorList",
  async (data, { dispatch }) => {
    const options = {
      method: "get",
      // data,
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(`${apiUrls.BindReferDoctor}`, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const GetBindReferalType = createAsyncThunk(
  "getReferTypeList",
  async (data, { dispatch }) => {
    const options = {
      method: "get",
      data,
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(`${apiUrls.BindRefferalType}`, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const GetBindDepartment = createAsyncThunk(
  "GetBindDepartmentList",
  async (data, { dispatch }) => {
    const options = {
      method: "get",
      // data: {
      //   centreID: "1",
      //   TypeID: "5",
      // },
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BindDepartment}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);
export const BindSeeMoreList = createAsyncThunk(
  "BindSeeMoreList",
  async (data, { dispatch }) => {
    const options = {
      method: "get",
      data: {
        centreID: "1",
        TypeID: "5",
      },
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(`${apiUrls.BindSeeMoreList}`, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const GetPanelDocument = createAsyncThunk(
  "getPanelDocumentList",
  async ({ PanelID }, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetPanelDocument}?PanelID=${PanelID}`,
        options
      );

      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

// export const GetPatientUploadDocument = createAsyncThunk(
//   "getPatientUploadDocument",
//   async ({ patientID }, { dispatch }) => {
//     const options = {
//       method: "get",
//     };
//     dispatch(setLoading(true));
//     try {
//       const data = await makeApiRequest(
//         `${apiUrls.GetPatientUploadDocument}?patientID=${patientID}`,
//         options
//       );
//       dispatch(setLoading(false));
//       return data;
//     } catch {
//       dispatch(setLoading(false));
//     }
//   }
// );



export const GetPatientUploadDocument = createAsyncThunk(
  "getPatientUploadDocument",
  async ({ patientID }, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetPatientUploadDocument}?panelId=${patientID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);


// GetPatientDocument PID


// latestAll: the latest upload of every document (any date) - used when a patient is
// opened for update on Registration. Default: today's documents.
export const GetPatientDocument = async (PID, latestAll = false) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetPatientDocument}?PID=${PID}${latestAll ? "&LatestAll=true" : ""}`,
      {
        method: "get",
      }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
}; 
 


/* Panel documents uploaded from the "Panel Document" popup
   (OPD Booking -> See More -> Add/Remove Panels List -> Upload on a panel row).

   Each document is stored against the visit it was uploaded in, so Patient Encounter
   History can show one folder per visit day and, inside it, one block per panel.
   TransactionID may be blank - the popup is usually opened before the visit is booked,
   and the API then falls back to the patient's most recent visit. */
export const SavePatientPanelDocument = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SavePatientPanelDocument, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// One row per uploaded document, carrying its visit. The scan itself is not included
// here - a patient with years of visits would pull megabytes of base64 on every search.
export const GetPatientPanelDocumentVisitWise = async ({
  PID,
  FromDate,
  ToDate,
}) => {
  store.dispatch(setLoading(true));
  try {
    let url = `${apiUrls.GetPatientPanelDocumentVisitWise}?PID=${PID}`;
    if (FromDate && ToDate) url += `&FromDate=${FromDate}&ToDate=${ToDate}`;
    const data = await makeApiRequest(url, { method: "get" });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// The scan itself, fetched only when a document is opened. Addressed by the same
// (TransactionID, PanelID, PanelDocumentID) key the save upserts on.
export const GetPatientPanelDocumentFile = async ({
  TransactionID,
  PanelID,
  PanelDocumentID,
  ID = 0, // f_paneldocument_patient.ID - picks the exact row when a visit has several (e.g. receipts)
}) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetPatientPanelDocumentFile}?TransactionID=${TransactionID}&PanelID=${PanelID}&PanelDocumentID=${PanelDocumentID}&ID=${Number(ID) || 0}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const ReferenceTypeInsert = createAsyncThunk(
  "REFERENCETYPE",
  async (data, { dispatch }) => {
    const options = {
      method: "POST",
      data,
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(apiUrls.CreateTypeOfReference, options);
      dispatch(setLoading(false));
      if (data?.status) {
        notify(data?.message, "success");
      } else {
        notify(data?.message, "error");
      }
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

export const GetAdvanceReason = createAsyncThunk(
  "GetAdvanceReason",
  async (data, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(`${apiUrls.GetAdvanceReason}`, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const CreateAdvanceReason = createAsyncThunk(
  "CreateAdvanceReason",
  async (data, { dispatch }) => {
    console.log(data);
    const options = {
      method: "POST",
      data,
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(apiUrls.CreateAdvanceReason, options);
      dispatch(setLoading(false));
      if (data?.success) {
        notify(data?.message, "success");
      } else {
        notify(data?.message, "error");
      }
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

export const GetBindResourceList = createAsyncThunk(
  "BINDRESOURCELIST",
  async (data, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(apiUrls.BindResourceList, options);
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

export const GetAllDoctor = createAsyncThunk(
  "GetAllDoctorList",
  async (_, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BindDoctorDept}?Department=ALL&CentreID=1`,
        options
      );
      dispatch(setLoading(false));
      return {
        data: handleReactSelectDropDownOptions(data?.data, "Name", "DoctorID"),
      };
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

export const GetBindAllDoctorConfirmation = createAsyncThunk(
  "GetBindAllDoctorConfirmation",
  async ({ Department, CentreID }, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BindDoctorDept}?Department=${Department}`,
        options
      );
      dispatch(setLoading(false));
      return data;
      // return {
      //   data: handleReactSelectDropDownOptions(data?.data, "Name", "DoctorID"),
      // };
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

export const GetBindSubCatgeory = createAsyncThunk(
  "GetBindSubCatgeory",
  async ({ Type, CategoryID }, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.getBindSubCategory}?Type=${Type}&CategoryID=${CategoryID}`,
        options
      );
      dispatch(setLoading(false));
      return data;
      // return {
      //   data: handleReactSelectDropDownOptions(data?.data, "Name", "DoctorID"),
      // };
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

// Token Management
export const getBindCentre = createAsyncThunk(
  "getBindCentre",
  async (_, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(`${apiUrls.getBindCenterAPI}`, options);
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);
export const getBindSpeciality = createAsyncThunk(
  "getBindSpeciality",
  async (_, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(`${apiUrls.BindSpeciality}`, options);
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);
export const getBindPanelList = createAsyncThunk(
  "getBindPanelList",
  async ({ PanelGroup }, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetPanelName}?PanelGroup=${PanelGroup}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);
export const getLoadOPDDiagnosisItems = createAsyncThunk(
  "getLoadOPDDiagnosisItems",
  async (_, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.LoadOPDDiagnosisItems}?Type=3&CategoryID=0&SubCategoryID=0`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

export const GetAuthorization = createAsyncThunk(
  "getAuthorization",

  async ({ Type }, { dispatch }) => {
    const options = {
      method: "GET",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetAuthorization}?Type=${Type}`,
        options
      );
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);
export const handleBindGlobalResources = createAsyncThunk(
  "NEWBINDRESOURCELIST",
  async (data, { dispatch }) => {
    debugger
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(apiUrls.NewBindglobalresources, options);
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

export const GetGlobalResources = createAsyncThunk(
  "GETGLOBALRESOURCES",
  async (data, { dispatch }) => {
    const options = {
      method: "get",
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(apiUrls.GetGlobalResources, options);
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);
