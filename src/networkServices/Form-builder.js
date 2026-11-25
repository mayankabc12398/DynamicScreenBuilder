import store from "../store/store";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

export const FormBuilderCreateAndUpdateFormLayout = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.FormBuilderCreateAndUpdateFormLayout, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderSaveFormSubmission = async (payload) => {
   store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.FormBuilderSaveFormSubmission, {
      method: "post",
      data: payload,
    });
        store.dispatch(setLoading(false));
    return data;
  } catch (error) {
        store.dispatch(setLoading(false));
    console.log(error);
  }
};



export const FormBuilderGetFieldTypeMaster = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.FormBuilderGetFieldTypeMaster, {
      method: "get",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderGetFormTypeMaster = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.FormBuilderGetFormTypeMaster, {
      method: "get",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderGetFormPreviewByFormId = async (formId) => {
  try {
    const data = await makeApiRequest(`${apiUrls.FormBuilderGetFormPreviewByFormId}?form_id=${formId}`, {
      method: "get",
      //   data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderGetFormSubmissionByPatient = async (formId, patient_id, transaction_id) => {
  try {
    const data = await makeApiRequest(`${apiUrls.FormBuilderGetFormSubmissionByPatient}?form_id=${formId}&patient_id=${patient_id}&transaction_id=${transaction_id}`, {
      method: "get",
      //   data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderGetOtherTableLinkage = async (Type) => {
  try {
    const data = await makeApiRequest(`${apiUrls.FormBuilderGetOtherTableLinkage}?Type=${Type}`, {
      method: "get",
      //   data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderGetOptionValue = async (table_linkage_id) => {
  try {
    const data = await makeApiRequest(`${apiUrls.FormBuilderGetOptionValue}?table_linkage_id=${table_linkage_id}`, {
      method: "get",
      //   data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderGetPatientDefaultValue = async (table_linkage_id, patientID , TransactionID) => {
  try {
    const data = await makeApiRequest(`${apiUrls.FormBuilderGetPatientDefaultValue}?table_linkage_id=${table_linkage_id}&patientID=${patientID}&TransactionID=${TransactionID}`, {
      method: "get",
      //   data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const FormBuilderGetFormsList = async (fromDate, toDate, status) => {
  try {
    const data = await makeApiRequest(`${apiUrls.FormBuilderGetFormsList}?fromDate=${fromDate}&toDate=${toDate}&status=${status}`, {
      method: "get",
      //   data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};


export const FormBuilderUpdateStatus = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.FormBuilderUpdateStatus, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};


export const FormBuilderPrintForm = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.FormBuilderPrintForm, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
  finally{
    store.dispatch(setLoading(false));
  }
};

export const FormBuilderSaveFormSendToEmail = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.FormBuilderSaveFormSendToEmail, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
  finally{
    store.dispatch(setLoading(false));
  }
};