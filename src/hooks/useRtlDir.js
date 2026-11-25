import { useTranslation } from "react-i18next";

/**
 * Languages written right to left. Codes come from the server
 * (`empLanguageCode`), so only the primary subtag is compared: "ar", "ar-SA"
 * and "AR" are all Arabic.
 */
const RTL_LANGUAGES = new Set(["ar", "he", "iw", "fa", "ur", "ps", "sd", "ug", "yi", "dv", "ku", "ckb"]);

export function isRtlLanguage(lng) {
  if (typeof lng !== "string" || !lng) return false;
  return RTL_LANGUAGES.has(lng.toLowerCase().split(/[-_]/)[0]);
}

/**
 * "rtl" while the app's language is written right to left, else "ltr".
 * Re-renders the caller when the language is switched.
 */
export function useRtlDir() {
  const { i18n } = useTranslation();
  return isRtlLanguage(i18n?.language) ? "rtl" : "ltr";
}
