import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../../components/formComponent/DatePicker";
import Input from "../../../../components/formComponent/Input";
import Heading from "../../../../components/UI/Heading";
import TimePicker from "../../../../components/formComponent/TimePicker";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import TextAreaInput from "../../../../components/formComponent/TextAreaInput";
import {
  BindEmployeeTransferDesigantionAPI,
  GetBindNurseAPI,
  GetHandOverGivenByTIdAPI,
  GetImmediateRecoveryCareListAPI,
  SaveOrUpdateImmediateRecoveryCareAPI,
} from "../../../../networkServices/OT/otAPI";
import { notify } from "../../../../utils/ustil2";
import Tables from "../../../../components/UI/customTable";
import { ReprintSVG } from "../../../../components/SvgIcons";
import moment from "moment";
import { timeFormateDate } from "../../../../utils/utils";

const RecoveryCheckForm = ({ data, noHead }) => {
  const PatientID = data?.PatientID;
  const Transaction_Id = data?.TransactionID;
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();

  const initialState = {
    id: "",
    handOverGivenBy: "",
    patientPossition: "",
    airway15: "",
    airway30: "",
    airway45: "",
    airway60: "",
    airway75: "",
    airway90: "",
    twoLMin15: "",
    twoLMin30: "",
    twoLMin45: "",
    twoLMin60: "",
    twoLMin75: "",
    twoLMin90: "",
    resP15: "",
    resP30: "",
    resP45: "",
    resP60: "",
    resP75: "",
    resP90: "",
    pulsE15: "",
    pulsE30: "",
    pulsE45: "",
    pulsE60: "",
    pulsE75: "",
    pulsE90: "",
    temP15: "",
    temP30: "",
    temP45: "",
    temP60: "",
    temP75: "",
    temP90: "",
    bP15: "",
    bP30: "",
    bP45: "",
    bP60: "",
    bP75: "",
    bP90: "",
    saT15: "",
    saT30: "",
    saT45: "",
    saT60: "",
    saT75: "",
    saT90: "",
    loC15: "",
    loC30: "",
    loC45: "",
    loC60: "",
    loC75: "",
    loC90: "",
    headLift15: "",
    headLift30: "",
    headLift45: "",
    headLift60: "",
    headLift75: "",
    headLift90: "",
    limb15: "",
    limb30: "",
    limb45: "",
    limb60: "",
    limb75: "",
    limb90: "",
    airwayETT: "",
    woundDressing: "",
    bleeding: "",
    woundPack: "",
    drains: "",
    implant: "",
    xray: "",
    patientID: "",
    transactionID: "",
    nauseaVomitingScore: "",
    painScore: "",
    medicineforNauseaVomitingGiven: "",
    specify: "",
    time: "",
    ivFluidsRegime: "",
    amount: 0,
    mls: 0,
    outputUrinemls: 0,
    drain1: 0,
    other: 0,
    totalOutputmls: 0,
    totalOutput: 0,
    drugs: "",
    specimen: "",
    takenTo: "",
    by: "",
    skinIntegrity: "",
    recommendedPosition: "",
    transferByName: "",
    recievingNurseName: "",
    recoveryDisignationand: "",
    wardDisignationand: "",
    rtime: "",
    transferredto: "",
    analgesiaGiven: "",
    specify2: "",
    time2: "",
    EntryBy1: "",
    EntryDate1: "",
  };

  const THEAD = [t("S.No"), t("Entry By"), t("EntryDate"), t("Edit"), 
    // "Print"
  ];

  const Options = [
    { value: "No", label: t("No") },
    { value: "Yes", label: t("Yes") },
    { value: "NA", label: "N/A" },
  ];

  const date = new Date();
  const Time = new Date();

  const [payload, setPayload] = useState({ ...initialState });
  const [nurse, setNurse] = useState([]);
  const [designation, setDesignation] = useState([]);
  const [handeOverTo, setHandeOverTo] = useState([]);
  console.log(handeOverTo);

  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    setPayload((prev) => {
      const updatedValue = type === "checkbox" ? (checked ? 1 : 0) : value;

      return {
        ...prev,
        [name]: updatedValue,

        ...(name === "outputUrinemls" && {
          totalOutputmls: updatedValue,
        }),

        ...(name === "drain1" && {
          totalOutput: +updatedValue + (+prev.other || 0),
        }),

        ...(name === "other" && {
          totalOutput: (+prev.drain1 || 0) + +updatedValue,
        }),
      };
    });
  };

  const rowsConfig = [
    {
      label: t("Airway"),
      prefix: "airway",
      selectLabel: "Airway ETT Removed",
      selectName: "airwayETT",
    },
    {
      label: t("2 L/min"),
      prefix: "twoLMin",
      selectLabel: "Wound dressing Checked",
      selectName: "woundDressing",
    },
    {
      label: t("RESP"),
      prefix: "resP",
      selectLabel: "Bleeding",
      selectName: "bleeding",
    },
    {
      label: t("PULSE"),
      prefix: "pulsE",
      selectLabel: "Wound Packs removed",
      selectName: "woundPack",
    },
    {
      label: t("TEMP"),
      prefix: "temP",
      selectLabel: "Drains present",
      selectName: "drains",
    },
    {
      label: "B.P.",
      prefix: "bP",
      selectLabel: "Implants present",
      selectName: "implant",
    },
    {
      label: t("SAT/COLOR"),
      prefix: "saT",
      selectLabel: "X-Ray present",
      selectName: "xray",
    },
    { label: t("LOC"), prefix: "loC", selectLabel: null },
    { label: t("HeadLift"), prefix: "headLift", selectLabel: null },
    { label: t("Limb Obs"), prefix: "limb", selectLabel: null },
  ];

  const timeSlots = ["15", "30", "45", "60", "75", "90"];

  const handleSelectChange = (name, option) => {
    setPayload((prev) => ({
      ...prev,
      [name]: option?.value ?? "",
    }));
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;

    setPayload({
      ...payload,
      [name]: value,
    });
  };

  // edit work
  const handleEdit = async (row) => {
    try {
      setPayload({
        id: row?.id || "",
        handOverGivenBy: row?.handOverGivenBy || "",
        patientPossition: row?.patientPossition || "",

        airway15: row?.airway15 || "",
        airway30: row?.airway30 || "",
        airway45: row?.airway45 || "",
        airway60: row?.airway60 || "",
        airway75: row?.airway75 || "",
        airway90: row?.airway90 || "",

        twoLMin15: row?.twoLMin15 || "",
        twoLMin30: row?.twoLMin30 || "",
        twoLMin45: row?.twoLMin45 || "",
        twoLMin60: row?.twoLMin60 || "",
        twoLMin75: row?.twoLMin75 || "",
        twoLMin90: row?.twoLMin90 || "",

        resP15: row?.resP15 || "",
        resP30: row?.resP30 || "",
        resP45: row?.resP45 || "",
        resP60: row?.resP60 || "",
        resP75: row?.resP75 || "",
        resP90: row?.resP90 || "",

        pulsE15: row?.pulsE15 || "",
        pulsE30: row?.pulsE30 || "",
        pulsE45: row?.pulsE45 || "",
        pulsE60: row?.pulsE60 || "",
        pulsE75: row?.pulsE75 || "",
        pulsE90: row?.pulsE90 || "",

        temP15: row?.temP15 || "",
        temP30: row?.temP30 || "",
        temP45: row?.temP45 || "",
        temP60: row?.temP60 || "",
        temP75: row?.temP75 || "",
        temP90: row?.temP90 || "",

        bP15: row?.bP15 || "",
        bP30: row?.bP30 || "",
        bP45: row?.bP45 || "",
        bP60: row?.bP60 || "",
        bP75: row?.bP75 || "",
        bP90: row?.bP90 || "",

        saT15: row?.saT15 || "",
        saT30: row?.saT30 || "",
        saT45: row?.saT45 || "",
        saT60: row?.saT60 || "",
        saT75: row?.saT75 || "",
        saT90: row?.saT90 || "",

        loC15: row?.loC15 || "",
        loC30: row?.loC30 || "",
        loC45: row?.loC45 || "",
        loC60: row?.loC60 || "",
        loC75: row?.loC75 || "",
        loC90: row?.loC90 || "",

        headLift15: row?.headLift15 || "",
        headLift30: row?.headLift30 || "",
        headLift45: row?.headLift45 || "",
        headLift60: row?.headLift60 || "",
        headLift75: row?.headLift75 || "",
        headLift90: row?.headLift90 || "",

        limb15: row?.limb15 || "",
        limb30: row?.limb30 || "",
        limb45: row?.limb45 || "",
        limb60: row?.limb60 || "",
        limb75: row?.limb75 || "",
        limb90: row?.limb90 || "",

        airwayETT: row?.airwayETT || "",
        woundDressing: row?.woundDressing || "",
        bleeding: row?.bleeding || "",
        woundPack: row?.woundPack || "",
        drains: row?.drains || "",
        implant: row?.implant || "",
        xray: row?.xray || "",

        patientID: row?.patientID || "",
        transactionID: row?.transactionID || "",

        nauseaVomitingScore: row?.nauseaVomitingScore || "",
        painScore: row?.painScore || "",
        medicineforNauseaVomitingGiven:
          row?.medicineforNauseaVomitingGiven || "",
        specify: row?.specify || "",
        time: row?.time || "",
        // rtime: payload.rtime ? moment(payload.rtime).format("hh:mm A") : "",

        ivFluidsRegime: row?.ivFluidsRegime || "",

        amount: row?.amount || 0,
        mls: row?.mls || 0,
        outputUrinemls: row?.outputUrinemls || 0,
        drain1: row?.drain1 || 0,
        other: row?.other || 0,
        totalOutputmls: row?.totalOutputmls || 0,
        totalOutput: row?.totalOutput || 0,

        drugs: row?.drugs || "",
        specimen: row?.specimen || "",
        takenTo: row?.takenTo || "",
        by: row?.by || "",
        skinIntegrity: row?.skinIntegrity || "",
        recommendedPosition: row?.recommendedPosition || "",
        transferByName: row?.transferByName || "",
        recievingNurseName: row?.recievingNurseName || "",
        recoveryDisignationand: row?.recoveryDisignationand || "",
        wardDisignationand: row?.wardDisignationand || "",
        rtime: timeFormateDate(row?.rtime) || "",
        transferredto: row?.transferredto || "",
        analgesiaGiven: row?.analgesiaGiven || "",
        specify2: row?.specify2 || "",
        time2: row?.time2 || "",
        EntryDate1: row?.EntryDate1 || "",
        EntryBy1: row?.EntryBy1 || "",
      });
    } catch (error) {
      console.log("Error loading edit data:", error);
    }
  };

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const { entryBy1, entryDate1 } = items;
      return {
        SNO: index + 1,
        entryBy1,
        entryDate1,
        Edit: (
          <i className="fa fa-edit p-1" onClick={() => handleEdit(items)} />
        ),
        // print: (
        //   <div onClick={handlePrint}>
        //     <ReprintSVG />
        //   </div>
        // ),
      };
    });
  };

  useEffect(() => {
    const fetchnurse = async () => {
      try {
        const res = await GetBindNurseAPI();
        const formatedData = res?.data.map((items) => ({
          value: items.EmployeeId,
          label: items.EmpName,
        }));

        setNurse(formatedData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchnurse();
  }, []);

  useEffect(() => {
    const Desigantion = async () => {
      try {
        const res = await BindEmployeeTransferDesigantionAPI();
        console.log({ res });

        const formatedData = res?.data.map((items) => ({
          value: items.EmployeeID,
          label: items.DeptName,
        }));

        setDesignation(formatedData);
      } catch (error) {
        console.log(error);
      }
    };
    Desigantion();
  }, []);

  const handleGetBodyPartDisposalByPatient = async (PatientID) => {
    try {
      const APIresponse = await GetImmediateRecoveryCareListAPI(PatientID);

      if (APIresponse?.data?.length > 0) {
        setTableData(APIresponse?.data);
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleHandOverGivenByTId = async (Transaction_Id) => {
    try {
      const APIresponse = await GetHandOverGivenByTIdAPI(Transaction_Id);
      console.log({ APIresponse });
      if (APIresponse?.data?.length > 0) {
        setHandeOverTo(APIresponse.data[0].Ename || "");
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handlesave = async () => {
    const savePayload = {
      id: payload.id,
      handOverGivenBy: payload.handOverGivenBy,
      patientPossition: payload.patientPossition,

      airway15: payload.airway15,
      airway30: payload.airway30,
      airway45: payload.airway45,
      airway60: payload.airway60,
      airway75: payload.airway75,
      airway90: payload.airway90,

      twoLMin15: payload.twoLMin15,
      twoLMin30: payload.twoLMin30,
      twoLMin45: payload.twoLMin45,
      twoLMin60: payload.twoLMin60,
      twoLMin75: payload.twoLMin75,
      twoLMin90: payload.twoLMin90,

      resP15: payload.resP15,
      resP30: payload.resP30,
      resP45: payload.resP45,
      resP60: payload.resP60,
      resP75: payload.resP75,
      resP90: payload.resP90,

      pulsE15: payload.pulsE15,
      pulsE30: payload.pulsE30,
      pulsE45: payload.pulsE45,
      pulsE60: payload.pulsE60,
      pulsE75: payload.pulsE75,
      pulsE90: payload.pulsE90,

      temP15: payload.temP15,
      temP30: payload.temP30,
      temP45: payload.temP45,
      temP60: payload.temP60,
      temP75: payload.temP75,
      temP90: payload.temP90,

      bP15: payload.bP15,
      bP30: payload.bP30,
      bP45: payload.bP45,
      bP60: payload.bP60,
      bP75: payload.bP75,
      bP90: payload.bP90,

      saT15: payload.saT15,
      saT30: payload.saT30,
      saT45: payload.saT45,
      saT60: payload.saT60,
      saT75: payload.saT75,
      saT90: payload.saT90,

      loC15: payload.loC15,
      loC30: payload.loC30,
      loC45: payload.loC45,
      loC60: payload.loC60,
      loC75: payload.loC75,
      loC90: payload.loC90,

      headLift15: payload.headLift15,
      headLift30: payload.headLift30,
      headLift45: payload.headLift45,
      headLift60: payload.headLift60,
      headLift75: payload.headLift75,
      headLift90: payload.headLift90,

      limb15: payload.limb15,
      limb30: payload.limb30,
      limb45: payload.limb45,
      limb60: payload.limb60,
      limb75: payload.limb75,
      limb90: payload.limb90,

      airwayETT: payload.airwayETT,
      woundDressing: payload.woundDressing,
      bleeding: payload.bleeding,
      woundPack: payload.woundPack,
      drains: payload.drains,
      implant: payload.implant,
      xray: payload.xray,

      PatientID: PatientID,
      transactionID: Transaction_Id,

      nauseaVomitingScore: payload.nauseaVomitingScore,
      painScore: payload.painScore,
      medicineforNauseaVomitingGiven: payload.medicineforNauseaVomitingGiven,
      specify: payload.specify,
      time: payload.time ? moment(payload.time).format("hh:mm A") : "",

      ivFluidsRegime: payload.ivFluidsRegime,
      amount: payload.amount,
      mls: payload.mls,

      outputUrinemls: payload.outputUrinemls,
      drain1: payload.drain1,
      other: payload.other,
      totalOutputmls: payload.totalOutputmls,
      totalOutput: payload.totalOutput,

      drugs: payload.drugs,
      specimen: payload.specimen,
      takenTo: payload.takenTo,
      by: payload.by,

      skinIntegrity: payload.skinIntegrity,
      recommendedPosition: payload.recommendedPosition,
      transferByName: payload.transferByName,
      recievingNurseName: payload.recievingNurseName,
      recoveryDisignationand: payload.recoveryDisignationand,
      wardDisignationand: payload.wardDisignationand,

      rtime: payload.rtime ? moment(payload.rtime).format("hh:mm A") : "",
      transferredto: payload.transferredto,
      analgesiaGiven: payload.analgesiaGiven,
      specify2: payload.specify2,
      time2: payload.time2,
      EntryDate1: payload?.EntryDate1,
      EntryBy1: payload?.EntryBy1,
    };
    debugger;
    try {
      const response = await SaveOrUpdateImmediateRecoveryCareAPI(savePayload);
      if (response?.success) {
        notify(response?.message, "success");

        setPayload(initialState);

        handleGetBodyPartDisposalByPatient(PatientID);
        handleHandOverGivenByTId(Transaction_Id);
      } else {
        notify(response?.message, "error");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handlePrint = () => {};

  const handleCancel = () => {
    setPayload((prev) => {
      const cleared = {};

      Object.keys(prev).forEach((key) => {
        cleared[key] = "";
      });

      return cleared;
    });
  };

  useEffect(() => {
    handleGetBodyPartDisposalByPatient(PatientID);
    handleHandOverGivenByTId(Transaction_Id);
  }, []);

  const thead = [
    t("TIME"),
    ...timeSlots.map((t) => `${t} min`),
    t("Label"),
    t("Yes / No / NA"),
  ];

  const tbody = rowsConfig.map((row) => {
    let obj = { TIME: row.label };

    timeSlots.forEach((t) => {
      obj[`${t} min`] = (
        <Input
          type="text"
          name={`${row.prefix}${t}`}
          value={payload?.[`${row.prefix}${t}`]}
          onChange={handleChange}
          className="form-control"
          // respclass="col-xl-12 col-md-6 col-sm-6 col-12 mt-2"
        />
      );
    });

    // If row has dropdown
    if (row.selectName) {
      obj["Label"] = row.selectLabel;
      obj["Yes / No / NA"] = (
        <ReactSelect
          name={row.selectName}
          value={payload?.[row.selectName]}
          dynamicOptions={Options}
          handleChange={handleSelectChange}
          // respclass="col-xl-12 col-md-6 col-sm-6 col-12 mt-2"
        />
      );
    } else {
      obj["Label"] = "";
      obj["Yes / No / NA"] = "";
    }

    return obj;
  });

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          {!noHead && (
            <Heading
              title={t("IMMEDIATE RECOVERY CARE")}
              isBreadcrumb={false}
            />
          )}{" "}
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="handOverGivenBy"
              name="handOverGivenBy"
              value={
                payload.handOverGivenBy !== "" &&
                payload.handOverGivenBy !== null
                  ? payload.handOverGivenBy
                  : handeOverTo
              }
              onChange={handleChange}
              lable={t("handOver Given By")}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <DatePicker
              className="custom-calendar"
              placeholder={VITE_DATE_FORMAT}
              value={date}
              lable={t("Date")}
              respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
              showTime
              hourFormat="12"
              disable={true}
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              value={Time}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              disable={true}
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="patientPossition"
              name="patientPossition"
              value={payload?.patientPossition}
              onChange={handleChange}
              lable={t("Patient Possition")}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
          </div>
          <div className="row p-2">
            <div className="col-12">
              <Tables thead={thead} tbody={tbody} />
            </div>
          </div>
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
                    placeholderName={t("Nausea & Vomiting Score")}
                    id="nauseaVomitingScore"
                    name="nauseaVomitingScore"
                    value={payload?.nauseaVomitingScore}
                    dynamicOptions={[
                      { value: "0", label: "0" },
                      { value: "1", label: "1" },
                      { value: "2", label: "2" },
                      { value: "3", label: "3" },
                      { value: "4", label: "4" },
                    ]}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <ReactSelect
                    placeholderName={t("Nausea & Vomiting Score")}
                    id="medicineforNauseaVomitingGiven"
                    name="medicineforNauseaVomitingGiven"
                    value={payload?.medicineforNauseaVomitingGiven}
                    dynamicOptions={[
                      { value: "No", label: t("No") },
                      { value: "Yes", label: t("Yes") },
                    ]}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="specify"
                    name="specify"
                    value={payload?.specify}
                    onChange={handleChange}
                    lable={t("Specify")}
                    respclass="col-4"
                  />{" "}
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time")}
                    id="time"
                    name="time"
                    value={payload?.time}
                    respclass="col-4"
                    handleChange={handleDateTimeChange}
                  />
                </div>{" "}
              </div>
            </div>{" "}
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
                    placeholderName={t("Pain Score")}
                    id="painScore"
                    name="painScore"
                    value={payload?.painScore}
                    dynamicOptions={[
                      { value: "0", label: t("Select") },
                      { value: "No Pain", label: t("No Pain") },
                      { value: "Mild Pain", label: t("Mild Pain") },
                      { value: "Discomforting", label: t("Discomforting") },
                      { value: "Distresing", label: t("Distresing") },
                      { value: "Intense", label: t("Intense") },
                      { value: "Excruciating", label: t("Excruciating") },
                    ]}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <ReactSelect
                    placeholderName={t("Analgesia Given")}
                    id="analgesiaGiven"
                    name="analgesiaGiven"
                    value={payload?.analgesiaGiven}
                    dynamicOptions={[
                      { value: "No", label: t("No") },
                      { value: "Yes", label: t("Yes") },
                    ]}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="specify2"
                    name="specify2"
                    value={payload?.specify2}
                    onChange={handleChange}
                    lable={t("Specify")}
                    respclass="col-4"
                  />
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time")}
                    id="time2"
                    name="time2"
                    value={payload?.time2}
                    respclass="col-4"
                    handleChange={handleDateTimeChange}
                  />
                </div>
              </div>
            </div>{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="ivFluidsRegime"
              name="ivFluidsRegime"
              value={payload?.ivFluidsRegime}
              onChange={handleChange}
              lable={t("IV Fluids Regime")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="number"
              className="form-control"
              placeholder=""
              id="amount"
              name="amount"
              value={payload?.amount || 0}
              onChange={handleChange}
              lable={t("Amount")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="number"
              className="form-control"
              placeholder=""
              id="mls"
              name="mls"
              value={payload?.mls || 0}
              onChange={handleChange}
              lable={t("Mls")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="number"
              className="form-control"
              placeholder=""
              id="outputUrinemls"
              name="outputUrinemls"
              value={payload?.outputUrinemls || 0}
              onChange={handleChange}
              lable={t("Output Urine(mls)")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="number"
              className="form-control"
              placeholder=""
              id="drain1"
              name="drain1"
              value={payload?.drain1 || 0}
              onChange={handleChange}
              lable={t("Drain")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="number"
              className="form-control"
              placeholder=""
              id="other"
              name="other"
              value={payload?.other || 0}
              onChange={handleChange}
              lable={t("Other")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="totalOutputmls"
              name="totalOutputmls"
              value={payload?.totalOutputmls || 0}
              onChange={handleChange}
              lable={t("Total Output(mls)")}
              disabled={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="totalOutput"
              name="totalOutput"
              value={payload?.totalOutput || 0}
              onChange={handleChange}
              disabled={true}
              lable={t("Total Output")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />{" "}
            <div className="col-xl-3 col-md-4 col-sm-4 col-12">
              <TextAreaInput
                lable={t("Drugs")}
                className="w-100"
                placeholder=""
                id="drugs"
                rows={2}
                name="drugs"
                value={payload?.drugs}
                onChange={handleChange}
                maxLength={1000}
              />
            </div>
            <ReactSelect
              placeholderName={t("Specimen")}
              id="specimen"
              name="specimen"
              value={payload?.specimen}
              dynamicOptions={[
                { value: "No", label: t("No") },
                { value: "Yes", label: t("Yes") },
              ]}
              handleChange={handleSelectChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="takenTo"
              name="takenTo"
              value={payload?.takenTo}
              onChange={handleChange}
              lable={t("Taken To")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="by"
              name="by"
              value={payload?.by}
              onChange={handleChange}
              lable={t("Taken By")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Skin Integrity")}
              id="skinIntegrity"
              name="skinIntegrity"
              value={payload?.skinIntegrity}
              dynamicOptions={[
                { value: "No", label: t("No") },
                { value: "Yes", label: t("Yes") },
              ]}
              handleChange={handleSelectChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="recommendedPosition"
              name="recommendedPosition"
              value={payload?.recommendedPosition}
              onChange={handleChange}
              lable={t("Recommended Position")}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <div className="row">
            {" "}
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
                  {t("RECOVERY ROOM HANDOVER")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Transfer By Name")}
                    id="transferByName"
                    name="transferByName"
                    value={payload?.transferByName}
                    dynamicOptions={nurse}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <ReactSelect
                    placeholderName={t("Designation")}
                    id="recoveryDisignationand"
                    name="recoveryDisignationand"
                    value={payload?.recoveryDisignationand}
                    dynamicOptions={designation}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time")}
                    id="rtime"
                    name="rtime"
                    value={payload?.rtime}
                    respclass="col-4"
                    handleChange={handleDateTimeChange}
                  />
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
                {" "}
                <label className="label" style={{ position: "absolute" }}>
                  {t("WARD RECIPIENT")}
                </label>
                <div className="row">
                  <ReactSelect
                    placeholderName={t("Recieving NurseName")}
                    id="recievingNurseName"
                    name="recievingNurseName"
                    value={payload?.recievingNurseName}
                    dynamicOptions={nurse}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <ReactSelect
                    placeholderName={t("Designation")}
                    id="wardDisignationand"
                    name="wardDisignationand"
                    value={payload?.wardDisignationand}
                    dynamicOptions={designation}
                    handleChange={handleSelectChange}
                    respclass="col-4"
                  />
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="transferredto"
                    name="transferredto"
                    value={payload?.transferredto}
                    onChange={handleChange}
                    lable={t("Transferred To")}
                    respclass="col-4"
                  />
                </div>
              </div>
            </div>{" "}
          </div>
        </div>
        <div className="p-2 d-flex justify-content-end">
          {payload?.id ? (
            <>
              <button className="btn btn-sm btn-primary" onClick={handlesave}>
                {t("Update")}
              </button>
              <button
                className="btn btn-sm btn-secondary ml-2"
                onClick={handleCancel}
              >
                {t("Cancel")}
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={handlesave}>
              {t("Save")}
            </button>
          )}

          {/* <button className="btn btn-sm btn-primary" onClick={handlePrint}>
            {t("Print")}
          </button> */}
        </div>
      </div>
      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
};

export default RecoveryCheckForm;
