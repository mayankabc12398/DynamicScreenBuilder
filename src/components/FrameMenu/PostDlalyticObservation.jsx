import { useTranslation } from "react-i18next";

import { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
import {
  getHemodialysis_Post_Dialytic_ObservationApi,
  saveHemodialysis_Post_Dialytic_ObservationApi,
  updateHemodialysis_Post_Dialytic_ObservationApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import TextAreaInput from "../formComponent/TextAreaInput";
const PostDlalyticObservation = ({ data }) => {
  const [t] = useTranslation();
  const { patientID, transactionID } = data;

  const [values, setValues] = useState({
    id: 0,
    transactionId: "",
    patientId: "",
    hoursDialyzed: "",
    bp: "",
    pulse: "",
    ufAchieved: "",
    weight: "",
    bloodTransfusion: "",
    complicationDuringDialysis: "",
    specialOrder: "",
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

  const complicationOptions = [
    { label: t("Yes"), value: 1 },
    { label: t("No"), value: 0 },
    { label: t("None"), value: -1 },
  ];

  const yesNoOptions = [
    { label: t("Yes"), value: 1 },
    { label: t("No"), value: 0 },
  ];

  const handleSave = async () => {
    const payload = {
      id: values?.id || 0,
      patientId: patientID || "",
      transactionId: transactionID || "",
      hoursDialyzed: values?.hoursDialyzed || "",
      bp: values?.bp || "",
      pulse: values?.pulse || "",
      ufAchieved: values?.ufAchieved || "",
      weight: values?.weight || "",
      bloodTransfusion: values?.bloodTransfusion || "",
      complicationDuringDialysis: values?.complicationDuringDialysis || "",
      specialOrder: values?.specialOrder || "",
    };

    const apiCall =
      values.id > 0 || isSaved
        ? updateHemodialysis_Post_Dialytic_ObservationApi
        : saveHemodialysis_Post_Dialytic_ObservationApi;

    const res = await apiCall(payload);

    if (res?.success) {
      notify(res?.message, "success");
      setIsSaved(true);
      fetchList();
    }
  };

  const fetchList = async () => {
    try {
      const res = await getHemodialysis_Post_Dialytic_ObservationApi(
        transactionID,
        patientID
      );

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const record = res.data[0];

        setValues({
          id: record.Id || 0,
          transactionId: record.TransactionId || "",
          patientId: record.PatientId || "",

          hoursDialyzed: record.HoursDialyzed || "",
          bp: record.BP || "",
          pulse: record.Pulse || "",
          ufAchieved: record.UFAchieved || "",
          weight: record.Weight || "",
          bloodTransfusion: record.BloodTransfusion || "",
          complicationDuringDialysis: record.ComplicationDuringDialysis || "",
          specialOrder: record.SpecialOrder || "",
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
            name="hoursDialyzed"
            id="hoursDialyzed"
            placeholderLabel="hr/min"
            value={values?.hoursDialyzed}
            onChange={handleChange}
            lable={t("Hours Dialyzed ")}
            placeholder=" "
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          />

          <Input
            className="form-control"
            type="text"
            lable={t("BP")}
            placeholder=""
            name="bp"
            id="bp"
            value={values?.bp}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="mmhg"
          />

          <Input
            type="text"
            className="form-control"
            lable={t("Pulse")}
            placeholder=""
            name="pulse"
            id="pulse"
            value={values?.pulse}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="b/m"
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

          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="ufAchieved"
            name="ufAchieved"
            value={values?.ufAchieved}
            placeholderName={t("UF Achieved")}
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            handleChange={handleReactSelect}
          />
          <Input
            type="text"
            className="form-control"
            lable={t("Weight")}
            placeholder=""
            name="weight"
            id="weight"
            value={values?.weight}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            onChange={handleChange}
            placeholderLabel="kg"
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="bloodTransfusion"
            name="bloodTransfusion"
            value={values?.bloodTransfusion}
            placeholderName={t("Blood Transfusion")}
            removeIsClearable={true}
            dynamicOptions={yesNoOptions}
            handleChange={handleReactSelect}
          />
          <ReactSelect
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
            id="complicationDuringDialysis"
            name="complicationDuringDialysis"
            value={values?.complicationDuringDialysis}
            placeholderName={t("Complication During Dialysis")}
            removeIsClearable={true}
            dynamicOptions={complicationOptions}
            handleChange={handleReactSelect}
          />
          <TextAreaInput
            type="text"
            name="specialOrder"
            id="specialOrder"
            value={values?.specialOrder}
            onChange={handleChange}
            lable={t("SPECIAL ORDER / DISCHARGE NOTES")}
            placeholder=" "
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
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

export default PostDlalyticObservation;
