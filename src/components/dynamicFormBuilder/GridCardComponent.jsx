import React from "react";
import HandleFieldTypeControl from "./HandleFieldTypeControl";
import AlignTableText from "../commonComponents/AlignTableText";
import Tables from "../UI/customTable";
import { useTranslation } from "react-i18next";

// styline inline

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "12px",
  padding: "10px",
};

const makeCardStyle = (borderColor = "#0d6efd") => ({
  border: "1px solid #e0e0e0",
  borderRadius: "10px",
  overflow: "hidden",
  background: "#fff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  borderLeft: `5px solid ${borderColor}`,
});

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px 6px",
  borderBottom: "1px solid #f0f0f0",
  background: "#fafafa",
};

const cardBodyStyle = {
  padding: "8px 12px",
};

const cardFieldStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "4px",
  fontSize: "12px",
};

const cardLabelStyle = {
  color: "#888",
  fontWeight: 600,
  textTransform: "uppercase",
  fontSize: "11px",
  letterSpacing: "0.3px",
};

const cardValueStyle = {
  color: "#333",
  fontWeight: 600,
  fontSize: "12px",
  textAlign: "right",
  maxWidth: "60%",
  wordBreak: "break-word",
};

//toggle

export const ViewToggle = ({ viewMode, setViewMode }) => {
  const { t } = useTranslation();

  return (
    <div className="ml-3 no-print" style={{ display: "inline-flex", gap: "6px" }}>
      <button
        title={t("List View")}
        onClick={() => setViewMode("list")}
        style={{
          padding: "6px 14px",
          border: viewMode === "list" ? "1.5px solid #7c3aed" : "none",
          borderRadius: "6px",
          cursor: "pointer",
          background: viewMode === "list" ? "#ede9fe" : "#fff",
          color: viewMode === "list" ? "#7c3aed" : "#888",
          fontSize: "13px",
          lineHeight: 1,
          fontWeight: viewMode === "list" ? 600 : 400,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.15s ease",
        }}
      >
        <i className="fa fa-list" style={{ fontSize: "13px" }}></i>
        {t("List")}
      </button>

      <button
        title={t("Card View")}
        onClick={() => setViewMode("card")}
        style={{
          padding: "6px 14px",
          border: viewMode === "card" ? "1.5px solid #7c3aed" : "none",
          borderRadius: "6px",
          cursor: "pointer",
          background: viewMode === "card" ? "#ede9fe" : "#fff",
          color: viewMode === "card" ? "#7c3aed" : "#888",
          fontSize: "13px",
          lineHeight: 1,
          fontWeight: viewMode === "card" ? 600 : 400,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.15s ease",
        }}
      >
        <i className="fa fa-th-large" style={{ fontSize: "13px" }}></i>
        {t("Cards")}
      </button>
    </div>
  );
};


//  list (table) view 

export const MultiGridListView = ({ field, tableBody, keys }) => (
  <Tables
    // title={field?.lable}
    thead={keys.map((val) => ({
      name: val === "id" ? "S.No." : val?.split("*")[1],
    }))}
    tbody={tableBody}
    style={{ maxHeight: "60vh" }}
    scrollView={"scrollView"}
  />
);


// card view for multiGridList grids.

export const MultiGridCardView = ({ field, deleteMultiGridList }) => {
  const keys = Object.keys(field?.multiGridList[0] || {});

  return (
    <div style={cardGridStyle}>
      {field.multiGridList?.map((val, rowIdx) => (
        <div key={val?.id ?? rowIdx} style={makeCardStyle("#0d6efd")}>
          <div style={cardHeaderStyle}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#222" }}>
              #{rowIdx + 1}
            </span>
          </div>
          <div style={cardBodyStyle}>
            {keys.map((item) => {
              if (item === "id") return null;
              const colName = item?.split("*")[1] ?? item;
              const colKey = item?.split("*")[0];
              const displayVal = val[item]?.label ? val[item]?.label : typeof val[item] !== "object" ? val[item] : "-";

              return (
                <div key={item} style={cardFieldStyle}>
                  <span style={cardLabelStyle}>{colName}</span>
                  {colKey === "Delete" ? (
                    <i
                      className="fa fa-trash text-danger"
                      style={{ cursor: "pointer" }}
                      onClick={() => deleteMultiGridList(val, rowIdx)}
                    ></i>
                  ) : (
                    
                    <span style={cardValueStyle}>{displayVal?? "—"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};


// list (table) view 

export const StandardGridListView = ({ field, tableHeader, tableBody, tfootData }) => (
  <Tables
    isSearch={field?.IsSearchable}
    isExportPDf={field?.IsPdf}
    isExportExcel={field?.IsExcel}
    title={field?.lable}
    thead={tableHeader?.map((val) => ({
      name: val?.tableColumnName,
      width: val?.tableColumnWidth,
      textAlign: val?.tableColumnAlignment,
    }))}
    tbody={tableBody}
    tfoot={tfootData}
    style={{ maxHeight: "60vh" }}
    scrollView={"scrollView"}
  />
);


// card view
export const GridCardView = ({ tableHeader, gridData, handleAction, field, fields, setFields }) => { const [t] = useTranslation(); return ( (
  <div style={cardGridStyle}>
    {gridData.length === 0 ? (
      <div className="text-center py-4 text-muted col-12">{t("No Data Found")}</div>
    ) : (
      gridData.map((val, rowIdx) => (
        <div key={rowIdx} style={makeCardStyle("#0d6efd")}>
          <div style={cardHeaderStyle}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#222" }}>
              #{rowIdx + 1}
            </span>
          </div>
          <div style={cardBodyStyle}>
            {tableHeader.map((item) => {
              if (item?.tableKey === "S.No.") return null;
              if (item?.IsAction) {
                const actionBtns = item?.tableKey
                  ?.split("_")
                  ?.filter((b) => b !== "Action");
                return (
                  <div
                    key={item.tableKey}
                    style={{
                      ...cardFieldStyle,
                      justifyContent: "flex-end",
                      gap: "6px",
                      marginTop: "6px",
                    }}
                  >
                    {actionBtns.map((btnval) => (
                      <i
                        key={btnval}
                        className={`fa fa-${btnval} ${btnval === "trash" ? "text-danger" : ""}`}
                        style={{ cursor: "pointer", fontSize: "14px" }}
                        onClick={() => handleAction(val, field, true)}
                      ></i>
                    ))}
                  </div>
                );
              }
              return (
                <div key={item.tableKey} style={cardFieldStyle}>
                  <span style={cardLabelStyle}>{item.tableColumnName}</span>
                  <span style={cardValueStyle}>
                    <HandleFieldTypeControl
                      val={val}
                      item={item}
                      index={rowIdx}
                      field={field}
                      fields={fields}
                      setFields={setFields}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))
    )}
  </div>
)); };