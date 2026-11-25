import React, { useState } from "react";
import Input from "../../../components/formComponent/Input";
import DatePicker from "../../../components/formComponent/DatePicker";
import { useTranslation } from "react-i18next";

const BabyGrouthConfirmationModel = ({setIsDOBModalOpen}) => {
  const [t] = useTranslation();
  const [values, setValues] = useState({
    DOB: new Date(),
    cheight: "",
    cweight: "",
    Motherheight: "",
    Fatherheight: "",
  });
  const handleChange = (e) => {
    const { value, name } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <>
      <div className="row p-3">
        <DatePicker
          lable={t("Date of Birth")}
          name="DOB"
          value={values.DOB}
          showTime
          hourFormat="12"
          handleChange={handleChange}
          respclass="col-sm-12 w-100"
          className={"w-100"}
        />
        <lable className="col-12 mb-2">
          <b>{t("Gestation Period")}</b>
        </lable>
        <Input
          type="text"
          className={`form-control`}
          id="cheight"
          lable={t("Height")}
          placeholder=" "
          required={true}
          respclass="col-6"
          name="cheight"
          onChange={handleChange}
          value={values?.cheight}
          disabled={true}
        />
        <Input
          type="text"
          className={`form-control`}
          id="cweight"
          lable={t("Weight")}
          placeholder=" "
          required={true}
          respclass="col-6"
          name="cweight"
          onChange={handleChange}
          value={values?.cweight}
          disabled={true}
        />
        <lable className="col-12 mb-2">
          <b>{t("Mid Parent of Height")}</b>
        </lable>
        <Input
          type="text"
          className={`form-control`}
          id="Motherheight"
          lable={"Mother"}
          placeholder=" "
          required={true}
          respclass="col-6"
          name="Motherheight"
          onChange={handleChange}
          value={values?.Motherheight}
          disabled={true}
        />
        <Input
          type="text"
          className={`form-control`}
          id="Fatherheight"
          lable={"Father"}
          placeholder=" "
          required={true}
          respclass="col-6"
          name="Fatherheight"
          onChange={handleChange}
          value={values?.Fatherheight}
          disabled={true}
        />
        <div className="col-12 d-flex justify-content-between">
          <button
            className="btn btn-primary mt-3 w-100"
            onClick={() => setIsDOBModalOpen(false)}
          >
            {t("Do it Later")}
          </button>
          <button className="btn btn-primary mt-3 ml-2 w-100">{t("Continue")}</button>
        </div>
      </div>
    </>
  );
};

export default BabyGrouthConfirmationModel;
