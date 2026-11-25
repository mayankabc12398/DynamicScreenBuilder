/**
 * Standalone builder stand-in for hospediav12-fe's components/commonComponents/EmergencySeeMoreList.
 *
 * The hospital frame menu (Emergency patient screens) is not part of this project, so the
 * builder's FrameMenu component has no screens to list and appModals has no "frame:" modals.
 */
import React from "react";

/** Frame screen loaders by URL. Empty: no hospital frame screens here. */
export const EMERGENCY_FRAME_COMPONENTS = {};

export default function EmergencySeeMoreList() {
  return (
    <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
      Hospital frame-menu screens are not available in the standalone screen builder.
    </div>
  );
}
