import React from "react";

/**
 * StatusBadge — pill label.
 * tone: "neutral" | "accent" | "success" | "warn" | "danger" | "info"
 */
const StatusBadge = ({ children, tone = "neutral", icon, title, className = "" }) => (
  <span
    className={`hx-badge ${tone !== "neutral" ? `hx-badge--${tone}` : ""} ${className}`}
    title={title}
  >
    {icon}
    {children}
  </span>
);

export default StatusBadge;
