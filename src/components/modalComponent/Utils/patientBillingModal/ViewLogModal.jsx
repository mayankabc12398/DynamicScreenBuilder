import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../../../UI/customTable";
import { GetBillItemEditLog } from "../../../../networkServices/BillingsApi";
import { ROUNDOFF_VALUE } from "../../../../utils/constant";

// Department Details grid ka View Log. Jo services Edit Item screen se update hui
// hain unhi ko dikhata hai - pehle kya tha (Old), kya update hua (New), kisne kiya,
// kab kiya. Har edit f_ledgertnxdetail_edit_log me hai; log banne se pehle ke edits
// ki purani value store nahi thi, unme Old "-" aata hai.
const ViewLogModal = ({ transID, configID, departmentName }) => {
  const [t] = useTranslation();
  const [logs, setLogs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await GetBillItemEditLog(transID, configID);
        setLogs(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.log(error, "Something Went Wrong");
        setLogs([]);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchLogs();
  }, [transID, configID]);

  const thead = [
    { width: "3%", name: t("S.No.") },
    { width: "13%", name: t("Service Name") },
    { width: "6%", name: t("Old Rate") },
    { width: "6%", name: t("New Rate") },
    { width: "5%", name: t("Old Qty") },
    { width: "5%", name: t("New Qty") },
    { width: "5%", name: t("Old Disc. %") },
    { width: "5%", name: t("New Disc. %") },
    { width: "6%", name: t("Old Disc. Amt.") },
    { width: "6%", name: t("New Disc. Amt.") },
    { width: "6%", name: t("Old Net Amt.") },
    { width: "6%", name: t("New Net Amt.") },
    { width: "10%", name: t("Edit Reason") },
    { width: "9%", name: t("Updated By") },
    { width: "9%", name: t("Updated On") },
  ];

  const amount = (value) => (
    <div className="text-right">
      {Number(value || 0).toFixed(ROUNDOFF_VALUE)}
    </div>
  );

  // Old value: "-" when it was never stored; red when it differs from the new one.
  const oldAmount = (oldValue, newValue) => {
    if (oldValue === null || oldValue === undefined || oldValue === "")
      return <div className="text-right">-</div>;
    const changed = Number(oldValue) !== Number(newValue);
    return (
      <div className="text-right" style={changed ? { color: "#c0392b" } : {}}>
        {Number(oldValue || 0).toFixed(ROUNDOFF_VALUE)}
      </div>
    );
  };

  return (
    <div className="card">
      {departmentName && (
        <div className="p-2">
          <b>{t("Department")}:</b> {departmentName}
        </div>
      )}

      {logs.length > 0 ? (
        <Tables
          thead={thead}
          tableHeight={"50vh"}
          style={{ maxHeight: "70vh" }}
          tbody={logs.map((val, index) => ({
            sno: index + 1,
            ItemName: val?.ItemName || "",
            OldRate: oldAmount(val?.OldRate, val?.Rate),
            Rate: amount(val?.Rate),
            OldQuantity: oldAmount(val?.OldQuantity, val?.Quantity),
            Quantity: amount(val?.Quantity),
            OldDiscountPercentage: oldAmount(val?.OldDiscountPercentage, val?.DiscountPercentage),
            DiscountPercentage: amount(val?.DiscountPercentage),
            OldDiscAmt: oldAmount(val?.OldDiscAmt, val?.DiscAmt),
            DiscAmt: amount(val?.DiscAmt),
            OldAmount: oldAmount(val?.OldAmount, val?.Amount),
            Amount: amount(val?.Amount),
            EditReason: val?.EditReason || "",
            UpdatedBy: val?.UpdatedBy || "",
            UpdatedDate: val?.UpdatedDate
              ? new Date(val.UpdatedDate).toLocaleString()
              : "",
          }))}
          scrollView={"scrollView"}
        />
      ) : (
        <div className="p-3 text-center">
          {isLoaded ? t("No Update Found") : ""}
        </div>
      )}
    </div>
  );
};

export default ViewLogModal;
