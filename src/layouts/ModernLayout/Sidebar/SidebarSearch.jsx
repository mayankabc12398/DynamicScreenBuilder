import { useTheme } from "@app/hooks/useTheme";

export default function SidebarSearch({ value, onChange }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div style={{ position: "relative", padding: "0 12px 0px" }}>
      <i
        className="fas fa-search"
        style={{
          position: "absolute",
          left: 22,
          top: "50%",
          transform: "translateY(-50%)",
          color: c.textMuted,
          fontSize: 11,
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search menu…"
        style={{
          width: "100%",
          height: 30,
          paddingLeft: 28,
          paddingRight: 8,
          borderRadius: 8,
          border: `1px solid ${c.border}`,
          background: c.panel2,
          color: c.text,
          fontSize: 12,
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}
