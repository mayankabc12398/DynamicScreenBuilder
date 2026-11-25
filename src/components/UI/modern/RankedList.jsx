import React from "react";

/**
 * RankedList — numbered list with a right-aligned percentage and a bar.
 *
 * items: [{ label, value }]  where value is 0-100
 */
const RankedList = ({ items = [], showBar = true, emptyText = "", className = "" }) => {
  if (!items.length) {
    return emptyText ? <div className="hx-muted">{emptyText}</div> : null;
  }

  return (
    <ol className={`hx-rank-list ${className}`}>
      {items.map((item, index) => {
        const value = Number(item?.value);
        const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
        return (
          <li key={`${item?.label || index}-${index}`} className="hx-rank-item">
            <span className="hx-rank-item__no">{index + 1}.</span>
            <span className="hx-truncate" title={item?.label}>
              {item?.label}
            </span>
            <span className="hx-rank-item__value">
              {safeValue === null ? "-" : `${safeValue}%`}
            </span>
            {showBar && safeValue !== null && (
              <span className="hx-rank-item__bar">
                <i style={{ width: `${safeValue}%` }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default RankedList;
