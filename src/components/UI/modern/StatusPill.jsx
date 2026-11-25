import React from "react";

/**
 * StatusPill — a status label with a coloured dot (design system .hx-pill).
 * One colour per status: pass the same `colour` to the pill, the legend and the
 * row accent so the reader links them at a glance.
 *
 *   <StatusPill colour="#fde68a" dot="#d97706">Hold</StatusPill>
 */
const StatusPill = ({ children, colour, dot, muted = false, title, className = "" }) => (
  <span
    className={`hx-pill${muted ? " hx-pill--muted" : ""} ${className}`}
    style={{ "--hx-pill-bg": colour, "--hx-pill-dot": dot || colour }}
    title={title}
  >
    <span className="hx-pill__dot" aria-hidden="true"></span>
    {children}
  </span>
);

/** Legend row built from [{ key, label, colour, dot }] */
export const LegendBar = ({ items = [], className = "" }) => (
  <div className={`hx-legend-bar ${className}`}>
    {items.map((item) => (
      <StatusPill key={item.key || item.label} colour={item.colour} dot={item.dot} muted>
        {item.label}
      </StatusPill>
    ))}
  </div>
);

export default StatusPill;
