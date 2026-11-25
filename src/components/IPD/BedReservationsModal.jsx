import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Modal from "../modalComponent/Modal";
import Tables from "../UI/customTable";
import DatePicker from "../formComponent/DatePicker";
import Checkbox from "../formComponent/Checkbox";
import { notify } from "../../utils/utils";
import { CancelBedReservation, GetBedReservations } from "../../networkServices/DoctorApi";
import { bedLabel, normaliseReservation, readApiResult } from "./bedReservation";

/* =============================================================================
   Reserved beds — the list popup on the admission screen.

   Built on the project's standard pieces: the DatePicker / Checkbox search row,
   the standard Search button, and the shared <Tables> grid with its Columns,
   Export, sorting and pagination.

   Every reservation in a date range (the reserved-for date), with the patient
   and the bed spelled out. Opens on today → +30 days, live reservations only;
   "Include admitted / cancelled" widens it. Cancel is offered on a live
   reservation - it is the only way a wrong one can be undone.
   ============================================================================= */

const { VITE_DATE_FORMAT } = import.meta.env;

const STATUS = {
  Reserved: { c: "#b45309", bg: "#fef3c7" },
  Admitted: { c: "#15803d", bg: "#dcfce7" },
  Cancelled: { c: "#4b5563", bg: "#e5e7eb" },
};

const toIso = (d) => (d ? moment(d).format("YYYY-MM-DD") : "");

function BedReservationsModal({ visible, setVisible, ipdCaseTypeID, onChanged }) {
  const [t] = useTranslation();
  const [searchData, setSearchData] = useState({
    fromDate: new Date(),
    toDate: moment().add(30, "days").toDate(),
    includeClosed: false,
    onlyThisType: false,
  });
  const [rows, setRows] = useState([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  const searchHandleChange = (e) =>
    setSearchData((s) => ({ ...s, [e.target.name]: e.target.value }));
  const checkHandleChange = (e) =>
    setSearchData((s) => ({ ...s, [e.target.name]: e.target.checked }));

  /* t is left out of the deps on purpose (react-i18next gives a new identity
     every render). */
  const search = useCallback(async (f) => {
    try {
      const { ok, rows: list } = readApiResult(
        await GetBedReservations({
          fromDate: toIso(f.fromDate),
          toDate: toIso(f.toDate),
          ipdCaseTypeID: f.onlyThisType ? ipdCaseTypeID : 0,
          includeClosed: f.includeClosed ? 1 : 0,
        }),
      );
      setRows(ok ? list.map(normaliseReservation) : []);
      setSearched(true);
    } catch (e) {
      notify(t("Failed to load the reservations"), "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipdCaseTypeID]);

  /* Only once the popup is open, and once per opening. */
  useEffect(() => {
    if (visible) search(searchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleCancel = async (r) => {
    setBusy(true);
    try {
      const { ok, message } = readApiResult(await CancelBedReservation(r.id, ""));
      notify(message || (ok ? t("Reservation cancelled") : t("Failed to cancel")), ok ? "success" : "error");
      if (ok) {
        await search(searchData);
        if (typeof onChanged === "function") onChanged();
      }
    } catch (e) {
      notify(t("Failed to cancel"), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  const THEAD = [
    { name: t("S.no"), width: "" },
    { name: t("Reserved For"), width: "" },
    { name: t("UHID"), width: "" },
    { name: t("Patient Name"), width: "" },
    { name: t("Age/Gender"), width: "" },
    { name: t("Mobile No."), width: "" },
    { name: t("Room Type"), width: "" },
    { name: t("Bed"), width: "" },
    { name: t("Doctor Name"), width: "" },
    { name: t("Remarks"), width: "" },
    { name: t("Reserved By"), width: "" },
    { name: t("Status"), width: "" },
    { name: t("Action"), width: "" },
  ];

  const TBODY = rows.map((r, i) => {
    const s = STATUS[r.status] || STATUS.Reserved;
    return {
      SNo: i + 1,
      ReservedFor: r.bookingDateDisplay,
      UHID: r.patientID,
      PatientName: r.patientName,
      AgeGender: [r.age, r.gender].filter(Boolean).join(" / "),
      Mobile: r.mobile,
      RoomType: r.roomType,
      Bed: bedLabel(r),
      DoctorName: r.doctorName,
      Remarks: r.remarks,
      ReservedBy: (
        <>
          {r.reservedBy}
          {r.reservedOn ? <div className="text-muted small">{r.reservedOn}</div> : null}
        </>
      ),
      Status: (
        <span className="badge" style={{ background: s.bg, color: s.c, fontWeight: 600, padding: "4px 8px", borderRadius: 6 }}>
          {t(r.status)}
        </span>
      ),
      Action:
        r.status === "Reserved" ? (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            aria-label={`${t("Cancel reservation")} ${i + 1}`}
            title={t("Cancel this reservation")}
            onClick={() => handleCancel(r)}
            disabled={busy}
          >
            {t("Cancel")}
          </button>
        ) : (
          ""
        ),
    };
  });

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      Header={t("Reserved Beds")}
      modalWidth="96vw"
      footer={<></>}
    >
      <div className="row g-4 m-2">
        <DatePicker
          className="custom-calendar"
          id="rsvFromDate"
          name="fromDate"
          lable={t("From Date")}
          placeholder={VITE_DATE_FORMAT}
          respclass={"col-xl-2 col-md-4 col-sm-6 col-12"}
          value={searchData.fromDate}
          handleChange={searchHandleChange}
        />
        <DatePicker
          className="custom-calendar"
          id="rsvToDate"
          name="toDate"
          lable={t("To Date")}
          placeholder={VITE_DATE_FORMAT}
          respclass={"col-xl-2 col-md-4 col-sm-6 col-12"}
          value={searchData.toDate}
          handleChange={searchHandleChange}
        />
        <Checkbox
          id="rsvIncludeClosed"
          name="includeClosed"
          label={t("Include Admitted / Cancelled")}
          checked={searchData.includeClosed}
          onChange={checkHandleChange}
          respClass="col-xl-3 col-md-4 col-sm-6 col-12"
          removeSpacing
        />
        {ipdCaseTypeID ? (
          <Checkbox
            id="rsvOnlyThisType"
            name="onlyThisType"
            label={t("This Room Type Only")}
            checked={searchData.onlyThisType}
            onChange={checkHandleChange}
            respClass="col-xl-2 col-md-4 col-sm-6 col-12"
            removeSpacing
          />
        ) : null}
        <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
          <button type="button" className="btn btn-sm btn-info" onClick={() => search(searchData)}>
            {t("Search")}
          </button>
        </div>
      </div>

      <div className="card m-2">
        {/* Thirteen columns: the grid must be free to scroll sideways, or the
            right-hand ones (Reserved By, Status, Action) are simply cut off. */}
        <div style={{ overflowX: "auto", width: "100%" }}>
          <Tables
            style={{ height: "50vh", minWidth: 1500 }}
            thead={THEAD}
            tbody={TBODY}
            isExportExcel={true}
            isExportPDf={true}
            storageKey="ipd-bed-reservations"
            title={t("Reserved Beds")}
          />
        </div>
        {searched && rows.length === 0 && (
          <div className="text-muted text-center py-3">{t("No bed reserved in this range")}</div>
        )}
      </div>
    </Modal>
  );
}

export default BedReservationsModal;
