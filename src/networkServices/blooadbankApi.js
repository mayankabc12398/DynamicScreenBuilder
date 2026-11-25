import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

 

// Donor Registration Start here 

 export const saveDonorCity = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.CityInsert}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



 export const bloodBankSaveData = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.bloodBankSaveData}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


 
 

export const BindQuestions = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BindQuestions}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

   
export const BinddonorBloodGroup = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BinddonorBloodGroup}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

 
   
export const donorBindOrganisation = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.donorBindOrganisation}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

 
 export const DonorGetCity = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.DonorGetCity}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
 

   
export const DonorGetCountry = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.DonorGetCountry}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



// Blood Collection Start Here 
 
 export const bloodCollectionSearchData = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.bloodCollectionSearchData}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
 
 
 export const SaveCollectionRecord = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.SaveCollectionRecord}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
 export const EDPBloodBankMasterLoadBloodBag = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data: params,
    };
    const data = await makeApiRequest(`${apiUrls.EDPBloodBankMasterLoadBloodBag}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
 export const BloodBankBloodGroupSaveRecord = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankBloodGroupSaveRecord}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
 export const BloodBankBloodGroupBindBloodMatch = async (GroupingId) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankBloodGroupBindBloodMatch}?GroupingId=${GroupingId}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
 
 export const BloodBankSaveRecord = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankSaveRecord}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// Grouping Start here 


 export const BloodGroupSerach = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BloodGroupSerach}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

 export const BloodBankSearch = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankSearch}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

 export const BloodBankSearchRecord = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankSearchRecord}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



// master start ..............................

export const EDPBloodBankMasterLoadBloodGroup = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.EDPBloodBankMasterLoadBloodGroup}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const EDPBloodBankMasterSaveBBMinStock = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.EDPBloodBankMasterSaveBBMinStock}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BloodBankBindQuestions = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankBindQuestions}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BloodBankView = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankView}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BloodBankEstablishedDonorView = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankEstablishedDonorView}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


export const EDPBloodBankMasterBindBloodComponent = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.EDPBloodBankMasterBindBloodComponent}?BloodGroupID=${params}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BloodBankBindRecord = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankBindRecord}?BloodcollectionId=${params}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BloodBankMethodValue = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankMethodValue}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BloodBankTTDApprovalAResult = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankTTDApprovalAResult}?donationId=${params}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BloodBankTTDApprovalAHistory = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankTTDApprovalAHistory}?donationId=${params}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



export const BloodBankTTDApprovalSerach = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankTTDApprovalSerach}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


export const BloodBankTTDApprovalSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankTTDApprovalSave}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
export const BloodBankDiscardBloodSave = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankDiscardBloodSave}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
export const BloodBankTTDApprovalFinalReject = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankTTDApprovalFinalReject}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
export const BloodBankBloodRequsteIPdBindDoctor = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankBloodRequsteIPdBindDoctor}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
export const BloodRequsteIPdLoadCategory = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodRequsteIPdLoadCategory}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
// IPD Blood Request > Items. subCategoryID / text are used in the URL below; they were
// missing from the parameters, so the call threw (ReferenceError) before any request
// and the Items dropdown stayed empty.
export const BloodBankBloodRequsteIPdGetItemSubCategory = async (CategoryID, subCategoryID = "", text = "") => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankBloodRequsteIPdGetItemSubCategory}?CategoryID=${CategoryID ?? ""}&SubCategoryID=${subCategoryID ?? ""}&TextType=${encodeURIComponent(text ?? "")}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
export const BloodBankRequsteIPdGetItemRate = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankRequsteIPdGetItemRate}?ItemID=${payload?.ItemID}&PanelID=${payload?.PanelID}&CaseTypeID=${payload?.CaseTypeID}&ScheduleChargeID=${payload?.ScheduleChargeID}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
export const BloodBankRequsteIPdSaveIPDReceipt = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "post",
      data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankRequsteIPdSaveIPDReceipt}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}
export const BloodBankBloodRequsteIPdTransfus_Reason = async (CategoryID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data:payload
    };
    const data = await makeApiRequest(`${apiUrls.BloodBankBloodRequsteIPdTransfus_Reason}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
}