import { useSyncExternalStore } from "react";
// import logoitdose from "../../assets/image/logoitdose.png";
import logoitdose from "../../assets/image/logo.png";
import useDesignMode from "@app/hooks/useDesignMode";
import { isPanelLoaderSuppressed } from "@app/networkServices/panelLoaderGate";
import {
  subscribeAutoCompleteLoader,
  getAutoCompleteLoaderSnapshot,
} from "@app/networkServices/autoCompleteLoaderGate";

/* Modern Heartbeat (ECG) loader — itDose palette. Self-contained scoped CSS.
   Traced waveform with a leading pulse dot. Brand: terracotta #BD552E.
   Transform/opacity/stroke only (GPU-friendly). */
const ECG_PATH = "M2 28 H58 L62 28 L65 23 L68 33 L71 7 L75 47 L78 28 L82 28 H148";

const MODERN_CSS = `
.hims-loader-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(247, 243, 240, 0.82); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  --lc: #bd552e; --lc-soft: rgba(189,85,46,.35);
}
.hims-loader-overlay .ecg { width: min(360px, 82vw); height: auto; }
.hims-loader-overlay .ecg .base { fill: none; stroke: var(--lc); stroke-width: 1.2; opacity: .14; stroke-linecap: round; }
.hims-loader-overlay .ecg .trace {
  fill: none; stroke: var(--lc); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 20 100; animation: hims-ecg 1.5s linear infinite;
  filter: drop-shadow(0 0 3px var(--lc-soft));
}
.hims-loader-overlay .ecg .blip { fill: var(--lc); offset-path: path("${ECG_PATH}"); offset-rotate: 0deg; animation: hims-blip 1.5s linear infinite; filter: drop-shadow(0 0 4px var(--lc-soft)); }
@keyframes hims-ecg { to { stroke-dashoffset: -120; } }
@keyframes hims-blip { from { offset-distance: 0%; } to { offset-distance: 100%; } }
@media (prefers-reduced-motion: reduce) {
  .hims-loader-overlay .ecg .trace, .hims-loader-overlay .ecg .blip { animation-duration: 4s !important; }
}
`;

const Heartbeat = () => (
  <svg className="ecg" viewBox="0 0 150 56" role="status" aria-label="Loading">
    <path className="base" d={ECG_PATH} />
    <path className="trace" pathLength="100" d={ECG_PATH} />
    <circle className="blip" r="3.4" />
  </svg>
);

const Loading = ({ loading }) => {
  // if (!loading) return null;
  const { isModern } = useDesignMode();

  // Any AutoComplete mid-search? Skip the full-screen overlay — the field
  // shows its own inline spinner. Central switch for every AutoComplete.
  const acSuppressed = useSyncExternalStore(
    subscribeAutoCompleteLoader,
    getAutoCompleteLoaderSnapshot,
    getAutoCompleteLoaderSnapshot,
  );
  if (acSuppressed) return null;

  if (isModern) {
    // Skip the full-screen ECG only for a form's INITIAL open-load from the
    // right rail (panel shows its own spinner). Loads the user triggers after
    // interacting — search, save — still show it. API/data flow untouched.
    if (isPanelLoaderSuppressed()) {
      return null;
    }
    return (
      <div className="hims-loader-overlay">
        <style>{MODERN_CSS}</style>
        <Heartbeat />
      </div>
    );
  }

  return (
    <div className="loading-overlay">
      <img src={logoitdose} alt="Logo" className="itdose-logo" style={{borderRadius:"60%"}} />
      <div className="loadingio-spinner-spinner-nq4q5u6dq7r">
        <div className="ldio-x2uulkbinbj">
          {[...Array(21)].map((_, index) => (
            <div key={index}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
