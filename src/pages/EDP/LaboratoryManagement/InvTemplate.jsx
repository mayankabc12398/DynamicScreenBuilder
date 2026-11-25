import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Input from "../../../components/formComponent/Input";
import {
  BindCategorylabortarymanagment,
  BindinvestigationTamplate,
  BindObservationType,
  EditTamplate,
  LoadHeadDepartment,
  LoadTamplate,
  RejectTamplate,
  SaveObservation,
  SaveTamplateInv,
  SaveUpdateTamplate,
  UpdateObservation,
} from "../../../networkServices/EDP/edpApi";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import Tables from "../../../components/UI/customTable";
import ReactQuill from "react-quill";
import { formats, modules } from "../../../utils/constant";
import FullTextEditor from "../../../utils/TextEditor";
import useMsWordEditor, {
  MsWordSessionBar,
  getDocumentEditorMode,
} from "../../../components/documentWriter/useMsWordEditor";

function InvTemplate({ data }) {
  // Opt in: only with an active IsInvTemplateDeptWise row does the investigation
  // list narrow to the chosen department. Otherwise every investigation is
  // listed, exactly as before.
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  // FINDINGVALUE is opt in. Without an active IsFindingValue row in
  // fin_global_resources the tick is not offered and templates are saved the
  // way they always were.
  const isFindingValueEnabled =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsFindingValue")
      ?.Value === "1";
  const isInvTemplateDeptWise =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsInvTemplateDeptWise")
      ?.Value === "1";
  // Report Editor (the template in desktop MS Word) is opt in, the same way as
  // the two above: fin_global_resources.Name = 'IsDocumentEditor', Value '1'
  // (or '2' with the Word helper) shows the button; anything else leaves the
  // screen exactly as it was.
  const { isEnabled: isDocumentEditorEnabled, useHelper: useWordHelper } =
    getDocumentEditorMode(GetGlobalResources);

  const [bindInvestigation, setBindInvestigation] = useState([]);
  const [Invdata, setInvdata] = useState([]);
  const [editorValue, setEditorValue] = useState("");
  // The finding value has an editor of its own, kept apart from the template
  // body so Result Entry can take one without the other.
  const [findingEditorValue, setFindingEditorValue] = useState("");
  const [findingEditable, setFindingEditable] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [isDefaultTemplate, setIsDefaultTemplate] = useState(false);
  const [isFindingValue, setIsFindingValue] = useState(false);
  const [Editable, setEditable] = useState(false)
  // Live HTML of the two editors. Save / Update read these: the editor can swallow the first change
  // after it loads (a paste into an empty template), which left editorValue "" and saved a blank body.
  const editorDataRef = useRef(null);
  const findingDataRef = useRef(null);
  const liveEditorValue = () => editorDataRef.current?.() ?? editorValue;
  const liveFindingValue = () => findingDataRef.current?.() ?? findingEditorValue;

  // Bumped when MS Word hands a document back. The editor below only
  // re-reads `value` when the plain text differs, so a change that is purely
  // formatting - a list, a heading, a font - would otherwise never land. A new
  // key rebuilds it around the exact HTML instead.
  const [editorInstanceKey, setEditorInstanceKey] = useState(0);

  const [templateId, setTemplateId] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState('')
  const [t] = useTranslation();
  const initialState = {
    department: { value: "0", label: "ALL" },
    category: "",
    description: "",
    searchdescription: "",
    investigation: "",
    // availableTemplates: "",
  }
  const [values, setValues] = useState(initialState);

  const theadInv = [
    { width: "5%", name: t("SNo") },
    { width: "5%", name: t("Tempelate Name") },
    { width: "5%", name: t("Investigation") },
    { width: "5%", name: t("Edit") },
    { width: "5%", name: t("Reject") },
  ];
  // const handleChange = (e) => {
  //   setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  // };
  const handleChange = (e) => {
    setAvailableTemplates(e.target.value);
  };
  const handleSelect = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
      // A new department brings a new investigation list, so the previous pick
      // no longer belongs to it.
      ...(name === "department" && isInvTemplateDeptWise
        ? { investigation: "" }
        : {}),
    }));
    setSelectedTemplateId(null)
  };

  const handleEdit = async (templateId) => {
    try {
      const response = await EditTamplate(templateId);
      if (response.success) {
        //     console.log("the response from editApi is", response);
        //     console.log(response.data[0].templateHead);
        //     console.log(response.data[0].templateDescription);
        setSelectedTemplateId(response.data[0].Investigation_ID);
        setAvailableTemplates(response.data[0].Temp_Head);
        // setValues({ availableTemplates: response.data[0].Temp_Head });
        setEditorValue(response.data[0].Template_Desc);
        setTemplateId(response?.data[0].Template_ID);
        setIsFindingValue(String(response?.data[0].IsFindingValue) === "1");
        setFindingEditorValue(response?.data[0].FindingValue_Desc ?? "");
        setFindingEditable(true);
        setIsDefaultTemplate(String(response?.data[0].IsDefaultTemplate) === "1");
        setEditable(true);
      } else {
        notify(response.message, "error");
      }
    } catch (error) {
      notify(t("Error fetching template data"), "error");
    }
  };

  // BindCategorylabortarymanagment

  const handleBindDepartment = async () => {
    try {
      const response = await LoadHeadDepartment();
      if (response.success) {
        setDepartmentData(response?.data);
        console.log("the department from api is work", response);
      } else {
        setDepartmentData([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setDepartmentData([]);
    }
  };

  // The investigation list follows the selected department. 0 ("ALL") asks for
  // every investigation, otherwise only the ones under that department.
  const handleBindCategory = async (observationTypeId = 0) => {
    try {
      const response = await BindinvestigationTamplate(observationTypeId);
      if (response.success) {
        const updatedData = response?.data?.map((item) => ({
          ...item,
          displayName: item.NAME || item.Name,
        }));
        setBindInvestigation(updatedData);
        console.log("the bind investigation is", response);
        console.log("the response from api is work", response);
      } else {
        setBindInvestigation([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setBindInvestigation([]);
    }
  };
  const ip = localStorage.getItem("ip");

  const handleLoadTamplate = async () => {
    try {
      const response = await LoadTamplate(values?.investigation?.value);
      if (response.success) {
        console.log("the response is from loadTemplate is", response);
        setInvdata(response?.data);
      } else {
        console.error(
          "API returned success as false or invalid response:",
          response
        );
        notify(response?.message, "error");
        setInvdata([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setInvdata([]);
    }
  };

  const handleRejectTamplate = async (id) => {
    try {
      const response = await RejectTamplate(id);
      if (response.success) {
        notify(`${response?.message}`, "success");
        handleLoadTamplate();
        setAvailableTemplates('');
        setEditorValue('')
        setSelectedTemplateId(null)
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
    }
  };

  //   const handleInputChange = (e, index, field) => {
  //     const { value } = e.target;
  //     const updatedData = [...observationData];
  //     updatedData[index][field] = value;
  //     setObservationData(updatedData);
  //   };
  const handleFindingEditorVal = (content) => {
    setFindingEditorValue(content);
  };

  const handleEditorVal = (content) => {
    setEditorValue(content);
  };

  // Report Editor: the template body in MS Word. One file per template (or
  // per investigation for a new one); picking another template ends it.
  const selectedInvestigation =
    values?.investigation?.value ?? values?.investigation ?? "";
  const wordEditor = useMsWordEditor({
    contextKey: templateId
      ? `template-${templateId}`
      : selectedInvestigation
        ? `new-${selectedInvestigation}`
        : "",
    getHtml: () => editorValue,
    getTitle: () => availableTemplates || "Template",
    useHelper: useWordHelper,
    onHtml: (html) => {
      setEditable(false);
      handleEditorVal(html);
      // Rebuild the editor around the new HTML so lists, headings and fonts
      // come across exactly as they were written.
      setEditorInstanceKey((key) => key + 1);
    },
  });

  // const handleEdit = async (index) => {
  //   const Name = observationData[index].Name;
  //   const printSequence = observationData[index].PrintSequence;
  //   const observationId = observationData[index].ObservationType_ID;

  //   const payload = {
  //     observationTypeID: observationId,
  //     description: "",
  //     name: Name,
  //     flag: true,
  //     printSequence: Number(printSequence),
  //     groupID: 0,
  //     active: true,
  //     logo: "",
  //   };

  //   try {
  //     const apiResp = await UpdateObservation(payload);
  //     if (apiResp.success) {
  //       notify("Data edited successfully...", "success");

  //     } else {
  //       notify("Some error occurred", "error");
  //     }
  //   } catch (error) {
  //     notify("An error occurred while saving data", "error");
  //   }
  // };

  const handleSaveTamplateInv = async () => {
    if (!values?.investigation?.value) {
      notify(t("Please select Invetigation"), "warn")
      return;
    }
    if (!availableTemplates) {
      notify(
        isFindingValueEnabled && isFindingValue
          ? t("Enter Finding Value title")
          : t("Enter Template title"),
        "warn",
      )
      return;
    }
    const bodyHtml = liveEditorValue();
    const payload = {
      // What "Set This Template as Default Template" actually stores against the
      // investigation. It used to send "" on save and the literal word "update"
      // on update, so the default was never the template.
      labInvesDescription: bodyHtml,
      checkdefault: isDefaultTemplate ? 1 : 0,
      isFindingValue: isFindingValue ? 1 : 0,
      findingValueDescription: isFindingValue ? liveFindingValue() : "",
      investigationId: values?.investigation?.value,
      tamplateID: templateId ? templateId : 0,
      btnType: "save",
      tamplateHead: availableTemplates,
      tamplateDescription: bodyHtml,
    };

    try {
      const apiResp = await SaveTamplateInv(payload);
      if (apiResp.success) {
        notify(apiResp?.message, "success");
        setEditorValue("");
        setFindingEditorValue("");
        setAvailableTemplates("");
        setIsFindingValue(false);
        handleLoadTamplate();
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      notify(t("An error occurred while saving data"), "error");
    }
  };

  // const handleSaveUpdateTamplate = async () => {
  //   const payload = {
  //     tamplateHead: "dfg",
  //     tamplateDescription: "update",
  //   };
  //   try {
  //     const apiResp = await SaveUpdateTamplate(payload);
  //     if (apiResp.success) {
  //       notify(apiResp?.message, "success");
  //       handleLoadTamplate();
  //     } else {
  //       notify(apiResp?.message, "error");
  //     }
  //   } catch (error) {
  //     notify("An error occurred while saving data", "error");
  //   }
  // };

  const handleSaveUpdateTamplate = async () => {
    console.log("the selectedTemplateId id is", selectedTemplateId);
    if (!selectedTemplateId) {
      notify(t("No template selected for update"), "error");
      return;
    }
    const bodyHtml = liveEditorValue();
    const payload = {
      checkdefault: isDefaultTemplate ? 1 : 0,
      isFindingValue: isFindingValue ? 1 : 0,
      findingValueDescription: isFindingValue ? liveFindingValue() : "",
      labInvesDescription: bodyHtml,
      investigationId: selectedTemplateId,
      btnType: "Update",
      tamplateID: templateId,
      tamplateHead: availableTemplates,
      tamplateDescription: bodyHtml,
    };
    try {
      const apiResp = await SaveTamplateInv(payload);
      if (apiResp.success) {
        notify(apiResp.message, "success");
        setSelectedTemplateId(null);
        setValues({ ...initialState })
        handleLoadTamplate();
      } else {
        notify(apiResp.message, "error");
      }
    } catch (error) {
      notify(t("An error occurred while saving data"), "error");
    }
  };
  useEffect(() => {
    handleBindDepartment();
  }, []);

  useEffect(() => {
    handleBindCategory(
      isInvTemplateDeptWise ? values?.department?.value || 0 : 0,
    );
  }, [values?.department?.value, isInvTemplateDeptWise]);

  useEffect(() => {
    if (values?.investigation?.value) {
      handleLoadTamplate();
    }
  }, [values?.investigation?.value]);
  return (
    <>
      <div className="m-2 spatient_registration_card card">
        <Heading
          title={data?.breadcrumb}
          // isMainHeading={{ data: data, FrameMenuID: data?.FrameMenuID }}
          data={data}
          isSlideScreen={true}
          isBreadcrumb={true}
        />
        <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2">
          <ReactSelect
            placeholderName={t("Department")}
            id={"department"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="department"
            dynamicOptions={[
              { value: "0", label: t("ALL") },
              ...handleReactSelectDropDownOptions(
                departmentData,
                "Name",
                "ObservationType_ID"
              ),
            ]}
            handleChange={handleSelect}
            value={values?.department?.value}
          />

          <ReactSelect
            placeholderName={t("Investigation")}
            id={"investigation"}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="investigation"
            searchable={true}
            dynamicOptions={[
              { value: "0", label: t("All") },
              ...handleReactSelectDropDownOptions(
                bindInvestigation,
                "displayName",
                "Investigation_ID"
              ),
            ]}
            handleChange={handleSelect}
            value={values?.investigation?.value || values?.investigation}
          />
        </div>

        {Invdata.length > 0 && (
          <div className="col-xl-6 col-sm-12 p-2">
            <Tables
              thead={theadInv}
              tbody={Invdata?.map((val, index) => ({
                sno: index + 1,
                test: val?.Temp_Head,
                Investigation: val?.Investigation,
                edit: (
                  <i
                    className="fa fa-edit"
                    onClick={() => handleEdit(val.Template_ID)}
                  ></i>
                ),
                delete: (
                  <i
                    className="fa fa-trash text-danger"
                    onClick={() => handleRejectTamplate(val?.Template_ID)}
                  ></i>
                ),
              }))}
              tableHeight={"scrollView"}
            // style={{ height: "60vh", padding: "2px" }}
            />
          </div>
        )}

        <Heading
          title={data?.breadcrumb}
          // isMainHeading={{ data: data, FrameMenuID: data?.FrameMenuID }}
          data={data}
          isSlideScreen={true}
          isBreadcrumb={false}
        />
        <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2">
          {/* <Input
            type="text"
            className="form-control"
            id="availableTemplates"
            name="availableTemplates"
            value={values?.availableTemplates}
            onChange={handleChange}
            lable={t("Available Templates")}
            placeholder=""
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          /> */}

          <Input
            type="text"
            className="form-control"
            id="availableTemplates"
            name="availableTemplates"
            value={availableTemplates}
            onChange={(handleChange)}
            label={t("Available Templates")}
            placeholder=""
            lable={
              isFindingValueEnabled && isFindingValue
                ? t("Enter finding value title")
                : t("Enter template title")
            }
            respclass="col-xl-2 col-md-4 col-sm-4 col-6"
          />

          <div className="col-6 col-lg-6">
            <div className="d-flex align-items-center flex-wrap">
              <label
                className="d-flex align-items-center ml-3 mb-0"
                style={{ cursor: "pointer" }}
              >
                <input
                  className="mr-1"
                  type="checkbox"
                  checked={isDefaultTemplate}
                  onChange={(e) => setIsDefaultTemplate(e.target.checked)}
                />
                {t("Set This Template as Default Template")}
              </label>

              {/* Opens the template body in MS Word, right beside the tick so
                  both template level controls sit together. Only with an
                  active IsDocumentEditor row - see the flag above. */}
              {isDocumentEditorEnabled && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary ml-3"
                  onClick={wordEditor.openInWord}
                  title={t("Open this template in MS Word")}
                >
                  <i className="fa fa-file-word-o mr-1" />
                  {t("Report Editor")}
                </button>
              )}
            </div>

            {/* Marks the template as carrying a FINDINGVALUE area. Result Entry
                offers such templates in its FINDINGVALUE dropdown. */}
            {isFindingValueEnabled && (
              <label
                className="d-flex align-items-center ml-3 mt-1"
                style={{ cursor: "pointer" }}
              >
                <input
                  className="mr-1"
                  type="checkbox"
                  checked={isFindingValue}
                  onChange={(e) => setIsFindingValue(e.target.checked)}
                />
                {t("FINDINGVALUE")}
              </label>
            )}
          </div>

          {/* <label className="ml-2">
            <input
              className="mt-2"
              type="checkbox"
              checked={isDefaultTemplate}
              onChange={(e) => setIsDefaultTemplate(e.target.checked)}
            />
            {t("Set This Template as Default Template")}
          </label> */}
        </div>
        {/* <ReactQuill
          value={editorValue}
          onChange={handleEditorVal}
          modules={modules}
          formats={formats}
          style={{ height: "100%", width: "100%" }}
        /> */}
        {/* <ReactQuill
          value={editorValue}
          onChange={handleEditorVal}
          modules={{ toolbar: true }}
          formats={["bold", "italic", "underline"]}
          style={{ height: "100%", width: "100%" }}
        /> */}

        <FullTextEditor
          key={editorInstanceKey}
          value={editorValue}
          // value={getTest}
          setValue={handleEditorVal}
          EditTable={Editable}
          setEditTable={setEditable}
          getDataRef={editorDataRef}
          toolbarMode="word"
        />

        {isFindingValueEnabled && isFindingValue && (
          <>
            <div className="mt-2 mb-1 font-weight-bold">
              {t("FINDINGVALUE")}
            </div>
            <FullTextEditor
              value={findingEditorValue}
              setValue={handleFindingEditorVal}
              EditTable={findingEditable}
              setEditTable={setFindingEditable}
              getDataRef={findingDataRef}
              toolbarMode="word"
            />
          </>
        )}
        <div className="col-sm-12 col-xl-12 d-flex justify-content-end">
          {!selectedTemplateId ?
            <button
              className="btn btn-lg btn-success mt-2 mb-2"
              type="button"
              onClick={handleSaveTamplateInv}
            >
              {t("Save")}
            </button>
            :
            <button
              className="btn btn-lg btn-success mt-2 mb-2"
              type="button"
              onClick={handleSaveUpdateTamplate}
            >
              {t("Update")}
            </button>
          }
        </div>
      </div>

      {/* While the template is open in MS Word. Each save in Word lands in
          the template editor above; the page's own Save / Update still
          stores it. */}
      <MsWordSessionBar word={wordEditor} t={t} />
    </>
  );
}

export default InvTemplate;
