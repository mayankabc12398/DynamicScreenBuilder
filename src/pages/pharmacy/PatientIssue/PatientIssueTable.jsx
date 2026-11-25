import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Tables from '../../../components/UI/customTable'
import Input from '../../../components/formComponent/Input'
import AlignTableText from '../../../components/commonComponents/AlignTableText'
import { ROUNDOFF_VALUE } from '../../../utils/constant'
import Heading from '../../../components/UI/Heading'
import ColorCodingSearch from '../../../components/commonComponents/ColorCodingSearch'
import { isStockNearExpiry, isLowStock } from '../../../utils/stockExpiry'

// disableDiscount: Patient Issue locks Dis(%) / Dis Amt (row and whole-table boxes); other pages leave it off.
export default function PatientIssueTable({ tbody, handleCustomInput, deleteRowData, handleOpenClinicalTrial, ischecked, bulkDiscount, handleBulkDiscount, disableDiscount = false, lowStockThreshold, nearExpiryMonths }) {
  console.log("actual Body Data", tbody)
  const [t] = useTranslation()
  const [bodyData, setBodyData] = useState([])

  /* Column order (14-Nov-2026): Item Name, HSN Code, Stock Qty, Issue Qty, Batch No, Expiry, MRP, Dis(%),
     Dis Amt, Tax(%), Tax Amount, Amount, Patient Payable - then the rest. Each column is
     [row key, header]; the header and every row are built from this one list so they cannot drift. */
  const columns = [
    ["SrNo", { name: t("SNO"), width: "1%" }],
    ["ItemName", { name: t("Item Name"), width: "15%" }],
    ["HSNCode", { name: t("HSN.Code"), width: "0%", whiteSpace: "initial" }],
    ["AvlQty", { name: t("Stock Qty"), width: "1%", textAlign: "right" }],
    ["Qty", { name: t("Issue Qty."), width: "1%", textAlign: "right" }],
    ["BatchNumber", { name: t("Batch No"), width: "1%" }],
    ["MedExpiryDate", { name: t("Expiry"), width: "0%" }],
    ["MRP", { name: t("MRP"), width: "1%", textAlign: "right" }],
    ["DisPer", { name: t("Dis.") + "(%)", width: "1%", textAlign: "right" }],
    ["discountAmount", { name: t("Dis. Amt."), width: "1%", textAlign: "right" }],
    ["PurTaxPer", { name: t("Tax") + "(%)", width: "1%", textAlign: "right" }],
    ["TaxAmount", { name: t("Tax Amount"), width: "1%", textAlign: "right" }],
    ["Amount", { name: t("Amount"), width: "1%", textAlign: "right" }],
    ["PayableAmount", { name: t("Patient Payable"), width: "1%", whiteSpace: "initial", textAlign: "right" }],
    // hidden on request (14-Nov-2026) - uncomment to show again
    // ["UnitType", { name: t("Unit"), width: "1%" }],
    // ["majormrp", { name: t("MJ Price"), width: "1%", textAlign: "right" }],
    // ["GSTType", { name: t("Tax Type"), width: "1%" }],
    // ["IsUrgent", { name: t("Clinical Trial"), width: "1%" }],
    ["Reject", { name: t("Remove"), width: "1%" }],
  ]
  const thead = columns.map(([, head]) => head)

  useEffect(() => {
    let data = tbody?.map((ele, index) => ({
      SrNo: index + 1,

      ItemName: <div className='text-wrap'>{ele?.ItemName}</div>,
        AvlQty: <AlignTableText value={ele?.AvlQty} />,
        MRP: <AlignTableText value={ele?.MRP?.toFixed(ROUNDOFF_VALUE)} />,
     BatchNumber: ele?.BatchNumber,
        Qty:
        <Input
          type="text"
          disabled={ischecked}
          className="table-input"
          removeFormGroupClass={true}
          display={"right"}
          name={"Quantity"}
          value={ele?.Quantity}
          onChange={(e) => {
            // Every row (indent-sourced or not) can be freely increased or decreased;
            // available stock is the only ceiling.
            handleCustomInput(
              index,
              "Quantity",
              e.target.value,
              "number",
              Number(ele?.AvlQty),
              t("Quantity cannot be more than the available stock")
            )
          }}
        />,
        
          MedExpiryDate: ele?.MedExpiryDate,
        HSNCode: ele?.HSNCode,
     
      // MedExpiryDate: ele?.MedExpiryDate,
      UnitType: ele?.UnitType,
      // AvlQty: <AlignTableText value={ele?.AvlQty} />,
      // UnitPrice: ele?.UnitPrice?.toFixed(ROUNDOFF_VALUE),
      // MRP: <AlignTableText value={ele?.MRP?.toFixed(ROUNDOFF_VALUE)} />,
      /* Carried over from the search row. The key was a misspelling that matched
         nothing, so this column was always blank; and a row that has no major price
         shows nothing rather than throwing on toFixed. */
      majormrp: (
        <AlignTableText
          value={
            ele?.MajorMRP == null ? "" : Number(ele?.MajorMRP).toFixed(ROUNDOFF_VALUE)
          }
        />
      ),
      GSTType: ele?.PurTaxTypeName,
      PurTaxPer: <AlignTableText value={ele?.PurTaxPer} />,
      // Qty:
      //   <Input
      //     type="text"
      //     disabled={ischecked}
      //     className="table-input"
      //     removeFormGroupClass={true}
      //     display={"right"}
      //     name={"Quantity"}
      //     value={ele?.Quantity}
      //     onChange={(e) => {
      //       // For rows added against a pending indent, the issued quantity is the
      //       // ceiling — it can be decreased but not increased beyond it.
      //       const isIndentRow = ele?.IndentNo && ele?.IndentMaxQty != null
      //       const maxQty = isIndentRow ? Number(ele?.IndentMaxQty) : Number(ele?.AvlQty)
      //       handleCustomInput(
      //         index,
      //         "Quantity",
      //         e.target.value,
      //         "number",
      //         maxQty,
      //         isIndentRow
      //           ? t("You cannot increase quantity beyond the indented quantity")
      //           : undefined
      //       )
      //     }}
      //   />,
      DisPer: <Input
        type="text"
        className="table-input"
        removeFormGroupClass={true}
        display={"right"}
        name={"DisPer"}
        disabled={disableDiscount}
        value={ele?.DisPer}
        onChange={(e) => { handleCustomInput(index, "DisPer", e.target.value, "number", 100) }}
      />,
      discountAmount:
        <Input
          type="text"
          className="table-input"
          removeFormGroupClass={true}
          display={"right"}
          name={"discountAmount"}
          disabled={disableDiscount}
          value={ele?.discountAmount}
          onChange={(e) => { handleCustomInput(index, "discountAmount", e.target.value, "number", Number(ele?.grossAmount)) }}
        />
      ,
      Amount: <AlignTableText value={ele?.Amount.toFixed(ROUNDOFF_VALUE)} />,
      TaxAmount: <AlignTableText value={ele?.TaxAmount.toFixed(ROUNDOFF_VALUE)} />,
      PayableAmount: <AlignTableText value={ele?.PayableAmount.toFixed(ROUNDOFF_VALUE)} />,
      IsUrgent: <> <input type="checkbox" className='table-checkbox' onChange={(e) => { handleCustomInput(index, "isClinicalTrial", e?.target?.checked) }} checked={ele?.isClinicalTrial} /> <span onClick={() => { handleOpenClinicalTrial(ele, index) }}><i className="fa fa-eye "></i></span>
        {ele?.isClinicalTrial &&
          <Input
            type="text"
            className="table-input"
            removeFormGroupClass={true}
            placeholder={t("Remark")}
            // display={"right"}
            name={"ClinicalRemark"}
            value={ele?.ClinicalRemark ? ele?.ClinicalRemark : ""}
            onChange={(e) => { handleCustomInput(index, "ClinicalRemark", e.target.value, "text") }}
          />
        }
      </>,

      Reject: <span onClick={() => { deleteRowData(index) }}><i className="fa fa-trash text-danger"></i></span>
    })).map((row) => Object.fromEntries(columns.map(([key]) => [key, row[key]])))
    setBodyData(data)
  }, [tbody])

  const getRowClass = (ele, index) => {
    const data = tbody[index];
    if (data?.IsPrescriptionRequired === 1) {
      return "color-indicator-25-bg"
    }
    else if (data?.IsPreAuthorization === 1) {
      return "color-indicator-29-bg"
    }
    else if (isStockNearExpiry(data, nearExpiryMonths || 2)) {
      return "near-expiry-blink-row"
    }
    else if (isLowStock(data, lowStockThreshold || 5)) {
      return "low-stock-row"
    }
  }

  return (
    <>
      {bodyData?.length > 0 && <Heading title={t("Patient Issue Details")} secondTitle={(
        <>
          {console.log(bodyData, "bodyData")}
          {/* Discount for the whole table. Typing in either box writes the discount
              down every line and fills the other box in - the two are one figure seen
              two ways. Sat here rather than in the column header itself because the
              grid is shared with the rest of the system and its header cells are plain
              text; a line can still be corrected on its own row afterwards. */}
          {handleBulkDiscount && (
            <div className="d-flex align-items-center mr-3" style={{ gap: "6px" }}>
              <span className="text-nowrap">{t("Dis.") + "(%)"}</span>
              <Input
                type="text"
                disabled={ischecked || disableDiscount}
                className="table-input"
                removeFormGroupClass={true}
                display={"right"}
                name={"bulkDisPer"}
                value={bulkDiscount?.DisPer ?? ""}
                onChange={(e) => { handleBulkDiscount("DisPer", e.target.value) }}
              />
              <span className="text-nowrap">{t("Dis. Amt.")}</span>
              <Input
                type="text"
                disabled={ischecked || disableDiscount}
                className="table-input"
                removeFormGroupClass={true}
                display={"right"}
                name={"bulkDiscountAmount"}
                value={bulkDiscount?.discountAmount ?? ""}
                onChange={(e) => { handleBulkDiscount("discountAmount", e.target.value) }}
              />
            </div>
          )}
          <ColorCodingSearch label={t("Pre Authorization")} color="color-indicator-29-bg" />
          {tbody?.some((item) => item?.IsPrescriptionRequired === 1) && <ColorCodingSearch label={t("Schedule Drug Prescription Required")} color="color-indicator-25-bg" />}
          {tbody?.some((item) => isLowStock(item, lowStockThreshold || 5)) && <ColorCodingSearch label={t("Low Stock") + ` (≤ ${lowStockThreshold || 5})`} color="low-stock-row" />}
          {tbody?.some((item) => isStockNearExpiry(item, nearExpiryMonths || 2)) && <ColorCodingSearch label={t("Near Expiry") + ` (≤ ${nearExpiryMonths || 2} months)`} color="near-expiry-blink-row" />}
        </>
      )} />}
      <Tables
        removeShorting={true}
        thead={thead}
        tbody={bodyData}
        scrollView={"scrollView"}
        getRowClass={getRowClass}

      />
    </>
  )
}
