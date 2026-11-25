import React, { useCallback, useEffect, useMemo, useState, forwardRef } from "react";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../components/formComponent/DatePicker";
import ViewLabReportTable from "../../../components/UI/customTable/doctorTable/ViewConsultationtable/ViewLabReportTable";
import { SearchPatient } from "../../../networkServices/DoctorApi";
import moment from "moment";

/* The date format ViewLabReports/SearchPatient parses its range with. */
const API_DATE = "DD-MMM-YYYY";

/* How far back the screen looks when it opens. It used to open on today only,
   which showed an empty screen to any patient whose tests were prescribed on an
   earlier day - which is most of them. The range is still the doctor's to change. */
const DEFAULT_DAYS_BACK = 90;

const toApiDate = (value) => {
  const m = moment(value instanceof Date ? value : new Date(value));
  return m.isValid() ? m.format(API_DATE) : "";
};

/* makeApiRequest never rethrows: a failed call comes back as the raw axios
   response, so `success` being absent - rather than false - is how a failure
   arrives. Reading only `res?.data` turns a 500 into "no reports". */
export const readLabResult = (res) => {
  if (res && typeof res.success === "boolean") {
    return {
      rows: res.success && Array.isArray(res.data) ? res.data : [],
      error: "",
    };
  }
  if (!res) return { rows: [], error: "No response from the server" };
  const status = res?.status;
  const message =
    res?.data?.message || res?.data?.Message || res?.statusText || "Request failed";
  return { rows: [], error: status ? `${status} — ${message}` : String(message) };
};

const ViewLabReport = forwardRef((props, ref) => {
  const { patientDetail } = props;
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  // Opened from the EMR form menu with the wrapper, and from elsewhere with the
  // patient itself - take whichever shape arrives.
  const patient = patientDetail?.currentPatient || patientDetail || {};
  const patientID = patient?.PatientID || patient?.MRNo || "";

  const [labStatus, setLabStatus] = useState("ALL");
  /* Dates are held as Date objects, which is what the picker emits and what it
     expects back. They were being stored as the picker's Date and then re-parsed
     with moment(value, "DD-MMM-YYYY"), which is invalid for a Date - the picker
     was handed "Invalid Date", blanked itself, and so could never be changed. */
  const [fromDate, setFromDate] = useState(
    moment().subtract(DEFAULT_DAYS_BACK, "days").toDate(),
  );
  const [toDate, setToDate] = useState(moment().toDate());

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleFromDate = (e) => setFromDate(e?.target?.value ?? e?.value ?? null);
  const handleToDate = (e) => setToDate(e?.target?.value ?? e?.value ?? null);

  const range = useMemo(
    () => ({ from: toApiDate(fromDate), to: toApiDate(toDate) }),
    [fromDate, toDate],
  );

  /* One fetch for every control. The three type branches used to be copies of
     each other, and had drifted: Laboratory and Radiology sent the From date as
     the To date as well, and ALL ignored both dates and searched today. */
  const fetchReports = useCallback(async () => {
    if (!patientID) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await SearchPatient({
        status: "",
        fromDate: range.from,
        toDate: range.to,
        labDepartmentType: labStatus,
        pid: patientID,
      });
      const { rows: data, error: err } = readLabResult(res);
      setRows(data);
      setError(err);
    } catch (e) {
      setRows([]);
      setError(e?.message || t("Could not load the lab reports"));
    } finally {
      setLoading(false);
      setSearched(true);
    }
    /* t is deliberately NOT a dependency: react-i18next can hand back a new
       function on every render, and this callback drives the effect below - an
       unstable dependency here is an endless fetch loop. It is only used for a
       message. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientID, range.from, range.to, labStatus]);

  // Re-runs when the patient, the type or either date changes — the To date used
  // to be ignored, so narrowing the end of the range did nothing.
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePacImage = () => {
    window.open(
      `https://mohpacs.actoneng.com:3000/?patient=${encodeURIComponent(patientID)}`,
    );
  };

  return (
    <>
      <div className="card patient_registration border mt-1">
        <div className="row g-4 m-2 align-items-center">
          <ReactSelect
            placeholderName={"Type"}
            id={"Type"}
            searchable={true}
            name={"OPDANDRADIOLOGY"}
            respclass="col-xl-2 col-md-4 col-sm-6 col-sm-4 col-12"
            dynamicOptions={[
              { label: t("Laboratory"), value: "LAB" },
              { label: t("Radiology"), value: "RAD" },
              { label: t("ALL"), value: "ALL" },
            ]}
            handleChange={(name, e) => setLabStatus(e?.value ?? "ALL")}
            value={labStatus}
          />

          <DatePicker
            className="custom-calendar"
            id="fromDate"
            name="fromDate"
            lable={t("From Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass={"col-xl-2 col-md-4 col-sm-6 col-12"}
            handleChange={handleFromDate}
            maxDate={toDate || undefined}
            value={fromDate}
          />
          <DatePicker
            className="custom-calendar"
            id="toDate"
            name="toDate"
            lable={t("To Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass={"col-xl-2 col-md-4 col-sm-6 col-12"}
            handleChange={handleToDate}
            minDate={fromDate || undefined}
            value={toDate}
          />

          <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
            <button
              className="btn btn-sm btn-primary w-100"
              type="button"
              onClick={fetchReports}
              disabled={loading || !patientID}
            >
              <i className="fas fa-search mr-1" />{" "}
              {loading ? t("Loading...") : t("Search")}
            </button>
          </div>

          <div
            className="col mb-2 text-right"
            style={{ display: "", justifyContent: "flex-end" }}
          >
            <button
              className="btn btn-sm btn-success"
              type="button"
              onClick={handlePacImage}
              disabled={!patientID}
            >
              {t("Pacs")}
            </button>
          </div>
        </div>

        <ViewLabReportTable tbody={rows} />

        {/* Nothing to show is said out loud, and a failed call is not dressed up
            as an empty result - a blank card under the legend gave no clue which
            of the two had happened. */}
        {!loading && rows.length === 0 ? (
          <div
            style={{
              padding: "18px 16px",
              textAlign: "center",
              fontSize: 12.5,
              color: error ? "#b3261e" : "#6c757d",
            }}
          >
            {error ? (
              <>
                <i className="fas fa-exclamation-triangle mr-1" />
                {t("The lab reports could not be read")}: {error}
              </>
            ) : (
              <>
                {!patientID
                  ? t("No patient is loaded")
                  : searched
                    ? `${t("No lab report for this patient between")} ${range.from} ${t("and")} ${range.to}`
                    : t("Loading...")}
              </>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
});

export default ViewLabReport;
