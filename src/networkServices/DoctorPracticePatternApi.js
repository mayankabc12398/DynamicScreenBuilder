import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * What this doctor usually prescribes for patients like the one in front of them: their own
 * earlier visits with a similar provisional diagnosis and age, tallied on the server. The answer
 * is counts and generic items only - no patient id, name, visit or date - and is empty until at
 * least three different patients match. No global spinner: the popup shows its own.
 */
export const DoctorPracticePatternSimilarCases = async (payload) => {
  try {
    return await makeApiRequest(`${apiUrls?.DoctorPracticePatternSimilarCases}`, {
      method: "post",
      data: payload,
    });
  } catch (error) {
    console.log(error, "SomeThing Went Wrong");
  }
};
