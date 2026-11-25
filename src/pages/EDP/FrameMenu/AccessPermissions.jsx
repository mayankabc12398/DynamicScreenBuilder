import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../../../components/UI/Heading";
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import TextAreaInput from "../../../components/formComponent/TextAreaInput";
import BrowseButton from "../../../components/formComponent/BrowseButton";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import {
  EDPAllMappings,
  handleSaveCentreAccessAPI,
} from "../../../networkServices/EDP/edpApi";
import { handleSaveCentrePayload } from "../../../utils/ustil2";
import Tables from "../../../components/UI/customTable";
import { EDPBindAllCentre } from "../../../networkServices/edpApi";
import AccessPermissionGrid from "./AccessPermissionGrid";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";

export default function AccessPermissions({ data, setVisible }) {
  const isMobile = window.innerWidth <= 800;

  const [t] = useTranslation();

  const localData = useLocalStorage("userData", "get");
  const [bodyData, setBodyData] = useState([]);
  const [centreList, setCentreList] = useState([]);
  const initialValues = {
    Centre: { value: localData?.centreID },
  };
  const [values, setValues] = useState(initialValues);

  const handleChangeCheckHead = (checked, name) => {
    let data = [...bodyData]?.map((val) => {
      val[name].isChecked = checked;
      return val;
    });
    setBodyData(data);
  };
  const tHead = [
    { name: "S.No.", width: "1%" },
    {
      name: isMobile ? (
        t("Role")
      ) : (
        <>
          <input
            type="checkbox"
            id={`Role`}
            className="CentreMasterCheckbox table-checkbox"
            onChange={(e) => {
              handleChangeCheckHead(e?.target?.checked, "roles");
            }}
          />
          <label htmlFor={`Role`} className="pointer-cursor">
            {" "}
            {t("Role")}{" "}
          </label>
        </>
      ),
      width: "1%",
    },
    {
      name: isMobile ? (
        t("Doctor")
      ) : (
        <>
          <input
            type="checkbox"
            id={`Doctor`}
            className="CentreMasterCheckbox table-checkbox"
            onChange={(e) => {
              handleChangeCheckHead(e?.target?.checked, "doctors");
            }}
          />
          <label htmlFor={`Doctor`} className="pointer-cursor">
            {" "}
            {t("Doctor")}{" "}
          </label>
        </>
      ),
      width: "1%",
    },
    {
      name: isMobile ? (
        t("Panel")
      ) : (
        <>
          <input
            type="checkbox"
            id={`Panel`}
            className="CentreMasterCheckbox table-checkbox"
            onChange={(e) => {
              handleChangeCheckHead(e?.target?.checked, "panels");
            }}
          />
          <label htmlFor={`Panel`} className="pointer-cursor">
            {" "}
            {t("Panel")}{" "}
          </label>
        </>
      ),
      width: "1%",
    },
    {
      name: isMobile ? (
        t("Employee")
      ) : (
        <>
          <input
            type="checkbox"
            id={`Employee`}
            className="CentreMasterCheckbox table-checkbox"
            onChange={(e) => {
              handleChangeCheckHead(e?.target?.checked, "employees");
            }}
          />
          <label htmlFor={`Employee`} className="pointer-cursor">
            {" "}
            {t("Employee")}{" "}
          </label>
        </>
      ),
      width: "1%",
    },
    {
      name: isMobile ? (
        t("Department Indent")
      ) : (
        <>
          <input
            type="checkbox"
            id={`Department Indent`}
            className="CentreMasterCheckbox table-checkbox"
          />
          <label htmlFor={`Department Indent`} className="pointer-cursor">
            {" "}
            {t("Department Indent")}{" "}
          </label>
        </>
      ),
      width: "1%",
    },
    {
      name: isMobile ? (
        t("Patient Indent")
      ) : (
        <>
          <input
            type="checkbox"
            id={`Patient Indent`}
            className="CentreMasterCheckbox table-checkbox"
          />
          <label htmlFor={`Patient Indent`} className="pointer-cursor">
            {" "}
            {t("Patient Indent")}{" "}
          </label>
        </>
      ),
      width: "1%",
    },
  ];

  const GetEDPAllMappings = async (centreID) => {
    let apiResp = await EDPAllMappings(centreID);
    if (apiResp?.success) {
      // const largestArray = Object.entries(apiResp?.data).reduce(
      //   (max, current) =>
      //     current[1]?.length > max[1]?.length ? current[1] : max,
      // );
      const largestArray = Object.values(apiResp?.data || {}).reduce(
     (max, current) => (current?.length > max?.length ? current : max),
     [],
      );
      let data = largestArray?.map((val, index) => {
        let departmentIndent = apiResp?.data?.roles.filter(
          (val) => val?.IsStore === 1,
        );
        return {
          roles: {
            ...apiResp?.data?.roles[index],
            isChecked: Boolean(apiResp?.data?.roles[index]?.MapID),
          },
          doctors: {
            ...apiResp?.data?.doctors[index],
            isChecked: Boolean(apiResp?.data?.doctors[index]?.MapID),
          },
          employees: {
            ...apiResp?.data?.employees[index],
            isChecked: Boolean(apiResp?.data?.employees[index]?.MapID),
          },
          panels: {
            ...apiResp?.data?.panels[index],
            isChecked: Boolean(apiResp?.data?.panels[index]?.MapID),
          },
          departmentIndent: {
            ...departmentIndent[index],
            isChecked: Boolean(departmentIndent[index]?.IsDepartmentIndent),
          },
          patientIndent: {
            ...departmentIndent[index],
            isChecked: Boolean(departmentIndent[index]?.IsPatientIndent),
          },
        };
      });
      setBodyData(data);
    }
  };
  const getAllCentreList = async () => {
    let apiResp = await EDPBindAllCentre();
    if (apiResp?.success) {
      setCentreList(
        handleReactSelectDropDownOptions(
          apiResp?.data,
          "CentreName",
          "CentreID",
        ),
      );
    }
  };
  useEffect(() => {
    getAllCentreList();
    GetEDPAllMappings(localData?.centreID);
  }, []);

  const handleSaveRole = async (listData) => {
    let payload = handleSaveCentrePayload(listData, values?.Centre?.value);
    // return
    let apiResp = await handleSaveCentreAccessAPI(
      payload,
      "SavesRolesMappingsDetailsURL",
    );

    if (apiResp?.success) {
      notify(apiResp?.message);
      GetEDPAllMappings(values?.Centre?.value);
    } else {
      notify(apiResp?.message, "error");
    }
  };
  // Department Indent and Patient Indent are role-level flags on f_centre_role
  // (IsDepartmentIndent / IsPatientIndent), not separate mapping tables. They
  // were previously posted to the role-mapping and panel-mapping endpoints
  // respectively, so ticking a box either rebuilt the whole role mapping or
  // wrote to panel mappings - in neither case did the flag change. Both now go
  // to their own endpoints, which zero the flag across the centre and set it to
  // 1 for the roles that are ticked.
  const SaveDeparment = async (listData) => {
    let payload = handleSaveCentrePayload(listData, values?.Centre?.value);
    let apiResp = await handleSaveCentreAccessAPI(
      payload,
      "SavesDIMappingsDetailsURL",
    );
    if (apiResp?.success) {
      notify(apiResp?.message);
      GetEDPAllMappings(values?.Centre?.value);
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const SavePatientIndent = async (listData) => {
    let payload = handleSaveCentrePayload(listData, values?.Centre?.value);
    let apiResp = await handleSaveCentreAccessAPI(
      payload,
      "SavesPIMappingsDetailsURL",
    );
    if (apiResp?.success) {
      notify(apiResp?.message);
      GetEDPAllMappings(values?.Centre?.value);
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const handleSaveDoctor = async (listData) => {
    let payload = handleSaveCentrePayload(listData, values?.Centre?.value);
    let apiResp = await handleSaveCentreAccessAPI(
      payload,
      "SavesDoctorMappingsDetailsURL",
    );
    if (apiResp?.success) {
      notify(apiResp?.message);
      GetEDPAllMappings(values?.Centre?.value);
    } else {
      notify(apiResp?.message, "error");
    }
  };
  const handleSavePanel = async (listData) => {
    let payload = handleSaveCentrePayload(listData, values?.Centre?.value);
    let apiResp = await handleSaveCentreAccessAPI(
      payload,
      "handleSavePanelCentreURL",
    );
    if (apiResp?.success) {
      notify(apiResp?.message);
      GetEDPAllMappings(values?.Centre?.value);
    } else {
      notify(apiResp?.message, "error");
    }
  };
  const handleSaveEmployee = async (listData) => {
    let payload = handleSaveCentrePayload(listData, values?.Centre?.value);
    let apiResp = await handleSaveCentreAccessAPI(
      payload,
      "SavesEmployeeMappingsDetailsURL",
    );
    if (apiResp?.success) {
      notify(apiResp?.message);
      GetEDPAllMappings(values?.Centre?.value);
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const handleChangeCheckbox = (e, val, index, type) => {
    const updatedData = JSON.parse(JSON.stringify(bodyData));
    updatedData[index][type].isChecked = e.target.checked;
    setBodyData(updatedData);
  };

  const handleSelect = async (name, value) => {
    if (name === "Centre") {
      GetEDPAllMappings(value?.value);
    }
    setValues((val) => ({ ...val, [name]: value }));
  };

  return (
    <>
      <div className="mt-2 ">
        <div className=" card">
          <Heading
            title={data?.breadcrumb}
            // isMainHeading={{ data: data, FrameMenuID: data?.FrameMenuID }}
            data={data}
            isBreadcrumb={true}
            secondTitle={
              <div className="mt-1 w-20">
                <ReactSelect
                  placeholderName={t("Centre")}
                  id={"Centre"}
                  searchable={true}
                  removeIsClearable={true}
                  requiredClassName={"required-fields"}
                  respclass="w-100"
                  dynamicOptions={centreList}
                  handleChange={handleSelect}
                  value={values?.Centre?.value}
                  name={"Centre"}
                />
              </div>
            }
          />

          {/* <div className="p-2 ">
            <ReactSelect
              placeholderName={t("Centre")}
              id={"Centre"}
              searchable={true}
              removeIsClearable={true}
              requiredClassName={"required-fields"}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              dynamicOptions={centreList}
              handleChange={handleSelect}
              value={values?.Centre?.value}
              name={"Centre"}
            />
          </div> */}
          {bodyData?.length > 0 && (
            <div className="row">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 p-1">
                <AccessPermissionGrid
                  data={bodyData?.map((val) => val?.roles)}
                  name={"Role"}
                  handleClick={handleSaveRole}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 p-1">
                <AccessPermissionGrid
                  data={bodyData?.map((val) => val?.doctors)}
                  name={"Doctors"}
                  handleClick={handleSaveDoctor}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 p-1">
                <AccessPermissionGrid
                  data={bodyData?.map((val) => val?.panels)}
                  name={"Panels"}
                  handleClick={handleSavePanel}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 p-1">
                <AccessPermissionGrid
                  data={bodyData?.map((val) => val?.employees)}
                  name={"employees"}
                  handleClick={handleSaveEmployee}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 p-1">
                <AccessPermissionGrid
                  data={bodyData?.map((val) => val?.departmentIndent)}
                  name={"departmentIndent"}
                  handleClick={SaveDeparment}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 p-1">
                <AccessPermissionGrid
                  data={bodyData?.map((val) => val?.patientIndent)}
                  name={"patientIndent"}
                  handleClick={SavePatientIndent}
                />
              </div>
              {/* <AccessPermissionGrid/>
          <AccessPermissionGrid/>
          <AccessPermissionGrid/>
          <AccessPermissionGrid/>
          <AccessPermissionGrid/> */}
            </div>
          )}

          {/* <Tables
            thead={tHead}
            // scrollView={"scrollView"}
            isSearch={false}
            tbody={bodyData?.map((val, index) => ({
              Sno: index + 1,
              role: val?.roles?.TextField && (
                <>
                  {" "}
                  <input
                    type="checkbox"
                    id={`roleID_${index}`}
                    checked={val?.roles?.isChecked}
                    className="CentreMasterCheckbox table-checkbox "
                    onChange={(e) => {
                      handleChangeCheckbox(e, val, index, "roles");
                    }}
                  />
                  <label htmlFor={`roleID_${index}`}>
                    {" "}
                    {val?.roles?.TextField}{" "}
                  </label>{" "}
                </>
              ),

              doctors: val?.doctors?.TextField && (
                <>
                  <input
                    type="checkbox"
                    id={`doctorsID_${index}`}
                    className="CentreMasterCheckbox table-checkbox"
                    onChange={(e) => {
                      handleChangeCheckbox(e, val, index, "doctors");
                    }}
                    checked={val?.doctors?.isChecked}
                  />{" "}
                  <label htmlFor={`doctorsID_${index}`}>
                    {" "}
                    {val?.doctors?.TextField}{" "}
                  </label>{" "}
                </>
              ),

              panels: val?.panels?.TextField && (
                <>
                  <input
                    type="checkbox"
                    id={`panelsID_${index}`}
                    className="CentreMasterCheckbox table-checkbox"
                    onChange={(e) => {
                      handleChangeCheckbox(e, val, index, "panels");
                    }}
                    checked={val?.panels?.isChecked}
                  />{" "}
                  <label htmlFor={`panelsID_${index}`}>
                    {" "}
                    {val?.panels?.TextField}{" "}
                  </label>{" "}
                </>
              ),

              employees: val?.employees?.TextField && (
                <>
                  {" "}
                  <input
                    type="checkbox"
                    id={`employeesID_${index}`}
                    className="CentreMasterCheckbox table-checkbox"
                    onChange={(e) => {
                      handleChangeCheckbox(e, val, index, "employees");
                    }}
                    checked={val?.employees?.isChecked}
                  />{" "}
                  <label htmlFor={`employeesID_${index}`}>
                    {" "}
                    {val?.employees?.TextField}{" "}
                  </label>{" "}
                </>
              ),

              departmentIndent: val?.departmentIndent?.TextField && (
                <>
                  <input
                    type="checkbox"
                    id={`ID_${index}`}
                    checked={val?.departmentIndent?.isChecked}
                    className="CentreMasterCheckbox table-checkbox"
                  />{" "}
                  <label htmlFor={`ID_${index}`}>
                    {" "}
                    {val?.departmentIndent?.TextField}{" "}
                  </label>{" "}
                </>
              ),

              patientIndent: val?.patientIndent?.TextField && (
                <>
                  {" "}
                  <input
                    type="checkbox"
                    id={`ID_${index}`}
                    checked={val?.patientIndent?.isChecked}
                    className="CentreMasterCheckbox table-checkbox"
                  />{" "}
                  <label htmlFor={`ID_${index}`}>
                    {" "}
                    {val?.patientIndent?.TextField}{" "}
                  </label>
                </>
              ),
            }))}
            style={{ maxHeight: "65vh" }}
          /> */}
          {/* <div className="row p-2">
            <div className="col-2 text-center">
              <button
                className="btn btn-sm btn-primary px-3"
                onClick={handleSaveRole}
              >
                {t("Save Role")}{" "}
              </button>
            </div>
            <div className="col-2 text-center">
              <button
                className="btn btn-sm btn-primary px-3"
                onClick={handleSaveDoctor}
              >
                {t("Save Doctor")}
              </button>
            </div>
            <div className="col-2 text-center">
              <button
                className="btn btn-sm btn-primary px-3"
                onClick={handleSavePanel}
              >
                {t("Save Panel")}{" "}
              </button>
            </div>
            <div className="col-2 text-right">
              <button
                className="btn btn-sm btn-primary px-3"
                onClick={handleSaveEmployee}
              >
                {t("Save Employee")}{" "}
              </button>
            </div>
            <div className="col-2 text-right">
              <button
                className="btn btn-sm btn-primary px-3"
                onClick={SaveDeparment}
              >
                {t("Save Deparment")}{" "}
              </button>
            </div>
            <div className="col-2 text-center">
              <button className="btn btn-sm btn-primary px-3">
                {t("Save Patient")}{" "}
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </>
  );
}
