import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { SubstitutionLog } from "../../networkServices/InventoryApi";

/**
 * SRSSAIH-2026-0061 Point 7 Slice F — the substitution, shown where it is acted on.
 *
 * THE PROBLEM THIS SOLVES
 *   A ward nurse indents medicine Y. The pharmacy cannot issue it on that patient's panel
 *   and hands over X instead. Slices C/D record that in
 *   f_pharmacy_item_substitution_log — but until now the only way to read it was a SQL
 *   query. The two screens where it actually matters are:
 *
 *     Medicine Requisition   the nurse's own request list. She asked for Y; she needs to
 *                            know Y is not what arrived.
 *     MAR calendar           the administration record. Somebody is about to give a
 *                            medicine to a patient, and it is not the one on the order.
 *
 *   This is the clinically important half. A substitution nobody at the bedside can see is
 *   only marginally better than one that was never recorded.
 *
 * WHY THE LOOKUP MATCHES ON BOTH ITEM IDS
 *   Which id the ward's own rows carry depends on a flag:
 *
 *     PanelSubstituteSkipIndentUpdate = 1  the indent and orderset_medication are left
 *                                          alone, so the ward rows still say Y
 *     PanelSubstituteSkipIndentUpdate = 0  both are rewritten to X
 *
 *   Matching only on RequestedItemID would therefore show nothing at all on any client
 *   running the full behaviour, and matching only on IssuedItemID nothing on any client
 *   running the safe one. So both are indexed, and the wording changes to suit:
 *
 *     row is Y (the request)  -> "issued as X instead"
 *     row is X (the issue)    -> "issued in place of Y"
 */

/* Keyed on IndentNo + ItemID because that is the pair BOTH screens already use to identify
   a line (MAR builds `${IndentNo}_${ItemID}` for its own schedule map). ItemID alone is not
   enough: the same medicine can appear on two indents for one patient and only one of them
   be substituted. */
const keyOf = (indentNo, itemID) =>
  `${String(indentNo ?? "").trim()}_${Number(itemID) || 0}`;

/**
 * Fetches the substitution log for one admission, once, and returns a lookup.
 *
 * Does nothing at all unless the flag is on — no state, no request. A client that does not
 * use panel substitution should not pay for an extra call on every requisition and MAR
 * load, and there is nothing for it to find.
 */
export const usePharmacySubstitutionLog = ({ transactionID, patientID }) => {
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);

  const enabled = useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    return (
      list?.find((item) => item?.Name === "ShowPharmacySubstitutionOnWard")
        ?.Value == 1
    );
  }, [GetGlobalResources]);

  const [entries, setEntries] = useState([]);
  // Guards against a slow response for a previous patient landing after a newer one.
  const requestRef = useRef(0);

  const tid = Number(transactionID) || 0;
  const pid = String(patientID ?? "").trim();

  useEffect(() => {
    if (!enabled || (!tid && !pid)) {
      setEntries([]);
      return;
    }

    const ticket = ++requestRef.current;
    let cancelled = false;

    (async () => {
      try {
        const res = await SubstitutionLog({
          transactionID: tid,
          patientID: tid ? "" : pid,
        });
        if (cancelled || ticket !== requestRef.current) return;
        setEntries(res?.success && Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        // A log that cannot be read must never take the screen down with it. The
        // requisition list and the drug chart are what the ward is here for.
        if (!cancelled && ticket === requestRef.current) setEntries([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, tid, pid]);

  const index = useMemo(() => {
    const map = new Map();
    (entries || []).forEach((e) => {
      const requested = {
        ...e,
        // This row IS the medicine the ward asked for.
        matchedAs: "REQUESTED",
      };
      const issued = {
        ...e,
        // This row is the medicine that went out in its place.
        matchedAs: "ISSUED",
      };
      map.set(keyOf(e?.IndentNo, e?.RequestedItemID), requested);
      map.set(keyOf(e?.IndentNo, e?.IssuedItemID), issued);
    });
    return map;
  }, [entries]);

  /* Returns the log entry for one line, or null. Callers render nothing on null, which is
     the overwhelmingly common case — nothing is substituted on most lines. */
  const lookup = useMemo(
    () => (indentNo, itemID) => {
      if (!enabled || index.size === 0) return null;
      return index.get(keyOf(indentNo, itemID)) || null;
    },
    [enabled, index],
  );

  return { enabled, entries, lookup };
};

/**
 * The marker itself. Deliberately small and red: it sits under a medicine name in a dense
 * table and has to be noticed without taking a row's worth of space.
 */
export const SubstitutionNote = ({ entry, compact = false }) => {
  const [t] = useTranslation();
  if (!entry) return null;

  const requested = entry?.RequestedItemName || "";
  const issued = entry?.IssuedItemName || "";
  const sameStrength = Number(entry?.StrengthMatched) === 1;

  const text =
    entry?.matchedAs === "ISSUED"
      ? `${t("Issued in place of")} ${requested}`
      : `${t("Not payable on this panel")} — ${t("issued")}: ${issued}`;

  return (
    <small
      className="d-block text-danger"
      style={{ fontSize: compact ? "0.6rem" : "0.65rem", lineHeight: 1.15 }}
      title={
        `${t("Requested")}: ${requested}\n${t("Issued")}: ${issued}` +
        `\n${entry?.PanelName ? `${t("Panel")}: ${entry.PanelName}\n` : ""}` +
        `${entry?.SubstitutedOn || ""} ${entry?.SubstitutedBy ? `· ${entry.SubstitutedBy}` : ""}`
      }
    >
      {text}
      {/* Same salt is not the same medicine. A strength that did not match was a clinical
          decision at the counter, and the person about to administer it is exactly who
          needs to be told. */}
      {sameStrength ? null : ` (${t("different strength")})`}
    </small>
  );
};

export default SubstitutionNote;
