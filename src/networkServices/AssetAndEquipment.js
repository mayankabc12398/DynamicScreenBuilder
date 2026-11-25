import makeApiRequest from "./axiosInstance";
import { apiUrls } from "./apiEndpoints";

export const loadSupplier = async () => {
    return await makeApiRequest(`${apiUrls.loadSupplier}`, { method: "get" });
};

export const loadInsuranceSupplier = async () => {
    return await makeApiRequest(`${apiUrls.loadInsuranceSupplier}`, { method: "get" });
};

export const SearchGRNDataforWarrantyAMC = async (payload) => {
    return await makeApiRequest(`${apiUrls.SearchGRNDataforWarrantyAMC}`, { method: "post", data: payload });
};

export const LoadWarrantyDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.LoadWarrantyDetails}`, { method: "post", data: payload });
};

export const SaveWarrantyDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.SaveWarrantyDetails}`, { method: "post", data: payload });
};

export const LoadAMCDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.LoadAMCDetails}`, { method: "post", data: payload });
};

export const SaveAMCDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.SaveAMCDetails}`, { method: "post", data: payload });
};

export const LoadCAMCDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.LoadCAMCDetails}`, { method: "post", data: payload });
};

export const SaveCAMCDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.SaveCAMCDetails}`, { method: "post", data: payload });
};

export const LoadInsuranceDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.LoadInsuranceDetails}`, { method: "post", data: payload });
};

export const SaveInsuranceDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.SaveInsuranceDetails}`, { method: "post", data: payload });
};

export const LoadServiceProviderDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.LoadServiceProviderDetails}`, { method: "post", data: payload });
};

export const SaveServiceProviderDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.SaveServiceProviderDetails}`, { method: "post", data: payload });
};

export const SaveNotApplicableDetails = async (payload) => {
    return await makeApiRequest(`${apiUrls.SaveNotApplicableDetails}`, { method: "post", data: payload });
};

export const BindAssetDocument = async (payload) => {
    return await makeApiRequest(`${apiUrls.BindAssetDocument}`, { method: "post", data: payload });
};

export const UploadAssetDocument = async (payload) => {
    return await makeApiRequest(`${apiUrls.UploadAssetDocument}`, {
        method: "post",
        data: payload,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
};

export const AssetBindVendor = async () => {
    return await makeApiRequest(`${apiUrls.AssetBindVendor}`, { method: "get" });
};

export const AssetGetPurchaseOrders = async (payload) => {
    return await makeApiRequest(`${apiUrls.AssetGetPurchaseOrders}`, { method: "post", data: payload });
};

export const AssetGetPurchaseOrderItems = async (payload) => {
    return await makeApiRequest(`${apiUrls.AssetGetPurchaseOrderItems}`, { method: "post", data: payload });
};

export const AssetSaveGRN = async (payload) => {
    return await makeApiRequest(`${apiUrls.AssetSaveGRN}`, { method: "post", data: payload });
};

export const AssetGetTaxCalculations = async (payload) => {
    return await makeApiRequest(`${apiUrls.AssetGetTaxCalculations}`, { method: "post", data: payload });
};
export const AssetGetItemList = async (payload) => {
    return await makeApiRequest(`${apiUrls.AssetGetItemList}`, { method: "post", data: payload });
};
