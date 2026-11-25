import React from "react";
import { useSelector } from "react-redux";
import Tables from "..";
import ColorCodingSearch from "../../../commonComponents/ColorCodingSearch";
import Heading from "../../Heading";
import { useTranslation } from "react-i18next";

const RoomShiftTable = ({ THEAD, tbody, onCancel }) => {
  const [t] = useTranslation();
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isShowCancel =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "ShowRoomShiftCancel")
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
      return "IsConform";
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
            IPDNo: item?.IPDNo,
            UHID: item?.MRNo,
            "Patient Name": item?.PName,
            "Room Type": item?.RoomType,
            Room: item?.Room,
            "Entry Date": item?.EntryDate,
            "Leave Date": item?.LeaveDate,
            "Shifted By": item?.Name,
            Status: item?.Status,
          };
          if (isShowCancel) {
            row.Action =
              item?.Status === "IN" && hasMultipleRecords ? (
                <i
                  className="fa fa-times text-danger"
                  style={{ cursor: "pointer", fontSize: "16px" }}
                  aria-hidden="true"
                  title={t("Cancel Room Shift")}
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

export default RoomShiftTable;
