import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { setLayoutMode } from "@app/store/reducers/ui";
import "./LayoutSwitch.css";
import ModernModeButton from "../../components/ModernModeButton";

/**
 * LayoutSwitch — segmented Classic ↔ Modern control.
 * Instant switch, preference persisted to localStorage via the ui slice.
 * `variant="compact"` renders a small pill suited to the header.
 */
const LayoutSwitch = ({ variant = "default" }) => {
  const dispatch = useDispatch();
  const [t] = useTranslation();
  const layoutMode = useSelector((state) => state.ui.layoutMode);

  return (
    <div
      className={`ml-switch ${variant === "compact" ? "ml-switch-compact" : ""}`}
      role="tablist"
      aria-label={t("Layout")}
    >
      <button
        type="button"
        role="tab"
        aria-selected={layoutMode === "classic"}
        className={`ml-switch-btn ${layoutMode === "classic" ? "active" : ""}`}
        onClick={() => dispatch(setLayoutMode("classic"))}
        title={t("Classic Layout")}
      >
        {t("Classic")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={layoutMode === "modern"}
        className={`ml-switch-btn ${layoutMode === "modern" ? "active" : ""}`}
        onClick={() => dispatch(setLayoutMode("modern"))}
        title={t("Modern Layout")}
      >
        {t("Modern")}
      </button>
      {/* <button
        type="button"
        role="tab"
        className={`ml-switch-btn`}
      >
        <ModernModeButton/>
      </button> */}
    </div>
  );
};

export default LayoutSwitch;
