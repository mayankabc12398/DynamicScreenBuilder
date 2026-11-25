import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Input from "../../../components/formComponent/Input";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Heading from "../../../components/UI/Heading";
import Tables from "../../../components/UI/customTable";
import { RiAddBoxFill } from "react-icons/ri";
import { FaTrash } from "react-icons/fa";
import { BindMachine, SelectGender } from "../../../networkServices/resultEntry";
import { handleReactSelectDropDownOptions } from "../../../utils/utils";
import { getBindCenterAPI } from "../../../networkServices/EDP/karanedp";
import { GetObservationDetails, GetObservationMasterData, ObservationExists, UpdateObservationRanges } from "../../../networkServices/EDP/edpApi";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { notify } from "../../../utils/ustil2";

export default function EditObservationDetailModal({
  setHandleModelData,
  obsevationData,
}) {
  debugger
  const [t] = useTranslation();
  const defaultRow = [{
    fromAgeDays: 0,
    toAgeYears: 1,
    toAgeDays: 365,
    minReading: "",
    maxReading: "",
    minCritical: "",
    maxCritical: "",
    readingFormat: "",
    displayReading: "",
    defaultReading: "",
    comment: ""
  }]
  // fin_global_resources -> IsPairameaterWiseComment : 1 hone par hi range-wise
  // Comment column dikhega, 0 / key na hone par column hi nahi banega.
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const showParameterComment = useMemo(
    () =>
      Array.isArray(GetGlobalResources) &&
      GetGlobalResources.some(
        (item) =>
          item?.Name === "IsPairameaterWiseComment" && Number(item?.Value) === 1,
      ),
    [GetGlobalResources],
  );

  const [bindMachine, setBindMachine] = useState([]);
  const [observation, setobservation] = useState(defaultRow);
  const [validationYears, setValidationYears] = useState(defaultRow);
  const { centreID } = useLocalStorage("userData", "get");
  const initialValues = {
    observationName: obsevationData?.obsName ? obsevationData?.obsName : obsevationData?.name,
    observationID: 0,
    investigationID: 0,
    obsRangeData: "",
    gender: "" || "M",
    suffix: "",
    isCulture: 0,
    machineID: "1",
    centreID: centreID || 1,
    allCentre: 0
  };

  const [values, setValues] = useState(initialValues);
  useEffect(() => {
    setHandleModelData((val) => ({ ...val, modalData: {} }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setHandleModelData((val) => ({
      ...val,
      modalData: { ...val.modalData, [name]: value },
    }));
  };
  const getObservationDetail = async () => {
    const payload = {
      observationID: obsevationData?.labObservation_ID,
      centreID: values.centreID,
      gender: values.gender.value || values.gender,
      machineID: values.machineID || "1",
    };

    try {
      const response = await GetObservationDetails(payload);
      if (response.success) {
        const data = response?.data || [];

        const formatted = data.length > 0
          ? data.map((item) => ({
            fromAgeDays: item.fromAgeDays || item.FromAge || "",
            toAgeYears: item.ToAgeyears || item.toAgeyears || "",
            toAgeDays: item.toAgeDays || item.ToAge || "",
            minReading: item.minReading || item.MinReading || "",
            maxReading: item.maxReading || item.MaxReading || "",
            minCritical: item.minCritical || item.MinCritical || "",
            maxCritical: item.maxCritical || item.MaxCritical || "",
            readingFormat: item.readingFormat || item.ReadingFormat || "",
            displayReading: item.displayReading || item.DisplayReading || "",
            defaultReading: item.defaultReading || item.DefaultReading || "",
            comment: item.comment || item.Comment || "",
          }))
          : [defaultRow];
        setobservation(formatted);

      }
      if (!response?.success) {
        notify(response?.message, "error")
      }
    } catch (error) {
      console.error("Error fetching observation details:", error);
    }
  };
  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setHandleModelData((val) => ({
      ...val,
      modalData: { ...val.modalData, [name]: value },
    }));
  };

  const handlecheckbox = (e) => {
    const checked = e.target.checked;

    setValues((prev) => ({ ...prev, allCentre: checked ? 1 : 0 }));
    setHandleModelData((val) => ({
      ...val,
      modalData: { ...val.modalData, allCentre: checked ? 1 : 0 },
    }));
  };

  const handleRowChange = (index, name, value) => {
  const updated = [...observation];
  const DAYS_IN_YEAR = 365;
  updated[index][name] = value;
  if (value === "") {
    if (name === "toAgeYears") updated[index]["toAgeDays"] = "";
    if (name === "toAgeDays") updated[index]["toAgeYears"] = "";
    setobservation(updated);
    return;
  }
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    setobservation(updated);
    return;
  }
  if (name === "toAgeYears") {
    updated[index]["toAgeDays"] = Math.round(numericValue * DAYS_IN_YEAR);
  }
  if (name === "toAgeDays") {
    updated[index]["toAgeDays"] = Math.round(numericValue);
    updated[index]["toAgeYears"] = (numericValue / DAYS_IN_YEAR).toFixed(5);
  }
  setobservation(updated);
};

  const addRow = (days) => {
    setValidationYears(days)
    const lastRow = observation[observation.length - 1];
    const min = parseFloat(lastRow.minReading);
    const max = parseFloat(lastRow.maxReading);
    if (isNaN(max)) {
      notify(t("Please Enter Max. Reading"), "error");
      return;
    }
    if (max <= min) {
      notify(t("Max Reading must be greater than Min Reading"), "error");
      return;
    }


    setobservation([
      ...observation,
      {
        fromAgeDays: days?.toAgeDays + 1 || "",
        toAgeYears: "",
        toAgeDays: "",
        minReading: "",
        maxReading: "",
        minCritical: "",
        maxCritical: "",
        readingFormat: "",
        displayReading: "",
        defaultReading: "",
        comment: "",
      },
    ]);
  };
  const removeRow = (index) => {
    const updated = observation.filter((_, i) => i !== index);
    setobservation(updated);
  };
  const GENDEROPTION = [
    { label: t("Male"), value: "M" },
    { label: t("Female"), value: "F" },
    { label: t("Both"), value: "B" },
  ];

  const thead = [
    { name: t("S NO"), width: "2%" },
    { name: t("From Age (Days)"), width: "" },
    { name: t("To Age (Years)"), width: "" },
    { name: t("To Age (Days)"), width: "" },
    { name: t("Min Reading"), width: "" },
    { name: t("Max Reading"), width: "" },
    { name: t("Min Critical"), width: "" },
    { name: t("Max Critical"), width: "" },
    { name: t("Reading Format"), width: "" },
    { name: t("Display Reading"), width: "" },
    { name: t("Default Reading"), width: "" },
    ...(showParameterComment ? [{ name: t("Comment"), width: "" }] : []),
    { name: t("Add"), width: "" },
    { name: t("Remove"), width: "" },
  ];

  const ObservationExist = async () => {
    debugger
    try {
      const r = await ObservationExists(obsevationData?.obsName, obsevationData?.labObservation_ID,)
    } catch (error) {
      notify(error?.message, "error")
    }
  }
  const handleSave = async () => {
    const normalizeArray = (data) => {
      if (!data) return [];
      return Array.isArray(data) ? data : [data];
    };

    const observationArr = normalizeArray(observation);
    const validationYearsArr = normalizeArray(validationYears);

    // Last values safely nikalo
    const lastRow = observationArr.length
      ? observationArr[observationArr.length - 1]
      : null;

    const lastRowtoAgeYears = validationYearsArr.length
      ? validationYearsArr[validationYearsArr.length - 1]
      : null;

    if (!lastRow || !lastRowtoAgeYears) return;

    const min = parseFloat(lastRowtoAgeYears?.toAgeYears || 0);
    const max = parseFloat(lastRow?.toAgeYears || 0);
    debugger
    /*  if (min >= max) {
       notify("To Age Should be Greater than FromAge", "error");
       return;
     } */

    ObservationExist()
    const obsRangeData = observation
      .map((row) => {
        return [
          row.fromAgeDays || "0",
          row.toAgeDays || "0",
          row.minReading || "0",
          row.maxReading || "0",
          row.minCritical || "0",
          row.maxCritical || "0",
          row.readingFormat || "",
          row.displayReading || "",
          row.defaultReading || "",
          "",
          "",
          row.comment || ""
        ].join("|") + "#";   // ✅ add # here
      })
      .join("");

    const payload = {
      ObservationName: values.observationName || obsevationData?.Name || "",
      ObservationID: obsevationData?.labObservation_ID || 0,
      InvestigationID: obsevationData?.investigation_Id || 0,
      ObsRangeData: obsRangeData,
      Gender: values.gender?.value || values.gender,
      Suffix: values.suffix || obsevationData?.Suffix || "",
      IsCulture: "0",
      MachineID: values.machineID?.value || values.machineID || "1",
      CentreID: values.centreID.value || values?.centreID || centreID || "0",
      AllCentre: values.allCentre,
    };

    try {
      const r = await UpdateObservationRanges(payload)
      if (r.success) {
        notify(r?.message, "success")
        setHandleModelData({})
      }
    } catch (error) {
      notify(error?.message, "error")
    }
  };



  const handleBindMachine = async () => {
    try {
      const response = await BindMachine();
      if (response.success) {
        setBindMachine(response?.data || []);
      }
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  };
  const selectGender = async () => {
    try {
      const response = await SelectGender(obsevationData?.labObservation_ID);
      if (response.success) {
        setValues({ ...values, gender: response?.data[0].Gender });
      }
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  };
  const getMasterData = async () => {
    try {
      const response = await GetObservationMasterData(obsevationData?.labObservation_ID);
      debugger
      if (response.success) {
        const datas = response?.data[0];
        setValues((prev) => ({
          ...prev,
          observationName: datas?.Name || "",
          suffix: datas?.Suffix || ""
        }));

      } else {
        console.log(
          "API returned success as false or invalid response:",
          response,
        );
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
    }
  }

  const [centreVal, setCentreVal] = useState([]);
  const handlegetBindCenterAPI = async () => {
    try {
      const response = await getBindCenterAPI();
      if (response.success) {
        setCentreVal(response?.data || []);
      } else {
        setCentreVal([]);
      }
    } catch (error) {
      console.error("Error fetching centres:", error);
      setCentreVal([]);
    }
  };

  useEffect(() => {
    handleBindMachine();
    handlegetBindCenterAPI();
    selectGender()
  }, []);
  useEffect(() => {
    if (values?.gender?.value || values?.gender) {
      getObservationDetail();
    }
    if (obsevationData?.labObservation_ID) {
      getMasterData();
    }
  }, [values?.gender, obsevationData?.labObservation_ID]);




  const tabelData = observation?.map((row, index) => ({
    "S NO": index + 1,

    "From Age (Days)": (
      <Input
        className={"mt-1 form-control"}
        type="number"
        name="fromAgeDays"
        id={`fromAgeDays-${index}`}
        value={row?.fromAgeDays || Number(row?.fromAgeDays)}
        onChange={(e) => handleRowChange(index, "fromAgeDays", e.target.value)}
      />
    ),

    "To Age (Years)": (
      <Input
        className={"mt-1 form-control"}
        type="number"
        name="toAgeYears"
        id={`toAgeYears-${index}`}
        value={row?.toAgeYears || ""}
        onChange={(e) => handleRowChange(index, "toAgeYears", e.target.value)}
      />
    ),

    "To Age (Days)": (
      <Input
        className={"mt-1 form-control"}
        type="number"
        name="toAgeDays"
        id={`toAgeDays-${index}`}
        value={row?.toAgeDays || ""}
        onChange={(e) => handleRowChange(index, "toAgeDays", e.target.value)}
      />
    ),

    "Min Reading": (
      <Input
        className={"mt-1 form-control"}
        type="text"
        name="minReading"
        id={`minReading-${index}`}
        value={row?.minReading || ""}
        onChange={(e) => handleRowChange(index, "minReading", e.target.value)}
      />
    ),

    "Max Reading": (
      <Input
        className={"mt-1 form-control"}
        type="text"
        name="maxReading"
        id={`maxReading-${index}`}
        value={row?.maxReading || ""}
        onChange={(e) => handleRowChange(index, "maxReading", e.target.value)}
      />
    ),

    "Min Critical": (
      <Input
        className={"mt-1 form-control"}
        type="text"
        name="minCritical"
        id={`minCritical-${index}`}
        value={row?.minCritical || ""}
        onChange={(e) => handleRowChange(index, "minCritical", e.target.value)}
      />
    ),

    "Max Critical": (
      <Input
        className={"mt-1 form-control"}
        type="text"
        name="maxCritical"
        id={`maxCritical-${index}`}
        value={row?.maxCritical || ""}
        onChange={(e) => handleRowChange(index, "maxCritical", e.target.value)}
      />
    ),

    "Reading Format": (
      <Input
        className={"mt-1 form-control"}
        type="text"
        name="readingFormat"
        id={`readingFormat-${index}`}
        value={row?.readingFormat || ""}
        onChange={(e) => handleRowChange(index, "readingFormat", e.target.value)}
      />
    ),

    "Display Reading": (
      <Input
        className={"mt-1 form-control"}
        type="text"
        name="displayReading"
        id={`displayReading-${index}`}
        value={row?.displayReading || ""}
        onChange={(e) => handleRowChange(index, "displayReading", e.target.value)}
      />
    ),

    "Default Reading": (
      <Input
        className={"mt-1 form-control"}
        type="text"
        name="defaultReading"
        id={`defaultReading-${index}`}
        value={row?.defaultReading || ""}
        onChange={(e) => handleRowChange(index, "defaultReading", e.target.value)}
      />
    ),

    ...(showParameterComment
      ? {
          Comment: (
            <Input
              className={"mt-1 form-control"}
              type="text"
              name="comment"
              id={`comment-${index}`}
              value={row?.comment || ""}
              onChange={(e) => handleRowChange(index, "comment", e.target.value)}
            />
          ),
        }
      : {}),

    Add: (
      <button type="button" className="btn btn-success" onClick={() => addRow(row)}>
        <RiAddBoxFill />
      </button>
    ),

    Remove: (
      <button
        type="button"
        className="btn btn-danger"
        onClick={() => removeRow(index)}
        disabled={observation.length === 1}
      >
        <FaTrash />
      </button>
    ),
  }));

  return (
    <div className="row">
      <ReactSelect
        placeholderName={t("Select Gender")}
        id="gender"
        requiredClassName={"required-fields"}
        searchable
        respclass="col-xl-4 col-md-4 col-sm-4 col-12"
        name="gender"
        dynamicOptions={GENDEROPTION}
        handleChange={handleSelect}
        value={values?.gender}
      />
      <hr className="border" />
      <div className="col-12">
        <Heading title={t("Observation Details")} isBreadcrumb={false} />
        <div className="row align-items-center mt-2">
          <Input
            type="text"
            className="form-control"
            id="observationName"
            removeFormGroupClass={false}
            name="observationName"
            lable={t("Observation Name")}
            required={true}
            placeholder=""
            onChange={handleChange}
            value={values?.observationName}
            respclass={"col-6"}
          />
          <Input
            type="text"
            className="form-control"
            id="suffix"
            removeFormGroupClass={false}
            name="suffix"
            lable={t("Suffix")}
            placeholder=""
            required={true}
            onChange={handleChange}
            value={values.suffix}
            respclass={"col-6"}
          />
          <ReactSelect
            placeholderName={t("Select Machine")}
            id="machineID"
            requiredClassName={"required-fields"}
            searchable
            respclass="col-xl-4 col-md-4 col-sm-4 col-12"
            name="machineID"
            dynamicOptions={[
              ...handleReactSelectDropDownOptions(
                bindMachine,
                "MachineName",
                "MachineID",
              ),
            ]}
            handleChange={handleSelect}
            value={values?.machineID}
          />
          <ReactSelect
            placeholderName={t("Centre Name")}
            id="centreID"
            requiredClassName={"required-fields"}
            searchable
            respclass="col-xl-4 col-md-4 col-sm-4 col-12"
            name="centreID"
            dynamicOptions={[
              ...handleReactSelectDropDownOptions(
                centreVal,
                "CentreName",
                "CentreID"
              ),
            ]}
            handleChange={handleSelect}
            value={values?.centreID}
          />
          <div className="d-flex gapx-2">
            <label htmlFor={"ForAllCentre"}>{t("For All Centre")}</label>
            <input
              type="checkbox"
              checked={values.allCentre}
              onChange={handlecheckbox}
              id="ForAllCentre"
              className="mx-2"
            />
          </div>
        </div>
        <Heading title={t("Observation Ranges")} isBreadcrumb={false} />
        <div className="">
          <Tables thead={thead} tbody={tabelData} />
        </div>
        <div className="text-right mt-3"><button className="btn btn-success btn-sm" onClick={handleSave}>{t("save")}</button></div>
      </div>
    </div>
  );
}