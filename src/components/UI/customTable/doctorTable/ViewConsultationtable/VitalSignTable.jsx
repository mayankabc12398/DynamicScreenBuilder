import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../..";

const VitalSignTable = (props) => {
  const { tbody, handleEditVitalSignValue, patientDetail } = props;
  function formatDateTime(timestamp) {
    const date = new Date(timestamp);

    // Months array to get the month abbreviation
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Formatting the time to 12-hour format with AM/PM
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 to 12 for midnight
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    // Combine to form the required format
    const formattedDateTime = `${day}-${month}-${year} ${formattedTime}`;
    return formattedDateTime;
  }
  // const {tbody} = props;
  // console.log(tbody);

  const [t] = useTranslation();
  const isFemale = patientDetail?.Gender === "F" || patientDetail?.Sex === true;

  const THEAD = [
    t("S.No"),
    // t("Delta Check"),
    t("BP"),
    t("Pulse"),
    t("Resp."),
    t("Temp."),
    t("Height(cm)"),
    t("Weight(kg)"),
    t("BMI"),
    t("Arm Span"),
    t("SHeight"),
    t("IBW"),
    t("SPO2"),
    t("CBG"),
    t("PainScore"),
    t("Remark"),
    t("HR"),
    t("RR"),
    t("BSA"),
    t("FBS/RBS"),
    ...(isFemale ? [t("Pregnant")] : []),
    t("Entry By"),
    t("Entry Date Time"),
    t("Allergy"),
    t("Actions"),
  ];

  return (
    <>
      <Tables
        thead={THEAD}
        tbody={tbody?.map((item, index) => {
          return {
            "S.No": index + 1,
            BP: item.BP || "",
            Pulse: item.P || "",
            "Resp.": item.R || "",
            "Temp.": item.T || "",
            "Height(cm)": item?.AdjustedHT || "",
            "Weight(kg)": item?.WT || "",
            BMI: item?.BMI || "",
            "Arm Span": item?.ArmSpan || "",
            SHeight: item?.SHight || "",
            IBW: item?.IBWKg || "",
            SPO2: item?.SPO2 || "",
            CBG: item?.CBG || "",
            PainScore: item?.PainScore || "",
            Remark: item?.Remarks || "",
            // HR: item?.HeightRemarks || "",
            HR: item?.Hr || "",
            RR: item?.Rr || "",
            BSA: item?.Bsa || "",
            "FBS/RBS": item?.FBS || "",
            ...(isFemale ? { Pregnant: item?.IsPregnancy ? "Yes" : "No" } : {}),
            "Entry By": item?.Username || "",
            "Entry Date Time": formatDateTime(item?.EntryDate),
            Allergy: item?.Allergy || "",

            Actions: (
              <>
                <i
                  className="fa fa-edit "
                  style={{ padding: "5px" }}
                  onClick={() => handleEditVitalSignValue(item)}
                ></i>
              </>
            ),
          };
        })}
        // tbody={tbody?.map((item,index)=>({
        //   "Delta Check	":"",
        //   "Date":item?.DATE,
        //   "BarcodeNo":item?.BarcodeNo,
        //   "Department":item?.Department,
        //   "Investigations":item?.Name,
        //   "Pacs Images":"",
        // }))}
        // tbody={
        //   {
        //     "Delta Check":"",
        //   "Date":props?.tbody?.DATE,
        //   "BarcodeNo":props?.tbody?.BarcodeNo,
        //   "Department":props?.tbody?.Department,
        //   "Investigations":props?.tbody?.Name,
        //   "Pacs Images":"",
        //   }
        // }
        // tableHeight={"tableHeight"}
        tableHeight={"scrollView"}
      />
    </>
  );
};

export default VitalSignTable;
