import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  LoyaltyCoinGetSummary,
  LoyaltyCoinReleaseRedeem,
  LoyaltyCoinSendRedeemOtp,
  LoyaltyCoinVerifyRedeemOtp,
} from "../../networkServices/LoyaltyCoinApi";
import { apiField, notify } from "../../utils/utils";

const RUPEE = "₹";
const money = (v) => Number(v || 0).toFixed(2);

/**
 * The patient's loyalty coins on the OPD booking screen: shows the balance, asks whether the
 * patient wants to redeem, sends an OTP to the PATIENT's mobile, and on the right OTP hands the
 * discount (amount, type, reason, approver) to the payment panel to apply.
 *
 * It renders nothing at all unless fin_global_resources LoyaltyCoinsEnabled is on AND the
 * patient has coins (or a redemption is already applied), so a booking looks exactly as before
 * for everyone else. It never blocks the booking: every failure here only means "no coins".
 *
 * Controlled by the payment panel: `applied` is the verified redemption ({ token, coins,
 * discountAmount, billAmount }) or null, and `onApplied` receives the server's answer to apply
 * or null to take it off again.
 */
export default function LoyaltyRedeemPanel({
  patientID,
  billAmount,
  currentDiscount,
  applied,
  onApplied,
}) {
  const [t] = useTranslation();
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const flagOn =
    Array.isArray(GetGlobalResources) &&
    ["1", "yes", "y", "true"].includes(
      String(
        GetGlobalResources.find((r) => r?.Name === "LoyaltyCoinsEnabled")?.Value ?? "",
      )
        .trim()
        .toLowerCase(),
    );

  const [summary, setSummary] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const bill = Number(billAmount) || 0;
  const appliedRef = useRef(applied);
  appliedRef.current = applied;

  // Balance and proposal for the bill on screen. Skipped while a redemption is applied (the
  // numbers it was verified against must not move under it).
  useEffect(() => {
    if (!flagOn || !patientID || bill <= 0 || appliedRef.current) {
      if (!appliedRef.current) setSummary(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await LoyaltyCoinGetSummary(patientID, bill);
      if (cancelled) return;
      setSummary(res?.success && res?.data?.enabled ? res.data : null);
      setOtpSent(false);
      setOtp("");
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [flagOn, patientID, bill]);

  // An applied redemption is only valid for the exact bill and discount it was verified for.
  // If either moves (an item added, a discount typed) the coins are given back.
  useEffect(() => {
    if (!applied) return;
    const billMoved = Math.abs(bill - Number(applied.billAmount)) > 0.005;
    const discountMoved =
      Math.abs(Number(currentDiscount || 0) - Number(applied.discountAmount)) > 0.005;
    if (billMoved || discountMoved) {
      LoyaltyCoinReleaseRedeem(applied.token);
      onApplied(null);
      notify(t("Bill or discount changed - loyalty coin redemption was cancelled"), "warn");
    }
  }, [applied, bill, currentDiscount]);

  if (!flagOn || !patientID) return null;

  if (applied) {
    return (
      <div className="lcr lcr--applied">
        <span className="lcr__coins">
          {t("Loyalty coins redeemed")}: {applied.coins} = {RUPEE}
          {money(applied.discountAmount)}
        </span>
        <button
          type="button"
          className="button"
          onClick={() => {
            LoyaltyCoinReleaseRedeem(applied.token);
            onApplied(null);
          }}
        >
          {t("Remove")}
        </button>
      </div>
    );
  }

  if (!summary || Number(summary.balance) <= 0) return null;

  const otherDiscount = Number(currentDiscount || 0) > 0;

  const sendOtp = async () => {
    setBusy(true);
    try {
      const res = await LoyaltyCoinSendRedeemOtp({ patientID, billAmount: bill });
      if (res?.success) {
        setOtpSent(true);
        setOtp("");
        const echoed = apiField(res.data, "otp");
        notify(
          echoed
            ? `${res.message} (test OTP ${echoed})`
            : `${res.message} (${apiField(res.data, "mobile")})`,
          "success",
        );
      } else {
        notify(res?.message || t("Could not send the OTP"), "error");
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value) => {
    setBusy(true);
    try {
      const res = await LoyaltyCoinVerifyRedeemOtp({
        patientID,
        billAmount: bill,
        otp: value,
      });
      if (res?.success) {
        const d = res.data || {};
        onApplied({
          token: apiField(d, "token"),
          coins: Number(apiField(d, "coins")),
          discountAmount: Number(apiField(d, "discountAmount")),
          discountType: apiField(d, "discountType"),
          discountReason: apiField(d, "discountReason"),
          approverID: apiField(d, "approverID"),
          approverName: apiField(d, "approverName"),
          billAmount: bill,
        });
        notify(res.message, "success");
      } else {
        notify(res?.message || t("Invalid OTP"), "error");
        setOtp("");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lcr">
      <span className="lcr__coins">
        {t("Loyalty coins")}: {summary.balance}
      </span>
      {summary.eligible ? (
        <>
          <span>
            {t("Redeem")} {summary.coins} {t("coins for")} {RUPEE}
            {money(summary.discountAmount)}?
          </span>
          {otherDiscount ? (
            <span className="lcr__msg">
              {t("Remove the existing discount to redeem coins on this bill")}
            </span>
          ) : !otpSent ? (
            <button type="button" className="button" disabled={busy} onClick={sendOtp}>
              {t("Send OTP to patient")}
            </button>
          ) : (
            <>
              <input
                className="form-control"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="------"
                value={otp}
                disabled={busy}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(v);
                  if (v.length === 6) verify(v);
                }}
              />
              <button type="button" className="button" disabled={busy} onClick={sendOtp}>
                {t("Resend")}
              </button>
            </>
          )}
        </>
      ) : (
        <span className="lcr__msg">{summary.message}</span>
      )}
    </div>
  );
}
