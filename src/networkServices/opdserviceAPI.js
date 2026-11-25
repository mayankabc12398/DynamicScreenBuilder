import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const Oldpatientsearch = async (searchKey, Type = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.Oldpatientsearch}?SearchKey=${searchKey}&Type=${Type}`,
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































export const GetDoctorAppointmentTimeSlotConsecutive = async (
  doctorID,
  appointmentDate,
  subCategoryID = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDoctorAppointmentTimeSlotConsecutive}?DocId=${doctorID}&date=${appointmentDate}&SubCategoryID=${subCategoryID || 0}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};






export const GetGlobalResources = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetGlobalResources}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};






































