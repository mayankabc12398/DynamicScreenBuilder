import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import Heading from "../../../components/UI/Heading";
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../components/formComponent/DatePicker";
import Modal from "../../../components/modalComponent/Modal";
import OldPatientSearch from "./OldPatientSearch";
import Checkbox from "../../../components/formComponent/Checkbox";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import { GetBindAllCenter } from "../../../networkServices/commonApi";
import {
  CentreWiseCacheByCenterID,
  GetPatientDocument,
  GetPatientPanelDocumentFile,
  GetPatientPanelDocumentVisitWise,
  GetPatientUploadDocument,
} from "../../../store/reducers/common/CommonExportFunction";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  GetPatientIPDAdmissions,
  PanelControlGetPatientData,
} from "../../../networkServices/opdserviceAPI";
import {
  DoctorPrescriptionPrintPDF,
  handleBindMultipleLabReport,
} from "../../../networkServices/DoctorApi";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { setLoading } from "../../../store/reducers/loadingSlice/loadingSlice";
import store from "../../../store/store";
import { APIBaseURL } from "../../../networkServices/axiosInstance";
import DateWiseDocument from "../../../components/commonComponents/DateWiseDocument";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  teal50: "#e8f7f4", teal100: "#c0ebe3", teal400: "#1aaa8c", teal600: "#0e7a65",
  blue50: "#eaf2fb", blue100: "#bcd8f4", blue400: "#3b8fd9", blue600: "#1e6cb5",
  amber50: "#fff8eb", amber100: "#fde8b3", amber400: "#f5a623", amber600: "#c47d0a",
  red50: "#fff0f0", red100: "#ffc7c7", red400: "#e84040", red600: "#b52020",
  green50: "#edfaf2", green100: "#b6edcc", green400: "#22c55e", green600: "#15803d",
  purple50: "#f3f0ff", purple100: "#d4c8fc", purple400: "#8b5cf6", purple600: "#6d28d9",
  gray50: "#f8f9fa", gray100: "#f1f3f5", gray200: "#e9ecef", gray300: "#dee2e6",
  gray400: "#ced4da", gray500: "#adb5bd", gray600: "#6c757d", gray700: "#495057",
  gray800: "#343a40", gray900: "#212529", bg: "#f4f6f9",
};

// ── Vital classification helpers ───────────────────────────────────────────────
const VS = {
  normal: { background: C.green50, color: C.green600 },
  warn: { background: C.amber50, color: C.amber600 },
  high: { background: C.red50, color: C.red600 },
  low: { background: C.blue50, color: C.blue600 },
};

const classifyBP = (v) => {
  if (!v || !String(v).includes("/")) return "normal";
  const s = parseInt(String(v));
  if (isNaN(s)) return "normal";
  if (s < 90) return "low";
  if (s <= 120) return "normal";
  if (s <= 139) return "warn";
  return "high";
};
const classifyPulse = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return "normal";
  if (n < 60) return "low";
  if (n < 100) return "normal";
  return "high";
};
const classifyTemp = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return "normal";
  if (n < 94) return "low";
  if (n < 97.5) return "warn";
  if (n <= 99.5) return "normal";
  return "high";
};
const classifyBMI = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return "normal";
  if (n < 18.5) return "low";
  if (n < 25) return "normal";
  if (n < 32) return "warn";
  return "high";
};

// ── Chip / Badge components ────────────────────────────────────────────────────
const CHIP_BASE = {
  display: "inline-block", padding: "2px 7px", borderRadius: "4px",
  fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: "500",
};

const VChip = ({ value, classify }) => {
  if (!value && value !== 0) return <span style={{ color: C.gray400 }}>—</span>;
  const t = classify(String(value));
  return <span style={{ ...CHIP_BASE, ...VS[t] }}>{value}</span>;
};

const TypeBadge = ({ pType }) => {
  const ipd = pType === "IPD";
  return (
    <span style={{
      background: ipd ? C.purple50 : C.blue50,
      color: ipd ? C.purple600 : C.blue600,
      padding: "2px 8px", borderRadius: "4px",
      fontSize: "11px", fontWeight: "600",
    }}>
      {pType || "—"}
    </span>
  );
};

const DEPT_COLORS = {
  BIOCHEMISTRY: { bg: C.blue50, c: C.blue600 },
  XRAY: { bg: C.purple50, c: C.purple600 },
  USG: { bg: C.teal50, c: C.teal600 },
  MRI: { bg: C.amber50, c: C.amber600 },
  CT: { bg: C.red50, c: C.red600 },
};
const DeptBadge = ({ dept }) => {
  const s = DEPT_COLORS[(dept || "").toUpperCase()] || { bg: C.gray100, c: C.gray600 };
  return (
    <span style={{
      background: s.bg, color: s.c,
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "11px", fontWeight: "500",
    }}>
      {dept || "—"}
    </span>
  );
};

const Barcode = ({ value }) => (
  <span style={{ ...CHIP_BASE, background: C.blue50, color: C.blue600 }}>
    {value || "—"}
  </span>
);

const ViewBtn = ({ onClick }) => { const [t] = useTranslation(); return ( (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: C.teal50, color: C.teal600,
      border: `1px solid ${C.teal100}`,
      padding: "4px 10px", borderRadius: "6px",
      fontSize: "11px", fontWeight: "600", cursor: "pointer",
    }}
  >
    <i className="fas fa-eye" /> {t("View")}
  </button>
)); };

// ── Layout sub-components ──────────────────────────────────────────────────────
const SectionHeader = ({ color, title, count }) => { const [t] = useTranslation(); return ( (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
    <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: color, flexShrink: 0 }} />
    <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>{title}</span>
    {count != null && (
      <span style={{
        fontSize: "11px", color: C.gray500,
        background: C.gray100, padding: "2px 8px",
        borderRadius: "10px", fontWeight: "500",
      }}>
        {count} {count === 1 ? t("record") : t("records")}
      </span>
    )}
  </div>
)); };

const EmptyState = ({ icon = "fas fa-folder-open", title = "No data found", sub = "" }) => (
  <div style={{
    background: "#fff", borderRadius: "18px",
    border: `1.5px dashed ${C.gray300}`,
    padding: "28px 20px", textAlign: "center",
  }}>
    <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.4, color: C.gray500 }}>
      <i className={icon} />
    </div>
    <div style={{ fontWeight: "500", color: C.gray500 }}>{title}</div>
    {sub && <div style={{ fontSize: "12px", marginTop: "4px", color: C.gray400 }}>{sub}</div>}
  </div>
);

const TableWrap = ({ children }) => (
  <div style={{
    background: "#fff", borderRadius: "18px",
    overflow: "hidden", overflowX: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: `1px solid ${C.gray200}`,
  }}>
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
      {children}
    </table>
  </div>
);

const TH = ({ children }) => (
  <th style={{
    background: C.gray50, fontSize: "10px", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: "0.7px", color: C.gray500,
    padding: "10px 14px", textAlign: "left",
    borderBottom: `1px solid ${C.gray200}`, whiteSpace: "nowrap",
  }}>
    {children}
  </th>
);

const TD = ({ children, style = {} }) => (
  <td style={{
    padding: "10px 14px", fontSize: "13px", color: C.gray700,
    borderBottom: `1px solid ${C.gray100}`, ...style,
  }}>
    {children}
  </td>
);

const getInitials = (name = "") => {
  const cleaned = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|master)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "P";
};

const Sparkline = ({ values, color = C.teal400, width = 80, height = 28 }) => {
  const nums = (values || []).map((v) => parseFloat(v)).filter((v) => !isNaN(v));
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const rng = max - min || 1;
  const pts = nums
    .map((v, i) => `${(i / (nums.length - 1)) * width},${height - ((v - min) / rng) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};



// ── Main component ─────────────────────────────────────────────────────────────
function PatientEncounterHistory({
  patientId: propPatientId,
  embeddedUHID: propEmbeddedUHID,
  // true when opened from an IPD screen (Patient Admission / IPD card)
  isIPD = false,
} = {}) {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const ip = useLocalStorage("ip", "get");
  const [searchParams] = useSearchParams();

  // UHID passed in when this screen is embedded/opened from another screen. Callers
  // use both prop names — `patientId` from the IPD/consultation card views,
  // `embeddedUHID` from the Single Window's Patient History button.
  const embeddedUHID =
    propEmbeddedUHID || propPatientId || searchParams.get("patientId") || "";

  const initialData = {
    fromDate: new Date(),
    toDate: new Date(),
    CenterName: { value: "All", name: "All" },
    UHID: embeddedUHID || "",
    chkDate: false,
  };

  const [values, setValues] = useState(initialData);
  const [handleModelData, setHandleModelData] = useState({});
  const [registrationList, setRegistrationList] = useState([]);
  // full lists from the API; the screen shows them filtered by the OPD / IPD tab
  const [vitalListAll, setVitalList] = useState([]);
  const [labListAll, setLabList] = useState([]);
  const [radiologyListAll, setRadiologyList] = useState([]);
  const [dischargeListAll, setDischargeList] = useState([]);
  const [opdListAll, setOpdDataList] = useState([]);
  const [activeTab, setActiveTab] = useState("OPD");
  const [opdVisits, setOpdVisits] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAllConsultations, setShowAllConsultations] = useState(false);
  const { CentreWiseCache, GetGlobalResources } = useSelector(
    (state) => state.CommonSlice,
  );
  const dispatch = useDispatch();
  const [modalData, setModalData] = useState({});
  // Patient documents (uploaded on DirectPatientReg). Each item:
  // { name, id, uploaded:boolean, image:base64 }
  const [docList, setDocList] = useState([]);
  const [docPreview, setDocPreview] = useState(null);

  const globalResourcesList = Array.isArray(GetGlobalResources)
    ? GetGlobalResources
    : GetGlobalResources?.data || [];

  /* Panel documents scanned in the "Panel Document" popup (Add/Remove Panels List ->
     Upload) are stored against the visit they were uploaded in. With this key on, the
     screen shows them as a folder per visit day; opening a folder lists that day's
     documents panel-wise. With it off nothing here runs and neither API is called. */
  const showVisitWisePanelDocument =
    globalResourcesList?.find(
      (item) => item?.Name === "ShowVisitWisePanelDocument",
    )?.Value === "1";

  const [ipdAdmissions, setIpdAdmissions] = useState([]);

  // OPD visits and IPD admissions for the two tabs (patient_medical_history)
  const fetchIPDAdmissions = async (patientID, filters) => {
    if (!patientID) {
      setIpdAdmissions([]);
      setOpdVisits([]);
      return;
    }
    const [ipdRes, opdRes] = await Promise.all([
      GetPatientIPDAdmissions(patientID, "IPD", filters),
      GetPatientIPDAdmissions(patientID, "OPD", filters),
    ]);
    setIpdAdmissions(ipdRes?.success && Array.isArray(ipdRes?.data) ? ipdRes.data : []);
    setOpdVisits(opdRes?.success && Array.isArray(opdRes?.data) ? opdRes.data : []);
  };

  // One row per uploaded panel document, each carrying its visit. Grouped below.
  const [panelDocRows, setPanelDocRows] = useState([]);
  const [openFolder, setOpenFolder] = useState(null);
  const [panelDocPreview, setPanelDocPreview] = useState(null);

  /* Hover on a visit folder lists its documents by name; hover on a name previews the
     file beside the list. Files are fetched once and kept as Blob object URLs (a large
     base64 data: URI in an <img>/<iframe> renders blank). */
  const [hoverFolderKey, setHoverFolderKey] = useState(null);
  const [hoverDoc, setHoverDoc] = useState(null);
  const panelDocCache = useRef(new Map());

  const clearPanelDocCache = () => {
    panelDocCache.current.forEach((v) => v?.url && URL.revokeObjectURL(v.url));
    panelDocCache.current = new Map();
  };
  useEffect(() => clearPanelDocCache, []);

  const panelDocKey = (row) =>
    `${row?.transactionID}-${row?.panelID}-${row?.panelDocumentID}-${row?.id ?? row?.ID ?? ""}`;

  const base64ToObjectURL = (base64) => {
    const str = String(base64 || "");
    const match = str.match(/^data:([^;]+);base64,(.*)$/);
    const mime = match ? match[1] : "image/jpeg";
    const bin = atob(match ? match[2] : str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { url: URL.createObjectURL(new Blob([bytes], { type: mime })), isPdf: mime === "application/pdf" };
  };

  const hoverPanelDocument = async (row) => {
    const key = panelDocKey(row);
    const cached = panelDocCache.current.get(key);
    if (cached) {
      setHoverDoc({ key, name: row?.documentName, ...cached });
      return;
    }
    setHoverDoc({ key, name: row?.documentName, loading: true });
    try {
      const res = await GetPatientPanelDocumentFile({
        TransactionID: row?.transactionID,
        PanelID: row?.panelID,
        PanelDocumentID: row?.panelDocumentID,
        ID: row?.id ?? row?.ID ?? 0,
      });
      const file = res?.success && res?.data?.base64 ? base64ToObjectURL(res.data.base64) : { error: true };
      panelDocCache.current.set(key, file);
      // only show it if the user is still on this name
      setHoverDoc((prev) => (prev?.key === key ? { key, name: row?.documentName, ...file } : prev));
    } catch {
      setHoverDoc((prev) => (prev?.key === key ? { key, name: row?.documentName, error: true } : prev));
    }
  };

  /* Patient Documents grid: hover a green (uploaded) card to preview it. The file is already
     loaded with the list (d.image), so no API call - it is only turned into a Blob URL once
     (kept in the same cache) because a large data: URI can render blank. The API labels every
     file image/png, so a PDF is recognised by its own bytes ("JVBERi0" = %PDF). */
  const [hoverPatientDoc, setHoverPatientDoc] = useState(null);
  const hoverPatientDocument = (d) => {
    // Uploaded, but the server sent no file (it could not read it from disk).
    if (!d?.image) {
      setHoverPatientDoc({ name: d?.name, missing: true });
      return;
    }
    const key = `patientdoc-${d?.id}`;
    let file = panelDocCache.current.get(key);
    if (!file) {
      try {
        const src = String(d?.image || "");
        const payload = src.includes(",") ? src.split(",")[1] : src;
        const isPdf = src.startsWith("data:application/pdf") || payload.startsWith("JVBERi0");
        const mime = isPdf ? "application/pdf" : (src.match(/^data:([^;]+);/)?.[1] || "image/png");
        file = base64ToObjectURL(`data:${mime};base64,${payload}`);
      } catch {
        file = { error: true };
      }
      panelDocCache.current.set(key, file);
    }
    setHoverPatientDoc({ name: d?.name, ...file });
  };

  // Inject DM Sans + DM Mono from Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch (_) { } };
  }, []);

  useEffect(() => {
    if (CentreWiseCache?.length === 0) {
      dispatch(CentreWiseCacheByCenterID({}));
    }
  }, []);

  const [centreOptions, setCentreOptions] = useState([]);
  useEffect(() => {
    GetBindAllCenter().then((res) => {
      if (res?.success) {
        setCentreOptions(handleReactSelectDropDownOptions(res?.data, "CentreName", "CentreID"));
      }
    });
  }, []);

  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setValues((prev) => ({ ...prev, [name]: checked }));
  };

  const handleChangeRejectModel = (data) => setModalData(data);

  const viewLab = async (ele) => {
    try {
      const res = await handleBindMultipleLabReport({
        testID: Number(ele?.test_ID) ?? 0,
        isOnlinePrint: "1", isConversion: "", isNabl: "0",
        orderBy: "", labType: "1", ipAddress: ip, isPrev: true, SerialNo: null,
      });
      if (res?.success) RedirectURL(res?.data);
    } catch (err) { console.log(err); }
  };

  const viewRadiology = async (ele) => {
    try {
      const res = await handleBindMultipleLabReport({
        testID: Number(ele?.test_ID) ?? 0,
        isOnlinePrint: "1", isConversion: "", isNabl: "0",
        orderBy: "", labType: "1", ipAddress: ip, isPrev: true, SerialNo: null,
      });
      if (res?.success) RedirectURL(res?.data);
    } catch (err) { console.log(err); }
  };

  const DoctorPrescriptionPrint = async (item) => {
    store.dispatch(setLoading(true));
    try {
      const apiResp = await DoctorPrescriptionPrintPDF({
        pid: item?.patientID,
        transactionID: item?.transactionID,
        appID: item?.app_ID,
        previewSetting: [],
      });
      if (apiResp?.success) RedirectURL(apiResp?.data);
    } catch (err) {
      console.log(err);
      notify(t("Failed to load the preview"), "error");
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  const selectPatient = (data) => {
    setValues((prev) => ({ ...prev, UHID: data?.UHID ?? "" }));
    setHandleModelData((val) => ({ ...val, isOpen: false }));
    handleSearch(data?.UHID);
  };

  const handleEstablishedDonor = () => {
    setHandleModelData({
      name: t("Select Patient Details"),
      buttonName: t("View"),
      width: "80vw",
      isOpen: true,
      Component: (
        <OldPatientSearch
          inputData={{}}
          handleChangeModel={handleChangeRejectModel}
          selectPatient={selectPatient}
        />
      ),
      handleInsertAPI: () => { },
      extrabutton: <></>,
      footer: <></>,
    });
  };

  const setIsOpen = () => setHandleModelData((val) => ({ ...val, isOpen: false }));

  // Merge the full document-type list (panel-configured) with the patient's
  // uploaded documents so the encounter screen can mark which are uploaded.
  const fetchDocuments = async (pid) => {
    if (!pid) {
      setDocList([]);
      return;
    }
    try {
      const [allResp, upResp] = await Promise.all([
        dispatch(GetPatientUploadDocument({ PanelID: 88 })),
        // LatestAll: the latest upload of every document, whatever the day (the default
        // returns only today's uploads, so documents uploaded at registration on an earlier
        // day never showed here) - the same call Patient Registration (update) makes
        GetPatientDocument(pid, true),
      ]);
      const all = allResp?.payload?.success ? allResp.payload.data || [] : [];
      const uploaded = upResp?.success ? upResp.data || [] : [];
      const merged = all.map((d) => {
        const up = uploaded.find(
          (u) => String(u?.documentID) === String(d?.DocumentID),
        );
        return {
          name: d?.Document,
          id: d?.DocumentID,
          uploaded: !!up,
          image: up?.base64,
        };
      });
      setDocList(merged);
    } catch {
      setDocList([]);
    }
  };

  const getDocumentUrl = (filePath) => {
    if (!filePath) return "";
    const cleanPath = filePath.replace(/\\/g, "/");
    const index = cleanPath.toLowerCase().indexOf("/documents/");
    if (index !== -1) {
      const relativeUrl = cleanPath.substring(index);
      let base = APIBaseURL || "";
      if (base.endsWith("/api/v1")) {
        base = base.replace(/\/api\/v1$/, "");
      } else if (base.endsWith("/api")) {
        base = base.replace(/\/api$/, "");
      }
      if (base.endsWith("/")) {
        base = base.slice(0, -1);
      }
      return `${base}${relativeUrl}`;
    }
    return filePath;
  };


  const fetchPanelDocuments = async (pid) => {
    if (!showVisitWisePanelDocument || !pid) {
      setPanelDocRows([]);
      return;
    }
    try {
      const res = await GetPatientPanelDocumentVisitWise({
        PID: pid,
        FromDate: values?.chkDate
          ? moment(values?.fromDate).format("YYYY-MM-DD")
          : "",
        ToDate: values?.chkDate
          ? moment(values?.toDate).format("YYYY-MM-DD")
          : "",
      });
      // A patient with no uploads answers success:false — an empty folder list, not an error.
      setPanelDocRows(res?.success ? res?.data || [] : []);
    } catch {
      setPanelDocRows([]);
    }
  };

  
  const visitFolders = useMemo(() => {
    const byDate = new Map();
    panelDocRows?.forEach((row) => {
      const key = row?.visitDate || "unlinked";
      if (!byDate.has(key)) {
        byDate.set(key, {
          key,
          dateText: row?.visitDateText || "Not linked to a visit",
          visits: new Set(),
          panels: new Map(),
          count: 0,
        });
      }
      const folder = byDate.get(key);
      if (row?.transactionID) folder.visits.add(String(row.transactionID));
      const panelKey = String(row?.panelID ?? "");
      if (!folder.panels.has(panelKey)) {
        folder.panels.set(panelKey, {
          panelID: row?.panelID,
          panelName: row?.panelName || "—",
          documents: [],
        });
      }
      folder.panels.get(panelKey).documents.push(row);
      folder.count += 1;
    });
    return [...byDate.values()].map((f) => ({
      ...f,
      panels: [...f.panels.values()],
      visitCount: f.visits.size,
    }));
  }, [panelDocRows]);

  // The scan itself is only fetched when a document is actually opened.
  const openPanelDocument = async (row) => {
    try {
      const res = await GetPatientPanelDocumentFile({
        TransactionID: row?.transactionID,
        PanelID: row?.panelID,
        PanelDocumentID: row?.panelDocumentID,
        ID: row?.id ?? row?.ID ?? 0,
      });
      if (res?.success && res?.data?.base64) {
        setPanelDocPreview({
          name: row?.documentName || res?.data?.fileName,
          image: res.data.base64,
        });
      } else {
        notify(res?.message || "Document not available", "error");
      }
    } catch {
      notify("Failed to load the document", "error");
    }
  };

  const handleSearch = async (UHID) => {
    if (!values?.UHID && !UHID) {
      notify(t("Please enter UHID"), "warn");
      return;
    }
    setDocList([]);
    setPanelDocRows([]);
    setOpenFolder(null);
    setHoverFolderKey(null);
    setHoverDoc(null);
    clearPanelDocCache();
    const Payload = {
      // API applies the date range only when chkDate = "1"
      chkDate: values?.chkDate ? "1" : "0",
      patientId: values?.UHID || UHID,
      encounterNo: "",
      fromDate: moment(values?.fromDate).format("YYYY-MM-DD"),
      toDate: moment(values?.toDate).format("YYYY-MM-DD"),
      isEmg: "",
      CenterID: values?.CenterName?.value,
    };
    try {
      const response = await PanelControlGetPatientData(Payload);
      if (response?.success) {
        setRegistrationList(response?.data?.dtpatientdetails?.value?.data ?? []);
        setVitalList(response?.data?.dtVital?.data ?? []);
        setLabList(response?.data?.dtLabData?.data ?? []);
        setRadiologyList(response?.data?.dtRadioData?.data ?? []);
        setDischargeList(response?.data?.dtDischargeSummary?.data ?? []);
        setOpdDataList(response?.data?.dtAppointmentSummary?.data ?? []);
        setHasSearched(true);
        fetchDocuments(Payload.patientId);
        fetchPanelDocuments(Payload.patientId);
        fetchIPDAdmissions(Payload.patientId, Payload);
        notify(response?.message, "success");
      } else {
        notify(response?.message, "error");
      }
    } catch {
      notify(t("Error fetching patient data"), "error");
    }
  };

  // When opened embedded from another screen, auto-load the passed patient once
  useEffect(() => {
    if (embeddedUHID) {
      handleSearch(embeddedUHID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddedUHID]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const patient = registrationList?.[0];
  const hasOPD =
    vitalListAll.some((v) => v.pType === "OPD") ||
    labListAll.some((v) => v.pType === "OPD") ||
    opdVisits.length > 0;
  const hasIPD =
    vitalListAll.some((v) => v.pType === "IPD") ||
    dischargeListAll.length > 0 ||
    ipdAdmissions.length > 0;

  // OPD tab = everything that is not IPD (OPD + EMG); IPD tab = IPD only
  const isIPDTab = activeTab === "IPD";
  const byTab = (list) => list.filter((v) => (v?.pType === "IPD") === isIPDTab);
  const vitalList = byTab(vitalListAll);
  const labList = byTab(labListAll);
  const radiologyList = byTab(radiologyListAll);
  const opdList = isIPDTab ? [] : opdListAll;
  const dischargeList = isIPDTab ? dischargeListAll : [];
  const visitList = isIPDTab ? ipdAdmissions : opdVisits;

  // Visits table pagination (client side - the API already returns the full list).
  const [visitPage, setVisitPage] = useState(1);
  const [visitPageSize, setVisitPageSize] = useState(10);
  const visitTotalPages = Math.max(1, Math.ceil(visitList.length / visitPageSize));
  // Back to page 1 whenever the list changes (new search, OPD/IPD tab switch).
  useEffect(() => setVisitPage(1), [visitList, visitPageSize]);
  const safeVisitPage = Math.min(visitPage, visitTotalPages);
  const pagedVisitList = visitList.slice(
    (safeVisitPage - 1) * visitPageSize,
    safeVisitPage * visitPageSize,
  );
  const currentIPD = ipdAdmissions.find((a) => a?.Status === "IN");
  const drCount = [...new Set(opdList.map((o) => o.drName).filter(Boolean))].length;
  const MONO = { fontFamily: "'DM Mono', monospace", fontSize: "12px" };

  // Robust date parser — handles "28-May-2026 01:00 PM - 01:20 PM", "DD-MMM-YY", ISO etc.
  const parseDate = (str) => {
    if (!str) return null;
    const s = String(str).split(' - ')[0].trim();
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    const m = s.match(/^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{2,4})/);
    if (m) {
      const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
      const mon = MONTHS[m[2].toLowerCase()];
      if (mon !== undefined) { d = new Date(yr, mon, parseInt(m[1])); if (!isNaN(d.getTime())) return d; }
    }
    return null;
  };

  // Last visit = most recent date across ALL data types
  const lastVisitDate = [
    ...opdList.map((o) => o.appDate),
    ...labList.map((l) => l.date),
    ...radiologyList.map((r) => r.date),
    ...dischargeList.map((d) => d.DischargeDate || d.AdmitDate),
  ].filter(Boolean).reduce((latest, dateStr) => {
    const d = parseDate(dateStr), ld = latest ? parseDate(latest) : null;
    if (!d) return latest;
    if (!ld || d > ld) return dateStr;
    return latest;
  }, null);

  // Consultations sorted descending (most recent first)
  const sortedOpdList = [...opdList].sort((a, b) => {
    const da = parseDate(a.appDate), db = parseDate(b.appDate);
    if (!da) return 1; if (!db) return -1;
    return db - da;
  });

  const timelineEvents = [
    patient?.dateEnrolled ? {
      date: patient.dateEnrolled, type: "Registration",
      icon: "fas fa-user-check", color: C.teal400, sub: patient.centreName || "",
    } : null,
    ...opdList.map((o) => ({
      date: o.appDate, type: "Consultation",
      icon: "fas fa-stethoscope", color: C.green600, sub: o.drName || "",
    })),
    ...labList.map((l) => ({
      date: l.date, type: "Lab Tests",
      icon: "fas fa-flask", color: C.blue400, sub: l.testName || "",
    })),
    ...radiologyList.map((r) => ({
      date: r.date, type: "Radiology",
      icon: "fas fa-film", color: C.purple400, sub: r.testName || "",
    })),
    ...dischargeList.map((d) => ({
      date: d.AdmitDate, type: "Discharge",
      icon: "fas fa-hospital-alt", color: C.gray500, sub: d.IPDNo || "",
    })),
  ].filter((ev) => ev && ev.date).sort((a, b) => {
    const da = parseDate(a.date), db = parseDate(b.date);
    if (!da) return 1; if (!db) return -1;
    return da - db; // ascending chronological order
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.name)}
          buttonType="button"
          buttons={handleModelData?.extrabutton}
          buttonName={handleModelData?.buttonName}
          modalData={modalData}
          setModalData={setModalData}
          footer={handleModelData?.footer}
          handleAPI={handleModelData?.handleInsertAPI}
        >
          {handleModelData?.Component}
        </Modal>
      )}


      {/* One visit day's panel documents, grouped panel-wise. */}
      {openFolder && (
        <Modal
          visible={true}
          setVisible={() => { setOpenFolder(null); setHoverDoc(null); }}
          modalWidth="70vw"
          Header={`${t("Panel Documents")} — ${openFolder?.dateText}`}
          footer={<></>}
        >
          <div style={{ padding: "4px 8px 12px", maxHeight: "70vh", overflowY: "auto" }}>
            {openFolder?.panels?.map((panel, pi) => (
              <div key={`${panel.panelID}-${pi}`} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <i className="fas fa-shield-alt" style={{ fontSize: "12px", color: C.blue600 }} />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>
                    {panel.panelName}
                  </span>
                  <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>
                    {panel.documents.length} {panel.documents.length === 1 ? t("document") : t("documents")}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "10px" }}>
                  {panel.documents.map((doc, di) => (
                    <div
                      key={`${doc?.panelDocumentID}-${di}`}
                      onClick={() => openPanelDocument(doc)}
                      // Hover: preview the document (fetched once, then cached).
                      onMouseEnter={() => hoverPanelDocument(doc)}
                      onMouseLeave={() => setHoverDoc(null)}
                      title={doc?.uploadedOn ? `Uploaded ${doc.uploadedOn}` : "View document"}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 12px", borderRadius: "10px",
                        background: C.blue50, border: `1px solid ${C.blue100}`,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: "7px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.blue100 }}>
                        <i className="far fa-file" style={{ fontSize: "12px", color: C.blue600 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12.5px", fontWeight: "600", color: C.blue600, lineHeight: 1.25 }}>
                          {doc?.documentName || "—"}
                        </div>
                        {doc?.visitType && (
                          <div style={{ fontSize: "11px", color: C.gray500, marginTop: "2px" }}>
                            {doc.visitType}
                            {doc?.centreName ? ` · ${doc.centreName}` : ""}
                          </div>
                        )}
                        {/* Expiry entered at upload; red once it has passed. */}
                        {doc?.expiryDate && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            fontSize: "11px", fontWeight: "600", marginTop: "4px",
                            padding: "1px 7px", borderRadius: "10px",
                            color: Number(doc?.isExpired) === 1 ? C.red600 : C.amber600,
                            background: Number(doc?.isExpired) === 1 ? C.red50 : C.amber50,
                          }}>
                            <i className="far fa-calendar-alt" />
                            {Number(doc?.isExpired) === 1 ? t("Expired") : t("Expiry")}: {doc.expiryDate}
                          </div>
                        )}
                      </div>
                      <i className="fas fa-eye" style={{ fontSize: "11px", color: C.blue600, flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hover preview of a document card, in the middle of the screen. Portalled to
              <body>: the PrimeReact Dialog has a CSS transform, which makes position:fixed
              relative to the dialog and lets its content box clip the preview away.
              pointerEvents "none" so moving off the card still closes it. */}
          {hoverDoc && createPortal(
            <div
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                zIndex: 9999, width: 520, height: 520, maxWidth: "85vw", maxHeight: "80vh",
                background: "#fff", border: `1px solid ${C.blue100}`, borderRadius: "10px",
                boxShadow: "0 10px 34px rgba(0,0,0,.35)", padding: "6px",
                display: "flex", flexDirection: "column", pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: "600", color: C.blue600, padding: "2px 6px 6px" }}>
                {hoverDoc.name || t("Document")}
              </div>
              <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {hoverDoc.loading ? (
                  <span style={{ fontSize: "12px", color: C.gray500 }}><i className="fas fa-spinner fa-spin" /> {t("Loading...")}</span>
                ) : hoverDoc.error ? (
                  <span style={{ fontSize: "12px", color: C.gray500 }}>{t("Document not available")}</span>
                ) : hoverDoc.isPdf ? (
                  <iframe title={hoverDoc.name || "Document"} src={hoverDoc.url} style={{ width: "100%", height: "100%", border: "none" }} />
                ) : (
                  <img src={hoverDoc.url} alt={hoverDoc.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                )}
              </div>
            </div>,
            document.body,
          )}
        </Modal>
      )}

      {/* Patient document (Patient Documents tiles / upload history). The API sends every
          file as "data:image/png;base64,..." - a PDF is told apart by its own bytes
          ("JVBERi0" = %PDF) and shown in a frame with the right type. */}
      {docPreview && (() => {
        const src = String(docPreview?.image || docPreview?.url || "");
        const payload = src.includes(",") ? src.split(",")[1] : src;
        const isPdf = src.startsWith("data:application/pdf") || payload.startsWith("JVBERi0") || /\.pdf$/i.test(src);
        const shown = isPdf && payload.startsWith("JVBERi0") ? `data:application/pdf;base64,${payload}` : src;
        return (
          <Modal
            visible={true}
            setVisible={() => setDocPreview(null)}
            modalWidth="70vw"
            Header={docPreview?.name || t("Document")}
            footer={<></>}
          >
            <div style={{ textAlign: "center", padding: "8px" }}>
              {!src ? (
                <div style={{ color: C.gray500, padding: "24px" }}>{t("No preview available")}</div>
              ) : isPdf ? (
                <iframe
                  title={docPreview?.name || "Document"}
                  src={shown}
                  style={{ width: "100%", height: "70vh", border: "none", borderRadius: "8px" }}
                />
              ) : (
                <img
                  src={shown}
                  alt={docPreview?.name}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }}
                />
              )}
            </div>
          </Modal>
        );
      })()}

      {/* A PDF cannot go in an <img>, and scans are saved as both. */}
      {panelDocPreview && (
        <Modal
          visible={true}
          setVisible={() => setPanelDocPreview(null)}
          modalWidth="70vw"
          Header={panelDocPreview?.name || t("Document")}
          footer={<></>}
        >
          <div style={{ textAlign: "center", padding: "8px" }}>
            {String(panelDocPreview?.image || "").startsWith("data:application/pdf") ? (
              <iframe
                title={panelDocPreview?.name || "Document"}
                src={panelDocPreview.image}
                style={{ width: "100%", height: "70vh", border: "none", borderRadius: "8px" }}
              />
            ) : (
              <img
                src={panelDocPreview.image}
                alt={panelDocPreview?.name}
                style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
              />
            )}
          </div>
        </Modal>
      )}

      <div className="card p-0">

        {/* ── SEARCH BAR ─────────────────────────────────────────────────── */}
        <div style={{ padding: "4px 12px 8px", background: "#fff", borderBottom: `1px solid ${C.gray200}` }}>
          <Heading title={t("Patient Encounter History")} isBreadcrumb={true} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              id="UHID"
              name="UHID"
              value={values?.UHID || ""}
              onChange={handleChange}
              lable={t("UHID")}
              placeholder=" "
              respclass="col-xl-2 col-lg-2 col-md-4 col-sm-6 col-12"
              isUpperCase={true}
            />
            <DatePicker
              id="fromDate"
              name="fromDate"
              placeholder={VITE_DATE_FORMAT}
              lable={t("From Date")}
              className="custom-calendar"
              value={values?.fromDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-4 col-sm-6 col-12"
              maxDate={values?.toDate}
            />
            <DatePicker
              id="toDate"
              name="toDate"
              placeholder={VITE_DATE_FORMAT}
              lable={t("To Date")}
              className="custom-calendar"
              value={values?.toDate}
              handleChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-4 col-sm-6 col-12"
              maxDate={new Date()}
            />
            <ReactSelect
              placeholderName={t("Center Name")}
              id="CenterName"
              searchable={true}
              removeIsClearable={true}
              respclass="col-xl-2 col-lg-2 col-md-4 col-sm-6 col-12"
              handleChange={handleSelect}
              dynamicOptions={[{ value: "All", label: t("All") }, ...centreOptions]}
              value={`${values?.CenterName?.value}`}
              name="CenterName"
            />
            <Checkbox
              id="chkDate"
              name="chkDate"
              label={t("By Date")}
              checked={!!values?.chkDate}
              onChange={handleCheckboxChange}
              respClass="col-xl-2 col-lg-2 col-md-4 col-sm-6 col-12"
              removeSpacing={true}
            />
            <div className="col-xl-2 col-lg-2 col-md-4 col-sm-6 col-12 d-flex align-items-end" style={{ paddingBottom: "4px" }}>
              <button className="btn btn-sm btn-success" type="button" onClick={() => handleSearch()}>
                <i className="fas fa-search" style={{ marginRight: "5px" }} />
                {t("Search")}
              </button>
            </div>
          </div>
        </div>

        {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
        {hasSearched && (
          <div style={{ padding: "16px", background: C.bg, minHeight: "200px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* 1. PATIENT HEADER */}
            {patient && (
              <div style={{
                background: "#fff", borderRadius: "16px", padding: "20px 24px",
                marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: `1px solid ${C.gray200}`,
              }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.teal400}, ${C.teal600})`,
                    color: "#fff", fontSize: "20px", fontWeight: "700",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {getInitials(patient?.pName)}
                  </div>

                  <div style={{ flex: "1 1 200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <span style={{ fontSize: "22px", fontWeight: "700", color: C.gray900 }}>{patient?.pName}</span>
                      <span style={{ background: C.teal50, color: C.teal600, border: `1px solid ${C.teal100}`, padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                        {t("ID:")} {patient?.patientID}
                      </span>
                      {hasOPD && <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: C.blue50, color: C.blue600 }}>{t("OPD")}</span>}
                      {hasIPD && <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: C.purple50, color: C.purple600 }}>{t("IPD")}</span>}
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: C.gray600 }}>
                      {patient?.ageSex && <span><i className="fas fa-user" style={{ marginRight: "4px", fontSize: "11px" }} />{patient.ageSex}</span>}
                      {patient?.mobile && <span><i className="fas fa-phone" style={{ marginRight: "4px", fontSize: "11px" }} />{patient.mobile}</span>}
                      {patient?.address && <span><i className="fas fa-map-marker-alt" style={{ marginRight: "4px", fontSize: "11px" }} />{patient.address}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
                    {[
                      { label: "Patient ID", value: patient?.patientID, mono: true },
                      { label: "Enrolled", value: patient?.dateEnrolled },
                      { label: "Centre", value: patient?.centreName },
                      { label: "Last Visit", value: lastVisitDate || "—" },
                    ].map((f) => (
                      <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: C.gray500, fontWeight: "500" }}>{f.label}</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800, ...(f.mono ? { ...MONO, color: C.teal600 } : {}) }}>
                          {f.value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* OPD / IPD TABS */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[
                { key: "OPD", count: opdVisits.length, color: C.blue600, bg: C.blue50 },
                { key: "IPD", count: ipdAdmissions.length, color: C.purple600, bg: C.purple50 },
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  // div, not <button>: the theme's global button CSS overrides the tab colours
                  <div
                    key={tab.key}
                    role="tab"
                    aria-selected={active}
                    tabIndex={0}
                    onClick={() => { setActiveTab(tab.key); setShowAllConsultations(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTab(tab.key); setShowAllConsultations(false); } }}
                    style={{
                      padding: "8px 22px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
                      border: `2px solid ${active ? tab.color : tab.bg}`,
                      background: active ? tab.color : tab.bg, color: active ? "#fff" : tab.color,
                      userSelect: "none", transition: "background .2s, color .2s, border-color .2s",
                    }}
                  >
                    {t(tab.key)}
                    <span style={{ marginLeft: "8px", padding: "0 8px", borderRadius: "10px", fontSize: "11px", background: active ? "rgba(255,255,255,.25)" : "#fff" }}>
                      {tab.count}
                    </span>
                  </div>
                );
              })}
            </div>


            {/* 2. STATS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              {[
                isIPDTab
                  ? {
                    label: "IPD Admissions",
                    val: ipdAdmissions.length,
                    icon: "fas fa-procedures",
                    color: C.amber600,
                    bg: C.amber50,
                    sub: currentIPD
                      ? `Admitted: ${currentIPD.IPDNo}`
                      : ipdAdmissions.length > 0 ? "Not admitted now" : "No records",
                  }
                  : {
                    label: "OPD Visits",
                    val: opdVisits.length,
                    icon: "fas fa-user-md",
                    color: C.blue600,
                    bg: C.blue50,
                    sub: opdVisits.length > 0 ? `Last: ${opdVisits[0]?.AdmitDate || "—"}` : "No records",
                  },
                ...(isIPDTab ? [] : [{ label: "Total Appointments", val: opdList.length, icon: "fas fa-calendar-check", color: C.teal600, bg: C.teal50, sub: drCount > 0 ? `${drCount} Doctor${drCount > 1 ? "s" : ""}` : "No records" }]),
                { label: "Lab Tests", val: labList.length, icon: "fas fa-flask", color: C.blue600, bg: C.blue50, sub: [...new Set(labList.map((l) => l.subcategory).filter(Boolean))].join(" · ") || "No records" },
                { label: "Radiology", val: radiologyList.length, icon: "fas fa-film", color: C.purple600, bg: C.purple50, sub: [...new Set(radiologyList.map((r) => r.subcategory).filter(Boolean))].join(" · ") || "No records" },
                { label: "Vital Records", val: vitalList.length, icon: "fas fa-heartbeat", color: C.red600, bg: C.red50, sub: vitalList.length > 0 ? `Latest: ${vitalList[vitalList.length - 1]?.entryDate || "—"}` : "No records" },
                ...(!isIPDTab ? [] : [{ label: "Discharge", val: dischargeList.length, icon: "fas fa-hospital", color: C.gray600, bg: C.gray100, sub: dischargeList.length > 0 ? "View summary" : "No records" }]),
              ].map((s) => (
                <div key={s.label} style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}`, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", color: C.gray500, fontWeight: "500" }}>{s.label}</span>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={s.icon} style={{ color: s.color, fontSize: "14px" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: "28px", fontWeight: "700", lineHeight: 1.1, color: s.val > 0 ? s.color : C.gray400 }}>{s.val}</span>
                  <span style={{ fontSize: "11px", color: C.gray500 }}>{s.sub}</span>
                </div>
              ))}
            </div>

            {/* 2b. OPD VISITS / IPD ADMISSIONS (active tab) */}
            <div style={{ marginBottom: "16px" }}>
              <SectionHeader
                color={isIPDTab ? C.amber600 : C.blue600}
                title={isIPDTab ? "IPD Admissions" : "OPD Visits"}
                count={visitList.length}
              />
              {visitList.length === 0 ? (
                <EmptyState
                  icon={isIPDTab ? "fas fa-procedures" : "fas fa-user-md"}
                  title={isIPDTab ? "No IPD admission found" : "No OPD visit found"}
                />
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <TH>{isIPDTab ? "IPD No" : "Visit No"}</TH>
                      <TH>{isIPDTab ? "Admit Date" : "Visit Date"}</TH>
                      {isIPDTab && <TH>Discharge Date</TH>}
                      {isIPDTab && <TH>Days</TH>}
                      {isIPDTab && <TH>Room Type / Room</TH>}
                      <TH>Doctor</TH>
                      <TH>Panel</TH>
                      {isIPDTab && <TH>Status</TH>}
                      <TH>Bill No</TH>
                      <TH>Net Amount</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedVisitList.map((a, i) => {
                      const isIn = isIPDTab && a?.Status === "IN";
                      return (
                        <tr key={a?.TransactionID || i} style={isIn ? { background: C.amber50 } : undefined}>
                          <TD style={{ ...MONO, fontWeight: "600", color: C.teal600 }}>{a?.IPDNo || "—"}</TD>
                          <TD>{a?.AdmitDate || "—"}</TD>
                          {isIPDTab && <TD>{a?.DischargeDate || "—"}</TD>}
                          {isIPDTab && <TD>{a?.StayDays ?? "—"}</TD>}
                          {isIPDTab && (
                            <TD>
                              <div style={{ fontWeight: "600" }}>{a?.RoomType || "—"}</div>
                              {a?.RoomName && <div style={{ fontSize: "11px", color: C.gray500 }}>{a.RoomName}</div>}
                            </TD>
                          )}
                          <TD>{a?.DoctorName || "—"}</TD>
                          <TD>{a?.PanelName || "—"}</TD>
                          {isIPDTab && (
                            <TD>
                              <span style={{
                                padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                                background: isIn ? C.amber100 : C.green50, color: isIn ? C.amber600 : C.green600,
                              }}>
                                {isIn ? "Admitted" : "Discharged"}
                              </span>
                              {isIn && a?.DischargeStep && (
                                <div style={{ fontSize: "11px", color: C.gray500, marginTop: "2px" }}>{a.DischargeStep}</div>
                              )}
                            </TD>
                          )}
                          <TD style={MONO}>{a?.BillNo || "—"}</TD>
                          <TD style={{ textAlign: "right" }}>{Number(a?.NetAmount || 0).toFixed(2)}</TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableWrap>
              )}
              {visitList.length > 0 && (() => {
                // Page numbers around the current page (max 5 shown).
                const start = Math.max(1, Math.min(safeVisitPage - 2, visitTotalPages - 4));
                const pages = [];
                for (let p = start; p <= Math.min(visitTotalPages, start + 4); p++) pages.push(p);
                const from = (safeVisitPage - 1) * visitPageSize + 1;
                const to = Math.min(safeVisitPage * visitPageSize, visitList.length);
                const btn = (active, disabled) => ({
                  minWidth: "30px", height: "28px", padding: "0 8px", fontSize: "12px",
                  borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer",
                  border: `1px solid ${active ? C.blue600 : C.gray300}`,
                  background: active ? C.blue600 : "#fff",
                  color: active ? "#fff" : disabled ? C.gray400 : C.gray700,
                  fontWeight: active ? "600" : "400",
                });
                const isFirst = safeVisitPage === 1;
                const isLast = safeVisitPage === visitTotalPages;
                return (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexWrap: "wrap", gap: "12px", marginTop: "10px", padding: "8px 10px",
                    background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: "8px",
                    fontSize: "12px", color: C.gray600, textTransform: "none",
                  }}>
                    {/* Prev | page numbers | Next */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <button type="button" style={btn(false, isFirst)} disabled={isFirst}
                        onClick={() => setVisitPage(1)} title={t("First Page")}>
                        <i className="fa fa-angle-double-left" />
                      </button>
                      <button type="button" style={btn(false, isFirst)} disabled={isFirst}
                        onClick={() => setVisitPage(safeVisitPage - 1)}>
                        <i className="fa fa-angle-left" style={{ marginRight: "4px" }} />{t("Prev")}
                      </button>
                      {pages[0] > 1 && <span style={{ padding: "0 2px" }}>…</span>}
                      {pages.map((p) => (
                        <button key={p} type="button" style={btn(p === safeVisitPage, false)}
                          onClick={() => setVisitPage(p)}>{p}</button>
                      ))}
                      {pages[pages.length - 1] < visitTotalPages && <span style={{ padding: "0 2px" }}>…</span>}
                      <button type="button" style={btn(false, isLast)} disabled={isLast}
                        onClick={() => setVisitPage(safeVisitPage + 1)}>
                        {t("Next")}<i className="fa fa-angle-right" style={{ marginLeft: "4px" }} />
                      </button>
                      <button type="button" style={btn(false, isLast)} disabled={isLast}
                        onClick={() => setVisitPage(visitTotalPages)} title={t("Last Page")}>
                        <i className="fa fa-angle-double-right" />
                      </button>
                    </div>

                    {/* Page x of y, rows shown, rows per page */}
                    <span>
                      {t("Page")} <b style={{ color: C.gray800 }}>{safeVisitPage}</b> {t("of")} <b style={{ color: C.gray800 }}>{visitTotalPages}</b>
                      {" "}({from}–{to} {t("of")} {visitList.length})
                    </span>
                    <select
                      value={visitPageSize}
                      onChange={(e) => setVisitPageSize(Number(e.target.value))}
                      style={{ height: "28px", fontSize: "12px", borderRadius: "6px", border: `1px solid ${C.gray300}`, padding: "0 4px", background: "#fff" }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n} / {t("page")}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>
            {/* 3. PATIENT JOURNEY TIMELINE */}
            {timelineEvents.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: C.gray900 }}>{t("Patient Journey")}</span>
                  <span style={{ fontSize: "12px", color: C.gray500, background: C.gray100, padding: "2px 10px", borderRadius: "10px" }}>
                    {timelineEvents.length} {t("events")}
                  </span>
                </div>
                <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", minWidth: "max-content" }}>
                    {timelineEvents.map((ev, i) => (
                      <React.Fragment key={i}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "120px" }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${ev.color}20`, border: `2px solid ${ev.color}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px", flexShrink: 0 }}>
                            <i className={ev.icon} style={{ color: ev.color, fontSize: "12px" }} />
                          </div>
                          <span style={{ fontSize: "10px", color: C.gray500, textAlign: "center", marginBottom: "2px" }}>{ev.date}</span>
                          <span style={{ fontSize: "11px", fontWeight: "600", color: ev.color, textAlign: "center", marginBottom: "2px" }}>{ev.type}</span>
                          <span style={{ fontSize: "10px", color: C.gray600, textAlign: "center", lineHeight: "1.3", maxWidth: "110px" }}>{ev.sub}</span>
                        </div>
                        {i < timelineEvents.length - 1 && (
                          <div style={{ width: "30px", height: "2px", background: `linear-gradient(to right, ${ev.color}60, ${timelineEvents[i + 1].color}60)`, alignSelf: "flex-start", marginTop: "16px", flexShrink: 0 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. THREE-PANEL: Consultations | Lab | Radiology */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>

              {/* Consultations */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "8px", background: C.teal50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-stethoscope" style={{ color: C.teal600, fontSize: "12px" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>{t("Consultations")}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>{sortedOpdList.length} {t("total")}</span>
                </div>
                {sortedOpdList.length === 0
                  ? <EmptyState icon="fas fa-calendar-alt" title={t("No consultations found")} />
                  : (showAllConsultations ? sortedOpdList : sortedOpdList.slice(0, 3)).map((item, i, arr) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.gray100}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>{item?.drName || "—"}</div>
                          <div style={{ fontSize: "11px", color: C.gray500, marginTop: "1px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{item?.specialization || "—"}</div>
                          <div style={{ fontSize: "11px", color: C.teal600, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <i className="far fa-clock" style={{ fontSize: "10px" }} /> {item?.appDate || "—"}
                          </div>
                        </div>
                        <ViewBtn onClick={() => DoctorPrescriptionPrint(item)} />
                      </div>
                    </div>
                  ))
                }
                {sortedOpdList.length > 3 && (
                  <div
                    onClick={() => setShowAllConsultations((v) => !v)}
                    style={{ textAlign: "center", paddingTop: "10px", fontSize: "12px", color: C.teal600, fontWeight: "600", cursor: "pointer", userSelect: "none" }}
                  >
                    {showAllConsultations ? t("↑ Show less") : `+ ${sortedOpdList.length - 3} more`}
                  </div>
                )}
              </div>

              {/* Recent Lab Results */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "8px", background: C.blue50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-flask" style={{ color: C.blue600, fontSize: "12px" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>{t("Recent Lab Results")}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>{labList.length} {t("total")}</span>
                </div>
                {labList.length === 0
                  ? <EmptyState icon="fas fa-flask" title={t("No lab results found")} />
                  : labList.slice(-3).reverse().map((item, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: i < Math.min(labList.length, 3) - 1 ? `1px solid ${C.gray100}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: "500", color: C.gray800 }}>{item?.testName || "—"}</div>
                          <div style={{ fontSize: "11px", color: C.gray500, marginTop: "1px" }}>{item?.date || "—"}</div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <DeptBadge dept={item?.subcategory} />
                          <ViewBtn onClick={() => viewLab(item)} />
                        </div>
                      </div>
                    </div>
                  ))
                }
                {labList.length > 3 && (
                  <div style={{ textAlign: "center", paddingTop: "10px", fontSize: "12px", color: C.blue600, fontWeight: "500" }}>
                    + {labList.length - 3} {t("more")}
                  </div>
                )}
              </div>

              {/* Recent Radiology */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "8px", background: C.purple50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-film" style={{ color: C.purple600, fontSize: "12px" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>{t("Recent Radiology")}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>{radiologyList.length} {t("total")}</span>
                </div>
                {radiologyList.length === 0
                  ? <EmptyState icon="fas fa-film" title={t("No radiology reports found")} />
                  : radiologyList.slice(-3).reverse().map((item, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: i < Math.min(radiologyList.length, 3) - 1 ? `1px solid ${C.gray100}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: "500", color: C.gray800 }}>{item?.testName || "—"}</div>
                          <div style={{ fontSize: "11px", color: C.gray500, marginTop: "1px" }}>{item?.date || "—"}</div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <DeptBadge dept={item?.subcategory} />
                          <ViewBtn onClick={() => viewRadiology(item)} />
                        </div>
                      </div>
                    </div>
                  ))
                }
                {radiologyList.length > 3 && (
                  <div style={{ textAlign: "center", paddingTop: "10px", fontSize: "12px", color: C.purple600, fontWeight: "500" }}>
                    + {radiologyList.length - 3} {t("more")}
                  </div>
                )}
              </div>
            </div>

            {/* 4b. PATIENT DOCUMENTS */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "8px", background: C.green50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="fas fa-folder-open" style={{ color: C.green600, fontSize: "12px" }} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>{t("Patient Documents")}</span>
                </div>
                <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>
                  {docList.filter((d) => d.uploaded).length} / {docList.length} {t("uploaded")}
                </span>
              </div>
              {docList.length === 0 ? (
                <EmptyState icon="fas fa-folder-open" title={t("No documents configured")} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "10px" }}>
                  {docList.map((d, i) => {
                    const clickable = d.uploaded && !!d.image;
                    return (
                      <div
                        key={i}
                        onClick={() => clickable && setDocPreview(d)}
                        onMouseEnter={() => d.uploaded && hoverPatientDocument(d)}
                        onMouseLeave={() => setHoverPatientDoc(null)}
                        title={d.uploaded ? "View document" : "Not uploaded"}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 12px", borderRadius: "10px",
                          background: d.uploaded ? C.green50 : C.gray50,
                          border: `1px solid ${d.uploaded ? C.green100 : C.gray200}`,
                          cursor: clickable ? "pointer" : "default",
                        }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: "7px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: d.uploaded ? C.green100 : C.gray200 }}>
                          <i className={d.uploaded ? "fas fa-check" : "far fa-file"} style={{ fontSize: "12px", color: d.uploaded ? C.green600 : C.gray500 }} />
                        </div>
                        <span style={{ flex: 1, fontSize: "12.5px", fontWeight: d.uploaded ? "600" : "500", color: d.uploaded ? C.green600 : C.gray600, lineHeight: 1.25 }}>
                          {d.name || "—"}
                        </span>
                        {clickable && <i className="fas fa-eye" style={{ fontSize: "11px", color: C.green600, flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hover preview of an uploaded patient document, in the middle of the screen.
                  pointerEvents "none" so moving off the card still closes it. */}
              {hoverPatientDoc && (
                <div
                  style={{
                    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    zIndex: 3000, width: 520, height: 520, maxWidth: "85vw", maxHeight: "80vh",
                    background: "#fff", border: `1px solid ${C.green100}`, borderRadius: "10px",
                    boxShadow: "0 10px 34px rgba(0,0,0,.35)", padding: "6px",
                    display: "flex", flexDirection: "column", pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "600", color: C.green600, padding: "2px 6px 6px" }}>
                    {hoverPatientDoc.name || t("Document")}
                  </div>
                  <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {hoverPatientDoc.missing ? (
                      <div style={{ textAlign: "center", color: C.gray500, padding: "16px" }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: "28px", color: C.amber400, marginBottom: "8px" }} />
                        <div style={{ fontSize: "13px", fontWeight: "600", color: C.amber600 }}>{t("Document File Not Found")}</div>
                        <div style={{ fontSize: "12px", marginTop: "4px" }}>
                          {t("This document is saved for the patient, but its file could not be read from the server")}
                        </div>
                      </div>
                    ) : hoverPatientDoc.error ? (
                      <span style={{ fontSize: "12px", color: C.gray500 }}>{t("Document not available")}</span>
                    ) : hoverPatientDoc.isPdf ? (
                      <iframe title={hoverPatientDoc.name || "Document"} src={hoverPatientDoc.url} style={{ width: "100%", height: "100%", border: "none" }} />
                    ) : (
                      <img src={hoverPatientDoc.url} alt={hoverPatientDoc.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4c. PATIENT DOCUMENT UPLOAD HISTORY */}
            <DateWiseDocument
              patientId={patient?.patientID}
              setDocPreview={setDocPreview}
            />

            {/* 4c. PANEL DOCUMENTS — ONE FOLDER PER VISIT DAY */}
            {showVisitWisePanelDocument && (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "8px", background: C.amber50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-folder" style={{ color: C.amber600, fontSize: "12px" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>
                      {t("Panel Documents")} <span style={{ color: C.gray500, fontWeight: "400" }}>({t("Visit-wise")})</span>
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>
                    {visitFolders.length} {visitFolders.length === 1 ? "visit" : "visits"} · {panelDocRows.length} {panelDocRows.length === 1 ? "document" : "documents"}
                  </span>
                </div>
                {visitFolders.length === 0 ? (
                  <EmptyState
                    icon="fas fa-folder"
                    title="No panel document uploaded"
                    sub="Documents uploaded from Add/Remove Panels List appear here, one folder per visit"
                  />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                    {visitFolders.map((folder) => (
                      <div
                        key={folder.key}
                        style={{ position: "relative" }}
                        onMouseEnter={() => setHoverFolderKey(folder.key)}
                        onMouseLeave={() => { setHoverFolderKey(null); setHoverDoc(null); }}
                      >
                      <div
                        onClick={() => setOpenFolder(folder)}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "12px 14px", borderRadius: "10px",
                          background: C.amber50, border: `1px solid ${C.amber100}`,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.amber100 }}>
                          <i className="fas fa-folder" style={{ fontSize: "14px", color: C.amber600 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12.5px", fontWeight: "600", color: C.gray800 }}>
                            {folder.dateText}
                          </div>
                          <div style={{ fontSize: "11px", color: C.gray500, marginTop: "2px" }}>
                            {folder.panels.length} {folder.panels.length === 1 ? "panel" : "panels"} · {folder.count} {folder.count === 1 ? "document" : "documents"}
                          </div>
                        </div>
                        <i className="fas fa-chevron-right" style={{ fontSize: "11px", color: C.amber600, flexShrink: 0 }} />
                      </div>

                      {/* Hover: document names of this visit; hover a name to preview it. */}
                      {hoverFolderKey === folder.key && (
                        <div
                          style={{
                            position: "absolute", top: "100%", left: 0, zIndex: 50,
                            paddingTop: "6px", display: "flex", gap: "8px", alignItems: "flex-start",
                          }}
                        >
                          <div style={{ width: 250, maxHeight: 320, overflowY: "auto", background: "#fff", border: `1px solid ${C.amber100}`, borderRadius: "10px", boxShadow: "0 6px 20px rgba(0,0,0,0.15)", padding: "8px" }}>
                            {folder.panels.map((panel, pi) => (
                              <div key={`${panel.panelID}-${pi}`} style={{ marginBottom: "6px" }}>
                                <div style={{ fontSize: "11px", fontWeight: "600", color: C.gray600, padding: "2px 6px" }}>
                                  <i className="fas fa-shield-alt" style={{ marginRight: "5px", color: C.blue600 }} />
                                  {panel.panelName}
                                </div>
                                {panel.documents.map((doc, di) => {
                                  const active = hoverDoc?.key === panelDocKey(doc);
                                  return (
                                    <div
                                      key={`${doc?.panelDocumentID}-${di}`}
                                      onMouseEnter={() => hoverPanelDocument(doc)}
                                      onClick={(e) => { e.stopPropagation(); openPanelDocument(doc); }}
                                      style={{
                                        display: "flex", alignItems: "center", gap: "6px",
                                        padding: "5px 8px", borderRadius: "6px", cursor: "pointer",
                                        fontSize: "12px", color: active ? C.blue600 : C.gray700,
                                        background: active ? C.blue50 : "transparent",
                                      }}
                                    >
                                      <i className="far fa-file" style={{ fontSize: "11px" }} />
                                      <span style={{ flex: 1 }}>{doc?.documentName || "—"}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                          {hoverDoc && (
                            <div style={{ width: 320, height: 320, background: "#fff", border: `1px solid ${C.blue100}`, borderRadius: "10px", boxShadow: "0 6px 20px rgba(0,0,0,0.15)", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                              {hoverDoc.loading ? (
                                <span style={{ fontSize: "12px", color: C.gray500 }}><i className="fas fa-spinner fa-spin" /> Loading...</span>
                              ) : hoverDoc.error ? (
                                <span style={{ fontSize: "12px", color: C.gray500 }}>Document not available</span>
                              ) : hoverDoc.isPdf ? (
                                <iframe title={hoverDoc.name || "Document"} src={hoverDoc.url} style={{ width: "100%", height: "100%", border: "none" }} />
                              ) : (
                                <img src={hoverDoc.url} alt={hoverDoc.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. VITALS TREND */}
            {vitalList.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: C.gray900 }}>{t("Vitals Trend")}</span>
                  <span style={{ fontSize: "12px", color: C.gray500 }}>{t("Last")} {vitalList.length} {t("Reading")}{vitalList.length > 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "12px" }}>
                  {(() => {
                    // Sort vitals chronologically for sparkline
                    const sortedVitals = [...vitalList].sort((a, b) => {
                      const da = parseDate(a.entryDate), db = parseDate(b.entryDate);
                      if (!da) return 1; if (!db) return -1; return da - db;
                    });
                    const last = sortedVitals[sortedVitals.length - 1];

                    const vitalDefs = [
                      {
                        label: "Blood Pressure", unit: "mmHg", classify: classifyBP, color: C.red400,
                        getVal: (v) => v.bp,
                        sparkVal: (v) => v.bp ? parseInt(v.bp) : NaN
                      },
                      {
                        label: "Heart Rate", unit: "bpm", classify: classifyPulse, color: C.teal400,
                        getVal: (v) => v.p,
                        sparkVal: (v) => parseFloat(v.p)
                      },
                      {
                        label: "Temperature", unit: "°F", classify: classifyTemp, color: C.amber400,
                        getVal: (v) => v.t,
                        sparkVal: (v) => parseFloat(v.t)
                      },
                      {
                        label: "Resp. Rate", unit: "breaths/m", classify: () => "normal", color: C.blue400,
                        getVal: (v) => v.r,
                        sparkVal: (v) => parseFloat(v.r)
                      },
                      {
                        label: "Weight", unit: "kg", classify: () => "normal", color: C.purple400,
                        getVal: (v) => v.wt,
                        sparkVal: (v) => parseFloat(v.wt)
                      },
                      {
                        label: "BMI", unit: "", classify: classifyBMI, color: C.green400,
                        getVal: (v) => v.bmi ? parseFloat(v.bmi).toFixed(1) : null,
                        sparkVal: (v) => parseFloat(v.bmi)
                      },
                    ];

                    return vitalDefs.map((vd) => {
                      const lastVal = vd.getVal(last);
                      const status = lastVal ? vd.classify(String(lastVal)) : null;
                      const sparkData = sortedVitals.map((v) => vd.sparkVal(v)).filter((n) => !isNaN(n));

                      // Build date-wise rows (newest first)
                      const dateRows = [...sortedVitals].reverse().map((v) => ({
                        date: v.entryDate || "—",
                        val: vd.getVal(v),
                      })).filter((r) => r.val);

                      return (
                        <div key={vd.label} style={{ border: `1px solid ${C.gray200}`, borderRadius: "12px", padding: "12px 14px", background: C.gray50 }}>
                          {/* Header */}
                          <div style={{ fontSize: "11px", color: C.gray500, fontWeight: "500", marginBottom: "4px" }}>{vd.label}</div>
                          <div style={{ fontSize: "22px", fontWeight: "700", color: lastVal ? C.gray800 : C.gray400, lineHeight: 1.2 }}>
                            {lastVal || "—"}
                          </div>
                          <div style={{ fontSize: "11px", color: C.gray500, marginBottom: "8px" }}>{vd.unit}</div>
                          {sparkData.length >= 2 && <Sparkline values={sparkData} color={vd.color} />}
                          {status && lastVal && (
                            <span style={{ display: "inline-block", marginTop: "6px", ...CHIP_BASE, ...VS[status], fontFamily: "inherit", fontSize: "10px" }}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          )}
                          {/* Date-wise readings list */}
                          {dateRows.length > 0 && (
                            <div style={{ marginTop: "10px", borderTop: `1px solid ${C.gray200}`, paddingTop: "8px", maxHeight: "160px", overflowY: "auto" }}>
                              {dateRows.map((r, idx) => {
                                const st = vd.classify(String(r.val));
                                return (
                                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: idx < dateRows.length - 1 ? `1px solid ${C.gray100}` : "none", gap: "4px" }}>
                                    <span style={{ fontSize: "10px", color: C.gray500, flexShrink: 0 }}>{r.date}</span>
                                    <span style={{ ...MONO, fontSize: "11px", fontWeight: "600", color: C.gray800 }}>{r.val}</span>
                                    <span style={{ ...CHIP_BASE, ...VS[st], fontSize: "9px", fontFamily: "inherit", padding: "1px 5px", flexShrink: 0 }}>
                                      {st.charAt(0).toUpperCase() + st.slice(1)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* 6. DISCHARGE SUMMARY */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", marginBottom: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "8px", background: C.gray100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-hospital-alt" style={{ color: C.gray600, fontSize: "12px" }} />
                </div>
                <span style={{ fontSize: "15px", fontWeight: "700", color: C.gray900 }}>{t("Discharge Summary")}</span>
                {dischargeList.length > 0 && (
                  <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>
                    {dischargeList.length} {t("record")}{dischargeList.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {dischargeList.length === 0
                ? <EmptyState icon="fas fa-file-medical-alt" title={t("No discharge summary found")} sub="No discharge records for the given parameters." />
                : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                    {dischargeList.map((item, i) => (
                      <div key={i} style={{ background: C.gray50, borderRadius: "12px", padding: "14px 16px", border: `1px solid ${C.gray200}`, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: C.gray400, borderRadius: "4px 0 0 4px" }} />
                        <div style={{ paddingLeft: "8px" }}>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: C.gray800, ...MONO }}>{item?.IPDNo || "—"}</div>
                          <div style={{ fontSize: "11px", color: C.gray500, marginTop: "2px" }}>{item?.CentreName || "—"}</div>
                          <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                            {[
                              { label: "Admit Date", value: item?.AdmitDate },
                              { label: "Discharge Date", value: item?.DischargeDate },
                            ].map((f) => (
                              <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: C.gray500, fontWeight: "500" }}>{f.label}</span>
                                <span style={{ fontSize: "12px", color: C.gray700, fontWeight: "500" }}>{f.value || "—"}</span>
                              </div>
                            ))}
                          </div>
                          {item?.Status && (
                            <div style={{ marginTop: "8px" }}>
                              <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", background: C.gray100, color: C.gray600 }}>{item.Status}</span>
                            </div>
                          )}
                          <div style={{ marginTop: "10px" }}><ViewBtn onClick={() => { }} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

          </div>
        )}

      </div>
    </>
  );
}

export default PatientEncounterHistory;
