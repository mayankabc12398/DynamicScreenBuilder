import React, { useEffect, useMemo, useState } from "react";
import { safetyCheck } from "../../../utils/aiClinicalAI";
import { allergyHits } from "../../../utils/prescriptionSuggestLogic";

/**
 * Safety: interactions, allergy conflicts, dose alerts and the one bedside score that fits today's
 * diagnosis. A plain allergy word match runs instantly in the browser; the AI review runs on demand and
 * again whenever the prescription changes. Fixes (remove / replace a medicine) apply only on a click.
 */
export default function AISafety({ tr, ctx, store, put, loadBackground, applyToRx, setStatus, onCount, onOpenInteractionChecker }) {
  const saved = store.safety;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState({});

  const signature = useMemo(
    () => JSON.stringify([ctx.currentMedicines.map((m) => m.name.toLowerCase()).sort(), ctx.allergies, ctx.provisionalDiagnosis]),
    [ctx.currentMedicines, ctx.allergies, ctx.provisionalDiagnosis],
  );
  const stale = saved && saved.signature !== signature;

  const localAllergy = useMemo(
    () =>
      ctx.currentMedicines
        .map((m) => ({ medicine: m.name, hits: allergyHits(ctx.allergies, m.name, m.generic) }))
        .filter((x) => x.hits.length),
    [ctx.currentMedicines, ctx.allergies],
  );

  const run = async () => {
    setBusy(true);
    setError("");
    setDone({});
    setStatus({ mode: "thinking", text: "Checking the prescription" });
    try {
      const bg = await loadBackground();
      const result = await safetyCheck({ ctx, history: bg.history });
      put("safety", { result, signature });
    } catch (e) {
      setError(e?.message || tr("The AI could not be reached"));
    } finally {
      setBusy(false);
      setStatus({ mode: "", text: "Ready" });
    }
  };

  // First open with medicines on the grid: check straight away.
  useEffect(() => {
    if (!saved && ctx.currentMedicines.length && !busy) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = saved?.result;
  const open = (result?.interactions || []).filter((x, i) => !done[`i${i}`] && x.severity !== "Minor").length + (result?.allergy?.length || 0);
  useEffect(() => {
    onCount?.(open + (result ? 0 : localAllergy.length));
  }, [open, localAllergy.length, result, onCount]);

  const fix = async (i, opt) => {
    const ok = await applyToRx({
      removeMedicines: opt.medicine ? [opt.medicine] : [],
      medicines: opt.action === "replace" && opt.replacement?.name ? [opt.replacement] : [],
    });
    if (ok) setDone((d) => ({ ...d, [`i${i}`]: opt.label }));
  };

  return (
    <div>
      <p className="ccp-intro">{tr("Checks today's prescription for interactions, allergy conflicts and dosing, and scores the presentation.")}</p>
      <div className="ccp-row" style={{ marginBottom: 10 }}>
        <button type="button" className="ccp-btn ccp-btn--ai" onClick={run} disabled={busy || !ctx.currentMedicines.length}>
          ✦ {saved ? tr("Check again") : tr("Check prescription")}
        </button>
        {onOpenInteractionChecker && (
          <button type="button" className="ccp-btn" onClick={onOpenInteractionChecker}>
            <i className="fas fa-capsules" /> {tr("Drug Interaction Checker")}
          </button>
        )}
      </div>
      {!ctx.currentMedicines.length && <p className="ccp-empty">{tr("Add medicines to the prescription and the AI will check them.")}</p>}
      {stale && !busy && (
        <div className="ccp-alert ccp-alert--warn">
          <h5>{tr("The prescription changed since the last check")}</h5>
          <p>{tr("Press Check again to review the current list.")}</p>
        </div>
      )}
      {error && <div className="ccp-error">{error}</div>}

      {localAllergy.map((a, i) => (
        <div key={`la${i}`} className="ccp-alert ccp-alert--danger">
          <h5>⚠ {tr("Allergy match")}: {a.medicine}</h5>
          <p>
            {tr("The recorded allergy")} “{a.hits.join(", ")}” {tr("appears in this medicine's name. Please confirm before signing.")}
          </p>
        </div>
      ))}

      {busy && (
        <div>
          <div className="ccp-shimmer" />
          <div className="ccp-shimmer" style={{ width: "75%" }} />
        </div>
      )}

      {!busy && result && (
        <div className="ccp-pop">
          {result.interactions.map((x, i) => {
            const fixed = done[`i${i}`];
            if (fixed)
              return (
                <div key={i} className="ccp-alert ccp-alert--ok">
                  <h5>✓ {tr("Interaction resolved")}</h5>
                  <p>{fixed}</p>
                </div>
              );
            const tone = x.severity === "Major" ? "danger" : x.severity === "Moderate" ? "warn" : "";
            return (
              <div key={i} className={`ccp-alert${tone ? ` ccp-alert--${tone}` : ""}`}>
                <h5>
                  {tone === "danger" ? "⚠ " : ""}
                  {x.drugs.join(" + ")} <span className={`ccp-tag ccp-tag--${x.severity === "Major" ? "High" : x.severity === "Moderate" ? "Medium" : "Low"}`}>{tr(x.severity)}</span>
                </h5>
                <p>{x.effect}</p>
                {x.options.length > 0 && (
                  <div className="ccp-row">
                    {x.options.map((o, j) => (
                      <button key={j} type="button" className="ccp-btn ccp-btn--sm" onClick={() => (o.action === "none" ? setDone((d) => ({ ...d, [`i${i}`]: o.label })) : fix(i, o))}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {result.allergy.map((a, i) => (
            <div key={`a${i}`} className="ccp-alert ccp-alert--danger">
              <h5>⚠ {tr("Allergy")}: {a.medicine}</h5>
              <p>
                {a.allergen && <b>{a.allergen}. </b>}
                {a.note}
              </p>
            </div>
          ))}
          {result.doseAlerts.map((d, i) => (
            <div key={`d${i}`} className="ccp-alert ccp-alert--warn">
              <h5>{d.medicine || tr("Dosing")}</h5>
              <p>{d.note}</p>
            </div>
          ))}
          {!result.interactions.length && !result.allergy.length && !result.doseAlerts.length && (
            <div className="ccp-alert ccp-alert--ok">
              <h5>✓ {tr("No problems found in the current list")}</h5>
              <p>{tr("The AI re-checks when you press Check again after changing the prescription.")}</p>
            </div>
          )}
          {result.score && (
            <div className="ccp-alert">
              <h5>{result.score.name}</h5>
              <div className="ccp-score">
                <span className="ccp-score__big">{result.score.value}</span>
                <p style={{ margin: 0 }}>{result.score.interpretation}</p>
              </div>
              {result.score.criteria.length > 0 && (
                <div className="ccp-crit">
                  {result.score.criteria.map((c, i) => (
                    <span key={i} className={c.met ? "ccp-crit--y" : ""}>
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {result.passed.map((p, i) => (
            <div key={`p${i}`} className="ccp-alert ccp-alert--ok">
              <p>✓ {p}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
