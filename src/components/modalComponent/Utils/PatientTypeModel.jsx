import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";

// "+" / edit beside Patient Type on Patient Registration (same pattern as the Area popup):
// the patient type name, typed in capitals. initialName pre-fills the box when an existing
// type is edited.
export default function PatientTypeModel({ handleChangeModel, initialName = "" }) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState({ patientType: initialName || "" });

  useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs]);

  return (
    <div className="row p-2">
      <Input
        type="text"
        className="form-control required-fields"
        id="patientTypeName"
        name="patientType"
        lable={t("Patient Type")}
        placeholder=" "
        respclass="col-12"
        maxLength={50}
        value={inputs.patientType}
        onChange={(e) => setInputs({ patientType: e.target.value.toUpperCase() })}
      />
    </div>
  );
}
