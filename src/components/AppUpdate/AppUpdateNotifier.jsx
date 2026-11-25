import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./AppUpdateNotifier.css";

/**
 * Reloads every open tab after a new build is deployed.
 *
 * Each build bakes its id into the bundle (__BUILD_ID__, see vite.config.js) and writes the
 * same id to dist/version.json. This polls version.json; when the deployed id no longer
 * matches the running one, a small modal asks to update:
 *   - "Update now" → fades the page out smoothly, then reloads.
 *   - "Later"      → modal shrinks into a floating chip (bottom-right) the user can click any
 *                    time; the update is also applied on the next page change, a safe point
 *                    with no half-filled form on screen.
 *
 * Also reloads when a lazy chunk fails to load (vite:preloadError) — the symptom of a tab
 * still running an old build whose chunk names no longer exist on the server.
 *
 * CI/CD: deploy jobs must upload version.json LAST, after index.html and assets.
 */

const RUNNING_BUILD = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : null;
const POLL_MS = 60 * 1000;
const FADE_MS = 650;
const GUARD_KEY = "app-update-reloaded-for";

// Server only: off under `npm run dev`, and off for any build opened on this machine
// (localhost / 127.x / ::1 / *.localhost — e.g. `vite preview` or a local IIS copy).
const LOCAL_HOST = /^(localhost|127(?:\.\d{1,3}){3}|\[?::1\]?|0\.0\.0\.0|.+\.localhost)$/i;
const ENABLED =
  !import.meta.env.DEV &&
  !!RUNNING_BUILD &&
  typeof window !== "undefined" &&
  !LOCAL_HOST.test(window.location.hostname);

const versionUrl =() => `${import.meta.env.BASE_URL || "/"}version.json?t=${Date.now()}`;

const safeSession = {
  get: (k) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* storage blocked: guard simply off */
    }
  },
};

const hardReload = (build) => {
  // A stale proxy/CDN copy of index.html would never match: reload once per build, not forever.
  if (build && safeSession.get(GUARD_KEY) === build) return;
  if (build) safeSession.set(GUARD_KEY, build);
  window.location.reload();
};

const SyncIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
    <path d="M3 21v-5h5" />
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export default function AppUpdateNotifier() {
  const [newBuild, setNewBuild] = useState(null);
  // hidden → modal → (closing) → chip ; any → reloading
  const [view, setView] = useState("hidden");
  const location = useLocation();
  const firstLocation = useRef(true);
  const announced = useRef(false); // modal shown once; later deploys just refresh the chip's target

  const smoothReload = useCallback((build) => {
    setView("reloading");
    setTimeout(() => hardReload(build), FADE_MS);
  }, []);

  // Poll for a new deploy.
  useEffect(() => {
    if (!ENABLED) return undefined;

    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(versionUrl(), { cache: "no-store" });
        if (!res.ok) return;
        const { build } = await res.json();
        if (stopped || !build || build === RUNNING_BUILD) return;
        if (safeSession.get(GUARD_KEY) === build) return; // already reloaded once for it
        if (!announced.current) {
          announced.current = true;
          setView("modal");
        }
        setNewBuild(build);
      } catch {
        /* offline or file missing: try again next tick */
      }
    };

    const onVisible = () => document.visibilityState === "visible" && check();
    const onChunkError = (e) => {
      e.preventDefault();
      hardReload(`chunk-${RUNNING_BUILD}`);
    };

    check();
    const id = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("vite:preloadError", onChunkError);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("vite:preloadError", onChunkError);
    };
  }, []);

  // Deferred ("Later"): apply on the next page change.
  useEffect(() => {
    if (firstLocation.current) {
      firstLocation.current = false;
      return;
    }
    if (newBuild && view === "chip") smoothReload(newBuild);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc on the modal = Later.
  useEffect(() => {
    if (view !== "modal") return undefined;
    const onKey = (e) => e.key === "Escape" && later();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const later = () => {
    setView("closing");
    setTimeout(() => setView((v) => (v === "closing" ? "chip" : v)), 280);
  };
  const updateNow = () => smoothReload(newBuild);

  if (!newBuild || view === "hidden") return null;

  return (
    <div className="aun-root">
      {(view === "modal" || view === "closing") && (
        <div className={`aun-backdrop ${view === "closing" ? "is-out" : ""}`}
          onMouseDown={(e) => e.target === e.currentTarget && later()}>
          <div className="aun-modal" role="dialog" aria-modal="true" aria-labelledby="aun-title">
            <div className="aun-hero">
              <span className="aun-hero-ring" />
              <span className="aun-hero-ring aun-hero-ring--2" />
              <span className="aun-hero-icon"><SyncIcon className="aun-spin-slow" /></span>
            </div>
            <div className="aun-body">
              <h3 id="aun-title" className="aun-title">New version available</h3>
              <p className="aun-text">
                We&apos;ve deployed an update. Refresh now to get the latest features and fixes.
                Please save any unsaved work first.
              </p>
              <div className="aun-actions">
                <button type="button" className="aun-btn aun-btn--ghost" onClick={later}>
                  Later
                </button>
                <button type="button" className="aun-btn aun-btn--primary" onClick={updateNow} autoFocus>
                  <SyncIcon className="aun-btn-icon" /> Update now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "chip" && (
        <button type="button" className="aun-chip" onClick={updateNow}
          title="A new version is ready — click to refresh">
          <span className="aun-chip-glow" />
          <span className="aun-chip-icon"><SyncIcon className="aun-spin" /></span>
          <span className="aun-chip-text">
            <b>Update ready</b>
            <small>Click to refresh</small>
          </span>
          <span className="aun-chip-dot" />
        </button>
      )}

      {view === "reloading" && (
        <div className="aun-reload" role="status" aria-live="polite">
          <div className="aun-reload-card">
            <SyncIcon className="aun-spin aun-reload-icon" />
            <span>Updating to the latest version…</span>
          </div>
        </div>
      )}
    </div>
  );
}
