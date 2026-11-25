import React, { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../../../components/UI/customTable";
import { SelectIconSVG } from "../../../components/SvgIcons";
import { GetDemandItemDetailsPrint, MarkedasUsedDraftAPI } from "../../../networkServices/pharmecy";
import { notify } from "../../../utils/ustil2";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { RedirectURL } from "../../../networkServices/PDFURL";

export default function PendingDraft({
  bodyData,
  getPendingDraftList,
  SelectDroftItem,
}) {
  const [t] = useTranslation();
  let userData = useLocalStorage("userData", "get");
  const thead = [
    { name: t("S.No."), width: "1%" },
    { name: t("UHID"), width: "1%" },
    { name: t("Patient Name"), width: "1%" },
    { name: t("Mobile"), width: "1%" },
    { name: t("Address"), width: "1%" },
    { name: t("Total Items"), width: "1%" },
    // { name: t("Select"), width: "1%" },
    { name: t("Delete"), width: "1%" },
    { name: t("Print"), width: "1%" },
  ];
  useEffect(() => {
    getPendingDraftList();
  }, []);
  
  const handleDelete = async (e, val) => {
    e.stopPropagation();
    let apiRes = await MarkedasUsedDraftAPI({ DID: val?.ID });
    if (apiRes?.success) {
      notify(apiRes?.message, "success");
      getPendingDraftList();
    } else {
      notify(apiRes?.message, "error");
    }
  };
  const handlePrint = async (e, val) => {
    e.stopPropagation();
    const payload = {
      demandDraftID:val?.ID,
      deptLedgerNo: userData?.defaultRole,
    
    };
    let apiRes = await GetDemandItemDetailsPrint(payload);
    if (apiRes?.success) {
       RedirectURL(apiRes?.data?.pdfUrl);
      // notify(apiRes?.message, "success");
      // getPendingDraftList();
    } else {
      notify(apiRes?.message, "error");
    }
  };
  return (
    <>
      <Tables
        thead={thead}
        tbody={bodyData?.map((val, index) => ({
          sno: index + 1,
          UHID: val?.PatientID,
          PName: val?.PName,
          ContactNo: val?.ContactNo,
          Address: val?.Address,
          TotalItems: val?.TotalItems,
          Delete: (
            <i
              className="fa fa-trash text-danger text-center"
              onClick={(e) => {
                handleDelete(e, val);
              }}
              aria-hidden="true"
            ></i>
          ),
          Print: (
            <i
              className="fa fa-print text-info text-center"
              onClick={(e) => {
                handlePrint(e, val);
              }}
              aria-hidden="true"
            ></i>
          ),
        }))}
        style={{ height: "20vh" }}
        getRowClick={SelectDroftItem}
      />
    </>
  );
}
