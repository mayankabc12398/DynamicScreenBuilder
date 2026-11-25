import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@app/hooks/useTheme";
import { THEMES } from "@app/providers/ThemeProvider";
import { zIndex } from "@app/design-system/tokens/zIndex";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { broadcastSessionChange } from "@app/utils/tabSync";
import RoleChangeModal from "@app/layouts/header/role-change-modal/RoleChangeModal";
import {
  GetBindMenu,
  GetRoleListByEmployeeIDAndCentreID,
} from "@app/store/reducers/common/CommonExportFunction";
import { updateClaims } from "@app/networkServices/HeaderApi";
import logoitdose from "@app/assets/image/logoitdose.png";

export default function ModernHeader({ onOpenMobile, onOpenDrawer }) {
  const { theme, mode, setMode } = useTheme();
  const c = theme.colors;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const localData = useLocalStorage("userData", "get") || {};
  const { GetNotifications, GetRoleList } = useSelector((s) => s?.CommonSlice || {});
  const notifCount = Array.isArray(GetNotifications) ? GetNotifications.length : 0;

  // Role change — same flow as SidebarRoleSwitch / HeaderActionsPanel.
  const [roleOpen, setRoleOpen] = useState(false);

  const openRolePicker = () => {
    if (!GetRoleList?.length && localData?.employeeID) {
      dispatch(
        GetRoleListByEmployeeIDAndCentreID({
          employeeID: localData.employeeID,
          centreID: localData.defaultCentre,
        })
      );
    }
    setRoleOpen(true);
  };

  const handleRoleSelect = useCallback(
    async (role) => {
      const value = role?.roleID;
      if (value === undefined || value === null) return;
      try {
        const data = await updateClaims(
          String(value),
          String(localData?.defaultCentre)
        );
        if (data?.success) {
          const {
            centreCurrency,
            centreID,
            centreName,
            defaultCentre,
            roleName,
            defaultRole,
            isStore,
          } = data?.data?.loginResponse;
          await useLocalStorage("userData", "set", {
            ...localData,
            centreCurrency,
            centreID,
            centreName,
            defaultCentre,
            roleName,
            defaultRole,
            isStore,
          });
          useLocalStorage("token", "set", data?.data?.token);
        }
        await dispatch(GetBindMenu({ RoleID: value }));
        useLocalStorage("userData", "set", {
          ...localData,
          defaultRole: value,
          roleName: data?.data?.loginResponse?.roleName,
        });
        if (data?.success) broadcastSessionChange("ROLE_CHANGED");
        navigate("/dashboard", { state: { data: "", actualUrl: "/dashboard" } });
      } catch (err) {
        console.error("Error occurred:", err);
      }
      setRoleOpen(false);
    },
    [dispatch, navigate, localData]
  );

  const name =
    localData?.empName || localData?.userName || localData?.employeeName || "User";
  const initials = (name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isDark = mode === THEMES.DARK;
  const toggleMode = () => setMode(isDark ? THEMES.LIGHT : THEMES.DARK);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: zIndex.topstrip,
        background: c.panel,
        borderBottom: `1px solid ${c.border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        minHeight: 52,
      }}
    >
      {/* Hamburger (circle outline) */}
      <button
        type="button"
        aria-label="Open menu"
        className="modern-menu-fab"
        onClick={onOpenMobile}
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: `1.5px solid ${c.accent}`,
          background: "transparent",
          color: c.accent,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <i className="fas fa-bars" style={{ fontSize: 15 }} />
      </button>

      {/* Logo */}
      <img
        src={logoitdose}
        alt="itDose"
        style={{ height: 30, width: "auto", objectFit: "contain", flexShrink: 0 }}
        onClick={() =>
          navigate("/dashboard", {
            state: { data: "", actualUrl: "/dashboard" },
          })
        }
      />

      <div style={{ flex: 1, minWidth: 0 }} />

      {/* Right actions */}
      <IconBtn
        c={c}
        icon="fas fa-home"
        color="#16a34a"
        title="Dashboard"
        onClick={() =>
          navigate("/dashboard", {
            state: { data: "", actualUrl: "/dashboard" },
          })
        }
      />
      <IconBtn
        c={c}
        icon={isDark ? "fas fa-sun" : "fas fa-moon"}
        color={c.textMuted}
        title="Toggle theme"
        onClick={toggleMode}
      />
      <IconBtn
        c={c}
        icon="fas fa-user-cog"
        color={c.accent}
        title="Change Role"
        onClick={openRolePicker}
      />
      {/* <IconBtn
        c={c}
        icon="fas fa-bell"
        color={c.textMuted}
        title="Notifications"
        badge={notifCount}
        onClick={onOpenDrawer}
      /> */}

      {/* Avatar */}
      <button
        type="button"
        aria-label="Profile"
        className="modern-menu-fab"
        onClick={onOpenDrawer}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: c.accentSoft,
          color: c.accent,
          fontWeight: 700,
          fontSize: 12.5,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {initials}
      </button>

      {createPortal(
        <RoleChangeModal
          show={roleOpen}
          GetRoleList={GetRoleList}
          onClose={() => setRoleOpen(false)}
          onRoleSelect={handleRoleSelect}
        />,
        document.body
      )}
    </header>
  );
}

function IconBtn({ c, icon, color, title, onClick, badge }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="modern-menu-fab"
      onClick={onClick}
      style={{
        position: "relative",
        width: 36,
        height: 36,
        borderRadius: 10,
        border: "none",
        background: "transparent",
        color: color || c.text,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <i className={icon} style={{ fontSize: 16 }} />
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            minWidth: 15,
            height: 15,
            padding: "0 3px",
            borderRadius: 8,
            background: "#ef4444",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            lineHeight: "15px",
            textAlign: "center",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}
