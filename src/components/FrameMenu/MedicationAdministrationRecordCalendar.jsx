import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import jsQR from "jsqr";
import Webcam from "react-webcam";
import {
  BindMedicineGrid,
  BindMedicineDetail,
  MedicineDetailsSave,
  DiscontinueMedicine,
  AddOutsideMedication,
  GetOutsideMedication,
  MedicineFreQuency,
  MedicineRoute,
  MedicineTimes,
  VerifiedMedicineByQrCode,
} from "../../networkServices/nursingWardAPI";
import { notify, handleReactSelectDropDownOptions } from "../../utils/utils";
import { GetTimeDuration } from "../../networkServices/BillingsApi";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { useTranslation } from "react-i18next";
// SRSSAIH-2026-0061 Point 7 Slice F — renders nothing unless the flag is on
import {
  usePharmacySubstitutionLog,
  SubstitutionNote,
} from "../commonComponents/PharmacySubstitutionNote";
import OutsideMecationTable from "../UI/customTable/NursingWard/OutsideMecationTable";
import Modal from "../modalComponent/Modal";
import Confirm from "../modalComponent/Confirm";

const DEFAULT_CATEGORY_ID = 5;

const MONTH_MAP = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseScheduleDate(str) {
  if (!str) return null;
  const parts = String(str).split("-");
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const mon = MONTH_MAP[parts[1]];
  let year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || mon === undefined || Number.isNaN(year)) return null;
  if (year < 100) year += 2000;
  return new Date(year, mon, day);
}

function parseScheduleDateTime(dateStr, timeStr) {
  const d = parseScheduleDate(dateStr);
  if (!d) return null;
  if (!timeStr) return d;
  const m = String(timeStr)
    .trim()
    .match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return d;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  d.setHours(h, min, 0, 0);
  return d;
}

function toDateString(date) {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

function to24HourTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function toLocalDateTimeInput(date) {
  return `${toDateString(date)}T${to24HourTime(date)}`;
}

function format12Hour(timeStr) {
  if (!timeStr) return "";
  return String(timeStr).trim();
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function parseEntryDate(str) {
  if (!str) return "";
  const m = String(str).match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/);
  if (!m) return "";
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  const mon = MONTH_MAP[m[2]] ?? 0;
  const day = parseInt(m[1], 10);
  return toDateString(new Date(year, mon, day));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

const MED_PALETTE = [
  ["#5b21b6", "#8b5cf6"],
  ["#27500A", "#5AA12A"],
  ["#633806", "#C28D3A"],
  ["#791F1F", "#D34D4D"],
  ["#4A148C", "#9C5BD4"],
  ["#01579B", "#4FC3F7"],
  ["#1B5E20", "#66BB6A"],
  ["#3E2723", "#8D6E63"],
  ["#33691E", "#9CCC65"],
  ["#0D47A1", "#42A5F5"],
];

function medAccent(name) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return MED_PALETTE[h % MED_PALETTE.length];
}

function medInitial(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  return s.charAt(0).toUpperCase();
}

function formatClock(d) {
  return `${pad2(d.getDate())}-${MONTH_SHORT[d.getMonth()]}-${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function parseGivenDateTime(str) {
  if (!str) return null;
  const m = String(str)
    .trim()
    .match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  const mon = MONTH_MAP[m[2]] ?? 0;
  const day = parseInt(m[1], 10);
  let h = parseInt(m[4], 10);
  const min = parseInt(m[5], 10);
  const ampm = (m[6] || "").toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return new Date(year, mon, day, h, min, 0, 0);
}

function computeStatus(row, nowMs) {
  const v = Number(row?.MedicineStatusValue);
  if (v === 5) return "notneed";
  if (row?.GivenDateTime) {
    if (v === 3) return "given-late";
    const sched = parseScheduleDateTime(row?.ScheduleDate, row?.ScheduleTime);
    const given = parseGivenDateTime(row.GivenDateTime);
    if (sched && given && (given.getTime() - sched.getTime()) / 60000 > 60)
      return "given-late";
    return "given";
  }
  if (v === 2) return "given";
  if (v === 3) return "given-late";
  const dt = parseScheduleDateTime(row?.ScheduleDate, row?.ScheduleTime);
  if (!dt) return v === 4 ? "upcoming" : v === 1 ? "missed" : "upcoming";
  const diff = (nowMs - dt.getTime()) / 60000;
  if (diff < -60) return "upcoming";
  if (diff <= 60) return "givenow";
  if (diff <= 240) return "delayed";
  return "missed";
}

function getMedicineKey(med) {
  return `${med?.IndentNo ?? ""}_${med?.ItemID ?? ""}`;
}

function isMedicineStopped(med) {
  const value = med?.IsStopped;
  const status = String(med?.STATUS || "").toLowerCase();
  return (
    value === true ||
    Number(value) === 1 ||
    String(value).toLowerCase() === "true" ||
    status === "stopped" ||
    status === "medicine discontinued"
  );
}

function getStoppedTitle(med) {
  const parts = ["Medicine discontinued"];
  if (med?.StoppedDate) parts.push(`on ${med.StoppedDate}`);
  if (med?.StoppedByName) parts.push(`by ${med.StoppedByName}`);
  return parts.join(" ");
}

function getStoppedAt(med) {
  const stoppedValue =
    med?.StoppedDate ||
    med?.StoppedDateTime ||
    med?.StopDate ||
    med?.DiscontinuedDate;
  if (!stoppedValue) return null;
  const parsed = parseGivenDateTime(stoppedValue);
  if (parsed) return parsed;
  const nativeDate = new Date(stoppedValue);
  return Number.isNaN(nativeDate.getTime()) ? null : nativeDate;
}

function isDoseAfterStopped(med, row) {
  if (!isMedicineStopped(med)) return false;
  const stoppedAt = getStoppedAt(med);
  if (!stoppedAt) return true;
  const scheduleAt = parseScheduleDateTime(
    row?.ScheduleDate,
    row?.ScheduleTime,
  );
  if (!scheduleAt) return true;
  return scheduleAt.getTime() >= stoppedAt.getTime();
}

// Scan-to-verify window: QR scan is offered 4 hours before and 4 hours after
// the scheduled dose time.
const SCAN_WINDOW_MS = 4 * 60 * 60 * 1000;

// Unique key for a single scheduled dose (medicine + specific slot).
function getDoseKey(med, row) {
  return `${med?.IndentNo ?? ""}_${med?.ItemID ?? ""}_${row?.PatientMedicineReqID ?? ""}`;
}

function isWithinScanWindow(row, nowMs) {
  const dt = parseScheduleDateTime(row?.ScheduleDate, row?.ScheduleTime);
  if (!dt) return false;
  return Math.abs(nowMs - dt.getTime()) <= SCAN_WINDOW_MS;
}

// Verification state: 0 = pending, 1 = verified, 2 = need to check.
// A client-side override (set right after scanning) wins over the value the
// backend returned with the dose row.
function resolveVerifyStatus(med, row, verifyMap) {
  const key = getDoseKey(med, row);
  if (verifyMap && Object.prototype.hasOwnProperty.call(verifyMap, key)) {
    return verifyMap[key];
  }
  return Number(row?.IsVerified) || 0;
}

export default function MedicationAdministrationRecordCalendar({ data }) {
  const initialState = {
    transactionID: "",
    patientID: "",
    medicineName: "",
    qty: 1,
    dose: 1,
    frequency: "",
    route: "",
    duration: "",
    entryBy: "",
  };
  const localData = useLocalStorage("userData", "get");
  const transactionID = data?.transactionID || data?.TransactionID || data?.TID;
  const patientID = data?.patientID || data?.PatientID || data?.PID;

  /* SRSSAIH-2026-0061 P7F — what the pharmacy actually handed over.

     This is the screen the substitution matters most on. Somebody is about to give a
     medicine to a patient, and on a client running PanelSubstituteSkipIndentUpdate = 1 the
     chart still names what the ward ORDERED, not what the pharmacy dispensed. The lookup
     matches either id, so the note is correct whichever way that flag is set. */
  const { lookup: substitutionFor } = usePharmacySubstitutionLog({
    transactionID,
    patientID,
  });
  const [t] = useTranslation();
  const [allMeds, setAllMeds] = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailProgress, setDetailProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [modal, setModal] = useState(null); // { med, row }
  const [modalForm, setModalForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [discontinuingKey, setDiscontinuingKey] = useState("");
  const [discontinueConfirm, setDiscontinueConfirm] = useState({
    show: false,
    med: null,
  });
  const [listOpen, setListOpen] = useState(false);
  const [scanModal, setScanModal] = useState(null); // { med, row }
  const [verifyMap, setVerifyMap] = useState({}); // doseKey -> 0|1|2
  const [verifying, setVerifying] = useState(false);
  const refreshTimerRef = useRef(null);
  const [outsideMediData, setOutsideMediData] = useState([]);
  const [values, setValues] = useState({});
  const [state, setState] = useState(initialState);
  const [showOutSide, setShowOutside] = useState(false);
  const [medicationAdmiTionList, setMedicationAdmiTionList] = useState({
    medicineTime: [],
    MedicineRoute: [],
    MedicineFreQuency: [],
    durationOptions: [],
  });

  const handleItemSelect = (itemName, itemID, item, type, e, index) => {
    setState((prev) => ({
      ...prev,
      medicineName: itemName,
    }));
  };

  const BindMedicineListItem = async () => {
    try {
      Promise.all([
        MedicineTimes(),
        MedicineRoute(),
        MedicineFreQuency(),
        GetTimeDuration(),
      ]).then(
        ([medicineTime, MedicineRoute, MedicineFreQuency, durationOptions]) => {
          setMedicationAdmiTionList((val) => ({
            ...val,
            medicineTime: medicineTime?.data,
            MedicineRoute: handleReactSelectDropDownOptions(
              MedicineRoute?.data,
              "Route",
              "Route",
            ),
            MedicineFreQuency: handleReactSelectDropDownOptions(
              MedicineFreQuency?.data,
              "Frequency",
              "Frequency",
            ),
            durationOptions: handleReactSelectDropDownOptions(
              durationOptions?.data,
              "Duration",
              "Duration",
            ),
          }));
        },
      );
    } catch (error) {
      console.log("error", error);
    }
  };

  const outMedicineThead = [
    { width: "2%", name: " " },
    { width: "2%", name: t("SNO") },
    { width: "20%", name: t("MedicineName") },
    { width: "20%", name: t("EntryDateTime") },
    { width: "20%", name: t("OrderQty") },
    { width: "20%", name: t("IssuedQty") },
    { width: "20%", name: t("GivenQty") },
    { width: "20%", name: t("RemainingQty") },
    t("Dose"),
    t("Time"),
    t("Route"),
    t("Duration"),
    t("Status"),
    t("EntryBy"),
  ];
  const refreshOutsideMedications = () => {
    GetOutsideMedications();
  };

  const handleSaveOutsideMedication = async () => {
    if (!state?.medicineName) {
      notify(t("Please enter medicine name"), "error");
      return;
    }
    if (!state?.qty) {
      notify(t("Please enter quantity"), "error");
      return;
    }
    if (!state?.dose) {
      notify(t("Please enter dose"), "error");
      return;
    }
    if (!state?.frequency) {
      notify(t("Please enter frequency"), "error");
      return;
    }
    if (!state?.route) {
      notify(t("Please enter route"), "error");
      return;
    }
    if (!state?.duration) {
      notify(t("Please enter duration"), "error");
      return;
    }
    const payload = {
      transactionID: data?.transactionID || data?.TransactionID,
      patientID: data?.patientID || data?.PatientID,
      entryBy: localData?.employeeID,
      qty: state?.qty,
      medicineName: state?.medicineName,
      duration: state?.duration?.value || state?.duration,
      frequency: state?.frequency?.value || state?.frequency,
      route: state?.route?.value || state?.route,
      dose: state?.dose,
    };
    try {
      const apiResp = await AddOutsideMedication(payload);
      if (apiResp?.success) {
        notify(apiResp?.message, "success");
        GetOutsideMedications();
        setState({ ...initialState });
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error("Error Add Expense", error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleReactSelectChange = (name, value) => {
    setState((prev) => ({ ...prev, [name]: value }));
  };
  const GetOutsideMedications = async () => {
    const apiResp = await GetOutsideMedication(
      data?.transactionID || data?.TransactionID,
    );
    debugger;
    if (apiResp?.success) {
      setOutsideMediData(apiResp?.data);
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const loadAll = useCallback(async () => {
    if (!transactionID) {
      setError("No patient transaction ID provided");
      return;
    }
    setError(null);
    setLoadingGrid(true);
    try {
      const gridResp = await BindMedicineGrid({
        tid: transactionID,
        categoryID: DEFAULT_CATEGORY_ID,
      });
      if (!gridResp?.success) {
        throw new Error(gridResp?.message || "Failed to load medicine grid");
      }
      const raw = Array.isArray(gridResp.data) ? gridResp.data : [];
      const seen = new Set();
      const filtered = [];
      for (const row of raw) {
        if (!row?.Timing || String(row.Timing).trim() === "") continue;
        if (!row?.Duration) continue;
        if (Number(row?.isCancel) === 1) continue;
        const key = `${row.IndentNo}_${row.ItemID}`;
        if (seen.has(key)) continue;
        seen.add(key);
        filtered.push(row);
      }
      setAllMeds(filtered);
      setLoadingGrid(false);

      setLoadingDetails(true);
      setDetailProgress({ done: 0, total: filtered.length });
      let completed = 0;
      const detailResults = await Promise.all(
        filtered.map(async (med) => {
          const resp = await BindMedicineDetail({
            tid: transactionID,
            itemID: med.ItemID,
            indentNo: med.IndentNo,
          });
          completed += 1;
          setDetailProgress({ done: completed, total: filtered.length });
          return {
            key: `${med.IndentNo}_${med.ItemID}`,
            rows: Array.isArray(resp?.data) ? resp.data : [],
          };
        }),
      );
      const map = {};
      for (const r of detailResults) map[r.key] = r.rows;
      setScheduleMap(map);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load");
    } finally {
      setLoadingGrid(false);
      setLoadingDetails(false);
    }
  }, [transactionID]);

  useEffect(() => {
    loadAll();
    BindMedicineListItem();
  }, [loadAll]);

  useEffect(() => {
    GetOutsideMedications();
    const tick = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    refreshTimerRef.current = setInterval(
      () => {
        loadAll();
      },
      5 * 60 * 1000,
    );
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [loadAll]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const calMeds = useMemo(() => {
    const weekStartMs = weekStart.getTime();
    const weekEndMs = addDays(weekStart, 7).getTime();
    return allMeds.filter((m) => {
      const rows = scheduleMap[`${m.IndentNo}_${m.ItemID}`];
      if (!Array.isArray(rows) || rows.length === 0) return false;
      return rows.some((r) => {
        const d = parseScheduleDate(r.ScheduleDate);
        if (!d) return false;
        const t = d.getTime();
        return t >= weekStartMs && t < weekEndMs;
      });
    });
  }, [allMeds, scheduleMap, weekStart]);

  const stats = useMemo(() => {
    let given = 0,
      giveNow = 0,
      delayed = 0,
      missed = 0,
      upcoming = 0,
      discontinued = 0;
    const nowMs = now.getTime();
    for (const med of allMeds) {
      const rows = scheduleMap[`${med.IndentNo}_${med.ItemID}`] || [];
      if (isMedicineStopped(med) && rows.length === 0) {
        discontinued += 1;
        continue;
      }
      for (const row of rows) {
        if (isDoseAfterStopped(med, row)) {
          discontinued += 1;
          continue;
        }
        const s = computeStatus(row, nowMs);
        if (s === "given" || s === "given-late" || s === "notneed") given += 1;
        else if (s === "givenow") giveNow += 1;
        else if (s === "delayed") delayed += 1;
        else if (s === "missed") missed += 1;
        else upcoming += 1;
      }
    }
    return { given, giveNow, delayed, missed, upcoming, discontinued };
  }, [allMeds, scheduleMap, now]);

  const stoppedWeekCount = useMemo(
    () => calMeds.filter((med) => isMedicineStopped(med)).length,
    [calMeds],
  );
  const activeWeekCount = calMeds.length - stoppedWeekCount;

  const monthLabel = useMemo(() => {
    const startM = MONTH_SHORT[weekStart.getMonth()];
    const end = addDays(weekStart, 6);
    const endM = MONTH_SHORT[end.getMonth()];
    if (startM === endM) return `${startM} ${end.getFullYear()}`;
    return `${startM} / ${endM} ${end.getFullYear()}`;
  }, [weekStart]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function openGiveModal(med, row, statusKind) {
    if (isDoseAfterStopped(med, row)) {
      notify(t("Medicine is discontinued. Dose entry is locked."), "warn");
      return;
    }
    const dt =
      parseScheduleDateTime(row.ScheduleDate, row.ScheduleTime) || new Date();
    setModal({ med, row, statusKind });
    setModalForm({
      noNeed: false,
      givenAt: toLocalDateTimeInput(new Date()),
      by: localData?.employeeName || localData?.UserName || "",
      remark: "",
      windowClose: new Date(dt.getTime() + 2 * 60 * 60 * 1000),
      scheduledDateTime: dt,
    });
  }

  function closeModal() {
    setModal(null);
    setModalForm(null);
  }

  async function confirmGive() {
    if (!modal || !modalForm) return;
    const { med, row } = modal;
    const isNoNeed = modalForm.noNeed;
    const givenDate = isNoNeed ? new Date() : new Date(modalForm.givenAt);
    if (Number.isNaN(givenDate.getTime())) {
      notify(t("Invalid date/time"), "error");
      return;
    }
    const payload = {
      id: 0,
      transactionID: String(row?.TransactionID ?? transactionID ?? ""),
      IsGiven: isNoNeed ? 0 : 1,
      PatientMedicineReqID: Number(row?.PatientMedicineReqID) || 0,
      indentNo: String(med?.IndentNo ?? ""),
      itemID: String(med?.ItemID ?? ""),
      itemName: med?.ItemName || "",
      issueDate: parseEntryDate(med?.DATE) || toDateString(givenDate),
      date: toDateString(givenDate),
      time: to24HourTime(givenDate),
      dose: med?.Dose ?? "",
      statusType: med?.STATUS || "",
      remark: modalForm.remark || "",
      qty: 1,
      frequency: String(med?.Timing ?? ""),
      route: med?.Route || "",
      status: isNoNeed ? "NoNeed" : "",
    };

    setSaving(true);
    try {
      const resp = await MedicineDetailsSave(payload);
      if (resp?.success) {
        notify(resp?.message || "Saved", "success");
        closeModal();
        setSaving(false);
        loadAll();
        return;
      }
      notify(resp?.message || "Save failed — not marked as given", "error");
    } catch (e) {
      notify(t("Network error — not marked as given"), "error");
    } finally {
      setSaving(false);
    }
  }

  function openScan(med, row) {
    if (isDoseAfterStopped(med, row)) {
      notify(t("Medicine is discontinued. Scanning is locked."), "warn");
      return;
    }
    setScanModal({ med, row });
  }

  function closeScan() {
    setScanModal(null);
  }

  // Called with the raw text decoded from the medicine QR label.
  async function handleScanDecoded(rawText) {
    if (!scanModal) return;
    const { med, row } = scanModal;

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    // QR payload printed by Pharmacy/PharmacyPrintBarcode:
    // { transactionID, itemID, noOfPrint, indentno }. Be tolerant of casing.
    const scannedItem = String(parsed?.itemID ?? parsed?.ItemID ?? "").trim();
    const scannedIndent = String(
      parsed?.indentno ?? parsed?.indentNo ?? parsed?.IndentNo ?? "",
    ).trim();

    const expectedTxn = String(transactionID ?? "").trim();
    const expectedItem = String(med?.ItemID ?? "").trim();
    const expectedIndent = String(med?.IndentNo ?? "").trim();

    // Match on ItemID + IndentNo only — TransactionID is NOT part of the
    // verification check (the same medicine label is valid regardless of the
    // transaction it was printed under).
    const matched =
      !!scannedItem &&
      !!scannedIndent &&
      scannedItem === expectedItem &&
      scannedIndent === expectedIndent;

    // IsVerified: 0 = Pending scan, 1 = Verified, 2 = Need To Check (mismatch).
    const isVerified = matched ? 1 : 2;
    const doseKey = getDoseKey(med, row);

    // The DB row is located by TransactionID + ItemID + IndentNo, so the
    // payload keeps this dose's own identifiers; isVerified reflects whether the
    // scanned ItemID + IndentNo matched.
    const payload = {
      transactionID: expectedTxn,
      itemID: expectedItem,
      indentNo: expectedIndent,
      orderId: Number(row?.PatientMedicineReqID ?? row?.OrderID) || 0,
      isVerified,
      remark: matched
        ? "Verified via QR scan"
        : `QR mismatch (scanned ItemID/IndentNo: ${scannedItem}/${scannedIndent})`,
    };

    setVerifying(true);
    try {
      const resp = await VerifiedMedicineByQrCode(payload, localData?.employeeID);
      if (resp?.success) {
        setVerifyMap((prev) => ({ ...prev, [doseKey]: isVerified }));
        notify(
          matched
            ? "Verified successfully."
            : "QR mismatch — marked Need To Check with pharmacy.",
          matched ? "success" : "warn",
        );
      } else {
        notify(resp?.message || "Verification failed", "error");
      }
    } catch (e) {
      notify(t("Network error during verification"), "error");
    } finally {
      setVerifying(false);
      closeScan();
    }
  }

  function openDiscontinueConfirm(med) {
    if (!med || isMedicineStopped(med)) return;
    setDiscontinueConfirm({
      show: true,
      med,
    });
  }

  async function handleDiscontinueMedicine(med) {
    if (!med || isMedicineStopped(med)) {
      setDiscontinueConfirm({ show: false, med: null });
      return;
    }
    if (!transactionID || !patientID || !med?.ItemID || !med?.IndentNo) {
      notify(t("Missing details to discontinue medicine"), "error");
      return;
    }

    const medKey = getMedicineKey(med);
    const payload = {
      TransactionID: String(transactionID),
      PatientID: String(patientID),
      MedicineID: String(med.ItemID),
      IndentNo: String(med.IndentNo),
    };

    setDiscontinuingKey(medKey);
    try {
      const resp = await DiscontinueMedicine(payload);
      if (resp?.success) {
        notify(resp?.message || "Medicine discontinued", "success");
        setDiscontinueConfirm({ show: false, med: null });
        setAllMeds((prev) =>
          prev.map((item) =>
            getMedicineKey(item) === medKey
              ? {
                  ...item,
                  IsStopped: 1,
                  StoppedDate: item.StoppedDate || formatClock(new Date()),
                  StoppedByName:
                    item.StoppedByName ||
                    localData?.employeeName ||
                    localData?.UserName,
                }
              : item,
          ),
        );
        loadAll();
        return;
      }
      notify(resp?.message || "Unable to discontinue medicine", "error");
    } catch (e) {
      notify(t("Network error — medicine not discontinued"), "error");
    } finally {
      setDiscontinuingKey("");
    }
  }

  return (
    <div className="mar-cal-root">
      <style>{MAR_CAL_CSS}</style>

      <div className="mar-cal-stats mar-cal-stats-top">
        <StatCard
          label={t("Given")}
          value={stats.given}
          color="#27500A"
          bg="#EAF3DE"
        />
        <StatCard
          label={t("Give Now")}
          value={stats.giveNow}
          color="#15803d"
          bg="#16a34a"
          pillColor="#fff"
        />
        <StatCard
          label={t("Delayed")}
          value={stats.delayed}
          color="#b45309"
          bg="#d97706"
          pillColor="#fff"
        />
        <StatCard
          label={t("Missed")}
          value={stats.missed}
          color="#791F1F"
          bg="#FCEBEB"
        />
        <StatCard
          label={t("Upcoming")}
          value={stats.upcoming}
          color="#1d4ed8"
          bg="#2563eb"
          pillColor="#fff"
        />
        <StatCard
          label={t("Discontinued")}
          value={stats.discontinued}
          color="#8A1F2D"
          bg="#FCE7EA"
        />
      </div>

      <div className="mar-cal-hero">
        <div className="mar-cal-title">
          <i
            className="fa fa-clipboard-list mar-cal-title-icon"
            aria-hidden="true"
          />
          <span className="mar-cal-title-main">{t("MAR")}</span>
          <span className="mar-cal-title-sub">
            · {activeWeekCount} {t("active")}
            {stoppedWeekCount > 0 ? ` · ${stoppedWeekCount} D/C` : ""}
          </span>
        </div>
        <div className="mar-cal-weeknav">
          <button
            className="mar-cal-navbtn"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            aria-label="Previous week"
          >
            <i className="fa fa-chevron-left" />
          </button>
          <div className="mar-cal-monthlabel">{monthLabel}</div>
          <button
            className="mar-cal-navbtn"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            aria-label="Next week"
          >
            <i className="fa fa-chevron-right" />
          </button>
          <button
            className="mar-cal-btn mar-cal-btn-today"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            {t("Today")}
          </button>
        </div>
        <div className="mar-cal-toolbar-right">
          <button
            type="button"
            className="mar-cal-btn mar-cal-btn-hero"
            onClick={() => setShowOutside(!showOutSide)}
            title={t("View medicine list")}
          >
            {t("OutSide Medication")}
          </button>
          <button
            type="button"
            className="mar-cal-btn mar-cal-btn-hero"
            onClick={() => setListOpen(true)}
            title={t("View medicine list")}
          >
            <i className="fa fa-list" aria-hidden="true" /> {t("List")}
          </button>
          <span className="mar-cal-clock">{formatClock(now)}</span>
          <button
            type="button"
            className="mar-cal-btn mar-cal-btn-hero"
            onClick={loadAll}
            disabled={loadingGrid || loadingDetails}
            title={t("Refresh")}
          >
            <i className="fa fa-sync" aria-hidden="true" />
          </button>
        </div>
      </div>

      {showOutSide && (
        <Modal
          visible={showOutSide}
          setVisible={setShowOutside}
          modalWidth={"90vw"}
          Header={t("Outside Medication")}
          footer={<></>}
        >
          <OutsideMecationTable
            outsideMediData={outsideMediData}
            outMedicineThead={outMedicineThead}
            onDataUpdate={refreshOutsideMedications}
            handleSaveOutsideMedication={handleSaveOutsideMedication}
            handleChange={handleChange}
            handleReactSelectChange={handleReactSelectChange}
            values={values}
            state={state}
            setState={setState}
            medicineFrequency={medicationAdmiTionList?.MedicineFreQuency}
            durationOptions={medicationAdmiTionList?.durationOptions}
            medicineRoute={medicationAdmiTionList?.MedicineRoute}
            pateintDetails={data}
            handleItemSelect={handleItemSelect}
          />
        </Modal>
      )}
      {error && (
        <div className="mar-cal-error">
          <div>{error}</div>
          <button className="mar-cal-btn mar-cal-btn-danger" onClick={loadAll}>
            {t("Retry")}
          </button>
        </div>
      )}

      {(loadingGrid || loadingDetails) && (
        <div className="mar-cal-loading">
          <div className="mar-cal-spinner" />
          <div>
            {loadingGrid && t("Fetching medicine list...")}
            {!loadingGrid &&
              loadingDetails &&
              `Loading schedules for ${detailProgress.total} medicines... (${detailProgress.done}/${detailProgress.total})`}
          </div>
        </div>
      )}

      <CalendarGrid
        weekDays={weekDays}
        meds={calMeds}
        scheduleMap={scheduleMap}
        nowMs={now.getTime()}
        today={today}
        onGive={openGiveModal}
        onScan={openScan}
        verifyMap={verifyMap}
        onDiscontinue={openDiscontinueConfirm}
        discontinuingKey={discontinuingKey}
        substitutionFor={substitutionFor}
      />

      <Legend />

      {listOpen && (
        <MedicineListModal
          meds={allMeds}
          onClose={() => setListOpen(false)}
          substitutionFor={substitutionFor}
        />
      )}

      {modal && modalForm && (
        <GiveModal
          modal={modal}
          /* The moment of administration. If this medicine went out in place of another,
             this is the last screen that can say so before it reaches the patient. */
          substitution={substitutionFor(
            modal?.med?.IndentNo,
            modal?.med?.ItemID,
          )}
          form={modalForm}
          setForm={setModalForm}
          onCancel={closeModal}
          onConfirm={confirmGive}
          saving={saving}
        />
      )}

      {scanModal && (
        <QrScanModal
          med={scanModal.med}
          row={scanModal.row}
          verifying={verifying}
          onDecoded={handleScanDecoded}
          onClose={closeScan}
        />
      )}

      {discontinueConfirm.show && (
        <Confirm
          confirmBoxvisible={discontinueConfirm}
          lableMessage="Discontinue Medicine"
          alertMessage={`Are you sure you want to discontinue ${
            discontinueConfirm.med?.ItemName || "this medicine"
          }?`}
        >
          <div>
            <button
              type="button"
              className="modalConfirmButton"
              disabled={Boolean(discontinuingKey)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDiscontinueMedicine(discontinueConfirm.med);
              }}
            >
              {discontinuingKey ? t("Processing...") : t("Discontinue")}
            </button>
            <button
              type="button"
              className="modalCancelButton"
              disabled={Boolean(discontinuingKey)}
              onClick={() => setDiscontinueConfirm({ show: false, med: null })}
            >
              {t("Cancel")}
            </button>
          </div>
        </Confirm>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg, pillColor }) {
  const labelColor = pillColor || color;
  return (
    <div className="mar-cal-stat-card" style={{ borderTopColor: color }}>
      <div
        className="mar-cal-stat-pill"
        style={{ background: bg, color: labelColor }}
      >
        {label}
      </div>
      <div className="mar-cal-stat-value" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function MedicineListModal({ meds, onClose, substitutionFor }) {
  const [t] = useTranslation();
  const node = (
    <div className="mar-cal-modal-backdrop" onClick={onClose}>
      <div
        className="mar-cal-modal mar-cal-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mar-cal-modal-head">
          <span>
            <i
              className="fa fa-list"
              aria-hidden="true"
              style={{ marginRight: 8 }}
            />
            {t("Medicine List")}{" "}
            <span style={{ opacity: 0.75, fontWeight: 400, fontSize: 12 }}>
              {t("· Total")} {meds.length}
            </span>
          </span>
          <button className="mar-cal-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="mar-cal-modal-body mar-cal-table-wrap">
          <table className="mar-cal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("Medicine")}</th>
                <th>{t("Entry Date/Time")}</th>
                <th>{t("Order Qty")}</th>
                <th>{t("Issued Qty")}</th>
                <th>{t("Given Qty")}</th>
                <th>{t("Remaining Qty")}</th>
                <th>{t("Dose")}</th>
                <th>{t("Timing")}</th>
                <th>{t("Route")}</th>
                <th>{t("Duration")}</th>
                <th>{t("Status")}</th>
                <th>{t("Entry By")}</th>
              </tr>
            </thead>
            <tbody>
              {meds.length === 0 ? (
                <tr>
                  <td colSpan={13} className="mar-cal-empty-row">
                    {t("No medicines scheduled")}
                  </td>
                </tr>
              ) : (
                meds.map((m, i) => {
                  const stopped = isMedicineStopped(m);
                  return (
                    <tr
                      key={`${m.IndentNo}_${m.ItemID}`}
                      className={stopped ? "mar-cal-table-row-stopped" : ""}
                    >
                      <td>{i + 1}</td>
                      <td>
                        {m.ItemName}
                        <SubstitutionNote
                          entry={substitutionFor?.(m.IndentNo, m.ItemID)}
                        />
                      </td>
                      <td>{m.DATE}</td>
                      <td>{m.IssueQty ?? "—"}</td>
                      <td>{m.ReceiveQty ?? m.IssueQty ?? "—"}</td>
                      <td>{m.GivenQty || 0}</td>
                      <td>{m.RemainingQty ?? "—"}</td>
                      <td>{m.Dose}</td>
                      <td>{m.TimingDisplay || m.Timing}</td>
                      <td>{m.Route}</td>
                      <td>{m.Duration}</td>
                      <td>{stopped ? getStoppedTitle(m) : m.STATUS}</td>
                      <td>{m.EName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mar-cal-modal-foot">
          <button className="mar-cal-btn mar-cal-btn-ghost" onClick={onClose}>
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(node, document.body);
}

function CalendarGrid({
  weekDays,
  meds,
  scheduleMap,
  nowMs,
  today,
  onGive,
  onScan,
  verifyMap,
  onDiscontinue,
  discontinuingKey,
  substitutionFor,
}) {
  const [t] = useTranslation();
  return (
    <div className="mar-cal-grid-wrap">
      <div className="mar-cal-grid">
        <div className="mar-cal-sticky-backdrop" aria-hidden="true" />
        <div className="mar-cal-grid-cell mar-cal-grid-head mar-cal-grid-medcol">
          {t("Medicine")}
        </div>
        {weekDays.map((d) => {
          const isToday = d.getTime() === today.getTime();
          const dow = d.getDay();
          const isWeekend = dow === 0 || dow === 6;
          return (
            <div
              key={`h-${d.toISOString()}`}
              className={`mar-cal-grid-cell mar-cal-grid-head ${isToday ? "mar-cal-today" : ""} ${isWeekend && !isToday ? "mar-cal-weekend" : ""}`}
            >
              <div className="mar-cal-dayname">{DAY_SHORT[d.getDay()]}</div>
              <div className="mar-cal-daynum">{d.getDate()}</div>
              <div className="mar-cal-daymo">{MONTH_SHORT[d.getMonth()]}</div>
            </div>
          );
        })}

        {meds.length === 0 ? (
          <div
            className="mar-cal-grid-cell mar-cal-grid-empty"
            style={{ gridColumn: "1 / span 8" }}
          >
            {t("No medicines to display")}
          </div>
        ) : (
          meds.map((med) => {
            const medKey = getMedicineKey(med);
            const rows = scheduleMap[medKey] || [];
            const byDate = {};
            for (const r of rows) {
              const d = parseScheduleDate(r.ScheduleDate);
              if (!d) continue;
              const key = toDateString(d);
              (byDate[key] = byDate[key] || []).push(r);
            }
            const [c1, c2] = medAccent(med.ItemName);
            const qOrder = med.IssueQty ?? "—";
            const qIssued = med.ReceiveQty ?? med.IssueQty ?? "—";
            const qGiven = med.GivenQty || 0;
            const qRem = med.RemainingQty ?? "—";
            const stopped = isMedicineStopped(med);
            const stoppedTitle = getStoppedTitle(med);
            const stoppedAt = getStoppedAt(med);
            return (
              <React.Fragment key={`row-${medKey}`}>
                <div
                  className={`mar-cal-grid-cell mar-cal-grid-medcol mar-cal-medinfo ${stopped ? "mar-cal-medinfo-stopped" : ""}`}
                  style={{ "--mar-accent": c1, "--mar-accent-2": c2 }}
                >
                  <div
                    className="mar-cal-medavatar"
                    style={{
                      background: stopped
                        ? "linear-gradient(135deg, #8A1F2D 0%, #B55D66 100%)"
                        : `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                    }}
                  >
                    {medInitial(med.ItemName)}
                  </div>
                  <div className="mar-cal-medinfo-text">
                    <div className="mar-cal-medname" title={med.ItemName}>
                      {med.ItemName}
                    </div>
                    <SubstitutionNote
                      entry={substitutionFor?.(med.IndentNo, med.ItemID)}
                      compact
                    />
                    <div className="mar-cal-med-actions">
                      {stopped ? (
                        <span
                          className="mar-cal-stopped-badge"
                          title={stoppedTitle}
                        >
                          <i className="fa fa-ban" aria-hidden="true" /> D/C
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="mar-cal-dc-btn"
                          onClick={() => onDiscontinue(med)}
                          disabled={discontinuingKey === medKey}
                          title={t("Discontinue medicine")}
                        >
                          {discontinuingKey === medKey ? (
                            <>
                              <span className="mar-cal-spinner-sm" /> D/C
                            </>
                          ) : (
                            <>
                              <i className="fa fa-ban" aria-hidden="true" /> D/C
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="mar-cal-medmeta">
                      {(med.Route || "").trim()} ·{" "}
                      {med.TimingDisplay || med.Timing}
                    </div>
                    <div
                      className={`mar-cal-medstatus ${stopped ? "mar-cal-medstatus-stopped" : ""}`}
                      title={stopped ? stoppedTitle : med.STATUS}
                    >
                      {stopped ? t("Discontinued") : med.STATUS}
                    </div>
                    <div
                      className="mar-cal-medqty"
                      title={`Order ${qOrder} · Issued ${qIssued} · Given ${qGiven} · Remaining ${qRem}`}
                    >
                      <span className="mar-cal-qty-pill mar-cal-qty-order">
                        <b>{t("Ord")}</b>
                        {qOrder}
                      </span>
                      <span className="mar-cal-qty-pill mar-cal-qty-issued">
                        <b>{t("Iss")}</b>
                        {qIssued}
                      </span>
                      <span className="mar-cal-qty-pill mar-cal-qty-given">
                        <b>{t("Giv")}</b>
                        {qGiven}
                      </span>
                      <span className="mar-cal-qty-pill mar-cal-qty-rem">
                        <b>{t("Rem")}</b>
                        {qRem}
                      </span>
                    </div>
                  </div>
                </div>
                {weekDays.map((d) => {
                  const key = toDateString(d);
                  const cellRows = byDate[key] || [];
                  const isToday = d.getTime() === today.getTime();
                  const hasStoppedDose = cellRows.some((row) =>
                    isDoseAfterStopped(med, row),
                  );
                  const isAfterStoppedDate =
                    stopped &&
                    stoppedAt &&
                    d.getTime() >=
                      new Date(
                        stoppedAt.getFullYear(),
                        stoppedAt.getMonth(),
                        stoppedAt.getDate(),
                      ).getTime();
                  if (cellRows.length === 0) {
                    return (
                      <div
                        key={`c-${medKey}-${key}`}
                        className={`mar-cal-grid-cell mar-cal-cell-empty ${isToday ? "mar-cal-today" : ""} ${isAfterStoppedDate ? "mar-cal-cell-stopped-soft" : ""}`}
                        title={isAfterStoppedDate ? stoppedTitle : undefined}
                      />
                    );
                  }
                  return (
                    <div
                      key={`c-${medKey}-${key}`}
                      className={`mar-cal-grid-cell ${isToday ? "mar-cal-today" : ""} ${hasStoppedDose ? "mar-cal-cell-stopped" : ""}`}
                      title={hasStoppedDose ? stoppedTitle : undefined}
                    >
                      {cellRows.map((row) => (
                        <DoseChip
                          key={`chip-${row.PatientMedicineReqID}`}
                          med={med}
                          row={row}
                          nowMs={nowMs}
                          onGive={onGive}
                          onScan={onScan}
                          verifyStatus={resolveVerifyStatus(med, row, verifyMap)}
                          isStopped={isDoseAfterStopped(med, row)}
                          stoppedTitle={stoppedTitle}
                        />
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}

function DoseChip({
  med,
  row,
  nowMs,
  onGive,
  onScan,
  verifyStatus = 0,
  isStopped,
  stoppedTitle,
}) {
  const [t] = useTranslation();
  const status = computeStatus(row, nowMs);
  const timeLabel = format12Hour(row.ScheduleTime);
  const withinScan = isWithinScanWindow(row, nowMs);
  const verified = verifyStatus === 1;
  const needCheck = verifyStatus === 2;

  const verifyBadge = verified ? (
    <span
      className="mar-cal-verify-badge mar-cal-verify-ok"
      title={t("Verified via QR scan")}
    >
      ✓
    </span>
  ) : needCheck ? (
    <span
      className="mar-cal-verify-badge mar-cal-verify-warn"
      title={t("QR mismatch — need to check with pharmacy")}
    >
      !
    </span>
  ) : (
    <span
      className="mar-cal-verify-badge mar-cal-verify-pending"
      title={t("Pending QR verification")}
    >
      ?
    </span>
  );

  const scanControl =
    withinScan && !verified ? (
      <button
        type="button"
        className={`mar-cal-scan-btn ${needCheck ? "mar-cal-scan-btn-warn" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onScan(med, row);
        }}
        title={needCheck ? "Need to check — rescan QR" : "Scan QR to verify"}
        aria-label="Scan QR to verify"
      >
        <i className="fa fa-qrcode" aria-hidden="true" />
      </button>
    ) : null;

  if (isStopped && !["given", "given-late", "notneed"].includes(status)) {
    return (
      <div
        className="mar-cal-chip mar-cal-chip-stopped"
        title={stoppedTitle || "Medicine discontinued"}
      >
        {timeLabel}
      </div>
    );
  }

  if (status === "given" || status === "given-late") {
    const byName = row.GivenBy || "";
    const isLate = status === "given-late";
    const verb = isLate ? "Given late" : "Given";
    const parts = [verb];
    if (byName) parts.push(`by ${byName}`);
    if (row.GivenDateTime) parts.push(`at ${row.GivenDateTime}`);
    if (isLate) {
      const sched = parseScheduleDateTime(row.ScheduleDate, row.ScheduleTime);
      const given = parseGivenDateTime(row.GivenDateTime);
      if (sched && given) {
        const diffMin = Math.round((given.getTime() - sched.getTime()) / 60000);
        if (diffMin > 0) {
          const h = Math.floor(diffMin / 60);
          const m = diffMin % 60;
          const lateLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
          parts.push(`(${lateLabel} late)`);
        }
      }
    }
    if (row.Remark) parts.push(`— ${row.Remark}`);
    const tooltip = parts.join(" ");
    return (
      <div
        className={`mar-cal-chip mar-cal-chip-tall ${isLate ? "mar-cal-chip-given-late" : "mar-cal-chip-given"}`}
        title={tooltip}
      >
        <div className="mar-cal-chip-row">
          <span>{timeLabel}</span>
          <span className={`mar-cal-tick ${isLate ? "mar-cal-tick-late" : ""}`}>
            ✓
          </span>
        </div>
        {byName && <div className="mar-cal-chip-by-inline">{t("by")} {byName}</div>}
      </div>
    );
  }
  if (status === "notneed") {
    const byName = row.GivenBy || "";
    return (
      <div
        className="mar-cal-chip mar-cal-chip-notneed mar-cal-chip-tall"
        title={byName ? `Marked not required by ${byName}` : "Not required"}
      >
        <div className="mar-cal-chip-row">
          <span>{timeLabel}</span>
          <span className="mar-cal-tick mar-cal-tick-muted">✓</span>
        </div>
        {byName && (
          <div className="mar-cal-chip-by-inline mar-cal-chip-by-inline-muted">
            {t("by")} {byName}
          </div>
        )}
      </div>
    );
  }
  if (status === "missed") {
    return (
      <div className="mar-cal-chip-wrap">
        <div className="mar-cal-chip mar-cal-chip-missed" title={t("Missed")}>
          {timeLabel}
          {verifyBadge}
        </div>
        {scanControl}
      </div>
    );
  }
  if (status === "upcoming") {
    return (
      <div className="mar-cal-chip-wrap">
        <div className="mar-cal-chip mar-cal-chip-upcoming" title={t("Upcoming")}>
          {timeLabel}
          {verifyBadge}
        </div>
        {scanControl}
      </div>
    );
  }
  if (status === "givenow" || status === "delayed") {
    const isNow = status === "givenow";
    const giveTitle = verified
      ? isNow
        ? "Click to give medicine"
        : "Click to give (delayed)"
      : "Scan the QR code to verify this medicine before giving";
    return (
      <div className="mar-cal-chip-wrap">
        <button
          type="button"
          className={`mar-cal-chip ${
            isNow ? "mar-cal-chip-givenow" : "mar-cal-chip-delayed"
          } mar-cal-chip-clickable ${
            verified ? "mar-cal-chip-blink" : "mar-cal-chip-locked"
          }`}
          onClick={() =>
            verified
              ? onGive(med, row, status)
              : notify(
                  t("Scan the QR code to verify this medicine before giving."),
                  "warn",
                )
          }
          title={giveTitle}
        >
          {!verified && (
            <i className="fa fa-lock mar-cal-chip-lockicon" aria-hidden="true" />
          )}
          {timeLabel}
          {verifyBadge}
        </button>
        {scanControl}
      </div>
    );
  }
  return null;
}

function QrScanModal({ med, row, verifying, onDecoded, onClose }) {
  const [t] = useTranslation();
  const webcamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const stoppedRef = useRef(false);
  const startedRef = useRef(false);
  const onDecodedRef = useRef(onDecoded);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("");
  const [decoding, setDecoding] = useState(false);
  const [msg, setMsg] = useState("");

  const cameraSupported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const secureCtx = typeof window !== "undefined" && window.isSecureContext;
  // Live preview uses getUserMedia, which browsers only allow on HTTPS or
  // localhost. Photo capture (file input) works everywhere — including plain
  // HTTP — because it goes through the device's own camera app.
  const liveAvailable = cameraSupported && secureCtx;

  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);

  // Decoder selection: native BarcodeDetector first, jsQR as the fallback.
  useEffect(() => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["qr_code"],
        });
        setMode("native");
      } catch {
        detectorRef.current = null;
        setMode("jsqr");
      }
    } else {
      detectorRef.current = null;
      setMode("jsqr");
    }
    return () => {
      stoppedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Decode any drawable source (live video frame, <img>, or ImageBitmap).
  // Native detector first; if it finds nothing, fall back to jsQR on pixels.
  async function decodeSource(source, width, height) {
    if (detectorRef.current) {
      try {
        const codes = await detectorRef.current.detect(source);
        if (codes && codes.length > 0 && codes[0].rawValue) {
          return codes[0].rawValue;
        }
      } catch {
        // fall through to jsQR
      }
    }
    if (!width || !height) return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    try {
      ctx.drawImage(source, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, width, height, {
        inversionAttempts: "attemptBoth",
      });
      return result?.data || null;
    } catch {
      return null;
    }
  }

  function finish(value) {
    stoppedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onDecodedRef.current(value);
  }

  // Live preview scan loop (only runs when liveAvailable).
  async function loop() {
    if (stoppedRef.current) return;
    const video = webcamRef.current?.video;
    if (video && video.readyState >= 2 && video.videoWidth) {
      const value = await decodeSource(
        video,
        video.videoWidth,
        video.videoHeight,
      );
      if (value) {
        finish(value);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function handleUserMedia() {
    setReady(true);
    if (!startedRef.current) {
      startedRef.current = true;
      stoppedRef.current = false;
      loop();
    }
  }

  function handleUserMediaError() {
    setErr("Live camera preview is unavailable. Use “Take Photo & Scan” below.");
  }

  // Photo-capture fallback — works on HTTP and on devices without live preview.
  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg("");
    setDecoding(true);
    let url = "";
    try {
      url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const value = await decodeSource(img, w, h);
      if (value) {
        finish(value);
        return;
      }
      setMsg(
        "No QR code found in the photo. Retake it holding the label flat, steady and in focus.",
      );
    } catch {
      setMsg("Could not read that photo. Please try again.");
    } finally {
      if (url) URL.revokeObjectURL(url);
      setDecoding(false);
    }
  }

  const node = (
    <div className="mar-cal-modal-backdrop" onClick={onClose}>
      <div
        className="mar-cal-modal mar-cal-scan-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mar-cal-modal-head">
          <span>
            <i className="fa fa-qrcode" aria-hidden="true" /> {t("Scan QR —")}{" "}
            {med?.ItemName}
          </span>
          <button className="mar-cal-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="mar-cal-modal-body">
          <div className="mar-cal-scan-info">
            <div>
              <strong>{t("Scheduled")}</strong>
            </div>
            <div>
              {row?.ScheduleDate} {row?.ScheduleTime}
            </div>
            <div>
              <strong>{t("Item ID")}</strong>
            </div>
            <div>{med?.ItemID}</div>
            <div>
              <strong>{t("Indent No")}</strong>
            </div>
            <div>{med?.IndentNo}</div>
          </div>
          {liveAvailable && !err ? (
            <div className="mar-cal-scan-viewport">
              <Webcam
                ref={webcamRef}
                className="mar-cal-scan-video"
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: { ideal: "environment" },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
              />
              <div className="mar-cal-scan-frame" />
              <div className="mar-cal-scan-hint">
                {verifying
                  ? t("Verifying…")
                  : !ready
                    ? t("Starting camera…")
                    : `Point the camera at the QR label · ${
                        mode === "native" ? "device scanner" : "in-app scanner"
                      }`}
              </div>
            </div>
          ) : (
            <div className="mar-cal-scan-note">
              {err ||
                (!cameraSupported
                  ? t("This device has no camera API.")
                  : t("Live preview needs an HTTPS connection."))}{" "}
              {t("Use “Take Photo & Scan” to capture the QR with your device camera.")}
            </div>
          )}

          <label
            className={`mar-cal-btn mar-cal-btn-primary mar-cal-scan-capture ${
              decoding || verifying ? "mar-cal-scan-capture-disabled" : ""
            }`}
          >
            <i className="fa fa-camera" aria-hidden="true" />{" "}
            {decoding ? t("Decoding…") : t("Take Photo & Scan")}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              disabled={decoding || verifying}
              style={{ display: "none" }}
            />
          </label>

          {(msg || verifying) && (
            <div className="mar-cal-scan-msg">
              {verifying ? t("Verifying…") : msg}
            </div>
          )}
        </div>
        <div className="mar-cal-modal-foot">
          <button
            className="mar-cal-btn mar-cal-btn-ghost"
            onClick={onClose}
            disabled={verifying}
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(node, document.body);
}

function Legend() {
  const [t] = useTranslation();
  return (
    <div className="mar-cal-legend">
      <LegendDot color="#15803d" bg="#16a34a" label={t("Give now (≤1 hr)")} />
      <LegendDot color="#b45309" bg="#d97706" label={t("Delayed (1–2 hrs)")} />
      <LegendDot color="#791F1F" bg="#FCEBEB" label={t("Missed (>2 hrs)")} />
      <LegendDot color="#1d4ed8" bg="#2563eb" label={t("Upcoming")} />
      <LegendDot color="#27500A" bg="#EAF3DE" label={t("Given")} />
      <LegendDot color="#8A1F2D" bg="#FCE7EA" label={t("Discontinued")} />
      <LegendDot color="#5F5E5A" bg="#EAEAEA" label={t("Not scheduled")} />
    </div>
  );
}

function LegendDot({ color, bg, label }) {
  return (
    <span className="mar-cal-legend-item">
      <span
        className="mar-cal-legend-dot"
        style={{ background: bg, borderColor: color }}
      />
      <span>{label}</span>
    </span>
  );
}

function GiveModal({
  modal,
  form,
  setForm,
  onCancel,
  onConfirm,
  saving,
  substitution,
}) {
  const [t] = useTranslation();
  const { med, row, statusKind } = modal;
  const scheduledLabel = `${row.ScheduleDate} ${row.ScheduleTime}`;
  const windowCloseLabel = form.windowClose
    ? `${pad2(form.windowClose.getDate())}-${MONTH_SHORT[form.windowClose.getMonth()]}-${form.windowClose.getFullYear()} ${pad2(form.windowClose.getHours())}:${pad2(form.windowClose.getMinutes())}`
    : "";
  const node = (
    <div className="mar-cal-modal-backdrop" onClick={onCancel}>
      <div className="mar-cal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mar-cal-modal-head">
          <span>
            {med.ItemName}
            <SubstitutionNote entry={substitution} />
          </span>
          <button className="mar-cal-modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="mar-cal-modal-body">
          <div className="mar-cal-modal-info">
            <div>
              <strong>{t("Scheduled time")}</strong>
            </div>
            <div>{scheduledLabel}</div>
            <div>
              <strong>{t("Window closes")}</strong>
            </div>
            <div>{windowCloseLabel}</div>
            <div>
              <strong>{t("Route")}</strong>
            </div>
            <div>{med.Route}</div>
            <div>
              <strong>{t("Dose")}</strong>
            </div>
            <div>{med.Dose}</div>
            <div>
              <strong>{t("Frequency")}</strong>
            </div>
            <div>{med.TimingDisplay || med.Timing}</div>
            <div>
              <strong>{t("Indent No")}</strong>
            </div>
            <div>{med.IndentNo}</div>
          </div>
          <div className="mar-cal-modal-badge-row">
            {statusKind === "givenow" ? (
              <span className="mar-cal-badge mar-cal-badge-green">
                {t("Within give window")}
              </span>
            ) : (
              <span className="mar-cal-badge mar-cal-badge-amber">
                {t("Delayed give")}
              </span>
            )}
          </div>
          <label className="mar-cal-checkbox">
            <input
              type="checkbox"
              checked={form.noNeed}
              onChange={(e) => setForm({ ...form, noNeed: e.target.checked })}
            />
            <span>{t("No Need / Not Required")}</span>
          </label>
          {!form.noNeed && (
            <div className="mar-cal-modal-fields">
              <div className="mar-cal-field">
                <label>{t("Given date & time")}</label>
                <input
                  type="datetime-local"
                  value={form.givenAt}
                  onChange={(e) =>
                    setForm({ ...form, givenAt: e.target.value })
                  }
                />
              </div>
              <div className="mar-cal-field">
                <label>{t("Given by")}</label>
                <input
                  type="text"
                  value={form.by}
                  onChange={(e) => setForm({ ...form, by: e.target.value })}
                  placeholder={t("Nurse name")}
                />
              </div>
              <div className="mar-cal-field">
                <label>{t("Remark")}</label>
                <input
                  type="text"
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  placeholder={t("Optional")}
                />
              </div>
            </div>
          )}
        </div>
        <div className="mar-cal-modal-foot">
          <button
            className="mar-cal-btn mar-cal-btn-ghost"
            onClick={onCancel}
            disabled={saving}
          >
            {t("Cancel")}
          </button>
          <button
            className="mar-cal-btn mar-cal-btn-primary"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="mar-cal-spinner-sm" /> {t("Saving...")}
              </>
            ) : (
              t("Confirm Give")
            )}
          </button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(node, document.body);
}

const MAR_CAL_CSS = `
.mar-cal-root { font-family: inherit; padding: 8px; }

:root { --mar-accent: #7c3aed; --mar-accent-dark: #5b21b6; --mar-accent-light: #8b5cf6; }
.default_theme            { --mar-accent: #22d8a9; --mar-accent-dark: #0e9974; --mar-accent-light: #5fe6c1; }
.orange_theme             { --mar-accent: #f4730d; --mar-accent-dark: #b2510a; --mar-accent-light: #ff9544; }
.peach_theme              { --mar-accent: #bc8f3c; --mar-accent-dark: #8a6929; --mar-accent-light: #d7ae5e; }
.pale_pink_theme          { --mar-accent: #bc3c8b; --mar-accent-dark: #872a62; --mar-accent-light: #d76fae; }
.red_theme                { --mar-accent: #8b2424; --mar-accent-dark: #631616; --mar-accent-light: #b14848; }
.sky_blue_theme           { --mar-accent: #03a0e7; --mar-accent-dark: #0277ad; --mar-accent-light: #46c1f5; }
.light_blue_theme         { --mar-accent: #7EA0EA; --mar-accent-dark: #4f76c4; --mar-accent-light: #a4bef3; }
.pink_theme               { --mar-accent: #d56e8e; --mar-accent-dark: #a14366; --mar-accent-light: #FFA4C3; }
.purple_theme             { --mar-accent: #B48AF6; --mar-accent-dark: #7a52c9; --mar-accent-light: #ceb1fb; }
.gray_theme               { --mar-accent: #666866; --mar-accent-dark: #404241; --mar-accent-light: #8a8d8b; }
.pastel_pink_theme        { --mar-accent: #d18181; --mar-accent-dark: #9a5252; --mar-accent-light: #FCDEDE; }
.light_peach_theme        { --mar-accent: #d6864a; --mar-accent-dark: #9c5f33; --mar-accent-light: #FFE6D4; }
.pale_peach_theme         { --mar-accent: #d09a4b; --mar-accent-dark: #946d33; --mar-accent-light: #FFF3DA; }
.pale_yellow_theme        { --mar-accent: #b5a52e; --mar-accent-dark: #80741f; --mar-accent-light: #FCFACA; }
.pale_green_theme         { --mar-accent: #82b03a; --mar-accent-dark: #5a7a26; --mar-accent-light: #EAFFB9; }
.light_celadon_theme      { --mar-accent: #6db343; --mar-accent-dark: #4a7c2c; --mar-accent-light: #DDFFC3; }
.pale_mint_theme          { --mar-accent: #4ec48a; --mar-accent-dark: #2f8b5d; --mar-accent-light: #E1FFEE; }
.pale_aqua_theme          { --mar-accent: #34b8b0; --mar-accent-dark: #228078; --mar-accent-light: #DAFFFC; }
.pale_lavender_blue_theme { --mar-accent: #6e7ce0; --mar-accent-dark: #4451ad; --mar-accent-light: #E1E6FE; }
.pale_gray_theme          { --mar-accent: #7a7a96; --mar-accent-dark: #4f4f66; --mar-accent-light: #DFDFEF; }
.pale_mauve_theme         { --mar-accent: #b66adc; --mar-accent-dark: #823fa1; --mar-accent-light: #F2D7FE; }
.lavender_blush_theme     { --mar-accent: #c277c5; --mar-accent-dark: #884c8a; --mar-accent-light: #F7E0F8; }
.pale_rose_theme          { --mar-accent: #db6cb5; --mar-accent-dark: #9d4181; --mar-accent-light: #FFDDF8; }
.lite_pale_theme          { --mar-accent: #d96f9b; --mar-accent-dark: #9b446e; --mar-accent-light: #FFE9F0; }
.blush_pink_theme         { --mar-accent: #d96d83; --mar-accent-dark: #9c4257; --mar-accent-light: #FFDDE6; }
.light_pink_theme         { --mar-accent: #d77878; --mar-accent-dark: #9b4d4d; --mar-accent-light: #FEE5E5; }
.dark_green_theme         { --mar-accent: #15803d; --mar-accent-dark: #0e5a2b; --mar-accent-light: #4caf72; }
.forest_green_theme       { --mar-accent: #1b571b; --mar-accent-dark: #113a11; --mar-accent-light: #4f8f4f; }
.deep_teal_theme          { --mar-accent: #1c5254; --mar-accent-dark: #113637; --mar-accent-light: #4f8a8c; }

.mar-cal-hero { display:flex; align-items:center; gap:24px; background: linear-gradient(135deg, var(--mar-accent-dark) 0%, var(--mar-accent) 55%, var(--mar-accent-light) 100%); border-radius: 10px; padding: 10px 18px; margin-bottom: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.18); color: #fff; }
.mar-cal-title { display:flex; gap:8px; align-items:center; color:#fff; flex-shrink:0; }
.mar-cal-title-icon { font-size:15px; opacity:0.9; }
.mar-cal-title-main { font-weight:700; font-size:14px; letter-spacing:0.4px; }
.mar-cal-title-sub { font-size:11px; color:rgba(255,255,255,0.78); margin-left:4px; }
.mar-cal-toolbar-right { display:flex; align-items:center; gap:10px; margin-left:auto; }
.mar-cal-clock { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:11px; color:#fff; background:rgba(255,255,255,0.18); padding:5px 10px; border-radius:6px; white-space:nowrap; border:1px solid rgba(255,255,255,0.22); }

.mar-cal-stats { display:grid; grid-template-columns: repeat(6, 1fr); gap:10px; margin-bottom:12px; }
.mar-cal-stats-top { margin-bottom:12px; }
.mar-cal-stat-card { background:#fff; border:1px solid #e5e7eb; border-top:3px solid #ccc; border-radius:8px; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px; box-shadow:0 1px 2px rgba(0,0,0,0.04); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.mar-cal-stat-card:hover { transform: translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
.mar-cal-stat-pill { font-size:11px; font-weight:600; padding:4px 8px; border-radius:10px; white-space:nowrap; }
.mar-cal-stat-value { font-size:24px; font-weight:800; line-height:1; }

.mar-cal-error { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#FCEBEB; color:#791F1F; border:1px solid #f3c5c5; border-radius:6px; margin-bottom:8px; }
.mar-cal-loading { display:flex; align-items:center; gap:10px; padding:8px 12px; background:var(--mar-accent-light); color:#fff; border-radius:6px; margin-bottom:8px; font-size:13px; }
.mar-cal-spinner { width:14px; height:14px; border:2px solid var(--mar-accent-dark); border-top-color:transparent; border-radius:50%; animation: mar-cal-spin 0.8s linear infinite; }
.mar-cal-spinner-sm { width:10px; height:10px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation: mar-cal-spin 0.8s linear infinite; display:inline-block; vertical-align:-1px; margin-right:4px; }
@keyframes mar-cal-spin { to { transform: rotate(360deg); } }

.mar-cal-section { background:#fff; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:8px; }
.mar-cal-section-head { display:flex; align-items:center; gap:12px; padding:8px 12px; border-bottom:1px solid #e5e7eb; font-weight:600; color:var(--mar-accent-dark); }
.mar-cal-section-sub { font-size:12px; color:#6b7280; font-weight:400; }
.mar-cal-section-toggle { margin-left:auto; }
.mar-cal-table-wrap { overflow:auto; max-height:220px; }
.mar-cal-table { width:100%; border-collapse:collapse; font-size:12px; }
.mar-cal-table thead th { position:sticky; top:0; background:#f9fafb; padding:6px 8px; text-align:left; border-bottom:1px solid #e5e7eb; color:#374151; font-weight:600; }
.mar-cal-table tbody td { padding:6px 8px; border-bottom:1px solid #f3f4f6; }
.mar-cal-table-row-stopped td { background:#fff1f2; color:#7f1d1d; }
.mar-cal-empty-row { text-align:center; color:#6b7280; padding:12px; }

.mar-cal-weeknav { display:flex; align-items:center; gap:8px; margin:0 auto; }
.mar-cal-navbtn { width:28px; height:28px; border-radius:6px; border:1px solid rgba(255,255,255,0.3) !important; background:rgba(255,255,255,0.12) !important; color:#fff !important; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; font-size:11px; transition: background 0.15s ease; }
.mar-cal-navbtn:hover { background:rgba(255,255,255,0.25) !important; }
.mar-cal-monthlabel { font-weight:700; color:#fff; min-width:120px; text-align:center; font-size:13px; letter-spacing:0.3px; padding:0 6px; }
.mar-cal-btn-today { background:rgba(255,255,255,0.12) !important; color:#fff !important; border:1px solid rgba(255,255,255,0.3) !important; padding:5px 14px; border-radius:6px; font-weight:600; font-size:11px; margin-left:4px; }
.mar-cal-btn-today:hover:not(:disabled) { background:rgba(255,255,255,0.25) !important; }
.mar-cal-btn-hero { background:rgba(255,255,255,0.12) !important; color:#fff !important; border:1px solid rgba(255,255,255,0.3) !important; padding:5px 10px; border-radius:6px; font-weight:600; min-width:32px; }
.mar-cal-btn-hero i { font-size:13px; }
.mar-cal-btn-hero:hover:not(:disabled) { background:rgba(255,255,255,0.25) !important; }

.mar-cal-grid-wrap { background: linear-gradient(180deg,#fbfcfd 0%,#f4f7fb 100%); border:1px solid #e5e7eb; border-radius:14px; box-shadow: 0 6px 24px rgba(91,33,182,0.08); padding:8px; overflow:visible; }
.mar-cal-grid { display:grid; grid-template-columns: minmax(160px, 220px) repeat(7, minmax(95px, 1fr)); width:100%; gap:6px; position:relative; }
@media (max-width: 992px) {
  .mar-cal-grid { grid-template-columns: minmax(140px, 180px) repeat(7, minmax(80px, 1fr)); gap:4px; }
}
@media (max-width: 768px) {
  .mar-cal-grid { grid-template-columns: 110px repeat(7, 70px) !important; gap:3px !important; width:max-content !important; min-width:100% !important; }
  .mar-cal-grid-cell { padding:4px !important; min-height:60px !important; }
  .mar-cal-grid-head { padding:4px 2px !important; font-size:10px !important; }
  .mar-cal-daynum { font-size:16px !important; }
  .mar-cal-grid-wrap { overflow-x:auto !important; -webkit-overflow-scrolling:touch; }
}
@media (max-width: 560px) {
  .mar-cal-root { font-size:11px; }
  .mar-cal-grid { grid-template-columns: 110px repeat(7, 62px) !important; gap:2px !important; width:max-content !important; min-width:100% !important; }
  .mar-cal-grid-cell { padding:3px !important; min-height:52px !important; font-size:10px !important; border-radius:6px !important; }
  .mar-cal-grid-head { font-size:9px !important; padding:3px 1px !important; }
  .mar-cal-daynum { font-size:13px !important; margin-top:0 !important; }
  .mar-cal-grid-wrap { padding:4px !important; border-radius:8px !important; overflow-x:auto !important; -webkit-overflow-scrolling:touch; position:relative; }
  .mar-cal-medinfo {
    padding:5px !important;
    gap:4px !important;
    flex-direction:row !important;
    align-items:flex-start !important;
  }
  .mar-cal-medavatar {
    width:22px !important;
    height:22px !important;
    font-size:10px !important;
  }
  .mar-cal-medname {
    font-size:11px !important;
    line-height:1.2 !important;
    white-space:normal !important;
    overflow:visible !important;
    text-overflow:clip !important;
    display:block !important;
    -webkit-line-clamp:unset !important;
    -webkit-box-orient:unset !important;
    word-break:break-word !important;
  }
  .mar-cal-medinfo-text { min-width:0 !important; flex:1 1 auto !important; }
  .mar-cal-medinfo-text strong { font-size:11px !important; line-height:1.2; white-space:normal !important; word-break:break-word !important; }
  .mar-cal-medinfo-text .mar-cal-medinfo-sub,
  .mar-cal-medinfo-text small { font-size:9.5px !important; }
  .mar-cal-medqty { grid-template-columns: 1fr 1fr !important; gap:2px !important; }
  .mar-cal-qty-pill { font-size:8px !important; padding:1px 4px !important; line-height:1.15; }
  .mar-cal-qty-pill b { font-size:7.5px !important; }
  .mar-cal-chip { font-size:9.5px !important; padding:2px 6px !important; border-radius:10px !important; }
  .mar-cal-chip-by-inline { display:none !important; }
  .mar-cal-sticky-backdrop { display:none !important; }
}
.mar-cal-sticky-backdrop { grid-column: 1 / -1; grid-row: 1; position:sticky; top:-1px; background: linear-gradient(180deg,#fbfcfd 0%,#f4f7fb 100%); z-index:45; margin: -10px -10px 0; padding-bottom:6px; box-shadow: 0 6px 10px -4px rgba(91,33,182,0.22); pointer-events:none; align-self:stretch; }
.mar-cal-grid-cell { border-radius:10px; padding:8px; min-height:78px; background:#fff; transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease; position:relative; }
.mar-cal-grid-head { background:#fff; font-weight:600; color:#374151; text-align:center; font-size:12px; padding:8px 6px; border:1px solid #eef2f7; min-height:auto; box-shadow: 0 1px 2px rgba(0,0,0,0.02); position:sticky; top:-1px; z-index:50; align-self:start; }
.mar-cal-grid-head.mar-cal-weekend { background: linear-gradient(180deg,#fff7ed 0%,#fef3c7 100%); }
.mar-cal-grid-medcol { background:#fff; border:1px solid #eef2f7; box-shadow: 0 1px 3px rgba(91,33,182,0.05); }
.mar-cal-today { background: linear-gradient(180deg, #f5f3ff 0%, #ffffff 60%); border-color: rgba(55,138,221,0.35) !important; }
.mar-cal-today.mar-cal-grid-head { background: linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%); color:#fff; border-color:#1d4ed8; box-shadow: 0 4px 12px rgba(37,99,235,0.25); z-index:6; }
.mar-cal-today.mar-cal-grid-head .mar-cal-dayname,
.mar-cal-today.mar-cal-grid-head .mar-cal-daymo { color: rgba(255,255,255,0.85); }
.mar-cal-today.mar-cal-grid-head .mar-cal-daynum { color:#fff; }
.mar-cal-today.mar-cal-grid-head .mar-cal-daynum::after { content:""; display:block; width:18px; height:2px; background:#fff; border-radius:1px; margin:3px auto 0; opacity:0.9; }
.mar-cal-grid-empty { text-align:center; padding:36px; color:#6b7280; background:#fff; border:1px dashed #e5e7eb; border-radius:10px; }

.mar-cal-dayname { font-size:9px; color:#6b7280; text-transform:uppercase; letter-spacing:0.8px; font-weight:700; }
.mar-cal-daynum { font-size:22px; font-weight:800; color:var(--mar-accent-dark); line-height:1; margin-top:3px; }
.mar-cal-today.mar-cal-grid-head .mar-cal-daynum,
.mar-cal-today.mar-cal-grid-head { color:#fff !important; }
.mar-cal-daymo { font-size:9px; color:#9ca3af; margin-top:2px; text-transform:uppercase; letter-spacing:0.4px; }

.mar-cal-medinfo { display:flex; gap:10px; align-items:flex-start; padding:10px; position:relative; overflow:hidden; }
.mar-cal-medinfo::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background: linear-gradient(180deg, var(--mar-accent, #8b5cf6) 0%, var(--mar-accent-2, #5b21b6) 100%); }
.mar-cal-medinfo-stopped { background:#fff7f8; border-color:#efb8c0; }
.mar-cal-medinfo-stopped::before { background: linear-gradient(180deg, #8A1F2D 0%, #B55D66 100%); }
.mar-cal-medavatar { flex-shrink:0; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:13px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); letter-spacing:0; }
.mar-cal-medinfo-text { display:flex; flex-direction:column; min-width:0; flex:1; }
.mar-cal-medname { font-size:12px; font-weight:700; color:#111827; line-height:1.25; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.mar-cal-medinfo-stopped .mar-cal-medname { color:#7f1d1d; }
.mar-cal-med-actions { display:flex; align-items:center; gap:5px; margin-top:4px; min-height:20px; }
.mar-cal-dc-btn, .mar-cal-stopped-badge { display:inline-flex; align-items:center; justify-content:center; gap:4px; min-height:18px; padding:2px 7px; border-radius:4px; font-size:9px; line-height:1; font-weight:800; letter-spacing:0.2px; text-transform:uppercase; white-space:nowrap; }
.mar-cal-dc-btn { border:1px solid #efb8c0; background:#fff1f2; color:#8A1F2D; cursor:pointer; font-family:inherit; }
.mar-cal-dc-btn:hover:not(:disabled) { background:#FCE7EA; border-color:#d76d7a; }
.mar-cal-dc-btn:disabled { opacity:0.65; cursor:not-allowed; }
.mar-cal-stopped-badge { border:1px solid #d76d7a; background:#FCE7EA; color:#8A1F2D; }
.mar-cal-medmeta { font-size:9px; color: var(--mar-accent, #4b5563); margin-top:4px; text-transform:uppercase; letter-spacing:0.4px; font-weight:700; }
.mar-cal-medstatus { font-size:9px; color:#6b7280; margin-top:4px; padding:2px 6px; background:#eef2f7; border-radius:10px; align-self:flex-start; font-weight:500; }
.mar-cal-medstatus-stopped { background:#FCE7EA; color:#8A1F2D; border:1px solid #efb8c0; }
.mar-cal-medqty { display:grid; grid-template-columns: 1fr 1fr; gap:3px; margin-top:6px; }
.mar-cal-qty-pill { font-size:9px; padding:2px 5px; border-radius:4px; font-weight:600; display:flex; justify-content:space-between; align-items:center; gap:4px; border:1px solid transparent; line-height:1.2; }
.mar-cal-qty-pill b { font-weight:700; opacity:0.7; font-size:8px; text-transform:uppercase; letter-spacing:0.3px; }
.mar-cal-qty-order { background:#eef2f7; color:var(--mar-accent-dark); border-color:#e9d5ff; }
.mar-cal-qty-issued { background:var(--mar-accent-light); color:#fff; border-color:var(--mar-accent); }
.mar-cal-qty-given { background:#EAF3DE; color:#27500A; border-color:#cfe4b6; }
.mar-cal-qty-rem { background:#FAEEDA; color:#633806; border-color:#ecd6ad; }

.mar-cal-cell-empty { background: #fafbfc; border:1px dashed #e5e7eb; opacity:0.85; background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px); background-size: 10px 10px; background-position: center; }
.mar-cal-grid-cell:not(.mar-cal-grid-head):not(.mar-cal-grid-medcol):not(.mar-cal-cell-empty) { border:1px solid #eef2f7; box-shadow: 0 1px 2px rgba(0,0,0,0.03); display:flex; flex-direction:column; gap:4px; align-items:stretch; padding:4px; }
.mar-cal-grid-cell:not(.mar-cal-grid-head):not(.mar-cal-grid-medcol):not(.mar-cal-cell-empty):hover { background:#f5f3ff; border-color:#c4b5fd; box-shadow: 0 4px 10px rgba(91,33,182,0.08); }
.mar-cal-cell-stopped { background:#FCE7EA !important; border-color:#efb8c0 !important; box-shadow: inset 0 0 0 1px rgba(138,31,45,0.08); }
.mar-cal-cell-stopped-soft { background:#fff7f8 !important; border-color:#f5c8cf !important; opacity:1; background-image: repeating-linear-gradient(135deg, rgba(138,31,45,0.06) 0 6px, transparent 6px 12px); }
.mar-cal-grid-cell:not(.mar-cal-grid-head):not(.mar-cal-grid-medcol):not(.mar-cal-cell-empty).mar-cal-cell-stopped:hover { background:#FCE7EA !important; border-color:#d76d7a !important; }

.mar-cal-chip { display:inline-flex; align-items:center; justify-content:center; gap:4px; padding:4px 8px; border-radius:14px; font-size:10.5px; font-weight:700; border:1px solid transparent; letter-spacing:0.2px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); transition: transform 0.12s ease, box-shadow 0.12s ease; white-space:nowrap; }
.mar-cal-chip:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.10); }
.mar-cal-chip-block { display:flex; flex-direction:column; gap:3px; margin:3px 0; align-items:flex-start; }
.mar-cal-chip-given { background:#EAF3DE; color:#27500A; border-color: rgba(59,109,17,0.25); }
.mar-cal-chip-given-late { background:#FAEEDA; color:#633806; border-color:#854F0B; }
.mar-cal-chip-givenow { background:#16a34a !important; color:#fff !important; border-color:#15803d !important; font-weight:800 !important; letter-spacing:0.3px; }
.mar-cal-chip-delayed { background:#d97706 !important; color:#fff !important; border-color:#b45309 !important; font-weight:800 !important; letter-spacing:0.3px; text-shadow: 0 1px 1px rgba(0,0,0,0.25); }
.mar-cal-chip-clickable { cursor:pointer; font-family: inherit; }
.mar-cal-chip-clickable:hover { transform: translateY(-2px) scale(1.05); filter: brightness(1.04); animation-play-state: paused; }
.mar-cal-chip-clickable:active { transform: translateY(0) scale(0.98); }
.mar-cal-chip-clickable:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

.mar-cal-chip-blink { animation: mar-cal-blink 1s ease-in-out infinite; }
@keyframes mar-cal-blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(22,163,74,0.6); }
  50%      { opacity: 0.55; box-shadow: 0 0 0 7px rgba(22,163,74,0); }
}
.mar-cal-chip-delayed.mar-cal-chip-blink { animation-name: mar-cal-blink-amber; }
@keyframes mar-cal-blink-amber {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(217,119,6,0.75); }
  50%      { opacity: 0.5; box-shadow: 0 0 0 7px rgba(217,119,6,0); }
}
.mar-cal-chip-missed { background:#FCEBEB; color:#791F1F; border-color: rgba(121,31,31,0.2); }
.mar-cal-chip-upcoming { background:#2563eb !important; color:#fff !important; border-color:#1d4ed8 !important; font-weight:800 !important; letter-spacing:0.3px; }
.mar-cal-chip-notneed { background:#F1EFE8; color:#5F5E5A; border-color: rgba(95,94,90,0.2); }
.mar-cal-chip-stopped { background:#fff; color:#8A1F2D; border-color:#d76d7a; text-decoration: line-through; box-shadow:none; }
.mar-cal-tick { color:#27500A; font-weight:800; display:inline-flex; align-items:center; justify-content:center; width:14px; height:14px; border-radius:50%; background:#27500A; color:#fff; font-size:9px; line-height:1; }
.mar-cal-tick-muted { background:#9ca3af; color:#fff; }
.mar-cal-tick-late { background:#854F0B; color:#fff; }
.mar-cal-chip-tall { flex-direction:column; gap:2px; padding:4px 8px 5px; align-items:center; }
.mar-cal-chip-row { display:flex; align-items:center; gap:5px; }
.mar-cal-chip-by-inline { font-size:9px; font-style:italic; opacity:0.85; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.1; font-weight:600; }
.mar-cal-chip-by-inline-muted { opacity:0.7; }

.mar-cal-btn { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:4px; border:1px solid transparent; cursor:pointer; font-size:12px; line-height:1; background:#fff; }
.mar-cal-btn:disabled { opacity:0.6; cursor:not-allowed; }
.mar-cal-btn-ghost { background:#fff; border-color:#d1d5db; color:#374151; }
.mar-cal-btn-ghost:hover:not(:disabled) { background:#f3f4f6; }
.mar-cal-btn-primary { background:#16a34a; color:#fff; border-color:#15803d; }
.mar-cal-btn-primary:hover:not(:disabled) { background:#15803d; border-color:#166534; }
.mar-cal-btn-danger { background:#791F1F; color:#fff; border-color:#791F1F; }
.mar-cal-btn-give { background:#3B6D11; color:#fff; border-color:#3B6D11; padding:3px 8px; font-size:11px; }
.mar-cal-btn-give:hover:not(:disabled) { background:#2e5610; }
.mar-cal-btn-delayed { background:#854F0B; color:#fff; border-color:#854F0B; padding:3px 8px; font-size:11px; }
.mar-cal-btn-delayed:hover:not(:disabled) { background:#6c4108; }

.mar-cal-legend { display:flex; flex-wrap:wrap; gap:14px; padding:8px 12px; margin-top:8px; background:#fff; border:1px solid #e5e7eb; border-radius:6px; font-size:11px; color:#374151; }
.mar-cal-legend-item { display:inline-flex; align-items:center; gap:6px; }
.mar-cal-legend-dot { display:inline-block; width:12px; height:12px; border-radius:3px; border:1px solid transparent; }

.mar-cal-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; padding:16px; }
.mar-cal-modal { background:#fff; border-radius:8px; min-width:0; max-width:560px; width:100%; box-shadow:0 10px 40px rgba(0,0,0,0.25); overflow:hidden; max-height: calc(100vh - 32px); display:flex; flex-direction:column; }
.mar-cal-modal-wide { max-width: 1100px; }
.mar-cal-modal-wide .mar-cal-table-wrap { overflow:auto; padding:0; flex:1 1 auto; }
.mar-cal-modal-wide .mar-cal-modal-body { padding:0; }
.mar-cal-modal-head { display:flex; justify-content:space-between; align-items:center; padding:10px 16px; background:var(--mar-accent-dark); color:#fff; font-weight:600; flex-shrink:0; }
.mar-cal-modal-close { background:transparent; border:none; color:#fff; font-size:22px; line-height:1; cursor:pointer; }
.mar-cal-modal-body { padding:12px 16px; overflow-y:auto; flex:1 1 auto; min-height:0; }
.mar-cal-modal-info { display:grid; grid-template-columns: auto 1fr auto 1fr; row-gap:8px; column-gap:12px; font-size:12px; color:#374151; padding:10px 12px; background:#f9fafb; border-radius:6px; margin-bottom:10px; align-items:center; }
.mar-cal-modal-info > div:nth-child(odd) { white-space:nowrap; }
.mar-cal-modal-badge-row { margin-bottom:10px; }
.mar-cal-badge { display:inline-block; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; }
.mar-cal-badge-green { background:#EAF3DE; color:#27500A; }
.mar-cal-badge-amber { background:#FAEEDA; color:#633806; }
.mar-cal-checkbox { display:flex; align-items:center; gap:8px; padding:8px 0; cursor:pointer; user-select:none; }
.mar-cal-modal-fields { display:flex; flex-direction:column; gap:10px; }
.mar-cal-field { display:flex; flex-direction:column; gap:4px; }
.mar-cal-field label { font-size:12px; color:#6b7280; }
.mar-cal-field input { padding:6px 8px; border:1px solid #d1d5db; border-radius:4px; font-size:13px; }
.mar-cal-field input:focus { outline:none; border-color:var(--mar-accent-dark); }
.mar-cal-modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:10px 16px; border-top:1px solid #e5e7eb; background:#f9fafb; flex-shrink:0; }

/* ============================================================
   Tablet & Mobile responsive overrides
   Desktop (>1024px) stays as designed; everything below is opt-in.
   ============================================================ */
@media (max-width: 1024px) {
  .mar-cal-stats { grid-template-columns: repeat(3, 1fr) !important; gap:8px !important; }
  .mar-cal-stat-value { font-size:20px !important; }
  .mar-cal-stat-pill { font-size:10px !important; padding:3px 6px !important; }
  .mar-cal-hero { gap:12px !important; padding:8px 12px !important; flex-wrap:wrap; }
  .mar-cal-title-main { font-size:13px !important; }
  .mar-cal-title-sub { font-size:10px !important; }
}

@media (max-width: 768px) {
  .mar-cal-stats { grid-template-columns: repeat(3, 1fr) !important; gap:6px !important; margin-bottom:8px !important; }
  .mar-cal-stat-card { padding:6px 8px !important; flex-direction:column !important; align-items:flex-start !important; gap:2px !important; }
  .mar-cal-stat-value { font-size:18px !important; }
  .mar-cal-stat-pill { font-size:9.5px !important; padding:2px 6px !important; }
  .mar-cal-hero { flex-wrap:wrap; gap:6px !important; padding:6px 10px !important; border-radius:8px !important; }
  .mar-cal-title { flex:1 1 100%; justify-content:space-between; margin-bottom:4px; }
  .mar-cal-title-main { font-size:12px !important; }
  .mar-cal-btn-today, .mar-cal-btn-hero { padding:4px 8px !important; font-size:10.5px !important; }
  .mar-cal-btn-hero i { font-size:11px !important; }
  .mar-cal-navbtn { width:24px !important; height:24px !important; font-size:10px !important; }
  .mar-cal-modal-info { grid-template-columns: auto 1fr !important; column-gap:8px !important; font-size:11px !important; padding:8px 10px !important; }
  .mar-cal-modal { max-width:calc(100vw - 16px) !important; max-height:calc(100vh - 16px) !important; }
  .mar-cal-modal-backdrop { padding:8px !important; }
  .mar-cal-modal-head { padding:8px 12px !important; font-size:13px !important; }
  .mar-cal-modal-body { padding:10px !important; }
  .mar-cal-modal-foot { flex-direction:column-reverse !important; gap:6px !important; padding:8px 12px !important; }
  .mar-cal-modal-foot .mar-cal-btn { width:100% !important; justify-content:center; }
  .mar-cal-grid-medcol { font-size:10px !important; }
  .mar-cal-medinfo { padding:6px !important; gap:6px !important; }
  .mar-cal-medqty { gap:2px !important; }
  .mar-cal-qty-pill { font-size:8.5px !important; padding:1px 4px !important; }
  .mar-cal-qty-pill b { font-size:7.5px !important; }
  .mar-cal-section-head { padding:6px 10px !important; font-size:11px !important; }
  .mar-cal-chip { font-size:9.5px !important; padding:3px 6px !important; }
}

@media (max-width: 560px) {
  .mar-cal-stats { grid-template-columns: repeat(2, 1fr) !important; }
  .mar-cal-hero { gap:4px !important; padding:5px 8px !important; }
  .mar-cal-title-sub { display:none !important; }
  .mar-cal-btn-today { padding:3px 8px !important; font-size:10px !important; }
  .mar-cal-btn-hero { padding:3px 6px !important; min-width:28px !important; }
  .mar-cal-modal-info { grid-template-columns: 1fr !important; }
  .mar-cal-modal-info > div:nth-child(odd) { color:#6b7280 !important; font-weight:600; padding-top:4px; }
  .mar-cal-chip { font-size:9px !important; padding:2px 5px !important; }
  .mar-cal-medinfo-text { font-size:11px !important; }
}

/* ============================================================
   QR scan-to-verify controls
   ============================================================ */
.mar-cal-chip-wrap { display:flex; align-items:center; gap:3px; width:100%; }
.mar-cal-chip-wrap > .mar-cal-chip { flex:1 1 auto; min-width:0; }
.mar-cal-scan-btn { flex:0 0 auto; width:22px; height:22px; border-radius:6px; border:1px solid var(--mar-accent, #7c3aed); background:#fff; color:var(--mar-accent-dark, #5b21b6); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; font-size:11px; padding:0; transition: background 0.15s ease, color 0.15s ease; }
.mar-cal-scan-btn:hover { background:var(--mar-accent-light, #8b5cf6); color:#fff; }
.mar-cal-scan-btn-warn { border-color:#d97706; color:#b45309; animation: mar-cal-blink-amber 1.2s ease-in-out infinite; }
.mar-cal-verify-badge { display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; border-radius:50%; font-size:9px; font-weight:800; margin-left:4px; line-height:1; }
.mar-cal-verify-ok { background:#16a34a; color:#fff; }
.mar-cal-verify-warn { background:#d97706; color:#fff; }
.mar-cal-verify-pending { background:#9ca3af; color:#fff; }
.mar-cal-chip-locked { opacity:0.95; filter:saturate(0.85); }
.mar-cal-chip-lockicon { font-size:8px; margin-right:3px; opacity:0.9; }

.mar-cal-scan-modal { max-width:460px; }
.mar-cal-scan-info { display:grid; grid-template-columns:auto 1fr; row-gap:6px; column-gap:10px; font-size:12px; color:#374151; padding:8px 10px; background:#f9fafb; border-radius:6px; margin-bottom:10px; align-items:center; }
.mar-cal-scan-info > div:nth-child(odd) { white-space:nowrap; }
.mar-cal-scan-viewport { position:relative; width:100%; aspect-ratio:1 / 1; background:#000; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.mar-cal-scan-video { width:100%; height:100%; object-fit:cover; display:block; }
.mar-cal-scan-frame { position:absolute; inset:18%; border:3px solid rgba(255,255,255,0.85); border-radius:14px; }
.mar-cal-scan-hint { position:absolute; bottom:8px; left:0; right:0; text-align:center; color:#fff; font-size:11px; text-shadow:0 1px 2px rgba(0,0,0,0.7); padding:0 8px; }
.mar-cal-scan-error { padding:18px; text-align:center; color:#791F1F; background:#FCEBEB; border:1px solid #f3c5c5; border-radius:8px; font-size:13px; line-height:1.4; }
.mar-cal-scan-note { padding:12px 14px; text-align:center; color:#633806; background:#FAEEDA; border:1px solid #ecd6ad; border-radius:8px; font-size:12.5px; line-height:1.45; margin-bottom:4px; }
.mar-cal-scan-capture { width:100%; justify-content:center; margin-top:10px; padding:10px; font-size:13px; cursor:pointer; }
.mar-cal-scan-capture-disabled { opacity:0.6; pointer-events:none; }
.mar-cal-scan-msg { margin-top:8px; text-align:center; font-size:12px; color:#374151; line-height:1.4; }
@media (max-width: 560px) {
  .mar-cal-scan-modal { max-width:calc(100vw - 16px) !important; }
  .mar-cal-scan-btn { width:20px !important; height:20px !important; font-size:10px !important; }
}
`;
