import { useEffect, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DesignContext } from "@app/providers/DesignProvider";
import { useWindowSize } from "@app/utils/hooks/useWindowSize";
import { calculateWindowSize } from "@app/utils/helpers";
import { setWindowSize } from "@app/store/reducers/ui";
import RenderRoute from "@app/routes/RenderRoute";
import Loading from "@app/components/loader/Loading";
import ReportLoader from "./components/loader/ReportLoader";
import GlobalLoader from "@app/components/loader/GlobalLoader";
import { setAutoCompleteSearching } from "@app/networkServices/autoCompleteLoaderGate";
import { listenForSessionChanges } from "@app/utils/tabSync";

const App = () => {
  const { isModern } = useContext(DesignContext);
  const dispatch = useDispatch();
  const windowSize = useWindowSize();
  const screenSize = useSelector((state) => state.ui.screenSize);
  const rawLoading = useSelector((state) => state.loadingSlice.loading);
  const pdfLoading = useSelector((state) => state.loadingSlice.pdfLoading);

  // Pool the redux loading overlay so a burst of sequential api calls shows one overlay
  // instead of blinking per call: show instantly, hide once the flag has stayed false a beat.
  const [loading, setLoadingPooled] = useState(false);
  useEffect(() => {
    if (rawLoading) {
      setLoadingPooled(true);
      return undefined;
    }
    const t = setTimeout(() => setLoadingPooled(false), 500);
    return () => clearTimeout(t);
  }, [rawLoading]);

  // Role/centre changed in another tab → refresh this tab onto the new claims.
  useEffect(() => listenForSessionChanges(), []);

  useEffect(() => {
    const apply = () => {
      const els = document.getElementsByClassName("p-autocomplete-input");
      Array.from(els).forEach((el) => {
        el.classList.toggle("p-inputautocomplete-new", isModern);
      });
      // While an AutoComplete is mid-search it shows its own spinner; suppress the
      // full-screen overlay meanwhile.
      setAutoCompleteSearching(document.getElementsByClassName("p-autocomplete-loader").length > 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  return (
    <>
      {/* Global in-flight request loader — one bar for all axios calls. */}
      <GlobalLoader variant="bar" />
      {loading && <Loading />}
      {pdfLoading && <ReportLoader />}
      <RenderRoute />
    </>
  );
};

export default App;
