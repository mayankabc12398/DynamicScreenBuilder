/**
 * Version history — every saved state of the screen, newest first.
 *
 * A drop-down from the toolbar's clock. Each row is one version the server
 * kept (a manual Save, a Publish, a restore): pick one and it is loaded onto
 * the canvas as an ordinary, undoable edit. Nothing is written until Save,
 * and Save then makes it the latest version — the history is never rewritten,
 * the old row stays where it was. Old rows can be deleted from here.
 *
 * Portalled to <body>: the toolbar scrolls sideways and would clip it.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Icon from "../registry/icons";
import Tap from "./Tap";
import { ScreenRepo, Storage } from "../utils/storage";

/** What a row is, read off its note — and the colour that says so. */
export function versionKind(note = "") {
  const n = String(note || "").toLowerCase();
  if (n.startsWith("publish")) return { key: "published", label: "Published", icon: "BadgeCheck" };
  if (n.startsWith("restored")) return { key: "restored", label: "Restored", icon: "RotateCcw" };
  if (n.startsWith("replaced")) return { key: "replaced", label: "Before restore", icon: "Archive" };
  if (n.startsWith("auto")) return { key: "auto", label: "Auto", icon: "Timer" };
  return { key: "saved", label: "Saved", icon: "Save" };
}

const pad = (n) => String(n).padStart(2, "0");
const asDate = (at) => {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? null : d;
};
const timeOf = (d) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase();
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "Today", "Yesterday", or "Mon, 6 Oct 2026". */
function dayLabel(d) {
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return "Today";
  if (dayKey(d) === dayKey(y)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** "just now", "5 min ago", "3 h ago" — only for today; older rows show the clock. */
function ago(d) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}

export default function VersionHistory({ open, anchor, screen, dirty, viewing, refreshKey, onOpenVersion, onBackToLatest, onClose }) {
  const [list, setList] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(""); // versionId being opened / deleted
  const [confirm, setConfirm] = useState(""); // versionId awaiting "delete?"
  const [pos, setPos] = useState({ top: 56, right: 12 });
  const panelRef = useRef(null);
  const screenId = screen?.id;

  const load = useCallback(async () => {
    if (!screenId) return;
    setState("loading");
    setError("");
    try {
      const rows = await ScreenRepo.versions(screenId);
      setList(Array.isArray(rows) ? rows : []);
      setState("ok");
    } catch (e) {
      setError(e?.message || "Could not read the history");
      setState("error");
    }
  }, [screenId]);

  // Fresh every time it opens, and after a save while it is open.
  useEffect(() => {
    if (open) load();
    else setConfirm("");
  }, [open, load, refreshKey]);

  // Under the clock, right-aligned to it, kept inside the window.
  useLayoutEffect(() => {
    if (!open || !anchor?.current) return undefined;
    const place = () => {
      const r = anchor.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right - 4) });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, anchor]);

  // Escape and a click anywhere else close it — as a drop-down should.
  useEffect(() => {
    if (!open) return undefined;
    const key = (e) => e.key === "Escape" && onClose();
    const away = (e) => {
      if (panelRef.current?.contains(e.target) || anchor?.current?.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("keydown", key);
    const t = setTimeout(() => document.addEventListener("mousedown", away), 0);
    return () => {
      window.removeEventListener("keydown", key);
      clearTimeout(t);
      document.removeEventListener("mousedown", away);
    };
  }, [open, onClose, anchor]);

  const groups = useMemo(() => {
    const out = [];
    let cur = null;
    list.forEach((v) => {
      const d = asDate(v.at);
      const label = d ? dayLabel(d) : "Earlier";
      if (!cur || cur.label !== label) {
        cur = { label, rows: [] };
        out.push(cur);
      }
      cur.rows.push(v);
    });
    return out;
  }, [list]);

  const openVersion = async (v) => {
    if (busy) return;
    setBusy(v.versionId);
    try {
      const doc = await ScreenRepo.getVersion(screenId, v.versionId);
      if (!doc) throw new Error("That version could not be read");
      onOpenVersion(doc, v);
    } catch (e) {
      toast.error(e?.message || "Could not open that version");
    } finally {
      setBusy("");
    }
  };

  const remove = async (v) => {
    setBusy(v.versionId);
    try {
      await ScreenRepo.deleteVersion(screenId, v.versionId);
      setList((l) => l.filter((x) => x.versionId !== v.versionId));
      setConfirm("");
      if (Storage.remote) toast.success(`Version v${v.version} deleted`);
      else toast.warning(`Deleted in this browser only — ${Storage.lastError}`);
    } catch (e) {
      toast.error(e?.message || "Could not delete that version");
    } finally {
      setBusy("");
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="dsb-portal">
      <div
        ref={panelRef}
        className="dsb-vh"
        role="dialog"
        aria-label="Version history"
        style={{ top: pos.top, right: pos.right }}
      >
        <div className="dsb-vh-head">
          <span className="dsb-vh-title">
            <Icon name="History" size={14} />
            Version history
            {state === "ok" ? <span className="dsb-vh-count">{list.length}</span> : null}
          </span>
          <span className="dsb-vh-tools">
            <Tap className="dsb-vh-icon" title="Refresh" aria-label="Refresh" onClick={load}>
              <Icon name="RefreshCw" size={13} className={state === "loading" ? "dsb-vh-spin" : ""} />
            </Tap>
            <Tap className="dsb-vh-icon" title="Close (Esc)" aria-label="Close" onClick={onClose}>
              <Icon name="X" size={14} />
            </Tap>
          </span>
        </div>

        {/* What is on the canvas right now. */}
        <div className={`dsb-vh-current ${viewing ? "is-viewing" : ""}`}>
          <span className="dsb-vh-dot" />
          <span className="dsb-vh-cur-text">
            {viewing ? (
              <>
                <b>Viewing v{viewing.version}</b>
                <small>Save to make it the latest version</small>
              </>
            ) : (
              <>
                <b>Current · v{screen?.version || 1}</b>
                <small>{dirty ? "Has unsaved changes" : "Saved"}</small>
              </>
            )}
          </span>
          {viewing ? (
            <Tap className="dsb-vh-pill tone-back" onClick={onBackToLatest} title="Put back what was on the canvas before">
              <Icon name="Undo2" size={12} /> Back to latest
            </Tap>
          ) : dirty ? (
            <span className="dsb-vh-chip is-unsaved">unsaved</span>
          ) : null}
        </div>

        <div className="dsb-vh-body">
          {state === "loading" && !list.length ? (
            <div className="dsb-vh-skel">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} />
              ))}
            </div>
          ) : null}

          {state === "error" ? (
            <div className="dsb-vh-empty is-error">
              <Icon name="TriangleAlert" size={18} />
              <span>{error}</span>
              <Tap className="dsb-vh-pill tone-open" onClick={load}>
                Try again
              </Tap>
            </div>
          ) : null}

          {state === "ok" && !list.length ? (
            <div className="dsb-vh-empty">
              <Icon name="History" size={20} />
              <b>No versions yet</b>
              <span>Every Save and Publish keeps a copy here you can go back to.</span>
            </div>
          ) : null}

          {groups.map((g) => (
            <div key={g.label} className="dsb-vh-group">
              <div className="dsb-vh-day">{g.label}</div>
              {g.rows.map((v) => {
                const kind = versionKind(v.note);
                const d = asDate(v.at);
                const isViewing = viewing?.versionId === v.versionId;
                const asking = confirm === v.versionId;
                return (
                  <div
                    key={v.versionId}
                    className={`dsb-vh-row k-${kind.key} ${isViewing ? "is-viewing" : ""} ${busy === v.versionId ? "is-busy" : ""}`}
                    role="button"
                    tabIndex={0}
                    title="Load this version onto the canvas"
                    onClick={() => !asking && openVersion(v)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !asking && openVersion(v)}
                  >
                    <span className="dsb-vh-badge">v{v.version}</span>
                    <span className="dsb-vh-main">
                      <span className="dsb-vh-line">
                        <span className="dsb-vh-kind">
                          <Icon name={kind.icon} size={11} />
                          {kind.label}
                        </span>
                        {v.note && kind.key !== "saved" && kind.key !== "published" ? (
                          <span className="dsb-vh-note" title={v.note}>
                            {/* "Restored from v2" under a "Restored" label reads twice. */}
                            {kind.key === "restored" ? String(v.note).replace(/^restored\s*/i, "") : v.note}
                          </span>
                        ) : null}
                      </span>
                      <span className="dsb-vh-meta">
                        <Icon name="Clock3" size={10} />
                        {d ? (dayLabel(d) === "Today" ? `${timeOf(d)} · ${ago(d)}` : timeOf(d)) : "—"}
                        {v.by ? (
                          <>
                            <span className="dsb-vh-sep">•</span>
                            <Icon name="User" size={10} />
                            {v.by}
                          </>
                        ) : null}
                      </span>
                    </span>
                    {asking ? (
                      <span className="dsb-vh-confirm" onClick={(e) => e.stopPropagation()}>
                        <span>Delete?</span>
                        <Tap className="dsb-vh-pill tone-danger" onClick={() => remove(v)}>
                          Yes
                        </Tap>
                        <Tap className="dsb-vh-pill tone-plain" onClick={() => setConfirm("")}>
                          No
                        </Tap>
                      </span>
                    ) : (
                      <span className="dsb-vh-actions" onClick={(e) => e.stopPropagation()}>
                        {isViewing ? <span className="dsb-vh-chip is-viewing">on canvas</span> : null}
                        <Tap className="dsb-vh-icon tone-open" title="Load this version" aria-label="Load this version" onClick={() => openVersion(v)}>
                          <Icon name={busy === v.versionId ? "Loader" : "RotateCcw"} size={13} className={busy === v.versionId ? "dsb-vh-spin" : ""} />
                        </Tap>
                        <Tap
                          className="dsb-vh-icon tone-danger"
                          title="Delete this version"
                          aria-label="Delete this version"
                          disabled={isViewing}
                          onClick={() => setConfirm(v.versionId)}
                        >
                          <Icon name="Trash2" size={13} />
                        </Tap>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="dsb-vh-foot">
          <Icon name="Info" size={11} />
          Loading a version changes nothing until you press <b>Save</b>.
        </div>
      </div>
    </div>,
    document.body,
  );
}
