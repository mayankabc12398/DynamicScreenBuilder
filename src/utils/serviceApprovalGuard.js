import { ApprovalCheckServiceApproval } from "../networkServices/opdserviceAPI";
import { notify } from "./ustil2";

/**
 * SRS-2026-0056 point 14.
 *
 * Gate used before a patient is given a service on:
 *   1. Triage / Examination Room
 *   2. Doctor OPD (View Consultation)
 *   3. Sample Collection
 *
 * The rule, as specified by the client:
 *   - bill paid in full            -> allowed, no approval needed
 *   - anything still outstanding   -> the item must be approved first
 *   - and the whole check applies ONLY when fin_global_resources
 *     'ServiceApprovalRequired' = '1'
 *
 * The switch is evaluated server-side, so a site that has not opted in behaves exactly as
 * it does today and this helper always resolves to `true`.
 *
 * Fails OPEN on purpose: if the check itself errors, the patient is let through. Refusing
 * treatment because a validation call failed would be a worse outcome than the thing the
 * validation is trying to prevent.
 *
 * @param {object}   opts
 * @param {string}   opts.patientID       UHID. Required for the check to mean anything.
 * @param {string}  [opts.transactionID]  Pass it whenever the screen knows the bill, so the
 *                                        check targets that bill instead of today's bills.
 * @param {boolean} [opts.silent]         Suppress the toast and just return the verdict.
 * @returns {Promise<boolean>} true = go ahead, false = blocked (message already shown)
 */
export const ensureServiceApproved = async ({
  patientID,
  transactionID,
  silent = false,
} = {}) => {
  if (!patientID) return true;

  const response = await ApprovalCheckServiceApproval(patientID, transactionID);

  // Server said the check is off, or it could not run - let the patient through.
  const data = response?.data ?? {};
  const required = data?.Required ?? data?.required;
  const allowed = data?.Allowed ?? data?.allowed;

  if (!required || allowed !== false) return true;

  if (!silent) {
    notify(
      response?.message ||
        "Please collect the full amount from the patient, or get the service approved in case of credit.",
      "error",
    );
  }
  return false;
};

export default ensureServiceApproved;
