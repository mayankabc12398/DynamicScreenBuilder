/**
 * Dynamic print builder — HospediaAPI/PrintBuilder.
 *
 * Templates (draft + immutable published versions), datasources, images, and
 * the print call itself. `printTemplate` answers exactly like CommonReceiptPdf
 * (`{ success, message, data: { pdfUrl } }`), so a screen can switch to a
 * published template without touching the code that opens the PDF:
 *
 *   const res = await printTemplate("OPD_BILL", { transactionId });
 *   if (res?.success) RedirectURL(res.data.pdfUrl);
 *
 * Builder calls are silent (the builder shows its own inline state); the print
 * call shows the page loader like CommonReceiptPdf does.
 */
import { apiUrls } from "./apiEndpoints";
import makeApiRequest, { APIBaseURL } from "./axiosInstance";
import { RedirectURL } from "./PDFURL";
import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";

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

/* ------------------------------------------------------------- language */
/**
 * The language prints come out in (the app language) — sent as ?lang= on every PrintBuilder/
 * call by makeApiRequest. A builder preview in another language passes `lang` in its payload
 * (pbFetchSample / pbPreviewPdf / pbPreviewExport), which wins over the query.
 */
export { printLanguage } from "./printLanguage";
/** The app languages (master_application_language): [{ key_code, label, icon }]. */
export const pbLanguages = () => get(apiUrls.GetApplicationLanguageURL);

/* --------------------------------------------------------------- status */
export const pbStatus = () => get(apiUrls.PrintBuilderStatus);
export const pbEngineInfo = () => get(apiUrls.PrintBuilderEngineInfo);

/* ------------------------------------------------------------ templates */
export const pbTemplates = (search = "", category = "", includeDeleted = false) =>
  get(`${apiUrls.PrintBuilderTemplates}${q({ search, category, includeDeleted: includeDeleted ? "true" : "" })}`);
export const pbTemplate = (code) => get(`${apiUrls.PrintBuilderTemplate}${q({ code })}`);
export const pbCreateTemplate = (payload) => post(apiUrls.PrintBuilderCreateTemplate, payload);
/** payload: { code, name, category, description, datasourceCode, template: JSON string, draftRev } */
export const pbSaveTemplate = (payload) => post(apiUrls.PrintBuilderSaveTemplate, payload);
export const pbDuplicateTemplate = (code, newCode, newName) =>
  post(apiUrls.PrintBuilderDuplicateTemplate, { code, newCode, newName });
export const pbDeleteTemplate = (code) => post(apiUrls.PrintBuilderDeleteTemplate, { code });
/** Every category of a template (none = []); only the category changes, not the draft → { code, category }. */
export const pbSetTemplateCategory = (code, categories) => post(apiUrls.PrintBuilderSetTemplateCategory, { code, categories });
export const pbExportTemplate = (code) => get(`${apiUrls.PrintBuilderExportTemplate}${q({ code })}`);
export const pbImportTemplate = (payload, newCode, overwrite = false) =>
  post(apiUrls.PrintBuilderImportTemplate, { payload, newCode, overwrite });
export const pbValidateTemplate = (template, datasourceCode) =>
  post(apiUrls.PrintBuilderValidateTemplate, { template, datasourceCode });
export const pbPublishTemplate = (code, note) => post(apiUrls.PrintBuilderPublishTemplate, { code, note });
export const pbVersions = (code) => get(`${apiUrls.PrintBuilderVersions}${q({ code })}`);
export const pbVersion = (code, versionNo) => get(`${apiUrls.PrintBuilderVersion}${q({ code, versionNo })}`);
export const pbActivateVersion = (code, versionNo) => post(apiUrls.PrintBuilderActivateVersion, { code, versionNo });
export const pbRestoreVersion = (code, versionNo) => post(apiUrls.PrintBuilderRestoreVersion, { code, versionNo });
export const pbStarters = () => get(apiUrls.PrintBuilderStarters);

/* ---------------------------------------------------------- datasources */
export const pbDatasources = () => get(apiUrls.PrintBuilderDatasources);
export const pbDatasource = (code) => get(`${apiUrls.PrintBuilderDatasource}${q({ code })}`);
/** payload: { code, name, kind: "sp" | "api", definition: JSON string, sampleParams?: JSON string } */
export const pbSaveDatasource = (payload) => post(apiUrls.PrintBuilderSaveDatasource, payload);
export const pbDeleteDatasource = (code) => post(apiUrls.PrintBuilderDeleteDatasource, { code });
export const pbProcedures = (search = "") => get(`${apiUrls.PrintBuilderProcedures}${q({ search })}`);
export const pbProcedureParams = (name) => get(`${apiUrls.PrintBuilderProcedureParams}${q({ name })}`);
/**
 * Runs a datasource with sample params. Returns { dataJson, schema, ms, translation } — the
 * data object a template sees (parse dataJson), its field list, and (not English) which
 * labels have a translation: { language, code, total, translated, missing: [phrase] }.
 * payload.lang: the language to translate into (default: the app language).
 */
export const pbFetchSample = (payload) => post(apiUrls.PrintBuilderFetchSample, payload);
/** "Find a record": { datasourceCode | definition, search } → { columns, rows } from the datasource's sampleLookup procedure. */
export const pbSampleLookup = (payload) => post(apiUrls.PrintBuilderSampleLookup, payload);

/* --------------------------------------------------------------- assets */
export const pbUploadAsset = (payload) => post(apiUrls.PrintBuilderUploadAsset, payload);
export const pbAssets = (tag = "") => get(`${apiUrls.PrintBuilderAssets}${q({ tag })}`);
export const pbDeleteAsset = (assetKey) => post(apiUrls.PrintBuilderDeleteAsset, { assetKey });
/** Relative to APIBaseURL — <img> cannot send a token, the endpoint is anonymous and keys are random. */
export const pbAssetPath = (key) => `${apiUrls.PrintBuilderAsset}?key=${encodeURIComponent(key)}`;

/* ---------------------------------------------------------------- print */
/**
 * The draft from the builder, rendered by the server exactly as a print would be:
 * { pdfUrl, format, translation } (translation as pbFetchSample). payload.lang as pbFetchSample.
 */
export const pbPreviewPdf = (payload) => post(apiUrls.PrintBuilderPreviewPdf, payload);

/**
 * Prints with a template's published version. Same response as CommonReceiptPdf:
 * { success, message, data: { pdfUrl } } — open with RedirectURL(data.pdfUrl).
 * `duplicate` may also travel in params ({ Duplicate: "1" }), as CommonReceiptPdf payloads carry it.
 * A failure answers HTTP 200 with success=false; its message is also put at data.message,
 * where screens written for CommonReceiptPdf (which failed with HTTP 400) read it.
 *
 * options (optional): { reason, direct }
 *   reason — why a duplicate is printed (templates with reprint.requireReason refuse a duplicate without one)
 *   direct — after success, load the PDF in a hidden iframe and open the print dialog
 *            (falls back to RedirectURL in a new tab). The response is returned either way.
 * The calling page (pathname + hash) travels as `source` for the print log — makeApiRequest's
 * third argument is the Content-Type, so it cannot carry an X-Print-Source header.
 */
export const printTemplate = async (templateCode, params = {}, duplicate, options = {}) => {
  const { reason, direct } = options || {};
  store.dispatch(setLoading(true));
  try {
    const res = await makeApiRequest(apiUrls.PrintBuilderGeneratePdf, {
      method: "post",
      data: {
        templateCode,
        params,
        ...(duplicate == null ? {} : { duplicate: !!duplicate }),
        ...(reason ? { reason } : {}),
        source: printSource(),
      },
    });
    // a template that wants a reason for a duplicate: ask once, then print again with it
    if (res && res.success === false && !reason && /reason is required/i.test(res.message || "")) {
      store.dispatch(setLoading(false));
      const asked = await askReprintReason();
      if (asked) return printTemplate(templateCode, params, duplicate, { ...options, reason: asked });
    }
    if (res && res.success === false && (res.data == null || typeof res.data !== "object")) return { ...res, data: { message: res.message } };
    if (direct && res?.success && res?.data?.pdfUrl) await printDirect(res.data.pdfUrl);
    return res;
  } finally {
    store.dispatch(setLoading(false));
  }
};

/**
 * A small modal asking why a duplicate is printed (plain DOM, so any screen can use
 * printTemplate without rendering anything). Resolves to the reason, or "" on cancel.
 */
const REASONS = ["Patient lost the original", "Original damaged", "Requested by insurance / TPA", "Office copy", "Correction re-print"];
export const askReprintReason = () =>
  new Promise((resolve) => {
    const back = document.createElement("div");
    back.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:100000;display:flex;align-items:center;justify-content:center;font-family:Inter,Segoe UI,Arial,sans-serif";
    back.innerHTML = `<div role="dialog" aria-modal="true" style="background:#fff;border-radius:12px;width:min(420px,92vw);box-shadow:0 20px 50px rgba(0,0,0,.25);overflow:hidden">
      <div style="padding:14px 18px;background:#fff7ed;border-bottom:1px solid #fed7aa;font-weight:700;color:#9a3412">Reason for the duplicate print</div>
      <div style="padding:14px 18px;display:flex;flex-direction:column;gap:8px">
        <div data-chips style="display:flex;flex-wrap:wrap;gap:6px"></div>
        <textarea data-reason rows="2" placeholder="Type a reason…" style="width:100%;box-sizing:border-box;border:1px solid #d5d9e2;border-radius:8px;padding:8px;font:inherit;font-size:13px;resize:vertical"></textarea>
      </div>
      <div style="padding:10px 18px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #eef0f4">
        <span role="button" tabindex="0" data-cancel style="padding:7px 14px;border-radius:7px;border:1px solid #d5d9e2;cursor:pointer;font-size:13px">Cancel</span>
        <span role="button" tabindex="0" data-ok style="padding:7px 14px;border-radius:7px;background:#ea580c;color:#fff;cursor:pointer;font-size:13px;font-weight:600">Print duplicate</span>
      </div></div>`;
    const ta = back.querySelector("[data-reason]");
    const chips = back.querySelector("[data-chips]");
    REASONS.forEach((r) => {
      const c = document.createElement("span");
      c.textContent = r;
      c.style.cssText = "padding:4px 10px;border-radius:999px;background:#ffedd5;color:#9a3412;font-size:12px;cursor:pointer";
      c.onclick = () => {
        ta.value = r;
        ta.focus();
      };
      chips.appendChild(c);
    });
    const done = (v) => {
      back.remove();
      resolve(v);
    };
    back.querySelector("[data-cancel]").onclick = () => done("");
    back.querySelector("[data-ok]").onclick = () => ta.value.trim() && done(ta.value.trim());
    back.addEventListener("keydown", (e) => e.key === "Escape" && done(""));
    document.body.appendChild(back);
    ta.focus();
  });

/** The page a print is asked from, for pb_print_log.SourcePage. */
const printSource = () => {
  try {
    return `${window.location.pathname}${window.location.hash}`.slice(0, 300);
  } catch {
    return undefined;
  }
};

/** Absolute URL of a relative pdfUrl / fileUrl the API returned (as RedirectURL builds it). */
export const pbFileUrl = (relative) => `${APIBaseURL}/${String(relative || "").replace(/^\/+/, "")}`;

/** Fetches the PDF, prints it from a hidden iframe; any failure opens it in a new tab instead. */
const printDirect = async (pdfUrl) => {
  try {
    if (/RenderPrintable/i.test(pdfUrl)) throw new Error("html fallback prints itself");
    const r = await fetch(pbFileUrl(pdfUrl));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const blobUrl = URL.createObjectURL(await r.blob());
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    frame.src = blobUrl;
    await new Promise((resolve, reject) => {
      frame.onload = () => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      frame.onerror = reject;
      document.body.appendChild(frame);
    });
    setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  } catch {
    RedirectURL(pdfUrl);
  }
};

/**
 * Many records of one template in ONE PDF: { pdfUrl, count, failed: [{ index, message }] }.
 * options: { batchSearch, duplicate, reason } — batchSearch (with an empty paramsList) prints the
 * datasource's record-lookup rows. Shows the page loader; does not open the PDF.
 */
export const printTemplateBatch = async (templateCode, paramsList = [], options = {}) => {
  const { batchSearch, duplicate, reason } = options || {};
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(apiUrls.PrintBuilderGenerateBatchPdf, {
      method: "post",
      data: { templateCode, paramsList, batchSearch, duplicate: !!duplicate, reason, source: printSource() },
    });
  } finally {
    store.dispatch(setLoading(false));
  }
};

/** A published template as "xlsx" | "docx" | "png": { fileUrl, fileName, format }; opens the file on success. */
export const exportTemplate = async (templateCode, params = {}, format = "xlsx") => {
  store.dispatch(setLoading(true));
  try {
    const res = await makeApiRequest(apiUrls.PrintBuilderGenerateExport, {
      method: "post",
      data: { templateCode, params, format, source: printSource() },
    });
    if (res?.success && res?.data?.fileUrl) RedirectURL(res.data.fileUrl);
    return res;
  } finally {
    store.dispatch(setLoading(false));
  }
};

/** The builder's draft as a file: { template, datasourceCode, params, format, code? } → { fileUrl, fileName, format }. */
export const pbPreviewExport = (payload) => post(apiUrls.PrintBuilderPreviewExport, payload);

/* ----------------------------------------------------------- where used */
export const pbWhereUsed = (code) => get(`${apiUrls.PrintBuilderWhereUsed}${q({ code })}`);

/* ------------------------------------------------------------- variants */
export const pbVariants = (code) => get(`${apiUrls.PrintBuilderVariants}${q({ code })}`);
/** payload: { id?, templateCode, variantCode, centreId?, matchParam?, matchValue?, priority, note, isActive } */
export const pbSaveVariant = (payload) => post(apiUrls.PrintBuilderSaveVariant, payload);
export const pbDeleteVariant = (id) => post(apiUrls.PrintBuilderDeleteVariant, { id });
/** → { templateCode, variantId, matched: "centre" | "param" | "both" | null } */
export const pbResolveVariant = (code, centreId, params) =>
  get(`${apiUrls.PrintBuilderResolveVariant}${q({ code, centreId, params: params ? JSON.stringify(params) : "" })}`);

/* --------------------------------------------------------------- rights */
export const pbTemplateAccess = (code) => get(`${apiUrls.PrintBuilderTemplateAccess}${q({ code })}`);
/** payload: { code, editorRoleIds: [], editorEmployeeIds: [], printRoleIds: [] } */
export const pbSaveTemplateAccess = (payload) => post(apiUrls.PrintBuilderSaveTemplateAccess, payload);
export const pbRoles = () => get(apiUrls.PrintBuilderRoles);
export const pbEmployees = (search = "") => get(`${apiUrls.PrintBuilderEmployees}${q({ search })}`);

/* ----------------------------------------------------------------- lock */
/** Takes or refreshes (heartbeat) the edit lock → { mine, lockedBy, lockedByName, since, heartbeatOn }. */
export const pbLockTemplate = (code, force = false) => post(apiUrls.PrintBuilderLockTemplate, { code, force: !!force });
export const pbUnlockTemplate = (code) => post(apiUrls.PrintBuilderUnlockTemplate, { code });

/* --------------------------------------------------------------- blocks */
export const pbBlocks = (search = "", category = "") => get(`${apiUrls.PrintBuilderBlocks}${q({ search, category })}`);
/** payload: { code, name, category, description, width, height, elements: JSON array string } */
export const pbSaveBlock = (payload) => post(apiUrls.PrintBuilderSaveBlock, payload);
export const pbDeleteBlock = (code) => post(apiUrls.PrintBuilderDeleteBlock, { code });

/* --------------------------------------------------------- param picker */
/** → [{ value, label }] from the parameter's options or optionsProc. */
export const pbParamOptions = (datasourceCode, param) =>
  get(`${apiUrls.PrintBuilderParamOptions}${q({ datasourceCode, param })}`);
