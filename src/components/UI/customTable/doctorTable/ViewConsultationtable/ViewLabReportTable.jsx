import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../..";
import { notify } from "../../../../../utils/utils";
import { BindLabReport } from "../../../../../networkServices/resultEntry";
import { RedirectURL } from "../../../../../networkServices/PDFURL";
import Heading from "../../../Heading";
import ColorCodingSearch from "../../../../commonComponents/ColorCodingSearch";

const ViewLabReportTable = ({ tbody }) => {
  const [t] = useTranslation();

  const THEAD = [
    { name: t("Delta Check"), width: "3%" },
    { name: t("Date") },
    { name: t("BarcodeNo") },
    { name: t("Department") },
    { name: t("Investigations") },
    { name: t("View Report"), width: "3%" },
  ];

  const handleBindLabReport = async (Test_ID) => {
    const payload = {
      testID: Test_ID,
      isOnlinePrint: "1",
      isConversion: "",
      isNabl: "0",
      orderBy: "",
      labType: "1",
      ipAddress: "",
      isPrev: true,
    };

    try {
      const apiResp = await BindLabReport(payload);

      if (!apiResp?.success || !apiResp?.data) {
        notify(t("No records found"), "error");
        return;
      } else if (apiResp?.success) {
        RedirectURL(apiResp?.data);
        return;
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      notify(t("An error occurred while fetching data"), "error");
    }
  };

  const getRowClass = (item) => {
    debugger;
    switch (item?.Status) {
      case "SC":
        return "statusDocOut";
      case "NA":
        return "color-indicator-006-bg";
      case "RN":
        return "CreditPanelLimitOver";
      case "A":
        return "LightGreen";
      case "SN":
        return "color-indicator-005-bg";
        
      default:
        return "";
    }
  };
  return (
    <>
      <div className="py-2">
        <div className="">
          <Heading
            title={t("Lab Reports")}
            isBreadcrumb={false}
            secondTitle={
              <>
                <ColorCodingSearch
                  label={t("Test Prescribed")}
                  color="#9d80c2"
                />
                <ColorCodingSearch
                  label={t("Sample Collected")}
                  color="#d39797"
                />
                <ColorCodingSearch label={t("Not Approved")} color="#ffbfbf" />
                <ColorCodingSearch label={t("Approved")} color="LightGreen" />
              </>
            }
          />
        </div>
        <Tables
          thead={THEAD}
          tbody={tbody?.map((item, index) => ({
            "Delta Check": (
              <i className="pi pi-search" style={{ padding: "5px" }}></i>
            ),
            Date: item?.DATE,
            BarcodeNo: item?.BarcodeNo,
            Department: item?.Department,
            Investigations: item?.Name,
            "View Report":
              item?.canViewReport === 1 ? (
                <div
                  className="d-flex justify-content-center align-items-center hover_effect"
                  onClick={() => handleBindLabReport(item.Test_ID)}
                  style={{ cursor: "pointer" }}
                >
                  <i
                    className="fa fa-eye"
                    style={{ padding: "5px", textAlign: "center" }}
                  ></i>
                </div>
              ) : null,
          }))}
          tableHeight={"tableHeight"}
          getRowClass={(rowData, index) => getRowClass(tbody?.[index])}
        />
      </div>
    </>
  );
};

export default ViewLabReportTable;
