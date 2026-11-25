import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const SearchList = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.SearchList}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



























// -- Tumor Board -----------------------------------------------------------
const tbCall = async (url, options) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};



























// export const updateFileClosed = async (AppID) => {
//   console.log(AppID);

//   try {
//     const url = `${apiUrls.FileClose}?AppID=${AppID}`;
//     const data = await makeApiRequest(url, {
//       method: "get",
//     });
//     return data;
//   } catch (error) {
//     throw error;
//   }
// };

export const updateFileClosed = async (AppID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrls.FileClose}?AppID=${AppID}`,
      options,
    );
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};





export const SearchPatient = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.SearchPatient}`, options);
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};
export const BindDetails = async (transactionID) => {
  // store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindDetails}?TID=${transactionID}`,
      options,
    );
    if (data.status === true) {
      notify(data.message, "success");
    }
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};



































/* Doctor Group master + group rates (flag DoctorGroupRateReview) ---------- */
const doctorGroupRequest = async (url, options, label) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(url, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(`Error ${label}`, error);
  }
};







// end
