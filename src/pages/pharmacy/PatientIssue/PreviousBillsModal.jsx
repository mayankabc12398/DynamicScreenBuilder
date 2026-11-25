import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import DatePicker from "../../../components/formComponent/DatePicker";
import Checkbox from "../../../components/formComponent/Checkbox";
import { notify } from "../../../utils/utils";
import {
  GetPatientPreviousBills,
  GetPreviousBillItems,
} from "../../../networkServices/pharmacyRepeatApi";

/**
 * Pharmacy Issue - "Previous Bills" popup (repeat medicine).
 *
 * THE ASK
 *   Patients come back after a few days for the same medicines. Instead of typing every
 *   item again, the pharmacist opens this popup, sees the patient's earlier pharmacy
 *   bills with the medicines on each, ticks what is needed (whole bill or single lines),
 *   adjusts quantities, and adds them to the current issue in one go.
 *
 * WHAT IS (NOT) COPIED
 *   Only the medicine and the quantity. Batch, expiry, stock, MRP, tax, panel price and
 *   discount are resolved afresh by the issue screen's normal add path, exactly as if the
 *   item had been typed - an old bill's batch may be finished and its price out of date.
 *
 * Used by /pharmacy-issue and /ipd-pharmacy-issue.
 *
 * @param patient       SearchPatient.patientDetail (needs PatientID)
 * @param existingItemIDs  Set of ItemIDs already in the issue grid (shown as "in grid")
 * @param onAdd         async (items: [{ ItemID, ItemName, Quantity }]) => void
 */
const { VITE_DATE_FORMAT } = import.meta.env;

function PreviousBillsModal({ patient, existingItemIDs = new Set(), onAdd }) {
  const [t] = useTranslation();
  const [range, setRange] = useState({
    FromDate: moment().subtract(90, "days").toDate(),
    ToDate: new Date(),
  });
  const [bills, setBills] = useState([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openBill, setOpenBill] = useState(null);
  // selection: key `${TransactionID}|${ItemID||ItemName}` -> quantity
  const [selected, setSelected] = useState({});
  const [adding, setAdding] = useState(false);

  const keyOf = (bill, item) => `${bill.TransactionID}|${item.ItemID || item.ItemName}`;

  const search = async () => {
    if (!patient?.PatientID) return;
    setLoading(true);
    setError("");
    const result = await GetPatientPreviousBills({
      patientID: patient.PatientID,
      fromDate: range.FromDate,
      toDate: range.ToDate,
    });
    setLoading(false);
    setSource(result.source);
    if (!result.ok) {
      setError(result.message);
      setBills([]);
      return;
    }
    // newest first
    const sorted = [...result.bills].sort(
      (a, b) =>
        (moment(b.BillDate, ["DD-MMM-YYYY hh:mm A", "DD-MMM-YYYY", moment.ISO_8601]).valueOf() || 0) -
        (moment(a.BillDate, ["DD-MMM-YYYY hh:mm A", "DD-MMM-YYYY", moment.ISO_8601]).valueOf() || 0),
    );
    setBills(sorted);
    setOpenBill(sorted[0]?.TransactionID || null);
    if (sorted[0] && !sorted[0].itemsLoaded) loadItems(sorted[0]);
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.PatientID]);

  const loadItems = async (bill) => {
    if (bill.itemsLoaded) return;
    const items = await GetPreviousBillItems(bill.TransactionID, patient?.PatientID);
    setBills((prev) =>
      prev.map((b) =>
        b.TransactionID === bill.TransactionID ? { ...b, Items: items, itemsLoaded: true } : b,
      ),
    );
  };

  const toggleBill = (bill) => {
    const next = openBill === bill.TransactionID ? null : bill.TransactionID;
    setOpenBill(next);
    if (next) loadItems(bill);
  };

  const toggleItem = (bill, item) => {
    const key = keyOf(bill, item);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key] !== undefined) delete next[key];
      else next[key] = item.Quantity || 1;
      return next;
    });
  };

  const toggleWholeBill = (bill) => {
    const addable = bill.Items.filter((i) => i.ItemID);
    const allOn = addable.length > 0 && addable.every((i) => selected[keyOf(bill, i)] !== undefined);
    setSelected((prev) => {
      const next = { ...prev };
      addable.forEach((i) => {
        const key = keyOf(bill, i);
        if (allOn) delete next[key];
        else next[key] = next[key] ?? (i.Quantity || 1);
      });
      return next;
    });
  };

  const setQty = (bill, item, value) => {
    const key = keyOf(bill, item);
    const qty = Math.max(0, Number(String(value).replace(/[^0-9.]/g, "")) || 0);
    setSelected((prev) => ({ ...prev, [key]: qty }));
  };

  // Same medicine ticked on two bills -> one line, quantities summed.
  const picked = useMemo(() => {
    const byItem = new Map();
    bills.forEach((bill) =>
      bill.Items.forEach((item) => {
        const qty = selected[keyOf(bill, item)];
        if (qty === undefined || !item.ItemID || qty <= 0) return;
        const prev = byItem.get(item.ItemID);
        byItem.set(item.ItemID, {
          ItemID: item.ItemID,
          ItemName: item.ItemName,
          Quantity: (prev?.Quantity || 0) + qty,
        });
      }),
    );
    return Array.from(byItem.values());
  }, [bills, selected]);

  const handleAdd = async () => {
    if (!picked.length) {
      notify(t("Select at least one medicine to add"), "warn");
      return;
    }
    setAdding(true);
    try {
      await onAdd(picked);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rx-prevbills">
      <div className="row align-items-end">
        <DatePicker
          className="custom-calendar"
          id="prevBillsFrom"
          name="FromDate"
          placeholder={VITE_DATE_FORMAT}
          value={range.FromDate}
          lable={t("From Date")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={(e) => setRange((r) => ({ ...r, FromDate: e.target.value }))}
        />
        <DatePicker
          className="custom-calendar"
          id="prevBillsTo"
          name="ToDate"
          placeholder={VITE_DATE_FORMAT}
          value={range.ToDate}
          lable={t("To Date")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={(e) => setRange((r) => ({ ...r, ToDate: e.target.value }))}
        />
        <div className="col-xl-2 col-md-2 col-sm-4 col-12">
          <button type="button" className="btn btn-sm btn-success px-3" onClick={search} disabled={loading}>
            {loading ? t("Searching...") : t("Search")}
          </button>
        </div>
        <div className="col text-right rx-prevbills__patient">
          {patient?.PatientName || patient?.PName} <span>({patient?.PatientID})</span>
        </div>
      </div>

      {error && <div className="drug-interaction-error-box">{t("Warning:")} {error}</div>}
      {!loading && !error && bills.length === 0 && (
        <div className="rx-prevbills__empty">{t("No previous pharmacy bills found for this patient in the selected period")}</div>
      )}

      <div className="rx-prevbills__list">
        {bills.map((bill) => {
          const open = openBill === bill.TransactionID;
          const addable = bill.Items.filter((i) => i.ItemID);
          const onCount = bill.Items.filter((i) => selected[keyOf(bill, i)] !== undefined).length;
          const allOn = addable.length > 0 && onCount === addable.length;
          return (
            <div key={bill.TransactionID} className={`rx-prevbills__bill${open ? " rx-prevbills__bill--open" : ""}`}>
              <div className="rx-prevbills__head">
                <button type="button" className="rx-prevbills__headbtn" onClick={() => toggleBill(bill)}>
                  <i className={`fa fa-chevron-${open ? "down" : "right"} mr-2`} aria-hidden="true"></i>
                  <strong>{bill.BillNo}</strong>
                  <span className="rx-prevbills__date">{bill.BillDate}</span>
                  {bill.PanelName && <span className="rx-prevbills__tag">{bill.PanelName}</span>}
                  {(bill.ItemCount !== "" || bill.itemsLoaded) && (
                    <span className="rx-prevbills__tag">
                      {bill.itemsLoaded ? bill.Items.length : bill.ItemCount} {t("items")}
                    </span>
                  )}
                  {bill.IssuedBy && (
                    <span className="rx-prevbills__who">
                      <i className="fa fa-user mr-1" aria-hidden="true"></i>
                      {t("Issued by")}: {bill.IssuedBy}
                    </span>
                  )}
                  {bill.DispensedBy ? (
                    <span className="rx-prevbills__who rx-prevbills__who--done">
                      <i className="fa fa-check-circle mr-1" aria-hidden="true"></i>
                      {t("Dispensed by")}: {bill.DispensedBy}
                      {bill.DispensedAt ? ` (${bill.DispensedAt})` : ""}
                    </span>
                  ) : (
                    <span className="rx-prevbills__who rx-prevbills__who--pending">{t("Not dispensed")}</span>
                  )}
                  {bill.NetAmount !== "" && <span className="rx-prevbills__amt">{bill.NetAmount}</span>}
                </button>
                {open && addable.length > 0 && (
                  <button type="button" className="btn btn-sm btn-primary rx-prevbills__all" onClick={() => toggleWholeBill(bill)}>
                    {allOn ? t("Clear bill") : t("Select whole bill")}
                  </button>
                )}
                {onCount > 0 && <span className="rx-prevbills__picked">{onCount} {t("selected")}</span>}
              </div>

              {open && (
                <div className="rx-prevbills__items">
                  {!bill.itemsLoaded && <div className="text-muted p-2">{t("Loading medicines...")}</div>}
                  {bill.itemsLoaded && bill.Items.length === 0 && (
                    <div className="text-muted p-2">{t("No medicines found on this bill")}</div>
                  )}
                  {bill.Items.map((item) => {
                    const key = keyOf(bill, item);
                    const on = selected[key] !== undefined;
                    const inGrid = item.ItemID && existingItemIDs.has(String(item.ItemID));
                    return (
                      <div key={key} className={`rx-prevbills__item${on ? " rx-prevbills__item--on" : ""}`}>
                        <Checkbox
                          className="mt-1"
                          checked={on}
                          disabled={!item.ItemID}
                          onChange={() => toggleItem(bill, item)}
                        />
                        <div className="rx-prevbills__name" onClick={() => item.ItemID && toggleItem(bill, item)}>
                          {item.ItemName}
                          {inGrid && <span className="rx-prevbills__flag">{t("already in this issue")}</span>}
                          {!item.ItemID && <span className="rx-prevbills__flag rx-prevbills__flag--warn">{t("item id not available - add manually")}</span>}
                          {(item.LastGivenAt || item.MRP !== "" || item.BatchNumber) && (
                            <div className="rx-prevbills__sub">
                              {item.LastGivenAt && (
                                <span>
                                  {t("Last given")}: {item.LastGivenAt}
                                  {item.LastGivenQty !== "" && item.LastGivenQty !== null ? `, ${t("qty")} ${item.LastGivenQty}` : ""}
                                  {item.LastGivenBy ? `, ${t("by")} ${item.LastGivenBy}` : ""}
                                </span>
                              )}
                              {item.MRP !== "" && <span>{t("MRP")}: {item.MRP}</span>}
                              {item.BatchNumber && <span>{t("Batch")}: {item.BatchNumber}</span>}
                            </div>
                          )}
                        </div>
                        <div className="rx-prevbills__qtylabel">{t("Billed")}: {item.Quantity}</div>
                        <input
                          type="text"
                          className="table-input rx-prevbills__qty"
                          disabled={!on}
                          value={on ? selected[key] : ""}
                          placeholder={t("Qty")}
                          onChange={(e) => setQty(bill, item, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rx-prevbills__footer">
        <div className="rx-prevbills__summary">
          {picked.length > 0
            ? `${picked.length} ${t("medicine(s) to add")}: ${picked.map((p) => `${p.ItemName} x ${p.Quantity}`).join(", ")}`
            : t("Tick medicines from one or more bills, adjust the quantity, then add them to the issue")}
        </div>
        <button type="button" className="btn btn-sm btn-success px-4" disabled={adding || !picked.length} onClick={handleAdd}>
          <i className="fa fa-plus mr-1" aria-hidden="true"></i>
          {adding ? t("Adding...") : `${t("Add to issue")} (${picked.length})`}
        </button>
      </div>
      {source === "fallback" && (
        <div className="rx-prevbills__hint">
          {t("Bills loaded through the Reprint search (the dedicated Previous Bills API is not deployed yet).")}
        </div>
      )}
    </div>
  );
}

export default PreviousBillsModal;
