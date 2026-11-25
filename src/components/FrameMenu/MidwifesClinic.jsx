import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import TextAreaInput from "../formComponent/TextAreaInput";
import "./obstetricRecord.css";
import {
  getObstetricRecordFormsApi,
  saveOrUpdateObstetricRecordFormsApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import Tables from "../UI/customTable";
import CustomSelect from "../formComponent/CustomSelect";

const MidwifesClinic = ({ data, section }) => {
  const { t } = useTranslation();
  const { transactionID } = data;
  const admissionChecklist = [
    {
      left: "Admission Form",
      right: "Admitting Doctor Informed",
    },
    {
      left: "ID Band Given",
      right: "Ward Orientation Routine",
    },
    {
      left: "Urinalysis",
      right: "Allergy Form Filled",
    },
    {
      left: "Admission Book Entry",
      right: "Medication Commenced",
    },
    {
      left: "Investigation Commenced",
      right: "Menu Filled",
    },
    {
      left: "Patient relatives informed of NHIF, insurance letters etc",
      right: "Valuables Forms Filled",
    },
  ];

  const CHECKLIST_MAP = [
    { left: ["adM1", "adM2", "adM3"], right: ["adI1", "adI2", "adI3"] },
    {
      left: ["ldbanD1", "ldbanD2", "ldbanD3"],
      right: ["ward1", "ward2", "ward3"],
    },
    {
      left: ["urinalysiS1", "urinalysiS2", "urinalysiS3"],
      right: ["allergY1", "allergY2", "allergY3"],
    },
    {
      left: ["admBook1", "admBook2", "admBook3"],
      right: ["medicatioN1", "medicatioN2", "medicatioN3"],
    },
    {
      left: ["investigatioN1", "investigatioN2", "investigatioN3"],
      right: ["menU1", "menU2", "menU3"],
    },
    {
      left: ["patienT1", "patienT2", "patienT3"],
      right: ["valuableS1", "valuableS2", "valuableS3"],
    },
  ];

  const mapChecklistToPayload = (state = {}) => {
    const payload = {};

    CHECKLIST_MAP.forEach((row, index) => {
      const leftVal = state[`${index}_left`];
      const rightVal = state[`${index}_right`];

      row.left.forEach((key, i) => {
        payload[key] = leftVal === i ? 1 : 0;
      });

      row.right.forEach((key, i) => {
        payload[key] = rightVal === i ? 1 : 0;
      });
    });

    return payload;
  };

  const handleChecklistSelect = (key, value) => {
    setChecklistState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const [initialState, setInitialState] = useState({
    transactionID: "",
    patientID: "",
    id: "",
    weight: "",
    bp: "",
    pulse: "",
    temp: "",
    urinalysis: "",
    colour: "",
    specificgravity: "",
    ph: "",
    albumin: "",
    sugar: "",
    blood: "",
    ketones: "",

    turobilinogen: "",
    leucocytes: "",
    head: "",
    neck: "",
    eyes: "",
    ears: "",
    teeth: "",
    breast: "",

    chest: "",
    axilla: "",
    size: "",
    shape: "",
    scar: "",

    skin: "",
    fundalheight: "",
    lie: "",
    presentingpar: "",
    position: "",
    deepPalvicPalPation: "",
    engagement: "",

    subsequent: "",
    foetalheartrate: "",
    sonicaid: "",

    feroscope: "",
    external: "",
    herpes: "",
    warps: "",
    haemp: "",
    anyother: "",

    vericoseveins1: "",
    oedema: "",
    vericoseveins: "",
    space: "",
    space1: "",
    adM1: "",
    adM2: "",
    adM3: "",
    adI1: "",
    adI2: "",
    adI3: "",
    ldbanD1: "",
    ldbanD2: "",
    ldbanD3: "",
    ward1: "",
    ward2: "",
    ward3: "",
    urinalysiS1: "",
    urinalysiS2: "",
    urinalysiS3: "",
    allergY1: "",
    allergY2: "",
    allergY3: "",
    admBook1: "",
    admBook2: "",
    admBook3: "",
    medicatioN1: "",
    medicatioN2: "",
    medicatioN3: "",
    investigatioN1: "",
    investigatioN2: "",
    otherabnorm: "",
    investigatioN3: "",
    menU1: "",
    menU2: "",
    menU3: "",
    patienT1: "",
    patienT2: "",
    patienT3: "",
    valuableS1: "",
    valuableS2: "",
    valuableS3: "",
    comment: "",
  });

  const Updatedthead = [
    { name: t("S.No."), width: "4%" },
    { name: t("Transaction No"), width: "30%" },
    { name: t("Patient ID") },
    { name: t("Edit"), width: "4%" },
  ];
  const [payload, setPayload] = useState(initialState);
  const [listData, setListData] = useState([]);
  const [checklistState, setChecklistState] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: String(value),
    }));
  };
  const yesNoOptions = [
    { label: t("Yes"), value: 0 },
    { label: t("No"), value: 1 },
    { label: "N/A", value: 2 },
  ];

  const THEADS = [
    { name: t("Admission Checklist (If No Please Comment)") },
    { name: t("Left") },

    {
      name: (
        <Input
          className="form-control"
          placeholder={t("Comment")}
          name="space"
          value={payload?.space}
          onChange={handleChange}
        />
      ),
    },

    { name: t("Checklist Right") },
    { name: t("Right") },

    {
      name: (
        <Input
          className="form-control"
          placeholder={t("Comment")}
          name="space1"
          value={payload.space1}
          onChange={handleChange}
        />
      ),
    },
  ];

  const handleReactSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: String(val?.value ?? ""),
    }));
  };

  const fetchListDta = async () => {
    try {
      const res = await getObstetricRecordFormsApi({
        TransactionId: transactionID,
        SectionType: section,
      });

      if (res?.success && res?.data?.midwifeClinic) {
        setListData(res.data.midwifeClinic);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const mapChecklistFromApi = (apiData = {}) => {
    const state = {};

    CHECKLIST_MAP.forEach((row, index) => {
      let leftSelected = null;
      row.left.forEach((key, i) => {
        if (String(apiData[key]) === "1") leftSelected = i;
      });
      state[`${index}_left`] = leftSelected;

      let rightSelected = null;
      row.right.forEach((key, i) => {
        if (String(apiData[key]) === "1") rightSelected = i;
      });
      state[`${index}_right`] = rightSelected;
    });

    return state;
  };

  const handleEdit = (item) => {
    setPayload({
      ...initialState,
      ...item,
    });

    setChecklistState(mapChecklistFromApi(item));
  };

  const resetForm = () => {
    setPayload(initialState);
    setChecklistState({});
  };

  useEffect(() => {
    fetchListDta();
  }, []);
  useEffect(() => {
    setPayload((prev) => ({
      ...prev,
      section: "2",
    }));
  }, [data]);

  const handleSaveOrUpdate = async () => {
    const checklistPayload = mapChecklistToPayload(checklistState);

    console.log("CHECKLIST PAYLOAD:", checklistPayload);

    try {
      const reqBody = {
        sectionType: section,
        midwifeClinic: {
          TransactionID: String(data?.transactionID),
          PatientID: String(data?.patientID),
          Id: String(payload.id || "0"),

          Height: String(payload.height || ""),
          Weight: String(payload.weight || ""),
          BP: String(payload.bp || ""),
          Pulse: String(payload.pulse || ""),
          Temp: String(payload.temp || ""),
          Urinalysis: String(payload.urinalysis || ""),
          Colour: String(payload.colour || ""),
          Specificgravity: String(payload.specificgravity || ""),
          Ph: String(payload.ph || ""),
          Albumin: String(payload.albumin || ""),
          Sugar: String(payload.sugar || ""),
          Blood: String(payload.blood || ""),
          Ketones: String(payload.ketones || ""),
          Turobilinogen: String(payload.turobilinogen || ""),
          Leucocytes: String(payload.leucocytes || ""),

          Head: String(payload.head || ""),
          Neck: String(payload.neck || ""),
          Eyes: String(payload.eyes || ""),
          Ears: String(payload.ears || ""),
          Teeth: String(payload.teeth || ""),
          Breast: String(payload.breast || ""),
          Chest: String(payload.chest || ""),
          Axilla: String(payload.axilla || ""),

          Size: String(payload.size || ""),
          Shape: String(payload.shape || ""),
          Scar: String(payload.scar || ""),
          Skin: String(payload.skin || ""),

          Fundalheight: String(payload.fundalheight || ""),
          Lie: String(payload.lie || ""),
          Presentingpar: String(payload.presentingpar || ""),
          Position: String(payload.position || ""),
          DeepPalvicPalPation: String(payload.deepPalvicPalPation || ""),
          Engagement: String(payload.engagement || ""),
          Subsequent: String(payload.subsequent || ""),

          Foetalheartrate: String(payload.foetalheartrate || ""),
          Sonicaid: String(payload.sonicaid || ""),
          Feroscope: String(payload.feroscope || ""),

          External: String(payload.external || ""),
          Herpes: String(payload.herpes || ""),
          Warps: String(payload.warps || ""),
          Haemp: String(payload.haemp || ""),
          Anyother: String(payload.anyother || ""),

          Vericoseveins1: String(payload.vericoseveins1 || ""),
          Oedema: String(payload.oedema || ""),
          Vericoseveins: String(payload.vericoseveins || ""),
          Otherabnorm: String(payload.otherabnorm || ""),

          Space: String(payload.space || ""),
          Space1: String(payload.space1 || ""),

          ...Object.keys(checklistPayload).reduce((acc, key) => {
            acc[key] = String(checklistPayload[key]);
            return acc;
          }, {}),

          Comment: String(payload.comment || ""),
        },
      };

      const res = await saveOrUpdateObstetricRecordFormsApi(reqBody);

      if (res?.success) {
        notify(res?.message, "success");

        fetchListDta();
        resetForm();
      } else {
        notify(res?.message || "Save failed", "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("Server error"), "error");
    }
  };

  return (
    <>
      <div className="px-2 mt-2">
        <Heading title={t("Antenatal Record")} />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("Midwife Height")}
          placeholder=""
          name="height"
          id="height"
          value={payload?.height}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Midwife Weight")}
          placeholder=""
          name="weight"
          id="weight"
          value={payload?.weight}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Blood Pressure")}
          placeholder=""
          name="bp"
          id="bp"
          value={payload?.bp}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Pulse")}
          placeholder=""
          name="pulse"
          id="pulse"
          value={payload?.pulse}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Temp")}
          placeholder=""
          name="temp"
          id="temp"
          value={payload?.temp}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Urinalysis")}
          placeholder=""
          name="urinalysis"
          id="urinalysis"
          value={payload?.urinalysis}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Colour")}
          placeholder=""
          name="colour"
          id="colour"
          value={payload?.colour}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("SpecificGravity")}
          placeholder=""
          name="specificgravity"
          id="specificgravity"
          value={payload?.specificgravity}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("PH")}
          placeholder=""
          name="ph"
          id="ph"
          value={payload?.ph}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Albumin")}
          placeholder=""
          name="albumin"
          id="albumin"
          value={payload?.albumin}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Sugar")}
          placeholder=""
          name="sugar"
          id="sugar"
          value={payload?.sugar}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Blood")}
          placeholder=""
          name="blood"
          id="blood"
          value={payload?.blood}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Ketones")}
          placeholder=""
          name="ketones"
          id="ketones"
          value={payload?.ketones}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Urobilinogen")}
          placeholder=""
          name="turobilinogen"
          id="turobilinogen"
          value={payload?.turobilinogen}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Leucocytes")}
          placeholder=""
          name="leucocytes"
          id="leucocytes"
          value={payload?.leucocytes}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
      </div>
      <div className="px-2">
        <Heading
          title={
            <>
              <div>{t("Physical examination on Admission")}</div>
              <div>{t("1. General")}</div>
            </>
          }
        />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("Head")}
          placeholder=""
          name="head"
          id="head"
          value={payload?.head}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Neck")}
          placeholder=""
          name="neck"
          id="neck"
          value={payload?.neck}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Eyes")}
          placeholder=""
          name="eyes"
          id="eyes"
          value={payload?.eyes}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Ears")}
          placeholder=""
          name="ears"
          id="ears"
          value={payload?.ears}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Teeth")}
          placeholder=""
          name="teeth"
          id="teeth"
          value={payload?.teeth}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Breast")}
          placeholder=""
          name="breast"
          id="breast"
          value={payload?.breast}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Chest")}
          placeholder=""
          name="chest"
          id="chest"
          value={payload?.chest}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Axilla")}
          placeholder=""
          name="axilla"
          id="axilla"
          value={payload?.axilla}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
      </div>
      <div className="px-2">
        <Heading
          title={
            <>
              <div>{t("2. Abdominal")}</div>
            </>
          }
        />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("Size")}
          placeholder=""
          name="size"
          id="size"
          value={payload?.size}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <ReactSelect
          placeholderName={t("Shape")}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id={"shape"}
          name="shape"
          value={payload?.shape}
          removeIsClearable={true}
          dynamicOptions={[
            { value: "0", label: t("Oval") },
            { value: "1", label: t("Pendulus") },
          ]}
          handleChange={handleReactSelect}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Scar")}
          placeholder=""
          name="scar"
          id="scar"
          value={payload?.scar}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Skin")}
          placeholder=""
          name="skin"
          id="skin"
          value={payload?.skin}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
      </div>
      <div className="px-2">
        <Heading
          title={
            <>
              <div>{t("3. Abdominal Palpation")}</div>
            </>
          }
        />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("Fundal Height")}
          placeholder=""
          name="fundalheight"
          id="fundalheight"
          value={payload?.fundalheight}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Lie")}
          placeholder=""
          name="lie"
          id="lie"
          value={payload?.lie}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("PresentingPart")}
          placeholder=""
          name="presentingpar"
          id="presentingpar"
          value={payload?.presentingpar}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Position")}
          placeholder=""
          name="position"
          id="position"
          value={payload?.position}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Deep Palvic Palpation")}
          placeholder=""
          name="deepPalvicPalPation"
          id="deepPalvicPalPation"
          value={payload?.deepPalvicPalPation}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Engagement in relation to the grim")}
          placeholder=""
          name="engagement"
          id="engagement"
          value={payload?.engagement}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Subsequent Anti-Natal Examination")}
          placeholder=""
          name="subsequent"
          id="subsequent"
          value={payload?.subsequent}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
      </div>
      <div className="px-2">
        <Heading
          title={
            <>
              <div>{t("4. Ausculation")}</div>
            </>
          }
        />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("Foetal Heart Rate")}
          placeholder=""
          name="foetalheartrate"
          id="foetalheartrate"
          value={payload?.foetalheartrate}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Sonicaid")}
          placeholder=""
          name="sonicaid"
          id="sonicaid"
          value={payload?.sonicaid}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Feroscope")}
          placeholder=""
          name="feroscope"
          id="feroscope"
          value={payload?.feroscope}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
      </div>
      <div className="px-2">
        <Heading
          title={
            <>
              <div>{t("5. Genetalia")}</div>
            </>
          }
        />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("External")}
          placeholder=""
          name="external"
          id="external"
          value={payload?.external}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />

        <Input
          type="text"
          className="form-control"
          lable={t("Haemorrhoids")}
          placeholder=""
          name="herpes"
          id="herpes"
          value={payload?.herpes}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("warps")}
          placeholder=""
          name="warps"
          id="warps"
          value={payload?.warps}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Haemorrhoids")}
          placeholder=""
          name="haemp"
          id="haemp"
          value={payload?.haemp}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />

        <Input
          type="text"
          className="form-control"
          lable={t("Any Other")}
          placeholder=""
          name="anyother"
          id="anyother"
          value={payload?.anyother}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Vericose Veins")}
          placeholder=""
          name="vericoseveins1"
          id="vericoseveins1"
          value={payload?.vericoseveins1}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
      </div>
      <div className="px-2">
        <Heading
          title={
            <>
              <div>{t("6. Lower Limbs")}</div>
            </>
          }
        />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("Oedema")}
          placeholder=""
          name="oedema"
          id="oedema"
          value={payload?.oedema}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Vericose veins")}
          placeholder=""
          name="vericoseveins"
          id="vericoseveins"
          value={payload?.vericoseveins}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Other Abnormalatiees")}
          placeholder=""
          name="otherabnorm"
          id="otherabnorm"
          value={payload?.otherabnorm}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          onChange={handleChange}
        />
      </div>
      <Tables
        thead={THEADS}
        tbody={admissionChecklist.map((row, index) => ({
          leftLabel: row.left,

          leftValue: (
            <CustomSelect
              option={yesNoOptions}
              value={checklistState[`${index}_left`]}
              onChange={(name, option) =>
                handleChecklistSelect(`${index}_left`, option?.value)
              }
              placeHolder="Select"
              isRemoveSearchable
            />
          ),

          leftComment: null,

          rightLabel: row.right,

          rightValue: (
            <CustomSelect
              option={yesNoOptions}
              value={checklistState[`${index}_right`]}
              onChange={(name, option) =>
                handleChecklistSelect(`${index}_right`, option?.value)
              }
              placeHolder="Select"
              isRemoveSearchable
            />
          ),

          rightComment: null,
        }))}
      />

      <div className="px-2 mt-2" >
        <TextAreaInput
          lable={t("COMMENT")}
          placeholder=""
          // className="w-100"
          name="comment"
          id="COMcommentMENT"
          value={payload?.comment}
          maxLength={100}
          onChange={handleChange}
          respclass="col-xl-12 col-md-4 col-sm-6 col-12 mb-2"
        />
      </div>
      <div className="row">
        <div className="col-sm-12 d-flex justify-content-end mb-2">
          <button
            className="btn btn-sm btn-success"
            onClick={handleSaveOrUpdate}
          >
            {payload?.id ? t("Update") : t("Save")}
          </button>
        </div>
      </div>
      <Tables
        thead={Updatedthead}
        tbody={listData.map((item, index) => ({
          SRrNo: index + 1,
          TransactionNo: item?.transactionID || data?.transactionID,
          PatientID: item?.patientID || data?.patientID,
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

export default MidwifesClinic;
