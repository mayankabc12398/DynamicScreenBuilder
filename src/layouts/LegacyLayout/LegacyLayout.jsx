import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebarMenu } from "@app/store/reducers/ui";
import { addWindowClass, removeWindowClass } from "@app/utils/helpers";
import Header from "@app/layouts/header/Header";
import MenuSidebar from "@app/layouts/menu-sidebar/MenuSidebar";
import Footer from "@app/layouts/footer/Footer";
import { useRtlDir } from "@app/hooks/useRtlDir";
import "@app/layouts/header/header-rtl.css";

const LegacyLayout = (props) => {
  const dispatch = useDispatch();
  const menuSidebarCollapsed = useSelector(
    (state) => state.ui.menuSidebarCollapsed,
  );
  const controlSidebarCollapsed = useSelector(
    (state) => state.ui.controlSidebarCollapsed,
  );
  const screenSize = useSelector((state) => state.ui.screenSize);
  const headerDir = useRtlDir();

  const handleToggleMenuSidebar = () => {
    dispatch(toggleSidebarMenu());
  };

  useEffect(() => {
    removeWindowClass("register-page");
    removeWindowClass("login-page");
    removeWindowClass("hold-transition");
  }, []);

  useEffect(() => {
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
        </div>

        <div className="p-1 content-wrapper" id="page-data">
          {props.children}
        </div>
        <Footer />

        <div
          id="sidebar-overlay"
          role="presentation"
          onClick={handleToggleMenuSidebar}
          onKeyDown={() => {}}
        />
      </>
    );
  }, [props.children, headerDir]);

  return (
    <div className="wrapper">
      {getAppTemplate()}
    </div>
  );
};

export default LegacyLayout;
