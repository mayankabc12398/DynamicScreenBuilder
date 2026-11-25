import React from "react";

/**
 * ColorCodingSearch — a status swatch plus its label, used as a click-to-filter
 * legend across the worklist screens.
 *
 * Colours come from the caller; on the lab / radiology worklists they are
 * resolved through src/utils/statusPalette.js so the swatch always matches the
 * table row tint for the same status.
 */
const ColorCodingSearch = ({ color, label, onClick, marginRight, cursor }) => {
  const clickable = Boolean(onClick);

  return (
    <div
      className={`d-flex justify-content-start justify-content-md-end hx-legend ${
        clickable ? "hx-legend--clickable" : ""
      }`}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick(event);
              }
            }
          : undefined
      }
      title={clickable ? label : undefined}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "1px solid rgba(15, 23, 42, 0.18)",
          backgroundColor: color,
          marginRight: marginRight,
          cursor: cursor || (clickable ? "pointer" : undefined),
        }}
        className={`hx-legend__dot ${color}`}
      ></div>
      <label className="m-0 mx-1 text-nowrap">{label}</label>
    </div>
  );
};

export default ColorCodingSearch;
