import { Tooltip } from "primereact/tooltip";
import React, { useCallback, useContext } from "react";
import { DesignContext } from "@app/providers/DesignProvider";

function LabeledInput({ label, value, className, style = {}, isClickable = false, substringEnd = 27, isNote = false, PatientType }) {
  const isMobile = window.innerWidth <= 768;
  const { isModern } = useContext(DesignContext);
  const renderValue = useCallback(
    (value) => {
      if (value?.length > substringEnd) {
        return (
          <>
            <Tooltip
              target={`#labelInput-${label?.replace(/[^A-Za-z0-9]+/g, "")}`}
              position="top"
              content={value}
              event="hover"
            />
            <div className="labelPicker">{label}</div>
            <div
              className={`${isClickable ? "clickable" : ""} ${PatientType === "VIP" ? "masked-text-Input-value valueName" : "valueName"}`}
              // style={ isNote ? { color: "red" } : "" }

              id={`labelInput-${label.replace(/[^A-Za-z0-9]+/g, "")}`}
            >
              {value.substring(0, substringEnd) + "..."}
            </div>
          </>
        );
      } else {
        return (
          <div className={isMobile ? "mb-2" : "mb-2"}>
            <div className="labelPicker">{label}</div>
            <div className={`${isClickable ? "clickable" : ""} ${PatientType === "VIP" ? "masked-text-Input-value valueName" : "valueName"}`} style={isNote ? { color: "red", fontWeight: "400" } : style}>
              {value}
            </div>
          </div>
        );
      }
    },
    [value]
  );

  if (isModern) {
    const isMasked = PatientType === "VIP";
    const v = value ?? "";
    const isTruncated = typeof v === "string" && v.length > substringEnd;
    const displayValue = isTruncated ? v.substring(0, substringEnd) + "..." : v;
    const valueClass = `${isClickable ? "clickable" : ""} ${isMasked ? "masked-text-Input-value valueName" : "valueName"}`.trim();
    const tipId = `labelInput-${String(label || "").replace(/[^A-Za-z0-9]+/g, "")}`;
    const hasValue = v !== "" && v != null;

    return (
      <div className={className} style={{ ...style, marginTop: 2, marginBottom: 4 }}>
        {isTruncated && (
          <Tooltip target={`#${tipId}`} position="top" content={String(v)} event="hover" />
        )}
        <div className="aurora-frozen-field" style={{ position: "relative" }}>
          <label
            htmlFor={tipId}
            className="label"
            style={{
              position: "absolute",
              top: -4,
              left: 6 ,
              zIndex: 1,
              padding: "0 3px",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--aurora-text-muted, #6b7280)",
              background: "var(--aurora-surface, #fff)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}
          >
            {label}
          </label>
          <div
            id={tipId}
            title={isTruncated ? String(v) : undefined}
            className={`value ${valueClass}`.trim()}
            style={{
              // match modern Input/Select height (--mi-height / --rs-height: 2.25rem)
              height: "2.0833rem",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              fontSize: 13,
              color: isNote ? "#DC2626" : "var(--aurora-text, #1f2937)",
              background: "rgba(16, 185, 129, 0.05)",
              borderLeft: "3px solid var(--aurora-accent, #10b981)",
              borderRadius: 5,
              cursor: isClickable ? "pointer" : "default",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: "inherit",
            }}
          >
            {hasValue ? displayValue : "—"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      {renderValue(value)}
    </div>
  );
}

export default LabeledInput;
