// DigitalFileStore.js
let sharedFile = null;
let sharedTransactionId = null;

export const setSharedFile = (file) => { sharedFile = file; };
export const getSharedFile = () => sharedFile;

export const setSharedTransactionId = (id) => {
  sharedTransactionId = id ? String(id) : null;
};
export const getSharedTransactionId = () => sharedTransactionId || "";

// The transaction id reaches these screens from several places (frame-menu
// props, router state, query string) and the casing differs per caller - IPD
// sends `transactionID`, OPD `TransactionID` (also under `currentPatient`),
// Emergency rows `TID` - so every entry point resolves it through here.
export const readTransactionId = (source) => {
  if (!source || typeof source !== "object") return "";
  const raw =
    source.transactionID ??
    source.TransactionID ??
    source.transactionId ??
    source.TransactionId ??
    source.transactionid ??
    source.TID ??
    source.tid ??
    "";
  const id = raw === null || raw === undefined ? "" : String(raw).trim();
  return id || readTransactionId(source.currentPatient);
};

// Resolves the id from the screen's own data, then the URL, then whatever the
// previous screen in the flow stored - the upload page and the editor are two
// separate routes. The upload page is where a patient's flow starts, so it
// passes `useShared: false`: falling back there would attach the form to the
// previous patient.
export const resolveTransactionId = (patientData, search = "", { useShared = true } = {}) => {
  const fromData = readTransactionId(patientData);
  if (fromData) return fromData;

  const params = new URLSearchParams(search || "");
  const fromQuery = (params.get("transactionId") || params.get("tid") || "").trim();
  if (fromQuery) return fromQuery;

  return useShared ? getSharedTransactionId() : "";
};
