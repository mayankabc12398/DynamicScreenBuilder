import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import makeApiRequest from "./axiosInstance";
import { apiUrlsNew } from "./newApiEndpoints";

export const insertConsentDataApi = async (mobileNo) => {
  try {
    store.dispatch(setLoading(true));
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrlsNew?.InsertConsentData}`,
      options,
    );

    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const savePatientConsentApi = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      `${apiUrlsNew?.SavePatientConsent}`,
      options,
    );

    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SendConsentLinkApi = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      `${apiUrlsNew?.SendConsentLink}`,
      options,
    );

    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const FetchConsentSavedApi = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrlsNew?.FetchConsentSaved}?TransactionID=${payload?.transactionId}&PatientID=${payload?.patientID}`,
      options,
    );

    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const printPatientConsentApi = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      `PatientConsent/PatientConsent/PatientConsentPrint`,
      options,
    );

    return data;
  } catch (error) {
    console.error(error, "SomeThing Went Wrong");
  } finally {
    store.dispatch(setLoading(false));
  }
};

