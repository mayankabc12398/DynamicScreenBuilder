import React, { useEffect, useState } from "react";
import Heading from "../../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import Input from "../../../../components/formComponent/Input";
import { notify } from "../../../../utils/utils";
import {
  BindUserIncrement,
  SaveIncrementMaster,
} from "../../../../networkServices/HRApi";
import Tables from "../../../../components/UI/customTable";

function IncrementMaster() {
  const [t] = useTranslation();
  const initialState = {
    id: "",
    saveType: "",
    rating: "",
    incrementPercentage: "0",
    incrementAmount: "",
  };

  const [values, setvalues] = useState(initialState);
  const [tabelData, setTabelData] = useState([]);

  const STARTRATING = [
    {
      label: t("1 Star"),
      value: "1",
    },
    {
      label: t("2 Star"),
      value: "2",
    },
    {
      label: t("3 Star"),
      value: "3",
    },
    {
      label: t("4 Star"),
      value: "4",
    },
    {
      label: t("5 Star"),
      value: "5",
    },
    {
      label: t("6 Star"),
      value: "6",
    },
    {
      label: t("7 Star"),
      value: "7",
    },
    {
      label: t("8 Star"),
      value: "8",
    },
    {
      label: t("9 Star"),
      value: "9",
    },
    {
      label: t("10 Star"),
      value: "10",
    },
  ];
  const THEAD = [
    { name: t("S.No."), width: "3%" },
    { name: t("Rating Count") },
    { name: t("Increment Per%") },
    { name: t("Increment Amount") },
    { name: t("Edit"), width: "3%" },
  ];
  const handleReactSelect = (name, val) => {
    setvalues((prev) => ({ ...prev, [name]: val }));
  };
  const handlechange = (e) => {
    const { name, value } = e.target;
    setvalues((prev) => ({ ...prev, [name]: value }));
  };

  const fetchBindTabelData = async () => {
    try {
      const r = await BindUserIncrement();
      if (r.success) {
        setTabelData(r.data);
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };
  const handleSave = async () => {
    const payload = {
      id: values?.id ? values?.id : "",
      saveType: values?.saveType ? values?.saveType : "Save",
      rating: values?.rating?.value ? values?.rating?.value : values?.rating,
      incrementPercentage: values?.incrementPercentage,
      incrementAmount: values?.incrementAmount,
    };
    try {
      const r = await SaveIncrementMaster(payload);
      if (r.success) {
        notify(r.message, "success");
        fetchBindTabelData();
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };
  const handleEdit = (val) => {
    setvalues({
      ...values,
      id: val?.ID,
      saveType: "Update",
      rating: val?.Rating,
      incrementPercentage: val?.IncrementPercentage,
      incrementAmount: val?.IncrementAmount,
    });
  };
  useEffect(() => {
    fetchBindTabelData();
  }, []);
  return (
    <>
      <div className="col-12">
        <Heading isBreadcrumb={false} title={t("User Increment Master")} />
        <div className="row pt-2">
          <ReactSelect
            placeholderName={t("Rating")}
            name="rating"
            id="rating"
            value={values?.rating}
            handleChange={handleReactSelect}
            dynamicOptions={STARTRATING}
            searchable={true}
            requiredClassName={"required-fields"}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          />
          <Input
            type="number"
            className={"form-control required-fields"}
            lable={t("increment Percentage")}
            placeholder=" "
            id="incrementPercentage"
            name="incrementPercentage"
            onChange={handlechange}
            value={values?.incrementPercentage}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          />
          <Input
            type="number"
            className={"form-control required-fields"}
            lable={t("increment Amount")}
            placeholder=" "
            id="incrementAmount"
            name="incrementAmount"
            onChange={handlechange}
            value={values?.incrementAmount}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          />
          <div className="text-right">
            <button className="btn-sm btn btn-success" on onClick={handleSave}>
              {values?.id ? t("update") : t("Save")}
            </button>
            <button
              className="btn-sm btn btn-success ml-2"
              onClick={() => setvalues({ ...initialState })}
            >
              {t("Reset")}
            </button>
          </div>
        </div>
        {tabelData.length > 0 && (
          <>
            <Heading title={t("User Increment Details")} isBreadcrumb={false} />
            <Tables
              thead={THEAD}
              tbody={tabelData?.map((item, i) => ({
                sno: i + 1,
                ratingCount: item?.Rating,
                incrementP: item?.IncrementPercentage,
                incrementA: item?.IncrementAmount,
                Action: (
                  <>
                    <i className="fa fa-edit cursor-pointer" onClick={() => handleEdit(item)} />
                  </>
                ),
              }))}
            />
          </>
        )}
      </div>
    </>
  );
}

export default IncrementMaster;
