import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { useTranslation } from "react-i18next";
import { SiGooglegemini } from "react-icons/si";
import { DischargeClinicalRecordApi } from "../../networkServices/dischargeSummaryAPI";
import { notify } from "../../utils/utils";
import { summariseClinicalRecord } from "./dischargeAi";
import {
  MAX_DETAIL_CHARS, applySelection, buildSections, escapeHtml, sectionsToHtml, sectionsToText,
} from "./dischargeClinicalRecord";

const BOX = { border: "1px solid #d6dde6", borderRadius: 6, padding: "8px 10px", marginBottom: 10, background: "#fff" };
const CELL = { border: "1px solid #c9d1db", padding: "2px 6px", fontSize: 12, whiteSpace: "nowrap" };
const HEAD = { ...CELL, background: "#e8eef5", fontWeight: 600 };

function CrossTable({ cross }) {
  if (!cross.columns.length) return null;
  return cross.groups.map((g) => (
    <div key={g.investigation} className="mb-2" style={{ overflowX: "auto" }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{g.investigation}</div>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={HEAD}>Parameter</th>
            <th style={HEAD}>Range</th>
            {cross.columns.map((c) => <th key={c.key} style={{ ...HEAD, textAlign: "center" }}>{c.date}<br />{c.time}</th>)}
          </tr>
        </thead>
        <tbody>
          {g.rows.map((row) => (
            <tr key={row.parameter}>
              <td style={CELL}>{row.parameter}</td>
              <td style={CELL}>{row.range}</td>
              {cross.columns.map((c) => {
                const cell = row.cells[c.key];
                return <td key={c.key} style={{ ...CELL, textAlign: "center", color: cell?.critical ? "#c0392b" : undefined, fontWeight: cell?.critical ? 700 : 400 }}>{cell?.value || ""}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ));
}

/**
 * Discharge summary > "Clinical record": gathers everything recorded for this admission, shows each part with the
 * place it came from, and binds the ticked parts (and an optional AI summary) into the summary editor.
 */
export default function DischargeClinicalRecordModal({ visible, onHide, transactionID, onBind }) {
  const [t] = useTranslation();
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState(null);
  const [error, setError] = useState("");
  const [on, setOn] = useState(new Set());
  const [off, setOff] = useState(new Set());
  const [openKey, setOpenKey] = useState("");
  const [ai, setAi] = useState({ html: "", loading: false, include: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await DischargeClinicalRecordApi({ TID: String(transactionID) });
    setLoading(false);
    if (!res?.success) { setRaw(null); setError(res?.message || t("Could not load the clinical record")); return; }
    setRaw(res.data);
  }, [transactionID, t]);

  useEffect(() => {
    if (visible && transactionID) { setAi({ html: "", loading: false, include: true }); setOff(new Set()); load(); }
  }, [visible, transactionID, load]);

  const sections = useMemo(() => (raw ? buildSections(raw) : []), [raw]);
  // Sections that have data start ticked, except the catch-all "Other notes".
  useEffect(() => {
    setOn(new Set(sections.filter((s) => s.count > 0 && s.key !== "other").map((s) => s.key)));
    setOpenKey((k) => k || sections.find((s) => s.count > 0)?.key || "");
  }, [sections]);

  const chosen = useMemo(() => applySelection(sections, on, off), [sections, on, off]);
  const total = chosen.reduce((n, s) => n + s.count, 0);

  const toggle = (key) => setOn((p) => { const n = new Set(p); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  const toggleItem = (k) => setOff((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const generate = async () => {
    const text = sectionsToText(chosen);
    if (!text) { notify(t("Tick at least one section first"), "error"); return; }
    setAi((a) => ({ ...a, loading: true }));
    try {
      setAi((a) => ({ ...a, html: "", loading: true }));
      const html = await summariseClinicalRecord(text);
      setAi((a) => ({ ...a, html, loading: false, include: true }));
    } catch (e) {
      setAi((a) => ({ ...a, loading: false }));
      notify(e?.message || t("Unable to generate the summary"), "error");
    }
  };

  const bind = () => {
    const parts = [];
    if (ai.html && ai.include) parts.push(`<h3>${escapeHtml(t("Summary of the clinical record"))}</h3>${ai.html}`);
    const body = sectionsToHtml(chosen);
    if (body) parts.push(body);
    if (!parts.length) { notify(t("Nothing selected to add to the summary"), "error"); return; }
    const html = parts.join("");
    // A summary section is stored in a 64 KB column: a longer one would be cut off and print incomplete.
    if (html.length > MAX_DETAIL_CHARS) {
      notify(t("Too much to add in one go. Untick some sections or notes and add them in parts, under different headers."), "error");
      return;
    }
    onBind(html);
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={t("Clinical record of this admission")}
      style={{ width: "min(1200px, 96vw)" }}
      contentStyle={{ maxHeight: "74vh" }}
      footer={(
        <div className="d-flex justify-content-between align-items-center">
          <span style={{ fontSize: 12, color: "#555" }}>{`${total} ${t("items ticked")}`}</span>
          <div>
            <button type="button" className="btn btn-sm btn-secondary mr-2" onClick={onHide}>{t("Close")}</button>
            <button type="button" className="btn btn-sm btn-success" onClick={bind} disabled={loading || (total === 0 && !ai.html)}>{t("Add to summary")}</button>
          </div>
        </div>
      )}
    >
      {loading ? <div className="p-3">{t("Reading the patient record")}...</div> : null}
      {error ? <div className="alert alert-warning">{error}</div> : null}

      {!loading && raw ? (
        <div className="row">
          <div className="col-lg-3 col-12">
            <div style={BOX}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{t("Source of data")}</div>
              {sections.map((s) => (
                <div key={s.key} className="d-flex align-items-start mb-1" style={{ opacity: s.count ? 1 : 0.5 }}>
                  <input type="checkbox" className="mt-1 mr-2" checked={on.has(s.key)} disabled={!s.count} onChange={() => toggle(s.key)} />
                  <div style={{ cursor: s.count ? "pointer" : "default" }} onClick={() => s.count && setOpenKey(s.key)}>
                    <div style={{ fontSize: 13, fontWeight: openKey === s.key ? 700 : 500 }}>{t(s.title)} <span className="badge badge-secondary">{s.count}</span></div>
                    <div style={{ fontSize: 11, color: "#666" }}>{s.origin}</div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-sm w-100" style={{ backgroundColor: "#6236ec", color: "white" }} onClick={generate} disabled={ai.loading || total === 0}>
              <SiGooglegemini /> {ai.loading ? t("Writing") + "..." : t("Write AI summary of ticked data")}
            </button>
          </div>

          <div className="col-lg-9 col-12">
            {ai.html ? (
              <div style={{ ...BOX, borderColor: "#6236ec" }}>
                <div className="d-flex justify-content-between">
                  <b>{t("AI summary")}</b>
                  <label style={{ fontSize: 12 }}><input type="checkbox" className="mr-1" checked={ai.include} onChange={(e) => setAi((a) => ({ ...a, include: e.target.checked }))} />{t("Add to summary")}</label>
                </div>
                <div style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: ai.html }} />
                <div style={{ fontSize: 11, color: "#666" }}>{t("Written only from the ticked data. Please check it before approving.")}</div>
              </div>
            ) : null}

            {sections.filter((s) => s.count > 0).map((s) => (
              <div key={s.key} style={BOX}>
                <div className="d-flex justify-content-between" style={{ cursor: "pointer" }} onClick={() => setOpenKey(openKey === s.key ? "" : s.key)}>
                  <b>{t(s.title)}</b>
                  <span style={{ fontSize: 11, color: "#666" }}>{s.origin} {openKey === s.key ? "▲" : "▼"}</span>
                </div>
                {openKey === s.key ? (
                  <div className="mt-2">
                    {s.kind === "cross" ? <CrossTable cross={s.cross} /> : null}
                    {s.kind === "table" ? (
                      <table style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead><tr>{s.columns.map((c) => <th key={c} style={HEAD}>{c}</th>)}</tr></thead>
                        <tbody>{s.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={CELL}>{c}</td>)}</tr>)}</tbody>
                      </table>
                    ) : null}
                    {s.kind === "text" ? s.items.map((it) => (
                      <div key={it.id} className="d-flex mb-2" style={{ borderTop: "1px dashed #d6dde6", paddingTop: 6 }}>
                        <input type="checkbox" className="mt-1 mr-2" checked={!off.has(`${s.key}|${it.id}`)} onChange={() => toggleItem(`${s.key}|${it.id}`)} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13 }}><b>{it.title}</b> <span style={{ color: "#555" }}>{it.at}{it.author ? `, ${it.author}` : ""}</span> <span style={{ fontSize: 11, color: "#888" }}>[{it.origin}]</span></div>
                          <div style={{ fontSize: 13, overflowWrap: "anywhere" }} dangerouslySetInnerHTML={{ __html: it.html }} />
                        </div>
                      </div>
                    )) : null}
                  </div>
                ) : null}
              </div>
            ))}
            {sections.every((s) => s.count === 0) ? <div className="alert alert-info">{t("No clinical record was found for this admission")}</div> : null}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
