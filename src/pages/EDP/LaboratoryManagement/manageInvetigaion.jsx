import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import Heading from "../../../components/UI/Heading";
import Tables from "../../../components/UI/customTable";
import Input from "../../../components/formComponent/Input";
import Modal from "../../../components/modalComponent/Modal";
import { useSelector } from "react-redux";
import {
  BindInvSampleContainer,
  BindSampleTypeMasterList,
  SaveInvSampleContainer,
  SaveSampleType,
} from "../../../networkServices/EDP/karanedp";
import {
  LoadHeadDepartment,
  BindInvListBox,
  BindSampleType,
  BindAnatomicSite,
  GetDocTypeList,
  UpdateInvestigation,
  SaveNewInvestigation,
  BindInvestigationMaster,
} from "../../../networkServices/edpApi";

const ManageInvestigationModal = ({ setIsOpen, fetchInvestigationMaster }) => {
  const [t] = useTranslation();
  const [formData, setFormData] = useState({
    searchBy: "code",
    SubDeprtID: "",
    investigationType: { value: "0" },
  });

  const initilise = {
    Gender: { value: "B", label: "All" },
    sampleType: { ID: "23", SampleType: "Select" },
    department: "",
    detailDepartment: "",
    cptCode: "",
    Anatomic: "",
    investigation: "",
    reportType: "",
    printSecquence: "",
    SubDeprtID: "",
    SampleCon: { value: "1", label: "Normal" },
    description: "",
    isDiscountable: { value: "0", label: "No" },
    rateEditable: { value: "0", label: "No" },
    showPtRpt: true,
    ShowOnline: true,
    PrintSeperate: false,
    PrintSampleName: false,
    isCulture: false,
    Urgent: false,
    IsActive: false,
    IsNabl: false,
    OutSource: false,
    NABHHeader: false,
    NursingWard: false,
    Method: "",
    TATMIN: "",
    Remark: "",
    investigationName: "",
    type: { value: "R", label: "Sample Required" },
  };
  const [values, SetValues] = useState(initilise);
  const [investigationData, setInvestigationData] = useState([]);
  const [subDepartmentData, setSubDepartmentData] = useState([]);
  const [bindDepartMent, SetBindDepartMent] = useState([]);
  const [bindSampleType, SetBindSampleType] = useState([]);
  const [anatomicsite, SetAnatomicSite] = useState([]);
  const [departmentDetail, SetDetailDepartment] = useState([]);
  const [reportType, SetReportType] = useState([
    { label: "Path Numeric", value: "1" },
    { label: "Path RichText", value: "3" },
    { label: "Radiology", value: "5" },
    // { label: "Culture Report", value: "7" },
    // { label: "Histo Cyto", value: "7" },
  ]);

  const [gender, setGender] = useState([
    { value: "M", label: "Male" },
    { value: "F", label: "Female" },
    { value: "B", label: "All" },
  ]);
  const [rate, setRate] = useState([
    { value: "1", label: "Yes" },
    { value: "0", label: "No" },
  ]);

  const [type, setType] = useState([
    { value: "R", label: "Sample Required" },
    { value: "N", label: "Sample Not Required" },
  ]);
  const [type1, setType1] = useState([
    { value: "R", label: "Acceptance Required" },
    { value: "N", label: "Acceptance Not Required" },
  ]);

  // Text typed above the investigation table (code or name).
  const [tableSearch, setTableSearch] = useState("");

  const tableRows = (investigationData || []).filter((row) => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(row?.ItemCode ?? "").toLowerCase().includes(q) ||
      String(row?.InvestigationName ?? "").toLowerCase().includes(q)
    );
  });

  // A table row opens that investigation in the form, exactly as picking it in
  // "Select Investigation" does.
  const handleTableRowSelect = (row) => {
    if (!row) return;
    if (formData.investigationType?.value === "1") {
      notify(t("Select Old Investigation to edit an existing investigation"), "error");
      return;
    }
    handleReactSelect("investigation", {
      ...row,
      label: row?.Name,
      value: row?.InvestigationId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBindInventory = async (deptId) => {
    try {
      const response = await BindInvListBox(deptId || "ALL");
      if (response.success) {
        setInvestigationData(response?.data);
        console.log("the department from api is work", response);
      } else {
        setInvestigationData([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setInvestigationData([]);
    }
  };
  const handleBindDepartment = async () => {
    try {
      const response = await LoadHeadDepartment("ManageInvestigation");
      console.log("set bind", response);

      if (response.success) {
        setSubDepartmentData(response?.data);
        SetBindDepartMent(response?.data);
        console.log("the department from api is work", response);
      } else {
        setSubDepartmentData([]);
        SetBindDepartMent([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setSubDepartmentData([]);
      SetBindDepartMent([]);
    }
  };
  /* fin_global_resources -> ManageInvestigationSampleTypeAddEdit = 1: a + (new sample type) and an
     edit button beside Sample Type, saving straight into the Sample Type master (sample_Type) and
     selecting it. Key 0 / missing = the dropdown alone, as before. */
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isSampleTypeAddEdit =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "ManageInvestigationSampleTypeAddEdit",
      )?.Value ?? "",
    ).trim() === "1";
  const emptySampleTypeForm = {
    isOpen: false,
    id: "",
    name: "",
    displayName: "",
    record: null,
  };
  const [sampleTypeForm, setSampleTypeForm] = useState(emptySampleTypeForm);

  const handleOpenSampleTypeAdd = () => {
    setSampleTypeForm({ ...emptySampleTypeForm, isOpen: true });
  };

  const handleOpenSampleTypeEdit = async () => {
    const id = values?.sampleType?.value;
    if (!id || String(id) === "0") {
      return notify(t("Please select a Sample Type to edit"), "warn");
    }
    const response = await BindSampleTypeMasterList();
    const record = (Array.isArray(response?.data) ? response.data : []).find(
      (item) => String(item?.id) === String(id),
    );
    if (!record) {
      return notify(t("Sample Type not found"), "error");
    }
    setSampleTypeForm({
      isOpen: true,
      id: String(id),
      name: record?.SampleTypeName ?? "",
      displayName: record?.DisplayName ?? "",
      record,
    });
  };

  const handleSaveSampleType = async () => {
    const name = String(sampleTypeForm?.name ?? "").trim();
    if (!name) {
      return notify(t("Sample Type Name is Required"), "warn");
    }
    const isEdit = !!sampleTypeForm?.id;
    const duplicate = (bindSampleType || []).some(
      (item) =>
        String(item?.SampleType ?? "").trim().toLowerCase() ===
          name.toLowerCase() && String(item?.ID) !== String(sampleTypeForm?.id),
    );
    if (duplicate) {
      return notify(t("This Sample Type already exists"), "warn");
    }
    // An edit keeps the record's container / colour / status as they are.
    const record = sampleTypeForm?.record || {};
    const response = await SaveSampleType({
      saveType: isEdit ? "Update" : "Save",
      id: isEdit ? sampleTypeForm.id : "",
      sampleTypeName: name,
      displayName: String(sampleTypeForm?.displayName ?? "").trim() || name,
      active: isEdit ? Number(record?.Active ?? 1) : 1,
      containername: record?.ContainerName ?? "",
      colourName: record?.ColourName ?? "",
      colour: record?.Colour ?? "",
      archiveDays: record?.ArchiveDays ?? "",
    });
    if (!response?.success) {
      return notify(response?.message || t("Sample Type not saved"), "error");
    }
    notify(response?.message, "success");
    setSampleTypeForm(emptySampleTypeForm);
    // Reload the dropdown and select the sample type just added / edited.
    const list = await BindSampleType();
    const rows = list?.success && Array.isArray(list?.data) ? list.data : [];
    SetBindSampleType(rows);
    const saved = rows.find((item) =>
      isEdit
        ? String(item?.ID) === String(sampleTypeForm.id)
        : String(item?.SampleType ?? "").trim().toLowerCase() ===
          name.toLowerCase(),
    );
    if (saved && values?.type?.value === "R") {
      SetValues((prev) => ({
        ...prev,
        sampleType: {
          value: String(saved?.ID),
          label: saved?.SampleType,
          ID: String(saved?.ID),
          SampleType: saved?.SampleType,
        },
      }));
    }
  };

  /* fin_global_resources -> ManageInvestigationSampleConAddEdit = 1: Sample Con works like Sample Type -
     its options come from m_investigation_samplecontainer, with + (add) and edit beside it. Key 0 /
     missing = the three fixed options, as before. */
  const isSampleConAddEdit =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (item) => item?.Name === "ManageInvestigationSampleConAddEdit",
      )?.Value ?? "",
    ).trim() === "1";
  const defaultSampleConOptions = [
    { value: "1", label: t("Normal") },
    { value: "7", label: t("Container/Block/Slide") },
    { value: "8", label: t("Container/Block") },
  ];
  const [sampleConList, setSampleConList] = useState([]);
  const sampleConOptions =
    isSampleConAddEdit && sampleConList.length > 0
      ? sampleConList.map((item) => ({
          value: String(item?.ItemValue),
          label: item?.ItemText,
        }))
      : defaultSampleConOptions;
  const loadSampleConList = async () => {
    const response = await BindInvSampleContainer();
    const rows = response?.success && Array.isArray(response?.data) ? response.data : [];
    setSampleConList(rows);
    return rows;
  };
  useEffect(() => {
    if (isSampleConAddEdit) loadSampleConList();
  }, [isSampleConAddEdit]);

  const emptySampleConForm = { isOpen: false, itemValue: "", name: "" };
  const [sampleConForm, setSampleConForm] = useState(emptySampleConForm);

  const handleOpenSampleConAdd = () => {
    setSampleConForm({ ...emptySampleConForm, isOpen: true });
  };

  const handleOpenSampleConEdit = () => {
    const itemValue = values?.SampleCon?.value;
    const option = sampleConOptions.find(
      (item) => String(item?.value) === String(itemValue),
    );
    if (!itemValue || !option) {
      return notify(t("Please select a Sample Con to edit"), "warn");
    }
    setSampleConForm({
      isOpen: true,
      itemValue: String(itemValue),
      name: option?.label ?? "",
    });
  };

  const handleSaveSampleCon = async () => {
    const name = String(sampleConForm?.name ?? "").trim();
    if (!name) {
      return notify(t("Sample Con Name is Required"), "warn");
    }
    const duplicate = sampleConOptions.some(
      (item) =>
        String(item?.label ?? "").trim().toLowerCase() === name.toLowerCase() &&
        String(item?.value) !== String(sampleConForm?.itemValue),
    );
    if (duplicate) {
      return notify(t("This Sample Con already exists"), "warn");
    }
    const response = await SaveInvSampleContainer({
      itemValue: Number(sampleConForm?.itemValue || 0),
      itemText: name,
    });
    if (!response?.success) {
      return notify(response?.message || t("Sample Con not saved"), "error");
    }
    notify(response?.message, "success");
    setSampleConForm(emptySampleConForm);
    // Reload the dropdown and select the one just added / renamed.
    await loadSampleConList();
    const savedValue = response?.data?.ItemValue ?? response?.data?.itemValue;
    if (savedValue !== undefined && savedValue !== null) {
      SetValues((prev) => ({
        ...prev,
        SampleCon: { value: String(savedValue), label: name },
      }));
    }
  };

  const handleBindSampleType = async () => {
    try {
      const response = await BindSampleType();
      console.log("set bind", response);

      if (response.success) {
        SetBindSampleType(response?.data);

        console.log("the department from api is work", response);
      } else {
        SetBindSampleType([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      SetBindSampleType([]);
    }
  };
  const handleBindAnatomicSite = async () => {
    try {
      const response = await BindAnatomicSite();
      console.log("set bind", response);

      if (response.success) {
        SetAnatomicSite(response?.data);

        console.log("the department from api is work", response);
      } else {
        SetAnatomicSite([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      SetBindSampleType([]);
    }
  };
  const handleBindDetailDepartment = async (id) => {
    try {
      const response = await GetDocTypeList(id);
      console.log("set bind", response);

      if (response.success) {
        SetDetailDepartment(response?.data);

        console.log("the department from api is work", response);
      } else {
        SetDetailDepartment([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      SetDetailDepartment([]);
    }
  };
  useEffect(() => {
    handleBindDepartment();
    handleBindInventory();
    handleBindSampleType();
    handleBindAnatomicSite();
    handleBindDetailDepartment(5);
  }, []);

  useEffect(() => {
    handleBindInventory(values?.department?.value);
  }, [values?.department?.value]);
  const handleReactSelect = (name, value) => {
    debugger

    if (name === "reportType") {
SetValues((prev) => ({
  ...prev,
type: { value: "", label: "" },
 [name]: value,
}) )
    }
    if (name === "investigation") {

      SetValues((prev) => ({
        ...prev,

        description: value?.Description || "",

        SubDeprtID: value?.ObservationType_ID
          ? {
            label: subDepartmentData.find(
              (item) =>
                item.ObservationType_ID == value?.ObservationType_ID
            )?.Name,
            value: value?.ObservationType_ID,
          }
          : "",

        investigationName: value?.InvestigationName || "",
        investigation: value, // ✅ full object store

        reportType: value?.ReportType
          ? {
            value: value.ReportType.toString(),
            label:
              reportType.find(
                (item) => item.value == value.ReportType
              )?.label || "",
          }
          : "",

        printSecquence: value?.Print_Sequence || "",

        OutSource: value?.IsOutSource == 1,
        IsActive: value?.IsActive == 1,
        Urgent: value?.IsUrgent == 1,
        isCulture: value?.IsCulture == 1,
        IsNabl: value?.IsNabl == 1,
        PrintSeperate: value?.PrintSeperate == 1,
        PrintSampleName: value?.PrintSampleName == 1,
        ShowOnline: value?.ShowOnline == 1,
        cptCode: value?.ItemCode,
        Method: value?.Method,
        TATMIN: value?.TATMIN,
        Remark: value?.Remark,
        Gender: value?.GenderInvestigate ? {
          value: value.GenderInvestigate,
          label:
            gender.find(
              (item) => item.value == value.GenderInvestigate
            )?.label || "",
        }
          : "",

        type:
          value?.Type === "R" || value?.Type === "N"
            ? {
              value: value.Type,
              label:
                type.find((item) => item.value === value.Type)
                  ?.label || "",
            }
            : "",
        /* type: value?.Type
          ? {
            value: value.Type,
            label:
              type.find((item) => item.value === value.Type)
                ?.label || "",
          }
          : "", */

        sampleType: value?.SampleTypeID
          ? (() => {
            const matched = bindSampleType.find(
              (item) =>
                item.ID.toString() === value.SampleTypeID.toString()
            );

            return matched
              ? {
                value: matched.ID.toString(),
                label: matched.SampleType,
              }
              : {
                value: value.SampleTypeID.toString(),
                label: "",
              };
          })()
          : { value: "0", label: "Select" },

        detailDepartment: value?.DeptID
          ? {
            value: value.DeptID.toString(),
            label:
              departmentDetail.find(
                (item) => item.ID == value.DeptID
              )?.Name || "",
            ID: value.DeptID,
          }
          : "",

        rateEditable: {
          value: value?.RateEditable?.toString() || "0",
          label:
            rate.find(
              (item) => item.value == value?.RateEditable
            )?.label || "No",
        },

        isDiscountable: {
          value: value?.IsDiscountable?.toString() || "0",
          label:
            rate.find(
              (item) => item.value == value?.IsDiscountable
            )?.label || "No",
        },

        SampleCon: {
          value: value?.SampleContainer?.toString() || "1",
          label:
            value?.SampleContainer == 7
              ? "Container/Block/Slide"
              : value?.SampleContainer == 8
                ? "Container/Block"
                : "Normal",
        },

        Anatomic: value?.AnatomicId
          ? {
            value: value.AnatomicId.toString(),   // always string
            label:
              anatomicsite.find(
                (item) => item.ID.toString() === value.AnatomicId.toString()
              )?.AnatomicName || "",
            ID: value.AnatomicId.toString(),      // 👈 ADD THIS
          }
          : null,
      }));
    }

    else if (name === "investigationType") {

      if (value?.value === "1") {
        SetValues({ ...initilise });
      }

      setFormData((prev) => ({
        ...prev,
        investigationType: value,
      }));
    }

    else {
      SetValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "printSecquence" && value.length > 5) return;
    if (name === "TATMIN" && value.length > 5) return;
    SetValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // if (name === 'newInvestigation') {
    //     SetValues(initilise)
    // }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e, values) => {
    e.preventDefault();

    if (formData.investigationType?.value === "1") {
      const invName = values?.investigationName?.label || values?.investigationName;
      if (!invName || !invName.toString().trim()) {
        return notify(t("Investigation Name is Required"), "warn");
      }
      if (!values?.SubDeprtID?.value || !values?.SubDeprtID?.label) {
        return notify(t("Sub Department is Required"), "warn");
      }
      if (!values?.reportType?.value) {
        return notify(t("Report Type is Required"), "warn");
      }
      if (!values?.Gender?.value) {
        return notify(t("Gender is Required"), "warn");
      }
      if (!values?.type?.value) {
        return notify(t("Type is Required"), "warn");
      }
      if (values?.type?.value === "R") {
        if (!values?.sampleType?.value || values?.sampleType?.value === "0" || values?.sampleType?.label === "Select" || !values?.sampleType?.label) {
          return notify(t("Sample Type is Required"), "warn");
        }
      }
      if (!values?.detailDepartment?.ID && !values?.detailDepartment?.value) {
        return notify(t("Department is Required"), "warn");
      }

      const payload = {
        saveNewInvestigation: {
          invName: invName,
          InvID: values?.investigation?.InvestigationId?.toString() || values?.investigation?.toString() || "",
          description: values?.description || "",
          TATMIN: values?.TATMIN || "",
          Remark: values?.Remark || "",
          Method: values?.Method || "",
          departmentID: values?.SubDeprtID?.value,
          departmentName: values?.SubDeprtID?.label,
          reportType: values?.reportType?.value,
          sampleType: values?.type?.value || "",
          printSequence: values?.printSecquence ? values?.printSecquence.toString() : "0",
          gender: values?.Gender?.value,
          principle: 0,
          sampletypename:
            values?.type?.value === "R" ? values?.sampleType?.label : "",
          cptCode: values?.cptCode || "",
          outsource: values?.OutSource === true ? 1 : 0,
          rateEditable: values?.rateEditable?.value ? Number(values?.rateEditable?.value) : 0,
          isUrgent: values?.Urgent === true ? 1 : 0,
          showPtRpt: values?.showPtRpt === true ? 1 : 0,
          showOnlineRpt: values?.ShowOnline === true ? 1 : 0,
          printSeperate: values?.PrintSeperate === true ? 1 : 0,
          printSampleName: values?.PrintSampleName === true ? 1 : 0,
          deptID: values?.detailDepartment?.ID?.toString() || values?.detailDepartment?.value?.toString(),
          isDiscountable: values?.isDiscountable?.value ? Number(values?.isDiscountable?.value) : 0,
          sampleTypeID: values?.type?.value === "R" ? (values?.sampleType?.ID || values?.sampleType?.value || 0) : 0,
          isCulture: values?.isCulture === true ? 1 : 0,
          isNabl: values?.IsNabl === true ? 1 : 0,
          sampleContainer: values?.SampleCon?.value || "1",
          anatomicSiteID: values?.Anatomic?.value || "0",
        },
        ipAddress: "192.168.1.100",
      };

      const resp = await SaveNewInvestigation(payload);
      if (resp?.success) {
        notify(resp?.message, "success");
        if (typeof fetchInvestigationMaster === "function") {
          await fetchInvestigationMaster();
        } else {
          await BindInvestigationMaster();
        }
        setIsOpen();
      } else {
        notify(resp?.message, "error");
      }
      console.log(resp);
    } else {
      if (!values?.investigation || !values?.investigation?.InvestigationId) {
        return notify("Please select an Investigation first", "warn");
      }
      const invName = values?.investigationName?.label || values?.investigationName;
      if (!invName || !invName.toString().trim()) {
        return notify(t("Investigation Name is Required"), "warn");
      }
      if (!values?.SubDeprtID?.value || !values?.SubDeprtID?.label) {
        return notify(t("Sub Department is Required"), "warn");
      }
      if (!values?.reportType?.value) {
        return notify(t("Report Type is Required"), "warn");
      }
      if (!values?.Gender?.value) {
        return notify(t("Gender is Required"), "warn");
      }
      if (!values?.type?.value) {
        return notify(t("Type is Required"), "warn");
      }
      if (values?.type?.value === "R") {
        if (!values?.sampleType?.value || values?.sampleType?.value === "0" || values?.sampleType?.label === "Select" || !values?.sampleType?.label) {
          return notify(t("Sample Type is Required"), "warn");
        }
      }
      if (!values?.detailDepartment?.ID && !values?.detailDepartment?.value) {
        return notify(t("Department is Required"), "warn");
      }

      const payload = {
        TATMIN: values?.TATMIN || "",
        Remark: values?.Remark || "",
        Method: values?.Method || "",
        invName: invName,
        Description: values?.description || "",
        invID: values?.investigation?.InvestigationId?.toString() || values?.investigation?.toString(),
        itemID: values?.investigation?.ItemID,
        departmentID: values?.SubDeprtID?.value,
        invObsId: values?.investigation?.Investigation_ObservationType_ID,
        departmentName: values?.SubDeprtID?.label,
        reportType: values?.reportType?.value,
        printSequence: values?.printSecquence ? values?.printSecquence.toString() : "0",
        gender: values?.Gender?.value,
        principle: values?.investigation?.principle || "",
        sampletypename:
          values?.type?.value === "R" ? values?.sampleType?.label : "",
        CPTCode: values.cptCode || "",
        active: values?.IsActive === true ? 1 : 0,
        outsource: values?.OutSource === true ? 1 : 0,
        rateEditable: values?.rateEditable?.value ? Number(values?.rateEditable?.value) : 0,
        isUrgent: values?.Urgent === true ? 1 : 0,
        showPtRpt: values?.showPtRpt === true ? 1 : 0,
        showOnlineRpt: values?.ShowOnline === true ? 1 : 0,
        printSeperate: values?.PrintSeperate === true ? 1 : 0,
        printSampleName: values?.PrintSampleName === true ? 1 : 0,
        deptID: values?.detailDepartment?.ID?.toString() || values?.detailDepartment?.value?.toString(),
        isDiscountable: values?.isDiscountable?.value ? Number(values?.isDiscountable?.value) : 0,
        sampleTypeID:
          values?.type?.value === "R" ? (values?.sampleType?.value || values?.sampleType?.ID || 0) : 0,
        isCulture: values?.isCulture === true ? 1 : 0,
        isNabl: values?.IsNabl === true ? 1 : 0,
        sampleContainer: values?.SampleCon?.value || "1",
        anatomicSiteID: values?.Anatomic?.value || "0",
        SampleType: values?.type?.value,
        nursingWard: values?.NursingWard === true ? 1 : 0,
        nabhHeader: values?.NABHHeader === true ? 1 : 0,
      };

      const resp = await UpdateInvestigation(payload);
      if (resp?.success) {
        notify(resp?.message, "success");
        if (typeof fetchInvestigationMaster === "function") {
          await fetchInvestigationMaster();
        } else {
          await BindInvestigationMaster();
        }
        setIsOpen();
      } else {
        notify(resp?.message, "error");
      }
      console.log(resp);
    }
  };

  return (
    <>
      <div className="spatient_registration_card card ">
        <div className="my-2  d-flex  flex-wrap">
          {/* <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
                        <div className="d-flex align-items-center ">
                            <input
                                type="checkbox"
                                id="newInv"
                                name="newInvestigation"
                                className="mr-2"
                                checked={formData.newInvestigation}
                                onChange={handleChange}
                            />
                            <label htmlFor="newInv" style={{ cursor: "pointer", margin: 0 }}>
                                {t("New Investigation")}
                            </label>
                        </div>
                    </div> */}
          <ReactSelect
            placeholderName={t("Select department")}
            id={"investigationType"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="investigationType"
            removeIsClearable={true}
            dynamicOptions={[
              { label: t("New Investigation"), value: "1" },
              { label: t("Old Investigation"), value: "0" },
            ]}
            handleChange={handleReactSelect}
            value={`${formData?.investigationType?.value}`}
          />

          <ReactSelect
            placeholderName={t("Select department")}
            id={"department"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="department"
            removeIsClearable={false}
            dynamicOptions={[
              ...handleReactSelectDropDownOptions(
                bindDepartMent,
                "Name",
                "ObservationType_ID"
              ),
            ]}
            isDisabled={
              formData.investigationType?.value === "1"
                ? true
                : values?.investigation
                  ? false
                  : false
            }
            handleChange={handleReactSelect}
            value={`${values?.department?.value}`}
          />
          {/* <div className="d-flex align-items-center ml-3 ">
            <input
              type="radio"
              id="code"
              name="searchBy"
              value={"code"}
              className="mr-2"
              checked={formData.searchBy === "code"}
              onChange={handleChange}
            />
            <label htmlFor="code" style={{ cursor: "pointer", margin: 0 }}>
              {t("code")}
            </label>
          </div>

          <div className="d-flex align-items-center ml-3">
            <input
              type="radio"
              id="firstName"
              name="searchBy"
              value="firstName"
              className="mr-2"
              checked={formData.searchBy === "firstName"}
              onChange={handleChange}
            />
            <label htmlFor="firstName" style={{ cursor: "pointer", margin: 0 }}>
              {t("firstName")}
            </label>
          </div>

          <div className="d-flex align-items-center ml-3">
            <input
              type="radio"
              id="inBetween"
              name="searchBy"
              value="inBetween"
              className="mr-2"
              checked={formData.searchBy === "inBetween"}
              onChange={handleChange}
            />
            <label htmlFor="inBetween" style={{ cursor: "pointer", margin: 0 }}>
              {t("InBetween")}
            </label>
          </div> */}

          <ReactSelect
            placeholderName={t("Search By")}
            id={"searchBy"}
            searchable={true}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            dynamicOptions={[
              { label: t("In Between"), value: "inBetween" },
              { label: t("First Name"), value: "firstName" },
              { label: t("Code"), value: "code" },
            ]}
            isDisabled={
              formData.investigationType?.value === "1"
                ? true
                : values?.investigation
                  ? false
                  : false
            }
            name="searchBy"
            handleChange={handleReactSelect}
            value={values?.searchBy || null}
          />

          <ReactSelect
            isDisabled={
              formData.investigationType?.value === "1" ? true : false
            }
            placeholderName={t("Select Investigation")}
            id={"Investigations"}
            searchable={true}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            dynamicOptions={[
              ...handleReactSelectDropDownOptions(
                investigationData,
                "Name",
                "InvestigationId"
              ),
            ]}
            name="investigation"
            handleChange={handleReactSelect}
            value={values?.investigation || null}
            requiredClassName={formData.investigationType?.value === "0" ? "required-fields" : ""}
          />
        </div>
        {/* <div className="my-2 ">
          <Heading title={"Investigations"} />
          <div className="row m-1"></div>
        </div> */}

        <div>
          <Heading title={t("Details")} />
          <div className="row m-2 mr-1  d-flex flex-wrap">
            <ReactSelect
              placeholderName={t("Sub Depart")}
              id={"SubDeprt"}
              searchable={true}
              removeIsClearable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              dynamicOptions={[
                ...handleReactSelectDropDownOptions(
                  subDepartmentData,
                  "Name",
                  "ObservationType_ID"
                ),
              ]}
              handleChange={handleReactSelect}
              value={values?.SubDeprtID?.value}
              name={"SubDeprtID"}
              requiredClassName={"required-fields"}
            />

            <Input
              type="text"
              className="form-control required-fields"
              id="Investigation"
              removeFormGroupClass={false}
              name="investigationName"
              lable={t("Investigation Name")}
              placeholder=""
              required={true}
              value={values?.investigationName ? values?.investigationName : ""}
              onChange={handleInputChange}
              // onKeyDown={handleKeyDown} // Add keydown event handler
              // inputRef={inputRef}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            /* disabled={
              formData.investigationType?.value === "0"
                ? true
                : values?.investigation
                  ? false
                  : false
            } */
            />
            <Input
              type="text"
              className="form-control"
              id="description"
              removeFormGroupClass={false}
              name="description"
              placeholder=""
              lable={t("Description")}
              value={values?.description}
              onChange={handleInputChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            />

            <ReactSelect
              placeholderName={t("Gender")}
              isDisabled={
                values?.Gender === "Male" || values?.Gender === "Female"
                  ? true
                  : false
              }
              id="Gender"
              inputId="Gender"
              removeIsClearable={true}
              dynamicOptions={[
                ...handleReactSelectDropDownOptions(gender, "label", "value"),
              ]}
              name="Gender"
              value={values?.Gender.value}
              handleChange={handleReactSelect}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              requiredClassName={`required-fields ${values?.Gender === "Male" || values?.Gender === "Female" ? "disable-focus" : ""}`}
              DropdownIndicator={true}
            />
<ReactSelect
              placeholderName={t("Report Type")}
              id="ReportType"
              inputId="reportType"
              removeIsClearable={true}
              dynamicOptions={[
                ...handleReactSelectDropDownOptions(
                  reportType,
                  "label",
                  "value"
                ),
              ]}
              name="reportType"
              value={values?.reportType?.value}
              handleChange={handleReactSelect}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              requiredClassName={"required-fields"}
              DropdownIndicator={true}
            />
{
  console.log("values?.type?.value",values?.type?.value)
}
            <ReactSelect
              placeholderName={t("Type")}
              id="Type"
              inputId="Type"
              removeIsClearable={true}
              dynamicOptions={values?.reportType?.value==="5"?[
                ...handleReactSelectDropDownOptions(type1, "label", "value"),
              ]:[
                ...handleReactSelectDropDownOptions(type, "label", "value"),
              ]}
              name="type"
              value={values?.type?.value}
              handleChange={handleReactSelect}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              requiredClassName={"required-fields"}
              DropdownIndicator={true}
            />

            {(() => {
            const sampleTypeSelect = (
            <ReactSelect
              placeholderName={t("Sample Type")}
              id="sampleType"
              requiredClassName={values?.type?.value === "R" ? "required-fields" : ""}
              inputId="sampleType"
              removeIsClearable={true}
              dynamicOptions={[
                { value: "0", label: t("Select") },
                ...handleReactSelectDropDownOptions(
                  bindSampleType,
                  "SampleType",
                  "ID"
                ),
              ]}
              isDisabled={values?.type?.value === "N" ? true : false}
              name="sampleType"
              value={
                values?.type?.value === "R" ? values?.sampleType?.value : 0
              }
              handleChange={handleReactSelect}
              // A checkbox before each sample type in the list, ticked for the selected one.
              handleFormatlabel={(fieldName, label, option, meta) => {
                if (meta?.context !== "menu" || String(option?.value) === "0")
                  return <div>{label}</div>;
                const checked =
                  values?.type?.value === "R" &&
                  String(values?.sampleType?.value) === String(option?.value);
                return (
                  <div className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      tabIndex={-1}
                      className="mr-2"
                      style={{ pointerEvents: "none" }}
                    />
                    <span>{label}</span>
                  </div>
                );
              }}
              searchable={true}
              respclass={
                isSampleTypeAddEdit
                  ? "flex-grow-1 p-0"
                  : "col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              }
              DropdownIndicator={true}
            />
            );
            if (!isSampleTypeAddEdit) return sampleTypeSelect;
            const sampleTypeDisabled = values?.type?.value === "N";
            return (
              <div
                className="col-xl-2 col-md-4 col-sm-4 col-12 d-flex align-items-start"
                style={{ gap: 4 }}
              >
                {sampleTypeSelect}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  title={t("Add Sample Type")}
                  disabled={sampleTypeDisabled}
                  onClick={handleOpenSampleTypeAdd}
                >
                  <i className="fa fa-plus" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  title={t("Edit Sample Type")}
                  disabled={
                    sampleTypeDisabled ||
                    !values?.sampleType?.value ||
                    String(values?.sampleType?.value) === "0"
                  }
                  onClick={handleOpenSampleTypeEdit}
                >
                  <i className="fa fa-edit" />
                </button>
              </div>
            );
            })()}

            <ReactSelect
              placeholderName={t("Department")}
              id="detailDepartment"
              inputId="detailDepartment"
              removeIsClearable={true}
              dynamicOptions={[
                ...handleReactSelectDropDownOptions(
                  departmentDetail,
                  "Name",
                  "ID"
                ),
              ]}
              requiredClassName={"required-fields"}
              name="detailDepartment"
              value={values?.detailDepartment?.ID}
              handleChange={handleReactSelect}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              DropdownIndicator={true}
            />

            <Input
              type="text"
              className="form-control"
              id="CPTCODE"
              removeFormGroupClass={false}
              name="cptCode"
              lable={t("CPT Code")}
              placeholder=""
              value={values.cptCode}
              onChange={handleInputChange}
              // onKeyDown={handleKeyDown} // Add keydown event handler
              // inputRef={inputRef}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Anatomic Site")}
              id="AnotomicSite"
              inputId="Anatomic"
              removeIsClearable={true}
              dynamicOptions={[
                ...handleReactSelectDropDownOptions(
                  anatomicsite,
                  "AnatomicName",
                  "ID"
                ),
              ]}
              name="Anatomic"
              value={values?.Anatomic?.ID}
              handleChange={handleReactSelect}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              DropdownIndicator={true}
            />

            <Input
              type="text"
              className="form-control"
              id="Method"
              removeFormGroupClass={false}
              name="Method"
              placeholder=""
              lable={t("Method")}
              value={values.Method}
              onChange={handleInputChange}
              // onKeyDown={handleKeyDown} // Add keydown event handler
              // inputRef={inputRef}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            />

            
            <Input
              type="number"
              className="form-control"
              id="PrintSecquence"
              placeholder=""
              removeFormGroupClass={false}
              name="printSecquence"
              lable={t("Print Secquence")}
              value={values.printSecquence}
              onChange={handleInputChange}
              // onKeyDown={handleKeyDown} // Add keydown event handler
              // inputRef={inputRef}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            />

            {(() => {
            const sampleConSelect = (
            <ReactSelect
              placeholderName={t("Sample Con")}
              id="SampleCon"
              inputId="SampleCon"
              removeIsClearable={true}
              dynamicOptions={sampleConOptions}
              name="SampleCon"
              value={values?.SampleCon?.value}
              handleChange={handleReactSelect}
              searchable={true}
              respclass={
                isSampleConAddEdit
                  ? "flex-grow-1 p-0"
                  : "col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              }
              DropdownIndicator={true}
            />
            );
            if (!isSampleConAddEdit) return sampleConSelect;
            return (
              <div
                className="col-xl-2 col-md-4 col-sm-4 col-12 d-flex align-items-start"
                style={{ gap: 4 }}
              >
                {sampleConSelect}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  title={t("Add Sample Con")}
                  onClick={handleOpenSampleConAdd}
                >
                  <i className="fa fa-plus" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  title={t("Edit Sample Con")}
                  disabled={!values?.SampleCon?.value}
                  onClick={handleOpenSampleConEdit}
                >
                  <i className="fa fa-edit" />
                </button>
              </div>
            );
            })()}
            <ReactSelect
              placeholderName={t("Is Discountable")}
              id="IsDiscountable"
              inputId="isDiscountable"
              removeIsClearable={true}
              dynamicOptions={[
                ...handleReactSelectDropDownOptions(rate, "label", "value"),
              ]}
              name="isDiscountable"
              value={values?.isDiscountable?.value}
              handleChange={handleReactSelect}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              DropdownIndicator={true}
            />
            <ReactSelect
              placeholderName={t("Rate Editable")}
              id="RateEditable"
              inputId="rateEditable"
              removeIsClearable={true}
              dynamicOptions={[
                ...handleReactSelectDropDownOptions(rate, "label", "value"),
              ]}
              name="rateEditable"
              value={values?.rateEditable?.value?.toString()}
              handleChange={handleReactSelect}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
              DropdownIndicator={true}
            />

            <Input
              type="number"
              className="form-control"
              id="TATMIN"
              removeFormGroupClass={false}
              name="TATMIN"
              placeholder=""
              maxLength={5}
              lable={t("Tat In (Munite)")}
              value={values.TATMIN}
              onChange={handleInputChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              id="Remark"
              removeFormGroupClass={false}
              name="Remark"
              placeholder=""
              // maxLength={5}
              lable={t("Remark")}
              value={values.Remark}
              onChange={handleInputChange}
              respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Other Information")} />
          <div className="row m-2 mr-1  d-flex flex-wrap">
            <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="showPtRpt"
                  name="showPtRpt"
                  className="mr-2"
                  checked={values.showPtRpt}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="showPtRpt"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Show Name in Patient Report")}
                </label>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="ShowOnline"
                  name="ShowOnline"
                  className="mr-2"
                  checked={values.ShowOnline}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="ShowOnline"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Show In Online Report")}
                </label>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="PrintSeperate"
                  name="PrintSeperate"
                  className="mr-2"
                  checked={values.PrintSeperate}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="PrintSeperate"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Print Seperate")}
                </label>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="PrintSampleName"
                  name="PrintSampleName"
                  className="mr-2"
                  checked={values.PrintSampleName}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="PrintSampleName"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Print Sample Name")}
                </label>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="IsCulture"
                  name="isCulture"
                  className="mr-2"
                  checked={values.isCulture}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="IsCulture"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Is Culture")}
                </label>
              </div>
            </div>

            <div className="col-xl-1 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="Urgent"
                  name="Urgent"
                  className="mr-2"
                  checked={values.Urgent}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="Urgent"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Urgent")}
                </label>
              </div>
            </div>
            <div className="col-xl-1 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="IsActive"
                  name="IsActive"
                  className="mr-2"
                  checked={values.IsActive}
                  disabled={
                    formData.investigationType?.value === "1" ? true : false
                  }
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="IsActive"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Is Active")}
                </label>
              </div>
            </div>
            <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="OutSource"
                  name="OutSource"
                  className="mr-2"
                  checked={values.OutSource || false}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="OutSource"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("OutSource")}
                </label>
              </div>
            </div>

            {/* NABL accredited investigation - investigation_master.IsNabl */}
            <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="IsNabl"
                  name="IsNabl"
                  className="mr-2"
                  checked={values.IsNabl || false}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="IsNabl"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("Is Nabl")}
                </label>
              </div>
            </div>

            {/* <div className="col-xl-2 col-md-4 col-sm-4 col-12 ">
              <div className="d-flex align-items-center ">
                <input
                  type="checkbox"
                  id="NABHHeader"
                  name="NABHHeader"
                  className="mr-2"
                  checked={values.NABHHeader || false}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="NABHHeader"
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {t("NABHHeader")}
                </label>
              </div>
            </div> */}
            {/* <div className="col-xl-2 col-md-4 col-sm-4 col-12 "                >
                            <div className="d-flex align-items-center ">
                                <input
                                    type="checkbox"
                                    id="NursingWard"
                                    name="NursingWard"
                                    className="mr-2"
                                    checked={values.NursingWard || false}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="NursingWard" style={{ cursor: "pointer", margin: 0 }}>
                                    {t("Nursing Board")}
                                </label>
                            </div>
                        </div> */}
          </div>
        </div>
      </div>
      <div className="text-right ">
        <button
          className="btn btn-sm btn-primary my-2"
          onClick={(e) => {
            handleSave(e, values);
          }}
        >
          {t("Save")}
        </button>
      </div>

      {/* Investigations of the selected department (sub category); all of them when no
          department is picked. Click a row to open it in the form above. */}
      <div className="mt-2">
        <Heading
          title={`${t("Investigations")} ${
            values?.department?.label ? `- ${values.department.label}` : `- ${t("All")}`
          } (${(investigationData || []).length})`}
          isBreadcrumb={false}
        />
        <div className="row px-2 pt-2">
          <Input
            type="text"
            className="form-control"
            id="investigationTableSearch"
            name="investigationTableSearch"
            lable={t("Search Code / Investigation Name")}
            placeholder=" "
            respclass="col-xl-3 col-md-4 col-sm-6 col-12"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>
        <Tables
          thead={[
            { name: t("S.No."), width: "4%" },
            t("Code"),
            t("Investigation Name"),
            t("Sub Department"),
            t("Report Type"),
            t("Active"),
          ]}
          tbody={tableRows.map((row, index) => ({
              SNo: index + 1,
              code: row?.ItemCode || "-",
              investigationName: row?.InvestigationName || "-",
              subDepartment: row?.ObservationTypeName || "-",
              reportType: row?.ReportType ?? "-",
              active: String(row?.IsActive) === "1" ? t("Yes") : t("No"),
            }))}
          tableHeight="tableHeight"
          // S.No. is the row's position in tableRows, also across pages.
          getRowClick={(ele) => handleTableRowSelect(tableRows[Number(ele?.SNo) - 1])}
        />
      </div>
      {sampleConForm?.isOpen && (
        <Modal
          visible={sampleConForm?.isOpen}
          setVisible={() => setSampleConForm(emptySampleConForm)}
          modalWidth="30vw"
          Header={sampleConForm?.itemValue ? t("Edit Sample Con") : t("Add Sample Con")}
          handleAPI={handleSaveSampleCon}
        >
          <div className="row">
            <Input
              type="text"
              className="form-control required-fields"
              id="sampleConName"
              name="sampleConName"
              value={sampleConForm?.name}
              onChange={(e) =>
                setSampleConForm((prev) => ({ ...prev, name: e.target.value }))
              }
              lable={t("Sample Con Name")}
              respclass="col-12"
            />
          </div>
        </Modal>
      )}

      {sampleTypeForm?.isOpen && (
        <Modal
          visible={sampleTypeForm?.isOpen}
          setVisible={() => setSampleTypeForm(emptySampleTypeForm)}
          modalWidth="35vw"
          Header={sampleTypeForm?.id ? t("Edit Sample Type") : t("Add Sample Type")}
          handleAPI={handleSaveSampleType}
        >
          <div className="row">
            <Input
              type="text"
              className="form-control required-fields"
              id="sampleTypeName"
              name="sampleTypeName"
              value={sampleTypeForm?.name}
              onChange={(e) =>
                setSampleTypeForm((prev) => ({ ...prev, name: e.target.value }))
              }
              lable={t("Sample Type Name")}
              respclass="col-md-6 col-12"
            />
            <Input
              type="text"
              className="form-control"
              id="sampleTypeDisplayName"
              name="sampleTypeDisplayName"
              value={sampleTypeForm?.displayName}
              onChange={(e) =>
                setSampleTypeForm((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              lable={t("Display Name")}
              respclass="col-md-6 col-12"
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default ManageInvestigationModal;
