import React from "react";

/**
 * SegmentedToggle — the bordered two-way switch used on Appointment Confirmation
 * (Table | Calendar), as a reusable component (design system .hx-seg--square).
 *
 *   <SegmentedToggle
 *     value={view}
 *     onChange={setView}
 *     items={[
 *       { key: "classic", label: t("Table"), icon: "fas fa-list-ul", title: t("Table View") },
 *       { key: "modern", label: t("Modern"), icon: "fas fa-th-large", title: t("Modern View") },
 *     ]}
 *   />
 * Pair with useViewMode(screenKey) to remember the choice in localStorage.
 */
const SegmentedToggle = ({ items = [], value, onChange, className = "" }) => (
  <span className={`hx-seg hx-seg--square ${className}`} role="group">
    {items.map((item) => (
      <button
        key={item.key}
        type="button"
        className={`hx-seg__btn${value === item.key ? " hx-seg__btn--on" : ""}`}
        onClick={() => onChange?.(item.key)}
        aria-pressed={value === item.key}
        title={item.title || item.label}
      >
        {item.icon ? <i className={item.icon} aria-hidden="true"></i> : null}
        {item.label}
      </button>
    ))}
  </span>
);

export default SegmentedToggle;
