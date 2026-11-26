/**
 * The language Print Builder output comes out in: the app language the user
 * picked (header flag dropdown / profile drawer), kept as userData.empLanguage —
 * a Country_langauge_master column such as "Hindi". makeApiRequest sends it as
 * ?lang= on every PrintBuilder/ call, so every print path (GeneratePdf,
 * CommonReceiptPdf, each PrintBuilder/<TemplateCode>, batch, builder previews)
 * follows the app language from the next print on. The API checks the name
 * against the language table and falls back to employee_master.EmpLanguage.
 *
 * Kept apart from printBuilderApi.js, which imports axiosInstance.
 */
import { useLocalStorage } from "../utils/hooks/useLocalStorage";

/** The current print language ("Hindi"), or "" when none is set (the API then uses the user's). */
export const printLanguage = () => {
  try {
    return String(useLocalStorage("userData", "get")?.empLanguage ?? "").trim();
  } catch {
    return "";
  }
};

/** `url` with lang=… added when it is a PrintBuilder/ call that names no language yet. */
export const withPrintLanguage = (url, lang = printLanguage()) => {
  const u = String(url ?? "");
  if (!lang || !/^\/?PrintBuilder\//i.test(u) || /[?&]lang=/i.test(u)) return url;
  return `${u}${u.includes("?") ? "&" : "?"}lang=${encodeURIComponent(lang)}`;
};
