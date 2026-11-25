import React from "react";
import Input from "../../../formComponent/Input";
import TimePicker from "../../../formComponent/TimePicker";
import { useTranslation } from "react-i18next";

const DynamicInputTable = ({
  headers = [],
  rows = 4,
  columns = [],
  payload,
  handleChange,
  handleDateTimeChange,
}) => {
  const [t] = useTranslation();
  return (
    <table className="table table-bordered">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col, colIndex) => {
              const fieldName =
                rowIndex === 0 ? col.base : `${col.base}${rowIndex}`;
              // console.log(fieldName);

              return (
                <td key={colIndex}>
                  {col.type === "time" ? (
                    <TimePicker
                      placeholderName={t("Time")}
                      id={fieldName}
                      name={fieldName}
                      value={payload[fieldName] || ""}
                      handleChange={handleDateTimeChange}
                    />
                  ) : (
                    <Input
                      id={fieldName}
                      type="text"
                      className="form-control"
                      placeholder=""
                      name={fieldName}
                      value={payload[fieldName] || ""}
                      onChange={handleChange}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DynamicInputTable;
