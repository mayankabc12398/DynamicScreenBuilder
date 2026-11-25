import axios from "axios";
import { notify } from "../utils/utils";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";
import { clearStoragePreservingTablePrefs } from "../utils/helpers";
import { installLoader } from "./installLoader";
import { redirectToLogin } from "./navigationService";
import { withPrintLanguage } from "./printLanguage";

// export const APIBaseURL = ()=>{
//   const dynamicUrl = import.meta.env.VITE_APP_REACT_APP_DYNAMIC_URL === "true";
// const baseFromEnv = import.meta.env.VITE_APP_REACT_APP_BASE_URL;
// const baseUrl = dynamicUrl !== true
//   ? `${window.location.protocol}//${window.location.hostname}${
//       window.location.port ? `:${window.location.port}` : ""
//     }/api/v1`
//   : baseFromEnv;
//   return baseUrl
// } 

const dynamicUrl = import.meta.env.VITE_APP_REACT_APP_DYNAMIC_URL === "true";
const baseFromEnv = import.meta.env.VITE_APP_REACT_APP_BASE_URL;
export const APIBaseURL = dynamicUrl
  ? `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? `:${window.location.port}` : ""
    }/api/v1`
  : baseFromEnv;
  
  console.log("FINAL API URL:", APIBaseURL);

// export const APIBaseURL = window.location?.hostname === "localhost" ? baseFromEnv : window.APP_CONFIG.API_URL;

const axiosInstance = axios.create({
  baseURL: APIBaseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Drive the global in-flight loader for every call through this instance.
// Additive only — no call-site changes. Pass { meta: { silent: true } } via
// makeApiRequest options to opt a request out of the loader.
installLoader(axiosInstance);

let globalErrorFlag = false;

export const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
  // return (...args) => {
  //   clearTimeout(timeout);
  //   timeout = setTimeout(() => func.apply(this, args), wait);
  // };
};

const globalErrorNotifier = debounce((message) => {
  notify(message, "error");
  globalErrorFlag = false;
  logOut();
}, 1000);

const logOut = () => {
  clearStoragePreservingTablePrefs(); // keep table-columns:* prefs
  // soft SPA redirect (no full browser reload) + redux reset; falls back to a
  // hard redirect only if React hasn't registered a navigator yet.
  redirectToLogin();
  notify("Please authenticate", "error");
};

// HTTP status code -> human message. Fallback when the server sends no message.
const STATUS_MESSAGES = {
  400: "Bad request. Please check the submitted data.",
  401: "Session expired. Please log in again.",
  403: "Access denied. You don't have permission to do this.",
  404: "Requested resource not found.",
  405: "This action is not allowed.",
  408: "Request timed out. Please try again.",
  409: "Conflict with the current data. Please refresh and retry.",
  413: "The data you sent is too large.",
  422: "Validation failed. Please check your input.",
  429: "Too many requests. Please slow down and retry.",
  500: "Internal server error. Please try again later.",
  501: "This feature is not implemented yet.",
  502: "Bad gateway. The server returned an invalid response.",
  503: "Service unavailable. Please try again later.",
  504: "Gateway timeout. The server took too long to respond.",
};

// Pull the first usable string out of a server `errors` payload, which can be
// a string, an array, or an object of field -> string[] (e.g. { Name: ["..."] }).
const extractFirstError = (errors) => {
  if (!errors) return undefined;
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return extractFirstError(errors[0]);
  if (typeof errors === "object") return extractFirstError(Object.values(errors)[0]);
  return undefined;
};

// Build a proper, status-aware error message for any failed request.
export const getApiErrorMessage = (error) => {
  // No response => network down, CORS, DNS, or aborted request.
  if (!error?.response) {
    if (error?.code === "ERR_NETWORK")
      return "Network error. Unable to reach the server.";
    if (error?.code === "ECONNABORTED")
      return "Request timed out. Please try again.";
    return error?.message || "Something went wrong. Please try again.";
  }

  const { status, data } = error.response;

  // Prefer a message the server actually sent.
  const serverMsg =
    (typeof data === "string" && data) ||
    data?.message ||
    data?.error ||
    extractFirstError(data?.errors);
  if (serverMsg && typeof serverMsg === "string") return serverMsg;

  // Fall back to a friendly message keyed by status code.
  return STATUS_MESSAGES[status] || `Request failed (status ${status}).`;
};

const makeApiRequest = async (url, options, header) => {
  const localData = useLocalStorage("token", "get");
  const validUser = useLocalStorage("userData", "get");
  const { method, data, meta, silentError } = options;
  const lowerCaseMethod = method.toLowerCase();

  const headers = {
    "Content-Type": header ? header : "application/json",
    Authorization: localData && `Bearer ${localData}`,
  };

  // Print Builder prints follow the app language (printLanguage.js); other URLs are unchanged
  const urlWithLang = withPrintLanguage(url);

  const parameterChecker = () => {
    const symbol = urlWithLang.includes("?") ? "&" : "?";
    return symbol;
  };

  const finalUrl = validUser
    ? `${urlWithLang}${parameterChecker()}userValidateID=${validUser?.userValidateID}`
    : urlWithLang;
  try {
    const response = await axiosInstance({
      method: lowerCaseMethod,
      url: finalUrl,
      ...(data && { data }),
      ...(meta && { meta }),
      headers,
    });
    return response.data;
  } catch (error) {
    const isAuthError =
      error?.response?.status === 401 ||
      error?.response?.statusText === "Please authenticate";

    if (isAuthError) {
      // Auth errors go through the debounced notifier + logout (once).
      if (!globalErrorFlag) {
        globalErrorFlag = true;
        globalErrorNotifier(getApiErrorMessage(error));
      }
    } else if (!silentError) {
      // All other failures: status-aware message (400/403/404/500/network/...).
      // Callers pass { silentError: true } to opt out — used by optional/proposed
      // endpoints that fall back gracefully (e.g. employee leave eligibility).
      notify(getApiErrorMessage(error), "internalerror");
    }
    return error.response;
  }
};

export default makeApiRequest;

// DPDP access log (utils/dpdpRuntime.js) adds a request interceptor to this instance.
export { axiosInstance };
