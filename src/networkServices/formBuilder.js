import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const GetScreenBuilderCommonAPIList = async (type, commonAPIID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetScreenBuilderCommonAPIURL}?Type=${type}&CommonAPIID=${commonAPIID}`,
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

export const getFormBuilderAPIList = async (url, method = "get", payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: method,
    }
    if (method?.toLowerCase() === "post") {
      options.data = payload
    }
    const data = await makeApiRequest(url, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const SaveScreenBuilderAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SavescreenbuilderURL,
      {
        method: "post",
        data: payload
      }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetScreenBuilderPageConfiguration = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetScreenBuilderPageConfigurationURL}?pageURLID=${id}`,
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