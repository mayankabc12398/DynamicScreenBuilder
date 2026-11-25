import { useEffect, useState } from "react";
import { useTheme } from "@app/hooks/useTheme";
import Sidebar from "./Sidebar";
import ModernHeader from "./ModernHeader";
import UserProfileDrawer from "./UserProfileDrawer";
import RoleChangeShortcut from "./RoleChangeShortcut";
import "./ModernShell.css";

const FS_KEY = "modernFontScale";
const COLLAPSE_KEY = "modernSidebarCollapsed";
const WIDTH_KEY = "modernSidebarWidth";
const SIDE_KEY = "modernSidebarSide";

export default function ModernLayout({ children }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1"
  );
  const [width, setWidth] = useState(
    () => Number(localStorage.getItem(WIDTH_KEY)) || 220
  );
  const [side, setSide] = useState(
    () => localStorage.getItem(SIDE_KEY) || "left"
  );
  const [resizing, setResizing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fontScale, setFontScale] = useState(
    () => Number(localStorage.getItem(FS_KEY)) || 100
  );
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 900
  );

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, String(width));
  }, [width]);

  useEffect(() => {
    localStorage.setItem(SIDE_KEY, side);
  }, [side]);

  useEffect(() => {
    localStorage.setItem(FS_KEY, String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Publish the live sidebar width as a root CSS var so body-portaled overlays
  // (PrimeReact dialogs / frame-menu screens) can open AFTER the sidebar
  // instead of being hidden behind it. See ModernShell.css (.p-dialog-mask).
  useEffect(() => {
    const root = document.documentElement;
    const w = isMobile ? 0 : collapsed ? 72 : width || 240;
    root.style.setProperty("--modern-sidebar-l", side === "right" ? "0px" : `${w}px`);
    root.style.setProperty("--modern-sidebar-r", side === "right" ? `${w}px` : "0px");
    // publish side so body-portaled UI (e.g. the form rail) can dock opposite it
    root.dataset.modernSidebarSide = side;
    return () => {
      root.style.removeProperty("--modern-sidebar-l");
      root.style.removeProperty("--modern-sidebar-r");
      delete root.dataset.modernSidebarSide;
    };
  }, [isMobile, collapsed, width, side]);

  const handleResize = (w) => {
    setWidth(w);
    if (w < 90 && !collapsed) setCollapsed(true);
    else if (w >= 90 && collapsed) setCollapsed(false);
  };

  return (
    <div
      className="modern-shell"
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        display: "flex",
        fontFamily: "'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
      }}
    >
      {!isMobile && (
        <div className="modern-sidebar-desktop" style={{ display: "contents" }}>
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            drawerOpen={drawerOpen}
            onOpenDrawer={() => setDrawerOpen(true)}
            width={width}
            onResize={handleResize}
            resizing={resizing}
            setResizing={setResizing}
            side={side}
            setSide={setSide}
          />
        </div>
      )}

      {isMobile && mobileOpen && (
        <Sidebar
          collapsed={false}
          mobileOpen
          onCloseMobile={() => setMobileOpen(false)}
          drawerOpen={drawerOpen}
          onOpenDrawer={() => {
            setMobileOpen(false);
            setDrawerOpen(true);
          }}
          side={side}
        />
      )}

      <main className="modern-content" style={{ order: 1 }}>
        {isMobile && (
          <ModernHeader
            onOpenMobile={() => setMobileOpen(true)}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
        )}
        <div style={{ flex: 1, padding: 1, minWidth: 0 }}>{children}</div>
        <footer
          style={{
            borderTop: `1px solid ${c.border}`,
            padding: "1px 6px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 11.5,
            color: c.textMuted,
          }}
        >
          <span>© 2026 Hospedia Health Systems</span>
          <span>Modern UI · v{import.meta.env.VITE_APP_VERSION || "12.0.0"}</span>
        </footer>
      </main>

      <UserProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fontScale={fontScale}
        setFontScale={setFontScale}
      />

      {/* Ctrl/Cmd + D → Change Role modal (modern view only) */}
      <RoleChangeShortcut />
    </div>
  );
}
