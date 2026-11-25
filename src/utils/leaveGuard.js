/*
  "Do you want to leave this page?" guard.

  The app runs on the classic <BrowserRouter>, which cannot block a route change, so the guard is a
  tiny shared flag instead:
    - a screen with unsaved work turns it on through useLeaveGuard(isDirty)  (utils/hooks/useLeaveGuard.js)
    - every menu click asks confirmLeave() before it navigates
  A screen that never turns it on is not affected at all.
*/
let leaveMessage = null;

export const DEFAULT_LEAVE_MESSAGE =
  "Do you want to leave this page? Your unsaved changes will be lost.";

export const setLeaveGuard = (message) => {
  leaveMessage = message || null;
};

export const hasLeaveGuard = () => leaveMessage !== null;

/** true = go ahead and navigate; false = the user chose to stay. */
export const confirmLeave = () => {
  if (leaveMessage === null) return true;
  return window.confirm(leaveMessage);
};
