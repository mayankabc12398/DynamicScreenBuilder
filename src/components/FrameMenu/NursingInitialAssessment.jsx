import React, { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import LabeledInput from "../formComponent/LabeledInput";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import { GetNursingFormMasterAPI, NursingFormEntryAPI, NursingGetFormEntryAPI, NursingGetPreviousMedicineEntryAPI, NursingPreviousMedicineEntryAPI } from "../../networkServices/nursingWardAPI";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";
import TimePicker from "../formComponent/TimePicker";
import { notify, NursingFormEntryPayload, NursingPreviousMedicineEntryPayload } from "../../utils/ustil2";
import { timeFormateDate } from "../../utils/utils";

export default function NursingInitialAssessment({ data }) {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [isUpdate, setIsUpdate] = useState(false)
  const [nursingGetFormEntryData, setNursingGetFormEntry] = useState([])
  const [values, setValues] = useState({ C: [] });
  console.log("values", values)
  const [glasgowComaScale, setGlasgowComaScale] = useState({});
  const initailValue = {
    // Age: "12",
    Type: { value: "C" }
  };
  const [payload, setPayload] = useState({ ...initailValue });
  const [medicationTableData, setMedicationTableData] = useState([
    {
      Medicine: "",
      Dosage: "",
      Frequency: "",
      DateOfLastDose: "",
      TimeOfLastDose: "",
    },
  ]);

  const handleReactSelect = async (name, value) => {
    if (name === "Type") {
      const apiResp = await GetNursingFormMasterAPI(value?.value);
      if (value?.value === "I") {
        getNursingGetPreviousMedicineEntry()
      }
      if (apiResp?.success) {
        setValues((val) => ({
          ...val,
          [apiResp?.data[0]["Type"]]: apiResp?.data,
        }));
        // setGlasgowComaScale({});
      }
      // setPayload(initailValue);
    }

    setPayload((val) => ({ ...val, [name]: value }));
  };


  useEffect(() => {
    const filterdata = nursingGetFormEntryData?.filter((val) => val?.Type === payload?.Type?.value)
    if (filterdata?.length > 0) {
      setIsUpdate(true)
    } else {
      setIsUpdate(false)
    }
  }, [payload?.Type?.value, nursingGetFormEntryData])

  const handleGlasgowComaScaleReactSelect = (name, value) => {
    setGlasgowComaScale((val) => ({
      ...val,
      [name]: value,
      TotalScoreSum: TotalScore(name, value, glasgowComaScale),
    }));
    setPayload((val) => ({ ...val, [name]: { ...payload[name], ...value } }));
  };

  const handleInputChange = (e, index, label) => {
    // debugger
    const updatedData = JSON.parse(JSON.stringify(medicationTableData));
    updatedData[index][label] = e.target.value;
    const isLastRow = index === updatedData.length - 1;
    // const isMedicineField = label === "Medicine";
    // const hasValue = e?.target?.value?.trim() !== "";

    if (isLastRow && (label === "Medicine")) {
      updatedData.push({
        Medicine: "",
        Dosage: "",
        Frequency: "",
        DateOfLastDose: "",
        TimeOfLastDose: "",
      });
    }

    setMedicationTableData(updatedData);
  };

  const handleDeleteRow = async (index, val) => {
    NursingPreviousMedicineEntry(val?.FormEntryID)
    const updatedData = [...medicationTableData];
    updatedData.splice(index, 1);
    setMedicationTableData(updatedData);
  };

  const TypeData = [
    { label: t("Glasgow Coma Scale"), value: "C" },
    { label: t("Allergy/Adverse Reaction"), value: "D" },
    { label: t("Fall Risk Assessment"), value: "F" },
    { label: t("Skin Alteration Assessment"), value: "G" },
    { label: t("Pressure Ulcer Risk Assessment"), value: "H" },
    { label: t("Current Medication"), value: "I" },
  ];

  const medicationTHEAD = [
    { name: t("S.No"), width: "5%" },
    { name: t("Medication") },
    { name: t("Dosage") },
    { name: t("Frequency") },
    { name: t("Date of Last Dose"), width: "15%" },
    { name: t("Time of Last Dose"), width: "15%" },
    { name: t("Action"), width: "5%" },
  ];
  const TotalScore = (name, value, PayloadData) => {
    let totalScore = Object.keys(PayloadData)?.reduce((acc, val) => {
      if (val !== name) {
        acc += PayloadData[val]["value"]
          ? Number(PayloadData[val]["value"])
          : 0;
      }
      return acc;
    }, 0);
    totalScore += value?.value ? Number(value?.value) : 0;
    return totalScore;
  };

  function parseStringToLabelValueArray(str) {
    const formattedStr = str.replace(/'/g, '"');
    const arr = JSON.parse(formattedStr);
    return arr.map((item) => {
      const [value, label] = item.split("#");
      return { label: label.trim(), value: value.trim() };
    });
  }


  const handleSave = async () => {
    const payloaddata = NursingFormEntryPayload(data, payload, values, medicationTableData, glasgowComaScale)
    const apiResp = await NursingFormEntryAPI(payloaddata)
    if (apiResp?.success) {
      notify(apiResp?.message, "success")
    } else {
      notify(apiResp?.message, "error")
    }
  }

  const NursingPreviousMedicineEntry = async (FormEntryID) => {
    const payloadData = NursingPreviousMedicineEntryPayload(data, medicationTableData, FormEntryID)
    const apiResp = await NursingPreviousMedicineEntryAPI(payloadData)
    if (apiResp?.success) {
      notify(apiResp?.message, "success")
    } else {
      notify(apiResp?.message, "error")
    }
  }

  const NursingGetFormEntry = async () => {
    let apiResp = await NursingGetFormEntryAPI(data?.transactionID)
    if (apiResp?.success) {
      setNursingGetFormEntry(apiResp?.data)
      handleReactSelect("Type", { value: "C" })
      let PayloadDataTYpeC = {}
      let PayloadDataAllTYpe = {}
      apiResp?.data?.map((val) => {
        if (val?.Type === "C") {
          PayloadDataTYpeC[val.FieldName] = { label: val?.ResponseText ? val?.ResponseText : "", value: val?.Response ? val?.Response : "", FormEntryID: val?.FormEntryID, isUpdate: true }
        } else {
          PayloadDataAllTYpe[val.FieldName] = { label: val?.ResponseText ? val?.ResponseText : "", value: val?.Response ? val?.Response : "", FormEntryID: val?.FormEntryID, isUpdate: true }
          PayloadDataAllTYpe[`${val.FieldName} Remark`] = val?.Remark
          PayloadDataAllTYpe["location"] = val?.Location ? val?.Location : ""
          PayloadDataAllTYpe["NameOfRelative"] = val?.RelativeName ? val?.RelativeName : ""
          PayloadDataAllTYpe["Sign"] = val?.Sign ? val?.Sign : ""
          PayloadDataAllTYpe["Relationship"] = val?.Relation ? val?.Relation : ""
          PayloadDataAllTYpe["PhoneNo"] = val?.PhoneNo ? val?.PhoneNo : ""


        }
      })
      setPayload((val) => ({ ...val, ...PayloadDataTYpeC, ...PayloadDataAllTYpe }))
      setGlasgowComaScale((val) => ({
        ...PayloadDataTYpeC,
        TotalScoreSum: TotalScore("", "", PayloadDataTYpeC),
      }));
    }
  }

  const getNursingGetPreviousMedicineEntry = async () => {
    let apiResp = await NursingGetPreviousMedicineEntryAPI(data?.transactionID)
    if (apiResp?.success) {
      setIsUpdate(true)
      let data = apiResp?.data?.map((val) => {
        val.TimeOfLastDose = timeFormateDate(val?.DateTimeofLastDose?.split("#")[1])
        val.DateOfLastDose = new Date(val?.DateTimeofLastDose?.split("#")[0])
        val.Medicine = val?.Medication
        val.Dosage = val?.Dose
        return val
      })
      setMedicationTableData(data)
    } else {
    }
  }

  useEffect(() => {
    NursingGetFormEntry()
  }, [])


  return (
    <div className="card patient_registration border">
      <Heading title={t("Nursing Initial Assessment")} isBreadcrumb={false} />
      <div className="row mt-2 p-1">
        <ReactSelect
          placeholderName={t("Type")}
          id={"Type"}
          name="Type"
          value={payload?.Type?.value}
          removeIsClearable={false}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={TypeData}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        {payload?.Type?.value === "C" && (
          <>
            {values?.C?.map((val) => {
              return (
                <div className="col-xl-2 col-md-4 col-sm-4 col-12 d-flex align-items-center">
                  <ReactSelect
                    placeholderName={val?.LabelName}
                    id={val?.LabelName}
                    name={val?.LabelName}
                    value={glasgowComaScale?.[val?.LabelName]?.value}
                    removeIsClearable={false}
                    handleChange={(name, e) =>
                      handleGlasgowComaScaleReactSelect(name, e)
                    }
                    dynamicOptions={parseStringToLabelValueArray(val?.Values)}
                    searchable={true}
                    respclass={` ${!glasgowComaScale?.[val?.LabelName]?.value ? "w-100" : "w-75"}`}
                  />
                  {glasgowComaScale?.[val?.LabelName]?.value && (
                    <div
                      className="d-flex align-items-center mb-2 ml-2"
                      style={{ gap: "8px", position: "relative" }}
                    >
                      <span className="hover-label">{t("Score")}</span>
                      <span
                        style={{
                          fontSize: "12px",
                          border: "1px solid #B2B2B2",
                          backgroundColor:
                            glasgowComaScale?.[val?.LabelName]?.value >= "4"
                              ? "#73D673"
                              : glasgowComaScale?.[val?.LabelName]?.value ===
                                "3"
                                ? "#D9EF8B"
                                : glasgowComaScale?.[val?.LabelName]?.value ===
                                  "2"
                                  ? "#fee08b"
                                  : "#F7665E",
                          color:
                            glasgowComaScale?.[val?.LabelName]?.value >= "4"
                              ? "#FFFFFF"
                              : glasgowComaScale?.[val?.LabelName]?.value ===
                                "3"
                                ? "#000000"
                                : glasgowComaScale?.[val?.LabelName]?.value ===
                                  "2"
                                  ? "#000000"
                                  : "#FFFFFF",
                          borderRadius: "4px",
                          height: "24px",
                          minWidth: "40px",
                          padding: "0 10px",
                          textAlign: "center",
                          lineHeight: "24px",
                        }}
                      >
                        {glasgowComaScale?.[val?.LabelName]?.value}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="col-xl-1 col-md-4 col-sm-4 col-12 d-flex align-items-center">
              {/* <LabeledInput
                label={t("Total")}
                value={
                  glasgowComaScale?.TotalScoreSum === 0
                    ? ""
                    : glasgowComaScale.TotalScoreSum > 8
                      ? "Best Score"
                      : glasgowComaScale.TotalScoreSum > 3
                        ? "Command Silent"
                        : "Totally Unresponsive"
                }
                className={` ${!glasgowComaScale?.TotalScoreSum ? "w-100" : "w-75"}`}
              /> */}
              {glasgowComaScale?.TotalScoreSum > 0 && (
                <div

                  className="d-flex align-items-center mb-2 ml-2 w-100"
                  style={{ gap: "8px", position: "relative", }}
                >
                  {<span className="hover-label">{t("Total Score")}</span>}
                  <span
                    style={{
                      fontSize: "12px",
                      border: "1px solid #B2B2B2",
                      backgroundColor:
                        glasgowComaScale?.TotalScoreSum <= 3
                          ? "rgb(247, 102, 94)"
                          : glasgowComaScale.TotalScoreSum > 8
                            ? "#73D673"
                            : glasgowComaScale.TotalScoreSum > 3
                              ? "#D9EF8B"
                              : "#fee08b",
                      color:
                        glasgowComaScale?.TotalScoreSum === 0
                          ? ""
                          : glasgowComaScale.TotalScoreSum > 8
                            ? "#000000"
                            : glasgowComaScale?.TotalScoreSum === 13
                              ? "#000000"
                              : "#000000",
                      borderRadius: "4px",
                      height: "24px",
                      minWidth: "67px",
                      padding: "0 10px",
                      textAlign: "center",
                      lineHeight: "24px",
                    }}
                  >
                    {glasgowComaScale?.TotalScoreSum}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Allergy/Adverse Reaction */}
        {payload?.Type?.value === "D" &&
          values?.D?.length > 0 && values?.D?.map((ele, index) => (
            <>
              <ReactSelect
                placeholderName={ele.LabelName}
                id={ele.LabelName}
                name={ele.LabelName}
                value={payload[ele.LabelName]?.value}
                removeIsClearable={false}
                handleChange={(name, value) => {
                  handleReactSelect(name, value, ele);
                }}
                dynamicOptions={parseStringToLabelValueArray(ele?.Values)}
                searchable={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />
              {payload[ele.LabelName]?.value === "1" && ele?.IsTextAreaRequired && (
                <TextAreaInput
                  id={`${ele.LabelName} Remark`}
                  lable={`${ele.LabelName} Remark`}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  name={`${ele.LabelName} Remark`}
                  className="w-100 h-24"
                  value={payload?.[`${ele.LabelName} Remark`] ? payload?.[`${ele.LabelName} Remark`] : ""}
                  onChange={(e) => { handleReactSelect(e.target.name, e.target.value) }}
                  placeholder=" "
                />
              )}
            </>
          ))}

        {/* Fall Risk Assessment */}
        {payload?.Type?.value === "F" && (
          <>
            {values?.F?.map((val) => {
              const ageFromVal = val?.ConditionOnAge;
              const operator = ageFromVal?.[0];
              const ageInVal = parseInt(ageFromVal?.slice(1));
              const userAge = parseInt(data?.age?.split(" ")[0]);

              let shouldRender = true;
              if (operator === ">" && !(userAge > ageInVal))
                shouldRender = false;
              if (operator === "<" && !(userAge < ageInVal))
                shouldRender = false;
              if (operator === "=" && !(userAge === ageInVal))
                shouldRender = false;

              if (!shouldRender) return null;

              return (
                <ReactSelect
                  key={val?.Id}
                  placeholderName={val?.LabelName}
                  id={val?.LabelName}
                  name={val?.LabelName}
                  value={payload[val?.LabelName]?.value}
                  removeIsClearable={false}
                  dynamicOptions={parseStringToLabelValueArray(val?.Values)}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  handleChange={(name, e) => handleReactSelect(name, e)}
                />
              );
            })}
          </>
        )}

        {/* Skin Alteration Assessment */}
        {payload?.Type?.value === "G" && (
          values?.G?.length > 0 && values?.G?.map((ele, index) => (
            <>
              <ReactSelect
                placeholderName={ele?.LabelName}
                id={ele?.LabelName}
                name={ele?.LabelName}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                value={payload[ele?.LabelName]?.value}
                dynamicOptions={parseStringToLabelValueArray(ele?.Values)}
                removeIsClearable={false}
                handleChange={(name, e) => handleReactSelect(name, e)}
              />
              {payload[ele.LabelName]?.value === "1" && ele?.IsTextAreaRequired && (
                <TextAreaInput
                  id={`${ele.LabelName} Remark`}
                  lable={`${ele.LabelName} Remark`}
                  respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                  name={`${ele.LabelName} Remark`}
                  className="w-100 h-24"
                  value={payload?.[`${ele.LabelName} Remark`] ? payload?.[`${ele.LabelName} Remark`] : ""}
                  onChange={(e) => { handleReactSelect(e.target.name, e.target.value) }}
                  placeholder=" "
                />
              )}
            </>
          ))
        )}

        {/* Pressure Ulcer Risk Assessment */}
        {payload?.Type?.value === "H" && (
          <>
            {values?.H?.map((val) => {
              const ageFromVal = val?.ConditionOnAge;
              const operator = ageFromVal?.[0];
              const ageInVal = parseInt(ageFromVal?.slice(1));
              const userAge = parseInt(data?.age?.split(" ")[0]);

              let shouldRender = true;
              if (operator === ">" && !(userAge > ageInVal))
                shouldRender = false;
              if (operator === "<" && !(userAge < ageInVal))
                shouldRender = false;
              if (operator === "=" && !(userAge === ageInVal))
                shouldRender = false;

              if (!shouldRender) return null;
              return (
                <>
                  <ReactSelect
                    placeholderName={val?.LabelName}
                    id={val?.LabelName}
                    name={val?.LabelName}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    value={payload[val?.LabelName]?.value}
                    dynamicOptions={parseStringToLabelValueArray(val?.Values)}
                    removeIsClearable={false}
                    handleChange={(name, e) => handleReactSelect(name, e)}
                  />
                  {(val?.Id === 17 && payload?.[val?.LabelName]?.value === "1") &&
                    <>
                      <Input
                        type="text"
                        className={"form-control"}
                        lable={t("location")}
                        placeholder=" "
                        name="location"
                        onChange={(e) => handleReactSelect(e.target?.name, e.target?.value)}
                        value={payload?.location ? payload?.location : ""}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                      />
                      <Input
                        type="text"
                        className={"form-control"}
                        lable={t("Name Of Relative")}
                        placeholder=" "
                        name="NameOfRelative"
                        onChange={(e) => handleReactSelect(e.target?.name, e.target?.value)}
                        value={payload?.NameOfRelative ? payload?.NameOfRelative : ""}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                      />
                      <Input
                        type="text"
                        className={"form-control"}
                        lable={t("Sign")}
                        placeholder=" "
                        name="Sign"
                        onChange={(e) => handleReactSelect(e.target?.name, e.target?.value)}
                        value={payload?.Sign ? payload?.Sign : ""}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                      />
                      <Input
                        type="text"
                        className={"form-control"}
                        lable={t("Relationship")}
                        placeholder=" "
                        name="Relationship"
                        onChange={(e) => handleReactSelect(e.target?.name, e.target?.value)}
                        value={payload?.Relationship ? payload?.Relationship : ""}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                      />
                      <Input
                        type="text"
                        className={"form-control"}
                        lable={t("Phone No")}
                        placeholder=" "
                        name="PhoneNo"
                        onChange={(e) => handleReactSelect(e.target?.name, e.target?.value)}
                        value={payload?.PhoneNo ? payload?.PhoneNo : ""}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                      />
                    </>
                  }
                </>
              );
            })}
          </>
        )}
        {/* {console.log("payload", payload?.Type)} */}
        {payload?.Type?.value !== "I" && <button className="btn btn-primary ml-2" onClick={handleSave}>{isUpdate ? t("Update") : t("Save")}</button>}

      </div>
      {
        payload?.Type?.value === "I" && (
          <>
            <Tables
              thead={medicationTHEAD}
              tbody={medicationTableData?.map((val, index) => {
                return {
                  SNo: index + 1,
                  Medicine: (
                    <Input
                      type="text"
                      className={"table-input"}
                      removeFormGroupClass={true}
                      placeholder=" "
                      name="Medicine"
                      onChange={(e) => handleInputChange(e, index, "Medicine")}
                      value={val?.Medicine}
                      respclass="col-12"
                    />
                  ),
                  Dosage: (
                    <Input
                      type="text"
                      className={"table-input"}
                      removeFormGroupClass={true}
                      placeholder=" "
                      name="Dosage"
                      onChange={(e) => handleInputChange(e, index, "Dosage")}
                      value={val?.Dosage}
                    />
                  ),
                  Frequency: (
                    <Input
                      type="text"
                      className={"table-input"}
                      removeFormGroupClass={true}
                      placeholder=" "
                      name="Frequency"
                      onChange={(e) => handleInputChange(e, index, "Frequency")}
                      value={val?.Frequency}
                    />
                  ),
                  "Date of Last Dose": (
                    <DatePicker
                      className={` table-calender-height mt-1`}
                      respclass=" w-100"
                      id="DateOfLastDose"
                      name="DateOfLastDose"
                      handleChange={(e) => handleInputChange(e, index, "DateOfLastDose")}
                      // value={val?.DateOfLastDose?val?.DateOfLastDose:""}
                      value={
                        val?.DateOfLastDose
                          ? moment(val?.DateOfLastDose).toDate()
                          : ""
                      }
                      // handleChange={(e) => {
                      //   const dateInput = e.target.value;

                      //   setValues((prev) => ({
                      //     ...prev,
                      //     dateOfVisit: moment(dateInput).toDate(), // Ensure state updates
                      //   }));
                      // }}
                      placeholder={VITE_DATE_FORMAT}
                    />
                  ),
                  "Time of Last Dose": (
                    <TimePicker
                      respclass=" w-100 "
                      id="TimeOfLastDose"
                      name="TimeOfLastDose"
                      // value={val?.TimeOfLastDose}
                      value={
                        val?.TimeOfLastDose
                          ? moment(val?.TimeOfLastDose).toDate()
                          : ""
                      }
                      handleChange={(e) => handleInputChange(e, index, "TimeOfLastDose")}
                      // handleChange={handleChange}
                      className="table-time"
                    />
                  ),
                  Action: (
                    <i
                      className="fa fa-trash text-danger"
                      onClick={() => handleDeleteRow(index, val)}
                    ></i>
                  ),
                };
              })}
            />
          </>
        )
      }
      <div className="text-right mt-2 mb-2">
        {payload?.Type?.value === "I" && <button className="btn btn-primary ml-2 px-3" onClick={NursingPreviousMedicineEntry}>{isUpdate ? t("Update") : t("Save")}</button>}
      </div>
    </div >
  );
}
