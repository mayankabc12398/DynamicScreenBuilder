import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { apiUrlsNew } from "./newApiEndpoints";

export const BindDepartmentResultEntryLab = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindDepartmentResultEntryLab}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const BindTestResultEntryLab = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindTestResultEntryLab}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



// BindApprovedBy  (To Bind Doctor)

// export const BindApprovedBy = async (params) => {
//   store.dispatch(setLoading(true));
//   try {
//     const options = {
//       method: "get",
//       // data: params,
//     };
//     const data = await makeApiRequest(`${apiUrls.BindApprovedBy}`, options);
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     console.error("Error Found", error); 
//   }
// };


export const BindApprovedBy = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BindApprovedBy}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
// BindApprovedBy  (To Bind Machine)

export const BindMachine = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindMachine}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const SelectGender = async (LabObservation_ID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.SelectGender}?LabObservation_ID=${LabObservation_ID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};





export const TestResultEntryLab = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.TestResultEntryLab}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const ProvisionalTatReport = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.ProvisionalTatReport}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// Sample Rejection Report - reportType "D" = grid rows, "P" = PDF url.
export const SampleRejectionReport = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.SampleRejectionReport}`, {
      method: "POST",
      data: params,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// Sample Rejection Report - "Approved By" / "Rejected By" user list for a status.
export const SampleStatusUsers = async (status) => {
  try {
    return await makeApiRequest(
      `${apiUrls.SampleStatusUsers}?Status=${encodeURIComponent(status)}`,
      { method: "GET" },
    );
  } catch (error) {
    console.error("Error Found", error);
  }
};

// Lab Observation Report - Panel list + saari Lab Observations.
export const LabObservationReportMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.LabObservationReportMaster}`, {
      method: "GET",
    });
    return data;
  } catch (error) {
    console.error("Error Found", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Lab Observation Report - printType 0 = screen/Excel ka data
// (data.columns + data.rows), 1 = PDF (data.pdfUrl).
export const LabObservationReport = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.LabObservationReport}`, {
      method: "POST",
      data: params,
    });
    return data;
  } catch (error) {
    console.error("Error Found", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const SearchResultEntryLab = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SearchResultEntryLab}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const SendResultEntryRowToPacs = async (params) => {
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SendResultEntryRowToPacs}`,
      options
    );
    return data;
  } catch (error) {
    console.error("Error Found", error);
    throw error;
  }
};
export const MachineResultEntryPatientSearch = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.MachineResultEntryPatientSearch}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossPatientSearchCyto = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossPatientSearchCyto}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const MachineResultEntryGetTestMaster = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.MachineResultEntryGetTestMaster}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const MachineResultEntryPatientSearchCyto = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.MachineResultEntryPatientSearchCyto}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const HistoCytoGrossingAndSliding = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossingAndSliding}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const HistoCytoGrossingAndSlidingSaveRemarks = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossingAndSlidingSaveRemarks}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossingSaveGrossData = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossingSaveGrossData}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossingSaveDataSlide = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossingSaveDataSlide}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoSaveCompleteData = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoSaveCompleteData}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoSaveDispatch = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoSaveDispatch}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoSaveRemarksWithStatus = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoSaveRemarksWithStatus}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoMarkComplete = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoMarkComplete}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const HistoCytoGrossingAndSlidingViewLog = async (testid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossingAndSlidingViewLog}?testid=${testid}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const MachineResultEntryBindsampleinfo = async (testid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.MachineResultEntryBindsampleinfo}?TestID=${testid}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossLoadSpecimenTemplate = async (favonly) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossLoadSpecimenTemplate}?favonly=${favonly}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossGetTemplateHisto = async (Template_ID, Type) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossGetTemplateHisto}?Template_ID=${Template_ID}&Type=${Type}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const MachineResultEntryBindTestDDL = async (testID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.MachineResultEntryBindTestDDL}?testID=${testID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossSaveDataAsTemplate = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossSaveDataAsTemplate}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// export const HistoCytoGrossGetTemplateHisto = async (Template_ID) => {
//   store.dispatch(setLoading(true));
//   try {
//     const options = {
//       method: "GET",
//       // data: params,
//     };
//     const data = await makeApiRequest(
//       `${apiUrls.HistoCytoGrossGetTemplateHisto}?Template_ID=${Template_ID}`,
//       options
//     );
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     console.error("Error Found", error);
//   }
// };
export const HistoCyBindDoctor = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCyBindDoctor}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGBindDept = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGBindDept}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossinggetdetailblock = async (testid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossinggetdetailblock}?testid=${testid}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossinggetdetaildatablock = async (testid, BlockID) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossinggetdetaildatablock}?testid=${testid}&blockid=${BlockID}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGetGrossDetail = async (testid) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGetGrossDetail}?testid=${testid}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossingGetRemarks = async (testid, offline) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossingGetRemarks}?offline=${offline}&testid=${testid}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossCheckAddendumAuthorizationt = async (testid, offline) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "GET",
      // data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossCheckAddendumAuthorizationt}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossSaveAddendum = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossSaveAddendum}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossFinalDone = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossFinalDone}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const HistoCytoGrossSaveHistoReport = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.HistoCytoGrossSaveHistoReport}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const UpdateSerialMarkViewLab = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateSerialMarkViewLab}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// Persists the sample Registration / Collection / Receive / Report date-times.
// Separate from the main result-entry Save, per the Update-dates feature.
export const UpdateResultEntryDates = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.UpdateResultEntryDates}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const LabObservationSearch = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.LabObservationSearch}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const GetPatientInvsetigationsNameOnly = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetPatientInvsetigationsNameOnly}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const SaveResultEntryLabdata = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.SaveResultEntryLab}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const BindAttachmentLab = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.BindAttachmentLab}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const LabSampleRejection = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(`${apiUrls.LabSampleRejection}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// BindLabReport

// export const BindTestDDLlab = async (params) => {
//   store.dispatch(setLoading(true));
//   try {
//     const options = {
//       method: "get",
//       // data: params,
//     };
//     const data = await makeApiRequest(`${apiUrls.BindTestDdlLab}`, options);
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     console.error("Error Found", error);
//   }
// };

export const BindTestDDLlab = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.BindTestDdlLab}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// Getpatient_labobservation_opd_text


export const Getpatientlabobservationopdtext = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.Getpatientlabobservationopdtext}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const CommonAPIGetAllPanel = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    // const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.CommonAPIGetAllPanel}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};





export const BindSampleinfo = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.BindSampleinfo}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const BindLabReport = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(apiUrls.BindLabReport, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// BindPatientDetails

export const BindAttachmentDetails = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.BindAttachmentDetails}?TestID=${params}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const BindPatientDetailsImage = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.BindPatientDetailsImage}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// BindAttachment


export const BindAttachment = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(
      apiUrls.BindAttachment,
      options
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const HistoCytoGrossRemoveRadiologyUplodedData = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(
      apiUrls.HistoCytoGrossRemoveRadiologyUplodedData,
      options
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const insertReportNumberFormatApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(
      apiUrls.insertReportNumberFormat,
      options
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const BindAttachmentPdf = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(
      apiUrls.BindAttachmentPdf,
      options
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};
// export const BindPatientDetailsImage = async (params) => {
//   store.dispatch(setLoading(true));
//   try {
//     const options = {
//       method: "Get",
//       data: params,
//     };
//     const data = await makeApiRequest(
//       apiUrls.BindPatientDetailsImage,
//       options
//     );
//     return data;
//   } catch (error) {
//     console.error("Error Add Expense", error);
//   } finally {
//     store.dispatch(setLoading(false));
//   }
// };

export const BindlabOutSource = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(`${apiUrls.BindlabOutSource}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// MachineResultEntry Culture controllers start here

export const PatientSearchMachineResults = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(
      apiUrls.PatientSearchMachineResult,
      options
    );
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const CultureLabObservationSearchs = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.CultureLabObservationSearch}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const SaveCultureObservationOpdDatas = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveLabObservationOpdData}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



export const GetReportPrintCulture = async (params) => {
  debugger
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(apiUrlsNew.GetReportPrintCulture, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};






export const helpMenu = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.helpMenu}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



// BindDoctor


export const BindDoctor = async (params) => {
  store.dispatch(setLoading(true));

  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.BindDoctor}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};




//  Get Bind Comment List  

export const GetCommentsDropdown = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.GetCommentsDropdown}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


/** Overwrites an existing radiology template with the edited text. */
export const updateLabTemplateApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.updateLabTemplate}`, {
      method: "POST",
      data: params,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const saveSaveLabTemplateAndCommentApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.saveSaveLabTemplateAndComment}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



// CommentlabObservation
// export const CommentlabObservation = async (params) => {
//   store.dispatch(setLoading(true));
//   try {
//     const options = {
//       method: "POST",
//       data: params,
//     };
//     const data = await makeApiRequest(
//       `${apiUrls.CommentlabObservation}`,
//       options
//     );
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     store.dispatch(setLoading(false));
//     console.error("Error Found", error);
//   }
// };


export const CommentlabObservation = async (params) => {
  store.dispatch(setLoading(true));
  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.CommentlabObservation}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



// Track Investigation timeline (booking -> collection -> receive -> result -> approval)
export const TrackInvestigationApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const query = new URLSearchParams(params).toString();
    const data = await makeApiRequest(
      `${apiUrls.TrackInvestigation}?${query}`,
      { method: "GET" }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// Reports ke investigation filter ke liye -- centre ki poori list (role filter ke bina)
export const GetTestMasterForReport = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.GetTestMasterForReport}`, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// Delta Check report -- Patient History & Investigation at-a-Glance
export const DeltaCheckReportApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const query = new URLSearchParams(params).toString();
    const data = await makeApiRequest(
      `${apiUrls.DeltaCheckReport}?${query}`,
      { method: "GET" }
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

// HoverHeaderresultEntry



export const HoverHeaderresultEntry = async (params) => {
  store.dispatch(setLoading(true));
  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.HoverHeaderresultEntry}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// HoverDeltaCheck
export const HoverDeltaCheck = async (params) => {
  store.dispatch(setLoading(false));
  try {
    // Construct the URL with query parameters
    const query = new URLSearchParams(params).toString();

    const urlWithParams = `${apiUrls.HoverDeltaCheck}?${query}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};



// Result Entry Culture 


export const BindOrganism = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.BindOrganism}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// BindobsAntibiotic


export const BindobsAntibiotic = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.BindobsAntibiotic}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// GetUnApproveReason


export const GetUnApproveReason = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.GetUnApproveReason}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// SaveSampleRejectReasonApi



export const SaveSampleRejectReasonApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveSampleRejectReasonApi}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};






export const GetholdReason = async () => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
    };
    const data = await makeApiRequest(
      `${apiUrls.holdReason}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


// SaveUnHoldReason



export const SaveUnHoldReason = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.SaveUnHoldReason}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};


export const RerunLabTest = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: payload,
    };
    const data = await makeApiRequest(
      `${apiUrlsNew.RerunLabTest}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
export const updateLabBloodGroupApi = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "POST",
      data: params,
    };
    const data = await makeApiRequest(
      `${apiUrls.updateLabBloodGroup}`,
      options
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};




export const GetRadiologyAndDoctor = async (roleId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetRadiologyAndDoctor}?roleId=${roleId}`,
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
export const MachineResultEntryBindApprovedBy = async (roleId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.MachineResultEntryBindApprovedBy}`,
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

export const getPatientBloodDetailsApi = async (patientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.getPatientBloodDetails}?PatientID=${patientID}`,
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

export const getBindDefaultMachineApi = async (testId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.getDefaultMachine}?TestId=${testId}`,
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


export const GetAmendmentReportsByTestId = async (testId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetAmendmentReportsByTestId}?TestID=${testId}`,
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
export const GetObservationList = async (testId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.GetObservationList}?TestID=${testId}`,
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
export const GetLabBalanceCheck = async (transactionID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrlsNew.GetLabBalanceCheck}?transactionID=${transactionID}`,
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

export const GetLabReportOnline = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "Post",
      data: params,
    };
    const data = await makeApiRequest(apiUrls.GetOnlineLabReport, options);
    return data;
  } catch (error) {
    console.error("Error Add Expense", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};


export const LaboratorySetupBind_Employee = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const options = {
      method: "get",
      // data: params,
    };
    const data = await makeApiRequest(`${apiUrls.LaboratorySetupBind_Employee}`, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};
// Result Entry Print: same pending-amount stop Approve has (Manage Global
// ISpaymentChekRequiredOnPrint). success = print allowed; a failed call never blocks.
export const CheckLabReportPrintPayment = async (testIDs) => {
  try {
    return await makeApiRequest(
      `${apiUrls.CheckLabReportPrintPayment}?TestIDs=${encodeURIComponent(testIDs)}`,
      { method: "GET" },
    );
  } catch (error) {
    return { success: true };
  }
};
