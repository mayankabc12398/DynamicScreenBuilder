import { useTranslation } from "react-i18next";

import { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
import {
  getHemodialysis_Dialysis_OrderApi,
  saveHemodialysis_Dialysis_OrderApi,
  updateHemodialysis_Dialysis_OrderApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
const DialysisOrder = ({ data }) => {
  const [t] = useTranslation();
  const { patientID, transactionID } = data;

  const [values, setValues] = useState({
    id: 0,
    transactionId: "",
    patientId: "",
    vascularAccessType: "",
    targetUltraFiltration: "",
    duration: "",
    treatmentType: "",
    bloodFlowRate: "",
    priming: "",
    dialysisSolution: "",
    glucose: "",
    dialyserType: "",
    membraneType: "",
    bathK: "",
    loadingDose: "",
    unitLitre: "",
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };
  const handleReactSelect = (name, e) => {
    setValues({
      ...values,
      [name]: e.value,
    });
  };

  const treatmentOptions = [
    { label: "--Select--", value: "0" },
    { label: t("HDF Postdilution"), value: "HDF Postdilution" },
    { label: t("HD"), value: "HD" },
    { label: t("HDF Predilution"), value: "HDF Predilution" },
    { label: t("HF Predilution"), value: "HF Predilution" },
    { label: t("HF Postdilution"), value: "HF Postdilution" },
  ];

  const dialyserOptions = [
    { label: "--Select--", value: "" },
    { label: "FX40", value: "FX40" },
    { label: "FX50", value: "FX50" },
    { label: "FX60", value: "FX60" },
    { label: "FX70", value: "FX70" },
    { label: "FX80", value: "FX80" },
    { label: "FX90", value: "FX90" },
    { label: "FX100", value: "FX100" },
  ];
  const membraneOptions = [
    { label: "--Select--", value: "" },
    { label: t("High Flux"), value: "High Flux" },
    { label: t("Low Flux"), value: "Low Flux" },
  ];

  const handleSave = async () => {
    const payload = {
      id: values?.id || 0,
      patientId: patientID || "",
      transactionId: transactionID || "",

      vascularAccessType: values?.vascularAccessType || "",
      targetUltraFiltration: values?.targetUltraFiltration || "",
      duration: values?.duration || "",
      treatmentType: values?.treatmentType || "",
      bloodFlowRate: values?.bloodFlowRate || "",
      priming: values?.priming || "",
      dialysisSolution: values?.dialysisSolution || "",
      glucose: values?.glucose || "",
      dialyserType: values?.dialyserType || "",
      membraneType: values?.membraneType || "",
      bathK: values?.bathK || "",
      loadingDose: values?.loadingDose || "",
      unitLitre: values?.unitLitre || "",
    };

    const apiCall =
      values.id > 0 || isSaved
        ? updateHemodialysis_Dialysis_OrderApi
        : saveHemodialysis_Dialysis_OrderApi;

    const res = await apiCall(payload);

    if (res?.success) {
      notify(res?.message, "success");
      setIsSaved(true);
      fetchList();
    }
  };

  const fetchList = async () => {
    try {
      const res = await getHemodialysis_Dialysis_OrderApi(
        transactionID,
        patientID
      );

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const record = res.data[0];

        setValues({
          id: record.Id || 0,
          transactionId: record.TransactionId || "",
          patientId: record.PatientId || "",

          vascularAccessType: record.VascularAccessType || "",
          targetUltraFiltration: record.TargetUltraFiltration || "",
          duration: record.Duration || "",
          treatmentType: record.TreatmentType || "",
          bloodFlowRate: record.BloodFlowRate || "",
          priming: record.Priming || "",
          dialysisSolution: record.DialysisSolution || "",
          glucose: record.Glucose || "",
          dialyserType: record.DialyserType || "",
          membraneType: record.MembraneType || "",
          bathK: record.BathK || "",
          loadingDose: record.LoadingDose || "",
          unitLitre: record.UnitLitre || "",
        });

        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            name="vascularAccessType"
            rows={2}
            value={values?.vascularAccessType}
            onChange={handleChange}
            lable={t("Vascular Access Type")}
            placeholder=" "
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            lable={t("TargetUltra Filtration")}
            placeholder=""
            name="targetUltraFiltration"
            id="targetUltraFiltration"
            value={values?.targetUltraFiltration}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="m/s"
          />
          <Input
            className="form-control"
            type="text"
            lable={t("Duration Time")}
            placeholder=""
            name="duration"
            id="duration"
            value={values?.duration}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="treatmentType"
            name="treatmentType"
            value={values?.treatmentType}
            placeholderName={t("Treatment Type")}
            removeIsClearable={true}
            dynamicOptions={treatmentOptions}
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Blood Flow Rate")}
            placeholder=""
            name="bloodFlowRate"
            id="bloodFlowRate"
            value={values?.bloodFlowRate}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="ms/min"
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Priming")}
            placeholder=""
            name="priming"
            id="priming"
            value={values?.priming}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Dialysis Solutions")}
            placeholder=""
            name="dialysisSolution"
            id="dialysisSolution"
            value={values?.dialysisSolution}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Glucose")}
            placeholder=""
            name="glucose"
            id="glucose"
            value={values?.glucose}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="dialyserType"
            name="dialyserType"
            value={values?.dialyserType}
            placeholderName={t("Dialyser Type")}
            removeIsClearable={true}
            dynamicOptions={dialyserOptions}
            handleChange={handleReactSelect}
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="membraneType"
            name="membraneType"
            value={values?.membraneType}
            placeholderName={t("Membrane Type")}
            removeIsClearable={true}
            dynamicOptions={membraneOptions}
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Bath KPlus")}
            placeholder=""
            name="bathK"
            id="bathK"
            value={values?.bathK}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="mmol/l"
          />
        </div>
        <div className="col-12 col-md-12 col-lg-12 mt-3 mb-2 p-0">
          <div
            className="pt-3 pb-2 pr-2 pl-2 form-group"
            style={{
              border: "1px solid #ced4da",
              borderRadius: "4px",
              position: "relative",
            }}
          >
            <label className="label" style={{ position: "absolute" }}>
              {t("Heparinization")}
            </label>
            <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Loading Dose")}
                  placeholder=""
                  name="loadingDose"
                  id="loadingDose"
                  value={values?.loadingDose}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  onChange={handleChange}
                  placeholderLabel="iu"
                />
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Unit Hour")}
                  placeholder=""
                  name="unitLitre"
                  id="unitLitre"
                  value={values?.unitLitre}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                  onChange={handleChange}
                  placeholderLabel="iu/hr"
                />
              </div>
            </div>
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

export default DialysisOrder;
