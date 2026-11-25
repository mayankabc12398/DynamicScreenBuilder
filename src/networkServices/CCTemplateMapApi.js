/**
 * Chief Complaint Template Mapping.
 *
 * Mapping page aur consultation screen dono yahin se baat karte hain.
 * Saari query backend me SP se chalti hain (sp_CCTemplateMap_*).
 */
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/** Wo doctor jinke paas Chief Complaint template hai. Mapping har doctor ka
 *  apna hota hai, isliye page par pehle doctor chunna padta hai. */
export const CCTemplateMapGetDoctors = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.CCTemplateMapGetDoctors, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.error("CCTemplateMapGetDoctors", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

/** Saare section aur unke template, ek hi call me - mapping page ke liye. */
export const CCTemplateMapGetTemplates = async (doctorID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.CCTemplateMapGetTemplates}?DoctorID=${doctorID ?? 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.error("CCTemplateMapGetTemplates", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

/** Ek Chief Complaint template ka abhi ka mapping. */
export const CCTemplateMapGetMapping = async (doctorID, chiefCompID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.CCTemplateMapGetMapping}?DoctorID=${doctorID ?? 0}&ChiefCompID=${chiefCompID ?? 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.error("CCTemplateMapGetMapping", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

/**
 * Mapping save. Jo screen par dikh raha hai wahi poora set jaata hai - SP
 * purana hata kar naya daalta hai, isliye khaali list bhejna us Chief
 * Complaint ka mapping hata dene ke barabar hai.
 */
export const CCTemplateMapSaveMapping = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.CCTemplateMapSaveMapping, {
      method: "Post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.error("CCTemplateMapSaveMapping", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

/**
 * Consultation ke liye: jude hue template ka asli text.
 *
 * Ye chup-chaap chalta hai - loading spinner nahi dikhata aur error nahi
 * uchhalta, kyunki ye doctor ke Chief Complaint chunne ke saath background me
 * jaata hai. Kuch gadbad ho to bas kuch bind nahi hoga; screen pehle jaisi
 * chalti rahegi.
 */
export const CCTemplateMapGetBindValues = async (doctorID, chiefCompID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.CCTemplateMapGetBindValues}?DoctorID=${doctorID ?? 0}&ChiefCompID=${chiefCompID ?? 0}`,
      { method: "get" },
    );
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    return [];
  }
};
