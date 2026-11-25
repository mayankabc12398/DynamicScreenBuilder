import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import makeApiRequest from "./axiosInstance";

/**
 * ER Initial Assessment & Treatment - network services
 * Kept in a dedicated file so that no existing service/endpoint file is touched.
 */
export const erInitialAssessmentUrls = {
  saveERInitialAssessment: "ERInitialAssessment/SaveERInitialAssessment",
  updateERInitialAssessment: "ERInitialAssessment/UpdateERInitialAssessment",
  searchERInitialAssessment: "ERInitialAssessment/SearchERInitialAssessment",
  getERInitialAssessmentByID: "ERInitialAssessment/GetERInitialAssessmentByID",
  erInitialAssessmentPrint: "ERInitialAssessment/ERInitialAssessmentPrint",
  emergencyCertificatePrint: "ERInitialAssessment/EmergencyCertificatePrint",
};

export const SaveERInitialAssessmentAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      erInitialAssessmentUrls.saveERInitialAssessment,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Save ER Initial Assessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const UpdateERInitialAssessmentAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      erInitialAssessmentUrls.updateERInitialAssessment,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Update ER Initial Assessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SearchERInitialAssessmentAPI = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${erInitialAssessmentUrls.searchERInitialAssessment}?TID=${TID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Search ER Initial Assessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const GetERInitialAssessmentByIDAPI = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${erInitialAssessmentUrls.getERInitialAssessmentByID}?ID=${ID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Bind ER Initial Assessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const EmergencyCertificatePrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      erInitialAssessmentUrls.emergencyCertificatePrint,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Print Emergency Certificate", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const ERInitialAssessmentPrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      erInitialAssessmentUrls.erInitialAssessmentPrint,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Print ER Initial Assessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
