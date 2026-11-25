import { useState } from "react";
import { useTheme } from "@app/hooks/useTheme";
import { zIndex } from "@app/design-system/tokens/zIndex";
import SidebarBrand from "./SidebarBrand";
import SidebarSearch from "./SidebarSearch";
import SidebarNav from "./SidebarNav";
import SidebarSearchResults from "./SidebarSearchResults";
import SidebarFooter from "./SidebarFooter";
import { useMenuData, filterMenu } from "./useMenuData";
import { useActiveMenuUrl } from "@app/layouts/menu-sidebar/useActiveMenuUrl";

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  drawerOpen,
  onOpenDrawer,
  mobileOpen,
  onCloseMobile,
  width,
  onResize,
  resizing,
  setResizing,
  side,
  setSide,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const groups = useMenuData();
  const [query, setQuery] = useState("");
  const visible = filterMenu(groups, query);
  // resolved against the full menu, not the search-filtered one
  const activeUrl = useActiveMenuUrl(groups);

  // Force-remount nav when menu identity changes (e.g. after role change)
  const navVersion = groups
    .map((g) => `${g.label}|${g.children.length}`)
    .join(">");

  const effectiveWidth = mobileOpen ? 264 : collapsed ? 72 : width || 220;

  const inner = (
    <aside
      style={{
        width: effectiveWidth,
        flexShrink: 0,
        height: "100vh",
        maxHeight: "100dvh",
        position: mobileOpen ? "static" : "sticky",
        top: 0,
        background: c.panel,
        borderRight: side === "left" ? `1px solid ${c.border}` : "none",
        borderLeft: side === "right" ? `1px solid ${c.border}` : "none",
        display: "flex",
        flexDirection: "column",
        transition: resizing ? "none" : "width .28s cubic-bezier(.4,0,.2,1)",
        zIndex: zIndex.sidebar,
        order: side === "right" ? 2 : 0,
      }}
    >
      <SidebarBrand
        collapsed={!mobileOpen && collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={onCloseMobile}
        pin={
          !mobileOpen && setSide
            ? {
                side,
                setSide,
                collapsed,
                onToggleCollapse,
                width: effectiveWidth,
              }
            : null
        }
      />
      {!collapsed || mobileOpen ? (
        <SidebarSearch value={query} onChange={setQuery} />
      ) : null}
      <div
        className="thin-scroll"
        style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
      >
        <SidebarNav
          key={navVersion}
          groups={visible}
          activeUrl={activeUrl}
          collapsed={!mobileOpen && collapsed}
          query={query}
          onChildClick={onCloseMobile}
        />
        {!collapsed || mobileOpen ? (
          <SidebarSearchResults
            groups={groups}
            query={query}
            onPick={() => {
              setQuery("");
              onCloseMobile?.();
            }}
          />
        ) : null}
      </div>
      <SidebarFooter
        collapsed={!mobileOpen && collapsed}
        drawerOpen={drawerOpen}
        onTrigger={onOpenDrawer}
      />
    </aside>
  );

  if (mobileOpen) {
    return (
      <div
        className="modern-drawer-backdrop"
        onClick={onCloseMobile}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: zIndex.drawer,
          background: "rgba(0,0,0,.5)",
          display: "flex",
          justifyContent: side === "right" ? "flex-end" : "flex-start",
        }}
      >
        <div
          className={`modern-drawer-panel ${
            side === "right" ? "from-right" : "from-left"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {inner}
        </div>
      </div>
    );
  }

  return inner;
}
