import React, { useEffect, useMemo, useState } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import {
  EDPLoadBagTypeAPI,
  EDPSaveBagTypeAPI,
  EDPUpdateBagTypeAPI,
} from "../../../networkServices/EDP/edpApi";
import Tables from "../../../components/UI/customTable";
import WrapTranslate from "../../../components/WrapTranslate";
import { notify } from "../../../utils/ustil2";
import Input from "../../../components/formComponent/Input";
import CustomSelect from "../../../components/formComponent/CustomSelect";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Modal from "../../../components/modalComponent/Modal";
import {
  FutureGetServicesContinueRequest,
  FutureInvestigationsCloseService,
  FutureInvestigationServicesContinueRequest,
  FutureInvestigationsGetDataToFill,
  FutureInvestigationsGetDataVisitLog,
  FutureInvestigationsOpenService,
  FutureInvestigationsStartService,
  FutureInvestigationsStopService,
  GetEncounterPendingActivities,
  SaveServiceContinueRequest,
} from "../../../networkServices/opdserviceAPI";
import DatePicker from "../../../components/formComponent/DatePicker";
import moment from "moment";

const PRE_CLOSE_TABS = ["Investigation", "Procedure", "Payment", "Admission Advice"];

export default function EncounterNoManagment({ singlePatientData, autoSearch = false }) {
  console.log("first", singlePatientData);
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [values, setValues] = useState({
    // Type: { label: "Patient Services Continue Request", value: "PSCR" },
    UHID: "",
    // PatientName: "",
    Contact: "",
    // IPDNo: "",
    // PatientID: "",
    asOnDate: new Date(),
    // toDate: new Date(),
  });
  const [encounterLogvisitLog, setEncounterLogvisitLog] = useState([]);
  const [visitLog, setVisitLog] = useState([]);
  const [isTrue, setIsTrue] = useState(false);
  const [t] = useTranslation();

  // Pre-close check modal state
  const [preCloseModal, setPreCloseModal] = useState(false);
  const [preCloseActiveTab, setPreCloseActiveTab] = useState("Investigation");
  const [pendingCloseRow, setPendingCloseRow] = useState(null);
  const [preCloseLoading, setPreCloseLoading] = useState(false);
  const [pendingActivities, setPendingActivities] = useState({
    Investigation: [],
    Procedure: [],
    Payment: [],
    "Admission Advice": [],
  });
  const thead = [
    { name: "SNo.", width: "2%" },
    { name: "UHID", width: "2%" },
    { name: "Name", width: "2%" },
    { name: "Age", width: "2%" },
    { name: "Gender", width: "2%" },
    { name: "Mobile No", width: "2%" },
    { name: "Open by", width: "2%" },
    { name: "Open DateTime", width: "2%" },
    { name: "Close By", width: "2%" },
    { name: "Close DateTime", width: "2%" },
    { name: "Status", width: "2%" },
  ];
  const thead2 = [
    { name: "S NO.", width: "2%" },
    { name: "UHID", width: "2%" },
    { name: "Name", width: "2%" },
    { name: "Age", width: "2%" },
    { name: "Gender", width: "2%" },
    { name: "Encounter No", width: "2%" },
    { name: "Mobile No", width: "2%" },

    { name: "Status", width: "2%" },
    { name: "Is Smart Card", width: "2%" },
    { name: "Date", width: "2%" },
    { name: "Last Updated By", width: "2%" },
    { name: "Last Updated Date", width: "2%" },
    { name: "Action", width: "2%" },
  ];
  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleReactSelect = (name, value) => {
    setValues((val) => {
      return {
        ...val,
        [name]: value,
      };
    });
  };

  // Reports its outcome to handleSearch instead of raising its own toast. Both this and
  // handleSearchEncLog run in parallel, so a toast per function meant a user-initiated
  // search with nothing to show could fire two identical errors - and after an open/close
  // it fired a red "No record found" beside the green "Open Successfully"
  // (SRS-2026-0056 point 12). handleSearch owns the messaging now.
  const handleSearchVisitLog = async (overrideUHID) => {
    const uhid =
      typeof overrideUHID === "string" && overrideUHID
        ? overrideUHID
        : values?.UHID;
    const payload = {
      patientID: uhid,
      fromDate: moment(values?.asOnDate).format("YYYY-MM-DD"),
      toDate: moment(values?.asOnDate).format("YYYY-MM-DD"),
      encounterNo: "",
      mobileNo: values?.Contact,
    };

    try {
      let response = await FutureInvestigationsGetDataVisitLog(payload);
      if (response?.success) {
        setVisitLog(response?.data);
        return { ok: true };
      }
      setVisitLog([]);
      return { ok: false, message: response?.message };
    } catch (error) {
      console.log("error", error);
      return { ok: false };
    }
  };
  const handleSearchEncLog = async (overrideUHID) => {
    const uhid =
      typeof overrideUHID === "string" && overrideUHID
        ? overrideUHID
        : values?.UHID;
    const payload = {
      patientID: uhid,
      fromDate: moment(values?.asOnDate).format("YYYY-MM-DD"),
      toDate: moment(values?.asOnDate).format("YYYY-MM-DD"),
      encounterNo: "",
      mobileNo: values?.Contact,
    };
    try {
      let response = await FutureInvestigationsGetDataToFill(payload);
      if (response?.success) {
        if (uhid) {
          setIsTrue(true);
        }
        setEncounterLogvisitLog(response?.data);
        return { ok: true };
      }
      setEncounterLogvisitLog([]);
      return { ok: false, message: response?.message };
    } catch (error) {
      console.log("error", error);
      return { ok: false };
    }
  };
  const handleSearchOpen = async (val) => {
    const payload = {
      patientID: val?.PatientId,
      encounterID: val?.EncounterId,
    };
    try {
      let response = await FutureInvestigationsOpenService(payload);
      if (response?.success) {
        notify(response?.message, "success");
        refreshAfterAction();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  const handleSearchClose = async (val) => {
    const payload = {
      patientID: val?.PatientId,
      encounterID: val?.EncounterId,
    };
    try {
      let response = await FutureInvestigationsCloseService(payload);
      if (response?.success) {
        notify(response?.message, "success");
        refreshAfterAction();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  // Pre-close check: fetch pending activities then open modal
  const handleCloseWithCheck = async (val) => {
    setPendingCloseRow(val);
    setPreCloseActiveTab("Investigation");
    setPreCloseLoading(true);
    setPreCloseModal(true);
    try {
      const res = await GetEncounterPendingActivities({
        patientId: val?.PatientId,
        encounterId: val?.EncounterId,
      });

      const mapItems = (arr) =>
        (arr || []).map((item) => ({
          ActivityName: item?.ActivityName,
          Status: item?.Status || "Pending",
          ApprovalStatus: item?.ApprovalStatus || "",
          Remarks: item?.Remarks || "",
        }));

      if (res?.success && res?.data) {
        setPendingActivities({
          Investigation:      mapItems(res.data?.Investigation),
          Procedure:          mapItems(res.data?.Procedure),
          Payment:            mapItems(res.data?.Payment),
          "Admission Advice": mapItems(res.data?.["Admission Advice"]),
        });
      } else {
        setPendingActivities({ Investigation: [], Procedure: [], Payment: [], "Admission Advice": [] });
      }
    } catch (e) {
      console.log("pre-close fetch error", e);
    } finally {
      setPreCloseLoading(false);
    }
  };

  const updatePendingActivityStatus = (tab, rowIndex, field, value) => {
    setPendingActivities((prev) => {
      const updated = [...(prev[tab] || [])];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return { ...prev, [tab]: updated };
    });
  };

  const handleConfirmEncounterClose = async () => {
    setPreCloseModal(false);
    await handleSearchClose(pendingCloseRow);
    setPendingCloseRow(null);
  };

  const handleStopVisit = async () => {
    const payload = {
      patientID: encounterLogvisitLog[0]?.PatientId,
      EncounterNo: encounterLogvisitLog[0]?.EncounterId,
    };
    try {
      let response = await FutureInvestigationsStopService(payload);
      if (response?.success) {
        notify(response?.message, "success");
        refreshAfterAction();
      } else {
        // Was silent: a failed Close Visit reported nothing at all, so the user could
        // not tell the action had been rejected.
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  const handleOpenVisit = async () => {
    const payload = {
      patientID: encounterLogvisitLog[0]?.PatientId,
      EncounterNo: encounterLogvisitLog[0]?.EncounterId,
    };
    try {
      let response = await FutureInvestigationsStartService(payload);
      if (response?.success) {
        notify(response?.message, "success");
        refreshAfterAction();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  // Single owner of the "nothing found" message, so one search can never produce two
  // toasts. `silent` is used by the post-action refresh, where an empty result for the
  // chosen As On Date is a normal outcome rather than something to report.
  const handleSearch = async (overrideUHID, { silent = false } = {}) => {
    const [visit, enc] = await Promise.all([
      handleSearchVisitLog(overrideUHID),
      handleSearchEncLog(overrideUHID),
    ]);

    if (silent) return;
    if (!visit?.ok && !enc?.ok) {
      notify(visit?.message || enc?.message || t("No record found"), "error");
    }
  };

  // Refresh after an open/close/start/stop. Always silent: the action already reported
  // its own outcome, so this must not add a second, contradictory toast.
  const refreshAfterAction = () => handleSearch(undefined, { silent: true });

  const handleAction = async (ele) => {
    const payload = {
      patientId: ele?.patientId,
      isRequestType: values?.Type?.value,
      validityDays: ele?.ValidityDays,
      remarks: ele?.Remarks,
      transactionID: ele?.Remarks,
    };
    try {
      let response = await SaveServiceContinueRequest(payload);
      if (response?.success) {
        // setEncounterLogvisitLog(response?.data)
        notify(response?.message, "success");
      } else {
        notify(response?.message, "error");
        // setEncounterLogvisitLog([])
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleUpdate = async (value) => {
    debugger;
    try {
      const payload = {
        id: Number(value?.ID ? value?.ID : "0"),
        bagTypeName: String(value?.BagType ? value?.BagType : ""),
        activeStatus: Number(value?.IsActive ? value?.IsActive : ""),
      };
      let response = await EDPUpdateBagTypeAPI(payload);
      if (response?.success) {
        notify(response?.message, "success");
        // BindLoadBagType()
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  useEffect(() => {
    // BindLoadBagType()
    setValues((preV) => ({
      ...preV,
      UHID: singlePatientData?.PatientID,
    }));
  }, [singlePatientData]);

  // When opted-in (e.g. from the Single Window), auto-load the selected patient's
  // encounter/visit log once. Keyed on the UHID string so it doesn't re-fire on every
  // parent re-render (an inline singlePatientData object changes identity each render).
  useEffect(() => {
    if (autoSearch && singlePatientData?.PatientID) {
      handleSearch(singlePatientData?.PatientID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSearch, singlePatientData?.PatientID]);

  // The Note printed on this screen says the action is allowed only on the most recent
  // encounter, but every row rendered an enabled button - clicking an older one just
  // produced a confusing message from the API. Resolve the newest row by EntryDate rather
  // than trusting the API's ordering; fall back to the first row, which is what the
  // Close Visit / Open Visit buttons above already assume.
  const mostRecentEncounterIndex = useMemo(() => {
    if (!encounterLogvisitLog?.length) return -1;

    const formats = ["DD-MMM-YYYY hh:mm A", "DD-MMM-YYYY", "YYYY-MM-DD", moment.ISO_8601];
    let bestIndex = 0;
    let bestDate = null;

    encounterLogvisitLog.forEach((row, i) => {
      const parsed = moment(row?.EntryDate, formats, false);
      if (!parsed.isValid()) return;
      if (bestDate === null || parsed.isAfter(bestDate)) {
        bestDate = parsed;
        bestIndex = i;
      }
    });

    return bestIndex; // no parseable date anywhere -> first row
  }, [encounterLogvisitLog]);

  const handleCustomInput = (index, name, value) => {
    const data = JSON.parse(JSON.stringify(encounterLogvisitLog));
    data[index][name] = value;
    setEncounterLogvisitLog(data);
  };
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading
          title={singlePatientData ? "Service" : ""}
          // data={data}
          isSlideScreen={true}
          isBreadcrumb={singlePatientData ? false : true}
        />

        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            name="UHID"
            value={values?.UHID ? values?.UHID : ""}
            onChange={handleChange}
            lable={t("UHID")}
            placeholder=""
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            disabled={autoSearch}
          />

          <DatePicker
            className="custom-calendar"
            respclass="col-xl-2 col-md-3 col-sm-6 col-12"
            id="asOnDate"
            name="asOnDate"
            value={
              values.asOnDate
                ? moment(values?.asOnDate, "YYYY-MM-DD").toDate()
                : null
            }
            handleChange={handleChange}
            lable={t("As On Date")}
            placeholder={VITE_DATE_FORMAT}
          />
          <Input
            type="text"
            className="form-control"
            name="Contact"
            value={values?.Contact ? values?.Contact : ""}
            onChange={handleChange}
            lable={t("Contact")}
            placeholder=""
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <button
            className="btn btn-sm btn-success px-4"
            type="button"
            onClick={() => handleSearch()}
          >
            {t("Search")}
          </button>
        </div>

        <div className=" p-2 border p-3 bg-light">
          <div className="col-8 ">
            <b>{t("Note :")}</b>
            <ol className="mt-2 mb-0">
              <li>
                {t("If you want to open or close the patient encounter then you have to search the patient by UHID.")}
              </li>
              <li>
                {t("If you search the list using date range you will get the list of encounter no. only with its status.")}
              </li>
              <li>
                {t("You can take the action (open/close) only with the most recent encounter no. of the patient.")}
              </li>
            </ol>
          </div>
          {console.log("encounterLogvisitLog[0]", encounterLogvisitLog[0])}
          {isTrue &&
          encounterLogvisitLog[0]?.CanStartStopPatientService == "1" ? (
            <div className="col-4 ">
              {encounterLogvisitLog[0]?.IsStopService == "0" ? (
                <button
                  className="btn btn-sm btn-success px-4 mr-2"
                  type="button"
                  onClick={handleStopVisit}
                >
                  {t("Close Visit")}
                </button>
              ) : null}
              {encounterLogvisitLog[0]?.IsStartService == "0" ? (
                <button
                  className="btn btn-sm btn-success px-4"
                  type="button"
                  onClick={handleOpenVisit}
                >
                  {t("Open Visit")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {visitLog?.length > 0 && (
          <Heading
            title={t("Visit Log")}
            // data={data}
            isSlideScreen={true}
            isBreadcrumb={false}
          />
        )}
        <Tables
          thead={WrapTranslate(thead, "name")}
          style={{ height: "40vh" }}
          tbody={visitLog?.map((val, index) => ({
            SNo: index + 1,
            PatientId: val?.PatientId,
            Name: val?.Name,
            Age: val?.Age,
            Sex: val?.Sex,
            Mobile: val?.Mobile,
            OpenBy: val?.OpenBy,
            OpenDate: val?.OpenDate,
            CloseBy: val?.CloseBy,
            CloseDate: val?.CloseDate,
            ServiceStatus: val?.ServiceStatus,
          }))}
        />
      </div>

      <div className="patient_registration card">
        {encounterLogvisitLog?.length > 0 && (
          <Heading
            title={t("Encounter Log")}
            // data={data}
            isSlideScreen={true}
            isBreadcrumb={false}
          />
        )}
        <Tables
          thead={WrapTranslate(thead2, "name")}
          style={{ height: "50vh" }}
          tbody={encounterLogvisitLog?.map((val, index) => {
            const isOpen = val?.STATUS === "Open";
            // Disabled rather than hidden, so the user can see the action exists and why
            // it is unavailable, instead of wondering where the button went.
            const canAct = index === mostRecentEncounterIndex;

            return {
              SNo: index + 1,
              PatientId: val?.PatientId,
              NAME: val?.NAME,
              Age: val?.Age,
              Sex: val?.Sex,
              EncunterNo: val?.EncunterNo,
              Mobile: val?.Mobile,
              STATUS: val?.STATUS,
              IsSmartCard: val?.IsSmartCard,
              EntryDate: val?.EntryDate,
              LastUpdatedBy: val?.LastUpdatedBy,
              LastUpdatedDate: val?.LastUpdatedDate,
              Action: isTrue ? (
                <button
                  className="btn btn-sm btn-success tbl-btn"
                  type="button"
                  disabled={!canAct}
                  title={
                    canAct
                      ? ""
                      : t("Only the most recent encounter can be opened or closed.")
                  }
                  onClick={() =>
                    isOpen ? handleCloseWithCheck(val) : handleSearchOpen(val)
                  }
                >
                  {isOpen ? t("Close") : t("Open")}
                </button>
              ) : null,
            };
          })}
        />
      </div>

      {/* ── Pre-Close Pending Activity Check Modal ── */}
      {preCloseModal && (
        <Modal
          visible={preCloseModal}
          setVisible={setPreCloseModal}
          Header={t("Encounter Close — Pending Activity Check")}
          modalWidth="70vw"
          footer={
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-danger px-4"
                onClick={() => { setPreCloseModal(false); setPendingCloseRow(null); }}
              >
                {t("No, Cancel")}
              </button>
              <button
                className="btn btn-success px-4"
                onClick={handleConfirmEncounterClose}
              >
                {t("Yes, Close Encounter")}
              </button>
            </div>
          }
        >
          {/* Tabs */}
          <ul className="nav nav-tabs mb-3" style={{ borderBottom: "2px solid #0d9e8c" }}>
            {PRE_CLOSE_TABS.map((tab) => {
              const count = pendingActivities[tab]?.length || 0;
              return (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link${preCloseActiveTab === tab ? " active fw-bold" : ""}`}
                    style={preCloseActiveTab === tab ? { color: "#0d9e8c", borderBottom: "2px solid #0d9e8c" } : {}}
                    onClick={() => setPreCloseActiveTab(tab)}
                    type="button"
                  >
                    {t(tab)}
                    {count > 0 && (
                      <span className="badge bg-warning text-dark ms-1" style={{ fontSize: "0.7rem" }}>{count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {preCloseLoading ? (
            <div className="text-center py-4">
              <span className="spinner-border spinner-border-sm me-2" />
              {t("Loading pending activities...")}
            </div>
          ) : (
            <div style={{ minHeight: "200px" }}>
              {pendingActivities[preCloseActiveTab]?.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-check-circle text-success me-2" style={{ fontSize: "1.5rem" }} />
                  <div>{t("No pending items for")} <b>{t(preCloseActiveTab)}</b></div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "5%" }}>#</th>
                        <th>{t("Activity")}</th>
                        <th style={{ width: "18%" }}>{t("Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingActivities[preCloseActiveTab].map((item, idx) => {
                        const status = item?.Status || "";
                        const isDone = ["Result Approved", "Done"].includes(status);
                        const isPending = ["Sample Pending", "Pending", "Pending for Billing", "Pending Payment"].includes(status);
                        const badgeClass = isDone
                          ? "badge bg-success"
                          : isPending
                          ? "badge bg-danger"
                          : "badge bg-warning text-dark";
                        return (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{item?.ActivityName || item?.Name || "—"}</td>
                            <td>
                              <span className={badgeClass} style={{ fontSize: "0.78rem", padding: "4px 8px" }}>
                                {t(status) || "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
