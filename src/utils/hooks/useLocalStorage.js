export const useLocalStorage = (key, type, valueToStore) => {
  if (type === 'set') {
    window.localStorage.setItem(key, JSON.stringify(valueToStore))
  } else if (type === 'get') {
    const raw = window.localStorage.getItem(key);
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }
};

export const getGlobalResourseApiData = async () => {
  try {
    const token = window.localStorage.getItem("token");
    const tokenClean = token ? token.replace(/^"|"$/g, '') : '';
    const validUserRaw = window.localStorage.getItem("userData");
    let validUser = null;
    try {
      validUser = JSON.parse(validUserRaw);
    } catch (e) { }

    const dynamicUrl = import.meta.env.VITE_APP_REACT_APP_DYNAMIC_URL === "true";
    const baseFromEnv = import.meta.env.VITE_APP_REACT_APP_BASE_URL;
    const baseUrl = dynamicUrl
      ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}/api/v1`
      : baseFromEnv;

    let url = `${baseUrl}/DiscountOTP/GetGlobalResources`;
    if (validUser?.userValidateID) {
      url += `?userValidateID=${validUser.userValidateID}`;
    }

    const response = await window.fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: tokenClean ? `Bearer ${tokenClean}` : "",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const resources = data?.data?.length > 0 ? data.data : [];

    const registrationChargeApplicable = resources.find(
      (item) => item.Name === "RegistrationChargeApplicable"
    );
    window.localStorage.setItem(
      "RegistrationChargeApplicable",
      registrationChargeApplicable?.Value || "0"
    );

    const ViewDocumentsDatewise = resources.find(
      (item) => item.Name === "ViewDocumentsDatewise"
    );
    window.localStorage.setItem(
      "ViewDocumentsDatewise",
      ViewDocumentsDatewise?.Value || 0
    );
    const IsAdmassionRemarks = resources.find(
      (item) => item.Name === "IsAdmassionRemarks"
    );
    window.localStorage.setItem(
      "IsAdmassionRemarks",
      IsAdmassionRemarks?.Value || 0
    );

    return resources;
  } catch (error) {
    console.error("Error in getGlobalResourseApiData:", error);
  }
};
