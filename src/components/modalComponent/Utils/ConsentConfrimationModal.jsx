import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "../../../utils/utils";
import { SendConsentLinkApi } from "../../../networkServices/consentApi";
import { DpdpSend } from "../../../networkServices/DpdpApi";
import { useTranslation } from "react-i18next";

function ConsentConfrimationModal({
  patientData,
  transactionId = "",
  onClose,
}) {
  const [t] = useTranslation();
  debugger;
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState("message"); // 'message' or 'sign'
  const [channel, setChannel] = useState("Email"); // 'SMS', 'Email', 'WhatsApp', 'Both'
  const [contactInfo, setContactInfo] = useState("");

  const patientId = patientData?.PatientID || patientData?.patientId || "";
  const actualTransactionId =
    transactionId ||
    patientData?.TransactionID ||
    patientData?.transactionId ||
    "";

  // Pre-populate input based on selected channel and patient data
  useEffect(() => {
    if (channel === "Email") {
      setContactInfo(patientData?.Email || patientData?.email || "");
    } else {
      setContactInfo(
        patientData?.Mobile ||
          patientData?.ContactNo ||
          patientData?.contactNo ||
          "",
      );
    }
  }, [channel, patientData]);

  const getLabel = () => {
    switch (channel) {
      case "SMS":
        return "Mobile Number";
      case "Email":
        return "Email Address";
      case "WhatsApp":
        return "WhatsApp Number";
      case "Both":
        return "Mobile Number or Email";
      default:
        return "Contact Details";
    }
  };

  const getPlaceholder = () => {
    switch (channel) {
      case "SMS":
        return "Enter patient's mobile number";
      case "Email":
        return "Enter patient's email address";
      case "WhatsApp":
        return "Enter patient's WhatsApp number";
      case "Both":
        return "Enter mobile number or email";
      default:
        return "Enter contact details";
    }
  };

  /* DPDP privacy consent in the same sitting (5 Nov 2026): a DPDP link session is created for this visit and
     its token travels with the consent-form link, so the form also asks the DPDP questions and saves the
     privacy choices with the same signature. If the DPDP module is not installed (or the call fails) the
     form opens exactly as before. LINK = no second message; TABLET = the patient signs on this device. */
  const dpdpTokenFor = async (channel) => {
    try {
      const r = await DpdpSend({ UHID: patientId, Channel: channel, VisitType: "OPD", HospitalTxnID: String(actualTransactionId || "") });
      const d = r?.data || {};
      return r?.success ? d.token || d.Token || "" : "";
    } catch (e) {
      return "";
    }
  };
  const consentPath = (token) =>
    `/ProvideConsent?PatientId=${patientId}&TrnsactionId=${actualTransactionId}${token ? `&dpdp=${encodeURIComponent(token)}` : ""}`;

  const getInputType = () => {
    return channel === "Email" ? "email" : "text";
  };

  const handleSend = async () => {
    if (!contactInfo?.trim()) {
      notify(`Please enter a valid ${getLabel().toLowerCase()}`, "error");
      return;
    }

    const isSMS = channel === "SMS" || channel === "Both";
    const isEmail = channel === "Email" || channel === "Both";
    const isWhatsApp = channel === "WhatsApp";

    const dynamicLink = `${window.location.origin}${consentPath(await dpdpTokenFor("LINK"))}`;

    const payload = {
      patientID: patientId,
      transactionID: actualTransactionId,
      link: dynamicLink,
      message: `Dear Patient, please review and submit your consent form using the below link.\n${dynamicLink}`,
      mobile: isSMS || isWhatsApp ? contactInfo : (patientData?.Mobile || patientData?.ContactNo || patientData?.contactNo || ""),
      email: isEmail ? contactInfo : (patientData?.Email || patientData?.email || ""),
      sendSMS: isSMS,
      sendWhatsApp: isWhatsApp,
      sendEmail: isEmail,
      emailSubject: "Patient Consent Form",
    };

    try {
      const res = await SendConsentLinkApi(payload);
      if (res?.success || res?.result) {
        notify(
          `Consent link sent successfully via ${channel} to: ${contactInfo}`,
          "success",
        );
      } else {
        notify(res?.message || "Failed to send consent link", "error");
      }
      console.log("res", res);
    } catch (error) {
      console.log("error", error);
      notify(t("Something went wrong while sending consent link."), "error");
    }

    onClose();
  };

  const handleProceedToSign = async () => {
    if (!patientId) {
      notify(t("Patient details are not fully loaded yet."), "error");
      return;
    }

    // Opens the consent form in a new tab, so this booking screen stays as it was. The tab is opened at the
    // click (pop-up blockers allow that) and pointed at the form once the DPDP session exists.
    const tab = window.open("about:blank", "_blank");
    const token = await dpdpTokenFor("TABLET");
    const path = consentPath(token);
    if (tab && !tab.closed) {
      tab.opener = null;
      tab.location.href = `${window.location.origin}${path}`;
    } else {
      navigate(path); // pop-ups blocked: same tab, as before
    }
    onClose();
  };

  return (
    <div className="consent-modal-container" style={{ padding: "10px" }}>
      {/* Dynamic CSS Styling for Cards and Hover Transitions */}
      <style>{`
        .consent-options-grid {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }
        .consent-option-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .consent-option-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }
        .consent-option-card.selected {
          border-color: #0F2C59;
          background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
          box-shadow: 0 8px 24px rgba(15, 44, 89, 0.1);
        }
        .consent-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #64748b;
          font-size: 20px;
          transition: all 0.3s ease;
        }
        .consent-option-card.selected .consent-icon-wrapper {
          background: #0F2C59;
          color: #ffffff;
        }
        .consent-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .consent-card-desc {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .consent-divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 24px 0;
        }
        .consent-btn-primary {
          background-color: #0F2C59;
          border: none;
          color: white;
          padding: 10px 24px;
          border-radius: 24px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(15, 44, 89, 0.15);
        }
        .consent-btn-primary:hover {
          background-color: #1e3a8a;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15, 44, 89, 0.25);
        }
        .consent-btn-primary:active {
          transform: translateY(0);
        }
        .consent-btn-secondary {
          background-color: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          color: #475569;
          padding: 10px 24px;
          border-radius: 24px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .consent-btn-secondary:hover {
          background-color: #e2e8f0;
          color: #0f172a;
        }
        @media (max-width: 600px) {
          .consent-options-grid {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>

      {/* Top Options Grid */}
      <div className="consent-options-grid">
        {/* Send Message Selector Card */}
        <div
          className={`consent-option-card ${selectedMode === "message" ? "selected" : ""}`}
          onClick={() => setSelectedMode("message")}
        >
          <div className="consent-icon-wrapper">
            <i className="fa fa-paper-plane" />
          </div>
          <div>
            <h4 className="consent-card-title">{t("Send Message")}</h4>
            <p className="consent-card-desc">
              {t("Send signature link to patient device")}
            </p>
          </div>
        </div>

        {/* Sign Now Selector Card */}
        <div
          className={`consent-option-card ${selectedMode === "sign" ? "selected" : ""}`}
          onClick={() => setSelectedMode("sign")}
        >
          <div className="consent-icon-wrapper">
            <i className="fa fa-signature" />
          </div>
          <div>
            <h4 className="consent-card-title">{t("Sign now")}</h4>
            <p className="consent-card-desc">
              {t("Patient signs directly on this device")}
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Divider Line */}
      <div className="consent-divider" />

      {/* Bottom Section */}
      {selectedMode === "message" ? (
        <div className="consent-message-form">
          <div className="row g-3 align-items-end">
            {/* Left: Dropdown */}
            <div className="col-md-5">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#475569",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                {t("Select Channel")}
              </label>
              <select
                className="form-control"
                style={{
                  borderRadius: "8px",
                  height: "40px",
                  borderColor: "#cbd5e1",
                  fontSize: "13.5px",
                  padding: "0 10px",
                  cursor: "pointer",
                }}
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="SMS">{t("SMS")}</option>
                <option value="Email">{t("Email")}</option>
                <option value="WhatsApp">{t("WhatsApp")}</option>
                <option value="Both">{t("Both (SMS & Email)")}</option>
              </select>
            </div>

            {/* Right: Text box for number or email */}
            <div className="col-md-7">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#475569",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                {getLabel()}
              </label>
              <input
                type={getInputType()}
                className="form-control"
                style={{
                  borderRadius: "8px",
                  height: "40px",
                  borderColor: "#cbd5e1",
                  fontSize: "13.5px",
                  padding: "0 12px",
                }}
                placeholder={getPlaceholder()}
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button className="consent-btn-secondary mx-2" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button className="consent-btn-primary" onClick={handleSend}>
              <i className="fa fa-paper-plane" /> {t("Send")}
            </button>
          </div>
        </div>
      ) : (
        <div className="consent-sign-form text-center py-3">
          <div
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#475569",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            {t("Please hand over the device to the patient to sign the consent form digitally.")}
            <br />
            {t("The consent form, with the privacy (DPDP) consent, opens in a new tab.")}
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-center">
            <button className="consent-btn-secondary m-2" onClick={onClose}>
              {t("Go Back")}
            </button>
            <button
              className="consent-btn-primary m-2"
              onClick={handleProceedToSign}
            >
              <i className="fa fa-arrow-right" /> {t("Proceed to Sign")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsentConfrimationModal;
