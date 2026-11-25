import React, { useEffect, useState } from "react";
import Heading from "../../UI/Heading";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/ustil2";
import { getFlowSheetApi } from "../../../networkServices/Emergency";
import ReactSelect from "../../formComponent/ReactSelect";
import MultiSelectComp from "../../formComponent/MultiSelectComp";
import { Table } from "react-bootstrap";
import {
  FlowshitBindMedication,
  FlowshitBindVitals,
  FlowshitLabBindData,
} from "../../../networkServices/DoctorApi";
import { set } from "date-fns";
import VitalsChart from "./VitalsChart";
import { GiMedicines } from "react-icons/gi";
import { FaKitMedical } from "react-icons/fa6";

const FlowsheetModel = ({
  data,
  setShowMedicationCalendar,
  setShowNotesModal,
  setShowFlowSheet,
}) => {
  const [t] = useTranslation();
  const [values, setValues] = useState({
    Months: "1",
    Days: "0",
    visibleSections: ["lab", "medication", "vitals"],
  });
  const [flowData, setFlowData] = useState({
    lab: [],
    medication: [],
    vitals: [],
  });
  const [isVitalsGraphView, setIsVitalsGraphView] = useState(false);

  const DaysType = Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1} Days`,
    value: `${i + 1}`,
  }));
  const MonthsType = [
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1} Month`,
      value: `${i + 1}`,
    })),
    { label: t("2 Year"), value: "24" },
    { label: t("3 Year"), value: "36" },
    { label: t("4 Year"), value: "48" },
    { label: t("5 Year"), value: "60" },
    { label: t("All"), value: "0" },
  ];

  useEffect(() => {
    bindData();
  }, []);

  const handleReactSelect = (name, value) => {
    setValues({ ...values, [name]: value?.value });
  };

  const handleMultiSelectChange = (name, value) => {
    setValues({ ...values, [name]: value });
  };

  const handleSearch = () => {
    bindData();
  };

  // Helper to get unique dates from data for Medication
  const getUniqueDates = (items) => {
    const dates = new Set();
    items.forEach((item) => {
      const d = item.date || item.DATE || item.Date;
      if (d) {
        const dateObj = new Date(d);
        if (!isNaN(dateObj)) {
          const yyyy = dateObj.getFullYear();
          const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
          const dd = String(dateObj.getDate()).padStart(2, "0");
          dates.add(`${yyyy}-${mm}-${dd}`);
        }
      }
    });
    return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
  };

  const uniqueLabDates = getUniqueDates(flowData.lab);
  const uniqueMedDates = getUniqueDates(flowData.medication);

  const bindData = async () => {
    const payload = {
      SDate: "",
      Span: values?.Months,
      SpanDays: values?.Days,
      PatientId: data?.PatientID,
      PatientType: "OPD",
    };
    const VitalRes = await FlowshitBindVitals(payload);
    const LabRes = await FlowshitLabBindData(payload);
    const MedicationRes = await FlowshitBindMedication(payload);
    if (VitalRes?.success) {
      setFlowData((val) => ({
        ...val,
        vitals: VitalRes?.data || [],
      }));
    } else {
      setFlowData((val) => ({
        ...val,
        vitals: [],
      }));
      // notify(VitalRes?.message, "error");
    }
    if (LabRes?.success) {
      setFlowData((val) => ({
        ...val,
        lab: LabRes?.data || [],
      }));
    } else {
      setFlowData((val) => ({
        ...val,
        lab: [],
      }));
      // notify(LabRes?.message, "error");
    }
    if (MedicationRes?.success) {
      setFlowData((val) => ({
        ...val,
        medication: MedicationRes?.data || [],
      }));
    } else {
      setFlowData((val) => ({
        ...val,
        medication: [],
      }));
      // notify(MedicationRes?.message, "error");
    }
  };

  useEffect(() => {
    if (values?.visibleSections?.length > 0) {
      bindData();
    }
  }, [values?.Months, values?.Days, values?.visibleSections]);

  return (
    <div className="flowsheet-wrapper">
      <div className="row m-2 align-items-end">
        <div className="col-xl-3 col-md-4 col-sm-4 col-12">
          <MultiSelectComp
            placeholderName={t("Select Sections")}
            name="visibleSections"
            value={values.visibleSections}
            handleChange={handleMultiSelectChange}
            dynamicOptions={[
              { name: "Lab", value: "lab" },
              { name: "Medication", value: "medication" },
              { name: "Vitals", value: "vitals" },
            ]}
            optionValue="value"
            respclass="mb-0"
          />
        </div>
        <ReactSelect
          placeholderName="Days"
          name="Days"
          value={values.Days}
          handleChange={handleReactSelect}
          dynamicOptions={DaysType}
          searchable={true}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
        />
        <ReactSelect
          placeholderName="Months"
          name="Months"
          value={values.Months}
          handleChange={handleReactSelect}
          dynamicOptions={MonthsType}
          searchable={true}
          respclass="col-xl-3 col-md-4 col-sm-4 col-12"
        />
        {values?.visibleSections?.includes("vitals") && (
          <button
            className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 
    ${isVitalsGraphView ? "btn-outline-light" : "btn-primary"}`}
            onClick={() => setIsVitalsGraphView(!isVitalsGraphView)}
            style={{
              borderRadius: "20px",
              transition: "all 0.25s ease",
              fontWeight: 500,
              marginBottom: "6px",
              color: "white",
              gap: "5px",
              height: "fit-content",
            }}
          >
            <i
              className={`bi ${isVitalsGraphView ? "bi-table" : "bi-graph-up"}`}
              style={{ fontSize: "14px", marginTop: "12px" }}
            ></i>

            <span style={{ fontSize: "13px" }}>
              {isVitalsGraphView ? t("Table View") : t("Graph View")}
            </span>
          </button>
        )}
        {/* <button className='btn btn-sm btn-primary' onClick={handleSearch}>{t("Search")}</button> */}
        <button
          className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary mb-2 mx-1 "
          onClick={() => {
            setShowMedicationCalendar(data);
            setShowFlowSheet(false);
          }}
        >
          <GiMedicines className="pointer-cursor" />
        </button>
        <button
          className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-1.5 btn-primary mb-2 mx-1 "
          onClick={() => {
            setShowNotesModal(data);
            setShowFlowSheet(false);
          }}
        >
          <FaKitMedical className="pointer-cursor" />
        </button>
      </div>

      <div className="flowsheet-content p-2">
        {/* VITALS - Vertical Format */}
        {values.visibleSections.includes("vitals") && (
          <div className="mb-4">
            <div className="section-vscroll">
              <div className="sticky-section-title d-flex justify-content-between align-items-center pe-2">
                <div className="flex-grow-1">
                  <Heading title={t("VITALS")} />
                </div>
              </div>
              <div
                className="flowsheet-scroll"
                style={{ maxHeight: isVitalsGraphView ? "none" : "11vw" }}
              >
                {isVitalsGraphView ? (
                  <VitalsChart vitalsData={flowData.vitals} />
                ) : (
                  <Table bordered hover size="sm" className="flowsheet-table-v">
                    <thead className="bg-success text-white">
                      <tr>
                        <th style={{ minWidth: "150px" }}></th>
                        {flowData.vitals.map((v, i) => {
                          const dateObj = new Date(v.date || v.DATE || "");
                          const dateStr = !isNaN(dateObj)
                            ? `${String(dateObj.getDate()).padStart(2, "0")}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${dateObj.getFullYear()}`
                            : "N/A";
                          return (
                            <th key={`dt-${i}`} className="text-center">
                              <div>{dateStr}</div>
                              <div>{v.time || v.TIME || "N/A"}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "BP", keys: ["bp", "BP"] },
                        { label: "Pulse", keys: ["pulse", "P"] },
                        { label: "Resp", keys: ["resp", "R"] },
                        { label: "HT", keys: ["ht", "HT", "height"] },
                        { label: "T", keys: ["t", "T", "temp"] },
                        { label: "WT", keys: ["wt", "WT", "weight"] },
                        { label: "Arm Span", keys: ["armSpan", "ArmSpan"] },
                        {
                          label: "Sitting Height",
                          keys: ["sHeight", "SHight", "sittingHeight"],
                        },
                        { label: "IBW", keys: ["ibw", "IBWKg"] },
                        { label: "SPO2", keys: ["spO2", "SPO2"] },
                        {
                          label: "Blood Glucose",
                          keys: ["bloodGlucose", "CBG"],
                        },
                        {
                          label: "Pain Score",
                          keys: ["painScore", "PainScore"],
                        },
                        { label: "Remark", keys: ["remark", "Remarks"] },
                      ].map((row, idx) => (
                        <tr key={idx}>
                          <td className="bg-light font-weight-bold">
                            {t(row.label)}
                          </td>
                          {flowData.vitals.map((v, i) => {
                            const value = row.keys.reduce(
                              (acc, key) => acc || v[key],
                              null,
                            );
                            return (
                              <td key={i} className="text-center">
                                {value || "-"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LABS - Standard with Dynamic Dates */}
        {values.visibleSections.includes("lab") && (
          <div className="mb-4">
            <div className="section-vscroll">
              <div className="sticky-section-title">
                <Heading title={t("LABS")} />
              </div>
              <div className="flowsheet-scroll" style={{ maxHeight: "11vw" }}>
                <Table
                  bordered
                  hover
                  size="sm"
                  className="flowsheet-table flowsheet-table-lab"
                >
                  <thead className="bg-success text-white">
                    <tr>
                      <th>{t("Investigation")}</th>
                      <th>{t("Parameter")}</th>
                      <th>{t("Range")}</th>
                      {uniqueLabDates.map((date) => {
                        // Format date from YYYY-MM-DD to DD-MM-YYYY for display
                        const [y, m, d] = date.split("-");
                        return (
                          <th
                            key={date}
                            className="text-center"
                          >{`${d}-${m}-${y}`}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(
                      flowData.lab.reduce((acc, curr) => {
                        const testName =
                          curr.NAME || curr.name || curr.testName || "N/A";
                        const obsName =
                          curr.labObservationName ||
                          curr.observationName ||
                          curr.parameter ||
                          "N/A";
                        const key = `${testName}-${obsName}`;
                        if (!acc[key]) {
                          acc[key] = {
                            test: testName,
                            observation: obsName,
                            range:
                              curr.diffference ||
                              curr.difference ||
                              curr.range ||
                              "",
                            results: {},
                          };
                        }
                        const dateKey =
                          (curr.Date || curr.DATE || curr.date || "").split(
                            " ",
                          )[0] ||
                          (curr.Date || curr.DATE || curr.date || "").split(
                            "T",
                          )[0];
                        const dObj = new Date(dateKey);
                        const formattedKey = !isNaN(dObj)
                          ? `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`
                          : "";

                        acc[key].results[formattedKey] =
                          curr.VALUE || curr.Value || curr.value;
                        return acc;
                      }, {}),
                    ).map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-primary font-weight-bold">
                          {row.test}
                        </td>
                        <td>{row.observation}</td>
                        <td>{row.range}</td>
                        {uniqueLabDates.map((date) => (
                          <td key={date} className="text-center">
                            {row.results[date] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* MEDICATION - Dynamic Date Columns */}
        {values.visibleSections.includes("medication") && (
          <div className="mb-4">
            <div className="section-vscroll">
              <div className="sticky-section-title">
                <Heading title={t("MEDICATION")} />
              </div>
              <div className="flowsheet-scroll" style={{ maxHeight: "11vw" }}>
                <Table
                  bordered
                  hover
                  size="sm"
                  className="flowsheet-table flowsheet-table-med"
                >
                  <thead>
                    <tr className="bg-success text-white">
                      <th
                        rowSpan="2"
                        style={{ minWidth: "200px", verticalAlign: "middle" }}
                      >
                        {t("Medicine")}
                      </th>
                      {uniqueMedDates.map((date) => {
                        const [y, m, d] = date.split("-");
                        return (
                          <th key={date} colSpan="3" className="text-center">
                            {`${d}-${m}-${y}`}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="bg-success text-white">
                      {uniqueMedDates.map((date) => (
                        <React.Fragment key={`sub-${date}`}>
                          <th
                            className="text-center"
                            style={{ minWidth: "80px", fontSize: "0.75rem" }}
                          >
                            {t("Dur")}
                          </th>
                          <th
                            className="text-center"
                            style={{ minWidth: "80px", fontSize: "0.75rem" }}
                          >
                            {t("Dose")}
                          </th>
                          <th
                            className="text-center"
                            style={{ minWidth: "80px", fontSize: "0.75rem" }}
                          >
                            {t("Qty")}
                          </th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(
                      flowData.medication.reduce((acc, curr) => {
                        const name =
                          curr.medicineName || curr.MedicineName || "N/A";
                        if (!acc[name]) {
                          acc[name] = { name: name, dates: {} };
                        }
                        const dateKey =
                          (curr.date || curr.DATE || curr.Date || "").split(
                            " ",
                          )[0] ||
                          (curr.date || curr.DATE || curr.Date || "").split(
                            "T",
                          )[0];
                        const dObj = new Date(dateKey);
                        const formattedKey = !isNaN(dObj)
                          ? `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`
                          : "";

                        if (!acc[name].dates[formattedKey]) {
                          acc[name].dates[formattedKey] = [];
                        }
                        acc[name].dates[formattedKey].push(curr);
                        return acc;
                      }, {}),
                    ).map((med, idx) => (
                      <tr key={idx}>
                        <td
                          className="bg-light text-primary font-weight-bold"
                          style={{ fontSize: "1rem" }}
                        >
                          {med.name}
                        </td>
                        {uniqueMedDates.map((date) => {
                          const items = med.dates[date] || [];
                          return (
                            <React.Fragment key={`${date}-${idx}`}>
                              <td
                                className="text-center"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {items.map((item, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      borderBottom:
                                        i < items.length - 1
                                          ? "1px solid #eee"
                                          : "none",
                                    }}
                                  >
                                    {item.duration || item.Duration || "-"}
                                  </div>
                                ))}
                              </td>
                              <td
                                className="text-center"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {items.map((item, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      borderBottom:
                                        i < items.length - 1
                                          ? "1px solid #eee"
                                          : "none",
                                    }}
                                  >
                                    {item.dose || item.Dose || "-"}
                                  </div>
                                ))}
                              </td>
                              <td
                                className="text-center"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {items.map((item, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      borderBottom:
                                        i < items.length - 1
                                          ? "1px solid #eee"
                                          : "none",
                                    }}
                                  >
                                    {item.reqQty || item.ReqQty || "-"}
                                  </div>
                                ))}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
                .flowsheet-content {
                    overflow: visible;
                    position: relative;
                }

                /* Vertical scroll container — Heading + horizontal table wrap */
                .section-vscroll {
                    max-height: 70vh;
                    overflow-y: auto;
                    overflow-x: hidden;
                    position: relative;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    margin-bottom: 0.5rem;
                }

                /* Horizontal scroll container — only the table */
                .flowsheet-scroll {
                    overflow-x: auto;
                    overflow-y: visible;
                    max-width: 100%;
                }

                .sticky-section-title {
                    position: sticky;
                    top: 0;
                    z-index: 200;
                    background: white;
                }
                .sticky-section-title .card { margin-bottom: 0 !important; }

                .flowsheet-table th,
                .flowsheet-table-v th,
                .flowsheet-table-lab th,
                .flowsheet-table-med th {
                    background-color: #28a745 !important;
                    color: white !important;
                    padding: 0.4rem !important;
                    vertical-align: middle !important;
                    border: 1px solid #dee2e6 !important;
                    white-space: nowrap;
                }

                /* Sticky thead inside each scroll container */
                .flowsheet-table-v thead th,
                .flowsheet-table-lab thead th,
                .flowsheet-table-med thead th {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: inset 0 1px 0 #dee2e6, inset 0 -1px 0 #dee2e6;
                }
                /* Medication second header row */
                .flowsheet-table-med thead tr:nth-child(2) th {
                    top: 29px;
                }

                /* Default min-width for data cells */
                .flowsheet-table-v th:not(:first-child),
                .flowsheet-table-v td:not(:first-child),
                .flowsheet-table-lab th:nth-child(n+4),
                .flowsheet-table-lab td:nth-child(n+4),
                .flowsheet-table-med th:not(:first-child),
                .flowsheet-table-med td:not(:first-child) {
                    min-width: 120px;
                    text-align: center;
                    white-space: nowrap;
                }

                /* Sticky left columns, relative to flowsheet-scroll */
                .flowsheet-table-v th:first-child,
                .flowsheet-table-v td:first-child,
                .flowsheet-table-lab th:nth-child(1), .flowsheet-table-lab td:nth-child(1),
                .flowsheet-table-lab th:nth-child(2), .flowsheet-table-lab td:nth-child(2),
                .flowsheet-table-lab th:nth-child(3), .flowsheet-table-lab td:nth-child(3),
                .flowsheet-table-med thead tr:first-child th:first-child, .flowsheet-table-med td:first-child {
                    position: sticky;
                    z-index: 120;
                    background-color: #f8f9fa !important;
                }

                .flowsheet-table-v th:first-child,
                .flowsheet-table-v td:first-child { left: 0; min-width: 150px; width: 150px; border-right: 2px solid #dee2e6 !important; }

                .flowsheet-table-lab th:nth-child(1),
                .flowsheet-table-lab td:nth-child(1) { left: 0; min-width: 150px; width: 150px; }
                .flowsheet-table-lab th:nth-child(2),
                .flowsheet-table-lab td:nth-child(2) { left: 150px; min-width: 150px; width: 150px; }
                .flowsheet-table-lab th:nth-child(3),
                .flowsheet-table-lab td:nth-child(3) { left: 300px; min-width: 100px; width: 100px; border-right: 2px solid #dee2e6 !important; }

                .flowsheet-table-med thead tr:first-child th:first-child,
                .flowsheet-table-med td:first-child { left: 0; min-width: 200px; width: 200px; border-right: 2px solid #dee2e6 !important; }

                /* Top-left corner priority: sticky row + sticky col */
                .flowsheet-table-v thead th:first-child,
                .flowsheet-table-lab thead th:nth-child(1),
                .flowsheet-table-lab thead th:nth-child(2),
                .flowsheet-table-lab thead th:nth-child(3),
                .flowsheet-table-med thead tr:first-child th:first-child {
                    z-index: 140;
                    background-color: #28a745 !important;
                }

                .flowsheet-table-v,
                .flowsheet-table-lab,
                .flowsheet-table-med {
                    border-collapse: separate !important;
                    border-spacing: 0 !important;
                    width: max-content;
                    min-width: 100%;
                    margin-bottom: 0;
                }

                .flowsheet-table-v td,
                .flowsheet-table-lab td,
                .flowsheet-table-med td {
                    border: 1px solid #dee2e6 !important;
                }
                .flowsheet-table-v tbody tr:nth-of-type(odd),
                .flowsheet-table-lab tbody tr:nth-of-type(odd),
                .flowsheet-table-med tbody tr:nth-of-type(odd) {
                    background-color: rgba(0,0,0,.02);
                }
                .flowsheet-wrapper .card-header {
                    background-color: #007bff !important;
                }
            `,
        }}
      />
    </div>
  );
};

export default FlowsheetModel;
