import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const SearchPatientCreditDebit = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SearchPatientCreditDebit}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BillingToolBillClaimDetails = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.BillingToolBillClaimDetails}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BillingToolSaveBillClaimDetails = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.BillingToolSaveBillClaimDetails}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BillingToolChemoPatientDetail = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.BillingToolChemoPatientDetail}?SearchKey=${params}&Type=0`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BillingToolSaveChemoPatientDetail = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.BillingToolSaveChemoPatientDetail}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BillingToolSearchChemoHistory = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.BillingToolSearchChemoHistory}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BillingToolRemoveChemoPatientDetail = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.BillingToolRemoveChemoPatientDetail}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const GetDepartmentWiseDetails = async (
  transactionID,
  Type,
  LedgertransactionNo
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetDepartmentWiseDetails}?transactionID=${transactionID}&Type=${Type}&LedgertransactionNo=${LedgertransactionNo}`;
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

export const GetDepartmentItemDetails = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.GetDepartmentItemDetails}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const OtPatientSearch = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.otPatientSearch}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const PanelControlGetPatientPendingBills = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.PanelControlGetPatientPendingBills}?fromDate=${payload?.fromDate}&toDate=${payload?.toDate}&patientID=${payload?.UHID}&patientName=${payload?.name}&billNo=${payload?.billNo}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const PanelControlpanelband = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.PanelControlpanelband}?transactionID=${transactionID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const PanelControlGetPatientPanelAmountAllocationDetails = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.PanelControlGetPatientPanelAmountAllocationDetails}?transactionID=${transactionID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const PanelControlSavePanelAmountAllocationDetails = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.PanelControlSavePanelAmountAllocationDetails}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const GetPanelList = async (
  TransactionID,
  Type,
  LedgerTransactionNo
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetPanelList}?TransactionID=${TransactionID}&Type=${Type}&LedgerTransactionNo=${LedgerTransactionNo}`;
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

// Merge Duplicate Patient Medical Record. The search is read-only; the merge cannot
// be undone, so the two UHIDs are sent as a body rather than a query string.
export const GetMergePatientDetail = async (
  SourcePatientID,
  DestinationPatientID
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetMergePatientDetail}?SourcePatientID=${encodeURIComponent(
      SourcePatientID
    )}&DestinationPatientID=${encodeURIComponent(DestinationPatientID)}`;
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

export const MergeDuplicatePatientAPI = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.MergeDuplicatePatient}`, {
      method: "POST",
      data: params,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * Billing/Tool/SearchWhatsAppLog
 * Swagger declares this body as application/x-www-form-urlencoded, so the
 * payload is serialised with URLSearchParams and the Content-Type is passed
 * through makeApiRequest's third argument (the rest of the app sends JSON).
 * userValidateID is appended by makeApiRequest itself.
 */
export const BillingToolSearchWhatsAppLog = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const body = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      body.append(key, value ?? "");
    });

    const data = await makeApiRequest(
      `${apiUrls.BillingToolSearchWhatsAppLog}`,
      {
        method: "POST",
        data: body.toString(),
      },
      "application/x-www-form-urlencoded"
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

/**
 * Billing/Tool/GetWhatsAppTemplateIDList
 * Feeds the Template ID dropdown on the WhatsApp Log screen.
 * userValidateID is appended by makeApiRequest itself.
 */
export const BillingToolGetWhatsAppTemplateIDList = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BillingToolGetWhatsAppTemplateIDList}`,
      {
        method: "GET",
      }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

/**
 * Billing/Tool/ReSendWhatsAppMessages
 * Resends the selected WhatsApp log rows as JSON: { "iDs": [1, 2, 3] }.
 * userValidateID is appended by makeApiRequest itself.
 */
export const BillingToolReSendWhatsAppMessages = async (ids) => {
  store.dispatch(setLoading(true));
  try {
    const idList = (Array.isArray(ids) ? ids : [ids])
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));

    const data = await makeApiRequest(
      `${apiUrls.BillingToolReSendWhatsAppMessages}`,
      {
        method: "POST",
        data: { iDs: idList },
      }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

/**
 * Billing/Tool/GetWhatsAppLogHistory
 * Send history for a single WhatsApp log row.
 * userValidateID is appended by makeApiRequest itself.
 */
export const BillingToolGetWhatsAppLogHistory = async (whatsAppLogID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BillingToolGetWhatsAppLogHistory}?WhatsAppLogID=${whatsAppLogID}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
