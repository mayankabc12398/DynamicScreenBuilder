import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { logoutAction } from "../../store/reducers/AuthSlice/logoutSlice";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { notify } from "../../utils/utils";

/**
 * Signs a user out after a spell of doing nothing.
 *
 * A counter left open on a patient's bill is the whole system left open - anybody
 * walking past the desk can bill, discount or refund as that user, and it is that user's
 * name on it afterwards. The screens are also where a patient's details sit, in plain
 * view of the next person at the counter.
 *
 * How long is up to the site: fin_global_resources -> AutoLogoutMinutes. 0, a missing
 * row, or IsActive = 0 all mean nobody is ever signed out, which is how the system
 * behaved before this.
 *
 * Idle means no mouse, no key, no touch, no scroll - not "no API call". A screen that
 * polls in the background would otherwise keep a session alive all night on its own.
 *
 * The clock is shared across tabs through localStorage, so somebody working in a second
 * tab is not signed out of the first. It is read on a timer rather than trusted from
 * memory, which also covers a laptop that was asleep: on waking, the time that passed
 * while it slept counts.
 */

/** Where the last sign of life is kept, shared by every tab of this browser. */
const LAST_ACTIVE_KEY = "hospedia.lastActivity";

/** How often the idle clock is checked. */
const CHECK_EVERY_MS = 15 * 1000;

/* Activity is written at most this often. A mousemove fires hundreds of times a second
   and localStorage is synchronous - writing on every one would be felt on the screen. */
const WRITE_AT_MOST_EVERY_MS = 5 * 1000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "click",
];

const readLastActive = () => {
  try {
    return Number(window.localStorage.getItem(LAST_ACTIVE_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeLastActive = (at) => {
  try {
    window.localStorage.setItem(LAST_ACTIVE_KEY, String(at));
  } catch {
    /* A browser with site data blocked still works - it just falls back to this tab's
       own memory, so the timer is per tab rather than shared. */
  }
};

const IdleLogout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const localData = useLocalStorage("userData", "get");

  /* Set once the sign-out has been fired, so a slow logout call cannot fire it twice. */
  const signingOutRef = useRef(false);
  const lastWriteRef = useRef(0);

  const minutes = (() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const row = list?.find((item) => item?.Name === "AutoLogoutMinutes");
    const value = Number(row?.Value ?? 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  })();

  const isLoggedIn = Boolean(localData?.employeeID);
  const onLoginPage = String(location?.pathname || "").toLowerCase() === "/login";
  const armed = minutes > 0 && isLoggedIn && !onLoginPage;

  useEffect(() => {
    if (!armed) return undefined;

    const idleMs = minutes * 60 * 1000;
    signingOutRef.current = false;

    /* Arriving on a screen counts as being here. Without this, a tab opened after a long
       idle spell would read a stale stamp and sign the user straight back out. */
    writeLastActive(Date.now());
    lastWriteRef.current = Date.now();

    const onActivity = () => {
      const now = Date.now();
      if (now - lastWriteRef.current < WRITE_AT_MOST_EVERY_MS) return;
      lastWriteRef.current = now;
      writeLastActive(now);
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );

    const timer = setInterval(() => {
      if (signingOutRef.current) return;

      const lastActive = readLastActive() || lastWriteRef.current;
      if (Date.now() - lastActive < idleMs) return;

      signingOutRef.current = true;
      notify(
        `You have been signed out after ${minutes} minutes of inactivity.`,
        "warn",
      );
      /* The same sign-out the header button uses: it closes the session on the server,
         clears what is stored and sends the browser to the login page. */
      dispatch(
        logoutAction({
          roleID: localData?.defaultRole,
          employeeID: localData?.employeeID,
          centreID: localData?.centreID,
        }),
      );
    }, CHECK_EVERY_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity),
      );
      clearInterval(timer);
    };
  }, [
    armed,
    minutes,
    dispatch,
    localData?.defaultRole,
    localData?.employeeID,
    localData?.centreID,
  ]);

  return null;
};

export default IdleLogout;
