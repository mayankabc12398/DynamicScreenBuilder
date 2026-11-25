import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";

// Doctor shift by request (key DoctorShiftApprovalRequired): Nursing Ward raises,
// IPD > Approve DoctorShift Request approves / rejects.

const post = async (url, data) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(url, { method: "post", data });
  } catch (error) {
    return { success: false, message: error?.message || "Something went wrong" };
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SaveDoctorShiftRequest = (payload) =>
  post(apiUrls.SaveDoctorShiftRequest, payload);

export const ApproveDoctorShiftRequest = (payload) =>
  post(apiUrls.ApproveDoctorShiftRequest, payload);

export const RejectDoctorShiftRequest = (payload) =>
  post(apiUrls.RejectDoctorShiftRequest, payload);

export const CancelDoctorShift = (payload) =>
  post(apiUrls.CancelDoctorShift, payload);

export const CancelRoomShift = (payload) =>
  post(apiUrls.CancelRoomShift, payload);

// Tools > Patient Room Request (Doctor Shift): requests of every patient.
// { fromDate, toDate (YYYY-MM-DD), ipdNo, status: -1 all / 0 / 1 / 2 }
export const GetDoctorShiftRequestList = async ({ fromDate, toDate, ipdNo, status }) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(
      `${apiUrls.GetDoctorShiftRequestList}?FromDate=${fromDate || ""}&ToDate=${toDate || ""}&IPDNo=${encodeURIComponent(ipdNo || "")}&Status=${status ?? -1}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  } finally {
    store.dispatch(setLoading(false));
  }
};

// status: -1 all, 0 pending, 1 approved, 2 rejected
export const GetDoctorShiftRequests = async (transactionID, status = -1) => {
  try {
    return await makeApiRequest(
      `${apiUrls.GetDoctorShiftRequests}?TransactionID=${Number(transactionID) || 0}&Status=${status}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  }
};
