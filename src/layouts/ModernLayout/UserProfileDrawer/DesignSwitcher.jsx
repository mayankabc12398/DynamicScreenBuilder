import { useDesignMode } from "@app/hooks/useDesignMode";
import { useTheme } from "@app/hooks/useTheme";
import { DESIGN_MODES } from "@app/providers/DesignProvider";
import { useDispatch } from "react-redux";
import { setLayoutMode } from "@app/store/reducers/ui";
import { useTranslation } from "react-i18next";

export default function DesignSwitcher() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { mode, setMode } = useDesignMode();
    const dispatch = useDispatch();
  const [t] = useTranslation();

  const Option = ({ value, label, icon }) => {
    const active = mode === value;
    return (
      <button
        type="button"
        onClick={() => {setMode(value);dispatch(setLayoutMode("ll"))}}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${active ? c.accent : c.border}`,
          background: active ? c.accentSoft : c.panel,
          color: active ? c.accent : c.text,
          fontWeight: active ? 700 : 500,
          fontSize: 12.5,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: ".18s",
        }}
      >
        <i className={icon} style={{ fontSize: 14 }} />
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: ".5px" }}>
        Design
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Option value={DESIGN_MODES.LEGACY} label="Classic" icon="fas fa-th-large" />
         <button
        type="button"
        role="tab"
        
         style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${c.border}`,
          background: c.panel,
          color: c.text,
          fontWeight:  500,
          fontSize: 12.5,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: ".18s",
        }}
        onClick={() => {dispatch(setLayoutMode("modern"));setMode(DESIGN_MODES.LEGACY)}}
        title={t("Modern Layout")}
      >
        Modern
      </button>
        {/* <Option value={DESIGN_MODES.LEGACY} label="Modern" icon="fas fa-th-large" /> */}
        <Option value={DESIGN_MODES.MODERN} label="NextGen" icon="fas fa-sparkles" />
      </div>
    </div>
  );
}
