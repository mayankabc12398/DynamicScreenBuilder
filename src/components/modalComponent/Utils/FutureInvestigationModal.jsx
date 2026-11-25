import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import {
  SearchFutureBookingInv,
  GetFutureBookingDetails,
} from "../../../networkServices/futureInvestigationsAPI";

// Shows a patient's booked (future) investigations grouped by booking date.
// Expanding a date loads its tests (GetBookingDetails); checked tests are
// reported up via handlegetCheckedData so the parent can load them into billing.
function FutureInvestigationModal({ singlePatientData, handlegetCheckedData }) {
  const [t] = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [detailsByDate, setDetailsByDate] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [checked, setChecked] = useState({});

  const patID =
    singlePatientData?.PatientID ||
    singlePatientData?.PatientId ||
    singlePatientData?.patientID;

  useEffect(() => {
    const load = async () => {
      if (!patID) return;
      const res = await SearchFutureBookingInv({
        PatientID: patID,
        FromDate: "01-Jan-2000",
        ToDate: moment().add(2, "years").format("DD-MMM-YYYY"),
      });
      const list = res?.data || [];
      setBookings(list);
      // auto-expand the first booking for convenience
      if (list.length) toggleExpand(list[0]?.BookedFor, true);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patID]);

  const fetchDetails = async (bookedFor) => {
    if (detailsByDate[bookedFor]) return;
    const res = await GetFutureBookingDetails(bookedFor, patID);
    setDetailsByDate((prev) => ({ ...prev, [bookedFor]: res?.data || [] }));
  };

  const toggleExpand = async (bookedFor, force = false) => {
    if (!force && expanded === bookedFor) {
      setExpanded(null);
      return;
    }
    setExpanded(bookedFor);
    await fetchDetails(bookedFor);
  };

  const handleCheck = (e, test, bookedFor) => {
    const isChecked = e.target.checked;
    setChecked((prev) => {
      const next = { ...prev };
      if (isChecked) next[test.PatientTest_ID] = { ...test, BookingDate: bookedFor };
      else delete next[test.PatientTest_ID];
      handlegetCheckedData(Object.values(next));
      return next;
    });
  };

  const checkAllForDate = (e, bookedFor) => {
    const isChecked = e.target.checked;
    const tests = detailsByDate[bookedFor] || [];
    setChecked((prev) => {
      const next = { ...prev };
      tests.forEach((test) => {
        if (isChecked) next[test.PatientTest_ID] = { ...test, BookingDate: bookedFor };
        else delete next[test.PatientTest_ID];
      });
      handlegetCheckedData(Object.values(next));
      return next;
    });
  };

  const selectedCount = useMemo(() => Object.keys(checked).length, [checked]);

  const statusPill = (status) => {
    const done = /done|billed/i.test(status || "");
    return {
      display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 10px",
      borderRadius: 20, color: done ? "#15803d" : "#c47d0a",
      background: done ? "#edfaf2" : "#fff8eb",
    };
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
        <div style={{ fontSize: 13, color: "#6c757d" }}>
          {t("Patient")}: <b style={{ color: "#343a40" }}>{singlePatientData?.PName || singlePatientData?.PatientName || "-"}</b>
          {patID ? ` (${patID})` : ""}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1e6cb5" }}>
          {selectedCount} {t("Selected")}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div style={{ padding: "34px 16px", textAlign: "center", color: "#adb5bd", border: "1px dashed #dee2e6", borderRadius: 12 }}>
          <div style={{ fontSize: 26, opacity: 0.4, marginBottom: 6 }}>
            <i className="far fa-calendar-check" />
          </div>
          <div style={{ fontWeight: 500 }}>{t("No future investigations booked for this patient")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bookings.map((b, i) => {
            const isOpen = expanded === b.BookedFor;
            const tests = detailsByDate[b.BookedFor] || [];
            const allChecked = tests.length > 0 && tests.every((tst) => checked[tst.PatientTest_ID]);
            return (
              <div key={`${b.BookedFor}-${i}`} style={{ border: "1px solid #e9ecef", borderRadius: 10, overflow: "hidden" }}>
                <div
                  onClick={() => toggleExpand(b.BookedFor)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", cursor: "pointer", background: isOpen ? "#f8f9fa" : "#fff", flexWrap: "wrap" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i className={`fas fa-chevron-${isOpen ? "down" : "right"}`} style={{ fontSize: 11, color: "#adb5bd" }} />
                    <span style={{ fontWeight: 700, color: "#343a40" }}>
                      <i className="far fa-calendar-alt" style={{ marginRight: 6, color: "#1e6cb5" }} />
                      {b.BookedFor}
                    </span>
                    <span style={statusPill(b.STATUS)}>{b.STATUS}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#adb5bd" }}>
                    {b.BookedBy ? <span><i className="fas fa-user-md" style={{ marginRight: 4 }} />{b.BookedBy}</span> : null}
                    {b.BookedOn ? <span style={{ marginLeft: 10 }}><i className="far fa-clock" style={{ marginRight: 4 }} />{b.BookedOn}</span> : null}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: "1px solid #f1f3f5", padding: "6px 12px 10px" }}>
                    {tests.length === 0 ? (
                      <div style={{ fontSize: 12.5, color: "#adb5bd", padding: "8px 0" }}>{t("No tests found")}</div>
                    ) : (
                      <table style={{ width: "100%", fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ color: "#6c757d", textAlign: "left" }}>
                            <th style={{ width: 30, padding: "6px 4px" }}>
                              <input type="checkbox" className="table-checkbox" checked={allChecked} onChange={(e) => checkAllForDate(e, b.BookedFor)} />
                            </th>
                            <th style={{ padding: "6px 4px" }}>{t("S.No.")}</th>
                            <th style={{ padding: "6px 4px" }}>{t("Test Name")}</th>
                            <th style={{ padding: "6px 4px" }}>{t("Prescribed Date")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tests.map((tst, ti) => (
                            <tr key={tst.PatientTest_ID} style={{ borderTop: "1px solid #f1f3f5" }}>
                              <td style={{ padding: "7px 4px" }}>
                                <input
                                  type="checkbox"
                                  className="table-checkbox"
                                  checked={!!checked[tst.PatientTest_ID]}
                                  onChange={(e) => handleCheck(e, tst, b.BookedFor)}
                                />
                              </td>
                              <td style={{ padding: "7px 4px", color: "#adb5bd" }}>{ti + 1}</td>
                              <td style={{ padding: "7px 4px", fontWeight: 600, color: "#343a40" }}>{tst.TestName}</td>
                              <td style={{ padding: "7px 4px", color: "#6c757d" }}>{tst.PrescribeDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FutureInvestigationModal;
