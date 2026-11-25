import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";

// IPD > Add Doctor: another consulting doctor on an admission (f_multipledoctor_ipd).

const call = async (url, options) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(url, options);
  } catch (error) {
    return { success: false, message: error?.message || "Something went wrong" };
  } finally {
    store.dispatch(setLoading(false));
  }
};

// IPD No or UHID (or the admission's TransactionID, from the IPD frame) -> { patient, doctors }
export const GetIPDPatientDoctors = (searchText, transactionID = 0) =>
  call(
    `${apiUrls.GetIPDPatientDoctors}?SearchText=${encodeURIComponent(searchText || "")}&TransactionID=${Number(transactionID) || 0}`,
    { method: "get" },
  );

// { transactionID, doctorID } -> data: doctors
export const AddIPDDoctor = (payload) =>
  call(apiUrls.AddIPDDoctor, { method: "post", data: payload });

// { id, transactionID } -> data: doctors
export const RemoveIPDDoctor = (payload) =>
  call(apiUrls.RemoveIPDDoctor, { method: "post", data: payload });
