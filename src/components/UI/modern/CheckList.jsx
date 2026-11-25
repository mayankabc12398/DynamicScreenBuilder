import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

const TONE_ICON = {
  ok: <FaCheckCircle />,
  warn: <FaExclamationTriangle />,
  danger: <FaTimesCircle />,
};

/**
 * CheckList — bullet list with a semantic status icon per row.
 *
 * items: array of strings, or { text, tone: "ok" | "warn" | "danger", title }
 */
const CheckList = ({ items = [], emptyText = "", className = "" }) => {
  if (!items.length) {
    return emptyText ? <div className="hx-muted">{emptyText}</div> : null;
  }

  return (
    <ul className={`hx-check-list ${className}`}>
      {items.map((item, index) => {
        const entry = typeof item === "string" ? { text: item, tone: "ok" } : item || {};
        const tone = entry.tone || "ok";
        return (
          <li
            key={`${entry.text || index}-${index}`}
            className={`hx-check-item ${tone !== "ok" ? `hx-check-item--${tone}` : ""}`}
            title={entry.title || entry.text}
          >
            <span className="hx-check-item__icon">{TONE_ICON[tone] || TONE_ICON.ok}</span>
            <span className="hx-check-item__text">{entry.text}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default CheckList;
