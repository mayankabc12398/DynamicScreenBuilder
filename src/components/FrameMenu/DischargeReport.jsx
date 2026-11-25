import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import {
  DRDetailsApproveDischargeSummary,
  DRDetailsBindApprovalDoctor,
  DRDetailsGetAmendmentHistory,
  DRDetailsBindDetails,
  DRDetailsLoadHeaders,
  DRDetailsLoadTemplates,
  DRDetailsLoadTemplatesByDiagnosis,
  DRDetailsPatientTemplateDelete,
  DRDetailsPrintDischargeReport,
  DRDetailsSaveDischargeSummary,
  DRDetailsTemplateChange,
  DRDetailsTemplateDelete,
} from "../../networkServices/dischargeSummaryAPI";
import {
  handleReactSelectDropDownOptions,
  notify,
  reactSelectOptionList,
} from "../../utils/utils";
import { formats, modules } from "../../utils/constant";
import ReactQuill from "react-quill";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import { Tooltip } from "primereact/tooltip";
import { RedirectURL } from "../../networkServices/PDFURL";
import { Checkbox } from "primereact/checkbox";
import FullTextEditor from "../../utils/TextEditor";
import { SiGooglegemini } from "react-icons/si";
import { FaCamera, FaNotesMedical } from "react-icons/fa";
import Modal from "../modalComponent/Modal";
import CancelButton from "../UI/CancelButton";
import ConfirmBox from "../modalComponent/ConfirmBox";
import { translateHead, translateOptions } from "@components/WrapTranslate";
import useMsWordEditor, {
  MsWordSessionBar,
  getDocumentEditorMode,
} from "../documentWriter/useMsWordEditor";

const DROPDOWN_DATA = [
  {
    label: "Update Template",
    value: "Update",
  },
  {
    label: "New Template",
    value: "New",
  },
  {
    label: "Nothing",
    value: "Nothing",
  },
];

const THEAD = [
  { name: "S.No", width: "10%", textAlign: "center" },
  { name: "Header Added", width: "80%", textAlign: "left" },
  { name: "Action", width: "10%", textAlign: "center" },
];

const AMENDMENT_THEAD = [
  { name: "S.No", width: "8%", textAlign: "center" },
  { name: "User Name", width: "25%", textAlign: "left" },
  { name: "Date", width: "15%", textAlign: "center" },
  { name: "Time", width: "15%", textAlign: "center" },
  { name: "Reason", width: "37%", textAlign: "left" },
];

const DELETE_HISTORY_THEAD = [
  { name: "S.No", width: "8%", textAlign: "center" },
  { name: "Header Deleted", width: "37%", textAlign: "left" },
  { name: "User Name", width: "25%", textAlign: "left" },
  { name: "Date", width: "15%", textAlign: "center" },
  { name: "Time", width: "15%", textAlign: "center" },
];

// Ek hi modal dono history dikhata hai - ye batata hai kaunsi.
const UNAPPROVE_HISTORY = "UnApprove";
const DELETE_HISTORY = "Delete";

const DischargeReport = ({
  data,
  handleDRDetailsGetDRDetails,
  patientData,
  aiBoundSummary,
  handleOpenAIChat,
  onOpenClinicalRecord,
  onOpenScan,
  isDischargeApproved,
  diagnosisTemplateBind,
}) => {
  const [t] = useTranslation();

  /* Dono history features alag-alag resource key par hain - '1' se on, kuch aur ya
     key hi na ho to off (aur tab API log bhi nahi likhti). */
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isShowAmendmentHistory =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "ShowDischargeAmendmentHistory",
    )?.Value === "1";
  const isShowDeleteDetail =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "ShowDischargeDeleteDetail")
      ?.Value === "1";
  // SkipDischargeApproveDoctorValidation = 1: approval needs no Approve Doctor (checked in the API too),
  // so the Approve Doctor dropdown is hidden. Key missing / 0 = shown as before.
  const isApproveDoctorSkipped =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "SkipDischargeApproveDoctorValidation",
    )?.Value === "1";


  // Report Editor: wahi desktop MS Word jo Radiology Result Entry aur
  // Investigation Template par hai. Opt in usi fin_global_resources row se -
  // IsDocumentEditor = '1' (ya helper ke saath '2') par button dikhta hai.
  const { isEnabled: isDocumentEditorEnabled, useHelper: useWordHelper } =
    getDocumentEditorMode(GetGlobalResources);
  // Word se text wapas aane par editor ko naye HTML ke saath dobara
  // banana padta hai, warna list / heading / font waise ke waise nahi aate.
  const [editorInstanceKey, setEditorInstanceKey] = useState(0);

  const isDischargeSummaryHeader = Array.isArray(GetGlobalResources)
    ? GetGlobalResources.find(item => item?.Name === "IsDischargeSummaryHeader")?.Value
    : undefined;
  const [dropDownState, setDropDownState] = useState({
    Header: [],
    Template: [],
    ApproveDoctor: [],
  });

  const [editorValue, setEditorValue] = useState(false);
  // Live HTML from the editor, read by Add Details (see FullTextEditor getDataRef).
  const editorGetDataRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  /* Ctrl+S dabaye rakhne par key repeat hoti hai - ek save chalte hue doosra na jaaye
     iske liye guard. */
  const isSavingSummary = useRef(false);

  // "Required logo on report" - default ON, taaki discharge ka print out letterhead
  // (center_master.ReportHeaderURL) ke saath hi nikle. Pehle default 0 tha, isliye
  // har baar tick karna padta tha warna logo chhapta hi nahi tha. Jise bina logo ke
  // chhapna ho (pehle se chhape hue letterhead par) wo tick hata sakta hai.
  const [checkbox, setCheckbox] = useState(true);
  const [Editable, setEditable] = useState(false);

  // Amendment history (kisne un-approve kiya) aur un-approve ka reason.
  const [amendmentHistory, setAmendmentHistory] = useState([]);
  const [showAmendmentHistory, setShowAmendmentHistory] = useState(false);
  const [historyType, setHistoryType] = useState(UNAPPROVE_HISTORY);
  const [showUnApproveReason, setShowUnApproveReason] = useState(false);
  const [unApproveReason, setUnApproveReason] = useState("");

  const [payload, setPayload] = useState({
    HeaderData: {},
    TemplateData: {},
    TemplateAction: { label: "Nothing", value: "Nothing" },
    templateName: "",
    ApproveDoctorID: {},
  });

  const [reportType, setReportType] = useState({
    label: "Discharge Summary",
    value: 1,
  });
  const [confirmBox, setConfirmBox] = useState({ show: false, onConfirm: null, message: "", header: "" });

  const printOptions = [
    { label: t("Discharge Summary"), value: 1 },
    { label: t("Case Summary"), value: 2 },
  ];

  const isReportTypeShow =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsDischargeReportTypeShow")
      ?.Value === "1";
  const [printFormat, setPrintFormat] = useState("Word");
  const effectivePrintFormat = isReportTypeShow ? printFormat : "PDF";
  const printFormatOptions = [
    { label: "Word", value: "Word" },
    { label: "PDF", value: "PDF" },
  ];
  // Handle value change
  const handleChangeInPrint = (name, selected) => {
    setReportName((prev) => ({
      ...prev,
      [name]: selected,
    }));
    console.log(`Selected ${name}:`, selected);
  };

  const handleReactChange = (name, e, callbackFunction, setObject) => {
    if (callbackFunction) {
      callbackFunction(e?.value);
    }
    if (setObject) {
      setPayload(setObject);
      return;
    }
    setPayload({ ...payload, [name]: e });
  };

  const handleChange = (value) => {
    setEditorValue(value);
  };

  // Report Editor: is patient ke is header ka text MS Word me. Har Ctrl+S par
  // text neeche wale editor me apne aap aa jata hai; header badalne par
  // session khatam, taaki late save galat header me na gire.
  const wordEditor = useMsWordEditor({
    contextKey:
      data?.transactionID && payload?.HeaderData?.value
        ? `discharge-${data.transactionID}-${payload.HeaderData.value}`
        : "",
    getHtml: () => editorValue || "",
    getTitle: () => payload?.HeaderData?.label || "Discharge Summary",
    useHelper: useWordHelper,
    onHtml: (html) => {
      setEditable(false);
      handleChange(html);
      setEditorInstanceKey((key) => key + 1);
    },
  });

  const handleCheckboxChange = (e) => {
    setCheckbox(e.target.checked);
  };

  const handleDRDetailsLoadTemplates = async (TempHeaderID) => {
    // Upar wala "Discharge Summary" (AI ke liye) asli header nahi hai - uska
    // koi number ID nahi, to API 400 deti hai. Uske templates hote hi nahi.
    if (!Number(TempHeaderID)) {
      setDropDownState((prev) => ({ ...prev, Template: [] }));
      return;
    }
    try {
      const response = await DRDetailsLoadTemplates(TempHeaderID);
      if (response?.data?.length > 0) {
        const options = reactSelectOptionList(
          response.data,
          "Temp_Name",
          "Template_Value",
        );
        setDropDownState({
          ...dropDownState,
          Template: [...options],
        });
        // The template this header's saved text came from (emr_DRDetail.TemplateID) is shown
        // again in Select Template. Only the choice is restored - the text in the header's
        // box is what was saved and is not replaced.
        const savedRow = tableData?.find(
          (row) => String(row?.Header_ID) === String(TempHeaderID),
        );
        const savedTemplate = savedRow?.TemplateID
          ? options.find((o) => String(o?.value) === String(savedRow.TemplateID))
          : null;
        if (savedTemplate) {
          setPayload((prev) =>
            String(prev?.HeaderData?.value) === String(TempHeaderID)
              ? { ...prev, TemplateData: savedTemplate }
              : prev,
          );
        }
        // Do not clear editor here if the user is in the middle of typing
        // unless that is the intended behavior.
      } else {
        notify(response?.message || "Template not found", "error");
        setDropDownState({
          ...dropDownState,
          Template: [],
        });
        // setEditorValue(""); // Optional: only if you want to wipe it when no template exists
      }
    } catch (error) {
      notify(response?.message || "Template not found", "error");
      setDropDownState({
        ...dropDownState,
        Template: [],
      });
      console.log(error, "Something Went Wrong");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const handleDRDetailsTemplateChange = async (TemplateID) => {
    try {
      if (!TemplateID) {
        return;
      }
      const response = await DRDetailsTemplateChange(TemplateID);
      if (response?.success && showHeaderInputs && payload?.HeaderData?.value) {
        // header boxes on screen: the template text goes into the ticked header's own box
        setHeaderEditors((prev) => ({
          ...prev,
          [payload.HeaderData.value]: String(response?.data ?? ""),
        }));
        setOpenEditors((prev) => ({ ...prev, [payload.HeaderData.value]: true }));
      } else if (response?.success) {
        setEditorValue(response?.data);
        setEditable(true);
      }
      else {
        setEditorValue(false);
        setEditable(false);
        notify(response?.message || "Failed to load template", "error");
      }

    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleTemplateName = (val) => {
    const reponse = {
      Update: payload?.TemplateData?.label,
    };
    return reponse[val] ?? payload?.templateName;
  };

  const handleTemplateAction = (name, e, callback) => {
    const responsetemplateName = callback(e?.value);
    setPayload({ ...payload, [name]: e, templateName: responsetemplateName });
  };

  const handleDRDetailsLoadHeaders = async (
    department,
    DischargeName,
    transactionID,
  ) => {
    if (department) {
      try {
        const [Header, ApprovalDoctor] = await Promise.all([
          DRDetailsLoadHeaders(department, DischargeName, transactionID),
          DRDetailsBindApprovalDoctor(),
        ]);
        setDropDownState({
          ...dropDownState,
          Header: handleReactSelectDropDownOptions(
            Header?.data,
            "HeaderName",
            "Header_Id",
          ),
          ApproveDoctor: handleReactSelectDropDownOptions(
            ApprovalDoctor?.data,
            "Name",
            "DoctorID",
          ),
        });

        setPayload({
          ...payload,
          ApproveDoctorID: {
            label: data?.reportHeader?.approvedDoctorName,
            value: Number(data?.reportHeader?.appDoctorID),
          },
        });
      } catch (error) {
        console.log(error, "SomeThing Went Wrong");
      }
    }
  };

  const handleDRDetailsSaveDischargeSummary = async (
    latestDetails,
    keepEditorContent = false,
  ) => {
    if (isSavingSummary.current) return;
    if (showHeaderInputs) {
      // header boxes on screen (no big editor): Add Details saves the header boxes that were
      // written in; the ticked header's template action (New / Update) goes with its own box
      if (await saveTypedHeaderInputs()) return;
      notify("Please write the details in a header's box", "warn");
      return;
    }
    if (!payload?.HeaderData?.value) {
      notify(t("Please select Discharge Details Entries"), "warn");
      return;
    }
    // "Discharge Summary" (AI wala option) d_discharge_header me nahi hai, to
    // headerID null jaata tha aur API 400 deti thi. Save karna ho to Discharge
    // Summary Header Master me "Discharge Summary" header bana lo - wo asli ID
    // ke saath list me aa jayega aur yeh option hat jayega.
    if (!Number(payload?.HeaderData?.value)) {
      notify(
        `"${payload?.HeaderData?.label}" is not a saved header. Add it in Discharge Summary Header Master, then select it here to save.`,
        "warn",
      );
      return;
    }
    
   
    const detailsHtml =
      typeof latestDetails === "string"
        ? latestDetails
        : typeof editorValue === "string"
          ? editorValue
          : "";
    const hasText =
      detailsHtml
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim() !== "";
    // Sirf image/table waala content bhi maan'y hai - tag hatane par wo khaali dikhta hai.
    const hasMedia = /<(img|table|hr)\b/i.test(detailsHtml);
    if (!hasText && !hasMedia) {
      notify("Please write details before saving", "warn");
      return;
    }
    isSavingSummary.current = true;
    try {
      const requestBody = {
        headerID: Number(payload?.HeaderData?.value),
        headerText: String(payload?.HeaderData?.label),
        details: detailsHtml,
        transactionID: Number(data?.transactionID),
        templatesID: Number(payload?.TemplateData?.value ?? 0),
        templateAction: String(payload?.TemplateAction?.value),
        templateName: String(payload?.templateName),
      };

      const response = await DRDetailsSaveDischargeSummary(requestBody);
      notify(response?.message, response?.success ? "success" : "error");

      if (response?.success) {
        if (keepEditorContent) {
          if (latestDetails != null) {
            setEditorValue(latestDetails);
          }
          setPayload((prev) => ({
            ...prev,
            TemplateAction: { label: "Nothing", value: "Nothing" },
            templateName: "",
          }));
        } else {
          setEditorValue(false);
          setEditable(false);

          // Clear Payload
          setPayload({
            ...payload, // Keep non-related state if necessary
            HeaderData: {},
            TemplateData: {},
            TemplateAction: { label: "Nothing", value: "Nothing" },
            templateName: "",
          });
        }

        handleDRDetailsBindDetails(data?.transactionID);
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    } finally {
      isSavingSummary.current = false;
    }
  };

  console.log(payload, "payload------");

  // Discharge Details Entries as on-screen inputs: when fin_global_resources
  // ShowDischargeHeaderInputs = 1 the dropdown is replaced by every header with its own
  // input box (no row / 0 / any other value = the usual dropdown). Enter saves the line
  // under that header with the same SaveDischargeSummary call; text already saved for the
  // header is kept and the new line is added after it.
  const showHeaderInputs =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources.find(
        (item) => item?.Name === "ShowDischargeHeaderInputs",
      )?.Value,
    ).trim() === "1";
  const [headerInputs, setHeaderInputs] = useState({});
  const [headerEditors, setHeaderEditors] = useState({});
  const [openEditors, setOpenEditors] = useState({});
  // template id behind a header's auto-filled box (kept with the entry when it is saved)
  const [headerTemplateIds, setHeaderTemplateIds] = useState({});

  // A Final Diagnosis was added on the screen: fill the header boxes with the templates saved
  // under it. Only header boxes that are still empty are filled (nothing saved for the patient,
  // nothing written in the box), so existing entries are never overwritten and a repeat adds no
  // duplicate. Needs the header boxes (ShowDischargeHeaderInputs = 1); click Add Details to save.
  useEffect(() => {
    if (!showHeaderInputs || !diagnosisTemplateBind?.icdId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await DRDetailsLoadTemplatesByDiagnosis(
          diagnosisTemplateBind.icdId,
        );
        if (cancelled || !Array.isArray(response?.data)) return;
        const filled = [];
        response.data.forEach((tpl) => {
          const header = (dropDownState?.Header ?? []).find(
            (h) => String(h?.value) === String(tpl?.Header_Id),
          );
          if (!header) return;
          const hasSaved = !!String(getSavedRow(header)?.Value ?? "")
            .replace(/<[^>]*>|&nbsp;|\s/gi, "")
            .trim();
          const hasWritten = !!String(headerEditors[header.value] ?? "")
            .replace(/<[^>]*>|&nbsp;|\s/gi, "")
            .trim();
          if (hasSaved || hasWritten) return;
          setHeaderEditors((prev) => ({
            ...prev,
            [header.value]: String(tpl?.Details ?? ""),
          }));
          setHeaderTemplateIds((prev) => ({
            ...prev,
            [header.value]: tpl?.Template_ID,
          }));
          setOpenEditors((prev) => ({ ...prev, [header.value]: true }));
          filled.push(header.label);
        });
        if (filled.length) {
          notify(
            `${t("Templates of the Final Diagnosis added to")}: ${filled.join(", ")}. ${t("Click Add Details to save")}`,
            "success",
          );
        }
      } catch (error) {
        console.log(error, "Something Went Wrong");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [diagnosisTemplateBind?.version]);

  const escapeHtml = (text) =>
    String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // Tick a header: it becomes the selected header (same as picking it in the dropdown), so
  // its templates are loaded into Select Template and the template delete / Add Details
  // work on it. Untick: nothing selected, templates cleared.
  const handleHeaderTick = (checked, header) => {
    if (checked) {
      setPayload((prev) => ({
        ...prev,
        HeaderData: { ...header },
        TemplateData: {},
      }));
      handleDRDetailsLoadTemplates(header?.value);
    } else {
      setPayload((prev) => ({ ...prev, HeaderData: {}, TemplateData: {} }));
      setDropDownState((prev) => ({ ...prev, Template: [] }));
    }
  };

  const getSavedRow = (header) =>
    tableData?.find((row) => String(row?.Header_ID) === String(header?.value));

  // A header whose saved text is one plain line can be edited right in its box: the line
  // is shown there and Enter replaces it. Anything bigger (several paragraphs, lists,
  // tables...) stays untouched in the box - the new line is added after it, and the full
  // text is edited with the edit icon of the "Header Added" list.
  const getEditableLine = (header) => {
    const saved = getSavedRow(header)?.Value;
    if (typeof saved !== "string" || !saved.trim()) return null;
    const wrapped = saved.trim().match(/^<p>([\s\S]*?)<\/p>$/i);
    const inner = wrapped ? wrapped[1] : saved.trim();
    if (/<[^>]+>/.test(inner)) return null;
    const box = document.createElement("div");
    box.innerHTML = inner;
    return box.textContent.replace(/ /g, " ").trim();
  };

  // Saves the line typed in a header's box (Enter, or Add Details for every typed box).
  // Returns true = saved, false = tried and failed, null = nothing typed / unchanged.
  // htmlOverride = the full text of the header's own editor (replaces the saved text).
  const saveHeaderInputLine = async (header, htmlOverride) => {
    const editableLine = getEditableLine(header);
    const isEditing = editableLine !== null;
    const text = String(
      headerInputs[header?.value] ?? (isEditing ? editableLine : ""),
    ).trim();
    if (
      htmlOverride === undefined &&
      (!text || (isEditing && text === editableLine))
    )
      return null;
    try {
      const saved = getSavedRow(header);
      const current =
        !isEditing && typeof saved?.Value === "string" ? saved.Value : "";
      const hasText = !!current.replace(/<[^>]*>|&nbsp;|\s/gi, "");
      const response = await DRDetailsSaveDischargeSummary({
        headerID: Number(header?.value),
        headerText: String(header?.label),
        details:
          htmlOverride !== undefined
            ? String(htmlOverride)
            : `${hasText ? current : ""}<p>${escapeHtml(text)}</p>`,
        transactionID: Number(data?.transactionID),
        // the ticked header keeps its template choice / action (New, Update)
        ...(htmlOverride !== undefined &&
        String(payload?.HeaderData?.value) === String(header?.value)
          ? {
              templatesID: Number(payload?.TemplateData?.value ?? 0),
              templateAction: String(payload?.TemplateAction?.value),
              templateName: String(payload?.templateName),
            }
          : {
              // an auto-filled box keeps the id of the template it came from
              templatesID:
                htmlOverride !== undefined
                  ? Number(headerTemplateIds[header?.value] ?? 0)
                  : 0,
              templateAction: "Nothing",
              templateName: "",
            }),
      });
      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        // back to showing what is saved for the header
        setHeaderInputs((prev) => {
          const next = { ...prev };
          delete next[header?.value];
          return next;
        });
        if (htmlOverride !== undefined) {
          setHeaderEditors((prev) => {
            const next = { ...prev };
            delete next[header?.value];
            return next;
          });
          setOpenEditors((prev) => ({ ...prev, [header?.value]: false }));
          setHeaderTemplateIds((prev) => {
            const next = { ...prev };
            delete next[header?.value];
            return next;
          });
        }
        handleDRDetailsBindDetails(data?.transactionID);
        // refresh the "already added" colour of the headers
        // (same guard as the first load: no department, no call)
        const Header = data?.reportHeader?.department
          ? await DRDetailsLoadHeaders(
              data?.reportHeader?.department,
              data?.reportHeader?.header,
              data?.transactionID,
            )
          : null;
        // only a real list replaces the headers (a failed call answers with a non-list and
        // used to crash the page: "state?.map is not a function")
        if (Array.isArray(Header?.data)) {
          const refreshedHeaders = handleReactSelectDropDownOptions(
            Header.data,
            "HeaderName",
            "Header_Id",
          );
          setDropDownState((prev) => ({ ...prev, Header: refreshedHeaders }));
        }
      }
      return !!response?.success;
    } catch (error) {
      console.log(error, "Something Went Wrong");
      notify("Something went wrong while saving", "error");
      return false;
    }
  };

  // Add Details with the header boxes on screen and no header ticked: save every box that
  // has text typed in it. Returns false when there was nothing typed (the usual warning shows).
  // The same goes for a header's own editor (below its row) whose text was changed.
  const plainOf = (html) =>
    String(html ?? "")
      .replace(/<[^>]*>|&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  const isEditorChanged = (header) =>
    headerEditors[header?.value] !== undefined &&
    plainOf(headerEditors[header?.value]) !==
      plainOf(getSavedRow(header)?.Value);
  const saveTypedHeaderInputs = async () => {
    const headers = (dropDownState?.Header ?? []).filter((h) =>
      Number(h?.value),
    );
    const typed = headers.filter((h) =>
      String(headerInputs[h?.value] ?? "").trim(),
    );
    const edited = headers.filter(
      (h) => !typed.includes(h) && isEditorChanged(h),
    );
    if (!typed.length && !edited.length) return false;
    for (const header of typed) {
      await saveHeaderInputLine(header);
    }
    for (const header of edited) {
      await saveHeaderInputLine(header, headerEditors[header?.value]);
    }
    return true;
  };

  // A header's own editor stays a disabled box until it is clicked; the click turns it into
  // the editor (same one as the big editor below), filled with what is saved for the header.
  const openHeaderEditor = (header) =>
    setOpenEditors((prev) => ({ ...prev, [header?.value]: true }));

  const handleDRDetailsTemplateDelete = (Template_ID) => {
    if (!Template_ID) {
      notify(t("Please Select Template"), "error");
      return;
    }
    setConfirmBox({
      show: true,
      header: t("Delete Template"),
      message: t("Are you sure you want to delete this template?"),
      onConfirm: async () => {
        try {
          const response = await DRDetailsTemplateDelete(Template_ID);
          notify(response?.message, response?.success ? "success" : "error");
          if (response?.success) {
            // Deleted template should not stay selected; reload the list by header ID
            setPayload((prev) => ({ ...prev, TemplateData: {} }));
            handleDRDetailsLoadTemplates(payload?.HeaderData?.value);
          }
        } catch (error) {
          console.log(error, "SomeThing Went Wrong");
        }
        setConfirmBox({ show: false, onConfirm: null, message: "", header: "" });
      },
    });
  };

  useEffect(() => {
    handleDRDetailsLoadHeaders(
      data?.reportHeader?.department,
      data?.reportHeader?.header,
      data?.transactionID,
    );
  }, [
    data?.reportHeader?.department,
    data?.reportHeader?.header,
    data?.transactionID,
  ]);

  useEffect(() => {
    if (aiBoundSummary?.html) {
      if (aiBoundSummary.append) {
        // Clinical record / scanned pages are added below whatever is already written, never over it.
        const live = editorGetDataRef.current?.();
        const base = typeof live === "string" ? live : typeof editorValue === "string" ? editorValue : "";
        setEditorValue(base + aiBoundSummary.html);
      } else {
        setEditorValue(aiBoundSummary.html);
      }
      setEditable(true);
    }
  }, [aiBoundSummary?.version]);

  // If there are no templates available, clear any bound template data
  // so nothing is shown/selected in the Template select.
  useEffect(() => {
    if (!dropDownState?.Template || dropDownState.Template.length === 0) {
      setPayload((prev) => ({ ...prev, TemplateData: {}, templateName: "" }));
      setEditorValue("");
    }
  }, [dropDownState?.Template]);

  const colorCodeOfDropDown = (number) => {
    const color = {
      1: "#90ee90",
      2: "#ff0",
    };

    return color[number];
  };

  const handleFormatlabel = (name, label, rest) => {
    return (
      <div
        style={{
          backgroundColor: colorCodeOfDropDown(Number(rest?.ColorCode)),
          margin: "-8px -12px", // Adjust this to match the parent's padding
          padding: "8px 12px", // Add your own padding if needed inside the label
          boxSizing: "border-box",
        }}
      >
        {label}
      </div>
    );
  };

  const handleDRDetailsPatientTemplateDelete = (transactionID, Header_ID) => {
    setConfirmBox({
      show: true,
      header: "Delete Header",
      message: "Are you sure you want to delete this header?",
      onConfirm: async () => {
        try {
          const response = await DRDetailsPatientTemplateDelete(
            transactionID,
            Header_ID,
          );
          notify(response?.message, response?.success ? "success" : "error");
          handleDRDetailsBindDetails(transactionID);
          if (showAmendmentHistory) {
            handleDRDetailsGetAmendmentHistory(historyType);
          }
        } catch (error) {
          console.log(error, "SomeThing Went Wrong");
        }
        setConfirmBox({ show: false, onConfirm: null, message: "", header: "" });
      },
    });
  };

  const handleEditTable = (row) => {
    console.log(row);

    setPayload({
      ...payload,
      HeaderData: {
        value: row?.Header_ID,
        label: row?.HeaderName,
      },
    });
    const updated = row?.Value ?? "";
    if (showHeaderInputs) {
      // header boxes on screen: the saved text opens in that header's own box
      setHeaderEditors((prev) => ({ ...prev, [row?.Header_ID]: String(updated) }));
      setOpenEditors((prev) => ({ ...prev, [row?.Header_ID]: true }));
      return;
    }
    setEditorValue(updated);
    setEditable(true);
  };

  const handleTable = (tableData) => {
    return tableData?.map((item, index) => {
      return {
        Sno: <div className="text-center">{index + 1}</div>,
        HeaderAdded: item?.HeaderName,
        Action: (
          <div className="p-1">
            <span className="mx-1" onClick={() => handleEditTable(item)}>
              <i className="fa fa-edit" aria-hidden="true"></i>
            </span>
            <span
              className="mx-1"
              onClick={() =>
                handleDRDetailsPatientTemplateDelete(
                  data?.transactionID,
                  item?.Header_ID,
                )
              }
            >
              <i className="fa fa-trash text-danger"></i>
            </span>
          </div>
        ),
      };
    });
  };

  const handleApproveButtonAndType = (type) => {
    const ButtonAndType = {
      0: {
        ButtonName: t("Approve"),
        type: "Approve",
      },
      1: {
        ButtonName: t("Not Aprrove"),
        type: "Not Approved",
      },
    };

    return ButtonAndType[[0, 1].includes(type) ? type : 0];
  };

  const handleDRDetailsApproveDischargeSummary = async (reason = "") => {
    try {
      const response = await DRDetailsApproveDischargeSummary(
        payload?.ApproveDoctorID?.value,
        data?.transactionID,
        handleApproveButtonAndType(
          Number(data?.reportHeader?.isDisChargeSummaryApproved),
        )?.type,
        reason,
      );

      notify(response?.message, response?.success ? "success" : "error");

      if (response?.success) {
        setShowUnApproveReason(false);
        setUnApproveReason("");
        handleDRDetailsGetDRDetails();
        // History khuli ho to nayi entry turant dikh jaaye.
        if (showAmendmentHistory) {
          handleDRDetailsGetAmendmentHistory(historyType);
        }
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };
  const handleApproveButtonClick = () => {
    const { type } = handleApproveButtonAndType(
      Number(data?.reportHeader?.isDisChargeSummaryApproved),
    );

    if (type === "Not Approved" && isShowAmendmentHistory) {
      setUnApproveReason("");
      setShowUnApproveReason(true);
      return;
    }

    handleDRDetailsApproveDischargeSummary();
  };

  const handleUnApproveSubmit = () => {
    if (!unApproveReason?.trim()) {
      notify("Please enter reason for un-approve", "warn");
      return;
    }
    handleDRDetailsApproveDischargeSummary(unApproveReason.trim());
  };

  const handleDRDetailsGetAmendmentHistory = async (actionType) => {
    try {
      const response = await DRDetailsGetAmendmentHistory(
        data?.transactionID,
        actionType,
      );
      setAmendmentHistory(response?.success ? (response?.data ?? []) : []);
      if (!response?.success) {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleOpenAmendmentHistory = (actionType) => {
    setHistoryType(actionType);
    setShowAmendmentHistory(true);
    handleDRDetailsGetAmendmentHistory(actionType);
  };

  const handleAmendmentTable = (rows) => {
    return rows?.map((item, index) => {
      const common = {
        UserName: item?.UserName || "-",
        Date: <div className="text-center">{item?.EntryDate || "-"}</div>,
        Time: <div className="text-center">{item?.EntryTime || "-"}</div>,
      };

      return historyType === DELETE_HISTORY
        ? {
            Sno: <div className="text-center">{index + 1}</div>,
            HeaderName: item?.HeaderName || "-",
            ...common,
          }
        : {
            Sno: <div className="text-center">{index + 1}</div>,
            ...common,
            Reason: item?.Reason || "-",
          };
    });
  };

  const handleDRDetailsBindDetails = async (transactionID) => {
    // debugger
    try {
      const response = await DRDetailsBindDetails(transactionID);
      setTableData(response?.data);
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleDRDetailsPrintDischargeReport = async () => {
    try {
      console.log("dis");
      const requestBody = {
        transactionID: Number(data?.transactionID),
        status: patientData.data.status,
        reportType: effectivePrintFormat,
        isEmergencyPatient: 0,
        dischargeDate: "",
        onlineHeader: "",
        testID: "",
        labType: "",
        orderBy: "",
        pHead: 0,
        IsImage: checkbox ? 1 : 0,
        Type: "",
      };
      console.log("Payloadby discharge report---:", requestBody);
      const response = await DRDetailsPrintDischargeReport(requestBody);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
        console.log(response, "response ❌❌");
      } else notify(response?.message, response?.success ? "success" : "error");
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
    const requestBody = {
      transactionID: 0,
      status: "string",
      reportType: "string",
      isEmergencyPatient: 0,
      dischargeDate: "string",
      onlineHeader: "string",
      testID: "string",
      labType: "string",
      orderBy: "string",
      pHead: 0,
      IsImage: checkbox ? 1 : 0,
    };
  };

  const handleDRDetailsPrintCaseReport = async () => {
    try {
      console.log("case");
      const requestBody = {
        transactionID: Number(data?.transactionID),
        status: patientData.data.status,
        reportType: effectivePrintFormat,
        isEmergencyPatient: 0,
        dischargeDate: "",
        onlineHeader: "",
        testID: "",
        labType: "",
        orderBy: "",
        pHead: 0,
        IsImage: checkbox ? 1 : 0,
        Type: "CaseSumarry",
      };
      const response = await DRDetailsPrintDischargeReport(requestBody);
      if (response?.success) RedirectURL(response?.data?.pdfUrl);
      else notify(response?.message, response?.success ? "success" : "error");
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
    const requestBody = {
      transactionID: 0,
      status: "string",
      reportType: "string",
      isEmergencyPatient: 0,
      dischargeDate: "string",
      onlineHeader: "string",
      testID: "string",
      labType: "string",
      orderBy: "string",
      IsImage: checkbox ? 1 : 0,
      Type: "CaseSumarry",
    };
    console.log("Payload -----by case summry----:", requestBody);
  };

  useEffect(() => {
    handleDRDetailsBindDetails(data?.transactionID);
  }, []);

  return (
    <>
      <div className="col-sm-10"></div>

      <div className="col-12">
        <div className="row">
          <div className="col-xl-8 p-1" style={{ border: "1px solid #e7e7e7" }}>
            <div className="row">
              {!showHeaderInputs && (
              <ReactSelect
                respclass={"col-lg-6 col-xl-4 col-12"}
                requiredClassName={"required-fields"}
                lable={""}
                name="HeaderData"
                value={payload?.HeaderData?.value}
             
                dynamicOptions={[
                  // Header Master me asli "Discharge Summary" ho to wahi
                  // dikhe (ID ke saath, save hota hai), warna AI wala option.
                  // IsDischargeSummaryHeader = 1 par AI wala option kabhi nahi.
                  ...(String(isDischargeSummaryHeader) === "1" ||
                  dropDownState?.Header?.some(
                    (h) =>
                      String(h?.label).trim().toLowerCase() ===
                      "discharge summary",
                  )
                    ? []
                    : [{ label: t("Discharge Summary"), value: "Discharge Summary" }]),
                  ...(dropDownState?.Header || []),
                ]}
                placeholderName={t("Discharge Details Entries")}
                handleChange={(name, e) =>
                  handleReactChange(name, e, handleDRDetailsLoadTemplates, {
                    ...payload,
                    [name]: e,
                    TemplateData: {},
                  })
                }
                handleFormatlabel={handleFormatlabel}
              />
              )}

              <div className="col-lg-6 col-xl-4 col-12">
                <div className="d-flex">
                  <ReactSelect
                    lable={""}
                    respclass={"w-100"}
                    name="TemplateData"
                    dynamicOptions={dropDownState?.Template}
                    placeholderName={t("Select Template")}
                    value={
                      payload?.TemplateData ? payload?.TemplateData?.value : ""
                    }
                    handleChange={(name, e) =>
                      handleReactChange(name, e, handleDRDetailsTemplateChange)
                    }
                    removeIsClearable={true}
                  />
                  <button
                    className="btn btn-sm btn-danger mx-2"
                    style={{ backgroundColor: "red", border: "none" }}
                    onClick={() =>
                      handleDRDetailsTemplateDelete(
                        payload?.TemplateData?.value,
                      )
                    }
                  >
                    <Tooltip
                      target={`#delete`}
                      position="top"
                      content={"Delete Template"}
                      event="hover"
                      className="ToolTipCustom"
                    />
                    <i
                      className="fa fa-trash fs-icons"
                      aria-hidden="true"
                      id="delete"
                    ></i>
                  </button>
                </div>
              </div>

              <div className="col-lg-2  col-xl-4 col-12">
                <div className="d-flex flex-wrap align-items-center" style={{ gap: 6 }}>
                  <div className="mr-1">
                    <ColorCodingSearch
                      label={t("Already Added")}
                      color={colorCodeOfDropDown(1)}
                    />
                    <ColorCodingSearch
                      label={t("Mandatory Header")}
                      color={colorCodeOfDropDown(2)}
                    />
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: "#6236ecff", color: "white" }}
                    onClick={() => {
                      handleOpenAIChat(payload?.HeaderData?.label);
                    }}
                    disabled={!payload?.HeaderData?.label}
                    title={t("AI Discharge Summary")}
                  >
                    <SiGooglegemini />
                    <span>{t("Ai Assistance")}</span>
                  </button>

                  {/* Gather this admission's records / scan a hand-written summary, then add to the editor. */}
                  <button
                    type="button"
                    className="btn btn-sm btn-info d-inline-flex align-items-center"
                    onClick={onOpenClinicalRecord}
                    disabled={isDischargeApproved}
                    title={t("Clinical Record") + " - " + t("collect the records of this admission, preview and add to the summary")}
                    aria-label={t("Clinical Record")}
                  >
                    <FaNotesMedical size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-warning d-inline-flex align-items-center"
                    onClick={onOpenScan}
                    disabled={isDischargeApproved}
                    title={t("Scan Handwritten") + " - " + t("scan a hand-written discharge summary and add it as typed text")}
                    aria-label={t("Scan Handwritten")}
                  >
                    <FaCamera size={16} />
                  </button>

                  {/* Full page writing window ka rasta, Ai Assistance ke saath
                      hi. Sirf active IsDocumentEditor row par. */}
                  {isDocumentEditorEnabled && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary ml-2"
                      onClick={wordEditor.openInWord}
                      disabled={!payload?.HeaderData?.value}
                      title={t("Open this discharge summary in MS Word")}
                    >
                      <i className="fa fa-file-word-o mr-1" />
                      {t("Report Editor")}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {showHeaderInputs && (
              <div
                className="row mx-0 mt-1 p-2"
                style={{
                  border: "1px solid #e7e7e7",
                  borderRadius: "4px",
                  maxHeight: "430px",
                  overflowY: "auto",
                }}
              >
                {(dropDownState?.Header ?? [])
                  .filter((header) => Number(header?.value))
                  .map((header) => (
                    <div className="col-12 px-0 mb-2" key={header?.value}>
                      <div className="d-flex align-items-center">
                        {/* tick = this header's templates go into Select Template (one
                            header at a time; untick clears them) */}
                        <input
                          type="checkbox"
                          className="mr-2"
                          style={{ flexShrink: 0, cursor: "pointer" }}
                          title={t("Load templates of this header")}
                          checked={
                            String(payload?.HeaderData?.value) ===
                            String(header?.value)
                          }
                          onChange={(e) => handleHeaderTick(e.target.checked, header)}
                        />
                        {/* dot = Already Added (green) / Mandatory Header (yellow) */}
                        <span
                          title={header?.ColorCode ? "" : undefined}
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            flexShrink: 0,
                            marginRight: "6px",
                            border: header?.ColorCode ? "none" : "1px solid #ddd",
                            backgroundColor: colorCodeOfDropDown(
                              Number(header?.ColorCode),
                            ),
                          }}
                        />
                        <div
                          className="px-2 mr-2"
                          style={{
                            width: "210px",
                            flexShrink: 0,
                            fontWeight: 600,
                            fontSize: "13px",
                            lineHeight: "30px",
                            height: "30px",
                            color: "#fff",
                            backgroundColor: "#5b9bd1",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={header?.label}
                        >
                          {header?.label}
                        </div>
                      </div>
                      {/* the header's own text box: disabled until clicked, then the editor */}
                      <div style={{ marginTop: "4px", marginLeft: "18px" }}>
                        {openEditors[header?.value] ? (
                          <FullTextEditor
                            value={
                              headerEditors[header?.value] ??
                              getSavedRow(header)?.Value ??
                              ""
                            }
                            setValue={(html) =>
                              setHeaderEditors((prev) => ({
                                ...prev,
                                [header?.value]: html,
                              }))
                            }
                            EditTable={false}
                            setEditTable={() => {}}
                            height={130}
                          />
                        ) : (
                          <div
                            role="button"
                            tabIndex={0}
                            title={t("Click to write")}
                            onClick={() => openHeaderEditor(header)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openHeaderEditor(header);
                              }
                            }}
                            style={{
                              minHeight: "54px",
                              maxHeight: "110px",
                              overflow: "auto",
                              padding: "6px 10px",
                              fontSize: "13px",
                              background: "#e9ecef",
                              border: "1px solid #ced4da",
                              borderRadius: "3px",
                              color: "#6c757d",
                              cursor: "text",
                            }}
                            dangerouslySetInnerHTML={{
                              __html:
                                getSavedRow(header)?.Value ||
                                `<span style="opacity:.7">${t("Click to write")}</span>`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {/* <ReactQuill
              value={editorValue}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              style={{
                marginBottom: "10px",
              }}
            /> */}
            {/* <FullTextEditor
              value={editorValue}
              // value={getTest}
              setValue={handleChange}
              EditTable={Editable}
              setEditTable={setEditable}
            /> */}
            {/* with the header boxes on screen each header has its own editor, so the big one goes */}
            {!showHeaderInputs && (
              <FullTextEditor
                // Header badalne ya clear hone par reset, aur tab bhi jab document
                // window apna text wapas de.
                key={`${payload?.HeaderData?.value || "new"}-${editorInstanceKey}`}
                value={editorValue}
                setValue={handleChange}
                EditTable={Editable}
                setEditTable={setEditable}
               
                enableSpellCheck={true}
                spellCheckLang="en-US"
                onSaveShortcut={(html) =>
                  handleDRDetailsSaveDischargeSummary(html, true)
                }
                // No automatic Pascal case: the summary is typed exactly as entered (small / capital letters as the user chooses).
                getDataRef={editorGetDataRef}
              />
            )}
            <div className="col-12">
              <div className="row flex-row-reverse pt-1">
                <div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      handleDRDetailsSaveDischargeSummary(
                        editorGetDataRef.current?.(),
                      )
                    }
                  >
                    {t("Add Details")}
                  </button>
                </div>
                <Input
                  type={"text"}
                  respclass="col-xl-2 col-md-3 col-sm-4 col-4"
                  className="form-control"
                  lable={t("Temp. Name")}
                  value={payload?.templateName}
                  name={"templateName"}
                  disabled={
                    ["New"].includes(payload?.TemplateAction?.value)
                      ? false
                      : true
                  }
                  onChange={handleInputChange}
                />

                <ReactSelect
                  respclass="col-xl-2 col-md-3 col-sm-4 col-4"
                  lable={""}
                  name="TemplateAction"
                  value={payload?.TemplateAction?.value}
                  dynamicOptions={translateOptions(DROPDOWN_DATA, t)}
                  removeIsClearable={true}
                  placeholderName={t("Template Action")}
                  handleChange={(name, e) =>
                    handleTemplateAction(name, e, handleTemplateName)
                  }
                />
              </div>
            </div>
          </div>

          <div className="col-xl-4">
            <div className="col-12">
              <div className="d-flex mt-2">
                {!isApproveDoctorSkipped && (
                  <ReactSelect
                    dynamicOptions={dropDownState?.ApproveDoctor}
                    lable={""}
                    respclass={"w-100"}
                    requiredClassName={"required-fields"}
                    name="ApproveDoctorID"
                    value={payload?.ApproveDoctorID?.value}
                    placeholderName={t("Approve Doctor")}
                    handleChange={(name, e) => handleReactChange(name, e)}
                  />
                )}
                <button
                  className="btn btn-sm btn-primary mx-2"
                  onClick={handleApproveButtonClick}
                  style={{ zIndex: "999999999" }}
                >
                  {
                    handleApproveButtonAndType(
                      Number(data?.reportHeader?.isDisChargeSummaryApproved),
                    )?.ButtonName
                  }
                </button>

                <ReactSelect
                  lable={""}
                  respclass={isReportTypeShow ? "w-50" : "w-100"}
                  dynamicOptions={[
                    ...handleReactSelectDropDownOptions(
                      printOptions,
                      "label",
                      "value",
                    ),
                  ]}
                  name="reportType"
                  value={reportType?.value}
                  handleChange={(name, val) => {
                    setReportType({
                      label: val?.label,
                      value: val?.value,
                    });
                  }}
                />

                {isReportTypeShow && (
                  <ReactSelect
                    lable={""}
                    respclass={"w-50 ml-2"}
                    placeholderName={t("Report Type")}
                    dynamicOptions={printFormatOptions}
                    removeIsClearable={true}
                    name="printFormat"
                    value={printFormat}
                    handleChange={(name, val) => setPrintFormat(val?.value ?? "Word")}
                  />
                )}

                <button
                  className="btn btn-sm btn-primary ml-2"
                  style={{ zIndex: "999999999" }}
                  onClick={() => {
                    reportType?.value === 1
                      ? handleDRDetailsPrintDischargeReport()
                      : handleDRDetailsPrintCaseReport();
                  }}
                >
                  {t("Print")}
                </button>
              </div>
              <div className="d-flex align-items-center">
                <span>
                  <label
                    className="d-flex align-items-center ml-3"
                    style={{ cursor: "pointer" }}
                  >
                    <Checkbox
                      id="checkbox"
                      className="mt-2"
                      name="checkbox"
                      onChange={handleCheckboxChange}
                      checked={checkbox}
                    />
                    {t("Required logo on report")}
                  </label>
                </span>
                {isShowAmendmentHistory && (
                  <button
                    className="btn btn-sm btn-primary ml-3 mt-2"
                    // Above the approved-summary overlay (like Approve / Print): only opens the history, edits stay locked.
                    style={{ zIndex: "999999999", position: "relative" }}
                    onClick={() => handleOpenAmendmentHistory(UNAPPROVE_HISTORY)}
                    title={t("Amendment History")}
                  >
                    {t("Amendment History")}
                  </button>
                )}
                {isShowDeleteDetail && (
                  <button
                    className="btn btn-sm btn-primary ml-2 mt-2"
                    style={{ zIndex: "999999999", position: "relative" }}
                    onClick={() => handleOpenAmendmentHistory(DELETE_HISTORY)}
                    title={t("Delete Detail")}
                  >
                    {t("Delete Detail")}
                  </button>
                )}
              </div>
            </div>

            <Tables thead={translateHead(THEAD, t)} tbody={handleTable(tableData)} />
          </div>
        </div>
      </div>

      {/* Un-approve reason (ShowDischargeAmendmentHistory = 1) and the amendment / delete-detail
          history. Both were lost in a merge - only two stray import lines were left here, so
          "Not Approve" opened nothing and never reached the API. */}
      <Modal
        visible={showUnApproveReason}
        setVisible={setShowUnApproveReason}
        Header={t("Un-Approve Reason")}
        modalWidth="40vw"
        buttonName={t("Submit")}
        handleAPI={handleUnApproveSubmit}
      >
        <div className="col-12">
          <label className="required-fields">{t("Reason")}</label>
          <textarea
            className="form-control"
            rows={3}
            autoFocus
            value={unApproveReason}
            placeholder={t("Enter reason for un-approve")}
            onChange={(e) => setUnApproveReason(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        visible={showAmendmentHistory}
        setVisible={setShowAmendmentHistory}
        Header={
          historyType === DELETE_HISTORY
            ? t("Delete Detail History")
            : t("Amendment History")
        }
        modalWidth="60vw"
        footer={
          <div className="ftr_btn">
            <CancelButton
              cancleBtnName={t("Close")}
              onClick={() => setShowAmendmentHistory(false)}
            />
          </div>
        }
      >
        {amendmentHistory?.length > 0 ? (
          <Tables
            thead={translateHead(
              historyType === DELETE_HISTORY
                ? DELETE_HISTORY_THEAD
                : AMENDMENT_THEAD,
              t,
            )}
            tbody={handleAmendmentTable(amendmentHistory)}
          />
        ) : (
          <div className="text-center p-3">{t("No history found")}</div>
        )}
      </Modal>

      <ConfirmBox
        visible={confirmBox.show}
        header={confirmBox.header}
        message={confirmBox.message}
        onConfirm={() => confirmBox.onConfirm?.()}
        onCancel={() => setConfirmBox({ show: false, onConfirm: null, message: "", header: "" })}
      />

      {/* Jab tak text MS Word me khula hai. Word ka har save upar ke editor
          me apne aap aata hai; Add Details / Approve / Print pehle jaise hi
          chalte hain. */}
      <MsWordSessionBar word={wordEditor} t={t} />
    </>
  );
};

export default DischargeReport;
