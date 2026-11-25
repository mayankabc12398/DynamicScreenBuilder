import React, { useEffect, useState } from "react";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { useTranslation } from "react-i18next";

import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import LabeledInput from "../formComponent/LabeledInput";
import Tables from "../UI/customTable";
import EcmoTables from "../UI/customTable/AnastheticOperativeTable/EcmoTable";
import { notify } from "../../utils/utils";
import moment from "moment";
import {
  getUserNameApi,
  jacksonVisualBindDetails,
  saveJacksonVisual,
  updateJacksonVisualApi,
} from "../../networkServices/nursingWardAPI";
import CustomSelect from "../formComponent/CustomSelect";
import { translateHead, translateOptions } from "@components/WrapTranslate";
const yesNoOptions = [
  { label: "YES", value: 1 },
  { label: "NO", value: 0 },
];

const vipScoreOptions = [
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
];

const tableHeadersForm = [
  "Record Date",
  "IV Catheter Insertion Date",
  "IV Line Location",
  "IV Catheter Patent",
  "IV Site Dressing Change Date",
  "VIP Score",
  "IV Catheter Required",
  "IV Catheter Removed Date",
  "Reason for IV Line Removal",
  "Name and Signature",
];

const initialRow = {
  recordDate: "",
  insertionDate: "",
  lineLocation: "",
  catheterPatent: null,
  dressingChangingDate: "",
  vipScore: null,
  catheterRequired: null,
  catheterRemved: "",
  lineRemoval: "",
  nameAndSignature: "",
  patientId: "",
};

const JackonVisual = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const localdata = useLocalStorage("userData", "get");
  const { t } = useTranslation();

  const { patientID, transactionID } = data;
  const employeeID =
    localdata?.employeeID ||
    localdata?.empID ||
    localdata?.EmpId ||
    localdata?.user?.empID ||
    null;

  const initialRow = {
    recordDate: "",
    insertionDate: "",
    lineLocation: "",
    catheterPatent: null,
    dressingChangingDate: "",
    vipScore: null,
    catheterRequired: null,
    catheterRemved: "",
    lineRemoval: "",
    nameAndSignature: "",
    patientId: "",
  };
  const [payload, setPayload] = useState({
    id: 0,
    patientName: "",
    age: "",
    kno: "",
    date: new Date(),
    scoreZero: null,
    scoreOne: null,
    scoreTwo: null,
    scoreThree: null,
    scoreFour: null,
    scoreFive: null,
    scoreZeroDay: "",
    scoreZeroNight: "",
    scoreOneDay: "",
    scoreOneNight: "",
    scoreTwoDay: "",
    scoreTwoNight: "",
    scoreThreeDay: "",
    scoreThreeNight: "",
    scoreFourDay: "",
    scoreFourNight: "",
    scorewithoutDay: "",
    scoreWithoutNight: "",
    scoreFiveDay: "",
    scoreFiveNight: "",
    patientId: "",
    transactionId: "",
  });

  const [eCMODetails, setECMODetails] = useState([initialRow]);
  const [tableDataSaved, setTableDataSaved] = useState([]);
  // const [isEdit, setIsEdit] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((val) => ({ ...val, [name]: value }));
  };
  const handleScoreCheck = (val, name) => {
    debugger;
    setPayload((prev) => ({
      ...prev,
      [name]: val ? val : 0,
    }));
  };

  const THEAD = [
    { name: t("S.No") },
    { name: t("Date") },
    { name: t("Rec Date") },
    { name: t("IV Ins Dt") },
    { name: t("IV Loc") },
    { name: t("Patent") },
    { name: t("Dress Dt") },
    { name: t("VIP") },
    { name: t("Req") },
    { name: t("Removed") },
    { name: t("Reason") },
    { name: t("Sign") },
    { name: t("Edit") },
  ];

  useEffect(() => {
    if (!employeeID || !data?.patientID) return;

    const fetchPatientDetails = async () => {
      try {
        const res = await getUserNameApi(employeeID, data.patientID);
        const user = res?.data?.[0];

        if (user) {
          setPayload((prev) => ({
            ...prev,
            patientName: user.PatientName || "",
            age: user.Age || "",
            kno: user.PatientID || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    };

    fetchPatientDetails();
  }, [employeeID, data?.patientID]);

  useEffect(() => {
    fetchJacksonTableData();
  }, []);

  const handleReactSelectChange = (name, val) => {
    debugger;
    setPayload((prev) => ({
      ...prev,
      [name]: val,
    }));
  };
  const handleCustomReactSelect = (name, val) => {
    debugger;
    setPayload((prev) => ({ ...prev, [name]: val }));
  };
  const handleInputChange = (index, field, value) => {
    const updatedRows = [...eCMODetails];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };
    setECMODetails(updatedRows);
  };

  const handleEdit = (item) => {
    debugger
    setPayload({
      id: item?.Id ?? 0,
      date: item?.Date ? new Date(item.Date) : null,

      scoreZero: item?.ScoreZero,
      scoreOne: item?.ScoreOne,
      scoreTwo: item?.ScoreTwo,
      scoreThree: item?.ScoreThree,
      scoreFour: item?.ScoreFour,
      scoreFive: item?.ScoreFive,

      scoreZeroDay: item?.ScoreZeroDay,
      scoreZeroNight: item?.ScoreZeroNight,
      scoreOneDay: item?.ScoreOneDay,
      scoreOneNight: item?.ScoreOneNight,
      scoreTwoDay: item?.ScoreTwoDay,
      scoreTwoNight: item?.ScoreTwoNight,
      scoreThreeDay: item?.ScoreThreeDay,
      scoreThreeNight: item?.ScoreThreeNight,
      scoreFourDay: item?.ScoreFourDay,
      scoreFourNight: item?.ScoreFourNight,
      scoreWithoutDay: item?.ScoreWithoutDay, // ✅ FIXED
      scoreWithoutNight: item?.ScoreWithoutNight,
      scoreFiveDay: item?.ScoreFiveDay,
      scoreFiveNight: item?.ScoreFiveNight,

      patientId: item?.PatientId,
      transactionId: item?.TransactionId,
    });

    setECMODetails([
      {
        recordDate: item?.RecordDate ? new Date(item.RecordDate) : null,
        insertionDate: item?.InsertionDate
          ? new Date(item.InsertionDate)
          : null,
        lineLocation: item?.LineLocation,
        catheterPatent: item?.CatheterPatent,
        dressingChangingDate: item?.DressingChangingDate
          ? moment(item.DressingChangingDate).format("DD-MMM-YYYY")
          : null,
        vipScore: item?.VIPScore,
        catheterRequired: item?.CatheterRequired,
        catheterRemved: item?.CatheterRemved
          ? new Date(item.CatheterRemved)
          : null,
        lineRemoval: item?.LineRemoval,
        nameAndSignature: item?.NameAndSignature,
        patientId: item?.PatientId,
      },
    ]);
  };

  const fetchJacksonTableData = async () => {
    const res = await jacksonVisualBindDetails(patientID, transactionID);

    if (res?.success) {
      setTableDataSaved(res?.data);
    } else {
      notify(res?.message, "error");
      setTableDataSaved([]);
    }
  };

  const handleSave = async () => {
    debugger;
    try {
      const apiPayload = {
        ...payload,

        date: payload.date
          ? moment(payload.date).format("DD-MMM-YYYY")
          : moment().format("DD-MMM-YYYY"),

        totalScore: 0,

        recordDate: eCMODetails[0]?.recordDate
          ? moment(eCMODetails[0].recordDate).format("DD-MMM-YYYY")
          : moment().format("DD-MMM-YYYY"),

        insertionDate: eCMODetails[0]?.insertionDate
          ? moment(eCMODetails[0].insertionDate).format("DD-MMM-YYYY")
          : moment().format("DD-MMM-YYYY"),

        dressingChangingDate: eCMODetails[0]?.dressingChangingDate
          ? moment(eCMODetails[0].dressingChangingDate).format("DD-MMM-YYYY")
          : moment().format("DD-MMM-YYYY"),

        catheterRemved: eCMODetails[0]?.catheterRemved
          ? moment(eCMODetails[0].catheterRemved).format("DD-MMM-YYYY")
          : moment().format("DD-MMM-YYYY"),

        lineLocation: eCMODetails[0]?.lineLocation || "",
        catheterPatent: eCMODetails[0]?.catheterPatent ?? 0,
        vipScore: eCMODetails[0]?.vipScore ?? 0,
        catheterRequired: eCMODetails[0]?.catheterRequired ?? 0,
        lineRemoval: eCMODetails[0]?.lineRemoval || "",
        nameAndSignature: eCMODetails[0]?.nameAndSignature || "",
        patientId: data?.patientID || "",
        transactionId: data?.transactionID || payload.transactionId || "",

        scoreZero: Number(payload.scoreZero ?? 0),
        scoreOne: Number(payload.scoreOne ?? 0),
        scoreTwo: Number(payload.scoreTwo ?? 0),
        scoreThree: Number(payload.scoreThree ?? 0),
        scoreFour: Number(payload.scoreFour ?? 0),
        scoreFive: Number(payload.scoreFive ?? 0),
      };

      let res;
      if (apiPayload?.id) {
        try {
          res = await updateJacksonVisualApi(apiPayload);
        } catch (error) {
          notify(error.message, "error");
        }
      } else {
        res = await saveJacksonVisual(apiPayload);
      }

      if (res?.success) {
        notify(res.message, "success");
        fetchJacksonTableData();

        setPayload({
          id: 0,
          patientName: "",
          age: "",
          kno: "",
          date: "",
          scoreZero: null,
          scoreOne: null,
          scoreTwo: null,
          scoreThree: null,
          scoreFour: null,
          scoreFive: null,
          scoreZeroDay: "",
          scoreZeroNight: "",
          scoreOneDay: "",
          scoreOneNight: "",
          scoreTwoDay: "",
          scoreTwoNight: "",
          scoreThreeDay: "",
          scoreThreeNight: "",
          scoreFourDay: "",
          scoreFourNight: "",
          scorewithoutDay: "",
          scoreWithoutNight: "",
          scoreFiveDay: "",
          scoreFiveNight: "",
          patientId: "",
          transactionId: "",
        });
        setECMODetails([initialRow]);
        // setIsEdit(false);
      } else {
        notify(res?.message || "Error saving data", "error");
      }
    } catch (err) {
      console.error("Error saving Jackson Visual:", err);
      notify(t("Error saving data"));
    }
  };
  const THEAD0 = [
    { name: t("Signs") },
    { name: t("Score") },
    { name: t("Clinical Criteria") },
    { name: t("DATE") },
  ];

  console.log(payload?.catheterPatent, "TESTSTSTSTS");

  const TBODY = [
    {
      Signs: "",
      Score: <></>,
      "Clinical Criteria": "",
      DATE: (
        <DatePicker
          lable={t("Date")}
          placeholder={VITE_DATE_FORMAT}
          className="custom-calendar"
          value={payload?.date}
          onChange={handleChange}
        />
      ),
    },

    {
      Signs: "a) Intravenous (IV) site appears healthy",
      Score: (
        <>
          <div className="d-flex align-items-center">
            <input
              type="checkbox"
              name="scoreZero"
              id="scoreZero"
              checked={payload?.scoreZero === 0}
              onChange={() => handleScoreCheck(0, "scoreZero")}
            />
            <label htmlFor={"scoreZero"} className="mx-2">
              0
            </label>
          </div>
        </>
      ),
      "Clinical Criteria": "No signs of phlebitis",
      DATE: (
        <div className="row p-2">
          <Input
            name="scoreZeroDay"
            id="scoreZeroDay"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreZeroDay}
            onChange={handleChange}
            placeholder={t("DAY")}
          />
          <Input
            name="scoreZeroNight"
            id="scoreZeroNight"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreZeroNight}
            onChange={handleChange}
            placeholder={t("NIGHT")}
          />
        </div>
      ),
    },

    {
      Signs: (
        <>
          {t("One of the following signs is evident")}
          <br />
          {t("a) Slight pain near IV site")}
          <br />
          {t("b) Slight redness near IV site")}
        </>
      ),
      Score: (
        <>
          <div className="d-flex align-items-center">
            <input
              type="checkbox"
              name="scoreOne"
              id="scoreOne"
              checked={payload?.scoreOne}
              onChange={() => handleScoreCheck(1, "scoreOne")}
            />

            <label htmlFor={"scoreOne"} className="mx-2">
              1
            </label>
          </div>
        </>
      ),
      "Clinical Criteria":
        "Possibility first signs of phlebitis • Observe cannula",
      DATE: (
        <div className="d-flex gap-2">
          <Input
            name="scoreOneDay"
            id="scoreOneDay"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreOneDay}
            onChange={handleChange}
            placeholder={t("DAY")}
          />
          <Input
            name="scoreOneNight"
            id="scoreOneNight"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreOneNight}
            onChange={handleChange}
            placeholder={t("NIGHT")}
          />
        </div>
      ),
    },

    {
      Signs: (
        <>
          {t("Two of the following signs are evident")}
          <br />
          {t("a) Pain at IV site")}
          <br />
          {t("b) Erythema")}
          <br />
          {t("c) Swelling")}
        </>
      ),
      Score: (
        <>
          <div className="d-flex align-items-center ">
            <input
              type="checkbox"
              name="scoreTwo"
              id="scoreTwo"
              checked={payload?.scoreTwo}
              onChange={() => handleScoreCheck(2, "scoreTwo")}
            />
            <label htmlFor={"scoreTwo"} className="mx-2">
              2
            </label>
          </div>
        </>
      ),
      "Clinical Criteria": "Early stage of phlebitis • Remove cannula",
      DATE: (
        <div className="d-flex gap-2">
          <Input
            name="scoreTwoDay"
            id="scoreTwoDay"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreTwoDay}
            onChange={handleChange}
            placeholder={t("DAY")}
          />
          <Input
            name="scoreTwoNight"
            id="scoreTwoNight"
            value={payload?.scoreTwoNight}
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            onChange={handleChange}
            placeholder={t("NIGHT")}
          />
        </div>
      ),
    },

    {
      Signs: (
        <>
          {t("All of the following signs are evident")}
          <br />
          {t("a) Pain along path of cannula")}
          <br />
          {t("b) Erythema")}
          <br />
          {t("c) Induration")}
        </>
      ),
      Score: (
        <>
          <div className="d-flex align-items-center">
            <input
              type="checkbox"
              name="scoreThree"
              id="scoreThree"
              checked={payload?.scoreThree}
              onChange={() => handleScoreCheck(3, "scoreThree")}
            />

            <label htmlFor={"scoreThree"} className="mx-3">
              3
            </label>
          </div>
        </>
      ),
      "Clinical Criteria": "Medium stage of evident phlebitis • Resite cannula",
      DATE: (
        <div className="d-flex gap-2">
          <Input
            name="scoreThreeDay"
            id="scoreThreeDay"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreThreeDay}
            onChange={handleChange}
            placeholder={t("DAY")}
          />
          <Input
            name="scoreThreeNight"
            id="scoreThreeNight"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreThreeNight}
            onChange={handleChange}
            placeholder={t("NIGHT")}
          />
        </div>
      ),
    },

    /* ===== SCORE 4 ===== */
    {
      Signs: (
        <>
          {t("All signs evident and extensive")}
          <br />
          {t("a) Pain along path")}
          <br />
          {t("b) Erythema")}
          <br />
          {t("c) Induration")}
          <br />
          {t("d) Palpable venous cord")}
        </>
      ),
      Score: (
        <>
          <div className="d-flex align-items-center">
            <input
              type="checkbox"
              name="scoreFour"
              id="scoreFour"
              checked={payload?.scoreFour}
              onChange={() => handleScoreCheck(4, "scoreFour")}
            />

            <label htmlFor={"scoreFour"} className="mx-2">
              4
            </label>
          </div>
        </>
      ),
      "Clinical Criteria":
        "Advanced stage of phlebitis / start of thrombophlebitis",
      DATE: (
        <div className="d-flex gap-2">
          <Input
            name="scoreFourDay"
            id="scoreFourDay"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreFourDay}
            onChange={handleChange}
            placeholder={t("DAY")}
          />
          <Input
            name="scoreFourNight"
            id="scoreFourNight"
            className={"form-control"}
            value={payload?.scoreFourNight}
            onChange={handleChange}
            placeholder={t("NIGHT")}
          />
        </div>
      ),
    },

    /* ===== SCORE 5 ===== */
    {
      Signs: (
        <>
          {t("All signs evident and extensive")}
          <br />
          {t("a) Pain along path")}
          <br />
          {t("b) Erythema")}
          <br />
          {t("c) Induration")}
          <br />
          {t("d) Palpable venous cord")}
          <br />
          {t("e) Pyrexia")}
        </>
      ),
      Score: (
        <>
          <div className="d-flex align-items-center">
            <input
              type="checkbox"
              name="scoreFive"
              id="scoreFive"
              checked={payload?.scoreFive}
              onChange={() => handleScoreCheck(5, "scoreFive")}
            />

            <label htmlFor={"scoreFive"} className="mx-2">
              5
            </label>
          </div>
        </>
      ),
      "Clinical Criteria":
        "Advanced stage of thrombophlebitis • Initiate treatment",
      DATE: (
        <div className="d-flex gap-2">
          <Input
            name="scoreFiveDay"
            id="scoreFiveDay"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreFiveDay}
            onChange={handleChange}
            placeholder={t("DAY")}
          />
          <Input
            name="scoreFiveNight"
            id="scoreFiveNight"
            className={"form-control me-2"}
            respclass={"col-xl-6 col-md-6 col-sm-6 col-12"}
            value={payload?.scoreFiveNight}
            onChange={handleChange}
            placeholder={t("NIGHT")}
          />
        </div>
      ),
    },

    /* ===== TOTAL SCORE ===== */
    {
      Signs: <strong>{t("TOTAL SCORE")}</strong>,
      Score: (
        <strong className="text-danger">
          {payload?.scoreZero +
            payload?.scoreOne +
            payload?.scoreTwo +
            payload?.scoreThree +
            payload?.scoreFour +
            payload?.scoreFive || 0}
        </strong>
      ),
      "Clinical Criteria": "",
      DATE: "",
    },
  ];

  const formatTableData = (data) =>
    data?.map((row, index) => ({
      "Record Date": (
        <DatePicker
          className="form-calender"
          value={row.recordDate}
          handleChange={(e) => handleInputChange(index, "recordDate", e.value)}
          placeholder={VITE_DATE_FORMAT}
          respclass={`bg-white`}
        />
      ),

      "IV Catheter Insertion Date": (
        <DatePicker
          className="form-calender"
          value={row.insertionDate}
          handleChange={(e) =>
            handleInputChange(index, "insertionDate", e.value)
          }
          placeholder={VITE_DATE_FORMAT}
          respclass={`bg-white`}
        />
      ),

      "IV Line Location": (
        <Input
          className="form-control form-calender"
          value={row?.lineLocation}
          onChange={(e) =>
            handleInputChange(index, "lineLocation", e.target.value)
          }
        />
      ),

      "IV Catheter Patent": (
        <ReactSelect
          placeholderName=""
          dynamicOptions={translateOptions(yesNoOptions, t)}
          removeIsClearable={true}
          id="catheterPatent"
          name="catheterPatent"
          value={payload?.catheterPatent}
          handleChange={handleReactSelectChange}
          respclass={`bg-white`}
        />
      ),

      "IV Site Dressing Change Date": (
        <DatePicker
          className="form-calender"
          value={row?.dressingChangingDate}
          handleChange={(e) =>
            handleInputChange(index, "dressingChangingDate", e.value)
          }
          placeholder={VITE_DATE_FORMAT}
          respclass={`bg-white`}
        />
      ),

      "VIP Score": (
        <ReactSelect
          placeholderName=""
          dynamicOptions={vipScoreOptions}
          removeIsClearable={true}
          id="vipScore"
          name="vipScore"
          value={row?.vipScore}
          handleChange={handleReactSelectChange}
          respclass={`bg-white`}
        />
      ),

      "IV Catheter Required": (
        <ReactSelect
          placeholderName=""
          dynamicOptions={translateOptions(yesNoOptions, t)}
          removeIsClearable={true}
          id="catheterRequired"
          name="catheterRequired"
          value={row?.catheterRequired}
          handleChange={handleReactSelectChange}
          respclass={`bg-white`}
        />
      ),

      "IV Catheter Removed Date": (
        <DatePicker
          className="form-calender"
          value={row.catheterRemved}
          handleChange={(e) =>
            handleInputChange(index, "catheterRemved", e.value)
          }
          placeholder={VITE_DATE_FORMAT}
          respclass={`bg-white`}
        />
      ),

      "Reason for IV Line Removal": (
        <Input
          className="form-control form-calender"
          name="nameAndSignature"
          id="nameAndSignature"
          value={row.lineRemoval}
          onChange={(e) =>
            handleInputChange(index, "lineRemoval", e.target.value)
          }
        />
      ),

      "Name and Signature": (
        <Input
          className="form-control form-calender"
          name="nameAndSignature"
          id="nameAndSignature"
          value={row.nameAndSignature}
          onChange={(e) =>
            handleInputChange(index, "nameAndSignature", e.target.value)
          }
        />
      ),
    }));

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading text={t("JACKSON's VISUAL INFUSION PHLEBITIS (VIP) SCORE")} />
        <Tables thead={THEAD0} tbody={TBODY} />
        <EcmoTables
          thead={translateHead(tableHeadersForm, t)}
          tbody={formatTableData(eCMODetails)}
        />
        <div className="col-12 mt-3 d-flex justify-content-end gap-2 mb-2">
          <button
            type="button"
            className="btn btn-primary mr-2"
            onClick={handleSave}
          >
            {payload?.id ? t("Update") : t("Save")}
          </button>
        </div>

        <Tables
          thead={THEAD}
          tbody={tableDataSaved?.map((item, index) => ({
            "S.No": index + 1,
            Date: moment(item?.Date).format("DD-MMM-YYYY") || "",
            "Rec Date": moment(item?.RecordDate).format("DD-MMM-YYYY") || "",
            "IV Ins Dt": moment(item?.InsertionDate).format("DD-MMM-YYYY") || "",
            "IV Loc": item?.LineLocation || "",
            Patent: Number(item?.CatheterPatent) === 1 ? "Yes" : "No",
            "Dress Dt": moment(item?.DressingChangingDate).format("DD-MMM-YYYY") || "",
            VIP: item?.VIPScore || "",
            Req: Number(item?.CatheterRequired) === 1 ? "Yes" : "No",
            Removed: item?.CatheterRemved || "",
            Reason: item?.LineRemoval || "",
            Sign: item?.CreatedBy || "",
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
    </div>
  );
};

export default JackonVisual;
