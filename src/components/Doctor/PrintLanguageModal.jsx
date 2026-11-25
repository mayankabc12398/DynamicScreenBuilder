import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../modalComponent/Modal";
import ReactSelect from "../formComponent/ReactSelect";
import { GetLangaugeListAPI } from "../../store/reducers/dashboardSlice/CommonFunction";

/**
 * "Print language" chooser for the doctor's prescription Print button.
 *
 * The list is the application language master (the same one the language switch in the
 * header uses), so a language added there is offered here with no change. English means
 * "print as written".
 *
 * The default is always visible and always changeable from here:
 *  - it says what the current default is (or that there is none and Print asks each time);
 *  - "Print" prints in the chosen language, and ticking "Use as my default" also remembers it;
 *  - "Save as default" changes the default WITHOUT printing;
 *  - "Ask me each time" removes the default, so Print opens this box again.
 *
 * onPrint(language, makeDefault) prints (and saves when asked); onSaveDefault(language) and
 * onClearDefault() only change the saved default. This component only collects the choice.
 */
export default function PrintLanguageModal({
  visible,
  setVisible,
  initialLanguage,
  defaultLanguage,
  onPrint,
  onSaveDefault,
  onClearDefault,
}) {
  const [t] = useTranslation();
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(initialLanguage || "English");
  const [makeDefault, setMakeDefault] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLanguage(initialLanguage || defaultLanguage || "English");
    setMakeDefault(false);
    (async () => {
      try {
        const res = await GetLangaugeListAPI();
        setLanguages(res?.success && Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        setLanguages([]);
      }
    })();
  }, [visible, initialLanguage, defaultLanguage]);

  const options = useMemo(() => {
    const list = languages.map((l) => ({ label: l.label, value: l.label }));
    return list.some((o) => o.value === "English") ? list : [{ label: "English", value: "English" }, ...list];
  }, [languages]);

  const extraButtons = (
    <>
      {defaultLanguage ? (
        <button type="button" className="text-white" onClick={() => onClearDefault?.()}>
          {t("Ask me each time")}
        </button>
      ) : null}
      <button
        type="button"
        className="text-white"
        disabled={language === defaultLanguage}
        onClick={() => onSaveDefault?.(language)}
      >
        {t("Save as default")}
      </button>
    </>
  );

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      modalWidth="480px"
      Header={t("Print Language")}
      buttonName={t("Print")}
      buttons={extraButtons}
      handleAPI={() => onPrint(language, makeDefault)}
    >
      <div className="row p-2">
        <div className="col-12 mb-2">
          <span className="aps-sub">
            {defaultLanguage
              ? `${t("Your default print language")}: `
              : `${t("No default set - Print asks each time")}`}
          </span>
          {defaultLanguage ? <b>{defaultLanguage}</b> : null}
        </div>
        <ReactSelect
          placeholderName={t("Language")}
          id="print-language"
          name="printLanguage"
          dynamicOptions={options}
          value={language}
          handleChange={(name, val) => setLanguage(val?.value || "English")}
          removeIsClearable={true}
          respclass="col-12"
        />
        <div className="col-12 mb-2">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input table-checkbox"
              id="print-language-default"
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
            />
            <label className="form-check-label ml-2" htmlFor="print-language-default">
              {t("Use as my default print language")}
            </label>
          </div>
        </div>
        <small className="text-muted col-12">
          <i className="fas fa-info-circle mr-1" />
          {language === "English"
            ? t("The prescription prints as written.")
            : t("The prescription is translated by AI. Please review the preview before giving it to the patient.")}
        </small>
      </div>
    </Modal>
  );
}
