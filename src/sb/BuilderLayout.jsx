/**
 * Shell of the standalone screen builder: a slim top bar with only the builder's own pages.
 *
 * Replaces the hospital app's Layout (header with centre/role pickers, the "Select Your Role"
 * modal, and the module menu bar), none of which belongs in this project. The session still
 * runs under the user's default role from login; the menu is still fetched in the background
 * (routes/RenderRoute.jsx) because live screens build their breadcrumb from it.
 */
import React from "react";
import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutAction } from "@app/store/reducers/AuthSlice/logoutSlice";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import logo from "@app/assets/image/logo.png";
import "./sb.css";

const LINKS = [
  { to: "/dynamic-screen-builder", label: "Screen Builder", icon: "pi pi-th-large" },
  { to: "/print-builder", label: "Print Builder", icon: "pi pi-print" },
  { to: "/screen-box-permission", label: "Box Permission", icon: "pi pi-lock" },
  { to: "/screen-load-monitor", label: "Load Monitor", icon: "pi pi-chart-line" },
];

export default function BuilderLayout({ children }) {
  const dispatch = useDispatch();
  const user = useLocalStorage("userData", "get") || {};

  const logOut = () =>
    dispatch(
      logoutAction({
        roleID: user?.defaultRole,
        employeeID: user?.employeeID,
        centreID: user?.centreID,
      }),
    );

  return (
    <div className="sbl-shell">
      <header className="sbl-bar">
        <NavLink to="/dynamic-screen-builder" className="sbl-brand">
          <img src={logo} alt="" />
          <span>Dynamic Screen Builder</span>
        </NavLink>
        <nav className="sbl-nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `sbl-link${isActive ? " active" : ""}`}>
              <i className={l.icon} aria-hidden="true" />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sbl-user">
          <span className="sbl-name" title={user?.roleName || ""}>
            {user?.empName || user?.userName || ""}
          </span>
          <button type="button" className="sbl-logout" onClick={logOut} title="Log out">
            <i className="pi pi-sign-out" aria-hidden="true" />
          </button>
        </div>
      </header>
      <main className="sbl-main">{children}</main>
    </div>
  );
}
