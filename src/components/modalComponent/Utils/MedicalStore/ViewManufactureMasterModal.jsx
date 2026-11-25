import React, { useCallback, useEffect, useState } from "react";
import Input from "../../../formComponent/Input";
import { UpdateManufacture } from "../../../../networkServices/InventoryApi";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
import {
  filterByTypes,
  handleReactSelectDropDownOptions,
  inputBoxValidation,
  notify,
  payloadDiscountOPD,
} from "../../../../utils/utils";
import {
  dynamicOptions,
  MOBILE_NUMBER_VALIDATION_REGX,
} from "../../../../utils/constant";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../formComponent/ReactSelect";
import {
  getBindDistrictList,
  getBindStateList,
} from "../../../../networkServices/ReportsAPI";
import { EDPGetStateByCountryID } from "../../../../networkServices/EDP/govindedp";

const ViewManufactureMasterModal = ({
  handeAdd,
  view,
  setModalData,
  handleSearch,
  payload1,
  errors,
  setErrors,
  CentreWiseCache,
  setTableData,
}) => {
  debugger;
  // console.log("Viewzzz" , view)
  const [t] = useTranslation();
  const ip = useLocalStorage("ip", "get");

  useEffect(() => {
    setPayload(payload1);
  }, [payload1]);

  const [payload, setPayload] = useState(payload1);
  const [debouncedPayload, setDebouncedPayload] = useState(payload);
  const [districtData, setDistrictData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [apiData, setApiData] = useState({
    getCountry: [],
  });
  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;
  //   console.log("name", name, "value", value, "type", type);
  //   setPayload((val) => ({
  //     ...val,
  //     [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
  //   }));
  //   if (view) {
  //     ("");
  //   } else {
  //     handeAdd({
  //       ...payload,
  //       [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
  //     });
  //   }
  // };

  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;
  //   console.log("name", name, "value", value, "type", type);
  //   setPayload((val) => ({
  //     ...val,
  //     [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
  //   }));
  // };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setPayload((prev) => ({ ...prev, [name]: value }));

  //   // Ensure `handeAdd` is called properly
  //   handeAdd(payload, payload.termsList);
  // };

  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;
  //   const updatedPayload = {
  //     ...payload,
  //     [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
  //   };

  //   setPayload(updatedPayload);

  //   // Ensure selectedIds updates
  //   handeAdd(updatedPayload, updatedPayload.termsList || []);
  // };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedPayload = {
      ...payload,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    };

    setPayload(updatedPayload);

    // Ensure termsList updates
    if (name === "termsList") {
      handeAdd(updatedPayload, value);
    }
  };

  const debouncedUpdate = useCallback(() => {
    if (!view) {
      handeAdd(debouncedPayload);
    }
  }, [debouncedPayload, view, handeAdd]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPayload(payload);
    }, 300); // Adjust debounce delay (e.g., 300ms)

    return () => {
      clearTimeout(handler);
    };
  }, [payload]);

  useEffect(() => {
    debouncedUpdate();
  }, [debouncedUpdate]);

  const handleReactSelect = (name, value) => {
    console.log("name", name, "val", value);
    if (name === "State" || name === "District") {
      setPayload((val) => ({ ...val, [name]: value }));
      return;
    }
    if (name === "countryID") {
      setPayload((val) => ({ ...val, ["Country"]: value?.value || "" }));
    }
    if (name === "cityID") {
      setPayload((val) => ({ ...val, ["City"]: value?.value || "" }));
    }
    setPayload((val) => ({ ...val, [name]: value?.value || "" }));
    // console.log("payload is here", payload);
  };

  const AddEditItems = () => {
    debugger;
    // console.log("View" , view)
    const newTableData = {
      Name: view?.CompanyName || "",
      ManufacturerName: view?.CompanyName || "",
      manufactureCode: view?.manufactureCode || "",
      Address1: view?.Address1 || "",
      Address2: view?.Address2 || "",
      Address3: view?.Address3 || "",
      PostalCode: view?.PinCode || "",
      City: view?.City || "",
      State: view?.State || "",
      District: view?.District || "",
      Country: view?.Country || "",
      ContactPerson: view?.ContactPerson || "",
      TelephoneNo: view?.Phone || "",
      Fax: view?.Fax || "",
      EMail: view?.Email || "",
      GSTIN: view?.Man_GSTINNo || "",
      isAssetActive: view?.IsAsset === "Yes" ? 1 : 0,
      isActive: view?.IsActive === "Active" ? 1 : 0,
    };

    // console.log("Newpayload" , newTableData)

    setPayload(newTableData);
    // console.log("New payload" , payload)
  };
  useEffect(() => {
    if (view) {
      AddEditItems();
    }
  }, [view]);
  // const ErrorHandling = () => {
  //   let errors = {};
  //   errors.id = [];
  //   if (!payload?.Name) {
  //     errors.Name = " Name Is Required";
  //     errors.id[errors.id?.length] = "Name";
  //   }
  //   if (!payload?.TelephoneNo) {
  //     errors.TelephoneNo = "TelephoneNo Is Required";
  //     errors.id[errors.id?.length] = "TelephoneNo";
  //   }

  //   return errors;
  // };

  const ErrorHandling = () => {
    const errors = {};
    if (!payload?.Name) {
      errors.Name = "Name is required";
    }
    if (!payload?.TelephoneNo) {
      errors.TelephoneNo = "Telephone number is required";
    }
    return errors;
  };

  // const handleUpdateManufacture = async () => {
  //   const customerrors = ErrorHandling();
  //   if (Object.keys(customerrors)?.length > 1) {
  //     if (Object.values(customerrors)[0]) {
  //       notify(Object.values(customerrors)[1], "error");
  //       setErrors(customerrors);
  //     }
  //     return false;
  //   }
  //   try {
  //     const Itempayload = {
  //       manufactureId: Number(view?.ManufactureID) || 0,
  //       manufactureName: String(payload?.Name || ""),
  //       contactPerson: String(payload?.ContactPerson || ""),
  //       address: String(payload?.Address1 || ""),
  //       address2: String(payload?.Address2 || ""),
  //       address3: String(payload?.Address3 || ""),
  //       phone: String(payload?.TelephoneNo || ""),
  //       mobile: String(payload?.TelephoneNo || ""),
  //       fax: String(payload?.Fax || ""),
  //       email: String(payload?.EMail || ""),
  //       gstinNo: String(payload?.GSTIN || ""),
  //       country: String(payload?.Country || ""),
  //       city: String(payload?.City || ""),
  //       pinCode: String(payload?.PostalCode) || "",
  //       dlNo: String(view?.DLNo || ""),
  //       tinNo: String(view?.TinNo || ""),
  //       isActive: view?.IsActive === "Active" ? 1 : 0,
  //       manufactureCode: String(payload?.manufactureCode || ""),
  //       ipAddress: String(ip),
  //       isAsset: payload?.isAssetActive || 0,
  //     };
  //     console.log("ItemPayload", Itempayload);
  //     const response = await UpdateManufacture(Itempayload);
  //     if (response?.success) {
  //       notify(response?.message, "success");
  //       // handleSearch();
  //       setModalData(false);
  //     } else {
  //       notify(response?.message, "error");
  //     }
  //   } catch (error) {
  //     console.error("Something went wrong", error);
  //   }
  // };

  const handleUpdateManufacture = async () => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors).length > 0) {
      notify(customerrors[Object.keys(customerrors)[0]], "error");
      setErrors(customerrors);
      return false;
    }

    try {
      const Itempayload = {
        manufactureId: Number(view?.ManufactureID) || 0,
        manufactureName: String(payload?.Name || ""),
        contactPerson: String(payload?.ContactPerson || ""),
        address: String(payload?.Address1 || ""),
        address2: String(payload?.Address2 || ""),
        address3: String(payload?.Address3 || ""),
        phone: String(payload?.TelephoneNo || ""),
        mobile: String(payload?.TelephoneNo || ""),
        fax: String(payload?.Fax || ""),
        email: String(payload?.EMail || ""),
        gstinNo: String(payload?.GSTIN || ""),
        country: String(payload?.Country || ""),
        city: String(payload?.City || ""),
        state: String(payload?.State || ""),
        district: String(payload?.District || ""),
        pinCode: String(payload?.PostalCode) || "",
        dlNo: String(view?.DLNo || ""),
        tinNo: String(view?.TinNo || ""),
        isActive: payload?.isActive || 0, // Use payload.isActive
        manufactureCode: String(payload?.manufactureCode || ""),
        ipAddress: String(ip),
        isAsset: payload?.isAssetActive || 0, // Use payload.isAssetActive
      };

      console.log("ItemPayload", Itempayload);
      const response = await UpdateManufacture(Itempayload);
      if (response?.success) {
        notify(response?.message, "success");
        setTableData ? setTableData([]) : "";
        setModalData(false);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };

  useEffect(() => {
    if (errors?.id) {
      const inputElement = document.getElementById(errors?.id[0]);
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [errors]);
  const fetchState = async () => {
    try {
      const requestBody = {
        countryID: payload?.Country,
      };
      debugger;
      const dataState = await getBindStateList(requestBody?.countryID);

      if (countryData?.success) {
        setCountryData(countryData?.data);
      }
      if (dataState?.success) {
        setApiData((prev) => ({
          ...prev,
          getState: handleReactSelectDropDownOptions(
            dataState?.data,
            "StateName",
            "StateID",
          ),
        }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchDistrict = async () => {
    try {
      const requestBody = {
        countryId: payload?.Country,
        StateId: payload?.State?.value,
      };
      const dataDistrict = await getBindDistrictList(requestBody);
      if (districtData?.success) {
        setDistrictData(districtData?.data);
      }
      //
      if (dataDistrict?.success) {
        setApiData((prev) => ({
          ...prev,
          getDistrict: handleReactSelectDropDownOptions(
            dataDistrict?.data,
            "District",
            "DistrictID",
          ),
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (payload?.State?.value) {
      fetchDistrict();
    }
  }, [payload?.State?.value]);

  useEffect(() => {
    if (payload?.Country) {
      fetchState();
    }
  }, [payload?.Country]);
  return (
    <>
      <div className="row p-2">
        <Input
          type="text"
          className={`form-control required-fields ${errors?.Name && "required-fields-active"}`}
          id="Name"
          name="Name"
          value={payload?.Name}
          onChange={handleChange}
          lable={t("Name")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="manufactureCode"
          name="manufactureCode"
          value={payload?.manufactureCode}
          onChange={handleChange}
          lable={t("Code")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="Address1"
          name="Address1"
          value={payload?.Address1}
          onChange={handleChange}
          lable={t("Address") + 1}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="Address2"
          name="Address2"
          value={payload?.Address2}
          onChange={handleChange}
          lable={t("Address") + 2}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="Address3"
          name="Address3"
          value={payload?.Address3}
          onChange={handleChange}
          lable={t("Address") + 3}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          id="PostalCode"
          name="PostalCode"
          value={payload?.PostalCode}
          onChange={handleChange}
          lable={t("Postal Code")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        {/* <Input
          type="text"
          className="form-control"
          id="City"
          name="City"
          value={payload?.City}
          onChange={handleChange}
          lable={t("City")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        /> */}

        {/* {console.log("Payload", payload)} */}

        {/* <Input
          type="text"
          className="form-control"
          id="Country"
          name="Country"
          value={payload?.Country}
          onChange={handleChange}
          lable={t("Country")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        /> */}
        {console.log("payload country ", payload?.Country)}
        <ReactSelect
          placeholderName={t("Country")}
          searchable={true}
          id="Country"
          requiredClassName={`required-fields ${errors?.Country && "required-fields-active"}`}
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
          dynamicOptions={filterByTypes(
            CentreWiseCache,
            [7],
            ["TypeID"],
            "TextField",
            "ValueField",
            "STD_CODE",
          )}
          name="countryID"
          value={payload?.Country}
          handleChange={handleReactSelect}
          //tabIndex="-1"
        />
        <ReactSelect
          placeholderName={t("State")}
          name="State"
          value={payload?.State?.value || payload?.State}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={apiData?.getState}
          searchable={true}
          requiredClassName={"required-fields"}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("District")}
          name="District"
          value={payload?.District?.value || payload?.District}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={apiData?.getDistrict}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          requiredClassName={"required-fields"}
        />
        {/* <ReactSelect
          placeholderName={t("City")}
          searchable={false}
          requiredClassName={`required-fields ${errors?.City && "required-fields-active"}`}
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
          id="City"
          dynamicOptions={filterByTypes(
            CentreWiseCache,
            [10],
            ["TypeID"],
            "TextField",
            "ValueField"
          )}
          name="cityID"
          value={`${payload?.City}`}
          handleChange={handleReactSelect}
        /> */}
        <Input
          type="text"
          className="form-control"
          id="ContactPerson"
          name="ContactPerson"
          value={payload?.ContactPerson}
          onChange={handleChange}
          lable={t("ContactPerson")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className={`form-control required-fields ${errors?.TelephoneNo && "required-fields-active"}`}
          id="TelephoneNo"
          name="TelephoneNo"
          value={payload?.TelephoneNo}
          onChange={(e) => {
            inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, handleChange);
          }}
          lable={t("Contact Number")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        {/* <Input
          type="number"
          className="form-control"
          id="Fax"
          name="Fax"
          value={payload?.Fax}
          onChange={handleChange}
          lable={t("Fax")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        /> */}
        <Input
          type="text"
          className="form-control"
          id="EMail"
          name="EMail"
          value={payload?.EMail}
          onChange={handleChange}
          lable={t("Email")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        />
        {/* <Input
          type="text"
          className="form-control"
          id="GSTIN"
          name="GSTIN"
          value={payload?.GSTIN}
          onChange={handleChange}
          lable={t("GSTIN No.")}
          placeholder=" "
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
        /> */}
        <ReactSelect
          placeholderName={t("Is Asset")}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
          id="isAssetActive"
          dynamicOptions={[
            { label: t("Yes"), value: "1" },
            { label: t("No"), value: "0" },
          ]}
          name="isAssetActive"
          value={`${payload?.isAssetActive}`}
          handleChange={handleReactSelect}
        />
        <ReactSelect
          placeholderName={t("Is Active")}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
          id="isActive"
          dynamicOptions={[
            { label: t("Yes"), value: "1" },
            { label: t("No"), value: "0" },
          ]}
          name="isActive"
          value={`${payload?.isActive}`}
          handleChange={handleReactSelect}
        />
        {console.log("payload?.isAssetActive", payload?.isActive)}
      </div>
    </>
  );
};

export default ViewManufactureMasterModal;
