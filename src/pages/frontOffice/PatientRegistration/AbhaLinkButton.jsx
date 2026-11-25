import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { notify } from "../../../utils/utils";
import { abhaEncrypt } from "../../../utils/abhaCrypto";
import abhaLogo from "../../../assets/image/abha-logo.svg";

// ItdoseAbha portal landing page. It mints the portal's ASP.NET session from the
// POSTed (encrypted) fields, then redirects to AbhaRegistration.aspx. We POST to it
// straight from the browser (no backend hop) — abhaEncrypt() produces values its
// Common.Decrypt can read.
//
// The portal is loaded TOP-LEVEL in the popup (not in an iframe): it sends
// X-Frame-Options, so framing it gives "refused to connect", and framing an http
// portal inside the https app would also be blocked as mixed content. A top-level
// popup navigation is subject to neither restriction.
//
// The full portal link comes from fin_global_resources "ABHAPortalURL" (Value), used
// as-is - nothing about the portal address is hard-coded here.

const POPUP_NAME = "AbhaRegistrationPopup";

export default function AbhaLinkButton({ isDisabled = false }) {
  const [t] = useTranslation();
  const userData = useLocalStorage("userData", "get");

  // Feature flag: only show ABHA when the global resource "ABHAIntegration" == "1".
  // Resources are loaded app-wide via GetGlobalResources() in RenderRoute.
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const abhaResource = Array.isArray(GetGlobalResources)
    ? GetGlobalResources.find((item) => item?.Name === "ABHAIntegration")
    : null;
  const isAbhaEnabled =
    abhaResource?.Value === "1" || abhaResource?.value === "1";
  const portalResource = Array.isArray(GetGlobalResources)
    ? GetGlobalResources.find((item) => item?.Name === "ABHAPortalURL")
    : null;
  const abhaPortalUrl = String(
    portalResource?.Value ?? portalResource?.value ?? "",
  ).trim();
  // Encryption key shared with the portal's Common.cs - only from fin_global_resources
  // "ABHAEncryptionKey" (not kept in code).
  const keyResource = Array.isArray(GetGlobalResources)
    ? GetGlobalResources.find((item) => item?.Name === "ABHAEncryptionKey")
    : null;
  const abhaKey = String(keyResource?.Value ?? keyResource?.value ?? "").trim();

  const openAbhaPortal = async () => {
    if (!userData?.employeeID) {
      notify(t("Unable to read logged-in user. Please login again."), "error");
      return;
    }
    if (!abhaPortalUrl) {
      notify(
        "ABHA portal URL is not configured (fin_global_resources: ABHAPortalURL).",
        "error",
      );
      return;
    }
    if (!abhaKey) {
      notify(
        "ABHA encryption key is not configured (fin_global_resources: ABHAEncryptionKey).",
        "error",
      );
      return;
    }

    // Field set must match Design/Default.aspx exactly (same keys it Decrypts), sourced
    // from the logged-in user. Fields not held on the frontend are sent empty — the
    // portal tolerates "" (it skips Decrypt for those).
    const fields = {
      Centre: userData?.centreID ?? userData?.defaultCentre ?? "",
      LoginType: userData?.roleName ?? "",
      UserName: userData?.userName ?? "",
      ID: userData?.employeeID ?? "",
      LoginName: userData?.userName ?? userData?.empName ?? "",
      RoleID: userData?.defaultRole ?? "",
      CentreName: userData?.centreName ?? userData?.CentreName ?? "",
      CentreType: "",
      IsInvoice: "",
      PaytmMid: "",
      PaytmGuid: "",
      PaytmKey: "",
      AccessStoreLocation: "",
      AccessDepartment: "",
      UniqueKey: "",
      OnlinePanelID: "",
    };

    // Centered popup, opened synchronously inside the click handler so it is not
    // treated as a pop-up blocker violation while we await encryption.
    const width = Math.min(1200, window.screen.availWidth || 1200);
    const height = Math.min(800, window.screen.availHeight || 800);
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      "",
      POPUP_NAME,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`,
    );

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      notify(t("Popup blocked. Please allow popups for this site."), "error");
      return;
    }

    try {
      // Encrypt every non-empty field (empty -> "" so Default.aspx skips Decrypt).
      const encrypted = await Promise.all(
        Object.entries(fields).map(async ([key, value]) => [
          key,
          value === "" ? "" : await abhaEncrypt(String(value), abhaKey),
        ]),
      );

      // Build a hidden POST form whose target is the already-open popup window, then
      // submit it: this navigates the popup top-level to Default.aspx (mirrors the
      // portal's own PreparePOSTForm pattern).
      const form = document.createElement("form");
      form.method = "POST";
      form.action = abhaPortalUrl;
      form.target = POPUP_NAME;
      form.style.display = "none";

      encrypted.forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      popup.focus();
    } catch (error) {
      popup.close();
      notify(t("Could not open the ABHA portal. Please try again."), "error");
    }
  };

  if (!isAbhaEnabled) return null;

  return (
    <button
      type="button"
      onClick={openAbhaPortal}
      disabled={isDisabled}
      title={t("ABHA Linking")}
      className="abha-link-btn"
      style={{ opacity: isDisabled ? 0.6 : 1 }}
    >
      <img src={abhaLogo} alt="ABHA" className="abha-link-btn__img" />
      <span className="abha-link-btn__label">{t("ABHA Linking")}</span>
    </button>
  );
}
