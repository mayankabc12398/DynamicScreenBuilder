import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * Loyalty coins. Its own service file so the billing screens' imports show exactly where the
 * feature touches them. Every call here is optional for the bill: callers treat a failure
 * as "no coins", never as a reason to stop a booking.
 *
 * `loud` = false keeps the global spinner off for the background reads the booking screen
 * fires while the operator is still typing.
 */
const call = async (url, options, loud = true) => {
  if (loud) store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(url, options);
    if (loud) store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    if (loud) store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const LoyaltyCoinGetMaster = () =>
  call(`${apiUrls?.LoyaltyCoinGetMaster}`, { method: "get" });

export const LoyaltyCoinSaveMaster = (payload) =>
  call(`${apiUrls?.LoyaltyCoinSaveMaster}`, { method: "post", data: payload });

export const LoyaltyCoinGetSummary = (patientID, billAmount) =>
  call(
    `${apiUrls?.LoyaltyCoinGetSummary}?PatientID=${encodeURIComponent(patientID)}&BillAmount=${Number(billAmount) || 0}`,
    { method: "get" },
    false,
  );

export const LoyaltyCoinSendRedeemOtp = (payload) =>
  call(`${apiUrls?.LoyaltyCoinSendRedeemOtp}`, { method: "post", data: payload });

export const LoyaltyCoinVerifyRedeemOtp = (payload) =>
  call(`${apiUrls?.LoyaltyCoinVerifyRedeemOtp}`, { method: "post", data: payload });

export const LoyaltyCoinReleaseRedeem = (token) =>
  call(
    `${apiUrls?.LoyaltyCoinReleaseRedeem}?Token=${encodeURIComponent(token)}`,
    { method: "post" },
    false,
  );

export const LoyaltyCoinOnBillSaved = (payload) =>
  call(`${apiUrls?.LoyaltyCoinOnBillSaved}`, { method: "post", data: payload }, false);
