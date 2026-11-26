/**
 * Managing a template beyond its layout:
 *   AccessDialog     who may edit and who may print it (per template)
 *   VariantsDialog   centre-wise and panel / TPA variants (another template prints instead)
 *   WhereUsedDialog  which receipt types, screens, variants and sub-reports use it
 */
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as api from "../../../networkServices/printBuilderApi";
import { NumberInput, Row, Select, TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { useTemplateList } from "./AdvancedEditors";
import { Modal } from "./Dialogs";

const when = (s) => String(s || "").replace("T", " ").slice(0, 16);
const missing = (name) => !api[name];
function NotReady({ what }) {
  return <p className="pbx-note is-warn">{what} needs the updated API (restart HospediaAPI after this release).</p>;
}

/* ================================================================ access */

function IdPicker({ label, value, onChange, load, hint }) {
  const [opts, setOpts] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => load(q).then((r) => live && r?.success && setOpts(r.data || [])), 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, load]);
  const name = (id) => opts.find((o) => String(o.id) === String(id))?.name || id;
  return (
    <div className="pbx-idpick">
      <div className="pbx-col-sub" title={hint}>
        {label}
      </div>
      <div className="pbx-idchips">
        {value.map((id) => (
          <span key={id} className="pbx-idchip">
            {name(id)}
            <Tap className="is-icon" onClick={() => onChange(value.filter((x) => x !== id))} title="Remove">
              ✕
            </Tap>
          </span>
        ))}
        {!value.length && <span className="pbx-muted">Anyone (no limit)</span>}
      </div>
      <div className="pbx-inline is-fill">
        <TextInput value={q} onChange={setQ} placeholder="Search…" />
        <Select
          value=""
          onChange={(v) => v && !value.includes(v) && onChange([...value, v])}
          options={opts.filter((o) => !value.includes(String(o.id))).map((o) => ({ value: String(o.id), label: o.name }))}
          placeholder="Add…"
        />
      </div>
    </div>
  );
}

export function AccessDialog({ code, onClose }) {
  const [acc, setAcc] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (missing("pbTemplateAccess")) return;
    api.pbTemplateAccess(code).then((r) => setAcc(r?.success ? { editorRoleIds: [], editorEmployeeIds: [], printRoleIds: [], ...r.data } : { error: r?.message }));
  }, [code]);
  const roles = useMemo(() => (q) => api.pbRoles().then((r) => (r?.success ? { success: true, data: (r.data || []).filter((x) => !q || String(x.name).toLowerCase().includes(q.toLowerCase())) } : r)), []);
  const emps = useMemo(() => (q) => api.pbEmployees(q), []);
  const ids = (k) => (acc?.[k] || []).map(String);
  const set = (k, v) => setAcc({ ...acc, [k]: v });
  return (
    <Modal
      title={`Access · ${code}`}
      icon="users"
      wide
      onClose={onClose}
      footer={
        <Tap
          tone="primary"
          disabled={busy || !acc || acc.error || acc.canEdit === false}
          onClick={async () => {
            setBusy(true);
            const r = await api.pbSaveTemplateAccess({ code, editorRoleIds: ids("editorRoleIds"), editorEmployeeIds: ids("editorEmployeeIds"), printRoleIds: ids("printRoleIds") });
            setBusy(false);
            if (r?.success) {
              toast.success("Access saved");
              onClose();
            } else toast.error(r?.message || "Could not save");
          }}
        >
          <Icon name="check" size={13} /> Save access
        </Tap>
      }
    >
      {missing("pbTemplateAccess") && <NotReady what="Per-template access" />}
      {!acc && !missing("pbTemplateAccess") && <p className="pbx-note">Loading…</p>}
      {acc?.error && <p className="pbx-note is-warn">{acc.error}</p>}
      {acc && !acc.error && (
        <>
          <div className="pbx-acc-banner">
            <Icon name="shield" size={18} />
            <span>
              Owner <b>{acc.owner || "—"}</b> can always edit. {acc.canEdit === false ? "You can view these settings but not change them." : "Empty lists mean no extra limit (the builder's editor roles still apply)."}
            </span>
          </div>
          <div className="pbx-acc-grid">
            <section className="pbx-acc-card tone-violet">
              <h4>
                <Icon name="brush" size={14} /> May edit &amp; publish
              </h4>
              <IdPicker label="Roles" value={ids("editorRoleIds")} onChange={(v) => set("editorRoleIds", v)} load={roles} />
              <IdPicker label="People" value={ids("editorEmployeeIds")} onChange={(v) => set("editorEmployeeIds", v)} load={emps} />
            </section>
            <section className="pbx-acc-card tone-teal">
              <h4>
                <Icon name="printer" size={14} /> May print
              </h4>
              <IdPicker label="Roles" value={ids("printRoleIds")} onChange={(v) => set("printRoleIds", v)} load={roles} hint="Only these roles can print this template. Empty = everyone who can open the screen." />
            </section>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================== variants */

export function VariantsDialog({ code, params, onClose }) {
  const templates = useTemplateList();
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null);
  const [test, setTest] = useState({ centreId: "", params: "{}" });
  const [testRes, setTestRes] = useState(null);
  const load = () => api.pbVariants?.(code).then((r) => setRows(r?.success ? r.data || [] : []));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  const opts = templates.filter((t) => t.code !== code).map((t) => ({ value: t.code, label: `${t.name} (${t.code})${t.publishedVersionNo ? "" : " — not published"}` }));
  const save = async () => {
    const r = await api.pbSaveVariant({ ...edit, templateCode: code, centreId: edit.centreId === "" || edit.centreId == null ? null : Number(edit.centreId) });
    if (r?.success) {
      setEdit(null);
      load();
      toast.success("Variant saved");
    } else toast.error(r?.message || "Could not save");
  };
  return (
    <Modal title={`Variants · ${code}`} icon="pin" wide onClose={onClose}>
      {missing("pbVariants") ? (
        <NotReady what="Variants" />
      ) : (
        <>
          <p className="pbx-note">
            One template code for every screen; a centre or an insurance panel can print its own layout instead. The most specific match wins (centre + panel, then panel, then centre), then the higher priority. No match → <b>{code}</b> prints.
          </p>
          <table className="pbx-vtable pbx-varianttable">
            <thead>
              <tr>
                <th>Prints instead</th>
                <th>Centre</th>
                <th>When parameter</th>
                <th>Priority</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((v) => (
                <tr key={v.id} className={v.isActive ? "" : "is-off"}>
                  <td>
                    <b>{v.variantCode}</b>
                  </td>
                  <td>{v.centreId ?? <span className="pbx-muted">any</span>}</td>
                  <td>{v.matchParam ? <code>{`${v.matchParam} = ${v.matchValue}`}</code> : <span className="pbx-muted">—</span>}</td>
                  <td>{v.priority}</td>
                  <td className="pbx-vnote">{v.note}</td>
                  <td className="pbx-vact">
                    <Tap tone="list" className="is-small" onClick={() => setEdit({ ...v })}>
                      Edit
                    </Tap>
                    <Tap
                      tone="danger"
                      className="is-small"
                      onClick={async () => {
                        const r = await api.pbDeleteVariant(v.id);
                        if (r?.success) load();
                        else toast.error(r?.message);
                      }}
                    >
                      <Icon name="trash" size={11} />
                    </Tap>
                  </td>
                </tr>
              ))}
              {rows && !rows.length && (
                <tr>
                  <td colSpan={6} className="pbx-muted">
                    No variants: {code} prints everywhere.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {edit ? (
            <div className="pbx-variantform">
              <Row label="Print template" wide>
                <Select value={edit.variantCode || ""} onChange={(v) => setEdit({ ...edit, variantCode: v })} options={opts} placeholder="Choose…" />
              </Row>
              <div className="pbx-grid2">
                <Row label="Centre ID" hint="Blank = any centre">
                  <TextInput value={edit.centreId ?? ""} onChange={(v) => setEdit({ ...edit, centreId: v.replace(/\D/g, "") })} placeholder="any" />
                </Row>
                <Row label="Priority">
                  <NumberInput value={edit.priority ?? 0} onChange={(v) => setEdit({ ...edit, priority: v ?? 0 })} step={1} />
                </Row>
                <Row label="Parameter" hint="e.g. PanelID — the print request's parameter to match (panel / TPA)">
                  <Select value={edit.matchParam || ""} onChange={(v) => setEdit({ ...edit, matchParam: v || null })} options={params} placeholder="(none)" />
                </Row>
                <Row label="Equals" hint="One value or several separated by commas">
                  <TextInput value={edit.matchValue || ""} onChange={(v) => setEdit({ ...edit, matchValue: v })} placeholder="12, 15" />
                </Row>
              </div>
              <Row label="Note" wide>
                <TextInput value={edit.note || ""} onChange={(v) => setEdit({ ...edit, note: v })} placeholder="Star Health TPA layout" />
              </Row>
              <Row label="Active">
                <Toggle value={edit.isActive !== false} onChange={(v) => setEdit({ ...edit, isActive: v })} />
              </Row>
              <span className="pbx-inline">
                <Tap tone="primary" className="is-small" disabled={!edit.variantCode || (!edit.centreId && !edit.matchParam)} onClick={save}>
                  Save variant
                </Tap>
                <Tap tone="list" className="is-small" onClick={() => setEdit(null)}>
                  Cancel
                </Tap>
              </span>
            </div>
          ) : (
            <Tap tone="add" onClick={() => setEdit({ priority: 0, isActive: true })}>
              <Icon name="plus" size={13} /> Add variant
            </Tap>
          )}
          <div className="pbx-varianttest">
            <div className="pbx-col-sub">Test: which template prints?</div>
            <span className="pbx-inline is-fill">
              <TextInput value={test.centreId} onChange={(v) => setTest({ ...test, centreId: v })} placeholder="Centre ID" />
              <TextInput mono value={test.params} onChange={(v) => setTest({ ...test, params: v })} placeholder='{"PanelID": 12}' />
              <Tap
                tone="map"
                className="is-small"
                onClick={async () => {
                  let p = {};
                  try {
                    p = JSON.parse(test.params || "{}");
                  } catch {
                    toast.error("Parameters must be JSON");
                    return;
                  }
                  const r = await api.pbResolveVariant(code, test.centreId, p);
                  setTestRes(r?.success ? r.data : { error: r?.message });
                }}
              >
                Resolve
              </Tap>
            </span>
            {testRes && (
              <div className={`pbx-subinfo${testRes.error ? "" : " is-ok"}`}>
                {testRes.error || (
                  <>
                    <b>{testRes.templateCode}</b> prints{testRes.matched ? ` (matched on ${testRes.matched})` : " (no variant matched)"}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================ where used */

export function WhereUsedDialog({ code, onClose }) {
  const [res, setRes] = useState(null);
  useEffect(() => {
    if (missing("pbWhereUsed")) return;
    api.pbWhereUsed(code).then((r) => setRes(r?.success ? r.data : { error: r?.message }));
  }, [code]);
  const group = (title, icon, tone, items, render, empty) => (
    <section className={`pbx-wu-card ${tone}`}>
      <h4>
        <Icon name={icon} size={14} /> {title}
        <span className="pbx-count">{items?.length || 0}</span>
      </h4>
      {items?.length ? <ul>{items.map(render)}</ul> : <p className="pbx-muted">{empty}</p>}
    </section>
  );
  return (
    <Modal title={`Where ${code} is used`} icon="link" wide onClose={onClose}>
      {missing("pbWhereUsed") && <NotReady what="Where-used" />}
      {!res && !missing("pbWhereUsed") && <p className="pbx-note">Looking…</p>}
      {res?.error && <p className="pbx-note is-warn">{res.error}</p>}
      {res && !res.error && (
        <div className="pbx-wu">
          {group("Screens that printed it (90 days)", "pulse", "tone-sky", res.sources, (s) => (
            <li key={s.source}>
              <code>{s.source || "(unknown screen)"}</code>
              <span className="pbx-muted">
                {s.prints} prints · last {when(s.lastOn)}
              </span>
            </li>
          ), "No prints logged yet.")}
          {group("Old print calls it answers", "refresh", "tone-amber", res.receiptTypes, (t) => (
            <li key={t}>
              <code>CommonReceiptPdf type {t}</code>
            </li>
          ), "Not mapped to an old receipt type.")}
          {group("Its variants", "pin", "tone-teal", res.variants, (v, i) => (
            <li key={i}>
              <b>{v.variantCode}</b>
              <span className="pbx-muted">{[v.centreId ? `centre ${v.centreId}` : "", v.matchParam ? `${v.matchParam} = ${v.matchValue}` : ""].filter(Boolean).join(" · ")}</span>
            </li>
          ), "No variants.")}
          {group("Variant of", "pin", "tone-teal", res.variantOf, (c) => (
            <li key={c}>
              <b>{c}</b>
            </li>
          ), "Not a variant.")}
          {group("Printed inside (sub-report)", "subreport", "tone-violet", res.subreportIn, (c) => (
            <li key={c}>
              <b>{c}</b>
            </li>
          ), "Not used as a sub-report.")}
        </div>
      )}
    </Modal>
  );
}
