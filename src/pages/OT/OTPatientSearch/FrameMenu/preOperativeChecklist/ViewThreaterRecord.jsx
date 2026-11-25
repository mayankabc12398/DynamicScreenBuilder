import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../../../../../components/UI/Heading";
import ReactSelect from "../../../../../components/formComponent/ReactSelect";
import TextAreaInput from "../../../../../components/formComponent/TextAreaInput";
import TimePicker from "../../../../../components/formComponent/TimePicker";
import Input from "../../../../../components/formComponent/Input";
import { notify } from "../../../../../utils/ustil2";
import {
  GetTheatreRecordAsyncAPI,
  SaveUpdateTheatreRecordAsyncAPI,
} from "../../../../../networkServices/OT/otAPI";
import { timeFormateDate } from "../../../../../utils/utils";
import moment from "moment";

const ViewThreaterRecord = ({ data }) => {
  console.log({ data });

  const PatientID = data?.PatientID;
  const OTNumber = data?.OTNumber;
  const doctorId = data;
  const TransactionID = data?.TransactionID;
  const [t] = useTranslation();

  const initialValue = {
    id: "",
    transactionID: "",
    patientID: "",
    doctorId: "",

    ward: "",
    nurseComm: "",
    doc: "",
    cons: "",

    hb: "",
    ue: "",
    xmatch: "",

    premed: "",
    periop: "",
    reg: "",
    medname: "",
    timegiven: "",
    ismed: "",

    startBy: "",
    time2: "",
    timegiven2: "",
    fasted: "",

    allergy: "",
    nilByMounth: "",
    isNilByMounth: "",

    bath: "",
    shave: "",
    idBand: "",
    canvas: "",
    jwel: "",
    make: "",

    cont: "",
    hear: "",
    caps: "",
    den: "",
    bp: "",
    pulse: "",
    rest: "",
    cvp: "",
    temp: "",
    bladder: "",
    heart: "",
    height: "",
    weight: "",
    uran: "",
    xray: "",
    oth: "",
    allergy1: "",
    otBookingNo: "",
    comment: "",
    givenTime: "",
    txtValue: "",
    ues: "",
    hbPCV: "",
    ivf: "",
  };

  const Options = [
    { value: 0, label: t("No") },
    { value: 1, label: t("Yes") },
  ];

  const [payload, setPayload] = useState(initialValue);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;

    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const handleSelectChange = (name, option) => {
    setPayload((prev) => ({
      ...prev,
      [name]: option?.value ?? "",
    }));
  };

  const handleChangeTemp = (e, type, limit = 9999999999999) => {
    const { name, value } = e.target;

    if (type === "number" && (limit < Number(value) || isNaN(Number(value)))) {
    } else {
      setPayload((prev) => ({ ...prev, [name]: value }));
    }
  };
  console.log("aaaaaaaaaaa", moment(payload?.fasted).format("hh:mm A"));
  const handleGetBodyPartDisposalByPatient = async (TransactionID) => {
    try {
      const APIresponse = await GetTheatreRecordAsyncAPI(TransactionID);

      if (APIresponse?.data.length > 0) {
        let data = APIresponse?.data[0];
        data.fasted = timeFormateDate(payload?.fasted);
        setPayload(data);
      } else {
        setPayload(initialValue);
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleSave = async () => {
    const savePayload = {
      id: "0",
      transactionID: TransactionID,
      patientID: PatientID,
      doctorId: payload.doctorId,

      ward: payload.ward,
      nurseComm: payload.nurseComm,
      doc: payload.doc,
      cons: payload.cons,

      hb: payload.hb,
      ue: payload.ue,
      xmatch: payload.xmatch,

      premed: payload.premed,
      periop: payload.periop,
      reg: payload.reg,
      medname: payload.medname,
      timegiven: timeFormateDate(payload.timegiven),
      ismed: payload.ismed,

      startBy: payload.startBy,
      time2: timeFormateDate(payload.time2),
      timegiven2: timeFormateDate(payload.timegiven2),
      fasted: timeFormateDate(payload.fasted),

      allergy: payload.allergy,
      nilByMounth: payload.nilByMounth,
      isNilByMounth: payload.isNilByMounth,

      bath: payload.bath,
      shave: payload.shave,
      idBand: payload.idBand,
      canvas: payload.canvas,
      jwel: payload.jwel,
      make: payload.make,

      cont: payload.cont,
      hear: payload.hear,
      caps: payload.caps,
      den: payload.den,
      bp: payload.bp,
      pulse: payload.pulse,
      rest: payload.rest,
      cvp: payload.cvp,
      temp: payload.temp,
      bladder: payload.bladder,
      heart: payload.heart,
      height: payload.height,
      weight: payload.weight,
      uran: payload.uran,
      xray: payload.xray,
      oth: payload.oth,
      allergy1: payload.allergy1,
      otBookingNo: OTNumber,
      comment: payload.comment,
      givenTime: timeFormateDate(payload.givenTime),
      txtValue: payload.txtValue,
      ues: payload.ues,
      hbPCV: payload.hbPCV,
      ivf: payload.ivf,
    };
    try {
      const response = await SaveUpdateTheatreRecordAsyncAPI(savePayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload({ initialValue });
        handleGetBodyPartDisposalByPatient(TransactionID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleGetBodyPartDisposalByPatient(TransactionID);
  }, []);

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <div className="row p-2">
            <div className="col-xl-6 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Ward Checklist")}
                    id="ward"
                    name="ward"
                    value={payload?.ward}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Complete Correction Documents")}
                    id="doc"
                    name="doc"
                    value={payload?.doc}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Correct Consent")}
                    id="cons"
                    name="cons"
                    value={payload?.cons}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <div className="col-sm-4 col-12">
                    <TextAreaInput
                      lable={t("Nursing Comments")}
                      className="w-100"
                      placeholder=""
                      id="nurseComm"
                      rows={2}
                      name="nurseComm"
                      value={payload?.nurseComm}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("Blood/Result")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Hb/PCV")}
                    id="hb"
                    name="hb"
                    value={payload?.hb}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("U & E's")}
                    id="ue"
                    name="ue"
                    value={payload?.ue}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("x-Match")}
                    id="xmatch"
                    name="xmatch"
                    value={payload?.xmatch}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-6 col-sm-6 col-12 p-2">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("Medication")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Pre-Medication")}
                    id="premed"
                    name="premed"
                    value={payload?.premed}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Peri-Operative Medication")}
                    id="periop"
                    name="periop"
                    value={payload?.periop}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Regular Medication")}
                    id="reg"
                    name="reg"
                    value={payload?.reg}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("IV Fluids")}
                    id="ivf"
                    name="ivf"
                    value={payload?.ivf}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />{" "}
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time given")}
                    id="givenTime"
                    name="givenTime"
                    value={payload?.givenTime}
                    respclass="col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />
                  <div className="col-sm-4 col-12">
                    <TextAreaInput
                      lable={t("Name of Medication")}
                      className="w-100"
                      placeholder=""
                      id="medname"
                      rows={2}
                      name="medname"
                      value={payload?.medname}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>{" "}
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-6 col-sm-6 col-12 p-2">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("")}
                </label>
                <div className="row">
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time given")}
                    id="timegiven"
                    name="timegiven"
                    value={payload?.timegiven}
                    respclass="col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />
                  <ReactSelect
                    placeholderName={t("Start By")}
                    id="startBy"
                    name="startBy"
                    value={payload?.startBy}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time")}
                    id="time2"
                    name="time2"
                    value={payload?.time2}
                    respclass="col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />{" "}
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time Given")}
                    id="timegiven2"
                    name="timegiven2"
                    value={payload?.timegiven2}
                    respclass="col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />
                  {console.log("asdssdsd", payload?.fasted)}
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Fasted From(Time)")}
                    id="fasted"
                    name="fasted"
                    value={payload?.fasted}
                    respclass="col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-6 col-sm-6 col-sm-4 col-12 p-2">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("Allergies")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("NIL By Mouth")}
                    id="nilByMounth"
                    name="nilByMounth"
                    value={payload?.nilByMounth}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-md-6 col-sm-6 col-sm-4 col-12 p-2">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("Pre Operation Preparation")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Bath / Shower / Gown")}
                    id="bath"
                    name="bath"
                    value={payload?.bath}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Shave/Skin Preparation")}
                    id="shave"
                    name="shave"
                    value={payload?.shave}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("ID Band")}
                    id="idBand"
                    name="idBand"
                    value={payload?.idBand}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Patient Positioned on Canvas")}
                    id="canvas"
                    name="canvas"
                    value={payload?.canvas}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Make UP /Nail Varnish Removed")}
                    id="make"
                    name="make"
                    value={payload?.make}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("Jewellery/Valuables Removed")}
                    id="jwel"
                    name="jwel"
                    value={payload?.jwel}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12"
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-12 col-md-6 col-sm-6 col-sm-4 col-12 p-2">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("Prosthetics")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Contact Lens Removed")}
                    id="cont"
                    name="cont"
                    value={payload?.cont}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <ReactSelect
                    placeholderName={t("Hearing Aid / Limbs")}
                    id="hear"
                    name="hear"
                    value={payload?.hear}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <ReactSelect
                    placeholderName={t("Caps/ Crowns/ Bridgework Present")}
                    id="caps"
                    name="caps"
                    value={payload?.caps}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <ReactSelect
                    placeholderName={t("Dentures Removed")}
                    id="den"
                    name="den"
                    value={payload?.den}
                    dynamicOptions={Options}
                    handleChange={handleSelectChange}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <div className="col-sm-4 col-12 col-xl-2">
                    <TextAreaInput
                      lable={t("Comment")}
                      className="w-100"
                      placeholder=""
                      id="comment"
                      rows={2}
                      name="comment"
                      value={payload?.comment}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>{" "}
                </div>
              </div>
            </div>
            <div className="col-xl-12 col-md-6 col-sm-6 col-sm-4 col-12 p-2">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("NURSING OBSERVATIONS (IMMEDIATE PRE-OP)")}
                </label>
                <div className="row">
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="bp"
                    name="bp"
                    value={payload?.bp}
                    onChange={handleChange}
                    lable={t("BP")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="pulse"
                    name="pulse"
                    value={payload?.pulse}
                    onChange={handleChange}
                    lable={t("Pulse Rate")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="rest"
                    name="rest"
                    value={payload?.rest}
                    onChange={handleChange}
                    lable={t("Rest")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="cvp"
                    name="cvp"
                    value={payload?.cvp}
                    onChange={handleChange}
                    lable={t("CVP")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                  <Input
                    type="text"
                    className="form-control"
                    id="temp"
                    placeholder=" "
                    name="temp"
                    value={payload?.temp}
                    onChange={(e) => {
                      handleChangeTemp(e, "number", 100);
                    }}
                    lable={t("Temp")}
                    placeholderLabel={"0C"}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="bladder"
                    name="bladder"
                    value={payload?.bladder}
                    onChange={handleChange}
                    lable={t("Bladder Emptied")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="heart"
                    name="heart"
                    value={payload?.heart}
                    onChange={handleChange}
                    lable={t("Foe. Heart Rate")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="number"
                    className="form-control"
                    placeholder=""
                    id="height"
                    name="height"
                    value={payload?.height}
                    onChange={handleChange}
                    lable={t("Height")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="number"
                    className="form-control"
                    placeholder=""
                    id="weight"
                    name="weight"
                    value={payload?.weight}
                    onChange={handleChange}
                    lable={t("Weight in KG")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="uran"
                    name="uran"
                    value={payload?.uran}
                    onChange={handleChange}
                    lable={t("Urinalysis Done")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="xray"
                    name="xray"
                    value={payload?.xray}
                    onChange={handleChange}
                    lable={t("Xrays & Scan")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="oth"
                    name="oth"
                    value={payload?.oth}
                    onChange={handleChange}
                    lable={t("Oth. Forms Req.")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />{" "}
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="allergy"
                    name="allergy"
                    value={payload?.allergy}
                    onChange={handleChange}
                    lable={t("Allergy")}
                    respclass="col-sm-4 col-12 col-xl-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>{" "}
        <div className="p-2">
          <button
            className={`btn btn-sm ${payload?.id ? "btn-primary" : "btn-success"}`}
            onClick={handleSave}
          >
            {payload?.id ? t("Update") : t("Save")}
          </button>

          <button
            className="btn btn-sm btn-primary mx-2"
            onClick={"handlePrint"}
          >
            {t("Print")}
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewThreaterRecord;
