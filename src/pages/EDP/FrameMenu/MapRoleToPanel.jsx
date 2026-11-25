import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import TableData from "../../Finance/Approval/Audit/TableData";
import Tables from "../../../components/UI/customTable";
import { useTranslation } from "react-i18next";
import {
  EDPGetRole,
  EDPSaveRoleWiseCentrePanelGroup,
  GetCentreWithPanelGroupMappings,
} from "../../../networkServices/EDP/govindedp";
import { notify } from "../../../utils/utils";
import { EDPBindPanelGroupAPI } from "../../../networkServices/EDP/edpApi";
import ReactSelect from "../../../components/formComponent/ReactSelect";

const MapRoleToPanel = (data) => {
  const [t] = useTranslation();
  const [tableData, setTableData] = useState([]);
  const [dropDownState, setDropDownState] = useState([]);
  const [panelGroups, setPanelGroups] = useState([]);
  const [values, setValues] = useState({});

  // Create a dynamic groupIdMap from panelGroups
  const getGroupIdMap = () => {
    const map = {};
    panelGroups.forEach((panel) => {
      map[panel.PanelGroup] = panel.ID?.toString() || panel.PanelGroupID?.toString();
    });
    return map;
  };

  const handleSelectAll = (group, isChecked) => {
    setTableData((prevData) => {
      return prevData.map((row) => {
        let currentGroups = row.PanelGroup?.split(",").filter(Boolean) || [];

        let updatedGroups;

        if (isChecked) {
          updatedGroups = currentGroups.includes(group)
            ? currentGroups
            : [...currentGroups, group];
        } else {
          updatedGroups = currentGroups.filter((g) => g !== group);
        }

        const groupIdMap = getGroupIdMap();
        const updatedGroupIDs = updatedGroups
          .map((g) => groupIdMap[g])
          .filter(Boolean);

        return {
          ...row,
          PanelGroup: updatedGroups.join(","),
          PanelGroupID: updatedGroupIDs.join(","),
        };
      });
    });
  };

  const THEAD = [
    { name: t("S.No.") },
    { name: t("Centre Name") },

    ...panelGroups?.map((panel) => {
      // check if ALL rows have this panel selected
      const isAllSelected =
        tableData.length > 0 &&
        tableData.every((row) =>
          (row.PanelGroup?.split(",") || []).includes(panel.PanelGroup)
        );

      return {
        name: (
          <span className="ml-1">
            <input
              type="checkbox"
              className="ml-1 mr-2 table-checkbox"
              checked={isAllSelected}
              onChange={(e) =>
                handleSelectAll(panel.PanelGroup, e.target.checked)
              }
            />
            {panel?.PanelGroup}
          </span>
        ),
      };
    }),
  ];

  const handleReactSelect = (label, value) => {
    setValues((val) => ({ ...val, [label]: value }));
  };

  const GetCentreWithPanelGroupMappingsAPI = async (roleID) => {
    const response = await GetCentreWithPanelGroupMappings(roleID);
    if (response?.success) {
      setTableData(response?.data);
    } else {
      setTableData([]);
    }
  };

  const PrivledgeResponse = async () => {
    const response = await EDPGetRole();
    setDropDownState({
      ...dropDownState,
      Priviledge: response?.map((val) => ({
        label: val?.RoleName,
        value: val?.ID,
      })),
    });
  };

  const handleCheckboxChange = (index, group) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      const row = newData[index];

      // Get current groups from PanelGroup
      let currentGroups = row.PanelGroup?.split(",").filter(Boolean) || [];

      const groupExists = currentGroups.includes(group);

      // Toggle logic
      let updatedGroups;
      if (groupExists) {
        updatedGroups = currentGroups.filter((g) => g !== group);
      } else {
        updatedGroups = [...currentGroups, group];
      }

      // Create valid PanelGroupIDs from updated group names using dynamic map
      const groupIdMap = getGroupIdMap();
      const updatedGroupIDs = updatedGroups
        .map((g) => groupIdMap[g])
        .filter(Boolean);

      // Update the row
      newData[index] = {
        ...row,
        PanelGroup: updatedGroups.join(","),
        PanelGroupID: updatedGroupIDs.join(","),
      };

      return newData;
    });
  };

  const bindPanel = async () => {
    try {
      const response = await EDPBindPanelGroupAPI();
      if (response?.success) {
        setPanelGroups(response?.data);
      } else {
        setPanelGroups([]);
      }
    } catch (e) {
      notify(e?.message, "error");
    }
  };

  useEffect(() => {
    if (values?.selectRole?.value) {
      GetCentreWithPanelGroupMappingsAPI(values?.selectRole?.value);
    }
  }, [values?.selectRole?.value]);

  useEffect(() => {
    PrivledgeResponse();
    bindPanel();
  }, []);

  const handleSave = async () => {
    const roleID = values?.selectRole?.value;
    const groupIdMap = getGroupIdMap();

    const payload = {
      RoleID: roleID,
      MappedRolesWisePanelGroup: tableData?.map((ele) => {
        const groups = ele.PanelGroup?.split(",").filter(Boolean) || [];
        const panelGroupIDs = groups
          .map((g) => groupIdMap[g])
          .filter(Boolean)
          .join(",");

        return {
          centreID: ele.CentreID || 0,
          roleID: roleID,
          PanelGroupIDs: panelGroupIDs || "",
        };
      }),
    };

    try {
      const response = await EDPSaveRoleWiseCentrePanelGroup(payload);
      if (response?.success) {
        notify(response?.message || "Saved successfully", "success");
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      notify(t("Something went wrong while saving"), "error");
      console.error("Save error:", error);
    }
  };

  return (
    <div className="card mt-2">
      <Heading title={t("Map Role to Panel")} isBreadcrumb={true} />
      <div className="p-2">
        <ReactSelect
          placeholderName={t("Role")}
          name="selectRole"
          value={values?.selectRole?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.Priviledge}
          removeIsClearable={true}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <Tables
          thead={THEAD}
          tbody={tableData?.map((ele, index) => {
            const selectedGroups = ele.PanelGroup?.split(",") || [];

            const row = {
              "S.No.": index + 1,
              "Centre Name": ele?.CentreName,
            };

            panelGroups.forEach((panel) => {
              row[panel.PanelGroup] = (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={selectedGroups.includes(panel.PanelGroup)}
                  onChange={() =>
                    handleCheckboxChange(index, panel.PanelGroup)
                  }
                />
              );
            });

            return row;
          })}
        />

        {tableData?.length > 0 && (
          <div className="m-1" style={{ textAlign: "end" }}>
            <button
              className="btn btn-sm btn-success ml-2 px-3"
              onClick={handleSave}
            >
              {t("Save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapRoleToPanel;