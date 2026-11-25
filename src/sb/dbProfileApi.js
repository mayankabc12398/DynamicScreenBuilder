/** ScreenDbProfile API on the chosen backend (hospediav12-api ScreenBuilder/DbProfiles). */
import makeApiRequest from "@app/networkServices/axiosInstance";

const SILENT = { meta: { silent: true } };

export const listDbProfiles = () =>
  makeApiRequest("ScreenDbProfile/List", { method: "get", ...SILENT });

export const testDbProfile = (profile) =>
  makeApiRequest("ScreenDbProfile/Test", { method: "post", data: profile, ...SILENT });

export const saveDbProfile = (profile) =>
  makeApiRequest("ScreenDbProfile/Save", { method: "post", data: profile, ...SILENT });

export const deleteDbProfile = (id) =>
  makeApiRequest(`ScreenDbProfile/Delete?id=${encodeURIComponent(id)}`, { method: "post", ...SILENT });

/** Login/backend reachability: any HTTP answer at all means the URL points at a server. */
export async function pingBackend(apiBase) {
  try {
    const res = await fetch(`${apiBase}/ScreenBuilder/IsInstalled`, { method: "GET" });
    return { reachable: true, status: res.status };
  } catch (e) {
    return { reachable: false, error: e?.message || "Network error" };
  }
}
