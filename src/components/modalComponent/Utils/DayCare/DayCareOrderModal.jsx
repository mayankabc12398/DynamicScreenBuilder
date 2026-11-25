import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../formComponent/Button";
import Tables from "../../../UI/customTable";
import ColorCodingSearch from "../../../commonComponents/ColorCodingSearch";
import { useTranslation } from "react-i18next";

import { BindDayCareInvestigation } from "../../../../networkServices/DayCare";
import { notify } from "../../../../utils/utils";

/*
 * Day Care Order - the front desk's list of investigations ordered from Day Care
 * that have not been billed yet.
 *
 * The Day Care counterpart of the CPOE button, and deliberately the same shape:
 * tick the rows, press Add Investigation, and they go onto the bill through the
 * very same handler the CPOE list uses. Only the source differs - CPOE reaches
 * patient_test through `appointment`, and a day care episode has no appointment
 * row, so this reaches it through the day care episode instead.
 *
 * No date range. A day care order is nearly always billed the same day, and the
 * list is already narrowed to unbilled rows for this patient, so a filter would
 * only be one more thing to get wrong at a busy counter.
 */

/* Dapper rows and anonymous objects do not agree on casing across this API, and
   the CPOE modal reads camelCase while the SQL aliases are PascalCase. Reading
   both means this list cannot break on that difference. */
const pick = (row, ...names) => {
  for (const n of names) {
    if (row?.[n] !== undefined && row?.[n] !== null) return row[n];
  }
  return undefined;
};

/*
 * The counter's adder, testAddingObject(), does NOT read the API row - it reads
 * the camelCase shape AddInvestigation() produces (item_ID, autoCompleteItemName,
 * isOutSource, categoryid, tnxtype, type_ID ...). handlegetCheckedData only
 * filters the checked rows, it never maps them, so handing it raw rows produced
 * a billing line with no item name, no code and no rate - every field read came
 * back undefined.
 *
 * So the mapping happens here, before the rows are handed over. The keys below
 * are exactly the ones testAddingObject reads; `isChecked`, `PatientTest_ID`
 * and `isUrgent` are kept because handleAddInvestigation itself reads those.
 */
const toBillingRow = (row) => ({
  ...row,
  item_ID: pick(row, "ItemID", "itemID"),
  autoCompleteItemName: pick(row, "Typename", "TypeName", "typeName", "ItemDisplayName"),
  typeName: pick(row, "Typename", "TypeName", "typeName", "ItemDisplayName"),
  itemCode: pick(row, "ItemCode", "itemCode") ?? "",
  type_ID: pick(row, "Type_id", "Type_ID", "type_ID"),
  labType: pick(row, "LabType", "labType"),
  // testAddingObject reads `tnxtype`, all lower case - not tnxType.
  tnxtype: pick(row, "TnxType", "tnxType", "tnxtype"),
  subCategoryID: pick(row, "SubCategoryID", "subCategoryID"),
  categoryid: pick(row, "CategoryID", "categoryid", "categoryID"),
  SubCategory: pick(row, "SubCategory", "subCategory"),
  sample: pick(row, "Sample", "sample") ?? "N",
  isadvance: pick(row, "isadvance", "IsAdvance", "Isadvance") ?? 0,
  isOutSource: pick(row, "IsOutSource", "isOutSource") ?? 0,
  rateEditable: pick(row, "RateEditable", "rateEditable") ?? 0,
  isSlotWisetoken: 0,
  DoctorID: pick(row, "DoctorID", "doctorID"),
  /* Tax comes off the item master when the counter prices the line; a day care
     order carries none, so these are left empty rather than guessed at zero. */
  SalesTaxGroupName: pick(row, "SalesTaxGroupName") ?? "",
  SaleTaxPercentage: pick(row, "SaleTaxPercentage") ?? 0,
  PurchaseTaxGroupName: pick(row, "PurchaseTaxGroupName") ?? "",
  PurchaseTaxPercentage: pick(row, "PurchaseTaxPercentage") ?? 0,
  isUrgent: Number(pick(row, "IsUrgent", "isUrgent") ?? 0) === 1,
  PatientTest_ID: pick(row, "PatientTest_ID", "patientTest_ID"),
});

function DayCareOrderModal({ singlePatientData, handlegetCheckedData }) {
  const [t] = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const patientID = singlePatientData?.PatientID ?? singlePatientData?.MRNo ?? "";

  const load = async () => {
    if (!patientID) return;
    setLoading(true);
    try {
      const res = await BindDayCareInvestigation(patientID);
      if (res?.success) {
        setRows((res?.data || []).map((r) => ({ ...r, isChecked: false })));
      } else {
        setRows([]);
        if (res?.message) notify(res.message, "error");
      }
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // The counter opens this to act, so it loads straight away rather than
  // waiting for a Search press.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID]);

  const isBlocked = (row) =>
    Number(pick(row, "IsOutSource", "isOutSource") ?? 0) === 1 ||
    Number(pick(row, "IsIssue", "isIssue") ?? 0) === 1;

  const handleChecked = (e, index) => {
    const { name, checked } = e.target;
    const next = [...rows];
    next[index][name] = checked;
    setRows(next);
    // The parent bills exactly what it is handed, so it is told on every tick -
    // in the shape its adder reads, not the shape the API returned.
    handlegetCheckedData(next.map(toBillingRow));
  };

  const handleCheckAll = (e) => {
    const { checked } = e.target;
    const next = rows.map((r) => ({ ...r, isChecked: isBlocked(r) ? false : checked }));
    setRows(next);
    handlegetCheckedData(next.map(toBillingRow));
  };

  const tableBody = useMemo(
    () =>
      rows.map((row, index) => ({
        All: (
          <input
            type="checkbox"
            className="table-checkbox"
            name="isChecked"
            checked={row?.isChecked ?? false}
            onChange={(e) => handleChecked(e, index)}
            disabled={isBlocked(row)}
          />
        ),
        SNo: <div>{index + 1}</div>,
        Type: <div>{pick(row, "LabType", "labType") ?? "-"}</div>,
        ItemName: (
          <div className="d-flex align-items-center" style={{ gap: 6 }}>
            <span>{pick(row, "TypeName", "Typename", "typeName", "ItemDisplayName") ?? "-"}</span>
            {Number(pick(row, "IsUrgent", "isUrgent") ?? 0) === 1 ? (
              <span
                title={t("Marked urgent by the doctor")}
                style={{
                  background: "#dc2626", color: "#fff", borderRadius: 10,
                  padding: "1px 7px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                }}
              >
                {t("URGENT")}
              </span>
            ) : null}
          </div>
        ),
        DayCareNo: <div>{pick(row, "DayCareNo", "dayCareNo") ?? "-"}</div>,
        PrescribedOn: <div>{pick(row, "PrescribedOn", "prescribedOn") ?? "-"}</div>,
        Quantity: <div>{pick(row, "Quantity", "quantity") ?? 0}</div>,
        OutSource: (
          <div>{Number(pick(row, "IsOutSource", "isOutSource") ?? 0) === 0 ? t("No") : t("Yes")}</div>
        ),
        Remarks: <div>{pick(row, "Remarks", "remarks") ?? ""}</div>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows],
  );

  const THEAD = [
    {
      name: <input type="checkbox" className="table-checkbox" onChange={handleCheckAll} />,
      width: "1%",
    },
    { name: t("S.No."), width: "1%" },
    t("Type"),
    t("Item Name"),
    t("Day Care No"),
    t("Prescribed On"),
    { name: t("Quantity"), width: "1%" },
    t("OutSource"),
    t("Remarks"),
  ];

  const getRowClass = (val, index) => {
    if (Number(pick(rows[index], "IsIssue", "isIssue") ?? 0) === 1) return "color-indicator-1-bg";
    if (Number(pick(rows[index], "IsOutSource", "isOutSource") ?? 0) === 1) return "color-indicator-2-bg";
    return undefined;
  };

  return (
    <div>
      <div className="row align-items-center">
        <div className="col-xl-4 col-md-5 col-sm-6 col-12">
          <div className="form-group mb-2">
            <Button name={t("Refresh")} className={"btn btn-sm btn-primary"} handleClick={load} />
          </div>
        </div>
        <div className="d-flex align-items-center">
          <ColorCodingSearch color={"color-indicator-1-bg"} label={t("Done")} />
          <ColorCodingSearch color={"color-indicator-2-bg"} label={t("Out Source")} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 22, textAlign: "center", color: "#adb5bd", fontSize: 12 }}>
          {t("Loading")}...
        </div>
      ) : tableBody.length === 0 ? (
        <div
          style={{
            padding: 22, textAlign: "center", color: "#adb5bd", fontSize: 12,
            border: "1px dashed #e9ecef", borderRadius: 8,
          }}
        >
          <i className="far fa-folder-open" style={{ fontSize: 20, display: "block", marginBottom: 6 }} />
          {t("No unbilled Day Care investigation for this patient.")}
        </div>
      ) : (
        <Tables scrollView={"scrollView"} thead={THEAD} tbody={tableBody} getRowClass={getRowClass} />
      )}
    </div>
  );
}

export default DayCareOrderModal;
