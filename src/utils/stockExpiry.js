import moment from "moment";

/**
 * Expired stock in the pharmacy medicine search (issue screens).
 *
 * The search rows carry the batch expiry as text ("11-Aug-26", "31-Dec-2026", ...) under
 * one of a few names. A batch whose expiry is before today is EXPIRED: it is tinted in
 * the dropdown and refused on selection with a message, on top of whatever the
 * colour-coding flag (ExpiryColor from the API) already paints.
 */

const EXPIRY_FIELDS = ["Expiry", "MedExpiryDate", "ExpiryDate", "ExpDate", "expiry"];
const EXPIRY_FORMATS = [
  "DD-MMM-YY",
  "DD-MMM-YYYY",
  "YYYY-MM-DD",
  "YYYY-MM-DDTHH:mm:ss",
  "DD/MM/YYYY",
  "DD-MM-YYYY",
  "MMM-YY",
  "MMM-YYYY",
  moment.ISO_8601,
];

/** The raw expiry text of a search row, or "" when it has none. */
export const stockExpiryText = (row) => {
  for (const f of EXPIRY_FIELDS) {
    const v = row?.[f];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
};

/** moment of the batch expiry, or null when absent / unreadable (never treated as expired). */
export const parseStockExpiry = (row) => {
  const text = stockExpiryText(row);
  if (!text) return null;
  const m = moment(text, EXPIRY_FORMATS, true);
  if (m.isValid()) return m;
  const loose = moment(text, EXPIRY_FORMATS);
  return loose.isValid() ? loose : null;
};

/** True when the batch expiry is before today (an expiry dated today is still usable). */
export const isStockExpired = (row, today = moment()) => {
  const exp = parseStockExpiry(row);
  return !!exp && exp.isBefore(moment(today).startOf("day"), "day");
};

/** True when the batch expires within the given number of months from today (but is not yet expired). */
export const isStockNearExpiry = (row, months = 2, today = moment()) => {
  const exp = parseStockExpiry(row);
  if (!exp) return false;
  const startOfToday = moment(today).startOf("day");
  if (exp.isBefore(startOfToday, "day")) return false;
  return exp.isBefore(moment(today).add(months, "months"), "day");
};

/** True when available quantity is at or below the threshold. */
export const isLowStock = (row, threshold = 5) => {
  const qty = Number(row?.AvlQty);
  return !isNaN(qty) && qty <= threshold && qty > 0;
};

export const EXPIRED_STOCK_COLOUR = "#fca5a5";
export const LOW_STOCK_COLOUR = "#fde68a";
export const NEAR_EXPIRY_COLOUR = "#fed7aa";
