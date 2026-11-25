import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import {
  bindDentalDataApi,
  save_DentalApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const DentalChecklist = ({ data }) => {
  const { transactionID, patientID } = data || {};
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { name: t("Sr.No"), width: "5%" },
    { name: t("ITEMS"), width: "35%" },
    { name: t("DATE DONE"), width: "28%" },
    { name: t("NOT DONE"), width: "" },
    { name: t("ACTION / COMMENTS"), width: "" },
  ];

  const tableItems = [
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("A full dental examination should be done on the patient to establish any problems.")}
            <br /> {t("Workup should be done at least a week to two weeks before the operation date.")}{" "}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("Symptoms of Endocarditis")}</li>
            <li>{t("Antibiotic prophylaxis before invasive procedures")}</li>
            <li>
              {t("Anticoagulation information regarding therapy and follow up.")}
            </li>
            <li>{t("To take history and reassure the patient")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "dental_Done1",
        dateDone: "dentalDate_Done1",
        notDone: "dental_NotDone1",
        comment: "dental_Comment1",
      },
    },

    { type: "section", label: t("Intra Operative") },

    {
      type: "row",
      label: t("No active role of the dentist"),
      payloadKeys: {
        done: "dental_Done2",
        dateDone: "dentalDate_Done2",
        notDone: "dental_NotDone2",
        comment: "dental_Comment2",
      },
    },

    { type: "section", label: t("Post Operative") },

    {
      type: "row",
      label: t("Dental hygiene education"),
      payloadKeys: {
        done: "dental_Done3",
        dateDone: "dentalDate_Done3",
        notDone: "dental_NotDone3",
        comment: "dental_Comment3",
      },
    },
  ];

  const [payload, setPayload] = useState({
    dental_Done1: "",
    dentalDate_Done1: new Date(),
    dental_NotDone1: "",
    dental_Comment1: "",

    dental_Done2: "",
    dentalDate_Done2: new Date(),
    dental_NotDone2: "",
    dental_Comment2: "",

    dental_Done3: "",
    dentalDate_Done3: new Date(),
    dental_NotDone3: "",
    dental_Comment3: "",

    pid: patientID || "",
    tid: transactionID || "",
  });

  const [isRecordExist, setIsRecordExist] = useState(false);
  const [recordId, setRecordId] = useState(null);

  const parseApiDate = (dateStr) => (dateStr ? new Date(dateStr) : new Date());

  const getApiKey = (frontendKey) => {
    const number = frontendKey.match(/\d+$/)?.[0];
    if (frontendKey.includes("dentalDate_Done")) return `Item${number}_Date`;
    if (frontendKey.includes("dental_Done")) return `Item${number}_Done`;
    if (frontendKey.includes("dental_NotDone")) return `Item${number}_NotDone`;
    if (frontendKey.includes("dental_Comment")) return `Item${number}_Comment`;
    return frontendKey;
  };

  const fetchDentalData = async () => {
    try {
      const res = await bindDentalDataApi(transactionID, patientID);

      if (res?.success && res.data?.length) {
        const apiData = res.data[0];
        setRecordId(apiData.Id || null);
        setIsRecordExist(true);

        const updatedPayload = {
          ...payload,
          pid: patientID,
          tid: transactionID,
        };

        tableItems.forEach((item) => {
          if (item.type === "row" && item.payloadKeys) {
            const { done, dateDone, notDone, comment } = item.payloadKeys;
            updatedPayload[done] = apiData[getApiKey(done)] || "";
            updatedPayload[notDone] = apiData[getApiKey(notDone)] || "";
            updatedPayload[comment] = apiData[getApiKey(comment)] || "";
            updatedPayload[dateDone] = parseApiDate(
              apiData[getApiKey(dateDone)]
            );
          }
        });

        setPayload(updatedPayload);
      } else {
        setIsRecordExist(false);
      }
    } catch (error) {
      console.error("Error fetching dental data:", error);
    }
  };

  useEffect(() => {
    fetchDentalData();
  }, []);
  const handleSave = async () => {
    const savePayload = { pid: patientID, tid: transactionID };

    tableItems.forEach((item) => {
      if (item.type === "row" && item.payloadKeys) {
        const { done, dateDone, notDone, comment } = item.payloadKeys;
        savePayload[done] = payload[done] || "";
        savePayload[dateDone] = payload[dateDone]
          ? payload[dateDone].toISOString()
          : "";
        savePayload[notDone] = payload[notDone] || "";
        savePayload[comment] = payload[comment] || "";
      }
    });

    if (recordId) savePayload.Id = recordId;

    const res = await save_DentalApi(savePayload);
    if (res?.success) {
      notify(res.message, "success");
      fetchDentalData();
    }
  };

  const handleChange = (name, value) => {
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  let srNo = 1;
  const TBODY = tableItems.map((item) => {
    if (item.type === "section") {
      return {
        "Sr.No": "",
        ITEMS: <b>{item.label}</b>,
        "DATE DONE": "",
        "NOT DONE": "",
        "ACTION / COMMENTS": "",
      };
    }

    const { done, dateDone, notDone, comment } = item.payloadKeys;

    return {
      "Sr.No": srNo++,
      ITEMS: item.label,
      "DATE DONE": (
        <div className="row">
          <Input
            type="text"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            className="form-control"
            value={payload[done]}
            onChange={(e) => handleChange(done, e.target.value)}
          />
          <DatePicker
            className="custom-calender"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            placeholder={VITE_DATE_FORMAT}
            value={payload[dateDone]}
            onChange={(e) => handleChange(done, e.target.value)}
          />
        </div>
      ),
      "NOT DONE": (
        <Input
          type="text"
          className="form-control"
          value={payload[notDone]}
          onChange={(e) => handleChange(notDone, e.target.value)}
        />
      ),
      "ACTION / COMMENTS": (
        <Input
          type="text"
          className="form-control"
          value={payload[comment]}
          onChange={(e) => handleChange(comment, e.target.value)}
        />
      ),
    };
  });

  return (
    <>
      <div className="patient_registration card mt-2">
        <Tables thead={THEAD} tbody={TBODY} />
      </div>

      <div className="d-flex justify-content-end mt-2 mb-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {isRecordExist ? t("Update") : t("Save")}
        </button>
      </div>
    </>
  );
};

export default DentalChecklist;
