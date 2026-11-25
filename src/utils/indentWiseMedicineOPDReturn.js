/* ---------------------------------------------------------------------------
 * Indent-wise medicine work — one master switch.
 * ---------------------------------------------------------------------------
 * Driven by a single fin_global_resources key (Master > Global Resources):
 *
 *   Name  : IsIndentWiseMedicineOPDReturn
 *   Value : "1" -> the indent work runs
 *           "0" -> disabled
 *
 * A missing row counts as 0, so every site keeps the behaviour it had before
 * this work landed until someone deliberately turns the key on. Turn it on with:
 *
 *   INSERT INTO fin_global_resources (Name, Value, Description, IsActive)
 *   VALUES ('IsIndentWiseMedicineOPDReturn', '1',
 *           'Indent-wise medicine work: 1 = enabled, 0 = disabled', 1);
 *
 * What the key covers (all of it added together, all of it off as one unit):
 *   - Medicine Requisition : the "Other Medicine" free-text request and the
 *                            "Issued From" column that names where the in-hand
 *                            stock was billed (IPD vs Pharmacy).
 *   - Pharmacy Indent modal: the read-only rows for those free-text requests,
 *                            which have no item id, stock, batch or price.
 *   - OPD Return           : the "Indents" button on an OPD/bill search. With
 *                            the key off the button stays IPD-search-only, as
 *                            it was before.
 *   - Patient / IPD Issue  : f_ledgertnxdetail.ReferenceTransactionID carrying
 *                            the admission's TransactionID on a "Save in
 *                            Pharmacy" bill, which is what lets that medicine
 *                            be returned or indented against the admission.
 *
 * Deactivating the row (IsActive = 0) has the same effect as Value 0, because
 * the API only returns active rows.
 * ------------------------------------------------------------------------- */

export const INDENT_WISE_MEDICINE_OPD_RETURN_KEY =
  "IsIndentWiseMedicineOPDReturn";

// GetGlobalResources reaches callers either as a bare array (CommonSlice) or
// wrapped in `.data` (a direct GetGlobalResourcesAPI response).
export const findGlobalResourceValue = (globalResources, name) => {
  const list = Array.isArray(globalResources)
    ? globalResources
    : globalResources?.data || [];
  return list.find((item) => item?.Name === name)?.Value ?? "";
};

/**
 * @param {Array|Object} globalResources - GetGlobalResources from CommonSlice,
 *                                         or a GetGlobalResourcesAPI response.
 * @returns {boolean} true only when the key is present and set to 1.
 */
export const isIndentWiseMedicineOPDReturnEnabled = (globalResources) =>
  String(
    findGlobalResourceValue(globalResources, INDENT_WISE_MEDICINE_OPD_RETURN_KEY),
  ).trim() === "1";

/* fin_global_resources 'DisableOPDEMGPatientReturn'. Set to 1 where an OPD / EMG
   medicine return must not be raised from Patient Return at all: the search type
   can still be picked, but Search is dead, so nothing can be pulled up to return.
   Missing row, 0, or an inactive row leaves the screen as it was. */
export const DISABLE_OPD_EMG_PATIENT_RETURN_KEY = "DisableOPDEMGPatientReturn";

export const isOPDEMGPatientReturnDisabled = (globalResources) =>
  String(
    findGlobalResourceValue(globalResources, DISABLE_OPD_EMG_PATIENT_RETURN_KEY),
  ).trim() === "1";
