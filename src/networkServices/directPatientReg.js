import moment from "moment";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import { apiUrlsNew } from "./newApiEndpoints";

export const ValidateDuplicatePatientEntry = async (values, Ids) => {
  store.dispatch(setLoading(true));
  try {
    let documentIds = []
    Ids?.length > 0 && Ids?.map((val) => {
      let obj = {}
      obj.idProofID = val?.name?.value ? val?.name?.value?.split('#')[0] : ""
      obj.idProofName = val?.name?.label
      obj.idProofNumber = val?.id
      documentIds.push(obj)
    })
    const data = await makeApiRequest(apiUrls.ValidateDuplicatePatientEntry, {
      method: "post",
      data: {
        "patientID": values?.Barcode ? values?.Barcode : "",
        "firstName": values?.PFirstName ? values?.PFirstName : "",
        "lastName": values?.PLastName ? values?.PLastName : "",
        "mobileNumber": values?.Mobile ? values?.Mobile : "",
        "IDProofs": documentIds
      },
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const findAgeByDOB = async (dob) => {
  store.dispatch(setLoading(true));
  try {

    const data = await makeApiRequest(`${apiUrls.GetAgeByDateOfBirth}?Date=${moment(new Date(dob)).format('YYYY-MM-DD')}`, {
      method: "get"
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Patient Registration "Area": master_area list and the "+" add.
export const BindArea = async () => {
  try {
    return await makeApiRequest(apiUrls.BindArea, { method: "get" });
  } catch (error) {
    return { success: false, data: [] };
  }
};

// Patient Registration "Postal Address": the master list and the "+" add (mapped to State + District).
export const BindPostalAddress = async () => {
  try {
    return await makeApiRequest(apiUrls.BindPostalAddress, { method: "get" });
  } catch (error) {
    return { success: false, data: [] };
  }
};

export const SavePostalAddress = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SavePostalAddress, { method: "post", data: payload });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    return { success: false, message: error?.message };
  }
};

export const SaveArea = async (areaName, districtID = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveArea, {
      method: "post",
      data: { AreaName: areaName, DistrictID: Number(districtID) || 0 },
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Edit button beside Area: rename an area of master_area.
export const UpdateArea = async (id, areaName, districtID = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.UpdateArea, {
      method: "post",
      data: { ID: Number(id), AreaName: areaName, DistrictID: Number(districtID) || 0 },
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    return { success: false, message: error?.message };
  }
};

// Patient Registration "Patient Type" (patient_type): "+" adds a type, Edit renames one.
export const SavePatientType = async (patientType) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SavePatientType, {
      method: "post",
      data: { PatientType: patientType },
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    return { success: false, message: error?.message };
  }
};

export const UpdatePatientType = async (id, patientType) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.UpdatePatientType, {
      method: "post",
      data: { ID: Number(id), PatientType: patientType },
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    return { success: false, message: error?.message };
  }
};

// ========================ECHS APIS=======================
export const getECHSDoctorsListApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.getECHSDoctorListApi}`, {
      method: "get"
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const getECHSPolyclinicListApi = async (doctorId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.getECHSPolyclinicsListApi}?DoctorId=${doctorId}`, {
      method: "get"
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const getCheckMotherBabyApi = async (patientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew.CheckMotherBaby}?patientID=${patientID}`, {
      method: "get"
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// ========================GET REFER EMPLOYEE APIS=======================
export const getReferEmployeesListApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.getReferEmployees}`, {
      method: "get"
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const PatientRegistrationAPI = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveReg, {
      method: "post",
      data: params,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PatientUpdateRegistrationAPI = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.UpdateRegistration, {
      method: "post",
      data: params,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
