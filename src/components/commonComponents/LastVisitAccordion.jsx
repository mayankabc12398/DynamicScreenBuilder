import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const LastVisitAccordion = ({ getLastDetail }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!getLastDetail || getLastDetail.length === 0) return null;

  // Sort visits so that the most recent is at index 0 (closest to current time)
  const parseDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const sortedVisits = [...getLastDetail].sort((a, b) => {
    if (a.Days !== undefined && b.Days !== undefined) {
      return Number(a.Days) - Number(b.Days);
    }
    const dateA = a.appDate ? new Date(a.appDate).getTime() : parseDate(a.VisitDate);
    const dateB = b.appDate ? new Date(b.appDate).getTime() : parseDate(b.VisitDate);
    return dateB - dateA;
  });

  const latestVisit = sortedVisits[0];

  return (
    <div className="last-visit-accordion-wrapper" style={{ fontFamily: "inherit" }}>
      {/* Latest Visit Summary Info */}
      <div className="visit-detail-list">
        <div className="visit-detail-row">
          <span className="visit-detail-label">
            <span className="vd-ico">📅</span>
            {t("Latest Visit")}
          </span>
          <span className="visit-detail-value">
            {latestVisit?.VisitDate || "—"}
          </span>
        </div>

        <div className="visit-detail-row">
          <span className="visit-detail-label">
            <span className="vd-ico">🩺</span>
            {t("Doctor")}
          </span>
          <span className="visit-detail-value" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={latestVisit?.Doctor}>
            {latestVisit?.Doctor || "—"}
          </span>
        </div>

        <div className="visit-detail-row">
          <span className="visit-detail-label">
            <span className="vd-ico">⏳</span>
            {t("Valid To")}
          </span>
          <span className="visit-detail-value">
            {latestVisit?.ValidTo || "—"}
          </span>
        </div>

        <div className="visit-detail-row">
          <span className="visit-detail-label">
            <span className="vd-ico">💵</span>
            {t("Amount Paid")}
          </span>
          <span className="visit-detail-value">
            {latestVisit?.AmountPaid ?? "—"}
          </span>
        </div>

        <div className="visit-detail-row">
          <span className="visit-detail-label">
            <span className="vd-ico">📆</span>
            {t("Days")}
          </span>
          <span className="visit-detail-value">
            {latestVisit?.Days ?? "—"}
          </span>
        </div>

        <div className="visit-detail-row">
          <span className="visit-detail-label">
            <span className="vd-ico">🏷️</span>
            {t("Type")}
          </span>
          <span className="visit-detail-value is-pill">
            {latestVisit?.VisitType || "—"}
          </span>
        </div>
      </div>

      {/* Collapsible Accordion Header */}
      {sortedVisits.length > 1 && (
        <div style={{ marginTop: "8px" }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #eef2f6 0%, #e2e8f0 100%)",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "6px 10px",
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            className="last-visit-accordion-btn"
          >
            <span>📂 {t("All Visit Dates")} ({sortedVisits.length})</span>
            <span style={{
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              fontSize: "0.8rem"
            }}><i class="fa fa-chevron-down"></i></span>
          </button>

          {/* Accordion Content */}
          {isOpen && (
            <div
              style={{
                maxHeight: "180px",
                overflowY: "auto",
                marginTop: "6px",
                padding: "4px 8px 4px 4px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                animation: "fadeIn 0.2s ease-out"
              }}
              className="last-visit-accordion-content"
            >
              {sortedVisits.map((visit, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "6px 0",
                    borderBottom: idx < sortedVisits.length - 1 ? "1px dashed #e2e8f0" : "none",
                    fontSize: "0.72rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "#1e293b" }}>
                    <span>📅 {visit.VisitDate}</span>
                    <span style={{ color: "#4f46e5" }}>{visit.VisitType}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", color: "#64748b" }}>
                    <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={visit.Doctor}>🩺 {visit.Doctor}</span>
                    <span>💵 {visit.AmountPaid} ({visit.Days} days)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LastVisitAccordion;
