import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";



























































































export const BindReportData = async () => {
  store.dispatch(setLoading(true));
  try {
    const response = await makeApiRequest(
      `${apiUrls?.BindReportData}`,
      {
        method: "GET",
      }
    );

    store.dispatch(setLoading(false));
    return response;
  } catch (error) {
    store.dispatch(setLoading(false));
    // console.log("BindEmployeeUser error", error);
  }
};


















































