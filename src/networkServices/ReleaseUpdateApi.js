import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";

/**
 * Network layer for the "What's New / Release Update" module.
 * Follows the project convention: makeApiRequest + global loading + apiUrls.
 * The axios instance auto-appends userValidateID and the Bearer token.
 */

// ---------- ADMIN ----------
export const createReleaseApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.ReleaseCreate, { method: "POST", data: payload });
  } catch (error) {
    console.error("createReleaseApi", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const updateReleaseApi = async (id, payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(`${apiUrls.ReleaseUpdateEdit}?id=${id}`, {
      method: "POST",
      data: payload,
    });
  } catch (error) {
    console.error("updateReleaseApi", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const publishReleaseApi = async (id) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(`${apiUrls.ReleasePublish}?id=${id}`, { method: "POST" });
  } catch (error) {
    console.error("publishReleaseApi", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// ---------- READ ----------
export const getLatestReleaseApi = async () => {
  try {
    return await makeApiRequest(apiUrls.ReleaseLatest, { method: "GET" });
  } catch (error) {
    console.error("getLatestReleaseApi", error);
  }
};

export const getReleaseHistoryApi = async (filters = {}) => {
  store.dispatch(setLoading(true));
  try {
    const { search = "", version = "", fromDate = "", toDate = "" } = filters;
    const qs = new URLSearchParams({ search, version, fromDate, toDate }).toString();
    return await makeApiRequest(`${apiUrls.ReleaseHistory}?${qs}`, { method: "GET" });
  } catch (error) {
    console.error("getReleaseHistoryApi", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// ---------- ACKNOWLEDGEMENT (popup / bell) ----------
export const getPendingReleaseApi = async () => {
  try {
    return await makeApiRequest(apiUrls.ReleasePending, { method: "GET" });
  } catch (error) {
    console.error("getPendingReleaseApi", error);
  }
};

export const acknowledgeReleaseApi = async (releaseId) => {
  try {
    return await makeApiRequest(apiUrls.ReleaseAcknowledge, {
      method: "POST",
      data: { releaseID: releaseId },
    });
  } catch (error) {
    console.error("acknowledgeReleaseApi", error);
  }
};

// ---------- EMAIL CONFIG ----------
export const getEmailConfigApi = async () => {
  try {
    return await makeApiRequest(apiUrls.ReleaseEmailConfigGet, { method: "GET" });
  } catch (error) {
    console.error("getEmailConfigApi", error);
  }
};

export const saveEmailConfigApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.ReleaseEmailConfigSave, {
      method: "POST",
      data: payload,
    });
  } catch (error) {
    console.error("saveEmailConfigApi", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
