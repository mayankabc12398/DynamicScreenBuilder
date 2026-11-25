import React from "react";

/**
 * ToolbarButton — icon-above-label action button.
 * Pass `active` for toggle tools (Pan, Invert, …).
 */
export const ToolbarButton = ({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  title,
}) => (
  <button
    type="button"
    className={`hx-tool-btn ${active ? "is-active" : ""}`}
    onClick={onClick}
    disabled={disabled}
    title={title || label}
  >
    {icon}
    {label ? <span>{label}</span> : null}
  </button>
);

export const ToolbarSeparator = () => <span className="hx-toolbar__sep" />;

export const ToolbarSpacer = () => <span className="hx-toolbar__spacer" />;

/**
 * Toolbar — horizontal strip of ToolbarButtons.
 * Either pass `items` (array of ToolbarButton props, `type: "separator"` for a
 * divider) or compose children directly.
 */
const Toolbar = ({ items, children, plain = false, className = "" }) => (
  <div className={`hx-toolbar ${plain ? "hx-toolbar--plain" : ""} ${className}`}>
    {items?.map((item, index) =>
      item?.type === "separator" ? (
        <ToolbarSeparator key={`sep-${index}`} />
      ) : item?.type === "spacer" ? (
        <ToolbarSpacer key={`spacer-${index}`} />
      ) : (
        <ToolbarButton key={item?.key || item?.label || index} {...item} />
      ),
    )}
    {children}
  </div>
);

export default Toolbar;
