import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import {
  getObstetricRecordFormsApi,
  saveOrUpdateObstetricRecordFormsApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const LabourRecord = ({ data, section }) => {
  const { transactionID } = data;
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const thead = [
    { name: t("S.No."), width: "4%" },
    t("Transaction No"),
    { name: t("Patient Name") },
    t("Edit"),
    // t("Print"),
  ];

  // const handlePrint = (index, ele) => {};

  const initialState = {
    transactionID: "",
    patientID: "",
    id: "",
    date: new Date(),
    time: "",
    temp: "",
    pulse: "",
    respiration: "",
    bp: "",
    spo: "",
    colour: "",
    ph: "",
    albumin: "",
    sugar: "",
    blood: "",
    turobilinogen: "",
    leucocytes: "",
    ketones: "",
    specificGravity: "",
    clinicalapperarance: "",
    vericoseveins: "",
    oedema: "",
    mentalStatus: "",
    inspection: "",
    shape: "",
    scar: "",
    oval: "",
    hb: "",
    vdrl: "",
    elisa: "",
    bloodgroup: "",
    fundalheight: "",
    lie: "",
    presentation: "",
    position: "",
    lie1: "",
    engagement: "",
    freq: "",
    fhr: "",
    eff: "",
    soc: "",
    som: "",
    rupturedDate: new Date(),
    time1: "",
    colour1: "",
    name: "",
    informbyname: "",
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
  const parseTimeForPicker = (time) => {
    if (!time) return null;

    const [hh, mm, ss] = time.split(":").map(Number);

    const date = new Date(1970, 0, 1, hh, mm, ss || 0);

    return date;
  };
    const parseDateForPicker = (date) => {
    if (!date) return null;
    return new Date(date);
  };
  const [payload, setPayload] = useState(initialState);
  const [tableData, setTableData] = useState([]);
  const [recordId, setRecordId] = useState(0);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      if (response?.success && response?.data?.labourRecords) {
        setTableData(response.data.labourRecords);
      } else {
        setTableData([]);
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

  const handleSaveOrUpdate = async () => {
    try {
      const reqBody = {
        sectionType: section,
        labourRecord: {
          ...payload,
          id: recordId,
          patientID: data?.patientID || "",
          transactionID: data?.transactionID || "",
          date: formatDate(payload?.date),
          time: formatTime(payload?.time),
          time1: formatTime(payload?.time1),
          rupturedDate: formatDate(payload?.rupturedDate) || "",
        },
      };

      const res = await saveOrUpdateObstetricRecordFormsApi(reqBody);

      if (res?.success) {
        notify(res?.message, "success");

        await fetchList();

        setPayload(initialState);
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
      ...initialState,

      id: item?.id || "",
      transactionID: item?.transactionID || "",
      patientID: item?.patientID || "",

      date: parseDateForPicker(item?.date),
      time: parseTimeForPicker(item?.time),
      time1: parseTimeForPicker(item?.time1),
      rupturedDate: parseDateForPicker(item?.rupturedDate),

      temp: item?.temp || "",
      pulse: item?.pulse || "",
      respiration: item?.respiration || "",
      bp: item?.bp || "",
      spo: item?.spo || "",

      colour: item?.colour || "",
      ph: item?.ph || "",
      albumin: item?.albumin || "",
      sugar: item?.sugar || "",
      blood: item?.blood || "",
      turobilinogen: item?.turobilinogen || "",
      leucocytes: item?.leucocytes || "",
      ketones: item?.ketones || "",
      specificGravity: item?.specificGravity || "",

      clinicalapperarance: item?.clinicalapperarance || "",
      vericoseveins: item?.vericoseVeins || "",
      oedema: item?.oedema || "",
      mentalStatus: item?.mentalStatus || "",
      inspection: item?.inspection || "",

      shape: item?.shape || "",
      scar: item?.scar || "",
      oval: item?.oval || "",

      hb: item?.hb || "",
      vdrl: item?.vdrl || "",
      elisa: item?.elisa || "",
      bloodgroup: item?.bloodGroup || "",

      fundalheight: item?.fundalHeight || "",
      lie: item?.lie || "",
      presentation: item?.presentation || "",
      position: item?.position || "",
      lie1: item?.lie1 || "",
      engagement: item?.engagement || "",
      freq: item?.freq || "",
      fhr: item?.fhr || "",

      eff: item?.eff || "",
      soc: item?.soc || "",
      som: item?.som || "",

      colour1: item?.colour1 || "",
      name: item?.name || "",
      informbyname: item?.informByName || "",

      section: section,
    });
  };

  return (
    <>
      <div className="px-2 mt-2">
        <Heading title={t("Labour Record")} />
      </div>

      <div className="row px-2 mt-2">
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
      </div>

      <div className="px-2 mt-2">
        <Heading title={t("Clinical Observation")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="temp"
          lable={t("Temperature")}
          name="temp"
          value={payload?.temp}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="pulse"
          lable={t("Pulse")}
          name="pulse"
          value={payload?.pulse}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="respiration"
          lable={t("Respiration")}
          name="respiration"
          value={payload?.respiration}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="bp"
          lable={t("Blood Pressure")}
          name="bp"
          value={payload?.bp}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="spo"
          lable={t("SPO2")}
          name="spo"
          value={payload?.spo}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>

      {/* Urinalysis */}
      <div className="px-2 mt-2">
        <Heading title={t("Urinalysis")} />
      </div>

      <div className="row px-2 mt-2">
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
          id="specificGravity"
          lable={t("Specific Gravity")}
          name="specificGravity"
          value={payload?.specificGravity}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />

        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="ph"
          lable={t("PH")}
          name="ph"
          value={payload?.ph}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="albumin"
          lable={t("Albumin")}
          name="albumin"
          value={payload?.albumin}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="sugar"
          lable={t("Sugar")}
          name="sugar"
          value={payload?.sugar}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="blood"
          lable={t("Blood")}
          name="blood"
          value={payload?.blood}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="turobilinogen"
          lable={t("Urobilinogen")}
          name="turobilinogen"
          value={payload?.turobilinogen}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="leucocytes"
          lable={t("Leucocytes")}
          name="leucocytes"
          value={payload?.leucocytes}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="ketones"
          lable={t("Ketones")}
          name="ketones"
          value={payload?.ketones}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>

      {/* Physical Examination */}
      <div className="px-2 mt-2">
        <Heading title={t("Physical Examination")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="clinicalapperarance"
          lable={t("Clinical Appearance")}
          name="clinicalapperarance"
          value={payload?.clinicalapperarance}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="vericoseveins"
          lable={t("Varicose Veins")}
          name="vericoseveins"
          value={payload?.vericoseveins}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="oedema"
          lable={t("Oedema")}
          name="oedema"
          value={payload?.oedema}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="mentalStatus"
          lable={t("Mental Status")}
          name="mentalStatus"
          value={payload?.mentalStatus}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="inspection"
          lable={t("Inspection")}
          name="inspection"
          value={payload?.inspection}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
      </div>

      {/* Abdominal Inspection */}
      <div className="px-2 mt-2">
        <Heading title={t("Abdominal Inspection")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="shape"
          lable={t("Shape")}
          name="shape"
          value={payload?.shape}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="scar"
          lable={t("Scars")}
          name="scar"
          value={payload?.scar}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="oval"
          lable={t("Pendulous / Oval")}
          name="oval"
          value={payload?.oval}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
      </div>

      <div className="px-2 mt-2">
        <Heading title={t("Investigation Done in the Ward")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="hb"
          lable={t("HB")}
          name="hb"
          value={payload?.hb}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="vdrl"
          lable={t("VDRL")}
          name="vdrl"
          value={payload?.vdrl}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="elisa"
          lable={t("ELISA I")}
          name="elisa"
          value={payload?.elisa}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />

        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="bloodgroup"
          lable={t("Blood Group")}
          name="bloodgroup"
          value={payload?.bloodgroup}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>

      {/* Abdominal Palpation */}
      <div className="px-2 mt-2">
        <Heading title={t("Abdominal Palpation")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="fundalheight"
          lable={t("Fundal Height")}
          name="fundalheight"
          value={payload?.fundalheight}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="lie"
          lable={t("Lie")}
          name="lie"
          value={payload?.lie}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="presentation"
          lable={t("Presentation")}
          name="presentation"
          value={payload?.presentation}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="position"
          lable={t("Position")}
          name="position"
          value={payload?.position}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="presentation"
          lable={t("Presentation")}
          name="presentation"
          value={payload?.presentation}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="freq"
          lable={t("Frequency & Type of Contraction")}
          name="freq"
          value={payload?.freq}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="fhr"
          lable={t("Foetal Heart Rate")}
          name="fhr"
          value={payload?.fhr}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="engagement"
          lable={t("Engagement in relation to the brim")}
          name="enga  gement"
          value={payload?.engagement}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="lie1"
          lable={t("Lie")}
          name="lie1"
          value={payload?.lie1}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>
      <div className="px-2 mt-2">
        <Heading title={t("VAGINAL EXAMINATION")} />
      </div>

      <div className="row px-2 mt-2">
        <ReactSelect
          placeholderName={t("External Genetalia")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"eff"}
          name="eff"
          value={payload?.eff}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: t("Effaced") },
            { value: "1", label: t("Partially Effected") },
            { value: "2", label: t("Not Effected") },
          ]}
          handleChange={handleReactSelect}
        />
      </div>
      <div className="px-2 mt-2">
        <Heading title={t("CERVICAL OS DILATATION")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="soc"
          lable={t("STATE OF CERVIX")}
          name="soc"
          value={payload?.soc}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="som"
          lable={t("STATE OF MEMBRANES")}
          name="som"
          value={payload?.som}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />

        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="rupturedDate"
          id="rupturedDate"
          value={payload?.rupturedDate}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
        <TimePicker
          placeholderName=""
          lable={t("Time")}
          id="time1"
          name="time1"
          value={payload?.time1}
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="colour1"
          lable={t("COLOUR")}
          name="colour1"
          value={payload?.colour1}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>
      <div className="px-2 mt-2">
        <Heading title={t("ADMITTED BY")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="name"
          lable={t("ADMITTED BY")}
          name="name"
          value={payload?.name}
          onChange={handleChange}
          respclass="col-md-2 col-sm-4 col-12"
        />
      </div>
      <div className="px-2 mt-2">
        <Heading title={t("OBSTETRICIAN & PAEDIATRICIAN INFORMED BY")} />
      </div>

      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          placeholder=""
          id="informbyname"
          lable={t("INFORMED BY")}
          name="informbyname"
          value={payload?.informbyname}
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
        thead={thead}
        tbody={tableData.map((item, index) => ({
          "S.No.": index + 1,
          "Transaction No": item?.transactionID,
          "Patient Name": item?.patientID,
          Edit: (
            <i
              className="fa fa-edit"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => handleEdit(item)}
            />
          ),
        }))}
      />
    </>
  );
};

export default LabourRecord;
