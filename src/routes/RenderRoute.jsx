/**
 * Routes of the standalone Dynamic Screen Builder.
 *
 * hospediav12-fe's RenderRoute lazy-loads every hospital page; this one keeps only the
 * builder, its live screens and its admin pages, plus login and the backend / database
 * pickers (src/sb). The session bootstrap (roles, menu, settings) is the same as the main
 * app's, because the shared header, layout and builder read those from redux.
 *
 * `allRoutes` is still exported with the same shape: copied app code
 * (pages/EDP/EDPConfiguration/RenderComponents.jsx) reads it.
 */
import { Fragment, Suspense, lazy, useContext, useEffect, useState, useTransition } from "react";
import { DesignContext } from "@app/providers/DesignProvider";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Loading from "@app/components/loader/Loading";
import { setNavigator, setLogoutHandler } from "../networkServices/navigationService";
import ErrorBoundary from "../layouts/error-Boundary";
// Builder-only shell: no hospital header, role picker or module menu (src/sb/BuilderLayout.jsx).
import Layout from "@app/sb/BuilderLayout.jsx";
import Authenticated from "@app/Guard/Authenticated.jsx";
import Guest from "@app/Guard/Guest.jsx";
import { useDispatch, useSelector } from "react-redux";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";
import {
  GetBindMenu,
  GetBindResourceList,
  GetGlobalResources,
  GetRoleListByEmployeeIDAndCentreID,
  PageConfigurationAPIDetails,
} from "../store/reducers/common/CommonExportFunction";
import { ToastContainer, Slide, Bounce } from "react-toastify";
import CustomCloseButton from "../components/formComponent/ToastContainer.jsx";
import IdleLogout from "../components/commonComponents/IdleLogout.jsx";
import ConnectionChip from "@app/sb/ConnectionChip.jsx";

/** Where a signed-in user lands. The main app's /dashboard is not part of this project. */
const HOME = "/dynamic-screen-builder";

function PageFade({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector(".content-wrapper, .modern-content, main");
    if (main) main.scrollTop = 0;
  }, [pathname]);
  return (
    <div className="hms-page" key={pathname}>
      {children}
    </div>
  );
}

function LayoutOutlet() {
  return (
    <Layout>
      <PageFade>
        <Outlet />
      </PageFade>
    </Layout>
  );
}

function RenderRoute() {
  const { isModern } = useContext(DesignContext);
  const { GetMenuList, GetRoleList } = useSelector((state) => state?.CommonSlice);
  const localData = useLocalStorage("userData", "get");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [waitForRoute, setWaitForRoute] = useState(true);

  useEffect(() => {
    setNavigator(navigate);
    setLogoutHandler(() => dispatch({ type: "RESET_STORE" }));
  }, [navigate, dispatch]);

  const [displayLocation, setDisplayLocation] = useState(location);
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (location.key !== displayLocation.key) {
      startTransition(() => setDisplayLocation(location));
    }
  }, [location, displayLocation.key]);

  useEffect(() => {
    if (!localData?.employeeID) return;
    dispatch(GetGlobalResources());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localData?.employeeID]);

  const fetchData = async () => {
    try {
      await dispatch(
        GetRoleListByEmployeeIDAndCentreID({
          employeeID: localData?.employeeID,
          centreID: localData?.centreID,
        }),
      );
      await dispatch(GetBindMenu({ RoleID: localData?.defaultRole }));
      await dispatch(PageConfigurationAPIDetails());
      await dispatch(GetBindResourceList());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setWaitForRoute(false);
  };

  useEffect(() => {
    if (localData && (GetMenuList?.length === 0 || GetRoleList?.length === 0)) {
      fetchData();
    } else {
      setWaitForRoute(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (waitForRoute) {
    return <Loading />;
  }

  const combined = [...allRoutes.commonRoutes, ...allRoutes.roleRoutes];
  const isPersistent = (r) => r?.layout === Layout && r?.Guard === Authenticated;
  const shellRoutes = combined.filter(isPersistent);
  const otherRoutes = combined.filter((r) => !isPersistent(r));

  const renderShell = (route, key) => {
    const Component = route.component;
    return <Route path={route.path} key={key} element={<Component />} />;
  };
  const renderFlat = (route, key) => {
    const Component = route.component;
    const RLayout = route.layout || Fragment;
    const Guard = route.Guard || Fragment;
    return (
      <Route
        path={route.path}
        key={key}
        element={
          <Guard>
            <RLayout>
              <Component />
            </RLayout>
          </Guard>
        }
      />
    );
  };

  return (
    <>
      <IdleLogout />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={isModern}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={isModern ? Slide : Bounce}
        closeButton={CustomCloseButton}
      />
      <ConnectionChip />
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes location={displayLocation}>
            <Route path="/" element={<Navigate to="/login" />} />
            {/* The login lands on /dashboard; here the builder is home. */}
            <Route path="/dashboard" element={<Navigate to={HOME} replace />} />
            <Route
              element={
                <Authenticated>
                  <LayoutOutlet />
                </Authenticated>
              }
            >
              {shellRoutes.map((route, i) => renderShell(route, `s${i}`))}
            </Route>
            {otherRoutes.map((route, i) => renderFlat(route, `f${i}`))}
            <Route path="*" element={<Navigate to={HOME} replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default RenderRoute;

const allRoutes = {
  commonRoutes: [
    {
      // Step 1: which backend. Before login, because login goes to that backend.
      path: "/connect",
      component: lazy(() => import("@app/sb/ConnectPage.jsx")),
      exact: true,
    },
    {
      Guard: Guest,
      path: "/login",
      component: lazy(() => import("../modules/login/Login")),
      exact: true,
    },
    {
      path: "/ForgetPassword",
      component: lazy(() => import("@app/modules/login/ForgetPassword.jsx")),
      exact: true,
    },
  ],
  roleRoutes: [
    {
      Guard: Authenticated,
      layout: Layout,
      path: "/dynamic-screen-builder",
      component: lazy(() => import("@app/components/DynamicScreenBuilder/Index.jsx")),
      exact: true,
    },
    {
      // Live screens saved from the builder.
      Guard: Authenticated,
      layout: Layout,
      path: "/screen/:screenId",
      component: lazy(() => import("@app/components/DynamicScreenBuilder/ScreenRoute.jsx")),
      exact: true,
    },
    {
      Guard: Authenticated,
      layout: Layout,
      path: "/screen-box-permission",
      component: lazy(() => import("@app/components/DynamicScreenBuilder/ScreenBoxPermission.jsx")),
      exact: true,
    },
    {
      Guard: Authenticated,
      layout: Layout,
      path: "/screen-load-monitor",
      component: lazy(() => import("@app/pages/Tools/ScreenLoadMonitor/ScreenLoadMonitor.jsx")),
      exact: true,
    },
    {
      // Dynamic print builder — template library. Templates print through HospediaAPI PrintBuilder/*.
      Guard: Authenticated,
      layout: Layout,
      path: "/print-builder",
      component: lazy(() => import("@app/components/DynamicPrintbuilder/Index.jsx")),
      exact: true,
    },
    {
      // The designer for one print template.
      Guard: Authenticated,
      layout: Layout,
      path: "/print-builder/:code",
      component: lazy(() => import("@app/components/DynamicPrintbuilder/DesignerRoute.jsx")),
      exact: true,
    },
  ],
};
