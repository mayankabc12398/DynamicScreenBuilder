import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Accordion from "../UI/Accordion";
import DatePicker from "../formComponent/DatePicker";
import TextAreaInput from "../formComponent/TextAreaInput";
import Input from "../formComponent/Input";
import BloodTransfusioncomponent from "./BloodTransfusioncomponent";
import { notify } from "../../utils/ustil2";
import { bloodTransfussionReqBody } from "../../utils/utils";
import {
  getMonitoringChartData,
  handleUpdateBloodTransfusionMonitoringChartDTO,
  SaveUpdateBloodTransfusionMonitoringChart,
} from "../../networkServices/nursingWardAPI";
import BloodTransfusionMonitoringTable from "../UI/customTable/Emergency/BloodTransfusionMonitoringTable";
const intialState = {
  fDate: new Date(),
  Doctor: "",
  familyHistory: "",

  consentReason: "",
  CPrintName: "",
  CRelationship: "",

  refuseReason: "",
  RPrintName: "",
  RefuseRelationship: "",
};
// const initialBagState = {
//   Date: new Date(),
//   Expirydate: new Date(),

//   Prescriptionunits: "0",
//   firstofunits: "0",

//   VerbalID: "0",
//   BloodGroup: "0",
//   IDBand: "0",
//   RhD: "0",
//   Consent: "0",
//   IVFilterSystem: "0",

//   IncreasedBP: "0",
//   BackPain: "0",
//   Shivering: "0",
//   LowerBackPain: "0",

//   IncreasedTemperature: "0",
//   IncreasedPulseAndReaps: "0",
//   Headache: "0",
//   Hernatemesis: "0",

//   Wheezing: "0",
//   Itching: "0",
//   Hives: "0",
//   JointPain: "0",

//   fDate: "",
//   Doctor: "",
//   refuseReason: "",
//   PrintName: "",
//   Relationship: "",

//   monitoringData: Array(5).fill(Array(8).fill("")),
// };
const initialBagState = {
  Date: new Date(),
  Expirydate: new Date(),
  Prescriptionunits: "0",
  VerbalID: "0",
  BloodGroup: "0",
  firstofunits: "0",
  IDBand: "0",
  RhD: "0",
  Consent: "0",
  IVFilterSystem: "0",

  IncreasedBP: "0",
  BackPain: "0",
  Shivering: "0",
  LowerBackPain: "0",

  IncreasedTemperature: "0",
  IncreasedPulseAndReaps: "0",
  Headache: "0",
  Hernatemesis: "0",

  Wheezing: "0",
  Itching: "0",
  Hives: "0",
  JointPain: "0",

  fDate: "",
  Doctor: "",
  refuseReason: "",
  PrintName: "",
  Relationship: "",

  monitoringData: Array(5).fill(Array(8).fill("")),
};
const BloodTransfusionMonitoring = ({ data }) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [transfusionList, setTransfusionList] = useState([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const [payload, setPayload] = useState({
    ...intialState,
  });
  const [bagPayloads, setBagPayloads] = useState([
    { ...initialBagState },
    { ...initialBagState },
    { ...initialBagState },
    { ...initialBagState },
  ]);

  const updateBagPayload = (index, newFieldData) => {
    setBagPayloads((prevPayloads) => {
      const newPayloads = [...prevPayloads];
      newPayloads[index] = { ...newPayloads[index], ...newFieldData };
      return newPayloads;
    });
  };

  const updateMonitoringTable = (bagIndex, rowIndex, colIndex, value) => {
    setBagPayloads((prevPayloads) => {
      const newPayloads = [...prevPayloads];
      const newMonitoringData = newPayloads[bagIndex].monitoringData.map(
        (row, rIdx) =>
          rIdx === rowIndex
            ? row.map((col, cIdx) => (cIdx === colIndex ? value : col))
            : row
      );
      newPayloads[bagIndex] = {
        ...newPayloads[bagIndex],
        monitoringData: newMonitoringData,
      };
      return newPayloads;
    });
  };
  const resetForm = () => {
    setBagPayloads(Array(4).fill({ ...initialBagState }));
    setPayload({ ...intialState });
    setIsUpdate(false);
  };
  const handleSave = async () => {
    try {
    
      const apiCall = isUpdate
        ? SaveUpdateBloodTransfusionMonitoringChart
        : SaveUpdateBloodTransfusionMonitoringChart;

      const response = await apiCall(
        bloodTransfussionReqBody(bagPayloads, data, payload, isUpdate)
      );

      if (response?.success) {
        notify(response?.message, "success");
        getBloodTransfusion();
        resetForm();
        setIsUpdate(false);
      } else {
        notify(response?.message || "Something went wrong", "error");
      }
    } catch (error) {
      console.error("Something Went Wrong", error);
      notify(error?.message || "Server error", "error");
    }
  };

  // const handleSave = async () => {

  //   try {
  //     const response = await SaveUpdateBloodTransfusionMonitoringChart(
  //       bloodTransfussionReqBody(bagPayloads, data, payload, isUpdate)
  //     );
  //     if (response?.success) {
  //       notify(response?.message, "success");
  //       getBloodTransfusion();
  //       setBagPayloads([
  //         { ...initialBagState },
  //         { ...initialBagState },
  //         { ...initialBagState },
  //         { ...initialBagState },
  //       ]);
  //       setPayload({ ...intialState });
  //       setIsUpdate(false);
  //     } else {
  //       notify(response?.message, "error");
  //     }
  //   } catch (error) {
  //     console.log(error, "Something Went Wrong");
  //     notify(error, "error");
  //   }
  // };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({ ...payload, [name]: value });
  };

  console.log("bagPayloads", bagPayloads, data);

  const getBloodTransfusion = async () => {
    const PatientId = String(data?.patientID ?? data?.PatientID ?? "");
    const TransactionId = String(
      data?.transactionID ?? data?.TID ?? data?.TransactionID ?? ""
    );
    // const PatientId = String(data?.PatientID) || String(data?.patientID);
    // const TransactionId = String(data?.TID) || String(data?.transactionID);

    try {
      const response = await getMonitoringChartData(PatientId, TransactionId);
      if (response?.success) {
        // notify(response?.message, "success");
        setTransfusionList(response?.data);
      } else {
        // notify(response?.message, "error");
        setTransfusionList([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log(bagPayloads, "bagPayloads");
  const transformApiToBagPayloads = (ele) => {
    const TIME_KEYS = [
      "Pre",
      "5min",
      "10min",
      "15min",
      "1hr",
      "2hr",
      "3hr",
      "4hr",
    ];

    const VITAL_KEYS = ["TempC", "Pulse", "Resps", "Lbp", "Spo2"];

    const BOOLEAN_KEYS = [
      "VerbalID",
      "BloodGroup",
      "IDBand",
      "RhD",
      "Consent",
      "Prescriptionunits",
      "firstofunits",
      "IVFilterSystem",

      "IncreasedBP",
      "BackPain",
      "Shivering",
      "LowerBackPain",

      "IncreasedTemperature",
      "IncreasedPulseAndReaps",
      "Headache",
      "Hernatemesis",

      "Wheezing",
      "Itching",
      "Hives",
      "JointPain",
    ];

    const DATE_KEY_MAP = {
      Date: "BDate",
      Expirydate: "Expirydate",
    };

    const bags = [];

    for (let i = 0; i < 4; i++) {
      const suffix = i === 0 ? "" : i.toString();

      const bag = {
        Date: ele[`BDate${suffix}`]
          ? parseApiDate(ele[`BDate${suffix}`])
          : new Date(),

        Expirydate: ele[`Expirydate${suffix}`]
          ? parseApiDate(ele[`Expirydate${suffix}`])
          : new Date(),

        fDate: parseApiDate(ele?.DrDate) || "",
        Doctor: ele?.Doctor || "",
        refuseReason: ele?.reason || "",
        PrintName: ele?.cprintname || "",
        Relationship: ele?.crel || "",

        monitoringData: Array.from({ length: 5 }, () => Array(8).fill("")),
      };

      debugger;
      BOOLEAN_KEYS.forEach((key) => {
        const apiKey = `${key}${suffix}`;
        bag[key] =
          ele[apiKey] !== null && ele[apiKey] !== undefined
            ? String(ele[apiKey])
            : "0";
      });

      /* ---------- Vital monitoring data ---------- */
      VITAL_KEYS.forEach((vital, rowIndex) => {
        TIME_KEYS.forEach((time, colIndex) => {
          const apiKey = `${vital}_${time}${suffix}`;
          bag.monitoringData[rowIndex][colIndex] =
            ele[apiKey] !== null && ele[apiKey] !== undefined
              ? String(ele[apiKey])
              : "";
        });
      });

      bags.push(bag);
    }

    return bags;
  };

  // const transformApiToBagPayloads = (ele) => {
  //   // setPayload({
  //   //   ...payload,
  //   //   id: ele?.Id,
  //   // });
  //   const timeKeys = [
  //     "Pre",
  //     "5min",
  //     "10min",
  //     "15min",
  //     "1hr",
  //     "2hr",
  //     "3hr",
  //     "4hr",
  //   ];
  //   const vitalSignKeys = ["TempC", "Pulse", "Resps", "Lbp", "Spo2"];

  //   const booleanFields = [
  //     "VerbalID",
  //     "BloodGroup",
  //     "IDBand",
  //     "RhD",
  //     "Consent",
  //     "IVFilterSystem",
  //     "IncreasedBP",
  //     "BackPain",
  //     "Shivering",
  //     "LowerBackPain",
  //     "IncreasedTemperature",
  //     "IncreasedPulseAndReaps",
  //     "Headache",
  //     "Hernatemesis",
  //     "Wheezing",
  //     "Itching",
  //     "Hives",
  //     "JointPain",
  //     "firstofunits",
  //     "Prescriptionunits",
  //     // "Expirydate"
  //   ];

  //   const dateFields = {
  //     Date: "BDate",
  //     Expirydate: "Expirydate",
  //   };

  //   const structuredPayloads = [];

  //   for (let i = 0; i < 4; i++) {
  //     const suffix = i === 0 ? "" : i.toString();

  //     const bag = {
  //       fDate: parseApiDate(ele.DrDate)  || "",
  //       Doctor: ele.Doctor || "",
  //       refuseReason: ele.reason || "",
  //       PrintName: ele.cprintname || "",
  //       Relationship: ele.crel || "",

  //       monitoringData: Array(5)
  //         .fill(null)
  //         .map(() => Array(8).fill("")),
  //     };

  //     booleanFields.forEach((field) => {
  //       const apiKey = field + suffix;
  //       const apiValue =
  //         ele[apiKey] !== null && ele[apiKey] !== undefined ? ele[apiKey] : 0;
  //       bag[field] = apiValue.toString();
  //     });

  //     for (const stateKey in dateFields) {
  //       const apiKey = dateFields[stateKey] + suffix;
  //       bag[stateKey] = ele[apiKey] || new Date().toISOString();
  //     }

  //     vitalSignKeys.forEach((rowKey, rowIndex) => {
  //       timeKeys.forEach((timeKey, colIndex) => {
  //         const apiKey = `${rowKey}_${timeKey}${suffix}`;
  //         const cellValue = ele[apiKey] !== null ? String(ele[apiKey]) : "";
  //         bag.monitoringData[rowIndex][colIndex] = cellValue;
  //       });
  //     });

  //     structuredPayloads.push(bag);
  //   }

  //   return structuredPayloads;
  // };
  console.log(payload, "aaaaaaa");
  //   const formatApiDate = (dateStr) => {
  //   if (!dateStr) return null;
  //   const parsed = new Date(dateStr);
  //   return parsed.toISOString();
  // };
  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  const handleEdit = (index, ele) => {
    console.log(ele, "eleeeeeeeeee");
    setIsUpdate(true);
    const newBagPayloads = transformApiToBagPayloads(ele);
    setBagPayloads(newBagPayloads);
    setPayload({
      fDate: parseApiDate(ele?.DrDate),
      Doctor: ele?.Doctor,
      familyHistory: ele?.reason,

      consentReason: ele?.Cconsent,
      CPrintName: ele?.cprintname,
      CRelationship: ele?.crel,

      refuseReason: ele?.refuse,
      RPrintName: ele?.rprintname,
      RefuseRelationship: ele?.rrel,
      id: ele?.Id,
    });
  };

  useEffect(() => {
    getBloodTransfusion();
  }, []);
  console.log(payload);
  return (
    <>
      <BloodTransfusioncomponent
        title={t("CHECKLIST BAG# 1")}
        payload={bagPayloads[0]}
        setPayload={(data) => updateBagPayload(0, data)}
        setMonitoringData={(rowIndex, colIndex, value) =>
          updateMonitoringTable(0, rowIndex, colIndex, value)
        }
      />
      <BloodTransfusioncomponent
        title={t("CHECKLIST BAG# 2")}
        payload={bagPayloads[1]}
        setPayload={(data) => updateBagPayload(1, data)}
        setMonitoringData={(rowIndex, colIndex, value) =>
          updateMonitoringTable(1, rowIndex, colIndex, value)
        }
      />
      <BloodTransfusioncomponent
        title={t("CHECKLIST BAG# 3")}
        payload={bagPayloads[2]}
        setPayload={(data) => updateBagPayload(2, data)}
        setMonitoringData={(rowIndex, colIndex, value) =>
          updateMonitoringTable(2, rowIndex, colIndex, value)
        }
      />
      <BloodTransfusioncomponent
        title={t("CHECKLIST BAG# 4")}
        payload={bagPayloads[3]}
        setPayload={(data) => updateBagPayload(3, data)}
        setMonitoringData={(rowIndex, colIndex, value) =>
          updateMonitoringTable(3, rowIndex, colIndex, value)
        }
      />
      <Accordion
        title={t("Blood Consent or Refusal")}
        defaultValue={true}
        className="mt-1"
      >
        <div className="row p-2">
          <label className="col-sm-12">
            <span className="BloodTransfussion mt-2">
              {t("Blood and Blood Products Transfusion Consent or Refusal")}
            </span>
          </label>
          <DatePicker
            className="custom-calendar"
            placeholder={VITE_DATE_FORMAT}
            lable={t("Date")}
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            name="fDate"
            id="fDate"
            value={payload?.fDate}
            showTime
            hourFormat="12"
            handleChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Doctor")}
            placeholder=""
            name="Doctor"
            id="Doctor"
            value={payload?.Doctor}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <p className="col-sm-8">
            has explained to me that I need or may need during treatment a
            transfusion of blood/or one of its products for the following
            reason(s):
          </p>
          <TextAreaInput
            lable={t("Family history")}
            placeholder=""
            className="w-100"
            id={"familyHistory"}
            name="familyHistory"
            value={payload?.familyHistory}
            maxLength={300}
            rows="3"
            onChange={handleChange}
            respclass="col-12"
          />
          <p className="col-sm-12">
            The doctor has explained to me in general what a blood transfusion
            is, the procedure that will be used, the benefits and possible risks
            of receiving a transfusion. Although all donors are carefully
            screened by medical history and laboratory for diseases, possible
            risks to include allergic reactions, infection, transfusion related
            acute lung injury and volume overload. No guarantees have been made
            to me that the transfusion will help me. There are no good
            alternatives to blood or blood products to help carry oxygen and
            provide the ability to clot. If the blood or blood product is
            required but refused, risks can include organ damage, and possible
            death.
          </p>
          <p className="col-sm-12 mt-2">
            I have had the opportunity to ask the doctor or any other healthcare
            professional any questions I might have; Therefore:
          </p>
        </div>
        <div className="container mt-4">
          <div className="row g-5 d-flex justify-content-center">
            <div className="col-md-5">
              <div className="consent-box p-3">
                <h5 className="text-center fw-bold mb-3">
                  {t("BLOOD TRANSFUSION CONSENT")}
                </h5>

                <p>
                  {t("I give my informed and voluntary consent to have the blood transfusion.")}
                </p>

                <label className="fw-bold">
                  {t("Patient Signature or Thumb Print:")}
                </label>
                <div className="hr-line mb-3"></div>

                <label className="fw-bold">
                  {t("The patient is unable to consent; therefore, I consent:")}
                </label>
                <TextAreaInput
                  lable={t("refuse")}
                  placeholder=""
                  className="w-100"
                  id={"consentReason"}
                  name="consentReason"
                  value={payload?.consentReason}
                  maxLength={300}
                  rows="2"
                  onChange={handleChange}
                  respclass="col-12"
                />

                <Input
                  type="text"
                  className="form-control"
                  lable={t("Print Name")}
                  placeholder=""
                  name="CPrintName"
                  id="CPrintName"
                  value={payload?.CPrintName}
                  respclass="col-12"
                  onChange={handleChange}
                />
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Relationship")}
                  placeholder=""
                  name="CRelationship"
                  id="CRelationship"
                  value={payload?.CRelationship}
                  respclass="col-12"
                  onChange={handleChange}
                />

                <p className="small">
                  {t("I have explained the procedure, including possible risks/consequences and alternative treatments.")}
                </p>

                <label className="fw-bold">{t("Doctors Signature:")}</label>
                <div className="hr-line mb-3"></div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="consent-box p-3">
                <h5 className="text-center fw-bold mb-3">
                  {t("BLOOD TRANSFUSION REFUSAL")}
                </h5>

                <p>
                  <b>{t("I DO NOT")}</b> consent to the transfusion. I have been
                  informed of and understand the risks associated with this
                  refusal, which may result in permanent injury or possible
                  death. I accept full responsibility for those risks.
                </p>

                <label className="fw-bold">
                  {t("Patient Signature or Thumb Print:")}
                </label>
                <div className="hr-line mb-3"></div>

                <label className="fw-bold">
                  {t("The patient is unable to consent; therefore, I refuse:")}
                </label>
                <TextAreaInput
                  lable={t("Refuse")}
                  placeholder=""
                  className="w-100"
                  id={"refuseReason"}
                  name="refuseReason"
                  value={payload?.refuseReason}
                  maxLength={300}
                  rows="2"
                  onChange={handleChange}
                  respclass="col-12"
                />

                <Input
                  type="text"
                  className="form-control"
                  lable={t("Print Name")}
                  placeholder=""
                  name="RPrintName"
                  id="RPrintName"
                  value={payload?.RPrintName}
                  respclass="col-12"
                  onChange={handleChange}
                />
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Relationship")}
                  placeholder=""
                  name="RefuseRelationship"
                  id="RefuseRelationship"
                  value={payload?.RefuseRelationship}
                  respclass="col-12"
                  onChange={handleChange}
                />

                <p className="small">
                  {t("I have explained the procedure, including possible risks/consequences and alternative treatments.")}
                </p>

                <label className="fw-bold">{t("Doctors Signature:")}</label>
                <div className="hr-line mb-3"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="row p-2 mt-4">
          <label className="col-sm-12">
            <span className="BloodTransfussion mt-2">
              {t("WHAT IS A BLOOD TRANSFUSION?")}
            </span>
          </label>
          <p className="p-2">
            A blood transfusion is a medical procedure that gives you blood
            components that your body needs to stay healthy. A needle is
            inserted into your vein for the blood to get in your body. There are
            several reasons why you might need a blood transfusion; your doctor
            will examine your case closely to determine whether a blood
            transfusion will be the right therapy for you.
          </p>
          <label className="col-sm-12">
            {t("Some reasons why you might need a blood transfusion include:")}
          </label>
          <div className="col-sm-12">
            <ul>
              <li>{t("If your clotting factors are low or not working normally.")}</li>
              <li>
                {t("If you have lost a considerable amount (more than 20%) of your total blood volume.")}
              </li>
              <li>{t("If your clotting factors are low or not working normally.")}</li>
            </ul>
          </div>
          <label className="col-sm-12">
            {t("Risks of NOT getting a blood transfusion include:")}
          </label>
          <div className="col-sm-12">
            <ul>
              <li>
                If you lose too much blood, your body cannot get enough oxygen
                and as a result, your vital organs such as the brain or heart
                are at risk for severe damage.
              </li>
              <li>
                Our team of experts are committed to providing you with the best
                outcome; this means weighing both the risks and benefits before
                using blood therapy.
              </li>
            </ul>
          </div>
          <label className="col-sm-12">
            {t("Risks of having a blood transfusion include:")}
          </label>
          <div className="col-sm-12">
            <ul>
              <li>
                <b>{t("Allergic reaction:")}</b> {t("usually mild and treatable. Severe allergic reactions are rare.")}
              </li>
              <li>
                <b>{t("Fever:")}</b> {t("a common reaction, however, not severe and easily treatable.")}
              </li>
              <li>
                <b>{t("Hemolytic reaction:")}</b> this happens when your immune system
                destroys donor red cells. These reactions can cause organ
                failure; however, are rare and can be treated.
              </li>
              <li>
                <b>{t("Infectious diseases:")}</b> Our laboratory screens blood
                carefully for infectious diseases. All donors are required to
                give their medical history.
              </li>
            </ul>
          </div>
        </div>
      </Accordion>
      <div className="mt-2  text-right">
        <button
          className=" btn-primary btn-sm px-5 ml-1 custom_save_button required-fields"
          type="submit"
          onClick={handleSave}
        >
          {isUpdate ? t("Update") : t("Save")}
        </button>
      </div>
      <BloodTransfusionMonitoringTable
        tbody={transfusionList}
        handleEdit={handleEdit}
      />
    </>
  );
};

export default BloodTransfusionMonitoring;
