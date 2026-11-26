import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import makeApiRequest from "../../../networkServices/axiosInstance";
import { apiUrls } from "../../../networkServices/apiEndpoints";
import { notify } from "../../../utils/utils";
import { setLoading } from "../loadingSlice/loadingSlice";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import store from "../../store";


const initialState = {
  user: {},
  loading: false,
  error: "",
  message: "",
  success: false,
};

export const signInAction = createAsyncThunk(
  "signIn",
  async (data, { dispatch }) => {
    const options = {
      method: "POST",
      data,
    };
    try {
      dispatch(setLoading(true));
      const data = await makeApiRequest(apiUrls?.login, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);
export const LoginGetEmployeeForForget = createAsyncThunk(
  "forgotPassword",
  async (data, { dispatch }) => {
    const options = {
      method: "POST",
      data,
    };
    try {
      dispatch(setLoading(true));
      const data = await makeApiRequest(apiUrls?.LoginGetEmployeeForForget, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);
export const SendForgetPassword = createAsyncThunk(
  "SendforgotPassword",
  async (data, { dispatch }) => {
    const options = {
      method: "POST",
      data,
    };
    try {
      dispatch(setLoading(true));
      const data = await makeApiRequest(apiUrls?.LoginSendForgetPassword, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);

export const GetLoginPageImageAPI = async () => {
  // debugger
  // store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.GetLoginPageImageURL}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }finally{
    store.dispatch(setLoading(false));
  }
};
export const handleValidateUserToBill = createAsyncThunk(
  "ValidateUserToBill",
  async (data, { dispatch }) => {
    const options = {
      method: "POST",
      data,
    };
    try {
      dispatch(setLoading(true));
      const data = await makeApiRequest(apiUrls?.ValidateUserToBill, options);
      dispatch(setLoading(false));
      return data;
    } catch {
      dispatch(setLoading(false));
    }
  }
);
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signInAction.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.success = false;
      })
      .addCase(signInAction.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.loading = false;
        state.success = true;
        state.error = "";
        state.message = payload?.message;
        payload?.success === false
          ? notify(payload?.Message, "error")
          : notify(payload?.Message, "success");
          
        if (payload?.success) {
          const userDetails = payload?.data?.userDetails;
          useLocalStorage("userData", "set", {
            ...userDetails,
            ...(userDetails?.defaultRole !== null &&
            userDetails?.defaultRole !== undefined &&
            userDetails?.defaultRole !== ""
              ? { defaultRole: Number(userDetails.defaultRole) }
              : {}),
          });
          useLocalStorage("token", "set", payload?.data?.token);
          // The login API returns the caller's IP (browsers can't read the
          // machine IP themselves). "0.0.0.0" marks it unknown (older API or
          // no address resolved) so saves never send an empty/"null" ipAddress.
          useLocalStorage("ip", "set", payload?.data?.clientIp || "0.0.0.0");
          // Computer name from reverse DNS on the API side; "" when unknown.
          useLocalStorage("systemName", "set", payload?.data?.clientName || "");
          // MAC is only knowable when this PC shares a subnet with the API
          // server (or is the server); "" otherwise.
          useLocalStorage("macAddress", "set", payload?.data?.clientMac || "");
        }
      })
      .addCase(signInAction.rejected, (state, { error }) => {
        console.log(error.message);
        state.loading = false;
        state.error = error.message;
        state.success = false;
        state.message = error.message;
        notify(error.message, "error");
      });
  },
});

export default authSlice.reducer;





// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import makeApiRequest from "../../../networkServices/axiosInstance";
// import { apiUrls } from "../../../networkServices/apiEndpoints";
// import { getLocalIP, notify } from "../../../utils/utils";
// import { setLoading } from "../loadingSlice/loadingSlice";
// import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";

// const initialState = {
//   user: {},
//   userIP: "",
//   loading: false,
//   error: "",
//   message: "",
//   success: false,
// };

// export const signInAction = createAsyncThunk(
//   "signIn",
//   async (data, { dispatch }) => {
//     const options = {
//       method: "POST",
//       data,
//     };
//     try {
//       dispatch(setLoading(true));
//       const responseData = await makeApiRequest(apiUrls?.login, options);
      
//       // Get IP address after successful login
//       if (responseData?.success) {
//         const userIP = await getLocalIP();
//         responseData.userIP = userIP;
//       }
      
//       dispatch(setLoading(false));
//       return responseData;
//     } catch (error) {
//       dispatch(setLoading(false));
//       throw error;
//     }
//   }
// );

// export const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     setUserIP: (state, action) => {
//       state.userIP = action.payload;
//     },
//     clearAuth: (state) => {
//       state.user = {};
//       state.userIP = "";
//       state.loading = false;
//       state.error = "";
//       state.message = "";
//       state.success = false;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(signInAction.pending, (state) => {
//         state.loading = true;
//         state.error = "";
//         state.success = false;
//       })
//       .addCase(signInAction.fulfilled, (state, { payload }) => {
//         state.user = payload;
//         state.loading = false;
//         state.success = true;
//         state.error = "";
//         state.message = payload?.message;
        
//         if (payload?.success === false) {
//           notify(payload?.Message, "error");
//         } else {
//           notify(payload?.Message, "success");
//         }
          
//         if (payload?.success) {
//           useLocalStorage("userData", "set", payload?.data?.userDetails);
//           useLocalStorage("token", "set", payload?.data?.token);
          
//           if (payload?.userIP) {
//             state.userIP = payload.userIP;
//             useLocalStorage("ip", "set", payload.userIP);
//           }
//         }
//       })
//       .addCase(signInAction.rejected, (state, { error }) => {
//         console.error("Sign in error:", error.message);
//         state.loading = false;
//         state.error = error.message;
//         state.success = false;
//         state.message = error.message;
//         notify(error.message, "error");
//       });
//   },
// });

// export const { setUserIP, clearAuth } = authSlice.actions;
// export default authSlice.reducer;