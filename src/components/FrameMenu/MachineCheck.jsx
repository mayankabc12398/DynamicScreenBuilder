import { useTranslation } from "react-i18next";

import { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
import {
  getHemodialysis_Machine_CheckApi,
  saveHemodialysis_Machine_CheckApi,
  UpdateHemodialysis_Machine_CheckApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import DatePicker from "../formComponent/DatePicker";
const MachineCheck = ({ data }) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { transactionID, patientID } = data;
  const [values, setValues] = useState({
    id: 0,
    patientId: "",
    transactionId: "",
    bloodLeakAssessment: "",
    bloodTested: "",
    bloodTestedOn: new Date(),
    airDetaction: "",
    airTested: "",
    airTestedOn: new Date(),
    machineNumber: "",
    temprature: "",
    conductivity: "",
    staffSettingMachine: "",
    nureseCommencingDialysis: "",
    isActive: "",
    nap: "",
    hCo: "",
    fluidFlow: "",
    bolus: "",
    alllights: "",
  });
  const parseDate = (dateStr) => (dateStr ? new Date(dateStr) : null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleReactSelect = (name, e) => {
    setValues((prev) => ({ ...prev, [name]: e?.value || "" }));
  };
  const YESNODROPDOWN = [
    { label: t("YES"), value: "YES" },
    { label: t("NO"), value: "NO" },
  ];
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    const payload = {
      id: values.id || 0,
      patientId: patientID,
      transactionId: transactionID,

      bloodLeakAssessment: values.bloodLeakAssessment,
      bloodTested: values.bloodTested,
      bloodTestedOn: values.bloodTestedOn,
      airDetaction: values.airDetaction,
      airTested: values.airTested,
      airTestedOn: values.airTestedOn,
      machineNumber: values.machineNumber,
      temprature: values.temprature,
      conductivity: values.conductivity,
      staffSettingMachine: values.staffSettingMachine,
      nureseCommencingDialysis: values.nureseCommencingDialysis,
      isActive: values.isActive,
      nap: values.nap,
      hCo: values.hCo,
      fluidFlow: values.fluidFlow,
      bolus: values.bolus,
      alllights: values.alllights,
    };

    const apiCall =
      values.id > 0 || isSaved
        ? UpdateHemodialysis_Machine_CheckApi
        : saveHemodialysis_Machine_CheckApi;

    const res = await apiCall(payload);

    if (res?.success) {
      notify(res.message, "success");
      setIsSaved(true);
      fetchList();
    }
  };

  const fetchList = async () => {
    try {
      const res = await getHemodialysis_Machine_CheckApi(
        transactionID,
        patientID
      );

      if (res?.success && res.data?.length > 0) {
        const record = res.data[0];

        setValues({
          id: record.Id || 0,
          patientId: record.PatientId || "",
          transactionId: record.TransactionId || "",
          bloodLeakAssessment: record.BloodLeakAssessment || "",
          bloodTested: record.BloodTested || "",
          bloodTestedOn: parseDate(record.BloodTestedOn || ""),
          airDetaction: record.AirDetaction || "",
          airTested: record.AirTested || "",
          airTestedOn: parseDate(record.AirTestedOn || ""),
          machineNumber: record.MachineNumber || "",
          temprature: record.Temprature || "",
          conductivity: record.Conductivity || "",
          staffSettingMachine: record.StaffSettingMachine || "",
          nureseCommencingDialysis: record.NureseCommencingDialysis || "",
          isActive: record.IsActive || "",
          nap: record.Nap || "",
          hCo: record.HCo || "",
          fluidFlow: record.FluidFlow || "",
          bolus: record.Bolus || "",
          alllights: record.Alllights || "",
        });

        setIsSaved(true);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <div className="row p-2">
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="bloodTested"
            name="bloodTested"
            value={values?.bloodTested}
            placeholderName={t("Blood Leak Assessment Tested ")}
            removeIsClearable={true}
            dynamicOptions={YESNODROPDOWN}
            handleChange={handleReactSelect}
          />
          <DatePicker
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            lable={t("On")}
            name="bloodTestedOn"
            id="bloodTestedOn"
            value={values?.bloodTestedOn}
            showTime
            hourFormat="12"
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
         
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="airTested"
            name="airTested"
            value={values?.airTested}
            placeholderName={t("Air Detection Tested")}
            removeIsClearable={true}
            dynamicOptions={YESNODROPDOWN}
            handleChange={handleReactSelect}
          />
           <DatePicker
            placeholder={VITE_DATE_FORMAT}
            className="custom-calendar"
            lable={t("Air Tested On")}
            name="airTestedOn"
            id="airTestedOn"
            value={values?.airTestedOn}
            showTime
            hourFormat="12"
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
         
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="alllights"
            name="alllights"
            value={values?.alllights}
            placeholderName={t("All red lights off")}
            removeIsClearable={true}
            dynamicOptions={YESNODROPDOWN}
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Temperature")}
            placeholder=""
            name="temprature"
            id="temprature"
            value={values?.temprature}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="° C"
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Machine Number")}
            placeholder=""
            name="machineNumber"
            id="machineNumber"
            value={values?.machineNumber}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("NA+ ")}
            placeholder=""
            name="nap"
            id="nap"
            value={values?.nap}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Conductivity")}
            placeholder=""
            name="conductivity"
            id="conductivity"
            value={values?.conductivity}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("HCo3")}
            placeholder=""
            name="hCo"
            id="hCo"
            value={values?.hCo}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Staff Setting Machine ")}
            placeholder=""
            name="staffSettingMachine"
            id="staffSettingMachine"
            value={values?.staffSettingMachine}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Fluid Flow")}
            placeholder=""
            name="fluidFlow"
            id="fluidFlow"
            value={values?.fluidFlow}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="mmol/l"
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Nurse Commencing Dialysis :")}
            placeholder=""
            name="nureseCommencingDialysis"
            id="nureseCommencingDialysis"
            value={values?.nureseCommencingDialysis}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="iu"
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Bolus")}
            placeholder=""
            name="bolus"
            id="bolus"
            value={values?.bolus}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="iu/hr"
          />
        </div>
      </div>
      <div className="d-flex justify-content-end mt-2 mb-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {values.id > 0 || isSaved ? t("Update") : t("Save")}
        </button>
      </div>
    </div>
  );
};

export default MachineCheck;
