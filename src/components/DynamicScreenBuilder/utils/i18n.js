/**
 * Labels on a screen are i18n KEYS, not English.
 *
 * A converted screen carries what the page it replaces carried: `t("PanelName")`
 * became the column header "PanelName", `t("Bill_Amount")` became "Bill_Amount".
 * Rendering those strings raw is how a converted grid ends up captioned
 * "PanelName" where the original said "Scheme Name" — and it takes every other
 * language down with it.
 *
 * So the renderer translates on the way out. The key stays in the JSON, which
 * is what keeps the screen multilingual; only the rendered text changes.
 *
 * Text typed by hand in the builder is safe: a key that has no translation
 * comes back unchanged, which is exactly what it does today.
 *
 * Note for anyone debugging a missing translation: the app patches `i18next.t`
 * (utils/i18n.js) to UPPER-CASE every key before the lookup, and loads its
 * resources from the server after start-up. Both are why this goes through `t`
 * rather than reading a resource bundle directly.
 */
import { useEffect } from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

/** Translate a key, falling back to the text itself. */
export function tr(text) {
  if (typeof text !== "string" || !text) return text;
  try {
    const out = i18next.t(text, { defaultValue: text });
    return typeof out === "string" && out ? out : text;
  } catch (e) {
    // A screen must still render if i18n has not finished starting up.
    return text;
  }
}

/**
 * Subscribe a screen to language changes.
 *
 * Called once, at the top of ScreenRenderer, rather than per node: `tr` reads
 * the current language when it runs, so one subscription re-renders the whole
 * tree when the language is switched.
 */
export function useScreenLanguage() {
  useTranslation();
}

/**
 * Languages written right to left. The app's language codes come from the
 * server (`empLanguageCode`), so only the primary subtag is compared: "ar",
 * "ar-SA" and "AR" are all Arabic.
 */
const RTL_LANGUAGES = new Set(["ar", "he", "iw", "fa", "ur", "ps", "sd", "ug", "yi", "dv", "ku", "ckb"]);

export function isRtlLanguage(lng) {
  if (typeof lng !== "string" || !lng) return false;
  return RTL_LANGUAGES.has(lng.toLowerCase().split(/[-_]/)[0]);
}

/**
 * The direction a screen is laid out in.
 *
 * Same contract as the print builder's `theme.direction`: "ltr" or "rtl" pins
 * it, anything else ("auto", or unset on every screen saved before this
 * existed) follows the app's language — switch to Arabic and the screen
 * mirrors, switch back and it un-mirrors, with no change to the screen.
 */
export function screenDir(theme, lng = i18next.language) {
  const pinned = theme?.direction;
  if (pinned === "rtl" || pinned === "ltr") return pinned;
  return isRtlLanguage(lng) ? "rtl" : "ltr";
}

/**
 * `screenDir`, kept current. A hook rather than a read because a portalled
 * overlay (ScreenScope) sits outside the screen root and has to hear the
 * language change itself.
 */
export function useScreenDir(theme) {
  const { i18n } = useTranslation();
  return screenDir(theme, i18n?.language);
}

/**
 * Popups the app's controls portal straight to <body> — react-select's menu,
 * PrimeReact's panels, the confirm dialog — are outside the screen root and
 * so outside its `dir`. While a right-to-left screen is live, <body> carries
 * `data-dsb-dir="rtl"` and runtime.css mirrors those popups off it. Counted,
 * because a screen can embed another and both are mounted at once.
 */
let rtlScreens = 0;
export function useBodyDirMarker(dir, enabled = true) {
  const on = enabled && dir === "rtl";
  useEffect(() => {
    if (!on || typeof document === "undefined") return undefined;
    rtlScreens += 1;
    document.body.setAttribute("data-dsb-dir", "rtl");
    return () => {
      rtlScreens = Math.max(0, rtlScreens - 1);
      if (!rtlScreens) document.body.removeAttribute("data-dsb-dir");
    };
  }, [on]);
}
