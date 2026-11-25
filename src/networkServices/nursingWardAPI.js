import moment from "moment";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";
import { apiUrlsNew } from "./newApiEndpoints";
/* localStorage ki "ip" login par likhi jaati hai, jabki ye module uske pehle
   bhi load ho sakta hai (lazy chunk, ya logout ke baad jab localStorage saaf ho
   chuki hoti hai). Pehle ise module load par ek hi baar padha jaata tha, to wo
   khaali value poore session ke liye chipak jaati thi.

   Backend ka DTO IpAddress par [Required] lagata hai, aur Required khaali
   string ko bhi reject karta hai - isliye Collect par 400 "Please fill the
   IpAddress" aata tha. Ab har call par padhi jaati hai, aur na mile to wahi
   default jo login khud likhta hai (loginSlice). */
const FALLBACK_IP = "10.0.2.175";
const getIp = () => useLocalStorage("ip", "get") || FALLBACK_IP;

export const BindAvailablenurse = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.bindAvailablenurse, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindNursing_DischargeNoteAllApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.getNursing_DischargeNoteAll,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const bindAllergyListApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.bindAllergyList, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const bindAdmitToWardApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.bindAdmitToWard, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindGetEquipmentMasterAll = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.getEquipmentMasterAll, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindFloor = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.BindFloorNurse, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindRoomType = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.RoomTypeNurse, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SearchAssignNurse = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: {
        centreID: 1,
        caseTypeID: payload?.RoomType?.value,
        floorID: payload?.Floor?.label === "ALL" ? "0" : payload?.Floor?.label,
      },
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.SearchNurse, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveNurseAssignment = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.SaveNurseAssignment, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateRenalTransplantChecklistApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.saveOrUpdateRenalTransplantChecklist,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateDonorEvaluationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls.saveOrUpdateDonorEvaluation,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdatePatientFamilyConferenceApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls.saveOrUpdatePatientFamilyConference,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateDonorEvaluationTransplantApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls.saveOrUpdateDonorEvaluationTransplant,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateAdvancedDirectiveApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.saveOrUpdateAdvancedDirective,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateBrainDeathDiagnosisApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.saveOrUpdateBrainDeathDiagnosis,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateChemotherapyTreatmentSheetApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.saveOrUpdateChemotherapyTreatmentSheet,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveOrUpdateNutritionAssessmentApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.saveOrUpdateNutritionAssessment,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveAandETriageRecordApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.saveAandETriageRecord, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getListOfAandETriageApi = async (tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getListOfAandETriage}?TransactionID=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getRenalTransplantChecklistApi = async (pid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getRenalTransplantChecklist}?PatientID=${pid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getDonorEvaluationApi = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getDonorEvaluation}?PatientID=${PatientID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getDonorEvaluationTransplantApi = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getDonorEvaluationTransplant}?PatientID=${PatientID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getAdvancedDirectiveFullDetailsApi = async (tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getAdvancedDirectiveFullDetails}?transactionId=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getAllFieldsValueOfChecklistForRenalTransplantApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getAllFieldsValueOfChecklistForRenalTransplant}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getBrainDeathDiagnosisApi = async (tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getBrainDeathDiagnosis}?PatientId=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getChemotherapyTreatmentSheetApi = async (pid, tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getChemotherapyTreatmentSheet}?PatientId=${pid}&Transcationid=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const AETriageReportApi = async (id, tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.AETriageReport}?ID=${id}&TID=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getIntesiveCareUnitApacheApi = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.getIntesiveCareUnitApache}?PatientID=${PatientID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateAllergyApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.saveOrUpdateAllergy, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateIntesiveCareUnitApacheApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.saveOrUpdateIntesiveCareUnitApache,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const updateAntibioticChartApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.updateAntibioticChart, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const antibioticReportPrintApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.antibioticReportPrint, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveAntibioticChartApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.saveAntibioticChart, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SearchSampleCollection = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.SearchSampleCollectionWord,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SearchInvestigation = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.SearchInvestigation}?TransactionID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getListOfAntibioticChartApi = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.getListOfAntibioticChart}?TransactionID=${TransactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getPatientTransferChecklistApi = async (
  transactionID,
  patientId,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.getPatientTransferChecklist}?transactionID=${transactionID}&patientId=${patientId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getNutritionAssessmentApi = async (PatientId, transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.getNutritionAssessment}?PatientId=${PatientId}&TransactionId=${transactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetBarcodeInfo = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(`${apiUrls.GetBarcodeInfo}`, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SampleCollectionDiagonsis = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.SampleCollectionDiagonsis}?transactionID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SaveSamplecollectionAPI = async (data) => {
  store.dispatch(setLoading(true));
  let payload = {
    data: data,
    ipAddress: getIp(),
  };
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SaveSamplecollection, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SampleRejection = async (data) => {
  store.dispatch(setLoading(true));
  let payload = {
    ...data,
    ipAddress: getIp(),
  };
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SampleRejection, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const BindSampleType = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.BindSampleType}?LedgerTransactionNo=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Medication Reocrd
export const CategoryMedicationRecordNew = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.CategoryMedicationRecord}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const MedicineTimes = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.MedicineTimes}`, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const MedicineRoute = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.Route}`, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const MedicineFreQuency = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.FreQuency}`, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const BindMedicineGrid = async (payload) => {
  // store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.BindMedicineGrid, options);
    // store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    // store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  } finally {
    // store.dispatch(setLoading(false));
  }
};
export const AddOutsideMedication = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.AddOutsideMedication, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GiveOutsideMedication = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrlsNew.GiveOutsideMedication,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindMedicineDetail = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.BindMedicineDetail, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const MedicineDetailsSave = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.MedicineDetailsSave, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const VerifiedMedicineByQrCode = async (payload, userValidateID) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const url = `${apiUrls.VerifiedByQrCode}?UserValidateID=${encodeURIComponent(
      userValidateID ?? "",
    )}`;
    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Verify Medicine By QrCode", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const DiscontinueMedicine = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.DiscontinueMedicine, options);
    return data;
  } catch (error) {
    console.error("Error Discontinue Medicine", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const updateMedicineDetailAPI = async (data) => {
  store.dispatch(setLoading(true));

  let payload = {
    dose: data?.Dose ? data?.Dose : "",
    timing: data?.Timing?.value
      ? data?.Timing?.value
      : data?.Timing
        ? data?.Timing
        : "",
    duration: moment(new Date(data?.Duration)).format("yyyy-MM-DD"),
    updatedBy: data?.EName ? data?.EName : "",
    transactionID: data?.tid ? data?.tid : "",
    indentNo: data?.IndentNo ? data?.IndentNo : "",
    medicineID: data?.ItemID ? data?.ItemID : "",
  };

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SaveDoseDetails, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const MedicineDetailsCancel = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.MedicineDetailsCancel, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Medication Record - purane MedicationRecord.aspx jaisa (cpoe_medication_record).
// Sirf tab use hota hai jab fin_global_resources > IsMedicationEntryRow on ho.
export const BindMedicationRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = { method: "Post", data: payload };
    const data = await makeApiRequest(apiUrls.BindMedicationRecord, options);
    return data;
  } catch (error) {
    console.error("Error Bind Medication Record", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SaveMedicationRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = { method: "Post", data: payload };
    const data = await makeApiRequest(apiUrls.SaveMedicationRecord, options);
    return data;
  } catch (error) {
    console.error("Error Save Medication Record", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const CancelMedicationRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = { method: "Post", data: payload };
    const data = await makeApiRequest(apiUrls.CancelMedicationRecord, options);
    return data;
  } catch (error) {
    console.error("Error Cancel Medication Record", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SearchVitalSignChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.SearchVitalSignChart}?TID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveVitalSignChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrls.SaveVitalSignChart}`, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdateVitalSignChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateVitalSignChart}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SearchNursingProgress = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.SearchNursingProgress}?TransactionID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveNursingProgress = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveNursingProgress}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdateNursingProgress = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateClickNursingProgress}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const DeleteNursingProgress = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrls.DeleteNursingProgress}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Delete Nursing Progress", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const bindOxygenRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.bindOxygenRecord}?TID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const bindOxygenData = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.bindOxygenData}?TID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const validateOxygenRecord = async (payload) => {
  let payloadData = {
    dateOn: payload.oxygenDateON,
    timeOn: payload?.timeOn,
    dateOff: payload.dateOff,
    timeOff: payload?.timeOff,
    NurseTimeOff: payload?.nurseTimeOff?.value
      ? payload?.nurseTimeOff?.value
      : "",
    fillTimeOn: 0,
    equipment: payload?.equipment
      ? payload?.equipment?.label
      : payload?.equipment,
    equipmentId: payload?.equipment
      ? payload?.equipment?.value
      : payload?.equipment,
  };
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payloadData,
    };
    const data = await makeApiRequest(apiUrls.validateOxygenRecord, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveOxygenRecord = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SaveOxygenRecord, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdateOxygenRecord = async (payload) => {
  store.dispatch(setLoading(true));
  // payload.nurseTimeOn = payload.nurseTimeOn?.value
  //   ? payload.nurseTimeOn?.value
  //   : payload.nurseTimeOn;
  // payload.nurseTimeOff = payload.nurseTimeOff?.value
  //   ? payload.nurseTimeOff?.value
  //   : payload.nurseTimeOff;
  // payload.typeOfTherapy = payload.typeOfTherapy?.value
  //   ? payload.typeOfTherapy?.value
  //   : payload.typeOfTherapy;

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.UpdateOxygenRecord, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const bindGasBloodChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.bindGasBloodChart}?TID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SaveBloodGasChart = async (payload) => {
  store.dispatch(setLoading(true));
  payload.date = moment(payload?.date).format("yyyy-MM-DD");
  payload.time = moment(payload?.time).format("HH:mm");

  delete payload.type;

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.BloodGasChartSave, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdateBloodGasChart = async (payload) => {
  store.dispatch(setLoading(true));
  payload.date = moment(payload?.date).format("yyyy-MM-DD");
  payload.time = moment(payload?.time).format("HH:mm");
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.BloodGasChartUpdate, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BloodGasChartPrintOutAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: { tid: payload },
    };
    const data = await makeApiRequest(apiUrls.BloodGasChartPrintURL, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const createNursingNotesApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.createNursingNotes, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const PhysiologicalEarlyWarning = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.BindPhysiologicalEarlyWarning,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getNursingNote = async (transactionId, patientId) => {
  try {
    const options = {
      method: "get",
    };

    const data = await makeApiRequest(
      `${apiUrls?.getNursingNote}?transactionId=${transactionId}&patientId=${patientId}`,
      options,
    );

    return data;
  } catch (error) {
    console.log(error, "SomeThing Went Wrong");
  }
};

export const BindPhysiologicalAssessmentList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.PhysiologicalSearchAssessmentData}?TID=${payload}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const PEWSChartPrintOutAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.PhysiologicalEWSPrint}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const deleteNursingNoteAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(`${apiUrls.deleteNursingNote}`, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const deletePatientTransferChecklistApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.deletePatientTransferChecklist}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SaveEarlyWarningScoringDetails = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.SaveEarlyWarningScoringDetails,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const BindDiabiaticParticular = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.BindDiabiaticParticular, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindDiabaticInsulationMasterAll = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.getDiabaticInsulationMasterAll,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardDiabeticChartPrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.DiabeticChartPrintURL, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const BindDiabiaticChart = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.BindDiabiaticChart}?TransactionID=${TransactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const DiabeticChartSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.DiabeticChartSave, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const DiabeticChartUpdate = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "put",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.DiabeticChartUpdate, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindData = async (TransID, Date) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindData}?TransID=${TransID}&Date=${Date}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardIntakeOutPutChartPrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.NursingWardIntakeOutPutChartPrintURL}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindDetails = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindDetails}?TransactionID=${TransactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardNursingDischargeSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.NursingWardNursingDischargeSave,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardNursingDischargeDeleting = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.NursingWardNursingDischargeDeleting,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindNeedleName = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.NursingWardBindNeedleName,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardNeedleInjurySave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.NursingWardNeedleInjurySave,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindInjury = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.NursingWardBindInjury, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardNeedleInjuryPrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.NursingWardNeedleInjuryPrint,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindGraphTemp = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindGraphTemp}?TID=${transactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSerumBilirubinSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.NursingWardSerumBilirubinSave,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveIntake = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(apiUrls.NursingWardSaveIntake, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// baby chart

export const NursingWardGetBabyCharDetails = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetBabyCharDetails}?TID=${TransactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveBabyChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls?.NursingWardSaveBabyChart,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBabyChartPrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: { tid: payload },
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls?.NursingWardBabyChartPrintURL,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindPatientDetail = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      `${apiUrls?.NursingWardBindPatientDetail}?TID=${TID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveCheckList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls?.NursingWardSaveCheckList,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardDischargeCheckListPrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls?.NursingWardDischargeCheckListPrintURL,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateCheckList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls?.NursingWardUpdateCheckList,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Decreased Patient Details

export const NursingWardDeceasedSaveCheckList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.NursingWardDeceasedSaveCheckList,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardDeceasedUpdateCheckList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.NursingWardDeceasedUpdateCheckList,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindDeceasedPatientDetail = async (TID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      `${apiUrls?.NursingWardBindDeceasedPatientDetail}?TID=${TID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// adult feel risk assessMent

export const NursingWardSaveAssessMentRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.NursingWardSaveAssessMentRecord,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSearchAssessmentData = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      `${apiUrls?.NursingWardSearchAssessmentData}?TID=${transactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateAssessMentRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.NursingWardUpdateAssessMentRecord,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardAdultFallRiskPrintAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.NursingWardAdultFallRiskPrint,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardPatientDocumentDetail = async (
  TID,
  DocumentDate,
  FromDate = "",
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      `${apiUrls?.NursingWardPatientDocumentDetail}?TID=${TID}&DocumentDate=${DocumentDate}${FromDate ? `&FromDate=${FromDate}` : ""}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveViewUploadDocument = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.NursingWardSaveViewUploadDocument,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardBindBabyFeeding = async (TID, Date) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      `${apiUrls?.NursingWardBindBabyFeeding}?TID=${TID}&Date=${Date}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveBabyFeeding = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.NursingWardSaveBabyFeeding,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SampleCollUploadDocument = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      apiUrls?.SampleCollUploadDocument,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const bindSampleColleDocumentList = async (LedgerTransactionNo) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      `${apiUrls?.bindSampleColleDocumentURL}?TestID=${LedgerTransactionNo}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const handleOpenDocumentAPI = async (fileUrl) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    // api call to load currency detail/
    const data = await makeApiRequest(
      `${apiUrls?.SampleCollOpenDocumentURL}?LedgerTransactionNo=${LedgerTransactionNo}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getOncologyTreatmentRecordAPI = async (
  PatientID,
  TransactionId,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls?.getOncologyTreatmentRecord}?PatientID=${PatientID}&TransactionId=${TransactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error getOncology Treatment Record", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const PrintVitalSignChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    // api call to load currency detail/
    const data = await makeApiRequest(apiUrls?.PrintVitalSignChart, options);
    return data;
  } catch (error) {
    console.error("Error Add PrintVitalSignChart", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveRoomShiftRequset = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.NursingWardSaveRoomShiftRequset,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardSaveRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardRejectRoomShiftRequset = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.NursingWardRejectRoomShiftRequset,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardGetRoomShiftRequset = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.NursingWardGetRoomShiftRequset}?TransactionID=${TransactionID}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SearchPendingRequest = async (TID, Status = "") => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrlsNew.SearchPendingRequest}?TID=${TID}&Status=${Status ?? ""}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add SearchPendingRequest", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const saveMedicineTreatmentAndPrescriptionApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.saveMedicineTreatmentAndPrescription,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateOncologyTreatmentRecordApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.saveOrUpdateOncologyTreatmentRecord,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWard", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateMedicoLegalRegisterApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.saveOrUpdateMedicoLegalRegister,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWard", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getMedicineTreatmentAndPrescriptionApi = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.getMedicineTreatmentAndPrescription}?TransactionID=${TransactionID}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getHospitalRehabilitationFormApi = async (
  PatientId,
  TransactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.getHospitalRehabilitationForm}?PatientId=${PatientId}&TransactionId=${TransactionID}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getMedicoLegalRegisterApi = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.getMedicoLegalRegister}?PatientID=${PatientID}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add getMedicoLegalRegister", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const saveNursingWardCrossConsultationsApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.saveNursingWardCrossConsultations,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveHospitalRehabilitationFormApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.saveHospitalRehabilitationForm,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateHospitalInfectionControlApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.saveOrUpdateHospitalInfectionControl,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const getNursingWardCrossConsultationsApi = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.getNursingWardCrossConsultations}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const getHospitalInfectionControlApi = async (
  PatientId,
  TransactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.getHospitalInfectionControl}?PatientId=${PatientId}&TransactionId=${TransactionID}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add GetHospitalInfectionControl", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getPatientFamilyConferenceApi = async (
  PatientId,
  TransactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.getPatientFamilyConference}?PatientId=${PatientId}&TransactionId=${TransactionID}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add GetHospitalInfectionControl", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetNursingFormMasterAPI = async (type) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const url = `${apiUrls.GetNursingFormMasterURL}?Type=${type}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingFormEntryAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const url = `${apiUrls.NursingFormEntryURL}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingGetFormEntryAPI = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data: payload,
    };

    const url = `${apiUrls.NursingGetFormEntryURL}?vTransactionID=${TransactionID}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingPreviousMedicineEntryAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };

    const url = `${apiUrls.NursingPreviousMedicineEntryURL}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingGetPreviousMedicineEntryAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data: payload,
    };

    const url = `${apiUrls.NursingGetPreviousMedicineEntryURL}?vTransactionID=${payload}`;

    const data = await makeApiRequest(url, options);
    return data;
  } catch (error) {
    console.error("Error Add NursingWardGetRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardCrossConsultationStatusApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.nursingWardUpdateCrossconsultationStatus,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateOfferAndAcceptancePrivateWardApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };

    const data = await makeApiRequest(
      apiUrls?.saveOrUpdateOfferAndAcceptancePrivateWard,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardPrintNurNote = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrls?.NursingWardPrintNurNote}?TransactionID=${payload?.TransactionID}&isEmergency=${payload?.isEmergency}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardDeceasedSavePrint = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrls?.NursingWardDeceasedSavePrint}?TID=${TransactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getMonitoringChartData = async (PatientId, TransactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrls?.GetMonitoringChartData}?PatientId=${PatientId}&TransactionId=${TransactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getOfferAndAcceptancePrivateWardApi = async (
  PatientId,
  TransactionId,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrls?.getOfferAndAcceptancePrivateWard}?PatientId=${PatientId}&TransactionId=${TransactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add NursingWardRejectRoomShiftRequset", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SaveUpdateBloodTransfusionMonitoringChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.SaveOrUpdateBloodTransfusionMonitoringChart,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
// start shoib akhtar

export const SaveCalledPatient = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.SaveCalledPatient, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveUnCalledPatient = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.SaveUnCalledPatient, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const RecollectSample = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.RecollectSample, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SavePaediatricAdmissionRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.SavePaediatricAdmissionRecord,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdatePaediatricAdmissionRecord = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.UpdatePaediatricAdmissionRecord,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetdataPaediatricAdmissionRecord = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetdataPaediatricAdmissionRecord}?TransactionId=${transactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EmployeeLeaveInvestigation = async (Investigation_id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.EmployeeLeaveInvestigation}?Investigation_id=${Investigation_id}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const Employee_LeaveGetItems = async (params) => {
  const { categoryID, subCategoryID, itemName, IsHold, IsAll } = params;
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.Employee_LeaveGetItems}?categoryID=${categoryID}&subCategoryID=${subCategoryID}&itemName=${itemName}&IsHold=${IsHold}&IsAll=${IsAll}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetSubCategoryByCategory = async (categoryID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.GetSubCategoryByCategory}?categoryID=${categoryID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UnHoldItem = async (ItemID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.UnHoldItem}?ItemID=${ItemID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const CentreSetUpGetAllCategor = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.CentreSetUpGetAllCategor}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EditPaediatricAdmissionRecord = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.EditPaediatricAdmissionRecord}?id=${id}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetReceipientAndDonorData = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetReceipientAndDonorData}?PatientID=${PatientID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveReceipient = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SaveReceipient, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EmployeeLeaveHoldItem = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrlsNew.EmployeeLeaveHoldItem,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdateReceipient = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.UpdateReceipient, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SavePostPCI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SavePostPCI, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdatePostPCI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.UpdatePostPCI, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const PCIBindData = async (pid, tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
    };
    const data = await makeApiRequest(
      `${apiUrls.PCIBindData}?PID=${pid}&TID=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindMultipleDataByID = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindMultipleDataByID}?ID=${id}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindDetailsDeathNotice = async (tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindDetailsDeathNotice}?transactionID=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveDeathNotice = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SaveDeathNotice, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SaveTheatreProcedure = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.SaveTheatreProcedure, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindGridDetailTHEATREPROCEDURE = async (pid, tid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindGridDetailTHEATREPROCEDURE}?PatientID=${pid}&TransactionID=${tid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetEditTheatreProcedure = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetEditTheatreProcedure}?Id=${id}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdateTheatreProcedure = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.UpdateTheatreProcedure, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const saveFamilyConference = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.saveFamilyConference, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const UpdateFamilyConference = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.UpdateFamilyConference, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const bindGridDetail = async (pid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
    };
    const data = await makeApiRequest(
      `${apiUrls.bindGridDetail}?PatientID=${pid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetEditFamilyConference = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetEditFamilyConference}?Id=${id}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

//  dev mishra api start
export const NursingWardSaveTurningChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.NursingWardSaveTurning, options);
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardUpdateTurningChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateTurning,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardGetTurningChart = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetData}?TransactionId=${TransactionID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveAnaethesticChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSaveAnaethestic,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateAnaethesticChart = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateAnaethestic,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardGetAnaethesticChart = async (PatientId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetAnaethestic}?PatientId=${PatientId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveNewBornBaby = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.NursingWardSaveNewBorn, options);
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateNewBornBaby = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateNewBorn,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardGetNewBornList = async (transactionid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetNewBorn}?transactionid=${transactionid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveInternalNewBornBaby = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSaveInternalNewBorn,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateInternalNewBornBaby = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateInternalNewBorn,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardGetInternalNewBornList = async (transactionid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetInternalNewBorn}?transactionid=${transactionid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveNeonatalMonitoring = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSaveNeonatalIntensive,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateNeonatalMonitoring = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateNeonatalIntensive,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBindNeonatalMonitoring = async (PatientId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindNeonatalIntensive}?PatientId=${PatientId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardEditUpdateNeonatalMonitoring = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardDetailUpdateNeonatalIntensive}?ID=${ID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveConsentForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.NursingWardSaveConsent, options);
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateConsentForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateConsent,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBindConsentForm = async (PatientId, formType) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindConsent}?PatientId=${PatientId}&formType=${formType}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardEditConsentForm = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardEditConsent}?ID=${ID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveCPOTForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.NursingWardSaveCPOT, options);
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateCPOTForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.NursingWardUpdateCPOT, options);
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBindCPOTForm = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindCPOT}?ID=${ID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardEditCPOTForm = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardEditCPOT}?ID=${ID}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveLabourChartForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSaveLabourChart,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateLabourChartForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateLabourChart,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardGetLabourChartForm = async (transactionid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetLabourChart}?transactionid=${transactionid}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveLivkanNeclampsiaForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSaveLivkanNeclampsia,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdateLivkanNeclampsiaForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdateLivkanNeclampsia,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardGetLivkanNeclampsiaForm = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetLivkanNeclampsia}?transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardSavePartographForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSavePartograph,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardSaveTablePartographForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSaveTablePartograph,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const NursingWardUpdatePartographForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardUpdatePartograph,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardGetPartographForm = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetPartograph}?transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardGetTablePartographForm = async (
  patientId,
  transactionId,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardGetTablePartograph}?patientId=${patientId}&transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardSaveIntekPartographChartForm = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrls.NursingWardSaveIntekPartographChart,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardSearchPartographChartForm = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardSearchPartographChart}?transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBindFHRPartographChart = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindFHR}?transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBindCervixPartographChart = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardCervixDescent}?transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBindBPPartographChart = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardBindBpChart}?transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingWardBindPulsePartographChart = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };
    const data = await makeApiRequest(
      `${apiUrls.NursingWardPulseGraph}?transactionId=${transactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
// Dev mishra end API

//abhijeet Api Start

// abhijeet
export const getInvasiveDeviceDataApi = async (PatientId) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getInvasiveDeviceData}?PatientId=${PatientId}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveInvasiveDeviceDataApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveInvasiveDeviceData}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getSavedInvasiveDeviceDataApi = async (InvDevID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getSavedInvasiveDeviceData}?InvDevID=${InvDevID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const UpdateInvasiveDeviceFormApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.UpdateInvasiveDeviceForm}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const icuGetDataApi = async (TID, PID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.icuGetData}?TID=${TID}&PID=${PID}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const checklistGetDataApi = async () => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(`${apiUrls.checklistGetData}`, {
      method: "get",
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveTaskStatus = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveTaskStatus}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const loadChecklistApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.loadChecklist}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const bindDetailsApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.bindDetails}?transactionID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.save}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const bindCardioPulmonaryRasuasApi = async (PatientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.bindCardioPulmonaryRasuas}?PatientID=${PatientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getMultipleSavedDataApi = async (cardioResusId) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getMultipleSavedData}?cardioResusId=${cardioResusId}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveCardiopulmonaryApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveCardiopulmonary}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const update_CardiopulmonaryApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.update_Cardiopulmonary}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getNotificationFormDetailsApi = async (PatientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getNotificationFormDetails}?PatientID=${PatientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveNotificationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveNotification}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const updateNotificationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.updateNotification}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getUserNameApi = async (employeeID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getUserName}?EmpId=${employeeID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveJacksonVisual = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveJacksonVisual}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const updateJacksonVisualApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.updateJacksonVisual}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const jacksonVisualBindDetails = async (patientID, transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.jacksonVisualBindDetails}?PID=${patientID}&TID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const cautiCareBundleBindDetailsApi = async (
  patientID,
  transactionID,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.cautiCareBundleBindDetails}?PID=${patientID}&TID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const cautiCareBundleSaveDataApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.cautiCareBundleSaveData}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const cautiCareBundleUpdateDataApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.cautiCareBundleUpdateData}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const peripheralBindDetailsApi = async (patientID, transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.peripheralBindDetails}?PID=${patientID}&TID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const peripheralSaveDataApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.peripheralSaveData}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const patientAdmissionbindDetailsApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.patientAdmissionbindDetails}?TransactionID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const patientAdmissionbindSaveApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.patientAdmissionbindSave}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getCrrtFlowSheetMasterApi = async (patinetID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getCrrtFlowSheetMaster}?PatientID=${patinetID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveCRRTFlowSheetApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveCRRTFlowSheet}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getSavedCrrt_Multiple_Flowsheet = async (CRRTFlowsheetID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getSavedCrrt_Multiple_Flowsheet}?CRRTFlowsheetID=${CRRTFlowsheetID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const cRRTgetUserNameApi = async (employeeID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.cRRTgetUserName}?EmpId=${employeeID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const updateCrrtFlowSheetMasterApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.updateCrrtFlowSheetMaster}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const neurologicalBindDetailsApi = async (patientID, transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.neurologicalBindDetails}?PID=${patientID}&TID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const neurologicalSaveApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.neurologicalSave}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const neurologicalUpdateApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.neurologicalUpdate}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getDataPressureAreaCareApi = async (patientID, transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getDataPressureAreaCare}?PatientID=${patientID}&TransactionID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const savePresureAreaCareFormApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.savePresureAreaCareForm}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getUserNamePressureAreaCareApi = async (employeeID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.getUserNamePressureAreaCare}?EmpId=${employeeID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const editdataApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.editdata}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const bindDataVENOUSApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.bindDataVENOUS}?transactionID=${transactionID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveDataVENOUSApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveDataVENOUS}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveData1VENOUSApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveData1VENOUS}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const saveData2VENOUSApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveData2VENOUS}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveData3VENOUSApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveData3VENOUS}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveData4VENOUSApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.saveData4VENOUS}`, {
      method: "post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const getAllAdmittedPatientApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrls?.getAllAdmittedPatient}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add getAllAdmittedPatient", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getPatientWithoutServiceLast24hoursApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrls?.getPatientWithoutServiceLast24hours}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add getPatientWithoutServiceLast24hours", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const getIPDPatientsearchReportApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.getIPDPatientsearchReport}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const getViewIPDAdmissionRemarkApi = async (TransactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrlsNew?.getViewIPDAdmissionRemark}?TransactionId=${TransactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add getViewIPDAdmissionRemark", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// HEMODIALYSIS CHART Api Syart Abhijeet

export const getHemodialysis_Pre_Dialysis_VitalApi = async (
  transactionID,
  patientID,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getHemodialysis_Pre_Dialysis_Vital}?Tid=${transactionID}&Pid=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const saveHemodialysis_Pre_Dialysis_VitalApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveHemodialysis_Pre_Dialysis_Vital}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const updateHemodialysis_Pre_Dialysis_VitalApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.updateHemodialysis_Pre_Dialysis_Vital}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const saveHemodialysis_Dialysis_OrderApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveHemodialysis_Dialysis_Order}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const getHemodialysis_Dialysis_OrderApi = async (
  transactionID,
  patientID,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getHemodialysis_Dialysis_Order}?Tid=${transactionID}&Pid=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const updateHemodialysis_Dialysis_OrderApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.updateHemodialysis_Dialysis_Order}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const saveHemodialysis_Machine_CheckApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveHemodialysis_Machine_Check}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const getHemodialysis_Machine_CheckApi = async (
  transactionID,
  patientID,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getHemodialysis_Machine_Check}?Tid=${transactionID}&Pid=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const UpdateHemodialysis_Machine_CheckApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.UpdateHemodialysis_Machine_Check}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const saveHemodialysis_Dialysis_ExaminationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveHemodialysis_Dialysis_Examination}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const getHemodialysis_Dialysis_ExaminationApi = async (
  transactionID,
  patientID,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getHemodialysis_Dialysis_Examination}?Tid=${transactionID}&Pid=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const UpdateHemodialysis_Dialysis_ExaminationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.UpdateHemodialysis_Dialysis_Examination}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const bindGrid = async (transactionID, patientID, id) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindGrid}?Tid=${transactionID}&Pid=${patientID}&Id=${id}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const getHemodialysis_Intra_Dialytic_ObservationApi = async (
  transactionID,
  patientID,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getHemodialysis_Intra_Dialytic_Observation}?Tid=${transactionID}&Pid=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const saveHemodialysis_Intra_Dialytic_ObservationApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveHemodialysis_Intra_Dialytic_Observation}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const updateHemodialysis_Intra_Dialytic_ObservationApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.updateHemodialysis_Intra_Dialytic_Observation}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const getHemodialysis_Post_Dialytic_ObservationApi = async (
  transactionID,
  patientID,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getHemodialysis_Post_Dialytic_Observation}?Tid=${transactionID}&Pid=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const saveHemodialysis_Post_Dialytic_ObservationApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveHemodialysis_Post_Dialytic_Observation}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const updateHemodialysis_Post_Dialytic_ObservationApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.updateHemodialysis_Post_Dialytic_Observation}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const getDiagnosisApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getDiagnosis}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const saveDiagnosisApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.saveDiagnosis}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const updateDiagnosisApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.updateDiagnosis}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

// HEMODIALYSIS CHART Api Abhijeet End

export const getPatientFinalMsgApi = async (TransactionId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(
      `${apiUrlsNew?.getPatientFinalMsg}?TransactionId=${TransactionId}`,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add getPatientFinalMsg", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const handleUpdateBloodTransfusionMonitoringChartDTO = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrls.UpdateBloodTransfusionMonitoringChartDTO,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// CATHLAB INVASIVE PROCEDURE REPORT Abhijeet Start

export const getCathLabInvasiveProcDetailsApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.getCathLabInvasiveProcDetails}?TransactionId=${transactionID}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveOrUpdateCathLabInvasiveProcApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveOrUpdateCathLabInvasiveProc}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

// CATHLAB INVASIVE PROCEDURE REPORT Abhijeet End

// Obstetric Record Start Abhijeet
export const getObstetricRecordFormsApi = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(apiUrlsNew.getObstetricRecordForms, {
      method: "POST",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveOrUpdateObstetricRecordFormsApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.saveOrUpdateObstetricRecordForms}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
// Obstetric Record Abhijeet  End

// CHECK LIST FOR OPEN HEART SURGERY Abhijeet  start

export const bindDataLaboratoryApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDataLaboratory}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveLaboratoryApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.saveLaboratory}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindBioMedicalDataApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindBioMedicalData}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const saveBiomedicalApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.saveBiomedical}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDentalDataApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDentalData}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_DentalApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Dental}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindPhysiotherapyDataApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindPhysiotherapyData}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_PhysiotherapyApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Physiotherapy}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindWardDataApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindWardData}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_WardApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Ward}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const bindFollowUpDataApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindFollowUpData}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_FollowApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Follow}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindThreatreDataApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindThreatreData}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_TheatreApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Theatre}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindICUDataApi = async (transactionID, patientID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindICUData}?TID=${transactionID}&PID=${patientID}`,
      {
        method: "POST",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_ICUApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_ICU}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const bindAllergyTypeListApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.bindAllergyTypeList}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const saveOrUpdateAllergyTypeApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    // api call to load currency detail
    const data = await makeApiRequest(
      apiUrlsNew.saveOrUpdateAllergyType,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
//  // CHECK LIST FOR OPEN HEART SURGERY Abhijeet end
export const handleSavePatientAllergy = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.SavePatientAllergy, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetBindPatientAllergyList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(
      apiUrlsNew.GetPatientAllergyList,
      options,
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const handleDeletePatientAllergy = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.DeletePatientAllergy, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const ICUSafetyCheckListReport = async (pid, tid) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.ICUSafetyCheckListReport}?PId=${pid}&TID=${tid}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const LeavingAgainstMedicalAdvicePdf = async (pid, tid) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.LeavingAgainstMedicalAdvicePdf}?TransactionId=${tid}&PatientId=${pid}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const GetOutsideMedication = async (tid) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.GetOutsideMedication}?TransactionId=${tid}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};
export const GetRoomShiftRequestList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.GetRoomShiftRequestList, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const CancelRoomShiftRequest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrlsNew.CancelRoomShiftRequest, options);
    return data;
  } catch (error) {
    console.error("Error CancelRoomShiftRequest", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// IPD frame tab "Nurses Initial Assessment - Emergency Department" (NursingERAssessment).
export const NursingERGetAssessmentAPI = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.NursingERGetAssessment}?TransactionID=${transactionID}`, options);
    return data;
  } catch (error) {
    console.error("Error NursingERGetAssessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingERSaveAssessmentAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.NursingERSaveAssessment, options);
    return data;
  } catch (error) {
    console.error("Error NursingERSaveAssessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const NursingERPrintAssessmentAPI = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.NursingERPrintAssessment}?TransactionID=${transactionID}`, options);
    return data;
  } catch (error) {
    console.error("Error NursingERPrintAssessment", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// IPD frame tab "Peripheral Cannula Care Bundle" (PeripheralCannula).
export const PeripheralCannulaGetAPI = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.PeripheralCannulaGet}?TransactionID=${transactionID}`, options);
    return data;
  } catch (error) {
    console.error("Error PeripheralCannulaGet", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const PeripheralCannulaSaveAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.PeripheralCannulaSave, options);
    return data;
  } catch (error) {
    console.error("Error PeripheralCannulaSave", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const PeripheralCannulaDeleteAPI = async (id, transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
    };
    const data = await makeApiRequest(`${apiUrls.PeripheralCannulaDelete}?ID=${id}&TransactionID=${transactionID}`, options);
    return data;
  } catch (error) {
    console.error("Error PeripheralCannulaDelete", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const PeripheralCannulaPrintAPI = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.PeripheralCannulaPrint}?TransactionID=${transactionID}`, options);
    return data;
  } catch (error) {
    console.error("Error PeripheralCannulaPrint", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// IPD frame tab "Fall Risk Assessment (SAIH271)".
export const FallRiskSAIHGetAPI = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.FallRiskSAIHGet}?TransactionID=${transactionID}`, options);
    return data;
  } catch (error) {
    console.error("Error FallRiskSAIHGet", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const FallRiskSAIHSaveAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.FallRiskSAIHSave, options);
    return data;
  } catch (error) {
    console.error("Error FallRiskSAIHSave", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const FallRiskSAIHPrintAPI = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.FallRiskSAIHPrint}?TransactionID=${transactionID}`, options);
    return data;
  } catch (error) {
    console.error("Error FallRiskSAIHPrint", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Emergency > "Emergency Initial Assessment" (EmergencyInitialAssessment) - filled before admission,
// records numbered 001, 002... per centre.
export const EmergencyIARNextNoAPI = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(apiUrls.EmergencyIARNextNo, options);
    return data;
  } catch (error) {
    console.error("Error EmergencyIARNextNo", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EmergencyIARGetPatientAPI = async (search) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.EmergencyIARGetPatient}?Search=${encodeURIComponent(search)}`, options);
    return data;
  } catch (error) {
    console.error("Error EmergencyIARGetPatient", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EmergencyIARSearchAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.EmergencyIARSearch, options);
    return data;
  } catch (error) {
    console.error("Error EmergencyIARSearch", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EmergencyIARGetAPI = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.EmergencyIARGet}?ID=${id}`, options);
    return data;
  } catch (error) {
    console.error("Error EmergencyIARGet", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EmergencyIARSaveAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data: payload,
    };
    const data = await makeApiRequest(apiUrls.EmergencyIARSave, options);
    return data;
  } catch (error) {
    console.error("Error EmergencyIARSave", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const EmergencyIARPrintAPI = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.EmergencyIARPrint}?ID=${id}`, options);
    return data;
  } catch (error) {
    console.error("Error EmergencyIARPrint", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
