/**
 * Getting a print out of the builder in other ways:
 *   BatchDialog          many records → one PDF (the published version)
 *   LegacyCompareDialog  old API vs this template on N records, word for word
 *   OverlayDialog        put the old print under the canvas to match its layout
 */
import React, { useState } from "react";
import { toast } from "react-toastify";
import * as api from "../../../networkServices/printBuilderApi";
import makeApiRequest from "../../../networkServices/axiosInstance";
import { NumberInput, Row, Segmented, Select, TextArea, TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { Modal } from "./Dialogs";
import { absoluteUrl, fetchPdf, pdfImage, pdfText, wordDiff, words } from "./pdfTools";

const parseList = (text) =>
  String(text || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    });

/* ================================================================= batch */

export function BatchDialog({ code, def, sampleParams, onClose }) {
  const [mode, setMode] = useState(def?.sampleLookup?.proc ? "search" : "list");
  const [search, setSearch] = useState("");
  const [list, setList] = useState(() => JSON.stringify(sampleParams || {}));
  const [dup, setDup] = useState(false);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = parseList(list);
  const bad = rows.filter((r) => !r).length;
  const run = async () => {
    if (!api.printTemplateBatch) return;
    setBusy(true);
    const r = await api.printTemplateBatch(code, mode === "list" ? rows.filter(Boolean) : [], { batchSearch: mode === "search" ? search : undefined, duplicate: dup });
    setBusy(false);
    setRes(r);
    if (r?.success && r.data?.pdfUrl) window.open(absoluteUrl(r.data.pdfUrl), "_blank");
    else if (!r?.success) toast.error(r?.message || "Batch print failed");
  };
  return (
    <Modal
      title={`Batch print · ${code}`}
      icon="stack"
      wide
      onClose={onClose}
      footer={
        <>
          <span className="pbx-preview-stat">Prints the published version: every record one after another, each with its own page numbers, in one PDF (300 max).</span>
          <Tap tone="primary" disabled={busy || !api.printTemplateBatch || (mode === "list" ? !rows.length || bad > 0 : false)} onClick={run}>
            <Icon name="printer" size={13} /> {busy ? "Printing…" : "Print all"}
          </Tap>
        </>
      }
    >
      {!api.printTemplateBatch && <p className="pbx-note is-warn">Batch print needs the updated API.</p>}
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "search", label: "Records found by a search" },
          { value: "list", label: "A list of parameters" },
        ]}
      />
      {mode === "search" ? (
        def?.sampleLookup?.proc ? (
          <Row label="Search" wide hint="Uses the datasource's 'Find a record' procedure: every record it returns prints (e.g. today's date, a GRN list number)">
            <TextInput value={search} onChange={setSearch} placeholder="e.g. 2026-10-14 or a ward name" />
          </Row>
        ) : (
          <p className="pbx-note is-warn">This datasource has no "Find a record" procedure. Set one up in the datasource, or use a list.</p>
        )
      ) : (
        <Row label="Parameters" wide hint="One JSON object per line">
          <TextArea mono rows={8} value={list} onChange={setList} />
        </Row>
      )}
      {mode === "list" && (
        <p className={`pbx-hint${bad ? " is-error" : ""}`}>
          {rows.length} record{rows.length === 1 ? "" : "s"}
          {bad ? ` · ${bad} line(s) are not valid JSON` : ""}
        </p>
      )}
      <Toggle value={dup} onChange={setDup} label="Print as duplicate" />
      {res?.success && (
        <div className="pbx-subinfo is-ok">
          <Icon name="check" size={13} /> {res.data.count} printed{res.data.failed?.length ? ` · ${res.data.failed.length} skipped` : ""}
          <a href={absoluteUrl(res.data.pdfUrl)} target="_blank" rel="noreferrer" className="pbx-sublink">
            Open PDF ↗
          </a>
        </div>
      )}
      {res?.data?.failed?.length > 0 && (
        <ul className="pbx-issues">
          {res.data.failed.map((f) => (
            <li key={f.index} className="pbx-issue is-error">
              <Icon name="alert" size={13} /> Record {f.index + 1}: {f.message}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/* ======================================================== legacy compare */

const fill = (tpl, p) => {
  const s = JSON.stringify(tpl).replace(/"\{\{(\w+)\}\}"/g, (_, k) => JSON.stringify(p[k] ?? "")).replace(/\{\{(\w+)\}\}/g, (_, k) => String(p[k] ?? ""));
  return JSON.parse(s);
};

export function LegacyCompareDialog({ template, datasourceCode, sampleParams, def, onClose }) {
  const [endpoint, setEndpoint] = useState("CommonReciept_PDF/CommonReceiptPdf");
  const [payload, setPayload] = useState(() => JSON.stringify({ Type: "OPD", TransactionID: "{{transactionId}}", Duplicate: "0" }, null, 1));
  const [list, setList] = useState(() => JSON.stringify(sampleParams || {}));
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const loadFromSearch = async () => {
    const r = await api.pbSampleLookup({ datasourceCode, search });
    if (!r?.success) return toast.error(r?.message || "Search failed");
    const names = (def?.params || []).map((p) => p.name);
    const sets = (r.data.rows || []).map((row) => Object.fromEntries(names.map((n) => [n, row[Object.keys(row).find((c) => c.toLowerCase() === n.toLowerCase())] ?? ""])));
    setList(sets.map((s) => JSON.stringify(s)).join("\n"));
    return undefined;
  };
  const run = async () => {
    let tplPayload;
    try {
      tplPayload = JSON.parse(payload);
    } catch {
      toast.error("The old API payload must be JSON");
      return;
    }
    const sets = parseList(list).filter(Boolean).slice(0, 25);
    setBusy(true);
    const out = [];
    for (const p of sets) {
      const row = { params: p };
      try {
        const [oldRes, newRes] = await Promise.all([
          makeApiRequest(endpoint, { method: "post", data: fill(tplPayload, p), meta: { silent: true }, silentError: true }),
          api.pbPreviewPdf({ template: JSON.stringify(template), datasourceCode, params: p }),
        ]);
        const oldUrl = oldRes?.data?.pdfUrl || oldRes?.data?.PdfUrl;
        const newUrl = newRes?.data?.pdfUrl;
        if (!oldUrl) throw new Error(`Old API: ${oldRes?.message || "no pdfUrl"}`);
        if (!newUrl) throw new Error(`Template: ${newRes?.message || "no pdfUrl"}`);
        const [a, b] = await Promise.all([fetchPdf(oldUrl).then(pdfText), fetchPdf(newUrl).then(pdfText)]);
        row.oldPages = a.length;
        row.newPages = b.length;
        row.diff = wordDiff(words(a.join(" ")), words(b.join(" ")));
        row.oldUrl = oldUrl;
        row.newUrl = newUrl;
      } catch (e) {
        row.error = e.message;
      }
      out.push(row);
      setRows([...out]);
    }
    setBusy(false);
  };
  const same = rows.filter((r) => r.diff?.same).length;
  return (
    <Modal
      title="Compare with the old print"
      icon="compare"
      full
      onClose={onClose}
      footer={
        <>
          <span className="pbx-preview-stat">
            {rows.length ? (
              <>
                <b className="is-ok">{same}</b> of {rows.length} identical word for word
              </>
            ) : (
              "Prints each record with the old API and with this draft, then compares every word."
            )}
          </span>
          <Tap tone="primary" disabled={busy} onClick={run}>
            <Icon name="compare" size={13} /> {busy ? `Comparing ${rows.length + 1}…` : "Run comparison"}
          </Tap>
        </>
      }
    >
      <div className="pbx-cmp">
        <aside className="pbx-cmp-setup">
          <Row label="Old API" wide hint="Relative to api/v1, answering { data: { pdfUrl } }">
            <TextInput mono value={endpoint} onChange={setEndpoint} />
          </Row>
          <Row label="Old payload" wide hint="{{param}} takes each record's value">
            <TextArea mono rows={5} value={payload} onChange={setPayload} />
          </Row>
          {def?.sampleLookup?.proc && (
            <Row label="Records from" wide hint="Fill the list with the records a search finds">
              <span className="pbx-inline is-fill">
                <TextInput value={search} onChange={setSearch} placeholder="search…" />
                <Tap tone="map" className="is-small" onClick={loadFromSearch}>
                  Find
                </Tap>
              </span>
            </Row>
          )}
          <Row label="Records" wide hint="One JSON object of parameters per line (25 max)">
            <TextArea mono rows={8} value={list} onChange={setList} />
          </Row>
        </aside>
        <section className="pbx-cmp-results">
          {!rows.length && (
            <div className="pbx-emptylist">
              <Icon name="compare" size={26} />
              <p>Migration sign-off in one click: every record is printed both ways and every word compared.</p>
            </div>
          )}
          {rows.map((r, i) => (
            <div key={i} className={`pbx-cmp-row ${r.error ? "is-error" : r.diff?.same ? "is-same" : "is-diff"}`}>
              <div className="pbx-cmp-head" onClick={() => setOpen(open === i ? null : i)}>
                <span className="pbx-cmp-badge">{r.error ? "Error" : r.diff?.same ? "Identical" : `${r.diff.missing.length + r.diff.extra.length} differences`}</span>
                <code>{JSON.stringify(r.params)}</code>
                {r.oldPages != null && (
                  <span className="pbx-muted">
                    pages {r.oldPages} → {r.newPages}
                  </span>
                )}
                {r.oldUrl && (
                  <span className="pbx-inline">
                    <a href={absoluteUrl(r.oldUrl)} target="_blank" rel="noreferrer">
                      old ↗
                    </a>
                    <a href={absoluteUrl(r.newUrl)} target="_blank" rel="noreferrer">
                      new ↗
                    </a>
                  </span>
                )}
              </div>
              {r.error && <div className="pbx-cmp-body">{r.error}</div>}
              {open === i && r.diff && !r.diff.same && (
                <div className="pbx-cmp-body">
                  <div>
                    <b className="is-miss">Only in the old print:</b> {r.diff.missing.slice(0, 80).map((w, k) => <mark key={k} className="is-miss">{w}</mark>)}
                  </div>
                  <div>
                    <b className="is-extra">Only in the template:</b> {r.diff.extra.slice(0, 80).map((w, k) => <mark key={k} className="is-extra">{w}</mark>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </Modal>
  );
}

/* =============================================================== overlay */

/**
 * Put the old print under the canvas: an image, or a page of a PDF (uploaded,
 * or printed by the old API with the sample record). Stored as an image asset;
 * the template keeps only designOverlay (never printed).
 */
export function OverlayDialog({ overlay, onUpload, onChange, sampleParams, onClose }) {
  const ov = overlay || {};
  const [busy, setBusy] = useState(false);
  const [endpoint, setEndpoint] = useState("CommonReciept_PDF/CommonReceiptPdf");
  const [payload, setPayload] = useState(() => JSON.stringify({ Type: "OPD", TransactionID: sampleParams?.transactionId ?? "", Duplicate: "0" }));
  const [pageNo, setPageNo] = useState(1);
  const useBytes = async (bytes, name) => {
    const img = await pdfImage(bytes, pageNo, 2);
    const blob = await (await fetch(img.dataUrl)).blob();
    const key = await onUpload(new File([blob], `${name}-p${pageNo}.png`, { type: "image/png" }), "overlay");
    if (key) onChange({ ...ov, assetKey: key, visible: true, opacity: ov.opacity ?? 0.35 });
  };
  const fromFile = async (file) => {
    setBusy(true);
    try {
      if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) await useBytes(new Uint8Array(await file.arrayBuffer()), "old-print");
      else {
        const key = await onUpload(file, "overlay");
        if (key) onChange({ ...ov, assetKey: key, visible: true, opacity: ov.opacity ?? 0.35 });
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const fromApi = async () => {
    let body;
    try {
      body = JSON.parse(payload);
    } catch {
      toast.error("Payload must be JSON");
      return;
    }
    setBusy(true);
    try {
      const r = await makeApiRequest(endpoint, { method: "post", data: body, meta: { silent: true }, silentError: true });
      const url = r?.data?.pdfUrl || r?.data?.PdfUrl;
      if (!url) throw new Error(r?.message || "The old API returned no pdfUrl");
      await useBytes(await fetchPdf(url), "old-api");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Overlay the old print" icon="overlay" wide onClose={onClose} footer={<Tap tone="primary" onClick={onClose}>Done</Tap>}>
      <p className="pbx-note">The old print shows faded under the page while you match the layout. It is never printed.</p>
      <div className="pbx-grid2">
        <section className="pbx-acc-card tone-sky">
          <h4>
            <Icon name="upload" size={14} /> From a file
          </h4>
          <label className="pbx-upload">
            <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) fromFile(f); }} />
            <span className="pbx-tap tone-add">{busy ? "Loading…" : "Choose PDF or image"}</span>
          </label>
          <Row label="PDF page">
            <NumberInput value={pageNo} onChange={(v) => setPageNo(v || 1)} step={1} min={1} />
          </Row>
        </section>
        <section className="pbx-acc-card tone-amber">
          <h4>
            <Icon name="refresh" size={14} /> From the old API
          </h4>
          <TextInput mono value={endpoint} onChange={setEndpoint} />
          <TextArea mono rows={3} value={payload} onChange={setPayload} />
          <Tap tone="map" className="is-small" disabled={busy} onClick={fromApi}>
            Print it and use it
          </Tap>
        </section>
      </div>
      {ov.assetKey && (
        <div className="pbx-overlayctl">
          <Row label="Show">
            <Toggle value={ov.visible !== false} onChange={(v) => onChange({ ...ov, visible: v })} />
          </Row>
          <Row label="Opacity">
            <input type="range" min={0.05} max={0.9} step={0.05} value={ov.opacity ?? 0.35} onChange={(e) => onChange({ ...ov, opacity: Number(e.target.value) })} />
          </Row>
          <Row label="Blend">
            <Select value={ov.blend || "multiply"} onChange={(v) => onChange({ ...ov, blend: v })} options={[{ value: "multiply", label: "Under (multiply)" }, { value: "difference", label: "Difference (mismatches glow)" }, { value: "normal", label: "Normal" }]} />
          </Row>
          <div className="pbx-grid4">
            {[["dx", "Shift →"], ["dy", "Shift ↓"], ["scale", "Scale"]].map(([k, lbl]) => (
              <label key={k} className="pbx-mini">
                <span>{lbl}</span>
                <NumberInput value={ov[k] ?? (k === "scale" ? 1 : 0)} onChange={(v) => onChange({ ...ov, [k]: v })} step={k === "scale" ? 0.01 : 0.5} />
              </label>
            ))}
          </div>
          <Tap tone="danger" className="is-small" onClick={() => onChange(null)}>
            Remove overlay
          </Tap>
        </div>
      )}
    </Modal>
  );
}

