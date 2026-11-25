import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../../../../components/UI/Heading";
import TextAreaInput from "../../../../components/formComponent/TextAreaInput";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import {
  BindRatingMaster,
  SaveRatingMaster,
} from "../../../../networkServices/HRApi";
import { notify } from "../../../../utils/utils";
import Tables from "../../../../components/UI/customTable";

function EmployeeRatingMaster() {
  const [t] = useTranslation();
  const initialvalues = {
    ratingName: "",
    isActive: "",
    activity: 1,
    ratingid: 0,
  };

  const thead = [
    { name: t("S.No"), width: "2%" },
    { name: t("Rating Details") },
    { name: t("Active") },
    { name: t("Edit"), width: "4%" },
  ];
  const ACTIVE_INACTIVE = [
    { label: t("YES"), value: "1" },
    { label: t("NO"), value: "0" },
  ];
  const [values, setValues] = useState(initialvalues);
  const [tabelData, settabelData] = useState([]);
  const handlechange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };
  const handleReactSelect = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const fetchRatingMasterData = async () => {
    try {
      const r = await BindRatingMaster();
      if (r.success) {
        settabelData(r?.data);
      }
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const handleSave = async () => {
    debugger
    if (!values?.ratingName || !values?.isActive) {
      notify(t("Please Select required Fields"), "error");
      return;
    }
    const payload = {
      ratingName: values?.ratingName,
      isActive: values?.isActive.value,
      activity: values?.activity ? values?.activity : 1,
      ratingid: values?.ratingid ? values?.ratingid : 0,
    };
    debugger;
    try {
      const r = await SaveRatingMaster(payload);
      if (r.success) {
        notify(r.message, "success");
        fetchRatingMasterData();
        setValues({ ...initialvalues });
      }
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const handleEdit = (item) => {
    setValues({
      ...values,
      ratingName: item?.RatingDetails,
      isActive: item?.IsActive === "Yes" ? "1" : "0",
      activity: 2,
      ratingid: item?.ID,
    });
  };
  useEffect(() => {
    fetchRatingMasterData();
  }, []);
  return (
    <>
      <div className="col-12">
        <Heading title={t("Rating Master")} isBredcrumb={false} />
        <div className="row p-2">
          <TextAreaInput
            lable={t("Rating Name")}
            className="form-control"
            placeholder={""}
            id="ratingName"
            rows={2}
            name="ratingName"
            value={values?.ratingName}
            respclass={"col-xl-4 col-md-4 col-sm-4 col-12"}
            onChange={(e) => handlechange(e)}
            maxLength={200}
          />
          <ReactSelect
            placeholderName={t("Is Active")}
            name="isActive"
            id="isActive"
            value={values?.isActive}
            handleChange={handleReactSelect}
            dynamicOptions={ACTIVE_INACTIVE}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          />
          <div className="text-right">
            <button
              className="btn btn-sm btn-success mx-2"
              onClick={handleSave}
            >
              {values?.ratingid ? t("Update") : t("Save")}
            </button>
            <button
              className="btn btn-sm btn-success mx-2"
              onClick={() => setValues({ ...initialvalues })}
            >
              {t("Reset")}
            </button>
          </div>
        </div>

        <Heading title={t("Rating Master Details")} isBreadcrumb={false} />
        {tabelData.length > 0 && (
          <Tables
            thead={thead}
            tbody={tabelData?.map((item, index) => ({
              Sno: index + 1,
              RatingDetails: item?.RatingDetails,
              IsActive: item?.IsActive,
              Edit: (
                <>
                  <i className="fa fa-edit cursor-pointer" onClick={() => handleEdit(item)} />
                </>
              ),
            }))}
          />
        )}
      </div>
    </>
  );
}

export default EmployeeRatingMaster;
