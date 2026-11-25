import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/** DPDP Act 2023 / Rules 2025 - Data Privacy (4 Nov 2026). */
const call = async (url, options, loud = true) => {
  if (loud) store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(url, options);
    if (loud) store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    if (loud) store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

const qs = (params = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
const get = (url, params, loud) => call(`${url}${params ? `?${qs(params)}` : ""}`, { method: "get" }, loud);
const post = (url, data, loud) => call(url, { method: "post", data }, loud);
const postQ = (url, params) => call(`${url}?${qs(params)}`, { method: "post", data: {} });

/** The address patients open; the API uses PublicBaseUrl when it is set. */
export const appBaseUrl = () => {
  const base = (import.meta.env.VITE_APP_REACT_APP_BASENAME || "").replace(/\/$/, "");
  return `${window.location.origin}${base && base !== "/" ? base : ""}`;
};

export const DpdpConfig = () => get(apiUrls.DpdpConfig, null, false);
export const DpdpSettings = () => get(apiUrls.DpdpSettings);
export const DpdpSettingSave = (data) => post(apiUrls.DpdpSettingSave, data, false);
export const DpdpAccessSave = (data) => post(apiUrls.DpdpAccessSave, data);
export const DpdpEmployeeSearch = (Search) => get(apiUrls.DpdpEmployeeSearch, { Search }, false);

export const DpdpNoticeList = () => get(apiUrls.DpdpNoticeList);
export const DpdpNoticeSave = (data) => post(apiUrls.DpdpNoticeSave, data);
export const DpdpNoticePreview = (NoticeID) => get(apiUrls.DpdpNoticePreview, { NoticeID });
export const DpdpPurposeSave = (data) => post(apiUrls.DpdpPurposeSave, data);

export const DpdpServiceMapList = () => get(apiUrls.DpdpServiceMapList);
export const DpdpServiceMapSave = (data) => post(apiUrls.DpdpServiceMapSave, data);
export const DpdpServiceMapDelete = (data) => post(apiUrls.DpdpServiceMapDelete, data);
export const DpdpCommPurposeSave = (data) => post(apiUrls.DpdpCommPurposeSave, data, false);

export const DpdpProcessorList = () => get(apiUrls.DpdpProcessorList);
export const DpdpProcessorSave = (data) => post(apiUrls.DpdpProcessorSave, data);
export const DpdpProcessorSuggest = () => get(apiUrls.DpdpProcessorSuggest, null, false);
export const DpdpRetentionList = () => get(apiUrls.DpdpRetentionList);
export const DpdpRetentionSave = (data) => post(apiUrls.DpdpRetentionSave, data);
export const DpdpRetentionRun = () => post(apiUrls.DpdpRetentionRun, {});
export const DpdpDashboard = (Days) => get(apiUrls.DpdpDashboard, { Days });

export const DpdpStatus = (UHID) => get(apiUrls.DpdpStatus, { UHID }, false);
export const DpdpPatientSave = (data) => post(apiUrls.DpdpPatientSave, data, false);
export const DpdpSend = (data) => post(apiUrls.DpdpSend, { ...data, BaseUrl: appBaseUrl() });
export const DpdpSessionStatus = (SessionID) => get(apiUrls.DpdpSessionStatus, { SessionID }, false);
export const DpdpAssisted = (data) => post(apiUrls.DpdpAssisted, data);
export const DpdpDefer = (data) => post(apiUrls.DpdpDefer, data);
export const DpdpAdmissionCheck = (UHID, Stage) => get(apiUrls.DpdpAdmissionCheck, { UHID, Stage }, false);
export const DpdpRecord = (UHID) => get(apiUrls.DpdpRecord, { UHID });
export const DpdpWithdraw = (data) => post(apiUrls.DpdpWithdraw, data);
export const DpdpRestrict = (data) => post(apiUrls.DpdpRestrict, data);
export const DpdpLegalHold = (data) => post(apiUrls.DpdpLegalHold, data);
export const DpdpNomineeSave = (data) => post(apiUrls.DpdpNomineeSave, data);
export const DpdpMerge = (data) => post(apiUrls.DpdpMerge, data);
export const DpdpSummary = (UHID) => get(apiUrls.DpdpSummary, { UHID });
export const DpdpMyPrivacyLink = (UHID) => post(apiUrls.DpdpMyPrivacyLink, { UHID, BaseUrl: appBaseUrl() });
export const DpdpDisclose = (data) => post(apiUrls.DpdpDisclose, data, false);
export const DpdpAccessLogReport = (params) => get(apiUrls.DpdpAccessLogReport, params);
export const DpdpDisclosureList = (params) => get(apiUrls.DpdpDisclosureList, params);

export const DpdpRequestList = (params) => get(apiUrls.DpdpRequestList, params);
export const DpdpRequestGet = (RequestID) => get(apiUrls.DpdpRequestGet, { RequestID });
export const DpdpRequestSave = (data) => post(apiUrls.DpdpRequestSave, data);
export const DpdpRequestNote = (data) => post(apiUrls.DpdpRequestNote, data);

export const DpdpBreachList = () => get(apiUrls.DpdpBreachList);
export const DpdpBreachGet = (BreachID) => get(apiUrls.DpdpBreachGet, { BreachID });
export const DpdpBreachSave = (data) => post(apiUrls.DpdpBreachSave, data);
export const DpdpBreachFindAffected = (params) => get(apiUrls.DpdpBreachFindAffected, params);
export const DpdpBreachNotify = (BreachID) => post(apiUrls.DpdpBreachNotify, { BreachID });
export const DpdpLegacyQueue = (BatchSize) => postQ(apiUrls.DpdpLegacyQueue, { BatchSize, BaseUrl: appBaseUrl() });

/* patient pages (no login) */
export const DpdpPublicSession = (Token) => get(apiUrls.DpdpPublicSession, { Token }, false);
export const DpdpPublicSubmit = (data) => post(apiUrls.DpdpPublicSubmit, data, false);
export const DpdpPublicRequest = (data) => post(apiUrls.DpdpPublicRaiseRequest, data, false);
export const DpdpPublicNominee = (data) => post(apiUrls.DpdpPublicNominee, data, false);
export const DpdpPublicSummary = (Token) => get(apiUrls.DpdpPublicSummary, { Token }, false);
export const DpdpPublicInfo = () => get(apiUrls.DpdpPublicInfo, null, false);
