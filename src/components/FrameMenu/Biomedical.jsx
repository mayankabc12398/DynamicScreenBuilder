import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import {
  bindBioMedicalDataApi,
  saveBiomedicalApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const Biomedical = ({ data }) => {
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
            {t("Ensure All medical gases are ok and at the right pressures")}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("Medical oxygen")}</li>
            <li>{t("Nitrous Oxide")}</li>
            <li>{t("Compressed Medical Air.")}</li>
            <li>{t("Vacuum")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "bio_Done1",
        dateDone: "bioDate_Done1",
        notDone: "bio_NotDone1",
        comment: "bio_Comment1",
      },
    },

    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Ensure All equipment in the theatre and ICU are in good working")}
            <br /> {t("conditions and connections are done correctly")}{" "}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("Anesthetic machines")}</li>
            <li>{t("Cardiac Monitors")}</li>
            <li>{t("Heart Lung Machine")}</li>
            <li>{t("Heart Cooler")}</li>
            <li>{t("Theatre tables")}</li>
            <li>{t("Blood gas Machines")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "bio_Done2",
        dateDone: "bioDate_Done2",
        notDone: "bio_NotDone2",
        comment: "bio_Comment2",
      },
    },
    { type: "section", label: t("Intra Operative") },

    {
      type: "row",
      label:
        t("Ensure All medical gases are ok and at the right pressures AS ABOVE"),
      payloadKeys: {
        done: "bio_Done3",
        dateDone: "bioDate_Done3",
        notDone: "bio_NotDone3",
        comment: "bio_Comment3",
      },
    },
    {
      type: "row",
      label:
        t("Ensure All equipment in the theatre and ICU are in good working conditions AS ABOVE"),
      payloadKeys: {
        done: "bio_Done4",
        dateDone: "bioDate_Done4",
        notDone: "bio_NotDone4",
        comment: "bio_Comment4",
      },
    },

    { type: "section", label: t("Post Operative") },

    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Ensure All equipment in the theatre and ICU are in good working")}
            <br />
            {t("conditions and connections are done correctly")}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("Cardiac Monitors")}</li>
            <li>{t("Blood gas Machines")}</li>
            <li>{t("Other emergency equipment")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "bio_Done5",
        dateDone: "bioDate_Done5",
        notDone: "bio_NotDone5",
        comment: "bio_Comment5",
      },
    },
  ];

  const [payload, setPayload] = useState({
    bio_Done1: "",
    bioDate_Done1: new Date(),
    bio_NotDone1: "",
    bio_Comment1: "",

    bio_Done2: "",
    bioDate_Done2: new Date(),
    bio_NotDone2: "",
    bio_Comment2: "",

    bio_Done3: "",
    bioDate_Done3: new Date(),
    bio_NotDone3: "",
    bio_Comment3: "",

    bio_Done4: "",
    bioDate_Done4: new Date(),
    bio_NotDone4: "",
    bio_Comment4: "",

    bio_Done5: "",
    bioDate_Done5: new Date(),
    bio_NotDone5: "",
    bio_Comment5: "",

    pid: "",
    tid: "",
  });

  const [isRecordExist, setIsRecordExist] = useState(false);
  const [recordId, setRecordId] = useState(null);

  const parseApiDate = (dateStr) => (dateStr ? new Date(dateStr) : null);

  const getApiKey = (frontendKey) => {
    const number = frontendKey.match(/\d+$/)?.[0];
    if (frontendKey.includes("bioDate_Done")) return `Item${number}_Date`;
    if (frontendKey.includes("bio_Done")) return `Item${number}_Done`;
    if (frontendKey.includes("bio_NotDone")) return `Item${number}_NotDone`;
    if (frontendKey.includes("bio_Comment")) return `Item${number}_Comment`;
    return frontendKey;
  };

  const fetchBiomedicalData = async () => {
    try {
      const res = await bindBioMedicalDataApi(transactionID, patientID);
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
      console.error("Error fetching biomedical data:", error);
    }
  };

  useEffect(() => {
    fetchBiomedicalData();
  }, []);

  const handleSave = async () => {
    const savePayload = {
      pid: patientID,
      tid: transactionID,
    };

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

    const res = await saveBiomedicalApi(savePayload);

    if (res?.success) {
      notify(res.message, "success");
      fetchBiomedicalData();
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
            className="form-control"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            value={payload[done]}
            onChange={(e) => handleChange(done, e.target.value)}
          />
          <DatePicker
            className="custom-calender"
            placeholder={VITE_DATE_FORMAT}
            value={payload[dateDone]}
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            handleChange={(e) => handleChange(dateDone, e.target.value)}
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

export default Biomedical;
