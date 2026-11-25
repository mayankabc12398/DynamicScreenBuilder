import { apiUrls } from "../networkServices/apiEndpoints";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { notify } from "../utils/utils";
import makeApiRequest from "./axiosInstance";

export const getBindDetailUser = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(`${apiUrls.BindDetailUser}`, options);
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};

export const getBindTypeOfTnx = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(`${apiUrls.BindTypeOfTnx}`, options);
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};
export const getBindCountryList = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(`${apiUrls.GetCountryList}`, options);
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};
export const getBindStateList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetStateList}?countryId=${payload}`,
      options
    );
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};
export const getBindDistrictList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetDistrictList}?countryId=${payload?.countryId}&StateId=${payload?.StateId}`,
      options
    );
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};
export const getBindCityList = async ({ DistrictId, StateId }) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetCityList}?DistrictId=${DistrictId}&StateId=${StateId}`,
      options
    );
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};

export const DailyCollectionDailyCollection = async (payload, type) => {
  store.dispatch(setLoading(true));
  try {
    store.dispatch(setLoading(true));
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls?.DailyCollectionDailyCollection}?type=${type}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
  finally {
    store.dispatch(setLoading(false));
  }

};

// Userwise Collection Report - payload ka printType 0 = screen ka data,
// 1 = PDF (response.data.pdfUrl).
export const getUserwiseCollectionReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls?.UserwiseCollectionReport}`, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Registration Report - payload ka printType 0 = screen ka data,
// 1 = PDF (response.data.pdfUrl).
export const getRegistrationReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls?.RegistrationReport}`, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Panel Wise Invoice Summary - payload ka printType 0 = screen ka data,
// 1 = PDF (response.data.pdfUrl).
export const getPanelWiseInvoiceSummary = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls?.PanelWiseInvoiceSummary}`, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// IPD Item Cancel Report - payload ka printType 0 = screen ka data,
// 1 = PDF (response.data.pdfUrl).
export const getIPDItemCancelReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls?.IPDItemCancelReport}`, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Refund Report (naya v12 wala) - payload ka printType 0 = screen ka data,
// 1 = PDF (response.data.pdfUrl).
export const getRefundReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls?.GetRefundReport}`, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const MRDPrintMRDAllReports = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.MRDPrintMRDAllReports, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};

export const PrintMRDAnalysisDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PrintMRDAnalysisDetail, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};

export const OPDBillRegisterReports = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.OPDBillRegisterReports, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
export const CreditControlInvoiceSettlementReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.CreditControlInvoiceSettlementReport, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
export const CreditControlInvoiceSettlementPdf = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.CreditControlInvoiceSettlementPdf, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
export const RefundReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.RefundReport, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};

export const ReportsRegistrationDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls?.ReportsRegistrationDetail,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
export const OPDAdvanceOutStandingReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls?.OPDAdvanceOutStandingReport,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
export const PatientHistoryDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PatientHistoryDetails, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};

export const PrintFileLocationInMRD = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PrintFileLocationInMRD, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
export const PrintFileIssuesStatus = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PrintFileIssuesStatus, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};

export const PrintBedOccupancyReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.PrintBedOccupancyReport, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
}; export const IPDBillPrints = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.IPDBillPrints, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};

// 22-10-2026: View IPD Patient - tick kiye patients ke Detail + Summary bill, ek PDF.
export const IPDBillPrintMultiple = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls?.IPDBillPrintMultiple, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};

export const ReferDoctorApiCall = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls?.ReferDoctorReportList}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
export const MortuarygetReligion = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls?.MortuarygetReligion}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "SomeThing Went Wrong");
  }
};
