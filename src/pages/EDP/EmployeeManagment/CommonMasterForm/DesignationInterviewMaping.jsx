import React, { useEffect, useState } from "react";
import {
  EDPBindDesignation,
  EDPDeleteDocumentMap,
  EDPSaveDesigDocMap,
} from "../../../../networkServices/EDP/govindedp";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import {
  handleReactSelectDropDownOptions,
  notify,
} from "../../../../utils/utils";
import Heading from "../../../../components/UI/Heading";
import Tables from "../../../../components/UI/customTable";
import {
  BindDesignationIVRoundMap,
  BindInterViewRound,
  DeleteDesignationMap,
  SaveDesignationWithIVRound,
} from "../../../../networkServices/HRApi";

const DesignationInterviewMaping = () => {
  const [t] = useTranslation();
  const initialvalues = {
    desiID: "",
    ivRoundID: "",
    isActive: "",
    activity: "",
    mapID: 0,
  };
  const [DropDownState, setDropDownState] = useState({
    Designation: [],
    InterviewRound: [],
  });

  const [tableData, setTableData] = useState([]);
  const [values, setValues] = useState(initialvalues);

  const THEAD = [
    { name: t("S.No."), width: "3%" },
    { name: t("Designation Name") },
    { name: t("Interview Round") },
    { name: t("Active") },
    { name: t("Delete"), width: "3%" },
  ];

  const BindMappedData = async (id = 0) => {
    const response = await BindDesignationIVRoundMap(id);

    if (response?.success) {
      setTableData(response?.data || []);
    } else {
      setTableData([]);
      notify(response?.message, "error");
    }
  };

  const BindDesignation = async () => {
    const response = await EDPBindDesignation();
    if (response?.success) {
      setDropDownState((prev) => ({
        ...prev,
        Designation: handleReactSelectDropDownOptions(
          response?.data,
          "Designation_Name",
          "Des_ID",
        ),
      }));
    } else {
      notify(response?.message, "error");
    }
  };

  const BindInterviewRound = async () => {
    const response = await BindInterViewRound();
    if (response?.success) {
      setDropDownState((prev) => ({
        ...prev,
        InterviewRound: handleReactSelectDropDownOptions(
          response?.data,
          "Name",
          "ID",
        ),
      }));
    } else {
      notify(response?.message, "error");
    }
  };

  const handleReactSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleMap = async () => {
    if (!values?.desiID || !values?.ivRoundID) {
      notify(t("Please Select required Fields"), "error");
      return;
    }
    const payload = {
      desiID: values?.desiID?.value,
      ivRoundID: values?.ivRoundID?.value,
      isActive: 1,
      activity: 1,
      mapID: 0,
    };
    const response = await SaveDesignationWithIVRound(payload);
    if (response?.success) {
      notify(response?.message, "success");
      setValues({});
      BindMappedData(0);
    } else {
      notify(response?.message, "error");
    }
  };

  const handleDelete = async (id) => {
    const response = await DeleteDesignationMap(id);
    if (response?.success) {
      notify(response?.message, "success");
      BindMappedData(0);
    } else {
      notify(response?.message, "error");
    }
  };

  useEffect(() => {
    BindDesignation();
    BindInterviewRound();
    BindMappedData(0);
  }, []);

  useEffect(() => {
    debugger;
    if (values?.desiID) {
      BindMappedData(values?.desiID?.value);
    }
  }, [values?.desiID]);

  return (
    <>
      <ReactSelect
        placeholderName={t("Designation")}
        name="desiID"
        id="desiID"
        value={values?.desiID}
        handleChange={handleReactSelect}
        dynamicOptions={DropDownState?.Designation}
        searchable={true}
        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
      />

      <ReactSelect
        placeholderName={t("Interview Round")}
        name="ivRoundID"
        id="ivRoundID"
        value={values?.ivRoundID}
        requiredClassName={"required-fields"}
        handleChange={handleReactSelect}
        dynamicOptions={DropDownState?.InterviewRound}
        searchable={true}
        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
      />

      <button className="btn btn-sm btn-success ml-2 px-3" onClick={handleMap}>
        {t("Map")}
      </button>

      <button
        className="btn btn-sm btn-success ml-2 px-3"
        onClick={() => setValues({})}
      >
        {t("Reset")}
      </button>

      <div className="col-12 pt-2">
        <Heading title={t("Designation - Interview Round Mapping Details")} />
        <Tables
          thead={THEAD}
          tbody={tableData?.map((ele, index) => ({
            Sno: index + 1,
            Designation_Name: ele?.Designation_Name,
            Name: ele?.Name,
            IsActive: ele?.IsActive,
            Delete: (
              <>
                <i class="fa fa-trash text-danger" onClick={() => handleDelete(ele?.MapID)}></i>
              </>
            ),
          }))}
        />
      </div>
    </>
  );
};

export default DesignationInterviewMaping;
