import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";
import { notify } from "../utils/utils";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { apiUrlsNew } from "./newApiEndpoints";

export const Oldpatientsearch = async (searchKey, Type = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.Oldpatientsearch}?SearchKey=${searchKey}&Type=${Type}`,
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

export const PatientSearchbyBarcode = async (PatientID, PatientRegStatus) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PatientSearchbyBarcode}?PatientID=${PatientID}&PatientRegStatus=${PatientRegStatus}`,
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

export const SaveAdvanceAmount = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SaveAdvanceAmount}`, {
      method: "Post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const SaveInvItemCheckList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SaveInvItemCheckList}`, {
      method: "Post",
      data: payload,
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const bindPanelByPatientID = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.bindPanelByPatientID}?PatientId=${id}`,
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

export const getBindPanelListforchangedetails = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetPanelName}?PanelGroup=${"ALL"}`,
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
// export const getBindPanelListforchangedetails = async()=>{
// //  debugger
//   store.dispatch(setLoading(true));
//     try {
//       const data = await makeApiRequest(
//         `${apiUrls.GetPanelName}?PanelGroup=${"ALL"}`,
//         {
//           method: "get",
//         }
//       );
//       dispatch(setLoading(false));
//       return data;
//     } catch (e) {
//       store.dispatch(setLoading(false));
//     throw error;
//     }
//   }

// export const bindPanel = async (id) => {
//   store.dispatch(setLoading(true));
//   try {
//     const data = await makeApiRequest(
//       `${apiUrls.bindPanelByPatientID}`,
//       {
//         method: "get",
//       }
//     );
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     throw error;
//   }
// };
export const GetInvCheckListMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetInvCheckListMaster}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// master_fieldboy ki active list - OPD Booking ke Field Boy dropdown ke liye.
export const BindFieldBoy = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.BindFieldBoy, { method: "get" });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Ek hi call add aur edit dono ke liye: fieldBoyID 0 gaya to naya row banta hai,
// warna usi row ka naam / contact / address update ho jata hai.
export const SaveFieldBoy = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveFieldBoy, {
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

export const BindPRO = async (referDoctorID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindPRO}?referDoctorID=${referDoctorID}`,
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


// OPD Booking expired-document alert (key ShowExpiredDocumentAlert): the patient's documents
// whose latest upload is past its expiry date. data: [{ DocumentName, ExpiryDate }]
export const GetExpiredPatientDocuments = async (patientID) => {
  try {
    return await makeApiRequest(
      `${apiUrls.GetExpiredPatientDocuments}?PatientID=${encodeURIComponent(patientID)}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  }
};

// Patient Encounter History OPD / IPD tabs: every OPD visit or IPD admission of the patient, newest first.
// filters (optional): { chkDate: "1"/"0", fromDate, toDate (YYYY-MM-DD), CenterID ("All" or id) }
export const GetPatientIPDAdmissions = async (patientID, type = "IPD", filters = {}) => {
  try {
    return await makeApiRequest(
      `${apiUrls.GetPatientIPDAdmissions}?PatientID=${encodeURIComponent(patientID)}&Type=${type}` +
        `&chkDate=${filters?.chkDate ?? "0"}&fromDate=${filters?.fromDate ?? ""}&toDate=${filters?.toDate ?? ""}&CentreID=${filters?.CenterID ?? "All"}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  }
};

// OPD Booking parent-panel rule: doctors with an OPD timing for the given consultation
// subcategories (comma separated). data: ["DoctorID", ...]
export const OPDDoctorsBySubCategory = async (subCategoryIDs) => {
  try {
    return await makeApiRequest(
      `${apiUrls.OPDDoctorsBySubCategory}?SubCategoryIDs=${encodeURIComponent(subCategoryIDs)}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  }
};

// OPD Booking: is this patient admitted in IPD right now? data: { IsAdmitted, IPDNo, AdmitDate }
export const GetPatientIPDAdmissionStatus = async (patientID) => {
  try {
    return await makeApiRequest(
      `${apiUrls.GetPatientIPDAdmissionStatus}?PatientID=${encodeURIComponent(patientID)}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: { IsAdmitted: 0 } };
  }
};

export const GetOPDSources = async () => {
  try {
    return await makeApiRequest(apiUrls.GetOPDSources, { method: "get" });
  } catch {
    return { status: false, data: [] };
  }
};

export const GetPatientRemarks = async (patientID) => {
  try {
    return await makeApiRequest(
      `${apiUrls.GetPatientRemarks}?PatientID=${encodeURIComponent(patientID)}`,
      { method: "get" },
    );
  } catch (error) {
    return { success: false, data: [] };
  }
};


export const SavePatientRemark = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SavePatientRemark, {
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

export const GetBindDoctorDept = async (Department) => {
  store.dispatch(setLoading(true));
  try {
    let centerID = useLocalStorage("userData", "get");
    const data = await makeApiRequest(
      `${apiUrls.BindDoctorDept}?Department=${encodeURIComponent(Department)}&CentreID=${centerID?.centreID ? centerID?.centreID : 1}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const BindHospitalDepartmentAPI = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.BindHospitalDepartmentURL}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBindDoctorforChangePatient = async (Department) => {
  store.dispatch(setLoading(true));
  try {
    let userData = useLocalStorage("userData", "get");
    const data = await makeApiRequest(
      `${apiUrls.BindDoctorDept}?Department=${Department}&CentreID=${userData?.centreID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetRoleWiseOPDServiceBookingControls = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.RoleWiseOPDServiceBookingControls}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetLoadOPD_All_ItemsLabAutoComplete = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.LoadOPD_All_ItemsLabAutoComplete}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data?.data ? data : { ...data, data: [] };
  } catch {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetPackageExpirayDate = async (PackageID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PackageExpirayDate}?PackageID=${PackageID}`,
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

export const GetValidateDoctorMap = async (itemID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ValidateDoctorMap}?itemID=${itemID}`,
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

export const GetValidateDoctorLeave = async (itemID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ValidateDoctorLeave}?itemID=${itemID}`,
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

export const getAlreadyPrescribeItem = async (PatientID, ItemID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.getAlreadyPrescribeItem}?PatientID=${PatientID}&ItemID=${ItemID}`,
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

export const GetDiscountWithCoPay = async (
  itemID,
  panelID,
  patientTypeID,
  memberShipCardNo,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDiscountWithCoPay}?itemID=${itemID}&panelID=${panelID}&patientTypeID=${patientTypeID}&memberShipCardNo=${memberShipCardNo}`,
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

export const GetBindLabInvestigationRate = async (
  panelID,
  itemID,
  CategoryID,
  IsInternational,
  TID,
  IPDCaseTypeID,
  panelCurrencyFactor,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.BindLabInvestigationRate, {
      method: "post",
      data: {
        panelID: panelID,
        itemID: itemID,
        CategoryID: CategoryID,
        IsInternational: IsInternational,
        tid: TID,
        ipdCaseTypeID: IPDCaseTypeID,
        panelCurrencyFactor: panelCurrencyFactor,
      },
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GetAppointmentCount = async (doctorID, appointmentDate) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetAppointmentCount}?doctorID=${doctorID}&appointmentDate=${appointmentDate}`,
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
export const PackageDetail = async (LedgerTransactionNo) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PackageDetail_report}?LedgerTransactionNo=${LedgerTransactionNo}`,
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

// export const SearchOPDBillsData = async (params) => {
//   try {
//     const options = {
//       method: "POST",
//       data: params,
//     };
//     const data = await makeApiRequest(`${apiUrls.SearchOPDBills}`, {
//       method: "post",
//       data: params,
//     });
//     console.log("Asdasdas", data);
//     return data;
//   } catch {
//     throw error;
//   }
// };

export const SearchOPDBillsData = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.SearchOPDBills}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const SaveOPDSettlement = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(`${apiUrls.SaveOPDSettlement}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const GetSwipMachine = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.GetSwipMachine}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log("Error Occure", error);
  }
};

export const ReceiptDetailnew = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.GetReceiptDetailnew}`,
      options,
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log("Error Occure", error);
  }
};
export const ReceiptBillClose = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.OPDBillClosed}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log("Error Occure", error);
  }
};

export const GetDoctorAppointmentTimeSlotConsecutive = async (
  doctorID,
  appointmentDate,
  subCategoryID = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDoctorAppointmentTimeSlotConsecutive}?DocId=${doctorID}&date=${appointmentDate}&SubCategoryID=${subCategoryID || 0}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const BindPackageItemDetailsNew = async (PackageID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindPackageItemDetailsNew}?PackageID=${PackageID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const GetInvestigationTimeSlot = async (
  Date,
  CentreID,
  SubCategoryID,
  ModalityID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetInvestigationTimeSlot}?Date=${Date}&CentreID=${CentreID}&SubCategoryID=${SubCategoryID}&ModalityID=${ModalityID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const BindModality = async (SubcategoryID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindModality}?SubcategoryID=${SubcategoryID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const HoldTimeSlot = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.HoldTimeSlot, {
      method: "post",
      data: params,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const GetEligiableDiscountPercent = async (employeeID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetEligiableDiscountPercent}?employeeID=${employeeID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const CheckblacklistAPI = async (MRNo, ContactNo) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.checkblacklist}?patientID=${MRNo}&molbileno=${ContactNo}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PatientControlGetOutStanding = async (MRNo) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PatientControlGetOutStanding}?patientID=${MRNo}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const ValidateForNotGeneratedInviceAndNotPaid = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ValidateForNotGeneratedInviceAndNotPaid}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const GetDiscReasonList = async (type) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetDiscReason}?Type=${type}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const BindDisApprovalList = async (HOSPITAL, type) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindDisApproval}?approvalType=${HOSPITAL}&type=${type}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const GetGlobalResources = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetGlobalResources}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const GetDiscountApprovalList = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetDiscountApprovalList}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const SendDiscountOTP = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SendDiscountOTP}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const SaveDiscountOTP = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SaveDiscountOTP}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

/* The urgent marks for a patient's prescribed tests. Kept apart from
   BindInvestigation because that one is a stored procedure several screens share;
   this is a plain read the CPOE popup joins on PatientTest_ID. An empty result is
   the ordinary case - nothing urgent. */
export const GetUrgentPrescribedTests = async (patientID, fromDate, toDate) => {
  store.dispatch(setLoading(true));
  try {
    let url = `${apiUrls.GetUrgentPrescribedTests}?patientID=${patientID}`;
    if (fromDate && toDate) url += `&fromDate=${fromDate}&toDate=${toDate}`;
    const data = await makeApiRequest(url, { method: "get" });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const BindInvestigation = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.BindInvestigation, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const ApprovalSearchOPDBills = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.ApprovalSearchOPDBills, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const ApprovalGetApprovalExcel = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ApprovalGetApprovalExcel}?serviceType=${payload?.serviceType}&filterType=${payload?.filterType}&searchvalue=${payload?.searchValue}&searchtype=${payload?.searchType}&fromDate=${payload?.fromDate}&toDate=${payload?.toDate}&centreId=${payload?.centreID ?? ""}&paymentModeId=${encodeURIComponent(payload?.paymentModeID ?? "")}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const DebitCreditSearchPatientForApproval = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.DebitCreditSearchPatientForApproval}?patientID=${payload?.patientID}&patientName=${payload?.patientName}&billNo=${payload?.billNo}&fromdate=${payload?.fromdate}&todate=${payload?.todate}&Type=${payload?.Type}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const ApprovalApprovedPaymentItemWise = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.ApprovalApprovedPaymentItemWise, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const DebitCreditRejectCreditDebitItem = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      apiUrls.DebitCreditRejectCreditDebitItem,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const ApprovalApprovedCashCopayPaymentItemWise = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      apiUrls.ApprovalApprovedCashCopayPaymentItemWise,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
// SRS-2026-0056 point 14. Asks the API whether this patient may be given their service
// yet: paid in full, or the item approved. Enforced only when fin_global_resources
// 'ServiceApprovalRequired' = '1'; otherwise the API replies allowed for everyone.
//
// Pass transactionID whenever the screen knows it (Doctor OPD, Sample Collection) so the
// check targets that exact bill. Triage only knows the UHID, and the API then limits
// itself to today's bills.
//
// Deliberately does NOT dispatch the global loader: this runs as a gate on a click, and a
// full-screen spinner on every row action would be worse than the wait.
export const ApprovalCheckServiceApproval = async (patientID, transactionID) => {
  try {
    const qs = `?patientID=${encodeURIComponent(patientID ?? "")}` +
      (transactionID ? `&transactionID=${encodeURIComponent(transactionID)}` : "");
    return await makeApiRequest(`${apiUrls.ApprovalCheckServiceApproval}${qs}`, {
      method: "get",
    });
  } catch (error) {
    console.log(error, "error");
    // Never let a check failure stop a patient being treated.
    return { success: false, data: { Required: false, Allowed: true } };
  }
};

export const ApprovalGetItemToApproved = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.ApprovalGetItemToApproved, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const DebitCreditSaveCreditDebitSaveForApproval = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      apiUrls.DebitCreditSaveCreditDebitSaveForApproval,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};


// One registration charge per doctor per day: tells the booking screen whether
// this patient was already booked TODAY with this same doctor.
export const GetIsDoctorVisitedToday = async (PatientID, DoctorID) => {
  const cleanPatientID = String(PatientID ?? "").trim();
  const cleanDoctorID = String(DoctorID ?? "").trim();
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetIsDoctorVisitedToday}?PatientID=${cleanPatientID}&DoctorID=${cleanDoctorID}`,
      {
        method: "get",
      },
    );
    return data;
  } catch (error) {
    console.log(error, "error");
  }
};

export const GetLastVisitDetail = async (PatientID, DoctorID) => {
  store.dispatch(setLoading(true));
  // DoctorID/PatientID can arrive space-padded from the patient-search response
  // (CHAR columns), which reaches the server as "5  " and breaks the lookup.
  const cleanPatientID = String(PatientID ?? "").trim();
  const cleanDoctorID = String(DoctorID ?? "").trim();
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetLastVisitDetail}?PatientID=${cleanPatientID}&DoctorID=${cleanDoctorID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const LastVisitDetails = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.LastVisitDetails}?patientID=${PatientID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const PanelControlGetPatientData = async (Payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelControlGetPatientData}?chkDate=${Payload?.chkDate}&patientId=${Payload?.patientId}&encounterNo=${Payload?.encounterNo}&fromDate=${Payload?.fromDate}&toDate=${Payload?.toDate}&isEmg=${Payload?.isEmg}&CenterID=${Payload?.CenterID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const bindHashCode = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.bindHashCode}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const SaveCreditDebitDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SaveCreditDebitDetails}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
// DrCr Approval access: true when the user has CanApproveCRDR (EDP > User Access).
export const GetCRDRApprovalAuthorization = async () => {
  try {
    return await makeApiRequest(`${apiUrls.GetCRDRApprovalAuthorization}`, {
      method: "get",
    });
  } catch (error) {
    console.log(error, "error");
    return { success: false, data: false };
  }
};
// Header bell: number of CR/DR notes waiting in DrCr Approval ({ show, count }); show is false for a
// user without the "Can Approve Credit/Debit Note ?" right.
export const GetPendingCRDRApprovalCount = async () => {
  try {
    return await makeApiRequest(`${apiUrls.GetPendingCRDRApprovalCount}`, {
      method: "get",
    });
  } catch (error) {
    return { success: false, data: { show: false, count: 0 } };
  }
};
// "Can Change Doctor Receipt ?" (EDP > User Access): true when this user may change the doctor on a receipt.
export const GetDoctorChangeReceiptAuthorization = async () => {
  try {
    return await makeApiRequest(`${apiUrls.GetDoctorChangeReceiptAuthorization}`, {
      method: "get",
    });
  } catch (error) {
    console.log(error, "error");
    return { success: false, data: false };
  }
};
export const PanelControlSearchPatient = async (PatientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelControlSearchPatient}?PatientID=${PatientID}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PanelControlpanelband = async (patinetid) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelControlpanelband}?patientID=${patinetid}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const DebitCreditGetPatientDetailsdeitcredit = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.DebitCreditGetPatientDetailsdeitcredit}?transactionID=${transactionID}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PanelControlsearchlounumber = async (LOUNo) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelControlsearchlounumber}?LOUNo=${LOUNo}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PanelControlsavepaneldetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelControlsavepaneldetails}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PanelControlUpdatePanelDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelControlUpdatePanelDetails}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const SaveLabPrescriptionOPD = async (payload) => {
  // debugger;
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SaveLabPrescriptionOPD}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const KRABindbilldataBindBillData = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.KRABindbilldataBindBillData}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const KRABindbilldataPushToKRA = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.KRABindbilldataPushToKRA}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const StickerPrintVisitWiseReport = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.StickerPrintVisitWiseReport}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const BindSmartCardCheckAndSlade = async (PanelID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindSmartCardCheckAndSlade}?PanelID=${PanelID}`,
      {
        method: "get",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const BankAPIBankAPIInserAndInitiatePayment = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BankAPIBankAPIInserAndInitiatePayment}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const GetMemberDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetMemberDetails}?patientid=${payload?.patientid}&panelid=${payload?.panelid}&IntegrationId=${payload?.IntegrationId}`,
      {
        method: "post",
        // data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const BankAPIBankAPIGetResponse = async (payload) => {
  // store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BankAPIBankAPIGetResponse}?PaymentReqID=${payload?.merchantRequestID}&CheckoutRequestID=${payload?.checkoutRequestID}`,
      {
        method: "get",
        // data: payload,
      },
    );
    // store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    // store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const SavePharmacyIssueApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SavePharmacyIssue}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const GetPendingResultEntryPdfApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PrintResultEntryPendingList}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const OPDGetChangeBillDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.OPDGetChangeBillDetails}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
/** Changes the refer doctor on the OPD bills ticked on Change Patient Detail. */
export const OPDUpdateBillReferDoctor = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.OPDUpdateBillReferDoctor}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDUpdateBillDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.OPDUpdateBillDetails}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const ChangeTransactionalPanel = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.ChangeTransactionalPanel}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const ChangePatientRelationDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ChangePatientRelationDetail}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const OPDPatientRelationDetail = async (TransactionId, PatientID = "") => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDPatientRelationDetail}?TransactionId=${TransactionId}&PatientID=${encodeURIComponent(PatientID)}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const OPDChangeTransactionalDoctor = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDChangeTransactionalDoctor}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDGetBillServiceDoctors = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDGetBillServiceDoctors}?TransactionId=${transactionID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDChangeServiceDoctor = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.OPDChangeServiceDoctor}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDCheckServiceDoctorRate = async (
  oldDoctorID,
  newDoctorID,
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDCheckServiceDoctorRate}?OldDoctorID=${oldDoctorID}&NewDoctorID=${newDoctorID}&TransactionId=${transactionID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDBindUnitDoctors = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.OPDBindUnitDoctors}`, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDChangeUnitDoctor = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.OPDChangeUnitDoctor}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

// Change Patient Detail > Change Lab Doctor (investigation bill, no appointment).
export const OPDChangeInvestigationDoctor = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.OPDChangeInvestigationDoctor}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDDoctorConsulationData = async (doctorID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDDoctorConsulationData}?DoctorID=${doctorID}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const OPDGetIsFollowUpExist = async (PatientID, DoctorID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDGetIsFollowUpExist}?DoctorID=${DoctorID}&PatientID=${PatientID}  `,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const CheckPanelWiseRate = async (PanelID, TransactionId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDCheckPanelWiseRate}?PanelID=${PanelID}&TransactionId=${TransactionId}  `,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const OPDCheckDoctorWiseRate = async (DoctorID, TransactionId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.OPDCheckDoctorWiseRate}?DoctorID=${DoctorID}&TransactionId=${TransactionId}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const CommonAPIBindOPDAdvanceMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.CommonAPIBindOPDAdvanceMaster, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const GetOpdPackageDetail = async (PackageId, LedgerTransactionNo) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetOpdPackageDetail}?PackageId=${PackageId}&LedgerTransactionNo=${LedgerTransactionNo}`,
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PatientControlSearchBlacklist = async (
  PID,
  contact,
  pname,
  fromRegistrationDate,
  toRegistrationDate,
  // Visit-side filters of the OPD Patient screen; other callers omit them and
  // the request goes out exactly as before.
  doctorID,
  referDoctorID,
  specialization,
  abhaNo,
) => {
  store.dispatch(setLoading(true));
  try {
    let url = `${apiUrls.PatientControlSearchBlacklist}?PID=${PID}&contact=${contact}&pname=${pname}`;
    // Registration-date range — appended only when provided, so other callers
    // (e.g. PatientBlackList) are unaffected.
    if (fromRegistrationDate) {
      url += `&FromRegistrationDate=${fromRegistrationDate}`;
    }
    if (toRegistrationDate) {
      url += `&ToRegistrationDate=${toRegistrationDate}`;
    }
    if (doctorID) {
      url += `&DoctorID=${doctorID}`;
    }
    if (referDoctorID) {
      url += `&ReferDoctorID=${referDoctorID}`;
    }
    if (specialization) {
      url += `&Specialization=${encodeURIComponent(specialization)}`;
    }
    // OPD Patient screen: search by ABHA ID (omitted by every other caller)
    if (abhaNo) {
      url += `&AbhaNo=${encodeURIComponent(abhaNo)}`;
    }
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PatientControlAddToBlacklist = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PatientControlAddToBlacklist}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsSaveFutureInv = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsSaveFutureInv}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const InvestigationsSearchFutureBookingInv = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.InvestigationsSearchFutureBookingInv}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsGetPatientBookingReport = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsGetPatientBookingReport}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureGetServicesContinueRequest = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureGetServicesContinueRequest}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsGetDataToFill = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsGetDataToFill}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsOpenService = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsOpenService}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsCloseService = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsCloseService}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const GetEncounterPendingActivities = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsGetEncounterPendingActivities}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsStopService = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsStopService}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsStartService = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsStartService}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsGetDataVisitLog = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsGetDataVisitLog}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationServicesContinueRequest = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationServicesContinueRequest}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const SaveServiceContinueRequest = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsSaveServiceContinueRequest}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsUpdateRequestStatus = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsUpdateRequestStatus}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationscancelBookingItem = async (
  PatientTest_ID,
  Remarks = "testing",
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationscancelBookingItem}?PatientTest_ID=${PatientTest_ID}&Remarks=${Remarks}`,
      {
        method: "post",
        // data:paylod
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationsGetBookingDetails = async (
  PatientID,
  BookingDate,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationsGetBookingDetails}?PatientID=${PatientID}&BookingDate=${BookingDate}`,
      {
        method: "get",
        // data:paylod
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const FutureInvestigationITem = async (prefixText) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.FutureInvestigationITem}?prefixText=${prefixText}`,
      {
        method: "get",
        // data:paylod
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const PatientControlUpdateBlacklist = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.PatientControlUpdateBlacklist}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const CommonAPISearchStaff = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.CommonAPISearchStaff}`, {
      method: "post",
      data: paylod,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

// Front Office MediCredit Start

export const famCheckRequestApi = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.famCheckRequest}`, {
      method: "post",
      data: paylod,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const checkEligibilityApi = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.checkEligibility}`, {
      method: "post",
      data: paylod,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const checkDoctorBookConsultantApi = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.checkDoctorBookConsultant}`, {
      method: "post",
      data: paylod,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const CheckDoctorStatus = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.CheckDoctorStatus}`, {
      method: "get",
      // data:paylod
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const CheckDoctorBookCons = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.CheckDoctorBookCons}`, {
      method: "post",
      data: paylod,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};

export const doctorClaimSubmitApi = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.doctorClaimSubmit}`, {
      method: "post",
      data: paylod,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const doctorClaimRversalRequestApi = async (paylod) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.doctorClaimRversalRequest}`, {
      method: "post",
      data: paylod,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const CommonRecieptThermal_PDFCommonPrinterOPDThermal = async (
  paylod,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.CommonRecieptThermal_PDFCommonPrinterOPDThermal}`,
      {
        method: "post",
        data: paylod,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const handleInvestigationBookingSlipReport = async (
  PId,
  PrescribedDate,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.InvestigationBookingSlipReport}?PId=${PId}&PrescribedDate=${PrescribedDate}`,
      {
        method: "get",
        // data:paylod
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const GmailGetDoctorMeeting = async (paylod) => {
  try {
    // store.dispatch(setLoading(true));
    const data = await makeApiRequest(`${apiUrls.GmailGetDoctorMeeting}`, {
      method: "post",
      data: paylod,
    });
    return data;
  } catch (error) {
    console.log(error, "error");
  }
  // finally{
  //   store.dispatch(setLoading(false));
  // }
};
export const LoadOPD_All_Items = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.LoadOPD_All_Items}?Type=${payload?.Type}&CategoryID=${payload?.CategoryID}&SubCategoryID=${payload?.SubCategoryID}`,
      {
        method: "get",
        // data:paylod
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
// Front Office MediCredit End
export const GmailUnlinkGoogle = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GmailUnlinkGoogle}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "error");
  }
};
export const GetPatientBalance = async (patID) => {
  store.dispatch(setLoading(true));
  try {
    const res = await makeApiRequest(
      `${apiUrlsNew?.GetPatientBalance}?PatientID=${patID}`,
      { method: "get" },
    );
    store?.dispatch(setLoading(false));
    return res;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "message error");
  }
};
export const GetPatientMembershipDetails = async (
  patID,
  applicableFor = "",
  panelId = "",
) => {
  store.dispatch(setLoading(true));
  try {
    const res = await makeApiRequest(
      `${apiUrlsNew?.GetPatientMembershipDetails}?patientId=${patID}${
        applicableFor ? `&applicableFor=${applicableFor}` : ""
      }${panelId ? `&panelId=${panelId}` : ""}`,
      { method: "get" },
    );
    store?.dispatch(setLoading(false));
    return res;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "message error");
  }
};

// Field Boy Master page: row mitti nahi, IsActive = 0 hota hai (purane bills par ID laga hai).
export const DeleteFieldBoy = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.DeleteFieldBoy, {
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

export const BindInvestigationApi = async () => {
  store.dispatch(setLoading(true));
  try {
    const res = await makeApiRequest(`${apiUrls?.ReportDispatchBindInvestigation}`, {
      method: "get",
    });
    store?.dispatch(setLoading(false));
    return res;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error, "message error");
  }
};
