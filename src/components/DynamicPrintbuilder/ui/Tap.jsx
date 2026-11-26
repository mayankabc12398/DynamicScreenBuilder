/**
 * A clickable control that is not a <button>.
 *
 * assets/css/theme.css paints every bare `button` in the active theme's colour
 * and index.css forces its radius with !important, so inside the builder every
 * small control would turn into the same solid block. Same fix as the screen
 * builder's builder/Tap.jsx: the ROLE of a button without the tag — Enter and
 * Space by hand, `disabled` announced and swallowing the click, a ref for
 * anything anchored to it. Colour comes from a pastel `tone-*` class.
 */
import React, { forwardRef } from "react";

const Tap = forwardRef(function Tap(
  { disabled = false, onClick, onKeyDown, className = "", tone = "", active = false, children, tabIndex, title, ...rest },
  ref,
) {
  const fire = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };
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
      className={`pbx-tap${tone ? ` tone-${tone}` : ""}${active ? " is-active" : ""} ${className}`}
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
      {children}
    </span>
  );
});

export default Tap;
