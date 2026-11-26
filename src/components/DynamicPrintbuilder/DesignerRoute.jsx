/** Route entry for the designer — /print-builder/:code */
import React from "react";
import { useParams } from "react-router-dom";
import Designer from "./designer/Designer";

export default function DesignerRoute() {
  const { code } = useParams();
  return <Designer key={code} code={code} />;
}
