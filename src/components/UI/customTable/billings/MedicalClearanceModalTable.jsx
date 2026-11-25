import React, { useState } from "react";
import Tables from "..";
import MedicineRequisition from "../../../FrameMenu/MedicineRequisition";
import { useTranslation } from "react-i18next";
import SlideScreen from "../../../front-office/SlideScreen";

const MedicalClearanceModalTable = ({ THEAD, tbody, handleSlideScreen }) => {
  const [t] = useTranslation();

  const colorMap = {
    OPEN: "#CCF1FF",
    PENDING: "#CCF1FF",
    CLOSE: "color-indicator-24-bg",
    REJECT: "color-indicator-21-bg",
    PARTIAL: "color-indicator-26-bg",
  };

  const getRowClass = (val) => {
    const status = String(val?.StatusNew || val?.Status || "").toUpperCase();
    if (status === "OPEN" || status === "PENDING") {
      return "color-indicator-22-bg";
    } else if (status === "PARTIAL") {
      return "color-indicator-29-bg";
    } else if (status === "CLOSE") {
      return "color-indicator-24-bg";
    } else if (status === "REJECT") {
      return "color-indicator-25-bg";
    }
    return "";
  };

  const tbodyData = [
    {
      Srno: "1",
      "CR.No": "20GENERAL",
      RequisitionDate: "22/02/2024",
      RequisitionNo: "3343",
      ToDepartment: "XYZ",
      ViewRequisition: <i className="fa fa-search" aria-hidden="true"></i>,
    },
  ];
console.log("tbodytbodytbodytbody",tbody)

  return (
    <>
      <Tables
        thead={THEAD}
        tbody={Array.isArray(tbody) ? tbody?.map((item, index) => ({
          "#": index + 1,
          dtEntry: item?.dtEntry,
          indentno: item?.indentno,
          DeptTo: item?.DeptTo,
          StatusNew: item?.StatusNew,
          // colorcode: colorMap[String(item?.StatusNew || item?.Status || "").toUpperCase()] || "",
          ViewRequisition: (<i className="fa fa-search" aria-hidden="true" onClick={() => {
            handleSlideScreen(item)
          }}></i>)
        })) : []}
        getRowClass={getRowClass}
        tableHeight={"tableHeight"}
        style={{ maxHeight: "auto" }}
      />


    </>
  );
};

export default MedicalClearanceModalTable;
