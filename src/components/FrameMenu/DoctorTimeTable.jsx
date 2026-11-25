import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Heading from "../../components/UI/Heading";
import Table from "react-bootstrap/Table";
import {
  GetBindDepartment,
  GetBindAllDoctorConfirmation,
} from "@store/reducers/common/CommonExportFunction";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import TextAreaInput from "@components/formComponent/TextAreaInput";
import { useLocation } from "react-router-dom";
import { notify } from "@app/utils/utils";
import {
  SaveMealTimeTable,
  GetMealTimeTableData,
  PrintMealTimeTable,
} from "@app/networkServices/MealTimeTableApi";
import { RedirectURL } from "../../networkServices/PDFURL";

const DoctorTimeTable = (props) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const dispatch = useDispatch();
  const location = useLocation();
  const { state } = location;
  const localData = useLocalStorage("userData", "get");
  console.log("GetBindAllDoctorConfirmationData", props);
  const { GetDepartmentList, GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );

  const [values, setValues] = useState({
    department: "All",
    doctor: "All",
    date: new Date(),
    selectedOption: "Normal", // Example for Radio Button implementation
    remarks: "",
  });

  const [tableData, setTableData] = useState([]);

  const days = [
    "Time",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const patientID =
    props?.PatientID ||
    props?.patientDetail?.PatientID ||
    props?.patientDetail?.currentPatient?.PatientID ||
    state?.PatientID ||
    state?.patientData?.PatientID ||
    state?.currentPatient?.PatientID ||
    "";
  const transactionID =
    props?.TransactionID ||
    props?.patientDetail?.TransactionID ||
    props?.patientDetail?.currentPatient?.TransactionID ||
    state?.TransactionID ||
    state?.patientData?.TransactionID ||
    state?.currentPatient?.TransactionID ||
    "";

  useEffect(() => {
    dispatch(GetBindDepartment());
    dispatch(
      GetBindAllDoctorConfirmation({
        Department: "All",
        CentreID: localData?.centreID,
      }),
    );

    // Initialize table data with days
    const initialData = days.map((day) => ({
      Day: day,
      EarlyMorning: "",
      Breakfast: "",
      MidMorning: "",
      Lunch: "",
      EveningTea: "",
      Dinner: "",
      AfterDinner: "",
    }));

    // Fetch previous data if PatientID and TransactionID are available
    if (patientID && transactionID) {
      fetchPreviousData(patientID, transactionID, initialData);
    } else {
      setTableData(initialData);
    }
  }, [dispatch, patientID, transactionID]);

  const fetchPreviousData = async (pID, tID, initialData) => {
    try {
      const res = await GetMealTimeTableData({
        PatientID: pID,
        TransactionID: tID,
      });

      const dataToBind = Array.isArray(res) ? res : res?.data || [];
      const isSuccess = Array.isArray(res) || res?.status || res?.success;

      if (isSuccess && dataToBind.length > 0) {
        const updatedData = initialData.map((dayRow) => {
          const apiRow = dataToBind.find((item) => item.Days === dayRow.Day);
          if (apiRow) {
            return {
              ...dayRow,
              EarlyMorning: apiRow.EMorning || "",
              Breakfast: apiRow.Breakfast || "",
              MidMorning: apiRow.MMorning || "",
              Lunch: apiRow.Lunch || "",
              EveningTea: apiRow.EveningTea || "",
              Dinner: apiRow.Dinner || "",
              AfterDinner: apiRow.AfterDinner || "",
            };
          }
          return dayRow;
        });
        setTableData(updatedData);

        // Set remarks from the first record that has it
        const remarkRecord = dataToBind.find((item) => item.Remarks);
        if (remarkRecord) {
          setValues((prev) => ({ ...prev, remarks: remarkRecord.Remarks }));
        }
      } else {
        setTableData(initialData);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setTableData(initialData);
    }
  };

  const handleReactSelectChange = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));

    if (name === "department") {
      dispatch(
        GetBindAllDoctorConfirmation({
          Department: val?.label || "All",
          CentreID: localData?.centreID,
        }),
      );
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemarksChange = (e) => {
    const value = e.target.value || "";
    const max = 1000;

    if (value.length >= max) {
      notify(t("Maximum 1000 characters allowed"), "error");
    }

    setValues((prev) => ({
      ...prev,
      remarks: value.slice(0, max),
    }));
  };

  const handleSave = async () => {
    try {
      // Format all data into an array of payloads for a single API call
      const payload = tableData.map((row) => ({
        PatientID: patientID,
        TransactionID: transactionID,
        Days: row.Day,
        EMorning: row.EarlyMorning,
        Breakfast: row.Breakfast,
        MMorning: row.MidMorning,
        Lunch: row.Lunch,
        EveningTea: row.EveningTea,
        Dinner: row.Dinner,
        AfterDinner: row.AfterDinner,
        Remarks: values.remarks,
      }));

      const res = await SaveMealTimeTable(payload);

      if (
        res?.status === true ||
        res?.success === true ||
        res?.status === 200
      ) {
        notify(t("Meal Time Table Saved Successfully"), "success");
      } else {
        notify(res?.message || t("Failed to save Meal Time Table"), "error");
      }
    } catch (error) {
      console.error("Save Error:", error);
      notify(t("Error saving Meal Time Table"), "error");
    }
  };

  const handlePrint = async () => {
    try {
      const payload = {
        PatientID: patientID,
        TransactionID: transactionID,
      };
      const res = await PrintMealTimeTable(payload);
      debugger;
      if (res?.success) {
        RedirectURL(res?.data?.pdfUrl);
      } else {
        notify(res?.message || t("Failed to generate PDF"), "error");
      }
    } catch (error) {
      console.error("Print Error:", error);
      notify(t("Error generating PDF"), "error");
    }
  };

  const thead = [
    { name: t("Days"), width: "10%" },
    { name: t("Early Morning"), width: "12%" },
    { name: t("Breakfast"), width: "12%" },
    { name: t("Mid Morning"), width: "12%" },
    { name: t("Lunch"), width: "12%" },
    { name: t("Evening Tea"), width: "12%" },
    { name: t("Dinner"), width: "12%" },
    { name: t("After Dinner"), width: "12%" },
  ];

  return (
    <div className="card patient_registration border mt-1 p-2">
      <Heading title={t("Patient Meal Time Table")} isBreadcrumb={true} />

      <div className="card patient_registration_card mt-1">
        <div id="no-more-tables" className="custom-scrollbar TabScroll">
          <div className="row">
            <div className="col-12">
              <Table className="mainTable pt-2" bordered>
                <thead>
                  <tr>
                    {thead.map((head, index) => (
                      <th
                        key={index}
                        style={{
                          width: head.width,
                        }}
                      >
                        {head.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: "white" }}>
                  {tableData.map((val, index) => {
                    const isTimeRow = val?.Day === "Time";
                    const cellStyle = isTimeRow
                      ? {
                          border: "2px solid red",
                          color: "red",
                          fontWeight: "bold",
                          padding: "5px",
                          display: "block",
                          borderRadius: "3px",
                        }
                      : {};

                    const inputStyle = isTimeRow
                      ? {
                          border: "2px solid red",
                        }
                      : {};

                    return (
                      <tr key={index}>
                        <td className="px-2" data-title={t("Days")}>
                          <span style={cellStyle}>{t(val?.Day)}</span>
                        </td>
                        <td className="px-2" data-title={t("Early Morning")}>
                          <input
                            type="text"
                            className="form-control btn-sm"
                            style={inputStyle}
                            placeholder={t("Enter Details")}
                            value={val.EarlyMorning}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[index].EarlyMorning = e.target.value;
                              setTableData(newData);
                            }}
                          />
                        </td>
                        <td className="px-2" data-title={t("Breakfast")}>
                          <input
                            type="text"
                            className="form-control btn-sm"
                            style={inputStyle}
                            placeholder={t("Enter Details")}
                            value={val.Breakfast}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[index].Breakfast = e.target.value;
                              setTableData(newData);
                            }}
                          />
                        </td>
                        <td className="px-2" data-title={t("Mid Morning")}>
                          <input
                            type="text"
                            className="form-control btn-sm"
                            style={inputStyle}
                            placeholder={t("Enter Details")}
                            value={val.MidMorning}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[index].MidMorning = e.target.value;
                              setTableData(newData);
                            }}
                          />
                        </td>
                        <td className="px-2" data-title={t("Lunch")}>
                          <input
                            type="text"
                            className="form-control btn-sm"
                            style={inputStyle}
                            placeholder={t("Enter Details")}
                            value={val.Lunch}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[index].Lunch = e.target.value;
                              setTableData(newData);
                            }}
                          />
                        </td>
                        <td className="px-2" data-title={t("Evening Tea")}>
                          <input
                            type="text"
                            className="form-control btn-sm"
                            style={inputStyle}
                            placeholder={t("Enter Details")}
                            value={val.EveningTea}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[index].EveningTea = e.target.value;
                              setTableData(newData);
                            }}
                          />
                        </td>
                        <td className="px-2" data-title={t("Dinner")}>
                          <input
                            type="text"
                            className="form-control btn-sm"
                            style={inputStyle}
                            placeholder={t("Enter Details")}
                            value={val.Dinner}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[index].Dinner = e.target.value;
                              setTableData(newData);
                            }}
                          />
                        </td>
                        <td className="px-2" data-title={t("After Dinner")}>
                          <input
                            type="text"
                            className="form-control btn-sm"
                            style={inputStyle}
                            placeholder={t("Enter Details")}
                            value={val.AfterDinner}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[index].AfterDinner = e.target.value;
                              setTableData(newData);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <div className="card patient_registration_card mt-1 p-2">
        <div className="row">
          <div className="col-12">
            <div className="mb-2">
              <Heading
                title={t("Point to be remembered")}
                isBreadcrumb={false}
              />
            </div>
            <TextAreaInput
              lable={""}
              id="remarks"
              maxLength="1000"
              showTooltipCount="1000"
              rows={4}
              name="remarks"
              value={values?.remarks}
              onChange={handleRemarksChange}
              placeholder={t("")}
            />
          </div>
        </div>
      </div>

      <div className="row mt-2 p-2 no-print">
        <div className="col-12 text-right">
          <button
            className="btn btn-sm btn-primary px-4 mr-2"
            type="button"
            onClick={handleSave}
          >
            {t("Save Schedule")}
          </button>
          <button
            className="btn btn-sm btn-info px-4"
            type="button"
            onClick={handlePrint}
          >
            {t("Print")}
          </button>
        </div>
      </div>

      {/* Printable Area - Hidden by default, shown only during print */}
      <div className="printable-content d-none d-print-block">
        <style>
          {`
            @media print {
              @page {
                size: A4 landscape;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
              .d-print-block {
                display: block !important;
              }
              .printable-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 12px;
              }
              .printable-table th, .printable-table td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
              }
              .printable-table th {
                background-color: #f2f2f2 !important;
                -webkit-print-color-adjust: exact;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
              }
            }
          `}
        </style>

        {/* <div className="print-header">
          <h2>{t("Patient Meal Time Table")}</h2>
          <div className="row">
            <div className="col-6 text-left">
              <strong>{t("Patient ID")}:</strong> {patientID}
            </div>
            <div className="col-6 text-right">
              <strong>{t("Transaction ID")}:</strong> {transactionID}
            </div>
          </div>
        </div>

        <table className="printable-table">
          <thead>
            <tr>
              {thead.map((head, i) => (
                <th key={i}>{head.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i}>
                <td>{t(row.Day)}</td>
                <td>{row.EarlyMorning}</td>
                <td>{row.Breakfast}</td>
                <td>{row.MidMorning}</td>
                <td>{row.Lunch}</td>
                <td>{row.EveningTea}</td>
                <td>{row.Dinner}</td>
                <td>{row.AfterDinner}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3">
          <strong>{t("Remarks")}:</strong>
          <p
            style={{
              whiteSpace: "pre-wrap",
              border: "1px solid #eee",
              padding: "10px",
            }}
          >
            {values.remarks || t("N/A")}
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default DoctorTimeTable;
