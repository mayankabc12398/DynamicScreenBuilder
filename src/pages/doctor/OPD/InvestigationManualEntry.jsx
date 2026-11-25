import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../../../components/UI/Heading";
import SegmentedToggle from "../../../components/UI/modern/SegmentedToggle";
import LabReportEntry from "../../../components/LabReports/LabReportEntry";
import LabReportList from "../../../components/LabReports/LabReportList";
import LabTrends from "../../../components/LabReports/LabTrends";
import {
  PatientLabReportList,
  PatientLabReportTrends,
} from "../../../networkServices/PatientLabReportApi";

/**
 * Lab Reports and Trends - the doctor's EMR frame that used to be the fixed-list "Investigation
 * Manual Entry" form. It is still opened from the same menu entry (the menu loads this file by
 * its name), but it no longer has a fixed list of tests:
 *
 *   Add Report  load a PDF or a photo of a report (or type values); the AI reads every parameter
 *               into a table; the doctor checks it and saves.
 *   Trends      every parameter the patient has, across all their reports from any laboratory,
 *               as a chart with the reference range shaded.
 *   Reports     the saved reports: view the values or the original file, correct, remove.
 *
 * The earlier manual-entry tables and endpoints are left exactly as they were; this frame writes
 * its own (patient_lab_report / patient_lab_param).
 */
const InvestigationManualEntry = forwardRef(function InvestigationManualEntry({ patientDetail }, ref) {
  const [t] = useTranslation();
  const patient = patientDetail?.currentPatient;
  const patientID = patient?.PatientID;

  const [tab, setTab] = useState(null); // decided by the first load: Trends when there is something to see
  const [trends, setTrends] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(0);

  const load = useCallback(async () => {
    if (!patientID) return;
    setLoading(true);
    const [trendRes, listRes] = await Promise.all([PatientLabReportTrends(patientID), PatientLabReportList(patientID)]);
    const failed = [trendRes, listRes].find((r) => !r?.success);
    setLoadError(failed ? failed?.message || "" : "");
    setTrends(trendRes?.success ? trendRes.data : { reports: 0, parameters: [] });
    setReports(listRes?.success ? listRes.data : []);
    setLoading(false);
    setTab((current) => current ?? (listRes?.success && listRes.data?.length > 0 ? "trends" : "add"));
  }, [patientID]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = async () => {
    setEditing(null);
    await load();
    setTab("trends");
  };

  const handleEdit = (report) => {
    setEditing(report);
    setTab("add");
  };

  const handleOpenReport = (reportId) => {
    setOpenId(reportId);
    setTab("reports");
  };

  if (!patientID) {
    return (
      <div className="m-2 spatient_registration_card">
        <div className="lrt-empty lrt-empty--tall">{t("Select a patient first")}</div>
      </div>
    );
  }

  const count = reports?.length || 0;

  return (
    <div className="m-2 spatient_registration_card lrt-page">
      <div className="patient_registration card">
        <Heading
          title={t("Lab Reports & Trends")}
          isBreadcrumb={false}
          secondTitle={
            <SegmentedToggle
              value={tab || "trends"}
              onChange={setTab}
              items={[
                { key: "add", label: editing ? t("Correct Report") : t("Add Report"), icon: "fas fa-plus" },
                { key: "trends", label: t("Trends"), icon: "fas fa-chart-line" },
                { key: "reports", label: `${t("Reports")}${count ? ` (${count})` : ""}`, icon: "fas fa-folder-open" },
              ]}
            />
          }
        />

        {loadError && (
          <div className="lrt-warn mx-2 mt-2">
            <i className="fas fa-exclamation-triangle mr-1" aria-hidden="true" />
            {t("Lab reports could not be loaded")}: {loadError}
          </div>
        )}

        <div className="p-2">
          {tab === "add" && (
            <LabReportEntry
              key={editing?.reportId || "new"}
              patient={patient}
              editing={editing}
              onSaved={handleSaved}
              onCancelEdit={() => setEditing(null)}
            />
          )}
          {tab === "trends" && (
            <LabTrends data={trends} loading={loading} onOpenReport={handleOpenReport} onAddReport={() => setTab("add")} />
          )}
          {tab === "reports" && (
            <LabReportList
              reports={reports}
              loading={loading}
              openId={openId}
              onOpenHandled={() => setOpenId(0)}
              onEdit={handleEdit}
              onChanged={load}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default InvestigationManualEntry;
