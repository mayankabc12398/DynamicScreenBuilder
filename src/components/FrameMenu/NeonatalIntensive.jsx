import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { notify } from "../../utils/utils";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";
import {
  NursingWardSaveNeonatalMonitoring,
  NursingWardUpdateNeonatalMonitoring,
  NursingWardBindNeonatalMonitoring,
  NursingWardEditUpdateNeonatalMonitoring,
} from "../../networkServices/nursingWardAPI";

const NeonatalIntensive = ({ onClose, data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const [values, setValues] = useState({});
  const [tableData, setTableData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [rows, setRows] = useState([
    { fuildAddities: "", volume: "", duration: "" },
  ]);

  const [monitoringRows, setMonitoringRows] = useState([
    {
      temp: "",
      pulse: "",
      respRate: "",
      oxySat: "",
      serverRespDistress: "",
      cpapPressure: "",
      fio2Percent: "",
      totalFlow: "",
      jaundice: "",
      apnoea: "",
      bloodSugar: "",
      completeByAssesmentname: "",
      aspirateVolumne: "",
      fbmVolGiven: "",
      formulaVolgiven: "",
      totalFeed: "",
      deficitFeed: "",
      totalIVF: "",
      deficitIVF: "",
      ivVolumnGiven: "",
      vomit: "",
      urine: "",
      stool: "",
      completeByOutputName: "",
    },
  ]);

  const NEONATALINTENSIVEECORDS = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("Patient Name") },
    { width: "5%", name: t("Patient ID") },
    { width: "5%", name: t("Created Date") },
    { width: "5%", name: t("Created By") },
    { width: "3%", name: t("Edit") },
  ];

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const PatientID = data?.patientID;

      if (!PatientID) {
        notify(t("Patient ID missing"), "error");
        return;
      }

      let response = await NursingWardBindNeonatalMonitoring(PatientID);

      if (response?.success) {
        setTableData(response.data);
      } else {
        notify(response?.message || "Failed to fetch data", "error");
      }
    } catch (error) {
      notify(error?.message || "Error fetching data", "error");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setValues((val) => ({
        ...val,
        [name]: checked ? 1 : 0,
      }));
    } else {
      setValues((val) => ({
        ...val,
        [name]: value,
      }));
    }
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    const selectedValues = Array.isArray(selectedOptions)
      ? selectedOptions.map((opt) => opt.name || opt.value || opt)
      : [];

    setValues({
      ...values,
      [name]: selectedValues,
    });
  };

  const addRow = () => {
    setRows([...rows, { fuildAddities: "", volume: "", duration: "" }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  const handleRowChange = (index, e) => {
    const { name, value } = e.target;
    const updatedRows = [...rows];
    updatedRows[index][name] = value;
    setRows(updatedRows);
  };

  // Monitoring rows functions
  const addMonitoringRow = () => {
    setMonitoringRows([
      ...monitoringRows,
      {
        temp: "",
        pulse: "",
        respRate: "",
        oxySat: "",
        serverRespDistress: "",
        cpapPressure: "",
        fio2Percent: "",
        totalFlow: "",
        jaundice: "",
        apnoea: "",
        bloodSugar: "",
        completeByAssesmentname: "",
        aspirateVolumne: "",
        fbmVolGiven: "",
        formulaVolgiven: "",
        totalFeed: "",
        deficitFeed: "",
        totalIVF: "",
        deficitIVF: "",
        ivVolumnGiven: "",
        vomit: "",
        urine: "",
        stool: "",
        completeByOutputName: "",
      },
    ]);
  };

  const removeMonitoringRow = (index) => {
    if (monitoringRows.length > 1) {
      const newRows = monitoringRows.filter((_, i) => i !== index);
      setMonitoringRows(newRows);
    }
  };

  const handleMonitoringRowChange = (index, e) => {
    const { name, value } = e.target;
    const updatedRows = [...monitoringRows];
    updatedRows[index][name] = value;
    setMonitoringRows(updatedRows);
  };

  const preparePayload = () => {
    const transactionID = data?.transactionID || 0;
    const patientID = data?.patientID || "string";

    const interventions = values?.intervention || [];
    const interventionObj = {
      interventions_CPAP: interventions.includes("CPAP ") ? 1 : 0,
      interventions_Oxygen: interventions.includes("Oxygen ") ? 1 : 0,
      interventions_Phototherapy: interventions.includes("Phototherapy ")
        ? 1
        : 0,
      interventions_bloodTransfusion: interventions.includes(
        "Blood transfusion"
      )
        ? 1
        : 0,
      interventions_ExchangeTransfusion: interventions.includes("Exchange")
        ? 1
        : 0,
      interventions_Inotropes: interventions.includes("Intropes ") ? 1 : 0,
    };

    const feeds = values?.feed || [];
    const feedObj = {
      feed_BF: feeds.includes("BF") ? 1 : 0,
      feed_EBM: feeds.includes("EBM") ? 1 : 0,
      feed_TermForm: feeds.includes("Term Form") ? 1 : 0,
      feed_PreTermForm: feeds.includes("Pre Term") ? 1 : 0,
    };

    const routes = values?.route || [];
    const routeObj = {
      route_Cup: routes.includes("Cup") ? 1 : 0,
      route_NGT: routes.includes("NGT") ? 1 : 0,
    };

    const morningCategories = values?.morningShiftCategory || [];
    const morningCategoryObj = {
      morningCategoryA: morningCategories.includes("A") ? 1 : 0,
      morningCategoryB: morningCategories.includes("B") ? 1 : 0,
      morningCategoryC: morningCategories.includes("C") ? 1 : 0,
    };

    const nightCategories = values?.nightShiftCategory || [];
    const nightCategoryObj = {
      nightCategoryA: nightCategories.includes("A") ? 1 : 0,
      nightCategoryB: nightCategories.includes("B") ? 1 : 0,
      nightCategoryC: nightCategories.includes("C") ? 1 : 0,
    };

    const dailyCinicalFeed = rows.map((row, index) => ({
      refId: 0,
      sno: index + 1,
      ivFuildAdditives: row.fuildAddities || "",
      volumn: row.volume || "",
      duration: row.duration || "",
    }));

    const monitoringFreq = monitoringRows.map((row, index) => ({
      refId: 0,
      sno: index + 1,
      temp: row.temp || "",
      pulse: row.pulse || "",
      respRate: row.respRate || "",
      oxySat: row.oxySat || "",
      serverRespDistress: Array.isArray(row.serverRespDistress)
        ? row.serverRespDistress[0] || ""
        : row.serverRespDistress || "",
      cpapPressure: row.cpapPressure || "",
      fiO2Percent: row.fio2Percent || "",
      totalFlow: row.totalFlow || "",
      jaundice: row.jaundice || "",
      apnoea: Array.isArray(row.apnoea)
        ? row.apnoea[0] || ""
        : row.apnoea || "",
      bloodSugar: row.bloodSugar || "",
      completeByAssesmentname: row.completeByAssesmentname || "",
      aspirateVolumne: row.aspirateVolumne || "",
      fbMvolGiven: row.fbmVolGiven || "",
      formulaVolgiven: row.formulaVolgiven || "",
      totalFeed: row.totalFeed || "",
      deficitFeed: row.deficitFeed || "",
      totalIVF: row.totalIVF || "",
      deficitIVF: row.deficitIVF || "",
      iVvolumnGiven: row.ivVolumnGiven || "",
      vomit: Array.isArray(row.vomit) ? row.vomit[0] || "" : row.vomit || "",
      urine: Array.isArray(row.urine) ? row.urine[0] || "" : row.urine || "",
      stool: Array.isArray(row.stool) ? row.stool[0] || "" : row.stool || "",
      completeByOutputName: row.completeByOutputName || "",
    }));

    // FIXED: Better time formatting function
    const formatTimeForAPI = (dateTimeValue) => {
      if (!dateTimeValue) return "";

      try {
        let date;

        // Check if it's already a valid time string (HH:MM or HH:MM:SS)
        if (
          typeof dateTimeValue === "string" &&
          /^\d{1,2}:\d{2}(:\d{2})?$/.test(dateTimeValue)
        ) {
          const parts = dateTimeValue.split(":");
          const hours = parts[0].padStart(2, "0");
          const minutes = parts[1].padStart(2, "0");
          const seconds = parts[2] ? parts[2].padStart(2, "0") : "00";
          return `${hours}:${minutes}:${seconds}`;
        }

        // Try to parse as Date
        date = new Date(dateTimeValue);

        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn("Invalid time value:", dateTimeValue);
          return "";
        }

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
      } catch (error) {
        console.error("Time format error:", error);
        return "";
      }
    };

    const payload = {
      id: editMode && editId ? editId : 0,
      patientID: patientID,
      transactionID: transactionID,
      ...interventionObj,
      dayoflife: values?.dayOfLife || "",
      currentWt: values?.currentWeight || "",
      totalinput: values?.totalFuild || "",
      ...feedObj,
      ...routeObj,
      volumnAndFrequecy: values?.volumeFrequency || "",
      total24: values?.total24HrVol || "",
      chk3hrly: values?.threeHrly || 0,
      chk2hrly: values?.twoHrly || 0,
      otherPrescribingIntruction: values?.otherPrescribingInstruction || "",
      clinicianName: values?.clinicalName || "",
      clinicianTime: formatTimeForAPI(values?.time), // FIXED: Better handling
      ivFvolplan: values?.ivfVolumePlan || "",
      hrlyRateMl: values?.hrlyRateMl || "",
      hrlyRatedropPerMin: values?.hrlyRateDropMin || "",
      plannedVolMl: values?.plannedVolumeMl || "",
      plannedVolhr: values?.plannedVolumeInHr || "",
      morningShiftNotes: values?.morningShiftNote || "",
      morningIVLineWorking: Array.isArray(values?.ivLineWorkingMorning)
        ? values?.ivLineWorkingMorning[0] || ""
        : values?.ivLineWorkingMorning || "",
      ...morningCategoryObj,
      nightShiftNotes: values?.nightShiftNote || "",
      nightIVLineWorking: Array.isArray(values?.ivLineWorkingNight)
        ? values?.ivLineWorkingNight[0] || ""
        : values?.ivLineWorkingNight || "",
      ...nightCategoryObj,
      createdBy: "",
      createdDate: new Date().toISOString(),
      updatedBy: "",
      updatedDate: new Date().toISOString(),
      monitoringFreq: monitoringFreq,
      dailyCinicalFeed: dailyCinicalFeed,
      obj: "string", // ADDED: Required field by backend
    };

    return payload;
  };

  const handleSave = async () => {
    try {
      const payload = preparePayload();

      console.log("Save Payload:", payload);

      let response = await NursingWardSaveNeonatalMonitoring(payload);

      if (response?.success) {
        notify(t("Saved successfully"), "success");
        resetForm();
        await fetchTableData();
      } else {
        notify(response?.message || "Failed to save", "error");
      }
    } catch (error) {
      notify(error?.message || "Error saving data", "error");
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = preparePayload();

      if (!editId) {
        notify(t("No record selected for update"), "error");
        return;
      }

      console.log("Update Payload:", payload); // Debug log

      let response = await NursingWardUpdateNeonatalMonitoring(payload);

      if (response?.success) {
        notify(t("Updated successfully"), "success");
        resetForm();
        await fetchTableData();
      } else {
        notify(response?.message || "Failed to update", "error");
      }
    } catch (error) {
      notify(error?.message || "Error updating data", "error");
    }
  };

  const resetForm = () => {
    setValues({});
    setRows([{ fuildAddities: "", volume: "", duration: "" }]);
    setMonitoringRows([
      {
        temp: "",
        pulse: "",
        respRate: "",
        oxySat: "",
        serverRespDistress: "",
        cpapPressure: "",
        fio2Percent: "",
        totalFlow: "",
        jaundice: "",
        apnoea: "",
        bloodSugar: "",
        completeByAssesmentname: "",
        aspirateVolumne: "",
        fbmVolGiven: "",
        formulaVolgiven: "",
        totalFeed: "",
        deficitFeed: "",
        totalIVF: "",
        deficitIVF: "",
        ivVolumnGiven: "",
        vomit: "",
        urine: "",
        stool: "",
        completeByOutputName: "",
      },
    ]);
    setEditMode(false);
    setEditId(null);
  };

  const handleEdit = async (row) => {
    try {
      const response = await NursingWardEditUpdateNeonatalMonitoring(row.Id);

      if (!response?.success) {
        notify(response?.message || "Failed to fetch edit data", "error");
        return;
      }

      const editData = response.data;

      const interventions = [];
      if (editData.Interventions_CPAP === 1) interventions.push("CPAP ");
      if (editData.Interventions_Oxygen === 1) interventions.push("Oxygen ");
      if (editData.Interventions_Phototherapy === 1)
        interventions.push("Phototherapy ");
      if (editData.Interventions_bloodTransfusion === 1)
        interventions.push("Blood transfusion");
      if (editData.Interventions_ExchangeTransfusion === 1)
        interventions.push("Exchange");
      if (editData.Interventions_Inotropes === 1)
        interventions.push("Intropes ");

      const feeds = [];
      if (editData.Feed_BF === 1) feeds.push("BF");
      if (editData.Feed_EBM === 1) feeds.push("EBM");
      if (editData.Feed_TermForm === 1) feeds.push("Term Form");
      if (editData.Feed_PreTermForm === 1) feeds.push("Pre Term");

      const routes = [];
      if (editData.Route_Cup === 1) routes.push("Cup");
      if (editData.Route_NGT === 1) routes.push("NGT");

      const morningCategory =
        editData.MorningCategoryA === 1
          ? ["A"]
          : editData.MorningCategoryB === 1
            ? ["B"]
            : editData.MorningCategoryC === 1
              ? ["C"]
              : [];

      const nightCategory =
        editData.NightCategoryA === 1
          ? ["A"]
          : editData.NightCategoryB === 1
            ? ["B"]
            : editData.NightCategoryC === 1
              ? ["C"]
              : [];

      const formValues = {
        intervention: interventions,
        dayOfLife: editData.dayoflife || "",
        currentWeight: editData.CurrentWt || "",
        totalFuild: editData.totalinput || "",
        feed: feeds,
        route: routes,
        volumeFrequency: editData.VolumnAndFrequecy || "",
        threeHrly: editData.chk3hrly || 0,
        twoHrly: editData.chk2hrly || 0,
        total24HrVol: editData.Total24 || "",
        otherPrescribingInstruction: editData.OtherPrescribingIntruction || "",
        clinicalName: editData.ClinicianName || "",
        time: editData.ClinicianTime || "", // Keep as string from backend
        ivfVolumePlan: editData.IVFvolplan || "",
        hrlyRateMl: editData.HrlyRateMl || "",
        hrlyRateDropMin: editData.HrlyRatedropPerMin || "",
        plannedVolumeMl: editData.PlannedVolMl || "",
        plannedVolumeInHr: editData.PlannedVolhr || "",
        morningShiftNote: editData.MorningShiftNotes || "",
        ivLineWorkingMorning: editData.MorningIVLineWorking
          ? [editData.MorningIVLineWorking]
          : [],
        morningShiftCategory: morningCategory,
        nightShiftNote: editData.NightShiftNotes || "",
        ivLineWorkingNight: editData.NightIVLineWorking
          ? [editData.NightIVLineWorking]
          : [],
        nightShiftCategory: nightCategory,
      };

      setValues(formValues);

      if (editData.MonitoringFreq && editData.MonitoringFreq.length > 0) {
        setMonitoringRows(
          editData.MonitoringFreq.map((item) => ({
            temp: item.temp || "",
            pulse: item.pulse || "",
            respRate: item.respRate || "",
            oxySat: item.oxySat || "",
            serverRespDistress: item.serverRespDistress || "",
            cpapPressure: item.cpapPressure || "",
            fio2Percent: item.fiO2Percent || "",
            totalFlow: item.totalFlow || "",
            jaundice: item.jaundice || "",
            apnoea: item.apnoea || "",
            bloodSugar: item.bloodSugar || "",
            completeByAssesmentname: item.completeByAssesmentname || "",
            aspirateVolumne: item.aspirateVolumne || "",
            fbmVolGiven: item.fbMvolGiven || "",
            formulaVolgiven: item.formulaVolgiven || "",
            totalFeed: item.totalFeed || "",
            deficitFeed: item.deficitFeed || "",
            totalIVF: item.totalIVF || "",
            deficitIVF: item.deficitIVF || "",
            ivVolumnGiven: item.iVvolumnGiven || "",
            vomit: item.vomit || "",
            urine: item.urine || "",
            stool: item.stool || "",
            completeByOutputName: item.completeByOutputName || "",
          }))
        );
      }

      if (editData.DailyCinicalFeed && editData.DailyCinicalFeed.length > 0) {
        setRows(
          editData.DailyCinicalFeed.map((item) => ({
            fuildAddities: item.ivFuildAdditives || "",
            volume: item.volumn || "",
            duration: item.duration || "",
          }))
        );
      }

      setEditMode(true);
      setEditId(editData.Id);
    } catch (error) {
      console.error("Error in handleEdit:", error);
      notify(t("Error loading data for editing"), "error");
    }
  };

  const renderForm = () => (
    <>
      <Heading
        title={
          <span className="text-dark">{t("Neonatal Intensive Monitoring Chart")}</span>
        }
        secondTitle={
          <button
            className="py-2"
            onClick={onClose}
            style={{ background: "none", border: "none" }}
          >
            ✕
          </button>
        }
      />
      <div className="row p-2">
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="intervention"
          id="intervention"
          placeholderName={t("Intervention")}
          dynamicOptions={[
            { name: "CPAP ", value: "CPAP " },
            { name: "Oxygen ", value: "Oxygen " },
            { name: "Phototherapy ", value: "Phototherapy " },
            { name: "Blood transfusion", value: "Blood transfusion" },
            { name: "Exchange", value: "Exchange" },
            { name: "Transfusion ", value: "Transfusion " },
            { name: "Intropes ", value: "Intropes " },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.intervention}
          isRemoveTemplate={true}
        />
      </div>
      <Heading
        title={
          <span className="text-dark">
            {t("Daily Clinical Feed and Fuild Prescription")}
          </span>
        }
      />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="dayOfLife"
          lable={t("Day of life")}
          placeholder=" "
          required={true}
          value={values?.dayOfLife}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="dayOfLife"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="currentWeight"
          lable={t("Current weight")}
          placeholder=" "
          required={true}
          value={values?.currentWeight}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="currentWeight"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="totalFuild"
          lable={t("Total Fuild")}
          placeholder=" "
          required={true}
          value={values?.totalFuild}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="totalFuild"
          onChange={handleChange}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="feed"
          id="feed"
          placeholderName={t("Feed")}
          dynamicOptions={[
            { name: "BF", value: "BF" },
            { name: "EBM", value: "EBM" },
            { name: "Term Form", value: "Term Form" },
            { name: "Pre Term", value: "Pre Term" },
            { name: "Form", value: "Form" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.feed}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="route"
          id="route"
          placeholderName={t("Route")}
          dynamicOptions={[
            { name: "Cup", value: "Cup" },
            { name: "NGT", value: "NGT" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.route}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="volumeFrequency"
          lable={t("Volume & Frequency")}
          placeholder=" "
          required={true}
          value={values?.volumeFrequency}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="volumeFrequency"
          onChange={handleChange}
        />
        <Input
          type="checkbox"
          className="form-control"
          id="threeHrly"
          lable={t("3hrly")}
          placeholder=" "
          checked={values?.threeHrly === 1}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="threeHrly"
          onChange={handleChange}
        />
        <Input
          type="checkbox"
          className="form-control"
          id="twoHrly"
          lable={t("2hrly")}
          placeholder=" "
          checked={values?.twoHrly === 1}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="twoHrly"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="total24HrVol"
          lable={t("Total 24 hr vol")}
          placeholder=" "
          required={true}
          value={values?.total24HrVol}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="total24HrVol"
          onChange={handleChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Fuild Addities")}</span>} />
      <div className="row p-2">
        {rows.map((row, index) => (
          <div className="row p-2 align-items-center" key={index}>
            <div className="col-xl-1 col-md-1 col-sm-1 col-2 fw-bold">
              {index + 1}
            </div>
            <Input
              type="text"
              className="form-control"
              id={`fuildAddities-${index}`}
              lable={t("IV fuild Addities")}
              placeholder=" "
              required={true}
              value={row.fuildAddities}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="fuildAddities"
              onChange={(e) => handleRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`volume-${index}`}
              lable={t("Vol (ml)")}
              placeholder=" "
              required={true}
              value={row.volume}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="volume"
              onChange={(e) => handleRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`duration-${index}`}
              lable={t("Duration")}
              placeholder=" "
              required={true}
              value={row.duration}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="duration"
              onChange={(e) => handleRowChange(index, e)}
            />
            <div className="col-xl-2 col-md-2 col-sm-4 col-12 d-flex gap-2">
              <button
                type="button"
                className="btn btn-success mr-2"
                onClick={addRow}
              >
                +
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeRow(index)}
              >
                –
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="otherPrescribingInstruction"
          lable={t("Other prescribing Instruction")}
          placeholder=" "
          required={true}
          value={values?.otherPrescribingInstruction}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="otherPrescribingInstruction"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="clinicalName"
          lable={t("Clinical name")}
          placeholder=" "
          required={true}
          value={values?.clinicalName}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="clinicalName"
          onChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Time")}
          lable={t("Time")}
          id="time"
          name="time"
          value={values?.time}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
      </div>
      <Heading title={<span className="text-dark">{t("Nursing Plan")}</span>} />
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="ivfVolumePlan"
          lable={t("IVF vol plan")}
          placeholder=" "
          required={true}
          value={values?.ivfVolumePlan}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="ivfVolumePlan"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="hrlyRateMl"
          lable={t("Hrly rate (ml)")}
          placeholder=" "
          required={true}
          value={values?.hrlyRateMl}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="hrlyRateMl"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="hrlyRateDropMin"
          lable={t("Hrly rate (drop/min)")}
          placeholder=" "
          required={true}
          value={values?.hrlyRateDropMin}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="hrlyRateDropMin"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="plannedVolumeMl"
          lable={t("Planned vol(ml)")}
          placeholder=" "
          required={true}
          value={values?.plannedVolumeMl}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="plannedVolumeMl"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="plannedVolumeInHr"
          lable={t("Planned vol(in hr)")}
          placeholder=" "
          required={true}
          value={values?.plannedVolumeInHr}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="plannedVolumeInHr"
          onChange={handleChange}
        />
      </div>

      <Heading
        title={<span className="text-dark">{t("Monitoring Frequency")}</span>}
      />
      <div className="row p-2">
        {monitoringRows.map((row, index) => (
          <div
            className="row p-2 align-items-center"
            key={`monitoring-${index}`}
          >
            <div className="col-xl-1 col-md-1 col-sm-1 col-2 fw-bold">
              {index + 1}
            </div>
            <Input
              type="text"
              className="form-control"
              id={`temp-${index}`}
              lable={t("Temperature (°C)")}
              placeholder=" "
              required={true}
              value={row.temp}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="temp"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`pulse-${index}`}
              lable={t("Pulse (b/min)")}
              placeholder=" "
              required={true}
              value={row.pulse}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="pulse"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`respRate-${index}`}
              lable={t("Resp Rate (b/min)")}
              placeholder=" "
              required={true}
              value={row.respRate}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="respRate"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`oxySat-${index}`}
              lable={t("Oxy Sat(%)")}
              placeholder=" "
              required={true}
              value={row.oxySat}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="oxySat"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="serverResp"
              id={`serverResp-${index}`}
              placeholderName={t("Server Resp")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={(name, selectedOptions) => {
                const updatedRows = [...monitoringRows];
                updatedRows[index].serverRespDistress =
                  selectedOptions[0] || "";
                setMonitoringRows(updatedRows);
              }}
              value={row.serverRespDistress ? [row.serverRespDistress] : []}
              isRemoveTemplate={true}
            />
            <Input
              type="text"
              className="form-control"
              id={`cpapPressure-${index}`}
              lable={t("CPAP Pressure")}
              placeholder=" "
              required={true}
              value={row.cpapPressure}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="cpapPressure"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`fio2Percent-${index}`}
              lable={t("FiO2 (%)")}
              placeholder=" "
              required={true}
              value={row.fio2Percent}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="fio2Percent"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`totalFlow-${index}`}
              lable={t("Total Flow")}
              placeholder=" "
              required={true}
              value={row.totalFlow}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="totalFlow"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`jaundice-${index}`}
              lable={t("Jaundice")}
              placeholder=" "
              required={true}
              value={row.jaundice}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="jaundice"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="apnoea"
              id={`apnoea-${index}`}
              placeholderName={t("Apnoea")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={(name, selectedOptions) => {
                const updatedRows = [...monitoringRows];
                updatedRows[index].apnoea = selectedOptions[0] || "";
                setMonitoringRows(updatedRows);
              }}
              value={row.apnoea ? [row.apnoea] : []}
              isRemoveTemplate={true}
            />
            <Input
              type="text"
              className="form-control"
              id={`bloodSugar-${index}`}
              lable={t("Blood Sugar")}
              placeholder=" "
              required={true}
              value={row.bloodSugar}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="bloodSugar"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`completeByAssesmentname-${index}`}
              lable={t("Complete by")}
              placeholder=" "
              required={true}
              value={row.completeByAssesmentname}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="completeByAssesmentname"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`aspirateVolumne-${index}`}
              lable={t("Aspirate by")}
              placeholder=" "
              required={true}
              value={row.aspirateVolumne}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="aspirateVolumne"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`fbmVolGiven-${index}`}
              lable={t("FBM Volume")}
              placeholder=" "
              required={true}
              value={row.fbmVolGiven}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="fbmVolGiven"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`formulaVolgiven-${index}`}
              lable={t("Formula volume")}
              placeholder=" "
              required={true}
              value={row.formulaVolgiven}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="formulaVolgiven"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`totalFeed-${index}`}
              lable={t("Total Feed")}
              placeholder=" "
              required={true}
              value={row.totalFeed}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="totalFeed"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`deficitFeed-${index}`}
              lable={t("Deficit")}
              placeholder=" "
              required={true}
              value={row.deficitFeed}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="deficitFeed"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`ivVolumnGiven-${index}`}
              lable={t("IV Volumn Given")}
              placeholder=" "
              required={true}
              value={row.ivVolumnGiven}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="ivVolumnGiven"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`totalIVF-${index}`}
              lable={t("Total IVF")}
              placeholder=" "
              required={true}
              value={row.totalIVF}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="totalIVF"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <Input
              type="text"
              className="form-control"
              id={`deficitIVF-${index}`}
              lable={t("Deficit")}
              placeholder=" "
              required={true}
              value={row.deficitIVF}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="deficitIVF"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="vomit"
              id={`vomit-${index}`}
              placeholderName={t("Vomit")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={(name, selectedOptions) => {
                const updatedRows = [...monitoringRows];
                updatedRows[index].vomit = selectedOptions[0] || "";
                setMonitoringRows(updatedRows);
              }}
              value={row.vomit ? [row.vomit] : []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="urine"
              id={`urine-${index}`}
              placeholderName={t("Urine")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={(name, selectedOptions) => {
                const updatedRows = [...monitoringRows];
                updatedRows[index].urine = selectedOptions[0] || "";
                setMonitoringRows(updatedRows);
              }}
              value={row.urine ? [row.urine] : []}
              isRemoveTemplate={true}
            />
            <MultiSelectComp
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="stool"
              id={`stool-${index}`}
              placeholderName={t("Stool")}
              dynamicOptions={[
                { name: "Yes", value: "Yes" },
                { name: "No", value: "No" },
              ]}
              handleChange={(name, selectedOptions) => {
                const updatedRows = [...monitoringRows];
                updatedRows[index].stool = selectedOptions[0] || "";
                setMonitoringRows(updatedRows);
              }}
              value={row.stool ? [row.stool] : []}
              isRemoveTemplate={true}
            />
            <Input
              type="text"
              className="form-control"
              id={`completeByOutputName-${index}`}
              lable={t("Complete")}
              placeholder=" "
              required={true}
              value={row.completeByOutputName}
              respclass="col-xl-2 col-md-3 col-sm-6 col-12"
              name="completeByOutputName"
              onChange={(e) => handleMonitoringRowChange(index, e)}
            />
            <div className="col-xl-2 col-md-2 col-sm-4 col-12 d-flex gap-2">
              <button
                type="button"
                className="btn btn-success mr-2"
                onClick={addMonitoringRow}
              >
                +
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeMonitoringRow(index)}
              >
                -
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="morningShiftNote"
          lable={t("Morning shift note")}
          placeholder=" "
          required={true}
          value={values?.morningShiftNote}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="morningShiftNote"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="ivLineWorkingMorning"
          id="ivLineWorkingMorning"
          placeholderName={t("IV Line working")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.ivLineWorkingMorning}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="morningShiftCategory"
          id="morningShiftCategory"
          placeholderName={t("Category")}
          dynamicOptions={[
            { name: "A", value: "A" },
            { name: "B", value: "B" },
            { name: "C", value: "C" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.morningShiftCategory}
          isRemoveTemplate={true}
        />
      </div>
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="nightShiftNote"
          lable={t("Night shift note")}
          placeholder=" "
          required={true}
          value={values?.nightShiftNote}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="nightShiftNote"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="ivLineWorkingNight"
          id="ivLineWorkingNight"
          placeholderName={t("IV Line working")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.ivLineWorkingNight}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="nightShiftCategory"
          id="nightShiftCategory"
          placeholderName={t("Category")}
          dynamicOptions={[
            { name: "A", value: "A" },
            { name: "B", value: "B" },
            { name: "C", value: "C" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.nightShiftCategory}
          isRemoveTemplate={true}
        />
      </div>
      <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2 px-2">
        {!editMode ? (
          <button
            type="button"
            className="btn btn-sm btn-primary mr-1"
            onClick={handleSave}
          >
            {t("Save")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary mr-1"
              onClick={handleUpdate}
            >
              {t("Update")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary mr-1"
              onClick={resetForm}
            >
              {t("Cancel")}
            </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="card">
      {renderForm()}
      {tableData.length > 0 && (
        <Tables
          thead={NEONATALINTENSIVEECORDS}
          tbody={tableData.map((row, index) => {
            const interventions = [];
            if (row.Interventions_CPAP === 1) interventions.push("CPAP");
            if (row.Interventions_Oxygen === 1) interventions.push("Oxygen");
            if (row.Interventions_Phototherapy === 1)
              interventions.push("Phototherapy");
            if (row.Interventions_bloodTransfusion === 1)
              interventions.push("Blood transfusion");
            if (row.Interventions_ExchangeTransfusion === 1)
              interventions.push("Exchange");
            if (row.Interventions_Inotropes === 1)
              interventions.push("Inotropes");
            const firstMonitoring = row.MonitoringFreq?.[0] || {};

            return {
              "Sr.No": index + 1,
              "Patient Name": row.PName || "-",
              "Patient ID": row.PatientID || "-",
              "Created Date": row.CreatedDate || "-",
              "Created By": row.CreatedBy || "-",
              Edit: (
                <i
                  className="bi bi-pencil-square"
                  style={{ cursor: "pointer", color: "#007bff" }}
                  onClick={() => handleEdit(row)}
                />
              ),
            };
          })}
        />
      )}
    </div>
  );
};

export default NeonatalIntensive;
