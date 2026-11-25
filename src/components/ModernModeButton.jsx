import { useTranslation } from "react-i18next";
import { Tooltip } from "primereact/tooltip";
import { useDesignMode } from "@app/hooks/useDesignMode";
import { DESIGN_MODES } from "@app/providers/DesignProvider";

/**
 * "Modern" switch icon for the LEGACY header — same look/size/tooltip as the
 * other header icons. Flips the app into Modern design. Hidden in Modern view.
 */
export default function ModernModeButton() {
  const [t] = useTranslation();
  const { setMode, isModern } = useDesignMode();

  if (isModern) return null;

  return (
    <>
      {/* <Tooltip
        target="#modernSwitch"
        position="top"
        content={t("Switch to New Design")}
        event="hover"
        className="ToolTipCustom"
      /> */}
      <i
        id="modernSwitch"
        // className="fas fa-magic text-white"
        style={{ cursor: "pointer" }}
        onClick={() => {setMode(DESIGN_MODES.MODERN)}}
      >
        NextGen
      </i>
    </>
  );
}
