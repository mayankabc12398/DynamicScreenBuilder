import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Heading from "@app/components/UI/Heading";
import Loading from "@app/components/loader/Loading";
import Modal from "@app/components/modalComponent/Modal";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { notify } from "@app/utils/utils";
import {
  createGiloysPatient,
  getGiloysDoctorDashboardUrl,
  requestGiloysDoctorAccess,
  initiateGiloysDoctorLogin,
  validateGiloysSsoUser,
} from "@app/networkServices/giloysApi";
import { useTranslation } from "react-i18next";

const getPatientContext = (propsPatientDetail, location) => {
  const searchParams = new URLSearchParams(location?.search || "");
  const locationState = location?.state || {};
  const currentPatient =
    propsPatientDetail?.currentPatient ||
    locationState?.patientDetail?.currentPatient ||
    locationState?.currentPatient ||
    {};
  const patientRoot =
    propsPatientDetail ||
    locationState?.patientDetail ||
    locationState?.data ||
    {};

  const patientId =
    currentPatient?.PatientID ||
    currentPatient?.MRNo ||
    currentPatient?.UHID ||
    currentPatient?.UHIDNo ||
    patientRoot?.PatientID ||
    patientRoot?.MRNo ||
    patientRoot?.UHID ||
    patientRoot?.UHIDNo ||
    locationState?.PatientID ||
    locationState?.patientID ||
    locationState?.uhid ||
    searchParams.get("PatientID") ||
    searchParams.get("patientId") ||
    searchParams.get("PatientId") ||
    "";

  const patientName =
    currentPatient?.PName ||
    currentPatient?.PatientName ||
    patientRoot?.PName ||
    patientRoot?.PatientName ||
    "";

  const appId = currentPatient?.App_ID || patientRoot?.App_ID || "";

  return {
    patientId,
    patientName,
    appId,
  };
};

function RPM({ patientDetail, isPopup = false }) {
  const [t] = useTranslation();
  const location = useLocation();
  const userData = useLocalStorage("userData", "get");
  const patientContext = useMemo(
    () => getPatientContext(patientDetail, location),
    [patientDetail, location],
  );
  const patientId = patientContext?.patientId;
  const sessionKey = useMemo(
    () => `giloysLoginId:${userData?.employeeID || "default"}`,
    [userData?.employeeID],
  );

  const [iframeUrl, setIframeUrl] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [accessStage, setAccessStage] = useState("validating");
  const [statusModal, setStatusModal] = useState({
    visible: false,
    header: "Alert !!",
    message: "",
  });
  const [registerModal, setRegisterModal] = useState({
    visible: false,
    message: "",
    giloysLoginId: 0,
  });

  const showError = (message) => {
    setDashboardError(message);
    setIframeUrl("");
    notify(message, "error");
  };

  const getStoredGiloysLoginId = () => {
    const storedValue = window.sessionStorage.getItem(sessionKey);
    const numericValue = Number(storedValue);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
  };

  const setStoredGiloysLoginId = (giloysLoginId) => {
    window.sessionStorage.setItem(sessionKey, String(giloysLoginId));
  };

  const clearStoredGiloysLoginId = () => {
    window.sessionStorage.removeItem(sessionKey);
  };

  const ensureGiloysLoginId = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedGiloysLoginId = getStoredGiloysLoginId();
      if (cachedGiloysLoginId > 0) {
        return cachedGiloysLoginId;
      }
    }

    const accessResponse = await requestGiloysDoctorAccess();
    const success = accessResponse?.success ?? accessResponse?.Success;
    const data = accessResponse?.data ?? accessResponse?.Data;
    const giloysLoginId =
      data?.GiloysLoginId ||
      data?.giloysLoginId ||
      data?.giloysLoginID ||
      0;

    if (!success || !giloysLoginId) {
      const backendMessage =
        accessResponse?.message ||
        accessResponse?.Message ||
        accessResponse?.data?.message ||
        accessResponse?.statusText ||
        (accessResponse?.status
          ? `Giloys access request failed (HTTP ${accessResponse.status}).`
          : "Unable to create Giloys access request.");
      throw new Error(backendMessage);
    }

    setStoredGiloysLoginId(giloysLoginId);
    return Number(giloysLoginId);
  };

  const fetchDashboardUrl = async (giloysLoginId) => {
    const dashboardResponse = await getGiloysDoctorDashboardUrl({
      GiloysLoginId: giloysLoginId,
      PatientId: patientId,
    });

    const resolvedUrl =
      dashboardResponse?.data?.url || dashboardResponse?.data?.URL || "";

    if (!dashboardResponse?.success || !resolvedUrl) {
      throw new Error(
        dashboardResponse?.message || "Unable to load Giloys dashboard.",
      );
    }

    return resolvedUrl;
  };

  const showStatusMessage = (message, header = "Alert !!") =>
    new Promise((resolve) => {
      setStatusModal({
        visible: true,
        header,
        message,
        onClose: resolve,
      });
    });

  const askForPatientRegistration = (message, giloysLoginId) =>
    new Promise((resolve) => {
      setRegisterModal({
        visible: true,
        message,
        giloysLoginId,
        onResolve: resolve,
      });
    });

  const validatePatientRegistration = async (giloysLoginId) => {
    const validationResponse = await validateGiloysSsoUser({
      GiloysLoginId: giloysLoginId,
      PatientId: patientId,
    });

    return validationResponse;
  };

  const loadDashboard = async () => {
    if (!patientId) {
      setDashboardLoading(false);
      setDashboardError("Patient details are not available for RPM.");
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");
    setAccessStage("authorizing");

    try {
      let giloysLoginId = await ensureGiloysLoginId(false);

      try {
        const startDoctorLoginResponse =
          await initiateGiloysDoctorLogin(giloysLoginId);

        if (!startDoctorLoginResponse?.success) {
          throw new Error(
            startDoctorLoginResponse?.message ||
              startDoctorLoginResponse?.data?.response ||
              startDoctorLoginResponse?.message ||
              "Unable to start doctor login process in Giloys through API.",
          );
        }

        await showStatusMessage("RPM Access Authorization successful.");

        setAccessStage("checking-patient");
        const validationResponse = await validatePatientRegistration(giloysLoginId);

        if (!validationResponse?.success) {
          const shouldRegister = await askForPatientRegistration(
            validationResponse?.message ||
              "The selected patient is not registered with Giloys. Registration is required to proceed with RPM. Do you want to register the patient now?",
            giloysLoginId,
          );

          if (!shouldRegister) {
            throw new Error("Patient registration is required to proceed with RPM.");
          }

          setAccessStage("registering-patient");
          const createPatientResponse = await createGiloysPatient(
            giloysLoginId,
            patientId,
          );

          if (!createPatientResponse?.success) {
            throw new Error(
              createPatientResponse?.message ||
                createPatientResponse?.data?.response ||
                createPatientResponse?.message ||
                "Unable to register patient with Giloys.",
            );
          }

          await showStatusMessage(
            createPatientResponse?.message ||
              createPatientResponse?.data?.response ||
              "Patient registered successfully with Giloys.",
          );
        }

        setAccessStage("opening-rpm");
        const resolvedUrl = await fetchDashboardUrl(giloysLoginId);
        setIframeUrl(resolvedUrl);
      } catch (dashboardError) {
        clearStoredGiloysLoginId();
        giloysLoginId = await ensureGiloysLoginId(true);
        setAccessStage("authorizing");

        const startDoctorLoginResponse =
          await initiateGiloysDoctorLogin(giloysLoginId);

        if (!startDoctorLoginResponse?.success) {
          throw new Error(
            startDoctorLoginResponse?.message ||
              startDoctorLoginResponse?.data?.response ||
              startDoctorLoginResponse?.message ||
              "Unable to start doctor login process in Giloys through API.",
          );
        }

        await showStatusMessage("RPM Access Authorization successful.");

        setAccessStage("checking-patient");
        const validationResponse = await validatePatientRegistration(giloysLoginId);

        if (!validationResponse?.success) {
          const shouldRegister = await askForPatientRegistration(
            validationResponse?.message ||
              "The selected patient is not registered with Giloys. Registration is required to proceed with RPM. Do you want to register the patient now?",
            giloysLoginId,
          );

          if (!shouldRegister) {
            throw new Error("Patient registration is required to proceed with RPM.");
          }

          setAccessStage("registering-patient");
          const createPatientResponse = await createGiloysPatient(
            giloysLoginId,
            patientId,
          );

          if (!createPatientResponse?.success) {
            throw new Error(
              createPatientResponse?.message ||
                createPatientResponse?.data?.response ||
                createPatientResponse?.message ||
                "Unable to register patient with Giloys.",
            );
          }

          await showStatusMessage(
            createPatientResponse?.message ||
              createPatientResponse?.data?.response ||
              "Patient registered successfully with Giloys.",
          );
        }

        setAccessStage("opening-rpm");
        const resolvedUrl = await fetchDashboardUrl(giloysLoginId);
        setIframeUrl(resolvedUrl);
      }
    } catch (error) {
      showError(error?.message || "Unable to load Giloys RPM.");
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [patientId, sessionKey]);

  const validatingMessage =
    accessStage === "authorizing"
      ? "Generating RPM access token and authorizing access..."
      : accessStage === "checking-patient"
        ? "Checking patient registration with Giloys..."
        : accessStage === "registering-patient"
          ? "Registering patient with RPM..."
          : "Opening RPM dashboard securely...";

  const registerFooter = (
    <div className="ftr_btn">
      <button
        type="button"
        className="text-white"
        onClick={() => {
          registerModal?.onResolve?.(true);
          setRegisterModal({
            visible: false,
            message: "",
            giloysLoginId: 0,
          });
        }}
      >
        {t("Register Patient")}
      </button>
      <button
        type="button"
        className="text-white"
        onClick={() => {
          registerModal?.onResolve?.(false);
          setRegisterModal({
            visible: false,
            message: "",
            giloysLoginId: 0,
          });
        }}
      >
        {t("Cancel")}
      </button>
    </div>
  );

  const statusFooter = (
    <div className="ftr_btn">
      <button
        type="button"
        className="text-white"
        onClick={() => {
          statusModal?.onClose?.();
          setStatusModal({
            visible: false,
            header: "Alert !!",
            message: "",
          });
        }}
      >
        {t("Ok")}
      </button>
    </div>
  );

  return (
    <>
      {!isPopup && <Heading title={t("Giloys RPM")} isBreadcrumb />}
      <div className="card">
        <div className="card-body p-0">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 px-3 py-3 border-bottom">
            <div>
              <div className="fw-semibold">{t("Remote Patient Monitoring")}</div>
              <div className="text-muted small">
                {t("Patient ID:")} {patientId || t("Not available")}
              </div>
              {!!patientContext?.patientName && (
                <div className="text-muted small">
                  {t("Patient Name:")} {patientContext.patientName}
                </div>
              )}
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={loadDashboard}
                disabled={dashboardLoading}
              >
                {dashboardLoading ? t("Loading...") : t("Reload")}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => window.open(iframeUrl, "_blank", "noopener,noreferrer")}
                disabled={!iframeUrl}
              >
                {t("Open in New Tab")}
              </button>
            </div>
          </div>

          {dashboardLoading && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                minHeight: "600px",
                background:
                  "linear-gradient(135deg, rgba(233,244,255,0.9) 0%, rgba(255,255,255,1) 50%, rgba(247,239,255,0.9) 100%)",
              }}
            >
              <div
                className="bg-white shadow-sm rounded-4 px-5 py-5 text-center"
                style={{ width: "100%", maxWidth: "540px" }}
              >
                <div
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: "92px",
                    height: "92px",
                    background:
                      "linear-gradient(135deg, #2f80ed 0%, #9b51e0 100%)",
                    color: "#fff",
                    fontSize: "42px",
                    boxShadow: "0 12px 30px rgba(101, 85, 214, 0.25)",
                  }}
                >
                  <i className="fa fa-shield" />
                </div>
                <h2 className="mb-3" style={{ fontFamily: "Georgia, serif" }}>
                  {t("Validating Access")}
                </h2>
                <p className="text-muted mb-4">{validatingMessage}</p>
                <div className="d-flex justify-content-center align-items-center gap-2 mb-4">
                  <span className="spinner-grow spinner-grow-sm text-primary" />
                  <span className="spinner-grow spinner-grow-sm text-info" />
                  <span className="spinner-grow spinner-grow-sm text-secondary" />
                </div>
                <div className="border-top pt-4 text-muted">
                  <i className="fa fa-lock me-2" />
                  {t("Secure Connection")}
                </div>
              </div>
            </div>
          )}

          {!dashboardLoading && dashboardError && (
            <div className="p-4">
              <div className="alert alert-danger mb-0" role="alert">
                {dashboardError}
              </div>
            </div>
          )}

          {!dashboardLoading && !dashboardError && iframeUrl && (
            <div style={{ height: "calc(100vh - 245px)", minHeight: "600px" }}>
              <iframe
                title={t("Giloys RPM")}
                src={iframeUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  background: "#fff",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {statusModal?.visible && (
        <Modal
          visible={statusModal.visible}
          setVisible={() => {
            statusModal?.onClose?.();
            setStatusModal({
              visible: false,
              header: "Alert !!",
              message: "",
            });
          }}
          modalWidth="28vw"
          Header={statusModal.header}
          footer={statusFooter}
        >
          <div className="text-center fw-bold fs-4 px-3 py-2">
            {statusModal.message}
          </div>
        </Modal>
      )}

      {registerModal?.visible && (
        <Modal
          visible={registerModal.visible}
          setVisible={() => {
            registerModal?.onResolve?.(false);
            setRegisterModal({
              visible: false,
              message: "",
              giloysLoginId: 0,
            });
          }}
          modalWidth="52vw"
          Header={t("Confirmation !!")}
          footer={registerFooter}
        >
          <div className="text-center fw-bold fs-3 px-4 py-2">
            {registerModal.message}
          </div>
        </Modal>
      )}
    </>
  );
}

export default RPM;
