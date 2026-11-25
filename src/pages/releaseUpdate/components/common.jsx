import React from "react";
import { getCategoryMeta } from "../constants";
import { useTranslation } from "react-i18next";

/** Rounded, color-coded category chip. */
export const CategoryBadge = ({ category }) => {
  const meta = getCategoryMeta(category);
  return (
    <span
      className="ru-badge"
      style={{ background: meta.bg, color: meta.color }}
    >
      <i className={meta.icon} />
      {category}
    </span>
  );
};

/**
 * Renders a release description. Backend stores light HTML (<ul>/<li>),
 * so render it; falls back to plain text. Trusted admin-authored content.
 */
export const ReleaseBody = ({ html }) => {
  const [t] = useTranslation();
  if (!html) return <p className="ru-desc">{t("No additional details.")}</p>;
  return (
    <div className="ru-desc" dangerouslySetInnerHTML={{ __html: html }} />
  );
};
