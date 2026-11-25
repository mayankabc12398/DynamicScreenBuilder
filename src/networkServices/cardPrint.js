import moment from "moment";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const cardPrintSearch = async (data) => {
  store.dispatch(setLoading(true));
  try {
    const cardPrintList = await makeApiRequest(
      `${apiUrls.searchCardPrint}?patientID=${data?.patientID}&fromDate=${data?.fromDate}&&toDate=${data?.toDate}`,
      {
        method: "get",
      }
    );
    store.dispatch(setLoading(false));
    return cardPrintList
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const cardPrintViewPhoto = async (data) => {
  store.dispatch(setLoading(true));
  const options = {
    method: "GET",
  };
  try {
    const cardPrintList = await makeApiRequest(
      `${apiUrls.ViewPhoto}?patientID=${data?.UHID}&dateEnrolled=${data?.DateEnrolled}`,
      options
    );
    store.dispatch(setLoading(false));
    return cardPrintList?.data;
  } catch (error) {

    store.dispatch(setLoading(false));
    throw error;
  }
};

export const cardPrintUploadPhoto = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params
    };
    const data = await makeApiRequest(
      apiUrls.UploadPhoto, options, 'multipart/form-data'
    );
    store.dispatch(setLoading(false));
    return data
  } catch (err) {
    store.dispatch(setLoading(false));
    // notify("No record found","error")
    console.log(err);
  }
};

// export const PatientFeedBackReportApi = async (data) => {
//     store.dispatch(setLoading(true));
//     try {
//         const cardPrintList = await makeApiRequest(
//             `${apiUrls.PatientFeedBackReport}?patientID=${data?.patientID}&&fromDate=${data?.fromDate}&&toDate=${data?.toDate}`,
//             {
//                 method: "get",
//             }
//         );
//         store.dispatch(setLoading(false));
//         return cardPrintList
//     } catch (error) {
//         store.dispatch(setLoading(false));
//         throw error;
//     }
// };
export const PatientFeedBackReportApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PatientFeedBackReport}`,
      {
        method: "post",
        data: payload
      }
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PatientFeedBackReportPrint = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PatientFeedBackReportPrint}`,
      {
        method: "post",
        data: payload
      }
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};


// doctorID: card of that doctor's consultation only (a visit with two consultants); empty = the visit's card(s).
// isSticker = 1: the OPD sticker (2 labels per doctor) instead of the card.
export const getPrintCardPrintOut = async (pid,transactionID,reportType,isLogo,doctorID,isSticker) => {
  store.dispatch(setLoading(true));
  try {
    const printCardOutput = await makeApiRequest(
      `${apiUrls.PrintCard}?pid=${pid}&TransactionID=${transactionID}&reportType=${reportType}` +
        (isLogo === undefined || isLogo === null ? "" : `&isLogo=${isLogo}`) +
        (doctorID ? `&DoctorID=${doctorID}` : "") +
        (isSticker ? `&isSticker=1` : ""),
      {
        method: "get",
      }
    );
    store.dispatch(setLoading(false));
    return printCardOutput
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
// Doctors consulted in a visit (one row per doctor); empty unless OPDCardPerDoctor = 1.
export const getOPDCardDoctors = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(
      `${apiUrls.GetOPDCardDoctors}?TransactionID=${transactionID}`,
      { method: "get" }
    );
  } catch (error) {
    return null;
  } finally {
    store.dispatch(setLoading(false));
  }
};
// EMR preview header: OPD card details of a visit (issue date/time, app. type, day/time,
// department, unit doctors, room / queue no., bill no. and amount). No loader - background fetch.
export const getConsultationHeaderInfo = async (transactionID) => {
  try {
    return await makeApiRequest(
      `${apiUrls.GetConsultationHeaderInfo}?TransactionID=${transactionID}`,
      { method: "get" }
    );
  } catch (error) {
    return null;
  }
};
export const getPrintStickerOut = async (patId) => {
  store.dispatch(setLoading(true));
  try {
    const printStickerOut = await makeApiRequest(
      `${apiUrls.PrintSticker}?patId=${patId}`,
      {
        method: "get",
      }
    );
    store.dispatch(setLoading(false));
    return printStickerOut
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

