import { useEffect } from "react";
import { DEFAULT_LEAVE_MESSAGE, setLeaveGuard } from "../leaveGuard";

/**
 * Ask "Do you want to leave this page?" while `isDirty` is true:
 *  - when a menu item (or the home icon) is clicked, via confirmLeave() in the menus
 *  - when the tab is closed or refreshed, via the browser's own prompt
 * Switches itself off when the screen is left or `isDirty` goes false (for example after Save).
 */
export const useLeaveGuard = (isDirty, message = DEFAULT_LEAVE_MESSAGE) => {
  useEffect(() => {
    if (!isDirty) return undefined;

    setLeaveGuard(message);
    const warnOnUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnOnUnload);

    return () => {
      setLeaveGuard(null);
      window.removeEventListener("beforeunload", warnOnUnload);
    };
  }, [isDirty, message]);
};
