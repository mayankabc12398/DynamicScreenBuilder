import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import TextAreaInput from "../../../components/formComponent/TextAreaInput";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import {
  AlcoholConsumption_OPTION,
  EXPIRABLE_OPTION,
  MaritalStatus_OPTION,
} from "../../../utils/constant";
import Input from "../../../components/formComponent/Input";
import {
  GetBindDataSocialHistory,
  handleSaveOrUpdateSocialHistory,
} from "../../../networkServices/IVFCounsellingAPI";
import { notify } from "../../../utils/utils";
import Tables from "../../../components/UI/customTable";
import { translateOptions } from "@components/WrapTranslate";

const SocialHistory = (data) => {
  const { TransactionID, PatientID } = data?.patientDetail;
  console.log("datasssssssssssss", data);
  const [tableData, setTableData] = useState([]);
  const [t] = useTranslation();
  const [isupdate, setIsUpdate] = React.useState(false);
  const [payload, setPayload] = useState({
    SocialHistory: "",
    Smoking: "No",
    NumberofCigaretteDay: "",
    SmokeQuit: 0,
    Alcohol: "No",
    AlcoholConsumption: "",
    AlcoholQuit: 0,
    Tobaccobetalnutchewing: "No",
    Tobaccoremark: "",
    DrugAddiction: "No",
    DrugAddictionremark: "",
    Coffee: "No",
    Tea: "No",
    Exercise: "",
    Job: "",
    StressatWork: "",
    StressatHome: "",
    MaritalStatus: "Single",
  });

  const thead = [
    { name: t("S.No."), width: "4%" },
    { name: t("Smoking") },
    { name: t("Cigarette/Day") },
    { name: t("Smoking Quit") },
    { name: t("Alcohol") },
    { name: t("Alcohol Quit") },
    { name: t("Exercise") },
    { name: t("Job") },
    { name: t("Marital Status") },
    { name: t("Stress At Work") },
    { name: t("Stress At Home") },
  ];
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };
  const handleReactChange = (name, e) => {
    setPayload((val) => ({ ...val, [name]: e?.value }));
  };
  const handleSearch = async () => {
    try {
      const response = await GetBindDataSocialHistory(TransactionID);
      if (response?.success) {
        setTableData([response.data] || []);
      } else {
        notify(t("Failed to fetch counseling history"), "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSave = async () => {
    const reqBody = {
      transactionID: TransactionID ?? "",
      patientID: PatientID ?? "",
      psychoHistory: payload?.SocialHistory ?? "",
      smoking: payload?.Smoking ?? "",
      cigarettePerDay: payload?.NumberofCigaretteDay ?? "",
      smokeQuitWhen: payload?.SmokeQuit ?? "",
      alcohol: payload?.Alcohol ?? "",
      alcoholType: payload?.AlcoholConsumption ?? "",
      alcoholQuitWhen: payload?.AlcoholQuit ?? "",
      exercise: payload?.Exercise ?? "",
      job: payload?.Job ?? "",
      maritalStatus: payload?.MaritalStatus ?? "",
      stressAtWork: payload?.StressatWork ?? "",
      stressAtHome: payload?.StressatHome ?? "",
      tabacco: payload?.Tobaccobetalnutchewing ?? "",
      tabaccoDetail: payload?.Tobaccoremark ?? "",
      drugAddication: payload?.DrugAddiction ?? "",
      drugAddicationDetail: payload?.DrugAddictionremark ?? "",
      coffee: payload?.Coffee ?? "",
      tea: payload?.Tea ?? "",
      userID: payload?.PatientID ?? "",
    };

    try {
      const response = await handleSaveOrUpdateSocialHistory(reqBody);

      if (response?.success) {
        notify(response?.message, "success");
        handleSearch();
        getTemplateList(payload?.Header);
        setPayload((prev) => ({
          ...prev,
          AdmitDischargeDetail: "",
          Header: "",
          Templates: "",
          TempName: "",
          editorValue: "",
          saveType: "Save",
        }));
      } else {
        notify(response?.message, "danger");
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log(tableData);
  useEffect(() => {
    handleSearch();
  }, []);
  return (
    <div className="card">
      <Heading title={t("Social History")} />
      <div className="row p-2">
        <TextAreaInput
          type="text"
          id="SocialHistory"
          name="SocialHistory"
          rows={2}
          value={payload?.SocialHistory}
          onChange={handleChange}
          lable={t("Psycho/Social History")}
          placeholder=" "
          respclass="col-xl-6 col-sm-6 col-md-4 col-12"
          className="h-24"
        />
      </div>
      <div className="row px-2">
        <div className="col-sm-6">
          <div className="row">
            <ReactSelect
              placeholderName={t("Smoking")}
              searchable={true}
              respclass="col-xl-4 col-md-8 col-sm-12 col-12"
              id={"Smoking"}
              name={"Smoking"}
              removeIsClearable={true}
              handleChange={handleReactChange}
              dynamicOptions={translateOptions(EXPIRABLE_OPTION, t)}
              value={payload?.Smoking}
            />
            {payload?.Smoking === "Yes" && (
              <Input
                type="number"
                className="form-control"
                id="NumberofCigaretteDay"
                lable={t("Number of Cigarette/Day")}
                placeholder=" "
                required={true}
                value={payload?.NumberofCigaretteDay}
                respclass="col-xl-4 col-md-8 col-sm-12 col-12"
                name="NumberofCigaretteDay"
                onChange={handleChange}
              />
            )}
            <div className="col-sm-2 mt-2">
              <input
                type="checkbox"
                id="SmokeQuit"
                name={"SmokeQuit"}
                onChange={handleChange}
                checked={payload?.SmokeQuit}
              />
              <label htmlFor={"SmokeQuit"} className="ml-2">
                {t("Quit")}
              </label>
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="row">
            <ReactSelect
              placeholderName={t("Alcohol")}
              searchable={true}
              respclass="col-xl-4 col-md-8 col-sm-12 col-12"
              id={"Alcohol"}
              name={"Alcohol"}
              removeIsClearable={true}
              handleChange={handleReactChange}
              dynamicOptions={translateOptions(EXPIRABLE_OPTION, t)}
              value={payload?.Alcohol}
            />
            {payload?.Alcohol === "Yes" && (
              <ReactSelect
                placeholderName={t("Alcohol Consumption")}
                searchable={true}
                respclass="col-xl-4 col-md-8 col-sm-12 col-12"
                id={"AlcoholConsumption"}
                name={"AlcoholConsumption"}
                removeIsClearable={true}
                handleChange={handleReactChange}
                dynamicOptions={translateOptions(AlcoholConsumption_OPTION, t)}
                value={payload?.AlcoholConsumption}
              />
            )}
            <div className="col-sm-2 mt-2">
              <input
                type="checkbox"
                id="AlcoholQuit"
                name={"AlcoholQuit"}
                onChange={handleChange}
                checked={payload?.AlcoholQuit}
              />
              <label htmlFor={"AlcoholQuit"} className="ml-2">
                {t("Quit")}
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="row px-2">
        <div className="col-sm-6">
          <div className="row">
            <ReactSelect
              placeholderName={t("Tobacco, betal nut chewing")}
              searchable={true}
              respclass="col-xl-4 col-md-8 col-sm-12 col-12"
              id={"Tobaccobetalnutchewing"}
              name={"Tobaccobetalnutchewing"}
              removeIsClearable={true}
              handleChange={handleReactChange}
              dynamicOptions={translateOptions(EXPIRABLE_OPTION, t)}
              value={payload?.Tobaccobetalnutchewing}
            />
            {payload?.Tobaccobetalnutchewing === "Yes" && (
              <Input
                type="text"
                className="form-control"
                id="Tobaccoremark"
                // lable={t("Number of Cigarette/Day")}
                placeholder=" "
                required={true}
                value={payload?.Tobaccoremark}
                respclass="col-xl-4 col-md-8 col-sm-12 col-12"
                name="Tobaccoremark"
                onChange={handleChange}
              />
            )}
          </div>
        </div>
        <div className="col-sm-6">
          <div className="row">
            <ReactSelect
              placeholderName={t("Drug Addiction")}
              searchable={true}
              respclass="col-xl-4 col-md-8 col-sm-12 col-12"
              id={"DrugAddiction"}
              name={"DrugAddiction"}
              removeIsClearable={true}
              handleChange={handleReactChange}
              dynamicOptions={translateOptions(EXPIRABLE_OPTION, t)}
              value={payload?.DrugAddiction}
            />
            {payload?.DrugAddiction === "Yes" && (
              <Input
                type="text"
                className="form-control"
                id="DrugAddictionremark"
                // lable={t("Number of Cigarette/Day")}
                placeholder=" "
                required={true}
                value={payload?.DrugAddictionremark}
                respclass="col-xl-4 col-md-8 col-sm-12 col-12"
                name="DrugAddictionremark"
                onChange={handleChange}
              />
            )}
          </div>
        </div>
      </div>

      <div className="row px-2">
        <ReactSelect
          placeholderName={t("Coffee")}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id={"Coffee"}
          name={"Coffee"}
          removeIsClearable={true}
          handleChange={handleReactChange}
          dynamicOptions={translateOptions(EXPIRABLE_OPTION, t)}
          value={payload?.Coffee}
        />{" "}
        <ReactSelect
          placeholderName={t("Tea")}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id={"Tea"}
          name={"Tea"}
          removeIsClearable={true}
          handleChange={handleReactChange}
          dynamicOptions={translateOptions(EXPIRABLE_OPTION, t)}
          value={payload?.Tea}
        />
        <Input
          type="text"
          className="form-control"
          id="Exercise"
          lable={t("Exercise")}
          placeholder=" "
          required={true}
          value={payload?.Exercise}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="Exercise"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="Job"
          lable={t("Job")}
          placeholder=" "
          required={true}
          value={payload?.Job}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="Job"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="StressatWork"
          lable={t("Stress at Work")}
          placeholder=" "
          required={true}
          value={payload?.StressatWork}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="StressatWork"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="StressatHome"
          lable={t("Stress at Home")}
          placeholder=" "
          required={true}
          value={payload?.StressatHome}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="StressatHome"
          onChange={handleChange}
        />
        <ReactSelect
          placeholderName={t("Marital Status")}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          id={"MaritalStatus"}
          name={"MaritalStatus"}
          removeIsClearable={true}
          handleChange={handleReactChange}
          dynamicOptions={translateOptions(MaritalStatus_OPTION, t)}
          value={payload?.MaritalStatus}
        />
        <div className="col-sm-1">
          <button className="btn btn-primary" onClick={handleSave}>
            {isupdate ? t("Update") : t("Save")}
          </button>
        </div>
      </div>
      <div className="card">
        <Heading title={t("Social History")} />

        <Tables
          thead={thead}
          tbody={tableData?.map((ele, index) => ({
            "S.No.": index + 1,
            Smoking: ele.smoking,
            "Cigarette/Day": ele.cigarettePerDay,
            "Smoking Quit": ele.isSmokingQuit ? "Yes" : "No",
            Alcohol: ele.alcohol,
            "Alcohol Quit": ele.isAlcoholQuit ? "Yes" : "No",
            Exercise: ele.exercise,
            Job: ele.job,
            "Marital Status": ele.maritalStatus,
            "Stress At Work": ele.stressAtWork,
            "Stress At Home": ele.stressAtHome,
          }))}
        />
      </div>
    </div>
  );
};

export default SocialHistory;
