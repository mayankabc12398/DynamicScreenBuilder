import React, { useState, useEffect } from "react";
import NewTables from "../UI/customTable/NestedTable";
import Heading from "../UI/Heading";
import { toast } from "react-toastify";
import {
  icuGetDataApi,
  ICUSafetyCheckListReport,
  saveTaskStatus,
} from "../../networkServices/nursingWardAPI";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import { useTranslation } from "react-i18next";

const ICUSafetyChecklist = ({ data }) => {
  const [t] = useTranslation();
  const tasks = [
    "Safety Checks",
    "Disposable airway (correct size)",
    "Ambu-bag/Mask",
    "Disposable catheter",
    "Mount",
    "HME Dated",
    "Functional suction unit",
    "Functional overhead lamp",
    "Functional Torch",
    "Cardiac Monitor",
    "ECG cable/alarms on",
    "NIBP Module/Alarms on",
    "CVP/Alarms on",
    "SPO2/Alarms on",
    "PP/Alarm on",
    "Temp probe /Alarms on",
    "Infection Control",
    "Task 18",
    "Task 19",
    "Task 20",
  ];

  const [startDate, setStartDate] = useState(new Date());
  const [tableData, setTableData] = useState({});

  const normalizeDate = (d) => new Date(d).toISOString().split("T")[0];

  const getDatesArray = (start, days = 10) =>
    Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return normalizeDate(d);
    });

  const handleprint = async () => {
    try {
      const r = await ICUSafetyCheckListReport(
        data?.patientID,
        data?.transactionID,
      );
      if (r.success) {
        RedirectURL(r.data?.pdfUrl);
      }
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const fetchData = async () => {
    try {
      const res = await icuGetDataApi(data?.transactionID,data?.patientID);
      const apiList = res?.data || [];

      const dates = getDatesArray(startDate);
      const initialData = {};

      dates.forEach((date) => {
        initialData[date] = {};
        tasks.forEach((task, idx) => {
          const match =
            apiList.find(
              (t) => t.TaskName === task && normalizeDate(t.Date) === date,
            ) || {};

          initialData[date][idx] = {
            day: match.Day === "done",
            night: match.Night === "done",
          };
        });
      });

      setTableData(initialData);
    } catch (err) {
      console.error(err);
      toast.error(t("Error fetching data"));
    }
  };

  useEffect(() => {
    if (data?.transactionID) {
      fetchData();
    }
  }, [data?.transactionID, startDate]);

  const handleCheckboxChange = (date, taskIdx, shift) => (e) => {
    setTableData((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [taskIdx]: {
          ...prev[date][taskIdx],
          [shift]: e.target.checked,
        },
      },
    }));
  };

  const convertToApiFormat = () => {
    const taskDataList = [];

    Object.keys(tableData).forEach((date) => {
      tasks.forEach((task, idx) => {
        const row = tableData[date][idx] || {};
        taskDataList.push({
          taskID: idx + 1,
          taskName: task,
          date: new Date(date).toISOString(),
          dayStatus: row.day ? "done" : "pending",
          nightStatus: row.night ? "done" : "pending",
        });
      });
    });
    debugger;
    return {
      patientID: String(data?.patientID || ""),
      transactionID: String(data?.transactionID || ""),
      doctorID: String(data?.doctorID || ""),
      panelID: String(data?.panelID || ""),
      createdBy: String(data?.createdBy || ""),
      centreID: String(data?.centreID || ""),
      taskDataList,
    };
  };

  const handleSave = async () => {
    try {
      await saveTaskStatus(convertToApiFormat());
      toast.success(t("Data saved successfully!"));
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(t("Error saving data"));
    }
  };

  const handlePrevious = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 10);
    setStartDate(d);
  };

  const handleNext = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 10);
    setStartDate(d);
  };

  const tableHeader = [
    { label: t("Task"), isVisible: true },
    ...getDatesArray(startDate).map((date) => ({
      label: new Date(date).toLocaleDateString("en-GB"),
      children: [{ label: "Day" }, { label: "Night" }],
      isVisible: true,
    })),
  ];

  const renderCheckbox = (date, idx, shift) => (
    <input
      type="checkbox"
      checked={tableData?.[date]?.[idx]?.[shift] || false}
      onChange={handleCheckboxChange(date, idx, shift)}
    />
  );

  const tableBody = tasks.map((task, idx) => {
    const row = { Task: task };
    Object.keys(tableData).forEach((date) => {
      row[`${date}_day_${idx}`] = renderCheckbox(date, idx, "day");
      row[`${date}_night_${idx}`] = renderCheckbox(date, idx, "night");
    });
    return row;
  });

  return (
    <div className="card patient_registration border mt-2">
      <div className="card card_background">
        <Heading title={t("ICU Equipment & Safety Checklist")} />

        <div className="d-flex mb-2">
          <button
            className="btn btn-secondary btn-sm mr-2"
            onClick={handlePrevious}
          >
            {t("Previous")}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleNext}>
            {t("Next")}
          </button>
        </div>

        <NewTables
          thead={tableHeader}
          tbody={tableBody}
          scrollView="table-scroll"
          tableHeight="table-height"
        />

        <div className="d-flex justify-content-end mt-3">
          <button className="btn btn-primary btn-sm mr-2" onClick={handleSave}>
            {t("Save")}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleprint()}
          >
            {t("Print")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ICUSafetyChecklist;
