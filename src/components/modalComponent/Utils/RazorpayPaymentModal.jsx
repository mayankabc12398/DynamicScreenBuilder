import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import { notify } from "../../../utils/utils";
import {
  RZPCreatePaymentLink,
  RZPGetPaymentLinkStatus,
  RZPCreateQrCode,
  RZPGetQrPayments,
} from "../../../networkServices/razorpayPaymentAPI";

// Collect an OPD payment via Razorpay — SMS payment link or on-screen UPI QR.
// Polls Razorpay while staff waits; on success calls onPaid(reference) so the
// caller can stamp the Ref No and save the bill.
function RazorpayPaymentModal({
  visible,
  setVisible,
  amount,
  patientName,
  mobile,
  patientID,
  centreId,
  userId,
  onPaid,
}) {
  const [t] = useTranslation();
  const [mode, setMode] = useState(null); // "link" | "qr"
  const [linkData, setLinkData] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState(""); // creating | waiting | paid | error
  const pollRef = useRef(null);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  useEffect(() => () => stopPoll(), []);

  const handlePaid = (reference) => {
    stopPoll();
    setStatus("paid");
    notify(t("Payment received"), "success");
    if (typeof onPaid === "function") onPaid(reference);
  };

  const startLink = async () => {
    stopPoll();
    setMode("link");
    setStatus("creating");
    const res = await RZPCreatePaymentLink({
      Amount: String(amount ?? ""),
      Description: "Receipt payment for OPD",
      CustomerName: patientName || "",
      CustomerContact: mobile || "",
      CustomerEmail: "",
      PatientID: patientID || "",
      Receipt: "",
      CentreID: String(centreId || ""),
      UserID: String(userId || ""),
    });
    if (res?.success && res?.data?.id) {
      setLinkData(res.data);
      setStatus("waiting");
      pollRef.current = setInterval(async () => {
        const s = await RZPGetPaymentLinkStatus(res.data.id);
        if (s?.data?.paid) handlePaid(s?.data?.reference || res.data.id);
      }, 5000);
    } else {
      setStatus("error");
      notify(res?.message || t("Failed to create payment link"), "error");
    }
  };

  const startQr = async () => {
    stopPoll();
    setMode("qr");
    setStatus("creating");
    const res = await RZPCreateQrCode({
      Amount: String(amount ?? ""),
      Description: "Receipt payment for OPD",
      PatientID: patientID || "",
    });
    if (res?.success && res?.data?.id) {
      setQrData(res.data);
      setStatus("waiting");
      pollRef.current = setInterval(async () => {
        const s = await RZPGetQrPayments(res.data.id);
        if (s?.data?.paid) handlePaid(s?.data?.reference || res.data.id);
      }, 5000);
    } else {
      setStatus("error");
      notify(res?.message || t("Failed to create QR"), "error");
    }
  };

  const close = () => {
    stopPoll();
    setVisible(false);
  };

  const Waiting = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#c47d0a", marginTop: 10, fontWeight: 600, fontSize: 13 }}>
      <i className="fas fa-circle-notch fa-spin" /> {t("Waiting for payment...")}
    </div>
  );

  return (
    <Modal
      visible={visible}
      setVisible={close}
      modalWidth="42vw"
      Header={t("Collect Payment via Razorpay")}
      footer={<></>}
    >
      <div style={{ padding: "4px 2px" }}>
        <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 12 }}>
          <b style={{ color: "#343a40" }}>{patientName || "-"}</b>
          {mobile ? ` — ${mobile}` : ""} ·{" "}
          <b style={{ color: "#0b3a4a" }}>{t("INR")} {amount}</b>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={startLink} disabled={status === "waiting" || status === "paid"}>
            <i className="fas fa-sms mr-1" /> {t("Send Link (SMS)")}
          </button>
          <button type="button" className="btn btn-sm btn-success" onClick={startQr} disabled={status === "waiting" || status === "paid"}>
            <i className="fas fa-qrcode mr-1" /> {t("Show QR")}
          </button>
        </div>

        {status === "creating" && <div style={{ color: "#6c757d" }}>{t("Creating...")}</div>}

        {mode === "link" && linkData && status !== "creating" && (
          <div style={{ border: "1px solid #e9ecef", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, color: "#343a40", marginBottom: 6 }}>
              <i className="fas fa-paper-plane mr-1" style={{ color: "#1e6cb5" }} />
              {t("Payment link sent to the patient by SMS.")}
            </div>
            {linkData.short_url ? (
              <a href={linkData.short_url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, wordBreak: "break-all" }}>
                {linkData.short_url}
              </a>
            ) : null}
            {status === "waiting" && <Waiting />}
          </div>
        )}

        {mode === "qr" && qrData && status !== "creating" && (
          <div style={{ textAlign: "center", border: "1px solid #e9ecef", borderRadius: 8, padding: 12 }}>
            {qrData.image_url ? (
              <img src={qrData.image_url} alt="UPI QR" style={{ width: 220, height: 220, objectFit: "contain" }} />
            ) : (
              <div style={{ color: "#adb5bd" }}>{t("QR not available")}</div>
            )}
            <div style={{ fontSize: 13, color: "#343a40", marginTop: 6 }}>
              {t("Ask the patient to scan and pay.")}
            </div>
            {status === "waiting" && <div style={{ display: "flex", justifyContent: "center" }}><Waiting /></div>}
          </div>
        )}

        {status === "paid" && (
          <div style={{ color: "#15803d", fontWeight: 700, marginTop: 12 }}>
            <i className="fas fa-check-circle mr-1" /> {t("Payment received — saving the bill...")}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button type="button" className="btn btn-sm btn-secondary" onClick={close}>
            {t("Close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RazorpayPaymentModal;
