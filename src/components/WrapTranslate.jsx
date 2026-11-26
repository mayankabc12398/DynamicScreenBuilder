import { useTranslation } from "react-i18next"

const WrapTranslate = (data, key) => {
    const [t] = useTranslation()
    let newData = data?.map((val, index) => {
        // debugger
        if (typeof (val) === "object") {
            val[key] = t(val[key])
        } else {
            val = t(val)
        }
        // debugger
        return val
    })
    return newData
}
export default WrapTranslate

/**
 * Translate a table-header array at the usage site without mutating it.
 * Accepts the two shapes `thead` takes: plain strings, or `{ name, ... }` objects.
 * Pass the component's `t` (from useTranslation) so the header re-renders on language change.
 * Blank / whitespace-only captions (spacer columns) are left untouched.
 */
/**
 * Translate a label that may arrive either raw ("Patient Name") or already translated by the caller.
 * The t() wrapper in utils/i18n.js answers a miss with the UPPERCASED key, so a miss is detectable:
 * in that case the original text is shown instead of an uppercased (or double-translated) string.
 * Use this inside shared inputs where the prop is sometimes a literal and sometimes t("...").
 */
export const translateIfKnown = (t, text) => {
    if (typeof text !== "string" || !text.trim() || typeof t !== "function") return text
    const translated = t(text)
    return translated === text.toUpperCase() ? text : translated
}




  
  
