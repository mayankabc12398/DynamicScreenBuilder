import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AadhaarOcrFab({ onClick, isDisabled = false }) {
  const [t] = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <div style={styles.fabWrap}>
        {showTooltip && (
          <div style={styles.tooltip}>
            {t("Scan Aadhaar")}
          </div>
        )}

        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          title={t("Scan Aadhaar")}
          style={{
            ...styles.fab,
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          <svg viewBox="0 0 24 24" style={styles.icon}>
            <path
              fill="#15803d"
              d="M4 5a2 2 0 0 1 2-2h3v2H6v3H4V5zm10-2h4a2 2 0 0 1 2 2v3h-2V5h-4V3zM4 16h2v3h3v2H6a2 2 0 0 1-2-2v-3zm14 0h2v3a2 2 0 0 1-2 2h-4v-2h4v-3zM7 8h10v8H7V8zm2 2v4h6v-4H9z"
            />
          </svg>
        </button>
      </div>
    </>
  );
}

const styles = {
  fabWrap: {
    // position: "fixed",
    // bottom: "32px",
    // right: "108px",
    zIndex: 1,
    display: "inline-flex",
    verticalAlign: "middle",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dcfce7",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    transition: "transform 0.15s, box-shadow 0.3s",
    outline: "none",
    position: "relative",
    zIndex: 2,
  },
  icon: {
    width: "18px",
    height: "18px",
  },
  tooltip: {
    position: "absolute",
    bottom: "22px",
    right: "0",
    background: "#1a202c",
    color: "#e2e8f0",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
    zIndex: 3,
  },
};
