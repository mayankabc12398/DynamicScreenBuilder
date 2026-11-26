import { setLoading } from "../../store/reducers/loadingSlice/loadingSlice";
import store from "../../store/store";
import { apiUrls } from "../apiEndpoints";
import makeApiRequest from "../axiosInstance";


export const GetSubScreenMenuByRole = async (vSubMenuID, vIsFrameMenu) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetSubScreenMenuByRoleURL}?vSubMenuID=${vSubMenuID}&vIsFrameMenu=${vIsFrameMenu}`, {
      method: "get",
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};





























































































































