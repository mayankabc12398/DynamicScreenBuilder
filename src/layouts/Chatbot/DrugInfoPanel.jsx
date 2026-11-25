import { useEffect, useState } from "react";
import { GEMINI_MODEL } from "../../utils/constant";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import Modal from "../../components/modalComponent/Modal";
import { useTranslation } from "react-i18next";

import { aiFetch, AI_GENERATE_URL } from "../../utils/aiClient";
/**
 * Drug Information drawer + alert acknowledgement for the Drug Interaction Checker.
 * (KMSI A5 dose table, A6 pregnancy categories, A7 drug information, A8 acknowledgement.)
 *
 * Modelled on the reference EHR screens the client shared:
 *   - "Kidney dose adjustment": one row per eGFR/CrCl band, colour-coded, with the
 *     patient's own band highlighted when a clearance is known.
 *   - "Pregnancy / Breast feeding data": JP package-insert wording, FDA category, TGA
 *     (Australia) category, breast-feeding advice, and the hospital's own rule when the
 *     client has configured one.
 *   - "Drug information": generic name, class, ATC code, key warnings, contraindications,
 *     standard dosing, and links to the package-insert references.
 *   - "OK comment or confirmation": every high-risk finding must be acknowledged with a
 *     comment; the acknowledgements are handed back to the page through onAcknowledge.
 *
 * The per-drug profile comes from the same Gemini model the checker already uses, asked
 * for strict JSON. It is fetched only when the doctor expands a drug, and cached per
 * drug + patient context for the life of the popup, so nothing is called for drugs
 * nobody looks at.
 */

const GEMINI_URL = AI_GENERATE_URL;

export const CRCL_BANDS = [
  { key: ">=90", label: "eGFR / CrCl ≥ 90", min: 90, max: Infinity, tone: "ok" },
  { key: "60-89", label: "89 > eGFR / CrCl ≥ 60", min: 60, max: 90, tone: "ok" },
  { key: "30-59", label: "59 > eGFR / CrCl ≥ 30", min: 30, max: 60, tone: "warn" },
  { key: "15-29", label: "29 > eGFR / CrCl ≥ 15", min: 15, max: 30, tone: "warn" },
  { key: "<15", label: "eGFR / CrCl < 15 / dialysis", min: -Infinity, max: 15, tone: "bad" },
];

export const bandForCrCl = (crcl) =>
  Number.isFinite(crcl) ? CRCL_BANDS.find((b) => crcl >= b.min && crcl < b.max) : null;

/** Reference sites a drug name can be looked up on. Kept as data so a client can swap them. */
export const DEFAULT_REFERENCE_LINKS = [
  {
    label: "KEGG DRUG (JP)",
    url: (name) =>
      `https://www.genome.jp/dbget-bin/www_bfind_sub?mode=bfind&max_hit=50&dbkey=drug&keywords=${encodeURIComponent(name)}`,
  },
  {
    label: "DailyMed (FDA label)",
    url: (name) =>
      `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(name)}`,
  },
  {
    label: "PMDA (JP package insert)",
    url: (name) =>
      `https://www.pmda.go.jp/PmdaSearch/iyakuSearch/GeneralList/1/${encodeURIComponent(name)}`,
  },
];

const parseJsonObject = (rawText = "{}") => {
  const sanitized = rawText
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const parsed = JSON.parse(sanitized || "{}");
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

/**
 * One drug's profile as strict JSON. `context` = { crclLine, pregnancyLine, generic }.
 */
export async function getGeminiDrugProfile(drugName, context = {}) {
  const prompt = `You are a clinical pharmacist API. Give a concise, prescriber-oriented profile of the drug "${drugName}"${
    context.generic ? ` (generic/composition: ${context.generic})` : ""
  }.
${context.crclLine ? `Patient kidney function: ${context.crclLine}\n` : ""}${
    context.pregnancyLine ? `Patient: ${context.pregnancyLine}\n` : ""
  }
Return ONLY a raw JSON object (no markdown, no backticks, no explanation) with exactly these keys:
- "genericName": string
- "drugClass": string (pharmacological class)
- "atcCode": string (ATC code(s), or "")
- "standardDose": string (usual adult dose and interval, one line)
- "warnings": array of up to 4 short strings (boxed / key warnings)
- "contraindications": array of up to 5 short strings
- "renalDosing": array of exactly 5 objects, one per band in this order: ">=90", "60-89", "30-59", "15-29", "<15" - each { "band": string (one of those five), "advice": string (dose / interval / "No adjustment" / "Not suitable" / "Avoid"; mention dialysis for "<15") }
- "hepaticDosing": string (advice in hepatic impairment, one line)
- "pregnancy": { "fdaCategory": string (A/B/C/D/X or "N/A - PLLR"), "australiaCategory": string (TGA A/B1/B2/B3/C/D/X), "jpDocument": string (one sentence IN ENGLISH giving the Japanese package-insert (添付文書) pregnancy wording in translation, e.g. "Administer only when the therapeutic benefits are judged to outweigh the risks."), "summary": string (one sentence) }
- "lactation": { "category": string (one of "Safe", "Probably safe", "Caution", "Avoid", "Unknown"), "summary": string (one sentence) }

Write every value in English only (translate any Japanese or other-language source wording). Be accurate; if a value is genuinely unknown use "" or "Unknown".`;

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1536 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
  return { ...parseJsonObject(text), source: "Gemini AI" };
}

/* ------------------------------------------------------------------------------------
   Full drug monograph (A7 "Drug information"), modelled on the KEGG MEDICUS page the
   client shared: a Pharmaceutical Information table, then the package insert as numbered
   sections, then the product row. Generated by the same Gemini model as strict JSON and
   cached per drug for the life of the popup.
   ------------------------------------------------------------------------------------ */

export const MONOGRAPH_SECTIONS = [
  { key: "warnings", no: "1", title: "Warnings", tone: "bad", list: true },
  { key: "contraindications", no: "2", title: "Contraindications", tone: "bad", list: true },
  { key: "composition", no: "3", title: "Composition / properties", list: false },
  { key: "indications", no: "4", title: "Efficacy or Effects (Indications)", list: true },
  { key: "dosageAndAdministration", no: "6", title: "Dosage and Administration", list: true },
  { key: "importantPrecautions", no: "8", title: "Important Basic Precautions", tone: "warn", list: true },
  { key: "specificPopulations", no: "9", title: "Precautions for Specific Populations (renal, hepatic, elderly, pregnancy, lactation, children)", tone: "warn", list: true },
  { key: "interactions", no: "10", title: "Interactions", tone: "warn", list: true },
  { key: "sideEffects", no: "11", title: "Side Effects", list: true },
  { key: "pharmacokinetics", no: "16", title: "Pharmacokinetics", list: false },
  { key: "clinicalResults", no: "17", title: "Clinical Results", list: false },
  { key: "pharmacologicalEffects", no: "18", title: "Pharmacological Effects", list: false },
];

export async function getGeminiDrugMonograph(drugName, context = {}) {
  const prompt = `You are a clinical drug-information API in the style of a national package insert (Japanese 添付文書 / FDA label). Produce a monograph for the drug "${drugName}"${
    context.generic ? ` (composition on our formulary: ${context.generic})` : ""
  }.

Return ONLY a raw JSON object (no markdown, no backticks, no explanation) with exactly these keys:
- "generalName": string (INN / general name, e.g. "Vancomycin hydrochloride")
- "commonName": string
- "europeanName": string (European common name)
- "pharmacologicalClass": string (e.g. "Glycopeptide antibiotic preparations")
- "classificationNumber": string (Japanese therapeutic category number, e.g. "6113", or "")
- "atcCodes": array of strings (WHO ATC codes)
- "keggDrugId": string (KEGG DRUG id like "D00926", or "")
- "keggDgroup": string (KEGG DGROUP id and name, or "")
- "warnings": array of strings (boxed / major warnings; [] if none)
- "contraindications": array of strings ("Do not administer to the following patients ...")
- "composition": string (active ingredient, strength forms, key excipients / properties)
- "indications": array of strings
- "dosageAndAdministration": array of strings (adult, paediatric, renal/hepatic adjustments as separate items)
- "importantPrecautions": array of strings
- "specificPopulations": array of strings (renal impairment, hepatic impairment, elderly, pregnancy, lactation, children)
- "interactions": array of strings (each "Drug or class - effect - mechanism")
- "sideEffects": array of strings (serious first, then common with approximate frequency)
- "pharmacokinetics": string (absorption, distribution, half-life, elimination, one paragraph)
- "clinicalResults": string (one paragraph on key trial evidence, or "")
- "pharmacologicalEffects": string (mechanism of action, one paragraph)
- "regulatoryClassification": string (e.g. "Prescription drug", "Narcotic", "Poisonous drug")

Write every value in English only (translate any Japanese or other-language source wording into English). Be accurate and concise; use "" or [] where genuinely unknown.`;

  const res = await aiFetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
  return { ...parseJsonObject(text), source: "Gemini AI" };
}

const monographCache = {};

/**
 * The monograph popup for one drug. `item` = { name, itemID, generic, mrp, unitType,
 * manufacturer } from the page (whatever the screen knows about its own product).
 */
export function DrugMonographModal({ drugName, item, referenceLinks = DEFAULT_REFERENCE_LINKS, onClose }) {
  const [t] = useTranslation();
  const [state, setState] = useState(monographCache[drugName] || { loading: true });

  useEffect(() => {
    let cancelled = false;
    if (monographCache[drugName]?.data) {
      setState(monographCache[drugName]);
      return undefined;
    }
    setState({ loading: true });
    getGeminiDrugMonograph(drugName, { generic: item?.generic })
      .then((data) => {
        const next = { loading: false, data };
        monographCache[drugName] = next;
        if (!cancelled) setState(next);
      })
      .catch((error) => {
        console.error("Drug monograph failed:", error);
        if (!cancelled) setState({ loading: false, error: error?.message || "Failed to load" });
      });
    return () => {
      cancelled = true;
    };
  }, [drugName]);

  const d = state.data || {};
  const lookupName = d.generalName || drugName;
  const has = (v) => (Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim()));
  const sections = MONOGRAPH_SECTIONS.filter((s) => has(d[s.key]));

  return (
    <Modal visible={true} setVisible={onClose} modalWidth="80vw" Header={t("Drug information (AI)")} footer={<></>}>
      <div className="drug-mono">
        <div className="drug-mono__title">
          <span className="drug-mono__title-bar"></span>
          {t("Medical drug:")}
          {lookupName}
          <span className="drug-mono__title-links">
            {referenceLinks.map((link) => (
              <a key={link.label} href={link.url(lookupName)} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </span>
        </div>

        {state.loading && (
          <div className="drug-interaction-loading">
            <div>{t("Loading...")}</div>
            {t("Generating drug information...")}
          </div>
        )}
        {state.error && <div className="drug-interaction-error-box">{t("Warning:")} {state.error}</div>}

        {state.data && (
          <>
            <div className="drug-mono__h2">{t("Pharmaceutical Information")}</div>
            <div className="drug-mono__grid">
              <table className="drug-mono__table">
                <tbody>
                  {[
                    ["General name", d.generalName],
                    ["Common name", d.commonName],
                    ["European common name", d.europeanName],
                    ["Pharmacological classification name", d.pharmacologicalClass],
                    ["Drug classification number", d.classificationNumber],
                    ["ATC code", Array.isArray(d.atcCodes) ? d.atcCodes.join("  ") : d.atcCodes],
                    ["KEGG DRUG", d.keggDrugId],
                    ["KEGG DGROUP", d.keggDgroup],
                    ["Regulatory classification", d.regulatoryClassification],
                  ]
                    .filter(([, v]) => has(v))
                    .map(([k, v]) => (
                      <tr key={k}>
                        <th>{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="drug-mono__aside">
                {"This information is generated by the AI model used for the interaction checker (" +
                  (d.source || "Gemini AI") +
                  "). Verify against the official package insert before prescribing or dispensing."}
              </div>
            </div>

            <div className="drug-mono__h2">{t("Package insert information")}</div>
            <div className="drug-mono__nav">
              {sections.map((s) => (
                <a key={s.key} href={`#drug-mono-${s.key}`} onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`drug-mono-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}>
                  {s.no}. {s.title}
                </a>
              ))}
            </div>

            {(item?.name || item?.generic) && (
              <>
                <div className="drug-mono__h3">{t("Product information")}</div>
                <table className="drug-mono__table drug-mono__table--product">
                  <thead>
                    <tr>
                      <th>{t("Product name (this hospital)")}</th>
                      <th>{t("Composition")}</th>
                      <th>{t("Item code")}</th>
                      <th>{t("Unit")}</th>
                      <th>{t("MRP")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{item?.name || "-"}</td>
                      <td>{item?.generic || "-"}</td>
                      <td>{item?.itemID || "-"}</td>
                      <td>{item?.unitType || "-"}</td>
                      <td>{item?.mrp ?? "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {sections.map((s) => (
              <div key={s.key} id={`drug-mono-${s.key}`} className="drug-mono__section">
                <div className="drug-mono__h3">
                  {s.no}. {s.title}
                </div>
                <div className={`drug-mono__box${s.tone ? " drug-mono__box--" + s.tone : ""}`}>
                  {s.list ? (
                    <ul>
                      {(Array.isArray(d[s.key]) ? d[s.key] : [d[s.key]]).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{d[s.key]}</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
}

const toneForAdvice = (advice = "") =>
  /not suitable|avoid|contraindicated|do not/i.test(advice)
    ? "bad"
    : /reduce|adjust|interval|every \d+|monitor|caution|tdm|dialysis|half/i.test(advice)
      ? "warn"
      : "ok";

const toneForPregnancy = (cat = "") =>
  /^(x|d)\b/i.test(cat) ? "bad" : /^(c|b3)\b/i.test(cat) ? "warn" : cat ? "ok" : "none";

const toneForLactation = (cat = "") =>
  /avoid/i.test(cat) ? "bad" : /caution|unknown/i.test(cat) ? "warn" : cat ? "ok" : "none";

function Row({ label, value, tone = "none" }) {
  return (
    <div className={`drug-info-row drug-info-row--${tone}`}>
      <div className="drug-info-row__label">{label}</div>
      <div className="drug-info-row__value">{value || "-"}</div>
    </div>
  );
}

/**
 * @param drugs          string[] drug names shown in the popup
 * @param medicineItems  [{ name, itemID, generic }] from the page, for the generic hint
 * @param labs           lab context from utils/patientLabContext.js (for the CrCl band)
 * @param pregnancy      context from utils/patientPregnancyContext.js
 * @param hospitalRules  { [drugNameLowerCase]: "text" } client's own pregnancy rules
 * @param referenceLinks [{ label, url(name) }]
 */
export function DrugInfoPanel({
  drugs = [],
  medicineItems = [],
  labs = null,
  pregnancy = null,
  hospitalRules = {},
  referenceLinks = DEFAULT_REFERENCE_LINKS,
}) {
  const [t] = useTranslation();
  const [expanded, setExpanded] = useState(null);
  const [profiles, setProfiles] = useState({});
  // Drug whose full monograph popup is open (A7 "Drug information").
  const [monoDrug, setMonoDrug] = useState(null);

  const itemOf = (name) =>
    medicineItems.find((m) => String(m?.name || "").toLowerCase() === name.toLowerCase()) ||
    null;

  const crcl = labs?.crcl?.value;
  const patientBand = bandForCrCl(crcl);
  const crclLine = labs?.crcl
    ? `estimated creatinine clearance ${labs.crcl.value} mL/min (${labs.crcl.label})`
    : "";
  const pregnancyLine = pregnancy?.line || "";
  const contextKey = `${crclLine}|${pregnancyLine}`;

  const genericOf = (name) =>
    medicineItems.find((m) => String(m?.name || "").toLowerCase() === name.toLowerCase())
      ?.generic || "";

  const toggle = async (name) => {
    const next = expanded === name ? null : name;
    setExpanded(next);
    if (!next) return;
    const key = `${name}|${contextKey}`;
    if (profiles[key]?.data || profiles[key]?.loading) return;
    setProfiles((p) => ({ ...p, [key]: { loading: true } }));
    try {
      const data = await getGeminiDrugProfile(name, {
        crclLine,
        pregnancyLine,
        generic: genericOf(name),
      });
      setProfiles((p) => ({ ...p, [key]: { loading: false, data } }));
    } catch (error) {
      console.error("Drug profile failed:", error);
      setProfiles((p) => ({
        ...p,
        [key]: { loading: false, error: error?.message || "Failed to load" },
      }));
    }
  };

  if (!drugs.length) return null;

  return (
    <div className="drug-info-panel">
      {drugs.map((name) => {
        const key = `${name}|${contextKey}`;
        const entry = profiles[key];
        const open = expanded === name;
        const rule = hospitalRules?.[name.toLowerCase()];
        return (
          <div key={name} className={`drug-info-item${open ? " drug-info-item--open" : ""}`}>
            <div className="drug-info-item__head">
              <button type="button" className="drug-info-item__headbtn" onClick={() => toggle(name)}>
                <span className="drug-info-item__name">
                  <i className="fa fa-medkit mr-2" aria-hidden="true"></i>
                  {name}
                  {genericOf(name) && (
                    <span className="drug-info-item__generic">{genericOf(name)}</span>
                  )}
                </span>
                <span className="drug-info-item__toggle">
                  {open ? t("Hide details") : t("Show details")}
                  <i className={`fa fa-chevron-${open ? "up" : "down"} ml-2`} aria-hidden="true"></i>
                </span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary drug-info-item__mono"
                title={t("Full drug information generated by AI (package-insert style)")}
                onClick={() => setMonoDrug(name)}
              >
                <i className="fa fa-book mr-1" aria-hidden="true"></i>
                {t("Drug information (AI)")}
              </button>
            </div>

            {open && (
              <div className="drug-info-item__body">
                {entry?.loading && (
                  <div className="drug-interaction-loading">
                    <div>{t("Loading...")}</div>
                    {t("Fetching drug information...")}
                  </div>
                )}
                {entry?.error && (
                  <div className="drug-interaction-error-box">{t("Warning:")} {entry.error}</div>
                )}
                {entry?.data && (
                  <div className="row">
                    {/* Package insert summary */}
                    <div className="col-xl-4 col-md-6 col-12">
                      <div className="drug-info-block">
                        <div className="drug-info-block__title">
                          <i className="far fa-file-alt mr-1" aria-hidden="true"></i>
                          {t("Drug information")}
                        </div>
                        <Row label={t("Generic name")} value={entry.data.genericName} />
                        <Row label={t("Class")} value={entry.data.drugClass} />
                        <Row label={t("ATC code")} value={entry.data.atcCode} />
                        <Row label={t("Standard dose")} value={entry.data.standardDose} />
                        <Row label={t("Hepatic impairment")} value={entry.data.hepaticDosing} tone={toneForAdvice(entry.data.hepaticDosing)} />
                        {Array.isArray(entry.data.warnings) && entry.data.warnings.length > 0 && (
                          <div className="drug-info-list drug-info-list--warn">
                            <div className="drug-info-list__title">{t("Warnings")}</div>
                            <ul>
                              {entry.data.warnings.map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {Array.isArray(entry.data.contraindications) && entry.data.contraindications.length > 0 && (
                          <div className="drug-info-list drug-info-list--bad">
                            <div className="drug-info-list__title">{t("Contraindications")}</div>
                            <ul>
                              {entry.data.contraindications.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="drug-info-links">
                          {referenceLinks.map((link) => (
                            <a
                              key={link.label}
                              href={link.url(entry.data.genericName || name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="drug-info-link"
                            >
                              <i className="fas fa-external-link-alt mr-1" aria-hidden="true"></i>
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Kidney dose adjustment */}
                    <div className="col-xl-4 col-md-6 col-12">
                      <div className="drug-info-block">
                        <div className="drug-info-block__title">
                          <i className="fa fa-tint mr-1" aria-hidden="true"></i>
                          {t("Kidney dose adjustment")}
                          {patientBand && (
                            <span className="drug-info-block__note">
                              {t("Patient: CrCl")}
                              {crcl} {t("mL/min")}
                            </span>
                          )}
                        </div>
                        {CRCL_BANDS.map((band) => {
                          const row = (entry.data.renalDosing || []).find(
                            (r) => String(r?.band) === band.key,
                          );
                          const tone = row ? toneForAdvice(row.advice) : band.tone;
                          const mine = patientBand?.key === band.key;
                          return (
                            <div
                              key={band.key}
                              className={`drug-info-band drug-info-band--${tone}${mine ? " drug-info-band--patient" : ""}`}
                            >
                              <div className="drug-info-band__label">
                                {band.label}
                                {mine && <span className="drug-info-band__you">{t("THIS PATIENT")}</span>}
                              </div>
                              <div className="drug-info-band__advice">{row?.advice || "-"}</div>
                            </div>
                          );
                        })}
                        {!labs?.crcl && (
                          <div className="drug-info-block__hint">
                            {t("No creatinine clearance for this patient (needs a recent creatinine plus weight, age and sex).")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pregnancy / breast feeding */}
                    <div className="col-xl-4 col-md-12 col-12">
                      <div className="drug-info-block">
                        <div className="drug-info-block__title">
                          <i className="fa fa-female mr-1" aria-hidden="true"></i>
                          {t("Pregnancy / Breast feeding")}
                          {pregnancy?.applicable && (
                            <span className="drug-info-block__note">{pregnancy.line}</span>
                          )}
                        </div>
                        <Row label={t("JP package insert")} value={entry.data.pregnancy?.jpDocument} tone={toneForPregnancy(entry.data.pregnancy?.fdaCategory)} />
                        <Row label={t("FDA")} value={entry.data.pregnancy?.fdaCategory} tone={toneForPregnancy(entry.data.pregnancy?.fdaCategory)} />
                        <Row label={t("Australia (TGA)")} value={entry.data.pregnancy?.australiaCategory} tone={toneForPregnancy(entry.data.pregnancy?.australiaCategory)} />
                        <Row label={t("Breast feeding")} value={`${entry.data.lactation?.category || "-"}${entry.data.lactation?.summary ? " - " + entry.data.lactation.summary : ""}`} tone={toneForLactation(entry.data.lactation?.category)} />
                        <Row label={t("Hospital rule")} value={rule || "No rule configured"} tone={rule ? "warn" : "none"} />
                        {entry.data.pregnancy?.summary && (
                          <div className="drug-info-block__hint">{entry.data.pregnancy.summary}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {monoDrug && (
        <DrugMonographModal
          drugName={monoDrug}
          item={itemOf(monoDrug)}
          referenceLinks={referenceLinks}
          onClose={() => setMonoDrug(null)}
        />
      )}
    </div>
  );
}

/**
 * High-risk findings need an "OK" with a comment before the popup is considered dealt
 * with. Non-blocking: the popup still closes, but the page receives the acknowledgements
 * (and the list of what is still open) through onAcknowledge, so it can store them with
 * the prescription line for the audit trail once the save API accepts them (C19).
 *
 * @param findings [{ key, title, detail, severity }]
 */
export function AcknowledgementPanel({ findings = [], acks = {}, onChange }) {
  const [t] = useTranslation();
  const userData = useLocalStorage("userData", "get");
  const who = userData?.employeeName || userData?.userName || userData?.employeeID || "";
  const [drafts, setDrafts] = useState({});

  const high = findings.filter((f) => (f.severity || "").toLowerCase() === "high");
  if (!high.length) return null;
  const pending = high.filter((f) => !acks[f.key]);

  const confirm = (f) => {
    const comment = (drafts[f.key] || "").trim();
    if (!comment) return;
    const next = {
      ...acks,
      [f.key]: { comment, by: who, at: new Date().toISOString(), title: f.title },
    };
    onChange?.(next);
  };

  return (
    <div className={`drug-ack-panel${pending.length ? " drug-ack-panel--pending" : ""}`}>
      <div className="drug-ack-panel__title">
        <i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>
        {pending.length
          ? `${pending.length} high-risk alert(s) need an OK comment or confirmation`
          : t("All high-risk alerts acknowledged")}
      </div>
      {high.map((f) => {
        const ack = acks[f.key];
        return (
          <div key={f.key} className={`drug-ack-item${ack ? " drug-ack-item--done" : ""}`}>
            <div className="drug-ack-item__text">
              <strong>{f.title}</strong>
              {f.detail && <div className="drug-ack-item__detail">{f.detail}</div>}
            </div>
            {ack ? (
              <div className="drug-ack-item__done">
                <i className="fa fa-check-circle mr-1" aria-hidden="true"></i>
                {t("OK")}
                {ack.by ? ` by ${ack.by}` : ""} - {ack.comment}
              </div>
            ) : (
              <div className="drug-ack-item__form">
                <input
                  type="text"
                  className="table-input"
                  placeholder={t("Reason / comment (required)")}
                  value={drafts[f.key] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirm(f);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  disabled={!(drafts[f.key] || "").trim()}
                  onClick={() => confirm(f)}
                >
                  {t("OK")}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DrugInfoPanel;
