/**
 * The frame menu — the per-module list of patient sub-screens a role may open.
 *
 * `MasterPage/BindFrameMenuByRoleID` answers a POST of `{ frameName }` with the
 * screens THIS user's role is allowed to reach for that module: Emergency,
 * Billing, Counselling and so on. Each entry names the component to load
 * (`URL`), the label to show (`FileName`) and the group it sits under
 * (`MenuHeaderName`).
 *
 * The hand-coded pages fetch it through a redux thunk into one shared slice,
 * which works because a page is one module. A built screen is not: two frame
 * menus on one screen would fight over that single slice, and a builder
 * component may not assume the app's store is mounted. So this fetches through
 * the runtime's own client — same endpoint, same envelope, no shared state.
 */
import { useEffect, useRef, useState } from "react";

export const FRAME_MENU_URL = "MasterPage/BindFrameMenuByRoleID";

/**
 * One request per module, shared by everyone who asks for it.
 *
 * The menu is decided by the module and the signed-in role, so it is the same
 * answer for every row of a table — and a menu column on a 50-row grid asking
 * 50 times would be absurd. The promise is cached rather than the rows, so
 * callers that mount together all wait on the same in-flight request.
 */
const menuCache = new Map();

function fetchFrameMenu(client, frameName) {
  if (menuCache.has(frameName)) return menuCache.get(frameName);
  const req = client(FRAME_MENU_URL, { method: "post", data: { frameName }, meta: { silent: true } })
    .then((res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []))
    .catch((e) => {
      // A failure is not cached: the next screen that needs the menu should get
      // a real attempt, not a remembered outage.
      menuCache.delete(frameName);
      throw e;
    });
  menuCache.set(frameName, req);
  return req;
}

/** The label an entry carries — the endpoints disagree about the key. */
export const frameItemLabel = (item) =>
  item?.FileName || item?.FormName || item?.MenuName || item?.menuName || item?.Text || item?.name || item?.label || "Untitled";

/** The group an entry sits under, "OTHERS" when it names none. */
export const frameItemGroup = (item) =>
  item?.MenuHeaderName || item?.menuHeaderName || item?.Category || item?.Header || item?.GroupName || "OTHERS";

/**
 * Entries grouped and filtered, ready to list.
 *
 * Grouping matches SeeMoreSlideScreen's — same keys, same "OTHERS last" order —
 * so a menu raised by an action reads exactly like the one a trigger drops
 * down beside it.
 */
export function groupFrameMenu(items, search = "") {
  const q = String(search || "").trim().toLowerCase();
  const groups = (items || []).reduce((acc, item) => {
    const label = frameItemLabel(item);
    if (q && !label.toLowerCase().includes(q)) return acc;
    const key = frameItemGroup(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...item, safeLabel: label, safeCategory: key });
    return acc;
  }, {});
  return Object.entries(groups).sort((a, b) => {
    if (a[0] === "OTHERS") return 1;
    if (b[0] === "OTHERS") return -1;
    return a[0].localeCompare(b[0]);
  });
}

/** Everything a frame-menu screen expects to be told about the patient. */
export const frameMenuRecord = (row) => ({
  ...(row || {}),
  transactionID: row?.TID,
  patientID: row?.PatientID ?? row?.patientID,
});

/** Drop the cached menus — for a role or centre switch. */
export function clearFrameMenuCache() {
  menuCache.clear();
}

/**
 * One node's frame menu.
 *
 * Nothing is fetched on the canvas: the list is role-filtered, so what the
 * designer's role can reach is not what the screen's users will reach, and a
 * canvas that fires requests as you drag is its own problem. The design branch
 * of the component names the module it is pointed at instead.
 */
export function useFrameMenu(rt, frameName) {
  const [state, setState] = useState({ items: [], loading: false, error: "" });
  const client = rt?.client;
  const design = !!rt?.design;
  // Which request is the current one, so a frameName changed mid-flight cannot
  // be answered by the older call landing second.
  const seq = useRef(0);

  useEffect(() => {
    if (design || !client || !frameName) {
      setState({ items: [], loading: false, error: "" });
      return undefined;
    }
    const mine = seq.current + 1;
    seq.current = mine;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fetchFrameMenu(client, frameName)
      .then((rows) => {
        if (!alive || seq.current !== mine) return;
        setState({ items: rows, loading: false, error: "" });
      })
      .catch((e) => {
        if (!alive || seq.current !== mine) return;
        setState({ items: [], loading: false, error: e?.message || "Could not read the menu" });
      });
    return () => {
      alive = false;
    };
  }, [client, frameName, design]);

  return state;
}
