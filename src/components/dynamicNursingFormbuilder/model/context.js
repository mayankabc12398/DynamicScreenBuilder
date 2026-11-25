/**
 * Login user + printing centre beside the patient row — the same "user" /
 * "centre" roots the Print Builder binds, from NursingFormBuilder/Context.
 *
 * They are flattened into the row as "user.EmployeeName", "centre.Address",
 * "centre.LogoUrl" … so a data field, a {pattern} or a tick binds them like any
 * patient key. Image values (the centre logos) are data: URIs and render as
 * images. Loaded once per page and shared; without the API it falls back to
 * the names in the login's localStorage.
 */
import { useEffect, useState } from "react";
import { nfContext } from "../../../networkServices/nursingFormBuilderApi";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";

export const USER_PREFIX = "user.";
export const CENTRE_PREFIX = "centre.";
export const isContextKey = (k) => String(k).startsWith(USER_PREFIX) || String(k).startsWith(CENTRE_PREFIX);
export const isImageValue = (v) => typeof v === "string" && /^data:image\//i.test(v);

/** Ids and duplicates a nurse never prints. */
const SKIP = new Set(["user.RoleID", "user.DepartmentID", "user.OrganizationID", "user.Hospital_ID", "centre.CentreID"]);

function flatten(d) {
  const out = {};
  for (const root of ["user", "centre"]) {
    for (const [k, v] of Object.entries(d?.[root] || {})) {
      const key = `${root}.${k}`;
      if (!SKIP.has(key)) out[key] = v ?? "";
    }
  }
  return out;
}

function fromLogin() {
  const u = useLocalStorage("userData", "get") || {};
  const name = u.empName || u.employeeName || u.userName || "";
  const centre = u.centreName || u.defaultCentreName || "";
  return {
    "user.EmployeeName": name,
    "user.UserName": u.userName || name,
    "user.EmployeeID": u.employeeID || "",
    "user.RoleName": u.roleName || "",
    "user.CentreName": centre,
    "centre.CentreName": centre,
  };
}

let cached = null;
let pending = null;

/** Flat { "user.X": …, "centre.Y": … }; one request per page load. */
export function loadNfContext() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = nfContext()
      .then((res) => {
        const flat = res?.success && res.data ? flatten(res.data) : null;
        // a failed call is not cached, so the next screen tries again
        if (flat) cached = { ...fromLogin(), ...flat };
        return flat ? cached : fromLogin();
      })
      .catch(() => fromLogin())
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useNfContext() {
  const [ctx, setCtx] = useState(() => cached || fromLogin());
  useEffect(() => {
    let live = true;
    loadNfContext().then((c) => live && setCtx(c));
    return () => {
      live = false;
    };
  }, []);
  return ctx;
}

/** The patient row with the context keys beside it (patient keys win on a clash). */
export const withContext = (row, ctx) => ({ ...(ctx || {}), ...(row || {}) });
