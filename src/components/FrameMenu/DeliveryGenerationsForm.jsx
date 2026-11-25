import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import DatePicker from "../formComponent/DatePicker";
import {
  getObstetricRecordFormsApi,
  saveOrUpdateObstetricRecordFormsApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import TimePicker from "../formComponent/TimePicker";

const DeliveryGenerationsForm = ({ data, section }) => {
  const { t } = useTranslation();
  const { transactionID } = data;
  const { VITE_DATE_FORMAT } = import.meta.env;

  const Updatedthead = [
    { name: t("S.No."), width: "4%" },
    { name: t("PatientId"), width: "30%" },
    { name: t("Entryby") },
    { name: t("EntryDate") },
    { name: t("Edit"), width: "4%" },
  ];
  const tableData = [
    {
      TransactionNo: "TRN001",
      PatientId: "PID001",
    },
    {
      TransactionNo: "TRN002",
      PatientId: "PID002",
    },
  ];

  const handlePrint = (index, ele) => {};

  const initialDeliveryState = {
    transactionID: "",
    patientID: "",
    id: "",

    timebegan: "",
    dob: new Date(),
    tob: "",
    duration: "",
    mod: "",
    drugs: "",
    remarks: "",
    methodofdelivery: "",

    date: new Date(),
    time: "",
    duration2: "",

    placentaweight: "",
    eg: "",
    colour: "",
    cord: "",
    membranes: "",
    episotomy: "",
    totalbloodloss: "",

    t: "",
    p: "",
    r: "",
    bp: "",
    lochia: "",
    statusofuterus: "",

    sex: "",
    stateatbirth: "",
    apgarscore: "",
    birthweight: "",
    headcircumference: "",
    length: "",
    congenitalabnor: "",

    druggiven: "",
    pp: "",
    transferedto: "",
    transferedby: "",
  };

  const [payload, setPayload] = useState(initialDeliveryState);
  const [listData, setListData] = useState([]);
  const [recordId, setRecordId] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatTime = (time) => {
    if (!time) return "";
    if (typeof time === "string") return time;
    const d = new Date(time);
    return d.toTimeString().slice(0, 8);
  };
  const parseDateForPicker = (date) => {
    if (!date) return null;
    return new Date(date);
  };

  const parseTimeForPicker = (time) => {
    if (!time) return null;

    const [hh, mm, ss] = time.split(":").map(Number);

    const date = new Date(1970, 0, 1, hh, mm, ss || 0);

    return date;
  };

  const handleReactSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value,
    }));
  };

  const fetchList = async () => {
    try {
      const req = {
        TransactionId: transactionID,
        SectionType: section,
      };

      const response = await getObstetricRecordFormsApi(req);

      if (response?.success && response?.data?.deliveryGeneration) {
        setListData(response.data.deliveryGeneration);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);
  useEffect(() => {
    setPayload((prev) => ({
      ...prev,
      section: section,
    }));
  }, [data]);
  const resetForm = () => {
    setPayload(initialDeliveryState);
  };

  const handleSaveOrUpdate = async () => {
    try {
      const reqBody = {
        sectionType: section,

        deliveryGeneration: {
          ...payload,

          id: recordId ?? 0,
          patientID: data?.patientID || "",
          transactionID: data?.transactionID || "",
          dob: formatDate(payload?.dob) || "",
          date: formatDate(payload?.date),
          time: formatTime(payload?.time) || "",
          timebegan: formatTime(payload?.timebegan) || "",
          tob: formatTime(payload?.tob) || "",
        },
      };

      const res = await saveOrUpdateObstetricRecordFormsApi(reqBody);

      if (res?.success) {
        notify(res?.message, "sucess");
        await fetchList();
        setRecordId(0);
        resetForm();
      } else {
        notify(res?.message || "Operation failed", "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("Server error"), "error");
    }
  };

  const handleEdit = (item) => {
    setPayload({
      ...initialDeliveryState,
      ...item,

      dob: parseDateForPicker(item?.dob),
      date: parseDateForPicker(item?.date),

      time: parseTimeForPicker(item?.time),
      timebegan: parseTimeForPicker(item?.timebegan),
      tob: parseTimeForPicker(item?.tob),
    });

    setRecordId(item?.id || 0);
  };

  return (
    <>
      <div className="px-2 mt-2">
        <Heading title={t("2ND STAGE")} />
      </div>

      <div className="row px-2 mt-2">
        <TimePicker
          placeholderName=""
          lable={t("Time")}
          id="timebegan"
          name="timebegan"
          value={payload?.timebegan}
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date of Birth")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="dob"
          id="dob"
          value={payload?.dob}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />

        <TimePicker
          placeholderName=""
          lable={t("Time")}
          id="tob"
          name="tob"
          value={payload?.tob}
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
      </div>

      <div className="px-2 mt-2">
        <Heading title={t("Clinical Observation")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="duration"
          lable={t("Duration")}
          name="duration"
          value={payload?.duration}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="mod"
          lable={t("Mode Of Delivery")}
          name="mod"
          value={payload?.mod}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="drugs"
          lable={t("Drugs")}
          name="drugs"
          value={payload?.drugs}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="remarks"
          lable={t("Remarks")}
          name="remarks"
          value={payload?.remarks}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>
      <div className="px-2 mt-2">
        <Heading title={t("3RD STAGE")} />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="methodofdelivery"
          lable={t("Method of Delivery of the Placenta")}
          name="methodofdelivery"
          value={payload?.methodofdelivery}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />

        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="date"
          id="date"
          value={payload?.date}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />

        <TimePicker
          placeholderName=""
          lable={t("Time")}
          id="time"
          name="time"
          value={payload?.time}
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="duration2"
          lable={t("DURATION")}
          name="duration2"
          value={payload?.duration2}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="placentaweight"
          lable={t("PLACENTA WEIGHT")}
          name="placentaweight"
          value={payload?.placentaweight}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <ReactSelect
          placeholderName={t("External Genetalia")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="eg"
          name="eg"
          value={payload?.eg}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: t("Complete") },
            { value: "1", label: t("Rugged InComplete") },
          ]}
          handleChange={handleReactSelect}
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="colour"
          lable={t("Colour")}
          name="colour"
          value={payload?.colour}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="cord"
          lable={t("CORD")}
          name="cord"
          value={payload?.cord}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <ReactSelect
          placeholderName={t("MEMBRANES")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"membranes"}
          name="membranes"
          value={payload?.membranes}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: t("Complete") },
            { value: "1", label: t("InComplete") },
          ]}
          handleChange={handleReactSelect}
        />
        {/* <ReactSelect
          placeholderName={t("DISPOSAL")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"externalGenitalia"}
          name="externalGenitalia"
          value={payload?.externalGenitalia}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: "LAB " },
            { value: "1", label: "INCINERATOR" },
          ]}
          handleChange={handleReactSelect}
        /> */}
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="episotomy"
          lable={t("EPISOTOMY/TEAR")}
          name="episotomy"
          value={payload?.episotomy}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="totalbloodloss"
          lable={t("Total Blood Lose")}
          name="totalbloodloss"
          value={payload?.totalbloodloss}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="t"
          lable={t("Post Delivery Observations T")}
          name="t"
          value={payload?.t}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="p"
          lable={t("P")}
          name="p"
          value={payload?.p}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />

        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="r"
          lable={t("R")}
          name="r"
          value={payload?.r}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="bp"
          lable={t("BP")}
          name="bp"
          value={payload?.bp}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="lochia"
          lable={t("Lochia")}
          name="lochia"
          value={payload?.lochia}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="statusofuterus"
          lable={t("Status of Uterus")}
          name="statusofuterus"
          value={payload?.statusofuterus}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>
      <div className="px-2 mt-2">
        <Heading title={t("BABY")} />
      </div>
      <div className="row px-2 mt-2">
        <ReactSelect
          placeholderName={t("External Genetalia")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="sex"
          name="sex"
          value={payload?.sex}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: t("Male") },
            { value: "1", label: t("Female") },
            { value: "2", label: t("Other") },
          ]}
          handleChange={handleReactSelect}
        />

        <ReactSelect
          placeholderName={t("STATE AT BIRTH")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"stateatbirth"}
          name="stateatbirth"
          value={payload?.stateatbirth}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: t("ALIVE") },
            { value: "1", label: t("STILL BIRTH") },
            { value: "2", label: t("FRESH/MACERATED") },
          ]}
          handleChange={handleReactSelect}
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="apgarscore"
          lable={t("APGAR SCORE")}
          name="apgarscore"
          value={payload?.apgarscore}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="birthweight"
          lable={t("BIRTHWEIGHT")}
          name="birthweight"
          value={payload?.birthweight}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="headcircumference"
          lable={t("HEAD CIRCUMFERENCE")}
          name="headcircumference"
          value={payload?.headcircumference}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="length"
          lable={t("LENGTH")}
          name="length"
          value={payload?.length}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="congenitalabnor"
          lable={t("CONGENTITAL ABNORMALITIES")}
          name="congenitalabnor"
          value={payload?.congenitalabnor}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />

        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="druggiven"
          lable={t("DRUG GIVEN")}
          name="druggiven"
          value={payload?.druggiven}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <ReactSelect
          placeholderName={t("PAEDIATRICIAN PRESENT")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"pp"}
          name="pp"
          value={payload?.pp}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: t("Yes") },
            { value: "1", label: t("No") },
          ]}
          handleChange={handleReactSelect}
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="transferedto"
          lable={t("Transfered To")}
          name="transferedto"
          value={payload?.transferedto}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="transferedby"
          lable={t("Transfered By")}
          name="transferedby"
          value={payload?.transferedby}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>

      <div className="row">
        <div className="col-sm-12 d-flex justify-content-end mb-2 mt-2">
          <button
            className="btn btn-sm btn-success"
            onClick={handleSaveOrUpdate}
          >
            {payload?.id ? t("Update") : t("Save")}
          </button>
        </div>
      </div>
      <div className="mt-2">
        <Heading title={t("History")} />
      </div>

      <Tables
        thead={Updatedthead}
        tbody={listData.map((item, index) => ({
          SNo: index + 1,
          PatientId: item?.patientID || data?.patientID,
          Entryby: item?.entryBy || data?.entryBy,
          EntryDate: item?.entryDate || data?.entryDate,
          Edit: (
            <i
              className="fa fa-edit"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => handleEdit(item, index)}
            />
          ),
        }))}
      />
    </>
  );
};

export default DeliveryGenerationsForm;
