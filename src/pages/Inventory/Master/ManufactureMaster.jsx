import React, { useCallback, useEffect, useState } from "react";
import Input from "../../../components/formComponent/Input";
import { useTranslation } from "react-i18next";
import Heading from "../../../components/UI/Heading";
import {
  ManufactureReportList,
  MasterSearchItem,
  SaveManufacture,
  UpdateManufacture,
} from "../../../networkServices/InventoryApi";
import ManufactureDetailTable from "../../../components/UI/customTable/MedicalStore/ManufactureDetailTable";
import Modal from "../../../components/modalComponent/Modal";
import ViewManufactureMasterModal from "../../../components/modalComponent/Utils/MedicalStore/ViewManufactureMasterModal";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { filterByTypes, notify } from "../../../utils/utils";
import { exportHtmlToExcel, exportToExcel } from "../../../utils/exportLibrary";
import IconsColor from "../../../utils/IconsColor";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import {
  CentreWiseCacheByCenterID,
  CentreWisePanelControlCache,
} from "../../../store/reducers/common/CommonExportFunction";
import Tables from "../../../components/UI/customTable";
import { ExcelIconSVG } from "../../../components/SvgIcons";

const ManufactureMaster = ({ data }) => {
  const [t] = useTranslation();
  const localdata = useLocalStorage("userData", "get");
  const ip = useLocalStorage("ip", "get");
  const [errors, setErrors] = useState({});
  const [tableData, setTableData] = useState([]);

  const [ReportVisible, setReportVisible] = useState(false);
  const dispatch = useDispatch();
  const initialPayload = {
    Name: "",
    manufactureCode: "",
    Address1: "",
    Address2: "",
    Address3: "",
    PostalCode: "",
    City: "",
    State: "",
    District: "",
    Country: "",
    ContactPerson: "",
    TelephoneNo: "",
    Fax: "",
    EMail: "",
    GSTIN: "",
    isAssetActive: 0,
    // isActive:0,
    isAsset: 0,
    isActive: 1,
    ManufacturerName: "",
    StateID: 0,
    countryID: 0,
    DistrictID: 0,
    CityID: 0,
    isEdit: false,
  };
  const { BindResource } = useSelector((state) => state?.CommonSlice);
  const CentreWiseCacheByCenterIDAPI = async () => {
    let data = await dispatch(CentreWiseCacheByCenterID({}));
    if (data?.payload?.success) {
      let countryCode = filterByTypes(
        data?.payload?.data,
        [7, BindResource?.BaseCurrencyID],
        ["TypeID", "ValueField"],
        "TextField",
        "ValueField",
        "STD_CODE",
      );
      let defaultState = filterByTypes(
        data?.payload?.data,
        [8, BindResource?.DefaultStateID],
        ["TypeID", "ValueField"],
        "TextField",
        "ValueField",
      );
      let defaultDistrict = filterByTypes(
        data?.payload?.data,
        [9, BindResource?.DefaultDistrictID],
        ["TypeID", "ValueField"],
        "TextField",
        "ValueField",
      );
      let defaultCity = filterByTypes(
        data?.payload?.data,
        [10, BindResource?.DefaultCityID],
        ["TypeID", "ValueField"],
        "TextField",
        "ValueField",
      );
      // setValues((val) => ({
      //   ...val,
      //   District: values?.District
      //     ? values?.District
      //     : defaultDistrict?.length > 0 && defaultDistrict[0]?.label,
      //   State: values?.State
      //     ? values?.State
      //     : defaultState?.length > 0 && defaultState[0]?.label,
      //   City: values?.City
      //     ? values?.City
      //     : defaultCity?.length > 0 && defaultCity[0]?.label,
      //   Phone_STDCODE: values?.Phone_STDCODE
      //     ? values?.Phone_STDCODE
      //     : countryCode?.length
      //       ? countryCode[0]?.extraColomn
      //       : "+91",
      // }));
    }
  };
  const [payload, setPayload] = useState({ ...initialPayload });

  const { CentreWiseCache, CentreWisePanelControlCacheList } = useSelector(
    (state) => state.CommonSlice,
  );

  useEffect(() => {
    if (CentreWiseCache?.length === 0) {
      CentreWiseCacheByCenterIDAPI();
    }
    if (CentreWisePanelControlCacheList?.length === 0) {
      dispatch(
        CentreWisePanelControlCache({
          centreID: localdata?.defaultCentre,
        }),
      );
    }
  }, [dispatch]);

  const handeAdd = useCallback((item) => {
    setPayload(item);
  }, []);

  console.log(payload);

  const handleSearch = async () => {
    // const manufactureName = payload?.ManufacturerName
    //   ? String(payload?.ManufacturerName)
    //   : "%%%";
    const manufactureName = "%%%";
    try {
      const response = await MasterSearchItem({ manufactureName });
      const data = response?.data?.map((ele) => ({
        ...ele,
        isAssetActive: 0,
      }));

      if (response?.success && response?.data?.length > 0) {
        setTableData(data);
      } else {
        notify(response?.message, "error");
        setTableData([]);
      }
    } catch (error) {
      notify(t("Something Went's Wrong"), "error");
    }
  };
  console.log("TABLEDAT", tableData);

  const handleReport = async () => {
    // debugger
    const manufactureName = payload?.ManufacturerName
      ? String(payload?.ManufacturerName)
      : "";
    try {
      const response = await ManufactureReportList({ manufactureName });
      if (response?.success) {
        exportToExcel(response?.data, "Manufacture Master List");
        // exportHtmlToExcel(response?.data, "Manufacture Master List");
        notify(response?.message, "success");
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(t("Something Went's Wrong"), "error");
    }
  };

  const thead = [
    { name: t("S.No."), width: "3%" },
    { name: t("Name"), width: "3%" },
    { name: t("Address1"), width: "15%" },
    { name: t("Address2"), width: "15%" },
    { name: t("Postal Code"), width: "5%" },
    // { name: t("City"), width: "5%" },
    { name: t("State"), width: "5%" },
    { name: t("Distric"), width: "5%" },
    { name: t("ContactPerson"), width: "5%" },
    { name: t("Contact Number"), width: "5%" },
    // { name: t("Fax"), width: "5%" },
    { name: t("Email"), width: "5%" },
    { name: t("Status"), width: "5%" },
    { name: t("User Name"), width: "5%" },
    { name: t("Entry Date"), width: "5%" },
    { name: t("Is Asset"), width: "5%" },
    { name: t("Edit"), width: "5%" },
  ];

  const handleCancle = () => {
    setReportVisible(false);
  };

  const ErrorHandling = () => {
    let errors = {};
    errors.id = [];
    if (!payload?.Name) {
      errors.Name = " Name Is Required";
      errors.id[errors.id?.length] = "Name";
    }
    if (!payload?.Country) {
      errors.Country = "Country Is Required";
      errors.id[errors.id?.length] = "Country";
    }
    if (!payload?.State) {
      errors.State = "State Is Required !";
      errors.id[errors.id?.length] = "State";
    }
    if (!payload?.District) {
      errors.State = "District Is Required !";
      errors.id[errors.id?.length] = "District";
    }
    if (!payload?.TelephoneNo) {
      errors.TelephoneNo = "TelephoneNo Is Required";
      errors.id[errors.id?.length] = "TelephoneNo";
    }

    return errors;
  };

  const handleSaveManufacture = async () => {
    // debugger
    const customerrors = ErrorHandling();
    console.log("Custom Errors", customerrors);
    if (Object.keys(customerrors)?.length > 1) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[1], "error");
        setErrors(customerrors);
      }
      return false;
    }

    try {
      const Itempayload = {
        Name: payload?.Name || "",
        manufactureId: 0,
        manufactureName: payload?.Name || "",
        contactPerson: payload?.ContactPerson || "",
        address: payload?.Address1 || "",
        address2: payload?.Address2 || "",
        address3: payload?.Address3 || "",
        phone: payload?.TelephoneNo || "",
        mobile: "",
        fax: payload?.Fax || "",
        email: payload?.EMail || "",
        gstinNo: payload?.GSTIN || "",
        country: payload?.Country || "",
        city: payload?.City || "",
        district: payload?.District?.DistrictID || "",
        state: payload?.State?.StateID || "",
        pinCode: payload?.PostalCode || "",
        dlNo: "",
        tinNo: "",
        isActive: Number(payload?.isActive || 0),
        manufactureCode: payload?.manufactureCode || "",
        ipAddress: ip,
        isAsset: Number(payload?.isAssetActive || 0),
      };
      console.log("Payload while saving the data", Itempayload);

      const response = await SaveManufacture(Itempayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialPayload);
        setReportVisible(false);
        handleSearch();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
      notify(t("An unexpected error occurred. Please try again later."), "error");
    }
  };

  const ExceldataFormatter = (tableData) => {
    const HardCopy = JSON.parse(JSON.stringify(tableData));
    // debugger;
    const modifiedResponseData = HardCopy?.map((ele, index) => {
      return { ...ele };
    });

    return modifiedResponseData;
  };

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    console.log("tableData", tableData);
  }, [tableData]);

  const handleEdit = (ele) => {
    debugger;
    setPayload((item) => ({
      ...item,
      isAssetActive: ele?.IsAsset === "Yes" ? 1 : 0,
      isActive: ele?.IsActive === "Active" ? 1 : 0,
      manufactureCode: ele?.manufactureCode,
      Address1: ele?.Address1,
      Address2: ele?.Address2,
      Address3: ele?.Address3,
      ContactPerson: ele?.ContactPerson,
      Name: ele?.CompanyName,
      PostalCode: ele?.PinCode,
      State: { value: ele?.State, label: ele?.StateName },
      District: { value: ele?.District, label: ele?.DistrictName },
      countryID: ele?.Country,
      TelephoneNo: ele?.Phone,
      Fax: ele?.Fax,
      EMail: ele?.Email,
      GSTIN: ele?.Man_GSTINNo,
      ManufactureID: ele?.ManufactureID || "",
      StateID: ele?.State,
      cityID: ele?.City,
      City: ele.City,
      isEdit: true,
      Country: ele?.Country,
    }));
  };

  const handleUpdateManufacture = async () => {
    debugger;
    // const customerrors = ErrorHandling();
    // if (Object.keys(customerrors).length > 0) {
    //   notify(customerrors[Object.keys(customerrors)[0]], "error");
    //   setErrors(customerrors);
    //   return false;
    // }

    try {
      const Itempayload = {
        manufactureId: Number(payload?.ManufactureID) || 0,
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
        district: payload?.District?.value || payload?.District || "",
        state: payload?.State?.value || payload?.State || "",
        pinCode: String(payload?.PostalCode) || "",
        dlNo: String(payload?.DLNo || ""),
        tinNo: String(payload?.TinNo || ""),
        isActive: payload?.isActive || 0, // Use payload.isActive
        manufactureCode: String(payload?.manufactureCode || ""),
        ipAddress: String(ip),
        isAsset: payload?.isAssetActive || 0, // Use payload.isAssetActive
      };

      console.log("ItemPayload", Itempayload);
      const response = await UpdateManufacture(Itempayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialPayload);
        handleSearch();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };

  // const exportToExcelDownload = ()=>{
  //   exportToExcel(ExceldataFormatter(tableData), "Manufacture Master List");
  // }
  console.log("data?.breadcrumbdata?.breadcrumb", data);
  return (
    <>
      <div className="card">
        {/* <Heading isBreadcrumb={true} /> */}
        <Heading
          title={data?.breadcrumb}
          // isMainHeading={{ data: data, FrameMenuID: data?.FrameMenuID }}
          data={data}
          isSlideScreen={true}
          isBreadcrumb={true}
        />
        <div className="row p-2">
          <ViewManufactureMasterModal
            CentreWiseCache={CentreWiseCache}
            handeAdd={handeAdd}
            payload1={payload}
            errors={errors}
            setErrors={setErrors}
          />
          <button
            className="btn btn-success ml-2"
            onClick={
              payload?.isEdit ? handleUpdateManufacture : handleSaveManufacture
            }
          >
            {payload?.isEdit ? t("Update") : t("Save")}
          </button>
          <button
            className="btn btn-success ml-2"
            onClick={() => setPayload(initialPayload)}
          >
            {t("Cancel")}
          </button>
          {/* <Input
            type="text"
            className="form-control required-fields"
            id="ManufacturerName "
            name="ManufacturerName"
            onChange={handleChange}
            value={payload.ManufacturerName}
            lable={t("Manufacturer Name")}
            placeholder=" "
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          /> */}
          {/* <div className="col-sm-1 d-flex">
            <button
              className="btn btn-sm btn-success mx-1 px-3"
              onClick={handleSearch}
            >
              {t("Search")}
            </button>
            <button
              className="btn btn-sm btn-success mx-1 px-3"
              onClick={() => {
                setReportVisible({
                  ReportVisible: true,
                  showData: {},
                });
              }}
            >
              {t("Add New")}
            </button>
            <button
              className="btn btn-sm btn-success mx-1 px-3"
              // onClick={() => {
              //   setReportVisible({
              //     ReportVisible: true,
              //     showData: {},
              //   });
              // }}
              // onClick={() =>
              //   exportToExcel(ExceldataFormatter(tableData), "Excel")
              // }

              onClick={handleReport}
            >
              {t("Report")}
            </button>
            {tableData?.length > 0 && (
              <span
                className={`pointer-cursor`}
                onClick={() =>
                  exportToExcel(ExceldataFormatter(tableData), "Excel")
                }
              >
                <IconsColor ColorCode={"Excel"} />
              </span>
            )}
            <button
              className="btn btn-sm btn-success mx-1"
              onClick={handleReport}
            >
              Report
            </button>
          </div> */}
        </div>
      </div>
      {tableData?.length > 0 && (
        <div id="exportTableMfg" className="card mt-2">
          <Heading
            title={t("Manufacturer Details")}
            secondTitle={
              <span
                onClick={() => {
                  handleReport();
                }}
              >
                <ExcelIconSVG />
              </span>
            }
          />
          <Tables
            thead={thead}
            isSearch={true}
            scrollView={"scrollView"}
            tbody={tableData?.map((ele, index) => ({
              SrNo: index + 1,
              CompanyName: ele?.CompanyName,
              Address1: ele?.Address1,
              Address2: ele?.Address2,
              PinCode: ele?.PinCode,
              // City: ele?.CityName,
              State: ele?.StateName,
              District: ele?.DistrictName,
              ContactPerson: ele?.ContactPerson,
              Phone: ele?.Phone,
              // Fax: ele?.Fax,
              Email: ele?.Email,
              IsActive: ele?.IsActive === "Active" ? "Active" : "Inactive",
              UserName: ele?.UserName,
              EntryDate: ele?.EntryDate,
              IsAsset: ele?.IsAsset === "Yes" ? "Yes" : "No",
              edit: (
                <div className="text-center" onClick={() => handleEdit(ele)}>
                  <i className="fa fa-edit" aria-hidden="true"></i>
                </div>
              ),
            }))}
            tableHeight={"tableHeight"}
            style={{ maxHeight: "230px" }}
          />
        </div>
      )}
      {/* {ReportVisible && (
        <Modal
          modalWidth={"1000px"}
          visible={ReportVisible}
          setVisible={setReportVisible}
          Header={t("Add New Manufacture")}
          footer={
            <>
              <button
                className="btn btn-sm btn-success mx-2"
                onClick={handleSaveManufacture}
              >
                {t("Save")}
              </button>
              <button
                className="btn btn-sm btn-success mx-2"
                onClick={handleCancle}
              >
                {t("Cancle")}
              </button>
            </>
          }
        >
          {console.log("payload before sending", CentreWiseCache)}
          <ViewManufactureMasterModal
            CentreWiseCache={CentreWiseCache}
            handeAdd={handeAdd}
            payload1={payload}
            errors={errors}
            setErrors={setErrors}
          />
        </Modal>
      )} */}
    </>
  );
};

export default ManufactureMaster;
