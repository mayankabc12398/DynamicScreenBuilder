/**
 * A clickable control that is not a <button> — assets/css/theme.css paints
 * every bare `button` in the theme colour (same reason as the print builder's
 * ui/Tap.jsx, forked here). Enter/Space by hand, `disabled` swallows the click.
 * Colour comes from a pastel `tone-*` class; `variant` picks the shape.
 */
import React, { forwardRef } from "react";
import Icon from "./Icon";

const Tap = forwardRef(function Tap(
  { disabled = false, onClick, onKeyDown, className = "", tone = "", variant = "", icon, iconSize = 15, active = false, children, tabIndex, title, ...rest },
  ref,
) {
  const fire = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };
  const cls = ["nfb-tap", variant && `v-${variant}`, tone && `tone-${tone}`, active && "is-active", !children && icon && "is-icon", className].filter(Boolean).join(" ");
  return (
    <span
      {...rest}
      ref={ref}
      role="button"
      title={title}
      aria-label={rest["aria-label"] || title}
      tabIndex={disabled ? -1 : tabIndex ?? 0}
      aria-disabled={disabled || undefined}
      aria-pressed={active ? true : rest["aria-pressed"]}
      className={cls}
      onClick={fire}
      onKeyDown={(e) => {
        if (onKeyDown) onKeyDown(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fire(e);
        }
      }}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </span>
  );
});

export default Tap;
