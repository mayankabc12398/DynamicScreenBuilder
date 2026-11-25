import React, { useEffect, useRef, useState } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import ReactQuill from "react-quill";
import { formats, modules } from "../../../utils/constant";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import {
  ManagementBindInvestigation,
  SaveInvestigation,
} from "../../../networkServices/EDP/edpApi";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import FullTextEditor from "../../../utils/TextEditor";
import { EmployeeLeaveInvestigation } from "../../../networkServices/nursingWardAPI";

function AddInterpretation({ data }) {
  const [bindInvestigation, setBindInvestigation] = useState([]);
  const [t] = useTranslation();
  const [values, setValues] = useState({
    investigation: "",
  });

  const [editorValue, setEditorValue] = useState("");
  // Editor's live HTML (FullTextEditor getDataRef). CKEditor does not always raise
  // onChange before the Save click, so editorValue could still be empty - the server
  // then stored '' and the interpretation never came back on reopening.
  const editorDataRef = useRef(null);
  const [Editable, setEditable] = useState(false);
  const handleEditorVal = (content) => {
    setEditorValue(content);
  };

  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // The editor remounts (its key is the investigation id) when this changes. Clearing
    // editorValue in the same update means the new instance mounts already empty,
    // instead of flashing the previous investigation's text while the fetch is in
    // flight - that stale flash was showing even on a "Record Not Found" result.
    if (name === "investigation") {
      setEditorValue("");
    }
  };

  const handleBindInvestigation = async () => {
    try {
      const response = await ManagementBindInvestigation();
      if (response.success) {
        setBindInvestigation(response.data);
        console.log("the response from api is", response);
      } else {
        console.error(
          "API returned success as false or invalid response:",
          response,
        );
        setBindInvestigation([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setBindInvestigation([]);
    }
  };

  // SaveInvestigation

  const handleSaveInvestigation = async () => {
    if (values?.investigation?.value === undefined || values?.investigation?.value === "") {
      notify(t("please select the Investigation"), "error");
      return;
    }
    const interpretation =
      typeof editorDataRef.current === "function"
        ? editorDataRef.current() ?? editorValue
        : editorValue;
    const payload = {
      invstigationID: values?.investigation?.value,
      interpretation,
    };

    try {
      const apiResp = await SaveInvestigation(payload);
      if (apiResp.success) {
        notify(t("record save successFully..."), "success");
        // Keep what was saved on screen (it used to be cleared, looking as if lost).
        setEditorValue(interpretation || "");
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error("Error while fetching data:", error);
      notify(t("An error occurred while fetching data"), "error");
    }
  };
  // Switching investigations quickly can leave an older request still in flight. If it
  // resolves after a newer one, it would overwrite the box with the wrong investigation's
  // comment (or clear it) even though the toast already reported the current selection's
  // result. This tracks which selection is "latest" so a stale response is ignored.
  const latestInvestigationRef = useRef(null);

  const handleEmployeeLeaveInvestigation = async () => {
    const requestedValue = values?.investigation?.value;
    if (!requestedValue) return;
    latestInvestigationRef.current = requestedValue;
    setEditorValue("");
    try {
      const apiResp = await EmployeeLeaveInvestigation(requestedValue);
      if (latestInvestigationRef.current !== requestedValue) return;

      if (apiResp.success) {
        const description = apiResp?.data || "";
        setEditorValue(description);
      } else {
        setEditorValue("");
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      if (latestInvestigationRef.current !== requestedValue) return;
      console.error("Error while fetching data:", error);
      notify(t("An error occurred while fetching data"), "error");
    }
  };
  useEffect(() => {
    if (values?.investigation?.value) {
      handleEmployeeLeaveInvestigation();
    }
  }, [values?.investigation?.value]);
  useEffect(() => {
    handleBindInvestigation();
  }, []);
  console.log(editorValue, "apiResp.success");

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
        <div className="p-2">
          <ReactSelect
            placeholderName={t("Select an Option")}
            id={"investigation"}
            searchable={true}
            // respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="investigation"
            dynamicOptions={[
              { value: "0", label: t("ALL") },
              ...handleReactSelectDropDownOptions(
                bindInvestigation,
                "Name",
                "Investigation_id",
              ),
            ]}
            handleChange={handleSelect}
            value={values?.investigation}
          />
        </div>
        <div>
          {/* <ReactQuill
            value={editorValue}
            onChange={handleEditorVal}
            modules={modules}
            formats={formats}
            style={{ height: "100%", width: "100%" }}
          /> */}
          <FullTextEditor
            key={values?.investigation?.value || 'editor'}
            value={editorValue ? editorValue : "<p></p> "}
            // value={getTest}
            setValue={handleEditorVal}
            getDataRef={editorDataRef}
            EditTable={Editable}
            setEditTable={setEditable}
            // clear={clearEditor}
          />

          <div className="col-12 mt-2 mb-2 d-flex justify-content-end">
            <button
              onClick={handleSaveInvestigation}
              className="btn btn-sm btn-success ms-auto"
              type="button"
            >
              {t("Save")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddInterpretation;
