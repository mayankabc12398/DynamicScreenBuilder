import { useSelector } from "react-redux";
import { useTheme } from "@app/hooks/useTheme";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import SidebarRoleSwitch from "./SidebarRoleSwitch";

export default function SidebarFooter({ collapsed, drawerOpen, onTrigger }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const localData = useLocalStorage("userData", "get") || {};
  const name = localData?.empName|| "User";
  const role = localData?.roleName || "—";
  console.log("asaaaaaaaaa",name)
  const initials = (name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        flexShrink: 0,
        // padding: 10,
        borderTop: `1px solid ${c.border}`,
        background: c.panel2,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: "stretch",
          gap: 6,
        }}
      >
      <SidebarRoleSwitch collapsed={collapsed} compact={!collapsed} />
      <button
        type="button"
        onClick={onTrigger}
        title={collapsed ? name : ""}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          flex: 1,
          minWidth: 0,
          padding: collapsed ? "6px 0" : "8px 10px",
          borderRadius: 10,
          border: `1px solid ${c.border}`,
          background: drawerOpen ? c.accentSoft : c.panel,
          color: c.text,
          cursor: "pointer",
          fontFamily: "inherit",
          justifyContent: collapsed ? "center" : "flex-start",
          textAlign: "left",
          transition: "background .2s, border-color .2s",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg,#FBBF24,#F59E0B)",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 12,
            color: "#7C2D12",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        {!collapsed && (
          <>
            <div style={{ lineHeight: 1.15, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: c.textMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {role}
              </div>
            </div>
            <i
              className="fas fa-chevron-right"
              style={{
                fontSize: 10,
                color: drawerOpen ? c.accent : c.textMuted,
                transition: "transform .25s",
                transform: drawerOpen ? "translateX(2px)" : "none",
              }}
            />
          </>
        )}
      </button>
      </div>
    </div>
  );
}
