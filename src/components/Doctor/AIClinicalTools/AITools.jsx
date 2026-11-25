import React, { useState } from "react";
import { AI_TOOLS, runAiTool } from "../../../utils/aiClinicalAI";

/**
 * Tools tab of AI Assistance: one-click AI tools for the doctor (ICD-10 coding, differential diagnosis,
 * lab explanation, dose check, follow-up plan, patient education, referral advice, guideline summary).
 * Every answer has the same shape; each line can be added to the prescription section that fits its kind.
 */

const ICONS = {
  icd: "fas fa-barcode",
  ddx: "fas fa-sitemap",
  labs: "fas fa-vial",
  dose: "fas fa-balance-scale",
  followup: "fas fa-calendar-check",
  education: "fas fa-user-graduate",
  referral: "fas fa-share-square",
  guideline: "fas fa-book-medical",
};
const BLURB = {
  icd: "Codes for today's diagnoses",
  ddx: "What else it could be, and the test that decides",
  labs: "What the lab trends mean today",
  dose: "Age, weight, kidney and liver check of every dose",
  followup: "Review, home monitoring and warning signs",
  education: "Simple instructions in the patient's language",
  referral: "Whether, where and how urgently to refer",
  guideline: "Key recommendations applied to this patient",
};
const TARGET = {
  diagnosis: "Provisional Diagnosis",
  advice: "Doctor Advice",
  note: "Doctor Notes",
};
const LANGUAGES = ["English", "Hindi", "Arabic", "French", "Spanish", "German", "Turkish", "Bahasa Indonesia", "Khmer", "Lao", "Vietnamese", "Afrikaans"];

export default function AITools({ tr, ctx, store, put, loadBackground, applyToRx, setStatus }) {
  const results = store.tools || {};
  const [active, setActive] = useState(store.toolActive || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("English");
  const [added, setAdded] = useState({});

  const run = async (tool) => {
    setActive(tool);
    put("toolActive", tool);
    setBusy(tool);
    setError("");
    setStatus({ mode: "thinking", text: "Thinking" });
    try {
      const bg = await loadBackground();
      const result = await runAiTool({ tool, ctx, labs: bg.labs, language });
      put("tools", (r) => ({ ...(r || {}), [tool]: result }));
      setAdded((a) => Object.fromEntries(Object.entries(a).filter(([k]) => !k.startsWith(`${tool}:`))));
    } catch (e) {
      setError(e?.message || tr("The AI could not be reached"));
    } finally {
      setBusy("");
      setStatus({ mode: "", text: "Ready" });
    }
  };

  const add = async (tool, i, item) => {
    const text = item.kind === "diagnosis" && item.code ? `${item.text} (${item.code})` : item.text;
    const ok = await applyToRx(item.kind === "investigation" ? { investigations: [{ name: item.text }] } : { texts: { [TARGET[item.kind]]: [text] } });
    if (ok) setAdded((a) => ({ ...a, [`${tool}:${i}`]: true }));
  };
  const addAll = async (tool, result) => {
    const items = result.items.filter((it, i) => it.kind !== "info" && !added[`${tool}:${i}`]);
    if (!items.length) return;
    const texts = {};
    const investigations = [];
    items.forEach((it) => {
      if (it.kind === "investigation") investigations.push({ name: it.text });
      else (texts[TARGET[it.kind]] = texts[TARGET[it.kind]] || []).push(it.kind === "diagnosis" && it.code ? `${it.text} (${it.code})` : it.text);
    });
    const ok = await applyToRx({ texts, investigations });
    if (ok) setAdded((a) => ({ ...a, ...Object.fromEntries(result.items.map((it, i) => [`${tool}:${i}`, it.kind !== "info"])) }));
  };

  const result = active ? results[active] : null;

  return (
    <div>
      <p className="ccp-intro">{tr("One-click AI tools for this consultation. Every suggestion can be added to the prescription after you review it.")}</p>
      <div className="ccp-tools">
        {Object.entries(AI_TOOLS).map(([key, def]) => (
          <button key={key} type="button" className="ccp-toolbtn" aria-pressed={active === key} onClick={() => run(key)} disabled={!!busy}>
            <span className="ccp-toolbtn__ico">
              <i className={busy === key ? "fas fa-circle-notch fa-spin" : ICONS[key]} />
            </span>
            <span>
              <b>{tr(def.label)}</b>
              <small>{tr(BLURB[key])}</small>
            </span>
            {results[key] && <span className="ccp-toolbtn__done">✓</span>}
          </button>
        ))}
      </div>
      <div className="ccp-row" style={{ margin: "8px 0" }}>
        <label htmlFor="ccp-tool-lang" style={{ fontSize: 12.5, color: "var(--ccp-muted)", margin: 0 }}>
          {tr("Patient language")}
        </label>
        <select id="ccp-tool-lang" className="ccp-input" style={{ width: "auto", padding: "3px 8px" }} value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="ccp-error">{error}</div>}

      {busy && (
        <div className="ccp-card" style={{ marginTop: 6 }}>
          <div className="ccp-shimmer" />
          <div className="ccp-shimmer" style={{ width: "80%" }} />
          <div className="ccp-shimmer" style={{ width: "60%" }} />
        </div>
      )}

      {!busy && result && (
        <div className="ccp-card ccp-pop" style={{ marginTop: 6 }}>
          <h3>
            <span className="ccp-spark">✦</span>
            {result.title || tr(AI_TOOLS[active].label)}
          </h3>
          {result.summary && <p className="ccp-aitext" style={{ fontSize: 14, margin: "4px 0 8px" }}>{result.summary}</p>}
          {result.items.map((it, i) => {
            const done = added[`${active}:${i}`];
            return (
              <div className="ccp-nba" key={i}>
                {it.code ? <span className="ccp-tag ccp-tag--ai">{it.code}</span> : it.level ? <span className={`ccp-tag ccp-tag--${it.level}`}>{tr(it.level)}</span> : <span className="ccp-dot ccp-dot--ok" style={{ marginTop: 6 }} />}
                <div>
                  {it.text}
                  {it.detail && <small>{it.detail}</small>}
                </div>
                {it.kind !== "info" && (
                  <button type="button" className={`ccp-btn ccp-btn--sm${done ? " ccp-btn--done" : ""}`} disabled={!!done} onClick={() => add(active, i, it)}>
                    {done ? tr("Added") : tr("Add")}
                  </button>
                )}
              </div>
            );
          })}
          {result.caution && <div className="ccp-gap" style={{ marginTop: 8 }}>⚠ {result.caution}</div>}
          {result.items.some((it) => it.kind !== "info") && (
            <button type="button" className="ccp-btn ccp-btn--ai" style={{ marginTop: 10 }} onClick={() => addAll(active, result)}>
              ✦ {tr("Add all to the prescription")}
            </button>
          )}
        </div>
      )}
      {!busy && !result && <p className="ccp-empty">{tr("Choose a tool to run it on this patient.")}</p>}
    </div>
  );
}
