import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const updateClaims = async (RoleID, CenterID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: { RoleID: RoleID, CenterID: CenterID },
    };
    const data = await makeApiRequest(`${apiUrls.UpdateCliam}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const updateTheme = async (param) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: param,
    };
    const data = await makeApiRequest(`${apiUrls.UpdateUserTheme}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const updateFontSize = async (param) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: param,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateApplicationFont}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const updateUserDetail = async (param, employeeID) => {
  store.dispatch(setLoading(true));
  const formData = new FormData();
  formData.append("EmailId", param?.EmailId);
  formData.append("MobileNo", param?.MobileNo);
  formData.append("EmployeeID", employeeID);
  formData.append("Photo", param?.preview);
  try {
    const options = {
      method: "post",
      data: formData,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateEmployeeProfile}`,
      options,
      "multipart/form-data",
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const updateSignatureApi = async (param, employeeID) => {
  store.dispatch(setLoading(true));
  const formData = new FormData();
  formData.append("EmailId", param?.EmailId);
  formData.append("MobileNo", param?.MobileNo);
  formData.append("EmployeeID", employeeID);
  formData.append("Photo", param?.preview);
  formData.append("EmployeeSignature", param?.EmployeeSignature);
  try {
    const options = {
      method: "post",
      data: formData,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateEmployeeProfile}`,
      options,
      "multipart/form-data",
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const updatePassword = async (param) => {
  store.dispatch(setLoading(true));
  console.log("param", param);
  try {
    const options = {
      method: "post",
      data: {
        Oldpassword: param?.Oldpassword,
        password: param?.NewPassword,
        ConfirmPassword: param?.ConfirmPassword,
      },
    };
    const data = await makeApiRequest(`${apiUrls.ChangePassword}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
/* The module this user lands in, and the screen inside it - one call, one row, so the
   role can never be saved with the page left behind.

   Both halves of the route go up: screens are opened as
   navigate(url, { state: { actualUrl } }) and read their breadcrumb and sub-screen tabs
   off actualUrl, which differs from the route wherever a screen sits under a frame menu.

   An empty url clears the page and the user goes back to landing on the dashboard. */
export const MasterPageSetDefaultRole = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: { roleId: payload?.roleID },
    };
    // Left out of the call entirely where the caller sent no page, which the server
    // reads as "leave whatever is stored alone". An empty string is a different thing:
    // that is how a pinned page is cleared.
    const page =
      payload?.url === undefined || payload?.url === null
        ? ""
        : `&url=${encodeURIComponent(payload.url)}&actualUrl=${encodeURIComponent(payload?.actualUrl ?? "")}`;
    const data = await makeApiRequest(
      `${apiUrls.MasterPageSetDefaultRole}?roleId=${payload?.roleID}${page}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const DoctorGoogleConnectAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      data: {},
    };
    const data = await makeApiRequest(
      `${apiUrls.DoctorGoogleConnectAPI}?DoctorId=${payload?.DoctorId}&Date=${payload?.Date}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const getBindReferType = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      data: {},
    };
    const data = await makeApiRequest(`${apiUrls.BindReferType}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const getBindReferDoctorPrint = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      data: {},
    };
    const data = await makeApiRequest(`${apiUrls.BindReferDoctorPrint}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

/**
 * Per-user grid column layout (order + hidden columns).
 *
 * Deliberately does NOT touch the global loading spinner: these run in the
 * background behind the localStorage copy, and a layout sync should never
 * block or flicker the screen. A failure is logged and swallowed — the grid
 * falls back to the local copy.
 */
export const getUserColumnPreference = async (screenKey) => {
  try {
    const url = `${apiUrls.GetUserColumnPreferenceURL}?ScreenKey=${encodeURIComponent(
      screenKey,
    )}`;
    return await makeApiRequest(url, { method: "get" });
  } catch (error) {
    console.error("Column layout could not be loaded", error);
    return null;
  }
};

export const saveUserColumnPreference = async (screenKey, preference) => {
  try {
    const options = {
      method: "post",
      data: { screenKey, preference },
    };
    return await makeApiRequest(apiUrls.SaveUserColumnPreferenceURL, options);
  } catch (error) {
    console.error("Column layout could not be saved", error);
    return null;
  }
};

/**
 * Confirms the signed in user's own login password. Screens that gate an action
 * behind a password call this rather than comparing anything in the browser.
 */
export const verifyLoginPassword = async (password) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: { password: password },
    };
    const data = await makeApiRequest(`${apiUrls.VerifyLoginPassword}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
