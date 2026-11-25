import React, { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import { Pharmacy_Type } from "../../utils/constant";
import ReportsMultiSelect from "../ReportCommonComponents/ReportsMultiSelect";
import {
  BindPharmacySubcategory,
  PharmacyInvoiceReport,
} from "../../networkServices/pharmecy";
import {
  BindEmployeeInPanelData,
  BindItemsInPanelData,
  BindTableSearchData,
} from "../../networkServices/BillingsApi";
import { BindDepartments } from "../../networkServices/BillingsApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { notify } from "../../utils/utils";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import { translateOptions } from "@components/WrapTranslate";

const PharmacyInvoice = ({ data }) => {
  const [t] = useTranslation();
  const [payload, setPayload] = useState({ type: "", subGroup: "" });
  const [subGroupId, setSubGroupId] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [returnDept, setReturnDept] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [itemData, setItemData] = useState([]);

  const THEAD = [
    { width: "1%", name: t("Sr.No") },
    { width: "5%", name: t("Department") },
    { width: "5%", name: t("Employee Name") },
    { width: "5%", name: t("Item Name") },
  ];
  const handleReactSelect = (name, value) => {
    setPayload((val) => ({ ...val, [name]: value?.value }));
  };

  const getBindPharmacySubcategory = async () => {
    try {
      const response = await BindPharmacySubcategory();
      setSubGroupId(response?.data);
    } catch (error) {
      console.error(error);
    }
  };
  const handlePayloadMultiSelect = (data) => {
    return data?.map((items, _) => String(items?.code))?.join(",");
  };
  const getBindDepartments = async () => {
    const TratransactionID = data?.transactionID;
    try {
      const response = await BindDepartments(TratransactionID);
      if (response?.success) {
        setReturnDept(response?.data);
      } else {
        setReturnDept([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getEmployeeData = async () => {
    try {
      const response = await BindEmployeeInPanelData();
      if (response?.success) {
        setEmployeeData(response?.data);
      } else {
        setEmployeeData([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getItemsData = async () => {
    const TratransactionID = data?.transactionID;
    try {
      const response = await BindItemsInPanelData(TratransactionID);
      if (response?.success) {
        setItemData(response?.data);
      } else {
        setItemData([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchData = async () => {
    const paydata = {
      ItemID: Number(payload?.itemName) || 0,
      EmployeeID: Number(payload?.empName) || 0,
      RoleID: Number(payload?.dept) || 0,
      TransactionID: Number(data?.transactionID),
    };

    try {
      const response = await BindTableSearchData(paydata);

      if (
        response?.success &&
        Array.isArray(response?.data) &&
        response.data.length > 0
      ) {
        setTableData(response.data);
      } else {
        setTableData([]);
        notify(response?.message || "Record Not Found", "error");
      }
    } catch (error) {
      console.error(error);
      setTableData([]);
    }
  };

  const handleReport = async () => {
    if (!payload?.type) {
      notify(t("Please Select the Report Type"),"warn");
    }
    const TransID = String(data?.transactionID) || "";
    const Type = String(payload?.type) || "";
    try {
      const response = await PharmacyInvoiceReport(TransID, Type);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getBindPharmacySubcategory();
    getBindDepartments();
    getEmployeeData();
    getItemsData();
  }, []);
  return (
    <>
      <div className="card">
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("Report Type")}
            id="type"
            name="type"
            label={t("Report Type")}
            value={payload?.type}
            handleChange={handleReactSelect}
            removeIsClearable={true}
            dynamicOptions={translateOptions(Pharmacy_Type, t)}
            searchable={true}
            respclass="col-xl-2 col-sm-4 col-md-6 col-12"
          />
          <ReactSelect
            placeholderName={t("Department")}
            id="dept"
            name="dept"
            label={t("Department")}
            value={payload?.dept}
            handleChange={handleReactSelect}
            removeIsClearable={true}
            dynamicOptions={[
              { label: t("All"), value: 0 },
              ...returnDept?.map((ele) => ({
                label: ele?.RoleName,
                value: ele?.RoleID,
              })),
            ]}
            searchable={true}
            respclass="col-xl-2 col-sm-4 col-md-6 col-12"
          />
          <ReactSelect
            placeholderName={t("Employee Name")}
            id="empName"
            name="empName"
            label={t("Employee Name")}
            value={payload?.empName}
            handleChange={handleReactSelect}
            removeIsClearable={true}
            dynamicOptions={[
              { label: t("All"), value: 0 },
              ...employeeData?.map((employee) => ({
                label: employee?.EmployeeName,
                value: employee?.EmployeeID,
              })),
            ]}
            searchable={true}
            respclass="col-xl-2 col-sm-4 col-md-6 col-12"
          />
          <ReactSelect
            placeholderName={t("Item Name")}
            id="itemName"
            name="itemName"
            label={t("Item Name")}
            value={payload?.itemName}
            handleChange={handleReactSelect}
            removeIsClearable={true}
            dynamicOptions={[
              { label: t("All"), value: 0 },
              ...itemData?.map((item) => ({
                label: item?.ItemName,
                value: item?.ItemID,
              })),
            ]}
            searchable={true}
            respclass="col-xl-2 col-sm-4 col-md-6 col-12"
          />
          {/* <ReportsMultiSelect
            name="subGroup"
            placeholderName={t("Sub-Group")}
            respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            values={payload}
            setValues={setPayload}
            dynamicOptions={subGroupId}
            labelKey="NAME"
            valueKey="SubCategoryID"
            requiredClassName={true}
          /> */}
          <div className="col-xl-2 col-sm-4 col-md-6 col-12">
            <button
              className="btn btn-sm btn-success mr-2"
              onClick={handleSearchData}
              type="button"
            >
              {t("Search")}
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={handleReport}
              type="button"
            >
              {t("Report")}
            </button>
          </div>
        </div>
        {tableData.length > 0 && (
          <Tables
            thead={THEAD}
            tbody={tableData?.map((data, index) => ({
              "Sr.No": index + 1,
              Department: data?.RoleName || "-",
              "Employee Name": data?.UserName || "-",
              "Item Name": data?.ItemName || "-",
            }))}
          />
        )}
      </div>
    </>
  );
};

export default PharmacyInvoice;
