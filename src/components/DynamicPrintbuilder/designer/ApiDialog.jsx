/**
 * "How this prints": the API call that prints this template, its payload built
 * from the datasource's parameters (filled with the sample values), the old
 * print routes it also answers, and a small live preview of what comes out.
 *
 * PrintBuilder/GeneratePdf prints the PUBLISHED version, so the preview shows
 * that version when the draft has moved on (with a switch to see the draft).
 */
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { APIBaseURL } from "../../../networkServices/axiosInstance";
import { apiUrls } from "../../../networkServices/apiEndpoints";
import { pbSaveDatasource, pbVersion, printTemplate } from "../../../networkServices/printBuilderApi";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { previewHtml } from "../engine/runtime";
import { normalizeTemplate } from "../model/defaults";
import { Segmented, Select, TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { Modal } from "./Dialogs";

/**
 * Old print actions the API re-serves with a published template — mirrors
 * HospediaAPI PrintBuilder/Services/LegacyPrints.cs (keep the two in step).
 * `payload` turns the builder's sample params into that action's request.
 */
const LEGACY_ROUTES = {
  GRN: [
    {
      route: "PrintBuilder/GetDirectGRNReport",
      replaces: "GRN/GetDirectGRNReport",
      payload: (p) => ({ grnNumber: pick(p, "grnNumber") ?? "" }),
    },
  ],
  OPD_BILL_NEW: [
    {
      route: "PrintBuilder/CommonReceiptPdf",
      replaces: "CommonReciept_PDF/CommonReceiptPdf",
      payload: (p) => ({ type: "OPD", ...p }),
    },
  ],
  PHY: [
    {
      route: "PrintBuilder/CommonReceiptPdf",
      replaces: "CommonReciept_PDF/CommonReceiptPdf",
      payload: (p) => ({ type: "PHY", ...p }),
    },
  ],
};

const RESPONSE = `{
  "success": true,
  "message": "…",
  "data": { "pdfUrl": "CommonReciept_PDF/RenderPdf?cacheKey=…" }
}`;

const THUMB_SCALE = 0.38;
const TYPES = ["int", "decimal", "string", "date", "bool"];

export default function ApiDialog({ meta, datasource, sampleParams, duplicate, template, sample, onDatasourceSaved, onPublish, onClose }) {
  const savedDefs = useMemo(() => paramDefs(datasource), [datasource]);
  // the parameter editor: rows carry the name they had (_from) so a rename can follow into the procedure args
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [needsPublish, setNeedsPublish] = useState(false);
  const defs = edit ? edit.filter((p) => p.name) : savedDefs;
  const params = useMemo(
    () => (edit ? typedParams(Object.fromEntries(edit.filter((p) => p.name).map((p) => [p.name, p._val])), defs, false) : typedParams(sampleParams, defs)),
    [edit, sampleParams, defs],
  );
  const payload = useMemo(() => ({ templateCode: meta.code, params, duplicate: !!duplicate }), [meta.code, params, duplicate]);
  const legacy = LEGACY_ROUTES[String(meta.code || "").toUpperCase()] || [];
  const published = !!meta.publishedVersionNo;
  const [tab, setTab] = useState("json");
  const [busy, setBusy] = useState(false);

  // what the API prints: the published version; the draft only when nothing is published
  const [which, setWhich] = useState(published && meta.status === "modified" ? "published" : "draft");
  const [publishedTpl, setPublishedTpl] = useState(null);
  useEffect(() => {
    if (which !== "published" || publishedTpl || !published) return;
    let live = true;
    pbVersion(meta.code, meta.publishedVersionNo).then((r) => {
      if (live && r?.success) setPublishedTpl(normalizeTemplate(JSON.parse(r.data.template)));
    });
    return () => {
      live = false;
    };
  }, [which, publishedTpl, published, meta.code, meta.publishedVersionNo]);
  const shown = which === "published" ? publishedTpl : template;

  const data = useMemo(() => {
    const base = sample ? JSON.parse(JSON.stringify(sample)) : {};
    base.sys = { ...(base.sys || {}), duplicate };
    return base;
  }, [sample, duplicate]);
  const html = useMemo(() => (shown ? previewHtml(shown, data) : ""), [shown, data]);

  const url = joinUrl(APIBaseURL, apiUrls.PrintBuilderGeneratePdf);
  const json = JSON.stringify(payload, null, 2);
  const js = `import { printTemplate } from "@app/networkServices/printBuilderApi";
import { RedirectURL } from "@app/networkServices/PDFURL";

const res = await printTemplate("${meta.code}", ${JSON.stringify(params, null, 2)}${duplicate ? ", true" : ""});
if (res?.success) RedirectURL(res.data.pdfUrl);
else notify(res?.message, "error");`;
  const curl = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '${JSON.stringify(payload)}'`;
  const snippet = tab === "js" ? js : tab === "curl" ? curl : json;

  const startEdit = () =>
    setEdit(savedDefs.map((p) => ({ name: p.name, label: p.label || "", type: p.type || "string", required: !!p.required, sample: p.sample, _from: p.name, _val: sampleParams?.[p.name] ?? p.sample ?? "" })));
  const setRow = (i, patch) => setEdit((rows) => rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  // template fields that still read a key being removed or renamed
  const orphanBindings = useMemo(() => {
    if (!edit) return [];
    const kept = new Set(edit.filter((r) => r.name).map((r) => r._from === r.name && r._from));
    const gone = savedDefs.map((p) => p.name).filter((n) => !kept.has(n));
    const text = JSON.stringify(template || {});
    return gone.filter((n) => new RegExp(`params\\.${n.replace(/[^A-Za-z0-9_]/g, "")}\\b`, "i").test(text));
  }, [edit, savedDefs, template]);

  // what the edit does to the payload: added, renamed and removed keys
  const keyChanges = useMemo(() => {
    if (!edit) return [];
    const rows = edit.filter((r) => r.name);
    const out = [];
    for (const r of rows) {
      if (!r._from) out.push({ kind: "add", text: `+ ${r.name}` });
      else if (r._from !== r.name) out.push({ kind: "ren", text: `${r._from} → ${r.name}` });
    }
    for (const p of savedDefs) if (!rows.some((r) => r._from === p.name)) out.push({ kind: "del", text: `− ${p.name}` });
    return out;
  }, [edit, savedDefs]);

  const saveParams = async () => {
    const rows = edit.filter((r) => r.name.trim());
    const lower = rows.map((r) => r.name.toLowerCase());
    if (new Set(lower).size !== lower.length) return toast.error("Two parameters have the same name");
    let def;
    try {
      def = JSON.parse(datasource.definitionJson || "{}");
    } catch {
      def = {};
    }
    // a renamed key keeps feeding the procedure arguments it fed before
    const renamed = Object.fromEntries(rows.filter((r) => r._from && r._from !== r.name).map((r) => [r._from.toLowerCase(), r.name]));
    const follow = (args = []) => args.map((a) => ((a.source || "request") === "request" && renamed[(a.key || "").toLowerCase()] ? { ...a, key: renamed[a.key.toLowerCase()] } : a));
    def.queries = (def.queries || []).map((q) => ({ ...q, args: follow(q.args) }));
    if (def.api) def.api = { ...def.api, args: follow(def.api.args) };
    def.params = rows.map((r) => ({ name: r.name, label: r.label || r.name, type: r.type, required: r.required, sample: String(r._val ?? "") }));
    // a removed key must not leave a procedure argument without its value
    const declared = new Set(lower);
    const dangling = [...def.queries.flatMap((q) => (q.args || []).map((a) => [q.proc, a])), ...(def.api?.args || []).map((a) => [def.api.route, a])].filter(
      ([, a]) => (a.source || "request") === "request" && a.key && !declared.has(a.key.toLowerCase()),
    );
    if (dangling.length) return toast.error(`Still needed by ${dangling.map(([w, a]) => `${w} → ${a.param} (${a.key})`).join(", ")}. Map that argument to something else in the datasource first.`);
    setSaving(true);
    const samples = Object.fromEntries(rows.map((r) => [r.name, String(r._val ?? "")]));
    const r = await pbSaveDatasource({ code: datasource.dsCode, name: datasource.name, kind: datasource.kind, definition: JSON.stringify(def), sampleParams: JSON.stringify(samples) });
    setSaving(false);
    if (!r?.success) return toast.error(r?.message || "Save failed");
    await onDatasourceSaved?.(samples);
    setEdit(null);
    setNeedsPublish(true);
    toast.success("Parameters saved — publish so the API takes the new payload");
  };

  const testPrint = async () => {
    setBusy(true);
    try {
      const r = await printTemplate(meta.code, params, duplicate);
      if (r?.success) RedirectURL(r.data.pdfUrl);
      else toast.error(r?.message || "The print failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`API · ${meta.code}`}
      icon="code"
      wide
      onClose={onClose}
      footer={
        <>
          <span className="pbx-preview-stat">
            {published ? (
              <>
                <Icon name="check" size={14} /> Prints published v{meta.publishedVersionNo}
                {meta.status === "modified" && <em className="is-warn"> · draft changes print only after Publish</em>}
              </>
            ) : (
              <em className="is-warn">Not published — the API answers success=false until you publish</em>
            )}
          </span>
          <Tap tone="primary" disabled={!published || busy} onClick={testPrint} title="Call GeneratePdf with this payload and open the PDF">
            <Icon name="pdf" size={13} /> {busy ? "Printing…" : "Test print"}
          </Tap>
        </>
      }
    >
      <div className="pbx-api">
        <div className="pbx-api-main">
          <h4 className="pbx-api-h">Endpoint</h4>
          <div className="pbx-api-url">
            <span className="pbx-api-method">POST</span>
            <code title={url}>{url}</code>
            <CopyTap text={url} what="URL" />
          </div>

          <div className="pbx-api-bar">
            <h4 className="pbx-api-h">Request</h4>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: "json", label: "JSON" },
                { value: "js", label: "React" },
                { value: "curl", label: "cURL" },
              ]}
            />
            <CopyTap text={snippet} what={tab === "json" ? "Payload" : "Snippet"} />
          </div>
          <pre className="pbx-api-code">{snippet}</pre>

          <div className="pbx-api-bar">
            <h4 className="pbx-api-h">Payload keys (params) {datasource ? <small>datasource {datasource.dsCode}</small> : null}</h4>
            {datasource && !edit && (
              <Tap tone="list" className="is-small" onClick={startEdit} title="Add, rename or remove the keys this API takes">
                <Icon name="field" size={12} /> Edit keys
              </Tap>
            )}
          </div>
          {needsPublish && !edit && (
            <div className="pbx-api-publish">
              <Icon name="alert" size={14} />
              <span>Saved. GeneratePdf keeps the old keys until you publish a new version.</span>
              <Tap tone="primary" className="is-small" onClick={onPublish}>
                <Icon name="rocket" size={12} /> Publish
              </Tap>
            </div>
          )}
          {edit ? (
            <>
              <table className="pbx-api-params is-edit">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Type</th>
                    <th title="Required">Req.</th>
                    <th>Sample</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {edit.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <TextInput mono value={r.name} onChange={(v) => setRow(i, { name: v.replace(/[^A-Za-z0-9_]/g, "") })} placeholder="key" />
                        {r._from && r._from !== r.name && r.name && <small>was {r._from}</small>}
                      </td>
                      <td>
                        <Select value={r.type} onChange={(v) => setRow(i, { type: v })} options={TYPES} />
                      </td>
                      <td>
                        <Toggle value={r.required} onChange={(v) => setRow(i, { required: v })} />
                      </td>
                      <td>
                        <TextInput value={r._val} onChange={(v) => setRow(i, { _val: v })} placeholder="sample" />
                      </td>
                      <td>
                        <Tap className="is-icon" tone="danger" onClick={() => setEdit((rows) => rows.filter((_, k) => k !== i))} title="Remove this key">
                          <Icon name="trash" size={12} />
                        </Tap>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orphanBindings.length > 0 && (
                <p className="pbx-api-tip is-warn">
                  The layout still reads {orphanBindings.map((n) => `params.${n}`).join(", ")} — those fields print empty until you rebind them.
                </p>
              )}
              <div className="pbx-api-editbar">
                <Tap tone="add" className="is-small" onClick={() => setEdit((rows) => [...rows, { name: "", label: "", type: "string", required: false, _from: null, _val: "" }])}>
                  ＋ Key
                </Tap>
                <span className="pbx-top-fill" />
                <Tap tone="list" className="is-small" onClick={() => setEdit(null)} disabled={saving}>
                  Cancel
                </Tap>
                <Tap tone="primary" className="is-small" onClick={saveParams} disabled={saving}>
                  <Icon name="save" size={12} /> {saving ? "Saving…" : "Save keys"}
                </Tap>
              </div>
              <p className="pbx-api-tip">
                A renamed key keeps feeding the same procedure argument. A key a procedure argument still needs cannot be removed here — remap it in the datasource.
              </p>
            </>
          ) : defs.length ? (
            <table className="pbx-api-params">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Sample</th>
                </tr>
              </thead>
              <tbody>
                {defs.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <code>{p.name}</code>
                      {p.required && <span className="pbx-api-req" title="Required">*</span>}
                      {p.label && <small>{p.label}</small>}
                    </td>
                    <td>{p.type || "string"}</td>
                    <td>
                      <code>{String(params[p.name] ?? "")}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="pbx-note">{datasource ? "The datasource takes no parameters." : "No datasource is linked to this template."}</p>
          )}
          <p className="pbx-api-tip">
            <code>duplicate</code> may also travel inside <code>params</code> (<code>{'{ "Duplicate": "1" }'}</code>) as CommonReceiptPdf payloads carry it.
          </p>

          {(edit || needsPublish) && (
            <>
              <div className="pbx-api-bar">
                <h4 className="pbx-api-h">
                  Final payload <small>{edit ? "with the keys above — not saved yet" : "what GeneratePdf takes once you publish"}</small>
                </h4>
                <CopyTap text={json} what="Final payload" />
              </div>
              {edit && keyChanges.length > 0 && (
                <div className="pbx-api-changes">
                  {keyChanges.map((c) => (
                    <span key={c.text} className={`pbx-api-change is-${c.kind}`}>
                      {c.text}
                    </span>
                  ))}
                </div>
              )}
              <pre className="pbx-api-code is-final">{json}</pre>
            </>
          )}

          {legacy.length > 0 && (
            <>
              <h4 className="pbx-api-h">Also prints through</h4>
              {legacy.map((l) => {
                const lUrl = joinUrl(APIBaseURL, l.route);
                const lJson = JSON.stringify(l.payload(params), null, 2);
                return (
                  <div key={l.route} className="pbx-api-legacy">
                    <div className="pbx-api-url">
                      <span className="pbx-api-method">POST</span>
                      <code title={lUrl}>{lUrl}</code>
                      <CopyTap text={lUrl} what="URL" />
                    </div>
                    <small className="pbx-muted">
                      Drop-in for <code>{l.replaces}</code>: same request, same answer. Its keys are fixed by that old request model — editing keys above does not change them.
                    </small>
                    <div className="pbx-api-legacy-code">
                      <pre className="pbx-api-code">{lJson}</pre>
                      <CopyTap text={lJson} what="Payload" />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <h4 className="pbx-api-h">Response</h4>
          <pre className="pbx-api-code">{RESPONSE}</pre>
        </div>

        <aside className="pbx-api-side">
          <div className="pbx-api-bar">
            <h4 className="pbx-api-h">Preview</h4>
            {published && (
              <Segmented
                value={which}
                onChange={setWhich}
                options={[
                  { value: "published", label: `v${meta.publishedVersionNo}`, title: "The published version — what the API prints" },
                  { value: "draft", label: "Draft", title: "The draft you are editing" },
                ]}
              />
            )}
          </div>
          <div className="pbx-api-thumb">
            {html ? (
              <iframe
                title="Print preview"
                srcDoc={html}
                sandbox="allow-scripts allow-same-origin"
                tabIndex={-1}
                style={{ width: `${100 / THUMB_SCALE}%`, height: `${100 / THUMB_SCALE}%`, transform: `scale(${THUMB_SCALE})` }}
              />
            ) : (
              <span className="pbx-muted">Loading…</span>
            )}
          </div>
          {!sample && <small className="pbx-api-tip is-warn">No sample data — fetch a sample in Data to see values.</small>}
        </aside>
      </div>
    </Modal>
  );
}

function CopyTap({ text, what }) {
  return (
    <Tap
      className="is-icon is-small"
      tone="list"
      title={`Copy ${what}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success(`${what} copied`);
        } catch {
          toast.error("The browser blocked the clipboard");
        }
      }}
    >
      <Icon name="copy" size={13} />
    </Tap>
  );
}

/** The datasource's declared request parameters. */
function paramDefs(ds) {
  try {
    return (JSON.parse(ds?.definitionJson || "{}").params || []).filter((p) => p && p.name);
  } catch {
    return [];
  }
}

/** Sample params as the API wants them: numbers for int/decimal params, declared ones first, then (extras) the rest. */
function typedParams(sp, defs, extras = true) {
  const out = {};
  for (const p of defs) {
    const v = sp?.[p.name];
    const num = (p.type === "int" || p.type === "decimal") && v !== "" && v != null && !Number.isNaN(Number(v));
    out[p.name] = num ? Number(v) : v ?? "";
  }
  if (extras) for (const [k, v] of Object.entries(sp || {})) if (!(k in out)) out[k] = v;
  return out;
}

function pick(obj, key) {
  const k = Object.keys(obj || {}).find((x) => x.toLowerCase() === key.toLowerCase());
  return k ? obj[k] : undefined;
}

function joinUrl(base, path) {
  return `${String(base || "").replace(/\/+$/, "")}/${String(path || "").replace(/^\/+/, "")}`;
}
