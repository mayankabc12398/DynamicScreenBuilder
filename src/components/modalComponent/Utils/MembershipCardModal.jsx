import React, { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import Modal from "../Modal";
import { Oldpatientsearch } from "../../../networkServices/opdserviceAPI";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import i18next from "i18next";

// Real (class) error boundary — the app's shared "ErrorBoundary" only listens to
// window.onerror and does NOT catch React render errors, so without this any throw
// while rendering the card would white-screen the whole page. This contains it.
class CardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error("MembershipCard render error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: "#b3261e", fontSize: 13 }}>
          {this.props.fallback || i18next.t("Unable to display the membership card.")}
        </div>
      );
    }
    return this.props.children;
  }
}

// Reusable Membership-Card print modal.
// Opens from the membership chip on OPD Service Booking; pulls patient details
// via PatientControl/Oldpatientsearch and renders a printable card whose QR
// encodes the patient information.
function MembershipCardModal({ visible, setVisible, uhid, cardInfo, cardNo }) {
  const [t] = useTranslation();
  const [patient, setPatient] = useState(null);
  const cardRef = useRef(null);

  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  // Which fields appear on the card (mirrors the reference "Select Fields").
  const [fields, setFields] = useState({
    name: true,
    uhid: true,
    ageGender: true,
    contact: true,
    address: true,
    cardName: true,
    cardNo: true,
    validity: true,
  });

  useEffect(() => {
    if (!visible || !uhid) return;
    let active = true;
    (async () => {
      try {
        const res = await Oldpatientsearch(uhid);
        const list = res?.data || [];
        const found =
          list.find((p) => String(p?.MRNo) === String(uhid)) || list[0] || null;
        if (active) setPatient(found);
      } catch (e) {
        if (active) setPatient(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [visible, uhid]);

  const cardName = cardInfo?.card_name || "";
  const validityDays = cardInfo?.ValidityDays;
  // The patient's membership card number. Prefer the value supplied by the
  // caller (it lives on the patient / billing details); fall back to the
  // resolver payload or the fetched patient record when present.
  const memberCardNo =
    cardNo ||
    cardInfo?.MemberShipCardNo ||
    cardInfo?.MembershipCardNo ||
    cardInfo?.membership_card_no ||
    cardInfo?.CardNo ||
    patient?.MemberShipCardNo ||
    "";

  // QR content = the patient information.
  const qrValue = useMemo(() => {
    const info = {
      UHID: patient?.MRNo || uhid || "",
      Name: patient?.PatientName || "",
      AgeGender: patient?.AgeGender || "",
      Contact: patient?.ContactNo || "",
      Address: patient?.House_No || "",
      Card: cardName,
      CardNo: memberCardNo,
    };
    return JSON.stringify(info);
  }, [patient, uhid, cardName, memberCardNo]);

  const toggle = (k) => setFields((f) => ({ ...f, [k]: !f[k] }));

  // True while html2canvas is rasterising the card (download / print share it).
  const [busy, setBusy] = useState(false);

  // 96 CSS px == 25.4 mm. Used so the printed @page is exactly the card size
  // instead of defaulting to A4.
  const pxToMm = (px) => (px * 25.4) / 96;

  const fileBaseName = () => {
    const id = asText(patient?.MRNo || uhid).replace(/[^\w-]+/g, "_");
    return `MembershipCard${id ? `_${id}` : ""}`;
  };

  // Rasterise the card node to a high-resolution canvas. scale:3 keeps text/QR
  // crisp; backgroundColor avoids a transparent PNG. Returns null on failure.
  const renderCardCanvas = async () => {
    const node = cardRef.current;
    if (!node) return null;
    return html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      logging: false,
    });
  };

  // Download the card as a PNG image (no print dialog at all).
  const handleDownloadPng = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const canvas = await renderCardCanvas();
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (blob) saveAs(blob, `${fileBaseName()}.png`);
      }, "image/png");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Membership card PNG export failed:", e);
    } finally {
      setBusy(false);
    }
  };

  // Print the card on a page sized to the card itself (not A4): we rasterise the
  // card and drop it into a print iframe whose @page size matches the card.
  const handlePrint = async () => {
    if (busy) return;
    setBusy(true);
    const node = cardRef.current;
    let dataUrl;
    let wMm = 0;
    let hMm = 0;
    try {
      const canvas = await renderCardCanvas();
      if (!canvas || !node) return;
      dataUrl = canvas.toDataURL("image/png");
      wMm = pxToMm(node.offsetWidth);
      hMm = pxToMm(node.offsetHeight);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Membership card print failed:", e);
      return;
    } finally {
      setBusy(false);
    }
    if (!dataUrl) return;

    const html =
      `<!DOCTYPE html><html><head><title>${t("Membership Card")}</title>` +
      `<style>*{margin:0;padding:0;box-sizing:border-box;` +
      `-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
      `@page{size:${wMm}mm ${hMm}mm;margin:0;}` +
      `html,body{width:${wMm}mm;height:${hMm}mm;background:#fff;}` +
      `img{width:${wMm}mm;height:${hMm}mm;display:block;}</style></head>` +
      `<body><img src="${dataUrl}"/></body></html>`;

    // Print through a hidden iframe (reliable; not blocked by popup blockers).
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    const cleanup = () => {
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (_) {
          /* already removed */
        }
      }, 500);
    };
    // Wait for the <img> to decode before printing, else it prints blank.
    const img = doc.images?.[0];
    const fire = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        cleanup();
      }
    };
    if (img && !img.complete) {
      img.onload = fire;
      img.onerror = fire;
    } else {
      setTimeout(fire, 200);
    }
  };

  // Coerce to a printable string. An API field that comes back as an object would
  // otherwise crash the whole render ("Objects are not valid as a React child").
  const asText = (v) =>
    v === null || v === undefined || typeof v === "object" ? "" : String(v);

  const Row = ({ label, value }) => {
    const text = asText(value);
    return text ? (
      <div style={{ display: "flex", fontSize: 12, marginBottom: 3 }}>
        <span style={{ width: 86, color: "#5f6f7a", fontWeight: 600 }}>{label}</span>
        <span style={{ color: "#0b3a4a", fontWeight: 600 }}>: {text}</span>
      </div>
    ) : null;
  };

  const FIELD_LABELS = {
    name: t("Name"),
    uhid: t("UHID"),
    ageGender: t("Age / Gender"),
    contact: t("Contact No"),
    address: t("Address"),
    cardName: t("Card Name"),
    cardNo: t("Membership Card No"),
    validity: t("Validity"),
  };

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      modalWidth="60vw"
      Header={t("Membership Card")}
      footer={<></>}
    >
      <CardErrorBoundary fallback={t("Unable to display the membership card.")}>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", padding: "6px 2px" }}>
        {/* ── Card preview ─────────────────────────────────────────── */}
        <div style={{ flex: "1 1 360px", display: "flex", justifyContent: "center" }}>
          <div
            ref={cardRef}
            style={{
              width: 420,
              // Size to content; without this the card is a flex item that
              // stretches to the taller "Select Fields" column, leaving a large
              // blank footer that html2canvas then bakes into the PNG.
              alignSelf: "flex-start",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid #cfe3e6",
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              background: "#fff",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg,#0b6f7a 0%,#1a9aa8 100%)",
                color: "#fff",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
                  {asText(hospitalName) || t("Membership Card")}
                </div>
                <div style={{ fontSize: 10.5, opacity: 0.9 }}>{t("Membership Card")}</div>
              </div>
              {fields.cardName && asText(cardName) ? (
                <span
                  style={{
                    background: "rgba(255,255,255,0.22)",
                    padding: "3px 11px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {asText(cardName)}
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 12, padding: "14px 16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {fields.name && <Row label={t("Name")} value={patient?.PatientName} />}
                {fields.uhid && <Row label={t("UHID")} value={patient?.MRNo || uhid} />}
                {fields.cardNo && <Row label={t("Card No")} value={memberCardNo} />}
                {fields.ageGender && <Row label={t("Age/Gender")} value={patient?.AgeGender} />}
                {fields.contact && <Row label={t("Contact")} value={patient?.ContactNo} />}
                {fields.address && <Row label={t("Address")} value={patient?.House_No} />}
              </div>
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ background: "#fff", padding: 4, border: "1px solid #e2eaec", borderRadius: 8 }}>
                  <QRCode value={qrValue || " "} size={92} />
                </div>
                <div style={{ fontSize: 9, color: "#7a8a92", marginTop: 4 }}>{t("Scan for details")}</div>
              </div>
            </div>

            {(() => {
              const showValidity =
                fields.validity && (validityDays || validityDays === 0);
              const footerMemberNo = fields.cardNo ? asText(memberCardNo) : "";
              if (!showValidity && !footerMemberNo) return null;
              return (
                <div
                  style={{
                    borderTop: "1px solid #eef4f5",
                    padding: "8px 16px",
                    fontSize: 11.5,
                    color: "#5f6f7a",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span>
                    {showValidity ? (
                      <>
                        {t("Validity")}:{" "}
                        <b style={{ color: "#0b3a4a" }}>
                          {asText(validityDays)} {t("Days")}
                        </b>
                      </>
                    ) : null}
                  </span>
                  <span style={{ color: "#5f6f7a", whiteSpace: "nowrap" }}>
                    {footerMemberNo ? (
                      <>
                        {t("Member No")}:{" "}
                        <b style={{ color: "#0b3a4a" }}>{footerMemberNo}</b>
                      </>
                    ) : (
                      <span style={{ color: "#9aa9b1" }}>
                        {asText(patient?.MRNo || uhid)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Field selection + actions ────────────────────────────── */}
        <div style={{ flex: "0 0 230px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#343a40", marginBottom: 8 }}>
            {t("Select Fields")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {Object.keys(fields).map((k) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#495057", cursor: "pointer" }}>
                <input type="checkbox" checked={fields[k]} onChange={() => toggle(k)} />
                {FIELD_LABELS[k]}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary w-100 mb-2"
            onClick={handleDownloadPng}
            disabled={busy || !patient}
          >
            <i className="fa fa-download mr-1" />{" "}
            {busy ? t("Please wait...") : t("Download PNG")}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary w-100 mb-2"
            onClick={handlePrint}
            disabled={busy || !patient}
          >
            <i className="fa fa-print mr-1" /> {t("Print")}
          </button>
          {!patient && (
            <div style={{ fontSize: 11, color: "#adb5bd", textAlign: "center" }}>
              {t("Loading patient details...")}
            </div>
          )}
        </div>
      </div>
      </CardErrorBoundary>
    </Modal>
  );
}

export default MembershipCardModal;
