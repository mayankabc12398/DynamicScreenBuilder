import React, { useEffect, useRef, useState } from "react";
import SelectableBadge from "../../../components/UI/EDP/SelectedBadge";
import Heading from "../../../components/UI/Heading";
import {
  EDPgetSetCentre,
  EDPGetUserAccess,
  EDPSaveUserRoles,
  EDPUpdateCentre,
} from "../../../networkServices/EDP/edpApi";
import Tables from "../../../components/UI/customTable";
import { notify } from "../../../utils/utils";
import LabeledInput from "../../../components/formComponent/LabeledInput";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { employeeDropdownLabel } from "../../../utils/utils";
import Input from "../../../components/formComponent/Input";
import { EdpSearchEmployee } from "../../../networkServices/edpApi";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";

const CentreAccess = (data) => {
  const [t] = useTranslation();
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const [centers, setCenters] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [previousSelectedCenters, setPreviousSelectedCenters] = useState([]);
  const [filteredEnabled, setFilterEnabled] = useState(false)
  const isInitialLoad = useRef(true);

  const [dropDownState, setDropDownState] = useState({
    empName: [],
    department: [],
    centers: [],
  });
  const [enable, setEnable] = useState(false);

  const [selectedCenters, setSelectedCenters] = useState([]);
  const [checkedColumns, setCheckedColumns] = useState({});
  const [values, setValues] = useState({
    isLogin: {
      value: 0
    }
  });

  const isMobile = window.innerWidth <= 800;

  const handleReactSelect = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    setValues({
      ...values,
      [name]: selectedOptions,
    });
  };

  const fetchCenters = async () => {
    const empId = values?.empName?.value ?? 0;
    const response = await EDPgetSetCentre(empId);
    if (response?.success) {
      setDropDownState((prev) => ({
        ...prev,
        centers: response?.data,
      }));
      const selectedData = response?.data?.filter((ele) => ele?.CentreSet === "TRUE");
      isInitialLoad.current = true;
      setValues((val) => ({
        ...val,
        centers:
          selectedData?.map((ele) => ({
            ...ele,
            code: ele?.CentreID,
            name: ele?.CentreName,
          })) ?? [],
      }));
      setCenters(response?.data);
    } else {
      notify(response?.message, "error");
    }
  };

  const fetchUserAccess = async () => {
    const empID = values?.empName?.value ?? 0;
    const response = await EDPGetUserAccess(empID);
    if (response?.success) {
      setTableData(response?.data?.dtResponse);
      setValues((val) => ({
        ...val,
        username: response?.data?.userName
      }))
    } else {
      setTableData([]);
      notify(response?.message, "error");
    }
  };

  useEffect(() => {
    if (values?.empName?.value) {
      fetchCenters();
      fetchUserAccess();
    }
  }, [values?.empName?.value]);

  // Update selectedCenters when centers are selected from dropdown
  useEffect(() => {
    if (values?.centers && values?.centers.length > 0) {
      const centerNames = values.centers.map((center) => center.name);
      setSelectedCenters(centerNames);

      // Initialize checkedColumns state
      const initialCheckedState = {};
      centerNames.forEach((name) => {
        initialCheckedState[name] = false;
      });
      setCheckedColumns(initialCheckedState);
    } else {
      setSelectedCenters([]);
      setCheckedColumns({});
    }
  }, [values?.centers]);

  const handleColumnCheck = (center) => {
    setCheckedColumns((prev) => {
      const isChecked = !prev[center];

      setTableData((prevData) =>
        prevData.map((row) => {
          let key = Object.keys(row).find((k) => {
            if (k === "RoleID" || k === "RoleName") return false;
            const keyPrefix = k.split("_")[0];
            return keyPrefix.toLowerCase() === center.toLowerCase();
          });

          if (key) {
            return { ...row, [key]: isChecked ? 1 : 0 };
          }
          return row;
        })
      );

      return { ...prev, [center]: isChecked };
    });
  };

  const handleRowCheck = (center, index, key, e) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      newData[index][key] = e.target.checked ? 1 : 0;
      return newData;
    });
  };

  const isAllCheckedForCenter = (center) => {
    return tableData.every((row) => {
      const key = Object.keys(row).find((k) => {
        if (k === "RoleID" || k === "RoleName") return false;
        const keyPrefix = k.split("_")[0];
        return keyPrefix.toLowerCase() === center.toLowerCase();
      });
      return key && (row[key] === 1 || row[key] === true);
    });
  };

  const THEAD = [
    { name: t("S.N."), width: "5%" },
    { name: t("Module"), width: "20%" },
    ...selectedCenters.map((center) => ({
      name: isMobile ? (
        center
      ) : (
        <>
          <input
            type="checkbox"
            className="table-checkbox"
            checked={isAllCheckedForCenter(center)}
            onChange={() => handleColumnCheck(center)}
          />
          <span style={{ marginLeft: "8px" }}>{center}</span>
        </>
      ),
      width: "8%",
    })),
  ];

  const handleSave = async () => {
    const payload = [];
    if(!values?.empName?.value){
      notify("Please Select Employee Name", "warn");
      return;
    }
    if(!selectedCenters?.length){
      notify("Please Select Centre", "warn");
      return;
    }
    if(values?.isLogin?.value){
      if(!values?.username){
        notify(t("Please Enter User Name"), "warn");
        return;
      }
      if(!values?.password){
        notify(t("Please Enter Password"), "warn");
        return;
      }
      if(!values?.confirmPass){
        notify(t("Please Enter Confirm Password"), "warn");
        return;
      }
    }
    if (values?.password !== values?.confirmPass) {
      notify(t("Both Password and confirm Password do not match"), "error");
      return
    }

    tableData.forEach((module) => {
      selectedCenters.forEach((center) => {
        let key = Object.keys(module).find((k) => {
          if (k === "RoleID" || k === "RoleName") return false;
          const keyPrefix = k.split("_")[0];
          return keyPrefix.toLowerCase() === center.toLowerCase();
        });

        let isChecked = key && (module[key] === 1 || module[key] === true);

        const centerData = centers?.find(
          (centre) => centre?.CentreName?.toLowerCase() === center.toLowerCase()
        );
        payload.push({
          isUpdateLogin: values?.isLogin?.value,
          employeeID: values?.empName?.value || "",
          userName: values?.username || "",
          status: isChecked,
          roleID: module?.RoleID || "",
          centerID: centerData?.CentreID || "",
          password: values?.password || "",
        });
      });
    });

    if (payload.length === 0 && selectedCenters.length > 0) {
      selectedCenters.forEach((center) => {
        const centerData = centers?.find(
          (centre) => centre?.CentreName?.toLowerCase() === center.toLowerCase()
        );
        payload.push({
          isUpdateLogin: values?.isLogin?.value,
          employeeID: values?.empName?.value || "",
          userName: values?.username || "",
          status: false,
          roleID: "",
          centerID: centerData?.CentreID || "",
          password: values?.password || "",
        });
      });
    }

    const ResponseData = await EDPSaveUserRoles(payload);

    if (ResponseData?.success) {
      notify(ResponseData?.message, "success");
      await fetchUserAccess();
    } else {
      notify(ResponseData?.message, "error");
    }
  };

  const bindEmp = async () => {
    const payloadToBe = {
      empName: values?.empName || "",
      department: values?.Department?.value || "0",
    };
    const dataResult = await EdpSearchEmployee(payloadToBe);
    if (dataResult?.success) {
      setDropDownState((prev) => ({
        ...prev,
        empName: dataResult?.data,
      }));
    } else {
      setDropDownState((prev) => ({
        ...prev,
        empName: [],
      }));
      notify(dataResult?.message, "error");
    }
  };

  const updateCenter = async (centerName, isChecked) => {
    try {
      if (!values?.empName?.value) return;

      const centerData = centers?.find(
        (centre) => centre?.CentreName?.toLowerCase() === centerName.toLowerCase()
      );

      if (!centerData) return;

      const payloadToBe = {
        employeeID: values?.empName?.value,
        centreID: centerData?.CentreID,
        isChecked: isChecked,
      };

      const response = await EDPUpdateCentre(payloadToBe);

      if (response?.success) {
        notify(response?.message, "success");
      } else {
        notify(response?.message, "error");
      }
    } catch (e) {
      notify(e.message, "error");
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((val) => ({
      ...val,
      [name]: value
    }))
  }

  useEffect(() => {
    if (!values?.empName?.value || centers.length === 0) return;

    // Skip API calls on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      setPreviousSelectedCenters(selectedCenters);
      return;
    }

    // Find newly added centers
    const addedCenters = selectedCenters.filter(
      (center) => !previousSelectedCenters.includes(center)
    );

    // Find removed centers
    const removedCenters = previousSelectedCenters.filter(
      (center) => !selectedCenters.includes(center)
    );

    // Call API for added centers
    addedCenters.forEach((center) => {
      updateCenter(center, true);
    });

    // Call API for removed centers
    removedCenters.forEach((center) => {
      updateCenter(center, false);
    });

    // Update previous selected centers
    setPreviousSelectedCenters(selectedCenters);
  }, [selectedCenters]);

  useEffect(() => {
    bindEmp();
  }, []);


  useEffect(() => {
    if (values?.isLogin?.value === 0) {
      setValues((val) => ({
        ...val,
        confirmPass: "",
        password: "",
      }))
    }
  }, [values?.isLogin?.value])

  return (
    <div className="card mt-2">
      <Heading
        title={data?.breadcrumb}
        isSlideScreen={false}
        isBreadcrumb={true}
      />

      <div className="py-1 p-2 row" style={{ gap: "10px" }}>
        <ReactSelect
          placeholderName={t("Employee Name")}
          name="empName"
          id="empName"
          value={values?.empName?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.empName?.map((val) => ({
            ...val,
            label: employeeDropdownLabel(val, GetGlobalResources),
            value: val?.EmployeeID,
          }))}
          searchable={true}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          name="centers"
          id="centers"
          placeholderName={t("Centre")}
          dynamicOptions={dropDownState?.centers?.map((ele) => ({
            ...ele,
            code: ele?.CentreID,
            name: ele?.CentreName,
          }))}
          handleChange={handleMultiSelectChange}
          value={values?.centers}
        />
      </div>

      {tableData?.length > 0 && <div className="w-100">
        <Heading title={t("Centre Access")} />
        <Tables
          thead={THEAD}
          style={{ height: "58vh" }}
          tbody={tableData.map((ele, index) => {
            const row = {
              "S.N.": index + 1,
              Module: ele?.RoleName,
            };

            selectedCenters.forEach((center) => {
              const key = Object.keys(ele).find((k) => {
                if (k === "RoleID" || k === "RoleName") return false;

                const keyPrefix = k.split("_")[0];
                return keyPrefix.toLowerCase() === center.toLowerCase();
              });
              if (key) {
                row[center] = (
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={ele[key] === 1.0 || ele[key] === true}
                    onChange={(e) => handleRowCheck(center, index, key, e)}
                  />
                );
              } else {
                row[center] = (
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={false}
                    onChange={(e) => handleRowCheck(center, index, center, e)}
                  />
                );
              }
            });

            return row;
          })}
        />

      </div>}

      <Heading title={t("Login Details")} isBreadcrumb={false} />

      <div className="row p-2">
        <ReactSelect
          placeholderName={t("Is Login Upadate")}
          name="isLogin"
          id="isLogin"
          value={values?.isLogin?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: t("Yes"), value: 1 },
            { label: t("No"), value: 0 },
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
        />
        <Input
          type="text"
          className={"form-control"}
          id={"username"}
          name={"username"}
          value={values?.username}
          disabled={!values?.isLogin?.value}
          onChange={(e) => handleChange(e)}
          lable={t("Username")}
          placeholder=" "
          respclass={"col-xl-2 col-md-3 col-sm-6 col-12"}
        />
        <Input
          type="text"
          className={"form-control"}
          id={"password"}
          name={"password"}
          value={values?.password}
          disabled={!values?.isLogin?.value}
          onChange={(e) => handleChange(e)}
          lable={t("Password")}
          placeholder=" "
          respclass={"col-xl-2 col-md-3 col-sm-6 col-12"}
        />
        <Input
          type="text"
          className={"form-control"}
          id={"confirmPass"}
          name={"confirmPass"}
          value={values?.confirmPass}
          disabled={!values?.isLogin?.value}
          onChange={(e) => handleChange(e)}
          lable={t("Confirm Password")}
          placeholder=" "
          respclass={"col-xl-2 col-md-3 col-sm-6 col-12"}
        />

        <div className="d-flex justify-content-end">
          <button className="btn btn-success" onClick={handleSave}>
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CentreAccess;