import React, { useEffect, useState } from "react";
import {
  EDPBindDesignationtableinMaster,
  EDPBindGrade,
  EDPSaveDesignation,
} from "../../../../networkServices/EDP/edpApi";
import {
  handleReactSelectDropDownOptions,
  notify,
} from "../../../../utils/utils";
import Input from "../../../../components/formComponent/Input";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import Tables from "../../../../components/UI/customTable";
import Heading from "../../../../components/UI/Heading";
import { SelectIconSVG } from "../../../../components/SvgIcons";

const DesignationMaster = () => {
  const [t] = useTranslation();

  const initialValues = {
    Designation: "",
    grade: "",
  };
  const [tableData, setTableData] = useState([]);
  const [values, setValues] = useState({ ...initialValues });

  const [dropDownState, setDropDownState] = useState([]);
  const EDPBindDesignationtableinMasterAPI = async () => {
    const response = await EDPBindDesignationtableinMaster();
    if (response?.success) {
      setTableData(response?.data);
    } else {
      // notify(response?.message, "error");
    }
  };

  const EDPBindGradeAPI = async () => {
    const response = await EDPBindGrade();
    if (response?.success) {
      setDropDownState(response?.data);
      /*  setDropDownState((val) => ({
        ...val,
        Grades: handleReactSelectDropDownOptions(
          response?.data,
          "ID", // Ensure it matches API response
          "Grade"
        ),
      })); */
    } else {
      // notify(response?.message, "error");
    }
  };
  const handleInputChange = (e, index, label) => {
    const { name, value } = e.target;
    setValues((val) => ({ ...val, [label]: value }));
  };

  const handleReactSelect = (label, value) => {
    setValues((val) => ({ ...val, [label]: value }));
  };

  const THEAD = [
    { name: t("S.No."), width: "1%" },
    { name: t("Designation") },
    { name: t("Grade") },
    { name: t("Edit") },
  ];

  const handleEdit = (ele) => {
    debugger;
    console.log("Ele", ele);
    setValues({
      ...initialValues, // Reset to default values
      Designation: ele.Designation_Name || "",
      desiID: ele?.Des_ID,
      isEdit: 1,
      grade: ele?.Grade,
    });
  };

  const handleSave = async () => {
    if (!values?.Designation && !values?.grade) {
      notify(t("Please enter required Fields"), "error");
      return;
    }
    debugger
    const payload = {
      designation: values?.Designation,
      grade: values?.grade.value,
      activity: values?.isEdit === 1 ? 2 : 1,
      desID: values?.desiID,
    };

    const response = await EDPSaveDesignation(payload);
    if (response?.success) {
      notify(response?.message, "success");
      EDPBindDesignationtableinMasterAPI();
    } else {
      notify(response?.message, "error");
    }
  };

  useEffect(() => {
    EDPBindDesignationtableinMasterAPI();
    EDPBindGradeAPI();
  }, []);
  console.log(dropDownState, "wqwqw");

  return (
    <>
      <Input
        type="text"
        className={"form-control required-fields"}
        lable={t("Designation")}
        placeholder=" "
        //   id="ItemName"
        name="Designation"
        onChange={(e) => handleInputChange(e, 0, "Designation")}
        value={values?.Designation}
        required={true}
        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
      />
      <ReactSelect
        placeholderName={t("Grade")}
        id="grade"
        requiredClassName={"required-fields"}
        name="grade"
        value={values?.grade}
        handleChange={(name, e) => handleReactSelect(name, e)}
        dynamicOptions={dropDownState?.map((item) => ({
          label: item?.Grade,
          value: item?.Grade,
        }))}
        searchable={true}
        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
      />
      <button
        className=" btn btn-sm btn-success ml-2 px-3"
        onClick={handleSave}
      >
        {values?.isEdit === 1 ? t("Update") : t("Save")}
      </button>
      <button
        className=" btn btn-sm btn-success ml-2 px-3"
        onClick={() => {
          setValues(initialValues);
        }}
      >
        {t("Reset")}
      </button>
      <div className="col-12 pt-2">
        <Heading title={t("Designation Master Details")} />
        <Tables
          thead={THEAD}
          tbody={tableData?.map((ele, index) => ({
            Sno: index + 1,
            Designation_Name: ele?.Designation_Name,
            Grade: ele?.Grade,
            Edit: (
              <div onClick={() => handleEdit(ele)} className="fa fa-edit"></div>
            ),
          }))}
        />
      </div>
    </>
  );
};

export default DesignationMaster;
