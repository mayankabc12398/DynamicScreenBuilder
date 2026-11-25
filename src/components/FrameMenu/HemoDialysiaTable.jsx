import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Tables from "../UI/customTable";
import { bindGrid } from "../../networkServices/nursingWardAPI";

const HemodialysisTable = ({ data }) => {
  const { t } = useTranslation();
  const { transactionID, patientID, id } = data || {};

  const [tableData, setTableData] = useState([]);

  const thead = [
    { name: t("S.NO") },
    { name: t("Entered By") },
    { name: t("Print") },
  ];

  const fetchList = async () => {
    try {
      const res = await bindGrid(transactionID, patientID, id);
      if (res?.success && Array.isArray(res.data)) {
        setTableData(res.data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.error("Grid load error:", error);
    }
  };

  useEffect(() => {
    if (transactionID && patientID) {
      fetchList();
    }
  }, [transactionID, patientID, id]);

  const tbody = tableData.map((item, index) => ({
    sno: index + 1,
    enteredBy: item?.EntryDate1 || "-",
    print: <button className="btn btn-sm btn-primary">{t("Print")}</button>,
  }));

  return <Tables thead={thead} tbody={tbody} />;
};

export default HemodialysisTable;
