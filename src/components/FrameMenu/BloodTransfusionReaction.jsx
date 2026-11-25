import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import TimePicker from "../formComponent/TimePicker";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import LabeledInput from "../formComponent/LabeledInput";
import {
  saveOrUpdateBloodTransfusionReactionWorkUpApi,
  getAdverseEventsApi,
  getUndesirableEffectsApi,
  getApprovedByCenterIdApi,
  getBloodTransfusionReactionApi,
  SaveOrUpdateBloodResultsOfWorkUpApi,
} from "../../networkServices/Emergency";
import moment from "moment";
import { notify } from "../../utils/ustil2";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import Tables from "../UI/customTable";
const BloodTransfusionReaction = ({ data }) => {
  console.log(data);

  const { PatientID, Name, transactionID } = data;
  const [t] = useTranslation();
  const user = useLocalStorage("userData", "get");

  const [values, setValues] = useState({
    id: "",
    patientID: "",
    transactionID: "",
    date: new Date(), // will store combined datetime or ISO
    time: new Date(),
    symptoms: "",
    transfusionStartTime: new Date(),
    bloodStopped: "",
    stoppedBy: "",
    clinicianNotified: "",
    notifiedBy: "",
    reportedToLabBy: "",
    date1: new Date(),
    time1: new Date(),
    blood: "",
    time2: new Date(),
    urine: "",
    time3: new Date(),
    undesirableID: 0,
    adverseID: 0,
    entryBy: "",
    centreID: 0,

    clerical: "",
    serum: "",
    urineH: "",
    bili: "",
    uro: "",
    direct: "",
    abO1: "",
    abO2: "",
    abO3: "",
    rH1: "",
    rH2: "",
    rH3: "",
    major1: "",
    major2: "",
    minor1: "",
    minor2: "",
    updatedBy: "",
    condition1: "",
    technician: "",
    approvedBy: "",
    approvedBy1: "",
    dateR: new Date(),
    timeR: new Date(),
  });
  console.log(values);

  const { VITE_DATE_FORMAT } = import.meta.env;
  const [event, setEvent] = useState([]);
  const [eventEffect, setEventEffect] = useState([]);
  const [approvedBy, setApprovedBy] = useState([]);
  const [tableData, setTableData] = useState([]);
  const THEAD = [
    { name: t("S.No"), width: "1%" },
    { name: t("Symptoms"), width: "1%" },
    { name: t("Entry Date"), width: "1%" },
    { name: t("Entry Time"), width: "1%" },
    { name: t("Result Entry Date"), width: "1%" },
    { name: t("Result Entry Time"), width: "1%" },
    { name: t("Edit"), width: "1%" },
    // { name: t("Print"), width: "1%" },
  ];
  const fetchDropdownData = async () => {
    try {
      const [eventRes, effectRes, approvedByRes] = await Promise.all([
        getAdverseEventsApi(),
        getUndesirableEffectsApi(),
        getApprovedByCenterIdApi(),
      ]);

      if (eventRes?.success) {
        const eventOptions = eventRes?.data?.map((item) => ({
          label: item?.EventsName,
          value: item.ID,
        }));
        setEvent(eventOptions);
      } else notify(eventRes?.message, "error");

      if (effectRes?.success) {
        const effectOptions = effectRes?.data?.map((item) => ({
          label: item.EffectsName,
          value: item.ID,
        }));
        setEventEffect(effectOptions);
      } else notify(effectRes?.message, "error");

      if (approvedByRes?.success) {
        const formatted = approvedByRes.data?.map((item) => ({
          label: item.name,
          value: item.employeeID,
        }));
        // setApprovedBy([{
        //     label: approvedByRes?.data[0]?.name,
        //     value: approvedByRes?.data[0]?.employeeID
        // }]);
        setApprovedBy(formatted);
      } else notify(approvedByRes?.message, "error");
    } catch (err) {
      notify(t("Something went wrong while loading dropdowns"), "error");
    }
  };
  const fetchDataList = async () => {
    const res = await getBloodTransfusionReactionApi(PatientID, transactionID);
    if (res?.success) {
      setTableData(res?.data);
    } else {
      notify(res?.message, "error");
    }
  };
  console.log(tableData);

  useEffect(() => {
    fetchDropdownData();
    fetchDataList();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReactSelect = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSave = async () => {
    console.log("FINAL PAYLOAD:", values);
    const payload = {
      id: values.id || 0,
      patientID: PatientID,
      transactionID: transactionID || "",
      date: values?.date || "",
      // date: values?.date ? moment(values?.date).format("DD-MM-YYYY") : "",
      time: values.time ? moment(values?.time).format("hh:mm A") : "",
      symptoms: values.symptoms || "",
      transfusionStartTime: values.transfusionStartTime
        ? moment(values?.time).format("hh:mm A")
        : "",
      bloodStopped: values.bloodStopped || "",
      stoppedBy: values.stoppedBy || user?.empName,
      clinicianNotified: values.clinicianNotified || "",
      notifiedBy: values.notifiedBy || user?.empName || "",
      reportedToLabBy: values.reportedToLabBy || user?.empName,
      date1: values?.date1 || "",
      // date1: values?.date1 ? moment(values?.date1).format("DD-MM-YYYY") : "",
      time1: values.time1 ? moment(values?.time1).format("hh:mm A") : "",

      blood: values.blood || "",
      time2: values.time2 ? moment(values?.time2).format("hh:mm A") : "",
      urine: values.urine || "",
      time3: values.time3 ? moment(values?.time3).format("hh:mm A") : "",

      undesirableID: values.undesirableID?.value ?? values.undesirableID ?? 0,
      adverseID: values.adverseID?.value ?? values.adverseID ?? 0,
      entryBy: values.entryBy || "",
      centreID: values.centreID || 0,
    };
    console.log(payload);
    const res = await saveOrUpdateBloodTransfusionReactionWorkUpApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      fetchDataList();
    } else {
      notify(res?.message, "error");
    }
  };
  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };
  const handleUpdate = async () => {
    const getSelectValue = (val) => (val?.value ? val.value : val ?? "");
    const payload = {
      id: values?.id,
      clerical: values.clerical,
      serum: values.serum,
      urineH: getSelectValue(values.urineH),
      bili: getSelectValue(values.bili),
      uro: getSelectValue(values.uro),
      direct: getSelectValue(values.direct),
      abO1: getSelectValue(values.abO1),
      abO2: getSelectValue(values.abO2),
      abO3: getSelectValue(values.abO3),
      rH1: getSelectValue(values.rH1),
      rH2: getSelectValue(values.rH2),
      rH3: getSelectValue(values.rH3),
      major1: getSelectValue(values.major1),
      major2: getSelectValue(values.major2),
      minor1: getSelectValue(values.minor1),
      minor2: getSelectValue(values.minor2),
      updatedBy: getSelectValue(values.updatedBy),
      condition1: getSelectValue(values.condition1),
      technician: user?.empName,
      approvedBy: getSelectValue(values.updatedBy),
      approvedBy1: getSelectValue(values.approvedBy1),
      dateR: values.dateR ? parseApiDate(values.dateR) : new Date(),
      timeR: values.timeR
        ? moment(values?.timeR)?.format("hh:mm A")
        : new Date(),
      patientID: PatientID,
      transactionID: transactionID,
      centreID: values?.centreID,
      // dateTimeR: dateTime
    };
    const res = await SaveOrUpdateBloodResultsOfWorkUpApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      fetchDataList();
      setValues({
        id: "",
        patientID: "",
        transactionID: "",
        date: new Date(), // will store combined datetime or ISO
        time: new Date(),
        symptoms: "",
        transfusionStartTime: new Date(),
        bloodStopped: "",
        stoppedBy: "",
        clinicianNotified: "",
        notifiedBy: "",
        reportedToLabBy: "",
        date1: new Date(),
        time1: new Date(),
        blood: "",
        time2: new Date(),
        urine: "",
        time3: new Date(),
        undesirableID: 0,
        adverseID: 0,
        entryBy: "",
        centreID: 0,

        clerical: "",
        serum: "",
        urineH: "",
        bili: "",
        uro: "",
        direct: "",
        abO1: "",
        abO2: "",
        abO3: "",
        rH1: "",
        rH2: "",
        rH3: "",
        major1: "",
        major2: "",
        minor1: "",
        minor2: "",
        updatedBy: "",
        condition1: "",
        technician: "",
        approvedBy: "",
        approvedBy1: "",
        dateR: new Date(),
        timeR: new Date(),
      });
    } else {
      notify(res?.message, "error");
    }
    console.log(payload);
  };
  const handleEdit = (row) => {
    const timeFormateDate = (time) => {
      if (!time || typeof time !== "string") return null;

      const date = new Date();

      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        const [h, m, s] = time.split(":").map(Number);
        date.setHours(h);
        date.setMinutes(m);
        date.setSeconds(s);
        return date;
      }

      if (/^\d{2}:\d{2}$/.test(time)) {
        const [h, m] = time.split(":").map(Number);
        date.setHours(h);
        date.setMinutes(m);
        date.setSeconds(0);
        return date;
      }

      const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let [_, hh, mm, period] = match;
        hh = Number(hh);
        mm = Number(mm);
        period = period.toUpperCase();

        if (period === "PM" && hh !== 12) hh += 12;
        if (period === "AM" && hh === 12) hh = 0;

        date.setHours(hh);
        date.setMinutes(mm);
        date.setSeconds(0);
        return date;
      }
      return null;
    };
    debugger;
    setValues({
      ...values,
      ...row,
      date: row?.date ? new Date(row?.date) : "",
      date1: row?.date1 ? new Date(row?.date1) : "",
      time: timeFormateDate(row?.time),
      time1: timeFormateDate(row?.time1),
      time2: timeFormateDate(row?.time2),
      time3: timeFormateDate(row?.time3),
      bloodStopped: timeFormateDate(row?.bloodStopped),
      transfusionStartTime: timeFormateDate(row?.transfusionStartTime),
      timeR: timeFormateDate(row?.timeR),
    });
  };
  console.log(values);

  const handlePrint = () => {};

  const TRUE_FALSE_OPTIONS = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <>
          <Heading title={t("Transfusion Reaction")} isBreadcrumb={false} />

          <div className="row p-2">
            <DatePicker
              className={`custom-calendar `}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              id="Date"
              name="date"
              // inputClassName={"required-fields"}
              value={values?.date ? values?.date : new Date()}
              handleChange={handleChange}
              lable={t("Date")}
              placeholder={VITE_DATE_FORMAT}
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="time"
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              name="time"
              value={values?.time ? values?.time : new Date()}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="symptoms"
              name="symptoms"
              value={values?.symptoms ? values?.symptoms : ""}
              onChange={handleChange}
              lable={t("Symtoms Of Reaction")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=""
            />
            <TimePicker
              placeholderName={t("transfusion Start Time")}
              lable={t("transfusionStartTime")}
              id="transfusionStartTime"
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              name="transfusionStartTime"
              value={
                values?.transfusionStartTime
                  ? values?.transfusionStartTime
                  : new Date()
              }
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
            <TimePicker
              placeholderName={t("blood Stopped Time")}
              lable={t("bloodStopped")}
              id="bloodStopped"
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              name="bloodStopped"
              value={values?.bloodStopped ? values?.bloodStopped : new Date()}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
            <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
              <LabeledInput label={t("Stopped By")} value={user.empName} />
            </div>
            <ReactSelect
              placeholderName={t("undesirable Effects")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"undesirableID"}
              name="undesirableID"
              value={String(values?.undesirableID)}
              removeIsClearable={true}
              dynamicOptions={eventEffect}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("adverse Event")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"adverseID"}
              name="adverseID"
              value={String(values?.adverseID)}
              removeIsClearable={true}
              dynamicOptions={event}
              handleChange={handleReactSelect}
            />
          </div>
          <Heading
            title={t("Transfusion Reaction WorkUp")}
            isBreadcrumb={false}
          />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              id="clinicianNotified"
              name="clinicianNotified"
              value={values?.clinicianNotified ? values?.clinicianNotified : ""}
              onChange={handleChange}
              lable={t("clinician Notified")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=""
            />
            <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
              <LabeledInput label={t("By")} value={user.empName} />
            </div>
            <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
              <LabeledInput
                label={t("Reported To Lab By")}
                value={user.empName}
              />
            </div>
            <DatePicker
              className={`custom-calendar `}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              id="Date"
              name="date1"
              // inputClassName={"required-fields"}
              value={values?.date1 ? values?.date1 : new Date()}
              handleChange={handleChange}
              lable={t("Date1")}
              placeholder={VITE_DATE_FORMAT}
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="time1"
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              name="time1"
              value={values?.time1 ? values?.time1 : new Date()}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="blood"
              name="blood"
              value={values?.blood ? values?.blood : ""}
              onChange={handleChange}
              lable={t("Post Blood Sample Nurse Drawing Blood")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=""
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="time2"
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              name="time2"
              value={values?.time2 ? values?.time2 : new Date()}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="urine"
              name="urine"
              value={values?.urine ? values?.urine : ""}
              onChange={handleChange}
              lable={t("Post Urine Sample Received")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=""
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="time3"
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              name="time3"
              value={values?.time3 ? values?.time3 : new Date()}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
          </div>
          <div className="m-2">
            <button
              className="btn btn-primary ml-2"
              type="button"
              style={{ float: "right" }}
              disabled={values?.id ? true : false}
              onClick={handleSave}
            >
              {values?.id ? t("Update") : t("Save")}
            </button>
          </div>
          <Heading title={t("Results Of WorkUp")} isBreadcrumb={false} />
          <div className="row p-2">
            <DatePicker
              className={`custom-calendar `}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              id="DateR"
              name="DateR"
              // inputClassName={"required-fields"}
              value={values?.DateR ? values?.DateR : new Date()}
              handleChange={handleChange}
              lable={t("DateR")}
              placeholder={VITE_DATE_FORMAT}
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("TimeR")}
              id="timeR"
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              name="timeR"
              value={values?.timeR ? values?.timeR : new Date()}
              // value={new Date(`1970-01-01T00:00:00`)}
              handleChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              id="clerical"
              name="clerical"
              value={values?.clerical ? values?.clerical : ""}
              onChange={handleChange}
              lable={t("clerical")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=""
            />
            <Input
              type="text"
              className="form-control"
              id="serum"
              name="serum"
              value={values?.serum ? values?.serum : ""}
              onChange={handleChange}
              lable={t("serum")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=""
            />
            <ReactSelect
              placeholderName={t("Urine Heamoglobinuria")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"urineH"}
              name="urineH"
              value={String(values?.urineH)}
              removeIsClearable={true}
              dynamicOptions={TRUE_FALSE_OPTIONS}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("Bilirubenuria")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"bili"}
              name="bili"
              value={String(values?.bili)}
              removeIsClearable={true}
              dynamicOptions={TRUE_FALSE_OPTIONS}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("Urobilinogen")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"uro"}
              name="uro"
              value={values?.uro}
              removeIsClearable={true}
              dynamicOptions={TRUE_FALSE_OPTIONS}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("Direct coombs on post EDTA Sample")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"direct"}
              name="direct"
              value={values?.direct}
              removeIsClearable={true}
              dynamicOptions={[
                { label: t("Positive"), value: "1" },
                { label: t("Negative"), value: "2" },
              ]}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("Pre Sample")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"abO1"}
              name="abO1"
              value={values?.abO1}
              removeIsClearable={true}
              dynamicOptions={[
                { label: "A", value: "1" },
                { label: "B", value: "2" },
                { label: t("AB"), value: "3" },
                { label: "O", value: "4" },
              ]}
              handleChange={handleReactSelect}
            />

            <ReactSelect
              placeholderName={t("Post Sample")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"abO2"}
              name="abO2"
              value={values?.abO2}
              removeIsClearable={true}
              dynamicOptions={[
                { label: "A", value: "1" },
                { label: "B", value: "2" },
                { label: t("AB"), value: "3" },
                { label: "O", value: "4" },
              ]}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("bag")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"abO3"}
              name="abO3"
              value={values?.abO3}
              removeIsClearable={true}
              dynamicOptions={[
                { label: "A", value: "1" },
                { label: "B", value: "2" },
                { label: t("AB"), value: "3" },
                { label: "O", value: "4" },
              ]}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("RH Type")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"rH1"}
              name="rH1"
              value={values?.rH1}
              removeIsClearable={true}
              dynamicOptions={[
                { label: t("Positive"), value: "1" },
                { label: t("Negative"), value: "2" },
              ]}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("RH Type")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"rH2"}
              name="rH2"
              value={values?.rH2}
              removeIsClearable={true}
              dynamicOptions={[
                { label: t("Positive"), value: "1" },
                { label: t("Negative"), value: "2" },
              ]}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("RH Type")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"rH3"}
              name="rH3"
              value={values?.rH3}
              removeIsClearable={true}
              dynamicOptions={[
                { label: t("Positive"), value: "1" },
                { label: t("Negative"), value: "2" },
              ]}
              handleChange={handleReactSelect}
            />
            <div className="col-lg-8 col-sm-12 col-md-12">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("Cross Match")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Major")}
                    respclass="col-sm-6 col-md-4 col-lg-2 col-12"
                    id={"major1"}
                    name="major1"
                    value={values?.major1}
                    removeIsClearable={true}
                    dynamicOptions={[
                      { label: t("Compatible"), value: "1" },
                      { label: t("Not Compatible"), value: "2" },
                      { label: t("Not Done"), value: "3" },
                    ]}
                    handleChange={handleReactSelect}
                  />
                  <ReactSelect
                    placeholderName={t("Major")}
                    respclass="col-sm-6 col-md-4 col-lg-2 col-12"
                    id={"major2"}
                    name="major2"
                    value={values?.major2}
                    removeIsClearable={true}
                    dynamicOptions={[
                      { label: t("Compatible"), value: "1" },
                      { label: t("Not Compatible"), value: "2" },
                      { label: t("Not Done"), value: "3" },
                    ]}
                    handleChange={handleReactSelect}
                  />
                  <ReactSelect
                    placeholderName={t("minor")}
                    respclass="col-sm-6 col-md-4 col-lg-2 col-12"
                    id={"minor1"}
                    name="minor1"
                    value={values?.minor1}
                    removeIsClearable={true}
                    dynamicOptions={[
                      { label: t("Compatible"), value: "1" },
                      { label: t("Not Compatible"), value: "2" },
                      { label: t("Not Done"), value: "3" },
                    ]}
                    handleChange={handleReactSelect}
                  />
                  <ReactSelect
                    placeholderName={t("minor")}
                    respclass="col-sm-6 col-md-4 col-lg-2 col-12"
                    id={"minor2"}
                    name="minor2"
                    value={values?.minor2}
                    removeIsClearable={true}
                    dynamicOptions={[
                      { label: t("Compatible"), value: "1" },
                      { label: t("Not Compatible"), value: "2" },
                      { label: t("Not Done"), value: "3" },
                    ]}
                    handleChange={handleReactSelect}
                  />
                </div>
              </div>
            </div>

            <Input
              type="text"
              className="form-control"
              id="condition1"
              name="condition1"
              value={values?.condition1 ? values?.condition1 : ""}
              onChange={handleChange}
              lable={t("Condition Of Bag and blood")}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              placeholder=""
            />

            <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
              <LabeledInput
                label={t("Technician Or Technologist Signature")}
                value={user.empName}
              />
            </div>
            <label className="p-2">
              If suspitious or if physician thinks the reaction is supicous of
              bacterial contaminated blood: b. Set a Blood Culture on Bag-
              Culture results to follow
            </label>
            <ReactSelect
              placeholderName={t("Approved By")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"updatedBy"}
              name="updatedBy"
              value={values?.updatedBy}
              removeIsClearable={true}
              dynamicOptions={approvedBy}
              handleChange={handleReactSelect}
            />
            <ReactSelect
              placeholderName={t("Approved By")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id={"approvedBy1"}
              name="approvedBy1"
              value={values?.approvedBy1}
              removeIsClearable={true}
              dynamicOptions={approvedBy}
              handleChange={handleReactSelect}
            />
          </div>
          <div className="m-2">
            <button
              className="btn btn-primary ml-2"
              type="button"
              style={{ float: "right" }}
              disabled={!values?.id ? true : false}
              onClick={handleUpdate}
            >
              {values?.id ? t("Update") : t("Save")}
            </button>
          </div>
          {tableData?.length > 0 ? (
            <>
              <Heading title={t("List")} />
              <Tables
                thead={THEAD}
                tbody={tableData?.map((item, index) => ({
                  SNo: index + 1,
                  Symptoms: item?.symptoms,
                  date1: item?.date1,
                  time1: item?.time1,
                  dateR: item?.dateR,
                  timeR: item?.timeR,
                  edit: (
                    <i
                      className="fa fa-edit text-center"
                      aria-hidden="true"
                      onClick={() => {
                        handleEdit(item);
                      }}
                    ></i>
                  ),
                  // print: <div
                  //     // className='btn btn-primary'
                  //     style={{ textAlign: "center", cursor: "pointer" }}
                  //     onClick={() => handlePrint(item)}
                  // >
                  //     <ReprintSVG />
                  // </div>
                }))}
                scrollView={"scrollView"}
              />
            </>
          ) : (
            ""
          )}
        </>
      </div>
    </div>
  );
};

export default BloodTransfusionReaction;
