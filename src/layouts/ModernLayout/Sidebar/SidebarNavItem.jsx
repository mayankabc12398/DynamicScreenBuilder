import { memo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@app/hooks/useTheme";
import { applyRootThemeClass } from "@app/utils/helpers";
import SidebarTip, { makeTip } from "./SidebarTip";

// position the collapsed flyout to the side of the icon, flipping if near the edge
function positionFlyout(r) {
  const W = 224;
  const openLeft = r.left > window.innerWidth - W - 24;
  return { top: r.top, left: openLeft ? r.left - W - 8 : r.right + 8 };
}

function applyThemeClass() {
  // modern → sky_blue_theme, legacy → stored theme (single source of truth)
  applyRootThemeClass();
}

// Active-state — same as the Old View (DesktopMenuItem): `activeUrl` comes from
// useActiveMenuUrl (resolved once in Sidebar), which resolves to a single
// actualUrl, so exactly one child (and thus one parent group) is ever active.
function childIsActive(activeUrl, child) {
  if (!activeUrl || !child?.actualUrl) return false;
  return activeUrl === String(child.actualUrl).toLowerCase();
}

function childNavState(child) {
  return {
    data: child.breadcrumb || "",
    subMenuID: child.subMenuID,
    actualUrl: child.actualUrl || child.url,
  };
}

function SidebarNavItem({ group, activeUrl, collapsed, defaultOpen, forceOpen, onChildClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [t] = useTranslation();
  const groupActive = group.children.some((ch) => childIsActive(activeUrl, ch));
  const [open, setOpen] = useState(defaultOpen || groupActive);
  const [tip, setTip] = useState(null);
  const btnRef = useRef(null);
  const [flyout, setFlyout] = useState(null); // {top,left} when open in collapsed mode

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  // collapsed flyout: close when sidebar expands
  useEffect(() => {
    if (!collapsed) setFlyout(null);
  }, [collapsed]);

  // collapsed flyout: close on outside click / Escape
  useEffect(() => {
    if (!flyout) return;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-sb-flyout]")) return;
      setFlyout(null);
    };
    const onEsc = (e) => e.key === "Escape" && setFlyout(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [flyout]);

  const iconClass = group.icon || "fas fa-folder";

  // Per-group color coding: soft badge bg + saturated icon color.
  // Stable per group (hashed from label) so each menu keeps its own color.
  const ICON_PALETTE = [
    { bg: "#EEF0FF", fg: "#5B5BD6" }, // indigo
    { bg: "#E6F7F1", fg: "#0F9D74" }, // green
    { bg: "#FFF0E6", fg: "#E8590C" }, // orange
    { bg: "#FCE9F1", fg: "#D6336C" }, // pink
    { bg: "#E7F5FF", fg: "#1C7ED6" }, // blue
    { bg: "#FFF4E0", fg: "#F08C00" }, // amber
    { bg: "#F0EAFB", fg: "#7C3AED" }, // violet
    { bg: "#E6FCF5", fg: "#0CA678" }, // teal
    { bg: "#FFE9E9", fg: "#E03131" }, // red
    { bg: "#EAF3E9", fg: "#2F9E44" }, // leaf
  ];
  const hashKey = String(group.label || iconClass);
  let hash = 0;
  for (let i = 0; i < hashKey.length; i++) hash = (hash * 31 + hashKey.charCodeAt(i)) >>> 0;
  const iconColor = ICON_PALETTE[hash % ICON_PALETTE.length];

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          if (collapsed) {
            setTip(null);
            const r = e.currentTarget.getBoundingClientRect();
            setFlyout((f) => (f ? null : positionFlyout(r)));
          } else {
            setOpen((o) => !o);
          }
        }}
        className={`${groupActive ?"background-theme-colornew text-theme-colornew":""}`}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: collapsed ? "10px 0" : "8px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: "transparent",
          marginBottom:"2px",
          color: groupActive ? undefined : "hsl(220 12% 48%)",
          fontWeight: groupActive ? 600 : 500,
          fontSize: "0.9375rem",
          letterSpacing: "-0.01em",
          transition: "background .2s",
          // boxShadow: groupActive ? "0 6px 16px -6px rgba(20,184,166,.55)" : "none",
          fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: "left",
        }}
        onMouseEnter={(e) => {
          if (!groupActive) e.currentTarget.style.background = c.accentSoft;
          setTip(
            makeTip(e.currentTarget, t(group.label), {
              onlyIfTruncated: !collapsed,
              placement: collapsed ? "side" : "above",
            })
          );
        }}
        onMouseLeave={(e) => {
          if (!groupActive) e.currentTarget.style.background = "transparent";
          setTip(null);
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: 6,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: iconColor.bg,
            color: iconColor.fg,
            boxShadow: groupActive ? `0 0 0 1.5px ${iconColor.fg}33` : "none",
            transition: "box-shadow .2s",
          }}
        >
          <i className={iconClass} style={{ fontSize: "0.8125rem", lineHeight: 1 }} />
        </span>
        {!collapsed && (
          <>
            <span data-label style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t(group.label)}
            </span>
            <i
              className="fas fa-chevron-down"
              style={{
                fontSize: "0.75rem",
                opacity: 0.7,
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform .2s",
              }}
            />
          </>
        )}
      </button>

      {open && !collapsed && (
        <div
          style={{
            marginLeft: 14,
            marginTop: 2,
            paddingLeft: 14,
            borderLeft: `1.5px solid ${c.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {group.children.map((ch) => {
            const isActive = childIsActive(activeUrl, ch);
            return (
              <NavLink
                key={ch.url || ch.label}
                to={ch.url || "#"}
                state={childNavState(ch)}
                onClick={(e) => {
                  applyThemeClass();
                  if (onChildClick) onChildClick(e);
                }}
                end
                className={() => (isActive ? "background-theme-colornew text-theme-colornew" : "transparent")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "left",
                  padding: "7px 10px",
                  borderRadius: 8,
                  textDecoration: "none",
                  // child NavLink style
                  color: isActive ? undefined : "hsl(220 12% 48%)",
                  // background: isActive ? c.accentSoft : "transparent",
                  // color: isActive ? c.accent : c.textMuted,
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.875rem",
                  letterSpacing: "-0.01em",
                  fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = c.accentSoft;
                  setTip(
                    makeTip(e.currentTarget, t(ch.label), {
                      onlyIfTruncated: true,
                    })
                  );
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                  setTip(null);
                }}
              >
                {ch.icon && <i className={ch.icon} style={{ fontSize: "0.8333rem", opacity: 0.7, width: 12 }} />}
                <span data-label style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t(ch.label)}
                </span>
              </NavLink>
            );
          })}
        </div>
      )}
      <SidebarTip tip={tip} />

      {collapsed && flyout &&
        createPortal(
          <div
            data-sb-flyout
            style={{
              position: "fixed",
              top: flyout.top,
              left: flyout.left,
              zIndex: 99999,
              width: 224,
              maxHeight: "70vh",
              overflowY: "auto",
              background: c.panel,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              boxShadow: "0 18px 44px rgba(8,14,26,.4)",
              padding: 6,
              fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            <div
              style={{
                padding: "6px 10px 8px",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.3,
                color: c.textMuted,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {t(group.label)}
            </div>
            {group.children.map((ch) => {
              const isActive = childIsActive(activeUrl, ch);
              return (
                <NavLink
                  key={ch.url || ch.label}
                  to={ch.url || "#"}
                  state={childNavState(ch)}
                  onClick={(e) => {
                    applyThemeClass();
                    if (onChildClick) onChildClick(e);
                    setFlyout(null);
                  }}
                  end
                  className={() => (isActive ? "background-theme-colornew text-theme-colornew" : "")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 10px",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: isActive ? undefined : "hsl(220 12% 40%)",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = c.accentSoft;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {ch.icon && <i className={ch.icon} style={{ fontSize: 12, opacity: 0.7, width: 14 }} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t(ch.label)}
                  </span>
                </NavLink>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

export default memo(SidebarNavItem);
