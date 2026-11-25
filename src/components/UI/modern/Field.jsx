import React from "react";

/**
 * Field — label + control wrapper using design-system spacing.
 * Wrap any control (native input, ReactSelect, slider, …).
 */
export const Field = ({ label, htmlFor, children, className = "", hint }) => (
  <div className={`hx-field ${className}`}>
    {label ? (
      <label className="hx-field__label" htmlFor={htmlFor}>
        {label}
      </label>
    ) : null}
    {children}
    {hint ? <span className="hx-muted">{hint}</span> : null}
  </div>
);

/**
 * RangeSlider — labelled range input with the live value on the right.
 */
export const RangeSlider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "%",
  id,
}) => (
  <Field label={label} htmlFor={id}>
    <div className="hx-range">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
      <span className="hx-range__value">
        {value}
        {suffix}
      </span>
    </div>
  </Field>
);

/**
 * MetaStrip — compact read-only label/value pairs.
 * items: [{ label, value }]
 */
export const MetaStrip = ({ items = [], className = "" }) => (
  <div className={`hx-meta-strip ${className}`}>
    {items.map((item, index) => (
      <div className="hx-meta-item" key={`${item?.label || index}-${index}`}>
        <span className="hx-meta-item__label">{item?.label}</span>
        <span className="hx-meta-item__value" title={item?.value || "-"}>
          {item?.value || "-"}
        </span>
      </div>
    ))}
  </div>
);

/**
 * SectionTitle — small underlined heading inside a panel.
 */
export const SectionTitle = ({ children, right, className = "" }) => (
  <div className={`hx-section-title ${className}`}>
    <span>{children}</span>
    {right}
  </div>
);

/**
 * EmptyState — placeholder for "nothing yet" and loading states.
 */
export const EmptyState = ({ icon, title, description, loading = false }) => (
  <div className="hx-empty">
    {loading ? <span className="hx-spinner" /> : icon ? <span className="hx-empty__icon">{icon}</span> : null}
    {title ? <div>{title}</div> : null}
    {description ? <div className="hx-muted">{description}</div> : null}
  </div>
);

export default Field;
