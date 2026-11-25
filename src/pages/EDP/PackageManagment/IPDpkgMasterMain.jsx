import React, { useEffect, useState } from "react";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import Heading from "../../../components/UI/Heading";
import Input from "../../../components/formComponent/Input";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import Tables from "../../../components/UI/customTable";
import {
  EDPBindAllCategory,
  EDPBindAllItems,
  EDPBindAllSubCategory,
  EDPBindIPDPackageMaster,
  EDPBindPackageDetails,
  EDPBindPkgCategory,
  EDPBindPkgSubCategory,
  EDPLoadPanelCompany,
  EDPLoadRoomType,
  EDPSavePackage,
} from "../../../networkServices/EDP/govindedp";
import { handleReactSelectDropDownOptions } from "../../../utils/utils";
import { notify } from "../../../utils/ustil2";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { AutoComplete } from "primereact/autocomplete";
import LabeledInput from "../../../components/formComponent/LabeledInput";

const IPDpkgMasterMain = ({ data }) => {
  const localData = useLocalStorage("userData", "get");
  const ip = useLocalStorage("ip", "get");
  const [t] = useTranslation();
  const [searchvalue, setSearchValue] = useState("");
  const [itemList, setItemList] = useState([]);
  const THEAD = [
    { name: t("S.No."), width: "1%" },
    { name: t("Room Type") },
    { name: t("Package Type") },
    {
      name: t("Category"),
    },
    { name: t("SubCategory") },
    { name: t("Item Name") },
    {
      name: t("Quantity"),
    },
    {
      name: t("Amount"),
    },
    { name: t("Delete") },
  ];
  const initialValues = {
    "selectType": {
      "label": "New",
      "value": "1"
    },
    "Category": {
      "label": "",
      "value": ""
    },
    "subCategory": {
      "label": "",
      "value": ""
    },
    PkgSubCategory: {
      "label": "",
      "value": ""
    },
    "PackageName": "",
    "validitiy": "",
    "IsActive": {
      "label": "Yes",
      "value": "1"
    },
    "ShowInPanel": [],
    "RoomType": [],
    "PkgCategory": {
      "label": "",
      "value": ""
    },
    "SelectedItem": {
      "NAME": "",
      "VALUE": 0
    },
    "validitiy": "",
    "Quantity": "",
    "Amount": "",
    "itemCode": "",
  }
  const [dropDownSate, setDropDownState] = useState({
    Category: [],
    SubCategory: [],
    PackageType: [],
    Panel: [],
    RoomType: [],
    PkgCategory: [],
    PkgSubCategory: [],
  });
  const [values, setValues] = useState({ ...initialValues });
  console.log("values", values)
  const [newTableData, setNewTableData] = useState([]);
  console.log("newTableData", newTableData)

  const handleInputChange = (e, index, label) => {
    const { name, value } = e.target;
    if (label === "Quantity" || label === "Amount") {
      const otherField = label === "Quantity" ? "Amount" : "Quantity";
      if (value && values[otherField]) {
        setValues((val) => ({ ...val, [label]: value, [otherField]: "" }));
      } else {
        setValues((val) => ({ ...val, [label]: value }));
      }
    } else {
      setValues((val) => ({ ...val, [label]: value }));
    }
  };
  const handleMultiSelectChange = (name, selectedOptions) => {
    setValues({ ...values, [name]: selectedOptions });
  };
  const handleDelete = (ele, indexToDelete) => {
    console.log("Table", newTableData);
    setNewTableData((prevData) =>
      prevData.filter((_, index) => index !== indexToDelete)
    );
  };
  const handleReactSelect = (label, value) => {
    debugger
    if (label === "selectType") {
      setValues({
        ...initialValues,
        [label]: value,
      });
      setNewTableData([]);
      setSearchValue("");
      return;
    }
    if (label === "PkgCategory") {
      setValues((val) => ({
        ...val,
        PkgSubCategory: { label: "", value: "" },
        SelectedItem: { NAME: "", VALUE: "" }
      }))
    }
    if (label === "SubCategory") {
      setValues((val) => ({
        ...val,
        SelectedItem: { NAME: "", VALUE: "" }
      }))
    }
    setValues((val) => ({ ...val, [label]: value }));
    // }
  };

  console.log("newTableData", newTableData);
  const handleAdd = () => {
    debugger

    if (!values?.PkgCategory?.value) {
      notify(t("Please select Category."), "error");
      return;
    }

    const quantity = values?.Quantity || "";
    const amount = values?.Amount || "";

    if (quantity && amount) {
      notify(t("Only one field should have value - either Quantity or Amount, not both"), "error");
      return;
    }

    if (!quantity && !amount) {
      notify(t("Either Quantity or Amount must have a value"), "error");
      return;
    }

    if (!values?.RoomType?.length) {
      notify(t("Please select at least one room type."), "error");
      return;
    }

    // let packageType = "";
    // const categoryValue = values?.PkgCategory?.value;
    // const subCategoryValue = values?.PkgSubCategory?.value;
    // const itemValue = values?.SelectedItem?.VALUE;
    // console.log("categoryValue", categoryValue)
    // console.log("subCategoryValue", subCategoryValue)
    // console.log("itemValue", itemValue)

    // if (itemValue) {
    //   packageType = "ItemWise";
    // } else if (subCategoryValue) {
    //   packageType = "SubCategoryWise";
    // } else if (categoryValue) {
    //   packageType = "CategoryWise";
    // } else {
    //   notify("Please select at least Category", "error");
    //   return;
    // }
    let packageType = "";
    const categoryValue = values?.PkgCategory?.value;
    const subCategoryValue = values?.PkgSubCategory?.value;
    const itemValue = values?.SelectedItem?.VALUE;
    if (itemValue && itemValue !== "0" && itemValue !== 0) {
      packageType = "ItemWise";
    } else if (subCategoryValue && subCategoryValue !== "0" && subCategoryValue !== 0) {
      packageType = "SubCategoryWise";
    } else if (categoryValue) {
      packageType = "CategoryWise";
    } else {
      notify(t("Please select at least Category"), "error");
      return;
    }

    if (newTableData.length > 0) {
      const currentCategoryID = categoryValue.toString().split("#")[0];

      const existingCategoryEntries = newTableData.filter(
        row => row.pkgCategoryID.toString().split("#")[0] === currentCategoryID
      );
      // if (existingCategoryEntries.length > 0) {
      //   const existingPackageType = existingCategoryEntries[0].packageType;

      //   // Only block if the package types are DIFFERENT
      //   if (existingPackageType !== packageType) {
      //     notify(
      //       `Cannot mix package types for the same category. This category already has ${existingPackageType} entries.`,
      //       "error"
      //     );
      //     return;
      //   }

      //   // Check for duplicates within the same type
      //   if (packageType === "SubCategoryWise") {
      //     const duplicateSubCategory = existingCategoryEntries.find(
      //       row => row.pkgSubCategoryID === subCategoryValue
      //     );
      //     if (duplicateSubCategory) {
      //       notify(
      //         `This subcategory is already added.`,
      //         "error"
      //       );
      //       return;
      //     }
      //   }

      //   if (packageType === "ItemWise") {
      //     const duplicateItem = existingCategoryEntries.find(
      //       row => row.itemID === itemValue
      //     );
      //     if (duplicateItem) {
      //       notify(
      //         `This item is already added.`,
      //         "error"
      //       );
      //       return;
      //     }
      //   }
      // }
      if (existingCategoryEntries.length > 0) {
        const existingPackageType = existingCategoryEntries[0].packageType;

        // Only block if the package types are DIFFERENT
        if (existingPackageType !== packageType) {
          notify(
            `Cannot mix package types for the same category. This category already has ${existingPackageType} entries.`,
            "error"
          );
          return;
        }

        // Check for duplicates based on package type
        if (packageType === "CategoryWise") {
          // For CategoryWise: check if same category + same room type exists
          const selectedRoomTypeIDs = values?.RoomType?.map(rt => rt.code);
          const duplicateRooms = existingCategoryEntries.filter(
            row => selectedRoomTypeIDs.includes(row.roomTypeID)
          );

          if (duplicateRooms.length > 0) {
            const roomNames = duplicateRooms.map(r => r.roomTypeName).join(", ");
            notify(
              `This category is already added for room type(s): ${roomNames}`,
              "error"
            );
            return;
          }
        }

        if (packageType === "SubCategoryWise") {
          // For SubCategoryWise: check if same subcategory exists (regardless of room type)
          const duplicateSubCategory = existingCategoryEntries.find(
            row => row.pkgSubCategoryID === subCategoryValue
          );
          if (duplicateSubCategory) {
            notify(
              t("This subcategory is already added."),
              "error"
            );
            return;
          }
        }

        if (packageType === "ItemWise") {
          // For ItemWise: check if same item exists (regardless of room type)
          const duplicateItem = existingCategoryEntries.find(
            row => row.itemID === itemValue
          );
          if (duplicateItem) {
            notify(
              t("This item is already added."),
              "error"
            );
            return;
          }
        }
      }
    }

    const newEntries = values?.RoomType?.map((item, idx) => ({
      index: newTableData.length + idx,
      srNo: newTableData.length + idx + 1,
      packageType: packageType,
      packageTypeID: values?.PkgCategory?.value || "",
      category: values?.Category?.label || "",
      categoryID: values?.Category?.value || "",
      subCategory: values?.subCategory?.label || "",
      subCategoryID: values?.subCategory?.value || "",
      pkgCategrory: values?.PkgCategory?.label || "",
      pkgCategoryID: values?.PkgCategory?.value || "",
      pkgSubCategory: values?.PkgSubCategory?.label || "",
      pkgSubCategoryID: values?.PkgSubCategory?.value || "",
      itemID: values?.SelectedItem?.VALUE ? values?.SelectedItem?.VALUE : 0,
      itemName: values?.SelectedItem?.NAME || "",
      quantity: values?.Quantity || "",
      amount: values?.Amount || "",
      isSurgery: values?.IsActive?.value || "",
      isAmount: values?.particularItem?.value || "OP",
      roomTypeID: item?.code || "",
      roomTypeName: item?.name || "",
    }));

    setNewTableData((prev) => [...prev, ...newEntries]);

    // Reset form fields
    setValues((val) => ({
      ...val,
      PkgCategory: "",
      PkgSubCategory: "",
      SelectedItem: "",
      Quantity: "",
      Amount: "",
    }));
    setSearchValue("");

    notify(
      `${newEntries.length} entr${newEntries.length > 1 ? 'ies' : 'y'} added successfully`,
      "success"
    );
  };

  const handleSave = async () => {
    const payload = {
      categoryID: values?.Category?.value || "",
      subCategoryID: values?.subCategory?.value || "",
      packageID: values?.SelectPackage?.ID || "",
      packageName: values?.PackageName || "",
      vaidityDays: values?.validitiy || "",
      isActive: values?.IsActive?.value || "",
      packageItemID: "",
      panelID: values?.ShowInPanel?.map((p) => p.code).join(",") || "",
      ipAddress: ip,
      ItemCode: values?.itemCode || "",
      packageDetails: newTableData.map((item) => ({
        roomTypeID: item.roomTypeID || "",
        packageType: item.packageType || "",
        categoryID: item.pkgCategoryID?.toString().split("#")[0] || "",
        subCategoryID: item.pkgSubCategoryID?.toString().split("#")[0] || "",
        itemID: item.itemID || "",
        quantity: item.quantity || "",
        amount: item.amount || "",
        isSurgery:
          Number(
            item?.pkgCategoryID?.toString().split("#")[1] ??
            item?.pkgCategoryID
          ) === 22
            ? 1
            : 0,
        isAmount: 0,
      })),
    };

    const response = await EDPSavePackage(payload);

    if (response?.success) {
      notify(response?.message, "success");
      setNewTableData([]);
      setValues(initialValues);
    } else {
      notify(response?.message, "error");
    }
  };
  const bindCategroy = async () => {
    const Category = await EDPBindPkgCategory();

    setDropDownState((val) => ({
      ...val,
      Category: handleReactSelectDropDownOptions(
        Category?.data,
        "NAME",
        "CategoryID"
      ),
    }));
  };
  const bindSubCategory = async () => {
    const payload = {
      CategoryID: values?.Category?.CategoryID,
    };
    const Category = await EDPBindPkgSubCategory(payload);

    setDropDownState((val) => ({
      ...val,
      SubCategory: handleReactSelectDropDownOptions(
        Category?.data,
        "NAME",
        "SubCategoryID"
      ),
    }));
  };
  const BindIPDPackageMaster = async () => {
    const payload = {
      CategoryID: values?.Category?.CategoryID
        ? values?.Category?.CategoryID
        : 0,
      subCategory: values?.subCategory?.SubCategoryID
        ? values?.subCategory?.SubCategoryID
        : 0,
    };
    const Category = await EDPBindIPDPackageMaster(payload);

    setDropDownState((val) => ({
      ...val,
      PackageType: handleReactSelectDropDownOptions(
        Category?.data,
        "Name",
        "ID"
      ),
    }));
  };
  const BindPackageDetails = async () => {
    const packageID = values?.SelectPackage?.ID;
    const response = await EDPBindPackageDetails(packageID);

    if (response?.success) {
      // Bind table data from packageDetails
      setNewTableData(
        response?.data?.packageDetails?.map((val, index) => ({
          index: index,
          srNo: index + 1,
          packageType: val?.PackageType || "",
          packageTypeID: val?.ConfigID || "",
          category: val?.CategoryName || "",
          categoryID: val?.CategoryID || "",
          subCategory: val?.SubCategoryName || "",
          subCategoryID: val?.SubCategoryID || "",
          pkgCategrory: val?.CategoryName || "",
          pkgCategoryID: val?.CategoryID || "",
          pkgSubCategory: val?.SubCategoryName || "",
          pkgSubCategoryID: val?.SubCategoryID || "",
          itemID: val?.ItemID || 0,
          itemName: val?.ItemName || "",
          quantity: val?.Quantity || "",
          amount: val?.Amount || "",
          isSurgery: val?.IsSurgery,
          roomTypeID: val?.RoomTypeID || "",
          roomTypeName: val?.RoomTypeName || "",
        }))
      );

      const seen = new Set();

      const result = response?.data?.packageDetails?.filter((item) => {
        if (seen.has(item?.RoomTypeID)) return false;
        seen.add(item?.RoomTypeID);
        return true;
      });

      if (response?.data?.packageMaster?.length > 0) {
        const masterData = response?.data?.packageMaster[0];

        setValues((prev) => ({
          ...prev,
          PackageName: masterData?.PackageName || "",
          validitiy: masterData?.DaysInvolved || "",
          IsActive: {
            label: masterData?.IsActive === 1 ? "Yes" : "No",
            value: masterData?.IsActive?.toString() || "",
          },
          Category: {
            label: masterData?.CategoryName || "",
            value: masterData?.CategoryID || "",
            CategoryID: masterData?.CategoryID || "",
          },
          itemCode: masterData?.ItemCode,
          subCategory: {
            label: masterData?.SubCategoryName || "",
            value: masterData?.SubCategoryID || "",
            SubCategoryID: masterData?.SubCategoryID || "",
          },
          RoomType: result?.map((val, index) => ({
            name: val?.RoomTypeName || "",
            code: val?.RoomTypeID || "",
          })) || [],
          ShowInPanel: masterData?.PanelID?.split(",")
            .filter(Boolean)
            .map((panelID, idx) => {
              const panelNames = masterData?.PanelName?.split(",") || [];
              return {
                code: Number(panelID?.trim()),
                name: panelNames[idx]?.trim() || "",
              };
            }) || [],
        }));
      }
    } else {
      setNewTableData([]);
    }
  };
  const bindPanel = async () => {
    const response = await EDPLoadPanelCompany();

    if (response?.success) {
      setDropDownState((val) => ({
        ...val,
        Panel: handleReactSelectDropDownOptions(
          response?.data,
          "Company_Name",
          "PanelID"
        ),
      }));
    }
  };
  const bindRoom = async () => {
    const response = await EDPLoadRoomType();

    if (response?.success) {
      setDropDownState((val) => ({
        ...val,
        RoomType: handleReactSelectDropDownOptions(
          response?.data,
          "Name",
          "IPDCaseTypeID"
        ),
      }));
    }
  };
  const bindAllCategory = async () => {
    const response = await EDPBindAllCategory();

    if (response?.success) {
      setDropDownState((val) => ({
        ...val,
        PkgCategory: handleReactSelectDropDownOptions(
          response?.data,
          "NAME",
          "CategoryID"
        ),
      }));
    }
  };
  const bindAllSubCategory = async () => {
    const categoryID = values?.PkgCategory?.CategoryID ?? 0;
    const response = await EDPBindAllSubCategory(categoryID);

    if (response?.success) {
      setDropDownState((val) => ({
        ...val,
        PkgSubCategory: handleReactSelectDropDownOptions(
          response?.data,
          "NAME",
          "SubCategoryID"
        ),
      }));
    }
  };
  const bindAllItems = async (query) => {
    const payload = {
      searchType: 1, // pending
      prefix: query,
      type: 0, // pending
      categoryID: values?.PkgCategory?.value?.split("#")[0],
      subCategoryID: values?.PkgSubCategory?.value?.split("#")[0],
      itemID: "", // pending
    };
    const response = await EDPBindAllItems(payload);
    if (response?.success) {
      return response?.data;
    } else {
      // notify(response?.message, "error");
    }
  };

  const handleSearch = async (event, index) => {
    const query = event.query.trim();
    const items = await bindAllItems(query);

    const filteredData = items?.map((ele) => ({
      NAME: ele.TypeName,
      VALUE: ele.ItemID,
    }));
    setItemList(filteredData);
  };

  const handleSelectRow = (e, index) => {
    const { value } = e;
    setValues((val) => ({
      ...val,
      SelectedItem: {
        NAME: value?.NAME,
        VALUE: value?.VALUE,
      },
    }));
    setSearchValue("");
  };

  const itemTemplate = (item) => {
    return (
      <div className="p-clearfix">
        <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
          {item?.NAME}
        </div>
      </div>
    );
  };

  const handleChange = (e, index) => {
    debugger
    const { name, value } = e.target;
    const data = [...newTableData];
    if (name === "quantity" || name === "amount") {
      const otherField = name === "quantity" ? "amount" : "quantity";
      if (value && data[index][otherField]) {
        data[index][name] = value;
        data[index][otherField] = "";
      } else {
        data[index][name] = value;
      }
    } else {
      data[index][name] = value;
    }
    setNewTableData(data);
  };

  useEffect(() => {
    bindCategroy();
    bindPanel();
    bindRoom();
    bindAllCategory();
  }, []);

  useEffect(() => {
    bindSubCategory();
  }, [values?.Category?.CategoryID]);

  useEffect(() => {
    BindIPDPackageMaster();
  }, [values?.Category?.CategoryID, values?.subCategory?.SubCategoryID]);

  useEffect(() => {
    // if (values?.PkgCategory?.value) {
    bindAllSubCategory();
    // }
  }, [values?.PkgCategory?.value]);
  console.log("values?.PkgCategory?.value", dropDownSate.PkgCategory);
  useEffect(() => {
    BindPackageDetails();
  }, [values?.SelectPackage?.value]);

  useEffect(() => {
    setValues((val) => ({
      ...val,
      SelectedItem: "",
    }));
  }, [values?.PkgCategory?.value, values?.PkgSubCategory?.value]);
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
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: t("New"), value: "1" },
            { label: t("Edit"), value: "0" },
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Category")}
          requiredClassName={"required-fields"}
          name="Category"
          value={values?.Category?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownSate?.Category}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Sub Category")}
          requiredClassName={"required-fields"}
          name="subCategory"
          value={values?.subCategory?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownSate?.SubCategory}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className={"form-control required-fields"}
          lable={t("Package Name")}
          placeholder=" "
          name="PackageName"
          onChange={(e) => handleInputChange(e, 0, "PackageName")}
          value={values?.PackageName}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="number"
          className={"form-control"}
          lable={t("Validity Days")}
          placeholder=" "
          name="validitiy"
          onChange={(e) => handleInputChange(e, 0, "validitiy")}
          value={values?.validitiy}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Is Active")}
          name="IsActive"
          value={values?.IsActive?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={[
            { label: t("Yes"), value: "1" },
            { label: t("No"), value: "0" },
          ]}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Select Package")}
          name="SelectPackage"
          requiredClassName={"required-fields"}
          value={values?.SelectPackage?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownSate?.PackageType}
          searchable={true}
          isDisabled={values?.selectType?.value === "1" ? true : false}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="ShowInPanel"
          id="ShowInPanel"
          placeholderName={t("Show In Panel")}
          dynamicOptions={dropDownSate?.Panel?.map((ele, i) => ({
            name: ele?.Company_Name,
            code: ele?.value,
          }))}
          handleChange={handleMultiSelectChange}
          value={values?.ShowInPanel}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          name="RoomType"
          id="RoomType"
          requiredClassName={"required-fields"}
          placeholderName={t("Room Type")}
          dynamicOptions={dropDownSate?.RoomType?.map((ele, i) => ({
            name: ele?.Name,
            code: ele?.IPDCaseTypeID,
          }))}
          handleChange={handleMultiSelectChange}
          value={values?.RoomType}
        />
        <Input
          type="text"
          className={"form-control required-fields"}
          lable={t("Item Code")}
          placeholder=" "
          name="itemCode"
          onChange={(e) => handleInputChange(e, 0, "itemCode")}
          value={values?.itemCode}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
      </div>

      {/* <Heading title={t("Add Package Items")} isBreadcrumb={false} /> */}

      <div className="row p-2">
        {/* <ReactSelect
          placeholderName={t("Category")}
          name="PkgCategory"
          value={values?.PkgCategory?.value}
          requiredClassName={"required-fields"}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownSate?.PkgCategory}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Sub Category")}
          name="PkgSubCategory"
          requiredClassName={"required-fields"}
          value={values?.PkgSubCategory?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownSate?.PkgSubCategory}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <AutoComplete
          requiredClassName={"required-fields"}
          placeholder={t("Items")}
          value={searchvalue}
          suggestions={itemList}
          field="NAME"
          completeMethod={(e) => handleSearch(e, 0)}
          className="col-xl-2 col-md-4 col-sm-6 col-12"
          onSelect={(e) => handleSelectRow(e, 0)}
          itemTemplate={itemTemplate}
          onChange={(e) => {
            setSearchValue(e?.value);
          }}
        />
        <LabeledInput
          label={t("Selected Items")}
          value={values?.SelectedItem?.NAME}
          className="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className={"form-control required-fields"}
          lable={t("Quantity")}
          placeholder=" "
          name="Quantity"
          onChange={(e) => handleInputChange(e, 0, "Quantity")}
          value={values?.Quantity}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="text"
          className={"form-control required-fields"}
          lable={t("Amount")}
          placeholder=" "
          name="Amount"
          onChange={(e) => handleInputChange(e, 0, "Amount")}
          value={values?.Amount}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <button
          className=" btn btn-sm btn-success ml-2 px-3"
          onClick={handleAdd}
        >
          {t("Add")}
        </button> */}
        {/* {values?.SelectedItem?.length > 0 && (
          <div className="col-12 mt-3">
            <label className="displayShow">{t("Selected items")}</label>
            <div
              className="doctorBind"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "5px",
                padding: "8px 6px",
              }}
            >
              {values?.SelectedItem?.map((item, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ccc",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>{item?.NAME}</span>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>

      {/* {newTableData?.length > 0 && ( */}
        <div>
          {/* <Heading title={t("Package Details")} isBreadcrumb={false} /> */}


          {/* <Tables
            thead={THEAD}
            tbody={newTableData?.map((ele, index) => ({
              Sno: index + 1,
              RoomType: ele?.roomTypeName,
              packageType: ele?.packageType,
              category: ele?.pkgCategrory,
              subCategory: ele?.pkgSubCategory,
              itemName: ele?.itemName,
              quantity: (
                <Input
                  type="text"
                  className="table-input"
                  name={"quantity"}
                  removeFormGroupClass={true}
                  value={ele?.quantity}
                  onChange={(e) => handleChange(e, index)}
                />
              ),
              amount: (
                <Input
                  type="text"
                  className="table-input"
                  name={"amount"}
                  removeFormGroupClass={true}
                  value={ele?.amount}
                  onChange={(e) => handleChange(e, index)}
                />
              ),
              remove: (
                <div
                  style={{ color: "red" }}
                  className="fa fa-trash"
                  onClick={() => handleDelete(ele, index)}
                ></div>
              ),
            }))}
          /> */}

          <div className="w-100 d-flex justify-content-end">
            <button
              className=" btn btn-sm btn-success col-xl-1 m-2 col-md-4 col-sm-6 col-12 "
              onClick={handleSave}
            >
              {values?.selectType?.value == "1" ? t("Save") : t("Update")}
            </button>
          </div>
        </div>
      {/* )} */}
    </div>
  );
};

export default IPDpkgMasterMain;