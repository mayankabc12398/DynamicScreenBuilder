/**
 * Step 2 — which database screens are saved into. Profiles live on the backend
 * (ScreenDbProfile API, password encrypted there); this page only keeps the chosen id.
 */
import React, { useEffect, useState } from "react";
import { activeApiBase, getConnection, setConnection } from "./connection";
import { deleteDbProfile, listDbProfiles, saveDbProfile, testDbProfile } from "./dbProfileApi";
import "./sb.css";

const EMPTY = { id: "", name: "", server: "", port: "3306", database: "", userId: "", password: "" };

/** The builder keeps local mirrors and module caches of screens; a new database must not see them. */
function resetBuilderCaches() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("dsb."))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** makeApiRequest returns the API envelope {success, message, data}, or axios's error response. */
const ok = (res) => res?.success === true;

export default function DbConnectionPage() {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [active, setActive] = useState(getConnection().profileId || "");

  const load = async () => {
    const res = await listDbProfiles();
    if (ok(res)) setProfiles(res.data || []);
    else setMsg({ ok: false, text: res?.message || "Could not load profiles from the backend." });
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = async (fn) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const test = () =>
    run(async () => {
      const res = await testDbProfile(form);
      setMsg({ ok: ok(res), text: res?.message || (ok(res) ? "Connected." : "Connection failed.") });
    });

  const save = () =>
    run(async () => {
      const res = await saveDbProfile(form);
      if (!ok(res)) return setMsg({ ok: false, text: res?.message || "Save failed." });
      setMsg({ ok: true, text: res.message || "Saved." });
      setForm(EMPTY);
      await load();
    });

  const remove = (p) =>
    run(async () => {
      if (!window.confirm(`Remove profile "${p.name}"? The database itself is not touched.`)) return;
      const res = await deleteDbProfile(p.id);
      setMsg({ ok: ok(res), text: res?.message || "" });
      if (ok(res) && active === p.id) choose(null);
      await load();
    });

  const choose = (p) => {
    setConnection({ profileId: p?.id || "", profileName: p ? `${p.name} (${p.database})` : "" });
    setActive(p?.id || "");
    resetBuilderCaches();
    // Module-level screen caches in the builder hold the previous database's screens.
    window.location.reload();
  };

  const edit = (p) => setForm({ ...EMPTY, ...p, password: "" });

  return (
    <div className="sbc-page">
      <div className="sbc-card sbc-wide">
        <h2>Screen database</h2>
        <p className="sbc-sub">
          Backend: <b>{activeApiBase()}</b>. Screens you save in the builder go to the database chosen
          here. Missing screen builder tables (sb_*) are created when a profile is saved.
        </p>

        <div className="sbc-layout">
          <div>
            <ul className="sbc-list">
              <li className={!active ? "active" : ""}>
                <div className="sbc-grow">
                  <div className="sbc-name">Backend&apos;s own database</div>
                  <div className="sbc-meta">DbSettings in the backend&apos;s appsettings</div>
                </div>
                {!active ? (
                  <span className="sbc-badge">In use</span>
                ) : (
                  <button type="button" className="sbc-btn" disabled={busy} onClick={() => choose(null)}>
                    Use
                  </button>
                )}
              </li>
              {profiles.map((p) => (
                <li key={p.id} className={active === p.id ? "active" : ""}>
                  <div className="sbc-grow">
                    <div className="sbc-name">{p.name}</div>
                    <div className="sbc-meta">
                      {p.userId}@{p.server}:{p.port} / {p.database}
                    </div>
                  </div>
                  {active === p.id ? (
                    <span className="sbc-badge">In use</span>
                  ) : (
                    <button type="button" className="sbc-btn" disabled={busy} onClick={() => choose(p)}>
                      Use
                    </button>
                  )}
                  <button type="button" className="sbc-btn" disabled={busy} onClick={() => edit(p)}>
                    Edit
                  </button>
                  <button type="button" className="sbc-btn sbc-danger" disabled={busy} onClick={() => remove(p)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="sbc-grid">
              <div className="sbc-field sbc-span">
                <label htmlFor="sbc-name">Profile name</label>
                <input id="sbc-name" value={form.name} placeholder="e.g. SJM production" onChange={set("name")} />
              </div>
              <div className="sbc-field">
                <label htmlFor="sbc-server">Host</label>
                <input id="sbc-server" value={form.server} placeholder="10.0.1.108" onChange={set("server")} />
              </div>
              <div className="sbc-field">
                <label htmlFor="sbc-port">Port</label>
                <input id="sbc-port" value={form.port} onChange={set("port")} />
              </div>
              <div className="sbc-field sbc-span">
                <label htmlFor="sbc-db">Database</label>
                <input id="sbc-db" value={form.database} onChange={set("database")} />
              </div>
              <div className="sbc-field">
                <label htmlFor="sbc-user">User</label>
                <input id="sbc-user" value={form.userId} autoComplete="off" onChange={set("userId")} />
              </div>
              <div className="sbc-field">
                <label htmlFor="sbc-pass">Password</label>
                <input
                  id="sbc-pass"
                  type="password"
                  value={form.password}
                  autoComplete="new-password"
                  placeholder={form.id ? "Leave empty to keep" : ""}
                  onChange={set("password")}
                />
              </div>
            </div>
            <div className="sbc-actions">
              <button type="button" className="sbc-btn" disabled={busy} onClick={test}>
                Test connection
              </button>
              <button type="button" className="sbc-btn sbc-primary" disabled={busy} onClick={save}>
                {form.id ? "Update profile" : "Save profile"}
              </button>
              {form.id && (
                <button type="button" className="sbc-btn" disabled={busy} onClick={() => setForm(EMPTY)}>
                  New
                </button>
              )}
            </div>
            {msg && <div className={`sbc-msg ${msg.ok ? "ok" : "bad"}`}>{msg.text}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
