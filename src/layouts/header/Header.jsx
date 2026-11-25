import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebarMenu } from "@app/store/reducers/ui";
import NotificationsDropdown from "@app/layouts/header/notifications-dropdown/NotificationsDropdown";
import WhatsNewBell from "@app/layouts/header/whats-new-dropdown/WhatsNewBell";
import LanguagesDropdown from "@app/layouts/header/languages-dropdown/LanguagesDropdown";
import Themedropdown from "@app/layouts/header/Theme-dropdown";
import { toggleFullScreen } from "../../utils/helpers";
import SubMenuDropdown from "@app/layouts/header/submenu-dropdown/SubMenuDropdown";
import ModernModeButton from "../../components/ModernModeButton";
import OverlayDropdown from "./overlay-dropdown";
import i18next from "i18next";
import i18n from "i18next";
import { useLocation, useNavigate } from "react-router-dom";
import UserDropdown from "./user-dropdown/UserDropdown";
import ReactSelectHead from "../../components/formComponent/ReactSelectHead";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import {
  GetBindMenu,
  GetRoleListByEmployeeIDAndCentreID,
  getBindPanelList,
  getEmployeeWise,
  getNotification,
} from "../../store/reducers/common/CommonExportFunction";
import { logoutAction } from "../../store/reducers/AuthSlice/logoutSlice";
import {
  MasterPageSetDefaultRole,
  updateClaims,
  DoctorGoogleConnectAPI,
} from "../../networkServices/HeaderApi";
import logoitdose from "../../assets/image/logoitdose.png";
import logo from "../../assets/image/logo.png";
import { getBindCategory } from "../../store/reducers/TokenManagementSlice/CommonExportFunction";
import SpeechToTextWithSpeechOutput from "../../components/SpeechToTextWithSpeechOutput";
import {
  GetLangaugeAPI,
  GetLangaugeListAPI,
} from "../../store/reducers/dashboardSlice/CommonFunction";
import Input from "../../components/formComponent/Input";
import { notify } from "../../utils/utils";
import { Tooltip } from "primereact/tooltip";
import RoleChangeModal from "./role-change-modal/RoleChangeModal";
import { HomePlusIcon } from "../../components/SvgIcons";
import { Zap } from "../../components/SvgIcons";
import { isDisabled } from "@testing-library/user-event/dist/cjs/utils/index.js";
import HandleFontSize from "./HandleFontSize/HandleFontSize";
import LayoutSwitch from "../modern/LayoutSwitch";
import Modal from "../../components/modalComponent/Modal";
import FullTextEditor from "../../utils/TextEditor";
import { EDPEmailSetUpConnectWithUs } from "../../networkServices/EDP/govindedp";
import { GmailUnlinkGoogle } from "../../networkServices/opdserviceAPI";
import "./header-settings-panel.css";
import { GetAISettingsAPI } from "../../networkServices/aiSettingsApi";
import { broadcastSessionChange } from "../../utils/tabSync";
import { confirmLeave } from "../../utils/leaveGuard";
const Header = React.memo(() => {
  const localData = useLocalStorage("userData", "get"); // get Data from localStorage
  const [t] = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languages, setLanguages] = useState([]);
  const navbarVariant = useSelector((state) => state.ui.navbarVariant);
  const headerBorder = useSelector((state) => state.ui.headerBorder);
  const screenSize = useSelector((state) => state.ui.screenSize);
  const layoutMode = useSelector((state) => state.ui.layoutMode);
  const [role, setRole] = useState();
  const [openRole, setOpenRole] = useState(false);
  // In Modern layout the action icons are portaled into the Quick Actions
  // popover (#modern-action-slot) and the profile into a sidebar slot
  // (#modern-profile-slot). In Classic there are no slots → all render inline.
  const [actionsSlot, setActionsSlot] = useState(null);
  const [topActionsSlot, setTopActionsSlot] = useState(null);
  const [profileSlot, setProfileSlot] = useState(null);
  const [selectsSlot, setSelectsSlot] = useState(null);

  useEffect(() => {
    if (layoutMode === "modern") {
      setActionsSlot(document.getElementById("modern-action-slot"));
      setTopActionsSlot(document.getElementById("modern-topactions-slot"));
      setProfileSlot(document.getElementById("modern-profile-slot"));
      setSelectsSlot(document.getElementById("modern-selects-slot"));
    } else {
      setActionsSlot(null);
      setTopActionsSlot(null);
      setProfileSlot(null);
      setSelectsSlot(null);
    }
  }, [layoutMode, screenSize]);

  // Classic-view Settings gear: reveals the secondary action icons on
  // hover/focus. 200ms close delay so moving between gear/panel/nested
  // dropdowns doesn't flicker. Modern is unaffected (icons stay in the
  // Quick Actions slot there).
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsCloseTimer = useRef(null);

  const openSettingsPanel = () => {
    if (settingsCloseTimer.current) {
      clearTimeout(settingsCloseTimer.current);
      settingsCloseTimer.current = null;
    }
    setSettingsOpen(true);
  };

  const scheduleSettingsClose = () => {
    if (settingsCloseTimer.current) {
      clearTimeout(settingsCloseTimer.current);
    }
    settingsCloseTimer.current = setTimeout(() => {
      setSettingsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => clearTimeout(settingsCloseTimer.current);
  }, []);

  // AI on/off switches (set on /edp-vertex-ai-setting), loaded once here so
  // every AI feature knows whether it is on.
  useEffect(() => {
    GetAISettingsAPI();
  }, []);

  const [emailSubject, setEmailSubject] = useState("");
  const [modalHandlerState, setModalHandlerState] = useState({
    header: null,
    show: false,
    size: null,
    component: null,
    footer: null,
  });
  const [modalHandlerState2, setModalHandlerState2] = useState({
    header: null,
    show: false,
    size: null,
    component: null,
    footer: null,
  });
  const [editorValue, setEditorValue] = useState(false);
  const [Editable, setEditable] = useState(false);

  const handleChangeEditor = (value) => {
    debugger;
    setEditorValue(value);
  };

  const { GetEmployeeWiseCenter, GetMenuList, GetRoleList, GetGlobalResources } = useSelector(
    (state) => state?.CommonSlice,
  );

  /* fin_global_resources -> ShowDefaultLandingPage.

     Off unless a site has asked for it, and off means the button does exactly what it
     always did: set the module, nothing about the page, and every login opens on the
     dashboard. Read off the list the app already holds, so it costs no extra call. The
     endpoint behind that list selects WHERE IsActive = 1, which is why IsActive = 0,
     Value = 0 and no row at all all leave it off.

     The login checks the same flag server-side, so switching it back off sends everybody
     to the dashboard again without anything having to be unpinned. */
  const showDefaultLandingPage = useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find((item) => item?.Name === "ShowDefaultLandingPage");
    return String(row?.Value ?? "0") === "1";
  }, [GetGlobalResources]);
  const signout = useSelector((state) => state.logoutSlice);
  const handleToggleMenuSidebar = () => {
    dispatch(toggleSidebarMenu());
  };

  const handleEmailConnectWithus = () => {
    setModalHandlerState({
      header: t("Connect With us on Email"),
      show: true,
      size: "90vw",
      buttonName: t("Send"),
      // component: <>hello</>,
      // footer: <></>,
    });
  };

  const getContainerClasses = useCallback(() => {
    let classes = `main-header navbar navbar-expand ${navbarVariant}`;
    if (headerBorder) {
      classes = `${classes} border-bottom-0`;
    }
    return classes;
  }, [navbarVariant, headerBorder]);

  /**
   * Logout function to handle user logout API Implement.
   */
  const handleRoleChangeModal = () => {
    setOpenRole(true);
  };

  const handleRoleSelect = (role) => {
    // debugger
    handleChangeRole({ value: role?.roleID });
    setOpenRole(false);
  };

  const handleSendEmail = async () => {
    debugger
    try {
      if(!emailSubject){
        notify(t("Please enter subject"), "error");
        return;
      }
      const payload = {
        emailSubject: emailSubject,
        emailBody: editorValue,
      };
      const res = await EDPEmailSetUpConnectWithUs(payload);
      if (res?.success) {
        notify(res?.message, "success");
         setModalHandlerState({
              show: false,
              component: null,
              size: null,
            })
            setEmailSubject("");
            setEditorValue(false);
            setEditable(false);
      }
      else{
        notify(res?.message, "error");
      }
    } catch (error) {}
  };

  const logOut = () => {
    dispatch(
      logoutAction({
        roleID: localData?.defaultRole,
        employeeID: localData?.employeeID,
        centreID: localData?.centreID,
      })
    );
    // localStorage.clear();
    // navigate("/login");
    // notify("Sucessfully logout", "success");
  };

  useEffect(() => {
    setRole(Number(localData?.defaultRole));


  }, [localData?.defaultRole]);

  const handleUpdateClaims = async (roleID, centreID) => {
    const data = await updateClaims(String(roleID), String(centreID));

    if (data?.success) {
      const {
        centreCurrency,
        centreID,
        centreName,
        defaultCentre,
        roleName,
        defaultRole,
        isStore,
      } = data?.data?.loginResponse;
// debugger
      await useLocalStorage("userData", "set", {
        ...localData,
        centreCurrency: centreCurrency,
        centreID: centreID,
        centreName: centreName,
        defaultCentre: defaultCentre,
        roleName: roleName,
        defaultRole: Number(defaultRole),
        isStore: isStore,
      });
      setRole(defaultRole);
      useLocalStorage("token", "set", data?.data?.token);
    }
    return data;
  };
  /* One button, both defaults: the module the header is showing and the screen that is
     open in it. The next sign-in opens straight here.

     The page is saved against the module, not against the user, so somebody holding
     pharmacy and billing lands on the right screen in each - it goes on the same f_login
     row that already holds which module they land in, written in the same statement, so
     the role can never be saved with the page left behind.

     Both halves of the route are sent. Screens are opened as
     navigate(url, { state: { actualUrl } }) and read their breadcrumb and sub-screen tabs
     off actualUrl, which is a different value from the route wherever a screen sits under
     a frame menu; the route on its own would open the screen bare.

     Pressing it on the dashboard sets the module and clears the page, because the
     dashboard is where an unset login already goes - so the same button is also how a
     landing page is undone. */
  const handleDefaultRole = async () => {
    const url = location?.pathname;
    const isDashboard = !url || url === "/dashboard";
    let payload = { roleID: Number(localData?.defaultRole) };
    // Where the site has not switched it on, the page is left out of the call entirely,
    // so the button stays what it was - the module, and only the module - and a page
    // somebody pinned while it was on is not wiped by pressing it while it is off.
    // An empty string is different from leaving it out: that is how the dashboard clears
    // a pinned page.
    if (showDefaultLandingPage) {
      payload.url = isDashboard ? "" : url;
      payload.actualUrl = isDashboard ? "" : (location?.state?.actualUrl ?? url);
    }
    try {
      const data = await MasterPageSetDefaultRole(payload);
      if (data?.success) {
        notify(data?.message, "success");
      } else {
        notify(data?.message, "error");
      }
    } catch (e) {
      console.log("Error", e);
    }
  };

  const handleDisconnectGoogle = async()=>{
    debugger
    try {
      const res = await GmailUnlinkGoogle({ EmployeeId: localData?.employeeID });
      if(res?.success){
       
        useLocalStorage("userData", "set", {...localData, isConnectedWithGoogle: 0});
        setModalHandlerState2({ show: false })
        notify(res?.message, "success");
      }
      
    } catch (error) {
      
    }
  }


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
          "width=600,height=700",
        );

        const startTime = Date.now();

        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);

            const timeSpent = (Date.now() - startTime) / 1000;

            if (timeSpent < 7) {
              // Closed very quickly → probably cancelled
              notify(t("Google authentication cancelled"), "error");
            } else {
            }
          }
        }, 500);
      } else {
        notify(data?.message || "Google connection failed", "error");
      }
    } catch (e) {
      notify(t("Something went wrong"), "error");
    }
  };

  const handleGoogleConnection = async()=>{
    
    if(localData?.isConnectedWithGoogle==1){
      // handleDisconnectGoogle();
      setModalHandlerState2({
      header: t(""),
      show: true,
      size: "35vw",
      // buttonName: t("Send"),
      // component: <>hello</>,
      footer: <></>,
    });
    }
    else{
      handleGoogleConnect();
    }

  }

  useEffect(() => {
    const receiveMessage = (event) => {
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        useLocalStorage("userData", "set", {...localData, isConnectedWithGoogle: 1});
        notify(event.data.message, "success");
      }

      if (event.data?.type === "GOOGLE_AUTH_FAILED") {
        notify(event.data.message, "error");
      }
    };

    window.addEventListener("message", receiveMessage);

    return () => {
      window.removeEventListener("message", receiveMessage);
    };
  }, []);

  const [, setRefresh] = useState(false);

  useEffect(() => {
  const update = () => setRefresh(prev => !prev);
  window.addEventListener("localStorageUpdate", update);
  return () => window.removeEventListener("localStorageUpdate", update);
}, []);


  const handleChangeCentre = async (e) => {
    const { value } = e;
    // await handleUpdateClaims(localData?.defaultRole, value);

    // window.location.reload();

    await useLocalStorage("userData", "set", {
      ...localData,
      defaultCentre: value,
    });

    window.dispatchEvent(new CustomEvent("centreChanged", { detail: value }));

    let respData = await dispatch(
      GetRoleListByEmployeeIDAndCentreID({
        employeeID: localData?.employeeID,
        centreID: value,
      })
    );
    if (respData?.payload?.success && respData?.payload?.data?.length > 0) {
      const claimResp = await handleUpdateClaims(respData?.payload?.data[0]?.roleID, value);
      if (claimResp?.success) broadcastSessionChange("CENTRE_CHANGED");
    }
    // console.log("respData", respData?.payload)
    // debugger
  };

  /**
   * Make an API request for MasterPage/EmployeeWiseCentreList.
   *
   * @param {parametre} EmployeeID - The parametre for EmployeeID from localStorage
   * @param {API Implement Name} options - API for MasterPage/EmployeeWiseCentreList.
   */
  useEffect(() => {
    if (localData?.employeeID) {
      dispatch(getEmployeeWise({ employeeID: localData?.employeeID }));
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

  // role bind
  const handleChangeRole = async (e) => {
    const { value } = e;
    try {
      const apiResp = await handleUpdateClaims(value, localData?.defaultCentre);
      await dispatch(
        GetBindMenu({
          RoleID: value,
        })
      );

      useLocalStorage("userData", "set", {
        ...localData,
        defaultRole: Number(value),
        roleName: apiResp?.data?.loginResponse?.roleName,
      });
      setRole(value);
      if (apiResp?.success) broadcastSessionChange("ROLE_CHANGED");
      // navigate("/dashboard");
       navigate("/dashboard", { state: { data: "", actualUrl: "/dashboard",} });
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  let translation = {};
  const loadTranslations = async (lng, lngkey) => {
    try {
      const apiResp = await GetLangaugeAPI(lngkey);
      if (apiResp?.success) {
        apiResp?.data?.map((val) => {
          translation[val["FIELDNAME"]] = val["DISPLAYNAME"];
        });
      }
      i18n.addResourceBundle(lng, "translation", translation, true, true);
      i18n.changeLanguage(lng);
    } catch (error) {
      console.error(`Error fetching translations for ${lng}:`, error);
    }
  };

  useEffect(() => {
    dispatch(getBindCategory());
    loadTranslations(localData?.empLanguageCode, localData?.empLanguage);
    dispatch(getBindPanelList({ PanelGroup: "ALL" }));

    const GetApplicationLanguage = async () => {
      const apiResp = await GetLangaugeListAPI();
      if (apiResp?.success) {
        // const data = apiResp?.data?.map((val) => ({
        //   key: val?.key_code,
        //   icon: val?.icon,
        //   label: val?.label,
        // }))
        setLanguages(apiResp?.data);
      } else {
        setLanguages([]);
      }
    };
    GetApplicationLanguage();
  }, []);

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (openRole) {
          setOpenRole(false);
        } else {
          handleRoleChangeModal();
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [openRole]);

  // Change-Role + Set-Default-Role. In Modern these move to the sidebar (above
  // the Search Menu box); inline in Classic.
  const topActionItems = (
    <>
      <Tooltip
        target={`#selectRole`}
        position="top"
        content={t("Select Role")}
        event="hover"
        className="ToolTipCustom"
      />
      <li className="nav-item d-none d-md-flex" id="selectRole">
        <button
          type="button"
          className="nav-link text-white"
          onClick={handleRoleChangeModal}
          style={{ cursor: "pointer", padding: "0" }}
        >
          <HomePlusIcon />
        </button>
      </li>
      <Tooltip
        target={`#isActive`}
        position="top"
        content={showDefaultLandingPage ? t("Set Default Role & Page") : t("Set Default Role")}
        event="hover"
        className="ToolTipCustom"
      />
      <li className="nav-item position-relative d-none d-md-flex px-1">
        <button
          onClick={handleDefaultRole}
          id={"isActive"}
          className="nav-link text-white"
          style={{ cursor: "pointer", padding: "0" }}
        >
          <Zap />
        </button>
      </li>
    </>
  );

  // The action-icon cluster (lives inside Quick Actions in Modern). Each icon
  // keeps its original markup/ids/handlers; they are only composed differently
  // per layout below.
  const layoutSwitchItem = (
    <li className="nav-item d-none d-md-flex align-items-center px-1">
      <LayoutSwitch variant="compact" />
    </li>
  );
  const fontSizeItem = (
    <li className="nav-item d-none d-md-flex">
      <HandleFontSize />
    </li>
  );
  const themeItem = (
    <li className="nav-item position-relative d-none d-md-flex px-1">
      <Themedropdown />
    </li>
  );
  const homeItem = (
    <li className="nav-item d-none d-md-flex px-1">
      <div type="button">
        <i
          className="fa fa-home text-white"
          aria-hidden="true"
          onClick={() => {
            if (!confirmLeave()) return;
            navigate("/dashboard", {
              state: { data: "", actualUrl: "/dashboard" },
            });
          }}
        ></i>
      </div>
    </li>
  );
  const whatsNewItem = (
    <li className="nav-item d-none d-md-flex px-1">
      <WhatsNewBell />
    </li>
  );
  const notificationsItem = (
    <li className="nav-item d-none d-md-flex px-1">
      <NotificationsDropdown />
    </li>
  );
  const overlayItem = (
    <li className="nav-item d-none d-md-flex pr-2 ">
      <OverlayDropdown />
    </li>
  );
  const fullscreenItem = (
    <li className="nav-item d-none d-md-flex px-2" title="full-screen">
      <i
        className="fa fa-arrows-alt text-white"
        aria-hidden="true"
        onClick={toggleFullScreen}
      ></i>
    </li>
  );
  const micItem = (
    <>
      <Tooltip
        target={`#mic`}
        position="top"
        content={t("Say Open 'Page Name")}
        event="hover"
        className="ToolTipCustom"
      />
      <li
        className="nav-item position-relative d-none d-md-flex px-1"
        id="mic"
      >
        <i className="text-white">
          <SpeechToTextWithSpeechOutput />
        </i>
      </li>
    </>
  );
  const languagesItem = (
    <li className="nav-item d-none d-md-flex ">
      <LanguagesDropdown languages={languages} />
    </li>
  );
  const googleItem = (
    <>
      <Tooltip
        target={`#googleConnect`}
        position="top"
        content={t(
          `${
            localData?.isConnectedWithGoogle == 1
              ? "Disconnect Google Calendar"
              : "Connect Google Calendar"
          }`,
        )}
        event="hover"
        className="ToolTipCustom"
      />
      <li className="nav-item d-none d-md-flex px-1" id="googleConnect">
        <button
          type="button"
          className="nav-link text-white"
          onClick={handleGoogleConnection}
          style={{ cursor: "pointer", padding: "0" }}
        >
          <i
            className={`fab fa-google ${
              localData?.isConnectedWithGoogle == 1
                ? "active-google"
                : "inActive-google"
            }`}
          ></i>
        </button>
      </li>
    </>
  );
  const emailItem = (
    <li className="nav-item d-none d-md-flex " id="EmailConnectWithus">
      <Tooltip
        target={`#EmailConnectWithus`}
        position="top"
        content={t("Connect With us")}
        event="hover"
        className="ToolTipCustom"
      />
      <button
        type="button"
        className="nav-link text-white"
        onClick={handleEmailConnectWithus}
        style={{ cursor: "pointer", padding: "0" }}
      >
        <i className="fa fa-user-plus"></i>
      </button>
    </li>
  );

  // Icons collapsed behind the Settings gear in Classic view.
  const settingsPanelItems = (
    <>
      {fontSizeItem}
      {themeItem}
      {whatsNewItem}
      {fullscreenItem}
      {micItem}
      {languagesItem}
      {googleItem}
      {emailItem}
    </>
  );

  // Modern: original flat order portaled into Quick Actions (unchanged).
  // Classic: secondary icons live in a hover panel behind a Settings gear.
  const actionItems = actionsSlot ? (
    <>
      {layoutSwitchItem}
      {fontSizeItem}
      {themeItem}
      {homeItem}
      {whatsNewItem}
      {notificationsItem}
      {overlayItem}
      {fullscreenItem}
      {micItem}
      {languagesItem}
      {googleItem}
      {emailItem}
    </>
  ) : (
    <>
      {homeItem}
      {notificationsItem}
      {overlayItem}
      <li
        className={`nav-item d-none d-md-flex px-1 header-settings-group ${
          settingsOpen ? "is-open" : ""
        }`}
        onMouseEnter={openSettingsPanel}
        onMouseLeave={scheduleSettingsClose}
        onFocus={openSettingsPanel}
        onBlur={scheduleSettingsClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            clearTimeout(settingsCloseTimer.current);
            setSettingsOpen(false);
          }
        }}
      >
        {/* <Tooltip
          target={`#headerSettingsToggle`}
          position="top"
          content={t("Settings")}
          event="hover"
          className="ToolTipCustom"
        /> */}
        <button
          type="button"
          id="headerSettingsToggle"
          className="nav-link text-white"
          aria-expanded={settingsOpen}
          aria-haspopup="true"
          onClick={() => setSettingsOpen((open) => !open)}
          style={{ cursor: "pointer", padding: "0" }}
        >
          <i className="fa fa-cog" aria-hidden="true"></i>
        </button>
        <ul className="navbar-nav header-settings-panel">
          {settingsPanelItems}
        </ul>
      </li>
    </>
  );

  // Profile + logout. Inline in Classic; portaled into the sidebar in Modern.
  const profileItems = (
    <>
      <li className="nav-item d-none d-md-flex">
        <button type="button" className="nav-link d-flex">
          <UserDropdown
            setDropdownOpen={setDropdownOpen}
            dropdownOpen={dropdownOpen}
          />
          <label className="control-label ml-2 d-none d-lg-block text-white">
            {localData?.empName}
          </label>
        </button>
      </li>

      <li className="nav-item position-relative d-none d-md-flex">
        <i className="fas fa-sign-out-alt text-white" onClick={logOut}></i>
      </li>
    </>
  );

  // Hospital (centre) + Role selectors. Inline in Classic; portaled into the
  // sidebar in Modern.
  const selectsItems = (
    <>
      <li className="nav-item savetheme">
        <div className=" headerboxsize">
          <ReactSelectHead
            placeholderName="Select Centre"
            dynamicOptions={GetEmployeeWiseCenter?.map((ele) => {
              return { label: ele.CentreName, value: ele.CentreID };
            })}
            searchable={true}
            value={Number(localData?.defaultCentre)}
            respclass="roll-off"
            handleChange={handleChangeCentre}
            plcN="center"
          />
        </div>
      </li>

      {["lg", "md"].includes(screenSize) && (
        <li className="nav-item savetheme">
          <div className=" headerboxsize">
            <ReactSelectHead
              placeholderName="Select Role"
              dynamicOptions={(Array.isArray(GetRoleList) ? GetRoleList : []).map((ele) => {
                return {
                  label: t(ele?.roleName),
                  value: ele?.roleID,
                };
              })}
              searchable={true}
              respclass="col-12 roll-off"
              value={role}
              handleChange={handleChangeRole}
              plcN="center"
              isDisabled={true}
            />
          </div>
        </li>
      )}
    </>
  );

  return (
    <>
      {modalHandlerState?.show && (
        <Modal
          visible={modalHandlerState?.show}
          setVisible={() =>{

            setModalHandlerState({
              show: false,
              component: null,
              size: null,
            })
            setEmailSubject("");
            setEditorValue(false);
            setEditable(false);
          }
          }
          modalWidth={modalHandlerState?.size}
          Header={modalHandlerState?.header}
          footer={modalHandlerState?.footer}
          buttonName={modalHandlerState?.buttonName}
          handleAPI={handleSendEmail}
        >
          <div className="row">
            <Input
              lable={t("Subject")}
              type="text"
              className="form-control"
              placeholder={" "}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length > 120) {
                  notify(t("Subject must be less than 120 characters"), "error");
                  return
                };
                setEmailSubject(value);
              }}
              name="emailSubject"
              value={emailSubject}
              respclass={"w-100 px-2"}
            />
            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mt-2">
              <FullTextEditor
                value={editorValue}
                // value={getTest}
                setValue={handleChangeEditor}
                EditTable={Editable}
                setEditTable={setEditable}
              />
            </div>
          </div>
        </Modal>
      )}
      {modalHandlerState2?.show && (
        <Modal
          visible={modalHandlerState2?.show}
          setVisible={() =>
            setModalHandlerState2({
              show: false,
              component: null,
              size: null,
            })
          }
          modalWidth={modalHandlerState2?.size}
          Header={modalHandlerState2?.header}
          footer={modalHandlerState2?.footer}
        >
          <div className="row">
            <label>{t("Are you sure ? you want to Disconnect google calendar")}</label>
            <button onClick={handleDisconnectGoogle}
            className="btn btn-primary mx-2"
            >{t("Yes")}</button>
            <button onClick={() => setModalHandlerState2({ show: false })}
              className="btn btn-primary"
              >{t("No")}</button>
          </div>
          
        </Modal>
      )}
      <nav className={getContainerClasses()} style={{ position: "relative" }}>
        <ul className="navbar-nav">
          {["lg", "md"].includes(screenSize) ? (
            <div className="img-conatiner">
              {/* <div style={{ width: "70%", margin: "auto" }}> */}
              <div className="header-logo-wrap">
                {/* <img src={logoitdose} className="img-fluid" /> */}
                <img src={logo} alt="HOSPEDIA" className="header-logo-img" />
              </div>
            </div>
          ) : (
            <li className="nav-item">
              <button
                onClick={handleToggleMenuSidebar}
                type="button"
                className="nav-link mobilerespBars"
              >
                <i className="fas fa-bars" />
              </button>
            </li>
          )}
        </ul>
        <ul className="navbar-nav ml-6"></ul>

        <ul className="navbar-nav ml-auto selectHRes">
          {/* {screenSize === "lg" && (
            <li className="nav-item savetheme">
              <div className="mr-2 headerboxsize">
                <Input
                  type="text"
                  className="form-control organization-name"
                  readOnly={true}
                  // removeFormGroupClass={false}
                  placeholder={" "}
                  // id={"a"}
                  // lable={""}
                  name="barcode"
                  value={localData?.organizationName}
                  respclass={"w-100"}
                />
              </div>
            </li>
          )} */}
          {/* Centre/Role selectors: inline in Classic, portaled to sidebar in Modern */}
          {selectsSlot
            ? createPortal(selectsItems, selectsSlot)
            : selectsItems}

          <li className="nav-item d-md-none">
            <div type="button">
              {/* <i className="fa fa-ellipsis-v" aria-hidden="true"></i> */}
              <SubMenuDropdown languages={languages} />
            </div>
          </li>

          {/* Layout switch sits left of the Change-Role icons in Classic;
              in Modern it stays inside Quick Actions via actionItems */}
          {!actionsSlot && layoutSwitchItem}

          {/* Change-Role / Set-Default: inline in Classic, portaled above the
              sidebar search in Modern */}
          {topActionsSlot
            ? createPortal(topActionItems, topActionsSlot)
            : topActionItems}

          {/* Action icons: inline in Classic, portaled into Quick Actions in Modern */}
          {actionsSlot ? createPortal(actionItems, actionsSlot) : actionItems}

          {/* Profile + logout: inline in Classic, portaled to the sidebar in Modern */}
          {profileSlot ? createPortal(profileItems, profileSlot) : profileItems}
        </ul>
      </nav>
      <RoleChangeModal
        show={openRole}
        GetRoleList={GetRoleList}
        handleChangeRole={handleChangeRole}
        onClose={() => {
          setOpenRole(false);
        }}
        onRoleSelect={handleRoleSelect}
        languages={languages}
      />
    </>
  );
});

export default Header;
