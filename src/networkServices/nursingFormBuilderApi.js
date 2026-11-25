/**
 * Nursing form builder — HospediaAPI/NursingFormBuilder.
 *
 * A nursing form is an uploaded PDF or image with fields placed on it in mm.
 * Bound fields name keys of an IPDDetail/PatientSearch row, so any page that
 * already holds that row can print the published form for the patient:
 *
 *   const res = await nfVersion(formId);            // latest published
 *   <NursingFormRender form={res.data.snapshot} data={patientRow} />
 *
 * Builder calls are silent (the builder shows its own inline state).
 */
import moment from "moment";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest, { APIBaseURL } from "./axiosInstance";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";

const SILENT = { meta: { silent: true }, silentError: true };
const get = (url) => makeApiRequest(url, { method: "get", ...SILENT });
const post = (url, data) => makeApiRequest(url, { method: "post", data, ...SILENT });
const q = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  });
  const t = s.toString();
  return t ? `?${t}` : "";
};

/* --------------------------------------------------------------- forms */
export const nfStatus = () => get(apiUrls.NursingFormStatus);
/** Logged-in user + printing centre (centreId, else the user's): { user: {...}, centre: {... LogoUrl} }. */
export const nfContext = (centreId) => get(`${apiUrls.NursingFormContext}${q({ centreId })}`);
/**
 * One patient's binding row from sp_ipd_GetIPDPatientDetailsNursingForm — id = IPD No, or a
 * UHID (its latest IPD admission). Keys are the procedure's columns (PName, IPDNO, AgeSex …).
 */
export const nfPatientDetails = (id) => get(`${apiUrls.NursingFormPatientDetails}${q({ id: String(id ?? "").trim() })}`);
export const nfForms = ({ search, category, ward, status, includeDeleted } = {}) =>
  get(`${apiUrls.NursingForms}${q({ search, category, ward, status, includeDeleted: includeDeleted ? "true" : "" })}`);
export const nfForm = (id) => get(`${apiUrls.NursingForm}${q({ id })}`);
export const nfSaveForm = (form) => post(apiUrls.NursingFormSave, form);
export const nfPublish = (id, note = "") => post(apiUrls.NursingFormPublish, { id, note });
export const nfVersions = (id) => get(`${apiUrls.NursingFormVersions}${q({ id })}`);
/** versionNo 0 = the latest published version. */
export const nfVersion = (id, versionNo = 0) => get(`${apiUrls.NursingFormVersion}${q({ id, versionNo })}`);
export const nfPublishedForms = (ward = "") => get(`${apiUrls.NursingFormPublished}${q({ ward })}`);
export const nfDuplicate = (id, name) => post(apiUrls.NursingFormDuplicate, { id, name });
export const nfDelete = (id) => post(apiUrls.NursingFormDelete, { id });
export const nfRestore = (id) => post(apiUrls.NursingFormRestore, { id });
export const nfExport = (id) => get(`${apiUrls.NursingFormExport}${q({ id })}`);
export const nfImport = (payload) => post(apiUrls.NursingFormImport, payload);

/* --------------------------------------------------------------- files */
/**
 * Saved on the API as D/HISDocument/nursingform/Templates/<formName>.<ext>; answers { filePath }
 * for the form's save (no nf_file row). With formId (a Replace) the form's old file is
 * overwritten unless a published version still uses it.
 */
export const nfUploadFile = (name, dataUrl, formName = "", formId = 0) => post(apiUrls.NursingFormUploadFile, { name, dataUrl, formName, formId });
/** Anonymous URL of a file of a form saved before paths (nf_file key) — usable by <img> and pdf.js. */
export const nfFileUrl = (key) => (key ? `${APIBaseURL}/${apiUrls.NursingFormFile}?key=${encodeURIComponent(key)}` : "");

/**
 * Files saved since paths (nf_form.FilePath, nf_patient_entry.PdfPath) are served by
 * Doc?path= with login, so they are fetched with the token and handed out as a
 * same-origin object URL — pdf.js, <img>, the print iframe and html2canvas all take it.
 * One fetch per path per page load; nfForgetDoc after the file is replaced.
 */
const docs = new Map();
export function nfDocUrl(path) {
  if (!path) return Promise.resolve("");
  if (!docs.has(path)) {
    const token = useLocalStorage("token", "get");
    const user = useLocalStorage("userData", "get");
    const url = `${APIBaseURL}/${apiUrls.NursingFormDoc}${q({ path, userValidateID: user?.userValidateID })}`;
    const p = fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "The file was not found on the server." : `The file could not be loaded (${r.status}).`);
        return r.blob();
      })
      .then((b) => URL.createObjectURL(b));
    p.catch(() => docs.delete(path)); // a failed fetch is retried next time
    docs.set(path, p);
  }
  return docs.get(path);
}
export const nfForgetDoc = (path) => docs.delete(path);
/** Opens a stored file in a new tab (the tab opens first, so no popup blocker stops it). */
/**
 * A new tab opened now (while the click still counts: no popup blocker) showing a
 * "Preparing PDF…" spinner until the caller sends it to the PDF with tab.location.href.
 */
export function nfLoadingTab(text = "Preparing PDF…") {
  const w = window.open("", "_blank");
  if (!w) return null;
  try {
    w.document.title = text;
    w.document.body.innerHTML = `<style>
      html,body{height:100%;margin:0;background:#f5f6fa;font:15px system-ui,-apple-system,"Segoe UI",sans-serif;color:#475569}
      .w{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
      .s{width:42px;height:42px;border:4px solid #e0e7ff;border-top-color:#4f46e5;border-radius:50%;animation:r .8s linear infinite}
      @keyframes r{to{transform:rotate(360deg)}}
    </style><div class="w"><div class="s"></div><div>${text.replace(/</g, "&lt;")}</div></div>`;
  } catch {
    /* the tab is still usable without the spinner */
  }
  return w;
}

export async function nfOpenDoc(path, { fresh = false } = {}) {
  const w = nfLoadingTab("Opening PDF…");
  try {
    if (fresh) nfForgetDoc(path);
    const url = await nfDocUrl(path);
    if (w) w.location.href = url;
    else window.open(url, "_blank");
  } catch (e) {
    w?.close();
    throw e;
  }
}

/* ------------------------------------------------- patient fill-in data */
export const nfSaveEntry = (entry) => post(apiUrls.NursingFormSaveEntry, entry);
export const nfEntry = (formId, transactionId) => get(`${apiUrls.NursingFormEntry}${q({ formId, transactionId })}`);
export const nfEntries = (transactionId) => get(`${apiUrls.NursingFormEntries}${q({ transactionId })}`);
/** Every copy of one form for one admission, newest first (entryNo 3, 2, 1). A new copy is started after one is finalised. */
export const nfFormEntries = (formId, transactionId) => get(`${apiUrls.NursingFormFormEntries}${q({ formId, transactionId })}`);
/** The filled form as PDF, kept on the API as D/HISDocument/nursingform/<ipdNo>/<form name>[ #n].pdf (replaced on every save of that copy; nf_patient_entry.PdfPath). */
export const nfSaveEntryPdf = ({ formId, transactionId, ipdNo, dataUrl, entryId }) => post(apiUrls.NursingFormSaveEntryPdf, { formId, transactionId, ipdNo, dataUrl, entryId });

/* ----------------------------------------------------------- print log */
export const nfLogPrint = (row) => post(apiUrls.NursingFormLogPrint, row);
/** The logged-in user's defaults, e.g. { inputMode: "draw" | "type" }; {} when none. */
export const nfUserPrefs = () => get(apiUrls.NursingFormUserPrefs);
/** Merges these keys into the user's defaults (null removes one). */
export const nfSaveUserPrefs = (patch) => post(apiUrls.NursingFormSaveUserPrefs, patch);
export const nfPrintLog = ({ formId, transactionId, fromDate, toDate, take } = {}) =>
  get(`${apiUrls.NursingFormPrintLog}${q({ formId, transactionId, fromDate, toDate, take })}`);

/* ------------------------------------------- design-time patient sample */
/**
 * Currently admitted patients from IPDDetail/PatientSearch — the same payload
 * IPDPatientCardView sends with its defaults. The builder only needs the keys
 * of one row (and a few rows to preview with), so any date range works; when
 * today's range is empty it widens to the last 90 days.
 */
export async function nfSamplePatients() {
  const fmt = (d) => moment(d).format("DD-MMM-YYYY");
  const body = (from, to) => ({
    mrNo: "",
    pName: "",
    department: "ALL",
    floor: "",
    roomType: "0",
    ageFrom: "",
    ddlAgeFrom: "YRS",
    ageTo: "",
    ddlAgeTo: "YRS",
    ipdNo: "",
    doctorID: "0",
    panel: "0",
    parentPanel: "0",
    fromDate: fmt(from),
    toDate: fmt(to),
    admitDischarge: "CAD",
    type: "0",
    id: 0,
    isPatientReceived: 2,
    visitDateFrom: "",
    visitDateTo: "",
    labNo: "",
    userType: "",
  });
  const today = new Date();
  let res = await post(apiUrls.PatientSearch, body(today, today));
  let rows = Array.isArray(res?.data) ? res.data : [];
  if (!rows.length) {
    const from = new Date(today);
    from.setDate(from.getDate() - 90);
    res = await post(apiUrls.PatientSearch, body(from, today));
    rows = Array.isArray(res?.data) ? res.data : [];
  }
  return rows;
}
