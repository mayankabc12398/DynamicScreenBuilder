import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import EcmoTables from "../UI/customTable/AnastheticOperativeTable/EcmoTable";
import Tables from "../UI/customTable";
import {
  bindCardioPulmonaryRasuasApi,
  getMultipleSavedDataApi,
  saveCardiopulmonaryApi,
  update_CardiopulmonaryApi,
} from "../../networkServices/nursingWardAPI";
import ReactSelect from "../formComponent/ReactSelect";
import TimePicker from "../formComponent/TimePicker";
import { notify, parseApiTime } from "../../utils/utils";

const CardioPulmonaryResuscitation = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  console.log(data);

  const { t } = useTranslation();
  // const { patientID = "", cardioResusId = 0, transactionId = 0 } = data || {};
  const PatientID = data?.patientID || data?.PatientID;
  const TransactionID = data?.transactionID || data?.TransactionID;
  const [editId, setEditId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(false);

  const tableHeadersSaved = [
    { name: t("SNo") },
    { name: t("UHID") },
    { name: t("Entered By") },
    { name: t("Entered Date") },
    { name: t("Edit") },
  ];

  const tableHeadersForm = [
    { name: t("Time"), width: "8%" },
    { name: t("Pulse Yes/No Rate") },
    { name: t("Resp Rate") },
    { name: t("BP mm Hg") },
    { name: t("S=Spontaneous B=Bagged") },
    { name: t("Compressions Y/N") },
    { name: t("Monitor Rhythm") },
    { name: t("Cardioversion Joules") },
    { name: t("Defibrilation Joules") },
    { name: t("Post Shock Pulse Yes/No") },
    { name: t("Eoinephrine(mg)") },
    { name: t("Atropine(mg)") },
    { name: t("Amodarone(mg)") },
    { name: t("Lidocaine(mg)") },
    { name: t("Other") },
    { name: t("Add") },
  ];
  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;

    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0, second = 0] = (timePart || "")
      .split(":")
      .map(Number);

    return new Date(year, month - 1, day, hour, minute, second);
  };

  const parseApiTime = (apiTime) => {
    if (!apiTime) return null;

    const cleanTime = apiTime.replace(/\.$/, "");

    const date = new Date(cleanTime);
    if (isNaN(date.getTime())) return null;

    return date;
  };

  const initialPayload = {
    department: "",
    date: new Date(),
    arrestLocation: "",
    timeOfArrest: "",
    timeCodeTeamCalled: "",
    codeTeamArrived: "",
    timeCompressionStarted: "",

    conscious: "",
    pulsePresent: "",
    breathing: "",
    intubatedBeforeCode: "",
    mechanicalVentilationBeforeCode: "",

    vf: "",
    bradycardia: "",
    notMonitored: "",
    vt: "",
    asystol: "",
    perfusingRhythm: "",

    other: "",
    intubationDuringCode: "",
    time: new Date(),
    verifyBilateralBreathSounds: "",

    ivEstablish: "",
    pheripheral: "",
    site: "",
    time_Site: new Date(),
    centeral: "",
    site_Central: "",
    time_Central: new Date(),

    n_Saline: "",
    l_Rinfers: "",
    dextrose: "",

    time_Transcuteneous: new Date(),
    time_Transvenous: new Date(),
    time_Pericardiocentesis: new Date(),
  };

  const initialRow = {
    Time: "",
    PulseRate: "",
    RespRate: "",
    SB: "",
    BP: "",
    Compression: "",
    Rhythm: "",
    Cardio: "",
    Defib: "",
    PostShock: "",
    Epi: "",
    Atrop: "",
    Amio: "",
    Lido: "",
    Other: "",
  };

  const [payload, setPayload] = useState(initialPayload);

  const [rows, setRows] = useState([initialRow]);
  const [savedTableData, setSavedTableData] = useState([]);

  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const handleRowChange = (rowIndex, field, value) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][field] = value;
    setRows(updatedRows);
  };
  const handleRowTimeChange = (rowIndex, field, value) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][field] = value ? dayjs(value).format("HH:mm") : "";
    setRows(updatedRows);
  };

  const formatTimeForApi = (date) => {
    if (!date) return null;
    return date.toISOString();
  };

  const fetchSavedData = async () => {
    try {
      const response = await bindCardioPulmonaryRasuasApi(PatientID);
      const formattedData =
        response?.data?.map((item, index) => ({
          "S.no": index + 1,
          UHID: item?.PatientId || item?.PatientId || "-",
          "Entered By": item?.EmployeeName || item?.createdBy || "-",
          "Entered Date": item?.CreatedDate || item?.CreatedDate || "-",
          Edit: (
            <i
              className="fa fa-edit p-1"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => handleEdit(item)}
            />
          ),
        })) || [];

      setSavedTableData(formattedData);
      setIsTableVisible(formattedData.length > 0);
    } catch (error) {
      console.error("Error fetching saved data:", error);
      setIsTableVisible(false);
    }
  };

  const handleEdit = async (item) => {
    const cardioResusId = item?.Id;
    setEditId(cardioResusId);

    setPayload({
      ...initialPayload,

      department: item.Department || "",
      date: parseApiDate(item.Date) || new Date(),
      arrestLocation: item.ArrestLocation || "",
      timeOfArrest: item.TimeOfArrest || "",
      timeCodeTeamCalled: item.TimeCodeTeamCalled || "",
      codeTeamArrived: item.CodeTeamArrived || "",
      timeCompressionStarted: item.TimeCompressionStarted || "",

      conscious: item.Conscious ?? "",
      pulsePresent: item.PulsePresent ?? "",
      breathing: item.Breathing ?? "",
      intubatedBeforeCode: item.IntubatedbeforeCode ?? "",
      mechanicalVentilationBeforeCode:
        item.MechanicalVentilationbeforeCode ?? "",

      vf: item.VF ?? "",
      bradycardia: item.Bradycardia ?? "",
      notMonitored: item.NotMonitored ?? "",
      vt: item.VT ?? "",
      asystol: item.Asystol ?? "",
      perfusingRhythm: item.PerfusingRhythm ?? "",

      other: item.Other || "",
      intubationDuringCode: item.IntubationDuringCode ?? "",
      time: parseApiTime(item?.Time || ""),
      verifyBilateralBreathSounds: item.VerifyBilateralBreathSounds ?? "",

      ivEstablish: item.IVEstablish ?? "",
      pheripheral: item.Pheripheral ?? "",
      site: item.Site || "",
      time_Site: parseApiTime(item?.Time_Site),
      centeral: item.Centeral ?? "",
      site_Central: item.Site_Central || "",
      time_Central: parseApiTime(item?.Time_Central),

      n_Saline: item.N_Saline ?? "",
      l_Rinfers: item.L_Rinfers ?? "",
      dextrose: item.Dextrose ?? "",

      time_Transvenous: parseApiTime(item?.TIme_Transvenous),
      time_Transcuteneous: parseApiTime(item?.Time_Transcuteneous),
      time_Pericardiocentesis: parseApiTime(item?.Time_Pericardiocentesis),
    });

    // const detailRes = await getMultipleSavedDataApi(cardioResusId);
    // if (!Array.isArray(detailRes?.data) || !detailRes.data.length) return;

    // const latestRow = detailRes.data[detailRes.data.length - 1];

    // setRows([
    //   {
    //     Time: latestRow.Time || "",
    //     PulseRate: latestRow.Pulse || "",
    //     RespRate: latestRow.RespRate || "",
    //     SB: latestRow.SB || "",
    //     BP: latestRow.BP || "",
    //     Compression: latestRow.Compressions || "",
    //     Rhythm: latestRow.MonitorRhythms || "",
    //     Cardio: latestRow.CardioversionJoules || "",
    //     Defib: latestRow.Defibrilation || "",
    //     PostShock: latestRow.PostShockPulse || "",
    //     Epi: latestRow.Eoinephrine || "",
    //     Atrop: latestRow.Atropine || "",
    //     Amio: latestRow.Amodarone || "",
    //     Lido: latestRow.Lidocaine || "",
    //     Other: latestRow.Other || "",
    //   },
    // ]);

    const detailRes = await getMultipleSavedDataApi(cardioResusId);
    debugger;
    if (!Array.isArray(detailRes?.data) || detailRes.data.length === 0) {
      setRows([initialRow]);
      return;
    }

    const mappedRows = detailRes?.data?.map((x) => ({
      Id: x.Id,
      Time: x.Time || "",
      PulseRate: x.Pulse || "",
      RespRate: x.RespRate || "",
      SB: x.SB || "",
      BP: x.BP || "",
      Compression: x.Compressions || "",
      Rhythm: x.MonitorRhythms || "",
      Cardio: x.CardioversionJoules || "",
      Defib: x.Defibrilation || "",
      PostShock: x.PostShockPulse || "",
      Epi: x.Eoinephrine || "",
      Atrop: x.Atropine || "",
      Amio: x.Amodarone || "",
      Lido: x.Lidocaine || "",
      Other: x.Other || "",
    }));
    setRows(mappedRows);
  };

  const mapFormToSavePayload = () => ({
    cardioResObj: [
      {
        Id: editId || 0,
        PatientId: PatientID,
        TransactionId: TransactionID,

        ArrestLocation: payload?.arrestLocation,
        Department: payload?.department,
        Date: payload?.date,
        TimeOfArrest: payload?.timeOfArrest,
        TimeCodeTeamCalled: payload?.timeCodeTeamCalled,
        CodeTeamArrived: payload.codeTeamArrived,
        TimeCompressionStarted: payload.timeCompressionStarted,

        Conscious: Number(payload?.conscious || 0),
        PulsePresent: Number(payload?.pulsePresent || 0),
        Breathing: Number(payload?.breathing || 0),
        IntubatedbeforeCode: Number(payload?.intubatedBeforeCode || 0),
        MechanicalVentilationbeforeCode: Number(
          payload?.mechanicalVentilationBeforeCode || 0,
        ),
        VF: Number(payload?.vf || 0),
        Bradycardia: Number(payload?.bradycardia || 0),
        NotMonitored: Number(payload?.notMonitored || 0),
        VT: Number(payload?.vt || 0),
        Asystol: Number(payload?.asystol || 0),
        PerfusingRhythm: Number(payload?.perfusingRhythm || 0),

        Other: payload.other,
        IntubationDuringCode: Number(payload?.intubationDuringCode || 0),
        Time: payload.time,
        VerifyBilateralBreathSounds: Number(
          payload?.verifyBilateralBreathSounds || 0,
        ),
        IVEstablish: Number(payload?.ivEstablish || 0),
        Pheripheral: Number(payload?.pheripheral || 0),
        Site: payload.site,
        Time_Site: formatTimeForApi(payload?.time_Site),
        Centeral: Number(payload?.centeral || 0),
        Site_Central: payload?.site_Central,
        Time_Central: formatTimeForApi(payload?.time_Central),

        N_Saline: Number(payload?.n_Saline || 0),
        L_Rinfers: Number(payload?.l_Rinfers || 0),
        Dextrose: Number(payload?.dextrose || 0),

        Time_Transcuteneous: formatTimeForApi(payload?.time_Transcuteneous),
        Time_Transvenous: formatTimeForApi(payload?.time_Transvenous),
        Time_Pericardiocentesis: formatTimeForApi(
          payload?.time_Pericardiocentesis,
        ),

        CreatedBy: "USER",
      },
    ],

    multipleData: rows.map((r) => ({
      PatientId: PatientID,
      Id: r.Id,
      Cardiopulmonary_ResuscitationID: editId || 0,
      Time: r.Time,
      Pulse: r.PulseRate,
      Resp: r.RespRate,
      SB: r.SB,
      BP: r.BP,
      Compressions: r.Compression,
      MonitorRhytms: r.Rhythm,
      Cardioversion: r.Cardio,
      Defibrilation: r.Defib,
      PostShock: r.PostShock,
      Eoinephrine: r.Epi,
      Atropine: r.Atrop,
      Amodarone: r.Amio,
      Lidocaine: r.Lido,
      Other: r.Other,
      CreatedBy: "USER",
    })),
  });

  const rowsIds = rows.map((item) => item.Id);
console.log(rowsIds,"roewwqqw");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadData = mapFormToSavePayload();

      const res = editId
        ? await update_CardiopulmonaryApi(payloadData)
        : await saveCardiopulmonaryApi(payloadData);

      if (res?.success) {
        notify(editId ? "Updated successfully" : "Saved successfully");
        fetchSavedData();

        setPayload(initialPayload);
        setRows([initialRow]);
        setEditId(null);
      }
    } catch (err) {
      console.error(err);
      notify(t("Save failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const formatTableData = () =>
    rows?.map((row, index) => ({
      [t("Time")]: (
        <TimePicker
          id="Time"
          value={row.Time || new Date()}
          onChange={(value) => handleRowTimeChange(index, "Time", value)}
          respclass=""
          disable={true}
        />
      ),
      [t("Pulse Yes/No Rate")]: (
        <Input
          className="form-control form-control-sm"
          value={row?.PulseRate}
          onChange={(e) => handleRowChange(index, "PulseRate", e.target.value)}
        />
      ),
      [t("BP mm Hg")]: (
        <Input
          className="form-control form-control-sm"
          value={row.SB}
          onChange={(e) => handleRowChange(index, "SB", e.target.value)}
        />
      ),
      [t("Resp Rate")]: (
        <Input
          className="form-control form-control-sm"
          value={row.RespRate}
          onChange={(e) => handleRowChange(index, "RespRate", e.target.value)}
        />
      ),
      [t("S=Spontaneous B=Bagged")]: (
        <Input
          className="form-control form-control-sm"
          value={row.BP}
          onChange={(e) => handleRowChange(index, "BP", e.target.value)}
        />
      ),
      [t("Compressions Y/N")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Compression}
          onChange={(e) =>
            handleRowChange(index, "Compression", e.target.value)
          }
        />
      ),
      [t("Monitor Rhythm")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Rhythm}
          onChange={(e) => handleRowChange(index, "Rhythm", e.target.value)}
        />
      ),
      [t("Cardioversion Joules")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Cardio}
          onChange={(e) => handleRowChange(index, "Cardio", e.target.value)}
        />
      ),
      [t("Defibrilation Joules")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Defib}
          onChange={(e) => handleRowChange(index, "Defib", e.target.value)}
        />
      ),
      [t("Post Shock Pulse Yes/No")]: (
        <Input
          className="form-control form-control-sm"
          value={row.PostShock}
          onChange={(e) => handleRowChange(index, "PostShock", e.target.value)}
        />
      ),

      [t("Eoinephrine(mg)")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Epi}
          onChange={(e) => handleRowChange(index, "Epi", e.target.value)}
        />
      ),
      [t("Atropine(mg)")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Atrop}
          onChange={(e) => handleRowChange(index, "Atrop", e.target.value)}
        />
      ),
      [t("Amodarone(mg)")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Amio}
          onChange={(e) => handleRowChange(index, "Amio", e.target.value)}
        />
      ),
      [t("Lidocaine(mg)")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Lido}
          onChange={(e) => handleRowChange(index, "Lido", e.target.value)}
        />
      ),
      [t("Other")]: (
        <Input
          className="form-control form-control-sm"
          value={row.Other}
          onChange={(e) => handleRowChange(index, "Other", e.target.value)}
        />
      ),
      [t("Add")]: (
        <>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setRows((prev) => [...prev, initialRow])}
          >
            +
          </button>

          {editId || "ddd" ? (
            ""
          ) : (
            <button
              className="btn btn-sm btn-danger mx-1"
              disabled={rows.length === 1}
              onClick={() =>
                setRows((prev) => prev.filter((_, i) => i !== index))
              }
            >
              -
            </button>
          )}
        </>
      ),
    }));

  useEffect(() => {
    fetchSavedData();
  }, []);

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          {/* <Heading title={t("Cardiopulmonary Resuscitation")} /> */}

          <div className="p-2">
            <Heading title={t("Cardiopulmonary Resuscitation")} />

            <div className="row mt-2">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("arrestLocation")}
                  id="arrestLocation"
                  name="arrestLocation"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.arrestLocation}
                  handleChange={handleSelect}
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Department")}
                  name="department"
                  id="department"
                  placeholder=" "
                  onChange={handleChange}
                  value={payload.department}
                  respclass="col-12"
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <DatePicker
                  placeholder={VITE_DATE_FORMAT}
                  className="custom-calendar"
                  lable={t("Date")}
                  name="date"
                  value={payload?.date}
                  showTime
                  hourFormat="12"
                  handleChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Time Of Arrest")}
                  name="timeOfArrest"
                  id="timeOfArrest"
                  placeholder=""
                  value={payload.timeOfArrest}
                  onChange={handleChange}
                  respclass="col-12"
                />
              </div>
            </div>
            <Heading title={t("Response Times")} />
            <div className="row mt-2">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Time Code Team Called")}
                  name="timeCodeTeamCalled"
                  id="timeCodeTeamCalled"
                  placeholder=""
                  value={payload.timeCodeTeamCalled}
                  onChange={handleChange}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Code Team Arrived")}
                  name="codeTeamArrived"
                  id="codeTeamArrived"
                  placeholder=""
                  value={payload.codeTeamArrived}
                  onChange={handleChange}
                  respclass="row-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Time Compressions Satrted")}
                  name="timeCompressionStarted"
                  id="timeCompressionStarted"
                  placeholder=""
                  value={payload.timeCompressionStarted}
                  onChange={handleChange}
                  respclass="row-12"
                />
              </div>
            </div>
            <Heading title={t("Status when Code Called")} />
            <div className="row mt-2">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("conscious")}
                  id="conscious"
                  name="conscious"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.conscious}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Pulse Present")}
                  id="pulsePresent"
                  name="pulsePresent"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.pulsePresent}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Breathing")}
                  id="breathing"
                  name="breathing"
                  searchable={true}
                  respclass="row-12"
                  dynamicOptions={yesNoOptions}
                  value={payload?.breathing}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Intubated before Code")}
                  id="intubatedBeforeCode"
                  name="intubatedBeforeCode"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.intubatedBeforeCode}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Mechanical Ventilation before Code")}
                  id="mechanicalVentilationBeforeCode"
                  name="mechanicalVentilationBeforeCode"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.mechanicalVentilationBeforeCode}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("VF")}
                  id="vf"
                  name="vf"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.vf}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Bradycardia")}
                  id="bradycardia"
                  name="bradycardia"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.bradycardia}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Not Monitored")}
                  id="notMonitored"
                  name="notMonitored"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.notMonitored}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Vt")}
                  id="vt"
                  name="vt"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.vt}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Asystol")}
                  id="asystol"
                  name="asystol"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.asystol}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Perfusing Rhythm")}
                  id="perfusingRhythm"
                  name="perfusingRhythm"
                  removeIsClearable={true}
                  searchable={true}
                  respclass="row-12"
                  dynamicOptions={yesNoOptions}
                  value={payload?.perfusingRhythm}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Other")}
                  name="other"
                  id="other"
                  placeholder=""
                  value={payload.other}
                  onChange={handleChange}
                  respclass="row-12"
                />
              </div>
            </div>
            <Heading title={t("Procedures (Time/Describe")} />
            <div className="row mt-2">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("INTUBATION DURING CODE")}
                  id="intubationDuringCode"
                  name="intubationDuringCode"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.intubationDuringCode}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-3 col-sm-6 col-12 mb-2">
                <TimePicker
                  placeholderName={t("Time")}
                  lable={t("Time")}
                  id="time"
                  name="time"
                  value={payload?.time || ""}
                  handleChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("VERIFY BILATERAL BREATH SOUNDS")}
                  id="verifyBilateralBreathSounds"
                  name="verifyBilateralBreathSounds"
                  searchable={true}
                  respclass="row-12"
                  dynamicOptions={yesNoOptions}
                  removeIsClearable={true}
                  value={payload?.verifyBilateralBreathSounds}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("IV ESTABLISHED")}
                  id="ivEstablish"
                  name="ivEstablish"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.ivEstablish}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Pheripheral")}
                  id="pheripheral"
                  name="pheripheral"
                  removeIsClearable={true}
                  searchable={true}
                  respclass="row-12"
                  dynamicOptions={yesNoOptions}
                  value={payload?.pheripheral}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Pheripheral Site")}
                  name="site"
                  id="site"
                  placeholder=""
                  value={payload.site}
                  onChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-3 col-sm-6 col-12 mb-2">
                <TimePicker
                  placeholderName=""
                  lable={t("Pheripheral Time")}
                  id="time_Central"
                  name="time_Central"
                  value={payload?.time_Central || ""}
                  handleChange={handleChange}
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t(" Centeral")}
                  id="centeral"
                  name="centeral"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.centeral}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Site Central")}
                  name="site_Central"
                  id="site_Central"
                  placeholder=""
                  value={payload.site_Central}
                  onChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-3 col-sm-6 col-12 mb-2">
                <TimePicker
                  placeholderName={t("Time")}
                  lable={t("Time Site")}
                  id="time_Site"
                  name="time_Site"
                  value={payload?.time_Site || ""}
                  handleChange={handleChange}
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t("Saline")}
                  id="n_Saline"
                  name="n_Saline"
                  searchable={true}
                  removeIsClearable={true}
                  respclass="row-12"
                  dynamicOptions={yesNoOptions}
                  value={payload?.n_Saline}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t(" L Ringers")}
                  id="l_Rinfers"
                  name="l_Rinfers"
                  searchable={true}
                  respclass="row-12"
                  removeIsClearable={true}
                  dynamicOptions={yesNoOptions}
                  value={payload?.l_Rinfers}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  placeholderName={t(" Dextrose 5%w")}
                  id="dextrose"
                  name="dextrose"
                  searchable={true}
                  removeIsClearable={true}
                  respclass="row-12"
                  dynamicOptions={yesNoOptions}
                  value={payload?.dextrose}
                  handleChange={handleSelect}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <TimePicker
                  placeholderName={t("Time")}
                  lable={t("Transcuteneousme")}
                  id="time_Transcuteneous"
                  name="time_Transcuteneous"
                  value={payload?.time_Transcuteneous || ""}
                  handleChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-3 col-sm-6 col-12 mb-2">
                <TimePicker
                  placeholderName={t("Time")}
                  lable={t("Transvenous")}
                  id="time_Transvenous"
                  name="time_Transvenous"
                  value={payload?.time_Transvenous || ""}
                  handleChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-3 col-sm-6 col-12 mb-2">
                <TimePicker
                  placeholderName={t("Time")}
                  lable={t("Pericardiocentesis")}
                  id="time_Pericardiocentesis"
                  name="time_Pericardiocentesis"
                  value={payload?.time_Pericardiocentesis || ""}
                  handleChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
        <EcmoTables
          thead={tableHeadersForm}
          tbody={formatTableData()}
          scrollView={"scrollView"}
        />

        <div className="row mt-3">
          <div className="col-12 d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t("Saving...") : editId ? t("Update") : t("Save")}
            </button>
          </div>
        </div>

        {isTableVisible && (
          <div className="mt-3">
            <Tables
              thead={tableHeadersSaved}
              tbody={savedTableData}
              tableHeight={"tableHeight"}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default CardioPulmonaryResuscitation;
