import React from "react";
import { Sparkline } from "./AICharts";

/**
 * Trends and history part of the Analysis tab: lab results out of range (read straight from the saved
 * lab trends, not from the AI), trend lines from earlier visits, recent visits, likely causes of today's
 * symptoms, things not to miss and care gaps. The narrative summary stays in the existing Summary tab.
 */
const arr = (v) => (Array.isArray(v) ? v : []);

export default function AIBriefView({ tr, brief: raw }) {
  if (!raw) return null;
  // the AI part can be missing (it failed); the hospital's own results still show
  const brief = {
    ...raw,
    trends: arr(raw.trends),
    timeline: arr(raw.timeline),
    differentials: arr(raw.differentials),
    redFlags: arr(raw.redFlags),
    careGaps: arr(raw.careGaps),
    labPanels: arr(raw.labPanels),
    imaging: arr(raw.imaging),
  };
  const empty =
    !brief.abnormal?.length && !brief.trends.length && !brief.timeline.length && !brief.differentials.length && !brief.redFlags.length && !brief.careGaps.length && !brief.labPanels.length && !brief.imaging.length;
  return (
    <>
      <h3>
        <span className="ccp-spark">✦</span>
        {tr("Trends and history")}
      </h3>
      <p className="ccp-cap">{tr("From previous prescriptions, the hospital's lab and radiology reports, uploaded lab reports and today's entries.")}</p>
      {empty && <p className="ccp-empty">{tr("No earlier visits or results were found for this patient.")}</p>}

      {brief.abnormal?.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Latest lab results out of range")}</div>
          <div>
            {brief.abnormal.map((p, i) => {
              const last = p.points[p.points.length - 1];
              return (
                <span key={i} className="ccp-chip" style={{ borderColor: "var(--ccp-danger)" }}>
                  <b>{p.name}</b> {last?.value ?? last?.num} {p.unit || last?.unit || ""}
                  <span className="ccp-tag ccp-tag--danger">{last?.flag === "H" ? tr("High") : tr("Low")}</span>
                </span>
              );
            })}
          </div>
        </>
      )}

      {brief.trends.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Trends")}</div>
          {brief.trends.map((x, i) => (
            <div className="ccp-trend" key={i}>
              <Sparkline values={x.points.map((p) => p.value)} />
              <div>
                <b>
                  {x.name}: {x.points[0].value} → {x.points[x.points.length - 1].value} {x.unit}
                </b>
                {x.note && <div style={{ color: "var(--ccp-muted)" }}>{x.note}</div>}
              </div>
            </div>
          ))}
        </>
      )}

      {brief.timeline.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Recent visits")}</div>
          <div className="ccp-tl">
            {brief.timeline.map((v, i) => (
              <div key={i}>
                <b>{v.date}</b>
                {v.text}
              </div>
            ))}
          </div>
        </>
      )}

      {brief.differentials.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Likely causes of today's symptoms")}</div>
          {brief.differentials.map((d, i) => (
            <div className="ccp-bar" key={i} title={d.reason}>
              <span>{d.name}</span>
              <i style={{ "--w": `${d.percent}%` }} />
              <span>{d.percent}%</span>
            </div>
          ))}
        </>
      )}

      {brief.labPanels.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Lab results")}</div>
          {brief.labPanels.slice(0, 8).map((p, i) => (
            <details className="ccp-report" key={i} open={i === 0}>
              <summary>
                <i className="fas fa-vial" /> <b>{p.panel}</b>
                <span>{p.date}</span>
              </summary>
              <div className="ccp-report__chips">
                {p.results.slice(0, 30).map((r, j) => (
                  <span className="ccp-chip" key={j}>
                    {r.name} <b>{r.value}</b>
                  </span>
                ))}
              </div>
            </details>
          ))}
        </>
      )}

      {brief.imaging.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Radiology reports")}</div>
          {brief.imaging.map((r, i) => (
            <details className="ccp-report" key={i}>
              <summary>
                <i className="fas fa-x-ray" /> <b>{r.study}</b>
                <span>{r.date}</span>
              </summary>
              <div className="ccp-report__text">{r.report}</div>
            </details>
          ))}
        </>
      )}

      {brief.redFlags.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Do not miss")}</div>
          {brief.redFlags.map((g, i) => (
            <div className="ccp-gap ccp-gap--red" key={i}>
              {g}
            </div>
          ))}
        </>
      )}
      {brief.careGaps.length > 0 && (
        <>
          <div className="ccp-h4">{tr("Care gaps")}</div>
          {brief.careGaps.map((g, i) => (
            <div className="ccp-gap" key={i}>
              {g}
            </div>
          ))}
        </>
      )}
    </>
  );
}
