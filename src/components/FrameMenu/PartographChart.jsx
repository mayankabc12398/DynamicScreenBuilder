import React, { useState, useCallback, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ResponsiveContainer } from "recharts";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import { useTranslation } from "react-i18next";
import {
  NursingWardSaveIntekPartographChartForm,
  NursingWardSearchPartographChartForm,
  NursingWardBindFHRPartographChart,
  NursingWardBindCervixPartographChart,
  NursingWardBindBPPartographChart,
  NursingWardBindPulsePartographChart,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const PartographChart = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const patientId = data?.patientID;
  const transactionId = data?.transactionID;
  const [t] = useTranslation();
  const [values, setValues] = useState();
  const [fhrData, setFhrData] = useState([]);
  const [cervixData, setCervixData] = useState([]);
  const [bpData, setBpData] = useState([]);
  const [pulseData, setPulseData] = useState([]);
  const [contractionsData, setContractionsData] = useState([]);

  const fetchFHRData = useCallback(async () => {
    try {
      const response = await NursingWardBindFHRPartographChart(transactionId);

      if (response.data && Array.isArray(response.data)) {
        const formattedData = response.data.map((item, index) => ({
          x: index,
          y: Number(item.FHR),
        }));
        setFhrData(formattedData);
      } else {
        setFhrData([]);
      }
    } catch (error) {
      notify(error?.message || "Network error", "error");
    }
  }, [transactionId]);

  const fetchCervixData = useCallback(async () => {
    try {
      const response =
        await NursingWardBindCervixPartographChart(transactionId);

      if (response.success && Array.isArray(response.data)) {
        const cervixScale = {
          0: 0,
          Normal: 5,
          prince: 8,
        };

        const formattedData = response.data.map((item, index) => ({
          x: index,
          y: cervixScale[item.Cervix] ?? 0,
          descent: Number(item.Descent?.replace(" cm", "") || 0),
          alert: item.Alert,
          action: item.ACTION,
          originalCervix: item.Cervix,
        }));

        setCervixData(formattedData);
      } else {
        setCervixData([]);
      }
    } catch (error) {
      notify(error?.message || "Network error", "error");
    }
  }, [transactionId]);

  const fetchBPData = useCallback(async () => {
    try {
      const response = await NursingWardBindBPPartographChart(transactionId);

      if (response?.success) {
        if (response.data && Array.isArray(response.data)) {
          setBpData(response.data);
        } else if (response.data?.rows) {
          setBpData(response.data.rows);
        } else {
          setBpData([]);
        }
      } else {
        notify(response?.message || "Failed to fetch BP data", "error");
      }
    } catch (error) {
      console.error("Error fetching BP data:", error);
      notify(error?.message || "Network error", "error");
    }
  }, [transactionId, notify]);

  const fetchPulseData = useCallback(async () => {
    try {
      const response = await NursingWardBindPulsePartographChart(transactionId);

      if (response?.success) {
        if (response.data && Array.isArray(response.data)) {
          setPulseData(response.data);
        } else if (response.data?.rows) {
          setPulseData(response.data.rows);
        } else {
          setPulseData([]);
        }
      } else {
        notify(response?.message || "Failed to fetch Pulse data", "error");
      }
    } catch (error) {
      console.error("Error fetching Pulse data:", error);
      notify(error?.message || "Network error", "error");
    }
  }, [transactionId, notify]);

  // Search/Load saved form data
  const fetchSavedFormData = useCallback(async () => {
    try {
      const response =
        await NursingWardSearchPartographChartForm(transactionId);

      if (response?.success) {
        if (response.data) {
          // Map API response to form fields
          const mappedData = {
            inductionOfLabour: response.data.induction,
            duration: response.data.duration,
            noOfVE: response.data.noOfVE,
            hours: response.data.hours,
            mins: response.data.mins,
            modeOfDelivery: response.data.mode1,
            secondStageDuration: response.data.duration1,
            amtsl: response.data.amtsl,
            uterotonicOxytocin: response.data.uterotonic,
            thirdStageDuration: response.data.duration2,
            baby: response.data.alive === "Yes" ? "Alive" : response.data.alive,
            apgarScoreOneMin: response.data.apgarScore1Min,
            fiveMin: response.data.apgarScore5Min,
            tenMin: response.data.apgarScore10Min,
            resusation: response.data.resusation,
            placenta: response.data.placenta,
            membranes: response.data.membranes,
            cord: response.data.cord,
            bloodLoss: response.data.estBloodLoss,
            pevinealTearEpisio: response.data.devinial,
            motherBP: response.data.bp,
            pulse: response.data.pulse,
            babyLength: response.data.length1,
            weight: response.data.weight,
            hc: response.data.hc,
          };
          setValues(mappedData);
        }
      } else {
        notify(response?.message || "Failed to fetch form data", "error");
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
      notify(error?.message || "Network error", "error");
    }
  }, [transactionId, notify]);

  // Save form data
  const handleSaveForm = useCallback(async () => {
    try {
      const payload = {
        transactionID: transactionId,
        induction: values?.inductionOfLabour,
        duration: values?.duration,
        noOfVE: values?.noOfVE,
        hours: values?.hours,
        mins: values?.mins,
        mode1: values?.modeOfDelivery,
        duration1: values?.secondStageDuration,
        amtsl: values?.amtsl,
        uterotonic: values?.uterotonicOxytocin,
        duration2: values?.thirdStageDuration,
        alive: values?.baby,
        m: values?.baby === "M" ? "Male" : values?.baby === "F" ? "Female" : "",
        apgarScore1Min: values?.apgarScoreOneMin,
        apgarScore5Min: values?.fiveMin,
        apgarScore10Min: values?.tenMin,
        resusation: values?.resusation,
        placenta: values?.placenta,
        membranes: values?.membranes,
        cord: values?.cord,
        estBloodLoss: values?.bloodLoss,
        devinial: values?.pevinealTearEpisio,
        bp: values?.motherBP,
        pulse: values?.pulse,
        length1: values?.babyLength,
        weight: values?.weight,
        hc: values?.hc,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      };

      const response = await NursingWardSaveIntekPartographChartForm(payload);

      if (response?.success) {
        notify(response?.message || "Form saved successfully", "success");
        // Refresh all chart data after saving
        fetchFHRData();
        fetchCervixData();
        fetchBPData();
        fetchPulseData();
      } else {
        notify(response?.message || "Failed to save form", "error");
      }
    } catch (error) {
      console.error("Error saving form:", error);
      notify(error?.message || "Network error", "error");
    }
  }, [
    transactionId,
    values,
    notify,
    fetchFHRData,
    fetchCervixData,
    fetchBPData,
    fetchPulseData,
  ]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Fetch all data on component mount
  useEffect(() => {
    if (transactionId && patientId) {
      fetchFHRData(),
        fetchCervixData(),
        fetchBPData(),
        fetchPulseData(),
        fetchSavedFormData();
    }
  }, [
    transactionId,
    fetchFHRData,
    fetchCervixData,
    fetchBPData,
    fetchPulseData,
    fetchSavedFormData,
  ]);

  return (
    <>
      {/* Fetal Heart Rate Chart */}
      <Heading title={<span className="text-dark">{t("Fetal Heart Rate")}</span>} />
      <div className="col-xl col-12 bg-white p-1 rounded-2xl shadow-md">
        <ResponsiveContainer width="95%" height={250}>
          <ScatterChart width={350} height={250}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Time" />
            <YAxis type="number" dataKey="y" name="FHR" domain={[100, 180]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="FHR Points" data={fhrData} fill="#ff8042" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Cervix & Descent Chart */}
      <Heading title={<span className="text-dark">{t("Cervix & Descent")}</span>} />
      <div className="col-xl col-12 bg-white p-1 rounded-2xl shadow-md">
        <ResponsiveContainer width="95%" height={250}>
          <ScatterChart width={350} height={250}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Time" />
            <YAxis type="number" dataKey="y" name="Cervix" domain={[0, 10]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="Cervix Points" data={cervixData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Contractions Chart */}
      <Heading title={<span className="text-dark">{t("Contractions")}</span>} />
      <div className="col-xl col-12 bg-white p-1 rounded-2xl shadow-md">
        <ResponsiveContainer width="95%" height={250}>
          <BarChart
            data={contractionsData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="uv"
              stackId="a"
              fill="#8884d8"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="pv"
              stackId="a"
              fill="#82ca9d"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="amt"
              stackId="a"
              fill="#ffc658"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* B/P Graphs */}
      <Heading title={<span className="text-dark">{t("B/P graphs")}</span>} />
      <div className="col-xl col-12 bg-white p-1 rounded-2xl shadow-md">
        <ResponsiveContainer width="95%" height={250}>
          <ScatterChart width={350} height={250}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Time" />
            <YAxis type="number" dataKey="y" name="BP" domain={[60, 200]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="BP Points" data={bpData} fill="#82ca9d" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Pulse/Temp Graphs */}
      <Heading title={<span className="text-dark">{t("Temp graphs")}</span>} />
      <div className="col-xl col-12 bg-white p-1 rounded-2xl shadow-md">
        <ResponsiveContainer width="95%" height={250}>
          <ScatterChart width={350} height={250}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Time" />
            <YAxis type="number" dataKey="y" name="Pulse" domain={[40, 140]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="Pulse Points" data={pulseData} fill="#ffc658" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Summary of Labour Form */}
      <Heading title={<span className="text-dark">{t("Summary of Labour")}</span>} />
      <div className="row p-2">
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="inductionOfLabour"
          id="inductionOfLabour"
          placeholderName={t("Induction Of Labour")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.inductionOfLabour}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="duration"
          lable={t("Duration")}
          placeholder=" "
          required={true}
          value={values?.duration || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="duration"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="noOfVE"
          lable={t("No Of VE")}
          placeholder=" "
          required={true}
          value={values?.noOfVE || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="noOfVE"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="hours"
          lable={t("Hours")}
          placeholder=" "
          required={true}
          value={values?.hours || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="hours"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="modeOfDelivery"
          lable={t("Mode Of Delivery")}
          placeholder=" "
          required={true}
          value={values?.modeOfDelivery || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="modeOfDelivery"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="secondStageDuration"
          lable={t("Duration")}
          placeholder=" "
          required={true}
          value={values?.secondStageDuration || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="secondStageDuration"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="mins"
          lable={t("Mins")}
          placeholder=" "
          required={true}
          value={values?.mins || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="mins"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="amtsl"
          id="amtsl"
          placeholderName={t("AMTSL")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.amtsl}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="uterotonicOxytocin"
          lable={t("Uterotonic Oxytocin/Other")}
          placeholder=" "
          required={true}
          value={values?.uterotonicOxytocin || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="uterotonicOxytocin"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="thirdStageDuration"
          lable={t("Duration Of Third Stage")}
          placeholder=" "
          required={true}
          value={values?.thirdStageDuration || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="thirdStageDuration"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="baby"
          id="baby"
          placeholderName={t("Baby")}
          dynamicOptions={[
            { name: "Alive", value: "Alive" },
            { name: "SB", value: "SB" },
            { name: "M", value: "M" },
            { name: "F", value: "F" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.baby}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="apgarScoreOneMin"
          lable={t("Apgar Score 1Min")}
          placeholder=" "
          required={true}
          value={values?.apgarScoreOneMin || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="apgarScoreOneMin"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="fiveMin"
          lable={t("5 min")}
          placeholder=" "
          required={true}
          value={values?.fiveMin || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="fiveMin"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="tenMin"
          lable={t("10 Min")}
          placeholder=" "
          required={true}
          value={values?.tenMin || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="tenMin"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="resusation"
          id="resusation"
          placeholderName={t("Resusation")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.resusation}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="placenta"
          id="placenta"
          placeholderName={t("Placenta")}
          dynamicOptions={[
            { name: "Complete", value: "Complete" },
            { name: "Incomplete", value: "Incomplete" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.placenta}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="membranes"
          id="membranes"
          placeholderName={t("Membranes")}
          dynamicOptions={[
            { name: "Complete", value: "Complete" },
            { name: "Incomplete", value: "Incomplete" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.membranes}
          isRemoveTemplate={true}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="cord"
          id="cord"
          placeholderName={t("Cord")}
          dynamicOptions={[
            { name: "Normal", value: "Normal" },
            { name: "Abnormal", value: "Abnormal" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.cord}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="bloodLoss"
          lable={t("Est. Blood Loss")}
          placeholder=" "
          required={true}
          value={values?.bloodLoss || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="bloodLoss"
          onChange={handleChange}
        />
        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="pevinealTearEpisio"
          id="pevinealTearEpisio"
          placeholderName={t("Pevineal Tear Episio repair")}
          dynamicOptions={[
            { name: "Yes", value: "Yes" },
            { name: "No", value: "No" },
          ]}
          handleChange={handleMultiSelectChange}
          value={values?.pevinealTearEpisio}
          isRemoveTemplate={true}
        />
        <Input
          type="text"
          className="form-control"
          id="motherBP"
          lable={t("Mother BP")}
          placeholder=" "
          required={true}
          value={values?.motherBP || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="motherBP"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="pulse"
          lable={t("Pulse")}
          placeholder=" "
          required={true}
          value={values?.pulse || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="pulse"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="babyLength"
          lable={t("Baby Length")}
          placeholder=" "
          required={true}
          value={values?.babyLength || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="babyLength"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="weight"
          lable={t("Weight")}
          placeholder=" "
          required={true}
          value={values?.weight || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="weight"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          id="hc"
          lable={t("HC")}
          placeholder=" "
          required={true}
          value={values?.hc || ""}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="hc"
          onChange={handleChange}
        />
      </div>

      {/* Save Button */}
      <div className="row p-2">
        <div className="col-12">
          <button className="btn btn-primary" onClick={handleSaveForm}>
            {t("Save Form")}
          </button>
        </div>
      </div>
    </>
  );
};

export default PartographChart;
