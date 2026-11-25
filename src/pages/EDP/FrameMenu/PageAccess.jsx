import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import LabeledInput from "../../../components/formComponent/LabeledInput";
import Tables from "../../../components/UI/customTable";
// import index from "../CentreManagement/index";
import { notify } from "../../../utils/utils";
import {
  EDPGetUserAccess,
  EDPSavePageAccess,
  GetRoleWisePages,
} from "../../../networkServices/EDP/edpApi";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { employeeDropdownLabel } from "../../../utils/utils";
import { EdpSearchEmployee } from "../../../networkServices/edpApi";
import ReactSelect from "../../../components/formComponent/ReactSelect";

const PageAccess = (data) => {
  const [t] = useTranslation();
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const [selectedCenters, setSelectedCenters] = useState([]);
  const [checkedColumns, setCheckedColumns] = useState({});
  const [values, setValues] = useState({
    empName: "",
    Department: "",
  })
  const [tableData, setTableData] = useState([]);
  const renderedRoles = new Set();
  const renderMenu = new Set();
  const [dropDownState, setDropDownState] = useState({
    empName: [],
  })

  const handleColumnCheck = (center) => {
    // Get all rows for this center
    const centerKey = `${center}_`;
    const allRowsForCenter = tableData.map(row => {
      const key = Object.keys(row).find((k) => k.startsWith(centerKey));
      return key ? { key, value: row[key], disabled: row[key] === 2 } : null;
    }).filter(Boolean);

    // Check if any row is disabled (value === 2)
    const hasDisabled = allRowsForCenter.some(item => item.disabled);
    if (hasDisabled) return; // Don't allow toggling if any row is disabled

    // Toggle all non-disabled rows
    const newCheckedState = !checkedColumns[center];

    setCheckedColumns((prev) => ({
      ...prev,
      [center]: newCheckedState,
    }));

    setTableData((prevData) =>
      prevData.map((row) => {
        const key = Object.keys(row).find((k) => k.startsWith(centerKey));
        if (key && row[key] !== 2) {
          return { ...row, [key]: newCheckedState ? 1 : 0 };
        }
        return row;
      })
    );
  };

  const handleRowCheck = (index, center, e) => {
    let data = JSON.parse(JSON.stringify(tableData));
    data[index][center] = e?.target?.checked ? 1 : 0;
    setTableData(data);
  };

  const isMobile = window.innerWidth <= 800;

  // Helper function to check if all checkboxes in a column are checked
  const isAllCheckedForCenter = (center) => {
    const centerKey = `${center}_`;
    return tableData.every((row) => {
      const key = Object.keys(row).find((k) => k.startsWith(centerKey));
      if (!key) return true;
      // Only consider non-disabled rows
      if (row[key] === 2) return true;
      return row[key] === 1 || row[key] === true;
    });
  };

  // Helper function to check if any row in a column is disabled
  const hasDisabledInCenter = (center) => {
    const centerKey = `${center}_`;
    return tableData.some((row) => {
      const key = Object.keys(row).find((k) => k.startsWith(centerKey));
      return key && row[key] === 2;
    });
  };

  // Centre columns are the keys carrying a "_" (CentreName_CentreID).
  const centerKeysOf = (row) => Object.keys(row).filter((k) => k.includes("_"));

  const rowsOfModule = (roleName) =>
    tableData.filter((row) => row?.RoleName === roleName);

  // A module counts as selected when every page under it is granted for every
  // centre column. Cells the server sends as 2 are locked and always skipped.
  const isModuleChecked = (roleName) => {
    const rows = rowsOfModule(roleName);
    if (rows.length === 0) return false;

    return rows.every((row) =>
      centerKeysOf(row).every((key) => row[key] === 2 || row[key] === 1),
    );
  };

  const isModuleLocked = (roleName) =>
    rowsOfModule(roleName).every((row) =>
      centerKeysOf(row).every((key) => row[key] === 2),
    );

  // Ticking a module grants every page under it in one go, which is what the
  // page-by-page selection made tedious.
  const handleModuleCheck = (roleName) => {
    const newValue = isModuleChecked(roleName) ? 0 : 1;

    setTableData((prevData) =>
      prevData.map((row) => {
        if (row?.RoleName !== roleName) return row;

        const updated = { ...row };
        centerKeysOf(row).forEach((key) => {
          if (updated[key] !== 2) updated[key] = newValue;
        });
        return updated;
      }),
    );
  };

  const THEAD = [
    { name: t("S.No"), width: "5%" },
    { name: t("Module"), width: "20%" },
    { name: t("Menu"), width: "20%" },
    { name: t("Display Name"), width: "20%" },
    ...selectedCenters.map((center) => ({
      name: isMobile ? (
        center
      ) : (
        <>
          <input
            className="table-checkbox"
            type="checkbox"
            checked={isAllCheckedForCenter(center)}
            disabled={hasDisabledInCenter(center)}
            onChange={() => handleColumnCheck(center)}
          />
          <span style={{ marginLeft: "8px" }}>{center}</span>
        </>
      ),
      width: "8%",
    })),
  ];

  console.log("tableData", tableData);

  const getRoleWiseAccessAPI = async () => {
    try {
      const empID = values?.empName?.value;
      const res = await GetRoleWisePages(empID);
      if (res?.success) {
        setTableData(res?.data);

        const centers = [
          ...new Set(
            res?.data.flatMap(
              (ele) =>
                Object.keys(ele)
                  .filter((key) => key.includes("_"))
                  .map((key) => key.split("_")[0])
            )
          ),
        ];

        setSelectedCenters(centers);
        notify(data?.message, "success");
      } else {
        notify(data?.message, "error");
      }
    } catch (error) {
      console.log(error);
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

  const handleSave = async () => {
    const empID = values?.empName?.value;
    let payload = [];

    tableData.forEach((row) => {
      selectedCenters.forEach((center) => {
        const centerKey = Object.keys(row).find((key) =>
          key.startsWith(center + "_")
        );
        if (centerKey) {
          payload.push({
            RoleID: row.RoleID.toString(),
            MenuID: row.MenuID.toString(),
            UrlID: row.UrlID.toString(),
            EmployeeID: empID,
            RoleName: row.RoleName || "",
            CentreID: parseInt(centerKey.split("_")[1]),
            Status: Boolean(row[centerKey] === 1),
          });
        }
      });
    });

    console.log("Payload:", payload);

    const dataReceived = await EDPSavePageAccess(payload);

    if (dataReceived?.success) {
      notify(dataReceived?.message, "success");
    } else {
      notify(dataReceived?.message, "error");
    }
  };

  const handleReactSelect = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    bindEmp();
  }, []);

  const handleCellStyle = (rowData, columnName, columnIndex) => {
    if (columnName === "Module" && rowData.Module) {
      return {
        backgroundColor: "#e3f2fd", // Light blue
        fontWeight: "500",
      };
    }

    if (columnName === "Menu" && rowData.Menu) {
      return {
        backgroundColor: "#f3e5f5", // Light purple
        fontWeight: "500",
      };
    }

    if (columnName === "Display Name") {
      return {
        backgroundColor: "#fff3e0", // Light orange
        fontWeight: "500",
      };
    }

    return {}; // Return empty object for other cells
  };

  useEffect(() => {
    if (values?.empName?.value) {
      getRoleWiseAccessAPI();
    }
  }, [values?.empName?.value])

  return (
    <div className="mt-2 card">
      <Heading title={t("Page Access")} isBreadcrumb={true} />
      <div className="card p-2">
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
      </div>
      <Heading title={t("Page Access Details")} />
      <Tables
        thead={THEAD}
        style={{ height: "50vh" }}
        specificCellStyle={handleCellStyle}
        tbody={tableData?.map((ele, index) => {
          const isFirstOccurrence = !renderedRoles.has(ele.RoleName);
          const isMenuFirstOccurrence = !renderMenu.has(ele.MenuName);

          if (isFirstOccurrence) {
            renderedRoles.add(ele.RoleName);
          }

          if (isMenuFirstOccurrence) {
            renderMenu.add(ele.MenuName);
          }

          return {
            SNo: index + 1,
            Module: isFirstOccurrence ? (
              <>
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={isModuleChecked(ele?.RoleName)}
                  disabled={isModuleLocked(ele?.RoleName)}
                  onChange={() => handleModuleCheck(ele?.RoleName)}
                />
                <span style={{ marginLeft: "8px" }}>{ele?.RoleName}</span>
              </>
            ) : (
              ""
            ),
            Menu: isMenuFirstOccurrence ? ele?.MenuName : "",
            DisplayName: ele?.DispName,

            ...Object.keys(ele)
              .filter((key) => key.includes("_"))
              .reduce((acc, center) => {

                const centerValue = ele[center];

                acc[center] = (
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={centerValue === 1}
                    disabled={centerValue === 2}
                    onChange={(e) => handleRowCheck(index, center, e)}
                  />
                );

                return acc;
              }, {}),
          };
        })}
      />
      {tableData?.length > 0 && (
        <div className="w-100 p-2 d-flex justify-content-end">
          <button className="btn btn-sm btn-success" onClick={handleSave}>
            {t("Save")}
          </button>
        </div>
      )}
    </div>
  );
};

export default PageAccess;
