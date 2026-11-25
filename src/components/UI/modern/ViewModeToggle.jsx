import React from "react";
import { useTranslation } from "react-i18next";

/**
 * ViewModeToggle — segmented "Classic | Modern" switch (design system .hx-seg).
 * Pair it with useViewMode so the choice is remembered in localStorage.
 *
 *   const [viewMode, setViewMode] = useViewMode("doctor.viewConsultation");
 *   <ViewModeToggle value={viewMode} onChange={setViewMode} />
 */
const ViewModeToggle = ({ value, onChange, className = "", labels }) => {
  const [t] = useTranslation();
  const tt = (s) => t(s, { defaultValue: s });
  const options = [
    { key: "classic", label: labels?.classic || tt("Classic"), icon: "fas fa-table" },
    { key: "modern", label: labels?.modern || tt("Modern"), icon: "fas fa-th-large" },
  ];
  return (
    <span className={`hx-seg ${className}`} role="group" aria-label={tt("View")}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className={`hx-seg__btn${value === o.key ? " hx-seg__btn--on" : ""}`}
          onClick={() => onChange?.(o.key)}
          aria-pressed={value === o.key}
          title={`${tt("Switch to")} ${o.label}`}
        >
          <i className={o.icon} aria-hidden="true"></i>
          {o.label}
        </button>
      ))}
    </span>
  );
};

export default ViewModeToggle;
