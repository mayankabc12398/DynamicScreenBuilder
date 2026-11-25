import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * Doctor's View Consultation - vitals strip save.
 * POST VitalSign/SaveDoctorVitals { ID, TID, PID, AppID, Bp, P, R, T, Ht, Wt, SPO2, Allergy }
 * Updates only those eight values on the visit's vitals row (or inserts the row).
 * Silent: no global loader, it runs when a field loses focus.
 *
 * @returns {{ ok: boolean, id: number, message: string }}
 */
export const SaveDoctorVitals = async ({ id, tid, pid, appID, bp, p, r, t, ht, wt, spO2, allergy }) => {
  try {
    const resp = await makeApiRequest(apiUrls.SaveDoctorVitals, {
      method: "POST",
      data: {
        ID: Number(id) || 0,
        TID: String(tid ?? ""),
        PID: String(pid ?? ""),
        AppID: Number(appID) || null,
        Bp: bp ?? "",
        P: p ?? "",
        R: r ?? "",
        T: t ?? "",
        Ht: ht ?? "",
        Wt: wt ?? "",
        SPO2: spO2 ?? "",
        Allergy: allergy ?? "",
      },
    });
    if (resp?.success) {
      const d = resp?.data || {};
      return { ok: true, id: Number(d.ID ?? d.id ?? 0), message: resp?.message || "" };
    }
    if (resp === null || resp === undefined || resp?.status === 404) {
      return { ok: false, id: 0, message: "Vitals save needs the latest API build" };
    }
    return { ok: false, id: 0, message: resp?.message || "Vitals could not be saved" };
  } catch (error) {
    return { ok: false, id: 0, message: error?.message || String(error) };
  }
};
