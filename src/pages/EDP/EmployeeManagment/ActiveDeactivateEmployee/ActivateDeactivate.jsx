import React, { useEffect } from "react";
import Heading from "../../../../components/UI/Heading";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MultiSelectComp from "../../../../components/formComponent/MultiSelectComp";
import {
  handleReactSelectDropDownOptions,
  notify,
} from "../../../../utils/utils";
import {
  ActivateDeActivateDrEmp,
  EDPActDeactEmpSave,
  EDPLoadDoctor,
  EDPLoadEmployee,
} from "../../../../networkServices/EDP/edpApi";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";

const ActivateDeactivate = ({ data }) => {
  const [t] = useTranslation();

  const initialState = {
    Type: "0",
    Status: "1",
  };

  const [values, setValues] = useState({});
  const [payload, setPayload] = useState({ ...initialState });
  useEffect(() => {
    console.log("values", payload);
  });
  const handleReactSelect = (name, e) => {
    setPayload({
      ...payload,
      [name]: e.value,
    });
  };

  const EditableOptions = [
    { label: t("Employee"), value: "0" },
    { label: t("Doctor"), value: "1" },
  ];

  const ActiveOptions = [
    { label: t("Active"), value: "1" },
    { label: t("De-Active"), value: "0" },
  ];

  const handleMultiSelectChange = (name, selectedOptions) => {
    setPayload({ ...payload, [name]: selectedOptions });
  };

  const [dropDownState, setDropDownState] = useState({
    Employees: [],
  });

  const fetchEmployees = async (isActive) => {
    const response = await EDPLoadEmployee(isActive);
    if (response?.success) {
      let selectedValue = [];
      let data = response?.data?.map((val) => {
        let returnData = {
          code: val?.id,
          name: val?.NAME,
        };
        if (val?.IsActive === "Active") {
          selectedValue.push(returnData);
        }
        return returnData;
      });
      setPayload((val) => ({ ...val, injury: selectedValue }));

      setDropDownState((val) => ({
        ...val,
        Employees: data,
      }));
    } else {
      setDropDownState({
        Employees: [],
        injury: [],
      });
        setPayload((val) => ({ ...val, injury: [] }));
      notify(response?.message, "error");
    }
  };
  const fetchDoctor = async (isActive) => {
    const response = await EDPLoadDoctor(isActive);
    if (response?.success) {
      let selectedValue = [];
      let data = response?.data?.map((val) => {
        let returnData = {
          code: val?.id,
          name: val?.NAME,
        };
        if (val?.IsActive === "True") {
          selectedValue.push(returnData);
        }
        return returnData;
      });
      setPayload((val) => ({ ...val, injury: selectedValue }));

      setDropDownState((val) => ({
        ...val,
        Employees: data,
      }));
    } else {
        setDropDownState((val) => ({
        ...val,
        Employees: [],
        injury: [],
      }));
       setPayload((val) => ({ ...val, injury: [] }));
      notify(response?.message, "error");
    }
  };

  //   const handleSave = async () => {
  //     const payloadToBe = {
  //       type: 0,
  //       listEMpDoc: [
  //         {
  //           statusValue: "string",
  //           status: true,
  //         },
  //       ],
  //     };

  //     const response = await EDPActDeactEmpSave(payloadToBe);

  //     if(response?.success){
  //         notify(response?.message , "success")
  //     }else{
  //         notify(response?.message , "error")
  //     }
  //   };

  const ip = useLocalStorage("ip", "get");

  const handleSave = async () => {
    const type = payload.Type === "0" ? 0 : 1;

    const listEMpDoc = payload?.injury.map((emp) => ({
    // const listEMpDoc = dropDownState.Employees.map((emp) => ({
      id: emp.code,
      IsActive:
      payload?.Status=== "1"  ? 0 : 1,
        // payload.injury?.some((selected) => selected.code === emp.code) ? 1 : 0,
      iIpAddress: ip,
    }));
    const payloadToBe = {
      type: type,
      listEMpDoc: listEMpDoc,

    };

    console.log("Final Payload:", payloadToBe); // Debugging

    // Call API
    const response = await ActivateDeActivateDrEmp(payloadToBe);

    if (response?.success) {
      notify(response?.message, "success");
    } else {
      notify(response?.message, "error");
    }
  };

  useEffect(() => {
    if (payload.Type === "0") {
      fetchEmployees(payload.Status);
    } else if (payload.Type === "1") {
      fetchDoctor(payload.Status);
    }
  }, [payload.Type, payload.Status]);

  return (
    <div className="card mt-2">
      <Heading
        title={data?.breadcrumb}
        // isMainHeading={{ data: data, FrameMenuID: data?.FrameMenuID }}
        data={data}
        isSlideScreen={true}
        isBreadcrumb={true}
      />
      <div className="row p-3">
        <ReactSelect
          placeholderName={t("Type")}
          id={"Type"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          dynamicOptions={EditableOptions}
          name="Type"
          handleChange={handleReactSelect}
          value={payload?.Type}
        //   requiredClassName="required-fields"
        />
        <ReactSelect
          placeholderName={t("Status")}
          id={"Status"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          dynamicOptions={ActiveOptions}
          name="Status"
          handleChange={handleReactSelect}
          value={payload?.Status}
        //   requiredClassName="required-fields"
        />
{
  console.log("payload?.injury",payload?.injury)
}
        <MultiSelectComp
          respclass="col-xl-4 col-md-4 col-sm-6 col-12"
          name="injury"
          id="injury"
          placeholderName={payload?.Status === "1" ? t("Remove Selection To De-Activate") : t("Add Selection To Activate")}
          dynamicOptions={dropDownState?.Employees}
          handleChange={handleMultiSelectChange}
          value={payload?.injury}
        />
        <div className="col-sm-2">
          <button className="btn btn-sm btn-success" onClick={handleSave}>
            {t(payload?.Status === "1" ? "De-Activate" : "Activate")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivateDeactivate;
