import React from "react";
import Tables from "..";
import { useTranslation } from "react-i18next";

const BloodTransfusionMonitoringTable = ({ tbody, handleEdit }) => {
  const { t } = useTranslation();
  const thead = [
    { name: t("S.No."), width: "4%" },
    { width: "4%", name: t("UHID") },
    t("Name"),
    t("Entry By"),
    // t("Upload"),
    // t("View"),
    t("Edit"),
    // t("Print"),
  ];
  return (
    <>
      <Tables
        thead={thead}
        tbody={tbody?.map((ele, index) => ({
          srNo: index + 1,
          patientID: ele?.patientID,
          PName: ele?.PName,
          NAME: ele?.NAME,
          // upload: <i className="fa fa-upload" aria-hidden="true"></i>,
          // view: <i className="fa fa-eye" aria-hidden="true"></i>,
          edit: (
            <span onClick={() => handleEdit(index, ele)}>
              <i className="fa fa-edit" aria-hidden="true"></i>
            </span>
          ),
          // print: <i class="fa fa-print" aria-hidden="true"></i>,
        }))}
      />
    </>
  );
};

export default BloodTransfusionMonitoringTable;
