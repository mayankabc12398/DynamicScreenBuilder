/** Always-visible "which backend / which database" pill, bottom right. */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { activeApiBase } from "./connection";
import "./sb.css";

export default function ConnectionChip() {
  const { pathname } = useLocation();
  if (pathname === "/connect" || pathname.startsWith("/screen/")) return null;

  return (
    <div className="sbc-chip" title={activeApiBase()}>
      <span>API: {activeApiBase().replace(/^https?:\/\//, "")}</span>
      <Link to="/connect">change</Link>
    </div>
  );
}
