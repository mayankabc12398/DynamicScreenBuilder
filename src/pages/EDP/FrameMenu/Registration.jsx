import React, { useEffect, useState, useRef } from "react";
import Heading from "../../../components/UI/Heading";
import * as XLSX from "xlsx";
import Modal from "../../../components/modalComponent/Modal";
import Tables from "../../../components/UI/customTable";
// import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import Input from "../../../components/formComponent/Input";
import DatePicker from "../../../components/formComponent/DatePicker";
import {
  BindEmployeeGroup,
  BindPayrollDepartment,
  BindQualification,
  BindTitleWithGender,
  BindUserType,
  BloodBank,
  EDPBindPayrollDesignation,
  EDPGetEmployee,
  EDPupdateEmployee,
  EPDsaveEmployee,
} from "../../../networkServices/EDP/edpApi";
import { handleReactSelectDropDownOptions, inputBoxValidation, notify } from "../../../utils/utils";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { MOBILE_NUMBER_VALIDATION_REGX } from "../../../utils/constant";

const Registration = ({ data, setTableItemDetails, handleSearch }) => {
  const initialState = {
    EmployeeCode: "",
    FullName: "",
    Locality: "",
    HouseNo: "",
    StreetNo: "",
    City: "",
    PostalCode: "",
    pHouseNo: "",
    pStreetNo: "",
    pLocality: "",
    pCity: "",
    pPostalCode: "",
    FatherName: "",
    MotherName: "",
    Email: "",
    ContactNo: "",
    Title: {
      title: "",
      gender: "",
      label: "",
      value: "",
    },
    BloodGroup: {
      id: "",
      BloodGroup: "",
      label: "",
      value: "",
    },
    Discount: "",
    UserType: {
      Name: "",
      ID: "",
      label: "",
      value: "",
    },
    startDate: "",
    userTypeID: "",
    deptID: "",
    deptName: "",
    desID: "",
    desName: "",
    Department: {
      Dept_ID: "",
      Dept_Name: "",
      label: "",
      value: "",
    }, // Ensure it matches API response
    Designation: {
      Des_ID: "",
      Designation_Name: "",
      label: "",
      value: "",
    },
    EmployeeGroup: {
      Name: "",
      ID: "",
      label: "",
      value: "",
    },
    empGroupName: "",
    qualificationID: "",
    qualificationName: "",
    Qualification: {
      ID: "",
      Qualification: "",
      label: "",
      value: "",
    },
    panNo: "",
    PassportNo: "",
    dob: new Date(),
    doj: null,
  };

  const transformEmployeeData = (data) => {
    //
    return {
      EmployeeCode: data?.EmployeeCode || "",
      FullName: data?.Name || "",
      Locality: data?.Locality || "",
      HouseNo: data?.House_No || "",
      StreetNo: data?.Street_Name || "",
      City: data?.City || "",
      PostalCode: data?.Pincode || "",
      pHouseNo: data?.PHouse_No || "",
      pStreetNo: data?.PStreet_Name || "",
      pLocality: data?.PLocality || "",
      pCity: data?.PCity || "",
      pPostalCode: data?.PPincode || "",
      FatherName: data?.FatherName || "",
      MotherName: data?.MotherName || "",
      Email: data?.Email || "",
      ContactNo: data?.Mobile || data?.Phone || "",
      Title: {
        title: data?.Title || "",
        gender: data?.Title === "Mr." ? "Male" : "Female",
        label: data?.Title || "",
        value: data?.Title === "Mr." ? "Male" : "Female",
      },
      gender: {
        label: data?.Title === "Mr." ? "Male" : (data?.Title ? "Female" : ""),
        value: data?.Title === "Mr." ? "Male" : (data?.Title ? "Female" : ""),
      },
      BloodGroup: {
        id: Number(data?.BloodGroup) || 0,
        BloodGroup: data?.BloodGroup || "",
        label: data?.BloodGroup || "",
        value: Number(data?.BloodGroup) || 0,
      },
      UserType: {
        Name: "",
        ID: Number(data?.UserType_ID) || 0,
        label: "",
        value: Number(data?.UserType_ID) || 0,
      },
      startDate: data?.StartDate || "",
      userTypeID: data?.UserType_ID || "",
      deptID: data?.Dept_ID,
      deptName: "",
      desID: data?.Desi_ID,
      desName: "",
      Department: {
        Dept_ID: data?.Dept_ID,
        Dept_Name: "",
        label: "",
        value: data?.Dept_ID,
      },
      Designation: {
        Des_ID: data?.Desi_ID,
        Designation_Name: "",
        label: "",
        value: data?.Desi_ID,
      },
      EmployeeGroup: {
        Name: "",
        ID: data?.Employee_Group_ID,
        label: "",
        value: data?.Employee_Group_ID,
      },
      empGroupName: "",
      qualificationID: data?.Qualification || "",
      qualificationName: "",
      Qualification: {
        ID: Number(data?.Qualification) || 0,
        Qualification: data?.Qualification || "",
        label: "",
        value: Number(data?.Qualification) || 0,
      },
      panNo: data?.PAN_No || "",
      PassportNo: data?.PassportNo || "",
      dob: data?.DOB || new Date(),
      // doj: data?.StartDate || null,
      Discount: data?.DiscountPercent,
    };
  };

  // console.log("Transformed Data:", transformEmployeeData(dataGoing?.data));

  const [t] = useTranslation();
  const [values, setValues] = useState({ ...initialState });
  console.log("Values", values);

  const fileInputRef = useRef(null);
  const [excelData, setExcelData] = useState([]);
  const [excelModalVisible, setExcelModalVisible] = useState(false);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  const matchDropdownValue = (list, searchString, fieldToMatch = "label") => {
    if (!searchString) return { label: "", value: "" };
    const matched = list.find((item) =>
      String(item[fieldToMatch])?.toLowerCase().trim() === String(searchString).toLowerCase().trim()
    );
    return matched ? matched : { label: searchString, value: "" }; // Setting value empty marks it as invalid initially
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      const parsedData = data.map((row, index) => {
        console.log("row", row)
        return {
          uid: index,
          Title: matchDropdownValue(dropDownState?.Title || [], row?.Title || row?.title),
          FullName: row?.FullName || row?.name || row?.Name || row?.["Full Name"] || "",
          HouseNo: row?.HouseNo || row?.["LOCAL HOUSE NO."] || "",
          StreetNo: row?.StreetNo || row?.["LOCAL STREET NUMBER"] || "",
          Locality: row?.Locality || row?.["LOCAL LOCALITY"] || "",
          City: row?.City || row?.["LOCAL CITY"] || "",
          PostalCode: row?.PostalCode || row?.["LOCAL POSTAL CODE"] || "",
          pHouseNo: row?.pHouseNo || row?.["PERMANENT HOUSE NO."] || "",
          pStreetNo: row?.pStreetNo || row?.["PERMANENT STREET NUMBER"] || "",
          pLocality: row?.pLocality || row?.["PERMANENT LOCALITY"] || "",
          pCity: row?.pCity || row?.["PERMANENT CITY"] || "",
          pPostalCode: row?.pPostalCode || row?.["PERMANENT POSTAL CODE"] || "",
          FatherName: row?.FatherName || row?.["Father's Name"] || "",
          MotherName: row?.MotherName || row?.["Mother's Name"] || "",
          PassportNo: row?.PassportNo || row?.["Passport No"] || "",
          dob: row?.dob ? new Date(row?.dob) : (row?.["Date Of Birth"] ? new Date(row?.["Date Of Birth"]) : new Date()),
          Qualification: matchDropdownValue(dropDownState?.Qualification || [], row?.Qualification),
          Email: row?.Email || row?.["EMAIL"] || "",
          ContactNo: row?.ContactNo || row?.PhoneNo || row?.Phone || row?.["Phone No."] || "",
          gender: matchDropdownValue(dropDownState?.Gender || [], row?.Gender || row?.gender),
          BloodGroup: matchDropdownValue(dropDownState?.BloodGroup || [], row?.BloodGroup || row?.["Blood Group"]),
          startDate: row?.startDate ? new Date(row?.startDate) : (row?.["Start Date"] ? new Date(row?.["Start Date"]) : new Date()),
          UserType: matchDropdownValue(dropDownState?.UserType || [], row?.UserType || row?.["User Type"]),
          Department: matchDropdownValue(dropDownState?.Department || [], row?.Department),
          Designation: matchDropdownValue(dropDownState?.Designation || [], row?.Designation),
          EmployeeGroup: matchDropdownValue(dropDownState?.EmployeeGroup || [], row?.EmployeeGroup || row?.["Employee Group"]),
          Discount: row?.Discount || row?.["Allow Discount"] || "",
        };
      });
      setExcelData(parsedData);
      setExcelModalVisible(true);
      fileInputRef.current.value = ""; // Reset value for future runs
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelRowChange = (uid, field, value) => {
    const updated = excelData.map((row) => {
      if (row.uid === uid) {
        if (field === "Title" && value?.value) {
          return {
            ...row,
            [field]: value,
            gender: { label: value?.gender, value: value?.gender }
          };
        }
        return { ...row, [field]: value };
      }
      return row;
    });
    setExcelData(updated);
  };

  const validateExcelRow = (row) => {
    if (!row?.Title?.value) return false;
    if (!row?.FullName) return false;
    if (!row?.UserType?.value) return false;
    if (!row?.EmployeeGroup?.value) return false;
    if (!row?.Department?.value) return false;
    if (!row?.Designation?.value) return false;
    if (!row?.ContactNo) return false;
    return true;
  };

  const handleBulkSave = async () => {
    const invalidRowIndex = excelData.findIndex(row => !validateExcelRow(row));
    if (invalidRowIndex !== -1) {
      notify(`Validation failed for row ${invalidRowIndex + 1}. Please ensure all required fields are correctly filled or selected from dropdown.`, "error");
      return;
    }

    setIsProcessingExcel(true);
    let successCount = 0;
    for (const row of excelData) {
      const payloadToBe = {
        title: row?.Title?.label,
        name: row?.FullName,
        houseNo: row?.HouseNo,
        streetName: row?.StreetNo,
        locality: row?.Locality,
        city: row?.City,
        pinCode: Number(row?.PostalCode) || 0,
        pHouseNo: row?.pHouseNo,
        pStreetName: row?.pStreetNo,
        pLocality: row?.pLocality,
        pCity: row?.pCity,
        pPinCode: Number(row?.pPostalCode) || 0,
        fatherName: row?.FatherName,
        motherName: row?.MotherName,
        esiNo: "",
        epfNo: "",
        panNo: "",
        passportNo: row?.PassportNo,
        dob: row?.dob,
        qualification: row?.Qualification?.value,
        email: row?.Email,
        phone: row?.ContactNo,
        mobile: row?.ContactNo,
        bloodGroup: row?.BloodGroup?.value,
        startDate: row?.startDate,
        userTypeID: row?.UserType?.value,
        deptID: row?.Department?.value,
        deptName: row?.Department?.label,
        desiName: row?.Designation?.label,
        desiID: row?.Designation?.value,
        employeeGroupID: row?.EmployeeGroup?.value,
        discountPercent: row?.Discount,
        gender: row?.gender?.value,
      };

      try {
        const data = await EPDsaveEmployee(payloadToBe);
        if (data?.success) {
          successCount++;
        } else {
          notify(`Failed to save row ${row.uid + 1}: ${data?.message}`, "error");
        }
      } catch (e) {
        notify(`Exception occurred while saving row ${row.uid + 1}`, "error");
      }
    }

    setIsProcessingExcel(false);
    if (successCount > 0) {
      notify(`Successfully saved ${successCount} entries.`, "success");
      setExcelModalVisible(false);
      setExcelData([]);
      handleSearch();
    }
  };

  // if(data?.data){
  //   setValues(data?.data);
  // }
  // console.log("values", values);
  const [dropDownState, setDropDownState] = useState({
    Designation: [],
    EmployeeGroup: [],
    Qualification: [],
  });

  const handleReactSelect = (name, value) => {
    if (name === "Title" && value?.value) {
      setValues((val) => ({
        ...val,
        [name]: value,
        gender: { label: value?.gender, value: value?.gender }
      }));
    } else {
      setValues((val) => ({ ...val, [name]: value }));
    }
  };
  const handleInputChange = (e, index, label) => {
    if (label === "ContactNo") {
      if (e.target.value.length > 10) {
        return;
      }
    }
    if (label === "Discount") {
      if (e.target.value > 100) {
        return;
      }
    }
    setValues((val) => ({ ...val, [label]: e.target.value }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((val) => ({ ...val, [name]: value }));
  };

  const bindDesignation = async () => {
    const data = await EDPBindPayrollDesignation();
    setDropDownState((val) => ({
      ...val,
      Designation: handleReactSelectDropDownOptions(
        data?.data,
        "Designation_Name", // Ensure it matches API response
        "Des_ID"
      ),
    }));
  };

  const bindEmployeeGroup = async () => {
    const data = await BindEmployeeGroup();
    setDropDownState((val) => ({
      ...val,
      EmployeeGroup: handleReactSelectDropDownOptions(
        data?.data,
        "Name", // Ensure it matches API response
        "ID"
      ),
    }));
  };
  const BindUserTypeAPI = async () => {
    const data = await BindUserType();
    setDropDownState((val) => ({
      ...val,
      UserType: handleReactSelectDropDownOptions(
        data?.data,
        "Name", // Ensure it matches API response
        "ID"
      ),
    }));
  };

  const BindQualificationAPI = async () => {
    const data = await BindQualification();
    setDropDownState((val) => ({
      ...val,
      Qualification: handleReactSelectDropDownOptions(
        data?.data,
        "Qualification", // Ensure it matches API response
        "ID"
      ),
    }));
  };
  const BloodBankAPI = async () => {
    const data = await BloodBank();
    setDropDownState((val) => ({
      ...val,
      BloodBank: handleReactSelectDropDownOptions(
        data?.data,
        "BloodGroup", // Ensure it matches API response
        "id"
      ),
    }));
  };
  const bindDepartmentAPI = async () => {
    const data = await BindPayrollDepartment();

    if (data?.success) {
      setDropDownState((val) => ({
        ...val,
        Department: handleReactSelectDropDownOptions(
          data?.data,
          "Dept_Name",
          "Dept_ID"
        ),
      }));
    }
  };
  const BindTitleWithGenderAPI = async () => {
    const data = await BindTitleWithGender();

    if (data?.success) {
      setDropDownState((val) => ({
        ...val,
        Title: handleReactSelectDropDownOptions(data?.data, "title", "gender"),
        Gender: handleReactSelectDropDownOptions(data?.data?.filter((val) => val?.gender != ""), "gender", "gender"),
      }));
    }
  };

  const handleUpdate = async () => {
    if (!values?.EmployeeCode?.trim())
      return notify("Employee Code is required.", "error");

    const payloadToBe = {
      employeeCode: values?.EmployeeCode?.trim(),
      title: values?.Title?.label,
      name: values?.FullName,
      houseNo: values?.HouseNo,
      streetName: values?.StreetNo,
      locality: values?.Locality,
      city: values?.City,
      pinCode: Number(values?.PostalCode) || 0,
      pHouseNo: values?.pHouseNo,
      pStreetName: values?.pStreetNo,
      pLocality: values?.pLocality,
      pCity: values?.pCity,
      pPinCode: Number(values?.pPostalCode) || 0,
      fatherName: values?.FatherName,
      motherName: values?.MotherName,
      esiNo: "", // PENDING
      epfNo: "", // PENDING
      panNo: "", // PENDING
      passportNo: values?.PassportNo,
      dob: values?.dob,
      qualification: values?.Qualification?.value,
      email: values?.Email,
      phone: values?.ContactNo,
      mobile: values?.ContactNo,
      bloodGroup: values?.BloodGroup?.value,
      startDate: values?.startDate,
      userTypeID: values?.UserType?.value,
      deptID: values?.Department?.Dept_ID,
      deptName: values?.Department?.Dept_Name,
      desiName: values?.Designation?.Designation_Name,
      desiID: values?.Designation?.Des_ID,
      employeeGroupID: values?.EmployeeGroup?.value,
      discountPercent: values?.Discount,
      employeeID: data?.EmployeeID,
      gender: values?.gender?.value,
    };


    console.log("payload before updating ", payloadToBe);
    const dataReceived = await EDPupdateEmployee(payloadToBe);
    if (dataReceived?.success) {
      notify(dataReceived?.message, "success");
      setValues(initialState);
      handleSearch();
      setTableItemDetails({});
    } else {
      notify(dataReceived?.message, "error");
    }
  };

  const validateEmployeeForm = () => {
    if (!values?.EmployeeCode?.trim())
      return notify(t("Employee Code is required."), "error"), false;
    if (!values?.Title?.value) return notify(t("Title is required."), "error"), false;
    if (!values?.FullName) return notify(t("Full Name is required."), "error"), false;
    // if (!values?.Email) return notify("Permanent Email is required.", "error"), false;
    // if (!values?.ContactNo) return notify("Permanent Contact No. is required.", "error"), false;
    // if (!values?.dob) return notify("Date Of Birth is required.", "error"), false;
    // if (!values?.startDate) return notify("Start Date is required.", "error"), false;
    // if (!values?.Qualification?.value) return notify("Qualification is required.", "error"), false;
    // if (!values?.BloodGroup?.value) return notify("Blood Group is required.", "error"), false;
    if (!values?.UserType?.value) return notify(t("User Type is required."), "error"), false;
    if (!values?.EmployeeGroup?.value) return notify(t("Employee Group is required."), "error"), false;
    if (!values?.Department?.Dept_ID) return notify(t("Department is required."), "error"), false;
    if (!values?.Designation?.Des_ID) return notify(t("Designation is required."), "error"), false;
    if (!values?.ContactNo) return notify(t("Phone No. is required."), "error"), false;
    // if (!values?.Discount) return notify("Designation is required.", "error"), false;

    return true;
  };
  const handleSave = async () => {
    if (!validateEmployeeForm()) return;
    const payloadToBe = {
      employeeCode: values?.EmployeeCode?.trim(),
      title: values?.Title?.title,
      name: values?.FullName,
      houseNo: values?.HouseNo,
      streetName: values?.StreetNo,
      locality: values?.Locality,
      city: values?.City,
      pinCode: Number(values?.PostalCode) || 0,
      pHouseNo: values?.pHouseNo,
      pStreetName: values?.pStreetNo,
      pLocality: values?.pLocality,
      pCity: values?.pCity,
      pPinCode: Number(values?.pPostalCode) || 0,
      fatherName: values?.FatherName,
      motherName: values?.MotherName,
      esiNo: "", // PENDING
      epfNo: "", // PENDING
      panNo: "", // PENDING
      passportNo: values?.PassportNo,
      dob: values?.dob,
      qualification: values?.Qualification?.value,
      email: values?.Email,
      phone: values?.ContactNo,
      gender: "",
      mobile: values?.ContactNo,
      bloodGroup: values?.BloodGroup?.value,
      startDate: values?.startDate,
      userTypeID: values?.UserType?.value,
      deptID: values?.Department?.Dept_ID,
      deptName: values?.Department?.Dept_Name,
      desiName: values?.Designation?.Designation_Name,
      desiID: values?.Designation?.Des_ID,
      employeeGroupID: values?.EmployeeGroup?.value,
      discountPercent: values?.Discount ? Number(values?.Discount) : 0,
      gender: values?.gender?.value,
    };

    console.log("Payload Before Saving", payloadToBe);

    const data = await EPDsaveEmployee(payloadToBe);

    if (data?.success) {
      notify(data?.message, "success");
      setValues(initialState)
      handleSearch();
    } else notify(data?.message, "error");
  };
  const handleReset = () => {
    setValues(initialState);
    setTableItemDetails([]);
  };

  const GetEmployeeAPI = async () => {
    const empID = data?.EmployeeID;
    const dataGoing = await EDPGetEmployee(empID);
    if (dataGoing?.success) {
      console.log("Raw Date:", dataGoing?.data);
      console.log(
        "Transformed Data:",
        transformEmployeeData(dataGoing?.data[0])
      );
      const formattedData = transformEmployeeData(dataGoing?.data[0]);
      console.log("Formatted Data:", formattedData);
      //
      setValues(formattedData);
    } else {
      notify(data?.message, "error");
    }
  };

  useEffect(() => {
    if (data?.EmployeeID) {
      GetEmployeeAPI();
    }
  }, [data?.EmployeeID]);
  useEffect(() => {
    bindDesignation();
    bindEmployeeGroup();
    BindUserTypeAPI();
    BindQualificationAPI();
    BloodBankAPI();
    bindDepartmentAPI();
    BindTitleWithGenderAPI();
  }, []);

  return (
    <div className="mt-2 card">

      <Heading
        isBreadcrumb={true}
        title={data?.breadcrumb}
        data={data}
        isSlideScreen={true}
      />
      <div className="row p-2">
        {/* <div className="col-xl-2 col-md-3 col-sm-6 col-12"> */}

        {/* <div className="row"> */}
        <ReactSelect
          placeholderName={t("Title")}
          id="Title"
          removeIsClearable={true}
          requiredClassName={"required-fields"}
          name="Title"
          value={values?.Title?.label}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={handleReactSelectDropDownOptions(
            dropDownState?.Title,
            "title",
            "title"
          )}
          searchable={true}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
        />

        <Input
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          type="FullName"
          className={"form-control required-fields"}
          lable={t("Full Name")}
          placeholder=" "
          //   id="ItemName"
          name="FullName"
          onChange={(e) => handleInputChange(e, 0, "FullName")}
          value={values?.FullName ? values?.FullName : ""}
          required={true}
        />
        {/* </div> */}
        {/* </div> */}

        {console.log("data", handleReactSelectDropDownOptions(
          dropDownState?.Title,
          "title",
          "title"
        ))}

        <ReactSelect
          placeholderName={t("Gender")}
          id="gender"
          isDisabled={values?.Title?.gender ? true : false}
          removeIsClearable={true}
          requiredClassName={"required-fields"}
          name="gender"
          value={values?.gender?.label}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={handleReactSelectDropDownOptions(
            dropDownState?.Gender,
            "gender",
            "gender"
          ).filter((item, index, self) => index === self.findIndex((t) => t.gender === item.gender))}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />


        <Input
          type="HouseNo"
          className={"form-control "}
          lable={t("Local House No.")}
          placeholder=" "
          //   id="ItemName"
          name="HouseNo"
          onChange={(e) => handleInputChange(e, 0, "HouseNo")}
          value={values?.HouseNo}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="StreetNo"
          className={"form-control "}
          lable={t("Local Street Number")}
          placeholder=" "
          id="StreetNo"
          name="StreetNo"
          onChange={(e) => handleInputChange(e, 0, "StreetNo")}
          value={values?.StreetNo}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="Locality"
          className={"form-control "}
          lable={t("Local Locality")}
          placeholder=" "
          id="Locality"
          name="Locality"
          onChange={(e) => handleInputChange(e, 0, "Locality")}
          value={values?.Locality}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="City"
          className={"form-control "}
          lable={t("Local City")}
          placeholder=" "
          //   id="ItemName"
          name="City"
          onChange={(e) => handleInputChange(e, 0, "City")}
          value={values?.City}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="number"
          className={"form-control "}
          lable={t("Local Postal Code")}
          placeholder=" "
          //   id="ItemName"
          name="PostalCode"
          onChange={(e) => handleInputChange(e, 0, "PostalCode")}
          value={values?.PostalCode}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="pHouseNo"
          className={"form-control "}
          lable={t("Permanent House No.")}
          placeholder=" "
          //   id="ItemName"
          name="pHouseNo"
          onChange={(e) => handleInputChange(e, 0, "pHouseNo")}
          value={values?.pHouseNo}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="pStreetNo"
          className={"form-control "}
          lable={t("Permanent Street Number")}
          placeholder=" "
          id="pStreetNo"
          name="pStreetNo"
          onChange={(e) => handleInputChange(e, 0, "pStreetNo")}
          value={values?.pStreetNo}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="pLocality"
          className={"form-control "}
          lable={t("Permanent Locality")}
          placeholder=" "
          id="pLocality"
          name="pLocality"
          onChange={(e) => handleInputChange(e, 0, "pLocality")}
          value={values?.pLocality}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="pCity"
          className={"form-control "}
          lable={t("Permanent City")}
          placeholder=" "
          id="pCity"
          name="pCity"
          onChange={(e) => handleInputChange(e, 0, "pCity")}
          value={values?.pCity}
          // required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="number"
          className={"form-control "}
          lable={t("Permanent Postal Code")}
          placeholder=" "
          id="pPostalCode"
          name="pPostalCode"
          onChange={(e) => handleInputChange(e, 0, "pPostalCode")}
          value={values?.pPostalCode}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="Email"
          className={"form-control "}
          lable={t("Email")}
          placeholder=" "
          id="Email"
          name="Email"
          onChange={(e) => handleInputChange(e, 0, "Email")}
          value={values?.Email}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="number"
          className={"form-control required-fields"}
          lable={t("Phone No.")}
          placeholder=" "
          id="ContactNo"
          name="ContactNo"
          onChange={(e) => handleInputChange(e, 0, "ContactNo")}
          value={values?.ContactNo ? values?.ContactNo : ""}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />

        <Input
          type="FatherName"
          className={"form-control"}
          lable={t("Father's Name")}
          placeholder=" "
          id="FatherName"
          name="FatherName"
          onChange={(e) => handleInputChange(e, 0, "FatherName")}
          value={values?.FatherName}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="MotherName"
          className={"form-control"}
          lable={t("Mother's Name")}
          placeholder=" "
          name="MotherName"
          onChange={(e) => handleInputChange(e, 0, "MotherName")}
          value={values?.MotherName}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <DatePicker
          className="custom-calendar"
          placeholder={""}
          lable={t("Date of Birth")}
          name="dob"
          id="dob"
          value={values?.dob ? new Date(values?.dob) : new Date()}
          // showTime
          hourFormat="12"
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Qualification")}
          id="Qualification"
          removeIsClearable={true}
          // requiredClassName={"required-fields"}
          name="Qualification"
          value={values?.Qualification?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.Qualification}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="PassportNo"
          className={"form-control"}
          lable={t("Passport No.")}
          placeholder=" "
          id="PassportNo"
          name="PassportNo"
          onChange={(e) => handleInputChange(e, 0, "PassportNo")}
          value={values?.PassportNo}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Blood Group")}
          id="BloodGroup"
          removeIsClearable={true}
          // requiredClassName={"required-fields"}
          name="BloodGroup"
          value={values?.BloodGroup?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.BloodBank}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("User Type")}
          id="UserType"
          removeIsClearable={true}
          requiredClassName={"required-fields"}
          name="UserType"
          value={values?.UserType?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.UserType}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Employee Group")}
          id="EmployeeGroup"
          removeIsClearable={true}
          requiredClassName={"required-fields"}
          name="EmployeeGroup"
          value={values?.EmployeeGroup?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.EmployeeGroup}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <DatePicker
          className="custom-calendar"
          placeholder={""}
          lable={t("Start Date")} // Corrected to "lable"
          name="startDate"
          id="startDate"
          value={values?.startDate ? new Date(values?.startDate) : new Date()}
          // showTime
          hourFormat="12"
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Department")}
          id="Department"
          removeIsClearable={true}
          requiredClassName={"required-fields"}
          name="Department"
          value={values?.Department?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.Department}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <ReactSelect
          placeholderName={t("Designation")}
          id="Designation"
          removeIsClearable={true}
          requiredClassName={"required-fields"}
          name="Designation"
          value={values?.Designation?.value}
          handleChange={(name, e) => handleReactSelect(name, e)}
          dynamicOptions={dropDownState?.Designation}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          type="Discount"
          className={"form-control"}
          lable={t("Allow Discount(%)")}
          placeholder=" "
          id="Discount"
          name="Discount"
          onChange={(e) => handleInputChange(e, 0, "Discount")}
          value={values?.Discount}
          required={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
        />
        <Input
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          type="text"
          className={"form-control required-fields"}
          lable={t("Employee Code")}
          placeholder=" "
          name="EmployeeCode"
          onChange={(e) => handleInputChange(e, 0, "EmployeeCode")}
          value={values?.EmployeeCode ? values?.EmployeeCode : ""}
          required={true}
        />
        {/* The buttons get their own grid cell so they line up after Allow
            Discount instead of spilling over the field beside them. */}
        <div className="col-xl-3 col-md-6 col-sm-12 col-12 d-flex align-items-center flex-wrap">
          <button
            className="btn btn-sm btn-success"
            onClick={data?.NAME ? handleUpdate : handleSave}
          >
            {data?.NAME ? t("Update") : t("Save")}
          </button>
          <button className="btn btn-sm btn-success ml-2" onClick={handleReset}>
            {t("Reset")}
          </button>
          <button
            className="btn btn-sm btn-info ml-2"
            onClick={() => fileInputRef.current.click()}
          >
            {t("Upload Excel")}
          </button>
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>
      </div >

      {excelModalVisible && (
        <Modal
          visible={excelModalVisible}
          setVisible={() => setExcelModalVisible(false)}
          modalWidth="90vw"
          Header={t("Edit Uploaded Employee Data")}
          footer={<></>}
        >
          <div className="table-responsive p-3" style={{ maxHeight: "60vh" }}>
            <Tables
              thead={[
                { name: t("S.No"), width: "50px" },
                { name: t("Title *"), width: "120px" },
                { name: t("Full Name *"), width: "150px" },
                { name: t("Phone No *"), width: "150px" },
                { name: t("Department *"), width: "200px" },
                { name: t("Designation *"), width: "200px" },
                { name: t("User Type *"), width: "200px" },
                { name: t("Employee Group *"), width: "200px" },
                { name: t("Gender"), width: "120px" },
                { name: t("Email"), width: "150px" },
                { name: t("Discount (%)"), width: "150px" },
                { name: t("Local City"), width: "150px" }
              ]}
              removeShorting={true}
              scrollView={"scrollView"}
              tbody={excelData.map((row, index) => ({
                Sno: index + 1,
                Title: (
                  <div style={{ minWidth: "120px" }}>
                    <ReactSelect
                      placeholderName="Title"
                      name="Title"
                      respclass={"form-group"}
                      value={row?.Title?.label}
                      handleChange={(name, e) => handleExcelRowChange(row.uid, name, e)}
                      dynamicOptions={handleReactSelectDropDownOptions(dropDownState?.Title, "title", "title")}
                    />
                  </div>
                ),
                FullName: (
                  <div style={{ minWidth: "150px" }}>
                    <Input
                      type="text"
                      name="FullName"
                      value={row?.FullName}
                      onChange={(e) => handleExcelRowChange(row.uid, "FullName", e.target.value)}
                      className={!row?.FullName ? "form-control border-danger table-input" : "form-control table-input"}
                    />
                  </div>
                ),
                ContactNo: (
                  <div style={{ minWidth: "150px" }}>
                    <Input
                      type="number"
                      name="ContactNo"
                      value={row?.ContactNo}
                      onChange={(e) => {
                        if (e.target.value.length > 10) return;
                        handleExcelRowChange(row.uid, "ContactNo", e.target.value)
                      }}
                      className={!row?.ContactNo ? "table-input" : " table-input"}
                    />
                  </div>
                ),
                Department: (
                  <div style={{ minWidth: "200px" }}>
                    <ReactSelect
                      placeholderName="Department"
                      name="Department"
                      value={row?.Department?.value}
                      handleChange={(name, e) => handleExcelRowChange(row.uid, name, e)}
                      dynamicOptions={dropDownState?.Department}
                      className={!row?.Department?.value ? "border-danger" : ""}
                    />
                  </div>
                ),
                Designation: (
                  <div style={{ minWidth: "200px" }}>
                    <ReactSelect
                      placeholderName="Designation"
                      name="Designation"
                      value={row?.Designation?.value}
                      handleChange={(name, e) => handleExcelRowChange(row.uid, name, e)}
                      dynamicOptions={dropDownState?.Designation}
                      className={!row?.Designation?.value ? "border-danger" : ""}
                    />
                  </div>
                ),
                UserType: (
                  <div style={{ minWidth: "200px" }}>
                    <ReactSelect
                      placeholderName="UserType"
                      name="UserType"
                      value={row?.UserType?.value}
                      handleChange={(name, e) => handleExcelRowChange(row.uid, name, e)}
                      dynamicOptions={dropDownState?.UserType}
                      className={!row?.UserType?.value ? "border-danger" : ""}
                    />
                  </div>
                ),
                EmployeeGroup: (
                  <div style={{ minWidth: "200px" }}>
                    <ReactSelect
                      placeholderName="EmployeeGroup"
                      name="EmployeeGroup"
                      value={row?.EmployeeGroup?.value}
                      handleChange={(name, e) => handleExcelRowChange(row.uid, name, e)}
                      dynamicOptions={dropDownState?.EmployeeGroup}
                      className={!row?.EmployeeGroup?.value ? "border-danger" : ""}
                    />
                  </div>
                ),
                Gender: (
                  <div style={{ minWidth: "120px" }}>
                    <ReactSelect
                      placeholderName="Gender"
                      name="gender"
                      value={row?.gender?.label}
                      handleChange={(name, e) => handleExcelRowChange(row.uid, name, e)}
                      dynamicOptions={handleReactSelectDropDownOptions(dropDownState?.Gender, "gender", "gender").filter((item, index, self) => index === self.findIndex((t) => t.gender === item.gender))}
                      isDisabled={row?.Title?.gender ? true : false}
                    />
                  </div>
                ),
                Email: (
                  <div style={{ minWidth: "150px" }}>
                    <Input
                      type="text"
                      name="Email"
                      value={row?.Email}
                      onChange={(e) => handleExcelRowChange(row.uid, "Email", e.target.value)}
                    />
                  </div>
                ),
                Discount: (
                  <div style={{ minWidth: "150px" }}>
                    <Input
                      type="text"
                      name="Discount"
                      value={row?.Discount}
                      onChange={(e) => handleExcelRowChange(row.uid, "Discount", e.target.value)}
                    />
                  </div>
                ),
                City: (
                  <div style={{ minWidth: "150px" }}>
                    <Input
                      type="text"
                      name="City"
                      value={row?.City}
                      onChange={(e) => handleExcelRowChange(row.uid, "City", e.target.value)}
                    />
                  </div>
                )
              }))}
            />
          </div>
          <div className="d-flex justify-content-end p-3 border-top">
            <button className="btn btn-secondary mr-2" onClick={() => setExcelModalVisible(false)} disabled={isProcessingExcel}>
              {t("Cancel")}
            </button>
            <button className="btn btn-success" onClick={handleBulkSave} disabled={isProcessingExcel}>
              {isProcessingExcel ? t("Processing...") : t("Process & Save")}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Registration;
