import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";






// export const RoomType = async () => {
//   store.dispatch(setLoading(true));
//   try {
//     const url = `${apiUrls.RoomType}`;
//     const data = await makeApiRequest(url, {
//       method: "GET",
//     });
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     throw error;
//   }
// };
export const RoomType = async () => {
  store.dispatch(setLoading(true));

  try {
    const url = `${apiUrls.RoomType}`;
    const data = await makeApiRequest(url, { method: "GET" });
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  } finally {
    store.dispatch(setLoading(false));
  }
};


// export const BillingCategory = async () => {
//   store.dispatch(setLoading(true));
//   try {
//     const url = `${apiUrls.BillingCategory}`;
//     const data = await makeApiRequest(url, {
//       method: "GET",
//     });
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     throw error;
//   }
// };
export const BillingCategory = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BillingCategory}`;
    const data = await makeApiRequest(url, { method: "GET" });
    return data;
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Something went wrong",
    };
  } finally {
    store.dispatch(setLoading(false));
  }
};




















export const GetBindDepartment = async (transID, viewRate) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetBindDepartment}?transID=${transID}&viewRate=${viewRate}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};






export const GetAuthorization = async (Type) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetAuthorization}?Type=${Type}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};









export const BindCategory = async (Type) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.BindCategory}?Type=${Type}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
  }
};





export const Rate = async (TID, SurgeryID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.Rate}?TID=${TID}&SurgeryID=${SurgeryID}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};


























































































export const handleValidateUserToBill = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.ValidateUserToBill}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};



export const GetAfterConfirmationCancellationRights = async (AppID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ConfirmationCancellationRights}?AppID=${AppID}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};





