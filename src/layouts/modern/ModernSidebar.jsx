import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { MENU } from "@app/layouts/menu-sidebar/MenuSidebar";
import {
  toggleModernSidebar,
  toggleSidebarMenu,
} from "@app/store/reducers/ui";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import {
  sourceItemNavigation,
  useSourceSearchResults,
} from "@app/layouts/menu-sidebar/menuSearchSources";
import ModernQuickActions from "./ModernQuickActions";
import logo from "@app/assets/image/logo.png";

const Version = import.meta.env.VITE_APP_VERSION;

/**
 * ModernSidebar — collapsible module navigation.
 *  - Expanded: icon + text, with inline-expanding submenus.
 *  - Collapsed: icon-only rail; labels via tooltip; clicking expands the rail.
 *
 * Data + behaviour parity with the classic menu: source is
 * MENU.commonComponent + CommonSlice.GetMenuList (role-bound API). Navigation
 * preserves the router-state contract { data, subMenuID, actualUrl } and the
 * classic active-route detection.
 */
const ModernSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [t] = useTranslation();
  const localData = useLocalStorage("userData", "get");

  const collapsed = useSelector((state) => state.ui.modernSidebarCollapsed);
  const screenSize = useSelector((state) => state.ui.screenSize);
  const { GetMenuList } = useSelector((state) => state.CommonSlice);

  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState({});

  const isMobile = ["xs", "sm"].includes(screenSize);
  // On a mobile drawer the labels must always show, even if the desktop
  // collapse flag is set.
  const showLabels = !collapsed || isMobile;

  const menu = useMemo(
    () =>
      GetMenuList?.length
        ? [...MENU.commonComponent, ...GetMenuList]
        : [...MENU.commonComponent],
    [GetMenuList],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return menu;
    return menu
      .map((cat) => {
        const kids = cat.children?.filter((c) =>
          (c.childrenName || "").toLowerCase().includes(q),
        );
        return kids?.length ? { ...cat, children: kids } : null;
      })
      .filter(Boolean);
  }, [menu, query]);

  // Master Configuration steps / reports matching the query (pages in this
  // role's menu only), listed under the menu matches.
  const sourceResults = useSourceSearchResults(
    menu.flatMap((cat) => cat.children || []),
    query,
  );

  const groupName = (cat) => t(cat.menuName || cat.name || "");
  const groupIcon = (cat) => cat.menuIcon || cat.icon || "fas fa-folder";

  const isChildActive = (child) => {
    const actual = child?.actualUrl?.toLowerCase();
    const url = child?.url?.toLowerCase();
    const stateActual = location?.state?.actualUrl?.toLowerCase();
    const path = location?.pathname?.toLowerCase();
    return (actual && actual === stateActual) || (url && url === path);
  };

  // Auto-open the group owning the active route.
  useEffect(() => {
    const next = {};
    filtered.forEach((cat, index) => {
      if (cat.children?.some(isChildActive)) next[index] = true;
    });
    if (Object.keys(next).length) {
      setOpenGroups((prev) => ({ ...prev, ...next }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, GetMenuList]);

  const handleGroupClick = (index) => {
    if (collapsed && !isMobile) {
      // From the icon rail: expand the rail and open this group.
      dispatch(toggleModernSidebar());
      setOpenGroups((prev) => ({ ...prev, [index]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNavigate = (child) => {
    navigate(child.url, {
      state: {
        data: child.breadcrumb,
        subMenuID: child.subMenuID,
        actualUrl: child.actualUrl,
      },
    });
    if (isMobile) dispatch(toggleSidebarMenu());
  };

  const handleSourceNavigate = (item) => {
    navigate(...sourceItemNavigation(item));
    setQuery("");
    if (isMobile) dispatch(toggleSidebarMenu());
  };

  return (
    <aside className="modern-sidebar">
      {/* Brand */}
      <div className="ml-brand">
        <img src={logo} alt="HOSPEDIA" className="ml-brand-logo" />
        {showLabels && (
          <div className="ml-brand-text">
            <span className="ml-brand-name">
              {localData?.organizationName || t("HOSPEDIA V12")}
            </span>
            {localData?.centreName && (
              <span className="ml-brand-sub">{localData.centreName}</span>
            )}
          </div>
        )}
        <button
          type="button"
          className="ml-collapse-btn"
          onClick={() =>
            isMobile
              ? dispatch(toggleSidebarMenu())
              : dispatch(toggleModernSidebar())
          }
          title={collapsed ? t("Expand menu") : t("Collapse menu")}
        >
          <i className="fas fa-bars" />
        </button>
      </div>

      {/* Hospital + Role selectors (portaled here from <Header/> in Modern).
          Always rendered so the portal target is stable; hidden when collapsed. */}
      <ul id="modern-selects-slot" className="ml-side-selects" />

      {/* Change-Role + Set-Default quick buttons (portaled from <Header/>),
          shown just before the Search Menu box. */}
      <ul id="modern-topactions-slot" className="ml-side-topactions" />

      {/* Search */}
      {showLabels && (
        <div className="ml-search">
          <i className="fa fa-search ml-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search menu")}
            aria-label={t("Search menu")}
          />
          {query && (
            <i
              className="fa fa-times ml-search-clear"
              aria-hidden="true"
              onClick={() => setQuery("")}
            />
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="ml-nav">
        {filtered?.map((cat, index) => {
          const isOpen = query.trim() ? true : !!openGroups[index];
          const activeGroup = cat.children?.some(isChildActive);
          const hasChildren = cat.children?.length > 0;
          return (
            <div
              className={`ml-group ${activeGroup ? "active" : ""} ${
                isOpen ? "open" : ""
              }`}
              key={`${cat.menuName || cat.name}-${index}`}
            >
              <button
                type="button"
                className="ml-group-head"
                onClick={() => handleGroupClick(index)}
                title={!showLabels ? groupName(cat) : undefined}
              >
                <span className="ml-group-icon-wrap">
                  <i className={`${groupIcon(cat)} ml-group-icon`} />
                </span>
                {showLabels && (
                  <span className="ml-group-label">{groupName(cat)}</span>
                )}
                {showLabels && hasChildren && (
                  <i
                    className={`fas fa-chevron-${
                      isOpen ? "down" : "right"
                    } ml-chevron`}
                  />
                )}
              </button>

              {showLabels && isOpen && hasChildren && (
                <ul className="ml-sublist">
                  {cat.children.map((child, j) => (
                    <li key={`${child.childrenName}-${j}`}>
                      <button
                        type="button"
                        className={`ml-subitem ${
                          isChildActive(child) ? "active" : ""
                        }`}
                        onClick={() => handleNavigate(child)}
                        title={t(child.childrenName)}
                      >
                        <span className="ml-dot" />
                        <span className="ml-sub-label">
                          {t(child.childrenName)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {showLabels &&
          sourceResults.map((group) => (
            <div className="ml-group open" key={`source-${group.id}`}>
              <div className="ml-group-head" style={{ cursor: "default" }}>
                <span className="ml-group-icon-wrap">
                  <i className="fas fa-search ml-group-icon" />
                </span>
                <span className="ml-group-label">{group.title}</span>
              </div>
              <ul className="ml-sublist">
                {group.items.map((item, j) => (
                  <li key={`${item.label}-${item.category}-${j}`}>
                    <button
                      type="button"
                      className="ml-subitem"
                      onClick={() => handleSourceNavigate(item)}
                      title={`${item.label} — ${item.category}`}
                    >
                      <span className="ml-dot" />
                      <span className="ml-sub-label">
                        {item.label}
                        {item.category !== group.title && (
                          <small className="d-block text-muted">{item.category}</small>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </nav>

      {/* Footer: Quick Actions (hosts the relocated header action icons),
          then the user profile as a separate option, then version. */}
      <div className="ml-side-footer">
        <ModernQuickActions
          align="side"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              className={`ml-qa-side-btn ${open ? "open" : ""}`}
              onClick={toggle}
              title={t("Quick Actions")}
            >
              <i className="fas fa-bolt" />
              {showLabels && <span>{t("Quick Actions")}</span>}
            </button>
          )}
        />

        {/* Portal target: the classic <Header/>'s profile + logout render here */}
        <ul id="modern-profile-slot" className="ml-side-profile" />

        {showLabels && (
          <div className="ml-side-version">
            © {new Date().getFullYear()}{" "}
            {localData?.organizationName || t("HOSPEDIA")} · v{Version || "12"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default ModernSidebar;
