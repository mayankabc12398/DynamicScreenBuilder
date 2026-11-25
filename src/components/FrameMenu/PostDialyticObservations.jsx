import { useTranslation } from "react-i18next";

import { useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
const PostDialyticObservations = ({ data }) => {
  const [t] = useTranslation();

  const [values, setValues] = useState({
    vascularAccessType: "",
    targetUltraFiltration: "",
    durationTime: "",
    treatmentType: "",
    bloodFlowRate: "",
    priming: "",
    dialysisSolutions: "",
    glucose: "",
    dialyserType: "",
    membraneType: "",
    bathKPlus: "",
    loadingDose: "",
    unitHour: "",
  });

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
  
  const YESNODROPDOWN = [
    { label: t("YES"), value: "1" },
    { label: t("NO"), value: "0" },
  ];
  const handleSaveAPI = async () => {};

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
            lable={t("Vascular AccessType")}
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
            name="durationTime"
            id="durationTime"
            value={values?.durationTime}
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
            dynamicOptions={YESNODROPDOWN}
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
            name="dialysisSolutions"
            id="dialysisSolutions"
            value={values?.dialysisSolutions}
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
            dynamicOptions={YESNODROPDOWN}
            handleChange={handleReactSelect}
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="membraneType"
            name="membraneType"
            value={values?.membraneType}
            placeholderName={t("Membrane Type")}
            removeIsClearable={true}
            dynamicOptions={YESNODROPDOWN}
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Bath KPlus")}
            placeholder=""
            name="bathKPlus"
            id="bathKPlus"
            value={values?.bathKPlus}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="mmol/l"
          />
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
            name="unitHour"
            id="unitHour"
            value={values?.unitHour}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="iu/hr"
          />
          <button className="btn btn-primary" onClick={handleSaveAPI}>
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDialyticObservations;
