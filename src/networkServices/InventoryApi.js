import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";













export const BindVendor = async (StoreTypeID) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(
      `${apiUrls.BindVendor}?StoreTypeID=${0}`,//all vendor bind medical and general store
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

























































































































