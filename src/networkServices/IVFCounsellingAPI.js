import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";

export const handleIVFCounsellingInvestigationItemSearch = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.IVFCounsellingInvestigationItemSearch}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};
export const handleSaveOrUpdateIVFCounselling = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SaveOrUpdateIVFCounselling}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};
export const GetBindDataOfIVFCounselling = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDataOfIVFCounselling}?TransactionID=${TransactionID}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const handleSaveOrUpdateIVFConvertToPackage = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.SaveOrUpdateIVFConvertToPackage}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};
export const GetBindDataOfIVFConvertToPackage = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDataOfIVFConvertToPackage}?TransactionID=${TransactionID}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetRenderPDF = async (cacheKey) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.RenderPDF}?cacheKey=${cacheKey}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const handleFormG = async (Tid) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.FormG}?Tid=${Tid}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const handleIVFCASESHEET = async (Tid) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.IVFCASESHEET}?Tid=${Tid}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const handleMINISTRYOFHEALTH = async (Tid) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.MINISTRYOFHEALTH}?Tid=${Tid}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindDataOfIVFVisitStartClose = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDataOfIVFVisitStartClose}?TransactionID=${TransactionID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const handleSaveIVFVisitStartClose = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.SaveOrUpdateIVFVisitStartClose}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};
export const handleUpdateIVFVisitStartClose = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.UpdateIVFVisitStartClose}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};
export const GetBindIVFPatientAdmitDetails = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIVFPatientAdmitDetails}?TID=${TID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindIVFDischargSummaryTemplates = async (TempHeaderID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIVFDischargSummaryTemplates}?TempHeaderID=${TempHeaderID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindIVFDischargSummaryHeaders = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIVFDischargSummaryHeaders}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const handleSaveOrUpdateIVFDischargeSummary = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.SaveOrUpdateIVFDischargeSummary}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};
export const GetBindIVFPreviousDischargeSummary = async (TID, AdmitId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIVFPreviousDischargeSummary}?TID=${TID}&AdmitId=${AdmitId}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindIVFTemplateDetails = async (TemplateID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIVFTemplateDetails}?TemplateID=${TemplateID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindIVFPatientDischargeSummaryDetails = async (
  AdmitId,
  HeaderID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIVFPatientDischargeSummaryDetails}?AdmitId=${AdmitId}&HeaderID=${HeaderID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const printPrintIVFDischargeSummary = async (
  transactionID,
  admitID,
  pHead,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.PrintIVFDischargeSummary}?transactionID=${transactionID}&admitID=${admitID}&pHead=${pHead}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const handleSaveOrUpdateSocialHistory = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SaveOrUpdateSocialHistory}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};
export const GetBindDataSocialHistory = async (TransactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDataSocialHistory}?TransactionID=${TransactionID}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindSpouseAppointments = async (patientId) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.GetSpouseAppointments}?patientId=${patientId}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetPrintIVFFormCounselling = async (formId) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIVFFormCounselling}?formId=${formId}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};