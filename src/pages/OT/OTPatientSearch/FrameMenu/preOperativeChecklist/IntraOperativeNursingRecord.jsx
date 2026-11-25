import React, { useEffect, useState } from "react";
import Heading from "../../../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../../../components/formComponent/ReactSelect";
import DatePicker from "../../../../../components/formComponent/DatePicker";
import Input from "../../../../../components/formComponent/Input";
import TimePicker from "../../../../../components/formComponent/TimePicker";
import TextAreaInput from "../../../../../components/formComponent/TextAreaInput";
import { notify } from "../../../../../utils/ustil2";
import {
  GetIntraOperativeNursingRecordAsyncAPI,
  SaveOperationDetailsAsyncAPI,
} from "../../../../../networkServices/OT/otAPI";
import Tables from "../../../../../components/UI/customTable";
import { ReprintSVG } from "../../../../../components/SvgIcons";
import moment from "moment";

const IntraOperativeNursingRecord = ({ data }) => {
  console.log({ data });

  const PatientID = data?.PatientID;
  const TransactionID = data?.TransactionID;
  const OTNumber = data?.OTNumber;
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [t("S.No"), t("Transaction No"), t("Patient ID"), t("Edit"), t("Print")];

  const Options = [
    { value: "0", label: t("No") },
    { value: "1", label: t("Yes") },
  ];
  const CatherOptions = [
    { value: "0", label: t("Select") },
    { value: "Ward", label: t("Ward") },
    { value: "OT", label: t("OT") },
  ];

  const initialValue = {
    ID: "",
    transactionID: "",
    patientID: "",
    OtNumber: "",

    Date: new Date(),
    theatre: "",
    HoldingArea: "",
    timein: "",
    stretcher: "",
    comments: "",
    Allergy: "",

    isptid: "",
    isopconsent: "",
    isivinfusing: "",
    ispreopchecklist: "",

    issitesurgeryidentified: "",

    Signature: "",
    Time: "",
    positionrala: "",
    antibioticorder: "",
    Type1: "",
    orderedby: "",
    time1: "",
    timeInTheatre: "",
    timeOutOfTheatre: "",
    operationStart: "",
    operationFinish: "",
    isarmed: "",
    issafety: "",
    safetypostition: "",
    ArmPostiton: "",
    Isbodyalign: "",
    otherSpecifyValue: "",
    positiontype: "",
    positionother: "",
    positiondevicestype: "",
    positiondevicesother: "",
    iscatheterinserted: "",
    catheterinsertin: "",
    cathertername: "",
    cathetersize: "",
    amountofurine: "",
    shavedby: "",
    iodine: "",
    spirit: "",
    water: "",
    txtSkinPrepOther: "",

    eunitno: "",
    emode: "",
    coagset: "",
    cutset: "",
    iseskinbefore: "",
    iseskinafter: "",

    tunitno: "",
    tsite: "",
    pressure: "",
    timeon: "",
    timeoff: "",
    istskinbefore: "",
    istskinafter: "",

    cao: "",
    haem: "",
    ews: "",
    ng: "",
    drainother: "",

    Wsaline: "",
    WWater: "",
    WIodine: "",
    WAnti: "",
    woundother: "",

    typeOfWound: "",
    woundSite: "",

    woundClass: "",
    surgeon: "",
    assistant: "",
    anaesthetist: "",
    scrubnurse: "",
    circulatingNurse: "",
    observersOthers: "",
    typeofanae: "",
    general: "",
    local: "",
    preopdiag: "",
    intraopdiagnosis: "",
    Operations: "",
    destinationpostop: "",
    Place: "",
    via: "",
    AsaClass: "",
  };

  const fieldConfig = [
    {
      component: "DatePicker",
      id: "Date",
      name: "Date",
      label: t("Date"),
      respclass: "col-sm-2 col-12",
      extra: {
        placeholder: VITE_DATE_FORMAT,
        className: "custom-calendar",
        maxDate: new Date(),
      },
    },
    {
      component: "Input",
      id: "theatre",
      name: "theatre",
      label: t("THEATRE"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "HoldingArea",
      name: "HoldingArea",
      label: t("Holding Area"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "stretcher",
      name: "stretcher",
      label: t("Moved By"),
      respclass: "col-sm-2 col-12",
      options: [
        { value: "st", label: t("Stretcher") },
        { value: "wc", label: t("Wheelchair") },
        { value: "wk", label: t("Walking") },
        { value: "cr", label: t("Carried") },
      ],
    },
    {
      component: "ReactSelect",
      id: "AsaClass",
      name: "AsaClass",
      label: t("Asa Class"),
      respclass: "col-sm-2 col-12",
      options: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
      ],
    },
    {
      component: "TimePicker",
      id: "timein",
      name: "timein",
      label: t("Time In"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Allergy",
      name: "Allergy",
      label: t("Allergy"),
      respclass: "col-sm-2 col-12",
    },
  ];

  const block2Config = [
    {
      component: "ReactSelect",
      id: "isptid",
      name: "isptid",
      label: t("Pt.ID verried with Regno"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "ReactSelect",
      id: "isopconsent",
      name: "isopconsent",
      label: t("Consent Signed"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "ReactSelect",
      id: "isivinfusing",
      name: "isivinfusing",
      label: t("Arrived With IV Infusing"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "ReactSelect",
      id: "ispreopchecklist",
      name: "ispreopchecklist",
      label: t("Pre op. Checklist completed"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "Input",
      id: "Signature",
      name: "Signature",
      label: t("IV Started By"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "Time",
      name: "Time",
      label: t("Time"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "positionrala",
      name: "positionrala",
      label: t("Position: RA. LA. RL, LL, Other"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "antibioticorder",
      name: "antibioticorder",
      label: t("Antibiotic Order"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "Input",
      id: "Type1",
      name: "Type1",
      label: t("Type"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "orderedby",
      name: "orderedby",
      label: t("Ordered By"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "time1",
      name: "time1",
      label: t("Time"),
      respclass: "col-sm-2 col-12",
    },
  ];
  const block3Config = [
    {
      component: "TimePicker",
      id: "timeInTheatre",
      name: "timeInTheatre",
      label: t("Time in theatre"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "timeOutOfTheatre",
      name: "timeOutOfTheatre",
      label: t("Time out of theatre"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "operationStart",
      name: "operationStart",
      label: t("Operation Start"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "operationFinish",
      name: "operationFinish",
      label: t("Operation Finish"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "ReactSelect",
      id: "issafety",
      name: "issafety",
      label: t("Safety Belt Applied"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "Input",
      id: "safetypostition",
      name: "safetypostition",
      label: t("Safety Position"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "isarmed",
      name: "isarmed",
      label: t("Armed Secure"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "Input",
      id: "ArmPostiton",
      name: "ArmPostiton",
      label: t("Arm Postiton"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "Isbodyalign",
      name: "Isbodyalign",
      label: t("Patient In Proper Body Alignment"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "ReactSelect",
      id: "iscatheterinserted",
      name: "iscatheterinserted",
      label: t("Urinary Catheter in Situ"),
      respclass: "col-sm-2 col-12",
      options: Options,
    },
    {
      component: "ReactSelect",
      id: "catheterinsertin",
      name: "catheterinsertin",
      label: t("Urinary Catheter Inserted in Theatre"),
      respclass: "col-sm-2 col-12",
      options: CatherOptions,
    },
    {
      component: "Input",
      id: "cathertername",
      name: "cathertername",
      label: t("Type"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "cathetersize",
      name: "cathetersize",
      label: t("Size"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "amountofurine",
      name: "amountofurine",
      label: t("Intra-op Xrays taken"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "positiontype",
      name: "positiontype",
      label: t("PATIENT POSITION"),
      respclass: "col-sm-2 col-12",
      options: [
        { value: "pr", label: t("Prone") },
        { value: "sp", label: t("Supine") },
        { value: "lt", label: t("Lateral") },
        { value: "lm", label: t("Lithotomy") },
      ],
    },
  ];

  const block4Config = [
    {
      component: "Input",
      id: "eunitno",
      name: "eunitno",
      label: t("Unit No."),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "emode",
      name: "emode",
      label: t("Mode"),
      respclass: "col-sm-2 col-12",
      options: [
        { value: "0", label: t("Select") },
        { value: "BI", label: t("BI") },
        { value: "Polar", label: t("Polar") },
      ],
    },
    {
      component: "Input",
      id: "coagset",
      name: "coagset",
      label: t("Co.Ag.Set"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "cutset",
      name: "cutset",
      label: t("Cut.Set"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "iseskinbefore",
      name: "iseskinbefore",
      label: t("Skin Checked Before"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "iseskinafter",
      name: "iseskinafter",
      label: t("Skin Checked After"),
      respclass: "col-sm-2 col-12",
    },
  ];

  const block5Config = [
    {
      component: "Input",
      id: "tunitno",
      name: "tunitno",
      label: t("Unit No."),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "tsite",
      name: "tsite",
      label: t("Site"),
      respclass: "col-sm-2 col-12",
      options: [
        { value: "0", label: t("Select") },
        { value: "Left", label: t("Left") },
        { value: "Right", label: t("Right") },
        { value: "BIPolar", label: t("BI Polar") },
      ],
    },
    {
      component: "Input",
      id: "pressure",
      name: "pressure",
      label: t("Pressure"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "timeon",
      name: "timeon",
      label: t("Time on"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "timeoff",
      name: "timeoff",
      label: t("Time off"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "istskinbefore",
      name: "istskinbefore",
      label: t("Skin Checked Before"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "istskinafter",
      name: "istskinafter",
      label: t("Skin Checked After"),
      respclass: "col-sm-2 col-12",
    },
  ];

  const block6Config = [
    {
      component: "Input",
      id: "surgeon",
      name: "surgeon",
      label: t("Surgeon"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "assistant",
      name: "assistant",
      label: t("Assistant"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "anaesthetist",
      name: "anaesthetist",
      label: t("Anaesthetist"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "scrubnurse",
      name: "scrubnurse",
      label: t("Scrubnurse"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "circulatingNurse",
      name: "circulatingNurse",
      label: t("Circulating Nurse"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "observersOthers",
      name: "observersOthers",
      label: t("Observers Others"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "typeofanae",
      name: "typeofanae",
      label: t("Type of Anaethesia"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "general",
      name: "general",
      label: t("General"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "local",
      name: "local",
      label: t("Local"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "preopdiag",
      name: "preopdiag",
      label: t("Pre-op Diagnosis"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "intraopdiagnosis",
      name: "intraopdiagnosis",
      label: t("Intra-op Diagnosis"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Operations",
      name: "Operations",
      label: t("Operations"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "destinationpostop",
      name: "destinationpostop",
      label: t("Destination post-op"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Place",
      name: "Place",
      label: t("Place"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "via",
      name: "via",
      label: t("Via"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "ReactSelect",
      id: "woundClass",
      name: "woundClass",
      label: t("Wound Class"),
      respclass: "col-sm-2 col-12",
      options: [
        { value: "Clean", label: t("Clean") },
        { value: "ControlledCont", label: t("Controlled Cont.") },
        { value: "Contaminated", label: t("Contaminated") },
        { value: "Infected", label: t("Infected") },
      ],
    },
  ];

  const [payload, setPayload] = useState(initialValue);
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

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

  const renderField = (field) => {
    const commonProps = {
      id: field.id,
      name: field.name,
      lable: t(field.label),
      respclass: field.respclass,
      value: payload[field.name],
    };

    switch (field.component) {
      case "Input":
        return (
          <Input
            {...commonProps}
            type="text"
            className="form-control"
            onChange={handleChange}
            placeholder={""}
          />
        );

      case "DatePicker":
        return (
          <DatePicker
            {...commonProps}
            handleChange={handleChange}
            {...field.extra}
          />
        );

      case "ReactSelect":
        return (
          <ReactSelect
            {...commonProps}
            placeholderName={t(field.label)}
            dynamicOptions={field.options}
            handleChange={handleSelectChange}
          />
        );

      case "TimePicker":
        return (
          <TimePicker
            {...commonProps}
            placeholderName={t("Time")}
            handleChange={handleDateTimeChange}
          />
        );

      default:
        return null;
    }
  };

  const handleGetData = async (TransactionID) => {
    try {
      const APIresponse =
        await GetIntraOperativeNursingRecordAsyncAPI(TransactionID);

      const data = APIresponse?.data || [];
      console.log(data);

      if (data.length > 0) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const { transactionID, patientID } = items;
      return {
        SNO: index + 1,
        transactionID,
        patientID,

        Edit: (
          <i className="fa fa-edit p-1" onClick={() => handleEdit(items)} />
        ),
        print: (
          <div onClick={handlePrint}>
            <ReprintSVG />
          </div>
        ),
      };
    });
  };

  const handleEdit = (row) => {
    setPayload({
      ID: row.ID ?? "",
      Date: row.Date ?? "",
      theatre: row.theatre ?? "",
      HoldingArea: row.HoldingArea ?? "",
      timein: moment(row.timein).format("hh:mm A") ?? "",
      stretcher: row.stretcher ?? "",
      comments: row.comments ?? "",
      Allergy: row.Allergy ?? "",

      isptid: row.isptid ?? "",
      isopconsent: row.isopconsent ?? "",
      isivinfusing: row.isivinfusing ?? "",
      ispreopchecklist: row.ispreopchecklist ?? "",
      issitesurgeryidentified: row.issitesurgeryidentified ?? "",

      Signature: row.Signature ?? "",
      Time: row.Time ?? "",
      positionrala: row.positionrala ?? "",
      antibioticorder: row.antibioticorder ?? "",
      Type1: row.Type1 ?? "",
      orderedby: row.orderedby ?? "",
      time1: row.time1 ?? "",
      timeInTheatre: row.timeInTheatre ?? "",
      timeOutOfTheatre: row.timeOutOfTheatre ?? "",
      operationStart: row.operationStart ?? "",
      operationFinish: row.operationFinish ?? "",
      isarmed: row.isarmed ?? "",
      issafety: row.issafety ?? "",
      safetypostition: row.safetypostition ?? "",
      ArmPostiton: row.ArmPostiton ?? "",
      Isbodyalign: row.Isbodyalign ?? "",
      otherSpecifyValue: row.otherSpecifyValue ?? "",
      positiontype: row.positiontype ?? "",
      positionother: row.positionother ?? "",
      positiondevicestype: row.positiondevicestype ?? "",
      positiondevicesother: row.positiondevicesother ?? "",
      iscatheterinserted: row.iscatheterinserted ?? "",
      catheterinsertin: row.catheterinsertin ?? "",
      cathertername: row.cathertername ?? "",
      cathetersize: row.cathetersize ?? "",
      amountofurine: row.amountofurine ?? "",
      shavedby: row.shavedby ?? "",
      iodine: row.iodine ?? "",
      spirit: row.spirit ?? "",
      water: row.water ?? "",
      txtSkinPrepOther: row.txtSkinPrepOther ?? "",

      eunitno: row.eunitno ?? "",
      emode: row.emode ?? "",
      coagset: row.coagset ?? "",
      cutset: row.cutset ?? "",
      iseskinbefore: row.iseskinbefore ?? "",
      iseskinafter: row.iseskinafter ?? "",

      tunitno: row.tunitno ?? "",
      tsite: row.tsite ?? "",
      pressure: row.pressure ?? "",
      timeon: row.timeon ?? "",
      timeoff: row.timeoff ?? "",
      istskinbefore: row.istskinbefore ?? "",
      istskinafter: row.istskinafter ?? "",

      cao: row.cao ?? "",
      haem: row.haem ?? "",
      ews: row.ews ?? "",
      ng: row.ng ?? "",
      drainother: row.drainother ?? "",

      Wsaline: row.Wsaline ?? "",
      WWater: row.WWater ?? "",
      WIodine: row.WIodine ?? "",
      WAnti: row.WAnti ?? "",
      woundother: row.woundother ?? "",

      typeOfWound: row.typeOfWound ?? "",
      woundSite: row.woundSite ?? "",

      woundClass: row.woundClass ?? "",
      surgeon: row.surgeon ?? "",
      assistant: row.assistant ?? "",
      anaesthetist: row.anaesthetist ?? "",
      scrubnurse: row.scrubnurse ?? "",
      circulatingNurse: row.circulatingNurse ?? "",
      observersOthers: row.observersOthers ?? "",
      typeofanae: row.typeofanae ?? "",
      general: row.general ?? "",
      local: row.local ?? "",
      preopdiag: row.preopdiag ?? "",
      intraopdiagnosis: row.intraopdiagnosis ?? "",
      Operations: row.Operations ?? "",
      destinationpostop: row.destinationpostop ?? "",
      Place: row.Place ?? "",
      via: row.via ?? "",
      AsaClass: row.AsaClass ?? "",
    });
  };

  const handlesave = async () => {
    const savePayload = {
      ID: payload.ID || 0,
      transactionID: TransactionID,
      patientID: PatientID,
      OtNumber: OTNumber,

      Date: payload.Date,
      theatre: payload.theatre,
      HoldingArea: payload.HoldingArea,
      timein: payload.timein,
      stretcher: payload.stretcher,
      comments: payload.comments,
      Allergy: payload.Allergy,

      isptid: payload.isptid,
      isopconsent: payload.isopconsent,
      isivinfusing: payload.isivinfusing,
      ispreopchecklist: payload.ispreopchecklist,

      issitesurgeryidentified: payload.issitesurgeryidentified,

      Signature: payload.Signature,
      Time: payload.Time,
      positionrala: payload.positionrala,
      antibioticorder: payload.antibioticorder,
      Type1: payload.Type1,
      orderedby: payload.orderedby,
      time1: payload.time1,
      timeInTheatre: payload.timeInTheatre,
      timeOutOfTheatre: payload.timeOutOfTheatre,
      operationStart: payload.operationStart,
      operationFinish: payload.operationFinish,
      isarmed: payload.isarmed,
      issafety: payload.issafety,
      safetypostition: payload.safetypostition,
      ArmPostiton: payload.ArmPostiton,
      Isbodyalign: payload.Isbodyalign,
      otherSpecifyValue: payload.otherSpecifyValue,
      positiontype: payload.positiontype,
      positionother: payload.positionother,
      positiondevicestype: payload.positiondevicestype,
      positiondevicesother: payload.positiondevicesother,
      iscatheterinserted: payload.iscatheterinserted,
      catheterinsertin: payload.catheterinsertin,
      cathertername: payload.cathertername,
      cathetersize: payload.cathetersize,
      amountofurine: payload.amountofurine,
      shavedby: payload.shavedby,

      iodine: payload.iodine,
      spirit: payload.spirit,
      water: payload.water,
      txtSkinPrepOther: payload.txtSkinPrepOther,

      eunitno: payload.eunitno,
      emode: payload.emode,
      coagset: payload.coagset,
      cutset: payload.cutset,
      iseskinbefore: payload.iseskinbefore,
      iseskinafter: payload.iseskinafter,

      tunitno: payload.tunitno,
      tsite: payload.tsite,
      pressure: payload.pressure,
      timeon: payload.timeon,
      timeoff: payload.timeoff,
      istskinbefore: payload.istskinbefore,
      istskinafter: payload.istskinafter,

      cao: payload.cao,
      haem: payload.haem,
      ews: payload.ews,
      ng: payload.ng,
      drainother: payload.drainother,

      Wsaline: payload.Wsaline,
      WWater: payload.WWater,
      WIodine: payload.WIodine,
      WAnti: payload.WAnti,
      woundother: payload.woundother,

      typeOfWound: payload.typeOfWound,
      woundSite: payload.woundSite,

      woundClass: payload.woundClass,
      surgeon: payload.surgeon,
      assistant: payload.assistant,
      anaesthetist: payload.anaesthetist,
      scrubnurse: payload.scrubnurse,
      circulatingNurse: payload.circulatingNurse,
      observersOthers: payload.observersOthers,
      typeofanae: payload.typeofanae,
      general: payload.general,
      local: payload.local,
      preopdiag: payload.preopdiag,
      intraopdiagnosis: payload.intraopdiagnosis,
      Operations: payload.Operations,
      destinationpostop: payload.destinationpostop,
      Place: payload.Place,
      via: payload.via,
      AsaClass: payload.AsaClass,
    };
    try {
      const response = await SaveOperationDetailsAsyncAPI(savePayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialValue);
        handleGetData(TransactionID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancel = () => {
    setPayload((prev) => {
      const cleared = {};
      Object.keys(prev).forEach((key) => {
        cleared[key] = "";
      });
      return cleared;
    });
  };

  const handlePrint = async (row) => {};

  useEffect(() => {
    handleGetData(TransactionID);
  }, []);
  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <div className="row">
                  {fieldConfig.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}

                  <div className="col-sm-2 col-12">
                    <TextAreaInput
                      lable={t("Special Comments")}
                      className="w-100"
                      placeholder=""
                      id="comments"
                      rows={2}
                      name="comments"
                      value={payload?.comments}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <div className="row">
                  {block2Config.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <div className="row">
                  {block3Config.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}
                  <div className="col-sm-2 col-12">
                    <TextAreaInput
                      lable={t("Pressure Points(describe)")}
                      className="w-100"
                      placeholder=""
                      id="otherSpecifyValue"
                      rows={2}
                      name="otherSpecifyValue"
                      value={payload?.otherSpecifyValue}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("SKIN PREP")}
                </label>
                <div className="row">
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="shavedby"
                    name="shavedby"
                    value={payload?.shavedby}
                    onChange={handleChange}
                    lable={t("shavedby")}
                    respclass="col-sm-2 col-12"
                  />
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="iodine"
                      checked={payload.iodine === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`iodine`}>
                      {t("Hibitane in Spirit")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="spirit"
                      checked={payload.spirit === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`spirit`}>
                      {t("Providone Iodine")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="water"
                      checked={payload.water === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`water`}>
                      {t("Hibitane in Water")}
                    </span>
                  </div>
                  <div className="col-sm-2 col-12">
                    <TextAreaInput
                      lable={t("Others")}
                      className="w-100"
                      placeholder=""
                      id="txtSkinPrepOther"
                      rows={2}
                      name="txtSkinPrepOther"
                      value={payload?.txtSkinPrepOther}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>
                  <div className="col-sm-2 col-12">
                    <TextAreaInput
                      lable={t("Others")}
                      className="w-100"
                      placeholder=""
                      id="positionother"
                      rows={2}
                      name="positionother"
                      value={payload?.positionother}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("ELECTROCAL SURGICAL")}
                </label>
                <div className="row">
                  {block4Config.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("TOURNIQUET")}
                </label>
                <div className="row">
                  {block5Config.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("CARDIAC BYPASS")}
                </label>
                <div className="row">
                  <TimePicker
                    placeholderName="Time On"
                    lable={t("Time On")}
                    id="timeOn"
                    name="timeOn"
                    value={payload?.timeOn}
                    respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />
                  <TimePicker
                    placeholderName="Time On"
                    lable={t("Time On")}
                    id="timeOn"
                    name="timeOn"
                    value={payload?.timeOn}
                    respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />
                  <TimePicker
                    placeholderName="Time On"
                    lable={t("Time On")}
                    id="timeOn"
                    name="timeOn"
                    value={payload?.timeOn}
                    respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                    handleChange={handleDateTimeChange}
                  />
                </div>
              </div>
            </div>
          </div> */}
          <div className="row">
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
                  {t("DRAIN TYPE")}
                </label>
                <div className="row">
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="cao"
                      checked={payload.cao === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`cao`}>
                      {t("Coarrugated")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="haem"
                      checked={payload.haem === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`haem`}>
                      {t("Haemovac")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="ews"
                      checked={payload.ews === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`ews`}>
                      {t("UWS ")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="ng"
                      checked={payload.ng === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`ng`}>
                      {t("NG ")}
                    </span>
                  </div>
                  <div className="col-sm-4 col-12">
                    <TextAreaInput
                      lable={t("Others")}
                      className="w-100"
                      placeholder=""
                      id="drainother"
                      rows={2}
                      name="drainother"
                      value={payload?.drainother}
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
                  {t("WOUND IRRIGATION")}
                </label>
                <div className="row">
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="Wsaline"
                      checked={payload.Wsaline === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`Wsaline`}>
                      {t("Saline")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="WWater"
                      checked={payload.WWater === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`WWater`}>
                      {t("Water")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="WIodine"
                      checked={payload.WIodine === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`WIodine`}>
                      {t("UWS ")}
                    </span>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input table-checkbox"
                      type="checkbox"
                      style={{ marginLeft: "-12px" }}
                      name="WAnti"
                      checked={payload.WAnti === 1}
                      onChange={handleChange}
                    />

                    <span className="form-check-label ml-2" htmlFor={`WAnti`}>
                      {t("NG ")}
                    </span>
                  </div>
                  <div className="col-sm-4 col-12">
                    <TextAreaInput
                      lable={t("Others")}
                      className="w-100"
                      placeholder=""
                      id="woundother"
                      rows={2}
                      name="woundother"
                      value={payload?.woundother}
                      onChange={handleChange}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("TOURNIQUET")}
                </label>
                <div className="row">
                  {block6Config.map((field, index) => (
                    <React.Fragment key={index}>
                      {renderField(field)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-2">
          {payload?.ID ? (
            <>
              <button className="btn btn-sm btn-primary" onClick={handlesave}>
                {t("Update")}
              </button>
              <button
                className="btn btn-sm btn-secondary"
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
        </div>
        <Heading
          title={t("INTRA-OPERATIVE NURSING RECORD LIST")}
          isBreadcrumb={false}
        />
      </div>{" "}
      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
};

export default IntraOperativeNursingRecord;
