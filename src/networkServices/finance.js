import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const CommonAPIGetDateTimeNow = async (type) => {
  // store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.CommonAPIGetDateTimeNow}`,
      {
        method: "get",
      }
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};








































