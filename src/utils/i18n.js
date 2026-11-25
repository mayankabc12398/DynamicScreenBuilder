import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

// the translations (you can keep this for fallback in case the API fails)
const resources = {
};
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    // Keys such as "HH:MM" or "Approved Amount : 0" contain a colon; with the default nsSeparator
    // i18next would split them into namespace + key and never find the row.
    nsSeparator: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      wait: true,
    },
  });


const originalT = i18next.t;
i18next.t = function (key, options) {
  if(typeof key === "string"){
    const normalizedKey =  key?.toUpperCase();
    // const normalizedKey =  key;
    let value = originalT.call(i18next, normalizedKey, options);

    // A miss makes i18next hand back the key itself. Plenty of labels in the app
    // carry stray padding ("Time ", "Patient Name\t\t", "Piecemeal  ") while
    // country_langauge_master stores the clean form, so retry without it.
    // The exact key is always tried first, which keeps the rows that genuinely
    // begin with whitespace (e.g. "\tBAG TYPE") resolving as before.
    // Whitespace-only keys are spacer captions (a blank grid column header, for
    // instance). Trimming one leaves "", and i18next answers an empty key with
    // an empty string, so the caller gets no label at all - keep them as they are.
    if (value === normalizedKey && normalizedKey.trim()) {
      const trimmedKey = normalizedKey.trim();
      // A whitespace-only label (the blank spacer columns in THEAD and friends)
      // has nothing to look up, and i18next answers t("") with "". That would
      // turn a deliberately blank header into a falsy value, which downstream
      // renderers read as "no label" and fall back to the header object itself.
      // Hand the key straight back instead.
      if (trimmedKey === "") {
        return value;
      }
      if (trimmedKey !== normalizedKey) {
        value = originalT.call(i18next, trimmedKey, options);
      }
      if (value === trimmedKey) {
        const collapsedKey = trimmedKey.replace(/\s+/g, " ");
        if (collapsedKey !== trimmedKey) {
          value = originalT.call(i18next, collapsedKey, options);
        }
      }
    }
    return value;
  }
};

export default i18n;
