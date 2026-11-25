import React from "react";

/**
 * ActionButton — design-system button.
 * variant: "default" | "primary" | "solid" | "success" | "danger"
 */
const ActionButton = ({
  children,
  icon,
  onClick,
  variant = "default",
  size,
  block = false,
  disabled = false,
  loading = false,
  title,
  type = "button",
  className = "",
}) => (
  <button
    type={type}
    title={title}
    onClick={onClick}
    disabled={disabled || loading}
    className={[
      "hx-btn",
      variant !== "default" ? `hx-btn--${variant}` : "",
      size === "sm" ? "hx-btn--sm" : "",
      block ? "hx-btn--block" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {loading ? <span className="hx-spinner hx-spinner--sm" /> : icon}
    {children}
  </button>
);

export default ActionButton;
