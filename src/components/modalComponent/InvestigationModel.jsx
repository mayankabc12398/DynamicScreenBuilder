/* import React, { useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import {
  bindEMRInvItem,
  saveEMRInvItem,
} from "../../networkServices/Emergency";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";

const InvestigationModel = ({ transactionID, onClose, onSaved, data }) => {
  const [invData, setInvData] = useState([]);
  const [openNumeric, setOpenNumeric] = useState(true);
  const [openText, setOpenText] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bindEMRInvItem(transactionID);

        const formatted = (res?.data || []).map((x) => ({
          ...x,
          Type: x.ReportType === 1 ? "Text" : "Numeric",
        }));

        setInvData(formatted);
      } catch {
        setInvData([]);
      }
    };
    load();
  }, [transactionID]);

  const numericHead = [{ name: "Test Name" }, { name: "Value" }];

  const numericBody = invData
    .filter((x) => x.Type === "Numeric")
    .map((row) => ({
      "Test Name": row.ItemName || "-",
      Value: row.Quantity || "-",
    }));

  const textHead = [
    { name: "Department Name" },
    { name: "Investigation" },
    { name: "Date" },
  ];

  const textBody = invData
    .filter((x) => x.Type === "Text")
    .map((row) => ({
      "Department Name": row.DeptName || "-",
      Investigation: row.NAME || row.LabInves_Description || "-",
      Date: row.DATE || "-",
    }));

  const handleSave = async () => {
    try {
      const getType = (data) => (data.Type || data.type || "").toLowerCase();

      const numericInv = invData
        .filter((data) => getType(data) === "numeric")
        .map((data) => ({
          patientID: data.PatientID || "",
          transactionID: data.TransactionID,
          investigation_ID: data.InvestigationID,
          labInvestigationIPD_ID: data.LabInvestigationIPD_ID,
          remarks: data.Remarks,
          test_ID: data.Test_ID,
        }));

      const numericText = invData
        .filter((data) => getType(data) === "text")
        .map((data) => ({
          patientID: data.PatientID || "",
          transactionID: data.TransactionID,
          investigation_ID: data.InvestigationID,
          labInvestigationIPD_ID: data.LabInvestigationIPD_ID,
          remarks: data.Remarks,
          test_ID: data.Test_ID,
        }));

      const payload = { numericInv, numericText };

      const response = await saveEMRInvItem(payload);

      notify("Investigations saved successfully!", "success");
      onSaved?.(response);
    } catch (err) {
      console.error(err);
      notify("Failed to save investigations.", "error");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "60%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "75%",
        height: "60%",
        background: "white",
        border: "3px solid #0a4c8c",
        zIndex: 999999,
        padding: 8,
      }}
    >
      <div
        style={{
          background: "#0a4c8c",
          padding: "6px",
          color: "white",
          fontWeight: "bold",
          fontSize: "18px",
          textAlign: "center",
          position: "relative",
        }}
      >
        Investigation Result
        <AiOutlineClose
          onClick={onClose}
          style={{
            position: "absolute",
            right: "-14px",
            top: "-14px",
            cursor: "pointer",
            width: "28px",
            height: "28px",
            color: "#ff3333",
            background: "white",
            borderRadius: "50%",
            border: "2px solid #0a4c8c",
            padding: "2px",
          }}
        />
      </div>

      <div
        style={{
          height: "calc(100% - 90px)",
          overflowY: "auto",
          background: "#f3f3f3",
          padding: 10,
        }}
      >
        <div
          onClick={() => setOpenNumeric(!openNumeric)}
          style={{
            background: "#007bff",
            color: "white",
            padding: "8px",
            cursor: "pointer",
            marginBottom: "5px",
            fontWeight: "bold",
            border: "1px solid #0056b3",
          }}
        >
          Investigation Details Numeric ( IPD )
        </div>

        {openNumeric && (
          <div
            style={{ padding: "10px", background: "white", marginBottom: 10 }}
          >
            <Tables thead={numericHead} tbody={numericBody} />
          </div>
        )}

        <div
          onClick={() => setOpenText(!openText)}
          style={{
            background: "#007bff",
            color: "white",
            padding: "8px",
            cursor: "pointer",
            marginBottom: "5px",
            fontWeight: "bold",
            border: "1px solid #0056b3",
          }}
        >
          Investigation Details Text ( IPD )
        </div>

        {openText && (
          <div
            style={{ padding: "10px", background: "white", marginBottom: 10 }}
          >
            <Tables thead={textHead} tbody={textBody} />
          </div>
        )}
      </div>

      {invData.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            padding: "10px",
            background: "#fff",
            borderTop: "1px solid #ccc",
          }}
        >
          <button
            onClick={handleSave}
            style={{
              padding: "5px 18px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default InvestigationModel;
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import {
  bindEMRInvItem,
  saveEMRInvItem,
} from "../../networkServices/Emergency";
import { notify } from "../../utils/utils";
export default function InvestigationModel({ transactionID, onSaved, data }) {
  const [t] = useTranslation();
  const [invData, setInvData] = useState([]);
  const [openNumeric, setOpenNumeric] = useState(true);
  const [openText, setOpenText] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bindEMRInvItem(transactionID);
        const formatted = (res?.data || []).map((x) => ({
          ...x,
          Type: x.ReportType === 1 ? "Text" : "Numeric",
        }));

        setInvData(formatted);
      } catch {
        setInvData([]);
      }
    };
    load();
  }, [transactionID]);

  const numericHead = [{ name: t("Test Name") }, { name: t("Value") }];

  const numericBody = invData
    .filter((x) => x.Type === "Numeric")
    .map((row) => ({
      "Test Name": row.ItemName || "-",
      Value: row.Quantity || "-",
    }));

  const textHead = [
    { name: t("Department Name") },
    { name: t("Investigation") },
    { name: t("Date") },
  ];

  const textBody = invData
    .filter((x) => x.Type === "Text")
    .map((row) => ({
      "Department Name": row.DeptName || "-",
      Investigation: row.NAME || row.LabInves_Description || "-",
      Date: row.DATE || "-",
    }));

  const handleSave = async () => {
    try {
      const getType = (data) => (data.Type || data.type || "").toLowerCase();

      const numericInv = invData
        .filter((data) => getType(data) === "numeric")
        .map((data) => ({
          patientID: data.PatientID || "",
          transactionID: data.TransactionID,
          investigation_ID: data.InvestigationID,
          labInvestigationIPD_ID: data.LabInvestigationIPD_ID,
          remarks: data.Remarks,
          test_ID: data.Test_ID,
        }));

      const numericText = invData
        .filter((data) => getType(data) === "text")
        .map((data) => ({
          patientID: data.PatientID || "",
          transactionID: data.TransactionID,
          investigation_ID: data.InvestigationID,
          labInvestigationIPD_ID: data.LabInvestigationIPD_ID,
          remarks: data.Remarks,
          test_ID: data.Test_ID,
        }));

      const payload = { numericInv, numericText };

      const response = await saveEMRInvItem(payload);

      notify(t("Investigations saved successfully!"), "success");
      onSaved?.(response);
    } catch (err) {
      console.error(err);
      notify(t("Failed to save investigations."), "error");
    }
  };

  return (
    <div className="row p-2">
      <div className="w-100">
        <div
          onClick={() => setOpenNumeric(!openNumeric)}
          className="background-theme-color theme-color rounded px-3 my-2"
        >
          {t("Investigation Details Numeric ( IPD ) (click Here)")}
        </div>

        {openNumeric && (
          <div
            style={{ padding: "10px", background: "white", marginBottom: 10 }}
          >
            <Tables thead={numericHead} tbody={numericBody} />
          </div>
        )}

        <div
          className="background-theme-color theme-color rounded px-3 my-2"
          onClick={() => setOpenText(!openText)}
        >
          {t("Investigation Details Text ( IPD ) (click Here")}
        </div>

        {openText && (
          <div
            style={{ padding: "10px", background: "white", marginBottom: 10 }}
          >
            <Tables thead={textHead} tbody={textBody} />
          </div>
        )}
      </div>

      {invData.length > 0 && (
        <div>
          <button className="btn btn-sm btn-success" onClick={handleSave}>
            {t("Save")}
          </button>
        </div>
      )}
    </div>
  );
}
