import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * MSG option on the IPD Billing Desk - messages for Nursing / Emergency staff.
 * `silent` skips the global loader, used by the running banner so the whole
 * screen does not flash while it refreshes.
 */
const callMessageApi = async (url, options, silent = false) => {
  if (!silent) store.dispatch(setLoading(true));
  try {
    const response = await makeApiRequest(url, options);
    // A 404 / 401 resolves as undefined rather than throwing, which otherwise
    // surfaces as a bare "failed" toast with no clue what went wrong.
    if (response === undefined || response === null) {
      return {
        success: false,
        data: [],
        message: `No response from ${url} - is the API running the current build?`,
      };
    }
    return response;
  } catch (error) {
    console.error("Error Found", error);
    return {
      success: false,
      data: [],
      message: error?.response?.data?.message || error?.message || "Request failed",
    };
  } finally {
    if (!silent) store.dispatch(setLoading(false));
  }
};

/** Active messages for the running banner, for one admission. */
export const GetIPDStaffActiveMessages = async (transactionId, messageFor = "") =>
  callMessageApi(
    `${apiUrls.IPDStaffActiveMessages}?transactionId=${Number(transactionId) || 0}` +
      (messageFor ? `&messageFor=${encodeURIComponent(messageFor)}` : ""),
    { method: "get" },
    true,
  );

/** Every message raised for one admission, for the manage popup. */
export const GetIPDStaffMessages = async (transactionId) =>
  callMessageApi(
    `${apiUrls.IPDStaffMessages}?transactionId=${Number(transactionId) || 0}`,
    { method: "get" },
  );

/** Adds when MessageID is 0, otherwise edits that message. */
export const SaveIPDStaffMessage = async (params) =>
  callMessageApi(`${apiUrls.IPDStaffMessageSave}`, {
    method: "POST",
    data: params,
  });

/** Deactivates a message so it drops off the banner. */
export const DeleteIPDStaffMessage = async (messageID) =>
  callMessageApi(`${apiUrls.IPDStaffMessageDelete}`, {
    method: "POST",
    data: { MessageID: Number(messageID) },
  });
