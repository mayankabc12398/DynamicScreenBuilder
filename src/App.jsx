import { useEffect, useContext, useState } from "react";
import { DesignContext } from "@app/providers/DesignProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { useWindowSize } from "@app/utils/hooks/useWindowSize";
import { calculateWindowSize } from "@app/utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import { setWindowSize } from "@app/store/reducers/ui";
import ReactGA from "react-ga4";
import RenderRoute from "@app/routes/RenderRoute";
import Loading from "@app/components/loader/Loading";
import { useLocalStorage } from "./utils/hooks/useLocalStorage";
import ReportLoader from "./components/loader/ReportLoader";
import GlobalLoader from "@app/components/loader/GlobalLoader";
// import WhatsNewModal from "@app/components/WhatsNewModal";
import { setAutoCompleteSearching } from "@app/networkServices/autoCompleteLoaderGate";
import { listenForSessionChanges } from "@app/utils/tabSync";

const { VITE_NODE_ENV } = import.meta.env;

const App = () => {
  const navigate = useNavigate();
  const { isModern } = useContext(DesignContext);
  
  const localData = useLocalStorage("userData", "get");
  // console.log(localData);
  const windowSize = useWindowSize();
  const screenSize = useSelector((state) => state.ui.screenSize);
  const rawLoading = useSelector((state) => state.loadingSlice.loading);
  const pdfLoading = useSelector((state) => state.loadingSlice.pdfLoading);

  // Pool the legacy redux overlay so a burst of SEQUENTIAL api calls (each
  // dispatches setLoading(false) then the next dispatches setLoading(true)
  // across an await boundary) shows ONE overlay instead of blinking per call.
  // Show instantly; hide only after the loading flag has stayed false a beat.
  const [loading, setLoadingPooled] = useState(false);
  useEffect(() => {
    if (rawLoading) {
      setLoadingPooled(true);
      return undefined;
    }
    const t = setTimeout(() => setLoadingPooled(false), 500);
    return () => clearTimeout(t);
  }, [rawLoading]);

  const dispatch = useDispatch();
  const location = useLocation();

  // Role/centre changed in another tab → refresh this tab onto the new claims.
  useEffect(() => listenForSessionChanges(), []);

  useEffect(() => {
  const apply = () => {
    const els = document.getElementsByClassName("p-autocomplete-input");
    Array.from(els).forEach((el) => {
      el.classList.toggle("p-inputautocomplete-new", isModern);
    });
    // While any AutoComplete is mid-search PrimeReact mounts its inline
    // `.p-autocomplete-loader` spinner. Use that as the signal to suppress the
    // full-screen ECG overlay — the field already shows its own spinner.
    setAutoCompleteSearching(
      document.getElementsByClassName("p-autocomplete-loader").length > 0,
    );
  };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}, [isModern]);

  useEffect(() => {
    const size = calculateWindowSize(windowSize.width);
    if (screenSize !== size) {
      dispatch(setWindowSize(size));
    }
  }, [windowSize]);

  // console.log(screenSize)

  useEffect(() => {
    if (location && location.pathname && VITE_NODE_ENV === "production") {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname,
      });
    }
  }, [location]);

  return (
    <>
      {/* Global in-flight request loader — one bar for all axios calls.
          Default: top progress bar. Use variant="overlay" for full-screen. */}
      <GlobalLoader variant="bar" />
      {loading && <Loading />}
      {pdfLoading && <ReportLoader />}
      {/* What's New popup disabled — uncomment to bring the release-notes
          modal back (component + changelog still live in
          components/WhatsNewModal.jsx). */}
      {/* {isModern && <WhatsNewModal />} */}
      <RenderRoute />

      {/* <ToastContainer
        autoClose={1000}
        draggable={false}
        position="top-right"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnHover
      /> */}
    </>
  );
};

export default App;
