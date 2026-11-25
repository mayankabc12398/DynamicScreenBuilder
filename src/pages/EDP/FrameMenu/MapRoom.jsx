import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import { handleReactSelectDropDownOptions, notify, reactSelectOptionList } from "../../../utils/utils";
import ReportsMultiSelect from "../../../components/ReportCommonComponents/ReportsMultiSelect";
import {
  BindCentre,
  GetFloorByCentre,
  GetRoomByFloor,
  MapRoleToRoom,
  SaveBank,
} from "../../../networkServices/EDP/pragyaedp";
import Input from "../../../components/formComponent/Input";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import MapRoleToPanel from "./MapRoleToPanel";
import { EDPGetRole } from "../../../networkServices/EDP/govindedp";

const MapRoom = ({ setVisible }) => {
  const [t] = useTranslation();
  const localData = useLocalStorage("userData", "get");
  const [openedDropdownName, setOpenedDropdownName] = useState(null);

  const ip = useLocalStorage("ip", "get");
  const initialValues = { SelectedCentre: "", floorCentre: [] };

  const [FloorSelctions, setFloorSelctions] = useState([]);
  const [dropDownState, setDropDownState] = useState([]);
  const [values, setValues] = useState({ ...initialValues });
  console.log("values", values)
  const [floorValues, setFloorValues] = useState({});
  const [floorList, setFloorList] = useState({});

  const handleReactSelect = (label, value) => {
    setValues((val) => ({ ...val, [label]: value }));
    if (label === "selectPriviledge") {
      setFloorSelctions([]);
      setValues((val) => ({
        ...val,
        SelectedCentre: ""
      }))
    }
  };

  const [centreValues, setCentreValues] = useState({
    BranchCentre: [],
  });

  console.log("CentreValues", centreValues);

  const [BindCentredata, setBindCentre] = useState([]);

  const handleBindCentre = async () => {
    try {
      const apiResp = await BindCentre(values?.selectPriviledge?.value);
      if (apiResp.success) {
        console.log("Centre data:", apiResp?.data);
        setBindCentre(apiResp?.data);
        setValues((val) => ({
          ...val,
          SelectedCentre: {
            "CentreID": 1,
            "CentreName": "Central Hospital",
            "label": "Central Hospital",
            "value": 1
          }
        }))
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error("Error loading centre data:", error);
      notify(t("An error occurred while loading centre data"), "error");
    }
  };
  const PrivledgeResponse = async () => {
    const response = await EDPGetRole();
    // if (response?.success) {

    setDropDownState({
      ...dropDownState,
      Priviledge: response?.map((val) => ({
        label: val?.RoleName,
        value: val?.ID
      })),
    });
    // } else {
    // setDropDownState({
    //   ...dropDownState,
    //   Priviledge: [],
    // })
    // }
  };
  console.log("drop", dropDownState)
  useEffect(() => {
    PrivledgeResponse();
  }, []);

  const handleFloorOption = async () => {
    try {
      if (!values?.SelectedCentre?.value) return;

      const apiResp = await GetFloorByCentre(values?.SelectedCentre?.value);
      if (apiResp.success) {
        setFloorSelctions(apiResp?.data);

        const initialFloorValues = {};
        apiResp?.data.forEach((floor) => {
          initialFloorValues[floor.ID] = [];

          handleFloorSelection(floor.ID, floor.NAME);
        });
        setFloorValues(initialFloorValues);
      } else {
        setFloorSelctions([]);
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error("Error loading floor data:", error);
      notify(t("An error occurred while loading floor data"), "error");
    }
  };

  const handleMultiSelectChange = (name, selectedOptions) => {

    setFloorValues((prev) => ({
      ...prev,
      [name.split("_")[1]]: selectedOptions, // extract floor ID from the name like "floor_1"
    }));
  };

  let floorID = centreValues?.BranchCentre?.map((item) => {
    return item.code;
  }).join(",");

  const handleFloorSelection = async (floorId, floorName) => {
    const payload = {
      roleID: values?.selectPriviledge?.value,
      floorId: floorId.toString(),
      floor: floorName,
    };

    try {
      const apiResp = await GetRoomByFloor(payload);
      if (apiResp.success) {
        console.log("API response for floor:", floorId, apiResp.data);

        // Store the floor specific data
        setFloorList((val) => ({ ...val, [floorId]: apiResp.data }));

        // Pre-populate floorValues with existing selections (isExist: 1)
        const existingRooms = apiResp.data
          .filter((room) => room.isExist === 1)
          .map((room) => ({
            code: room.IPDCaseTypeID.toString(),
            name: room.Name,
          }));

        setFloorValues((prev) => ({
          ...prev,
          [floorId]: existingRooms,
        }));
      }
    } catch (error) {
      console.error(`Error loading data for floor ${floorName}:`, error);
      notify(t("An error occurred while loading floor data"), "error");
    }
  };

  const getFloorOptions = (floorId, floorName) => {
    return floorList[floorId]?.map((item) => ({
      code: item.IPDCaseTypeID.toString(),
      name: item.Name,
    }));
  };

  const userData = localStorage.getItem("userData");

  const handleSave = async (ipdCaseTypeID, roleID, ipAddress) => {

    const selectedCodes = Object.entries(floorValues).flatMap(
      ([floorId, selectedItems]) =>
        selectedItems?.map((item) => `${item.code},${floorId}`)
    );

    if (selectedCodes?.length === 0) {
      notify(t("Please Select Atleast One Room"), "error");
      return
    }

    const payload = {
      ipdCaseTypeID: selectedCodes,
      roleID: values?.selectPriviledge?.value,
      ipAddress: ip,
    };

    console.log("Pyaload Going", payload);

    try {
      const apiResp = await MapRoleToRoom(payload);
      if (apiResp.success) {
        setFloorList([]);
        setFloorSelctions([]);
        setCentreValues([]);
        setValues((val) => ({
          ...val,
          SelectedCentre: ""
        }))
        // setVisible();
        notify(apiResp?.message, "success");
      } else {
        // notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error(`Error loading data for floor :`, error);
      notify(t("An error occurred while loading floor data"), "error");
    }
  };
  useEffect(() => {
    if (values?.selectPriviledge?.value) {
      handleBindCentre();
    }
  }, [values?.selectPriviledge?.value]);

  useEffect(() => {
    handleFloorOption();
  }, [values?.SelectedCentre?.value]);

  return (
    <div className="card mt-2">
      <div>
        <Heading title={t("Room Details")} isBreadcrumb={true} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("Role")}
            name="selectPriviledge"
            value={values?.selectPriviledge?.value}
            handleChange={(name, e) => handleReactSelect(name, e)}
            dynamicOptions={dropDownState?.Priviledge}
            removeIsClearable={true}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Centre")}
            name="SelectedCentre"
            value={values?.SelectedCentre?.value}
            handleChange={(name, e) => handleReactSelect(name, e)}
            dynamicOptions={[
              ...handleReactSelectDropDownOptions(
                BindCentredata,
                "CentreName",
                "CentreID"
              ),
            ]}
            removeIsClearable={true}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          {FloorSelctions.map((floor) => (
            <MultiSelectComp
              key={floor.ID}
              name={`floor_${floor.ID}`}
              id="BranchCentre"
              value={floorValues[floor.ID] || []}
              handleChange={(name, option) =>
                handleMultiSelectChange(name, option, floor.ID)
              }
              dynamicOptions={getFloorOptions(floor.ID, floor.NAME)}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              lable={floor.NAME}
              placeholderName={floor.NAME}
              overlayVisible={openedDropdownName === `floor_${floor.ID}`}
              onToggle={(e) => {
                if (e) {
                  setOpenedDropdownName(`floor_${floor.ID}`); // open this one
                } else {
                  setOpenedDropdownName(null); // close
                }
              }}
            />
          ))}

          <button
            className="btn btn-sm btn-success ml-2"
            style={{ width: "70px" }}
            onClick={handleSave}
          >
            {t("Save")}
          </button>
        </div>
      </div>
    </div>
    // </div >
  );
};

export default MapRoom;
