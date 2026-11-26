/**
 * Create / edit a datasource: the request parameters a print takes, and what
 * runs — stored procedures (each result set named) or an existing endpoint of
 * this API. "Test" runs the unsaved definition with the sample values.
 *
 * Procedure arguments are mapped by the procedure's own parameter names (read
 * from information_schema, so vTransactionID-style names need no guessing);
 * each takes its value from a request parameter, a fixed value, or the
 * logged-in user / centre.
 */
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { pbFetchSample, pbProcedureParams, pbProcedures, pbSampleLookup, pbSaveDatasource } from "../../../networkServices/printBuilderApi";
import { NumberInput, Row, Segmented, Select, TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { Modal } from "./Dialogs";
import { ExprInput } from "./ExprInput";

const SOURCES = [
  { value: "request", label: "Request param" },
  { value: "static", label: "Fixed value" },
  { value: "user", label: "Logged-in user" },
  { value: "centre", label: "User's centre" },
];
const USER_KEYS = ["EmployeeID", "EmployeeName", "CentreID", "RoleID", "BookingCentreID", "DepartmentID", "OrganizationID", "Hospital_ID", "UserName"];
const TYPES = ["int", "decimal", "string", "date", "bool"];

const emptyDef = () => ({ params: [], queries: [{ proc: "", args: [], resultSets: [""] }], receiptHeaderType: "OPD" });

export default function DatasourceDialog({ datasource, onSaved, onClose }) {
  const isNew = !datasource;
  const [code, setCode] = useState(datasource?.dsCode || "");
  const [name, setName] = useState(datasource?.name || "");
  const [kind, setKind] = useState(datasource?.kind || "sp");
  const [def, setDef] = useState(() => {
    try {
      return { ...emptyDef(), ...JSON.parse(datasource?.definitionJson || "{}") };
    } catch {
      return emptyDef();
    }
  });
  const [samples, setSamples] = useState(() => {
    try {
      return JSON.parse(datasource?.sampleParamsJson || "{}") || {};
    } catch {
      return {};
    }
  });
  const [procs, setProcs] = useState([]);
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pbProcedures("").then((r) => r?.success && setProcs(r.data || []));
  }, []);

  const setParam = (i, patch) => setDef((d) => ({ ...d, params: d.params.map((p, k) => (k === i ? { ...p, ...patch } : p)) }));
  const setQuery = (i, patch) => setDef((d) => ({ ...d, queries: d.queries.map((q, k) => (k === i ? { ...q, ...patch } : q)) }));
  const paramNames = def.params.map((p) => p.name).filter(Boolean);

  const loadArgs = async (i) => {
    const q = def.queries[i];
    if (!q.proc) return;
    const r = await pbProcedureParams(q.proc);
    if (!r?.success) {
      toast.error(r?.message || "Procedure not found");
      return;
    }
    const list = (r.data || []).filter((p) => p.mode === "IN");
    const args = list.map((p) => {
      const have = q.args.find((a) => a.param.toLowerCase() === p.name.toLowerCase());
      if (have) return have;
      const guess = p.name.replace(/^[vp]_?(?=[A-Z])/, "");
      const key = guess.charAt(0).toLowerCase() + guess.slice(1);
      return { param: p.name, source: "request", key, _type: p.type };
    });
    // declare request params the procedure needs that are not declared yet
    const add = args
      .filter((a) => a.source === "request" && a.key && !def.params.some((p) => p.name.toLowerCase() === a.key.toLowerCase()))
      .map((a) => ({ name: a.key, label: a.key, type: /int/.test(a._type || "") ? "int" : /dec|double|float/.test(a._type || "") ? "decimal" : /date/.test(a._type || "") ? "date" : "string", required: true, sample: "" }));
    setDef((d) => ({ ...d, params: [...d.params, ...add], queries: d.queries.map((qq, k) => (k === i ? { ...qq, args: args.map(({ _type, ...a }) => a) } : qq)) }));
  };

  const definition = useMemo(() => {
    const clean = { ...def, params: def.params.filter((p) => p.name) };
    if (kind === "api") {
      clean.queries = [];
      clean.api = { method: "POST", route: "", args: [], resultSets: [{ name: "data", path: "data" }], ...(def.api || {}) };
    } else {
      delete clean.api;
      clean.queries = def.queries.filter((q) => q.proc).map((q) => ({ ...q, resultSets: (q.resultSets || []).map((s) => s.trim()).filter(Boolean) }));
    }
    return clean;
  }, [def, kind]);

  const runTest = async () => {
    setBusy(true);
    setTest(null);
    const r = await pbFetchSample({ definition: JSON.stringify(definition), params: samples, receiptHeaderType: def.receiptHeaderType, saveSchema: false });
    setBusy(false);
    if (!r?.success) {
      setTest({ error: r?.message || "Failed" });
      return;
    }
    const data = JSON.parse(r.data.dataJson);
    setTest({ sets: Object.entries(r.data.schema.sets).map(([k, f]) => ({ name: k, rows: Array.isArray(data[k]) ? data[k].length : 0, fields: f.length })), ms: r.data.ms });
  };

  const save = async () => {
    if (!code || !name) {
      toast.error("Code and name are required");
      return;
    }
    setBusy(true);
    const r = await pbSaveDatasource({ code, name, kind, definition: JSON.stringify(definition), sampleParams: JSON.stringify(samples) });
    setBusy(false);
    if (!r?.success) {
      toast.error(r?.message || "Save failed");
      return;
    }
    toast.success("Datasource saved");
    onSaved(r.data);
  };

  // result set names the calculated fields can extend
  const setNames = [...new Set([...(def.queries || []).flatMap((q) => q.resultSets || []), ...((def.api && def.api.resultSets) || []).map((r) => r.name)].filter(Boolean))];
  const api = def.api || { method: "POST", route: "", args: [], resultSets: [{ name: "data", path: "data" }] };
  const setApi = (patch) => setDef((d) => ({ ...d, api: { ...api, ...patch } }));

  // "Find a record": a procedure that searches real records for the builder's sample data
  const lookup = def.sampleLookup || null;
  const setLookup = (patch) => setDef((d) => ({ ...d, sampleLookup: patch === null ? undefined : { proc: "", args: [], limit: 25, ...(d.sampleLookup || {}), ...patch } }));
  const [lookupTest, setLookupTest] = useState(null);
  const [lookupText, setLookupText] = useState("");
  const loadLookupArgs = async () => {
    if (!lookup?.proc) return;
    const r = await pbProcedureParams(lookup.proc);
    if (!r?.success) {
      toast.error(r?.message || "Procedure not found");
      return;
    }
    // every IN parameter takes the search text unless it was mapped already
    const args = (r.data || [])
      .filter((p) => p.mode === "IN")
      .map((p) => lookup.args?.find((a) => a.param.toLowerCase() === p.name.toLowerCase()) || { param: p.name, source: "request", key: "search" });
    setLookup({ args });
  };
  const testLookup = async () => {
    setLookupTest(null);
    const r = await pbSampleLookup({ definition: JSON.stringify(definition), search: lookupText });
    if (!r?.success) {
      setLookupTest({ error: r?.message || "Failed" });
      return;
    }
    const cols = r.data.columns || [];
    const matched = cols.filter((c) => paramNames.some((p) => p.toLowerCase() === c.toLowerCase()));
    setLookupTest({ rows: (r.data.rows || []).length, cols: cols.length, matched });
  };

  const argEditor = (args, onArgs, keys = paramNames) => (
    <table className="pbx-argtable">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Value from</th>
          <th>Which</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {args.map((a, k) => {
          const upd = (patch) => onArgs(args.map((x, j) => (j === k ? { ...x, ...patch } : x)));
          return (
            <tr key={k}>
              <td>
                <TextInput mono value={a.param} onChange={(v) => upd({ param: v })} />
              </td>
              <td>
                <Select value={a.source || "request"} onChange={(v) => upd({ source: v })} options={SOURCES} />
              </td>
              <td>
                {a.source === "static" ? (
                  <TextInput value={a.value} onChange={(v) => upd({ value: v })} placeholder="value" />
                ) : a.source === "user" ? (
                  <Select value={a.key || "EmployeeID"} onChange={(v) => upd({ key: v })} options={USER_KEYS} />
                ) : a.source === "centre" ? (
                  <span className="pbx-muted">CentreID</span>
                ) : (
                  <Select value={a.key || ""} onChange={(v) => upd({ key: v })} options={keys} placeholder="param…" />
                )}
              </td>
              <td>
                <Tap className="is-icon" tone="danger" onClick={() => onArgs(args.filter((_, j) => j !== k))} title="Remove">
                  <Icon name="trash" size={12} />
                </Tap>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <Modal
      title={isNew ? "New datasource" : `Datasource · ${datasource.dsCode}`}
      icon="database"
      wide
      onClose={onClose}
      footer={
        <>
          <span className="pbx-preview-stat">
            {test?.error && <em className="is-error">{test.error}</em>}
            {test?.sets && (
              <>
                <Icon name="check" size={13} /> {test.sets.map((s) => `${s.name}: ${s.rows} rows, ${s.fields} fields`).join(" · ")} ({test.ms} ms)
              </>
            )}
          </span>
          <Tap tone="refresh" onClick={runTest} disabled={busy}>
            <Icon name="bolt" size={13} /> Test
          </Tap>
          <Tap tone="primary" onClick={save} disabled={busy}>
            <Icon name="save" size={13} /> Save
          </Tap>
        </>
      }
    >
      <div className="pbx-dsform">
        <div className="pbx-grid2">
          <Row label="Code">
            <TextInput mono value={code} onChange={(v) => setCode(v.toUpperCase().replace(/\s/g, "_"))} placeholder="OPD_BILL" disabled={!isNew} />
          </Row>
          <Row label="Name">
            <TextInput value={name} onChange={setName} placeholder="OPD bill" />
          </Row>
          <Row label="Runs">
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: "sp", label: "Stored procedures" },
                { value: "api", label: "API endpoint" },
              ]}
            />
          </Row>
          <Row label="Letterhead">
            <TextInput value={def.receiptHeaderType} onChange={(v) => setDef({ ...def, receiptHeaderType: v })} placeholder="OPD" />
          </Row>
        </div>

        <h4 className="pbx-dsh">
          Request parameters <small>what GeneratePdf's params carry · sample values are used by Test and the builder</small>
        </h4>
        <table className="pbx-argtable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Label</th>
              <th>Type</th>
              <th>Required</th>
              <th>Sample</th>
              <th title="A dropdown in the designer and the API window: 1:Cash, 2:Card — or proc:sp_name (value, label columns)">Choices</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {def.params.map((p, i) => (
              <tr key={i}>
                <td>
                  <TextInput mono value={p.name} onChange={(v) => setParam(i, { name: v.replace(/\s/g, "") })} />
                </td>
                <td>
                  <TextInput value={p.label} onChange={(v) => setParam(i, { label: v })} />
                </td>
                <td>
                  <Select value={p.type || "string"} onChange={(v) => setParam(i, { type: v })} options={TYPES} />
                </td>
                <td>
                  <Toggle value={!!p.required} onChange={(v) => setParam(i, { required: v })} />
                </td>
                <td>
                  <TextInput value={samples[p.name] ?? p.sample ?? ""} onChange={(v) => setSamples({ ...samples, [p.name]: v })} />
                </td>
                <td>
                  <ChoicesInput p={p} onChange={(patch) => setParam(i, patch)} />
                </td>
                <td>
                  <Tap className="is-icon" tone="danger" onClick={() => setDef({ ...def, params: def.params.filter((_, k) => k !== i) })} title="Remove">
                    <Icon name="trash" size={12} />
                  </Tap>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Tap tone="add" className="is-small" onClick={() => setDef({ ...def, params: [...def.params, { name: "", type: "string", required: false }] })}>
          ＋ Parameter
        </Tap>

        {kind === "sp" ? (
          <>
            <h4 className="pbx-dsh">
              Stored procedures <small>every result set gets a name templates bind to (bill, items, payments…)</small>
            </h4>
            {def.queries.map((q, i) => (
              <div key={i} className="pbx-query">
                <div className="pbx-query-head">
                  <span className="pbx-query-no">{i + 1}</span>
                  <input className="pbx-input is-mono" list="pbx-procs" value={q.proc} placeholder="sp_opd_BillPrintout" onChange={(e) => setQuery(i, { proc: e.target.value })} />
                  <Tap tone="map" className="is-small" onClick={() => loadArgs(i)} disabled={!q.proc}>
                    Read parameters
                  </Tap>
                  <Tap className="is-icon" tone="danger" onClick={() => setDef({ ...def, queries: def.queries.filter((_, k) => k !== i) })} title="Remove">
                    <Icon name="trash" size={12} />
                  </Tap>
                </div>
                {argEditor(q.args || [], (args) => setQuery(i, { args }))}
                <Row label="Result set names" wide hint="In the order the procedure returns them, comma separated">
                  <TextInput value={(q.resultSets || []).join(", ")} onChange={(v) => setQuery(i, { resultSets: v.split(",").map((s) => s.trim()) })} placeholder="bill, items" />
                </Row>
                <Row label="Fail when empty" wide hint="Print nothing and answer Success=false when the first result set has no rows">
                  <Toggle value={!!q.requireRows} onChange={(v) => setQuery(i, { requireRows: v || undefined })} />
                </Row>
                {q.requireRows && (
                  <Row label="Message" wide hint="{param} placeholders take the request's values">
                    <TextInput value={q.emptyMessage} onChange={(v) => setQuery(i, { emptyMessage: v || undefined })} placeholder="No bill found for transaction {transactionId}." />
                  </Row>
                )}
              </div>
            ))}
            <datalist id="pbx-procs">
              {procs.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <Tap tone="add" className="is-small" onClick={() => setDef({ ...def, queries: [...def.queries, { proc: "", args: [], resultSets: [""] }] })}>
              ＋ Procedure
            </Tap>
          </>
        ) : (
          <>
            <h4 className="pbx-dsh">
              API endpoint <small>called on this API with the caller's login; the JSON response is split into result sets by path</small>
            </h4>
            <div className="pbx-grid2">
              <Row label="Method">
                <Select value={api.method} onChange={(v) => setApi({ method: v })} options={["POST", "GET"]} />
              </Row>
              <Row label="Route" hint="Below api/v1/">
                <TextInput mono value={api.route} onChange={(v) => setApi({ route: v })} placeholder="Billing/GetBillDetail" />
              </Row>
            </div>
            {argEditor(api.args || [], (args) => setApi({ args }))}
            <Tap tone="add" className="is-small" onClick={() => setApi({ args: [...(api.args || []), { param: "", source: "request", key: "" }] })}>
              ＋ Field
            </Tap>
            <Row label="Result sets" wide hint="name:path pairs, e.g. bill:data.header, items:data.items">
              <TextInput
                mono
                value={(api.resultSets || []).map((r) => `${r.name}:${r.path}`).join(", ")}
                onChange={(v) =>
                  setApi({
                    resultSets: v
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => {
                        const [n, ...p] = s.split(":");
                        return { name: n.trim(), path: (p.join(":") || "data").trim() };
                      }),
                  })
                }
              />
            </Row>
          </>
        )}

        <h4 className="pbx-dsh">
          Find a record <small>optional · lets the designer search real bills instead of typing sample ids</small>
        </h4>
        {!lookup ? (
          <Tap tone="add" className="is-small" onClick={() => setLookup({})}>
            ＋ Set up record search
          </Tap>
        ) : (
          <div className="pbx-query">
            <div className="pbx-query-head">
              <span className="pbx-query-no">?</span>
              <input className="pbx-input is-mono" list="pbx-procs" value={lookup.proc} placeholder="sp_pb_FindOpdBills" onChange={(e) => setLookup({ proc: e.target.value })} />
              <Tap tone="map" className="is-small" onClick={loadLookupArgs} disabled={!lookup.proc}>
                Read parameters
              </Tap>
              <Tap className="is-icon" tone="danger" onClick={() => setLookup(null)} title="Remove record search">
                <Icon name="trash" size={12} />
              </Tap>
            </div>
            <p className="pbx-hint">
              The procedure gets what the user types as <code>search</code> and returns recent matching records. Its columns named like the parameters above (
              {paramNames.join(", ") || "none yet"}) fill them when a record is picked.
            </p>
            {argEditor(lookup.args || [], (args) => setLookup({ args }), ["search", ...paramNames])}
            <div className="pbx-grid2">
              <Row label="Rows shown">
                <NumberInput value={lookup.limit ?? 25} onChange={(v) => setLookup({ limit: v || 25 })} step={5} min={5} max={100} />
              </Row>
              <Row label="Try">
                <span className="pbx-inline is-fill">
                  <TextInput value={lookupText} onChange={setLookupText} placeholder="search text" />
                  <Tap tone="refresh" className="is-small" onClick={testLookup} disabled={!lookup.proc}>
                    <Icon name="search" size={12} /> Test
                  </Tap>
                </span>
              </Row>
            </div>
            {lookupTest?.error && <p className="pbx-note is-warn">{lookupTest.error}</p>}
            {lookupTest && !lookupTest.error && (
              <p className={`pbx-note${lookupTest.matched.length ? "" : " is-warn"}`}>
                {lookupTest.rows} rows, {lookupTest.cols} columns.{" "}
                {lookupTest.matched.length ? `Fills: ${lookupTest.matched.join(", ")}.` : "No column is named like a parameter, so picking a row fills nothing — alias the columns in the procedure."}
              </p>
            )}
          </div>
        )}

        <h4 className="pbx-dsh">
          Calculated fields <small>defined once here, usable in every template on this datasource (shown with ƒx in the field list)</small>
        </h4>
        <table className="pbx-argtable">
          <thead>
            <tr>
              <th>Row set</th>
              <th>Name</th>
              <th>Expression</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(def.calculated || []).map((c, i) => {
              const setC = (patch) => setDef((d) => ({ ...d, calculated: d.calculated.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));
              return (
                <tr key={i}>
                  <td>
                    <Select value={c.set || ""} onChange={(v) => setC({ set: v })} options={setNames} placeholder="(data root)" />
                  </td>
                  <td>
                    <TextInput mono value={c.name} onChange={(v) => setC({ name: v.replace(/[^\w]/g, "") })} placeholder="NetAfterTax" />
                  </td>
                  <td>
                    <ExprInput value={c.expr} onChange={(v) => setC({ expr: v })} placeholder="Qty * Rate - DiscAmt" />
                  </td>
                  <td>
                    <Tap className="is-icon" tone="danger" onClick={() => setDef((d) => ({ ...d, calculated: d.calculated.filter((_, k) => k !== i) }))} title="Remove">
                      <Icon name="trash" size={12} />
                    </Tap>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Tap tone="add" className="is-small" onClick={() => setDef((d) => ({ ...d, calculated: [...(d.calculated || []), { set: setNames[0] || "", name: "", expr: "" }] }))}>
          ＋ Calculated field
        </Tap>

        <h4 className="pbx-dsh">
          Friendly names <small>what the field list shows instead of the column name (the raw name stays on hover)</small>
        </h4>
        <table className="pbx-argtable">
          <thead>
            <tr>
              <th>Field (set.Field or Field)</th>
              <th>Shown as</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Object.entries(def.aliases || {}).map(([k, v], i) => {
              const put = (nk, nv) =>
                setDef((d) => {
                  const entries = Object.entries(d.aliases || {}).map((e, j) => (j === i ? [nk, nv] : e));
                  return { ...d, aliases: Object.fromEntries(entries) };
                });
              return (
                <tr key={i}>
                  <td>
                    <TextInput mono value={k} onChange={(nk) => put(nk, v)} placeholder="bill.VendorName" />
                  </td>
                  <td>
                    <TextInput value={v} onChange={(nv) => put(k, nv)} placeholder="Supplier name" />
                  </td>
                  <td>
                    <Tap className="is-icon" tone="danger" onClick={() => setDef((d) => ({ ...d, aliases: Object.fromEntries(Object.entries(d.aliases || {}).filter((_, j) => j !== i)) }))} title="Remove">
                      <Icon name="trash" size={12} />
                    </Tap>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Tap tone="add" className="is-small" onClick={() => setDef((d) => ({ ...d, aliases: { ...(d.aliases || {}), [`field${Object.keys(d.aliases || {}).length + 1}`]: "" } }))}>
          ＋ Friendly name
        </Tap>
      </div>
    </Modal>
  );
}

/** "1:Cash, 2:Card" (static choices) or "proc:sp_name" (value, label from a procedure) for a parameter. */
function ChoicesInput({ p, onChange }) {
  const text = p.optionsProc ? `proc:${p.optionsProc}` : (p.options || []).map((o) => (o.label && o.label !== o.value ? `${o.value}:${o.label}` : o.value)).join(", ");
  const [v, setV] = useState(text);
  const commit = () => {
    const s = v.trim();
    if (!s) onChange({ options: undefined, optionsProc: undefined });
    else if (/^proc:/i.test(s)) onChange({ optionsProc: s.slice(5).trim(), options: undefined });
    else
      onChange({
        optionsProc: undefined,
        options: s
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
          .map((x) => {
            const [val, ...lbl] = x.split(":");
            return { value: val.trim(), label: (lbl.join(":") || val).trim() };
          }),
      });
  };
  return <TextInput value={v} onChange={setV} onBlur={commit} placeholder="—" />;
}
