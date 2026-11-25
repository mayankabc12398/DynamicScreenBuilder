import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";

// "+" beside Postal Address on Patient Registration: the new postal address, typed in capitals.
// State and District come from the registration form (both are required) and are shown read-only.
export default function PostalAddressModel({ handleChangeModel, stateName = "", districtName = "" }) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState({ postalAddress: "" });

  useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs]);

  return (
    <div className="row p-2">
      <Input
        type="text"
        className="form-control"
        id="postalState"
        name="postalState"
        lable={t("State")}
        placeholder=" "
        respclass="col-6"
        value={stateName}
        disabled={true}
      />
      <Input
        type="text"
        className="form-control"
        id="postalDistrict"
        name="postalDistrict"
        lable={t("District")}
        placeholder=" "
        respclass="col-6"
        value={districtName}
        disabled={true}
      />
      <Input
        type="text"
        className="form-control required-fields"
        id="postalAddress"
        name="postalAddress"
        lable={t("Postal Address")}
        placeholder=" "
        respclass="col-12"
        maxLength={200}
        value={inputs.postalAddress}
        onChange={(e) => setInputs({ postalAddress: e.target.value.toUpperCase() })}
      />
    </div>
  );
}
