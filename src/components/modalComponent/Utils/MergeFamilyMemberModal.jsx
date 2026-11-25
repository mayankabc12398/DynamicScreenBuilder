import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";

export default function MergeFamilyMemberModal({ handlechangeModel, inputData }) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState();
  const handlechange = (e) => {
    setInputs((val) => ({ ...val, [e.target.name]: e.target.value }));
  };
  // useEffect(() => {
  //   handlechangeModel(inputs);
  // }, [inputs]);

  return (
    <>
      <div className="row p-2">
        <Input
          type="text"
          className={`form-control `}
          id="uhid"
          name="uhid"
          value={""}
          onChange={handlechange}
          lable={t("UHID")}
          placeholder=" "
          respclass="col-xl-6 col-md-6 col-sm-6 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="Family_Number"
          name="Family_Number"
          value={""}
          onChange={handlechange}
          lable={t("Family Number")}
          placeholder=" "
          respclass="col-xl-6 col-md-6 col-sm-6 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="First_Name"
          name="First_Name"
          value={""}
          onChange={handlechange}
          lable={t("First Name")}
          placeholder=" "
          respclass="col-xl-6 col-md-6 col-sm-6 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="Last_Name"
          name="Last_Name"
          value={""}
          onChange={handlechange}
          lable={t("Last Name")}
          placeholder=" "
          respclass="col-xl-6 col-md-6 col-sm-6 col-sm-6 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="Contact_No"
          name="Contact_No"
          value={""}
          onChange={handlechange}
          lable={t("Contact No.")}
          placeholder=" "
          respclass="col-xl-6 col-md-6 col-sm-6 col-sm-6 col-12"
        />
      </div>
    </>

  );
}
