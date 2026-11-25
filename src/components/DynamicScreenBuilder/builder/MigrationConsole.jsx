/**
 * Migration console — turn the hand-written pages under src/pages into screen
 * documents this builder can edit.
 *
 * Everything shown here is READ out of the old page's source by the local
 * migration service (tools/screen-migrator): its columns, its filters and their
 * width classes, its endpoints and their verbs. Nothing is invented, and the
 * gate in the service re-checks the result against the page before this panel
 * calls it a pass — so the score next to a page is a statement about parity,
 * not a guess at quality.
 *
 * Converting does not touch the original .jsx. It produces a document; opening
 * it puts it on the canvas, and it is saved only if you save it.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../registry/icons";
import { downloadJson } from "../utils/storage";
import {
  START_COMMAND,
  convertBatch,
  convertPage,
  getBaseUrl,
  health,
  listPages,
  setBaseUrl,
} from "../utils/migrator";
import "../styles/migration.css";

const VERDICT = {
  pass: { icon: "CheckCircle2", label: "Parity check passed" },
  review: { icon: "AlertTriangle", label: "Needs review" },
  fail: { icon: "AlertCircle", label: "Failed the parity check" },
  error: { icon: "AlertCircle", label: "Could not be converted" },
};

const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;

/** One line in a check's detail list, kept short enough to scan. */
function Detail({ icon, label, value, tone }) {
  return (
    <div className={`dsb-mig-detail ${tone || ""}`}>
      <Icon name={icon} size={12} />
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function MigrationConsole({ onClose, onOpen }) {
  const [status, setStatus] = useState({ state: "checking", info: null, error: "" });
  const [q, setQ] = useState("");
  const [module, setModule] = useState("");
  const [routing, setRouting] = useState("");
  const [data, setData] = useState({ rows: [], modules: [], total: 0, matched: 0 });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [batch, setBatch] = useState(null);
  const abortRef = useRef(null);

  /* ------------------------------------------------------------- service */
  const check = useCallback(async () => {
    setStatus({ state: "checking", info: null, error: "" });
    try {
      const info = await health();
      setStatus({ state: "ok", info, error: "" });
      return true;
    } catch (e) {
      setStatus({ state: "offline", info: null, error: e.message });
      return false;
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  /* --------------------------------------------------------------- list */
  const load = useCallback(
    async (refresh = false) => {
      if (status.state !== "ok") return;
      // A keystroke while the previous search is still running would otherwise
      // land out of order and show the results of a query nobody typed.
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await listPages({ q, module, routing, refresh }, ctrl.signal);
        setData(res);
      } catch (e) {
        if (e?.name !== "AbortError") toast.error(e.message);
      } finally {
        if (abortRef.current === ctrl) setLoading(false);
      }
    },
    [q, module, routing, status.state],
  );

  useEffect(() => {
    const t = setTimeout(() => load(false), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  /* ------------------------------------------------------------ convert */
  const open = useCallback(async (row) => {
    setFile(row.file);
    setResult(null);
    setBusy(true);
    try {
      setResult(await convertPage(row.file));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  const runBatch = useCallback(async () => {
    const files = [...picked];
    if (!files.length) return;
    setBusy(true);
    setBatch(null);
    try {
      const res = await convertBatch(files);
      setBatch(res);
      const passed = res.results.filter((r) => r.verdict === "pass").length;
      toast.info(`${passed}/${res.count} pages passed the parity check`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }, [picked]);

  const toggle = (f) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const rows = data.rows || [];
  const counts = useMemo(() => {
    const draft = rows.filter((r) => r.routing === "draft").length;
    return { draft, wrapper: rows.length - draft };
  }, [rows]);

  /* -------------------------------------------------------------- render */
  return (
    <div className="dsb-modal-root" onClick={onClose}>
      <div className="dsb-mig" onClick={(e) => e.stopPropagation()}>
        <header className="dsb-mig-head">
          <span className="dsb-mig-title">
            <Icon name="Sparkles" size={15} />
            <b>Migrate existing screens</b>
          </span>

          <div className="dsb-mig-search">
            <Icon name="Search" size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages…" />
          </div>

          <select value={module} onChange={(e) => setModule(e.target.value)} title="Module">
            <option value="">All modules</option>
            {(data.modules || []).map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.count})
              </option>
            ))}
          </select>

          <select value={routing} onChange={(e) => setRouting(e.target.value)} title="What the analyser recommends">
            <option value="">Any confidence</option>
            <option value="draft">Convertible (draft)</option>
            <option value="wrapper">Needs a wrapper</option>
          </select>

          <button type="button" className="dsbi-mini" onClick={() => load(true)} disabled={status.state !== "ok"}>
            <Icon name="RefreshCw" size={12} /> Re-scan
          </button>
          <button type="button" className="dsb-icon-btn" onClick={onClose} title="Close">
            <Icon name="X" size={16} />
          </button>
        </header>

        {status.state !== "ok" ? (
          <div className={`dsb-mig-offline ${status.state === "checking" ? "is-checking" : ""}`}>
            <Icon name={status.state === "checking" ? "Loader" : "AlertTriangle"} size={14} />
            {status.state === "checking" ? (
              <span>Looking for the migration service…</span>
            ) : (
              <div>
                <strong>{status.error}</strong>
                <p>
                  It reads <code>src/pages</code> and parses the old screens — the browser cannot do either. Run it in a
                  terminal at the repo root:
                </p>
                <code className="dsb-mig-cmd">{START_COMMAND}</code>
                <div className="dsb-mig-offline-actions">
                  <input
                    defaultValue={getBaseUrl()}
                    onBlur={(e) => setBaseUrl(e.target.value)}
                    title="Where the service is listening"
                  />
                  <button type="button" className="dsbi-mini" onClick={check}>
                    <Icon name="RefreshCw" size={12} /> Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="dsb-mig-body">
          <div className="dsb-mig-list">
            <div className="dsb-mig-listhead">
              <span>
                {loading ? "scanning…" : `${data.matched} of ${data.total} pages`}
                {counts.draft ? ` · ${counts.draft} convertible` : ""}
              </span>
              {picked.size ? (
                <button type="button" className="dsbi-mini" onClick={() => setPicked(new Set())}>
                  clear {picked.size}
                </button>
              ) : null}
            </div>

            <div className="dsb-mig-rows">
              {rows.map((r) => (
                <div
                  key={r.file}
                  className={`dsb-mig-row ${file === r.file ? "is-on" : ""}`}
                  onClick={() => open(r)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") open(r);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={picked.has(r.file)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggle(r.file)}
                    title="Include in a batch check"
                  />
                  <div className="dsb-mig-rowmain">
                    <strong>{r.name}</strong>
                    <span>{r.file.replace("src/pages/", "")}</span>
                  </div>
                  <div className="dsb-mig-chips">
                    <em title="Filter controls">
                      <Icon name="ListChecks" size={10} /> {r.controls}
                    </em>
                    <em title="Grid columns read from the page">
                      <Icon name="Columns3" size={10} /> {r.columns}
                    </em>
                    <em title="API calls">
                      <Icon name="Database" size={10} /> {r.apiResolved}/{r.api}
                    </em>
                    <em className={`r-${r.routing}`} title={r.routing === "draft" ? "Enough was read to convert it" : "Too little was read — wrap the old page instead"}>
                      {r.routing}
                    </em>
                  </div>
                </div>
              ))}
              {!rows.length && status.state === "ok" && !loading ? (
                <div className="dsb-mig-empty">No pages match that filter.</div>
              ) : null}
            </div>

            <div className="dsb-mig-batchbar">
              <button type="button" className="dsb-btn-primary" disabled={!picked.size || busy} onClick={runBatch}>
                <Icon name="ListChecks" size={13} /> Check {picked.size || ""} selected
              </button>
              {batch ? (
                <span className="dsb-mig-batchsum">
                  {batch.results.filter((x) => x.verdict === "pass").length} pass ·{" "}
                  {batch.results.filter((x) => x.verdict === "review").length} review ·{" "}
                  {batch.results.filter((x) => x.verdict === "fail" || x.verdict === "error").length} fail
                </span>
              ) : null}
            </div>
          </div>

          <div className="dsb-mig-detailpane">
            {busy && !result ? (
              <div className="dsb-mig-empty">
                <Icon name="Loader" size={14} /> Reading {file.replace("src/pages/", "")}…
              </div>
            ) : null}

            {!file && !busy ? (
              <div className="dsb-mig-empty">
                <Icon name="MousePointerClick" size={16} />
                <p>Pick a page to convert it and see how closely the result matches it.</p>
                <p className="dsb-mig-note">
                  Columns, filter widths, endpoints and verbs are copied from the source — the parity check below compares
                  the converted screen back against the original page.
                </p>
              </div>
            ) : null}

            {result ? <Report result={result} onOpen={onOpen} /> : null}

            {batch ? (
              <div className="dsb-mig-batch">
                <h4>
                  <Icon name="ListChecks" size={13} /> Batch check
                </h4>
                {batch.results.map((r) => (
                  <div key={r.file} className={`dsb-mig-batchrow v-${r.verdict}`}>
                    <Icon name={(VERDICT[r.verdict] || VERDICT.error).icon} size={12} />
                    <span>{r.file.replace("src/pages/", "")}</span>
                    <b>{r.error ? r.error : pct(r.score)}</b>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The parity report for one converted page. */
function Report({ result, onOpen }) {
  const { screen, score, summary, file } = result;
  const v = VERDICT[score.verdict] || VERDICT.error;
  const c = score.checks;
  const mig = screen.migration || {};

  return (
    <div className="dsb-mig-report">
      <div className={`dsb-mig-verdict v-${score.verdict}`}>
        <Icon name={v.icon} size={16} />
        <div>
          <strong>
            {v.label} — {pct(score.score)}
          </strong>
          <span>{file.replace("src/pages/", "")}</span>
        </div>
        <div className="dsb-mig-verdict-actions">
          <button type="button" className="dsb-btn-primary" onClick={() => onOpen(screen)}>
            <Icon name="FolderOpen" size={13} /> Open in builder
          </button>
          <button
            type="button"
            className="dsbi-mini"
            onClick={() => downloadJson(`${screen.name}.screen.json`, screen)}
            title="Download the screen document"
          >
            <Icon name="Download" size={12} />
          </button>
        </div>
      </div>

      {score.hardFails?.length ? (
        <div className="dsb-mig-hard">
          {score.hardFails.map((h) => (
            <div key={h}>
              <Icon name="AlertCircle" size={12} /> {h}
            </div>
          ))}
        </div>
      ) : null}

      <div className="dsb-mig-checks">
        <section>
          <h5>
            <Icon name="Columns3" size={12} /> Columns
          </h5>
          {c.columns?.applicable ? (
            <>
              <Detail
                icon={c.columns.ok ? "CheckCircle2" : "AlertCircle"}
                label="matched, in order, by key and header"
                value={`${c.columns.got}/${c.columns.expected}`}
                tone={c.columns.ok ? "ok" : "bad"}
              />
              {(c.columns.problems || []).map((p) => (
                <div key={p} className="dsb-mig-problem">
                  {p}
                </div>
              ))}
              <p className="dsb-mig-note">
                Read from {mig.columnSource === "component" ? "the page's table component" : mig.columnSource}
                {mig.columnConfidence != null ? ` · ${pct(mig.columnConfidence)} confidence` : ""}
                {mig.columnsNeedReview ? " · flagged for review" : ""}
              </p>
            </>
          ) : (
            <p className="dsb-mig-note">
              No column list could be read from this page. Pick the endpoint on the grid and press Sync in the builder to
              fill them from a real response.
            </p>
          )}
        </section>

        <section>
          <h5>
            <Icon name="Database" size={12} /> Endpoints
          </h5>
          {c.endpoints?.applicable ? (
            <>
              <Detail
                icon={c.endpoints.ok ? "CheckCircle2" : "AlertCircle"}
                label="of the page's calls are on the screen"
                value={`${c.endpoints.found}/${c.endpoints.expected}`}
                tone={c.endpoints.ok ? "ok" : "bad"}
              />
              {(c.endpoints.missing || []).map((m) => (
                <div key={m.endpoint} className="dsb-mig-problem">
                  missing {m.method} {m.endpoint}
                  {m.write ? " (a write)" : ""}
                </div>
              ))}
              {(c.endpoints.wrongMethod || []).map((m) => (
                <div key={m.endpoint} className="dsb-mig-problem">
                  {m.endpoint}: expected {m.expected}, got {m.got}
                </div>
              ))}
            </>
          ) : (
            <p className="dsb-mig-note">This page calls nothing.</p>
          )}
        </section>

        <section>
          <h5>
            <Icon name="ListChecks" size={12} /> Filters
          </h5>
          {c.controls?.applicable ? (
            <>
              <Detail
                icon={c.controls.ok ? "CheckCircle2" : "AlertTriangle"}
                label="controls carried over with the same field"
                value={`${c.controls.matched}/${c.controls.expected}`}
                tone={c.controls.ok ? "ok" : "warn"}
              />
              {(c.controls.lostRespclass || []).map((l) => (
                <div key={l.field} className="dsb-mig-problem">
                  {l.field}: width class lost ({l.expected})
                </div>
              ))}
              {(c.controls.missing || []).map((m) => (
                <div key={m.field} className="dsb-mig-problem">
                  missing {m.type} “{m.field}”
                </div>
              ))}
              {mig.selectsWithoutOptions?.length ? (
                <p className="dsb-mig-note">
                  Dropdown options are built in page code and cannot be read statically — point these at an endpoint in the
                  Data tab: {mig.selectsWithoutOptions.join(", ")}.
                </p>
              ) : null}
            </>
          ) : (
            <p className="dsb-mig-note">This page has no filter controls.</p>
          )}
        </section>

        <section>
          <h5>
            <Icon name="MousePointerClick" size={12} /> Buttons
          </h5>
          {c.actions?.applicable ? (
            <>
              <Detail
                icon={c.actions.ok ? "CheckCircle2" : "AlertTriangle"}
                label="buttons wired to an action"
                value={`${c.actions.wired}/${c.actions.expected}`}
                tone={c.actions.ok ? "ok" : "warn"}
              />
              {mig.unwiredButtons?.length ? (
                <p className="dsb-mig-note">
                  Left unwired on purpose — their handler could not be traced to an endpoint, and a button that looks wired
                  but does nothing is worse than an empty one: {mig.unwiredButtons.join(", ")}.
                </p>
              ) : null}
            </>
          ) : (
            <p className="dsb-mig-note">This page has no buttons.</p>
          )}
        </section>
      </div>

      <div className="dsb-mig-foot">
        <span>
          <Icon name="Layers" size={11} /> {summary.lines} lines → {Object.keys(screen.dataSources || {}).length} data
          sources
        </span>
        {(mig.notes || []).map((n) => (
          <span key={n} className="dsb-mig-note">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
