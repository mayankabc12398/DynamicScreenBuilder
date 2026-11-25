/**
 * TABLE + CALENDAR — the OPD Confirmation page's grid as a control of its own.
 *
 * The hand-coded page (pages/frontOffice/OPD/Confirmation.jsx with
 * components/UI/customTable/ConfirmationTable/OPDConfirmationTable.jsx) draws
 * one card with a Table ⇆ Calendar switch: a sortable, paged table with a
 * column chooser and Export, and a month calendar whose day tiles count the
 * appointments per status and open the picked day's list under its week, with
 * the same row actions as the table.
 *
 * This is that card, kept apart from the generic Table / Cards (DataTable) so
 * nothing about that control changes. It reuses only what is shared: how rows
 * are resolved (`resolveRows`), how one cell is drawn (`CellValue`, so a
 * column's type, template and action strip behave exactly as they do in the
 * table) and the calendar drawing (registry/calendarView).
 *
 * Moving to another month does what the page's onMonthSearch does: the first
 * and last day go into the From / To form fields, onMonthChange runs, and the
 * rows are read again — the control's own endpoint, or, when a Search button
 * fills it, that button's click is run again so its search picks the month up.
 */
import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import useIsModernDark from "@app/utils/hooks/useIsModernDark";
import { exportToExcel } from "@app/utils/exportLibrary";
import { toast } from "react-toastify";
import Modal from "@app/components/modalComponent/Modal";
import Confirm from "@app/components/modalComponent/Confirm";
import { notify } from "@app/utils/utils";
import {
  GetPatientDoctorAppointmentDetails,
  SaveSMSDoctorsEmployee,
  updateAppointmentSchedule,
  UpdateAppointmentStatus,
} from "@app/networkServices/OPDConfirmation";
import { GetAfterConfirmationCancellationRights } from "@app/networkServices/BillingsApi";
import { EmptyState, GROUPS, Icon, p } from "./shared";
import { CellValue, resolveRows } from "./dataDisplay";
import CalendarView, { calDayKey, calSettings, chipOrderOf, DEFAULT_CAL_STATUSES, makeStatusOf } from "./calendarView";
import { createApiConfig, isApiConfigReady, normalizeApiConfig } from "../utils/apiConfig";
import { evalCondition, getPath, interpolate } from "../utils/expressions";
import { flatten } from "../utils/tree";
import { tr } from "../utils/i18n";

// The page's two big modals, loaded when first opened rather than with the builder.
const SlotModal = lazy(() => import("@app/components/modalComponent/Utils/SlotModal"));
const OPDServiceBooking = lazy(() => import("@app/pages/frontOffice/OPD/OPDServiceBooking"));

// ── Colour ramp: the page's own, flipped on the modern dark skin ────────────
const C_LIGHT = {
  teal50: "#e8f7f4", teal600: "#0e7a65",
  blue50: "#eaf2fb", blue400: "#3b8fd9", blue600: "#1e6cb5",
  amber50: "#fff8eb", amber600: "#c47d0a",
  red50: "#fff0f0", red600: "#b52020",
  green50: "#edfaf2", green600: "#15803d",
  purple50: "#f3f0ff", purple600: "#6d28d9",
  gray50: "#f8f9fa", gray100: "#f1f3f5", gray200: "#e9ecef", gray300: "#dee2e6",
  gray400: "#ced4da", gray500: "#adb5bd", gray600: "#6c757d", gray700: "#495057",
  gray800: "#343a40", white: "#fff",
};
const C_DARK = {
  ...C_LIGHT,
  gray50: "#0F172A", gray100: "#1E293B", gray200: "#26344b", gray300: "#334155",
  gray400: "#475569", gray500: "#94A3B8", gray600: "#94A3B8", gray700: "#E2E8F0",
  gray800: "#F1F5F9", white: "#111827",
};

const col = (key, header, extra = {}) => ({
  key, header, type: "text", control: "none", width: 140, align: "left", sortable: true, visible: true, chipRules: [], ...extra,
});

/**
 * The page's columns and its five row actions, as a starting point.
 *
 * `look` draws a cell the way the page does — the patient with an avatar and
 * the UHID under the name, the age over a gender icon, the patient type as a
 * pill. A column without one (any column added later) is an ordinary cell.
 */
const DEFAULT_COLUMNS = [
  col("SrNo", "#", { type: "serial", width: 50, sortable: false, look: "muted" }),
  col("AppNo", "Appointment No", { look: "bold" }),
  col("NAME", "Patient Details", { look: "patient", subField: "PatientID" }),
  col("ConsultType", "Visit Type"),
  col("AppointmentType", "Type"),
  col("Age", "Age / Gender", { look: "ageGender", genderField: "Gender", align: "center" }),
  col("DoctorName", "Doctor", { look: "ellipsis" }),
  col("VisitType", "Patient Type", { look: "pill", align: "center" }),
  col("AppTime", "Appt Time"),
  col("AppDate", "Appt Date"),
  col("NextVisitInfo", "Next Visit Info", { sortable: false, look: "note" }),
  col("Actions", "Actions", {
    type: "actions",
    sortable: false,
    align: "center",
    width: 190,
    // `builtIn` does what the page's button does (see BUILT_IN below) while
    // the button has no On click chain of its own; a chain replaces it.
    // `when` false greys a button out, as the page's do.
    actions: [
      { label: "Confirm", builtIn: "confirm", icon: "Check", color: "#15803d", bgColor: "#edfaf2", onClick: [] },
      { label: "Reschedule", builtIn: "reschedule", icon: "CalendarClock", color: "#1e6cb5", bgColor: "#eaf2fb", onClick: [] },
      { label: "Payment", builtIn: "payment", icon: "CreditCard", color: "#6d28d9", bgColor: "#f3f0ff", onClick: [] },
      { label: "Cancel", builtIn: "cancel", icon: "X", color: "#b52020", bgColor: "#fff0f0", onClick: [] },
      { label: "Send SMS", builtIn: "sms", icon: "MessageSquare", color: "#0e7a65", bgColor: "#e8f7f4", onClick: [] },
    ],
  }),
];

const isCalendarOnlyCol = (c) => c.type === "actions" || c.type === "frameMenu";
const pill = (c, bg) => ({
  display: "inline-block", fontSize: "11px", fontWeight: 600, color: c, background: bg,
  padding: "3px 11px", borderRadius: "20px", whiteSpace: "nowrap",
});

const getInitials = (name = "") => {
  const cleaned = String(name).replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|master)\s+/i, "").trim();
  return cleaned.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "P";
};
const AVATAR_TONES = [
  { bg: C_LIGHT.teal50, c: C_LIGHT.teal600 }, { bg: C_LIGHT.blue50, c: C_LIGHT.blue600 },
  { bg: C_LIGHT.purple50, c: C_LIGHT.purple600 }, { bg: C_LIGHT.amber50, c: C_LIGHT.amber600 },
  { bg: C_LIGHT.green50, c: C_LIGHT.green600 }, { bg: C_LIGHT.red50, c: C_LIGHT.red600 },
];
const avatarTone = (s = "") => AVATAR_TONES[((s?.charCodeAt(0) || 0) + (s?.length || 0)) % AVATAR_TONES.length];
const genderMeta = (g) => {
  const v = String(g || "").trim().toLowerCase();
  if (v.startsWith("m")) return { icon: "fas fa-mars", c: C_LIGHT.blue600, label: "Male" };
  if (v.startsWith("f")) return { icon: "fas fa-venus", c: "#d6336c", label: "Female" };
  if (v) return { icon: "fas fa-genderless", c: C_LIGHT.gray500, label: g };
  return null;
};
const plain = (v) => (v === null || v === undefined || typeof v === "object" || v === "" ? "" : String(v));

/** A cell drawn the page's way, or null when the column asks for no look. */
function lookCell(c, row, C) {
  const v = plain(getPath(row, c.key));
  switch (c.look) {
    case "bold":
      return <span style={{ fontWeight: 600 }}>{v || "-"}</span>;
    case "patient": {
      const tone = avatarTone(v);
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tone.bg, color: tone.c, fontSize: 11, fontWeight: 700 }}>
            {getInitials(v)}
          </span>
          <span style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: C.gray800 }}>{v || "-"}</div>
            {c.subField ? (
              <div style={{ fontSize: 11, color: C.gray500, fontFamily: "'DM Mono', monospace" }}>{plain(getPath(row, c.subField)) || "-"}</div>
            ) : null}
          </span>
        </div>
      );
    }
    case "ageGender": {
      const g = genderMeta(getPath(row, c.genderField || "Gender"));
      return (
        <>
          <div style={{ fontWeight: 600 }}>{v || "-"}</div>
          {g ? (
            <div style={{ fontSize: 11, color: g.c }}>
              <i className={g.icon} style={{ marginInlineEnd: 3 }} />
              {g.label}
            </div>
          ) : null}
        </>
      );
    }
    case "ellipsis":
      return (
        <span title={v} style={{ display: "inline-block", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle" }}>
          {v || "-"}
        </span>
      );
    case "pill":
      return <span style={pill(C.purple600, C.purple50)}>{v || "-"}</span>;
    case "note":
      return <span style={{ display: "inline-block", whiteSpace: "normal", maxWidth: 200, fontSize: 11 }}>{v || "-"}</span>;
    default:
      return null;
  }
}

/**
 * The page's row buttons: 30px tinted squares, greyed out (not hidden) when
 * the row does not allow them. A column holding a frame menu or an app modal
 * falls back to the table's own action strip, which knows how to open those.
 */
const flag = (row, k) => Number(row?.[k]) === 1;
const isZero = (row, k) => Number(row?.[k] ?? 0) === 0;

/**
 * When the page's buttons are usable — renderRowActions in
 * OPDConfirmationTable, rule for rule. "hidden" is the SMS button, which the
 * page does not draw at all once the appointment is confirmed.
 */
const BUILT_IN_STATE = {
  confirm: (r) => (flag(r, "IsConform") || flag(r, "isExpired") || flag(r, "IsCancel") ? "disabled" : "ok"),
  reschedule: (r) => (flag(r, "IsConform") || flag(r, "isExpired") || flag(r, "IsCancel") ? "disabled" : "ok"),
  payment: (r) => (flag(r, "IsPayment") || flag(r, "IsCancel") ? "disabled" : "ok"),
  cancel: (r, auth) => (auth && isZero(r, "IsPayment") && isZero(r, "IsCancel") ? "ok" : "disabled"),
  sms: (r) => (flag(r, "IsConform") ? "hidden" : "ok"),
};

function ActionButtons({ column, row, node, rt, scope, C, builtIn }) {
  const items = (Array.isArray(column.actions) ? column.actions : []).filter(Boolean);
  if (items.some((a) => a.kind === "frameMenu" || a.kind === "appModal")) {
    return <CellValue column={column} row={row} node={node} rt={rt} scope={scope} />;
  }
  const evalScope = { ...(scope || {}), row, ...(row || {}) };
  return (
    <div style={{ display: "inline-flex", gap: 6 }} data-dsb-interactive={rt?.design ? undefined : true}>
      {items.map((a, i) => {
        const hasChain = Array.isArray(a.onClick) && a.onClick.length > 0;
        // The page's own behaviour for this button, unless a chain replaces it.
        const own = builtIn && a.builtIn && BUILT_IN_STATE[a.builtIn] && !hasChain && a.kind !== "navigate" ? a.builtIn : "";
        const state = own ? BUILT_IN_STATE[own](row, builtIn.auth) : "ok";
        if (state === "hidden") return null;
        const allowed = state === "ok" && (!a.when || !a.when.op || evalCondition(a.when, evalScope));
        const tip = interpolate(a.tooltip || a.label || "", evalScope);
        const fire = (e) => {
          e.stopPropagation();
          if (rt?.design || !allowed) return;
          if (own) {
            builtIn.run(own, row);
          } else if (a.kind === "navigate") {
            rt?.runActions?.([{ type: "navigate", route: a.route }], { row, column: column.key, action: a, node });
          } else if (hasChain) {
            rt?.runActions?.(a.onClick, { row, column: column.key, action: a, node });
          } else {
            rt?.runEvent?.(node, a.event || "onRowAction", { row, action: a });
          }
        };
        return (
          <span
            key={i}
            role="button"
            tabIndex={allowed ? 0 : -1}
            aria-disabled={!allowed || undefined}
            title={tip}
            onClick={fire}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fire(e)}
            style={{
              width: 30, height: 30, borderRadius: 8, border: "1px solid transparent",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: allowed ? "pointer" : "not-allowed", transition: "all .12s",
              background: allowed ? a.bgColor || C.gray100 : C.gray50,
              color: allowed ? a.color || C.gray600 : C.gray400,
            }}
          >
            <Icon name={a.icon || "MoreHorizontal"} size={Number(a.iconSize) || 14} />
          </span>
        );
      })}
    </div>
  );
}

/** The status the form asks to see — a plain value or a picked { value, label }. */
const statusWanted = (v) => {
  const s = v && typeof v === "object" ? v.value ?? v.label : v;
  return s === undefined || s === null || s === "" || s === "All" ? "" : String(s);
};

/** The buttons whose Call API puts its rows into this node — and on which event. */
function feedersOf(root, nodeId) {
  const out = [];
  flatten(root).forEach((n) => {
    Object.entries(n.events || {}).forEach(([ev, list]) => {
      if ((list || []).some((a) => a?.type === "callApi" && a.targetId === nodeId)) out.push([n, ev]);
    });
  });
  return out;
}

function CalendarTable({ node, props, style, rt, scope }) {
  const C = useIsModernDark() ? C_DARK : C_LIGHT;
  const design = !!rt?.design;
  const { rows: apiRows, loading, error, sourceId } = resolveRows(node, props, rt);
  const cal = calSettings(props);
  const statusOf = useMemo(() => makeStatusOf(cal.calStatuses), [cal.calStatuses]);
  const chipOrder = useMemo(() => chipOrderOf(cal.calStatuses), [cal.calStatuses]);

  // ── Own endpoint: load when the screen opens, as the table does ─────────
  const api = props.apiConfig;
  const ownApi = props.dataMode === "api" && isApiConfigReady(api);
  const apiKey = useMemo(() => (ownApi ? JSON.stringify(normalizeApiConfig(api)) : ""), [ownApi, api]);
  useEffect(() => {
    if (!apiKey || design || !rt?.refreshNode) return;
    const cfg = JSON.parse(apiKey);
    if (cfg.autoLoad === false) return;
    rt.refreshNode(node.id, cfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, design, node.id]);

  // ── Status filter: the page filters the loaded set by the Status select ──
  const wanted = statusWanted(props.statusFilterField ? rt?.values?.[props.statusFilterField] : "");
  const rows = useMemo(
    () => (wanted ? apiRows.filter((r) => statusOf(r).label === wanted) : apiRows),
    [apiRows, wanted, statusOf],
  );

  // ── View, month, picked day ─────────────────────────────────────────────
  const [view, setView] = useState(props.defaultView === "calendar" ? "calendar" : "table");
  useEffect(() => setView(props.defaultView === "calendar" ? "calendar" : "table"), [props.defaultView]);
  const [calMonth, setCalMonth] = useState(() => moment());
  const [calDay, setCalDay] = useState(() => moment().format("YYYY-MM-DD"));

  /**
   * The page's fetchMonth: the month's first and last day into the search's
   * From / To, onMonthChange, then read the rows again.
   */
  const goMonth = (m) => {
    setCalMonth(m);
    if (design) return;
    const fmt = cal.calDateFormat || "YYYY-MM-DD";
    const month = {
      start: m.clone().startOf("month").format(fmt),
      end: m.clone().endOf("month").format(fmt),
      label: m.format("MMMM YYYY"),
      year: m.year(),
      month: m.month() + 1,
    };
    if (cal.calStartField) rt?.setValue?.(cal.calStartField, month.start);
    if (cal.calEndField) rt?.setValue?.(cal.calEndField, month.end);
    rt?.runEvent?.(node, "onMonthChange", { month });
    if (cal.calReload === false) return;
    if (props.dataMode === "action") {
      // Filled by a Search button: run its click again — it reads the From /
      // To just written, as the page's performSearch does.
      feedersOf(rt?.screen?.root, node.id).forEach(([btn, ev]) => rt?.runEvent?.(btn, ev, {}));
      return;
    }
    // An endpoint reading those fields reloads itself once they change.
    const raw = JSON.stringify(node.props?.apiConfig || {});
    const readsMonth = [cal.calStartField, cal.calEndField].some((f) => f && raw.includes(`values.${f}`));
    if (sourceId && !(ownApi && readsMonth)) rt?.refresh?.(sourceId, { force: true });
  };

  const showCalendar = () => {
    setView("calendar");
    goMonth(calMonth);
  };

  /** The page's handleClickDataGetAPI: search again with the form as it stands. */
  const reloadRows = () => {
    if (design) return;
    if (props.dataMode === "action") {
      feedersOf(rt?.screen?.root, node.id).forEach(([btn, ev]) => rt?.runEvent?.(btn, ev, {}));
    } else if (sourceId) {
      rt?.refresh?.(sourceId, { force: true });
    }
  };

  // ── The page's own row actions (props.builtInActions) ───────────────────
  const builtInOn = props.builtInActions !== false;
  // Cancel is offered only to a user with the after-confirmation cancel right,
  // read as the page reads it — on open, and again after every search.
  const [cancelRight, setCancelRight] = useState(false);
  const rowsSeen = apiRows.length;
  useEffect(() => {
    if (design || !builtInOn) return undefined;
    let alive = true;
    GetAfterConfirmationCancellationRights()
      .then((res) => {
        if (alive) setCancelRight(!!res?.success && (res?.data === true || res?.data === 1 || res?.data === "true"));
      })
      .catch(() => alive && setCancelRight(false));
    return () => {
      alive = false;
    };
  }, [design, builtInOn, apiRows, rowsSeen]);

  const [slotRow, setSlotRow] = useState(null);
  const [confirmBox, setConfirmBox] = useState({ show: false, alertMessage: "", lableMessage: "", chidren: "" });
  const [cancelBox, setCancelBox] = useState({ open: false, row: null, reason: "" });
  const [smsBox, setSmsBox] = useState({ open: false, row: null, message: "" });
  const [booking, setBooking] = useState({ open: false, data: {} });

  const updateStatus = async (row, type, remark = "") => {
    try {
      const res = await UpdateAppointmentStatus({
        appointmentID: String(row?.App_ID),
        status: type,
        remark: type === "cancel" ? remark : "",
        patientID: row?.PatientID,
        pName: row?.NAME,
        doctorName: row?.DoctorName,
        contactNo: row?.ContactNo,
        appDate: row?.AppDate,
      });
      if (res?.success) {
        notify(res.message, "success");
        reloadRows();
      } else if (res?.message) {
        notify(res.message, "error");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const reschedule = async (slot) => {
    try {
      const res = await updateAppointmentSchedule({
        slotTiming: `${slot?.SlotDateDisplay} # ${slot?.FromTimeDisplay} - ${slot?.ToTimeDisplay}`,
        appID: String(slotRow?.App_ID),
        isSlotWiseToken: "0",
        doctorID: slotRow?.DoctorID,
      });
      if (res?.success) {
        notify(res.message, "success");
        setConfirmBox((b) => ({ ...b, show: false }));
        setSlotRow(null);
        reloadRows();
      }
    } catch (e) {
      console.log(e);
    }
  };
  // SlotModal hands the picked slot here; the page asks before writing it.
  const askReschedule = (slot) =>
    setConfirmBox({
      show: true,
      alertMessage: "Reschedule Doctor Appointment",
      lableMessage: "Are you sure to Update Schedule",
      chidren: (
        <div>
          <button
            type="button"
            className="modalConfirmButton"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              reschedule(slot);
            }}
          >
            {tr("Update")}
          </button>
          <button type="button" className="modalCancelButton" onClick={() => setConfirmBox((b) => ({ ...b, show: false }))}>
            {tr("Cancel")}
          </button>
        </div>
      ),
    });

  const openBooking = async (row) => {
    try {
      const data = await GetPatientDoctorAppointmentDetails(row?.App_ID);
      setBooking({ open: true, data: { UHID: row?.PatientID, TestData: [data?.data], appointmentID: row?.App_ID } });
    } catch (e) {
      console.log(e);
    }
  };

  const sendSms = async () => {
    const row = smsBox.row;
    const mobile = row?.ContactNo;
    if (!mobile || String(mobile).trim() === "" || mobile === "NA") {
      notify(tr("Patient mobile number not available"), "error");
      return;
    }
    if (!smsBox.message || !smsBox.message.trim()) {
      notify(tr("Please enter a message"), "error");
      return;
    }
    try {
      const res = await SaveSMSDoctorsEmployee({
        Type: 2, // Patient
        ListItems: [{ id: String(row?.PatientID || ""), Message: smsBox.message, Mobile: String(mobile), Selects: 1 }],
      });
      if (res?.success) {
        notify(res?.message || tr("SMS sent successfully"), "success");
        setSmsBox({ open: false, row: null, message: "" });
      } else {
        notify(res?.message || tr("Failed to send SMS"), "error");
      }
    } catch (e) {
      console.log(e);
      notify(tr("Failed to send SMS"), "error");
    }
  };

  const runBuiltIn = (kind, row) => {
    if (kind === "confirm") updateStatus(row, "confirm");
    else if (kind === "reschedule") setSlotRow(row);
    else if (kind === "payment") openBooking(row);
    else if (kind === "cancel") setCancelBox({ open: true, row, reason: "" });
    else if (kind === "sms") {
      const message = `Dear ${row?.NAME || "Patient"}, your appointment ${row?.AppNo ? `(${row.AppNo}) ` : ""}with ${
        row?.DoctorName || ""
      } on ${row?.AppDate || ""} ${row?.AppTime || ""} is yet to be confirmed. Kindly confirm your visit.`;
      setSmsBox({ open: true, row, message });
    }
  };
  const builtIn = builtInOn ? { auth: cancelRight, run: runBuiltIn } : null;

  /** The day panel's button: the page books a new appointment on that day. */
  const onCalendarAction = (date) => {
    if (design) return;
    const chain = node.events?.onCalendarAction;
    if (builtInOn && !(Array.isArray(chain) && chain.length)) {
      // No appointment yet: 0 rather than empty — the API binds it as Int32.
      setBooking({ open: true, data: { UHID: "", appointmentID: 0, TestData: [], appointmentDate: date } });
      return;
    }
    rt?.runEvent(node, "onCalendarAction", { day: { date } });
  };

  // The canvas has no month to load: it opens on the month of its sample rows.
  useEffect(() => {
    if (!design || view !== "calendar") return;
    const first = apiRows.map((r) => calDayKey(getPath(r, cal.calDateField || "AppDate"))).find(Boolean);
    if (first && !moment(first).isSame(calMonth, "month")) {
      setCalMonth(moment(first));
      setCalDay(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, view, apiRows, cal.calDateField]);

  // ── Table: columns, chooser, sort, pages ────────────────────────────────
  const allCols = (Array.isArray(props.columns) ? props.columns : []).filter((c) => c && c.visible !== false);
  const [hidden, setHidden] = useState(() => new Set());
  const [colsOpen, setColsOpen] = useState(false);
  const colsRef = useRef(null);
  useEffect(() => {
    if (!colsOpen) return undefined;
    const onDown = (e) => {
      if (colsRef.current && !colsRef.current.contains(e.target)) setColsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [colsOpen]);

  const STATUS_COL = { key: "__status", header: "Status", align: "center", __status: true };
  const shownCols = useMemo(() => {
    const list = allCols.filter((c) => isCalendarOnlyCol(c) || c.type === "serial" || !hidden.has(c.key));
    if (props.showStatusColumn === false || hidden.has("__status")) return list;
    // The status sits just before the actions, where the page puts it.
    const at = list.findIndex(isCalendarOnlyCol);
    const out = [...list];
    out.splice(at < 0 ? out.length : at, 0, STATUS_COL);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCols, hidden, props.showStatusColumn]);
  const choosable = [
    ...allCols.filter((c) => !isCalendarOnlyCol(c) && c.type !== "serial"),
    ...(props.showStatusColumn === false ? [] : [STATUS_COL]),
  ];

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const toggleSort = (c) => {
    if (c.sortable === false || props.sortable === false || isCalendarOnlyCol(c) || c.type === "serial") return;
    if (sortKey === c.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(c.key);
      setSortDir("asc");
    }
  };
  const sorted = useMemo(() => {
    const d = [...rows];
    if (!sortKey) return d;
    const read = (r) => (sortKey === "__status" ? statusOf(r).label : getPath(r, sortKey) ?? "");
    d.sort((a, b) => {
      const av = read(a);
      const bv = read(b);
      const numeric = av !== "" && bv !== "" && !Number.isNaN(Number(av)) && !Number.isNaN(Number(bv));
      const cmp = numeric ? Number(av) - Number(bv) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [rows, sortKey, sortDir, statusOf]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(Number(props.pageSize) || 10);
  useEffect(() => setPerPage(Number(props.pageSize) || 10), [props.pageSize]);
  useEffect(() => setPage(1), [rows, perPage, sortKey, sortDir]);
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages);
  const startIdx = (safePage - 1) * perPage;
  const pageRows = sorted.slice(startIdx, startIdx + perPage);
  const pageNumbers = (() => {
    const arr = [];
    const end = Math.min(pages, Math.max(1, safePage - 2) + Math.min(pages, 5) - 1);
    for (let i = Math.max(1, end - Math.min(pages, 5) + 1); i <= end; i++) arr.push(i);
    return arr;
  })();

  const cellText = (c, r) => {
    if (c.__status) return statusOf(r).label;
    const v = typeof c.valueTemplate === "string" && c.valueTemplate.trim()
      ? interpolate(c.valueTemplate, { ...(scope || {}), row: r, ...(r || {}) })
      : getPath(r, c.key);
    return v === null || v === undefined || typeof v === "object" ? "" : v;
  };
  const handleExport = () => {
    if (design) return;
    if (!sorted.length) {
      toast.warn(tr("No records found"));
      return;
    }
    const cols = choosable.filter((c) => !hidden.has(c.key));
    const out = sorted.map((r, i) => {
      const o = { "#": i + 1 };
      cols.forEach((c) => {
        o[tr(c.header || c.key)] = cellText(c, r);
      });
      return o;
    });
    exportToExcel(out, props.exportName || "Confirmation List");
  };

  const renderActions = (row) => {
    const acts = allCols.filter(isCalendarOnlyCol);
    if (!acts.length) return null;
    return (
      <div style={{ display: "inline-flex", gap: 6 }}>
        {acts.map((c) => (
          <ActionButtons key={c.key} column={c} row={row} node={node} rt={rt} scope={scope} C={C} builtIn={builtIn} />
        ))}
      </div>
    );
  };

  // ── Styles (the page's) ──────────────────────────────────────────────────
  const toolbarBtn = {
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12.5px", fontWeight: 600,
    color: C.gray700, background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 8,
    padding: "6px 12px", cursor: "pointer",
  };
  const segBtn = (active) => ({
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12.5px", fontWeight: 600,
    color: active ? "#fff" : C.gray700, background: active ? C.blue600 : C.white,
    border: "none", padding: "6px 14px", cursor: "pointer", borderRadius: 0,
  });
  const cell = {
    padding: "11px 12px", fontSize: "12.5px", color: C.gray700,
    borderBottom: `1px solid ${C.gray100}`, verticalAlign: "middle", whiteSpace: "nowrap",
  };
  // The page's PageBtn.
  const pagerBtn = (active, disabled) => ({
    minWidth: 30, height: 30, borderRadius: 8,
    border: `1px solid ${active ? C.purple600 : C.gray200}`,
    background: active ? C.purple600 : C.white,
    color: active ? "#fff" : disabled ? C.gray400 : C.gray700,
    fontSize: "12.5px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", padding: "0 8px",
  });

  return (
    <div
      className="dsb-caltable"
      style={{
        background: C.white, borderRadius: 16, border: `1px solid ${C.gray200}`,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden", ...style,
      }}
    >
      {/* toolbar: view switch on the left, columns + export on the right */}
      <div
        data-dsb-interactive={design ? undefined : true}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.gray100}`, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {props.title ? <strong style={{ fontSize: 14, color: C.gray800 }}>{tr(props.title)}</strong> : null}
          <div style={{ display: "inline-flex", border: `1px solid ${C.gray300}`, borderRadius: 8, overflow: "hidden" }}>
            <button type="button" onClick={() => setView("table")} style={segBtn(view === "table")} title={tr("Table View")}>
              <i className="fas fa-list-ul" /> {tr("Table")}
            </button>
            <button type="button" onClick={showCalendar} style={segBtn(view === "calendar")} title={tr("Calendar View")}>
              <i className="fas fa-calendar-alt" /> {tr("Calendar")}
            </button>
          </div>
          {props.showCount !== false ? (
            <span style={pill(C.blue600, C.blue50)}>
              {rows.length} {tr("Records")}
            </span>
          ) : null}
          {loading ? <i className="fas fa-spinner fa-spin" style={{ color: C.gray500 }} aria-label="Loading" /> : null}
        </div>
        {view === "table" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {props.showColumnChooser !== false ? (
              <div ref={colsRef} style={{ position: "relative" }}>
                <button type="button" onClick={() => setColsOpen((v) => !v)} style={toolbarBtn}>
                  <i className="fas fa-table-columns" /> {tr("Columns")}
                </button>
                {colsOpen ? (
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", insetInlineEnd: 0, background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", padding: 8, zIndex: 50, minWidth: 210, maxHeight: 320, overflowY: "auto" }}>
                    {choosable.map((c) => (
                      <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: "12.5px", color: C.gray700, cursor: "pointer", borderRadius: 6, margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={!hidden.has(c.key)}
                          onChange={() =>
                            setHidden((prev) => {
                              const next = new Set(prev);
                              if (next.has(c.key)) next.delete(c.key);
                              else next.add(c.key);
                              return next;
                            })
                          }
                        />
                        {tr(c.header || c.key)}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {props.showExport !== false ? (
              <button type="button" onClick={handleExport} style={toolbarBtn}>
                <i className="fas fa-download" /> {tr("Export")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <EmptyState
          icon="AlertCircle"
          tone="danger"
          title="Could not load data"
          hint={String(error)}
          action={design || !sourceId ? null : { label: "Try again", icon: "RefreshCw", onClick: () => rt?.refresh(sourceId, { force: true }) }}
        />
      ) : null}

      {view === "calendar" ? (
        <CalendarView
          rows={rows}
          month={calMonth}
          selectedDay={calDay}
          onSelectDay={setCalDay}
          onPrev={() => goMonth(calMonth.clone().add(-1, "month"))}
          onNext={() => goMonth(calMonth.clone().add(1, "month"))}
          onToday={() => {
            const now = moment();
            setCalDay(now.format("YYYY-MM-DD"));
            goMonth(now);
          }}
          fields={{
            date: cal.calDateField || "AppDate",
            no: cal.calNoField,
            name: cal.calNameField,
            tag: cal.calTagField,
            time: cal.calTimeField,
            doctor: cal.calDoctorField,
            gender: cal.calGenderField,
            age: cal.calAgeField,
          }}
          statusOf={statusOf}
          chipOrder={chipOrder}
          renderActions={renderActions}
          actionLabel={cal.calActionLabel || ""}
          onAction={onCalendarAction}
          loading={loading}
          design={design}
        />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: Number(props.minWidth) || 1120 }}>
              <thead>
                <tr>
                  {shownCols.map((c) => {
                    const sortable = c.sortable !== false && props.sortable !== false && !isCalendarOnlyCol(c) && c.type !== "serial";
                    return (
                      <th
                        key={c.key}
                        onClick={() => toggleSort(c)}
                        style={{
                          position: "sticky", top: 0, zIndex: 2, background: C.gray50, color: C.gray500,
                          fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                          textAlign: c.align || "left", padding: "12px", borderBottom: `1px solid ${C.gray200}`,
                          whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default", userSelect: "none",
                        }}
                      >
                        {tr(c.header || c.key)}
                        {sortable ? (
                          <i
                            className={`fas fa-sort${sortKey === c.key ? (sortDir === "asc" ? "-up" : "-down") : ""}`}
                            style={{ marginInlineStart: 5, fontSize: 9, opacity: sortKey === c.key ? 1 : 0.4 }}
                          />
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={shownCols.length || 1} style={{ padding: "44px 16px", textAlign: "center", color: C.gray500 }}>
                      <div style={{ fontSize: 28, opacity: 0.35, marginBottom: 8 }}>
                        <i className={loading ? "fas fa-spinner fa-spin" : "fas fa-calendar-alt"} />
                      </div>
                      <div style={{ fontWeight: 500 }}>{tr(loading ? "Loading…" : props.emptyText || "No records found")}</div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, i) => {
                    const st = statusOf(row);
                    return (
                      <tr
                        key={i}
                        style={{ background: C.white }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.gray50)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
                        onClick={() => !design && rt?.runEvent?.(node, "onRowClick", { row })}
                      >
                        {shownCols.map((c) => {
                          let body;
                          if (c.__status) body = <span style={pill(st.color, st.tint)}>{st.label}</span>;
                          else if (c.type === "actions") body = <ActionButtons column={c} row={row} node={node} rt={rt} scope={scope} C={C} builtIn={builtIn} />;
                          else if (c.type === "serial") body = <span style={{ color: C.gray500, fontWeight: 600 }}>{startIdx + i + 1}</span>;
                          else body = (!c.valueTemplate && lookCell(c, row, C)) || <CellValue column={c} row={row} node={node} rt={rt} scope={scope} index={startIdx + i} />;
                          return (
                            <td
                              key={c.key}
                              style={{ ...cell, textAlign: c.align || "left" }}
                              onClick={isCalendarOnlyCol(c) ? (e) => e.stopPropagation() : undefined}
                              data-dsb-interactive={isCalendarOnlyCol(c) && !design ? true : undefined}
                            >
                              {body}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* footer — the page's: entries, pager, rows per page */}
          {total > 0 ? (
            <div
              data-dsb-interactive={design ? undefined : true}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "12px 16px", borderTop: `1px solid ${C.gray100}` }}
            >
              <span style={{ fontSize: "12.5px", color: C.gray600 }}>
                {tr("Showing")} {startIdx + 1} {tr("to")} {Math.min(startIdx + perPage, total)} {tr("of")} {total} {tr("entries")}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                <button type="button" style={pagerBtn(false, safePage === 1)} disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
                <button type="button" style={pagerBtn(false, safePage === 1)} disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
                {pageNumbers.map((n) => (
                  <button type="button" key={n} style={pagerBtn(n === safePage, false)} onClick={() => setPage(n)}>
                    {n}
                  </button>
                ))}
                <button type="button" style={pagerBtn(false, safePage === pages)} disabled={safePage === pages} onClick={() => setPage(safePage + 1)}>›</button>
                <button type="button" style={pagerBtn(false, safePage === pages)} disabled={safePage === pages} onClick={() => setPage(pages)}>»</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12.5px", color: C.gray600 }}>
                {tr("Rows per page")}:
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value) || 10)}
                  style={{ border: `1px solid ${C.gray300}`, borderRadius: 8, padding: "4px 8px", fontSize: "12.5px", color: C.gray700, background: C.white }}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ── The page's modals ─────────────────────────────────────────────── */}
      {slotRow ? (
        <Modal visible={!!slotRow} setVisible={() => setSlotRow(null)} modalWidth="95vw" Header={tr("Doctor Slot")} footer={<></>}>
          <Suspense fallback={<div style={{ padding: 24 }}>{tr("Loading…")}</div>}>
            <SlotModal
              data={{ ...slotRow, Type_ID: slotRow.DoctorID, AppointedDate: moment().format("YYYY-MM-DD"), Item: slotRow?.DoctorName }}
              handleSetData={() => setSlotRow(null)}
              typePage="confirmation"
              handleConfirmBox={askReschedule}
              confirmBoxvisible={confirmBox}
            />
          </Suspense>
        </Modal>
      ) : null}

      {confirmBox.show ? (
        <Confirm alertMessage={confirmBox.alertMessage} lableMessage={confirmBox.lableMessage} confirmBoxvisible={confirmBox}>
          {confirmBox.chidren}
        </Confirm>
      ) : null}

      {cancelBox.open ? (
        <Modal
          visible={cancelBox.open}
          setVisible={() => setCancelBox({ open: false, row: null, reason: "" })}
          modalWidth="30vw"
          Header={tr("Cancel Oppointment")}
          modalData={cancelBox}
          handleAPI={() => {
            if (!cancelBox.reason || !cancelBox.reason.trim()) {
              notify(tr("Please Enter Cancel Resion"), "error");
              return;
            }
            updateStatus(cancelBox.row, "cancel", cancelBox.reason);
            setCancelBox({ open: false, row: null, reason: "" });
          }}
        >
          <div style={{ padding: "4px 2px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: C.gray700 }}>{tr("Cancel Reason")}</label>
            <textarea
              rows={5}
              maxLength={500}
              value={cancelBox.reason}
              onChange={(e) => setCancelBox((b) => ({ ...b, reason: e.target.value }))}
              style={{ width: "100%", border: `1px solid ${C.gray300}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: C.gray700, background: C.white, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
            <div style={{ fontSize: 11, color: C.gray500, textAlign: "end" }}>{cancelBox.reason.length}/500</div>
          </div>
        </Modal>
      ) : null}

      {smsBox.open ? (
        <Modal
          visible={smsBox.open}
          setVisible={() => setSmsBox({ open: false, row: null, message: "" })}
          modalWidth="34vw"
          Header={tr("Send SMS to Patient")}
          footer={<></>}
        >
          <div style={{ padding: "4px 2px" }}>
            <div style={{ fontSize: "12.5px", color: C.gray600, marginBottom: 8 }}>
              {tr("To")}: <b style={{ color: C.gray800 }}>{smsBox.row?.NAME || "-"}</b>
              {" — "}
              <span style={{ color: smsBox.row?.ContactNo ? C.gray700 : C.red600 }}>{smsBox.row?.ContactNo || tr("No mobile number")}</span>
            </div>
            <textarea
              rows={5}
              maxLength={320}
              value={smsBox.message}
              onChange={(e) => setSmsBox((b) => ({ ...b, message: e.target.value }))}
              placeholder={tr("Enter message")}
              style={{ width: "100%", minHeight: 120, border: `1px solid ${C.gray300}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, lineHeight: 1.5, color: C.gray700, background: C.white, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", whiteSpace: "pre-wrap" }}
            />
            <div style={{ fontSize: 11, color: C.gray500, textAlign: "end", marginTop: 4 }}>{smsBox.message?.length || 0}/320</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSmsBox({ open: false, row: null, message: "" })}>
                {tr("Cancel")}
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={sendSms}>
                <i className="fas fa-paper-plane mr-1" /> {tr("Send SMS")}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {booking.open ? (
        <Modal
          visible={booking.open}
          setVisible={() => setBooking({ open: false, data: {} })}
          modalWidth="96vw"
          style={{ height: "94vh" }}
          contentStyle={{ height: "84vh", overflowY: "auto" }}
          Header="OPD Service Booking"
          footer={<></>}
        >
          <Suspense fallback={<div style={{ padding: 24 }}>{tr("Loading…")}</div>}>
            <OPDServiceBooking
              UHID={booking.data.UHID}
              appointmentID={booking.data.appointmentID}
              TestData={booking.data.TestData}
              appointmentDate={booking.data.appointmentDate}
              handleConfirmationSubmit={() => {
                setBooking({ open: false, data: {} });
                reloadRows();
              }}
            />
          </Suspense>
        </Modal>
      ) : null}
    </div>
  );
}

const CalendarTableDef = {
  type: "CalendarTable",
  label: "Table + Calendar",
  icon: "CalendarDays",
  category: "Data",
  bindable: true,
  defaultProps: {
    title: "",
    // The page is filled by its Search button — so is this, to begin with.
    dataMode: "action",
    staticRows: [],
    apiConfig: createApiConfig(),
    previewRows: [],
    dataSourceId: "",
    columns: DEFAULT_COLUMNS,
    defaultView: "table",
    showStatusColumn: true,
    showColumnChooser: true,
    showExport: true,
    showCount: false,
    sortable: true,
    pageSize: 10,
    exportName: "Confirmation List",
    emptyText: "No records found",
    minWidth: 1120,
    statusFilterField: "status",
    calDateField: "AppDate",
    calNoField: "AppNo",
    calNameField: "NAME",
    calTagField: "ConsultType",
    calTimeField: "AppTime",
    calDoctorField: "DoctorName",
    calGenderField: "Gender",
    calAgeField: "Age",
    calStartField: "fromDate",
    calEndField: "toDate",
    calDateFormat: "YYYY-MM-DD",
    calReload: true,
    calActionLabel: "New Appointment",
    builtInActions: true,
    calStatuses: DEFAULT_CAL_STATUSES,
  },
  defaultStyle: {},
  // onRowAction: an action icon with no chain of its own ({{row}}, {{action.label}}).
  // onMonthChange: {{month.start}} … {{month.end}}. onCalendarAction: {{day.date}}.
  events: ["onRowClick", "onRowAction", "onMonthChange", "onCalendarAction"],
  propSchema: [
    p.text("title", "Title"),
    p.select("defaultView", "Opens on", [
      { value: "table", label: "Table" },
      { value: "calendar", label: "Calendar (month)" },
    ]),
    p.select(
      "dataMode",
      "Rows come from",
      [
        { value: "static", label: "Static rows (edited here)" },
        { value: "api", label: "Its own API endpoint" },
        { value: "action", label: "Filled by a button / action" },
      ],
      GROUPS.DATA,
    ),
    { key: "staticRows", label: "Rows", type: "rows", group: GROUPS.DATA, when: (pr) => (pr.dataMode || "static") === "static" },
    { key: "apiConfig", label: "API endpoint", type: "apiEndpoint", group: GROUPS.DATA, when: (pr) => pr.dataMode === "api" },
    {
      key: "actionNote",
      label: "How this is filled",
      type: "note",
      group: GROUPS.DATA,
      when: (pr) => pr.dataMode === "action",
      text: (ctx) => {
        const feeders = (ctx?.nodes || []).filter((n) =>
          Object.values(n.events || {}).some((list) => (list || []).some((a) => a?.type === "callApi" && a.targetId === ctx.nodeId)),
        );
        if (feeders.length) {
          return `Filled by ${feeders.map((n) => n.name).join(", ")}. A month change in the calendar presses it again, after writing the month into the From / To fields below.`;
        }
        return "Nothing fills this yet. Select the Search button, open its Events tab, add a Call API action, pick the endpoint, then set “Put the rows into” to this component.";
      },
    },
    p.columns("columns", "Columns", GROUPS.DATA),
    p.formField("statusFilterField", "Show only the status picked in", GROUPS.BEHAVIOUR, {
      hint: "The page's Status select: its value (Confirmed, Pending…) narrows the rows by the statuses below. All or empty shows every row.",
    }),
    p.bool("builtInActions", "Built-in confirmation actions", GROUPS.BEHAVIOUR, {
      hint: "On: Confirm, Reschedule (slot picker), Payment (OPD Service Booking), Cancel (with a reason, for users with the cancel right) and Send SMS do exactly what the OPD Confirmation page does, and the calendar's New Appointment opens OPD Service Booking on that day. A button with its own On click chain, or onCalendarAction with a chain, runs that instead.",
    }),
    p.bool("showStatusColumn", "Status column", GROUPS.APPEARANCE),
    p.bool("showColumnChooser", "Columns button", GROUPS.APPEARANCE),
    p.bool("showExport", "Export button", GROUPS.APPEARANCE),
    p.bool("showCount", "Record count", GROUPS.APPEARANCE),
    p.bool("sortable", "Sortable", GROUPS.BEHAVIOUR),
    p.number("pageSize", "Rows per page"),
    p.number("minWidth", "Table minimum width (px)"),
    p.text("exportName", "Export file name"),
    p.text("emptyText", "Empty text"),
    p.dataKey("calDateField", "Calendar — date field", GROUPS.BEHAVIOUR, {
      hint: "The field holding each record's date — DD-MMM-YYYY, YYYY-MM-DD, DD-MM-YYYY or MM/DD/YYYY.",
    }),
    p.dataKey("calNameField", "Calendar — name field", GROUPS.BEHAVIOUR),
    p.dataKey("calNoField", "Calendar — number field", GROUPS.BEHAVIOUR, { hint: "Shown in brackets before the name." }),
    p.dataKey("calTagField", "Calendar — tag field", GROUPS.BEHAVIOUR, { hint: "Shown in square brackets after the name." }),
    p.dataKey("calTimeField", "Calendar — time field", GROUPS.BEHAVIOUR),
    p.dataKey("calDoctorField", "Calendar — doctor field", GROUPS.BEHAVIOUR),
    p.dataKey("calGenderField", "Calendar — gender field", GROUPS.BEHAVIOUR),
    p.dataKey("calAgeField", "Calendar — age field", GROUPS.BEHAVIOUR),
    p.formField("calStartField", "Calendar — month start goes into", GROUPS.BEHAVIOUR, {
      hint: "The From date field the search reads. Empty writes nothing.",
    }),
    p.formField("calEndField", "Calendar — month end goes into", GROUPS.BEHAVIOUR, {
      hint: "The To date field the search reads. Empty writes nothing.",
    }),
    p.text("calDateFormat", "Calendar — date format written", GROUPS.BEHAVIOUR, { placeholder: "YYYY-MM-DD" }),
    p.bool("calReload", "Calendar — reload on a month change", GROUPS.BEHAVIOUR, {
      hint: "Its own endpoint is read again; when a button fills it, that button is pressed again.",
    }),
    p.text("calActionLabel", "Calendar — day panel button", GROUPS.BEHAVIOUR, {
      placeholder: "New Appointment",
      hint: "A button beside the picked day's count. Its click runs onCalendarAction with {{day.date}} (YYYY-MM-DD). Empty draws no button.",
    }),
    {
      key: "calStatuses",
      label: "Statuses",
      type: "calStatuses",
      group: GROUPS.BEHAVIOUR,
      hint: "Tested top to bottom; the first that holds names the record. One with no test is the “otherwise”. Used by the calendar chips, the Status column and the status filter.",
    },
  ],
  render: (args) => <CalendarTable {...args} />,
};

export default [CalendarTableDef];
