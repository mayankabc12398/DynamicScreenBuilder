/**
 * The API catalog the dynamic screen builder reads.
 *
 * Server side lives in HospediaAPI/ScreenBuilder — it derives the list from the
 * route table of the running build, so it is always in step with what is
 * deployed and nobody maintains a list of endpoints by hand.
 *
 * These calls are silent: the builder shows its own inline state next to the
 * dropdowns, and the global page loader flashing on every keystroke there would
 * be worse than no feedback.
 */
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

const SILENT = { meta: { silent: true } };

/** Every controller with an endpoint count — the first dropdown. */
export const getApiControllers = async () =>
  makeApiRequest(apiUrls.ScreenBuilderGetControllers, { method: "get", ...SILENT });

/** The endpoints of one controller, each with its verb, route and parameters. */
export const getApiEndpoints = async (controller) =>
  makeApiRequest(`${apiUrls.ScreenBuilderGetEndpoints}?controller=${encodeURIComponent(controller || "")}`, {
    method: "get",
    ...SILENT,
  });

/**
 * The whole catalog in one call. Parameters are omitted unless asked for —
 * with them the payload runs to megabytes across a few hundred controllers.
 */
export const getApiCatalog = async ({ includeParameters = false, search = "" } = {}) => {
  const q = new URLSearchParams();
  if (includeParameters) q.set("includeParameters", "true");
  if (search) q.set("search", search);
  const qs = q.toString();
  return makeApiRequest(`${apiUrls.ScreenBuilderGetCatalog}${qs ? `?${qs}` : ""}`, { method: "get", ...SILENT });
};

/* -------------------------------------------------------------------------- */
/*  screen storage                                                            */
/* -------------------------------------------------------------------------- */
/**
 * The screens the builder designs, their version history and the template
 * library. Server side: HospediaAPI/ScreenBuilder, tables sb_screen,
 * sb_screen_version and sb_template.
 *
 * The screen document travels as a JSON string in `definition` and is stored
 * verbatim, so the builder's format is nobody else's business.
 */
const post = (url, data) => makeApiRequest(url, { method: "post", data, ...SILENT });
const get = (url) => makeApiRequest(url, { method: "get", ...SILENT });

/** Whether the storage tables exist yet. */
export const screensInstalled = async () => get(apiUrls.ScreenBuilderIsInstalled);

/** Creates the tables. Safe to call twice — the script is CREATE TABLE IF NOT EXISTS. */
export const installScreenStorage = async () => post(apiUrls.ScreenBuilderInstall, {});

/**
 * `includeDefinition` attaches each screen's document — what the library grid
 * needs to draw a thumbnail. Left off elsewhere, because the documents are the
 * bulk of the payload.
 */
export const listScreens = async ({ status = "", includeDefinition = false, moduleId = "" } = {}) => {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  if (includeDefinition) q.set("includeDefinition", "true");
  // Only the screens filed under one module (role id).
  if (moduleId) q.set("moduleId", String(moduleId));
  const qs = q.toString();
  return get(`${apiUrls.ScreenBuilderGetScreens}${qs ? `?${qs}` : ""}`);
};

export const getScreen = async (screenKey) =>
  get(`${apiUrls.ScreenBuilderGetScreen}?screenKey=${encodeURIComponent(screenKey || "")}`);

/**
 * The published version — what /screen/:id shows. With the `stamp` of the copy
 * already held, an unchanged screen answers `{ notModified: true }` instead of
 * the whole document.
 */
export const getLiveScreen = async (screenKey, stamp = "") => {
  const q = new URLSearchParams({ screenKey: screenKey || "" });
  if (stamp) q.set("stamp", stamp);
  return get(`${apiUrls.ScreenBuilderGetLiveScreen}?${q.toString()}`);
};

/**
 * Screen Load Monitor. The /screen route reports how long a live screen took to
 * fetch and paint; the server joins it to the entry GetLiveScreen made (user,
 * time, cache or database). Fire-and-forget: a failed report never shows.
 */
export const reportScreenLoad = (report) =>
  makeApiRequest(apiUrls.ScreenLoadLogReport, { method: "post", data: report, ...SILENT }).catch(() => null);

/** Recent loads + the screens in the API cache now. `hours` 0 = all kept. Admin roles only. */
export const getScreenLoadLog = async ({ userId = "", screenKey = "", hours = 0 } = {}) => {
  const q = new URLSearchParams();
  if (userId) q.set("userId", userId);
  if (screenKey) q.set("screenKey", screenKey);
  if (hours) q.set("hours", String(hours));
  const qs = q.toString();
  return get(`${apiUrls.ScreenLoadLogList}${qs ? `?${qs}` : ""}`);
};

export const clearScreenLoadLog = async () => post(apiUrls.ScreenLoadLogClear, {});

export const saveScreen = async (payload) => post(apiUrls.ScreenBuilderSaveScreen, payload);

export const publishScreen = async (payload) => post(apiUrls.ScreenBuilderPublishScreen, payload);

export const deleteScreen = async (screenKey) => post(apiUrls.ScreenBuilderDeleteScreen, { screenKey });

export const listScreenVersions = async (screenKey, take = 25) =>
  get(`${apiUrls.ScreenBuilderGetScreenVersions}?screenKey=${encodeURIComponent(screenKey || "")}&take=${take}`);

export const getScreenVersion = async (versionKey) =>
  get(`${apiUrls.ScreenBuilderGetScreenVersion}?versionKey=${encodeURIComponent(versionKey || "")}`);

export const restoreScreenVersion = async (screenKey, versionKey) =>
  post(apiUrls.ScreenBuilderRestoreVersion, { screenKey, versionKey });

/** Drop one old version from a screen's history; the screen itself stays. */
export const deleteScreenVersion = async (screenKey, versionKey) =>
  post(apiUrls.ScreenBuilderDeleteScreenVersion, { screenKey, versionKey });

export const listTemplates = async () => get(apiUrls.ScreenBuilderGetTemplates);

export const saveTemplate = async (payload) => post(apiUrls.ScreenBuilderSaveTemplate, payload);

export const seedTemplates = async (templates) => post(apiUrls.ScreenBuilderSeedTemplates, templates);

export const deleteTemplate = async (templateKey) => post(apiUrls.ScreenBuilderDeleteTemplate, { templateKey });

/* -------------------------------------------------------------------------- */
/*  restricted boxes                                                          */
/* -------------------------------------------------------------------------- */
/**
 * A component marked "Restrict access" in the builder shows at /screen/:id only
 * to the users granted it (table sb_screen_access) and admin roles.
 */

/**
 * Every grant on a screen under one role: [{ nodeId, nodeName, employeeID, employeeName, roleID }].
 * Grants are per role — a user sees a box only while logged in under the role it was granted in.
 */
export const getScreenAccess = async (screenKey, roleId) =>
  get(
    `${apiUrls.ScreenBuilderGetScreenAccess}?screenKey=${encodeURIComponent(screenKey || "")}&roleId=${encodeURIComponent(
      roleId ?? "",
    )}`,
  );

/** Replaces the users of one box under one role: { screenKey, nodeId, nodeName, roleID, users: [{ employeeID, employeeName }] }. */
export const saveScreenAccess = async (payload) => post(apiUrls.ScreenBuilderSaveScreenAccess, payload);

/** What the signed-in user may see: { all, nodeIds }. */
export const getMyScreenAccess = async (screenKey) =>
  get(`${apiUrls.ScreenBuilderGetMyScreenAccess}?screenKey=${encodeURIComponent(screenKey || "")}`);

/** Every role (f_rolemaster): [{ id, RoleName, Active, DeptName, CentreName, … }]. */
export const bindRoleMasterList = async () => get(apiUrls.ScreenBuilderBindRoleMasterList);

/** Active employees who log in under a role: [{ employeeID, employeeName, grants }]. */
export const getRoleEmployees = async (roleId) =>
  get(`${apiUrls.ScreenBuilderGetRoleEmployees}?roleId=${encodeURIComponent(roleId ?? "")}`);

/** Every box one employee holds under one role, on every screen: [{ screenKey, nodeId, nodeName, … }]. */
export const getEmployeeScreenAccess = async (employeeId, roleId) =>
  get(
    `${apiUrls.ScreenBuilderGetEmployeeScreenAccess}?employeeId=${encodeURIComponent(
      employeeId ?? "",
    )}&roleId=${encodeURIComponent(roleId ?? "")}`,
  );

/** Replaces one employee's boxes on one screen under one role: { screenKey, employeeID, employeeName, roleID, nodes: [{ nodeId, nodeName }] }. */
export const saveEmployeeScreenAccess = async (payload) => post(apiUrls.ScreenBuilderSaveEmployeeScreenAccess, payload);

/** Every grant under one role, all screens and employees: [{ screenKey, nodeId, nodeName, employeeID, … }]. */
export const getRoleScreenAccess = async (roleId) =>
  get(`${apiUrls.ScreenBuilderGetRoleScreenAccess}?roleId=${encodeURIComponent(roleId ?? "")}`);

/**
 * Replaces several employees' boxes on one screen under one role, in one transaction:
 * { screenKey, roleID, employees: [{ employeeID, employeeName, nodes: [{ nodeId, nodeName }] }] }.
 */
export const saveRoleScreenAccess = async (payload) => post(apiUrls.ScreenBuilderSaveRoleScreenAccess, payload);

/**
 * Replaces several employees' boxes on several screens under one role, in one transaction:
 * { roleID, screens: [{ screenKey, employees: [{ employeeID, employeeName, nodes: [{ nodeId, nodeName }] }] }] }.
 */
export const saveRoleAccessBatch = async (payload) => post(apiUrls.ScreenBuilderSaveRoleAccessBatch, payload);

/* -------------------------------------------------------------------------- */
/*  page access                                                               */
/* -------------------------------------------------------------------------- */
/**
 * Who may open a screen as an app page (HospediaAPI ScreenPageAccess): its
 * f_filemaster row and menu, the roles in f_file_role and the employees in
 * user_pageaccess.
 */

/** Active menus (modules): [{ id, menuName }]. */
export const getPageAccessMenus = async () => get(apiUrls.ScreenPageAccessGetMenus);

/** { urlID, menuID, menuName, dispName, roles: [roleId], employees: [{ roleID, employeeID, employeeName }] }; urlID 0 = not registered. */
export const getScreenPageAccess = async (screenKey) =>
  get(`${apiUrls.ScreenPageAccessGetAccess}?screenKey=${encodeURIComponent(screenKey || "")}`);

/** { screenKey, displayName, menuID, roles: [roleId], employees: [{ roleID, employeeID }] } — complete lists; left-out rows are switched off. */
export const saveScreenPageAccess = async (payload) => post(apiUrls.ScreenPageAccessSaveAccess, payload);

/** Active employees by name or id. `take = 0` returns every active employee. */
export const searchAccessUsers = async (search = "", take = 50) => {
  const q = new URLSearchParams({ take: String(take) });
  if (search) q.set("search", search);
  return get(`${apiUrls.ScreenBuilderSearchAccessUsers}?${q.toString()}`);
};
