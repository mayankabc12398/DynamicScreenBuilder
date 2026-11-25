import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../components/formComponent/DatePicker";
import Input from "../../../components/formComponent/Input";
import { AutoComplete } from "primereact/autocomplete";
import { Table } from "react-bootstrap";
import Tables from "../../../components/UI/customTable";
import { debounce, handleReactSelectDropDownOptions } from "../../../utils/utils";
import { CommonAPIbindOPDPackageEdit, CommonAPIbindPackageDocDetail, CommonAPIBindPackageOtherDetail, EDPBindCategoryAPI, EDPBindPackageAPI, EDPBindSubCategoryAPI, ServicesSetupLoadAppVisitType, ServicesSetupLoadDepartment, ServicesSetupSavePackageOPD } from "../../../networkServices/EDP/edpApi";
import { GetBindDoctorforChangePatient, GetLoadOPD_All_ItemsLabAutoComplete, LoadOPD_All_Items } from "../../../networkServices/opdserviceAPI";
import { notify } from "../../../utils/ustil2";
import { BindCategory } from "../../../networkServices/BillingsApi";
import { GetBindSubCatgeory } from "../../../store/reducers/common/CommonExportFunction";
import { useDispatch } from "react-redux";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";

const OPDpkgMasterMain = ({ data }) => {
  const [t] = useTranslation();
  const dispatch = useDispatch();
  const initialValues = {
    selectType: {
      label: "New",
      value: "1",
    },
    Package: {
      value: "0",
    },
    ValidFrom: new Date(),
    ValidTo: new Date(),
    CPTCode: "",
    IsActive: {
      label: "Active",
      value: "1",
    },
    Type: { value: "0" },
    Category: { value: "0" },
    subCategory: { label: 'All', value: '0' },
    validDays: "",
    vaccination: { label: "No", value: "1" },
    consumables: { label: "No", value: "1" },
    pkgName: "",
    Package: { value: "0" },
  };

  const FIRSTTHEAD = [
    { name: t("S.No."), width: "1%" },
    { name: t("Item Name") },
    { name: t("Category") },
    { name: t("Quantity") },
    { name: t("Delete") },
  ];
  const THEAD = [
    { name: t("S.No."), width: "1%" },
    { name: t("Doctor Visit") },
    { name: t("Department") },
    { name: t("Doctor") },
    { name: t("Delete") },
  ];

  const [values, setValues] = useState({ ...initialValues });
  const [items, setItems] = useState([]);
  const [dropDownData, setDropDownData] = useState({ packageList: [], categoryList: [], subCategoryList: [] });
  const [tableData, setTableData] = useState({});
  const [newTableData, setNewTableData] = useState([]);
  const [itemTableData, setItemTableData] = useState([]);
  console.log("tableData", newTableData)


  const handleInputChange = (e, index, label) => {
    const { value } = e.target;
    setValues((val) => ({ ...val, [label]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };
  const search = async (event) => {

    const payload = {
      "CategoryID": values?.Category?.value ?? 0,
      "SubCategoryID": values?.subCategory?.value ?? 0,
      "Type": values?.Type?.value ?? 0,
      "query": event?.query.trim(),
    }

    const item = await LoadOPD_All_Items(payload);
    if (item?.success) {
      const filteredData = item?.data?.filter((val) => val?.item?.toLowerCase()?.includes(event?.query?.toLowerCase()));
      setItems(filteredData);
    } else {
      setItems([]);
    }
  };



  const handleReactSelectConsultaionDetail = (label, value) => {
    setTableData((val) => ({ ...val, [label]: value }));
  };
  const itemTemplate = (item) => {
    return (
      <div className="p-clearfix">
        <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
          {item?.autoCompleteItemName}
        </div>
      </div>
    );
  };

  const handleSelectRow = (e) => {
    debugger
    setItemTableData((prev) => ([...prev, { ...e?.value, quantity: 1, ItemID: e?.value?.item_ID }]))
    setValues((val) => ({ ...val, ItemName: "" }))
  };

  const handleAdd = () => {
    if (tableData?.DoctorVisit && tableData?.Department) {
      setNewTableData((prev) => [...prev, tableData]);
      setTableData({});
    } else {
      notify(t("Please select Doctor Visit and Department"), "error");
    }
  };

  const handleDelete = (indexToDelete) => {
    setNewTableData((prevData) =>
      prevData.filter((_, index) => index !== indexToDelete)
    );
  };
  const handleFirstDelete = (indexToDelete) => {
    setItemTableData((prevData) =>
      prevData.filter((_, index) => index !== indexToDelete)
    );
  };

  const pkgDetailsData = async () => {
    try {
      const response = await CommonAPIBindPackageOtherDetail(values?.Package?.value);
      if (response?.success) {
        setValues((val) => ({
          ...val,
          ValidFrom: response?.data[0]?.FromDate ? new Date(response?.data[0]?.FromDate) : new Date(),
          ValidTo: response?.data[0]?.ToDate ? new Date(response?.data[0]?.ToDate) : new Date(),
          CPTCode: response?.data[0]?.ItemCode,
          IsActive: response?.data[0]?.IsActive === 1 ? { label: "Active", value: "1" } : { label: "Inactive", value: "0" },
        }))
      } else {
        // setValues(initialValues)
      }
    } catch (e) {
      notify(response?.message, "error")
    }
  }
  const CommonAPIbindOPDPackage = async () => {
    try {
      const response = await CommonAPIbindOPDPackageEdit(values?.Package?.value);
      if (response?.success) {
        setItemTableData(response?.data?.map((val) => ({
          typeName: val?.Item,
          ItemID: val?.ItemID,
          quantity: val?.Quantity,
          categoryName: val?.categoryName,
          subCategoryID: val?.SubCategoryID || val?.subCategoryID,
        })))
      } else {
        // setValues(initialValues)
        setItemTableData([])
      }
    } catch (e) {
      notify(response?.message, "error")
    }
  }
  const CommonAPIbindPackageDoc = async () => {
    try {
      const response = await CommonAPIbindPackageDocDetail(values?.Package?.value);
      if (response?.success) {
        setNewTableData(response?.data?.map((val) => ({
          DoctorVisit: { label: val?.VisitType, value: val?.SubCategoryID },
          Department: { label: val?.Department, value: val?.DocDepartmentID },
          // no doctor saved (blank / 0) -> leave Doctor empty rather than a blank option
          Doctor:
            val?.DoctorID && String(val.DoctorID) !== "0"
              ? { label: val?.DName, value: val?.DoctorID }
              : null,
        })))
        setValues((val) => ({ ...val, validDays: response?.data[0]?.ValidDays }))
      } else {
        // setValues(initialValues)
        setNewTableData([])
      }
    } catch (e) {
      notify(response?.message, "error")
    }
  }

  const getBindDoctor = async () => {
    try {
      const response = await GetBindDoctorforChangePatient(tableData?.Department?.label);
      setDropDownData((val) => ({
        ...val,
        GetBindAllDoctor: handleReactSelectDropDownOptions(
          response?.data,
          "Name",
          "DoctorID",
        ),
      }));
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const bindVisitType = async () => {
    const response = await ServicesSetupLoadAppVisitType();
    if (response?.success) {
      setDropDownData((prevData) => ({ ...prevData, visitTypeList: handleReactSelectDropDownOptions(response?.data, "Name", "SubCategoryID") }));
    } else {
      setDropDownData((prevData) => ({ ...prevData, visitTypeList: [] }));
    }
  }



  const handleReactSelect = (label, value) => {
    if (value?.label === "Edit") {
      setValues(initialValues);
      setItemTableData([]);
      setNewTableData([]);
    }
    setValues((val) => ({ ...val, [label]: value }));
  };

  const bindCategoryData = async () => {
    const response = await BindCategory(values?.Type?.value);
    if (response?.success) {
      setDropDownData((prevData) => ({ ...prevData, categoryList: handleReactSelectDropDownOptions(response?.data, "name", "categoryID") }));
    }
  }

  const subCategoryBind = async (Type, CategoryID) => {
    try {
      const data = await dispatch(GetBindSubCatgeory({ Type, CategoryID }));
      if (data?.payload?.success) {
        setDropDownData((prevData) => ({ ...prevData, subCategoryList: handleReactSelectDropDownOptions(data?.payload?.data, "name", "subCategoryID") }));
        setValues((val) => ({
          ...val,
          subCategory: { label: "All", value: "0" }
        }))
      } else {
        setDropDownData((prevData) => ({ ...prevData, subCategoryList: [] }));
        setValues((val) => ({
          ...val,
          subCategory: { label: "All", value: "0" }
        }))
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };


  const bindData = async () => {
    const [packageList] = await Promise.all([
      EDPBindPackageAPI(),
    ]);
    if (packageList?.success) {
      setDropDownData((prevData) => ({ ...prevData, packageList: handleReactSelectDropDownOptions(packageList?.data, "Name", "PackageID") }));
    }
  }

  useEffect(() => {
    bindData();
    bindVisitType();
    bindLoadDept();
  }, [])


  useEffect(() => {
    if (values?.Package?.value && values?.Package?.value !== "0") {
      pkgDetailsData();
      CommonAPIbindOPDPackage();
      CommonAPIbindPackageDoc();
      setValues((val) => ({
        ...val,
        pkgName: values?.Package?.label
      }))
    }
  }, [values?.Package])

  useEffect(() => {
    if (values?.Type?.value) {
      bindCategoryData();
    }
  }, [values?.Type])

  useEffect(() => {
    if (values?.Category?.value) {
      subCategoryBind(values?.Type?.value, values?.Category?.value);
    }
  }, [values?.Category])

  useEffect(() => {
    if (tableData?.Department?.value) {
      getBindDoctor();
    }
  }, [tableData?.Department?.value])

  const handleTableDataChange = (e, index, label) => {
    const { value } = e.target;
    setItemTableData((prevData) => {
      const updatedData = [...prevData];
      updatedData[index] = { ...updatedData[index], [label]: value };
      return updatedData;
    });
  };

  const handleSave = async () => {
    const ip = useLocalStorage("ip", "get");

    debugger
    const payload = {
      itemDetail: itemTableData?.map((item) => ({
        itemID: item?.ItemID?.toString() ?? "",
        subCategoryID: item?.SubCategoryID?.toString() || item?.subCategoryID?.toString() || values?.subCategory?.value?.toString() || "0",
        investigationID: item?.type_ID?.toString() ?? "",
        itemName: item?.typeName ?? "",
        quantity: Number(item?.quantity) ?? 1,
      })) ?? [],
      NoOfValidDays: values?.validDays ?? "0",
      doctorVisitDetail: newTableData?.map((doc) => ({
        subCategoryID: doc?.DoctorVisit?.value?.toString() ?? "0",
        docDepartmentID: doc?.Department?.value?.toString() ?? "",
        doctorID: doc?.Doctor?.value?.toString() ?? "",
      })) ?? [],

      packageinfo: [
        {
          packageID: values?.selectType?.value === "1" ? "0" : values?.Package?.value?.toString() ?? "0",
          packageName: values?.pkgName ?? "",
          itemCode: values?.CPTCode ?? "",
          active: values?.IsActive?.value ?? "1",
          fromDate: values?.ValidFrom
            ? `${values.ValidFrom.getFullYear()}-${String(values.ValidFrom.getMonth() + 1).padStart(2, '0')}-${String(values.ValidFrom.getDate()).padStart(2, '0')}`
            : "",
          toDate: values?.ValidTo
            ? `${values.ValidTo.getFullYear()}-${String(values.ValidTo.getMonth() + 1).padStart(2, '0')}-${String(values.ValidTo.getDate()).padStart(2, '0')}`
            : "",
        },
      ],

      isConsumablesAllow: Number(values?.consumables?.value) ?? 0,
      isVaccinationAllow: Number(values?.vaccination?.value) ?? 0,
      ipaddress: ip ?? "",
    };
    const response = await ServicesSetupSavePackageOPD(payload);
    if (response?.success) {
      notify(response?.message, "success");
      setValues(initialValues);
      setItemTableData([]);
      setNewTableData([]);
      bindData();
    } else {
      notify(response?.message, "error");
    }
  };

  const bindLoadDept = async () => {
    const response = await ServicesSetupLoadDepartment();
    if (response?.success) {
      setDropDownData((prevData) => ({ ...prevData, departmentList: handleReactSelectDropDownOptions(response?.data, "Department", "DocDepartmentID") }));
    } else {
      setDropDownData((prevData) => ({ ...prevData, departmentList: [] }));
    }
  }



  return (
    <div className="card">
      <Heading
        title={data?.breadcrumb}
        // isMainHeading={{ data: data, FrameMenuID: data?.FrameMenuID }}
        data={data}
        isSlideScreen={true}
        isBreadcrumb={true}
      />
      <div className="row p-2">
        <ReactSelect
          placeholderName={t("Select Type")}
          name="selectType"
          value={values?.selectType?.value}
          removeIsClearable={true}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: "New", value: "1" },
            { label: "Edit", value: "0" },
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={values?.selectType?.value === "0" ? t("Package") : t("Copy from Package")}
          name="Package"
          value={values?.Package?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownData?.packageList}
          removeIsClearable={true}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        {values?.selectType?.value === "1" && <Input
          type="text"
          className={"form-control required-fields"}
          lable={t("Package Name")}
          placeholder=" "
          name="pkgName"
          onChange={(e) => handleInputChange(e, 0, "pkgName")}
          value={values?.pkgName}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />}
        <DatePicker
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          className="custom-calendar"
          placeholder=""
          lable={t("Valid From")} // Corrected to "lable"
          name="ValidFrom"
          id="ValidFrom"
          value={values?.ValidFrom ? values?.ValidFrom : new Date()}
          // showTime
          // hourFormat="12"
          handleChange={handleChange}
        />
        <DatePicker
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          className="custom-calendar"
          placeholder=""
          lable={t("Valid To")} // Corrected to "lable"
          name="ValidTo"
          id="ValidTo"
          value={values?.ValidTo ? values?.ValidTo : new Date()}
          // showTime
          // hourFormat="12"
          handleChange={handleChange}
        />
        <Input
          type="text"
          className={"form-control required-fields"}
          lable={t("CPT Code")}
          placeholder=" "
          name="CPTCode"
          onChange={(e) => handleInputChange(e, 0, "CPTCode")}
          value={values?.CPTCode}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className={"form-control required-fields"}
          lable={t("Valid Days")}
          placeholder=" "
          name="validDays"
          onChange={(e) => handleInputChange(e, 0, "validDays")}
          value={values?.validDays}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Is Active")}
          name="IsActive"
          value={values?.IsActive?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: "Active", value: "1" },
            { label: "Inactive", value: "0" },
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
      </div>
      <Heading title={t("Package Details")} isBreadcrumb={false} />
      <div className="row p-2">
        <ReactSelect
          placeholderName={t("Type")}
          name="Type"
          value={values?.Type?.value}
          removeIsClearable={true}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: "All", value: "0" },
            { label: "Investigation", value: "1" },
            { label: "Procedures", value: "2" },
            { label: "Other Charges", value: "3" }
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Category")}
          name="Category"
          value={values?.Category?.value}
          removeIsClearable={true}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownData?.categoryList}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Sub Category")}
          name="subCategory"
          value={values?.subCategory?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownData?.subCategoryList}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Is Vaccination")}
          name="vaccination"
          value={values?.vaccination?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: "Yes", value: "1" },
            { label: "No", value: "0" },
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Is Consumables")}
          name="consumables"
          value={values?.consumables?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: "Yes", value: "1" },
            { label: "No", value: "0" },
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <div className="col-xl-2 col-md-4 col-sm-6 col-12">
          <AutoComplete
            value={values?.ItemName ? values?.ItemName : ""}
            suggestions={items}
            completeMethod={search}
            className="required-fields w-100"
            onSelect={(e) => handleSelectRow(e)}
            id="searchtest"
            onChange={(event) => {
              console.log("ASdasd", event)
              setValues((val) => ({ ...val, ItemName: event?.target?.value?.NewItemID ? event?.target?.value?.typeName : event?.target?.value }));
            }}
            itemTemplate={itemTemplate}
          />
          <label
            className="label lable truncate ml-3"
            style={{ fontSize: "5px !important" }}
          >
            {t("Search Item")}
          </label>
        </div>

      </div>

      {itemTableData?.length > 0 && (
        <div className="card">
          <Heading title={t("Package Details Table")} />
          <Tables
            thead={FIRSTTHEAD}
            tbody={itemTableData?.map((ele, index) => ({
              Sno: index + 1,
              item: ele?.typeName,
              Category: ele?.categoryName,
              Quantity: (
                <>
                  <Input
                    type="number"
                    className="table-input"
                    name={"Quantity"}
                    removeFormGroupClass={true}
                    onChange={(e) => handleTableDataChange(e, index, "quantity")}
                    value={ele?.quantity}
                  />

                </>
              ),
              remove: (
                <div
                  className="fa fa-trash"
                  onClick={() => handleFirstDelete(index)}
                ></div>
              ),
            }))}
          />
        </div>
      )}

      <Heading title={t("Doctor Consultation Detail")} isBreadcrumb={false} />
      <div className="row p-2">
        <ReactSelect
          placeholderName={t("Doctor Visit")}
          name="DoctorVisit"
          value={tableData?.DoctorVisit?.value}
          handleChange={(name, e) =>
            handleReactSelectConsultaionDetail(name, e)
          }
          requiredClassName={"required-fields"}
          // update dynamic option
          dynamicOptions={dropDownData?.visitTypeList}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Department")}
          name="Department"
          value={tableData?.Department?.value}
          handleChange={(name, e) =>
            handleReactSelectConsultaionDetail(name, e)
          }
          requiredClassName={"required-fields"}
          // update dynamic option
          dynamicOptions={dropDownData?.departmentList}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Doctor")}
          name="Doctor"
          value={tableData?.Doctor?.value}
          handleChange={(name, e) =>
            handleReactSelectConsultaionDetail(name, e)
          }
          // update dynamic option
          dynamicOptions={dropDownData?.GetBindAllDoctor}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <button
          className=" btn btn-sm btn-success ml-2 px-3"
          onClick={handleAdd}
        >
          {t("Add")}
        </button>
      </div>

      {newTableData && (
        <Tables
          thead={THEAD}
          tbody={newTableData?.map((ele, index) => ({
            Sno: index + 1,
            Visit: ele?.DoctorVisit?.label,
            Department: ele?.Department?.label,
            Doctor: ele?.Doctor?.label,
            remove: (
              <div
                className="fa fa-trash"
                onClick={() => handleDelete(index)}
              ></div>
            ),
          }))}
        />
      )}
      <div className="d-flex justify-content-end p-2">
        <button className="btn btn-success" onClick={handleSave}>{values?.selectType === "1" ? t("Update") : t("Save")}</button>
      </div>
    </div>
  );
};

export default OPDpkgMasterMain;
