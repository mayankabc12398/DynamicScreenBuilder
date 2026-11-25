import { EDPCheckUserAuthorization } from "../../networkServices/EDP/edpApi";
import { notify } from "../utils";
export const DEMOGRAPHIC_EDIT_RESOURCE = "IsDemographicEditAuthorization";
export const DEMOGRAPHIC_EDIT_RIGHT_COL = "IsEditDemographic";

// Check ON hai:
//   fin_global_resources.IsDemographicEditAuthorization OFF  -> sabke liye khula
//   ON                                                       -> sirf un users ke
//   liye jinke paas userauthorization.IsEditDemographic = 1 hai (us centre ke liye).
// Sabke liye seedha kholna ho to BYPASS_DEMOGRAPHIC_EDIT_AUTH = true kar dijiye.
const BYPASS_DEMOGRAPHIC_EDIT_AUTH = false;

export const useDemographicEditAuth = () => {
  // Backend dono cheezein ek saath batata hai:
  // IsApplicable -> client ke liye ye control ON hai ya nahi
  // IsAuthorized -> logged-in user ko right mila hai ya nahi
  const canEditDemographic = async () => {
    if (BYPASS_DEMOGRAPHIC_EDIT_AUTH) return true;
    try {
      const response = await EDPCheckUserAuthorization(
        DEMOGRAPHIC_EDIT_RIGHT_COL,
        DEMOGRAPHIC_EDIT_RESOURCE,
      );
      if (!response?.success) return false;
      // API camelCase me bhejta hai (isAuthorized). Dono casing padh lete hain
      // taaki serializer setting badalne par right dobara na toote.
      const authorized =
        response?.data?.isAuthorized ?? response?.data?.IsAuthorized;
      return authorized === true || authorized === 1 || authorized === "1";
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  // seeMore item click par: authorized hai to modal khol do, warna message.
  const handleAuthorizedDemographicEdit = async (openModal, message) => {
    if (await canEditDemographic()) {
      openModal?.();
      return;
    }
    notify(
      message || "You are not authorized to edit demographic details",
      "error",
    );
  };

  return {
    canEditDemographic,
    handleAuthorizedDemographicEdit,
  };
};

export default useDemographicEditAuth;
