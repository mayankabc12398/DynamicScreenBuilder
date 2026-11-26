import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";



export const CKEditorShortKeyAPIControlsAPI = async () => {
  // store.dispatch(setLoading(true));
  try {
    const option = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.CKEditorShortKeyAPIControls}`,
      option
    );
    // store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    // store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};


