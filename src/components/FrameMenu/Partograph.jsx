import React, { useState, useEffect, useCallback } from "react";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import TimePicker from "../formComponent/TimePicker";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import Tables from "../UI/customTable";
import { useTranslation } from "react-i18next";
import {
  NursingWardSavePartographForm,
  NursingWardGetPartographForm,
  NursingWardUpdatePartographForm,
  NursingWardSaveTablePartographForm,
  NursingWardGetTablePartographForm,
} from "../../networkServices/nursingWardAPI";
import moment from "moment/moment";

const Partograph = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const patientId = data?.patientID;
  const transactionId = data?.transactionID;
  const [t] = useTranslation();

  const [values, setValues] = useState({
    rupturedMembranesDate: new Date(),
    timeRupturedMembranes: "",
    dilationDate: new Date(),
    dilationTime: "",
    labourBeganDate: new Date(),
    time: "",
    lmpDate: new Date(),
    edd: "",
    wksGest: "",
    gravida: "",
    para: "",
    amnioticFluid: [],
    moulding: [],
    oxytocin: "",
    atDrops: "",
    urineProtein: [],
    urineVolume: "",
    urineKetones: [],
    drugsGiven: "",
    fourthFluidsGiven: "",
  });

  const [tableData, setTableData] = useState([
    {
      hours: "",
      time: "",
      bp: "",
      fhr: "",
      temp: "",
      pulse: "",
      contraction: "",
      lasting: "",
      cervix: "",
      descent: "",
      entryBy: "",
      remark: "",
    },
  ]);

  const [savedRecords, setSavedRecords] = useState([]);
  const [savedTableRecords, setSavedTableRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTableEditMode, setIsTableEditMode] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [currentTableRecordId, setCurrentTableRecordId] = useState(null);

  const timeOptions = [
    "12:01 AM",
    "12:11 AM",
    "12:21 AM",
    "12:31 AM",
    "12:41 AM",
    "12:51 AM",
    "01:01 AM",
    "01:11 AM",
    "01:21 AM",
    "01:31 AM",
    "01:41 AM",
    "01:51 AM",
    "02:01 AM",
    "02:11 AM",
    "02:21 AM",
    "02:31 AM",
    "02:41 AM",
    "02:51 AM",
    "03:01 AM",
    "03:11 AM",
    "03:21 AM",
    "03:31 AM",
    "03:41 AM",
    "03:51 AM",
    "04:01 AM",
    "04:11 AM",
    "04:21 AM",
    "04:31 AM",
    "04:41 AM",
    "04:51 AM",
    "05:01 AM",
    "05:11 AM",
    "05:21 AM",
    "05:31 AM",
    "05:41 AM",
    "05:51 AM",
    "06:01 AM",
    "06:11 AM",
    "06:21 AM",
    "06:31 AM",
    "06:41 AM",
    "06:51 AM",
    "07:01 AM",
    "07:11 AM",
    "07:21 AM",
    "07:31 AM",
    "07:41 AM",
    "07:51 AM",
    "08:01 AM",
    "08:11 AM",
    "08:21 AM",
    "08:31 AM",
    "08:41 AM",
    "08:51 AM",
    "09:01 AM",
    "09:11 AM",
    "09:21 AM",
    "09:31 AM",
    "09:41 AM",
    "09:51 AM",
    "10:01 AM",
    "10:11 AM",
    "10:21 AM",
    "10:31 AM",
    "10:41 AM",
    "10:51 AM",
    "11:01 AM",
    "11:11 AM",
    "11:21 AM",
    "11:31 AM",
    "11:41 AM",
    "11:51 AM",
    "12:01 PM",
    "12:11 PM",
    "12:21 PM",
    "12:31 PM",
    "12:41 PM",
    "12:51 PM",
    "01:01 PM",
    "01:11 PM",
    "01:21 PM",
    "01:31 PM",
    "01:41 PM",
    "01:51 PM",
    "02:01 PM",
    "02:11 PM",
    "02:21 PM",
    "02:31 PM",
    "02:41 PM",
    "02:51 PM",
    "03:01 PM",
    "03:11 PM",
    "03:21 PM",
    "03:31 PM",
    "03:41 PM",
    "03:51 PM",
    "04:01 PM",
    "04:11 PM",
    "04:21 PM",
    "04:31 PM",
    "04:41 PM",
    "04:51 PM",
    "05:01 PM",
    "05:11 PM",
    "05:21 PM",
    "05:31 PM",
    "05:41 PM",
    "05:51 PM",
    "06:01 PM",
    "06:11 PM",
    "06:21 PM",
    "06:31 PM",
    "06:41 PM",
    "06:51 PM",
    "07:01 PM",
    "07:11 PM",
    "07:21 PM",
    "07:31 PM",
    "07:41 PM",
    "07:51 PM",
    "08:01 PM",
    "08:11 PM",
    "08:21 PM",
    "08:31 PM",
    "08:41 PM",
    "08:51 PM",
    "09:01 PM",
    "09:11 PM",
    "09:21 PM",
    "09:31 PM",
    "09:41 PM",
    "09:51 PM",
    "10:01 PM",
    "10:11 PM",
    "10:21 PM",
    "10:31 PM",
    "10:41 PM",
    "10:51 PM",
    "11:01 PM",
    "11:11 PM",
    "11:21 PM",
    "11:31 PM",
    "11:41 PM",
    "11:51 PM",
  ];

  const contraction = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
  ];

  const lastingOptions = ["<20 Secs", "20 to 40", ">40"];
  const cervixOptions = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
  ];
  const descentOptions = ["0", "1", "2", "3", "4", "5"];

  const INPUT_TABLE_COLUMNS = [
    { width: "1%", name: t("Time") },
    { width: "1%", name: t("BP") },
    { width: "1%", name: t("FHR") },
    { width: "1%", name: t("Temp") },
    { width: "1%", name: t("Pulse") },
    { width: "1%", name: t("Contraction") },
    { width: "1%", name: t("Lasting") },
    { width: "1%", name: t("Cervix") },
    { width: "1%", name: t("Descent") },
    { width: "1%", name: t("Entry By") },
    { width: "1%", name: t("Remark") },
    { width: "1%", name: t("Action") },
  ];

  const PARTOGRAPHRESULT = [
    { width: "1%", name: t("Sr.No") },
    { width: "1%", name: t("Date") },
    { width: "1%", name: t("Time") },
    { width: "1%", name: t("D Date") },
    { width: "1%", name: t("D Time") },
    { width: "1%", name: t("Gravida") },
    { width: "1%", name: t("Para") },
    { width: "1%", name: t("AMF") },
    { width: "1%", name: t("Moulding") },
    { width: "1%", name: t("OxyinML") },
    { width: "1%", name: t("OxyDrops") },
    { width: "1%", name: t("U. Protein") },
    { width: "1%", name: t("U. Volume") },
    { width: "1%", name: t("U. Ketones") },
    { width: "1%", name: t("Drugs") },
    { width: "1%", name: t("Edit") },
  ];

  const TABLE_RESULT_COLUMNS = [
    { width: "1%", name: t("Sr.No") },
    { width: "1%", name: t("Date") },
    { width: "1%", name: t("Time") },
    { width: "1%", name: t("BP") },
    { width: "1%", name: t("Temp") },
    { width: "1%", name: t("Pulse") },
    { width: "1%", name: t("FHR") },
    { width: "1%", name: t("Contraction") },
    { width: "1%", name: t("Lasting") },
    { width: "1%", name: t("Cervix") },
    { width: "1%", name: t("Descent") },
    { width: "1%", name: t("Entry By") },
    { width: "1%", name: t("Remark") },
    { width: "1%", name: t("Edit") },
  ];

  // Helper function to ensure array format for multiselect values
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value) {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    if (patientId && transactionId) {
      fetchSavedRecords();
      fetchSavedTableRecords();
    }
  }, [patientId, transactionId]);

  const fetchSavedRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await NursingWardGetPartographForm(transactionId);

      if (response?.success) {
        if (response.data && Array.isArray(response.data)) {
          setSavedRecords(response.data);
        } else if (response.data?.rows) {
          setSavedRecords(response.data.rows);
        } else {
          setSavedRecords([]);
        }
      } else {
        notify(response?.message || "Failed to fetch records", "error");
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      notify(error?.message || "Network error", "error");
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  const fetchSavedTableRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await NursingWardGetTablePartographForm(
        patientId,
        transactionId
      );

      if (response?.success) {
        if (response.data && Array.isArray(response.data)) {
          setSavedTableRecords(response.data);
        } else if (response.data?.rows) {
          setSavedTableRecords(response.data.rows);
        } else {
          setSavedTableRecords([]);
        }
      } else {
        notify(response?.message || "Failed to fetch table records", "error");
      }
    } catch (error) {
      console.error("Error fetching table records:", error);
      notify(error?.message || "Network error", "error");
    } finally {
      setIsLoading(false);
    }
  }, [transactionId, patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  const handleTableRowChange = (index, field, value) => {
    const updatedRows = [...tableData];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };
    setTableData(updatedRows);
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

  const createEmptyRow = () => ({
    hours: "",
    time: "",
    bp: "",
    fhr: "",
    temp: "",
    pulse: "",
    contraction: "",
    lasting: "",
    cervix: "",
    descent: "",
    entryBy: "",
    remark: "",
  });

  const addRow = () => {
    setTableData((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (index) => {
    if (tableData.length > 1) {
      const updatedRows = tableData.filter((_, i) => i !== index);
      setTableData(updatedRows);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const buildFormPayload = () => {
    return {
      lbd: values.labourBeganDate ? formatDate(values.labourBeganDate) : "",
      lbTime: moment(values.time).format("HH:mm"),
      lmp: values.lmpDate ? formatDate(values.lmpDate) : "",
      edd: moment(values.edd).format("HH:mm"),
      wksGest: values.wksGest || "",
      isRuptured: values.rupturedMembranesDate ? 1 : 0,
      patientID: patientId,
      transactionID: transactionId,
      date: formatDate(new Date()),
      time: moment(values.time).format("HH:mm"),
      dilationDate: values.dilationDate ? formatDate(values.dilationDate) : "",
      dilationTime: moment(values.dilationTime).format("HH:mm"),
      gravida: values.gravida || "",
      para: values.para || "",
      amf: Array.isArray(values.amnioticFluid)
        ? values.amnioticFluid.join(", ")
        : values.amnioticFluid || "",
      moulding: Array.isArray(values.moulding)
        ? values.moulding.join(", ")
        : values.moulding || "",
      urineProtein: Array.isArray(values.urineProtein)
        ? values.urineProtein.join(", ")
        : values.urineProtein || "",
      urineKetones: Array.isArray(values.urineKetones)
        ? values.urineKetones.join(", ")
        : values.urineKetones || "",
      oxyinML: values.oxytocin || "",
      oxydrops: values.atDrops || "",
      urineVol: values.urineVolume || "",
      drugs: values.drugsGiven || "",
      fluids: values.fourthFluidsGiven || "",
      createdBy: "CurrentUser",
    };
  };

  const buildTablePayload = () => {
    return tableData.map((row) => ({
      cervix: row.cervix || "",
      descent: row.descent || "",
      alert: row.alert || "",
      action: row.action || "",
      time: row.time,
      date: formatDate(new Date()),
      createdBy: row.entryBy || "CurrentUser",
      transactionId: transactionId,
      patientId: patientId,
      bp: row.bp || "",
      temp: row.temp || "",
      pulse: row.pulse || "",
      fhr: row.fhr || "",
      contraction: row.contraction || "",
      lasting: row.lasting || "",
      isActive: "true",
      remark: row.remark || "",
    }));
  };

  const notify = (message, type) => {
    console.log(`${type}: ${message}`);
  };

  const handleSave = async () => {
    try {
      if (!values.gravida || !values.para || !values.labourBeganDate) {
        notify(
          t("Please fill required fields: Gravida, Para and Labour Began Date"),
          "warning"
        );
        return;
      }

      setIsLoading(true);
      const payload = buildFormPayload();
      console.log("FORM SAVE Payload:", payload);

      const response = await NursingWardSavePartographForm(payload);

      if (response?.success) {
        notify(t("Form record saved successfully"), "success");
        resetForm();
        await fetchSavedRecords();
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      console.error("Save Error:", error);
      notify(t("Error saving data"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSave = async () => {
    try {
      debugger;
      if (tableData.length === 0 || !tableData[0].time) {
        notify(t("Please fill at least one table row with time"), "warning");
        return;
      }

      setIsLoading(true);
      const tablePayload = buildTablePayload();
      const payload = {
        obj: tablePayload,
      };

      console.log("TABLE SAVE Payload:", payload);

      const response = await NursingWardSaveTablePartographForm(payload);

      if (response?.success) {
        notify(t("Table records saved successfully"), "success");
        resetTableData();
        await fetchSavedTableRecords();
      } else {
        notify(response?.message || "Table save failed", "error");
      }
    } catch (error) {
      console.error("Table Save Error:", error);
      notify(t("Error saving table data"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!currentRecordId) {
        notify(t("No record selected for update"), "warning");
        return;
      }

      setIsLoading(true);
      const payload = {
        id: currentRecordId,
        ...buildFormPayload(),
      };

      console.log("FORM UPDATE Payload:", payload);

      const response = await NursingWardUpdatePartographForm(payload);

      if (response?.success) {
        notify(t("Record updated successfully"), "success");
        resetForm();
        await fetchSavedRecords();
      } else {
        notify(response?.message || "Update failed", "error");
      }
    } catch (error) {
      console.error("Update Error:", error);
      notify(t("Error updating data"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (row) => {
    console.log("Editing form row:", row);

    setValues({
      rupturedMembranesDate: row.rupturedMembranesDate || "",
      timeRupturedMembranes: row.timeRupturedMembranes || "",
      dilationDate: row.dilationDate || "",
      dilationTime: row.dilationTime || "",
      labourBeganDate: row.lbd || "",
      time: row.lbTime || "",
      lmpDate: row.lmp || "",
      edd: row.edd || "",
      wksGest: row.wksGest || "",
      gravida: row.gravida || "",
      para: row.para || "",
      amnioticFluid: ensureArray(row.amf),
      moulding: ensureArray(row.moulding),
      oxytocin: row.oxyinML || "",
      atDrops: row.oxydrops || "",
      urineProtein: ensureArray(row.urineProtein),
      urineVolume: row.urineVol || "",
      urineKetones: ensureArray(row.urineKetones),
      drugsGiven: row.drugs || "",
      fourthFluidsGiven: row.fluids || "",
    });

    setCurrentRecordId(row.id || row.Id);
    setIsEditMode(true);
    notify(t("Form record loaded for editing"), "success");
  };

  const handleTableEdit = (row) => {
    console.log("Editing table row:", row);

    setTableData([
      {
        hours: row.hours || "",
        time: row.time || "",
        bp: row.bp || "",
        fhr: row.fhr || "",
        temp: row.temp || "",
        pulse: row.pulse || "",
        contraction: row.contraction || "",
        lasting: row.lasting || "",
        cervix: row.cervix || "",
        descent: row.descent || "",
        entryBy: row.createdBy || "",
        remark: row.remark || "",
      },
    ]);

    setCurrentTableRecordId(row.id || row.Id);
    setIsTableEditMode(true);
    notify(t("Table record loaded for editing"), "success");
  };

  const resetForm = () => {
    setValues({
      rupturedMembranesDate: new Date(),
      timeRupturedMembranes: "",
      dilationDate: new Date(),
      dilationTime: "",
      labourBeganDate: new Date(),
      time: "",
      lmpDate: new Date(),
      edd: "",
      wksGest: "",
      gravida: "",
      para: "",
      amnioticFluid: [],
      moulding: [],
      oxytocin: "",
      atDrops: "",
      urineProtein: [],
      urineVolume: "",
      urineKetones: [],
      drugsGiven: "",
      fourthFluidsGiven: "",
    });
    setIsEditMode(false);
    setCurrentRecordId(null);
  };

  const resetTableData = () => {
    setTableData([createEmptyRow()]);
    setIsTableEditMode(false);
    setCurrentTableRecordId(null);
  };

  return (
    <>
      <Heading title={<span className="text-dark">{t("Partograph")}</span>} />
      <div className="row p-2">
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date of Ruptured Membranes")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="rupturedMembranesDate"
          id="rupturedMembranesDate"
          value={values?.rupturedMembranesDate}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Temp Time")}
          lable={t("Time of Ruptured Membranes")}
          id="timeRupturedMembranes"
          name="timeRupturedMembranes"
          value={values?.timeRupturedMembranes}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date at Dilation")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="dilationDate"
          id="dilationDate"
          value={values?.dilationDate}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Temp Time")}
          lable={t("Time at Dilation")}
          id="dilationTime"
          name="dilationTime"
          value={values?.dilationTime}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Labour Began Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="labourBeganDate"
          id="labourBeganDate"
          value={values?.labourBeganDate}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Temp Time")}
          lable={t("Time")}
          id="time"
          name="time"
          value={values?.time}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("LMP")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="lmpDate"
          id="lmpDate"
          value={values?.lmpDate}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
        <TimePicker
          placeholderName={t("Temp Time")}
          lable={t("EDD")}
          id="edd"
          name="edd"
          value={values?.edd}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          handleChange={handleDateTimeChange}
        />
        <Input
          type="text"
          className="form-control"
          id="wksGest"
          lable={t("Wks Gest")}
          placeholder=" "
          required={true}
          value={values?.wksGest}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="wksGest"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="gravida"
          lable={t("Gravida")}
          placeholder=""
          required={true}
          value={values?.gravida}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="gravida"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="para"
          lable={t("Para")}
          placeholder=" "
          required={true}
          value={values?.para}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="para"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="amnioticFluid"
          id="amnioticFluid"
          placeholderName={t("Amniotic Fluid")}
          dynamicOptions={[
            { name: "Absent", value: "Absent" },
            { name: "Clear", value: "Clear" },
            { name: "Blood Stained", value: "Blood Stained" },
            { name: "Meconium Stained 1+", value: "Meconium Stained 1+" },
            {
              name: "Slightly Thick Meconium 2+",
              value: "Slightly Thick Meconium 2+",
            },
            { name: "Meconium Very Thick 3+", value: "Meconium Very Thick 3+" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.amnioticFluid}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="moulding"
          id="moulding"
          placeholderName={t("Moulding")}
          dynamicOptions={[
            { name: "0 Sutures Separate", value: "0 Sutures Separate" },
            { name: "1 Sutures Apposed", value: "1 Sutures Apposed" },
            {
              name: "2 Sutures Overlap But Reducible",
              value: "2 Sutures Overlap But Reducible",
            },
            {
              name: "3 Sutures Overlap Not Reducible",
              value: "3 Sutures Overlap Not Reducible",
            },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.moulding}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="oxytocin"
          lable={t("Oxytocin (Units /500ml)")}
          placeholder=" "
          required={true}
          value={values?.oxytocin}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="oxytocin"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="atDrops"
          lable={t("At")}
          placeholder=" "
          required={true}
          value={values?.atDrops}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="atDrops"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="urineProtein"
          id="urineProtein"
          placeholderName={t("Urine Protein")}
          dynamicOptions={[
            { name: "Absent", value: "Absent" },
            { name: "1+", value: "1+" },
            { name: "2+", value: "2+" },
            { name: "3+", value: "3+" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.urineProtein}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="urineVolume"
          lable={t("Urine Volume")}
          placeholder="_____mls"
          required={true}
          value={values?.urineVolume}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="urineVolume"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="urineKetones"
          id="urineKetones"
          placeholderName={t("Urine Ketones")}
          dynamicOptions={[
            { name: "Absent", value: "Absent" },
            { name: "1+", value: "1+" },
            { name: "2+", value: "2+" },
            { name: "3+", value: "3+" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.urineKetones}
          isRemoveTemplate={true}
        />
      </div>
      <div className="row p-2">
        <Input
          type="text"
          className="form-control"
          id="drugsGiven"
          lable={t("Drugs Given")}
          placeholder=" "
          required={true}
          value={values?.drugsGiven}
          respclass="col-xl-6 col-12"
          name="drugsGiven"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="fourthFluidsGiven"
          lable={t("IV Fluids Given")}
          placeholder=" "
          required={true}
          value={values?.fourthFluidsGiven}
          respclass="col-xl-6 col-12"
          name="fourthFluidsGiven"
          onChange={handleChange}
        />
      </div>
      <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2">
        {isEditMode ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-warning mr-2"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? t("Updating...") : t("Update")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={resetForm}
              disabled={isLoading}
            >
              {t("Cancel")}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-primary mr-2"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? t("Saving...") : t("Save")}
          </button>
        )}
      </div>

      {/* Table Section */}
      <Heading
        title={
          <span className="text-dark">{t("Cervix And Descent Chart With Vital")}</span>
        }
      />
      <div className="row p-2">
        <Tables
          scrollView={"scrollView"}
          thead={INPUT_TABLE_COLUMNS}
          tbody={tableData.map((row, ind) => ({
            Time: (
              <select
                className="form-control form-control-sm"
                value={row?.time || ""}
                onChange={(e) =>
                  handleTableRowChange(ind, "time", e.target.value)
                }
                disabled={isLoading}
              >
                <option value="">{t("Select Time")}</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            ),
            BP: (
              <Input
                type="text"
                className="table-input"
                removeFormGroupClass={true}
                name="bp"
                placeholder={t("BP")}
                value={row.bp}
                onChange={(e) =>
                  handleTableRowChange(ind, "bp", e.target.value)
                }
                disabled={isLoading}
              />
            ),
            FHR: (
              <Input
                type="text"
                className="table-input"
                removeFormGroupClass={true}
                name="fhr"
                placeholder={t("FHR")}
                value={row.fhr}
                onChange={(e) =>
                  handleTableRowChange(ind, "fhr", e.target.value)
                }
                disabled={isLoading}
              />
            ),
            Temp: (
              <Input
                type="text"
                className="table-input"
                removeFormGroupClass={true}
                name="temp"
                placeholder={t("Temp")}
                value={row.temp}
                onChange={(e) =>
                  handleTableRowChange(ind, "temp", e.target.value)
                }
                disabled={isLoading}
              />
            ),
            Pulse: (
              <Input
                type="text"
                className="table-input"
                removeFormGroupClass={true}
                name="pulse"
                placeholder={t("Pulse")}
                value={row.pulse}
                onChange={(e) =>
                  handleTableRowChange(ind, "pulse", e.target.value)
                }
                disabled={isLoading}
              />
            ),
            Contraction: (
              <select
                className="form-control form-control-sm"
                value={row?.contraction || ""}
                onChange={(e) =>
                  handleTableRowChange(ind, "contraction", e.target.value)
                }
                disabled={isLoading}
              >
                <option value="">{t("Select Contraction")}</option>
                {contraction.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ),
            Lasting: (
              <select
                className="form-control form-control-sm"
                value={row?.lasting || ""}
                onChange={(e) =>
                  handleTableRowChange(ind, "lasting", e.target.value)
                }
                disabled={isLoading}
              >
                <option value="">{t("Select Lasting")}</option>
                {lastingOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ),
            Cervix: (
              <select
                className="form-control form-control-sm"
                value={row?.cervix || ""}
                onChange={(e) =>
                  handleTableRowChange(ind, "cervix", e.target.value)
                }
                disabled={isLoading}
              >
                <option value="">{t("Select Cervix")}</option>
                {cervixOptions.map((cervix) => (
                  <option key={cervix} value={cervix}>
                    {cervix}
                  </option>
                ))}
              </select>
            ),
            Descent: (
              <select
                className="form-control form-control-sm"
                value={row?.descent || ""}
                onChange={(e) =>
                  handleTableRowChange(ind, "descent", e.target.value)
                }
                disabled={isLoading}
              >
                <option value="">{t("Select Descent")}</option>
                {descentOptions.map((descent) => (
                  <option key={descent} value={descent}>
                    {descent}
                  </option>
                ))}
              </select>
            ),
            "Entry By": (
              <Input
                type="text"
                className="table-input"
                removeFormGroupClass={true}
                name="entryBy"
                placeholder={t("Entry By")}
                value={row.entryBy}
                onChange={(e) =>
                  handleTableRowChange(ind, "entryBy", e.target.value)
                }
                disabled={isLoading}
              />
            ),
            Remark: (
              <Input
                type="text"
                className="table-input"
                removeFormGroupClass={true}
                name="remark"
                placeholder={t("Remark")}
                value={row.remark}
                onChange={(e) =>
                  handleTableRowChange(ind, "remark", e.target.value)
                }
                disabled={isLoading}
              />
            ),
            Action: (
              <div className="d-flex gap-1">
                {!isTableEditMode && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-success mr-2"
                      onClick={addRow}
                      title={t("Add Row")}
                      disabled={isLoading}
                    >
                      <i className="bi bi-plus-lg mt-3"></i>
                    </button>
                    {tableData.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeRow(ind)}
                        title={t("Remove Row")}
                        disabled={isLoading}
                      >
                        <i className="bi bi-dash-lg mt-3"></i>
                      </button>
                    )}
                  </>
                )}
              </div>
            ),
          }))}
        />
      </div>

      {/* Table Save/Update Buttons */}
      <div className="row p-2">
        <div className="col-xl-12 col-md-12 col-sm-12 col-12 mb-2">
          {isTableEditMode ? (
            <>
              <button
                type="button"
                className="btn btn-sm btn-warning mr-2"
                onClick={handleTableSave}
                disabled={isLoading}
              >
                {isLoading ? t("Updating...") : t("Update Table")}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={resetTableData}
                disabled={isLoading}
              >
                {t("Cancel")}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-primary mr-2"
              onClick={handleTableSave}
              disabled={isLoading}
            >
              {isLoading ? t("Saving...") : t("Save Table")}
            </button>
          )}
        </div>
      </div>

      {/* Form Results Table */}
      {savedRecords.length > 0 && (
        <div className="card mt-4">
          <div className="mt-4">
            <Heading title={<span className="text-dark">{t("Form Records")}</span>} />
            <Tables
              thead={PARTOGRAPHRESULT}
              tbody={savedRecords.map((row, index) => ({
                "Sr.No": index + 1,
                Date: row.date || row.Date || "-",
                Time: row.time || row.Time || "-",
                DDate: row.dilationDate || row.DilationDate || "-",
                DTime: row.dilationTime || row.DilationTime || "-",
                Gravida: row.gravida || row.Gravida || "-",
                Para: row.para || row.Para || "-",
                AMF: row.amf || row.AMF || "-",
                Moulding: row.moulding || row.Moulding || "-",
                OxyinML: row.oxyinML || row.OxyinML || "-",
                OxyDrops: row.oxydrops || row.Oxydrops || "-",
                "U. Protein": row.urineProtein || row.UrineProtein || "-",
                "U. Volume": row.urineVol || row.UrineVol || "-",
                "U. Ketones": row.urineKetones || row.UrineKetones || "-",
                Drugs: row.drugs || row.Drugs || "-",
                Edit: (
                  <i
                    className="bi bi-pencil-square"
                    style={{
                      cursor: "pointer",
                      color: "#007bff",
                      fontSize: "1.2rem",
                    }}
                    onClick={() => handleEdit(row)}
                    title={t("Edit Record")}
                  />
                ),
              }))}
            />
          </div>
        </div>
      )}

      {/* Table Results */}
      {savedTableRecords.length > 0 && (
        <div className="card mt-4">
          <div className="mt-4">
            <Heading title={<span className="text-dark">{t("Table Records")}</span>} />
            <Tables
              thead={TABLE_RESULT_COLUMNS}
              tbody={savedTableRecords.map((row, index) => ({
                "Sr.No": index + 1,
                Date: row.date || row.Date || "-",
                Time: row.time || row.Time || "-",
                BP: row.bp || row.BP || "-",
                Temp: row.temp || row.Temp || "-",
                Pulse: row.pulse || row.Pulse || "-",
                FHR: row.fhr || row.FHR || "-",
                Contraction: row.contraction || row.Contraction || "-",
                Lasting: row.lasting || row.Lasting || "-",
                Cervix: row.cervix || row.Cervix || "-",
                Descent: row.descent || row.Descent || "-",
                Remark: row.remark || row.Remark || "-",
                Edit: (
                  <i
                    className="bi bi-pencil-square"
                    style={{
                      cursor: "pointer",
                      color: "#007bff",
                      fontSize: "1.2rem",
                    }}
                    onClick={() => handleTableEdit(row)}
                    title={t("Edit Record")}
                  />
                ),
              }))}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Partograph;
