import React, { useEffect, useState } from "react";
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../components/formComponent/DatePicker";
import moment from "moment";
import Heading from "../../../components/UI/Heading";
import {
  BindCurrencyDetailsAPI,
  EDPBindPanelCurrencyAPI,
  EDPBindPanelGroupAPI,
  EDPBindPanelsAPI,
  EDPBindPaymentModeAPI,
  handlePanelSave,
  handlePanelUpdate,
} from "../../../networkServices/EDP/edpApi";
import { handleReactSelectDropDownOptions } from "../../../utils/utils";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import LabeledInput from "../../../components/formComponent/LabeledInput";
import { handlePanelSavePayload, notify } from "../../../utils/ustil2";
import { AutoComplete } from "primereact/autocomplete";
import { MRDBindParentPanel } from "../../../networkServices/MRDApi";
import { pseudoUUID } from "../../../utils/constant";

const CreatePanel = ({ data, setModalData, setVisible, RoomMasterSetUp, }) => {
  console.log("data", data);
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [items, setItems] = useState([]);

  const [t] = useTranslation();

  const rateType = [
    { code: "SELF (OPD)", name: "SELF (OPD)" },
    { code: "SELF (IPD)", name: "SELF (IPD)" },
  ];

  const CoPaymentOn = [
    { value: "1", label: t("On Bill") },
    { value: "0", label: t("On Service") },
  ];

  const yesOrNoOption = [
    { value: "1", label: t("Yes") },
    { value: "0", label: t("No") },
  ];

  const PanelType = [
    { value: "credit", label: t("CREDIT") },
    { value: "cash", label: t("CASH") },
  ];
  const initialValues = {
    panelName: "",
    showPrintout: { label: "Yes", value: "1" },
    fallowrateipd: {},
    fallowrateopd: {},
    hideRate: { label: "No", value: "0" },
    coverNote: { label: "No", value: "0" },
    isctbApplicable: { label: "No", value: "0" },
    IsCorporatePanel: 0,
    IsAutoPanelApproval: 0,
    CoPaymentOn: { label: "On Bill", value: "1" },
    panelType: { label: "CREDIT", value: "credit" },
    groupType: { label: "Group", value: 1 },
    rateType: [],
    contactPerson: "",
    CurrencyConv: "",
    Addressone: "",
    Addresstwo: "",
    contactNo: "",
    phoneNo: "",
    emailId: "",
    faxNo: "",
    parentPanel : "",
    validfrom: moment(new Date()),
    validto: moment(new Date()),
    masterType: { label: "Scheme", value: "2" },
    // Scheme only: also save an Insurance of the same name and make it this Scheme's parent.
    IsInsurance: 0,
  };

  const [values, setValues] = useState(initialValues);
  console.log("values11", values);
  const [followRateOPD, setFollowRateOPD] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [followRateIPD, setFollowRateIPD] = useState([]);


  const deleteFollowRate = (item, data, setData) => {
    const itemDetail = data?.filter((val) => val.id !== item?.id);
    setData(itemDetail);
  };

  const handleSelect = (name, value, data, setData) => {
    if (name === "billCurrency") {
      BindCurrencyDetails(value.value);
    }
    if (name === "fallowrateopd" || name === "fallowrateipd") {
      if (data?.find((val) => val?.value === value?.value)) {
        notify(t("You Have Already Seleted This Rate"), "error")
        return
      }
      setData((val) => ([...val, { ...value, id: pseudoUUID() }]))
    }
    // if(name==="fallowrateipd")
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (name === "phoneNo") {
      if (values?.phoneNo?.length > 10) {
        return;
      }
    } else if (name === "contactNo") {
      if (values?.contactNo?.length > 10) {
        return;
      }
    }
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };
  console.log("asdasdasdasdas", values)
  const handleMultiSelectChange = (name, selectedOptions) => {
    // isDisabledreferrateipd
    // isDisabledreferrateopd
    if (name === "rateType") {
      const isDisabledreferrateopd = selectedOptions?.find((val) => val?.code === "SELF (OPD)")
      const isDisabledreferrateipd = selectedOptions?.find((val) => val?.code === "SELF (IPD)")

      setValues((val) => ({
        ...val,
        [name]: selectedOptions,
        isDisabledreferrateopd: isDisabledreferrateopd ? true : false,
        isDisabledreferrateipd: isDisabledreferrateipd ? true : false,
        referrateopd: isDisabledreferrateopd ? {} : val?.referrateopd,
        referrateipd: isDisabledreferrateipd ? {} : val?.referrateipd,

      }));
      // debugger
    } else {
      setValues((val) => ({ ...val, [name]: selectedOptions }));
    }
  };

  const handleMRDBindParentPanel = async () => {
    try {
      const response = await MRDBindParentPanel();
      return response;
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const [dropdownList, setDropdownList] = useState({
    PanelGroup: [],
    paymentMode: [],
    panelList: [],
  });
  const FetchAllDropDown = async () => {
    try {
      const [
        BindPanelGroup,
        paymentMode,
        panelList,
        currencyList,
        BindParentPanel,
      ] = await Promise.all([
        EDPBindPanelGroupAPI(),
        EDPBindPaymentModeAPI(),
        EDPBindPanelsAPI(),
        EDPBindPanelCurrencyAPI(),
        handleMRDBindParentPanel(),
      ]);

      if (BindParentPanel?.success) {
        // A Scheme's parent is always an Insurance, i.e. a panel with ParentID = 0.
        const filteredParentPanel = BindParentPanel?.data?.filter(
          (val) => val?.PanelID !== 0 && Number(val?.ParentID ?? 0) === 0,
        );
        console.log("filteredPar", filteredParentPanel);
        setDropdownList((val) => ({
          ...val,
          BindParentPanel: handleReactSelectDropDownOptions(
            filteredParentPanel,
            "Company_Name",
            "PanelID",
          ),
        }));
      }

      if (BindPanelGroup?.success) {
        setDropdownList((val) => ({
          ...val,
          PanelGroup: handleReactSelectDropDownOptions(
            BindPanelGroup?.data,
            "PanelGroup",
            "PanelGroupID",
          ),
        }));
      }
      if (paymentMode?.success) {
        setDropdownList((val) => ({
          ...val,
          paymentMode: paymentMode?.data?.map((val) => ({
            code: val?.PaymentModeID,
            name: val?.PaymentMode,
          })),
        }));
      }
      if (panelList?.success) {
        setDropdownList((val) => ({
          ...val,
          panelList: handleReactSelectDropDownOptions(
            panelList?.data,
            "Company_Name",
            "PanelID",
          ),
        }));
      }
      if (currencyList?.success) {
        currencyList?.data?.map((val) => {
          if (val?.IsBaseCurrency === 1) {
            BindCurrencyDetails(val?.CountryID);
            setValues((prev) => ({
              ...prev,
              rateCurrency: { value: val?.CountryID },
              billCurrency: { value: val?.CountryID },
            }));
          }
        });
        setDropdownList((val) => ({
          ...val,
          currencyList: handleReactSelectDropDownOptions(
            currencyList?.data,
            "CurrencyName",
            "CountryID",
          ),
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const BindCurrencyDetails = async (CountryID) => {
    let apiResp = await BindCurrencyDetailsAPI(CountryID);
    if (apiResp?.success) {
      setValues((prev) => ({
        ...prev,
        CurrencyConv: apiResp?.data?.Selling_Specific,
      }));
    } else {
      setValues((prev) => ({ ...prev, CurrencyConv: "" }));
    }
  };

  console.log("data", data);
  // useEffect(() => {
  //   FetchAllDropDown();
  //   debugger
  //   if (data?.PanelID) {
  //     setValues((val) => ({
  //       ...val,
  //       panelName: data?.Company_Name,
  //       Addressone: data?.Add1,
  //       Addresstwo: data?.Add2,
  //       contactPerson: data?.Contact_Person,
  //       contactNo: data?.Mobile,
  //       phoneNo: data?.Phone,
  //       emailId: data?.emailId,
  //       faxNo: data?.Fax_No,
  //       validfrom: data?.DateFrom ? moment(data?.DateFrom, "DD-MMM-YY").toDate() : moment().toDate(),
  //       validto: data?.DateTo ? moment(data?.DateTo, "DD-MMM-YY").toDate() : moment().toDate(),
  //       paymentMode: data?.PaymentMode ? data?.PaymentMode.split(",").map(code => ({ code: code.trim(), name: code.trim() })) : [],
  //       creditlimits: data?.CreditLimit,
  //       groupType: { label: data?.PanelGroup, value: data?.PanelGroupID },
  //       CurrencyConv: data?.BillCurrencyNotation,
  //       isctbApplicable: data?.IsCtb === 1 ? { label: "Yes", value: "1" } : { label: "No", value: "0" },
  //       panelType: data?.BillingType === "Credit/No" ? { label: "CREDIT", value: "credit" } : { label: "CASH", value: "cash" },
  //       referrateipd: { label: data?.Ref_Company, value: data?.ReferenceCode },
  //       referrateopd: { label: data?.Ref_CompanyOPD, value: data?.ReferenceCodeOPD },
  //       fallowrateopd: { label: data?.Ref_CompanyOPD, value: data?.ReferenceCodeOPD }, // Assuming Follow is same as Refer if not provided
  //       fallowrateipd: { label: data?.Ref_Company, value: data?.ReferenceCode },
  //     }))
  //   }
  // }, [data]);

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parsed = moment(dateStr, "DD-MMM-YY");
    // Force local date by using year/month/day directly
    return new Date(parsed.year(), parsed.month(), parsed.date());
  };

  useEffect(() => {
    FetchAllDropDown();
    if (data?.PanelID) {
      setIsEdit(true)
      setValues((val) => ({
        ...val,
        panelName: data?.Company_Name,
        Addressone: data?.Add1,
        Addresstwo: data?.Add2,
        contactPerson: data?.Contact_Person,
        contactNo: data?.Mobile,
        phoneNo: data?.Phone,
        emailId: data?.EmailID,
        faxNo: data?.Fax_No,
        // validfrom: data?.DateFrom ? moment(data?.DateFrom, "DD-MMM-YY").toDate() : moment().toDate(),
        // validto: data?.DateTo ? moment(data?.DateTo, "DD-MMM-YY").toDate() : moment().toDate(),
        masterType: {
          label: data?.MasterType,
          value: data?.MasterTypeValue ? String(data?.MasterTypeValue) : "",
        },
        validfrom: parseDate(data?.DateFrom),
        validto: parseDate(data?.DateTo),
        // PaymentMode is a comma-separated list of IDs — match by code (ID), not name
        // paymentMode: data?.PaymentMode
        //   ? data?.PaymentMode.split(",").map(code => ({ code: Number(code.trim()), name: code.trim() }))
        //   : [],

        creditlimits: data?.CreditLimit,
        creditlimitpercent: data?.CreditPanelLimitInPer,
        copayments: data?.Co_PaymentPercent,

        groupType: { label: data?.PanelGroup, value: data?.PanelGroupID },
        CurrencyConv: data?.BillCurrencyNotation,

        // Fix: "Credit/Yes" and "Credit/No" are both CREDIT — only "Cash" maps to CASH
        panelType: data?.BillingType?.toLowerCase().includes("credit")
          ? { label: "CREDIT", value: "credit" }
          : { label: "CASH", value: "cash" },

        isctbApplicable:
          data?.IsCtb === 1
            ? { label: "Yes", value: "1" }
            : { label: "No", value: "0" },
        IsCorporatePanel: Number(data?.IsCorporatePanel || data?.IsCorporatePanel || 0),
        IsAutoPanelApproval: Number(data?.IsAutoPanelApproval || 0),

        showPrintout:
          data?.ShowPrintOut === 1
            ? { label: "Yes", value: "1" }
            : { label: "No", value: "0" },

        hideRate:
          data?.HideRate === 1
            ? { label: "Yes", value: "1" }
            : { label: "No", value: "0" },

        coverNote:
          data?.CoverNote === 1
            ? { label: "Yes", value: "1" }
            : { label: "No", value: "0" },

        CoPaymentOn:
          data?.Co_PaymentOn === 1
            ? { label: "On Bill", value: "1" }
            : { label: "On Service", value: "0" },

        // Refer Rate — use null-safe label fallback
        referrateopd: {
          label: data?.Ref_CompanyOPD || "",
          value: data?.ReferenceCodeOPD,
        },
        referrateipd: {
          label: data?.Ref_Company || "",
          value: data?.ReferenceCode,
        },

        // Follow Rate — use the dedicated FollowPanelRate fields
        fallowrateopd: {
          label: data?.Ref_CompanyOPD || "",
          value: data?.FollowPanelRateOPD,
        },
        fallowrateipd: {
          label: data?.Ref_Company || "",
          value: data?.FollowPanelRateIPD,
        },
parentPanel :{label: data?.ParentCompanyName || "", value: data?.ParentID},
        // Currency — bind by RateCurrencyCountryID
        rateCurrency: { value: data?.RateCurrencyCountryID },
        billCurrency: { value: data?.RateCurrencyCountryID },
        // parentID: { label: data?.IsTPA || "", value: data?.PanelID },
      }));
    }
  }, [data]);

  useEffect(() => {
    if (data?.PanelID && dropdownList?.paymentMode?.length > 0) {
      const selectedPaymentModes = data?.PaymentMode
        ? data.PaymentMode.split(",")
          .map((id) =>
            dropdownList.paymentMode.find(
              (opt) => opt.code === Number(id.trim()),
            ),
          )
          .filter(Boolean)
        : [];

      setValues((val) => ({ ...val, paymentMode: selectedPaymentModes }));
    }
  }, [data, dropdownList?.paymentMode]);

  const handleSave = async () => {
console.log("first",values)
    // With "Is Insurance" the parent is the Insurance saved alongside, so none is picked.
    if (values?.masterType?.value == "2" && Number(values?.IsInsurance || 0) !== 1) {
      if (!values?.parentPanel?.value) {
        notify(t("Parent Panel is required"), "error");
        return;
      }
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

if (!values?.emailId) {
  notify(t("Email ID are required"), "error");
  return;
}

if (!emailRegex.test(values?.emailId)) {
  notify(t("Please enter a valid Gmail address"), "error");
  return;
}
    // if (!values?.panelName || !values?.emailId) {
    //   notify("Panel Name and Email ID are required", "error");
    //   return;
    // }

    if (values?.paymentMode?.length === 0) {
      notify(t("Payment Mode is required"), "error");
      return;
    }

    if (values?.rateType?.length === 0) {
      if (!values?.referrateopd?.value || !values?.referrateipd?.value) {
        notify(t("Refer Rate is required"), "error");
        return;
      }
    }
 
    const payload = handlePanelSavePayload(values);

    console.log("payload", payload, data?.PanelID);
    if (data?.PanelID) {
      payload.panelID = data?.PanelID;
    } else {
      payload.panelID = "";
    }
    let apiResp = data?.PanelID
      ? await handlePanelUpdate(payload)
      : await handlePanelSave(payload);
    if (apiResp?.success) {
      setIsEdit(false)
      notify(apiResp?.message, "success");
      setValues({...initialValues})
      // Reload the dropdowns so the panel just saved shows up in Parent Panel / Refer Rate
      // without reopening the page.
      FetchAllDropDown();
      RoomMasterSetUp();
      data?.PanelID ? setModalData({ visible: false }) : setVisible(false);
    } else {
      notify(apiResp?.message, "error");
    }
  };

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

        {/* Master Type is no longer picked here: a new entry is always a Scheme (masterType 2 in
            initialValues), and "Is Insurance" takes its place - ticked, the Insurance of the same
            name is saved too and becomes this Scheme's parent. An existing panel keeps the master
            type it was loaded with. */}
        {values?.masterType?.value === "2" && !data?.PanelID && (
          <div className="col-xl-2 col-md-4 col-sm-4 col-12 mb-2 d-flex align-items-center">
            <input
              type="checkbox"
              id="IsInsurance"
              name="IsInsurance"
              className="mr-2"
              checked={Number(values?.IsInsurance || 0) === 1}
              onChange={handleChange}
            />
            <label htmlFor="IsInsurance" className="mb-0">
              {t("Is Insurance")}
            </label>
          </div>
        )}

        <Input
          type="text"
          className="form-control required-fields"
          //id="panelName"
          name="panelName"
          value={values?.panelName}
          onChange={handleChange}
          lable={t("Panel Name")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
        {values?.masterType?.value === "2" && Number(values?.IsInsurance || 0) !== 1 && <ReactSelect
          placeholderName={t("Parent Panel")}
          //id={"showPrintout"}
          requiredClassName={values?.masterType?.value === "2" ? "required-fields" : ""}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={dropdownList?.BindParentPanel}
          handleChange={handleSelect}
          value={values?.parentPanel?.value}
          name={"parentPanel"}
        />}
        <ReactSelect
          placeholderName={t("Group Type")}
          //id={"groupType"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="groupType"
          removeIsClearable={true}
          dynamicOptions={dropdownList?.PanelGroup}
          handleChange={handleSelect}
          value={`${values?.groupType?.value}`}
        />
        {values?.masterType?.value === "1" && !data?.PanelID && <ReactSelect
          placeholderName={t("Self Billing")}
          //id={"groupType"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="selfBilling"

          removeIsClearable={true}
          dynamicOptions={[
            { label: t("Yes"), value: "1" },
            { label: t("No"), value: "0" },
          ]}
          handleChange={handleSelect}
          value={`${values?.selfBilling?.value}`}
        />}
        <Input
          type="text"
          className="form-control"
          //id="contactPerson"
          name="contactPerson"
          value={values?.contactPerson}
          onChange={handleChange}
          lable={t("Contact Person")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          //id="Addressone"
          name="Addressone"
          value={values?.Addressone}
          onChange={handleChange}
          lable={t("Address1")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
        <Input
          type="text"
          className="form-control"
          //id="Addresstwo"
          name="Addresstwo"
          value={values?.Addresstwo}
          onChange={handleChange}
          lable={t("Address2")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />
        <Input
          type="number"
          className="form-control"
          //id="contactNo"
          name="contactNo"
          value={values?.contactNo}
          onChange={handleChange}
          lable={t("Contact No")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <Input
          type="number"
          className="form-control"
          //id="phoneNo"
          name="phoneNo"
          value={values?.phoneNo}
          onChange={handleChange}
          lable={t("Phone No")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <Input
          type="text"
          className="form-control required-fields"
          //id="emailId"
          name="emailId"
          value={values?.emailId}
          onChange={handleChange}
          lable={t("Email ID")}

          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <Input
          type="text"
          className="form-control"
          //id="faxNo"
          name="faxNo"
          value={values?.faxNo}
          onChange={handleChange}
          lable={t("Fax No.")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <DatePicker
          //id="validfrom"
          name="validfrom"
          className={`custom-calendar `}
          placeholder={VITE_DATE_FORMAT}
          lable={t("Valid From")}
          // value={values?.fromDate || new Date()}
          value={values?.validfrom ? new Date(values?.validfrom) : new Date()}
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          minDate={new Date()}
        />
        <DatePicker
          //id="validto"
          name="validto"
          className={`custom-calendar `}
          placeholder={VITE_DATE_FORMAT}
          lable={t("Valid To")}
          // value={values?.fromDate || new Date()}
          value={values?.validto ? new Date(values?.validto) : new Date()}
          handleChange={handleChange}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          minDate={new Date()}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          requiredClassName={"required-fields"}
          name="paymentMode"
          //id="paymentMode"
          placeholderName={t("Payment Mode")}
          dynamicOptions={dropdownList?.paymentMode}
          handleChange={handleMultiSelectChange}
          value={values?.paymentMode}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="rateType"
          //id="rateType"
          placeholderName={t("Rate Type")}
          dynamicOptions={rateType}
          handleChange={handleMultiSelectChange}
          value={values?.rateType}
        />
        {console.log("values?.rateType", values?.rateType)}

        <ReactSelect
          placeholderName={t("Refer Rate(OPD)")}
          //id={"referrateipd"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={dropdownList?.panelList}
          isDisabled={values?.isDisabledreferrateopd}
          handleChange={handleSelect}
          value={values?.referrateopd?.value}
          name={"referrateopd"}
           requiredClassName="required-fields"
        />

        <ReactSelect
          placeholderName={t("Refer Rate(IPD)")}
          //id={"referrateipd"}
           requiredClassName="required-fields"
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={dropdownList?.panelList}
          isDisabled={values?.isDisabledreferrateipd}
          handleChange={handleSelect}
          value={values?.referrateipd?.value}
          name={"referrateipd"}
        />

        <Input
          type="text"
          className="form-control"
          //id="creditlimits"
          name="creditlimits"
          value={values?.creditlimits}
          onChange={handleChange}
          lable={t("Credit Limits")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <ReactSelect
          placeholderName={t("Show PrintOut")}
          //id={"showPrintout"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={yesOrNoOption}
          handleChange={handleSelect}
          value={`${values?.showPrintout?.value}`}
          name={"showPrintout"}
        />


        <ReactSelect
          placeholderName={t("Hide Rate")}
          //id={"hideRate"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={yesOrNoOption}
          handleChange={handleSelect}
          value={`${values?.hideRate?.value}`}
          name={"hideRate"}
        />

        <ReactSelect
          placeholderName={t("Co-Payment On")}
          //id={"CoPaymentOn"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={CoPaymentOn}
          handleChange={handleSelect}
          value={`${values?.CoPaymentOn?.value}`}
          name={"CoPaymentOn"}
        />

        <Input
          type="text"
          className="form-control"
          //id="copayments"
          name="copayments"
          value={values?.copayments}
          onChange={handleChange}
          lable={t("Co-Payment In %")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <ReactSelect
          placeholderName={t("Rate Currency")}
          //id={"rateCurrency"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={dropdownList?.currencyList}
          handleChange={handleSelect}
          value={values?.rateCurrency?.value}
          name={"rateCurrency"}
        />
        <ReactSelect
          placeholderName={t("Panel Type")}
          //id={"panelType"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={PanelType}
          handleChange={handleSelect}
          value={`${values?.panelType?.value}`}
          name={"panelType"}
        />

        <ReactSelect
          placeholderName={t("Bill Currency")}
          //id={"billCurrency"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={dropdownList?.currencyList}
          handleChange={handleSelect}
          value={`${values?.billCurrency?.value}`}
          name={"billCurrency"}
        />

        <Input
          type="text"
          className="form-control"
          //id="CurrencyConv"
          name="CurrencyConv"
          value={values?.CurrencyConv}
          onChange={handleChange}
          lable={t("Currency Conversion")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <ReactSelect
          placeholderName={t("Follow Rate(OPD)")}
          //id={"fallowrateopd"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={dropdownList?.panelList}
          handleChange={(name, value) => { handleSelect(name, value, followRateOPD, setFollowRateOPD) }}
          value={`${values?.fallowrateopd?.value}`}
          name={"fallowrateopd"}
        />

        {followRateOPD?.map((val, key) => {
          return (
            <div className="col-xl-2 col-md-4 col-sm-4 col-12 position-relative">
              <LabeledInput
                label={`Follow Rate OPD (${key + 1})`}
                value={val?.label}
                className={"mb-2"}
              />

              <i
                className="fa fa-times fa-sm new_record_pluse"
                style={{ position: "absolute", top: "5px", right: "24px" }}
                onClick={() => {
                  deleteFollowRate(val, followRateOPD, setFollowRateOPD);
                }}
              ></i>
              {/* </button> */}
            </div>
          );
        })}

        <ReactSelect
          placeholderName={t("Follow Rate(IPD)")}
          //id={"fallowrateopd"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={dropdownList?.panelList}
          // handleChange={handleSelect}
          handleChange={(name, value) => { handleSelect(name, value, followRateIPD, setFollowRateIPD) }}
          value={values?.fallowrateipd?.value}
          name={"fallowrateipd"}
        />

        {followRateIPD?.map((val, key) => {
          return (
            <div className="col-xl-2 col-md-4 col-sm-4 col-12 position-relative">
              <LabeledInput
                label={`Follow Rate IPD (${key + 1})`}
                value={val?.label}
                className={"mb-2"}
              />

              <i
                className="fa fa-times fa-sm new_record_pluse"
                style={{ position: "absolute", top: "5px", right: "24px" }}
                onClick={() => {
                  deleteFollowRate(val, followRateIPD, setFollowRateIPD);
                }}
              ></i>
              {/* </button> */}
            </div>
          );
        })}

        <ReactSelect
          placeholderName={t("Cover Note")}
          //id={"coverNote"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={yesOrNoOption}
          handleChange={handleSelect}
          value={`${values?.coverNote?.value}`}
          name={"coverNote"}
        />
        <div className="col-xl-2 col-md-4 col-sm-4 col-12 mb-2">
          <LabeledInput
            label={t("Note")}
            value={t("CO-Payment Payable By Patient")}
          />
        </div>

        <Input
          type="text"
          className="form-control"
          //id="creditlimitpercent"
          name="creditlimitpercent"
          value={values?.creditlimitpercent}
          onChange={handleChange}
          lable={t("Credit Limit In %")}
          placeholder=""
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
        />

        <ReactSelect
          placeholderName={t("IS CTB Applicable")}
          //id={"isctbApplicable"}
          searchable={true}
          removeIsClearable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          dynamicOptions={yesOrNoOption}
          handleChange={handleSelect}
          value={`${values?.isctbApplicable?.value}`}
          name={"isctbApplicable"}
        />
        <div className="col-xl-2 col-md-4 col-sm-4 col-12 mb-2 d-flex align-items-center">
          <input
            type="checkbox"
            id="IsCorporatePanel"
            name="IsCorporatePanel"
            className="mr-2"
            checked={Number(values?.IsCorporatePanel || 0) === 1}
            onChange={handleChange}
          />
          <label htmlFor="IsCorporatePanel" className="mb-0">
            {t("Is Corporate")}
          </label>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-4 col-12 mb-2 d-flex align-items-center">
          <input
            type="checkbox"
            id="IsAutoPanelApproval"
            name="IsAutoPanelApproval"
            className="mr-2"
            checked={Number(values?.IsAutoPanelApproval || 0) === 1}
            onChange={handleChange}
          />
          <label htmlFor="IsAutoPanelApproval" className="mb-0">
            {t("Auto Panel Approval")}
          </label>
        </div>

        <div className="col-12 text-right">
          <button
            className="btn btn-sm btn-success px-4"
            type="button"
            onClick={handleSave}
          >
            {t(isEdit ? "Update" : "Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePanel;
