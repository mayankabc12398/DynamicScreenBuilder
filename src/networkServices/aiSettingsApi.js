import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setAiSettingsState } from "../utils/aiSettings";

// Vertex AI settings page (/edp-vertex-ai-setting). Reading the settings also
// refreshes the on/off switches every AI feature checks (utils/aiSettings.js).

export const GetAISettingsAPI = async () => {
  const data = await makeApiRequest(apiUrls.GetAISettings, {
    method: "get",
    meta: { silent: true },
    silentError: true,
  });
  if (data?.success && data?.data) setAiSettingsState(data.data);
  return data;
};

export const SaveAIFeaturesAPI = async (payload) => {
  const data = await makeApiRequest(apiUrls.SaveAIFeatures, {
    method: "post",
    data: payload,
  });
  if (data?.success && data?.data) setAiSettingsState(data.data);
  return data;
};

export const SaveVertexConfigAPI = (payload) =>
  makeApiRequest(apiUrls.SaveVertexConfig, { method: "post", data: payload });

export const ResetVertexConfigAPI = () =>
  makeApiRequest(apiUrls.ResetVertexConfig, { method: "post", data: {} });

export const TestVertexConnectionAPI = () =>
  makeApiRequest(apiUrls.TestVertexConnection, { method: "post", data: {} });
