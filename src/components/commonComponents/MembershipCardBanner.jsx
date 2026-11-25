import React from "react";
import i18next from "i18next";
const t = (key, options) => i18next.t(key, options);

// Small presentational banner that shows the patient's active membership card
// (name + validity). It renders nothing when the patient has no applicable
// membership card for the current context.
//
// `cardInfo` is the first row of the GetPatientMembershipDetails response list
// (shape: { card_name, ValidityDays, ... }). Pass `onClick` to make it
// clickable (e.g. to print the card); when omitted the banner is informational.
function MembershipCardBanner({
  cardInfo,
  onClick,
  respclass = "col-xl-3 col-md-4 col-sm-6 col-12",
}) {
  if (!cardInfo) return null;

  return (
    <div className={respclass}>
      <div
        onClick={onClick}
        title={onClick ? t("Print Membership Card") : undefined}
        className="membership-blink"
        style={{
          backgroundColor: "#e0f2f1",
          color: "#004d40",
          padding: "4px 6px",
          borderRadius: "4px",
          border: "1px solid #b2dfdb",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          justifyContent: "space-between",
          cursor: onClick ? "pointer" : "default",
          width: "100%",
        }}
      >
        <span>
          <i className="fa fa-id-card-o mr-1" aria-hidden="true"></i>
          {t("Membershipcard")}: <strong>{cardInfo?.card_name || ""}</strong>
        </span>
        <span>
          <i className="fa fa-calendar-check-o mr-1" aria-hidden="true"></i>
          {t("Validity")}: <strong>{cardInfo?.ValidityDays || ""} {t("Days")}</strong>
        </span>
      </div>
    </div>
  );
}

export default MembershipCardBanner;
