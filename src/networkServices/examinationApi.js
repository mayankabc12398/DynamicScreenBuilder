import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { apiUrlsNew } from "./newApiEndpoints";

export const GetBindDoctorGroup = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.BindGroup}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const TemperatureRoomSearchAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.TemperatureRoomSearch}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const UpdateTemperatureRoomCall = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew.UpdateTemperatureRoomCall}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
// SRS-2026-0060 point 1. Reverse of UpdateTemperatureRoomCall.
export const UpdateTemperatureRoomUnCall = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.UpdateTemperatureRoomUnCall}`,
      {
        method: "POST",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ExaminationRoomAddTriageBooking = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ExaminationRoomAddTriageBooking}`,
      {
        method: "POST",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ExaminationRoomSaveTriageBooking = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ExaminationRoomSaveTriageBooking}`,
      {
        method: "POST",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ExaminationRoomBindTriageBooking = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ExaminationRoomBindTriageBooking}?fromdate=${payload?.fromdate}&todate=${payload?.todate}`,
      {
        method: "GET",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ExaminationRoomBindClinic = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.ExaminationRoomBindClinic}`, {
      method: "GET",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ExaminationRoomBindTriageCode = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ExaminationRoomBindTriageCode}`,
      {
        method: "GET",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const UpdateTemperatureRoomOut = async (App_ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.UpdateTemperatureRoomOut}?App_ID=${App_ID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const TransferPatientToOtherDr = async (
  newDoctorId,
  doctorName,
  App_ID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ExaminationRoomTransferPatientToOtherDr}?newDoctorId=${newDoctorId}&doctorName=${doctorName}&patAppID=${App_ID}`,
      {
        method: "POST",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetBindVisitType = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.BindVisitType}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const handleCounsellingPatientSearch = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.CounsellingPatientSearch}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const handleIVFSaveLabPrescriptionOPD = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.IVFSaveLabPrescriptionOPD}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindSpouse = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.BindSpouse}?PatientID=${PatientID}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetIVFPackages = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.BindIVFPackages}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SaveIVFDonorConsent = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.SaveIVFDonorConsent}`,
      {
        method: "POST",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};