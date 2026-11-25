// HR role-based access — single source of truth for "who is this user and what
// may they reach" inside the /hr/* module.
//
// Rule (per product decision):
//   userData.defaultRole === 299 -> PRIVILEGED (HR / Manager): all pages, all data.
//   any other defaultRole       -> EMPLOYEE (self-service): the 6 pages below,
//                                   own data only.
//
// Identity is read FRESH from localStorage on every call because the login
// payload may land after this module is first imported (navigation into HR
// happens after sign-in). The backend independently enforces the same rule and
// scopes rows server-side (email -> new_hr_employees.EmployeeId) — this file is
// UX gating only.
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";

// defaultRole that means HR / Manager (sees everything).
export const PRIVILEGED_ROLE_ID = 299;

// Routes an employee (non-privileged) may open. Everything else in /hr/* is
// HR/Manager-only. Keep lowercase — matched against pathname.toLowerCase().
export const EMPLOYEE_ROUTES = [
  "/hr/dashboard",
  "/hr/attendance",
  "/hr/leave",
  "/hr/duty-roster",
  "/hr/documents",
  "/hr/payroll",
  // Salary Slip self-service: an employee sees only their own slips — the page
  // renders the MySlips view and the backend scopes rows via ScopeEmployeeId.
  "/hr/payroll/slips",
];

/** Current HR user, read fresh from the host login payload (localStorage). */
export function getHrIdentity() {
  // useLocalStorage is a plain storage helper (not a React hook) despite its name.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const u = useLocalStorage("userData", "get") || {};
  return {
    employeeId: u.employeeID ?? u.EmployeeID ?? u.employeeId ?? 0,
    roleId: Number(u.defaultRole ?? 0),
    roleName: u.roleName ?? "",
    email: u.email ?? u.emailID ?? u.EmailId ?? u.emailId ?? "",
    name: u.empName ?? u.employeeName ?? u.userName ?? "User",
  };
}

/** True when the caller is HR / Manager (defaultRole === 299). */
export function isPrivilegedUser() {
  return getHrIdentity().roleId === PRIVILEGED_ROLE_ID;
}

/** True when the caller may open the given /hr/* pathname. */
export function canAccessHrRoute(pathname) {
  if (isPrivilegedUser()) return true;
  const p = String(pathname || "").toLowerCase();
  return EMPLOYEE_ROUTES.includes(p);
}
