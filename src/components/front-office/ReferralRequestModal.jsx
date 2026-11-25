import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GetPatientReferralRequests } from "../../networkServices/DoctorApi";

const C = {
  ink: "#1f2d33", sub: "#6c757d", line: "#e4e9ec", soft: "#f8f9fa",
  teal: "#0e7a65", tealBg: "#e8f7f4", tealLine: "#9fd8cb",
  amber: "#c47d0a", amberBg: "#fff8eb", red: "#b52020",
};

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

/* The API's rows come back from a Dapper dynamic, so the key casing is whatever
   the SELECT aliased. Read both ways rather than betting on the serializer. */
export const readRow = (r = {}) => {
  const get = (...keys) => {
    for (const k of keys) {
      const v = r?.[k] ?? r?.[k?.charAt(0).toLowerCase() + k?.slice(1)];
      if (v !== undefined && v !== null && String(v) !== "") return v;
    }
    return "";
  };
  const transactionID = get("TransactionID");
  return {
    // referID is cpoe_referralConsultation's key — the table has no "ID" column.
    id: get("ReferID"),
    referID: get("ReferID"),
    transactionID,
    appID: get("AppID"),
    // The stored value is often the doctor's name truncated by a narrow column, so
    // prefer the resolved doctor's real name when the API could find them.
    referToName: get("ReferToFullName") || get("ReferToName"),
    referToStoredName: get("ReferToName"),
    referToDoctorID: get("ReferToDoctorID"),
    // The outside hospital's referral id. Kept separate from referToDoctorID so it
    // can never be mistaken for a doctor this hospital can book against.
    referToReferralID: get("ReferToReferralID"),
    referToDepartment: get("ReferToDepartment"),
    referToDepartmentID: get("ReferToDepartmentID"),
    referDept: get("ReferDept"),
    doctorType: get("DoctorType"),
    referralType: get("ReferralType"),
    consultationType: get("ConsultationType"),
    impression: get("Impression"),
    remarks: get("Remarks"),
    date: get("ReferralDate"),
    time: get("ReferralTime"),
    requestedAppDate: get("RequestedAppDate"),
    fromDoctorName: get("FromDoctorName"),
    opdTransactionID: get("OPDTransactionID"),
    bookedDate: get("BookedDate"),
    // MySQL hands a boolean expression back as 1/0.
    isBooked: ["1", "true", "True"].includes(String(get("IsBooked") ?? "")),
    // MySQL hands a boolean back as 1/0; true/"True" if a serializer got to it first.
    isToday: ["1", "true", "True"].includes(String(get("IsToday") ?? "")),
  };
};

/* makeApiRequest NEVER rethrows: on a failed call it returns the raw axios
   response object instead of the API envelope (see networkServices/axiosInstance).
   So `res.success` being absent - not false - is how a failure arrives here, and
   reading only `res?.success ? ... : []` turns a 400 into "no referrals", which is
   exactly how a broken query looked like an empty diary at the counter. */
export const readApiResult = (res) => {
  if (res && typeof res.success === "boolean") {
    return { rows: res.success ? res.data || [] : [], error: "" };
  }
  if (!res) return { rows: [], error: "No response from the server" };
  const status = res?.status;
  const message =
    res?.data?.message || res?.data?.Message || res?.statusText || "Request failed";
  return { rows: [], error: status ? `${status} — ${message}` : String(message) };
};

/* An Out-Side referral names a doctor at another hospital: it is shown at the
   counter so they know where the patient was sent, but no appointment is generated
   here, so it is never bindable whatever else the row carries. In-House referrals
   are bindable once they resolve to a doctor and are not already booked. */
export const isOutsideReferral = (row) =>
  String(row?.doctorType || "").toUpperCase() === "OUT-SIDE" ||
  (!row?.referToDoctorID && !!row?.referToReferralID);

export const isBindable = (row) =>
  !isOutsideReferral(row) && !!row?.referToDoctorID && !row?.isBooked;

/* What the button lights up for: something still to be booked. The list covers the
   last week, so blinking on "has any referral" would leave it blinking over
   referrals that were dealt with days ago. */
export const hasPendingReferral = (apiRows = []) =>
  (apiRows || []).map(readRow).some(isBindable);

/* The button's three states, so the counter can read it without opening it:
   "pending" - a request still to be booked;
   "booked"  - requests exist and every one is already booked, i.e. the consultation
               has been billed once and must not be billed again;
   "none"    - nothing in the window. */
export const referralButtonState = (apiRows = []) => {
  const rows = (apiRows || []).map(readRow);
  if (!rows.length) return "none";
  if (rows.some(isBindable)) return "pending";
  return rows.some((r) => r.isBooked) ? "booked" : "none";
};

/* What binding a referral changes on the OPD booking header. Kept pure and here,
   next to the shape it reads, because the department match is the fiddly part:
   the EMR stores the referral's department as the NAME it displayed, so an ID
   match is tried first and the name second. */
export const referralBookingPatch = (row, departmentOptions = []) => {
  // The same rule as isBindable, enforced again here: this function is what
  // actually moves a doctor onto the booking, so an outside referral must not get
  // through it even if it somehow arrives carrying a doctor id.
  if (isOutsideReferral(row) || !row?.referToDoctorID) return null;
  const deptName = row?.referToDepartment || row?.referDept || "";
  const dept = (departmentOptions || []).find(
    (d) =>
      (row?.referToDepartmentID &&
        String(d?.value) === String(row.referToDepartmentID)) ||
      (d?.label && deptName && String(d.label).toUpperCase() === deptName.toUpperCase()),
  );
  return {
    departmentName: deptName,
    ...(dept ? { DepartmentID: dept.value } : {}),
    DoctorID: row.referToDoctorID,
    SelectDoctor: row.referToDoctorID,
    DoctorName: row.referToName,
  };
};

/**
 * Referral requests raised for this patient from the doctor module.
 *
 * Mirrors the CPOE popup on the same screen: list on the left, tick one, and the
 * footer binds it — here, binding means pointing the OPD booking at the doctor
 * the referral asked for, so the appointment gets booked against them.
 *
 * @param {(row:object)=>void} onSelectionChange  the parent reads the picked row
 *                                                when its Bind button is pressed
 */
const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};
const isoToday = () => new Date().toISOString().slice(0, 10);

function ReferralRequestModal({ singlePatientData, onSelectionChange, rows: rowsProp, error }) {
  const [t] = useTranslation();
  const patientID =
    singlePatientData?.PatientID ||
    singlePatientData?.PatientId ||
    singlePatientData?.patientID ||
    "";

  const [rows, setRows] = useState(rowsProp ? rowsProp.map(readRow) : []);
  const [loading, setLoading] = useState(!rowsProp);
  const [picked, setPicked] = useState(null);
  // The window the caller's rows came from, and what a search will ask for.
  const [fromDate, setFromDate] = useState(isoDaysAgo(7));
  const [toDate, setToDate] = useState(isoToday());
  const [ownError, setOwnError] = useState("");
  const [searched, setSearched] = useState(false);

  /* Search the range the counter chose. The caller's rows only cover the default
     window, so this is also how a referral raised outside it is found at all -
     and it asks the API directly, so what comes back is what the API has. */
  const handleSearch = async () => {
    if (!patientID) return;
    setLoading(true);
    setOwnError("");
    try {
      const res = await GetPatientReferralRequests(patientID, fromDate, toDate);
      const { rows: raw, error: err } = readApiResult(res);
      setOwnError(err);
      const mapped = raw.map(readRow);
      setRows(mapped);
      const first = mapped.find(isBindable) || mapped[0] || null;
      setPicked(first);
      onSelectionChange?.(first);
    } catch (e) {
      setRows([]);
      setOwnError(
        e?.response?.data?.message || e?.message || t("Could not read the referral requests"),
      );
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    // A search the counter ran wins over whatever the caller handed down.
    if (searched) return undefined;
    // Otherwise the caller already has the default window's rows (it fetched them
    // to light the button), so the popup does not ask again.
    if (rowsProp) {
      const mapped = rowsProp.map(readRow);
      setRows(mapped);
      setLoading(false);
      const first = mapped.find(isBindable) || mapped[0] || null;
      setPicked(first);
      onSelectionChange?.(first);
      return undefined;
    }
    if (!patientID) return undefined;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await GetPatientReferralRequests(patientID);
        if (!active) return;
        const { rows: raw, error: err } = readApiResult(res);
        if (err) setOwnError(err);
        const mapped = raw.map(readRow);
        setRows(mapped);
        const first = mapped.find(isBindable) || mapped[0] || null;
        setPicked(first);
        onSelectionChange?.(first);
      } catch (e) {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [patientID, rowsProp, searched]);

  const pick = (row) => {
    setPicked(row);
    onSelectionChange?.(row);
  };

  /* Always rendered, whatever the list is doing: when nothing comes back, the date
     range is the first thing the counter needs to reach for. */
  const toolbar = (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        flexWrap: "wrap",
        padding: "2px 2px 10px",
        borderBottom: `1px solid ${C.line}`,
        marginBottom: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>{t("From Date")}</div>
        <input
          type="date"
          className="form-control form-control-sm"
          value={fromDate}
          max={toDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ width: 150 }}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>{t("To Date")}</div>
        <input
          type="date"
          className="form-control form-control-sm"
          value={toDate}
          min={fromDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ width: 150 }}
        />
      </div>
      <button
        type="button"
        className="btn btn-sm btn-info"
        onClick={handleSearch}
        disabled={loading || !patientID}
      >
        <i className="fas fa-search mr-1" /> {t("Search")}
      </button>
      <span style={{ fontSize: 11, color: C.sub, marginLeft: "auto" }}>
        {t("UHID")}: <b>{patientID || "—"}</b> ·{" "}
        {rows.length
          ? `${rows.length} ${rows.length === 1 ? t("request") : t("requests")}`
          : t("Defaults to the last 7 days")}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div>
        {toolbar}
        <div style={{ padding: 16, fontSize: 12.5, color: C.sub }}>{t("Loading...")}</div>
      </div>
    );
  }
  /* A failed read is reported as a failure. Showing "none today" for an API that
     errored would send the patient away from a referral that does exist. */
  const shownError = ownError || error;
  if (shownError && !rows.length) {
    return (
      <div>
        {toolbar}
        <div style={{ padding: 24, textAlign: "center", color: C.red }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: 22 }} />
        <div style={{ fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>
          {t("The referral requests could not be read")}
        </div>
          <div style={{ fontSize: 11.5, marginTop: 4, color: C.sub }}>{String(shownError)}</div>
        </div>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div>
        {toolbar}
        <div style={{ padding: 24, textAlign: "center", color: C.sub }}>
          <i className="fas fa-share" style={{ fontSize: 22 }} />
          <div style={{ fontSize: 12.5, marginTop: 8 }}>
            {searched
              ? t("No referral request for this patient in the selected dates")
              : t("No referral request for this patient in the last 7 days")}
          </div>
          <div style={{ fontSize: 11.5, marginTop: 6, color: C.sub }}>
            {t("Widen the dates above and search again.")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4px 2px" }}>
      {toolbar}
      <table className="table table-sm" style={{ marginBottom: 0 }}>
        <thead>
          <tr style={{ fontSize: 11.5, color: C.sub }}>
            <th style={{ width: 40 }} />
            <th>{t("Refer To")}</th>
            <th>{t("Department")}</th>
            <th>{t("Referral Type")}</th>
            <th>{t("Consult Type")}</th>
            <th>{t("Referred By")}</th>
            <th>{t("Raised")}</th>
            <th>{t("Status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const bindable = isBindable(row);
            const active = picked?.id === row.id;
            return (
              <tr
                key={row.id}
                onClick={() => pick(row)}
                style={{
                  cursor: "pointer",
                  background: active ? C.tealBg : row.isBooked ? "#f6f8f9" : "transparent",
                  opacity: bindable || active ? 1 : 0.75,
                }}
              >
                <td>
                  <input
                    type="radio"
                    name="referralRow"
                    checked={!!active}
                    onChange={() => pick(row)}
                  />
                </td>
                <td style={{ fontWeight: 700, color: C.ink }}>
                  {asText(row.referToName) || "—"}
                  {isOutsideReferral(row) && (
                    <span
                      style={{
                        fontSize: 10,
                        color: C.amber,
                        background: C.amberBg,
                        border: `1px solid ${C.amber}33`,
                        borderRadius: 10,
                        padding: "1px 7px",
                        marginLeft: 6,
                        fontWeight: 700,
                      }}
                      title={t("Referred outside the hospital")}
                    >
                      {t("Outside")}
                    </span>
                  )}
                </td>
                <td>{asText(row.referToDepartment || row.referDept) || "—"}</td>
                <td>{asText(row.referralType) || "—"}</td>
                <td>{asText(row.consultationType) || "—"}</td>
                <td>{asText(row.fromDoctorName) || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {row.isToday ? (
                    <span
                      style={{
                        background: C.tealBg,
                        color: C.teal,
                        border: `1px solid ${C.tealLine}`,
                        borderRadius: 10,
                        padding: "1px 7px",
                        fontSize: 10.5,
                        fontWeight: 700,
                        marginRight: 6,
                      }}
                    >
                      {t("Today")}
                    </span>
                  ) : null}
                  {asText(row.date)}
                  {row.time ? (
                    <span style={{ color: C.sub, fontSize: 11 }}> · {asText(row.time)}</span>
                  ) : null}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {row.isBooked ? (
                    <span
                      style={{ color: C.teal, fontSize: 11.5, fontWeight: 600 }}
                      title={
                        row.opdTransactionID
                          ? `${t("Visit")} ${row.opdTransactionID}${row.bookedDate ? ` · ${row.bookedDate}` : ""}`
                          : t("An appointment with this doctor already exists for the referral date")
                      }
                    >
                      <i className="fas fa-check mr-1" />
                      {t("Appointment booked")}
                      {row.opdTransactionID ? (
                        <span style={{ color: C.sub, fontWeight: 400 }}>
                          {" "}
                          · {t("Visit")} {row.opdTransactionID}
                        </span>
                      ) : null}
                    </span>
                  ) : bindable ? (
                    <span style={{ color: C.amber, fontSize: 11.5, fontWeight: 600 }}>
                      {t("Pending booking")}
                    </span>
                  ) : isOutsideReferral(row) ? (
                    <span style={{ color: C.sub, fontSize: 11.5 }}>
                      {t("Referred outside · no appointment here")}
                    </span>
                  ) : (
                    <span style={{ color: C.sub, fontSize: 11.5 }}>
                      {t("Cannot be booked here")}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {picked ? (
        <div
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            background: C.soft,
            padding: 12,
            marginTop: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
            {t("Referral detail")}
          </div>
          <div className="row" style={{ fontSize: 12 }}>
            <div className="col-md-6" style={{ marginBottom: 4 }}>
              <span style={{ color: C.sub }}>{t("Impression / Diagnosis")}: </span>
              <b>{asText(picked.impression) || "—"}</b>
            </div>
            <div className="col-md-6" style={{ marginBottom: 4 }}>
              <span style={{ color: C.sub }}>{t("Remarks")}: </span>
              <b>{asText(picked.remarks) || "—"}</b>
            </div>
            {picked.requestedAppDate ? (
              <div className="col-md-6">
                <span style={{ color: C.sub }}>{t("Requested appointment date")}: </span>
                <b>{asText(picked.requestedAppDate)}</b>
              </div>
            ) : null}
          </div>
          {!isBindable(picked) && (
            <div
              style={{
                fontSize: 11.5,
                marginTop: 8,
                padding: "7px 10px",
                borderRadius: 8,
                background: picked.isBooked ? C.tealBg : "#fff2f2",
                border: `1px solid ${picked.isBooked ? C.tealLine : "#f3c9c9"}`,
                color: picked.isBooked ? C.teal : C.red,
                fontWeight: 600,
              }}
            >
              {picked.isBooked
                ? `${t("This referral is already booked — do not bill the consultation again.")}${
                    picked.opdTransactionID ? ` (${t("Visit")} ${picked.opdTransactionID})` : ""
                  }`
                : isOutsideReferral(picked)
                  ? t(
                      "This patient was referred to a doctor outside the hospital, so no appointment is generated here. The request is shown for the record only.",
                    )
                  : `${t("This referral could not be matched to a bookable doctor at this centre, so only the request can be viewed.")} ${t("Stored as")}: "${asText(picked.referToStoredName)}"${
                      picked.referDept ? ` · ${asText(picked.referDept)}` : ""
                    }`}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default ReferralRequestModal;
