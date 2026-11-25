import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";










const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.split(",")?.[1];
      if (result) resolve(result);
      else reject(new Error("Unable to convert file to base64"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
const parseGeminiJSON = (rawText = "") => {
  const cleaned = String(rawText)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
};



export const BindVendor = async (StoreTypeID) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(
      `${apiUrls.BindVendor}?StoreTypeID=${0}`,//all vendor bind medical and general store
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

























// View Supplier Return (15-Nov-2026). Errors come back as { success: false, message }.
const srvCall = async (url, options) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(url, options);
  } catch (error) {
    return { success: false, message: error?.message || "Something went wrong" };
  } finally {
    store.dispatch(setLoading(false));
  }
};
// key = { salesNo, storeTypeID, vendorID, entryMinute } (one save of a supplier return)
const srvKeyQuery = (k) =>
  `SalesNo=${k.salesNo}&StoreTypeID=${k.storeTypeID}&VendorID=${k.vendorID}&EntryMinute=${encodeURIComponent(k.entryMinute || "")}`;
































































































