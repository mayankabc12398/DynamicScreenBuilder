import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

// Create a Razorpay Payment Link (Razorpay auto-sends the SMS; a copy is logged
// to sms_log on the server). payload: { Amount, Description, CustomerName,
// CustomerContact, CustomerEmail, PatientID, Receipt, CentreID, UserID }
export const RZPCreatePaymentLink = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.RZPCreatePaymentLink}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "RZPCreatePaymentLink error");
  }
};

// Poll a payment link's status. Returns data: { status, paid, reference }
export const RZPGetPaymentLinkStatus = async (paymentLinkId) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.RZPGetPaymentLinkStatus}?PaymentLinkId=${encodeURIComponent(paymentLinkId)}`,
      { method: "GET" },
    );
    return data;
  } catch (error) {
    console.log(error, "RZPGetPaymentLinkStatus error");
  }
};

// Create an on-screen UPI QR. payload: { Amount, Description, PatientID }
// Returns data: { id, image_url, status }
export const RZPCreateQrCode = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.RZPCreateQrCode}`, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "RZPCreateQrCode error");
  }
};

// Poll a QR code for captured payments. Returns data: { paid, reference }
export const RZPGetQrPayments = async (qrCodeId) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.RZPGetQrPayments}?QrCodeId=${encodeURIComponent(qrCodeId)}`,
      { method: "GET" },
    );
    return data;
  } catch (error) {
    console.log(error, "RZPGetQrPayments error");
  }
};
