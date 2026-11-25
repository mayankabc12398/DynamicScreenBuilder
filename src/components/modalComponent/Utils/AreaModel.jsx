import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";
import ReactSelect from "@app/components/formComponent/ReactSelect";
import { filterByTypes } from "../../../utils/utils";

// "+" / edit beside Area on Patient Registration: the area name, typed in capitals, and the
// State / District it belongs to - the district is what fills the District box in when the
// area is picked. The initial* props pre-fill the boxes when an existing area is edited.
// The lists come from the same centre cache the registration form reads (TypeID 8 = state,
// 9 = district), filtered the same way: states by country, districts by country and state.
export default function AreaModel({
  handleChangeModel,
  initialName = "",
  initialStateID = 0,
  initialDistrictID = 0,
  countryID,
  CentreWiseCache = [],
}) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState({
    areaName: initialName || "",
    stateID: Number(initialStateID) || 0,
    districtID: Number(initialDistrictID) || 0,
    districtName: "",
  });

  useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs]);

  const country = `${countryID?.value ?? countryID ?? ""}`;
  const stateOptions = filterByTypes(
    CentreWiseCache,
    [8, country],
    ["TypeID", "CountryID"],
    "TextField",
    "ValueField",
  ) ?? [];
  const districtOptions = inputs.stateID
    ? filterByTypes(
        CentreWiseCache,
        [9, country, inputs.stateID],
        ["TypeID", "CountryID", "StateID"],
        "TextField",
        "ValueField",
      ) ?? []
    : [];

  return (
    <div className="row p-2">
      <Input
        type="text"
        className="form-control required-fields"
        id="areaName"
        name="areaName"
        lable={t("Area")}
        placeholder=" "
        respclass="col-12"
        maxLength={150}
        value={inputs.areaName}
        onChange={(e) =>
          setInputs((prev) => ({ ...prev, areaName: e.target.value.toUpperCase() }))
        }
      />
      <ReactSelect
        placeholderName={t("State")}
        id="areaStateID"
        name="stateID"
        searchable={true}
        respclass="col-12 mt-2"
        dynamicOptions={stateOptions}
        value={inputs.stateID || ""}
        handleChange={(name, e) =>
          // a different state takes the district with it
          setInputs((prev) => ({
            ...prev,
            stateID: Number(e?.value) || 0,
            districtID: 0,
            districtName: "",
          }))
        }
      />
      <ReactSelect
        placeholderName={t("District")}
        id="areaDistrictID"
        name="districtID"
        searchable={true}
        respclass="col-12 mt-2"
        requiredClassName="required-fields"
        dynamicOptions={districtOptions}
        value={inputs.districtID || ""}
        isDisabled={!inputs.stateID}
        handleChange={(name, e) =>
          setInputs((prev) => ({
            ...prev,
            districtID: Number(e?.value) || 0,
            districtName: e?.label ?? "",
          }))
        }
      />
    </div>
  );
}
