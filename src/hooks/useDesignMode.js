import { useContext } from "react";
import { DesignContext } from "@app/providers/DesignProvider";

export function useDesignMode() {
  return useContext(DesignContext);
}

export default useDesignMode;
