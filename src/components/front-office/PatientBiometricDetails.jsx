import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import { Tooltip } from "primereact/tooltip";
import ReactSelect from "@app/components/formComponent/ReactSelect";
import Modal from "../modalComponent/Modal";
import { notify } from "../../utils/utils";
import "./PatientBiometricDetails.css";
import {
  captureFingerprint,
  getDeviceStatus,
  FINGER_TYPES,
  MIN_QUALITY_SCORE,
} from "../../networkServices/fingerprintService";
import { translateOptions } from "@components/WrapTranslate";

const SCAN_MESSAGES = [
  "Place your finger on the scanner...",
  "Capturing fingerprint...",
  "Processing...",
];

/**
 * "Patient Biometric Details" section for the Patient Registration page.
 *
 * The registration page itself only shows a COMPACT status (registered / not, quality,
 * last captured) plus a button that opens the fingerprint capture POPUP - mirroring how
 * the patient photo capture works. All scan / change / remove controls live in the modal.
 *
 * Captures only the encrypted fingerprint template (never an image) and writes it into
 * the shared Formik `values` so the existing registration Save API picks it up.
 * Biometric capture is OPTIONAL.
 *
 * Value keys written (consumed by Register_Patient_TypeCasting):
 *   IsFingerRegistered, FingerPrintTemplate, FingerPrintType,
 *   FingerPrintQuality, FingerPrintDeviceID, FingerPrintCaptureDate
 */
export default function PatientBiometricDetails({ values, setValues, isUpdate }) {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const dateFormat = VITE_DATE_FORMAT || "DD/MM/YYYY";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    connected: false,
    simulated: false,
    deviceId: "",
    info: "",
  });
  const [scanning, setScanning] = useState(false);
  const [scanMsgIndex, setScanMsgIndex] = useState(0);
  const [lowQuality, setLowQuality] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);
  const msgTimerRef = useRef(null);

  const isRegistered =
    values?.IsFingerRegistered === true ||
    values?.IsFingerRegistered === 1 ||
    values?.IsFingerRegistered === "1";

  const quality = parseInt(values?.FingerPrintQuality || 0, 10);
  const fingerType = values?.FingerPrintType || "RightThumb";

  const refreshDeviceStatus = async () => {
    const status = await getDeviceStatus();
    setDeviceStatus(status);
  };

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    };
  }, []);

  // Rotate the on-screen scan messages while a capture is in progress.
  useEffect(() => {
    if (scanning) {
      setScanMsgIndex(0);
      msgTimerRef.current = setInterval(() => {
        setScanMsgIndex((i) => Math.min(i + 1, SCAN_MESSAGES.length - 1));
      }, 600);
    } else if (msgTimerRef.current) {
      clearInterval(msgTimerRef.current);
      msgTimerRef.current = null;
    }
    return () => {
      if (msgTimerRef.current && !scanning) {
        clearInterval(msgTimerRef.current);
        msgTimerRef.current = null;
      }
    };
  }, [scanning]);

  const openModal = () => {
    setIsModalOpen(true);
    setLowQuality(false);
    setJustCaptured(false);
    refreshDeviceStatus();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setScanning(false);
  };

  const setFingerType = (_name, option) => {
    setValues((prev) => ({ ...prev, FingerPrintType: option?.value || "" }));
  };

  const handleScan = async () => {
    setLowQuality(false);
    setJustCaptured(false);
    setScanning(true);
    try {
      const result = await captureFingerprint({ fingerType });

      if (!result?.template) {
        notify(t("No fingerprint captured. Please try again."), "error");
        return;
      }

      if (result.quality < MIN_QUALITY_SCORE) {
        setLowQuality(true);
        notify(t("Low quality fingerprint. Please scan again."), "warn");
        return;
      }

      setValues((prev) => ({
        ...prev,
        IsFingerRegistered: true,
        FingerPrintTemplate: result.template,
        FingerPrintType: result.type,
        FingerPrintQuality: result.quality,
        FingerPrintDeviceID: result.deviceId,
        FingerPrintCaptureDate: result.captureDate,
        FingerPrintRemoved: false,
      }));
      setJustCaptured(true);
      notify(t("Fingerprint Captured Successfully"), "success");
    } catch (err) {
      notify(err?.message || t("Fingerprint capture failed"), "error");
    } finally {
      setScanning(false);
    }
  };

  const handleRemove = () => {
    setValues((prev) => ({
      ...prev,
      IsFingerRegistered: false,
      FingerPrintTemplate: "",
      FingerPrintQuality: 0,
      FingerPrintDeviceID: "",
      FingerPrintCaptureDate: "",
      // Flag so the update API knows to clear an existing template in the DB.
      FingerPrintRemoved: true,
    }));
    setJustCaptured(false);
    setLowQuality(false);
  };

  const capturedDateText = values?.FingerPrintCaptureDate
    ? moment(values.FingerPrintCaptureDate).isValid()
      ? moment(values.FingerPrintCaptureDate).format(`${dateFormat} HH:mm`)
      : values.FingerPrintCaptureDate
    : "--";

  const statusColor = deviceStatus.connected ? "#28a745" : "#dc3545";
  const qualityColor =
    quality >= 80 ? "#28a745" : quality >= MIN_QUALITY_SCORE ? "#f0ad4e" : "#dc3545";

  // ---- Popup footer: single "Done" button (capture already writes to values) ----
  const modalFooter = (
    <div className="ftr_btn">
      <button type="button" className="btn btn-primary btn-sm" onClick={closeModal}>
        {t("Done")}
      </button>
    </div>
  );

  return (
    <>
      {/* ===== Compact trigger shown below the patient photo ===== */}
      <Tooltip
        target="#fp-scan-btn"
        position="top"
        content={
          isRegistered
            ? t("Fingerprint Scanned - click to manage")
            : t("Click to scan fingerprint")
        }
        event="hover"
      />
      <div
        id="fp-scan-btn"
        role="button"
        tabIndex={0}
        onClick={openModal}
        className={`fp-trigger p-1 ${isRegistered ? "registered" : ""}`}
      >
        <i className="fa fa-fingerprint fp-trigger-icon" aria-hidden="true" />
        <span className="fp-trigger-text">
          {isRegistered ? t("SCANNED") : t("NOT YET")}
        </span>
      </div>

      {/* ===== Fingerprint capture popup ===== */}
      {isModalOpen && (
        <Modal
          visible={isModalOpen}
          setVisible={closeModal}
          Header={t("Patient Biometric Details")}
          modalWidth="620px"
          footer={modalFooter}
        >
          <div className="row p-2">
            {/* Animated fingerprint scanner */}
            <div className="col-md-4 col-12 d-flex flex-column justify-content-center align-items-center mb-3 mb-md-0">
              <div
                className={`fp-scanner ${scanning ? "scanning" : ""} ${
                  isRegistered ? "registered" : ""
                }`}
              >
                <span className="fp-corner tl" />
                <span className="fp-corner tr" />
                <span className="fp-corner bl" />
                <span className="fp-corner br" />
                <i className="fa fa-fingerprint fp-icon" aria-hidden="true" />
                <div className="fp-scan-line" />
                {isRegistered && !scanning && (
                  <i className="fa fa-check-circle fp-check" aria-hidden="true" />
                )}
              </div>
              <small
                className="mt-2"
                style={{
                  fontWeight: 600,
                  color: isRegistered
                    ? "#28a745"
                    : scanning
                      ? "#0d6efd"
                      : "#6c757d",
                }}
              >
                {scanning
                  ? t("Scanning...")
                  : isRegistered
                    ? t("Registered")
                    : t("Not Registered")}
              </small>
            </div>

            {/* Controls */}
            <div className="col-md-8 col-12">
              <div className="row g-2">
                <div className="col-6">
                  <label className="text-muted" style={{ fontSize: "12px" }}>
                    {t("Fingerprint Status")}
                  </label>
                  <div style={{ fontWeight: 600 }}>
                    {isRegistered ? (
                      <span style={{ color: "#28a745" }}>
                        {t("Registered")}: YES
                      </span>
                    ) : (
                      <span style={{ color: "#6c757d" }}>
                        {t("Not Registered")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-6">
                  <label className="text-muted" style={{ fontSize: "12px" }}>
                    {t("Device Status")}
                  </label>
                  <div style={{ fontWeight: 600 }}>
                    <span style={{ color: statusColor, marginRight: "5px" }}>
                      ●
                    </span>
                    {deviceStatus.connected
                      ? t("Connected")
                      : t("Disconnected")}
                    {deviceStatus.simulated ? ` (${t("Simulation")})` : ""}
                  </div>
                </div>

                <div className="col-6">
                  <label className="text-muted" style={{ fontSize: "12px" }}>
                    {t("Quality Score")}
                  </label>
                  <div
                    style={{
                      fontWeight: 600,
                      color: isRegistered ? qualityColor : "#6c757d",
                    }}
                  >
                    {isRegistered ? `${quality || 0}%` : "0%"}
                  </div>
                </div>
                <div className="col-6">
                  <label className="text-muted" style={{ fontSize: "12px" }}>
                    {t("Last Captured")}
                  </label>
                  <div style={{ fontWeight: 600 }}>
                    {isRegistered ? capturedDateText : "--"}
                  </div>
                </div>

                <div className="col-12 mt-1">
                  <label className="text-muted" style={{ fontSize: "12px" }}>
                    {t("Finger")}
                  </label>
                  <ReactSelect
                    placeholderName={t("Finger")}
                    name="FingerPrintType"
                    id="FingerPrintType"
                    value={fingerType}
                    handleChange={setFingerType}
                    dynamicOptions={translateOptions(FINGER_TYPES, t)}
                    searchable={false}
                    isDisabled={scanning}
                  />
                </div>
              </div>

              {/* Feedback */}
              {scanning && (
                <div
                  className="mt-3 d-flex align-items-center"
                  style={{ color: "#0d6efd" }}
                >
                  <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true" />
                  <span className="ml-2">{SCAN_MESSAGES[scanMsgIndex]}</span>
                </div>
              )}

              {!scanning && lowQuality && (
                <div className="mt-3" style={{ color: "#dc3545" }}>
                  <i
                    className="fa fa-exclamation-triangle mr-2"
                    aria-hidden="true"
                  />
                  <span className="ml-2">
                    {t("Low quality fingerprint. Please scan again.")}
                  </span>
                </div>
              )}

              {!scanning && !lowQuality && justCaptured && (
                <div className="mt-3" style={{ color: "#28a745" }}>
                  <i className="fa fa-check-circle mr-2" aria-hidden="true" />
                  <span className="ml-2">
                    {t("Fingerprint Captured Successfully")} ({t("Quality Score")}:{" "}
                    {quality}%)
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 d-flex flex-wrap" style={{ gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleScan}
                  disabled={scanning}
                >
                  <i className="fa fa-fingerprint mr-1" aria-hidden="true" />{" "}
                  {isRegistered ? t("Change Fingerprint") : t("Scan Fingerprint")}
                </button>

                {isRegistered && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleRemove}
                    disabled={scanning}
                  >
                    <i className="fa fa-trash mr-1" aria-hidden="true" />{" "}
                    {t("Remove")}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={refreshDeviceStatus}
                  disabled={scanning}
                  title={t("Refresh device status")}
                >
                  <i className="fa fa-sync-alt mr-1" aria-hidden="true" />{" "}
                  {t("Refresh")}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
