/**
 * Route entry for the dynamic print builder — /print-builder (template list).
 * The designer is /print-builder/:code (DesignerRoute.jsx). Design notes,
 * template JSON schema and the API contract: DESIGN.md in this folder.
 */
import React from "react";
import TemplateList from "./list/TemplateList";
import TipLayer from "./ui/TipLayer";
import { useAppFontZoom } from "./ui/zoom";

export default function Index() {
  useAppFontZoom();
  return (
    <>
      <TemplateList />
      <TipLayer />
    </>
  );
}
