import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import makeApiRequest from "./axiosInstance";
import { apiUrls } from "./apiEndpoints";

export const SaveMealTimeTable = async (data) => {
  try {
    store.dispatch(setLoading(true));
    const res = await makeApiRequest(apiUrls.SaveMealTime, {
      method: "POST",
      data: data,
    });
    store.dispatch(setLoading(false));
    return res;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "Something Went Wrong");
  }
};

export const GetMealTimeTableData = async (data) => {
  try {
    store.dispatch(setLoading(true));
    const res = await makeApiRequest(
      `${apiUrls.LoadMealTimeData}?PatientID=${data.PatientID}&TransactionID=${data.TransactionID}`,
      {
        method: "GET",
      },
    );
    store.dispatch(setLoading(false));
    return res;
  } catch (error) {
    console.error(error, "Something Went Wrong");
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const PrintMealTimeTable = async (data) => {
  try {
    store.dispatch(setLoading(true));
    const res = await makeApiRequest(
      `${apiUrls.PrintMealTimeTable}?PatientID=${data.PatientID}&TransactionID=${data.TransactionID}`,
      {
        method: "GET",
      },
    );
    store.dispatch(setLoading(false));
    return res;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error(error, "Something Went Wrong");
  } finally {
    store.dispatch(setLoading(false));
  }
};
