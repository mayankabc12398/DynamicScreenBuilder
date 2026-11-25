import React from "react";
import Tables from "..";

const MedicineInvestigationTable = ({ THEAD, tbody, handleRemoveIR, handleQtyChange }) => {
  return (
    <>
      <Tables
        thead={THEAD}
        tbody={tbody?.map((ele, index) => ({
          sn:index+1,
          Code: ele?.Code,
          "Item Name": ele?.itemName,
          Dose: ele?.Dose,
          Time: ele?.Times,
          Duration: ele?.Duration,
          Route: ele?.Route,
          Meals: ele?.Meals,
          Quantity: handleQtyChange ? (
            <input
              type="number"
              min="0"
              step="1"
              onKeyDown={(e) => {
                if ([".", ",", "e", "E", "-", "+"].includes(e.key)) e.preventDefault();
              }}
              max={ele?.StockQty ?? ele?.MaxQuantity ?? ele?.Quantity}
              className="form-control"
              style={{ height: "22px", width: "70px", padding: "0 4px" }}
              value={ele?.Quantity ?? ""}
              onChange={(e) => handleQtyChange(index, e.target.value)}
            />
          ) : (
            ele?.Quantity
          ),
          Remarks: ele?.Remarks,
          Remove: (
            <i
              onClick={() => handleRemoveIR(index)}
              className="fa fa-trash text-danger text-center"
              style={{ color: "red" }}
              aria-hidden="true"
            ></i>
          ),
        }))}
        style={{ maxHeight: "none" }}
      />
    </>
  );
};

export default MedicineInvestigationTable;
