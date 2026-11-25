import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { aiDisabledResponse, isAiFeatureEnabled } from "../utils/aiSettings";

export const GetBindAllCenter = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(`${apiUrls?.GetBindAllCenter}`, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const ReportAIChatPdfAPI = async (payload) => {
  if (!isAiFeatureEnabled("reportChat")) return aiDisabledResponse("reportChat");
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrls?.ReportAIChatPdf}`, option);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const PageConfigurationAPi = async (pageURLID) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.PageConfigurationURL}?pageURLID=${pageURLID}`,
      option,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const PatientMedicineInformationAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls?.PatientMedicineInformation}`,
      option,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const handleBindGlobalResources = async () => {
  // debugger
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.NewBindglobalresources}`,
      option,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const centreWiseCacheAllBasicDataAPI = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.CentreWiseCacheByCenterID}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const SaveMasterPageConfigurationAPI = async (payload) => {
  // debugger
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "post",
      data:payload
    };

    const data = await makeApiRequest(
      `${apiUrls?.SaveMasterPageConfigurationURL}`,
      option,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const getAllPanelAPI = async () => {
  store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew?.getAllPanel}`,
      option
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};
export const CKEditorShortKeyAPIControlsAPI = async () => {
  // store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.CKEditorShortKeyAPIControls}`,
      option
    );
    // store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    // store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const CommonBindRoleDepartment = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.CommonBindRoleDepartment}`, {
      method: "get",
      // data: {},
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const CommonCompareDate = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.CommonCompareDate}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
// payload.feature: the AI_FEATURES key (utils/aiSettings.js) of the caller; a
// feature switched off in the header's AI panel is not sent to the server.
export const getAIResponseAPI = async (payload) => {
  if (!isAiFeatureEnabled(payload?.feature)) return aiDisabledResponse(payload?.feature);
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GenerateTextURL}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const GenerateFromFileAPI = async (payload) => {
  if (!isAiFeatureEnabled(payload?.feature)) return aiDisabledResponse(payload?.feature);
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GenerateFromFileURL}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
