import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiUrls } from "../../../networkServices/apiEndpoints";
import { setLoading } from "../loadingSlice/loadingSlice";
import makeApiRequest from "../../../networkServices/axiosInstance";
import { notify } from "../../../utils/utils";
import store from "../../../store/store";

// Token Management
export const getDashboard = createAsyncThunk(
  "getDashboardData",
  async (data, { dispatch }) => {
    const options = {
      method: "POST",
      data:data
    };
    dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(`${apiUrls.HIMSDashboard}`, options);
      dispatch(setLoading(false));
      return data;
    } catch (e) {
      dispatch(setLoading(false));
      notify(e?.message, "error");
    }
  }
);

// The API answers "Invalid language" for a name that is not a column of
// country_langauge_master (e.g. a stale empLanguage in userData). Falling back to
// English here keeps every caller (header, language pickers) unchanged.
const FALLBACK_LANGUAGE = "English";

export const GetLangaugeAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const fetchLanguage = (language) =>
      makeApiRequest(
        `${apiUrls.GetLangaugeURL}?Language=${encodeURIComponent(language ?? "")}`,
        {
          method: "get"
        }
      );

    let data = await fetchLanguage(payload);
    if (
      data?.success === false &&
      data?.message === "Invalid language" &&
      String(payload ?? "").toLowerCase() !== FALLBACK_LANGUAGE.toLowerCase()
    ) {
      console.warn(`Language "${payload}" is not available; using ${FALLBACK_LANGUAGE}.`);
      data = await fetchLanguage(FALLBACK_LANGUAGE);
    }

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const changeLanguageAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.UpdateLangaugeURL}`,
      {
        method: "post",
        data:payload
      }
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetLangaugeListAPI = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetApplicationLanguageURL}`,
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
// API cache admin (Cache Manager). A refused call (403) comes back as the axios
// response, so callers read `resp?.data ?? resp`.
const cacheAdminRequest = async (url, method) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(url, { method });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const CacheAdminStatsAPI = () =>
  cacheAdminRequest(`${apiUrls.CacheAdminStats}`, "get");

export const CacheAdminClearTagAPI = (tag) =>
  cacheAdminRequest(
    `${apiUrls.CacheAdminClearTag}?tag=${encodeURIComponent(tag)}`,
    "post"
  );

export const CacheAdminClearAllAPI = () =>
  cacheAdminRequest(`${apiUrls.CacheAdminClearAll}`, "post");

export const CacheAdminWarmupAPI = () =>
  cacheAdminRequest(`${apiUrls.CacheAdminWarmup}`, "post");

export const handleSaveLanguage = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.SaveLanguage}`,
      {
        method: "post",
        data:payload
      }
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};