import React from "react";
import { useSelector } from "react-redux";
import Tables from "..";
import Heading from "../../Heading";
import ColorCodingSearch from "../../../commonComponents/ColorCodingSearch";
import { useTranslation } from "react-i18next";

// showShiftBy: adds Requested By / Approved By (Approve Doctor Shift Request page); the other
// pages that use this table keep their columns.
const DoctorShiftTable = ({ THEAD, tbody, onCancel, showShiftBy = false }) => {
  const [t] = useTranslation();
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isShowCancel =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "ShowDoctorShiftCancel")
      ?.Value === "1";

  const hasMultipleRecords = tbody?.length > 1;

  const finalThead = isShowCancel
    ? [...THEAD, { width: "4%", name: t("Action") }]
    : THEAD;

  const getRowClass = (val) => {
    let slotConfirmationDetail = tbody?.find(
      (item) => item?.Status === val?.Status
    );
    if (slotConfirmationDetail?.Status === "IN") {
      return " IsConform";
    } else if (slotConfirmationDetail?.Status == "OUT") {
      return "Statusdone";
    }
  };

  return (
    <>
      <Heading
        title={t("Item Details")}
        secondTitle={
          <>
            <ColorCodingSearch color={"#ddffc3"} label={t("In")} />
            <ColorCodingSearch color={"#e7c2e1"} label={t("Out")} />
          </>
        }
      />
      <Tables
        thead={finalThead}
        tbody={tbody?.map((item, index) => {
          const row = {
            SNo: index + 1,
            "Admitted Under": item?.AdmittedUnder,
            "Current Consultant": item?.CurrentConsultant,
            "Entry Date": item?.EntryDate,
            "Leave Date": item?.LeaveDate,
            "Shifted By": item?.Name,
            ...(showShiftBy
              ? {
                  "Requested By": item?.RequestedBy || "",
                  "Approved By": item?.ApprovedBy || "",
                }
              : {}),
            Status: item?.Status,
          };
          if (isShowCancel) {
            row.Action =
              item?.Status === "IN" && hasMultipleRecords ? (
                <i
                  className="fa fa-times text-danger"
                  style={{ cursor: "pointer", fontSize: "16px" }}
                  aria-hidden="true"
                  title={t("Cancel Doctor Shift")}
                  onClick={() => onCancel?.(item)}
                ></i>
              ) : (
                ""
              );
          }
          return row;
        })}
        tableHeight={"tableHeight"}
        getRowClass={getRowClass}
      />
    </>
  );
};

export default DoctorShiftTable;
