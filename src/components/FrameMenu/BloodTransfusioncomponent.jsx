import React, { useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import Accordion from "../UI/Accordion";
import { useTranslation } from "react-i18next";
import { translateOptions } from "@components/WrapTranslate";

const isActionOption = [
  { value: "0", label: "No" },
  { value: "1", label: "Yes" },
];
const intialState = {
  Date: new Date(),
  Expirydate: new Date(),
  Prescriptionunits: "0",
  verbalID: "0",
  Bloodgroup: "0",
  firstofunits: "0",
  IDband: "0",
  RhD: "0",
  Consent: "0",
  IVfiltersystem: "0",

  IncreasedBP: "0",
  BackPain: "0",
  Shivering: "0",
  Lowerbackpain: "0",

  IncreasedTemperature: "0",
  IncreasedPulseReaps: "0",
  Headache: "0",
  Hernatemesis: "0",

  Wheezing: "",
  Itching: "",
  Hives: "",
  JointPain: "",

  fDate: "",
  Doctor: "",
  refuseReason: "",
  PrintName: "",
  Relationship: "",
};

const BloodTransfusioncomponent = ({
  title,
  payload,
  setPayload,
  setMonitoringData,
}) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  //   const [payload, setPayload] = useState({
  //     ...intialState,
  //   });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({ ...payload, [name]: value });
  };
  const handleReactSelect = (name, e) => {
    debugger
    setPayload({ ...payload, [name]: e.value });
  };

  const headers = [
    "Pre",
    "5 Min",
    "10 Min",
    "15 Min",
    "1 Hr",
    "2 Hr",
    "3 Hr",
    "4 Hr",
  ];

  const rows = [
    { code: "V", label: t("Temp C") },
    { code: "I", label: t("Pulse") },
    { code: "T", label: t("Resps/min") },
    { code: "A", label: t("LBP") },
    { code: "L", label: "SPO2" },
  ];
  const handleMonitoringChange = (rowIndex, colIndex, e) => {
    // Calls the specific setter function passed from the parent for the monitoring data
    setMonitoringData(rowIndex, colIndex, e.target.value);
  };
  const currentMonitoringData =
    payload?.monitoringData || Array(5).fill(Array(8).fill(""));
  return (
    <>
      <Accordion title={title} defaultValue={true} className="mt-1">
        <div className="row p-2">
          <div className="col-sm-7">
            <div className="row p-2">
              <DatePicker
                className="custom-calendar"
                placeholder={VITE_DATE_FORMAT}
                lable={t("Date")}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
                name="Date"
                id="Date"
                value={payload?.Date}
                showTime
                hourFormat="12"
                handleChange={handleChange}
              />

              <ReactSelect
                placeholderName={"Prescription units"}
                value={payload?.Prescriptionunits}
                id={"Prescriptionunits"}
                name="Prescriptionunits"
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"verbal ID"}
                id={"VerbalID"}
                name="VerbalID"
                value={payload?.VerbalID}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"Blood group"}
                id={"BloodGroup"}
                name="BloodGroup"
                value={payload?.BloodGroup}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"1 of units"}
                id={"firstofunits"}
                name="firstofunits"
                value={payload?.firstofunits}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"ID band"}
                id={"IDBand"}
                name="IDBand"
                value={payload?.IDBand}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"Rh D"}
                id={"RhD"}
                name="RhD"
                value={payload?.RhD}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <DatePicker
                className="custom-calendar"
                placeholder={VITE_DATE_FORMAT}
                lable={t("Expiry Date")}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
                name="Expirydate"
                id="Expirydate"
                value={payload?.Expirydate}
                showTime
                hourFormat="12"
                handleChange={handleChange}
              />
              <ReactSelect
                placeholderName={"Consent"}
                id={"Consent"}
                name="Consent"
                value={payload?.Consent}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"IVFilterSystem"}
                id={"IVFilterSystem"}
                name="IVFilterSystem"
                value={payload?.IVFilterSystem}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
            </div>
            <Heading title={t("REACTION FLOW SHEET")} />
            <div className="row mt-2">
              <label className="col-xl-3 col-md-3 col-sm-4 col-12">
                {t("FEBRILE (30 mins):")}
              </label>

              <ReactSelect
                placeholderName={"Increased Temperature"}
                id={"IncreasedTemperature"}
                name="IncreasedTemperature"
                value={payload?.IncreasedTemperature}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"Increased Pulse + Reaps"}
                id={"IncreasedPulseAndReaps"}
                name="IncreasedPulseAndReaps"
                value={payload?.IncreasedPulseAndReaps}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"Hernatemesis"}
                id={"Hernatemesis"}
                name="Hernatemesis"
                value={payload?.Hernatemesis}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
             
            </div>
            <div className="row">
              <label className="col-xl-3 col-md-3 col-sm-4 col-12">
                {t("HAEMOLYTIC(0.15 mins):")}
              </label>

              <ReactSelect
                placeholderName={"Increased BP"}
                value={payload?.IncreasedBP}
                id={"IncreasedBP"}
                name="IncreasedBP"
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />

              <ReactSelect
                placeholderName={"Back Pain"}
                id={"BackPain"}
                name="BackPain"
                value={payload?.BackPain}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />

              <ReactSelect
                placeholderName={"Shivering"}
                id={"Shivering"}
                name="Shivering"
                value={payload?.Shivering}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <label className="col-sm-3"></label>
              <ReactSelect
                placeholderName={"Lower back pain"}
                id={"LowerBackPain"}
                name="LowerBackPain"
                value={payload?.LowerBackPain}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
               <ReactSelect
                placeholderName={"Headache"}
                id={"Headache"}
                name="Headache"
                value={payload?.Headache}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
            </div>

            <div className="row">
              <label className="col-xl- col-md-3 col-sm-4 col-12">
                {t("ALLERGIC:")}
              </label>

              <ReactSelect
                placeholderName={"Wheezing"}
                id={"Wheezing"}
                name="Wheezing"
                value={payload?.Wheezing}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"Itching"}
                id={"Itching"}
                name="Itching"
                value={payload?.Itching}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <ReactSelect
                placeholderName={"Hives"}
                id={"Hives"}
                name="Hives"
                value={payload?.Hives}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
              <label className="col-sm-3"></label>
              <ReactSelect
                placeholderName={"JointPain"}
                id={"JointPain"}
                name="JointPain"
                value={payload?.JointPain}
                handleChange={handleReactSelect}
                dynamicOptions={translateOptions(isActionOption, t)}
                searchable={true}
                removeIsClearable={true}
                respclass={"col-xl-3 col-md-3 col-sm-4 col-12"}
              />
            </div>
          </div>
          <div className="col-sm-5">
            {/* <div className="container mt-4"> */}
              <div className="card p-3 shadow-sm">
                <h5 className="text-center mb-3 fw-bold">{t("MONITORING")}</h5>

                <div className="table-responsive">
                  <table className="table table-bordered text-center align-middle" style={{border:"2px solid #d3d5d6ff"}}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "80px" }}>{t("Real time")}</th>
                        <th style={{ width: "120px" }}> </th>

                        {headers?.map((h, index) => (
                          <th key={index}>{h}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {rows?.map((row, i) => (
                        <tr key={i}>
                          <td className="fw-bold">{row.code}</td>
                          <td>{row.label}</td>

                          {headers.map((_, j) => (
                            <td key={j}>
                              <input
                                type="text"
                                className="form-control p-1 text-center"
                                value={currentMonitoringData[i]?.[j] || ""}
                                onChange={(e) =>
                                  handleMonitoringChange(i, j, e)
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 
                </div>
              </div>
            {/* </div> */}
          </div>
        </div>
      </Accordion>
    </>
  );
};

export default BloodTransfusioncomponent;