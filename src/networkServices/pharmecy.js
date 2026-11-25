import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";




  
export const pharmecyAddItem = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyAddItemURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const IndentIssueAddItem = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.IndentIssueAddItem}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };


 

  

  

















