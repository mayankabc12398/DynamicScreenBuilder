import React from "react";
import ReactSelect from "../../../formComponent/ReactSelect";
import Input from "../../../formComponent/Input";

const UniversalDynamicTable = ({
  rows,
  payload,
  handleSelectChange,
  handleChange,
  Options,
}) => {
  const renderCell = (row) => {
    if (row.type === "labelOnly") {
      return ""; 
    }
    if (row.type === "select") {
      return (
        <ReactSelect
          id={row.field || ""}
          name={row.field || ""}
          value={payload[row.field] || ""}
          dynamicOptions={Options || ""}
          handleChange={handleSelectChange || ""}
          respclass="col-xl-6 col-md-4 col-sm-4 col-12"
        />
      );
    }

    if (row.type === "text") {
      return (
        <Input
          className="form-control"
          id={row.field}
          name={row.field}
          value={payload[row.field]}
          onChange={handleChange}
          respclass="col-xl-6 col-md-4 col-sm-4 col-12"
        />
      );
    }

    return row.value || "";
  };

  return (
    <table className="table table-bordered">
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <td style={{ width: "65%" }}>{row.label}</td>
            <td style={{ width: "35%" }}>{renderCell(row)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UniversalDynamicTable;
