import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import LabeledInput from "../formComponent/LabeledInput";
import moment from "moment";
import Tables from "../UI/customTable";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import { notify } from "../../utils/utils";
import {
  neurologicalBindDetailsApi,
  neurologicalSaveApi,
  neurologicalUpdateApi,
} from "../../networkServices/nursingWardAPI";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import TextAreaInput from "../formComponent/TextAreaInput";
import imageneuro from "../../assets/image/imageneuro.png";
const NeurologicalChart = ({ data }) => {
  const { t } = useTranslation();
  const { patientID, transactionID } = data;
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [form, setForm] = useState({
    id: 0,
    pupilsBody: 0,
    rdbEyeSide: "",
    eyeOpening: "",
    verbalAdult: "",
    bestMotorResponse: "",
    date: new Date(),
    time: "",
    glascow: "",
    risk: "",
    sluggish: "",
    noReaction: "",
    eyesClosed: "",
    aNormalPower1: "",
    aNormalPower2: "",
    aSevereWeakness1: "",
    aSevereWeakness2: "",
    aSpasticFlexion1: "",
    aSpasticFlexion2: "",
    aExtension1: "",
    aExtension2: "",
    aNoResponse1: "",
    aNoResponse2: "",
    lNormalPower1: "",
    lNormalPower2: "",
    lMildWeakness1: "",
    lMildWeakness2: "",
    lSpasticFlexion1: "",
    lSpasticFlexion2: "",
    lExtension1: "",
    lExtension2: "",
    lNoResponse1: "",
    lNoResponse2: "",
    createdBy: "",
    patientID: "",
    transactionID: "",
    eyeSide: "",
    eyeRemark: "",
    verbalRemark: "",
    motorRemark: "",
    aMildWeakness1: "",
    aMildWeakness2: "",
    lSevereWeakness1: "",
    lSevereWeakness2: "",
  });
  const THEAD = [
    { name: t("S.No.") },
    { name: t("EyeSide") },
    { name: t("EyeOpening") },
    { name: t("VerbalAdult") },
    { name: t("MotorResponse") },
    { name: t("Pupil Scale") },
    { name: t("Risk") },
    { name: t("Sluggish") },
    { name: t("NoReaction") },
    { name: t("EyesClosed") },
    { name: t("UHID") },
    { name: t("Date") },
    { name: t("Time") },
    { name: t("Edit") },
    { name: t("Print") },
  ];

  const eyeOpeningOptions = [
    { label: t("Spontaneous - 4"), value: 4 },
    { label: t("To Speech - 3"), value: 3 },
    { label: t("To Pain - 2"), value: 2 },
    { label: t("None - 1"), value: 1 },
  ];

  const verbalAdultOptions = [
    { label: t("Oriented - 5"), value: 5 },
    { label: t("Confused - 4"), value: 4 },
    { label: t("Inappropriate Words - 3"), value: 3 },
    { label: t("Incomprehensible Sounds - 2"), value: 2 },
    { label: t("No Response - 1"), value: 1 },
  ];

  const bestMotorResponseOptions = [
    { label: t("Obeys Commands - 6"), value: 6 },
    { label: t("Localizes Pain - 5"), value: 5 },
    { label: t("Withdraws from Pain - 4"), value: 4 },
    { label: t("Flexion to Pain - 3"), value: 3 },
    { label: t("Extension to Pain - 2"), value: 2 },
    { label: t("No Response - 1"), value: 1 },
  ];

  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleReactSelect = (name, option) => {
    setForm((prev) => ({
      ...prev,
      [name]: option ? option.value : "",
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        id: form.id || "",
        date: form.date ? moment(form.date).format("YYYY-MM-DD") : "",
        time: form.time || "",
        pupilsBody: Number(form.pupilsBody) || 0,
        eyeOpening: form.eyeOpening || "",
        verbalAdult: form.verbalAdult || "",
        bestMotorResponse: form.bestMotorResponse || "",
        glascow: form.glascow || "",
        risk: form.risk || "",
        sluggish: form.sluggish || "",
        noReaction: form.noReaction || "",
        eyesClosed: form.eyesClosed || "",
        aNormalPower1: form.aNormalPower1 || "",
        aNormalPower2: form.aNormalPower2 || "",
        aMildWeakness1: form.aMildWeakness1 || "",
        aMildWeakness2: form.aMildWeakness2 || "",
        aSevereWeakness1: form.aSevereWeakness1 || "",
        aSevereWeakness2: form.aSevereWeakness2 || "",
        aSpasticFlexion1: form.aSpasticFlexion1 || "",
        aSpasticFlexion2: form.aSpasticFlexion2 || "",
        aExtension1: form.aExtension1 || "",
        aExtension2: form.aExtension2 || "",
        aNoResponse1: form.aNoResponse1 || "",
        aNoResponse2: form.aNoResponse2 || "",
        lNormalPower1: form.lNormalPower1 || "",
        lNormalPower2: form.lNormalPower2 || "",
        lMildWeakness1: form.lMildWeakness1 || "",
        lMildWeakness2: form.lMildWeakness2 || "",
        lSevereWeakness1: form.lSevereWeakness1 || "",
        lSevereWeakness2: form.lSevereWeakness2 || "",
        lSpasticFlexion1: form.lSpasticFlexion1 || "",
        lSpasticFlexion2: form.lSpasticFlexion2 || "",
        lExtension1: form.lExtension1 || "",
        lExtension2: form.lExtension2 || "",
        lNoResponse1: form.lNoResponse1 || "",
        lNoResponse2: form.lNoResponse2 || "",
        eyeSide: form.eyeSide || "",
        eyeRemark: form.eyeRemark || "",
        verbalRemark: form.verbalRemark || "",
        motorRemark: form.motorRemark || "",
        createdBy: form.createdBy || "",
        patientID: patientID || "",
        transactionID: transactionID || "",
      };
      let res;
      if (isEdit) {
        res = await neurologicalUpdateApi(payload);
      } else {
        res = await neurologicalSaveApi(payload);
      }
      if (res?.success) {
        notify(
          isEdit ? "Updated successfully!" : "Saved successfully!",
          "success",
        );
        setForm({
          id: 0,
          pupilsBody: 0,
          rdbEyeSide: "",
          eyeOpening: "",
          verbalAdult: "",
          bestMotorResponse: "",
          date: new Date(),
          time: "",
          glascow: "",
          risk: "",
          sluggish: "",
          noReaction: "",
          eyesClosed: "",
          aNormalPower1: "",
          aNormalPower2: "",
          aSevereWeakness1: "",
          aSevereWeakness2: "",
          aSpasticFlexion1: "",
          aSpasticFlexion2: "",
          aExtension1: "",
          aExtension2: "",
          aNoResponse1: "",
          aNoResponse2: "",
          lNormalPower1: "",
          lNormalPower2: "",
          lMildWeakness1: "",
          lMildWeakness2: "",
          lSpasticFlexion1: "",
          lSpasticFlexion2: "",
          lExtension1: "",
          lExtension2: "",
          lNoResponse1: "",
          lNoResponse2: "",
          createdBy: "",
          patientID: "",
          transactionID: "",
          eyeSide: "",
          eyeRemark: "",
          verbalRemark: "",
          motorRemark: "",
          aMildWeakness1: "",
          aMildWeakness2: "",
          lSevereWeakness1: "",
          lSevereWeakness2: "",
        });

        setScores({
          eyeOpening: 0,
          verbalAdult: 0,
          bestMotorResponse: 0,
        });

        setIsEdit(false);

        fetchData();
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      console.error("SAVE ERROR:", error);
      notify(t("Something went wrong"), "error");
    }
  };

  const handleEdit = (item) => {
    debugger;
    const eye = Number(item.EyeOpening) || 0;
    const verbal = Number(item.VerbalAdult) || 0;
    const motor = Number(item.BestMotorResponse) || 0;
    debugger;
    setForm({
      id: item.ID || 0,
      date: item.Date ? new Date(item.Date) : new Date(),
      time: item.Time || "",
      pupilsBody: item.PupilsBody ?? 0,

      eyeOpening: eye,
      verbalAdult: verbal,
      bestMotorResponse: motor,

      glascow: item.Glascow || "",
      risk: item.Risk || "",
      sluggish: item.Sluggish || "",
      noReaction: item.NoReaction || "",
      eyesClosed: item.EyesClosed || "",

      eyeSide: item.EyeSide || "",
      eyeRemark: item.EyeRemark || "",
      verbalRemark: item.VerbalRemark || "",
      motorRemark: item.MotorRemark || "",

      createdBy: item.CreatedBy || "",
      patientID,
      transactionID,

      aNormalPower1: item?.ANormalPower1 || "",
      aNormalPower2: item?.ANormalPower2 || "",

      aMildWeakness1: item?.AMildWeakness1 || "",
      aMildWeakness2: item?.AMildWeakness2 || "",

      aSevereWeakness1: item?.ASevereWeakness1 || "",
      aSevereWeakness2: item?.ASevereWeakness2 || "",

      aSpasticFlexion1: item?.ASpasticFlexion1 || "",
      aSpasticFlexion2: item?.ASpasticFlexion2 || "",

      aExtension1: item?.AExtension1 || "",
      aExtension2: item?.AExtension2 || "",

      aNoResponse1: item?.ANoResponse1 || "",
      aNoResponse2: item?.ANoResponse2 || "",

      // ===== Legs =====
      lNormalPower1: item?.LNormalPower1 || "",
      lNormalPower2: item?.LNormalPower2 || "",

      lMildWeakness1: item?.LMildWeakness1 || "",
      lMildWeakness2: item?.LMildWeakness2 || "",

      lSevereWeakness1: item?.LSevereWeakness1 || "",
      lSevereWeakness2: item?.LSevereWeakness2 || "",

      lSpasticFlexion1: item?.LSpasticFlexion1 || "",
      lSpasticFlexion2: item?.LSpasticFlexion2 || "",

      lExtension1: item?.LExtension1 || "",
      lExtension2: item?.LExtension2 || "",

      lNoResponse1: item?.LNoResponse1 || "",
      lNoResponse2: item?.LNoResponse2 || "",
    });

    setScores({
      eyeOpening: eye,
      verbalAdult: verbal,
      bestMotorResponse: motor,
    });

    setIsEdit(true);
  };

  const fetchData = async () => {
    try {
      const res = await neurologicalBindDetailsApi(patientID, transactionID);

      if (res?.success && res?.data?.length > 0) {
        setTableData(res.data);

        const firstRow = res.data[0];

        setForm((prev) => ({
          ...prev,
          date: firstRow.Date ? new Date(firstRow.Date) : new Date(),
          time: firstRow.Time || "",
        }));
      } else {
        notify(res?.message || "No data found", "error");
        setTableData([]);
      }
    } catch (error) {
      console.error(error);
      notify(error?.message, "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };
  const eyeSide = [
    { label: t("Both Eye"), value: "Both" },
    { label: t("Right Eye"), value: "Right" },
    { label: t("Left Eye"), value: "Left" },
  ];

  const [scores, setScores] = useState({
    eyeOpening: 0,
    verbalAdult: 0,
    bestMotorResponse: 0,
  });

  const handleSelectWithScore = (name, option) => {
    const value = option ? option.value : "";

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setScores((prev) => ({
      ...prev,
      [name]: value || 0,
    }));
  };
  console.log(form);

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("NEUROLOGICAL CHART")} />
        <div className="row row-cols-lg-6 row-cols-md-3 row-cols-1 p-2">
          <DatePicker
            name="date"
            className="custom-calendar"
            lable={t("Date")}
            value={form.date}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />

          <LabeledInput
            label={t("Time")}
            name="time"
            value={form.time}
            onChange={handleChange}
          />
        </div>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <td style={{ width: "15%" }}>{t("Eye Opening")}</td>

              <td style={{ width: "15%" }}>
                <ReactSelect
                  id="eyeOpening"
                  name="eyeOpening"
                  value={form?.eyeSide}
                  placeholderName={t("Eye Side")}
                  removeIsClearable={true}
                  dynamicOptions={eyeSide}
                  handleChange={handleReactSelect}
                />
              </td>

              <td style={{ width: "25%" }}>
                <ReactSelect
                  name="eyeOpening"
                  dynamicOptions={eyeOpeningOptions}
                  id="eyeSide"
                  value={form?.eyeOpening}
                  placeholderName={t("Eye Opening")}
                  removeIsClearable={true}
                  handleChange={handleSelectWithScore}
                />
              </td>

              <td
                style={{
                  width: "10%",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {t("Score :")} {scores.eyeOpening}
              </td>

              <td style={{ width: "35%" }}>
                <TextAreaInput
                  id="eyeRemark"
                  placeholder=""
                  name="eyeRemark"
                  lable={t("Eyes closed by swelling -C")}
                  value={form?.eyeRemark}
                  rows={3}
                  maxLength="300"
                  onChange={handleChange}
                />
              </td>
            </tr>

            <tr>
              <td>{t("Verbal")}</td>

              <td></td>

              <td>
                <ReactSelect
                  name="verbalAdult"
                  id="verbalAdult"
                  placeholderName={t("Verbal Adult")}
                  dynamicOptions={verbalAdultOptions}
                  removeIsClearable={true}
                  value={form?.verbalAdult}
                  handleChange={handleSelectWithScore}
                />
              </td>

              <td
                style={{
                  width: "10%",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {t("Score :")} {scores.verbalAdult}
              </td>

              <td>
                <TextAreaInput
                  id="verbalRemark"
                  placeholder=""
                  name="verbalRemark"
                  lable={t("Endoctrachael tube or tracheostomy -T")}
                  value={form?.verbalRemark}
                  rows={3}
                  maxLength="300"
                  onChange={handleChange}
                />
              </td>
            </tr>

            <tr>
              <td>{t("Best Motor Response")}</td>

              <td></td>

              <td>
                <ReactSelect
                  name="bestMotorResponse"
                  id="bestMotorResponse"
                  removeIsClearable={true}
                  placeholderName={t("Best Motor Response")}
                  dynamicOptions={bestMotorResponseOptions}
                  value={form?.bestMotorResponse}
                  handleChange={handleSelectWithScore}
                />
              </td>

              <td
                style={{
                  width: "10%",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {t("Score :")} {scores.bestMotorResponse}
              </td>

              <td>
                <TextAreaInput
                  id="motorRemark"
                  placeholder=""
                  name="motorRemark"
                  lable={t("Usually record the test arm response")}
                  value={form?.motorRemark}
                  rows={3}
                  maxLength="300"
                  onChange={handleChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <table className="table table-bordered mt-3">
          <tbody>
            <tr>
              <td style={{ width: "30%", verticalAlign: "top" }}>
                <div className="d-flex align-items-center gap-3">
                  <b
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      minWidth: "60px",
                    }}
                  >
                    {t("Pupils")}
                  </b>

                  <Input
                    type="number"
                    className="form-control"
                    placeholder=""
                    lable="Pupil Scale (mm)"
                    name="pupilsBody"
                    value={form.pupilsBody}
                    onChange={handleChange}
                  />
                </div>
              </td>

              <td style={{ width: "70%" }}>
                <div className="d-flex gap-3 align-items-start">
                  <div className="text-center">
                    <img
                      src={imageneuro}
                      alt="Pupil Scale"
                      width="80"
                      height="200"
                    />
                  </div>

                  <table className="table table-bordered mb-0 w-100">
                    <tbody>
                      <tr>
                        <td style={{ width: "25%" }}>{t("Brisk ++")}</td>
                        <td style={{ width: "15%", textAlign: "center" }}>
                          {t("Right")}
                        </td>
                        <td style={{ width: "30%" }}>{t("Size - mm")}</td>
                        <td style={{ width: "30%" }}>
                          <Input
                            type="text"
                            className="form-control"
                            name="risk"
                            value={form.risk}
                            onChange={handleChange}
                          />
                        </td>
                      </tr>

                      <tr>
                        <td>{t("Sluggish --")}</td>
                        <td style={{ textAlign: "center" }}>{t("Left")}</td>
                        <td>{t("Size - mm")}</td>
                        <td>
                          <Input
                            type="text"
                            className="form-control"
                            name="sluggish"
                            value={form.sluggish}
                            onChange={handleChange}
                          />
                        </td>
                      </tr>

                      <tr>
                        <td>{t("No Reaction ++")}</td>
                        <td style={{ textAlign: "center" }}>{t("Right")}</td>
                        <td>{t("Size - mm")}</td>
                        <td>
                          <Input
                            type="text"
                            className="form-control"
                            name="noReaction"
                            value={form.noReaction}
                            onChange={handleChange}
                          />
                        </td>
                      </tr>

                      <tr>
                        <td>{t("Eyes Closed --")}</td>
                        <td style={{ textAlign: "center" }}>{t("Left")}</td>
                        <td>{t("Size - mm")}</td>
                        <td>
                          <Input
                            type="text"
                            className="form-control"
                            name="eyesClosed"
                            value={form.eyesClosed}
                            onChange={handleChange}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="table table-bordered mt-3">
          <tbody>
            <tr>
              <td
                style={{
                  width: "30%",
                  verticalAlign: "middle",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {t("Limb Movements")}
              </td>

              <td style={{ width: "70%", padding: 0 }}>
                <table className="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th colSpan={2}>
                        {/* Arms (record R or L to indicate side if Asymmetric) */}
                      </th>
                      <th style={{ width: "15%", textAlign: "center" }}>R</th>
                      <th style={{ width: "15%", textAlign: "center" }}>L</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={2}>{t("Normal Power")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aNormalPower1"
                          value={form.aNormalPower1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aNormalPower2"
                          value={form.aNormalPower2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Severe Weakness")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aSevereWeakness1"
                          value={form.aSevereWeakness1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aSevereWeakness2"
                          value={form.aSevereWeakness2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Mild Weakness")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aMildWeakness1"
                          value={form.aMildWeakness1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aMildWeakness2"
                          value={form.aMildWeakness2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Spastic Flexion")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aSpasticFlexion1"
                          value={form.aSpasticFlexion1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aSpasticFlexion2"
                          value={form.aSpasticFlexion2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Extension")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aExtension1"
                          value={form.aExtension1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aExtension2"
                          value={form.aExtension2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("No Response")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aNoResponse1"
                          value={form.aNoResponse1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="aNoResponse2"
                          value={form.aNoResponse2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th colSpan={2}>
                        {/* Legs (record R or L to indicate side if Asymmetric) */}
                      </th>
                      <th style={{ width: "15%", textAlign: "center" }}>R</th>
                      <th style={{ width: "15%", textAlign: "center" }}>L</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={2}>{t("Normal Power")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lNormalPower1"
                          value={form.lNormalPower1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lNormalPower2"
                          value={form.lNormalPower2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Severe Weakness")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lSevereWeakness1"
                          value={form.lSevereWeakness1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lSevereWeakness2"
                          value={form.lSevereWeakness2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Mild Weakness")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lMildWeakness1"
                          value={form.lMildWeakness1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lMildWeakness2"
                          value={form.lMildWeakness2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Spastic Flexion")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lSpasticFlexion1"
                          value={form.lSpasticFlexion1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lSpasticFlexion2"
                          value={form.lSpasticFlexion2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("Extension")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lExtension1"
                          value={form.lExtension1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lExtension2"
                          value={form.lExtension2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>{t("No Response")}</td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lNoResponse1"
                          value={form.lNoResponse1}
                          onChange={handleChange}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          className="form-control"
                          name="lNoResponse2"
                          value={form.lNoResponse2}
                          onChange={handleChange}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="col-12 d-flex justify-content-end mb-2 mt-2">
          <button className="btn btn-primary mr-2" onClick={handleSave}>
            {isEdit ? t("Update") : t("Save")}
          </button>

          {isEdit && (
            <button
              className="btn btn-secondary ms-2"
              onClick={() => {
                setIsEdit(false);
                setForm({
                  id: 0,
                  pupilsBody: 0,
                  rdbEyeSide: "",
                  eyeOpening: "",
                  verbalAdult: "",
                  bestMotorResponse: "",
                  date: new Date(),
                  time: "",
                  glascow: "",
                  risk: "",
                  sluggish: "",
                  noReaction: "",
                  eyesClosed: "",
                  aNormalPower1: "",
                  aNormalPower2: "",
                  aSevereWeakness1: "",
                  aSevereWeakness2: "",
                  aSpasticFlexion1: "",
                  aSpasticFlexion2: "",
                  aExtension1: "",
                  aExtension2: "",
                  aNoResponse1: "",
                  aNoResponse2: "",
                  lNormalPower1: "",
                  lNormalPower2: "",
                  lMildWeakness1: "",
                  lMildWeakness2: "",
                  lSpasticFlexion1: "",
                  lSpasticFlexion2: "",
                  lExtension1: "",
                  lExtension2: "",
                  lNoResponse1: "",
                  lNoResponse2: "",
                  createdBy: "",
                  patientID: "",
                  transactionID: "",
                  eyeSide: "",
                  eyeRemark: "",
                  verbalRemark: "",
                  motorRemark: "",
                  aMildWeakness1: "",
                  aMildWeakness2: "",
                  lSevereWeakness1: "",
                  lSevereWeakness2: "",
                });
              }}
            >
              {t("Cancel")}
            </button>
          )}
        </div>
      </div>

      {tableData.length > 0 && (
        <Tables
          thead={THEAD}
          tbody={tableData?.map((item, index) => ({
            "S.No.": index + 1,
            EyeSide: item?.EyeSide || "",
            EyeOpening: item?.EyeOpening || "",
            VerbalAdult: item?.VerbalAdult || "",
            MotorResponse: item?.BestMotorResponse || "",
            "Pupil Scale": item?.PupilsBody ?? "",
            Risk: item?.Risk || "",
            Sluggish: item?.Sluggish || "",
            NoReaction: item?.NoReaction || "",
            EyesClosed: item?.EyesClosed || "",
            UHID: item?.PatientID || "",
            Date: item?.Date1 || "",
            Time: item?.Time1 || "",
            Edit: (
              <i
                className="fa fa-edit text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => handleEdit(item)}
              />
            ),

            Print: (
              <i
                className="fa fa-print text-success"
                style={{ cursor: "pointer" }}
                onClick={handlePrint}
              />
            ),
          }))}
        />
      )}
    </div>
  );
};

export default NeurologicalChart;
