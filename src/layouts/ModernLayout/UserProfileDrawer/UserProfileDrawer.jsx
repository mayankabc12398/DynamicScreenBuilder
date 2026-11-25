import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { useTheme } from "@app/hooks/useTheme";
import { zIndex } from "@app/design-system/tokens/zIndex";
import DesignSwitcher from "./DesignSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import FontSizeControl from "./FontSizeControl";
import HeaderActionsPanel from "./HeaderActionsPanel";

export default function UserProfileDrawer({ open, onClose, fontScale, setFontScale }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const localData = useLocalStorage("userData", "get") || {};

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const name = localData?.empName || "User";
  const role = localData?.roleName || "—";
  const email = localData?.emailID || localData?.EmailId || "";
  const initials = (name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return createPortal(
    <>
        <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8,15,30,.45)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .25s",
          zIndex: zIndex.overlayBackdrop,
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 380,
          maxWidth: "100vw",
          background: c.panel,
          borderLeft: `1px solid ${c.border}`,
          boxShadow: "0 30px 80px -20px rgba(8,15,30,.45)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .32s cubic-bezier(.4,0,.2,1)",
          zIndex: zIndex.drawer,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 14px",
            background: c.headerGradient,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: "linear-gradient(135deg,#FBBF24,#F59E0B)",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 14,
              color: "#7C2D12",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {role}{email ? ` · ${email}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div
          className="thin-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DesignSwitcher />
            <ThemeSwitcher />
          </div>
          <FontSizeControl value={fontScale} onChange={setFontScale} />
          <HeaderActionsPanel onClose={onClose} />
        </div>
      </aside>
    </>,
    document.body
  );
}

