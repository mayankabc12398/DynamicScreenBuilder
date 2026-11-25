import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

// List of a patient's booked (future) investigations, grouped by booking date.
// body: { PatientID, FromDate, ToDate }  (dates like "01-Jun-2026")
export const SearchFutureBookingInv = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SearchFutureBookingInv}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "SearchFutureBookingInv error");
  }
};

// Tests booked on a given date for a patient (display only).
export const GetFutureBookingDetails = async (BookingDate, PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetFutureBookingDetails}?BookingDate=${encodeURIComponent(
        BookingDate,
      )}&PatientID=${encodeURIComponent(PatientID)}`,
      { method: "GET" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "GetFutureBookingDetails error");
  }
};

// Same booked tests, returned in the full CPOE billable shape so they can be
// loaded into the OPD bill exactly like the CPOE button does.
export const GetFutureBookingDetailsForBilling = async (PatientID, BookingDate) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetFutureBookingDetailsForBilling}?PatientID=${encodeURIComponent(
        PatientID,
      )}&BookingDate=${encodeURIComponent(BookingDate)}`,
      { method: "GET" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "GetFutureBookingDetailsForBilling error");
  }
};
