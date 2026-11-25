/**
 * Route entry for the visual screen builder — /dynamic-screen-builder
 *
 * Optional query params:
 *   ?screen=<screenId>   open a specific saved screen
 *
 * Everything else lives under this folder:
 *   schema/     the JSON contract (start here — README.md documents it)
 *   registry/   every available component, one entry each
 *   builder/    palette, canvas, layers, inspector, theme, templates
 *   renderer/   <ScreenRenderer/> — turns the JSON into a live page
 *   runtime/    data sources, events/actions, form state
 *   store/      undo/redo-friendly builder state
 *   templates/  the reference Emergency Patient Search screen
 */

import React from "react";
import { useSearchParams } from "react-router-dom";
import BuilderShell from "./builder/BuilderShell";

export default function Index() {
  const [params] = useSearchParams();
  const screenId = params.get("screen") || "";
  return <BuilderShell screenId={screenId} />;
}
