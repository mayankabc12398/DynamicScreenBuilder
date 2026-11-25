import React, { useEffect, useRef } from "react";
import { DataGrid, GridColumn } from "rc-easyui";
import { useTranslation } from "react-i18next";

const EasyUI = ({
  dataBind,
  dataColoum,
  onClick,
  selectedIndex,
  setDataBind,
  cellCss,
  // Optional size override. The default below is a fixed 1000px, which is
  // wider than a form cell and wider than most panels, so anywhere the grid is
  // used as a drop-down under a narrow field it is cut off by the first
  // ancestor that clips. Callers that know their own width pass it here; every
  // existing caller keeps the 1000px it has always had.
  gridStyle,
  // Optional grid width; screens that pass nothing keep the 1000px grid.
  gridWidth,
  cellCssClass
}) => {
  // useEffect(() => {
  //   if (selectedIndex !== null) {
  //     debugger;
  //     const data = document.getElementsByClassName("datagrid-row");
  //     console.log(data[selectedIndex].classList);
  //   }
  // }, [selectedIndex]);
  const [t] = useTranslation();

  const closeEassyUIRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        closeEassyUIRef.current &&
        !closeEassyUIRef.current.contains(event.target)
      ) {
        setDataBind && setDataBind([]); // Close dropdown
      }
    };
    // Add event listener to the document
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup the event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Reset classes for all rows
    const rows = document.querySelectorAll(".datagrid-body .datagrid-row");
    rows.forEach((row) => {
      row.classList.remove("selected-row"); // Remove selected-row class from all rows
    });

    // Apply class to the selected row
    if (
      selectedIndex !== null &&
      selectedIndex >= 0 &&
      selectedIndex < dataBind.length
    ) {
      const selectedRow = rows[selectedIndex];
      selectedRow?.classList.add("selected-row"); // Add selected-row class to the selected row
    }
  }, [selectedIndex, dataBind]);
  return (
    <div ref={closeEassyUIRef}>
      <DataGrid
        style={{ maxHeight: 500, width: gridWidth || "1000px",gridStyle }}
        pagination
        selectionMode="single"
        onRowClick={(rowData) => onClick(rowData)} // Use onRowClick instead of onSelectionChange
        data={dataBind}
        pagePosition="bottom"
        pageOptions={{
          layout: [
            "list",
            "sep",
            "first",
            "prev",
            "next",
            "last",
            "sep",
            "refresh",
            "sep",
            "manual",
            "info",
          ],
        }}
      >

        {dataColoum?.map((data, index) => (
          <GridColumn
            key={index}
            field={data?.field}
            title={t(data?.title)}
            width={data?.width}
            hcellCss={"text-theme-colornew background-theme-colornew"}
            align={data?.align}
            render={data?.bold
              ? ({ value }) => (
                <span style={{ fontWeight: "bold" }}>{value}</span>
              )
              : undefined
            }
            headerCss={data?.bold ? { fontWeight: "bold" } : undefined}
            cellCss={(row, value) => {
              const cls = cellCssClass ? cellCssClass(row) : "";
              return {
                backgroundColor: cellCss && cellCss(row, value),
                fontWeight: data?.bold ? "bold" : "normal",
                animation: cls === "near-expiry-blink" ? "nearExpiryBlink 1s ease-in-out infinite" : undefined,
              };
            }}
          // cellCss={(row, value) => { return { backgroundColor: cellCss && cellCss(row, value) } }}
          />
        ))}
      </DataGrid>
    </div>
  );
};

export default EasyUI;
