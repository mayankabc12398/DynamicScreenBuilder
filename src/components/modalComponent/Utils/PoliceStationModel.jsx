import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";
import LabeledInput from "@app/components/formComponent/LabeledInput";

export default function PoliceStationModel({ handleChangeModel, inputData }) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState(inputData);

  const handleChange = (e) => {
    setInputs((val) => ({ ...val, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs]);

  return (
    <div className="row p-2">
      {inputData?.stateName && (
        <LabeledInput label={t("State")} value={inputData.stateName} />
      )}
      {inputData?.districtName && (
        <LabeledInput label={t("District")} value={inputData.districtName} />
      )}
      <Input
        type="text"
        className="form-control"
        id="PoliceStation"
        name="PoliceStation"
        lable={t("Police Station Name")}
        placeholder=" "
        respclass="col-12"
        onChange={handleChange}
      />
    </div>
  );
}
