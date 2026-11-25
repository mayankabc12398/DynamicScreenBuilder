import { useEffect } from "react";
import { useTheme } from "@app/hooks/useTheme";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { updateFontSize } from "@app/networkServices/HeaderApi";
import { notify } from "@app/utils/utils";

const MIN_PX = 9;
const MAX_PX = 17;
const DEFAULT_PX = 12;

function applyFontVars(px) {
  const root = document.documentElement;
  root.style.setProperty("--app-font-size", `${px}px`);
  const height = Math.max(28, px * 2);
  root.style.setProperty("--control-height", `${height}px`);
}

export default function FontSizeControl({ value, onChange }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const localData = useLocalStorage("userData", "get") || {};

  // Treat value as % (80-140) for back-compat, but apply as px (9-17)
  // Map: 80% → 9px, 100% → 12px, 140% → 17px (linear)
  const px = Math.round(MIN_PX + ((value - 80) / 60) * (MAX_PX - MIN_PX));
  const clampedPx = Math.min(MAX_PX, Math.max(MIN_PX, px));

  useEffect(() => {
    applyFontVars(clampedPx);
  }, [clampedPx]);

  useEffect(() => {
    const initPx = Number(localData?.applicationFont) || DEFAULT_PX;
    applyFontVars(initPx);
    // default the slider/parent value from stored applicationFont (px → %)
    const pct = Math.round(80 + ((initPx - MIN_PX) / (MAX_PX - MIN_PX)) * 60);
    onChange?.(pct);
  }, []);

  const persist = async (newPx) => {
    if (String(localData?.applicationFont) === String(newPx)) return;
    try {
      const apiResp = await updateFontSize({
        applicationFont: String(newPx),
        employeeID: String(localData?.employeeID),
      });
      if (apiResp?.success) {
        useLocalStorage("userData", "set", {
          ...localData,
          applicationFont: String(newPx),
        });
        notify(apiResp?.message, "success");
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRange = (e) => {
    const newPx = Number(e.target.value);
    applyFontVars(newPx);
    const pct = Math.round(80 + ((newPx - MIN_PX) / (MAX_PX - MIN_PX)) * 60);
    onChange(pct);
  };

  const handleCommit = (e) => {
    persist(Number(e.target.value));
  };

  const reset = () => {
    applyFontVars(DEFAULT_PX);
    onChange(100);
    persist(DEFAULT_PX);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: ".5px" }}>
        Font Size
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 10px",
          borderRadius: 8,
          border: `1px solid ${c.border}`,
          background: c.panel,
        }}
      >
        <span style={{ fontSize: 11, color: c.textMuted }}>A</span>
        <input
          type="range"
          min={MIN_PX}
          max={MAX_PX}
          step={1}
          value={clampedPx}
          onChange={handleRange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          onDoubleClick={reset}
          title={`${clampedPx}px · double-click reset`}
          style={{ flex: 1, accentColor: c.accent }}
        />
        <span style={{ fontSize: 15, color: c.text, fontWeight: 700 }}>A</span>
        <span
          style={{
            minWidth: 38,
            textAlign: "right",
            fontSize: 11,
            fontWeight: 700,
            color: c.accent,
          }}
        >
          {clampedPx}px
        </span>
      </div>
    </div>
  );
}
