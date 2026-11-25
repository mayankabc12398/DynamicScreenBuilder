import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleModernSidebar, toggleSidebarMenu } from "@app/store/reducers/ui";
import { removeWindowClass } from "@app/utils/helpers";
import Header from "@app/layouts/header/Header";
import Footer from "@app/layouts/footer/Footer";
import ModernSidebar from "./ModernSidebar";
import "./modernLayout.css";

/**
 * ModernLayout — enterprise healthcare ERP shell (Phase 1: master layout).
 *
 * Composition: collapsible left <ModernSidebar /> + a topbar that REUSES the
 * existing classic <Header /> (so every header feature — centre/role, role
 * modal, set-default-role, font size, theme, home, overlay, fullscreen, voice,
 * language, Google, email, profile, logout, layout switch — is present and
 * behaves identically). The topbar is restyled
 * to the clean light look via scoped CSS. Reusing Header (instead of a custom
 * one) is also what keeps Classic↔Modern switching stable.
 */
const ModernLayout = ({ children }) => {
  const dispatch = useDispatch();
  const collapsed = useSelector((state) => state.ui.modernSidebarCollapsed);
  const mobileOpen = useSelector((state) => state.ui.menuSidebarCollapsed);
  const screenSize = useSelector((state) => state.ui.screenSize);
  const modernTheme = useSelector((state) => state.ui.modernTheme);
  const isMobile = ["xs", "sm"].includes(screenSize);

  // Clear any AdminLTE body classes the classic shell may have left behind so a
  // runtime layout switch doesn't shift the modern page.
  useEffect(() => {
    [
      "sidebar-collapse",
      "sidebar-closed",
      "sidebar-open",
      "register-page",
      "login-page",
      "hold-transition",
    ].forEach(removeWindowClass);
  }, []);

  const shellClass = [
    "modern-layout",
    modernTheme === "dark" ? "theme-dark" : "theme-light",
    collapsed ? "ml-collapsed" : "",
    isMobile ? "ml-mobile" : "",
    isMobile && mobileOpen ? "ml-drawer-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      {isMobile && mobileOpen && (
        <div
          className="ml-overlay"
          role="presentation"
          onClick={() => dispatch(toggleSidebarMenu())}
          onKeyDown={() => {}}
        />
      )}

      <ModernSidebar />

      {/* A click anywhere in the main area (page or top bar) folds an open desktop sidebar back to its
          icon rail. Popups render outside .ml-main, so working in a dialog never closes the menu.
          The centre / role selectors and Home / Quick buttons are rendered by <Header/> but portaled into
          the sidebar; React bubbles their events through .ml-main, so only count a click whose DOM target
          really is inside .ml-main. */}
      <div
        className="ml-main"
        onMouseDown={(e) => {
          if (isMobile || collapsed) return;
          if (!e.currentTarget.contains(e.target)) return;
          dispatch(toggleModernSidebar());
        }}
      >
        <div className="ml-topbar">
          <Header />
        </div>

        <main className="ml-content" id="page-data">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default ModernLayout;
