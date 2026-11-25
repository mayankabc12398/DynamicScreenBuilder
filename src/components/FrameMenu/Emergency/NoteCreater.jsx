import { useEffect, useState } from "react";
import {
  bindheadertemplate,
  BindOtherUserTemplate,
  getbindEmployee,
  GetBindNoteTypeTemplate,
  GetBindPatientNoteCreation,
  GetNoteTypeMaster,
  getQuickAccessLastVital,
  getQuickAccessMedicineDataApi,
  getQuickAccessMedicineFullData,
  getQuickAccessNicu,
  getQuickAccessPatientDemographicApi,
  handleSaveNoteCreation,
  SaveTemplateCreation,
  NoteFinderSearch,
  PatientDRPrint,
  BindTemplateData,
} from "../../../networkServices/Emergency";
import Tables from "../../UI/customTable";
import RadioInput from "../../formComponent/RadioInput";
import FullTextEditor from "../../../utils/TextEditor";
import Heading from "../../UI/Heading";
import ReactSelect from "../../formComponent/ReactSelect";
import TextAreaInput from "../../formComponent/TextAreaInput";
import { useTranslation } from "react-i18next";
import InvestigationModel from "../../modalComponent/InvestigationModel";
import { notify } from "../../../utils/utils";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import moment from "moment";
import Input from "../../formComponent/Input";
import Modal from "../../modalComponent/Modal";
import { RedirectURL } from "../../../networkServices/PDFURL";

const NoteCreater = (props) => {
  const data = props?.data || props;
  const { t } = useTranslation();
  const initialValue = {
    noteType: "",
    template: "",
    templateOptions: [],
    source: "",
    noteText: "",
    editorValue: "",
    demographicText: "",
    medicineText: "",
    lastVitalText: "",
    nicuText: "",
    userSelect: "Nothing",
    userID: "",
    user: "",
    tName: "",
    showInvestigation: false,
    EditTable: false,
    clear: false,
    ID: 0,
    PatientDetailID: 0,
  };
  const [state, setState] = useState(initialValue);
  const [noteType, setNoteType] = useState([]);
  const [template, setTemplate] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [tableData, setTableData] = useState([]);
  const { employeeID } = useLocalStorage("userData", "get");
  const [handleModelData, setHandleModelData] = useState({ isOpen: false });
  const [modalData, setModalData] = useState({});
  const [patientNote, setPatientNote] = useState([]);
  const [Useremployee, setuserEmployee] = useState([]);
  const [templete, setTemplete] = useState([]);
  const [temmIDD, setTempID] = useState([]);

  const transactionID =
    data?.transactionID ||
    data?.TransactionID ||
    data?.patientDetail?.TransactionID;

  const hanldleSelectNoteType = (name, value) => {
    if (name === "noteType") {
      // First, clear the editor if it has any value
      setState((prev) => {
        if (prev.editorValue) {
          return {
            ...prev,
            editorValue: "",
            EditTable: false,
            ID: 0,
            PatientDetailID: 0,
          };
        }
        return {
          ...prev,
          ID: 0,
          PatientDetailID: 0,
        };
      });

      // Then update with new note type and heading after a brief delay
      setTimeout(() => {
        setState((prev) => {
          const newHeading = value?.label ? `<h2>${value.label}</h2>` : "";
          return {
            ...prev,
            editorValue: newHeading,
            [name]: value || "",
            template: "",
            templateOptions: [],
            EditTable: true,
          };
        });

        // Fetch template options only if value exists
        if (value?.value) {
          GetBindTemplate(value.value);
        }
      }, 0);
    }
  };

  const handleReactSelect = (name, e) => {
    if (name === "source") {
      setState((prev) => ({ ...prev, [name]: e?.value || "" }));
      if (e?.value) {
        GetBindPatientNote(e.value);
      }
    } else if (name === "userID") {
      setState((prev) => ({ ...prev, [name]: e?.value || "" }));
      if (e?.value) {
        BindOtherUserTemplates(e.value);
      }
    } else {
      setState((prev) => ({ ...prev, [name]: e?.value || "" }));
    }
  };

  const handleSelectTemplete = async (name, selectedTemplate) => {
    // Early return if no template selected - prevents unnecessary updates
    if (!selectedTemplate) {
      setState((prev) => ({
        ...prev,
        [name]: "",
        editorValue: "",
        EditTable: false,
        tName: "",
        ID: 0,
        PatientDetailID: 0,
      }));
      return;
    }

    // Only update the selected template in state
    setState((prev) => ({
      ...prev,
      [name]: selectedTemplate,
      tName: selectedTemplate?.label || "",
      ID: 0,
      PatientDetailID: 0,
    }));

    // Fetch template data without causing re-render
    try {
      const response = await BindTemplateData(selectedTemplate?.value);
      if (response.success && response.data?.[0]?.Template_Value) {
        // Only update if we have valid data
        setState((prev) => ({
          ...prev,
          editorValue: response.data[0].Template_Value,
          EditTable: true,
        }));
      }
    } catch (error) {
      console.error("Error fetching template data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditNote = (ele) => {
    // Determine the selected note type option
    const selectedNoteType = noteType.find(
      (item) => String(item.value) === String(ele.notetypevalue)
    ) || {
      value: ele.notetypevalue,
      label: ele.NoteType,
    };

    setState((prev) => ({
      ...prev,
      noteType: selectedNoteType,
      editorValue: ele.Detail || "",
      ID: ele.ID,
      PatientDetailID: ele.PatientDetailID || ele.ID,
      EditTable: true,
    }));
  };

  const getBindNoteType = async () => {
    try {
      const response = await GetNoteTypeMaster();
      const data =
        response?.data?.map((ele) => ({
          value: ele?.Header_Id,
          label: ele?.HeaderName,
        })) || [];
      setNoteType(data);
    } catch (error) {
      console.error(error);
    }
  };

  const GetBindTemplate = async (Headerid) => {
    try {
      const response = await GetBindNoteTypeTemplate(Headerid);
      const data =
        response?.data?.map((ele) => ({
          value: ele?.Template_Value,
          label: ele?.Temp_Name,
        })) || [];
      setTemplate(data);
    } catch (error) {
      console.error(error);
    }
  };

  const GetBindPatientNote = async (NoteTypevalue) => {
    try {
      const response = await GetBindPatientNoteCreation(
        NoteTypevalue,
        data?.TransactionID,
      );
      setPatientNote(response || []);
    } catch (error) {
      console.error(error);
    }
  };

  const BindOtherUserTemplates = async (employeeID) => {
    if (!state.noteType) {
      notify(t("Note Type is Required select first Note Type"), "error");
      return;
    }
    try {
      const response = await BindOtherUserTemplate(
        state?.noteType?.value,
        employeeID,
      );
      if (!response.success) {
        notify(response.message, "error");
        return;
      }
      if (response.success) {
        setTemplete(
          response?.data?.map((item) => ({
            label: item?.Temp_Name,
            value: item?.Headerid,
          })) || [],
        );
        notify(response.message, "success");
      }
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const bindEmployee = async () => {
    try {
      const response = await getbindEmployee();
      // debugger;
      setuserEmployee(response?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const BindTemplateDatas = async (selectedTemplate) => {
    try {
      const response = await BindTemplateData(selectedTemplate?.value);
      if (response.success) {
        setState({
          ...initialValue,
          editorValue: response.data[0]?.Template_Value || "",
          EditTable: true,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    bindEmployee();
    getBindNoteType();
    handleNotfinderSearch();
  }, []);

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates, EditTable: true }));
  };

  const handleInvestigation = () => {
    updateState({ showInvestigation: true });
  };

  const handleActiveMedicine = async () => {
    try {
      const response = await getQuickAccessMedicineDataApi(transactionID);

      if (response?.success && response?.data) {
        updateState({
          medicineText: response.data,
          editorValue: response.data,
          EditTable: true,
        });
      } else {
        updateState({
          medicineText: "Active medicine not found",
          editorValue: "Active medicine not found",
          EditTable: true,
        });
      }
    } catch (error) {
      updateState({
        medicineText: "Active medicine not found",
        editorValue: "Active medicine not found",
        EditTable: true,
      });
    }
  };

  const handleDemographic = async () => {
    try {
      const response = await getQuickAccessPatientDemographicApi(transactionID);

      if (response?.success && response?.data) {
        updateState({
          demographicText: response.data,
          editorValue: response.data,
          EditTable: true,
        });
      } else {
        updateState({
          demographicText: "Data not found",
          editorValue: "Data not found",
          EditTable: true,
        });
      }
    } catch (error) {
      updateState({
        demographicText: "Data not found",
        editorValue: "Data not found",
        EditTable: true,
      });
    }
  };

  const handleLastVital = async () => {
    try {
      const response = await getQuickAccessLastVital(transactionID);

      if (response?.success && response?.data) {
        updateState({
          lastVitalText: response.data,
          editorValue: response.data,
          EditTable: true,
        });
      } else {
        updateState({
          lastVitalText: "Data not found",
          editorValue: "Data not found",
          EditTable: true,
        });
      }
    } catch (error) {
      updateState({
        lastVitalText: "Data not found",
        editorValue: "Data not found",
        EditTable: true,
      });
    }
  };

  const handleDescription = async () => {
    try {
      const response = await getQuickAccessMedicineFullData(transactionID);

      if (response?.success && response?.data) {
        updateState({
          lastVitalText: response.data,
          editorValue: response.data,
          EditTable: true,
        });
      } else {
        updateState({
          lastVitalText: "Data not found",
          editorValue: "Data not found",
          EditTable: true,
        });
      }
    } catch (error) {
      updateState({
        lastVitalText: "Data not found",
        editorValue: "Data not found",
        EditTable: true,
      });
    }
  };

  const handleNicu = async () => {
    try {
      const response = await getQuickAccessNicu(transactionID);

      if (response?.success && response?.data) {
        updateState({
          nicuText: response.data,
          editorValue: response.data,
          EditTable: true,
        });
      } else {
        updateState({
          nicuText: "Data not found",
          editorValue: "Data not found",
          EditTable: true,
        });
      }
    } catch (error) {
      updateState({
        nicuText: "Data not found",
        editorValue: "Data not found",
        EditTable: true,
      });
    }
  };

  const handleNotfinderSearch = async () => {
    const payload = {
      cadreID: "0",
      tierID: "0",
      specialtyID: "0",
      noteType: "0",
      encounter: "0",
      encounterType: transactionID,
    };
    try {
      const response = await NoteFinderSearch(payload);
      if (response.success) {
        setTableData(response?.data || []);
      }
    } catch (error) {
      notify(error.message, "error");
    }
  };

  // const handleSaveNote = async () => {
  //   const templateName =
  //     template?.find((ele) => state?.template === ele?.value)?.label || "";
  //   const noteTypeName =
  //     noteType?.find((ele) => state?.noteType === ele?.value)?.label || "";

  //   const requestBody = {
  //     transactionID: String(data?.transactionID || ""),
  //     headerID: String(state?.noteType?.value || ""),
  //     headerName: String(noteTypeName),
  //     patientID: String(data?.PatientID || ""),
  //     text: String(state?.editorValue || ""),
  //   };
  //   if (state?.userSelect === "Update") {
  //     debugger
  //     if (state?.template?.value) {
  //       const newTempPayload = {
  //         headerID: String(state?.noteType?.value || "0"),
  //         tempId: state?.template?.value,
  //         templateValue: state?.editorValue || null,
  //         templateName: state?.template?.label || "0",
  //         isShared: true,
  //       };
  //       try {
  //         const response = await SaveTemplateCreation(newTempPayload);
  //         if (response.status) {
  //           debugger
  //           // debugger;
  //           notify(response.message, "success");
  //           setState({ ...initialValue });
  //         }
  //       } catch (error) {
  //         notify(error.message, "error");
  //       }
  //     }
  //   }

  //   if (state?.userSelect === "New") {
  //     const newTempPayload = {
  //       headerID: String(state?.noteType?.value || "0"),
  //       tempId: 0,
  //       templateValue: state?.editorValue || "0",
  //       templateName: state?.template?.label || "0",
  //       isShared: true,
  //     };
  //     try {
  //       const response = await SaveTemplateCreation(newTempPayload);
  //       if (response.status) {
  //         // debugger;
  //         notify(response.message, "success");
  //         setState({ ...initialValue });
  //       }
  //     } catch (error) {
  //       notify(error.message, "error");
  //     }
  //   }
  //   if (state?.userSelect === "Nothing") {
  //     try {
  //       const response = await handleSaveNoteCreation(requestBody);

  //       if (response?.success) {
  //         notify(response?.message, "success");
  //         handleNotfinderSearch();
  //         setState({ ...initialValue });
  //       } else {
  //         notify(response?.message || "Error saving note", "error");
  //       }
  //     } catch (error) {
  //       console.error("Save Error:", error);
  //       notify("Error saving note!", "error");
  //     }
  //   }
  //    else {
  //     noteType("Save Failed","error")
  //   }
  // };

  const handleSaveNote = async () => {
    const templateName =
      template?.find((ele) => state?.template === ele?.value)?.label || "";
    const noteTypeName =
      noteType?.find((ele) => state?.noteType === ele?.value)?.label || "";

    const requestBody = {
      id: state?.ID || 0,
      ID: state?.ID || 0,
      PatientDetailID: state?.PatientDetailID || state?.ID || 0,
      transactionID: String(
        data?.transactionID ||
          data?.TransactionID ||
          props?.patientDetail?.transactionID ||
          props?.patientDetail?.TransactionID,
      ),
      headerID: String(state?.noteType?.value || state?.noteType),
      headerName: String(noteTypeName),
      patientID: String(
        data?.PatientID ||
          data?.patientID ||
          props?.patientDetail?.PatientID ||
          props?.patientDetail?.patientID,
      ),
      text: String(state?.editorValue || ""),
    };

    try {
      if (state?.userSelect === "Update") {
        if (state?.template?.value) {
          const newTempPayload = {
            headerID: String(state?.noteType?.value || "0"),
            tempId: state?.template?.value,
            templateValue: state?.editorValue || null,
            templateName: state?.template?.label || "0",
            isShared: true,
          };

          const response = await SaveTemplateCreation(newTempPayload);
          if (response.status) {
            notify(response.message, "success");
            // Reset state including editor
            setState({ ...initialValue, editorValue: "", EditTable: true });
            // Refresh data
            handleNotfinderSearch();
            return;
          }
        }
      }

      if (state?.userSelect === "New") {
        const newTempPayload = {
          headerID: String(state?.noteType?.value || "0"),
          tempId: 0,
          templateValue: state?.editorValue || "0",
          templateName: state?.tName || "0", // Use tName instead of template.label
          isShared: true,
        };

        const response = await SaveTemplateCreation(newTempPayload);
        if (response.status) {
          notify(response.message, "success");
          // Reset state including editor
          setState({ ...initialValue, editorValue: "", EditTable: true });
          // Refresh data
          handleNotfinderSearch();
          return;
        }
      }

      if (state?.userSelect === "Nothing") {
        const response = await handleSaveNoteCreation(requestBody);

        if (response?.success) {
          notify(response?.message, "success");
          // Reset state including editor
          setState({ ...initialValue, editorValue: "", EditTable: true });
          // Refresh data
          handleNotfinderSearch();
          return;
        } else {
          notify(response?.message || "Error saving note", "error");
          return;
        }
      }

      // If no valid userSelect option
      notify(t("Please select a valid option"), "error");
    } catch (error) {
      console.error("Save Error:", error);
      notify(error?.message || "Error saving note!", "error");
    }
  };

  const tableHead = [
    { name: t("SrNo") },
    { name: t("From Role") },
    { name: t("Date&Time") },
    { name: t("Author") },
    { name: t("Note Type") },
    { name: t("Cadre") },
    { name: t("Tier") },
    { name: t("Specialty") },
    { name: t("View Edt Note") },
    { name: t("Approved Status") },
    { name: t("Approve") },
    { name: t("Approved By") },
    { name: t("Approved Comment") },
    { name: t("Approved DateTime") },
  ];

  const radioOptions = [
    { value: "Nothing", label: t("Create Note") },
    { value: "New", label: t("New Temp") },
    { value: "Update", label: t("Update Temp") },
  ];

  const hanldleprint = async () => {
    try {
      const response = await PatientDRPrint(transactionID);
      if (response.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  useEffect(() => {
    if (!state.noteType?.value) {
      setState((prev) => ({
        ...prev,
        templateOptions: [],
        template: "",
        editorValue: prev.ID ? prev.editorValue : "",
        EditTable: prev.ID ? prev.EditTable : false,
      }));
      return;
    }

    const fetchTemplate = async () => {
      try {
        const response = await bindheadertemplate(
          state.noteType.value,
          transactionID,
        );

        const templateList = Array.isArray(response?.data?.response)
          ? response.data.response
          : [];

        const formattedTemplates = templateList.map((t) => ({
          value: t.Template_Value,
          label: t.Temp_Name,
          templateDisc: t.templateDisc || "",
        }));
        /* const tempId = response?.data?.patientData?.[0]?.Template_Value || "";
        setTempID(tempId); */
        const patientData =
          response?.data?.patientData?.[0]?.templateDisc || "";

        setState((prev) => ({
          ...prev,
          templateOptions: formattedTemplates,
          template: "",
          editorValue: prev.ID ? prev.editorValue : (patientData || ""),
          EditTable: prev.ID ? prev.EditTable : !!patientData,
        }));
      } catch (error) {
        console.error("Error fetching template:", error);
        setState((prev) => ({
          ...prev,
          templateOptions: [],
          template: "",
          editorValue: prev.ID ? prev.editorValue : "",
          EditTable: prev.ID ? prev.EditTable : false,
        }));
      }
    };

    fetchTemplate();
  }, [state.noteType?.value, transactionID]);

  const setIsOpen = (open = false) => {
    setHandleModelData((val) => ({ ...val, isOpen: open }));
  };

  const handleChangeModel = (data) => {
    setModalData(data);
  };

  const handleModel = (
    label,
    width,
    type,
    isOpen,
    Component,
    handleInsertAPI,
    extrabutton,
  ) => {
    setHandleModelData({
      label,
      width,
      type,
      isOpen,
      Component,
      handleInsertAPI,
      extrabutton: extrabutton || <></>,
    });
  };

  const SOURCE_OPTIONS = [
    { value: "Select", label: t("Select") },
    { value: "PMH", label: t("Past Medical History") },
    { value: "PSH", label: t("Past Surgical History") },
    { value: "FH", label: t("Family History") },
    { value: "SH", label: t("Social History") },
    { value: "Allergy", label: t("Allergies") },
    { value: "ProblemList", label: t("Problem List") },
    { value: "DM", label: t("Discharge Medications") },
    { value: "FD", label: t("Final Diagnoses") },
    { value: "Vital", label: t("24Hrs Vitals") },
    { value: "Lab", label: t("Investigation") },
    { value: "AM", label: t("Active Medicine") },
    { value: "OT", label: t("Procedure List") },
  ];

  return (
    <>
      <div className="card patient_registration border mt-2">
        <div className="card card_background">
          <Heading isBreadcrumb={false} title={t("Note Type Entries")} />

          <div className="p-2">
            <div className="row">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  dynamicOptions={noteType}
                  value={state?.noteType}
                  handleChange={hanldleSelectNoteType}
                  placeholderName={t("Note Type")}
                  name="noteType"
                  id="noteType"
                  searchable={true}
                  removeIsClearable={true}
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  dynamicOptions={template}
                  id={"template"}
                  name={"template"}
                  value={state?.template}
                  handleChange={handleSelectTemplete}
                  placeholderName={t("Template")}
                  searchable={true}
                  removeIsClearable={true}
                />
              </div>

              <div className="col-xl-1 col-md-2 col-sm-6 col-12 mb-2">
                <button
                  className="btn btn-sm w-200"
                  style={{
                    backgroundColor: "#d6d6d6",
                    color: "#fff",
                    border: "none",
                    cursor: "not-allowed",
                  }}
                  disabled
                >
                  {t("Delete Template")}
                </button>
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <ReactSelect
                  dynamicOptions={SOURCE_OPTIONS}
                  value={state.source}
                  handleChange={handleReactSelect}
                  placeholderName={t("List of Sources")}
                  name="source"
                  id="source"
                  searchable={true}
                  removeIsClearable={true}
                />
              </div>

              <div className="col-xl-3 col-md-6 col-sm-12 col-12 mb-2">
                <TextAreaInput
                  lable={t("Rermark")}
                  placeholder=""
                  className="form-control"
                  id="noteText"
                  name="noteText"
                  value={state?.noteText}
                  rows={3}
                  maxLength={500}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-2">
          <div className="row">
            <div className="col-xl-1 col-md-2 col-sm-6 col-12 mb-2">
              <button
                className="btn btn-sm w-100"
                onClick={handleActiveMedicine}
                style={{
                  backgroundColor: "green",
                  border: "none",
                  color: "#fff",
                }}
              >
                {t("Active Medicine")}
              </button>
            </div>

            <div className="col-xl-1 col-md-2 col-sm-6 col-12 mb-2">
              <button
                className="btn btn-sm btn-danger w-100"
                onClick={handleDescription}
                style={{
                  backgroundColor: "#85a94f",
                  color: "#fff",
                  border: "none",
                }}
              >
                {t("Description")}
              </button>
            </div>

            <div className="col-xl-1 col-md-2 col-sm-6 col-12 mb-2">
              <button
                className="btn btn-sm btn-danger w-100"
                onClick={handleDemographic}
                style={{ backgroundColor: "#d33101" }}
              >
                {t("Demographic")}
              </button>
            </div>

            <div className="col-xl-1 col-md-2 col-sm-6 col-12 mb-2">
              <button
                className="btn btn-sm btn-danger w-100"
                onClick={handleLastVital}
                style={{
                  backgroundColor: "#c1118b",
                  border: "none",
                }}
              >
                {t("Last Vital")}
              </button>
            </div>

            <div className="col-xl-1 col-md-2 col-sm-6 col-12 mb-2">
              <button
                className="btn btn-sm btn-primary"
                type="button"
                onClick={() =>
                  handleModel(
                    t("Investigation Result"),
                    "40vw",
                    "Investigation",
                    true,
                    <InvestigationModel
                      handleChangeModel={handleChangeModel}
                      transactionID={transactionID}
                    />,
                  )
                }
              >
                {t("Investigation")}
              </button>
            </div>
          </div>
        </div>

        <div className="p-2">
          <h6 className="fw-bold">{t("Write Note")}</h6>
          <FullTextEditor
            value={state?.editorValue || ""}
            setValue={(value) =>
              setState((prev) => ({ ...prev, editorValue: value }))
            }
            EditTable={state?.EditTable}
            setEditTable={(value) =>
              setState((prev) => ({ ...prev, EditTable: value }))
            }
            clear={state?.clear}
          />
        </div>

        <div className="row p-3">
          <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
            <ReactSelect
              dynamicOptions={radioOptions}
              value={state?.userSelect}
              handleChange={handleReactSelect}
              name="userSelect"
              id="userSelect"
              placeholderName={t("Type")}
              respclass="w-100"
            />
          </div>

          <Input
            id="tName"
            name="tName"
            lable={t("T Name")}
            placeholder={""}
            value={state?.tName}
            rows={3}
            maxLength={500}
            onChange={handleChange}
            className="form-control"
            respclass="col-xl-2 col-sm-4 col-md-6 col-12"
            disabled={state?.userSelect === "Nothing"}
          />

          <ReactSelect
            dynamicOptions={
              Useremployee?.map((item) => ({
                value: item?.Employee_ID,
                label: item?.Name,
              })) || []
            }
            value={state?.userID}
            handleChange={handleReactSelect}
            name="userID"
            id="userID"
            placeholderName={t("User")}
            respclass="col-xl-2 col-sm-4 col-md-6 col-12"
          />

          <ReactSelect
            dynamicOptions={templete}
            value={state?.user}
            handleChange={handleReactSelect}
            name="user"
            id="user"
            placeholderName={""}
            respclass="col-xl-2 col-sm-4 col-md-6 col-12"
          />

          <div className="text-right">
            {state?.ID > 0 && (
              <button
                className="btn btn-sm btn-danger mx-2"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    ...initialValue,
                    editorValue: "",
                    EditTable: false,
                  }))
                }
              >
                {t("Cancel")}
              </button>
            )}
            <button className="btn btn-sm btn-success" onClick={handleSaveNote}>
              {state?.ID ? t("Update") : t("Save")}
            </button>
          </div>
        </div>
      </div>

      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          footer={<></>}
          buttons={handleModelData?.extrabutton}
          modalData={modalData}
          setModalData={setModalData}
          handleAPI={handleModelData?.handleInsertAPI}
        >
          {handleModelData?.Component}
        </Modal>
      )}

      {tableData?.length > 0 && (
        <>
          <Heading
            title={
              <div className="d-flex justify-content-between align-items-center">
                <span>{t("Note Creater Detail List")}</span>
                <button
                  className="btn btn-sm btn-success mx-4"
                  onClick={hanldleprint}
                >
                  {t("Print")}
                </button>
              </div>
            }
          />

          <Tables
            thead={tableHead}
            tbody={tableData?.map((ele, index) => ({
              SNo: index + 1,
              FromRole: ele?.RoleName || "",
              Dates: ele?.Dates || "",
              Author: ele?.Author || "",
              NoteType: ele?.NoteType || "",
              Cadre: ele?.Cadre || "",
              Tier: ele?.Tier || "",
              Specialty: ele?.Specialty || "",
              viewEdit: (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleEditNote(ele)}
                >
                  {t("Edit")}
                </button>
              ),
              ApprovedStatus: ele?.ApprovedStatus || "",
              Approved: ele?.Approved || "",
              ApprovedBy: ele?.ApprovedBy || "",
              ApprovedRemark: ele?.ApprovedRemark || "",
              ApprovedDate: ele?.ApprovedDate || "",
            }))}
            tableHeight={"tableHeight"}
          />
        </>
      )}
    </>
  );
};

export default NoteCreater;
