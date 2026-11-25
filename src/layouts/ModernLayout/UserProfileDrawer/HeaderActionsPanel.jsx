import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import RoleChangeModal from "@app/layouts/header/role-change-modal/RoleChangeModal";
import SpeechToTextWithSpeechOutput from "@app/components/SpeechToTextWithSpeechOutput";

import { logoutAction } from "@app/store/reducers/AuthSlice/logoutSlice";
import {
  GetBindMenu,
  GetRoleListByEmployeeIDAndCentreID,
  getNotification,
  getEmployeeWise,
} from "@app/store/reducers/common/CommonExportFunction";
import {
  MasterPageSetDefaultRole,
  updateClaims,
  DoctorGoogleConnectAPI,
} from "@app/networkServices/HeaderApi";
import { EDPEmailSetUpConnectWithUs } from "@app/networkServices/EDP/govindedp";
import { GmailUnlinkGoogle } from "@app/networkServices/opdserviceAPI";
import {
  GetLangaugeAPI,
  GetLangaugeListAPI,
  changeLanguageAPI,
} from "@app/store/reducers/dashboardSlice/CommonFunction";
import i18n from "@app/utils/i18n";

import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { broadcastSessionChange } from "@app/utils/tabSync";
import { toggleFullScreen } from "@app/utils/helpers";
import { notify } from "@app/utils/utils";
import LangPicker from "./LangPicker";
import CentrePicker from "./CentrePicker";
import ProfilePanel from "./ProfilePanel";
import Modal from "@app/components/modalComponent/Modal";
import FullTextEditor from "@app/utils/TextEditor";
import Input from "@app/components/formComponent/Input";
import { useTheme } from "@app/hooks/useTheme";

export default function HeaderActionsPanel({ onClose }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [t] = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const localData = useLocalStorage("userData", "get") || {};
  const { GetRoleList, GetEmployeeWiseCenter } = useSelector(
    (s) => s?.CommonSlice || {}
  );
   const themeClass = useLocalStorage("theme", "get");

  const [openRole, setOpenRole] = useState(false);
  const [emailModal, setEmailModal] = useState({ show: false });
  const [gDisconnectModal, setGDisconnectModal] = useState({ show: false });
  const [emailSubject, setEmailSubject] = useState("");
  const [editorValue, setEditorValue] = useState(false);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const apiResp = await GetLangaugeListAPI();
        setLanguages(apiResp?.success ? apiResp.data || [] : []);
      } catch {
        setLanguages([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadTranslations = async (lng, lngkey) => {
      if (!lng || !lngkey) return;
      try {
        const apiResp = await GetLangaugeAPI(lngkey);
        if (apiResp?.success) {
          const translation = {};
          apiResp.data?.forEach((val) => {
            translation[val["FIELDNAME"]] = val["DISPLAYNAME"];
          });
          i18n.addResourceBundle(lng, "translation", translation, true, true);
          i18n.changeLanguage(lng);
        }
      } catch (err) {
        console.error(`Error fetching translations for ${lng}:`, err);
      }
    };
    loadTranslations(localData?.empLanguageCode, localData?.empLanguage);
  }, [localData?.empLanguageCode, localData?.empLanguage]);

  useEffect(() => {
    if (localData?.employeeID) {
      dispatch(getEmployeeWise({ employeeID: localData.employeeID }));
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      getNotification({
        RoleID: localData?.defaultRole,
        EmployeeID: localData?.employeeID,
        CentreID: localData?.defaultCentre,
      })
    );
  }, []);

  const handleUpdateClaims = useCallback(
    async (roleID, centreID) => {
      const data = await updateClaims(String(roleID), String(centreID));
      if (data?.success) {
        const {
          centreCurrency,
          centreID: cID,
          centreName,
          defaultCentre,
          roleName,
          defaultRole,
          isStore,
        } = data?.data?.loginResponse;
        await useLocalStorage("userData", "set", {
          ...localData,
          centreCurrency,
          centreID: cID,
          centreName,
          defaultCentre,
          roleName,
          defaultRole,
          isStore,
        });
        useLocalStorage("token", "set", data?.data?.token);
      }
      return data;
    },
    [localData]
  );

  const handleChangeRole = useCallback(
    async (e) => {
      const { value } = e;
      try {
        const apiResp = await handleUpdateClaims(value, localData?.defaultCentre);
        await dispatch(GetBindMenu({ RoleID: value }));
        useLocalStorage("userData", "set", {
          ...localData,
          defaultRole: value,
          roleName: apiResp?.data?.loginResponse?.roleName,
        });
        if (apiResp?.success) broadcastSessionChange("ROLE_CHANGED");
        navigate("/dashboard", { state: { data: "", actualUrl: "/dashboard" } });
      } catch (err) {
        console.error("Error occurred:", err);
      }
    },
    [handleUpdateClaims, localData, dispatch, navigate]
  );

  const handleRoleSelect = (role) => {
    handleChangeRole({ value: role?.roleID });
    setOpenRole(false);
  };

  const handleChangeCentre = useCallback(
    async (e) => {
      const { value } = e;
      await useLocalStorage("userData", "set", {
        ...localData,
        defaultCentre: value,
      });
      const respData = await dispatch(
        GetRoleListByEmployeeIDAndCentreID({
          employeeID: localData?.employeeID,
          centreID: value,
        })
      );
      if (
        respData?.payload?.success &&
        respData?.payload?.data?.length > 0
      ) {
        const claimResp = await handleUpdateClaims(respData.payload.data[0]?.roleID, value);
        if (claimResp?.success) broadcastSessionChange("CENTRE_CHANGED");
      }
    },
    [dispatch, handleUpdateClaims, localData]
  );

  const handleDefaultRole = async () => {
    try {
      const data = await MasterPageSetDefaultRole({
        roleID: Number(localData?.defaultRole),
      });
      notify(data?.message, data?.success ? "success" : "error");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const data = await DoctorGoogleConnectAPI({
        DoctorId: localData?.employeeID,
        Date: "",
      });
      if (data?.success && data?.data) {
        const popup = window.open(
          data.data,
          "Google Login",
          "width=600,height=700"
        );
        const startTime = Date.now();
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            if ((Date.now() - startTime) / 1000 < 7) {
              notify("Google authentication cancelled", "error");
            }
          }
        }, 500);
      } else {
        notify(data?.message || "Google connection failed", "error");
      }
    } catch (e) {
      notify("Something went wrong", "error");
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      const res = await GmailUnlinkGoogle({ EmployeeId: localData?.employeeID });
      if (res?.success) {
        useLocalStorage("userData", "set", {
          ...localData,
          isConnectedWithGoogle: 0,
        });
        setGDisconnectModal({ show: false });
        notify(res?.message, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleConnection = () => {
    if (localData?.isConnectedWithGoogle == 1) {
      setGDisconnectModal({ show: true });
    } else {
      handleGoogleConnect();
    }
  };

  const handleSendEmail = async () => {
    try {
      if (!emailSubject) {
        notify("Please enter subject", "error");
        return;
      }
      const res = await EDPEmailSetUpConnectWithUs({
        emailSubject,
        emailBody: editorValue,
      });
      if (res?.success) {
        notify(res?.message, "success");
        setEmailModal({ show: false });
        setEmailSubject("");
        setEditorValue(false);
      } else {
        notify(res?.message, "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const logOut = () => {
    dispatch(
      logoutAction({
        roleID: localData?.defaultRole,
        employeeID: localData?.employeeID,
        centreID: localData?.centreID,
      })
    );
    if (onClose) onClose();
  };

  const goDashboard = () => {
    navigate("/dashboard", {
      state: { data: "", actualUrl: "/dashboard" },
    });
    if (onClose) onClose();
  };

  const isGoogle = localData?.isConnectedWithGoogle == 1;

  return (
    <>
      <Section c={c} title="Quick actions">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 6,
          }}
        >
          <ActionTile c={c} icon="fa fa-arrows-alt" label="Fullscreen" onClick={toggleFullScreen} iconColor={"#8a5e10"} bgColor={"#fff8e6"}/>
          <ActionTile c={c} icon="fa fa-user-plus" label="Email" onClick={() => setEmailModal({ show: true })} iconColor={"#d55f00" } bgColor={"#fff1e0"}/>
          <ActionTile
            c={c}
            icon="fab fa-google"
            iconColor={"#FF4D8D"} bgColor={"#fadee2"}
            label={isGoogle ? "Google" : "Google"}
            onClick={handleGoogleConnection}
          />
          <ActionTile c={c} icon="fa fa-user-cog" label="Change Role" onClick={() => setOpenRole(true)} iconColor={ "#03a0e7"} bgColor={"#7ea0ea33"}/>
          <ActionTile c={c} icon="fa fa-bolt" label="Default Role" onClick={handleDefaultRole} iconColor={ "#b0308a"} bgColor={"#fdeff6"}/>
        </div>
      </Section>

      <Section c={c} title="Centre">
        <CentrePicker
          centres={GetEmployeeWiseCenter || []}
          value={localData?.defaultCentre}
          onChange={handleChangeCentre}
        />
      </Section>

      <Section c={c} title="Language & Voice">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
          <LangPicker languages={languages} />
          <div
            title="Voice"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${c.border}`,
              background: c.panel,
              color: c.text,
              cursor: "pointer",
            }}
          >
            <SpeechToTextWithSpeechOutput />
          </div>
        </div>
      </Section>

      <ProfilePanel onClose={onClose} />

   <div className={themeClass}>
      <button
        type="button"
        onClick={logOut}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 16px",
          borderRadius: 10,
          width:"100%",          // border: `1px solid ${c.danger}40`,
          // background: c.danger + "12",
          // color: c.danger,
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow:"none"
        }}
        className="background-theme-colornew text-theme-colornew border-colornew"
      >
        <i className="fas fa-sign-out-alt" />
        Logout
      </button>
      </div>

      {createPortal(
        <>
          <RoleChangeModal
            show={openRole}
            GetRoleList={GetRoleList}
            handleChangeRole={handleChangeRole}
            onClose={() => setOpenRole(false)}
            onRoleSelect={handleRoleSelect}
          />

          <Modal
            modalHandlerState={emailModal}
            onClose={() => setEmailModal({ show: false })}
            handleSubmit={handleSendEmail}
            header={t("Connect With us on Email")}
          >
            <div className="p-3" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input
                type="text"
                placeholder={t("Subject")}
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                name="emailSubject"
              />
              <FullTextEditor value={editorValue} onChange={setEditorValue} />
            </div>
          </Modal>

          <Modal
            modalHandlerState={gDisconnectModal}
            onClose={() => setGDisconnectModal({ show: false })}
            handleSubmit={handleDisconnectGoogle}
            header={t("Disconnect Google Calendar")}
          >
            <div className="p-3" style={{ fontSize: 13 }}>
              {t("Are you sure you want to disconnect your Google Calendar?")}
            </div>
          </Modal>
        </>,
        document.body
      )}
    </>
  );
}

function Section({ c, title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          color: c.textMuted,
          textTransform: "uppercase",
          letterSpacing: ".5px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ActionTile({ c, icon, label, onClick, iconColor, bgColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "8px 4px",
        borderRadius: 8,
        border: `1px solid ${c.border}`,
        background: c.panel,
        color: c.text,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 10.5,
        fontWeight: 600,
        transition: "background .15s, border-color .15s",
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = c.accentSoft;
        e.currentTarget.style.borderColor = c.accent + "55";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = c.panel;
        e.currentTarget.style.borderColor = c.border;
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: bgColor,
          color: iconColor || c.accent,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <i className={icon} style={{ fontSize: 12 }} />
      </span>
      <span
        style={{
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}

