import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import { useTranslation } from "react-i18next";
import LabeledInput from "../formComponent/LabeledInput";
import {
  bindDataVENOUSApi,
  saveData1VENOUSApi,
  saveData2VENOUSApi,
  saveData3VENOUSApi,
  saveData4VENOUSApi,
  saveDataVENOUSApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const VenousThromboembolism = ({ data }) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { transactionID } = data;

  const [tableDataSaved, setTableDataSaved] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };
  const [isEditMode, setIsEditMode] = useState(false);
  const [editRowData, setEditRowData] = useState(null);

  const riskSections = [
    {
      title: t("Each Risk Factor Represents 1 Point"),
      point: 1,
      factors: [
        "Age 41–60 years",
        "Minor surgery planned",
        "History of prior major surgery",
        "Varicose veins",
        "History of inflammatory bowel disease",
        "Swollen legs (current)",
        "Obesity (BMI > 30)",
        "Acute myocardial infarction (< 1 month)",
        "Congestive heart failure (< 1 month)",
        "Sepsis (< 1 month)",
        "Serious lung disease incl. Pneumonia (< 1 month)",
        "Abnormal pulmonary function (COPD)",
        "Medical patient currently at bed rest",
        "Leg plaster cast or brace",
        "Other risk factors",
      ],
    },
    {
      title: t("Each Risk Factor Represents 2 Point"),
      point: 2,
      factors: [
        "Age 60–74 years",
        "Major Surgery (>60 minutes)",
        "Arthroscopic surgery (>60 minutes)",
        "Laparoscopic surgery (>60 minutes)",
        "Previous malignancy",
        "Central venous access",
        "Morbid obesity (BMI > 40)",
      ],
    },
    {
      title: t("Each Risk Factor Represents 3 Points"),
      point: 3,
      factors: [
        "Age over 75 years",
        "Major surgery lasting 2–3 hours",
        "BMI > 50 (venous stasis syndrome)",
        "History of SVT, DVT/PE",
        "Family history of DVT/PE",
        "Present cancer or chemotherapy",
        "Positive Factor V Leiden",
        "Positive Prothrombin 20210A",
        "Elevated serum homocysteine",
        "Positive Lupus anticoagulant",
        "Elevated anticardiolipin antibodies",
        "Heparin-induced thrombocytopenia (HIT)",
      ],
    },
  ];

  const otherThrombophiliaRows = [
    { type: "checkbox", label: t("Other thrombophilia") },
    { type: "input", label: t("Type") },
    { type: "section", label: t("Each Risk Factor Represents 5 Point") },
    {
      type: "risk",
      label: t("Elective major lower extremity arthroplasty"),
      point: 5,
    },
    {
      type: "risk",
      label: t("Hip, pelvis or leg fracture (< 1 month)"),
      point: 5,
    },
    { type: "risk", label: t("Stroke (< 1 month)"), point: 5 },
    { type: "risk", label: t("Multiple trauma (< 1 month)"), point: 5 },
    {
      type: "risk",
      label: t("Acute spinal cord injury (paralysis) (< 1 month)"),
      point: 5,
    },
    { type: "risk", label: t("Major surgery lasting over 3 hours"), point: 5 },
    { type: "section", label: t("For Women Only (Each Represents 1 Point)") },
    {
      type: "risk",
      label: t("Oral contraceptives or hormone replacement therapy"),
      point: 1,
    },
    { type: "risk", label: t("Pregnancy or postpartum (< 1 month)"), point: 1 },
    {
      type: "risk",
      label:
        "History of unexplained stillborn infant, recurrent spontaneous abortion (>=3), premature birth with toxemia or growth-restricted infant",
      point: 1,
    },
    { type: "total", label: t("Total Risk Factor Score") },
  ];
  const [payload, setPayload] = useState({
    weight: "",
    height: "",
    date: "",
    time: "",
    examiner: "",
    sign: "",
    nurseName: "",
  });

  const TABLEHEAD = [
    { name: t("S.No"), width: "3%" },
    { name: t("PatientID") },
    { name: t("CreatedBy") },
    { name: t("CreatedDatetime") },
    { name: t("Edit") },
  ];
  const [otherState, setOtherState] = useState(
    otherThrombophiliaRows.map(() => ({
      answer: "",
      score: "",
      checked: false,
      value: "",
    }))
  );

  const [riskState, setRiskState] = useState(
    riskSections.map((section) =>
      section.factors.map(() => ({
        checked: false,
        answer: 0,
        score: "",
      }))
    )
  );

  const riskAssessmentData = [
    {
      totalRiskFactor: "0-1",
      mortality: "<0.01%",
      incidenceOfDVT: "<10%",
      riskLevel: "Low risk",
      prophylaxisRegimen: "No specific measures early ambulation",
    },
    {
      totalRiskFactor: "2",
      mortality: "0.01-0.4%",
      incidenceOfDVT: "10-20%",
      riskLevel: "Moderate risk",
      prophylaxisRegimen: "ES, IPC, LDUH (5000U BID) or LMWH (>3400U)",
    },
    {
      totalRiskFactor: "3-4",
      mortality: "0.4-1.0%",
      incidenceOfDVT: "20-40%",
      riskLevel: "High risk",
      prophylaxisRegimen: "IPC, LDUH (5000U TID) or LMWH (>3400U)",
    },
    {
      totalRiskFactor: "≥5",
      mortality: "1-5%",
      incidenceOfDVT: "40-80%",
      riskLevel: "Highest risk",
      prophylaxisRegimen:
        "Pharmacological: LDUH, LMWH (>3400U*) Warfarin® or FxaI* alone or in combination with ES or IPC",
    },
  ];

  const anticoagulantsFactors = [
    "Is Patient experiencing any active bleeding?",
    "Does patient have (or has had a history of) heparin-induced thrombocytopenia?",
    "Is patient’s platelet count < 100,000/mm?",
    "Is the patient taking oral anticoagulants or platelet inhibitors (e.g., NSAIDs, Clopidogrel, Salicylates)?",
    "Is patient’s creatinine clearance abnormal? If yes, please indicate value.",
  ];

  const ipcFactors = [
    "Does patient have severe peripheral arterial disease?",
    "Does patient have congestive heart failure?",
    "Does patient have an acute superficial / deep vein thrombosis?",
  ];

  const VENOUS_FIELD_MAP = [
    { key: "age", section: 0, row: 0 },
    { key: "minorSurgery", section: 0, row: 1 },
    { key: "historyofprior", section: 0, row: 2 },
    { key: "varicoseveins", section: 0, row: 3 },
    { key: "history", section: 0, row: 4 },
    { key: "swollen", section: 0, row: 5 },
    { key: "obesity", section: 0, row: 6 },
    { key: "acute", section: 0, row: 7 },
    { key: "congestive", section: 0, row: 8 },
    { key: "sepsis", section: 0, row: 9 },
    { key: "seriouslung", section: 0, row: 10 },
    { key: "abnormal", section: 0, row: 11 },
    { key: "medicalpatient", section: 0, row: 12 },
    { key: "legplaster", section: 0, row: 13 },
    { key: "otherrisk", section: 0, row: 14 },
  ];

  const VENOUS1_FIELD_MAP = [
    { key: "age60", numericKey: "age60numericInput", section: 1, row: 0 },

    {
      key: "majorSurgery",
      numericKey: "MajorSurgery1numericInput",
      section: 1,
      row: 1,
    },

    {
      key: "arthroscopic",
      numericKey: "arthroscopicnumericInput",
      section: 1,
      row: 2,
    },
    {
      key: "laparoscopic",
      numericKey: "laparoscopicnumericInput",
      section: 1,
      row: 3,
    },
    { key: "previous", numericKey: "previousnumericInput", section: 1, row: 4 },
    { key: "central", numericKey: "centralnumericInput", section: 1, row: 5 },
    { key: "morbid", numericKey: "morbidnumericInput", section: 1, row: 6 },

    { key: "ageover", numericKey: "ageovernumericInput", section: 2, row: 0 },
    { key: "major", numericKey: "majornumericInput", section: 2, row: 1 },
    { key: "bmi", numericKey: "bmInumericInput", section: 2, row: 2 },
    {
      key: "historySVT",
      numericKey: "historySVTnumericInput",
      section: 2,
      row: 3,
    },
    {
      key: "familyHistory",
      numericKey: "familyHistorynumericInput",
      section: 2,
      row: 4,
    },
    {
      key: "presentCancer",
      numericKey: "presentCancernumericInput",
      section: 2,
      row: 5,
    },
    { key: "positive", numericKey: "positivenumericInput", section: 2, row: 6 },
    {
      key: "prothrombin",
      numericKey: "prothrombinnumericInput",
      section: 2,
      row: 7,
    },
    { key: "elevated", numericKey: "elevatednumericInput", section: 2, row: 8 },
    {
      key: "positiveLupus",
      numericKey: "positiveLupusnumericInput",
      section: 2,
      row: 9,
    },
    {
      key: "anticardiolipin",
      numericKey: "anticardiolipinnumericInput",
      section: 2,
      row: 10,
    },
    {
      key: "heparinInduced",
      numericKey: "heparinInducednumericInput",
      section: 2,
      row: 11,
    },
  ];
  const [riskAssessmentState, setRiskAssessmentState] = useState(
    riskAssessmentData.map(() => ({
      checked: false,
    }))
  );
  const resetForm = () => {
    setPayload({
      weight: "",
      height: "",
      date: "",
      time: "",
      examiner: "",
      sign: "",
      nurseName: "",
    });

    setRiskState(
      riskSections.map((section) =>
        section.factors.map(() => ({
          checked: false,
          answer: "",
          score: "",
        }))
      )
    );

    setOtherState(
      otherThrombophiliaRows.map(() => ({
        checked: false,
        answer: "",
        score: "",
        value: "",
      }))
    );

    setRiskAssessmentState(riskAssessmentData.map(() => ({ checked: false })));

    setAnticoagulantsState(
      anticoagulantsFactors.map(() => ({
        checked: false,
        yes: false,
        no: false,
      }))
    );

    setIpcState(
      ipcFactors.map(() => ({
        checked: false,
        yes: false,
        no: false,
      }))
    );
  };

  const toggleRiskAssessment = (index) => {
    setRiskAssessmentState((prev) =>
      prev.map((item, i) => ({
        checked: i === index ? !item.checked : false,
      }))
    );
  };

  const buildVenousPayload3 = () => {
    const payload3 = {
      id: isEditMode && editRowData?.id ? editRowData.id : "",
      patientID: data.patientID,
      transactionID: data.transactionID,
      weight4: payload.weight || "",
      height4: payload.height || "",
      date4: payload.date,
      time4: payload.time || "",
      one: "0",
      two: "0",
      three: "0",
      five: "0",
    };

    riskAssessmentState.forEach((item, index) => {
      if (item.checked) {
        if (index === 0) payload3.one = "1";
        if (index === 1) payload3.two = "1";
        if (index === 2) payload3.three = "1";
        if (index === 3) payload3.five = "1";
      }
    });

    return payload3;
  };

  const buildVenousPayload1 = () => {
    const payload1 = {
      id: isEditMode && editRowData?.id ? editRowData.id : "",
      patientID: data.patientID,
      transactionID: data.transactionID,
      weight1: payload.weight || "",
      height1: payload.height || "",
      date1: payload.date,
      time1: payload.time || "",
    };

    VENOUS1_FIELD_MAP.forEach(({ key, numericKey, section, row }) => {
      const rowData = riskState[section][row];

      payload1[key] = rowData.answer;
      payload1[`${key}1`] = rowData.checked ? 1 : 0;
      payload1[numericKey] = Number(rowData.score) || 0;
    });

    return payload1;
  };

  const buildVenousPayload = () => {
    const venousPayload = {
      id: isEditMode && editRowData?.id ? editRowData.id : "",
      patientID: data.patientID,
      transactionID: data.transactionID,
      weight: payload.weight,
      height: payload.height,
      date: payload.date,
      time: payload.time,
      nurseName: payload.nurseName,
      nurseDate: payload.date,
    };

    VENOUS_FIELD_MAP.forEach(({ key, section, row }) => {
      const rowData = riskState[section][row];

      venousPayload[key] = rowData.answer || "";
      venousPayload[`${key}1`] = rowData.checked ? 1 : 0;
      venousPayload[`${key}numericInput`] = Number(rowData.score) || 0;
    });

    return venousPayload;
  };

  const VENOUS2_FIELD_MAP = [
    {
      key: "otherThrombophilia",
      numericKey: "otherThrombophilianumericInput",
      row: 0,
    },
    { key: "type", row: 1 },

    { key: "elective", numericKey: "electivenumericInput", row: 3 },
    { key: "fracture", numericKey: "fracturenumericInput", row: 4 },
    { key: "stroke", numericKey: "strokenumericInput", row: 5 },
    { key: "multiple", numericKey: "multiplenumericInput", row: 6 },

    {
      key: "acutesp",
      altKey: "acute2",
      numericKey: "acute2numericInput",
      row: 7,
    },

    { key: "lasting", numericKey: "lastingnumericInput", row: 8 },
    { key: "oral", numericKey: "oralnumericInput", row: 10 },
    { key: "pregnancy", numericKey: "pregnancynumericInput", row: 11 },
    { key: "unexplained", numericKey: "unexplainednumericInput", row: 12 },
  ];
  const VENOUS4_ANTICOAGULANT_MAP = [
    { key: "active", row: 0 },
    { key: "hit", row: 1 },
    { key: "platelet", row: 2 },
    { key: "anticoagulants", row: 3 },
    { key: "creatinine", row: 4 },
  ];
  const VENOUS4_IPC_MAP = [
    { key: "peripheral", row: 0 },
    { key: "chf", row: 1 },
    { key: "dvt", row: 2 },
  ];

  const buildVenousPayload2 = () => {
    const payload2 = {
      id: isEditMode && editRowData?.id ? editRowData.id : "",
      patientID: data.patientID,
      transactionID: data.transactionID,
      weight3: payload.weight || "",
      height3: payload.height || "",
      date3: payload.date,
      time3: payload.time || "",
    };

    VENOUS2_FIELD_MAP.forEach(({ key, altKey, numericKey, row }) => {
      const rowData = otherState[row] || {};

      payload2[key] = rowData.answer || "";
      payload2[`${key}1`] = rowData.checked ? 1 : 0;

      if (altKey) {
        payload2[altKey] = rowData.answer || "";
        payload2[`${altKey}1`] = rowData.checked ? 1 : 0;
      }

      if (numericKey) {
        payload2[numericKey] =
          rowData.score !== "" && rowData.score !== null
            ? rowData.score.toString()
            : "0";
      }
    });

    payload2.totalnumericInput = otherState
      .reduce((sum, r) => sum + Number(r.score || 0), 0)
      .toString();

    return payload2;
  };

  const buildVenousPayload4 = () => {
    const payload4 = {
      id: isEditMode && editRowData?.id ? editRowData.id : "",
      patientID: data.patientID,
      transactionID: data.transactionID,

      weight5: payload.weight || "",
      height5: payload.height || "",
      date5: payload.date,
      time5: payload.time || "",

      examiner: payload.examiner || "",
      date6: payload.date,
      sign: payload.sign || "",
    };

    // 🔹 Anticoagulants
    VENOUS4_ANTICOAGULANT_MAP.forEach(({ key, row }) => {
      const rowData = anticoagulantsState[row];

      payload4[key] = rowData.yes ? "1" : rowData.no ? "0" : "";
      payload4[`${key}1`] = rowData.checked ? "1" : "0";
      payload4[`${key}numericInput`] = "0";
    });

    // 🔹 IPC
    VENOUS4_IPC_MAP.forEach(({ key, row }) => {
      const rowData = ipcState[row];

      payload4[key] = rowData.yes ? "1" : rowData.no ? "0" : "";
      payload4[`${key}1`] = rowData.checked ? "1" : "0";
      payload4[`${key}numericInput`] = "0";
    });

    return payload4;
  };

  const normalizeVenousResponse = (row) => {
    return {
      venous: {
        id: row.ID,
        weight: row.Weight,
        height: row.Height,
        date: row.Date,
        time: row.Time,
        nurseName: row.NurseName,
        nurseDate: row.NurseDate,
        age: row.Age,
        age1: row.Age1,
        ageScore: row.AgenumericInput,
        minorSurgery: row.MinorSurgery,
        minorSurgery1: row.MinorSurgery1,
        minorSurgeryScore: row.MinorSurgerynumericInput,
      },

      venous1: {
        weight1: row.Weight1,
        height1: row.Height1,
        date1: row.Date1,
        time1: row.Time1,
        age60: row.Age60,
        age60Score: row.Age60numericInput,
        majorSurgery: row.MajorSurgery1,
        majorSurgeryScore: row.MajorSurgery1numericInput,
      },

      venous2: {
        weight3: row.Weight3,
        height3: row.Height3,
        date3: row.Date3,
        time3: row.Time3,
        otherThrombophilia: row.OtherThrombophilia,
        otherThrombophiliaScore: row.OtherThrombophilianumericInput,
        elective: row.Elective,
        electiveScore: row.ElectivenumericInput,
        totalScore: row.TotalnumericInput,
      },

      venous3: {
        weight4: row.Weight4,
        height4: row.Height4,
        date4: row.Date4,
        time4: row.Time4,
        one: row.One,
        two: row.Two,
        three: row.Three,
        five: row.Five,
      },

      venous4: {
        weight5: row.Weight5,
        height5: row.Height5,
        date5: row.Date5,
        time5: row.Time5,
        examiner: row.Examiner,
        sign: row.Sign,
        active: row.Active,
        hit: row.HIT,
        platelet: row.Platelet,
        anticoagulants: row.Anticoagulants,
        creatinine: row.Creatinine,
        peripheral: row.Peripheral,
        chf: row.CHF,
        dvt: row.DVT,
      },
    };
  };

  const fetchData = async () => {
    const res = await bindDataVENOUSApi(transactionID);

    if (res?.success && Array.isArray(res.data)) {
      const latestTwo = res.data.slice(-2);

      setTableDataSaved(latestTwo);
    } else {
      notify(res?.message, "error");
      setTableDataSaved([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [anticoagulantsState, setAnticoagulantsState] = useState(
    anticoagulantsFactors.map(() => ({
      checked: false,
      yes: false,
      no: false,
    }))
  );

  const [ipcState, setIpcState] = useState(
    ipcFactors.map(() => ({
      checked: false,
      yes: false,
      no: false,
    }))
  );

  const updateAnswer = (sectionIndex, rowIndex, answer) => {
    setRiskState((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex
          ? section.map((row, rIdx) =>
              rIdx === rowIndex ? { ...row, answer } : row
            )
          : section
      )
    );
  };

  const toggleCheckbox = (sectionIndex, rowIndex) => {
    setRiskState((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex
          ? section.map((row, rIdx) =>
              rIdx === rowIndex ? { ...row, checked: !row.checked } : row
            )
          : section
      )
    );
  };
  const handleEdit = (row) => {
    const normalized = normalizeVenousResponse(row);

    setIsEditMode(true);
    setEditRowData(row);

    setPayload({
      weight: normalized.venous.weight || "",
      height: normalized.venous.height || "",
      date: normalized.venous.date || "",
      time: normalized.venous.time || "",
      examiner: normalized.venous4.examiner || "",
      sign: normalized.venous4.sign || "",
      nurseName: normalized.venous.nurseName || "",
    });

    setRiskState((prev) =>
      prev.map((section, sIdx) =>
        section.map((item, rIdx) => {
          const mapItem = VENOUS_FIELD_MAP.find(
            (m) => m.section === sIdx && m.row === rIdx
          );
          if (!mapItem) return item;

          return {
            checked: normalized.venous[`${mapItem.key}1`] === 1,
            answer: normalized.venous[mapItem.key] || "",
            score: normalized.venous[`${mapItem.key}Score`] || "",
          };
        })
      )
    );

    setOtherState((prev) =>
      prev.map((item, idx) => {
        const mapItem = VENOUS2_FIELD_MAP.find((m) => m.row === idx);
        if (!mapItem) return item;

        return {
          checked: normalized.venous2[`${mapItem.key}1`] === 1,
          answer: normalized.venous2[mapItem.key] || "",
          score: mapItem.numericKey ? normalized.venous2.totalScore : "",
          value: normalized.venous2.type || "",
        };
      })
    );

    // 🔹 Risk Assessment (1/2/3/5)
    setRiskAssessmentState([
      { checked: normalized.venous3.one === "1" },
      { checked: normalized.venous3.two === "1" },
      { checked: normalized.venous3.three === "1" },
      { checked: normalized.venous3.five === "1" },
    ]);

    // 🔹 Anticoagulants
    setAnticoagulantsState((prev) =>
      prev.map((item, index) => {
        const key = VENOUS4_ANTICOAGULANT_MAP[index].key;
        return {
          checked: Number(normalized.venous4[`${key}1`]) === 1,
          yes: Number(normalized.venous4[key]) === 1,
          no: Number(normalized.venous4[key]) === 0,
        };
      })
    );

    // 🔹 IPC
    setIpcState((prev) =>
      prev.map((item, index) => {
        const key = VENOUS4_IPC_MAP[index].key;
        return {
          checked: normalized.venous4[`${key}1`] === 1,
          yes: normalized.venous4[key] === 1,
          no: normalized.venous4[key] === 0,
        };
      })
    );
  };

  const handleSaveOrUpdate = async () => {
    try {
      const payloadMain = buildVenousPayload();
      const payloadOther = buildVenousPayload2();
      const payloadTwoThree = buildVenousPayload1();
      const payload3 = buildVenousPayload3();
      const payload4 = buildVenousPayload4();

      const res1 = await saveDataVENOUSApi(payloadMain);
      const res3 = await saveData1VENOUSApi(payloadTwoThree);
      const res2 = await saveData2VENOUSApi(payloadOther);
      const res4 = await saveData3VENOUSApi(payload3);
      const res5 = await saveData4VENOUSApi(payload4);

      if (
        res1?.success &&
        res2?.success &&
        res3?.success &&
        res4?.success &&
        res5?.success
      ) {
        notify(
          isEditMode
            ? "Venous data updated successfully"
            : "Venous data saved successfully",
          "success"
        );

        setIsEditMode(false);
        setEditRowData(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error(error);
      notify(t("Something went wrong"), "error");
    }
  };

  const getTableHead = (title) => [
    { name: title },
    { name: "Yes" },
    { name: "No" },
    { name: "Score" },
  ];

  const OTHER_THROMBO_HEAD = [
    { name: t("Risk Factor") },
    { name: t("Yes") },
    { name: t("No") },
    { name: t("Score") },
  ];

  const RISK_ASSESSMENT_HEAD = [
    { name: t("Total Risk Factor") },
    { name: t("Mortality") },
    { name: t("Incidence of DVT") },
    { name: t("Risk Level") },
    { name: t("Prophylaxis Regimen") },
  ];

  const PROPHYLAXIS_HEAD = [
    { name: t("Risk Factor") },
    { name: t("Yes") },
    { name: t("No") },
    { name: t("Score") },
  ];

  const otherTbody = otherThrombophiliaRows.map((row, index) => {
    if (row.type === "section") {
      return {
        "Risk Factor": <strong>{row.label}</strong>,
        Yes: "",
        No: "",
        Score: "",
      };
    }

    if (row.type === "checkbox") {
      return {
        "Risk Factor": (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Input
              type="checkbox"
              checked={otherState[index].checked}
              onChange={() => {
                const updated = [...otherState];
                updated[index].checked = !updated[index].checked;
                setOtherState(updated);
              }}
              style={{ marginRight: "8px" }}
            />
            <span>{row.label}</span>
          </div>
        ),
        Yes: (
          <input
            type="radio"
            name={`other-checkbox-${index}`}
            checked={otherState[index].answer === "yes"}
            onChange={() => {
              const updated = [...otherState];
              updated[index].answer = "yes";
              setOtherState(updated);
            }}
          />
        ),
        No: (
          <input
            type="radio"
            name={`other-checkbox-${index}`}
            checked={otherState[index].answer === "no"}
            onChange={() => {
              const updated = [...otherState];
              updated[index].answer = "no";
              setOtherState(updated);
            }}
          />
        ),

        Score: (
          <Input
            type="number"
            value={otherState[index].score}
            onChange={(e) => {
              const updated = [...otherState];
              updated[index].score = e.target.value;
              setOtherState(updated);
            }}
            style={{ minWidth: "70px" }}
          />
        ),
      };
    }

    if (row.type === "input") {
      return {
        "Risk Factor": (
          <div style={{ display: "flex", alignItems: "center" }}>
            <strong style={{ marginRight: "8px" }}>{row.label}:</strong>
            <Input
              placeholder={t("Enter type here")}
              value={otherState[index].value}
              onChange={(e) => {
                const updated = [...otherState];
                updated[index].value = e.target.value;
                setOtherState(updated);
              }}
            />
          </div>
        ),
        Yes: "",
        No: "",
        Score: "",
      };
    }

    if (row.type === "total") {
      return {
        "Risk Factor": <strong>{row.label}</strong>,
        Yes: "",
        No: "",
        Score: <Input type="number" style={{ minWidth: "70px" }} />,
      };
    }

    return {
      "Risk Factor": (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Input type="checkbox" style={{ marginRight: "8px" }} />
          <span>{row.label}</span>
        </div>
      ),
      Yes: (
        <input
          type="radio"
          name={`other-${index}`}
          onChange={() => {
            const updated = [...otherState];
            updated[index].score = row.point;
            setOtherState(updated);
          }}
        />
      ),
      No: (
        <input
          type="radio"
          name={`other-${index}`}
          onChange={() => {
            const updated = [...otherState];
            updated[index].score = 0;
            setOtherState(updated);
          }}
        />
      ),
      Score: (
        <Input
          type="number"
          value={otherState[index].score}
          style={{ minWidth: "70px" }}
        />
      ),
    };
  });

  const riskAssessmentTbody = riskAssessmentData.map((item, index) => ({
    "Total Risk Factor": (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input
          type="checkbox"
          checked={riskAssessmentState[index].checked}
          onChange={() => toggleRiskAssessment(index)}
          style={{ marginRight: "8px" }}
        />
        <span>{item.totalRiskFactor}</span>
      </div>
    ),
    Mortality: item.mortality,
    "Incidence of DVT": item.incidenceOfDVT,
    "Risk Level": item.riskLevel,
    "Prophylaxis Regimen": item.prophylaxisRegimen,
  }));

  const anticoagulantsTbody = anticoagulantsFactors.map((label, index) => ({
    "Risk Factor": (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input
          type="checkbox"
          style={{ marginRight: "8px" }}
          checked={anticoagulantsState[index].checked}
          onChange={() => {
            const updated = [...anticoagulantsState];
            updated[index].checked = !updated[index].checked;
            setAnticoagulantsState(updated);
          }}
        />
        <span>{label}</span>
      </div>
    ),
    Yes: (
      <input
        type="radio"
        name={`anticoagulants-${index}`}
        checked={anticoagulantsState[index].yes}
        onChange={() => {
          const updated = [...anticoagulantsState];
          updated[index].yes = true;
          updated[index].no = false;
          setAnticoagulantsState(updated);
        }}
      />
    ),
    No: (
      <input
        type="radio"
        name={`anticoagulants-${index}`}
        checked={anticoagulantsState[index].no}
        onChange={() => {
          const updated = [...anticoagulantsState];
          updated[index].no = true;
          updated[index].yes = false;
          setAnticoagulantsState(updated);
        }}
      />
    ),
    Score: <Input type="number" style={{ minWidth: "70px" }} />,
  }));

  const ipcTbody = ipcFactors.map((label, index) => ({
    "Risk Factor": (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input
          type="checkbox"
          style={{ marginRight: "8px" }}
          checked={ipcState[index].checked}
          onChange={() => {
            const updated = [...ipcState];
            updated[index].checked = !updated[index].checked;
            setIpcState(updated);
          }}
        />
        <span>{label}</span>
      </div>
    ),
    Yes: (
      <input
        type="radio"
        name={`ipc-${index}`}
        checked={ipcState[index].yes}
        onChange={() => {
          const updated = [...ipcState];
          updated[index].yes = true;
          updated[index].no = false;
          setIpcState(updated);
        }}
      />
    ),
    No: (
      <input
        type="radio"
        name={`ipc-${index}`}
        checked={ipcState[index].no}
        onChange={() => {
          const updated = [...ipcState];
          updated[index].no = true;
          updated[index].yes = false;
          setIpcState(updated);
        }}
      />
    ),
    Score: <Input type="number" style={{ minWidth: "70px" }} />,
  }));

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card p-3">
        <Heading title={t("Venous Thromboembolism")} />

        <div className="row row-cols-lg-6 row-cols-md-3 row-cols-1 p-2">
          <Input
            lable={t("Weight")}
            className="form-control"
            name="weight"
            id="weight"
            placeholder=""
            value={payload.weight}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <Input
            lable={t("Height")}
            className="form-control"
            name="height"
            id="height"
            placeholder=""
            value={payload.height}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <LabeledInput
            label={t("Time")}
            name="time"
            value={payload.time}
            handleChange={handleChange}
          />
          <DatePicker
            lable={t("Date")}
            id="date"
            name="date"
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            value={payload?.date}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />
        </div>
      </div>

      {riskSections.map((section, sectionIndex) => {
        const tbody = section.factors.map((label, rowIndex) => ({
          "Risk Factor": (
            <div className="d-flex align-items-center">
              <Input
                type="checkbox"
                checked={riskState[sectionIndex][rowIndex].checked}
                onChange={() => toggleCheckbox(sectionIndex, rowIndex)}
                style={{ marginRight: "8px" }}
              />
              <span className="ms-2">{label}</span>
            </div>
          ),
          Yes: (
            <input
              type="radio"
              name={`yes-${sectionIndex}-${rowIndex}`}
              checked={riskState[sectionIndex][rowIndex].answer === 1}
              onChange={() => updateAnswer(sectionIndex, rowIndex, 1)}
            />
          ),
          No: (
            <input
              type="radio"
              name={`yes-${sectionIndex}-${rowIndex}`}
              checked={riskState[sectionIndex][rowIndex].answer === 0}
              onChange={() => updateAnswer(sectionIndex, rowIndex, 0)}
            />
          ),

          Score: (
            <Input
              type="number"
              className="table-input"
              value={riskState[sectionIndex][rowIndex].score}
              onChange={(e) => {
                const value = e.target.value;
                setRiskState((prev) =>
                  prev.map((section, sIdx) =>
                    sIdx === sectionIndex
                      ? section.map((row, rIdx) =>
                          rIdx === rowIndex ? { ...row, score: value } : row
                        )
                      : section
                  )
                );
              }}
              removeFormGroupClass
            />
          ),
        }));

        return (
          <div key={section.title}>
            <Heading title={t(section.title)} />
            <Tables thead={getTableHead(section.title)} tbody={tbody} />
          </div>
        );
      })}

      <Heading title={t("OTHER THROMBOPHILIA")} />
      <Tables thead={OTHER_THROMBO_HEAD} tbody={otherTbody} />

      <div className="mt-4">
        <Heading title={t("RISK AND SUGGESTED PROPHYLAXIS FOR SURGICAL PATIENTS")} />
        <Tables thead={RISK_ASSESSMENT_HEAD} tbody={riskAssessmentTbody} />
      </div>

      <div className="mt-4">
        <Heading
          title="PROPHYLAXIS SAFETY CONSIDERATIONS: Check box if answer is ‘YES’
ANTICOAGULANTS: Factors associated with Increased Bleeding"
        />

        <div className="mb-3">
          <Tables thead={PROPHYLAXIS_HEAD} tbody={anticoagulantsTbody} />
        </div>

        <div className="mt-4">
          <h5 style={{ color: "black" }}>
            {t("Intermittent Pneumatic Compression (IPC)")}
          </h5>
          <Tables thead={PROPHYLAXIS_HEAD} tbody={ipcTbody} />
        </div>
        <h5 style={{ color: "black" }}>
          If any of the above boxes are checked, then patient may not be a
          candidate for intermittent compression therapy and you should consider
          alternative prophylactic measures.{" "}
        </h5>
      </div>
      <div className="row row-cols-lg-6 row-cols-md-3 row-cols-1 p-2">
        <Input
          lable={t("Examiner")}
          className="form-control"
          name="examiner"
          id="examiner"
          placeholder=""
          value={payload.examiner}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-12"
        />
        <DatePicker
          lable={t("Date")}
          placeholder={VITE_DATE_FORMAT}
          className="custom-calendar"
          value={payload.date}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-12"
        />
        <Input
          lable={t("Sign")}
          className="form-control"
          name="sign"
          id="sign"
          placeholder=""
          value={payload.sign}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-12"
        />
        <Input
          lable={t("Nurse Name")}
          className="form-control"
          name="nurseName"
          id="nurseName"
          placeholder=""
          value={payload.nurseName}
          onChange={handleChange}
          respclass="col-xl-2 col-md-4 col-12"
        />
      </div>
      <div className="col-12 d-flex justify-content-end mb-2">
        <button
          type="button"
          className={`btn ${isEditMode ? "btn-warning" : "btn-primary"} mr-2`}
          onClick={handleSaveOrUpdate}
        >
          {isEditMode ? t("Update") : t("Save")}
        </button>
      </div>
      <Tables
        thead={TABLEHEAD}
        tbody={tableDataSaved?.map((item, index) => ({
          "S.No": index + 1,
          PatientID: item?.patientID || "",
          CreatedBy: item?.NAME || "",
          CreatedDatetime: item?.CreatedDatetime || "",
          Edit: (
            <i
              className="fa fa-edit p-1"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => handleEdit(item)}
            />
          ),
        }))}
      />
    </div>
  );
};

export default VenousThromboembolism;
