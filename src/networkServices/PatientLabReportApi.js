import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * Lab Reports and Trends. Saving, deleting and opening a file show the global spinner; the reads do
 * not, because the screen shows its own placeholders while they load.
 */
const call = async (url, options, loud = false) => {
  if (loud) store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(url, options);
    if (loud) store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    if (loud) store.dispatch(setLoading(false));
    console.log(error, "SomeThing Went Wrong");
  }
};

export const PatientLabReportSave = (payload) =>
  call(`${apiUrls?.PatientLabReportSave}`, { method: "post", data: payload }, true);

export const PatientLabReportList = (patientID) =>
  call(`${apiUrls?.PatientLabReportList}?PatientID=${encodeURIComponent(patientID)}`, { method: "get" });

export const PatientLabReportGet = (reportID) =>
  call(`${apiUrls?.PatientLabReportGet}?ReportID=${Number(reportID)}`, { method: "get" });

export const PatientLabReportTrends = (patientID) =>
  call(`${apiUrls?.PatientLabReportTrends}?PatientID=${encodeURIComponent(patientID)}`, { method: "get" });

export const PatientLabReportFile = (reportID) =>
  call(`${apiUrls?.PatientLabReportFile}?ReportID=${Number(reportID)}`, { method: "get" }, true);

export const PatientLabReportDelete = (reportID) =>
  call(`${apiUrls?.PatientLabReportDelete}?ReportID=${Number(reportID)}`, { method: "post" }, true);
