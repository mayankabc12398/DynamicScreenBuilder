import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { apiUrlsNew } from "./newApiEndpoints";
import { PrintBedOccupancyReport } from "./ReportsAPI";

export const MRDBindPatientType = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindPatientType}?roomID=1`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindCaseType = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(`${apiUrls?.MRDBindCaseType}`, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindPanelIPD = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(`${apiUrls?.MRDBindPanelIPD}`, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindParentPanel = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(`${apiUrls?.MRDBindParentPanel}`, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindDischargeType = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindDischargeType}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSearchGrid = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSearchGrid, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDPatientSearchMRDRecieved = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.MRDPatientSearchMRDRecieved,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindDocuments = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.MRDBindDocuments}?TID=${TID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDFileRegisterSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDFileRegisterSave, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindgrd = async (PID, TID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.MRDBindgrd}?PID=${PID}&TID=${TID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDScanFileUpload = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDScanFileUpload, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDScanFileView = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDScanFileView, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindRoomCMB = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(apiUrls?.MRDBindRoomCMB, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindAlmirah = async (RmID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const response = await makeApiRequest(
      `${apiUrls?.MRDBindAlmirah}?RmID=${RmID}`,
      option
    );
    store.dispatch(setLoading(false));
    return response;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindShelf = async (AlmID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const response = await makeApiRequest(
      `${apiUrls?.MRDBindShelf}?AlmID=${AlmID}`,
      option
    );
    store.dispatch(setLoading(false));
    return response;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSetLocation = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const response = await makeApiRequest(
      `${apiUrls?.MRDSetLocation}?TID=${TID}`,
      option
    );
    store.dispatch(setLoading(false));
    return response;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDSetLocationSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload
    };
    const response = await makeApiRequest(
      `${apiUrls?.MRDSaveLoation}`,
      option
    );
    store.dispatch(setLoading(false));
    return response;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSearchPatient = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSearchPatient, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSaveSentFile = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSaveSentFile, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDMRDSentfilestatus = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDMRDSentfilestatus, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDMRDRequisitionSearch = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDMRDRequisitionSearch, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSaveMRDRequisition = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSaveMRDRequisition, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDSaveMRDReturnFile = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.SaveMRDReturnFile, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDGetFileStatus = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDGetFileStatus, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDMLCDetailUpdate = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDMLCDetailUpdate, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindDetails = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindDetails}?TID=${TID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSearchMRDRequisition = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSearchMRDRequisition, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDApprovedRequisition = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDApprovedRequisition, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSearchRequisition = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSearchRequisition, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSearchIssueFile = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSearchIssueFile, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindPatientDetails = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindPatientDetails}?TransactionID=${TransactionID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDBindPatientDetail = async (TransactionID, PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindPatientDetail}?TransactionID=${TransactionID}&PatientID=${PatientID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDBindFileDetail = async (TransactionID, PatientID) => {
  debugger
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindFileDetailURL}?TransactionID=${TransactionID}&PatientID=${PatientID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const BindMRDRequisitionDetail = async (RequestedID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindRequisitionDetailURL}?RequestedID=${RequestedID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDBindFileDoc = async (TransactionID, FileID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindFileDocURL}?TransactionID=${TransactionID}&FileID=${FileID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDBindEmployeeAPI = async (RoleID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindEmployeeURL}?RoleID=${RoleID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const handleMRDFileIssueSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDFileIssueSaveURL}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const handleFileReturnSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDFileReturnSave}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const handleEnDisableSave = async (TransactionID, RequestID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.EnDisableSave}?TransactionID=${TransactionID}&RequestID=${RequestID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDSearch = async (PID, TID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDSearch}?PID=${PID}&TID=${TID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSavedocument = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSavedocument, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindDocumentlist = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(apiUrls?.MRDBindDocumentlist, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDEditDcouementName = async (documentID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDEditDcouementName}?documentID=${documentID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindRoom = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(apiUrls?.MRDBindRoom, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSaveNewRoom = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(apiUrls?.MRDSaveNewRoom, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindMRDRack = async (roomID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindMRDRack}?roomID=${roomID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDSaveNewRack = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.MRDSaveNewRack, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const MRDBindRackDetail = async (RackID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.MRDBindRackDetail}?RackID=${RackID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};



export const MRDBedOccupancyReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PrintBedOccupancyReport, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const MRDPatientICDCodeReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PrintPatientICDCodeReport, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const BindNABH = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const response = await makeApiRequest(`${apiUrls?.BindNABH}`,
      option
    );
    store.dispatch(setLoading(false));
    return response;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const PrintNBHReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PrintNBHReport, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const getCreateDocumentMasterListApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrlsNew?.getCreateDocumentMasterList}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};