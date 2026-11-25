import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import Tables from "../../../components/UI/customTable";
import Input from "../../../components/formComponent/Input";
import EDPSeeMoreList from "../EDPSeeMoreList";
import SeeMoreSlideScreen from "../../../components/UI/SeeMoreSlideScreen";
import SlideScreen from "../../../components/front-office/SlideScreen";
import { AutoComplete } from "primereact/autocomplete";
import NewObservationModal from "./NewObservationModal";
import EditObservationDetailModal from "./EditObservationDetailModal";
import MapInvestigationObservationDragTable from "./MapInvestigationObservationDragTable";
import {
  BindInvestigationMaster,
  BindObservationInvestigation,
  GetObservationData,
  SaveObservationInvestigation,
  SaveObservationInvestigationMapping,
  RemoveObservationInvestigation,
  SaveObservationMap,
  SaveNewObservation,
  GetObservationMasterData,
} from "../../../networkServices/EDP/edpApi";
import { components } from "react-select";
import Modal from "../../../components/modalComponent/Modal";
import ManageInvestigationModal from "./manageInvetigaion";
import { useSelector } from "react-redux";

function MapInvestigationObservationNew({ data }) {
  const [t] = useTranslation();
  const [observation, setObservation] = useState([]);
  const [seeMore, setSeeMore] = useState([]);
  const [handleModelData, setHandleModelData] = useState({});
  const [ObservationData, setObservationData] = useState([]);
  // const [values, setValues] = useState({ investigation: { value: "", label: "" }, observation: "" });
  const [values, setValues] = useState({ investigation: "", observation: "" });
  console.log("values", values)
  const [searchvalue, setSearchValue] = useState("");
  const [genericSuggestions, setGenericSuggestions] = useState([]);
  const [observationMappings, setObservationMappings] = useState([]);
  const [investigationList, setInvestigationList] = useState([]);
  const [investigationMasterList, setInvestigationMasterList] = useState([]);
  const [visible, setVisible] = useState(false);
  const [renderComponent, setRenderComponent] = useState({
    name: null,
    component: null,
  });
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const filterData = GetGlobalResources?.find(
    (item) => item.Name === "IsNablLogo"
  );
  const showNablLogo =
    filterData?.Value === "1" || filterData?.value === "1";
  // NABL "Select All" in the column heading: ticked when every row is NABL
  const allNablChecked =
    observationMappings?.length > 0 && observationMappings.every((row) => row?.isNabl);
  const handleSelectAllNabl = (checked) => {
    setObservationMappings((prev) => prev.map((row) => ({ ...row, isNabl: checked })));
  };
  const theadObservation = [
    { width: "5%", name: t("SNo") },
    { width: "15%", name: t("Observation ID") },
    { width: "15%", name: t("Observation Name") },
    { width: "10%", name: t("Prefix") },
    { width: "15%", name: t("Method") },
    { width: "15%", name: t("Header") },
    { width: "15%", name: t("Critical") },
    { width: "15%", name: t("Bold") },
    { width: "10%", name: t("UnderLine") },
    ...(showNablLogo
      ? [
          {
            width: "10%",
            label: t("NABL"),
            // Select All: ticks / unticks NABL on every observation of this investigation
            name: (
              <label className="d-flex align-items-center mb-0" style={{ cursor: "pointer", gap: 4 }}>
                <input
                  type="checkbox"
                  title={t("Select All")}
                  checked={allNablChecked}
                  disabled={!observationMappings?.length}
                  onChange={(e) => handleSelectAllNabl(e.target.checked)}
                />
                {t("NABL")}
              </label>
            ),
          },
        ]
      : []),
    { width: "15%", name: t("Microscopy") },
    { width: "15%", name: t("Parent ID") },
    { width: "15%", name: t("Edit") },
    { width: "15%", name: t("Remove") },
  ];

  console.log("investigation", values?.investigation)

  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };
  useEffect(() => {
    if (ObservationData.length > 0) {
      const mappedData = ObservationData.map((val) => ({
        prefix: val.prefix || "",
        method: val.methodName || "",
        isHeader: val.child_Flag === "1",
        isCritical: val.isCritical === "1",
        isBold: val.isBold === "True",
        isUnderLine: val.isUnderLine === "True",
        isMicroscopy: val.isMicroScopy === "1",
        isNabl: val.isNabl === "1",
        isComment: val.isComment === "True",
        parentId: val.parentID || "",
      }));
      setObservationMappings(mappedData);
    }
  }, [ObservationData]);

  useEffect(() => {
    if (values?.investigation?.value) {
      handleGetObservationData(values?.investigation?.value);
    }
  }, [values?.investigation?.value])

  const handleBindObservationInvestigation = async () => {
    try {
      const response = await BindObservationInvestigation();
      if (response.success) setObservation(response.data);
    } catch (error) {
      console.error("Error fetching observation data:", error);
    }
  };

  const handleGetObservationData = async (id) => {
    try {
      const res = await GetObservationData(id);
      if (res.success) {
        setObservationData(res.data);
        setObservationMappings(
          res.data.map(() => ({
            prefix: "",
            method: "",
            isCritical: false,
            isBold: false,
            isUnderLine: false,
            isNabl: false,
            isMicroscopy: false,
            isHeader: false,
            parentId: "",
            isComment: false,
          }))
        );
      }
      if (!res?.success) {
        setObservationData([]);
        notify(res?.message, "error")
      }
    } catch (error) {
      console.error("Error getting observation data:", error);
    }
  };

  // const handleSaveObservationInvestigationMapping = async () => {
  //   try {
  //     console.log("observationMappings:", observationMappings);
  //     console.log("investigationList:", investigationList);
  //     console.log("ObservationData:", ObservationData);

  //     if (!observationMappings?.length) {
  //       notify("No observation mappings found", "error");
  //       return;
  //     }

  //     if (!investigationList?.length) {
  //       notify("Investigation list is empty", "error");
  //       return;
  //     }

  //     let payload = observationMappings.map((row, i) => ({
  //       investigationID: investigationList[0]?.VALUE,
  //       prifix: row?.prefix || "",
  //       printOrder: i + 1,
  //       methodName: row?.method || "",
  //       childFlag: 1,
  //       isCritical: row?.isCritical ? 1 : 0,
  //       isBold: row?.isBold ? 1 : 0,
  //       isUnderLine: row?.isUnderLine ? 1 : 0,
  //       isNabl: row?.isNabl ? 1 : 0,
  //       parentID: row?.parentId || 0,
  //       isMicroscopy: row?.isMicroscopy ? 1 : 0,
  //       labObservationID: ObservationData?.[i]?.obsID || 0,
  //       isComment: row?.isComment ? 1 : 0,
  //       suffix: "",
  //     }));

  //     console.log("Final Payload:", payload);

  //     const response = await SaveObservationInvestigationMapping(payload);
  //     console.log("API Response:", response);

  //     if (response?.success) {
  //       notify(response?.message || "Saved successfully", "success");
  //       handleBindObservationInvestigation();
  //     } else {
  //       notify(response?.message || "Save failed", "error");
  //     }
  //   } catch (error) {
  //     console.error("Save error:", error);
  //     notify("Error saving observation mappings", "error");
  //   }
  // };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedObservationData = Array.from(ObservationData);
    const reorderedMappings = Array.from(observationMappings);

    const [removedObservation] = reorderedObservationData.splice(
      result.source.index,
      1
    );
    const [removedMapping] = reorderedMappings.splice(
      result.source.index,
      1
    );

    reorderedObservationData.splice(
      result.destination.index,
      0,
      removedObservation
    );

    reorderedMappings.splice(
      result.destination.index,
      0,
      removedMapping
    );

    setObservationData(reorderedObservationData);
    setObservationMappings(reorderedMappings);
  };

  const handleSaveObservationInvestigationMapping = async () => {
    debugger
    try {
      let payload = [];
      for (let i = 0; i < observationMappings.length; i++) {
        const row = observationMappings[i];
        console.log("the row data is", row);
        const payloadobj = {
          investigationID: values?.investigation?.value ?? "",
          // investigationID: investigationList[0]?.VALUE,
          prifix: row.prefix || "",
          printOrder: i + 1,
          methodName: row.method || "",
          childFlag: row?.isHeader ? 1 : 0,
          isCritical: row.isCritical ? 1 : 0,
          isBold: row.isBold ? 1 : 0,
          isUnderLine: row.isUnderLine ? 1 : 0,
          isNabl: row.isNabl ? 1 : 0,
          parentID: row.parentId || "",
          isMicroscopy: row.isMicroscopy ? 1 : 0,
          labObservationID: ObservationData[i]?.obsID,
          isComment: row.isComment ? 1 : 0,
          suffix: "",

        };

        payload.push(payloadobj);
      }
      debugger
      const response = await SaveObservationInvestigationMapping(payload);
      if (response.success) {
        notify(response?.message, "success");
        handleGetObservationData(values?.investigation?.value);
        handleBindObservationInvestigation();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(t("Error saving observation mappings"), "error");
    }
  };

  const handleDelete = async (index) => {
    const obs = ObservationData[index];
    try {
      const payload = {
        investigationID: obs?.investigation_Id,
        labObservationId: obs?.obsID,
      };
      const resp = await RemoveObservationInvestigation(payload);
      notify(resp?.message, resp?.success ? "success" : "error");
      if (resp.success) handleGetObservationData(values.investigation?.value);
    } catch (error) {
      notify(t("Error deleting mapping"), "error");
    }
  };



  // const handleChangeInput = (index, field, value) => {
  //   const newMappings = [...observationMappings];
  //   newMappings[index][field] = value;
  //   setObservationMappings(newMappings);
  // };

  // const handleCheckboxChange = (index, field) => {
  //   const newMappings = [...observationMappings];
  //   newMappings[index][field] = !newMappings[index][field];
  //   setObservationMappings(newMappings);
  // };

  const handleChangeInput = (index, field, value) => {
    const newMappings = [...observationMappings];
    newMappings[index][field] = value;
    setObservationMappings(newMappings);
  };

  const handleCheckboxChange = (index, field) => {
    const newMappings = [...observationMappings];
    newMappings[index][field] = !newMappings[index][field];
    setObservationMappings(newMappings);
  };

  const handleGenericSearch = async (event) => {
    const query = event?.query?.toLowerCase();
    const filtered = investigationMasterList?.filter((item) =>
      item?.Name?.toLowerCase()?.includes(query)
    );
    setGenericSuggestions(
      filtered?.map((ele) => ({ NAME: ele.Name, VALUE: ele.Investigation_id }))
    );
  };
  const [investigationId, setInvestigationId] = useState("");

  const handleGenericSelect = (e) => {
    const selected = e.value;
    if (!investigationList.some((item) => item.VALUE === selected.VALUE)) {
      setInvestigationList([...investigationList, selected]);
      handleGetObservationData(selected.VALUE);
      // handleSaveObservationMap(selected.VALUE);
      setInvestigationId(selected.VALUE)
      setSearchValue("")
    } else {
      notify(t("You have already selected this Investigation"), "error");
    }
  };

  const handleRemoveInvestigation = (id) => {
    setInvestigationList(investigationList.filter((item) => item.VALUE !== id));
  };

  const fetchInvestigationMaster = async () => {
    const response = await BindInvestigationMaster();

    if (response?.success) setInvestigationMasterList(response.data);
  };

  const handleManageobservation = (item) => {
    setHandleModelData({
      label: t("Manage Investigation"),
      // buttonName: t("Save"),
      width: "100vw",
      isOpen: true,
      Component: (
        <ManageInvestigationModal setIsOpen={setIsOpen} fetchInvestigationMaster={fetchInvestigationMaster} />
      ),
      handleInsertAPI: () => { },
      extrabutton: <></>,
      footer: <></>,
    });
  };

  const handleHeadingData = () =>
    investigationList?.map((ele, i) => (
      <span key={ele.VALUE} className="ml-2">
        {ele.NAME}
        <i
          className="fa fa-times-circle text-danger pointer-cursor"
          onClick={() => handleRemoveInvestigation(ele.VALUE)}
        />
        {i < investigationList.length - 1 ? "," : ""}
      </span>
    ));


  const handleSaveObservationMap = async () => {

    try {
      const payload = {
        investigationID: values?.investigation?.value,
        // investigationID: investigationId,
        observationId: values?.observation?.value,
      };
      const response = await SaveObservationMap(payload);
      notify(response?.message, "success");
      handleGetObservationData(values?.investigation?.value);
      // handleGetObservationData(investigationId);
    } catch (error) {
      notify(response?.message, "error");
    }
  };
  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };
  useEffect(() => {
    handleBindObservationInvestigation();
    fetchInvestigationMaster();
  }, []);


  const handleSaveNewObservation = async (data) => {

    const payload = {
      obsName: data?.AddObservation,
      suffix: data?.Suffix
    }
    const apiResp = await SaveNewObservation(payload);
    if (apiResp?.success) {
      notify(apiResp?.message, "success");
      setHandleModelData((val) => ({ ...val, isOpen: false }));
      handleBindObservationInvestigation();
    } else {
      notify(apiResp?.message, "error");
    }

  }

  const createNewObservation = () => {
    if (!values?.investigation?.value) {
      notify(t("Please select Investigation"), "error");
      return
    }
    setHandleModelData({
      label: t("New Observation"),
      width: "40vw",
      isOpen: true,
      Component: (
        <NewObservationModal setHandleModelData={setHandleModelData} handleModelData={handleModelData} />
      ),
      handleInsertAPI: handleSaveNewObservation,
      extrabutton: <></>,
      // footer: <></>,
    });
  }

  const EditObservationDetail = async (item) => {
    if (!item?.labObservation_ID) {
      notify(t("Lab Observation Not Found"), "error")
    }

    setHandleModelData({
      label: t("Edit Observation Detail"),
      width: "80vw",
      isOpen: true,
      Component: (
        <EditObservationDetailModal setHandleModelData={setHandleModelData} handleModelData={handleModelData} obsevationData={item} />
      ),
      handleInsertAPI: handleSaveNewObservation,
      // extrabutton: <></>,
      footer: <></>,
    });
  }

  return (
    <div className="spatient_registration_card card">
      <Heading
        title={data?.breadcrumb}
        data={data}
        isBreadcrumb={true}
        isSlideScreen={true}
        secondTitle={
          <EDPSeeMoreList
            ModalComponent={(name, component) => {
              setVisible(true);
              setRenderComponent({ name, component });
            }}
            setSeeMore={setSeeMore}
            data={{}}
            setVisible={() => setVisible(false)}
            handleBindFrameMenu={[]}
            openFirstItem={false}
            // name={
            //   <button className="btn text-white">
            //     {t("New Investigation")}
            //   </button>
            // }
            isRemoveSvg={true}
          />
        }
      />

      <div className="row p-2">


        <ReactSelect
          placeholderName={t("Select Investigation")}
          id="SelectInvestigation"
          requiredClassName={"required-fields"}
          searchable
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="investigation"
          dynamicOptions={handleReactSelectDropDownOptions(
            investigationMasterList,
            "Name",
            "Investigation_id"
          )}
          handleChange={handleSelect}
          value={values?.investigation?.value || values?.investigation || ""}
        />

        <ReactSelect
          placeholderName={t("Map Observation")}
          id="observation"
          searchable
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="observation"
          dynamicOptions={handleReactSelectDropDownOptions(
            observation,
            "ObsName",
            "LabObservation_ID"
          )}
          handleChange={handleSelect}
          value={values?.observation?.value || values?.observation || ""}
        />


        <button
          onClick={handleSaveObservationMap}
          className="btn btn-sm btn-success ms-auto ml-2"
        >
          {t("Map Observation")}
        </button>
        <button
          //   onClick={handleSaveInvestigation}
          onClick={() => {
            handleManageobservation();
          }}
          className="btn btn-sm btn-success ms-auto ml-2"
          type="button"
        >
          {t("Manage Investigation")}
        </button>
        <button
          onClick={() => { createNewObservation() }}
          className="btn btn-sm btn-success ms-auto ml-2"
          type="button"
        >
          {t("Create New Observation")}
        </button>
      </div>

      {/* {investigationList.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <Heading title={handleHeadingData()} isBreadcrumb={false} />
        </div>
      )} */}

      {/* {ObservationData.length > 0 && (
        <>
          <Tables
            thead={theadObservation}
            tbody={ObservationData.map((val, index) => ({
              sno: index + 1,
              parentId: val?.obsID,
              ObservationName: val?.obsName,
              prefix: (
                <Input
                  type="text"
                  className="table-input"
                  disabled={observationMappings[index]?.isHeader}
                  value={observationMappings[index]?.prefix}
                  onChange={(e) =>
                    handleChangeInput(index, "prefix", e.target.value)
                  }
                />
              ),
              method: (
                <Input
                  type="text"
                  className="table-input"
                  disabled={observationMappings[index]?.isHeader}
                  value={observationMappings[index]?.method}
                  onChange={(e) =>
                    handleChangeInput(index, "method", e.target.value)
                  }
                />
              ),
              Header: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isHeader}
                  onChange={() => handleCheckboxChange(index, "isHeader")}
                />
              ),
              Critical: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isCritical}
                  onChange={() => handleCheckboxChange(index, "isCritical")}
                />
              ),
              Bold: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isBold}
                  onChange={() => handleCheckboxChange(index, "isBold")}
                />
              ),
              UnderLine: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isUnderLine}
                  onChange={() => handleCheckboxChange(index, "isUnderLine")}
                />
              ),
              Microscopy: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isMicroscopy}
                  onChange={() => handleCheckboxChange(index, "isMicroscopy")}
                />
              ),
              // NABL: (
              //   <input
              //     type="checkbox"
              //     className="table-checkbox"
              //     checked={observationMappings[index]?.isNabl}
              //     onChange={() => handleCheckboxChange(index, "isNabl")}
              //   />
              // ),
              parentID: (
                <Input
                  type="text"
                  className="table-input"
                  value={observationMappings[index]?.parentId}
                  onChange={(e) =>
                    handleChangeInput(index, "parentId", e.target.value)
                  }
                />
              ),
              edit: <i className="fa fa-edit p-1" onClick={() => { EditObservationDetail(val) }} />,
              delete: (
                <i
                  onClick={() => handleDelete(index)}
                  className="fa fa-trash p-1 text-danger"
                />
              ),
            }))}
            // tableHeight="scrollView"
            style={{ maxHeight: "65vh", padding: "2px" }}
          />

          <div className="text-right">
            <button
              onClick={handleSaveObservationInvestigationMapping}
              className="btn btn-sm btn-success ms-auto ml-2"
              type="button"
            >
              {t("Save Mapping")}
            </button>
          </div>
        </>
      )} */}

      {ObservationData.length > 0 && (
        <>
          <MapInvestigationObservationDragTable
            thead={theadObservation}
            tbody={ObservationData.map((val, index) => ({
              draggableId: String(val?.obsID), // REQUIRED

              sno: index + 1,
              parentId: val?.obsID,
              ObservationName: val?.obsName,

              prefix: (
                <Input
                  type="text"
                  className="table-input"
                  disabled={observationMappings[index]?.isHeader}
                  value={observationMappings[index]?.prefix}
                  onChange={(e) =>
                    handleChangeInput(index, "prefix", e.target.value)
                  }
                />
              ),

              method: (
                <Input
                  type="text"
                  className="table-input"
                  disabled={observationMappings[index]?.isHeader}
                  value={observationMappings[index]?.method}
                  onChange={(e) =>
                    handleChangeInput(index, "method", e.target.value)
                  }
                />
              ),

              Header: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isHeader}
                  onChange={() => handleCheckboxChange(index, "isHeader")}
                />
              ),

              Critical: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isCritical}
                  onChange={() => handleCheckboxChange(index, "isCritical")}
                />
              ),

              Bold: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isBold}
                  onChange={() => handleCheckboxChange(index, "isBold")}
                />
              ),

              UnderLine: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isUnderLine}
                  onChange={() => handleCheckboxChange(index, "isUnderLine")}
                />
              ),


              ...(showNablLogo
                ? {
                  NABL: (
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={observationMappings[index]?.isNabl}
                      onChange={() => handleCheckboxChange(index, "isNabl")}
                    />
                  ),
                }
                : {}),
              Microscopy: (
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={observationMappings[index]?.isMicroscopy}
                  onChange={() => handleCheckboxChange(index, "isMicroscopy")}
                />
              ),
              parentID: (
                <Input
                  type="text"
                  className="table-input"
                  value={observationMappings[index]?.parentId}
                  onChange={(e) =>
                    handleChangeInput(index, "parentId", e.target.value)
                  }
                />
              ),

              edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => EditObservationDetail(val)}
                />
              ),

              delete: (
                <i
                  className="fa fa-trash p-1 text-danger"
                  onClick={() => handleDelete(index)}
                />
              ),
            }))}
            onDragEnd={handleDragEnd}
          />

          <div className="text-right">
            <button
              onClick={handleSaveObservationInvestigationMapping}
              className="btn btn-sm btn-success ms-auto ml-2"
              type="button"
            >
              {t("Save Mapping")}
            </button>
          </div>
        </>
      )}

      <SlideScreen
        visible={visible}
        setVisible={() => {
          setVisible(false);
          setRenderComponent({ name: null, component: null });
        }}
        Header={
          <SeeMoreSlideScreen
            name={renderComponent?.name}
            seeMore={seeMore}
            handleChangeComponent={(e) => {
              setVisible(true);
              setRenderComponent({ name: e?.label, component: e?.component });
            }}
          />
        }
      >
        {renderComponent?.component}
      </SlideScreen>
      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          footer={handleModelData?.footer}
          modalData={handleModelData?.modalData}
          handleAPI={handleModelData?.handleInsertAPI}


        >
          {handleModelData?.Component}
        </Modal>
      )}
    </div>

  );

}

export default MapInvestigationObservationNew;
