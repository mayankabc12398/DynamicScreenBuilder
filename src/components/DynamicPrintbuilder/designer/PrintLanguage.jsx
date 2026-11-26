/**
 * The print language in the builder. Previews (the designer's and the template
 * list's eye) print in the app language — the one picked in the header — and
 * follow it when it changes (i18n "languageChanged"); a Language select shows
 * any other. The design canvas keeps the designed text.
 *
 * The coverage chip says how many of the template's labels have a translation
 * in Country_langauge_master for that language, lists the missing ones and
 * copies them as CSV (FIELDNAME, English, <language>) for whoever keeps the table.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import i18next from "i18next";
import { toast } from "react-toastify";
import { pbFetchSample, pbLanguages, printLanguage } from "../../../networkServices/printBuilderApi";
import { Select } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";

let languageList = null;
/** master_application_language labels, read once per page load. */
const loadLanguageList = () => {
  languageList ??= pbLanguages()
    .then((r) => (r?.success && Array.isArray(r.data) ? r.data.map((l) => String(l?.label ?? "").trim()).filter(Boolean) : []))
    .catch(() => [])
    .then((list) => {
      if (!list.length) languageList = null; // try again next time
      return list;
    });
  return languageList;
};

const appLanguage = () => printLanguage() || "English";

/** [lang, setLang, languages]: the app language, followed when it changes; every app language for the select. */
export function usePrintLanguage() {
  const [lang, setLang] = useState(appLanguage);
  const [languages, setLanguages] = useState([]);
  useEffect(() => {
    const follow = () => setLang(appLanguage());
    i18next.on("languageChanged", follow);
    return () => i18next.off("languageChanged", follow);
  }, []);
  useEffect(() => {
    let live = true;
    loadLanguageList().then((list) => live && setLanguages(list));
    return () => {
      live = false;
    };
  }, []);
  return [lang, setLang, languages];
}

/** The template with only what translation needs: no images, no sub-reports (their datasources would run). */
const textOnly = (template) =>
  JSON.stringify(template || {}, (k, v) => (k === "assetKey" || k === "fallbackAssetKey" || k === "templateCode" ? undefined : v));

/**
 * A template's label translations in a language, without running its datasource:
 * { i18n, lang: { column, code, dir }, coverage } — null when the API could not answer.
 */
export async function fetchLanguage(template, lang) {
  const r = await pbFetchSample({ definition: "{}", template: textOnly(template), saveSchema: false, lang });
  if (!r?.success) return null;
  let data = {};
  try {
    data = JSON.parse(r.data?.dataJson || "{}");
  } catch {
    /* an answer without data only lacks the translations */
  }
  return { i18n: data.i18n || null, lang: data.sys?.lang || null, coverage: r.data?.translation || null };
}

/** `data` printed in `language` (fetchLanguage): its translations and direction instead of its own. */
export function withLanguage(data, language) {
  if (!language) return data;
  const out = { ...(data || {}), sys: { ...(data?.sys || {}), lang: language.lang || undefined } };
  if (language.i18n) out.i18n = language.i18n;
  else delete out.i18n;
  return out;
}

/** Latest-wins loader for fetchLanguage: an older answer arriving late is dropped. */
export function useLanguageData(lang) {
  const [language, setLanguage] = useState(null);
  const seq = useRef(0);
  const load = async (template) => {
    const n = ++seq.current;
    const l = await fetchLanguage(template, lang);
    if (n === seq.current && l) setLanguage(l);
    return l;
  };
  return [language, load, setLanguage];
}

export function LanguageSelect({ value, onChange, languages }) {
  const options = useMemo(() => [...new Set(["English", ...(languages || []), value].filter(Boolean))], [languages, value]);
  return (
    <span className="pbx-lang-sel">
      <Icon name="globe" size={13} />
      <Select value={value} onChange={onChange} options={options} title="Language this preview prints in (default: the app language). The canvas keeps the designed text." />
    </span>
  );
}

const csvCell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
/** Missing phrases as rows to fill in: FIELDNAME, English, <language>. */
export const coverageCsv = (c) =>
  [["FIELDNAME", "English", c.language], ...(c.missing || []).map((p) => [p, p, ""])].map((r) => r.map(csvCell).join(",")).join("\r\n");

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
};

/** "Hindi: 18/22 translated, 4 missing" — click for the missing labels and a CSV copy. Nothing for English. */
export function CoverageChip({ coverage, onRefresh }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  if (!coverage || !coverage.total) return null;
  const missing = coverage.missing || [];
  const label = `${coverage.language}: ${coverage.translated}/${coverage.total} translated${missing.length ? `, ${missing.length} missing` : ""}`;
  return (
    <span className="pbx-lang-cov" ref={ref}>
      <Tap
        className={`pbx-lang-chip${missing.length ? " is-partial" : " is-full"}`}
        onClick={() => setOpen((o) => !o)}
        title={missing.length ? "Labels with no translation print in English — click for the list" : "Every label has a translation"}
      >
        <Icon name={missing.length ? "alert" : "check"} size={12} /> {label}
      </Tap>
      {open && (
        <div className="pbx-lang-pop" role="dialog" aria-label="Translation coverage">
          <div className="pbx-lang-pop-head">
            <b>{coverage.language}</b> · {missing.length ? `${missing.length} label${missing.length === 1 ? "" : "s"} print in English` : "every label is translated"}
          </div>
          {missing.length > 0 && (
            <ul className="pbx-lang-missing">
              {missing.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <div className="pbx-lang-pop-foot">
            <span className="pbx-muted">Add rows to Country_langauge_master to translate them.</span>
            {onRefresh && (
              <Tap tone="list" className="is-small" onClick={onRefresh} title="Check again (after the language table changed)">
                <Icon name="refresh" size={12} />
              </Tap>
            )}
            {missing.length > 0 && (
              <Tap
                tone="list"
                className="is-small"
                onClick={async () => {
                  if (await copyText(coverageCsv(coverage))) toast.success(`${missing.length} missing label${missing.length === 1 ? "" : "s"} copied as CSV`);
                  else toast.error("Could not copy to the clipboard");
                }}
                title="FIELDNAME, English, language — one row per missing label"
              >
                <Icon name="copy" size={12} /> Copy as CSV
              </Tap>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
