/**
 * Vital Sign Chart (IPD frame menu) — the nursing forms published from
 * /nursing-form-builder, filled for this patient: data bound from the admission
 * row, drawing + double-click text, auto-saved per admission. Opens on the form
 * whose name matches this menu item.
 */
import React from "react";
import NursingFormWorkspace from "../dynamicNursingFormbuilder/render/NursingFormWorkspace";

export default function VitalSignChart({ data }) {
  return <NursingFormWorkspace data={data} prefer={data?.FileName || "Vital Sign Chart"} />;
}
