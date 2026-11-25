import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "primereact/tooltip";
import { FaStar, FaFileMedical, FaClock, FaCheckCircle, FaSearch, FaShare } from "react-icons/fa";
import { FaKitMedical } from "react-icons/fa6";
import { GiMedicines } from "react-icons/gi";
import { ActionButton, DataTable, StatusPill, EmptyState } from "../../../modern";
import { maskValue } from "../../../../../utils/constant";
import { maxLengthChecker } from "../../../../../utils/utils";
import { getAppointmentStatus } from "../../../../../utils/appointmentStatus";
import useAppointmentActions from "./useAppointmentActions";

/**
 * View Consultation - the MODERN look of the two appointment tables (the "table look"
 * alternative to PendingAppointmentPatientList / DoneAppointmentDetail, picked with the
 * Table | Modern switch on the page). The page header, the search form, the legend and
 * every handler stay the classic page's own; only what is inside the two cards changes.
 *
 * Desktop: hx DataTable - patient with UHID and age under the name, token circle over
 * the visit number, doctor over the appointment date, status pill, soft icon squares,
 * Invite / RPM / Call / IN buttons and a chevron that opens the visit date track.
 * Phone: the same rows as cards.  Colours follow the app theme through the hx tokens.
 */

const tt = (t, s) => t(s, { defaultValue: s });
const vipOf = (item) => item?.PatientType === "VIP";
const nameOf = (item) => (vipOf(item) ? maskValue(item?.Pname) : item?.Pname);
const ageOf = (item) => (vipOf(item) ? maskValue(`${item?.Age}/${item?.Sex}`) : `${item?.Age ?? ""} / ${item?.Sex ?? ""}`);

const dates = (t, item) => [
  [tt(t, "Reg. date"), item?.RegDate],
  [tt(t, "App. date"), item?.AppDateTime || item?.AppointmentDate],
  [tt(t, "Call date"), item?.CallDate],
  [tt(t, "Start date"), item?.StartDa],
  [tt(t, "End date"), item?.EndDate],
];

/** Rows that match the typed text, each carrying its ORIGINAL index: Call / In / Invite /
 *  RPM are keyed by that index into the unfiltered list. */
const filterRows = (rows, query) => {
  const q = String(query || "").trim().toLowerCase();
  return rows
    .map((row, i) => ({ row, i }))
    .filter(({ row }) => {
      if (!q) return true;
      const s = getAppointmentStatus(row);
      const hay = [row?.Pname, row?.MRNo, row?.DName, row?.TransNo, row?.GenralTokenNo, row?.AppointmentDate, row?.Age, row?.Sex, row?.ContactNo, s?.label]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" | ");
      return hay.includes(q);
    });
};

/** Search box + "shown of total" above a list. */
const ListBar = ({ t, query, setQuery, shown, total, placeholder }) => (
  <div className="hx-listbar">
    <label className="hx-listbar__search">
      <FaSearch />
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {query ? (
        <button type="button" className="hx-listbar__clear" onClick={() => setQuery("")} title={tt(t, "Clear")}>
          &times;
        </button>
      ) : null}
    </label>
    <span className="hx-listbar__count">
      {shown} {tt(t, "of")} {total}
    </span>
  </div>
);

const doctorCell = (item, index, prefix) => (
  <>
    <span id={`${prefix}-doc-${index}`} className="hx-table__primary">
      {maxLengthChecker(item?.DName, 30)}
    </span>
    {item?.DName?.length > 10 && <Tooltip target={`#${prefix}-doc-${index}`} content={item?.DName} />}
  </>
);

/* ------------------------------------------------------------------ pending */
export function PendingAppointmentsModern({
  tbody = [],
  handleCallButtonClick,
  handlePatientSelect,
  setSelectedPatient,
  setShowFlowSheet,
  setShowMedicationCalendar,
  setShowNotesModal,
  // fin_global_resources IsShowInvitePatientColumn / IsShowRPMColumn
  showInvitePatient = true,
  showRPM = true,
}) {
  const [t] = useTranslation();
  const [openRow, setOpenRow] = useState(null);
  const [query, setQuery] = useState("");
  const rows = tbody || [];
  const entries = useMemo(() => filterRows(rows, query), [rows, query]);
  const { openInvite, openRpm, modals } = useAppointmentActions(rows);

  const statusCell = (item) => {
    const s = getAppointmentStatus(item);
    return (
      <StatusPill colour={s.colour} dot={s.dot}>
        {tt(t, s.label)}
      </StatusPill>
    );
  };
  const flowButtons = (item) => (
    <div className="hx-table__actions">
      <button type="button" className="hx-iconbtn" title={tt(t, "Flow Sheet")} onClick={() => { setSelectedPatient(item); setShowFlowSheet(true); }}>
        <FaFileMedical />
      </button>
      <button type="button" className="hx-iconbtn" title={tt(t, "Medication Calendar")} onClick={() => setShowMedicationCalendar(item)}>
        <GiMedicines />
      </button>
      <button type="button" className="hx-iconbtn" title={tt(t, "Prescription Calendar")} onClick={() => setShowNotesModal(item)}>
        <FaKitMedical />
      </button>
    </div>
  );
  const inviteBtn = (item, i) =>
    item?.IsTeleconsulation === 1 ? (
      <ActionButton size="sm" className="hx-btn--success-soft" disabled title={tt(t, "Invitation already sent")}>
        {tt(t, "Invited")}
      </ActionButton>
    ) : (
      <ActionButton size="sm" variant="primary" onClick={() => openInvite(item, i)} title={tt(t, "Schedule Meeting with Patient")}>
        {tt(t, "Invite")}
      </ActionButton>
    );
  const rpmBtn = (item, i) => (
    <ActionButton size="sm" variant="success" onClick={() => openRpm(item, i)} title={tt(t, "Remote patient monitoring")}>
      {t("RPM")}
    </ActionButton>
  );
  const callBtn = (item, i) => (
    <ActionButton
      size="sm"
      variant={item?.IsCall === 1 ? "default" : "primary"}
      className={item?.IsCall === 1 ? "hx-btn--muted" : ""}
      onClick={() => handleCallButtonClick(item, i, "Pending")}
      title={item?.IsCall === 1 ? tt(t, "Un Call") : tt(t, "Call the patient in")}
    >
      {item?.IsCall === 1 ? tt(t, "UnCall") : tt(t, "Call")}
    </ActionButton>
  );
  const inBtn = (item, i) => (
    <ActionButton
      size="sm"
      variant="primary"
      className={item?.P_In === 1 ? "hx-btn--muted" : ""}
      disabled={item?.IsCall !== 1}
      onClick={() => handlePatientSelect(item, i, "Pending")}
      title={item?.IsCall !== 1 ? tt(t, "Call the patient first") : tt(t, "Open consultation")}
    >
      {tt(t, "In")}
    </ActionButton>
  );
  const tokenCell = (item) => (
    <div className="hx-token-col">
      {item?.GenralTokenNo && item?.GenralTokenNo != 0 ? (
        <span className="hx-token hx-token--sm">{String(item?.GenralTokenNo).padStart(2, "0")}</span>
      ) : (
        <span className="hx-token hx-token--sm hx-token--none">&ndash;</span>
      )}
      <span className="hx-token-col__visit">
        {tt(t, "Visit")} {item?.TransNo}
      </span>
    </div>
  );
  /* Who sent this patient. Only present when the visit was booked against a
     doctor's referral - the front office's bind writes the visit back onto the
     referral, and the appointment query resolves the referring doctor from it. */
  const referredBy = (item) => {
    const by = item?.ReferredByDoctor || item?.referredByDoctor;
    if (!by) return null;
    const note = item?.ReferralNote || item?.referralNote || "";
    return (
      <div
        className="hx-table__secondary"
        title={note ? `${tt(t, "Referred by")} ${by} — ${note}` : `${tt(t, "Referred by")} ${by}`}
        style={{ color: "#0e7a65", fontWeight: 600 }}
      >
        <FaShare style={{ fontSize: 10, marginRight: 4 }} />
        {tt(t, "Referred by")} {by}
      </div>
    );
  };

  const patientCell = (item) => (
    <div>
      <div className="hx-table__primary">
        {nameOf(item)} {vipOf(item) && <FaStar className="text-warning" title={tt(t, "VIP")} />}
      </div>
      <div className="hx-table__secondary">
        {item?.MRNo} &bull; {ageOf(item)}
      </div>
      {referredBy(item)}
    </div>
  );
  const dateTrack = (item) => (
    <div className="hx-track">
      {dates(t, item).map(([label, value]) => (
        <div className="hx-track__item" key={label}>
          <div className="hx-track__label">{label}</div>
          <div className="hx-track__value">{value || "—"}</div>
        </div>
      ))}
    </div>
  );

  const columns = [
    { key: "no", label: "#", width: "40px", className: "hx-table__num", render: (_, pos) => pos + 1 },
    { key: "patient", label: t("Name"), render: ({ row }) => patientCell(row) },
    { key: "token", width: "110px", align: "center", label: `${t("Token No")} / ${t("Visit No")}`, render: ({ row }) => tokenCell(row) },
    {
      key: "doctor",
      width: "180px",
      label: `${t("Doctor")} / ${t("App Date")}`,
      render: ({ row, i }) => (
        <div>
          {doctorCell(row, i, "pend")}
          <div className="hx-table__secondary">{row?.AppointmentDate}</div>
        </div>
      ),
    },
    { key: "status", width: "170px", label: t("STATUS"), render: ({ row }) => statusCell(row) },
    { key: "flow", width: "130px", align: "center", label: t("FlowSheet"), render: ({ row }) => flowButtons(row) },
    ...(showInvitePatient ? [{ key: "invite", width: "104px", align: "center", label: t("Invite Patient"), render: ({ row, i }) => inviteBtn(row, i) }] : []),
    ...(showRPM ? [{ key: "rpm", width: "84px", align: "center", label: t("RPM"), render: ({ row, i }) => rpmBtn(row, i) }] : []),
    { key: "call", width: "96px", align: "center", label: t("Call"), render: ({ row, i }) => callBtn(row, i) },
    { key: "in", width: "76px", align: "center", label: t("In"), render: ({ row, i }) => inBtn(row, i) },
    {
      key: "more",
      label: "",
      width: "44px",
      align: "right",
      render: ({ i }) => (
        <button type="button" className="hx-table__expander" title={tt(t, "Visit dates")} aria-expanded={openRow === i} onClick={() => setOpenRow(openRow === i ? null : i)}>
          <i className={`fas ${openRow === i ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true"></i>
        </button>
      ),
    },
  ];

  return (
    <div className="hx-modern-table">
      <ListBar t={t} query={query} setQuery={setQuery} shown={entries.length} total={rows.length} placeholder={tt(t, "Search by name, UHID, doctor, token, status")} />
      <div className="hx-hide-mobile">
        <DataTable
          cards={false}
          columns={columns}
          rows={entries}
          rowKey={({ row, i }) => `${row?.TransactionID ?? ""}-${row?.App_ID ?? ""}-${i}`}
          rowSelected={({ i }) => openRow === i}
          expanded={({ i }) => openRow === i}
          renderDetail={({ row }) => dateTrack(row)}
          footer={entries.length ? `${tt(t, "Showing")} 1–${entries.length} of ${rows.length}` : ""}
          empty={<EmptyState icon={<FaClock />} title={t("No Record Found")} />}
        />
      </div>
      <div className="hx-only-mobile hx-block">
        {entries.length === 0 && <EmptyState icon={<FaClock />} title={t("No Record Found")} />}
        {entries.map(({ row: item, i }) => {
          const open = openRow === i;
          return (
            <div className={`hx-rec${open ? " hx-rec--open" : ""}`} key={`p-${item?.TransactionID ?? ""}-${i}`}>
              <div className="hx-rec__top">
                <div>
                  <div className="hx-rec__name">{nameOf(item)} {vipOf(item) && <FaStar className="text-warning" />}</div>
                  <div className="hx-rec__meta">{item?.MRNo}<br />{ageOf(item)}</div>
                  <div className="mt-1">{statusCell(item)}</div>
                </div>
                <div className="hx-rec__right">
                  {tokenCell(item)}
                  <b>{item?.DName}</b>
                  {item?.AppointmentDate}
                  <div>
                    <button type="button" className="hx-rec__more" onClick={() => setOpenRow(open ? null : i)} aria-expanded={open}>
                      <i className={`fas ${open ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="hx-rec__row">{flowButtons(item)}</div>
              <div className="hx-rec__row">
                {showInvitePatient && inviteBtn(item, i)}
                {showRPM && rpmBtn(item, i)}
                {callBtn(item, i)}
                {inBtn(item, i)}
              </div>
              {open && (
                <div className="hx-rec__track">
                  {dates(t, item).map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <b>{value || "—"}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modals}
    </div>
  );
}

/* --------------------------------------------------------------------- done */
export function DoneAppointmentsModern({ tbody = [], handlePatientSelect, showRPM = true }) {
  const [t] = useTranslation();
  const [query, setQuery] = useState("");
  const rows = tbody || [];
  const entries = useMemo(() => filterRows(rows, query), [rows, query]);
  const { openRpm, modals } = useAppointmentActions(rows);
  const rpmBtn = (item, i) => (
    <ActionButton size="sm" variant="success" onClick={() => openRpm(item, i)}>
      {t("RPM")}
    </ActionButton>
  );
  const inBtn = (item, i) => (
    <ActionButton size="sm" variant="primary" onClick={() => handlePatientSelect(item, i, "done")} title={tt(t, "Open consultation")}>
      {tt(t, "In")}
    </ActionButton>
  );
  const columns = [
    { key: "no", label: "#", width: "40px", className: "hx-table__num", render: (_, pos) => pos + 1 },
    {
      key: "patient",
      label: `${t("Name")} / ${t("UHID")}`,
      render: ({ row: item }) => (
        <>
          <span className="hx-table__primary">{item?.Pname}</span>{" "}
          <span className="hx-table__secondary">({item?.MRNo})</span>
        </>
      ),
    },
    { key: "age", label: t("Age/Gender"), width: "200px", render: ({ row: item }) => `${item?.Age ?? ""} / ${item?.Sex ?? ""}` },
    { key: "doctor", label: t("Doctor"), width: "220px", render: ({ row: item, i }) => doctorCell(item, i, "done") },
    { key: "date", label: t("Date"), width: "140px", render: ({ row: item }) => item?.AppointmentDate },
    ...(showRPM ? [{ key: "rpm", label: t("RPM"), width: "84px", align: "center", render: ({ row: item, i }) => rpmBtn(item, i) }] : []),
    { key: "in", label: t("In"), width: "76px", align: "center", render: ({ row: item, i }) => inBtn(item, i) },
  ];
  return (
    <div className="hx-modern-table">
      <ListBar t={t} query={query} setQuery={setQuery} shown={entries.length} total={rows.length} placeholder={tt(t, "Search by name, UHID, doctor, date")} />
      <div className="hx-hide-mobile">
        <DataTable
          cards={false}
          columns={columns}
          rows={entries}
          rowKey={({ row, i }) => `${row?.TransactionID ?? ""}-${row?.App_ID ?? ""}-${i}`}
          footer={entries.length ? `${tt(t, "Showing")} 1–${entries.length} of ${rows.length}` : ""}
          empty={<EmptyState icon={<FaCheckCircle />} title={t("No Record Found")} />}
        />
      </div>
      <div className="hx-only-mobile hx-block">
        {entries.length === 0 && <EmptyState icon={<FaCheckCircle />} title={t("No Record Found")} />}
        {entries.map(({ row: item, i }) => (
          <div className="hx-rec" key={`d-${item?.TransactionID ?? ""}-${i}`}>
            <div className="hx-rec__top">
              <div>
                <div className="hx-rec__name">{item?.Pname}</div>
                <div className="hx-rec__meta">{item?.MRNo}<br />{item?.Age} / {item?.Sex}</div>
              </div>
              <div className="hx-rec__right">
                <b>{item?.DName}</b>
                {item?.AppointmentDate}
              </div>
            </div>
            <div className="hx-rec__row">
              {showRPM && rpmBtn(item, i)}
              {inBtn(item, i)}
            </div>
          </div>
        ))}
      </div>
      {modals}
    </div>
  );
}
