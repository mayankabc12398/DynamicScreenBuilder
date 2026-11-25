import { useEffect, useState } from "react";
import { EDPCheckUserAuthorization } from "../../networkServices/EDP/edpApi";
import { useLocalStorage } from "./useLocalStorage";

// IPD Billing role sees the amounts always. Any other role sees them only when
// userauthorization.IsViewPatientBillAnyModule = 1 for that user/centre.
// fin_global_resources.IsPatientBillViewAuthorization = 0 opens it for everyone,
// which is the pre-feature behaviour.
export const PATIENT_BILL_VIEW_RESOURCE = "IsPatientBillViewAuthorization";
export const PATIENT_BILL_VIEW_COL = "IsViewPatientBillAnyModule";

const IPD_BILLING_ROLE_NAMES = ["IPD BILLING", "IPD BILLING DESK"];

const isIpdBillingRole = () => {
  const user = useLocalStorage("userData", "get");
  const name = String(user?.roleName || "").trim().toUpperCase();
  return IPD_BILLING_ROLE_NAMES.includes(name);
};

export const useBillAmountVisibility = () => {
  // Start open for the IPD Billing role to avoid a visible blur flicker on every
  // page load; for every other role start closed and flip open only when the
  // User Authorization check confirms access.
  const [showBillAmounts, setShowBillAmounts] = useState(isIpdBillingRole);

  useEffect(() => {
    if (showBillAmounts) return;
    (async () => {
      try {
        const resp = await EDPCheckUserAuthorization(
          PATIENT_BILL_VIEW_COL,
          PATIENT_BILL_VIEW_RESOURCE,
        );
        if (!resp?.success) return;
        const applicable =
          resp?.data?.isApplicable ?? resp?.data?.IsApplicable;
        const authorized =
          resp?.data?.isAuthorized ?? resp?.data?.IsAuthorized;
        if (!applicable) {
          setShowBillAmounts(true);
          return;
        }
        if (authorized === true || authorized === 1 || authorized === "1") {
          setShowBillAmounts(true);
        }
      } catch (e) {
        console.log("useBillAmountVisibility error", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return showBillAmounts;
};

export default useBillAmountVisibility;
