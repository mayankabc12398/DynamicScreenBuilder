/**
 * A clickable control that is not a <button>.
 *
 * The app this builder lives in paints every bare `button` in the active
 * theme's colour (`.default_theme button { background-color: … }` in
 * assets/css/theme.css) and forces its radius with `!important`. Inside the
 * inspector that turned every small control — the eye, the list/record
 * toggles, Add a key, the trash can — into the same solid block, and the
 * builder's own styling could not win against it.
 *
 * So the dense panels use this instead: the ROLE of a button without the tag.
 * The keyboard gets Enter and Space back by hand, `disabled` is announced and
 * swallows the click, and a ref reaches the element for anything that anchors
 * a popover to it or hands focus back to it.
 */
import React, { forwardRef } from "react";

const Tap = forwardRef(function Tap(
  { disabled = false, onClick, onKeyDown, className = "", children, tabIndex, ...rest },
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
      tabIndex={disabled ? -1 : tabIndex ?? 0}
      aria-disabled={disabled || undefined}
      className={`dsbi-tap ${className}`}
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
