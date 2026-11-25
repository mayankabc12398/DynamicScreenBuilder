import React, { useEffect, useMemo, useState } from "react";
import { patientBrief, patientInsights } from "../../../utils/aiClinicalAI";
import { analyzePacsImages } from "../../../utils/aiRadiologyAnalysis";
import { outOfRangeNow } from "../../../utils/labTrendLogic";
import { simulateRisk, simulatorTargets, simulatorToday } from "../../../utils/aiClinicalLogic";
import { CourseChart, Gauge } from "./AICharts";
import AIBriefView from "./AIBriefView";

/**
 * Analysis tab of AI Assistance: patient intelligence in one view - trends and history, body map of every problem in the record, risk estimates
 * with what drives each number, the expected course with return criteria, treatment options compared for
 * this patient, a first read of an image, next best actions and what the patient said.
 * Every number is an AI estimate for decision support and is labelled with its basis.
 */

const ORGAN_LABEL = {
  brain: "Brain and nerves",
  eyes: "Eyes",
  heart: "Heart and vessels",
  lungs: "Lungs",
  liver: "Liver",
  gut: "Stomach and gut",
  kidneys: "Kidneys",
  metabolic: "Metabolism (glucose)",
  blood: "Blood",
  bones: "Bones and joints",
  skin: "Skin",
  feet: "Feet",
};
// Hotspots on a 200 x 370 body outline, drawn back to front.
const SHAPES = {
  lungs: [["ellipse", { cx: 82, cy: 118, rx: 15, ry: 28 }], ["ellipse", { cx: 118, cy: 118, rx: 15, ry: 28 }]],
  heart: [["circle", { cx: 107, cy: 124, r: 10 }]],
  liver: [["ellipse", { cx: 83, cy: 160, rx: 16, ry: 9 }]],
  metabolic: [["ellipse", { cx: 112, cy: 166, rx: 13, ry: 5 }]],
  gut: [["ellipse", { cx: 100, cy: 186, rx: 18, ry: 9 }]],
  kidneys: [["ellipse", { cx: 76, cy: 200, rx: 6, ry: 10 }], ["ellipse", { cx: 124, cy: 200, rx: 6, ry: 10 }]],
  brain: [["circle", { cx: 100, cy: 30, r: 10 }]],
  eyes: [["circle", { cx: 91, cy: 44, r: 4 }], ["circle", { cx: 109, cy: 44, r: 4 }]],
  blood: [["circle", { cx: 39, cy: 150, r: 7 }]],
  skin: [["circle", { cx: 161, cy: 150, r: 7 }]],
  bones: [["circle", { cx: 77, cy: 282, r: 7 }], ["circle", { cx: 123, cy: 282, r: 7 }]],
  feet: [["ellipse", { cx: 77, cy: 356, rx: 16, ry: 7 }], ["ellipse", { cx: 123, cy: 356, rx: 16, ry: 7 }]],
};
const STATUS_LABEL = { danger: "Active problem", warn: "Needs attention", ok: "Stable", none: "Not assessed" };
const LEVEL_COLOR = { High: "danger", Moderate: "warn", Low: "ok" };

const readImage = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

function BodyMap({ tr, organs, selected, onSelect }) {
  const byKey = Object.fromEntries(organs.map((o) => [o.key, o]));
  const o = byKey[selected] || organs[0];
  return (
    <div className="ccp-twin">
      <svg viewBox="0 0 200 370" width="140" aria-label={tr("Body map")} style={{ maxWidth: "100%", justifySelf: "center" }}>
        <g className="ccp-body-shape">
          <circle cx="100" cy="36" r="26" />
          <rect x="90" y="58" width="20" height="16" />
          <rect x="52" y="72" width="96" height="152" rx="34" />
          <rect x="28" y="82" width="22" height="122" rx="11" />
          <rect x="150" y="82" width="22" height="122" rx="11" />
          <rect x="60" y="214" width="34" height="136" rx="16" />
          <rect x="106" y="214" width="34" height="136" rx="16" />
        </g>
        {Object.keys(SHAPES)
          .filter((k) => byKey[k])
          .map((k) => {
            const st = byKey[k].status;
            return (
              <g
                key={k}
                className={`ccp-hs ccp-hs--${st}${k === o?.key ? " ccp-hs--sel" : ""}`}
                tabIndex={0}
                role="button"
                aria-label={tr(ORGAN_LABEL[k])}
                onClick={() => onSelect(k)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(k))}
              >
                {SHAPES[k].map(([Tag, p], i) => (
                  <React.Fragment key={i}>
                    <Tag {...p} />
                    {st === "danger" && <Tag {...p} className="ccp-ring" />}
                  </React.Fragment>
                ))}
              </g>
            );
          })}
      </svg>
      <div style={{ minWidth: 0 }}>
        {o && (
          <>
            <div className="ccp-row">
              <b style={{ fontSize: 16 }}>{tr(ORGAN_LABEL[o.key])}</b>
              <span className={`ccp-tag ccp-tag--${o.status}`}>{tr(STATUS_LABEL[o.status])}</span>
            </div>
            {o.metric && (
              <div style={{ fontWeight: 700, margin: "6px 0", color: o.status === "none" ? "var(--ccp-muted)" : `var(--ccp-${o.status})` }}>{o.metric}</div>
            )}
            <p className="ccp-aitext" style={{ margin: "0 0 10px", fontSize: 14 }}>
              {o.detail}
            </p>
          </>
        )}
        <div>
          {organs.map((x) => (
            <button key={x.key} type="button" className="ccp-organ" aria-pressed={x.key === o?.key} onClick={() => onSelect(x.key)}>
              <span className={`ccp-dot ccp-dot--${x.status}`} />
              {tr(ORGAN_LABEL[x.key])}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageRead({ tr, ctx, store, put, setStatus }) {
  const saved = store.image || {};
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setError(tr("Choose a PNG, JPG or WEBP image"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(tr("The image is larger than 5 MB"));
      return;
    }
    setError("");
    const dataUrl = await readImage(file);
    put("image", { dataUrl, result: null });
    setBusy(true);
    setStatus({ mode: "thinking", text: "Reading the image" });
    try {
      // No patient name or doctor is passed - only age/sex and the clinical question.
      const result = await analyzePacsImages([{ base64: dataUrl.split(",")[1], mimeType: file.type }], {
        ageGender: [ctx.age, ctx.sex].filter(Boolean).join(" / "),
        clinicalHistory: [...ctx.chiefComplaint, ...ctx.provisionalDiagnosis].join("; "),
      });
      put("image", { dataUrl, result });
    } catch (err) {
      setError(err?.message || tr("The AI could not be reached"));
    } finally {
      setBusy(false);
      setStatus({ mode: "", text: "Ready" });
    }
  };

  const r = saved.result;
  return (
    <>
      <h3>
        <span className="ccp-spark">✦</span>
        {tr("Image read")}
      </h3>
      <p className="ccp-cap">{tr("A first read of an X-ray, scan or photo in seconds, while the patient is still in the room. The radiologist's report follows.")}</p>
      <div className="ccp-xr">
        <div className="ccp-xr__img">
          {saved.dataUrl ? (
            <>
              <img src={saved.dataUrl} alt={tr("Uploaded image")} />
              {busy && <div className="ccp-xr__scan" />}
              {!busy &&
                (r?.regions || [])
                  .filter((g) => !g.imageIndex)
                  .map((g, i) => (
                    <div
                      key={i}
                      className="ccp-xr__box"
                      style={{ top: `${g.box_2d[0] / 10}%`, left: `${g.box_2d[1] / 10}%`, height: `${(g.box_2d[2] - g.box_2d[0]) / 10}%`, width: `${(g.box_2d[3] - g.box_2d[1]) / 10}%` }}
                    >
                      <span>
                        {g.label}
                        {g.confidence != null ? ` ${Math.round(g.confidence)}%` : ""}
                      </span>
                    </div>
                  ))}
            </>
          ) : (
            <span style={{ padding: 20 }}>{tr("No image yet")}</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <label className="ccp-btn ccp-btn--ai" style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer", background: "var(--ccp-ai)", color: "#fff", borderRadius: 9, padding: "6px 12px", fontWeight: 600, fontSize: 13 }}>
            <i className="fas fa-upload" /> {saved.dataUrl ? tr("Another image") : tr("Load image")}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} hidden disabled={busy} />
          </label>
          {error && <div className="ccp-error">{error}</div>}
          {busy && (
            <div style={{ marginTop: 10 }}>
              <div className="ccp-shimmer" />
              <div className="ccp-shimmer" style={{ width: "70%" }} />
            </div>
          )}
          {!busy && r && (
            <div style={{ marginTop: 10 }}>
              {(r.modality || r.bodyPart) && <div className="ccp-cap" style={{ margin: "0 0 4px" }}>{[r.modality, r.bodyPart, r.view].filter(Boolean).join(" · ")}</div>}
              {r.findings.slice(0, 6).map((f, i) => (
                <div className="ccp-find" key={i}>
                  <span>
                    {f.region ? <b>{f.region}: </b> : null}
                    {f.observation}
                  </span>
                  <b style={{ color: f.significance === "critical" ? "var(--ccp-danger)" : f.significance === "abnormal" ? "var(--ccp-warn)" : "var(--ccp-ok)", whiteSpace: "nowrap" }}>
                    {f.confidence != null ? `${f.confidence}%` : tr(f.significance)}
                  </b>
                </div>
              ))}
              {r.impression.length > 0 && <p className="ccp-why" style={{ fontSize: 14 }}>{r.impression.join(" ")}</p>}
              {r.criticalFinding && <div className="ccp-gap ccp-gap--red">⚠ {r.criticalReason || tr("Critical finding - act now")}</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* What the Analysis tab produces - shown as a preview while it runs (and before the first run). */
const PREVIEW = [
  ["fas fa-chart-line", "Trends and history", "Labs out of range, trends, recent visits, likely causes and care gaps."],
  ["fas fa-child", "Body map", "Every problem in the record, mapped to the body."],
  ["fas fa-tachometer-alt", "Predictions", "Personal risk estimates, with the reasons behind each number."],
  ["fas fa-heartbeat", "Recovery forecast", "Expected course and when to act if it does not go that way."],
  ["fas fa-hospital", "Where to treat", "Home, day care or admission, and what would change it."],
  ["fas fa-pills", "Treatment decision", "Options compared for this patient: medicines, conditions, age."],
  ["fas fa-sliders-h", "What-if simulator", "Show the patient how today's decisions change their future risk."],
  ["fas fa-tasks", "Next best actions", "Ranked by benefit, each one added to the plan in one click."],
];

const SETTING_TONE = { Home: "ok", "Day care": "ok", Observation: "warn", Admission: "danger", ICU: "danger" };

/** Sliders and switches over the AI's risk model; the risk is recomputed in the browser as they move. */
function SimulatorCard({ tr, sim }) {
  const [values, setValues] = useState(() => simulatorToday(sim));
  useEffect(() => setValues(simulatorToday(sim)), [sim]);
  const now = simulateRisk(sim, simulatorToday(sim));
  const v = simulateRisk(sim, values);
  const d = Math.round(now - v);
  const scale = Math.max(now, v, 10) * 1.15;
  const fmt = (n) => (n < 10 ? n.toFixed(1) : Math.round(n));
  return (
    <>
      <h3>
        <span className="ccp-spark">✦</span>
        {tr("What-if simulator")}
      </h3>
      <p className="ccp-cap">{tr("Show the patient how decisions made today change their future. Move the sliders together during the consultation.")}</p>
      <div className="ccp-sim">
        <div>
          {sim.factors.map((f) => (
            <div className="ccp-sl" key={f.key}>
              <label htmlFor={`sim-${f.key}`}>
                <span>{f.label}</span>
                <span>
                  {values[f.key]} {f.unit}
                </span>
              </label>
              <input
                id={`sim-${f.key}`}
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={values[f.key]}
                onChange={(e) => setValues((x) => ({ ...x, [f.key]: Number(e.target.value) }))}
              />
            </div>
          ))}
          {sim.toggles.map((g) => (
            <label className="ccp-tog" key={g.key}>
              <input type="checkbox" checked={!!values[g.key]} onChange={(e) => setValues((x) => ({ ...x, [g.key]: e.target.checked }))} /> {g.label}
            </label>
          ))}
          <div className="ccp-row" style={{ marginTop: 8 }}>
            <button type="button" className="ccp-btn ccp-btn--ai ccp-btn--sm" onClick={() => setValues(simulatorTargets(sim))}>
              {tr("Set guideline targets")}
            </button>
            <button type="button" className="ccp-btn ccp-btn--sm" onClick={() => setValues(simulatorToday(sim))}>
              {tr("Back to today")}
            </button>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12.5, color: "var(--ccp-muted)", fontWeight: 700 }}>{sim.outcome}</div>
          <div className="ccp-sim__big">{fmt(v)}%</div>
          <div className="ccp-cmp">
            <div>
              <span>{tr("Today")}</span>
              <i style={{ width: `${(now / scale) * 100}%`, background: "var(--ccp-danger)" }} />
              <b>{fmt(now)}%</b>
            </div>
            <div>
              <span>{tr("Simulated")}</span>
              <i style={{ width: `${(v / scale) * 100}%`, background: "var(--ccp-ai)" }} />
              <b>{fmt(v)}%</b>
            </div>
          </div>
          <p className="ccp-aitext" style={{ fontSize: 14, margin: "8px 0 4px" }}>
            {d > 0
              ? `${tr("Out of 100 people like this patient, about")} ${d} ${tr("fewer would have this outcome.")}`
              : d < 0
                ? `${tr("Out of 100 people like this patient, about")} ${-d} ${tr("more would have this outcome.")}`
                : tr("Move a slider to see how the risk changes.")}
          </p>
          {sim.basis && <p className="ccp-cap" style={{ margin: 0 }}>{tr("Basis")}: {sim.basis}</p>}
        </div>
      </div>
    </>
  );
}

export default function AIAnalysis({ tr, ctx, store, put, loadBackground, applyToRx, setStatus, onFullView, expanded }) {
  const saved = store.insights;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [organ, setOrgan] = useState("");
  const [riskIdx, setRiskIdx] = useState(0);
  const [done, setDone] = useState({});

  const transcript = useMemo(
    () => (store.scribe?.result?.transcript || []).map((l) => `${l.speaker}: ${l.text}`).join("\n"),
    [store.scribe],
  );

  const generate = async () => {
    setBusy(true);
    setError("");
    setStatus({ mode: "thinking", text: "Analysing the record" });
    try {
      const started = Date.now();
      const bg = await loadBackground();
      // Both in parallel; the trends/history part is optional and never blocks the rest.
      const [result, brief] = await Promise.all([
        patientInsights({ ctx, history: bg.history, labs: bg.labs, transcript }),
        patientBrief({ ctx, history: bg.history, labs: bg.labs }).catch(() => null),
      ]);
      put("brief", brief || bg.record ? { ...(brief || {}), abnormal: outOfRangeNow(bg.labParams).slice(0, 8), labPanels: bg.record?.labs || [], imaging: bg.record?.imaging || [] } : null);
      const firstOrgan = result.organs.find((o) => o.status === "danger") || result.organs[0];
      setOrgan(firstOrgan?.key || "");
      setRiskIdx(0);
      setDone({});
      put("insights", { ...result, seconds: ((Date.now() - started) / 1000).toFixed(1), labCount: bg.labCount, visitCount: bg.record?.visitCount ?? 0 });
    } catch (e) {
      setError(e?.message || tr("The AI could not be reached"));
    } finally {
      setBusy(false);
      setStatus({ mode: "", text: "Ready" });
    }
  };

  // First open for this visit: analyse straight away (once; Refresh runs it again).
  useEffect(() => {
    if (!store.insights && !store.analysisStarted) {
      put("analysisStarted", true);
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAction = async (a, i) => {
    const ok = await applyToRx(
      a.kind === "investigation"
        ? { investigations: [{ name: a.text }] }
        : { texts: { [a.kind === "advice" ? "Doctor Advice" : "Doctor Notes"]: [a.text] } },
    );
    if (ok) setDone((d) => ({ ...d, [`a${i}`]: true }));
  };
  const usePlan = async (o, i) => {
    const ok = await applyToRx({ medicines: o.medicines });
    if (ok) setDone((d) => ({ ...d, [`o${i}`]: true }));
  };

  const risk = saved?.risks?.[riskIdx];
  const card = (key, content, span) => (
    <div key={key} className={`ccp-card${span ? " ccp-span2" : ""}`}>
      {content}
    </div>
  );

  return (
    <div>
      <div className="ccp-ihead">
        <div className={`ccp-orb ccp-orb--sm${busy ? " ccp-orb--thinking" : ""}`} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>{saved?.headline || tr("Patient intelligence")}</b>
          <div style={{ color: "var(--ccp-muted)", fontSize: 12.5 }}>
            {saved
              ? `${tr("Analysed today's visit,")} ${saved.visitCount} ${tr("earlier visits and")} ${saved.labCount} ${tr("lab and radiology reports in")} ${saved.seconds} s`
              : tr("Body map, risks with their drivers, expected course, treatment options and next best actions for this patient.")}
          </div>
        </div>
        <div className="ccp-row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="ccp-btn ccp-btn--ai" onClick={generate} disabled={busy}>
            ✦ {saved ? tr("Refresh") : tr("Analyse")}
          </button>
          {onFullView && !expanded && (
            <button type="button" className="ccp-btn" onClick={onFullView} title={tr("Open AI Assistance in a large window")}>
              <i className="fas fa-expand-alt" /> {tr("Expand")}
            </button>
          )}
        </div>
      </div>
      {error && <div className="ccp-error">{error}</div>}
      {!saved && (
        <div className="ccp-ig">
          {PREVIEW.map(([icon, title, cap]) => (
            <div key={title} className="ccp-card ccp-card--preview">
              <h3>
                <span className="ccp-spark">
                  <i className={icon} />
                </span>
                {tr(title)}
              </h3>
              <p className="ccp-cap">{tr(cap)}</p>
              {busy ? (
                <>
                  <div className="ccp-shimmer" />
                  <div className="ccp-shimmer" style={{ width: "70%" }} />
                </>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="ccp-ig">
        {saved && store.brief && card("brief", <AIBriefView tr={tr} brief={store.brief} />, true)}
        {saved && saved.organs.length > 0 &&
          card(
            "twin",
            <>
              <h3>
                <span className="ccp-spark">✦</span>
                {tr("Body map")}
              </h3>
              <p className="ccp-cap">{tr("Every problem in the record, mapped to the body. Select an area.")}</p>
              <BodyMap tr={tr} organs={saved.organs} selected={organ} onSelect={setOrgan} />
            </>,
          )}

        {saved && saved.risks.length > 0 &&
          card(
            "risk",
            <>
              <h3>
                <span className="ccp-spark">✦</span>
                {tr("Predictions")}
              </h3>
              <p className="ccp-cap">{tr("Personal risk estimates, with the reasons behind each number.")}</p>
              <div className="ccp-risks">
                {saved.risks.map((k, i) => (
                  <button key={i} type="button" className="ccp-risk" aria-pressed={i === riskIdx} onClick={() => setRiskIdx(i)}>
                    <Gauge value={k.percent} color={LEVEL_COLOR[k.level] || "ai"} />
                    <span>
                      <b>{k.name}</b>
                      <small>{tr(k.level)}</small>
                    </span>
                  </button>
                ))}
              </div>
              {risk && (
                <>
                  <div className="ccp-h4">
                    {tr("What drives")}: {risk.name}
                  </div>
                  {risk.drivers.map((d, i) => (
                    <div className="ccp-fac" key={i}>
                      <span>{d.factor}</span>
                      <span className="ccp-fac__track">
                        <span className={`ccp-fac__fill ccp-fac__fill--${d.weight > 0 ? "up" : "down"}`} style={{ width: `${(Math.abs(d.weight) / 5) * 50}%` }} />
                      </span>
                      <span style={{ textAlign: "right", fontWeight: 700, color: d.weight > 0 ? "var(--ccp-danger)" : "var(--ccp-ok)" }}>
                        {d.weight > 0 ? "+" : "−"}
                        {Math.abs(d.weight).toFixed(1)}
                      </span>
                    </div>
                  ))}
                  <p className="ccp-cap" style={{ margin: "8px 0 0" }}>
                    {tr("Red raises the risk, green lowers it. Basis")}: {risk.basis || tr("clinical estimate")}.
                  </p>
                </>
              )}
            </>,
          )}

        {saved && (saved.course.summary || saved.course.checkpoints.length > 0) &&
          card(
            "course",
            <>
              <h3>
                <span className="ccp-spark">✦</span>
                {tr("Recovery forecast")}
              </h3>
              <p className="ccp-cap">{tr("Expected course with today's plan, and when to act if it does not go that way.")}</p>
              <div className="ccp-chart">
                <CourseChart expectedDays={saved.course.expectedDays} checkpoints={saved.course.checkpoints} todayLabel={tr("Today")} dayLabel={tr("D")} />
              </div>
              {saved.course.summary && <p style={{ fontSize: 13.5, margin: "8px 0 6px" }}>{saved.course.summary}</p>}
              {saved.course.returnCriteria.map((c, i) => (
                <div className="ccp-gap" key={i}>
                  ↩ {c}
                </div>
              ))}
            </>,
          )}

        {card("image", <ImageRead tr={tr} ctx={ctx} store={store} put={put} setStatus={setStatus} />)}

        {saved && saved.options.length > 0 &&
          card(
            "opts",
            <>
              <h3>
                <span className="ccp-spark">✦</span>
                {tr("Treatment decision")}
              </h3>
              <p className="ccp-cap">{tr("Options compared for this patient, not the average patient: their medicines, conditions and age.")}</p>
              <div className="ccp-opts">
                {saved.options.map((o, i) => (
                  <div key={i} className={`ccp-opt${o.recommended ? " ccp-opt--best" : ""}`}>
                    {o.recommended && <span className="ccp-tag ccp-tag--ai" style={{ alignSelf: "flex-start" }}>✦ {tr("AI recommends")}</span>}
                    <h4>{o.name}</h4>
                    <dl>
                      {[
                        ["Expected effect", o.efficacy],
                        ["Interactions for this patient", o.interactions],
                        ["Side-effect risk for this patient", o.sideEffects],
                        ["Cost", o.cost],
                        ["Tablets a day", o.pillsPerDay],
                      ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt>{tr(k)}</dt>
                            <dd>{v}</dd>
                          </React.Fragment>
                        ))}
                    </dl>
                    {o.medicines.length > 0 && (
                      <ul>
                        {o.medicines.map((m, j) => (
                          <li key={j}>
                            <b>{m.name}</b> {[m.dose, m.frequency, m.duration].filter(Boolean).join(" · ")}
                          </li>
                        ))}
                      </ul>
                    )}
                    {o.why && <p className="ccp-why-sm">{o.why}</p>}
                    {o.medicines.length > 0 && (
                      <button
                        type="button"
                        className={`ccp-btn ccp-btn--block ${done[`o${i}`] ? "ccp-btn--done" : "ccp-btn--ai"}`}
                        onClick={() => usePlan(o, i)}
                        disabled={!!done[`o${i}`]}
                      >
                        {done[`o${i}`] ? `✓ ${tr("Added to the prescription")}` : tr("Add these medicines")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="ccp-cap" style={{ margin: "10px 0 0" }}>
                {tr("Adding a plan does not remove anything already prescribed - remove what it replaces in the grid.")}
              </p>
            </>,
            true,
          )}

        {saved && saved.disposition &&
          card(
            "where",
            <>
              <h3>
                <span className="ccp-spark">✦</span>
                {tr("Where to treat")}
              </h3>
              <div className={`ccp-alert ccp-alert--${SETTING_TONE[saved.disposition.setting] || "ok"}`} style={{ margin: "6px 0 8px" }}>
                <h5>
                  {SETTING_TONE[saved.disposition.setting] === "ok" ? "✓ " : "⚠ "}
                  {tr(saved.disposition.setting)}
                  {saved.disposition.review ? `, ${saved.disposition.review}` : ""}
                </h5>
                {saved.disposition.reason && <p>{saved.disposition.reason}</p>}
              </div>
              {saved.disposition.escalateIf.length > 0 && (
                <>
                  <div className="ccp-h4">{tr("Escalate if")}</div>
                  {saved.disposition.escalateIf.map((x, i) => (
                    <div className="ccp-gap" key={i}>
                      ↑ {x}
                    </div>
                  ))}
                </>
              )}
            </>,
          )}

        {saved && saved.simulator && card("sim", <SimulatorCard tr={tr} sim={saved.simulator} />, true)}

        {saved && saved.actions.length > 0 &&
          card(
            "nba",
            <>
              <h3>
                <span className="ccp-spark">✦</span>
                {tr("Next best actions")}
              </h3>
              <p className="ccp-cap">{tr("Ranked by benefit for this patient, from guidelines and the record.")}</p>
              {saved.actions.map((a, i) => (
                <div className="ccp-nba" key={i}>
                  <span className={`ccp-tag ccp-tag--${a.priority}`}>{tr(a.priority)}</span>
                  <div>
                    {a.text}
                    {a.why && <small>{a.why}</small>}
                  </div>
                  <button
                    type="button"
                    className={`ccp-btn ccp-btn--sm${done[`a${i}`] ? " ccp-btn--done" : ""}`}
                    disabled={!!done[`a${i}`]}
                    onClick={() => addAction(a, i)}
                  >
                    {done[`a${i}`] ? tr("Added") : tr("Add to plan")}
                  </button>
                </div>
              ))}
            </>,
          )}

        {saved &&
          card(
            "voice",
            <>
              <h3>
                <span className="ccp-spark">✦</span>
                {tr("Patient voice")}
              </h3>
              <p className="ccp-cap">{tr("What the patient said during the visit, and what it means for the conversation.")}</p>
              {saved.voice.length ? (
                saved.voice.map((v, i) => (
                  <div className="ccp-voice" key={i}>
                    <q>{v.quote}</q>
                    <small>✦ {v.meaning}</small>
                  </div>
                ))
              ) : (
                <p className="ccp-empty">{tr("Use the Scribe during the consultation to capture the patient's concerns, then refresh.")}</p>
              )}
            </>,
          )}
      </div>
      <p className="ccp-cap" style={{ margin: "12px 2px 0" }}>
        {tr("Percentages are AI estimates for decision support, not validated scores unless a named score is given as the basis.")}
      </p>
    </div>
  );
}
