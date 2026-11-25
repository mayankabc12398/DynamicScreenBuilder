import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { employeeDropdownLabel } from "../../../utils/utils";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import {
  EDPGetDeptWiseAuth,
  EDPgetSetCentre,
  EDPSaveUserAuth,
} from "../../../networkServices/EDP/edpApi";
import Tables from "../../../components/UI/customTable";
import { EdpSearchEmployee } from "../../../networkServices/edpApi";

const UserAuthorization = (data) => {
  const [t] = useTranslation();
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const [values, setValues] = useState({});
  console.log("values", values)
  const [tableData, setTableData] = useState([]);
  const [checkedDepartments, setCheckedDepartments] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const THEAD = [
    { name: t("S.No."), width: "1%" },
    {
      name: (
        <>
          <input
            type="checkbox"
            className="table-checkbox"
            style={{ marginLeft: "6px" }}
            checked={selectAll}
            onChange={() => handleSelectAll()}
          />
          <span className="ml-2">{t("Department Belong")}</span>
        </>
      ),
      width: "2%",
    },
    { name: t("Modules"), width: "2%" },
    { name: t("Col Description"), width: "2%" },
  ];

  const [dropDownState, setDropDownState] = useState({
    Department: [],
    empName: [],
  });

  const handleReactSelect = async (name, e) => {
    if (name === "empName") {
      setValues((prev) => ({ ...prev, empName: e }));
      return;
    }
    const updatedValues = { ...values, [name]: e };
    setValues(updatedValues);

    const empID = values?.empName?.value ? values?.empName?.value : "0";
    const centreID = e.value ? e.value : "";

    const response = await EDPGetDeptWiseAuth(empID, centreID);
    setTableData(response?.data);

    if (response?.success) {
      // Update checked departments based on IsRights
      updateCheckedDepartments(response?.data);
      notify(t("Record Found"), "success");
    } else {
      notify(response?.message, "error");
    }
  };

  // Helper function to update checked departments based on data
  const updateCheckedDepartments = (data) => {
    const deptMap = {};

    // Group by department
    data.forEach((row) => {
      if (!deptMap[row.DeptBelong]) {
        deptMap[row.DeptBelong] = [];
      }
      deptMap[row.DeptBelong].push(row);
    });

    // Check which departments have all IsRights === 1
    const newCheckedDepts = new Set();
    Object.entries(deptMap).forEach(([dept, rows]) => {
      if (rows.every((row) => row.IsRights === 1)) {
        newCheckedDepts.add(dept);
      }
    });

    setCheckedDepartments(newCheckedDepts);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    setCheckedDepartments(
      newSelectAll ? new Set(tableData.map((row) => row.DeptBelong)) : new Set()
    );

    setTableData((prevData) =>
      prevData.map((row) => ({
        ...row,
        IsRights: newSelectAll ? 1 : 0,
      }))
    );
  };

  const fetchCenters = async () => {
    const empId = "LSHHI10";
    const response = await EDPgetSetCentre(empId);
    if (response?.success) {
      setDropDownState((val) => ({
        ...val,
        Department: handleReactSelectDropDownOptions(
          response?.data,
          "CentreName",
          "CentreID"
        ),
      }));
    } else {
      notify(response?.message, "error");
    }
  };

  const handleDeptCheck = (deptName) => {
    setCheckedDepartments((prevChecked) => {
      const updatedChecked = new Set(prevChecked);
      const shouldCheck = !updatedChecked.has(deptName);

      if (shouldCheck) {
        updatedChecked.add(deptName);
      } else {
        updatedChecked.delete(deptName);
      }

      // Update the tableData accordingly
      setTableData((prevData) =>
        prevData.map((row) => {
          if (row.DeptBelong === deptName) {
            return { ...row, IsRights: shouldCheck ? 1 : 0 };
          }
          return row;
        })
      );

      return updatedChecked;
    });
  };

  const handleColDescriptionCheck = (index, newChecked) => {
    setTableData((prev) => {
      const updatedData = prev.map((item, i) =>
        i === index ? { ...item, IsRights: newChecked } : item
      );

      // After updating, check if all items in this department are checked
      const currentDept = updatedData[index].DeptBelong;
      const deptRows = updatedData.filter((row) => row.DeptBelong === currentDept);
      const allChecked = deptRows.every((row) => row.IsRights === 1);

      setCheckedDepartments((prevChecked) => {
        const newChecked = new Set(prevChecked);
        if (allChecked) {
          newChecked.add(currentDept);
        } else {
          newChecked.delete(currentDept);
        }
        return newChecked;
      });

      return updatedData;
    });
  };

  const handleSave = async () => {
    const payload = tableData.map((ele) => ({
      roleID: ele.RoleID,
      roleName: ele.Role,
      uaid: ele.UAID,
      deptBelongID: ele.DeptBelongID,
      deptBelong: ele.DeptBelong,
      employeeID: values?.empName?.value,
      centreID: values?.Department?.value,
      status: ele.IsRights === 1,
      colName: ele.ColName,
      colValue: ele.IsRights === 1 ? "true" : "false",
    }));

    try {
      const response = await EDPSaveUserAuth(payload);
      if (response.success) {
        notify(t("Saved Successfully"), "success");
      } else {
        notify(response.message, "error");
      }
    } catch (error) {
      console.error("Save Error:", error);
      notify(t("Error while saving"), "error");
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

  // Add this function to handle specific cell styling
  const handleCellStyle = (rowData, columnName, columnIndex) => {
    console.log("columnData", rowData, columnName, columnIndex)
    // Apply background only when the cell has content (first occurrence)
    if (columnName === "Department Belong" && rowData["Department Belong"]) {
      return {
        backgroundColor: "black", // Light blue
        fontWeight: "500",
      };
    }

    if (columnName === "Modules" && rowData.Modules) {
      return {
        backgroundColor: "#f3e5f5", // Light purple
        fontWeight: "500",
      };
    }

    return {};
  };

  useEffect(() => {
    fetchCenters();
    bindEmp();
  }, []);

  // Update selectAll state based on tableData
  useEffect(() => {
    if (tableData.length > 0) {
      const allChecked = tableData.every((row) => row.IsRights === 1);
      setSelectAll(allChecked);
    }
  }, [tableData]);

  return (
    <div className="card mt-2">
      <Heading title={t("Employee Details")} isBreadcrumb={true} />
      <div className="row p-3">
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
        <ReactSelect
          placeholderName={t("Centre")}
          id={"Department"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          dynamicOptions={dropDownState?.Department}
          name="Department"
          handleChange={handleReactSelect}
          value={values?.Department?.value}
          requiredClassName="required-fields"
        />
      </div>

      {tableData?.length > 0 && (
        <div>
          <Heading title={t("User-Authorization Controls")} />
          <Tables
            thead={THEAD}
            style={{ height: "50vh" }}
            specificCellStyle={handleCellStyle}
            tbody={(() => {
              const renderedDeptBelong = new Set();
              const renderedModules = new Set();

              return tableData?.map((ele, index) => {
                const isDeptFirstOccurrence = !renderedDeptBelong.has(
                  ele.DeptBelong
                );
                const isModulesFirstOccurrence = !renderedModules.has(ele.Role);

                if (isDeptFirstOccurrence) {
                  renderedDeptBelong.add(ele.DeptBelong);
                }

                if (isModulesFirstOccurrence) {
                  renderedModules.add(ele.Role);
                }

                return {
                  SNo: index + 1,
                  "Department Belong": isDeptFirstOccurrence ? (
                    <div>
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={checkedDepartments.has(ele.DeptBelong)}
                        onChange={() => handleDeptCheck(ele.DeptBelong)}
                      />
                      <span className="ml-2">{ele?.DeptBelong}</span>
                    </div>
                  ) : (
                    ""
                  ),
                  Modules: isModulesFirstOccurrence ? ele?.Role : "",
                  "Col Description": (
                    <div>
                      <input
                        className="table-checkbox"
                        type="checkbox"
                        checked={ele.IsRights === 1}
                        onChange={(e) => {
                          const newChecked = e.target.checked ? 1 : 0;
                          handleColDescriptionCheck(index, newChecked);
                        }}
                      />
                      <span className="ml-2">{ele?.ColDescription}</span>
                    </div>
                  ),

                  ...Object.keys(ele)
                    .filter((key) => key.includes("_"))
                    .reduce((acc, center) => {
                      acc[center] = (
                        <input
                          type="checkbox"
                          checked={ele[center]}
                          onChange={(e) => handleRowCheck(index, center, e)}
                        />
                      );
                      return acc;
                    }, {}),
                };
              });
            })()}
          />
          {tableData?.length > 0 && (
            <div className="col-sm-2 p-2">
              <button className="btn btn-sm btn-success" onClick={handleSave}>
                {t("Save")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAuthorization;