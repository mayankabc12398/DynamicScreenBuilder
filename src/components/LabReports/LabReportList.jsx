import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Modal from "../modalComponent/Modal";
import Confirm from "../modalComponent/Confirm";
import LabFlagChip from "./LabFlagChip";
import { notify } from "../../utils/utils";
import {
  PatientLabReportDelete,
  PatientLabReportFile,
  PatientLabReportGet,
} from "../../networkServices/PatientLabReportApi";
import { showDate } from "../../utils/labTrendLogic";

/**
 * Every saved report of the patient, newest first: when, from which laboratory, how many
 * parameters and how many were out of range, and how it was entered (read by the AI or typed).
 * From here a report's values or its original file can be looked at, it can be corrected (which
 * reopens it in Add Report), or removed (hidden from the lists and the trends; the data stays).
 */
export default function LabReportList({ reports, loading, openId, onOpenHandled, onEdit, onChanged }) {
  const [t] = useTranslation();
  const [values, setValues] = useState(null); // { report } being viewed
  const [fileView, setFileView] = useState(null); // { name, type, url }
  const [confirm, setConfirm] = useState({ show: false, report: null });
  const [busy, setBusy] = useState(false);

  const viewValues = async (reportId) => {
    const res = await PatientLabReportGet(reportId);
    if (res?.success) setValues(res.data);
    else notify(res?.message || t("The report could not be opened"), "error");
  };

  // A report opened from a trend row: shown once, then the request is cleared so the same one can be opened again.
  React.useEffect(() => {
    if (!openId) return;
    viewValues(openId).finally(() => onOpenHandled?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const viewFile = async (report) => {
    const res = await PatientLabReportFile(report.reportId);
    if (!res?.success) {
      notify(res?.message || t("The report file could not be opened"), "error");
      return;
    }
    const { base64, fileType, fileName } = res.data;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    setFileView({ name: fileName, type: fileType, url: URL.createObjectURL(new Blob([bytes], { type: fileType })) });
  };

  const closeFile = () => {
    if (fileView?.url) URL.revokeObjectURL(fileView.url);
    setFileView(null);
  };

  const edit = async (report) => {
    const res = await PatientLabReportGet(report.reportId);
    if (res?.success) onEdit?.(res.data);
    else notify(res?.message || t("The report could not be opened"), "error");
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await PatientLabReportDelete(confirm.report.reportId);
      if (res?.success) {
        notify(res.message, "success");
        onChanged?.();
      } else {
        notify(res?.message || t("The report could not be removed"), "error");
      }
    } finally {
      setBusy(false);
      setConfirm({ show: false, report: null });
    }
  };

  if (loading && !reports) return <div className="lrt-empty lrt-empty--tall">{t("Loading...")}</div>;
  if (!reports?.length) {
    return (
      <div className="lrt-empty lrt-empty--tall">
        <i className="far fa-folder-open" aria-hidden="true" />
        <div>{t("No lab reports saved for this patient yet.")}</div>
      </div>
    );
  }

  const icon = (cls, label, onClick) => (
    <i className={`${cls} lrt-act`} role="button" tabIndex={0} title={label} aria-label={label} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick()} />
  );

  const tbody = reports.map((r, index) => ({
    sno: index + 1,
    date: showDate(r.reportDate),
    lab: r.labName || "-",
    title: r.reportTitle || "-",
    params: r.paramCount,
    out: r.abnormalCount > 0 ? <span className="lrt-counts__bad">{r.abnormalCount}</span> : 0,
    source: <span className={`lrt-src lrt-src--${r.sourceType === "AI" ? "ai" : "man"}`}>{r.sourceType === "AI" ? t("AI read") : t("Typed")}</span>,
    by: r.createdBy || "-",
    actions: (
      <span className="lrt-acts">
        {icon("fas fa-eye", t("View values"), () => viewValues(r.reportId))}
        {r.hasFile && icon("far fa-file-pdf", t("View original file"), () => viewFile(r))}
        {icon("fas fa-pen", t("Correct this report"), () => edit(r))}
        {icon("fa fa-trash text-danger", t("Remove"), () => setConfirm({ show: true, report: r }))}
      </span>
    ),
  }));

  return (
    <>
      <Tables
        thead={[
          { name: "#", width: "3%" },
          { name: t("Report Date"), width: "11%" },
          { name: t("Laboratory / Hospital"), width: "22%" },
          { name: t("Report Title"), width: "18%" },
          { name: t("Parameters"), width: "9%" },
          { name: t("Out of range"), width: "9%" },
          { name: t("Entered"), width: "8%" },
          { name: t("Entered by"), width: "10%" },
          { name: t("Actions"), width: "10%" },
        ]}
        tbody={tbody}
        style={{ maxHeight: "62vh" }}
      />

      {values && (
        <Modal visible setVisible={() => setValues(null)} modalWidth="70vw" Header={`${t("Lab Report")} - ${showDate(values.reportDate)}`} footer={<></>}>
          <div className="lrt-view-head">
            {values.labName && <span><b>{t("Laboratory / Hospital")}:</b> {values.labName}</span>}
            {values.reportTitle && <span><b>{t("Report Title")}:</b> {values.reportTitle}</span>}
          </div>
          <Tables
            thead={[
              { name: "#", width: "4%" },
              { name: t("Test / Group"), width: "18%" },
              { name: t("Parameter"), width: "28%" },
              { name: t("Value"), width: "12%" },
              { name: t("Unit"), width: "10%" },
              { name: t("Reference Range"), width: "18%" },
              { name: t("Flag"), width: "10%" },
            ]}
            tbody={(values.parameters || []).map((p, i) => ({
              sno: i + 1,
              section: p.section || "-",
              name: p.name,
              value: <b>{p.value}</b>,
              unit: p.unit || "-",
              range: p.refRange || "-",
              flag: <LabFlagChip flag={p.flag} />,
            }))}
            style={{ maxHeight: "60vh" }}
          />
        </Modal>
      )}

      {fileView && (
        <Modal visible setVisible={closeFile} modalWidth="70vw" Header={fileView.name || t("Report")} footer={<></>}>
          {fileView.type === "application/pdf" ? (
            <iframe title={fileView.name} src={fileView.url} className="lrt-viewer" />
          ) : (
            <img alt={fileView.name} src={fileView.url} className="lrt-viewer lrt-viewer--img" />
          )}
        </Modal>
      )}

      {confirm.show && (
        <Confirm
          confirmBoxvisible={confirm}
          lableMessage={t("Remove Lab Report")}
          alertMessage={`${t("Remove the report of")} ${showDate(confirm.report?.reportDate)}? ${t("It will no longer appear in the lists or the trends.")}`}
        >
          <div>
            <button type="button" className="modalConfirmButton" disabled={busy} onClick={remove}>
              {busy ? t("Processing...") : t("Remove")}
            </button>
            <button type="button" className="modalCancelButton" disabled={busy} onClick={() => setConfirm({ show: false, report: null })}>
              {t("Cancel")}
            </button>
          </div>
        </Confirm>
      )}
    </>
  );
}
