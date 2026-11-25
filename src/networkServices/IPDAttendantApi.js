import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";

// IPD frame tab "Attendant Details" (IPDAttendant API).

export const IPDAttendantList = async (transactionID) => {
  try {
    return await makeApiRequest(
      `${apiUrls.IPDAttendantList}?TransactionID=${encodeURIComponent(transactionID)}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  }
};

// View IPD Patient "Attendant" filter - all active attendants of the login centre.
export const IPDAttendantFilterList = async () => {
  try {
    return await makeApiRequest(apiUrls.IPDAttendantFilterList, { method: "get" });
  } catch (error) {
    return { success: false, data: [] };
  }
};

export const IPDAttendantSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.IPDAttendantSave, {
      method: "post",
      data: payload,
    });
  } catch (error) {
    return { success: false, message: error?.message };
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Room types of the centre with their free bed count.
export const IPDAttendantRoomTypes = async () => {
  try {
    return await makeApiRequest(apiUrls.IPDAttendantRoomTypes, {
      method: "get",
    });
  } catch (error) {
    return { success: false, data: [] };
  }
};

// Available beds of one room type (same as IPD admission: IsRoomClean = 1) with nobody in them.
export const IPDAttendantAvailableBeds = async (ipdCaseTypeID) => {
  try {
    return await makeApiRequest(
      `${apiUrls.IPDAttendantAvailableBeds}?IPDCaseTypeID=${encodeURIComponent(ipdCaseTypeID)}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  }
};

export const IPDAttendantVacateBed = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.IPDAttendantVacateBed, {
      method: "post",
      data: payload,
    });
  } catch (error) {
    return { success: false, message: error?.message };
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const IPDAttendantCancel = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.IPDAttendantCancel, {
      method: "post",
      data: payload,
    });
  } catch (error) {
    return { success: false, message: error?.message };
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Discharges the attendant: bed freed, its room charge closed at the days stayed.
export const IPDAttendantDischarge = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.IPDAttendantDischarge, {
      method: "post",
      data: payload,
    });
  } catch (error) {
    return { success: false, message: error?.message };
  } finally {
    store.dispatch(setLoading(false));
  }
};
