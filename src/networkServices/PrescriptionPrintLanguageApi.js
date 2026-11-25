import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * Each doctor's default prescription print language. Plain reads and writes with no global
 * spinner: they run in the background around the Print button, which has its own.
 */
export const PrescriptionPrintLanguageGetDefault = async () => {
  try {
    return await makeApiRequest(`${apiUrls?.PrescriptionPrintLanguageGetDefault}`, {
      method: "get",
    });
  } catch (error) {
    console.log(error, "SomeThing Went Wrong");
  }
};

export const PrescriptionPrintLanguageSetDefault = async (language) => {
  try {
    return await makeApiRequest(
      `${apiUrls?.PrescriptionPrintLanguageSetDefault}?Language=${encodeURIComponent(language)}`,
      { method: "post" },
    );
  } catch (error) {
    console.log(error, "SomeThing Went Wrong");
  }
};
