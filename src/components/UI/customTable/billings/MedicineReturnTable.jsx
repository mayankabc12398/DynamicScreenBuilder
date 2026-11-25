import React from "react";
import Tables from "..";
import Input from "../../../formComponent/Input";
import Heading from "../../Heading";
import { useTranslation } from "react-i18next";

const MedicineReturnTable = ({
  THEAD,
  tbody,
  handleItemsChange,
  handleSelect,
  // Indent-wise medicine work (fin_global_resources 'IsIndentWiseMedicineOPDReturn').
  // The caller passes the same flag it used to build THEAD - <Tables> lines heads
  // up with row keys by position, so the head and this cell go together.
  showIssueSource = false,
}) => {
  const [t] = useTranslation();
  console.log("tbodytbodytbody", tbody);
  console.log("handleItemsChange",handleItemsChange)
  return (
    <>
     <Heading title={(t("Medicine Return"))} />
      <Tables
      isSearch={true}
        thead={THEAD}
        tbody={tbody?.map((ele, index) => ({
          Code: ele?.Code,
          "Item Name": ele?.ItemName,
          ...(showIssueSource
            ? { IssuedFrom: ele?.IssueSource || "IPD" }
            : {}),

          AvailQty: ele?.inHandUnits||"0",
          IndentQty: ele?.IndentQty||"0",
          Rate: ele?.PerUnitSellingPrice,
          Quantity: (
            <Input
              className="table-input"
              name="quantity"
              removeFormGroupClass={true}
              type="number"
              min={0}
              max={ele?.inHandUnits || 0}
              step={1}
              onKeyDown={(e) => {
                // whole numbers only - no decimal point, sign or exponent
                if ([".", ",", "e", "E", "-", "+"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const raw = String(e?.target?.value ?? "").replace(/\D/g, "");
                const num = Number(raw);
                const max = Number(ele?.inHandUnits || 0);
                const clamped = Number.isNaN(num) ? 0 : Math.max(0, Math.min(num, max));
                handleItemsChange(index, "quantity", clamped, ele);
              }}
              value={ele?.quantity}
            />
          ),
          Remarks: (
            <Input
              className="table-input"
              name="Remarks"
              removeFormGroupClass={true}
              type="text"
              onChange={(e) =>
                handleItemsChange(index, "Remarks", e.target.value, ele)
              }
              value={ele?.Remarks}
            />
          ),
          Select: (
            <input
              type="checkbox"
              name="IsChecked"
              className="table-checkbox"
              checked={ele?.IsChecked || false}
              onChange={(e) => handleSelect(e, index, ele)}
            />
          ),
        }))}
        tableHeight={"tableHeight"}
        // style={{ maxHeight: "120px" }}
      />
    </>
  );
};

export default MedicineReturnTable;
