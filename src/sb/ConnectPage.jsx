/**
 * Step 1 — which backend (hospediav12-api) this builder talks to. Public: it comes before
 * login, because login itself goes to that backend.
 */
import React, { useState } from "react";
import { activeApiBase, getConnection, normaliseApiBase, setConnection } from "./connection";
import { pingBackend } from "./dbProfileApi";
import "./sb.css";

export default function ConnectPage() {
  const [url, setUrl] = useState(activeApiBase());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const check = async () => {
    const base = normaliseApiBase(url);
    if (!base) return setMsg({ ok: false, text: "Enter the backend URL." });
    setBusy(true);
    setMsg(null);
    const res = await pingBackend(base);
    setBusy(false);
    setUrl(base);
    setMsg(
      res.reachable
        ? { ok: true, text: `Backend answered (HTTP ${res.status}).` }
        : { ok: false, text: `Cannot reach ${base}: ${res.error}` },
    );
    return res.reachable ? base : null;
  };

  const useIt = async () => {
    const base = await check();
    if (!base) return;
    const prev = getConnection();
    // A different backend = different login and different profiles.
    if (prev.apiBaseUrl !== base) {
      setConnection({ apiBaseUrl: base, profileId: "", profileName: "" });
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("userData");
    }
    // Full reload: axios reads the base URL once, at start-up.
    window.location.assign("/login");
  };

  return (
    <div className="sbc-page sbc-full">
      <div className="sbc-card">
        <h2>Connect to a backend</h2>
        <p className="sbc-sub">
          Base URL of the hospediav12-api this screen builder should use. You log in to it next, and
          pick the database for screens after login.
        </p>
        <div className="sbc-field">
          <label htmlFor="sbc-url">Backend base URL</label>
          <input
            id="sbc-url"
            value={url}
            placeholder="http://localhost:7000/api/v1"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && useIt()}
          />
        </div>
        <div className="sbc-actions">
          <button type="button" className="sbc-btn" disabled={busy} onClick={check}>
            Check
          </button>
          <button type="button" className="sbc-btn sbc-primary" disabled={busy} onClick={useIt}>
            Use this backend and log in
          </button>
        </div>
        {msg && <div className={`sbc-msg ${msg.ok ? "ok" : "bad"}`}>{msg.text}</div>}
      </div>
    </div>
  );
}
