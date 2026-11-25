import { useEffect, useState } from "react";
import { useTheme } from "@app/hooks/useTheme";
import { THEMES } from "@app/providers/ThemeProvider";
import { applyRootThemeClass } from "@app/utils/helpers";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { updateTheme } from "@app/networkServices/HeaderApi";
import { notify } from "@app/utils/utils";

const PALETTE = [
  { theme: "default_theme", icon: "default_icon", label: "Default" },
  { theme: "orange_theme", icon: "orange_icon", label: "Orange" },
  { theme: "peach_theme", icon: "peach_icon", label: "Peach" },
  { theme: "pale_pink_theme", icon: "pale_pink_icon", label: "Pale Pink" },
  { theme: "red_theme", icon: "red_icon", label: "Red" },
  { theme: "sky_blue_theme", icon: "sky_blue_icon", label: "Sky Blue" },
  { theme: "light_blue_theme", icon: "light_blue_icon", label: "Lite Blue" },
  { theme: "pink_theme", icon: "pink_icon", label: "Pink" },
  { theme: "purple_theme", icon: "purple_icon", label: "Purple" },
  { theme: "gray_theme", icon: "gray_icon", label: "Gray" },
  // { theme: "pastel_pink_theme", icon: "pastel_pink_icon", label: "Pastel Pink" },
  // { theme: "light_peach_theme", icon: "light_peach_icon", label: "Lite Peach" },
  // { theme: "pale_peach_theme", icon: "pale_peach_icon", label: "Pale Peach" },
  { theme: "pale_yellow_theme", icon: "pale_yellow_icon", label: "Pale Yellow" },
  // { theme: "pale_green_theme", icon: "pale_green_icon", label: "Pale Green" },
  { theme: "light_celadon_theme", icon: "light_celadon_icon", label: "Lite Celadon" },
  // { theme: "pale_mint_theme", icon: "pale_mint_icon", label: "Pale Mint" },
  { theme: "pale_aqua_theme", icon: "pale_aqua_icon", label: "Pale Aqua" },
  // { theme: "pale_lavender_blue_theme", icon: "pale_lavender_blue_icon", label: "Pale Lavender Blue" },
  // { theme: "pale_gray_theme", icon: "pale_gray_icon", label: "Pale Gray" },
  // { theme: "pale_mauve_theme", icon: "pale_mauve_icon", label: "Pale Mauve" },
  // { theme: "lavender_blush_theme", icon: "lavender_blush_icon", label: "Lavender Blush" },
  // { theme: "pale_rose_theme", icon: "pale_rose_icon", label: "Pale Rose" },
  // { theme: "lite_pale_theme", icon: "lite_pale_icon", label: "Lite Pale Pink" },
  // { theme: "blush_pink_theme", icon: "blush_pink_Icon", label: "Blush Pink" },
  // { theme: "light_pink_theme", icon: "light_pink_Icon", label: "Lite Pink" },
  
];

export default function ThemeSwitcher() {
  const { theme, mode, setMode } = useTheme();
  const c = theme.colors;
  const stored = useLocalStorage("theme", "get");
  const [active, setActive] = useState(stored || "default_theme");

  useEffect(() => {
    // modern stays locked to sky_blue_theme via the central helper
    applyRootThemeClass();
  }, [active]);

  const pick = async (item) => {
    if (item === active) return;
    useLocalStorage("theme", "set", item);
    setActive(item);
    applyRootThemeClass(); // honors design lock (modern → sky_blue)
    const userData = useLocalStorage("userData", "get") || {};
    try {
      const resp = await updateTheme({ theme: item, employeeID: userData?.employeeID });
      if (resp?.success) notify(resp?.message || "Theme saved", "success");
      else if (resp?.message) notify(resp.message, "error");
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Mode (Light/Dark) — single toggle, default Light, click flips to Dark */}
      <div>
        <div style={lblStyle(c)}>Mode</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <ModeToggle
            c={c}
            isDark={mode === THEMES.DARK}
            onToggle={() => setMode(mode === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)}
          />
          {/* <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>
            {mode === THEMES.DARK ? "Dark" : "Light"}
          </span> */}
        </div>
      </div>

      {/* Color Theme — old named-theme palette */}
      {/* <div>
        <div style={lblStyle(c)}>Color Theme</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 6,
            marginTop: 4,
            maxHeight: 168,
            overflowY: "auto",
            paddingRight: 2,
          }}
          className="thin-scroll"
        >
          {PALETTE.map((p) => {
            const isActive = active === p.theme;
            return (
              <button
                key={p.theme}
                type="button"
                title={p.label}
                onClick={() => pick(p.theme)}
                style={{
                  position: "relative",
                  aspectRatio: "1/1",
                  borderRadius: 9,
                  border: `1.5px solid ${isActive ? c.accent : c.border}`,
                  background: c.panel,
                  cursor: "pointer",
                  padding: 0,
                  display: "grid",
                  placeItems: "center",
                  transition: "transform .15s, border-color .15s, box-shadow .15s",
                  boxShadow: isActive ? `0 4px 14px -6px ${c.accent}` : "none",
                  transform: isActive ? "scale(1.05)" : "none",
                }}
              >
                <span className={p.icon} style={{ width: 22, height: 22, display: "inline-block", borderRadius: 6 }} />
                {isActive && (
                  <i
                    className="fas fa-check"
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 3,
                      fontSize: 8,
                      color: c.accent,
                      background: c.panel,
                      borderRadius: "50%",
                      padding: 2,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div> */}
    </div>
  );
}

function ModeToggle({ c, isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Dark mode, switch to Light" : "Light mode, switch to Dark"}
      title={isDark ? "Switch to Light" : "Switch to Dark"}
      style={{
        position: "relative",
        width: 56,
        height: 28,
        borderRadius: 999,
        border: `1px solid ${c.border}`,
        background: isDark ? c.accentSoft : c.panel,
        cursor: "pointer",
        padding: 0,
        fontFamily: "inherit",
        transition: ".2s",
        flexShrink: 0,
      }}
    >
      {/* sliding knob carries the current mode icon */}
      <span
        style={{
          position: "absolute",
          top: 2,
          left: isDark ? 30 : 2,
          width: 23,
          height: 23,
          borderRadius: "50%",
          background: c.accent,
          display: "grid",
          placeItems: "center",
          transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.3)",
        }}
      >
        <i
          className={isDark ? "fas fa-moon" : "fas fa-sun"}
          style={{ fontSize: 11, color: "#fff" }}
        />
      </span>
    </button>
  );
}

function lblStyle(c) {
  return {
    fontSize: 9.5,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: "uppercase",
    letterSpacing: ".5px",
  };
}
