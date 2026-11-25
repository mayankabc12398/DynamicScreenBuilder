import React, { useEffect, useState } from "react";
import Input from "../../../../components/formComponent/Input";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import {
  BindInterViewRound,
  SaveInterViewRound,
} from "../../../../networkServices/HRApi";
import { notify } from "../../../../utils/utils";
import Tables from "../../../../components/UI/customTable";
import Heading from "../../../../components/UI/Heading";

const InterviewRoundMaster = () => {
  const { t } = useTranslation();
  const initialState = {
    id: "",
    saveType: "",
    name: "",
    isActive: "0",
    sequence: "",
  };
  const [values, setValues] = useState(initialState);
  const [tableData, setTableData] = useState([]);
  const THEAD = [
    { name: t("S.No."), width: "3%" },
    { name: t("Round Name"), width: "" },
    { name: t("Sequence"), width: "" },
    { name: t("Active"), width: "" },
    { name: t("Edit"), width: "4%" },
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReactSelect = (name, val) => {
    debugger;
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));
  };
  const handleEdit = (val) => {
    setValues({
      id: val?.ID,
      saveType: "Update",
      name: val?.Name,
      isActive: val?.IsActive === "Yes" ? "1" : "0",
      sequence: val?.Sequence,
      isEdit: 1,
    });
  };

  const handleSave = async () => {
    if (!values?.name || !values?.sequence || !values?.isActive) {
      notify(t("Please Select required Fields"), "error");
      return;
    }
    const payload = {
      id: values?.id ? values?.id : "",
      saveType: values?.isEdit == 1 ? "Update" : "Save",
      name: values?.name,
      isActive: values?.isActive.value,
      sequence: values?.sequence,
    };
    debugger;
    try {
      const r = await SaveInterViewRound(payload);
      if (r.success) {
        notify(r.message, "success");
        fetchTabelData();
      }
      if (!r.success) {
        notify(r.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };
  const fetchTabelData = async () => {
    try {
      const r = await BindInterViewRound();
      if (r.success) {
        setTableData(r.data);
      } else {
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };
  useEffect(() => {
    fetchTabelData();
  }, []);
  return (
    <>
      <Input
        type="text"
        className={`form-control`}
        id="name"
        name="name"
        onChange={handleChange}
        value={values?.name}
        lable={t("Round Name")}
        placeholder=" "
        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
      />
      <Input
        type="text"
        className={`form-control`}
        id="sequence"
        name="sequence"
        onChange={handleChange}
        value={values?.sequence}
        lable={t("Sequence")}
        placeholder=" "
        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
      />
      <ReactSelect
        placeholderName={t("Active")}
        name="isActive"
        id="isActive"
        value={values?.isActive}
        handleChange={handleReactSelect}
        dynamicOptions={[
          { label: t("Yes"), value: "1" },
          { label: t("NO"), value: "0" },
        ]}
        searchable={true}
        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
      />
      <div className="text-right">
        <button
          className=" btn btn-sm btn-success ml-2 px-3"
          onClick={handleSave}
        >
          {values?.isEdit === 1 ? t("Update") : t("Save")}
        </button>
        <button
          className=" btn btn-sm btn-success ml-2 px-3"
          onClick={() => {
            setValues(initialState);
          }}
        >
          {t("Reset")}
        </button>
      </div>
      <div className="col-12 pt-2">
        <Heading title={t("InterView Round Master Details")} />
        <Tables
          thead={THEAD}
          tbody={tableData?.map((ele, index) => ({
            Sno: index + 1,
            roundName: ele?.Name,
            Sequence: ele?.Sequence,
            Active: ele?.IsActive,
            Edit: (
              <div onClick={() => handleEdit(ele)} className="fa fa-edit"></div>
            ),
          }))}
          style={{ maxHeight: "60vh" }}
        />
      </div>
    </>
  );
};

export default InterviewRoundMaster;
