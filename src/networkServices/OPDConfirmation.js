import { apiUrls } from "../networkServices/apiEndpoints";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { OPDCONFIRMATIONSTATE } from "../utils/constant";
import { notify } from "../utils/utils";
import makeApiRequest from "./axiosInstance";


// GET APPOINTMENT DETAIL
const getAppointmentDetailAPIData = async (params) => {
  console.log("PPPDDDAA", params);
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    // api call to load currency detail
    const data = await makeApiRequest(`${apiUrls.getAppointmentDetails}`, options);
    if(data.status === true){
      notify(data.message, "success");
    }
    console.log(data);
    if(data?.data?.success === false){
        console.log(data?.data?.message);
      notify(data?.data?.message, "error")
    }
  
    store.dispatch(setLoading(false));
    // GetExpenceSubHeadByExpenceHeadID()
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};






// Update  APPOINTMENT Schedu;e
export const updateAppointmentSchedule = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    // api call to load currency detail
    const data = await makeApiRequest(`${apiUrls.updateAppointmentShedule}`, options);
    console.log(data);
    store.dispatch(setLoading(false));
    getAppointmentDetailAPIData(OPDCONFIRMATIONSTATE)
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};





export const UpdateAppointmentStatus = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data:params
    };
    // api call to load currency detail
    const data = await makeApiRequest(`${apiUrls.UpdateAppointmentStatus}`, options);
    console.log(data);
    store.dispatch(setLoading(false));
    // GetExpenceSubHeadByExpenceHeadID()
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};
// Send SMS to patient(s) — inserts into sms_log via SMSMaster/SaveSMSDoctorsEmployee.
// Payload: { Type: 2 (Patient), ListItems: [{ id, Message, Mobile, Selects: 1 }] }
export const SaveSMSDoctorsEmployee = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveSMSDoctorsEmployee}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error sending SMS", error);
  }
};

export const GetPatientDoctorAppointmentDetails = async (appointmentID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(`${apiUrls.GetPatientDoctorAppointmentDetails}?appointmentID=${appointmentID}`, options);
    console.log(data);
    store.dispatch(setLoading(false));
    // GetExpenceSubHeadByExpenceHeadID()
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  }
};






