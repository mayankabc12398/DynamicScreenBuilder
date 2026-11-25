import React from "react";
import Tables from "..";
import Heading from "../../Heading";
import ColorCodingSearch from "../../../commonComponents/ColorCodingSearch";
import { useTranslation } from "react-i18next";

const ServiceDetailsTable = ({ THEAD, tbody }) => {
  const [t] = useTranslation();
  console.log(tbody)
  return (
    <>
      <Heading
        title={t("Service Items")}
        secondTitle={
          <>
            <ColorCodingSearch color={"orange"} label={t("Reserved")} />
            <ColorCodingSearch color={"green"} label={t("Issued")} />
          </>
        }
      />
      <Tables
        thead={THEAD}
        tbody={tbody?.map((item, index) => ({
          "Sr No.": index + 1,
          "Doctor Name": item?.Dname,
          "Blood Group": item?.BloodGroup,
          Component: item?.Iscomponent,
          "Req.Qty": item?.Quantity,
          "Issue Qty": item?.IssueQty,
          "Reject Qty": item?.RejectQty,
          "Pen.Qty": item?.PendingQuantity,
          "Cross Matched Qty": item?.CrossMatchQty,
          "Reserve Date": item?.ReserveDate,
          View: <i className="fa fa-eye" aria-hidden="true"></i>,
        }))}
        tableHeight={"tableHeight"}
        style={{ height: "auto" }}
        // getRowClass={getRowClass}
      />
    </>
  );
};

export default ServiceDetailsTable;
