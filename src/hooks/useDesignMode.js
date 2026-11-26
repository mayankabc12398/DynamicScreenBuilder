import { useContext } from "react";
import { DesignContext } from "@app/providers/DesignProvider";

function useDesignMode() {
  return useContext(DesignContext);
}

export default useDesignMode;
