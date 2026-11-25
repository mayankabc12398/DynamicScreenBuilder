import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const requestGiloysDoctorAccess = async () => {
  try {
    return await makeApiRequest(apiUrls.GiloysRequestDoctorAccess, {
      method: "POST",
      data: {},
    });
  } catch (error) {
    console.error("Error requesting Giloys doctor access", error);
    throw error;
  }
};

export const initiateGiloysDoctorLogin = async (giloysLoginID) => {
  try {
    return await makeApiRequest(apiUrls.GiloysInitiate, {
      method: "POST",
      data: {
        GiloysLoginId: Number(giloysLoginID),
      },
    });
  } catch (error) {
    console.error("Error initiating Giloys doctor login", error);
    throw error;
  }
};

export const createGiloysPatient = async (giloysLoginID, patientID) => {
  try {
    return await makeApiRequest(apiUrls.GiloysCreatePatient, {
      method: "POST",
      data: {
        GiloysLoginId: Number(giloysLoginID),
        PatientId: String(patientID),
      },
    });
  } catch (error) {
    console.error("Error creating patient in Giloys", error);
    throw error;
  }
};

export const getGiloysDoctorDashboardUrl = async (params) => {
  try {
    return await makeApiRequest(apiUrls.GiloysGetDoctorDashboardUrl, {
      method: "POST",
      data: params,
    });
  } catch (error) {
    console.error("Error fetching Giloys dashboard URL", error);
    throw error;
  }
};

export const validateGiloysSsoUser = async (params) => {
  try {
    return await makeApiRequest(apiUrls.GiloysValidateSsoUser, {
      method: "POST",
      data: params,
    });
  } catch (error) {
    console.error("Error validating Giloys SSO user", error);
    throw error;
  }
};
