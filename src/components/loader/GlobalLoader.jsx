import React, { useEffect, useState, useSyncExternalStore } from "react";
import { subscribe, getSnapshot } from "@app/networkServices/loaderStore";

/**
 * One global request loader, mounted once at the app root. Subscribes to the
 * counter store via useSyncExternalStore — re-renders ONLY this component.
 *
 * variant="bar"     -> slim top progress bar (NProgress-style). DEFAULT: best
 *                      fit across 1000 pages; non-blocking on every fetch.
 * variant="overlay" -> dimmed/blurred backdrop + centered mark, for full-page
 *                      / initial loads.
 *
 * Accent: emerald / Aurora (#16876a / #2dd4bf). Switch to the itDose brand by
 * changing --gl-accent / --gl-accent2 below. All styles are scoped under
 * .gl-root so nothing collides with Bootstrap / AdminLTE globals.
 */
const CSS = `
.gl-root, .gl-root * { box-sizing: border-box; }
.gl-root {
  --gl-accent: #16876a; --gl-accent2: #2dd4bf;
  position: fixed; z-index: 100000; pointer-events: none;
}

/* ---- top progress bar ---- */
.gl-bar-wrap { top: 0; left: 0; right: 0; height: 3px; }
.gl-bar {
  height: 100%; width: 0;
  background: linear-gradient(90deg, var(--gl-accent), var(--gl-accent2));
  box-shadow: 0 0 10px rgba(45,212,191,.7), 0 1px 4px rgba(22,135,106,.5);
  border-radius: 0 3px 3px 0;
  transition: opacity .35s ease;
}
.gl-bar[data-phase="active"] { animation: gl-trickle 14s cubic-bezier(.1,.7,.3,1) forwards; opacity: 1; }
.gl-bar[data-phase="done"] { width: 100%; opacity: 0; transition: width .2s ease, opacity .35s ease .15s; }
.gl-bar::after {
  content: ""; position: absolute; right: 0; top: 0; height: 100%; width: 90px;
  box-shadow: 0 0 14px 4px rgba(45,212,191,.55); opacity: .8;
}
@keyframes gl-trickle {
  0% { width: 0; } 12% { width: 28%; } 35% { width: 52%; }
  60% { width: 71%; } 82% { width: 84%; } 100% { width: 92%; }
}

/* small corner spinner pairs with the bar */
.gl-spark { top: 12px; right: 14px; width: 16px; height: 16px; }
.gl-spark span {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid transparent; border-top-color: var(--gl-accent2); border-right-color: var(--gl-accent);
  animation: gl-spin .7s linear infinite;
}

/* ---- centered overlay variant ---- */
.gl-overlay {
  inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(15, 23, 20, .28); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
  pointer-events: all; animation: gl-fade .25s ease;
}
.gl-overlay .gl-mark { position: relative; width: 64px; height: 64px; }
.gl-overlay .gl-mark span {
  position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent;
  border-top-color: var(--gl-accent2); border-right-color: var(--gl-accent);
  animation: gl-spin .9s cubic-bezier(.5,.1,.4,.9) infinite;
}
.gl-overlay .gl-mark span:nth-child(2) { inset: 9px; border-top-color: var(--gl-accent); border-right-color: var(--gl-accent2); animation-duration: 1.3s; animation-direction: reverse; }
.gl-overlay .gl-mark .gl-pulse {
  position: absolute; inset: 22px; border-radius: 50%;
  background: linear-gradient(135deg, var(--gl-accent), var(--gl-accent2));
  animation: gl-beat 1.3s ease-in-out infinite;
}

@keyframes gl-spin { to { transform: rotate(360deg); } }
@keyframes gl-beat { 0%,100% { transform: scale(.8); opacity: .85; } 50% { transform: scale(1.15); opacity: 1; } }
@keyframes gl-fade { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .gl-bar[data-phase="active"] { animation-duration: 30s; }
  .gl-spark span, .gl-overlay .gl-mark span, .gl-overlay .gl-mark .gl-pulse { animation-duration: 2.5s !important; }
}
`;

let cssInjected = false;
const Styles = () => {
  // render the scoped stylesheet only once even if mounted twice (HMR)
  if (cssInjected) return null;
  cssInjected = true;
  return <style>{CSS}</style>;
};

export default function GlobalLoader({ variant = "bar", spark = true }) {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [phase, setPhase] = useState("idle"); // idle | active | done

  useEffect(() => {
    if (visible) {
      setPhase("active");
      return undefined;
    }
    // visible -> false: run the "complete then fade" only if we were active
    setPhase((p) => (p === "active" ? "done" : p));
    const t = setTimeout(() => setPhase((p) => (p === "done" ? "idle" : p)), 450);
    return () => clearTimeout(t);
  }, [visible]);

  if (phase === "idle") return null;

  if (variant === "overlay") {
    return (
      <div className="gl-root gl-overlay" role="status" aria-live="polite" aria-label="Loading">
        <style>{CSS}</style>
        <div className="gl-mark">
          <span />
          <span />
          <div className="gl-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Styles />
      <div className="gl-root gl-bar-wrap" role="status" aria-live="polite" aria-label="Loading">
        <div className="gl-bar" data-phase={phase} />
      </div>
      {spark && phase === "active" && (
        <div className="gl-root gl-spark" aria-hidden="true">
          <span />
        </div>
      )}
    </>
  );
}
