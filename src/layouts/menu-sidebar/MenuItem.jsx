import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { confirmLeave } from "../../utils/leaveGuard";

const MenuItem = ({ menuItem, isSearched }) => {
  const [t] = useTranslation();
  const [isMenuExtended, setIsMenuExtended] = useState(isSearched);
  const [isExpandable, setIsExpandable] = useState(isSearched);
  const [isMainActive, setIsMainActive] = useState(false);
  const [isOneOfChildrenActive, setIsOneOfChildrenActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuExtended(!isMenuExtended);
  };

  const handleMainMenuAction = () => {
    if (isExpandable) {
      toggleMenu();
      return;
    }
    if (!confirmLeave()) return;
    navigate(menuItem.url ? menuItem.url : "/");
  };

  const calculateIsActive = (url) => {
    const currentPath = (url?.state?.actualUrl || url?.pathname)?.toLowerCase();
    const currentSubMenuID = url?.state?.subMenuID;

    let mainActive = false;
    let oneOfChildrenActive = false;

    if (isExpandable && menuItem && menuItem.children) {
      menuItem.children.forEach((item) => {
        const itemPath = (item?.actualUrl || item?.url || item?.Url)?.toLowerCase();

        // Match if subMenuID matches (most specific)
        const isSubMenuMatch = currentSubMenuID && item?.subMenuID === currentSubMenuID;
        // Fallback to URL matching if subMenuID is not in state
        const isUrlMatch = itemPath === currentPath || (itemPath && currentPath?.startsWith(itemPath));

        if (isSubMenuMatch || (isUrlMatch && !currentSubMenuID) || isSearched) {
          oneOfChildrenActive = true;
        }
      });
    } else {
      const menuItemPath = (menuItem?.url || menuItem?.path)?.toLowerCase();
      if (menuItemPath === currentPath || (menuItemPath && currentPath?.startsWith(menuItemPath))) {
        mainActive = true;
      }
    }

    // Single source of truth: commit all derived state in one pass so there is
    // no transient all-false window for a separate effect to react to (no blink).
    setIsMainActive(mainActive);
    setIsOneOfChildrenActive(oneOfChildrenActive);
    setIsMenuExtended(oneOfChildrenActive || isSearched);
  };

  useEffect(() => {
    if (location) {
      calculateIsActive(location);
    }
  }, [location, isExpandable, menuItem, isSearched]);

  useEffect(() => {
    setIsExpandable(
      Boolean(menuItem && menuItem.children && menuItem.children.length > 0)
    );
  }, [menuItem]);


  return (
    <li className={`nav-item ${isMenuExtended ? "menu-open" : ""}`} key={menuItem?.menuID}>
      <a
        className={`nav-link ${isMainActive || isOneOfChildrenActive ? "active" : ""}`}
        role="link"
        onClick={handleMainMenuAction}
        style={{ cursor: "pointer", margin: 0 }}
      >
        <i className={`${menuItem.menuName === "DASHBOARD" ? "fas fa-tachometer-alt nav-icon" : menuItem.menuIcon} nav-icon mr-2`} />
        <p>{t(menuItem.menuName)}</p>
        {isExpandable ? <i className="right fas fa-angle-left" /> : null}
      </a>
      <ul className="nav nav-treeview nav-link pl-4 pt-1">
        {isExpandable &&
          menuItem &&
          menuItem.children &&
          menuItem.children.map((item) => (
            <li className="nav-item" key={item.childrenName}>

              <NavLink
                className={({ isActive }) => {
                  const currentPath = (location?.state?.actualUrl || location?.pathname)?.toLowerCase();
                  const currentSubMenuID = location?.state?.subMenuID;
                  const itemPath = (item?.actualUrl || item?.url || item?.Url)?.toLowerCase();

                  const isSubMenuMatch = currentSubMenuID && item?.subMenuID === currentSubMenuID;
                  const isUrlMatch = itemPath === currentPath || (itemPath && currentPath.startsWith(itemPath));

                  const isReallyActive = isSubMenuMatch || (isUrlMatch && !currentSubMenuID);

                  return `nav-link rounded ${isReallyActive ? "active" : ""}`;
                }}
                to={`${item.url || item.Url}`}
                state={{
                  data: item?.BreadCrumb || item?.breadcrumb,
                  actualUrl: item?.actualUrl,
                  subMenuID: item?.subMenuID
                }}
              >
                <i className={`${item?.subMenuIcon || "fas fa-tachometer-alt"} nav-icon mr-2`} />
                <p>{t(item.childrenName)}</p>
              </NavLink>
            </li>
          ))}
      </ul>
    </li>
  );
};

export default MenuItem;
