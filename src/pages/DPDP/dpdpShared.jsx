import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import Heading from "../../components/UI/Heading";
import ReactSelect from "../../components/formComponent/ReactSelect";
import { translateIfKnown } from "../../components/WrapTranslate";
import { DpdpConfig, DpdpEmployeeSearch } from "../../networkServices/DpdpApi";
import { toCamelKey } from "../../utils/utils";

/** DPDP Data Privacy - helpers shared by every screen (4 Nov 2026). */

export const COL = "col-xl-2 col-md-4 col-sm-6 col-12";
export const COL3 = "col-xl-3 col-md-4 col-sm-6 col-12";
export const COL4 = "col-xl-4 col-md-6 col-12";

export const useTr = () => {
  const [t] = useTranslation();
  return (s) => translateIfKnown(t, s);
};

export const fdate = (d) => (d && !String(d).startsWith("0001") ? moment(d).format("DD MMM YYYY") : "–");
export const fdatetime = (d) => (d && !String(d).startsWith("0001") ? moment(d).format("DD MMM YYYY hh:mm A") : "–");
export const isoDate = (d) => (d ? moment(d).format("YYYY-MM-DD") : "");
export const isoDateTime = (d) => (d ? moment(d).format("YYYY-MM-DDTHH:mm") : "");
export const toDate = (iso) => (iso && !String(iso).startsWith("0001") ? moment(iso).toDate() : null);
export const fromPicker = (e) => {
  const v = e?.target?.value ?? e?.value;
  return v ? moment(v).format("YYYY-MM-DD") : "";
};
export const goTo = (navigate, url, extra = {}) => navigate(url, { state: { actualUrl: url, ...extra } });
export const yes = (v) => v === true || v === 1 || v === "1";

/** API wrapper rows: anonymous objects arrive camelCase, Dapper rows keep column case. */
export const f = (obj, name) => (obj ? (obj[name] !== undefined ? obj[name] : obj[toCamelKey(name)]) : undefined);

export const BASIS = {
  CONSENT: "Consent (optional)",
  LEGIT: "Service the patient asked for - s.7(a)",
  EMERG: "Medical emergency - s.7(f)",
  LAW: "Required by law - s.7",
};
export const SERVICES = { HIV: "HIV / ICTC / ART", MH: "Mental health", MTP: "MTP", PCPNDT: "PCPNDT (pregnancy USG)", ANC: "Antenatal", STAFF: "Staff patients", VIP: "VIP", OTHER: "Other" };
export const REQUEST_TYPES = {
  ACCESS: "Access - summary of my data (s.11)",
  CORRECTION: "Correction / update (s.12)",
  ERASURE: "Erasure (s.12)",
  WITHDRAW: "Withdraw consent (s.6(4))",
  NOMINATE: "Nominate a person (s.14)",
  GRIEVANCE: "Grievance / complaint (s.13)",
  OTHER: "Other",
};
export const REQUEST_STATUS = { OPEN: "Open", IN_PROGRESS: "In progress", REPLIED: "Replied", CLOSED: "Closed", REJECTED: "Rejected" };
export const CONSENT_STATUS = { GIVEN: "Given", REFUSED: "Refused", WITHDRAWN: "Withdrawn" };
export const ROLES = { OFFICE: "Privacy Office (everything)", DESK: "Rights desk (requests, patient record)", VIEW: "Read only" };

export function Section({ title, right, children, className = "mt-2" }) {
  return (
    <div className={`border ${className}`}>
      <Heading title={title} isBreadcrumb={false} secondTitle={right} />
      <div className="p-2">{children}</div>
    </div>
  );
}

export function Badge({ tone = "off", children, title }) {
  return (
    <span className={`dpdp-badge ${tone}`} title={title}>
      {children}
    </span>
  );
}

/** The consent badge for a patient state returned by Dpdp/Status. */
export function StateBadge({ state }) {
  const tr = useTr();
  if (!state) return null;
  const s = (k) => f(state, k);
  return (
    <span className="d-inline-flex flex-wrap align-items-center" style={{ gap: 4 }}>
      <Badge tone={s("Tone")}>{tr(s("Label"))}</Badge>
      {yes(s("IsMinor")) && <Badge tone="info">{tr("Minor - guardian decides")}</Badge>}
      {yes(s("IsRestricted")) && <Badge tone="bad" title={s("RestrictReason")}>{tr("Restricted record")}</Badge>}
      {yes(s("LegalHold")) && <Badge tone="warn">{tr("Legal hold")}</Badge>}
    </span>
  );
}

let configCache = null;
export const useDpdpConfig = () => {
  const [c, setC] = useState(configCache);
  useEffect(() => {
    if (configCache) return;
    DpdpConfig().then((r) => {
      configCache = r?.success ? r.data : { installed: false };
      setC(configCache);
    });
  }, []);
  return c;
};
export const forgetConfig = () => {
  configCache = null;
};

let employeesCache = null;
export function EmployeeSelect({ placeholder, value, onChange, respclass = COL, id }) {
  const tr = useTr();
  const [list, setList] = useState(employeesCache || []);
  useEffect(() => {
    if (employeesCache) return;
    DpdpEmployeeSearch("").then((r) => {
      if (r?.success) {
        employeesCache = (r.data || []).map((e) => ({ value: e.EmployeeID, label: `${e.EmployeeName} (${e.EmployeeID})`, name: e.EmployeeName }));
        setList(employeesCache);
      }
    });
  }, []);
  return (
    <ReactSelect
      placeholderName={tr(placeholder || "Employee")}
      id={id || "dpdp-emp"}
      name="Employee"
      searchable={true}
      respclass={respclass}
      dynamicOptions={list}
      value={value}
      handleChange={(_, o) => onChange(o?.value || "", o?.name || "")}
    />
  );
}

/** Opens a printable window. Used for the access summary and the breach report. */
export const printHtml = (title, html) => {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:13px;margin:24px;color:#1b2430}h1{font-size:20px}h2{font-size:15px;margin-top:18px}
table{border-collapse:collapse;width:100%;margin-top:6px}td,th{border:1px solid #ccd;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f2f4f7}
.muted{color:#5a6576}</style></head><body>${html}<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
  return true;
};

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Renders the access summary (s.11) returned by Dpdp/Summary or DpdpPublic/Summary as printable HTML. */
export const summaryHtml = (d) => {
  if (!d) return "";
  const p = d.patient || {};
  const rows = (list, cols) =>
    (list || []).length
      ? `<table><tr>${cols.map((c) => `<th>${esc(c[0])}</th>`).join("")}</tr>${(list || [])
          .map((r) => `<tr>${cols.map((c) => `<td>${esc(typeof c[1] === "function" ? c[1](r) : r[c[1]])}</td>`).join("")}</tr>`)
          .join("")}</table>`
      : `<p class="muted">None</p>`;
  return `<h1>${esc(d.hospital)} - summary of your personal data</h1>
<p class="muted">Generated ${esc(fdatetime(d.generatedOn))} under section 11 of the Digital Personal Data Protection Act, 2023. Contact: ${esc(d.contact)}</p>
<h2>About you</h2>
<table><tr><th>UHID</th><td>${esc(p.uhid)}</td><th>Name</th><td>${esc(p.name)}</td></tr>
<tr><th>Age / gender</th><td>${esc(p.age)} / ${esc(p.gender)}</td><th>Date of birth</th><td>${esc(p.dob || "-")}</td></tr>
<tr><th>Mobile</th><td>${esc(p.mobile)}</td><th>Email</th><td>${esc(p.email || "-")}</td></tr>
<tr><th>Address</th><td colspan="3">${esc(p.address || "-")}</td></tr></table>
<h2>What we hold</h2><ul>${(d.dataHeld || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Your visits</h2>${rows(d.visits, [["Type", "Type"], ["Visits", "Visits"], ["First", (r) => fdate(r.FirstOn)], ["Last", (r) => fdate(r.LastOn)]])}
<h2>What we use it for, and your choices</h2>${rows(d.consents, [["Purpose", "Name"], ["Basis", (r) => BASIS[r.Basis] || r.Basis], ["Your choice", "Status"], ["Since", (r) => fdate(r.StatusOn)]])}
<h2>Insurers, TPAs and schemes your bills went to</h2>${rows(d.payers, [["Payer", "Payer"], ["Visits", "Visits"], ["Last", (r) => fdate(r.LastOn)]])}
<h2>Who else received it</h2>${rows(d.disclosures, [["Recipient", (r) => `${r.RecipientType} ${r.RecipientName || ""}`], ["What", "DataShared"], ["Times", "Times"], ["Last", (r) => fdate(r.LastOn)]])}
<h2>Service providers that process data for us</h2>${rows(d.processors, [["Name", "Name"], ["Type", "Category"], ["Purpose", "Purpose"], ["Country", "Country"]])}
<h2>Your nominee</h2>${rows(d.nominees, [["Name", "NomineeName"], ["Relation", "Relation"], ["Since", (r) => fdate(r.CreatedOn)]])}`;
};

/** A signature pad. Returns a PNG data URL through onChange (null when cleared). */
export function SignaturePad({ onChange, label }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1b2430";
  }, []);
  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e) => {
    drawing.current = true;
    const ctx = ref.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(...pos(e));
    ref.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = ref.current.getContext("2d");
    ctx.lineTo(...pos(e));
    ctx.stroke();
    dirty.current = true;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange?.(ref.current.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange?.(null);
  };
  return (
    <div>
      {label && <div className="mb-1">{label}</div>}
      <canvas ref={ref} className="dpdp-sig" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <div className="text-right">
        <span className="dpdp-link" role="button" onClick={clear}>
          Clear
        </span>
      </div>
    </div>
  );
}
