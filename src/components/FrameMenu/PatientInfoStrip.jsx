import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Layers,
  Phone,
  Plus,
  Stethoscope,
} from "lucide-react";
import noImage from "../../assets/image/avatar.gif";
import "./patientInfoStrip.css";

// Compact pastel patient strip for PersonalDetailsOfPatient (IPD).
// Rendered in both classic and modern views.

const isBlank = (v) =>
  v == null || String(v).trim() === "" || String(v).trim() === "-";

const HONORIFIC = /^(mr|mrs|ms|miss|dr|master|baby|b\/o)\.?\s+/i;

// "Mrs. REEMA SINHA" -> { prefix: "Mrs.", rest: "REEMA SINHA" }
const splitName = (name = "") => {
  const s = String(name).trim();
  const m = s.match(HONORIFIC);
  return m ? { prefix: m[0].trim(), rest: s.slice(m[0].length) } : { prefix: "", rest: s };
};

// "25 YRS / Female" -> "Female · 25 y"
const formatAgeSex = (ageSex = "") => {
  const [age = "", sex = ""] = String(ageSex).split("/").map((x) => x.trim());
  const shortAge = age.replace(/\s*(yrs?|years?)\.?$/i, " y").trim();
  return [sex, shortAge].filter(Boolean).join(" · ");
};

// "gnnnn002-0002 / Bed:0002 / ..." -> "gnnnn002-0002 · Bed 0002"
const formatRoom = (room = "") =>
  String(room)
    .split("/")
    .map((x) => x.trim().replace(/^bed\s*:\s*/i, "Bed "))
    .filter((x) => x && x !== "..." && x !== "-")
    .join(" · ");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// "26-Aug-2026 1:33 PM" -> Date (date part only)
const parseDmy = (value = "") => {
  const m = String(value).match(/(\d{1,2})[-\s]([A-Za-z]{3})[A-Za-z]*[-\s](\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  return month < 0 ? null : new Date(Number(m[3]), month, Number(m[1]));
};

const fmtDate = (d) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].replace(/^./, (c) => c.toUpperCase())} ${d.getFullYear()}`;

// Day N of stay; counts to discharge date when discharged.
const stayDay = (admit, discharge) => {
  if (!admit) return null;
  const end = discharge || new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.round((endDay - admit) / 86400000);
  return diff >= 0 ? diff + 1 : null;
};

const statusTone = (status = "") => {
  const s = String(status).toLowerCase();
  if (s.includes("discharg")) return "amber";
  if (s.includes("admit")) return "green";
  return "slate";
};

const CopyPill = ({ label, value }) => {
  const [copied, setCopied] = useState(false);
  if (isBlank(value)) return null;
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <span className="pst-idpill">
      <span className="pst-idpill-key">{label}</span>
      <span className="pst-idpill-val">{value}</span>
      <button
        type="button"
        className={`pst-copy${copied ? " is-copied" : ""}`}
        onClick={copy}
        title={copied ? "Copied" : `Copy ${label}`}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </span>
  );
};

// Fact chip. When the value is cut off with "…", hovering shows a styled
// tooltip with the full text (tinted to the chip's colour).
const Tile = ({ Icon, tone, label, value, sub, title, className = "", action = null }) => {
  const valueRef = useRef(null);
  const [tip, setTip] = useState(false);
  const empty = isBlank(value);
  const full = empty ? "" : [title || value, sub].filter(Boolean).join(" · ");

  const onEnter = () => {
    const el = valueRef.current;
    if (el && !empty && el.scrollWidth > el.clientWidth) setTip(true);
  };

  return (
    <div
      className={`pst-tile pst-t-${tone}${tip ? " has-tip" : ""} ${className}`}
      onMouseEnter={onEnter}
      onMouseLeave={() => setTip(false)}
    >
      <span className="pst-tile-icon">
        <Icon size={14} strokeWidth={2.2} />
      </span>
      <span className="pst-tile-text">
        <span className="pst-tile-label">{label}</span>
        <span ref={valueRef} className={`pst-tile-value${empty ? " is-empty" : ""}`}>
          {empty ? "—" : value}
          {sub && <span className="pst-tile-sub"> · {sub}</span>}
        </span>
      </span>
      {action}
      {tip && (
        <span className="pst-tip" role="tooltip">
          <span className="pst-tip-label">
            <Icon size={12} strokeWidth={2.4} />
            {label}
          </span>
          <span className="pst-tip-text">{full}</span>
        </span>
      )}
    </div>
  );
};

// billingCategory: shown as its own tile when given. onAddPanel: a "+" in the Panel tile
// (Add/Remove panels), shown only when given.
const PatientInfoStrip = ({ data = {}, t = (x) => x, billingCategory = null, onAddPanel = null }) => {
  const {
    patientID,
    pName,
    roomName,
    dName,
    ageSex,
    admitDate,
    company_Name,
    ipdno,
    mobile,
    dischargeDate,
    patientPhoto,
    currentDischargeStepName,
  } = data;
  // Collapsed = first line only. Starts collapsed; the arrow shows the rest.
  const [collapsed, setCollapsed] = useState(true);
  // How many flow items fit on the first line (rest wrap to line 2, 3, …).
  const flowRef = useRef(null);
  const [firstLineCount, setFirstLineCount] = useState(Infinity);
  // broken photo URL -> legacy placeholder (avatar + hover preview together)
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => setPhotoFailed(false), [patientPhoto]);
  const avatarSrc = patientPhoto && !photoFailed ? patientPhoto : noImage;

  const { prefix, rest } = splitName(pName);
  const admit = parseDmy(admitDate);
  const discharge = isBlank(dischargeDate) ? null : parseDmy(dischargeDate);
  const day = stayDay(admit, discharge);
  const room = formatRoom(roomName);

  // Measure with every chip shown (pst-measure forces display), find the
  // first chip whose top sits below row 1. The grid fills row 1 as a prefix,
  // so hiding later chips never changes what row 1 holds.
  const measure = useCallback(() => {
    const el = flowRef.current;
    if (!el) return;
    el.classList.add("pst-measure");
    const items = Array.from(el.children);
    const top0 = items[0]?.offsetTop ?? 0;
    const idx = items.findIndex((it) => it.offsetTop > top0 + 4);
    el.classList.remove("pst-measure");
    setFirstLineCount(idx === -1 ? items.length : idx);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = flowRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, data]);

  const tiles = [
    { key: "room", Icon: BedDouble, tone: "lilac", label: t("Room No."), value: room },
    { key: "doctor", Icon: Stethoscope, tone: "mint", label: t("Attending"), value: dName },
    {
      key: "admit",
      Icon: CalendarDays,
      tone: "peach",
      label: t("Admitted"),
      value: admit ? fmtDate(admit) : admitDate,
      sub: day ? `${t("Day")} ${day}` : "",
      title: admitDate,
    },
    {
      key: "panel",
      Icon: CreditCard,
      tone: "sky",
      label: t("Panel"),
      value: company_Name,
      action: onAddPanel ? (
        <button
          type="button"
          className="pst-tile-action"
          disabled={isBlank(patientID)}
          onClick={(e) => {
            e.stopPropagation();
            onAddPanel();
          }}
          title={t("Add/Remove Panels List")}
        >
          <Plus size={13} strokeWidth={2.6} />
        </button>
      ) : null,
    },
    { key: "mobile", Icon: Phone, tone: "rose", label: t("Mobile No."), value: mobile },
    ...(billingCategory !== null
      ? [{ key: "billing", Icon: Layers, tone: "teal", label: t("Billing Category"), value: billingCategory }]
      : []),
    { key: "discharge", Icon: CalendarCheck, tone: "amber", label: t("Discharge Date"), value: dischargeDate },
  ];

  const totalItems = tiles.length;
  const hiddenCount = Math.max(0, totalItems - firstLineCount);
  const wraps = hiddenCount > 0;
  const itemCls = (i) => `pst-item${i >= firstLineCount ? " is-wrapped" : ""}`;

  return (
    <section className={`pst-strip${collapsed && wraps ? " is-collapsed" : ""}`}>
      {/* who: photo spanning the block; name · age/sex over the UHID / IPD pills */}
      <div className="pst-ident-col">
        <div className="pst-avatar-wrap">
          <div className={`pst-avatar${avatarSrc === noImage ? " is-placeholder" : ""}`}>
            <img
              src={avatarSrc}
              alt={pName || "patient"}
              onError={() => setPhotoFailed(true)}
            />
          </div>
          {/* hover preview: fades + zooms in from the avatar */}
          <div className="pst-zoom" aria-hidden="true">
            <img src={avatarSrc} alt="" />
          </div>
        </div>
        <div className="pst-ident-main" title={pName}>
          <div className="pst-name-line">
            {prefix && <span className="pst-name-prefix">{prefix}</span>}
            <span className="pst-name">{rest}</span>
          </div>
          {!isBlank(ageSex) && <div className="pst-agesex">{formatAgeSex(ageSex)}</div>}
        </div>
        {/* UHID over IPD No */}
        <div className="pst-ids">
          <CopyPill label={t("UHID")} value={patientID} />
          <CopyPill label={t("IPD")} value={ipdno} />
        </div>
      </div>

      {/* key facts: an even grid — equal chip widths that stretch to fill the row,
          wrapping to more rows as the screen narrows */}
      <div className="pst-flow" ref={flowRef}>
        {tiles.map(({ key, ...tile }, i) => (
          <Tile key={key} {...tile} className={itemCls(i)} />
        ))}
      </div>

      {/* status + collapse (only when something actually wraps) */}
      <div className="pst-actions">
        {!isBlank(currentDischargeStepName) && (
          <span className={`pst-status pst-s-${statusTone(currentDischargeStepName)}`}>
            {currentDischargeStepName}
          </span>
        )}
        {wraps && (
          <button
            type="button"
            className="pst-expand"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? t("Show all details") : t("Show first line only")}
            aria-expanded={!collapsed}
          >
            {collapsed && <span className="pst-more-count">+{hiddenCount}</span>}
            <ChevronDown size={15} />
          </button>
        )}
      </div>
    </section>
  );
};

export default PatientInfoStrip;
