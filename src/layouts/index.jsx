import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebarMenu } from "@app/store/reducers/ui";
import { addWindowClass, removeWindowClass } from "@app/utils/helpers";
import Header from "@app/layouts/header/Header";
import MenuSidebar from "@app/layouts/menu-sidebar/MenuSidebar";
import Footer from "@app/layouts/footer/Footer";
import ChatEmploye from "@app/layouts/ChatEmploye";
// import ChatbotUI from "../chatGpt/ChatbotUI";
import Chatbot from "./Chatbot/Chatbot";
import ModernLayout from "./modern/ModernLayout";
import WhatsNewPopup from "@app/components/releaseUpdate/WhatsNewPopup";

// Mayank Theme 
import { Suspense, lazy } from "react";
import { useDesignMode } from "@app/hooks/useDesignMode";
import { useRtlDir } from "@app/hooks/useRtlDir";
import "@app/layouts/header/header-rtl.css";
import LegacyLayout from "@app/layouts/LegacyLayout";
const ModernLayoutNEW = lazy(() => import("@app/layouts/ModernLayout"));

// Design-mode switch lives in its own component so toggling Classic/Modern
// swaps whole subtrees instead of changing the hook count of one component.
const Index = (props) => {
  const { isModern } = useDesignMode();
  if (isModern) {
    return (
      <Suspense fallback={<LegacyLayout {...props} />}>
        <ModernLayoutNEW {...props} />
      </Suspense>
    );
  }
  return <ClassicIndex {...props} />;
};

const ClassicIndex = (props) => {
  // Arabic/Urdu mirror the header and menu bar (layouts/header/header-rtl.css).
  const headerDir = useRtlDir();
  const dispatch = useDispatch();
  const layoutMode = useSelector((state) => state.ui.layoutMode);
  const isModern_AS = layoutMode === "modern";
  const menuSidebarCollapsed = useSelector(
    (state) => state.ui.menuSidebarCollapsed,
  );
  const controlSidebarCollapsed = useSelector(
    (state) => state.ui.controlSidebarCollapsed,
  );
  const screenSize = useSelector((state) => state.ui.screenSize);

  const handleToggleMenuSidebar = () => {
    dispatch(toggleSidebarMenu());
  };

  useEffect(() => {
    removeWindowClass("register-page");
    removeWindowClass("login-page");
    removeWindowClass("hold-transition");
    // addWindowClass("sidebar-mini");
    // return () => {
    //   removeWindowClass("sidebar-mini");
    // };
  }, []);

  useEffect(() => {
    // Modern shell manages its own offsets; skip the legacy AdminLTE body-class
    // juggling so it cannot interfere with the new layout.
    if (isModern_AS) return;
    removeWindowClass("sidebar-closed");
    removeWindowClass("sidebar-collapse");
    removeWindowClass("sidebar-open");
    if (menuSidebarCollapsed && screenSize === "lg") {
      addWindowClass("sidebar-collapse");
    } else if (menuSidebarCollapsed && screenSize === "xs") {
      addWindowClass("sidebar-open");
    } else if (menuSidebarCollapsed && screenSize === "sm") {
      addWindowClass("sidebar-open");
    } else if (!menuSidebarCollapsed && screenSize !== "lg") {
      addWindowClass("sidebar-closed");
      addWindowClass("sidebar-collapse");
    }
  }, [screenSize, menuSidebarCollapsed]);

  useEffect(() => {
    if (controlSidebarCollapsed) {
      removeWindowClass("control-sidebar-slide-open");
    } else {
      addWindowClass("control-sidebar-slide-open");
    }
  }, [screenSize, controlSidebarCollapsed]);

  const getAppTemplate = useCallback(() => {
    return (
      <>
        <div id="main-header" dir={headerDir}>
          <div className="header-fixed">
            <Header />
          </div>

          <MenuSidebar />

          {/* <Breadcrumb path={location?.pathname}/> */}
        </div>

        <div className="p-1 content-wrapper" id="page-data">
          {props.children}
        </div>
        {/* <Chatbot /> */}
        {/* <ChatEmploye /> */}
        {/* <ChatbotUI /> */}
        <Footer />

        {/* <ControlSidebar /> */}
        <div
          id="sidebar-overlay"
          role="presentation"
          onClick={handleToggleMenuSidebar}
          onKeyDown={() => {}}
        />
      </>
    );
  }, [props.children, headerDir]);

  if (isModern_AS) {
    return (
      <>
        <WhatsNewPopup />
        <ModernLayout>{props.children}</ModernLayout>

      </>
    );
  }

  return (
    <>
      <WhatsNewPopup />
      <div className="wrapper">{getAppTemplate()}</div>
    </>
  );
};

export default Index;
