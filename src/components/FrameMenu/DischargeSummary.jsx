import React, { useCallback, useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import ReactSelect from "../formComponent/ReactSelect";
import {
  BindEMRInvItemApi,
  BindEMRMedicine,
  DeleteEMRMedicine,
  DischargeSummaryBindConsultant,
  DischargeSummaryBindMeal,
  DischargeSummaryBindReportHeader,
  DischargeSummaryBindRoute,
  DischargeSummaryBindTime,
  DischargeSummaryBindTimeofNextDose,
  DischargeSummaryConsultantAdd,
  DischargeSummaryDeleteConsultant,
  DischargeSummaryDRHeader,
  DischargeSummaryEMRMedicine,
  DRDetailsBindDetails,
  DRDetailsGetDRDetails,
  SaveEMRInvItemApi,
} from "../../networkServices/dischargeSummaryAPI";
import {
  DischargeSummaryEMRMedicinePayload,
  notify,
  reactSelectOptionList,
} from "../../utils/utils";
import { GetBindDoctorDept } from "../../networkServices/opdserviceAPI";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import CustomSelect from "../formComponent/CustomSelect";
import {
  AUTOCOMPLETE_STATE,
  DISCHARGESUMMARY_TYPE,
  DischargeSummaryAutoComplete,
  GEMINI_MODEL,
} from "../../utils/constant";
import store from "../../store/store";
import { setLoading } from "../../store/reducers/loadingSlice/loadingSlice";
import PatientDiagnosisInformation from "./PatientDiagnosisInformation";
import DischargeReport from "./DischargeReport";
import PageDisableOverlay from "../UI/PageDisableOverlay";
import { Table } from "react-bootstrap";
import { Checkbox } from "primereact/checkbox";
import { ClockSVG } from "../SvgIcons";
import { noteFinderSearchApi } from "../../networkServices/Emergency";
import moment from "moment";
import DischageMedicineTable from "../UI/customTable/doctorTable/ViewConsultationtable/DischageMedicineTable";
import { FaRotate } from "react-icons/fa6";
import { getAIResponseAPI } from "../../networkServices/commonApi";

import { translateOptions } from "@components/WrapTranslate";
import DischargeClinicalRecordModal from "./DischargeClinicalRecordModal";
import DischargeScanModal from "./DischargeScanModal";

import { aiFetch, AI_GENERATE_URL } from "../../utils/aiClient";
const DischargeSummary = ({ data }) => {
  console.log("DischargeSummary component rendered with data:", data);
  const [t] = useTranslation();
  const [tags, setTags] = useState({
    ...DischargeSummaryAutoComplete,
  });
  console.log("tagstags", tags);
  const THEADMEDICATIONDISCHARGEINSTRUCTIONS = [
    { name: t("Type"), width: "10%" },
    { name: t("Medicine Name"), width: "15%" },
    { name: t("Dose"), width: "10%" },
    { name: t("Frequency"), width: "10%" },
    { name: t("Duration"), width: "10%" },
    { name: t("Route"), width: "10%" },
    // { name: t("Time of Next Dose"), width: "15%" },
    { name: t("Meal"), width: "10%" },
    { name: t("Remark"), width: "10%" },
    { name: t("Action"), width: "10%" },
  ];

  const InvestigationHeadData = [
    { name: t("S.No"), width: "1%" },

    { name: t("Department"), width: "5%" },
    { name: t("Investigation Name"), width: "5%" },
    { name: t("Date"), width: "5%" },
    { name: t("Remarks"), width: "5%" },
    { name: t("Action"), width: "1%" },
  ];
  const [investigationTableNumeric, setInvestigationTableNumeric] = useState(
    [],
  );
  const [investigationTableText, setInvestigationTableText] = useState([]);
  const [noteFinderSummaryData, setNoteFinderSummaryData] = useState([]);

  const stripHtmlContent = (html = "") => {
    if (!html) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getNoteFiderDetails = useCallback(async () => {
    try {
      const res = await noteFinderSearchApi({
        cadreID: "0",
        tierID: "0",
        specialtyID: "0",
        noteType: "0",
        encounter: "0",
        encounterType: data?.transactionID,
        fromdate: moment().subtract(1, "month").format("DD-MMM-YYYY"),
        todate: moment(new Date()).format("DD-MMM-YYYY"),
        isAllDate: 0,
      });

      if (res?.success) {
        const formattedNotes = (res?.data || [])
          .map((item) => ({
            Dates: item?.Dates || "",
            Detail: stripHtmlContent(item?.Detail || ""),
            RoleName: item?.RoleName || "",
            NoteType: item?.NoteType || "",
          }))
          .filter(
            (item) =>
              item?.Dates || item?.Detail || item?.RoleName || item?.NoteType,
          );

        setNoteFinderSummaryData(formattedNotes);
        return formattedNotes;
      }

      setNoteFinderSummaryData([]);
      notify(res?.message || "Failed to fetch notes", "error");
      return [];
    } catch (error) {
      setNoteFinderSummaryData([]);
      notify(error?.message || "Failed to fetch notes", "error");
      return [];
    }
  }, [data?.transactionID]);

  useEffect(() => {
    if (data?.transactionID) {
      getNoteFiderDetails();
    }
  }, [data?.transactionID, getNoteFiderDetails]);
  const BindEMRInvItemTable = async () => {
    try {
      const payload = {
        tid: data?.transactionID,
        pid: data?.patientID,
        // pid: data?.patientID
      };
      console.log("Payload before API call:-----bbbb", payload);

      const response = await BindEMRInvItemApi(payload);

      // console.log("Full API Response: 🤐🥱", response);

      if (response?.success) {
        setInvestigationTableNumeric(
          response?.data.filter((fitem) => fitem?.ReportType === 1),
        );
        setInvestigationTableText(
          response?.data.filter(
            (fitem) => fitem?.ReportType === 3 || fitem?.ReportType === 5,
          ),
        );
        // setInvestigationTable(response?.data);
        console.log("Response Data:", response?.data);
      }
    } catch (error) {
      console.log("Error updating invoice:", error);
      // notify("Failed to update invoice.", "error");
    }
  };

  const SaveEMRInvItem = async () => {
    const numericInvs = investigationTableNumeric?.map((item) => ({
      // patientID: "AM24-05090001",
      patientID: data.patientID,
      transactionID: data.transactionID,
      investigation_ID: item.InvestigationID,
      labInvestigationIPD_ID: item.LabInvestigationIPD_ID,
      remarks: item.Remarks || "",
      test_ID: item.Test_ID,
      IsEnter: item.IsEnter,
    }));

    const textLabInvs = investigationTableText?.map((item) => ({
      // patientID: "AM24-05090001",
      patientID: data?.patientID,
      transactionID: data?.transactionID,
      investigation_ID: item.InvestigationID,
      labInvestigationIPD_ID: item.LabInvestigationIPD_ID,
      remarks: item.Remarks || "",
      test_ID: item.Test_ID,
      IsEnter: item.IsEnter,
    }));

    // Create final payload
    const payload = { numericInvs: numericInvs, textLabInvs: textLabInvs };

    // Check if payload is empty
    if (numericInvs.length === 0 && textLabInvs.length === 0) {
      notify(t("No items selected."), "error");
      return;
    }

    try {
      const response = await SaveEMRInvItemApi(payload);
      if (response?.success) {
        BindEMRInvItemTable();
        notify(response?.message, response?.success ? "success" : "error");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      notify(t("Failed to update invoice."), "error");
    }
  };

  useEffect(() => {
    BindEMRInvItemTable();
  }, []);

  useEffect(() => {
    renderApiCalls();
    handleDRDetailsGetDRDetails(data);
  }, [data]);

  const THEAD = [
    t("Drug Name"),
    t("Dose"),
    t("How Often"),
    t("Duration"),
    t("Route"),
    // "Time of Next Dose",
    t("Meal"),
    t("Remarks"),
    // "Edit",
    { name: t("Remove"), width: "1%" },
  ];

  const initialValues = {
    MedicationDischargeInstructions: {
      Type: "",
      MedicineName: "",
      Route: "",
      TimeOfNextDose: "",
      Dose: "",
      Times: "",
      Duration: "",
      Meal: "",
      Remark: "",
      isEdit: true,
    },
  };

  const ip = useLocalStorage("ip", "get");
  const [dropDownState, setDropDownState] = useState({
    bindReportHeader: [],
    BindDoctorDept: [],
    BindConsultant: [],
    BindRoute: [],
    BindTimeofNextDose: [],
    BindMeal: [],
    BindTime: [],
    BindEMRMedicineList: [],
  });

  const [state, setState] = useState({
    reportHeader: {},
  });

  // A Final Diagnosis was just added: the Discharge Report part fills the header boxes with the
  // templates saved under that diagnosis (version changes on every add, so a repeat re-runs it).
  const [diagnosisTemplateBind, setDiagnosisTemplateBind] = useState({
    icdId: null,
    version: 0,
  });

  const [pageTableData, setPageTableData] = useState({
    MedicationDischargeInstructions: [
      { ...initialValues?.MedicationDischargeInstructions },
    ],
    PatientDiagnosisInformation: [],
  });

  const [TableDataList, setDataList] = useState([]);
  const { transactionID } = data;
  const [selectedAIHeader, setSelectedAIHeader] = useState("");

  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAISummaryLoading, setIsAISummaryLoading] = useState(false);
  const [aiSummaryHtml, setAiSummaryHtml] = useState("");
  const [aiSummaryRaw, setAiSummaryRaw] = useState("");
  const [aiSummaryError, setAiSummaryError] = useState("");
  const [aiBoundSummary, setAiBoundSummary] = useState({
    html: "",
    version: 0,
  });

  const [clinicalRecordOpen, setClinicalRecordOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  // Adds HTML below what is already in the summary editor (see DischargeReport, aiBoundSummary.append).
  const appendToSummary = (html) => {
    if (!html) return;
    setAiBoundSummary({ html, version: Date.now(), append: true });
    notify(t("Added to the discharge summary editor. Review it, then click Add Details."), "success");
  };

  const isDischargeApproved = Boolean(
    Number(state?.reportHeader?.isDisChargeSummaryApproved),
  );

  const escapeHtml = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const parseGeminiJSON = (rawText = "") => {
    const cleaned = String(rawText)
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

    return JSON.parse(cleaned);
  };

  const normalizeText = (value = "") =>
    String(value || "")
      .replace(/^[#*\-\s]+/gm, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeTextArray = (items = []) =>
    (Array.isArray(items) ? items : [])
      .map((item) => normalizeText(item))
      .filter(Boolean);

  const getPlainTextFromHtml = (html = "") => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.innerText || tempDiv.textContent || "";
  };

  const buildCardSection = (title, body) => `
    <div style="background:#f8fafc;border:1px solid #dbe4f0;border-radius:16px;padding:16px;margin-bottom:16px;overflow:scroll">
      <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:10px;">${escapeHtml(
        title,
      )}</div>
      ${body}
    </div>
  `;

  const buildNumberedParagraphs = (
    items = [],
    emptyText = "Not available.",
  ) => {
    const safeItems = normalizeTextArray(items);

    if (!safeItems.length) {
      return `<p style="margin:0;color:#475467;line-height:1.8;">${escapeHtml(
        emptyText,
      )}</p>`;
    }

    return safeItems
      .map(
        (item, index) => `
          <p style="margin:0 0 8px 0;color:#1f2937;line-height:1.8;">
            <strong style="color:#0f766e;">${index + 1}.</strong> ${escapeHtml(
              item,
            )}
          </p>
        `,
      )
      .join("");
  };

  const buildDischargeSummaryHtml = (summary = {}) => {
    const fallbackDiagnosis = (pageTableData?.PatientDiagnosisInformation || [])
      .map((item) => item?.WHO_Full_Desc || item?.ICD10_Code)
      .filter(Boolean);

    const fallbackMedications = (dropDownState?.BindEMRMedicineList || []).map(
      (item) => ({
        name: item?.Medicine || "",
        dose: item?.Dose || "",
        frequency: item?.time || "",
        duration: item?.days || "",
        route: item?.Route || "",
        meal: item?.Meal || "",
        remarks: item?.Reason || "",
      }),
    );

    const diagnosisList = normalizeTextArray(summary?.finalDiagnosis).length
      ? normalizeTextArray(summary?.finalDiagnosis)
      : fallbackDiagnosis;

    const keyInvestigations = normalizeTextArray(summary?.keyInvestigations);
    const hospitalEvents = normalizeTextArray(summary?.hospitalEvents);
    const followUpList = normalizeTextArray(summary?.followUpInstructions);
    const warningSignsList = normalizeTextArray(summary?.warningSigns);

    const medications =
      Array.isArray(summary?.dischargeMedications) &&
      summary?.dischargeMedications?.length
        ? summary?.dischargeMedications
        : fallbackMedications;

    const medicationRows =
      medications?.length > 0
        ? medications
            .map(
              (item, index) => `
                <tr>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${index + 1}</td>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${escapeHtml(
                    item?.name || item?.MedicineName || "",
                  )}</td>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${escapeHtml(
                    item?.dose || item?.Dose || "",
                  )}</td>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${escapeHtml(
                    item?.frequency || item?.Times || item?.time || "",
                  )}</td>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${escapeHtml(
                    item?.duration || item?.Duration || item?.days || "",
                  )}</td>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${escapeHtml(
                    item?.route || item?.Route || "",
                  )}</td>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${escapeHtml(
                    item?.meal || item?.Meal || "",
                  )}</td>
                  <td style="padding:10px;border:1px solid #dbe4f0;color:#1f2937;">${escapeHtml(
                    item?.remarks || item?.Remark || item?.Reason || "",
                  )}</td>
                </tr>
              `,
            )
            .join("")
        : `
          <tr>
            <td colspan="8" style="padding:12px;border:1px solid #dbe4f0;text-align:center;color:#667085;">
              No discharge medications available.
            </td>
          </tr>
        `;

    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;color:#1f2937;">
        <div style="background:linear-gradient(135deg,#0f766e,#1d4ed8);border-radius:18px;padding:18px 20px;margin-bottom:18px;color:#ffffff;">
          <div style="font-size:22px;font-weight:800;margin-bottom:6px;">Discharge Summary</div>
          <div style="font-size:13px;opacity:0.95;">AI-generated professional discharge summary based on clinical notes and discharge records.</div>
        </div>

        ${buildCardSection(
          "Clinical Overview",
          `<p style="margin:0;color:#1f2937;line-height:1.8;">${escapeHtml(
            summary?.clinicalOverview || "Clinical overview is not available.",
          )}</p>`,
        )}

        ${buildCardSection(
          "Final Diagnosis",
          buildNumberedParagraphs(
            diagnosisList,
            "Diagnosis details are not available.",
          ),
        )}

        ${buildCardSection(
          "Hospital Course",
          `<p style="margin:0;color:#1f2937;line-height:1.8;">${escapeHtml(
            summary?.hospitalCourse ||
              "Hospital course details are not available.",
          )}</p>`,
        )}

        ${buildCardSection(
          "Important Clinical Events",
          buildNumberedParagraphs(
            hospitalEvents,
            "Important clinical events are not available.",
          ),
        )}

        ${buildCardSection(
          "Key Investigations",
          buildNumberedParagraphs(
            keyInvestigations,
            "Relevant investigation details are not available.",
          ),
        )}

        ${buildCardSection(
          "Condition At Discharge",
          `<p style="margin:0;color:#1f2937;line-height:1.8;">${escapeHtml(
            summary?.conditionAtDischarge ||
              "Condition at discharge is not available.",
          )}</p>`,
        )}

        ${buildCardSection(
          "Discharge Medications",
          `
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#e0f2fe;">
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">S.No</th>
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">Medicine</th>
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">Dose</th>
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">Frequency</th>
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">Duration</th>
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">Route</th>
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">Meal</th>
                  <th style="padding:10px;border:1px solid #dbe4f0;text-align:left;">Remarks</th>
                </tr>
              </thead>
              <tbody>${medicationRows}</tbody>
            </table>
          `,
        )}

        ${buildCardSection(
          "Follow Up Instructions",
          buildNumberedParagraphs(
            followUpList,
            "Follow up instructions are not available.",
          ),
        )}

        ${buildCardSection(
          "Warning Signs",
          buildNumberedParagraphs(
            warningSignsList,
            "No warning signs were provided.",
          ),
        )}
      </div>
    `;
  };

  const handleGenerateAISummary = useCallback(
    async (header) => {
      setIsAISummaryLoading(true);
      setAiSummaryError("");

      try {
        let notesForAI = noteFinderSummaryData;

        if (!notesForAI?.length) {
          notesForAI = await getNoteFiderDetails();
        }

        const detailEntries = await DRDetailsBindDetails(transactionID);
        const formattedDetails = (detailEntries?.data || []).map((item) => ({
          header: item?.HeaderName,
          value: getPlainTextFromHtml(item?.Value || ""),
        }));

        const aiPayload = {
          selectedHeader: header || selectedAIHeader || "",
          dischargeDetailEntries: formattedDetails,
          dischargeType:
            state?.reportHeader?.header || state?.reportHeader?.label || "",
          notes: notesForAI.map((item) => ({
            Dates: item?.Dates || "",
            Detail: item?.Detail || "",
            RoleName: item?.RoleName || "",
            NoteType: item?.NoteType || "",
          })),
          diagnosis: (pageTableData?.PatientDiagnosisInformation || []).map(
            (item) => ({
              icdCode: item?.ICD10_Code,
              diagnosis: item?.WHO_Full_Desc,
            }),
          ),
          medications: (dropDownState?.BindEMRMedicineList || []).map(
            (item) => ({
              name: item?.Medicine,
              dose: item?.Dose,
              frequency: item?.time,
              duration: item?.days,
              route: item?.Route,
              meal: item?.Meal,
              remarks: item?.Reason,
            }),
          ),
          numericInvestigations: (investigationTableNumeric || []).map(
            (item) => ({
              department: item?.Department,
              investigation: item?.Name,
              date: item?.Date,
              remarks: item?.Remarks,
              includeInSummary: item?.IsEnter === 1,
            }),
          ),
          textInvestigations: (investigationTableText || []).map((item) => ({
            department: item?.Department,
            investigation: item?.Name,
            date: item?.Date,
            remarks: item?.Remarks,
            includeInSummary: item?.IsEnter === 1,
          })),
        };

        const prompt = aiPayload.selectedHeader
          ? `
You are an expert hospital discharge summary writer.

Based on the provided clinical context (notes, diagnosis, medications, and existing detail entries), generate professional medical content for the specific section: "${aiPayload.selectedHeader}".

Return ONLY valid JSON in this exact format:
{
  "sectionContent": ""
}

Rules:
- Generate content specifically relevant to "${aiPayload.selectedHeader}".
- Use professional, clinical language.
- Do not include patient identifiers.
- If the section is "History", summarize relevant past and present illness from notes.
- If the section is "Plan", provide a clear medical plan.
- Return content as a single string (HTML allowed for basic formatting like <br/>).

Input JSON:
${JSON.stringify(aiPayload)}
`
          : `
You are an expert hospital discharge summary writer.

Create a professional discharge summary mainly from the clinical notes provided in "notes".
Each note contains only these fields:
- Dates
- Detail
- RoleName
- NoteType

Return ONLY valid JSON in this exact format:
{
  "clinicalOverview": "",
  "finalDiagnosis": [""],
  "hospitalCourse": "",
  "hospitalEvents": [""],
  "keyInvestigations": [""],
  "conditionAtDischarge": "",
  "dischargeMedications": [
    {
      "name": "",
      "dose": "",
      "frequency": "",
      "duration": "",
      "route": "",
      "meal": "",
      "remarks": ""
    }
  ],
  "followUpInstructions": [""],
  "warningSigns": [""]
}

Important rules:
- Do not return markdown
- Do not return code fences
- Do not use #, *, or - formatting
- Keep tone professional and clinical
- Use the notes as the primary source for hospital course
- Do not include patient name
- Do not include UHID
- Do not include age or gender
- Do not include consultant
- Do not include ward or room details
- Do not invent unsupported facts
- If any value is missing, return empty string or empty array
- Prefer the given discharge medications exactly as provided when available

Input JSON:
${JSON.stringify(aiPayload)}
      `;

        const resp = await getAIResponseAPI({
          feature: "dischargeSummary",
          prompt,
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        });

        if (!resp?.success) {
          throw new Error("Gemini request failed");
        }

        const rawText = resp?.data;
        if (!rawText) {
          throw new Error("Empty response received from Gemini");
        }

        const parsedSummary = parseGeminiJSON(rawText);
        const rawContent =
          header || selectedAIHeader
            ? parsedSummary.sectionContent
            : buildDischargeSummaryHtml(parsedSummary);

        const visualHtml =
          header || selectedAIHeader
            ? `<div style="font-family:'Segoe UI',Arial,sans-serif;padding:18px;">
             <div style="background:linear-gradient(135deg,#0f766e,#1d4ed8);border-radius:12px;padding:12px 15px;margin-bottom:15px;color:#ffffff;">
               <div style="font-size:18px;font-weight:700;">${escapeHtml(header || selectedAIHeader)} Assistance</div>
             </div>
             <div style="color:#1f2937;line-height:1.8;">${parsedSummary.sectionContent}</div>
           </div>`
            : buildDischargeSummaryHtml(parsedSummary);

        setAiSummaryRaw(rawContent);
        setAiSummaryHtml(visualHtml);
        notify(t("AI summary generated successfully."), "success");
      } catch (error) {
        console.error("AI discharge summary error:", error);
        setAiSummaryError(
          error?.message || "Unable to generate discharge summary.",
        );
        notify(
          error?.message || "Unable to generate discharge summary.",
          "error",
        );
      } finally {
        setIsAISummaryLoading(false);
      }
    },
    [
      GEMINI_MODEL,
      noteFinderSummaryData,
      getNoteFiderDetails,
      state?.reportHeader?.header,
      state?.reportHeader?.label,
      pageTableData?.PatientDiagnosisInformation,
      dropDownState?.BindEMRMedicineList,
      investigationTableNumeric,
      investigationTableText,
      selectedAIHeader,
    ],
  );

  const handleOpenAIChat = async (header) => {
    debugger;
    if (!header) {
      notify(t("Please select Discharge Detail Entries"), "error");
      return;
    }
    if (isDischargeApproved) {
      notify(t("summary is already approved, editing is disabled."), "info");
      return;
    }

    // If chat is open with different header, or closed and opening with new header
    if (header !== selectedAIHeader) {
      setSelectedAIHeader(header);
      setAiSummaryHtml("");
      setIsAIChatOpen(true);
      await handleGenerateAISummary(header);
      return;
    }

    const nextOpen = !isAIChatOpen;
    setIsAIChatOpen(nextOpen);

    if (nextOpen && !aiSummaryHtml && !isAISummaryLoading) {
      await handleGenerateAISummary(header);
    }
  };

  const handleCopyAISummary = async () => {
    if (!aiSummaryHtml) {
      notify(t("No AI discharge summary available to copy."), "warn");
      return;
    }

    try {
      await navigator.clipboard.writeText(getPlainTextFromHtml(aiSummaryHtml));
      notify(t("AI discharge summary copied successfully."), "success");
    } catch (error) {
      notify(t("Unable to copy discharge summary."), "error");
    }
  };

  const handleBindAISummary = () => {
    if (!aiSummaryRaw) {
      notify(t("No AI summary available to bind."), "warn");
      return;
    }

    setAiBoundSummary({
      html: aiSummaryRaw,
      version: Date.now(),
    });

    notify(t("AI summary bound to editor successfully."), "success");
  };

  // const [pageTableData, setPageTableData] = useState({
  //   MedicationDischargeInstructions: [
  //     { ...initialValues?.MedicationDischargeInstructions },
  //   ],
  //   PatientDiagnosisInformation: [],
  // });
  // const [TableDataList, setDataList] = useState([]);
  // const { transactionID } = data;

  const renderApiCalls = async () => {
    store.dispatch(setLoading(true));
    try {
      const [
        bindReportHeader,
        BindDoctorDept,
        BindConsultant,
        BindRoute,
        BindTimeofNextDose,
        BindMeal,
        BindTime,
        BindEMRMedicineList,
      ] = await Promise.all([
        await DischargeSummaryBindReportHeader(),
        await GetBindDoctorDept("ALL"),
        await DischargeSummaryBindConsultant(transactionID),
        await DischargeSummaryBindRoute(),
        await DischargeSummaryBindTimeofNextDose(),
        await DischargeSummaryBindMeal(),
        await DischargeSummaryBindTime(),
        await BindEMRMedicine(parseInt(transactionID)),
      ]);

      const reponseData = {
        bindReportHeader: reactSelectOptionList(
          bindReportHeader?.data,
          "Headername",
          "Headername",
        ),
        BindDoctorDept: reactSelectOptionList(
          BindDoctorDept?.data,
          "Name",
          "DoctorID",
        ),
        BindConsultant: BindConsultant?.data,
        BindRoute: reactSelectOptionList(
          BindRoute?.data,
          "Routename",
          "Routename",
        ),
        BindTimeofNextDose: reactSelectOptionList(
          BindTimeofNextDose?.data,
          "NextDosename",
          "NextDoseid",
        ),
        BindMeal: reactSelectOptionList(BindMeal?.data, "Mealname", "Mealname"),
        BindTime: reactSelectOptionList(BindTime?.data, "NAME", "NAME"),
        BindEMRMedicineList: BindEMRMedicineList?.data,
      };

      setDropDownState(reponseData);
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  const handleDischargeSummaryConsultantAddPayload = (e) => {
    return {
      doctorID: String(e?.value),
      tid: String(transactionID),
      isMainDoctor: 0,
      doctorName: String(e?.label),
    };
  };

  const handlehandleDischargeSummaryDRHeaderPayload = (e) => {
    return {
      e,
      payload: {
        header: String(e?.label),
        tid: String(transactionID),
        ipAddress: String(ip),
      },
    };
  };

  const handleDischargeSummaryDeleteConsultant = async (items) => {
    try {
      const response = await DischargeSummaryDeleteConsultant({
        tid: String(transactionID),
        doctorID: String(items?.doctorID),
        master: 0,
      });
      notify(response?.message, response?.success ? "success" : "error");
      const BindConsultant =
        await DischargeSummaryBindConsultant(transactionID);
      setDropDownState({
        ...dropDownState,
        BindConsultant: BindConsultant?.data,
      });
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleDischargeSummaryConsultantAdd = async (payload) => {
    try {
      const response = await DischargeSummaryConsultantAdd(payload);
      const BindConsultant =
        await DischargeSummaryBindConsultant(transactionID);
      setDropDownState({
        ...dropDownState,
        BindConsultant: BindConsultant?.data,
      });
      return response;
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleDRDetailsGetDRDetails = async (data) => {
    // debugger
    try {
      const responsePayload = {
        transactionID: Number(data?.transactionID),
        patientId: String(data?.patientID),
        sex: String(data?.gender),
        isIPDData: 1,
        admissionType: "",
        status: String(data?.status),
      };

      const response = await DRDetailsGetDRDetails(responsePayload);
      const responseSet = {
        ...response?.data,
        label: response?.data?.header,
        value: response?.data?.header,
      };
      setState({ ...state, reportHeader: responseSet });
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleDischargeSummaryDRHeader = async (payload) => {
    try {
      const response = await DischargeSummaryDRHeader(payload.payload);
      if (response?.success) {
        const responseSet = {
          ...response?.data,
          label: payload?.e.label,
          value: payload?.e.value,
        };
        setState({ ...state, reportHeader: responseSet });
        notify(response?.message, "success");
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something went Wrong");
    }
  };

  const handleReactChange = async (
    name,
    e,
    apiCall,
    payloadFunction,
    settlerFuction,
  ) => {
    // A list with more than 500 rows (the doctor list) renders as a search box that calls this
    // on every keystroke with the typed text (a string); only a picked option (an object with
    // a value) is a selection, otherwise the API got doctorID "undefined" and MySQL threw.
    if (
      !e ||
      typeof e !== "object" ||
      e?.value === undefined ||
      e?.value === null ||
      e?.value === ""
    ) {
      return;
    }
    try {
      const response = await apiCall(payloadFunction(e));
      // setState({ ...state, [name]: e });
      if (settlerFuction) settlerFuction;
      notify(response?.message, response?.success ? "success" : "error");
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleCustomSelectChange = (name, e, index) => {
    const data = [...pageTableData?.MedicationDischargeInstructions];
    data[index][name] = e?.value;

    setPageTableData({
      ...pageTableData,
      MedicationDischargeInstructions: data,
    });
  };

  const handleRowTable = (e, index) => {
    const { name, value } = e.target;

    // Instead of cloning the entire array, just clone the changed row
    const updatedRow = {
      ...pageTableData.MedicationDischargeInstructions[index],
      [name]: value,
    };

    // Update only the specific row in the state
    const updatedData = [...pageTableData.MedicationDischargeInstructions];
    updatedData[index] = updatedRow;

    setPageTableData((prevData) => ({
      ...prevData,
      MedicationDischargeInstructions: updatedData,
    }));
  };

  const handleSaveMedicationDischargeInstructions = async (
    MedicationDischargeInstructionspayload,
  ) => {
    debugger;
    const requiredFields = [
      "MedicineName",
      // "Dose",
      // "TimeOfNextDose",
      // "Duration",
    ];
    for (const field of requiredFields) {
      if (
        !MedicationDischargeInstructionspayload[field] ||
        MedicationDischargeInstructionspayload[field].trim() === ""
      ) {
        return notify(`The field "${field}" is required.`, "error");
      }
      /* if (
        field === "TimeOfNextDose" &&
        (!MedicationDischargeInstructionspayload[field] ||
          isNaN(MedicationDischargeInstructionspayload[field]) ||
          parseInt(MedicationDischargeInstructionspayload[field], 10) <= 0)
      )  */
      // {
      //   return notify(
      //     // `The field "${field}" must be a valid positive number.`,
      //     "error"
      //   );
      //   return null; // Stop further processing
      // }
      /* else if (
        field !== "TimeOfNextDose" &&
        (!MedicationDischargeInstructionspayload[field] ||
          MedicationDischargeInstructionspayload[field].trim() === "")
      ) {
        return notify(`The field "${field}" is required.`, "error");
        // return null; // Stop further processing
      } */
    }
    try {
      const apiPayload = DischargeSummaryEMRMedicinePayload(
        MedicationDischargeInstructionspayload,
        transactionID,
      );
      const response = await DischargeSummaryEMRMedicine(apiPayload);
      if (response.success) {
        const newResponse = await BindEMRMedicine(parseInt(transactionID));
        if (newResponse.success) {
          setDropDownState((prevState) => ({
            ...prevState,
            BindEMRMedicineList: newResponse.data,
          }));
          setPageTableData({
            MedicationDischargeInstructions: [
              { ...initialValues?.MedicationDischargeInstructions },
            ],
          });
        }
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const settlerMedicationDischargeInstructions = (item, index) => {
    const returnData = {
      Type: "",
      MedicineName: "",
      Route: "",
      TimeOfNextDose: "",
      Dose: "",
      Times: "",
      Duration: "",
      Meal: "",
      Remark: "",
      Action: "",
    };

    // type
    // const requiredFields = ["MedicineName", "Dose", "TimeOfNextDose", "Duration"];
    // for (const field of requiredFields) {
    //   if (!item[field] || item[field].trim() === "") {
    //     debugger;
    //     return notify(`The field "${field}" is required.`,"error");
    //   }
    // }

    returnData.Type = item?.isEdit ? (
      <CustomSelect
        option={translateOptions(DISCHARGESUMMARY_TYPE, t)}
        placeHolder={"Select"}
        name="Type"
        value={item?.Type}
        onChange={(name, e) => handleCustomSelectChange(name, e, index)}
      />
    ) : (
      item?.Type
    );
    // medicine

    returnData.MedicineName = item?.isEdit ? (
      <Input
        type="text"
        className="table-input required-fields"
        removeFormGroupClass={true}
        key={`medicine-${index}`}
        name="MedicineName"
        value={item?.MedicineName ? item?.MedicineName : ""}
        onChange={(e) => handleRowTable(e, index)}
      />
    ) : (
      item?.MedicineName
    );

    // Route

    returnData.Route = item?.isEdit ? (
      <CustomSelect
        option={dropDownState?.BindRoute}
        placeHolder={"Select"}
        name="Route"
        value={item?.Route}
        onChange={(name, e) => handleCustomSelectChange(name, e, index)}
      />
    ) : (
      item?.Route
    );

    // TimeOfNextDose

    /* returnData.TimeOfNextDose = item?.isEdit ? (
      <CustomSelect
        className="required-fields"
        requiredClassName="required-fields"
        option={dropDownState?.BindTimeofNextDose}
        placeHolder={"Select"}
        name="TimeOfNextDose"
        value={item?.TimeOfNextDose}
        onChange={(name, e) => handleCustomSelectChange(name, e, index)}
      />
    ) : (
      item?.TimeOfNextDose
    );
 */
    // Dose

    returnData.Dose = item?.isEdit ? (
      <Input
        type="text"
        className="table-input"
        removeFormGroupClass={true}
        key={`Dose-${index}`}
        name="Dose"
        value={item?.Dose ? item?.Dose : ""}
        onChange={(e) => handleRowTable(e, index)}
      />
    ) : (
      item?.Dose
    );

    // Times

    returnData.Times = item?.isEdit ? (
      <CustomSelect
        option={dropDownState?.BindTime}
        placeHolder={"Select"}
        name="Times"
        value={item?.Times}
        onChange={(name, e) => handleCustomSelectChange(name, e, index)}
      />
    ) : (
      item?.Times
    );

    // Duration

    returnData.Duration = item?.isEdit ? (
      <Input
        type="text"
        className="table-input"
        removeFormGroupClass={true}
        key={`Duration-${index}`}
        name="Duration"
        value={item?.Duration ? item?.Duration : ""}
        onChange={(e) => handleRowTable(e, index)}
      />
    ) : (
      item?.Duration
    );

    // Meal

    returnData.Meal = item?.isEdit ? (
      <CustomSelect
        option={dropDownState?.BindMeal}
        placeHolder={"Select"}
        name="Meal"
        value={item?.Meal}
        onChange={(name, e) => handleCustomSelectChange(name, e, index)}
      />
    ) : (
      item?.Meal
    );

    // Remarks

    returnData.Remark = item?.isEdit ? (
      <Input
        type="text"
        className="table-input"
        removeFormGroupClass={true}
        name="Remark"
        key={`Remark-${index}`}
        value={item?.Remark ? item?.Remark : ""}
        onChange={(e) => handleRowTable(e, index)}
      />
    ) : (
      item?.Remark
    );

    // Action

    returnData.Action = item?.isEdit ? (
      <button
        className="btn btn-sm btn-primary"
        onClick={() => handleSaveMedicationDischargeInstructions(item)}
      >
        {t("Add")}
      </button>
    ) : (
      ""
    );

    return returnData;
  };

  const handleTbody = (tableData) => {
    return tableData?.map((items, index) => {
      const {
        Type,
        MedicineName,
        Dose,
        Times,
        Duration,
        Route,
        Meal,
        // TimeOfNextDose,
        Remark,
        Action,
      } = settlerMedicationDischargeInstructions(items, index);
      return {
        Type,
        MedicineName,
        Dose,
        Times,
        Duration,
        Route,
        // TimeOfNextDose,
        Meal,
        Remark,
        Action,
      };
    });
  };

  const handleItemRemove = async (item) => {
    // setDropDownState((prevState) => ({
    //   ...prevState,
    //   BindEMRMedicineList: prevState.BindEMRMedicineList.filter((item) => item.ID !== id),
    // }));
    const payload = {
      medicineName: item.Medicine,
      Id: item.ID,
      TID: transactionID,
    };
    try {
      const response = await DeleteEMRMedicine(payload);
      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        const newResponse = await BindEMRMedicine(parseInt(transactionID));
        if (newResponse.success) {
          setDropDownState((prevState) => ({
            ...prevState,
            BindEMRMedicineList: newResponse.data,
          }));
        }
      }
    } catch (error) {
      // console.log("Error updating invoice:", error);
      notify(t("Failed to update invoice."), "error");
    }
  };

  // console.log(checkboxState,"checkboxState")

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("Discharge Details Entries")} isBreadcrumb={false} />

        <PageDisableOverlay
          isDisable={Boolean(
            Number(state?.reportHeader?.isDisChargeSummaryApproved),
          )}
        >
          <div className="row p-2">
            <div className="col-md-5">
              <CustomizeAutoCompelete label={t("DischargeType")} flex={true}>
                <ReactSelect
                  respclass={""}
                  lable={""}
                  name={"reportHeader"}
                  dynamicOptions={dropDownState?.bindReportHeader}
                  placeholderName={""}
                  handleChange={(name, e) =>
                    handleReactChange(
                      name,
                      e,
                      handleDischargeSummaryDRHeader,
                      handlehandleDischargeSummaryDRHeaderPayload,
                      handleDRDetailsGetDRDetails(data),
                    )
                  }
                  value={state?.reportHeader?.value}
                />
              </CustomizeAutoCompelete>

              <CustomizeAutoCompelete
                label={t("AddConsultant")}
                tags={dropDownState?.BindConsultant}
                renderKeyName={"Name"}
                bgColor={"#f0f0ff"}
                handleRemove={handleDischargeSummaryDeleteConsultant}
                flex={true}
              >
                <div style={{ minWidth: "200px" }}>
                  <ReactSelect
                    respclass={""}
                    lable={""}
                    dynamicOptions={dropDownState?.BindDoctorDept}
                    placeholderName={""}
                    handleChange={(name, e) =>
                      handleReactChange(
                        name,
                        e,
                        handleDischargeSummaryConsultantAdd,
                        handleDischargeSummaryConsultantAddPayload,
                      )
                    }
                  />
                </div>
              </CustomizeAutoCompelete>
            </div>

            <div className="col-md-7">
              <CustomizeAutoCompelete label={t("PatientDiagnosisInformation")}>
                <PatientDiagnosisInformation
                  pageTableData={pageTableData}
                  setPageTableData={setPageTableData}
                  data={data}
                  onDiagnosisAdded={(icdId) =>
                    setDiagnosisTemplateBind((prev) => ({
                      icdId,
                      version: prev.version + 1,
                    }))
                  }
                />
              </CustomizeAutoCompelete>
            </div>

            <div className="col-12">
              <CustomizeAutoCompelete
                label={t("MedicationDischargeInstructions")}
              >
                <div className="col-10 p-0 px-1">
                  <DischageMedicineTable
                    tags={tags}
                    setTags={setTags}
                    type={"FromModal"}
                    transactionID={transactionID}
                    onSave={() => {
                      BindEMRMedicine(parseInt(transactionID)).then(
                        (newResponse) => {
                          if (newResponse.success) {
                            setDropDownState((prevState) => ({
                              ...prevState,
                              BindEMRMedicineList: newResponse.data,
                            }));
                          }
                        },
                      );
                    }}
                  />
                  {/* <Tables
                    thead={THEADMEDICATIONDISCHARGEINSTRUCTIONS}
                    tbody={handleTbody(
                      pageTableData?.MedicationDischargeInstructions,
                    )}
                  /> */}
                  {dropDownState.BindEMRMedicineList.length > 0 ? (
                    <Tables
                      thead={THEAD}
                      tbody={dropDownState.BindEMRMedicineList.map(
                        (item, index) => ({
                          "Drug Name": item?.Medicine || "-",
                          Dose: item?.Dose || "-",
                          "How Often": item?.time || "-",
                          Duration: item?.days || "-",
                          Route: item?.Route || "-",
                          // "Time of Next Dose": item?.Timefornxtdose || "-",
                          Meal: item?.Meal || "-",
                          Remarks: item?.Reason || "-",
                          Remove: (
                            <i
                              className="fa fa-trash text-danger text-center"
                              onClick={() => handleItemRemove(item)}
                            ></i>
                          ), // Add custom action
                        }),
                      )}
                    />
                  ) : (
                    <></>
                  )}
                </div>
              </CustomizeAutoCompelete>
            </div>

            <div className="col-12">
              <CustomizeAutoCompelete
              // label={t("DischargeReport")}
              >
                <DischargeReport
                  data={{ ...state, transactionID }}
                  handleDRDetailsGetDRDetails={() =>
                    handleDRDetailsGetDRDetails(data)
                  }
                  patientData={{ data }}
                  aiBoundSummary={aiBoundSummary}
                  handleOpenAIChat={handleOpenAIChat}
                  onOpenClinicalRecord={() => setClinicalRecordOpen(true)}
                  onOpenScan={() => setScanOpen(true)}
                  isDischargeApproved={isDischargeApproved}
                  diagnosisTemplateBind={diagnosisTemplateBind}
                />
              </CustomizeAutoCompelete>
            </div>
          </div>
        </PageDisableOverlay>

        <div className="card mt-2">
          <div>
            <Heading
              title={t("Investigation Details Numeric (IPD)")}
              isBreadcrumb={false}
            />

            <Tables
              thead={InvestigationHeadData}
              tbody={investigationTableNumeric.map((item, index) => ({
                Sno: index + 1,
                Department: item?.Department,
                Investigationname: item?.Name,
                date: item?.Date,
                remarks: (
                  <>
                    <Input
                      type="text"
                      className="table-input "
                      removeFormGroupClass={true}
                      key={`remark-${index}`}
                      name={`remark-${index}`}
                      value={item?.Remarks}
                      onChange={(e) => {
                        const updatedData = [...investigationTableNumeric];
                        updatedData[index] = {
                          ...updatedData[index],
                          Remarks: e.target.value,
                        };
                        setInvestigationTableNumeric(updatedData);
                      }}
                    />
                  </>
                ),
                checkbox: (
                  <>
                    <>
                      <Checkbox
                        key={index}
                        id={`checkbox-${index}`}
                        className="mt-2"
                        name={`checkbox-${index}`}
                        onChange={(e) => {
                          const updatedData =
                            investigationTableNumeric[index]?.IsEnter === 1
                              ? 0
                              : 1;
                          setInvestigationTableNumeric((prev) => {
                            const newData = [...prev];
                            newData[index] = {
                              ...newData[index],
                              IsEnter: updatedData,
                            };
                            return newData;
                          });
                        }}
                        checked={item?.IsEnter === 1 ? true : false}
                      />
                    </>
                  </>
                ),
              }))}
            />
          </div>
          <div className="mt-4">
            <Heading
              title={t("Investigation Details Text (IPD)")}
              isBreadcrumb={false}
            />

            <Tables
              thead={InvestigationHeadData}
              tbody={investigationTableText?.map((item, index) => ({
                Sno: index + 1,
                Department: item?.Department,
                Investigationname: item?.Name,
                date: item?.Date,
                remarks: (
                  <>
                    <Input
                      type="text"
                      className="table-input "
                      removeFormGroupClass={true}
                      key={`remark-${index}`}
                      name={`remark-${index}`}
                      value={item?.Remarks}
                      onChange={(e) => {
                        const updatedData = [...investigationTableText];
                        updatedData[index] = {
                          ...updatedData[index],
                          Remarks: e.target.value,
                        };
                        setInvestigationTableText(updatedData);
                      }}
                    />
                  </>
                ),
                checkbox: (
                  <>
                    <Checkbox
                      key={index}
                      id={`checkbox-${index}`}
                      className="mt-2"
                      name={`checkbox-${index}`}
                      onChange={() => {
                        const updatedData =
                          investigationTableText[index]?.IsEnter === 1 ? 0 : 1;
                        setInvestigationTableText((prev) => {
                          const newData = [...prev];
                          newData[index] = {
                            ...newData[index],
                            IsEnter: updatedData,
                          };
                          return newData;
                        });
                      }}
                      checked={item?.IsEnter === 1 ? true : false}
                    />
                  </>
                ),
              }))}
            />
          </div>
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-sm btn-success m-2"
              type="button"
              onClick={SaveEMRInvItem}
            >
              {t("Save")}
            </button>
          </div>
        </div>
      </div>

      <DischargeClinicalRecordModal
        visible={clinicalRecordOpen}
        onHide={() => setClinicalRecordOpen(false)}
        transactionID={transactionID}
        onBind={appendToSummary}
      />
      <DischargeScanModal visible={scanOpen} onHide={() => setScanOpen(false)} onBind={appendToSummary} />

      {isAIChatOpen && (
        <div
          style={{
            position: "fixed",
            right: "5px",
            bottom: "15px",
            width: "415px",
            maxWidth: "calc(100vw - 32px)",
            height: "72vh",
            background: "#ffffff",
            borderRadius: "22px",
            boxShadow: "0 22px 60px rgba(15, 23, 42, 0.22)",
            border: "1px solid #dbe4f0",
            zIndex: 999999999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 9px",
              background: "linear-gradient(135deg, #0f766e, #1d4ed8)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                {selectedAIHeader
                  ? `${selectedAIHeader} Assistant`
                  : t("AI Discharge Summary")}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.92 }}>
                {selectedAIHeader
                  ? `Professional content generated for ${selectedAIHeader}`
                  : t("Professional summary generated from current patient data")}
              </div>
            </div>

            <div className="d-flex align-items-center">
              <button
                type="button"
                onClick={() => handleGenerateAISummary(selectedAIHeader)}
                className="btn btn-md text-white mx-2"
              >
                <FaRotate />
              </button>

              <button
                type="button"
                onClick={() => setIsAIChatOpen(false)}
                className="btn btn-md btn-success"
              >
                <i className="fa fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              background:
                "linear-gradient(180deg, #f8fbff 0%, #f7fafc 55%, #ffffff 100%)",
            }}
          >
            {isAISummaryLoading ? (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #dbe4f0",
                  borderRadius: "18px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  {t("Generating discharge summary...")}
                </div>
                <div style={{ color: "#475467", lineHeight: 1.8 }}>
                  {t("Please wait while AI prepares the professional discharge summary.")}
                </div>
              </div>
            ) : aiSummaryHtml ? (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #dbe4f0",
                  borderRadius: "18px",
                  padding: "12px",
                }}
                dangerouslySetInnerHTML={{ __html: aiSummaryHtml }}
              />
            ) : (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #dbe4f0",
                  borderRadius: "18px",
                  padding: "18px",
                  color: "#475467",
                }}
              >
                {aiSummaryError || t("No AI discharge summary generated yet.")}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "14px 16px",
              borderTop: "1px solid #e5e7eb",
              background: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={handleCopyAISummary}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#0f172a",
                borderRadius: "12px",
                padding: "11px 14px",
                fontWeight: 600,
              }}
            >
              {t("Copy")}
            </button>

            <button
              type="button"
              onClick={handleBindAISummary}
              style={{
                flex: 1,
                border: "none",
                background: "linear-gradient(135deg, #0f766e, #2563eb)",
                color: "#ffffff",
                borderRadius: "12px",
                padding: "11px 14px",
                fontWeight: 700,
              }}
            >
              {t("Bind")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomizeAutoCompelete = ({
  children,
  label,
  tags,
  renderKeyName,
  bgColor,
  handleRemove,
  flex,
}) => {
  return (
    <div className="App py-1 mx-1">
      <div className="tag-input-container" style={{ position: "relative" }}>
        {label && (
          <label className={`col-sm-${flex ? 5 : 2} patientLabel m-0"`}>
            {label}
          </label>
        )}
        {tags &&
          tags?.map((items, i) => {
            return (
              <div className="tag " style={{ backgroundColor: bgColor }}>
                {items[renderKeyName]}
                <span
                  className="tag-close-icon"
                  onClick={() => handleRemove(items)}
                >
                  <i className="fa fa-times-circle" aria-hidden="true"></i>
                </span>
              </div>
            );
          })}
        {flex ? (
          <div style={{ flexGrow: 1 }} className="mx-1">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default DischargeSummary;
