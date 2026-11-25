import React from "react";
import { useTranslation } from "react-i18next";
import { SECTIONS, drugLabel } from "./boardDiscussion";

/* =============================================================================
   Tumor Board — the discussion sheet, read-only, on one page.

   Used by the EMR's "Board Discussion" button and by the window's View. Takes a
   normalised sheet (see boardDiscussion.js) and shows every section that has
   something in it, the drug lines grouped Pre / Post, and Print.
   ============================================================================= */

const C = {
  ink: "#12313a", sub: "#64757d", line: "#d9e4e8", soft: "#f5f9fa",
  blue: "#1667a8", head: "#1d6fa5", white: "#fff",
};

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

function BoardDiscussionView({ sheet, patient, hospitalName }) {
  const [t] = useTranslation();
  if (!sheet) return null;

  const patientID = patient?.PatientID || patient?.MRNo || sheet.patientID || "";
  const pre = (sheet.drugs || []).filter((d) => d.phase !== "Post");
  const post = (sheet.drugs || []).filter((d) => d.phase === "Post");

  const handlePrint = () => {
    const esc = (v) =>
      asText(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
    const block = (title, pairs) => {
      const body = pairs
        .filter(([, v]) => asText(v).trim())
        .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
        .join("");
      return body ? `<h2>${esc(title)}</h2><table class="kv">${body}</table>` : "";
    };
    const drugs = (list, title) =>
      list.length
        ? `<h2>${esc(title)}</h2><ul>${list.map((d) => `<li>${esc(drugLabel(d))}</li>`).join("")}</ul>`
        : "";

    const demo = [
      ["Patient", patient?.Pname || patient?.PatientName],
      ["UHID", patientID],
      ["Age / Sex", [patient?.Age, patient?.Gender || patient?.Sex].filter(Boolean).join(" / ")],
      ["Referred by", sheet.referredBy],
      ["Flagged on", sheet.referralDate],
      ["Recorded by", sheet.entryByName],
      ["Recorded on", sheet.entryDate],
      ["Next board", sheet.nextMeetingDate],
    ]
      .filter(([, v]) => asText(v).trim())
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
      .join("");

    const html =
      `<!DOCTYPE html><html><head><title>Tumor Board Discussion</title><style>` +
      `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `@page{size:A4;margin:12mm;}` +
      `body{font:11.5px/1.4 Arial,Helvetica,sans-serif;color:#12313a;}` +
      `h1{font-size:15px;text-align:center;}` +
      `.hosp{text-align:center;font-size:12.5px;font-weight:700;margin-bottom:2px;}` +
      `.demo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px 12px;border:1px solid #d9e4e8;` +
      `border-radius:5px;padding:7px 9px;margin:9px 0 12px;}` +
      `.demo div{font-size:10.5px;}.demo span{color:#64757d;display:inline-block;min-width:70px;}` +
      `h2{font-size:12px;margin:11px 0 4px;padding-bottom:3px;border-bottom:1px solid #d9e4e8;}` +
      `table{width:100%;border-collapse:collapse;}` +
      `.kv th{width:30%;text-align:left;font-weight:600;color:#64757d;padding:3px 6px 3px 0;vertical-align:top;}` +
      `.kv td{padding:3px 0;vertical-align:top;white-space:pre-wrap;}` +
      `ul{margin:2px 0 0 18px;}` +
      `.sign{margin-top:30px;display:flex;justify-content:space-between;font-size:10.5px;color:#64757d;}` +
      `</style></head><body>` +
      (hospitalName ? `<div class="hosp">${esc(hospitalName)}</div>` : "") +
      `<h1>Tumor Board Discussion</h1>` +
      `<div class="demo">${demo}</div>` +
      SECTIONS.map((s) => block(s.title, s.fields.map(([k, label]) => [label, sheet[k]]))).join("") +
      drugs(pre, "Pre-chemo drugs (neo-adjuvant)") +
      drugs(post, "Post-chemo drugs (adjuvant)") +
      `<div class="sign"><span>Printed: ${esc(new Date().toLocaleString())}</span>` +
      `<span>Tumor Board Coordinator</span><span>Chairperson</span></div>` +
      `</body></html>`;

    // Hidden iframe, not window.open: not blocked by popup blockers.
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (_) {
            /* already removed */
          }
        }, 500);
      }
    }, 200);
  };

  const Drugs = ({ list, title }) =>
    list.length ? (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 3 }}>{t(title)}</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.ink }}>
          {list.map((d, i) => (
            <li key={i}>{drugLabel(d)}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div style={{ background: C.soft, padding: 12 }}>
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          gap: 12, marginBottom: 10, flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
          <b style={{ color: C.ink, fontSize: 13 }}>{asText(patient?.Pname || patient?.PatientName)}</b>
          {patientID ? ` · ${patientID}` : ""}
          <br />
          {sheet.referredBy ? `${t("Referred by")} ${sheet.referredBy}` : ""}
          {sheet.referralDate ? ` · ${sheet.referralDate}` : ""}
          {sheet.entryByName ? ` · ${t("Recorded by")} ${sheet.entryByName}` : ""}
          {sheet.entryDate ? ` (${sheet.entryDate})` : ""}
          {sheet.nextMeetingDate ? (
            <>
              <br />
              <b>{t("Next Tumor Board")}:</b> {sheet.nextMeetingDate}
            </>
          ) : null}
        </div>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handlePrint}>
          <i className="fa fa-print mr-1" /> {t("Print")}
        </button>
      </div>

      {SECTIONS.map((s) => {
        const filled = s.fields.filter(([k]) => asText(sheet[k]).trim());
        const isChemo = s.key === "ch";
        if (!filled.length && !(isChemo && (pre.length || post.length))) return null;
        return (
          <div
            key={s.key}
            style={{
              border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 10,
              overflow: "hidden", background: C.white,
            }}
          >
            <div
              style={{
                background: C.head, color: C.white, padding: "5px 12px",
                fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3,
              }}
            >
              {t(s.title)}
            </div>
            <div style={{ padding: 12 }}>
              {filled.map(([k, label]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 2 }}>
                    {t(label)}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.ink, whiteSpace: "pre-wrap" }}>{sheet[k]}</div>
                </div>
              ))}
              {isChemo && (
                <>
                  <Drugs list={pre} title="Pre-chemo drugs (neo-adjuvant)" />
                  <Drugs list={post} title="Post-chemo drugs (adjuvant)" />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BoardDiscussionView;
