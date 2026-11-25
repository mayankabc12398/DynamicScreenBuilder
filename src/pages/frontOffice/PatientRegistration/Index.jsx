import React, { useEffect, useRef, useState } from "react";
import Accordion from "@app/components/UI/Accordion";
import DpdpConsentPanel from "@app/components/front-office/DpdpConsentPanel";
import PersonalDetails from "@app/components/front-office/PersonalDetails";
import PanelDetails from "@app/components/front-office/PanelDetails";
import { useTranslation } from "react-i18next";
import OtherDetails from "@app/components/front-office/OtherDetails";
import { useDispatch, useSelector } from "react-redux";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { useFormik } from "formik";
import {
  BIND_TABLE_OLDPATIENTSEARCH_REG,
  DIRECT_PATIENT_SEARCH_TYPE,
  PATIENT_DETAILS,
} from "../../../utils/constant";
import Heading from "../../../components/UI/Heading";
import {
  Register_Patient_TypeCasting,
  bindLabelValue,
  filterByType,
  filterByTypes,
  handletab,
  notify,
} from "../../../utils/utils";
import {
  CentreWiseCacheByCenterID,
  CentreWisePanelControlCache,
  GetPatientDocument,
  PageConfigurationAPIDetails,
  SavePatientPanelDocument,
} from "../../../store/reducers/common/CommonExportFunction";
import {
  Oldpatientsearch,
  PatientSearchbyBarcode,
  bindPanelByPatientID,
} from "../../../networkServices/opdserviceAPI";
import EasyUI from "../../../components/EasyUI/EasyUI";
import {
  getCheckMotherBabyApi,
  PatientRegistrationAPI,
  PatientUpdateRegistrationAPI,
  ValidateDuplicatePatientEntry,
} from "../../../networkServices/directPatientReg";
import Modal from "../../../components/modalComponent/Modal";
import DuplicatePatientAlertModel from "../../../components/modalComponent/Utils/DuplicatePatientAlertModel";
import AdmitedBabyModal from "../../../components/modalComponent/Utils/AdmitedBabyModal";

import * as Yup from "yup";
import moment from "moment";
import Input from "../../../components/formComponent/Input";
import { PageConfigurationAPi } from "../../../networkServices/commonApi";
import { groupByKey } from "../../../utils/ustil2";
import { getMasterPageBookingApi } from "../../../networkServices/BillingsApi";
import { useNavigate } from "react-router-dom";
import AadhaarOcrFab from "./AadhaarOcrFab";
import AadhaarMissingAlert from "../../../components/front-office/AadhaarMissingAlert";
import MLCMissingAlert from "../../../components/front-office/MLCMissingAlert";
import PreRegistration from "./PreRegistration";
import BulkPatientRegistration from "./BulkPatientRegistration";
import DateWiseDocument from "../../../components/commonComponents/DateWiseDocument";
import QRCode from "react-qr-code";

/**
 * Generates dynamic validation schema based on API configuration data
 * Only includes fields where IsActive === 1 AND IsMandatory === 1
 * @param {Array} configurationData - API response with field configurations
 * @returns {Object} Yup validation schema
 */
const generateValidationSchema = (configurationData = [], documentIds = []) => {
  // debugger
  const shapeObject = {};

  // Filter fields that are both Active and Mandatory
  const mandatoryFields = configurationData.filter(
    (field) => field.IsActive === 1 && field.IsMandatory === 1,
  );

  mandatoryFields.forEach((field) => {
    const AccordionName = field.AccordionName;
    const fieldName = field.ControlName;
    const displayName = field.DisplayName || field.ControlName;
    const fieldType = field.Type;

    // Skip validation constraints for ID proof selection and number fields if at least one document ID has been added
    if (
      (fieldName === "documentName" || fieldName === "ID_Proof_No") &&
      documentIds?.length > 0
    ) {
      return;
    }

    try {
      switch (fieldType) {
        case "text":
        case "email":
          if (fieldName === "PFirstName" || fieldName === "PLastName") {
            shapeObject[fieldName] = Yup.string()
              .required(`${displayName} is required`)
              .min(3, `${displayName} must be at least 3 characters`);
          } else {
            shapeObject[fieldName] = Yup.string().required(
              `${displayName} is required`,
            );
          }
          break;

        case "number":
        case "mobile":
          if (fieldName === "Mobile") {
            shapeObject[fieldName] = Yup.string()
              .matches(/^[0-9]+$/, `${displayName} must be only digits`)
              .min(10, `${displayName} must be at least 10 digits`)
              .required(`${displayName} is required`);
          } else {
            shapeObject[fieldName] = Yup.number().required(
              `${displayName} is required`,
            );
          }
          break;

        case "select":
        case "multiselect":
          shapeObject[fieldName] = Yup.mixed().required(
            `${displayName} is required`,
          );
          break;

        case "datepicker":
          shapeObject[fieldName] = Yup.string().required(
            `${displayName} is required`,
          );
          break;

        case "timepicker":
          shapeObject[fieldName] = Yup.string().required(
            `${displayName} is required`,
          );
          break;

        case "checkbox":
          shapeObject[fieldName] = Yup.boolean().required(
            `${displayName} is required`,
          );
          break;

        default:
          shapeObject[fieldName] = Yup.mixed().required(
            `${displayName} is required`,
          );
      }
    } catch (error) {
      console.error(`Error building validator for field ${fieldName}:`, error);
    }
  });

  return Yup.object().shape(shapeObject);
};

const defaultValidationSchema = Yup.object().shape({
  Mobile: Yup.string()
    .matches(/^[0-9]+$/, "Mobile must be only digits")
    .min(10, "Mobile must be at least 10 digits")
    .required("Mobile number is required"),
  Title: Yup.mixed().required("Title is required"),
  PFirstName: Yup.string()
    .required("First Name is required")
    .min(3, "First Name is At least 3 characters"),
  // PLastName: Yup.string()
  //   .required("Last Name is required")
  //   .min(3, "Last Name is At least 3 characters"),
  // Gender: Yup.mixed().required("Gender is required"),
  // Age: Yup.string()
  //   .matches(
  //     /^\d+(\.\d{1,2})?$/,
  //     "Age must be a number with up to two decimal places"
  //   )
  //   .required("Age is required"),
  // House_No: Yup.string().required("Local Address is required"),
});

export default function Index(props) {
  const localdata = useLocalStorage("userData", "get");
  const [t] = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [panelBodyData, setPanelBodyData] = useState([]);
  const [isExtractAdharOpen, setIsExtractAdharOpen] = useState(false);

  const [motherBabyMoldal, setMotherBabyMoldal] = useState(false);
  const [babyTitle, setBabyTitle] = useState("");
  const [dpdpUHID, setDpdpUHID] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [panelDocumentData, setPanelDocumentData] = useState([]);
  const [isDuplicateModel, setIsDuplicateModel] = useState(false);
  const [isBulkRegModal, setIsBulkRegModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isAfterSaveModel, setIsAfterSaveModel] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [isRedirect, setIsRedirect] = useState(false);
  const [hasJustSaved, setHasJustSaved] = useState(false);
  const [docPreview, setDocPreview] = useState(null);
  const [isRedirectBtn, setRedirectBtn] = useState([]);
  const [getOldPatientData, setGetOldPatientData] = useState([]);
  const [documentIds, setDocumentIds] = useState([]);
  const [isUpdateRegistration, setIsRegistrationUpdate] = useState(false);
  const [relations, setRelations] = useState([]);
  const initialInputs = { otherDetails: [], personalDetails: [] };
  const [dynamicData, setDynamicData] = useState(initialInputs);
  const [patientDetails, setPatientDetail] = useState({
    PanelPatientDetail: [],
    singlePatientData: {},
  });
  const [checkbox, setCheckbox] = useState(false);
  const [modalHandlerState, setModalHandlerState] = useState({
    show: false,
  });

  // State for dynamic validation schema
  const [validationSchema, setValidationSchema] = useState(
    defaultValidationSchema,
  );
  const [inactiveOrNonMandatoryFields, setInactiveOrNonMandatoryFields] =
    useState([]);

  const handleNavigate = (url, uhid) => {
    navigate(`/${url}`, { state: { uhid: uhid } });
  };
  const inputRef = useRef(null);
  let tabItems = ["Panel Details", "Other Details"];
  if (props?.PatientID) tabItems = ["Other Details"];

  const formRef = useRef(null);

  const {
    CentreWiseCache,
    CentreWisePanelControlCacheList,
    BindResource,
    PageConfigurationAPIList,
    GetGlobalResources,
  } = useSelector((state) => state.CommonSlice);

  const globalResourcesList = Array.isArray(GetGlobalResources)
    ? GetGlobalResources
    : GetGlobalResources?.data || [];

  /* 26-10-2026 - fin_global_resources HideRegistrationOtherDetails = 1 keeps the "Other Details" block closed on
     Patient Registration until its heading is clicked; its fields are then not required (the mandatory Patient Type lives
     in Personal Details, so it still is). Value 0 / no row = the block is open as before. */
  const hideOtherDetails =
    globalResourcesList?.find((item) => item?.Name === "HideRegistrationOtherDetails")?.Value === "1";

  const preRegQrUrl =
    globalResourcesList?.find((item) => item?.Name === "PRE_REG_QR_URL")?.Value || "";

  // fin_global_resources: SkipBookingAfterRegistration = 1 → checkbox ON by default (skip Confirmation+OPD/IPD modal)
  const skipBookingDefault =
    globalResourcesList?.find((item) => item?.Name === "SkipBookingAfterRegistration")?.Value === "1";

  const [skipBooking, setSkipBooking] = useState(true);

  // Sync checkbox with global resource once loaded
  useEffect(() => {
    setSkipBooking(skipBookingDefault);
  }, [skipBookingDefault]);

  /* Until this key is switched on, the Panel Document popup behaves exactly as it always
     has: the scans are collected in state and go nowhere. With it on they are stored
     against the visit, which is both what feeds the visit-wise folders on Patient Encounter
     History and what the IPD bill clearance check reads for "Panel Document Pending". */
  /* Manage Global (fin_global_resources) row "IsRelationOfMandatory" = 1 makes the Relation Of
     block under Other Details compulsory - at least one relation has to be added with "+". */
  const isRelationOfMandatory =
    globalResourcesList?.find(
      (item) => item?.Name === "IsRelationOfMandatory",
    )?.Value === "1";

  const showLandmark =
    globalResourcesList?.find(
      (item) => item?.Name === "ShowLandmark",
    )?.Value === "1";

  const showAlternateNumber =
    globalResourcesList?.find(
      (item) => item?.Name === "ShowAlternateNumber",
    )?.Value === "1";

  const showMaritalStatus =
    globalResourcesList?.find(
      (item) => item?.Name === "ShowMaritalStatus",
    )?.Value === "1";

  const showVisitWisePanelDocument =
    globalResourcesList?.find(
      (item) => item?.Name === "ShowVisitWisePanelDocument",
    )?.Value === "1";

  /* The popup has nowhere to put its scans until the patient and the panels are saved, so
     they are posted once the save has gone through. TransactionID comes from the screen
     that opened the popup - OPD Booking has none yet at this point, and the API then files
     the documents under the patient's most recent visit. */
  /* fin_global_resources -> PatientDocumentAsPanelDocument = 1: the "Upload Patient Document"
     popup (Personal Details) is stored exactly like the Panel Document popup - in
     f_paneldocument_patient through SavePatientPanelDocument, against the visit and the
     patient's default panel - instead of patient_documentdetails. Off / no row: as before. */
  const patientDocumentAsPanelDocument =
    globalResourcesList?.find(
      (item) => item?.Name === "PatientDocumentAsPanelDocument",
    )?.Value === "1";

  // Default panel of the registration (the one the patient is billed under), else the first one.
  const defaultPanelID = () => {
    const row =
      panelBodyData?.find((item) => item?.isDefaultPanel === 1) ??
      panelBodyData?.[0];
    return Number(row?.PanelName?.value ?? row?.panelID ?? row?.PanelID) || 0;
  };

  // Upload Patient Document files, in the shape SavePatientPanelDocument takes.
  const patientDocumentsAsPanel = () => {
    if (!patientDocumentAsPanelDocument) return [];
    const panelID = defaultPanelID();
    if (!panelID) return [];
    const list = [];
    values?.documentsList?.forEach((doc) => {
      if (!doc?.image) return; // only files picked now; already-saved ones are not re-sent
      const expiry = doc?.clearenceForm ? moment(doc.clearenceForm) : null;
      const images =
        Array.isArray(doc?.files) && doc.files.length > 0
          ? doc.files.map((f) => f?.image).filter(Boolean)
          : [doc?.image];
      images.forEach((image) =>
        list.push({
          panelID,
          documentID: Number(doc?.DocumentID) || 0,
          documentName: doc?.Document ?? "",
          documentBase64: image,
          expiryDate:
            expiry && expiry.isValid() && expiry.year() > 1900
              ? expiry.format("YYYY-MM-DD")
              : "",
        }),
      );
    });
    return list;
  };

  // With the key on, the registration payload no longer carries these files to patient_documentdetails.
  const applyPatientDocumentRoute = (saveData) => {
    if (patientDocumentAsPanelDocument && saveData) saveData.patDocument = [];
    return saveData;
  };

  const SavePanelDocumentsAPI = async (patientID) => {
    if (!patientID) return;

    const panelDocuments = showVisitWisePanelDocument ? [] : null;
    if (panelDocuments === null) {
      // Panel Document popup off: only the Upload Patient Document files (when routed here)
      const onlyPatientDocs = patientDocumentsAsPanel();
      if (onlyPatientDocs.length === 0) return;
      try {
        const apiResp = await SavePatientPanelDocument({
          transactionID: props?.TransactionID ? String(props?.TransactionID) : "",
          patientID: String(patientID),
          panelDocuments: onlyPatientDocs,
        });
        if (!apiResp?.success) notify(apiResp?.message, "error");
      } catch (error) {
        console.error(error);
      }
      return;
    }
    panelDocuments.push(...patientDocumentsAsPanel());
    panelDocumentData?.forEach((row) => {
      row?.panelDocumentViewList?.forEach((doc) => {
        if (doc?.image && row?.panelID) {
          // Expiry date picked in the popup (documents with a calendar).
          const expiry = doc?.clearenceForm ? moment(doc.clearenceForm) : null;
          // 27-10-2026: every file of the document (several pages / files per document type)
          const images =
            Array.isArray(doc?.files) && doc.files.length > 0
              ? doc.files.map((f) => f?.image).filter(Boolean)
              : [doc?.image];
          images.forEach((image) =>
            panelDocuments.push({
              panelID: Number(row?.panelID) || 0,
              documentID: Number(doc?.DocumentID) || 0,
              documentName: doc?.Document ?? "",
              documentBase64: image,
              expiryDate:
                expiry && expiry.isValid() && expiry.year() > 1900
                  ? expiry.format("YYYY-MM-DD")
                  : "",
            }),
          );
        }
      });
    });
    if (panelDocuments.length === 0) return;

    try {
      const apiResp = await SavePatientPanelDocument({
        transactionID: props?.TransactionID ? String(props?.TransactionID) : "",
        patientID: String(patientID),
        panelDocuments,
      });
      // The panels themselves are already saved at this point, so a document failure is
      // reported without pretending the whole save failed.
      if (!apiResp?.success) notify(apiResp?.message, "error");
    } catch (error) {
      console.error(error);
    }
  };

  const ValidateDuplicatePatient = async (value) => {
    try {
      if (babyTitle === "B/O.") {
        await SaveRegistrationAPI();
        return;
      }
      const data = await ValidateDuplicatePatientEntry(value, documentIds);
      if (data?.success && !isUpdate) {
        setIsDuplicateModel(true);
        return false;
      }
      if (isUpdate) {
        if (values?.updateReasonRemarks) {
          await UpdatePatientDetailAPI();
        } else {
          notify("Update Reason Remarks is required", "error");
          const inputElement = document.getElementById("Update");
          if (inputElement) {
            inputElement.focus();
          }
        }
      } else {
        await SaveRegistrationAPI();
      }
    } catch (error) {
      // These were fired without await, so anything they threw became an
      // unhandled rejection and the click looked like it did nothing.
      console.error(error);
      notify(error?.message || "Could not save the registration", "error");
    }
  };
  const SaveRegistrationAPI = async () => {
    // if (panelBodyData?.length === 0) {
    //   notify("Please select at least one panel", "error");
    //   return;
    // }
    if (!panelBodyData?.find((item) => item.isDefaultPanel === 1)) {
      notify("Please select at least one default panel", "error");
      return;
    }

    setIsDuplicateModel(false);

    try {
      const saveData = Register_Patient_TypeCasting(
        relations,
        values,
        panelBodyData,
        "",
        panelDocumentData,
        babyTitle,
      );
      // Caller-supplied source (e.g. "EMERGENCY") - Insert_patient uses it to pick the
      // UHID format (EMR/26-27/01 for emergency).
      if (props?.source) saveData.patientMaster.source = props.source;
      applyPatientDocumentRoute(saveData);

      let apiResp = await PatientRegistrationAPI(saveData);
      if (apiResp?.success) {
        // apiResp.data is the freshly generated UHID - the panel scans have no patient
        // to hang off until this point.
        await SavePanelDocumentsAPI(apiResp?.data);
        setDpdpUHID(apiResp?.data); // DPDP consent panel needs the new UHID
        setBabyTitle("");
        setDocumentIds([]);
        notify(apiResp?.message, "success");
        if (props?.getRegPatientID)
          props?.getRegPatientID(
            apiResp?.data,
            props?.registrationConfirmData?.App_ID,
          );
        if (props?.bindDetail) {
          props?.setVisible(false);
          props?.bindDetailAPI({ MRNo: apiResp?.data });
        } else {
          // setValues({ UHID: apiResp?.data })
          let countryCode = filterByTypes(
            CentreWiseCache,
            [7, BindResource?.BaseCurrencyID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
            "STD_CODE",
          );
          let defaultState = filterByTypes(
            CentreWiseCache,
            [8, BindResource?.DefaultStateID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
          );
          let defaultDistrict = filterByTypes(
            CentreWiseCache,
            [9, BindResource?.DefaultDistrictID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
          );
          let defaultCity = filterByTypes(
            CentreWiseCache,
            [10, BindResource?.DefaultCityID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
          );
          setValues({
            countryID: BindResource?.BaseCurrencyID,
            Country: BindResource?.DefaultCountry,
            StateID: parseInt(BindResource?.DefaultStateID),
            districtID: parseInt(BindResource?.DefaultDistrictID),
            cityID: parseInt(BindResource?.DefaultCityID),
            IsInternational: "2",
            ResidentialNumber_STDCODE: countryCode?.length
              ? countryCode[0]?.extraColomn
              : "+91",
            AgeType: "YRS",
            Religion: "Hinduism",
            Relation: "Self",
            District: defaultDistrict?.length > 0 && defaultDistrict[0]?.label,
            State: defaultState?.length > 0 && defaultState[0]?.label,
            City: defaultCity?.length > 0 && defaultCity[0]?.label,
            Phone_STDCODE: countryCode?.length
              ? countryCode[0]?.extraColomn
              : "+91",
            UHID: apiResp?.data,
          });
          setIsAfterSaveModel(true);
          setHasJustSaved(true);
        }
        setPanelBodyData([]);
        setRelations([]);
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const UpdatePatientDetailAPI = async () => {
    setIsDuplicateModel(false);
    const saveData = Register_Patient_TypeCasting(
      relations,
      values,
      panelBodyData,
      // panelBodyData?.filter((item) => item.PanelGroup?.value !== 1),
      isUpdate,
      panelDocumentData,
      babyTitle,
    );
    applyPatientDocumentRoute(saveData);

    try {
      let apiResp = await PatientUpdateRegistrationAPI(saveData);
      if (apiResp?.success) {
        // Posted before the popup closes, while panelDocumentData is still in hand.
        await SavePanelDocumentsAPI(values?.Barcode);
        setIsUpdate(false);
        let message = "";
        props?.updateButtonName
          ? (message = t(`panelUpdate`))
          : (message = t(`demographicsUpdate`));
        notify(message, "success");
        props?.setVisible && props?.setVisible(false);

        if (props?.bindDetail) {
          await props?.bindDetailAPI({ MRNo: values?.Barcode });
          await props?.handleBindPanelByPatientID({ MRNo: values?.Barcode });
        } else {
          let countryCode = filterByTypes(
            CentreWiseCache,
            [7, BindResource?.BaseCurrencyID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
            "STD_CODE",
          );
          let defaultState = filterByTypes(
            CentreWiseCache,
            [8, BindResource?.DefaultStateID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
          );
          let defaultDistrict = filterByTypes(
            CentreWiseCache,
            [9, BindResource?.DefaultDistrictID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
          );
          let defaultCity = filterByTypes(
            CentreWiseCache,
            [10, BindResource?.DefaultCityID],
            ["TypeID", "ValueField"],
            "TextField",
            "ValueField",
          );
          setValues({
            countryID: BindResource?.BaseCurrencyID,
            Country: BindResource?.DefaultCountry,
            StateID: parseInt(BindResource?.DefaultStateID),
            districtID: parseInt(BindResource?.DefaultDistrictID),
            cityID: parseInt(BindResource?.DefaultCityID),
            IsInternational: "2",
            ResidentialNumber_STDCODE: countryCode?.length
              ? countryCode[0]?.extraColomn
              : "+91",
            AgeType: "YRS",
            Religion: "Hinduism",
            Relation: "Self",
            District: defaultDistrict?.length > 0 && defaultDistrict[0]?.label,
            State: defaultState?.length > 0 && defaultState[0]?.label,
            City: defaultCity?.length > 0 && defaultCity[0]?.label,
            Phone_STDCODE: countryCode?.length
              ? countryCode[0]?.extraColomn
              : "+91",

            // UHID: apiResp?.data
          });
          setPanelBodyData([]);
        }
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const {
    handleChange,
    values,
    setFieldValue,
    setValues,
    handleSubmit: handleFormSubmit,
    errors,
    touched,
    validateForm,
  } = useFormik({
    initialValues: PATIENT_DETAILS,
    validationSchema,
    onSubmit: (values, { resetForm }) => {
      ValidateDuplicatePatient(values);
    },
  });
  const validateDynamicMandatoryFields = () => {
    const fields = [
      ...(dynamicData?.personalDetails || []),
      ...(hideOtherDetails ? [] : dynamicData?.otherDetails || []),
    ];

    const isEmptyValue = (field, value) => {
      if (field.Type === "checkbox") {
        return !(Number(value) === 1 || value === true);
      }
      if (field.Type === "select") {
        if (value === undefined || value === null || value === "") return true;
        if (typeof value === "object") {
          return (
            value?.value === undefined ||
            value?.value === null ||
            value?.value === ""
          );
        }
        return false;
      }
      if (field.Type === "multiselect") {
        return !Array.isArray(value) || value.length === 0;
      }
      if (field.Type === "datepicker" || field.Type === "timepicker") {
        return value === undefined || value === null || value === "";
      }
      if (typeof value === "string") {
        return value.trim() === "";
      }
      return value === undefined || value === null;
    };
    for (const field of fields) {
      if (
        field?.IsActive !== 1 ||
        field?.IsMandatory !== 1 ||
        field?.IsDisabled === 1
      ) {
        continue;
      }

      if (
        (field.ControlName === "documentName" || field.ControlName === "ID_Proof_No") &&
        (documentIds?.length > 0 || (values?.aadhaarNumber && String(values.aadhaarNumber).trim().length === 12))
      ) {
        continue;
      }

      const value = values?.[field.ControlName];
      if (isEmptyValue(field, value)) {

        const label = t(field?.DisplayName || field?.ControlName || "Field");
        return `${label} ${t("is required")}`;
      }
    }

    return null;
  };

  /**
   * Validates fields that are not active or not mandatory
   * Alerts user if they're trying to submit with inactive/non-mandatory fields filled
   * @returns {boolean}
   */
  const validateInactiveOrNonMandatoryFields = () => {
    if (
      !inactiveOrNonMandatoryFields ||
      inactiveOrNonMandatoryFields.length === 0
    ) {
      return true;
    }

    const fieldsWithValues = inactiveOrNonMandatoryFields.filter((field) => {
      const value = values?.[field.ControlName];

      if (field.Type === "checkbox") {
        return Number(value) === 1 || value === true;
      }
      if (field.Type === "select" || field.Type === "multiselect") {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== undefined && value !== null && value !== "";
      }
      if (typeof value === "string") {
        return value.trim() !== "";
      }
      return value !== undefined && value !== null;
    });

    // if (fieldsWithValues.length > 0) {
    //   const fieldNames = [...new Set(
    //     fieldsWithValues.map((f) => t(f?.DisplayName || f?.ControlName || "Field"))
    //   )].join(", ");

    //   const warningMessage = `The following field(s) are not configured as required but have values: ${fieldNames}. Please remove these values or update the field configuration before saving.`;
    //   notify(warningMessage, "error");
    //   return false;
    // }

    return true;
  };

  /* The body of the save. Every early return in here is deliberate and says why
     it stopped, so that a click can never look like it did nothing. Exceptions are
     caught by handleSubmit below for the same reason. */
  const runSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (babyTitle === "B/O.") {
      if (!panelBodyData?.find((item) => item.isDefaultPanel === 1)) {
        notify("Please select at least one default panel", "error");
        return;
      }

      setIsSubmitting(true);
      try {
        await SaveRegistrationAPI();
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (values?.Barcode) {
      try {
        const response = await getCheckMotherBabyApi(values?.Barcode);
        if (response?.success) {
          if (response?.data) {
            setIsUpdate(false);
            setMotherBabyMoldal(response?.data);
          } else {
            notify(
              response?.message || "Could not verify this barcode",
              "error",
            );
            return;
          }
        } else {
          setBabyTitle("");
        }
      } catch (error) {
        notify(error?.message, "error");
      }
    }
    if (values?.Phone && values?.Mobile && values?.Phone === values?.Mobile) {
      notify("Please provide an additional alternate mobile number.", "warn");
      return;
    }

    const isInternational = values?.IsInternational?.value === "Yes" || values?.IsInternational === "Yes" || values?.IsInternational === 1 || values?.IsInternational === "1";
    if (!isUpdate && !props?.updateButtonName && !isInternational) {
      if (values?.aadhaarNumber && String(values.aadhaarNumber).trim().length === 12) {
        const hasAadhaarInList = documentIds?.some((doc) => {
          const label = String(doc?.name?.label || doc?.name || "").toLowerCase().trim();
          return label.includes("aadhaar") || label.includes("adhar") || label.includes("uid");
        });

        if (!hasAadhaarInList) {
          const idProofOptions = filterByType(CentreWiseCache, 13, "TypeID", "TextField", "ValueField") || [];
          let aadhaarProofOption = idProofOptions.find((option) => {
            const label = String(option?.label || option?.TextField || "").toLowerCase().trim();
            return label.includes("aadhaar") || label.includes("adhar");
          });
          if (!aadhaarProofOption) {
            aadhaarProofOption = { label: "AADHAAR CARD", value: "3#12" };
          }
          const newDoc = {
            name: aadhaarProofOption,
            id: String(values.aadhaarNumber),
          };

          documentIds.push(newDoc);
          values.documentIds = [...(values.documentIds || []), newDoc];

          setDocumentIds([...documentIds]);
          setFieldValue("documentIds", values.documentIds);
        }
      }

    }

    let { name } = e.target;

    if (
      name === "ID_Proof_No" ||
      name === "PFirstName" ||
      name === "Mobile" ||
      name === "Barcode" ||
      name === "Phone"
    ) {
      return 0;
    }

    // if(!values?.DOB){
    //   notify("DOB is required", "error");
    //   return
    // }
    // if (values?.DOB) {
    //

    //   const dob = moment(values.DOB, "MM-DD-YYYY");
    //   const today = moment();

    //   const age = today.diff(dob, "years"); // age in years

    /* if (Number(values?.Age) >= 18) {
      if (!values?.National_ID) {
        notify("National ID is required for age 18 or above.", "error");
        return;
      }
    } */
    // }

    const errors = await validateForm();
    const firstError = Object.values(errors).find(Boolean);

    if (typeof firstError === "string") {
      notify(firstError, "error");
      const inputElement = document.getElementById(firstError.split(" ")[0]);

      if (inputElement) {
        inputElement.focus();
      }
      return;
    }

    if (Object.keys(errors).length > 0) {
      // Yup answered with something that is not a plain message — a nested or
      // empty entry. Neither branch used to report it, so the save just stopped.
      console.error("Registration validation errors", errors);
      notify("Please correct the highlighted fields", "error");
      return;
    }

    const dynamicValidationMessage = validateDynamicMandatoryFields();
    if (dynamicValidationMessage) {
      notify(dynamicValidationMessage, "error");
      return;
    }

    if (
      isRelationOfMandatory &&
      !values?.PendingRelation?.Relation &&
      !relations?.some((rel) => rel?.Relation)
    ) {
      notify(`${t("Relation Of")} ${t("is required")}`, "error");
      return;
    }

    // Validate inactive or non-mandatory fields
    const inactiveFieldsValid = validateInactiveOrNonMandatoryFields();
    if (!inactiveFieldsValid) {
      return;
    }

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true); // Set loading state
      try {
        await handleFormSubmit();
      } finally {
        setIsSubmitting(false); // Reset loading state
      }
    }
  };

  /* An exception anywhere in runSubmit used to reject an async click handler,
     which React only writes to the console — on screen the Save button simply did
     nothing. Surface it instead, and keep the full error for the console. */
  const handleSubmit = async (e) => {
    try {
      await runSubmit(e);
    } catch (error) {
      console.error("Patient registration save failed", error);
      notify(
        error?.message || "Could not save the registration",
        "error",
      );
    }
  };

  const [propData, setPropData] = useState(props.data);

  const handleReactSelect = (name, value) => {
    if (name === "documentName") {
      setFieldValue("ID_Proof_No", "");
    }
    // if(name==="countryID" || name==="StateID" || name || "districtID"){
    //   setFieldValue(name, value?.value);
    //   return;
    // }
    setFieldValue(name, value);
  };

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

      setValues((val) => ({
        ...val,
        District: values?.districtID
          ? values?.districtID?.label
          : defaultDistrict?.length > 0 && defaultDistrict[0]?.label,
        State: values?.StateID
          ? values?.StateID?.label
          : defaultState?.length > 0 && defaultState[0]?.label,
        City: values?.cityID
          ? values?.cityID?.label
          : defaultCity?.length > 0 && defaultCity[0]?.label,
        Phone_STDCODE: values?.Phone_STDCODE
          ? values?.Phone_STDCODE
          : countryCode?.length
            ? countryCode[0]?.extraColomn
            : "+91",
      }));
    }
  };

  const qrRef = useRef(null);
  const downloadPreRegQR = () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = "PreRegistration-QR.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  };

  // Pre Registration list: picking a pre-registered patient fills this form.
  const openPreRegistration = () => {
    setModalHandlerState({
      show: true,
      component: (
        <PreRegistration
          setValues={setValues}
          values={values}
          setModalHandlerState={setModalHandlerState}
          setRelations={setRelations}
          relations={relations}
          setCheckbox={setCheckbox}
          setDocumentIds={setDocumentIds}
          CentreWiseCache={CentreWiseCache}
        />
      ),
      footer: <> </>,
      size: "85vw",
      header: "Pre Registration",
    });
  };
  // OPD Booking's "Pre Registration" button opens this form with the list already open.
  useEffect(() => {
    if (props?.openPreRegistration) openPreRegistration();
    // Pre-fetch master page booking buttons so Skip Booking navigation is instant
    getMasterPageBookingApi().then((res) => {
      if (res?.success && res?.data?.length > 0) setRedirectBtn(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (CentreWiseCache?.length === 0) {
      CentreWiseCacheByCenterIDAPI();
    }
    dispatch(
      CentreWisePanelControlCache({ centreID: localdata?.defaultCentre }),
    );
    // if (PageConfigurationAPIList?.length === 0) {
    // dispatch(PageConfigurationAPIDetails(2));
    // }
  }, [dispatch]);

  useEffect(() => {
    const otherDetails = PageConfigurationAPIList?.filter(
      (val) =>
        val?.AccordionName === "Other Details" &&
        val?.IsActive === 1 &&
        val?.URLID === 2,
    );
    const personalDetails = PageConfigurationAPIList?.filter(
      (val) =>
        val?.AccordionName === "Personal Details" &&
        val?.IsActive === 1 &&
        val?.URLID === 2,
    )?.map((field) => {
      if (field.ControlName === "MaritalStatus" && !showMaritalStatus) {
        return { ...field, IsMandatory: 1 };
      }
      // Police Station: force dropdown (TypeID=32) so saved entries appear in the list
      if (field.ControlName === "PoliceStationID" || field.ControlName === "PoliceStation") {
        return { ...field, ControlName: "PoliceStationID", Type: "select", CommonAPITypeID: 32, IsAddEnable: 1 };
      }
      return field;
    });
    setDynamicData((val) => ({
      ...val,
      otherDetails: otherDetails,
      personalDetails: personalDetails,
    }));
  }, [PageConfigurationAPIList?.length, showMaritalStatus, hideOtherDetails]);

  // Generate validation schema dynamically based on API configuration
  useEffect(() => {
    if (PageConfigurationAPIList && PageConfigurationAPIList.length > 0) {
      try {
        const patientRegFields = PageConfigurationAPIList.filter(
          (field) => field.URLID === 2 && !(hideOtherDetails && field.AccordionName === "Other Details"),
        );
        const generatedSchema = generateValidationSchema(patientRegFields, documentIds);
        const inactiveFields = patientRegFields.filter(
          (field) => field.IsActive === 0 || field.IsMandatory === 0,
        );

        setValidationSchema(generatedSchema);
        setInactiveOrNonMandatoryFields(inactiveFields);
      } catch (error) {
        console.error("Error generating validation schema:", error);
        setValidationSchema(defaultValidationSchema);
      }
    }
  }, [PageConfigurationAPIList, documentIds, showLandmark, showAlternateNumber, showMaritalStatus, hideOtherDetails]);

  const handleOldPatientSearch = async (e) => {
    if ([13].includes(e.which)) {
      try {
        const data = await Oldpatientsearch(
          e.target.value,
          DIRECT_PATIENT_SEARCH_TYPE[e.target.name],
        );

        // handleGetPatientDocument()

        setIsRegistrationUpdate(
          data?.data[0]?.isUpdateRegistration == 1 ? false : true,
        );
        if (data?.data?.length > 0) {
          // Even a single match is only listed - the patient is bound when the
          // user picks the row (click / Enter on the list), never automatically.
          setGetOldPatientData(data?.data);
        } else {
          notify("Record Not Found", "error");
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    if (values?.Mobile?.length === 10) {
      const autoSearch = async () => {
        try {
          const data = await Oldpatientsearch(
            values.Mobile,
            DIRECT_PATIENT_SEARCH_TYPE["Mobile"] || 2
          );

          setIsRegistrationUpdate(
            data?.data[0]?.isUpdateRegistration == 1 ? false : true,
          );
          if (data?.data?.length > 0) {
            setGetOldPatientData(data?.data);
          }
        } catch (error) {
          console.log(error);
        }
      };
      autoSearch();
    }
  }, [values?.Mobile]);

  const handleClickEasyUI = (value) => {
    handleSinglePatientData(value);
    setIsUpdate(true);
  };
  const handleSinglePatientData = async (patientDetails) => {
    const { MRNo, PatientRegStatus } = patientDetails;
    
    try {
      const data = await PatientSearchbyBarcode(MRNo, PatientRegStatus);
      if (data?.data) {
        data.data["TrusteeID"] = data?.data?.TrusteeId || data?.data?.TrusteeID || "";
        setPatientDetail((val) => ({ ...val, singlePatientData: data?.data }));
        setRelations(
          data?.data?.PatientRelationData
            ? data?.data?.PatientRelationData?.map((ele) => ({
              isPersonal: ele?.IsPersonal == 1 ? true : false,
              RelationName: ele?.RelationName,
              Relation: ele?.RelationOf,
              RelationPhone: ele?.RelationPhoneNo,
            }))
            : [],
        );
        if (data?.data?.Age) {
          data.data["AgeType"] = data?.data?.Age
            ? data?.data?.Age?.split(" ")[1]
            : "";
          data.data["Age"] = data?.data?.Age
            ? data?.data?.Age?.split(" ")[0]
            : values?.Age;
          data.data["HospPatientType"] = data?.data?.PatientTypeID;
          data.data["Barcode"] = data?.data?.PatientID;
          data.data["IsInternational"] =
            data.data["IsInternational"] === 1 ? "Yes" : "No";
          // data.data["Is_Permanent_Address"] === 1 ? true : false;
          // data.data["source"] = "OPD";
        }
        
        let respdata = data?.data;
        // if (respdata?.parmanentAddress) {
        //   setValues((prev) => ({
        //     ...prev,
        //     Permanent_Address: respdata?.parmanentAddress,
        //   }));
        // }
        respdata["documentIds"] = [];
        if (data?.data?.patientIDProofs?.length > 0) {
          const formattedStringIDS = data?.data?.patientIDProofs
            ?.replace(/([a-zA-Z]+):/g, '"$1":')
            .replace(/:([^,}\]]+)/g, ':"$1"');
          const parsedData = JSON.parse(formattedStringIDS);
          let formatedIDs = [];

          if (parsedData?.length > 0) {
            parsedData?.map((val) => {
              let obj = {};
              obj.name = { label: val?.IDProofName, value: val?.IDProofID };
              obj.id = val?.IDProofNumber;
              formatedIDs.push(obj);
            });
            respdata.documentIds = formatedIDs;
          }
          setDocumentIds(formatedIDs);
        }

        respdata.profileImage = respdata?.PatienetPhoto;
        respdata.DOB
          ? (respdata.DOB = moment(respdata.DOB, "DD-MM-YYYY").format(
            "MM-DD-YYYY",
          ))
          : "0001-01-01";
        respdata.documentvalue = await handleGetPatientDocument(
          data?.data?.PatientID || MRNo,
          false,
        );
        respdata.UHID = data?.data?.PatientID || MRNo;
        const lmVal = respdata?.LandMark || respdata?.Landmark || respdata?.landMark || "";
        respdata.Landmark = lmVal;
        respdata.LandMark = lmVal;
        respdata.landMark = lmVal;
        setValues(respdata);
        let PanelPatientDetail = await bindPanelByPatientID(
          data?.data?.PatientID,
        );
        if (PanelPatientDetail?.success) {
          setPatientDetail((val) => ({
            ...val,
            PanelPatientDetail: PanelPatientDetail?.data?.map((val) => {
              val.PolicyExpiry
                ? moment(val.PolicyExpiry).format("DD-MM-YYYY")
                : "0001-01-01";
              return val;
              // val.PolicyExpiry
              //   ? (val.PolicyExpiry = moment(
              //     val.PolicyExpiry,
              //     "DD-MMM-YYYY"
              //   ).format("DD-MM-YYYY"))
              //   : "0001-01-01";
              // return val;
            }),
          }));
        }
        setGetOldPatientData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGetPatientDocument = async (
    patientID,
    shouldUpdateValues = true,
  ) => {
    try {
      const response = await GetPatientDocument(patientID);
      if (response?.success) {
        const documentvalue = response?.data || [];
        if (shouldUpdateValues) {
          setValues((val) => ({ ...val, documentvalue }));
        }
        return documentvalue;
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
    }
    return [];
  };
  const handleMasterPageBooking = async () => {
    try {
      const response = await getMasterPageBookingApi();
      if (response.success) {
        setRedirectBtn(response.data);
        setIsConfirmation(false);
        setIsRedirect(true);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }

    if (e.key === "Enter") {
      if (selectedIndex !== null && getOldPatientData[selectedIndex]) {
        handleSinglePatientData(getOldPatientData[selectedIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex =
          prevIndex === null
            ? 0
            : Math.min(prevIndex + 1, getOldPatientData.length - 1);
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex =
          prevIndex === null
            ? getOldPatientData.length - 1
            : Math.max(prevIndex - 1, 0);
        return newIndex;
      });
    }
  };

  useEffect(() => {
    if (props?.PatientID) {
      const data = handleSinglePatientData({
        MRNo: props?.PatientID,
        PatientRegStatus: 1,
      });
      setGetOldPatientData(data?.data);
      setIsUpdate(true);
    } else if (props?.registrationConfirmData) {
      let obj = { ...props?.registrationConfirmData };
      obj.Age = obj?.Age?.split(" ")[0];
      obj.TrusteeID = obj?.TrusteeID || obj?.TrusteeId || "";
      setValues(obj);
    } else {
      let countryCode = filterByTypes(
        CentreWiseCache,
        [7, BindResource?.BaseCurrencyID],
        ["TypeID", "ValueField"],
        "TextField",
        "ValueField",
        "STD_CODE",
      );

      setValues((val) => ({
        ...val,
        countryID: BindResource?.BaseCurrencyID,
        Country: BindResource?.DefaultCountry,
        StateID: parseInt(BindResource?.DefaultStateID),
        districtID: parseInt(BindResource?.DefaultDistrictID),
        cityID: parseInt(BindResource?.DefaultCityID),
        // cityID: 0,
        IsInternational: "2",
        ResidentialNumber_STDCODE: countryCode?.length
          ? countryCode[0]?.extraColomn
          : "+91",
        AgeType: "YRS",
        Religion: "Hinduism",
        Relation: "Self",
        // District: defaultDistrict || "",
        // State: defaultState || "",
        // City: defaultCity || "",
      }));
    }
    handletab(formRef);

    // CentreWiseCache?.length    dependecy array value
  }, []);

  useEffect(() => {
    if (!CentreWiseCache?.length) return;
    if (props?.PatientID) {
      const data = handleSinglePatientData({
        MRNo: props?.PatientID,
        PatientRegStatus: 1,
      });
      setGetOldPatientData(data?.data);
      setIsUpdate(true);
    } else if (props?.registrationConfirmData) {
      let obj = { ...props?.registrationConfirmData };
      obj.Age = obj?.Age?.split(" ")[0];
      obj.TrusteeID = obj?.TrusteeID || obj?.TrusteeId || "";
      setValues(obj);
    } else {
      let countryCode = filterByTypes(
        CentreWiseCache,
        [7, BindResource?.BaseCurrencyID],
        ["TypeID", "ValueField"],
        "TextField",
        "ValueField",
        "STD_CODE",
      );

      // Get filtered state list
      const stateList = filterByTypes(
        CentreWiseCache,
        [
          8,
          values?.countryID?.value
            ? parseInt(values.countryID.value)
            : values.countryID,
        ],
        ["TypeID", "CountryID"],
        "TextField",
        "ValueField",
      );

      const defaultState =
        stateList.length > 0
          ? stateList.find(
            (item) => item.value === BindResource?.DefaultStateID,
          )?.label
          : "";

      // Get filtered district list
      const districtList = filterByTypes(
        CentreWiseCache,
        [
          9,
          values?.countryID?.value ? values.countryID.value : values.countryID,
          values?.StateID?.value
            ? parseInt(values.StateID.value)
            : values.StateID,
        ],
        ["TypeID", "CountryID", "StateID"],
        "TextField",
        "ValueField",
      );

      const defaultDistrict =
        districtList.length > 0
          ? districtList.find(
            (item) => item.value === BindResource?.DefaultDistrictID,
          )?.label
          : "";

      // Get filtered city list
      const cityList = filterByTypes(
        CentreWiseCache,
        [
          10,
          values?.StateID?.value
            ? parseInt(values.StateID.value)
            : values.StateID,
          values?.districtID?.value
            ? parseInt(values.districtID.value)
            : values.districtID,
        ],
        ["TypeID", "StateID", "DistrictID"],
        "TextField",
        "ValueField",
      );

      const defaultCity =
        cityList.length > 0
          ? cityList.find((item) => item.value === BindResource?.DefaultCityID)
            ?.label
          : "";
      setValues((val) => ({
        ...val,
        countryID: BindResource?.BaseCurrencyID,
        Country: BindResource?.DefaultCountry,
        StateID: parseInt(BindResource?.DefaultStateID),
        districtID: parseInt(BindResource?.DefaultDistrictID),
        cityID: parseInt(BindResource?.DefaultCityID),
        IsInternational: "2",
        ResidentialNumber_STDCODE: countryCode?.length
          ? countryCode[0]?.extraColomn
          : "+91",
        AgeType: "YRS",
        Religion: "Hinduism",
        Relation: "Self",
        District: defaultDistrict || BindResource?.DefaultDistrict,
        State: defaultState || BindResource?.DefaultState,
        City: defaultCity || BindResource?.DefaultCity,
      }));
    }
    //
    handletab(formRef);

    // CentreWiseCache?.length    dependecy array value
  }, [BindResource]);

  useEffect(() => {
    if (patientDetails?.PanelPatientDetail?.length > 0) {
      let panelDetailTableData = [];

      patientDetails?.PanelPatientDetail?.map((obj) => {
        if (obj?.PanelName !== "") {
          // if (obj?.PanelName !== "CASH") {
          let panelItem = {};
          panelItem["PanelGroup"] = bindLabelValue(
            obj?.PanelGroup,
            obj?.PanelGroupID,
          );
          panelItem["PanelName"] = bindLabelValue(obj?.PanelName, obj?.PanelID);
          panelItem["ParentPanel"] = bindLabelValue(
            obj?.ParentPanel,
            obj?.ParentPanelID,
          );
          panelItem["CorporareName"] = bindLabelValue(
            obj?.CorporareName,
            obj?.PanelCroporateID,
          );
          panelItem["PolicyNo"] = obj?.PolicyNo;
          panelItem["PolicyCardNo"] = obj?.PolicyCardNo;
          panelItem["PanelCardName"] = obj?.PanelCardName;
          panelItem["PolicyExpiry"] = obj?.PolicyExpiry;
          panelItem["isDefaultPanel"] = obj?.isDefaultPanel;
          panelItem["CardHolder"] = bindLabelValue(
            obj?.CardHolder,
            obj?.CardHolder,
          );
          panelItem["ApprovalAmount"] = obj?.ApprovalAmount;
          panelItem["ApprovalRemarks"] = obj?.ApprovalRemarks;
          panelItem["SchemeMode"] = obj?.SchemeMode;
          panelDetailTableData.push(panelItem);
        }
      });

      setPanelBodyData(panelDetailTableData);
    }
  }, [patientDetails?.PanelPatientDetail]);

  const handleDateKeyDown = (event) => {
    if (event.key === "Enter") {
      alert("Enter key pressed");
    }
  };

  const handleCancelComment = () => {
    setIsConfirmation(false);
    setIsRedirect(false);
  };

  // This ensures confirmation modal opens ONLY when UHID modal is closed
  // If skipBooking is ON → skip Confirmation + OPD/IPD modal, go directly to OPD Booking
  useEffect(() => {
    if (!isAfterSaveModel && values?.UHID && !props?.bindDetail && hasJustSaved) {
      setHasJustSaved(false);
      if (skipBooking) {
        setIsConfirmation(false);
        setIsRedirect(false);
        // Use pre-fetched buttons — no API call, instant navigation
        if (isRedirectBtn?.length > 0) {
          const opdBtn = isRedirectBtn.find((btn) =>
            btn?.ButtonDisplayName?.toLowerCase().includes("opd")
          ) || isRedirectBtn[0];
          navigate(`/${opdBtn?.PageName}`, { state: { uhid: values?.UHID } });
        }
      } else {
        setIsConfirmation(true);
      }
    }
  }, [isAfterSaveModel, values?.UHID, props?.bindDetail, hasJustSaved, skipBooking]);

  // useEffect(()=>{
  //   handleGetPatientDocument()
  // },[])

  // const handleKeyDown = (e) => {
  // if (e.key === "Enter") {
  //   if (selectedIndex !== null && getOldPatientData[selectedIndex]) {
  //     onClick(getOldPatientData[selectedIndex]);
  //   }
  // } else if (e.key === "ArrowDown") {
  //   e.preventDefault();
  //   setSelectedIndex((prevIndex) => {
  //     const newIndex =
  //       prevIndex === null
  //         ? 0
  //         : Math.min(prevIndex + 1, getOldPatientData.length - 1);
  //     return newIndex;
  //   });
  // } else if (e.key === "ArrowUp") {
  //   e.preventDefault();
  //   setSelectedIndex((prevIndex) => {
  //     const newIndex =
  //       prevIndex === null
  //         ? getOldPatientData.length - 1
  //         : Math.max(prevIndex - 1, 0);
  //     return newIndex;
  //   });
  // }
  // };

  return (
    <>
      <AadhaarMissingAlert />
      <MLCMissingAlert />
      <form
        className="patient_registration position-relative pt-2"
        // onSubmit={handleSubmit}
        ref={formRef}
      >
        {props?.type !== "panelDetail" && (
          <>
            {/* {!props?.bindDetail && <Heading isBreadcrumb={true} />} */}
            {!props?.bindDetail && (
              <Heading
                isBreadcrumb={true}
                secondTitle={
                  <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => navigate("/emergency-admission")}
                    >
                      <i className="fa fa-ambulance mr-1" aria-hidden="true" />
                      {t("Emergency")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={openPreRegistration}
                    >
                      {t("Pre Registration")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => setIsBulkRegModal(true)}
                    >
                      <i className="fa fa-upload me-1" />
                      {t("Bulk Register")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={downloadPreRegQR}
                      disabled={!preRegQrUrl}
                      title={preRegQrUrl ? `QR: ${preRegQrUrl}/pre-registration` : "PRE_REG_QR_URL Global Resource mein set karo"}
                    >
                      <i className="fas fa-qrcode me-1"></i>{t("Download QR")}
                    </button>
                    <div ref={qrRef} style={{ position: "fixed", top: "-9999px", left: "-9999px" }}>
                      {preRegQrUrl && (
                        <QRCode
                          value={`${preRegQrUrl}/pre-registration`}
                          size={256}
                        />
                      )}
                    </div>
                  </div>
                }
              />
            )}
            {/* <Accordion
              // title={t("FrontOffice.OPD.Personal_Details")}
              title={t("Personal_Details")}
              // isBreadcrumb={true}
              defaultValue={true}
              secondTitle={ <AadhaarOcrFab onClick={() => setIsExtractAdharOpen(true)} />}
            > */}
            <PersonalDetails
              CentreWiseCache={CentreWiseCache}
              setIsExtractAdharOpen={setIsExtractAdharOpen}
              isExtractAdharOpen={isExtractAdharOpen}
              handleChange={handleChange}
              values={values}
              setValues={setValues}
              handleReactSelect={handleReactSelect}
              documentIds={documentIds}
              setDocumentIds={setDocumentIds}
              // propData={propData}
              isDisableInputs={isUpdateRegistration}
              isUpdate={isUpdate}
              handleOldPatientSearch={handleOldPatientSearch}
              errors={errors}
              touched={touched}
              handleKeyDown={handleKeyDown}
              handleDateKeyDown={handleDateKeyDown}
              dynamicData={dynamicData}
              setDynamicData={setDynamicData}
              babyTitle={babyTitle}
              setBabyTitle={setBabyTitle}
              dpdpSlot={
                <DpdpConsentPanel
                  popup
                  compact
                  values={values}
                  relations={relations}
                  uhid={values?.Barcode || dpdpUHID || props?.PatientID || ""}
                  source={props?.source}
                />
              }
            />
            {/* </Accordion> */}

            {/* HideRegistrationOtherDetails = 1: the block starts closed and opens on a click of its heading */}
            <Accordion key={hideOtherDetails ? "od-closed" : "od-open"} title={t("Other Details")} defaultValue={!hideOtherDetails}>
              <OtherDetails
                CentreWiseCache={CentreWiseCache}
                handleChange={handleChange}
                values={values}
                setDynamicData={setDynamicData}
                dynamicData={dynamicData}
                setValues={setValues}
                handleReactSelect={handleReactSelect}
                propData={propData}
                relations={relations}
                isDisableInputs={isUpdateRegistration}
                setRelations={setRelations}
                isRelationOfMandatory={isRelationOfMandatory}
                handleOldPatientSearch={handleOldPatientSearch}
                handleKeyDown={handleKeyDown}
              />
            </Accordion>
          </>
        )}

        {(!props?.PatientID || props?.type === "panelDetail") && (
          <Accordion title={t("PanelDetails")} defaultValue={true}>
            <PanelDetails
              handleChangePanelDetail={handleChange}
              values={values}
              setFieldValue={setFieldValue}
              setValues={setValues}
              handleReactSelect={handleReactSelect}
              CentreWisePanelControlCacheList={CentreWisePanelControlCacheList}
              PanelPatientDetailList={patientDetails?.PanelPatientDetail}
              panelBodyData={panelBodyData}
              setPanelBodyData={setPanelBodyData}
              setPanelDocumentData={setPanelDocumentData}
              panelDocumentData={panelDocumentData}
            />
          </Accordion>
        )}
        <div className="d-flex">
          <div className="mt-2 w-100 pr-2">
            {isUpdate && (
              <Input
                type="text"
                // className="form-control "
                className={`form-control required-fields`}
                id="Update"
                name="updateReasonRemarks"
                value={
                  values?.updateReasonRemarks ? values?.updateReasonRemarks : ""
                }
                lable={t("Update Reason Remarks")}
                placeholder=" "
                // removeFormGroupClass={true}
                respclass=""
                onKeyDown={(e) => {
                  handleKeyDown(e);
                }}
                onChange={handleChange}
              // inputRef={inputRef}
              />
            )}
          </div>
          <div
            className="mt-2  text-right"
          // className=" formsec1 modify_register_save text-right p-2"
          // style={{ textAlign: "end", float: "right" }}
          >
            {!isUpdate && !props?.updateButtonName && (
              <label
                htmlFor="skipBookingChk"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginRight: "10px",
                  marginBottom: 0,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "#198754",
                  background: "#f0faf4",
                  border: "1px solid #b7e4c7",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  id="skipBookingChk"
                  checked={skipBooking}
                  onChange={(e) => setSkipBooking(e.target.checked)}
                  style={{ cursor: "pointer", accentColor: "#198754", width: "15px", height: "15px" }}
                />
                {t("Registration fee")}
              </label>
            )}
            {babyTitle === "B/O." ? (
              <button
                className="btn btn-success btn-sm "
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("Saving...") : t("Save")}
              </button>
            ) : isUpdate || props?.updateButtonName ? (
              <button
                className="btn btn-success btn-sm "
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("Saving...")
                  : t(props?.updateButtonName || "Update")}
              </button>
            ) : (
              <button
                className="btn btn-success btn-sm btn-block w-100"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("Saving...") : t("Patient Registration")}
              </button>
            )}
          </div>
        </div>
        {getOldPatientData?.length > 0 && (
          <div className="panelDetailEasyUI">
            <EasyUI
              dataBind={getOldPatientData}
              dataColoum={BIND_TABLE_OLDPATIENTSEARCH_REG}
              onClick={handleClickEasyUI}
              setDataBind={setGetOldPatientData}
              selectedIndex={selectedIndex}
            />
          </div>
        )}
      </form>

      {isDuplicateModel && (
        <Modal
          visible={isDuplicateModel}
          setVisible={setIsDuplicateModel}
          modalWidth={"25vw"}
          Header={t("DuplicateEntry")}
          buttonType={"button"}
          modalData={{}}
          buttonName={t("Confirm")}
          setModalData={() => { }}
          handleAPI={SaveRegistrationAPI}
        >
          <DuplicatePatientAlertModel
          // handleChangeModel={()=>{}}
          // inputData={{}}
          />
        </Modal>
      )}

      {isAfterSaveModel && (
        <Modal
          visible={isAfterSaveModel}
          setVisible={setIsAfterSaveModel} // This will trigger the useEffect above when closed
          modalWidth={"25vw"}
          Header={t("PatientUHID")}
          buttonType={"button"}
          modalData={{}}
          setModalData={() => { }}
          handleAPI={() => { }}
          footer={<></>}
        >
          <h1 className="text-center PatientUHID">
            {t("UHID")} :{" "}
            <span className="text-red PatientUHID"> {values?.UHID} </span>{" "}
          </h1>
        </Modal>
      )}
      {isConfirmation && (
        <Modal
          visible={isConfirmation}
          setVisible={setIsConfirmation}
          modalWidth="30vw"
          Header={t("Confirmation !")}
          buttonType="button"
          modalData={false}
          handleAPI={handleMasterPageBooking}
          buttonName={t("Yes")}
          CancelbuttonName={t("NO")}
        >
          <div className="text-center">
            <h2 className="confirmationText">
              Do you want to book (Consultation, Admission)?
            </h2>
          </div>
        </Modal>
      )}
      {isRedirect && (
        <Modal
          visible={isRedirect}
          setVisible={setIsRedirect}
          modalWidth="30vw"
          buttonType="button"
          handleCancelComment={handleCancelComment}
          footer={<></>}
        >
          <div className="text-center">
            {isRedirectBtn && (
              <>
                {isRedirectBtn?.map((btn, i) => (
                  <button
                    key={i}
                    onClick={() => handleNavigate(btn?.PageName, values?.UHID)}
                    className="btn btn-sm btn-info px-3 mx-3"
                  >
                    {t(btn.ButtonDisplayName)}
                  </button>
                ))}
              </>
            )}
          </div>
        </Modal>
      )}
      {modalHandlerState?.show && (
        <Modal
          visible={modalHandlerState?.show}
          setVisible={() =>
            setModalHandlerState({
              show: false,
              component: null,
              size: null,
            })
          }
          modalWidth={modalHandlerState?.size}
          Header={modalHandlerState?.header}
          footer={modalHandlerState?.footer}
        >
          {modalHandlerState?.component}
        </Modal>
      )}
      <Modal
        visible={motherBabyMoldal}
        setVisible={setMotherBabyMoldal}
        modalWidth={"60vw"}
        Header={t("")}
        footer={
          <>
            <button
              className="btn btn-sm btn-success ml-1"
              onClick={() => {
                setBabyTitle("B/O.");
                setMotherBabyMoldal(false);
              }}
            >
              {t("Child Registration")}
            </button>
            <button
              className="btn btn-sm btn-success ml-1"
              onClick={() => setMotherBabyMoldal(!motherBabyMoldal)}
            >
              Cancel
            </button>
          </>
        }
      >
        <AdmitedBabyModal />
      </Modal>
      <DateWiseDocument
        patientId={values?.UHID}
        setDocPreview={setDocPreview}
      />

      {/* Bulk Patient Registration Modal */}
      <Modal
        visible={isBulkRegModal}
        setVisible={setIsBulkRegModal}
        modalWidth="90vw"
        Header={t("Bulk Patient Registration")}
      >
        <BulkPatientRegistration handleClose={() => setIsBulkRegModal(false)} />
      </Modal>
    </>
  );
}
