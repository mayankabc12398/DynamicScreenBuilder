import makeApiRequest from "./axiosInstance";
import { apiUrls } from "./apiEndpoints";
import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import { apiUrlsNew } from "./newApiEndpoints";

export const saveANCRecordApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.saveANCRecord}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetailsApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails}?TransactionID=${transactionID}`,
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

export const printApi = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_ANCReport = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_ANCReport}?BlankPrint=${BlankPrint}`,
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
export const bindDoctorPAApi = async () => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(`${apiUrlsNew.bindDoctorPA}`, {
      method: "POST",
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const bindDoctorPMApi = async () => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(`${apiUrlsNew.bindDoctorPM}`, {
      method: "POST",
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_ANCPatientHistoryIApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_ANCPatientHistoryI}`,
      {
        method: "Post",
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

export const bindDetails_ANCPatientHistory1Api = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_ANCPatientHistory1}?TransactionID=${transactionID}`,
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

export const print_ANCPatientHistoryI = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_ANCPatientHistoryI}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_ANCPatientHistoryI = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_ANCPatientHistoryI}?BlankPrint=${BlankPrint}`,
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
export const save_ANCPatientHistoryII = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_ANCPatientHistoryII}`,
      {
        method: "Post",
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

export const bindDetails_ANCPatientHistoryII = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_ANCPatientHistoryII}?TransactionID=${transactionID}`,
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

export const print_ANCPatientHistoryII = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_ANCPatientHistoryII}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_ANCPatientHistoryII = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_ANCPatientHistoryII}?BlankPrint=${BlankPrint}`,
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

export const save_History_SheetApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_History_Sheet}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetails_History_SheetApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_History_Sheet}?TransactionID=${transactionID}`,
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

export const print_History_SheetApi = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_History_Sheet}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_History_Sheet = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_History_Sheet}?BlankPrint=${BlankPrint}`,
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
export const save_Physical_Systemic = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Physical_Systemic}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetails_Physical_Systemic = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_Physical_Systemic}?transactionID=${transactionID}`,
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

export const print_Physical_Systemic = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_Physical_Systemic}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_Physical_Systemic = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_Physical_Systemic}?BlankPrint=${BlankPrint}`,
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

export const save_Marital_Details = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Marital_Details}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetails_Marital_Details = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_Marital_Details}?TransactionID=${transactionID}`,
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

export const print_Marital_Details = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_Marital_Details}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_Marital_Details = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_Marital_Details}?BlankPrint=${BlankPrint}`,
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

export const save_Previous_Infertility = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_Previous_Infertility}`,
      {
        method: "Post",
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

export const bindDetails_Previous_Infertility = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_Previous_Infertility}?TransactionID=${transactionID}`,
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

export const handlePrintPreviousInfertility = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_Previous_Infertility}?transactionID=${transactionID}&ID=${ID}`,
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

export const PrintblankPrint_Previous_Infertility = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_Previous_Infertility}?BlankPrint=${BlankPrint}`,
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

export const bindDoctorApi = async () => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(`${apiUrlsNew.bindDoctor}`, {
      method: "POST",
    });

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_Ovum_Pickup = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_Ovum_Pickup}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetails_Ovum_Pickup = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_Ovum_Pickup}?TransactionID=${transactionID}`,
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

export const print_Ovum_Pickup = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_Ovum_Pickup}?transactionID=${transactionID}&ID=${ID}`,
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

export const bindDoctor_IVFOvum_Pickup = async () => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDoctor_IVFOvum_Pickup}`,
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

export const save_IVFOvum_Pickup = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_IVFOvum_Pickup}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetails_IVFOvum_Pickup = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_IVFOvum_Pickup}?TransactionID=${transactionID}`,
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

export const print_IVFOvum_Pickup = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_IVFOvum_Pickup}?transactionID=${transactionID}&ID=${ID}`,
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

export const bindDoctor_IVF_EMBRYO_Transfer = async () => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDoctor_IVF_EMBRYO_Transfer}`,
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

export const save_IVF_EMBRYO_Transfer = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_IVF_EMBRYO_Transfer}`,
      {
        method: "Post",
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

export const bindDetails_IVF_EMBRYO_Transfer = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_IVF_EMBRYO_Transfer}?TransactionID=${transactionID}`,
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

export const print_IVF_EMBRYO_Transfer = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_IVF_EMBRYO_Transfer}?transactionID=${transactionID}&ID=${ID}`,
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

export const saveIvfOPUFormdetailsApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.saveIvfOPUFormdetails}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindOpuHistoryApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindOpuHistory}?TransactionID=${transactionID}`,
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

export const printOPUFormApi = async ({ tid, id, printType }) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.printOPUForm}?TID=${tid}&ID=${id}&PrintType=${printType}`,
      {
        method: "POST",
      }
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};


export const save_Ovulation_InductionApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_Ovulation_Induction}`,
      {
        method: "Post",
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

export const bindDetails_Ovulation_InductionApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_Ovulation_Induction}?TransactionID=${transactionID}`,
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

export const print_Ovulation_InductionApi = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_Ovulation_Induction}?transactionID=${transactionID}&ID=${ID}`,
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

export const save_ET_SHEETApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_ET_SHEET}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetails_ET_SHEETApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_ET_SHEET}?TransactionID=${transactionID}`,
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

export const print_ET_SHEETApi = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_ET_SHEET}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_ET_SHEETApi = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_ET_SHEET}?BlankPrint=${BlankPrint}`,
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

export const save_IUI_SHEETApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_IUI_SHEET}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindDetails_IUI_SHEETApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_IUI_SHEET}?TransactionID=${transactionID}`,
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

export const print_IUI_SHEETApi = async (transactionID, ID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_IUI_SHEET}?transactionID=${transactionID}&ID=${ID}`,
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

export const blankPrint_IUI_SHEET = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_IUI_SHEET}?BlankPrint=${BlankPrint}`,
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

export const blankDonorUSightRetrievalPickup = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankDonorUSightRetrievalPickup}?BlankPrint=${BlankPrint}`,
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

export const save_PreOperative_CheckupApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_PreOperative_Checkup}`,
      {
        method: "Post",
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

export const bindDetails_PreOperative_CheckupApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_PreOperative_Checkup}?TransactionID=${transactionID}`,
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

export const print_PreOperative_CheckupApi = async (
  transactionID,
  ID,
  PrintType,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_PreOperative_Checkup}?transactionID=${transactionID}&ID=${ID}&PrintType=${PrintType}`,
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

export const blank_PreOperative_CheckupApi = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blank_PreOperative_Checkup}?BlankPrint=${BlankPrint}`,
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

export const bindDoctor_PreOperative_CheckupApi = async () => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDoctor_PreOperative_Checkup}`,
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

export const save_TreatmentSheetApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew?.save_TreatmentSheet}`, {
      method: "Post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add PatientsearchReport", error);
    store.dispatch(setLoading(false));
  }
};

export const bindTreatmentSheetApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindTreatmentSheet}?TransactionID=${transactionID}`,
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

export const print_TreatmentSheetApi = async (transactionID, ID, PrintType) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_TreatmentSheet}?transactionID=${transactionID}&ID=${ID}&PrintType=${PrintType}`,
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

export const save_General_ExaminationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_General_Examination}`,
      {
        method: "Post",
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

export const bindDetails_General_ExaminationApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_General_Examination}?TransactionID=${transactionID}`,
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

export const print_General_ExaminationApi = async (
  transactionID,
  ID,
  PrintType,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_General_Examination}?transactionID=${transactionID}&ID=${ID}&PrintType=${PrintType}`,
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

export const blankPrint_General_ExaminationApi = async (BlankPrint) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.blankPrint_General_Examination}?BlankPrint=${BlankPrint}`,
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




export const save_ARTSummaryApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew?.save_ARTSummary}`,
      {
        method: "Post",
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

export const bindDetails_ARTSummaryApi = async (transactionID) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_ARTSummary}?TransactionID=${transactionID}`,
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

export const print_ARTSummaryApi = async (
  transactionID,
  ID,
  PrintType,
) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_ARTSummary}?transactionID=${transactionID}&ID=${ID}&PrintType=${PrintType}`,
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

// IVF Form 6-a : Financial Agreement
export const bindDetails_6_a_IVF_Financial_AgreementApi = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_a_IVF_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_a_IVF_Financial_AgreementApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_a_IVF_Financial_Agreement}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_a_IVF_Financial_AgreementApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_a_IVF_Financial_Agreement}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_a_IVF_Financial_AgreementApi = async (transactionID, ID, blankPrint = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_a_IVF_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-b : Consent for IVF/ICSI with own gametes
export const bindDetails_6_b_IVF_Consent_Own_GametesApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_b_IVF_Consent_Own_Gametes}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_b_IVF_Consent_Own_GametesApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_b_IVF_Consent_Own_Gametes}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_b_IVF_Consent_Own_GametesApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_b_IVF_Consent_Own_Gametes}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_b_IVF_Consent_Own_GametesApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_b_IVF_Consent_Own_Gametes}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-c : Consent for ovarian stimulation & hormonal injections
export const bindDetails_6_c_CONSENT_FOR_OVARIAN_STIMULATIONApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_c_CONSENT_FOR_OVARIAN_STIMULATION}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_c_CONSENT_FOR_OVARIAN_STIMULATIONApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_c_CONSENT_FOR_OVARIAN_STIMULATION}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_c_CONSENT_FOR_OVARIAN_STIMULATIONApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_c_CONSENT_FOR_OVARIAN_STIMULATION}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_c_CONSENT_FOR_OVARIAN_STIMULATIONApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_c_CONSENT_FOR_OVARIAN_STIMULATION}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-d : Consent for infectious disease screening
export const bindDetails_6_d_Consent_for_Infectious_Disease_ScreeningApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_6_d_Consent_for_Infectious_Disease_Screening}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_6_d_Consent_for_Infectious_Disease_ScreeningApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_d_Consent_for_Infectious_Disease_Screening}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_d_Consent_for_Infectious_Disease_ScreeningApi = async (
  ID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_d_Consent_for_Infectious_Disease_Screening}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_d_Consent_for_Infectious_Disease_ScreeningApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_d_Consent_for_Infectious_Disease_Screening}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-e : Consent for anaesthesia / sedation
export const bindDetails_6_e_Consent_for_Anaesthesia_SedationApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_e_Consent_for_Anaesthesia_Sedation}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_e_Consent_for_Anaesthesia_SedationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_e_Consent_for_Anaesthesia_Sedation}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_e_Consent_for_Anaesthesia_SedationApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_e_Consent_for_Anaesthesia_Sedation}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_e_Consent_for_Anaesthesia_SedationApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_e_Consent_for_Anaesthesia_Sedation}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-f : Consent for oocyte retrieval
export const bindDetails_6_f_Consent_for_Oocyte_RetrievalApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_f_Consent_for_Oocyte_Retrieval}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_f_Consent_for_Oocyte_RetrievalApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_f_Consent_for_Oocyte_Retrieval}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_f_Consent_for_Oocyte_RetrievalApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_f_Consent_for_Oocyte_Retrieval}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_f_Consent_for_Oocyte_RetrievalApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_f_Consent_for_Oocyte_Retrieval}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-g : Consent for cryopreservation (freezing) of embryo(s)
export const bindDetails_6_g_IVF_Embryo_Freezing_ConsentApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_g_IVF_Embryo_Freezing_Consent}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_g_IVF_Embryo_Freezing_ConsentApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_g_IVF_Embryo_Freezing_Consent}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_g_IVF_Embryo_Freezing_ConsentApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_g_IVF_Embryo_Freezing_Consent}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_g_IVF_Embryo_Freezing_ConsentApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_g_IVF_Embryo_Freezing_Consent}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-h : Nomination & instructions in the event of death or incapacity
export const bindDetails_6_h_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_6_h_Nomination_and_Instructions_Death_or_Incapacity}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_6_h_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.save_6_h_Nomination_and_Instructions_Death_or_Incapacity}`,
        { method: "POST", data: payload },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const delete_6_h_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (ID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.delete_6_h_Nomination_and_Instructions_Death_or_Incapacity}?ID=${encodeURIComponent(ID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const print_6_h_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (transactionID, ID, blankPrint = 0) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.print_6_h_Nomination_and_Instructions_Death_or_Incapacity}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

// IVF Form 6-i : Consent for extending storage of cryopreserved embryo(s)
export const bindDetails_6_i_Consent_for_Extending_Storage_of_EmbryosApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_6_i_Consent_for_Extending_Storage_of_Embryos}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_6_i_Consent_for_Extending_Storage_of_EmbryosApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_i_Consent_for_Extending_Storage_of_Embryos}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_i_Consent_for_Extending_Storage_of_EmbryosApi = async (
  ID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_i_Consent_for_Extending_Storage_of_Embryos}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_i_Consent_for_Extending_Storage_of_EmbryosApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_i_Consent_for_Extending_Storage_of_Embryos}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-k : Consent for frozen embryo transfer (FET)
export const bindDetails_6_k_IVF_Frozen_Embryo_Transfer_ConsentApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_k_IVF_Frozen_Embryo_Transfer_Consent}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_k_IVF_Frozen_Embryo_Transfer_ConsentApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_k_IVF_Frozen_Embryo_Transfer_Consent}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_k_IVF_Frozen_Embryo_Transfer_ConsentApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_k_IVF_Frozen_Embryo_Transfer_Consent}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_k_IVF_Frozen_Embryo_Transfer_ConsentApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_k_IVF_Frozen_Embryo_Transfer_Consent}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-l : Couple consent for IVF/ICSI with donor sperm
export const bindDetails_6_l_IVF_Consent_Donor_Sperm_CoupleApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_l_IVF_Consent_Donor_Sperm_Couple}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_l_IVF_Consent_Donor_Sperm_CoupleApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_l_IVF_Consent_Donor_Sperm_Couple}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_l_IVF_Consent_Donor_Sperm_CoupleApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_l_IVF_Consent_Donor_Sperm_Couple}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_l_IVF_Consent_Donor_Sperm_CoupleApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_l_IVF_Consent_Donor_Sperm_Couple}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-o : Couple consent for IVF/ICSI with donor oocyte
export const bindDetails_6_o_IVF_Consent_Donor_Oocyte_CoupleApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_6_o_IVF_Consent_Donor_Oocyte_Couple}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_6_o_IVF_Consent_Donor_Oocyte_CoupleApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_o_IVF_Consent_Donor_Oocyte_Couple}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_o_IVF_Consent_Donor_Oocyte_CoupleApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_6_o_IVF_Consent_Donor_Oocyte_Couple}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_6_o_IVF_Consent_Donor_Oocyte_CoupleApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_6_o_IVF_Consent_Donor_Oocyte_Couple}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// IVF Form 6-j : Consent for disposal of cryopreserved embryo(s)
export const bindDetails_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi =
  async (ID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.delete_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos}?ID=${encodeURIComponent(ID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const print_6_j_Consent_for_Disposal_of_Cryopreserved_EmbryosApi =
  async (transactionID, ID, blankPrint = 0) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.print_6_j_Consent_for_Disposal_of_Cryopreserved_Embryos}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

// Form EF-4-a : Oocyte (Egg) Freezing - Financial Agreement
export const bindDetails_EF_4_a_Oocyte_Freezing_Financial_AgreementApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_EF_4_a_Oocyte_Freezing_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_EF_4_a_Oocyte_Freezing_Financial_AgreementApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_a_Oocyte_Freezing_Financial_Agreement}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_a_Oocyte_Freezing_Financial_AgreementApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_EF_4_a_Oocyte_Freezing_Financial_Agreement}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_EF_4_a_Oocyte_Freezing_Financial_AgreementApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_EF_4_a_Oocyte_Freezing_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Form EF-4-b : Consent for Ovarian Stimulation & Hormonal Injections
export const bindDetails_EF_4_b_Consent_for_Ovarian_StimulationApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_EF_4_b_Consent_for_Ovarian_Stimulation}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_EF_4_b_Consent_for_Ovarian_StimulationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_b_Consent_for_Ovarian_Stimulation}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_b_Consent_for_Ovarian_StimulationApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_EF_4_b_Consent_for_Ovarian_Stimulation}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_EF_4_b_Consent_for_Ovarian_StimulationApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_EF_4_b_Consent_for_Ovarian_Stimulation}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Form EF-4-c : Consent for Infectious Disease Screening
export const bindDetails_EF_4_c_Consent_for_Infectious_Disease_ScreeningApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_EF_4_c_Consent_for_Infectious_Disease_Screening}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_EF_4_c_Consent_for_Infectious_Disease_ScreeningApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_c_Consent_for_Infectious_Disease_Screening}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_c_Consent_for_Infectious_Disease_ScreeningApi = async (
  ID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_EF_4_c_Consent_for_Infectious_Disease_Screening}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_EF_4_c_Consent_for_Infectious_Disease_ScreeningApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_EF_4_c_Consent_for_Infectious_Disease_Screening}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Form EF-4-d : Consent for Oocyte Retrieval
export const bindDetails_EF_4_d_Consent_for_Oocyte_RetrievalApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_EF_4_d_Consent_for_Oocyte_Retrieval}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_EF_4_d_Consent_for_Oocyte_RetrievalApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_d_Consent_for_Oocyte_Retrieval}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_d_Consent_for_Oocyte_RetrievalApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_EF_4_d_Consent_for_Oocyte_Retrieval}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_EF_4_d_Consent_for_Oocyte_RetrievalApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_EF_4_d_Consent_for_Oocyte_Retrieval}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Form EF-4-e : Consent for Anaesthesia / Sedation for Oocyte Retrieval
export const bindDetails_EF_4_e_Consent_for_Anaesthesia_SedationApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_EF_4_e_Consent_for_Anaesthesia_Sedation}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_EF_4_e_Consent_for_Anaesthesia_SedationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_e_Consent_for_Anaesthesia_Sedation}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_e_Consent_for_Anaesthesia_SedationApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_EF_4_e_Consent_for_Anaesthesia_Sedation}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_EF_4_e_Consent_for_Anaesthesia_SedationApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_EF_4_e_Consent_for_Anaesthesia_Sedation}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Form EF-4-f : Consent for Oocyte Freezing (Vitrification / Cryopreservation)
export const bindDetails_EF_4_f_Consent_for_Oocyte_Freezing_VitrificationApi = async (
  transactionID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_EF_4_f_Consent_for_Oocyte_Freezing_VitrificationApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_f_Consent_for_Oocyte_Freezing_VitrificationApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_EF_4_f_Consent_for_Oocyte_Freezing_VitrificationApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_EF_4_f_Consent_for_Oocyte_Freezing_Vitrification}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Form EF-4-g : Nomination & Instructions in the Event of Death or Incapacity
export const bindDetails_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (payload) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.save_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity}`,
        { method: "POST", data: payload },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const delete_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (ID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.delete_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity}?ID=${encodeURIComponent(ID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const print_EF_4_g_Nomination_and_Instructions_Death_or_IncapacityApi =
  async (transactionID, ID, blankPrint = 0) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.print_EF_4_g_Nomination_and_Instructions_Death_or_Incapacity}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

// Form EF-4-h : Consent for Extending Storage of Cryopreserved Oocytes
export const bindDetails_EF_4_h_Consent_for_Extending_Storage_of_OocytesApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_EF_4_h_Consent_for_Extending_Storage_of_Oocytes}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_EF_4_h_Consent_for_Extending_Storage_of_OocytesApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_h_Consent_for_Extending_Storage_of_Oocytes}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_h_Consent_for_Extending_Storage_of_OocytesApi = async (
  ID,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_EF_4_h_Consent_for_Extending_Storage_of_Oocytes}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_EF_4_h_Consent_for_Extending_Storage_of_OocytesApi = async (
  transactionID,
  ID,
  blankPrint = 0,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_EF_4_h_Consent_for_Extending_Storage_of_Oocytes}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

// Form EF-4-i : Consent for Disposal of Cryopreserved Oocytes
export const bindDetails_EF_4_i_Consent_for_Disposal_of_Cryopreserved_OocytesApi =
  async (transactionID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.bindDetails_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const save_EF_4_i_Consent_for_Disposal_of_Cryopreserved_OocytesApi = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.save_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes}`,
      { method: "POST", data: payload },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const delete_EF_4_i_Consent_for_Disposal_of_Cryopreserved_OocytesApi =
  async (ID) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.delete_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes}?ID=${encodeURIComponent(ID ?? "")}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

export const print_EF_4_i_Consent_for_Disposal_of_Cryopreserved_OocytesApi =
  async (transactionID, ID, blankPrint = 0) => {
    store.dispatch(setLoading(true));
    try {
      const data = await makeApiRequest(
        `${apiUrlsNew.print_EF_4_i_Consent_for_Disposal_of_Cryopreserved_Oocytes}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
        { method: "POST" },
      );
      store.dispatch(setLoading(false));
      return data;
    } catch (error) {
      store.dispatch(setLoading(false));
      throw error;
    }
  };

// IUI Form 1-a : Financial Agreement for Single Cycle IUI Package - Husband / Donor
export const bindDetails_IUI_1_a_IUI_Financial_AgreementApi = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_IUI_1_a_IUI_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_IUI_1_a_IUI_Financial_AgreementApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew.save_IUI_1_a_IUI_Financial_Agreement}`, {
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

export const delete_IUI_1_a_IUI_Financial_AgreementApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_IUI_1_a_IUI_Financial_Agreement}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_IUI_1_a_IUI_Financial_AgreementApi = async (transactionID, ID, blankPrint = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_IUI_1_a_IUI_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
// IUI Form 1-b : Consent for Intrauterine Insemination with Husband's Semen/Sperm
export const bindDetails_IUI_1_b_IUI_Consent_Form_Husband_SemenApi = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_IUI_1_b_IUI_Consent_Form_Husband_Semen}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_IUI_1_b_IUI_Consent_Form_Husband_SemenApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew.save_IUI_1_b_IUI_Consent_Form_Husband_Semen}`, {
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

export const delete_IUI_1_b_IUI_Consent_Form_Husband_SemenApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_IUI_1_b_IUI_Consent_Form_Husband_Semen}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_IUI_1_b_IUI_Consent_Form_Husband_SemenApi = async (transactionID, ID, blankPrint = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_IUI_1_b_IUI_Consent_Form_Husband_Semen}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
// IUI Form 1-c : Couple Consent for Intrauterine Insemination with Donor Semen
export const bindDetails_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_CoupleApi = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_CoupleApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew.save_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple}`, {
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

export const delete_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_CoupleApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_CoupleApi = async (transactionID, ID, blankPrint = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_IUI_1_c_IUI_Consent_Form_Donor_Semen_for_Couple}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
// IUI Form 1-d : Donor Consent for Intrauterine Insemination with Donor Semen
export const bindDetails_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew.save_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor}`, {
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

export const delete_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_DonorApi = async (transactionID, ID, blankPrint = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_IUI_1_d_IUI_Consent_Form_Donor_Semen_for_Donor}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
// Sono TBPCR : Financial Agreement-cum-Consent Form for HSG / SSG
export const bindDetails_Sono_TBPCR_Consent_Form_Financial_AgreementApi = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.bindDetails_Sono_TBPCR_Consent_Form_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const save_Sono_TBPCR_Consent_Form_Financial_AgreementApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrlsNew.save_Sono_TBPCR_Consent_Form_Financial_Agreement}`, {
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

export const delete_Sono_TBPCR_Consent_Form_Financial_AgreementApi = async (ID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.delete_Sono_TBPCR_Consent_Form_Financial_Agreement}?ID=${encodeURIComponent(ID ?? "")}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const print_Sono_TBPCR_Consent_Form_Financial_AgreementApi = async (transactionID, ID, blankPrint = 0) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.print_Sono_TBPCR_Consent_Form_Financial_Agreement}?transactionID=${encodeURIComponent(transactionID ?? "")}&ID=${encodeURIComponent(ID ?? "")}&BlankPrint=${blankPrint ? 1 : 0}`,
      { method: "POST" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
// export const blankPrint_General_ExaminationApi = async (BlankPrint) => {
//   store.dispatch(setLoading(true));

//   try {
//     const data = await makeApiRequest(
//       `${apiUrlsNew.blankPrint_General_Examination}?BlankPrint=${BlankPrint}`,
//       {
//         method: "get",
//       },
//     );

//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     throw error;
//   }
// };
