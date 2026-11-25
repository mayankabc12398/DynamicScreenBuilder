import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const GetPharmacyPatientDetail = async (searchKey) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyPatientURL}?SearchKey=${searchKey}`,
        {
          method: "get",
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const BindMedicineList = async () => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyBindMedicineListURL}`,
        {
          method: "get",
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const SearchPrescribedMedicineData = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacySearchPrescribedMedicineDataURL}`,
        {
          method: "post",
          data: payload,
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const SaveMedicineDetailVM = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacySaveMedicineDetailVMURL}`,
        {
          method: "post",
          data: payload,
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  
export const BindDataPatientIssueApi = async (searchKey) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BindDataPatientIssue}?SearchKey=${searchKey}`,
        {
          method: "get",
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const PharmacyMedicineItemSearch = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PHMedicineItemSearchURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const ShowOtherDepMedicineItemSearch = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.ShowOtherDepMedicineItemSearchURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const pharmecyAddItem = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyAddItemURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const IndentIssueAddItem = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.IndentIssueAddItem}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const MarkedasUsedDraftAPI = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.MarkedasUsedDraftURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const GetDemandItemDetailsPrint = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetDemandItemDetailsPrint}?demandDraftID=${payload?.demandDraftID}&deptLedgerNo=${payload?.deptLedgerNo}`,
        {
          method: "get",
          // data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const AddItemByItemIDPharmecy = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyAddItemByItemIDURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const PharmacyClinicalTrialAPI = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyClinicalTrialURL}${payload}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const GetAllPendingIndentsPharmecy = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyGetAllPendingIndentsURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const bindFromDepartments = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.bindFromDepartmentsURL}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const PendingDraftListAPI = async () => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PendingDraftListURL}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
export const BindItemDetailsAPI = async (URL,payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls[URL]}?${payload}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const getPatientIndentAPI = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetPatientIndentLISTURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const BillingIPDAcknowledgmentIndent = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BillingIPDAcknowledgmentIndent}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const BillingIPDIssueIndentAccept = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BillingIPDIssueIndentAccept}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const SavePharmecyAPICall = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.SaveOPDPharmacyURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
    export const SavePatientIndentIssueIPD = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.SavePatientIndentIssueIPD}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const DraftPharmecyAPICall = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyDraftBillURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const PharmacyOPDReturnSearch = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyOPDReturnSearch}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const PharmacyRejectIndentItem = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyRejectIndentItemURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const SaveReurnAPI = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacySaveOPDReturnURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const SaveIPDReurnAPI = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.SaveIPDReurnURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const PharmacySearchIPDReturn = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacySearchIPDReturnURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const PharmacyIPDReturnItemAPI = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyIPDReturnItemURL}?TransactionNo=${payload}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const PharmacyInvoiceReport = async (TransID, Type) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.CurrentStockInvoiceURL}?TransID=${TransID}&Type=${Type}`,
        {
          method: "get",
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const BindPharmacySubcategory = async () => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BindPharmacySubcategory}`,
        {
          method: "get",
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };


  export const GetIPDSearchSalesAPI = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetIPDSearchSalesURL}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const PharmacyBindDoseItem = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyBindDoseItemURL}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
 

  export const BillGenerationSearchDetail = async (ipdno) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BillGenerationSearchDetail}?IPDNo=${ipdno}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  

  

  export const GetDetailsAgainstRecieptNOApi = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.GetDetailsAgainstRecieptNO}?receiptNo=${payload}`,
        {
          method: "get"
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

  export const UpdatePaymentModeApi = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.UpdatePaymentMode}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const UpdateWalkInPatientInfoApi = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.UpdateWalkInPatientInfo}`,
        {
          method: "post",
          data: payload,
        }
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };
  export const BindIndentDetailsPdf = async (indentno) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.BindIndentDetailsPrint}?indentNo=${indentno}`,
        {
          method: "get",
          // data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

  export const PharmacyBillReturnCredit = async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrls.PharmacyBillReturnCredit}`,
        {
          method: "post",
          data:payload
        }
      );
  
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

  export const ManageCreditNotePharmacy = async (payload) => {
  try {
    const url = `${apiUrls.ManageCreditPharmacy}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
}

export const ManageCreditDepartmentWiseBill = async (payload) => {
  try {
    const url = `${apiUrls.GetDepartmentWiseBillDetails}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
}

export const ManageCreditDepartmentCRItem = async (payload) => {
  try {
    const url = `${apiUrls.DepartmentWiseItemDetails}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
}

export const ManageGetPanelLists = async (transactionID,type) => {
  try {
    const url = `${apiUrls.ManageCardGetPanelList}?transactionID=${transactionID}&type=${type}`;
    const data = await makeApiRequest(url, {
      method: "get",
      // data: payload,
    })
    return data;
  } catch (error) {
    throw error;
  }
}

export const ManageCreditDebitSaveBillDetails = async (payload) => {
  try {
    const url = `${apiUrls.ManageCreditDebitSaveDetails}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    })
    return data;
  } catch (error) {
    throw error;
  }
}

export const GetGlobalResourcesAPI = async () => {
  try {
    const url = `DiscountOTP/GetGlobalResources`
    const data = await makeApiRequest(
      url,
      {
        method: "get"
      }
    );
    return data;
  } catch (error) {
    throw error;
  }
};


/* ---------------------------------------------------------------------------
 * SRSSAIH-2026-0061 · Point 7 Slice B — indent approval (7.1, 7.2).
 *
 * Threshold is per panel (f_panel_master.PharmacyApprovalLimit); 0 = no approval ever
 * required, which is the default for every existing panel. The approver is whoever holds
 * the f_frame_role right on /pharmacy-indent-approval, so the client can move the page
 * between modules without a code change.
 *
 * All behind PharmacyIndentApprovalRequired, shipped OFF.
 * ------------------------------------------------------------------------- */

export const IndentApprovalFlags = async () => {
  try {
    const data = await makeApiRequest(apiUrls.IndentApprovalFlags, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Called by the issue screen once the indent is open and priced. Returns per line whether
// approval is needed, where the request stands, and the approver + timestamp for 7.2.
export const EvaluateIndentApproval = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.EvaluateIndentApproval, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Idempotent — a line already awaiting or holding a decision is left alone.
export const RequestIndentApproval = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.RequestIndentApproval, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GetPendingIndentApprovals = async (Status = "PENDING") => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetPendingIndentApprovals}?Status=${encodeURIComponent(Status)}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DecideIndentApproval = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DecideIndentApproval, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GetPanelApprovalLimits = async () => {
  try {
    const data = await makeApiRequest(apiUrls.GetPanelApprovalLimits, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Writes only the PharmacyApprovalLimit column — deliberately stays out of the panel
// master save path, which has parent/child logic of its own.
export const SavePanelApprovalLimits = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SavePanelApprovalLimits, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
