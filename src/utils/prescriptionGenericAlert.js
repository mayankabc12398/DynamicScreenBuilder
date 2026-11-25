// Doctor Module > Prescription > Prescribed Medicine — "same / similar generic" soft alert.
//
// THE ASK
//   The AI interaction check ("View Interaction") is a separate, on-demand call. The client
//   wants something immediate and passive as well: while the doctor is still building the
//   list, every medicine whose generic (salt composition) matches or overlaps another
//   medicine already on the prescription is flagged next to its name. No dialog, no block —
//   the doctor may well be prescribing the second one on purpose.
//
// WHAT COUNTS AS A MATCH
//   The generic column arrives as free text from the item master ("PARACETAMOL 500MG",
//   "AMOXYCILLIN 500 MG + CLAVULANIC ACID 125 MG", "Paracetamol IP (500mg)") and the
//   doctor can overwrite it by hand in the grid. So the comparison is on the SALTS, not on
//   the string:
//
//     1. strengths and units are removed          500MG, 1.5 G, 10MG/5ML, 5%, 100 IU ...
//     2. pharmacopoeia and dosage-form words go    IP BP USP, TAB, SYRUP, INJ, SR, ...
//     3. the rest is split on the salt separators  "+"  ","  "/"  "&"  ";"  " AND "  " WITH "
//
//   Two rows are then
//     SAME     when the resulting salt sets are identical   (PARACETAMOL vs PARACETAMOL)
//     SIMILAR  when they overlap but are not identical      (PARACETAMOL vs PARACETAMOL +
//              CAFFEINE), or when a salt of one contains a salt of the other
//              (AMOXYCILLIN vs AMOXYCILLIN TRIHYDRATE).
//
//   Rows with no generic at all (a free-typed name the doctor pressed Enter on) are never
//   flagged and never cause a flag. The trailing blank row the grid keeps for the next entry
//   is naturally one of those.
//
// Pure functions only — no React, no store — so the grid can call them inside a useMemo and
// they can be exercised from a plain node script.

export const GENERIC_ALERT_LEVEL = {
  SAME: "same",
  SIMILAR: "similar",
};

/**
 * The generic text the grid displays for a row, resolved the same way the Name cell does,
 * so what is compared is exactly what the doctor sees.
 */
export const getPrescribedRowGeneric = (row) => {
  const value =
    row?.Name?.Generic ??
    row?.Name?.composition ??
    row?.AllItemListData?.Generic ??
    row?.AllItemListData?.composition ??
    "";
  return typeof value === "string" ? value : String(value ?? "");
};

// 500MG, 500 MG, 1.5G, 10MG/5ML, 5%, 100IU, 2.5 MCG/ACTUATION, 0.5MG/ML ...
// Alphabetic units need a word boundary after them, otherwise "500 mg/Glimepiride" reads
// the G of Glimepiride as a gram unit.
const STRENGTH_PATTERN =
  /\d+(?:[.,]\d+)?\s*(?:(?:MG|MCG|UG|µG|GM|G|KG|ML|L|IU|U|MEQ|MMOL|MU|LAC|MILLION)\b|%)?(?:\s*\/\s*(?:\d+(?:[.,]\d+)?)?\s*(?:MG|MCG|UG|GM|G|ML|L|DOSE|ACTUATION|PUFF|TAB|CAP|DROP|HR|HOUR)S?\b)?/g;

// Words that describe the product, not the salt.
const NOISE_WORDS = new Set([
  "IP",
  "BP",
  "USP",
  "EP",
  "JP",
  "NF",
  "TAB",
  "TABS",
  "TABLET",
  "TABLETS",
  "CAP",
  "CAPS",
  "CAPSULE",
  "CAPSULES",
  "SYP",
  "SYRUP",
  "SUSP",
  "SUSPENSION",
  "INJ",
  "INJECTION",
  "DROPS",
  "DROP",
  "CREAM",
  "OINTMENT",
  "OINT",
  "GEL",
  "LOTION",
  "SOLUTION",
  "SOLN",
  "SACHET",
  "POWDER",
  "SR",
  "ER",
  "XR",
  "XL",
  "MR",
  "CR",
  "DR",
  "DS",
  "OD",
  "LA",
  "FORTE",
  "KID",
  "PAED",
  "PEDIATRIC",
  "PAEDIATRIC",
  "W/V",
  "W/W",
  "V/V",
]);

const SALT_SEPARATOR = /\s*(?:\+|,|\/|&|;|\bAND\b|\bWITH\b)\s*/;

/**
 * Break a generic string into its normalised salt names.
 * @param {string} genericText
 * @returns {string[]} sorted, de-duplicated, upper-case salt names ([] when nothing usable)
 */
export const normalizeGenericSalts = (genericText) => {
  if (!genericText || typeof genericText !== "string") return [];

  const cleaned = genericText
    .toUpperCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ") // (500MG), [AS SODIUM]
    .replace(STRENGTH_PATTERN, " ")
    .replace(/[^A-Z+,/&;\s-]/g, " "); // anything left that is not a letter or separator

  const salts = cleaned
    .split(SALT_SEPARATOR)
    .map((part) =>
      part
        .split(/\s+/)
        .filter((word) => word && !NOISE_WORDS.has(word))
        .join(" ")
        .trim(),
    )
    .filter((salt) => salt.length >= 3);

  return Array.from(new Set(salts)).sort();
};

// Equal, or one salt name contains the other whole (AMOXYCILLIN vs AMOXYCILLIN TRIHYDRATE).
const saltsRelate = (a, b) =>
  a === b ||
  (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a)));

/**
 * Compare two normalised salt lists.
 * @returns {{ level: string, shared: string[] } | null}
 */
export const compareGenericSalts = (saltsA, saltsB) => {
  if (!saltsA?.length || !saltsB?.length) return null;

  const shared = saltsA.filter((a) => saltsB.some((b) => saltsRelate(a, b)));
  if (!shared.length) return null;

  const identical =
    saltsA.length === saltsB.length &&
    saltsA.every((salt, i) => salt === saltsB[i]);

  return {
    level: identical ? GENERIC_ALERT_LEVEL.SAME : GENERIC_ALERT_LEVEL.SIMILAR,
    shared,
  };
};

/**
 * Flag every prescribed-medicine row whose generic matches or overlaps another row's.
 *
 * @param {Array} rows - tags["Prescribed Medicine"] as held by the grid
 * @returns {Object.<number, { level: string, matches: Array<{ index: number, name: string, generic: string, level: string, shared: string[] }> }>}
 *   keyed by row index; only flagged rows are present. `level` on the row is SAME when any
 *   of its matches is SAME, otherwise SIMILAR.
 */
export const findSimilarGenericRows = (rows) => {
  const result = {};
  if (!Array.isArray(rows) || rows.length < 2) return result;

  const prepared = rows.map((row, index) => ({
    index,
    name: row?.Name?.value ?? "",
    generic: getPrescribedRowGeneric(row),
    salts: normalizeGenericSalts(getPrescribedRowGeneric(row)),
  }));

  for (let i = 0; i < prepared.length; i++) {
    if (!prepared[i].salts.length) continue;
    for (let j = i + 1; j < prepared.length; j++) {
      if (!prepared[j].salts.length) continue;

      const match = compareGenericSalts(prepared[i].salts, prepared[j].salts);
      if (!match) continue;

      [
        [i, j],
        [j, i],
      ].forEach(([self, other]) => {
        const entry = result[self] || {
          level: GENERIC_ALERT_LEVEL.SIMILAR,
          matches: [],
        };
        entry.matches.push({
          index: other,
          name: prepared[other].name,
          generic: prepared[other].generic,
          level: match.level,
          shared: match.shared,
        });
        if (match.level === GENERIC_ALERT_LEVEL.SAME) {
          entry.level = GENERIC_ALERT_LEVEL.SAME;
        }
        result[self] = entry;
      });
    }
  }

  return result;
};
