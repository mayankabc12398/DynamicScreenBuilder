// Shared metadata for the What's New / Release Update module.

export const RELEASE_CATEGORIES = [
  "New Feature",
  "Enhancement",
  "Bug Fix",
  "Information",
];

// Visual treatment per category (badge colors + icon). Plain CSS-friendly.
export const CATEGORY_META = {
  "New Feature": { color: "#4338ca", bg: "#eef2ff", icon: "fas fa-rocket" },
  Enhancement: { color: "#047857", bg: "#ecfdf5", icon: "fas fa-bolt" },
  "Bug Fix": { color: "#b45309", bg: "#fffbeb", icon: "fas fa-bug" },
  Information: { color: "#0369a1", bg: "#eff6ff", icon: "fas fa-circle-info" },
};

export const getCategoryMeta = (category) =>
  CATEGORY_META[category] || CATEGORY_META.Information;

// Lightweight, locale-agnostic date formatter (e.g. 10 Jun 2026).
export const formatReleaseDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// API may return Success/Data with PascalCase or camelCase — normalize once.
export const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
};

export const normalizeRelease = (r = {}) => ({
  id: pick(r, "ID", "id"),
  versionNo: pick(r, "VersionNo", "versionNo") || "",
  releaseDate: pick(r, "ReleaseDate", "releaseDate") || "",
  category: pick(r, "Category", "category") || "Information",
  title: pick(r, "Title", "title") || "",
  description: pick(r, "Description", "description") || "",
  isPopup: !!pick(r, "IsPopup", "isPopup"),
  publishedDate: pick(r, "PublishedDate", "publishedDate") || "",
});
