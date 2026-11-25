import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";

/**
 * Radiology report in desktop MS Word. Create turns the report HTML into a
 * .docx on the API and returns an "ms-word:" link; Status and Html are polled
 * (no loader) to pick up each Ctrl+S made in Word.
 */
export const createRadiologyWordDoc = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.radiologyWordCreate, {
      method: "POST",
      data: payload,
    });
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const getRadiologyWordStatus = (token) =>
  makeApiRequest(
    `${apiUrls.radiologyWordStatus}?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );

// Fire and forget: a file left behind is removed by the API after 12 hours.
export const deleteRadiologyWordDoc = (token) =>
  makeApiRequest(
    `${apiUrls.radiologyWordDelete}?token=${encodeURIComponent(token)}`,
    { method: "POST" },
  ).catch(() => null);

export const getRadiologyWordHtml = (token) =>
  makeApiRequest(
    `${apiUrls.radiologyWordHtml}?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );
