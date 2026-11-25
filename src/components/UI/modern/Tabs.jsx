import React from "react";

/**
 * Tabs — segmented tab switcher (design system .hx-tabs), used on small screens
 * to switch between lists that sit side by side on desktop.
 *
 *   <Tabs value={tab} onChange={setTab}
 *         items={[{ key: "pending", label: "Pending", count: 6 }, { key: "done", label: "Done" }]} />
 */
const Tabs = ({ items = [], value, onChange, className = "" }) => (
  <div className={`hx-tabs ${className}`} role="tablist">
    {items.map((item) => (
      <button
        key={item.key}
        type="button"
        role="tab"
        aria-selected={value === item.key}
        className={`hx-tab${value === item.key ? " hx-tab--on" : ""}`}
        onClick={() => onChange?.(item.key)}
      >
        {item.icon}
        {item.label}
        {item.count !== undefined && item.count !== null ? (
          <span className="hx-count">{item.count}</span>
        ) : null}
      </button>
    ))}
  </div>
);

export default Tabs;
